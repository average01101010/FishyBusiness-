# The names of the fishing grounds along the whole coast (B2 of docs/planer/bestand-og-flaate.md, 01.11.2026): Fiskeridirektoratet's
# «Fiskeplasser – redskap» (the grounds for active and passive gear, mapped from interviews with the fishermen, NLOD), read from the WFS
# FiskeridirWFS_fiskeri (the layers fiskeplasser_aktive_redskap and fiskeplasser_passive_redskap). Out: src/data/felt.json, the names
# the chart plotter writes without a circle (ui/03-map.js). Where a stretch of coast has no mapped grounds, nothing is written there,
# and the NPC boats keep the slope rule for their grounds (tools/map/npc.py).
# Ø14 F1 (docs/planer/fangstfelt.md, 08.11.2026): each ground also carries the species the game knows with the gear and the months the
# fishermen gave (fiskeart_N, redskap_N, fra_N, til_N), its shape (the polygons, simplified) for F2, and the names are washed (2.6).
# The spawning grounds (gyteomraader) and the nursery and feeding grounds (oppvekst_beiteomraade) of the same interviews come in as
# kinds of their own (V3, Jonas: «Ta det mest realistiske»): a name, a point, the species and the months; never weight or pressure.
#
#   python3 tools/npc/felt.py            (the layers are fetched into tools/npc/cache/; KYST_FELT=<file> writes there instead)
#
# Read: the place name (stedsnavn), the polygon, the kind of gear, and the lines of species, gear and months. The layers also carry
# who uses a ground (brukere), notes, the municipality and the source; those are never read into the result.
#
# felt.json:
#   meta  made, src, n, unit (km per step of p and s), sp (the species of l, by index), gear (the gear bits of l, GEAR in fiske.py),
#         kinds (the count of each kind), wash (how many names each washing rule changed)
#   p     [x, y, x, y, ...] the label point of each ground in the national frame (UTM 33, x = (E + 250 km)/1000, y = (8050 km - N)/1000),
#         in steps of unit and delta-coded from the previous ground
#   n     [name, ...] the washed name, shortened for the chart at a slash or after 28 characters; '' when the source's name was only a
#         position (the ground stays, as weight without a name)
#   nf    [[i, full name], ...] the whole washed name where n is shortened (the tap in F4)
#   r     [radius, ...] the ground's size, the square root of its area in km (0.1 km steps as integers): the chart shows the larger first
#   g     a string with one letter per ground: a active gear (seine, trawl, Danish seine), p passive (nets, line, jig, pots), b both,
#         - for the spawning and nursery grounds (no gear)
#   k     a string with one letter per ground: f a fishing ground (fiskeplass), g a spawning ground (gyteområde), o a nursery and
#         feeding ground (oppvekst- og beiteområde). Only f is ever weight or pressure in the game.
#   l     [[[sp, gear, months], ...], ...] per ground: the species (index in meta.sp), the gear as bits (1 << index in meta.gear; 0 for
#         the spawning and nursery grounds, or a line without gear) and the months as 12 bits (1 << 0 is January). A ground with no
#         species the game knows has no lines (V2 A: it counts for the jig species all year).
#
# felt-s.b64 (the shapes, F1 measured them: 445 kB as JSON in felt.json against the target of 350 kB for the whole file, so they are a
# file of their own that the build takes out of the page as data/felt-s-<hash>.bin and the page fetches at boot, as the models;
# core/01e-marks.js feltShape): base64 of unsigned LEB128 varints, zigzag for the signed ones. First the number of grounds (= meta.n),
# then per ground in felt.json's order the number of rings, and per ring the number of points and the points as (dx, dy) in steps of
# unit, the first relative to the ground's label point and the rest delta-coded; simplified to SIMPLIFY_KM (Douglas-Peucker). Only the
# fishing grounds (k = f) have rings; the spawning and nursery grounds need only their point. meta.sb is the file's length in bytes.
import os, re, sys, json, time, math, urllib.request, urllib.parse
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))
CACHE = os.path.join(HERE, 'cache')
WFS = 'https://gis.fiskeridir.no/server/services/FiskeridirWFS_fiskeri/MapServer/WFSServer'
LAYERS = {'fiskeplasser_aktive_redskap': ('f', 'a'), 'fiskeplasser_passive_redskap': ('f', 'p'), 'gyteomraader': ('g', '-'), 'oppvekst_beiteomraade': ('o', '-')}
UNIT = 0.05            # km: 50 m is finer than any label needs
MERGE_KM = 3.0         # the same name within 3 km is one ground (a ground is often mapped for both kinds of gear)
SIMPLIFY_KM = 0.1      # the shapes: Douglas-Peucker to 100 m (F1 measured this against 500 m cells, docs/planer/fangstfelt.md)
SHORT = 28             # a name longer than this is cut at a word for the chart (the whole name in nf)
# the species the game knows (SPECIES in core/02-species-gear.js), by the name in Fiskeridirektoratet's lines («1022 TORSK»)
SP = {'TORSK': 'torsk', 'HYSE': 'hyse', 'SEI': 'sei', 'LYR': 'lyr', 'LANGE': 'lange', 'BROSME': 'brosme', 'UER': 'uer', 'KVEITE': 'kveite',
      'BLÅKVEITE': 'blakveite', 'KONGEKRABBE': 'krabbe', 'SILD': 'sild', 'MAKRELL': 'makrell', 'SNØKRABBE': 'snokrabbe'}
