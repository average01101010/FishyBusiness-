"""The purse seiner and pelagic trawler (pelagisk), about 75 m, built in Blender from the profile drawings of a Danish purse seiner and
pelagic trawler that Jonas showed on 06.10.2026 («Denne kan både bruke ringnot og trål»). The drawing has a frame scale (0-120) and no
figures: with the usual 0.60 m frame spacing it is 75.5 m overall, which is the game's 75 m; its breadth is not on it, so the game's
15.5 m stands. The drawings are not in the repository; the lines below were measured from Jonas' picture (19.17 px/m, frame 0 at
the aft perpendicular): the waterline 7.6 m over the base line, the sheer of the blue hull 13.7 m aft, 12.65 m amidships and 16.5 m
at the stem, the white bulwark over it, the bulb's nose at 72.1 m and 5.4 m up.
On deck: the seine in its bin aft with the power block on a knuckle-boom crane over it, a tower crane on the starboard quarter, the
pelagic trawl's drum and winches, the trawl doors in gallows at the stern quarters, the purse davit on the starboard side, the
superstructure amidships with the wheelhouse on top, the raked mast and funnel, a crane and the foremast forward. The trawl doors,
codend and net roll are the trawler's (tral60.py); view3d.js TRAWL and SEINE play the trawl and the seine. Exterior only (CLAUDE.md).

    pip install bpy==4.5.4
    python3 tools/boats/not75.py            -> src/data/boat-not75.b64 (+ the side picture), renders in tools/boats/out/
    python3 tools/boats/not75.py fast dry   -> no renders to look at, and the GLB only in tools/boats/out

Frame: x forward from the aft perpendicular, y to port, z up from the base line; the waterline is z = 7.60."""
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy
from bpyutil import *
import tral60 as TR

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE)); OUT = os.path.join(HERE, 'out')
WL = 7.60; XA = -2.85; XF = 72.70; XM = (XA + XF) / 2; HB = 7.75
def ss(a, b, x): t = max(0.0, min(1.0, (x - a) / (b - a))); return t * t * (3 - 2 * t)


# ---------- measured lines (metres) ----------
LOW = [(XA, 7.15), (-2.0, 6.55), (-0.8, 5.6), (0.8, 4.4), (2.8, 2.9), (5.0, 1.5), (7.5, 0.3), (10.0, -0.50), (12.0, -0.72), (30.0, -0.40),
       (45.0, -0.08), (56.0, 0.22), (61.0, 0.45), (63.5, 0.95)]
def z_low(x): return interp(LOW, x)
def z_keel(x): return -1.0 + 1.3 * x / 60.0
STEM = [(0.9, 63.6), (2.5, 65.6), (4.0, 67.2), (5.5, 68.5), (7.0, 69.5), (8.2, 70.0), (10.0, 70.5), (12.0, 71.0), (14.0, 71.6), (16.0, 72.3), (17.1, XF)]
def x_stem(z): return interp(STEM, z)
SHEER = [(XA, 13.7), (8.0, 13.25), (20.0, 12.75), (32.0, 12.65), (44.0, 12.8), (52.0, 13.3), (58.0, 14.0), (64.0, 15.0), (69.0, 15.9), (XF, 16.5)]
ZTOP = [(XA, 16.1), (6.0, 15.7), (14.0, 15.4), (25.0, 15.3), (40.0, 15.35), (48.0, 15.7), (56.0, 16.2), (64.0, 16.7), (70.0, 17.0), (XF, 17.1)]
def z_sheer(x): return interp(SHEER, x)
def z_top(x): return interp(ZTOP, x)
def z_deck(x): return z_top(x) - 1.1
HBD = [(XA, 7.30), (-1.5, 7.60), (0.5, 7.75), (50.0, 7.75), (54.0, 7.55), (58.0, 7.05), (62.0, 6.20), (65.0, 5.20), (68.0, 3.80), (70.5, 2.30),
       (72.0, 0.90), (XF, 0.0)]
HBW = [(XA, 6.30), (-1.0, 6.90), (2.0, 7.40), (6.0, 7.70), (10.0, 7.75), (44.0, 7.75)]
NX = [(XA, 2.2), (0.0, 2.4), (4.0, 3.2), (10.0, 5.5), (16.0, 7.0), (44.0, 7.0)]
X_ENT = 44.0
PW = [(0.0, 2.0), (3.0, 2.5), (WL, 3.0), (11.0, 3.8), (14.0, 4.4), (17.2, 4.8)]


def section_body(x, n=26):
    zl = z_low(x); zt = z_top(x); bw = interp(HBW, x); bd = interp(HBD, x); nn = interp(NX, x); pts = []
    if zl < WL - 0.02:
        for k in range(n + 1):
            th = (math.pi / 2) * k / n; c = math.cos(th); s = math.sin(th)
            pts.append((bw * (s ** (2 / nn) if s > 0 else 0.0), zl + (WL - zl) * (1 - (c ** (2 / nn) if c > 0 else 0.0))))
    else:
        pts.append((0.0, zl))
    for k in range(1, 11):
        z = WL + (zt - WL) * k / 10; pts.append((bw + (bd - bw) * min(1.0, (z - WL) / (12.0 - WL)) ** 1.4, z))
    return pts

