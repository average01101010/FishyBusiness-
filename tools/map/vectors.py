# The coast's vector layers per 50 km tile (phase K5 of the coast plan), from Overture, in metres from the tile's corner
# (tx * 50 000, ty * 50 000) in the national frame, packed as the game's legacy layers were (01-world.js, view3d.js):
#   bld    buildings as oriented rectangles: X, Y (u16, m), length and width (u8: half metres to 80 m, then 2 m steps), angle (u8,
#          of pi, clockwise from x), type | levels << 4 (u8; the types of view3d.js: 1 house, 2 flats, 3 garage, 4 cabin, 5 boathouse,
#          6 barn, 7 shed, 8 industrial, 9 commercial, 10 public, 11 church, 13 greenhouse); the lite profile keeps those within 2 km
#          of the sea
#   road   varints: n, then per road class (0 trunk/primary ... 4 service/track), point count, zigzag steps (m); the parts Overture
#          flags as a bridge or a tunnel are left out (a tunnel would be drawn over the mountain, Tromsøysundtunnelen over the sea)
#   bridge the road bridges of 15 m and more as JSON, as the game's BRIDGES: [class, length (m), name, 'yes', x, y, x, y, ...] (m);
#          the pieces of one bridge (Overture splits a road where others join it) joined, kept in the tile its middle is in
#   pier   the same varints with 0 pier, 1 breakwater, 2 quay (a quay's line with the water on its left, (-dy, dx)); kept whole in the
#          tile their middle is in
#   quay   the faces a boat can lie at (where the NPC boats berth, the user's wish 03.10.2026): the straight edges of 10 m and more of
#          the piers (a pier mapped as a line counts as 4.2 m wide), the quays' lines, and the straight coast (1 m) of 25 m and more
#          within 150 m of a pier or quay or 30 m of a big industrial building (a fish plant); X, Y of the middle (u16, m), the angle of the normal towards the water (u16, of 2 pi, from
#          x towards y), length (u8, as bld), the depth off it (u8, quarter metres: the tile's 50 m depth at the first of 25, 50 and 75 m
#          out that has water; 0 where none has, which the game reads as unknown) and kind (u8: 0 pier, 1 pier line, 2 quay, 3
#          coast). How big a boat fits is the game's to say (VESSELS); the depth is coarse, a 50 m grid at a quay
#   coast  the land polygons simplified to 3 m and cut to the tile and 500 m round it: n, then per ring its point count and steps
import math, numpy as np
import json
from shapely import from_wkb, box as sbox, intersection, LineString, Point, Polygon
from shapely.ops import transform as stransform, substring, linemerge, unary_union
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

# a road's pieces (in m) by what Overture flags them as: 'road', 'bridge' or 'tunnel' (road_flags: values, between as fractions)
def flagged(m, flags):
    cuts = []
    for r in flags or []:
        v = r.get('values') or []; k = 'bridge' if 'is_bridge' in v else 'tunnel' if 'is_tunnel' in v else None
        if k: a, b = r.get('between') or (0.0, 1.0); cuts.append((max(0.0, a), min(1.0, b), k))
    if not cuts: return [('road', m, 0.0, 1.0)]
    out, pos = [], 0.0
    for a, b, k in sorted(cuts):
        if a > pos: out.append(('road', substring(m, pos, a, normalized=True), pos, a))
        if b > max(a, pos): out.append((k, substring(m, max(a, pos), b, normalized=True), max(a, pos), b))
        pos = max(pos, b)
    if pos < 1: out.append(('road', substring(m, pos, 1.0, normalized=True), pos, 1.0))
    return out

# the name over a piece of a road (names.rules have their own between), else the road's own
def name_at(nm, a, b):
    if not nm: return ''
    c = (a + b) / 2
    for r in nm.get('rules') or []:
        bw = r.get('between')
        if r.get('variant') == 'common' and bw and bw[0] <= c <= bw[1]: return r.get('value') or ''
    return nm.get('primary') or ''

