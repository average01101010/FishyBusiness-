# Terrarium tiles (AWS elevation-tiles-prod): fetch, cache, stitch to a height grid (m)
import math, os, io, requests, numpy as np, concurrent.futures as cf
from PIL import Image
URL = 'https://elevation-tiles-prod.s3.amazonaws.com/terrarium/{z}/{x}/{y}.png'
D = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'tiles'); S = requests.Session()
def tx(lon, z): return (lon + 180) / 360 * 2 ** z
def ty(lat, z): r = math.radians(lat); return (1 - math.log(math.tan(r) + 1 / math.cos(r)) / math.pi) / 2 * 2 ** z
def lon_of(x, z): return x / 2 ** z * 360 - 180
def lat_of(y, z): return math.degrees(math.atan(math.sinh(math.pi * (1 - 2 * y / 2 ** z))))
def get(z, x, y):
    p = f'{D}/{z}_{x}_{y}.png'
    if not os.path.exists(p):
        for k in range(4):
            try:
                r = S.get(URL.format(z=z, x=x, y=y), timeout=60)
                if r.status_code == 404: open(p, 'wb').close(); break
                r.raise_for_status(); open(p, 'wb').write(r.content); break
            except Exception:
                if k == 3: raise
    return p
def heights(p):
    if os.path.getsize(p) == 0: return np.full((256, 256), -1.0, np.float32)
    a = np.asarray(Image.open(p).convert('RGB')).astype(np.float32)
    return a[..., 0] * 256 + a[..., 1] + a[..., 2] / 256 - 32768
def tiles(box, z): return [(x, y) for x in range(int(tx(box[0], z)), int(tx(box[2], z)) + 1) for y in range(int(ty(box[3], z)), int(ty(box[1], z)) + 1)]
def fetch(z, ts, workers=16):
    with cf.ThreadPoolExecutor(workers) as ex: return list(ex.map(lambda t: get(z, *t), ts))
def stitch(box, z):
    ts = tiles(box, z); fetch(z, ts); xs = sorted({t[0] for t in ts}); ys = sorted({t[1] for t in ts})
    g = np.zeros((len(ys) * 256, len(xs) * 256), np.float32)
    for (x, y) in ts: g[(y - ys[0]) * 256:(y - ys[0] + 1) * 256, (x - xs[0]) * 256:(x - xs[0] + 1) * 256] = heights(f'{D}/{z}_{x}_{y}.png')
    return g, (lon_of(xs[0], z), lat_of(ys[0], z), lon_of(xs[-1] + 1, z), lat_of(ys[-1] + 1, z))
