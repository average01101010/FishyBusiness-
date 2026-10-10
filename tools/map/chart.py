# The chart's vector layers (phase K7 of the coast plan): the coastline at three levels of detail and the place names, from Overture.
#   coast0  the whole frame's land, simplified to 300 m, polygons over 0.2 km2: the core
#   coast1  per 50 km tile, the land simplified to 25 m, polygons over 2 000 m2, cut to the tile and 500 m round it
#   coast2  per tile, the land joined and simplified to 3 m (skerries from 4 m2), and the breakwaters as rings of class 2 and 3
#   names   per tile: [x, y (m from the tile's corner), kind, rank, name, angle]; kinds 0 town, 1 sea/fjord/sound/bay, 2 island, 3 peak/cape;
#           rank 0 shows from the whole country, 1 from a region, 2 from a fjord, 3 close in; names0 is the core's rank-0 list
# Polygons are packed as vectors.py packs them: n, then per ring its class (0 outer, 1 hole; coast2 also 2 and 3 for a breakwater's
# outer ring and hole), point count and zigzag steps, here in
# metres from the tile's corner (or in units of 10 m from the frame's origin for coast0). The outer rings and the holes turn opposite
# ways, so the game fills them with the nonzero rule (overlapping polygons stay land).
import os, sys, json, math, numpy as np
from shapely import from_wkb, box as sbox, intersection, make_valid, unary_union
from shapely.geometry.polygon import orient
from shapely.ops import transform as stransform
import frame
from ov import features
from vectors import lines, varint

# a feature's name for a Norwegian chart: Bokmål, Norwegian or Nynorsk where Overture has it, else the first of the primary's forms
# (Northern Sami names come first in the primary in parts of Finnmark and Troms: «Porsáŋgguvuotna - Porsangerfjorden - Porsanginvuono»)
def pname(n):
    if not n or not n.get('primary'): return None
    d = dict(n.get('common') or [])
    return d.get('nb') or d.get('no') or d.get('nn') or n['primary'].split(' / ')[0].split(' - ')[0]

def nat(g, scale=1.0, ox=0.0, oy=0.0):
    def f(x, y, z=None):
        X, Y = frame.to_nat(np.asarray(x), np.asarray(y)); return X * scale - ox, Y * scale - oy
    return stransform(f, g)

def rings_of(geoms, tol, min_area):
    out = []
    for m in geoms:
        m = m.simplify(tol)
        for q in getattr(m, 'geoms', [m]):
            if q.is_empty or q.geom_type != 'Polygon' or q.area < min_area: continue
            q = orient(q, 1.0); out.append((0, list(q.exterior.coords)[:-1]))
            for h in q.interiors:
                if len(h.coords) > 3: out.append((1, list(h.coords)[:-1]))
    return out

# the land polygons over a lon/lat box, each once (by Overture's id)
def land(box):
    t = features('base/land', box, ['id', 'geometry', 'subtype']); seen = set(); out = []
    if t is None: return out
    for i, g, s in zip(t.column('id').to_pylist(), from_wkb(t.column('geometry').to_numpy(zero_copy_only=False)), t.column('subtype').to_pylist()):
        if s != 'land' or i in seen or g is None or g.geom_type not in ('Polygon', 'MultiPolygon'): continue
        seen.add(i); out.append(g)
    return out

def coast1(tx, ty):
    R = frame.Region('c', tx * 5, ty * 5, tx * 5 + 5, ty * 5 + 5); ox, oy = tx * 50000.0, ty * 50000.0; clip = sbox(-500, -500, 50500, 50500)
    gs = [intersection(make_valid(nat(g, 1000, ox, oy)), clip) for g in land(R.lonlat_box(0.6))]
    b = bytearray(); r = rings_of([g for g in gs if not g.is_empty], 25, 2000); lines(b, r); return bytes(b), len(r)

