"""The autoliner (autoliner), a 45 m longliner, built in Blender from the general arrangement «45 m Longliner» (drawing 101-002, 1:100,
project 6161) that Jonas showed on 06.10.2026: length overall 45.38 m, between perpendiculars 41.05 m, breadth moulded 10.45 m, depth to
the main deck 4.75 m, the 2nd deck 7.15 m and the 3rd deck 9.55 m, frame spacing 0.60 m, accommodation for 16. The drawing is not in
the repository; the lines below were measured from Jonas' picture (47.46 px/m, frame 0 at the aft perpendicular): the waterline 3.3 m
over the base line, the forefoot's round nose at 42.7 m on the waterline, the stem hollowing to 41.1 m at 6.3 m up, the wheelhouse from 10.9 to 19.1 m
with its windows at 12.4-13.3 m and its roof at 14.05 m, the funnel at 6.0-9.6 m, the crane forward of the wheelhouse, the raked
foremast at 29.4-33.6 m and the hauling port on the starboard side at 20.7-23.5 m, where the line comes in to the hauler on the main
deck. The colours are ours: a navy hull to the 2nd deck, white above. Exterior only (CLAUDE.md).

    pip install bpy==4.5.4
    python3 tools/boats/al45.py            -> src/data/boat-al45.b64 (+ the side picture), renders in tools/boats/out/
    python3 tools/boats/al45.py fast dry   -> no renders to look at, and the GLB only in tools/boats/out

Frame: x forward from the aft perpendicular, y to port, z up from the base line; the waterline is z = 3.30."""
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy
from bpyutil import *

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE)); OUT = os.path.join(HERE, 'out')
WL = 3.30; XA = -2.00; XF = 43.40; XM = (XA + XF) / 2; HB = 5.225
D1, D2, D3 = 4.75, 7.15, 9.55
HP_X0, HP_X1 = 20.7, 23.5                       # the hauling port on the starboard side


# ---------- measured lines (metres) ----------
LOW = [(XA, 3.00), (-1.2, 2.55), (0.0, 2.10), (1.5, 1.55), (3.0, 0.90), (4.5, 0.25), (6.0, -0.12), (10.0, -0.25), (25.0, -0.05), (35.0, 0.15), (38.3, 0.40)]
def z_low(x): return interp(LOW, x)
# the stem traced off the drawing (z, x): the forefoot runs out full and round to its nose at the waterline, hollows in to 41.1 m at
# 6.3 m up, and flares out to the bulwark; there is no separate bulb
STEM = [(0.40, 38.3), (0.45, 38.9), (0.71, 40.5), (0.96, 41.4), (1.21, 41.9), (1.46, 42.23), (1.72, 42.44), (2.22, 42.67), (2.73, 42.72),
        (3.23, 42.6), (3.74, 42.36), (4.25, 42.04), (4.75, 41.68), (5.26, 41.34), (5.76, 41.13), (6.27, 41.07), (6.77, 41.13), (7.28, 41.3),
        (7.79, 41.58), (8.29, 41.87), (8.8, 42.21), (9.3, 42.61), (9.81, 43.03), (10.06, 43.24), (10.4, XF)]
def x_stem(z): return interp(STEM, z)
def z_top(x): return 10.4 + 0.0 * x
def z_deck(x): return D3 + 0.0 * x
HBD = [(XA, 5.05), (-1.0, 5.20), (0.0, 5.225), (30.0, 5.225), (33.0, 5.0), (36.0, 4.4), (38.0, 3.7), (40.0, 2.7), (41.5, 1.8), (42.6, 0.9), (XF, 0.0)]
HBW = [(XA, 4.40), (-1.0, 4.85), (1.5, 5.10), (5.0, 5.225), (26.0, 5.225)]
NX = [(XA, 2.2), (0.0, 2.4), (3.0, 3.2), (7.0, 5.0), (11.0, 6.2), (26.0, 6.2)]
X_ENT = 26.0
PW = [(0.0, 2.0), (2.0, 2.4), (WL, 2.8), (D2, 3.6), (D3, 4.2), (10.6, 4.5)]