STEM_INV = [(x, z) for z, x in STEM]
_YM = {}
def ymid(zm):
    if 'sec' not in _YM: _YM['sec'] = section_body(X_ENT); _YM['zl'] = z_low(X_ENT); _YM['zt'] = z_top(X_ENT)
    sec = _YM['sec']
    if zm >= _YM['zt']: return sec[-1][0]
    return interp([(z, y) for y, z in sec], zm)
def z_bot(x): return max(z_low(x), interp(STEM_INV, x) if x > STEM[0][1] else -9.0)

def section(x, sg=1, n=26):
    if x <= X_ENT: pts = section_body(x, n)
    else:
        ymid(0); zb = z_bot(x); zt = z_top(x); zl0 = _YM['zl']; zt0 = _YM['zt']; pts = []
        for k in range(61):
            z = zb + (zt - zb) * (k / 60) ** 1.35
            zm = zl0 + (z - zb) * (zt0 - zl0) / max(1e-6, zt - zb)
            xs = x_stem(z); s_ = max(0.0, min(1.0, (xs - x) / max(0.5, xs - X_ENT)))
            pts.append((ymid(zm) * (1 - (1 - s_) ** interp(PW, z)), z))
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
    TR.colours()                    # the trawl door, codend and net roll keep the trawler's colours
    C.update(TR.C)
    C['hull'] = mat('seinehull', (0.12, 0.20, 0.38), 0.55, zone=1)
    C['black'] = mat('black', (0.06, 0.06, 0.07), 0.35)
    C['seine'] = mat('seine', (0.10, 0.13, 0.12), 0.1)
    C['glassb'] = mat('glassblue', (0.10, 0.16, 0.30), 0.95)

def band_mat(z, x):
    if z < WL - 0.10: return C['af']
    if z < WL + 0.35: return C['boot']
    if z < z_sheer(x) + 0.02: return C['hull']
    return C['white']

def stations(fine=True):
    if fine:
        xs = [XA + 0.05 * i for i in range(5)] + [XA + 0.25 + 0.5 * i for i in range(16)] + [5.5 + 1.0 * i for i in range(39)] + \
             [45.0 + 0.5 * i for i in range(36)] + [63.0 + 0.3 * i for i in range(32)] + [XF - 0.06]
    else:
        xs = [XA, XA + 0.2, -1.5, 0.5, 3.0, 6.0, 10.0, 16.0, 24.0, 32.0, 40.0, 46.0, 52.0, 57.0, 61.0, 64.0, 66.5, 68.5, 70.0, 71.2, 72.1, XF - 0.06]
    return sorted(set(round(x, 4) for x in xs if XA <= x < XF - 0.01))

OUTH = lambda c: (0, c.y, min(c.z, 9.0) - 9.0)

def hull_rows(sg, fine=True):
    rows = []
    for x in stations(fine):
        sec = [(abs(y), z) for y, z in section(x, sg)]
        zs = z_sheer(x)
        bands = [(WL - 0.10, 10 if fine else 3), (WL + 0.35, 1), (zs, 5 if fine else 2), (None, 3 if fine else 1)]
        rows.append([(x, sg * y, z) for y, z in resample(sec, bands)])
    return rows

def build_hull(fine=True):
    objs = []; first = {}
    for sg, nm in ((1, 'p'), (-1, 's')):
        rows = hull_rows(sg, fine); first[sg] = rows[0]
        def mf(i, j, rows=rows):
            a = rows[i][j]; b = rows[i + 1][j + 1]; return band_mat((a[2] + b[2]) / 2, (a[0] + b[0]) / 2)
        objs.append(grid('hull_' + nm, rows, mf, out=OUTH))
    T = [[q, p] for p, q in zip(first[1], first[-1])]
    objs.append(grid('transom', T, lambda i, j: band_mat((T[i][0][2] + T[i + 1][0][2]) / 2, XA), angle=20, out=lambda c: (-1, 0, 0)))
    return objs


