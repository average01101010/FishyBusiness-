# The sea marks along the whole coast (Jonas 05.10.2026: «Sjømerker må ordnes langs hele kysten. Alt senja har, må resten av norge ha
# også»): lights with their sectors and characters, beacons, stakes, buoys, cairns and the rocks, from OpenStreetMap's seamark tags
# (OpenSeaMap; in Norway mostly from Kystverket's data), in the game's national frame (km), in the format of src/data/seamarks.json:
#   lights [x, y, height m, range nm, sequence (+ on, - off, seconds), sectors [[from°, to°, 'w'|'r'|'g'|'y']], 'M'|'m', name]
#           the sectors' bearings are true and from seaward (towards the light), as OpenSeaMap has them; an all-round light [[0, 360, c]]
#   marks  [x, y, type, category]: M lighthouse, m minor light, P pile or post, D stake (a danger or special mark), L lateral beacon,
#           B buoy, C cardinal buoy, S cardinal beacon, K cairn; category port/starb or north/east/south/west
#   rocks  [x, y]
# Overpass is closed to the cloud session and open in Actions (.github/workflows/sjomerker.yml, started by a change to
# tools/map/sjomerker.json): the release sjomerker-<run number> has sjomerker.json.gz, which tools/map/release.py fetches and
# tools/map/game.py puts into each tile's chart pack as its 'marks' entry.
#   python3 tools/map/sjomerker.py fetch out/sjomerker.json      the bands over the frame from Overpass
import os, sys, re, json, time, gzip
import requests
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
from frame import to_nat
OVERPASS = ['https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter']
# the coast of the frame in bands of latitude (south to north), each a query of its own so none is too big
BANDS = [(57.8, 59.5, 4.4, 12.0), (59.5, 61.5, 4.4, 11.0), (61.5, 63.5, 4.4, 12.0), (63.5, 65.5, 8.0, 15.0), (65.5, 67.5, 10.5, 17.5),
         (67.5, 69.0, 11.5, 19.0), (69.0, 70.2, 14.5, 25.0), (70.2, 71.4, 18.0, 31.5), (69.0, 70.2, 25.0, 31.5)]
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

def light_of(t, x, y, kind):
    secs, rng, hgt, sq = [], [], [], None
    for i in range(1, 40):
        k = f'seamark:light:{i}:'
        if not any(key.startswith(k) for key in t): continue
        a, b = num(t.get(k + 'sector_start')), num(t.get(k + 'sector_end'))
        if a is None or b is None or abs((b - a) % 360) < 1e-6: a, b = 0, 360   # no sector, or all round
        else: a, b = round(a % 360, 1), round(b % 360, 1)
        secs.append([a, b, colour(t.get(k + 'colour'))])
        if num(t.get(k + 'range')) is not None: rng.append(num(t.get(k + 'range')))
        if num(t.get(k + 'height')) is not None: hgt.append(num(t.get(k + 'height')))
        if sq is None and (t.get(k + 'character') or t.get(k + 'sequence')): sq = seq_of(t, k)
    if not secs:
        if not any(key.startswith('seamark:light:') for key in t): return None
        secs = [[0, 360, colour(t.get('seamark:light:colour'))]]
    k = 'seamark:light:'
    if num(t.get(k + 'range')) is not None: rng.append(num(t.get(k + 'range')))
    if num(t.get(k + 'height')) is not None: hgt.append(num(t.get(k + 'height')))
    if sq is None: sq = seq_of(t, k)
    name = t.get('seamark:name') or t.get('name') or ''
    return [x, y, round(hgt[0] if hgt else 6.0, 1), round(max(rng) if rng else 3.0, 1), sq, secs, kind, name]

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
        cat = ''
        if ty == 'light_major': mk = 'M'
        elif ty in ('light_minor', 'light_vessel'): mk = 'm'
        elif ty == 'pile': mk = 'P'
        elif ty == 'beacon_lateral': mk = 'L'; cat = t.get('seamark:beacon_lateral:category', '')
        elif ty in ('buoy_lateral', 'light_float'): mk = 'B'; cat = t.get('seamark:buoy_lateral:category', '')
        elif ty == 'buoy_cardinal': mk = 'C'; cat = t.get('seamark:buoy_cardinal:category', '')
        elif ty == 'beacon_cardinal': mk = 'S'; cat = t.get('seamark:beacon_cardinal:category', '')
        elif ty in ('beacon_isolated_danger', 'beacon_special_purpose', 'beacon_safe_water'): mk = 'D'
        elif ty in ('buoy_isolated_danger', 'buoy_special_purpose', 'buoy_safe_water'): mk = 'B'
        elif ty == 'landmark': mk = 'K' if re.search(r'cairn', t.get('seamark:landmark:category', '')) else None
        else: mk = None
        cat = {'starboard': 'starb', 'preferred_channel_port': 'starb', 'port': 'port', 'preferred_channel_starboard': 'port'}.get(cat, cat if cat in ('north', 'east', 'south', 'west') else '')
        if mk: marks.append([x, y, mk, cat])
        L = light_of(t, x, y, 'M' if ty == 'light_major' else 'm')
        if L: lights.append(L)
    return {'lights': lights, 'marks': marks, 'rocks': rocks}

if __name__ == '__main__':
    if len(sys.argv) < 3 or sys.argv[1] != 'fetch': sys.exit('python3 tools/map/sjomerker.py fetch out/sjomerker.json')
    out = sys.argv[2]; els = []
    for b in BANDS:
        e = query(*[b[0], b[2], b[1], b[3]]); print('band', b, len(e), flush=True); els += e; time.sleep(10)
    d = convert(els); d['src'] = 'OpenStreetMap (ODbL) seamark tags via Overpass, ' + time.strftime('%Y-%m-%d')
    os.makedirs(os.path.dirname(os.path.abspath(out)), exist_ok=True)
    json.dump(d, open(out, 'w'), separators=(',', ':'), ensure_ascii=False)
    with gzip.open(out + '.gz', 'wt', encoding='utf-8') as g: json.dump(d, g, separators=(',', ':'), ensure_ascii=False)
    from collections import Counter
    print(json.dumps({'lights': len(d['lights']), 'marks': len(d['marks']), 'rocks': len(d['rocks']), 'types': Counter(m[2] for m in d['marks']), 'mb': round(os.path.getsize(out + '.gz') / 1e6, 2)}))
