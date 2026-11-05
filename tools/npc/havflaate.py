# The ocean fleet as NPCs (H1 of docs/planer/bestand-og-flaate.md, 02.11.2026): the register's active vessels of 28 m and over, their
# home harbours, grounds, seasons and the ways there, for the game to sail them by the clock (HAV in 05-vessels.js).
#
#   python3 tools/npc/havflaate.py [game dir]   -> src/data/havflaate.json
#
# The vessels: fiske.json kom (B1), the active vessels of 28 m and over by kommune and main gear (249 in 2024-25: 111 trawl, 73 purse
# seine, 22 Danish seine, 21 autoline, 17 pots, 5 nets). Each is the game's own model of her kind (VESSELS: bunntral, pelagisk,
# ringnot38, autoliner, snokrabbe), at that model's length: the register gives only the length group.
# Home: a plant (mottak.json) in her kommune that takes her gear (Trål, Not, or Konvensjonelle for the rest), the longest quay first;
# else the nearest such plant within 250 km. The game lays her at a quay face there that is long and deep enough (npcBerths, quayFit:
# a 60 m trawler needs a real quay of 60 m), or does not show her in port.
# Grounds and seasons: the landing notes of 28 m and over per gear (fiske.json sp: the location table k and the main-area table h, idx
# gear*6+4), as kilos per month per location or main area; the twelve heaviest areas of each gear, each with up to three points of
# water in it at the gear's depths (rules.json lok/hom polygons, the core's 200 m land and 1 km depth). An area outside the game's
# frame, or with no such water, is «borte»: the vessel is away for the trip and comes back.
# Landing: the catch from a ground goes to the nearest plant along the fairways that takes the gear and has a quay long and deep enough
# for her (mottak.json gear and q); she lies there some hours and steams home along the fairways.
# The ways: Kystverket's fairways (leinett.json), from the nodes a plant reaches by a clean straight leg to the nodes a ground reaches
# (the game finds the way between them through the net).
#
# havflaate.json:
#   meta    made, src, n (vessels), byGear, homes, grounds, routes, away (areas out of reach)
#   kind    {gear: model id}
#   p       plants [[mottak id, x, y]]
#   g       {gear: [[area code, x, y, [12 kg a month], [[node, km], ...], plant], ...]}  (x, y null: away; plant: the index in p of
#           the plant the catch is landed at, the nearest along the fairways that takes the gear and has a quay for her; null: home)
#   v       vessels [[gear, plant index, name]]
#   pa      [[[node, km, x, y, x, y, ...], ...]] per plant: the fairway nodes it reaches through the water, with the way's bends there; a
#           ground's are the last field of its row ([node, km]: a clean straight leg)
#           (the game finds the way between them through the net, lnetPath)
import os, sys, json, zlib, math, heapq, hashlib, time, urllib.request
import numpy as np
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE)); CACHE = os.path.join(HERE, 'cache')
KIND = {'tral': 'bunntral', 'not': 'pelagisk', 'snurrevad': 'ringnot38', 'line': 'autoliner', 'teine': 'snokrabbe', 'garn': 'ringnot38'}
PLANTG = {'tral': 'Trål', 'not': 'Not'}   # the rest: Konvensjonelle
SIZE = {'bunntral': (60.3, 5.1), 'pelagisk': (75.0, 7.5), 'ringnot38': (38.55, 3.85), 'autoliner': (45.4, 3.8), 'snokrabbe': (50.0, 6.0)}   # VESSELS len, draft
DEPTH = {'tral': (100, 600), 'not': (40, 3000), 'snurrevad': (40, 300), 'line': (100, 1000), 'teine': (150, 450), 'garn': (40, 400)}
NAMES = ['Havglimt', 'Kvitbris', 'Stormvær', 'Nordglimt', 'Havsula', 'Sølvbølge', 'Polarstrand', 'Havdønning', 'Ishavsbris', 'Djupvær',
         'Bankhavet', 'Kaldbakk', 'Brattvær', 'Havstreif', 'Måkeskjær', 'Skodde', 'Havtrost', 'Nordbank', 'Gråbølge', 'Kvitskjær', 'Sjøfalk',
         'Havbør', 'Djuphavet', 'Fjordglimt', 'Stormsvale', 'Kvitøy', 'Hopen', 'Isranda', 'Vestbanken', 'Djupbanken', 'Polarbris']   # made up: no real vessel's name (CLAUDE.md)