# ---------- the deck inside the bulwark, its inside and cap ----------
def decks(fine=True):
    A = Acc('decks'); xs = sorted(set([x for x in stations(fine) if x <= XF - 0.5] + [XF - 0.5]))
    for i in range(len(xs) - 1):
        x0, x1 = xs[i], xs[i + 1]; z0, z1 = z_deck(x0), z_deck(x1); y0, y1 = hbz(x0, z0) - 0.07, hbz(x1, z1) - 0.07
        if y0 < 0.05 and y1 < 0.05: continue
        A.poly([(x0, -y0, z0), (x1, -y1, z1), (x1, y1, z1), (x0, y0, z0)], C['deck'], (0, 0, 1))
        for sg in (1, -1):
            ta, tb = z_top(x0), z_top(x1)
            A.poly([(x0, sg * y0, z0), (x1, sg * y1, z1), (x1, sg * (hbz(x1, tb) - 0.07), tb), (x0, sg * (hbz(x0, ta) - 0.07), ta)], C['inner'], (0, -sg, 0))
            A.poly([(x0, sg * (hbz(x0, ta) - 0.07), ta), (x1, sg * (hbz(x1, tb) - 0.07), tb), (x1, sg * hbz(x1, tb), tb + 0.01), (x0, sg * hbz(x0, ta), ta + 0.01)], C['white'], (0, 0, 1))
    # the transom's inside and cap
    zd, zt = z_deck(XA), z_top(XA); y = hbz(XA, zt) - 0.07
    A.poly([(XA + 0.07, -y, zd), (XA + 0.07, y, zd), (XA + 0.07, y, zt), (XA + 0.07, -y, zt)], C['inner'], (1, 0, 0))
    abox(A, XA - 0.02, XA + 0.07, -y - 0.07, y + 0.07, zt, zt + 0.02, C['white'])
    # the stern roller across the middle of the transom
    acyl(A, (XA + 0.15, -2.6, zt + 0.25), (XA + 0.15, 2.6, zt + 0.25), 0.32, lambda z: C['steel'], seg=14 if fine else 8)
    acyl(A, (XA + 0.15, 2.6, zt + 0.25), (XA + 0.15, -2.6, zt + 0.25), 0.32, lambda z: C['steel'], seg=14 if fine else 8)
    for sg in (1, -1): abox(A, XA - 0.1, XA + 0.5, sg * 2.6 - 0.15, sg * 2.6 + 0.15, zt - 0.3, zt + 0.7, C['steel'])
    return [A.done(25)]


# ---------- under water: skeg, propeller, rudder, bulb ----------
def underwater(fine=True):
    objs = []
    xs = [3.2 + (14.0 - 3.2) * k / 16 for k in range(17)]
    top = [(x, z_low(x) + 0.5) for x in xs]; bot = [(x, z_keel(x) if x < 11.5 else max(z_keel(x), z_low(x) - 0.02)) for x in reversed(xs)]
    rings = [[(x, sy * (0.55 if x < 11.0 else 0.55 * (14.0 - x) / 3.0 + 0.02), z) for x, z in top + bot] for sy in (1, -1)]
    objs.append(loft_rings('skeg', rings, C['af']))
    zc = 2.55
    objs.append(cyl('hub', (1.2, 0, zc), (2.4, 0, zc), 0.55, C['prop'], 12, r1=0.42))
    objs.append(cyl('shaft', (2.4, 0, zc), (3.4, 0, zc), 0.28, C['steel'], 10))
    for k in range(4):
        a = 2 * math.pi * k / 4 + 0.3; e = (0, math.cos(a), math.sin(a)); t = (0, -math.sin(a), math.cos(a))
        bl = [(1.85 + 0.3 * f, (0.45 + 1.6 * r) * e[1] + t[1] * w, zc + (0.45 + 1.6 * r) * e[2] + t[2] * w)
              for r, w, f in ((0, -0.38, 0), (0.5, -0.6, 0.4), (1.0, -0.3, 1.0), (1.0, 0.3, 1.0), (0.5, 0.58, -0.4), (0, 0.36, 0))]
        objs.append(loft_rings('blade%d' % k, [[(p[0] - 0.05, p[1], p[2]) for p in bl], [(p[0] + 0.05, p[1], p[2]) for p in bl]], C['prop']))
    rud = [(-0.2, 6.9), (-2.3, 6.9), (-2.5, 6.4), (-2.5, 0.6), (-2.3, 0.3), (-0.2, 0.3), (-0.05, 0.8), (-0.05, 6.4)]
    w = lambda x: 0.36 * max(0.25, 1 - abs(x + 0.85) / 1.8)
    objs.append(loft_rings('rudder', [[(x, w(x), z) for x, z in rud], [(x, -w(x), z) for x, z in rud]], C['af']))
    B = [(63.0, 0.6, 2.8, 4.2), (64.5, 1.45, 2.9, 4.4), (66.5, 1.6, 2.8, 4.6), (68.5, 1.5, 2.45, 4.8), (70.0, 1.25, 2.0, 5.0), (71.0, 0.95, 1.5, 5.15),
         (71.7, 0.6, 0.95, 5.3), (72.05, 0.25, 0.4, 5.38), (72.15, 0.04, 0.06, 5.4)]
    sg2 = 24 if fine else 10
    rings = [[(x, max(ry, 0.02) * math.cos(2 * math.pi * k / sg2), zc2 + max(rz, 0.02) * math.sin(2 * math.pi * k / sg2)) for k in range(sg2)] for x, ry, rz, zc2 in B]
    objs.append(loft_rings('bulb', rings, C['af'], angle=60))
    return objs


# ---------- the aft deck: the seine bin, the power block crane, the tower crane, the trawl drum, winches and door gallows ----------
BIN_X0, BIN_X1, BIN_YS, BIN_YP = -2.2, 8.5, -5.0, 6.6        # the seine bin (starboard to port)
DRUM_X = 10.6                                                # the pelagic trawl's drum, across
PB = (3.6, -7.2, 0.0)                                        # the power block's x, y (its height: z_deck + 9.6)
GAL_Y = 5.75; GAL_X = XA - 0.55                              # the trawl doors hang at the stern quarters
def gal_z(): return z_deck(XA) + 3.7

