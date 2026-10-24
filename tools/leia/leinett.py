# The fairway network along the whole coast (step 2 of the coast-wide Autonav, Jonas 08.10.2026: «Autonav må fungere 10 av 10
# ganger»): Kystverket's main and secondary fairways (hovedled og biled, the routes the coastal traffic follows), from the WFS
# «farled» on Geonorge (https://wfs.geonorge.no/skwms1/wfs.farled, type app:HovedledOgBiled; Kystverket, open data on Geonorge
# under NLOD; the source is named in the game). The lines are turned into a graph in the game's frame (UTM 33 in km,
# tools/map/frame.py): their points are thinned (Douglas–Peucker, TOL m), points within SNAP m are one node, lines that cross get a
# node where they cross, and loose ends within JOIN km of another line are joined to its nearest point. The game checks every leg it
# takes from the net against its own land, depths and rocks (core/11-route.js leiaMend), so the net needs not agree with the map.
# Out: src/data/leinett.json {src, made, n, nodes:[x, y, ...] in metres, ways:[[i, j, ...]]: each way a run of node indices}.
#   python3 tools/leia/leinett.py [GML]      (without GML the fairways are fetched from the WFS)
import os, sys, re, json, math, time, urllib.request
import numpy as np
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))
sys.path.insert(0, os.path.join(ROOT, 'tools', 'map'))
import frame
URL = 'https://wfs.geonorge.no/skwms1/wfs.farled?service=WFS&version=2.0.0&request=GetFeature&typeNames=app:HovedledOgBiled'
TOL, SNAP, JOIN = 15.0, 30.0, 1.5
OUT = os.path.join(ROOT, 'src', 'data', 'leinett.json')

def lines_of(gml):
    out = []
    for m in re.finditer(r'<wfs:member>(.*?)</wfs:member>', gml, re.S):
        body = m.group(1); kind = re.search(r'<app:farledtype>([^<]*)', body); kind = kind.group(1) if kind else ''
        for pl in re.findall(r'<gml:posList[^>]*>([^<]*)</gml:posList>', body):
            v = [float(t) for t in pl.split()]; lat, lon = np.array(v[0::2]), np.array(v[1::2])
            x, y = frame.to_nat(lon, lat); out.append((kind, np.c_[x * 1000, y * 1000]))   # metres
    return out

def dp(P, tol):
    if len(P) < 3: return P
    keep = np.zeros(len(P), bool); keep[0] = keep[-1] = True; st = [(0, len(P) - 1)]
    while st:
        a, b = st.pop(); A, B = P[a], P[b]; d = B - A; L = math.hypot(*d) or 1e-9
        seg = P[a + 1:b]
        if not len(seg): continue
        dist = np.abs((seg[:, 0] - A[0]) * d[1] - (seg[:, 1] - A[1]) * d[0]) / L; k = int(np.argmax(dist))
        if dist[k] > tol: keep[a + 1 + k] = True; st += [(a, a + 1 + k), (a + 1 + k, b)]
    return P[keep]

def seg_x(p, q, r, s):
    d = (q[0] - p[0]) * (s[1] - r[1]) - (q[1] - p[1]) * (s[0] - r[0])
    if abs(d) < 1e-9: return None
    t = ((r[0] - p[0]) * (s[1] - r[1]) - (r[1] - p[1]) * (s[0] - r[0])) / d; u = ((r[0] - p[0]) * (q[1] - p[1]) - (r[1] - p[1]) * (q[0] - p[0])) / d
    return (t, u) if 0 < t < 1 and 0 < u < 1 else None

