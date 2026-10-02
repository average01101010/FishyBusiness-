# The coast's vector layers per 50 km tile (phase K5 of the coast plan), from Overture, in metres from the tile's corner
# (tx * 50 000, ty * 50 000) in the national frame, packed as the game's legacy layers were (01-world.js, view3d.js):
#   bld    buildings as oriented rectangles: X, Y (u16, m), length and width (u8: half metres to 80 m, then 2 m steps), angle (u8,
#          of pi, clockwise from x), type | levels << 4 (u8; the types of view3d.js: 1 house, 2 flats, 3 garage, 4 cabin, 5 boathouse,
#          6 barn, 7 shed, 8 industrial, 9 commercial, 10 public, 11 church, 13 greenhouse); the lite profile keeps those within 2 km
#          of the sea
#   road   varints: n, then per road class (0 trunk/primary ... 4 service/track), point count, zigzag steps (m)
#   pier   the same with 0 pier, 1 breakwater
#   coast  the land polygons simplified to 3 m and cut to the tile and 500 m round it: n, then per ring its point count and steps
import math, numpy as np
from shapely import from_wkb, box as sbox, intersection
from shapely.ops import transform as stransform
import frame
from ov import features
from region import polys_of

BT = {'house': 1, 'detached': 1, 'residential': 1, 'semidetached_house': 1, 'terrace': 1, 'bungalow': 1, 'farmhouse': 1, 'apartments': 2, 'dormitory': 2,
      'garage': 3, 'garages': 3, 'carport': 3, 'cabin': 4, 'hut': 4, 'boathouse': 5, 'barn': 6, 'farm': 6, 'farm_auxiliary': 6, 'cowshed': 6, 'stable': 6, 'sty': 6,
      'shed': 7, 'outbuilding': 7, 'service': 7, 'industrial': 8, 'warehouse': 8, 'hangar': 8, 'manufacture': 8, 'storage_tank': 8, 'commercial': 9, 'retail': 9,
      'office': 9, 'supermarket': 9, 'hotel': 9, 'civic': 10, 'school': 10, 'public': 10, 'hospital': 10, 'government': 10, 'kindergarten': 10, 'university': 10,
      'college': 10, 'fire_station': 10, 'church': 11, 'chapel': 11, 'religious': 11, 'cathedral': 11, 'bunker': 12, 'ruins': 12, 'greenhouse': 13}
RC = {'motorway': 0, 'trunk': 0, 'primary': 0, 'secondary': 1, 'tertiary': 2, 'residential': 3, 'unclassified': 3, 'living_street': 3, 'service': 4, 'track': 4, 'unknown': 4}

def varint(out, v):
    while True:
        b = v & 127; v >>= 7
        if v: out.append(b | 128)
        else: out.append(b); return
def zz(v): return (v << 1) if v >= 0 else ((-v << 1) - 1)
def lines(out, items):   # [(class, [(x, y) m ...])]
    varint(out, len(items))
    for c, pts in items:
        varint(out, c); varint(out, len(pts)); px = py = 0
        for x, y in pts: x, y = int(round(x)), int(round(y)); varint(out, zz(x - px)); varint(out, zz(y - py)); px, py = x, y

def to_m(g, ox, oy):
    def f(x, y, z=None):
        X, Y = frame.to_nat(np.asarray(x), np.asarray(y)); return X * 1000 - ox, Y * 1000 - oy
    return stransform(f, g)

def qlen(v): v = max(0.5, float(v)); return int(min(255, round(v * 2) if v < 80 else 160 + round((v - 80) / 2)))