def aft_deck(fine=True):
    A = Acc('aft'); w = C['white']; sg_ = 22 if fine else 10; zd = z_deck(4.0)
    # the bin: low walls round the seine, the net piled in it, the corks along the top of the pile
    for (x0, x1, y0, y1) in ((BIN_X0, BIN_X1, BIN_YS - 0.12, BIN_YS), (BIN_X0, BIN_X1, BIN_YP, BIN_YP + 0.12), (BIN_X1, BIN_X1 + 0.12, BIN_YS - 0.12, BIN_YP + 0.12)):
        abox(A, x0, x1, y0, y1, zd, zd + 1.5, C['steel'])
    nx, ny = 14, 8
    for i in range(nx):
        for j in range(ny):
            x0 = BIN_X0 + (BIN_X1 - BIN_X0) * i / nx; x1 = BIN_X0 + (BIN_X1 - BIN_X0) * (i + 1) / nx; y0 = BIN_YS + (BIN_YP - BIN_YS) * j / ny; y1 = BIN_YS + (BIN_YP - BIN_YS) * (j + 1) / ny
            h = zd + 1.05 + 0.35 * math.sin(i * 1.7 + j * 2.3) ** 2 + 0.15 * math.cos(i * 0.9 - j * 1.4)
            A.poly([(x0, y0, h), (x1, y0, h + 0.05), (x1, y1, h), (x0, y1, h - 0.04)], C['seine'], (0, 0, 1))
    if fine:
        for i in range(24):
            x = BIN_X0 + 0.3 + (BIN_X1 - BIN_X0 - 0.6) * i / 23; abox(A, x - 0.18, x + 0.18, BIN_YP - 0.75, BIN_YP - 0.35, zd + 1.38, zd + 1.58, C['float'])
    # the power block crane on the starboard side: pedestal, the boom up and aft, the block at its tip over the starboard rail
    px, py = 12.2, -5.9; pz = z_deck(px)
    acyl(A, (px, py, pz), (px, py, pz + 2.8), 0.7, lambda z: w, seg=sg_)
    tip = (PB[0], PB[1], z_deck(PB[0]) + 10.4); knee = (9.5, -6.4, pz + 9.0)
    beam(A, (px, py, pz + 3.0), knee, 0.75, 0.9, w); beam(A, knee, tip, 0.55, 0.7, w)
    pbz = z_deck(PB[0]) + 9.6
    acyl(A, (PB[0] - 0.25, PB[1], pbz), (PB[0] + 0.25, PB[1], pbz), 1.0, lambda z: C['yellow'], seg=sg_)
    acyl(A, (PB[0] + 0.25, PB[1], pbz), (PB[0] - 0.25, PB[1], pbz), 1.0, lambda z: C['yellow'], seg=sg_)
    beam(A, tip, (PB[0], PB[1], pbz + 0.6), 0.2, 0.2, C['steel'])
    # the tower on the starboard quarter with its crane laid forward
    tx0, tx1, ty0, ty1 = XA + 0.2, 1.6, -7.35, -5.25; tz0 = z_deck(0.0)
    abox(A, tx0, tx1, ty0, ty1, tz0, tz0 + 5.6, w); abox(A, tx0 - 0.2, tx1 + 0.2, ty0 - 0.2, ty1 + 0.2, tz0 + 5.6, tz0 + 5.75, C['roof'])
    acyl(A, ((tx0 + tx1) / 2, (ty0 + ty1) / 2, tz0 + 5.75), ((tx0 + tx1) / 2, (ty0 + ty1) / 2, tz0 + 7.0), 0.5, lambda z: w, seg=sg_)
    beam(A, ((tx0 + tx1) / 2, (ty0 + ty1) / 2, tz0 + 7.0), (9.0, -6.0, tz0 + 8.6), 0.5, 0.6, w)
    beam(A, (9.0, -6.0, tz0 + 8.6), (3.0, -6.2, tz0 + 8.2), 0.4, 0.5, w)
    for k in range(6): abox(A, tx1, tx1 + 0.06, ty1 + 0.15, ty1 + 0.55, tz0 + 0.5 + 0.85 * k, tz0 + 0.56 + 0.85 * k, C['steel'])
    # the gallows at the stern quarters where the pelagic doors hang, and their blocks
    for sg in (1, -1):
        y = sg * GAL_Y; gz = gal_z()
        abox(A, XA - 0.05, XA + 0.65, y - 0.35, y + 0.35, z_deck(XA), gz + 0.9, w)
        abox(A, GAL_X - 0.3, XA + 0.65, y - 0.3, y + 0.3, gz + 0.9, gz + 1.5, w)
        acyl(A, (GAL_X, y - 0.12, gz), (GAL_X, y + 0.12, gz), 0.55, lambda z: C['yellow'], seg=14 if fine else 8)
        abox(A, GAL_X - 0.08, GAL_X + 0.08, y - 0.2, y + 0.2, gz, gz + 0.9, C['steel'])
    # the trawl drum across, between its frames
    dz = z_deck(DRUM_X) + 1.9
    for sg in (1, -1): abox(A, DRUM_X - 1.1, DRUM_X + 1.1, sg * 2.9 - 0.18, sg * 2.9 + 0.18, z_deck(DRUM_X), dz + 1.2, C['winch'])
    acyl(A, (DRUM_X, -2.7, dz), (DRUM_X, 2.7, dz), 0.55, lambda z: C['winch'], seg=sg_)
    for sg in (1, -1): acyl(A, (DRUM_X, sg * 2.55, dz), (DRUM_X, sg * 2.72, dz), 1.75, lambda z: C['winch'], seg=sg_)
    # the trawl winches either side, forward of the drum
    for sg in (1, -1):
        y = sg * 5.4; wz = z_deck(13.2) + 1.25
        abox(A, 12.0, 14.4, y - 0.95, y + 0.95, z_deck(13.2), z_deck(13.2) + 0.35, C['winch'])
        acyl(A, (13.2, y - 0.9, wz), (13.2, y + 0.9, wz), 0.7, lambda z: C['steel'], seg=sg_)
        for dy in (-0.95, 0.95): acyl(A, (13.2, y + dy - 0.06, wz), (13.2, y + dy + 0.06, wz), 0.95, lambda z: C['winch'], seg=sg_)
    # the purse davit on the starboard side amidships, its blocks out over the side
    x = 22.0; z0 = z_deck(x)
    beam(A, (x, -7.2, z0), (x, -7.2, z0 + 3.4), 0.5, 0.5, w); beam(A, (x, -7.2, z0 + 3.4), (x, -9.0, z0 + 3.0), 0.4, 0.45, w)
    for dx in (-0.35, 0.35): acyl(A, (x + dx, -8.9, z0 + 2.55), (x + dx, -8.9, z0 + 2.95), 0.32, lambda z: C['yellow'], seg=10)
    return [A.done(30)]