def section_body(x, n=24):
    zl = z_low(x); zt = z_top(x); bw = interp(HBW, x); bd = interp(HBD, x); nn = interp(NX, x); pts = []
    if zl < WL - 0.02:
        for k in range(n + 1):
            th = (math.pi / 2) * k / n; c = math.cos(th); s = math.sin(th)
            pts.append((bw * (s ** (2 / nn) if s > 0 else 0.0), zl + (WL - zl) * (1 - (c ** (2 / nn) if c > 0 else 0.0))))
    else:
        pts.append((0.0, zl))
    for k in range(1, 11):
        z = WL + (zt - WL) * k / 10; pts.append((bw + (bd - bw) * min(1.0, (z - WL) / (D2 - WL)) ** 1.3, z))
    return pts

# The bow forward of X_ENT is a patch of rows, each running from a point (yk, zk) of the section at X_ENT forward to the stem: level
# above the waterline, riding up along the raked keel near the bottom, and closing in as y = yk (1 - (1 - s)^p) with s from 1 at X_ENT
# to 0 at the stem. The stem bends back on itself (the round forefoot, the hollow above it, the flare), which stations cut across
# would show as steps; rows that end on it follow it smoothly.
ZK0 = None
def bow_pt(yk, zk, x=None, s=None):
    global ZK0
    if ZK0 is None: ZK0 = z_low(X_ENT)
    t = max(0.0, min(1.0, (zk - 0.5) / 1.5)); w = 1 - t * t * (3 - 2 * t)
    xf = x_stem(zk + w * (STEM[0][0] - ZK0))
    if s is None: s = max(0.0, min(1.0, (xf - x) / (xf - X_ENT)))
    else: x = xf - s * (xf - X_ENT)
    z = zk + w * (z_low(x) - ZK0)
    return x, (yk * (1 - (1 - s) ** interp(PW, z)) if s > 0 else 0.0), z

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


# ---------- colours ----------
C = {}
def colours():
    C['af'] = mat('antifouling', (0.40, 0.09, 0.07), 0.15)
    C['boot'] = mat('boot', (0.05, 0.05, 0.06), 0.5, zone=2)
    C['hull'] = mat('alhull', (0.10, 0.18, 0.36), 0.55, zone=1)
    C['white'] = mat('white', (0.90, 0.91, 0.90), 0.5)
    C['inner'] = mat('inner', (0.80, 0.82, 0.81), 0.3)
    C['deck'] = mat('deck', (0.40, 0.44, 0.42), 0.12)
    C['roof'] = mat('roof', (0.78, 0.80, 0.79), 0.3)
    C['steel'] = mat('steel', (0.66, 0.68, 0.70), 0.75, metal=0.7)
    C['dark'] = mat('dark', (0.09, 0.10, 0.11), 0.25)
    C['black'] = mat('black', (0.06, 0.06, 0.07), 0.35)
    C['glass'] = mat('glass', (0.05, 0.08, 0.11), 0.95)
    C['prop'] = mat('bronze', (0.70, 0.52, 0.27), 0.8, metal=0.9)
    C['orange'] = mat('orange', (0.95, 0.38, 0.06), 0.45)
    C['yellow'] = mat('yellow', (0.92, 0.72, 0.10), 0.45)
    C['winch'] = mat('winch', (0.12, 0.28, 0.55), 0.5)

def band_mat(z):
    if z < WL - 0.10: return C['af']
    if z < WL + 0.30: return C['boot']
    if z < D2 + 0.02: return C['hull']
    return C['white']

def stations(fine=True):
    if fine:
        xs = [XA + 0.05 * i for i in range(5)] + [XA + 0.25 + 0.4 * i for i in range(16)] + [4.5 + 0.75 * i for i in range(30)] + \
             [27.0 + 0.4 * i for i in range(28)] + [38.2 + 0.2 * i for i in range(26)] + [XF - 0.05]
    else:
        xs = [XA, XA + 0.2, -1.0, 0.5, 2.5, 5.0, 9.0, 14.0, 20.0, 26.0, 30.0, 33.0, 36.0, 38.5, 40.0, 41.2, 42.2, 42.9, XF - 0.05]
    return sorted(set(round(x, 4) for x in xs if XA <= x < XF - 0.01))

