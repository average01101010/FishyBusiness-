# The sea marks along the whole coast (Jonas 05.10.2026: «Sjømerker må ordnes langs hele kysten. Alt senja har, må resten av norge ha
# også»): lights with their sectors and characters, beacons, stakes, buoys, cairns and the rocks, from OpenStreetMap's seamark tags
# (OpenSeaMap; in Norway mostly from Kystverket's data), in the game's national frame (km), in the format of src/data/seamarks.json:
#   lights [x, y, height m, range nm, sequence (+ on, - off, seconds), sectors [[from°, to°, 'w'|'r'|'g'|'y']], 'M'|'m', name]
#           the sectors' bearings are true and from seaward (towards the light), as OpenSeaMap has them; an all-round light [[0, 360, c]]
#   marks  [x, y, type, category(, arrow)]: M lighthouse, m minor light, P pile or post, K cairn, L lateral beacon and B lateral buoy
#           (category port or starb; w a white one of the inland waterways, '' none known: never drawn as port), C cardinal buoy and
#           S cardinal beacon (north, east, south, west), and from sjomerker-8 (Ø13 K3, IALA region A, 12.11.2026):
#           D a stake or beacon that is no IALA mark (the iron rods, jernstenger, mostly beacon_isolated_danger of the shape stake in
#             Kystverket's data, 11 600 of 13 234; category '' a stake, tower, lattice, ball for a ball on top),
#           I isolated danger buoy and i beacon (black with a red band, two balls: the colours black;red;black or the topmark 2 spheres),
#           A safe water buoy and a beacon (red and white upright stripes, one red ball),
#           Y special mark buoy and y beacon (yellow, a cross; Y's category: its colour y, w or r, s spherical, x the cross on top).
#           The fifth field, when there, is the arrow on top (viser, krekse; seamark:topmark:orientation): its bearing, true, in degrees
#   rocks  [x, y]
# From Geofabrik's extract of Norway (with its waters), filtered by osmium; Overpass timed out on the coast's bands (504, 05.10.2026)
# and is kept as a fallback. Both are closed to the cloud session and open in Actions (.github/workflows/sjomerker.yml, started by a
# change to tools/map/sjomerker.json): the release sjomerker-<run number> has sjomerker.json.gz, which tools/map/release.py fetches
# and tools/map/game.py puts into each tile's chart pack as its 'marks' entry.
#   python3 tools/map/sjomerker.py pbf norway-latest.osm.pbf out/sjomerker.json    from the extract (osmium-tool on the path)
#   python3 tools/map/sjomerker.py fetch out/sjomerker.json                         the bands over the frame from Overpass
#   python3 tools/map/sjomerker.py geojson sjomerker-kilde.geojsonseq.gz out/sjomerker.json   from the source a release keeps
import os, sys, re, json, time, gzip
import requests
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
from frame import to_nat
OVERPASS = ['https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter']
# the coast of the frame in bands of latitude (south to north), each a query of its own so none is too big
BANDS = [(57.8, 59.5, 4.4, 12.0), (59.5, 61.5, 4.4, 11.0), (61.5, 63.5, 4.4, 12.0), (63.5, 65.5, 8.0, 15.0), (65.5, 67.5, 10.5, 17.5),
         (67.5, 69.0, 11.5, 19.0), (69.0, 70.2, 14.5, 25.0), (70.2, 71.4, 18.0, 31.5), (69.0, 70.2, 25.0, 31.5)]
# the islands off the old frame (H1b R3): Svalbard with Bjørnøya and Hopen, and Jan Mayen (s, n, w, e). Geofabrik's Norway extract may
# leave them out; then they come from Overpass, which takes boxes this small
ISLANDS = [(74.0, 81.0, 9.0, 35.0), (70.5, 71.5, -9.5, -7.5)]
TYPES = 'light_major|light_minor|light_vessel|light_float|beacon_lateral|beacon_cardinal|beacon_isolated_danger|beacon_special_purpose|beacon_safe_water|buoy_lateral|buoy_cardinal|buoy_isolated_danger|buoy_special_purpose|buoy_safe_water|landmark|pile|rock'

def query(s, w, n, e):
    q = f'[out:json][timeout:900][maxsize:1073741824];(nwr["seamark:type"~"^({TYPES})$"]({s},{w},{n},{e});node["seamark:light:colour"]({s},{w},{n},{e});node["seamark:light:1:colour"]({s},{w},{n},{e}););out center tags;'
    for k in range(6):
        url = OVERPASS[k % len(OVERPASS)]
        try:
            r = requests.post(url, data={'data': q}, timeout=1200, headers={'User-Agent': 'kystfiske-sjomerker (github.com/average01101010/FishyBusiness-)'})
            if r.status_code == 200: return r.json()['elements']
            print('overpass', url, r.status_code, r.text[:200], flush=True)
        except Exception as ex: print('overpass', url, ex, flush=True)
        time.sleep(30 * (k + 1))
    raise SystemExit('overpass failed for band %s' % ((s, w, n, e),))