# ---------- the superstructure, the funnel, the mast ----------
SX0, SX1, SY = 13.5, 41.5, 7.35
WX0, WX1, WY = 20.0, 36.9, 7.0
def oct_(x0, x1, y, ch): return [(x0, -y + ch * 0.3), (x0 + ch * 0.3, -y), (x1 - ch, -y), (x1, -y + ch), (x1, y - ch), (x1 - ch, y), (x0 + ch * 0.3, y), (x0, y - ch * 0.3)]

def walls(A, poly, z0, z1, m, inward=False):
    n = len(poly)
    for i in range(n):
        a, b = poly[i], poly[(i + 1) % n]; nrm = (b[1] - a[1], -(b[0] - a[0]), 0)
        if inward: nrm = (-nrm[0], -nrm[1], 0)
        A.poly([(a[0], a[1], z0), (b[0], b[1], z0), (b[0], b[1], z1), (a[0], a[1], z1)], m, nrm)

def superstructure(fine=True):
    A = Acc('super'); G = Acc('glassw'); w = C['white']
    zA = z_deck(27.0); zB = zA + 2.75; zW = zB + 0.2; zS = zW + 0.8; zH = zS + 1.8; zR = zH + 0.6
    # tier A, with the windows forward and the recess for the rescue boat aft on the starboard side
    pa = oct_(SX0, SX1, SY, 2.4); walls(A, pa, zA, zB, w)
    for sg in (1, -1):
        for k in range(8):
            x = 26.0 + 1.75 * k; y = sg * (SY + 0.02)
            A.poly([(x, y, zA + 1.1), (x + 1.2, y, zA + 1.1), (x + 1.2, y, zA + 2.0), (x, y, zA + 2.0)], C['glassb'], (0, sg, 0))
    for k in range(5):
        y = -4.0 + 2.0 * k; A.poly([(SX1 + 0.02, y, zA + 1.1), (SX1 + 0.02, y + 1.4, zA + 1.1), (SX1 + 0.02, y + 1.4, zA + 2.0), (SX1 + 0.02, y, zA + 2.0)], C['glassb'], (1, 0, 0))
    abox(A, 14.6, 21.0, -SY - 0.03, -SY + 0.02, zA + 0.2, zB - 0.2, C['black'])
    # deck B over it, a little proud, with its rail
    pb = oct_(SX0 - 0.4, SX1 + 0.9, SY + 0.3, 2.6)
    A.poly([(x, y, zB + 0.2) for x, y in pb], C['roof'], (0, 0, 1)); A.poly([(x, y, zB) for x, y in pb], C['roof'], (0, 0, -1)); walls(A, pb, zB, zB + 0.2, w)
    for i in range(len(pb)):
        a, b = pb[i], pb[(i + 1) % len(pb)]
        for h in (0.55, 1.05): acyl(A, (a[0], a[1], zB + 0.2 + h), (b[0], b[1], zB + 0.2 + h), 0.03, lambda z: w, seg=6, cap=False)
    # the wheelhouse: wide, the windows all round with the front leaning out, the roof overhanging
    pw = oct_(WX0, WX1, WY, 2.2)
    lean = lambda p, z: (p[0] + (0.45 * (z - zS) / (zH - zS) if p[0] > WX1 - 2.21 else 0.0), p[1], z)
    for i in range(len(pw)):
        a, b = pw[i], pw[(i + 1) % len(pw)]; nrm = (b[1] - a[1], -(b[0] - a[0]), 0)
        A.poly([(a[0], a[1], zW), (b[0], b[1], zW), (b[0], b[1], zS), (a[0], a[1], zS)], w, nrm)
        A.poly([lean(a, zH), lean(b, zH), lean(b, zR), lean(a, zR)], w, nrm)
        G.poly([lean(a, zS), lean(b, zS), lean(b, zH), lean(a, zH)], C['glass'], nrm)
        L = math.hypot(b[0] - a[0], b[1] - a[1]); k = max(1, int(L / 1.5))
        for j in range(k + 1):
            t = j / k; p = (a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t); beam(A, lean(p, zS), lean(p, zH), 0.13, 0.13, C['black'])
    walls(A, oct_(WX0 + 0.3, WX1 - 0.3, WY - 0.3, 2.0), zW, zR, C['dark'], inward=True)
    A.poly([(x, y, zS - 0.9) for x, y in oct_(WX0 + 0.3, WX1 - 0.3, WY - 0.3, 2.0)], C['dark'], (0, 0, 1))
    ro = oct_(WX0 - 0.5, WX1 + 1.0, WY + 0.5, 2.6)
    A.poly([(x, y, zR) for x, y in ro], C['roof'], (0, 0, -1)); A.poly([(x, y, zR + 0.22) for x, y in ro], C['roof'], (0, 0, 1)); walls(A, ro, zR, zR + 0.22, w)
    # the mast on the roof, raked aft and black, with the radar platforms, scanners and lights
    m0 = (25.4, 0.0, zR + 0.22); m1 = (22.9, 0.0, 29.6)
    beam(A, m0, m1, 0.7, 1.2, C['black']); beam(A, (26.6, 0, zR + 0.22), (24.8, 0, zR + 3.4), 0.4, 0.5, w)
    for z, L in ((22.6, 5.6), (24.7, 4.4)):
        t = (z - m0[2]) / (m1[2] - m0[2]); x = m0[0] + (m1[0] - m0[0]) * t
        abox(A, x - 1.4, x + 1.6, -1.4, 1.4, z, z + 0.15, w)
        abox(A, x - 0.15, x + 0.15, -0.15, 0.15, z + 0.15, z + 0.55, C['dark']); abox(A, x - L / 2, x + L / 2, -0.11, 0.11, z + 0.55, z + 0.75, C['dark'])
    for z in (27.0, 28.4): acyl(A, (m1[0] + 0.2, 0, z), (m1[0] + 0.2, 0, z + 0.3), 0.1, lambda z_: w, seg=8)
    for y in (-2.4, 2.4): acyl(A, (WX0 + 1.4, y, zR + 0.22), (WX0 + 1.4, y, zR + 1.0), 0.6, lambda z: w, seg=12, r1=0.4)
    for sg in (1, -1): abox(A, 33.0, 33.8, sg * (WY + 0.5) - 0.12, sg * (WY + 0.5) + 0.12, zR - 0.35, zR - 0.05, C['dark'])
    # the funnel aft of the wheelhouse, raked aft, with its black top and the two exhausts
    f0 = [(13.7, -1.9), (19.0, -1.9), (19.0, 1.9), (13.7, 1.9)]; f1 = [(11.0, -1.3), (15.2, -1.3), (15.2, 1.3), (11.0, 1.3)]
    fz0, fz1 = zB + 0.2, 23.8; fzc = fz1 - 0.55
    pc = [(a[0] + (b[0] - a[0]) * (fzc - fz0) / (fz1 - fz0), a[1] + (b[1] - a[1]) * (fzc - fz0) / (fz1 - fz0)) for a, b in zip(f0, f1)]
    for i in range(4):
        j = (i + 1) % 4; nrm = (f0[j][1] - f0[i][1], -(f0[j][0] - f0[i][0]), 0.2)
        A.poly([(f0[i][0], f0[i][1], fz0), (f0[j][0], f0[j][1], fz0), (pc[j][0], pc[j][1], fzc), (pc[i][0], pc[i][1], fzc)], w, nrm)
        A.poly([(pc[i][0], pc[i][1], fzc), (pc[j][0], pc[j][1], fzc), (f1[j][0], f1[j][1], fz1), (f1[i][0], f1[i][1], fz1)], C['black'], nrm)
    A.poly([(x, y, fz1) for x, y in f1], C['black'], (0, 0, 1))
    for y in (-0.55, 0.55):
        tube_pts = [(13.6, y, fz1 - 0.2), (13.4, y, fz1 + 0.8), (12.6, y, fz1 + 1.6), (11.4, y, fz1 + 1.9)]
        for a, b in zip(tube_pts, tube_pts[1:]): acyl(A, a, b, 0.28, lambda z: w, seg=10)
    # the rescue boat in its recess on the starboard side
    bx0, bx1, by, bz = 15.0, 20.6, -SY + 0.95, zA + 0.55
    rb = [(bx0, 0.0, 0.0), (bx0 + 0.2, 0.75, 0.0), (bx1 - 1.3, 0.95, 0.0), (bx1 - 0.2, 0.45, 0.25), (bx1, 0.0, 0.45)]
    ring = lambda z, sc: [(x, by + sc * y, z + h) for x, y, h in rb] + [(x, by - sc * y, z + h) for x, y, h in reversed(rb[1:-1])]
    R0 = ring(bz, 0.72); R1 = ring(bz + 0.8, 1.0)
    for i in range(len(R0)):
        j = (i + 1) % len(R0); A.poly([R0[i], R0[j], R1[j], R1[i]], C['orange'], ((R0[i][0] + R0[j][0]) / 2 - 17.8, (R0[i][1] + R0[j][1]) / 2 - by, 0))
    A.poly(list(reversed(R0)), C['orange'], (0, 0, -1)); A.poly(R1, C['dark'], (0, 0, 1))
    return [A.done(30)], [G.done(30)]


