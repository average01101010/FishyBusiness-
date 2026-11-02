"""The coastal vessel with cabins (kyst15, «Kystbåt 14,99 m med lugarer»): a modern Norwegian shelter-decker built to the 14.99 m
limit, red and white, after the three pictures Jonas showed on 06.10.2026 of a red and white 15 m boat (from the bow, the side and the
port quarter; they are not in the repository, and no drawing is known). The game's size stands (VESSELS.kyst15: 14.99 x 6.6 m, 3.0 m
draft, 75 t, glassfibre).

Rebuilt 02.11.2026 after the pilot boat's way of working (docs/skipsmodeller/kyst15-grunnlag.md, sulebas-bygging.md; malo36.py and
havsjark35.py the template for the code, not the shape). The old hull was two loose grids and a transom ladder with the deadwood a body
of its own under it; its sections were superellipses that weighed 121 t against the data's 75 t (the game's empty boat, Jonas
02.11.2026: the waterline is the empty boat's); the hauling station was a skipped band of cells, the transom a flat face with knife edges
(M4), the riding sail a board that stood in port too (M5). Now the hull is ONE surface: both sides over the deadwood keel (the section
starts on the keel's underside), the transom with rounded corners in plan, the white rubbing strake, the shelter deck's low bulwark and
cap, its inside and the shelter deck itself share their points (Mesh). Openings are real holes, cut with a boolean and lined: the
hauling station, the companion's well in the shelter deck, the hawse pipes, the portholes, the vents, the freeing slots. Nothing lies in
the plane of anything else.

The arrangement (Jonas 02.11.2026: the shelter deck to the stern; the wheelhouse the full width): the working deck under the shelter deck,
open to starboard in the hauling station where the hauler, the jigging machines, the bleeding tub, the gutting table and the hold's
hatch are (kap. 19: the places first); a companion ladder from it up through the shelter deck; the wheelhouse forward on the shelter deck
the full width with its door aft to starboard and a door in its port corner to the foredeck; the windlass and the hawse pipes forward; the
crane aft to port (the game's kit, kit.crane), the mizzen at the stern with its steadying sail set at sea and furled in port (parts
`sail` and `sailf`, drawSail). Nothing that can be bought is modelled in (19.10.2026): no hauler, no tubs, no liferaft, no radar, no
ring buoys, no crane; the plotter, VHF and AIS are standard (VESSELS.kyst15.std) and are part of her, as is her own gutting table
(work.own). No maker's or yard's name anywhere (CLAUDE.md, B20).

    pip install bpy==4.5.4   (Python 3.11)
    python3 tools/boats/kyst15.py            -> src/data/boat-kyst15.b64 (+ the side picture), renders in tools/boats/out/
    python3 tools/boats/kyst15.py fast       -> the same without the renders
    python3 tools/boats/kyst15.py fast dry   -> no renders, the GLB only in tools/boats/out
    python3 tools/boats/kyst15.py check      -> the checks against the data, the rules and the game's demands only

Frame: x forward from the transom's aft face, y to port, z up from the keel's underside; the waterline is z = WL = 3.0 (the data's
draft: the keel's underside is the deepest point)."""
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy, bmesh
from bpyutil import *
import bpyutil
import fittings as F
from mathutils import noise

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE)); OUT = os.path.join(HERE, 'out')
L = 14.99; BEAM = 6.6; DRAFT = 3.0; DISP = 75.0              # VESSELS.kyst15 (disp: the empty boat, the game adds the load on it)
WL = 3.0; XA = 0.0; XF = 14.99; XM = (XA + XF) / 2           # XM the game's midship (as the old model: kit, JIG_Z, anchors)
ZMD = 3.90                   # the working deck under the shelter deck (0.90 over the water, as the old model's)


# ---------- the lines (chosen: no drawing; the old model's heights over the water kept, the bottom drawn new for 75 t), read smooth ----------
def ss(a, b, x): t = max(0.0, min(1.0, (x - a) / (b - a))); return t * t * (3 - 2 * t)
_PC = {}
def pchip(tab, x):
    """a smooth curve through the table's points (monotone cubic, Fritsch-Carlson; hurtig11.py, sulebas-bygging kap. 17)"""
    k = id(tab)
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

# the body's bottom on the centreline (the keel's root aft and forward of the deadwood), the forefoot and the raked stem (x grows along it)
LOW = [(XA, 2.88), (0.6, 2.42), (1.4, 1.86), (2.5, 1.34), (3.6, 1.08), (5.0, 0.98), (8.0, 0.96), (10.0, 1.06), (11.4, 1.34), (12.4, 1.74),
       (13.15, 2.30), (13.65, 2.86), (14.0, 3.45), (14.35, 4.22), (14.65, 5.08), (14.85, 5.90), (XF, 6.96)]
def z_low(x): return pchip(LOW, x)
# the deadwood keel's underside, falling aft to the shoe (the deepest point, the data's 3.0 m), running into the forefoot at X_KF
X_KA, X_KF = 1.75, 11.4
KEEL = [(X_KA, 0.02), (3.0, 0.07), (5.0, 0.18), (7.0, 0.36), (9.0, 0.66), (10.4, 1.06), (X_KF, z_low(X_KF))]
def kb(x):
    if x > X_KF: return z_low(x)
    k = pchip(KEEL, x); return k + (z_low(x) - k) * ss(10.0, X_KF, x)    # (blended into the forefoot so the profile has no kink at X_KF)
def keel_t(x): return pchip([(X_KA, 0.26), (2.4, 0.30), (8.0, 0.30), (X_KF, 0.22)], x)
# the shelter deck at the side and the top of its bulwark (the old model's 3.05 m and 3.15 m over the water aft, the bulwark rising to 0.6 m
# round the foredeck, the stem's top 3.9 m over the water)
SDK = [(XA, 6.10), (4.0, 6.05), (8.0, 6.05), (11.0, 6.10), (13.0, 6.20), (XF, 6.30)]
def z_sd(x): return pchip(SDK, x)
def z_cap(x, sg=1): return z_sd(x) + 0.26 + 0.34 * ss(11.9, 14.2, x)
# the half-breadth at the bulwark's top, moulded: the transom's corners rounded in plan (M4), the bow drawn in to the stem
HB = [(XA, 2.62), (0.15, 2.86), (0.45, 3.04), (1.0, 3.17), (2.0, 3.25), (3.5, 3.29), (6.0, 3.30), (8.5, 3.29), (10.0, 3.22), (11.0, 3.10),
      (12.0, 2.86), (12.8, 2.52), (13.5, 2.05), (14.1, 1.48), (14.55, 0.88), (14.85, 0.36), (XF, 0.0)]
def hb(x): return max(0.0, pchip(HB, x))
# the section: its deadrise, the flare and the fullness of the bilge (weighed in check() against the 75 t)
DR = [(XA, 4), (1.5, 7), (3.5, 10), (7.0, 12), (9.5, 15), (11.0, 20), (12.2, 29), (13.2, 44), (14.0, 60), (XF, 70)]
FL = [(XA, 2), (3.0, 2), (8.0, 2.5), (10.5, 5), (12.0, 9), (13.2, 15), (14.2, 22), (XF, 26)]
FULL = [(XA, 0.66), (1.5, 0.69), (3.5, 0.72), (8.0, 0.72), (10.5, 0.68), (12.0, 0.62), (13.2, 0.56), (XF, 0.48)]
# the white rubbing strake, the red hull's top (white over it), the bottom paint and the white boot top, rising 12 mm a metre forward
RUB = [(XA, 4.32), (6.0, 4.30), (9.0, 4.34), (11.0, 4.44), (12.6, 4.64), (13.8, 4.90), (XF, 5.20)]
def z_rub(x): return pchip(RUB, x)
RUBH, RUBW = 0.06, 0.06
RED = [(XA, 4.96), (6.0, 4.92), (9.0, 4.96), (11.0, 5.08), (12.6, 5.34), (13.8, 5.64), (XF, 5.98)]
def z_red(x): return pchip(RED, x)
Z_AF = WL - 0.03; Z_BT = WL + 0.10; SLB = 0.012
def paint_line(x, z0): return z0 + SLB * (x - XM)


# ---------- the sections (malo36.py: the body as one cubic, the keel in the section) ----------
def vline(x, sg=1):
    """the body's half-section at x from the centreline (the bottom of the body) to the bulwark's top, as (y, z): a cubic from the keel's
    root out along the deadrise and round the bilge up along the flare to the sheer, its control points pulled toward the corner by the
    fullness; the corner held soft where the bow's lines meet under the keel (malo36.py vline)"""
    zl = z_low(x); zs = z_cap(x, sg); h = hb(x); n = 48
    if h < 1e-4 or zs - zl < 1e-4: return [(0.0, zl), (0.0, zs)]
    dr = math.radians(pchip(DR, x)); fl = math.radians(pchip(FL, x))
    d1 = (math.cos(dr), math.sin(dr)); d2 = (-math.sin(fl), -math.cos(fl))
    den = d1[0] * d2[1] - d1[1] * d2[0]
    s_ = (h * d2[1] - (zs - zl) * d2[0]) / den if den < -1e-6 else -1e9
    k_ = 0.08; s_ = k_ * math.log1p(math.exp(min(60.0, s_ / k_))) if s_ / k_ > -60 else 1e-12
    cap = (zs - zl) * 0.999 / max(1e-6, d1[1]); s_ = (max(s_, 1e-12) ** -4 + cap ** -4) ** -0.25
    C_ = (d1[0] * s_, zl + d1[1] * s_)
    lb = math.hypot(h - C_[0], zs - C_[1]); a = pchip(FULL, x)
    P0 = (0.0, zl); P1 = (d1[0] * s_ * a, zl + d1[1] * s_ * a); P3 = (h, zs); P2 = (h + d2[0] * lb * a, zs + d2[1] * lb * a)
    P = []
    for k in range(n + 1):
        t = (k / n) ** 1.15; u = 1 - t
        P.append((u ** 3 * P0[0] + 3 * u * u * t * P1[0] + 3 * u * t * t * P2[0] + t ** 3 * P3[0], u ** 3 * P0[1] + 3 * u * u * t * P1[1] + 3 * u * t * t * P2[1] + t ** 3 * P3[1]))
    out = [P[0]]
    for q in P[1:]: out.append((q[0], max(q[1], out[-1][1] + 1e-7)))
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
    return pchip([(X_KF, keel_t(X_KF) * 0.36), (13.0, 0.05), (XF, 0.035)], x)
def wroot(x): return wk(x) * 1.6 if x <= X_KF else wk(x)

NKB, NF = 4, 3
_S = {}
def section(x, sg=1, fine=True):
    """the whole half-section at x as (y, z, kind) from the keel's underside on the centreline to the bulwark's top; the counts never
    change (points collapse where a band is empty). Kinds: 'k' the keel, 'f' the fillet at its root, 'b' the bottom, 't' the red topside,
    'r' the rubbing strake, 'u' the white upper side, 's' the bulwark's top"""
    key = (round(x, 5), sg, fine)
    if key in _S: return _S[key]
    P = vline(x, sg); zl = P[0][1]; top = P[-1][1]; out = []
    nk = NKB if fine else 1; nf = NF if fine else 1
    if x >= X_KA:
        b = kb(x); f = min(1.0, (x - X_KA) / 0.10); ww = wk(x) * f; wr = wroot(x) * f
        if x <= X_KF:
            g = ss(X_KF, X_KF - 1.4, x); wr = ww + (wr - ww) * g
            fw = 0.16 * f * g; zc = z_on(P, wr); zt = max(b + 0.06 * g, zc - 0.12 * g); e1, e2 = 0.016 * g, (0.045 if fine else 0.02) * g
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
    nb, nt = (16, 6) if fine else (4, 2)
    zw = cl(WL + 0.25); out += [(yy, zz, 'b') for yy, zz in along(body, z0, zw, nb)]
    zr0 = cl(z_rub(x) - RUBH); out += [(yy, zz, 't') for yy, zz in along(body, zw, zr0, nt)]
    fade = 1.0 - ss(14.4, 14.75, x)
    for dz, off in (((-0.054, 0.38), (-0.038, 0.74), (-0.016, 0.97), (0.016, 0.97), (0.038, 0.74), (0.054, 0.38), (RUBH, 0.0)) if fine else ((0.0, 1.0), (RUBH, 0.0))):
        zq = cl(z_rub(x) + dz); yy, zz = at_z(body, zq); out.append((yy + RUBW * off * fade, zz, 'r' if off > 0 else 't'))
    zr1 = cl(z_rub(x) + RUBH); zrd = cl(z_red(x))
    out += [(yy, zz, 't') for yy, zz in along(body, zr1, zrd, 3 if fine else 1)]
    out += [(yy, zz, 'u') for yy, zz in along(body, zrd, top, 7 if fine else 2)[:-1]]
    out.append((P[-1][0], top, 's'))
    _S[key] = out; return out

def y_at(x, z, sg=1):
    """the outside's half-breadth at x and height z (the body; the keel under its root)"""
    P = vline(x, sg)
    if z <= P[0][1]: return wk(x) if x >= X_KA else 0.0
    return at_z(P, z)[0]

# the hauling station's opening in the starboard side (x from, to; its sill and its head): stations at its ends so the cut lands on rows
OP0, OP1 = 4.60, 7.80
def stations(fine=True):
    sp = [XA, X_KA - 0.002, X_KA, X_KA + 0.05, X_KA + 0.10, X_KF, OP0, OP1]
    if fine:
        xs = [XA + 0.02, XA + 0.05, XA + 0.09, XA + 0.14, XA + 0.20, XA + 0.27] + [0.35 + 0.08 * i for i in range(176)] + [14.43 + 0.04 * i for i in range(14)]
        sp += stem_stations(lambda x: z_low(x) if x > X_KF else kb(x), [Z_AF, Z_BT, lambda x: z_rub(x) - RUBH, lambda x: z_rub(x) + RUBH, z_red], 11.0, XF - 0.012)
    else:
        xs = [0.3, 0.9, 1.6, 2.6, 4.0, 5.6, 7.0, 8.6, 10.0, 11.2, 12.2, 13.0, 13.6, 14.1, 14.5, 14.8]
    xs = [x for x in xs if all(abs(x - s) > 0.01 for s in sp)] + sp + [XF - 0.006, XF]
    return sorted(set(round(x, 5) for x in xs if XA <= x <= XF))


