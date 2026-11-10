"""The used speed sjark (hurtigsjark, 10.99 m, 500 hp, built 2009): a hard-chined fibreglass planing boat with a skeg, the wheelhouse
forward of the middle over a cabin, a covered shelter aft of it open to the working deck, the hold's hatch and the hauling port in the
starboard bulwark. The first script (13.10.2026) read her off the pictures Jonas showed (a 2020s Norwegian 10.99 m fishing boat, the
Nor-Dan 10.99; the make is only named here and in the docs, CLAUDE.md; the pictures are not in the repository and gave no scale): the
keel and the stem, the chine, the knuckle, the sheer and their half-breadths (the tables marked P are kept as they were read; only their
ends are set where each line runs onto the stem), the colours, the window count, the A-frame mast, the slim mast aft.

Rebuilt 01.11.2026 after the pilot boat's way of working (docs/skipsmodeller/hurtigsjark-grunnlag.md, sulebas-bygging.md; Jonas: «Løft
den til samme nivå og arbeidsmåte som pilotbåten ringnot38 og de reviderte båtene»). The old hull was two loose grids, a transom grid and
a skeg body of its own, the freeing ports and the hauling port dark patches, the roof a 0.3 m block, the skipper stood in his wheel.
Now the hull is ONE surface: both sides from the skeg's underside (the skeg is part of the section, with a filleted root), the V bottom
with two spray rails a side, the chine with its flat, the slightly convex topsides, the rounded black rubbing strake on the knuckle, the
flared bulwarks with the hauling port's notch to starboard, the transom, the caps, the insides, the working deck, the bulkhead and the
foredeck rising to the stem's head share their points (Mesh). Openings are real holes, cut with a boolean and lined: the freeing ports
at the deck, the hold's hatch, the forward hatch, the exhaust and the bilge outlet, the wheelhouse's windows and door. Nothing lies in
the plane of anything else. The fittings other boats use come from fittings.py.

Nothing that can be bought is modelled in (the game sets the kit at the places in kit, 19.10.2026; Jonas 18.10.2026): no hauler, no
tubs, no bench (the game's), no liferaft, no radar, no ring buoys, no crane (on the locker in the starboard quarter, its pedestal).

    pip install bpy==4.5.4   (Python 3.11)
    python3 tools/boats/hurtig11.py            -> src/data/boat-hurtig11.b64 (+ the side picture), renders in tools/boats/out/
    python3 tools/boats/hurtig11.py fast       -> the same without the renders
    python3 tools/boats/hurtig11.py fast dry   -> no renders, the GLB only in tools/boats/out
    python3 tools/boats/hurtig11.py check      -> the checks against the tables, the data, the rules and the game's demands only

Frame: x forward from the transom, y to port, z up from the base line; the waterline is z = 1.0."""
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy, bmesh
from bpyutil import *
import potplaces   # the stacks of conical pots (OB16, tools/boats/potplaces.json)
import bpyutil
import fittings as F
from mathutils import noise

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE)); OUT = os.path.join(HERE, 'out')
L = 10.99; BEAM = 3.9; DRAFT = 1.6; DISP = 12.0             # VESSELS.hurtigsjark
WL = 1.0; XA = 0.0; XF = 10.99; XM = (XA + XF) / 2
ZMD = 2.16                   # the working deck (P 1.95; raised over the strake 01.11.2026, so freeing ports drain it through the bulwark: Jonas «Har båten ingen spygatt?»)
ZFD = 2.70                   # the foredeck and the wheelhouse's floor over the cabin (P)
X_STEP = 5.80                # the bulkhead between them, the shelter's forward end


# ---------- the lines (P: read off the pictures by the first script; metres) ----------
def ss(a, b, x): t = max(0.0, min(1.0, (x - a) / (b - a))); return t * t * (3 - 2 * t)
_PC = {}
def pchip(tab, x):
    """a smooth curve through the table's points (monotone cubic, Fritsch-Carlson): the points read off the pictures stay where they were
    read, but the straight pieces between them kinked every section where the slope changed (fair.py: 100 degrees across x 10.0 and 10.5)"""
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
KEEL = [(XA, 0.42), (3.0, 0.30), (6.0, 0.33), (7.8, 0.48), (9.0, 0.78), (9.9, 1.25), (10.5, 1.95), (10.85, 2.75), (XF, 3.48)]   # the bottom on the centreline, up the stem
def z_keel(x): return pchip(KEEL, x)
X_CE, X_KE = 10.62, 10.93    # where the chine and the knuckle run onto the stem (the first script ended them past it: a fin at the bow)
CHZ = [(XA, 0.80), (5.0, 0.84), (7.6, 0.98), (9.0, 1.25), (10.0, 1.70), (X_CE, z_keel(X_CE))]
CHY = [(XA, 1.72), (3.0, 1.80), (6.0, 1.80), (7.4, 1.64), (8.4, 1.30), (9.3, 0.82), (10.0, 0.38), (10.35, 0.15), (X_CE, 0.0)]
KNZ = [(XA, 2.02), (5.0, 2.08), (8.0, 2.24), (9.5, 2.50), (10.5, 2.86), (X_KE, z_keel(X_KE))]   # the knuckle: the top of the yellow
KNY = [(XA, 1.88), (3.0, 1.95), (7.0, 1.93), (8.4, 1.76), (9.4, 1.36), (10.2, 0.80), (10.7, 0.30), (X_KE, 0.0)]
SHZ = [(XA, 2.88), (4.4, 2.90), (7.6, 3.04), (9.4, 3.24), (10.5, 3.40), (XF, 3.48)]           # the bulwarks' top
SHY = [(XA, 1.88), (3.0, 1.96), (7.0, 1.95), (8.4, 1.84), (9.4, 1.52), (10.2, 1.00), (10.7, 0.42), (XF, 0.0)]
def z_ch(x): return max(z_keel(x), pchip(CHZ, x)) if x < X_CE else z_keel(x)
def y_ch(x): return pchip(CHY, x) if x < X_CE else 0.0
def z_kn(x): return max(z_keel(x), pchip(KNZ, x)) if x < X_KE else z_keel(x)
def y_kn(x): return pchip(KNY, x) if x < X_KE else 0.0
def z_sh(x): return pchip(SHZ, x)
def y_sh_(x): return pchip(SHY, x)
# the hauling port: a notch 0.42 m deep in the starboard bulwark (P: 3.55-4.25), its ends rounded
HP0, HP1, HPD = 3.52, 4.28, 0.30
def notch(x): return HPD * ss(HP0 - 0.05, HP0 + 0.05, x) * ss(HP1 + 0.05, HP1 - 0.05, x)
# the skeg under the aft body (P: 1.2 to 7.0, its foot 1.58 m under the water), the bottom's shape, the spray rails, the chine's flat,
# the rubbing strake (chosen 01.11.2026; check() weighs them)
X_SA = 1.20; Z_SKEG = -0.58; X_SF = 7.60
def skeg_bottom(x):
    if x < X_SA or x >= X_SF: return None
    if x <= 5.6: return Z_SKEG
    t = (x - 5.6) / (X_SF - 5.6); return Z_SKEG + (z_keel(x) - Z_SKEG) * t ** 1.7
SK_W, SK_R = 0.07, 0.10      # the skeg's half width at its foot and at its root
CV = 0.0                    # the bottom's shape: a straight V (P; check() weighs it)
def bf(t): return t + CV * t * (1 - t)
RAILS = (0.36, 0.68); RAIL_W = 0.045; RAIL_D = 0.015
def rail_f(x): return ss(10.05, 9.3, x)
CHF = 0.055                  # the chine's flat
def chf(x): return CHF * ss(10.5, 9.9, x)
BULGE = 0.022                # the topsides' convexity
RH, RW = 0.045, 0.04         # the strake: half its height, how far it stands out
def strake_f(x): return 1.0 - ss(10.6, 10.9, x)
Z_AF = WL - 0.03; Z_BT = WL + 0.07; SLB = 0.012              # the antifouling and the black boot top, rising 12 mm a metre forward (planliste kap. 29)
def paint_line(x, z0): return z0 + SLB * (x - XM)
# the speed stripe in the yellow (P): from 1.4 m to 8.6 m, dashes aft of 3.2, tapering to a point forward
def stripe_z(x): return z_ch(x) + (z_kn(x) - z_ch(x)) * (0.42 + 0.12 * x / XF)
def stripe_h(x): return 0.05 * ss(8.6, 7.6, x)
DASHES = [(1.62, 1.80), (1.96, 2.20), (2.36, 2.66), (2.82, 3.14)]    # shorter toward the stern (P: the stripe ends aft in dashes)
DASH = [v for d in DASHES for v in d] + [3.30]
def stripe_on(x): return 3.30 < x < 8.6 or any(a < x < b for a, b in DASHES)


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
    b = BULGE * ss(10.5, 9.6, x)
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
        f = min(1.0, (x - X_SA) / 0.10); g = min(1.0, (zk - zb) / 0.25)
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
        sp += stem_stations(z_keel, [lambda x: paint_line(x, Z_AF), lambda x: paint_line(x, Z_BT), stripe_z, lambda x: stripe_z(x) + stripe_h(x),
                                     lambda x: z_kn(x) + RH * 2], 8.0, XF - 0.012)
    else:
        xs = [0.07, 0.6, 1.6, 2.4, 3.5, 3.9, 4.3, 5.0, 6.8, 7.8, 8.6, 9.3, 9.9, 10.3, 10.5, 10.75, 10.88]
    xs = [x for x in xs if all(abs(x - s) > 0.008 for s in sp)] + sp + [XF - 0.006, XF]
    return sorted(set(round(x, 5) for x in xs if XA <= x <= XF))


