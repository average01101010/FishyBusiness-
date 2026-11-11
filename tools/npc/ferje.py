# The car ferries along the whole coast (Ø15 N3 of docs/planer/npc-flaaten.md, 11.11.2026): every ferry crossing with its quays, its
# fairway, its crossing time and its departures through a week, read from Entur's national timetable and laid in the game's own map.
# Out: src/data/ferje.json (KYST_FERJE=<file> writes there instead), which core/05b-ferje.js sails as a pure function of the shared clock.
#
#   python3 tools/map/release.py && python3 tools/map/game.py     (the whole coast's packs: the fairways are found in the game's 25 m mask)
#   python3 tools/npc/ferje.py [gtfs.zip]                         (without a file Entur's is fetched into tools/npc/cache/, 0.5 GB)
#   node build.mjs && python3 tools/npc/ferje.py bake             (the legs checked and mended against the game's own land, below)
#
# The source: Entur's national GTFS export (rb_norway-aggregated-gtfs.zip, made every night from the operators' NeTEx; NLOD, «Inneholder
# data under Norsk lisens for offentlige data (NLOD) tilgjengeliggjort av Entur»). Read from it: the lines with route type 1004 (local
# car ferry) and 1013 (car high-speed ferry), their journeys' stops and times, the days they run (calendar, calendar_dates), and the
# quays' names and positions. The passenger boats (1008, 1014) and the coastal route (1002) are N4. International ferries (1001) are
# not taken.
#
# Not written: operators, authorities, line numbers, line names, journey ids or vessel names (Jonas 07.10.2026: «Jeg orker ikke å bli
# saksøkt»; choice 2 A 05.11.2026: made-up names on every vessel). Only the quays' place names, which are place names. The game gives
# each ferry a made-up name from its own list.
#
# The fairway is not read from a map of ferry routes (Geofabrik's extract is shut to the cloud session, and a drawn route would have to
# be fitted to the game's coast anyway): each leg is the shortest way on water between its two quays in the game's own 25 m mask, kept
# 100 m off land where the water is wide enough, and straightened. The quay's point is the water nearest the stop's position.
#
# The week: the departures are those of one ordinary week of the timetable, the week from the next Monday on with the most journeys
# among the next six (so a holiday week is not taken), and of one summer week (20 June to 10 August) when the timetable has reached
# that far and it differs. A crossing that runs only in the summer week has no winter week (it is not shown then).
#
# ferje.json (all lengths in metres in the game's frame, all times in minutes):
#   meta  {made, src, lic, baked, week, sum (the summer week's Monday or null), sumDays [first, last day of the year the summer week is used],
#          n: {samband, kaier, legger, turer (journeys in the winter week)}}
#   q     [[name, x, y], ...]            the quays: the place name and the water point nearest the stop
#   l     [[qa, qb, [x0, y0, dx, dy, ...]], ...]   the legs, from quay qa to qb (qa < qb), the first point whole and the rest as steps
#   s     [{k, p, w, s?}, ...]           the crossings:
#           k  the size class 0-2 (small, medium, large: an estimate, for the timetable has no car capacity. Large: 28 departures a
#              day each way or more over a leg of 2 km or more, a leg of 18 km or more with 10 departures, or a leg of 60 km.
#              Small: no leg over 1.5 km, under 14 departures with no leg of 8 km, or under 4 with no leg of 18 km)
#           p  the patterns: [[q0, q1, ...], [arr1, dep1, arr2, ...]] the quays a journey calls at and the minutes after the first
#              departure it arrives at and leaves each (the last has only an arrival)
#           w, s  the winter and the summer week: {d: [7 indices, Monday first, into t], t: [day, ...]}, a day a list as long as p
#              of the pattern's departures that day, the first whole (minutes after midnight) and the rest as steps
import os, sys, json, csv, io, re, zipfile, zlib, math, heapq, datetime, collections
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE)); sys.path.insert(0, os.path.join(ROOT, 'tools', 'map'))
URL = 'https://storage.googleapis.com/marduk-production/outbound/gtfs/rb_norway-aggregated-gtfs.zip'
SRC = 'Entur, nasjonalt GTFS-uttrekk (rb_norway-aggregated-gtfs.zip), rutetype 1004 og 1013'
LIC = 'NLOD: Inneholder data under Norsk lisens for offentlige data (NLOD) tilgjengeliggjort av Entur'
TYPES = {'1004', '1013'}
GAME = os.path.join(ROOT, 'tools', 'map', 'out', 'game')
OUT = os.environ.get('KYST_FERJE') or os.path.join(ROOT, 'src', 'data', 'ferje.json')
SENJA = {'Botnhamn', 'Brensholmen'}   # Senja's own ferry is in the game by hand (core/05b-ferje.js), as it has been
SUMMER = ((6, 20), (8, 10))

