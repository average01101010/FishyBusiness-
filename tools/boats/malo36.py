"""The broad 36 ft sjark with a forecastle and a shelter (10.99 m; the type is `breisjark` in VESSELS): a heavy fibreglass displacement
sjark of 2015 with a deep deadwood keel, the high aft bulwark, the shelter (ly) amidships over the hauling station and the hold, the
wheelhouse on the forecastle's after end with its windscreen raked forward, the fore mast on its roof with the derrick and the fishing
lights, and the aft mast on a gantry over the stern with the net roller. The first script (02.10.2026) was measured on the general
arrangement and the data sheet of a 36 ft sjark of 10.99 m (the yard and the make are only named in the docs, CLAUDE.md; stations 1 m
apart, 92.4 px/m; the drawing is not in the repository): length 10.99, beam 4.20 (moulded, 4.40 over the fenders), depth 2.34, height with
the mast about 9.5, hold 19 m3, 300 hp, about 10 kn. Those tables are kept as they were measured (marked G): the keel line and the
forefoot, the stem, the sheer with the steps, the half-breadths at the sheer, the transom's rake, the fender strake, the shelter, the
wheelhouse and its windows, the masts and the gantry.

Rebuilt 02.11.2026 after the pilot boat's way of working (docs/skipsmodeller/breisjark-grunnlag.md, sulebas-bygging.md; havsjark35.py the
template for the code, not the shape). The old hull was two loose grids and a transom ladder, the skeg a body of its own hung under it,
the bulwarks' insides and the decks loose grids too, the freeing ports dark patches; it weighed 29.5 t against 20 t in the data. Now the
hull is ONE surface: both sides over the keel (the section starts on the keel's underside, so the deadwood is part of it), the transom,
the fender strake, the bulwarks' caps and insides, the aft deck, the forecastle's bulkhead and deck share their points (Mesh). Openings
are real holes, cut with a boolean and lined: the freeing ports, the hold and the fore hatch, the outlets, the shelter's windows and the
hauling port, the wheelhouse's windows and door. Nothing lies in the plane of anything else. The fittings other boats use come from
fittings.py. The lines are read with a smooth curve (pchip), not straight pieces.

Nothing that can be bought is modelled in (the game sets the kit at the places in kit, 19.10.2026): no hauler, no tubs, no liferaft, no
radar, no ring buoys. The plotter and the VHF are standard on this boat (VESSELS.breisjark.std) and are part of her, and so is her own
gutting table under the shelter (work.own). No maker's or yard's name anywhere (CLAUDE.md, B20).

    pip install bpy==4.5.4   (Python 3.11)
    python3 tools/boats/malo36.py            -> src/data/boat-malo36.b64 (+ the side picture), renders in tools/boats/out/
    python3 tools/boats/malo36.py fast       -> the same without the renders
    python3 tools/boats/malo36.py fast dry   -> no renders, the GLB only in tools/boats/out
    python3 tools/boats/malo36.py check      -> the checks against the tables, the data, the rules and the game's demands only

Frame (the drawing's): x forward from the aft perpendicular, y to port, z up from the base line; the waterline is z = WL = 1.38."""
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy, bmesh
from bpyutil import *
import potplaces   # the stacks of conical pots (OB16, tools/boats/potplaces.json)
import bpyutil
import fittings as F
from mathutils import noise

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE)); OUT = os.path.join(HERE, 'out')
L = 10.99; BEAM = 4.2; DRAFT = 2.0; DISP = 20.0             # VESSELS.breisjark
WL = 1.38; XA = -0.30; XF = 10.78; XM = 5.18                 # XA the transom's station (its foot), XM the game's midship (as before: 13-instruments JIG_Z)
# The drawing's waterline WL carries 21.8 t; VESSELS.disp (20 t) is the empty boat (valg 18 A, Jonas 09.11.2026). The form stands and the
# game's waterline is the empty boat's, WLE (OB11, as hs11.py, hurtig11.py and plast31.py; check() weighs her there). The paint stays at
# the drawing's line: 6 cm over the empty boat's, where a loaded boat's boot top belongs
WLE = WL - 0.06


# ---------- the measured lines (G: the drawing, metres), read with a smooth curve ----------
def ss(a, b, x): t = max(0.0, min(1.0, (x - a) / (b - a))); return t * t * (3 - 2 * t)
_PC = {}
def pchip(tab, x):
    """a smooth curve through the table's points (monotone cubic, Fritsch-Carlson; hurtig11.py, sulebas-bygging kap. 17)"""
    k = tuple(tab)   # (by content: keel_t and wk pass a new list each call, and a freed id came back for the other; krabbe50.py 07.11.2026)
    if k not in _PC:
        xs = [p[0] for p in tab]; ys = [p[1] for p in tab]; n = len(xs)
        d = [(ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]) for i in range(n - 1)]
        m = [d[0]] + [0.0 if d[i - 1] * d[i] <= 0 else 2 / (1 / d[i - 1] + 1 / d[i]) for i in range(1, n - 1)] + [d[-1]]
        _PC[k] = (xs, ys, m)
    xs, ys, m = _PC[k]
    if x <= xs[0]: return ys[0] + m[0] * (x - xs[0])
    if x >= xs[-1]: return ys[-1] + m[-1] * (x - xs[-1])
    lo, hi = 0, len(xs) - 1
    while hi - lo > 1:
        mid = (lo + hi) // 2
        if xs[mid] <= x: lo = mid
        else: hi = mid
    i = lo; h = xs[i + 1] - xs[i]; t = (x - xs[i]) / h
    return (2 * t ** 3 - 3 * t * t + 1) * ys[i] + (t ** 3 - 2 * t * t + t) * h * m[i] + (-2 * t ** 3 + 3 * t * t) * ys[i + 1] + (t ** 3 - t * t) * h * m[i + 1]

# the bottom of the hull body on the centreline, the forefoot and the stem (G; x only grows along it, so a table in x holds)
LOW = [(XA, 1.12), (0.0, 1.05), (1.0, 0.83), (2.0, 0.62), (3.0, 0.41), (4.0, 0.21), (5.0, 0.03), (6.0, -0.15), (6.6, -0.125), (7.0, -0.09), (8.0, -0.02),
       (8.5, 0.0), (9.0, 0.04), (9.56, 0.09), (9.92, 0.16), (10.18, 0.31), (10.34, 0.49), (10.42, 0.80), (10.45, 1.09), (10.465, 1.38),
       (10.50, 1.60), (10.62, 2.40), (10.75, 3.30), (XF, 3.95)]
def z_low(x): return pchip(LOW, x)
# the deadwood keel's underside from the stern post to where it runs into the body (G: the keel line -0.62 + 0.0755 x under the shoe's top)
X_KA, X_KF = 1.0, 6.6
KEEL = [(X_KA, -0.545), (2.0, -0.469), (3.0, -0.394), (4.0, -0.318), (5.0, -0.243), (6.0, -0.167), (X_KF, -0.125)]
def kb(x): return pchip(KEEL, x) if x <= X_KF else z_low(x)
def keel_t(x): return pchip([(X_KA, 0.22), (1.6, 0.26), (5.0, 0.26), (X_KF, 0.20)], x)
# the top of the bulwark: the high aft bulwark, the step down to the waist under the shelter, the step up to the forecastle (G)
# the step from the waist's rail up to the high aft bulwark: at x 3.0-2.3 on the drawing, both sides. To starboard it stands a metre further
# aft (valg 32, Jonas 10.11.2026: «den burde ha 2 maskiner»): the low rail then runs from x 2.0 to the wheelhouse, and a second jigging
# machine has a rail a man can jig over, aft of the shelter's corner. The port side (the casing against the bulwark) is the drawing's
STEP_S = (2.0, 1.3)
# the rise from the waist's rail to the forecastle's: over 6.10-6.95 as the drawing has it (CAPS). It stood over 6.40-6.68, a step of
# 0.9 m in 0.28 m that read as a break in the sheer where the forecastle begins (round 2, 11.11.2026)
RAMP = (6.10, 6.95)
def z_bakkcap(x): return 3.86 + 0.09 * max(0.0, min(1.0, (x - 6.66) / 4.12))
def z_cap(x, sg=1):
    aft = 3.76 - 0.027 * (x - XA)
    st = ss(3.0, 2.3, x) if sg > 0 else ss(STEP_S[0], STEP_S[1], x)
    return 2.965 + (aft - 2.965) * st + (z_bakkcap(x) - 2.965) * ss(RAMP[0], RAMP[1], x)
# the half-breadth at the bulwark top, moulded (the plan's outline less the strake) (G)
HB = [(XA, 1.90), (0.0, 1.98), (0.5, 2.0), (1.0, 2.01), (2.0, 2.03), (3.0, 2.04), (6.0, 2.04), (7.0, 2.035), (7.5, 2.01), (8.0, 1.97),
      (8.5, 1.90), (9.0, 1.75), (9.5, 1.55), (10.0, 1.22), (10.3, 0.96), (10.5, 0.70), (10.6, 0.50), (10.7, 0.24), (XF, 0.0)]
# (round 2, 11.11.2026: the table measured on the plan gives 4.12 m at the sheer against the data sheet's 4.20 moulded. Carried out to
# 4.20 (BSC 1.029, the bilge a little less full to weigh the same) the 4 cm more deck on the starboard quarter moved the place the game
# gives the tubs that are landed (deckcrew.js landSlots, on a 0.2 m grid) from the middle of the aft deck out to the quarter, and the one
# who gives the signs lost his place at the rail when the jigging machines stand there (crewclip, OB4's check). The table stands: 2 %
# narrow. The factors are kept for the day the deck map knows the stacks and the landing has a place of its own)
BSC = 1.0; FSC = 1.0
def hb(x): return max(0.0, pchip(HB, x)) * BSC
# the body's curve runs to a smooth line over the sheer (z_ref), and is cut at the sheer: the sheer steps 0.9 m up at the forecastle and
# 0.7 m down aft of the shelter, and a curve drawn to it changed the whole section there (a kink in the waterline at x 6.42); the
# half-breadth at z_ref is the measured one at the sheer carried up along the flare from a smoothed sheer
def z_ref(x): return 3.80 + 0.17 * (x - XA) / (XF - XA)
CAPS = [(XA, 3.76), (2.0, 3.71), (3.3, 2.97), (6.1, 2.97), (6.95, 3.87), (XF, 3.95)]
def h_ref(x): return hb(x) + max(0.0, z_ref(x) - pchip(CAPS, x)) * math.tan(math.radians(pchip(FL, x))) * min(1.0, hb(x) / 0.4)
# the section's deadrise, flare and fullness (the drawing says nothing in the sections: chosen, check() weighs them)
DR = [(XA, 10), (2.0, 18), (5.0, 22), (7.0, 27), (8.0, 33), (9.0, 44), (9.8, 56), (10.3, 66), (XF, 75)]
FL = [(XA, 3), (3.0, 4), (6.0, 5), (7.5, 8), (8.5, 13), (9.3, 18), (10.0, 24), (XF, 28)]
FULL = [(XA, 0.86), (2.0, 0.91), (5.0, 0.94), (7.0, 0.90), (8.5, 0.76), (9.5, 0.64), (XF, 0.56)]
# the fender strake (G), the bottom paint and the white boot top, rising 12 mm a metre forward (planliste kap. 29)
RUB = [(XA, 2.70), (6.0, 2.70), (7.0, 2.78), (8.0, 2.92), (9.0, 3.04), (10.0, 3.14), (10.6, 3.20), (XF, 3.24)]   # (G, as measured)
# (round 2, 11.11.2026: read through those points the strake lay flat to x 6.0 and then rose fastest at 7-8, a break in the sheer where
# the forecastle begins. One curve from x 4.0 to the stem with its slope growing all the way, within 4 cm of the measured points)
def z_rub(x): return 2.70 + 0.54 * max(0.0, (x - 4.0) / (XF - 4.0)) ** 1.8
RUBH, RUBW = 0.05, 0.05      # the strake: half its height, how far it stands out
Z_AF = 1.31; Z_BT = 1.47; SLB = 0.012
def paint_line(x, z0): return z0 + SLB * (x - XM)
def z_deck(x): return 2.26
def z_bk(x): return 3.25 + 0.18 * max(0.0, min(1.0, (x - 6.55) / 4.2)) ** 1.5
X_BAKK = 6.55
def dk(x): return z_deck(x) if x < X_BAKK else z_bk(x)
# the transom rakes aft as it rises (G: -0.30 at its foot 1.12, -0.42 at the top 3.76)
def x_t(z): return XA - 0.045 * (z - 1.12)
def x_of(s, z): return s + (x_t(z) - XA) * max(0.0, 1.0 - (s - XA))     # a station's points: the first metre follows the transom's rake


# ---------- the sections (havsjark35.py: the body as one cubic, the keel in the section) ----------
def vline(x, sg=1):
    """the body's half-section at x from the centreline (the bottom of the body) to the bulwark top, as (y, z): a cubic from the keel's
    root out along the deadrise and round the bilge up along the flare to the sheer, its control points pulled toward the corner by the
    fullness"""
    zl = z_low(x); zs = z_ref(x); h = h_ref(x); n = 48
    if h < 1e-4 or zs - zl < 1e-4: return [(0.0, zl), (0.0, z_cap(x, sg))]
    dr = math.radians(pchip(DR, x)); fl = math.radians(pchip(FL, x))
    d1 = (math.cos(dr), math.sin(dr)); d2 = (-math.sin(fl), -math.cos(fl))
    den = d1[0] * d2[1] - d1[1] * d2[0]
    # the corner where the bottom line meets the side line; in the bow the sheer stands so high over the keel that the two meet under the
    # keel (s_ < 0) and then not at all (deadrise + flare over 90 degrees): the section is a V there. A soft positive part, then a soft
    # minimum with the sheer's height, so the section changes smoothly through both (the first try jumped 0.38 m at x 9.66)
    s_ = (h * d2[1] - (zs - zl) * d2[0]) / den if den < -1e-6 else -1e9
    k_ = 0.08; s_ = k_ * math.log1p(math.exp(min(60.0, s_ / k_))) if s_ / k_ > -60 else 1e-12
    cap = (zs - zl) * 0.999 / max(1e-6, d1[1]); s_ = (max(s_, 1e-12) ** -4 + cap ** -4) ** -0.25   # a soft minimum
    C_ = (d1[0] * s_, zl + d1[1] * s_)
    lb = math.hypot(h - C_[0], zs - C_[1]); a = pchip(FULL, x) * FSC
    P0 = (0.0, zl); P1 = (d1[0] * s_ * a, zl + d1[1] * s_ * a); P3 = (h, zs); P2 = (h + d2[0] * lb * a, zs + d2[1] * lb * a)
    P = []
    for k in range(n + 1):
        t = (k / n) ** 1.15; u = 1 - t
        P.append((u ** 3 * P0[0] + 3 * u * u * t * P1[0] + 3 * u * t * t * P2[0] + t ** 3 * P3[0], u ** 3 * P0[1] + 3 * u * u * t * P1[1] + 3 * u * t * t * P2[1] + t ** 3 * P3[1]))
    out = [P[0]]
    for q in P[1:]: out.append((q[0], max(q[1], out[-1][1] + 1e-7)))
    return clip(out, z_cap(x, sg))

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

def from_y(P, y):
    for i, (a, b) in enumerate(zip(P, P[1:])):
        if b[0] >= y > a[0] - 1e-9 and b[0] > a[0]:
            t = (y - a[0]) / (b[0] - a[0]); return [(y, a[1] + (b[1] - a[1]) * t)] + P[i + 1:]
    return [P[-1]]

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

def wk(x):
    """the keel's (the stem's) half width at its underside"""
    if x < X_KA: return 0.0
    if x <= X_KF: return keel_t(x) * 0.36
    return pchip([(X_KF, keel_t(X_KF) * 0.36), (9.0, 0.045), (XF, 0.03)], x)
def wroot(x): return wk(x) * 1.6 if x <= X_KF else wk(x)

NKB, NF = 4, 3
_S = {}
def section(x, sg=1, fine=True):
    """the whole half-section at x as (y, z, kind) from the keel's underside on the centreline to the bulwark top; the counts never change
    (points collapse where a band is empty). Kinds: 'k' the keel, 'f' the fillet at its root, 'b' the bottom, 't' the blue topside,
    'r' the fender strake, 'u' the white bulwark over it, 's' the bulwark top"""
    key = (round(x, 5), sg, fine)
    if key in _S: return _S[key]
    P = vline(x, sg); zl = P[0][1]; top = P[-1][1]; out = []
    nk = NKB if fine else 1; nf = NF if fine else 1
    if x >= X_KA:
        b = kb(x); f = min(1.0, (x - X_KA) / 0.10); ww = wk(x) * f; wr = wroot(x) * f
        if x <= X_KF:
            g = ss(X_KF, X_KF - 1.2, x); wr = ww + (wr - ww) * g
            fw = 0.14 * f * g; zc = z_on(P, wr); zt = max(b + 0.06 * g, zc - 0.10 * g); e1, e2 = 0.014 * g, (0.04 if fine else 0.02) * g
            out += [(0.0, b, 'k'), (ww * 0.55, b, 'k'), (ww * 0.92, b + e1, 'k'), (ww, b + e2, 'k')] if fine else [(0.0, b, 'k'), (ww, b + e2, 'k')]
            for i in range(1, nk + 1): t = i / nk; out.append((ww + (wr - ww) * t, b + e2 + (zt - b - e2) * t, 'k'))
            y1 = wr + fw; z1 = z_on(P, y1)
            for i in range(1, nf + 1):
                t = i / (nf + 1); u = 1 - t
                out.append((u * u * wr + 2 * u * t * wr + t * t * y1, u * u * zt + 2 * u * t * zc + t * t * z1, 'f'))
            body = from_y(P, y1)
        else:
            out += [(0.0, zl, 'k'), (ww * 0.55, zl, 'k'), (ww * 0.92, zl, 'k'), (ww, zl, 'k')] if fine else [(0.0, zl, 'k'), (ww, zl, 'k')]
            out += [(ww, zl, 'k')] * nk + [(ww, zl, 'f')] * nf
            body = [(ww, zl)] + from_y(P, ww)
    else:
        out += [(0.0, zl, 'k')] * ((4 if fine else 2) + nk) + [(0.0, zl, 'f')] * nf
        body = P
    z0 = body[0][1]; cl = lambda z: min(top, max(z0, z))
    nb, nt = (16, 8) if fine else (4, 2)
    zw = cl(WL + 0.25); out += [(yy, zz, 'b') for yy, zz in along(body, z0, zw, nb)]
    zr0 = cl(z_rub(x) - RUBH); out += [(yy, zz, 't') for yy, zz in along(body, zw, zr0, nt)]
    fade = 1.0 - ss(10.50, 10.70, x)
    for dz, off in (((-0.048, 0.38), (-0.034, 0.74), (-0.014, 0.97), (0.014, 0.97), (0.034, 0.74), (0.048, 0.38), (RUBH, 0.0)) if fine else ((0.0, 1.0), (RUBH, 0.0))):
        zq = cl(z_rub(x) + dz); yy, zz = at_z(body, zq); out.append((yy + RUBW * off * fade, zz, 'r' if off > 0 else 'u' if dz > 0 else 't'))   # (the strake's top point starts the white: the face over it is the bulwark's)
    zr1 = cl(z_rub(x) + RUBH); out += [(yy, zz, 'u') for yy, zz in along(body, zr1, top, 4 if fine else 1)[:-1]]
    out.append((P[-1][0], top, 's'))
    _S[key] = out; return out

def y_at(x, z, sg=1):
    """the outside's half-breadth at x and height z (the body; the keel under its root)"""
    P = vline(x, sg)
    if z <= P[0][1]: return wk(x) if x >= X_KA else 0.0
    return at_z(P, z)[0]

def stations(fine=True):
    sp = [XA, X_KA - 0.002, X_KA, X_KA + 0.05, X_KA + 0.10, X_BAKK, X_KF, 2.30, 3.0, 6.40, 6.68, SH_X0, SH_X1]
    if fine:
        sp += [STEP_S[0], STEP_S[1]]   # (the starboard step's ends; the far model reads it at its own stations, vessel3d's 12 000 points)
        xs = [XA + 0.03, XA + 0.07, XA + 0.12, XA + 0.18] + [XA + 0.25 + 0.06 * i for i in range(170)] + [10.45 + 0.025 * i for i in range(13)]
        sp += stem_stations(lambda x: z_low(x) if x > X_KF else kb(x), [Z_AF, Z_BT, lambda x: z_rub(x) - RUBH, lambda x: z_rub(x) + RUBH], 9.5, XF - 0.012)
    else:
        xs = [0.4, 1.5, 2.6, 4.0, 5.2, 7.2, 8.0, 8.8, 9.4, 9.9, 10.2, 10.4, 10.55, 10.68]
    xs = [x for x in xs if all(abs(x - s) > 0.008 for s in sp)] + sp + [XF - 0.006, XF]
    return sorted(set(round(x, 5) for x in xs if XA <= x <= XF))


# ---------- colours: the navy topsides, the white bulwarks and boot top, red-brown antifouling, the black strake, a grey deck (paint
# zones: 1 the hull, 3 the superstructure and the white bulwarks, 4 the decks; 10j-paint.js) ----------
C = {}
def colours():
    w = lambda n, rgb, g=0.4, z=0, metal=0.0, emit=0.0: C.__setitem__(n, mat(n, rgb, g, zone=z, metal=metal, emit=emit))
    w('af', (0.34, 0.08, 0.06), 0.12); w('boot', (0.92, 0.93, 0.92), 0.55, 2); w('hull', (0.05, 0.16, 0.38), 0.65, 1)
    w('white', (0.91, 0.92, 0.91), 0.5, 3); w('bw', (0.91, 0.92, 0.91), 0.55, 3); w('cap', (0.86, 0.87, 0.86), 0.45, 3)
    w('roof', (0.83, 0.85, 0.84), 0.3, 3); w('inner', (0.84, 0.85, 0.84), 0.3); w('deck', (0.46, 0.49, 0.48), 0.12, 4); w('nonslip', (0.43, 0.46, 0.45), 0.06, 4)
    w('rub', (0.05, 0.05, 0.06), 0.3); w('steel', (0.76, 0.78, 0.80), 0.85, 0, 0.85); w('chrome', (0.86, 0.87, 0.89), 0.95, 0, 0.9); w('alu', (0.72, 0.74, 0.76), 0.6, 0, 0.7)
    w('mast', (0.90, 0.91, 0.90), 0.55, 3); w('dark', (0.10, 0.11, 0.12), 0.25); w('black', (0.04, 0.04, 0.05), 0.4); w('rubber', (0.05, 0.05, 0.06), 0.2)
    w('frame', (0.07, 0.07, 0.08), 0.45); w('screen', (0.03, 0.05, 0.07), 0.9); w('bezel', (0.10, 0.10, 0.11), 0.5); w('cush', (0.15, 0.16, 0.19), 0.35)
    w('switch', (0.20, 0.21, 0.22), 0.4); w('board', (0.93, 0.93, 0.90), 0.35); w('cabin', (0.05, 0.05, 0.06), 0.2)
    w('prop', (0.70, 0.52, 0.27), 0.8, 0, 0.9); w('anode', (0.55, 0.56, 0.55), 0.2); w('wood', (0.58, 0.38, 0.20), 0.3); w('red', (0.72, 0.18, 0.08), 0.5)
    w('rope', (0.85, 0.75, 0.25), 0.2); w('rope2', (0.20, 0.42, 0.62), 0.2); w('hose', (0.10, 0.36, 0.20), 0.4); w('fender', (0.08, 0.20, 0.42), 0.4)
    w('lampR', (0.90, 0.10, 0.08), 0.8, 0, 0, 0.5); w('lampG', (0.10, 0.80, 0.25), 0.8, 0, 0, 0.5); w('lampW', (1.0, 0.97, 0.88), 0.8, 0, 0, 0.5)
    w('lens', (0.95, 0.94, 0.85), 0.9)
    w('pix_plot', (0.95, 0.95, 0.95), 0.9); w('pix_sound', (0.95, 0.95, 0.95), 0.9); w('grip', (0.385, 0.415, 0.405), 0.03, 4)
    C['glass'] = mat('glass', (0.05, 0.08, 0.11), 0.95)


# ---------- the wear: per corner, so it runs across faces (B16; 2015, gelcoat, light wear) ----------
def n3(x, y, z=0.0): return noise.noise(V((x, y, z)))
def toward(m, rgb, k):
    base = m['rgb']; return [1 + (rgb[i] / max(base[i], 1e-3) - 1) * k for i in range(3)]