SPL = ['torsk', 'hyse', 'sei', 'lyr', 'lange', 'brosme', 'uer', 'kveite', 'blakveite', 'krabbe', 'sild', 'makrell', 'snokrabbe']
MON = {m: i for i, m in enumerate(['JAN', 'FEB', 'MAR', 'APR', 'MAI', 'JUN', 'JUL', 'AUG', 'SEP', 'OKT', 'NOV', 'DES'])}
sys.path.insert(0, HERE)
from fiske import GEAR, gear_of

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

SMALL = {'i', 'av', 'til', 'fra', 'og', 'på', 'ved', 'mot', 'om', 'for', 'med', 'under', 'over', 'utenfor', 'innenfor', 'nord', 'sør', 'øst', 'vest'}
COMPASS = re.compile(r'^(?:[NSØV]{1,3}|NNØ|NNV|SSØ|SSV|[IVX]+)$')
WASH = {'entity': 0, 'caps': 0, 'stray': 0, 'lower': 0, 'underscore': 0, 'position': 0, 'slash': 0, 'long': 0}

def cap(w):
    """a word in capitals to ordinary writing, each part of a hyphenated word with a capital first letter (the first letter, also after
    a bracket or a quote); the compass points and Roman numerals stay as they are («SV», «III»)"""
    def one(x):
        if COMPASS.match(re.sub(r'[^A-Za-zÆØÅæøå]', '', x) or '-'): return x
        x = x.lower(); m = re.search(r'[a-zæøåäöüé]', x)
        return x[:m.start()] + x[m.start()].upper() + x[m.start() + 1:] if m else x
    return '-'.join(one(x) for x in w.split('-'))

