# The small-boat harbours along the coast (G10 of docs/planer/grafikk-natur-og-miljo.md): OpenStreetMap's leisure=marina areas in
# Overture's base/land_use (recreation/marina, ODbL), on Norway's land or sea and in the coast's tiles, each its outline simplified
# (4 m, at most 20 corners) round its middle. The 3D view moors small boats in them (view3d/22-docks-air.js drawMarinas): along the
# floating docks inside (src/data/flyte.json), else on buoys in rows over the water. No names are kept.
#   python3 tools/map/marina.py     -> src/data/marina.json {src, m:[[x, z, [dx, dz, ...] m]]} (after release.py and game.py)
import os, sys, json
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))
import ov, national
from frame import to_nat
from shapely import from_wkb
from shapely.ops import transform

def main():
    kart = json.load(open(os.path.join(HERE, 'kart.json'))); assert kart['overture'] == ov.RELEASE
    man = json.load(open(os.path.join(HERE, 'out', 'game', 'manifest.json'))); vt = {tuple(p['tile']) for p in man['packs'] if p['kind'] == 'vec'}
    NL, NS = national.norway200(); NOR = NL | NS
    t = ov.features('base/land_use', ov.NOR, ['geometry', 'subtype', 'class']); out = []
    nat = lambda g: transform(lambda x, y, z=None: tuple(v * 1000 for v in to_nat(x, y)), g)
    for g, sub, cls in zip(t.column('geometry').to_pylist(), t.column('subtype').to_pylist(), t.column('class').to_pylist()):
        if cls != 'marina' or g is None: continue
        geo = nat(from_wkb(g))
        for part in getattr(geo, 'geoms', [geo]):
            if part.geom_type != 'Polygon' or part.area < 400: continue
            c = part.centroid; x, z = c.x, c.y
            if (int(x // 50000), int(z // 50000)) not in vt: continue
            i, j = int(x / 200), int(z / 200)
            if not (0 <= j < NOR.shape[0] and 0 <= i < NOR.shape[1] and NOR[j, i]): continue
            tol = 4; s = part.exterior.simplify(tol)
            while len(s.coords) > 21: tol *= 1.5; s = part.exterior.simplify(tol)
            q = []
            for px, pz in list(s.coords)[:-1]: q += [round(px - x), round(pz - z)]
            out.append([round(x), round(z), q])
    out.sort(key=lambda a: (a[1], a[0]))
    f = os.path.join(ROOT, 'src', 'data', 'marina.json')
    json.dump({'src': 'Overture ' + ov.RELEASE + ' base/land_use recreation/marina: OpenStreetMap leisure=marina (ODbL); tools/map/marina.py', 'm': out}, open(f, 'w'), separators=(',', ':'))
    print(len(out), 'marinas,', os.path.getsize(f) // 1024, 'kB', file=sys.stderr)

if __name__ == '__main__':
    main()