H01 = lambda *a: int(hashlib.sha256(repr(a).encode()).hexdigest()[:12], 16) / 16 ** 12

# the core's layers as arrays with their extents (H1b R6, 05.11.2026): the old frame's 200 m land, and over the whole wide frame the 1 km
# land and the sea floor (GEBCO with Kartverket's 50 m, 'u8p' since R2: read through tools/map/pack.py, which undoes the predictor; the
# old reader took the bytes as they were, and from R2 its depths were the predictor's residuals)
def core(game):
    sys.path.insert(0, os.path.join(ROOT, 'tools', 'map')); import pack
    out = {}
    for name in ('land200', 'land1k', 'deep'):
        A, L = pack.read_layer(game, name); out[name] = (A, L)
    return out

# the sea ice by month (src/data/is.json, H1b R5): 12 arrays of % on the 25 km grid, and the reader at a point (bilinear like 03h-is.js)
def ice_months():
    import base64
    D = json.load(open(os.path.join(ROOT, 'src', 'data', 'is.json'))); N = D['nx'] * D['ny']; out = []
    for s64 in D['m']:
        b = base64.b64decode(s64); a = np.zeros(N, np.float32); k = 0
        for i in range(0, len(b) - 1, 2): a[k:k + b[i + 1]] = b[i] * D['step']; k += b[i + 1]
        out.append(a.reshape(D['ny'], D['nx']))
    def at(m, x, y):
        u = x / D['c'] - D['ix0'] - 0.5; v = y / D['c'] - D['iy0'] - 0.5; i = math.floor(u); j = math.floor(v); fu = u - i; fv = v - j; A = out[m]
        g = lambda a, b: 0.0 if a < 0 or b < 0 or a >= D['nx'] or b >= D['ny'] else float(A[b, a])
        return (g(i, j) * (1 - fu) + g(i + 1, j) * fu) * (1 - fv) + (g(i, j + 1) * (1 - fu) + g(i + 1, j + 1) * fu) * fv
    return at
ICE_LIM = 40   # SEA_ICE_LIM in 03h-is.js
MAPB = (-1100, -1250, 2500, 1720)   # the game's frame (x0, y0, x1, y1), MAPB in core/01-world.js

def rules_polys():
    R = json.load(open(os.path.join(ROOT, 'src', 'data', 'rules.json'))); U = R.get('unit', 0.01)
    def dec(a):
        x = y = 0; o = []
        for i in range(0, len(a) - 1, 2): x += a[i]; y += a[i + 1]; o.append((x * U, y * U))
        return o
    return {('h', h['c']): [[dec(r) for r in poly] for poly in h['r']] for h in R['hom']} | {('l', h['c']): [[dec(r) for r in poly] for poly in h['r']] for h in R['lok']}

def pip(rings, x, y):
    c = False
    for r in rings:
        n = len(r)
        for i in range(n):
            (xi, yi), (xj, yj) = r[i], r[i - 1]
            if (yi > y) != (yj > y) and x < (xj - xi) * (y - yi) / (yj - yi) + xi: c = not c
    return c

def kommunenavn():
    os.makedirs(CACHE, exist_ok=True); f = os.path.join(CACHE, 'kommuner.json')
    if not os.path.exists(f):
        with urllib.request.urlopen('https://ws.geonorge.no/kommuneinfo/v1/kommuner', timeout=60) as r: json.dump(json.load(r), open(f, 'w'))
    return {k['kommunenummer']: k['kommunenavnNorsk'].lower() for k in json.load(open(f))}

