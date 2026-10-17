"""The coastal vessel (kyst15), a modern 14.99 m Norwegian coastal boat, built in Blender after the pictures Jonas showed on 06.10.2026
(a red and white 15 m boat from the bow, the side and the quarter). The game's size stands (14.99 x 6.6 m, 3.0 m draft); the pictures
give the type: a deep red hull with a white rubbing strake and boot top, the white shelter deck (baksdekk) over the working deck with
its open hauling station on the starboard side, the wheelhouse forward on the shelter with raked windows and a tall mast on its roof,
the white bulwark round the foredeck rising to a raked stem over a round forefoot, the red knuckle crane aft, and the mizzen at the
stern with its red steadying sail and the boom over the transom. Exterior only (CLAUDE.md).

    pip install bpy==4.5.4
    python3 tools/boats/kyst15.py            -> src/data/boat-kyst15.b64 (+ the side picture), renders in tools/boats/out/
    python3 tools/boats/kyst15.py fast dry   -> no renders to look at, and the GLB only in tools/boats/out

Frame: x forward from the transom, y to port, z up from the bottom of the keel; the waterline is z = 2.75."""
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy
from bpyutil import *

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE)); OUT = os.path.join(HERE, 'out')
WL = 2.75; XA = 0.0; XF = 14.99; XM = (XA + XF) / 2; HB = 3.3
ZMD = 3.65                  # the working deck under the shelter
ZSD = 5.8                   # the shelter deck, the foredeck
X_ENT = 8.5                 # the bow patch from here forward
OP0, OP1 = 4.6, 7.8         # the open hauling station in the starboard side (on hull stations)


# ---------- lines (metres) ----------
LOW = [(XA, 2.35), (1.5, 1.6), (3.0, 1.0), (5.0, 0.82), (10.0, 0.82), (12.5, 1.1), (13.4, 1.4)]
def z_low(x): return interp(LOW, x)
# the stem (z, x): a round forefoot running out to a nose by the waterline, then raked and flaring to the bulwark
STEM = [(1.4, 13.4), (1.8, 13.95), (2.3, 14.3), (2.7, 14.45), (3.2, 14.5), (4.0, 14.62), (5.0, 14.78), (6.55, XF)]
def x_stem(z): return interp(STEM, z)
TOP = [(XA, 5.9), (9.0, 5.9), (12.0, 6.05), (13.5, 6.3), (XF, 6.55)]
def z_top(x): return interp(TOP, x)
RED = [(XA, 4.6), (8.0, 4.55), (11.0, 4.75), (13.0, 5.2), (XF, 5.7)]
def z_red(x): return interp(RED, x)       # the red hull's top, white above it
Z_RUB = 3.85                              # the white rubbing strake
HBW = [(XA, 2.95), (2.0, 3.15), (5.0, 3.25), (X_ENT, 3.25)]
HBD = [(XA, 3.15), (2.0, 3.28), (5.0, 3.3), (X_ENT, 3.3)]
NX = [(XA, 2.2), (2.0, 2.5), (5.0, 2.8), (X_ENT, 2.8)]


def section_body(x, n=24):
    zl = z_low(x); zt = z_top(x); bw = interp(HBW, x); bd = interp(HBD, x); nn = interp(NX, x); pts = []
    for k in range(n + 1):
        th = (math.pi / 2) * k / n; c = math.cos(th); s = math.sin(th)
        pts.append((bw * (s ** (2 / nn) if s > 0 else 0.0), zl + (WL - zl) * (1 - (c ** (2 / nn) if c > 0 else 0.0))))
    for k in range(1, 9):
        z = WL + (zt - WL) * k / 8; pts.append((bw + (bd - bw) * ((z - WL) / (zt - WL)) ** 0.7, z))
    return pts

def smooth(a, b, z):
    t = max(0.0, min(1.0, (z - a) / (b - a))); return t * t * (3 - 2 * t)

