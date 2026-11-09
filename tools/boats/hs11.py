"""The new speed sjark (sjarkny: «Ny hurtigsjark 10,99 m, 650 hk», built 2027 at the yard in Finnsnes): a big, beamy hard-chined
workboat after the general arrangement the first script measured (13.10.2026, 131.7 px/m; Jonas showed it again 02.11.2026: «Dette er
bortimot hva jeg ønsker … Gjør den mer lik tegningen. Altså hele båten»; the drawing is not in the repository): LOA 10.99, BOA 4.68,
dmax 2.06, depth 2.40, 42 t at the max waterline, 16 t light, the propeller in a nozzle. The plumb stem over a rounded forefoot, upright
topsides on a hard chine low down, a shallow V with a keel falling aft to the nozzle's foot, bilge keels, the white strake at the deck,
six freeing ports a side, the bulwarks level aft (2.87) with a step up at the wheelhouse to the forecastle's (3.08). The wheelhouse fills
the deck's width forward of 6.34 with a reverse-raked windscreen, its sole a step over the working deck; aft of it the closed deckhouse
to port and the open hauling station to starboard under one long roof from 3.15; a raked pylon mast with a platform; the crane on a
locker in the port quarter, the hold's hatch aft in the middle.

Rebuilt 01.-02.11.2026 after the pilot boat's way of working (hurtig11.py the template for the code, not the shape: Jonas 02.11.2026 «Den
kan ikke være for lik den andre hurtigsjarken»). The old hull was two loose grids, a transom grid, a skeg, a sole and a nozzle of their
own, the freeing ports dark patches, the cabin a box, the screens leaned away from the skipper and the gutting table was modelled in. Now
the hull is ONE surface: both sides from the keel's underside, the bottom, the chine with its flat, the topsides, the white rubbing
strake on the knuckle, the bulwarks with the hauling port's notch to starboard, the transom, the caps, the insides, the working deck,
the bulkhead and the forecastle deck share their points (Mesh). Openings are real holes, cut with a boolean and lined.

Nothing that can be bought is modelled in (the game sets the kit at the places in kit, 19.10.2026; Jonas 18.10.2026): no hauler, no tubs,
no gutting bench (the game's), no liferaft, no radar, no ring buoys, no crane (on the locker in the starboard quarter, its pedestal).
No maker's or yard's name anywhere (CLAUDE.md).

    pip install bpy==4.5.4   (Python 3.11)
    python3 tools/boats/hs11.py            -> src/data/boat-hs11.b64 (+ the side picture), renders in tools/boats/out/
    python3 tools/boats/hs11.py fast       -> the same without the renders
    python3 tools/boats/hs11.py fast dry   -> no renders, the GLB only in tools/boats/out
    python3 tools/boats/hs11.py check      -> the checks against the tables, the data, the rules and the game's demands only

Frame: x forward from the transom, y to port, z up from the base line; the waterline is z = WL."""
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy, bmesh
from bpyutil import *
import potplaces   # the stacks of conical pots (OB16, tools/boats/potplaces.json)
import bpyutil
import fittings as F
from mathutils import noise

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE)); OUT = os.path.join(HERE, 'out')
L = 10.99; BEAM = 4.68; DRAFT = 2.06; DISP = 15.0            # VESSELS.sjarkny
DMAX, LIGHT = 42.0, 16.0     # the drawing: the displacement at the max waterline and the lightship (G)
WL = 1.18; XA = 0.0; XF = 10.99; XM = (XA + XF) / 2
ZMD = 2.11                   # the working deck aft and under the wheelhouse (D: 2.11)
ZFD = 2.98                   # the forecastle deck forward of the wheelhouse, flush with the bulwark's top less a toe rail (D 3.08)
ZWH = 2.38                   # the wheelhouse's sole, a step over the deck (D 2.36; 1.92 under the roof)
X_STEP = 8.55                # the bulkhead from the working deck up to the forecastle deck, under the wheelhouse's front (D)


# ---------- the lines (D: the drawing above the water; the bottom drawn new as a planing V, chosen 01.11.2026; metres) ----------
def ss(a, b, x): t = max(0.0, min(1.0, (x - a) / (b - a))); return t * t * (3 - 2 * t)
_PC = {}
def pchip(tab, x):
    """a smooth curve through the table's points (monotone cubic, Fritsch-Carlson): no kink where the slope changes (fair.py)"""
    k = id(tab)
    if k not in _PC:
        xs = [p[0] for p in tab]; ys = [p[1] for p in tab]; n = len(xs)
        d = [(ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]) for i in range(n - 1)]
        m = [d[0]] + [0.0 if d[i - 1] * d[i] <= 0 else 2 / (1 / d[i - 1] + 1 / d[i]) for i in range(1, n - 1)] + [d[-1]]
        _PC[k] = (xs, ys, m)
    xs, ys, m = _PC[k]
    if x <= xs[0]: return ys[0] + m[0] * (x - xs[0])
    if x >= xs[-1]: return ys[-1] + m[-1] * (x - xs[-1])
    for i in range(len(xs) - 1):
        if xs[i] <= x <= xs[i + 1]:
            h = xs[i + 1] - xs[i]; t = (x - xs[i]) / h
            return (2 * t ** 3 - 3 * t * t + 1) * ys[i] + (t ** 3 - 2 * t * t + t) * h * m[i] + (-2 * t ** 3 + 3 * t * t) * ys[i + 1] + (t ** 3 - t * t) * h * m[i + 1]
KEEL = [(XA, 0.06), (1.0, 0.02), (5.0, -0.14), (7.5, -0.22), (8.6, -0.24), (9.4, -0.13), (9.9, 0.02), (10.3, 0.20), (10.67, 0.48), (10.82, 0.84), (10.93, 2.00), (XF, 3.08)]   # the body's bottom on the centreline, the forefoot's curve, the plumb stem (D: overlaid 02.11.2026)
def z_keel(x): return pchip(KEEL, x)
X_CE, X_KE = 10.80, 10.938   # where the chine and the knuckle run onto the stem (D: the chine at 0.8, the strake level to the stem)
CHZ = [(XA, 0.40), (3.0, 0.46), (5.5, 0.50), (8.0, 0.58), (9.5, 0.68), (10.4, 0.80), (X_CE, z_keel(X_CE))]   # the hard chine (D: the line from 0.34 at the transom to 0.8 at the stem)
CHY = [(XA, 2.12), (3.0, 2.22), (6.5, 2.22), (8.0, 2.10), (9.0, 1.80), (9.8, 1.32), (10.4, 0.78), (10.72, 0.30), (X_CE, 0.0)]
KNZ = [(XA, 1.99), (5.0, 2.00), (8.0, 2.03), (9.5, 2.06), (10.6, 2.08), (X_KE, z_keel(X_KE))]   # the knuckle under the white strake (D: the line at 2.09-2.16)
KNY = [(XA, 2.21), (3.0, 2.30), (7.0, 2.30), (8.4, 2.24), (9.4, 2.03), (10.2, 1.58), (10.6, 1.08), (10.82, 0.58), (X_KE, 0.0)]
SHZ = [(XA, 2.87), (6.0, 2.87), (6.6, 3.08), (XF, 3.08)]   # the bulwarks' top: level aft (D 2.87), a step at the wheelhouse up to the forecastle's (D 3.08)
SHY = [(XA, 2.22), (3.0, 2.31), (7.0, 2.31), (8.4, 2.26), (9.4, 2.07), (10.2, 1.64), (10.7, 1.04), (10.92, 0.44), (XF, 0.0)]
def z_ch(x): return max(z_keel(x), pchip(CHZ, x)) if x < X_CE else z_keel(x)
def y_ch(x): return pchip(CHY, x) if x < X_CE else 0.0
def z_kn(x): return max(z_keel(x), pchip(KNZ, x)) if x < X_KE else z_keel(x)
def y_kn(x): return pchip(KNY, x) if x < X_KE else 0.0
def z_sh(x): return 2.87 + 0.21 * ss(6.26, 6.50, x)            # (D: the step is a short slope at 6.26-6.48)
def y_sh_(x): return pchip(SHY, x)
# the hauling port: a notch 0.30 m deep in the starboard bulwark under the long roof, just aft of the wheelhouse (D: the hauler at 5.6)
HP0, HP1, HPD = 5.25, 5.95, 0.30
def notch(x): return HPD * ss(HP0 - 0.05, HP0 + 0.05, x) * ss(HP1 + 0.05, HP1 - 0.05, x)
# the deep keel (deadwood) under the body, falling aft to the nozzle's foot (D: the keel line from the forefoot to 0.876 under the base
# line, a drag of 0.7 degrees on the waterline), the bottom's shape, the chine's flat, the rubbing strake
X_SA = 1.15; Z_SKEG = -0.88; X_SF = 9.8
def skeg_bottom(x):
    if x < X_SA or x >= X_SF: return None
    zb = Z_SKEG + (x - X_SA) * 0.065                              # (D: the keel line rising straight from 0.82 under the base line, 0.33 at 8.6)
    zb = zb + (z_keel(x) - zb) * ss(8.0, 9.3, x)                  # running into the forefoot's curve
    return zb if zb < z_keel(x) - 1e-3 else None
SK_W, SK_R = 0.08, 0.15      # the keel's half width at its foot and at its root
CV = 0.0                    # the bottom's shape: a straight V
def bf(t): return t + CV * t * (1 - t)
RAILS = (0.36, 0.68); RAIL_W = 0.05; RAIL_D = 0.016
def rail_f(x): return 0.0       # no spray rails: a displacement hull (D)
CHF = 0.035                  # the chine's flat
def chf(x): return CHF * ss(10.8, 10.2, x)
BULGE = 0.008                # the topsides nearly straight and upright (D)
RH, RW = 0.05, 0.045         # the strake: half its height, how far it stands out
def strake_f(x): return 1.0 - ss(10.8, 10.97, x)
Z_AF = WL - 0.03; Z_BT = WL + 0.07; SLB = 0.012              # the antifouling and the black boot top, rising 12 mm a metre forward (planliste kap. 29)
def paint_line(x, z0): return z0 + SLB * (x - XM)
# no speed stripe on her (D: the petrol hull, the white strake): the section keeps its band, empty
def stripe_z(x): return z_ch(x) + (z_kn(x) - z_ch(x)) * 0.5
def stripe_h(x): return 0.0
DASH = []
def stripe_on(x): return False


# ---------- the sections ----------
def tops(x, sg=1):
    """the knuckle, the sheer (with the notch to starboard) as (y, z)"""
    zs = z_sh(x) - (notch(x) if sg < 0 else 0.0)
    return (y_kn(x), z_kn(x)), (y_sh_(x), zs)

def bulwark_line(x, sg=1, n=16):
    """the flared bulwark from the knuckle to the bulwark top, rising (the full sheer's flare, cut at the notch)"""
    (yn, zn), (ys, zs0) = tops(x, 1); zs = zs0 - (notch(x) if sg < 0 else 0.0)
    P = [(yn + (ys - yn) * (1 - (1 - t) ** 1.6), zn + (zs0 - zn) * t) for t in [k / n for k in range(n + 1)]]
    return clip(P, zs) if sg < 0 and zs < zs0 - 1e-6 else P

def topside_line(x, n=14):
    """the topside from the chine's flat up to the knuckle, bulging out a little"""
    yc, zc = y_ch(x), z_ch(x); y1, z1 = yc + chf(x), zc + 0.012 * min(1.0, chf(x) / CHF + 0.01)
    (yn, zn), _ = tops(x)
    if zn <= z1 + 1e-4: return [(y1, z1), (max(yn, y1), z1 + 1e-4)]
    d = (yn - y1, zn - z1); ln = math.hypot(*d); nv = (d[1] / ln, -d[0] / ln)
    b = BULGE * ss(10.8, 9.9, x)
    return [(y1 + d[0] * t + nv[0] * b * 4 * t * (1 - t), z1 + d[1] * t + nv[1] * b * 4 * t * (1 - t)) for t in [k / n for k in range(n + 1)]]

def bot(x, y):
    """the bottom's height at half-breadth y (between the centreline and the chine)"""
    zk, yc, zc = z_keel(x), y_ch(x), z_ch(x)
    if yc < 1e-6: return zk
    return zk + (zc - zk) * bf(max(0.0, min(1.0, y / yc)))

def outline(x, sg=1):
    """the smooth half-section (no skeg, no rails) from the centreline to the bulwark top, rising: for y_at and z_on"""
    yc = y_ch(x); P = [(yc * k / 10, bot(x, yc * k / 10)) for k in range(11)]
    for q in topside_line(x) + bulwark_line(x, sg)[1:]:
        if q[1] > P[-1][1] + 1e-6 or q[0] > P[-1][0] + 1e-6: P.append((q[0], max(q[1], P[-1][1] + 1e-7)))
    return P

def clip(P, ztop):
    out = [P[0]]
    for a, b in zip(P, P[1:]):
        if b[1] >= ztop:
            t = (ztop - a[1]) / max(1e-9, b[1] - a[1]); out.append((a[0] + (b[0] - a[0]) * t, ztop)); return out
        out.append(b)
    return out

def z_on(P, y):
    if y <= P[0][0]: return P[0][1]
    for a, b in zip(P, P[1:]):
        if a[0] <= y <= b[0] and b[0] > a[0]: return a[1] + (b[1] - a[1]) * (y - a[0]) / (b[0] - a[0])
    return P[-1][1]

def at_z(P, z):
    if z <= P[0][1]: return P[0]
    for a, b in zip(P, P[1:]):
        if a[1] <= z <= b[1] and b[1] > a[1]: t = (z - a[1]) / (b[1] - a[1]); return (a[0] + (b[0] - a[0]) * t, z)
    return P[-1]

def along(P, z0, z1, n):
    """n points along the polyline P (rising in z) from height z0 to z1, evenly by length, the first after z0, the last at z1"""
    if z1 <= z0 + 1e-6:
        q = at_z(P, z0); return [q] * n
    pts = [at_z(P, z0)] + [p for p in P if z0 < p[1] < z1] + [at_z(P, z1)]
    Lc = [0.0]
    for a, b in zip(pts, pts[1:]): Lc.append(Lc[-1] + math.hypot(b[0] - a[0], b[1] - a[1]))
    out = []
    for k in range(1, n + 1):
        s = Lc[-1] * k / n
        for i in range(1, len(Lc)):
            if Lc[i] >= s - 1e-12:
                t = (s - Lc[i - 1]) / max(1e-12, Lc[i] - Lc[i - 1]); a, b = pts[i - 1], pts[i]; out.append((a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t)); break
    return out

