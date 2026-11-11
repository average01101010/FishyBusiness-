# The fine ground along the sea, `hgt10` (Ø13 of docs/planer/kartrelease-o13.md, 11.11.2026). K0 measured the layer with this script
# (senja, tile, gain, count: everything under tools/map/out/fin/, the Terrarium tiles it fetches too); from K1 it also writes THE pack
# the game reads, for Senja's four tiles (game):
#   the pack  the strip 1 km from the sea, 12.5 m cells (800 x 800 a block of 10 km), Int16 half metres all the way up (the layer's
#           dec 'half', as the depth; hgtEnc has 2 m steps over 10 m and rounds the whole gain away there, K0), a land cell at least 1
#           (half a metre), 0 «no fine ground here, read the 25 m layer», the sea cells within 25 m of the strip -1 (the foreshore,
#           only the sign), and a block without a cell of the strip is not in the pack. The game reads it with finH
#           (src/js/core/01b-mapdata.js), on High and Ultra only.
# What K0 measured, and how:
#   what    the height of the land in a strip along the sea (1 km or 500 m from it) at 10 m or 12.5 m cells, from Terrarium z13
#           (Kartverket's 10 m terrain in Norway, 5-8 m a pixel here; terrain.sample), where the game's 25 m layer keeps every fourth
#           pixel. Land and sea come from the vector coast at 3 m (the chart packs' coast2, which is what the game takes for land and
#           sea, 4.19 of kart-og-terreng.md), not from the 25 m mask. A cell of the strip is hgtEnc(max(h, 0.5)); a sea cell within
#           25 m of it (the foreshore) hgtEnc(min(h, -0.5)); every other cell 0, which hgtEnc never gives and which reads «no fine
#           ground here, take the 25 m layer». A 10 km block without a cell of the strip has no entry.
#   packed  as the game's 'hgt' (pack.py): Int16, the median predictor, raw deflate per 10 km block, a pack per 50 km tile
#           ('fin-tx-ty-hash.wasm', KMP1), so the sizes printed are the sizes a release would have.
#   the mask and the coast are read from the packs there are: Senja's tiles from src/data/map, the rest from the pinned kart-
#   release (python3 tools/map/release.py first).
#
#   python3 tools/map/fin.py senja              Senja's four tiles in the four variants, per tile and summed
#   python3 tools/map/fin.py tile tx,ty ...     other tiles the same way (a flat one, a northern one: how well Senja stands for the rest)
#   python3 tools/map/fin.py gain tx,ty ...     what the fine layer adds over the 25 m layer in a tile, and what the coding rounds away
#   python3 tools/map/fin.py count              the land in the strip (km2) of every mainland tile from the 25 m masks, and the measured
#                                               bytes per km2 multiplied up to the whole coast
#   python3 tools/map/fin.py game               Senja's four 'fin' packs into src/data/map, and the layer 'fin' and the packs into its
#                                               manifest.json; no other entry there is touched (K1; the whole coast is K2's release)
import os, sys, json, glob, zlib, time, hashlib, numpy as np
from scipy import ndimage
import frame, terrain, pack
from region import hgtEnc

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))
OUT = os.path.join(HERE, 'out', 'fin'); os.makedirs(OUT, exist_ok=True)
terrain.D = os.path.join(OUT, 'terrarium'); os.makedirs(terrain.D, exist_ok=True)   # this script writes under out/ only
SRC = os.path.join(ROOT, 'src', 'data', 'map')
STRIPS = (1000, 500); CELLS = (10.0, 12.5); SHORE = 25.0   # metres
SENJA = [(16, 6), (17, 6), (16, 7), (17, 7)]
T = frame.TILE * 1000   # a tile in metres

# the packs there are, {(kind, tx, ty): [path, ...]}, Senja's own first
def release_dir():
    import release
    return os.path.join(release.OUT, release.pinned(), 'game')
_IDX = None
def index():
    global _IDX
    if _IDX is None:
        _IDX = {}
        for d in (SRC, release_dir()):
            f = os.path.join(d, 'manifest.json')
            if not os.path.exists(f): sys.exit(f'{f} is missing (python3 tools/map/release.py)')
            for p in json.load(open(f))['packs']:
                if p['kind'] in ('sim', 'chart'): _IDX.setdefault((p['kind'], p['tile'][0], p['tile'][1]), []).append(os.path.join(d, p['file']))
    return _IDX
