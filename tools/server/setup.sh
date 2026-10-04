#!/usr/bin/env bash
# Sets up the Hetzner server to serve Det Store Blå (docs/lansering.md G, 04.10.2026): Caddy with HTTPS from Let's Encrypt, a deploy
# user that GitHub Actions uploads to over SSH and that can do nothing but rsync into /srv/detstorebla, a firewall with only SSH, 80
# and 443 open, and automatic security updates. For Ubuntu or Debian. Run once as root, on the server, straight from GitHub:
#
#   curl -fsSL https://raw.githubusercontent.com/average01101010/FishyBusiness-/ccr-5e1ba2f4-pusvyd/tools/server/setup.sh | bash -s detstorebla.no
#
# or from a checkout: bash tools/server/setup.sh detstorebla.no ["ssh-ed25519 AAAA… github-deploy"]
#
# Without a key it makes the deploy key here and prints, at the end, the three values for the repo's Actions secrets (DEPLOY_HOST,
# DEPLOY_KNOWN_HOSTS, DEPLOY_KEY) and the command that deletes the private half afterwards, so the key never passes through a chat.
# It looks before it changes anything: the SSH port(s) stay open in the firewall, it stops if something else holds port 80 or 443,
# it keeps a Caddyfile that is not ours as a .bak, and it leaves the SSH login as it is. Running it again is safe.
set -euo pipefail
DOMAIN=${1:?the domain, e.g. detstorebla.no}; KEY=${2:-}
REF=${DSB_REF:-ccr-5e1ba2f4-pusvyd}; RAW="https://raw.githubusercontent.com/average01101010/FishyBusiness-/$REF/tools/server"
DKEY=/root/dsb-deploy; SITE=/srv/detstorebla
say(){ printf '\n== %s\n' "$*"; }
[ "$(id -u)" = 0 ] || { echo "Run this as root (or with sudo)."; exit 1; }
. /etc/os-release; case "${ID:-}" in ubuntu|debian) ;; *) echo "This script is for Ubuntu or Debian, not ${ID:-unknown}."; exit 1;; esac
export DEBIAN_FRONTEND=noninteractive

# ---------- look first ----------
say "Checking the server"
IP4=$(ip -4 route get 1.1.1.1 2>/dev/null | awk '{for (i = 1; i < NF; i++) if ($i == "src") { print $(i + 1); exit }}' || true)
[ -n "$IP4" ] || IP4=$(hostname -I 2>/dev/null | awk '{print $1}' || true)
IP6=$(ip -6 route get 2606:4700:4700::1111 2>/dev/null | awk '{for (i = 1; i < NF; i++) if ($i == "src") { print $(i + 1); exit }}' || true)
echo "Address: ${IP4:-?}${IP6:+ and $IP6}"
# every port sshd listens on stays open, also with socket activation (ssh.socket on Ubuntu 22.10 and later)
SSHP=$( { echo 22; sshd -T 2>/dev/null | awk '$1 == "port" {print $2}';
          systemctl show ssh.socket -p Listen 2>/dev/null | grep -oE ':[0-9]+ ' | tr -d ': ';
          ss -Htlnp 2>/dev/null | awk '/"sshd"/ {sub(/.*:/, "", $4); print $4}'; } | grep -E '^[0-9]+$' | sort -un | tr '\n' ' ' || true)
echo "SSH ports kept open: $SSHP"
BUSY=$(ss -Htlnp '( sport = :80 or sport = :443 )' 2>/dev/null | grep -v '"caddy"' || true)
if [ -n "$BUSY" ]; then
  echo "Something else uses port 80 or 443, so Caddy cannot take over:"; echo "$BUSY"
  echo "Stop it first (for example: systemctl disable --now nginx apache2), then run this again."; exit 1
fi
KNOWN="80|443|$(echo $SSHP | tr ' ' '|')"
OTHER=$(ss -Htln 2>/dev/null | awk '{print $4}' | grep -vE '^(127\.|\[::1\]|\[::ffff:127\.)' | sed 's/.*://' | sort -un | grep -vxE "$KNOWN" | tr '\n' ' ' || true)
[ -n "$OTHER" ] && echo "Other open ports the firewall will close from outside: $OTHER"
DNS4=$(getent ahostsv4 "$DOMAIN" 2>/dev/null | awk '{print $1; exit}' || true)
if [ "$DNS4" = "$IP4" ]; then echo "$DOMAIN points here."
else echo "Note: $DOMAIN points to ${DNS4:-nothing yet}, not $IP4. Caddy gets the HTTPS certificate by itself once the DNS points here."; fi

# ---------- packages, Caddy ----------
say "Installing Caddy, the firewall and automatic updates"
apt-get update -q
apt-get install -yq debian-keyring debian-archive-keyring apt-transport-https curl gnupg ufw unattended-upgrades rsync openssh-client
if ! command -v caddy >/dev/null; then
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor --yes -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' > /etc/apt/sources.list.d/caddy-stable.list
  apt-get update -q && apt-get install -yq caddy