# ---------- colours: signal red, white upper works and strake, white boot top, black antifouling, a grey deck (paint zones: 1 the hull,
# 2 the strake and the boot top, 3 the white upper works and the superstructure, 4 the decks; 10j-paint.js) ----------
C = {}
def colours():
    w = lambda n, rgb, g=0.4, z=0, metal=0.0, emit=0.0: C.__setitem__(n, mat(n, rgb, g, zone=z, metal=metal, emit=emit))
    w('af', (0.07, 0.07, 0.075), 0.15); w('boot', (0.92, 0.92, 0.90), 0.55, 2); w('hull', (0.72, 0.05, 0.04), 0.6, 1)
    w('strake', (0.93, 0.93, 0.91), 0.55, 2); w('white', (0.92, 0.92, 0.90), 0.5, 3); w('cap', (0.88, 0.88, 0.86), 0.45, 3)
    w('roof', (0.82, 0.83, 0.82), 0.3, 3); w('inner', (0.84, 0.85, 0.84), 0.3); w('deck', (0.42, 0.44, 0.44), 0.12, 4); w('nonslip', (0.39, 0.41, 0.41), 0.06, 4)
    w('steel', (0.76, 0.78, 0.80), 0.85, 0, 0.85); w('chrome', (0.86, 0.87, 0.89), 0.95, 0, 0.9); w('alu', (0.72, 0.74, 0.76), 0.6, 0, 0.7)
    w('mast', (0.90, 0.91, 0.90), 0.55, 3); w('dark', (0.10, 0.11, 0.12), 0.25); w('black', (0.04, 0.04, 0.05), 0.4); w('rubber', (0.05, 0.05, 0.06), 0.2)
    w('frame', (0.07, 0.07, 0.08), 0.45); w('screen', (0.03, 0.05, 0.07), 0.9); w('bezel', (0.10, 0.10, 0.11), 0.5); w('cush', (0.15, 0.16, 0.19), 0.35)
    w('switch', (0.20, 0.21, 0.22), 0.4); w('board', (0.24, 0.25, 0.27), 0.35); w('cabin', (0.05, 0.05, 0.06), 0.2); w('sole', (0.30, 0.31, 0.32), 0.2)
    w('prop', (0.70, 0.52, 0.27), 0.8, 0, 0.9); w('anode', (0.55, 0.56, 0.55), 0.2); w('wood', (0.58, 0.38, 0.20), 0.3); w('red', (0.72, 0.18, 0.08), 0.5)
    w('rope2', (0.20, 0.42, 0.62), 0.2); w('hose', (0.10, 0.36, 0.20), 0.4); w('fender', (0.06, 0.06, 0.07), 0.3); w('orange', (0.95, 0.38, 0.06), 0.45)
    w('sail', (0.62, 0.11, 0.08), 0.15); w('sailedge', (0.42, 0.07, 0.05), 0.2); w('sailseam', (0.53, 0.09, 0.07), 0.15)
    w('lampR', (0.90, 0.10, 0.08), 0.8, 0, 0, 0.5); w('lampG', (0.10, 0.80, 0.25), 0.8, 0, 0, 0.5); w('lampW', (1.0, 0.97, 0.88), 0.8, 0, 0, 0.5)
    w('lens', (0.95, 0.94, 0.85), 0.9)
    C['glass'] = mat('glass', (0.05, 0.08, 0.11), 0.95)


# ---------- the wear: per corner, so it runs across faces (B16; 2012, gelcoat, 14 years) ----------
def n3(x, y, z=0.0): return noise.noise(V((x, y, z)))
def toward(m, rgb, k):
    base = m['rgb']; return [1 + (rgb[i] / max(base[i], 1e-3) - 1) * k for i in range(3)]

EXH_W = (8.6, -1, 0.34)      # the engine's cooling water outlet (x, side, height over the water)
BILGE = (6.0, 1, 0.42)       # the bilge pump's outlet (port: the hauling station is to starboard)
def wear(p, m, n):
    x, y, z = p; nm = m.name; side = 1 if y > 0 else -1
    if nm == 'hull':
        g = 0.97 + 0.05 * n3(x * 3.0, z * 6.0, side * 1.3)
        g *= 1 - 0.10 * ss(0.30, 0.0, z - paint_line(x, Z_BT))
        g *= 1 - 0.08 * ss(0.3, 0.75, n3(x * 5.0, z * 2.0, side * 3.3)) * ss(0.4, 0.0, abs(z - z_rub(x) + 0.3)) * (abs(n.y) > 0.5)   # scuffs from quays under the strake
        for (xo, so, ho), k in ((EXH_W, 0.25), (BILGE, 0.15)):
            if side == so and z < WL + ho:
                g *= 1 - k * ss(0.02 + (WL + ho - z) * 0.04, 0.004, abs(x - xo)) * ss(WL, WL + 0.12, z)
        return [g, g, g]
    if nm == 'af':
        v = 0.88 + 0.12 * n3(x * 2.5, z * 6.0, y * 2.0)
        g = ss(WL - 0.10, WL - 0.02, z) * (0.5 + 0.5 * ss(-0.3, 0.4, n3(x * 3.0, side * 1.3, 4.1)))
        return [v * (1 + 0.6 * g), v * (1 + 1.0 * g), v * (1 + 0.5 * g)]
    if nm in ('boot', 'strake'):
        v = 0.94 + 0.06 * n3(x * 4.0, z * 9.0, side) - 0.10 * ss(WL + 0.06, WL - 0.02, z); return [v, v, v]
    if nm in ('white', 'roof', 'inner', 'mast', 'cap'):
        v = 0.95 + 0.05 * n3(x * 5.0, y * 5.0, z * 5.0)
        if nm == 'inner': v -= 0.08 * ss(0.15, 0.0, z - z_sd(x))
        c = toward(m, (0.55, 0.42, 0.28), 0.12 * ss(0.6, 0.9, n3(x * 7.0, y * 7.0, z * 7.0 + 0.5)))
        return [c[i] * v for i in range(3)]
    if nm in ('deck', 'nonslip', 'sole'):
        v = 0.92 + 0.10 * n3(x * 5.0, y * 5.0, 1.0)
        v *= 1 - 0.12 * ss(0.9, 0.0, math.hypot(x - 7.0, y + 2.6)) - 0.08 * ss(0.8, 0.0, math.hypot(x - 5.3, y + 1.8))   # worn where they work
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


# ---------- the hull: the outside over the keel, the transom, the shelter deck's bulwark, its cap and inside, the shelter deck ----------
CAP = 0.07
TT = 0.07                    # the transom's thickness: the deck and the bulwark's inside start this far forward of its outside
def ysh(x, sg=1): return section(x, sg)[-1][0]
def ycap(x, sg=1): return max(0.0, ysh(x, sg) - CAP)
def ybw(x, sg=1): return max(0.0, y_at(x, z_sd(x), sg) - 0.065)
def camber(x, y):
    e = max(0.3, ybw(x)); return 0.10 * (1 - min(1.0, (y / e) ** 2))
def sdeck(x, y): return z_sd(x) + camber(x, y)