NKB, NF = 3, 3               # rows down the skeg's side, and in the fillet at its root
_S = {}
def section(x, sg=1, fine=True):
    """the whole half-section at x on side sg as (y, z, kind) from the skeg's foot on the centreline to the bulwark top; the counts never
    change (points collapse where a band is empty: no skeg, no rails at the bow, the stem). Kinds: 'k' the skeg, 'f' its fillet, 'b' the
    bottom (with the rails), 'l' the chine's flat, 't' the topside, 'n' the speed stripe, 'r' the strake, 'w' the bulwark, 's' its top"""
    key = (round(x, 5), sg, fine)
    if key in _S: return _S[key]
    zk = z_keel(x); yc, zc = y_ch(x), z_ch(x); out = []
    nk = NKB if fine else 1; nf = NF if fine else 1
    zb = skeg_bottom(x)
    if zb is not None and zk - zb > 1e-4:
        f = min(1.0, (x - X_SA) / 0.06); g = ss(0.0, 0.40, zk - zb)            # (smooth where the skeg runs into the bottom: fair.py found a station kink at 7.30 with min())
        ww = SK_W * f * g; wr = SK_R * f * g; fw = 0.11 * f * g; b = zb
        zc_ = bot(x, wr); zt = max(b + 0.05 * g, zc_ - 0.07 * g); e1, e2 = 0.010 * g, (0.03 if fine else 0.015) * g
        out += [(0.0, b, 'k'), (ww * 0.55, b, 'k'), (ww * 0.92, b + e1, 'k'), (ww, b + e2, 'k')] if fine else [(0.0, b, 'k'), (ww, b + e2, 'k')]
        for i in range(1, nk + 1): t = i / nk; out.append((ww + (wr - ww) * t, b + e2 + (zt - b - e2) * t, 'k'))
        y1 = wr + fw; z1 = bot(x, y1)
        for i in range(1, nf + 1):
            t = i / (nf + 1); u = 1 - t
            out.append((u * u * wr + 2 * u * t * wr + t * t * y1, u * u * zt + 2 * u * t * zc_ + t * t * z1, 'f'))
    else:
        y1 = 0.0
        out += [(0.0, zk, 'k')] * ((4 if fine else 2) + nk) + [(0.0, zk, 'f')] * nf
    # the bottom out to the chine, with the two spray rails (each a flat underside and an upright outer face)
    def seg(ya, yb_, n): return [(ya + (yb_ - ya) * i / n, bot(x, ya + (yb_ - ya) * i / n), 'b') for i in range(1, n + 1)]
    if fine:
        fr = rail_f(x); w = RAIL_W * fr; ya = y1
        for k, (tr, n) in enumerate(zip(RAILS, (5, 4))):
            yr = max(ya, yc * tr); out += seg(ya, yr, n)
            out += [(yr + w, bot(x, yr) - RAIL_D * fr, 'b'), (yr + w + 0.004 * fr, bot(x, yr + w + 0.004 * fr), 'b')]
            ya = yr + w + 0.004 * fr
        out += seg(ya, max(ya, yc), 4)
    else:
        out += seg(y1, max(y1, yc), 3)
    # the chine's flat, the topside with the stripe, the strake on the knuckle, the bulwark
    T = topside_line(x); out.append((T[0][0], T[0][1], 'l'))
    zl, zn = T[0][1], T[-1][1]; cl = lambda z: min(zn, max(zl, z))
    s0 = cl(stripe_z(x)); s1 = cl(stripe_z(x) + stripe_h(x))
    out += [(yy, zz, 't') for yy, zz in along(T, zl, s0, 5 if fine else 1)]
    out += [(yy, zz, 'n') for yy, zz in along(T, s0, s1, 1)]
    top_ = along(T, s1, zn, 3 if fine else 1); out += [(yy, zz, 't') for yy, zz in top_[:-1]] + [(top_[-1][0], top_[-1][1], 'r')]
    Bw = bulwark_line(x, sg); zs = Bw[-1][1]; fs = strake_f(x); zr = zn + RH
    for dz, off in (((-0.033, 0.38), (-0.020, 0.74), (-0.007, 0.97), (0.007, 0.97), (0.020, 0.74), (0.033, 0.38), (RH, 0.0)) if fine else ((0.0, 1.0), (RH, 0.0))):
        zq = min(zs, zr + dz); yy, zz = at_z(Bw, zq); out.append((yy + RW * off * fs, zz, 'r' if off > 0 else 'w'))
    out += [(yy, zz, 'w') for yy, zz in along(Bw, min(zs, zr + RH), zs, 4 if fine else 1)[:-1]]
    out.append((Bw[-1][0], zs, 's'))
    _S[key] = out; return out

def y_at(x, z, sg=1):
    """the outside's half-breadth at x and height z (the body; 0 under the keel line)"""
    P = outline(x, sg)
    if z <= P[0][1]: return 0.0
    return at_z(P, z)[0]

def stations(fine=True):
    sp = [XA, X_SA - 0.002, X_SA, X_SA + 0.05, X_SA + 0.10, X_STEP, X_CE, X_KE, 8.6] + DASH
    if fine:
        sp += [HP0 - 0.05, HP0 - 0.017, HP0 + 0.017, HP0 + 0.05, HP1 - 0.05, HP1 - 0.017, HP1 + 0.017, HP1 + 0.05]
        xs = [0.03, 0.07, 0.11, 0.16] + [0.22 + 0.06 * i for i in range(164)] + [10.0 + 0.03 * i for i in range(33)]
        sp += stem_stations(z_keel, [lambda x: paint_line(x, Z_AF), lambda x: paint_line(x, Z_BT), lambda x: z_kn(x) + RH * 2], 8.0, XF - 0.012)
    else:
        xs = [0.07, 0.6, 1.6, 2.4, 3.5, 3.9, 4.3, 5.0, 6.8, 7.8, 8.6, 9.3, 9.9, 10.3, 10.5, 10.75, 10.88]
    xs = [x for x in xs if all(abs(x - s) > 0.008 for s in sp)] + sp + [XF - 0.006, XF]
    return sorted(set(round(x, 5) for x in xs if XA <= x <= XF))


# ---------- colours (the first script's): the petrol hull and bulwarks, the white rubbing strake and caps, the white house, a light grey
# roof, a grey deck, a dark grey bottom under a black boot top (paint zones as the first script: 1 the hull, 2 the strake and the caps,
# 3 the superstructure, 4 the decks; 10j-paint.js) ----------
C = {}
def colours():
    w = lambda n, rgb, g=0.4, z=0, metal=0.0, emit=0.0: C.__setitem__(n, mat(n, rgb, g, zone=z, metal=metal, emit=emit))
    w('af', (0.08, 0.08, 0.09), 0.15); w('boot', (0.04, 0.04, 0.05), 0.45); w('hull', (0.04, 0.27, 0.31), 0.7, 1)
    w('strake', (0.92, 0.92, 0.90), 0.55, 2); w('white', (0.92, 0.92, 0.90), 0.55, 3)
    w('roofy', (0.80, 0.80, 0.78), 0.4, 3); w('inner', (0.86, 0.86, 0.84), 0.3); w('deck', (0.40, 0.42, 0.42), 0.12, 4); w('nonslip', (0.37, 0.39, 0.39), 0.06, 4)
    w('steel', (0.78, 0.80, 0.82), 0.85, 0, 0.85); w('chrome', (0.86, 0.87, 0.89), 0.95, 0, 0.9); w('alu', (0.72, 0.74, 0.76), 0.6, 0, 0.7)
    w('plate', (0.66, 0.68, 0.70), 0.7, 0, 0.8); w('dark', (0.10, 0.11, 0.12), 0.25); w('black', (0.04, 0.04, 0.05), 0.4); w('rubber', (0.05, 0.05, 0.06), 0.2)
    w('frame', (0.05, 0.05, 0.06), 0.45); w('screen', (0.03, 0.05, 0.07), 0.9); w('bezel', (0.10, 0.10, 0.11), 0.5); w('cush', (0.16, 0.17, 0.20), 0.35)
    w('switch', (0.20, 0.21, 0.22), 0.4); w('board', (0.20, 0.21, 0.23), 0.35); w('cabin', (0.05, 0.05, 0.06), 0.2); w('sole', (0.30, 0.31, 0.32), 0.2)
    w('prop', (0.70, 0.52, 0.27), 0.8, 0, 0.9); w('anode', (0.55, 0.56, 0.55), 0.2); w('wood', (0.58, 0.38, 0.20), 0.3); w('red', (0.72, 0.18, 0.08), 0.5)
    w('rope2', (0.20, 0.42, 0.62), 0.2); w('fender', (0.08, 0.20, 0.42), 0.4); w('orange', (0.95, 0.35, 0.08), 0.5)
    w('lampR', (0.90, 0.10, 0.08), 0.8, 0, 0, 0.5); w('lampG', (0.10, 0.80, 0.25), 0.8, 0, 0, 0.5); w('lampW', (1.0, 0.97, 0.88), 0.8, 0, 0, 0.5)
    w('lens', (0.95, 0.94, 0.85), 0.9)
    C['glass'] = mat('glass', (0.05, 0.08, 0.11), 0.95)


# ---------- the wear: per corner, so it runs across faces (B16; 2009, gelcoat, 17 years) ----------
def n3(x, y, z=0.0): return noise.noise(V((x, y, z)))
def toward(m, rgb, k):
    base = m['rgb']; return [1 + (rgb[i] / max(base[i], 1e-3) - 1) * k for i in range(3)]

FREE = {1: [(0.34, 0.38), (2.48, 0.38)], -1: [(0.34, 0.38), (1.18, 0.38), (2.05, 0.38), (2.92, 0.38), (3.68, 0.38), (4.52, 0.38)]}   # the freeing ports at the deck (D: six a side; to port the locker and the house stand against the bulwark)
FREE_H = 0.15                # their height, from 2 cm over the deck (the strake's top is under it)
EXH = (-0.62, 1.58); EXH_R = 0.06                             # the wet exhaust in the transom (y, z)
BILGE = (5.20, -1, WL + 0.45); BILGE_R = 0.02                 # the bilge pump's outlet
def wear(p, m, n):
    """a new boat (2027): only the gelcoat's sheen varying, a little grime at the boot top and under the freeing ports, the deck darker
    where they stand"""
    x, y, z = p; nm = m.name; side = 1 if y > 0 else -1
    if nm == 'hull':
        g = 0.98 + 0.03 * n3(x * 3.0, z * 6.0, side)
        g *= 1 - 0.05 * ss(0.10, 0.0, z - paint_line(x, Z_BT))
        for x0, l in FREE[side]:
            g *= 1 - 0.05 * ss(0.06, 0.0, abs(x - x0 - l / 2) - l / 2 + 0.05) * ss(ZMD, ZMD - 0.5, z) * (z > WL + 0.1)
        return [g, g, g]
    if nm in ('boot', 'strake'):
        v = 0.95 + 0.06 * n3(x * 4.0, z * 9.0, side)
        return [v, v, v]
    if nm == 'af':
        v = 0.90 + 0.10 * n3(x * 2.5, z * 6.0, y * 2.0)
        return [v, v, v]
    if nm in ('white', 'roofy', 'inner'):
        v = 0.97 + 0.03 * n3(x * 5.0, y * 5.0, z * 5.0)
        if nm == 'inner': v -= 0.06 * ss(0.15, 0.0, z - dk(x))
        return [v, v, v]
    if nm in ('deck', 'nonslip'):
        v = 0.94 + 0.07 * n3(x * 5.0, y * 5.0, 1.0)
        v *= 1 - 0.08 * ss(0.8, 0.0, math.hypot(x - HXR, y + 1.7)) - 0.06 * ss(0.7, 0.0, math.hypot(x - 3.0, y - 1.5))   # where they work
        return [v, v, v]
    return None

def tint(o, f=wear):
    bm = bmesh.new(); bm.from_mesh(o.data); lay = bm.loops.layers.float_color.new('TINT'); mats = [s.material for s in o.material_slots]
    for fc in bm.faces:
        m = mats[fc.material_index]; fc.normal_update()
        for l in fc.loops:
            t = f(l.vert.co, m, fc.normal)
            l[lay] = (t[0], t[1], t[2], 1.0) if t is not None else (1.0, 1.0, 1.0, 1.0)
    bm.to_mesh(o.data); bm.free(); return o


# ---------- one surface: a mesh whose faces share their points (havsjark35.py) ----------
class Mesh:
    def __init__(s, name):
        s.name = name; s.bm = bmesh.new(); s.d = {}; s.mats = []; s.ix = {}; s.kind = s.bm.faces.layers.int.new('kind')
    def mi(s, m):
        if m.name not in s.ix: s.ix[m.name] = len(s.mats); s.mats.append(m)
        return s.ix[m.name]
    def v(s, p):
        if isinstance(p, bmesh.types.BMVert): return p
        k = (round(p[0], 5), round(p[1], 5), round(p[2], 5)); q = s.d.get(k)
        if q is None: q = s.bm.verts.new(V(p)); s.d[k] = q
        return q
    def f(s, pts, m, out=None, kind=0):
        vs = []
        for p in pts:
            q = s.v(p)
            if q not in vs: vs.append(q)
        if len(vs) < 3: return None
        try: fc = s.bm.faces.new(vs)
        except ValueError: return None
        fc.normal_update()
        if fc.calc_area() < 1e-10: s.bm.faces.remove(fc); return None
        fc.material_index = s.mi(m); fc[s.kind] = kind
        if out is not None and fc.normal.dot(V(out)) < 0: fc.normal_flip()
        return fc
    def strip(s, R, m, out, kind=0):
        for i in range(len(R) - 1):
            for j in range(len(R[i]) - 1):
                mm = m(i, j) if callable(m) else m
                if mm is None: continue
                s.f([R[i][j], R[i + 1][j], R[i + 1][j + 1], R[i][j + 1]], mm, out(i, j) if callable(out) else out, kind)
    def done(s, angle=30):
        bmesh.ops.remove_doubles(s.bm, verts=s.bm.verts[:], dist=1e-5)
        bmesh.ops.dissolve_degenerate(s.bm, edges=s.bm.edges[:], dist=1e-6)
        return shade(obj_from_bm(s.name, s.bm, s.mats), angle)


