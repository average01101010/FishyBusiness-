# The tidal streams in the narrow sounds along the whole coast (Fysikk 4 F8a, docs/planer/fysikk-4-sjo-og-skrog.md F8; Jonas 27.10.2026:
# «5a», the current as its own phase), from the game's own map and tide, without measurements (Kartverket's current tables are not open).
# A sound with a basin inside it fills and empties through its narrowest section: the flow is the basin's water surface times the rate
# the tide rises or falls (Q = A dH/dt), and the stream there U = Q / (width x depth). This finds the sounds and measures them; the game
# (core/06e-anchor.js curAt) does the rest with tideH.
#   1. The 25 m mask of every coast tile (tools/map/out/game, python3 tools/map/release.py && python3 tools/map/game.py) on 100 m cells,
#      water where any of the 16 cells under it is (so a narrow sound stays open), the water's count kept for the areas.
#   2. The distance to land (in cells, to 25 km), and a flood from the open sea (the tiles' seaward edge) that always takes the widest
#      way in (a bucket queue on the narrowest width met on the way): every water cell gets the cell it was reached from, a tree whose
#      root is the sea, and the water behind a cell is its subtree.
#   3. A sound is where the narrowest width met on the way in steps down, with a basin behind it of at least SND.minA km2 that is wider
#      than the sound itself; along one channel only the narrowest step is kept (the same basin behind).
#   4. Each sound measured on the 25 m mask: the narrowest section on the widest way through (a sound the 100 m cells joined across a
#      thin neck of land is dropped), its axis (out of the sea, into the basin), its width across the axis, its mean depth across it
#      (the 50 m depth layer), and how far the channel stays narrow on each side (where it is three times as wide, the jet is spent).
#   5. Kept where the tide there (src/data/tide.json, M2 + S2) would give at least SND.minU m/s at the springs.
#   6. Held to what the narrows can carry: U <= sqrt(2 g x the tide's range) (the head across them is at most the range), and 4 knots
#      where the depth layer has no cell in the section; the basin the game reckons with (A) is then what the narrows can fill.
# Written to src/data/strom.json (cols: x, y km in the game's frame; ax, ay the axis into the basin; w and d in m; A km2, the basin the
# narrows fill; ro and ri the reach out and in, km; U the stream at the springs, m/s; A0 the whole basin behind, km2), which the page
# takes in at build (core/06e-anchor.js).
#   python3 tools/strom/strom.py [--only x0,y0,x1,y1]     (needs numpy, scipy and numba; about ten minutes for the whole coast)
import os, sys, json, zlib, time, math, argparse
import numpy as np
from scipy import ndimage
from numba import njit

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))
GAME = os.path.join(ROOT, 'tools', 'map', 'out', 'game'); OUT = os.path.join(ROOT, 'src', 'data', 'strom.json')
TIDE = os.path.join(ROOT, 'src', 'data', 'tide.json')
# minA: the least basin (km2); maxW: the widest sound (m); minU: the least stream at the springs (m/s) to keep
# unknownU: the most a sound whose depth the 50 m layer does not have may run (m/s, 4 knots)
SND = dict(minA=0.5, maxW=3000, minU=0.15, cap=250, c=0.1, unknownU=2.06)
DT = {'u8': np.uint8, 'u8p': np.uint8, 'i16': np.int16, 'f32': np.float32}

def pack_blocks(fn):
    data = open(os.path.join(GAME, fn), 'rb').read(); hl = int.from_bytes(data[4:8], 'little'); head = json.loads(data[8:8 + hl])
    return data, 8 + hl, head['blocks']

@njit(cache=True)
def unmed16(b, n):
    q = np.zeros((n, n), np.int32)
    for r in range(n):
        for c in range(n):
            k = r * n + c; z = np.int32(b[k]) | (np.int32(b[n * n + k]) << 8); d = (z >> 1) ^ -(z & 1)
            a = q[r, c - 1] if c else 0; bb = q[r - 1, c] if r else 0; cc = q[r - 1, c - 1] if r and c else 0
            if cc >= max(a, bb): pr = min(a, bb)
            elif cc <= min(a, bb): pr = max(a, bb)
            else: pr = a + bb - cc
            q[r, c] = pr + d
    return q

