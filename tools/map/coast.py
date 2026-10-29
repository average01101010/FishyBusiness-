# The coast's tiles through the pipeline (phase K5 of the coast plan): every 50 km tile of national.py's list, the lite profile
# (the artifact's): mask 25 m (with the breakwaters), distance to land 100 m, ground 25 m, forest 50 m, depth 50 m and openness 500 m.
# Kept per tile in out/national/tiles/, so a stopped run goes on.
#   python3 tools/map/coast.py game [tx,ty ...]   the game's packs (01b-mapdata.js, as region.py groups them): per tile 'sim' (mask, dc,
#                                                 depth), 'view' (hgt, forest, cover), 'chart' (coast1, coast2, names) and 'vec' (bld, road, water,
#                                                 bridge, pier, quay: vectors.py; npc: npc.py) in out/national/game/;
#                                                 the core and the far heights come from src/data/map (tools/map/game.py joins them)
#   python3 tools/map/coast.py [lite] [tx,ty ...] the K5 packs in out/national/lite/ (a pack per kind and tile, the core per tile too)
#   python3 tools/map/coast.py cache k n          part k of n of the tiles into the caches only (the workflow's parts)
#   ground  Terrarium z13 (Kartverket's 10 m) in the 10 km blocks within 3 km of the sea, z11 (about 30 m) in the others
#   depth   Kartverket's (the legacy Senja raster) inside the legacy square; elsewhere Kartverket's 50 m depth models (the release
#           dybde-N that .github/workflows/dybde.yml fetches from Geonorge, unpacked in out/depth/), and where they have no data the
#           game's own depth model (depthModel in 03-simulation.js: openness, distance to the shore and a little noise), blended over
#           250 m at the edge of the data
import os, sys, json, time, numpy as np
from scipy import ndimage
import frame, terrain, legacy, pack, national
from region import polys_of, fill, hgtEnc, breakwaters, cached, cover_box
from ov import features
OUT = national.OUT; TD = os.path.join(OUT, 'tiles'); os.makedirs(TD, exist_ok=True)

# the game's value noise (hash, h2, vn in 03-simulation.js), bit for bit
M32 = np.uint64(0xffffffff)
def _imul(a, b): return (a.astype(np.uint64) * np.uint64(b)) & M32
def hash32(n):
    n = n.astype(np.uint64) & M32
    n = _imul(n ^ (n >> np.uint64(16)), 0x45d9f3b); n = _imul(n ^ (n >> np.uint64(16)), 0x45d9f3b); n = n ^ (n >> np.uint64(16))
    return n.astype(np.float64) / 4294967296.0
def h2(a, b):
    x = _imul((np.asarray(a).astype(np.int64) & 0xffffffff).astype(np.uint64), 374761393) ^ _imul(np.uint64((b + 1013) & 0xffffffff) * np.ones_like(np.asarray(a), np.uint64), 668265263)
    return hash32((x + np.uint64(b & 0xffffffff)) & M32)
def vn(t, s):
    i = np.floor(t); f = t - i; u = f * f * (3 - 2 * f); i = i.astype(np.int64)
    return h2(i, s) * (1 - u) + h2(i + 1, s) * u
def sstep(a, b, x): t = np.clip((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t)
# depth (m) rounded coarser the deeper it is: half a metre to 20 m, a metre to 60, two to 150, five below. Kartverket's measured depth
# packs far worse than the model did (the packs grew from 195 to 250 MB, over what an artifact takes), and below 20 m the steps are
# finer than the 50 m grid knows anyway; the shallows, where she grounds, keep their half metre
def qdepth(d): return np.where(d < 20, np.round(d * 2) / 2, np.where(d < 60, np.round(d), np.where(d < 150, np.round(d / 2) * 2, np.round(d / 5) * 5)))

# the sea floor under the ground layer (Terrarium has the sea at 0, which the 3D view took for shallows): the depth, 25 m from 50 m
def seafloor(out):
    dep = qdepth(ndimage.zoom(out['depth'].astype(np.float32) / 2, 2, order=1)[:2000, :2000])
    out['hgt'] = np.where(out['mask'] > 0, out['hgt'], hgtEnc(-np.maximum(dep, 0.5))).astype(np.int16); return out

# Kartverket's depth over a tile (m, positive down) on the tile's 50 m cells, NaN where it has no data (0 in the coverage, which has
# the sea's cells negative and drying ground a little over 0, which is kept as half a metre); None without out/depth/
DEPTHD = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'out', 'depth')
def kartverket(tx, ty):
    f = os.path.join(DEPTHD, f'{tx}_{ty}.npz')
    if not os.path.exists(f): return None
    z = np.load(f)['z'].astype(np.float32)
    return np.where((z == 0) | (z == -32768), np.nan, np.maximum(-z / 10, 0.5))

