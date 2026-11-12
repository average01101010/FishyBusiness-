# The speed limits at sea (Ø11.8, docs/systemer/sjofart-og-lover.md kap. 9) -> src/data/fart.json, read by core/05e-sjovei.js (fartAt).
#
# Two sources, and only the first is in use (11.11.2026):
#   havn  Jonas' choice V4 A (28.10.2026): «En fast grense i havnene hvis Kystverket ikke har et åpent datasett.» One fixed limit within
#         a radius of every harbour point the game has (PORTS, core/01-world.js); the game makes the zones itself, so new harbours get
#         theirs without this file being written again.
#   omr   The state's speed limits for commercial vessels (FOR-2021-12-16-3622 «Forskrift om statlige fartsgrenser på sjøen», Kystverket;
#         the data set «Statlige fartsgrenser på sjøen for næringsfartøy» on Geonorge). Not fetched: kartkatalog.geonorge.no and
#         kystverket.no are not reachable from the sessions' network, and the licence has not been read at the source. When the data set
#         has been fetched by hand (or by a workflow) and its licence allows it, give it here as GeoJSON in WGS-84:
#             python3 tools/fart/fart.py omrader.geojson [--kn FELT] [--navn FELT] [--fra FELT --til FELT]
#         Every polygon becomes {n, kn, m, p}: the name, the limit in knots, the months it holds ([from, to], 1-12, or null for the whole
#         year) and the ring as [lat, lon] with five decimals. The field names of the data set have not been seen, so they are given on
#         the command line (the defaults are guesses), and a feature without a limit is left out and counted.
#   python3 tools/fart/fart.py            (the fixed limit alone)
import os, sys, json
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, '..', '..', 'src', 'data', 'fart.json')
HAVN = {'kn': 5, 'r': 0.5}   # knots, and km round the harbour point (the basin and the way in; inHarbour's own disk is 0.6)

def arg(name, default):
    return sys.argv[sys.argv.index(name) + 1] if name in sys.argv else default

def areas(path):
    kn_f, navn_f, fra_f, til_f = arg('--kn', 'fartsgrense'), arg('--navn', 'navn'), arg('--fra', 'fraMaaned'), arg('--til', 'tilMaaned')
    out, skipped = [], 0
    for f in json.load(open(path, encoding='utf-8')).get('features', []):
        g, pr = f.get('geometry') or {}, f.get('properties') or {}
        try: kn = float(pr.get(kn_f))
        except (TypeError, ValueError): skipped += 1; continue
        polys = [g['coordinates']] if g.get('type') == 'Polygon' else g.get('coordinates', []) if g.get('type') == 'MultiPolygon' else []
        m = [int(pr[fra_f]), int(pr[til_f])] if pr.get(fra_f) and pr.get(til_f) else None
        for poly in polys:
            ring = [[round(lat, 5), round(lon, 5)] for lon, lat in (q[:2] for q in poly[0])]   # (the outer ring; holes are left out)
            if len(ring) >= 4: out.append({'n': str(pr.get(navn_f) or ''), 'kn': kn, 'm': m, 'p': ring})
    print(f'{len(out)} areas, {skipped} features without a limit in «{kn_f}»')
    return out

if __name__ == '__main__':
    src = [a for a in sys.argv[1:] if a.endswith('.geojson') or a.endswith('.json')]
    omr = areas(src[0]) if src else []
    J = {'v': 1,
         'src': 'V4 A (Jonas 28.10.2026): a fixed limit in the harbours' + ('; areas from ' + os.path.basename(src[0]) if src else ''),
         'havn': HAVN, 'omr': omr}
    with open(OUT, 'w', encoding='utf-8') as o: json.dump(J, o, ensure_ascii=False, separators=(',', ':')); o.write('\n')
    print('wrote', os.path.normpath(OUT), os.path.getsize(OUT), 'bytes')
