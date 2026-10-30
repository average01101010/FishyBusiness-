"""The coastal vessel (kyst15), a modern 14.99 m Norwegian coastal boat, built in Blender after the pictures Jonas showed on 06.10.2026
(a red and white 15 m boat from the bow, the side and the quarter). The game's size stands (14.99 x 6.6 m, 3.0 m draft); the pictures
give the type: a deep red hull with a white rubbing strake and boot top, the white shelter deck (baksdekk) over the working deck with
its open hauling station on the starboard side, the wheelhouse forward on the shelter with raked windows and a tall mast on its roof,
the white bulwark round the foredeck rising to a raked stem over a round forefoot, the red knuckle crane aft, and the mizzen at the
stern with its red steadying sail and the boom over the transom. Exterior only (CLAUDE.md). The crane, the open-array radar, the
liferafts and the lifebuoys are the game's deck kit (tools/deck), drawn at the places in anchors.kit (the user's wish 19.10.2026).

    pip install bpy==4.5.4
    python3 tools/boats/kyst15.py            -> src/data/boat-kyst15.b64 (+ the side picture), renders in tools/boats/out/
    python3 tools/boats/kyst15.py fast dry   -> no renders to look at, and the GLB only in tools/boats/out

Frame: x forward from the transom, y to port, z up from the bottom of the keel; the waterline is z = 2.75."""
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy
from bpyutil import *
import fittings as F

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
    C['white'] = mat('house', (0.92, 0.92, 0.90), 0.5, zone=3)      # the white upper works, the shelter and the wheelhouse: paint zone 3
    C['strake'] = mat('strake', (0.92, 0.92, 0.90), 0.5, zone=2)    # the boot top and the rubbing strake: zone 2 (the stripe)
    C['inner'] = mat('inner', (0.82, 0.82, 0.80), 0.3)
    C['deck'] = mat('deck', (0.42, 0.44, 0.44), 0.12, zone=4)
    C['roof'] = mat('roof', (0.80, 0.80, 0.78), 0.3, zone=3)
    C['lampR'] = mat('lampR', (0.85, 0.08, 0.06), 0.7); C['lampG'] = mat('lampG', (0.08, 0.75, 0.30), 0.7); C['lampW'] = mat('lampW', (0.95, 0.93, 0.85), 0.7)
    C['seat'] = mat('seat', (0.16, 0.17, 0.20), 0.3); C['screen'] = mat('screen', (0.06, 0.10, 0.14), 0.8)
    C['steel'] = mat('steel', (0.66, 0.68, 0.70), 0.75, metal=0.7)
    C['dark'] = mat('dark', (0.12, 0.13, 0.14), 0.25)
    C['black'] = mat('black', (0.05, 0.05, 0.06), 0.35)
    C['glass'] = mat('glass', (0.05, 0.08, 0.11), 0.95)
    C['prop'] = mat('bronze', (0.70, 0.52, 0.27), 0.8, metal=0.9)
    C['zinc'] = mat('zinc', (0.55, 0.57, 0.58), 0.35, metal=0.6)
    C['orange'] = mat('orange', (0.95, 0.38, 0.06), 0.45)
    C['sail'] = mat('sail', (0.62, 0.11, 0.08), 0.15); C['sailedge'] = mat('sailedge', (0.42, 0.07, 0.05), 0.2); C['sailseam'] = mat('sailseam', (0.53, 0.09, 0.07), 0.15)
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
    for m, c in zip(n, ('af', 'strake', 'hull', 'strake', 'hull', 'white')):
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
SW0, SW1, SWY0, SWY1 = 5.0, 7.0, -1.6, -0.95      # the stairwell in the shelter deck over the hauling station's companion ladder
TABLE = (5.8, 6.6, -2.8, -2.2)                  # the gutting table in the hauling station, by the bulwark