# ---------- the hull: the outside over the skeg, the transom, the bulwarks' caps and insides, the decks ----------
CAP = 0.07                   # the bulwark's cap, its width
TT = 0.07                    # the transom's thickness: the deck and the transom's inside start this far forward of its outside
def z_deck(x): return ZMD
def z_bk(x): return ZFD + max(0.0, z_sh(x) - 0.10 - ZFD) * ss(9.82, 10.62, x)   # the forecastle deck, level (D)
def dk(x): return z_deck(x) if x < X_STEP else z_bk(x)
def ysh(x, sg=1): return section(x, sg)[-1][0]
def z_cap(x, sg=1): return section(x, sg)[-1][1]
def ycap(x, sg=1): return max(0.0, ysh(x, sg) - CAP)
def ybw(x, sg=1): return max(0.0, y_at(x, dk(x), sg) - 0.065)       # the bulwark's foot on the deck (its inside leans in a little)
def camber(x, y):
    e = max(0.3, ybw(x)); return 0.05 * (1 - min(1.0, (y / e) ** 2))

HULL_MAT = {'k': 'hull', 'f': 'hull', 'b': 'hull', 'l': 'hull', 't': 'hull', 'n': 'hull', 'r': 'strake', 'w': 'hull', 's': 'strake'}
HULL_KIND = {'n': 1, 'r': 2, 'w': 1, 's': 2}
def hull_shell(M, fine=True):
    xs = stations(fine); S = {}
    for x in xs:
        for sg in (1, -1): S[(x, sg)] = [(x, y, z, k) for y, z, k in section(x, sg, fine)]
    for sg in (1, -1):
        for a, b in zip(xs, xs[1:]):
            Sa, Sb = S[(a, sg)], S[(b, sg)]
            for j in range(len(Sa) - 1):
                k = Sa[j][3]; dy = Sa[j + 1][1] - Sa[j][1]; dz = Sa[j + 1][2] - Sa[j][2]
                out = (0, sg * dz, -dy) if abs(dy) + abs(dz) > 1e-7 else (0, sg, 0)
                q = [(Sa[j][0], sg * Sa[j][1], Sa[j][2]), (Sb[j][0], sg * Sb[j][1], Sb[j][2]), (Sb[j + 1][0], sg * Sb[j + 1][1], Sb[j + 1][2]), (Sa[j + 1][0], sg * Sa[j + 1][1], Sa[j + 1][2])]
                if k == 'n' and not stripe_on((a + b) / 2): M.f(q, C['hull'], out, 1)        # the gaps between the dashes
                else: M.f(q, C[HULL_MAT[k]], out, HULL_KIND.get(k, 1))
    # the transom: strips across between the first station's two sides, facing aft
    Tp, Ts = S[(xs[0], 1)], S[(xs[0], -1)]
    for j in range(len(Tp) - 1):
        q = [(Tp[j][0], Tp[j][1], Tp[j][2]), (Ts[j][0], -Ts[j][1], Ts[j][2]), (Ts[j + 1][0], -Ts[j + 1][1], Ts[j + 1][2]), (Tp[j + 1][0], Tp[j + 1][1], Tp[j + 1][2])]
        k = Tp[j][3]; M.f(q, C['strake'] if k in 'rs' else C['hull'], (-1, 0, 0), 2 if k in 'rs' else 1)
    # ---- inside the bulwarks: the cap, the inside down to the deck, the deck across; the foredeck forward of the bulkhead ----
    ND = 12 if fine else 2
    def edge(x, sg):
        s = z_cap(x, sg); zd = dk(x)
        return [(x, sg * ysh(x, sg), s), (x, sg * ycap(x, sg), s + 0.012), (x, sg * (ycap(x, sg) - 0.006), s - 0.03), (x, sg * ybw(x, sg), zd)]
    def drow(x, fore=None):
        if fore is not None:
            keep = globals()['dk']; globals()['dk'] = (lambda q: z_bk(q)) if fore else (lambda q: z_deck(q))
        e = ybw(x); zd = dk(x)
        mid = [(x, e * (1 - 2 * i / ND), zd + camber(x, e * (1 - 2 * i / ND))) for i in range(1, ND)]
        r = edge(x, 1) + mid + list(reversed(edge(x, -1)))
        if fore is not None: globals()['dk'] = keep
        return r
    aft = [x for x in xs if TT - 1e-9 <= x < X_STEP - 1e-9] + [X_STEP]; fd = [x for x in xs if x >= X_STEP - 1e-9 and ysh(x) > 0.02]
    def em(j, n): return C['strake'] if j in (0, 1, n - 3, n - 2) else C['inner'] if j in (2, n - 4) else None
    def eo(j, n): return (0, 0, 1) if j in (0, 1, n - 3, n - 2) else (0, -1, 0) if j == 2 else (0, 1, 0) if j == n - 4 else (0, 0, 1)
    D = [drow(x, False) for x in aft]; n = len(D[0])
    M.strip(D, lambda i, j: em(j, n) or C['deck'], lambda i, j: eo(j, n))
    B = [drow(x, True) for x in fd]
    M.strip(B, lambda i, j: em(j, n) or C['nonslip'], lambda i, j: eo(j, n))
    # the bulkhead from the working deck up to the foredeck, across between the two rows at X_STEP
    M.strip([D[-1], B[0]], lambda i, j: None if j in (0, 1, n - 3, n - 2) else C['white'], (-1, 0, 0))
    last = B[-1]; M.f([last[0], last[n - 1]] + [last[n // 2]], C['white'], (0, 0, 1))
    # the transom's top: the cap from the outside's top aft of TT in to the inside's edge, and the inside down to the deck
    r0 = D[0]; tps = [x for x in xs if x < TT - 1e-9]
    port = [(S[(x, 1)][-1][0], S[(x, 1)][-1][1], S[(x, 1)][-1][2]) for x in tps]
    M.f(list(reversed(port)) + [(p_[0], -p_[1], p_[2]) for p_ in port] + [r0[n - 1], r0[n - 2], r0[1], r0[0]], C['strake'], (0, 0, 1))
    M.f([r0[1], r0[2], r0[3], r0[n - 4], r0[n - 3], r0[n - 2]], C['inner'], (1, 0, 0))
    return S


# ---------- the openings: real holes, cut with a boolean and lined (havsjark35.py) ----------
HOLD = (0.95, 2.25, -0.62, 0.62)                               # the fish hold's hatch aft in the middle (D: fish in bulk, under the crane)
HOLD_H = 0.10
HATCH_F = (8.95, 9.30, -0.24, 0.24)                            # the forward hatch on the forecastle deck

def rr_pts(cx, cy, w, h, r, n=4): return rrect(cx, cy, w, h, max(0.004, min(r, w / 2 - 0.002, h / 2 - 0.002)), n=n)
def circle(r, n=16): return [(r * math.cos(2 * math.pi * k / n), r * math.sin(2 * math.pi * k / n)) for k in range(n)]

def cutters():
    out = []
    for sg in (1, -1):
        for x0, l in FREE[sg]:                                 # through the bulwark: outside and inside
            xc = x0 + l / 2; out.append(((xc, sg * (ybw(xc, sg) + 0.03), ZMD + 0.02 + FREE_H / 2), (1, 0, 0), (0, 0, 1), rr_pts(0, 0, l, FREE_H, 0.03), 0.16))
    x0, x1, y0, y1 = HATCH_F; out.append((((x0 + x1) / 2, 0, ZFD + 0.03), (1, 0, 0), (0, 1, 0), rr_pts(0, 0, x1 - x0, y1 - y0, 0.05), 0.10))
    x0, x1, y0, y1 = HOLD; out.append((((x0 + x1) / 2, 0, ZMD + 0.03), (1, 0, 0), (0, 1, 0), rr_pts(0, 0, x1 - x0, y1 - y0, 0.04), 0.10))
    out.append(((0.0, 0, 0), (0, 1, 0), (0, 0, 1), [(EXH[0] + p, EXH[1] + q) for p, q in circle(EXH_R, 16)], 0.05))
    x, sb, zb_ = BILGE; out.append(((x, sb * y_at(x, zb_, sb), zb_), (1, 0, 0), (0, 0, 1), circle(BILGE_R, 12), 0.05))
    return out

def cut_holes(target, cuts=None):
    bm = bmesh.new()
    for o, u, v, poly, d in (cuts or cutters()):
        o, u, v = V(o), V(u), V(v); n = u.cross(v).normalized()
        a = [bm.verts.new(o + u * p + v * q - n * d) for p, q in poly]; b = [bm.verts.new(o + u * p + v * q + n * d) for p, q in poly]
        k = len(poly)
        for i in range(k): bm.faces.new([a[i], a[(i + 1) % k], b[(i + 1) % k], b[i]])
        bm.faces.new(a); bm.faces.new(list(reversed(b)))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new('cut'); bm.to_mesh(me); bm.free()
    cm = bpy.data.materials.get('cutmat') or bpy.data.materials.new('cutmat'); me.materials.append(cm)
    c = link(bpy.data.objects.new('cut', me))
    m = target.modifiers.new('cut', 'BOOLEAN'); m.operation = 'DIFFERENCE'; m.solver = 'EXACT'; m.object = c; m.material_mode = 'TRANSFER'
    try: m.use_hole_tolerant = True
    except AttributeError: pass
    dg = bpy.context.evaluated_depsgraph_get(); ev = target.evaluated_get(dg)
    me2 = bpy.data.meshes.new_from_object(ev); target.modifiers.clear(); old = target.data; target.data = me2; bpy.data.meshes.remove(old)
    ci = [i for i, mt in enumerate(me2.materials) if mt and mt.name.startswith('cutmat')]
    bm = bmesh.new(); bm.from_mesh(me2)
    bmesh.ops.delete(bm, geom=[f for f in bm.faces if f.material_index in ci], context='FACES')
    bm.to_mesh(me2); bm.free()
    for i in reversed(ci): me2.materials.pop(index=i)
    bpy.data.objects.remove(c)

def tube(A, ring, d, depth, m, m_end=None):
    """the inside of a hole, from its outline ring along d, depth deep, its faces turned in; closed at the end with m_end (else open)"""
    d = V(d).normalized(); P = [V(p) for p in ring]; c = sum(P, V()) / len(P); n = len(P)
    Q = [p + d * depth for p in P]
    for k in range(n):
        j = (k + 1) % n; mid = (P[k] + Q[j]) / 2
        A.poly([P[k], P[j], Q[j], Q[k]], m, (c + d * depth / 2) - mid)
    if m_end is not None: A.poly(Q, m_end, -d)

def linings(A, G, fine=True):
    s = lambda q: C['steel']
    # the freeing ports: the hole through the bulwark lined, open (havsjark35.py: no flaps, they read as black blocks)
    for sg in (1, -1):
        for x0, l in FREE[sg]:
            xc = x0 + l / 2; zc = ZMD + 0.02 + FREE_H / 2; o = rr_pts(xc, zc, l, FREE_H, 0.03, 3)
            ring = [V((p, sg * (y_at(p, q, sg) + 0.001), q)) for p, q in o]
            tube(A, ring, (0, -sg, 0), max(0.03, y_at(xc, zc, sg) - ybw(xc, sg) + 0.004), C['inner'])
    # the wet exhaust in the transom and the bilge outlet: a collar, dark inside
    ring = [(-0.001, EXH[0] + p, EXH[1] + q) for p, q in circle(EXH_R, 16)]
    tube(A, ring, (1, 0, 0), 0.08, C['dark'], C['black'])
    F.atorus(A, (-0.006, EXH[0], EXH[1]), (-1, 0, 0), EXH_R + 0.01, 0.008, lambda a: C['steel'], seg=16, rseg=4)
    xb, sb, zb_ = BILGE
    ring = [(xb + p, sb * (y_at(xb + p, zb_ + q, sb) + 0.001), zb_ + q) for p, q in circle(BILGE_R, 12)]
    tube(A, ring, (0, -sb, 0), 0.05, C['dark'], C['black'])
    F.atorus(A, (xb, sb * (y_at(xb, zb_, sb) + 0.005), zb_), (0, sb, 0), BILGE_R + 0.008, 0.005, lambda a: C['steel'], seg=12, rseg=4)
    # the forward hatch: its reveal into the cabin, an aluminium frame proud of the deck, the smoked acrylic lid
    x0, x1, y0, y1 = HATCH_F; o = rr_pts((x0 + x1) / 2, 0, x1 - x0, y1 - y0, 0.05, 4)
    top = lambda x, y: z_bk(x) + camber(x, y)
    ring = [(x, y, top(x, y) - 0.002) for x, y in o]
    tube(A, ring, (0, 0, -1), 0.06, C['inner'], C['cabin'])
    fo = rr_pts((x0 + x1) / 2, 0, x1 - x0 + 0.08, y1 - y0 + 0.08, 0.09, 4); zf = max(p[2] for p in ring) + 0.05
    F.loft(A, [[(x, y, top(x, y) - 0.004) for x, y in fo], [(x, y, zf) for x, y in fo]], lambda i: C['alu'], cap0=False, cap1=False)
    F.loft(A, [[(x, y, zf) for x, y in o], [(x, y, top(x, y) - 0.004) for x, y in o]], lambda i: C['alu'], cap0=False, cap1=False, out=lambda mid, cc: V((cc.x - mid.x, cc.y - mid.y, 0)))
    for k in range(len(o)):
        a, b = o[k], o[(k + 1) % len(o)]; c_, d_ = fo[(k + 1) % len(fo)], fo[k]
        A.poly([(a[0], a[1], zf), (b[0], b[1], zf), (c_[0], c_[1], zf), (d_[0], d_[1], zf)], C['alu'], (0, 0, 1))
    G.poly([(x, y, zf + 0.012) for x, y in rr_pts((x0 + x1) / 2, 0, x1 - x0 + 0.06, y1 - y0 + 0.06, 0.08, 4)], C['glass'], (0, 0, 1))
    if fine:
        for yy in (-0.1, 0.1): acyl(A, (x1 + 0.035, yy - 0.03, zf + 0.012), (x1 + 0.035, yy + 0.03, zf + 0.012), 0.009, s, seg=8)
    # the hold: a coaming round the hole, dark down into the hold, the aluminium tread plate lid on it with its hinges and lifting ring
    x0, x1, y0, y1 = HOLD; o = rr_pts((x0 + x1) / 2, 0, x1 - x0, y1 - y0, 0.04, 3)
    ring = [(x, y, ZMD + camber(x, y) - 0.03) for x, y in o]
    tube(A, ring, (0, 0, -1), 0.7, C['inner'], C['cabin'])
    zc_ = ZMD + max(camber(x, y) for x, y in o) + HOLD_H
    F.loft(A, [[(x, y, ZMD + camber(x, y) - 0.03) for x, y in o], [(x, y, zc_) for x, y in o]], lambda i: C['white'], cap0=False, cap1=False,
           out=lambda mid, cc: V((mid.x - cc.x, mid.y - cc.y, 0)))
    ob = rr_pts((x0 + x1) / 2, 0, x1 - x0 + 0.08, y1 - y0 + 0.08, 0.06, 3)
    F.loft(A, [[(x, y, zc_ + 0.002) for x, y in ob], [(x, y, zc_ + 0.03) for x, y in ob]], lambda i: C['alu'], cap0=False, cap1=True)
    A.poly([(x, y, zc_ + 0.002) for x, y in ob], C['alu'], (0, 0, -1))
    if fine:
        F.tread_plate(A, x0 - 0.02, x1 + 0.02, y0 - 0.02, y1 + 0.02, zc_ + 0.03, C['alu'], pitch=0.06)
        for yy in (y0 + 0.25, y1 - 0.25): acyl(A, (x1 + 0.04, yy - 0.04, zc_ + 0.02), (x1 + 0.04, yy + 0.04, zc_ + 0.02), 0.012, s, seg=8)
        F.atorus(A, (x0 + 0.08, 0.0, zc_ + 0.032), (0, 0, 1), 0.03, 0.005, lambda a: C['steel'], seg=14, rseg=5)


# ---------- the wheelhouse forward on the working deck: the walls with real windows and a door, its sole a step over the deck, the side
# decks beside it, one thin roof over it running aft over the hauling station on the shelter's screens (D: its plan, roof, windows) ----------
WX0 = 6.34                   # the wheelhouse's aft wall at the bulwark's step (D)
WXC, WXF = 8.05, X_STEP + 0.02                                 # the sides' forward end and the front's foot on the forecastle's edge (D)
WY, WF = 2.12, 1.72          # the half width: nearly the hull's (D: the house fills the deck; no way past it, the forecastle is reached from inside) and the front's
LEAN = -0.33                 # the front leans FORWARD from the forecastle deck to the roof (D: the reverse-raked windscreen)
WS, WH, WR = 3.42, 4.12, 4.30                                  # the window band and the roof's underside (D: the windows 3.42-4.06, the roof's top 4.41)
WT = 0.06
RT = 0.07                    # the roof's edge (its lip) and the crown over it
X_SH = 3.15                  # the long roof's after edge (D: the house from 3.15)
BOX = (3.17, -0.55)          # the closed deckhouse aft of the wheelhouse to port, from x 3.17 to the wheelhouse, from y -0.55 to the side (D: the aft house and the cabin; the hauling station open to starboard)
DOOR = (-1.82, -1.22, ZWH + 0.04, 4.20)                         # the door to the wheelhouse in its aft wall, to starboard onto the hauling station (y0, y1, sill, head)
def lean(z): return LEAN * max(0.0, z - ZFD) / (WR - ZFD)
def wh_ring(z):
    d = lean(z)
    return [(WX0, -WY, z), (WXC - d, -WY, z), (WXF - d, -WF, z), (WXF - d, WF, z), (WXC - d, WY, z), (WX0, WY, z)]
def roof_ring():
    """the long roof's outline: over the deckhouse and the hauling station out to the bulwarks, the wheelhouse forward, the visor over the
    forward-raked front"""
    d = lean(WR); ya = ysh(X_SH) + 0.03
    side = [(X_SH, ya), (WX0 - 0.01, ya + 0.004), (WX0 + 0.25, WY + 0.06), (WXC - d + 0.06, WY + 0.06), (WXF - d + 0.10, WF + 0.06)]
    return [(x, -y) for x, y in side] + [(x, y) for x, y in reversed(side)]
def roof_top(x, y): return WR + RT + 0.04 * (1 - min(1.0, (y / 2.4) ** 2))

def wh_faces():
    """(name, origin, u, v, windows) for the walls carrying windows; windows as polygons in (u, v)"""
    vl = (-LEAN / (WR - ZFD), 0, 1.0); vlen = math.hypot(vl[0], 1.0); s = lambda z: (z - ZFD) * vlen
    wz = (s(WS + 0.03) + s(WH - 0.03)) / 2; wh_ = s(WH - 0.03) - s(WS + 0.03); Fc = []
    Fc.append(('front', (WXF, 0, ZFD), (0, 1, 0), vl, [rrect(u, wz, 1.00, wh_, 0.06, 3) for u in (-1.12, 0.0, 1.12)]))
    for nm, a, b in (('corner_p', (WXF, WF), (WXC, WY)), ('corner_s', (WXC, -WY), (WXF, -WF))):
        u = (b[0] - a[0], b[1] - a[1], 0); mid = ((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, ZFD)
        Fc.append((nm, mid, u, vl, [rrect(0.0, wz, 0.40, wh_, 0.05, 3)]))
    side = lambda: [rrect(6.90, (WS + WH) / 2, 0.56, WH - WS - 0.06, 0.06, 3), rrect(7.58, (WS + WH) / 2, 0.60, WH - WS - 0.06, 0.06, 3)]
    Fc.append(('side_p', (0, WY, 0), (1, 0, 0), (0, 0, 1), side()))
    Fc.append(('side_s', (0, -WY, 0), (1, 0, 0), (0, 0, 1), side()))
    return Fc

def wheelhouse(fine=True):
    objs = []; glass = []; A = Acc('wh_fit')
    shell = loft_rings('wheelhouse', [wh_ring(ZMD - 0.004), wh_ring(ZFD), wh_ring(WS), wh_ring(WR + 0.03)], C['white'], cap0=False, cap1=False, angle=25)
    shell.data.materials.append(C['inner']); solidify(shell, WT, 1); apply_all(shell)
    cuts = []
    def norm_of(nm, u, v):
        if nm.startswith('side'): return V((0, 1 if nm.endswith('p') else -1, 0))
        if nm == 'aft': return V((-1, 0, 0))
        n = V(u).normalized().cross(V(v).normalized()).normalized()
        return n if n.x > 0 else -n
    for nm, o, u, v, wins in (wh_faces() if fine else []):
        vv = V(v).normalized(); n = norm_of(nm, u, v)
        for k, poly in enumerate(wins):
            cuts.append(plate_cutter('wc_%s%d' % (nm, k), o, u, vv, poly, 0.35))
            cx = sum(p[0] for p in poly) / len(poly); cy = sum(p[1] for p in poly) / len(poly)
            outer = [(p[0] + (0.03 if p[0] > cx else -0.03), p[1] + (0.03 if p[1] > cy else -0.03)) for p in poly]
            objs.append(frame_ring('wf_%s%d' % (nm, k), V(o) + n * 0.004, u, vv, outer, poly, C['frame'], 0.0, 0.022, nrm=n))
            glass.append(plate('wg_%s%d' % (nm, k), V(o) - n * 0.03, u, vv, poly, C['glass'], nrm=n))
    if fine:
        y0, y1, z0, z1 = DOOR
        cuts.append(plate_cutter('wc_door', (WX0, 0, 0), (0, 1, 0), (0, 0, 1), rrect((y0 + y1) / 2, (z0 + z1) / 2, y1 - y0, z1 - z0, 0.06, 3), 0.35))
        cut(shell, cuts)
    objs.append(shell)
    # the sole inside, a step over the working deck (the deck runs on under it), wood-grey; its front under the console
    ri = offset_poly([(x, y) for x, y, _ in wh_ring(ZWH)], -(WT + 0.002))
    A.poly([(x, y, ZWH) for x, y in ri], C['sole'], (0, 0, 1))
    if not fine:
        for nm, o, u, v, wins in wh_faces():
            vv = V(v).normalized(); n = norm_of(nm, u, v)
            for k, poly in enumerate(wins):     # (the far version: each window a plain quad over its outline's box)
                us = [q[0] for q in poly]; ws = [q[1] for q in poly]; box_ = [(min(us), min(ws)), (max(us), min(ws)), (max(us), max(ws)), (min(us), max(ws))]
                objs.append(plate('wd_%s%d' % (nm, k), V(o) + n * 0.004, u, vv, box_, C['dark'], nrm=n))
    else:
        # the door: a white frame round the opening, the leaf hooked open back against the wall to port (its window, handle, hinges),
        # a step up from the working deck to its sill
        y0, y1, z0, z1 = DOOR; x = WX0
        o = rr_pts((y0 + y1) / 2, (z0 + z1) / 2, y1 - y0, z1 - z0, 0.06, 3); fo = [(a, max(b, z0)) for a, b in rr_pts((y0 + y1) / 2, (z0 + z1) / 2, y1 - y0 + 0.07, z1 - z0 + 0.07, 0.09, 3)]
        for k in range(len(o)):
            a, b = o[k], o[(k + 1) % len(o)]; c_, d_ = fo[(k + 1) % len(fo)], fo[k]
            A.poly([(x - 0.012, a[0], a[1]), (x - 0.012, b[0], b[1]), (x - 0.012, c_[0], c_[1]), (x - 0.012, d_[0], d_[1])], C['white'], (-1, 0, 0))
            A.poly([(x - 0.012, a[0], a[1]), (x - 0.012, b[0], b[1]), (x + 0.002, b[0], b[1]), (x + 0.002, a[0], a[1])], C['white'], (0, 0, 0))
        lx0, lx1 = x - 0.075, x - 0.035; ly0, ly1 = y1 + 0.03, y1 + 0.03 + (y1 - y0) - 0.016
        abox(A, lx0, lx1, ly0, ly1, z0 + 0.02, z1 - 0.02, C['white'])
        G1 = rr_pts((ly0 + ly1) / 2, z1 - 0.42, 0.36, 0.42, 0.06, 3)
        glass.append(plate('door_glass', (lx0 - 0.002, 0, 0), (0, 1, 0), (0, 0, 1), G1, C['glass'], nrm=(-1, 0, 0)))
        acyl(A, (lx0, ly1 - 0.07, z0 + 1.0), (lx0 - 0.05, ly1 - 0.07, z0 + 1.0), 0.012, lambda q: C['steel'], seg=8)
        abox(A, lx0 - 0.065, lx0 - 0.05, ly1 - 0.16, ly1 - 0.04, z0 + 0.985, z0 + 1.015, C['steel'])
        for zz in (z0 + 0.3, z1 - 0.3): acyl(A, (x - 0.03, y1 + 0.01, zz - 0.06), (x - 0.03, y1 + 0.01, zz + 0.06), 0.013, lambda q: C['steel'], seg=8)
        acyl(A, (lx1, ly1 - 0.05, z0 + 0.5), (x, ly1 - 0.05, z0 + 0.5), 0.01, lambda q: C['steel'], seg=6)             # the hook holding it open
        stairs(A, y0 + 0.02, y1 - 0.02, x1=WX0 - 0.005, z1=ZWH, n=1)
        abox(A, WX0 + 0.002, WX0 + WT + 0.02, y0, y1, ZWH - 0.004, z0 + 0.004, C['wood'])                         # the sill inside
        # the opening's floor through the wall below the sill: the wall's thickness closed under the door
        A.poly([(WX0, y0, z0), (WX0, y1, z0), (WX0 + WT, y1, z0), (WX0 + WT, y0, z0)], C['white'], (0, 0, 1))
    # the roof: its underside, a thin lip with a drip edge all round, the visor over the front, the crown rising a little to the middle
    ring = roof_ring()
    A.poly([(x, y, WR) for x, y in ring], C['inner'], (0, 0, -1))
    ri = offset_poly(ring, -0.14)
    for i in range(len(ring)):
        a, b = ring[i], ring[(i + 1) % len(ring)]; c, d = ri[(i + 1) % len(ri)], ri[i]; nrm = (b[1] - a[1], -(b[0] - a[0]), 0)
        A.poly([(a[0], a[1], WR), (b[0], b[1], WR), (b[0], b[1], WR + RT), (a[0], a[1], WR + RT)], C['orange'], nrm)          # the orange lip (D: the first script's)
        A.poly([(a[0], a[1], WR + RT), (b[0], b[1], WR + RT), (c[0], c[1], roof_top(*c)), (d[0], d[1], roof_top(*d))], C['roofy'], (0, 0, 1))
        A.poly([(a[0], a[1], WR - 0.001), (b[0], b[1], WR - 0.001), (b[0], b[1], WR - 0.022), (a[0], a[1], WR - 0.022)], C['frame'], nrm)   # the drip edge
    A.poly([(x, y, roof_top(x, y)) for x, y in ri], C['roofy'], (0, 0, 1))
    if fine:
        # the wipers on the front panes, parked along the pane's foot (the motor under it, the arm and the blade lying on the glass)
        for u in (-1.12, 0.0, 1.12):
            zb2 = WS + 0.06; xb2 = WXF - lean(zb2) + 0.03; za = WS + 0.01; xa = WXF - lean(za) + 0.03
            acyl(A, (xa - 0.04, u + 0.30, za), (xa + 0.01, u + 0.30, za), 0.02, lambda q: C['frame'], seg=8)
            acyl(A, (xa + 0.01, u + 0.30, za), (xb2 - 0.005, u - 0.06, zb2), 0.006, lambda q: C['frame'], seg=5)
            acyl(A, (xb2 - 0.008, u + 0.18, zb2), (xb2 - 0.008, u - 0.30, zb2), 0.007, lambda q: C['rubber'], seg=5)
    objs.append(A.done(35, tint=wear))
    return objs, glass

def stairs(A, y0, y1, x1=X_STEP - 0.005, z0=ZMD, z1=ZFD, n=3):
    """steps from the working deck up against a wall (one solid run, its foot in the cambered deck; n treads of equal rise, the last
    step up onto the foredeck or the door's sill)"""
    tr = 0.24; h = (z1 - z0) / (n + 1); x0 = x1 - tr * n; y0, y1 = min(y0, y1), max(y0, y1)
    poly = [(x0, z0 - 0.01), (x1, z0 - 0.01), (x1, z0 + h * n)]
    for k in range(1, n): poly += [(x1 - tr * k, z0 + h * (n - k + 1)), (x1 - tr * k, z0 + h * (n - k))]
    poly += [(x0, z0 + h)]
    F.prism_side(A, poly, y0, y1, C['white'])
    for k in range(n):
        z = z0 + h * (n - k); xa = x1 - tr * (k + 1)
        abox(A, xa + 0.004, xa + tr - 0.004, y0 + 0.01, y1 - 0.01, z, z + 0.006, C['dark'])              # the non-slip treads

def shelter(A, G, fine=True):
    """the closed deckhouse aft of the wheelhouse to port (D: the aft house and the cabin, from x 3.17 to the wheelhouse, from y -0.55 to
    the side; its port wall inside the bulwark), a door and a window in its starboard face onto the hauling station, the posts carrying
    the long roof over the open starboard side"""
    x0, y0 = BOX; x1 = WX0 - 0.004; y1 = WY; zt = WR - 0.004
    abox(A, x0, x1, y0, y1, ZMD - 0.004, zt, C['white'])
    if not fine:
        for x in (X_SH + 0.08, 4.60): acyl(A, (x, -(ybw(x, -1) - 0.08), ZMD), (x, -(ybw(x, -1) - 0.08), WR), 0.05, lambda q: C['white'], seg=6)
        return
    # the door to the cabin (closed) and a window, in the starboard face
    dx0, dx1 = 5.30, 5.92; zd0, zd1 = ZMD + 0.06, ZMD + 1.95
    abox(A, dx0 - 0.04, dx1 + 0.04, y0 - 0.012, y0, zd0 - 0.02, zd1 + 0.04, C['frame'])
    abox(A, dx0, dx1, y0 - 0.020, y0 - 0.010, zd0, zd1, C['white'])
    G.poly([(dx0 + 0.16, y0 - 0.021, zd1 - 0.55), (dx1 - 0.16, y0 - 0.021, zd1 - 0.55), (dx1 - 0.16, y0 - 0.021, zd1 - 0.15), (dx0 + 0.16, y0 - 0.021, zd1 - 0.15)], C['glass'], (0, -1, 0))
    acyl(A, (dx1 - 0.08, y0 - 0.02, zd0 + 0.98), (dx1 - 0.08, y0 - 0.07, zd0 + 0.98), 0.012, lambda q: C['steel'], seg=8)
    abox(A, dx1 - 0.18, dx1 - 0.04, y0 - 0.08, y0 - 0.065, zd0 + 0.965, zd0 + 0.995, C['steel'])
    for wx0, wx1 in ((3.55, 4.35),):
        wz0, wz1 = WS, WH
        abox(A, wx0 - 0.03, wx1 + 0.03, y0 - 0.012, y0, wz0 - 0.03, wz1 + 0.03, C['frame'])
        G.poly([(wx0, y0 - 0.013, wz0), (wx1, y0 - 0.013, wz0), (wx1, y0 - 0.013, wz1), (wx0, y0 - 0.013, wz1)], C['glass'], (0, -1, 0))
    # a window in the port wall over the bulwark
    yp = WY + 0.001
    abox(A, 3.55 - 0.03, 4.35 + 0.03, yp, yp + 0.012, WS - 0.03, WH + 0.03, C['frame'])
    G.poly([(3.55, yp + 0.013, WS), (4.35, yp + 0.013, WS), (4.35, yp + 0.013, WH), (3.55, yp + 0.013, WH)], C['glass'], (0, 1, 0))
    # the aft face: a window over the hatch (the skipper's eye aft), a ring buoy's place
    wy0, wy1 = 0.30, 1.30
    abox(A, x0 - 0.012, x0, wy0 - 0.03, wy1 + 0.03, WS - 0.03, WH + 0.03, C['frame'])
    G.poly([(x0 - 0.013, wy0, WS), (x0 - 0.013, wy1, WS), (x0 - 0.013, wy1, WH), (x0 - 0.013, wy0, WH)], C['glass'], (-1, 0, 0))
    # the posts carrying the roof over the starboard side: at its after corner and amidships, on the deck inside the bulwark
    for x in (X_SH + 0.08, 4.60):
        y = -(ybw(x, -1) - 0.08)
        acyl(A, (x, y, ZMD + camber(x, y) - 0.004), (x, y, WR), 0.05, lambda q: C['white'], seg=12)
        abox(A, x - 0.08, x + 0.08, y - 0.08, y + 0.08, ZMD + camber(x, y) - 0.004, ZMD + camber(x, y) + 0.01, C['steel'])


# the helm to starboard under the front windows: the console with the dash sloping up forward, the screens facing the skipper, the wheel
# ahead of him, the lever on the console's side, the seat behind him; the bench and the chart table to port
HX0, HX1, HY0, HY1 = 7.85, 8.35, -1.72, -0.30
DASHL = ((7.87, ZWH + 0.90), (8.27, ZWH + 1.04))              # the dash's after foot and fore top (x, z)
WHEEL = (7.73, -1.12, ZWH + 0.98); WHEEL_AX = (-1.0, 0.0, 0.55)
SKIP = (7.33, -1.12); SEAT = (6.91, -1.12)                     # in the middle of the starboard front pane (not behind its pillar)
EYE_H = 1.65
HP, FOV = -0.26, 60          # the bridge view's pitch (rad) and field: the dash inside it (check())
def dash_pt(t, y):
    (x0, z0), (x1, z1) = DASHL; return V((x0 + (x1 - x0) * t, y, z0 + (z1 - z0) * t))
def dash_n():
    (x0, z0), (x1, z1) = DASHL; return V((-(z1 - z0), 0, x1 - x0)).normalized()
SCR = {'plot': (-1.66, -1.30, 0.10, 0.90), 'sound': (-1.26, -1.12, 0.55, 0.92), 'eng': (-1.00, -0.60, 0.10, 0.90)}
HELM_EXTRA = []
def helm(A, G, fine=True):
    w = C['inner']; z0 = ZWH; (x0, dz0), (x1, dz1) = DASHL; xw = HX1
    A.poly([(HX0, HY0, z0), (HX0, HY1, z0), (HX0, HY1, dz0), (HX0, HY0, dz0)], w, (-1, 0, 0))
    A.poly([(HX0, HY0, dz0), (HX0, HY1, dz0), (x0, HY1, dz0), (x0, HY0, dz0)], w, (0, 0, 1))
    A.poly([(x0, HY0, dz0), (x0, HY1, dz0), (x1, HY1, dz1), (x1, HY0, dz1)], C['board'], dash_n())
    for y, sg in ((HY0, -1), (HY1, 1)):
        A.poly([(HX0, y, z0), (xw, y, z0), (xw, y, dz1), (x1, y, dz1), (x0, y, dz0), (HX0, y, dz0)], w, (0, sg, 0))
    A.poly([(xw, HY0, z0), (xw, HY1, z0), (xw, HY1, dz1), (xw, HY0, dz1)], w, (1, 0, 0))
    if not fine: return
    n = dash_n()
    for nm, (ya, yb_, ta, tb) in SCR.items():
        q = [dash_pt(ta, ya), dash_pt(ta, yb_), dash_pt(tb, yb_), dash_pt(tb, ya)]; c = sum(q, V()) / 4
        F.loft(A, [[p + n * 0.002 for p in q], [p + n * 0.014 for p in q]], lambda i: C['bezel'], cap0=False, cap1=False)
        A.poly([p + n * 0.014 for p in q], C['bezel'], n)
        A.poly([c + (p - c) * 0.86 + n * 0.0145 for p in q], C['screen'], n)
    cb = dash_pt(0.40, -0.45) + V((0.0, 0, -0.005))
    acyl(A, cb, cb + V((0, 0, 0.05)), 0.065, lambda q: C['dark'], seg=16)
    HELM_EXTRA.append(sphere('compass', cb + V((0, 0, 0.08)), 0.055, C['glass'], (1, 1, 0.7)))
    cp = dash_pt(0.25, -1.24) + n * 0.003
    obox(A, cp, V((0, 0.07, 0)), (dash_pt(1, 0) - dash_pt(0, 0)).normalized() * 0.03, n * 0.004, C['switch'])
    for k in range(4): obox(A, cp + n * 0.005 + V((0, -0.05 + 0.033 * k, 0)), V((0, 0.009, 0)), V((0.004, 0, 0.008)), n * 0.004, C['lampG'] if k < 3 else C['lampR'])
    F.helm_wheel(A, WHEEL, WHEEL_AX, 0.20, C['cush'], C['steel'], C['dark'])
    acyl(A, V(WHEEL) - V(WHEEL_AX).normalized() * 0.14, (HX0 + 0.004, WHEEL[1], WHEEL[2] + 0.02), 0.03, lambda q: C['dark'], seg=10)
    F.single_lever(A, (HX0 + 0.12, HY1, z0 + 0.80), (0, 1, 0), (1, 0, 0), C['dark'], C['steel'], C['black'])
    vc = V((7.60, -1.70, WR - 0.06))                          # the VHF overhead
    obox(A, vc, V((0.09, 0, 0)), V((0, 0.10, 0)), V((0, 0, 0.05)), C['dark'])
    A.poly([vc + V((-0.091, -0.08, -0.03)), vc + V((-0.091, 0.08, -0.03)), vc + V((-0.091, 0.08, 0.03)), vc + V((-0.091, -0.08, 0.03))], C['screen'], (-1, 0, 0))
    F.helm_seat(A, (SEAT[0], SEAT[1], z0), (1, 0, 0), 0.76, C['steel'], C['cush'])
    # the bench to port along the side, the chart table forward of it
    yi = WY - WT
    abox(A, 6.42, 7.30, 1.40, yi - 0.004, z0, z0 + 0.42, C['inner']); abox(A, 6.44, 7.28, 1.42, yi - 0.006, z0 + 0.42, z0 + 0.50, C['cush'])
    abox(A, 6.44, 7.28, yi - 0.09, yi - 0.006, z0 + 0.50, z0 + 0.92, C['cush'])
    abox(A, 7.45, 7.95, 1.25, yi - 0.004, z0, z0 + 0.86, C['inner']); abox(A, 7.47, 7.93, 1.27, yi - 0.006, z0 + 0.86, z0 + 0.88, C['dark'])


# ---------- the decks' fittings: the rails round the foredeck, the windlass and the bow roller, bitts and cleats, vents, the hauling port's
# roller, the grab rails aft, the locker in the starboard quarter (the crane's pedestal), the flag mast aft ----------
def gunwale_y(x, sg=1): return ycap(x, sg) + CAP * 0.5
LOCKER = (1.30, 2.35, 0.60)  # the stainless locker in the port quarter, the crane's pedestal (D: the crane aft to port): x0, x1, its depth in from the bulwark; its top 0.3 over the cap
def locker_top(): return ZMD + 1.30                            # (D: the crane's base 3.4-3.6 over the base line)
RAIL_XS = [8.70, 9.20, 9.70, 10.25]                            # the foredeck rail's posts on the caps (the side decks have the bulwarks, 0.9-1.1 m)
RAIL_H = (0.72, 0.36)
def decks(A, fine=True):
    s = lambda q: C['steel']
    def base(p, r=0.026): acyl(A, (p[0], p[1], p[2] - 0.003), (p[0], p[1], p[2] + 0.008), r, s, seg=10)
    # the rails round the foredeck: posts on bases on the caps, a top and a knee rail, closing round the bow in a pulpit
    xs = RAIL_XS
    if fine:
        for sg in (1, -1):
            for x in xs:
                zc = z_cap(x, sg) + 0.012; y = sg * gunwale_y(x, sg); base((x, y, zc)); acyl(A, (x, y, zc), (x, y, zc + RAIL_H[0]), 0.016, s, seg=8)
        for h, r in zip(RAIL_H, (0.018, 0.013)):
            pts = [(x, -gunwale_y(x, -1), z_cap(x, -1) + 0.012 + h) for x in xs]
            pts += [(10.70, -gunwale_y(10.70, -1) + 0.10, z_cap(10.70) + 0.012 + h), (10.90, 0.0, z_cap(10.90) + 0.012 + h + 0.02), (10.70, gunwale_y(10.70) - 0.10, z_cap(10.70) + 0.012 + h)]
            pts += [(x, gunwale_y(x), z_cap(x) + 0.012 + h) for x in reversed(xs)]
            F.pipe(A, pts, r, C['steel'], 8)
        for sg in (1, -1): yy = gunwale_y(10.70, sg) - 0.10; acyl(A, (10.70, sg * yy, z_bk(10.70) + camber(10.70, yy) - 0.004), (10.70, sg * yy, z_cap(10.70) + 0.012 + RAIL_H[0]), 0.016, s, seg=8)
        # the rails' after ends turn down onto the caps beside the wheelhouse's corners
        for sg in (1, -1):
            for h, r in zip(RAIL_H, (0.018, 0.013)):
                x = xs[0]; F.pipe(A, [(x, sg * gunwale_y(x, sg), z_cap(x, sg) + 0.012 + h), (x - 0.14, sg * gunwale_y(x - 0.14, sg), z_cap(x - 0.14, sg) + 0.012 + h * 0.4),
                                      (x - 0.20, sg * gunwale_y(x - 0.20, sg), z_cap(x - 0.20, sg) + 0.012)], r, C['steel'], 8)
    # the windlass on the foredeck, the chain pipe forward of it, the bow roller over the stem's head (the anchor is the game's: bower)
    wx = WINDLASS; zd = z_bk(wx) + camber(wx, 0)
    abox(A, wx - 0.20, wx + 0.20, -0.18, 0.18, zd - 0.004, zd + 0.08, C['dark'])
    if not fine:                            # (the far version: the windlass a block, no rollers; vessel3d's 12 000 points)
        abox(A, wx - 0.16, wx + 0.16, -0.25, 0.25, zd + 0.08, zd + 0.36, C['dark']); return
    acyl(A, (wx, -0.16, zd + 0.24), (wx, 0.16, zd + 0.24), 0.13, lambda q: C['dark'], seg=18)
    acyl(A, (wx, 0.16, zd + 0.24), (wx, 0.30, zd + 0.24), 0.09, lambda q: C['steel'], seg=16, r1=0.075)
    F.atorus(A, (wx, -0.21, zd + 0.24), (0, 1, 0), 0.09, 0.024, lambda a: C['steel'], seg=16, rseg=6)
    acyl(A, (wx, -0.25, zd + 0.24), (wx, -0.17, zd + 0.24), 0.065, lambda q: C['steel'], seg=12)
    obox(A, (wx, 0, zd + 0.12), V((0.16, 0, 0)), V((0, 0.15, 0)), V((0, 0, 0.05)), C['dark'])
    cp = wx + 0.30; acyl(A, (cp, -0.21, z_bk(cp) + camber(cp, 0.21) - 0.004), (cp, -0.21, z_bk(cp) + 0.06), 0.06, s, seg=12)
    F.bow_roller(A, (10.40, 0, z_bk(10.40) + 0.004), (ROLLER_X, 0, ROLLER_Z), C['steel'], C['rubber'], R=0.05, W=0.15, deck=lambda x: z_bk(min(x, XF - 0.02)) + camber(min(x, XF - 0.02), 0) + 0.002, x_end=10.85)
    # the hauling port's roller in its sill, under the roof's after edge
    hy_o = -(ysh(HXR, -1) + 0.01); hy_i = -(ycap(HXR, -1) - 0.01)
    F.hauling_roller(A, HP0 + 0.08, HP1 - 0.08, hy_o, hy_i, z_cap(HXR, -1) + 0.012, C['steel'], C['rubber'], R=0.05)
    # the stem bar: a half-round stainless strip up the stem from the forefoot to the head
    stem = [(x, 0.0, z_keel(x)) for x in [10.5 + (XF - 0.008 - 10.5) * k / 20 for k in range(21)]]
    for a, b in zip(stem, stem[1:]): acyl(A, (a[0] + 0.006, 0, a[2]), (b[0] + 0.006, 0, b[2]), 0.022, lambda z: C['steel'] if z > WL + 0.1 else C['af'], seg=6, cap=False)
    # the bitts on the foredeck, the cleats on the caps, two mushroom vents, the grab rails on the wheelhouse's front
    for y in (0.75, -0.75): F.bitts(A, 9.56, y, z_bk(9.56) + camber(9.56, y), C['steel'])
    for x in (8.30, 3.95, 0.35):
        for sg in (1, -1):
            if sg < 0 and HP0 - 0.2 < x < HP1 + 0.2: continue
            F.cleat(A, (x, sg * gunwale_y(x, sg), z_cap(x, sg) + 0.006), (0, 0, 1), (1, 0, 0), 0.24, C['steel'])
    for y in (0.80, -0.80): F.mushroom_vent(A, (9.10, y, z_bk(9.10) + camber(9.10, y)), C['white'])
    for sg in (1, -1):
        p0 = V((WXF - lean(WS - 0.10) + 0.05, sg * 0.30, WS - 0.10)); p1 = V((WXF - lean(WS - 0.10) + 0.05, sg * 0.90, WS - 0.10))
        F.pipe(A, [p0 - V((0.05, 0, 0)), p0, p1, p1 - V((0.05, 0, 0))], 0.014, C['steel'], 6)
    # the grab rails along the inside of the bulwarks aft, clear of the locker, the tub and the hauling port
    for sg, x0, x1 in ((-1, 0.90, 3.00),):
        xs_ = [x0 + (x1 - x0) * k / max(1, round((x1 - x0) / 0.8)) for k in range(int(max(1, round((x1 - x0) / 0.8))) + 1)]
        pts = [(x, sg * (ybw(x, sg) - 0.13), ZMD + 0.80) for x in xs_]
        for p in pts:
            F.pipe(A, [(p[0], sg * (ybw(p[0], sg) + 0.01), p[2] - 0.30), (p[0], p[1], p[2] - 0.30), (p[0], p[1], p[2]), (p[0], sg * (ybw(p[0], sg) + 0.04), p[2])], 0.014, C['steel'], 6)
        F.pipe(A, pts, 0.022, C['steel'], 8)
    # the stainless locker in the port quarter: its body against the bulwark, the lid's seam and hasp (the crane stands on it)
    x0, x1, dpt = LOCKER; yo = min(ybw(x0), ybw(x1)) - 0.01; yi = yo - dpt; zt = locker_top()
    abox(A, x0, x1, yi, yo, ZMD + camber((x0 + x1) / 2, yi) - 0.004, zt, C['plate'])
    abox(A, x0 + 0.03, x1 - 0.03, yi - 0.006, yi, zt - 0.10, zt - 0.09, C['dark'])
    obox(A, (x0 + (x1 - x0) * 0.75, yi - 0.012, zt - 0.16), V((0.03, 0, 0)), V((0, 0.006, 0)), V((0, 0, 0.05)), C['steel'])
    # the flagstaff on the transom's port corner: its socket on the cap, the staff, the ball; the flag flies from its top (pole)
    qx, qy = aftm(); zq = z_cap(qx) + 0.012
    acyl(A, (qx, qy, zq - 0.004), (qx, qy, zq + 0.18), 0.035, s, seg=10)
    acyl(A, (qx, qy, zq), (qx, qy, AFTM_TOP - 0.05), 0.022, lambda q: C['white'], seg=8)
    if fine: HELM_EXTRA.append(sphere('flagball', (qx, qy, AFTM_TOP - 0.02), 0.035, C['white']))
    # the stern light on its post over the transom's middle (B8), the transom's ladder to starboard
    sx, sz = STERN_L[0], STERN_L[2]
    acyl(A, (0.04, 0, z_cap(0.04) + 0.008), (0.04, 0, sz - 0.04), 0.018, s, seg=8)
    abox(A, 0.0, 0.08, -0.04, 0.04, sz - 0.05, sz - 0.032, C['frame'])
    for y in (-1.05, -1.35):
        acyl(A, (0.03, y, z_cap(0.0) + 0.30), (0.03, y, z_cap(0.0) + 0.012), 0.016, s, seg=6)
        acyl(A, (0.03, y, z_cap(0.0) + 0.012), (-0.05, y, z_cap(0.0) - 0.02), 0.016, s, seg=6)
        acyl(A, (-0.05, y, z_cap(0.0) - 0.02), (-0.05, y, WL - 0.30), 0.016, s, seg=6)
    nr = int((z_cap(0.0) - 0.10 - (WL - 0.25)) / 0.30) + 1
    for k in range(nr): z = WL - 0.25 + 0.30 * k; acyl(A, (-0.05, -1.05, z), (-0.05, -1.35, z), 0.014, s, seg=5)
    for k in range(3): z = WL - 0.25 + 0.30 * k + 0.6; abox(A, -0.004, 0.0, -1.40, -1.00, z - 0.012, z + 0.012, C['steel'])   # the ladder's brackets on the transom
WINDLASS = 9.56; ROLLER_Z = 3.58; ROLLER_X = 11.04
HXR = (HP0 + HP1) / 2        # the hauler's station: the middle of the hauling port
AFTM_X = 0.06; AFTM_TOP = 3.62                                  # the flagstaff on the transom's port corner (D: its ball at 3.6)
def aftm(): return (AFTM_X + 0.06, gunwale_y(AFTM_X + 0.06) - 0.06)
STERN_L = (0.04, 0.0, 3.22)  # the stern light over the transom's middle, on its post


# ---------- the mast on the roof (D: a raked pylon over the wheelhouse's after end, a platform at 5.2, a pole above it): the radar
# brackets, the fishing lights and the all-round white on the pole; the side lights on the wheelhouse ----------
MX = 6.12; M_TOP = 7.62      # the pole (D: its top at 6.2; raised 1.4 m so the fishing lights stand legally over the side lights)
PY_Z = 5.15                  # the pylon's top and the platform on it (D 5.2)
FISH_R, FISH_W = 7.35, 6.30  # the fishing lights red over white on arms aft of the pole (1.05 m apart)
def white_z(): return M_TOP + 0.10
SIDE_X = 7.98; SIDE_Z = 4.18 # the side lights on the wheelhouse's sides forward of the windows, under the roof's lip
def lamp(A, c, m, fine=True):
    if fine: F.allround_lantern(A, c, m, C['frame'], R=0.035, H=0.07)
    else: acyl(A, (c[0], c[1], c[2] - 0.05), (c[0], c[1], c[2] + 0.05), 0.04, lambda q: m, seg=6)
def pylon_ring(z):
    """the pylon's section at height z: a rounded box raked aft, 0.60 x 0.44 at the roof, 0.30 x 0.28 at the platform"""
    zr = roof_top(6.6, 0) - 0.01; t = max(0.0, min(1.0, (z - zr) / (PY_Z - zr)))
    xa, xf = 6.30 + (6.00 - 6.30) * t, 6.90 + (6.30 - 6.90) * t; w = 0.22 + (0.14 - 0.22) * t
    return [(x, y, z) for x, y in rr_pts((xa + xf) / 2, 0.0, xf - xa, 2 * w, 0.05, 2)]
def rig(A, fine=True):
    seg = 12 if fine else 6; s = lambda q: C['steel']; zr = roof_top(6.6, 0) - 0.01
    F.loft(A, [pylon_ring(zr), pylon_ring((zr + PY_Z) / 2), pylon_ring(PY_Z)], lambda i: C['white'], cap0=False, cap1=True)
    abox(A, MX - 0.42, MX + 0.48, -0.45, 0.45, PY_Z, PY_Z + 0.06, C['white'])                               # the platform
    acyl(A, (MX, 0, PY_Z + 0.06), (MX, 0, M_TOP), 0.045, s, seg=seg)
    lamp(A, (MX, 0, white_z()), C['lampW'], fine)
    acyl(A, (MX, 0, M_TOP), (MX, 0, white_z() - 0.05), 0.03, s, seg=8)
    # the dome's bracket on the pylon's front (the radars are the game's kit), the open array's place on the platform
    beam(A, (6.75, 0, 4.86), (7.25, 0, 4.86), 0.36, 0.04, C['steel'])
    # the fishing lights: red over white on arms aft of the pole (rule 26)
    for z, mt in ((FISH_R, C['lampR']), (FISH_W, C['lampW'])):
        beam(A, (MX - 0.04, 0, z - 0.10), (MX - 0.36, 0, z - 0.10), 0.03, 0.03, C['steel'])
        acyl(A, (MX - 0.36, 0, z - 0.10), (MX - 0.36, 0, z - 0.07), 0.04, s, seg=10)
        lamp(A, (MX - 0.36, 0, z), mt, fine)
    if not fine: return
    # the work lights under the platform, the whips and the GPS on it; the horn and the searchlight on the roof forward
    for sg in (1, -1):
        F.work_light(A, (MX + 0.40, sg * 0.36, PY_Z - 0.01), (1, 0, -0.6), C['dark'], C['lens'])
        F.work_light(A, (MX - 0.36, sg * 0.36, PY_Z - 0.01), (-1, 0, -0.7), C['dark'], C['lens'])
        F.whip(A, (MX - 0.30, sg * 0.38, PY_Z + 0.06), 1.4, C['white'], r0=0.012, r1=0.005, m_foot=C['steel'])
    F.gps(A, (MX + 0.35, 0.30, PY_Z + 0.06), C['white'], r=0.06, h=0.12, m_post=C['steel'])
    acyl(A, (7.90, -1.30, roof_top(7.9, 1.3)), (7.90, -1.30, roof_top(7.9, 1.3) + 0.16), 0.04, s, seg=8)
    acyl(A, (7.90, -1.30, roof_top(7.9, 1.3) + 0.20), (8.15, -1.30, roof_top(7.9, 1.3) + 0.22), 0.03, lambda q: C['white'], seg=10, r1=0.08)
    F.searchlight(A, (7.95, 1.30, roof_top(7.95, 1.3)), (1, 0), 0.085, C['dark'], C['lens'], C['steel'])
    for yy in (-0.9, 0.9): F.work_light(A, (X_SH + 0.18, yy, WR - 0.022), (-0.4, 0, -1), C['dark'], C['lens'])
    # a low rail round the roof's after part, where the raft lies (D: the front view)
    P = lambda sg: [(X_SH + 0.12, sg * 0.5), (X_SH + 0.12, sg * (ysh(X_SH) - 0.12)), (5.70, sg * (ysh(5.7) - 0.12))]
    for sg in (1, -1):
        for x, y in P(sg): acyl(A, (x, y, roof_top(x, y) - 0.004), (x, y, roof_top(x, y) + 0.40), 0.016, s, seg=8)
        F.pipe(A, [(x, y, roof_top(x, y) + 0.40) for x, y in P(sg)], 0.018, C['steel'], 8)

def lanterns_side(A, fine=True):
    """the side lights on a plate on each side of the wheelhouse forward of the windows, under the roof's lip (fittings.side_lantern
    draws its screen inboard, so neither shows across the bow)"""
    for sg, m in ((1, C['lampR']), (-1, C['lampG'])):
        obox(A, (SIDE_X, sg * (WY + 0.004), SIDE_Z), V((0.09, 0, 0)), V((0, 0.004, 0)), V((0, 0, 0.06)), C['frame'])
        if not fine: obox(A, (SIDE_X + 0.012, sg * (WY + 0.03), SIDE_Z), V((0.05, 0, 0)), V((0, 0.025, 0)), V((0, 0, 0.03)), m); continue
        F.side_lantern(A, (SIDE_X + 0.012, sg * (WY + 0.038), SIDE_Z), (1, 0, 0), (0, sg, 0), m, C['frame'], C['black'], R=0.03, H=0.05)
    if fine: F.stern_lantern(A, STERN_L, (-1, 0, 0), C['lampW'], C['frame'])
    else: obox(A, STERN_L, V((0.03, 0, 0)), V((0, 0.03, 0)), V((0, 0, 0.03)), C['lampW'])


# ---------- under water: the skeg's shoe, the rudder, the propeller on its shaft out of the skeg, the anodes, the transducer ----------
RX_ = 0.28                   # the rudder's stock (its leading edge)
PROP = (0.80, 0.0, -0.40); PR = 0.34                          # the propeller's centre and radius, in its nozzle (D: the nozzle Ø 0.9, its foot on the keel's shoe)
NZ_X0, NZ_X1, NZ_R = 0.58, 1.06, 0.36                         # the nozzle: aft and fore edges, its inner radius
def nozzle(U, fine=True):
    """a Kort nozzle round the propeller: a foil ring (outer surface and inner surface lofted round the shaft's axis), on a strut to the
    hull over it and on the keel's shoe under it"""
    px, py, pz = PROP; n = 28 if fine else 10
    ring = lambda x, r: [(x, r * math.cos(2 * math.pi * k / n), pz + r * math.sin(2 * math.pi * k / n)) for k in range(n)]
    x0, x1, r = NZ_X0, NZ_X1, NZ_R
    outer = [(x0, r + 0.012), (x0 + 0.06, r + 0.040), (x0 + 0.22, r + 0.075), (x1 - 0.06, r + 0.085), (x1 - 0.004, r + 0.050)]
    inner = [(x1, r + 0.030), (x1 - 0.05, r + 0.002), (x0 + 0.20, r - 0.004), (x0 + 0.004, r + 0.004)]
    F.loft(U, [ring(x, rr) for x, rr in outer], lambda i: C['af'], cap0=False, cap1=False)
    F.loft(U, [ring(x, rr) for x, rr in [outer[-1]] + inner + [outer[0]]], lambda i: C['af'], cap0=False, cap1=False, out=lambda mid, cc: cc - mid)
    zt = z_keel(px) - 0.005; zo = pz + r + 0.08
    beam(U, (px + 0.05, 0, zo - 0.02), (px + 0.05, 0, zt), 0.30, 0.06, C['af'], up=(0, 1, 0))                    # the strut to the hull
    abox(U, RX_ - 0.10, X_SA + 0.05, -0.06, 0.06, Z_SKEG, Z_SKEG + 0.07, C['af'])                                 # the keel's shoe under it to the rudder's heel
    beam(U, (px + 0.05, 0, Z_SKEG + 0.06), (px + 0.05, 0, pz - r - 0.06), 0.24, 0.06, C['af'], up=(0, 1, 0))
def underwater(fine=True):
    U = Acc('under')
    F.foil_rudder(U, (RX_, 0.0), Z_SKEG + 0.07, 0.0, 0.44, C['af'], thick=0.14, top=lambda x: z_keel(max(x, 0.0)) - 0.03, n=12 if fine else 5, rows=6 if fine else 2)
    acyl(U, (RX_ - 0.04, 0, Z_SKEG + 0.07), (RX_ - 0.04, 0, z_keel(RX_) + 0.06), 0.035, lambda q: C['steel'], seg=10)
    acyl(U, (RX_ - 0.04, 0, z_keel(RX_) - 0.05), (RX_ - 0.04, 0, z_keel(RX_) + 0.01), 0.065, lambda q: C['prop'], seg=12)
    nozzle(U, fine)
    px, py, pz = PROP
    if not fine: return U.done(35)          # (the far version: no shaft or propeller under the water)
    acyl(U, (px + 0.07, 0, pz), (X_SA + 0.05, 0, pz), 0.045, lambda q: C['steel'], seg=10)
    acyl(U, (X_SA - 0.05, 0, pz), (X_SA + 0.02, 0, pz), 0.075, lambda q: C['prop'], seg=14, r1=0.085)
    F.propeller(U, PROP, (1, 0, 0), PR, C['prop'], n=4, hub=0.22, pitch=0.9, skew=0.15, cpp=False, fine=fine)
    for sg in (1, -1):
        for x, z in ((2.8, -0.45), (5.0, -0.30)): F.anode(U, (x, sg * (SK_W + 0.03), z), (0, sg, 0), (1, 0, 0), C['anode'], L=0.30, w=0.09, t=0.035, m_strap=C['steel'])
        F.anode(U, (-0.003, sg * 0.95, 0.80), (-1, 0, 0), (0, 1, 0), C['anode'], L=0.20, w=0.07, t=0.03, m_strap=C['steel'])
        # the bilge keels along the chine (D: the views fore and aft)
        for x0, x1 in ((3.2, 7.2),):
            pa = V((x0, sg * (y_ch(x0) - 0.06), z_ch(x0) - 0.02)); pb = V((x1, sg * (y_ch(x1) - 0.06), z_ch(x1) - 0.02))
            beam(U, pa, pb, 0.02, 0.26, C['af'], up=(0, sg, -1.2))
    zt = bot(5.4, 0.70); acyl(U, (5.4, -0.70, zt + 0.02), (5.4, -0.70, zt - 0.03), 0.06, lambda q: C['dark'], seg=16, r1=0.055)
    xi, yi_ = 3.4, 0.50; zi = bot(xi, yi_)
    for k in range(5): abox(U, xi - 0.08, xi + 0.08, yi_ - 0.06 + 0.03 * k - 0.007, yi_ - 0.06 + 0.03 * k + 0.007, zi - 0.012, zi + 0.02, C['dark'])
    return U.done(35)


def build(fine=True):
    HELM_EXTRA.clear()
    M = Mesh('hull'); hull_shell(M, fine)
    for z in (Z_AF, Z_BT):
        g = [f for f in M.bm.faces if f[M.kind] == 1]
        ge = list(set(e for f in g for e in f.edges)); gv = list(set(v for f in g for v in f.verts))
        bmesh.ops.bisect_plane(M.bm, geom=g + ge + gv, dist=1e-6, plane_co=(XM, 0, z), plane_no=V((-SLB, 0, 1)).normalized())
    for f in M.bm.faces:
        if f[M.kind] == 1:
            c = f.calc_center_median(); f.material_index = M.mi(C['af'] if c.z < paint_line(c.x, Z_AF) else C['boot'] if c.z < paint_line(c.x, Z_BT) else C['hull'])
    hull = M.done(30)
    if fine: cut_holes(hull)
    tint(hull)
    A = Acc('fit'); G = Acc('glass')
    if fine: linings(A, G, fine)
    wh, wg = wheelhouse(fine)
    if fine: helm(A, G, fine)
    shelter(A, G, fine); decks(A, fine); rig(A, fine); lanterns_side(A, fine)
    out = [hull, A.done(35, tint=wear), underwater(fine)] + wh + HELM_EXTRA
    g = G.done(35)
    return [o for o in out if o], wg + ([g] if g else [])


def to_game(p): return (-p[1], p[2] - WL, -(p[0] - XM))
def to_game_n(n): return (-n[1], n[2], -n[0])

NAME_D = (0.14, 0.50)        # the name's strip on the petrol bulwark, over the strake's top
def name_strips(G):
    """where the name is written (vessel3d.js nameStrips): on the bulwark forward over the strake, aft of the registration mark's place
    forward (markStrips; maletest: never on each other), and across the transom over the strake"""
    out = []
    for sg, xs in ((1, [8.8 - 1.3 * k / 12 for k in range(13)]), (-1, [7.5 + 1.3 * k / 12 for k in range(13)])):
        B = []; T = []
        for x in xs:
            for arr, dz in ((B, NAME_D[0]), (T, NAME_D[1])): z = z_kn(x) + 2 * RH + dz; arr.append(G(x, sg * (y_at(x, z, sg) + 0.03), z))
        out.append([B, T])
    ys = [1.2 - 2.4 * k / 12 for k in range(13)]
    out.append([[G(XA - 0.02, y, z_kn(XA) + 2 * RH + 0.14) for y in ys], [G(XA - 0.02, y, z_kn(XA) + 2 * RH + 0.52) for y in ys]])
    return out

def kit_places(G):
    """the places where the game sets the deck kit (nothing that can be bought is modelled in, only its place, 19.10.2026): the liferaft
    on the roof's after part where it floats free; a ring buoy on the port screen's after end and one on the port grab rail aft; the dome
    on its bracket forward of the mast, the open array on the platform at the lower cross-tree; the net tub at the stern in the middle,
    where the nets go out over the transom; the line tubs under the shelter to port; one cargo place in the port quarter, clear of the
    flag mast's struts; the folding crane (Jonas 21.10.2026: «Hurtigsjarken min skal også ha kran») on the stainless locker in the
    starboard quarter, which is its pedestal: s 0.7 (about 2 t*m), slewing on the locker's middle, its booms folded forward along the
    starboard bulwark (ry 0), aft of the bleeding tub; no rest (it folds up tight at sea)"""
    r = lambda v: round(v, 3); h = math.pi / 2
    gr = lambda x: ybw(x, -1) - 0.13 - 0.022       # the starboard grab rail's inboard face
    x0, x1, dpt = LOCKER; yo = min(ybw(x0), ybw(x1)) - 0.01
    return {'raft': [G(4.20, 1.05, roof_top(4.20, 1.05)) + [r(h)]],
            'buoys': [G(BOX[0] - 0.03, 1.70, ZMD + 1.45) + [0.0], G(2.6, -gr(2.6), ZMD + 0.80) + [r(h)]],
            'radar': G(7.05, 0, 4.88), 'radarA': G(MX + 0.05, 0, PY_Z + 0.06),
            'garn': {'at': G(0.55, -1.05, ZMD + camber(0.55, 1.05)), 'ry': 0.0},
            'stamps': {'at': G(2.75, -0.95, ZMD + camber(2.75, 0.95)), 'ry': 0.0},
            'cargo': [G(0.75, 1.10, ZMD + camber(0.75, 1.1)) + [0.0]],
            'crane': {'at': G((x0 + x1) / 2, yo - dpt / 2, locker_top()), 'ry': 0.0, 's': 0.7, 'rest': None}}

def bower(G):
    return {'kind': 'plog', 'kg': 20, 'fair': G(ROLLER_X, 0, ROLLER_Z + 0.05), 'gypsy': G(WINDLASS, -0.21, z_bk(WINDLASS) + 0.33), 'side': 0, 'deck': True}

TABLE = (3.60, -1.85)        # the game's gutting bench at the starboard bulwark forward of the hatch, aft of the bleeding tub (x, y)
TUB = (4.85, -1.80)          # the bleeding tub just aft of the hauler (x, y)
def anchors():
    G = lambda x, y, z: [round(v, 3) for v in to_game((x, y, z))]
    qx, qy = aftm(); dy = (DOOR[0] + DOOR[1]) / 2
    return {'bower': bower(G), 'eye': G(SKIP[0], SKIP[1], ZWH + EYE_H), 'skipperAt': G(SKIP[0], SKIP[1], ZWH), 'hp': HP, 'fov': FOV,
            # the hands: the fisher at the hauler in the starboard hauling port, the one who guts at the bench to port, one by the bleeding
            # tub aft of the hauler, one aft of the hatch
            'crewSpots': [G(HXR, -(ybw(HXR, -1) - 0.55), ZMD) + [1.57], G(TABLE[0], TABLE[1] + 0.50, ZMD) + [1.57], G(TUB[0], TUB[1] + 0.50, ZMD) + [1.57],
                          G(2.55, 0.30, ZMD) + [3.14]],
            # typed lights (B8): under 12 m an all-round white (on the mast's top) and the side lights, the stern light over the transom;
            # the fishing lights red over white on their arm (rule 26); the work lights under the roof's after edge
            'lights': [[G(MX, 0, white_z()), [1, 0.95, 0.85], 'allround'],
                       [G(SIDE_X + 0.012, WY + 0.068, SIDE_Z), [1, 0.12, 0.1], 'port'], [G(SIDE_X + 0.012, -(WY + 0.068), SIDE_Z), [0.1, 1, 0.35], 'stbd'],
                       [G(*STERN_L), [1, 0.95, 0.85], 'stern'], [G(MX - 0.36, 0, FISH_R), [1, 0.12, 0.1], 'fishR'], [G(MX - 0.36, 0, FISH_W), [1, 0.95, 0.85], 'fishW'],
                       [G(X_SH + 0.18, 0.0, WR - 0.10), [1, 0.95, 0.85], 'work']],
            # the step up to the wheelhouse's door from the hauling station (deckMap); the forecastle is reached from inside (D)
            'stairs': [{'from': G(5.85, dy, ZMD), 'to': G(6.75, dy, ZWH)}],
            'doors': [{'at': G(5.85, dy, ZMD), 'w': round(DOOR[1] - DOOR[0], 2), 'h': round(DOOR[3] - DOOR[2], 2),
                       'in': G(WX0 + 0.6, dy, ZWH), 'to': 'helm', 'open': True}],
            'names': name_strips(G),
            # the work at sea: the fisher at the hauler in the starboard hauling port; the bleeding tub on the deck just aft of him; the
            # gutting bench (the game's) at the port bulwark abreast the hatch, the one who guts inboard of it; the fish go down the hatch
            'work': {'table': G(TABLE[0], TABLE[1], ZMD), 'tub': G(TUB[0], TUB[1], ZMD)},
            'hatch': G((HOLD[0] + HOLD[1]) / 2, 0.0, ZMD + 0.05 + HOLD_H + 0.03),
            'deck': {'y': round(ZMD - WL, 3), 'z': round(-(2.6 - XM), 3)}, 'gw': round(z_sh(3.0) - WL, 3),
            'stern': round(XM - XA, 3), 'bow': round(-(XF - XM), 3), 'side': round(BEAM / 2, 3), 'beam': BEAM, 'pl': 4.4, 'rl': 1.78, 'open': False, 'hand': False,
            'pole': G(qx, qy, AFTM_TOP), 'hauler': G(HXR, -(ycap(HXR, -1) - 0.05), z_cap(HXR, -1) + 0.30), 'filler': G(3.00, -(ybw(3.0, -1) - 0.12), ZMD + 0.06),
            'kit': dict(kit_places(G), **potplaces.kit('hs11'))}


# ---------- the checks against the tables, the data, the rules and the game's demands ----------
def displacement(wl):
    xs = [XA + (XF - XA) * i / 400 for i in range(401)]
    def area(x):
        s = section(x); a = 0.0
        for (y0, z0, _), (y1, z1, _) in zip(s, s[1:]):
            za, zb = min(z0, wl), min(z1, wl)
            if z1 > z0 and za < wl: a += (y0 + y1) / 2 * (zb - za)
        return 2 * a
    A = [area(x) for x in xs]
    return sum((A[i] + A[i + 1]) / 2 * (xs[i + 1] - xs[i]) for i in range(400)) * 1.025, max(A)

def check():
    out = []
    v, amax = displacement(WL)
    out.append(('deplasement %.2f t ved tegningens største vannlinje %.2f (kjølen med) mot Δmax %.0f t på tegningen (største snitt %.2f m2)' % (v, WL, DMAX, amax), abs(v - DMAX) / DMAX < 0.10))
    wl1 = WL
    while displacement(wl1)[0] > DISP and wl1 > 0.2: wl1 -= 0.01
    out.append(('lett (%.0f t i VESSELS, %.0f t på tegningen) ligger hun %.2f m høyere; ripa aftenfor huset er da %.2f over vannet' % (DISP, LIGHT, WL - wl1, z_sh(3.0) - wl1), True))
    xs = [XA + (XF - XA) * i / 400 for i in range(401)]
    loa = XF - XA
    out.append(('lengde over alt %.2f m (speilet til stevnens topp; baugrulla til %.2f) mot %.2f' % (loa, ROLLER_X + 0.05, L), abs(loa - L) / L < 0.015))
    mb = max(ysh(x) for x in xs[::4]); mr = max(y_at(x, z_kn(x) + RH) + RW for x in xs[::4] if x < 10.5)
    out.append(('største bredde %.2f m ved ripa, %.2f over lista, mot %.2f (vannlinja %.2f m)' % (2 * mb, 2 * mr, BEAM, 2 * max(y_at(x, WL) for x in xs)), abs(2 * mr - BEAM) / BEAM < 0.03))
    dr = WL - Z_SKEG
    out.append(('dypgang %.2f m med kjølen mot %.2f i VESSELS og på tegningen; kroppen alene %.2f' % (dr, DRAFT, WL - min(z_keel(x) for x in xs)), abs(dr - DRAFT) < 0.06))
    out.append(('fribord midtskips %.2f m, ved stevnen %.2f, ved speilet %.2f; arbeidsdekket %.2f over vannet' % (z_sh(XM) - WL, z_sh(XF) - WL, z_sh(XA) - WL, ZMD - WL), ZMD - WL > 0.3))
    wz = white_z()
    out.append(('den hvite rundtlysende %.2f m over sidelanternene (vedlegg I 2(d): minst 1 m)' % (wz - SIDE_Z), wz - SIDE_Z >= 1.0))
    hs, hw = SIDE_Z - z_sh(SIDE_X), wz - z_sh(MX)
    out.append(('sidelanternene %.2f m over skroget, den hvite %.2f (vedlegg I 2(g): sidene høyst tre firedeler så høyt, %.2f)' % (hs, hw, 0.75 * hw), hs <= 0.75 * hw))
    sp = FISH_R - FISH_W
    out.append(('fiskelysene rødt over hvitt %.2f m fra hverandre (vedlegg I 2(c), under 20 m: minst 1 m), det hvite %.2f m over sidelanternene (2(j): minst to ganger avstanden, %.2f), det røde %.2f under den hvite' % (sp, FISH_W - SIDE_Z, 2 * sp, wz - FISH_R),
                sp >= 1.0 and FISH_W - SIDE_Z >= 2 * sp and wz > FISH_R + 0.3))
    qx, qy = aftm()
    out.append(('masta med den hvite står %.1f m fra flaggmasta og over den: spillet gir vimpel' % math.hypot(MX - qx, qy), math.hypot(MX - qx, qy) > 1.0 and wz > AFTM_TOP + 0.5))
    tip = PROP[2] + NZ_R + 0.085; low = PROP[2] - NZ_R - 0.085
    out.append(('propellen Ø %.2f i dyse (innvendig Ø %.2f, %.0f mm klaring): dysa %.2f m under skroget (negativt: felt inn i det), %.2f over kjølens underkant, %.2f til kjølen forut, %.2f til roret akter' % (2 * PR, 2 * NZ_R, 1000 * (NZ_R - PR), z_keel(PROP[0]) - tip, low - Z_SKEG, X_SA - NZ_X1, NZ_X0 - RX_),
                0.01 < NZ_R - PR < 0.04 and z_keel(PROP[0]) - tip > -0.08 and low - Z_SKEG > 0.0 and X_SA - NZ_X1 > 0.05 and NZ_X0 - RX_ > 0.15))
    out.append(('styrehuset: %.2f m under taket over dørken der skipperen står (brotest: 1.8; dekkskartet 1.85)' % (WR - ZWH), WR - ZWH >= 1.85))
    ey = ZWH + EYE_H
    out.append(('øyet %.2f m over frontvinduenes underkant, %.2f under overkanten' % (ey - WS, WH - ey), ey - WS > 0.2 and WH - ey > 0.05))
    (dx0, dz0), (dx1, dz1) = DASHL
    ang = math.degrees(math.atan2(ey - (dz0 + dz1) / 2, (dx0 + dx1) / 2 - SKIP[0])); up = math.degrees(math.atan2(WH - ey, WXF - lean(WH) - SKIP[0]))
    out.append(('dashbordet %.0f grader under øyet, vinduets overkant %.0f over (hp %.2f rad og fov %d: synsfeltet går fra %.0f ned til %.0f grader)' % (ang, up, HP, FOV, FOV / 2 - math.degrees(-HP), math.degrees(-HP) + FOV / 2),
                ang <= math.degrees(-HP) + FOV / 2 and up <= FOV / 2 - math.degrees(-HP) + 12))
    out.append(('rattet %.2f m forut for skipperen (han står bak det, ikke i det), setet %.2f bak ham' % (WHEEL[0] - SKIP[0], SKIP[0] - SEAT[0]), 0.3 <= WHEEL[0] - SKIP[0] <= 0.55 and SKIP[0] - SEAT[0] >= 0.35))
    out.append(('skipperen står midt bak styrbord frontrute (y %.2f, ruta %.2f til %.2f)' % (SKIP[1], -1.12 - 0.50, -1.12 + 0.50), abs(SKIP[1] + 1.12) < 0.1))
    # the game's deck map (vessel3d.js deckMap, sulebas-bygging kap. 15): a floor needs DM_HEAD 1.85 m free over it; a part within 0.6 m
    # and up to 1.6 m higher than the deck is joined to it
    out.append(('taket %.2f m over arbeidsdekket og haleplassen (dekkskartet: 1.85); styrhuset fyller bredden (tegningen), bakken nås innenfra' % (WR - ZMD), WR - ZMD >= 1.85))
    out.append(('trinnet %.2f m høyt opp til styrhusdøra' % ((ZWH - ZMD) / 2), (ZWH - ZMD) / 2 <= 0.22))
    out.append(('skansekledningen akter %.2f m høy, ripa med trinnet ved styrhuset (%.2f til %.2f), rekka rundt bakken %.2f over bakkens dekk' % (z_sh(3.0) - ZMD, z_sh(6.0), z_sh(7.0), z_cap(9.2) + RAIL_H[0] - z_bk(9.2)), z_sh(3.0) - ZMD >= 0.7 and z_cap(9.2) + RAIL_H[0] - z_bk(9.2) >= 0.8))
    out.append(('kistas lokk %.2f m over dekket (knyttes til dekket: kranens fot, en enkel boks)' % (locker_top() - ZMD), locker_top() - ZMD < 1.6))
    out.append(('lukekarmen %.2f m høy, luka %.2f x %.2f m' % (HOLD_H, HOLD[1] - HOLD[0], HOLD[3] - HOLD[2]), HOLD_H <= 0.25))
    sill = z_cap(HXR, -1) - ZMD
    out.append(('haleporten %.2f m over dekket (%.2f-%.2f), ripa ellers %.2f' % (sill, HP0, HP1, z_sh(HXR) - ZMD), 0.4 <= sill <= 0.7))
    out.append(('haleren under det lange taket (%.2f-%.2f) ved x %.2f, %.2f m akter for styrhuset; karet %.2f m akter for haleren, benken %.2f m akter for karet og %.2f m innenfor ripa; dekkshuset %.2f m fra haleporten' % (X_SH, WX0, HXR, WX0 - HP1, HXR - TUB[0], TUB[0] - TABLE[0], ybw(TABLE[0], -1) + TABLE[1], -BOX[1] - 0.0),
                X_SH < HP0 and WX0 - HP1 > 0.2 and HXR - TUB[0] > 0.5 and TUB[0] - TABLE[0] > 0.9 and 0.2 < ybw(TABLE[0], -1) + TABLE[1] < 0.5))
    # the registration mark: markStrips writes it at 0.11 L from the stem on even zone 1 facing out, nothing proud, 0.25 m letters
    xm_ = XF - 0.11 * L; free = z_kn(xm_) - max(z_ch(xm_) + 0.03, WL + 0.10)
    out.append(('registreringsmerket ved x %.2f: sida over vannet under lista er %.2f m høy (%.2f-%.2f over vannet; stripa 0.34)' % (xm_, free, max(z_ch(xm_), WL + 0.10) - WL, z_kn(xm_) - WL), free >= 0.45))
    out.append(('navnefeltene på baugens skansekledning fra x 7.5 til 8.8, merket forut for x 9.0 (maletest: aldri oppå hverandre)', True))
    z0b, z1b = WL - 0.3, WL + 1.5
    fw = max(x for x in xs if z_keel(x) < z1b); ln = fw - XA
    out.append(('slaget %.2f m under vannet akter og %.2f midtskips, bunnreisning %.0f grader midtskips (tegningen: rett side, skarpt slag, grunn V)' % (WL - z_ch(1.0), WL - z_ch(5.5), math.degrees(math.atan2(z_ch(5.5) - z_keel(5.5), y_ch(5.5)))), z_ch(5.5) < WL - 0.4))
    out.append(('vessel3d: skroget i båndet -0.3 til 1.5 m er %.2f m langt (lengden %.2f, -6 %% til +3 %%) og %.2f m bredt (bredden %.2f, ±5 %%)' % (ln, L, 2 * mr, BEAM), -0.06 < (ln - L) / L < 0.03 and abs(2 * mr - BEAM) / BEAM < 0.05))
    worst = (0.0, 0, 0)
    for z in (1.2, 1.5, 1.8, 2.1):
        xs3 = [0.3 + 0.06 * i for i in range(175) if z_ch(0.3 + 0.06 * i) + 0.08 < z < z_kn(0.3 + 0.06 * i) - 0.05 and 0.3 + 0.06 * i < 10.3]
        runs = [[xs3[0]]] if xs3 else []
        for x in xs3[1:]:
            if x - runs[-1][-1] > 0.07: runs.append([x])
            else: runs[-1].append(x)
        for rx in runs:
            yv = [y_at(x, z) for x in rx]; d = [b - a for a, b in zip(yv, yv[1:])]
            for i in range(1, len(d)):
                if abs(d[i] - d[i - 1]) > worst[0]: worst = (abs(d[i] - d[i - 1]), rx[i], z)
    out.append(('vannlinjene på sidene jevne: største endring i stigningen %.3f m per 6 cm-steg (ved x %.2f, z %.1f; en bule synes over rundt 0,02)' % worst, worst[0] < 0.02))
    for nm, fy in (('slaget', y_ch), ('knekken', y_kn), ('ripa', y_sh_)):
        yv = [fy(0.1 + 0.06 * i) for i in range(170)]; d = [b - a for a, b in zip(yv, yv[1:])]
        wv = max((abs(d[i] - d[i - 1]), 0.1 + 0.06 * i) for i in range(1, len(d)))
        out.append(('%s i plan: største endring i stigningen %.3f m per 6 cm (ved x %.2f)' % (nm, wv[0], wv[1]), wv[0] < 0.02))
    for s_, ok_ in out: print(('AVVIK ' if ok_ == 'avvik' else 'OK   ' if ok_ else 'FEIL ') + s_)
    return all(o for _, o in out)


SHOTS = [('bow3q', (20.0, 10.5, 5.2), (5.5, 0, 2.8), 38), ('stern3q', (-7.0, -9.0, 6.2), (4.0, 0, 2.8), 35), ('side', (5.5, 23, 3.4), (5.5, 0, 3.4), 35),
         ('deck', (-2.8, -3.6, 5.8), (3.5, 0, 2.3), 35), ('above', (12.5, -7.5, 11.0), (5.0, 0, 2.8), 35)]
ZC = ZMD                     # the working deck's height (shots.py K5)
K5 = ((0.40, -0.40, ZMD + 1.70), (5.6, 0.0, ZMD + 0.9))
EYE = (SKIP[0], SKIP[1], ZWH + EYE_H)
CLOSE = [('c_helm', (7.30, -0.30, 4.10), (8.35, -0.80, 3.45), 30, False, False), ('c_wh', (11.4, -5.0, 4.4), (7.4, -0.4, 3.6), 30, True, False),
         ('c_stern', (-3.6, -2.9, 2.6), (0.3, 0, 1.6), 32, True, False), ('c_bow', (13.4, -2.9, 3.6), (10.2, 0, 2.6), 30, False, False),
         ('c_under', (1.6, -3.9, -0.3), (1.0, 0, -0.1), 30, False, False), ('c_work', (5.6, -0.2, 5.0), (2.6, 0.0, 1.6), 30, False, False),
         ('c_haul', (4.9, -4.2, 3.4), (4.6, -1.9, 2.4), 30, True, False), ('c_shelter', (2.4, 0.6, 3.6), (5.8, 0.0, 2.7), 30, False, False),
         ('c_side', (7.2, 4.6, 3.6), (7.4, 1.9, 2.6), 30, True, False), ('c_fore', (7.8, 0.0, 5.0), (10.2, 0, 3.0), 30, False, False),
         ('c_rig', (10.0, -6.5, 7.0), (6.4, 0.0, 6.6), 35, True, False), ('c_bottom', (6.0, -6.0, -1.6), (5.5, 0, 0.6), 30, False, False),
         ('K6p', (5.5 + 31.0, 24.0, 4.0), (5.5, 0, 2.5), 100, True, True)]      # K6 from the port bow: the red and the white only

def main():
    os.makedirs(OUT, exist_ok=True)
    if 'check' in sys.argv: sys.exit(0 if check() else 1)
    check()
    reset(); colours()
    solids, glass = build(True)
    join(solids, 'BOAT0'); join(glass, 'GLASS0')
    if 'fast' not in sys.argv and 'dry' not in sys.argv: beauty(OUT, 'hs', WL, SHOTS)
    ex = {'frame': 'kystfiske: x starboard, y up from the waterline, z aft; metres', 'type': 'sjarkny', 'name': 'New speed sjark 10.99 m',
          'len': L, 'beam': BEAM, 'draft': DRAFT, 'anchors': anchors()}
    export_boat(build, to_game, to_game_n, OUT, 'hs11.glb', os.path.join(ROOT, 'src', 'data', 'boat-hs11.b64'), ex,
                side=(os.path.join(ROOT, 'src', 'data', 'boat-hs11-side.b64'), 5.5, 3.6, 13.5), dry='dry' in sys.argv)


if __name__ == '__main__':
    main()
