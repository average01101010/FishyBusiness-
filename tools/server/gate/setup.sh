#!/usr/bin/env bash
# Sets up a server of its own for the save gate (step 102, 11.11.2026; docs/planer/lagringsporten-hetzner.md, Jonas: «A, flytt
# lagringsporten til Hetzner», «V1 A»): the release job at GitHub uploads the new build here and asks, and this server fetches the
# players' saves, starts each with the build, deletes them and answers go or stop. The saves and the database key never reach GitHub.
# Not the server that serves the game (tools/server/setup.sh): nothing here listens but SSH.
#
# What it makes:
#   deploy      the user GitHub uploads as: rsync into /srv/dsb-gate only (rrsync), no shell. It writes in/, and reads out/
#   dsbgate     the user the gate runs as: no shell, its home /var/lib/dsb-gate (the saves and the work folder, mode 700)
#   /opt/dsb-gate/   gate.py, tools/saves/fetch.py and src/data/cloud.json from the repository, owned by root; a Python venv with
#                    Playwright and its Chromium (the versions the tests use)
#   /etc/dsb-gate.env   the database key, root only. EMPTY until Jonas puts the key in (the command is printed at the end)
#   dsb-gate.path           sees in/ask change, starts dsb-gate.service
#   dsb-gate-fetch.service  the saves in, with the key, running only what is in /opt/dsb-gate
#   dsb-gate.service        after the fetch: the test, with no key and no network but localhost; the saves deleted when it ends
#
# For Ubuntu or Debian. Run as root on the gate's server, straight from GitHub:
#
#   curl -fsSL https://raw.githubusercontent.com/average01101010/FishyBusiness-/ccr-5e1ba2f4-pusvyd/tools/server/gate/setup.sh | bash
#
# or from a checkout: bash tools/server/gate/setup.sh ["ssh-ed25519 AAAA… github-gate"]
# Without a key it makes the upload key here and prints the three values for the repo's Actions secrets (GATE_HOST, GATE_KNOWN_HOSTS,
# GATE_KEY). Running it again is safe: it keeps the key in /etc/dsb-gate.env and the upload key, and installs the files anew (so a
# changed gate.py or fetch.py comes in by running this again).
set -euo pipefail
KEY=${1:-}
REF=${DSB_REF:-ccr-5e1ba2f4-pusvyd}; RAW="https://raw.githubusercontent.com/average01101010/FishyBusiness-/$REF"
PW=1.63.0   # the Playwright the tests use (CLAUDE.md «Tester»); its Chromium is what the gate at GitHub ran
DKEY=/root/dsb-gate-deploy; SITE=/srv/dsb-gate; OPT=/opt/dsb-gate; VAR=/var/lib/dsb-gate; ENVF=/etc/dsb-gate.env
say(){ printf '\n== %s\n' "$*"; }
[ "$(id -u)" = 0 ] || { echo "Run this as root (or with sudo)."; exit 1; }
. /etc/os-release; case "${ID:-}" in ubuntu|debian) ;; *) echo "This script is for Ubuntu or Debian, not ${ID:-unknown}."; exit 1;; esac
export DEBIAN_FRONTEND=noninteractive

say "Checking the server"
IP4=$(ip -4 route get 1.1.1.1 2>/dev/null | awk '{for (i = 1; i < NF; i++) if ($i == "src") { print $(i + 1); exit }}' || true)
[ -n "$IP4" ] || IP4=$(hostname -I 2>/dev/null | awk '{print $1}' || true)
echo "Address: ${IP4:-?}"
# every port sshd listens on stays open, also with socket activation (as tools/server/setup.sh)
SSHP=$( { echo 22; sshd -T 2>/dev/null | awk '$1 == "port" {print $2}';
          systemctl show ssh.socket -p Listen 2>/dev/null | grep -oE ':[0-9]+ ' | tr -d ': ';
          ss -Htlnp 2>/dev/null | awk '/"sshd"/ {sub(/.*:/, "", $4); print $4}'; } | grep -E '^[0-9]+$' | sort -un | tr '\n' ' ' || true)
echo "SSH ports kept open: $SSHP"
if [ -d /srv/detstorebla/current ]; then
  echo "Note: this server also serves the game (/srv/detstorebla). The gate is meant for a server of its own (V1 A); it will work here,"
  echo "but the database key then lies on the machine the whole net reaches."
fi

say "Installing rsync, Python, the firewall and automatic updates"
apt-get update -q
apt-get install -yq curl rsync openssh-client ufw unattended-upgrades python3 python3-venv