# The bow is a patch of rows from the section at X_ENT to the stem (as in al45.py): under water the rows ride up along the keel to the
# forefoot; over it each row keeps its place between the waterline, the rubbing strake, the red hull's top and the bulwark top, which
# all rise towards the bow; y = yk (1 - (1 - s)^p) closes them on the stem.
def lift(zk, x):
    if zk <= WL:
        w = 1 - smooth(1.2, 2.4, zk); return zk + w * (z_low(x) - z_low(X_ENT))
    C0 = [(WL, WL), (Z_RUB, Z_RUB), (z_red(X_ENT), z_red(x)), (z_top(X_ENT), z_top(x))]
    for (a0, a1), (b0, b1) in zip(C0, C0[1:]):
        if zk <= b0: t = (zk - a0) / (b0 - a0); return a1 + (b1 - a1) * t
    return z_top(x)

def bow_pt(yk, zk, x=None, s=None):
    xf = x_stem(zk); xf = x_stem(lift(zk, xf)); xf = x_stem(lift(zk, xf))
    if s is None: s = max(0.0, min(1.0, (xf - x) / (xf - X_ENT)))
    else: x = xf - s * (xf - X_ENT)
    z = lift(zk, x)
    return x, (yk * (1 - (1 - s) ** interp([(0.0, 2.0), (WL, 2.5), (5.0, 3.0), (7.0, 3.4)], zk)) if s > 0 else 0.0), z

_SD = {}
def section(x, sg=1, n=24):
    if x <= X_ENT: pts = section_body(x, n)
    else:
        if 'd' not in _SD: _SD['d'] = resample(section_body(X_ENT, 48), [(None, 120)])
        pts = [bow_pt(y, z, x=x)[1:] for y, z in _SD['d']]
    return [(sg * y, z) for y, z in pts]

def hbz(x, z):
    sec = [(abs(y), zz) for y, zz in section(x, 1)]
    if z <= sec[0][1]: return 0.0
    for a, b in zip(sec, sec[1:]):
        if a[1] <= z <= b[1]: t = (z - a[1]) / max(1e-9, b[1] - a[1]); return a[0] + (b[0] - a[0]) * t
    return sec[-1][0]


# ---------- colours: signal red and white ----------
C = {}
def colours():
    C['af'] = mat('antifouling', (0.07, 0.07, 0.075), 0.15)
    C['hull'] = mat('k15red', (0.72, 0.05, 0.04), 0.6, zone=1)
    C['white'] = mat('white', (0.92, 0.92, 0.90), 0.5)
    C['inner'] = mat('inner', (0.82, 0.82, 0.80), 0.3)
    C['deck'] = mat('deck', (0.42, 0.44, 0.44), 0.12)
    C['roof'] = mat('roof', (0.80, 0.80, 0.78), 0.3)
    C['steel'] = mat('steel', (0.66, 0.68, 0.70), 0.75, metal=0.7)
    C['dark'] = mat('dark', (0.12, 0.13, 0.14), 0.25)
    C['black'] = mat('black', (0.05, 0.05, 0.06), 0.35)
    C['glass'] = mat('glass', (0.05, 0.08, 0.11), 0.95)
    C['prop'] = mat('bronze', (0.70, 0.52, 0.27), 0.8, metal=0.9)
    C['orange'] = mat('orange', (0.95, 0.38, 0.06), 0.45)
    C['sail'] = mat('sail', (0.62, 0.11, 0.08), 0.15)
    C['wood'] = mat('door', (0.72, 0.52, 0.26), 0.4)

NB = lambda fine: (9 if fine else 3, 1, 4 if fine else 2, 1, 4 if fine else 1, 4 if fine else 1)
# rows per band: bottom, boot top (white), red to the strake, the strake (white), red to its top, the white above

def cut(sec, x, fine):
    n = NB(fine); zr = z_red(x) if x <= X_ENT else z_red(X_ENT)
    return resample(sec, [(WL - 0.04, n[0]), (WL + 0.10, n[1]), (Z_RUB - 0.06, n[2]), (Z_RUB + 0.06, n[3]), (zr, n[4]), (None, n[5])])