EXH_W = (6.10, -1, 0.32)     # the engine's cooling water outlet (x, side, height over the water)
BILGE = (4.20, -1, 0.40)     # the bilge pump's outlet
FREE = [(0.15, 0.45), (3.30, 0.45), (4.95, 0.40)]            # the freeing ports in the bulwarks at the deck (x from, length; G: the old patches at 0.6 and 1.6)
def run_under(x, z, x0, l, ztop, ln, side):
    """0-1: a run down the side under an opening x0..x0+l whose foot is at ztop, ln long, in streaks (hs11.py, OB10 round 3)"""
    u = (x - x0) / l
    if u < -0.2 or u > 1.2 or z > ztop + 0.03 or z < ztop - ln: return 0.0
    return ss(-0.2, 0.05, u) * ss(1.2, 0.95, u) * (0.45 + 0.55 * ss(-0.35, 0.35, n3(x * 17.0, side * 3.1, 0.3))) * ss(ztop - ln, ztop - 0.02, z) ** 1.3
def wear(p, m, n):
    x, y, z = p; nm = m.name; side = 1 if y > 0 else -1
    if nm == 'hull':
        g = 0.97 + 0.05 * n3(x * 4.0, z * 7.0, side * 1.3)
        g *= 1 - 0.12 * ss(0.30, 0.0, z - paint_line(x, Z_BT))                               # grime over the boot top
        g *= 1 - 0.16 * ss(0.25, 0.65, n3(x * 9.0, side * 2.3, 0.4)) * ss(0.6, 0.0, z_rub(x) - z)   # streaks down from the strake
        # (round 2) under the hauler to starboard the gear comes up the side every day: the gelcoat is scuffed pale in streaks from the
        # strake down to the water; and the quay has rubbed her dull just under the strake on both sides amidships
        if side < 0: g *= 1 + 0.30 * ss(0.50, 0.10, abs(x - HXX)) * ss(0.25, 0.60, n3(x * 26.0, 0.7, 1.9)) * ss(WL - 0.05, WL + 0.5, z)
        g *= 1 + 0.10 * ss(0.22, 0.0, z_rub(x) - z) * ss(0.2, 0.6, n3(x * 3.0, z * 14.0, side * 3.1)) * ss(1.0, 2.5, x) * ss(9.0, 7.0, x)
        for (xo, so, ho), k in ((EXH_W, 0.25), (BILGE, 0.15)):
            if side == so and z < WL + ho:
                g *= 1 - k * ss(0.02 + (WL + ho - z) * 0.04, 0.004, abs(x - xo)) * ss(WL, WL + 0.12, z)
        # (round 4; the sensor: «nesten ingen rennemerker») rust run down the topsides from the freeing ports and the hawse: brown,
        # streaky, strongest just under the strake and fading toward the water
        c = [g, g, g]; ru = 0.0
        for x0, l in FREE: ru = max(ru, run_under(x, z, x0, l, z_deck(x) + 0.03, 0.95, side))
        ru = max(ru, 0.8 * run_under(x, z, 10.0, 0.5, z_rub(x) + 0.1, 0.70, side))
        if ru > 0: c = toward(m, (0.30, 0.18, 0.11), min(1.0, 0.55 * ru)); c = [c[i] * g for i in range(3)]   # (dull: a bright rust read as a lamp at night, the sensor)
        return c
    if nm == 'af':
        v = 0.86 + 0.14 * n3(x * 2.5, z * 6.0, y * 2.0)
        g = ss(WL - 0.10, WL - 0.02, z) * (0.5 + 0.5 * ss(-0.3, 0.4, n3(x * 3.0, side * 1.3, 4.1)))
        return [v * (1 - 0.30 * g), v * (1 + 0.15 * g), v * (1 - 0.25 * g)]
    if nm == 'boot':
        v = 0.94 + 0.06 * n3(x * 4.0, z * 9.0, side) - 0.10 * ss(WL + 0.06, WL - 0.02, z); return [v, v, v]
    if nm == 'bw' and abs(y) > 1.5:
        g = 1.0
        for x0, l in FREE:                                                                     # rust-brown streaks under the freeing ports
            g *= 1 - 0.30 * ss(0.06, 0.0, abs(x - x0 - l / 2) - l / 2 + 0.05) * ss(z_deck(x) + 0.05, z_deck(x) - 0.40, z) * (0.6 + 0.4 * ss(-0.3, 0.3, n3(x * 30.0, 1.0, side)))
        c = toward(m, (0.45, 0.25, 0.12), 0.40 * ss(0.4, 0.85, n3(x * 7.0, side * 4.0, 1.1)) * ss(0.9, 0.0, z_cap(x) - z))
        g *= 1 - 0.10 * ss(0.35, 0.0, z_cap(x) - z) * (0.5 + 0.5 * n3(x * 11.0, side * 2.0, 6.0))                  # (round 3) grey where hands and ropes run over the cap
        return [c[i] * g for i in range(3)]
    if nm in ('white', 'roof', 'inner', 'mast', 'cap'):
        # (round 3; the sensor: «slitasjen finnes, men er svak»): a stronger grey-brown grime in patches, darker at the feet of what
        # stands on the decks or the caps (the splash and the boots), and grey just under the shelter roof's edge
        v = 0.93 + 0.07 * n3(x * 5.0, y * 5.0, z * 5.0)
        # (the foot: the deck, or the cap for what stands on it outboard of the bulwark's inside: the shelter's walls; the bulwarks'
        # own inner faces keep the deck as their foot, so the splash zone runs up from the deck)
        zd_ = dk(x); foot = zd_
        if nm != 'inner' and z - zd_ > 0.30 and abs(y) > 1.2 and abs(y) > ycap(x, side) - 0.01: foot = z_cap(x, side)
        v -= (0.20 if nm == 'inner' else 0.13) * ss(0.30, 0.0, z - foot) * (0.7 + 0.5 * n3(x * 8.0, y * 8.0, 4.0))
        if nm == 'white' and SH_TOP - 0.10 < z < SH_TOP + 0.05 and x < SH_X1: v -= 0.06 * ss(0.3, 0.8, n3(x * 13.0, y * 3.0, 2.0))   # (grey under the roof's edge)
        # (round 4) rain streaks down the walls from the roofs' edges and the windows' corners: narrow, grey, longer where they start high
        if nm in ('white', 'inner') and z - foot > 0.3:
            v -= 0.11 * ss(0.55, 0.85, n3(x * 22.0 + y * 22.0, 0.3, 5.0)) * ss(0.0, 0.8, n3(x * 3.0 + y * 3.0, z * 1.2, 7.5) + 0.4)
        c = toward(m, (0.55, 0.42, 0.28), 0.30 * ss(0.40, 0.9, n3(x * 7.0, y * 7.0, z * 7.0 + 0.5)))
        return [c[i] * v for i in range(3)]
    if nm in ('deck', 'nonslip'):
        v = 0.92 + 0.10 * n3(x * 5.0, y * 5.0, 1.0)
        v *= 1 - 0.14 * ss(0.8, 0.0, math.hypot(x - 5.0, y + 1.2)) - 0.10 * ss(0.7, 0.0, math.hypot(x - 3.75, y + 1.0))   # worn where they work
        if nm == 'deck' and x < X_BAKK:                                                        # the waterways: dark and a little green along the bulwarks' feet
            e = ss(0.16, 0.0, ybw(x, side) - abs(y)); return [v * (1 - 0.22 * e), v * (1 - 0.14 * e), v * (1 - 0.22 * e)]
        return [v, v, v]
    if nm == 'grip': return grip_wear(x, y)
    if nm.startswith('pix_'):
        ya, yb_, ta, tb = SCR[nm[4:]]; (dx0, dz0), (dx1, dz1) = DASH
        u = (y - (ya + yb_) / 2) / ((yb_ - ya) * 0.86) + 0.5; t = (x - dx0) / (dx1 - dx0); v_ = (t - (ta + tb) / 2) / ((tb - ta) * 0.86) + 0.5
        return (plot_pix if nm == 'pix_plot' else sound_pix)(1 - u, v_)                        # (u from the skipper's left: port is +y)
    return None

# what wears the aft deck's non-slip (the same in the render and the game: colours at the corners): pale and scuffed where they stand and
# walk day after day, a rust-brown bloom round the steel's feet, dark where the water stands
# the bitts on the quarters (round 2: they stood at 1.45 and touched the deck map's cell 1.2-1.4 m out, which then was no floor under the
# pots' stack on the starboard quarter, potshot; 7 cm further out, 13 cm from the bulwark's foot)
BITT_Y = 1.52
WORN = [(5.25, -1.38, 0.55, 0.20), (4.62, -0.86, 0.50, 0.16), (3.65, 1.03, 0.55, 0.18), (3.66, -1.45, 0.45, 0.14), (2.40, -1.42, 0.45, 0.14),
        (5.80, -1.62, 0.50, 0.14), (1.90, 0.70, 0.55, 0.12), (0.35, -0.45, 0.60, 0.12), (3.0, -0.2, 0.9, 0.08)]
RUSTY = [(0.35, BITT_Y, 0.30), (0.35, -BITT_Y, 0.30), (1.62, 0.0, 0.34), (3.25, 1.35, 0.16), (4.05, 1.35, 0.16), (0.90, 1.42, 0.22)]
def grip_wear(x, y):
    v = 0.90 + 0.16 * n3(x * 6.0, y * 6.0, 2.0) + 0.07 * n3(x * 23.0, y * 23.0, 5.0)
    for wx, wy, wr, k in WORN: v += k * ss(wr, wr * 0.25, math.hypot(x - wx, y - wy)) * (0.75 + 0.5 * n3(x * 11.0, y * 11.0, 7.0))
    v *= 1 - 0.10 * ss(0.30, 0.75, n3(x * 1.7, y * 1.7, 9.0))                                   # darker where it stays wet
    c = [v, v, v]
    for rx, ry, rr in RUSTY:
        k = 0.55 * ss(rr, rr * 0.3, math.hypot(x - rx, y - ry)) * (0.6 + 0.6 * n3(x * 13.0, y * 13.0, 3.0))
        if k > 0: c = [c[0] * (1 + 0.25 * k), c[1] * (1 - 0.18 * k), c[2] * (1 - 0.45 * k)]
    return c

def plot_pix(u, v):
    """the plotter's picture at (u, v) in 0-1 from its lower left: a chart head-up, land to port and an island, the depths in three
    blues, the track astern and the boat in the middle, a dark bar with the figures' places along the bottom"""
    if v < 0.12: return [0.10, 0.11, 0.13] if abs((u * 7) % 1 - 0.5) > 0.3 or abs(v - 0.06) > 0.03 else [0.85, 0.85, 0.80]
    h = n3(u * 2.2 + 3.1, v * 2.2 + 1.7, 0.3) + 0.55 * (0.36 - u) / 0.36 + 0.25 * n3(u * 6.0, v * 6.0, 2.2)
    h = max(h, 0.5 - 6.0 * math.hypot(u - 0.80, v - 0.74))
    if h > 0.42: c = [0.93, 0.84, 0.52] if h < 0.60 else [0.80, 0.76, 0.44]
    elif h > 0.34: c = [0.20, 0.22, 0.22]                                                        # the shore line
    elif h > 0.20: c = [0.55, 0.78, 0.93]
    elif h > 0.02: c = [0.72, 0.87, 0.96]
    else: c = [0.90, 0.95, 0.98]
    tr = 0.52 + 0.05 * math.sin(v * 9.0) * (0.5 - v)
    if v < 0.5 and v > 0.14 and abs(u - tr) < 0.012: c = [0.85, 0.12, 0.10]                    # the track
    if abs(u - 0.52) < 0.035 * (0.58 - v) / 0.08 and 0.50 < v < 0.58: c = [0.05, 0.05, 0.06]   # the boat
    if abs(math.hypot(u - 0.52, v - 0.50) - 0.30) < 0.006: c = [0.35, 0.40, 0.45]              # the range ring
    return c

def sound_pix(u, v):
    """the sounder's picture: the bottom rising from left to right, red over yellow over its blue tail, a school over it, the
    surface's clutter along the top, the scale down the right edge"""
    if u > 0.93: return [0.92, 0.92, 0.90] if abs((v * 6) % 1 - 0.5) < 0.08 else [0.06, 0.07, 0.10]
    b = 0.30 + 0.10 * math.sin(u * 5.0) + 0.05 * n3(u * 9.0, 0.3, 0.7) + 0.10 * u
    d = b - v
    if d > 0.10: return [0.25, 0.10, 0.06]
    if d > 0.035: return [0.80, 0.10, 0.06]
    if d > 0.0: return [0.95, 0.80, 0.15]
    if d > -0.03: return [0.15, 0.55, 0.80]
    f = n3(u * 7.0, v * 9.0, 1.3) + 0.9 * (0.16 - math.hypot((u - 0.55) * 0.6, v - 0.60)) / 0.16
    if f > 0.75: return [0.90, 0.75, 0.15]
    if f > 0.55: return [0.20, 0.75, 0.35]
    if v > 0.94: return [0.75, 0.25, 0.10] if n3(u * 30.0, 0.1, 0.2) > -0.2 else [0.15, 0.55, 0.80]
    return [0.03, 0.06, 0.20]

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


# ---------- the hull: the outside over the keel, the transom, the bulwarks' caps and insides, the decks ----------
CAP = 0.07                   # the bulwark's cap, its width
TT = 0.07                    # the transom's thickness: the deck and the transom's inside start this far forward of its outside
def ysh(x, sg=1): return section(x, sg)[-1][0]
def ycap(x, sg=1): return max(0.0, ysh(x, sg) - CAP)
def ybw(x, sg=1): return max(0.0, y_at(x, dk(x), sg) - 0.065)       # the bulwark's foot on the deck (its inside leans in a little)
def camber(x, y):
    e = max(0.3, ybw(x)); return (0.08 if x < X_BAKK else 0.06) * (1 - min(1.0, (y / e) ** 2))

