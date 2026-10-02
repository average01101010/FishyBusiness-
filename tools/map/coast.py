# The coast's tiles through the pipeline (phase K5 of the coast plan): every 50 km tile of national.py's list, the lite profile
# (the artifact's): mask 25 m, distance to land 100 m, ground 25 m, forest 50 m, depth 50 m and openness 500 m, as map packs in
# out/national/lite/ (a pack per kind and tile, the core per tile too). Kept per tile in out/national/tiles/, so a stopped run goes on.
#   python3 tools/map/coast.py [lite] [tx,ty ...]
#   ground  Terrarium z13 (Kartverket's 10 m) in the 10 km blocks within 3 km of the sea, z11 (about 30 m) in the others
#   depth   Kartverket's (the legacy Senja raster) inside the legacy square; elsewhere, until Geonorge is open to the pipeline, the
#           game's own depth model (depthModel in 03-simulation.js: openness, distance to the shore and a little noise)
import os, sys, json, time, numpy as np
from scipy import ndimage
import frame, terrain, legacy, pack, national
from region import polys_of, fill, hgtEnc
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

def tile(tx, ty):
    f = os.path.join(TD, f'{tx}_{ty}.npz')
    if os.path.exists(f): return dict(np.load(f))
    t0 = time.time(); R = frame.Region(f't{tx}_{ty}', tx * 5, ty * 5, tx * 5 + 5, ty * 5 + 5); box = R.lonlat_box(1); out = {}
    ix0, iy0, nx, ny = R.grid(0.025)
    tab = features('base/land', box, ['geometry', 'subtype']); M = fill(polys_of(tab, lambda s: s == 'land'), 0.025, ix0, iy0, nx, ny) if tab is not None else np.zeros((ny, nx), np.uint8)
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
    E = national.expo(); out['expo'] = E[ty * 100:(ty + 1) * 100, tx * 100:(tx + 1) * 100].copy()
    # depth (half metres): the model from openness and the distance to the shore; Kartverket's inside the legacy square
    X, Y = np.meshgrid((fx0 + np.arange(fnx) + 0.5) * 0.05, (fy0 + np.arange(fny) + 0.5) * 0.05)
    Ev = 0.2 + 0.8 * ndimage.zoom(out['expo'].astype(np.float32) / 255, 10, order=1)[:fny, :fnx]
    dcv = ndimage.zoom(out['dc'], 2, order=1)[:fny, :fnx]
    d = 2 + (13 + 220 * Ev ** 1.6 + 25 * vn(X / 4 + Y / 7, 5)) * sstep(0, 1.5, dcv) ** 0.6
    lon, lat = frame.to_ll(X, Y); lx, ly = frame.ll_to_leg(lon, lat); W, Hh = 2 * frame.LEG['KX'], 0.74 * frame.LEG['KY']
    ins = (lx >= 0) & (ly >= 0) & (lx <= W) & (ly <= Hh)
    if ins.any(): d[ins] = legacy.at(legacy.load()['depth'], X[ins], Y[ins]) / 2
    land50 = M.reshape(fny, 2, fnx, 2).max(axis=(1, 3)) > 0
    out['depth'] = np.where(land50 & ~ins, 0, np.round(d * 2)).astype(np.int16)
    out['sec'] = np.array(time.time() - t0)
    np.savez_compressed(f, **out); return out

# the vector layers of a tile (vectors.py), kept in out/national/vec/; the lite profile has the buildings within 2 km of the sea
VD = os.path.join(OUT, 'vec'); os.makedirs(VD, exist_ok=True)
def vec(tx, ty, M):
    f = os.path.join(VD, f'{tx}_{ty}.npz')
    if os.path.exists(f): z = np.load(f); return {k: (z[k].tobytes(), int(z[k + '_n'])) for k in ('bld', 'road', 'pier', 'coast')}
    import vectors
    dsea = ndimage.distance_transform_edt(M > 0) * 25   # m to the sea at 25 m
    near = lambda x, y: dsea[min(1999, max(0, int(y // 25))), min(1999, max(0, int(x // 25)))] <= 2000
    v = vectors.build(tx, ty, near)
    np.savez_compressed(f, **{k: np.frombuffer(b, np.uint8) for k, (b, n) in v.items()}, **{k + '_n': n for k, (b, n) in v.items()})
    return v

LAYERS = dict(mask=(0.025, 'u8', 'core', None), dc=(0.1, 'f32', 'core', None), expo=(0.5, 'u8', 'core', None), depth=(0.05, 'i16', 'sim', 'half'),
              hgt=(0.025, 'i16', 'view', 'hgt'), forest=(0.05, 'u8', 'view', None))
if __name__ == '__main__':
    args = [a for a in sys.argv[1:] if a != 'lite']
    T = [tuple(map(int, a.split(','))) for a in args] or [tuple(t) for t in national.tiles()]
    t0 = time.time(); per = []
    for k, (tx, ty) in enumerate(T):
        L = tile(tx, ty); per.append((tx, ty, {n: L[n] for n in LAYERS}, vec(tx, ty, L['mask'])))
        print(f'{k + 1}/{len(T)} tile {tx},{ty} {float(L["sec"]):.0f} s, land {L["mask"].mean():.3f}, total {time.time() - t0:.0f} s', file=sys.stderr, flush=True)
    n, b = pack.write_tiles(per, LAYERS, os.path.join(OUT, 'lite'), {'profile': 'lite', 'src': 'tools/map/coast.py'})
    print(json.dumps({'tiles': len(T), 'packs': n, 'mb': round(b / 1e6, 1)}))