def blocks(f, layer):
    data = open(f, 'rb').read(); assert data[:4] == b'KMP1', f
    hl = int.from_bytes(data[4:8], 'little'); head = json.loads(data[8:8 + hl]); at = 8 + hl
    return {(bx, by): zlib.decompress(data[at + o:at + o + ln], -15) for l, bx, by, o, ln, *_ in head['blocks'] if l == layer}
def mainland():
    return sorted({(tx, ty) for (k, tx, ty) in index() if k == 'sim' and frame.in_old(tx, ty)})

# the land at 25 m of a tile (2000 x 2000, > 0 land), None where there is no tile; a block Senja's own pack lacks comes from the release
_M = {}
def mask25(tx, ty):
    if (tx, ty) not in _M:
        fs = index().get(('sim', tx, ty)); M = None
        if fs:
            M = np.zeros((2000, 2000), np.uint8); got = set()
            for f in fs:
                for (bx, by), raw in blocks(f, 'mask').items():
                    if (bx, by) in got: continue
                    got.add((bx, by)); i, j = bx - tx * 5, by - ty * 5; M[j * 400:(j + 1) * 400, i * 400:(i + 1) * 400] = np.frombuffer(raw, np.uint8).reshape(400, 400)
        _M[(tx, ty)] = M
        if len(_M) > 40: _M.pop(next(iter(_M)))
    return _M[(tx, ty)]
# the same with p cells round it from the neighbours (the edge repeated where there is no neighbour: neither sea nor land is made up)
def mask25pad(tx, ty, p=40):
    B = np.pad(mask25(tx, ty), p, mode='edge')
    for dy in (-1, 0, 1):
        for dx in (-1, 0, 1):
            N = mask25(tx + dx, ty + dy) if (dx or dy) else None
            if N is None: continue
            ys = slice(0, p) if dy < 0 else slice(p, p + 2000) if dy == 0 else slice(p + 2000, 2 * p + 2000); ns = slice(2000 - p, 2000) if dy < 0 else slice(0, 2000) if dy == 0 else slice(0, p)
            xs = slice(0, p) if dx < 0 else slice(p, p + 2000) if dx == 0 else slice(p + 2000, 2 * p + 2000); ms = slice(2000 - p, 2000) if dx < 0 else slice(0, 2000) if dx == 0 else slice(0, p)
            B[ys, xs] = N[ns, ms]
    return B

# the vector coast at 3 m of a tile (chart.py coast2): [(class, points (k x 2, metres from the tile's corner))]; classes 0 outer, 1 hole,
# 2 and 3 a breakwater's
def coast2(tx, ty):
    for f in index().get(('chart', tx, ty), []):
        for raw in blocks(f, 'coast2').values():
            b = np.frombuffer(raw, np.uint8); out = []; at = 0
            def vi():
                nonlocal at
                v = 0; s = 0
                while True:
                    q = int(b[at]); at += 1; v |= (q & 127) << s; s += 7
                    if q < 128: return v
            for _ in range(vi()):
                c = vi(); k = vi(); st = np.empty(2 * k, np.int64)
                for i in range(2 * k): z = vi(); st[i] = (z >> 1) ^ -(z & 1)
                out.append((c, np.cumsum(st.reshape(k, 2), axis=0)))
            return out
    return None
# the rings filled at the cells' centres with the nonzero rule (as the game fills them: overlapping polygons stay land, a hole turns the
# other way), over ny x nx cells of c metres whose first cell's corner is at (x0, y0) metres from the tile's corner
def fill(rings, c, x0, y0, nx, ny):
    R, X, S = [], [], []
    for _, pts in rings:
        gx = (pts[:, 0] - x0) / c - 0.5; gy = (pts[:, 1] - y0) / c - 0.5
        ax, ay, bx, by = gx, gy, np.roll(gx, -1), np.roll(gy, -1); lo = np.minimum(ay, by); hi = np.maximum(ay, by)
        r0 = np.maximum(np.ceil(lo), 0).astype(np.int64); r1 = np.minimum(np.ceil(hi) - 1, ny - 1).astype(np.int64); cnt = np.maximum(r1 - r0 + 1, 0); m = cnt > 0
        if not m.any(): continue
        e = np.repeat(np.flatnonzero(m), cnt[m]); rr = r0[e] + (np.arange(len(e)) - np.repeat(np.cumsum(cnt[m]) - cnt[m], cnt[m]))
        R.append(rr); X.append(ax[e] + (rr - ay[e]) * (bx[e] - ax[e]) / (by[e] - ay[e])); S.append(np.where(by[e] > ay[e], 1, -1))
    out = np.zeros((ny, nx + 1), np.int32)
    if R:
        R = np.concatenate(R); X = np.concatenate(X); S = np.concatenate(S); o = np.lexsort((X, R)); R, X, S = R[o], X[o], S[o]
        w = np.cumsum(S); k = np.flatnonzero((w[:-1] != 0) & (R[:-1] == R[1:]))   # the spans with the winding not 0
        c0 = np.clip(np.ceil(X[k]), 0, nx).astype(np.int64); c1 = np.clip(np.floor(X[k + 1]) + 1, 0, nx).astype(np.int64); ok = c1 > c0
        np.add.at(out, (R[k][ok], c0[ok]), 1); np.add.at(out, (R[k][ok], c1[ok]), -1)
    return np.cumsum(out, axis=1)[:, :nx] > 0