def hull_rows(sg, fine=True):
    rows = []
    xs = ([XA + 0.04 * i for i in range(4)] + [0.2 + 0.4 * i for i in range(21)]) if fine else [XA, 0.1, 1.0, 3.0, 6.0]
    for x in sorted(set(round(v, 4) for v in xs if v < X_ENT)):
        rows.append([(x, sg * y, z) for y, z in cut([(abs(y), z) for y, z in section(x, sg)], x, fine)])
    base = cut(section_body(X_ENT, 48), X_ENT, fine); n = 34 if fine else 10
    for i in range(n + 1):
        s = (1 - i / n) ** 1.4
        rows.append([(x, sg * y, z) for x, y, z in (bow_pt(yk, zk, s=s) for yk, zk in base)])
    return rows

def band_of(j, fine):
    n = NB(fine); k = 0
    for m, c in zip(n, ('af', 'white', 'hull', 'white', 'hull', 'white')):
        k += m
        if j < k: return C[c]
    return C['white']

def build_hull(fine=True):
    objs = []; first = {}
    for sg, nm in ((1, 'p'), (-1, 's')):
        rows = hull_rows(sg, fine); first[sg] = rows[0]
        n = NB(fine); jw = sum(n[:5])     # the white band over the red: its lower cells are the hauling station's opening to starboard
        hole = lambda i, j, rows=rows: sg < 0 and fine and jw <= j < jw + n[5] - 1 and rows[i][0][0] >= OP0 - 1e-6 and rows[i + 1][0][0] <= OP1 + 1e-6
        objs.append(grid('hull_' + nm, rows, lambda i, j, hole=hole: None if hole(i, j) else band_of(j, fine), out=lambda c: (0, c.y, min(c.z, 3.5) - 3.5)))
    T = [[q, p] for p, q in zip(first[1], first[-1])]
    objs.append(grid('transom', T, lambda i, j: band_of(i, fine), angle=20, out=lambda c: (-1, 0, 0)))
    return objs


