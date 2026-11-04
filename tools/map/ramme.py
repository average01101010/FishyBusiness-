# The wide frame's map data (H1b R2 of the ocean step, 03.11.2026; docs/planer/havsteget-h1b-rammen.md 3a, kart-og-terreng.md 4.9c).
#   python3 tools/map/ramme.py build [out]     (kart.yml) out/national/ramme/: the core's coarse layers (core.npz: land1k, dc1k,
#                                              expo2k, deep), the chart's coast0 over the whole frame (coast0.bin), and the packs
#                                              of the tiles off the old frame with land near the sea (far heights 'far' and land at
#                                              200 m 'land200x', kind 'far'), with a manifest. The release carries it as
#                                              kart-ramme.tar.gz beside kart-game.tar.gz, which keeps its format.
#   python3 tools/map/ramme.py inject [tag|dir] (local) writes the core into src/data/map from the release kart.json's 'release'
#                                              names (or a dir): the old layers as they were (land200, dc200, expo, names0; dc200
#                                              and expo now 'u8p', the same values), the coarse layers and the new deep, and coast0
#                                              moved out of the core into a pack of its own ('chart0', loaded after the start).
# tools/map/game.py takes the far packs from the release's ramme/ for the whole coast's build.
import os, sys, json, hashlib, zlib, numpy as np
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE); ROOT = os.path.dirname(os.path.dirname(HERE))
import frame, pack
SRC = os.path.join(ROOT, 'src', 'data', 'map')
WX0, WY0, WX1, WY1 = frame.WIDE
# the coarse layers: cell (km), block (cells: 100 km blocks), type, dec
COARSE = {'land1k': (1.0, 100, 'u8', None), 'dc1k': (1.0, 100, 'u8p', 'dm2'), 'expo2k': (2.0, 50, 'u8p', None), 'deep': (1.0, 100, 'u8p', 'x10')}
# blocks of the coarse layers that lie 100 km or more inside the old frame are left out (the old core's layers are read there, farL);
# deep covers everything
def interior(bx, by, bk):
    x0, y0 = bx * bk, by * bk; return x0 >= 100 and y0 >= 100 and x0 + bk <= frame.OLD[2] - 50 and y0 + bk <= frame.OLD[3] - 20

def wide_layer(name):
    c, n, typ, dec = COARSE[name]
    return dict(c=c, ix0=round(WX0 / c), iy0=round(WY0 / c), nx=round((WX1 - WX0) / c), ny=round((WY1 - WY0) / c), n=n, type=typ, kind='core', dec=dec)

def kmp(kind, tile, blocks):
    off, head, body = 0, {'kind': kind, 'tile': list(tile), 'blocks': []}, []
    for l, bx, by, z, *cnt in blocks: head['blocks'].append([l, bx, by, off, len(z)] + cnt); body.append(z); off += len(z)
    hj = json.dumps(head, separators=(',', ':')).encode(); data = b'KMP1' + len(hj).to_bytes(4, 'little') + hj + b''.join(body)
    return data, hashlib.sha256(data).hexdigest()[:12]