def door(A, axis, at, u0, u1, z0, h, face=1, hinge=1):
    """a door in a wall (B4): the plane axis = at ('x' or 'y'), the opening from u0 to u1 along the other axis, the sill at z0, h tall;
    the leaf stands out on the side face (+1/-1 along the axis) and hangs on the jamb at the hinge end (+1 the high end of u). A frame
    with jambs and a head, a steel sill, a porthole and a handle; the leaf is part of the house, the anchor carries the hinge."""
    w = C['white']; lo, hi = min(u0, u1), max(u0, u1); f = face
    def B(a0, a1, u_0, u_1, z_0, z_1, m):       # a box across the wall plane from a0 to a1 (along the axis), u_0..u_1 along the other
        if axis == 'x': abox(A, min(a0, a1), max(a0, a1), u_0, u_1, z_0, z_1, m)
        else: abox(A, u_0, u_1, min(a0, a1), max(a0, a1), z_0, z_1, m)
    B(at - 0.02 * f, at + 0.06 * f, lo - 0.05, lo, z0, z0 + h + 0.08, w); B(at - 0.02 * f, at + 0.06 * f, hi, hi + 0.05, z0, z0 + h + 0.08, w)
    B(at - 0.02 * f, at + 0.06 * f, lo - 0.05, hi + 0.05, z0 + h, z0 + h + 0.08, w)
    B(at - 0.02 * f, at + 0.07 * f, lo - 0.05, hi + 0.05, z0, z0 + 0.12, C['steel'])
    B(at + 0.005 * f, at + 0.045 * f, lo + 0.01, hi - 0.01, z0 + 0.12, z0 + h - 0.01, w)
    cu = (lo + hi) / 2; B(at + 0.045 * f, at + 0.055 * f, cu - 0.16, cu + 0.16, z0 + 1.13, z0 + 1.52, C['dark'])
    B(at + 0.055 * f, at + 0.06 * f, cu - 0.13, cu + 0.13, z0 + 1.16, z0 + 1.49, C['glass'])
    hu = lo + 0.12 if hinge > 0 else hi - 0.12
    B(at + 0.06 * f, at + 0.09 * f, hu - 0.012, hu + 0.012, z0 + 1.0, z0 + 1.12, C['steel'])

def decks(fine=True):
    A = Acc('decks'); step = 0.4 if fine else 1.5
    xs = sorted(set([XA + 0.05, SW0, SW1] + [XA + 0.3 + step * k for k in range(int(XF / step) + 2) if XA + 0.3 + step * k < XF - 0.3] + [XF - 0.3]))
    for x0, x1 in zip(xs, xs[1:]):
        ya, yb = hbz(x0, ZSD) - 0.05, hbz(x1, ZSD) - 0.05
        ta, tb = z_top(x0), z_top(x1); ea, eb = hbz(x0, ta), hbz(x1, tb)
        if x0 >= SW0 - 1e-6 and x1 <= SW1 + 1e-6:        # the stairwell: the deck in two parts either side of the opening
            A.poly([(x0, -ya, ZSD), (x1, -yb, ZSD), (x1, SWY0, ZSD), (x0, SWY0, ZSD)], C['deck'], (0, 0, 1))
            A.poly([(x0, SWY1, ZSD), (x1, SWY1, ZSD), (x1, yb, ZSD), (x0, ya, ZSD)], C['deck'], (0, 0, 1))
        else: A.poly([(x0, -ya, ZSD), (x1, -yb, ZSD), (x1, yb, ZSD), (x0, ya, ZSD)], C['deck'], (0, 0, 1))
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
        yi = SWY0 if SW0 - 1e-6 <= xa and xb <= SW1 + 1e-6 else -YB       # the ceiling stops at the stairwell
        A.poly([(xa, -(hbz(xa, ZSD) - 0.02), ZSD - 0.03), (xb, -(hbz(xb, ZSD) - 0.02), ZSD - 0.03), (xb, yi, ZSD - 0.03), (xa, yi, ZSD - 0.03)], C['white'], (0, 0, -1))
    A.poly([(OP0, -YB, ZMD), (OP1, -YB, ZMD), (OP1, -YB, ZSD), (OP0, -YB, ZSD)], C['inner'], (0, -1, 0))
    # the companion ladder from the hauling station up to the shelter deck, along the inboard wall, and the coaming round its well
    n = 9; run = (SW1 - 0.05 - (SW0 + 0.05)) / n; rise = (ZSD - ZMD) / n      # 24 cm risers: under the deck map's body band (DM_BODY 0.25), so each step is a floor the crew can take
    for k in range(n): abox(A, SW0 + 0.05 + run * k, SW0 + 0.05 + run * (k + 1), SWY0 + 0.05, SWY1 - 0.05, ZMD, ZMD + rise * (k + 1), C['deck'])
    abox(A, SW0 + 0.05, SW1 - 0.05, SWY0 + 0.05, SWY0 + 0.09, ZMD, ZSD, C['inner'])                      # the ladder's outboard cheek
    abox(A, SW0 - 0.06, SW1 + 0.06, SWY0 - 0.06, SWY0, ZSD, ZSD + 0.28, C['white']); abox(A, SW0 - 0.06, SW0, SWY0 - 0.06, SWY1 + 0.06, ZSD, ZSD + 0.28, C['white'])
    abox(A, SW0 - 0.06, SW1 + 0.06, SWY1, SWY1 + 0.06, ZSD, ZSD + 0.28, C['white'])
    for x in (SW0, SW1): acyl(A, (x, SWY0 - 0.03, ZSD + 0.28), (x, SWY0 - 0.03, ZSD + 1.0), 0.02, lambda z: C['steel'], seg=5)
    acyl(A, (SW0, SWY0 - 0.03, ZSD + 1.0), (SW1, SWY0 - 0.03, ZSD + 1.0), 0.02, lambda z: C['steel'], seg=5, cap=False)
    # the doors of the hauling station (B4): into the enclosed deck through the inboard wall forward of the ladder, and through the aft wall
    door(A, 'y', -YB, SW1 + 0.1, SW1 + 0.8, ZMD, 1.9, face=-1, hinge=+1)
    door(A, 'x', OP0, -2.3, -1.6, ZMD, 1.9, face=+1, hinge=-1)
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