def wash(n):
    """the washed name and the name for the chart (docs/planer/fangstfelt.md 2.6); None when nothing is left of it"""
    import html
    if n is None: return None, None
    m = html.unescape(n)
    if m != n: WASH['entity'] += 1
    n = re.sub(r'\s+', ' ', m).strip().strip('.,;-').strip()
    if not n or re.fullmatch(r'[\d\s./-]+', n) or n.lower() in ('udefinert', 'ukjent', 'ingen navn'): return None, None
    # a position for a name («N 59°29,4' Ø 5°06,3'»): the ground stays without a name
    if re.search(r"\d+\s*°", n): WASH['position'] += 1; return '', ''
    if '_' in n: n = re.sub(r'\s*_\s*', ' ', n).strip(); WASH['underscore'] += 1
    # capitals to ordinary writing: a name in capitals alone gets each word with a capital first letter and the small words in small
    # letters; in a mixed name only the words of three or more capitals (not the compass points and Roman numerals) are changed
    letters = re.sub(r'[^A-Za-zÆØÅæøåÄÖÜäöüÉéÈè]', '', n)
    if letters and letters.upper() == letters and len(letters) >= 3:
        ws = n.split(' '); n = ' '.join(w.lower() if (i and w.lower().strip('.,') in SMALL and w.lower() not in ('nord', 'sør', 'øst', 'vest')) else cap(w) for i, w in enumerate(ws))
        WASH['caps'] += 1
    else:
        ws = n.split(' '); o = []
        for w in ws:
            core = re.sub(r'[^A-Za-zÆØÅæøå]', '', w)
            # (a compass point the source wrote in small letters, «Sø. av Hjelmsøya», in capitals as the others)
            o.append(cap(w) if len(core) >= 3 and core.upper() == core and not COMPASS.match(core) else
                     w.upper() if re.fullmatch(r'(?:Nø|Nv|Sø|Sv|Nnø|Nnv|Ssø|Ssv)\.?', w) else w)
        if o != ws: WASH['caps'] += 1; n = ' '.join(o)
    # a stray small letter before the capital («lKråksundet»), and a small first letter («taran»)
    if re.match(r'^[a-zæøå][A-ZÆØÅ][a-zæøå]', n): n = n[1:]; WASH['stray'] += 1
    if n[:1].islower(): n = n[:1].upper() + n[1:]; WASH['lower'] += 1
    # the chart's name: before a slash, and at most SHORT characters cut at a word
    # (not at «v/», ved; and a cut name does not end on a small word: «Fra Risneset…», not «Fra Risneset til…»)
    short = n
    parts = re.split(r'(?<=[^\s/]{2})/', short)
    if len(parts) > 1: short = parts[0].strip(' ,-–'); WASH['slash'] += 1
    if len(short) > SHORT:
        ws = short[:SHORT + 1].split(' ')
        if len(ws) > 1:
            ws = ws[:-1]
            while len(ws) > 1 and (ws[-1].lower() in SMALL or not re.search(r'[A-Za-zÆØÅæøå]{2}', ws[-1])): ws.pop()
            cut = ' '.join(ws).rstrip(' ,-–:')
        else: cut = short[:SHORT]
        short = cut + '…'; WASH['long'] += 1
    return n, short

def species_lines(m, kind):
    """the lines of species the game knows: {sp: [[gear bits, month bits], ...]} (merged further in lines_of)"""
    t = dict(re.findall(r'<FiskeridirWFS_fiskeri:(fiskeart_\d|redskap_\d|fra_\d|til_\d)>([^<]*)<', m))
    out = []
    for i in range(1, 9):
        a = t.get(f'fiskeart_{i}', '').strip()
        w = re.sub(r'^[\d\s]+', '', a).strip().upper()
        sp = SP.get(w)
        if not sp: continue
        r = t.get(f'redskap_{i}', '').strip(); gb = 0
        if kind == 'f' and r.isdigit() and int(r) > 0: gb = 1 << gear_of(r)
        f0, f1 = MON.get(t.get(f'fra_{i}', '').strip().upper()), MON.get(t.get(f'til_{i}', '').strip().upper())
        if f0 is None and f1 is None: mb = 4095                    # no months given: the whole year
        else:
            if f0 is None: f0 = f1
            if f1 is None: f1 = f0
            mb = 0; j = f0
            while True:
                mb |= 1 << j
                if j == f1: break
                j = (j + 1) % 12
        out.append((SPL.index(sp), gb, mb))
    return out

def lines_of(L):
    """the lines merged: the same species and months join their gear, then the same species and gear join their months"""
    a = {}
    for sp, gb, mb in L: a[(sp, mb)] = a.get((sp, mb), 0) | gb
    b = {}
    for (sp, mb), gb in a.items(): b[(sp, gb)] = b.get((sp, gb), 0) | mb
    return sorted([sp, gb, mb] for (sp, gb), mb in b.items())