WATER = {'fjord', 'sea', 'ocean', 'strait', 'sound', 'bay', 'cove', 'channel'}
SMALL = ('vika', 'vik', 'bukta', 'bukt', 'hamna', 'hamn', 'våg', 'vågen', 'pollen', 'poll', 'kilen', 'botn', 'botnen')
# names: [x, y (m from the tile's corner), kind, rank, name], the most important first within a rank (the game keeps that order
# and drops what would cover a name placed before). Towns rank by Overture's class and population. Water is mostly points in
# OpenStreetMap (place=bay and the like), so it ranks by how far the point is from the land (the national mask at 200 m: a wide
# fjord shows from farther out), the polygons also by their area, and the small kinds by name (-vika, -bukta, -hamna, -pollen: close in)
def names(tx, ty):
    import national
    from scipy import ndimage
    R = frame.Region('n', tx * 5, ty * 5, tx * 5 + 5, ty * 5 + 5); box = R.lonlat_box(0); ox, oy = tx * 50000.0, ty * 50000.0; out = []
    M = national.mask200(); j0, i0 = max(0, ty * 250 - 100), max(0, tx * 250 - 100)
    W = M[j0:ty * 250 + 350, i0:tx * 250 + 350]; DL = ndimage.distance_transform_edt(W == 0) * 0.2
    def dland(x, y):   # km from the land at a point (km, national)
        j, i = int(y / 0.2) - j0, int(x / 0.2) - i0
        return float(DL[j, i]) if 0 <= j < DL.shape[0] and 0 <= i < DL.shape[1] else 0.0
    def add(lon, lat, kind, rank, nm, imp, ang=0):
        x, y = frame.to_nat(lon, lat); x, y = float(x) * 1000 - ox, float(y) * 1000 - oy
        if 0 <= x < 50000 and 0 <= y < 50000 and nm: out.append((rank, -imp, [int(round(x)), int(round(y)), kind, rank, nm, ang]))
    pt = lambda g: g if g.geom_type == 'Point' else g.representative_point()
    d = features('divisions/division', box, ['geometry', 'subtype', 'class', 'names', 'population'])
    if d is not None:
        for g, s, c, n, pop in zip(from_wkb(d.column('geometry').to_numpy(zero_copy_only=False)), d.column('subtype').to_pylist(), d.column('class').to_pylist(), d.column('names').to_pylist(), d.column('population').to_pylist()):
            if s != 'locality' or not pname(n): continue
            pop = pop or 0; rank = 0 if c == 'city' or pop >= 20000 else 1 if c == 'town' or pop >= 1500 else 2 if c == 'village' or pop >= 100 else 3
            add(g.x, g.y, 0, rank, pname(n), pop + {'city': 1e6, 'town': 1e4, 'village': 100}.get(c, 0))
    w = features('base/water', box, ['geometry', 'subtype', 'class', 'names'])
    if w is not None:
        for g, s, c, n in zip(from_wkb(w.column('geometry').to_numpy(zero_copy_only=False)), w.column('subtype').to_pylist(), w.column('class').to_pylist(), w.column('names').to_pylist()):
            nm = pname(n)
            if not nm or c not in WATER or g is None: continue
            p = pt(g); x, y = frame.to_nat(p.x, p.y); dl = dland(float(x), float(y)); a = g.area * 111 * 111 * 0.35   # km2, roughly
            rank = 1 if dl >= 2 or a > 30 else 2 if dl >= 0.5 or a > 2 else 3; ang = 0
            # a fjord drawn as a line along it (OpenStreetMap's label lines): by its length, and the name turned along it
            if g.geom_type in ('LineString', 'MultiLineString'):
                m = nat(g); L = m.length; e = (m.geoms[0] if hasattr(m, 'geoms') else m).coords; (x0, y0), (x1, y1) = e[0], e[-1]
                rank = min(rank, 1 if L >= 25 else 2 if L >= 6 else 3); ang = round(math.degrees(math.atan2(y1 - y0, x1 - x0)))
                ang = (ang + 90) % 180 - 90; a = max(a, L)
            if c in ('sea', 'ocean') or a > 300: rank = 0
            if nm.lower().endswith(SMALL) or c == 'cove': rank = max(rank, 2 if dl >= 1 else 3)
            add(p.x, p.y, 1, rank, nm, dl + a, ang)
    l = features('base/land', box, ['geometry', 'subtype', 'class', 'names'])
    if l is not None:
        for g, s, c, n in zip(from_wkb(l.column('geometry').to_numpy(zero_copy_only=False)), l.column('subtype').to_pylist(), l.column('class').to_pylist(), l.column('names').to_pylist()):
            nm = pname(n)
            if not nm or g is None: continue
            if c in ('island', 'archipelago'):
                a = g.area * 111 * 111 * 0.35; p = pt(g); add(p.x, p.y, 2, 0 if a > 500 else 1 if a > 20 else 2 if a > 0.5 else 3, nm, a)
            elif c == 'islet': p = pt(g); add(p.x, p.y, 2, 3, nm, 0)
            elif c in ('peak', 'cape'): p = pt(g); add(p.x, p.y, 3, 2 if c == 'cape' else 3, nm, 0)
    out.sort(key=lambda q: (q[0], q[1])); return [q[2] for q in out]