def num(v, d=None):
    try: return float(str(v).replace(',', '.').split(';')[0].strip())
    except Exception: return d
COL = {'white': 'w', 'red': 'r', 'green': 'g', 'yellow': 'y', 'orange': 'y', 'amber': 'y'}
# the light's rhythm as seconds on (+) and off (-): the sequence when it is given ('1+(4)', '0.5+(1)+0.5+(3.5)'), else from the
# character and the period (Fl a flash of 0.5 s, LFl 2 s, Oc dark 1 s, Iso half and half, Q and VQ quick, F fixed)
def seq_of(t, k):
    s, ch, per = t.get(k + 'sequence'), (t.get(k + 'character') or '').strip(), num(t.get(k + 'period'))
    if s:
        out = []
        for part in s.split('+'):
            part = part.strip(); off = part.startswith('(')
            v = num(part.strip('()'))
            if v is None or v <= 0: out = []; break
            out.append(round(-v if off else v, 2))
        if out: return out
    c = ch.split('(')[0].replace('.', '').upper()
    if c in ('', 'F'): return [1]
    if c in ('Q', 'IQ'): return [0.4, -0.6]
    if c in ('VQ', 'IVQ'): return [0.25, -0.25]
    p = per or (4 if c in ('FL', 'LFL') else 6)
    if c in ('FL', 'ALFL'): return [0.5, -round(max(0.5, p - 0.5), 2)]
    if c == 'LFL': return [2, -round(max(1, p - 2), 2)]
    if c in ('OC', 'ALOC'): return [round(max(0.5, p - 1), 2), -1]
    if c == 'ISO': return [round(p / 2, 2), -round(p / 2, 2)]
    return [0.5, -round(max(0.5, p - 0.5), 2)]
def colour(v): return COL.get((v or 'white').split(';')[0].strip(), 'w')

# a light that only lights up the mark (seamark:light:N:category=floodlight; on 2 075 lateral beacons a yellow F beside the red or
# green, Ø11.8's control 9.3) is no signal, and is left out
FLOOD = ('floodlight', 'floodlit')
def light_of(t, x, y, kind):
    secs, rng, hgt, sq = [], [], [], None
    for i in range(1, 40):
        k = f'seamark:light:{i}:'
        if not any(key.startswith(k) for key in t): continue
        if (t.get(k + 'category') or '').split(';')[0] in FLOOD: continue
        a, b = num(t.get(k + 'sector_start')), num(t.get(k + 'sector_end'))
        if a is None or b is None or abs((b - a) % 360) < 1e-6: a, b = 0, 360   # no sector, or all round
        else: a, b = round(a % 360, 1), round(b % 360, 1)
        secs.append([a, b, colour(t.get(k + 'colour'))])
        if num(t.get(k + 'range')) is not None: rng.append(num(t.get(k + 'range')))
        if num(t.get(k + 'height')) is not None: hgt.append(num(t.get(k + 'height')))
        if sq is None and (t.get(k + 'character') or t.get(k + 'sequence')): sq = seq_of(t, k)
    if not secs:
        if not any(key.startswith('seamark:light:') and not re.match(r'seamark:light:\d+:', key) for key in t): return None
        if (t.get('seamark:light:category') or '').split(';')[0] in FLOOD: return None
        secs = [[0, 360, colour(t.get('seamark:light:colour'))]]
    k = 'seamark:light:'
    if num(t.get(k + 'range')) is not None: rng.append(num(t.get(k + 'range')))
    if num(t.get(k + 'height')) is not None: hgt.append(num(t.get(k + 'height')))
    if sq is None: sq = seq_of(t, k)
    name = t.get('seamark:name') or t.get('name') or ''
    return [x, y, round(hgt[0] if hgt else 6.0, 1), round(max(rng) if rng else 3.0, 1), sq, secs, kind, name]

