# The whole coast's map packs for the build (tools/map/out/game/, which build.mjs takes when it is there): the core and the far
# heights from src/data/map (region.py), Senja's tiles from there too, and every other tile's 'sim', 'view' and 'chart' from a release
# (and every tile's 'vec', the buildings, roads, bridges, piers and quays, which src does not have), with the sea marks along the coast
# (sjomerker.py, fetched by release.py) in each tile's chart pack
# in the game's format (coast.py game, fetched by release.py). The small packs are joined so the artifact stays under its 511 files a
# version: the far heights 4 x 4 tiles a file, the chart 2 x 2. A joined pack lists its tiles ('tiles' in the manifest), and the loader
# (01b-mapdata.js) files it under each of them.
#   python3 tools/map/game.py [release dir] [out]
import os, sys, json, hashlib, shutil, zlib
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))
SRC = os.path.join(ROOT, 'src', 'data', 'map')
GROUP = {'far': 4, 'chart': 2}   # tiles a side per joined pack

def read(d, pk):
    data = open(os.path.join(d, pk['file']), 'rb').read(); assert data[:4] == b'KMP1', pk['file']
    hl = int.from_bytes(data[4:8], 'little'); head = json.loads(data[8:8 + hl]); return head, data[8 + hl:]

def write(out, kind, name, parts):
    off, blocks, body = 0, [], []
    for head, rest in parts:
        for l, bx, by, o, ln, *cnt in head['blocks']: blocks.append([l, bx, by, off, ln] + cnt); body.append(rest[o:o + ln]); off += ln
    head = {'kind': kind, 'tile': parts[0][0]['tile'], 'blocks': blocks}; hj = json.dumps(head, separators=(',', ':')).encode()
    data = b'KMP1' + len(hj).to_bytes(4, 'little') + hj + b''.join(body); h = hashlib.sha256(data).hexdigest()[:12]
    fn = f'{kind}-{name}-{h}.wasm'; open(os.path.join(out, fn), 'wb').write(data); return fn, h, len(data)

