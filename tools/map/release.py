# The national map data kept as a release (.github/workflows/kart.yml builds it, tag kart-<run number>): the newest kart- tag
# (git ls-remote, or the one named), its kart-lite.tar.gz fetched from GitHub and unpacked into tools/map/out/release/<tag>/lite,
# where a build can take its packs from.
#   python3 tools/map/release.py [tag]
import os, re, sys, json, tarfile, subprocess, requests
REPO = os.environ.get('KYST_REPO', 'average01101010/FishyBusiness-')
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'out', 'release')
def newest():
    r = subprocess.run(['git', 'ls-remote', '--tags', 'origin', 'kart-*'], capture_output=True, text=True, check=True).stdout
    tags = sorted({int(m) for m in re.findall(r'refs/tags/kart-(\d+)$', r, re.M)})
    return f'kart-{tags[-1]}' if tags else None
if __name__ == '__main__':
    tag = sys.argv[1] if len(sys.argv) > 1 else newest()
    if not tag: sys.exit('no kart- release yet')
    d = os.path.join(OUT, tag); os.makedirs(d, exist_ok=True); f = os.path.join(d, 'kart-lite.tar.gz')
    if not os.path.exists(f):
        r = requests.get(f'https://github.com/{REPO}/releases/download/{tag}/kart-lite.tar.gz', timeout=600, stream=True); r.raise_for_status()
        with open(f + '.part', 'wb') as o:
            for c in r.iter_content(1 << 20): o.write(c)
        os.replace(f + '.part', f)
    with tarfile.open(f) as t: t.extractall(d, filter='data')
    man = json.load(open(os.path.join(d, 'lite', 'manifest.json')))
    print(json.dumps({'tag': tag, 'dir': os.path.join(d, 'lite'), 'packs': len(man['packs']), 'mb': round(sum(p['bytes'] for p in man['packs']) / 1e6, 1)}))