def build(tx, ty, near_sea=None):
    R = frame.Region('v', tx * 5, ty * 5, tx * 5 + 5, ty * 5 + 5); box = R.lonlat_box(0.6); ox, oy = tx * 50000.0, ty * 50000.0; out = {}
    clip = sbox(-500, -500, 50500, 50500)
    # buildings
    b = features('buildings/building', box, ['geometry', 'class', 'subtype', 'height', 'num_floors'])
    X, Y, Lq, Wq, Aq, Tq = [], [], [], [], [], []
    if b is not None:
        g = from_wkb(b.column('geometry').to_numpy(zero_copy_only=False)); cl = b.column('class').to_pylist(); sb = b.column('subtype').to_pylist(); fl = b.column('num_floors').to_pylist(); hh = b.column('height').to_pylist()
        for geo, c, s, nf, h in zip(g, cl, sb, fl, hh):
            if geo is None or geo.geom_type not in ('Polygon', 'MultiPolygon'): continue
            m = to_m(geo, ox, oy); cx, cy = m.centroid.x, m.centroid.y
            if not (0 <= cx < 50000 and 0 <= cy < 50000): continue
            if near_sea is not None and not near_sea(cx, cy): continue
            r = m.minimum_rotated_rectangle; cs = np.asarray(r.exterior.coords)[:4]
            e1, e2 = cs[1] - cs[0], cs[2] - cs[1]; l1, l2 = np.hypot(*e1), np.hypot(*e2)
            ax = e1 if l1 >= l2 else e2; L, W = max(l1, l2), min(l1, l2); a = math.atan2(ax[1], ax[0]) % math.pi
            t = BT.get(c) or BT.get(s) or (7 if L * W < 25 else 1 if L * W < 250 else 8)
            lv = int(nf) if nf else (int(round(h / 3)) if h else 0)
            X.append(int(round(cx))); Y.append(int(round(cy))); Lq.append(qlen(L)); Wq.append(qlen(W)); Aq.append(int(round(a / math.pi * 256)) % 256); Tq.append(t | (min(lv, 15) << 4))
    n = len(X)
    out['bld'] = (np.array(X, np.uint16).tobytes() + np.array(Y, np.uint16).tobytes() + bytes(Lq) + bytes(Wq) + bytes(Aq) + bytes(Tq), n)
    # roads
    s = features('transportation/segment', box, ['geometry', 'subtype', 'class']); items = []
    if s is not None:
        for geo, sub, c in zip(from_wkb(s.column('geometry').to_numpy(zero_copy_only=False)), s.column('subtype').to_pylist(), s.column('class').to_pylist()):
            if sub != 'road' or c not in RC or geo is None: continue
            m = intersection(to_m(geo, ox, oy), clip)
            for part in getattr(m, 'geoms', [m]):
                if part.is_empty or part.geom_type != 'LineString': continue
                items.append((RC[c], list(part.simplify(1.0).coords)))
    rb = bytearray(); lines(rb, items); out['road'] = (bytes(rb), len(items))
    # piers and breakwaters
    i = features('base/infrastructure', box, ['geometry', 'subtype', 'class']); items = []
    if i is not None:
        for geo, sub, c in zip(from_wkb(i.column('geometry').to_numpy(zero_copy_only=False)), i.column('subtype').to_pylist(), i.column('class').to_pylist()):
            if sub != 'pier' or geo is None: continue
            m = intersection(to_m(geo, ox, oy), clip); k = 1 if c == 'breakwater' else 0
            for part in getattr(m, 'geoms', [m]):
                if part.is_empty: continue
                cs = part.exterior.coords if part.geom_type == 'Polygon' else part.coords if part.geom_type == 'LineString' else None
                if cs is not None: items.append((k, list(cs)))
    pb = bytearray(); lines(pb, items); out['pier'] = (bytes(pb), len(items))
    # the fine coast: the land polygons near the tile, simplified
    t = features('base/land', box, ['geometry', 'subtype']); rings = []
    if t is not None:
        for p in polys_of(t, lambda s: s == 'land'):
            m = intersection(to_m(p, ox, oy), clip).simplify(3.0)
            for q in getattr(m, 'geoms', [m]):
                if q.is_empty or q.geom_type != 'Polygon' or q.area < 50: continue
                rings.append((0, list(q.exterior.coords)[:-1]))
                for h in q.interiors: rings.append((1, list(h.coords)[:-1]))
    cb = bytearray(); lines(cb, rings); out['coast'] = (bytes(cb), len(rings))
    return out