# ---- the flood: the widest way in from the sea ----
DX = np.array([1, -1, 0, 0, 1, 1, -1, -1], np.int64); DY = np.array([0, 0, 1, -1, 1, -1, 1, -1], np.int64)
@njit(cache=True)
def flood(act, edt, seed, nx, ny, dx, dy, cap):
    N = nx * ny; lvl = np.zeros(N, np.uint8); par = np.full(N, -1, np.int32); nxt = np.full(N, -1, np.int32)
    head = np.full(cap + 1, -1, np.int32); seen = np.zeros(N, np.uint8); order = np.empty(int(act.sum()), np.int32); no = 0
    for i in range(N):
        if seed[i] and act[i]:
            L = edt[i]; seen[i] = 1; lvl[i] = L; nxt[i] = head[L]; head[L] = i
    cur = cap
    while cur >= 0:
        i = head[cur]
        if i < 0:
            cur -= 1; continue
        head[cur] = nxt[i]; order[no] = i; no += 1
        x = i % nx; y = i // nx
        for k in range(8):
            X = x + dx[k]; Y = y + dy[k]
            if X < 0 or Y < 0 or X >= nx or Y >= ny: continue
            j = Y * nx + X
            if seen[j] or not act[j]: continue
            # a diagonal step only where the two cells beside it are water (no way between two land cells touching at a corner)
            if k >= 4 and not (act[y * nx + X] and act[Y * nx + x]): continue
            L = min(cur, edt[j]); seen[j] = 1; lvl[j] = L; par[j] = i; nxt[j] = head[L]; head[L] = j
    return lvl, par, order[:no]

@njit(cache=True)
def accumulate(order, par, wc, edt):
    ws = wc.astype(np.uint32); mx = edt.copy()
    for k in range(order.shape[0] - 1, -1, -1):
        i = order[k]; p = par[i]
        if p >= 0:
            ws[p] += ws[i]
            if mx[i] > mx[p]: mx[p] = mx[i]
    return ws, mx

@njit(cache=True)
def candidates(order, par, lvl, E, ws, mx, minc, maxe):
    out = np.empty(order.shape[0], np.int32); n = 0
    for k in range(order.shape[0]):
        i = order[k]; p = par[i]
        if p < 0 or lvl[i] >= lvl[p] or E[i] < 1 or E[i] > maxe or ws[i] < minc: continue
        e = np.int32(E[i])
        if np.int32(mx[i]) < max(e + 2, np.int32(1.5 * e)): continue
        out[n] = i; n += 1
    return out[:n]

# ---- the 25 m mask round a sound: the widest way between two points, and its narrowest cell ----
@njit(cache=True)
def widest(water, edt, a, b, dx, dy):
    ny, nx = water.shape; N = nx * ny; seen = np.zeros(N, np.uint8); par = np.full(N, -1, np.int64); best = np.zeros(N, np.float32)
    # a priority queue by a sorted bucket of rounded widths (quarter cells), the widest first
    B = 4096; head = np.full(B, -1, np.int64); nxt = np.full(N, -1, np.int64)
    s = a[1] * nx + a[0]
    if not water[a[1], a[0]]: return -1.0, -1, par
    seen[s] = 1; best[s] = edt[a[1], a[0]]; L0 = min(B - 1, int(best[s] * 4)); head[L0] = s; cur = L0
    t = b[1] * nx + b[0]
    while cur >= 0:
        i = head[cur]
        if i < 0:
            cur -= 1; continue
        head[cur] = nxt[i]
        if i == t: return best[i], t, par
        x = i % nx; y = i // nx
        for k in range(8):
            X = x + dx[k]; Y = y + dy[k]
            if X < 0 or Y < 0 or X >= nx or Y >= ny: continue
            j = Y * nx + X
            if seen[j] or not water[Y, X]: continue
            if k >= 4 and not (water[y, X] and water[Y, x]): continue
            v = min(best[i], edt[Y, X]); seen[j] = 1; best[j] = v; par[j] = i
            L = min(cur, int(v * 4)); nxt[j] = head[L]; head[L] = j
    return -1.0, -1, par