def surf(x, z, sg, off=0.0):
    """the hull's outside at (x, z) on side sg (1 port): the point, its outward normal, and the direction along the hull forward"""
    p = lambda xx, zz: V((xx, sg * (hbz(xx, zz) + off), zz))
    tx = p(x + 0.1, z) - p(x - 0.1, z) if x > 0.1 else p(x + 0.2, z) - p(x, z); tz = p(x, z + 0.1) - p(x, z - 0.1); n = tx.cross(tz)
    if n.y * sg < 0: n = -n
    return p(x, z), n.normalized(), tx.normalized()


def stern(fine=True):
    """the transom (M4: it ended in knife-edge corners on a bare face): the corners faired round with a bar in the hull's bands, the
    rubber D-fender across it at the rubbing strake, the panama chocks in its top, the rescue ladder to starboard (SIK-09)"""
    A = Acc('stern'); zt = z_top(XA)
    def band(z):
        if z < WL - 0.08: return C['af']
        if z < WL + 0.12: return C['strake']
        if abs(z - Z_RUB) < 0.1: return C['strake']
        return C['hull'] if z < z_red(XA) else C['white']
    for sg in (1, -1):
        zs = [z_low(XA) + 0.05] + [WL - 0.08, WL + 0.12, Z_RUB - 0.1, Z_RUB + 0.1, z_red(XA)] + [zt - 0.02]
        for za, zb in zip(zs, zs[1:]):
            pts = [(XA + 0.05, sg * (hbz(XA + 0.05, za + (zb - za) * i / 3) - 0.05), za + (zb - za) * i / 3) for i in range(4)]
            F.pipe(A, pts, 0.085, band((za + zb) / 2), seg=8)
    if fine:
        yf = hbz(XA, Z_RUB) - 0.12; acyl(A, (XA - 0.04, -yf, Z_RUB), (XA - 0.04, yf, Z_RUB), 0.07, lambda z: C['black'], seg=8)
        for y in (-2.25, 2.25):
            abox(A, XA - 0.07, XA + 0.04, y - 0.22, y + 0.22, zt - 0.36, zt + 0.01, C['steel']); abox(A, XA - 0.08, XA + 0.05, y - 0.12, y + 0.12, zt - 0.28, zt - 0.1, C['black'])
        for k in range(8):
            z = WL + 0.25 + 0.3 * k; abox(A, XA - 0.07, XA - 0.02, -1.95, -1.6, z, z + 0.03, C['steel'])
        for y in (-1.97, -1.58): abox(A, XA - 0.07, XA - 0.02, y - 0.015, y + 0.015, WL + 0.15, WL + 2.5, C['steel'])
    return [A.done(30)]