OUTH = lambda c: (0, c.y, min(c.z, 5.0) - 5.0)

BANDS = lambda fine: [(WL - 0.10, 11 if fine else 3), (WL + 0.30, 2), (D2 + 0.02, 7 if fine else 2), (None, 4 if fine else 1)]

def hull_rows(sg, fine=True):
    rows = []
    for x in stations(fine):
        if x >= X_ENT: continue
        rows.append([(x, sg * y, z) for y, z in resample([(abs(y), z) for y, z in section(x, sg)], BANDS(fine))])
    base = resample(section_body(X_ENT, 48), BANDS(fine)); n = 44 if fine else 12
    for i in range(n + 1):
        s = (1 - i / n) ** 1.5
        rows.append([(x, sg * y, z) for x, y, z in (bow_pt(yk, zk, s=s) for yk, zk in base)])
    return rows

def build_hull(fine=True):
    objs = []; first = {}
    for sg, nm in ((1, 'p'), (-1, 's')):
        rows = hull_rows(sg, fine); first[sg] = rows[0]
        def mf(i, j, rows=rows):
            a = rows[i][j]; b = rows[i + 1][j + 1]; return band_mat((a[2] + b[2]) / 2)
        objs.append(grid('hull_' + nm, rows, mf, out=OUTH))
    T = [[q, p] for p, q in zip(first[1], first[-1])]
    objs.append(grid('transom', T, lambda i, j: band_mat((T[i][0][2] + T[i + 1][0][2]) / 2), angle=20, out=lambda c: (-1, 0, 0)))
    return objs


def decks(fine=True):
    A = Acc('decks'); xs = sorted(set([x for x in stations(fine) if x <= XF - 0.4] + [XF - 0.4]))
    for i in range(len(xs) - 1):
        x0, x1 = xs[i], xs[i + 1]; z0, z1 = z_deck(x0), z_deck(x1); y0, y1 = hbz(x0, z0) - 0.06, hbz(x1, z1) - 0.06
        if y0 < 0.05 and y1 < 0.05: continue
        A.poly([(x0, -y0, z0), (x1, -y1, z1), (x1, y1, z1), (x0, y0, z0)], C['deck'], (0, 0, 1))
        for sg in (1, -1):
            ta, tb = z_top(x0), z_top(x1)
            A.poly([(x0, sg * y0, z0), (x1, sg * y1, z1), (x1, sg * (hbz(x1, tb) - 0.06), tb), (x0, sg * (hbz(x0, ta) - 0.06), ta)], C['inner'], (0, -sg, 0))
            A.poly([(x0, sg * (hbz(x0, ta) - 0.06), ta), (x1, sg * (hbz(x1, tb) - 0.06), tb), (x1, sg * hbz(x1, tb), tb + 0.01), (x0, sg * hbz(x0, ta), ta + 0.01)], C['white'], (0, 0, 1))
    zd, zt = z_deck(XA), z_top(XA); y = hbz(XA, zt) - 0.06
    A.poly([(XA + 0.06, -y, zd), (XA + 0.06, y, zd), (XA + 0.06, y, zt), (XA + 0.06, -y, zt)], C['inner'], (1, 0, 0))
    abox(A, XA - 0.02, XA + 0.06, -y - 0.06, y + 0.06, zt, zt + 0.02, C['white'])
    # the railing on the bulwark, all round
    if fine:
        for sg in (1, -1):
            pts = [(x, sg * (hbz(x, z_top(x)) - 0.04), z_top(x)) for x in [XA + 0.3 + 1.4 * k for k in range(32) if XA + 0.3 + 1.4 * k < 42.4]]
            for p in pts: acyl(A, p, (p[0], p[1], p[2] + 0.75), 0.03, lambda z: C['white'], seg=6)
            for a, b in zip(pts, pts[1:]): acyl(A, (a[0], a[1], a[2] + 0.75), (b[0], b[1], b[2] + 0.75), 0.03, lambda z: C['white'], seg=6, cap=False)
    return [A.done(25)]