def first(v): return (v or '').split(';')[0].strip()
LAT = {'starboard': 'starb', 'preferred_channel_port': 'starb', 'port': 'port', 'preferred_channel_starboard': 'port'}
# a mark's kind, category and arrow from its tags (the format above). A lateral mark without a category of its own takes it from its
# colour (red port, green starboard in region A); white is w, anything else '' (Ø11.8: 21 such beacons were drawn red)
def mark_of(t, ty):
    g = lambda k: t.get(f'seamark:{ty}:{k}') or ''
    shape, col, top = g('shape'), g('colour'), t.get('seamark:topmark:shape') or ''
    arrow = None
    if top == 'arrow':
        a = num(t.get('seamark:topmark:orientation'))
        if a is not None: arrow = int(round(a)) % 360
    if ty == 'light_major': return 'M', '', None
    if ty in ('light_minor', 'light_vessel'): return 'm', '', None
    if ty == 'pile': return 'P', '', None
    if ty in ('beacon_lateral', 'buoy_lateral', 'light_float'):
        cat = LAT.get(g('category'), '')
        if not cat: cat = {'red': 'port', 'green': 'starb', 'white': 'w'}.get(first(col), '')
        return ('L' if ty == 'beacon_lateral' else 'B'), cat, arrow if ty == 'beacon_lateral' else None
    if ty in ('buoy_cardinal', 'beacon_cardinal'):
        cat = g('category'); return ('C' if ty == 'buoy_cardinal' else 'S'), cat if cat in ('north', 'east', 'south', 'west') else '', None
    if ty == 'buoy_isolated_danger': return 'I', '', None
    if ty == 'buoy_safe_water': return 'A', '', None
    if ty == 'beacon_safe_water': return 'a', '', None
    if ty == 'buoy_special_purpose':
        c = {'yellow': 'y', 'white': 'w', 'red': 'r'}.get(first(col), 'y')
        return 'Y', c + ('s' if shape == 'spherical' else '') + ('x' if top in ('x-shape', 'cross') else ''), None
    if ty in ('beacon_isolated_danger', 'beacon_special_purpose'):
        cs = set(c.strip() for c in col.split(';') if c.strip())
        if ty == 'beacon_isolated_danger' and ({'black', 'red'} <= cs or top == '2 spheres'): return 'i', '', None
        if ty == 'beacon_special_purpose' and (first(col) == 'yellow' or top in ('x-shape', 'cross')): return 'y', '', None
        # the rest are Norway's stakes and beacons by their shape, with the arrow they carry
        return 'D', {'tower': 'tower', 'lattice': 'lattice'}.get(shape, 'ball' if top == 'sphere' and shape in ('', 'stake') else ''), arrow
    if ty == 'landmark' and re.search(r'cairn', t.get('seamark:landmark:category', '')): return 'K', '', None
    return None, '', None

def convert(els):
    lights, marks, rocks, seen = [], [], [], set()
    for el in els:
        t = el.get('tags') or {}
        lat, lon = (el.get('lat'), el.get('lon')) if el['type'] == 'node' else ((el.get('center') or {}).get('lat'), (el.get('center') or {}).get('lon'))
        if lat is None: continue
        key = (el['type'], el['id'])
        if key in seen: continue
        seen.add(key)
        X, Y = to_nat(lon, lat); x, y = round(float(X), 4), round(float(Y), 4)
        ty = t.get('seamark:type', '')
        if ty == 'rock': rocks.append([x, y]); continue
        mk, cat, arrow = mark_of(t, ty)
        if mk: marks.append([x, y, mk, cat] + ([arrow] if arrow is not None else []))
        L = light_of(t, x, y, 'M' if ty == 'light_major' else 'm')
        if L: lights.append(L)
    return {'lights': lights, 'marks': marks, 'rocks': rocks}

# the extract's seamarks as Overpass-like elements: osmium keeps the objects with the tags, and exports them as GeoJSON lines with
# their tags; a way's or an area's middle is the mean of its points
def from_pbf(pbf):
    import subprocess, tempfile
    tmp = tempfile.mkdtemp(); flt = os.path.join(tmp, 'sm.osm.pbf'); gj = os.path.join(tmp, 'sm.geojsonseq')
    subprocess.run(['osmium', 'tags-filter', pbf, 'nwr/seamark:type', 'n/seamark:light:colour', 'n/seamark:light:1:colour', '-o', flt, '--overwrite'], check=True)
    subprocess.run(['osmium', 'export', flt, '-f', 'geojsonseq', '-o', gj, '--overwrite', '--add-unique-id=type_id', '-x', 'print_record_separator=false'], check=True)
    return from_geojsonseq(gj)
# the same from such GeoJSON lines (gzipped or not): sjomerker.yml keeps them in the release as sjomerker-kilde.geojsonseq.gz, so a
# session, where Geofabrik is closed, can run the converter on what the release was made from
def from_geojsonseq(gj):
    els = []
    for line in (gzip.open(gj, 'rt', encoding='utf-8') if gj.endswith('.gz') else open(gj, encoding='utf-8')):
        line = line.strip().lstrip('\x1e')
        if not line: continue
        f = json.loads(line); g = f.get('geometry') or {}; c = g.get('coordinates')
        if not c: continue
        pts = []
        def walk(v):
            if isinstance(v[0], (int, float)): pts.append(v)
            else:
                for w in v: walk(w)
        walk(c)
        lon = sum(p[0] for p in pts) / len(pts); lat = sum(p[1] for p in pts) / len(pts)
        uid = str(f.get('id', ''))
        els.append({'type': {'n': 'node', 'w': 'way', 'r': 'relation', 'a': 'way'}.get(uid[:1], 'node'), 'id': uid, 'lat': lat, 'lon': lon, 'tags': f.get('properties') or {}})
    return els