def underwater(fine=True):
    # the keel as deadwood up to the hull all along (it hung free under the run aft, and the propeller turned through it; found
    # 30.10.2026), ending where the shaft comes out; the propeller turns in the aperture over the shoe that carries the rudder's heel
    xs = [2.2 + (12.6 - 2.2) * k / 16 for k in range(17)]
    top = [(x, z_low(x) + 0.15) for x in xs]; bot = [(x, 0.0) for x in reversed(xs)]
    objs = [loft_rings('keel', [[(x, sy * 0.12, z) for x, z in top + bot] for sy in (1, -1)], C['af'])]
    objs.append(box('shoe', 0.1, 2.25, -0.09, 0.09, 0.0, 0.12, C['af']))
    objs.append(loft_rings('forefootkeel', [[(12.6, sy * 0.12, 0.0), (12.6, sy * 0.12, 0.9), (13.4, sy * 0.08, 1.45), (13.0, sy * 0.1, 0.0)] for sy in (1, -1)], C['af']))
    # the fixed pitch propeller (FRM-01, fittings.py), the zinc anodes (FRM-04) and the bow thruster's tunnel (FRM-06)
    zc = 1.15; U = Acc('under')
    objs.append(cyl('shaft', (1.75, 0, zc), (2.6, 0, zc), 0.1, C['steel'], 10))
    F.propeller(U, (1.42, 0, zc), (1, 0, 0), 0.68, C['prop'], n=4, hub=0.28, cpp=False, m_hub=C['prop'], m_guard=C['af'], fine=fine)
    if fine:
        for sg in (1, -1):
            for z in (0.7, 1.6): F.anode(U, (0.5, sg * 0.082, z), (0, sg, 0), (1, 0, 0), C['zinc'], L=0.22, w=0.07, t=0.03, m_strap=C['steel'])
            for x in (3.5, 7.5): F.anode(U, (x, sg * 0.122, 0.45), (0, sg, 0), (1, 0, 0), C['zinc'], L=0.24, w=0.07, t=0.03, m_strap=C['steel'])
            p, n, tt = surf(12.0, 1.75, sg); F.thruster_tunnel(U, p, n, 0.22, C['dark'], C['af'], m_prop=C['prop'], fine=fine)
    objs.append(U.done(30))
    rud = [(0.95, 2.3), (0.15, 2.3), (0.08, 2.1), (0.08, 0.15), (0.15, 0.05), (0.95, 0.05)]
    w = lambda x: 0.08 * max(0.35, 1 - abs(x - 0.5) / 0.5)
    objs.append(loft_rings('rudder', [[(x, w(x), z) for x, z in rud], [(x, -w(x), z) for x, z in rud]], C['af']))
    objs.append(box('sole', 0.1, 0.45, -0.08, 0.08, 0.0, 0.08, C['af']))
    return objs


