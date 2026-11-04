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
C200 = 0.2; NX, NY = round(frame.OLD[2] / C200), round(frame.OLD[3] / C200)   # the old frame at 200 m: 1450 x 1720 km (frame.OLD)
NYP = round(frame.OLD_Y1 / C200)   # its layers run to 1 750 km (whole tiles)

def mask200():
    f = os.path.join(OUT, 'land200.npy')
    if os.path.exists(f): return np.load(f)
    M = np.zeros((NY, NX), np.uint8); t0 = time.time(); S = 100   # chunks of 100 km
    X1, Y1 = frame.OLD[2], frame.OLD[3]
    for cy in range(0, Y1, S):
        for cx in range(0, X1, S):
            R = frame.Region('c', cx // 10, cy // 10, min(cx + S, X1) // 10, min(cy + S, Y1) // 10)
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
    tab = features('divisions/division_area', frame.Region('n', 0, 0, frame.OLD[2] // 10, frame.OLD[3] // 10).lonlat_box(0), ['geometry', 'subtype', 'class', 'country'])
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
    E = np.zeros((NY // 5 * 2, NX // 5 * 2), np.uint8); K = 48
    for tx, ty in tiles():
        ys, xs = np.mgrid[ty * 100:(ty + 1) * 100, tx * 100:(tx + 1) * 100]; px = (xs.ravel() + 0.5) * 0.5; py = (ys.ravel() + 0.5) * 0.5
        ok = (py < frame.OLD[3]) & (px < frame.OLD[2]); px, py = px[ok], py[ok]; gi = (py / C200).astype(int); gj = (px / C200).astype(int); wet = ~M[gi, gj]
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

# The far heights (phase K8 of the coast plan): the ground at 200 m for the 3D view's far terrain everywhere on the coast, and its
# near terrain where a tile has no detail yet. Terrarium z9 (about 100-160 m a pixel in Norway; Kartverket's terrain on land, the sea
# floor from GEBCO), bilinear at the 200 m cells' centres, made to agree with the 200 m land: land at least 1 m, sea at most -2 m.
# The tiles with land that are coast tiles or touch one (191); returns {(tx, ty): int16 in the page's packing of hgt (hgtEnc)}.
def far_tiles():
    TY, TX = NYP // 250, -(-NX // 250)   # 35 x 29 tiles
    T = tiles(); M = mask200(); coast = np.zeros((TY, TX), bool)
    for tx, ty in T: coast[ty, tx] = True
    near = ndimage.binary_dilation(coast, iterations=1)
    return [(tx, ty) for ty in range(TY) for tx in range(TX) if near[ty, tx] and M[ty * 250:(ty + 1) * 250, tx * 250:(tx + 1) * 250].any()]
def far200():
    f = os.path.join(OUT, 'far200.npz')
    if os.path.exists(f): z = np.load(f); return {tuple(map(int, k.split('_'))): z[k] for k in z.files}
    import terrain
    from region import hgtEnc
    M = mask200(); out = {}; t0 = time.time()
    for k, (tx, ty) in enumerate(far_tiles()):
        X, Y = np.meshgrid((tx * 250 + np.arange(250) + 0.5) * C200, (ty * 250 + np.arange(250) + 0.5) * C200)
        lon, lat = frame.to_ll(X.ravel(), Y.ravel()); h = terrain.sample(lon, lat, 9).reshape(250, 250)
        # the source has a few spikes (4 378 m in Rogaland): a cell 400 m over its neighbours' median takes the median, and nothing
        # goes over Galdhøpiggen
        md = ndimage.median_filter(h, 3); h = np.minimum(np.where(h > md + 400, md, h), 2470)
        m = np.zeros((250, 250), bool); sub = M[ty * 250:(ty + 1) * 250, tx * 250:(tx + 1) * 250] > 0; m[:sub.shape[0], :sub.shape[1]] = sub
        out[(tx, ty)] = hgtEnc(np.where(m, np.maximum(h, 1), np.minimum(h, -2))).astype(np.int16)
        if k % 20 == 0: print('far tile', k, tx, ty, round(time.time() - t0), 's', file=sys.stderr, flush=True)
    np.savez_compressed(f, **{f'{tx}_{ty}': v for (tx, ty), v in out.items()}); return out
def far_layer():
    F = far200(); A = np.zeros((NYP, NX), np.int16)
    for (tx, ty), v in F.items(): A[ty * 250:(ty + 1) * 250, tx * 250:(tx + 1) * 250] = v
    return {'far': dict(c=0.2, n=250, ix0=0, iy0=0, nx=NX, ny=NYP, type='i16', kind='far', dec='hgt', arr=A, keep={(tx, ty) for tx, ty in F})}

# The national core (phase K6): always loaded, for what looks far (the fetch rays, the local fleet, the depth model, the sea off the
# tiles with detail): land at 200 m, the distance to it in 100 m steps to 25.5 km (u8, at 200 m), and the openness at 500 m. The
# layers cover the frame padded to 1 750 km south (35 tiles of 50 km), in blocks of 50 km.
def core_layers():
    M = mask200(); E = expo().copy()
    # the open sea off the coast's tiles (worked out only there) is open: 255
    land500 = M[((np.arange(E.shape[0]) + 0.5) * 2.5).astype(int).clip(0, NY - 1)][:, ((np.arange(E.shape[1]) + 0.5) * 2.5).astype(int).clip(0, NX - 1)] > 0
    E[(E == 0) & ~land500] = 255
    pad = lambda a, ny, v=0: np.vstack([a, np.full((ny - a.shape[0], a.shape[1]), v, a.dtype)])
    DC = np.minimum(np.round(ndimage.distance_transform_edt(M == 0) * 2), 255).astype(np.uint8)
    return {'land200': dict(c=0.2, n=250, ix0=0, iy0=0, nx=NX, ny=NYP, type='u8', kind='core', arr=pad(M, NYP)),
            'dc200': dict(c=0.2, n=250, ix0=0, iy0=0, nx=NX, ny=NYP, type='u8p', kind='core', dec='dm', arr=pad(DC, NYP)),
            'expo': dict(c=0.5, n=100, ix0=0, iy0=0, nx=NX // 5 * 2, ny=NYP // 5 * 2, type='u8p', kind='core', arr=pad(E, NYP // 5 * 2, 255))}

# ---------- The wide frame (H1b R2 of the ocean step, 03.11.2026; docs/planer/havsteget-h1b-rammen.md 3a) ----------
# The frame takes in East Greenland, Iceland, Jan Mayen, Svalbard and the Russian zone (frame.FRAME). The old core stays as it was;
# over the rest the core gets coarse layers that are always loaded (what looks far reads them by position alone, farL in
# 01-world.js), and the land at 200 m off the old frame comes in packs per 50 km tile, for the screens and the 3D view only:
#   python3 tools/map/national.py wide     land at 200 m over frame.WIDE (Overture, its own wide index; inside the old frame the
#                                          old land200 as it is), kept as out/national/wide200.npz
#   python3 tools/map/national.py coarse   land1k (a 1 km cell is land when most of its 25 cells are), dc1k (the distance to it in
#                                          0.5 km steps to 127.5 km) and expo2k (the openness on 2 km cells, the rays of expo() on
#                                          the 1 km land) over frame.WIDE: out/national/coarse.npz
#   python3 tools/map/national.py farx     the far heights (Terrarium z9 matched to the 200 m land) for the tiles off the old frame
#                                          that have land near the sea: out/national/farx.npz
WX0, WY0, WX1, WY1 = frame.WIDE; WNX, WNY = round((WX1 - WX0) / C200), round((WY1 - WY0) / C200)   # 18 000 x 15 500
def wide200():
    f = os.path.join(OUT, 'wide200.npz')
    if os.path.exists(f): return np.unpackbits(np.load(f)['m'], axis=1)[:, :WNX]
    M = np.zeros((WNY, WNX), np.uint8); t0 = time.time(); S = 100; ox, oy = round(-WX0 / C200), round(-WY0 / C200)
    for cy in range(WY0, WY1, S):
        for cx in range(WX0, WX1, S):
            if cx >= 0 and cy >= 0 and cx + S <= frame.OLD[2] and cy + S <= frame.OLD[3]: continue   # inside the old frame: land200 below
            R = frame.Region('w', cx // 10, cy // 10, (cx + S) // 10, (cy + S) // 10)
            tab = features('base/land', R.lonlat_box(1), ['geometry', 'subtype'], wide=True)
            if tab is None or tab.num_rows == 0: continue
            ix0, iy0, nx, ny = R.grid(C200)
            M[iy0 + oy:iy0 + oy + ny, ix0 + ox:ix0 + ox + nx] |= fill(polys_of(tab, lambda s: s == 'land'), C200, ix0, iy0, nx, ny)
        print('wide row', cy, 'km,', round(time.time() - t0), 's', file=sys.stderr, flush=True)
    M[oy:oy + NY, ox:ox + NX] = mask200()   # the old frame's land as the old core has it
    np.savez_compressed(f, m=np.packbits(M, axis=1)); return M

def coarse():
    f = os.path.join(OUT, 'coarse.npz')
    if os.path.exists(f): z = np.load(f); return {k: z[k] for k in z.files}
    W = wide200(); ny, nx = WNY // 5, WNX // 5
    L1 = (W.reshape(ny, 5, nx, 5).sum(axis=(1, 3), dtype=np.int16) >= 13); del W
    D1 = ndimage.distance_transform_edt(~L1)   # km
    DC = np.minimum(np.round(D1 * 2), 255).astype(np.uint8)
    # the openness on 2 km cells: a cell is sea when most of its four 1 km cells are; 48 rays on the 1 km land as expo() casts them
    # on the 200 m land, to 150 km (a ray off the wide frame is open); farther than 150 km from land everything is open
    my, mx = ny // 2, nx // 2; sea2 = (~L1).reshape(my, 2, mx, 2).sum(axis=(1, 3)) >= 2
    D2 = D1.reshape(my, 2, mx, 2).min(axis=(1, 3)); E = np.where(sea2, 255, 0).astype(np.uint8)
    jj, ii = np.nonzero(sea2 & (D2 < 150)); px = (ii + 0.5) * 2.0; py = (jj + 0.5) * 2.0; K = 48; t0 = time.time()
    for a0 in range(0, len(px), 200000):
        x0s, y0s = px[a0:a0 + 200000], py[a0:a0 + 200000]; D = np.zeros((len(x0s), K), np.float32)
        for k in range(K):
            a = 2 * np.pi * k / K; dx, dy = np.sin(a), -np.cos(a); x, y, s = x0s.copy(), y0s.copy(), np.zeros(len(x0s)); act = np.ones(len(x0s), bool)
            for it in range(400):
                if not act.any(): break
                idx = np.flatnonzero(act); i = np.floor(y[idx]).astype(int); j = np.floor(x[idx]).astype(int)
                out = (i < 0) | (j < 0) | (i >= ny) | (j >= nx); i2 = np.clip(i, 0, ny - 1); j2 = np.clip(j, 0, nx - 1)
                hit = L1[i2, j2] & ~out; done = hit | out | (s[idx] >= 150); s[idx[out]] = 150; act[idx[done]] = False
                st = np.maximum(0.5, 0.95 * D1[i2, j2][~done] - 0.7); ii2 = idx[~done]; x[ii2] += dx * st; y[ii2] += dy * st; s[ii2] += st
            D[:, k] = np.minimum(s, 150)
        v = np.clip(EXPO_FIT[0] * np.minimum(D, 10).mean(1) / 10 + EXPO_FIT[1] * (D >= 150).mean(1), 0, 1)
        E[jj[a0:a0 + 200000], ii[a0:a0 + 200000]] = np.round(v * 255).astype(np.uint8)
        print('expo2k', a0 + len(x0s), 'of', len(px), round(time.time() - t0), 's', file=sys.stderr, flush=True)
    z = dict(land1k=L1.astype(np.uint8), dc1k=DC, expo2k=E); np.savez_compressed(f, **z); return z

# the far heights off the old frame: tiles with land that have the sea in them or next to them (the 3D view sees the far terrain from
# the sea), as far200() makes them for the coast; {(tx, ty): int16 (hgtEnc)}
def farx_tiles():
    W = wide200(); tx0, ty0, tx1, ty1 = frame.FRAME_TILES; ox, oy = round(-WX0 / C200), round(-WY0 / C200)
    land = np.zeros((ty1 - ty0, tx1 - tx0), bool); sea = np.zeros_like(land)
    for ty in range(ty0, ty1):
        for tx in range(tx0, tx1):
            t = W[ty * 250 + oy:(ty + 1) * 250 + oy, tx * 250 + ox:(tx + 1) * 250 + ox]; land[ty - ty0, tx - tx0] = t.any(); sea[ty - ty0, tx - tx0] = not t.all()
    near = ndimage.binary_dilation(sea, iterations=1) & land
    return [(tx, ty) for ty in range(ty0, ty1) for tx in range(tx0, tx1) if near[ty - ty0, tx - tx0] and not frame.in_old(tx, ty)]
def farx():
    f = os.path.join(OUT, 'farx.npz')
    if os.path.exists(f): z = np.load(f); return {tuple(map(int, k.split('_'))): z[k] for k in z.files}
    import terrain
    from region import hgtEnc
    W = wide200(); ox, oy = round(-WX0 / C200), round(-WY0 / C200); out = {}; t0 = time.time()
    for k, (tx, ty) in enumerate(farx_tiles()):
        X, Y = np.meshgrid((tx * 250 + np.arange(250) + 0.5) * C200, (ty * 250 + np.arange(250) + 0.5) * C200)
        lon, lat = frame.to_ll(X.ravel(), Y.ravel()); h = terrain.sample(lon, lat, 9).reshape(250, 250)
        md = ndimage.median_filter(h, 3); h = np.minimum(np.where(h > md + 400, md, h), 3700)   # (Greenland's ice sheet reaches 3 700 m)
        m = W[ty * 250 + oy:(ty + 1) * 250 + oy, tx * 250 + ox:(tx + 1) * 250 + ox] > 0
        out[(tx, ty)] = hgtEnc(np.where(m, np.maximum(h, 1), np.minimum(h, -2))).astype(np.int16)
        if k % 50 == 0: print('farx tile', k, tx, ty, round(time.time() - t0), 's', file=sys.stderr, flush=True)
    np.savez_compressed(f, **{f'{tx}_{ty}': v for (tx, ty), v in out.items()}); return out

if __name__ == '__main__':
    st = sys.argv[1]
    if st == 'mask200':
        M = mask200(); print(json.dumps({'land': round(float(M.mean()), 4), 'km2': int(M.sum() * C200 * C200)}))
    elif st == 'far':
        F = far200(); import zlib, pack
        print(json.dumps({'tiles': len(F), 'mb': round(sum(len(pack.raw_deflate(pack.med16(v))) for v in F.values()) / 1e6, 2)}))
    elif st == 'tiles':
        T = tiles(); L, S = norway200(); print(json.dumps({'tiles': len(T), 'norwayLandKm2': int(L.sum() * 0.04), 'norwaySeaKm2': int(S.sum() * 0.04)}))
    elif st == 'expo':
        E = expo(); print(json.dumps({'cells': int((E > 0).sum())}))
    elif st == 'wide':
        W = wide200(); print(json.dumps({'land': round(float(W.mean()), 4), 'km2': int(W.sum() * C200 * C200)}))
    elif st == 'coarse':
        z = coarse(); print(json.dumps({k: [list(v.shape), int(v.min()), int(v.max()), round(float(v.mean()), 3)] for k, v in z.items()}))
    elif st == 'farx':
        F = farx(); import pack
        print(json.dumps({'tiles': len(F), 'mb': round(sum(len(pack.raw_deflate(pack.med16(v))) for v in F.values()) / 1e6, 2)}))
