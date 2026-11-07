# The names of the fishing grounds along the whole coast (B2 of docs/planer/bestand-og-flaate.md, 01.11.2026): Fiskeridirektoratet's
# «Fiskeplasser – redskap» (the grounds for active and passive gear, mapped from interviews with the fishermen, NLOD), read from the WFS
# FiskeridirWFS_fiskeri (the layers fiskeplasser_aktive_redskap and fiskeplasser_passive_redskap). Out: src/data/felt.json, the names
# the chart plotter writes without a circle (ui/03-map.js), as Senja's grounds. Where a stretch of coast has no mapped grounds, nothing
# is written there, and the NPC boats keep the slope rule for their grounds (tools/map/npc.py).
#
#   python3 tools/npc/felt.py            (the layers are fetched into tools/npc/cache/; KYST_FELT=<file> writes there instead)
#
# Only the place name (stedsnavn), the polygon and the kind of gear are read. The layers also carry who uses a ground (brukere), notes,
# the municipality and the source; those are never read into the result.
#
# felt.json:
#   meta  made, src, n, unit (km per step of p)
#   p     [x, y, x, y, ...] the label point of each ground in the national frame (UTM 33, x = (E + 250 km)/1000, y = (8050 km - N)/1000),
#         in steps of unit and delta-coded from the previous ground
#   n     [name, ...]
#   r     [radius, ...] the ground's size, the square root of its area in km (0.1 km steps as integers): the chart shows the larger first
#   g     a string with one letter per ground: a active gear (seine, trawl, Danish seine), p passive (nets, line, jig, pots), b both
import os, re, sys, json, time, math, urllib.request, urllib.parse
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))
CACHE = os.path.join(HERE, 'cache')
WFS = 'https://gis.fiskeridir.no/server/services/FiskeridirWFS_fiskeri/MapServer/WFSServer'
LAYERS = {'fiskeplasser_aktive_redskap': 'a', 'fiskeplasser_passive_redskap': 'p'}
UNIT = 0.05            # km: 50 m is finer than any label needs
MERGE_KM = 3.0         # the same name within 3 km is one ground (a ground is often mapped for both kinds of gear)

def fetch(layer):
    os.makedirs(CACHE, exist_ok=True); f = os.path.join(CACHE, layer + '.gml')
    if os.path.exists(f) and time.time() - os.path.getmtime(f) < 20 * 86400: return open(f, encoding='utf-8').read()
    q = urllib.parse.urlencode(dict(service='WFS', version='2.0.0', request='GetFeature', typeNames='FiskeridirWFS_fiskeri:' + layer, srsName='urn:ogc:def:crs:EPSG::25833'))
    for i in range(4):
        try:
            with urllib.request.urlopen(WFS + '?' + q, timeout=600) as r: s = r.read().decode('utf-8')
            if '<wfs:member>' not in s: raise RuntimeError('no features: ' + s[:200])
            open(f, 'w', encoding='utf-8').write(s); return s
        except Exception as e:
            print('  WFS retry', layer, str(e)[:80]); time.sleep(5 * (i + 1))
    raise SystemExit('the WFS did not answer for ' + layer)

def rings(member):
    """the exterior rings of the feature's polygons, in the game's frame (km)"""
    out = []
    for m in re.finditer(r'<gml:exterior>.*?<gml:posList[^>]*>([^<]+)</gml:posList>', member, re.S):
        v = [float(t) for t in m.group(1).split()]
        # EPSG:25833 in the WFS's axis order: easting, northing
        out.append([((v[i] + 250000) / 1000, (8050000 - v[i + 1]) / 1000) for i in range(0, len(v) - 1, 2)])
    return out

def area_centroid(r):
    a = cx = cy = 0.0
    for (x0, y0), (x1, y1) in zip(r, r[1:] + r[:1]):
        c = x0 * y1 - x1 * y0; a += c; cx += (x0 + x1) * c; cy += (y0 + y1) * c
    if abs(a) < 1e-12: return 0.0, sum(p[0] for p in r) / len(r), sum(p[1] for p in r) / len(r)
    return abs(a) / 2, cx / (3 * a), cy / (3 * a)

