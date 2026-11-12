# The national map data kept as a release (.github/workflows/kart.yml builds it, tag kart-<run number>): the one
# tools/map/kart-release.json names (from H1b R2, 03.11.2026: a release with a new layout reaches a build only once the code that reads
# it names it; not in kart.json, whose every change starts kart.yml),
# else the newest kart- tag (git ls-remote), or the one named on the command line; its packs fetched from GitHub and unpacked into tools/map/out/release/<tag>/: game/ (the game's
# format, from kart-2) or lite/ (kart-1's K5 format). tools/map/game.py joins game/ with src/data/map for the build. The newest
# sjomerker- release (the sea marks, pinned as "sjomerker" there too) comes along into out/release/sjomerker-<n>/sjomerker.json.
#   python3 tools/map/release.py [tag]
import os, re, sys, json, tarfile, subprocess, requests
REPO = os.environ.get('KYST_REPO', 'average01101010/FishyBusiness-')
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'out', 'release')
PIN = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'kart-release.json')
def pinned(key='release', pre='kart'):
    return (json.load(open(PIN)).get(key) if os.path.exists(PIN) else None) or newest(pre)
def newest(pre='kart'):
    r = subprocess.run(['git', 'ls-remote', '--tags', 'origin', pre + '-*'], capture_output=True, text=True, check=True).stdout
    tags = sorted({int(m) for m in re.findall(r'refs/tags/' + pre + r'-(\d+)$', r, re.M)})
    return f'{pre}-{tags[-1]}' if tags else None
# the sea marks along the coast (sjomerker.yml, tools/map/sjomerker.py): the sjomerker- release kart-release.json pins ("sjomerker",
# Ø13 K3: a release with new kinds of mark reaches a build only once the code that draws them names it; going back is one line), else
# the newest; its sjomerker.json into out/release/<tag>/, where game.py finds it; None when there is none yet
def marks_tag(): return pinned('sjomerker', 'sjomerker')
def marks():
    tag = marks_tag()
    if not tag: return None
    d = os.path.join(OUT, tag); f = os.path.join(d, 'sjomerker.json')
    if not os.path.exists(f):
        os.makedirs(d, exist_ok=True)
        r = requests.get(f'https://github.com/{REPO}/releases/download/{tag}/sjomerker.json.gz', timeout=600); r.raise_for_status()
        import gzip; open(f + '.part', 'wb').write(gzip.decompress(r.content)); os.replace(f + '.part', f)
    return f
# the wide frame's data (tools/map/ramme.py build, from H1b R2): kart-ramme.tar.gz unpacked to out/release/<tag>/ramme, or None when
# the release has none
def fetch_ramme(tag):
    d = os.path.join(OUT, tag); os.makedirs(d, exist_ok=True); f = os.path.join(d, 'kart-ramme.tar.gz')
    if not os.path.exists(os.path.join(d, 'ramme', 'manifest.json')):
        if not os.path.exists(f):
            r = requests.get(f'https://github.com/{REPO}/releases/download/{tag}/kart-ramme.tar.gz', timeout=600, stream=True)
            if r.status_code == 404: return None
            r.raise_for_status()
            with open(f + '.part', 'wb') as o:
                for c in r.iter_content(1 << 20): o.write(c)
            os.replace(f + '.part', f)
        with tarfile.open(f) as t: t.extractall(d, filter='data')
    return os.path.join(d, 'ramme')
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
    tag = sys.argv[1] if len(sys.argv) > 1 else pinned()
    if not tag: sys.exit('no kart- release yet')
    dd = fetch(tag); man = json.load(open(os.path.join(dd, 'manifest.json'))); mk = marks(); rd = fetch_ramme(tag)
    print(json.dumps({'tag': tag, 'dir': dd, 'packs': len(man['packs']), 'mb': round(sum(p['bytes'] for p in man['packs']) / 1e6, 1), 'marks': mk, 'ramme': rd}))
