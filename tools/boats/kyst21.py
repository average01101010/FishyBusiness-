"""The older coastal vessel (kyst21, «Eldre kystbåt 21 m, garn og line»): a 21 m steel boat from 1978 with a forecastle (bakk), a
cruiser stern (rundgatt) and a gallows (galge), after the pictures of old Norwegian coastal boats Jonas showed on 06.10.2026 (Hindholmen,
Erkna; they are not in the repository, and no drawing is known). The game's size stands (VESSELS.kyst21: 21 x 7.2 m, 3.4 m draft, 190 t
the empty boat). Jonas let us choose the colour («Skroget trenger ikke være grønt»): an oxblood hull with a white sheer line, a black
bottom, a varnished teak wheelhouse on a white deckhouse, cream masts and derrick.

Rebuilt 11.11.2026 (OB13, steg 91) after the pilot boat's way of working (docs/skipsmodeller/kyst21-grunnlag.md, sulebas-bygging.md;
kyst15.py and malo36.py the template for the code, not the shape). The old hull was rows of superellipse sections with patches at the
ends, a box keel and a box deadwood under it, and weighed some 249 t against the data's 190 t; the forecastle's deck lay 1.0 m over the
main deck with a door 0.86 m high in its face; the deckhouse ran to the round stern, so the nets and the line went out through it (F20);
the decks, the house and the hatch were boxes, the freeing ports missing. Now the hull is ONE surface (Mesh): both sides over the bar
keel from the cruiser stern's tip to the stem, the half-round fender at the deck's height, the white sheer line, the white plating of the
forecastle (the whaleback), the bulwark's cap and its inside, the main deck, the forecastle's face and the forecastle deck share their
points. Openings are real holes, cut with a boolean and lined: the freeing ports (no flaps, valg 26), the hawse pipes, the portholes, the
forecastle's door, the outlets.

The arrangement, the places of the work first (sulebas-bygging kap. 19): an after deck behind the deckhouse where the nets stand in
their tubs and the gear goes out over a roller in the stern's bulwark (kit.setter, F20); the deckhouse with the teak wheelhouse on its
forward part, the funnel and the mizzen on the boat deck; the open working deck with the hauler's place on the starboard rail under the
gallows, the bleeding tub (the game's) just aft of it, her own gutting table for three along the bulwark aft of that, the hold's hatch
amidships, the line tubs, the pots' stacks and the deck cargo to port; the mast with its legs and its derrick at the forecastle's
break, the ladder up to the forecastle, the windlass and the crane's place (the game's, to port: she lies port side to, F22) on it.
Nothing that can be bought is modelled in (19.10.2026): no hauler, no tubs, no liferaft, no radar, no ring buoys, no crane. No maker's
or yard's name anywhere (CLAUDE.md).

    python3.11 -m pip install bpy==4.5.4
    python3.11 tools/boats/kyst21.py            -> src/data/boat-kyst21.b64 (+ the side picture), renders in tools/boats/out/
    python3.11 tools/boats/kyst21.py fast       -> the same without the renders
    python3.11 tools/boats/kyst21.py fast dry   -> no renders, the GLB only in tools/boats/out
    python3.11 tools/boats/kyst21.py check      -> the checks against the data, the rules and the game's demands only

Frame: x forward from the rudder stock, y to port, z up from the keel's underside aft; the waterline is z = WL = 3.4 (the data's draft:
the keel's heel is the deepest point). The hull runs from XA = -1.6 (the cruiser stern's tip) to XF = 19.4 (the stem's top)."""
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy, bmesh
from bpyutil import *
import bpyutil
import fittings as F
import potplaces   # the stacks of conical pots (OB16, tools/boats/potplaces.json)
from mathutils import noise

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE)); OUT = os.path.join(HERE, 'out')
L = 21.0; BEAM = 7.2; DRAFT = 3.4; DISP = 190.0              # VESSELS.kyst21 (disp: the empty boat, valg 18 A)
WL = 3.4; XA = -1.6; XF = 19.4; XM = (XA + XF) / 2           # XM the game's midship
X_FC = 14.6                  # the forecastle's break (its after face)
BRK = 0.9                    # the bulwark sweeps up to the forecastle's plating over this length aft of the break
BW = 0.95                    # the bulwark's height over the main deck at the side (the rail the hauler and the jigging machines stand on)


# ---------- the lines (chosen: no drawing; the old model's heights over the water kept, the bottom drawn new for 190 t), read smooth ----------
def ss(a, b, x): t = max(0.0, min(1.0, (x - a) / (b - a))); return t * t * (3 - 2 * t)
_PC = {}
def pchip(tab, x):
    """a smooth curve through the table's points (monotone cubic, Fritsch-Carlson; hurtig11.py, sulebas-bygging kap. 17)"""
    k = tuple(tab)   # (by content: a table made anew each call got a freed id back for another, krabbe50.py 07.11.2026)
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

# the sheer (the main bulwark's top, and forward of the break the line where the oxblood hull meets the white whaleback): 1.9 m over the
# water amidships as the old model's, rising to the stem and a little to the stern
SHEER = [(XA, 5.78), (0.0, 5.60), (2.0, 5.46), (5.0, 5.34), (8.0, 5.30), (11.0, 5.36), (13.0, 5.48), (X_FC, 5.68), (16.5, 6.12), (18.2, 6.66), (XF, 7.12)]
def z_sheer(x): return pchip(SHEER, x)
def z_md(x): return z_sheer(x) - BW                               # the main deck at the side
# the forecastle deck at the side, 1.97 m over the main deck at the break (a door a man walks through), and its plating's top a low
# foot bulwark over it (the rail stands on that)
FCD = [(X_FC, 6.70), (17.0, 6.84), (XF, 7.04)]
def z_fc(x): return pchip(FCD, x)
FCB = 0.22
def z_cap(x, sg=1):
    s = z_sheer(x); return s + (z_fc(max(x, X_FC)) + FCB - s) * ss(X_FC - BRK, X_FC, x)
# the body's bottom on the centreline: the counter of the cruiser stern from its tip down to the stern post, the run, the flat of the
# keel's root amidships, the forefoot and the raked stem (x grows along it all the way)
LOW = [(XA, 5.78), (-1.57, 5.15), (-1.5, 4.70), (-1.35, 4.30), (-1.05, 3.92), (-0.55, 3.52), (0.0, 3.14), (0.5, 2.82), (1.4, 2.22), (2.6, 1.56), (4.0, 1.04), (5.5, 0.78), (7.5, 0.64), (10.0, 0.60),
       (12.5, 0.70), (14.5, 0.98), (16.0, 1.46), (17.2, 2.12), (18.0, 2.84), (18.55, 3.50), (18.9, 4.30), (19.15, 5.25), (19.3, 6.20), (XF, 7.30)]
def z_low(x): return pchip(LOW, x)
# the bar keel's underside, deepest at its heel under the propeller (the data's 3.4 m; she trims by the stern as the old boats do),
# running into the forefoot at X_KF
X_KA, X_KF = 1.55, 15.6
KEEL = [(X_KA, 0.02), (4.0, 0.08), (7.0, 0.18), (10.0, 0.34), (13.0, 0.62), (14.6, 0.92), (X_KF, 1.32)]
def kb(x):
    if x > X_KF: return z_low(x)
    k = pchip(KEEL, x); return k + (z_low(x) - k) * ss(14.0, X_KF, x)    # (blended into the forefoot so the profile has no kink at X_KF)
def keel_t(x): return pchip([(X_KA, 0.30), (3.0, 0.34), (11.0, 0.34), (X_KF, 0.24)], x)
# the half-breadth at the bulwark's top, moulded: the cruiser stern round in plan, the bow drawn in to the stem
HB = [(XA, 0.0), (-1.57, 0.62), (-1.48, 1.08), (-1.3, 1.58), (-1.0, 2.08), (-0.5, 2.58), (0.2, 3.00), (1.2, 3.32), (2.5, 3.50), (4.5, 3.59), (8.0, 3.60), (11.0, 3.57),
      (13.0, 3.43), (X_FC, 3.16), (16.0, 2.74), (17.2, 2.16), (18.1, 1.52), (18.8, 0.86), (19.2, 0.36), (XF, 0.0)]
def hb(x): return max(0.0, pchip(HB, x))
# the section: its deadrise, the flare and the fullness of the bilge (weighed in check() against the 190 t)
DR = [(XA, 40), (-1.0, 30), (0.0, 24), (1.5, 17), (3.5, 11), (6.0, 8), (10.0, 8), (13.0, 12), (15.0, 21), (16.5, 36), (17.8, 54), (18.8, 66), (XF, 74)]
FL = [(XA, 12), (-0.8, 9), (0.5, 6), (2.5, 3), (5.0, 1), (10.0, 1), (13.0, 4), (15.0, 9), (16.5, 14), (18.0, 19), (XF, 22)]
FULL = [(XA, 0.70), (0.0, 0.74), (2.0, 0.80), (5.0, 0.86), (10.0, 0.87), (13.0, 0.84), (15.5, 0.72), (17.5, 0.58), (XF, 0.46)]
# the half-round steel fender at the main deck's height (and on along the bow), the oxblood's top under the white sheer line, the bottom
# paint and the black boot top
def z_rub(x): return z_sheer(x) - BW - 0.11
RUBH, RUBW = 0.06, 0.06
def z_red(x): return z_sheer(x) - 0.20
Z_AF = WL - 0.03; Z_BT = WL + 0.14; SLB = 0.006
def paint_line(x, z0): return z0 + SLB * (x - XM)


# ---------- the sections (malo36.py: the body as one cubic, the keel in the section) ----------
def vline(x, sg=1):
    """the body's half-section at x from the centreline (the bottom of the body) to the bulwark's top, as (y, z): a cubic from the keel's
    root out along the deadrise and round the bilge up along the flare to the sheer, its control points pulled toward the corner by the
    fullness; the corner held soft where the ends' lines meet over the keel (malo36.py vline)"""
    zl = z_low(x); zs = z_sheer(x); h = hb(x); n = 48; zc = z_cap(x, sg)
    if h < 1e-4 or zs - zl < 1e-4: return [(0.0, zl), (0.0, max(zc, zl + 1e-6))]
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
    # (the forecastle's plating over the sheer: straight on up from the sheer, leaning out a little less than the flare under it. The
    # body is drawn to the sheer whatever stands over it, or the fender under the break would wave where the bulwark sweeps up)
    if zc > zs + 1e-4:
        tl = math.tan(fl * 0.6)
        for k in range(1, 5): z = zs + (zc - zs) * k / 4; out.append((h + (z - zs) * tl, z))
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
    return pchip([(X_KF, keel_t(X_KF) * 0.36), (17.5, 0.05), (XF, 0.035)], x)
def wroot(x): return wk(x) * 1.6 if x <= X_KF else wk(x)

NKB, NF = 4, 3
_S = {}
def section(x, sg=1, fine=True):
    """the whole half-section at x as (y, z, kind) from the keel's underside on the centreline to the bulwark's top; the counts never
    change (points collapse where a band is empty). Kinds (of the face from a point up to the next): 'k' the keel, 'f' the fillet at
    its root, 'b' the bottom, 't' the oxblood topside, 'r' the fender, 'u' the white sheer line, 'w' the white whaleback over the sheer
    forward, 's' the top"""
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
    nb, nt = (20, 8) if fine else (4, 2)
    zw = cl(WL + 0.25); out += [(yy, zz, 'b') for yy, zz in along(body, z0, zw, nb)]
    zr0 = cl(z_rub(x) - RUBH); out += [(yy, zz, 't') for yy, zz in along(body, zw, zr0, nt)]
    fade = (1.0 - ss(18.9, 19.3, x)) * ss(XA + 0.03, XA + 0.35, x)
    for dz, off in (((-0.054, 0.38), (-0.038, 0.74), (-0.016, 0.97), (0.016, 0.97), (0.038, 0.74), (0.054, 0.38), (RUBH, 0.0)) if fine else ((0.0, 1.0), (RUBH, 0.0))):
        zq = cl(z_rub(x) + dz); yy, zz = at_z(body, zq); out.append((yy + RUBW * off * fade, zz, 'r' if off > 0 else 't'))
    zr1 = cl(z_rub(x) + RUBH); zrd = cl(z_red(x)); zsh = cl(z_sheer(x))
    tp = along(body, zr1, zrd, 3 if fine else 1); out += [(yy, zz, 't') for yy, zz in tp[:-1]] + [(tp[-1][0], tp[-1][1], 'u')]
    up = along(body, zrd, zsh, 2 if fine else 1); out += [(yy, zz, 'u') for yy, zz in up[:-1]] + [(up[-1][0], up[-1][1], 'w')]
    out += [(yy, zz, 'w') for yy, zz in along(body, zsh, top, 7 if fine else 2)[:-1]]
    out.append((P[-1][0], top, 's'))
    _S[key] = out; return out

def y_at(x, z, sg=1):
    """the outside's half-breadth at x and height z (the body; the keel under its root)"""
    P = vline(x, sg)
    if z <= P[0][1]: return wk(x) if x >= X_KA else 0.0
    return at_z(P, z)[0]

def stations(fine=True):
    sp = [XA, X_KA - 0.002, X_KA, X_KA + 0.05, X_KA + 0.10, X_KF, X_FC - BRK, X_FC - 0.004, X_FC]
    if fine:
        xs = [XA + d for d in (0.004, 0.010, 0.02, 0.035, 0.055, 0.08, 0.11, 0.15, 0.20, 0.26, 0.33, 0.41, 0.50)] + [-1.0 + 0.055 * i for i in range(354)] + [18.44 + 0.035 * i for i in range(27)]
        tops = [Z_AF, Z_BT, lambda x: z_rub(x) - RUBH, lambda x: z_rub(x) + RUBH, z_red, z_sheer]
        sp += stem_stations(lambda x: z_low(x) if x > X_KF else kb(x), tops, 15.0, XF - 0.012)
        # (the same at the cruiser stern, whose profile rises aft: mirrored, so it rises along the search)
        sp += [-t for t in stem_stations(lambda t: z_low(-t), [(lambda t, f=f: f(-t)) if callable(f) else f for f in tops], -3.0, -(XA + 0.006))]
    else:
        xs = [-1.45, -1.1, -0.5, 0.4, 2.0, 4.0, 6.0, 8.0, 10.0, 12.0, 13.7, 15.4, 16.6, 17.6, 18.4, 18.9, 19.2]
    xs = [x for x in xs if all(abs(x - s) > 0.01 for s in sp)] + sp + [XF - 0.006, XF]
    return sorted(set(round(x, 5) for x in xs if XA <= x <= XF))


# ---------- colours: oxblood, white, teak and cream (paint zones: 1 the hull, 2 the sheer line, the fender and the boot top, 3 the white
# upper works and the superstructure, 4 the decks; 10j-paint.js) ----------
C = {}
def colours():
    w = lambda n, rgb, g=0.4, z=0, metal=0.0, emit=0.0: C.__setitem__(n, mat(n, rgb, g, zone=z, metal=metal, emit=emit))
    w('af', (0.07, 0.07, 0.075), 0.15); w('boot', (0.05, 0.05, 0.06), 0.5, 2); w('hull', (0.34, 0.06, 0.06), 0.55, 1)
    w('strake', (0.06, 0.06, 0.07), 0.4, 2); w('line', (0.90, 0.90, 0.88), 0.5, 2); w('white', (0.90, 0.90, 0.88), 0.5, 3); w('cap', (0.86, 0.86, 0.84), 0.45, 3)
    w('roof', (0.80, 0.81, 0.80), 0.3, 3); w('inner', (0.80, 0.80, 0.77), 0.3); w('deck', (0.36, 0.33, 0.30), 0.12, 4); w('nonslip', (0.33, 0.31, 0.29), 0.06, 4)
    w('teak', (0.42, 0.22, 0.10), 0.6); w('teakd', (0.26, 0.13, 0.06), 0.5); w('cream', (0.90, 0.80, 0.56), 0.45); w('tarp', (0.20, 0.26, 0.30), 0.2)
    w('steel', (0.62, 0.64, 0.66), 0.75, 0, 0.7); w('galv', (0.55, 0.57, 0.58), 0.4, 0, 0.5); w('alu', (0.72, 0.74, 0.76), 0.6, 0, 0.7)
    w('dark', (0.09, 0.10, 0.11), 0.25); w('black', (0.04, 0.04, 0.05), 0.4); w('rubber', (0.05, 0.05, 0.06), 0.2); w('red', (0.70, 0.08, 0.06), 0.45)
    w('frame', (0.07, 0.07, 0.08), 0.45); w('screen', (0.03, 0.05, 0.07), 0.9); w('bezel', (0.10, 0.10, 0.11), 0.5); w('cush', (0.15, 0.16, 0.19), 0.35)
    w('switch', (0.20, 0.21, 0.22), 0.4); w('board', (0.24, 0.25, 0.27), 0.35); w('cabin', (0.05, 0.05, 0.06), 0.2); w('sole', (0.30, 0.31, 0.32), 0.2)
    w('prop', (0.70, 0.52, 0.27), 0.8, 0, 0.9); w('anode', (0.55, 0.56, 0.55), 0.2); w('wood', (0.58, 0.38, 0.20), 0.3); w('rope2', (0.72, 0.62, 0.38), 0.2)
    w('hose', (0.10, 0.36, 0.20), 0.4); w('orange', (0.95, 0.38, 0.06), 0.45); w('brass', (0.72, 0.58, 0.28), 0.8, 0, 0.8)
    w('lampR', (0.90, 0.10, 0.08), 0.8, 0, 0, 0.5); w('lampG', (0.10, 0.80, 0.25), 0.8, 0, 0, 0.5); w('lampW', (1.0, 0.97, 0.88), 0.8, 0, 0, 0.5)
    w('lens', (0.95, 0.94, 0.85), 0.9)
    w('scr_plot', (0.10, 0.22, 0.42), 0.9, 0, 0, 0.6); w('scr_land', (0.55, 0.48, 0.28), 0.9, 0, 0, 0.5); w('scr_sound', (0.06, 0.10, 0.35), 0.9, 0, 0, 0.6)
    w('scr_bottom', (0.70, 0.25, 0.08), 0.9, 0, 0, 0.6); w('scr_ais', (0.04, 0.16, 0.12), 0.9, 0, 0, 0.6); w('scr_eng', (0.08, 0.08, 0.10), 0.9, 0, 0, 0.4)
    C['glass'] = mat('glass', (0.05, 0.08, 0.11), 0.95)


# ---------- the wear of a steel boat from 1978 (B16): per corner, so it runs across faces ----------
def n3(x, y, z=0.0): return noise.noise(V((x, y, z)))
def toward(m, rgb, k):
    base = m['rgb']; return [1 + (rgb[i] / max(base[i], 1e-3) - 1) * k for i in range(3)]