def underwater(fine=True):
    objs = []
    xs = [2.6 + (9.0 - 2.6) * k / 14 for k in range(15)]
    top = [(x, z_low(x) + 0.4) for x in xs]; bot = [(x, -0.35 + 0.015 * (x - 2.6) if x < 7.0 else min(z_low(x) - 0.02, -0.3)) for x in reversed(xs)]
    rings = [[(x, sy * (0.35 if x < 7.5 else 0.35 * (9.0 - x) / 1.5 + 0.02), z) for x, z in top + bot] for sy in (1, -1)]
    objs.append(loft_rings('skeg', rings, C['af']))
    objs.append(box('shoe', -1.35, 2.7, -0.15, 0.15, -0.45, -0.28, C['af']))
    zc = 1.0
    objs.append(cyl('hub', (0.9, 0, zc), (1.8, 0, zc), 0.32, C['prop'], 12, r1=0.24))
    objs.append(cyl('shaft', (1.8, 0, zc), (2.7, 0, zc), 0.15, C['steel'], 10))
    for k in range(4):
        a = 2 * math.pi * k / 4 + 0.5; e = (0, math.cos(a), math.sin(a)); t = (0, -math.sin(a), math.cos(a))
        bl = [(1.4 + 0.2 * f, (0.28 + 0.86 * r) * e[1] + t[1] * w, zc + (0.28 + 0.86 * r) * e[2] + t[2] * w)
              for r, w, f in ((0, -0.22, 0), (0.5, -0.32, 0.4), (1.0, -0.16, 1.0), (1.0, 0.16, 1.0), (0.5, 0.3, -0.4), (0, 0.2, 0))]
        objs.append(loft_rings('blade%d' % k, [[(p[0] - 0.03, p[1], p[2]) for p in bl], [(p[0] + 0.03, p[1], p[2]) for p in bl]], C['prop']))
    rud = [(-0.30, 2.55), (-1.35, 2.55), (-1.45, 2.3), (-1.45, -0.15), (-1.35, -0.28), (-0.30, -0.28), (-0.2, 0.1), (-0.2, 2.3)]
    w = lambda x: 0.2 * max(0.25, 1 - abs(x + 0.8) / 1.0)
    objs.append(loft_rings('rudder', [[(x, w(x), z) for x, z in rud], [(x, -w(x), z) for x, z in rud]], C['af']))
    return objs


