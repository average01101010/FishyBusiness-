# One region of the map through the pipeline (phase K5 of the coast plan), into the game's map packs:
#   mask    land at 25 m: Overture's land polygons (OpenStreetMap's coastline), filled at the cells' centres in the national frame
#   dc      distance from open water to the land at 100 m (km): any land in a 100 m cell makes it 0, then Euclidean between centres
#   hgt     the ground at 25 m: Terrarium z13 (Kartverket's 10 m terrain in Norway), above 0 on land and below on the sea
#   forest  50 m: Overture's land cover 'forest' (ESA WorldCover 10 m)
#   depth   50 m, half metres: Kartverket's depth model as the legacy Senja raster has it (until Geonorge is open)
#   expo    500 m, 0-255: the openness to the ocean, from the legacy Senja raster (until the national one replaces it)
#   python3 tools/map/region.py senja [out]     (out: src/data/map, which the build copies to dist/map)
import os, sys, json, time, numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage
from shapely import from_wkb
import frame, terrain, legacy, pack
from ov import features

def polys_of(tab, keep):
    g = from_wkb(tab.column('geometry').to_numpy(zero_copy_only=False)); sub = tab.column('subtype').to_pylist()
    return [p for p, s in zip(g, sub) if keep(s) and p.geom_type in ('Polygon', 'MultiPolygon')]

# polygons (lon/lat) filled on a layer's cells: a cell is in when its centre is (PIL's fill, holes cut after each polygon)
def fill(polys, c, ix0, iy0, nx, ny):
    im = Image.new('L', (nx, ny), 0); dr = ImageDraw.Draw(im)
    def ring(cs):
        a = np.asarray(cs); x, y = frame.to_nat(a[:, 0], a[:, 1]); return list(zip(x / c - 0.5 - ix0, y / c - 0.5 - iy0))
    for p in polys:
        for q in getattr(p, 'geoms', [p]):
            dr.polygon(ring(q.exterior.coords), fill=1)
            for h in q.interiors: dr.polygon(ring(h.coords), fill=0)
    return np.asarray(im, np.uint8)

hgtEnc = lambda v: np.sign(v) * np.where(np.abs(v) < 9.75, np.round(np.abs(v) * 2), 20 + np.round((np.abs(v) - 10) / 2))

def build(R):
    t0 = time.time(); box = R.lonlat_box(); L = {}; log = {}
    land = polys_of(features('base/land', box, ['geometry', 'subtype']), lambda s: s == 'land')
    ix0, iy0, nx, ny = R.grid(0.025); M = fill(land, 0.025, ix0, iy0, nx, ny)
    L['mask'] = dict(c=0.025, ix0=ix0, iy0=iy0, nx=nx, ny=ny, type='u8', kind='core', arr=M); log['land'] = round(float(M.mean()), 4)
    # dc: 100 m cells with any land are 0; the rest the distance between centres to the nearest of those (km)
    any4 = M.reshape(ny // 4, 4, nx // 4, 4).max(axis=(1, 3)) > 0
    L['dc'] = dict(c=0.1, ix0=ix0 // 4, iy0=iy0 // 4, nx=nx // 4, ny=ny // 4, type='f32', kind='core', arr=(ndimage.distance_transform_edt(~any4) * 0.1).astype(np.float32))
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
    L['depth'] = dict(c=0.05, ix0=dx0, iy0=dy0, nx=dnx, ny=dny, type='i16', kind='sim', dec='half', arr=np.round(legacy.at(G['depth'], X, Y)).astype(np.int16))
    ex0, ey0, enx, eny = R.grid(0.5); X, Y = np.meshgrid((ex0 + np.arange(enx) + 0.5) * 0.5, (ey0 + np.arange(eny) + 0.5) * 0.5)
    L['expo'] = dict(c=0.5, ix0=ex0, iy0=ey0, nx=enx, ny=eny, type='u8', kind='core', arr=np.round(legacy.at(G['expo'], X, Y)).astype(np.uint8))
    log['sec'] = round(time.time() - t0, 1)
    return L, log

if __name__ == '__main__':
    R = frame.REGIONS[sys.argv[1]]; out = sys.argv[2] if len(sys.argv) > 2 else os.path.join(legacy.ROOT, 'src', 'data', 'map')
    L, log = build(R)
    n, b = pack.write(L, out, {'region': R.name, 'src': 'tools/map/region.py ' + R.name})
    print(json.dumps(dict(log, packs=n, mb=round(b / 1e6, 2))))