# ---------- the wheelhouse forward on the shelter, its mast; aft the crane and the mizzen with its sail ----------
WX0, WX1, WY = 8.6, 12.7, 2.35
WS, WH, WR = 6.6, 7.45, 8.0
RAD_X = 11.55               # the open array's pedestal on the mast's radar platform, forward of the tower

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
    lining(A, oc, io, ZSD, WS, WH, WR, lambda p, z, i: lean(p, z), C['dark'], lambda i: not (oc[i][0] == WX0 and oc[(i + 1) % len(oc)][0] == WX0))
    ro = [(WX0 - 0.2, -WY - 0.15), (WX1 - 0.7, -WY - 0.15), (WX1 + 0.75, -WY + 0.8), (WX1 + 0.75, WY - 0.8), (WX1 - 0.7, WY + 0.15), (WX0 - 0.2, WY + 0.15)]
    A.poly([(x, y, WR) for x, y in ro], C['roof'], (0, 0, -1)); A.poly([(x, y, WR + 0.18) for x, y in ro], C['roof'], (0, 0, 1))
    for i in range(len(ro)):
        a, b = ro[i], ro[(i + 1) % len(ro)]; A.poly([(a[0], a[1], WR), (b[0], b[1], WR), (b[0], b[1], WR + 0.18), (a[0], a[1], WR + 0.18)], w, (b[1] - a[1], -(b[0] - a[0]), 0))
        if fine: acyl(A, (a[0], a[1], WR + 0.95), (b[0], b[1], WR + 0.95), 0.022, lambda z: w, seg=5, cap=False)
    if fine:
        for x, y in ro: acyl(A, (x, y, WR + 0.18), (x, y, WR + 0.95), 0.022, lambda z: w, seg=5)
    for sg in (1, -1):
        abox(A, 11.6, 12.0, sg * (WY + 0.2) - 0.07, sg * (WY + 0.2) + 0.07, WR - 0.3, WR - 0.08, C['dark'])                               # the side lights' housings
        y0 = sg * (WY + 0.27); abox(A, 11.64, 11.96, min(y0, y0 + sg * 0.015), max(y0, y0 + sg * 0.015), WR - 0.27, WR - 0.11, C['lampR' if sg > 0 else 'lampG'])
    # the wheelhouse inside (B5): the console under the front windows, three screens, the wheel, the skipper's chair, a bench to port
    abox(A, 11.75, 12.3, -1.6, 1.6, ZSD, ZSD + 0.95, C['inner'])
    for y0 in (-1.3, -0.6, 0.4):
        A.poly([(12.05, y0, ZSD + 1.0), (12.05, y0 + 0.55, ZSD + 1.0), (11.97, y0 + 0.55, ZSD + 1.38), (11.97, y0, ZSD + 1.38)], C['screen'], (-1, 0, 0.25))
        abox(A, 11.97, 12.07, y0 - 0.02, y0 + 0.57, ZSD + 0.98, ZSD + 1.4, C['dark'])
    acyl(A, (11.75, -0.6, ZSD + 1.05), (11.6, -0.6, ZSD + 1.12), 0.03, lambda z: C['steel'], seg=6)
    atorus(A, (11.58, -0.6, ZSD + 1.13), (1, 0, 0.45), 0.2, 0.018, lambda a: C['black'], 16, 6)
    acyl(A, (11.2, -0.6, ZSD), (11.2, -0.6, ZSD + 0.55), 0.05, lambda z: C['steel'], seg=8)
    abox(A, 10.98, 11.45, -0.83, -0.37, ZSD + 0.55, ZSD + 0.65, C['seat']); abox(A, 10.93, 11.01, -0.83, -0.37, ZSD + 0.65, ZSD + 1.2, C['seat'])
    abox(A, 9.2, 10.6, 1.5, 2.1, ZSD + 0.42, ZSD + 0.5, C['seat']); abox(A, 9.2, 10.6, 2.03, 2.1, ZSD + 0.5, ZSD + 0.95, C['seat']); abox(A, 9.2, 10.6, 1.5, 2.1, ZSD, ZSD + 0.42, C['inner'])
    door(A, 'x', WX0, -1.75, -1.05, ZSD, 1.95, face=-1, hinge=-1)                                   # the wheelhouse door aft to starboard
    # the masthead lantern on the pole, the fishing lights (red over white) under it; the floodlights on the roof's aft edge
    acyl(A, (10.6, 0, 12.25), (10.6, 0, 12.42), 0.07, lambda z: C['lampW'], seg=10); acyl(A, (10.6, 0, 12.42), (10.6, 0, 12.46), 0.08, lambda z: C['dark'], seg=10)
    acyl(A, (10.6, 0, 11.25), (10.6, 0, 11.42), 0.085, lambda z: C['lampR'], seg=10); acyl(A, (10.6, 0, 10.75), (10.6, 0, 10.92), 0.085, lambda z: C['lampW'], seg=10)
    for sg in (1, -1):
        abox(A, WX0 - 0.12, WX0 - 0.08, sg * 1.3 - 0.02, sg * 1.3 + 0.02, WR + 0.18, WR + 0.4, C['steel'])
        abox(A, WX0 - 0.25, WX0 - 0.03, sg * 1.3 - 0.1, sg * 1.3 + 0.1, WR + 0.38, WR + 0.54, C['dark']); abox(A, WX0 - 0.26, WX0 - 0.25, sg * 1.3 - 0.08, sg * 1.3 + 0.08, WR + 0.4, WR + 0.52, C['lampW'])
    # the exhaust beside the mast tower (the liferafts, the buoys, the radar and the crane are the game's deck kit, drawn at anchors.kit:
    # no gear that can be bought or that the rules decide is modelled into the boat, the user's wish 19.10.2026)
    acyl(A, (10.25, 0.55, WR + 0.18), (10.25, 0.55, 9.3), 0.09, lambda z: C['black'], seg=8); acyl(A, (10.25, 0.55, 9.3), (10.25, 0.55, 9.4), 0.11, lambda z: C['black'], seg=8)
    # the flag staff and the stern light at the transom, bollards on the shelter deck's cap, the gutting table in the hauling station
    zt = z_top(XA); acyl(A, (XA + 0.2, 0, zt - 0.1), (XA + 0.2, 0, zt + 1.5), 0.02, lambda z: w, seg=6); abox(A, XA + 0.15, XA + 0.25, -0.04, 0.04, zt, zt + 0.12, C['steel'])
    acyl(A, (XA + 0.2, 0.5, zt + 0.1), (XA + 0.2, 0.5, zt + 0.85), 0.015, lambda z: C['steel'], seg=5); acyl(A, (XA + 0.2, 0.5, zt + 0.85), (XA + 0.2, 0.5, zt + 0.97), 0.04, lambda z: C['lampW'], seg=8)
    acyl(A, (XA + 0.2, 0.5, zt + 0.97), (XA + 0.2, 0.5, zt + 1.0), 0.047, lambda z: C['dark'], seg=8)
    for x in (0.7, 4.0, 8.2, 13.0):
        for sg in (1, -1):
            y = sg * (hbz(x, z_top(x)) - 0.16); acyl(A, (x, y, z_top(x)), (x, y, z_top(x) + 0.3), 0.06, lambda z: C['steel'], seg=8); acyl(A, (x - 0.12, y, z_top(x) + 0.23), (x + 0.12, y, z_top(x) + 0.23), 0.025, lambda z: C['steel'], seg=6)
    x0, x1, y0, y1 = TABLE; zt2 = ZMD + 0.9
    abox(A, x0, x1, y0, y1, zt2 - 0.05, zt2, C['steel']); abox(A, x0, x1, y0 - 0.02, y0, zt2 - 0.05, zt2 + 0.12, C['steel'])
    for x, y in ((x0 + 0.05, y0 + 0.05), (x1 - 0.05, y0 + 0.05), (x0 + 0.05, y1 - 0.05), (x1 - 0.05, y1 - 0.05)): acyl(A, (x, y, ZMD), (x, y, zt2 - 0.05), 0.02, lambda z: C['steel'], seg=5)
    # the mast on the roof: the tower, the radar platform (a plate cantilevered forward of the tower on a strut, where the open array
    # the player buys turns clear of the mast: kit.radarA), a yard with lights, the pole; a GPS dome and the searchlights
    acyl(A, (10.6, 0, WR + 0.18), (10.6, 0, 10.4), 0.16, lambda z: w, seg=10, r1=0.11)
    abox(A, 10.3, RAD_X + 0.3, -0.36, 0.36, 9.15, 9.25, w); beam(A, (10.74, 0, 8.62), (RAD_X + 0.22, 0, 9.16), 0.09, 0.09, w)
    abox(A, 10.5, 10.7, -1.0, 1.0, 10.3, 10.38, w)
    acyl(A, (10.6, 0, 10.4), (10.6, 0, 12.6), 0.05, lambda z: w, seg=6)
    for y in (-0.9, 0.9): acyl(A, (10.6, y, 10.38), (10.6, y, 11.4), 0.015, lambda z: w, seg=4)
    acyl(A, (9.5, 1.3, WR + 0.18), (9.5, 1.3, 9.6), 0.04, lambda z: w, seg=6); acyl(A, (9.5, 1.3, 9.6), (9.5, 1.3, 9.75), 0.17, lambda z: w, seg=12, r1=0.12)
    for y in (-1.4, 1.4): acyl(A, (WX1, y, WR + 0.18), (WX1 + 0.25, y, WR + 0.45), 0.13, lambda z: C['steel'], seg=10)
    # the mizzen at the stern, its yard, the boom out over the transom, the red steadying sail between them
    acyl(A, (0.55, 0, ZSD), (0.55, 0, 12.2), 0.09, lambda z: w, seg=10, r1=0.06)
    acyl(A, (0.55, 0, 6.6), (-2.0, 0, 6.6), 0.05, lambda z: w, seg=6)
    acyl(A, (0.55, 0, 11.2), (-1.5, 0, 11.9), 0.04, lambda z: w, seg=6)
    F.sail(A, (0.5, 0, 6.75), (-1.75, 0, 6.75), (-1.45, 0, 11.75), (0.5, 0, 11.1), C['sail'], C['sailedge'], m_seam=C['sailseam'], belly=0.14, panels=6)
    acyl(A, (0.55, 0, 12.2), (-0.6, 0, 12.0), 0.012, lambda z: C['dark'], seg=4)
    acyl(A, (0.55, 0, 12.2), (0.55, 0, 12.35), 0.22, lambda z: w, seg=12)
    # the hawse pipes' mouths high in the bow, forward of the registration mark (tilbakemelding: the old plates sat on it; the anchors
    # are the game's own, stowed in them, bower()), each a dark recess following the hull with a steel rim, and the pipes' deck ends
    for sg in (1, -1):
        ring = [(14.25 + 0.20 * math.cos(2 * math.pi * k / 14), 5.25 + 0.17 * math.sin(2 * math.pi * k / 14)) for k in range(14)]
        A.poly([(x, sg * (hbz(x, z) + 0.02), z) for x, z in ring], C['dark'], (0, sg, 0))
        rim = [(x, sg * (hbz(x, z) + 0.035), z) for x, z in ring]
        for a, b in zip(rim, rim[1:] + rim[:1]): acyl(A, a, b, 0.022, lambda z: C['steel'], seg=6, cap=False)
        acyl(A, (13.75, sg * 0.42, ZSD), (13.75, sg * 0.42, ZSD + 0.06), 0.11, lambda z: C['steel'], seg=12)
    # the windlass on the foredeck
    abox(A, 13.0, 13.6, -0.45, 0.45, ZSD, ZSD + 0.35, C['dark'])
    for sg in (1, -1): acyl(A, (13.3, sg * 0.35, ZSD + 0.35), (13.3, sg * 0.7, ZSD + 0.35), 0.18, lambda z: C['steel'], seg=12)
    return [A.done(30)], [G.done(30)]