# ---------- the foredeck: crane, foremast, windlasses; the side: portholes ----------
def foredeck(fine=True):
    A = Acc('fore'); w = C['white']; sg_ = 18 if fine else 8
    px = 52.5; pz = z_deck(px)
    acyl(A, (px, 0, pz), (px, 0, pz + 2.4), 0.6, lambda z: w, seg=sg_)
    beam(A, (px, 0, pz + 2.6), (42.5, 0.3, pz + 3.0), 0.55, 0.7, w); beam(A, (42.5, 0.3, pz + 3.0), (48.5, 0.4, pz + 3.45), 0.4, 0.5, w)
    abox(A, 42.0, 43.0, -0.5, 1.1, z_deck(42.5), pz + 2.7, C['steel'])
    # the foremast, raked aft: white legs below, black above, with its platforms and lights
    b0 = (59.0, 0.0, z_deck(59.0)); t0 = (56.3, 0.0, 25.2)
    for sg in (1, -1): beam(A, (60.2, sg * 1.6, z_deck(60.2)), (57.9, 0.0, 20.6), 0.4, 0.4, w)
    beam(A, (57.9, 0, 20.6), t0, 0.5, 0.8, C['black'])
    abox(A, 56.4, 59.4, -1.3, 1.3, 20.6, 20.75, w); abox(A, 55.9, 57.9, -0.9, 0.9, 23.2, 23.32, w)
    abox(A, 56.5, 56.8, -0.15, 0.15, 23.32, 23.7, C['dark']); abox(A, 55.2, 58.1, -0.1, 0.1, 23.7, 23.9, C['dark'])
    for sg in (1, -1):
        acyl(A, (66.5, sg * 0.8, z_deck(66.5) + 0.75), (66.5, sg * 2.0, z_deck(66.5) + 0.75), 0.55, lambda z: C['winch'], seg=sg_)
        abox(A, 65.9, 67.1, (0.4 if sg > 0 else -2.2), (2.2 if sg > 0 else -0.4), z_deck(66.5), z_deck(66.5) + 0.5, C['winch'])
        for x in (46.0, 62.0, 69.0): acyl(A, (x, sg * (hbz(x, z_deck(x)) - 0.7), z_deck(x)), (x, sg * (hbz(x, z_deck(x)) - 0.7), z_deck(x) + 0.6), 0.2, lambda z: C['steel'], seg=8)
    acyl(A, (71.2, 0, z_deck(71.2)), (71.2, 0, z_deck(71.2) + 2.5), 0.08, lambda z: w, seg=8)
    # portholes in the blue, and the anchors
    for sg in (1, -1):
        for x in [8.0 + 4.2 * k for k in range(9)]:
            y = hbz(x, 11.2) + 0.015; acyl(A, (x, sg * y, 11.2), (x, sg * (y + 0.02), 11.2), 0.24, lambda z: C['dark'], seg=10 if fine else 6)
        x = 68.4; y = hbz(x, 13.6) + 0.02
        A.poly([(x - 0.7, sg * y, 13.0), (x + 0.7, sg * y, 13.2), (x + 0.7, sg * y, 14.2), (x - 0.7, sg * y, 14.0)], C['dark'], (0, sg, 0))
    return [A.done(30)]


