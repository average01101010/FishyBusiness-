# One sample region from Overture: what there is, and how big our packed layers get
import sys, time, math, json, zlib, pickle, collections, numpy as np
from ovfetch import features
from shapely import from_wkb
from PIL import Image, ImageDraw
REG = {'senja': (16.55, 68.98, 18.55, 69.72), 'bergen': (4.75, 60.20, 5.55, 60.60), 'oslofjord': (10.30, 59.05, 10.90, 59.45)}
name = sys.argv[1]; box = REG[name]; lat0 = (box[1] + box[3]) / 2
KY = 111.32; KX = KY * math.cos(math.radians(lat0)); W = (box[2] - box[0]) * KX; H = (box[3] - box[1]) * KY
R = {'name': name, 'km': [round(W, 1), round(H, 1)]}
def vz(seq):  # unsigned varints, as the game packs them
    out = bytearray()
    for v in seq:
        while True:
            b = v & 127; v >>= 7
            if v: out.append(b | 128)
            else: out.append(b); break
    return bytes(out)
def rle(m):
    out = []
    for row in m:
        d = np.flatnonzero(np.diff(np.concatenate([[0], row, [0]])))
        runs = np.diff(np.concatenate([[0], d, [len(row)]])).tolist()
        if runs and runs[-1] == 0: runs = runs[:-1]
        out.append(len(runs)); out += runs
    return vz(out)
t0 = time.time()
land = features('base/land', box, ['geometry', 'subtype', 'class', 'names'])
g = from_wkb(land.column('geometry').to_numpy(zero_copy_only=False)); sub = land.column('subtype').to_pylist()
polys = [x for x, s in zip(g, sub) if s == 'land' and x.geom_type in ('Polygon', 'MultiPolygon')]
R['landPolys'] = len(polys); R['landVerts'] = int(sum(len(q.exterior.coords) for p in polys for q in getattr(p, 'geoms', [p])))
R['named'] = sum(1 for n in land.column('names').to_pylist() if n and n.get('primary'))
R['landcover'] = dict(collections.Counter(sub).most_common(8))
for cell, key in [(0.025, 'mask25'), (0.0125, 'mask12')]:
    nx, ny = int(W / cell), int(H / cell); im = Image.new('L', (nx, ny), 0); dr = ImageDraw.Draw(im)
    f = lambda cs: [((lon - box[0]) * KX / cell, (box[3] - lat) * KY / cell) for lon, lat in cs]
    for p in polys:
        for q in getattr(p, 'geoms', [p]):
            dr.polygon(f(q.exterior.coords), fill=1)
            for h in q.interiors: dr.polygon(f(h.coords), fill=0)
    m = np.array(im); r = rle(m); R[key] = {'cells': m.size, 'land': round(float(m.mean()), 3), 'rleKB': len(r) // 1024, 'rleDeflKB': len(zlib.compress(r, 9)) // 1024}
    if cell == 0.025: np.save(f'{name}_mask25.npy', m)
inf = features('base/infrastructure', box, ['geometry', 'subtype', 'class'])
R['infra'] = dict(collections.Counter(c for c in inf.column('class').to_pylist()).most_common(12)) if inf else {}
bld = features('buildings/building', box, ['geometry', 'height', 'num_floors'])
bg = from_wkb(bld.column('geometry').to_numpy(zero_copy_only=False))
R['buildings'] = len(bg); R['bldVerts'] = int(sum(len(q.exterior.coords) for p in bg for q in getattr(p, 'geoms', [p])))
R['bldHeight'] = int(sum(1 for h in bld.column('height').to_pylist() if h))
seg = features('transportation/segment', box, ['geometry', 'subtype', 'class'])
sg = from_wkb(seg.column('geometry').to_numpy(zero_copy_only=False)); ss = seg.column('subtype').to_pylist()
R['roads'] = sum(1 for s in ss if s == 'road'); R['roadKm'] = round(sum(x.length for x, s in zip(sg, ss) if s == 'road') * 111.32 * math.cos(math.radians(lat0)) * 0.85 + 0, 0)
lc = features('base/land_cover', box, ['geometry', 'subtype'])
R['landCoverPolys'] = dict(collections.Counter(lc.column('subtype').to_pylist()).most_common(8)) if lc else {}
R['sec'] = round(time.time() - t0, 1)
print(json.dumps(R)); json.dump(R, open(f'{name}_region.json', 'w'))
pickle.dump({'polys': polys, 'bld': bg}, open(f'{name}_vec.pkl', 'wb'))
