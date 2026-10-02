# One region of the map through the pipeline (phase K5 of the coast plan), into the game's map packs:
#   mask    land at 25 m: Overture's land polygons (OpenStreetMap's coastline), filled at the cells' centres in the national frame,
#           and the breakwaters (Overture's infrastructure, which the coastline leaves out), widened by half a cell
#   dc      distance from open water to the land at 100 m (km): any land in a 100 m cell makes it 0, then Euclidean between centres
#           (mask and dc are 'sim' since phase K6: read near the boats; what looks far reads the national core, national.py)
#   hgt     the ground at 25 m: Terrarium z13 (Kartverket's 10 m terrain in Norway) on land, above 0; on the sea the sea floor from
#           the depth layer (Terrarium has the sea at 0 there, which the 3D view took for shallows everywhere)
#   forest  50 m: Overture's land cover 'forest' (ESA WorldCover 10 m)
#   depth   50 m, half metres: Kartverket's depth model as the legacy Senja raster has it (until Geonorge is open)
#   core    the national core (national.py core_layers: land200, dc200, expo), the same for every region
#   far     the far heights at 200 m (national.py far_layer) for the 3D view, a pack per coast tile with land
#   python3 tools/map/region.py senja [out]     (out: src/data/map, which the build copies to dist/map)
import os, sys, json, time, math, numpy as np
from scipy import ndimage
from shapely import from_wkb, affinity
import frame, terrain, legacy, pack
from ov import features

def polys_of(tab, keep):
    g = from_wkb(tab.column('geometry').to_numpy(zero_copy_only=False)); sub = tab.column('subtype').to_pylist()
    return [p for p, s in zip(g, sub) if keep(s) and p.geom_type in ('Polygon', 'MultiPolygon')]

# polygons (lon/lat) filled on a layer's cells: a cell is in when its centre is inside (even-odd per polygon, so holes are holes), and
# overlapping polygons add up. No outline: PIL's fill took in every cell an edge touched, and the land grew by up to a cell.
def fill(polys, c, ix0, iy0, nx, ny):
    R, X, P = [], [], []
    for k, p in enumerate(polys):
        for q in getattr(p, 'geoms', [p]):
            for ring in [q.exterior, *q.interiors]:
                a = np.asarray(ring.coords); x, y = frame.to_nat(a[:, 0], a[:, 1]); gx = x / c - ix0 - 0.5; gy = y / c - iy0 - 0.5   # cell centres at integers
                x0, y0, x1, y1 = gx[:-1], gy[:-1], gx[1:], gy[1:]; lo = np.minimum(y0, y1); hi = np.maximum(y0, y1)
                r0 = np.maximum(np.ceil(lo), 0).astype(np.int64); r1 = np.minimum(np.ceil(hi) - 1, ny - 1).astype(np.int64)   # rows with lo <= r < hi
                cnt = np.maximum(r1 - r0 + 1, 0); m = cnt > 0
                if not m.any(): continue
                e = np.repeat(np.flatnonzero(m), cnt[m]); rr = r0[e] + (np.arange(len(e)) - np.repeat(np.cumsum(cnt[m]) - cnt[m], cnt[m]))
                R.append(rr); X.append(x0[e] + (rr - y0[e]) * (x1[e] - x0[e]) / (y1[e] - y0[e])); P.append(np.full(len(e), k))
    out = np.zeros((ny, nx + 1), np.int32)
    if R:
        R = np.concatenate(R); X = np.concatenate(X); P = np.concatenate(P); o = np.lexsort((X, P, R)); R, X = R[o], X[o]
        a, b = R[0::2], np.stack([X[0::2], X[1::2]], 1) if len(R) % 2 == 0 else None
        c0 = np.clip(np.ceil(b[:, 0]), 0, nx).astype(np.int64); c1 = np.clip(np.floor(b[:, 1]) + 1, 0, nx).astype(np.int64); ok = c1 > c0
        np.add.at(out, (a[ok], c0[ok]), 1); np.add.at(out, (a[ok], c1[ok]), -1)
    return (np.cumsum(out, axis=1)[:, :nx] > 0).astype(np.uint8)