# ---------- on deck: the funnel, the rescue boat, the cranes, the foremast and windlass; the hauling port and the setting chute ----------
def deck_gear(fine=True):
    A = Acc('gear'); w = C['white']; sg_ = 18 if fine else 8
    # the funnel aft of the wheelhouse: the aft face upright, the front raked, two exhausts
    fy0, fy1 = -0.3, 2.3
    P = [(6.0, D3), (9.6, D3), (9.6, 11.6), (7.9, 14.8), (6.0, 14.8)]
    for y, s in ((fy0, -1), (fy1, 1)): A.poly([(x, y, z) for x, z in P], w, (0, s, 0))
    for i in range(len(P)):
        a, b = P[i], P[(i + 1) % len(P)]; A.poly([(a[0], fy0, a[1]), (b[0], fy0, b[1]), (b[0], fy1, b[1]), (a[0], fy1, a[1])], w if i != 3 else C['black'], (b[1] - a[1], 0, -(b[0] - a[0])))
    for y in (0.4, 1.6): acyl(A, (7.0, y, 14.8), (7.0, y, 15.6), 0.2, lambda z: C['steel'] if z < 15.3 else C['black'], seg=10, cuts=(15.3,))
    # the rescue boat on the port side aft, on its cradle, and its davit
    bx0, bx1, by, bz = 2.9, 7.7, 3.55, D3 + 0.5
    rb = [(bx0, 0.0, 0.0), (bx0 + 0.15, 0.62, 0.0), (bx1 - 1.1, 0.8, 0.0), (bx1 - 0.15, 0.38, 0.2), (bx1, 0.0, 0.38)]
    ring = lambda z, sc: [(x, by + sc * y, z + h) for x, y, h in rb] + [(x, by - sc * y, z + h) for x, y, h in reversed(rb[1:-1])]
    R0 = ring(bz, 0.72); R1 = ring(bz + 0.7, 1.0)
    for i in range(len(R0)):
        j = (i + 1) % len(R0); A.poly([R0[i], R0[j], R1[j], R1[i]], C['orange'], ((R0[i][0] + R0[j][0]) / 2 - 5.3, (R0[i][1] + R0[j][1]) / 2 - by, 0))
    A.poly(list(reversed(R0)), C['orange'], (0, 0, -1)); A.poly(R1, C['dark'], (0, 0, 1))
    for x in (bx0 + 0.9, bx1 - 1.1): abox(A, x - 0.15, x + 0.15, by - 0.7, by + 0.7, D3, bz + 0.05, C['steel'])
    acyl(A, (8.3, 4.6, D3), (8.3, 4.6, D3 + 3.0), 0.14, lambda z: w, seg=8); beam(A, (8.3, 4.6, D3 + 3.0), (5.6, 3.8, D3 + 3.3), 0.2, 0.25, w)
    # the crane on the port quarter aft, boom laid forward
    acyl(A, (0.8, 3.6, D3), (0.8, 3.6, D3 + 1.7), 0.35, lambda z: w, seg=sg_)
    beam(A, (0.8, 3.6, D3 + 1.9), (0.9, 3.4, D3 + 2.9), 0.35, 0.4, w); beam(A, (0.9, 3.4, D3 + 2.9), (3.6, 3.2, D3 + 2.6), 0.28, 0.32, w)
    # the crane forward of the wheelhouse, its boom laid forward along the starboard side
    acyl(A, (20.6, -2.6, D3), (20.6, -2.6, D3 + 1.6), 0.4, lambda z: w, seg=sg_)
    beam(A, (20.6, -2.6, D3 + 1.8), (20.7, -2.6, D3 + 2.6), 0.4, 0.45, w); beam(A, (20.7, -2.6, D3 + 2.6), (28.4, -2.4, D3 + 2.45), 0.3, 0.35, w)
    acyl(A, (28.3, -2.4, D3 + 2.4), (28.3, -2.4, D3 + 1.5), 0.04, lambda z: C['steel'], seg=6); abox(A, 28.1, 28.5, -2.6, -2.2, D3 + 1.2, D3 + 1.5, C['yellow'])
    # the cage for the crane operator, amidships forward
    for dx in (23.2, 25.6):
        for dy in (-1.2, 1.2): acyl(A, (dx, dy, D3), (dx, dy, D3 + 2.1), 0.04, lambda z: C['steel'], seg=5)
    abox(A, 23.1, 25.7, -1.3, 1.3, D3 + 2.05, D3 + 2.15, C['steel'])
    # the platform over the anti-rolling tank, with its rail, the windlass and the foremast on it
    abox(A, 30.0, 36.4, -4.2, 4.2, D3, D3 + 1.1, w); abox(A, 29.9, 36.5, -4.3, 4.3, D3 + 1.1, D3 + 1.2, C['deck'])
    if fine:
        for a, b in (((30.0, -4.2), (36.4, -4.2)), ((36.4, -4.2), (36.4, 4.2)), ((36.4, 4.2), (30.0, 4.2))):
            acyl(A, (a[0], a[1], D3 + 2.2), (b[0], b[1], D3 + 2.2), 0.03, lambda z: w, seg=6, cap=False)
            for k in range(5): t = k / 4; acyl(A, (a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, D3 + 1.2), (a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, D3 + 2.2), 0.03, lambda z: w, seg=5)
    for sg in (1, -1):
        acyl(A, (34.9, sg * 0.5, D3 + 1.85), (34.9, sg * 1.5, D3 + 1.85), 0.55, lambda z: C['winch'], seg=sg_)
    abox(A, 34.3, 35.5, -1.6, 1.6, D3 + 1.2, D3 + 1.6, C['winch'])
    # the foremast: a raked plate, the pole above with its lights and the radar
    b0, b1, t0, t1 = 30.4, 33.4, 29.4, 29.9
    for y, s in ((-0.35, -1), (0.35, 1)): A.poly([(b0, y, D3 + 1.2), (b1, y, D3 + 1.2), (t1, y, 17.6), (t0, y, 17.6)], w, (0, s, 0))
    A.poly([(b1, -0.35, D3 + 1.2), (b1, 0.35, D3 + 1.2), (t1, 0.35, 17.6), (t1, -0.35, 17.6)], w, (1, 0.4, 0)); A.poly([(b0, -0.35, D3 + 1.2), (b0, 0.35, D3 + 1.2), (t0, 0.35, 17.6), (t0, -0.35, 17.6)], w, (-1, 0, 0))
    abox(A, 29.0, 30.3, -0.7, 0.7, 17.6, 17.75, w)
    acyl(A, (29.6, 0, 17.75), (29.6, 0, 21.0), 0.08, lambda z: w, seg=8)
    for z in (18.6, 20.2): abox(A, 29.4, 29.8, -0.3, 0.3, z, z + 0.08, C['steel'])
    # the hauling port on the starboard side, open: a dark opening with its door swung up, the roller in its sill
    for x0, x1, z0, z1, m, o in ((HP_X0, HP_X1, 5.5, 7.05, C['dark'], 0.02),):
        y = hbz((x0 + x1) / 2, (z0 + z1) / 2) + o
        A.poly([(x0, -y, z0), (x1, -y, z0), (x1, -y, z1), (x0, -y, z1)], m, (0, -1, 0))
        abox(A, x0 - 0.1, x1 + 0.1, -y - 0.6, -y, z1 + 0.05, z1 + 0.15, C['hull'])
        acyl(A, (x0 + 0.3, -y - 0.12, z0 + 0.12), (x1 - 0.3, -y - 0.12, z0 + 0.12), 0.11, lambda z: C['steel'], seg=10)
    # the setting chute at the stern, starboard side, on the main deck
    A.poly([(XA - 0.02, -3.9, D1 + 0.1), (XA - 0.02, -2.9, D1 + 0.1), (XA - 0.02, -2.9, D1 + 1.0), (XA - 0.02, -3.9, D1 + 1.0)], C['dark'], (-1, 0, 0))
    # windows along the 2nd deck, the anchors
    for sg in (1, -1):
        for x in [2.6 + 2.2 * k for k in range(8)]:
            if sg < 0 and HP_X0 - 1 < x < HP_X1 + 1: continue
            y = hbz(x, 8.7) + 0.015; A.poly([(x - 0.25, sg * y, 8.3), (x + 0.25, sg * y, 8.3), (x + 0.25, sg * y, 9.1), (x - 0.25, sg * y, 9.1)], C['glass'], (0, sg, 0))
        x = 39.6; y = hbz(x, 8.6) + 0.02
        A.poly([(x - 0.5, sg * y, 8.1), (x + 0.5, sg * y, 8.25), (x + 0.5, sg * y, 9.0), (x - 0.5, sg * y, 8.85)], C['dark'], (0, sg, 0))
    acyl(A, (42.6, 0, D3 + 0.8), (42.6, 0, D3 + 2.6), 0.06, lambda z: w, seg=8)
    return [A.done(30)]