HULL_MAT = {'k': 'af', 'f': 'hull', 'b': 'hull', 't': 'hull', 'r': 'rub', 'u': 'bw', 's': 'bw'}
HULL_KIND = {'r': 3, 'u': 4, 's': 4}
def hull_shell(M, fine=True):
    xs = stations(fine); S = {}
    for x in xs:
        for sg in (1, -1): S[(x, sg)] = [(x_of(x, z), y, z, k) for y, z, k in section(x, sg, fine)]
    for sg in (1, -1):
        for a, b in zip(xs, xs[1:]):
            Sa, Sb = S[(a, sg)], S[(b, sg)]
            for j in range(len(Sa) - 1):
                k = Sa[j][3]; dy = Sa[j + 1][1] - Sa[j][1]; dz = Sa[j + 1][2] - Sa[j][2]
                out = (0, sg * dz, -dy) if abs(dy) + abs(dz) > 1e-7 else (0, sg, 0)
                q = [(Sa[j][0], sg * Sa[j][1], Sa[j][2]), (Sb[j][0], sg * Sb[j][1], Sb[j][2]), (Sb[j + 1][0], sg * Sb[j + 1][1], Sb[j + 1][2]), (Sa[j + 1][0], sg * Sa[j + 1][1], Sa[j + 1][2])]
                M.f(q, C[HULL_MAT[k]], out, HULL_KIND.get(k, 1))
    # the transom: strips across between the first station's two sides, facing aft
    Tp, Ts = S[(xs[0], 1)], S[(xs[0], -1)]
    for j in range(len(Tp) - 1):
        q = [(Tp[j][0], Tp[j][1], Tp[j][2]), (Ts[j][0], -Ts[j][1], Ts[j][2]), (Ts[j + 1][0], -Ts[j + 1][1], Ts[j + 1][2]), (Tp[j + 1][0], Tp[j + 1][1], Tp[j + 1][2])]
        k = Tp[j][3]; M.f(q, C[HULL_MAT[k]] if k in 'ru' else C['hull'], (-1, 0, 0), HULL_KIND.get(k, 1))
    # ---- inside the bulwarks: the cap, the inside down to the deck, the deck across; the forecastle's deck forward of X_BAKK ----
    ND = 12 if fine else 2
    def edge(x, sg, deckf):
        s = z_cap(x, sg); zd = deckf(x); xx = lambda z: x_of(x, z)
        yb = max(0.0, y_at(x, zd, sg) - 0.065)
        return [(xx(s), sg * ysh(x, sg), s), (xx(s + 0.012), sg * ycap(x, sg), s + 0.012), (xx(s - 0.03), sg * (ycap(x, sg) - 0.006), s - 0.03), (xx(zd), sg * yb, zd)]
    def drow(x, deckf, cb):
        e = max(0.0, y_at(x, deckf(x)) - 0.065); zd = deckf(x); xd = x_of(x, zd)
        mid = [(xd, e * (1 - 2 * i / ND), zd + cb * (1 - min(1.0, ((1 - 2 * i / ND)) ** 2))) for i in range(1, ND)]
        return edge(x, 1, deckf) + mid + list(reversed(edge(x, -1, deckf)))
    aft = [x for x in xs if XA + TT - 1e-9 <= x < X_BAKK - 1e-9] + [X_BAKK]; fd = [x for x in xs if x >= X_BAKK - 1e-9 and ysh(x) > 0.02]
    if aft[0] > XA + TT + 1e-6: aft = [XA + TT] + aft
    def em(j, n): return C['cap'] if j in (0, 1, n - 3, n - 2) else C['inner'] if j in (2, n - 4) else None
    def eo(j, n): return (0, 0, 1) if j in (0, 1, n - 3, n - 2) else (0, -1, 0) if j == 2 else (0, 1, 0) if j == n - 4 else (0, 0, 1)
    D = [drow(x, z_deck, 0.08) for x in aft]; n = len(D[0])
    M.strip(D, lambda i, j: em(j, n) or C['deck'], lambda i, j: eo(j, n))
    B = [drow(x, z_bk, 0.06) for x in fd]
    M.strip(B, lambda i, j: em(j, n) or C['nonslip'], lambda i, j: eo(j, n))
    # the forecastle's after bulkhead, from the aft deck up to the forecastle's deck, across between the two rows at X_BAKK
    M.strip([D[-1], B[0]], lambda i, j: None if j in (0, 1, n - 3, n - 2) else C['white'], (-1, 0, 0))
    last = B[-1]; M.f([last[0], last[n - 1]] + [last[n // 2]], C['cap'], (0, 0, 1))
    # the transom's top: the cap from the outside's top aft of TT in to the inside's edge, and the inside down to the deck
    r0 = D[0]; tops = [x for x in xs if x < XA + TT - 1e-9]
    port = [(S[(x, 1)][-1][0], S[(x, 1)][-1][1], S[(x, 1)][-1][2]) for x in tops]
    M.f(list(reversed(port)) + [(p_[0], -p_[1], p_[2]) for p_ in port] + [r0[n - 1], r0[n - 2], r0[1], r0[0]], C['cap'], (0, 0, 1))
    M.f([r0[1], r0[2], r0[3], r0[n - 4], r0[n - 3], r0[n - 2]], C['inner'], (1, 0, 0))
    return S


# ---------- the openings: real holes, cut with a boolean and lined ----------
HATCH_F = (8.95, 9.45, 0.70, 1.20)                             # the fore hatch on the forecastle, to port (G)
HOLD = (4.00, 5.48, -0.62, 0.62)                               # the hold's coaming under the shelter (G: 3.92 and +-0.72; round 2: 10 cm in on each side and 8 cm at its after end, so the one who bleeds has 0.4 m between the tub and the hatch and the line tubs stand clear of it)
HOLD_H = 0.26
EXH_R = 0.045; BILGE_R = 0.02
# the setting port in the transom (OB11, F20 and the garn set in 4.8; havsjark35.py OB8): the game sets the nets and the line over the
# stern 0.45 m to starboard of the middle at the waist's height + 0.10 (view3d/10-gear.js drawSetting), and the transom's bulwark stands
# 1.5 m over the deck, so the gear went out through it. A gate between the gantry's posts under the net roller, its sill 0.58 m over the
# deck with a roller in it: the nets come down from the net roller and out through it
SPORT = (-0.78, 0.78, 2.84)  # y from, y to, the sill's height (round 3: 10 cm wider each side, from +-0.60; round 4 8 cm more, so the setter stands 0.10 m clear of the posts)
SPORT_R = 0.04               # the roller's radius (its top at the sill + 0.10)
GANT_Y = 0.85                # the gantry's posts and beams, each side of the gate (G: 0.62; 5 cm out for the gate's width in round 1, 10 cm more in
                             # round 3: the one who sets stands 0.45 m to starboard of the middle, his shoulders 0.25 m either side, and he
                             # stood in the starboard post's inner face at 0.625; 0.725 in round 3 gave him 2.5 cm, which the sensor read as in
                             # it; round 4 8 cm more: 0.805, 0.105 m clear)
SETTER_Y = (-0.45, -0.05)    # where the setter stands athwartships: over the stern without a setter (deckcrew.js setOver), at the line setter (vessel3d.js SETTERS)
def rr_pts(cx, cy, w, h, r, n=4): return rrect(cx, cy, w, h, max(0.004, min(r, w / 2 - 0.002, h / 2 - 0.002)), n=n)
def circle(r, n=16): return [(r * math.cos(2 * math.pi * k / n), r * math.sin(2 * math.pi * k / n)) for k in range(n)]

def cutters():
    out = []
    for sg in (1, -1):
        for x0, l in FREE:                                     # through the bulwark: outside and inside
            xc = x0 + l / 2; zd = z_deck(xc); out.append(((xc, sg * (ybw(xc, sg) + 0.03), zd + 0.10), (1, 0, 0), (0, 0, 1), rr_pts(0, 0, l, 0.16, 0.03), 0.16))
    x0, x1, y0, y1 = HATCH_F; out.append((((x0 + x1) / 2, (y0 + y1) / 2, z_bk(9.2) + 0.03), (1, 0, 0), (0, 1, 0), rr_pts(0, 0, x1 - x0, y1 - y0, 0.05), 0.12))
    x0, x1, y0, y1 = HOLD; out.append((((x0 + x1) / 2, 0, z_deck(4.7) + 0.05), (1, 0, 0), (0, 1, 0), rr_pts(0, 0, x1 - x0, y1 - y0, 0.04), 0.12))
    for x, sg, h, r in ((EXH_W[0], EXH_W[1], EXH_W[2], EXH_R), (BILGE[0], BILGE[1], BILGE[2], BILGE_R)):
        out.append(((x, sg * y_at(x, WL + h, sg), WL + h), (1, 0, 0), (0, 0, 1), circle(r, 16), 0.05))
    y0, y1, zs = SPORT; zt = z_cap(XA) + 0.20                  # the setting port through the transom's bulwark, open at the top
    out.append(((x_t(zs) + 0.035, 0, 0), (0, 1, 0), (0, 0, 1), [(y0, zs), (y1, zs), (y1, zt), (y0, zt)], 0.20))
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

def coaming(A, G, x0, x1, y0, y1, zf, h, boards=True):
    """a hatch: the hole lined down into the dark, a coaming round it up from the deck surface zf(x, y), the hatch boards on it"""
    o = rr_pts((x0 + x1) / 2, (y0 + y1) / 2, x1 - x0, y1 - y0, 0.04, 3); ztop = max(zf(x, y) for x, y in o) + h
    ring = [(x, y, zf(x, y) - 0.03) for x, y in o]
    tube(A, ring, (0, 0, -1), 0.6, C['inner'], C['cabin'])
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    F.loft(A, [[(x, y, zf(x, y) - 0.03) for x, y in o], [(x, y, ztop) for x, y in o]], lambda i: C['white'], cap0=False, cap1=False, out=lambda mid, cc: V((mid.x - cc.x, mid.y - cc.y, 0)))
    oi = rr_pts(cx, cy, x1 - x0 - 0.08, y1 - y0 - 0.08, 0.02, 3)
    F.loft(A, [[(x, y, ztop) for x, y in oi], [(x, y, ztop - h + 0.05) for x, y in oi]], lambda i: C['white'], cap0=False, cap1=False, out=lambda mid, cc: V((cc.x - mid.x, cc.y - mid.y, 0)))
    for k in range(len(o)):
        a, b = o[k], o[(k + 1) % len(o)]; c_, d_ = oi[(k + 1) % len(oi)], oi[k]
        A.poly([(a[0], a[1], ztop), (b[0], b[1], ztop), (c_[0], c_[1], ztop), (d_[0], d_[1], ztop)], C['white'], (0, 0, 1))
    return ztop

def linings(A, G, fine=True):
    s = lambda q: C['steel']
    # the freeing ports: the hole through the bulwark lined, open (Jonas 01.11.2026: no flaps that read as black blocks)
    for sg in (1, -1):
        for x0, l in FREE:
            xc = x0 + l / 2; zd = z_deck(xc); o = rr_pts(xc, zd + 0.10, l, 0.16, 0.03, 3)
            ring = [V((p, sg * (y_at(p, q, sg) + 0.001), q)) for p, q in o]
            tube(A, ring, (0, -sg, 0), max(0.03, y_at(xc, zd + 0.1, sg) - ybw(xc, sg) + 0.002), C['inner'])
    # the setting port: its sill and cheeks lined in the cap's colour through the transom's bulwark, the roller on its brackets in the sill
    y0, y1, zs = SPORT; xo = lambda z: x_t(z) - 0.004; xi = lambda z: x_t(z) + TT + 0.012; zc = z_cap(XA)
    A.poly([(xo(zs), y0, zs), (xi(zs), y0, zs), (xi(zs), y1, zs), (xo(zs), y1, zs)], C['cap'], (0, 0, 1))
    for yy, sy in ((y0, 1), (y1, -1)):
        A.poly([(xo(zs), yy, zs), (xi(zs), yy, zs), (xi(zc), yy, zc + 0.014), (xo(zc), yy, zc + 0.014)], C['cap'], (0, sy, 0))
    xr = x_t(zs) + 0.035
    for yy in (y0 + 0.03, y1 - 0.03): abox(A, xr - 0.04, xr + 0.04, yy - 0.012, yy + 0.012, zs - 0.002, zs + SPORT_R + 0.04, C['steel'])
    acyl(A, (xr, y0 + 0.04, zs + SPORT_R + 0.02), (xr, y1 - 0.04, zs + SPORT_R + 0.02), SPORT_R, lambda q: C['dark'], seg=16 if fine else 6)
    # the hold under the shelter: its coaming and the hatch boards, the small hatch in them with its grips
    zf = lambda x, y: z_deck(x) + camber(x, y)
    x0, x1, y0, y1 = HOLD; zt = coaming(A, G, x0, x1, y0, y1, zf, HOLD_H)
    nbd = 6
    for k in range(nbd):
        bx0 = x0 - 0.04 + (x1 - x0 + 0.08) * k / nbd + 0.004; bx1 = x0 - 0.04 + (x1 - x0 + 0.08) * (k + 1) / nbd - 0.004
        abox(A, bx0, bx1, y0 - 0.04, y1 + 0.04, zt + 0.002, zt + 0.045, C['deck'])
    if fine:
        for x in (x0 + 0.25, x1 - 0.25):
            for yy in (y0 - 0.025, y1 + 0.025): obox(A, (x, yy, zt - 0.04), (0.03, 0, 0), (0, 0.008, 0), (0, 0, 0.05), C['steel'])
        for y in (-0.25, 0.25): F.pipe(A, [(4.55, y, zt + 0.043), (4.55, y, zt + 0.08), (4.85, y, zt + 0.08), (4.85, y, zt + 0.043)], 0.012, C['steel'], 6)
    # the fore hatch on the forecastle: its reveal into the cabin, an aluminium frame proud of the deck, the smoked acrylic lid
    x0, x1, y0, y1 = HATCH_F; o = rr_pts((x0 + x1) / 2, (y0 + y1) / 2, x1 - x0, y1 - y0, 0.05, 4)
    top = lambda x, y: z_bk(x) + camber(x, y)
    ring = [(x, y, top(x, y) - 0.002) for x, y in o]
    tube(A, ring, (0, 0, -1), 0.06, C['inner'], C['cabin'])
    fo = rr_pts((x0 + x1) / 2, (y0 + y1) / 2, x1 - x0 + 0.08, y1 - y0 + 0.08, 0.09, 4); zf2 = max(p[2] for p in ring) + 0.06
    F.loft(A, [[(x, y, top(x, y) - 0.004) for x, y in fo], [(x, y, zf2) for x, y in fo]], lambda i: C['alu'], cap0=False, cap1=False)
    F.loft(A, [[(x, y, zf2) for x, y in o], [(x, y, top(x, y) - 0.004) for x, y in o]], lambda i: C['alu'], cap0=False, cap1=False, out=lambda mid, cc: V((cc.x - mid.x, cc.y - mid.y, 0)))
    for k in range(len(o)):
        a, b = o[k], o[(k + 1) % len(o)]; c_, d_ = fo[(k + 1) % len(fo)], fo[k]
        A.poly([(a[0], a[1], zf2), (b[0], b[1], zf2), (c_[0], c_[1], zf2), (d_[0], d_[1], zf2)], C['alu'], (0, 0, 1))
    G.poly([(x, y, zf2 + 0.012) for x, y in rr_pts((x0 + x1) / 2, (y0 + y1) / 2, x1 - x0 + 0.06, y1 - y0 + 0.06, 0.08, 4)], C['glass'], (0, 0, 1))
    # the cooling water outlet and the bilge pump's: a stainless collar round each
    for (xb, sb, hb_), r in ((EXH_W, EXH_R), (BILGE, BILGE_R)):
        zb_ = WL + hb_
        ring = [(xb + p, sb * (y_at(xb + p, zb_ + q, sb) + 0.001), zb_ + q) for p, q in circle(r, 12)]
        tube(A, ring, (0, -sb, 0), 0.05, C['dark'], C['black'])
        F.atorus(A, (xb, sb * (y_at(xb, zb_, sb) + 0.006), zb_), (0, sb, 0), r + 0.008, 0.006, lambda a: C['steel'], seg=14, rseg=4)


# ---------- the shelter (ly) amidships: its walls stand on the bulwarks' caps, two windows a side, the hauling port to starboard, the
# roof over it reaching aft (G) ----------
SH_X0 = 2.98; SH_X1 = 5.95; SH_TOP = 4.70; ROOF_SH = 4.84; SH_RX0 = 2.20
KNEE = (2.45, 4.30)          # (round 4) the knee under the roof's starboard after corner: how far aft it reaches, its foot on the wall's end
WIN_SH = [(3.78, 0.91, 0.29), (4.80, 0.90, 0.30)]           # (centre x, width, how far the top leans forward) (G)
WIN_Z = (3.13, 4.53)
HAUL = (3.10, 5.88, 4.45)                                    # the starboard side open for the work (Jonas 02.11.2026: «fjerne dette vinduet på styrbordsiden slik at
                                                             # mannskapet har plass til å arbeide der», where the hauler and the jigging machines stand): from, to, its
                                                             # head; the drawing's hauling port (5.06-6.05) and its two windows are one opening now
SHT = 0.06
def sh_y(x): return ysh(x) + 0.004                           # the wall's outside, 4 mm proud of the hull's top so the joint reads
def shelter(fine=True):
    objs = []; glass = []; A = Acc('shelter')
    NSX, NSZ = (24, 6) if fine else (4, 1)          # (the far version: a few stations, one row; it holds vessel3d's 12 000 points)
    xs = [SH_X0 + (SH_X1 - SH_X0) * k / NSX for k in range(NSX + 1)]
    for sg in (1, -1):
        rows = [[(x, sg * sh_y(x), z_cap(x) - 0.02 + (SH_TOP - z_cap(x) + 0.02) * k / NSZ) for k in range(NSZ + 1)] for x in xs]
        w = grid('shelter_wall_%d' % sg, rows, lambda i, j: C['white'], angle=30, out=lambda c: (0, c.y, 0))
        w.data.materials.append(C['inner']); solidify(w, SHT, 1); apply_all(w)
        yw = sh_y(4.5)
        if fine:
            cutters = []
            for k, (cx, ww, sk) in enumerate(WIN_SH if sg > 0 else []):
                poly = rrect(cx, sum(WIN_Z) / 2, ww, WIN_Z[1] - WIN_Z[0], 0.14, 4, sk)
                cutters.append(plate_cutter('cw%d' % k, (0, sg * 2.0, 0), (1, 0, 0), (0, 0, 1), poly, 0.4))
                outer = rrect(cx, sum(WIN_Z) / 2, ww + 0.09, WIN_Z[1] - WIN_Z[0] + 0.09, 0.18, 4, sk)
                objs.append(frame_ring('shf%d%d' % (k, sg), (0, sg * (yw + 0.006), 0), (1, 0, 0), (0, 0, 1), outer, poly, C['frame'], 0.0, 0.03, nrm=(0, sg, 0)))
                glass.append(plate('shg%d%d' % (k, sg), (0, sg * (yw - 0.03), 0), (1, 0, 0), (0, 0, 1), poly, C['glass'], nrm=(0, sg, 0)))
            if sg < 0:
                h0, h1, hz = HAUL; zc = z_cap(5.5) - 0.06
                cutters.append(plate_cutter('haul', (0, -2.0, 0), (1, 0, 0), (0, 0, 1), [(h0, zc), (h1, zc), (h1, hz - 0.15), (h1 - 0.15, hz), (h0 + 0.15, hz), (h0, hz - 0.15)], 0.4))
            cut(w, cutters)
            shade(w, 5)   # (as the wheelhouse: no streaks toward the windows and the hauling port)
        else:
            for k, (cx, ww, sk) in enumerate(WIN_SH if sg > 0 else []):
                objs.append(plate('shw%d%d' % (k, sg), (0, sg * (yw + 0.004), 0), (1, 0, 0), (0, 0, 1), rrect(cx, sum(WIN_Z) / 2, ww, WIN_Z[1] - WIN_Z[0], 0.14, 2, sk), C['dark'], nrm=(0, sg, 0)))
        objs.append(w)
    if fine:
        # the hauling port's reveal (the wall's edges lined) and the roller on the cap at its sill, between its cheeks
        h0, h1, hz = HAUL; yo = -sh_y(5.5); yi = yo + SHT + 0.002
        for x in (h0, h1): A.poly([(x, yo, z_cap(x)), (x, yi, z_cap(x)), (x, yi, hz - 0.15), (x, yo, hz - 0.15)], C['white'], (1 if x == h0 else -1, 0, 0))
        for (xa, za), (xb, zb_) in (((h0, hz - 0.15), (h0 + 0.15, hz)), ((h0 + 0.15, hz), (h1 - 0.15, hz)), ((h1 - 0.15, hz), (h1, hz - 0.15))):
            A.poly([(xa, yo, za), (xb, yo, zb_), (xb, yi, zb_), (xa, yi, za)], C['white'], (0, 0, -1))
        # the hauling roller on the cap at the hauler's place forward in the opening, between its cheeks
        F.hauling_roller(A, HXX - 0.36, HXX + 0.36, -ysh(HXX) - 0.02, -ycap(HXX) + 0.03, z_cap(HXX) + 0.07, C['steel'], C['dark'], R=0.06)
        # a grab rail along the opening's head, inside
        F.pipe(A, [(h0 + 0.25, yi + 0.06, hz - 0.08), (h1 - 0.25, yi + 0.06, hz - 0.08)], 0.016, C['steel'], 8)
        for x in (h0 + 0.25, (h0 + h1) / 2, h1 - 0.25): acyl(A, (x, yi - 0.001, hz - 0.08), (x, yi + 0.06, hz - 0.08), 0.012, lambda q: C['steel'], seg=8)
    # the roof: a plate with a rounded lip over the walls, reaching aft over the aft deck (G: 2.20), its underside white
    zr0, zr1 = SH_TOP, ROOF_SH; yr = 2.10
    abox(A, SH_RX0, SH_X1 + 0.04, -yr, yr, zr0 + 0.02, zr1, C['roof'], skip=('-z', '+z'))
    # its top as a grid: one big face has only its four corners to carry the baked shade, and those lie in the lip's shadow (the roof
    # came out dark in the game)
    NX_, NY_ = (14, 10) if fine else (1, 1)
    for i in range(NX_):
        for j in range(NY_):
            xa, xb = SH_RX0 + (SH_X1 + 0.04 - SH_RX0) * i / NX_, SH_RX0 + (SH_X1 + 0.04 - SH_RX0) * (i + 1) / NX_
            ya, yb = -yr + 2 * yr * j / NY_, -yr + 2 * yr * (j + 1) / NY_
            A.poly([(xa, ya, zr1), (xb, ya, zr1), (xb, yb, zr1), (xa, yb, zr1)], C['roof'], (0, 0, 1))
    A.poly([(SH_RX0, -yr, zr0 + 0.02), (SH_X1 + 0.04, -yr, zr0 + 0.02), (SH_X1 + 0.04, yr, zr0 + 0.02), (SH_RX0, yr, zr0 + 0.02)], C['inner'], (0, 0, -1))
    for sg in (1, -1): abox(A, SH_RX0 - 0.01, SH_X1 + 0.05, sg * yr - 0.012, sg * yr + 0.012, zr0 - 0.02, zr1 + 0.01, C['cap'])
    abox(A, SH_RX0 - 0.012, SH_RX0 + 0.012, -yr, yr, zr0 - 0.02, zr1 + 0.01, C['cap'])
    # the post under the roof's after edge to port, on the high aft bulwark's cap over the casing (round 4: the one to starboard is gone.
    # It stood at x 2.30 on the low rail where the crew stand at rest and jig, and the sensor saw a man in it in two pictures. The roof's
    # starboard after corner is carried by the shelter's wall aft of the opening, with a knee under the roof's edge from it, 0.4 m deep,
    # over the heads (2.0 m over the deck), and by the port wall and this post: it hangs 0.8 m aft of the wall, as a sjark's shelter does)
    for sg in ROOF_POSTS:
        px = SH_RX0 + 0.10; py = sg * (ycap(px, sg) + CAP * 0.5)
        acyl(A, (px, py, z_cap(px, sg) + 0.005), (px, py, zr0 + 0.02), 0.03, lambda q: C['steel'], seg=10)
        acyl(A, (px, py, z_cap(px, sg) - 0.002), (px, py, z_cap(px, sg) + 0.012), 0.045, lambda q: C['steel'], seg=12)
    yk = -(sh_y(SH_X0) - SHT / 2)
    F.prism_side(A, [(SH_X0 + 0.002, zr0 + 0.019), (SH_X0 + 0.002, KNEE[1]), (SH_X0 - 0.06, KNEE[1]), (KNEE[0], zr0 - 0.05), (KNEE[0], zr0 + 0.019)], yk - 0.008, yk + 0.008, C['white'])
    abox(A, KNEE[0] - 0.03, SH_X0 + 0.002, yk - 0.03, yk + 0.03, zr0 - 0.002, zr0 + 0.019, C['white'])                  # its flange under the roof
    if fine:
        # the rail round the roof (the raft is the game's kit on it), open over the ladder at its after edge to port
        lo, hi_ = LADDER[1] - LADDER[2] / 2 - 0.17, LADDER[1] + LADDER[2] / 2 + 0.15
        posts = [(x, sy * (yr - 0.06)) for x in (2.32, 3.0, 3.7, 4.4, 5.1, 5.8) for sy in (1, -1)] + [(2.32, y) for y in (-1.0, 0.0, lo, hi_)]
        for x, y in posts:
            acyl(A, (x, y, zr1 - 0.004), (x, y, zr1 + 0.36), 0.016, lambda q: C['steel'], seg=8); acyl(A, (x, y, zr1 - 0.004), (x, y, zr1 + 0.01), 0.026, lambda q: C['steel'], seg=10)
        yy = yr - 0.06
        F.pipe(A, [(5.80, yy, zr1 + 0.36), (2.45, yy, zr1 + 0.36), (2.32, yy - 0.13, zr1 + 0.36), (2.32, hi_, zr1 + 0.36)], 0.018, C['steel'], 8)
        F.pipe(A, [(2.32, lo, zr1 + 0.36), (2.32, -yy + 0.13, zr1 + 0.36), (2.45, -yy, zr1 + 0.36), (5.80, -yy, zr1 + 0.36)], 0.018, C['steel'], 8)
        # (round 3) the way up: it stood on the aft deck to starboard (x 2.0, y -1.2), in the way from the line tubs and the net tub to
        # the setting port, 3-5 cm from them. Now to port over the casing, out of the way of the work: three steps on the casing's
        # after face with a grab handle over its roof, and a short ladder from the casing's roof up past the shelter roof's after edge
        lx, ly, lw = LADDER; zcr = CASING[4] + 0.04; zd0 = z_deck(CASING[0]) + camber(CASING[0], ly)
        for k in range(1, 4):
            zk = zd0 + (zcr - zd0) * k / 4
            abox(A, CASING[0] - 0.13, CASING[0] - 0.004, ly - 0.20, ly + 0.20, zk - 0.02, zk + 0.008, C['steel'])
            for e in (-0.18, 0.18): abox(A, CASING[0] - 0.13, CASING[0] - 0.004, ly + e - 0.008, ly + e + 0.008, zk - 0.09, zk, C['steel'])
        for e in (-0.20, 0.20):
            F.pipe(A, [(CASING[0] + 0.12, ly + e, zcr), (CASING[0] + 0.12, ly + e, zcr + 0.42), (CASING[0] - 0.02, ly + e, zcr + 0.42), (CASING[0] - 0.02, ly + e, zcr - 0.30)], 0.014, C['steel'], 8)
            acyl(A, (CASING[0] - 0.008, ly + e, zcr - 0.30), (CASING[0] - 0.03, ly + e, zcr - 0.30), 0.026, lambda q: C['steel'], seg=10)
        F.ladder(A, (lx - 0.06, ly, zcr - 0.004), (lx, ly, zr1 + 0.70), lw, C['steel'], side=(0, 1, 0), away=(-1, 0, 0))
        # the work lights under the roof's after edge, over the aft deck, and one over the hauling port
        for yy_ in (-0.9, 0.9):
            F.work_light(A, (SH_RX0 + 0.12, yy_, zr0 - 0.02), (-0.6, 0, -1), C['dark'], C['lens'])
        for x in (3.9, 5.3): F.work_light(A, (x, -1.70, zr0 - 0.02), (0, -0.5, -1), C['dark'], C['lens'])
    objs.append(A.done(35, tint=wear))
    return objs, glass


# ---------- the wheelhouse on the forecastle's after end, offset to port, its windscreen raked forward (G) ----------
WH_YC = 0.13; WH_X0 = 5.95; WH_FLOOR = 3.25; WH_SILL = 4.0; WH_TOP = 5.18; LEAN = 0.47; WT = 0.06
WHY0, WHY1 = -1.46, 1.76     # the house's starboard and port walls (G: -1.50; 4 cm in for the walkway, deckMap)
DOOR = (6.08, 6.70, 3.32, 5.00)                                # the door aft on the starboard side, out onto the walkway (G)
BRIM_O = 0.16; BRIM_I = 0.11                                   # the roof's brim: its lower edge out from the walls, how far its face slopes in (valg 26)
def wh_ring(z):
    d = LEAN * max(0.0, z - WH_SILL)
    return [(WH_X0, WHY0, z), (7.97 + d, WHY0, z), (8.45 + d, -1.00, z), (8.45 + d, 1.26, z), (7.97 + d, WHY1, z), (WH_X0, WHY1, z)]
def wh_inner(z, inset=WT):
    d = LEAN * max(0.0, z - WH_SILL)
    return [(WH_X0 + inset, WHY0 + inset), (7.97 + d, WHY0 + inset), (8.45 + d - inset, -1.00 + inset * 0.6), (8.45 + d - inset, 1.26 - inset * 0.6), (7.97 + d, WHY1 - inset), (WH_X0 + inset, WHY1 - inset)]
def roof_z(x): return WH_TOP + 0.08 + 0.42 * max(0.0, min(1.0, (x - 5.83) / (9.09 - 5.83)))

# (round 2, 11.11.2026: from the wheel the posts between the panes were broad: 8 cm of wall and frames between the three front panes and
# 15-20 cm round each corner. The panes are 3-7 cm wider and their frames 2 cm, so a post is 5 cm in front and 5-6 cm at a corner pane)
PANE_F = 0.69; PANE_C = 0.56; WFR = 0.02
def wh_faces():
    """(name, origin, u, v, windows) for each wall carrying windows (G: three front panes, one in each corner, two in each side)"""
    vl = (LEAN, 0, 1.0); Fc = []
    Fc.append(('front', (8.45, WH_YC, WH_SILL), (0, 1, 0), vl, [rrect(u, 0.56, PANE_F, 0.98, 0.07, 3) for u in (-0.74, 0.0, 0.74)]))
    for nm, a, b in (('corner_p', (8.45, 1.26), (7.97, WHY1)), ('corner_s', (7.97, WHY0), (8.45, -1.00))):
        u = (b[0] - a[0], b[1] - a[1], 0); mid = ((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, WH_SILL)
        Fc.append((nm, mid, u, vl, [rrect(0.0, 0.56, PANE_C, 0.98, 0.07, 3)]))
    side = lambda: [rrect(7.07, WH_SILL + 0.515, 0.64, 0.89, 0.07, 3), rrect(7.685, WH_SILL + 0.515, 0.49, 0.89, 0.07, 3)]
    Fc.append(('side_p', (0, WHY1, 0), (1, 0, 0), (0, 0, 1), side()))
    Fc.append(('side_s', (0, WHY0, 0), (1, 0, 0), (0, 0, 1), side()))
    return Fc

def wheelhouse(fine=True):
    objs = []; glass = []; A = Acc('wh_fit')
    # (round 4 tried the walls as a grid of 0.15 m for the wear: with the solidify and the windows' cuts it left a saw of dark notches
    # down the after corner to port. The shell is the three rings again; the wear shows on the shelter's and the casing's grids)
    shell = loft_rings('wheelhouse', [wh_ring(WH_FLOOR - 0.01), wh_ring(WH_SILL), wh_ring(WH_TOP)], C['white'], cap0=False, cap1=False, angle=25)   # (open on top: the roof's underside closes it, so the ceiling is not WT lower)
    shell.data.materials.append(C['inner']); solidify(shell, WT, 1); apply_all(shell)
    cuts = []
    def nrm_of(nm, u, vv):
        if nm == 'side_p': return V((0, 1, 0))
        if nm == 'side_s': return V((0, -1, 0))
        n = V(u).normalized().cross(vv).normalized()
        return n if n.x > 0 else -n
    for nm, o, u, v, wins in (wh_faces() if fine else []):
        vv = V(v).normalized(); n = nrm_of(nm, u, vv)
        for k, poly in enumerate(wins):
            cuts.append(plate_cutter('wc_%s%d' % (nm, k), o, u, vv, poly, 0.35))
            cx = sum(p[0] for p in poly) / len(poly); cy = sum(p[1] for p in poly) / len(poly)
            outer = [(p[0] + (WFR if p[0] > cx else -WFR), p[1] + (WFR if p[1] > cy else -WFR)) for p in poly]
            objs.append(frame_ring('wf_%s%d' % (nm, k), V(o) + n * 0.004, u, vv, outer, poly, C['frame'], 0.0, 0.022, nrm=n))
            glass.append(plate('wg_%s%d' % (nm, k), V(o) - n * 0.03, u, vv, poly, C['glass'], nrm=n))
    if fine:
        x0, x1, z0, z1 = DOOR
        cuts.append(plate_cutter('wc_door', (0, WHY0, 0), (1, 0, 0), (0, 0, 1), rrect((x0 + x1) / 2, (z0 + z1) / 2, x1 - x0, z1 - z0, 0.06, 3), 0.35))
        cut(shell, cuts)
        shade(shell, 5)   # (flat panels: the sharp edges marked again after the cut, or the walls shade in streaks toward the windows; qa/flatnorm.py)
    objs.append(shell)
    if not fine:
        for nm, o, u, v, wins in wh_faces():
            vv = V(v).normalized(); n = nrm_of(nm, u, vv)
            for k, poly in enumerate(wins):
                us = [q[0] for q in poly]; ws = [q[1] for q in poly]; box_ = [(min(us), min(ws)), (max(us), min(ws)), (max(us), max(ws)), (min(us), max(ws))]
                objs.append(plate('wd_%s%d' % (nm, k), V(o) + n * 0.004, u, vv, box_, C['dark'], nrm=n))
    # the house's foot aft of the forecastle: its walls down to the aft deck (the aft wall, the sides to the bulkhead), the floor inside
    # over the aft deck level with the forecastle's deck
    zt = WH_FLOOR - 0.012
    zbf = lambda y: z_deck(6.0) + camber(6.0, y) - 0.004; NB = 10
    for k in range(NB):
        ya, yb = WHY0 + (WHY1 - WHY0) * k / NB, WHY0 + (WHY1 - WHY0) * (k + 1) / NB
        A.poly([(WH_X0, ya, zbf(ya)), (WH_X0, yb, zbf(yb)), (WH_X0, yb, zt), (WH_X0, ya, zt)], C['white'], (-1, 0, 0))
    for y, sg in ((WHY0, -1), (WHY1, 1)): A.poly([(WH_X0, y, zbf(y)), (X_BAKK, y, zbf(y)), (X_BAKK, y, zt), (WH_X0, y, zt)], C['white'], (0, sg, 0))
    zf = lambda x, y: z_bk(X_BAKK) + camber(X_BAKK, y)
    yi0, yi1 = WHY0 + WT + 0.002, WHY1 - WT - 0.002; NY = 8
    rows = [[(x, yi0 + (yi1 - yi0) * k / NY, zf(x, yi0 + (yi1 - yi0) * k / NY)) for k in range(NY + 1)] for x in (WH_X0 + WT + 0.002, X_BAKK)]
    for k in range(NY): A.poly([rows[0][k], rows[1][k], rows[1][k + 1], rows[0][k + 1]], C['nonslip'], (0, 0, 1))
    if fine:
        # the door: a white frame round the opening, the leaf a little in (its window, its handle, its hinges forward)
        x0, x1, z0, z1 = DOOR; y = WHY0
        o = rr_pts((x0 + x1) / 2, (z0 + z1) / 2, x1 - x0, z1 - z0, 0.06, 3); fo = rr_pts((x0 + x1) / 2, (z0 + z1) / 2, x1 - x0 + 0.07, z1 - z0 + 0.07, 0.09, 3)
        for k in range(len(o)):
            a, b = o[k], o[(k + 1) % len(o)]; c_, d_ = fo[(k + 1) % len(fo)], fo[k]
            A.poly([(a[0], y - 0.012, a[1]), (b[0], y - 0.012, b[1]), (c_[0], y - 0.012, c_[1]), (d_[0], y - 0.012, d_[1])], C['white'], (0, -1, 0))
            A.poly([(a[0], y - 0.012, a[1]), (b[0], y - 0.012, b[1]), (b[0], y + 0.002, b[1]), (a[0], y + 0.002, a[1])], C['white'], (0, 0, 0))
        lo = rr_pts((x0 + x1) / 2, (z0 + z1) / 2, x1 - x0 - 0.016, z1 - z0 - 0.016, 0.05, 3)
        A.poly([(p, y + 0.022, q) for p, q in lo], C['roof'], (0, -1, 0)); A.poly([(p, y + 0.045, q) for p, q in lo], C['roof'], (0, 1, 0))
        glass.append(plate('door_glass', (0, y + 0.020, 0), (1, 0, 0), (0, 0, 1), rr_pts((x0 + x1) / 2, z1 - 0.40, 0.36, 0.46, 0.06, 3), C['glass'], nrm=(0, -1, 0)))
        # (round 3: the handle and the hinges were 1-2 cm and did not read; the sensor: «ingen dørhåndtak»). The lock's plate, a lever
        # handle, two hinges with their leaves on the frame, and the dark seal round the leaf
        abox(A, x0 + 0.045, x0 + 0.105, y - 0.004, y + 0.022, z0 + 0.86, z0 + 1.06, C['black'])
        acyl(A, (x0 + 0.075, y - 0.004, z0 + 0.98), (x0 + 0.075, y - 0.05, z0 + 0.98), 0.016, lambda q: C['steel'], seg=10)
        abox(A, x0 + 0.06, x0 + 0.23, y - 0.068, y - 0.046, z0 + 0.965, z0 + 0.995, C['steel'])
        acyl(A, (x0 + 0.075, y - 0.004, z0 + 0.92), (x0 + 0.075, y - 0.012, z0 + 0.92), 0.012, lambda q: C['black'], seg=8)
        for zz in (z0 + 0.25, z1 - 0.25):
            acyl(A, (x1 - 0.03, y - 0.018, zz - 0.08), (x1 - 0.03, y - 0.018, zz + 0.08), 0.017, lambda q: C['steel'], seg=10)
            abox(A, x1 - 0.13, x1 - 0.03, y - 0.014, y - 0.002, zz - 0.06, zz + 0.06, C['steel']); abox(A, x1 - 0.03, x1 + 0.05, y - 0.024, y - 0.012, zz - 0.06, zz + 0.06, C['steel'])
        for xa, xb, za, zb in ((x0 + 0.06, x1 - 0.06, z0 - 0.002, z0 + 0.012), (x0 + 0.06, x1 - 0.06, z1 - 0.012, z1 + 0.002), (x0 - 0.002, x0 + 0.012, z0 + 0.06, z1 - 0.06), (x1 - 0.012, x1 + 0.002, z0 + 0.06, z1 - 0.06)):
            abox(A, xa, xb, y - 0.003, y + 0.024, za, zb, C['rubber'])
    # the roof (valg 26, Jonas 09.11.2026 on the plastsjark, then «Ja» for all the boats: «Gjør styrhustak mer realistisk som dette, med en
    # slags brem på kanten av taket som skrår», the lower edge out and the face sloping in, not the other way: «Bremen på styrhuset skrår
    # feil vei»): its underside where it was, a brim all round the outline BRIM_O out from the walls: a 3 cm lower edge with the drip
    # edge under it, the face sloping in BRIM_I up to the roof's edge (the roof rises to the visor over the front, so the face is low
    # aft and high forward) in the hull's navy («Fargen kan du bestemme selv så lenge den harmonerer med resten av designet»), the
    # crown inside
    ring = offset_poly([(p[0], p[1]) for p in wh_ring(WH_TOP)], BRIM_O)
    zr_ = WH_TOP
    A.poly([(x, y, zr_ + 0.001) for x, y in ring], C['inner'], (0, 0, -1))
    crown = lambda x, y: roof_z(x) + 0.04 * (1 - min(1.0, ((y - WH_YC) / 1.75) ** 2))
    rt = offset_poly(ring, -BRIM_I); ri = offset_poly(ring, -BRIM_I - 0.14); zl = zr_ + 0.03
    for i in range(len(ring)):
        a, b = ring[i], ring[(i + 1) % len(ring)]; e, f = rt[(i + 1) % len(rt)], rt[i]; c, d = ri[(i + 1) % len(ri)], ri[i]
        nrm = (b[1] - a[1], -(b[0] - a[0]), 0); ln = math.hypot(nrm[0], nrm[1]) or 1.0; rise = (roof_z(a[0]) + roof_z(b[0])) / 2 - zl
        A.poly([(a[0], a[1], zr_), (b[0], b[1], zr_), (b[0], b[1], zl), (a[0], a[1], zl)], C['white'], nrm)                                   # the lower edge
        A.poly([(a[0], a[1], zl), (b[0], b[1], zl), (e[0], e[1], roof_z(e[0])), (f[0], f[1], roof_z(f[0]))], C['hull'],
               (nrm[0] / ln * rise, nrm[1] / ln * rise, BRIM_I))                                                                          # the face, sloping in
        A.poly([(f[0], f[1], roof_z(f[0])), (e[0], e[1], roof_z(e[0])), (c[0], c[1], crown(*c)), (d[0], d[1], crown(*d))], C['roof'], (0, 0, 1))
        A.poly([(a[0], a[1], zr_ - 0.001), (b[0], b[1], zr_ - 0.001), (b[0], b[1], zr_ - 0.025), (a[0], a[1], zr_ - 0.025)], C['frame'], nrm)   # the drip edge
    A.poly([(x, y, crown(x, y)) for x, y in ri], C['roof'], (0, 0, 1))
    if fine:
        # the wipers on the three front panes (round 4; the sensor saw none: a blade of 6 mm along the panes' foot). Pendulum wipers as on
        # a sjark's wheelhouse: the spindle in the wall over each pane, the arm hanging down the glass a little off the vertical, the
        # blade along it, stainless with a black rubber, 2-3 cm across, so they read against the dark glass from the bow and the wheel
        nn = V((1.0, 0.0, -LEAN)).normalized()
        P_ = lambda u, v, o: V((8.45 + LEAN * v, WH_YC + u, WH_SILL + v)) + nn * o
        for u in (-0.74, 0.0, 0.74):
            piv = P_(u, 1.09, 0.012); end = P_(u + 0.13, 0.30, 0.03); ax = (end - piv); L_ = ax.length; ax.normalize(); cr = nn.cross(ax).normalized()
            acyl(A, piv - nn * 0.012, piv + nn * 0.035, 0.028, lambda q: C['black'], seg=10)                       # the spindle's boss
            acyl(A, piv + nn * 0.035, piv + nn * 0.05, 0.014, lambda q: C['steel'], seg=8)                          # its nut
            obox(A, piv + nn * 0.042 + ax * (L_ * 0.5), ax * (L_ * 0.5), cr * 0.013, nn * 0.006, C['steel'])       # the arm (stainless: a black one is lost against the dark glass)
            bc = piv + ax * (L_ * 0.58) + nn * 0.018
            obox(A, bc, ax * (L_ * 0.40), cr * 0.011, nn * 0.010, C['steel'])                                       # the blade's frame
            obox(A, bc - nn * 0.014, ax * (L_ * 0.40), cr * 0.004, nn * 0.006, C['rubber'])                          # its rubber on the glass
    objs.append(A.done(35, tint=wear))
    return objs, glass, crown


# the helm on the starboard side under the front windows: the console with the dash sloping up forward, the wheel, the lever, the plotter,
# the sounder and the engine's panel facing the skipper (up and aft), the compass on top, the VHF overhead, the seat aft of him; the
# bench and the chart table to port (the house is offset to port: the walkway is to starboard)
HX0, HY0, HY1 = 7.62, -1.30, 0.05                             # the console's after face and its sides
DASH = ((7.66, 4.02), (8.10, 4.16))                           # the dash's after foot and fore top (x, z)
WHEEL = (7.48, -0.55, 4.18); WHEEL_AX = (-1.0, 0.0, 0.55)
SKIP = (7.08, -0.55); SEAT = (6.62, -0.55)
EYE_H = 1.62
HP, FOV = -0.35, 60
def dash_pt(t, y):
    (x0, z0), (x1, z1) = DASH; return V((x0 + (x1 - x0) * t, y, z0 + (z1 - z0) * t))
def dash_n():
    (x0, z0), (x1, z1) = DASH; return V((-(z1 - z0), 0, x1 - x0)).normalized()
SCR = {'plot': (-1.20, -0.82, 0.15, 0.85), 'sound': (-0.34, -0.06, 0.18, 0.82), 'eng': (-0.72, -0.40, 0.50, 0.90)}
HELM_EXTRA = []
def helm(A, G, fine=True):
    w = C['inner']; z0 = WH_FLOOR + camber(X_BAKK, 0.5); (x0, dz0), (x1, dz1) = DASH; xw = 8.45 - WT - 0.01
    A.poly([(HX0, HY0, z0), (HX0, HY1, z0), (HX0, HY1, dz0), (HX0, HY0, dz0)], w, (-1, 0, 0))
    A.poly([(HX0, HY0, dz0), (HX0, HY1, dz0), (x0, HY1, dz0), (x0, HY0, dz0)], w, (0, 0, 1))
    A.poly([(x0, HY0, dz0), (x0, HY1, dz0), (x1, HY1, dz1), (x1, HY0, dz1)], C['board'], dash_n())
    for y, sg in ((HY0, -1), (HY1, 1)):
        A.poly([(HX0, y, z0), (xw, y, z0), (xw, y, dz1), (x1, y, dz1), (x0, y, dz0), (HX0, y, dz0)], w, (0, sg, 0))
    A.poly([(x1, HY0, dz1), (x1, HY1, dz1), (xw, HY1, dz1), (xw, HY0, dz1)], w, (0, 0, 1))
    if not fine: return
    n = dash_n()
    for nm, (ya, yb_, ta, tb) in SCR.items():
        q = [dash_pt(ta, ya), dash_pt(ta, yb_), dash_pt(tb, yb_), dash_pt(tb, ya)]; c = sum(q, V()) / 4
        F.loft(A, [[p + n * 0.002 for p in q], [p + n * 0.014 for p in q]], lambda i: C['bezel'], cap0=False, cap1=False)
        A.poly([p + n * 0.014 for p in q], C['bezel'], n)
        # (round 2: the screens were blank dark plates. Each is a grid of small faces coloured at the corners by wear(): the plotter's
        # chart with land, depths, the track and the boat, the sounder's bottom and marks; the engine's panel has its dials)
        s4 = [c + (p - c) * 0.86 + n * 0.0145 for p in q]
        if nm == 'eng':
            A.poly(s4, C['screen'], n)
            for k in range(3):
                gc = s4[0] + (s4[1] - s4[0]) * (0.2 + 0.3 * k) + (s4[3] - s4[0]) * 0.5 + n * 0.001
                F.atorus(A, gc, n, 0.036, 0.004, lambda a: C['chrome'], seg=14, rseg=4)
                A.poly([gc + (V((0, 1, 0)) * math.cos(6.283 * j / 12) + (s4[3] - s4[0]).normalized() * math.sin(6.283 * j / 12)) * 0.031 for j in range(12)], C['board'], n)
                a_ = (0.9, 2.4, 1.7)[k]; d_ = V((0, 1, 0)) * math.cos(a_) + (s4[3] - s4[0]).normalized() * math.sin(a_); e_ = n.cross(d_)
                A.poly([gc + n * 0.0015 - d_ * 0.006 - e_ * 0.003, gc + n * 0.0015 + d_ * 0.028, gc + n * 0.0015 - d_ * 0.006 + e_ * 0.003], C['red'], n)
            continue
        NU = int(round((s4[1] - s4[0]).length / 0.011)); NV = int(round((s4[3] - s4[0]).length / 0.011)); mt = C['pix_' + nm]
        gp = lambda i, j: s4[0] + (s4[1] - s4[0]) * (i / NU) + (s4[3] - s4[0]) * (j / NV)
        for i in range(NU):
            for j in range(NV): A.poly([gp(i, j), gp(i + 1, j), gp(i + 1, j + 1), gp(i, j + 1)], mt, n)
    for yg in (-0.62, -0.48):
        F.atorus(A, dash_pt(0.25, yg) + n * 0.004, n, 0.035, 0.004, lambda a: C['chrome'], seg=16, rseg=4)
    cb = dash_pt(0.93, -0.20) + V((0.0, 0, -0.005))
    acyl(A, cb, cb + V((0, 0, 0.05)), 0.07, lambda q: C['dark'], seg=16)
    HELM_EXTRA.append(sphere('compass', cb + V((0, 0, 0.085)), 0.06, C['glass'], (1, 1, 0.7)))
    cp = dash_pt(0.12, -1.05) + n * 0.003
    obox(A, cp, V((0, 0.07, 0)), (dash_pt(1, 0) - dash_pt(0, 0)).normalized() * 0.03, n * 0.004, C['switch'])
    for k in range(4): obox(A, cp + n * 0.005 + V((0, -0.05 + 0.033 * k, 0)), V((0, 0.009, 0)), V((0.004, 0, 0.008)), n * 0.004, C['lampG'] if k < 3 else C['lampR'])
    F.helm_wheel(A, WHEEL, WHEEL_AX, 0.21, C['cush'], C['steel'], C['dark'])
    acyl(A, V(WHEEL) - V(WHEEL_AX).normalized() * 0.14, (HX0 + 0.004, WHEEL[1], WHEEL[2] + 0.02), 0.03, lambda q: C['dark'], seg=10)
    F.single_lever(A, (HX0 + 0.12, HY1, z0 + 0.82), (0, 1, 0), (1, 0, 0), C['dark'], C['steel'], C['black'])
    vc = V((7.30, -0.85, WH_TOP - 0.06))
    obox(A, vc, V((0.09, 0, 0)), V((0, 0.10, 0)), V((0, 0, 0.05)), C['dark'])
    A.poly([vc + V((-0.091, -0.08, -0.03)), vc + V((-0.091, 0.08, -0.03)), vc + V((-0.091, 0.08, 0.03)), vc + V((-0.091, -0.08, 0.03))], C['screen'], (-1, 0, 0))
    F.helm_seat(A, (SEAT[0], SEAT[1], z0), (1, 0, 0), 0.76, C['steel'], C['cush'])
    # the bench to port along the side, its back on the wall, the chart table forward of it
    yi = WHY1 - WT
    abox(A, 6.15, 7.15, 1.05, yi - 0.004, z0, z0 + 0.42, C['inner']); abox(A, 6.17, 7.13, 1.07, yi - 0.006, z0 + 0.42, z0 + 0.50, C['cush'])
    abox(A, 6.17, 7.13, yi - 0.09, yi - 0.006, z0 + 0.50, z0 + 0.92, C['cush'])
    abox(A, 7.30, 7.95, 0.75, yi - 0.004, z0, z0 + 0.82, C['inner']); abox(A, 7.32, 7.93, 0.77, yi - 0.006, z0 + 0.82, z0 + 0.85, C['wood'])
    # (round 3; the sensor: «innsiden er ellers glatt (ingen radio, brytere, listverk)») the VHF on the shelf between the dash and the
    # windscreen over the engine's panel, its handset on the shelf beside it (the VHF comes with her, VESSELS std; an AIS is bought, so none is modelled in); a row of switches with their pilot
    # lights along the dash's foot; a wooden list round the walls under the roof
    xs0 = DASH[1][0] + 0.02; zs = DASH[1][1]
    def unit(y0_, y1_, h, scr):
        abox(A, xs0, xs0 + 0.17, y0_, y1_, zs, zs + h, C['dark'])
        A.poly([(xs0 - 0.001, y1_ - 0.02, zs + h * 0.45), (xs0 - 0.001, y0_ + 0.07, zs + h * 0.45), (xs0 - 0.001, y0_ + 0.07, zs + h * 0.85), (xs0 - 0.001, y1_ - 0.02, zs + h * 0.85)], scr, (-1, 0, 0))
        for k in range(2): acyl(A, (xs0, y0_ + 0.025 + 0.025 * k, zs + h * 0.5), (xs0 - 0.014, y0_ + 0.025 + 0.025 * k, zs + h * 0.5), 0.009, lambda q: C['black'], seg=8)
        for k in range(4): abox(A, xs0 - 0.004, xs0, y1_ - 0.03 - 0.035 * k, y1_ - 0.008 - 0.035 * k, zs + h * 0.12, zs + h * 0.32, C['switch'])
    unit(-0.72, -0.50, 0.08, C['lampG'])
    abox(A, xs0 + 0.01, xs0 + 0.19, -0.465, -0.41, zs, zs + 0.045, C['black'])                                 # the handset
    F.atorus(A, (xs0 + 0.04, -0.44, zs + 0.012), (0, 0, 1), 0.03, 0.006, lambda a_: C['black'], seg=12, rseg=4) # its cord
    pa, pb = dash_pt(0.02, -0.76), dash_pt(0.14, -0.08); pc = (pa + pb) / 2
    obox(A, pc + n * 0.004, V((0, (pb.y - pa.y) / 2, 0)), (dash_pt(1, 0) - dash_pt(0, 0)).normalized() * 0.036, n * 0.004, C['switch'])
    for k in range(10):
        q = dash_pt(0.06, -0.73 + 0.067 * k) + n * 0.008
        acyl(A, q, q + n * 0.02 + V((0, 0, 0.006)), 0.004, lambda a_: C['chrome'], seg=6)
        obox(A, dash_pt(0.115, -0.73 + 0.067 * k) + n * 0.009, V((0, 0.006, 0)), V((0.003, 0, 0.006)), n * 0.002, C['lampG'] if k % 4 else C['lampR'])
    zl = WH_TOP - 0.05; ri, ro = wh_inner(zl, WT + 0.018), wh_inner(zl, WT)
    for k in range(len(ri)):
        a_, b_ = ri[k], ri[(k + 1) % len(ri)]; c_, d_ = ro[(k + 1) % len(ro)], ro[k]
        if math.hypot(b_[0] - a_[0], b_[1] - a_[1]) < 0.05: continue
        A.poly([(a_[0], a_[1], zl), (b_[0], b_[1], zl), (b_[0], b_[1], zl + 0.045), (a_[0], a_[1], zl + 0.045)], C['wood'], (7.2 - (a_[0] + b_[0]) / 2, WH_YC - (a_[1] + b_[1]) / 2, 0))
        A.poly([(a_[0], a_[1], zl), (b_[0], b_[1], zl), (c_[0], c_[1], zl), (d_[0], d_[1], zl)], C['wood'], (0, 0, -1))


# ---------- the forecastle: rails, the windlass and the bow roller, bitts and cleats, vents, the steps up from the walkway ----------
def gunwale_y(x, sg=1): return ycap(x, sg) + CAP * 0.5
def bitts(A, x, y, z, h=0.28):
    """(round 4; the sensor: «grove pullerter») a pair of bitts as cast: a foot plate with its edge bevelled and four bolts, each post
    flared into the plate with a weld, a little waisted, a heavy rounded cap with a lip the rope cannot jump, the cross pin through both"""
    s_ = lambda q: C['steel']; r = 0.048
    abox(A, x - 0.14, x + 0.14, y - 0.075, y + 0.075, z - 0.004, z + 0.014, C['steel'])
    abox(A, x - 0.125, x + 0.125, y - 0.06, y + 0.06, z + 0.014, z + 0.024, C['steel'])
    for bx in (-0.11, 0.11):
        for by in (-0.05, 0.05): acyl(A, (x + bx, y + by, z + 0.022), (x + bx, y + by, z + 0.034), 0.010, s_, seg=6)
    for dx in (-0.065, 0.065):
        c = (x + dx, y)
        acyl(A, (c[0], c[1], z + 0.02), (c[0], c[1], z + 0.05), r * 1.45, s_, seg=16, r1=r * 1.02)        # the flare and its weld
        acyl(A, (c[0], c[1], z + 0.05), (c[0], c[1], z + h * 0.55), r * 1.02, s_, seg=16, r1=r * 0.92)     # the waist
        acyl(A, (c[0], c[1], z + h * 0.55), (c[0], c[1], z + h - 0.01), r * 0.92, s_, seg=16, r1=r)
        acyl(A, (c[0], c[1], z + h - 0.01), (c[0], c[1], z + h + 0.012), r * 1.38, s_, seg=16)            # the cap's lip
        acyl(A, (c[0], c[1], z + h + 0.012), (c[0], c[1], z + h + 0.03), r * 1.38, s_, seg=16, r1=r * 0.9)  # its crown
    acyl(A, (x - 0.115, y, z + h * 0.62), (x + 0.115, y, z + h * 0.62), 0.014, s_, seg=8)

def vent(A, c, r=0.055, h=0.30):
    """(round 4; the sensor: «grove sopplufter») a mushroom vent: a bolted foot flange, the stem with a band, the cap a dome turned
    from rings with a skirt round it and the dark gap under it where the air goes in"""
    x, y, z = c; w = lambda q: C['white']
    acyl(A, (x, y, z - 0.004), (x, y, z + 0.012), r * 1.8, w, seg=16)
    for k in range(6): a_ = math.pi * k / 3; acyl(A, (x + r * 1.5 * math.cos(a_), y + r * 1.5 * math.sin(a_), z + 0.010), (x + r * 1.5 * math.cos(a_), y + r * 1.5 * math.sin(a_), z + 0.020), 0.007, lambda q: C['steel'], seg=6)
    acyl(A, (x, y, z + 0.012), (x, y, z + h), r, w, seg=16)
    acyl(A, (x, y, z + h * 0.45), (x, y, z + h * 0.45 + 0.02), r * 1.12, w, seg=16)
    acyl(A, (x, y, z + h - 0.005), (x, y, z + h + 0.004), r * 1.02, lambda q: C['dark'], seg=16)                 # the gap's shadow
    R_ = r * 2.5; zs = z + h - 0.03
    acyl(A, (x, y, zs), (x, y, zs + 0.05), R_, w, seg=24, r1=R_ * 1.01)                                          # the skirt
    acyl(A, (x, y, zs + 0.002), (x, y, zs + 0.004), R_ * 0.985, lambda q: C['dark'], seg=24)                         # the dark mouth under it
    for k in range(5):
        a0, a1 = math.pi / 2 * k / 5, math.pi / 2 * (k + 1) / 5
        acyl(A, (x, y, zs + 0.05 + 0.06 * math.sin(a0)), (x, y, zs + 0.05 + 0.06 * math.sin(a1)), R_ * math.cos(a0) + 0.002, w, seg=24, r1=R_ * math.cos(a1) + 0.002)

STEPS = (6.02, 6.55, -1.78, -1.50)                            # the steps up from the walkway to the forecastle, to starboard (G)
def forecastle(A, fine=True):
    s = lambda q: C['steel']
    xs = [6.80, 7.40, 8.00, 8.60, 9.20, 9.75, 10.20]
    def base(p, r=0.026): acyl(A, (p[0], p[1], p[2] - 0.003), (p[0], p[1], p[2] + 0.008), r, s, seg=10)
    if fine:
        # the rails: posts on bases on the cap, a top and a knee rail, closing round the bow (G: 0.7 m over the cap)
        for sg in (1, -1):
            for x in xs:
                zc = z_cap(x, sg) + 0.012; y = sg * gunwale_y(x, sg); base((x, y, zc)); acyl(A, (x, y, zc), (x, y, zc + 0.70), 0.018, s, seg=8)
        for h, r in ((0.70, 0.022), (0.38, 0.016)):
            pts = [(x, -gunwale_y(x, -1), z_cap(x, -1) + 0.012 + h) for x in xs]
            pts += [(10.46, -0.32, z_cap(10.46) + 0.012 + h), (10.56, 0.0, z_cap(10.56) + 0.012 + h + 0.02), (10.46, 0.32, z_cap(10.46) + 0.012 + h)]
            pts += [(x, gunwale_y(x), z_cap(x) + 0.012 + h) for x in reversed(xs)]
            F.pipe(A, pts, r, C['steel'], 8)
    # the windlass on the forecastle: its base, the gypsy and the warping drum, the motor, the chain pipe forward of it (G: 10.06)
    wx = 10.06; zd = z_bk(wx) + camber(wx, 0)
    abox(A, wx - 0.22, wx + 0.22, -0.20, 0.20, zd - 0.006, zd + 0.10, C['red'])
    acyl(A, (wx, -0.18, zd + 0.28), (wx, 0.18, zd + 0.28), 0.14, lambda q: C['red'], seg=18 if fine else 6)
    if fine: acyl(A, (wx, 0.18, zd + 0.28), (wx, 0.40, zd + 0.28), 0.10, lambda q: C['dark'], seg=16)
    if fine: F.atorus(A, (wx, -0.23, zd + 0.28), (0, 1, 0), 0.10, 0.026, lambda a: C['steel'], seg=16, rseg=6)
    if fine: acyl(A, (wx, -0.28, zd + 0.28), (wx, -0.19, zd + 0.28), 0.07, lambda q: C['steel'], seg=12)
    obox(A, (wx, 0, zd + 0.14), V((0.18, 0, 0)), V((0, 0.17, 0)), V((0, 0, 0.06)), C['red'])
    cp = wx + 0.34
    if fine: acyl(A, (cp, -0.23, z_bk(cp) + camber(cp, 0.23) - 0.004), (cp, -0.23, z_bk(cp) + 0.06), 0.06, s, seg=12)
    # the bow roller over the stem (the anchor itself is the game's: bower)
    zr_ = z_cap(10.62) + 0.05
    F.bow_roller(A, (10.30, 0, z_cap(10.30) + 0.004), (10.96, 0, zr_), C['steel'], C['rubber'], R=0.07, W=0.18, deck=lambda x: z_cap(min(x, XF)) + 0.004, x_end=XF - 0.02)
    if not fine: return
    # the capstan forward of the house (G), the bitts forward, the cleats on the caps, two mushroom vents
    # (round 2: it was two red cylinders 0.78 m high, a placeholder. A warping capstan as on a sjark's forecastle: a bolted foot, the
    # barrel waisted between its lips with six whelps, bare where the rope runs, a painted crown with the bar's sockets, 0.46 m high)
    cz = z_bk(9.2) + camber(9.2, 0.3); cc = lambda z: (9.2, -0.3, cz + z); rd = lambda q: C['red']
    acyl(A, cc(-0.004), cc(0.025), 0.175, lambda q: C['dark'], seg=20)
    for k in range(6): a_ = math.pi * k / 3 + 0.3; acyl(A, (9.2 + 0.148 * math.cos(a_), -0.3 + 0.148 * math.sin(a_), cz + 0.025), (9.2 + 0.148 * math.cos(a_), -0.3 + 0.148 * math.sin(a_), cz + 0.04), 0.014, s, seg=6)
    acyl(A, cc(0.025), cc(0.07), 0.150, rd, seg=20, r1=0.135); acyl(A, cc(0.07), cc(0.11), 0.135, s, seg=20, r1=0.100)
    acyl(A, cc(0.11), cc(0.30), 0.100, s, seg=20, r1=0.094); acyl(A, cc(0.30), cc(0.36), 0.094, s, seg=20, r1=0.140)
    acyl(A, cc(0.36), cc(0.40), 0.150, rd, seg=20); acyl(A, cc(0.40), cc(0.44), 0.150, rd, seg=20, r1=0.105); acyl(A, cc(0.44), cc(0.46), 0.105, rd, seg=16, r1=0.06)
    for k in range(6):
        a_ = math.pi * k / 3; u_ = V((math.cos(a_), math.sin(a_), 0)); t_ = V((-math.sin(a_), math.cos(a_), 0))
        obox(A, V(cc(0.205)) + u_ * 0.098, u_ * 0.012, t_ * 0.012, V((0, 0, 0.10)), C['steel'])
        if k % 3 == 0: obox(A, V(cc(0.38)) + u_ * 0.150, u_ * 0.004, t_ * 0.022, V((0, 0, 0.014)), C['black'])
    for x, y in ((9.75, 0.82), (9.75, -0.82)): bitts(A, x, y, z_bk(x) + camber(x, y))
    for x in (6.95, 8.75):
        for sg in (1, -1): F.cleat(A, (x, sg * gunwale_y(x, sg), z_cap(x, sg) + 0.006), (0, 0, 1), (1, 0, 0), 0.26, C['steel'])
    for y in (0.25, -0.90): vent(A, (9.55, y, z_bk(9.55) + camber(9.55, y) + 0.004))
    # the steps up from the walkway beside the wheelhouse to the forecastle, to starboard: three treads on brackets against the house
    x0, x1, y0, y1 = STEPS; zd0, zd1 = z_deck(6.0), z_bk(X_BAKK)
    for k in (1, 2, 3):
        zt = zd0 + (zd1 - zd0) * k / 3.4; xa = x0 + (x1 - x0) * (k - 1) / 3
        abox(A, xa, x1 - 0.002, y0, y1, zt - 0.04, zt, C['wood'])
        for yy in (y0 + 0.03, y1 - 0.03): abox(A, xa + 0.02, x1 - 0.002, yy - 0.012, yy + 0.012, zt - 0.22, zt - 0.04, C['steel'])
    gy = WHY0 - 0.04
    F.pipe(A, [(5.98, gy, zd0 + 0.9), (5.98, gy - 0.05, zd0 + 0.9), (6.75, gy - 0.05, zd1 + 0.95), (6.80, gy, zd1 + 0.95)], 0.014, C['steel'], 8)


# ---------- the aft deck: the casing to port with its door and the dry exhaust, the gutting table, the bitts, the filler ----------
CASING = (1.0, 2.85, 1.02, 1.82, 3.35)                         # (G)
LADDER = (2.12, 1.42, 0.40)  # the ladder up to the shelter roof (round 3): its top at the roof's after edge to port over the casing (x, y, width)
TABLE = (3.20, 4.10, 1.30, 1.88)                               # the gutting table under the shelter to port, across the hatch from the work at the open side (B6)
TUB = (4.62, -1.45)                                            # the bleeding tub (the game's), just aft of the hauler
def gbox(A, x0, x1, y0, y1, z0, z1, m, step):
    """(round 4) a box's four walls and its top as grids of about step, so the wear per corner shows on them (an abox has eight)"""
    nx, ny, nz = (max(1, round((b - a) / step)) for a, b in ((x0, x1), (y0, y1), (z0, z1)))
    X = [x0 + (x1 - x0) * i / nx for i in range(nx + 1)]; Y = [y0 + (y1 - y0) * j / ny for j in range(ny + 1)]; Z = [z0 + (z1 - z0) * k / nz for k in range(nz + 1)]
    for k in range(nz):
        for i in range(nx):
            for yy, nrm in ((y0, (0, -1, 0)), (y1, (0, 1, 0))): A.poly([(X[i], yy, Z[k]), (X[i + 1], yy, Z[k]), (X[i + 1], yy, Z[k + 1]), (X[i], yy, Z[k + 1])], m, nrm)
        for j in range(ny):
            for xx, nrm in ((x0, (-1, 0, 0)), (x1, (1, 0, 0))): A.poly([(xx, Y[j], Z[k]), (xx, Y[j + 1], Z[k]), (xx, Y[j + 1], Z[k + 1]), (xx, Y[j], Z[k + 1])], m, nrm)
    for i in range(nx):
        for j in range(ny): A.poly([(X[i], Y[j], z1), (X[i + 1], Y[j], z1), (X[i + 1], Y[j + 1], z1), (X[i], Y[j + 1], z1)], m, (0, 0, 1))
def aft_deck(A, fine=True):
    s = lambda q: C['steel']
    x0, x1, y0, y1, zt = CASING; zd = z_deck(1.5) - 0.004
    gbox(A, x0, x1, y0, y1, zd, zt, C['white'], 0.12 if fine else 9); abox(A, x0 - 0.03, x1 + 0.03, y0 - 0.03, y1 + 0.01, zt, zt + 0.04, C['roof'])
    if fine:
        # the casing's door in its inboard face, a frame and the leaf proud, its handle; a vent in its after face
        dx0, dx1, dz0, dz1 = 1.55, 2.25, zd + 0.10, zd + 0.98
        abox(A, dx0 - 0.04, dx1 + 0.04, y0 - 0.012, y0 - 0.001, dz0 - 0.04, dz1 + 0.04, C['white'])
        abox(A, dx0, dx1, y0 - 0.024, y0 - 0.012, dz0, dz1, C['roof'])
        acyl(A, (dx1 - 0.08, y0 - 0.024, (dz0 + dz1) / 2), (dx1 - 0.08, y0 - 0.06, (dz0 + dz1) / 2), 0.012, s, seg=8)
        # (the vent's louvres in its inboard face aft of the door; round 3: the steps up to the roof took its after face)
        for k in range(5): abox(A, 1.08 + 0.07 * k, 1.12 + 0.07 * k, y0 - 0.012, y0 - 0.001, 2.95, 3.20, C['dark'])
        # the door's hinges aft, big enough to read from the deck
        for zz in (dz0 + 0.12, dz1 - 0.12): abox(A, dx0 - 0.03, dx0 + 0.06, y0 - 0.032, y0 - 0.012, zz - 0.06, zz + 0.06, C['steel'])
    # the dry exhaust up through the casing's roof, its rain cap, a bracket to the shelter roof's after edge
    ex, ey = 2.73, 1.45
    sx = 12 if fine else 5
    if fine: acyl(A, (ex, ey, zt + 0.035), (ex, ey, zt + 0.10), 0.11, s, seg=14)
    acyl(A, (ex, ey, zt + 0.10), (ex, ey, 5.15), 0.07, s, seg=sx)
    acyl(A, (ex, ey, 5.15), (ex, ey, 5.24), 0.07, lambda q: C['black'], seg=sx)
    if fine: acyl(A, (ex, ey, 5.24), (ex - 0.06, ey, 5.32), 0.08, lambda q: C['black'], seg=12)
    if fine: acyl(A, (ex, ey - 0.07, 4.60), (SH_RX0 + 0.02, ey - 0.07, 4.60), 0.012, s, seg=6)
    # the gutting table under the shelter to starboard, its top a working height over the deck, a lip outboard, a drain to the side
    x0, x1, y0, y1 = TABLE; zt2 = z_deck(3.7) + 0.9
    abox(A, x0, x1, y0, y1, zt2 - 0.05, zt2, C['steel']); abox(A, x0, x1, y1, y1 + 0.02, zt2 - 0.05, zt2 + 0.12, C['steel'])
    if not fine: return
    for x in (x0, x1): abox(A, x - 0.01, x + 0.01, y0, y1, zt2, zt2 + 0.08, C['steel'])
    for x, y in ((x0 + 0.05, y0 + 0.05), (x1 - 0.05, y0 + 0.05), (x0 + 0.05, y1 - 0.05), (x1 - 0.05, y1 - 0.05)):
        acyl(A, (x, y, z_deck(x) + camber(x, y) - 0.004), (x, y, zt2 - 0.05), 0.02, s, seg=8)
    # the bitts on the quarters, the cleats amidships, the diesel filler by the shelter, a deck hose coiled, the fenders stowed
    for y in (BITT_Y, -BITT_Y): bitts(A, 0.35, y, z_deck(0.35) + camber(0.35, y), 0.30)
    for x in (2.55,):
        for sg in (1, -1): F.cleat(A, (x, sg * gunwale_y(x, sg), z_cap(x, sg) + 0.006), (0, 0, 1), (1, 0, 0), 0.26, C['steel'])
    fx, fy = FILL; fz = z_deck(fx) + camber(fx, fy)
    acyl(A, (fx, fy, fz - 0.002), (fx, fy, fz + 0.012), 0.05, s, seg=16); acyl(A, (fx, fy, fz + 0.012), (fx, fy, fz + 0.02), 0.036, s, seg=16)
    hx, hy = HOSE; hz = z_deck(hx) + camber(hx, hy)
    for k in range(3): F.atorus(A, (hx, hy, hz + 0.024 + 0.044 * k), (0, 0, 1), 0.24 - 0.02 * k, 0.022, lambda a: C['hose'], seg=20, rseg=6)
    for k in range(4): F.atorus(A, (9.05, 0.25, z_bk(9.05) + camber(9.05, 0.25) + 0.02 + 0.035 * k), (0, 0, 1), 0.20 - 0.015 * k, 0.018, lambda a: C['rope2'], seg=20, rseg=5)

# the non-slip on the aft deck (round 2, 11.11.2026: «sklisikring og slitasje som synes på dørken»): fields of a coarse, darker non-slip
# 4 mm over the gelcoat, as they are moulded or rolled on a fibreglass deck, with smooth waterways along the bulwarks, round the hatch,
# the casing, the masts' and the bitts' feet, and seams between the fields. Small faces coloured at the corners (grip_wear)
GRIP_C = 0.10
def grip_free(x, y):
    """no non-slip here: the waterways, what stands on the deck, the seams"""
    if abs(y) > ybw(x) - 0.13 or x < XA + TT + 0.10 or x > WH_X0 - 0.05: return False
    hx0, hx1, hy0, hy1 = HOLD
    if hx0 - 0.12 < x < hx1 + 0.12 and hy0 - 0.12 < y < hy1 + 0.12: return False
    cx0, cx1, cy0, cy1, _ = CASING
    if cx0 - 0.08 < x < cx1 + 0.08 and y > cy0 - 0.08: return False
    if math.hypot(x - AM[0], y - AM[1]) < 0.20: return False
    if x < 0.62 and abs(abs(y) - BITT_Y) < 0.22: return False                                    # the bitts
    if x > STEPS[0] - 0.06 and y < STEPS[3] + 0.06: return False                                 # the steps to the forecastle
    if math.hypot(x - FILL[0], y - FILL[1]) < 0.12: return False
    if abs((x - 0.22) % 1.30) < 0.05 or abs(y) < 0.025 or abs(abs(y) - 0.98) < 0.025: return False   # the seams between the fields
    return True
def deck_fields(A):
    n = 0; c = GRIP_C; zf = lambda x, y: z_deck(x) + camber(x, y) + 0.004
    i0 = int(math.floor(XA / c)); i1 = int(math.ceil(WH_X0 / c)); j1 = int(math.ceil(2.1 / c))
    ok = {(i, j): grip_free((i + 0.5) * c, (j + 0.5) * c) and all(grip_free((i + a) * c, (j + b) * c) for a in (0.05, 0.95) for b in (0.05, 0.95)) for i in range(i0, i1) for j in range(-j1, j1)}
    for (i, j), o in ok.items():
        if not o: continue
        q = [(i * c, j * c), ((i + 1) * c, j * c), ((i + 1) * c, (j + 1) * c), (i * c, (j + 1) * c)]
        A.poly([(x, y, zf(x, y)) for x, y in q], C['grip'], (0, 0, 1)); n += 1
    return n
HOSE = (5.62, 1.55)          # the deck hose coiled under the shelter forward to port (OB11: it lay where the line tubs stand now)
FILL = (4.6, 1.80)


# ---------- the masts and rigging: the fore mast on the wheelhouse roof with the radar arm, the derrick, the fishing lights and the white
# all-round light on top; the aft mast on the gantry over the stern with the net roller and the stern light (G) ----------
FM = (6.47, WH_YC); FM_TOP = 9.09
FISH_R, FISH_W = 8.92, 7.85  # the fishing lights red over white (G: 8.82 and 7.85, 0.97 m apart; rule: at least 1 m, so the red 0.10 higher)
LAMP_ARM = 0.30
def white_z(): return FM_TOP + 0.12
AM = (1.62, 0.0); AM_TOP = 8.85
GZ = 5.0                     # the gantry's beams (G: 4.95-5.05)
# the flag staff (round 3): it stood in a socket on the transom's cap to port, and the ensign hung in over the one who sets at the
# port (the sensor: «flagget henger inn der setteren står»). Now up on the gantry, in a socket clamped to the outside of its port beam
# at the after end: the flag flies over five metres up, over the stern light and clear of everyone on deck. Round 4: straight up (it
# was raked aft, toward a camera above and astern, and in five pictures seemed to run down through the setter)
POLE = (-0.58, GANT_Y + 0.075); POLE_Z = GZ + 0.03
def pole_top(): return (POLE[0], POLE[1], POLE_Z + 1.12)
STERN_L = (-0.66, 0.0, GZ + 0.12)
RDM = (7.10, 1.0)            # the radome's foot on the wheelhouse roof, forward to port (kit.radar)
SIDE = (8.70, 1.55, -1.29)   # the side lights on the roof's forward corners (G)
def rig(A, crown, fine=True):
    seg = 12 if fine else 6; fx, fy = FM; ax, ay = AM; m = C['mast']; s = lambda q: C['steel']; d = lambda q: C['dark']
    zr = crown(fx, fy)
    acyl(A, (fx, fy, zr - 0.02), (fx, fy, FM_TOP), 0.065, lambda q: m, seg=seg)
    acyl(A, (fx, fy, zr - 0.004), (fx, fy, zr + 0.12), 0.11, lambda q: C['rubber'], seg=seg)
    abox(A, fx - 0.18, fx + 0.18, fy - 0.18, fy + 0.18, zr - 0.01, zr + 0.02, C['steel'])
    acyl(A, (fx, fy, FM_TOP), (fx, fy, white_z() - 0.04), 0.02, lambda q: m, seg=8)
    F.allround_lantern(A, (fx, fy, white_z()), C['lampW'], C['frame'], R=0.035, H=0.07)
    # the radar arm forward from the mast with its plate (kit.radarA, the open array the player buys), its strut; the dome's foot on the roof
    abox(A, fx, 7.78, fy - 0.04, fy + 0.04, 7.21, 7.29, m); abox(A, 7.12, 7.72, fy - 0.30, fy + 0.30, 7.21, 7.29, m)
    rz = crown(RDM[0], RDM[1]) + 0.20
    abox(A, RDM[0] - 0.30, RDM[0] + 0.30, RDM[1] - 0.30, RDM[1] + 0.30, rz - 0.04, rz, m)
    for dx, dy in ((-0.22, -0.22), (0.22, -0.22), (-0.22, 0.22), (0.22, 0.22)):
        xx, yy = RDM[0] + dx, RDM[1] + dy; acyl(A, (xx, yy, crown(xx, yy) - 0.004), (xx, yy, rz - 0.04), 0.022, lambda q: m, seg=8)
    # the fishing lights: red over white on short arms forward of the mast (rule 26)
    for z, mt in ((FISH_R, C['lampR']), (FISH_W, C['lampW'])):
        abox(A, fx + 0.05, fx + LAMP_ARM - 0.03, fy - 0.02, fy + 0.02, z - 0.10, z - 0.07, m)
        acyl(A, (fx + LAMP_ARM, fy, z - 0.10), (fx + LAMP_ARM, fy, z - 0.07), 0.04, lambda q: m, seg=10 if fine else 5)
        F.allround_lantern(A, (fx + LAMP_ARM, fy, z), mt, C['frame'], R=0.035, H=0.07)
    # the aft mast on its foot on the aft deck, the gantry over the stern on two posts on the transom's cap and the mast's legs
    acyl(A, (ax, ay, z_deck(ax) + camber(ax, 0) - 0.004), (ax, ay, AM_TOP), 0.08, lambda q: m, seg=seg)
    acyl(A, (ax, ay, AM_TOP), (ax, ay, AM_TOP + 0.05), 0.10, lambda q: m, seg=seg)
    for sy in (GANT_Y, -GANT_Y):
        # (round 3: the stay ended on the beam's top with half its end in the air, a black gap where it met the beam. Now it runs into
        # the beam and stands in a lug: two ears welded on the beam's top either side of it, a pin through)
        acyl(A, (ax, 0, 7.40), (0.28, sy, GZ - 0.01), 0.05, lambda q: m, seg=10 if fine else 5)
        abox(A, -0.70, ax + 0.02, sy - 0.045, sy + 0.045, GZ - 0.05, GZ + 0.05, m)
        if fine:
            dv = V((ax - 0.28, -sy, 0)).normalized(); cr = V((-dv.y, dv.x, 0))
            for e in (1, -1): obox(A, V((0.28, sy, GZ + 0.10)) + dv * 0.04 + cr * (e * 0.058), dv * 0.10, V((0, 0, 0.05)), cr * 0.006, C['steel'])
            acyl(A, V((0.28, sy, GZ + 0.11)) + dv * 0.06 + cr * 0.075, V((0.28, sy, GZ + 0.11)) + dv * 0.06 - cr * 0.075, 0.014, s, seg=8)
        zc = z_cap(XA) + 0.012; xp = x_t(zc) + 0.035
        acyl(A, (xp, sy, zc - 0.004), (xp, sy, GZ - 0.05), 0.045, lambda q: m, seg=10 if fine else 5)
        abox(A, xp - 0.07, xp + 0.07, sy - 0.07, sy + 0.07, zc - 0.006, zc + 0.012, C['steel'])
    # the cross beams between the side beams' inner faces, a little shallower than them (round 3: they ran through the side beams with
    # their tops in the same plane, which showed black squares at the corners), and one at the aft mast, which the side beams reach
    for x in (-0.66, 0.28, ax - 0.02): abox(A, x - 0.042, x + 0.042, -GANT_Y + 0.044, GANT_Y - 0.044, GZ - 0.046, GZ + 0.046, m)
    # the flag staff in its socket on the outside of the port beam (POLE; round 3, off the transom's cap), raked aft, a truck on top
    px, py = POLE; pt = pole_top()
    abox(A, px - 0.05, px + 0.05, GANT_Y + 0.044, py - 0.028, GZ - 0.04, GZ + 0.04, C['steel'])
    acyl(A, (px, py, GZ - 0.07), (px, py, GZ + 0.10), 0.03, s, seg=10 if fine else 5)
    acyl(A, (px, py, POLE_Z), pt, 0.018, lambda q: C['wood'], seg=8 if fine else 4)
    if fine: EXTRA.append(sphere('flag_truck', (pt[0], pt[1], pt[2] + 0.02), 0.03, C['wood']))
    acyl(A, (ax, 0, 7.05), (2.55, 0, ROOF_SH), 0.05, lambda q: m, seg=10 if fine else 5)
    # the net roller hanging under the gantry's after end (the ship's own, as the gantry), its motor
    for sy in (GANT_Y - 0.06, -GANT_Y + 0.06): abox(A, -0.50, -0.34, sy - 0.015, sy + 0.015, 4.40, GZ - 0.05, m)
    acyl(A, (-0.42, -GANT_Y + 0.08, 4.52), (-0.42, GANT_Y - 0.08, 4.52), 0.15, lambda q: C['red'], seg=18 if fine else 6)
    for sy in (GANT_Y - 0.08, -GANT_Y + 0.08): acyl(A, (-0.42, sy - 0.012, 4.52), (-0.42, sy + 0.012, 4.52), 0.25, lambda q: C['red'], seg=18 if fine else 6)
    if fine: acyl(A, (-0.42, GANT_Y - 0.05, 4.52), (-0.42, GANT_Y + 0.16, 4.52), 0.09, d, seg=12 if fine else 5)
    F.stern_lantern(A, STERN_L, (-1, 0, 0), C['lampW'], C['frame'])
    abox(A, STERN_L[0] + 0.02, -0.62, -0.03, 0.03, GZ + 0.05, STERN_L[2] - 0.03, m)
    if not fine: return
    # on the fore mast: the cross-tree with the whips, the forestay to the roof's front, the shrouds to the roof's edge; the satellite TV dome
    abox(A, fx - 0.02, fx + 0.02, fy - 0.28, fy + 0.28, 9.0, 9.05, m)
    for sy in (-0.25, 0.25): F.whip(A, (fx, fy + sy, 9.05), 0.70, C['white'], r0=0.012, r1=0.005, m_foot=C['steel'])
    acyl(A, (fx + 0.03, fy, 7.55), (7.85, fy, crown(7.85, fy) + 0.02), 0.028, lambda q: m, seg=8)
    for sg in (1, -1):
        ry = (WHY1 + 0.02) if sg > 0 else (WHY0 - 0.02); rx = 6.30; rzz = roof_z(rx) + 0.02
        obox(A, (rx, ry, rzz), (0.035, 0, 0), (0, 0.006, 0), (0, 0, 0.045), C['steel'])
        acyl(A, (fx, fy + sg * 0.05, 8.0), (rx, ry, rzz + 0.04), 0.006, d, seg=4)
    abox(A, fx, 7.88, fy - 0.035, fy + 0.035, 6.47, 6.53, m)
    acyl(A, (7.55, fy, 6.53), (7.55, fy, 6.64), 0.03, lambda q: m, seg=8)
    EXTRA.append(sphere('satdome', (7.55, fy, 6.84), 0.22, C['white'], (1, 1, 0.95)))
    # the derrick: its heel in a gooseneck on the mast, the boom aft over the shelter, its topping lift, block and hook (G)
    heel = (fx - 0.08, fy, 5.75); tip = (4.50, fy, 7.70)
    obox(A, (fx - 0.06, fy, 5.75), (0.04, 0, 0), (0, 0.06, 0), (0, 0, 0.08), C['steel'])
    acyl(A, heel, tip, 0.05, lambda q: m, seg=10, r1=0.04)
    acyl(A, tip, (fx, fy, 8.70), 0.008, d, seg=4)
    EXTRA.append(sphere('d_block', (tip[0] - 0.02, fy, tip[2] - 0.10), 0.07, C['dark']))
    acyl(A, (tip[0] - 0.02, fy, tip[2] - 0.14), (tip[0] - 0.02, fy, 5.95), 0.008, d, seg=4)
    F.atorus(A, (tip[0] - 0.02, fy, 5.88), (0, 1, 0), 0.06, 0.012, lambda a: C['dark'], seg=12, rseg=4)
    # the aft mast's boom aft over the gantry, its stay; the winch on the mast; the wire between the mastheads
    acyl(A, (ax, 0, 7.60), (0.38, 0, 8.30), 0.045, lambda q: m, seg=10)
    acyl(A, (0.40, 0, 8.30), (ax, 0, 8.62), 0.008, d, seg=4)
    # the winch on the aft mast for the boom's runner (round 2: it was a red box 0.54 x 0.44 x 0.70 round the mast): a foot plate
    # clamped to the mast's after side with two bands, two cheeks, the drum between them with its flanges and the wire on it, the
    # hydraulic motor to port and the brake's band and lever to starboard; the runner up the mast to a block under the boom's heel, out
    # to the block at its end and down to the hook
    wz = 4.50; wx = ax - 0.25; r_ = lambda q: C['red']
    abox(A, ax - 0.12, ax - 0.075, -0.17, 0.17, wz - 0.22, wz + 0.22, C['red'])
    for zz in (wz - 0.16, wz + 0.16): F.atorus(A, (ax, 0, zz), (0, 0, 1), 0.088, 0.012, lambda a: C['steel'], seg=16, rseg=4)
    for sy in (-0.155, 0.155):
        A.poly([(ax - 0.12, sy, wz - 0.20), (ax - 0.12, sy, wz + 0.20), (wx - 0.06, sy, wz + 0.11), (wx - 0.11, sy, wz), (wx - 0.06, sy, wz - 0.11)], C['red'], (0, sy, 0))
        A.poly([(ax - 0.12, sy * 0.92, wz - 0.20), (ax - 0.12, sy * 0.92, wz + 0.20), (wx - 0.06, sy * 0.92, wz + 0.11), (wx - 0.11, sy * 0.92, wz), (wx - 0.06, sy * 0.92, wz - 0.11)], C['red'], (0, -sy, 0))
        acyl(A, (wx, sy * 0.86, wz), (wx, sy * 0.92, wz), 0.155, lambda q: C['steel'], seg=18)              # the drum's flanges
    acyl(A, (wx, -0.134, wz), (wx, 0.134, wz), 0.075, s, seg=14)                                             # the drum
    acyl(A, (wx, -0.120, wz), (wx, 0.120, wz), 0.112, d, seg=16)                                             # the wire on it
    acyl(A, (wx, 0.155, wz), (wx, 0.30, wz), 0.062, d, seg=12); acyl(A, (wx, 0.30, wz), (wx, 0.325, wz), 0.045, s, seg=10)   # the motor
    for dz in (-0.03, 0.03): acyl(A, (wx + 0.03, 0.26, wz + dz), (ax - 0.06, 0.20, wz + dz - 0.30), 0.009, lambda q: C['rubber'], seg=5)   # its hoses down the mast
    acyl(A, (wx, -0.155, wz), (wx, -0.20, wz), 0.10, s, seg=14)                                              # the brake's drum, its lever
    acyl(A, (wx, -0.18, wz + 0.09), (wx - 0.16, -0.18, wz + 0.26), 0.010, s, seg=6); EXTRA.append(sphere('w_knob', (wx - 0.16, -0.18, wz + 0.26), 0.022, C['black']))
    bz = 7.42; acyl(A, (wx + 0.05, 0.0, wz + 0.10), (ax - 0.13, 0, bz), 0.006, d, seg=4)
    obox(A, (ax - 0.11, 0, bz + 0.02), (0.035, 0, 0), (0, 0.02, 0), (0, 0, 0.05), C['steel']); acyl(A, (ax - 0.13, -0.022, bz), (ax - 0.13, 0.022, bz), 0.045, d, seg=12)
    tipb = (0.44, 0, 8.20); acyl(A, (ax - 0.15, 0, bz + 0.02), tipb, 0.006, d, seg=4)
    acyl(A, (tipb[0], -0.022, tipb[2]), (tipb[0], 0.022, tipb[2]), 0.045, d, seg=12); acyl(A, (tipb[0], 0, tipb[2] + 0.04), (0.40, 0, 8.28), 0.008, s, seg=4)
    acyl(A, (tipb[0] - 0.04, 0, tipb[2]), (tipb[0] - 0.04, 0, 6.35), 0.006, d, seg=4)
    acyl(A, (tipb[0] - 0.04, 0, 6.35), (tipb[0] - 0.04, 0, 6.22), 0.028, s, seg=8); F.atorus(A, (tipb[0] - 0.04, 0, 6.16), (0, 1, 0), 0.05, 0.011, lambda a: C['steel'], seg=12, rseg=4, a0=0.6, a1=5.2)
    acyl(A, (ax, 0, 8.0), (fx, fy, 8.0), 0.007, d, seg=4)
    # on the wheelhouse roof: the searchlight, the horn, the GPS, the side lights on their boards with screens
    zr2 = crown(7.80, WH_YC + 0.4)
    F.searchlight(A, (7.80, WH_YC + 0.4, zr2), (1, 0), 0.09, C['dark'], C['lens'], C['steel'])
    zh = crown(7.85, WH_YC - 0.3)
    abox(A, 7.80, 7.88, WH_YC - 0.33, WH_YC - 0.27, zh - 0.004, zh + 0.14, C['steel'])
    acyl(A, (7.72, WH_YC - 0.3, zh + 0.16), (8.02, WH_YC - 0.3, zh + 0.20), 0.03, lambda q: C['white'], seg=10, r1=0.08)
    F.gps(A, (6.90, -0.85, crown(6.90, -0.85)), C['white'], r=0.07, h=0.12, m_post=C['steel'])
    # the work lights under the wheelhouse roof's after edge, over the forecastle's walkway and down into the shelter
    for yy in (-0.9, 1.2):
        F.work_light(A, (WH_X0 - 0.10, yy, WH_TOP - 0.02), (-0.6, 0, -1), C['dark'], C['lens'])
EXTRA = []

def lanterns_side(A):
    """the side lights on boards on the wheelhouse roof's forward corners, each with its screen inboard (fittings.side_lantern), so
    neither shows across the bow"""
    for y, sg, mt in ((SIDE[1], 1, C['lampR']), (SIDE[2], -1, C['lampG'])):
        zb = roof_z(SIDE[0]) + 0.02
        abox(A, SIDE[0] - 0.14, SIDE[0] + 0.14, min(y, y - sg * 0.12), max(y, y - sg * 0.12), zb - 0.03, zb, C['frame'])
        F.side_lantern(A, (SIDE[0], y, zb + 0.03), (1, 0, 0), (0, sg, 0), mt, C['frame'], C['black'], R=0.03, H=0.05)


# ---------- under water: the shoe, the rudder on its stock, the propeller on its shaft out of the deadwood, the anodes ----------
RX_ = 0.0                    # the rudder's stock (G: the rudder from -0.31 to 0.27)
PROP = (0.58, 0.0, 0.28); PR = 0.53                           # the propeller's centre and radius (G: 1.1 m across, four blades; 1.06 for its clearance)
def profile_rudder(U, fine=True):
    """(round 3; the sensor: «roret er en flat plate») a profile rudder hung at its heel: a NACA 0018 section (it was 11 %, and read
    as a plate), the chord 0.60 m at the hull and 0.50 at the foot, the stock 27 cm aft of the leading edge at the top, the foot rounded;
    the coupling where the stock meets the blade, and the heel's bearing on the shoe's after end with the pin in it"""
    # (round 4; the sensor again: «roret leses som en flat plate, hælen som en plate»: the profile did not show from the side) the
    # blade's outline rounded where the leading edge meets the top and the foot (a radius of 0.14 m), the blade's top 0.16 m under the
    # hull so the stock shows over it, thick in its coupling and its boss where it goes into the hull; the heel on a shoe that is a
    # tapered body faired into the keel's after end, not a plate
    z0, z1 = -0.43, RUD_TOP; n = 14 if fine else 5; rows = 10 if fine else 2; RC = 0.14
    def ring(z, sc):
        f = (z - z0) / (z1 - z0); ch = 0.50 + 0.10 * f; le = RX_ + 0.22 + 0.05 * f
        d = max(0.0, RC - min(z - z0, z1 - z)); cut = RC - math.sqrt(max(0.0, RC * RC - d * d))          # the corners rounded
        le -= cut; ch -= cut + (cut * 0.6 if z - z0 < RC else 0.0)
        us = [0.5 * (1 - math.cos(math.pi * k / n)) for k in range(n + 1)]
        yt = lambda u: 5 * 0.18 * ch * sc * (0.2969 * math.sqrt(u) - 0.1260 * u - 0.3516 * u * u + 0.2843 * u ** 3 - 0.1036 * u ** 4)
        return [(le - ch * u, yt(u), z) for u in us] + [(le - ch * u, -yt(u), z) for u in reversed(us[1:-1])]
    zs_ = [z0, z0 + 0.01, z0 + 0.03, z0 + 0.06, z0 + 0.10] + [z0 + 0.14 + (z1 - z0 - 0.28) * k / rows for k in range(rows + 1)] + [z1 - 0.10, z1 - 0.06, z1 - 0.03, z1 - 0.01, z1]
    sc = [0.50, 0.75, 0.88, 0.96, 1.0] + [1.0] * (rows + 1) + [1.0, 0.98, 0.94, 0.86, 0.70]
    if not fine: zs_, sc = [z0, z0 + 0.14, z1 - 0.14, z1], [0.7, 1.0, 1.0, 0.8]
    F.loft(U, [ring(z, k) for z, k in zip(zs_, sc)], lambda i: C['af'], cap0=True, cap1=True,
           out=lambda mid, cc: V((0, mid.y, mid.z - cc.z)) if abs(mid.y) > 1e-4 else V((0, 0, mid.z - cc.z)))
    if not fine: return
    # the coupling on the blade's top (a flange, its bolts), the stock over it, the boss where it goes into the hull
    zc = z1 + 0.012
    acyl(U, (RX_, 0, z1 - 0.01), (RX_, 0, zc + 0.03), 0.095, lambda q: C['af'], seg=16)                                 # the coupling's flange
    for a_ in range(4): acyl(U, (RX_ + 0.07 * math.cos(a_ * 1.571 + 0.785), 0.07 * math.sin(a_ * 1.571 + 0.785), zc + 0.03), (RX_ + 0.07 * math.cos(a_ * 1.571 + 0.785), 0.07 * math.sin(a_ * 1.571 + 0.785), zc + 0.055), 0.016, lambda q: C['steel'], seg=6)
    zh = z_low(RX_)
    acyl(U, (RX_, 0, zh - 0.07), (RX_, 0, zh + 0.03), 0.07, lambda q: C['af'], seg=16, r1=0.10)                         # the boss under the hull
    acyl(U, (RX_ + 0.02, 0, -0.465), (RX_ + 0.02, 0, -0.425), 0.07, lambda q: C['af'], seg=14)                         # the heel's bearing on the shoe
    acyl(U, (RX_ + 0.02, 0, -0.425), (RX_ + 0.02, 0, -0.415), 0.045, lambda q: C['steel'], seg=12)                     # the pintle's cap
def shoe_top(x): return -0.455 + 0.13 * ss(0.66, X_KA, x)
RUD_TOP = 0.86                # the blade's top (round 4: 0.97, a hand under the hull; the stock shows over it now)
def shoe(U, fine=True):
    """(round 4) the shoe as a body, 0.165 m deep (it was a plate of 9 cm): 0.20 m wide where it leaves the keel's after end (the
    keel 0.22), 0.15 at the heel, its top rising in a fillet into the keel over the last 0.34 m (the aperture's foot, clear of the
    propeller's tips), its bottom flat at the keel line, the heel's end rounded"""
    xs = [-0.40, -0.37, -0.32, -0.20, 0.10, 0.45, 0.70, 0.82, 0.92, X_KA - 0.02, X_KA + 0.06] if fine else [-0.40, 0.70, X_KA + 0.06]
    def ring(x):
        f = ss(-0.40, X_KA, x); w = 0.075 + 0.025 * f
        zt = shoe_top(x); zb = -0.62 + 0.06 * ss(-0.30, -0.40, x)
        w *= 0.55 + 0.45 * ss(-0.42, -0.30, x)
        r = min(0.04, w * 0.6, (zt - zb) * 0.4); pts = []
        for k in range(5): a_ = math.pi / 2 * k / 4; pts.append((x, w - r + r * math.sin(a_), zb + r - r * math.cos(a_)))
        pts += [(x, w, zt), (x, -w, zt)]
        for k in range(5): a_ = math.pi / 2 * (4 - k) / 4; pts.append((x, -(w - r + r * math.sin(a_)), zb + r - r * math.cos(a_)))
        return pts[::-1]
    F.loft(U, [ring(x) for x in xs], lambda i: C['af'], cap0=True, cap1=True)
def underwater(fine=True):
    U = Acc('under')
    shoe(U, fine)                                                                                    # the shoe, from the keel to the rudder's heel (G)
    profile_rudder(U, fine)
    acyl(U, (RX_, 0, RUD_TOP + 0.04), (RX_, 0, z_low(RX_) + 0.08), 0.055, lambda q: C['steel'], seg=12)                # the stock
    px, py, pz = PROP
    if not fine: return U.done(35)
    acyl(U, (px + 0.07, 0, pz), (X_KA + 0.06, 0, pz), 0.04, lambda q: C['steel'], seg=10)
    acyl(U, (X_KA - 0.04, 0, pz), (X_KA + 0.06, 0, pz), 0.08, lambda q: C['prop'], seg=14, r1=0.09)
    acyl(U, (px - 0.14, 0, pz), (px - 0.20, 0, pz), 0.06, lambda q: C['anode'], seg=14)
    F.propeller(U, PROP, (1, 0, 0), PR, C['prop'], n=4, hub=0.17, pitch=0.80, skew=0.25, cpp=False, fine=fine)
    for sg in (1, -1):
        for x, z in ((2.0, -0.10), (4.0, -0.05)): F.anode(U, (x, sg * (wk(x) + 0.004), z), (0, sg, 0), (1, 0, 0), C['anode'], L=0.30, w=0.09, t=0.035, m_strap=C['steel'])
        F.anode(U, (x_t(1.25) - 0.003, sg * 0.55, 1.25), (-1, 0, 0.05), (0, 1, 0), C['anode'], L=0.20, w=0.07, t=0.03, m_strap=C['steel'])
    def onb(xt, yt): return z_on(vline(xt), abs(yt))
    zt = onb(5.6, 0.50); acyl(U, (5.6, -0.50, zt + 0.02), (5.6, -0.50, zt - 0.03), 0.06, lambda q: C['dark'], seg=16, r1=0.055)
    xi, yi_ = 3.6, 0.55; zi = onb(xi, yi_)
    for k in range(5): abox(U, xi - 0.08, xi + 0.08, yi_ - 0.06 + 0.03 * k - 0.007, yi_ - 0.06 + 0.03 * k + 0.007, zi - 0.012, zi + 0.02, C['dark'])
    return U.done(35)


def render_only():
    """for the renders only (qa/shots.py; never exported): the name and the registration mark, so a render shows her lettered. Jonas
    11.11.2026: «Navnet på båten skal bare være over styrhusvinduet på bremen og på akterspeilet. Det andre nummeret kan gjøres mindre
    og plasseres høyere opp på det hvite»: the name on the roof brim's front face over the windscreen and across the transom, the mark
    small on the white bulwark at the bow, over the strake. Letters from Blender's own font, laid on the surface point by point"""
    out = []; wm = mat('r_letters', (0.93, 0.94, 0.93), 0.5); km = mat('r_letters_k', (0.05, 0.06, 0.08), 0.5)
    def text(txt, h, place, nm, m):
        cu = bpy.data.curves.new(nm, 'FONT'); cu.body = txt; cu.align_x = 'LEFT'; cu.resolution_u = 3
        o = bpy.data.objects.new(nm, cu); bpy.context.scene.collection.objects.link(o)
        bpy.context.view_layer.objects.active = o; o.select_set(True); bpy.ops.object.convert(target='MESH'); o.select_set(False)
        me = o.data; us = [v.co.x for v in me.vertices]; vs = [v.co.y for v in me.vertices]; k = h / max(1e-6, max(vs) - min(vs)); u0, v0 = min(us), min(vs); wd = (max(us) - u0) * k
        for v in me.vertices: v.co = V(place((v.co.x - u0) * k, (v.co.y - v0) * k, wd))
        me.materials.clear(); me.materials.append(m); out.append(o)
    for sg in (1, -1):
        def side(xc, zc_):
            def f(u, v, wd):
                x = xc + (wd / 2 - u if sg > 0 else u - wd / 2); z = zc_(x) + v
                return (x, sg * (y_at(x, z, sg) + 0.006), z)
            return f
        text('T-36-SA', 0.20, side((MARK_X[0] + MARK_X[1]) / 2, lambda x: z_rub(x) + MARK_UP + 0.035), 'r_mark%d' % sg, km)
    r_ = brim_front(0)[2]; t0 = 0.5 - NAME_CAP / 2 / r_
    text('HAVBRIS', NAME_CAP, lambda u, v, wd: (brim_front(t0 + v / r_)[0] + 0.006, WH_YC - wd / 2 + u, brim_front(t0 + v / r_)[1]), 'r_name_h', wm)
    text('HAVBRIS', 0.22, lambda u, v, wd: (x_t(2.12 + v) - 0.006, wd / 2 - u, 2.12 + v), 'r_name_t', wm)
    # (round 4; the sensor: «ikke noe anker i baugrulla») the ship's own anchor is the game's (anchors.bower: a 16 kg plough stowed in the
    # roller, 21-rescue-anchor.js), and so it was missing from every render. Drawn here as the game stows it: the shank in the roller,
    # the plough's head hanging over the stem, its chain back to the gypsy
    A = Acc('r_anchor'); gm = mat('r_galv', (0.50, 0.52, 0.53), 0.45); zr = z_cap(10.62) + 0.05; xr = 10.96
    sh0 = V((10.42, 0, zr + 0.07)); sh1 = V((xr + 0.06, 0, zr + 0.065)); d_ = (sh1 - sh0).normalized()
    obox(A, (sh0 + sh1) / 2, d_ * ((sh1 - sh0).length / 2), V((0, 0.012, 0)), V((0, 0, 0.022)), gm)              # the shank
    acyl(A, sh0 + V((0, -0.03, 0)), sh0 + V((0, 0.03, 0)), 0.03, lambda q: gm, seg=10)                              # its shackle eye
    cr = V((xr + 0.10, 0, zr - 0.02)); tip = V((xr + 0.02, 0, zr - 0.40))
    for sg in (1, -1):
        w_ = V((0.02, sg * 0.15, -0.05))
        A.poly([cr, cr + w_, tip + V((0.03, sg * 0.03, 0.02))], gm, (1, sg * 0.6, 0.3)); A.poly([cr, tip + V((0.03, sg * 0.03, 0.02)), cr + w_], gm, (-1, -sg * 0.6, -0.3))
    acyl(A, sh1, cr, 0.02, lambda q: gm, seg=8)                                                                         # the hinge to the head
    acyl(A, cr, tip, 0.016, lambda q: gm, seg=8)                                                                        # the head's keel
    for k in range(9):                                                                                                  # the chain to the gypsy
        p0 = V((10.40 - 0.04 * k, -0.025 * k, zr + 0.05 - 0.02 * k)); F.atorus(A, p0, (0, 1, 0) if k % 2 else (0, 0, 1), 0.025, 0.007, lambda a_: C['dark'], seg=10, rseg=4)
    o = A.done(35)
    if o: out.append(o)
    return out


# (round 3; the sensor: «rene, kantete flater på nært hold; ingen sveisesømmer, fenderfester») the lists in the joints between the hull
# and what stands on it: round the wheelhouse's foot on the decks, and along the shelter's walls where they stand on the bulwark's cap;
# and the fender eyes on the caps, two a side aft and two a side on the forecastle, clear of the jigging places, the hauler and the buoys
FENDER_EYES = [0.70, 1.75, 7.35, 8.35]
def joints(A):
    m = C['steel']
    ring = wh_ring(WH_FLOOR); ring = ring + [ring[0]]
    for (xa, ya, _), (xb, yb, _) in zip(ring, ring[1:]):
        ln = math.hypot(xb - xa, yb - ya); nx_, ny_ = (yb - ya) / ln, -(xb - xa) / ln
        cx_, cy_ = (xa + xb) / 2, (ya + yb) / 2
        if nx_ * (cx_ - 7.2) + ny_ * (cy_ - WH_YC) < 0: nx_, ny_ = -nx_, -ny_                     # (outward)
        k = max(1, int(ln / 0.15))
        for i in range(k):
            p0 = (xa + (xb - xa) * i / k, ya + (yb - ya) * i / k); p1 = (xa + (xb - xa) * (i + 1) / k, ya + (yb - ya) * (i + 1) / k)
            z0_, z1_ = dk(p0[0]) + camber(p0[0], p0[1]), dk(p1[0]) + camber(p1[0], p1[1])
            if p0[0] < X_BAKK - 0.02 or p1[0] < X_BAKK - 0.02: continue                          # (aft of the forecastle the house stands in the shelter's end)
            o0 = (p0[0] + nx_ * 0.016, p0[1] + ny_ * 0.016); o1 = (p1[0] + nx_ * 0.016, p1[1] + ny_ * 0.016)
            A.poly([(o0[0], o0[1], z0_ - 0.004), (o1[0], o1[1], z1_ - 0.004), (o1[0], o1[1], z1_ + 0.035), (o0[0], o0[1], z0_ + 0.035)], m, (nx_, ny_, 0))
            A.poly([(o0[0], o0[1], z0_ + 0.035), (o1[0], o1[1], z1_ + 0.035), (p1[0], p1[1], z1_ + 0.045), (p0[0], p0[1], z0_ + 0.045)], m, (nx_, ny_, 1))
    for sg in (1, -1):
        xs = [SH_X0 + (SH_X1 - SH_X0) * k / 24 for k in range(25)]
        for xa, xb in zip(xs, xs[1:]):
            if sg < 0 and HAUL[0] - 0.01 < (xa + xb) / 2 < HAUL[1] + 0.01: continue
            ya, yb = sg * (sh_y(xa) + 0.014), sg * (sh_y(xb) + 0.014); za, zb = z_cap(xa, sg), z_cap(xb, sg)
            A.poly([(xa, ya, za - 0.012), (xb, yb, zb - 0.012), (xb, yb, zb + 0.035), (xa, ya, za + 0.035)], m, (0, sg, 0))
            A.poly([(xa, ya, za + 0.035), (xb, yb, zb + 0.035), (xb, yb - sg * 0.012, zb + 0.045), (xa, ya - sg * 0.012, za + 0.045)], m, (0, sg, 1))
    for sg in (1, -1):
        for x in FENDER_EYES:
            y = sg * gunwale_y(x, sg); z = z_cap(x, sg) + 0.004
            abox(A, x - 0.05, x + 0.05, y - 0.022, y + 0.022, z - 0.006, z + 0.006, C['steel'])
            F.atorus(A, (x, y, z + 0.006), (0, 1, 0), 0.032, 0.008, lambda a_: C['steel'], seg=12, rseg=5, a0=0.0, a1=math.pi)
def build(fine=True):
    HELM_EXTRA.clear(); EXTRA.clear()
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
    else:
        zf = lambda x, y: z_deck(x) + camber(x, y); x0, x1, y0, y1 = HOLD
        abox(A, x0, x1, y0, y1, z_deck(4.7) + 0.02, z_deck(4.7) + HOLD_H + 0.09, C['white'], skip=('-z',))
    sh, sg_ = shelter(fine)
    wh, wg, crown = wheelhouse(fine)
    helm(A, G, fine)
    forecastle(A, fine); aft_deck(A, fine); rig(A, crown, fine); lanterns_side(A)
    if fine: deck_fields(A); joints(A)
    if fine:            # the transom's fender across the stern at the strake (G)
        z = z_rub(XA); xt = x_t(z) - 0.02; yy = y_at(XA, z) + 0.01
        acyl(A, (xt, -yy, z), (xt, yy, z), RUBH, lambda q: C['rub'], seg=10)
    out = [hull, A.done(35, tint=wear), underwater(fine)] + sh + wh + HELM_EXTRA + EXTRA
    g = G.done(35)
    return [o for o in out if o], sg_ + wg + ([g] if g else [])


def to_game(p): return (-p[1], p[2] - WLE, -(p[0] - XM))
def to_game_n(n): return (-n[1], n[2], -n[0])

NAME_Z = (2.00, 2.36)        # the name's strip on the blue topsides forward, under the strake (G: the old boards 0.36-0.72 under it)
def name_strips(G):
    """where the name is written (vessel3d.js nameStrips): on the blue topsides under the strake forward, aft of the registration
    mark's place (markStrips; maletest: never on each other), both sides, and across the transom under the strake"""
    out = []
    for sg, xs in ((1, [8.70 - 1.30 * k / 12 for k in range(13)]), (-1, [7.40 + 1.30 * k / 12 for k in range(13)])):
        B = []; T = []
        for x in xs:
            for arr, dz in ((B, 0.74), (T, 0.38)): z = z_rub(x) - dz; arr.append(G(x, sg * (y_at(x, z, sg) + 0.03), z))
        out.append([B, T])
    w = y_at(XA, 2.1) * 0.62; ys = [w - 2 * w * k / 12 for k in range(13)]
    out.append([[G(x_t(2.05) - 0.025, y, 2.05) for y in ys], [G(x_t(2.40) - 0.025, y, 2.40) for y in ys]])
    return out

# ---- where the name and the registration mark are painted (Jonas 11.11.2026: «Navnet på båten skal bare være over styrhusvinduet på
# bremen og på akterspeilet. Det andre nummeret kan gjøres mindre og plasseres høyere opp på det hvite»). The game looked for the places
# itself and found the thin white band under the brim for the name (13 cm letters in the brim's shadow) and the blue topsides for the
# mark (its search only knows the hull's own paint, never the white bulwark). The model says where instead (anchors.nameHouse and
# anchors.marks, read by vessel3d.js houseFront and markStrips): the name on the brim's front face, the mark in 20 cm letters on the
# white bulwark at the bow, 16 cm under the cap. Strips as the game's own: rows [bottom, top] of points, left to right as read
MARK_H = 0.20 * 1.35; MARK_X = (8.95, 8.95 + 4 * 0.20 * 1.35); MARK_UP = 0.42      # the strip's height, its stretch, its foot over the strake
NAME_CAP = 0.20
def brim_front(t):
    """a point's (x, z) on the brim's front face at t of its height (0 the lower edge, 1 the roof's edge)"""
    xo = 8.45 + LEAN * (WH_TOP - WH_SILL) + BRIM_O; zl = WH_TOP + 0.03; rise = roof_z(xo - BRIM_I) - zl
    return xo - BRIM_I * t, zl + rise * t, rise
def mark_strips(G, off=0.024):   # (7 mm more than the game's own strips: the hull's faces between two stations stand up to 4 mm outside the curve here, regmarktest)
    out = []
    for sg in (-1, 1):
        xs = [MARK_X[0] + (MARK_X[1] - MARK_X[0]) * k / 48 for k in range(49)]   # (close: stripProud reads the nearest station, and the bow's breadth changes 0.66 m a metre here)
        if sg > 0: xs = xs[::-1]
        row = lambda dz: [G(x, sg * (y_at(x, z_rub(x) + dz, sg) + off), z_rub(x) + dz) for x in xs]
        out.append([row(MARK_UP), row(MARK_UP + MARK_H)])
    return out
def name_house(G, off=0.012):
    sh = NAME_CAP / 0.74; r = brim_front(0)[2]; t0 = 0.5 - sh / 2 / r; t1 = 0.5 + sh / 2 / r; w = 1.0
    row = lambda t: [G(brim_front(t)[0] + off, WH_YC - w + 2 * w * k / 12, brim_front(t)[1]) for k in range(13)]   # (from starboard: the reader stands ahead)
    return [row(t0), row(t1)]

def kit_places(G):
    """the places where the game sets the deck kit (nothing that can be bought is modelled in, 19.10.2026): the liferaft in its cradle on
    the shelter roof, athwartships; the ring buoys on the insides of the high aft bulwarks, one a side, clear of the casing, the ladder and
    the crew; the dome on its foot on the wheelhouse roof, the open array on the radar arm's plate; the net tub and the line tubs (never
    aboard together) on the deck aft of the hatch under the roof's after end (GARN, STAMP0, OB11); the freight on the hatch boards and aft"""
    r = lambda a: round(a, 3); h = math.pi / 2
    def wall(x, sg, z=3.30):  # a buoy bracket on the bulwark's inner face, its +z inboard (the bulwark flares out as it rises)
        return G(x, sg * (y_at(x, z - 0.62) - 0.065 - 0.01), z) + [r(sg * h)]
    zc = lambda x, ys: z_deck(x) + sum(camber(x, y) for y in ys) / len(ys)
    return {'raft': [G(3.40, 0.90, ROOF_SH) + [0.0]],
            'buoys': [wall(1.00, -1), wall(0.55, 1)],
            'radar': G(RDM[0], RDM[1], crown_(RDM[0], RDM[1]) + 0.20), 'radarA': G(7.42, WH_YC, 7.29),
            'garn': {'at': G(GARN[0], GARN[1], z_deck(GARN[0]) + camber(*GARN)), 'ry': 0.0},
            'stamps': {'at': G(STAMP0[0], STAMP0[1], z_deck(STAMP0[0]) + camber(*STAMP0)), 'ry': 0.0},
            'cargo': [G(4.70, 0.0, z_deck(4.7) + HOLD_H + 0.09) + [r(h)], G(2.40, 0.60, zc(2.4, (0.2, 1.0))) + [0.0]]}
def crown_(x, y): return roof_z(x) + 0.04 * (1 - min(1.0, ((y - WH_YC) / 1.75) ** 2))

# ---- the places on deck (OB11, 10.11.2026; docs/skipsmodeller/breisjark-grunnlag.md kap. 10), measured in check() against the game's own
# boxes (deckcrew.js kitBoxes) before the export, as hs11.py (OB10).
# The net tub and the line tubs stood under the shelter to port forward of the gutting table: the line tubs' block with eight aboard
# (0.78 x 2.02 m) reached 0.7 m in under the table, and the gear was set from there on a slant across the whole aft deck past the aft
# mast (4.8 in docs/planer/om-bord.md). Now they stand on the deck aft of the hatch under the roof's after end, between the hauler and
# the stern: the gear runs straight aft from them to the setting port in the transom (SPORT), clear of the mast and the casing
GARN = (2.75, -0.37)         # the net tub (kit.garn), 1.0 x 1.2 m
STAMP0 = (3.60, -0.20)       # the line tubs' first row (kit.stamps): two across (the second 0.52 m to starboard) and up to four rows aft
def stamp_box(rows=4):
    """the line tubs' block as the game boxes it (deckcrew.js kitBoxes): (x0, x1, y0, y1), 6 cm round it"""
    cx = STAMP0[0] - (rows - 1) * 0.25; hl = (rows * 0.5 + 0.02) / 2 + 0.06; cy = STAMP0[1] - 0.26; hw = 0.78 / 2 + 0.06
    return (cx - hl, cx + hl, cy - hw, cy + hw)
# the stack of conical pots (kit.pots, OB16: a ring of 1.45 m, six high): on the open aft deck to port of the middle, aft of the casing
# and the aft mast, clear of the transom, the bitts and the setting port's way; a hauled pot is laid, tipped and emptied on the free deck
# in the open side aft of the bleeding tub (POT_SPOT; the game laid it 2 m aft of the hauler, on the hatch's corner)
# Round 2 (11.11.2026) tried the starboard quarter against the high aft bulwark (x 1.20, y -1.01), clear of the setting port. potshot
# says no: the deck map's outermost cell (1.6-1.8 m out) is no floor and a ring may reach into it only from beam / 2 - 0.45 = 1.65 m,
# and 15 cm further in the ring meets the aft mast's cell or the bitts' (no ring of 1.45 m fits between them, by 1.4 cm). So she
# stands where OB16 found her, in front of the port; pots and nets or lines are never rigged together
POTS = [(0.67, -0.40, 0.0)]   # (x, y, over the deck)
POT_SPOT = (3.15, -1.11)
def pot_kit(G):
    return {'pots': {'kind': 'kong', 'at': [G(x, y, z_deck(x) + camber(x, y) + dz) + [0.0, 6] for x, y, dz in POTS], 'spot': G(POT_SPOT[0], POT_SPOT[1], z_deck(POT_SPOT[0]) + camber(*POT_SPOT))}}
# the jigging places (anchors.jigZ, F21): [side, x], side 1 starboard. Only the open starboard side under the shelter has a rail a man
# can jig over (0.70 m; the aft bulwark stands 1.5 m over the deck, the port side is the shelter's wall, the forecastle's cap has its
# rails), and the hauler and the bleeding tub stand in its forward two thirds: one place, aft in the opening; and since valg 32 (STEP_S) a second on the low rail aft of the shelter's corner, under the roof's after end. The game's table (JIG_Z in
# view3d/13-instruments.js) had four to starboard, three of them at the high aft bulwark, where the machine stood in the plating
JIG = [(1, 3.66), (1, 2.40)]   # (round 4: the second from 2.64, where he stood 0.19 m from the shelter wall's end and 0.02 from the post that is gone)
JIG_CLEAR = {1: [(XA, STEP_S[0] + 0.30, 'den høye akterskansen'), (SH_X0 - 0.25, HAUL[0] + 0.25, 'lyets hjørne'), (TUB[0] - 0.60 - 0.25, TUB[0] + 0.60 + 0.25, 'blødekaret'),
                 (5.47 - 0.60, 5.47 + 0.60, 'haleren'), (HAUL[1] - 0.25, XF, 'åpningens forkant, styrhuset og bakken')],
             -1: [(XA, XF, 'babord: den høye akterskansen, lyets vegg og bakken')]}

def bower(G):
    return {'kind': 'plog', 'kg': 16, 'fair': G(10.96, 0, z_cap(10.62) + 0.12), 'gypsy': G(10.06, -0.23, z_bk(10.06) + 0.40), 'side': 0, 'deck': True}

HXX = 5.47                   # the hauler's station at the hauling port, on the starboard cap (G: 5.30)
# the hauler's height over the cap (OB11, F24): it stood 0.55 over it, 1.25 m over the deck, and the game sends the two who haul and
# bleed inside when the hauler stands more than 1.2 m over the deck where they would stand (deckcrew.js goalOf), so nobody was seen at
# the hauler in any haul. 0.30 over the cap as on the other sjarks (hs11.py, hurtig11.py): a metre over the deck, a man's working height
HAUL_UP = 0.30
def anchors():
    G = lambda x, y, z: [round(v, 3) for v in to_game((x, y, z))]
    zd = z_deck(4.5)
    fl = WH_FLOOR + camber(X_BAKK, 0.55)
    return {'bower': bower(G), 'eye': G(SKIP[0], SKIP[1], fl + EYE_H), 'skipperAt': G(SKIP[0], SKIP[1], fl), 'hp': HP, 'fov': FOV,
            # the hands (breisjark-grunnlag kap. 6): the fisher at the hauler forward in the open starboard side, the one who bleeds by the tub
            # just aft of him, the one who guts at the table across the hatch to port, one aft by the casing
            'crewSpots': [G(5.30, -1.30, zd + 0.04) + [1.57], G(4.62, -0.85, zd + 0.04) + [1.57], G(3.65, 0.90, zd + 0.04) + [-1.57], G(1.90, 0.45, zd + 0.04) + [3.14]],
            # typed lights (B8): under 12 m an all-round white (on the fore mast's top) and the side lights, the stern light on the gantry;
            # the fishing lights red over white on their arms (rule 26); the work lights
            'lights': [[G(FM[0], FM[1], white_z()), [1, 0.95, 0.85], 'allround'],
                       [G(SIDE[0], SIDE[1], roof_z(SIDE[0]) + 0.05), [1, 0.12, 0.1], 'port'], [G(SIDE[0], SIDE[2], roof_z(SIDE[0]) + 0.05), [0.1, 1, 0.35], 'stbd'],
                       [G(*STERN_L), [1, 0.95, 0.85], 'stern'], [G(FM[0] + LAMP_ARM, FM[1], FISH_R), [1, 0.12, 0.1], 'fishR'], [G(FM[0] + LAMP_ARM, FM[1], FISH_W), [1, 0.95, 0.85], 'fishW'],
                       [G(SH_RX0 + 0.12, 0.0, SH_TOP - 0.06), [1, 0.95, 0.85], 'work']],
            # the steps up from the walkway beside the wheelhouse to the forecastle, to starboard (deckMap: the walkway is narrow)
            'stairs': [{'from': G(5.75, -1.74, z_deck(5.75)), 'to': G(6.75, -1.74, z_bk(6.75))}],
            'doors': [{'at': G((DOOR[0] + DOOR[1]) / 2, WHY0 - 0.03, DOOR[2]), 'w': round(DOOR[1] - DOOR[0], 2), 'h': round(DOOR[3] - DOOR[2], 2),
                       'in': G((DOOR[0] + DOOR[1]) / 2, WHY0 + 0.6, fl), 'to': 'helm', 'hinge': 'fwd'},
                      {'at': G(1.90, CASING[2] - 0.03, z_deck(1.9)), 'w': 0.7, 'h': 0.88, 'in': G(1.90, 1.5, z_deck(1.9)), 'to': 'casing', 'hinge': 'aft'}],
            'names': name_strips(G), 'nameHouse': name_house(G), 'marks': mark_strips(G),
            # the work at sea: the fisher at the hauler forward in the open starboard side, the bleeding tub (the game's) on the deck just aft
            # of him, the gutting table (her own) across the hatch to port, the hold's hatch between them for the gutted fish on ice
            'work': {'table': G((TABLE[0] + TABLE[1]) / 2, (TABLE[2] + TABLE[3]) / 2, z_deck(3.7)), 'tub': G(TUB[0], TUB[1], z_deck(TUB[0])), 'own': True, 'top': round(z_deck(3.7) + 0.9 - WLE, 3)},
            'hatch': G(4.7, 0.0, z_deck(4.7) + HOLD_H + 0.09), 'bunk': G(8.6, 0.4, z_bk(8.6) - 0.7), 'exhaust': G(2.67, 1.45, 5.32),
            'deck': {'y': round(zd - WLE, 3), 'z': round(-(4.5 - XM), 3)}, 'gw': round(z_cap(4.5) - WLE, 3),
            'stern': round(-(XA - XM) + 0.1, 3), 'bow': round(-(10.3 - XM), 3), 'side': 1.89, 'beam': BEAM, 'pl': 4.4, 'rl': 1.6, 'open': False, 'hand': False,
            'pole': G(*pole_top()), 'hauler': G(HXX, -(gunwale_y(HXX, -1) - 0.02), z_cap(HXX, -1) + HAUL_UP), 'filler': G(FILL[0], FILL[1], z_deck(FILL[0]) + 0.06),
            'jigZ': [[sd, round(XM - x, 3)] for sd, x in JIG],
            'kit': dict(kit_places(G), **pot_kit(G))}


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

# ---- (round 4) the posts on deck and the places the crew stand, for the check that nobody stands in a post ----
ROOF_POSTS = (1,)            # the sides with a post under the shelter roof's after edge (1 port; round 4: the starboard one is gone)
def posts():
    """the posts a man could stand in, as boxes on the deck plan (x0, x1, y0, y1): a round one as its square"""
    out = []; zc = z_cap(XA) + 0.012; xp = x_t(zc) + 0.035
    for sg in ROOF_POSTS:
        px = SH_RX0 + 0.10; py = sg * (ycap(px, sg) + CAP * 0.5)
        out.append(('lyets akterstolpe ' + ('bb' if sg > 0 else 'sb'), (px - 0.03, px + 0.03, py - 0.03, py + 0.03)))
    out.append(('lyets vegg akter for åpningen sb', (SH_X0, HAUL[0], -sh_y(SH_X0), -sh_y(SH_X0) + SHT)))
    out.append(('åpningens forkant sb', (HAUL[1], SH_X1, -sh_y(HAUL[1]), -sh_y(HAUL[1]) + SHT)))
    for sy in (GANT_Y, -GANT_Y): out.append(('galgestolpe ' + ('bb' if sy > 0 else 'sb'), (xp - 0.045, xp + 0.045, sy - 0.045, sy + 0.045)))
    out.append(('aktermasta', (AM[0] - 0.08, AM[0] + 0.08, AM[1] - 0.08, AM[1] + 0.08)))
    return out
# where the game set the crew in the scenes of tests/ombord.py (12.11.2026, CREW3D.visible() with mode 'at', on its 0.2 m grid; a
# sonde over teiner sett/trekk, juksa jig/maskin/sløy, line and garn sett/trekk, rydd, hvile, ut). The work places (CREW_WORK: at the
# hauler, the tub, the table, where the pot is emptied, the setter, the one who feeds the net) must have 0.25 m from the shoulder to
# any post; those at rest or clearing the deck (CREW_REST: coffee, look, lean, the phone, the broom: deckcrew.js gives them a free cell
# at a rail as it finds one) must stand clear of it. The places the model gives (the jigging, the hauler, the setter) are reckoned from
# the script below, so they follow the model
CREW_WORK = [('ved teina og blødekaret', 4.5, -0.9), ('ved teina, nummer to', 3.9, -1.3), ('plukker', 4.1, -0.9), ('pakker', 4.7, -0.9),
             ('sløyer', 3.7, 0.9), ('sløyer, nummer to', 3.1, 0.9), ('setter (sett)', 0.3, 0.1), ('mater garnet', 3.5, -0.1)]
CREW_REST = [('kaffe ved ripa sb', 2.5, -1.7), ('kaffe sb forut for lyets vegg', 3.3, -1.7), ('ser ut sb', 1.5, -1.5), ('ser ut bb akter', -0.1, 1.5),
             ('ser ut akter', -0.1, 0.5), ('telefonen sb akter', 0.7, -1.5), ('lener bb under lyet', 4.7, 1.7), ('slangen bb', 5.3, 1.1),
             ('kosten', 3.3, -0.1), ('kikkert sb', 2.48, -1.7), ('telefonen bb akter', -0.12, 1.3), ('lener akter', -0.12, 0.3)]   # (the last three from ma36shot's pots, 12.11.2026)
def crew_places(rest=False):
    if rest: return list(CREW_REST)
    out = list(CREW_WORK)
    for sd, x in JIG: out.append(('juksa x %.2f' % x, x, -sd * (ybw(x, -sd) - 0.15)))   # (the game stands him 0.15 m in from the bulwark's foot, as seen)
    out.append(('haleren', HXX - 0.2, -(gunwale_y(HXX, -1) - 0.02) + 0.55))
    for y in SETTER_Y: out.append(('setteren y %.2f' % y, XA + TT + 0.30, y))
    return out

def check():
    out = []
    v, amax = displacement(WL); wl1 = WL
    st = -0.005 if v > DISP else 0.005
    for _ in range(80):
        if (displacement(wl1)[0] - DISP) * st < 0: wl1 += st
        else: break
    out.append(('deplasement %.2f t ved tegningens vannlinje (kjølen med) mot %.1f t i VESSELS; %.1f t gir vannlinja %.2f m %s (største snitt %.2f m2)' % (v, DISP, DISP, abs(WL - wl1), 'lavere' if wl1 < WL else 'høyere', amax), abs(v - DISP) / DISP < 0.15))
    ve, _ = displacement(WLE)
    out.append(('den tomme båten (spillets vannlinje WLE, %.2f m under tegningens): %.2f t mot %.1f t i VESSELS (valg 18 A: disp er den tomme båten); malingen står ved tegningens vannlinje' % (WL - WLE, ve, DISP), abs(ve - DISP) / DISP < 0.03))
    # (the pchip fault from H3d1: a table cached by id() gave stations the wrong curve, and the two sides differed; by content now)
    dsy = max(abs(y_at(x, z, 1) - y_at(x, z, -1)) for x in [XA + (XF - XA) * i / 120 for i in range(121)] for z in (0.6, 1.0, 1.38, 1.8, 2.2, 2.6, 2.9) if z_low(x) < z - 0.05)
    out.append(('sidene er like under ripa: største forskjell mellom styrbord og babord halvbredde %.4f m (pchip-feilen ga 0,1 m ved stevnen på kyst15; ripa om styrbord er lav en meter lenger akter, valg 32)' % dsy, dsy < 1e-6))
    xs = [XA + (XF - XA) * i / 400 for i in range(401)]
    loa = XF - (x_t(z_rub(XA)) - 0.02 - RUBH)
    out.append(('AVVIK lengde over alt %.2f m (fenderlista over speilet til stevnens topp; skroget alene %.2f, baugrulla til %.2f) mot %.2f: 2 %% for lang, og det står (stasjonene er målt på tegningen med 1 m mellom, og hver plass om bord er regnet mot dem; spillet regner med lengden %.2f)' % (loa, XF - x_t(z_cap(XA)), 10.96 + 0.07, L, L), abs(loa - L) / L < 0.025))
    mb = max(ysh(x) for x in xs[::4]); mr = max(y_at(x, z_rub(x)) + RUBW for x in xs[::4]); mw = max(y_at(x, WL) for x in xs)
    out.append(('største bredde %.2f m ved ripa, %.2f over fenderlista, mot %.2f (vannlinja %.2f m, %.0f %%)' % (2 * mb, 2 * mr, BEAM, 2 * mw, 100 * mw / mb), abs(2 * mb - BEAM) / BEAM < 0.03))
    dr = WL - min(kb(x) for x in xs if X_KA <= x <= X_KF); dsh = WL + 0.62
    out.append(('dypgang %.2f m med kjølen, %.2f med skoen, mot %.2f i VESSELS' % (dr, dsh, DRAFT), abs(dsh - DRAFT) < 0.05))
    out.append(('fribord midtskips %.2f m til ripa, %.2f til lyets tak; ved stevnen %.2f, ved speilet %.2f; dekket %.2f over vannet' % (z_cap(XM) - WL, SH_TOP - WL, z_cap(XF) - WL, z_cap(XA) - WL, z_deck(XM) - WL), z_deck(XM) - WL > 0.5))
    wz = white_z(); sz = roof_z(SIDE[0]) + 0.05
    out.append(('den hvite rundtlysende %.2f m over sidelanternene (vedlegg I 2(d): minst 1 m)' % (wz - sz), wz - sz >= 1.0))
    hs, hw = sz - z_cap(SIDE[0]), wz - z_cap(FM[0])
    out.append(('sidelanternene %.2f m over skroget, den hvite %.2f (vedlegg I 2(g): sidene høyst tre firedeler så høyt, %.2f)' % (hs, hw, 0.75 * hw), hs <= 0.75 * hw))
    sp = FISH_R - FISH_W
    out.append(('fiskelysene rødt over hvitt %.2f m fra hverandre (vedlegg I 2(i), under 20 m: minst 1 m), det hvite %.2f m over sidelanternene (2(j): minst to ganger avstanden, %.2f)' % (sp, FISH_W - sz, 2 * sp),
                sp >= 1.0 and FISH_W - sz >= 2 * sp))
    px, py = POLE
    out.append(('masta med den hvite står %.1f m fra flaggstanga og over den: spillet gir vimpel (båten har mast)' % math.hypot(FM[0] - px, FM[1] - py), math.hypot(FM[0] - px, FM[1] - py) > 1.0 and wz > pole_top()[2] + 0.3))
    tip = PROP[2] + PR; low = PROP[2] - PR
    out.append(('propellen Ø %.2f: %.2f m klaring til skroget over, %.2f til skoen under, %.2f til akterstevnen forut, %.2f til roret akter' % (2 * PR, z_low(PROP[0] + 0.1) - tip, low - max(shoe_top(PROP[0] + d_) for d_ in (-0.1, 0.0, 0.1)), X_KA - PROP[0] - 0.08, PROP[0] - 0.08 - (RX_ + 0.27)),
                z_low(PROP[0] + 0.1) - tip > 0.05 and low - max(shoe_top(PROP[0] + d_) for d_ in (-0.1, 0.0, 0.1)) > 0.05 and X_KA - PROP[0] - 0.08 > 0.1 and PROP[0] - 0.08 - (RX_ + 0.27) > 0.1))
    fl = WH_FLOOR + camber(X_BAKK, 0.0)
    out.append(('styrehuset: %.2f m under taket over dørken (midt på, med dekkets bue; brotest 1.8 for den som står, dekkskartet 1.85)' % (WH_TOP - fl), WH_TOP - fl >= 1.86))
    ey = WH_FLOOR + camber(X_BAKK, 0.55) + EYE_H; wtop = WH_SILL + 1.05 * 0.98
    out.append(('øyet %.2f m over frontvinduenes underkant, %.2f under overkanten' % (ey - (WH_SILL + 0.07), wtop - ey), ey - WH_SILL > 0.3 and wtop - ey > 0.05))
    (dx0, dz0), (dx1, dz1) = DASH
    ang = math.degrees(math.atan2(ey - (dz0 + dz1) / 2, (dx0 + dx1) / 2 - SKIP[0])); up = math.degrees(math.atan2(wtop - ey, 8.45 + LEAN * (wtop - WH_SILL) - SKIP[0]))
    out.append(('dashbordet %.0f grader under øyet, vinduets overkant %.0f over (hp %.2f rad og fov %d: synsfeltet går fra %.0f ned til %.0f grader)' % (ang, up, HP, FOV, FOV / 2 - math.degrees(-HP), math.degrees(-HP) + FOV / 2),
                ang <= math.degrees(-HP) + FOV / 2 - 3 and up <= FOV / 2 - math.degrees(-HP) + 12))
    out.append(('rattet %.2f m forut for skipperen (han står bak det, ikke i det), setet %.2f m bak ham' % (WHEEL[0] - SKIP[0], SKIP[0] - SEAT[0]), 0.3 <= WHEEL[0] - SKIP[0] <= 0.55 and SKIP[0] - SEAT[0] >= 0.4))
    # the game's deck map (sulebas-bygging kap. 15): DM_HEAD 1.85 over a floor; a part within 0.6 m and up to 1.6 m higher is joined
    out.append(('lyets tak %.2f m over dekket (fri høyde over arbeidsdekket, minst 1.85; for høyt til å bli dekk, over 1.6)' % (SH_TOP + 0.02 - z_deck(4.5) - 0.08), SH_TOP + 0.02 - z_deck(4.5) - 0.08 >= 1.85))
    out.append(('styrhustaket %.2f m over gangen på bakken ved siden av (et tak over et rom: roofOver)' % (WH_TOP - z_bk(7.0)), WH_TOP - z_bk(7.0) > 1.6))
    out.append(('casingens tak %.2f m over dekket (under 1.6: en kasse dekkskartet kan knytte til dekket, som før)' % (CASING[4] + 0.04 - z_deck(1.5)), True))
    gw = -(WHY0) ; wy = ybw(6.8) - abs(WHY0)
    out.append(('gangen om styrbord ved styrhuset %.2f m bred mellom huset og skansen (dekkskartet: to celler, 0.4)' % wy, wy >= 0.4))
    # the name strips under the strake, the mark forward (markStrips: on 9-15 m a 0.34 m strip about 1.2 m from the stem): never on each other
    out.append(('navnefeltene på sidene %.2f-%.2f m under fenderlista fra x %.2f til %.2f, merket forut for x 9.2 (maletest: aldri oppå hverandre)' % (0.38, 0.74, 7.40, 8.70), 8.70 < 9.2))
    # vessel3d: the hull from 0.3 m under the water to 1.5 m over it, with what stands out over the rail
    z0b, z1b = WLE - 0.3, WLE + 1.5
    ln = max(x_of(x, z1b) for x in xs if z_low(x) < z1b) - min(x_of(XA, z) for z in (z0b, z1b)) + RUBH
    out.append(('vessel3d: skroget i båndet -0.3 til 1.5 m er %.2f m langt (lengden %.2f, -6 %% til +3 %%) og %.2f m bredt (bredden %.2f, ±5 %%)' % (ln, L, 2 * mr, BEAM), -0.06 < (ln - L) / L < 0.03 and abs(2 * mr - BEAM) / BEAM < 0.05))
    # the hull's fairness (sulebas-bygging kap. 16): the waterlines from the bottom to the sheer, their slope's change per 6 cm step, away from the stem
    worst = (0.0, 0, 0)
    for z in (0.8, 1.1, 1.38, 1.7, 2.1, 2.5):
        xs3 = [3.0 + 0.06 * i for i in range(130) if z_low(3.0 + 0.06 * i + 0.18) < z - 0.05 and 3.0 + 0.06 * i < 10.4]
        yv = [y_at(x, z) for x in xs3]; d = [b - a for a, b in zip(yv, yv[1:])]
        for i in range(1, len(d)): worst = max(worst, (abs(d[i] - d[i - 1]), xs3[i], z))
    out.append(('vannlinjene jevne: største endring i stigningen %.3f m per 6 cm-steg (ved x %.2f, z %.2f; en bule synes over rundt 0,02)' % worst, worst[0] < 0.02))
    # ---- the places (OB11): against the game's own boxes (deckcrew.js kitBoxes, each padded 6 cm: the tub 0.72 x 1.08, the line tubs'
    # block with eight aboard 0.78 x 2.02, the net tub 1.0 x 1.2, a cargo unit 0.8 x 1.2), R a body's half width ----
    R = 0.25; zdk = lambda x, y: z_deck(x) + camber(x, y)
    hx0, hx1, hy0, hy1 = HOLD[0] - 0.04, HOLD[1] + 0.04, HOLD[2] - 0.04, HOLD[3] + 0.04        # (the hatch boards reach 4 cm outside the coaming)
    # F24: the game sends the two who haul and bleed inside when the hauler stands more than 1.2 m over the deck where they stand
    hman = (HXX - 0.2, -(gunwale_y(HXX, -1) - 0.02) + 0.55); hup = z_cap(HXX, -1) + HAUL_UP - zdk(*hman)
    out.append(('haleren %.2f m over dørken der den som haler står (x %.2f, y %.2f; spillet sender ham inn over 1,2 m: F24, før 1,25), %.2f over ripa' % (hup, hman[0], hman[1], HAUL_UP), hup <= 1.10))
    tx = (TUB[0] - 0.60, TUB[0] + 0.60); ty = (TUB[1] - 0.42, TUB[1] + 0.42)
    out.append(('blødekaret x %.2f-%.2f rett akter for haleren (%.2f), %.2f m fra skansens fot og %.2f m fra luka (den som bløgger står imellom)' % (tx[0], tx[1], HXX, ybw(TUB[0], -1) + ty[0], hy0 - ty[1]),
                ybw(TUB[0], -1) + ty[0] > 0.0 and HXX - tx[1] > 0.2 and tx[0] > HAUL[0]))
    # F19: the one who guts stands inboard of the table, the second 0.7 m forward or aft of him on free deck
    gy = TABLE[2] - R - 0.02; gx = (TABLE[0] + TABLE[1]) / 2
    def free(x, y): return not (hx0 - R < x < hx1 + R and hy0 - R < y < hy1 + R) and not (CASING[0] - R < x < CASING[1] + R and y > CASING[2] - R) and SH_RX0 < x < WH_X0 - R and abs(y) + R < ybw(x)
    two = [x for x in (gx - 0.7, gx + 0.7) if free(x, gy)]
    out.append(('sløyebordet x %.2f-%.2f ved babord ripe under lyet; den som sløyer står y %.2f, %.2f m fra luka, nummer to 0,7 m %s (F19); stampene og garnkaret står ikke lenger forut for bordet' % (TABLE[0], TABLE[1], gy, gy - R - hy1, 'forut eller akter' if len(two) == 2 else 'forut' if two and two[0] > gx else 'akter' if two else 'INGEN PLASS'),
                free(gx, gy) and len(two) >= 1))
    # the gear aft of the hatch: the line tubs' block and the net tub (never aboard together) clear of the hatch, the aft mast, the ladder,
    # the casing and the cargo place aft
    sx0, sx1, sy0, sy1 = stamp_box(); gb = (GARN[0] - 0.66, GARN[0] + 0.66, GARN[1] - 0.56, GARN[1] + 0.56)
    # (round 3: the ladder's foot on the deck is now the steps on the casing's after face, to port; it stood at x 2.0, y -1.2)
    lad = (CASING[0] - 0.13, CASING[0], LADDER[1] - 0.22, LADDER[1] + 0.22); cg = (2.40 - 0.60, 2.40 + 0.60, 0.60 - 0.40, 0.60 + 0.40)
    def hits(b, c): return b[0] < c[1] and c[0] < b[1] and b[2] < c[3] and c[2] < b[3]
    def bgap(b, c): return max(c[0] - b[1], b[0] - c[1], c[2] - b[3], b[2] - c[3])
    okg = lambda b: b[1] <= hx0 and b[0] + 0.06 >= AM[0] + 0.08 and not hits(b, lad) and b[3] <= CASING[2] and not hits((b[0] + 0.06, b[1] - 0.06, b[2] + 0.06, b[3] - 0.06), cg)
    out.append(('stampeblokken med åtte x %.2f-%.2f, y %.2f til %.2f akter for luka (%.2f) under takets akterkant (%.2f): %.2f m til aktermasta, %.2f m til stigen, %.2f til lasteplassen' % (sx0, sx1, sy0, sy1, hx0, SH_RX0, sx0 + 0.06 - AM[0] - 0.08, bgap((sx0, sx1, sy0, sy1), lad), cg[2] - sy1 + 0.06), okg((sx0, sx1, sy0, sy1))))
    out.append(('garnkaret x %.2f-%.2f, y %.2f til %.2f samme sted (aldri om bord samtidig med stampene): %.2f m til luka, %.2f til stigen' % (gb[0], gb[1], gb[2], gb[3], hx0 - gb[1], bgap(gb, lad)), okg(gb)))
    # the setting (drawSetting: from the tubs' place 0.35 over the deck to 0.45 m to starboard of the middle at the stern, the waist's
    # height + 0.10 just inside the transom and 0.05 under it just outside): through the setting port, over its roller, under the net
    # roller, clear of the aft mast and the casing on the way
    st = -(XA - XM) + 0.1; xin, xout = XM - (st - 0.15), XM - (st + 0.15); zin, zout = z_cap(4.5) + 0.10, z_cap(4.5) - 0.05
    xr = x_t(SPORT[2]) + 0.035; gz = zin + (zout - zin) * (xin - xr) / (xin - xout); rt_ = SPORT[2] + 0.02 + 2 * SPORT_R
    out.append(('setteporten i hekken: y %.2f til %.2f mellom galgens stolper (%.2f), terskelen %.2f m over dekket, rullens topp %.2f; redskapet går ut ved y -0.45 i %.2f (skansens topp ellers %.2f: før gikk det gjennom den), under garnrulla (%.2f)'
                % (SPORT[0], SPORT[1], GANT_Y, SPORT[2] - z_deck(0.0), rt_, gz, z_cap(XA), 4.52 - 0.25), rt_ < gz - 0.02 and SPORT[0] + 0.1 < -0.45 < SPORT[1] - 0.1 and GANT_Y - 0.07 >= SPORT[1] and 4.52 - 0.25 > gz + 0.5))
    def way(a):   # the least distance from the gear's way (a to the port) to the aft mast, and whether it crosses the casing or the ladder
        pts = [(a[0] + (xin - a[0]) * u / 40, a[1] + (-0.45 - a[1]) * u / 40) for u in range(41)]
        return min(math.hypot(x - AM[0], y - AM[1]) for x, y in pts) - 0.08, any((CASING[0] < x < CASING[1] and y > CASING[2]) or (lad[0] < x < lad[1] and lad[2] < y < lad[3]) for x, y in pts)
    # (round 3) the one who sets stands clear of the gantry's posts, at both his places (over the stern 0.45 m to starboard, and at the
    # line setter); the ensign flies over the heads; the way up to the roof is out of the way from the gear to the port
    pin = GANT_Y - 0.045; gp_ = min(pin - (abs(y) + R) for y in SETTER_Y)
    out.append(('setteren står %.3f m fra galgestolpens innside (stolpene y ±%.2f, han står y %s med skuldrene %.2f ut; runde 3: 0,025, før det i stolpen; krever 0,10)' % (gp_, GANT_Y, ' og '.join('%.2f' % y for y in SETTER_Y), R), gp_ >= 0.10))
    # (round 4) every place the crew stand at work or at rest, against every post on deck (the shelter's after posts, the wall's ends at
    # the open side, the gantry's posts, the aft mast): the post at least 0.25 m outside the shoulder (the sensor in round 3: «mannen i
    # blått står i den tynne stolpen under lyets akterkant», «mannen i rødt står i en stolpe»)
    for rest, need, what in ((False, 0.25, 'arbeidsplasser'), (True, 0.05, 'plasser i pausen og ryddingen')):
        worst = (9.0, '', ''); bad_ = []
        for pn, b in posts():
            for cn, cx, cy in crew_places(rest):
                d = math.hypot(max(b[0] - cx, 0.0, cx - b[1]), max(b[2] - cy, 0.0, cy - b[3])) - R
                if d < worst[0]: worst = (d, cn, pn)
                if d < need: bad_.append((cn, pn))
        out.append(('mannskapets %s mot stolpene: %d plasser, %d stolper (%s); nærmeste %.2f m fra skuldra til stolpen (%s ved %s; krever %.2f)%s'
                    % (what, len(crew_places(rest)), len(posts()), ', '.join(pn for pn, _ in posts()), worst[0], worst[1], worst[2], need, '' if not bad_ else ': for nær ' + '; '.join('%s/%s' % q for q in bad_)), not bad_))
    ptz = pole_top()[2]; hang = ptz - 1.20 - z_deck(XA + 0.3)
    out.append(('flaggstanga på galgen (x %.2f, y %.2f), rett opp (toppen %.2f m akter for foten; runde 3: 0,16 skrått akterover), toppen %.2f m over dekket: et flagg på 1,2 m henger aldri lavere enn %.2f m over dekket (hodene 1,8; før 1,5 over setteren)'
                % (POLE[0], POLE[1], POLE[0] - pole_top()[0], ptz - z_deck(0.0), hang), hang >= 2.0 and abs(pole_top()[0] - POLE[0]) < 0.005 and abs(pole_top()[1] - POLE[1]) < 0.005))
    gl = min(bgap((sx0, sx1, sy0, sy1), lad), bgap(gb, lad))
    out.append(('stigen til lyets tak om babord over casingen (trinnene på casingens akterside, x %.2f, y %.2f): %.2f m fra stampene og garnkaret (før 0,05 og 0,03), utenfor redskapets vei' % (lad[0], LADDER[1], gl), gl >= 0.25))
    wg, ws = way(GARN), way(STAMP0)
    out.append(('redskapets vei til setteporten: fra garnkaret %.2f m klar av aktermasta, fra stampene %.2f m; ikke gjennom casingen eller stigen (før: fra babord under lyet på skrå over hele akterdekket)' % (wg[0], ws[0]), wg[0] > 0.12 and ws[0] > 0.12 and not wg[1] and not ws[1]))
    # the pots' stack (a ring of 1.45 m) and the place where a pot is emptied
    r = 0.725; bit = [(0.35, BITT_Y), (0.35, -BITT_Y)]; pk = []
    for i, (x, y, dz) in enumerate(POTS):
        okb = x - r > XA + TT and abs(y) + r < ybw(x) and all(math.hypot(x - bx, y - by) > r + 0.14 for bx, by in bit) and math.hypot(x - AM[0], y - AM[1]) > r + 0.08
        okc = math.hypot(max(0.0, CASING[0] - x), max(0.0, CASING[2] - y)) > r and x + r < SH_RX0
        pk.append(okb and okc and all(math.hypot(x - q[0], y - q[1]) > 2 * r for j, q in enumerate(POTS) if j != i))
    px, py = POT_SPOT; dh = math.hypot(max(0.0, hx0 - px), max(0.0, hy0 - py) if py < hy0 else 0.0)
    oks = ybw(px, -1) + py - r > 0.0 and dh > r and tx[0] - 0.06 - (px + r) >= 0.0 and HAUL[0] < px + 0.3
    out.append(('teinestabelen (seks) %s på det åpne akterdekket: %.2f m fra speilet, fri for casingen, masta, pullertene og skansen, akter for takkanten; teina tømmes ved x %.2f, y %.2f i den åpne sida akter for blødekaret (%.2f m til karet, %.2f til skansen, %.2f til lukas hjørne)'
                % (', '.join('x %.2f y %.2f' % (x, y) for x, y, _ in POTS), POTS[0][0] - r - XA - TT, px, py, tx[0] - 0.06 - (px + r), ybw(px, -1) + py - r, dh - r), all(pk) and oks))
    # (round 2) how far the stack stands from the setting port's opening (a measure, not a demand: potshot has no other place for her)
    dport = min(math.hypot(x - (XA + TT), y - max(SPORT[0], min(SPORT[1], y))) for x, y, _ in POTS) - r
    out.append(('teinestabelen %.2f m fra setteportens åpning (styrbord låring, 0,76 m fra porten, er prøvd: potshot finner ikke gulv til ringen der)' % dport, True))
    try:
        pj = potplaces.table().get('malo36') or {}; mine = pot_kit(lambda x, y, z: [round(v, 3) for v in to_game((x, y, z))])['pots']
        same = pj.get('at') == mine['at'] and pj.get('spot') == mine['spot']
    except Exception: same = False
    out.append(('potplaces.json har de samme plassene som skriptet (python3 tools/boats/potplaces.py skriver dem ellers over)', same))
    # the jigging places (F21): clear of what stands at the rail, over a metre apart
    bad = [(sd, x, nm) for sd, x in JIG for x0, x1, nm in JIG_CLEAR[sd] if x0 <= x <= x1]
    gap = min([abs(a_[1] - b_[1]) for a_ in JIG for b_ in JIG if a_ is not b_ and a_[0] == b_[0]] or [9])
    rail = max(z_cap(x, -1) - z_deck(x) for _, x in JIG)
    out.append(('juksaplassene %s: %d (jukseMax i VESSELS er det, valg 32: to); ripa der %.2f m over dekket (akterskansen %.2f: for høy å jukse over), fri for %s' % (', '.join('%s %.2f' % ('sb' if sd > 0 else 'bb', x) for sd, x in JIG), len(JIG), rail, z_cap(1.0) - z_deck(1.0),
                'akterskansen, lyets hjørne, blødekaret og haleren' if not bad else bad), not bad and gap > 1.0 and 0.5 <= rail <= 0.9 and len(JIG) == 2))
    # the roof's brim over the walkway beside the wheelhouse (deckMap: 1.85 m free over a floor)
    out.append(('taket med bremmen: dryppkanten %.2f m over gangen på bakken, bremmen %.2f m ut fra veggene og %.2f inn opp til takkanten' % (WH_TOP - 0.025 - z_bk(7.0), BRIM_O, BRIM_I), WH_TOP - 0.025 - z_bk(7.0) >= 1.85))
    for s, ok_ in out: print(('OK   ' if ok_ else 'FEIL ') + s)
    return all(o for _, o in out)


SHOTS = [('bow3q', (17.5, -12.5, 5.2), (5.0, 0, 3.4), 35), ('stern3q', (-8.5, 11.0, 6.2), (4.0, 0, 3.4), 35), ('side', (5.0, -21, 2.6), (5.0, 0, 3.6), 35),
         ('above', (13.0, -9.0, 15.0), (5.0, 0, 3.0), 35), ('deck', (1.5, -4.5, 6.6), (5.5, 0.5, 3.0), 24)]
ZC = z_deck(3.0)
K5 = ((0.40, -1.20, z_deck(0.4) + 1.70), (5.0, -0.6, z_deck(5.0) + 0.7))
EYE = (SKIP[0], SKIP[1], WH_FLOOR + 0.05 + EYE_H)
CLOSE = [('c_helm', (6.85, -0.10, 5.10), (7.95, -0.60, 4.15), 30, False, False), ('c_wh', (11.5, -5.6, 5.4), (7.2, -0.4, 4.3), 30, True, False),
         ('c_stern', (-4.0, -3.0, 4.6), (0.3, 0, 3.0), 32, True, False), ('c_bow', (13.6, -3.0, 4.6), (10.0, 0, 3.0), 30, False, False),
         ('c_aperture', (0.6, -3.6, 0.2), (0.6, 0, 0.1), 30, False, False), ('c_work', (1.4, -1.3, 4.1), (4.8, -0.6, 2.7), 30, False, False),
         ('c_shelter', (4.6, -7.5, 3.8), (4.4, -1.6, 3.6), 32, True, False), ('c_rig', (9.5, -7.0, 8.0), (4.5, 0.5, 7.0), 35, True, False),
         ('c_free', (3.0, -4.6, 2.6), (3.0, -1.9, 2.3), 30, True, False), ('c_steps', (5.0, -3.5, 4.8), (6.3, -1.7, 3.0), 32, True, False),
         ('K6p', (5.2 + 31.0, 24.0, 4.4), (5.2, 0, 2.3), 100, True, True),
         # (round 2) what was reckoned but never shown: the underwater body (keel, shoe, propeller, rudder) from the quarter and the bow
         # without the water, the lanterns lit near; and the new work: the aft deck from over the stern, the winch, the forecastle
         ('c_under', (-4.6, -6.2, -1.1), (2.6, 0, 1.25), 35, False, False), ('c_under_f', (14.5, -8.5, -1.2), (5.5, 0, 0.9), 35, False, False),
         ('c_night', (21.0, -14.0, 6.0), (5.0, 0, 5.3), 35, True, True), ('c_night_aft', (-14.0, 11.0, 6.0), (4.0, 0, 5.3), 35, True, True),
         ('c_aftdeck', (-3.4, -1.6, 9.2), (2.4, -0.3, 2.3), 26, False, False), ('c_winch', (-0.5, -2.4, 5.5), (1.4, 0, 4.6), 40, True, False),
         ('c_fore', (11.9, -2.4, 6.2), (9.3, -0.2, 3.6), 32, True, False),
         # (round 4) the rudder and the heel from the side, the anchor in the roller, the wipers, the vents and the bitts, the knee
         # under the shelter roof's starboard corner where the post stood, the stern light at night from right astern
         ('c_rudder', (0.35, -4.6, 0.25), (0.35, 0, 0.25), 32, False, False), ('c_anchor', (12.9, -2.6, 4.5), (10.8, 0, 3.75), 28, True, False),
         ('c_wipers', (12.2, -1.2, 5.6), (8.7, 0.1, 4.6), 30, True, False), ('c_vents', (10.9, -2.3, 4.9), (9.5, -0.2, 3.6), 30, True, False),
         ('c_knee', (0.9, -3.6, 4.0), (2.7, -1.9, 4.2), 32, True, False), ('c_night_stern', (-19.0, 0.0, 5.2), (3.0, 0, 4.6), 35, True, True)]

def main():
    os.makedirs(OUT, exist_ok=True)
    if 'check' in sys.argv: sys.exit(0 if check() else 1)
    check()
    reset(); colours()
    solids, glass = build(True)
    join(solids, 'BOAT0'); join(glass, 'GLASS0')
    if 'fast' not in sys.argv and 'dry' not in sys.argv: beauty(OUT, 'ma', WLE, SHOTS)
    ex = {'frame': 'kystfiske: x starboard, y up from the waterline, z aft; metres', 'type': 'breisjark', 'name': 'Sjark 36 fot med bakk og ly', 'len': L, 'beam': BEAM, 'draft': DRAFT,
          'anchors': anchors()}
    export_boat(build, to_game, to_game_n, OUT, 'malo36.glb', os.path.join(ROOT, 'src', 'data', 'boat-malo36.b64'), ex,
                side=(os.path.join(ROOT, 'src', 'data', 'boat-malo36-side.b64'), 5.2, 4.5, 12.4), dry='dry' in sys.argv)


if __name__ == '__main__':
    main()