def dp(pts, tol):
    """Douglas-Peucker on an open line (the ends kept)"""
    keep = [False] * len(pts); keep[0] = keep[-1] = True; st = [(0, len(pts) - 1)]
    while st:
        i, j = st.pop()
        if j - i < 2: continue
        (x0, y0), (x1, y1) = pts[i], pts[j]; dx, dy = x1 - x0, y1 - y0; L = math.hypot(dx, dy); best, bi = -1.0, -1
        for k in range(i + 1, j):
            d = abs(dy * (pts[k][0] - x0) - dx * (pts[k][1] - y0)) / L if L > 1e-9 else math.hypot(pts[k][0] - x0, pts[k][1] - y0)
            if d > best: best, bi = d, k
        if best > tol: keep[bi] = True; st += [(i, bi), (bi, j)]
    return [q for q, k in zip(pts, keep) if k]

def simplify(r, tol):
    """a closed ring simplified: split at its first point and the point farthest from it, each half by Douglas-Peucker"""
    pts = r[:-1] if len(r) > 1 and r[0] == r[-1] else list(r)
    if len(pts) < 4: return pts
    far = max(range(len(pts)), key=lambda i: (pts[i][0] - pts[0][0]) ** 2 + (pts[i][1] - pts[0][1]) ** 2)
    return dp(pts[:far + 1], tol)[:-1] + dp(pts[far:] + [pts[0]], tol)[:-1]

def cells_of(rings, c):
    """the cells of c km whose middle lies in a ring (for the measurement against the polygons), at least the cell of each ring's middle"""
    out = set()
    for r in rings:
        xs = [p[0] for p in r]; ys = [p[1] for p in r]; n0 = len(out)
        for iy in range(math.floor(min(ys) / c), math.floor(max(ys) / c) + 1):
            for ix in range(math.floor(min(xs) / c), math.floor(max(xs) / c) + 1):
                if inside(r, (ix + 0.5) * c, (iy + 0.5) * c): out.add((ix, iy))
        if len(out) == n0: out.add((math.floor(sum(xs) / len(xs) / c), math.floor(sum(ys) / len(ys) / c)))
    return out

def varint(v, out):
    while True:
        b = v & 127; v >>= 7
        if v: out.append(b | 128)
        else: out.append(b); return

def zz(v): return (v << 1) if v >= 0 else ((-v << 1) - 1)