# ---------- the wheelhouse on its deck, with the radar mast and domes ----------
WX0, WX1, WY = 10.9, 18.5, 3.75
WZ0, WF, WS, WH, WR = D3, 10.7, 12.35, 13.35, 14.05

def wheelhouse(fine=True):
    A = Acc('wh'); G = Acc('whglass'); w = C['white']
    oc = [(WX0, -WY), (WX1 - 1.6, -WY), (WX1, -WY + 1.6), (WX1, WY - 1.6), (WX1 - 1.6, WY), (WX0, WY)]
    lean = lambda p, z: (p[0] + (0.6 * (z - WF) / (WR - WF) if p[0] > WX1 - 1.61 else 0.0), p[1], z)
    for i in range(len(oc)):
        a, b = oc[i], oc[(i + 1) % len(oc)]; nrm = (b[1] - a[1], -(b[0] - a[0]), 0)
        A.poly([lean(a, WZ0), lean(b, WZ0), lean(b, WS), lean(a, WS)], w, nrm)
        A.poly([lean(a, WH), lean(b, WH), lean(b, WR), lean(a, WR)], w, nrm)
        if a[0] == WX0 and b[0] == WX0: A.poly([lean(a, WS), lean(b, WS), lean(b, WH), lean(a, WH)], w, nrm); continue
        G.poly([lean(a, WS), lean(b, WS), lean(b, WH), lean(a, WH)], C['glass'], nrm)
        L = math.hypot(b[0] - a[0], b[1] - a[1]); k = max(1, int(L / 1.1))
        for j in range(k + 1):
            t = j / k; p = (a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t); beam(A, lean(p, WS), lean(p, WH), 0.1, 0.1, C['black'])
    io = [(x + (0.2 if x == WX0 else -0.2), y * 0.95) for x, y in oc]
    for i in range(len(io)):
        a, b = io[i], io[(i + 1) % len(io)]; A.poly([(a[0], a[1], WF), (b[0], b[1], WF), (b[0], b[1], WR), (a[0], a[1], WR)], C['dark'], (-(b[1] - a[1]), b[0] - a[0], 0))
    A.poly([(x, y, WS - 0.8) for x, y in io], C['dark'], (0, 0, 1))
    ro = [(WX0 - 0.3, -WY - 0.3), (WX1 - 1.4, -WY - 0.3), (WX1 + 0.9, -WY + 1.4), (WX1 + 0.9, WY - 1.4), (WX1 - 1.4, WY + 0.3), (WX0 - 0.3, WY + 0.3)]
    A.poly([(x, y, WR) for x, y in ro], C['roof'], (0, 0, -1)); A.poly([(x, y, WR + 0.2) for x, y in ro], C['roof'], (0, 0, 1))
    for i in range(len(ro)):
        a, b = ro[i], ro[(i + 1) % len(ro)]; A.poly([(a[0], a[1], WR), (b[0], b[1], WR), (b[0], b[1], WR + 0.2), (a[0], a[1], WR + 0.2)], w, (b[1] - a[1], -(b[0] - a[0]), 0))
        if fine:
            for h in (0.6,): acyl(A, (a[0], a[1], WR + 0.2 + h), (b[0], b[1], WR + 0.2 + h), 0.03, lambda z: w, seg=6, cap=False)
    # the radar mast: a frame on the roof with the platform, scanners, the two domes and the masthead pole
    for x in (11.4, 12.9):
        for y in (-0.9, 0.9): acyl(A, (x, y, WR + 0.2), (x, y, 15.8), 0.07, lambda z: w, seg=6)
    abox(A, 11.1, 13.2, -1.2, 1.2, 15.8, 15.95, w)
    abox(A, 12.0, 12.3, -0.15, 0.15, 15.95, 16.3, C['dark']); abox(A, 10.9, 13.5, -0.1, 0.1, 16.3, 16.5, C['dark'])
    for y in (-2.6, 2.6):
        acyl(A, (11.6, y, WR + 0.2), (11.6, y, 16.6), 0.09, lambda z: w, seg=6)
        acyl(A, (11.6, y, 16.6), (11.6, y, 17.4), 0.55, lambda z: w, seg=12, r1=0.4); acyl(A, (11.6, y, 17.4), (11.6, y, 17.8), 0.4, lambda z: w, seg=12, r1=0.1)
    acyl(A, (12.2, 0, 15.95), (12.2, 0, 19.0), 0.06, lambda z: w, seg=6)
    for sg in (1, -1): abox(A, 16.0, 16.6, sg * (WY + 0.3) - 0.1, sg * (WY + 0.3) + 0.1, WR - 0.3, WR - 0.05, C['dark'])
    # the deckhouse under the wheelhouse's overhang aft, and the ladders
    abox(A, 6.0, WX0, -3.0, 3.0, D3, WF - 0.05, w, skip=())
    for sg in (1, -1):
        for k in range(5): abox(A, WX1 + 0.4 + 0.22 * k, WX1 + 0.62 + 0.22 * k, sg * 3.3 - 0.4, sg * 3.3 + 0.4, D3 + 1.1 - 0.22 * k, D3 + 1.15 - 0.22 * k, C['steel'])
    return [A.done(30)], [G.done(30)]