# ---------- the upload user: only rsync into /srv/dsb-gate (rrsync), no shell, no forwarding ----------
say "The upload user"
id deploy >/dev/null 2>&1 || adduser --disabled-password --gecos '' deploy
id dsbgate >/dev/null 2>&1 || adduser --system --group --home "$VAR" --no-create-home --shell /usr/sbin/nologin dsbgate
install -d -m 755 -o root -g root "$SITE"
install -d -m 755 -o deploy -g deploy "$SITE/in"
install -d -m 755 -o dsbgate -g dsbgate "$SITE/out"
install -d -m 700 -o dsbgate -g dsbgate "$VAR"
install -d -m 700 -o deploy -g deploy /home/deploy/.ssh
NEWKEY=0
if [ -z "$KEY" ]; then
  if [ -f "$DKEY.pub" ]; then KEY=$(cat "$DKEY.pub")
  elif [ -s /home/deploy/.ssh/authorized_keys ] && [ "${DSB_NEWKEY:-0}" != 1 ]; then
    echo "The upload user already has a key (the one in GitHub's GATE_KEY), so it is kept. DSB_NEWKEY=1 makes a new one."
  else ssh-keygen -q -t ed25519 -N '' -C "github-gate" -f "$DKEY"; KEY=$(cat "$DKEY.pub"); NEWKEY=1; fi
fi
if [ -n "$KEY" ]; then
  RR=$(command -v rrsync || ls /usr/share/doc/rsync/scripts/rrsync* 2>/dev/null | head -1 || true)
  # without rrsync the upload key would get a shell on the server: stop instead
  if [ -z "$RR" ]; then echo "rrsync was not found (it comes with rsync; on older Ubuntu: /usr/share/doc/rsync/scripts/rrsync). Install it and run this again." >&2; exit 1; fi
  echo "command=\"$RR $SITE\",restrict $KEY" > /home/deploy/.ssh/authorized_keys
  chown deploy:deploy /home/deploy/.ssh/authorized_keys; chmod 600 /home/deploy/.ssh/authorized_keys
fi

# ---------- the gate's own files, from the repository, owned by root: what runs with the database key is never uploaded by the job ----------
say "The gate's files"
install -d -m 755 "$OPT" "$OPT/tools/saves" "$OPT/src/data"
HERE=${BASH_SOURCE[0]:-}; ROOT=
if [ -n "$HERE" ] && [ -f "$(dirname "$HERE")/gate.py" ]; then ROOT=$(cd "$(dirname "$HERE")/../../.." && pwd); fi
get(){   # get <path in the repository> <where>: from the checkout beside this script, else from the same branch on GitHub
  local tmp; tmp=$(mktemp)
  if [ -n "$ROOT" ] && [ -f "$ROOT/$1" ]; then cp "$ROOT/$1" "$tmp"; else curl -fsSL "$RAW/$1" -o "$tmp"; fi
  [ -s "$tmp" ] || { echo "Could not get $1" >&2; exit 1; }
  install -m 644 -o root -g root "$tmp" "$2"; rm -f "$tmp"
}
get tools/server/gate/gate.py "$OPT/gate.py"
get tools/saves/fetch.py "$OPT/tools/saves/fetch.py"
get src/data/cloud.json "$OPT/src/data/cloud.json"
python3 -m py_compile "$OPT/gate.py" "$OPT/tools/saves/fetch.py"
echo "The database the gate reads: $(python3 -c "import json; print(json.load(open('$OPT/src/data/cloud.json'))['supabaseUrl'])")"

say "Playwright $PW and its Chromium (a few minutes the first time)"
[ -x "$OPT/venv/bin/python" ] || python3 -m venv "$OPT/venv"
"$OPT/venv/bin/pip" install -q --upgrade pip
"$OPT/venv/bin/pip" install -q "playwright==$PW"
PLAYWRIGHT_BROWSERS_PATH="$OPT/browsers" "$OPT/venv/bin/python" -m playwright install --with-deps chromium
chmod -R a+rX "$OPT/browsers"

# ---------- the database key: a file only root reads, empty until Jonas fills it ----------
if [ ! -f "$ENVF" ]; then (umask 077; printf 'SUPABASE_SERVICE_ROLE_KEY=\n' > "$ENVF"); fi
chown root:root "$ENVF"; chmod 600 "$ENVF"

# ---------- the services ----------
say "The services"
cat > /etc/systemd/system/dsb-gate-fetch.service <<EOF
[Unit]
Description=Det Store Blå: the save gate fetches the players' saves (only the installed code, with the database key)
After=network-online.target
Wants=network-online.target

[Service]
Type=oneshot
User=dsbgate
Group=dsbgate
EnvironmentFile=$ENVF
Environment=HOME=$VAR
ExecStart=$OPT/venv/bin/python $OPT/gate.py fetch
TimeoutStartSec=900
UMask=0077
NoNewPrivileges=yes
PrivateTmp=yes
ProtectSystem=strict
ProtectHome=yes
ReadWritePaths=$VAR $SITE/out
EOF
# the test runs what the job uploaded (tests/savestest.py and the build): no key in its environment (the fetch has ended, and the
# key is in no file this user reads) and no network but localhost, so nothing it is given can send a save anywhere
cat > /etc/systemd/system/dsb-gate.service <<EOF
[Unit]
Description=Det Store Blå: the save gate starts every save with the uploaded build
Requires=dsb-gate-fetch.service
After=dsb-gate-fetch.service