# The control of Ø11.8 (docs/systemer/sjofart-og-lover.md 9.3) counted on a sjomerker.json: the buoys and beacons drawn as port that are
# not port marks (a lateral mark without a side: the 3D view and the chart draw it white since K3), the lateral marks with a yellow light (the floodlight read as a light), and each kind of mark
def check(f):
    from collections import Counter
    d = json.load(open(f)); M = d['marks']
    at = {(round(m[0], 4), round(m[1], 4)): m for m in M}
    lat_y = sum(1 for L in d['lights'] if (lambda m: m and m[2] in 'LB' and any(c[2] == 'y' for c in L[5]))(at.get((round(L[0], 4), round(L[1], 4)))))
    out = {'marks': len(M), 'lights': len(d['lights']),
           'lateral_no_side': sum(1 for m in M if m[2] in ('L', 'B') and m[3] not in ('port', 'starb')),   # sjomerker-7 drew these red
           'buoys_no_kind': sum(1 for m in M if m[2] == 'B' and not m[3]),
           'lateral_yellow_light': lat_y,
           'kinds': Counter(m[2] + (':' + m[3] if m[3] else '') for m in M).most_common(),
           'arrows': sum(1 for m in M if len(m) > 4)}
    print(json.dumps(out, ensure_ascii=False)); return out

if __name__ == '__main__':
    if len(sys.argv) >= 3 and sys.argv[1] == 'check': check(sys.argv[2]); sys.exit(0)
    if len(sys.argv) >= 4 and sys.argv[1] in ('pbf', 'geojson'):
        out = sys.argv[3]; els = (from_pbf if sys.argv[1] == 'pbf' else from_geojsonseq)(sys.argv[2]); print('extract', len(els), flush=True); src = 'Geofabrik\'s Norway extract'
        isl = lambda e: any(b[0] <= e['lat'] <= b[1] and b[2] <= e['lon'] <= b[3] for b in ISLANDS)
        n = sum(1 for e in els if isl(e)); print('on the islands in the extract', n, flush=True)
        if n < 20:   # the extract has not got Svalbard and Jan Mayen: Overpass for them
            seen = {(e['type'], str(e['id'])) for e in els}; got = 0
            for b in ISLANDS:
                try: q = query(b[0], b[2], b[1], b[3])
                except BaseException as ex: print('overpass failed', b, repr(ex)[:200], flush=True); continue
                for e in q:
                    if 'lat' not in e and 'center' in e: e = dict(e, lat=e['center']['lat'], lon=e['center']['lon'])
                    if (e.get('type'), str(e.get('id'))) not in seen and 'lat' in e: els.append(e); got += 1
                print('island box', b, len(q), flush=True); time.sleep(10)
            if got: src += ' and Overpass for Svalbard and Jan Mayen'
        d = convert(els); d['src'] = 'OpenStreetMap (ODbL) seamark tags from ' + src + ', ' + time.strftime('%Y-%m-%d')
    elif len(sys.argv) >= 3 and sys.argv[1] == 'fetch':
        out = sys.argv[2]; els = []
        for b in BANDS:
            e = query(*[b[0], b[2], b[1], b[3]]); print('band', b, len(e), flush=True); els += e; time.sleep(10)
        d = convert(els); d['src'] = 'OpenStreetMap (ODbL) seamark tags via Overpass, ' + time.strftime('%Y-%m-%d')
    else: sys.exit('python3 tools/map/sjomerker.py pbf norway-latest.osm.pbf out/sjomerker.json | geojson kilde.geojsonseq.gz out/sjomerker.json | fetch out/sjomerker.json')
    os.makedirs(os.path.dirname(os.path.abspath(out)), exist_ok=True)
    json.dump(d, open(out, 'w'), separators=(',', ':'), ensure_ascii=False)
    with gzip.open(out + '.gz', 'wt', encoding='utf-8') as g: json.dump(d, g, separators=(',', ':'), ensure_ascii=False)
    from collections import Counter
    print(json.dumps({'lights': len(d['lights']), 'marks': len(d['marks']), 'rocks': len(d['rocks']), 'types': Counter(m[2] for m in d['marks']), 'mb': round(os.path.getsize(out + '.gz') / 1e6, 2)}))