def build(fine=True):
    solids = build_hull(fine) + decks(fine) + underwater(fine) + stern(fine)
    o, g = gear(fine); solids += o
    return [s for s in solids if s], [x for x in g if x]


def to_game(p): return (-p[1], p[2] - WL, -(p[0] - XM))
def to_game_n(n): return (-n[1], n[2], -n[0])

def name_strips(G):
    """where the name is written (B12): on the white upper works forward over the red, both sides, and across the transom's white"""
    out = []
    for sg, xs in ((1, [13.5 - 1.4 * k / 12 for k in range(13)]), (-1, [12.1 + 1.4 * k / 12 for k in range(13)])):
        B = []; T = []
        for x in xs:
            for arr, z in ((B, 5.28), (T, 5.68)): arr.append(G(x, sg * (hbz(x, z) + 0.03), z))
        out.append([B, T])
    ys = [1.3 - 2.6 * k / 12 for k in range(13)]      # port to starboard: left to right seen from astern
    out.append([[G(XA - 0.02, y, 5.0) for y in ys], [G(XA - 0.02, y, 5.4) for y in ys]])
    return out

# the boat's own anchor (tools/deck/anker.py, drawn and let go by the game, view3d.js drawAnchor; Jonas 21.10.2026): its kind and mass,
# the fairlead where the rode leaves her (the bow roller's top, or the hawse pipe's mouth on the side), the hawse pipe's deck end, the
# windlass's gypsy the chain comes off, whether the game draws the chain on deck (deck), and the spare in the other hawse
def bower(G):
    hw = lambda sg: {'fair': G(14.25, sg * (hbz(14.25, 5.25) + 0.03), 5.25), 'pipe': G(13.75, sg * 0.42, ZSD + 0.05)}
    return dict(hw(-1), kind='hall', kg=120, gypsy=G(13.3, -0.55, ZSD + 0.53), side=1, deck=True, spare=hw(1))


