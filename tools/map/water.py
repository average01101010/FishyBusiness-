# The fresh water of a 50 km tile (G2 of docs/planer/grafikk-natur-og-miljo.md): lakes, ponds, reservoirs and rivers mapped as areas,
# the rivers, streams and canals mapped as lines, and the waterfalls, from Overture's base/water (OpenStreetMap). A 'water' entry in the
# tile's vec pack (coast.py, vectors.py); the game reads it in view3d/17b-inland-water.js, older games skip it (01c-vec.js VECN).
#   areas   triangulated here (shapely's constrained Delaunay), each with its kind (0 standing water, flat at its level; 1 a river's
#           area, draped on the ground) and its level: the median of the ground's heights (25 m, Kartverket's terrain has a lake's
#           surface flat at the water) at the cells inside it, in decimetres. Water that lies mostly on the sea (the land mask) is the
#           sea's and left out; areas under 400 m2 are too small to see (a few corners after the simplification; the game leaves them out too)
#   lines   class (0 stream, 1 river, 2 canal or ditch), the points (m)
#   falls   the waterfalls, a point each
# Coordinates are metres from the tile's corner (tx * 50 000, ty * 50 000), simplified to 4 m. Packed as varints (vectors.py varint,
# zz): n areas, n lines, n falls; per area kind, level (zz dm), n vertices, the vertices as zz steps, n triangles, the indices; per line
# class, n points, zz steps; per fall x, y (zz).
#   python3 tools/map/water.py inject <game dir> [tx,ty ...]   adds the entry to the vec packs of a built game dir (for a local test)
import os, sys, json, math, hashlib, numpy as np
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
from shapely import from_wkb, Point
import frame
from ov import features
from vectors import varint, zz, to_m

STAND = {('lake', 'lake'), ('lake', 'oxbow'), ('lake', 'lagoon'), ('pond', 'pond'), ('reservoir', 'reservoir'), ('reservoir', 'basin'), ('water', 'water')}
LINE = {'stream': 0, 'river': 1, 'canal': 2}

def hdec(a):   # the hgt layer's packing (region.hgtEnc) back to metres
    a = a.astype(np.float32); s = np.sign(a); a = np.abs(a)
    return s * np.where(a < 20, a / 2, 10 + (a - 20) * 2)