# the water behind a sound (its subtree) and the widest other way out of it: the basin's cells marked, and every place one of them
# touches water that is not behind the sound, further than rb cells from the sound, gives a width (the least of the two cells' distances
# to land and the narrowest width met from there out to the sea); the widest such, and where (a in the basin, b outside)
@njit(cache=True)
def other_exit(s, par, act, edt, lvl, nx, ny, dx, dy, mark, tag, rb, lim):
    st = np.empty(lim, np.int32); n = 1; st[0] = s; mark[s] = tag; k = 0
    while k < n:
        i = st[k]; k += 1; x = i % nx; y = i // nx
        for q in range(8):
            X = x + dx[q]; Y = y + dy[q]
            if X < 0 or Y < 0 or X >= nx or Y >= ny: continue
            j = Y * nx + X
            if par[j] == i and mark[j] != tag:
                if n >= lim: return np.empty(0, np.int32), np.empty(0, np.int32), np.empty(0, np.int32), n
                mark[j] = tag; st[n] = j; n += 1
    sx = s % nx; sy = s // nx; m = 0; cv = np.empty(200000, np.int32); ca = np.empty(200000, np.int32); cb = np.empty(200000, np.int32)
    for k in range(n):
        i = st[k]; x = i % nx; y = i // nx
        if (x - sx) * (x - sx) + (y - sy) * (y - sy) <= rb * rb: continue
        for q in range(4):
            X = x + dx[q]; Y = y + dy[q]
            if X < 0 or Y < 0 or X >= nx or Y >= ny: continue
            j = Y * nx + X
            if not act[j] or mark[j] == tag or par[j] < 0 and lvl[j] == 0: continue
            v = min(edt[i], edt[j], lvl[j])
            if v >= 2 and m < 200000: cv[m] = v; ca[m] = i; cb[m] = j; m += 1
    return cv[:m], ca[:m], cb[:m], n