# ---------- colours: yellow gelcoat, the white bulwarks and house, black strake, stripe and windows, a dark grey bottom, a grey deck
# (paint zones as the first script: 1 the hull, 2 the stripe, 3 the superstructure, 4 the decks; 10j-paint.js) ----------
C = {}
def colours():
    w = lambda n, rgb, g=0.4, z=0, metal=0.0, emit=0.0: C.__setitem__(n, mat(n, rgb, g, zone=z, metal=metal, emit=emit))
    w('af', (0.10, 0.10, 0.11), 0.15); w('boot', (0.04, 0.04, 0.05), 0.45); w('hull', (0.93, 0.86, 0.08), 0.65, 1)
    w('stripe', (0.05, 0.05, 0.06), 0.5, 2); w('strake', (0.05, 0.05, 0.06), 0.35); w('white', (0.94, 0.94, 0.92), 0.55, 3)
    w('roofy', (0.93, 0.86, 0.08), 0.5, 3); w('inner', (0.88, 0.88, 0.86), 0.3); w('deck', (0.70, 0.72, 0.71), 0.12, 4); w('nonslip', (0.66, 0.68, 0.67), 0.06, 4)
    w('steel', (0.78, 0.80, 0.82), 0.85, 0, 0.85); w('chrome', (0.86, 0.87, 0.89), 0.95, 0, 0.9); w('alu', (0.72, 0.74, 0.76), 0.6, 0, 0.7)
    w('plate', (0.66, 0.68, 0.70), 0.7, 0, 0.8); w('dark', (0.10, 0.11, 0.12), 0.25); w('black', (0.04, 0.04, 0.05), 0.4); w('rubber', (0.05, 0.05, 0.06), 0.2)
    w('frame', (0.05, 0.05, 0.06), 0.45); w('screen', (0.03, 0.05, 0.07), 0.9); w('bezel', (0.10, 0.10, 0.11), 0.5); w('cush', (0.16, 0.17, 0.20), 0.35)
    w('switch', (0.20, 0.21, 0.22), 0.4); w('board', (0.20, 0.21, 0.23), 0.35); w('cabin', (0.05, 0.05, 0.06), 0.2)
    w('prop', (0.70, 0.52, 0.27), 0.8, 0, 0.9); w('anode', (0.55, 0.56, 0.55), 0.2); w('wood', (0.58, 0.38, 0.20), 0.3); w('red', (0.72, 0.18, 0.08), 0.5)
    w('rope2', (0.20, 0.42, 0.62), 0.2); w('fender', (0.08, 0.20, 0.42), 0.4); w('orange', (0.95, 0.35, 0.08), 0.5)
    w('lampR', (0.90, 0.10, 0.08), 0.8, 0, 0, 0.5); w('lampG', (0.10, 0.80, 0.25), 0.8, 0, 0, 0.5); w('lampW', (1.0, 0.97, 0.88), 0.8, 0, 0, 0.5)
    w('lens', (0.95, 0.94, 0.85), 0.9)
    C['glass'] = mat('glass', (0.05, 0.08, 0.11), 0.95)


# ---------- the wear: per corner, so it runs across faces (B16; 2009, gelcoat, 17 years) ----------
def n3(x, y, z=0.0): return noise.noise(V((x, y, z)))
def toward(m, rgb, k):
    base = m['rgb']; return [1 + (rgb[i] / max(base[i], 1e-3) - 1) * k for i in range(3)]

FREE = {1: [(0.55, 0.40), (1.45, 0.40), (2.35, 0.40)], -1: [(1.62, 0.40), (2.42, 0.40)]}   # the freeing ports at the deck (x from, length; the locker stands aft to starboard)
FREE_H = 0.14                # their height, from 2 cm over the deck (the strake's top is under it)
EXH = (-0.55, 1.36); EXH_R = 0.055                            # the wet exhaust in the transom (y, z)
BILGE = (4.60, -1, WL + 0.42); BILGE_R = 0.02                 # the bilge pump's outlet
def wear(p, m, n):
    x, y, z = p; nm = m.name; side = 1 if y > 0 else -1
    if nm == 'hull':
        g = 0.97 + 0.04 * n3(x * 3.0, z * 6.0, side)
        g *= 1 - 0.10 * ss(0.14, 0.0, z - paint_line(x, Z_BT))                                       # grime over the boot top
        g *= 1 - 0.08 * ss(0.3, 0.75, n3(x * 5.0, z * 2.0, side * 3.3)) * ss(0.35, 0.0, abs(z - 1.85)) * (abs(n.y) > 0.5)   # scuffs from quays
        for x0, l in FREE[side]:                                                                     # streaks under the freeing ports
            g *= 1 - 0.10 * ss(0.06, 0.0, abs(x - x0 - l / 2) - l / 2 + 0.05) * ss(ZMD, ZMD - 0.6, z) * (z > WL + 0.1)
        if side == BILGE[1] and z < BILGE[2]: g *= 1 - 0.18 * ss(0.03 + (BILGE[2] - z) * 0.04, 0.004, abs(x - BILGE[0])) * ss(WL, WL + 0.12, z)
        c = toward(m, (0.86, 0.82, 0.40), 0.30 * ss(0.2, 0.7, n3(x * 1.2, z * 3.0, side * 7.1)))  # chalked a little in patches
        return [c[i] * g for i in range(3)]
    if nm in ('stripe', 'boot', 'strake'):
        v = 0.92 + 0.09 * n3(x * 4.0, z * 9.0, side) - 0.08 * ss(WL + 0.06, WL - 0.02, z)
        if nm == 'strake': v *= 1 + 0.25 * ss(0.4, 0.85, n3(x * 6.0, z * 30.0, 2.1))             # rubbed grey by the quays
        return [v, v, v]
    if nm == 'af':
        v = 0.86 + 0.14 * n3(x * 2.5, z * 6.0, y * 2.0)
        g = ss(WL - 0.08, WL + 0.02, z) * (0.5 + 0.5 * ss(-0.3, 0.4, n3(x * 3.0, side * 1.3, 4.1)))   # slime at the waterline
        return [v * (1 - 0.25 * g), v * (1 + 0.20 * g), v * (1 - 0.20 * g)]
    if nm in ('white', 'roofy', 'inner'):
        v = 0.95 + 0.05 * n3(x * 5.0, y * 5.0, z * 5.0)
        if nm == 'inner': v -= 0.10 * ss(0.15, 0.0, z - dk(x))
        c = toward(m, (0.55, 0.42, 0.28), 0.14 * ss(0.55, 0.9, n3(x * 7.0, y * 7.0, z * 7.0 + 0.5)))   # rust weeping from fittings
        return [c[i] * v for i in range(3)]
    if nm in ('deck', 'nonslip'):
        v = 0.92 + 0.10 * n3(x * 5.0, y * 5.0, 1.0)
        v *= 1 - 0.14 * ss(0.8, 0.0, math.hypot(x - 3.85, y + 1.25)) - 0.10 * ss(0.7, 0.0, math.hypot(x - 3.3, y - 1.1))   # worn where they work
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
def z_bk(x): return ZFD + (z_sh(x) - 0.10 - ZFD) * ss(9.70, 10.62, x)          # the foredeck, rising at the bow to the stem's head
def dk(x): return z_deck(x) if x < X_STEP else z_bk(x)
def ysh(x, sg=1): return section(x, sg)[-1][0]
def z_cap(x, sg=1): return section(x, sg)[-1][1]
def ycap(x, sg=1): return max(0.0, ysh(x, sg) - CAP)
def ybw(x, sg=1): return max(0.0, y_at(x, dk(x), sg) - 0.065)       # the bulwark's foot on the deck (its inside leans in a little)
def camber(x, y):
    e = max(0.3, ybw(x)); return 0.05 * (1 - min(1.0, (y / e) ** 2))

HULL_MAT = {'k': 'hull', 'f': 'hull', 'b': 'hull', 'l': 'hull', 't': 'hull', 'n': 'stripe', 'r': 'strake', 'w': 'white', 's': 'white'}
HULL_KIND = {'n': 2, 'r': 3, 'w': 4, 's': 4}
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
        k = Tp[j][3]; M.f(q, C['white'] if k in 'ws' else C['strake'] if k == 'r' else C['hull'], (-1, 0, 0), 4 if k in 'ws' else 3 if k == 'r' else 1)
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
    def em(j, n): return C['white'] if j in (0, 1, n - 3, n - 2) else C['inner'] if j in (2, n - 4) else None
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
    M.f(list(reversed(port)) + [(p_[0], -p_[1], p_[2]) for p_ in port] + [r0[n - 1], r0[n - 2], r0[1], r0[0]], C['white'], (0, 0, 1))
    M.f([r0[1], r0[2], r0[3], r0[n - 4], r0[n - 3], r0[n - 2]], C['inner'], (1, 0, 0))
    return S


# ---------- the openings: real holes, cut with a boolean and lined (havsjark35.py) ----------
HOLD = (1.75, 2.95, -0.55, 0.55)                               # the fish hold's hatch in the working deck
HOLD_H = 0.10
HATCH_F = (8.80, 9.20, -0.28, 0.28)                            # the forward hatch (the cabin's escape) on the foredeck

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


# ---------- the wheelhouse forward of the middle over the cabin: the walls with real windows and a door, the shelter aft of it, one
# thin roof over both (P: its plan, height, lean, windows; the roof made thin, 01.11.2026, M: «tykt massivt tak») ----------
WX0 = X_STEP + 0.03          # the wheelhouse's aft wall (3 cm forward of the bulkhead under it: a lip, never in its plane)
WXC, WXF = 8.20, 8.55        # the sides' forward end and the front's foot (P: WX1)
WY, WF = 1.45, 0.95          # the half width (P: 1.62, made narrower for a walkway beside it, deckMap) and the front's
LEAN = 0.42                  # the front leans aft from the foredeck to the roof (P)
WS, WH, WR = 3.42, 4.46, 4.62                                  # the window band and the roof's underside (P)
WT = 0.06
BRIM_I, BRIM_H = 0.10, 0.18  # the roof's brim (valg 26, after plast31.py and havsjark35.py): how far its face slopes in from the lower edge, and
                             # how high the roof's edge stands over the underside WR
X_SH = 3.80; X_SC = 4.30     # the roof's after edge over the working deck, the shelter's screens from here to the bulkhead
DOOR = (-1.02, -0.42, ZFD + 0.055, 4.48)                        # the door to the wheelhouse in its aft wall, to starboard (y0, y1, sill, head)
def lean(z): return LEAN * (z - ZFD) / (WR - ZFD)
def wh_ring(z):
    d = lean(z)
    return [(WX0, -WY, z), (WXC - d, -WY, z), (WXF - d, -WF, z), (WXF - d, WF, z), (WXC - d, WY, z), (WX0, WY, z)]
