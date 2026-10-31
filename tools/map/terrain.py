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