# a tile at c metres: the land (the vector coast inside the tile, the neighbours' 25 m masks 1 km round it), the distance of every land
# cell from the sea (m), and the heights of the land within the widest strip and of the foreshore (Terrarium z13; NaN elsewhere).
# The heights are kept in out/fin/h/, so a variant is packed again without fetching.
def ground(tx, ty, c):
    n = round(T / c); p = round(1000 / c); f = os.path.join(OUT, 'h', f'{tx}_{ty}_{c:g}.npz'); os.makedirs(os.path.dirname(f), exist_ok=True)
    rings = coast2(tx, ty)
    if rings is None or mask25(tx, ty) is None: return None
    B = mask25pad(tx, ty, 40) > 0; i = np.minimum(((np.arange(n + 2 * p) + 0.5) * c / 25).astype(int), B.shape[0] - 1); L = B[np.ix_(i, i)]
    L[p:p + n, p:p + n] = fill(rings, c, 0, 0, n, n)
    dsea = (ndimage.distance_transform_edt(L) * c)[p:p + n, p:p + n]; dland = (ndimage.distance_transform_edt(~L) * c)[p:p + n, p:p + n]; L = L[p:p + n, p:p + n]
    if os.path.exists(f): return L, dsea, dland, np.load(f)['h'].astype(np.float32)
    want = (L & (dsea <= max(STRIPS))) | (~L & (dland <= SHORE)); H = np.full((n, n), np.nan, np.float32); nb = n // 5
    for j in range(5):
        for i in range(5):
            s = (slice(j * nb, (j + 1) * nb), slice(i * nb, (i + 1) * nb)); w = want[s]
            if not w.any(): continue
            yy, xx = np.nonzero(w); lon, lat = frame.to_ll(tx * 50 + (i * nb + xx + 0.5) * c / 1000, ty * 50 + (j * nb + yy + 0.5) * c / 1000)
            h = np.full(w.shape, np.nan, np.float32); h[yy, xx] = terrain.sample(lon, lat, 13); H[s] = h
    np.savez_compressed(f, h=H); return L, dsea, dland, H

half = lambda v: np.sign(v) * np.round(np.abs(v) * 2)   # half metres all the way up (hgtEnc has 2 m steps from 10 m), for comparison
# one variant of a tile packed: the bytes of the pack, the blocks, the cells of the strip, and the pack itself in out/fin/<variant>/
# (sea: what a foreshore cell is written as; the game's pack has -1, the measured variants what the coding gives)
def variant(tx, ty, c, strip, G, enc=hgtEnc, name=None, sea=None):
    L, dsea, dland, H = G; n = L.shape[0]; nb = n // 5
    land = L & (dsea <= strip); shore = ~L & (dland <= SHORE) & (ndimage.maximum_filter(land, 2 * round(SHORE / c) + 1))
    h = np.nan_to_num(H); A = np.where(land, enc(np.maximum(h, 0.5)), np.where(shore, enc(np.minimum(h, -0.5)) if sea is None else sea, 0)).astype(np.int16)
    head = {'kind': 'fin', 'tile': [tx, ty], 'blocks': []}; body = []; off = 0; raw = 0
    for j in range(5):
        for i in range(5):
            s = (slice(j * nb, (j + 1) * nb), slice(i * nb, (i + 1) * nb))
            if not land[s].any(): continue
            z = pack.raw_deflate(pack.med16(A[s])); head['blocks'].append(['fin', tx * 5 + i, ty * 5 + j, off, len(z)]); body.append(z); off += len(z); raw += 2 * nb * nb
    hj = json.dumps(head, separators=(',', ':')).encode(); data = b'KMP1' + len(hj).to_bytes(4, 'little') + hj + b''.join(body)
    d = os.path.join(OUT, name or f'{strip}m-{c:g}m'); os.makedirs(d, exist_ok=True)
    for old in glob.glob(os.path.join(d, f'fin-{tx}-{ty}-*.wasm')): os.remove(old)
    if body: open(os.path.join(d, f'fin-{tx}-{ty}-{hashlib.sha256(data).hexdigest()[:12]}.wasm'), 'wb').write(data)
    hi = float((h[land] >= 9.75).mean()) if land.any() else 0.0
    return dict(bytes=len(data) if body else 0, blocks=len(body), cells=int(land.sum()), shore=int(shore.sum()), km2=float(land.sum() * c * c / 1e6), over10=hi, raw=raw,
                file=os.path.join(d, f'fin-{tx}-{ty}-{hashlib.sha256(data).hexdigest()[:12]}.wasm') if body else None)

