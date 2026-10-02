# The whole coast through the pipeline (phase K5 of the coast plan), in stages that each keep their result in out/national/:
#   python3 tools/map/national.py mask200     land over the whole frame (x 0-1450, y 0-1720 km) at 200 m, from Overture, with
#                                             Norway's land and sea area from Overture's divisions; Sweden, Finland, Russia and
#                                             Denmark are land as much as Norway is, for the rays that look out to sea
#   python3 tools/map/national.py tiles       the 50 km tiles of the coast: Norwegian sea within 20 km of land, or land within 3 km
#                                             of the sea
#   python3 tools/map/national.py expo        the openness to the ocean at 500 m on the coast's tiles (48 rays on the 200 m mask:
#                                             0.585 x the mean open share within 10 km + 1.009 x the share of rays open to 150 km,
#                                             fitted to the legacy Senja raster: correlation 0.95, error 0.125 on 0-1)
import os, sys, json, time, numpy as np
from scipy import ndimage
import frame
from region import polys_of, fill
from ov import features
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'out', 'national'); os.makedirs(OUT, exist_ok=True)
C200, NX, NY = 0.2, 7250, 8600   # the frame at 200 m: 1450 x 1720 km

def mask200():
    f = os.path.join(OUT, 'land200.npy')
    if os.path.exists(f): return np.load(f)
    M = np.zeros((NY, NX), np.uint8); t0 = time.time(); S = 100   # chunks of 100 km
    for cy in range(0, 1720, S):
        for cx in range(0, 1450, S):
            R = frame.Region('c', cx // 10, cy // 10, min(cx + S, 1450) // 10, min(cy + S, 1720) // 10)
            box = R.lonlat_box(1)
            tab = features('base/land', box, ['geometry', 'subtype'])
            if tab is None or tab.num_rows == 0: continue
            ix0, iy0, nx, ny = R.grid(C200)
            M[iy0:iy0 + ny, ix0:ix0 + nx] |= fill(polys_of(tab, lambda s: s == 'land'), C200, ix0, iy0, nx, ny)
        print('row', cy, 'km,', round(time.time() - t0), 's, land', round(float(M[:(cy + S) * 5].mean()), 3), file=sys.stderr, flush=True)
    np.save(f, M); return M

# Norway's land and sea (Overture divisions: the country's land area and its maritime area out to the territorial limit) at 200 m
def norway200():
    f = os.path.join(OUT, 'norway200.npz')
    if os.path.exists(f): z = np.load(f); return z['land'], z['sea']
    tab = features('divisions/division_area', frame.Region('n', 0, 0, 145, 172).lonlat_box(0), ['geometry', 'subtype', 'class', 'country'])
    from shapely import from_wkb
    g = from_wkb(tab.column('geometry').to_numpy(zero_copy_only=False)); sub = tab.column('subtype').to_pylist(); cls = tab.column('class').to_pylist(); cc = tab.column('country').to_pylist()
    land = [x for x, s, c, k in zip(g, sub, cls, cc) if s == 'country' and c == 'land' and k == 'NO' and x.geom_type in ('Polygon', 'MultiPolygon')]
    sea = [x for x, s, c, k in zip(g, sub, cls, cc) if s == 'country' and c == 'maritime' and k == 'NO' and x.geom_type in ('Polygon', 'MultiPolygon')]
    L = fill(land, C200, 0, 0, NX, NY).astype(bool); S = fill(sea, C200, 0, 0, NX, NY).astype(bool) & ~L
    np.savez_compressed(f, land=L, sea=S); return L, S

# the coast's tiles: 50 km tiles with Norwegian sea within 20 km of land, or Norwegian land within 3 km of the sea
def tiles():
    f = os.path.join(OUT, 'tiles.json')
    if os.path.exists(f): return json.load(open(f))
    M = mask200().astype(bool); NL, NS = norway200()
    sea = ~M; dland = ndimage.distance_transform_edt(sea) * C200; dsea = ndimage.distance_transform_edt(M) * C200
    want = (NS & sea & (dland <= 20)) | (NL & M & (dsea <= 3))
    T = 250   # 50 km in 200 m cells
    out = [[tx, ty] for ty in range(NY // T + 1) for tx in range(NX // T + 1) if want[ty * T:(ty + 1) * T, tx * T:(tx + 1) * T].any()]
    json.dump(out, open(f, 'w')); return out

# the openness to the ocean at 500 m over the coast's tiles (sea cells; land gets 0)
EXPO_FIT = (0.585, 1.009)
def expo():
    f = os.path.join(OUT, 'expo500.npy')
    if os.path.exists(f): return np.load(f)
    M = mask200().astype(bool); DL = ndimage.distance_transform_edt(~M) * C200
    E = np.zeros((1720 * 2, 1450 * 2), np.uint8); K = 48
    for tx, ty in tiles():
        ys, xs = np.mgrid[ty * 100:(ty + 1) * 100, tx * 100:(tx + 1) * 100]; px = (xs.ravel() + 0.5) * 0.5; py = (ys.ravel() + 0.5) * 0.5
        ok = (py < 1720) & (px < 1450); px, py = px[ok], py[ok]; gi = (py / C200).astype(int); gj = (px / C200).astype(int); wet = ~M[gi, gj]
        px, py = px[wet], py[wet]; D = np.zeros((len(px), K), np.float32)
        for k in range(K):
            a = 2 * np.pi * k / K; dx, dy = np.sin(a), -np.cos(a); x, y, s = px.copy(), py.copy(), np.zeros(len(px)); act = np.ones(len(px), bool)
            for it in range(400):
                if not act.any(): break
                idx = np.flatnonzero(act); i = (y[idx] / C200).astype(int); j = (x[idx] / C200).astype(int)
                out = (i < 0) | (j < 0) | (i >= NY) | (j >= NX); i2 = np.clip(i, 0, NY - 1); j2 = np.clip(j, 0, NX - 1)
                hit = M[i2, j2] & ~out; done = hit | out | (s[idx] >= 150); s[idx[out]] = 150; act[idx[done]] = False
                st = np.maximum(0.2, 0.95 * DL[i2, j2][~done] - 0.15); ii = idx[~done]; x[ii] += dx * st; y[ii] += dy * st; s[ii] += st
            D[:, k] = np.minimum(s, 150)
        v = np.clip(EXPO_FIT[0] * np.minimum(D, 10).mean(1) / 10 + EXPO_FIT[1] * (D >= 150).mean(1), 0, 1)
        E[(py / 0.5).astype(int), (px / 0.5).astype(int)] = np.round(v * 255).astype(np.uint8)
        print('expo tile', tx, ty, len(px), file=sys.stderr, flush=True)
    np.save(f, E); return E

if __name__ == '__main__':
    st = sys.argv[1]
    if st == 'mask200':
        M = mask200(); print(json.dumps({'land': round(float(M.mean()), 4), 'km2': int(M.sum() * C200 * C200)}))
    elif st == 'tiles':
        T = tiles(); L, S = norway200(); print(json.dumps({'tiles': len(T), 'norwayLandKm2': int(L.sum() * 0.04), 'norwaySeaKm2': int(S.sum() * 0.04)}))
    elif st == 'expo':
        E = expo(); print(json.dumps({'cells': int((E > 0).sum())}))