def main():
    src = sys.argv[1] if len(sys.argv) > 1 else None
    gml = open(src, encoding='utf-8').read() if src else urllib.request.urlopen(URL, timeout=600).read().decode('utf-8')
    L = [(k, dp(P, TOL)) for k, P in lines_of(gml)]
    print(len(L), 'lines,', sum(len(P) for _, P in L), 'points after thinning')
    # crossings: a node on both lines where two segments cross (a grid of 2 km cells finds the candidates)
    segs = []; G = {}
    for li, (_, P) in enumerate(L):
        for si in range(len(P) - 1):
            a, b = P[si], P[si + 1]; segs.append((li, si))
            for gx in range(int(min(a[0], b[0]) // 2000), int(max(a[0], b[0]) // 2000) + 1):
                for gy in range(int(min(a[1], b[1]) // 2000), int(max(a[1], b[1]) // 2000) + 1): G.setdefault((gx, gy), []).append(len(segs) - 1)
    ins = {}   # (line, seg) -> [(t, point)]
    seen = set()
    for cell in G.values():
        for i in range(len(cell)):
            for j in range(i + 1, len(cell)):
                A, B = segs[cell[i]], segs[cell[j]]
                if A[0] == B[0] or (cell[i], cell[j]) in seen: continue
                seen.add((cell[i], cell[j])); P, Q = L[A[0]][1], L[B[0]][1]
                x = seg_x(P[A[1]], P[A[1] + 1], Q[B[1]], Q[B[1] + 1])
                if not x: continue
                pt = P[A[1]] + (P[A[1] + 1] - P[A[1]]) * x[0]
                ins.setdefault(A, []).append((x[0], pt)); ins.setdefault(B, []).append((x[1], pt))
    lines = []
    for li, (k, P) in enumerate(L):
        out = []
        for si in range(len(P) - 1):
            out.append(P[si])
            for t, pt in sorted(ins.get((li, si), []), key=lambda e: e[0]): out.append(pt)
        out.append(P[-1]); lines.append(np.array(out))
    print(sum(len(v) for v in ins.values()) // 2, 'crossings')
    # nodes: points within SNAP m are one
    nodes, NI = [], {}
    def node(p):
        gx, gy = int(p[0] // SNAP), int(p[1] // SNAP)
        for dx in (-1, 0, 1):
            for dy in (-1, 0, 1):
                for i in NI.get((gx + dx, gy + dy), []):
                    if math.hypot(nodes[i][0] - p[0], nodes[i][1] - p[1]) <= SNAP: return i
        nodes.append((float(p[0]), float(p[1]))); NI.setdefault((gx, gy), []).append(len(nodes) - 1); return len(nodes) - 1
    ways = []
    for P in lines:
        w = []
        for p in P:
            i = node(p)
            if not w or w[-1] != i: w.append(i)
        if len(w) > 1: ways.append(w)
    # loose ends: joined to the nearest point of another way within JOIN km (a short way of its own)
    deg = {}
    for w in ways:
        for a, b in zip(w, w[1:]): deg[a] = deg.get(a, 0) + 1; deg[b] = deg.get(b, 0) + 1
    ends = [i for i, d in deg.items() if d == 1]
    own = {}
    for wi, w in enumerate(ways):
        for i in w: own.setdefault(i, set()).add(wi)
    NG = {}
    for i, (x, y) in enumerate(nodes): NG.setdefault((int(x // 2000), int(y // 2000)), []).append(i)
    joins = 0
    for e in ends:
        x, y = nodes[e]; best, bd = None, JOIN * 1000
        for dx in (-1, 0, 1):
            for dy in (-1, 0, 1):
                for j in NG.get((int(x // 2000) + dx, int(y // 2000) + dy), []):
                    if own[j] & own[e]: continue
                    d = math.hypot(nodes[j][0] - x, nodes[j][1] - y)
                    if d < bd: best, bd = j, d
        if best is not None: ways.append([e, best]); joins += 1
    # pieces of the net (for the log)
    par = list(range(len(nodes)))
    def f(i):
        while par[i] != i: par[i] = par[par[i]]; i = par[i]
        return i
    for w in ways:
        for a, b in zip(w, w[1:]): par[f(a)] = f(b)
    comps = {}
    for i in range(len(nodes)): comps[f(i)] = comps.get(f(i), 0) + 1
    big = sorted(comps.values(), reverse=True)[:5]
    flat = []
    for x, y in nodes: flat += [round(x), round(y)]
    out = {'src': 'Kystverket: hovedled og biled (Geonorge WFS farled), NLOD', 'made': time.strftime('%Y-%m-%d'), 'n': len(nodes), 'nodes': flat, 'ways': ways}
    json.dump(out, open(OUT, 'w'), separators=(',', ':'))
    print(len(nodes), 'nodes,', len(ways), 'ways,', joins, 'joins; pieces', len(comps), 'largest', big, '->', OUT, os.path.getsize(OUT) // 1024, 'kB')

if __name__ == '__main__':
    main()