def anchors():
    G = lambda x, y, z: [round(v, 3) for v in to_game((x, y, z))]
    return {'bower': bower(G), 'eye': G(12.0, -0.6, ZSD + 1.55), 'skipperAt': G(11.7, -0.6, ZSD), 'hp': -0.08, 'fov': 58,
            'crewSpots': [G(5.4, -2.3, ZMD) + [1.57], G(6.9, -2.0, ZMD) + [1.57], G(2.6, 0.0, ZSD) + [3.14], G(13.6, 0.4, ZSD) + [0.0]],
            'lights': [[G(10.6, 0, 12.34), [1, 0.95, 0.85], 'masthead'], [G(11.8, WY + 0.3, WR - 0.19), [1, 0.12, 0.1], 'port'], [G(11.8, -WY - 0.3, WR - 0.19), [0.1, 1, 0.35], 'stbd'],
                       [G(XA + 0.2, 0.5, z_top(XA) + 0.91), [1, 0.95, 0.85], 'stern']],
            # the doors (B4): the hauling station's door into the enclosed deck, its aft door, and the wheelhouse door aft to starboard
            'doors': [{'at': G(SW1 + 0.45, -0.92, ZMD), 'w': 0.7, 'h': 1.9, 'in': G(SW1 + 0.45, -0.2, ZMD), 'to': 'deck', 'hinge': 'fwd'},
                      {'at': G(OP0 + 0.03, -1.95, ZMD), 'w': 0.7, 'h': 1.9, 'in': G(OP0 - 0.8, -1.95, ZMD), 'to': 'deck', 'hinge': 'stbd'},
                      {'at': G(WX0 - 0.03, -1.4, ZSD), 'w': 0.7, 'h': 1.95, 'in': G(WX0 + 0.8, -1.4, ZSD), 'to': 'helm', 'hinge': 'stbd'}],
            'names': name_strips(G),
            'work': {'table': G((TABLE[0] + TABLE[1]) / 2, (TABLE[2] + TABLE[3]) / 2, ZMD), 'tub': G(5.0, -2.55, ZMD), 'own': True, 'top': round(ZMD + 0.9 - WL, 3)},
            'bunk': G(9.5, 1.0, ZMD + 0.6), 'stairs': [{'from': G(SW0 + 0.1, -1.27, ZMD), 'to': G(SW1 - 0.1, -1.27, ZSD)}],
            # the working deck under the shelter: the gear comes in over the red bulwark through the open hauling station on the starboard side
            'deck': {'y': round(ZMD - WL, 3), 'z': round(-(6.2 - XM), 3)}, 'gw': round(z_red(6.2) - WL, 3),
            'stern': round(XM - XA, 3), 'bow': round(-(XF - XM), 3), 'side': HB, 'beam': 6.6, 'pl': 6.0, 'rl': 2.5, 'open': False, 'hand': False,
            'pole': G(XA + 0.2, 0, z_top(XA) + 1.5), 'hauler': G(7.2, -(hbz(7.2, z_red(7.2)) - 0.35), z_red(7.2) + 0.3), 'filler': G(9.0, HB, ZSD + 0.3),
            'kit': kit(G)}