def build(fine=True):
    solids = build_hull(fine) + decks(fine) + underwater(fine) + deck_gear(fine)
    o, g = wheelhouse(fine); solids += o
    return [s for s in solids if s], [x for x in g if x]


def to_game(p): return (-p[1], p[2] - WL, -(p[0] - XM))
def to_game_n(n): return (-n[1], n[2], -n[0])

def anchors():
    G = lambda x, y, z: [round(v, 3) for v in to_game((x, y, z))]
    hy = hbz(22.1, 6.2)
    return {'eye': G(17.6, -0.8, WF + 1.75), 'skipperAt': G(17.2, -0.8, WF), 'hp': -0.10, 'fov': 58,
            'crewSpots': [G(4.0, -2.0, D3) + [1.57], G(22.0, 1.5, D3) + [0.0], G(1.0, -3.0, D3) + [3.14], G(26.0, -1.5, D3) + [0.0]],
            'lights': [[G(29.6, 0, 20.4), [1, 0.95, 0.85]], [G(16.3, WY + 0.3, WR - 0.15), [1, 0.12, 0.1]], [G(16.3, -WY - 0.3, WR - 0.15), [0.1, 1, 0.35]],
                       [G(XA + 0.3, 0, z_top(XA) + 1.0), [1, 0.95, 0.85]], [G(12.2, 0, 18.8), [1, 0.95, 0.85]]],
            # the deck where the line is worked: the main deck inside the hauling port (the hauler and the tubs stand there, out of sight)
            'deck': {'y': round(D1 - WL, 3), 'z': round(-(22.0 - XM), 3)}, 'gw': round(z_top(20.0) - WL, 3),
            'stern': round(XM - XA, 3), 'bow': round(-(XF - XM), 3), 'side': HB, 'beam': 10.45, 'pl': 18.0, 'rl': 4.0, 'open': False, 'hand': False,
            'pole': G(XA + 0.5, 0, z_top(XA) + 2.2), 'hauler': G(22.1, -(hy - 0.5), 6.2), 'filler': G(24.0, HB, D3 + 0.3)}