# ---------- the shelter deck and foredeck, the open hauling station, the rails ----------
def decks(fine=True):
    A = Acc('decks'); step = 0.4 if fine else 1.5
    xs = sorted(set([XA + 0.05] + [XA + 0.3 + step * k for k in range(int(XF / step) + 2) if XA + 0.3 + step * k < XF - 0.3] + [XF - 0.3]))
    for x0, x1 in zip(xs, xs[1:]):
        ya, yb = hbz(x0, ZSD) - 0.05, hbz(x1, ZSD) - 0.05
        ta, tb = z_top(x0), z_top(x1); ea, eb = hbz(x0, ta), hbz(x1, tb)
        A.poly([(x0, -ya, ZSD), (x1, -yb, ZSD), (x1, yb, ZSD), (x0, ya, ZSD)], C['deck'], (0, 0, 1))
        for sg in (1, -1):
            A.poly([(x0, sg * ya, ZSD), (x1, sg * yb, ZSD), (x1, sg * (eb - 0.06), tb), (x0, sg * (ea - 0.06), ta)], C['inner'], (0, -sg, 0))
            A.poly([(x0, sg * (ea - 0.06), ta), (x1, sg * (eb - 0.06), tb), (x1, sg * eb, tb + 0.01), (x0, sg * ea, ta + 0.01)], C['white'], (0, 0, 1))
    y = hbz(XA, ZSD) - 0.05
    A.poly([(XA + 0.05, -y, ZSD), (XA + 0.05, y, ZSD), (XA + 0.05, y, z_top(XA)), (XA + 0.05, -y, z_top(XA))], C['inner'], (1, 0, 0))
    # the hauling station, open in the starboard side over the red bulwark: the working deck inside, the bulwark's inner face and
    # capping, the walls aft, forward and inboard (a door in it) and the white ceiling under the shelter deck
    zr = z_red(OP0); YB = 0.9; xs_ = [OP0 + (OP1 - OP0) * k / 8 for k in range(9)]
    for xa, xb in zip(xs_, xs_[1:]):
        ya, yb = hbz(xa, ZMD) - 0.05, hbz(xb, ZMD) - 0.05; ra, rb = hbz(xa, zr) - 0.05, hbz(xb, zr) - 0.05
        A.poly([(xa, -ya, ZMD), (xb, -yb, ZMD), (xb, -YB, ZMD), (xa, -YB, ZMD)], C['deck'], (0, 0, 1))
        A.poly([(xa, -ya, ZMD), (xb, -yb, ZMD), (xb, -rb, zr), (xa, -ra, zr)], C['inner'], (0, 1, 0))
        A.poly([(xa, -ra, zr), (xb, -rb, zr), (xb, -(rb + 0.05), zr), (xa, -(ra + 0.05), zr)], C['white'], (0, 0, 1))
        A.poly([(xa, -(hbz(xa, ZSD) - 0.02), ZSD - 0.03), (xb, -(hbz(xb, ZSD) - 0.02), ZSD - 0.03), (xb, -YB, ZSD - 0.03), (xa, -YB, ZSD - 0.03)], C['white'], (0, 0, -1))
    A.poly([(OP0, -YB, ZMD), (OP1, -YB, ZMD), (OP1, -YB, ZSD), (OP0, -YB, ZSD)], C['inner'], (0, -1, 0))
    A.poly([(OP1 - 1.2, -YB - 0.01, ZMD), (OP1 - 0.4, -YB - 0.01, ZMD), (OP1 - 0.4, -YB - 0.01, ZMD + 1.9), (OP1 - 1.2, -YB - 0.01, ZMD + 1.9)], C['wood'], (0, -1, 0))
    for x, s_ in ((OP0, 1), (OP1, -1)):
        zs = [ZMD + (ZSD - ZMD) * k / 6 for k in range(7)]
        A.poly([(x, -YB, ZMD)] + [(x, -(hbz(x, z) - 0.02), z) for z in zs] + [(x, -YB, ZSD)], C['inner'], (s_, 0, 0))
    for x in (5.5, 6.6): A.poly([(x, -(hbz(x, 4.15) + 0.015), 4.0), (x + 0.45, -(hbz(x + 0.45, 4.15) + 0.015), 4.0), (x + 0.45, -(hbz(x + 0.45, 4.15) + 0.015), 4.3), (x, -(hbz(x, 4.15) + 0.015), 4.3)], C['white'], (0, -1, 0))
    vent = lambda x0, x1, z0, z1, sg, m: A.poly([(x, sg * (hbz(x, z) + 0.015), z) for x, z in ((x0, z0), (x1, z0), (x1, z1), (x0, z1))], m, (0, sg, 0))
    for x in (1.8, 2.6, 5.9):
        for sg in (1, -1):
            if sg < 0 and OP0 - 0.2 < x < OP1: continue
            vent(x, x + 0.5, 4.02, 4.35, sg, C['inner'])
    if fine:
        # rails round the shelter deck and the foredeck, on the bulwark top
        n = 40; xs_ = [XA + 0.1 + (XF - 0.6 - XA - 0.1) * k / n for k in range(n + 1)]
        for sg in (1, -1):
            pts = [(x, sg * (hbz(x, z_top(x)) - 0.04), z_top(x)) for x in xs_]
            for p in pts[::2]: acyl(A, p, (p[0], p[1], p[2] + 0.95), 0.025, lambda z: C['white'], seg=5)
            for h in (0.5, 0.95):
                for a, b in zip(pts, pts[1:]): acyl(A, (a[0], a[1], a[2] + h), (b[0], b[1], b[2] + h), 0.022, lambda z: C['white'], seg=5, cap=False)
        y = hbz(XA + 0.1, z_top(XA)) - 0.04
        for h in (0.5, 0.95): acyl(A, (XA + 0.1, -y, z_top(XA) + h), (XA + 0.1, y, z_top(XA) + h), 0.022, lambda z: C['white'], seg=5, cap=False)
    return [A.done(25)]