def build(tx, ty, near_sea=None, L=None):
    R = frame.Region('v', tx * 5, ty * 5, tx * 5 + 5, ty * 5 + 5); box = R.lonlat_box(0.6); ox, oy = tx * 50000.0, ty * 50000.0; out = {}
    clip = sbox(-500, -500, 50500, 50500); inside = lambda x, y: 0 <= x < 50000 and 0 <= y < 50000
    # the tile's mask (25 m, > 0 land) and depth (50 m, half metres, 0 on land), for the quays; without them every side is water
    M = L['mask'] if L is not None else None; D = L['depth'] if L is not None else None
    def land(x, y):
        if M is None: return False
        return M[min(1999, max(0, int(y // 25))), min(1999, max(0, int(x // 25)))] > 0
    def depth(x, y):
        if D is None: return 0.0
        return D[min(999, max(0, int(y // 50))), min(999, max(0, int(x // 50)))] / 2
    # buildings
    b = features('buildings/building', box, ['geometry', 'class', 'subtype', 'height', 'num_floors'])
    X, Y, Lq, Wq, Aq, Tq = [], [], [], [], [], []
    if b is not None:
        g = from_wkb(b.column('geometry').to_numpy(zero_copy_only=False)); cl = b.column('class').to_pylist(); sb = b.column('subtype').to_pylist(); fl = b.column('num_floors').to_pylist(); hh = b.column('height').to_pylist()
        for geo, c, s, nf, h in zip(g, cl, sb, fl, hh):
            if geo is None or geo.geom_type not in ('Polygon', 'MultiPolygon'): continue
            m = to_m(geo, ox, oy); cx, cy = m.centroid.x, m.centroid.y
            if not inside(cx, cy): continue
            if near_sea is not None and not near_sea(cx, cy): continue
            r = m.minimum_rotated_rectangle; cs = np.asarray(r.exterior.coords)[:4]
            e1, e2 = cs[1] - cs[0], cs[2] - cs[1]; l1, l2 = np.hypot(*e1), np.hypot(*e2)
            ax = e1 if l1 >= l2 else e2; Lb, W = max(l1, l2), min(l1, l2); a = math.atan2(ax[1], ax[0]) % math.pi
            t = BT.get(c) or BT.get(s) or (7 if Lb * W < 25 else 1 if Lb * W < 250 else 8)
            lv = int(nf) if nf else (int(round(h / 3)) if h else 0)
            X.append(int(round(cx))); Y.append(int(round(cy))); Lq.append(qlen(Lb)); Wq.append(qlen(W)); Aq.append(int(round(a / math.pi * 256)) % 256); Tq.append(t | (min(lv, 15) << 4))
    n = len(X)
    out['bld'] = (np.array(X, np.uint16).tobytes() + np.array(Y, np.uint16).tobytes() + bytes(Lq) + bytes(Wq) + bytes(Aq) + bytes(Tq), n)
    # roads, without their bridges and tunnels; the bridges by class and name, joined
    s = features('transportation/segment', box, ['geometry', 'subtype', 'class', 'road_flags', 'names']); items = []; brp = {}
    if s is not None:
        for geo, sub, c, fl, nm in zip(from_wkb(s.column('geometry').to_numpy(zero_copy_only=False)), s.column('subtype').to_pylist(), s.column('class').to_pylist(), s.column('road_flags').to_pylist(), s.column('names').to_pylist()):
            if sub != 'road' or c not in RC or geo is None: continue
            for k, piece, a, b2 in flagged(to_m(geo, ox, oy), fl):
                if piece.is_empty or piece.length < 0.5: continue
                if k == 'tunnel': continue
                if k == 'bridge': brp.setdefault((RC[c], name_at(nm, a, b2)), []).append(piece); continue
                m = intersection(piece, clip)
                for part in getattr(m, 'geoms', [m]):
                    if part.is_empty or part.geom_type != 'LineString': continue
                    items.append((RC[c], list(part.simplify(1.0).coords)))
    bridges, kept = [], []
    for (c, nm), pieces in sorted(brp.items(), key=lambda x: (x[0][0], x[0][1])):
        mg = linemerge(pieces)
        for line in getattr(mg, 'geoms', [mg]):
            if line.is_empty or line.geom_type != 'LineString': continue
            mid = line.interpolate(0.5, normalized=True)
            if not inside(mid.x, mid.y): continue
            if line.length < 15:   # a culvert: the road goes on over it
                m = intersection(line, clip)
                if not m.is_empty and m.geom_type == 'LineString': items.append((c, list(m.simplify(1.0).coords)))
                continue
            if any(line.hausdorff_distance(o) < 10 for o in kept): continue   # mapped twice, or one way each 5 m apart (a deck is 9 m wide)
            kept.append(line); q = [c, int(round(line.length)), nm, 'yes']
            for x, y in line.simplify(1.0).coords: q += [int(round(x)), int(round(y))]
            bridges.append(q)
    rb = bytearray(); lines(rb, items); out['road'] = (bytes(rb), len(items))
    out['bridge'] = (json.dumps(bridges, ensure_ascii=False, separators=(',', ':')).encode(), len(bridges))
    # piers, breakwaters and quays (Overture's infrastructure: pier/pier, water/breakwater, quay/quay), whole, in the tile of their middle
    i = features('base/infrastructure', box, ['geometry', 'subtype', 'class']); items = []; pgeo = []
    if i is not None:
        for geo, sub, c in zip(from_wkb(i.column('geometry').to_numpy(zero_copy_only=False)), i.column('subtype').to_pylist(), i.column('class').to_pylist()):
            k = 0 if sub == 'pier' else 1 if c == 'breakwater' else 2 if sub == 'quay' else None
            if k is None or geo is None: continue
            m = to_m(geo, ox, oy)
            for part in getattr(m, 'geoms', [m]):
                if part.is_empty or part.geom_type not in ('Polygon', 'LineString'): continue
                cen = part.centroid
                if not inside(cen.x, cen.y): continue
                cs = list(part.exterior.coords) if part.geom_type == 'Polygon' else list(part.coords)
                if k == 2 and len(cs) > 1:
                    # the water on the left of the line, (-dy, dx), as most of its length has it
                    sc = 0.0
                    for (ax_, ay_), (bx_, by_) in zip(cs, cs[1:]):
                        dx, dy = bx_ - ax_, by_ - ay_; ln = math.hypot(dx, dy)
                        if ln < 1: continue
                        nx, ny = -dy / ln, dx / ln; mx, my = (ax_ + bx_) / 2, (ay_ + by_) / 2
                        sc += ln * ((0 if land(mx + nx * 15, my + ny * 15) else 1) - (0 if land(mx - nx * 15, my - ny * 15) else 1))
                    if sc < 0: cs = cs[::-1]
                items.append((k, cs)); pgeo.append((k, part.geom_type == 'Polygon', cs))
    pb = bytearray(); lines(pb, items); out['pier'] = (bytes(pb), len(items))
    # the fine coast: the land polygons near the tile, simplified
    t = features('base/land', box, ['geometry', 'subtype']); rings = []; landp = []
    if t is not None:
        for p in polys_of(t, lambda s: s == 'land'):
            pm = to_m(p, ox, oy)
            if pm.intersects(clip): landp.append(intersection(pm, clip))
            m = intersection(pm, clip).simplify(3.0)
            for q in getattr(m, 'geoms', [m]):
                if q.is_empty or q.geom_type != 'Polygon' or q.area < 50: continue
                rings.append((0, list(q.exterior.coords)[:-1]))
                for h in q.interiors: rings.append((1, list(h.coords)[:-1]))
    cb = bytearray(); lines(cb, rings); out['coast'] = (bytes(cb), len(rings))
    # the quay faces
    F = []
    def face(ax_, ay_, bx_, by_, nx, ny, k):
        ln = math.hypot(bx_ - ax_, by_ - ay_)
        if ln > 200:   # a long quay in pieces, so a length fits in its byte
            n = math.ceil(ln / 200)
            for j in range(n): face(ax_ + (bx_ - ax_) * j / n, ay_ + (by_ - ay_) * j / n, ax_ + (bx_ - ax_) * (j + 1) / n, ay_ + (by_ - ay_) * (j + 1) / n, nx, ny, k)
            return
        mx, my = (ax_ + bx_) / 2, (ay_ + by_) / 2
        if not inside(mx, my) or land(mx + nx * 20, my + ny * 20): return
        d = next((v for v in (depth(mx + nx * r, my + ny * r) for r in (25, 50, 75)) if v > 0), 0.0)   # the nearest water (the deepest of the three was too kind)
        F.append((mx, my, math.atan2(ny, nx) % (2 * math.pi), ln, d, k))
    near = []
    for k, poly, cs in pgeo:
        if k == 1: continue
        near.append((LineString(cs) if len(cs) > 1 else Point(cs[0]), 150))
        if poly:
            P = Polygon(cs).buffer(0); sm = P.simplify(0.5)
            if sm.is_empty or sm.geom_type != 'Polygon': continue
            ext = list(sm.exterior.coords)
            for (ax_, ay_), (bx_, by_) in zip(ext, ext[1:]):
                ln = math.hypot(bx_ - ax_, by_ - ay_)
                if ln < 10: continue
                nx, ny = -(by_ - ay_) / ln, (bx_ - ax_) / ln
                if sm.contains(Point((ax_ + bx_) / 2 + nx * 1.5, (ay_ + by_) / 2 + ny * 1.5)): nx, ny = -nx, -ny
                face(ax_, ay_, bx_, by_, nx, ny, 0)
        else:
            sl = list(LineString(cs).simplify(0.5).coords)
            for (ax_, ay_), (bx_, by_) in zip(sl, sl[1:]):
                ln = math.hypot(bx_ - ax_, by_ - ay_)
                if ln < 10: continue
                nx, ny = -(by_ - ay_) / ln, (bx_ - ax_) / ln
                if k == 2: face(ax_, ay_, bx_, by_, nx, ny, 2)
                else:
                    for sd in (1, -1): face(ax_ + nx * sd * 2.1, ay_ + ny * sd * 2.1, bx_ + nx * sd * 2.1, by_ + ny * sd * 2.1, nx * sd, ny * sd, 1)
    # the coast counts as a quay near a pier or quay (150 m), or along a big industrial building (a fish plant on its quay, which is
    # often mapped as the coastline alone); at 300 m round the piers the rip-rap along the roads of a town came in too
    for x, y, lq, wq, tq in zip(X, Y, Lq, Wq, Tq):
        lb, wb = (lq * 0.5 if lq <= 160 else 80 + (lq - 160) * 2), (wq * 0.5 if wq <= 160 else 80 + (wq - 160) * 2)
        if tq & 15 == 8 and lb * wb >= 300: near.append((Point(x, y), lb / 2 + 30))
    if near and landp:
        zone = unary_union([g.buffer(r) for g, r in near])
        for lp in landp:
            for q in getattr(lp, 'geoms', [lp]):
                if q.is_empty or q.geom_type != 'Polygon': continue
                sm = q.simplify(1.0)
                if sm.is_empty or sm.geom_type != 'Polygon' or not sm.intersects(zone): continue
                for ring in [sm.exterior] + list(sm.interiors):
                    cs = list(ring.coords)
                    for (ax_, ay_), (bx_, by_) in zip(cs, cs[1:]):
                        ln = math.hypot(bx_ - ax_, by_ - ay_)
                        if ln < 25: continue
                        mx, my = (ax_ + bx_) / 2, (ay_ + by_) / 2
                        if not zone.contains(Point(mx, my)): continue
                        nx, ny = -(by_ - ay_) / ln, (bx_ - ax_) / ln
                        if sm.contains(Point(mx + nx * 1.5, my + ny * 1.5)): nx, ny = -nx, -ny
                        face(ax_, ay_, bx_, by_, nx, ny, 3)
    out['quay'] = (np.array([round(f[0]) for f in F], np.uint16).tobytes() + np.array([round(f[1]) for f in F], np.uint16).tobytes() +
                   np.array([round(f[2] / (2 * math.pi) * 65536) % 65536 for f in F], np.uint16).tobytes() + bytes(qlen(f[3]) for f in F) +
                   bytes(min(255, round(f[4] * 4)) for f in F) + bytes(f[5] for f in F), len(F))
    return out
