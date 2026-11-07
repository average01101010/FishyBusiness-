# The landmarks of G7 (docs/planer/grafikk-natur-og-miljo.md): the wind turbines and the power lines that cross the sea, from
# OpenStreetMap in Overture's base/infrastructure (ODbL; most of the turbines' heights come from Kartverket's register of aviation
# obstacles, which OpenStreetMap took in). NVE's own lists cannot be fetched from here (kart.nve.no and api.nve.no are shut to the
# container); OpenStreetMap has every turbine standing in Norway with its height, hub and rotor where known. No owner, operator or
# maker is taken, only where they stand and how big they are.
#   turbines: power=generator with generator:source=wind, standing (no construction, disused or abandoned tag), on Norway's land or
#     in its sea (tools/map/national.py norway200), in the coast's tiles (the vec packs). Hub and rotor from height:hub and
#     rotor:diameter; where only the total height is known, the rotor is 0.75 of it (an old 66 m turbine has 44 m, a new 178 m one
#     149 m) and the hub stands half the rotor under the tip; with nothing, an 80 m hub and a 90 m rotor.
#   spans: the stretches between two masts of a power line (power_line, minor_line) 120 m long or more whose middle crosses the sea
#     (the 200 m land mask, national.py mask200: a sample of the middle 80 % on water), with both masts on land. Voltage where known.
#   python3 tools/vind/vind.py      -> src/data/vind.json {src, t:[[x, z, hub, rotor] m], s:[[x1, z1, x2, z2, kV] m]}
import os, sys, json, re, numpy as np
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE)); sys.path.insert(0, os.path.join(ROOT, 'tools', 'map'))
import ov, national
from frame import to_nat
from shapely import from_wkb

def num(s):
    m = re.match(r'\s*([0-9]+(?:[.,][0-9]+)?)', str(s or '')); return float(m.group(1).replace(',', '.')) if m else None

def main():
    kart = json.load(open(os.path.join(ROOT, 'tools', 'map', 'kart.json'))); assert kart['overture'] == ov.RELEASE
    man = json.load(open(os.path.join(ROOT, 'tools', 'map', 'out', 'game', 'manifest.json'))); vt = {tuple(p['tile']) for p in man['packs'] if p['kind'] == 'vec'}
    M = national.mask200(); NL, NS = national.norway200(); NOR = NL | NS
    def cell(x, z): i, j = int(x / 200), int(z / 200); return (j, i) if 0 <= j < M.shape[0] and 0 <= i < M.shape[1] else None
    def land(x, z): c = cell(x, z); return c is not None and M[c] > 0
    def norway(x, z): c = cell(x, z); return c is not None and NOR[c]
    t = ov.features('base/infrastructure', ov.NOR, ['geometry', 'subtype', 'class', 'source_tags'])
    T, S, skip = [], [], 0
    for g, sub, cls, st in zip(t.column('geometry').to_pylist(), t.column('subtype').to_pylist(), t.column('class').to_pylist(), t.column('source_tags').to_pylist()):
        if sub != 'power' or g is None: continue
        d = dict(st or [])
        if cls == 'generator':
            if d.get('generator:source') != 'wind' or any(k.startswith(('construction', 'disused', 'abandoned', 'demolished', 'proposed')) for k in d): continue
            p = from_wkb(g).centroid; x, z = (float(v) * 1000 for v in to_nat(p.x, p.y))
            if (int(x // 50000), int(z // 50000)) not in vt or not norway(x, z): skip += 1; continue
            H, hub, D = num(d.get('height')), num(d.get('height:hub')), num(d.get('rotor:diameter'))
            if D is None or not 10 < D < 260: D = 0.75 * H if H and 20 < H < 330 else (hub * 1.1 if hub else 90)
            if hub is None or not 10 < hub < 200: hub = H - D / 2 if H and 20 < H < 330 else 80
            T.append([round(x), round(z), round(hub), round(D)])
        elif cls in ('power_line', 'minor_line'):
            ln = from_wkb(g)
            for part in getattr(ln, 'geoms', [ln]):
                if part.geom_type != 'LineString': continue
                cs = np.array(part.coords); X, Z = (np.asarray(v, float) * 1000 for v in to_nat(cs[:, 0], cs[:, 1]))
                kv = num((d.get('voltage') or '').split(';')[0]); kv = round(kv / 1000) if kv else (22 if cls == 'minor_line' else 66)
                for k in range(len(X) - 1):
                    x1, z1, x2, z2 = X[k], Z[k], X[k + 1], Z[k + 1]; L = np.hypot(x2 - x1, z2 - z1)
                    if L < 120 or (int(x1 // 50000), int(z1 // 50000)) not in vt or not (norway(x1, z1) or norway(x2, z2)): continue
                    if not (land(x1, z1) and land(x2, z2)): continue
                    f = np.linspace(0.1, 0.9, max(5, int(L / 60)))
                    if any(not land(x1 + (x2 - x1) * q, z1 + (z2 - z1) * q) for q in f): S.append([round(x1), round(z1), round(x2), round(z2), kv])
    # a crossing OpenStreetMap draws a line per phase (the Sognefjord's, each conductor on its own masts) is one span here: one whose
    # ends are both within 80 m of a kept span's ends is left out (the game hangs three wires on each)
    S.sort(key=lambda a: -a[4]); K = []
    for a in S:
        if not any(min(np.hypot(a[0] - b[0], a[1] - b[1]) + np.hypot(a[2] - b[2], a[3] - b[3]), np.hypot(a[0] - b[2], a[1] - b[3]) + np.hypot(a[2] - b[0], a[3] - b[1])) < 160 for b in K if abs(a[0] - b[0]) < 6000 and abs(a[1] - b[1]) < 6000): K.append(a)
    S = K
    T.sort(key=lambda a: (a[1], a[0])); S.sort(key=lambda a: (a[1], a[0]))
    out = {'src': 'Overture ' + ov.RELEASE + ' base/infrastructure: OpenStreetMap power=generator (wind) and power lines over the sea (ODbL), heights mostly from Kartverket\'s aviation obstacles; tools/vind/vind.py', 't': T, 's': S}
    f = os.path.join(ROOT, 'src', 'data', 'vind.json'); json.dump(out, open(f, 'w'), separators=(',', ':'))
    print(len(T), 'turbines,', len(S), 'spans over the sea,', skip, 'turbines outside;', os.path.getsize(f) // 1024, 'kB', file=sys.stderr)

if __name__ == '__main__':
    main()