# the land cover classes of a tile (region.cover) on its 50 m cells, Norway's land only (the 200 m country mask, national.norway200):
# Sweden, Finland and Russia keep the ground as before (Jonas 28.10.2026: they need not be in this)
def cover_tile(tx, ty):
    R = frame.Region(f't{tx}_{ty}', tx * 5, ty * 5, tx * 5 + 5, ty * 5 + 5); fx0, fy0, fnx, fny = R.grid(0.05)
    C = cover_box(R.lonlat_box(1), 0.05, fx0, fy0, fnx, fny)
    NL = national.norway200()[0][ty * 250:(ty + 1) * 250, tx * 250:(tx + 1) * 250]
    return np.where(np.kron(NL, np.ones((4, 4), bool))[:fny, :fnx], C, 0).astype(np.uint8)

# the summer colour of the ground from Sentinel-2 (G3, tools/s2/s2.py: the median of the clear scenes from mid June to August 2021-2025
# on the tile's 50 m cells), as three layers (below; 0 where there is none: the sea, outside Norway, never clear). The
# scenes' own sun is taken out: they were taken near 11 in the morning, the sun in the south-southeast about (90 - latitude + 13)
# degrees up, and a slope facing it is lighter, one facing away darker; each cell is divided by its light from the 50 m ground (35 %
# from the sky, 65 % from the sun, against flat ground's), so the game's own sun and shadows are not laid on twice. Without the
# mosaic (S2D has no file for the tile) the layers are 0 and the game colours the ground as before.
S2D = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'out', 's2')
# Packed as luma and chroma, as a JPEG is (the colour per channel was 1.9 MB a tile, this 0.65): sy the luma Y = (R + 2G + B) / 4 at 50 m
# in 7 bits, sco and scg the chroma Co = (R - B) / 2 and Cg = (2G - R - B) / 4 at 100 m in 6 bits, each + 1 (0: none), as i16 layers
# (the median predictor packs a smooth picture well). The game (03-berths-naust.js satAt) turns them back into R, G, B.
def sat_tile(tx, ty, L):
    f = os.path.join(S2D, f'{tx}_{ty}.npz'); z = dict(sy=np.zeros((1000, 1000), np.int16), sco=np.zeros((500, 500), np.int16), scg=np.zeros((500, 500), np.int16))
    if not os.path.exists(f): return z
    S = np.load(f); rgb = S['rgb'].astype(np.float32); n = S['n']
    a = np.abs(L['hgt'].astype(np.float32)); h = np.sign(L['hgt']) * np.where(a < 20, a / 2, 10 + (a - 20) * 2)
    h = h.reshape(1000, 2, 1000, 2).mean(axis=(1, 3)); h = np.maximum(h, 0)
    gy, gx = np.gradient(h, 50.0)   # rows run south, columns east: gx = dh/dx east, gy = dh/dy south
    lon, lat = frame.to_ll(np.array([tx * 50 + 25.0]), np.array([ty * 50 + 25.0])); el = np.radians(min(55.0, 90 - float(lat[0]) + 13)); az = np.radians(165.0)
    sx, sy, sz = np.cos(el) * np.sin(az), -np.cos(el) * np.cos(az), np.sin(el)   # the sun: east, south, up
    nz = 1 / np.sqrt(1 + gx * gx + gy * gy); nx, ny = -gx * nz, -gy * nz
    sh = np.clip(nx * sx + ny * sy + nz * sz, 0, None) / sz
    I = np.clip(0.35 + 0.65 * sh, 0.45, 1.8)
    land = (L['cover'] > 0) & (n > 0)
    C = np.clip(rgb / I[..., None], 0, 255); R, G, B = C[..., 0], C[..., 1], C[..., 2]
    Y = (R + 2 * G + B) / 4; Co = (R - B) / 2 + 128; Cg = (2 * G - R - B) / 4 + 128
    z['sy'] = np.where(land, np.clip(np.round(Y / 2), 0, 127) + 1, 0).astype(np.int16)
    w = land.reshape(500, 2, 500, 2).sum(axis=(1, 3)); h2 = lambda a: np.where(w > 0, (np.where(land, a, 0)).reshape(500, 2, 500, 2).sum(axis=(1, 3)) / np.maximum(w, 1), 0)
    z['sco'] = np.where(w > 0, np.clip(np.round(h2(Co) / 4 - 0.5), 0, 63) + 1, 0).astype(np.int16)
    z['scg'] = np.where(w > 0, np.clip(np.round(h2(Cg) / 4 - 0.5), 0, 63) + 1, 0).astype(np.int16)
    return z