def underwater(fine=True):
    objs = [box('keel', 0.4, 12.6, -0.12, 0.12, 0.0, 0.9, C['af'])]
    objs.append(loft_rings('forefootkeel', [[(12.6, sy * 0.12, 0.0), (12.6, sy * 0.12, 0.9), (13.4, sy * 0.08, 1.45), (13.0, sy * 0.1, 0.0)] for sy in (1, -1)], C['af']))
    zc = 1.15
    objs.append(cyl('hub', (1.15, 0, zc), (1.75, 0, zc), 0.2, C['prop'], 12, r1=0.15))
    objs.append(cyl('shaft', (1.75, 0, zc), (2.6, 0, zc), 0.1, C['steel'], 10))
    for k in range(4):
        a = 2 * math.pi * k / 4 + 0.5; e = (0, math.cos(a), math.sin(a)); t = (0, -math.sin(a), math.cos(a))
        bl = [(1.35 + 0.12 * f, (0.18 + 0.52 * r) * e[1] + t[1] * w, zc + (0.18 + 0.52 * r) * e[2] + t[2] * w)
              for r, w, f in ((0, -0.14, 0), (0.5, -0.2, 0.4), (1.0, -0.1, 1.0), (1.0, 0.1, 1.0), (0.5, 0.19, -0.4), (0, 0.12, 0))]
        objs.append(loft_rings('blade%d' % k, [[(p[0] - 0.02, p[1], p[2]) for p in bl], [(p[0] + 0.02, p[1], p[2]) for p in bl]], C['prop']))
    rud = [(0.95, 2.3), (0.15, 2.3), (0.08, 2.1), (0.08, 0.15), (0.15, 0.05), (0.95, 0.05)]
    w = lambda x: 0.08 * max(0.35, 1 - abs(x - 0.5) / 0.5)
    objs.append(loft_rings('rudder', [[(x, w(x), z) for x, z in rud], [(x, -w(x), z) for x, z in rud]], C['af']))
    objs.append(box('sole', 0.1, 0.45, -0.08, 0.08, 0.0, 0.08, C['af']))
    return objs


# ---------- the wheelhouse forward on the shelter, its mast; aft the crane and the mizzen with its sail ----------
WX0, WX1, WY = 8.6, 12.7, 2.35
WS, WH, WR = 6.6, 7.45, 8.0