RUST = (0.42, 0.20, 0.08)
FREE = [(2.9, 0.5), (4.6, 0.5), (6.3, 0.5), (8.4, 0.55), (9.9, 0.55), (11.4, 0.55), (12.9, 0.55)]   # the freeing ports in the main bulwark at the deck (x from, length), both sides
FREE_A = [(0.6, 0.45)]                                                                              # and in the quarters
EXH_W = (5.2, -1, 0.40)      # the engine's cooling water outlet (x, side, height over the water)
BILGE = (7.0, 1, 0.48)       # the bilge pump's outlet
def wear(p, m, n):
    x, y, z = p; nm = m.name; side = 1 if y > 0 else -1
    if nm == 'hull':
        g = (0.93 + 0.09 * n3(x * 3.0, z * 5.0, side * 1.3)) * (1 - 0.12 * ss(0.40, 0.0, z - paint_line(x, Z_BT)))
        # rust weeping down from the freeing ports and from the fender's weld, scuffs from quays under the fender
        k = 0.22 * ss(0.55, 0.9, n3(x * 11.0, z * 9.0, side * 2.2))
        zf = z_md(x)
        for x0, l in FREE + FREE_A:
            if x0 - 0.05 < x < x0 + l + 0.05 and z < zf: k += 0.55 * ss(1.5, 0.0, zf - z) * (0.5 + 0.5 * n3(x * 9.0, side * 3.7, 0.9))
        k += 0.25 * ss(0.5, 0.9, n3(x * 5.5, side * 3.7, 0.9)) * ss(0.9, 0.0, zf - z) * (z < zf)
        for (xo, so, ho), kk in ((EXH_W, 0.25), (BILGE, 0.15)):
            if side == so and z < WL + ho: g *= 1 - kk * ss(0.02 + (WL + ho - z) * 0.04, 0.004, abs(x - xo)) * ss(WL, WL + 0.12, z)
        t = toward(m, RUST, min(0.8, k)); return [t[0] * g, t[1] * g, t[2] * g]
    if nm == 'af':
        v = 0.86 + 0.20 * n3(x * 2.5, z * 6.0, y * 2.0)
        g = ss(WL - 0.12, WL - 0.02, z) * (0.5 + 0.5 * ss(-0.3, 0.4, n3(x * 3.0, side * 1.3, 4.1)))
        return [v * (1 + 0.5 * g), v * (1 + 0.9 * g), v * (1 + 0.4 * g)]
    if nm in ('boot', 'strake'):
        v = 0.90 + 0.25 * n3(x * 4.0, z * 9.0, side); return [v * 1.15, v, v * 0.95]
    if nm in ('white', 'line', 'inner', 'cap', 'roof'):
        k = 0.42 * ss(0.55, 0.9, n3(x * 7.0, y * 7.0, z * 7.0 + 0.5)) + 0.16 * ss(0.6, 0.9, n3(x * 2.0, y * 2.0, z * 2.0))
        if nm == 'inner' and x < X_FC: k += 0.25 * ss(0.25, 0.0, z - z_md(x))          # the waterway under the bulwark
        v = 0.95 + 0.05 * n3(x * 5.0, y * 5.0, z * 5.0); t = toward(m, RUST, min(0.7, k)); return [t[0] * v, t[1] * v, t[2] * v]
    if nm in ('deck', 'nonslip', 'sole'):
        v = 0.86 + 0.26 * n3(x * 3.0, y * 3.0, 0.2)
        v *= 1 - 0.14 * ss(1.0, 0.0, math.hypot(x - HX, y + 2.9)) - 0.10 * ss(1.0, 0.0, math.hypot(x - 9.3, y + 2.5))   # worn where they work
        return [v, v, v * 0.97]
    if nm == 'cream':
        return toward(m, RUST, 0.5 * ss(1.2, 0.0, z - z_md(x) - 0.2) * ss(0.3, 0.8, n3(x * 9.0, y * 9.0, z * 9.0)) + 0.12 * ss(0.6, 0.9, n3(x * 6.0, y * 6.0, z * 3.0)))
    if nm == 'teak':
        v = 0.90 + 0.22 * n3(x * 2.0, y * 2.0, z * 14.0); return [v, v * 0.98, v * 0.95]
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
    def done(s, angle=30):
        bmesh.ops.remove_doubles(s.bm, verts=s.bm.verts[:], dist=1e-5)
        bmesh.ops.dissolve_degenerate(s.bm, edges=s.bm.edges[:], dist=1e-6)
        return shade(obj_from_bm(s.name, s.bm, s.mats), angle)


# ---------- the hull: the outside over the keel, the bulwark's cap and inside, the main deck, the forecastle's face and its deck ----------
CAP = 0.07
def ysh(x, sg=1): return section(x, sg)[-1][0]
def ycap(x, sg=1): return max(0.0, ysh(x, sg) - CAP)
def ybw(x, z=None, sg=1): return max(0.0, y_at(x, z_md(x) if z is None else z, sg) - 0.065)      # the bulwark's inside at the deck
def mdeck(x, y):
    e = max(0.3, ybw(x)); return z_md(x) + 0.06 * (1 - min(1.0, (y / e) ** 2))
def fdeck(x, y):
    e = max(0.3, ybw(x, z_fc(x))); return z_fc(x) + 0.05 * (1 - min(1.0, (y / e) ** 2))