def build(out):
    import national, deep, chart
    os.makedirs(out, exist_ok=True)
    z = national.coarse(); D, dsrc = deep.layer()
    np.savez_compressed(os.path.join(out, 'core.npz'), land1k=z['land1k'], dc1k=z['dc1k'], expo2k=z['expo2k'], deep=D)
    f0 = os.path.join(national.OUT, 'coast0w.bin')
    if not os.path.exists(f0):
        b, n = chart.coast0(); open(f0, 'wb').write(b); json.dump({'rings': n}, open(f0 + '.json', 'w'))
    b0 = open(f0, 'rb').read(); n0 = json.load(open(f0 + '.json'))['rings']; open(os.path.join(out, 'coast0.bin'), 'wb').write(b0)
    F = national.farx(); W = national.wide200(); ox, oy = round(-WX0 / 0.2), round(-WY0 / 0.2); packs = []
    for (tx, ty), h in sorted(F.items()):
        m = W[ty * 250 + oy:(ty + 1) * 250 + oy, tx * 250 + ox:(tx + 1) * 250 + ox]
        data, hh = kmp('far', (tx, ty), [['far', tx, ty, pack.raw_deflate(pack.med16(h))], ['land200x', tx, ty, pack.raw_deflate(np.ascontiguousarray(m, np.uint8).tobytes())]])
        fn = f'far-{tx}-{ty}-{hh}.wasm'; open(os.path.join(out, fn), 'wb').write(data)
        packs.append(dict(file=fn, hash=hh, kind='far', tile=[tx, ty], box=[tx * 50, ty * 50, (tx + 1) * 50, (ty + 1) * 50], bytes=len(data)))
    lay = lambda typ, dec: dict(c=0.2, ix0=round(WX0 / 0.2), iy0=round(WY0 / 0.2), nx=round((WX1 - WX0) / 0.2), ny=round((WY1 - WY0) / 0.2), n=250, type=typ, kind='far', dec=dec)
    man = dict(v=2, frame='utm33', block=frame.BLOCK, tile=frame.TILE, wide=list(frame.WIDE), deep=dsrc, coast0=n0,
               layers={'far': lay('i16', 'hgt'), 'land200x': lay('u8', None)}, packs=packs)
    json.dump(man, open(os.path.join(out, 'manifest.json'), 'w'), separators=(',', ':'))
    print(json.dumps({'out': out, 'farPacks': len(packs), 'farMB': round(sum(p['bytes'] for p in packs) / 1e6, 2), 'coast0KB': len(b0) // 1024, 'rings': n0, 'deep': dsrc}))

# the core pack of src/data/map, rewritten
def inject(rdir, d=SRC):
    mp = os.path.join(d, 'manifest.json'); man = json.load(open(mp)); rm = json.load(open(os.path.join(rdir, 'manifest.json')))
    core = [p for p in man['packs'] if p['kind'] == 'core']; assert len(core) == 1; pk = core[0]
    data = open(os.path.join(d, pk['file']), 'rb').read(); assert data[:4] == b'KMP1'
    hl = int.from_bytes(data[4:8], 'little'); head = json.loads(data[8:8 + hl]); at = 8 + hl; blocks = []; was = {}
    # the old layers' values, block by block in the pack's order, for the check that the core reads them the same (tests/unit/kjernen)
    chk = {l: hashlib.sha256() for l in ('land200', 'dc200', 'expo')}; was_u8 = {l: man['layers'][l]['type'] == 'u8' for l in chk}
    for l, bx, by, o, ln, *cnt in head['blocks']:
        raw = data[at + o:at + o + ln]; was[l] = was.get(l, 0) + ln
        if l in COARSE or l in ('coast0', 'land1k', 'dc1k', 'expo2k'): continue
        L = man['layers'].get(l)
        if l in chk and L['type'] == 'u8':   # (a core injected before keeps its check)
            n = L['n']; v = zlib.decompress(raw, -15); chk[l].update(v)
            if l in ('dc200', 'expo') and L['type'] == 'u8': raw = pack.raw_deflate(pack.med8(np.frombuffer(v, np.uint8).reshape(n, n)))   # the same values through the predictor
        blocks.append([l, bx, by, raw] + cnt)
    for l in ('dc200', 'expo'): man['layers'][l]['type'] = 'u8p'
    z = np.load(os.path.join(rdir, 'core.npz')); now = {}
    for name in COARSE:
        L = wide_layer(name); A = z[name]; assert A.shape == (L['ny'], L['nx']), (name, A.shape); n = L['n']; bk = round(n * L['c'])
        for j in range(L['ny'] // n):
            for i in range(L['nx'] // n):
                bx, by = L['ix0'] // n + i, L['iy0'] // n + j
                if name != 'deep' and interior(bx, by, bk): continue
                zb = pack.raw_deflate(pack.encode(A[j * n:(j + 1) * n, i * n:(i + 1) * n], L['type'])); blocks.append([name, bx, by, zb]); now[name] = now.get(name, 0) + len(zb)
        man['layers'][name] = L
    data2, h = kmp('core', pk['tile'], blocks); fn = f"core-{pk['tile'][0]}-{pk['tile'][1]}-{h}.wasm"
    if fn != pk['file']: os.remove(os.path.join(d, pk['file'])); open(os.path.join(d, fn), 'wb').write(data2)
    pk.update(file=fn, hash=h, bytes=len(data2))
    # coast0 in a pack of its own (kind 'chart0'), which the chart loads after the start (03a-chart.js)
    c0 = open(os.path.join(rdir, 'coast0.bin'), 'rb').read(); d0, h0 = kmp('chart0', (0, 0), [['coast0', 0, 0, pack.raw_deflate(c0), rm['coast0']]])
    for p in [p for p in man['packs'] if p['kind'] == 'chart0']: os.remove(os.path.join(d, p['file'])); man['packs'].remove(p)
    f0 = f'chart0-0-0-{h0}.wasm'; open(os.path.join(d, f0), 'wb').write(d0); man['packs'].append(dict(file=f0, hash=h0, kind='chart0', tile=[0, 0], box=None, bytes=len(d0)))
    man['packs'].sort(key=lambda p: p['file']); man['deep'] = rm.get('deep'); man['check'] = {l: (h.hexdigest()[:16] if was_u8[l] else man.get('check', {})[l]) for l, h in chk.items()}
    json.dump(man, open(mp, 'w'), separators=(',', ':'))
    print(json.dumps({'core': fn, 'bytes': len(data2), 'was': len(data), 'header': len(json.dumps(head)), 'layersBefore': was, 'layersNew': now, 'chart0': len(d0), 'deep': rm.get('deep')}))

if __name__ == '__main__':
    if sys.argv[1] == 'build':
        import national; build(sys.argv[2] if len(sys.argv) > 2 else os.path.join(national.OUT, 'ramme'))
    elif sys.argv[1] == 'inject':
        a = sys.argv[2] if len(sys.argv) > 2 else None
        if a and os.path.isdir(a): rdir = a
        else:
            import release; rdir = release.fetch_ramme(a or release.pinned())
        inject(rdir)