def gear(fine=True):
    A = Acc('gear'); G = Acc('glass'); w = C['white']; sg_ = 16 if fine else 8
    # the wheelhouse: the front in three facets leaning out, windows all round, a visor
    oc = [(WX0, -WY), (WX1 - 0.9, -WY), (WX1, -WY + 0.9), (WX1, WY - 0.9), (WX1 - 0.9, WY), (WX0, WY)]
    lean = lambda p, z: (p[0] + (0.45 * (z - ZSD) / (WR - ZSD) if p[0] > WX1 - 0.91 else 0.0), p[1], z)
    for i in range(len(oc)):
        a, b = oc[i], oc[(i + 1) % len(oc)]; nrm = (b[1] - a[1], -(b[0] - a[0]), 0)
        A.poly([lean(a, ZSD), lean(b, ZSD), lean(b, WS), lean(a, WS)], w, nrm)
        A.poly([lean(a, WH), lean(b, WH), lean(b, WR), lean(a, WR)], w, nrm)
        if a[0] == WX0 and b[0] == WX0:
            A.poly([lean(a, WS), lean(b, WS), lean(b, WH), lean(a, WH)], w, nrm); continue
        G.poly([lean(a, WS), lean(b, WS), lean(b, WH), lean(a, WH)], C['glass'], nrm)
        L = math.hypot(b[0] - a[0], b[1] - a[1]); k = max(1, int(L / 0.9))
        for j in range(k + 1):
            t = j / k; p = (a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t); beam(A, lean(p, WS), lean(p, WH), 0.07, 0.07, w)
    io = [(x + (0.15 if x == WX0 else -0.15), y * 0.94) for x, y in oc]
    for i in range(len(io)):
        a, b = io[i], io[(i + 1) % len(io)]; A.poly([(a[0], a[1], ZSD), (b[0], b[1], ZSD), (b[0], b[1], WR), (a[0], a[1], WR)], C['dark'], (-(b[1] - a[1]), b[0] - a[0], 0))
    ro = [(WX0 - 0.2, -WY - 0.15), (WX1 - 0.7, -WY - 0.15), (WX1 + 0.75, -WY + 0.8), (WX1 + 0.75, WY - 0.8), (WX1 - 0.7, WY + 0.15), (WX0 - 0.2, WY + 0.15)]
    A.poly([(x, y, WR) for x, y in ro], C['roof'], (0, 0, -1)); A.poly([(x, y, WR + 0.18) for x, y in ro], C['roof'], (0, 0, 1))
    for i in range(len(ro)):
        a, b = ro[i], ro[(i + 1) % len(ro)]; A.poly([(a[0], a[1], WR), (b[0], b[1], WR), (b[0], b[1], WR + 0.18), (a[0], a[1], WR + 0.18)], w, (b[1] - a[1], -(b[0] - a[0]), 0))
        if fine: acyl(A, (a[0], a[1], WR + 0.95), (b[0], b[1], WR + 0.95), 0.022, lambda z: w, seg=5, cap=False)
    if fine:
        for x, y in ro: acyl(A, (x, y, WR + 0.18), (x, y, WR + 0.95), 0.022, lambda z: w, seg=5)
    for sg in (1, -1): abox(A, 11.6, 12.0, sg * (WY + 0.2) - 0.07, sg * (WY + 0.2) + 0.07, WR - 0.3, WR - 0.08, C['dark'])
    # the mast on the roof: the tower, the radar bar, a yard with lights, the pole; a GPS dome and the searchlights
    acyl(A, (10.6, 0, WR + 0.18), (10.6, 0, 10.4), 0.16, lambda z: w, seg=10, r1=0.11)
    abox(A, 10.3, 10.9, -0.6, 0.6, 9.15, 9.25, w); abox(A, 10.5, 10.7, -0.08, 0.08, 9.25, 9.45, C['dark']); abox(A, 10.0, 11.2, -0.07, 0.07, 9.45, 9.55, C['dark'])
    abox(A, 10.5, 10.7, -1.0, 1.0, 10.3, 10.38, w)
    acyl(A, (10.6, 0, 10.4), (10.6, 0, 12.6), 0.05, lambda z: w, seg=6)
    for y in (-0.9, 0.9): acyl(A, (10.6, y, 10.38), (10.6, y, 11.4), 0.015, lambda z: w, seg=4)
    acyl(A, (9.5, 1.3, WR + 0.18), (9.5, 1.3, 9.6), 0.04, lambda z: w, seg=6); acyl(A, (9.5, 1.3, 9.6), (9.5, 1.3, 9.75), 0.17, lambda z: w, seg=12, r1=0.12)
    for y in (-1.4, 1.4): acyl(A, (WX1, y, WR + 0.18), (WX1 + 0.25, y, WR + 0.45), 0.13, lambda z: C['steel'], seg=10)
    # the red knuckle crane on the shelter deck aft, its boom folded up
    acyl(A, (3.2, 1.6, ZSD), (3.2, 1.6, ZSD + 1.3), 0.2, lambda z: C['hull'], seg=sg_)
    beam(A, (3.2, 1.6, ZSD + 1.3), (3.5, 1.6, ZSD + 2.9), 0.24, 0.26, C['hull']); beam(A, (3.5, 1.6, ZSD + 2.9), (4.1, 1.6, ZSD + 1.6), 0.2, 0.22, C['hull'])
    # the mizzen at the stern, its yard, the boom out over the transom, the red steadying sail between them
    acyl(A, (0.55, 0, ZSD), (0.55, 0, 12.2), 0.09, lambda z: w, seg=10, r1=0.06)
    acyl(A, (0.55, 0, 6.6), (-2.0, 0, 6.6), 0.05, lambda z: w, seg=6)
    acyl(A, (0.55, 0, 11.2), (-1.5, 0, 11.9), 0.04, lambda z: w, seg=6)
    for sg in (1, -1): A.poly([(0.5, sg * 0.01, 6.75), (-1.75, sg * 0.01, 6.75), (-1.45, sg * 0.01, 11.75), (0.5, sg * 0.01, 11.1)], C['sail'], (0, sg, 0))
    acyl(A, (0.55, 0, 12.2), (-0.6, 0, 12.0), 0.012, lambda z: C['dark'], seg=4)
    acyl(A, (0.55, 0, 12.2), (0.55, 0, 12.35), 0.22, lambda z: w, seg=12)
    # life rings on the shelter rail, the anchor in the bow
    for x, sg in ((6.4, 1), (2.0, -1)):
        y = sg * (hbz(x, z_top(x)) + 0.03); acyl(A, (x, y, z_top(x) + 0.5), (x, y + sg * 0.1, z_top(x) + 0.5), 0.3, lambda z: C['orange'], seg=14)
    for sg in (1, -1):
        x = 13.4; y = hbz(x, 5.0) + 0.02
        A.poly([(x - 0.25, sg * y, 4.75), (x + 0.25, sg * y, 4.85), (x + 0.25, sg * y, 5.25), (x - 0.25, sg * y, 5.15)], C['dark'], (0, sg, 0))
    # the windlass on the foredeck
    abox(A, 13.0, 13.6, -0.45, 0.45, ZSD, ZSD + 0.35, C['dark'])
    for sg in (1, -1): acyl(A, (13.3, sg * 0.35, ZSD + 0.35), (13.3, sg * 0.7, ZSD + 0.35), 0.18, lambda z: C['steel'], seg=12)
    return [A.done(30)], [G.done(30)]