def kit(G):
    """the places of the deck kit (tools/deck, drawn by the game; the user's wish 19.10.2026), in the game's frame: two liferafts in
    cradles on the wheelhouse roof's after part, one a side by the edge so they float free; four buoys on the rails' stanchions, outboard,
    two a side; the open array on the mast's radar platform; the crane where the picture had it, on the shelter deck aft to port, its
    booms folded aft over a rest; the deck cargo on the shelter deck forward of it, between the centre walkway and the port one; the net
    tub and the line tubs on the shelter deck aft to starboard, over the hauling station (its floor has no room clear of the table, the
    bleeding tub, the hauler's man and the two doors), where the crane lands them"""
    r = lambda v: round(v, 3)
    def rail(x, sg):        # a buoy bracket on a rail stanchion's top, its +z outboard
        g = G(x, sg * (hbz(x, z_top(x)) - 0.04 + 0.022), z_top(x) + 0.95); return g + [r(-sg * math.pi / 2)]
    post = lambda j: XA + 0.1 + (XF - 0.6 - XA - 0.1) * 2 * j / 40          # the stanchions stand at every other rail point
    h = math.pi / 2
    return {'raft': [G(9.45, -1.95, WR + 0.18) + [r(h)], G(9.45, 1.95, WR + 0.18) + [r(h)]],
            'buoys': [rail(post(3), -1), rail(post(9), 1), rail(post(14), 1), rail(post(14), -1)],
            'radarA': G(RAD_X, 0, 9.25),
            'garn': {'at': G(4.0, -2.4, ZSD), 'ry': 0.0},
            'stamps': {'at': G(2.925, -2.125, ZSD), 'ry': 0.0},
            'cargo': [G(x, y, ZSD) + [0.0] for x, y in ((5.1, 1.6), (5.1, 0.7), (6.4, 1.6), (6.4, 0.7), (7.7, 1.6), (7.7, 0.7))],
            'crane': {'at': G(3.2, 1.6, ZSD), 'ry': r(math.pi), 's': 1.0, 'rest': G(1.1, 1.6, ZSD)}}


SHOTS = [('bow3q', (28.0, -17.0, 6.5), (7.5, 0, 4.5), 35), ('stern3q', (-10.0, -12.0, 8.0), (6.0, 0, 5.0), 35), ('side', (7.5, -31, 5.0), (7.5, 0, 6.0), 35),
         ('above', (22.0, 14.0, 18.0), (7.5, 0, 4.0), 35), ('haul', (9.0, -8.0, 5.0), (6.0, -2.5, 4.4), 35), ('stern', (-20.0, 0.5, 6.0), (5.0, 0, 5.0), 30),
         ('helm', (20.0, -7.0, 7.5), (11.5, -0.3, 6.6), 30), ('ladder', (3.0, -7.5, 7.0), (6.0, -1.3, 4.8), 40), ('under', (-6.0, -6.0, 1.2), (2.0, 0, 1.4), 35)]

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