def mins(t):
    h, m, s = t.split(':'); return int(h) * 60 + int(m) + (1 if int(s) >= 30 else 0)

# ---- the timetable ----
def read_gtfs(path):
    z = zipfile.ZipFile(path)
    def rows(name): return csv.DictReader(io.TextIOWrapper(z.open(name), 'utf-8-sig'))
    routes = {r['route_id'] for r in rows('routes.txt') if r['route_type'] in TYPES}
    trips = {}
    for r in rows('trips.txt'):
        if r['route_id'] in routes: trips[r['trip_id']] = dict(route=r['route_id'], svc=r['service_id'], st=[])
    # stop_times.txt is 0.8 GB: read line by line, split only the lines of the ferries' journeys
    with z.open('stop_times.txt') as f:
        head = f.readline().decode('utf-8-sig').strip().split(','); iT, iS, iA, iD, iQ = [head.index(k) for k in ('trip_id', 'stop_id', 'arrival_time', 'departure_time', 'stop_sequence')]
        for raw in f:
            c = raw.split(b',', 1)[0].decode()
            t = trips.get(c) if iT == 0 else None
            if iT == 0 and t is None: continue
            p = raw.decode('utf-8').rstrip('\r\n').split(',')
            if iT != 0: t = trips.get(p[iT])
            if t is None or not p[iA] or not p[iD]: continue
            t['st'].append((int(p[iQ]), p[iS], mins(p[iA]), mins(p[iD])))
    used = {s[1] for t in trips.values() for s in t['st']}
    stops = {r['stop_id']: (r['stop_name'], float(r['stop_lat']), float(r['stop_lon']), r.get('parent_station') or r['stop_id']) for r in rows('stops.txt') if r['stop_id'] in used}
    svc = {t['svc'] for t in trips.values()}; cal = {}; exc = collections.defaultdict(dict)
    for r in rows('calendar.txt'):
        if r['service_id'] in svc: cal[r['service_id']] = ([r[k] == '1' for k in ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday')], r['start_date'], r['end_date'])
    for r in rows('calendar_dates.txt'):
        if r['service_id'] in svc: exc[r['service_id']][r['date']] = r['exception_type'] == '1'
    return trips, stops, cal, {k: dict(v) for k, v in exc.items()}
# the ferries' part of the timetable, kept beside the zip (reading it takes minutes), by the zip's size and time
def timetable(path):
    import pickle
    st = os.stat(path); key = (st.st_size, int(st.st_mtime), sorted(TYPES)); c = path + '.ferje.pickle'
    if os.path.exists(c):
        k, v = pickle.load(open(c, 'rb'))
        if k == key: return v
    v = read_gtfs(path); pickle.dump((key, v), open(c, 'wb')); return v
def running(cal, exc):
    def runs(s, d):
        k = d.strftime('%Y%m%d'); e = exc.get(s, {}).get(k)
        if e is not None: return e
        c = cal.get(s); return bool(c and c[1] <= k <= c[2] and c[0][d.weekday()])
    return runs

def quay_name(n):
    n = re.sub(r'\s+(ferje|ferge|hurtigbåt|hurtigbåt)(kai|leie|kaia|kaien)\b.*$', '', n.strip(), flags=re.I)
    n = re.sub(r'\s+(kai|kaia|brygge|ferje|ferjekai\s*\d*)$', '', n, flags=re.I)
    return re.sub(r'\s*\(.*?\)\s*', ' ', n).strip()

# ---- the game's 25 m mask, read block by block from the sim packs (1 = land), and the core's 200 m where no tile has detail ----
class Mask:
    def __init__(self, d):
        self.d = d; man = json.load(open(os.path.join(d, 'manifest.json'))); self.L = man['layers']['mask']; self.F = man['layers']['land200']; self.idx = {}; self.fidx = {}; self.blk = {}; self.fblk = {}
        for p in man['packs']:
            if p['kind'] not in ('sim', 'core'): continue
            with open(os.path.join(d, p['file']), 'rb') as f:
                b = f.read(8); hl = int.from_bytes(b[4:8], 'little'); head = json.loads(f.read(hl)); at = 8 + hl
            for l, bx, by, off, ln, *_ in head['blocks']:
                if l == 'mask': self.idx[(bx, by)] = (p['file'], at + off, ln)
                elif l == 'land200': self.fidx[(bx, by)] = (p['file'], at + off, ln)
    def _get(self, idx, cache, k, n):
        b = cache.get(k)
        if b is None:
            e = idx.get(k)
            if e is None: b = False
            else:
                with open(os.path.join(self.d, e[0]), 'rb') as f: f.seek(e[1]); b = zlib.decompress(f.read(e[2]), -15)
                assert len(b) == n * n
            cache[k] = b
        return b
    # land at the 25 m cell (i, j) (cells counted from the frame's origin)
    def land(self, i, j):
        n = self.L['n']; b = self._get(self.idx, self.blk, (i // n, j // n), n)
        if b is not False: return b[(j % n) * n + i % n] == 1
        I, J = i // 8, j // 8; n = self.F['n']
        if not (0 <= I < self.F['nx'] and 0 <= J < self.F['ny']): return True
        b = self._get(self.fidx, self.fblk, (I // n, J // n), n)
        return True if b is False else b[(J % n) * n + I % n] == 1

# the way on water from a to b (km) on a 50 m grid of the mask: a cell is free when its four 25 m cells are water, and wide when every
# cell within 100 m is free; a step through a cell that is not wide costs three times its length. Returns the cells' middles, or None.
class Sea:
    def __init__(self, M): self.M = M; self.f = {}; self.w = {}
    def free(self, I, J):
        k = (I, J); v = self.f.get(k)
        if v is None:
            L = self.M.land; i, j = 2 * I, 2 * J; v = self.f[k] = not (L(i, j) or L(i + 1, j) or L(i, j + 1) or L(i + 1, j + 1))
        return v
    def wide(self, I, J):
        k = (I, J); v = self.w.get(k)
        if v is None: v = self.w[k] = all(self.free(I + a, J + b) for a in range(-2, 3) for b in range(-2, 3))
        return v
    # more than a pond: the water joined to the cell has at least n cells
    def open_water(self, c, n=600):
        seen = {c}; q = [c]
        while q and len(seen) < n:
            I, J = q.pop()
            for d in ((I + 1, J), (I - 1, J), (I, J + 1), (I, J - 1)):
                if d not in seen and self.free(*d): seen.add(d); q.append(d)
        return len(seen) >= n
    def near(self, x, y, reach=12):
        I0, J0 = int(math.floor(x / 0.05)), int(math.floor(y / 0.05)); c = []
        for a in range(-reach, reach + 1):
            for b in range(-reach, reach + 1):
                if not self.free(I0 + a, J0 + b): continue
                d = math.hypot((I0 + a + 0.5) * 0.05 - x, (J0 + b + 0.5) * 0.05 - y)
                if d <= reach * 0.05: c.append((d, I0 + a, J0 + b))
        for d, I, J in sorted(c):
            if self.open_water((I, J)): return (I, J)
        return None
    def path(self, s, g, limit=1500000):
        pad = max(160, int(0.6 * math.hypot(s[0] - g[0], s[1] - g[1]))); x0, x1, y0, y1 = min(s[0], g[0]) - pad, max(s[0], g[0]) + pad, min(s[1], g[1]) - pad, max(s[1], g[1]) + pad
        H = lambda c: (lambda dx, dy: (max(dx, dy) + 0.41421356 * min(dx, dy)) * 1.2)(abs(c[0] - g[0]), abs(c[1] - g[1]))
        openq = [(H(s), 0.0, s)]; G = {s: 0.0}; came = {}; n = 0
        while openq:
            _, gc, c = heapq.heappop(openq)
            if c == g:
                out = [c]
                while c in came: c = came[c]; out.append(c)
                return out[::-1]
            if gc > G[c]: continue
            n += 1
            if n > limit: return None
            for a, b in ((1, 0), (-1, 0), (0, 1), (0, -1), (1, 1), (1, -1), (-1, 1), (-1, -1)):
                d = (c[0] + a, c[1] + b)
                if not (x0 <= d[0] <= x1 and y0 <= d[1] <= y1) or not self.free(*d): continue
                if a and b and not (self.free(c[0] + a, c[1]) and self.free(c[0], c[1] + b)): continue
                ng = gc + (1.41421356 if a and b else 1.0) * (1 if self.wide(*d) else 3)
                if ng < G.get(d, 1e18): G[d] = ng; came[d] = c; heapq.heappush(openq, (ng + H(d), ng, d))
        return None
    # the straight line from p to q (km): every 20 m in a free cell, and (strict) in a wide one unless within 300 m of the leg's ends
    def clear(self, p, q, ends, strict):
        d = math.hypot(q[0] - p[0], q[1] - p[1]); n = max(1, int(math.ceil(d / 0.02)))
        for k in range(n + 1):
            x = p[0] + (q[0] - p[0]) * k / n; y = p[1] + (q[1] - p[1]) * k / n; I, J = int(math.floor(x / 0.05)), int(math.floor(y / 0.05))
            if not self.free(I, J): return False
            if strict and not self.wide(I, J) and min(math.hypot(x - e[0], y - e[1]) for e in ends) > 0.3: return False
        return True
    def pull(self, pts, strict, reach=None):
        ends = (pts[0], pts[-1]); out = [pts[0]]; i = 0
        while i < len(pts) - 1:
            j = len(pts) - 1
            while j > i + 1 and not ((reach is None or math.hypot(pts[j][0] - pts[i][0], pts[j][1] - pts[i][1]) <= reach) and self.clear(pts[i], pts[j], ends, strict)): j -= 1
            out.append(pts[j]); i = j
        return out
    def leg(self, a, b):
        s, g = self.near(*a), self.near(*b)
        if not s or not g: return None, 'no water within 600 m of ' + ('the first' if not s else 'the second') + ' quay'
        if s == g: return None, 'the quays share a cell'
        c = self.path(s, g)
        if not c: return None, 'no way on water'
        pts = [((I + 0.5) * 0.05, (J + 0.5) * 0.05) for I, J in c]
        return self.pull(self.pull(pts, True), False, 0.6), None

def week_of(runs, trips, first, last):
    best = None; d = first + datetime.timedelta(days=(7 - first.weekday()) % 7)
    while d + datetime.timedelta(days=6) <= last:
        n = sum(1 for t in trips.values() for k in range(7) if runs(t['svc'], d + datetime.timedelta(days=k)))
        if n and (best is None or n > best[0]): best = (n, d)
        d += datetime.timedelta(days=7)
    return best and best[1]

def main():
    from frame import to_nat
    src = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, 'cache', 'rb_norway-aggregated-gtfs.zip')
    if not os.path.exists(src):
        import requests
        os.makedirs(os.path.dirname(src), exist_ok=True); print('fetching', URL, flush=True)
        with requests.get(URL, stream=True, timeout=1800) as r:
            r.raise_for_status()
            with open(src + '.part', 'wb') as o:
                for c in r.iter_content(1 << 20): o.write(c)
        os.replace(src + '.part', src)
    today = datetime.date.fromisoformat(os.environ['KYST_FERJE_DATE']) if os.environ.get('KYST_FERJE_DATE') else datetime.date.today()
    trips, stops, cal, exc = timetable(src); runs = running(cal, exc)
    for t in trips.values(): t['st'].sort()
    print('journeys of the car ferries:', len(trips), 'stops:', len(stops), flush=True)
    wk = week_of(runs, trips, today + datetime.timedelta(days=1), today + datetime.timedelta(days=48))
    if not wk: raise SystemExit('the timetable has no journeys in the next six weeks')
    y = today.year + (1 if today > datetime.date(today.year, SUMMER[0][0], SUMMER[0][1]) else 0)
    sm = week_of(runs, trips, datetime.date(y, *SUMMER[0]), datetime.date(y, *SUMMER[1]))
    print('the week:', wk, 'the summer week:', sm, flush=True)

    # the quays: the stops of one stop place are one quay, at the mean of the stops used
    place = collections.defaultdict(list)
    for sid, (nm, la, lo, par) in stops.items(): place[par].append((nm, la, lo))
    quay = {}
    for par, L in place.items():
        x, y_ = to_nat(sum(q[2] for q in L) / len(L), sum(q[1] for q in L) / len(L)); quay[par] = dict(name=quay_name(L[0][0]), x=float(x), y=float(y_))
    qof = {sid: stops[sid][3] for sid in stops}

    # per line: the journeys of each week by pattern and weekday
    lines = collections.defaultdict(lambda: dict(pat={}, w=collections.defaultdict(lambda: [[] for _ in range(7)]), s=collections.defaultdict(lambda: [[] for _ in range(7)])))
    for t in trips.values():
        st = []
        for _, sid, a, d in t['st']:
            q = qof[sid]
            if st and st[-1][0] == q: st[-1][2] = d
            else: st.append([q, a, d])
        if len(st) < 2: continue
        t0 = st[0][2]; tm = []
        for k in range(1, len(st)):
            tm.append(max(st[k][1], (tm[-1] if tm else t0) + 1) if True else 0)   # an arrival is at least a minute after the departure before it
            if k < len(st) - 1: tm.append(max(st[k][2], tm[-1]))
        key = (tuple(s[0] for s in st), tuple(v - t0 for v in tm)); L = lines[t['route']]; pi = L['pat'].setdefault(key, len(L['pat']))
        for wkey, mon in (('w', wk), ('s', sm)):
            if not mon: continue
            for k in range(7):
                if runs(t['svc'], mon + datetime.timedelta(days=k)): L[wkey][pi][(k + t0 // 1440) % 7].append(t0 % 1440)

    M = Mask(GAME); sea = Sea(M); Q = []; qi = {}; LEG = {}; legfail = {}; out = []; drop = collections.Counter(); ntr = 0
    def qidx(par):
        if par not in qi: qi[par] = len(Q); Q.append(par)
        return qi[par]
    def leg(a, b):
        k = (a, b) if a < b else (b, a)
        if k not in LEG and k not in legfail:
            pa, pb = quay[k[0]], quay[k[1]]; pts, why = sea.leg((pa['x'], pa['y']), (pb['x'], pb['y']))
            print('  leg', len(LEG) + len(legfail) + 1, pa['name'], '-', pb['name'], round(math.hypot(pa['x'] - pb['x'], pa['y'] - pb['y']), 1), 'km', why or len(pts), flush=True)
            if pts: LEG[k] = pts
            else: legfail[k] = why
        return k in LEG
    for rid in sorted(lines):
        L = lines[rid]; pats = sorted(L['pat'].items(), key=lambda e: e[1])
        if any(quay[q]['name'] in SENJA for (qs, _), _ in pats for q in qs): drop['Senja (in the game by hand)'] += 1; continue
        if not any(any(L['w'][pi][k] or L['s'][pi][k] for k in range(7)) for _, pi in pats): drop['no journeys in the weeks'] += 1; continue
        keep = {}
        for (qs, tm), pi in pats:
            if not any(L['w'][pi][k] or L['s'][pi][k] for k in range(7)): continue
            if all(leg(qs[k], qs[k + 1]) for k in range(len(qs) - 1)): keep[pi] = (qs, tm)
            else: drop['a pattern with a leg not found on water'] += 1
        if not keep: drop['no pattern on water'] += 1; continue
        order = sorted(keep); P = [[[qidx(q) for q in keep[pi][0]], list(keep[pi][1])] for pi in order]
        def week(W):
            days = []
            for k in range(7): days.append([sorted(set(W[pi][k])) for pi in order])
            if not any(any(p) for d in days for p in d): return None
            uniq = []; d = []
            for day in days:
                enc = [[v[0]] + [v[i] - v[i - 1] for i in range(1, len(v))] if v else [] for v in day]
                if enc not in uniq: uniq.append(enc)
                d.append(uniq.index(enc))
            return dict(d=d, t=uniq)
        w, s = week(L['w']), (week(L['s']) if sm else None)
        ndir = max(sum(len(L['w'][pi][k]) + (0 if w else len(L['s'][pi][k])) for pi in order) for k in range(7)) / 2
        far = max(sum(math.hypot(a[0] - b[0], a[1] - b[1]) for a, b in zip(LEG[(min(x, y), max(x, y))], LEG[(min(x, y), max(x, y))][1:])) for qs, _ in keep.values() for x, y in zip(qs, qs[1:]))
        k = 2 if (ndir >= 28 and far >= 2) or far >= 60 or (far >= 18 and ndir >= 10) else 0 if far < 1.5 or (ndir < 14 and far < 8) or (ndir < 4 and far < 18) else 1
        e = dict(k=k, p=P)
        if w: e['w'] = w
        if s and s != w: e['s'] = s
        out.append(e); ntr += sum(len(L['w'][pi][kk]) for pi in order for kk in range(7))
    # the quays and the legs that are used, in metres
    legs = []
    for (a, b), pts in sorted(LEG.items(), key=lambda e: (qi.get(e[0][0], -1), qi.get(e[0][1], -1))):
        if a not in qi or b not in qi: continue
        ia, ib = qi[a], qi[b]
        if ia > ib: ia, ib = ib, ia; pts = pts[::-1]
        m = [(round(p[0] * 1000), round(p[1] * 1000)) for p in pts]; flat = [m[0][0], m[0][1]]
        for i in range(1, len(m)): flat += [m[i][0] - m[i - 1][0], m[i][1] - m[i - 1][1]]
        legs.append([ia, ib, flat])
    ends = {}
    for ia, ib, flat in legs:
        ends.setdefault(ia, (flat[0], flat[1])); ends.setdefault(ib, (flat[0] + sum(flat[2::2]), flat[1] + sum(flat[3::2])))
    q = [[quay[p]['name'], ends[i][0], ends[i][1]] for i, p in enumerate(Q)]
    for k, why in sorted(legfail.items(), key=lambda e: quay[e[0][0]]['name']): print('  no leg', quay[k[0]]['name'], '-', quay[k[1]]['name'] + ':', why)
    doy = lambda m, d: datetime.date(2001, m, d).timetuple().tm_yday
    meta = dict(made=today.isoformat(), src=SRC, lic=LIC, week=wk.isoformat(), sum=sm.isoformat() if sm else None, sumDays=[doy(*SUMMER[0]), doy(*SUMMER[1])],
                n=dict(samband=len(out), kaier=len(q), legger=len(legs), turer=ntr))
    js = json.dumps(dict(meta=meta, q=q, l=legs, s=out), ensure_ascii=False, separators=(',', ':'))
    open(OUT, 'w', encoding='utf-8').write(js + '\n')
    print(json.dumps(meta['n']), 'classes:', dict(collections.Counter(e['k'] for e in out)), 'dropped:', dict(drop), 'bytes:', len(js.encode()), '->', OUT)

# ---- the bake: every leg checked against the game's own land (the fine coast with its breakwaters and quays, which the 25 m mask
# does not have), in the built game run headless (dist/ with the whole coast's packs: node build.mjs first), as tools/leia/bake.py does.
# A leg's end that lies on a quay or behind a breakwater is drawn back to where 60 m of the leg is water (400 m at most); a stretch
# on land further out is gone round by a point 30-400 m to the side. A leg that cannot be mended goes out with the patterns that sail it.
#   python3 tools/npc/ferje.py bake
BAKE = """async (D) => {
  const land = async p => { if (!mapReadyAt(p, 0)) await mapNeed(p, 0.5); return isLand(p); };
  const hits = async (a, b) => { const n = Math.max(1, Math.ceil(dist(a, b) / 0.005)); for (let k = 0; k <= n; k++) if (await land({x:a.x + (b.x - a.x) * k / n, y:a.y + (b.y - a.y) * k / n})) return true; return false; };
  const out = [], st = {ok:0, trimmed:0, round:0, fail:0};
  for (const [qa, qb, f] of D.l){
    let pts = [{x:f[0] / 1000, y:f[1] / 1000}], x = f[0], y = f[1]; for (let i = 2; i < f.length; i += 2){ x += f[i]; y += f[i + 1]; pts.push({x:x / 1000, y:y / 1000}); }
    let touched = false, fail = null;
    for (const end of [0, 1]){
      if (end) pts.reverse();
      const R = prepRoute(pts.map(p => [p.x, p.y])), N = Math.min(Math.floor(R.len / 0.005), 200), fl = []; for (let k = 0; k <= N; k++) fl.push(await land(atRoute(R, k * 0.005).p));
      let i0 = -1; for (let k = 0; k + 12 <= N && k <= 80; k++){ let w = true; for (let j = 0; j <= 12; j++) if (fl[k + j]){ w = false; break; } if (w){ i0 = k; break; } }
      if (i0 < 0) fail = 'no water at the ' + (end ? 'second' : 'first') + ' quay';
      else if (i0 > 0){ const d = (i0 + 2) * 0.005, keep = pts.filter((p, i) => R.cum[i] > d + 0.01); pts = [atRoute(R, d).p].concat(keep); touched = true; }
      if (end) pts.reverse();
    }
    let round = false;
    for (let i = 0; !fail && i < pts.length - 1; i++){
      if (!await hits(pts[i], pts[i + 1])) continue;
      const a = pts[i], b = pts[i + 1], d = dist(a, b), n = Math.max(1, Math.ceil(d / 0.005)); let k0 = -1, k1 = -1;
      for (let k = 0; k <= n; k++) if (await land({x:a.x + (b.x - a.x) * k / n, y:a.y + (b.y - a.y) * k / n})){ if (k0 < 0) k0 = k; k1 = k; }
      const u = (k0 + k1) / 2 / n, m = {x:a.x + (b.x - a.x) * u, y:a.y + (b.y - a.y) * u}, nx = -(b.y - a.y) / d, ny = (b.x - a.x) / d; let c = null;
      look: for (const o of [0.03, 0.06, 0.1, 0.15, 0.22, 0.3, 0.4]) for (const sg of [1, -1]){ const q = {x:m.x + nx * o * sg, y:m.y + ny * o * sg}; if (!await land(q) && !await hits(a, q) && !await hits(q, b)){ c = q; break look; } }
      if (!c){ fail = 'land ' + Math.round(u * d * 1000) + ' m along a stretch, no way round'; break; }
      pts.splice(i + 1, 0, c); round = true;
    }
    if (fail){ st.fail++; out.push([qa, qb, null, fail]); continue; }
    st[round ? 'round' : touched ? 'trimmed' : 'ok']++;
    const m = pts.map(p => [Math.round(p.x * 1000), Math.round(p.y * 1000)]), flat = [m[0][0], m[0][1]]; for (let i = 1; i < m.length; i++) flat.push(m[i][0] - m[i - 1][0], m[i][1] - m[i - 1][1]);
    out.push([qa, qb, flat]);
  }
  return {l:out, st};
}"""
# the crossings without the patterns that sail a leg that is gone, and the quays and legs still used, numbered anew
def prune(D, gone):
    S = []
    for e in D['s']:
        keep = [i for i, (q, tm) in enumerate(e['p']) if not any((min(a, b), max(a, b)) in gone for a, b in zip(q, q[1:]))]
        if not keep: continue
        if len(keep) < len(e['p']):
            e['p'] = [e['p'][i] for i in keep]
            for wk in ('w', 's'):
                if wk in e: e[wk]['t'] = [[day[i] for i in keep] for day in e[wk]['t']]
            if not any(any(p) for wk in ('w', 's') if wk in e for day in e[wk]['t'] for p in day): continue
        S.append(e)
    used = sorted({q for e in S for p in e['p'] for q in p[0]}); new = {q: i for i, q in enumerate(used)}
    pairs = {(min(a, b), max(a, b)) for e in S for p in e['p'] for a, b in zip(p[0], p[0][1:])}
    L = []
    for a, b, f in D['l']:
        if (a, b) not in pairs or (a, b) in gone: continue
        if new[a] > new[b]:   # (never: the new numbers keep the order)
            raise SystemExit('order')
        L.append([new[a], new[b], f])
    for e in S:
        for p in e['p']: p[0] = [new[q] for q in p[0]]
    ends = {}
    for a, b, f in L: ends.setdefault(a, (f[0], f[1])); ends.setdefault(b, (f[0] + sum(f[2::2]), f[1] + sum(f[3::2])))
    D['q'] = [[D['q'][q][0], ends[new[q]][0], ends[new[q]][1]] for q in used]; D['l'] = L; D['s'] = S
    D['meta']['n'].update(samband=len(S), kaier=len(used), legger=len(L), turer=sum(len(D2['w']['t'][d][i]) for D2 in S if 'w' in D2 for d in D2['w']['d'] for i in range(len(D2['p'])))); return D

def bake():
    import asyncio
    sys.path.insert(0, os.path.join(ROOT, 'tests')); os.environ['KYST_LITE'] = '1'
    from _env import boot
    from playwright.async_api import async_playwright
    D = json.load(open(OUT, encoding='utf-8'))
    async def run():
        async with async_playwright() as p:
            b = await p.chromium.launch(); pg = await (await b.new_context(viewport={'width': 1100, 'height': 760})).new_page(); errs = []
            pg.on('pageerror', lambda e: errs.append(str(e))); await boot(pg); r = await pg.evaluate(BAKE, D); await b.close()
            if errs: raise SystemExit('page errors: ' + str(errs))
            return r
    r = asyncio.run(run()); gone = set()
    for a, b, f, *why in r['l']:
        if f is None: gone.add((a, b)); print('  out:', D['q'][a][0], '-', D['q'][b][0] + ':', why[0])
    n0 = len(D['s']); D['l'] = [[a, b, f] for a, b, f, *_ in r['l'] if f is not None]; D = prune(D, gone); D['meta']['baked'] = True
    js = json.dumps(D, ensure_ascii=False, separators=(',', ':')); open(OUT, 'w', encoding='utf-8').write(js + '\n')
    print('baked:', json.dumps(r['st']), 'crossings', n0, '->', len(D['s']), json.dumps(D['meta']['n']), 'bytes:', len(js.encode()))

if __name__ == '__main__':
    if sys.argv[1:2] == ['bake']: bake()
    else: main()