# the sea marks (release.py marks(), the newest out/release/sjomerker-*/sjomerker.json) per tile {(tx, ty): {lights, marks, rocks}}
def marks_by_tile(T):
    import glob, re
    fs = sorted(glob.glob(os.path.join(HERE, 'out', 'release', 'sjomerker-*', 'sjomerker.json')), key=lambda f: int(re.search(r'sjomerker-(\d+)', f).group(1)))
    if not fs: return {}
    d = json.load(open(fs[-1])); out = {}
    for k in ('lights', 'marks', 'rocks'):
        for q in d[k]: out.setdefault((int(q[0] // T), int(q[1] // T)), {'lights': [], 'marks': [], 'rocks': []})[k].append(q)
    print(json.dumps({'marks': fs[-1], 'tiles': len(out), 'lights': len(d['lights']), 'marks_n': len(d['marks']), 'rocks': len(d['rocks'])}))
    return out

def main(rel, out):
    src = json.load(open(os.path.join(SRC, 'manifest.json'))); nat = json.load(open(os.path.join(rel, 'manifest.json')))
    assert nat.get('profile') == 'game', rel + ' is not in the game format (coast.py game, from kart-2)'
    T = src['tile']; assert nat['tile'] == T and nat['block'] == src['block'] and nat['frame'] == src['frame']
    if os.path.exists(out): shutil.rmtree(out)
    os.makedirs(out)
    # the layers: the tiles' rasters over the whole frame (the release's extents), the rest as src has them; the cells must agree
    layers = dict(src['layers'])
    for name, L in nat['layers'].items():
        if name in layers:
            a = layers[name]; assert all(a[k] == L[k] for k in ('c', 'n', 'type', 'kind', 'dec')), name
        layers[name] = L
    # per kind and tile: Senja's own (src) first, then the release's for the tiles src does not have. Senja's region does not cover
    # its tiles whole (y from 310 km, the tiles from 300), so a tile both have is joined block by block, Senja's blocks first
    have = {}
    for d, man in ((SRC, src), (rel, nat)):
        for pk in man['packs']:
            if pk['kind'] == 'core' and d != SRC: continue
            have.setdefault((pk['kind'], tuple(pk['tile'])), []).append((d, pk))
    packs, groups = [], {}
    for (kind, t), srcs in sorted(have.items()):
        g = GROUP.get(kind)
        if g: groups.setdefault((kind, t[0] // g, t[1] // g), []).append((t, srcs[0][0], srcs[0][1])); continue
        if len(srcs) == 1:
            d, pk = srcs[0]; shutil.copyfile(os.path.join(d, pk['file']), os.path.join(out, pk['file'])); packs.append(dict(pk)); continue
        (d0, p0), (d1, p1) = srcs; h0, r0 = read(d0, p0); h1, r1 = read(d1, p1); own = {(b[0], b[1], b[2]) for b in h0['blocks']}
        h1 = dict(h1, blocks=[b for b in h1['blocks'] if (b[0], b[1], b[2]) not in own])
        fn, h, n = write(out, kind, f'{t[0]}-{t[1]}', [(h0, r0), (h1, r1)])
        packs.append(dict(p0, file=fn, hash=h, bytes=n))
    MK = marks_by_tile(T)
    for (kind, gx, gy), mem in sorted(groups.items()):
        mem.sort(); parts = [read(d, pk) for t, d, pk in mem]
        if kind == 'chart' and MK:   # each tile's sea marks as its 'marks' entry (one JSON, raw deflate, at the tile's first block)
            B = T // nat['block']
            for t, d, pk in mem:
                j = MK.get(tuple(t))
                if not j: continue
                z = zlib.compressobj(9, zlib.DEFLATED, -15); b = z.compress(json.dumps(j, separators=(',', ':'), ensure_ascii=False).encode()) + z.flush()
                parts.append(({'tile': list(t), 'blocks': [['marks', t[0] * B, t[1] * B, 0, len(b), len(j['lights']) + len(j['marks']) + len(j['rocks'])]]}, b))
        fn, h, n = write(out, kind, f'g{gx}-{gy}', parts)
        tl = [list(t) for t, d, pk in mem]; xs = [t[0] for t in tl]; ys = [t[1] for t in tl]
        packs.append(dict(file=fn, hash=h, kind=kind, tile=tl[0], tiles=tl, box=[min(xs) * T, min(ys) * T, (max(xs) + 1) * T, (max(ys) + 1) * T], bytes=n))
    packs.sort(key=lambda p: p['file'])
    tiles = sorted({tuple(p['tile']) for p in packs if p['kind'] == 'sim'})
    man = dict(v=2, frame=src['frame'], block=src['block'], tile=T, layers=layers, packs=packs, tiles=[list(t) for t in tiles],
               src='tools/map/game.py: src/data/map (' + src.get('src', '') + ') and ' + nat.get('src', rel))
    json.dump(man, open(os.path.join(out, 'manifest.json'), 'w'), separators=(',', ':'))
    kinds = {}
    for p in packs: kinds.setdefault(p['kind'], [0, 0]); kinds[p['kind']][0] += 1; kinds[p['kind']][1] += p['bytes']
    print(json.dumps({'out': out, 'files': len(packs) + 1, 'mb': round(sum(p['bytes'] for p in packs) / 1e6, 1), 'tiles': len(tiles),
                      'kinds': {k: [n, round(b / 1e6, 1)] for k, (n, b) in kinds.items()}}))

if __name__ == '__main__':
    rel = sys.argv[1] if len(sys.argv) > 1 else None
    if not rel:
        sys.path.insert(0, HERE); import release; rel = release.fetch(release.newest())
    main(rel, sys.argv[2] if len(sys.argv) > 2 else os.path.join(HERE, 'out', 'game'))