# the trees of a tile (G4, tools/trees/trees.py: Meta and WRI's canopy height maps, CC BY 4.0) on its 50 m cells as one u8 layer
# (25 m was 1.4 MB a forested tile, 50 m 0.4)
# 'trees': bits 0-3 the share under trees (0-15), bits 4-6 the trees' height (0: under 4 m, then 4 m steps, 7: 28 m and over), bit 7
# needles (where Sentinel-2's summer near infrared, tools/s2/s2.py nir, is under NIR_NEEDLE: broad leaves reflect about twice what
# needles do; calibrated 29.10.2026 on dense, tall forest: the birch at Finnsnes has a median of 103 (p25 93), the spruce at Namsos 73
# (p75 81), Trondheim 75 and Kristiansand 76; 88 splits them). Norway's land only. Without the canopy file for the tile the layer is 0 and the game plants its old trees.
TREED = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'out', 'trees'); NIR_NEEDLE = 88
def trees_tile(tx, ty, L):
    out = np.zeros((1000, 1000), np.uint8); f = os.path.join(TREED, f'{tx}_{ty}.npz')
    if not os.path.exists(f): return {'trees': out}
    T = np.load(f); c25 = T['cover'].astype(np.float32) / 255; h25 = np.where(c25 > 0.02, T['height'].astype(np.float32) / 4, 0)
    cov = c25.reshape(1000, 2, 1000, 2).mean(axis=(1, 3)); h = h25.reshape(1000, 2, 1000, 2).max(axis=(1, 3))
    land = L['cover'] > 0
    c4 = np.clip(np.round(cov * 15), 0, 15).astype(np.uint8); hc = np.clip(np.floor(h / 4), 0, 7).astype(np.uint8)
    nd = np.zeros((1000, 1000), bool); g = os.path.join(S2D, f'{tx}_{ty}.npz')
    if os.path.exists(g):
        Z = np.load(g)
        if 'nir' in Z: nir = Z['nir']; nd = (nir > 0) & (nir < NIR_NEEDLE)
    v = c4 | (hc << 4) | (nd.astype(np.uint8) << 7)
    out = np.where(land & (c4 > 0), v, 0).astype(np.uint8)
    return {'trees': out}