# THE pack of a tile as the game reads it (K1): 1 km, 12.5 m, half metres, the foreshore -1; in out/fin/game/
GAME = dict(c=12.5, strip=1000)
def game_pack(tx, ty):
    G = ground(tx, ty, GAME['c'])
    return None if G is None else variant(tx, ty, GAME['c'], GAME['strip'], G, half, 'game', sea=-1)
# Senja's four packs into src/data/map, and the layer and the packs into its manifest; every other entry stays as it is, byte for byte
# (the manifest is written as the other tools write it, json.dump with no spaces)
def game():
    import shutil
    mf = os.path.join(SRC, 'manifest.json'); man = json.load(open(mf)); M = man['layers']['mask']; k = round(M['c'] * 1000 / GAME['c']); n = round(man['block'] * 1000 / GAME['c'])
    assert M['c'] * 1000 == k * GAME['c'] and n * GAME['c'] == man['block'] * 1000
    new = []
    for tx, ty in SENJA:
        r = game_pack(tx, ty)
        if not r or not r['file']: print(f'{tx},{ty}: no strip, no pack'); continue
        fn = os.path.basename(r['file']); new.append(dict(file=fn, hash=fn.split('-')[-1].split('.')[0], kind='fin', tile=[tx, ty], box=[tx * 50, ty * 50, tx * 50 + 50, ty * 50 + 50], bytes=r['bytes']))
        print(f'{tx},{ty}: {fn} {r["bytes"] / 1e6:.3f} MB, {r["blocks"]} blocks, {r["cells"] / 1e6:.2f} M land cells, {r["shore"] / 1e6:.2f} M foreshore cells')
    for old in glob.glob(os.path.join(SRC, 'fin-*.wasm')): os.remove(old)
    for p in new: shutil.copyfile(os.path.join(OUT, 'game', p['file']), os.path.join(SRC, p['file']))
    man['layers']['fin'] = dict(c=GAME['c'] / 1000, ix0=M['ix0'] * k, iy0=M['iy0'] * k, nx=M['nx'] * k, ny=M['ny'] * k, n=n, type='i16', kind='fin', dec='half')
    man['packs'] = [p for p in man['packs'] if p['kind'] != 'fin'] + sorted(new, key=lambda p: p['file'])
    raw = open(mf).read(); sep = (',', ':') if ', ' not in raw[:2000] else None
    json.dump(man, open(mf, 'w'), separators=sep, ensure_ascii=False)
    print(f'{len(new)} packs, {sum(p["bytes"] for p in new) / 1e6:.2f} MB, in {SRC}; the layer fin {man["layers"]["fin"]}')

# the land in the strip at 25 m (km2) of a tile, from the masks alone (what count multiplies with), and the blocks with any of it
def strip25(tx, ty):
    B = mask25pad(tx, ty, 40) > 0; d = (ndimage.distance_transform_edt(B) * 25)[40:2040, 40:2040]; out = {}
    for s in STRIPS:
        m = (d > 0) & (d <= s); out[s] = dict(km2=float(m.sum() * 625 / 1e6), blocks=int(m.reshape(5, 400, 5, 400).any(axis=(1, 3)).sum()))
    out['land'] = float((d > 0).sum() * 625 / 1e6); return out