fi

# ---------- the deploy user: only rsync into /srv/detstorebla (rrsync), no shell, no forwarding ----------
say "The deploy user"
id deploy >/dev/null 2>&1 || adduser --disabled-password --gecos '' deploy
install -d -m 755 -o deploy -g deploy "$SITE" "$SITE/current"
install -d -m 700 -o deploy -g deploy /home/deploy/.ssh
NEWKEY=0
if [ -z "$KEY" ]; then
  if [ -f "$DKEY.pub" ]; then KEY=$(cat "$DKEY.pub")
  elif [ -s /home/deploy/.ssh/authorized_keys ] && [ "${DSB_NEWKEY:-0}" != 1 ]; then
    echo "The deploy user already has a key (the one in GitHub's DEPLOY_KEY), so it is kept. DSB_NEWKEY=1 makes a new one."
  else ssh-keygen -q -t ed25519 -N '' -C "github-deploy@$DOMAIN" -f "$DKEY"; KEY=$(cat "$DKEY.pub"); NEWKEY=1; fi
fi
if [ -n "$KEY" ]; then
  RR=$(command -v rrsync || ls /usr/share/doc/rsync/scripts/rrsync* 2>/dev/null | head -1 || true)
  if [ -n "$RR" ]; then echo "command=\"$RR $SITE\",restrict $KEY" > /home/deploy/.ssh/authorized_keys; else echo "restrict $KEY" > /home/deploy/.ssh/authorized_keys; fi
  chown deploy:deploy /home/deploy/.ssh/authorized_keys; chmod 600 /home/deploy/.ssh/authorized_keys
fi
# a page to show until the first upload from GitHub replaces it
if [ -z "$(ls -A "$SITE/current")" ]; then
  printf '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Det Store Blå</title><body style="margin:0;min-height:100vh;display:grid;place-items:center;background:#07111d;color:#e8f0f8;font:18px system-ui,sans-serif"><p>Det Store Blå kommer snart.</p></body>\n' > "$SITE/current/index.html"
  chown deploy:deploy "$SITE/current/index.html"
fi

# ---------- the site ----------
say "The site"
# next to the script in a checkout, or from the same branch on GitHub when the script came through curl | bash
HERE=${BASH_SOURCE[0]:-}
if [ -n "$HERE" ] && [ -f "$(dirname "$HERE")/Caddyfile" ]; then CF=$(cat "$(dirname "$HERE")/Caddyfile"); else CF=$(curl -fsSL "$RAW/Caddyfile"); fi
if [ -f /etc/caddy/Caddyfile ] && ! grep -q 'Det Store Blå' /etc/caddy/Caddyfile; then cp /etc/caddy/Caddyfile "/etc/caddy/Caddyfile.bak-$(date +%Y%m%d-%H%M%S)"; fi
printf '%s\n' "${CF//@DOMAIN@/$DOMAIN}" > /etc/caddy/Caddyfile
caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile >/dev/null
systemctl enable --now caddy >/dev/null 2>&1 || true
systemctl reload caddy || systemctl restart caddy

# ---------- the firewall and the updates ----------
say "The firewall and automatic updates"
for p in $SSHP; do ufw allow "$p/tcp" >/dev/null; done
ufw allow 80/tcp >/dev/null; ufw allow 443/tcp >/dev/null; ufw --force enable >/dev/null
ufw status | sed -n '1,20p'
dpkg-reconfigure -f noninteractive unattended-upgrades

# ---------- what goes into GitHub ----------
say "Done"
echo "Caddy serves $SITE/current at https://$DOMAIN (a placeholder page until the first upload)."
echo "If the server has a firewall in Hetzner's console (Firewalls), it must let in TCP 80 and 443 too."
if [ -f "$DKEY" ]; then
  [ "$NEWKEY" = 1 ] || echo "(The key was made on an earlier run; if GitHub already has it, nothing needs to change there.)"
  cat <<EOF

Put these three in GitHub: the repository → Settings → Secrets and variables → Actions → New repository secret.

---- Name: DEPLOY_HOST ----
$IP4

---- Name: DEPLOY_KNOWN_HOSTS ----
$(for f in /etc/ssh/ssh_host_ed25519_key.pub /etc/ssh/ssh_host_ecdsa_key.pub /etc/ssh/ssh_host_rsa_key.pub; do [ -f "$f" ] && awk -v h="$IP4,$DOMAIN" '{print h, $1, $2}' "$f"; done)

---- Name: DEPLOY_KEY (all the lines, BEGIN and END too) ----
$(cat "$DKEY")

When all three are saved in GitHub, delete the private key from this server:
  shred -u $DKEY
EOF
fi