# the breakwaters near a tile (OpenStreetMap's man_made=breakwater in Overture's infrastructure, which the coastline leaves out), in the
# tile's metres: areas as mapped, lines widened to BW_HALF on each side (12 m: an estimate of a rubble mound at the waterline)
BW_HALF = 6.0
def breakwaters_m(box, ox, oy, clip):
    inf = features('base/infrastructure', box, ['geometry', 'subtype', 'class']); out = []
    if inf is None: return out
    for g, c in zip(from_wkb(inf.column('geometry').to_numpy(zero_copy_only=False)), inf.column('class').to_pylist()):
        if c != 'breakwater' or g is None: continue
        m = make_valid(nat(g, 1000, ox, oy))
        for q in getattr(m, 'geoms', [m]):
            if q.geom_type == 'LineString': q = q.buffer(BW_HALF, 4)
            elif q.geom_type == 'Polygon': q = q.buffer(0)
            else: continue
            q = intersection(q, clip)
            if not q.is_empty: out.append(q)
    return out

# the fine coast of a tile (3 m): the one truth for land and sea in the game (04.10.2026, the user: the land is to follow the lines).
# Overture's land pieces are joined before they are simplified (each simplified on its own left seams up to 3 m that a point test
# took for water), and small skerries are kept (4 m2). The breakwaters outside that land follow as their own rings, class 2 (outer)
# and 3 (hole): the chart fills them as land, isLand takes them as land, and the 3D view builds them as rubble mounds.
def coast2(tx, ty):
    R = frame.Region('c', tx * 5, ty * 5, tx * 5 + 5, ty * 5 + 5); ox, oy = tx * 50000.0, ty * 50000.0; clip = sbox(-500, -500, 50500, 50500)
    box = R.lonlat_box(0.6)
    U = unary_union([g for g in (intersection(make_valid(nat(g, 1000, ox, oy)), clip) for g in land(box)) if not g.is_empty])
    B = unary_union(breakwaters_m(box, ox, oy, clip))
    if not B.is_empty and not U.is_empty: B = B.difference(U)
    r = rings_of([U], 3, 4) if not U.is_empty else []
    if not B.is_empty: r += [(c + 2, pts) for c, pts in rings_of([B], 1, 4)]
    b = bytearray(); lines(b, r); return bytes(b), len(r)

# n, then per name x, y (varint), kind, rank, the angle the name is turned (degrees + 90: 90 is level), name length and UTF-8
def names_bytes(nm):
    b = bytearray(); varint(b, len(nm))
    for x, y, k, r, n, *a in nm:
        varint(b, x); varint(b, y); b.append(k); b.append(r); b.append((a[0] if a else 0) + 90); e = n.encode('utf-8'); varint(b, len(e)); b += e
    return bytes(b)

# names0: the names that show from the whole country (rank 0), in units of 10 m from the frame's origin: the cities and the towns of
# 20 000 or more in Norway, and of 150 000 or more abroad (Overture's divisions), the seas, sounds and fjords that span 40 km or more and the islands that span 25 km or more.
# Water and land go by their bounding boxes, without the geometry (which for the whole frame would be gigabytes), each placed where
# its box is farthest from the other side (the national land mask at 200 m): mid-fjord, mid-island.
def names0():
    import national
    from scipy import ndimage
    M = national.mask200(); NO = national.norway200()[0]; out, seen = [], set()
    def put(x, y, kind, nm, imp=0):
        k = (nm, round(x / 30), round(y / 30))
        if nm and k not in seen and 0 <= x < 1450 and 0 <= y < 1720: seen.add(k); out.append((-imp, [int(round(x * 100)), int(round(y * 100)), kind, 0, nm]))
    box = frame.Region('n', 0, 0, 145, 172).lonlat_box(0)
    d = features('divisions/division', box, ['geometry', 'subtype', 'class', 'names', 'population'])
    for g, s, c, n, pop in zip(from_wkb(d.column('geometry').to_numpy(zero_copy_only=False)), d.column('subtype').to_pylist(), d.column('class').to_pylist(), d.column('names').to_pylist(), d.column('population').to_pylist()):
        if s != 'locality' or not n or not n.get('primary'): continue
        x, y = frame.to_nat(g.x, g.y); x, y = float(x), float(y); j, i = int(y / 0.2), int(x / 0.2)
        home = 0 <= j < NO.shape[0] and 0 <= i < NO.shape[1] and NO[max(0, j - 5):j + 6, max(0, i - 5):i + 6].any()
        if (home and (c == 'city' or (pop or 0) >= 20000)) or (pop or 0) >= 150000: put(x, y, 0, pname(n), (pop or 0) + (1e7 if home else 0))
    def far_pt(b, land):
        xs, ys = frame.to_nat(np.array([b['xmin'], b['xmax'], b['xmin'], b['xmax']]), np.array([b['ymin'], b['ymin'], b['ymax'], b['ymax']]))
        i0, i1 = max(0, int(xs.min() / 0.2)), min(M.shape[1], int(xs.max() / 0.2) + 1); j0, j1 = max(0, int(ys.min() / 0.2)), min(M.shape[0], int(ys.max() / 0.2) + 1)
        if i1 - i0 < 2 or j1 - j0 < 2: return None
        want = (M[j0:j1, i0:i1] > 0) == land
        if not want.any(): return None
        D = ndimage.distance_transform_edt(np.pad(want, 1)); D = D[1:-1, 1:-1]; j, i = np.unravel_index(np.argmax(D), D.shape)
        return (i0 + i + 0.5) * 0.2, (j0 + j + 0.5) * 0.2, D[j, i] * 0.2
    span = lambda b: max((b['xmax'] - b['xmin']) * 111 * math.cos(math.radians((b['ymin'] + b['ymax']) / 2)), (b['ymax'] - b['ymin']) * 111)
    for typ, classes, kind, smin, land in (('base/water', ('sea', 'ocean', 'strait', 'sound', 'fjord', 'bay'), 1, 40, False), ('base/land', ('island', 'archipelago'), 2, 25, True)):
        t = features(typ, box, ['class', 'names'])
        for c, n, b in zip(t.column('class').to_pylist(), t.column('names').to_pylist(), t.column('bbox').to_pylist()):
            if c not in classes or not n or not n.get('primary') or span(b) < smin: continue
            q = far_pt(b, land)
            if q and q[2] >= 1: put(q[0], q[1], kind, pname(n), span(b))
    out.sort(key=lambda q: q[0]); return [q[1] for q in out]