def tile(tx, ty):
    f = os.path.join(TD, f'{tx}_{ty}.npz')
    if os.path.exists(f):
        z = dict(np.load(f))
        if 'cover' not in z: z['cover'] = cover_tile(tx, ty); np.savez_compressed(f, **z)   # a tile cached before the layer
        z = seafloor(z); z.update(sat_tile(tx, ty, z)); z.update(trees_tile(tx, ty, z)); return z
    t0 = time.time(); R = frame.Region(f't{tx}_{ty}', tx * 5, ty * 5, tx * 5 + 5, ty * 5 + 5); box = R.lonlat_box(1); out = {}
    ix0, iy0, nx, ny = R.grid(0.025)
    tab = features('base/land', box, ['geometry', 'subtype']); M = fill(polys_of(tab, lambda s: s == 'land'), 0.025, ix0, iy0, nx, ny) if tab is not None else np.zeros((ny, nx), np.uint8)
    bw = breakwaters(box)
    if bw: M = np.maximum(M, fill(bw, 0.025, ix0, iy0, nx, ny))
    out['mask'] = M
    # distance to land at 100 m: this tile's land at 25 m, and 20 km round it the national 200 m mask
    M2 = national.mask200(); P = 100   # 20 km of padding at 200 m
    gy0, gx0 = iy0 // 8 - P, ix0 // 8 - P; win = np.ones((250 + 2 * P, 250 + 2 * P), bool)
    sy0, sx0 = max(gy0, 0), max(gx0, 0); sy1, sx1 = min(gy0 + 250 + 2 * P, national.NY), min(gx0 + 250 + 2 * P, national.NX)
    win[sy0 - gy0:sy1 - gy0, sx0 - gx0:sx1 - gx0] = M2[sy0:sy1, sx0:sx1] > 0
    big = np.kron(win, np.ones((2, 2), bool)); own = M.reshape(ny // 4, 4, nx // 4, 4).max(axis=(1, 3)) > 0
    big[2 * P:2 * P + 500, 2 * P:2 * P + 500] = own
    out['dc'] = (ndimage.distance_transform_edt(~big)[2 * P:2 * P + 500, 2 * P:2 * P + 500] * 0.1).astype(np.float32)
    # the ground, a block at a time: z13 where the sea is within 3 km
    dsea = ndimage.distance_transform_edt(big)[2 * P:2 * P + 500, 2 * P:2 * P + 500] * 0.1
    H = np.zeros((ny, nx), np.int16); n = 400
    for j in range(5):
        for i in range(5):
            z = 13 if dsea[j * 100:(j + 1) * 100, i * 100:(i + 1) * 100].min() <= 3 else 11
            X, Y = np.meshgrid((ix0 + i * n + np.arange(n) + 0.5) * 0.025, (iy0 + j * n + np.arange(n) + 0.5) * 0.025)
            lon, lat = frame.to_ll(X.ravel(), Y.ravel()); h = terrain.sample(lon, lat, z).reshape(n, n); m = M[j * n:(j + 1) * n, i * n:(i + 1) * n] > 0
            H[j * n:(j + 1) * n, i * n:(i + 1) * n] = hgtEnc(np.where(m, np.maximum(h, 0.5), np.minimum(h, -0.5)))
    out['hgt'] = H
    fx0, fy0, fnx, fny = R.grid(0.05); lc = features('base/land_cover', box, ['geometry', 'subtype'])
    out['forest'] = fill(polys_of(lc, lambda s: s == 'forest'), 0.05, fx0, fy0, fnx, fny) if lc is not None else np.zeros((fny, fnx), np.uint8)
    out['cover'] = cover_tile(tx, ty)
    E = national.expo(); out['expo'] = E[ty * 100:(ty + 1) * 100, tx * 100:(tx + 1) * 100].copy()
    # depth (half metres): the model from openness and the distance to the shore; Kartverket's inside the legacy square
    X, Y = np.meshgrid((fx0 + np.arange(fnx) + 0.5) * 0.05, (fy0 + np.arange(fny) + 0.5) * 0.05)
    Ev = 0.2 + 0.8 * ndimage.zoom(out['expo'].astype(np.float32) / 255, 10, order=1)[:fny, :fnx]
    dcv = ndimage.zoom(out['dc'], 2, order=1)[:fny, :fnx]
    d = 2 + (13 + 220 * Ev ** 1.6 + 25 * vn(X / 4 + Y / 7, 5)) * sstep(0, 1.5, dcv) ** 0.6
    lon, lat = frame.to_ll(X, Y); lx, ly = frame.ll_to_leg(lon, lat); W, Hh = 2 * frame.LEG['KX'], 0.74 * frame.LEG['KY']
    ins = (lx >= 0) & (ly >= 0) & (lx <= W) & (ly <= Hh)
    kv = kartverket(tx, ty)
    if kv is not None:
        ok = np.isfinite(kv)
        if ok.any():
            dist, (iy, ix) = ndimage.distance_transform_edt(~ok, return_indices=True)
            w = np.clip(dist / 5, 0, 1); d = kv[iy, ix] * (1 - w) + d * w
    d = qdepth(d)   # (the legacy square keeps its own values: Senja's calibration was made on them)
    if ins.any(): d[ins] = legacy.at(legacy.load()['depth'], X[ins], Y[ins]) / 2
    land50 = M.reshape(fny, 2, fnx, 2).max(axis=(1, 3)) > 0
    out['depth'] = np.where(land50 & ~ins, 0, np.round(d * 2)).astype(np.int16)
    seafloor(out)
    out['sec'] = np.array(time.time() - t0)
    np.savez_compressed(f, **out); out.update(sat_tile(tx, ty, out)); out.update(trees_tile(tx, ty, out)); return out

# the vector layers of a tile (vectors.py), kept in out/national/vec/ (worked out again when a layer is missing); the lite profile has
# the buildings within 2 km of the sea; the quays need the tile's mask and depth (L, as tile() gives it)
VD = os.path.join(OUT, 'vec'); os.makedirs(VD, exist_ok=True)
VKEYS = ('bld', 'road', 'bridge', 'pier', 'quay', 'coast', 'water', 'shore')
def vec(tx, ty, L):
    f = os.path.join(VD, f'{tx}_{ty}.npz')
    if os.path.exists(f):
        z = np.load(f)
        if all(k in z for k in VKEYS): return {k: (z[k].tobytes(), int(z[k + '_n'])) for k in VKEYS}
    import vectors
    dsea = ndimage.distance_transform_edt(L['mask'] > 0) * 25   # m to the sea at 25 m
    near = lambda x, y: dsea[min(1999, max(0, int(y // 25))), min(1999, max(0, int(x // 25)))] <= 2000
    v = vectors.build(tx, ty, near, L)
    import water; v['water'] = water.build(tx, ty, L)   # the fresh water (G2, water.py)
    import shore; v['shore'] = shore.build(tx, ty, L)   # the beaches and the shingle (G10, shore.py)
    np.savez_compressed(f, **{k: np.frombuffer(b, np.uint8) for k, (b, n) in v.items()}, **{k + '_n': n for k, (b, n) in v.items()})
    return v
# the vector layers the game takes, in a 'vec' pack per tile (01c-vec.js): the 'view' packs keep their hash, so a new vector release does
# not fetch the heights again
VGAME = ('bld', 'road', 'bridge', 'pier', 'quay', 'water', 'shore')
# the NPC traffic of a tile (npc.py: harbours, fleets, grounds, routes), kept in out/national/npc/; worked out for all the tiles in
# parallel before the packs are written (a tile of a city is half a minute)
ND = os.path.join(OUT, 'npc'); os.makedirs(ND, exist_ok=True)
def npc_tile(t):
    tx, ty = t; f = os.path.join(ND, f'{tx}_{ty}.json')
    if not os.path.exists(f):
        import npc
        L = tile(tx, ty); b, n = npc.entry(tx, ty, L, vec(tx, ty, L)['quay'])
        open(f + '.part', 'wb').write(b); os.replace(f + '.part', f)
    b = open(f, 'rb').read(); return b, sum(len(h['b']) for h in json.loads(b)['h'])

# the chart's vectors of a tile (chart.py): the coast at 25 m and 3 m, and the names, kept in out/national/chart/ (region.cached)
def chart_tile(tx, ty):
    import chart
    b1, k1 = cached(f'coast1-{tx}-{ty}', lambda: chart.coast1(tx, ty)); b2, k2 = cached(f'coast2u-{tx}-{ty}', lambda: chart.coast2(tx, ty))
    nm = cached(f'names-{tx}-{ty}', lambda: chart.names(tx, ty))
    return {'coast1': (b1, k1, 'chart'), 'coast2': (b2, k2, 'chart'), 'names': (chart.names_bytes(nm), len(nm), 'chart')}

GAME = dict(mask=(0.025, 'u8', 'sim', None), dc=(0.1, 'f32', 'sim', None), depth=(0.05, 'i16', 'sim', 'half'), hgt=(0.025, 'i16', 'view', 'hgt'), forest=(0.05, 'u8', 'view', None), cover=(0.05, 'u8', 'view', None),
            sy=(0.05, 'i16', 'view', 'raw'), sco=(0.1, 'i16', 'view', 'raw'), scg=(0.1, 'i16', 'view', 'raw'), trees=(0.05, 'u8', 'view', None))
LAYERS = dict(mask=(0.025, 'u8', 'core', None), dc=(0.1, 'f32', 'core', None), expo=(0.5, 'u8', 'core', None), depth=(0.05, 'i16', 'sim', 'half'),
              hgt=(0.025, 'i16', 'view', 'hgt'), forest=(0.05, 'u8', 'view', None), cover=(0.05, 'u8', 'view', None))
if __name__ == '__main__':
    # part k of n of the coast's tiles, only into the caches (out/national/tiles, vec): the workflow runs the parts side by side
    if sys.argv[1:2] == ['cache']:
        k, n = int(sys.argv[2]), int(sys.argv[3]); T = [tuple(t) for t in national.tiles()][k::n]; t0 = time.time()
        for i, (tx, ty) in enumerate(T):
            L = tile(tx, ty); vec(tx, ty, L); chart_tile(tx, ty)
            print(f'part {k}/{n}: {i + 1}/{len(T)} tile {tx},{ty} {float(L["sec"]):.0f} s, total {time.time() - t0:.0f} s', file=sys.stderr, flush=True)
        sys.exit(0)
    if sys.argv[1:2] == ['game']:
        T = [tuple(map(int, a.split(','))) for a in sys.argv[2:]] or [tuple(t) for t in national.tiles()]; t0 = time.time(); per = []; vsz = {}; vct = {}
        import multiprocessing
        with multiprocessing.Pool(os.cpu_count()) as pool: NPC = dict(zip(T, pool.map(npc_tile, T)))
        print(f'npc: {sum(v[1] for v in NPC.values())} boats, {time.time() - t0:.0f} s', file=sys.stderr, flush=True)
        for k, (tx, ty) in enumerate(T):
            L = tile(tx, ty); V = dict(vec(tx, ty, L), npc=NPC[(tx, ty)]); per.append((tx, ty, {n: L[n] for n in GAME}, dict(chart_tile(tx, ty), **{n: V[n] for n in VGAME + ('npc',)})))
            for n in VGAME + ('npc',): vsz[n] = vsz.get(n, 0) + len(V[n][0]); vct[n] = vct.get(n, 0) + V[n][1]
            print(f'{k + 1}/{len(T)} tile {tx},{ty}, total {time.time() - t0:.0f} s', file=sys.stderr, flush=True)
        n, b = pack.write_tiles(per, GAME, os.path.join(OUT, 'game'), {'profile': 'game', 'src': 'tools/map/coast.py game'})
        vb = sum(p.stat().st_size for p in __import__('pathlib').Path(os.path.join(OUT, 'game')).glob('vec-*.wasm'))
        print(json.dumps({'tiles': len(T), 'packs': n, 'mb': round(b / 1e6, 1), 'vec_mb': round(vb / 1e6, 1), 'vec_raw_mb': {k: round(v / 1e6, 1) for k, v in vsz.items()}, 'vec_n': vct})); sys.exit(0)
    args = [a for a in sys.argv[1:] if a != 'lite']
    T = [tuple(map(int, a.split(','))) for a in args] or [tuple(t) for t in national.tiles()]
    t0 = time.time(); per = []
    for k, (tx, ty) in enumerate(T):
        L = tile(tx, ty); per.append((tx, ty, {n: L[n] for n in LAYERS}, vec(tx, ty, L)))
        print(f'{k + 1}/{len(T)} tile {tx},{ty} {float(L["sec"]):.0f} s, land {L["mask"].mean():.3f}, total {time.time() - t0:.0f} s', file=sys.stderr, flush=True)
    n, b = pack.write_tiles(per, LAYERS, os.path.join(OUT, 'lite'), {'profile': 'lite', 'src': 'tools/map/coast.py'})
    print(json.dumps({'tiles': len(T), 'packs': n, 'mb': round(b / 1e6, 1)}))