[Service]
Type=oneshot
User=dsbgate
Group=dsbgate
Environment=HOME=$VAR
Environment=PLAYWRIGHT_BROWSERS_PATH=$OPT/browsers
ExecStart=$OPT/venv/bin/python $OPT/gate.py test
ExecStopPost=$OPT/venv/bin/python $OPT/gate.py clean
TimeoutStartSec=3300
UMask=0077
Nice=5
PrivateNetwork=yes
NoNewPrivileges=yes
PrivateTmp=yes
ProtectHome=yes
EOF
# GitHub uploads in/ask last: then the gate starts
cat > /etc/systemd/system/dsb-gate.path <<EOF
[Unit]
Description=Det Store Blå: start the save gate when the release job has asked

[Path]
PathChanged=$SITE/in/ask
Unit=dsb-gate.service

[Install]
WantedBy=multi-user.target
EOF
systemctl daemon-reload
systemctl enable dsb-gate.path >/dev/null 2>&1
systemctl restart dsb-gate.path
# a save left by a run that was cut (a reboot in the middle) does not lie until the next release
runuser -u dsbgate -- "$OPT/venv/bin/python" "$OPT/gate.py" clean 2>/dev/null || true

say "The firewall and automatic updates"
for p in $SSHP; do ufw allow "$p/tcp" >/dev/null; done
ufw --force enable >/dev/null
ufw status | sed -n '1,12p'
dpkg-reconfigure -f noninteractive unattended-upgrades

# ---------- a try of the browser, as the gate's user and without network, on the fixture's new player ----------
say "Trying Chromium as the gate's user"
T=$(mktemp -d); chmod 755 "$T"
cat > "$T/try.py" <<'EOF'
import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        br = await p.chromium.launch(args=['--disable-gpu-compositing']); pg = await br.new_page()
        await pg.set_content('<canvas id=c></canvas>'); gl = await pg.evaluate("!!document.getElementById('c').getContext('webgl2')")
        print('Chromium starts, WebGL 2:', gl); await br.close()
asyncio.run(main())
EOF
if systemd-run --quiet --wait --pipe -p User=dsbgate -p PrivateNetwork=yes -p Environment=HOME=$VAR -p Environment=PLAYWRIGHT_BROWSERS_PATH=$OPT/browsers "$OPT/venv/bin/python" "$T/try.py"; then :
else echo "Chromium did not start as the gate's user. The gate will say stop until it does: send this output to the session."; fi
rm -rf "$T"

say "Done"
echo "The gate waits for the release job: systemctl status dsb-gate.path, journalctl -u dsb-gate -u dsb-gate-fetch, cat $SITE/out/log.txt"
if grep -q '^SUPABASE_SERVICE_ROLE_KEY=.\+' "$ENVF"; then echo "The database key is in $ENVF from before."
else cat <<EOF

1. The database key. It is not here yet, and the gate says stop without it. Put it in with this command: it asks for the key without
   showing it and writes it to $ENVF (root only). The key is Supabase -> Project Settings -> API keys -> service_role (the
   production project). Do not paste it into a chat, a file or the repo.

   read -rsp 'service_role key: ' K && printf 'SUPABASE_SERVICE_ROLE_KEY=%s\n' "\$K" > $ENVF && chmod 600 $ENVF && unset K && echo ' saved'

EOF
fi
if [ -f "$DKEY" ]; then
  [ "$NEWKEY" = 1 ] || echo "(The upload key was made on an earlier run; if GitHub already has it, nothing needs to change there.)"
  cat <<EOF
2. Put these three in GitHub: the repository -> Settings -> Secrets and variables -> Actions -> New repository secret.

---- Name: GATE_HOST ----
$IP4

---- Name: GATE_KNOWN_HOSTS ----
$(for f in /etc/ssh/ssh_host_ed25519_key.pub /etc/ssh/ssh_host_ecdsa_key.pub /etc/ssh/ssh_host_rsa_key.pub; do [ -f "$f" ] && awk -v h="$IP4" '{print h, $1, $2}' "$f"; done)

---- Name: GATE_KEY (all the lines, BEGIN and END too) ----
$(cat "$DKEY")

When all three are saved in GitHub, delete the private key from this server:
  shred -u $DKEY

3. When a release has gone through this gate, delete the secret SUPABASE_SERVICE_ROLE_KEY from GitHub: the job no longer reads it.
EOF
fi