SHOTS = [('bow3q', (72.0, -42.0, 15.0), (20.0, 0, 6.0), 35), ('stern3q', (-30.0, 32.0, 19.0), (14.0, 0, 7.0), 35), ('side', (20.7, -80, 7.0), (20.7, 0, 8.0), 35),
         ('above', (56.0, -36.0, 46.0), (20.0, 0, 5.0), 35), ('haul', (30.0, -18.0, 9.0), (22.0, -5.0, 6.3), 35)]

def main():
    os.makedirs(OUT, exist_ok=True)
    reset(); colours()
    solids, glass = build(True)
    join(solids, 'BOAT0'); join(glass, 'GLASS0')
    if 'fast' not in sys.argv: beauty(OUT, 'al', WL, SHOTS)
    ex = {'frame': 'kystfiske: x starboard, y up from the waterline, z aft; metres', 'type': 'autoliner', 'name': '45 m Longliner (6161)',
          'len': 45.38, 'beam': 10.45, 'draft': 3.75, 'anchors': anchors()}
    export_boat(build, to_game, to_game_n, OUT, 'al45.glb', os.path.join(ROOT, 'src', 'data', 'boat-al45.b64'), ex,
                side=(os.path.join(ROOT, 'src', 'data', 'boat-al45-side.b64'), 20.7, 8.0, 50.0), dry='dry' in sys.argv)


if __name__ == '__main__':
    main()