def roof_ring():
    """the roof's outline: full width over the shelter (out over the bulwarks), narrower over the wheelhouse, the visor over the front"""
    d = lean(WR); ya, yb = ysh(X_SH) + 0.03, ysh(X_STEP) + 0.03; ym = ysh(4.8) + 0.03
    side = [(X_SH, ya), (4.8, ym), (X_STEP, yb), (6.30, WY + 0.12), (WXC - d + 0.18, WY + 0.12), (WXF - d + 0.30, WF + 0.10)]
    return [(x, -y) for x, y in side] + [(x, y) for x, y in reversed(side)]
def roof_top(x, y): return WR + BRIM_H + 0.04 * (1 - min(1.0, (y / 1.95) ** 2))

def wh_faces():
    """(name, origin, u, v, windows) for the walls carrying windows; windows as polygons in (u, v)"""
    vl = (-LEAN / (WR - ZFD), 0, 1.0); vlen = math.hypot(vl[0], 1.0); s = lambda z: (z - ZFD) * vlen
    wz = (s(WS + 0.03) + s(WH - 0.03)) / 2; wh_ = s(WH - 0.03) - s(WS + 0.03); Fc = []
    Fc.append(('front', (WXF, 0, ZFD), (0, 1, 0), vl, [rrect(u, wz, 0.86, wh_, 0.06, 3) for u in (-0.46, 0.46)]))
    for nm, a, b in (('corner_p', (WXF, WF), (WXC, WY)), ('corner_s', (WXC, -WY), (WXF, -WF))):
        u = (b[0] - a[0], b[1] - a[1], 0); mid = ((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, ZFD)
        Fc.append((nm, mid, u, vl, [rrect(0.0, wz, 0.42, wh_, 0.05, 3)]))
    side = lambda: [rrect(6.48, (WS + WH) / 2, 0.70, WH - WS - 0.06, 0.06, 3), rrect(7.26, (WS + WH) / 2, 0.52, WH - WS - 0.06, 0.06, 3)]
    Fc.append(('side_p', (0, WY, 0), (1, 0, 0), (0, 0, 1), side()))
    Fc.append(('side_s', (0, -WY, 0), (1, 0, 0), (0, 0, 1), side()))
    Fc.append(('aft', (WX0, 0, 0), (0, 1, 0), (0, 0, 1), [rrect(0.72, (WS + WH) / 2, 0.66, WH - WS - 0.06, 0.06, 3)]))
    return Fc

def wheelhouse(fine=True):
    objs = []; glass = []; A = Acc('wh_fit')
    shell = loft_rings('wheelhouse', [wh_ring(ZFD - 0.004), wh_ring(WS), wh_ring(WR + 0.03)], C['white'], cap0=False, cap1=False, angle=25)
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
        # (the stripes on flat walls, OB8 10.11.2026 on the havsjark: «Den ser liksom ut som den huler litt innover mot vinduene pga de
        # stripene»; qa/flatnorm.py found 82 faces here up to 74 degrees off: the sharp edges marked again after the cut)
        shade(shell, 5)
    objs.append(shell)
    if not fine:
        for nm, o, u, v, wins in wh_faces():
            vv = V(v).normalized(); n = norm_of(nm, u, v)
            for k, poly in enumerate(wins):     # (the far version: each window a plain quad over its outline's box)
                us = [q[0] for q in poly]; ws = [q[1] for q in poly]; box_ = [(min(us), min(ws)), (max(us), min(ws)), (max(us), max(ws)), (min(us), max(ws))]
                objs.append(plate('wd_%s%d' % (nm, k), V(o) + n * 0.004, u, vv, box_, C['dark'], nrm=n))
    else:
        # the door: a white frame round the opening, the leaf hooked open back against the wall to port (its window, handle, hinges),
        # three steps up from the shelter's deck to its sill
        y0, y1, z0, z1 = DOOR; x = WX0
        o = rr_pts((y0 + y1) / 2, (z0 + z1) / 2, y1 - y0, z1 - z0, 0.06, 3); fo = [(a, max(b, z0)) for a, b in rr_pts((y0 + y1) / 2, (z0 + z1) / 2, y1 - y0 + 0.07, z1 - z0 + 0.07, 0.09, 3)]   # (the frame stops at the sill)
        for k in range(len(o)):
            a, b = o[k], o[(k + 1) % len(o)]; c_, d_ = fo[(k + 1) % len(fo)], fo[k]
            A.poly([(x - 0.012, a[0], a[1]), (x - 0.012, b[0], b[1]), (x - 0.012, c_[0], c_[1]), (x - 0.012, d_[0], d_[1])], C['white'], (-1, 0, 0))
            A.poly([(x - 0.012, a[0], a[1]), (x - 0.012, b[0], b[1]), (x + 0.002, b[0], b[1]), (x + 0.002, a[0], a[1])], C['white'], (0, 0, 0))
        lx0, lx1 = x - 0.075, x - 0.035; ly0, ly1 = y1 + 0.03, y1 + 0.03 + (y1 - y0) - 0.016
        abox(A, lx0, lx1, ly0, ly1, z0 + 0.02, z1 - 0.02, C['white'])
        G1 = rr_pts((ly0 + ly1) / 2, z1 - 0.42, 0.34, 0.40, 0.06, 3)
        glass.append(plate('door_glass', (lx0 - 0.002, 0, 0), (0, 1, 0), (0, 0, 1), G1, C['glass'], nrm=(-1, 0, 0)))
        acyl(A, (lx0, ly1 - 0.07, z0 + 1.0), (lx0 - 0.05, ly1 - 0.07, z0 + 1.0), 0.012, lambda q: C['steel'], seg=8)
        abox(A, lx0 - 0.065, lx0 - 0.05, ly1 - 0.16, ly1 - 0.04, z0 + 0.985, z0 + 1.015, C['steel'])
        for zz in (z0 + 0.3, z1 - 0.3): acyl(A, (x - 0.03, y1 + 0.01, zz - 0.06), (x - 0.03, y1 + 0.01, zz + 0.06), 0.013, lambda q: C['steel'], seg=8)
        acyl(A, (lx1, ly1 - 0.05, z0 + 0.5), (x, ly1 - 0.05, z0 + 0.5), 0.01, lambda q: C['steel'], seg=6)             # the hook holding it open
        stairs(A, y0 + 0.02, y1 - 0.02)
        # the floor's lip at the door, inside: a wooden sill
        abox(A, WX0 + 0.002, WX0 + WT + 0.02, y0, y1, ZFD - 0.004, z0 + 0.004, C['wood'])
    # the roof (valg 26, Jonas 09.11.2026 on the plastsjark, then «Ja» for all the boats: «Gjør styrhustak mer realistisk som dette, med en
    # slags brem på kanten av taket som skrår», the lower edge out and the face sloping in, not the other way: «Bremen på styrhuset skrår
    # feil vei»): its underside where it was (the walkway beside the house and the hauling port keep their head room, check()), a brim
    # all round the outline (out over the bulwarks over the shelter, the visor over the front): a 3 cm lower edge with the drip edge
    # under it, the face sloping in BRIM_I up to the roof's edge BRIM_H over the underside, the crown inside cambered 4 cm. Black as the
    # stripes and the strake, in the stripes' paint zone so it follows them («Fargen kan du bestemme selv så lenge den harmonerer»)
    ring = roof_ring()
    A.poly([(x, y, WR) for x, y in ring], C['inner'], (0, 0, -1))
    rt = offset_poly(ring, -BRIM_I); ri = offset_poly(ring, -BRIM_I - 0.12); zl = WR + 0.03; zt = WR + BRIM_H
    for i in range(len(ring)):
        a, b = ring[i], ring[(i + 1) % len(ring)]; nrm = (b[1] - a[1], -(b[0] - a[0]), 0); ln = math.hypot(nrm[0], nrm[1]) or 1.0
        e, f = rt[(i + 1) % len(rt)], rt[i]; c, d = ri[(i + 1) % len(ri)], ri[i]
        A.poly([(a[0], a[1], WR), (b[0], b[1], WR), (b[0], b[1], zl), (a[0], a[1], zl)], C['stripe'], nrm)                                  # the lower edge
        A.poly([(a[0], a[1], zl), (b[0], b[1], zl), (e[0], e[1], zt), (f[0], f[1], zt)], C['stripe'],
               (nrm[0] / ln * (zt - zl), nrm[1] / ln * (zt - zl), BRIM_I))                                                           # the face, sloping in
        A.poly([(f[0], f[1], zt), (e[0], e[1], zt), (c[0], c[1], roof_top(*c)), (d[0], d[1], roof_top(*d))], C['roofy'], (0, 0, 1))
        A.poly([(a[0], a[1], WR - 0.001), (b[0], b[1], WR - 0.001), (b[0], b[1], WR - 0.022), (a[0], a[1], WR - 0.022)], C['frame'], nrm)   # the drip edge
    A.poly([(x, y, roof_top(x, y)) for x, y in ri], C['roofy'], (0, 0, 1))
    if fine:
        # the wipers on the front panes, parked along the pane's foot (the motor under it, the arm and the blade lying on the glass)
        for u in (-0.46, 0.46):
            zb2 = WS + 0.06; xb2 = WXF - lean(zb2) + 0.03; za = WS + 0.01; xa = WXF - lean(za) + 0.03
            acyl(A, (xa - 0.04, u + 0.30, za), (xa + 0.01, u + 0.30, za), 0.02, lambda q: C['frame'], seg=8)
            acyl(A, (xa + 0.01, u + 0.30, za), (xb2 - 0.005, u - 0.05, zb2), 0.006, lambda q: C['frame'], seg=5)
            acyl(A, (xb2 - 0.008, u + 0.17, zb2), (xb2 - 0.008, u - 0.33, zb2), 0.007, lambda q: C['rubber'], seg=5)
    objs.append(A.done(35, tint=wear))
    return objs, glass

def stairs(A, y0, y1, x1=X_STEP - 0.005, n=2):
    """steps from the working deck up toward the foredeck's height against the bulkhead (one solid run, its foot in the cambered deck;
    n treads of equal rise, the last step up onto the foredeck or the door's sill)"""
    tr = 0.24; h = (ZFD - ZMD) / (n + 1); x0 = x1 - tr * n; y0, y1 = min(y0, y1), max(y0, y1)
    poly = [(x0, ZMD), (x1, ZMD), (x1, ZMD + h * n)]
    for k in range(1, n): poly += [(x1 - tr * k, ZMD + h * (n - k + 1)), (x1 - tr * k, ZMD + h * (n - k))]
    poly += [(x0, ZMD + h)]
    F.prism_side(A, poly, y0, y1, C['white'])
    for k in range(n):
        z = ZMD + h * (n - k); xa = x1 - tr * (k + 1)
        abox(A, xa + 0.004, xa + tr - 0.004, y0 + 0.01, y1 - 0.01, z, z + 0.006, C['dark'])              # the non-slip treads

def shelter(A, G, fine=True):
    """the shelter's side screens on the bulwarks' caps from X_SC to the bulkhead, each with a big opening, up to the roof"""
    for sg in (1, -1):
        stairs(A, sg * (WY + 0.05), sg * (ybw(X_STEP, sg) - 0.03))                                    # up to the side deck beside the house
        xs = [X_SC + (X_STEP - X_SC) * k / 6 for k in range(7)]
        yo = lambda x: sg * (ysh(x, sg) - 0.006); yi = lambda x: sg * (ysh(x, sg) - 0.056); zb = lambda x: z_cap(x, sg) + 0.004
        o0, o1, h0, h1 = X_SC + 0.16, X_STEP - 0.14, None, WR - 0.14
        for x0, x1 in zip(xs, xs[1:]):
            for yf, nrm in ((yo, (0, sg, 0)), (yi, (0, -sg, 0))):
                lo = lambda x: zb(x) + 0.30
                if fine and x0 >= o0 - 1e-6 and x1 <= o1 + 1e-6:
                    A.poly([(x0, yf(x0), zb(x0)), (x1, yf(x1), zb(x1)), (x1, yf(x1), lo(x1)), (x0, yf(x0), lo(x0))], C['white'], nrm)
                    A.poly([(x0, yf(x0), h1), (x1, yf(x1), h1), (x1, yf(x1), WR), (x0, yf(x0), WR)], C['white'], nrm)
                else:
                    A.poly([(x0, yf(x0), zb(x0)), (x1, yf(x1), zb(x1)), (x1, yf(x1), WR), (x0, yf(x0), WR)], C['white'], nrm)
        if not fine: continue
        # the opening's edges and the screen's ends; a black rubbing rail round the opening
        oxs = [x for x in xs if o0 - 1e-6 <= x <= o1 + 1e-6]
        for xa, xb in zip(oxs, oxs[1:]):
            for z, nz in ((None, 1), (h1, -1)):
                za = zb(xa) + 0.30 if z is None else z; zb_ = zb(xb) + 0.30 if z is None else z
                A.poly([(xa, yo(xa), za), (xb, yo(xb), zb_), (xb, yi(xb), zb_), (xa, yi(xa), za)], C['white'], (0, 0, nz))
        for x, nx in ((oxs[0], 1), (oxs[-1], -1)):
            A.poly([(x, yo(x), zb(x) + 0.30), (x, yi(x), zb(x) + 0.30), (x, yi(x), h1), (x, yo(x), h1)], C['white'], (nx, 0, 0))
        for x, nx in ((X_SC, -1), (X_STEP, 1)):
            A.poly([(x, yo(x), zb(x)), (x, yi(x), zb(x)), (x, yi(x), WR), (x, yo(x), WR)], C['white'], (nx, 0, 0))
        F.pipe(A, [(X_SC + 0.04, yi(X_SC + 0.04) - sg * 0.004, zb(X_SC) + 0.9), (X_SC + 0.04, yi(X_SC + 0.04) - sg * 0.06, zb(X_SC) + 0.9),
                   (X_SC + 0.04, yi(X_SC + 0.04) - sg * 0.06, zb(X_SC) + 1.5), (X_SC + 0.04, yi(X_SC + 0.04) - sg * 0.004, zb(X_SC) + 1.5)], 0.014, C['steel'], 6)


# the helm to starboard under the front windows: the console with the dash sloping up forward, the screens facing the skipper, the wheel
# ahead of him (the first script stood him in it), the lever on the console's side, the seat behind him; the bench to port
HX0, HX1, HY0, HY1 = 7.70, 7.98, -1.25, -0.25                 # the console's after face, its front, its sides
DASHL = ((7.72, ZFD + 0.92), (7.98, ZFD + 1.10))              # the dash's after foot and fore top (x, z)
WHEEL = (7.60, -0.46, ZFD + 0.98); WHEEL_AX = (-1.0, 0.0, 0.55)
SKIP = (7.18, -0.46); SEAT = (6.76, -0.46)                     # in the middle of the starboard front pane (not behind its pillar)
EYE_H = 1.65
HP, FOV = -0.26, 60          # the bridge view's pitch (rad) and field: the dash inside it (check())
def dash_pt(t, y):
    (x0, z0), (x1, z1) = DASHL; return V((x0 + (x1 - x0) * t, y, z0 + (z1 - z0) * t))
def dash_n():
    (x0, z0), (x1, z1) = DASHL; return V((-(z1 - z0), 0, x1 - x0)).normalized()
SCR = {'plot': (-1.20, -0.90, 0.10, 0.90), 'sound': (-0.86, -0.68, 0.10, 0.90), 'eng': (-0.62, -0.30, 0.62, 0.95)}
HELM_EXTRA = []
def helm(A, G, fine=True):
    w = C['inner']; z0 = ZFD; (x0, dz0), (x1, dz1) = DASHL; xw = HX1
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
    cb = dash_pt(0.40, -0.30) + V((0.0, 0, -0.005))
    acyl(A, cb, cb + V((0, 0, 0.05)), 0.065, lambda q: C['dark'], seg=16)
    HELM_EXTRA.append(sphere('compass', cb + V((0, 0, 0.08)), 0.055, C['glass'], (1, 1, 0.7)))
    cp = dash_pt(0.25, -0.46) + n * 0.003
    obox(A, cp, V((0, 0.07, 0)), (dash_pt(1, 0) - dash_pt(0, 0)).normalized() * 0.03, n * 0.004, C['switch'])
    for k in range(4): obox(A, cp + n * 0.005 + V((0, -0.05 + 0.033 * k, 0)), V((0, 0.009, 0)), V((0.004, 0, 0.008)), n * 0.004, C['lampG'] if k < 3 else C['lampR'])
    F.helm_wheel(A, WHEEL, WHEEL_AX, 0.20, C['cush'], C['steel'], C['dark'])
    acyl(A, V(WHEEL) - V(WHEEL_AX).normalized() * 0.14, (HX0 + 0.004, WHEEL[1], WHEEL[2] + 0.02), 0.03, lambda q: C['dark'], seg=10)
    F.single_lever(A, (HX0 + 0.12, HY1, z0 + 0.80), (0, 1, 0), (1, 0, 0), C['dark'], C['steel'], C['black'])
    vc = V((7.40, -1.10, WR - 0.06))                          # the VHF overhead
    obox(A, vc, V((0.09, 0, 0)), V((0, 0.10, 0)), V((0, 0, 0.05)), C['dark'])
    A.poly([vc + V((-0.091, -0.08, -0.03)), vc + V((-0.091, 0.08, -0.03)), vc + V((-0.091, 0.08, 0.03)), vc + V((-0.091, -0.08, 0.03))], C['screen'], (-1, 0, 0))
    F.helm_seat(A, (SEAT[0], SEAT[1], z0), (1, 0, 0), 0.76, C['steel'], C['cush'])
    # the bench to port along the side, the chart table forward of it
    yi = WY - WT
    abox(A, 6.10, 7.30, 0.80, yi - 0.004, z0, z0 + 0.42, C['inner']); abox(A, 6.12, 7.28, 0.82, yi - 0.006, z0 + 0.42, z0 + 0.50, C['cush'])
    abox(A, 6.12, 7.28, yi - 0.09, yi - 0.006, z0 + 0.50, z0 + 0.92, C['cush'])
    abox(A, 7.45, 7.95, 0.55, yi - 0.004, z0, z0 + 0.86, C['inner']); abox(A, 7.47, 7.93, 0.57, yi - 0.006, z0 + 0.86, z0 + 0.88, C['dark'])


# ---------- the decks' fittings: rails, the windlass and the bow roller, bitts and cleats, vents, the hauling port's roller, the grab
# rails aft, the locker in the starboard quarter (the crane's pedestal), the flag mast aft ----------
def gunwale_y(x, sg=1): return ycap(x, sg) + CAP * 0.5
LOCKER = (0.25, 1.40, 0.55)  # the stainless locker in the starboard quarter: x0, x1, its depth in from the bulwark; its top 0.3 over the cap
def locker_top(): return z_sh(0.8) + 0.30
def decks(A, fine=True):
    s = lambda q: C['steel']
    def base(p, r=0.026): acyl(A, (p[0], p[1], p[2] - 0.003), (p[0], p[1], p[2] + 0.008), r, s, seg=10)
    # the rails round the foredeck: posts on bases on the caps, a top and a knee rail, closing round the bow in a pulpit
    xs = [6.20, 6.80, 7.40, 8.00, 8.60, 9.20, 9.75, 10.25]
    if fine:
        for sg in (1, -1):
            for x in xs:
                zc = z_cap(x, sg) + 0.012; y = sg * gunwale_y(x, sg); base((x, y, zc)); acyl(A, (x, y, zc), (x, y, zc + 0.6), 0.016, s, seg=8)
        for h, r in ((0.60, 0.018), (0.31, 0.013)):
            pts = [(5.95, -gunwale_y(5.95, -1), z_cap(5.95, -1) + 0.012 + h * 0.6)] + [(x, -gunwale_y(x, -1), z_cap(x, -1) + 0.012 + h) for x in xs]
            pts += [(10.62, -0.24, z_cap(10.62) + 0.012 + h), (10.74, 0.0, z_cap(10.74) + 0.012 + h + 0.02), (10.62, 0.24, z_cap(10.62) + 0.012 + h)]
            pts += [(x, gunwale_y(x), z_cap(x) + 0.012 + h) for x in reversed(xs)] + [(5.95, gunwale_y(5.95), z_cap(5.95) + 0.012 + h * 0.6)]
            F.pipe(A, pts, r, C['steel'], 8)
        for sg in (1, -1): acyl(A, (5.95, sg * gunwale_y(5.95, sg), z_cap(5.95, sg) + 0.012), (5.95, sg * gunwale_y(5.95, sg), z_cap(5.95, sg) + 0.37), 0.016, s, seg=8)
        for sg in (1, -1): acyl(A, (10.62, sg * 0.24, z_bk(10.62) + camber(10.62, 0.24) - 0.004), (10.62, sg * 0.24, z_cap(10.62) + 0.61), 0.016, s, seg=8)
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
    cp = wx + 0.32; acyl(A, (cp, -0.21, z_bk(cp) + camber(cp, 0.21) - 0.004), (cp, -0.21, z_bk(cp) + 0.06), 0.06, s, seg=12)
    F.bow_roller(A, (10.30, 0, z_bk(10.30) + 0.004), (ROLLER_X, 0, ROLLER_Z), C['steel'], C['rubber'], R=0.05, W=0.15, deck=lambda x: z_bk(min(x, XF - 0.02)) + camber(min(x, XF - 0.02), 0) + 0.002, x_end=10.85)
    # the hauling port's roller in its sill, under the roof's after edge
    hy_o = -(ysh(HXR, -1) + 0.01); hy_i = -(ycap(HXR, -1) - 0.01)
    F.hauling_roller(A, HP0 + 0.08, HP1 - 0.08, hy_o, hy_i, z_cap(HXR, -1) + 0.012, C['steel'], C['rubber'], R=0.05)
    if not fine: return
    # the stem bar: a half-round stainless strip up the stem from the forefoot to the head
    stem = [(x, 0.0, z_keel(x)) for x in [9.4 + (XF - 0.01 - 9.4) * k / 16 for k in range(17)]]
    for a, b in zip(stem, stem[1:]): acyl(A, (a[0] + 0.006, 0, a[2]), (b[0] + 0.006, 0, b[2]), 0.022, lambda z: C['steel'] if z > WL + 0.1 else C['af'], seg=6, cap=False)
    # the bitts on the foredeck, the cleats on the caps, two mushroom vents, the grab rails on the wheelhouse's front
    for y in (0.62, -0.62): F.bitts(A, 9.30, y, z_bk(9.30) + camber(9.30, y), C['steel'])
    for x in (8.85, 3.20, 0.35):
        for sg in (1, -1): F.cleat(A, (x, sg * gunwale_y(x, sg), z_cap(x, sg) + 0.006), (0, 0, 1), (1, 0, 0), 0.24, C['steel'])
    for y in (0.70, -0.70): F.mushroom_vent(A, (8.62, y, z_bk(8.62) + camber(8.62, y)), C['white'])
    for sg in (1, -1):
        p0 = V((WXF - lean(WS - 0.10) + 0.05, sg * 0.25, WS - 0.10)); p1 = V((WXF - lean(WS - 0.10) + 0.05, sg * 0.75, WS - 0.10))
        F.pipe(A, [p0 - V((0.05, 0, 0)), p0, p1, p1 - V((0.05, 0, 0))], 0.014, C['steel'], 6)
    # the grab rails along the inside of the bulwarks aft (Jonas' picture of the deck), clear of the locker, the tub and the hauling port
    # (port none since OB9: the gutting bench stands along the port bulwark abreast the hatch, 1.54-3.26)
    for sg, x0, x1 in ((1, 0.70, 4.10),):
        xs_ = [x0 + (x1 - x0) * k / max(1, round((x1 - x0) / 0.8)) for k in range(int(max(1, round((x1 - x0) / 0.8))) + 1)]
        pts = [(x, sg * (ybw(x, sg) - 0.13), ZMD + 0.80) for x in xs_]
        for p in pts:
            F.pipe(A, [(p[0], sg * (ybw(p[0], sg) + 0.01), p[2] - 0.30), (p[0], p[1], p[2] - 0.30), (p[0], p[1], p[2]), (p[0], sg * (ybw(p[0], sg) + 0.04), p[2])], 0.014, C['steel'], 6)
        F.pipe(A, pts, 0.022, C['steel'], 8)
    # the stainless locker in the starboard quarter: its body against the bulwark, the lid's seam and hasp (the crane stands on it)
    x0, x1, dpt = LOCKER; yo = -(ybw(x0, -1) - 0.01); yi = yo + dpt; zt = locker_top()
    abox(A, x0, x1, yo, yi, ZMD + camber(0.8, yi) - 0.004, zt, C['plate'])
    abox(A, x0 + 0.03, x1 - 0.03, yi, yi + 0.006, zt - 0.10, zt - 0.09, C['dark'])
    obox(A, (x0 + (x1 - x0) * 0.75, yi + 0.012, zt - 0.16), V((0.03, 0, 0)), V((0, 0.006, 0)), V((0, 0, 0.05)), C['steel'])
    # the slim mast on the port quarter: its foot plate on the cap, the pole, a cross-tree, two struts; the flag flies from its top (pole)
    qx, qy = aftm(); zq = z_cap(qx) + 0.012
    abox(A, qx - 0.09, qx + 0.09, qy - 0.03, qy + 0.03, zq - 0.004, zq + 0.012, C['steel'])
    acyl(A, (qx, qy, zq), (qx, qy, AFTM_TOP), 0.045, s, seg=10)
    for d in (0.8, 1.2): acyl(A, (qx + d, gunwale_y(qx + d) - 0.01, z_cap(qx + d) + 0.012), (qx + 0.03, qy, 4.6), 0.026, s, seg=6)
    abox(A, qx - 0.04, qx + 0.04, qy - 0.45, qy + 0.25, 5.10, 5.14, C['steel'])
    F.whip(A, (qx, qy - 0.40, 5.14), 0.9, C['white'], r0=0.012, r1=0.005, m_foot=C['steel'])
    # the stern light on its bracket over the transom's middle (B8), the transom's ladder to starboard (no fenders stowed aft: Jonas 10.11.2026, «Fjern pyntefenderne fra båt-modellen»; the game hangs its own out at the quay)
    sx, sz = STERN_L[0], STERN_L[2]
    acyl(A, (0.04, 0, z_cap(0.04) + 0.008), (0.04, 0, sz - 0.04), 0.018, s, seg=8)
    abox(A, 0.0, 0.08, -0.04, 0.04, sz - 0.05, sz - 0.032, C['frame'])
    for y in (-0.85, -1.15):
        acyl(A, (0.03, y, z_cap(0.0) + 0.30), (0.03, y, z_cap(0.0) + 0.012), 0.016, s, seg=6)
        acyl(A, (0.03, y, z_cap(0.0) + 0.012), (-0.05, y, z_cap(0.0) - 0.02), 0.016, s, seg=6)
        acyl(A, (-0.05, y, z_cap(0.0) - 0.02), (-0.05, y, WL - 0.30), 0.016, s, seg=6)
    for k in range(6): z = WL - 0.25 + 0.30 * k; acyl(A, (-0.05, -0.85, z), (-0.05, -1.15, z), 0.014, s, seg=5)
    for k in range(3): z = WL - 0.25 + 0.30 * k + 0.6; abox(A, -0.004, 0.0, -1.20, -0.80, z - 0.012, z + 0.012, C['steel'])   # the ladder's brackets on the transom
WINDLASS = 9.55; ROLLER_Z = 3.56; ROLLER_X = 11.00
HXR = (HP0 + HP1) / 2        # the hauler's station: the middle of the hauling port (P: 3.9)
AFTM_X = 0.45; AFTM_TOP = 5.60
def aftm(): return (AFTM_X, gunwale_y(AFTM_X))
STERN_L = (0.04, 0.0, 3.22)  # the stern light over the transom's middle, on its post


# ---------- the masts and rigging on the wheelhouse's roof: the A-frame mast with its cross-trees, the radar brackets, the fishing
# lights and the all-round white on top, the derrick's hauling block; the side lights on the wheelhouse ----------
MX = 6.60; M_TOP = 9.55
FISH_R, FISH_W = 8.55, 7.50  # the fishing lights red over white on an arm aft of the mast (1.05 m apart)
def white_z(): return M_TOP + 0.10
SIDE_X = 7.66; SIDE_Z = 4.42 # the side lights on the wheelhouse's sides forward of the windows, under the roof's lip
def lamp(A, c, m, fine=True):
    if fine: F.allround_lantern(A, c, m, C['frame'], R=0.035, H=0.07)
    else: acyl(A, (c[0], c[1], c[2] - 0.05), (c[0], c[1], c[2] + 0.05), 0.04, lambda q: m, seg=6)
def rig(A, fine=True):
    seg = 12 if fine else 6; s = lambda q: C['steel']; zr = roof_top(MX, 0)
    acyl(A, (MX, 0, zr - 0.004), (MX, 0, M_TOP), 0.075, s, seg=seg)
    lamp(A, (MX, 0, white_z()), C['lampW'], fine)
    acyl(A, (MX, 0, M_TOP), (MX, 0, white_z() - 0.05), 0.03, s, seg=8)
    for sg in (1, -1):
        fx, fy = 7.70, sg * 1.20; ax, ay = 4.30, sg * 1.50
        acyl(A, (fx, fy, roof_top(fx, fy)), (MX + 0.04, sg * 0.06, 7.6), 0.05, s, seg=8)
        acyl(A, (ax, ay, roof_top(ax, ay)), (MX - 0.04, sg * 0.06, 8.0), 0.055, lambda q: C['roofy'], seg=8)
        for x, yy in ((fx, fy), (ax, ay)): abox(A, x - 0.1, x + 0.1, yy - 0.1, yy + 0.1, roof_top(x, yy) - 0.01, roof_top(x, yy) + 0.03, C['steel'])
    abox(A, MX - 0.06, MX + 0.06, -0.9, 0.9, 8.10, 8.16, C['steel'])
    abox(A, MX - 0.06, MX + 0.06, -0.6, 0.6, 8.85, 8.90, C['steel'])
    # the radar brackets (the radars are the game's kit): the dome's bracket forward low, the open array's platform at the cross-tree
    abox(A, MX + 0.05, MX + 0.86, -0.32, 0.32, 6.70, 6.75, C['steel']); beam(A, (MX + 0.05, 0, 6.3), (MX + 0.66, 0, 6.72), 0.05, 0.05, C['steel'])
    abox(A, MX + 0.06, MX + 1.20, -0.30, 0.30, 8.10, 8.16, C['steel']); beam(A, (MX + 0.08, 0, 7.55), (MX + 1.08, 0, 8.11), 0.05, 0.05, C['steel'])
    # the fishing lights: red over white on an arm aft of the mast to port (rule 26)
    fxl, fyl = MX - 0.42, 0.20
    for z, mt in ((FISH_R, C['lampR']), (FISH_W, C['lampW'])):
        beam(A, (MX - 0.05, 0.02, z - 0.10), (fxl, fyl, z - 0.10), 0.03, 0.03, C['steel'])
        acyl(A, (fxl, fyl, z - 0.10), (fxl, fyl, z - 0.07), 0.04, s, seg=10)
        lamp(A, (fxl, fyl, z), mt, fine)
    if not fine: return
    # the work lights on the lower cross-tree, the whips, the GPS; the derrick's arm aft with the hauling block on its chain
    for sg in (1, -1):
        F.work_light(A, (MX + 0.15, sg * 0.75, 8.10), (1, 0, -0.5), C['dark'], C['lens'])
        F.work_light(A, (MX - 0.15, sg * 0.75, 8.10), (-1, 0, -0.6), C['dark'], C['lens'])
    for y in (-0.5, 0.5): F.whip(A, (MX - 0.05, y, 8.90), 1.4, C['white'], r0=0.012, r1=0.005, m_foot=C['steel'])
    F.gps(A, (MX, 0.85, 8.16), C['white'], r=0.06, h=0.12, m_post=C['steel'])
    hb = (MX - 0.75, 0.0, 7.0)
    beam(A, (MX, 0, 7.2), (hb[0], 0, 7.2), 0.08, 0.08, C['steel'])
    for k in range(6): z = 7.15 - 0.07 * k; acyl(A, (hb[0], 0, z), (hb[0], 0, z - 0.06), 0.02, lambda q: C['dark'], seg=5)
    acyl(A, (hb[0] - 0.08, 0, 6.55), (hb[0] + 0.08, 0, 6.55), 0.17, lambda q: C['dark'], seg=14)
    abox(A, hb[0] - 0.1, hb[0] + 0.1, -0.2, 0.2, 6.6, 6.75, C['plate'])
    # on the roof: the rail round its after part and sides, the horn, the searchlight, the work lights under its after edge
    side = lambda sg: [(X_SH + 0.12, sg * 0.6), (X_SH + 0.12, sg * (ysh(4.0) - 0.12)), (5.0, sg * (ysh(5.0) - 0.12)), (5.9, sg * (ysh(5.9) - 0.15)), (6.4, sg * (WY - 0.02)), (6.9, sg * (WY - 0.02))]
    for sg in (1, -1):
        P = side(sg)
        for x, y in P: acyl(A, (x, y, roof_top(x, y) - 0.004), (x, y, roof_top(x, y) + 0.45), 0.016, s, seg=8)
        F.pipe(A, [(x, y, roof_top(x, y) + 0.45) for x, y in P], 0.018, C['steel'], 8)
    acyl(A, (7.70, -0.90, roof_top(7.7, 0.9)), (7.70, -0.90, roof_top(7.7, 0.9) + 0.16), 0.04, s, seg=8)
    acyl(A, (7.70, -0.90, roof_top(7.7, 0.9) + 0.20), (7.95, -0.90, roof_top(7.7, 0.9) + 0.22), 0.03, lambda q: C['white'], seg=10, r1=0.08)
    F.searchlight(A, (7.75, 0.90, roof_top(7.75, 0.9)), (1, 0), 0.085, C['dark'], C['lens'], C['steel'])
    for yy in (-0.8, 0.8): F.work_light(A, (X_SH + 0.18, yy, WR - 0.022), (-0.4, 0, -1), C['dark'], C['lens'])

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
RX_ = 0.30                   # the rudder's stock (its leading edge)
PROP = (0.72, 0.0, -0.08); PR = 0.36                          # the propeller's centre and radius (P: 0.72, 500 hp at about 2:1, a 28 in wheel)
def underwater(fine=True):
    U = Acc('under')
    F.foil_rudder(U, (RX_, 0.0), -0.48, 0.0, 0.34, C['af'], thick=0.13, top=lambda x: z_keel(max(x, 0.0)) - 0.03, n=12 if fine else 5, rows=6 if fine else 2)
    acyl(U, (RX_ - 0.04, 0, -0.48), (RX_ - 0.04, 0, z_keel(RX_) + 0.06), 0.03, lambda q: C['steel'], seg=10)
    acyl(U, (RX_ - 0.04, 0, z_keel(RX_) - 0.05), (RX_ - 0.04, 0, z_keel(RX_) + 0.01), 0.06, lambda q: C['prop'], seg=12)
    px, py, pz = PROP
    if not fine: return U.done(35)          # (the far version: no shaft or propeller under the water)
    acyl(U, (px + 0.07, 0, pz), (X_SA + 0.05, 0, pz), 0.035, lambda q: C['steel'], seg=10)
    acyl(U, (X_SA - 0.05, 0, pz), (X_SA + 0.02, 0, pz), 0.065, lambda q: C['prop'], seg=14, r1=0.075)
    acyl(U, (px + 0.14, 0, pz), (px + 0.20, 0, pz), 0.06, lambda q: C['anode'], seg=14)
    F.propeller(U, PROP, (1, 0, 0), PR, C['prop'], n=4, hub=0.20, pitch=1.0, skew=0.30, cpp=False, fine=fine)
    for sg in (1, -1):
        for x, z in ((2.6, -0.30), (4.6, -0.30)): F.anode(U, (x, sg * (SK_W + 0.024), z), (0, sg, 0), (1, 0, 0), C['anode'], L=0.30, w=0.09, t=0.035, m_strap=C['steel'])
        F.anode(U, (-0.003, sg * 0.75, 0.76), (-1, 0, 0), (0, 1, 0), C['anode'], L=0.20, w=0.07, t=0.03, m_strap=C['steel'])
    zt = bot(5.4, 0.55); acyl(U, (5.4, -0.55, zt + 0.02), (5.4, -0.55, zt - 0.03), 0.06, lambda q: C['dark'], seg=16, r1=0.055)
    xi, yi_ = 3.4, 0.40; zi = bot(xi, yi_)
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


# the waterline of the empty boat (OB9, valg 18 A in docs/planer/om-bord.md: disp is the empty boat): the form is drawn to WL 1.0 from
# Jonas' pictures (13.6 t, B12), the empty boat of 12 t floats 5 cm lower in her (check()), and the game's frame is hers, as on the
# plastsjark (plast31.py WLE); the paint stays where the form has it
WLE = WL - 0.05
def to_game(p): return (-p[1], p[2] - WLE, -(p[0] - XM))
def to_game_n(n): return (-n[1], n[2], -n[0])

NAME_D = (0.12, 0.44)        # the name's strip on the white bulwark, over the strake's top
def name_strips(G):
    """where the name is written (vessel3d.js nameStrips): on the white bulwark forward over the strake, aft of the registration mark's
    place forward (markStrips; maletest: never on each other), and across the transom's white"""
    out = []
    for sg, xs in ((1, [9.0 - 1.2 * k / 12 for k in range(13)]), (-1, [7.8 + 1.2 * k / 12 for k in range(13)])):
        B = []; T = []
        for x in xs:
            for arr, dz in ((B, NAME_D[0]), (T, NAME_D[1])): z = z_kn(x) + 2 * RH + dz; arr.append(G(x, sg * (y_at(x, z, sg) + 0.03), z))
        out.append([B, T])
    ys = [1.0 - 2.0 * k / 12 for k in range(13)]
    out.append([[G(XA - 0.02, y, z_kn(XA) + 2 * RH + 0.13) for y in ys], [G(XA - 0.02, y, z_kn(XA) + 2 * RH + 0.47) for y in ys]])
    return out

def kit_places(G):
    """the places where the game sets the deck kit (nothing that can be bought is modelled in, only its place, 19.10.2026): the liferaft
    on the roof's after part where it floats free; a ring buoy on the port screen's after end and one on the port grab rail aft; the dome
    on its bracket forward of the mast, the open array on the platform at the lower cross-tree; the net tub at the stern in the middle,
    where the nets go out over the transom; the line tubs under the shelter to port, forward of the gutting bench; one cargo place in the
    port quarter, clear of the flag mast's struts; the folding crane (Jonas 20.10.2026: «Hurtigsjarken kan ha kran») on the stainless
    locker in the starboard quarter, which is its pedestal, as the small knuckle cranes of 1-2 t*m stand on the quarters of sjarks this
    size: s 0.7 (about 2 t*m), slewing on the locker's middle, its booms folded forward along the starboard bulwark (ry 0); folded it lies
    over the bulwark's top and the locker, inboard of the cap, aft of the bleeding tub. From there it reaches the cargo place across the
    deck and out over the quay to starboard; no rest (it folds up tight at sea)"""
    r = lambda v: round(v, 3); h = math.pi / 2
    gr = lambda x: ybw(x) - 0.13 - 0.022           # the port grab rail's inboard face
    x0, x1, dpt = LOCKER; yo = -(ybw(x0, -1) - 0.01)
    return {'raft': [G(4.45, 0.70, roof_top(4.45, 0.7)) + [r(h)]],
            'buoys': [G(X_SC - 0.03, ysh(X_SC) - 0.20, 3.55) + [0.0], G(1.0, gr(1.0), ZMD + 0.80) + [r(h)]],
            'radar': G(MX + 0.55, 0, 6.75), 'radarA': G(MX + 0.85, 0, 8.16),
            'garn': {'at': G(0.70, 0.0, ZMD + camber(0.7, 0)), 'ry': 0.0},
            'stamps': {'at': G(STAMP0[0], STAMP0[1], ZMD + camber(*STAMP0)), 'ry': 0.0},
            'cargo': [G(0.85, 0.95, ZMD + camber(0.85, 0.95)) + [0.0]],
            'crane': {'at': G((x0 + x1) / 2, yo + dpt / 2, locker_top()), 'ry': 0.0, 's': 0.7, 'rest': None}}

def bower(G):
    return {'kind': 'plog', 'kg': 16, 'fair': G(ROLLER_X, 0, ROLLER_Z + 0.05), 'gypsy': G(WINDLASS, -0.21, z_bk(WINDLASS) + 0.33), 'side': 0, 'deck': True}

# the gutting bench (work.table, the game's: 1.6 m long on a boat of 10 m and more, deckcrew.js kitBoxes) along the port bulwark abreast
# the hatch (F19, OB9: at 3.30 it stood under the line tubs' place, 3.08-5.22 with eight aboard, so the one at its side had no free deck
# and stood inside the first; the gutted fish go straight down the hatch beside it); the line tubs under the shelter to port forward of
# it, two across and up to four rows aft (STAMP0: the first row's place, kit.stamps)
BENCH = 2.40; STAMP0 = (5.10, 1.30)
# the jigging places on the rails, in the order the machines are bolted on (anchors.jigZ, F21; after havsjark35.py): port on the open deck
# forward of the gutting bench by the roof's edge, starboard under the shelter forward of the hauling port, and port under the shelter
# abreast of it; never in the hauling port under the roof's edge or at the hauler, never in the door, never at the crane (the
# folded crane lies along the starboard bulwark from the locker to the bleeding tub, so starboard aft has no free rail) or under the flag
# mast's struts. Three places for her three hands (jukseMax 6: the rest of the rail is the crane's, the hauler's, the bench's and the
# steps'); more than a metre apart on a side (check())
JIG = [(-1, 3.70), (1, 4.95), (-1, 4.75)]
JIG_CLEAR = {1: [(0.0, 2.15, 'kranen'), (HP0 - 0.35, HP1 + 0.45, 'haleporten og haleren'), (X_STEP - 0.50, 9.0, 'trinnene og døra')],
             -1: [(0.0, 1.90, 'flaggmasta og stagene'), (BENCH - 0.86, BENCH + 0.86 + 0.25, 'sløyebenken'), (X_STEP - 0.50, 9.0, 'trinnene')]}
def anchors():
    G = lambda x, y, z: [round(v, 3) for v in to_game((x, y, z))]
    qx, qy = aftm()
    return {'bower': bower(G), 'eye': G(SKIP[0], SKIP[1], ZFD + EYE_H), 'skipperAt': G(SKIP[0], SKIP[1], ZFD), 'hp': HP, 'fov': FOV,
            # the hands: the fisher at the hauler in the starboard hauling port, the one who guts at the bench to port, one by the bleeding
            # tub aft of the hauler, one aft of the hatch
            'crewSpots': [G(HXR, -1.28, ZMD) + [1.57], G(BENCH, 1.05, ZMD) + [-1.57], G(3.05, -0.92, ZMD) + [3.14], G(1.45, -0.45, ZMD) + [0.0]],
            # typed lights (B8): under 12 m an all-round white (on the mast's top) and the side lights, the stern light over the transom;
            # the fishing lights red over white on their arm (rule 26); the work lights under the roof's after edge
            'lights': [[G(MX, 0, white_z()), [1, 0.95, 0.85], 'allround'],
                       [G(SIDE_X + 0.012, WY + 0.068, SIDE_Z), [1, 0.12, 0.1], 'port'], [G(SIDE_X + 0.012, -(WY + 0.068), SIDE_Z), [0.1, 1, 0.35], 'stbd'],
                       [G(*STERN_L), [1, 0.95, 0.85], 'stern'], [G(MX - 0.42, 0.20, FISH_R), [1, 0.12, 0.1], 'fishR'], [G(MX - 0.42, 0.20, FISH_W), [1, 0.95, 0.85], 'fishW'],
                       [G(X_SH + 0.18, 0.0, WR - 0.10), [1, 0.95, 0.85], 'work']],
            # the steps up from the shelter's deck: to the wheelhouse's door, and beside the house to the side decks (deckMap)
            'stairs': [{'from': G(5.00, (DOOR[0] + DOOR[1]) / 2, ZMD), 'to': G(6.30, (DOOR[0] + DOOR[1]) / 2, ZFD)}] +
                      [{'from': G(5.00, sg * 1.66, ZMD), 'to': G(6.30, sg * 1.66, ZFD)} for sg in (1, -1)],
            'doors': [{'at': G(5.00, (DOOR[0] + DOOR[1]) / 2, ZMD), 'w': round(DOOR[1] - DOOR[0], 2), 'h': round(DOOR[3] - DOOR[2], 2),
                       'in': G(WX0 + 0.6, (DOOR[0] + DOOR[1]) / 2, ZFD), 'to': 'helm', 'open': True}],
            'names': name_strips(G),
            # the work at sea: the fisher at the hauler in the starboard hauling port; the bleeding tub on the deck just aft of him; the
            # gutting bench (the game's) at the port bulwark abreast the hatch, the one who guts inboard of it; the fish go down the hatch
            'work': {'table': G(BENCH, 1.55, ZMD), 'tub': G(3.05, -1.38, ZMD)},
            'hatch': G(2.35, 0.0, ZMD + 0.05 + HOLD_H + 0.03),
            'deck': {'y': round(ZMD - WLE, 3), 'z': round(-(2.4 - XM), 3)}, 'gw': round(z_sh(3.0) - WLE, 3),
            'stern': round(XM - XA, 3), 'bow': round(-(XF - XM), 3), 'side': 1.95, 'beam': BEAM, 'pl': 4.2, 'rl': 1.6, 'open': False, 'hand': False,
            'pole': G(qx, qy, AFTM_TOP), 'hauler': G(HXR, -(ycap(HXR, -1) - 0.05), z_cap(HXR, -1) + 0.30), 'filler': G(5.30, 1.62, ZMD + 0.06),
            'jigZ': [[sd, round(XM - x, 3)] for sd, x in JIG],
            'kit': dict(kit_places(G), **potplaces.kit('hurtig11'))}


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
    v, amax = displacement(WL); wl1 = WL
    st = -0.005 if v > DISP else 0.005
    for _ in range(80):
        if (displacement(wl1)[0] - DISP) * st < 0: wl1 += st
        else: break
    out.append(('deplasement %.2f t ved tegningens vannlinje (skegen med) mot %.1f t i VESSELS; %.1f t gir vannlinja %.2f m %s (største snitt %.2f m2)' % (v, DISP, DISP, abs(WL - wl1), 'lavere' if wl1 < WL else 'høyere', amax), abs(v - DISP) / DISP < 0.15))
    ve, _ = displacement(WLE)
    out.append(('den tomme båten (spillets vannlinje WLE, %.2f m under tegningens): %.2f t mot %.1f t i VESSELS (valg 18 A: disp er den tomme båten)' % (WL - WLE, ve, DISP), abs(ve - DISP) / DISP < 0.03))
    xs = [XA + (XF - XA) * i / 400 for i in range(401)]
    loa = XF - XA
    out.append(('lengde over alt %.2f m (speilet til stevnens topp; baugrulla til %.2f) mot %.2f' % (loa, ROLLER_X + 0.05, L), abs(loa - L) / L < 0.015))
    mb = max(ysh(x) for x in xs[::4]); mr = max(y_at(x, z_kn(x) + RH) + RW for x in xs[::4] if x < 10.5)
    out.append(('største bredde %.2f m ved ripa, %.2f over lista, mot %.2f (vannlinja %.2f m)' % (2 * mb, 2 * mr, BEAM, 2 * max(y_at(x, WL) for x in xs)), abs(2 * mr - BEAM) / BEAM < 0.03))
    dr = WL - Z_SKEG
    out.append(('dypgang %.2f m med skegen mot %.2f i VESSELS; skroget alene %.2f' % (dr, DRAFT, WL - min(z_keel(x) for x in xs)), abs(dr - DRAFT) < 0.06))
    out.append(('fribord midtskips %.2f m, ved stevnen %.2f, ved speilet %.2f; arbeidsdekket %.2f over vannet (den tomme båten)' % (z_sh(XM) - WLE, z_sh(XF) - WLE, z_sh(XA) - WLE, ZMD - WLE), ZMD - WLE > 0.3))
    wz = white_z()
    out.append(('den hvite rundtlysende %.2f m over sidelanternene (vedlegg I 2(d): minst 1 m)' % (wz - SIDE_Z), wz - SIDE_Z >= 1.0))
    hs, hw = SIDE_Z - z_sh(SIDE_X), wz - z_sh(MX)
    out.append(('sidelanternene %.2f m over skroget, den hvite %.2f (vedlegg I 2(g): sidene høyst tre firedeler så høyt, %.2f)' % (hs, hw, 0.75 * hw), hs <= 0.75 * hw))
    sp = FISH_R - FISH_W
    out.append(('fiskelysene rødt over hvitt %.2f m fra hverandre (vedlegg I 2(c), under 20 m: minst 1 m), det hvite %.2f m over sidelanternene (2(j): minst to ganger avstanden, %.2f), det røde %.2f under den hvite' % (sp, FISH_W - SIDE_Z, 2 * sp, wz - FISH_R),
                sp >= 1.0 and FISH_W - SIDE_Z >= 2 * sp and wz > FISH_R + 0.3))
    qx, qy = aftm()
    out.append(('masta med den hvite står %.1f m fra flaggmasta og over den: spillet gir vimpel' % math.hypot(MX - qx, qy), math.hypot(MX - qx, qy) > 1.0 and wz > AFTM_TOP + 0.5))
    tip = PROP[2] + PR; low = PROP[2] - PR
    out.append(('propellen Ø %.2f: %.2f m klaring til skroget over, %.2f over skegens underkant (vernet), %.2f til skegen forut, %.2f til roret akter' % (2 * PR, z_keel(PROP[0]) - tip, low - Z_SKEG, X_SA - PROP[0] - 0.10, PROP[0] - 0.10 - RX_),
                z_keel(PROP[0]) - tip > 0.08 and low - Z_SKEG > 0.05 and X_SA - PROP[0] - 0.10 > 0.2 and PROP[0] - 0.10 - RX_ > 0.2))
    out.append(('styrehuset: %.2f m under taket over dørken der skipperen står (brotest: 1.8)' % (WR - ZFD), WR - ZFD >= 1.8))
    ey = ZFD + EYE_H
    out.append(('øyet %.2f m over frontvinduenes underkant, %.2f under overkanten' % (ey - WS, WH - ey), ey - WS > 0.2 and WH - ey > 0.05))
    (dx0, dz0), (dx1, dz1) = DASHL
    ang = math.degrees(math.atan2(ey - (dz0 + dz1) / 2, (dx0 + dx1) / 2 - SKIP[0])); up = math.degrees(math.atan2(WH - ey, WXF - lean(WH) - SKIP[0]))
    out.append(('dashbordet %.0f grader under øyet, vinduets overkant %.0f over (hp %.2f rad og fov %d: synsfeltet går fra %.0f ned til %.0f grader)' % (ang, up, HP, FOV, FOV / 2 - math.degrees(-HP), math.degrees(-HP) + FOV / 2),
                ang <= math.degrees(-HP) + FOV / 2 and up <= FOV / 2 - math.degrees(-HP) + 12))
    out.append(('rattet %.2f m forut for skipperen (han står bak det, ikke i det), setet %.2f bak ham' % (WHEEL[0] - SKIP[0], SKIP[0] - SEAT[0]), 0.3 <= WHEEL[0] - SKIP[0] <= 0.55 and SKIP[0] - SEAT[0] >= 0.35))
    # the game's deck map (vessel3d.js deckMap, sulebas-bygging kap. 15): a floor needs DM_HEAD 1.85 m free over it; a part within 0.6 m
    # and up to 1.6 m higher than the deck is joined to it
    side = ybw(6.6) - (WY + 0.10); us = WR - 0.022                 # (the underside of the drip edge under the brim, valg 26)
    out.append(('taket med bremmen: dryppkanten %.2f m over sidedekket (%.2f m bredt) ved siden av styrhuset, %.2f over arbeidsdekket under skjulet og i haleporten (dekkskartet: 1.85); bremmens topp %.2f over underslaget' % (us - ZFD, side, us - ZMD, BRIM_H), us - ZFD >= 1.85 and us - ZMD >= 1.85 and side >= 0.3))
    out.append(('trinnene %.2f m høye opp til styrhusdøra og sidedekkene' % ((ZFD - ZMD) / 4), (ZFD - ZMD) / 4 <= 0.22))
    out.append(('kistas lokk %.2f m over dekket (knyttes til dekket: kranens fot, en enkel boks)' % (locker_top() - ZMD), locker_top() - ZMD < 1.6))
    out.append(('lukekarmen %.2f m høy, luka %.2f x %.2f m' % (HOLD_H, HOLD[1] - HOLD[0], HOLD[3] - HOLD[2]), HOLD_H <= 0.25))
    # the hauling port: its sill over the deck (a man hauls standing), the fisher's place inside it
    sill = z_cap(HXR, -1) - ZMD
    out.append(('haleporten %.2f m over dekket (%.2f-%.2f), ripa ellers %.2f' % (sill, HP0, HP1, z_sh(HXR) - ZMD), 0.4 <= sill <= 0.7))
    out.append(('navnefeltene på bauens hvite skansekledning fra x 7.8 til 9.0, merket forut for x 9.3 (maletest: aldri oppå hverandre)', True))
    # vessel3d: the hull from 0.3 m under the water to 1.5 m over it
    z0b, z1b = WL - 0.3, WL + 1.5
    fw = max(x for x in xs if z_keel(x) < z1b); ln = fw - XA
    out.append(('vessel3d: skroget i båndet -0.3 til 1.5 m er %.2f m langt (lengden %.2f, -6 %% til +3 %%) og %.2f m bredt (bredden %.2f, ±5 %%)' % (ln, L, 2 * mr, BEAM), -0.06 < (ln - L) / L < 0.03 and abs(2 * mr - BEAM) / BEAM < 0.05))
    # the hull's fairness (sulebas-bygging kap. 16): the waterlines on the topsides (between the chine's flat and the knuckle, where the
    # hull is smooth; the chine and the knuckle are creases meant), their slope's change from one 6 cm step to the next
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
    # the panel lines: the chine and the knuckle, their half-breadth's slope from one 6 cm step to the next
    for nm, fy in (('slaget', y_ch), ('knekken', y_kn), ('ripa', y_sh_)):
        yv = [fy(0.1 + 0.06 * i) for i in range(170)]; d = [b - a for a, b in zip(yv, yv[1:])]
        wv = max((abs(d[i] - d[i - 1]), 0.1 + 0.06 * i) for i in range(1, len(d)))
        out.append(('%s i plan: største endring i stigningen %.3f m per 6 cm (ved x %.2f)' % (nm, wv[0], wv[1]), wv[0] < 0.02))
    # the gutting bench and the line tubs (F19, deckcrew.js kitBoxes: the bench 0.62 x 1.6 m, the tubs' block with eight aboard 0.78 x
    # 2.02 m, each padded 6 cm): apart, and the deck at the bench's side 0.7 m fore and aft of the one gutting free of both and the hatch
    bx = (BENCH - 0.86, BENCH + 0.86); sx = (STAMP0[0] - 0.75 - 1.07, STAMP0[0] - 0.75 + 1.07); gy = 1.55 - 0.62
    two = [BENCH - 0.7, BENCH + 0.7]; free2 = any(not (sx[0] - 0.2 < x < sx[1] + 0.2 and 0.59 - 0.2 < gy < 1.49 + 0.2) for x in two) and gy - 0.25 > HOLD[3] + 0.06
    out.append(('sløyebenken x %.2f-%.2f ved babord ripe tvers av luka, stampene x %.2f-%.2f forut for den (%.2f m imellom); nummer to ved benken har fritt dekk %.2f m akter for den første (deckAt tar den siden som er fri)' % (bx[0], bx[1], sx[0], sx[1], sx[0] - bx[1], 0.7),
                sx[0] - bx[1] > 0.0 and free2))
    # the jigging places (F21): on both sides, over a metre apart on a side, clear of what stands on the rail
    bad = [(sd, x, nm) for sd, x in JIG for x0, x1, nm in JIG_CLEAR[sd] if x0 <= x <= x1]
    gap = min([abs(a[1] - b[1]) for a in JIG for b in JIG if a is not b and a[0] == b[0]] or [9])
    out.append(('juksaplassene %s: %d på styrbord og %d på babord, minst %.2f m imellom på samme side, fri for %s' % (', '.join('%s %.2f' % ('sb' if sd > 0 else 'bb', x) for sd, x in JIG),
                sum(1 for sd, _ in JIG if sd > 0), sum(1 for sd, _ in JIG if sd < 0), gap, 'kranen, haleporten, døra, benken og stagene' if not bad else bad), not bad and gap > 1.0 and {1, -1} <= {sd for sd, _ in JIG}))
    for s, ok_ in out: print(('OK   ' if ok_ else 'FEIL ') + s)
    return all(o for _, o in out)


SHOTS = [('bow3q', (19.0, 9.5, 5.0), (5.5, 0, 3.0), 38), ('stern3q', (-6.5, -8.5, 6.2), (4.0, 0, 3.0), 35), ('side', (5.5, 22, 3.6), (5.5, 0, 3.6), 35),
         ('deck', (-2.5, -3.2, 5.8), (3.5, 0, 2.4), 35), ('above', (12.0, -7.0, 11.0), (5.0, 0, 3.0), 35)]
ZC = ZMD                     # the working deck's height (shots.py K5)
K5 = ((0.40, -0.40, ZMD + 1.70), (5.6, 0.0, ZMD + 0.9))
EYE = (SKIP[0], SKIP[1], ZFD + EYE_H)
CLOSE = [('c_helm', (6.80, -0.30, 4.30), (7.85, -0.75, 3.70), 30, False, False), ('c_wh', (10.8, -4.6, 4.6), (7.0, -0.4, 3.8), 30, True, False),
         ('c_stern', (-3.4, -2.6, 2.6), (0.3, 0, 1.6), 32, True, False), ('c_bow', (13.0, -2.6, 3.6), (10.2, 0, 2.6), 30, False, False),
         ('c_under', (1.6, -3.6, -0.3), (1.0, 0, -0.1), 30, False, False), ('c_work', (5.4, -0.2, 5.2), (2.6, 0.0, 1.6), 30, False, False),
         ('c_haul', (4.6, -3.8, 3.4), (3.9, -1.6, 2.4), 30, True, False), ('c_shelter', (2.4, 0.6, 3.6), (5.6, 0.0, 2.6), 30, False, False),
         ('c_rig', (9.5, -6.0, 7.5), (6.4, 0.0, 7.4), 35, True, False), ('c_bottom', (6.0, -5.5, -1.6), (5.5, 0, 0.6), 30, False, False),
         ('K6p', (5.5 + 31.0, 24.0, 4.0), (5.5, 0, 2.5), 100, True, True)]      # K6 from the port bow: the red and the white only

def main():
    os.makedirs(OUT, exist_ok=True)
    if 'check' in sys.argv: sys.exit(0 if check() else 1)
    check()
    reset(); colours()
    solids, glass = build(True)
    join(solids, 'BOAT0'); join(glass, 'GLASS0')
    if 'fast' not in sys.argv and 'dry' not in sys.argv: beauty(OUT, 'hu', WL, SHOTS)
    ex = {'frame': 'kystfiske: x starboard, y up from the waterline, z aft; metres', 'type': 'hurtigsjark', 'name': 'Used speed sjark 10.99 m',
          'len': L, 'beam': BEAM, 'draft': DRAFT, 'anchors': anchors()}
    export_boat(build, to_game, to_game_n, OUT, 'hurtig11.glb', os.path.join(ROOT, 'src', 'data', 'boat-hurtig11.b64'), ex,
                side=(os.path.join(ROOT, 'src', 'data', 'boat-hurtig11-side.b64'), 5.5, 4.0, 13.0), dry='dry' in sys.argv)


if __name__ == '__main__':
    main()