def build(fine=True):
    solids = build_hull(fine) + decks(fine) + underwater(fine) + aft_deck(fine)
    o, g = superstructure(fine); solids += o
    solids += foredeck(fine)
    return [s for s in solids if s], [x for x in g if x]


def to_game(p): return (-p[1], p[2] - WL, -(p[0] - XM))
def to_game_n(n): return (-n[1], n[2], -n[0])

def anchors():
    G = lambda x, y, z: [round(v, 3) for v in to_game((x, y, z))]
    zA = z_deck(27.0); zW = zA + 2.95; zR = zW + 3.2; zd = z_deck(6.0)
    return {'eye': G(35.6, -1.0, zW + 1.75), 'skipperAt': G(35.2, -1.0, zW), 'hp': -0.10, 'fov': 58,
            'crewSpots': [G(9.6, 3.2, zd) + [1.57], G(12.4, -3.6, zd) + [0.0], G(6.0, -5.6, zd) + [3.14], G(15.6, 6.5, z_deck(15.6)) + [0.0]],
            'lights': [[G(23.1, 0, 28.6), [1, 0.95, 0.85]], [G(33.4, WY + 0.5, zR - 0.2), [1, 0.12, 0.1]], [G(33.4, -WY - 0.5, zR - 0.2), [0.1, 1, 0.35]],
                       [G(XA + 0.3, 0, z_top(XA) + 1.2), [1, 0.95, 0.85]], [G(56.6, 0, 23.0), [1, 0.95, 0.85]], [G(PB[0], PB[1], z_deck(PB[0]) + 10.9), [1, 0.95, 0.85]]],
            'deck': {'y': round(zd - WL, 3), 'z': round(-(6.0 - XM), 3)}, 'gw': round(z_top(20.0) - WL, 3),
            'stern': round(XM - XA, 3), 'bow': round(-(XF - XM), 3), 'side': HB, 'beam': 15.5, 'pl': 30.0, 'rl': 5.9, 'open': False, 'hand': False,
            'pole': G(XA + 0.8, 2.0, z_top(XA) + 3.0), 'hauler': G(22.0, -7.6, z_deck(22.0) + 1.0), 'filler': G(28.0, 7.6, z_deck(28.0) + 0.3),
            # the pelagic trawl (view3d.js TRAWL): the doors at the stern quarters, the drum, over the stern roller
            'trawl': {'door': G(GAL_X, GAL_Y, gal_z()), 'doorW': TR.DOOR_W, 'doorH': TR.DOOR_H, 'rampTop': G(XA + 2.0, 0, z_top(XA) + 0.6), 'rampFoot': G(XA + 0.1, 0, z_top(XA) + 0.55),
                      'drum': G(DRUM_X, 0, z_deck(DRUM_X) + 1.9), 'winch': G(13.2, 5.4, z_deck(13.2) + 1.25), 'block': G(PB[0], PB[1], z_deck(PB[0]) + 9.6)},
            # the purse seine (view3d.js SEINE): the bin, the stern roller it runs over, the power block, the purse davit's blocks,
            # the starboard side amidships where the bunt comes alongside
            'seine': {'bin': G((BIN_X0 + BIN_X1) / 2, (BIN_YS + BIN_YP) / 2, z_deck(4.0) + 1.3), 'stern': G(XA + 0.1, 0, z_top(XA) + 0.55),
                      'block': G(PB[0], PB[1], z_deck(PB[0]) + 9.6), 'purse': G(22.0, -8.9, z_deck(22.0) + 2.6), 'side': G(24.0, -HB, 0.0 + WL)}}


