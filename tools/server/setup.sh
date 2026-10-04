#!/usr/bin/env bash
# Sets up the Hetzner server to serve Det Store Blå (docs/lansering.md G, 04.10.2026): Caddy with HTTPS from Let's Encrypt, a deploy
# user that GitHub Actions uploads to over SSH and that can do nothing but rsync into /srv/detstorebla, a firewall with only 22, 80 and
# 443 open, and automatic security updates. For Ubuntu or Debian. Run once as root, after the domain's A/AAAA records point here:
#
#   bash setup.sh detstorebla.no "ssh-ed25519 AAAA… github-deploy"
#
# The key is the public half of a key made only for this (ssh-keygen -t ed25519 -f dsb-deploy -N ''); the private half goes in the
# repo's secret DEPLOY_KEY, the server's address in DEPLOY_HOST, and `ssh-keyscan <address>` in DEPLOY_KNOWN_HOSTS.
set -euo pipefail
DOMAIN=${1:?the domain, e.g. detstorebla.no}; KEY=${2:?the public SSH key of the deploy user}
export DEBIAN_FRONTEND=noninteractive
apt-get update -q
apt-get install -yq debian-keyring debian-archive-keyring apt-transport-https curl gnupg ufw unattended-upgrades rsync
# Caddy from its own repository (https://caddyserver.com/docs/install#debian-ubuntu-raspbian)
if ! command -v caddy >/dev/null; then
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' > /etc/apt/sources.list.d/caddy-stable.list
  apt-get update -q && apt-get install -yq caddy
fi
# the deploy user: only rsync into /srv/detstorebla (rrsync), no shell, no forwarding
id deploy >/dev/null 2>&1 || adduser --disabled-password --gecos '' deploy
install -d -m 755 -o deploy -g deploy /srv/detstorebla /srv/detstorebla/current
RR=$(command -v rrsync || ls /usr/share/doc/rsync/scripts/rrsync* 2>/dev/null | head -1 || true)
install -d -m 700 -o deploy -g deploy /home/deploy/.ssh
if [ -n "$RR" ]; then echo "command=\"$RR /srv/detstorebla\",restrict $KEY" > /home/deploy/.ssh/authorized_keys; else echo "restrict $KEY" > /home/deploy/.ssh/authorized_keys; fi
chown deploy:deploy /home/deploy/.ssh/authorized_keys; chmod 600 /home/deploy/.ssh/authorized_keys
# the site
sed "s/@DOMAIN@/$DOMAIN/g" "$(dirname "$0")/Caddyfile" > /etc/caddy/Caddyfile
caddy validate --config /etc/caddy/Caddyfile && systemctl reload caddy || systemctl restart caddy
# the firewall and the updates
ufw allow OpenSSH; ufw allow 80/tcp; ufw allow 443/tcp; ufw --force enable
dpkg-reconfigure -f noninteractive unattended-upgrades
echo "Done. Caddy serves /srv/detstorebla/current at https://$DOMAIN once the DNS points here."