def main():
    ap = argparse.ArgumentParser(); ap.add_argument('--only', help='x0,y0,x1,y1 km: only the sounds there (a check)'); ap.add_argument('--out', default=OUT)
    ap.add_argument('--probe', help='x,y km: what became of the candidates within 4 km (a check)')
    a = ap.parse_args(); t0 = time.time()
    log = lambda *m: print(*m, f'({time.time() - t0:.0f} s)', file=sys.stderr, flush=True)
    man = json.load(open(os.path.join(GAME, 'manifest.json'))); tiles = man['tiles']; c = SND['c']
    tx0 = min(t[0] for t in tiles); tx1 = max(t[0] for t in tiles) + 1; ty0 = min(t[1] for t in tiles); ty1 = max(t[1] for t in tiles) + 1
    X0, Y0 = tx0 * 50, ty0 * 50; nx, ny = (tx1 - tx0) * 500, (ty1 - ty0) * 500
    log(f'grid {nx} x {ny} on 100 m from {X0},{Y0} km, {len(tiles)} tiles')
    wc = np.zeros((ny, nx), np.uint8); have = np.zeros((ny // 100, nx // 100), bool)
    M25 = {}; DEP = {}
    for p in man['packs']:
        if p['kind'] != 'sim': continue
        data, at, blocks = pack_blocks(p['file'])
        for l, bx, by, off, ln, *_ in blocks:
            if l == 'mask':
                m = np.frombuffer(zlib.decompress(data[at + off:at + off + ln], -15), np.uint8).reshape(400, 400)
                M25[(bx, by)] = m
                w = (m == 0).reshape(100, 4, 100, 4).sum(axis=(1, 3)).astype(np.uint8)
                gx, gy = bx * 100 - X0 * 10, by * 100 - Y0 * 10
                if 0 <= gx < nx and 0 <= gy < ny: wc[gy:gy + 100, gx:gx + 100] = w; have[gy // 100, gx // 100] = True
            elif l == 'depth':
                DEP[(bx, by)] = (p['file'], off, ln, at)
    log(f'{len(M25)} mask blocks read')
    # the blocks no tile has: the open sea where the national 1 km land says water (the tiles reach 40-65 km out), else land
    core = [p for p in man['packs'] if p['kind'] == 'core'][0]; data, at, blocks = pack_blocks(core['file']); L1 = man['layers']['land1k']
    land1k = np.zeros((L1['ny'], L1['nx']), np.uint8)
    for l, bx, by, off, ln, *_ in blocks:
        if l != 'land1k': continue
        n = L1['n']; land1k[by * n - L1['iy0']:(by + 1) * n - L1['iy0'], bx * n - L1['ix0']:(bx + 1) * n - L1['ix0']] = np.frombuffer(zlib.decompress(data[at + off:at + off + ln], -15), np.uint8).reshape(n, n)
    hv = np.repeat(np.repeat(have, 100, 0), 100, 1)
    jj = (np.arange(ny) * c + Y0 + c / 2) // 1 - L1['iy0']; ii = (np.arange(nx) * c + X0 + c / 2) // 1 - L1['ix0']
    jj = np.clip(jj.astype(np.int64), 0, L1['ny'] - 1); ii = np.clip(ii.astype(np.int64), 0, L1['nx'] - 1)
    sea_out = np.zeros((ny, nx), bool)
    for j0 in range(0, ny, 2000):
        sea_out[j0:j0 + 2000] = (~hv[j0:j0 + 2000]) & (land1k[jj[j0:j0 + 2000]][:, ii] == 0)
    water = (wc > 0) | sea_out; act = (wc > 0) & hv
    seed = (act & ndimage.binary_dilation(sea_out, iterations=1)).ravel().astype(np.uint8)
    del land1k
    # the distance to land in cells (to SND.cap), tile by tile with a margin as wide as the cap
    cap = SND['cap']; edt = np.zeros((ny, nx), np.uint8)
    for t in tiles:
        gx, gy = (t[0] - tx0) * 500, (t[1] - ty0) * 500; x0, y0 = max(0, gx - cap), max(0, gy - cap); x1, y1 = min(nx, gx + 500 + cap), min(ny, gy + 500 + cap)
        d = ndimage.distance_transform_edt(water[y0:y1, x0:x1])
        edt[gy:gy + 500, gx:gx + 500] = np.minimum(np.round(d[gy - y0:gy - y0 + 500, gx - x0:gx - x0 + 500]), cap).astype(np.uint8)
    edt[~act] = 0
    log(f'distance to land done; {int(act.sum())} water cells, {int(seed.sum())} seeds')
    del water, hv, sea_out
    A8 = act.ravel().astype(np.uint8); E = edt.ravel(); WC = wc.ravel(); del act
    only = [float(v) for v in a.only.split(',')] if a.only else None
    PR = [float(v) for v in a.probe.split(',')] if a.probe else None
    def kmof(i): return X0 + (i % nx + 0.5) * c, Y0 + (i // nx + 0.5) * c
    def near(i): return PR and math.hypot(kmof(i)[0] - PR[0], kmof(i)[1] - PR[1]) < 4
    # the tide at the springs: M2 + S2 of the nearest point
    T = json.load(open(TIDE)); cols = T['cols']; TP = np.array([[r[cols.index('x')], r[cols.index('y')], r[cols.index('M2A')] + r[cols.index('S2A')]] for r in T['points']])
    om = 2 * math.pi / (12.42 * 3600)
    dcache = {}
    def depth_at(x, y):   # m, the 50 m layer's nearest cell (0 on land or where there is none)
        ix, iy = int(math.floor(x / 0.05)), int(math.floor(y / 0.05)); bx, by = ix // 200, iy // 200
        if (bx, by) not in dcache:
            e = DEP.get((bx, by))
            if not e: dcache[(bx, by)] = None
            else:
                fn, off, ln, at = e; d = open(os.path.join(GAME, fn), 'rb').read()
                dcache[(bx, by)] = unmed16(np.frombuffer(zlib.decompress(d[at + off:at + off + ln], -15), np.uint8), 200)
        B = dcache[(bx, by)]
        return 0.0 if B is None else B[iy - by * 200, ix - bx * 200] / 2
    def mask_win(xc, yc, R):   # the 25 m water round (xc, yc) km, R km each way; 1 = water, and its origin in 25 m cells
        i0, j0 = int(math.floor((xc - R) / 0.025)), int(math.floor((yc - R) / 0.025)); n = int(2 * R / 0.025)
        W = np.ones((n, n), np.uint8)
        for bx in range(i0 // 400, (i0 + n) // 400 + 1):
            for by in range(j0 // 400, (j0 + n) // 400 + 1):
                m = M25.get((bx, by)); xa, ya = bx * 400, by * 400
                sx0, sy0 = max(i0, xa), max(j0, ya); sx1, sy1 = min(i0 + n, xa + 400), min(j0 + n, ya + 400)
                if sx0 >= sx1 or sy0 >= sy1: continue
                W[sy0 - j0:sy1 - j0, sx0 - i0:sx1 - i0] = 1 if m is None else (m[sy0 - ya:sy1 - ya, sx0 - xa:sx1 - xa] == 0)
        return W, i0, j0
    def cross(W, x, y, ux, uy):   # m across the water at (x, y) (25 m cells, float) along the unit (ux, uy): to land each way
        n = W.shape[0]; ends = []
        for sgn in (1, -1):
            s = 0.0
            while s < 6000:
                X, Y = x + sgn * ux * s / 25, y + sgn * uy * s / 25; ix, iy = int(X), int(Y)
                if ix < 0 or iy < 0 or ix >= n or iy >= n or not W[iy, ix]: break
                s += 6.25
            ends.append(s)
        return ends[0] + ends[1], ends
    def snap(W, pt):   # onto the nearest water of the 25 m mask (the 100 m cell's centre may be on land)
        n = W.shape[0]; xx, yy = min(max(pt[0], 0), n - 1), min(max(pt[1], 0), n - 1)
        if W[yy, xx]: return (xx, yy)
        ys, xs = np.nonzero(W[max(0, yy - 8):yy + 9, max(0, xx - 8):xx + 9])
        if not len(xs): return None
        k2 = np.argmin((xs + max(0, xx - 8) - xx) ** 2 + (ys + max(0, yy - 8) - yy) ** 2); return (int(xs[k2] + max(0, xx - 8)), int(ys[k2] + max(0, yy - 8)))
    # a sound measured on the 25 m mask between a point on the sea side and one in the basin (km): None when no way joins them
    def measure(sea, bas):
        R = max(2.0, 0.6 * math.hypot(sea[0] - bas[0], sea[1] - bas[1]) + 1.0)
        W, i0, j0 = mask_win((sea[0] + bas[0]) / 2, (sea[1] + bas[1]) / 2, R)
        e25 = ndimage.distance_transform_edt(W).astype(np.float32)
        pa = snap(W, (int(sea[0] / 0.025) - i0, int(sea[1] / 0.025) - j0)); pb = snap(W, (int(bas[0] / 0.025) - i0, int(bas[1] / 0.025) - j0))
        if pa is None or pb is None: return None
        v, t, P = widest(W, e25, np.array(pa, np.int64), np.array(pb, np.int64), DX, DY)
        if v < 0: return None
        path = []; q = t; nW = W.shape[1]
        while q >= 0: path.append(q); q = P[q]
        path = path[::-1]; ev = np.array([e25[q // nW, q % nW] for q in path]); k = int(np.argmin(ev))
        sx, sy = path[k] % nW + 0.5, path[k] // nW + 0.5
        a0, a1 = path[max(0, k - 6)], path[min(len(path) - 1, k + 6)]
        ux, uy = (a1 % nW) - (a0 % nW), (a1 // nW) - (a0 // nW); un = math.hypot(ux, uy) or 1; ux, uy = ux / un, uy / un
        # the narrowest of the sections across a few directions round the path's (a bend makes the path's own a slant)
        best = None
        for da in (-30, -15, 0, 15, 30):
            ca, sa = math.cos(math.radians(da)), math.sin(math.radians(da)); vx, vy = ux * ca - uy * sa, ux * sa + uy * ca
            w, ends = cross(W, sx, sy, -vy, vx)
            if best is None or w < best[0]: best = (w, ends, vx, vy)
        w, ends, ux, uy = best
        off = (ends[0] - ends[1]) / 2 / 25; mx_, my_ = sx - uy * off, sy + ux * off
        X, Y = (i0 + mx_) * 0.025, (j0 + my_) * 0.025
        ds = [depth_at(X + (-uy) * (w * (k2 + 0.5) / 12 - w / 2) / 1000, Y + ux * (w * (k2 + 0.5) / 12 - w / 2) / 1000) for k2 in range(12)]
        ds = [d_ for d_ in ds if d_ > 0]
        # a section narrower than the 50 m depth cells (all of them land there): the water's cells within 150 m, else 2 m (the game's own
        # word for a sound the mask closed, depthWater in core/03-simulation.js)
        if not ds: ds = [v_ for v_ in (depth_at(X + 0.05 * i_, Y + 0.05 * j_) for i_ in range(-3, 4) for j_ in range(-3, 4)) if v_ > 0]
        d = max(1.0, float(np.mean(ds))) if ds else 2.0; dknown = bool(ds)
        def reach(dirn):   # how far the channel stays narrow: until the section is three times as wide (at most 4 km)
            kk = k; last = 0.0
            while 0 <= kk + dirn < len(path):
                kk += dirn; q = path[kk]; cx_, cy_ = q % nW + 0.5, q // nW + 0.5; L_ = math.hypot(cx_ - sx, cy_ - sy) * 0.025
                if L_ > 4: break
                if e25[q // nW, q % nW] * 2 * 25 > 3 * w: return max(L_, 0.15)
                last = L_
            return max(0.15, last)
        amp = TP[np.argmin((TP[:, 0] - X) ** 2 + (TP[:, 1] - Y) ** 2), 2]
        return dict(x=X, y=Y, ux=ux, uy=uy, w=max(25.0, w), d=d, ro=reach(-1), ri=reach(1), amp=amp, dknown=dknown)
    def up(j, n):   # n steps toward the sea along the tree
        k = 0
        while par[j] >= 0 and k < n: j = par[j]; k += 1
        return j
    def down(b, n):   # n steps into the basin: the child with the most water behind it
        for _ in range(n):
            bxg, byg = b % nx, b // nx; best = -1; bw = -1
            for q in range(8):
                X, Y = bxg + DX[q], byg + DY[q]
                if 0 <= X < nx and 0 <= Y < ny:
                    j2 = Y * nx + X
                    if par[j2] == b and ws[j2] > bw: bw = ws[j2]; best = j2
            if best < 0: break
            b = best
        return b
    blocked = 0
    for rnd in range(10):
        lvl, par, order = flood(A8, E, seed, nx, ny, DX, DY, cap)
        ws, mx = accumulate(order, par, WC, E)
        cand = candidates(order, par, lvl, E, ws, mx, int(SND['minA'] / 0.000625), int(SND['maxW'] / 200 + 1))
        # along one channel the narrowest step only: an ancestor within 6 km with much the same water behind it gives way
        isc = np.zeros(nx * ny, np.uint8); isc[cand] = 1; drop = set()
        for i in cand:
            j = par[i]; k = 0
            while j >= 0 and k < 60:
                if isc[j] and ws[j] <= 1.25 * ws[i]: drop.add(int(j))
                j = par[j]; k += 1
        del isc
        keep = [int(i) for i in cand if int(i) not in drop]
        if only: keep = [i for i in keep if only[0] - 30 <= kmof(i)[0] <= only[2] + 30 and only[1] - 30 <= kmof(i)[1] <= only[3] + 30]
        if PR:
            for i in cand:
                i = int(i)
                if near(i): print('cand', *[round(v, 2) for v in kmof(i)], 'edt', int(E[i]), 'lvl', int(lvl[i]), 'A', round(ws[i] * 0.000625, 2), 'mx', int(mx[i]), 'dropped' if i in drop else 'kept', file=sys.stderr)
        meas = {}; bad = []
        for i in keep:
            m = measure(kmof(up(i, 15)), kmof(down(i, 15)))
            if m is None: bad.append(i)
            else: meas[i] = m
            if near(i): print('round', rnd, 'measured' if m else 'no way', m and {k: round(float(v), 2) for k, v in m.items()}, file=sys.stderr)
        log(f'round {rnd}: {len(cand)} candidates, {len(keep)} sounds, {len(bad)} with no way on the 25 m mask')
        if not bad: break
        # a way the 100 m cells made over a thin neck of land: shut, and the flood again
        for i in bad: A8[i] = 0; E[i] = 0; blocked += 1
    # the other ways out of each basin: the flow is shared by the sections (w d^1.5, as a channel with friction carries it)
    mark = np.zeros(nx * ny, np.uint16); out = []; st = dict(sounds=len(meas), blocked=blocked, shared=0, slow=0, choked=0, same=0)
    for tag, (i, m) in enumerate(meas.items(), 1):
        A = float(ws[i]) * 0.000625; share = 1.0
        rb = max(15, 3 * int(E[i]))
        cv, ca, cb, n = other_exit(i, par, A8, E, lvl, nx, ny, DX, DY, mark, tag % 65535 + 1, rb, 4_000_000)
        # up to three other ways out, each the widest contact of its own place (2 km or the sound's own reach apart)
        alts = []; picked = []
        for k in np.argsort(-cv, kind='stable'):
            if len(picked) >= 3: break
            pa_ = kmof(int(ca[k]))
            if any(math.hypot(pa_[0] - q[0], pa_[1] - q[1]) < max(2.0, rb * c) for q in picked): continue
            picked.append(pa_); mm = measure(kmof(up(int(cb[k]), 15)), kmof(up(int(ca[k]), 15)))
            if mm is not None: alts.append(mm)
        g = [m['w'] * m['d'] ** 1.5] + [q['w'] * q['d'] ** 1.5 for q in alts]; G_ = sum(g)
        if alts: st['shared'] += 1
        if near(i):
            for q in alts: print('other way out', {k: round(float(v_), 2) for k, v_ in q.items()}, file=sys.stderr)
        for mm, f_ in zip([m] + alts, [v_ / G_ for v_ in g]):
            if mm is None or f_ <= 0.02: continue
            if only and not (only[0] <= mm['x'] <= only[2] and only[1] <= mm['y'] <= only[3]): continue
            Ab = A * f_; U = Ab * 1e6 * mm['amp'] * om / (mm['w'] * mm['d'])
            if U < SND['minU']: st['slow'] += 1; continue
            # the most the water can run through the narrows: the head across them is at most the range of the tide outside (Bernoulli,
            # U <= sqrt(2 g range)), and where the 50 m depth has no cell in the section (the depth unknown) at most 4 knots; the basin
            # is then taken as what the narrows can fill (Ae, the area the game reckons with), the whole one kept in A0
            Uc = min(math.sqrt(2 * 9.81 * 2 * mm['amp']), U if mm['dknown'] else SND['unknownU'])
            Ae = Ab * min(1.0, Uc / U)
            if Ae < Ab: st['choked'] += 1
            out.append([round(mm['x'], 3), round(mm['y'], 3), round(mm['ux'], 3), round(mm['uy'], 3), round(mm['w']), round(mm['d'], 1), round(Ae, 2), round(mm['ro'], 2), round(mm['ri'], 2), round(min(U, Uc), 2), round(Ab, 2)])
    # one entry per place: the same strait found twice (from two candidates, or as one basin's sound and another's other way out) lies
    # within a section's width, or within the reach of the one kept along much the same axis; the larger basin is kept
    out.sort(key=lambda r: -r[6]); fin = []
    for r in out:
        if any(math.hypot(r[0] - q[0], r[1] - q[1]) * 1000 < max(150, q[4]) or (math.hypot(r[0] - q[0], r[1] - q[1]) < max(q[7], q[8], 0.3) and abs(r[2] * q[2] + r[3] * q[3]) > 0.7) for q in fin):
            st['same'] += 1; continue
        fin.append(r)
    fin.sort(key=lambda r: (r[1], r[0]))
    D = {'src': 'tools/strom/strom.py: the 25 m mask and the 50 m depth of tools/map/out/game, tide.json M2+S2', 'made': time.strftime('%Y-%m-%d'),
         'cols': ['x', 'y', 'ax', 'ay', 'w', 'd', 'A', 'ro', 'ri', 'U', 'A0'], 's': fin}
    json.dump(D, open(a.out, 'w'), separators=(',', ':'))
    st['final'] = len(fin); st['s'] = round(time.time() - t0); st['kB'] = os.path.getsize(a.out) // 1024
    print(json.dumps(st))

if __name__ == '__main__': main()