def inside(r, x, y):
    c = False
    for (x0, y0), (x1, y1) in zip(r, r[1:] + r[:1]):
        if (y0 > y) != (y1 > y) and x < (x1 - x0) * (y - y0) / (y1 - y0) + x0: c = not c
    return c

def label_point(r):
    """the centroid when it lies inside the ring, else the middle of the widest row through the ring at the centroid's height"""
    a, cx, cy = area_centroid(r)
    if inside(r, cx, cy): return a, cx, cy
    best = None
    ys = sorted(p[1] for p in r)
    for f in (0.5, 0.35, 0.65, 0.2, 0.8):
        y = ys[0] + (ys[-1] - ys[0]) * f; xs = []
        for (x0, y0), (x1, y1) in zip(r, r[1:] + r[:1]):
            if (y0 > y) != (y1 > y): xs.append(x0 + (y - y0) * (x1 - x0) / (y1 - y0))
        xs.sort()
        for i in range(0, len(xs) - 1, 2):
            if best is None or xs[i + 1] - xs[i] > best[0]: best = (xs[i + 1] - xs[i], (xs[i] + xs[i + 1]) / 2, y)
        if best: break
    return (a, best[1], best[2]) if best else (a, cx, cy)

def clean(n):
    n = re.sub(r'\s+', ' ', n).strip().strip('.,;-')
    if not n or re.fullmatch(r'[\d\s./-]+', n) or n.lower() in ('udefinert', 'ukjent', 'ingen navn'): return None
    return n

def main():
    G = []                         # [name, x, y, area, kinds]
    for layer, kind in LAYERS.items():
        s = fetch(layer); n0 = len(G)
        for m in s.split('<wfs:member>')[1:]:
            nm = re.search(r':stedsnavn>([^<]*)<', m)
            n = clean(nm.group(1)) if nm else None
            if not n: continue
            rs = [r for r in rings(m) if len(r) >= 3]
            if not rs: continue
            parts = [label_point(r) for r in rs]; a = sum(p[0] for p in parts); big = max(parts, key=lambda p: p[0])
            G.append([n, big[1], big[2], a, kind])
        print(f'{layer}: {len(G) - n0} named grounds')
    # one ground per name within MERGE_KM: the largest polygon keeps its point, the kinds are joined
    G.sort(key=lambda g: -g[3]); out = []; byname = {}
    for g in G:
        key = g[0].lower(); hit = None
        for o in byname.get(key, []):
            if math.hypot(o[1] - g[1], o[2] - g[2]) < MERGE_KM: hit = o; break
        if hit:
            if g[4] not in hit[4]: hit[4] += g[4]
            hit[3] += g[3]; continue
        g = list(g); out.append(g); byname.setdefault(key, []).append(g)
    out.sort(key=lambda g: (g[2], g[1]))
    p = []; px = py = 0
    for g in out:
        x, y = round(g[1] / UNIT), round(g[2] / UNIT); p += [x - px, y - py]; px, py = x, y
    D = {'meta': {'made': time.strftime('%Y-%m-%d'), 'src': 'Fiskeridirektoratet, «Fiskeplasser – redskap» (aktive og passive redskap), WFS FiskeridirWFS_fiskeri, NLOD',
                  'n': len(out), 'unit': UNIT},
         'p': p, 'n': [g[0] for g in out], 'r': [round(math.sqrt(g[3]) * 10) for g in out],
         'g': ''.join('b' if len(g[4]) > 1 else g[4] for g in out)}
    f = os.environ.get('KYST_FELT') or os.path.join(ROOT, 'src', 'data', 'felt.json')
    open(f, 'w', encoding='utf-8').write(json.dumps(D, ensure_ascii=False, separators=(',', ':')) + '\n')
    print(f'{len(out)} grounds after joining the same name within {MERGE_KM} km, {os.path.getsize(f) / 1000:.0f} kB -> {f}')

if __name__ == '__main__': main()