def measure(tiles, tag):
    res = {}; f = os.path.join(OUT, 'maal.json'); allr = json.load(open(f)) if os.path.exists(f) else {}
    for tx, ty in tiles:
        t0 = time.time(); row = {'strip25': strip25(tx, ty)}
        for c in CELLS:
            G = ground(tx, ty, c)
            if G is None: print(f'{tx},{ty}: no pack'); break
            for s in STRIPS: row[f'{s}m-{c:g}m'] = variant(tx, ty, c, s, G)
            row[f'1000m-{c:g}m-half'] = variant(tx, ty, c, 1000, G, half, f'1000m-{c:g}m-half'); del G
        else:
            row['sec'] = round(time.time() - t0, 1); res[f'{tx},{ty}'] = row; allr[f'{tx},{ty}'] = row; json.dump(allr, open(f, 'w'), indent=1); show(f'{tx},{ty}', row)
    if len(res) > 1: show(f'{tag} summed', total(res.values()))
    return res
VARS = [f'{s}m-{c:g}m' for s in STRIPS for c in CELLS]
def s25(r, s): return r['strip25'][s] if s in r['strip25'] else r['strip25'][str(s)]   # (maal.json has the keys as text)
def total(rows):
    rows = list(rows); out = {'strip25': {s: dict(km2=sum(s25(r, s)['km2'] for r in rows), blocks=sum(s25(r, s)['blocks'] for r in rows)) for s in STRIPS}}
    for v in VARS + [f'1000m-{c:g}m-half' for c in CELLS]:
        out[v] = {k: sum(r[v][k] for r in rows) for k in ('bytes', 'blocks', 'cells', 'shore', 'km2', 'raw')}; out[v]['over10'] = sum(r[v]['over10'] * r[v]['cells'] for r in rows) / max(1, out[v]['cells'])
    return out
def show(name, row):
    print(f'{name}: strip at 25 m {s25(row, 1000)["km2"]:.0f} km2 (1 km), {s25(row, 500)["km2"]:.0f} km2 (500 m)' + (f', {row["sec"]} s' if 'sec' in row else ''))
    for v in VARS + [f'1000m-{c:g}m-half' for c in CELLS]:
        r = row[v]; s = int(v.split('m')[0])
        if not r['cells']: print(f'  {v:16s} nothing'); continue
        print(f'  {v:16s} {r["bytes"] / 1e6:7.3f} MB  {r["blocks"]:3d} blocks  {r["cells"] / 1e6:6.2f} M cells ({r["km2"]:6.1f} km2)  {r["bytes"] / r["cells"]:.3f} B/cell  {r["bytes"] / max(1e-9, s25(row, s)["km2"]) / 1e3:6.2f} kB/km2(25 m)  {100 * r["over10"]:.0f} % over 10 m  deflate {r["bytes"] / r["raw"]:.3f}')

# the whole mainland: the strip of every tile at 25 m, and the measured tiles' bytes per km2 multiplied up
def count():
    f = os.path.join(OUT, 'maal.json'); meas = json.load(open(f)) if os.path.exists(f) else {}
    cf = os.path.join(OUT, 'telling.json'); C = json.load(open(cf)) if os.path.exists(cf) else {}
    for tx, ty in mainland():
        k = f'{tx},{ty}'
        if k not in C: C[k] = strip25(tx, ty); json.dump(C, open(cf, 'w'))
    tiles = [{'strip25': C[f'{tx},{ty}']} for tx, ty in mainland()]; km = {s: sum(s25(t, s)['km2'] for t in tiles) for s in STRIPS}
    bl = {s: sum(s25(t, s)['blocks'] for t in tiles) for s in STRIPS}
    print(f'{len(tiles)} mainland tiles, land {sum(t["strip25"]["land"] for t in tiles):.0f} km2; in the strip 1 km {km[1000]:.0f} km2 ({bl[1000]} blocks), 500 m {km[500]:.0f} km2 ({bl[500]} blocks)')
    sen = [meas[f'{tx},{ty}'] for tx, ty in SENJA if f'{tx},{ty}' in meas]; oth = {k: r for k, r in meas.items() if tuple(map(int, k.split(','))) not in SENJA}
    groups = ([('Senja', total(sen))] if sen else []) + [(k, r) for k, r in sorted(oth.items())] + ([('all measured', total(meas.values()))] if oth else [])
    for name, r in groups:
        print(f'  from {name}:')
        for v in VARS + [f'1000m-{c:g}m-half' for c in CELLS]:
            s = int(v.split('m')[0]); st = s25(r, s)
            if st['km2'] <= 0: continue
            print(f'    {v:16s} {r[v]["bytes"] / st["km2"] / 1e3:6.2f} kB/km2 -> {r[v]["bytes"] / st["km2"] * km[s] / 1e6:6.1f} MB for the mainland')
    # the memory in the game: a block is n x n Int16
    for c in CELLS:
        n = round(10000 / c); b = 2 * n * n / 1e6; print(f'  memory {c:g} m: a block {n} x {n} Int16 = {b:.2f} MB; 4 blocks {4 * b:.1f} MB, 9 blocks {9 * b:.1f} MB of the map buffer\'s 96 MB')

