# The floating docks along the coast (tilbakemelding #94, Jonas 25.10.2026: the packs' piers that are floating docks get the Blender
# model of tools/harbour/brygge.py): Overture's piers (base/infrastructure, subtype pier) that OpenStreetMap tags floating=yes, from the
# same Overture release as the packs (kart.json), so the game knows them again by their middle. Kept apart from the packs, so the map
# need not be built anew for it. Each dock is its middle as the game reckons it (vecDecode: the mean of the pack's points, whole metres
# in the national frame), and the lines its pontoons and fingers follow: a pier mapped as a line is the line; a pier mapped as an area
# its middle line (the medial axis from the Voronoi edges of its outline, the spurs to its corners cut off), with the width there.
#   python3 tools/map/flyte.py            -> src/data/flyte.json (needs tools/map/out/game, release.py and game.py first, for the tiles)
# The format: {"src", "d": [[mx, mz, [[w, x0, z0, x1, z1, ...], ...]], ...]}: the middle in metres in the national frame (x east, z
# south), the points in whole decimetres from it; w the width in decimetres (24 a pontoon's 2.4 m, under 16 a finger's)
import os, sys, json, math
import numpy as np
from shapely import from_wkb, voronoi_polygons, segmentize, MultiPoint, LineString, Polygon, Point
from shapely.ops import linemerge, unary_union
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))
sys.path.insert(0, HERE)
import frame, ov

def nat(geo):
    from shapely.ops import transform
    def f(x, y, z=None):
        X, Y = frame.to_nat(np.asarray(x), np.asarray(y)); return X * 1000, Y * 1000
    return transform(f, geo)

def mid(cs):
    # as vecDecode: the mean of the points (a ring's first point twice), each in whole metres
    xs = [round(x) for x, _ in cs]; zs = [round(z) for _, z in cs]
    return sum(xs) / len(xs), sum(zs) / len(zs)

def width_at(poly, p):
    return 2 * poly.exterior.distance(p)

# the middle line of a narrow area: one line along its long axis when it is near a rectangle, else the Voronoi medial axis
def middle(poly):
    poly = poly.buffer(0)
    if poly.is_empty or poly.geom_type != 'Polygon' or poly.area < 4: return []
    rect = poly.minimum_rotated_rectangle; rc = list(rect.exterior.coords)[:4]
    e = [math.dist(rc[i], rc[i + 1]) for i in range(2)]
    if poly.area / max(rect.area, 1e-6) > 0.8:
        k = 0 if e[0] >= e[1] else 1; a, b = rc[k], rc[k + 1]; c, d = rc[(k + 2) % 4], rc[(k + 3) % 4]
        p0 = ((a[0] + d[0]) / 2, (a[1] + d[1]) / 2); p1 = ((b[0] + c[0]) / 2, (b[1] + c[1]) / 2)
        return [(min(e), [p0, p1])]
    ring = segmentize(poly.exterior, 0.4)
    edges = voronoi_polygons(MultiPoint(list(ring.coords)), only_edges=True)
    inner = poly.buffer(-0.02); keep = []
    for g in getattr(edges, 'geoms', [edges]):
        if g.length < 1e-6 or not inner.contains(g): continue
        a, b = Point(g.coords[0]), Point(g.coords[-1])
        # the spurs to the corners come close to the outline at one end
        if min(poly.exterior.distance(a), poly.exterior.distance(b)) < 0.3: continue
        keep.append(g)
    if not keep: return []
    m = linemerge(unary_union(keep)); parts = list(getattr(m, 'geoms', [m]))
    out = []
    for ln in parts:
        ln = ln.simplify(0.4)
        if ln.length < 2.0: continue
        cs = list(ln.coords)
        # the width along it: the median of the widths at its points
        ws = sorted(width_at(poly, Point(c)) for c in cs)
        out.append((ws[len(ws) // 2], cs))
    return out

def main():
    kart = json.load(open(os.path.join(HERE, 'kart.json')))
    assert kart['overture'] == ov.RELEASE, (kart['overture'], ov.RELEASE)
    t = ov.features('base/infrastructure', ov.NOR, ['geometry', 'subtype', 'class', 'source_tags'])
    # only the tiles that have vec packs (the game's coast, not Sweden's or Finland's): the release's manifest via game.py's
    man = json.load(open(os.path.join(HERE, 'out', 'game', 'manifest.json')))
    vt = {tuple(pk['tile']) for pk in man['packs'] if pk['kind'] == 'vec'}
    docks = []; n_line = n_area = 0
    for g, sub, st in zip(t.column('geometry').to_pylist(), t.column('subtype').to_pylist(), t.column('source_tags').to_pylist()):
        if sub != 'pier' or g is None: continue
        tags = dict(st or [])
        if tags.get('floating') != 'yes': continue
        geo = nat(from_wkb(g))
        for part in getattr(geo, 'geoms', [geo]):
            if part.is_empty or part.geom_type not in ('Polygon', 'LineString'): continue
            if part.geom_type == 'LineString':
                cs = list(part.coords); mx, mz = mid(cs)
                lines = [(2.4, list(part.simplify(0.4).coords))]; n_line += 1
            else:
                cs = list(part.exterior.coords); mx, mz = mid(cs)
                lines = middle(part); n_area += 1
            if not lines or (int(mx // 50000), int(mz // 50000)) not in vt: continue
            L = []
            for w, pts in lines:
                q = [int(round(min(60, w) * 10))]
                for x, z in pts: q += [int(round((x - mx) * 10)), int(round((z - mz) * 10))]
                L.append(q)
            docks.append([round(mx, 1), round(mz, 1), L])
    docks.sort(key=lambda d: (d[1], d[0]))
    out = {'src': 'Overture ' + ov.RELEASE + ' base/infrastructure, piers OpenStreetMap tags floating=yes (ODbL); tools/map/flyte.py', 'd': docks}
    f = os.path.join(ROOT, 'src', 'data', 'flyte.json')
    json.dump(out, open(f, 'w'), separators=(',', ':'))
    print(len(docks), 'floating docks,', n_line, 'lines and', n_area, 'areas;', os.path.getsize(f) // 1024, 'kB', file=sys.stderr)

if __name__ == '__main__':
    main()