HULL_MAT = {'k': 'af', 'f': 'hull', 'b': 'hull', 't': 'hull', 'r': 'strake', 'u': 'line', 'w': 'white', 's': 'white'}
HULL_KIND = {'r': 3, 'u': 4, 'w': 5, 's': 5}
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
    # ---- the bulwark's cap and its inside down to the deck, the deck across in rows (a big flat face goes dark, kap. 19): the main deck
    # to the break, the forecastle's face up from it, the forecastle deck to the stem ----
    ND = 22 if fine else 2
    def row(x, zd, cam):
        """across at x with the deck's edge at height zd: the cap's outer and inner edge, the inside's top, the deck's edge, the deck"""
        zd = max(zd, z_low(x) + 0.03); s = z_cap(x); e = ybw(x, zd)
        edge = lambda sg: [(x, sg * ysh(x), s), (x, sg * ycap(x), s + 0.012), (x, sg * max(0.0, ycap(x) - 0.006), s - 0.03), (x, sg * e, zd)]
        mid = [(x, e * (1 - 2 * i / ND), zd + cam * (1 - (1 - 2 * i / ND) ** 2)) for i in range(1, ND)]
        return edge(1) + mid + list(reversed(edge(-1)))
    R = []   # (row, tag): 'm' the main deck, 'b' up the forecastle's face, 'f' the forecastle deck
    xb = round(X_FC - 0.004, 5); NBK = 6 if fine else 1
    for x in xs:
        if ysh(x) < 0.02: continue
        if x <= xb + 1e-9: R.append((row(x, z_md(x), 0.06), 'm'))
        if abs(x - xb) < 1e-9:
            for k in range(1, NBK): R.append((row(x, z_md(x) + (z_fc(X_FC) - z_md(x)) * k / NBK, 0.06 + (0.05 - 0.06) * k / NBK), 'b'))
        if x >= X_FC - 1e-9: R.append((row(x, z_fc(x), 0.05), 'f'))
    n = len(R[0][0])
    for i in range(len(R) - 1):
        (Ra, ta), (Rb, tb) = R[i], R[i + 1]; deck = ta == tb and ta != 'b'
        for j in range(n - 1):
            if j in (0, 1, n - 3, n - 2): m, out = C['cap'], (0, 0, 1)
            elif j == 2: m, out = C['inner'], (0, -1, 0)
            elif j == n - 4: m, out = C['inner'], (0, 1, 0)
            elif deck: m, out = (C['nonslip'] if ta == 'f' else C['deck']), (0, 0, 1)
            else: m, out = C['white'], (-1, 0, 0)
            M.f([Ra[j], Rb[j], Rb[j + 1], Ra[j + 1]], m, out)
    for (Rr, _), o in ((R[0], (-1, 0, 0)), (R[-1], (1, 0, 0))): M.f([Rr[0], Rr[n - 1], Rr[n // 2]], C['cap'], (0, 0, 1))
    return S


# ---------- the places of the work (kap. 19: laid in before the walls and the windows) ----------
DH0, DH1, DHY = 2.40, 8.00, 2.45     # the deckhouse: the after deck aft of it, the working deck forward, side decks 0.9 m wide past it
HX = 12.00                   # the hauler on the starboard rail (anchors.hauler), under the gallows' after leg
HFOOT = 0.20                 # its post's foot this far inside the bulwark's inside on the deck (anchors.haulerFoot)
GAL = (12.55, 13.45)         # the gallows' two legs on the starboard rail, forward of the hauler (the block hangs between them)
TUB = (11.00, None)          # the bleeding tub (the game's, 0.72 x 1.08 m) by the bulwark just aft of the fisher at the hauler; y from the hull below
TABLE = (8.30, 10.30)        # her own gutting table along the starboard bulwark aft of the tub: 2.0 m, three side by side at 0.7 m (F19)
TABLE_W = 0.58
HATCH = (9.40, 11.80, -1.10, 1.10); HATCH_H = 0.60      # the hold's hatch amidships under its tarpaulin
PACK = (10.20, -1.62)        # the one who ices stands at the hatch's starboard coaming, facing it (work.pack)
STAMP = (11.35, 2.76)        # the line tubs' place to port of the hatch: the block of eight (0.78 x 2.02 m) lies 0.26 m to starboard and 0.75 m aft of it
GARN = (0.75, -0.55)         # the first net tub (1.0 x 1.2 m) on the after deck, straight forward of the stern's roller; the rest beside it (deckcrew.js netTubs)
SETY = -0.55                 # the setting roller in the stern's bulwark, to starboard of the staff (kit.setter)
# the pots' stacks (a 1.45 m ring each; tools/boats/potplaces.json holds the same in the game's frame): three across the deck forward of
# the hatch, clear of the hauler's hands, and one on the hatch's forward end
POTS = [(13.00, -0.75, 0.0, 8), (13.00, 0.75, 0.0, 8), (13.00, 2.25, 0.0, 7), (11.10, 0.0, HATCH_H, 7)]
# the deck cargo (0.8 x 1.2 m each; ry): four across the deck between the house and the hatch, one on the hatch's after end
CARGO = [(8.70, 0.30, 0.0, 0.0), (8.70, 1.25, 0.0, 0.0), (8.70, -0.65, 0.0, 0.0), (8.70, 2.20, 0.0, 0.0), (9.84, 0.0, HATCH_H, math.pi / 2)]
CRANE = (15.35, 2.00)        # the crane's foot (the game's, kit.crane) on the forecastle deck at its after edge to port: over the hatch and the quay
LADDER = (13.86, 14.56, -2.50, -1.90)    # the ladder up to the forecastle to starboard of the mast (its foot aft)
FDOOR = (0.45, 1.17)         # the forecastle's door in its face, to port of the mast (y), 1.80 m high over a 0.12 m sill
# the jigging places on the rails, in the order the machines are bolted on (anchors.jigZ, F21: a metre or more between two, both
# sides): to port along the open working deck, to starboard along the side deck by the house (the hauler, the tub and the table hold
# the starboard rail of the working deck)
JIG = [(-1, 10.20), (1, 6.20), (-1, 11.40), (1, 5.00), (-1, 9.00), (1, 3.80), (-1, 12.60), (1, 2.75)]   # (side: 1 starboard, -1 port; x)
def ybi(x, sg=-1): return ybw(x, None, sg)
def tub_y(): return -(ybi(TUB[0]) - 0.36 - 0.10)
def table_y(): return (-(min(ybi(TABLE[0]), ybi(TABLE[1])) - 0.03), -(min(ybi(TABLE[0]), ybi(TABLE[1])) - 0.03 - TABLE_W))   # (outer, inner edge)


# ---------- the openings: real holes, cut with a boolean and lined ----------
PORTS = [(15.60, 6.22), (16.50, 6.38), (3.30, 3.82), (4.50, 3.76), (5.70, 3.72)]   # the portholes in the oxblood side (x, z), both sides: the forecastle's under the sheer line, the cabins' aft under the deck
PORT_R = 0.11
HAWSE = (18.05, 6.72); HAWSE_R = 0.17        # the hawse pipes' mouths in the white whaleback (bower)
EXH_R = 0.05; BILGE_R = 0.025
def rr_pts(cx, cy, w, h, r, n=4): return rrect(cx, cy, w, h, max(0.004, min(r, w / 2 - 0.002, h / 2 - 0.002)), n=n)
def circle(r, n=16): return [(r * math.cos(2 * math.pi * k / n), r * math.sin(2 * math.pi * k / n)) for k in range(n)]
def fdoor_pts(n=3):
    zd = mdeck(X_FC, 0.8); return rr_pts((FDOOR[0] + FDOOR[1]) / 2, zd + 0.12 + 0.90, FDOOR[1] - FDOOR[0], 1.80, 0.10, n)

def cutters():
    out = []
    for sg in (1, -1):
        for x0, l in FREE + FREE_A:
            xc = x0 + l / 2; zd = z_md(xc); out.append(((xc, sg * (ybw(xc, None, sg) + 0.03), zd + 0.065), (1, 0, 0), (0, 0, 1), rr_pts(0, 0, l, 0.10, 0.03), 0.16))
        for x, z in PORTS: out.append(((x, sg * y_at(x, z, sg), z), (1, 0, 0), (0, 0, 1), circle(PORT_R, 20), 0.10))
        out.append(((HAWSE[0], sg * y_at(HAWSE[0], HAWSE[1], sg), HAWSE[1]), (1, 0, 0), (0, 0, 1), circle(HAWSE_R, 18), 0.10))
    # the forecastle's door through its face
    out.append(((X_FC - 0.002, 0, 0), (0, 1, 0), (0, 0, 1), fdoor_pts(), 0.05))
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
    for sg in (1, -1):
        # the portholes: the reveal, the glass, the cabin dark behind, a brass ring outside
        for x, z in PORTS:
            on = lambda p, q, d: V((x + p, sg * (y_at(x + p, z + q, sg) - d), z + q))
            tube(A, [on(p, q, 0.0) for p, q in circle(PORT_R, 20)], (0, -sg, 0), 0.08, C['white'])
            G.poly([on(p, q, 0.04) for p, q in circle(PORT_R, 20)], C['glass'], (0, sg, 0))
            A.poly([on(p, q, 0.08) for p, q in circle(PORT_R, 20)], C['cabin'], (0, sg, 0))
            F.atorus(A, (x, sg * (y_at(x, z, sg) + 0.008), z), (0, sg, 0), PORT_R + 0.016, 0.016, lambda a: C['brass'], seg=24, rseg=5)
        # the hawse pipes: the mouth lined into the pipe, a steel rim (the anchor is the game's, stowed in it: bower)
        hx, hz = HAWSE; ring = [V((hx + p, sg * (y_at(hx + p, hz + q, sg) + 0.001), hz + q)) for p, q in circle(HAWSE_R, 18)]
        tube(A, ring, (-0.45, -sg, 0.45), 0.30, C['steel'], C['black'])
        F.atorus(A, (hx, sg * (y_at(hx, hz, sg) + 0.012), hz), (0, sg, 0), HAWSE_R + 0.025, 0.025, lambda a: C['steel'], seg=20, rseg=5)
        # the freeing ports: through the bulwark at the deck, open (no flaps: valg 26), a bar across each as on a steel boat
        for x0, l in FREE + FREE_A:
            xc = x0 + l / 2; zd = z_md(xc); o = rr_pts(xc, zd + 0.065, l, 0.10, 0.03, 3)
            ring = [V((p, sg * (y_at(p, q, sg) + 0.001), q)) for p, q in o]
            tube(A, ring, (0, -sg, 0), max(0.03, y_at(xc, zd + 0.06, sg) - ybw(xc, None, sg) + 0.002), C['inner'])
            acyl(A, (xc, sg * (y_at(xc, zd + 0.065, sg) - 0.02), zd + 0.012), (xc, sg * (y_at(xc, zd + 0.065, sg) - 0.02), zd + 0.118), 0.008, lambda q: C['steel'], seg=5)
    for (xb, sb, hb_), r in ((EXH_W, EXH_R), (BILGE, BILGE_R)):
        zb_ = WL + hb_
        ring = [(xb + p, sb * (y_at(xb + p, zb_ + q, sb) + 0.001), zb_ + q) for p, q in circle(r, 12)]
        tube(A, ring, (0, -sb, 0), 0.05, C['dark'], C['black'])
        F.atorus(A, (xb, sb * (y_at(xb, zb_, sb) + 0.006), zb_), (0, sb, 0), r + 0.008, 0.006, lambda a: C['steel'], seg=14, rseg=4)
    # the forecastle's door: the reveal through the face, dark behind, the steel door hooked open against the face to port, its sill
    o = fdoor_pts(4); zd = mdeck(X_FC, 0.8); x = X_FC - 0.004
    tube(A, [V((x - 0.001, p, q)) for p, q in o], (1, 0, 0), 0.30, C['inner'], C['cabin'])
    fo = [(p, max(q, zd)) for p, q in rr_pts((FDOOR[0] + FDOOR[1]) / 2, zd + 1.02, FDOOR[1] - FDOOR[0] + 0.10, 1.90, 0.13, 4)]
    for k in range(len(o)):
        a, b = o[k], o[(k + 1) % len(o)]; c_, d_ = fo[(k + 1) % len(fo)], fo[k]
        A.poly([(x - 0.014, a[0], a[1]), (x - 0.014, b[0], b[1]), (x - 0.014, c_[0], c_[1]), (x - 0.014, d_[0], d_[1])], C['white'], (-1, 0, 0))
    y1 = FDOOR[1]; ly0, ly1 = y1 + 0.05, y1 + 0.05 + (FDOOR[1] - FDOOR[0]) - 0.02
    abox(A, x - 0.075, x - 0.035, ly0, ly1, zd + 0.16, zd + 1.90, C['white'])
    if fine:
        F.atorus(A, (x - 0.078, (ly0 + ly1) / 2, zd + 1.45), (1, 0, 0), 0.12, 0.014, lambda a: C['brass'], seg=18, rseg=5)
        G.poly([(x - 0.077, (ly0 + ly1) / 2 + 0.11 * math.cos(2 * math.pi * k / 16), zd + 1.45 + 0.11 * math.sin(2 * math.pi * k / 16)) for k in range(16)], C['glass'], (-1, 0, 0))
        for zz in (zd + 0.45, zd + 1.65): acyl(A, (x - 0.055, y1 + 0.01, zz - 0.05), (x - 0.055, y1 + 0.01, zz + 0.05), 0.014, lambda q: C['steel'], seg=6)   # the hinges
        for zz in (zd + 0.5, zd + 1.0, zd + 1.5): abox(A, x - 0.085, x - 0.075, ly1 - 0.10, ly1 - 0.02, zz - 0.012, zz + 0.012, C['steel'])               # the dogs


# ---------- the deckhouse aft, white steel; the boat deck on it; the teak wheelhouse on the boat deck's forward part ----------
DHH = 2.05                   # the deckhouse's height at its forward end
def BD(): return mdeck(DH1, 0) + DHH                    # the boat deck (level)
DPORTS = [3.10, 4.10, 5.10]  # its portholes, both sides
DPORT_R = 0.13
DDOOR = (6.55, 7.25)         # its doors, both sides at the forward end by the working deck (x), teak, 1.85 m over a 0.10 m sill
FPORTS = [-1.50, 1.50]       # the portholes in its front (y)
def dh_plan(n=4):
    r = 0.22; P = []
    for cx, cy, a0 in ((DH1 - r, -DHY + r, -90), (DH1 - r, DHY - r, 0), (DH0 + r, DHY - r, 90), (DH0 + r, -DHY + r, 180)):
        for k in range(n + 1): a = math.radians(a0 + 90 * k / n); P.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    return P
def dense(P, step):
    out = []
    for i in range(len(P)):
        a, b = P[i], P[(i + 1) % len(P)]; n = max(1, int(math.hypot(b[0] - a[0], b[1] - a[1]) / step))
        for k in range(n): out.append((a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n))
    return out
WX0, WXS, WXF = 5.00, 7.45, 7.80     # the wheelhouse: the aft wall, the sides' forward end, the front's middle facet (at the floor)
WY, WFY = 1.75, 1.12                 # its half width, the front's middle facet's half width
LEAN = 0.10                          # the front and its corners lean forward this much from the sill to the roof
WT = 0.06
def WFL(): return BD() + 0.06                           # the wheelhouse's floor: the boat deck's top
def WS(): return WFL() + 0.98
def WH(): return WFL() + 1.88
def WR(): return WFL() + 2.10                           # the roof's underside
def lean_at(z): return LEAN * max(0.0, z - WS()) / (WR() - WS())
SIDE_XS = [5.00, 5.80, 6.60, 7.45]
def wh_plan():
    P = [(x, -WY, 0) for x in SIDE_XS] + [(WXF, -WFY, 1), (WXF, WFY, 1)] + [(x, WY, 0) for x in reversed(SIDE_XS)]
    P[len(SIDE_XS) - 1] = (WXS, -WY, 1); P[len(SIDE_XS) + 2] = (WXS, WY, 1)
    aft = [(WX0, WY - 2 * WY * k / 6, 0) for k in range(1, 6)]
    return P + aft
def wh_ring(z):
    return [(x + (lean_at(z) if fr else 0.0), y, z) for x, y, fr in wh_plan()]
ADOOR = (-1.50, -0.80)       # the wheelhouse's door in its aft wall to starboard, onto the boat deck (y), hooked open
BRIM_O = 0.16; BRIM_I = 0.11   # the roof's brim: its lower edge out from the walls, how far its face slopes in (valg 26)
def crown(x, y): return WR() + 0.12 + 0.05 * (1 - min(1.0, (y / 1.9) ** 2))
def wh_faces():
    """(name, origin, u, v, windows): three panes in the front, one in each corner, three a side, one aft beside the door"""
    vl = (LEAN / (WR() - WS()), 0, 1.0); vlen = math.hypot(vl[0], 1.0); s = lambda z: (z - WS()) * vlen
    wz = (s(WS() + 0.03) + s(WH() - 0.03)) / 2; wh_ = s(WH() - 0.03) - s(WS() + 0.03); Fc = []
    pw = (2 * WFY - 0.10 - 2 * 0.06) / 3
    Fc.append(('front', (WXF, 0, WS()), (0, 1, 0), vl, [rrect(u, wz, pw, wh_, 0.05, 3) for u in (-(pw + 0.06), 0.0, pw + 0.06)]))
    for nm, a, b in (('corner_s', (WXS, -WY), (WXF, -WFY)), ('corner_p', (WXF, WFY), (WXS, WY))):
        u = (b[0] - a[0], b[1] - a[1], 0); mid = ((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, WS()); Lf = math.hypot(u[0], u[1])
        Fc.append((nm, mid, u, vl, [rrect(0.0, wz, Lf - 0.16, wh_, 0.05, 3)]))
    zc = (WS() + WH()) / 2; hz = WH() - WS() - 0.06
    for sg, nm in ((1, 'side_p'), (-1, 'side_s')):
        for k, (x0, x1) in enumerate(((5.16, 5.86), (5.94, 6.64), (6.72, 7.36))):
            Fc.append(('%s%d' % (nm, k), ((x0 + x1) / 2, sg * WY, 0), (1, 0, 0), (0, 0, 1), [rrect(0.0, zc, x1 - x0, hz, 0.05, 3)]))
    Fc.append(('aft', (WX0, 0, 0), (0, 1, 0), (0, 0, 1), [rrect(y, zc, 0.80, hz, 0.05, 3) for y in (-0.05, 0.95)]))
    return Fc

def deckhouse(A, G, fine=True):
    """the white deckhouse on the main deck, its foot following the deck, portholes and teak doors; the boat deck on it with its edge
    and rail, the ladder up to it from the after deck"""
    objs = []; bd = BD(); P = dense(dh_plan(4 if fine else 1), 0.7 if fine else 9.0)
    foot = [(x, y, mdeck(x, y) - 0.006) for x, y in P]
    shell = loft_rings('deckhouse', [foot, [(x, y, bd - 1.0) for x, y in P], [(x, y, bd) for x, y in P]], C['white'], cap0=False, cap1=False, angle=25)
    if fine:
        shell.data.materials.append(C['inner']); solidify(shell, WT, 1); apply_all(shell); cuts = []
        zp = bd - 0.72
        for sg in (1, -1):
            for x in DPORTS: cuts.append(plate_cutter('dc%d%.1f' % (sg, x), (x, sg * DHY, zp), (1, 0, 0), (0, 0, 1), circle(DPORT_R, 20), 0.3))
        for y in FPORTS: cuts.append(plate_cutter('dcf%.1f' % y, (DH1, y, zp), (0, 1, 0), (0, 0, 1), circle(DPORT_R, 20), 0.3))
        cut(shell, cuts); shade(shell, 5)
        for sg in (1, -1):
            for x in DPORTS:
                G.poly([(x + p, sg * (DHY - 0.03), zp + q) for p, q in circle(DPORT_R, 20)], C['glass'], (0, sg, 0)); A.poly([(x + p, sg * (DHY - 0.07), zp + q) for p, q in circle(DPORT_R, 20)], C['cabin'], (0, sg, 0))
                F.atorus(A, (x, sg * (DHY + 0.008), zp), (0, sg, 0), DPORT_R + 0.018, 0.018, lambda a: C['brass'], seg=24, rseg=5)
        for y in FPORTS:
            G.poly([(DH1 - 0.03, y + p, zp + q) for p, q in circle(DPORT_R, 20)], C['glass'], (1, 0, 0)); A.poly([(DH1 - 0.07, y + p, zp + q) for p, q in circle(DPORT_R, 20)], C['cabin'], (1, 0, 0))
            F.atorus(A, (DH1 + 0.008, y, zp), (1, 0, 0), DPORT_R + 0.018, 0.018, lambda a: C['brass'], seg=24, rseg=5)
    objs.append(shell)
    # (inside: a dark plane a metre over the deck, so the deck under the house is no floor in the game's deck map: vessel3d.js deckMap
    # found a room with head room in there and the helm's place on its floor)
    zi = mdeck(DH1, 0) + 1.0
    A.poly([(DH0 + 0.1, -DHY + 0.1, zi), (DH1 - 0.1, -DHY + 0.1, zi), (DH1 - 0.1, DHY - 0.1, zi), (DH0 + 0.1, DHY - 0.1, zi)], C['cabin'], (0, 0, -1))
    # the doors, both sides: a steel frame, the teak leaf closed, a porthole in it, the handle; a grab rail along the house's sides
    d0, d1 = DDOOR
    for sg in (1, -1):
        zd = mdeck((d0 + d1) / 2, sg * DHY); y = sg * DHY
        yy = lambda d: (min(y, y + sg * d), max(y, y + sg * d))
        abox(A, d0 - 0.06, d1 + 0.06, *yy(0.035), zd, zd + 2.02, C['white']); abox(A, d0 - 0.06, d1 + 0.06, *yy(0.05), zd, zd + 0.10, C['steel'])
        A.poly([(d0, y + sg * 0.036, zd + 0.10), (d1, y + sg * 0.036, zd + 0.10), (d1, y + sg * 0.036, zd + 1.95), (d0, y + sg * 0.036, zd + 1.95)], C['teak'], (0, sg, 0))
        if fine:
            xc = (d0 + d1) / 2
            F.atorus(A, (xc, y + sg * 0.04, zd + 1.50), (0, sg, 0), 0.12, 0.014, lambda a: C['brass'], seg=18, rseg=5)
            G.poly([(xc + 0.11 * math.cos(2 * math.pi * k / 16), y + sg * 0.038, zd + 1.50 + 0.11 * math.sin(2 * math.pi * k / 16)) for k in range(16)], C['glass'], (0, sg, 0))
            acyl(A, (d0 + 0.08, y + sg * 0.036, zd + 1.02), (d0 + 0.08, y + sg * 0.085, zd + 1.02), 0.012, lambda q: C['brass'], seg=6)
            for zz in (zd + 0.4, zd + 1.7): acyl(A, (d1 - 0.005, y + sg * 0.045, zz - 0.05), (d1 - 0.005, y + sg * 0.045, zz + 0.05), 0.014, lambda q: C['steel'], seg=6)
            F.pipe(A, [(DH0 + 0.5, y + sg * 0.07, zd + 1.15), (d0 - 0.25, y + sg * 0.07, zd + 1.15)], 0.014, C['steel'], 6)
            for x in (DH0 + 0.5, (DH0 + d0) / 2, d0 - 0.25): acyl(A, (x, y, zd + 1.15), (x, y + sg * 0.07, zd + 1.15), 0.01, lambda q: C['steel'], seg=5)
    # the boat deck: a slab over the house with an overhang, its top in rows, a white edge, its underside
    ov = 0.15; x0, x1, yb = DH0 - ov, DH1 + ov, DHY + ov; NX, NY = (14, 10) if fine else (2, 2)
    for i in range(NX):
        xa, xb_ = x0 + (x1 - x0) * i / NX, x0 + (x1 - x0) * (i + 1) / NX
        for j in range(NY):
            ya, yb_ = -yb + 2 * yb * j / NY, -yb + 2 * yb * (j + 1) / NY
            A.poly([(xa, ya, bd + 0.06), (xb_, ya, bd + 0.06), (xb_, yb_, bd + 0.06), (xa, yb_, bd + 0.06)], C['deck'], (0, 0, 1))
        for sg in (1, -1):
            A.poly([(xa, sg * yb, bd - 0.02), (xb_, sg * yb, bd - 0.02), (xb_, sg * yb, bd + 0.06), (xa, sg * yb, bd + 0.06)], C['white'], (0, sg, 0))
            A.poly([(xa, sg * DHY, bd - 0.02), (xb_, sg * DHY, bd - 0.02), (xb_, sg * yb, bd - 0.02), (xa, sg * yb, bd - 0.02)], C['inner'], (0, 0, -1))
    for j in range(NY):
        ya, yb_ = -yb + 2 * yb * j / NY, -yb + 2 * yb * (j + 1) / NY
        for x, sx in ((x0, -1), (x1, 1)):
            A.poly([(x, ya, bd - 0.02), (x, yb_, bd - 0.02), (x, yb_, bd + 0.06), (x, ya, bd + 0.06)], C['white'], (sx, 0, 0))
            xi = DH0 if sx < 0 else DH1; A.poly([(x, ya, bd - 0.02), (x, yb_, bd - 0.02), (xi, yb_, bd - 0.02), (xi, ya, bd - 0.02)], C['inner'], (0, 0, -1))
    if not fine: return objs
    # the rail round the boat deck (three bars, 0.95 m), open at the ladder's head aft to port
    zt = bd + 0.06; pts = [(x1 - 0.05, -WY - 0.25), (x1 - 0.05, -yb + 0.05), (x0 + 0.05, -yb + 0.05), (x0 + 0.05, yb - 0.05), (x1 - 0.05, yb - 0.05), (x1 - 0.05, WY + 0.25)]
    gate = (BLAD[2] - 0.05, BLAD[3] + 0.05)
    for h, r in ((0.95, 0.022), (0.62, 0.016), (0.31, 0.016)):
        F.pipe(A, [(x, y, zt + h) for x, y in pts[:3]] + [(x0 + 0.05, gate[0], zt + h)], r, C['white'], 8)
        F.pipe(A, [(x0 + 0.05, gate[1], zt + h)] + [(x, y, zt + h) for x, y in pts[3:]], r, C['white'], 8)
    st = [(x1 - 0.05, -WY - 0.25), (x1 - 0.05, -yb + 0.05), (x0 + 0.05, -yb + 0.05), (x0 + 0.05, gate[0]), (x0 + 0.05, gate[1]), (x0 + 0.05, yb - 0.05), (x1 - 0.05, yb - 0.05), (x1 - 0.05, WY + 0.25)]
    for sg in (1, -1): st += [(x0 + 0.05 + (x1 - x0 - 0.1) * k / 5, sg * (yb - 0.05)) for k in range(1, 5)]
    st += [(x0 + 0.05, -1.2), (x0 + 0.05, 0.0)]
    for x, y in st: acyl(A, (x, y, zt - 0.004), (x, y, zt + 0.95), 0.02, lambda q: C['white'], seg=8)
    # the ladder from the after deck up the house's aft wall to the boat deck, its stiles carried up as handrails
    F.ladder(A, (DH0 - 0.10, (BLAD[2] + BLAD[3]) / 2, mdeck(DH0 - 0.1, 1.5) + 0.02), (DH0 - 0.10, (BLAD[2] + BLAD[3]) / 2, zt + 0.95), BLAD[3] - BLAD[2] - 0.1, C['galv'], side=(0, 1, 0), away=(-1, 0, 0))
    return objs
BLAD = (DH0 - 0.2, DH0, 1.20, 1.75)      # the boat deck's ladder on the house's aft wall, to port (y from, to)

def wheelhouse(fine=True):
    objs = []; glass = []; A = Acc('wh_fit'); wr, ws, wfl = WR(), WS(), WFL()
    shell = loft_rings('wheelhouse', [wh_ring(wfl - 0.006), wh_ring(ws), wh_ring(wr)], C['teak'], cap0=False, cap1=False, angle=25)   # (open on top: the roof's underside closes it)
    shell.data.materials.append(C['inner']); solidify(shell, WT, 1); apply_all(shell)
    cuts = []
    def nrm_of(nm, u, vv):
        n = V(u).normalized().cross(vv).normalized()
        if nm.startswith('side_p'): return n if n.y > 0 else -n
        if nm.startswith('side_s'): return n if n.y < 0 else -n
        if nm == 'aft': return V((-1, 0, 0))
        return n if n.x > 0 else -n
    for nm, o, u, v, wins in wh_faces():
        vv = V(v).normalized(); n = nrm_of(nm, u, vv)
        for k, poly in enumerate(wins):
            if fine:
                cuts.append(plate_cutter('wc_%s%d' % (nm, k), o, u, vv, poly, 0.45))
                cx = sum(p[0] for p in poly) / len(poly); cy = sum(p[1] for p in poly) / len(poly)
                outer = [(p[0] + (0.025 if p[0] > cx else -0.025), p[1] + (0.025 if p[1] > cy else -0.025)) for p in poly]
                objs.append(frame_ring('wf_%s%d' % (nm, k), V(o) + n * 0.004, u, vv, outer, poly, C['teakd'], 0.0, 0.015, nrm=n))
                glass.append(plate('wg_%s%d' % (nm, k), V(o) - n * 0.03, u, vv, poly, C['glass'], nrm=n))
            else:
                us = [q[0] for q in poly]; ws_ = [q[1] for q in poly]; box_ = [(min(us), min(ws_)), (max(us), min(ws_)), (max(us), max(ws_)), (min(us), max(ws_))]
                objs.append(plate('wd_%s%d' % (nm, k), V(o) + n * 0.006, u, vv, box_, C['dark'], nrm=n))
    y0, y1 = ADOOR
    if fine:
        cuts.append(plate_cutter('wc_door', (WX0, 0, 0), (0, 1, 0), (0, 0, 1), rr_pts((y0 + y1) / 2, wfl + 0.96, y1 - y0, 1.92, 0.06, 3), 0.35))
        cut(shell, cuts)
    shade(shell, 5)   # (flat panels: the sharp edges marked again after the cut, or the walls shade in streaks toward the windows; qa/flatnorm.py, OB8)
    objs.append(shell)
    if fine:
        # the aft door, hooked open back against the wall to port of the opening: its frame, the teak leaf with its pane, handle and hook
        x = WX0; z1 = wfl + 1.92
        o = rr_pts((y0 + y1) / 2, wfl + 0.96, y1 - y0, 1.92, 0.06, 3); fo = [(p, max(q, wfl)) for p, q in rr_pts((y0 + y1) / 2, wfl + 0.96, y1 - y0 + 0.08, 2.00, 0.09, 3)]
        for k in range(len(o)):
            a, b = o[k], o[(k + 1) % len(o)]; c_, d_ = fo[(k + 1) % len(fo)], fo[k]
            A.poly([(x - 0.012, a[0], a[1]), (x - 0.012, b[0], b[1]), (x - 0.012, c_[0], c_[1]), (x - 0.012, d_[0], d_[1])], C['teakd'], (-1, 0, 0))
            A.poly([(x - 0.012, a[0], a[1]), (x - 0.012, b[0], b[1]), (x + WT + 0.002, b[0], b[1]), (x + WT + 0.002, a[0], a[1])], C['teakd'], (0, 0, 0))
        lx0, lx1 = x - 0.075, x - 0.035; ly0, ly1 = y1 + 0.04, y1 + 0.04 + (y1 - y0) - 0.016
        abox(A, lx0, lx1, ly0, ly1, wfl + 0.04, z1 - 0.03, C['teak'])
        glass.append(plate('door_glass', (lx0 - 0.002, 0, 0), (0, 1, 0), (0, 0, 1), rr_pts((ly0 + ly1) / 2, z1 - 0.44, 0.34, 0.44, 0.06, 3), C['glass'], nrm=(-1, 0, 0)))
        acyl(A, (lx0, ly1 - 0.07, wfl + 1.0), (lx0 - 0.05, ly1 - 0.07, wfl + 1.0), 0.012, lambda q: C['brass'], seg=8)
        acyl(A, (lx1, ly1 - 0.05, wfl + 0.5), (x, ly1 - 0.05, wfl + 0.5), 0.01, lambda q: C['steel'], seg=6)
    # the roof (valg 26, Jonas 09.11.2026 on the plastsjark, then «Ja» for all the boats: «Gjør styrhustak mer realistisk som dette, med en
    # slags brem på kanten av taket som skrår»): a brim all round BRIM_O out from the walls, a 3 cm lower edge with the drip edge under
    # it, the face sloping in BRIM_I up to the roof's edge, in the hull's oxblood («Fargen kan du bestemme selv så lenge den harmonerer
    # med resten av designet»); the roof's underside, the roof inside the brim as a fan and a grid (a big flat face goes dark, kap. 19)
    le = lean_at(wr)   # (the corners only: the points along the straight sides lie in one line, and offset_poly needs corners)
    ring = offset_poly([(WX0, -WY), (WXS + le, -WY), (WXF + le, -WFY), (WXF + le, WFY), (WXS + le, WY), (WX0, WY)], BRIM_O)
    A.poly([(x, y, wr + 0.001) for x, y in ring], C['inner'], (0, 0, -1))
    rt = offset_poly(ring, -BRIM_I); ri = offset_poly(ring, -BRIM_I - 0.14); zl = wr + 0.03; zt_ = wr + 0.12
    for i in range(len(ring)):
        a, b = ring[i], ring[(i + 1) % len(ring)]; e, f = rt[(i + 1) % len(rt)], rt[i]; c, d = ri[(i + 1) % len(ri)], ri[i]
        nrm = (b[1] - a[1], -(b[0] - a[0]), 0); ln = math.hypot(nrm[0], nrm[1]) or 1.0
        A.poly([(a[0], a[1], wr), (b[0], b[1], wr), (b[0], b[1], zl), (a[0], a[1], zl)], C['white'], nrm)                                    # the lower edge
        A.poly([(a[0], a[1], zl), (b[0], b[1], zl), (e[0], e[1], zt_), (f[0], f[1], zt_)], C['hull'], (nrm[0] / ln * (zt_ - zl), nrm[1] / ln * (zt_ - zl), BRIM_I))   # the face, sloping in
        A.poly([(f[0], f[1], zt_), (e[0], e[1], zt_), (c[0], c[1], crown(*c)), (d[0], d[1], crown(*d))], C['roof'], (0, 0, 1))
        A.poly([(a[0], a[1], wr - 0.001), (b[0], b[1], wr - 0.001), (b[0], b[1], wr - 0.025), (a[0], a[1], wr - 0.025)], C['frame'], nrm)   # the drip edge
    cx_ = sum(p[0] for p in ri) / len(ri)
    for i in range(len(ri)):
        a, b = ri[i], ri[(i + 1) % len(ri)]; A.poly([(cx_, 0.0, crown(cx_, 0.0) - 0.002), (a[0], a[1], crown(*a)), (b[0], b[1], crown(*b))], C['roof'], (0, 0, 1))
    xr0, xr1 = WX0 + 0.10, WXS - 0.10; NXR, NYR = (8, 8) if fine else (1, 1); yr = WY - 0.12
    for i in range(NXR):
        xa_, xb_ = xr0 + (xr1 - xr0) * i / NXR, xr0 + (xr1 - xr0) * (i + 1) / NXR
        for j in range(NYR):
            P4 = [(xa_, -yr + 2 * yr * j / NYR), (xb_, -yr + 2 * yr * j / NYR), (xb_, -yr + 2 * yr * (j + 1) / NYR), (xa_, -yr + 2 * yr * (j + 1) / NYR)]
            A.poly([(x, y, crown(x, y) + 0.004) for x, y in P4], C['roof'], (0, 0, 1))
    if fine:
        # the wipers on the front panes, parked along the panes' foot; the grab rails on the roof's sides
        for u_ in (-0.70, 0.0, 0.70):
            zb2 = ws + 0.08; xb2 = WXF + lean_at(zb2) + 0.03
            acyl(A, (xb2 - 0.04, u_ + 0.26, zb2 - 0.04), (xb2 + 0.01, u_ + 0.26, zb2 - 0.04), 0.02, lambda q: C['frame'], seg=8)
            acyl(A, (xb2, u_ + 0.22, zb2), (xb2, u_ - 0.24, zb2), 0.007, lambda q: C['rubber'], seg=5)
        for sg in (1, -1):
            pts = [(WX0 + 0.3, sg * (WY - 0.15)), (WXS - 0.5, sg * (WY - 0.15))]
            for x, y in pts: acyl(A, (x, y, crown(x, y)), (x, y, crown(x, y) + 0.10), 0.012, lambda q: C['brass'], seg=6)
            F.pipe(A, [(x, y, crown(x, y) + 0.10) for x, y in pts], 0.014, C['brass'], 6)
    objs.append(A.done(35, tint=wear))
    return objs, glass


# the helm to starboard under the front panes: the console with the dash sloping up forward, the plotter, the sounder, the AIS and the
# engine's panel facing the skipper, the compass, the old spoked wheel, the lever, the VHF overhead, his chair; a bench to port
HX0 = 7.08                   # the console's after face
HY0, HY1 = -1.55, -0.10
DASHX = (7.12, 7.46)         # the dash's after foot and fore top (x)
DASHZ = (0.92, 1.06)
WHEEL = (6.92, -0.80); WHEEL_AX = (-1.0, 0.0, 0.45)
SKIP = (6.50, -0.80); SEAT = (6.02, -0.80)
EYE_H = 1.65
HP, FOV = -0.30, 60
def dzf(z): return WFL() + z
def dash_pt(t, y): return V((DASHX[0] + (DASHX[1] - DASHX[0]) * t, y, dzf(DASHZ[0] + (DASHZ[1] - DASHZ[0]) * t)))
def dash_n(): return V((-(DASHZ[1] - DASHZ[0]), 0, DASHX[1] - DASHX[0])).normalized()
SCR = {'plot': (-1.48, -1.10, 0.12, 0.88), 'sound': (-1.02, -0.86, 0.40, 0.90), 'ais': (-0.74, -0.58, 0.40, 0.90), 'eng': (-0.50, -0.16, 0.12, 0.88)}
HELM_EXTRA = []
def helm(A, G, fine=True):
    w = C['teak']; z0 = WFL() + 0.002; x0, x1 = DASHX; dz0, dz1 = dzf(DASHZ[0]), dzf(DASHZ[1]); xw = WXF - 0.10
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
        A.poly([c + (p - c) * 0.86 + n * 0.0145 for p in q], C['scr_' + nm], n)
        if nm == 'plot': A.poly([c + (p - c) * 0.40 + (q[2] - q[1]) * 0.18 + n * 0.0150 for p in q], C['scr_land'], n)
        if nm == 'sound': A.poly([c + (p - c) * V((0.80, 0.80, 0.80)) - (q[2] - q[1]) * 0.30 + n * 0.0150 for p in q], C['scr_bottom'], n)
    cb = dash_pt(0.93, -0.80) + V((0.0, 0, -0.005))
    acyl(A, cb, cb + V((0, 0, 0.05)), 0.07, lambda q: C['brass'], seg=16)
    HELM_EXTRA.append(sphere('compass', cb + V((0, 0, 0.085)), 0.06, C['glass'], (1, 1, 0.7)))
    wc = (WHEEL[0], WHEEL[1], dzf(1.00))
    F.helm_wheel(A, wc, WHEEL_AX, 0.30, C['teak'], C['teak'], C['brass'], n=8)                      # the old spoked wheel
    acyl(A, V(wc) - V(WHEEL_AX).normalized() * 0.14, (HX0 + 0.004, WHEEL[1], wc[2] + 0.02), 0.03, lambda q: C['dark'], seg=10)
    F.single_lever(A, (HX0 + 0.12, HY1, z0 + 0.82), (0, 1, 0), (1, 0, 0), C['dark'], C['brass'], C['black'])
    vc = V((6.30, -1.45, WR() - 0.06))
    obox(A, vc, V((0.09, 0, 0)), V((0, 0.10, 0)), V((0, 0, 0.05)), C['dark'])
    A.poly([vc + V((-0.091, -0.08, -0.03)), vc + V((-0.091, 0.08, -0.03)), vc + V((-0.091, 0.08, 0.03)), vc + V((-0.091, -0.08, 0.03))], C['screen'], (-1, 0, 0))
    F.helm_seat(A, (SEAT[0], SEAT[1], z0), (1, 0, 0), 0.80, C['steel'], C['cush'])
    yi = WY - WT - 0.06
    abox(A, 5.30, 6.60, 1.15, yi, z0, z0 + 0.42, C['teak']); abox(A, 5.32, 6.58, 1.17, yi - 0.002, z0 + 0.42, z0 + 0.50, C['cush'])
    abox(A, 5.32, 6.58, yi - 0.09, yi - 0.002, z0 + 0.50, z0 + 0.92, C['cush'])
    abox(A, 6.75, 7.35, 0.75, yi, z0, z0 + 0.84, C['teak']); abox(A, 6.77, 7.33, 0.77, yi - 0.002, z0 + 0.84, z0 + 0.87, C['wood'])   # the chart table


# ---------- on deck: the hatch, the table, the hauling roller, the ladder, the bitts, the windlass, the rails ----------
WINDLASS = 16.85
HPIPE = (17.45, 0.80)        # the hawse pipes' deck ends on the forecastle
POLE = (XA + 0.42, 0.0)      # the flag staff at the taffrail
def gunwale_y(x, sg=1): return ycap(x, sg) + CAP * 0.5
RAIL_XF = [X_FC + 0.10, 15.4, 16.2, 17.0, 17.8, 18.5, 19.0]      # the stanchions round the forecastle, on its plating's top
RAIL_H = 0.95
def set_x(): return x_stern_at(SETY, z_cap(XA + 0.2))             # where the stern's top is |SETY| wide: the setting roller's place
def x_stern_at(y, z):
    lo, hi = XA + 0.001, 2.0
    for _ in range(40):
        mid = (lo + hi) / 2
        if y_at(mid, min(z, z_cap(mid) - 1e-4)) < abs(y): lo = mid
        else: hi = mid
    return hi
def decks(A, G, fine=True):
    s = lambda q: C['steel']; g = lambda q: C['galv']
    # the hold's hatch: the coaming, the tarpaulin over the hatch boards with its battens and wedges (the top in panels)
    x0, x1, y0, y1 = HATCH; zt = z_md((x0 + x1) / 2) + HATCH_H
    ob = rr_pts((x0 + x1) / 2, (y0 + y1) / 2, x1 - x0, y1 - y0, 0.08, 3)
    F.loft(A, [[(x, y, z_md(x) - 0.02) for x, y in ob], [(x, y, zt - 0.10) for x, y in ob]], lambda i: C['white'], cap0=False, cap1=False, out=lambda mid, cc: V((mid.x - cc.x, mid.y - cc.y, 0)))
    ob2 = rr_pts((x0 + x1) / 2, (y0 + y1) / 2, x1 - x0 + 0.06, y1 - y0 + 0.06, 0.10, 3)
    F.loft(A, [[(x, y, zt - 0.14) for x, y in ob2], [(x, y, zt - 0.02) for x, y in ob2]], lambda i: C['tarp'], cap0=True, cap1=False, out=lambda mid, cc: V((mid.x - cc.x, mid.y - cc.y, 0)))
    NXH, NYH = (6, 6) if fine else (1, 1); hx0, hx1, hy0, hy1 = x0 - 0.03, x1 + 0.03, y0 - 0.03, y1 + 0.03
    for i in range(NXH):
        for j in range(NYH):
            xa, xb_ = hx0 + (hx1 - hx0) * i / NXH, hx0 + (hx1 - hx0) * (i + 1) / NXH; ya, yb_ = hy0 + (hy1 - hy0) * j / NYH, hy0 + (hy1 - hy0) * (j + 1) / NYH
            A.poly([(xa, ya, zt), (xb_, ya, zt), (xb_, yb_, zt), (xa, yb_, zt)], C['tarp'], (0, 0, 1))
    A.poly([(hx0, hy0, zt), (hx1, hy0, zt), (hx1, hy0, zt - 0.02), (hx0, hy0, zt - 0.02)], C['tarp'], (0, -1, 0)); A.poly([(hx0, hy1, zt), (hx1, hy1, zt), (hx1, hy1, zt - 0.02), (hx0, hy1, zt - 0.02)], C['tarp'], (0, 1, 0))
    A.poly([(hx0, hy0, zt), (hx0, hy1, zt), (hx0, hy1, zt - 0.02), (hx0, hy0, zt - 0.02)], C['tarp'], (-1, 0, 0)); A.poly([(hx1, hy0, zt), (hx1, hy1, zt), (hx1, hy1, zt - 0.02), (hx1, hy0, zt - 0.02)], C['tarp'], (1, 0, 0))
    if fine:
        for sg in (1, -1):
            yb_ = (y1 if sg > 0 else y0) + sg * 0.045
            abox(A, x0 + 0.05, x1 - 0.05, min(yb_, yb_ + sg * 0.012), max(yb_, yb_ + sg * 0.012), zt - 0.30, zt - 0.25, C['steel'])           # the batten
            for k in range(5): xk = x0 + 0.25 + (x1 - x0 - 0.5) * k / 4; abox(A, xk - 0.04, xk + 0.04, min(yb_, yb_ + sg * 0.03), max(yb_, yb_ + sg * 0.03), zt - 0.33, zt - 0.22, C['wood'])   # the wedges in their cleats
    # her own gutting table along the starboard bulwark: the top at working height with a lip, its legs, a chute at its forward end
    tx0, tx1 = TABLE; ty0, ty1 = table_y(); zt2 = z_md((tx0 + tx1) / 2) + 0.90
    abox(A, tx0, tx1, ty0, ty1, zt2 - 0.05, zt2, C['steel']); abox(A, tx0, tx1, ty0, ty0 + 0.02, zt2, zt2 + 0.14, C['steel'])
    for x in (tx0, tx1): abox(A, x - 0.01, x + 0.01, ty0, ty1, zt2, zt2 + 0.08, C['steel'])
    if fine:
        for x in (tx0 + 0.05, (tx0 + tx1) / 2, tx1 - 0.05):
            for y in (ty0 + 0.05, ty1 - 0.05): acyl(A, (x, y, mdeck(x, y) - 0.004), (x, y, zt2 - 0.05), 0.02, s, seg=8)
        for k in range(1, 4): xk = tx0 + (tx1 - tx0) * k / 4; abox(A, xk - 0.004, xk + 0.004, ty0 + 0.02, ty1, zt2, zt2 + 0.012, C['steel'])
        # the wash pipe over the table's middle on three stands (and so the table's top is no deck to walk on in the game's deck map)
        ym = (ty0 + ty1) / 2
        F.pipe(A, [(tx0 + 0.06, ym, zt2 + 0.42), (tx1 - 0.06, ym, zt2 + 0.42)], 0.014, C['galv'], 6)
        for x in (tx0 + 0.06, (tx0 + tx1) / 2, tx1 - 0.06): acyl(A, (x, ym, zt2), (x, ym, zt2 + 0.42), 0.012, g, seg=5)
        # the deck hose on its hook on the house's front to starboard, by the table (F12: the hose came out of nothing)
        hxh, hyh, hzh = DH1 + 0.02, -1.95, mdeck(DH1, -1.95) + 1.25
        acyl(A, (hxh, hyh, hzh + 0.2), (hxh + 0.10, hyh, hzh + 0.2), 0.012, s, seg=6)
        for k in range(3): F.atorus(A, (hxh + 0.08 + 0.03 * k, hyh, hzh), (1, 0, 0), 0.18, 0.016, lambda a: C['hose'], seg=18, rseg=5)
        acyl(A, (hxh, hyh + 0.35, hzh - 0.5), (hxh + 0.06, hyh + 0.35, hzh - 0.5), 0.03, lambda q: C['red'], seg=8)                               # the deck wash's valve
    # the hauling roller on the rail at the hauler's place, between its cheeks (hers: the hauler is the game's)
    if fine: F.hauling_roller(A, HX - 0.36, HX + 0.36, -(ysh(HX) + 0.03), -(ycap(HX) - 0.05), z_cap(HX) + 0.014, C['steel'], C['rubber'], R=0.06)
    # the setting roller in the stern's bulwark to starboard of the staff: two cheeks on the cap, the roller between them (kit.setter)
    xs_ = set_x(); zc_ = z_cap(xs_) + 0.012
    for dy in (-0.24, 0.24): abox(A, xs_ - 0.05, xs_ + 0.11, SETY + dy - 0.012, SETY + dy + 0.012, zc_ - 0.004, zc_ + 0.11, C['steel'])
    acyl(A, (xs_ + 0.03, SETY - 0.23, zc_ + 0.045), (xs_ + 0.03, SETY + 0.23, zc_ + 0.045), 0.045, lambda q: C['rubber'], seg=14 if fine else 6)
    # the ladder up to the forecastle: steep treads on two stringers from the deck to the forecastle deck's edge, handrails
    lx0, lx1, ly0, ly1 = LADDER; zf0 = mdeck(lx0, (ly0 + ly1) / 2); zf1 = fdeck(X_FC + 0.05, (ly0 + ly1) / 2); nt = 8
    for k in range(1, nt + 1):
        xk = lx0 + 0.04 + (lx1 - lx0 - 0.10) * k / nt; zk = zf0 + (zf1 - zf0) * k / (nt + 1)
        abox(A, xk - 0.07, xk + 0.07, ly0 + 0.04, ly1 - 0.04, zk - 0.03, zk, C['galv'])
    for yy in (ly0 + 0.02, ly1 - 0.02):
        beam(A, (lx0, yy, zf0), (lx1 - 0.02, yy, zf1 + 0.02), 0.035, 0.14, C['galv'], up=(-1, 0, 0.4))
        if fine: F.pipe(A, [(lx0, yy, zf0 + 0.9), (lx1 - 0.02, yy, zf1 + 0.92), (lx1 + 0.25, yy, zf1 + 0.95)], 0.016, C['galv'], 6); acyl(A, (lx0, yy, zf0), (lx0, yy, zf0 + 0.9), 0.014, g, seg=6)
    # the windlass on the forecastle with its gypsies and warping drums, the hawse pipes' deck ends (bower)
    wx = WINDLASS; zw = fdeck(wx, 0)
    abox(A, wx - 0.30, wx + 0.30, -0.34, 0.34, zw - 0.006, zw + 0.16, C['dark'])
    acyl(A, (wx, -0.62, zw + 0.42), (wx, 0.62, zw + 0.42), 0.10, lambda q: C['dark'], seg=14 if fine else 6)
    for sg in (1, -1):
        acyl(A, (wx, sg * 0.36, zw + 0.42), (wx, sg * 0.56, zw + 0.42), 0.22, lambda q: C['dark'], seg=16 if fine else 6)          # the gypsy
        acyl(A, (wx, sg * 0.66, zw + 0.42), (wx, sg * 0.90, zw + 0.42), 0.15, lambda q: C['steel'], seg=14 if fine else 6, r1=0.19)   # the warping drum
        abox(A, wx - 0.10, wx + 0.10, sg * 0.60 - 0.03, sg * 0.60 + 0.03, zw - 0.006, zw + 0.42, C['dark'])
        if fine:
            hx, hy = HPIPE; zh = fdeck(hx, hy); acyl(A, (hx, sg * hy, zh - 0.004), (hx, sg * hy, zh + 0.07), 0.13, s, seg=14)
            F.atorus(A, (hx, sg * hy, zh + 0.07), (0, 0, 1), 0.13, 0.02, lambda a: C['steel'], seg=16, rseg=5)
    if not fine: return
    # the rail round the forecastle: stanchions on the plating's top, three bars, closing round the stem; across the break with a gap at
    # the ladder's head
    for h, r in ((RAIL_H - FCB, 0.022), (0.50, 0.016), (0.26, 0.016)):
        pts = [(x, -gunwale_y(x, -1), z_cap(x) + 0.012 + h) for x in RAIL_XF] + [(XF - 0.22, 0.0, z_cap(XF - 0.22) + 0.012 + h + 0.02)]
        pts += [(x, gunwale_y(x), z_cap(x) + 0.012 + h) for x in reversed(RAIL_XF)]
        F.pipe(A, pts, r, C['white'], 8)
        xr = X_FC + 0.10; yg = gunwale_y(xr); zr = fdeck(xr, 0) + FCB + 0.012 + h
        F.pipe(A, [(xr, yg, z_cap(xr) + 0.012 + h), (xr, 0.0, zr + 0.03), (xr, LADDER[3] + 0.06, zr)], r, C['white'], 6)
        F.pipe(A, [(xr, LADDER[2] - 0.06, zr), (xr, -yg, z_cap(xr) + 0.012 + h)], r, C['white'], 6)
    for x in RAIL_XF:
        for sg in (1, -1): y = sg * gunwale_y(x, sg); zc = z_cap(x) + 0.012; acyl(A, (x, y, zc - 0.004), (x, y, zc + RAIL_H - FCB), 0.022, lambda q: C['white'], seg=8)
    xr = X_FC + 0.10
    for y in (LADDER[3] + 0.06, LADDER[2] - 0.06, 1.2, 0.0, -1.2 if abs(-1.2 - LADDER[3]) > 0.3 else -0.9): acyl(A, (xr, y, fdeck(xr, y) - 0.004), (xr, y, fdeck(xr, 0) + RAIL_H + 0.012), 0.022, lambda q: C['white'], seg=6)
    # the bitts: on the forecastle, on the main deck forward and amidships by the bulwark (clear of the work), on the quarters
    for x, y in ((17.9, 0.70), (17.9, -0.70), (15.95, -2.30), (15.95, 2.30)): F.bitts(A, x, y, fdeck(x, y), C['steel'], h=0.34, r=0.06, gap=0.18)
    for x, y in ((13.95, 2.75), (13.95, -2.75), (7.75, 3.25), (7.75, -3.25), (1.6, 3.0), (1.6, -3.0)): F.bitts(A, x, y, mdeck(x, y), C['steel'], h=0.34, r=0.06, gap=0.18)
    # panama chocks through the bulwark's cap by the bitts: a steel fairlead on the cap
    for x in (7.75, 1.6):
        for sg in (1, -1):
            y = sg * gunwale_y(x, sg); zc = z_cap(x) + 0.012
            for dx in (-0.16, 0.16): acyl(A, (x + dx, y, zc - 0.004), (x + dx, y, zc + 0.12), 0.03, s, seg=8)
            acyl(A, (x - 0.16, y, zc + 0.12), (x + 0.16, y, zc + 0.12), 0.022, s, seg=6)
    # mushroom vents and air pipes: on the forecastle, on the boat deck, by the house's front
    for y in (1.35, -1.35): F.mushroom_vent(A, (15.6, y, fdeck(15.6, y)), C['white'], r=0.07, h=0.36)
    for x, y in ((2.75, 2.05), (2.75, -2.05)): F.mushroom_vent(A, (x, y, BD() + 0.06), C['white'], r=0.07, h=0.34)
    for x, y in ((8.12, 2.3), (8.12, -0.9)):
        z0_ = mdeck(x, y); acyl(A, (x, y, z0_ - 0.004), (x, y, z0_ + 0.55), 0.04, lambda q: C['white'], seg=10); F.pipe(A, [(x, y, z0_ + 0.55), (x, y, z0_ + 0.63), (x + 0.10, y, z0_ + 0.65), (x + 0.15, y, z0_ + 0.58)], 0.04, C['white'], 10)
    # a coiled mooring rope on the forecastle, another on the after deck by the house
    for cx, cy, zz in ((16.0, -0.9, fdeck(16.0, -0.9)), (1.95, 2.2, mdeck(1.95, 2.2))):
        for k in range(4): F.atorus(A, (cx, cy, zz + 0.02 + 0.04 * k), (0, 0, 1), 0.26 - 0.015 * k, 0.022, lambda a: C['rope2'], seg=20, rseg=5)
    # the flag staff in its socket at the taffrail, raked aft
    px, py = POLE; zp = z_cap(px) + 0.012
    acyl(A, (px, py, zp - 0.30), (px, py, zp + 0.16), 0.03, s, seg=10)
    acyl(A, (px, py, zp + 0.02), (px - 0.22, py, zp + 1.62), 0.022, lambda q: C['cream'], seg=8)
    # the draft marks on the bow and the stern quarters (IDN-06)
    for sg in (1, -1):
        F.draft_scale(A, lambda zq, sg=sg: (lambda p, n, tt: (p, n, -sg * tt))(*surf(xstem(zq) - 0.40, zq, sg, off=0.004)), WL - 0.6, WL + 0.6, C['line'])
        F.draft_scale(A, lambda zq, sg=sg: (lambda p, n, tt: (p, n, -sg * tt))(*surf(1.9, zq, sg, off=0.004)), WL - 0.5, WL + 0.6, C['line'])

def xstem(z):
    lo, hi = 12.0, XF
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


# ---------- the mast at the break with its legs and its derrick, the gallows, the funnel and the mizzen; the lanterns
# (FOR-1975-12-01-5 vedlegg I for 20 m and over, checked in check()) ----------
MX = X_FC - 0.45             # the mast, on the main deck against the forecastle's face
M_TOP = 13.80
def white_z(): return M_TOP + 0.10          # the masthead light on its top, over and clear of all the others (vedlegg I 2(f))
FISH_R, FISH_W = 13.20, 11.12              # the fishing lights red over white on arms forward of the mast (rule 26), 2.05 m apart
LAMP_ARM = 0.42
SIDE_X = 7.30                # the side lights on screens at the boat deck's forward corners (their z from the boat deck)
def side_z(): return BD() + 0.06 + 0.42
FUN = (4.05, 0.0)            # the funnel on the boat deck aft of the wheelhouse
AM = (2.95, 0.0)             # the mizzen on the boat deck aft
def am_top(): return BD() + 5.6
def stern_l(): return (XA + 0.42, 0.0, z_cap(XA + 0.42) + 0.62)      # the stern light on the staff's foot at the taffrail
def rig(A, fine=True):
    seg = 18 if fine else 6; m = C['cream']; s = lambda q: C['steel']; d = lambda q: C['dark']; cm = lambda q: C['cream']
    zm0 = mdeck(MX, 0)
    # the mast: a tapered steel tube from the main deck, clamped to the forecastle's edge, two raked legs down to the forecastle deck
    acyl(A, (MX, 0, zm0 - 0.004), (MX, 0, 11.4), 0.15, cm, seg=seg, r1=0.10)
    acyl(A, (MX, 0, 11.4), (MX, 0, M_TOP), 0.07, cm, seg=seg, r1=0.05)
    abox(A, MX - 0.24, MX + 0.24, -0.24, 0.24, zm0 - 0.006, zm0 + 0.04, C['steel'])
    abox(A, MX - 0.05, X_FC + 0.02, -0.20, 0.20, z_fc(X_FC) - 0.02, z_fc(X_FC) + 0.10, C['cream'])
    for sg in (1, -1): acyl(A, (X_FC + 1.55, sg * 1.45, fdeck(X_FC + 1.55, 1.45) - 0.004), (MX + 0.04, sg * 0.05, 10.2), 0.075, cm, seg=8 if fine else 5)
    abox(A, MX - 0.035, MX + 0.035, -1.25, 1.25, 10.35, 10.42, m)                                   # the cross-tree
    acyl(A, (MX, 0, M_TOP), (MX, 0, white_z() - 0.04), 0.02, cm, seg=8)
    if fine: F.allround_lantern(A, (MX, 0, white_z()), C['lampW'], C['frame'], R=0.045, H=0.09)
    else: acyl(A, (MX, 0, white_z() - 0.05), (MX, 0, white_z() + 0.05), 0.05, lambda q: C['lampW'], seg=6)
    for z, mt in ((FISH_R, C['lampR']), (FISH_W, C['lampW'])):
        abox(A, MX + 0.05, MX + LAMP_ARM - 0.03, -0.02, 0.02, z - 0.10, z - 0.07, m)
        acyl(A, (MX + LAMP_ARM, 0, z - 0.10), (MX + LAMP_ARM, 0, z - 0.07), 0.04, cm, seg=10 if fine else 5)
        if fine: F.allround_lantern(A, (MX + LAMP_ARM, 0, z), mt, C['frame'], R=0.04, H=0.08)
        else: acyl(A, (MX + LAMP_ARM, 0, z - 0.05), (MX + LAMP_ARM, 0, z + 0.05), 0.045, lambda q: mt, seg=6)
    # her own derrick (a boat from 1978 lifted with a boom on the mast; the crane the player has is the game's): the gooseneck on the
    # mast, the boom laid aft and up over the hatch in its topping lift, the cargo runner and its hook made fast at the mast
    gz = zm0 + 1.25; tip = (HATCH[0] + 0.5, 0.0, 9.05)
    abox(A, MX - 0.22, MX - 0.12, -0.06, 0.06, gz - 0.08, gz + 0.08, C['steel'])
    acyl(A, (MX - 0.20, 0, gz), tip, 0.085, cm, seg=8 if fine else 5, r1=0.06)
    acyl(A, (MX, 0, 11.3), tip, 0.011, d, seg=4)
    if fine:
        acyl(A, tip, (MX - 0.30, 0.0, gz + 0.9), 0.009, d, seg=4)
        abox(A, tip[0] - 0.05, tip[0] + 0.05, -0.04, 0.04, tip[2] - 0.20, tip[2] - 0.04, C['dark'])
        F.atorus(A, (MX - 0.30, 0.0, gz + 0.82), (0, 1, 0), 0.05, 0.012, lambda a: C['steel'], seg=12, rseg=4, a0=0.0, a1=4.4)
        for sg in (1, -1): acyl(A, tip, (HATCH[1] + 0.3, sg * (ybw(HATCH[1] + 0.3) - 0.10), z_cap(HATCH[1] + 0.3)), 0.007, d, seg=4)   # the guys to the rails
        # the shrouds to the bulwark's cap, the forestay to the stem
        for sg in (1, -1):
            cx = MX - 1.1; acyl(A, (MX, sg * 0.05, 10.3), (cx, sg * gunwale_y(cx, sg), z_cap(cx) + 0.02), 0.008, d, seg=4)
        acyl(A, (MX, 0, 11.3), (XF - 0.30, 0, z_cap(XF - 0.30) + 0.05), 0.008, d, seg=4)
        F.work_light(A, (MX - 0.14, 0, 9.6), (-1, 0, -0.8), C['dark'], C['lens'])
        for sy in (-0.9, 0.9): F.whip(A, (MX, sy, 10.42), 1.5, C['white'], r0=0.014, r1=0.006, m_foot=C['steel'])
    # the gallows on the starboard rail: two legs from the deck inside the bulwark, leaning out over the rail, the beam, the hanging block
    yg0 = -(ybi(GAL[0]) - 0.16); zt = z_cap(GAL[0]) + 1.75; yg1 = -(ysh(GAL[0]) + 0.10)
    for x in GAL:
        acyl(A, (x, yg0, mdeck(x, yg0) - 0.004), (x, yg0, z_cap(x) + 0.9), 0.07, cm, seg=8 if fine else 5)
        acyl(A, (x, yg0, z_cap(x) + 0.9), (x, yg1, zt), 0.07, cm, seg=8 if fine else 5)
        if fine: abox(A, x - 0.12, x + 0.12, yg0 - 0.12, yg0 + 0.12, mdeck(x, yg0) - 0.006, mdeck(x, yg0) + 0.03, C['steel'])
    acyl(A, (GAL[0], yg1, zt), (GAL[1], yg1, zt), 0.07, cm, seg=8 if fine else 5)
    if fine:
        xc = (GAL[0] + GAL[1]) / 2
        acyl(A, (xc, yg1, zt - 0.07), (xc, yg1, zt - 0.22), 0.012, s, seg=5)
        acyl(A, (xc - 0.05, yg1, zt - 0.36), (xc + 0.05, yg1, zt - 0.36), 0.14, lambda q: C['dark'], seg=14)
        abox(A, xc - 0.07, xc + 0.07, yg1 - 0.03, yg1 + 0.03, zt - 0.52, zt - 0.20, C['steel'])
    # the funnel on the boat deck: cream with a red band, a black top, the exhaust's pipe out of it; the horn on it
    fx, fy = FUN; zb = BD() + 0.06; ft = zb + 2.35
    rings = []
    for z in (zb - 0.004, zb + 1.30, zb + 1.30, zb + 1.70, zb + 1.70, zb + 2.05, zb + 2.05, ft):
        rings.append([(fx + 0.52 * math.cos(2 * math.pi * k / (32 if fine else 8)), fy + 0.36 * math.sin(2 * math.pi * k / (32 if fine else 8)), z) for k in range(32 if fine else 8)])
    cols = [C['cream'], None, C['red'], None, C['cream'], None, C['black']]
    for i in range(len(rings) - 1):
        if cols[i] is None: continue
        F.loft(A, [rings[i], rings[i + 1]], lambda j, i=i: cols[i], cap0=False, cap1=(i == len(rings) - 2))
    acyl(A, (fx - 0.12, 0, ft - 0.02), (fx - 0.12, 0, ft + 0.30), 0.10, lambda q: C['black'], seg=10 if fine else 5)
    if fine:
        acyl(A, (fx + 0.50, 0, ft - 0.55), (fx + 0.86, 0, ft - 0.50), 0.03, lambda q: C['brass'], seg=10, r1=0.09)
        F.work_light(A, (fx - 0.50, 0.0, ft - 0.5), (-1, 0, -0.8), C['dark'], C['lens'])
    # the mizzen on the boat deck aft, its boom laid aft; the stern light at the taffrail on the staff's foot
    ax = AM[0]; at = am_top()
    acyl(A, (ax, 0, zb - 0.004), (ax, 0, at), 0.09, cm, seg=seg, r1=0.055)
    abox(A, ax - 0.16, ax + 0.16, -0.16, 0.16, zb - 0.006, zb + 0.04, C['steel'])
    acyl(A, (ax - 0.08, 0, zb + 1.30), (-0.9, 0, zb + 1.75), 0.05, cm, seg=8 if fine else 5)
    sl = stern_l()
    if fine: F.stern_lantern(A, sl, (-1, 0, 0), C['lampW'], C['frame'])
    else: obox(A, sl, V((0.03, 0, 0)), V((0, 0.03, 0)), V((0, 0, 0.03)), C['lampW'])
    acyl(A, (sl[0] + 0.03, 0, z_cap(sl[0])), (sl[0] + 0.03, 0, sl[2] - 0.03), 0.016, s, seg=6)
    if not fine: return
    acyl(A, (-0.85, 0, zb + 1.75), (ax, 0, at - 0.15), 0.008, d, seg=4)                                # the topping lift
    for sg in (1, -1): acyl(A, (ax, 0, at - 0.6), (ax - 0.45, sg * (DHY + 0.10), zb + 0.95), 0.007, d, seg=4)
    # on the wheelhouse's roof: the searchlight, the open array's pedestal (kit.radarA), the GPS, a whip; work lights under the roof's
    # forward and after edges over the working deck and the boat deck
    F.searchlight(A, (7.25, 0.95, crown(7.25, 0.95)), (1, 0), 0.11, C['dark'], C['lens'], C['steel'])
    rx, rz = _radp()
    acyl(A, (rx, 0, crown(rx, 0) - 0.004), (rx, 0, rz - 0.04), 0.07, lambda q: C['white'], seg=10); abox(A, rx - 0.20, rx + 0.20, -0.20, 0.20, rz - 0.04, rz, C['white'])
    F.gps(A, (5.45, -0.9, crown(5.45, 0.9)), C['white'], r=0.07, h=0.14, m_post=C['steel'])
    F.whip(A, (5.35, 1.1, crown(5.35, 1.1)), 2.2, C['white'], r0=0.016, r1=0.006, m_foot=C['steel'])
    for yy in (-1.1, 1.1): F.work_light(A, (WXF + LEAN + 0.14, yy, WR() + 0.02), (1, 0, -0.9), C['dark'], C['lens'])
    F.work_light(A, (WX0 - 0.12, 0.6, WR() + 0.0), (-1, 0, -0.9), C['dark'], C['lens'])
def _radp(): return (6.05, WR() + 0.62)        # the open array's pedestal on the wheelhouse's roof (kit.radarA: x, its top)

def lanterns_side(A, fine=True):
    """the side lights on their screens at the boat deck's forward corners, each with its screen inboard (fittings.side_lantern), so
    neither shows across the bow"""
    for sg, mt in ((1, C['lampR']), (-1, C['lampG'])):
        y = sg * (DHY + 0.15 - 0.12); zb = side_z() - 0.05
        acyl(A, (SIDE_X, y, BD() + 0.06), (SIDE_X, y, zb - 0.03), 0.02, lambda q: C['white'], seg=6)
        abox(A, SIDE_X - 0.18, SIDE_X + 0.18, min(y, y - sg * 0.16), max(y, y - sg * 0.16), zb - 0.03, zb, C['frame'])
        if fine: F.side_lantern(A, (SIDE_X, y, zb + 0.03), (1, 0, 0), (0, sg, 0), mt, C['frame'], C['black'], R=0.04, H=0.06)
        else: obox(A, (SIDE_X, y, zb + 0.05), V((0.04, 0, 0)), V((0, 0.03, 0)), V((0, 0, 0.03)), mt)


# ---------- under water: the shoe, the rudder, the propeller in its aperture, the anodes, the bilge keels ----------
RX_ = 0.30; RCH = 0.90       # the rudder's stock (its leading edge) and its chord: the blade under the counter
PROP = (0.98, 0.0, 1.18); PR = 0.80                           # the propeller's centre and radius (900 hp, a slow four-blader)
def underwater(fine=True):
    U = Acc('under')
    abox(U, RX_ - 0.16, X_KA + 0.06, -0.09, 0.09, 0.0, 0.12, C['af'])                                    # the shoe from the keel to the rudder's heel
    F.foil_rudder(U, (RX_, 0.0), 0.12, 3.30, RCH, C['af'], thick=0.15, top=lambda x: z_low(max(x, XA)) - 0.05, n=12 if fine else 5, rows=6 if fine else 2)
    acyl(U, (RX_ - 0.06, 0, 0.12), (RX_ - 0.06, 0, z_low(RX_) + 0.10), 0.06, lambda q: C['steel'], seg=10)
    if not fine: return U.done(35)
    px, py, pz = PROP
    acyl(U, (px + 0.08, 0, pz), (X_KA + 0.06, 0, pz), 0.08, lambda q: C['steel'], seg=12)
    acyl(U, (X_KA - 0.06, 0, pz), (X_KA + 0.06, 0, pz), 0.15, lambda q: C['prop'], seg=14, r1=0.17)
    F.propeller(U, PROP, (1, 0, 0), PR, C['prop'], n=4, hub=0.26, pitch=0.85, skew=0.25, cpp=False, fine=fine)
    for sg in (1, -1):
        for x, z in ((3.4, 0.45), (7.0, 0.42), (11.0, 0.62)): F.anode(U, (x, sg * (wk(x) + 0.004), z), (0, sg, 0), (1, 0, 0), C['anode'], L=0.40, w=0.11, t=0.045, m_strap=C['steel'])
        p, n, tt = surf(1.2, 2.9, sg, off=0.004); F.anode(U, p, n, tt, C['anode'], L=0.30, w=0.09, t=0.04, m_strap=C['steel'])
        # the bilge keels along the turn of the bilge amidships (SKR-07)
        pts = [surf(x, 1.55, sg)[0] for x in [5.5 + 0.5 * k for k in range(13)]]
        for a, b in zip(pts, pts[1:]):
            n = surf((a.x + b.x) / 2, 1.55, sg)[1]; d = V((n.x, n.y, min(n.z, -0.3))).normalized()
            U.poly([a, b, b + d * 0.28, a + d * 0.28], C['af'], (0, sg, 0.2)); U.poly([a + d * 0.28, b + d * 0.28, b, a], C['af'], (0, -sg, -0.2))
    # the echo sounder's transducer, the sea chest's grille
    zt = z_on(vline(11.5), 0.8); acyl(U, (11.5, -0.80, zt + 0.02), (11.5, -0.80, zt - 0.03), 0.08, lambda q: C['dark'], seg=16, r1=0.075)
    xi, yi_ = 6.2, 0.9; zi = z_on(vline(xi), yi_)
    for k in range(5): abox(U, xi - 0.12, xi + 0.12, yi_ - 0.08 + 0.04 * k - 0.009, yi_ - 0.08 + 0.04 * k + 0.009, zi - 0.012, zi + 0.02, C['dark'])
    return U.done(35)


# ---------- what makes her read as a steel boat from 1978 close by (Jonas 11.11.2026: «Dette burde bli en vakker båt rett og slett»,
# some 140 000 triangles near): the plating's seams and butts, the bulwark's stays, the planking of the teak wheelhouse, cowl vents, the
# cargo winch at the mast's foot, the mast's steps, the fire buckets, the bell, the binnacle on the roof, the jackstaff, the stem bar,
# the gallows' braces and rollers, the rudder's straps ----------
def cowl_vent(A, c, face, m, m_in, r=0.11, h=0.75):
    """a cowl ventilator: the trunk up from the deck, the bend, the bell mouth turned to face (x, y)"""
    c = V(c); f = V((face[0], face[1], 0)).normalized(); up = V((0, 0, 1)); n = 14
    acyl(A, c - up * 0.004, c + up * 0.05, r * 1.35, lambda q: m, seg=n); acyl(A, c, c + up * (h - 2.2 * r), r, lambda q: m, seg=n, cap=False)
    rings = []; cc = c + up * (h - 2.2 * r) + f * (1.6 * r)
    for k in range(7):
        a = math.pi / 2 * k / 6; ctr = cc - f * (1.6 * r) * math.cos(a) + up * (1.6 * r) * math.sin(a); ax = up * math.cos(a) + f * math.sin(a); rr = r * (1 + 0.9 * (k / 6) ** 2.2)
        e1 = V((-f.y, f.x, 0)); e2 = e1.cross(ax).normalized()
        rings.append([ctr + e1 * (rr * math.cos(2 * math.pi * j / n)) + e2 * (rr * math.sin(2 * math.pi * j / n)) for j in range(n)])
    F.loft(A, rings, lambda i: m, cap0=False, cap1=False)
    ctr = sum(rings[-1], V()) / n; A.poly([ctr - f * 0.12 + (p - ctr) * 0.86 for p in rings[-1]], m_in, f)
    A.poly([ctr - f * 0.12 + (p - ctr) * 0.86 for p in reversed(rings[-1])], m_in, -f)
    for j in range(n):
        a, b = rings[-1][j], rings[-1][(j + 1) % n]; A.poly([a, b, ctr - f * 0.12 + (b - ctr) * 0.86, ctr - f * 0.12 + (a - ctr) * 0.86], m_in, ctr - (a + b) / 2)

def details(A, G):
    s = lambda q: C['steel']; g = lambda q: C['galv']; cm = lambda q: C['cream']
    # the plating: two seams along each side and one along the whaleback, the butts between them every 2.4 m (in the plating's own paint)
    nf = lambda sg: (lambda p: surf(p.x, p.z, sg)[1])
    for sg in (1, -1):
        for dz in (0.62, 1.30, 1.98):
            pts = [V((x, sg * (y_at(x, z_rub(x) - dz, sg) + 0.001), z_rub(x) - dz)) for x in [-0.6 + 0.3 * k for k in range(64)] if z_low(x) < z_rub(x) - dz - 0.25]
            F.seam(A, pts, nf(sg), C['hull'], w=0.022, h=0.006)
        pts = [V((x, sg * (y_at(x, (z_sheer(x) + z_cap(x)) / 2 + 0.05, sg) + 0.001), (z_sheer(x) + z_cap(x)) / 2 + 0.05)) for x in [X_FC + 0.2 + 0.3 * k for k in range(15)] if z_cap(x) - z_sheer(x) > 0.5]
        F.seam(A, pts, nf(sg), C['white'], w=0.022, h=0.006)
        for i, x in enumerate([0.6 + 2.4 * k for k in range(8)]):
            z0 = max(WL + 0.20, z_low(x) + 0.3); z1 = z_rub(x) - (0.62 if i % 2 else 0.07) - 0.01
            F.seam(A, [V((x, sg * (y_at(x, z, sg) + 0.001), z)) for z in [z0 + (z1 - z0) * k / 6 for k in range(7)]], nf(sg), C['hull'], w=0.022, h=0.006)
        # the bulwark's stays inside, a flat bar from the deck up to under the cap, every 1.2 m, clear of the work's places
        for x in [-0.4 + 1.2 * k for k in range(12)]:
            if sg < 0 and (TABLE[0] - 0.2 < x < HX + 0.9 or GAL[0] - 0.3 < x < GAL[1] + 0.3): continue
            if abs(x - 7.75) < 0.4 or abs(x - 1.6) < 0.4 or abs(x - 13.95) < 0.4: continue
            yb = ybw(x, None, sg); yt = ycap(x, sg) - 0.012; zd = z_md(x); zt = z_cap(x) - 0.04
            P = [(x, sg * yb, zd), (x, sg * (yb - 0.11), zd), (x, sg * (yt - 0.03), zt), (x, sg * yt, zt)]
            A.poly([(q[0] - 0.005, q[1], q[2]) for q in P], C['inner'], (-1, 0, 0)); A.poly([(q[0] + 0.005, q[1], q[2]) for q in P], C['inner'], (1, 0, 0))
            A.poly([(x - 0.005, sg * (yb - 0.11), zd), (x + 0.005, sg * (yb - 0.11), zd), (x + 0.005, sg * (yt - 0.03), zt), (x - 0.005, sg * (yt - 0.03), zt)], C['inner'], (0, -sg, 0.1))
    # the stem bar down the stem from the forecastle to the forefoot, and the jackstaff on the stem's head
    pts = [(xstem(z) + 0.012, 0.0, z) for z in [1.6 + (z_cap(XF) - 1.75) * k / 22 for k in range(23)]]
    F.pipe(A, pts, 0.035, C['strake'], 8)
    xj = XF - 0.34; zj = z_cap(xj) + 0.012
    acyl(A, (xj, 0, zj - 0.004), (xj + 0.05, 0, zj + 1.25), 0.016, lambda q: C['cream'], seg=6); acyl(A, (xj + 0.05, 0, zj + 1.25), (xj + 0.05, 0, zj + 1.29), 0.028, lambda q: C['brass'], seg=8)
    # the teak wheelhouse's planking: the seams between the upright boards under and over the windows, all round
    ring = wh_ring(WS()); n = len(ring)
    for i in range(n):
        a, b = V(ring[i]), V(ring[(i + 1) % n]); Lw = (b - a).length; u = (b - a).normalized(); nn = V((u.y, -u.x, 0)); k = max(1, int(Lw / 0.13))
        for j in range(1, k):
            for z0, z1 in ((WFL() + 0.02, WS() - 0.05), (WH() + 0.05, WR() - 0.03)):
                p = a + u * (Lw * j / k); q0 = V((p.x + (lean_at(z0) if ring[i][0] > WXS - 0.01 and ring[(i + 1) % n][0] > WXS - 0.01 else 0) - (lean_at(WS())), p.y, z0)); q1 = V((q0.x, p.y, z1))
                A.poly([q0 - u * 0.004 + nn * 0.003, q0 + u * 0.004 + nn * 0.003, q1 + u * 0.004 + nn * 0.003, q1 - u * 0.004 + nn * 0.003], C['teakd'], nn)
    # cowl vents: the engine room's either side of the funnel, the forecastle's forward of the windlass; mushroom vents stay aft
    bd = BD() + 0.06
    for y in (1.25, -1.25): cowl_vent(A, (FUN[0] + 0.15, y, bd), (1, 0), C['cream'], C['red'], r=0.13, h=1.05)
    for y in (0.95, -0.95): cowl_vent(A, (18.25, y, fdeck(18.25, y)), (1, 0), C['white'], C['red'], r=0.09, h=0.62)
    # the cargo winch at the mast's foot (hers: the derrick's runner): the bed, the drum between its cheeks, the warping heads, the motor
    wx, wz = MX - 0.95, mdeck(MX - 0.95, 0)
    abox(A, wx - 0.34, wx + 0.34, -0.50, 0.50, wz - 0.004, wz + 0.08, C['dark'])
    for y in (-0.36, 0.36): abox(A, wx - 0.22, wx + 0.22, y - 0.03, y + 0.03, wz + 0.08, wz + 0.52, C['dark'])
    acyl(A, (wx, -0.33, wz + 0.36), (wx, 0.33, wz + 0.36), 0.13, lambda q: C['galv'], seg=16)
    for y in (-0.33, 0.33): acyl(A, (wx, y - 0.012, wz + 0.36), (wx, y + 0.012, wz + 0.36), 0.20, lambda q: C['dark'], seg=18)
    for sg in (1, -1): acyl(A, (wx, sg * 0.39, wz + 0.36), (wx, sg * 0.60, wz + 0.36), 0.085, s, seg=14, r1=0.12)
    abox(A, wx - 0.30, wx - 0.06, -0.16, 0.16, wz + 0.08, wz + 0.30, C['red']); acyl(A, (wx + 0.20, 0.30, wz + 0.52), (wx + 0.36, 0.30, wz + 0.86), 0.014, s, seg=6)
    acyl(A, (wx, 0.0, wz + 0.49), (MX - 0.24, 0.0, mdeck(MX, 0) + 1.33), 0.008, lambda q: C['dark'], seg=4)
    # the mast's steps up its after side to the cross-tree, the ship's bell on its bracket under the forecastle's edge
    for k in range(18):
        z = mdeck(MX, 0) + 2.3 + 0.34 * k; r_ = 0.15 - 0.05 * (z - mdeck(MX, 0)) / (11.4 - mdeck(MX, 0))
        F.pipe(A, [(MX - r_ * 0.7, -0.13, z), (MX - r_ - 0.10, -0.13, z), (MX - r_ - 0.10, 0.13, z), (MX - r_ * 0.7, 0.13, z)], 0.008, C['galv'], 5)
    bx, by, bz = X_FC - 0.16, -0.55, z_fc(X_FC) - 0.42
    acyl(A, (X_FC - 0.004, by, bz + 0.22), (bx, by, bz + 0.22), 0.012, s, seg=6)
    F.loft(A, [[(bx + r_ * math.cos(2 * math.pi * j / 14), by + r_ * math.sin(2 * math.pi * j / 14), z) for j in range(14)] for r_, z in ((0.012, bz + 0.21), (0.05, bz + 0.19), (0.075, bz + 0.10), (0.085, bz + 0.02), (0.105, bz - 0.01))], lambda i: C['brass'], cap0=True, cap1=False)
    # the fire buckets in their rack on the boat deck's rail aft to starboard, red
    for k in range(4):
        cx, cy = DH0 + 0.75 + 0.36 * k, -(DHY + 0.15 - 0.05) + 0.17
        rr = [[(cx + r_ * math.cos(2 * math.pi * j / 12), cy + r_ * math.sin(2 * math.pi * j / 12), z) for j in range(12)] for r_, z in ((0.10, bd + 0.34), (0.145, bd + 0.62))]
        F.loft(A, rr, lambda i: C['red'], cap0=True, cap1=False); A.poly([(p[0], p[1], bd + 0.60) for p in rr[1]], C['dark'], (0, 0, 1))
        F.atorus(A, (cx, cy, bd + 0.64), (0, 1, 0), 0.13, 0.006, lambda a: C['steel'], seg=10, rseg=4, a0=0.0, a1=math.pi)
    abox(A, DH0 + 0.52, DH0 + 2.06, -(DHY + 0.15 - 0.05) + 0.02, -(DHY + 0.15 - 0.05) + 0.32, bd + 0.31, bd + 0.34, C['white'])
    # the standard compass in its binnacle on the wheelhouse's roof, aft of the searchlight
    cx, cy = 6.75, 0.0; zc = crown(cx, cy)
    acyl(A, (cx, cy, zc - 0.004), (cx, cy, zc + 0.52), 0.09, lambda q: C['teak'], seg=12, r1=0.075); acyl(A, (cx, cy, zc + 0.52), (cx, cy, zc + 0.60), 0.115, lambda q: C['brass'], seg=14)
    HELM_EXTRA.append(sphere('binnacle', (cx, cy, zc + 0.62), 0.105, C['brass'], (1, 1, 0.75)))
    for sg in (1, -1): HELM_EXTRA.append(sphere('qsphere%d' % sg, (cx, cy + sg * 0.20, zc + 0.50), 0.055, C['red'] if sg > 0 else C['hose'])); acyl(A, (cx, cy + sg * 0.09, zc + 0.50), (cx, cy + sg * 0.16, zc + 0.50), 0.012, lambda q: C['brass'], seg=5)
    # the gallows: knee braces to the legs, a roller on the beam's underside either side of the block, the lead block's eye plate
    yg0 = -(ybi(GAL[0]) - 0.16); zt = z_cap(GAL[0]) + 1.75; yg1 = -(ysh(GAL[0]) + 0.10)
    for x, dx in ((GAL[0], 0.30), (GAL[1], -0.30)):
        acyl(A, (x, yg1 + 0.02, zt - 0.34), (x + dx, yg1, zt - 0.03), 0.035, cm, seg=6)
        abox(A, x - 0.10, x + 0.10, yg0 - 0.02, yg0 + 0.30, z_cap(x) - 0.02, z_cap(x) + 0.03, C['cream'])        # the clamp to the bulwark's cap
    for x in (GAL[0] + 0.22, GAL[1] - 0.22): acyl(A, (x - 0.06, yg1, zt - 0.14), (x + 0.06, yg1, zt - 0.14), 0.07, lambda q: C['galv'], seg=12)
    # the rudder's straps and the stock's flange, the stern tube's nut
    for z in (0.7, 1.5, 2.3): abox(A, RX_ - 0.34, RX_ + 0.02, -0.085, 0.085, z - 0.035, z + 0.035, C['af'])
    acyl(A, (RX_ - 0.06, 0, z_low(RX_) - 0.10), (RX_ - 0.06, 0, z_low(RX_) + 0.02), 0.13, s, seg=12)
    # the anchor chains' stoppers on the forecastle, a spurling pipe aft of the windlass; hand rails on the deckhouse's front
    for sg in (1, -1):
        abox(A, 17.15, 17.30, sg * 0.72 - 0.07, sg * 0.72 + 0.07, fdeck(17.2, 0.7) - 0.004, fdeck(17.2, 0.7) + 0.10, C['dark'])
        acyl(A, (WINDLASS - 0.42, sg * 0.46, fdeck(WINDLASS - 0.42, 0.46) - 0.004), (WINDLASS - 0.42, sg * 0.46, fdeck(WINDLASS - 0.42, 0.46) + 0.07), 0.08, s, seg=10)
    zh = mdeck(DH1, 0) + 1.15
    F.pipe(A, [(DH1 + 0.07, -1.2, zh), (DH1 + 0.07, 1.6, zh)], 0.014, C['steel'], 6)
    for y in (-1.2, 0.2, 1.6): acyl(A, (DH1, y, zh), (DH1 + 0.07, y, zh), 0.01, s, seg=5)
    # the boat deck laid with planks: the seams between them fore and aft, clear of the wheelhouse and the funnel
    x0, x1, yb = DH0 - 0.10, DH1 + 0.10, DHY + 0.10
    for k in range(-21, 22):
        y = 0.12 * k
        for xa, xb_ in ((x0, WX0 - 0.02), (WXF + LEAN + 0.03, x1)) if abs(y) < WY + 0.02 else ((x0, x1),):
            if abs(y) < 0.40 and xa < FUN[0]: 
                for xa2, xb2 in ((xa, min(xb_, AM[0] - 0.18)), (AM[0] + 0.18, FUN[0] - 0.55), (FUN[0] + 0.55, xb_)):
                    if xb2 > xa2 + 0.05: A.poly([(xa2, y - 0.004, bd + 0.002), (xb2, y - 0.004, bd + 0.002), (xb2, y + 0.004, bd + 0.002), (xa2, y + 0.004, bd + 0.002)], C['dark'], (0, 0, 1))
            elif xb_ > xa + 0.05: A.poly([(xa, y - 0.004, bd + 0.002), (xb_, y - 0.004, bd + 0.002), (xb_, y + 0.004, bd + 0.002), (xa, y + 0.004, bd + 0.002)], C['dark'], (0, 0, 1))
    # duckboards where they stand at the hauler and along the table: slats on bearers, low enough to walk on
    for xa, xb_, ya, yb_ in ((HX - 0.75, HX + 0.95, -(ybi(HX) - 0.30), -(ybi(HX) - 1.15)), (TABLE[0] + 0.05, TABLE[1] - 0.05, table_y()[1] + 0.10, table_y()[1] + 0.80)):
        n = int((yb_ - ya) / 0.085)
        for k in range(n):
            y = ya + (yb_ - ya) * (k + 0.5) / n
            beam(A, (xa, y, mdeck(xa, y) + 0.035), (xb_, y, mdeck(xb_, y) + 0.035), 0.06, 0.022, C['wood'])
        for x in (xa + 0.15, (xa + xb_) / 2, xb_ - 0.15): beam(A, (x, ya, mdeck(x, ya) + 0.012), (x, yb_, mdeck(x, yb_) + 0.012), 0.05, 0.024, C['wood'])
    # a drip moulding over every porthole of the deckhouse, a moulding under the wheelhouse's windows all round
    zp = BD() - 0.72
    for sg in (1, -1):
        for x in DPORTS: F.atorus(A, (x, sg * (DHY + 0.012), zp), (0, sg, 0), DPORT_R + 0.06, 0.012, lambda a: C['white'], seg=14, rseg=4, a0=0.25 if sg < 0 else math.pi + 0.25, a1=(math.pi - 0.25) if sg < 0 else 2 * math.pi - 0.25)
    ringm = [(p[0], p[1]) for p in wh_ring(WS())]; n = len(ringm)
    for i in range(n):
        a_, b_ = ringm[i], ringm[(i + 1) % n]
        if abs(a_[0] - WX0) < 1e-6 and abs(b_[0] - WX0) < 1e-6 and min(a_[1], b_[1]) < ADOOR[1] + 0.1 and max(a_[1], b_[1]) > ADOOR[0] - 0.1: continue
        u = V((b_[0] - a_[0], b_[1] - a_[1], 0)); nn = V((u.y, -u.x, 0)).normalized()
        beam(A, V((a_[0], a_[1], WS() - 0.045)) + nn * 0.012, V((b_[0], b_[1], WS() - 0.045)) + nn * 0.012, 0.03, 0.035, C['teakd'])
    # the shrouds' chain plates and bottle screws on the bulwark's cap, the derrick's blocks
    for sg in (1, -1):
        cx = MX - 1.1; y = sg * gunwale_y(cx, sg); zc = z_cap(cx)
        abox(A, cx - 0.03, cx + 0.03, y - 0.008, y + 0.008, zc - 0.16, zc + 0.05, C['steel'])
        d_ = (V((MX, sg * 0.05, 10.3)) - V((cx, y, zc + 0.02))).normalized()
        acyl(A, V((cx, y, zc + 0.04)) + d_ * 0.05, V((cx, y, zc + 0.04)) + d_ * 0.38, 0.016, lambda q: C['galv'], seg=6)
    tip = V((HATCH[0] + 0.5, 0.0, 9.05))
    for q in (tip + V((0, 0, -0.30)), V((MX - 0.02, 0, 11.22))):
        acyl(A, q + V((0, -0.035, 0)), q + V((0, 0.035, 0)), 0.075, lambda z: C['dark'], seg=12); abox(A, q.x - 0.012, q.x + 0.012, q.y - 0.05, q.y + 0.05, q.z - 0.11, q.z + 0.11, C['steel'])
    # the hatch's lashings: two wires across the tarpaulin to eye plates on the coaming
    hx0, hx1, hy0, hy1 = HATCH; zt = z_md((hx0 + hx1) / 2) + HATCH_H
    for x in (hx0 + 0.6, hx1 - 0.6):
        F.pipe(A, [(x, hy0 - 0.06, zt - 0.34), (x, hy0 - 0.04, zt + 0.012), (x, hy1 + 0.04, zt + 0.012), (x, hy1 + 0.06, zt - 0.34)], 0.007, C['galv'], 5)
    # closed chocks in the forecastle's plating and on the quarters: an oval steel ring on the cap
    for x, zf in ((18.6, None), (15.3, None), (0.3, None)):
        for sg in (1, -1):
            y = sg * gunwale_y(x, sg); zc = z_cap(x) + 0.012
            F.atorus(A, (x, y, zc + 0.07), (0, 1, 0), 0.10, 0.028, lambda a: C['steel'], seg=14, rseg=6)


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
    tint(hull)
    A = Acc('fit'); G = Acc('glass')
    if fine: linings(A, G, fine)
    dh = deckhouse(A, G, fine)
    wh, wg = wheelhouse(fine)
    helm(A, G, fine)
    decks(A, G, fine); rig(A, fine); lanterns_side(A, fine)
    if fine: details(A, G)
    if fine: tint(dh[0])
    out = [hull, A.done(35, tint=wear), underwater(fine)] + dh + wh + HELM_EXTRA
    g = G.done(35)
    return [o for o in out if o], wg + ([g] if g else [])


def to_game(p): return (-p[1], p[2] - WL, -(p[0] - XM))
def to_game_n(n): return (-n[1], n[2], -n[0])

NAME_X = (14.80, 16.20)      # the name on the white whaleback aft of the registration mark's place, and round the cruiser stern
def name_z(x): return (z_sheer(x) + 0.10, z_sheer(x) + 0.50)
NAME_T = (4.30, 4.66)
def name_strips(G):
    """where the name is written (vessel3d.js nameStrips): on the white whaleback forward, both sides, and round the cruiser stern
    under the fender"""
    out = []
    for sg, xs in ((1, [NAME_X[1] - (NAME_X[1] - NAME_X[0]) * k / 12 for k in range(13)]), (-1, [NAME_X[0] + (NAME_X[1] - NAME_X[0]) * k / 12 for k in range(13)])):
        B = []; T = []
        for x in xs:
            for arr, z in ((B, name_z(x)[0]), (T, name_z(x)[1])): arr.append(G(x, sg * (y_at(x, z, sg) + 0.03), z))
        out.append([B, T])
    ys = [1.0 - 2.0 * k / 12 for k in range(13)]      # port to starboard: left to right seen from astern
    out.append([[G(x_stern_at(y, NAME_T[0]) - 0.035, y * 1.01, NAME_T[0]) for y in ys], [G(x_stern_at(y, NAME_T[1]) - 0.035, y * 1.01, NAME_T[1]) for y in ys]])
    return out

def pot_kit(G):
    return {'pots': {'kind': 'kong', 'at': [G(x, y, mdeck(x, y) + dz) + [0.0, h] for x, y, dz, h in POTS]}}

def kit_places(G):
    """the places where the game sets the deck kit (19.10.2026): two liferafts in cradles on the boat deck aft, one a side by the rail so
    they float free; four ring buoys, two on the deckhouse's sides and two on the boat deck's rail aft; the open array on its pedestal on
    the wheelhouse's roof; the net tubs on the after deck inside the stern's roller and the line tubs to port of the hatch; the deck
    cargo between the house and the hatch; the crane (V.crane) on the forecastle deck at its after edge to port, where it reaches the
    hatch and out over the quay (she lies port side to, 07-harbours.js berthSide), its booms stowed upright (no rest)"""
    r = lambda v: round(v, 3); h = math.pi / 2; bd = BD() + 0.06; xs_ = set_x()
    rail = lambda x, sg: G(x, sg * (DHY + 0.15 - 0.05 + 0.022), bd + 0.95) + [r(-sg * h)]
    return {'raft': [G(3.45, -1.95, bd) + [r(h)], G(3.45, 1.95, bd) + [r(h)]],
            'buoys': [G(5.85, -DHY, mdeck(5.85, DHY) + 1.45) + [r(h)], G(5.85, DHY, mdeck(5.85, DHY) + 1.45) + [r(-h)], rail(2.9, 1), rail(2.9, -1)],
            'radarA': G(_radp()[0], 0, _radp()[1]),
            'garn': {'at': G(GARN[0], GARN[1], mdeck(GARN[0], GARN[1])), 'ry': 0.0},
            'stamps': {'at': G(STAMP[0], STAMP[1], mdeck(STAMP[0], STAMP[1])), 'ry': 0.0},
            # (the roller's top in the stern's bulwark at its outer edge: 10-gear.js drawStern, deckcrew.js setOver: [x, y, z, ry, mag])
            'setter': G(xs_ - 0.02, SETY, z_cap(xs_) + 0.10) + [0.0, 1],
            'cargo': [G(x, y, mdeck(x, y) + dz) + [r(ry)] for x, y, dz, ry in CARGO],
            'crane': {'at': G(CRANE[0], CRANE[1], fdeck(*CRANE)), 'ry': r(math.pi), 's': 1.2, 'rest': None}}

def bower(G):
    """the boat's own anchor (tools/deck/anker.py, view3d drawAnchor): a Hall anchor stowed in the starboard hawse pipe, the spare to
    port; the chain from the windlass's gypsy down the pipe"""
    hw = lambda sg: {'fair': G(HAWSE[0], sg * (y_at(HAWSE[0], HAWSE[1], sg) + 0.03), HAWSE[1]), 'pipe': G(HPIPE[0], sg * HPIPE[1], fdeck(*HPIPE) + 0.05)}
    return dict(hw(-1), kind='hall', kg=250, gypsy=G(WINDLASS, -0.46, fdeck(WINDLASS, 0) + 0.66), side=1, deck=True, spare=hw(1))

def anchors():
    G = lambda x, y, z: [round(v, 3) for v in to_game((x, y, z))]
    fl = WFL(); px, py = POLE; zp = z_cap(px) + 0.012; d0, d1 = DDOOR; ty0, ty1 = table_y(); lx0, lx1, ly0, ly1 = LADDER
    md = mdeck
    return {'bower': bower(G), 'eye': G(SKIP[0], SKIP[1], fl + EYE_H), 'skipperAt': G(SKIP[0], SKIP[1], fl), 'hp': HP, 'fov': FOV,
            # the hands: the fisher at the hauler, the one who bleeds by the tub, the one who guts at the table, one by the nets aft
            'crewSpots': [G(HX - 0.2, -(ybi(HX) - 0.55), md(HX, 2.9)) + [1.57], G(TUB[0], tub_y() + 0.85, md(TUB[0], 2.2)) + [1.57], G(9.3, ty1 + 0.34, md(9.3, 2.5)) + [1.57], G(1.75, 0.9, md(1.75, 0.9)) + [3.14]],
            # typed lights (20 m and over): the masthead light on the mast's top, the side lights on their screens, the stern light at
            # the taffrail, the fishing lights red over white on their arms; the work lights
            'lights': [[G(MX, 0, white_z()), [1, 0.95, 0.85], 'masthead'],
                       [G(SIDE_X, DHY + 0.03, side_z()), [1, 0.12, 0.1], 'port'], [G(SIDE_X, -(DHY + 0.03), side_z()), [0.1, 1, 0.35], 'stbd'],
                       [G(*stern_l()), [1, 0.95, 0.85], 'stern'], [G(MX + LAMP_ARM, 0, FISH_R), [1, 0.12, 0.1], 'fishR'], [G(MX + LAMP_ARM, 0, FISH_W), [1, 0.95, 0.85], 'fishW'],
                       [G(WXF + LEAN + 0.14, 0.0, WR() - 0.03), [1, 0.95, 0.85], 'work'], [G(MX - 0.2, 0, 9.55), [1, 0.95, 0.85], 'work'], [G(FUN[0] - 0.55, 0.0, BD() + 1.85), [1, 0.95, 0.85], 'work']],
            # the ladders the deck map cannot find itself (over 1.6 m): up to the forecastle, and up to the boat deck from the after deck
            'stairs': [{'from': G(lx0 - 0.25, (ly0 + ly1) / 2, md(lx0 - 0.25, 2.2)), 'to': G(X_FC + 0.45, (ly0 + ly1) / 2, fdeck(X_FC + 0.45, 2.2))},
                       {'from': G(DH0 - 0.45, (BLAD[2] + BLAD[3]) / 2, md(DH0 - 0.45, 1.5)), 'to': G(DH0 + 0.25, (BLAD[2] + BLAD[3]) / 2, BD() + 0.06)}],
            # the doors (B4): the deckhouse's starboard door by the working deck (the crew's way in), its port door, the forecastle's
            # door, the wheelhouse's door aft to starboard on the boat deck
            'doors': [{'at': G((d0 + d1) / 2, -DHY - 0.03, md(d0, DHY)), 'w': round(d1 - d0, 2), 'h': 1.85, 'in': G((d0 + d1) / 2, -DHY + 0.8, md(d0, DHY)), 'to': 'cabin', 'hinge': 'fwd'},
                      {'at': G((d0 + d1) / 2, DHY + 0.03, md(d0, DHY)), 'w': round(d1 - d0, 2), 'h': 1.85, 'in': G((d0 + d1) / 2, DHY - 0.8, md(d0, DHY)), 'to': 'cabin', 'hinge': 'fwd'},
                      {'at': G(X_FC - 0.04, (FDOOR[0] + FDOOR[1]) / 2, md(X_FC, 0.8)), 'w': round(FDOOR[1] - FDOOR[0], 2), 'h': 1.80, 'in': G(X_FC + 0.8, (FDOOR[0] + FDOOR[1]) / 2, md(X_FC, 0.8)), 'to': 'fc', 'open': True},
                      {'at': G(WX0 - 0.03, (ADOOR[0] + ADOOR[1]) / 2, fl), 'w': round(ADOOR[1] - ADOOR[0], 2), 'h': 1.92, 'in': G(WX0 + 0.8, (ADOOR[0] + ADOOR[1]) / 2, fl), 'to': 'helm', 'open': True}],
            'names': name_strips(G),
            # the work at sea: the fisher at the hauler on the starboard rail, the bleeding tub (the game's) just aft of him by the
            # bulwark, her own gutting table for three aft of that, the one who ices at the hatch's coaming inboard of them
            'work': {'table': G((TABLE[0] + TABLE[1]) / 2, (ty0 + ty1) / 2, md(9.3, 3.0)), 'tub': G(TUB[0], tub_y(), md(TUB[0], 3.0)), 'own': True, 'top': round(z_md(9.3) + 0.90 - WL, 3),
                     'pack': G(PACK[0], PACK[1], md(*PACK)) + [round(-math.pi / 2, 3)]},
            'hatch': G((HATCH[0] + HATCH[1]) / 2, 0.0, z_md((HATCH[0] + HATCH[1]) / 2) + HATCH_H), 'bunk': G(4.0, 1.2, md(4.0, 1.2) + 0.6), 'exhaust': G(FUN[0] - 0.12, 0, BD() + 0.06 + 2.65),
            'deck': {'y': round(md(10.5, 2.0) - WL, 3), 'z': round(-(10.5 - XM), 3)}, 'gw': round(z_cap(10.5) - WL, 3),
            'stern': round(XM - XA, 3), 'bow': round(-(XF - XM), 3), 'side': round(BEAM / 2, 3), 'beam': BEAM, 'pl': 8.4, 'rl': 2.7, 'open': False, 'hand': False,
            'pole': G(px - 0.22, py, zp + 1.62), 'hauler': G(HX, -(ycap(HX) - 0.02), z_cap(HX) + 0.35), 'haulerFoot': G(HX, -(ybi(HX) - HFOOT), md(HX, 3.0)),
            # ([side, z, x, y]: the point on the cap itself, 5 cm inside its outer edge; 13-instruments.js jigRail)
            'jigZ': [[sd, round(XM - x, 3), round(sd * (ysh(x) - 0.05), 3), round(z_cap(x) + 0.012 - WL, 3)] for sd, x in JIG],
            'filler': G(7.55, ybw(7.55) - 0.02, md(7.55, 3.3) + 0.30),
            'kit': dict(kit_places(G), **pot_kit(G))}


# ---------- the checks against the data, the rules and the game's demands (sulebas-bygging kap. 15) ----------
def displacement(wl):
    xs = [XA + (XF - XA) * i / 420 for i in range(421)]
    def area(x):
        s = section(x); a = 0.0
        for (y0, z0, _), (y1, z1, _) in zip(s, s[1:]):
            za, zb = min(z0, wl), min(z1, wl)
            if z1 > z0 and za < wl: a += (y0 + y1) / 2 * (zb - za)
        return 2 * a
    A = [area(x) for x in xs]
    v = sum((A[i] + A[i + 1]) / 2 * (xs[i + 1] - xs[i]) for i in range(420))
    return v * 1.025, max(A), sum((A[i] + A[i + 1]) / 2 * (xs[i + 1] - xs[i]) * (xs[i] + xs[i + 1]) / 2 for i in range(420)) / max(v, 1e-9)

def check():
    out = []; md = mdeck
    v, amax, lcb = displacement(WL); wl1 = WL; st = -0.005 if v > DISP else 0.005
    for _ in range(120):
        if (displacement(wl1)[0] - DISP) * st < 0: wl1 += st
        else: break
    xs = [XA + (XF - XA) * i / 420 for i in range(421)]
    wlx = [x for x in xs if z_low(x) < WL]; lwl = wlx[-1] - wlx[0]; mw = max(y_at(x, WL) for x in xs)
    out.append(('deplasement %.1f t ved vannlinja (kjølen med) mot %.0f t i VESSELS (tom båt, valg 18 A); %.0f t gir vannlinja %.3f m %s; vannlinja %.2f m lang og %.2f bred, blokk-koeffisient %.2f (kroppen), største snitt %.2f m2, oppdriftssenteret %.2f m %s for midten'
                % (v, DISP, DISP, abs(WL - wl1), 'lavere' if wl1 < WL else 'høyere', lwl, 2 * mw, v / 1.025 / (lwl * 2 * mw * (WL - min(z_low(x) for x in xs))), amax, abs(lcb - XM), 'akter' if lcb < XM else 'forut'), abs(v - DISP) / DISP < 0.03))
    out.append(('lengde over alt %.2f m (rundgattens spiss til stevnens topp) mot %.2f' % (XF - XA, L), abs(XF - XA - L) < 0.02))
    mb = max(ysh(x) for x in xs[::4]); mr = max(max(y_at(x, z_rub(x)) + RUBW, y_at(x, WL + 1.5)) for x in xs[::4])
    out.append(('største bredde %.2f m ved ripa, %.2f over fenderlista, mot %.2f (vannlinja %.2f m)' % (2 * mb, 2 * mr, BEAM, 2 * mw), abs(2 * max(mb, mr) - BEAM) / BEAM < 0.03))
    out.append(('dypgang %.2f m med kjølen (hælen under propellen) mot %.2f i VESSELS; kroppen alene %.2f' % (WL - 0.0, DRAFT, WL - min(z_low(x) for x in xs)), abs(WL - DRAFT) < 0.05))
    out.append(('fribord: hoveddekket %.2f m over vannet midtskips (%.2f ved huset, %.2f ved bakken), ripa %.2f over dekket; bakkdekket %.2f over hoveddekket ved fronten; stevnen %.2f og hekken %.2f over vannet'
                % (z_md(XM) - WL, z_md(DH1) - WL, z_md(X_FC) - WL, BW, z_fc(X_FC) - z_md(X_FC), z_cap(XF) - WL, z_cap(XA) - WL), z_md(XM) - WL > 0.8))
    # the game's deck map: DM_HEAD 1.85 over a floor; a part more than 1.6 m up needs its stair
    dfc = z_fc(X_FC) - z_md(X_FC); dbd = BD() + 0.06 - md(DH0 - 0.3, 1.5)
    out.append(('bakkdekket %.2f m og båtdekket %.2f m over hoveddekket: for høyt for dekkskartets egen lenke (1,6), leiderne er ankeret stairs; døra i bakkens front %.2f m høy over en terskel på 0,12' % (dfc, dbd, 1.80), dfc > 1.6 and dbd > 1.6 and dfc >= 1.80 + 0.12 + 0.03))
    out.append(('styrhuset: %.2f m fra dørken til takets underside (brotest 1,8, dekkskartet 1,85)' % (WR() - WFL()), WR() - WFL() >= 1.88))
    fl = WFL(); ey = fl + EYE_H
    out.append(('øyet %.2f m over frontvinduenes underkant, %.2f under overkanten' % (ey - WS(), WH() - ey), ey - WS() > 0.3 and WH() - ey > 0.05))
    dzm = dzf((DASHZ[0] + DASHZ[1]) / 2); dxm = (DASHX[0] + DASHX[1]) / 2
    ang = math.degrees(math.atan2(ey - dzm, dxm - SKIP[0])); up = math.degrees(math.atan2(WH() - ey, WXF + lean_at(WH()) - SKIP[0]))
    out.append(('dashbordet %.0f grader under øyet, vinduets overkant %.0f over (hp %.2f rad og fov %d: synsfeltet går fra %.0f ned til %.0f grader)' % (ang, up, HP, FOV, FOV / 2 - math.degrees(-HP), math.degrees(-HP) + FOV / 2),
                ang <= math.degrees(-HP) + FOV / 2 - 3 and up <= FOV / 2 - math.degrees(-HP) + 12))
    out.append(('rattet %.2f m forut for skipperen, setet %.2f m bak ham; baugen fra øyet: bakkens ripe ligger %.1f grader under vannrett' % (WHEEL[0] - SKIP[0], SKIP[0] - SEAT[0], math.degrees(math.atan2(ey - (z_cap(XF - 0.3) + RAIL_H - FCB), XF - 0.3 - SKIP[0]))),
                0.3 <= WHEEL[0] - SKIP[0] <= 0.55 and SKIP[0] - SEAT[0] >= 0.35 and ey > z_cap(XF - 0.3) + RAIL_H - FCB))
    # the lanterns (FOR-1975-12-01-5 vedlegg I, read on Lovdata; 20 m and over): 'the hull' is the uppermost continuous deck, the main deck
    hull = z_md(MX); wz = white_z(); sz = side_z()
    out.append(('topplanterna %.2f m over skroget (hoveddekket ved masta; vedlegg I 2(a)(i), 20 m og over: minst 6 m, og minst bredden %.1f m når den er over 6 m, høyst 12)' % (wz - hull, BEAM), wz - hull >= min(12.0, max(6.0, BEAM))))
    out.append(('topplanterna %.2f m forut for midten (3(d): én topplanterne skal stå forut for midtskips), og over og klar av de andre lysene (2(f)): %.2f m over det røde fiskelyset' % (MX - XM, wz - FISH_R), MX > XM and wz - FISH_R >= 0.5))
    hs = z_md(SIDE_X)
    out.append(('sidelanternene %.2f m over skroget, topplanterna %.2f (2(g): sidene høyst tre firedeler så høyt, %.2f), og %.1f m akter for topplanterna (3(b): ikke forut for den)' % (sz - hs, wz - hull, 0.75 * (wz - hull), MX - SIDE_X), sz - hs <= 0.75 * (wz - hull) and SIDE_X < MX))
    sp = FISH_R - FISH_W
    out.append(('fiskelysene rødt over hvitt %.2f m fra hverandre (2(i)(i), 20 m og over: minst 2 m), det nederste %.2f m over skroget (minst 4 m), og %.2f over sidelanternene (2(j): minst to ganger avstanden, %.2f)' % (sp, FISH_W - hull, FISH_W - sz, 2 * sp),
                sp >= 2.0 and FISH_W - hull >= 4.0 and FISH_W - sz >= 2 * sp))
    px, py = POLE; sl = stern_l()
    out.append(('hekklanterna %.2f m over vannet ved rekka akter; topplanterna %.1f m fra flaggstanga og %.1f m over den: spillet gir vimpel (mastTop)' % (sl[2] - WL, math.hypot(MX - px, py), wz - (z_cap(px) + 1.63)), math.hypot(MX - px, py) > 1.0 and wz > z_cap(px) + 1.7))
    tip = PROP[2] + PR; low = PROP[2] - PR
    out.append(('propellen Ø %.2f: %.2f m klaring til skroget over, %.2f til skoen under, %.2f til kjølen forut, %.2f til roret akter' % (2 * PR, z_low(PROP[0] + 0.1) - tip, low - 0.12, X_KA - PROP[0] - 0.10, PROP[0] - 0.12 - RX_),
                z_low(PROP[0] + 0.1) - tip > 0.10 and low - 0.12 > 0.05 and X_KA - PROP[0] - 0.10 > 0.15 and PROP[0] - 0.12 - RX_ > 0.1))
    # (the pchip fault from H3d1: a table cached by id() gave stations the wrong curve, and the two sides differed)
    dsy = max(abs(y_at(x, z, 1) - y_at(x, z, -1)) for x in [XA + (XF - XA) * i / 120 for i in range(121)] for z in (1.2, 2.0, 2.7, 3.4, 4.0, 4.6, 5.2, 6.0, 6.8) if z_low(x) < z - 0.05)
    out.append(('sidene er like: største forskjell mellom styrbord og babord halvbredde %.4f m' % dsy, dsy < 1e-6))
    # ---- the places of the work, against the game's boxes (deckcrew.js kitBoxes, 6 cm round each) ----
    m6 = 0.06
    def apart(a, b): return a[1] <= b[0] + 1e-9 or b[1] <= a[0] + 1e-9 or a[3] <= b[2] + 1e-9 or b[3] <= a[2] + 1e-9
    def inside(b, x0, x1): return b[0] >= x0 and b[1] <= x1 and all(-ybi(x) <= b[2] and b[3] <= ybi(x) for x in (b[0], b[1]))
    ty0, ty1 = table_y(); tb = (TABLE[0], TABLE[1], ty0, ty1)
    ub = (TUB[0] - 0.54 - m6, TUB[0] + 0.54 + m6, tub_y() - 0.36 - m6, tub_y() + 0.36 + m6)
    hf = -(ybi(HX) - HFOOT); hbx = (HX - 0.20 - m6, HX + 0.20 + m6, hf - 0.175 - m6, hf + 0.175 + m6)
    hat = (HATCH[0] - 0.03, HATCH[1] + 0.03, HATCH[2] - 0.03, HATCH[3] + 0.03)
    sb = (STAMP[0] - 0.75 - 1.01 - m6, STAMP[0] - 0.75 + 1.01 + m6, STAMP[1] - 0.26 - 0.39 - m6, STAMP[1] - 0.26 + 0.39 + m6)
    gb = (GARN[0] - 0.6 - m6, GARN[0] + 0.6 + m6, GARN[1] - 0.5 - m6, GARN[1] + 0.5 + m6)
    out.append(('haleren på styrbord ripe ved x %.2f, ripa %.2f m over dekket der (jigRail og haleren: 0,35–1,3); foten %.2f m fra midten, %.2f innenfor skansekledningens innside (%.2f); spillets egen plass (%.2f) ville stått %s'
                % (HX, z_cap(HX) - z_md(HX), -hf, HFOOT, ybi(HX), BEAM / 2 - 0.2, 'i skansekledningen' if BEAM / 2 - 0.2 > ybi(HX) - 0.05 else 'innenfor'), 0.35 <= z_cap(HX) - z_md(HX) <= 1.3 and -hf < ybi(HX) - 0.1))
    out.append(('haleren under galgen: galgebeina ved x %.2f og %.2f, %.2f m forut for haleren (den som haler, står ved x %.2f og %.2f, klar av det akterste beinet med %.2f m)' % (GAL[0], GAL[1], GAL[0] - HX, HX - 0.2, HX + 0.55, GAL[0] - 0.07 - (HX + 0.55 + 0.25)),
                GAL[0] - 0.07 - (HX + 0.55 + 0.25) >= -0.35 and GAL[1] < X_FC - BRK + 0.01))
    out.append(('blødekaret (spillets, 0,72 × 1,08 m) ved skansekledningen x %.2f–%.2f, %.2f m akter for halerens fot; den som bløgger, står innenfor det (y %.2f), %.2f m fra luka' % (ub[0], ub[1], hbx[0] - ub[1], ub[3] + 0.3, hat[2] - (ub[3] + 0.55)),
                apart(ub, hbx) and inside(ub, DH1, X_FC) and hat[2] - (ub[3] + 0.55) >= 0.0))
    stand = ty1 + 0.34 + 0.25
    out.append(('sløyebordet (hennes eget) langs styrbord skansekledning x %.2f–%.2f, %.2f m langt: tre står side om side med 0,7 m imellom (F19; det gamle var 0,9 m), %.2f m akter for karet og %.2f forut for huset; gangen mellom dem som sløyer og luka er %.2f m'
                % (TABLE[0], TABLE[1], TABLE[1] - TABLE[0], ub[0] - TABLE[1], TABLE[0] - DH1, hat[2] - stand), TABLE[1] - TABLE[0] >= 2.0 and ub[0] - TABLE[1] >= 0.0 and TABLE[0] - DH1 >= 0.25 and hat[2] - stand >= 0.6 and ty0 >= -ybi(TABLE[0]) and ty0 >= -ybi(TABLE[1])))
    out.append(('den som iser, står ved lukas styrbord karm (x %.2f, y %.2f), %.2f m fra karmen og %.2f m innenfor dem som sløyer' % (PACK[0], PACK[1], hat[2] - PACK[1], PACK[1] - (ty1 + 0.34)), 0.3 <= hat[2] - PACK[1] <= 0.7 and PACK[1] - (ty1 + 0.34) >= 0.4))
    out.append(('stampene om babord for luka: blokken med åtte x %.2f–%.2f, y %.2f til %.2f; %.2f m gang til luka og %.2f m til skansekledningen' % (sb[0], sb[1], sb[2], sb[3], sb[2] - hat[3], ybi(sb[0], 1) - sb[3]),
                inside(sb, DH1, X_FC) and sb[2] - hat[3] >= 0.7 and ybi(sb[0], 1) - sb[3] >= 0.4))
    r = 0.725 + m6; pk = []
    for i, (x, y, dz, h) in enumerate(POTS):
        bx = (x - r, x + r, y - r, y + r)
        ok = inside(bx, DH1, X_FC - 0.6) and all(math.hypot(x - q[0], y - q[1]) >= 2 * 0.725 for j, q in enumerate(POTS) if j != i) and apart(bx, ub) and apart(bx, hbx) and apart(bx, tb)
        ok = ok and (dz > 0 and hat[0] <= bx[0] + 0.1 and bx[1] <= hat[1] + 0.1 or dz == 0 and apart(bx, hat)) and apart(bx, sb) and bx[2] > -(ybi(HX) - 0.55 - 0.45)
        pk.append(ok)
    out.append(('teinestablene (ring 1,45 m): %s; plass til %d mot gearMax.teine 30; fri av haleren, dem som haler (y %.2f), karet, bordet, stampene og hverandre; %.2f m gang forut for dem til bakkens front'
                % (', '.join('x %.2f y %.2f h %d' % (x, y, h) for x, y, _, h in POTS), sum(h for *_, h in POTS), -(ybi(HX) - 0.55), X_FC - (POTS[0][0] + r)), all(pk) and sum(h for *_, h in POTS) >= 30))
    pj = (potplaces.table().get('kyst21') or {}).get('at') or []; mine = pot_kit(lambda x, y, z: [round(v, 3) for v in to_game((x, y, z))])['pots']['at']
    out.append(('potplaces.json har de samme stablene som modellen (%d av %d)' % (sum(1 for a, b in zip(pj, mine) if all(abs(p - q) < 0.02 for p, q in zip(a, b))), len(mine)), len(pj) == len(mine) and all(abs(p - q) < 0.02 for a, b in zip(pj, mine) for p, q in zip(a, b))))
    cb = [(x - 0.6 - m6, x + 0.6 + m6, y - 0.4 - m6, y + 0.4 + m6) if abs(ry) < 0.1 else (x - 0.4 - m6, x + 0.4 + m6, y - 0.6 - m6, y + 0.6 + m6) for x, y, dz, ry in CARGO]
    okc = all(apart(a, b) for i, a in enumerate(cb) for b in cb[i + 1:]) and all(apart(b, tb) and apart(b, ub) and apart(b, sb) for b in cb)
    okc = okc and all((dz > 0) == (not apart(b, hat)) for b, (x, y, dz, ry) in zip(cb, CARGO)) and all(b[0] >= DH1 + 0.02 for b in cb) and all(apart(b, (POTS[3][0] - r, POTS[3][0] + r, POTS[3][1] - r, POTS[3][1] + r)) for b in cb)
    out.append(('lasteenhetene (0,8 × 1,2 m): %d plasser, fire på dekket mellom huset og luka og én på lukas akterkant; fri av hverandre, bordet, stampene og teinestabelen på luka; %.2f m gang om babord til sidedekket og %.2f m til dem som sløyer'
                % (len(CARGO), ybi(8.7, 1) - max(b[3] for b in cb), min(b[2] for b in cb) - stand), okc and ybi(8.7, 1) - max(b[3] for b in cb) >= 0.7 and min(b[2] for b in cb) - stand >= 0.5))
    # the after deck: the nets inside the stern's roller, the gear straight aft over it (F20)
    xs_ = set_x(); mag = (xs_ + 0.99 - 0.53 - m6, xs_ + 0.99 + 0.53 + m6, SETY - 0.3 - m6, SETY + 0.3 + m6)
    out.append(('akterdekket bak huset (x %.2f til %.2f): setterullen i hekkens skansekledning ved x %.2f, y %.2f (kit.setter), %.2f m over dekket (deckcrew.js setOver: 0,35–1,7 under punktet); garnkaret rett forut for den x %.2f–%.2f, setterens magasin x %.2f–%.2f imellom; %.2f m dørk til den som setter; %.2f m gang forbi karet til huset'
                % (XA, DH0, xs_, SETY, z_cap(xs_) + 0.16 - md(xs_ + 0.6, SETY), gb[0], gb[1], mag[0], mag[1], gb[0] - xs_ - 0.1, DH0 - gb[1]),
                apart(gb, mag) and inside(gb, xs_ + 0.1, DH0) and inside(mag, xs_ + 0.05, DH0) and 0.5 <= z_cap(xs_) + 0.16 - md(xs_ + 0.6, SETY) <= 1.6 and abs(GARN[1] - SETY) < 0.05 and DH0 - gb[1] >= 0.7 and gb[0] - xs_ - 0.1 >= 0.9))
    out.append(('redskapets vei (F20): garnet går fra karet rett akterover til rullen (samme y), ingenting imellom; lina fra stampen som bæres akter; sidedekkene forbi huset er %.2f m brede (huset %.2f, skansekledningens innside %.2f)' % (ybi(5.0) - DHY, DHY, ybi(5.0)), ybi(DH0 + 0.1) - DHY >= 0.8 and ybi(DH1 - 0.1) - DHY >= 0.8))
    # the jigging places (F21)
    js = {sd: sorted(x for s_, x in JIG if s_ == sd) for sd in (1, -1)}; gaps = [b - a for sd in js for a, b in zip(js[sd], js[sd][1:])]
    okj = all(DH1 + 0.5 <= x <= X_FC - BRK - 0.3 for x in js[-1]) and all(DH0 + 0.3 <= x <= DH1 - 0.3 and not (DDOOR[0] - 0.3 < x < DDOOR[1] + 0.3) for x in js[1])
    out.append(('juksaplassene (F21): %d, fire om babord langs arbeidsdekket (x %s) og fire om styrbord langs sidedekket ved huset (x %s; haleren, karet og bordet har styrbord ripe på arbeidsdekket), minst %.2f m mellom to på samme side, klar av døra; ripa %.2f–%.2f m over dekket; VESSELS.kyst21.jukseMax er %d'
                % (len(JIG), js[-1], js[1], min(gaps), min(z_cap(x) - z_md(x) for _, x in JIG), max(z_cap(x) - z_md(x) for _, x in JIG), len(JIG)), len(JIG) == 8 and min(gaps) >= 1.0 and okj and all(0.35 <= z_cap(x) - z_md(x) <= 1.3 for _, x in JIG)))
    out.append(('kranens fot på bakkdekket om babord x %.2f, y %.2f (hun legger babord til, F22): %.2f m fra bakkens akterkant, %.2f fra rekka, %.2f m til lukas midte og %.2f m ut til kaikanten' % (CRANE[0], CRANE[1], CRANE[0] - X_FC, ybw(CRANE[0], z_fc(CRANE[0])) - CRANE[1], math.hypot(CRANE[0] - (HATCH[0] + HATCH[1]) / 2, CRANE[1]), BEAM / 2 - CRANE[1]),
                CRANE[0] - X_FC >= 0.5 and ybw(CRANE[0], z_fc(CRANE[0])) - CRANE[1] >= 0.5))
    # the name and the mark (maletest): the mark at the bow (markStrips: from 15 m 0.45 m letters, a 0.61 m strip some 0.11 L from the stem), the name aft of it
    xm_ = XF - 0.11 * L
    out.append(('navnefeltene på bakkens hvite x %.2f–%.2f (%.2f m høyt felt der); merket ved x %.2f forut for dem' % (NAME_X[0], NAME_X[1], min(z_cap(x) - z_sheer(x) for x in NAME_X), xm_), NAME_X[1] < xm_ - 0.6 and min(z_cap(x) - z_sheer(x) for x in NAME_X) >= 0.55))
    # vessel3d: the hull from 0.3 m under the water to 1.5 m over it
    z1b = WL + 1.5; xin = [x for x in xs if z_low(x) < z1b]; ln = xin[-1] - xin[0]
    out.append(('vessel3d: skroget i båndet -0,3 til 1,5 m er %.2f m langt (lengden %.2f, -6 %% til +3 %%) og %.2f m bredt (bredden %.2f, ±5 %%)' % (ln, L, 2 * mr, BEAM), -0.06 < (ln - L) / L < 0.03 and abs(2 * mr - BEAM) / BEAM < 0.05))
    # the hull's fairness (sulebas-bygging kap. 16)
    worst = (0.0, 0, 0)
    for z in (1.2, 1.8, 2.4, 3.0, 3.4, 4.0, 4.6, 5.2):
        xs3 = [0.5 + 0.06 * i for i in range(320) if z_low(0.5 + 0.06 * i + 0.18) < z - 0.05 and z_low(0.5 + 0.06 * i - 0.18) < z - 0.05 and 0.5 + 0.06 * i < 18.9]
        yv = [y_at(x, z) for x in xs3]; d = [b - a for a, b in zip(yv, yv[1:])]
        for i in range(1, len(d)): worst = max(worst, (abs(d[i] - d[i - 1]), xs3[i], z))
    out.append(('vannlinjene jevne: største endring i stigningen %.3f m per 6 cm-steg (ved x %.2f, z %.2f; en bule synes over rundt 0,02)' % worst, worst[0] < 0.02))
    for s, ok_ in out: print(('OK   ' if ok_ else 'FEIL ') + s)
    return all(o for _, o in out)


SHOTS = [('bow3q', (36.0, -22.0, 8.0), (9.0, 0, 5.0), 35), ('stern3q', (-14.0, 15.0, 10.0), (7.0, 0, 5.0), 35), ('side', (9.0, -40, 5.5), (9.0, 0, 6.0), 35),
         ('above', (28.0, -18.0, 24.0), (9.0, 0, 4.0), 35), ('deck', (4.0, -9.0, 10.0), (11.0, 0, 5.5), 35)]
ZC = z_md(10.5)
K5 = ((8.6, 1.9, z_md(10.5) + 1.75), (12.6, -2.6, z_md(10.5) + 0.7))      # on the working deck by the house, looking forward at the hauler's place
def _eye(): return (SKIP[0], SKIP[1], WFL() + EYE_H)
EYE = None
CLOSE = []

def main():
    os.makedirs(OUT, exist_ok=True)
    if 'check' in sys.argv: sys.exit(0 if check() else 1)
    check()
    reset(); colours()
    solids, glass = build(True)
    join(solids, 'BOAT0'); join(glass, 'GLASS0')
    if 'fast' not in sys.argv and 'dry' not in sys.argv: beauty(OUT, 'ky', WL, SHOTS)
    bpyutil.LODM_TRIS = 40000
    ex = {'frame': 'kystfiske: x starboard, y up from the waterline, z aft; metres', 'type': 'kyst21', 'name': 'Older coastal vessel 21 m',
          'len': L, 'beam': BEAM, 'draft': DRAFT, 'anchors': anchors()}
    export_boat(build, to_game, to_game_n, OUT, 'kyst21.glb', os.path.join(ROOT, 'src', 'data', 'boat-kyst21.b64'), ex,
                side=(os.path.join(ROOT, 'src', 'data', 'boat-kyst21-side.b64'), 9.0, 5.4, 24.0), dry='dry' in sys.argv)


EYE = _eye()
_zc = z_md(10.5)
CLOSE = [('c_helm', (6.15, -0.45, WFL() + 1.72), (7.5, -0.85, WFL() + 1.05), 30, False, False), ('c_wh', (13.5, -6.5, 9.6), (6.6, -0.3, 7.8), 30, True, False),
         ('c_stern', (-8.5, -4.5, 7.6), (0.3, 0, 5.2), 32, True, False), ('c_bow', (25.0, -5.5, 7.2), (17.0, 0, 5.8), 30, True, False),
         ('c_aperture', (0.9, -5.0, 1.3), (0.9, 0, 1.2), 30, False, False), ('c_haul', (11.6, -9.5, 6.6), (11.2, -2.6, 5.0), 30, True, False),
         ('c_work', (8.5, 2.6, _zc + 1.75), (12.0, -2.9, _zc + 0.6), 22, False, False), ('c_aft', (2.2, 0.3, _zc + 1.95), (-1.4, -0.7, _zc + 0.9), 20, False, False),
         ('c_fore', (13.2, 2.4, 9.3), (17.2, 0, 6.9), 30, True, False), ('c_rig', (22.0, -10.0, 13.0), (12.0, 0.0, 10.0), 35, True, False),
         ('c_break', (10.4, -1.0, _zc + 1.7), (14.6, 0.2, _zc + 1.2), 24, False, False), ('c_port', (11.0, 11.0, 7.4), (10.5, 2.5, 5.0), 30, True, False),
         ('c_deck', (11.0, -0.01, 19.0), (11.0, 0, 4.5), 30, False, False),
         ('K6p', (XM + 55.0, 42.0, 7.0), (XM, 0, 5.0), 100, True, True)]


if __name__ == '__main__':
    main()
