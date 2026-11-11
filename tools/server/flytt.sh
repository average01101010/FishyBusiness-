#!/usr/bin/env bash
# Moves the game from one server to another (Jonas 11.11.2026: the game and the relay to the larger server, the save gate to the
# smaller one, «få det gjort først som sist»). Run as root on the NEW server, with the old one still serving the players:
#
#   ssh -A root@<the new server>          (-A lends this login your key, so the new server can read from the old one)
#   curl -fsSL https://raw.githubusercontent.com/average01101010/FishyBusiness-/ccr-5e1ba2f4-pusvyd/tools/server/flytt.sh -o flytt.sh
#   bash flytt.sh detstorebla.no <the old server's address>
#
# What it does, in this order, and nothing on the old server is changed (it is only read):
#   1. takes the save gate off this server if it is here (its services, its files and the database key): the gate gets a server of its
#      own afterwards (tools/server/gate/setup.sh), and the key must not lie on the machine that serves the game
#   2. reads from the old server: the upload key GitHub already has (so DEPLOY_KEY stays as it is), the relay's secret (the database
#      has the same in Vault, so it must be the same here), the site (current/, test/, rt/) and Caddy's certificates (so HTTPS works
#      here from the first request after the DNS is moved, without waiting for new ones)
#   3. runs tools/server/setup.sh here with that key: Caddy, the firewall, the relay's service
#   4. tries the site and the relay here, asked for by name but answered by this machine
#   5. prints what Jonas does next: the DNS, and two secrets in GitHub
# Running it again is safe. It stops before it changes anything if it cannot read from the old server.
set -euo pipefail
DOMAIN=${1:?the domain, e.g. detstorebla.no}; OLD=${2:?the address of the old server}
REF=${DSB_REF:-ccr-5e1ba2f4-pusvyd}; RAW="https://raw.githubusercontent.com/average01101010/FishyBusiness-/$REF/tools/server"
SITE=/srv/detstorebla; CERTS=/var/lib/caddy/.local/share/caddy
say(){ printf '\n== %s\n' "$*"; }
[ "$(id -u)" = 0 ] || { echo "Run this as root on the new server."; exit 1; }
IP4=$(ip -4 route get 1.1.1.1 2>/dev/null | awk '{for (i = 1; i < NF; i++) if ($i == "src") { print $(i + 1); exit }}' || true)
[ "$OLD" != "$IP4" ] || { echo "$OLD is this server. Run this on the new server, with the old one's address."; exit 1; }
export DEBIAN_FRONTEND=noninteractive
command -v rsync >/dev/null || { apt-get update -q; apt-get install -yq rsync; }

# one login to the old server for all of it (a password is asked for once, or the key lent with ssh -A is used)
# ssh -n on every command: this script may come through «curl | bash», and ssh would else read the rest of it as its input
# (11.11.2026: it stopped silently after the first ssh). rsync gives its ssh its own input, so -e "\$SSH" stays without -n
say "Reading from the old server ($OLD)"
CM=$(mktemp -d); SSH="ssh -o ControlMaster=auto -o ControlPath=$CM/s -o ControlPersist=600 -o StrictHostKeyChecking=accept-new"
trap 'ssh -o ControlPath=$CM/s -O exit root@$OLD 2>/dev/null || true; rm -rf "$CM"' EXIT
if ! $SSH -n "root@$OLD" true; then
  echo "Could not log in to root@$OLD from here. Log in to this server with «ssh -A root@$IP4» from the machine you reach the old one from,"
  echo "and run this again. Nothing was changed."; exit 1
fi
$SSH -n "root@$OLD" "test -s $SITE/current/index.html && test -s /etc/dsb-rt.env && test -s /home/deploy/.ssh/authorized_keys" \
  || { echo "The old server does not look like the game's (no $SITE/current, relay secret or upload key). Nothing was changed."; exit 1; }
echo "The old server has: $($SSH -n "root@$OLD" "cut -c1-80 $SITE/current/version.json" 2>/dev/null || echo '?')"
PUB=$($SSH -n "root@$OLD" "cat /home/deploy/.ssh/authorized_keys" | sed -n 's/^.*\(ssh-[a-z0-9-]* [A-Za-z0-9+\/=]* *[^ ]*\) *$/\1/p' | head -1)
case "$PUB" in ssh-*) ;; *) echo "Could not read the upload key from the old server. Nothing was changed."; exit 1;; esac

# ---------- 1. the save gate off this server ----------
if [ -e /etc/dsb-gate.env ] || [ -d /srv/dsb-gate ] || [ -d /opt/dsb-gate ]; then
  say "Taking the save gate off this server (it gets a server of its own)"
  systemctl disable --now dsb-gate.path >/dev/null 2>&1 || true
  systemctl stop dsb-gate.service dsb-gate-fetch.service >/dev/null 2>&1 || true
  rm -f /etc/systemd/system/dsb-gate.path /etc/systemd/system/dsb-gate.service /etc/systemd/system/dsb-gate-fetch.service
  systemctl daemon-reload
  [ -f /etc/dsb-gate.env ] && shred -u /etc/dsb-gate.env
  rm -rf /srv/dsb-gate /opt/dsb-gate /var/lib/dsb-gate /root/dsb-gate-deploy /root/dsb-gate-deploy.pub
  rm -f /home/deploy/.ssh/authorized_keys   # the gate's upload key: setup.sh below writes the game's in its place
  echo "The gate, its files and the database key are gone from this server."