# coast0: the whole frame, 100 km at a time, simplified to 300 m in units of 10 m from the frame's origin
def coast0():
    seen = set(); polys = []
    for cy in range(0, 1750, 100):
        for cx in range(0, 1450, 100):
            R = frame.Region('c', cx // 10, cy // 10, min(cx + 100, 1450) // 10, min(cy + 100, 1750) // 10)
            t = features('base/land', R.lonlat_box(1), ['geometry', 'subtype'])   # the columns national.py has fetched already
            if t is None: continue
            wk = t.column('geometry').to_numpy(zero_copy_only=False)
            for w, g, s in zip(wk, from_wkb(wk), t.column('subtype').to_pylist()):
                h = hash(w)
                if s != 'land' or h in seen or g is None or g.geom_type not in ('Polygon', 'MultiPolygon'): continue
                seen.add(h); polys.append(g)
        print('coast0 row', cy, len(polys), file=sys.stderr, flush=True)
    frame_box = sbox(-50, -50, 1500, 1800); rings = []
    for g in polys:
        m = intersection(make_valid(nat(g)), frame_box).simplify(0.3)
        for q in getattr(m, 'geoms', [m]):
            if q.is_empty or q.geom_type != 'Polygon' or q.area < 0.2: continue
            q = orient(q, 1.0); rings.append((0, [(x * 100, y * 100) for x, y in list(q.exterior.coords)[:-1]]))
            for h in q.interiors:
                hp = list(h.coords)[:-1]
                if len(hp) >= 3: rings.append((1, [(x * 100, y * 100) for x, y in hp]))
    b = bytearray(); lines(b, rings); return bytes(b), len(rings)

if __name__ == '__main__':
    if sys.argv[1] == 'names0':
        nm = names0(); json.dump(nm, open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'out', 'national', 'names0.json'), 'w'), ensure_ascii=False)
        print(json.dumps({'names': len(nm), 'kinds': [sum(1 for q in nm if q[2] == k) for k in range(3)], 'sample': [q[4] for q in nm[:40]]}, ensure_ascii=False))
    elif sys.argv[1] == 'coast0':
        b, n = coast0(); import zlib; print(json.dumps({'rings': n, 'kb': len(b) // 1024, 'deflKB': len(zlib.compress(b, 9)) // 1024}))
        open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'out', 'national', 'coast0.bin'), 'wb').write(b)
    else:
        tx, ty = map(int, sys.argv[2].split(','))
        b, n = coast1(tx, ty); nm = names(tx, ty); import zlib; print(json.dumps({'rings': n, 'kb': len(b) // 1024, 'names': len(nm), 'rank': [sum(1 for x in nm if x[3] == r) for r in range(4)], 'sample': nm[:6]}, ensure_ascii=False))
