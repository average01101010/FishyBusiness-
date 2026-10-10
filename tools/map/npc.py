# NPC traffic along the coast (part 5 of the coast-wide plan, 03.10.2026; the user: full traffic along the coast, but only within the
# player's AIS range), per 50 km tile, in metres from the tile's corner:
#   harbours  the quay faces of vectors.py of 12 m and more within 250 m of each other, 30 m of face or more together; not a marina's
#             pontoons (piers mapped as lines, kind 1), where the leisure boats lie
#   fleet     a boat for every 150 m of face, 1 to 3 (at most 55 a tile; about 5 000 along the coast, near the 4 614 active fishing
#             vessels of 2024 by Fiskeridirektoratet; kart-6 had 19 411), lengths drawn from the coastal fleet (most under 11 m, a few to 28 m),
#             each at a face that takes her as the game's quayFit has it (90 % of the face her length and 2 m, the water her draught and
#             half a metre; a face whose depth was not measured takes none), alongside it, never two in one place
#   grounds   2 to 4 off each harbour: 20 to 150 m deep, 3 to 22 km by sea, 600 m or more from the land (better 1 km: the boats drift
#             a kilometre with the wind as they fish), on a slope (the depth's gradient at 500 m), 2 km apart, and away from the grounds
#             the tile's other harbours took (the user's test 04.10.2026: the boats were heaped on a few grounds, some ashore). A
#             harbour that gets no ground (a lake, a pocket with no way out) is left out
#   routes    the way from the harbour's mouth to each ground round the land: the shortest path on a 100 m grid of the tile's 25 m
#             mask (a cell is water with at most 4 of its 16 cells land), straightened where the mask is clear
# As JSON in the tile's vec pack ('npc'): {"h": [{"x", "z", "b": [[L, B, T, x, z, heading, name], ...], "g": [[x, z, [x, z, ...]], ...]}]}
# (heading in radians clockwise from grid north, the route from the mouth to the ground). Senja's square is left out: its fleet is
# the game's FLEET. The game sails them by the clock alone (05-vessels.js), so every player sees the same boats.
import math, json, hashlib, numpy as np
from scipy import ndimage
from scipy.sparse import csr_matrix
from scipy.sparse.csgraph import dijkstra
import frame

NAMES = ['Havbris', 'Nordlys', 'Havgull', 'Skarven', 'Sjøsprøyt', 'Polarstjerna', 'Sølvfisk', 'Kvitbjørn', 'Vesterhav', 'Havdrøm', 'Fiskeløs',
         'Storegg', 'Nordkyn', 'Brattøy', 'Måsøy', 'Torsken', 'Sjøblomsten', 'Bølgen', 'Morgenrøde', 'Kystvakt', 'Ternen', 'Havørn', 'Sildaskjær',
         'Lofotværing', 'Fjordbris', 'Stormfuglen', 'Nordstjerna', 'Havtind', 'Sjøgutt', 'Fiskebank', 'Skreien', 'Lyrtind', 'Havlys', 'Sørvær',
         'Ishavet', 'Kobben', 'Teisten', 'Bjørnøy', 'Steinbit', 'Lomvi', 'Ærfuglen', 'Breiflabb', 'Havstjerna', 'Brisen', 'Seigutten', 'Kyststjerna']
LEGW, LEGH = 2 * frame.LEG['KX'], 0.74 * frame.LEG['KY']
CAP = 55    # boats a tile
PER = 150   # m of face a boat
MOST = 3    # boats a harbour

def h01(*a): return int(hashlib.sha256(repr(a).encode()).hexdigest()[:12], 16) / 16 ** 12
def vlen(q): return q * 0.5 if q <= 160 else 80 + (q - 160) * 2
def boat(r):   # length, beam, draught (m) from a draw of the coastal fleet
    L = 7 + 3 * r / 0.45 if r < 0.45 else 10 + (r - 0.45) / 0.3 if r < 0.75 else 11 + 4 * (r - 0.75) / 0.15 if r < 0.9 else 15 + 6 * (r - 0.9) / 0.08 if r < 0.98 else 21 + 7 * (r - 0.98) / 0.02
    return round(L, 1), round(0.3 * L + 0.9, 1), round(0.09 * L + 0.6, 1)