def build(tx, ty, L):
    R = frame.Region('w', tx * 5, ty * 5, tx * 5 + 5, ty * 5 + 5); box = R.lonlat_box(0.6); ox, oy = tx * 50000.0, ty * 50000.0
    inside = lambda x, y: 0 <= x < 50000 and 0 <= y < 50000
    M = L['mask']; H = hdec(L['hgt'])
    t = features('base/water', box, ['geometry', 'subtype', 'class', 'is_salt'])
    areas, lines, falls = [], [], []
    if t is not None:
        g = from_wkb(t.column('geometry').to_numpy(zero_copy_only=False)); sub = t.column('subtype').to_pylist(); cl = t.column('class').to_pylist(); salt = t.column('is_salt').to_pylist()
        for geo, s, c, sa in zip(g, sub, cl, salt):
            if geo is None or sa: continue
            if s == 'physical' and c == 'waterfall' and geo.geom_type == 'Point':
                m = to_m(geo, ox, oy)
                if inside(m.x, m.y): falls.append((round(m.x), round(m.y)))
                continue
            if geo.geom_type in ('LineString', 'MultiLineString') and s in LINE:
                m = to_m(geo, ox, oy).simplify(4.0)
                for q in getattr(m, 'geoms', [m]):
                    if q.length < 20: continue
                    mid = q.interpolate(0.5, normalized=True)
                    if inside(mid.x, mid.y): lines.append((LINE[s] if c != 'ditch' else 2, [(round(x), round(y)) for x, y in q.coords]))
                continue
            if geo.geom_type not in ('Polygon', 'MultiPolygon'): continue
            kind = 0 if (s, c) in STAND else 1 if s in ('river', 'stream', 'canal') else None
            if kind is None: continue
            m = to_m(geo, ox, oy)
            for q in getattr(m, 'geoms', [m]):
                if q.area < 400: continue
                c0 = q.representative_point()
                if not inside(c0.x, c0.y): continue
                q = q.simplify(4.0)
                if q.is_empty or q.geom_type != 'Polygon' or q.area < 400: continue
                # the 25 m cells inside: on the land mask (or it is the sea's), and their ground for the level
                x0, y0, x1, y1 = q.bounds; i0, j0 = max(0, int(x0 // 25)), max(0, int(y0 // 25)); i1, j1 = min(1999, int(x1 // 25)), min(1999, int(y1 // 25))
                hs, land, n = [], 0, 0
                step = max(1, int(max(i1 - i0, j1 - j0) / 40))
                for j in range(j0, j1 + 1, step):
                    for i in range(i0, i1 + 1, step):
                        if not q.contains(Point((i + 0.5) * 25, (j + 0.5) * 25)): continue
                        n += 1; land += M[j, i] > 0; hs.append(float(H[j, i]))
                if n and land / n < 0.6: continue   # the sea's
                if not n: hs = [float(H[min(1999, max(0, int(c0.y // 25))), min(1999, max(0, int(c0.x // 25)))])]
                level = float(np.median(hs)) + 0.3
                try:
                    from shapely import constrained_delaunay_triangles
                    tri = constrained_delaunay_triangles(q)
                except Exception:
                    continue
                vi, verts, idx = {}, [], []
                for tr in tri.geoms:
                    for x, y in list(tr.exterior.coords)[:3]:
                        k = (round(x), round(y))
                        if k not in vi: vi[k] = len(verts); verts.append(k)
                        idx.append(vi[k])
                if len(verts) >= 3: areas.append((kind, round(level * 10), verts, idx))
    out = bytearray(); varint(out, len(areas)); varint(out, len(lines)); varint(out, len(falls))
    for kind, lv, verts, idx in areas:
        varint(out, kind); varint(out, zz(lv)); varint(out, len(verts)); px = py = 0
        for x, y in verts: varint(out, zz(x - px)); varint(out, zz(y - py)); px, py = x, y
        varint(out, len(idx) // 3)
        for i in idx: varint(out, i)
    for k, pts in lines:
        varint(out, k); varint(out, len(pts)); px = py = 0
        for x, y in pts: varint(out, zz(x - px)); varint(out, zz(y - py)); px, py = x, y
    for x, y in falls: varint(out, zz(x)); varint(out, zz(y))
    return bytes(out), len(areas) + len(lines) + len(falls)

# the entry into a built game dir's vec packs (tools/map/out/game), for the tiles given or all that have a cached tile
def inject(d, tiles):
    import coast, zlib
    from pack import raw_deflate
    mp = os.path.join(d, 'manifest.json'); man = json.load(open(mp)); T = man['tile'] // man['block']
    for pk in man['packs']:
        if pk['kind'] != 'vec': continue
        tx, ty = pk['tile']
        if tiles and (tx, ty) not in tiles: continue
        b, n = build(tx, ty, coast.tile(tx, ty))
        data = open(os.path.join(d, pk['file']), 'rb').read(); hl = int.from_bytes(data[4:8], 'little'); head = json.loads(data[8:8 + hl]); body = data[8 + hl:]
        blocks, parts, off = [], [], 0
        for l, bx, by, o, ln, *cnt in head['blocks']:
            if l == 'water': continue
            blocks.append([l, bx, by, off, ln] + cnt); parts.append(body[o:o + ln]); off += ln
        z = raw_deflate(b); blocks.append(['water', tx * T, ty * T, off, len(z), n]); parts.append(z)
        head['blocks'] = blocks; hj = json.dumps(head, separators=(',', ':')).encode()
        o2 = b'KMP1' + len(hj).to_bytes(4, 'little') + hj + b''.join(parts); h = hashlib.sha256(o2).hexdigest()[:12]
        fn = f'vec-{tx}-{ty}-{h}.wasm'
        if fn != pk['file']: open(os.path.join(d, fn), 'wb').write(o2); os.remove(os.path.join(d, pk['file']))
        pk.update(file=fn, hash=h, bytes=len(o2)); print(json.dumps({'tile': [tx, ty], 'items': n, 'kb': round(len(z) / 1000, 1)}), flush=True)
    json.dump(man, open(mp, 'w'), separators=(',', ':'))

if __name__ == '__main__' and sys.argv[1:2] == ['inject']:
    inject(sys.argv[2], {tuple(map(int, a.split(','))) for a in sys.argv[3:]})