# what the fine layer adds: the strip's heights against the 25 m layer at its best (the same source read at the 25 m cells' centres,
# unrounded, bilinear between them, as the game reads it), and what the two codings round away
def gain(tx, ty, c=12.5, k=300000):
    L, dsea, dland, H = ground(tx, ty, c); yy, xx = np.nonzero(L & (dsea <= max(STRIPS))); sel = np.random.default_rng(1).choice(len(yy), min(k, len(yy)), replace=False); yy, xx = yy[sel], xx[sel]
    gx = (xx + 0.5) * c / 25 - 0.5; gy = (yy + 0.5) * c / 25 - 0.5; ix = np.floor(gx).astype(int); iy = np.floor(gy).astype(int); ok = (ix >= 0) & (iy >= 0) & (ix < 1999) & (iy < 1999)
    ix, iy, yy, xx = ix[ok], iy[ok], yy[ok], xx[ok]; fx = gx[ok] - ix; fy = gy[ok] - iy; M = mask25(tx, ty) > 0
    def h25(ix, iy):
        lon, lat = frame.to_ll(tx * 50 + (ix + 0.5) * 0.025, ty * 50 + (iy + 0.5) * 0.025); h = terrain.sample(lon, lat, 13); return np.where(M[iy, ix], np.maximum(h, 0.5), np.minimum(h, -0.5))
    a = (h25(ix, iy) * (1 - fx) + h25(ix + 1, iy) * fx) * (1 - fy) + (h25(ix, iy + 1) * (1 - fx) + h25(ix + 1, iy + 1) * fx) * fy
    h = np.maximum(H[yy, xx], 0.5); d = np.abs(h - a); rms = lambda v: float(np.sqrt((v ** 2).mean())) if len(v) else 0.0
    dec = lambda q: np.sign(q) * np.where(np.abs(q) < 20, np.abs(q) / 2, 10 + (np.abs(q) - 20) * 2)   # the game's reading of hgtEnc
    print(f'{tx},{ty} at {c:g} m, {len(h)} cells of the 1 km strip: fine against the 25 m layer rms {rms(d):.2f} m, 90 % within {np.percentile(d, 90):.2f}, 99 % within {np.percentile(d, 99):.2f}, over 1 m {100 * (d > 1).mean():.1f} %, over 2 m {100 * (d > 2).mean():.1f} %')
    for nm, m in (('under 10 m', h < 10), ('10 m and over', h >= 10), ('within 100 m of the sea', dsea[yy, xx] <= 100)):
        print(f'   {nm:24s} {100 * m.mean():3.0f} % of the cells: rms {rms(d[m]):.2f} m, over 1 m {100 * (d[m] > 1).mean():.1f} %; rounded away by hgtEnc rms {rms((dec(hgtEnc(h)) - h)[m]):.2f} m, by half metres {rms((half(h) / 2 - h)[m]):.2f} m')

if __name__ == '__main__':
    a = sys.argv[1:]
    if a[:1] == ['senja']: measure(SENJA, 'Senja')
    elif a[:1] == ['tile']: measure([tuple(map(int, t.split(','))) for t in a[1:]], 'tiles')
    elif a[:1] == ['count']: count()
    elif a[:1] == ['game']: game()
    elif a[:1] == ['gain']:
        for t in a[1:]: gain(*map(int, t.split(',')))
    else: sys.exit(__doc__ or 'python3 tools/map/fin.py senja | tile tx,ty ... | gain tx,ty ... | count | game')