def main():
    G = []                         # [name, x, y, area, gear kinds, kind, lines, rings, short name]
    for layer, (kind, gk) in LAYERS.items():
        s = fetch(layer); n0 = len(G); nl = 0
        for m in s.split('<wfs:member>')[1:]:
            nm = re.search(r':stedsnavn>([^<]*)<', m)
            n, short = wash(nm.group(1) if nm else None)
            if n is None: continue
            rs = [r for r in rings(m) if len(r) >= 3]
            if not rs: continue
            parts = [label_point(r) for r in rs]; a = sum(p[0] for p in parts); big = max(parts, key=lambda p: p[0])
            L = species_lines(m, kind); nl += len(L) > 0
            G.append([n, big[1], big[2], a, gk, kind, L, rs if kind == 'f' else [], short])
        print(f'{layer}: {len(G) - n0} named, {nl} with species the game knows')
    print('the washing (names changed per rule):', json.dumps(WASH, ensure_ascii=False))
    # one ground per name and kind within MERGE_KM: the largest polygon keeps its point; the gear kinds, the lines and the shapes are
    # joined. A ground without a name (a position for a name) is never joined.
    G.sort(key=lambda g: -g[3]); out = []; byname = {}
    for g in G:
        key = (g[5], g[0].lower()); hit = None
        if g[0]:
            for o in byname.get(key, []):
                if math.hypot(o[1] - g[1], o[2] - g[2]) < MERGE_KM: hit = o; break
        if hit:
            if g[4] not in hit[4]: hit[4] += g[4]
            hit[3] += g[3]; hit[6] = hit[6] + g[6]; hit[7] = hit[7] + g[7]; continue
        g = list(g); out.append(g); byname.setdefault(key, []).append(g)
    out.sort(key=lambda g: (g[2], g[1]))
    p = []; px = py = 0
    for g in out:
        x, y = round(g[1] / UNIT), round(g[2] / UNIT); p += [x - px, y - py]; px, py = x, y
    # the shapes: Douglas-Peucker to SIMPLIFY_KM, in steps of unit relative to the label point
    shp = []; npt = 0; ncell = 0; B = bytearray(); varint(len(out), B)
    for g in out:
        R = []; lx, ly = round(g[1] / UNIT), round(g[2] / UNIT)
        for r in g[7]:
            q = simplify(r, SIMPLIFY_KM); v = []; ox, oy = lx, ly; last = None
            for (x, y) in q:
                ix, iy = round(x / UNIT), round(y / UNIT)
                if (ix, iy) == last: continue
                v += [ix - ox, iy - oy]; ox, oy = ix, iy; last = (ix, iy)
            if len(v) >= 6: R.append(v); npt += len(v) // 2
        shp.append(R); varint(len(R), B)
        for v in R:
            varint(len(v) // 2, B)
            for c in v: varint(zz(c), B)
        if g[7]: ncell += len(cells_of(g[7], 0.5))
    kinds = {k: sum(1 for g in out if g[5] == k) for k in 'fgo'}
    D = {'meta': {'made': time.strftime('%Y-%m-%d'),
                  'src': 'Fiskeridirektoratet, «Fiskeplasser – redskap» (aktive og passive redskap), «Gyteområder» og «Oppvekst- og beiteområder», WFS FiskeridirWFS_fiskeri, NLOD',
                  'n': len(out), 'unit': UNIT, 'sp': SPL, 'gear': GEAR, 'kinds': kinds, 'wash': WASH, 'simplify': SIMPLIFY_KM, 'sb': len(B)},
         'p': p, 'n': [g[8] for g in out], 'nf': [[i, g[0]] for i, g in enumerate(out) if g[8] != g[0]],
         'r': [round(math.sqrt(g[3]) * 10) for g in out],
         'g': ''.join(g[4] if g[4] == '-' else ('b' if len(g[4]) > 1 else g[4]) for g in out), 'k': ''.join(g[5] for g in out),
         'l': [lines_of(g[6]) for g in out]}
    f = os.environ.get('KYST_FELT') or os.path.join(ROOT, 'src', 'data', 'felt.json')
    J = lambda o: json.dumps(o, ensure_ascii=False, separators=(',', ':'))
    open(f, 'w', encoding='utf-8').write(J(D) + '\n')
    import base64
    fs = os.environ.get('KYST_FELT_S') or os.path.join(ROOT, 'src', 'data', 'felt-s.b64')
    open(fs, 'w').write(base64.b64encode(bytes(B)).decode() + '\n')
    sz = lambda o: len(J(o).encode())
    print(f'{len(out)} grounds after joining the same name and kind within {MERGE_KM} km ({J(kinds)}), {os.path.getsize(f) / 1000:.0f} kB -> {f}')
    print(f'  of it: the lines {sz(D["l"]) / 1000:.0f} kB, the names {sz(D["n"]) / 1000 + sz(D["nf"]) / 1000:.0f} kB, the points {sz(D["p"]) / 1000:.0f} kB')
    print(f'  the shapes: {len(B) / 1000:.0f} kB binary ({os.path.getsize(fs) / 1000:.0f} kB base64) -> {fs}; {npt} points at {SIMPLIFY_KM * 1000:.0f} m, '
          f'{sz(shp) / 1000:.0f} kB as JSON; as 500 m cells the same grounds would be {ncell} cells')
    print(f'  with species: {sum(1 for g in out if g[6])} of {len(out)}; f with a season (a line not all year): {sum(1 for i, g in enumerate(out) if g[5] == "f" and any(l[2] != 4095 for l in D["l"][i]))}')

if __name__ == '__main__': main()