hgtEnc = lambda v: np.sign(v) * np.where(np.abs(v) < 9.75, np.round(np.abs(v) * 2), 20 + np.round((np.abs(v) - 10) / 2))

def build(R):
    t0 = time.time(); box = R.lonlat_box(); L = {}; log = {}
    land = polys_of(features('base/land', box, ['geometry', 'subtype']), lambda s: s == 'land')
    ix0, iy0, nx, ny = R.grid(0.025); M = fill(land, 0.025, ix0, iy0, nx, ny)
    # the breakwaters (OpenStreetMap's man_made=breakwater, which the coastline leaves out) are land too: a boat cannot cross Husøy's.
    # Widened by half a cell (in metres: lon scaled by cos lat), so one narrower than a cell stays whole
    inf = features('base/infrastructure', box, ['geometry', 'subtype', 'class']); bw = []
    for g, c in zip(from_wkb(inf.column('geometry').to_numpy(zero_copy_only=False)), inf.column('class').to_pylist()):
        if c != 'breakwater' or g is None: continue
        k = math.cos(math.radians(g.centroid.y)); w = affinity.scale(g, k, 1, origin=(0, 0)).buffer(0.0125 / 111.32, 4)
        bw.append(affinity.scale(w, 1 / k, 1, origin=(0, 0)))
    if bw: M = np.maximum(M, fill(bw, 0.025, ix0, iy0, nx, ny))
    log['breakwaters'] = len(bw)
    L['mask'] = dict(c=0.025, ix0=ix0, iy0=iy0, nx=nx, ny=ny, type='u8', kind='sim', arr=M); log['land'] = round(float(M.mean()), 4)
    # dc: 100 m cells with any land are 0; the rest the distance between centres to the nearest of those (km)
    any4 = M.reshape(ny // 4, 4, nx // 4, 4).max(axis=(1, 3)) > 0
    L['dc'] = dict(c=0.1, ix0=ix0 // 4, iy0=iy0 // 4, nx=nx // 4, ny=ny // 4, type='f32', kind='sim', arr=(ndimage.distance_transform_edt(~any4) * 0.1).astype(np.float32))
    # the ground: Terrarium z13 a block at a time, made to agree with the mask's shore
    H = np.zeros((ny, nx), np.int16); n = 400
    for j in range(ny // n):
        for i in range(nx // n):
            xs = (ix0 + i * n + np.arange(n) + 0.5) * 0.025; ys = (iy0 + j * n + np.arange(n) + 0.5) * 0.025; X, Y = np.meshgrid(xs, ys)
            lon, lat = frame.to_ll(X.ravel(), Y.ravel()); h = terrain.sample(lon, lat, 13).reshape(n, n); m = M[j * n:(j + 1) * n, i * n:(i + 1) * n] > 0
            h = np.where(m, np.maximum(h, 0.5), np.minimum(h, -0.5)); H[j * n:(j + 1) * n, i * n:(i + 1) * n] = hgtEnc(h)
    L['hgt'] = dict(c=0.025, ix0=ix0, iy0=iy0, nx=nx, ny=ny, type='i16', kind='view', dec='hgt', arr=H)
    lc = features('base/land_cover', box, ['geometry', 'subtype'])
    fx0, fy0, fnx, fny = R.grid(0.05); F = fill(polys_of(lc, lambda s: s == 'forest'), 0.05, fx0, fy0, fnx, fny)
    L['forest'] = dict(c=0.05, ix0=fx0, iy0=fy0, nx=fnx, ny=fny, type='u8', kind='view', arr=F); log['forest'] = round(float(F.mean()), 4)
    # the legacy rasters, read at the national cells
    G = legacy.load()
    dx0, dy0, dnx, dny = R.grid(0.05); X, Y = np.meshgrid((dx0 + np.arange(dnx) + 0.5) * 0.05, (dy0 + np.arange(dny) + 0.5) * 0.05)
    # outside the legacy square (the tiles reach past it) the game's depth model, as coast.py makes it for the coast's tiles: reading
    # the legacy raster there clamped it to its edge, and the edge's shallows ran out as stripes across the chart
    from coast import vn, sstep
    import national
    E = national.expo(); ex = E[dy0 // 10:(dy0 + dny) // 10, dx0 // 10:(dx0 + dnx) // 10].astype(np.float32) / 255
    Ev = 0.2 + 0.8 * ndimage.zoom(ex, 10, order=1)[:dny, :dnx]; dcv = ndimage.zoom(L['dc']['arr'], 2, order=1)[:dny, :dnx]
    dm = 2 + (13 + 220 * Ev ** 1.6 + 25 * vn(X / 4 + Y / 7, 5)) * sstep(0, 1.5, dcv) ** 0.6
    lon, lat = frame.to_ll(X, Y); lx, ly = frame.ll_to_leg(lon, lat); ins = (lx >= 0) & (ly >= 0) & (lx <= 2 * frame.LEG['KX']) & (ly <= 0.74 * frame.LEG['KY'])
    dep = np.where(ins, legacy.at(G['depth'], X, Y), np.round(dm * 2)); land50 = M.reshape(dny, 2, dnx, 2).max(axis=(1, 3)) > 0
    L['depth'] = dict(c=0.05, ix0=dx0, iy0=dy0, nx=dnx, ny=dny, type='i16', kind='sim', dec='half', arr=np.round(np.where(land50 & ~ins, 0, dep)).astype(np.int16))
    log['depthModel'] = round(float((~ins).mean()), 3)
    # the sea floor under the ground layer: the depth, 25 m from the 50 m cells
    dep = ndimage.zoom(L['depth']['arr'].astype(np.float32) / 2, 2, order=1)[:ny, :nx]
    L['hgt']['arr'] = np.where(M > 0, H, hgtEnc(-np.maximum(dep, 0.5))).astype(np.int16)
    import national
    L.update(national.core_layers())
    L.update(national.far_layer())   # the far heights (phase K8): their own packs, one per coast tile with land
    log['sec'] = round(time.time() - t0, 1)
    return L, log, chart_vec(R)

# the coast's rings per tile take minutes, and the land does not change within an Overture release: kept in out/national/chart/
def cached(name, make):
    import national, pickle
    f = os.path.join(national.OUT, 'chart', name + '.pkl')
    if os.path.exists(f): return pickle.load(open(f, 'rb'))
    v = make(); os.makedirs(os.path.dirname(f), exist_ok=True); pickle.dump(v, open(f, 'wb')); return v

# the chart's vectors (chart.py): the whole country's coast and names in the core, the region's tiles' coast and names in 'chart' packs
def chart_vec(R):
    import chart, national
    V = []; f0 = os.path.join(national.OUT, 'coast0.bin'); f1 = os.path.join(national.OUT, 'names0.json')
    if not os.path.exists(f0): open(f0, 'wb').write(chart.coast0()[0])
    if not os.path.exists(f1): json.dump(chart.names0(), open(f1, 'w'), ensure_ascii=False)
    c0 = open(f0, 'rb').read(); n0 = json.load(open(f1))
    V.append(('core', (0, 0), 'coast0', c0, 0)); V.append(('core', (0, 0), 'names0', chart.names_bytes(n0), len(n0)))
    for ty in range(R.by0 // 5, (R.by1 - 1) // 5 + 1):
        for tx in range(R.bx0 // 5, (R.bx1 - 1) // 5 + 1):
            b1, k1 = cached(f'coast1-{tx}-{ty}', lambda: chart.coast1(tx, ty)); b2, k2 = cached(f'coast2-{tx}-{ty}', lambda: chart.coast2(tx, ty)); nm = chart.names(tx, ty)
            V += [('chart', (tx, ty), 'coast1', b1, k1), ('chart', (tx, ty), 'coast2', b2, k2), ('chart', (tx, ty), 'names', chart.names_bytes(nm), len(nm))]
    return V

if __name__ == '__main__':
    R = frame.REGIONS[sys.argv[1]]; out = sys.argv[2] if len(sys.argv) > 2 else os.path.join(legacy.ROOT, 'src', 'data', 'map')
    L, log, V = build(R)
    n, b = pack.write(L, out, {'region': R.name, 'src': 'tools/map/region.py ' + R.name}, V)
    print(json.dumps(dict(log, packs=n, mb=round(b / 1e6, 2))))