def build(tx, ty, L, quay):
    ox, oy = tx * 50000.0, ty * 50000.0; b, n = quay
    if not n: return {'h': []}
    q = np.frombuffer(b, np.uint8); X = np.frombuffer(b[:2 * n], np.uint16).astype(float); Y = np.frombuffer(b[2 * n:4 * n], np.uint16).astype(float)
    A = np.frombuffer(b[4 * n:6 * n], np.uint16) / 65536 * 2 * math.pi; Lf = np.array([vlen(v) for v in q[6 * n:7 * n]]); Df = q[7 * n:8 * n] / 4; Kf = q[8 * n:9 * n]
    # Senja's square out (FLEET is its fleet)
    lon, lat = frame.to_ll((ox + X) / 1000, (oy + Y) / 1000); lx, ly = frame.ll_to_leg(lon, lat)
    keep = (Lf >= 12) & (Kf != 1) & ~((lx >= 0) & (lx <= LEGW) & (ly >= 0) & (ly <= LEGH))   # not the pontoons of a marina (kind 1), where the leisure boats lie
    idx = np.where(keep)[0]
    if not len(idx): return {'h': []}
    # the harbours: faces within 250 m, joined
    par = {int(i): int(i) for i in idx}
    def root(i):
        while par[i] != i: par[i] = par[par[i]]; i = par[i]
        return i
    cell = {}
    for i in idx: cell.setdefault((int(X[i] // 250), int(Y[i] // 250)), []).append(int(i))
    for (cx, cy), l in cell.items():
        for dx in (-1, 0, 1):
            for dy in (-1, 0, 1):
                for j in cell.get((cx + dx, cy + dy), []):
                    for i in l:
                        if i < j and math.hypot(X[i] - X[j], Y[i] - Y[j]) < 250: par[root(i)] = root(j)
    groups = {}
    for i in idx: groups.setdefault(root(int(i)), []).append(int(i))
    harbours = [g for g in groups.values() if Lf[g].sum() >= 30]
    if not harbours: return {'h': []}
    # the 100 m grids: water where at most 1 of the 16 cells of the mask is land (strict), or 4 (loose, for a harbour the strict one
    # cannot get out of)
    M = np.asarray(L['mask']) > 0; LAND16 = M.reshape(500, 4, 500, 4).sum(axis=(1, 3))
    Dm = np.asarray(L['depth']).astype(np.float32) / 2; D100 = Dm.reshape(500, 2, 500, 2).mean(axis=(1, 3))
    slope = ndimage.gaussian_gradient_magnitude(ndimage.uniform_filter(D100, 5), 2.5)
    dland = ndimage.distance_transform_edt(~M) * 25   # m to the land at 25 m
    D2L = dland.reshape(500, 4, 500, 4).min(axis=(1, 3))   # the nearest land of a 100 m cell's 16
    def grid(W):
        nid = -np.ones((500, 500), np.int64); wi = np.argwhere(W); nid[wi[:, 0], wi[:, 1]] = np.arange(len(wi))
        rows, cols, wts = [], [], []
        for dy, dx, w in ((0, 1, 1.0), (1, 0, 1.0), (1, 1, math.sqrt(2)), (1, -1, math.sqrt(2))):
            c0, c1 = (0, 500 - dx) if dx >= 0 else (-dx, 500)
            p0 = nid[0:500 - dy, c0:c1]; p1 = nid[dy:500, c0 + dx:c1 + dx]
            ok = (p0 >= 0) & (p1 >= 0); rows.append(p0[ok]); cols.append(p1[ok]); wts.append(np.full(int(ok.sum()), w))
        return {'W': W, 'nid': nid, 'wi': wi, 'G': csr_matrix((np.concatenate(wts), (np.concatenate(rows), np.concatenate(cols))), shape=(len(wi), len(wi))), 'trees': {}}
    GRIDS = [grid(LAND16 <= 1), grid(LAND16 <= 4)]
    W = GRIDS[1]['W']
    # the candidate grounds: every 500 m, 20-150 m deep
    cand = [(r, c) for r in range(2, 500, 5) for c in range(2, 500, 5) if W[r, c] and 20 <= D100[r, c] <= 150 and D2L[r, c] >= 600]
    taken = []   # the grounds the tile's harbours took so far: the next harbours keep off them
    smax = max(1e-6, float(np.percentile(slope[W], 95)))
    def clear(a, c):   # the straight line on the 25 m mask, every 10 m
        k = max(1, int(math.hypot(c[0] - a[0], c[1] - a[1]) / 10))
        for s in range(1, k):
            x, y = a[0] + (c[0] - a[0]) * s / k, a[1] + (c[1] - a[1]) * s / k
            if M[min(1999, max(0, int(y // 25))), min(1999, max(0, int(x // 25)))]: return False
        return True
    out = []
    # the boats a harbour gets: one for every 45 m of face, 1 to 8, at most CAP a tile (a city's many quays are not a fishing fleet),
    # the bigger harbours first when there are more harbours than that
    harbours = sorted(harbours, key=lambda g: -Lf[g].sum())[:CAP]
    want = [int(min(MOST, max(1, round(Lf[g].sum() / PER)))) for g in harbours]
    if sum(want) > CAP: want = [max(1, int(w * CAP / sum(want))) for w in want]
    nwant = {id(g): w for g, w in zip(harbours, want)}
    for hi, g in enumerate(sorted(harbours, key=lambda g: (round(X[g].mean()), round(Y[g].mean())))):
        hx, hy = float(X[g].mean()), float(Y[g].mean()); seed = (tx, ty, round(hx), round(hy))
        # the fleet at its faces
        faces = sorted(g, key=lambda i: -Lf[i]); used = {}; boats = []; N = nwant[id(g)]
        for k in range(N):
            Lb, Bb, Tb = boat(h01(seed, 'L', k))
            for tries in range(4):
                spot = None
                for i in faces:
                    if Df[i] <= 0 or Lf[i] * 0.9 < Lb + 2 or Df[i] < Tb + 0.5: continue
                    lim = Lf[i] / 2 - Lb / 2 - 1; u = used.setdefault(i, [])
                    for s in range(0, int(lim * 2) + 1, 2):
                        for a in ([0.0] if s == 0 else [s / 2, -s / 2]):
                            if abs(a) <= lim and not any(a + Lb / 2 + 1 > a0 and a - Lb / 2 - 1 < a1 for a0, a1 in u): spot = (i, a); break
                        if spot: break
                    if spot: break
                if spot: break
                Lb, Bb, Tb = boat(h01(seed, 'L', k, tries) * 0.45)   # a smaller one where none fits
            if not spot: continue
            i, a = spot; used[i].append((a - Lb / 2 - 1, a + Lb / 2 + 1))
            nx, ny = math.cos(A[i]), math.sin(A[i]); ux, uy = -ny, nx; off = Bb / 2 + 0.4
            hd = math.atan2(ux, -uy) + (math.pi if h01(seed, 'flip', k) < 0.5 else 0)
            nm = NAMES[int(h01(seed, 'n', k) * len(NAMES))] + (' II' if h01(seed, 'n2', k) > 0.8 else '')
            boats.append([Lb, Bb, Tb, round(X[i] + ux * a + nx * off, 1), round(Y[i] + uy * a + ny * off, 1), round(hd % (2 * math.pi), 3), nm])
        if not boats: continue
        # the mouth: the nearest water of the 100 m grid within 1.5 km; the strict grid first
        grounds = []
        for GR in GRIDS:
            Wg, nid, wi = GR['W'], GR['nid'], GR['wi']
            r0, c0 = int(hy // 100), int(hx // 100); best = None
            for r in range(max(0, r0 - 15), min(500, r0 + 16)):
                for c in range(max(0, c0 - 15), min(500, c0 + 16)):
                    if Wg[r, c]:
                        d = (r - r0) ** 2 + (c - c0) ** 2
                        if best is None or d < best[0]: best = (d, r, c)
            if not best: continue
            # harbours whose mouths share a 500 m cell share the tree of the first (Bergen's tile has 235 harbours)
            mk = (best[1] // 5, best[2] // 5)
            if mk not in GR['trees']: s0 = nid[best[1], best[2]]; GR['trees'][mk] = (s0,) + tuple(dijkstra(GR['G'], directed=False, indices=s0, return_predecessors=True, limit=230))
            src, dist, pred = GR['trees'][mk]
            sc = []
            for r, c in cand:
                if not Wg[r, c]: continue
                d = dist[nid[r, c]]
                if 30 <= d <= 220:
                    gx, gy = (c + 0.5) * 100, (r + 0.5) * 100
                    near = sum(1 for qx, qy in taken if math.hypot(gx - qx, gy - qy) < 2000)
                    sc.append((0.55 * min(1, slope[r, c] / smax) + 0.25 * h01(seed, 'g', r, c) + 0.2 * min(1, (D2L[r, c] - 600) / 600) - 0.45 * near, r, c))
            sc.sort(reverse=True); K = 2 + int(h01(seed, 'K') * 3)
            mouth = ((best[2] + 0.5) * 100, (best[1] + 0.5) * 100)
            for s_, r, c in sc:
                if len(grounds) >= K: break
                if any(math.hypot((c + 0.5) * 100 - gx, (r + 0.5) * 100 - gy) < 2000 for gx, gy, _ in grounds): continue
                path = []; v = nid[r, c]
                while v >= 0 and v != src: path.append(v); v = pred[v]
                path.append(src); pts = [((wi[v][1] + 0.5) * 100, (wi[v][0] + 0.5) * 100) for v in path[::-1]]
                pts[0] = mouth
                st = [pts[0]]; j = 0
                while j < len(pts) - 1:
                    k2 = len(pts) - 1
                    while k2 > j + 1 and not clear(pts[j], pts[k2]): k2 -= 1
                    st.append(pts[k2]); j = k2
                route = [v for p in st for v in (round(p[0]), round(p[1]))]
                grounds.append(((c + 0.5) * 100, (r + 0.5) * 100, route))
            if grounds: break
        if not grounds: continue
        taken += [(gx, gy) for gx, gy, _ in grounds]
        out.append({'x': round(hx), 'z': round(hy), 'b': boats, 'g': [[round(gx), round(gy), rt] for gx, gy, rt in grounds]})
    return {'h': out}

def entry(tx, ty, L, quay):
    d = build(tx, ty, L, quay)
    return json.dumps(d, ensure_ascii=False, separators=(',', ':')).encode(), sum(len(h['b']) for h in d['h'])
