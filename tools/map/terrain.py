# Terrarium tiles (Mapzen/AWS elevation-tiles-prod; for Norway Kartverket's 10 m terrain at z13), cached in cache/terrarium/,
# sampled bilinearly at points given in lon/lat. The heights are metres, the sea floor negative where the source has it.
import math, os, requests, numpy as np, concurrent.futures as cf
from PIL import Image
URL = 'https://elevation-tiles-prod.s3.amazonaws.com/terrarium/{z}/{x}/{y}.png'
D = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'cache', 'terrarium'); os.makedirs(D, exist_ok=True)
S = requests.Session()
def get(z, x, y):
    p = f'{D}/{z}_{x}_{y}.png'
    if not os.path.exists(p):
        for k in range(5):
            try:
                r = S.get(URL.format(z=z, x=x, y=y), timeout=60)
                if r.status_code == 404: open(p, 'wb').close(); break
                r.raise_for_status(); open(p + '.part', 'wb').write(r.content); os.replace(p + '.part', p); break
            except Exception:
                if k == 4: raise
    return p
def heights(p):
    if os.path.getsize(p) == 0: return np.full((256, 256), -1.0, np.float32)
    a = np.asarray(Image.open(p).convert('RGB')).astype(np.float32)
    return a[..., 0] * 256 + a[..., 1] + a[..., 2] / 256 - 32768
# pixel coordinates (float, of the whole zoom level) of lon/lat
def px(lon, lat, z):
    n = 2 ** z * 256; r = np.radians(lat)
    return (np.asarray(lon) + 180) / 360 * n, (1 - np.log(np.tan(r) + 1 / np.cos(r)) / np.pi) / 2 * n
# heights at many points: the tiles they need are fetched (in parallel) and stitched, then read between the four pixel centres
def sample(lon, lat, z=13):
    X, Y = px(lon, lat, z); X = X - 0.5; Y = Y - 0.5
    tx0, ty0, tx1, ty1 = int(np.floor(X.min())) // 256, int(np.floor(Y.min())) // 256, int(np.floor(X.max()) + 1) // 256, int(np.floor(Y.max()) + 1) // 256
    ts = [(x, y) for x in range(tx0, tx1 + 1) for y in range(ty0, ty1 + 1)]
    with cf.ThreadPoolExecutor(16) as ex: list(ex.map(lambda t: get(z, *t), ts))
    g = np.zeros(((ty1 - ty0 + 1) * 256, (tx1 - tx0 + 1) * 256), np.float32)
    for (x, y) in ts: g[(y - ty0) * 256:(y - ty0 + 1) * 256, (x - tx0) * 256:(x - tx0 + 1) * 256] = heights(f'{D}/{z}_{x}_{y}.png')
    gx = np.clip(X - tx0 * 256, 0, g.shape[1] - 1.001); gy = np.clip(Y - ty0 * 256, 0, g.shape[0] - 1.001)
    ix = gx.astype(int); iy = gy.astype(int); fx = gx - ix; fy = gy - iy
    return (g[iy, ix] * (1 - fx) + g[iy, ix + 1] * fx) * (1 - fy) + (g[iy + 1, ix] * (1 - fx) + g[iy + 1, ix + 1] * fx) * fy

# Copernicus DEM GLO-30 (30 m, from TanDEM-X; open on AWS as Cloud-Optimised GeoTIFFs, s3://copernicus-dem-30m, read over HTTPS without
# an account), for the islands off the old frame (H1b R3, 04.11.2026): Terrarium has no fine source north of Norway's mainland (z11 and
# z13 gave the same at Longyearbyen, and the shore's sea cells were 7.6 m high in the median, so the 3D shore stood as a wall). Heights
# over the sea level (EGM2008), a surface model (the roofs and the glaciers' tops are in it). Free for any use, commercial too, with
# the source given: «© DLR e.V. 2010-2014 and © Airbus Defence and Space GmbH 2014-2018 provided under COPERNICUS by the European Union
# and ESA». One file per degree, cached in cache/cop30/; NaN where there is none (the open sea has no file).
COP = 'https://copernicus-dem-30m.s3.amazonaws.com/{n}/{n}.tif'
CD = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'cache', 'cop30'); os.makedirs(CD, exist_ok=True)
def cop_file(la, lo):
    n = f'Copernicus_DSM_COG_10_{"N" if la >= 0 else "S"}{abs(la):02d}_00_{"E" if lo >= 0 else "W"}{abs(lo):03d}_00_DEM'; p = f'{CD}/{n}.tif'
    if not os.path.exists(p):
        for k in range(5):
            try:
                r = S.get(COP.format(n=n), timeout=300)
                if r.status_code in (403, 404): open(p, 'wb').close(); break
                r.raise_for_status(); open(p + '.part', 'wb').write(r.content); os.replace(p + '.part', p); break
            except Exception:
                if k == 4: raise
    return p
def sample_cop(lon, lat):
    import rasterio
    lon = np.asarray(lon, float); lat = np.asarray(lat, float); out = np.full(lon.shape, np.nan, np.float32)
    LA, LO = np.floor(lat).astype(int), np.floor(lon).astype(int)
    for la, lo in sorted(set(zip(LA.ravel().tolist(), LO.ravel().tolist()))):
        p = cop_file(la, lo)
        if os.path.getsize(p) == 0: continue
        with rasterio.open(p) as src: g = src.read(1).astype(np.float32); T = ~src.transform
        m = (LA == la) & (LO == lo); c, r = T * (lon[m], lat[m]); c = np.clip(c - 0.5, 0, g.shape[1] - 1.001); r = np.clip(r - 0.5, 0, g.shape[0] - 1.001)
        ix = c.astype(int); iy = r.astype(int); fx = c - ix; fy = r - iy
        out[m] = (g[iy, ix] * (1 - fx) + g[iy, ix + 1] * fx) * (1 - fy) + (g[iy + 1, ix] * (1 - fx) + g[iy + 1, ix + 1] * fx) * fy
    return out
