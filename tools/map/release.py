# The national map data kept as a release (.github/workflows/kart.yml builds it, tag kart-<run number>): the newest kart- tag
# (git ls-remote, or the one named), its packs fetched from GitHub and unpacked into tools/map/out/release/<tag>/: game/ (the game's
# format, from kart-2) or lite/ (kart-1's K5 format). tools/map/game.py joins game/ with src/data/map for the build. The newest
# sjomerker- release (the sea marks) comes along into out/release/sjomerker-<n>/sjomerker.json.
#   python3 tools/map/release.py [tag]
import os, re, sys, json, tarfile, subprocess, requests
REPO = os.environ.get('KYST_REPO', 'average01101010/FishyBusiness-')
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'out', 'release')
def newest(pre='kart'):
    r = subprocess.run(['git', 'ls-remote', '--tags', 'origin', pre + '-*'], capture_output=True, text=True, check=True).stdout
    tags = sorted({int(m) for m in re.findall(r'refs/tags/' + pre + r'-(\d+)$', r, re.M)})
    return f'{pre}-{tags[-1]}' if tags else None
# the sea marks along the coast (sjomerker.yml, tools/map/sjomerker.py): the newest sjomerker- release's sjomerker.json into
# out/release/<tag>/, where game.py finds it; None when there is none yet
def marks():
    tag = newest('sjomerker')
    if not tag: return None
    d = os.path.join(OUT, tag); f = os.path.join(d, 'sjomerker.json')
    if not os.path.exists(f):
        os.makedirs(d, exist_ok=True)
        r = requests.get(f'https://github.com/{REPO}/releases/download/{tag}/sjomerker.json.gz', timeout=600); r.raise_for_status()
        import gzip; open(f + '.part', 'wb').write(gzip.decompress(r.content)); os.replace(f + '.part', f)
    return f
def fetch(tag):
    d = os.path.join(OUT, tag); os.makedirs(d, exist_ok=True)
    for name in ('game', 'lite'):
        f = os.path.join(d, f'kart-{name}.tar.gz')
        if not os.path.exists(f):
            r = requests.get(f'https://github.com/{REPO}/releases/download/{tag}/kart-{name}.tar.gz', timeout=600, stream=True)
            if r.status_code == 404: continue
            r.raise_for_status()
            with open(f + '.part', 'wb') as o:
                for c in r.iter_content(1 << 20): o.write(c)
            os.replace(f + '.part', f)
        if not os.path.exists(os.path.join(d, name, 'manifest.json')):
            with tarfile.open(f) as t: t.extractall(d, filter='data')
        return os.path.join(d, name)
    sys.exit(f'{tag} has no kart-game.tar.gz or kart-lite.tar.gz')
if __name__ == '__main__':
    tag = sys.argv[1] if len(sys.argv) > 1 else newest()
    if not tag: sys.exit('no kart- release yet')
    dd = fetch(tag); man = json.load(open(os.path.join(dd, 'manifest.json'))); mk = marks()
    print(json.dumps({'tag': tag, 'dir': dd, 'packs': len(man['packs']), 'mb': round(sum(p['bytes'] for p in man['packs']) / 1e6, 1), 'marks': mk}))