fi

# ---------- 2. the relay's secret, before setup.sh would make a new one ----------
say "The relay's secret (the same as the database has)"
$SSH -n "root@$OLD" "cat /etc/dsb-rt.env" > /etc/dsb-rt.env.new
grep -qE '^RT_SECRET=[0-9a-f]{64}' /etc/dsb-rt.env.new || { rm -f /etc/dsb-rt.env.new; echo "The relay's secret on the old server is not as expected. Stopped."; exit 1; }
chmod 600 /etc/dsb-rt.env.new; chown root:root /etc/dsb-rt.env.new; mv /etc/dsb-rt.env.new /etc/dsb-rt.env

# ---------- 3. the server set up as the game's, with the upload key GitHub has ----------
say "Setting this server up as the game's (tools/server/setup.sh)"
curl -fsSL "$RAW/setup.sh" -o "$CM/setup.sh"
DSB_REF=$REF bash "$CM/setup.sh" "$DOMAIN" "$PUB" > "$CM/setup.log" 2>&1 || { tail -30 "$CM/setup.log"; echo "setup.sh stopped (its last lines are above). The old server is untouched."; exit 1; }
grep -E '^(Address|Node|The relay|== )' "$CM/setup.log" || true

# ---------- the site and the certificates ----------
say "Copying the site (current, test and the relay)"
for d in current test rt; do rsync -a --delete -e "$SSH" "root@$OLD:$SITE/$d/" "$SITE/$d/"; done
chown -R deploy:deploy "$SITE/current" "$SITE/test" "$SITE/rt"
say "Copying the HTTPS certificates"
if $SSH -n "root@$OLD" "test -d $CERTS"; then
  systemctl stop caddy
  install -d -m 700 -o caddy -g caddy "$CERTS"
  rsync -a --delete -e "$SSH" "root@$OLD:$CERTS/" "$CERTS/"
  chown -R caddy:caddy /var/lib/caddy
  systemctl start caddy
else echo "No certificates found on the old server: Caddy gets new ones by itself once the DNS points here (a minute or so)."; fi
systemctl restart dsb-rt.service; sleep 2

# ---------- 4. a try, by name but answered here ----------
say "Trying this server"
ok=1
V=$(curl -fsS --max-time 15 --resolve "$DOMAIN:443:127.0.0.1" "https://$DOMAIN/version.json" 2>&1) && echo "https://$DOMAIN/version.json here: $(printf '%s' "$V" | cut -c1-80)" \
  || { ok=0; echo "FAILED: the site does not answer here over HTTPS: $V"; }
T=$(curl -fsS --max-time 15 --resolve "test.$DOMAIN:443:127.0.0.1" "https://test.$DOMAIN/version.json" 2>&1) && echo "https://test.$DOMAIN/version.json here: $(printf '%s' "$T" | cut -c1-80)" \
  || { ok=0; echo "FAILED: the test edition does not answer here: $T"; }
R=$(curl -s -o /dev/null -w '%{http_code}' --max-time 15 --resolve "$DOMAIN:443:127.0.0.1" "https://$DOMAIN/rt" || true)
[ "$R" = 404 ] && echo "The relay answers here (404 without a ticket, as it should)." || { ok=0; echo "FAILED: the relay answered $R, not 404: systemctl status dsb-rt"; }
if [ "$ok" != 1 ]; then echo; echo "Something did not answer. DO NOT move the DNS. The old server still serves the players. Send this output to the session."; exit 1; fi

# ---------- 5. what comes next ----------
say "This server is ready. The players are still on the old one."
cat <<EOF
1. Move the DNS (Webhuset): the A records for $DOMAIN, www.$DOMAIN (if there is one) and test.$DOMAIN from $OLD to $IP4.
   Both servers serve the same game while the change spreads, so nobody is cut off.

2. Change two secrets in GitHub (Settings -> Secrets and variables -> Actions). DEPLOY_KEY stays as it is.

---- Name: DEPLOY_HOST ----
$IP4

---- Name: DEPLOY_KNOWN_HOSTS ----
$(for f in /etc/ssh/ssh_host_ed25519_key.pub /etc/ssh/ssh_host_ecdsa_key.pub /etc/ssh/ssh_host_rsa_key.pub; do [ -f "$f" ] && awk -v h="$IP4,$DOMAIN" '{print h, $1, $2}' "$f"; done)

3. Tell the session. The old server is left as it is until then.
EOF
