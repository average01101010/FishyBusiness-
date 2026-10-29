# The beaches and the shingle along the sea in a 50 km tile (G10 of docs/planer/grafikk-natur-og-miljo.md): OpenStreetMap's sand
# (natural=beach, natural=sand) and shingle in Overture's base/land (sand/beach, sand/sand, rock/shingle), within 150 m of the sea (the
# tile's land mask), too narrow for the 50 m cells of the cover layer. A 'shore' entry in the tile's vec pack (coast.py); the game drapes
# them on the ground in view3d/17h-shore.js, older games skip it.
#   areas   kind (0 sand, 1 shingle), triangulated here (shapely's constrained Delaunay), the outline simplified to 2 m
#   cliffs  OpenStreetMap's natural=cliff (physical/cliff) within 200 m of the sea, the lines simplified to 3 m; the cliff's foot is on
#           the line's right (OpenStreetMap's way), the game stands a rock face along it (view3d/17h-shore.js)
# Coordinates are metres from the tile's corner, packed as water.py's areas (varints): n areas; per area kind, 0 (the level, unused),
# n vertices as zz steps, n triangles, the indices; then n cliffs, per cliff n points as zz steps (an older game reads only the areas).
#   python3 tools/map/shore.py inject <game dir> [tx,ty ...]   adds the entry to the vec packs of a built game dir (for a local test)
import os, sys, json, hashlib, numpy as np
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
from shapely import from_wkb, constrained_delaunay_triangles
from scipy import ndimage
import frame
from ov import features
from vectors import varint, zz, to_m

KIND = {('sand', 'beach'): 0, ('sand', 'sand'): 0, ('rock', 'shingle'): 1}

def build(tx, ty, L):
    R = frame.Region('s', tx * 5, ty * 5, tx * 5 + 5, ty * 5 + 5); box = R.lonlat_box(0.3); ox, oy = tx * 50000.0, ty * 50000.0
    M = L['mask']; dsea = ndimage.distance_transform_edt(M > 0) * 25
    near = lambda x, y: dsea[min(M.shape[0] - 1, max(0, int(y // 25))), min(M.shape[1] - 1, max(0, int(x // 25)))] <= 150
    t = features('base/land', box, ['geometry', 'subtype', 'class']); areas = []
    if t is not None:
        for g, sub, cls in zip(t.column('geometry').to_pylist(), t.column('subtype').to_pylist(), t.column('class').to_pylist()):
            k = KIND.get((sub, cls))
            if k is None or g is None: continue
            m = to_m(from_wkb(g), ox, oy)
            for part in getattr(m, 'geoms', [m]):
                if part.geom_type != 'Polygon' or part.area < 60: continue
                c = part.centroid
                if not (0 <= c.x < 50000 and 0 <= c.y < 50000) or not near(c.x, c.y): continue
                p = part.simplify(2.0)
                if p.is_empty or p.geom_type != 'Polygon' or p.area < 40: continue
                tris = constrained_delaunay_triangles(p)
                V, I, idx = [], [], {}
                for tri in tris.geoms:
                    for xy in list(tri.exterior.coords)[:3]:
                        key = (round(xy[0]), round(xy[1]))
                        if key not in idx: idx[key] = len(V); V.append(key)
                        I.append(idx[key])
                if len(I) >= 3: areas.append((k, V, I))
    cl = []
    t2 = features('base/land', box, ['geometry', 'subtype', 'class'])
    if t2 is not None:
        for g, sub, cls in zip(t2.column('geometry').to_pylist(), t2.column('subtype').to_pylist(), t2.column('class').to_pylist()):
            if sub != 'physical' or cls != 'cliff' or g is None: continue
            m = to_m(from_wkb(g), ox, oy)
            for part in getattr(m, 'geoms', [m]):
                if part.geom_type == 'Polygon': part = part.exterior
                if part.geom_type not in ('LineString', 'LinearRing') or part.length < 15: continue
                c = part.interpolate(0.5, normalized=True)
                if not (0 <= c.x < 50000 and 0 <= c.y < 50000) or dsea[min(M.shape[0] - 1, max(0, int(c.y // 25))), min(M.shape[1] - 1, max(0, int(c.x // 25)))] > 200: continue
                q = part.simplify(3.0); pts = [(round(x), round(y)) for x, y in q.coords]
                if len(pts) >= 2: cl.append(pts)
    b = bytearray(); varint(b, len(areas))
    for k, V, I in areas:
        varint(b, k); varint(b, 0); varint(b, len(V)); px = py = 0
        for x, y in V: varint(b, zz(x - px)); varint(b, zz(y - py)); px, py = x, y
        varint(b, len(I) // 3)
        for i in I: varint(b, i)
    varint(b, len(cl))
    for pts in cl:
        varint(b, len(pts)); px = py = 0
        for x, y in pts: varint(b, zz(x - px)); varint(b, zz(y - py)); px, py = x, y
    return bytes(b), len(areas) + len(cl)

if __name__ == '__main__' and len(sys.argv) > 2 and sys.argv[1] == 'inject':
    import coast, zlib
    from pack import raw_deflate
    d = sys.argv[2]; mp = os.path.join(d, 'manifest.json'); man = json.load(open(mp)); want = {tuple(map(int, a.split(','))) for a in sys.argv[3:]}
    B = man['tile'] // man['block']
    for pk in man['packs']:
        if pk['kind'] != 'vec' or (want and tuple(pk['tile']) not in want): continue
        tx, ty = pk['tile']; L = coast.tile(tx, ty); data, n = build(tx, ty, L)
        raw = open(os.path.join(d, pk['file']), 'rb').read(); hl = int.from_bytes(raw[4:8], 'little'); head = json.loads(raw[8:8 + hl]); body = raw[8 + hl:]
        blocks, parts, off = [], [], 0
        for l, bx, by, o, ln, *cnt in head['blocks']:
            if l == 'shore': continue
            blocks.append([l, bx, by, off, ln] + cnt); parts.append(body[o:o + ln]); off += ln
        z = raw_deflate(data); blocks.append(['shore', tx * B, ty * B, off, len(z), n]); parts.append(z)
        head['blocks'] = blocks; hj = json.dumps(head, separators=(',', ':')).encode()
        o2 = b'KMP1' + len(hj).to_bytes(4, 'little') + hj + b''.join(parts); h = hashlib.sha256(o2).hexdigest()[:12]; fn = f'vec-{tx}-{ty}-{h}.wasm'
        if fn != pk['file']: open(os.path.join(d, fn), 'wb').write(o2); os.remove(os.path.join(d, pk['file']))
        pk.update(file=fn, hash=h, bytes=len(o2)); print(json.dumps({'tile': [tx, ty], 'areas': n, 'kb': round(len(z) / 1000, 1)}), flush=True)
    json.dump(man, open(mp, 'w'), separators=(',', ':'))