SHOTS = [('bow3q', (120.0, -68.0, 24.0), (34.0, 0, 11.0), 35), ('stern3q', (-48.0, 52.0, 30.0), (22.0, 0, 12.0), 35), ('side', (34.0, -128, 12.0), (34.0, 0, 13.0), 35),
         ('above', (90.0, -58.0, 76.0), (34.0, 0, 9.0), 35), ('deck', (-8.0, -16.0, 30.0), (12.0, 0, 14.0), 30)]

def main():
    os.makedirs(OUT, exist_ok=True)
    reset(); colours()
    solids, glass = build(True)
    join(solids, 'BOAT0'); join(glass, 'GLASS0')
    show = []
    for sg in (1, -1):
        d = TR.door_part(); d.location = (GAL_X, sg * GAL_Y, gal_z()); d.rotation_euler = (0, 0, 0 if sg > 0 else math.pi); show.append(d)
    nr = TR.netroll_part(); nr.location = (DRUM_X, 0, z_deck(DRUM_X) + 1.9); nr.scale = (1.3, 1.4, 1.3); show.append(nr)
    # a sea big enough for her (beauty's own is 120 m square)
    bm = bmesh.new(); s_ = 170; bm.faces.new([bm.verts.new(p) for p in ((-s_, -s_, WL), (s_, -s_, WL), (s_, s_, WL), (-s_, s_, WL))])
    obj_from_bm('water', bm, [mat('water', (0.03, 0.09, 0.12), 0.9)])
    if 'fast' not in sys.argv: beauty(OUT, 'np', WL, SHOTS)
    for o in show: bpy.data.objects.remove(o, do_unlink=True)
    ex = {'frame': 'kystfiske: x starboard, y up from the waterline, z aft; metres', 'type': 'pelagisk', 'name': 'Purse seiner and pelagic trawler (75 m)',
          'len': 75.5, 'beam': 15.5, 'draft': 8.6, 'anchors': anchors()}
    xp = lambda p: (-p[1], p[2], -p[0]); xn = lambda n: (-n[1], n[2], -n[0])
    more = [{'name': 'door', 'obj': lambda: TR.door_part(), 'xf_p': xp, 'xf_n': xn, 'ao': True},
            {'name': 'codend', 'obj': lambda: TR.codend_part(), 'xf_p': xp, 'xf_n': xn},
            {'name': 'netroll', 'obj': lambda: TR.netroll_part(), 'xf_p': xp, 'xf_n': xn}]
    export_boat(build, to_game, to_game_n, OUT, 'not75.glb', os.path.join(ROOT, 'src', 'data', 'boat-not75.b64'), ex,
                side=(os.path.join(ROOT, 'src', 'data', 'boat-not75-side.b64'), 34.0, 14.0, 82.0), dry='dry' in sys.argv, more=more)


if __name__ == '__main__':
    main()