def kommunepunkt(knr):
    os.makedirs(CACHE, exist_ok=True); f = os.path.join(CACHE, 'kpunkt.json'); K = json.load(open(f)) if os.path.exists(f) else {}
    if knr not in K:
        try:
            with urllib.request.urlopen(f'https://ws.geonorge.no/kommuneinfo/v1/kommuner/{knr}?utkoordsys=25833', timeout=60) as r: d = json.load(r)
            E, N = d['punktIOmrade']['coordinates']; K[knr] = [(E + 250000) / 1000, (8050000 - N) / 1000]
        except Exception as e: K[knr] = None
        json.dump(K, open(f, 'w'))
    return K[knr]

def main(game):
    F = json.load(open(os.path.join(ROOT, 'src', 'data', 'fiske.json'))); M = F['meta']; G = M['gear']; ny = M.get('ny', 1)
    MO = [m for m in json.load(open(os.path.join(ROOT, 'src', 'data', 'mottak.json')))['m'] if m.get('q') and m.get('p')]
    C = core(game); LAND, L2 = C['land200']; lc = L2['c']; LAND1, L1 = C['land1k']; DEEP, LD = C['deep']; ICE = ice_months()
    def cell(A, L, x, y):
        i, j = math.floor(x / L['c']) - L['ix0'], math.floor(y / L['c']) - L['iy0']
        return A[j, i] if 0 <= i < L['nx'] and 0 <= j < L['ny'] else None
    # the old frame's 200 m land where it is, else the wide frame's 1 km (as isLandFar in the game); off both, and off the game's frame
    # (MAPB in 01-world.js: the 1 km layer reaches a little further south than the frame), land
    def land(x, y):
        if not (MAPB[0] <= x < MAPB[2] and MAPB[1] <= y < MAPB[3]): return True
        v = cell(LAND, L2, x, y) if 0 <= x < 1450 and 0 <= y < 1720 else None
        if v is None: v = cell(LAND1, L1, x, y)
        return v is None or v == 1
    depth = lambda x, y: float(cell(DEEP, LD, x, y) or 0) * 10
    # (skip: the first stretch from a left out, the plant's own cell that may be land on this map; at b only when both)
    def clear(a, b, skip=0.0, both=True):
        d = math.hypot(b[0] - a[0], b[1] - a[1]); n = max(1, int(d / 0.05))   # (every 50 m: a leg grazing a cell's corner is caught)
        # (from b's end: the land, when there is any, is mostly by the fairway node or the plant, so a long leg over the sea fails at once)
        return all(not land(a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n) for k in range(n, -1, -1) if d * k / n >= skip and (not both or d * (n - k) / n >= skip))
    P = rules_polys(); KN = kommunenavn()
    # the vessels by kommune and gear
    ves = []
    for knr, rows in F['kom'].items():
        for lg, g, reg, act, res in rows:
            if lg == 4 and act > 0 and G[g] in KIND: ves += [(knr, G[g])] * act
    # the grounds: kilos of 28 m and over per gear, area and month
    W = {}
    for sp, o in F['sp'].items():
        for tab, codes in (('k', M['lok']), ('h', M['hom'])):
            for a, ms in o[tab]:
                for m, c in enumerate(ms):
                    for i in range(0, len(c), 3):
                        g, lg = divmod(c[i], 6)
                        if lg == 4 and G[g] in KIND: e = W.setdefault(G[g], {}).setdefault((tab if tab == 'h' else 'l', codes[a]), [0.0] * 12); e[m] += c[i + 1] / ny
    grounds = {}; away = 0
    for g, areas in W.items():
        # the main areas the location table already covers are left to it (a main-area row is the vessels that gave no location)
        top = sorted(areas.items(), key=lambda kv: -sum(kv[1]))[:12]; out = []
        for (tab, code), kg in top:
            polys = P.get((tab, code)); pts = []
            if polys:
                lo, hi = DEPTH[g]; xs = [x for poly in polys for x, y in poly[0]]; ys = [y for poly in polys for x, y in poly[0]]
                for relax in (1, 2):
                    for k in range(4000):
                        if len(pts) >= 3: break
                        x = min(xs) + (max(xs) - min(xs)) * H01(code, g, k, 'x'); y = min(ys) + (max(ys) - min(ys)) * H01(code, g, k, 'y')
                        if not any(pip(poly, x, y) for poly in polys) or land(x, y): continue
                        d = depth(x, y)
                        if relax == 1 and not (lo <= d <= hi): continue
                        if d < 20 or any(math.hypot(x - a, y - b) < 4 for a, b in pts): continue
                        # (H1b R6) not in the drift ice in the months the area has its landings (the mean, weighted by the kilos, under ICE_LIM)
                        tot = sum(kg) or 1
                        if sum(kg[m] * ICE(m, x, y) for m in range(12)) / tot >= ICE_LIM: continue
                        # off the land: 6 km for trawl, line and pots (28 m and over fish outside 4 nm, J-161-2026 § 32), 2 km for the rest
                        R0 = 6 if g in ('tral', 'line', 'teine') else 2
                        if all(not land(x + math.sin(a) * r, y + math.cos(a) * r) for r in (R0 / 2, R0) for a in [k2 * math.pi / 4 for k2 in range(8)]): pts.append((round(x, 2), round(y, 2)))
                    if pts: break
            if not pts: away += 1; out.append([tab + code, None, None, [round(v) for v in kg]]); continue
            for x, y in pts: out.append([tab + code, x, y, [round(v / len(pts)) for v in kg]])
        grounds[g] = out
    # the fairway net
    LN = json.load(open(os.path.join(ROOT, 'src', 'data', 'leinett.json'))); n = int(LN['n']); NX = np.array(LN['nodes'][0::2]) / 1000; NY = np.array(LN['nodes'][1::2]) / 1000
    adj = [[] for _ in range(n)]
    for wi, w in enumerate(LN['ways']):
        for k in range(1, len(w)):
            a, b = w[k - 1], w[k]; sf = LN.get('soft') and LN['soft'][wi][k - 1]; L = math.hypot(NX[a] - NX[b], NY[a] - NY[b]) * (3 if sf else 1); adj[a].append((b, L)); adj[b].append((a, L))
    # (only the net's largest connected part: a piece of fairway on its own would leave a way with no end)
    comp = -np.ones(n, np.int64); cn = 0
    for s0 in range(n):
        if comp[s0] >= 0: continue
        st = [s0]; comp[s0] = cn
        while st:
            u = st.pop()
            for v, _ in adj[u]:
                if comp[v] < 0: comp[v] = cn; st.append(v)
        cn += 1
    MAIN = comp == np.bincount(comp).argmax()
    def near(x, y, km, mx):
        d = np.where(MAIN, np.hypot(NX - x, NY - y), np.inf); idx = np.argsort(d)[:mx]; return [(int(i), float(d[i])) for i in idx if d[i] <= km]
    def access(p, km, mx, skip):
        return [(i, d) for i, d in near(p[0], p[1], km, mx) if clear(p, (NX[i], NY[i]), skip)]
    def dijkstra(srcs):
        D = np.full(n, np.inf); Fr = np.full(n, -1); h = []
        for i, c in srcs:
            if c < D[i]: D[i] = c; heapq.heappush(h, (c, i))
        while h:
            c, u = heapq.heappop(h)
            if c > D[u]: continue
            for v, w in adj[u]:
                if c + w < D[v]: D[v] = c + w; Fr[v] = u; heapq.heappush(h, (c + w, v))
        return D, Fr
    # (out of the plant through the water of the core's 200 m land: the shortest way on its cells within 25 km to the nodes there, pulled
    # straight where the line is clear; the plant's own cell may be land on that map, so the way starts at the nearest water within 1 km)
    from scipy.sparse import csr_matrix
    from scipy.sparse.csgraph import dijkstra as gdij
    def wayOut(px, py):
        R = 125; cx, cy = int(px / lc), int(py / lc); x0, y0 = max(0, cx - R), max(0, cy - R); x1, y1 = min(LAND.shape[1], cx + R + 1), min(LAND.shape[0], cy + R + 1)
        Wm = LAND[y0:y1, x0:x1] != 1; h, w = Wm.shape; nid = -np.ones((h, w), np.int64); wi = np.argwhere(Wm); nid[wi[:, 0], wi[:, 1]] = np.arange(len(wi))
        rows, cols, wts = [], [], []
        for dy, dx, wt in ((0, 1, 1.0), (1, 0, 1.0), (1, 1, 1.4142), (1, -1, 1.4142)):
            a = nid[0:h - dy, max(0, -dx):w - max(0, dx)]; b = nid[dy:h, max(0, dx):w + min(0, dx)]
            ok = (a >= 0) & (b >= 0); rows.append(a[ok]); cols.append(b[ok]); wts.append(np.full(int(ok.sum()), wt))
        G2 = csr_matrix((np.concatenate(wts), (np.concatenate(rows), np.concatenate(cols))), shape=(len(wi), len(wi)))
        s0 = None
        for r in range(0, 6):
            cand = [(abs(i) + abs(j), cy - y0 + j, cx - x0 + i) for i in range(-r, r + 1) for j in range(-r, r + 1) if 0 <= cy - y0 + j < h and 0 <= cx - x0 + i < w and Wm[cy - y0 + j, cx - x0 + i]]
            if cand: _, r0, c0 = min(cand); s0 = nid[r0, c0]; break
        if s0 is None: return []
        Dg, Pg = gdij(G2, directed=False, indices=int(s0), return_predecessors=True)
        out = []
        for i, d0 in near(px, py, 25, 60):
            r, c = int(NY[i] / lc) - y0, int(NX[i] / lc) - x0
            if not (0 <= r < h and 0 <= c < w) or nid[r, c] < 0 or not np.isfinite(Dg[nid[r, c]]): continue
            cells = []; v = int(nid[r, c])
            while v >= 0 and v != s0: cells.append(v); v = int(Pg[v])
            cells.append(int(s0)); P = [(px, py)] + [((wi[v][1] + x0 + 0.5) * lc, (wi[v][0] + y0 + 0.5) * lc) for v in cells[::-1]] + [(float(NX[i]), float(NY[i]))]
            st = [P[0]]; j = 0
            while j < len(P) - 1:
                k2 = len(P) - 1
                while k2 > j + 1 and not clear(P[j], P[k2], 0.35 if j == 0 else 0, False): k2 -= 1   # (not past land at the far end, 03.11.2026)
                st.append(P[k2]); j = k2
            L = sum(math.hypot(st[q][0] - st[q - 1][0], st[q][1] - st[q - 1][1]) for q in range(1, len(st)))
            out.append((i, L, st[1:-1]))
        out.sort(key=lambda e: e[1]); return out[:4]
    WO = {}
    def outOf(m):
        if m['id'] not in WO: WO[m['id']] = wayOut(m['q'][0], m['q'][1])
        return WO[m['id']]
    # the homes
    def takes(m, g):
        gs = m.get('gear') or {}; want = PLANTG.get(g, 'Konvensjonelle'); return gs.get(want, 0) >= 0.05 and bool(outOf(m))   # and a way out to the fairways
    plants = []; pidx = {}; V = []; noHome = 0
    for j, (knr, g) in enumerate(sorted(ves)):
        kn = KN.get(knr); cand = [m for m in MO if m.get('k') == kn and takes(m, g)]
        if not cand:
            kp = [m for m in MO if m.get('k') == kn]; c0 = kp[0]['p'] if kp else kommunepunkt(knr)
            cand = sorted((m for m in MO if takes(m, g)), key=lambda m: math.hypot(m['p'][0] - c0[0], m['p'][1] - c0[1]) if c0 else 0)[:1] if c0 else []
            if cand and math.hypot(cand[0]['p'][0] - c0[0], cand[0]['p'][1] - c0[1]) > 250: cand = []
        if not cand: noHome += 1; continue
        m = max(cand, key=lambda m: (m['q'][3], m['q'][4]))
        if m['id'] not in pidx: pidx[m['id']] = len(plants); plants.append([m['id'], round(m['q'][0], 3), round(m['q'][1], 3)])
        V.append([g, pidx[m['id']], NAMES[int(H01(knr, g, j) * len(NAMES))] + (' ' + 'I' * (1 + int(H01(knr, g, j, 'n') * 2)) if H01(knr, g, j, 'r') < 0.5 else '')])
    # the ways: the fairway nodes each plant reaches by a clean straight leg (or the nearest three at three times the length), and the
    # nodes each ground reaches; the game finds the way through the net between them (lnetPath, 11c-leinett.js) when she sails it
    noWay = 0
    for g, out in grounds.items():
        for e in out:
            if e[1] is None: e.append([]); continue
            # (H1b R6: the grounds off Svalbard, Iceland and in the Russian zone lie 600-1 800 km from the mainland's fairways)
            a = access((e[1], e[2]), 250, 40, 0) or access((e[1], e[2]), 600, 80, 0) or access((e[1], e[2]), 2000, 400, 0)
            if not a: noWay += 1
            e.append([[i, round(d, 2)] for i, d in a[:6]])
    # the plant each ground's catch is landed at (task 2, 03.11.2026): the nearest along the fairways that takes the gear and has a quay
    # long and deep enough for the gear's model (the game's quayFit: 90 % of the quay at least her length and 2 m, and her draught and
    # 0.5 m); the ship steams there from the ground, lies there some hours and goes home. The home plant when none is nearer.
    def fits(m, g):
        L, T = SIZE[KIND[g]]; return m['q'][3] * 0.9 >= L + 2 and m['q'][4] >= T + 0.5
    MOI = {m['id']: m for m in MO}; deliv = 0; far = []
    for g, out in grounds.items():
        cand = [m for m in MO if takes(m, g) and fits(m, g)]
        for e in out:
            if e[1] is None or not e[4]: e.append(None); continue
            D, _ = dijkstra([(i, d) for i, d in e[4]]); best = None
            for m in cand:
                c = min((D[i] + L for i, L, _ in WO[m['id']]), default=np.inf)
                if np.isfinite(c) and (best is None or c < best[0]): best = (c, m)
            if best is None: e.append(None); continue
            m = best[1]
            # (a plant within 5 km of the ships' homes is the same harbour: they land at home; the game checks it per ship, havLand)
            if m['id'] not in pidx: pidx[m['id']] = len(plants); plants.append([m['id'], round(m['q'][0], 3), round(m['q'][1], 3)])
            e.append(pidx[m['id']]); deliv += 1; far.append(best[0])
    pa = []
    for mid, px, py in plants:
        a = WO[mid]
        pa.append([[i, round(L, 2)] + [round(v, 3) for q in mid_ for v in q] for i, L, mid_ in a])
    by = {}
    for v in V: by[v[0]] = by.get(v[0], 0) + 1
    meta = {'made': time.strftime('%Y-%m-%d'), 'src': 'Fiskeridirektoratets fartøyregister og sluttsedler (fiske.json, NLOD); mottakene (mottak.json); Kystverkets farleder (leinett.json); kommunene fra Geonorge (Kartverket)',
            'n': len(V), 'active': len(ves), 'noHome': noHome, 'byGear': by, 'homes': len(plants), 'grounds': sum(len(v) for v in grounds.values()), 'away': away, 'noWay': noWay,
            'landAt': deliv, 'landPlants': len({e[5] for o in grounds.values() for e in o if e[5] is not None}), 'landKm': round(float(np.median(far))) if far else 0}
    f = os.environ.get('KYST_HAV') or os.path.join(ROOT, 'src', 'data', 'havflaate.json')
    open(f, 'w').write(json.dumps({'meta': meta, 'kind': KIND, 'p': plants, 'g': grounds, 'v': V, 'pa': pa}, ensure_ascii=False, separators=(',', ':')) + '\n')
    print(json.dumps(meta, ensure_ascii=False), f'{os.path.getsize(f) / 1000:.0f} kB')

if __name__ == '__main__': main(sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, 'tools', 'map', 'out', 'game'))
