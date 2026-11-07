# Packed size of the terrain per km2 of coastal band: Terrarium z13 resampled to 10 m and 30 m, decimetres or quarter metres,
# row-delta and deflate (what our own tiles would be)
import numpy as np, zlib, random, math, json, os
from terrain import tiles, fetch, heights, lon_of, lat_of, D
from scipy import ndimage
random.seed(3)
regs = {'senja': (16.55, 68.98, 18.55, 69.72), 'bergen': (4.75, 60.20, 5.55, 60.60), 'oslofjord': (10.30, 59.05, 10.90, 59.45)}
out = {}
for name, box in regs.items():
    ts = tiles(box, 13); random.shuffle(ts); got = []
    for t in ts:
        if len(got) >= 60: break
        p = fetch(13, [t])[0]; h = heights(p)
        land = h > 0.5
        if 0.1 < land.mean() < 0.95: got.append((t, h, os.path.getsize(p)))
    lat = (box[1] + box[3]) / 2; mpp = 40075016 * math.cos(math.radians(lat)) / 8192 / 256
    res = {'mpp': round(mpp, 1), 'pngKBperTile': round(np.mean([g[2] for g in got]) / 1024, 1)}
    km2 = (256 * mpp / 1000) ** 2
    for step, q in [(10, 0.1), (10, 0.25), (30, 0.25)]:
        tot = 0
        for _, h, _ in got:
            z = ndimage.zoom(h, mpp / step, order=1); z = np.maximum(z, 0)
            v = np.round(z / q).astype(np.int32); d = np.diff(np.concatenate([np.zeros((v.shape[0], 1), np.int32), v], 1), axis=1)
            d = np.diff(np.concatenate([np.zeros((1, d.shape[1]), np.int32), d], 0), axis=0)  # 2D predictor
            tot += len(zlib.compress(np.clip(d, -32768, 32767).astype(np.int16).tobytes(), 9))
        res[f'{step}m_q{q}_KBperKm2'] = round(tot / len(got) / km2 / 1024, 1)
    out[name] = res; print(name, res)
json.dump(out, open('tsize.json', 'w'))