def build(fine=True):
    solids = build_hull(fine) + decks(fine) + underwater(fine)
    o, g = gear(fine); solids += o
    return [s for s in solids if s], [x for x in g if x]


def to_game(p): return (-p[1], p[2] - WL, -(p[0] - XM))
def to_game_n(n): return (-n[1], n[2], -n[0])

def anchors():
    G = lambda x, y, z: [round(v, 3) for v in to_game((x, y, z))]
    return {'eye': G(12.0, -0.6, ZSD + 1.7), 'skipperAt': G(11.7, -0.6, ZSD), 'hp': -0.08, 'fov': 58,
            'crewSpots': [G(5.4, -2.3, ZMD) + [1.57], G(6.9, -2.0, ZMD) + [1.57], G(2.6, 0.0, ZSD) + [3.14], G(13.6, 0.4, ZSD) + [0.0]],
            'lights': [[G(10.6, 0, 12.4), [1, 0.95, 0.85]], [G(11.8, WY + 0.2, WR - 0.2), [1, 0.12, 0.1]], [G(11.8, -WY - 0.2, WR - 0.2), [0.1, 1, 0.35]],
                       [G(XA + 0.2, 0, z_top(XA) + 0.9), [1, 0.95, 0.85]], [G(0.55, 0, 12.0), [1, 0.95, 0.85]]],
            # the working deck under the shelter: the gear comes in over the red bulwark through the open hauling station on the starboard side
            'deck': {'y': round(ZMD - WL, 3), 'z': round(-(6.2 - XM), 3)}, 'gw': round(z_red(6.2) - WL, 3),
            'stern': round(XM - XA, 3), 'bow': round(-(XF - XM), 3), 'side': HB, 'beam': 6.6, 'pl': 6.0, 'rl': 2.5, 'open': False, 'hand': False,
            'pole': G(XA + 0.2, 0, z_top(XA) + 1.5), 'hauler': G(7.2, -(hbz(7.2, z_red(7.2)) - 0.35), z_red(7.2) + 0.3), 'filler': G(9.0, HB, ZSD + 0.3)}


SHOTS = [('bow3q', (28.0, -17.0, 6.5), (7.5, 0, 4.5), 35), ('stern3q', (-10.0, -12.0, 8.0), (6.0, 0, 5.0), 35), ('side', (7.5, -31, 5.0), (7.5, 0, 6.0), 35),
         ('above', (22.0, 14.0, 18.0), (7.5, 0, 4.0), 35), ('haul', (9.0, -8.0, 5.0), (6.0, -2.5, 4.4), 35)]

def main():
    os.makedirs(OUT, exist_ok=True)
    reset(); colours()
    solids, glass = build(True)
    join(solids, 'BOAT0'); join(glass, 'GLASS0')
    if 'fast' not in sys.argv: beauty(OUT, 'k15', WL, SHOTS)
    ex = {'frame': 'kystfiske: x starboard, y up from the waterline, z aft; metres', 'type': 'kyst15', 'name': 'Coastal vessel 14.99 m',
          'len': 14.99, 'beam': 6.6, 'draft': 3.0, 'anchors': anchors()}
    export_boat(build, to_game, to_game_n, OUT, 'kyst15.glb', os.path.join(ROOT, 'src', 'data', 'boat-kyst15.b64'), ex,
                side=(os.path.join(ROOT, 'src', 'data', 'boat-kyst15-side.b64'), 7.0, 5.0, 19.0), dry='dry' in sys.argv)


if __name__ == '__main__':
    main()