HULL_MAT = {'k': 'af', 'f': 'hull', 'b': 'hull', 't': 'hull', 'r': 'strake', 'u': 'white', 's': 'white'}
HULL_KIND = {'r': 3, 'u': 4, 's': 4}
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
                M.f(q, C[HULL_MAT[k]], out, HULL_KIND.get(k, 1))
    # the transom: strips across between the first station's two sides, facing aft
    Tp, Ts = S[(xs[0], 1)], S[(xs[0], -1)]
    for j in range(len(Tp) - 1):
        q = [(Tp[j][0], Tp[j][1], Tp[j][2]), (Ts[j][0], -Ts[j][1], Ts[j][2]), (Ts[j + 1][0], -Ts[j + 1][1], Ts[j + 1][2]), (Tp[j + 1][0], Tp[j + 1][1], Tp[j + 1][2])]
        k = Tp[j][3]; M.f(q, C[HULL_MAT[k]] if k in 'rus' else C['hull'], (-1, 0, 0), HULL_KIND.get(k, 1))
    # ---- the shelter deck's bulwark: the cap, its inside down to the deck, the deck across (in rows: a big flat face goes dark, kap. 19) ----
    ND = 14 if fine else 2
    def edge(x, sg):
        s = z_cap(x, sg); zd = z_sd(x)
        return [(x, sg * ysh(x, sg), s), (x, sg * ycap(x, sg), s + 0.012), (x, sg * (ycap(x, sg) - 0.006), s - 0.03), (x, sg * ybw(x, sg), zd)]
    def drow(x):
        e = ybw(x); zd = z_sd(x)
        mid = [(x, e * (1 - 2 * i / ND), zd + camber(x, e * (1 - 2 * i / ND))) for i in range(1, ND)]
        return edge(x, 1) + mid + list(reversed(edge(x, -1)))
    dxs = [x for x in xs if x >= XA + TT - 1e-9 and ysh(x) > 0.02]
    if dxs[0] > XA + TT + 1e-6: dxs = [XA + TT] + dxs
    def em(j, n): return C['cap'] if j in (0, 1, n - 3, n - 2) else C['inner'] if j in (2, n - 4) else None
    def eo(j, n): return (0, 0, 1) if j in (0, 1, n - 3, n - 2) else (0, -1, 0) if j == 2 else (0, 1, 0) if j == n - 4 else (0, 0, 1)
    D = [drow(x) for x in dxs]; n = len(D[0])
    M.strip(D, lambda i, j: em(j, n) or (C['nonslip'] if dxs[i] > WXF + 0.1 else C['deck']), lambda i, j: eo(j, n))
    last = D[-1]; M.f([last[0], last[n - 1]] + [last[n // 2]], C['cap'], (0, 0, 1))
    # the transom's top: the cap from the outside's top aft of TT in to the inside's edge, and the inside down to the deck
    r0 = D[0]; tops = [x for x in xs if x < XA + TT - 1e-9]
    port = [(S[(x, 1)][-1][0], S[(x, 1)][-1][1], S[(x, 1)][-1][2]) for x in tops]
    M.f(list(reversed(port)) + [(p_[0], -p_[1], p_[2]) for p_ in port] + [r0[n - 1], r0[n - 2], r0[1], r0[0]], C['cap'], (0, 0, 1))
    M.f([r0[1], r0[2], r0[3], r0[n - 4], r0[n - 3], r0[n - 2]], C['inner'], (1, 0, 0))
    return S


# ---------- the places of the work (kap. 19: laid in before the walls): the hauling station under the shelter deck to starboard ----------
SILL = ZMD + 0.95            # the opening's sill: the bulwark's top at the work, 0.95 m over the working deck (jigRail: 0.35-1.3)
HEAD = 5.82                  # the opening's head, under the shelter deck
YB = -0.90                   # the station's inboard wall
CEIL = 5.94                  # the station's ceiling (the shelter deck's underside, 2.04 m over the working deck)
HXX = 7.30                   # the hauler at the opening's forward end, on the sill
TUB = (6.55, -2.35)          # the bleeding tub (the game's) just aft of the fisher at the hauler
TABLE = (4.78, 5.78, -1.52, -0.96)   # her own gutting table along the inboard wall aft, across the hatch from the work at the side (B6)
HOLD = (5.30, 6.10, -2.30, -1.70)    # the hold's hatch between the tub and the table: the gutted fish go down on ice
LADDER = (7.02, 7.72, -1.56, -0.96)  # the companion ladder up to the shelter deck at the inboard forward corner, its well over it
IDOOR = (6.10, 6.80)         # the door in the inboard wall into the closed working deck
JIGX = [4.95, 5.65, 6.35]    # the jigging machines on the sill aft of the hauler (13-instruments.js JIG_Z)
def ybi(x): return y_at(x, ZMD, -1) - 0.07           # the hull's inside at the station (at the deck, where the side is narrowest: it flares out above)


# ---------- the openings: real holes, cut with a boolean and lined ----------
PORTS = [8.30, 9.05, 9.80]   # the cabins' portholes in the white side under the wheelhouse, both sides
PORT_Z = 5.42; PORT_R = 0.12
VENTS = [(2.0, 2.7), (11.0, 11.6)]   # the engine room's air (aft) and the forepeak's (louvred, both sides)
VENT_Z = (5.15, 5.45)
HAWSE = (14.12, 5.82); HAWSE_R = 0.17        # the hawse pipes' mouths high in the bow, forward of the registration mark (bower)
WELL = (LADDER[0] - 0.02, LADDER[1] + 0.02, LADDER[2] - 0.02, LADDER[3] + 0.02)
FREE = [(0.8, 0.5), (2.6, 0.5), (4.4, 0.5), (6.2, 0.5), (8.0, 0.5)]   # the freeing slots in the shelter deck's bulwark at the deck
FREE_F = [(12.9, 0.45), (13.6, 0.40)]                           # and round the foredeck
EXH_R = 0.05; BILGE_R = 0.022
def rr_pts(cx, cy, w, h, r, n=4): return rrect(cx, cy, w, h, max(0.004, min(r, w / 2 - 0.002, h / 2 - 0.002)), n=n)
def circle(r, n=16): return [(r * math.cos(2 * math.pi * k / n), r * math.sin(2 * math.pi * k / n)) for k in range(n)]

def cutters():
    out = []
    # the hauling station: through the starboard side from the sill to the head
    out.append((((OP0 + OP1) / 2, -(y_at(6.2, 5.3, -1)), (SILL + HEAD) / 2), (1, 0, 0), (0, 0, 1), rr_pts(0, 0, OP1 - OP0, HEAD - SILL, 0.10), 0.35))
    for sg in (1, -1):
        for x in PORTS: out.append(((x, sg * y_at(x, PORT_Z, sg), PORT_Z), (1, 0, 0), (0, 0, 1), circle(PORT_R, 20), 0.10))
        for x0, x1 in VENTS: out.append((((x0 + x1) / 2, sg * y_at((x0 + x1) / 2, sum(VENT_Z) / 2, sg), sum(VENT_Z) / 2), (1, 0, 0), (0, 0, 1), rr_pts(0, 0, x1 - x0, VENT_Z[1] - VENT_Z[0], 0.05), 0.10))
        out.append(((HAWSE[0], sg * y_at(HAWSE[0], HAWSE[1], sg), HAWSE[1]), (1, 0, 0), (0, 0, 1), circle(HAWSE_R, 18), 0.10))
        for x0, l in FREE + FREE_F:
            xc = x0 + l / 2; zd = z_sd(xc); out.append(((xc, sg * (ybw(xc, sg) + 0.03), zd + 0.055), (1, 0, 0), (0, 0, 1), rr_pts(0, 0, l, 0.09, 0.03), 0.16))
    # the companion's well through the shelter deck
    x0, x1, y0, y1 = WELL; out.append((((x0 + x1) / 2, (y0 + y1) / 2, z_sd(7.4) + 0.05), (1, 0, 0), (0, 1, 0), rr_pts(0, 0, x1 - x0, y1 - y0, 0.04), 0.20))
    for x, sg, h, r in ((EXH_W[0], EXH_W[1], EXH_W[2], EXH_R), (BILGE[0], BILGE[1], BILGE[2], BILGE_R)):
        out.append(((x, sg * y_at(x, WL + h, sg), WL + h), (1, 0, 0), (0, 0, 1), circle(r, 16), 0.05))
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
    for sg in (1, -1):
        # the portholes: the reveal, the glass, the cabin dark behind, a stainless ring outside
        for x in PORTS:
            on = lambda p, q, d: V((x + p, sg * (y_at(x + p, PORT_Z + q, sg) - d), PORT_Z + q))
            tube(A, [on(p, q, 0.0) for p, q in circle(PORT_R, 20)], (0, -sg, 0), 0.08, C['white'])
            G.poly([on(p, q, 0.04) for p, q in circle(PORT_R, 20)], C['glass'], (0, sg, 0))
            A.poly([on(p, q, 0.08) for p, q in circle(PORT_R, 20)], C['cabin'], (0, sg, 0))
            F.atorus(A, (x, sg * (y_at(x, PORT_Z, sg) + 0.008), PORT_Z), (0, sg, 0), PORT_R + 0.016, 0.016, lambda a: C['steel'], seg=24, rseg=5)
        # the vents: the reveal, dark behind, louvres sloping down outward
        for x0, x1 in VENTS:
            xc = (x0 + x1) / 2; zc = sum(VENT_Z) / 2
            o = rr_pts(xc, zc, x1 - x0, VENT_Z[1] - VENT_Z[0], 0.05, 3)
            tube(A, [V((p, sg * (y_at(p, q, sg) + 0.001), q)) for p, q in o], (0, -sg, 0), 0.12, C['white'], C['black'])
            if fine:
                for k in range(4):
                    zz = VENT_Z[0] + 0.05 + (VENT_Z[1] - VENT_Z[0] - 0.10) * k / 3; yy = sg * (y_at(xc, zz, sg) - 0.05)
                    beam(A, (x0 + 0.03, yy, zz), (x1 - 0.03, yy, zz), 0.008, 0.07, C['white'], up=(0, -sg * 0.7, 0.7))
        # the hawse pipes: the mouth lined into the pipe, a stainless rim (the anchor is the game's, stowed in it: bower)
        hx, hz = HAWSE; ring = [V((hx + p, sg * (y_at(hx + p, hz + q, sg) + 0.001), hz + q)) for p, q in circle(HAWSE_R, 18)]
        tube(A, ring, (-0.45, -sg, 0.55), 0.30, C['steel'], C['black'])
        F.atorus(A, (hx, sg * (y_at(hx, hz, sg) + 0.012), hz), (0, sg, 0), HAWSE_R + 0.02, 0.02, lambda a: C['steel'], seg=20, rseg=5)
        # the freeing slots: through the bulwark at the deck, open
        for x0, l in FREE + FREE_F:
            xc = x0 + l / 2; zd = z_sd(xc); o = rr_pts(xc, zd + 0.055, l, 0.09, 0.03, 3)
            ring = [V((p, sg * (y_at(p, q, sg) + 0.001), q)) for p, q in o]
            tube(A, ring, (0, -sg, 0), max(0.03, y_at(xc, zd + 0.05, sg) - ybw(xc, sg) + 0.002), C['inner'])
    for (xb, sb, hb_), r in ((EXH_W, EXH_R), (BILGE, BILGE_R)):
        zb_ = WL + hb_
        ring = [(xb + p, sb * (y_at(xb + p, zb_ + q, sb) + 0.001), zb_ + q) for p, q in circle(r, 12)]
        tube(A, ring, (0, -sb, 0), 0.05, C['dark'], C['black'])
        F.atorus(A, (xb, sb * (y_at(xb, zb_, sb) + 0.006), zb_), (0, sb, 0), r + 0.008, 0.006, lambda a: C['steel'], seg=14, rseg=4)
    # the companion's well: lined down to the station's ceiling, a coaming round it on the shelter deck with a rail
    x0, x1, y0, y1 = WELL; o = rr_pts((x0 + x1) / 2, (y0 + y1) / 2, x1 - x0, y1 - y0, 0.04, 3)
    zt = max(sdeck(x, y) for x, y in o) + 0.30
    ring = [(x, y, sdeck(x, y) - 0.03) for x, y in o]
    tube(A, ring, (0, 0, -1), max(0.02, min(p[2] for p in ring) - CEIL + 0.01), C['inner'])
    F.loft(A, [[(x, y, sdeck(x, y) - 0.03) for x, y in o], [(x, y, zt) for x, y in o]], lambda i: C['white'], cap0=False, cap1=False, out=lambda mid, cc: V((mid.x - cc.x, mid.y - cc.y, 0)))
    oi = rr_pts((x0 + x1) / 2, (y0 + y1) / 2, x1 - x0 - 0.08, y1 - y0 - 0.08, 0.02, 3)
    F.loft(A, [[(x, y, zt) for x, y in oi], [(x, y, zt - 0.25) for x, y in oi]], lambda i: C['white'], cap0=False, cap1=False, out=lambda mid, cc: V((cc.x - mid.x, cc.y - mid.y, 0)))
    for k in range(len(o)):
        a, b = o[k], o[(k + 1) % len(o)]; c_, d_ = oi[(k + 1) % len(oi)], oi[k]
        A.poly([(a[0], a[1], zt), (b[0], b[1], zt), (c_[0], c_[1], zt), (d_[0], d_[1], zt)], C['white'], (0, 0, 1))
    if fine:
        # the rail round the well, open at its aft end where the ladder comes up
        for x, y in ((x0 + 0.03, y0 + 0.03), (x1 - 0.03, y0 + 0.03), (x1 - 0.03, y1 - 0.03)): acyl(A, (x, y, zt), (x, y, zt + 0.72), 0.018, s, seg=8)
        F.pipe(A, [(x0 + 0.03, y0 + 0.03, zt + 0.72), (x1 - 0.03, y0 + 0.03, zt + 0.72), (x1 - 0.03, y1 - 0.03, zt + 0.72), (x0 + 0.03, y1 - 0.03, zt + 0.72)], 0.02, C['steel'], 8)


def station(A, G, fine=True):
    """the hauling station inside the opening: the reveal of the cut side, the working deck, the hull's inside under the sill and over the
    head, the ceiling under the shelter deck, the end walls, the inboard wall with its door, the companion ladder, the hold's hatch, her
    own gutting table, the hauling roller and the grab rail; work lights under the ceiling"""
    s = lambda q: C['steel']; w = C['white']; xa, xb = OP0 - 0.04, OP1 + 0.04
    # the reveal round the opening: the side's thickness (7 cm), white
    o = rr_pts((OP0 + OP1) / 2, (SILL + HEAD) / 2, OP1 - OP0, HEAD - SILL, 0.10, 4)
    ring = [V((p, -(y_at(p, q, -1) + 0.001), q)) for p, q in o]
    tube(A, ring, (0, 1, 0), 0.075, w)
    n = 12 if fine else 3; xs = [xa + (xb - xa) * k / n for k in range(n + 1)]
    for p, q in zip(xs, xs[1:]):
        yp, yq = -ybi(p), -ybi(q)
        # the working deck from the hull's inside to the inboard wall (in rows across)
        for k in range(4):
            ya, yb_ = yp + (YB - yp) * k / 4, yp + (YB - yp) * (k + 1) / 4; yc, yd = yq + (YB - yq) * k / 4, yq + (YB - yq) * (k + 1) / 4
            A.poly([(p, ya, ZMD), (q, yc, ZMD), (q, yd, ZMD), (p, yb_, ZMD)], C['deck'], (0, 0, 1))
        # the hull's inside: from the deck up to the sill (its top lies on the reveal's inner edge), and over the head up to the ceiling
        zs_p = SILL if OP0 + 0.10 < p < OP1 - 0.10 else HEAD; zs_q = SILL if OP0 + 0.10 < q < OP1 - 0.10 else HEAD
        A.poly([(p, yp, ZMD), (q, yq, ZMD), (q, yq, zs_q), (p, yp, zs_p)], C['inner'], (0, 1, 0))
        A.poly([(p, yp, HEAD), (q, yq, HEAD), (q, yq, CEIL), (p, yp, CEIL)], C['inner'], (0, 1, 0))
        # the ceiling (the shelter deck's underside), short of the well
        yi = WELL[2] if WELL[0] - 0.02 <= p and q <= WELL[1] + 0.02 else YB
        A.poly([(p, yp, CEIL), (q, yq, CEIL), (q, yi, CEIL), (p, yi, CEIL)], C['inner'], (0, 0, -1))
    # the end walls (a little outside the opening so their edges hide in the reveal's shadow)
    for x, sx in ((xa, 1), (xb, -1)):
        zs_ = [ZMD + (CEIL - ZMD) * k / 6 for k in range(7)]
        A.poly([(x, YB, ZMD)] + [(x, -ybi(x) + 0.0, z) for z in zs_] + [(x, YB, CEIL)], C['inner'], (sx, 0, 0))
    # the inboard wall with the door into the closed working deck
    d0, d1 = IDOOR; zdh = ZMD + 1.90
    for a, b, z0, z1 in ((xa, d0, ZMD, CEIL), (d1, xb, ZMD, CEIL), (d0, d1, zdh, CEIL)):
        A.poly([(a, YB, z0), (b, YB, z0), (b, YB, z1), (a, YB, z1)], C['inner'], (0, -1, 0))
    abox(A, d0 - 0.05, d1 + 0.05, YB - 0.012, YB, ZMD, zdh + 0.06, C['frame'], skip=('+y',))
    abox(A, d0 + 0.01, d1 - 0.01, YB - 0.045, YB - 0.012, ZMD + 0.08, zdh - 0.01, C['roof'])
    G.poly([(d0 + 0.18, YB - 0.046, zdh - 0.62), (d1 - 0.18, YB - 0.046, zdh - 0.62), (d1 - 0.18, YB - 0.046, zdh - 0.24), (d0 + 0.18, YB - 0.046, zdh - 0.24)], C['glass'], (0, -1, 0))
    acyl(A, (d0 + 0.08, YB - 0.045, ZMD + 1.0), (d0 + 0.08, YB - 0.09, ZMD + 1.0), 0.012, s, seg=8)
    # the companion ladder: steep treads on two stringers from the deck up through the well, aft to forward, a handrail
    x0, x1, y0, y1 = LADDER; nt = 7; zt = lambda k: ZMD + (z_sd(7.4) - ZMD) * k / (nt + 1)
    for k in range(1, nt + 1):
        xk = x1 - 0.06 - (x1 - x0 - 0.16) * k / nt
        abox(A, xk - 0.07, xk + 0.07, y0 + 0.04, y1 - 0.04, zt(k) - 0.035, zt(k), C['alu'])
    for yy in (y0 + 0.02, y1 - 0.02):
        beam(A, (x1 - 0.02, yy, ZMD), (x0 + 0.06, yy, z_sd(7.4) + 0.02), 0.035, 0.16, C['alu'], up=(1, 0, 1))
    if fine: F.pipe(A, [(x1 - 0.02, y1 - 0.05, ZMD + 0.9), (x0 + 0.06, y1 - 0.05, z_sd(7.4) + 0.9)], 0.016, C['steel'], 8)
    # the hold's hatch: a low coaming, the tread plate lid with its hinges and its lifting ring
    hx0, hx1, hy0, hy1 = HOLD; ob = rr_pts((hx0 + hx1) / 2, (hy0 + hy1) / 2, hx1 - hx0, hy1 - hy0, 0.04, 3)
    F.loft(A, [[(x, y, ZMD - 0.004) for x, y in ob], [(x, y, ZMD + 0.10) for x, y in ob]], lambda i: C['white'], cap0=False, cap1=False, out=lambda mid, cc: V((mid.x - cc.x, mid.y - cc.y, 0)))
    ob2 = rr_pts((hx0 + hx1) / 2, (hy0 + hy1) / 2, hx1 - hx0 + 0.06, hy1 - hy0 + 0.06, 0.05, 3)
    F.loft(A, [[(x, y, ZMD + 0.10) for x, y in ob2], [(x, y, ZMD + 0.125) for x, y in ob2]], lambda i: C['alu'], cap0=False, cap1=True)
    if fine:
        F.tread_plate(A, hx0, hx1, hy0, hy1, ZMD + 0.125, C['alu'], pitch=0.06)
        F.atorus(A, (hx0 + 0.10, (hy0 + hy1) / 2, ZMD + 0.128), (0, 0, 1), 0.03, 0.005, lambda a: C['steel'], seg=14, rseg=5)
        for yy in (hy0 + 0.12, hy1 - 0.12): acyl(A, (hx1 + 0.035, yy - 0.04, ZMD + 0.11), (hx1 + 0.035, yy + 0.04, ZMD + 0.11), 0.012, s, seg=8)
    # her own gutting table along the inboard wall: the top at working height, a lip, its legs, a spray hose on a hook
    tx0, tx1, ty0, ty1 = TABLE; zt2 = ZMD + 0.90
    abox(A, tx0, tx1, ty0, ty1, zt2 - 0.05, zt2, C['steel']); abox(A, tx0, tx1, ty1 - 0.02, ty1, zt2, zt2 + 0.14, C['steel'])
    for x in (tx0, tx1): abox(A, x - 0.01, x + 0.01, ty0, ty1, zt2, zt2 + 0.08, C['steel'])
    if fine:
        for x, y in ((tx0 + 0.05, ty0 + 0.05), (tx1 - 0.05, ty0 + 0.05), (tx0 + 0.05, ty1 - 0.05), (tx1 - 0.05, ty1 - 0.05)): acyl(A, (x, y, ZMD - 0.004), (x, y, zt2 - 0.05), 0.02, s, seg=8)
        acyl(A, (tx1 + 0.12, YB - 0.04, ZMD + 1.45), (tx1 + 0.12, YB - 0.10, ZMD + 1.45), 0.012, s, seg=6)
        for k in range(3): F.atorus(A, (tx1 + 0.12, YB - 0.12, ZMD + 1.25 - 0.03 * k), (0, 1, 0), 0.18, 0.016, lambda a: C['hose'], seg=18, rseg=5)
    # the hauling roller on the sill at the hauler's place, between its cheeks; the grab rail along the head inside
    if fine:
        F.hauling_roller(A, HXX - 0.36, HXX + 0.36, -(y_at(HXX, SILL, -1) + 0.04), -(ybi(HXX) - 0.03), SILL + 0.012, C['steel'], C['rubber'], R=0.06)
        yi = -ybi(6.2) + 0.08
        F.pipe(A, [(OP0 + 0.30, yi, HEAD - 0.10), (OP1 - 0.30, yi, HEAD - 0.10)], 0.016, C['steel'], 8)
        for x in (OP0 + 0.30, (OP0 + OP1) / 2, OP1 - 0.30): acyl(A, (x, yi - 0.07, HEAD - 0.10), (x, yi, HEAD - 0.10), 0.012, s, seg=8)
        # the work lights under the ceiling over the hauler and the table
        F.work_light(A, (7.1, -2.0, CEIL - 0.004), (0, -0.5, -1), C['dark'], C['lens'])
        F.work_light(A, (5.3, -1.6, CEIL - 0.004), (0, 0.2, -1), C['dark'], C['lens'])


# ---------- the wheelhouse forward on the shelter deck, the full width (Jonas 02.11.2026), its front leaning out ----------
WX0, WXS, WXF = 9.25, 11.95, 12.60   # the aft wall, the sides' forward end, the front's middle facet (at the floor)
WFY = 1.25                   # the front's middle facet, half its width
WS, WH, WR = 7.12, 8.05, 8.30        # the window band's sill and head, the roof's underside
LEAN = 0.30                  # the front and its corners lean out this much from the sill to the roof
WT = 0.06
def wy(x): return ysh(x) + 0.004                                  # the side walls stand on the cap, 4 mm proud of the hull's top
def lean_at(z): return LEAN * max(0.0, z - WS) / (WR - WS)
SIDE_XS = [9.25, 9.7, 10.2, 10.7, 11.2, 11.6, 11.95]
def wh_plan():
    """the plan from the aft starboard corner forward along the starboard side, across the front, aft along the port side, across the
    aft wall back: (x, y, front) with front 1 for the points the lean moves"""
    P = [(x, -wy(x), 0) for x in SIDE_XS] + [(WXF, -WFY, 1), (WXF, WFY, 1)] + [(x, wy(x), 0) for x in reversed(SIDE_XS)]
    P[len(SIDE_XS) - 1] = (WXS, -wy(WXS), 1); P[len(SIDE_XS) + 2] = (WXS, wy(WXS), 1)
    aft = [(WX0, wy(WX0) - 2 * wy(WX0) * k / 8, 0) for k in range(1, 8)]
    return P + aft
def wfoot(x, y):
    """the wall's foot: on the cap at the sides, on the deck across it"""
    return z_cap(x) - 0.006 if abs(abs(y) - wy(x)) < 0.01 else sdeck(x, y) - 0.006
def wh_ring(z):
    out = []
    for x, y, fr in wh_plan():
        zz = wfoot(x, y) if z is None else z; out.append((x + (lean_at(zz) if fr else 0.0), y, zz))
    return out
def wh_floor(x, y): return sdeck(x, y)
def wh_faces():
    """(name, origin, u, v, windows) for the panes in the dark window band (Jonas 02.11.2026: the first draft's panes were uneven, with
    thick white posts, and the side panes lay in one plane while the wall follows the sheer's curve in): three equal front panes; one pane
    in the starboard corner, one beside the door in the port corner; three panes a side, each in the wall's own plane where it stands; two
    aft beside the door"""
    vl = (LEAN / (WR - WS), 0, 1.0); vlen = math.hypot(vl[0], 1.0); s = lambda z: (z - WS) * vlen
    wz = (s(WS + 0.03) + s(WH - 0.03)) / 2; wh_ = s(WH - 0.03) - s(WS + 0.03); Fc = []
    pw = (2 * WFY - 0.10 - 2 * 0.05) / 3
    Fc.append(('front', (WXF, 0, WS), (0, 1, 0), vl, [rrect(u, wz, pw, wh_, 0.04, 3) for u in (-(pw + 0.05), 0.0, pw + 0.05)]))
    for nm, a, b in (('corner_s', (WXS, -wy(WXS)), (WXF, -WFY)), ('corner_p', (WXF, WFY), (WXS, wy(WXS)))):
        u = (b[0] - a[0], b[1] - a[1], 0); mid = ((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, WS); Lf = math.hypot(u[0], u[1])
        if nm == 'corner_s': Fc.append((nm, mid, u, vl, [rrect(0.0, wz, Lf - 0.16, wh_, 0.04, 3)]))
        else: Fc.append((nm, mid, u, vl, [rrect((-Lf / 2 + 0.08 + CDOOR - 0.38) / 2, wz, (CDOOR - 0.38) - (-Lf / 2 + 0.08), wh_, 0.04, 3)]))
    zc = (WS + WH) / 2; hz = WH - WS - 0.06
    for sg, nm in ((1, 'side_p'), (-1, 'side_s')):
        for k, (x0, x1) in enumerate(((9.42, 10.18), (10.24, 11.00), (11.06, 11.82))):
            cx = (x0 + x1) / 2; t = (wy(cx + 0.05) - wy(cx - 0.05)) / 0.10; u = V((1, sg * t, 0)).normalized(); L_ = (x1 - x0) * math.hypot(1, t)
            Fc.append(('%s%d' % (nm, k), (cx, sg * wy(cx), 0), tuple(u), (0, 0, 1), [rrect(0.0, zc, L_, hz, 0.04, 3)]))
    Fc.append(('aft', (WX0, 0, 0), (0, 1, 0), (0, 0, 1), [rrect(y, zc, 0.86, hz, 0.04, 3) for y in (-0.30, 1.30)]))
    return Fc
ADOOR = (-1.78, -1.06)       # the door in the aft wall to starboard, onto the shelter deck (y), hooked open
CDOOR = 0.10                 # the port corner's door: its middle along the facet from the facet's middle (m), onto the foredeck
def wheelhouse(fine=True):
    objs = []; glass = []; A = Acc('wh_fit')
    shell = loft_rings('wheelhouse', [wh_ring(None), wh_ring(WS), wh_ring(WR)], C['white'], cap0=False, cap1=False, angle=25)   # (open on top: the roof's underside closes it)
    shell.data.materials.append(C['inner']); solidify(shell, WT, 1); apply_all(shell)
    cuts = []
    def nrm_of(nm, u, vv):
        n = V(u).normalized().cross(vv).normalized()
        if nm.startswith('side_p'): return n if n.y > 0 else -n
        if nm.startswith('side_s'): return n if n.y < 0 else -n
        if nm == 'aft': return V((-1, 0, 0))
        return n if n.x > 0 else -n
    zf = sdeck(10.5, 0)
    for nm, o, u, v, wins in wh_faces():
        vv = V(v).normalized(); n = nrm_of(nm, u, vv)
        for k, poly in enumerate(wins):
            if fine: cuts.append(plate_cutter('wc_%s%d' % (nm, k), o, u, vv, poly, 0.45))
            cx = sum(p[0] for p in poly) / len(poly); cy = sum(p[1] for p in poly) / len(poly)
            if fine:
                outer = [(p[0] + (0.02 if p[0] > cx else -0.02), p[1] + (0.02 if p[1] > cy else -0.02)) for p in poly]
                objs.append(frame_ring('wf_%s%d' % (nm, k), V(o) + n * 0.004, u, vv, outer, poly, C['frame'], 0.0, 0.015, nrm=n))
                glass.append(plate('wg_%s%d' % (nm, k), V(o) - n * 0.03, u, vv, poly, C['glass'], nrm=n))
            else:
                us = [q[0] for q in poly]; ws = [q[1] for q in poly]; box_ = [(min(us), min(ws)), (max(us), min(ws)), (max(us), max(ws)), (min(us), max(ws))]
                objs.append(plate('wd_%s%d' % (nm, k), V(o) + n * 0.006, u, vv, box_, C['dark'], nrm=n))
    if fine:
        y0, y1 = ADOOR; zd0 = sdeck(WX0, (y0 + y1) / 2) - 0.02
        cuts.append(plate_cutter('wc_door', (WX0, 0, 0), (0, 1, 0), (0, 0, 1), rr_pts((y0 + y1) / 2, zd0 + 0.98, y1 - y0, 1.96, 0.06, 3), 0.35))
        # the port corner's door to the foredeck: in the facet's plane, from the deck
        a, b = (WXF, WFY), (WXS, wy(WXS)); u = (b[0] - a[0], b[1] - a[1], 0); mid = ((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, sdeck(12.3, 1.9) - 0.02)
        cuts.append(plate_cutter('wc_cdoor', mid, u, (LEAN / (WR - WS) * 0, 0, 1), rr_pts(CDOOR, 0.97, 0.66, 1.94, 0.06, 3), 0.35))
        cut(shell, cuts)
    # the window band dark all round (a white house with a black band, the panes in it, the mullions between them black)
    me = shell.data
    if 'frame' not in [m.name for m in me.materials]: me.materials.append(C['frame'])
    fi = [m.name for m in me.materials].index('frame'); wi = [m.name for m in me.materials].index(C['white'].name)
    bm = bmesh.new(); bm.from_mesh(me)
    bmesh.ops.bisect_plane(bm, geom=bm.verts[:] + bm.edges[:] + bm.faces[:], dist=1e-5, plane_co=(0, 0, WS - 0.04), plane_no=(0, 0, 1))
    bmesh.ops.bisect_plane(bm, geom=bm.verts[:] + bm.edges[:] + bm.faces[:], dist=1e-5, plane_co=(0, 0, WH + 0.04), plane_no=(0, 0, 1))
    for f in bm.faces:
        if f.material_index == wi and WS - 0.04 < f.calc_center_median().z < WH + 0.04: f.material_index = fi
    bm.to_mesh(me); bm.free()
    objs.append(shell)
    if fine:
        # the aft door, hooked open back against the wall to port (hs11.py): its frame, the leaf with its pane, handle and hook
        y0, y1 = ADOOR; x = WX0; zd0 = sdeck(WX0, (y0 + y1) / 2) - 0.02; z1 = zd0 + 1.96
        o = rr_pts((y0 + y1) / 2, zd0 + 0.98, y1 - y0, 1.96, 0.06, 3); fo = [(p, max(q, zd0)) for p, q in rr_pts((y0 + y1) / 2, zd0 + 0.98, y1 - y0 + 0.08, 2.04, 0.09, 3)]
        for k in range(len(o)):
            a, b = o[k], o[(k + 1) % len(o)]; c_, d_ = fo[(k + 1) % len(fo)], fo[k]
            A.poly([(x - 0.012, a[0], a[1]), (x - 0.012, b[0], b[1]), (x - 0.012, c_[0], c_[1]), (x - 0.012, d_[0], d_[1])], C['white'], (-1, 0, 0))
            A.poly([(x - 0.012, a[0], a[1]), (x - 0.012, b[0], b[1]), (x + WT + 0.002, b[0], b[1]), (x + WT + 0.002, a[0], a[1])], C['white'], (0, 0, 0))
        lx0, lx1 = x - 0.075, x - 0.035; ly0, ly1 = y1 + 0.04, y1 + 0.04 + (y1 - y0) - 0.016
        abox(A, lx0, lx1, ly0, ly1, zd0 + 0.04, z1 - 0.03, C['white'])
        glass.append(plate('door_glass', (lx0 - 0.002, 0, 0), (0, 1, 0), (0, 0, 1), rr_pts((ly0 + ly1) / 2, z1 - 0.44, 0.36, 0.44, 0.06, 3), C['glass'], nrm=(-1, 0, 0)))
        acyl(A, (lx0, ly1 - 0.07, zd0 + 1.0), (lx0 - 0.05, ly1 - 0.07, zd0 + 1.0), 0.012, lambda q: C['steel'], seg=8)
        acyl(A, (lx1, ly1 - 0.05, zd0 + 0.5), (x, ly1 - 0.05, zd0 + 0.5), 0.01, lambda q: C['steel'], seg=6)
        # the corner door, closed: a white leaf a little in, its pane and handle
        a, b = V((WXF, WFY, 0)), V((WXS, wy(WXS), 0)); u = (b - a).normalized(); nn = V((u.y, -u.x, 0)) if u.y * 1 > 0 else V((-u.y, u.x, 0))
        if nn.x < 0: nn = -nn
        cm = (a + b) / 2 + u * CDOOR; zc0 = sdeck(12.3, 1.9) - 0.02
        P = lambda du, z, dn: V((cm.x + u.x * du + nn.x * dn, cm.y + u.y * du + nn.y * dn, z))
        A.poly([P(-0.32, zc0 + 0.04, -0.02), P(0.32, zc0 + 0.04, -0.02), P(0.32, zc0 + 1.92, -0.02), P(-0.32, zc0 + 1.92, -0.02)], C['roof'], nn)
        A.poly([P(-0.32, zc0 + 0.04, -0.045), P(-0.32, zc0 + 1.92, -0.045), P(0.32, zc0 + 1.92, -0.045), P(0.32, zc0 + 0.04, -0.045)], C['roof'], -nn)
        glass.append(plate('cdoor_glass', P(0, 0, -0.021), u, (0, 0, 1), rr_pts(0, zc0 + 1.45, 0.34, 0.46, 0.06, 3), C['glass'], nrm=nn))
        acyl(A, P(0.24, zc0 + 1.0, -0.02), P(0.24, zc0 + 1.0, 0.03), 0.012, lambda q: C['steel'], seg=8)
    # the roof: its underside, a lip all round with a drip edge, the visor over the front, the crown, the rail aft where the rafts lie
    ring = offset_poly([(p[0], p[1]) for p in wh_ring(WR)[:2 * len(SIDE_XS) + 2]], 0.10)   # (the aft wall's own points lie in one line: offset_poly needs corners); ring = [(x + (0.12 if x > WXS - 0.05 else 0.0), y) for x, y in ring]
    A.poly([(x, y, WR + 0.001) for x, y in ring], C['inner'], (0, 0, -1))
    crown = lambda x, y: WR + 0.12 + 0.06 * (1 - min(1.0, (y / 3.3) ** 2))
    ri = offset_poly(ring, -0.16)
    for i in range(len(ring)):
        a, b = ring[i], ring[(i + 1) % len(ring)]; c, d = ri[(i + 1) % len(ri)], ri[i]; nrm = (b[1] - a[1], -(b[0] - a[0]), 0)
        A.poly([(a[0], a[1], WR), (b[0], b[1], WR), (b[0], b[1], WR + 0.10), (a[0], a[1], WR + 0.10)], C['white'], nrm)
        A.poly([(a[0], a[1], WR + 0.10), (b[0], b[1], WR + 0.10), (c[0], c[1], crown(*c)), (d[0], d[1], crown(*d))], C['roof'], (0, 0, 1))
        A.poly([(a[0], a[1], WR - 0.001), (b[0], b[1], WR - 0.001), (b[0], b[1], WR - 0.025), (a[0], a[1], WR - 0.025)], C['frame'], nrm)
    # the roof's top as a grid (a big flat face goes dark in the game: kap. 19)
    xr0, xr1 = WX0 + 0.10, WXS - 0.10; NXR, NYR = (10, 10) if fine else (1, 1)
    yr = lambda x: wy(x) - 0.12
    for i in range(NXR):
        xa_, xb_ = xr0 + (xr1 - xr0) * i / NXR, xr0 + (xr1 - xr0) * (i + 1) / NXR
        for j in range(NYR):
            P4 = [(xa_, -yr(xa_) + 2 * yr(xa_) * j / NYR), (xb_, -yr(xb_) + 2 * yr(xb_) * j / NYR), (xb_, -yr(xb_) + 2 * yr(xb_) * (j + 1) / NYR), (xa_, -yr(xa_) + 2 * yr(xa_) * (j + 1) / NYR)]
            A.poly([(x, y, crown(x, y) + 0.004) for x, y in P4], C['roof'], (0, 0, 1))
    if fine:
        # the wipers on the front panes, parked along the panes' foot
        for u_ in (-0.82, 0.0, 0.82):
            zb2 = WS + 0.08; xb2 = WXF + lean_at(zb2) + 0.03
            acyl(A, (xb2 - 0.04, u_ + 0.30, zb2 - 0.04), (xb2 + 0.01, u_ + 0.30, zb2 - 0.04), 0.02, lambda q: C['frame'], seg=8)
            acyl(A, (xb2, u_ + 0.26, zb2), (xb2, u_ - 0.28, zb2), 0.007, lambda q: C['rubber'], seg=5)
        # the rail round the roof's after part, the rafts' place
        for sg in (1, -1):
            pts = [(WX0 + 0.12, sg * 0.6), (WX0 + 0.12, sg * (wy(WX0) - 0.18)), (10.7, sg * (wy(10.7) - 0.18))]
            for x, y in pts: acyl(A, (x, y, crown(x, y)), (x, y, crown(x, y) + 0.42), 0.016, lambda q: C['steel'], seg=8)
            F.pipe(A, [(x, y, crown(x, y) + 0.42) for x, y in pts], 0.018, C['steel'], 8)
    objs.append(A.done(35, tint=wear))
    return objs, glass, crown


# the helm to starboard under the front panes: the console with the dash sloping up forward, the plotter, the sounder, the AIS and the
# engine's panel facing the skipper, the compass, the wheel, the lever, the VHF overhead, his chair; the bench and the chart table to port
HX0 = 11.92                  # the console's after face
HY0, HY1 = -1.95, -0.25
DASH = ((11.96, None), (12.32, None))         # the dash's after foot and fore top (x); their heights from the floor below
def dz(z): return sdeck(11.9, 1.0) + z
DASHZ = (0.92, 1.06)
WHEEL = (11.78, -1.05, None); WHEEL_AX = (-1.0, 0.0, 0.55)
SKIP = (11.38, -1.05); SEAT = (10.94, -1.05)
EYE_H = 1.65
HP, FOV = -0.30, 60
def dash_pt(t, y):
    (x0, _), (x1, _) = DASH; return V((x0 + (x1 - x0) * t, y, dz(DASHZ[0] + (DASHZ[1] - DASHZ[0]) * t)))
def dash_n():
    (x0, _), (x1, _) = DASH; return V((-(DASHZ[1] - DASHZ[0]), 0, x1 - x0)).normalized()
SCR = {'plot': (-1.85, -1.42, 0.12, 0.88), 'sound': (-1.30, -1.12, 0.40, 0.90), 'ais': (-0.98, -0.80, 0.40, 0.90), 'eng': (-0.68, -0.32, 0.12, 0.88)}
HELM_EXTRA = []
def helm(A, G, fine=True):
    w = C['inner']; z0 = sdeck(11.9, 1.0) - 0.004; (x0, _), (x1, _) = DASH; dz0, dz1 = dz(DASHZ[0]), dz(DASHZ[1]); xw = 12.40
    A.poly([(HX0, HY0, z0), (HX0, HY1, z0), (HX0, HY1, dz0), (HX0, HY0, dz0)], w, (-1, 0, 0))
    A.poly([(HX0, HY0, dz0), (HX0, HY1, dz0), (x0, HY1, dz0), (x0, HY0, dz0)], w, (0, 0, 1))
    A.poly([(x0, HY0, dz0), (x0, HY1, dz0), (x1, HY1, dz1), (x1, HY0, dz1)], C['board'], dash_n())
    for y, sg in ((HY0, -1), (HY1, 1)):
        A.poly([(HX0, y, z0), (xw, y, z0), (xw, y, dz1), (x1, y, dz1), (x0, y, dz0), (HX0, y, dz0)], w, (0, sg, 0))
    A.poly([(x1, HY0, dz1), (x1, HY1, dz1), (xw, HY1, dz1), (xw, HY0, dz1)], w, (0, 0, 1))
    A.poly([(xw, HY0, z0), (xw, HY1, z0), (xw, HY1, dz1), (xw, HY0, dz1)], w, (1, 0, 0))
    if not fine: return
    n = dash_n()
    for nm, (ya, yb_, ta, tb) in SCR.items():
        q = [dash_pt(ta, ya), dash_pt(ta, yb_), dash_pt(tb, yb_), dash_pt(tb, ya)]; c = sum(q, V()) / 4
        F.loft(A, [[p + n * 0.002 for p in q], [p + n * 0.014 for p in q]], lambda i: C['bezel'], cap0=False, cap1=False)
        A.poly([p + n * 0.014 for p in q], C['bezel'], n)
        A.poly([c + (p - c) * 0.86 + n * 0.0145 for p in q], C['screen'], n)
    cb = dash_pt(0.93, -1.10) + V((0.0, 0, -0.005))
    acyl(A, cb, cb + V((0, 0, 0.05)), 0.07, lambda q: C['dark'], seg=16)
    HELM_EXTRA.append(sphere('compass', cb + V((0, 0, 0.085)), 0.06, C['glass'], (1, 1, 0.7)))
    cp = dash_pt(0.15, -0.20 - 0.10) + n * 0.003
    obox(A, cp, V((0, 0.07, 0)), (dash_pt(1, 0) - dash_pt(0, 0)).normalized() * 0.03, n * 0.004, C['switch'])
    for k in range(4): obox(A, cp + n * 0.005 + V((0, -0.05 + 0.033 * k, 0)), V((0, 0.009, 0)), V((0.004, 0, 0.008)), n * 0.004, C['lampG'] if k < 3 else C['lampR'])
    wc = (WHEEL[0], WHEEL[1], dz(1.00))
    F.helm_wheel(A, wc, WHEEL_AX, 0.22, C['cush'], C['steel'], C['dark'])
    acyl(A, V(wc) - V(WHEEL_AX).normalized() * 0.14, (HX0 + 0.004, WHEEL[1], wc[2] + 0.02), 0.03, lambda q: C['dark'], seg=10)
    F.single_lever(A, (HX0 + 0.12, HY1, z0 + 0.82), (0, 1, 0), (1, 0, 0), C['dark'], C['steel'], C['black'])
    vc = V((11.20, -1.70, WR - 0.06))
    obox(A, vc, V((0.09, 0, 0)), V((0, 0.10, 0)), V((0, 0, 0.05)), C['dark'])
    A.poly([vc + V((-0.091, -0.08, -0.03)), vc + V((-0.091, 0.08, -0.03)), vc + V((-0.091, 0.08, 0.03)), vc + V((-0.091, -0.08, 0.03))], C['screen'], (-1, 0, 0))
    F.helm_seat(A, (SEAT[0], SEAT[1], z0), (1, 0, 0), 0.80, C['steel'], C['cush'])
    # the bench to port along the side, its back on the wall, the chart table forward of it
    yi = wy(10.3) - WT - 0.08
    abox(A, 9.60, 10.90, 2.05, yi, z0, z0 + 0.42, C['inner']); abox(A, 9.62, 10.88, 2.07, yi - 0.002, z0 + 0.42, z0 + 0.50, C['cush'])
    abox(A, 9.62, 10.88, yi - 0.09, yi - 0.002, z0 + 0.50, z0 + 0.92, C['cush'])
    yi2 = wy(11.3) - WT - 0.08
    abox(A, 11.05, 11.70, 1.80, yi2, z0, z0 + 0.84, C['inner']); abox(A, 11.07, 11.68, 1.82, yi2 - 0.002, z0 + 0.84, z0 + 0.87, C['wood'])


# ---------- on the shelter deck: rails, bitts, the windlass and the hawse pipes' deck ends, vents, the mizzen's step, the flag staff ----------
def gunwale_y(x, sg=1): return ycap(x, sg) + CAP * 0.5
RAIL_XS = [0.25 + 0.75 * k for k in range(12)]       # the stanchions on the shelter deck's cap aft of the wheelhouse
RAIL_XF = [12.75, 13.35, 13.95, 14.45]               # round the foredeck, on the higher bulwark
RAIL_H = 1.00                                        # the rail's top over the shelter deck aft (MAN-01)
def decks(A, fine=True):
    s = lambda q: C['steel']
    def base(p, r=0.026): acyl(A, (p[0], p[1], p[2] - 0.003), (p[0], p[1], p[2] + 0.008), r, s, seg=10)
    if fine:
        # the rail on the cap aft: posts on bases, a top and a knee rail, across the stern
        for sg in (1, -1):
            for x in RAIL_XS:
                if x > WX0 - 0.05: continue
                zc = z_cap(x) + 0.012; y = sg * gunwale_y(x, sg); base((x, y, zc)); acyl(A, (x, y, zc), (x, y, z_sd(x) + RAIL_H), 0.022, s, seg=8)
            xs = [x for x in RAIL_XS if x < WX0 - 0.05] + [WX0 - 0.03]
            for h in (RAIL_H, 0.55):
                F.pipe(A, [(x, sg * gunwale_y(x, sg), z_sd(x) + h) for x in xs], 0.024 if h == RAIL_H else 0.018, C['steel'], 8)
        yt = gunwale_y(0.25)
        for h in (RAIL_H, 0.55): F.pipe(A, [(0.25, -yt, z_sd(0.25) + h), (0.25, yt, z_sd(0.25) + h)], 0.024 if h == RAIL_H else 0.018, C['steel'], 8)
        for y in (-1.0, 1.0): acyl(A, (0.25, y, z_cap(0.25) - 0.25), (0.25, y, z_sd(0.25) + RAIL_H), 0.022, s, seg=8)
        # round the foredeck: posts on the bulwark's cap, a top and a knee rail, closing round the bow in a pulpit
        for sg in (1, -1):
            for x in RAIL_XF:
                zc = z_cap(x) + 0.012; y = sg * gunwale_y(x, sg); base((x, y, zc)); acyl(A, (x, y, zc), (x, y, zc + 0.52), 0.020, s, seg=8)
        for h, r in ((0.52, 0.022), (0.26, 0.016)):
            pts = [(x, -gunwale_y(x, -1), z_cap(x) + 0.012 + h) for x in RAIL_XF] + [(14.80, 0.0, z_cap(14.80) + 0.012 + h + 0.02)]
            pts += [(x, gunwale_y(x), z_cap(x) + 0.012 + h) for x in reversed(RAIL_XF)]
            F.pipe(A, pts, r, C['steel'], 8)
    # the windlass on the foredeck with its gypsy and warping drum, the chain pipe aft of it, the hawse pipes' deck ends (bower)
    wx = WINDLASS; zd = sdeck(wx, 0)
    abox(A, wx - 0.26, wx + 0.26, -0.24, 0.24, zd - 0.006, zd + 0.12, C['red'])
    acyl(A, (wx, -0.22, zd + 0.34), (wx, 0.22, zd + 0.34), 0.17, lambda q: C['red'], seg=18 if fine else 6)
    if fine:
        for sg in (1, -1):
            F.atorus(A, (wx, sg * 0.30, zd + 0.34), (0, 1, 0), 0.13, 0.03, lambda a: C['steel'], seg=16, rseg=6)
            acyl(A, (wx, sg * 0.24, zd + 0.34), (wx, sg * 0.36, zd + 0.34), 0.09, lambda q: C['steel'], seg=12)
            hx, hy = HPIPE; acyl(A, (hx, sg * hy, sdeck(hx, hy) - 0.004), (hx, sg * hy, sdeck(hx, hy) + 0.07), 0.12, s, seg=14)
            F.atorus(A, (hx, sg * hy, sdeck(hx, hy) + 0.07), (0, 0, 1), 0.12, 0.02, lambda a: C['steel'], seg=16, rseg=5)
        obox(A, (wx, 0, zd + 0.16), V((0.22, 0, 0)), V((0, 0.20, 0)), V((0, 0, 0.06)), C['red'])
        acyl(A, (wx - 0.42, 0, sdeck(wx - 0.42, 0) - 0.004), (wx - 0.42, 0, sdeck(wx - 0.42, 0) + 0.06), 0.07, s, seg=12)
    if not fine: return
    # the bitts on the foredeck and on the quarters, the cleats on the caps amidships, two mushroom vents forward
    for x, y in ((13.55, 0.85), (13.55, -0.85), (1.0, 2.30), (1.0, -2.30)): F.bitts(A, x, y, sdeck(x, y), C['steel'], h=0.30, r=0.05, gap=0.15)
    for x in (4.2, 8.7):
        for sg in (1, -1):
            if sg < 0 and OP0 < x < OP1: continue
            F.cleat(A, (x, sg * gunwale_y(x, sg), z_cap(x) + 0.006), (0, 0, 1), (1, 0, 0), 0.30, C['steel'])
    for y in (0.95, -0.95): F.mushroom_vent(A, (12.95, y, sdeck(12.95, y)), C['white'])
    # the air pipes on the shelter deck aft, a coiled mooring rope, a deck hose
    for x, y in ((3.6, 2.6), (3.6, -2.6), (8.6, 2.7), (8.6, -2.7)):
        z0_ = sdeck(x, y); acyl(A, (x, y, z0_ - 0.004), (x, y, z0_ + 0.42), 0.04, s, seg=10); F.pipe(A, [(x, y, z0_ + 0.42), (x, y, z0_ + 0.50), (x + 0.10, y, z0_ + 0.52), (x + 0.15, y, z0_ + 0.46)], 0.04, C['steel'], 10)
    for k in range(4): F.atorus(A, (13.0, -0.45, sdeck(13.0, 0.45) + 0.02 + 0.035 * k), (0, 0, 1), 0.22 - 0.015 * k, 0.02, lambda a: C['rope2'], seg=20, rseg=5)
    # the flag staff in its socket on the transom's cap to port, raked aft
    px, py = POLE; zp = z_cap(0.06) + 0.012
    acyl(A, (px, py, zp - 0.004), (px, py, zp + 0.16), 0.026, s, seg=10)
    acyl(A, (px, py, zp + 0.02), (px - 0.18, py, zp + 1.42), 0.02, lambda q: C['wood'], seg=8)
WINDLASS = 13.05
HPIPE = (13.72, 0.62)        # the hawse pipes' deck ends
POLE = (0.12, 1.60)


# ---------- the transom (M4: it was a flat face with knife edges): the rubber D-fender at the strake, the panama chocks, the ladder ----------
def transom(A, fine=True):
    s = lambda q: C['steel']
    z = z_rub(XA); yy = y_at(0.02, z) - 0.10
    acyl(A, (XA - 0.045, -yy, z), (XA - 0.045, yy, z), 0.065, lambda q: C['rubber'], seg=10)
    if not fine: return
    zt = z_cap(XA)
    for y in (-2.0, 2.0):
        abox(A, XA - 0.06, XA + 0.02, y - 0.22, y + 0.22, zt - 0.34, zt - 0.06, C['steel']); abox(A, XA - 0.065, XA + 0.025, y - 0.12, y + 0.12, zt - 0.27, zt - 0.13, C['black'])
    # the rescue ladder to starboard: its rungs from under the water up the transom, two stiles bracketed to it
    F.ladder(A, (XA - 0.06, -1.55, WL - 0.45), (XA - 0.06, -1.55, zt - 0.15), 0.40, C['steel'], side=(0, 1, 0), away=(-1, 0, 0))
    for zz in (WL + 0.6, z_rub(XA) + 0.5, zt - 0.3): abox(A, XA - 0.06, XA + 0.002, -1.78, -1.32, zz - 0.015, zz + 0.015, C['steel'])
    # the draft scales on the stern quarters and the bow (IDN-06)
    for sg in (1, -1):
        F.draft_scale(A, lambda zq, sg=sg: (lambda p, n, tt: (p, n, -sg * tt))(*surf(0.6, zq, sg, off=0.004)), WL - 0.6, WL + 0.6, C['strake'])
        F.draft_scale(A, lambda zq, sg=sg: (lambda p, n, tt: (p, n, -sg * tt))(*surf(xstem(zq) - 0.35, zq, sg, off=0.004)), WL - 0.6, WL + 0.6, C['strake'])

def xstem(z):
    lo, hi = 9.0, XF
    for _ in range(40):
        m = (lo + hi) / 2
        if z_low(m) < z: lo = m
        else: hi = m
    return lo

def surf(x, z, sg, off=0.0):
    p = lambda xx, zz: V((xx, sg * (y_at(xx, zz, sg) + off), zz))
    tx = p(x + 0.08, z) - p(x - 0.08, z); tz = p(x, z + 0.08) - p(x, z - 0.08); n = tx.cross(tz)
    if n.y * sg < 0: n = -n
    return p(x, z), n.normalized(), tx.normalized()


# ---------- the mast on the wheelhouse roof and the mizzen at the stern; the lanterns (FOR-1975-12-01-5 vedlegg I, check()) ----------
MX = 9.95                    # the mast on the roof's after part
M_TOP = 12.15
def white_z(): return M_TOP + 0.10          # the masthead light on its top (12-20 m: a masthead light, 225 degrees forward)
FISH_R, FISH_W = 11.90, 10.84              # the fishing lights red over white on arms forward of the mast (rule 26)
LAMP_ARM = 0.42
RAD_P = (10.65, 9.30)        # the open array's platform forward of the mast (kit.radarA: x, its top)
SIDE = (12.10, 8.58)         # the side lights on boards on the roof's forward corners (x, z), their screens inboard
AM = (0.70, 0.0); AM_TOP = 12.0             # the mizzen on the shelter deck at the stern
STERN_L = (0.48, 0.0, 7.30)  # the stern light on the mizzen's aft face, over the transom
def rig(A, crown, fine=True):
    seg = 12 if fine else 6; m = C['mast']; s = lambda q: C['steel']; d = lambda q: C['dark']
    zr = crown(MX, 0)
    # the mast: a tapered tube from the roof, the radar platform forward on a strut, the cross-tree, the pole with the masthead light
    acyl(A, (MX, 0, zr - 0.02), (MX, 0, 11.0), 0.13, lambda q: m, seg=seg, r1=0.09)
    acyl(A, (MX, 0, 11.0), (MX, 0, M_TOP), 0.05, lambda q: m, seg=seg)
    abox(A, MX - 0.22, MX + 0.22, -0.22, 0.22, zr - 0.01, zr + 0.03, C['steel'])
    acyl(A, (MX, 0, M_TOP), (MX, 0, white_z() - 0.04), 0.02, lambda q: m, seg=8)
    if fine: F.allround_lantern(A, (MX, 0, white_z()), C['lampW'], C['frame'], R=0.04, H=0.08)
    else: acyl(A, (MX, 0, white_z() - 0.05), (MX, 0, white_z() + 0.05), 0.05, lambda q: C['lampW'], seg=6)
    rx, rz = RAD_P
    abox(A, MX + 0.08, rx + 0.36, -0.34, 0.34, rz - 0.06, rz, m)
    beam(A, (MX + 0.10, 0, rz - 0.75), (rx + 0.28, 0, rz - 0.06), 0.07, 0.07, m)
    abox(A, MX - 0.03, MX + 0.03, -0.9, 0.9, 10.75, 10.81, m)
    for z, mt in ((FISH_R, C['lampR']), (FISH_W, C['lampW'])):
        abox(A, MX + 0.05, MX + LAMP_ARM - 0.03, -0.02, 0.02, z - 0.10, z - 0.07, m)
        acyl(A, (MX + LAMP_ARM, 0, z - 0.10), (MX + LAMP_ARM, 0, z - 0.07), 0.04, lambda q: m, seg=10 if fine else 5)
        if fine: F.allround_lantern(A, (MX + LAMP_ARM, 0, z), mt, C['frame'], R=0.035, H=0.07)
        else: acyl(A, (MX + LAMP_ARM, 0, z - 0.05), (MX + LAMP_ARM, 0, z + 0.05), 0.045, lambda q: mt, seg=6)
    # the mizzen: the mast on its step, the boom out over the transom, the gaff's jaws; the stern light on its aft face
    ax = AM[0]; zm = sdeck(ax, 0)
    acyl(A, (ax, 0, zm - 0.004), (ax, 0, AM_TOP), 0.09, lambda q: m, seg=seg, r1=0.06)
    acyl(A, (ax, 0, AM_TOP), (ax, 0, AM_TOP + 0.05), 0.08, lambda q: m, seg=seg)
    abox(A, ax - 0.16, ax + 0.16, -0.16, 0.16, zm - 0.006, zm + 0.04, C['steel'])
    acyl(A, (ax, 0, BOOM_Z), (-2.10, 0, BOOM_Z), 0.055, lambda q: m, seg=10 if fine else 5)
    F.stern_lantern(A, STERN_L, (-1, 0, 0), C['lampW'], C['frame']) if fine else obox(A, STERN_L, V((0.03, 0, 0)), V((0, 0.03, 0)), V((0, 0, 0.03)), C['lampW'])
    abox(A, STERN_L[0] + 0.02, ax - 0.06, -0.03, 0.03, STERN_L[2] - 0.05, STERN_L[2] - 0.02, m)
    if not fine: return
    # the boom's topping lift, the mizzen's shrouds to the caps
    acyl(A, (-2.05, 0, BOOM_Z), (ax, 0, AM_TOP - 0.1), 0.008, d, seg=4)
    for sg in (1, -1):
        cx = 1.8; cy = sg * (gunwale_y(cx, sg) + 0.02); cz = z_cap(cx)
        obox(A, (cx, cy + sg * 0.03, cz - 0.10), (0.04, 0, 0), (0, 0.006, 0), (0, 0, 0.14), C['steel'])
        acyl(A, (ax, 0, AM_TOP - 0.6), (cx, cy + sg * 0.03, cz + 0.04), 0.007, d, seg=4)
    # on the wheelhouse roof: the whips and the GPS on the cross-tree, the searchlights and the horn forward, the dome's foot
    for sy in (-0.8, 0.8): F.whip(A, (MX, sy, 10.81), 1.6, C['white'], r0=0.014, r1=0.006, m_foot=C['steel'])
    F.gps(A, (MX + 0.2, -0.25, rz), C['white'], r=0.07, h=0.12, m_post=C['steel'])
    for sy in (-1.2, 1.2): F.searchlight(A, (11.55, sy, crown(11.55, sy)), (1, 0), 0.10, C['dark'], C['lens'], C['steel'])
    abox(A, 11.0, 11.08, -0.33, -0.27, crown(11.0, 0.3) - 0.004, crown(11.0, 0.3) + 0.14, C['steel'])
    acyl(A, (10.95, -0.3, crown(11.0, 0.3) + 0.16), (11.25, -0.3, crown(11.0, 0.3) + 0.20), 0.03, lambda q: C['white'], seg=10, r1=0.08)
    # the work lights: under the roof's after edge over the shelter deck, and on the mast over the foredeck
    for yy in (-1.4, 1.4): F.work_light(A, (WX0 - 0.08, yy, WR - 0.03), (-0.6, 0, -1), C['dark'], C['lens'])
    F.work_light(A, (MX + 0.12, 0, 10.5), (1, 0, -0.7), C['dark'], C['lens'])
    # the exhaust: up the wheelhouse's aft wall to port, out through the roof's lip with its rain cap
    ex, ey = WX0 - 0.16, 2.05
    acyl(A, (ex, ey, sdeck(ex, ey) - 0.004), (ex, ey, WR + 1.10), 0.075, s, seg=12)
    acyl(A, (ex, ey, WR + 1.10), (ex, ey, WR + 1.22), 0.075, lambda q: C['black'], seg=12)
    acyl(A, (ex, ey, WR + 1.22), (ex - 0.06, ey, WR + 1.30), 0.085, lambda q: C['black'], seg=12)
    for zz in (sdeck(ex, ey) + 0.6, WR - 0.3, WR + 0.6): acyl(A, (ex, ey, zz), (WX0, ey, zz), 0.012, s, seg=6)
BOOM_Z = 6.95

def lanterns_side(A, fine=True):
    """the side lights on boards on the roof's forward corners, each with its screen inboard (fittings.side_lantern), so neither shows
    across the bow"""
    for sg, mt in ((1, C['lampR']), (-1, C['lampG'])):
        y = sg * (wy(SIDE[0]) - 0.10); zb = SIDE[1] - 0.05
        abox(A, SIDE[0] - 0.16, SIDE[0] + 0.16, min(y, y - sg * 0.14), max(y, y - sg * 0.14), zb - 0.03, zb, C['frame'])
        if fine: F.side_lantern(A, (SIDE[0], y, zb + 0.03), (1, 0, 0), (0, sg, 0), mt, C['frame'], C['black'], R=0.035, H=0.055)
        else: obox(A, (SIDE[0], y, zb + 0.05), V((0.04, 0, 0)), V((0, 0.03, 0)), V((0, 0, 0.03)), mt)


# ---------- the riding sail: set at sea, furled in port (M5), each a part of its own (drawSail) ----------
SAIL = dict(tack=(AM[0] - 0.08, BOOM_Z + 0.12), clew=(-1.95, BOOM_Z + 0.12), head=(-1.45, 11.55), peak=(AM[0] - 0.08, 11.80))
def sail_set(fine=True):
    A = Acc('sail'); P3 = lambda q: (q[0], 0.0, q[1])
    F.sail(A, P3(SAIL['tack']), P3(SAIL['clew']), P3(SAIL['head']), P3(SAIL['peak']), C['sail'], C['sailedge'], m_seam=C['sailseam'], belly=0.14, panels=6, fine=fine)
    acyl(A, (AM[0], 0, 11.85), (-1.47, 0, 11.57), 0.04, lambda q: C['mast'], seg=10)                     # the gaff
    acyl(A, (-1.47, 0, 11.55), (-1.95, 0, BOOM_Z + 0.06), 0.008, lambda q: C['dark'], seg=4)            # the leech's line
    return A.done(80)
def sail_furled(fine=True):
    """the sail furled on the boom under its lashings, the gaff lowered onto it"""
    A = Acc('sailf'); x0, x1 = AM[0] - 0.14, -1.85; zb = BOOM_Z
    rr = lambda t: 0.13 * math.sin(math.pi * min(1.0, 0.15 + t * 0.85)) + 0.04
    rings = [[(x0 + (x1 - x0) * t, 0.13 * math.cos(2 * math.pi * k / 12) * rr(t) / 0.17, zb + 0.12 + rr(t) * (0.8 + 0.8 * math.sin(2 * math.pi * k / 12))) for k in range(12)] for t in [i / 10 for i in range(11)]]
    F.loft(A, rings, lambda i: C['sail'], cap0=True, cap1=True)
    for t in (0.15, 0.4, 0.65, 0.88):
        xx = x0 + (x1 - x0) * t; F.atorus(A, (xx, 0, zb + 0.12 + rr(t) * 0.8), (1, 0, 0), rr(t) * 1.02 + 0.014, 0.009, lambda a: C['sailedge'], seg=12, rseg=4)
    acyl(A, (AM[0], 0.05, BOOM_Z + 0.32), (-1.45, 0.05, BOOM_Z + 0.26), 0.04, lambda q: C['mast'], seg=10)
    return A.done(60)


# ---------- under water: the shoe, the rudder, the propeller in its aperture, the anodes, the bow thruster ----------
RX_ = 0.30                   # the rudder's stock (its leading edge)
PROP = (1.12, 0.0, 0.88); PR = 0.68                           # the propeller's centre and radius (750 hp, a slow four-blader)
def underwater(fine=True):
    U = Acc('under')
    abox(U, -0.05, X_KA + 0.06, -0.08, 0.08, 0.0, 0.10, C['af'])                                         # the shoe from the keel to the rudder's heel
    F.foil_rudder(U, (RX_, 0.0), 0.10, 2.30, 0.72, C['af'], thick=0.13, top=lambda x: z_low(max(x, XA)) - 0.04, n=12 if fine else 5, rows=6 if fine else 2)
    acyl(U, (RX_ - 0.05, 0, 0.10), (RX_ - 0.05, 0, z_low(RX_) + 0.10), 0.05, lambda q: C['steel'], seg=10)
    px, py, pz = PROP
    if not fine: return U.done(35)
    acyl(U, (px + 0.08, 0, pz), (X_KA + 0.06, 0, pz), 0.07, lambda q: C['steel'], seg=12)
    acyl(U, (X_KA - 0.06, 0, pz), (X_KA + 0.06, 0, pz), 0.13, lambda q: C['prop'], seg=14, r1=0.15)
    F.propeller(U, PROP, (1, 0, 0), PR, C['prop'], n=4, hub=0.24, pitch=0.85, skew=0.25, cpp=False, fine=fine)
    for sg in (1, -1):
        for x, z in ((3.2, 0.45), (6.0, 0.62), (8.6, 0.95)): F.anode(U, (x, sg * (wk(x) + 0.004), z), (0, sg, 0), (1, 0, 0), C['anode'], L=0.34, w=0.10, t=0.04, m_strap=C['steel'])
        F.anode(U, (-0.004, sg * 1.2, WL - 0.12), (-1, 0, 0), (0, 1, 0), C['anode'], L=0.24, w=0.08, t=0.035, m_strap=C['steel'])
        # the bilge keels along the turn of the bilge amidships (SKR-07)
        pts = [surf(x, 1.95, sg)[0] for x in [4.0 + 0.5 * k for k in range(11)]]
        for a, b in zip(pts, pts[1:]):
            n = surf((a.x + b.x) / 2, 1.95, sg)[1]; d = V((n.x, n.y, min(n.z, -0.3))).normalized()
            U.poly([a, b, b + d * 0.22, a + d * 0.22], C['af'], (0, sg, 0.2)); U.poly([a + d * 0.22, b + d * 0.22, b, a], C['af'], (0, -sg, -0.2))
    # the bow thruster's tunnel through the forefoot (FRM-05), the echo sounder's transducer, the sea chest's grille
    p, n, tt = surf(12.35, 2.25, 1); F.thruster_tunnel(U, p, n, 0.22, C['dark'], C['af'], m_prop=C['prop'], fine=fine)
    p, n, tt = surf(12.35, 2.25, -1); F.thruster_tunnel(U, p, n, 0.22, C['dark'], C['af'], m_prop=C['prop'], fine=fine)
    zt = z_on(vline(9.0), 0.7); acyl(U, (9.0, -0.70, zt + 0.02), (9.0, -0.70, zt - 0.03), 0.07, lambda q: C['dark'], seg=16, r1=0.065)
    xi, yi_ = 5.5, 0.8; zi = z_on(vline(xi), yi_)
    for k in range(5): abox(U, xi - 0.10, xi + 0.10, yi_ - 0.08 + 0.04 * k - 0.009, yi_ - 0.08 + 0.04 * k + 0.009, zi - 0.012, zi + 0.02, C['dark'])
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
            c = f.calc_center_median()
            f.material_index = M.mi(C['af'] if c.z < paint_line(c.x, Z_AF) else C['boot'] if c.z < paint_line(c.x, Z_BT) else C['hull'])
    hull = M.done(30)
    if fine: cut_holes(hull)
    else: cut_holes(hull, cutters()[:1])
    tint(hull)
    A = Acc('fit'); G = Acc('glass')
    if fine: linings(A, G, fine)
    station(A, G, fine)
    wh, wg, crown = wheelhouse(fine)
    helm(A, G, fine)
    decks(A, fine); transom(A, fine); rig(A, crown, fine); lanterns_side(A, fine)
    out = [hull, A.done(35, tint=wear), underwater(fine)] + wh + HELM_EXTRA
    g = G.done(35)
    return [o for o in out if o], wg + ([g] if g else [])


def to_game(p): return (-p[1], p[2] - WL, -(p[0] - XM))
def to_game_n(n): return (-n[1], n[2], -n[0])

NAME_X = (10.20, 11.60); NAME_Z = (5.28, 5.70)
def name_strips(G):
    """where the name is written (vessel3d.js nameStrips): on the white side forward under the shelter deck's edge, aft of the
    registration mark's place at the bow (markStrips; maletest: never on each other), clear of the portholes; across the transom on its
    white over the red"""
    out = []
    for sg, xs in ((1, [NAME_X[1] - (NAME_X[1] - NAME_X[0]) * k / 12 for k in range(13)]), (-1, [NAME_X[0] + (NAME_X[1] - NAME_X[0]) * k / 12 for k in range(13)])):
        B = []; T = []
        for x in xs:
            for arr, z in ((B, NAME_Z[0]), (T, NAME_Z[1])): arr.append(G(x, sg * (y_at(x, z, sg) + 0.03), z))
        out.append([B, T])
    w = y_at(0.0, 5.5) * 0.55; ys = [w - 2 * w * k / 12 for k in range(13)]
    out.append([[G(XA - 0.03, y, 5.18) for y in ys], [G(XA - 0.03, y, 5.62) for y in ys]])
    return out

def kit_places(G):
    """the places where the game sets the deck kit (19.10.2026): two liferafts in cradles on the wheelhouse roof's after part, one a side
    by the edge so they float free; four ring buoys on the rail's stanchions aft, outboard; the open array on the mast's platform; the net
    tub and the line tubs on the shelter deck aft to starboard; the deck cargo forward of the crane to port; the knuckle-boom crane (V.crane)
    on the shelter deck aft to port, its booms folded aft over its rest, where it reaches the cargo places, the hatch's side and the quay"""
    r = lambda v: round(v, 3); h = math.pi / 2
    def rail(x, sg):
        return G(x, sg * (gunwale_y(x, sg) + 0.022), z_sd(x) + RAIL_H) + [r(-sg * h)]
    zr = WR + 0.17
    return {'raft': [G(9.75, -2.05, zr) + [r(h)], G(9.75, 2.05, zr) + [r(h)]],
            'buoys': [rail(RAIL_XS[2], -1), rail(RAIL_XS[2], 1), rail(RAIL_XS[9], -1), rail(RAIL_XS[9], 1)],
            'radarA': G(RAD_P[0], 0, RAD_P[1]),
            'garn': {'at': G(4.0, -2.2, sdeck(4.0, 2.2)), 'ry': 0.0},
            'stamps': {'at': G(3.0, -2.1, sdeck(3.0, 2.1)), 'ry': 0.0},
            'cargo': [G(x, y, sdeck(x, y)) + [0.0] for x, y in ((5.2, 1.7), (5.2, 0.6), (6.5, 1.7), (6.5, 0.6), (7.8, 1.7), (7.8, 0.6))],
            'crane': {'at': G(3.2, 1.65, sdeck(3.2, 1.65)), 'ry': r(math.pi), 's': 1.0, 'rest': G(1.15, 1.65, sdeck(1.15, 1.65))}}

def bower(G):
    """the boat's own anchor (tools/deck/anker.py, view3d drawAnchor): a Hall anchor stowed in the starboard hawse pipe, the spare to
    port; the chain from the windlass's gypsy down the pipe"""
    hw = lambda sg: {'fair': G(HAWSE[0], sg * (y_at(HAWSE[0], HAWSE[1], sg) + 0.03), HAWSE[1]), 'pipe': G(HPIPE[0], sg * HPIPE[1], sdeck(HPIPE[0], HPIPE[1]) + 0.05)}
    return dict(hw(-1), kind='hall', kg=120, gypsy=G(WINDLASS, -0.30, sdeck(WINDLASS, 0) + 0.50), side=1, deck=True, spare=hw(1))

def anchors():
    G = lambda x, y, z: [round(v, 3) for v in to_game((x, y, z))]
    fl = sdeck(SKIP[0], SKIP[1]); px, py = POLE; zp = z_cap(0.06) + 0.012
    return {'bower': bower(G), 'eye': G(SKIP[0], SKIP[1], fl + EYE_H), 'skipperAt': G(SKIP[0], SKIP[1], fl), 'hp': HP, 'fov': FOV,
            # the hands (kyst15-grunnlag kap. 6): the fisher at the hauler, the one who bleeds by the tub, the one who guts at the table,
            # one on the shelter deck aft by the crane and the tubs
            'crewSpots': [G(7.05, -2.55, ZMD) + [1.57], G(6.55, -1.70, ZMD) + [1.57], G(5.25, -1.95, ZMD) + [-1.57], G(2.4, -0.6, sdeck(2.4, 0.6)) + [3.14]],
            # typed lights (B8; 12-20 m): the masthead light on the mast's top, the side lights with their screens, the stern light on the
            # mizzen, the fishing lights red over white on their arms; the work lights
            'lights': [[G(MX, 0, white_z()), [1, 0.95, 0.85], 'masthead'],
                       [G(SIDE[0], wy(SIDE[0]) - 0.10, SIDE[1] + 0.03), [1, 0.12, 0.1], 'port'], [G(SIDE[0], -(wy(SIDE[0]) - 0.10), SIDE[1] + 0.03), [0.1, 1, 0.35], 'stbd'],
                       [G(*STERN_L), [1, 0.95, 0.85], 'stern'], [G(MX + LAMP_ARM, 0, FISH_R), [1, 0.12, 0.1], 'fishR'], [G(MX + LAMP_ARM, 0, FISH_W), [1, 0.95, 0.85], 'fishW'],
                       [G(WX0 - 0.08, 0.0, WR - 0.06), [1, 0.95, 0.85], 'work'], [G(7.1, -2.0, CEIL - 0.06), [1, 0.95, 0.85], 'work']],
            # the companion ladder from the station up to the shelter deck (deckMap: the shelter deck lies 2.15 m over the working deck)
            'stairs': [{'from': G(LADDER[1] - 0.10, (LADDER[2] + LADDER[3]) / 2, ZMD), 'to': G(LADDER[0] - 0.25, (LADDER[2] + LADDER[3]) / 2 - 0.25, sdeck(6.7, 1.5))},
                       # (the port corner's door is closed: the way through it to the foredeck)
                       {'from': G(WXS - 0.25, 1.75, sdeck(11.7, 1.75)), 'to': G(12.95, 2.05, sdeck(12.95, 2.05))}],
            'doors': [{'at': G(WX0 - 0.03, (ADOOR[0] + ADOOR[1]) / 2, sdeck(WX0, 1.4)), 'w': round(ADOOR[1] - ADOOR[0], 2), 'h': 1.96,
                       'in': G(WX0 + 0.8, (ADOOR[0] + ADOOR[1]) / 2, sdeck(WX0 + 0.8, 1.4)), 'to': 'helm', 'open': True},
                      {'at': G((IDOOR[0] + IDOOR[1]) / 2, YB - 0.03, ZMD), 'w': round(IDOOR[1] - IDOOR[0], 2), 'h': 1.90, 'in': G((IDOOR[0] + IDOOR[1]) / 2, YB + 0.6, ZMD), 'to': 'deck', 'hinge': 'fwd'}],
            'names': name_strips(G),
            # the work at sea: the fisher at the hauler forward in the opening, the bleeding tub (the game's) just aft of him, her own
            # gutting table along the inboard wall aft, the hold's hatch between them for the gutted fish on ice
            'work': {'table': G((TABLE[0] + TABLE[1]) / 2, (TABLE[2] + TABLE[3]) / 2, ZMD), 'tub': G(TUB[0], TUB[1], ZMD), 'own': True, 'top': round(ZMD + 0.90 - WL, 3)},
            'hatch': G((HOLD[0] + HOLD[1]) / 2, (HOLD[2] + HOLD[3]) / 2, ZMD + 0.13), 'bunk': G(9.8, 1.0, ZMD + 0.6), 'exhaust': G(WX0 - 0.22, 2.05, WR + 1.30),
            'deck': {'y': round(ZMD - WL, 3), 'z': round(-(6.2 - XM), 3)}, 'gw': round(SILL - WL, 3),
            'stern': round(XM - XA, 3), 'bow': round(-(XF - XM), 3), 'side': round(BEAM / 2, 3), 'beam': BEAM, 'pl': 6.0, 'rl': 2.5, 'open': False, 'hand': False,
            'pole': G(px - 0.18, py, zp + 1.42), 'hauler': G(HXX, -(ybi(HXX) - 0.05), SILL + 0.30), 'filler': G(8.9, 2.6, sdeck(8.9, 2.6) + 0.06),
            'kit': kit_places(G)}


# ---------- the checks against the data, the rules and the game's demands (sulebas-bygging kap. 15) ----------
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
    v, amax = displacement(WL); wl1 = WL; st = -0.005 if v > DISP else 0.005
    for _ in range(120):
        if (displacement(wl1)[0] - DISP) * st < 0: wl1 += st
        else: break
    out.append(('deplasement %.1f t ved vannlinja (kjølen med) mot %.0f t i VESSELS (tom båt, Jonas 02.11.2026); %.0f t gir vannlinja %.2f m %s (største snitt %.2f m2)' % (v, DISP, DISP, abs(WL - wl1), 'lavere' if wl1 < WL else 'høyere', amax), abs(v - DISP) / DISP < 0.06))
    xs = [XA + (XF - XA) * i / 400 for i in range(401)]
    loa = XF - (XA - 0.045 - 0.065)
    out.append(('lengde over alt %.2f m (fenderen over speilet til stevnens topp) mot %.2f; skroget %.2f' % (loa, L, XF - XA), abs(XF - XA - L) < 0.02))
    mb = max(ysh(x) for x in xs[::4]); mr = max(max(y_at(x, z_rub(x)) + RUBW, y_at(x, WL + 1.5)) for x in xs[::4]); mw = max(y_at(x, WL) for x in xs)
    out.append(('største bredde %.2f m ved ripa, %.2f over lista, mot %.2f (vannlinja %.2f m, %.0f %%)' % (2 * mb, 2 * mr, BEAM, 2 * mw, 100 * mw / mb), abs(2 * max(mb, mr) - BEAM) / BEAM < 0.03))
    out.append(('dypgang %.2f m med kjølen (skoen under propellen) mot %.2f i VESSELS; kroppen alene %.2f' % (WL - 0.0, DRAFT, WL - min(z_low(x) for x in xs)), abs(WL - DRAFT) < 0.05))
    out.append(('fribord: arbeidsdekket %.2f m over vannet, shelterdekket %.2f midtskips, ripa %.2f ved stevnen og %.2f ved speilet' % (ZMD - WL, z_sd(XM) - WL, z_cap(XF) - WL, z_cap(XA) - WL), ZMD - WL > 0.6))
    # the game's deck map: DM_HEAD 1.85 over a floor (the inner ceiling, not the deck's top)
    out.append(('halestasjonen: %.2f m fri høyde fra arbeidsdekket til taket under shelterdekket (dekkskartet 1.85; brotest 1.8)' % (CEIL - ZMD), CEIL - ZMD >= 1.88))
    out.append(('shelterdekket %.2f m over arbeidsdekket: for høyt for kartets egen lenke (1.6), trappa er ankeret stairs' % (z_sd(7.4) - ZMD), z_sd(7.4) - ZMD > 1.6))
    out.append(('styrhuset: %.2f m fra dørken (dekket med buen) til takets underside (skallet er åpent oppe; brotest 1.8, dekkskartet 1.85)' % (WR - sdeck(11.0, 0)), WR - sdeck(11.0, 0) >= 1.88))
    fl = sdeck(SKIP[0], SKIP[1]); ey = fl + EYE_H
    out.append(('øyet %.2f m over frontvinduenes underkant, %.2f under overkanten' % (ey - WS, WH - ey), ey - WS > 0.3 and WH - ey > 0.05))
    dzm = dz((DASHZ[0] + DASHZ[1]) / 2); dxm = (DASH[0][0] + DASH[1][0]) / 2
    ang = math.degrees(math.atan2(ey - dzm, dxm - SKIP[0])); up = math.degrees(math.atan2(WH - ey, WXF + lean_at(WH) - SKIP[0]))
    out.append(('dashbordet %.0f grader under øyet, vinduets overkant %.0f over (hp %.2f rad og fov %d: synsfeltet går fra %.0f ned til %.0f grader)' % (ang, up, HP, FOV, FOV / 2 - math.degrees(-HP), math.degrees(-HP) + FOV / 2),
                ang <= math.degrees(-HP) + FOV / 2 - 3 and up <= FOV / 2 - math.degrees(-HP) + 12))
    out.append(('rattet %.2f m forut for skipperen, setet %.2f m bak ham; skipperen midt bak styrbord frontrute (y %.2f, ruta %.2f til %.2f)' % (WHEEL[0] - SKIP[0], SKIP[0] - SEAT[0], SKIP[1], -0.82 - 0.37, -0.82 + 0.37),
                0.3 <= WHEEL[0] - SKIP[0] <= 0.55 and SKIP[0] - SEAT[0] >= 0.35 and abs(SKIP[1] + 0.82) < 0.35))
    # the lanterns (FOR-1975-12-01-5 vedlegg I, as read on Lovdata 30.10.2026 for the pilot): 12-20 m
    gw = z_cap(MX); wz = white_z(); sz = SIDE[1] + 0.03
    out.append(('topplanterna %.2f m over ripa (vedlegg I 2(b), 12-20 m: minst 2,5 m)' % (wz - gw), wz - gw >= 2.5))
    out.append(('sidelanternene %.2f m over skroget, topplanterna %.2f (2(g): sidene høyst tre firedeler så høyt, %.2f)' % (sz - z_cap(SIDE[0]), wz - z_cap(SIDE[0]), 0.75 * (wz - z_cap(SIDE[0]))), sz - z_cap(SIDE[0]) <= 0.75 * (wz - z_cap(SIDE[0]))))
    sp = FISH_R - FISH_W
    out.append(('fiskelysene rødt over hvitt %.2f m fra hverandre (2(i)(ii), under 20 m: minst 1 m), det nederste %.2f m over ripa (minst 2 m), det hvite %.2f over sidelanternene (2(j): minst to ganger avstanden, %.2f)' % (sp, FISH_W - z_cap(MX), FISH_W - sz, 2 * sp),
                sp >= 1.0 and FISH_W - z_cap(MX) >= 2.0 and FISH_W - sz >= 2 * sp))
    px, py = POLE
    out.append(('topplanterna %.1f m fra flaggstanga og %.1f m over den: spillet gir vimpel (mastTop)' % (math.hypot(MX - px, py), wz - (z_cap(0.06) + 1.43)), math.hypot(MX - px, py) > 1.0 and wz > z_cap(0.06) + 1.5))
    tip = PROP[2] + PR; low = PROP[2] - PR
    out.append(('propellen Ø %.2f: %.2f m klaring til skroget over, %.2f til skoen under, %.2f til kjølen forut, %.2f til roret akter' % (2 * PR, z_low(PROP[0] + 0.1) - tip, low - 0.10, X_KA - PROP[0] - 0.10, PROP[0] - 0.10 - (RX_ + 0.72 - 0.72)),
                z_low(PROP[0] + 0.1) - tip > 0.10 and low - 0.10 > 0.05 and X_KA - PROP[0] - 0.10 > 0.15 and PROP[0] - 0.10 - RX_ > 0.15))
    # the work (kap. 19): the sill a rail for the hauler and the jigging machines (jigRail: 0.35-1.3 m over the deck), the places apart
    out.append(('haleplassens ripe %.2f m over arbeidsdekket (jigRail: 0.35-1.3); åpningen %.2f m høy, %.2f m lang' % (SILL - ZMD, HEAD - SILL, OP1 - OP0), 0.35 <= SILL - ZMD <= 1.3 and HEAD - SILL >= 0.8))
    out.append(('haleren ved x %.2f, karet %.2f m akter for ham, luka mellom karet og bordet (%.2f-%.2f), bordet %.2f-%.2f langs innerveggen; juksaplassene %s, %.2f m fri av haleren' % (HXX, HXX - TUB[0], HOLD[0], HOLD[1], TABLE[0], TABLE[1], JIGX, HXX - max(JIGX)),
                HXX - TUB[0] >= 0.5 and HXX - max(JIGX) > 0.6 and HOLD[3] < TABLE[2] - 0.15))
    # the name and the mark (maletest): the mark at the bow on 14.99 m (markStrips: under 15 m 0.25 m letters, a 0.34 m strip ~0.11 L
    # from the stem), the name aft of it
    xm_ = XF - 0.11 * L
    out.append(('navnefeltene x %.2f-%.2f, z %.2f-%.2f; merket ved x %.2f forut for dem (maletest: aldri oppå hverandre)' % (NAME_X[0], NAME_X[1], NAME_Z[0], NAME_Z[1], xm_), NAME_X[1] < xm_ - 0.6))
    # vessel3d: the hull from 0.3 m under the water to 1.5 m over it, with what stands out over the rail
    z0b, z1b = WL - 0.3, WL + 1.5
    ln = max(x for x in xs if z_low(x) < z1b) - XA + 0.045 + 0.065
    out.append(('vessel3d: skroget i båndet -0.3 til 1.5 m er %.2f m langt (lengden %.2f, -6 %% til +3 %%) og %.2f m bredt (bredden %.2f, ±5 %%)' % (ln, L, 2 * mr, BEAM), -0.06 < (ln - L) / L < 0.03 and abs(2 * mr - BEAM) / BEAM < 0.05))
    # the hull's fairness (sulebas-bygging kap. 16)
    worst = (0.0, 0, 0)
    for z in (1.6, 2.2, 2.7, 3.0, 3.5, 4.2, 5.0):
        xs3 = [2.5 + 0.06 * i for i in range(200) if z_low(2.5 + 0.06 * i + 0.18) < z - 0.05 and 2.5 + 0.06 * i < 14.6]
        yv = [y_at(x, z) for x in xs3]; d = [b - a for a, b in zip(yv, yv[1:])]
        for i in range(1, len(d)): worst = max(worst, (abs(d[i] - d[i - 1]), xs3[i], z))
    out.append(('vannlinjene jevne: største endring i stigningen %.3f m per 6 cm-steg (ved x %.2f, z %.2f; en bule synes over rundt 0,02)' % worst, worst[0] < 0.02))
    for s, ok_ in out: print(('OK   ' if ok_ else 'FEIL ') + s)
    return all(o for _, o in out)


SHOTS = [('bow3q', (26.0, -16.0, 7.0), (7.5, 0, 5.0), 35), ('stern3q', (-10.0, 13.0, 9.0), (6.0, 0, 5.0), 35), ('side', (7.5, -31, 5.0), (7.5, 0, 5.4), 35),
         ('above', (20.0, -13.0, 20.0), (7.5, 0, 4.5), 35), ('haul', (8.6, -8.0, 5.6), (6.0, -2.2, 4.6), 35)]
ZC = ZMD
K5 = ((4.85, -2.2, ZMD + 1.70), (7.5, -2.6, ZMD + 0.8))      # in the hauling station, looking forward at the hauler's place
EYE = (SKIP[0], SKIP[1], sdeck(SKIP[0], SKIP[1]) + EYE_H)
CLOSE = [('c_helm', (11.10, -0.70, 8.0), (12.20, -1.10, 7.05), 30, False, False), ('c_wh', (16.5, -7.5, 8.6), (11.0, -0.4, 7.4), 30, True, False),
         ('c_stern', (-6.0, -4.5, 6.6), (0.3, 0, 5.0), 32, True, False), ('c_bow', (19.0, -4.5, 6.0), (13.6, 0, 5.0), 30, True, False),
         ('c_aperture', (1.2, -4.2, 0.9), (1.1, 0, 0.8), 30, False, False), ('c_haul', (6.2, -7.2, 5.6), (6.2, -2.4, 4.9), 30, True, False),
         ('c_station', (4.85, -2.9, ZMD + 1.75), (7.4, -1.6, ZMD + 0.5), 26, False, False), ('c_shelter', (-1.5, -2.8, 8.8), (5.0, 0.4, 6.2), 30, True, False),
         ('c_fore', (10.4, 0.6, 9.4), (13.8, 0, 6.4), 30, True, False), ('c_rig', (16.0, -8.0, 11.0), (9.5, 0.0, 10.0), 35, True, False),
         ('c_ladder', (5.0, -2.3, ZMD + 1.4), (7.4, -1.25, ZMD + 1.2), 28, False, False),
         ('K6p', (7.5 + 40.0, 30.0, 6.0), (7.5, 0, 4.5), 100, True, True)]

def main():
    os.makedirs(OUT, exist_ok=True)
    if 'check' in sys.argv: sys.exit(0 if check() else 1)
    check()
    reset(); colours()
    solids, glass = build(True)
    join(solids, 'BOAT0'); join(glass, 'GLASS0')
    if 'fast' not in sys.argv and 'dry' not in sys.argv: beauty(OUT, 'k15', WL, SHOTS)
    sS = sail_set(True); sF = sail_furled(True)
    for o in (sS, sF): o.hide_render = True
    ns = max(len(o.data.polygons) for o in (sS, sF)) * 2
    bpyutil.LODM_TRIS = 40000 - ns
    ex = {'frame': 'kystfiske: x starboard, y up from the waterline, z aft; metres', 'type': 'kyst15', 'name': 'Coastal vessel 14.99 m',
          'len': L, 'beam': BEAM, 'draft': DRAFT, 'anchors': anchors()}
    export_boat(build, to_game, to_game_n, OUT, 'kyst15.glb', os.path.join(ROOT, 'src', 'data', 'boat-kyst15.b64'), ex,
                side=(os.path.join(ROOT, 'src', 'data', 'boat-kyst15-side.b64'), 7.0, 5.6, 19.0), dry='dry' in sys.argv,
                more=[{'name': 'sail', 'obj': sS, 'ao': False, 'show': False}, {'name': 'sailf', 'obj': sF, 'ao': False, 'show': False}])


if __name__ == '__main__':
    main()
