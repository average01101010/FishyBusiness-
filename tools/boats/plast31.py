"""The 31 ft fibreglass sjark (plastsjark): a 9.45 m displacement coastal fishing boat of the kind that became the standard Norwegian
sjark from the late 1970s on (the Viksund 31 Sjark, «den første moderne sjarkmodellen»; the make is only named here and in the docs,
CLAUDE.md): the wheelhouse aft, a clear working deck amidships with the hold's hatch and the hauler's place at the starboard rail, a low
cabin trunk forward with two berths, a full keel with the propeller in an aperture forward of the rudder, a slow diesel.

Rebuilt 01.11.2026 after the pilot boat's way of working (docs/skipsmodeller/plastsjark-grunnlag.md, sulebas-bygging.md; Jonas: «Løft
den til samme nivå og arbeidsmåte som pilotbåten ringnot38 og de reviderte båtene trebat, skiff og snekke»). The first script
(17.10.2026) was drawn after the published measures of the type, read 17.10.2026 (no drawing and no photograph is in the repository):
length over all 9.26–9.45 m and beam 3.05–3.30 m in the registers and the used-boat listings (finn.no 410602365, 342334894, 16205596,
437307963, 453502250, 446875795), draft 1.2–1.5 m by the load (yachtdatabase.com, Viksund Sjark 31), hull depth 1.0–1.35 m, weight
5–6 t as a working boat (some listings 7–8 t with extra ballast), engines 68–200 hp (a Sabb 100 hp on the later ones, erlingjensen.net),
7–8 knots. The game's boat (VESSELS.plastsjark): 9.45 x 3.30 m, 1.35 m draft with the keel, 6 t, 100 hp, built 1992. Its sections were
a superellipse from the keel's underside to the sheer, which gave 21.9 t under the waterline (check(); kartlegging-spillet.md D8);
the sheer, the half-breadths at the sheer, the stem and the plan of the decks are kept, the body under the water and the keel are new.

The hull is ONE surface: both sides with the keel, the transom, the bulwarks' inside and caps, the decks, the cabin trunk and the
wheelhouse's foot share their points (Mesh). Openings are real holes, cut with a boolean and lined: the portholes, the companionway, the
forward hatch, the freeing ports, the scuppers, the exhaust's cooling water and the bilge pump's outlet. Nothing lies in the plane of
anything else. The fittings other boats can use come from fittings.py (the propeller, the anodes, the cleats, the lanterns, the bow
roller, the hatch lids, the wheel, the single-lever control, the helm seat, the whip, the GPS, the rudder).

Nothing that can be bought is modelled in (the game sets the deck kit at the places in kit, 19.10.2026): no hauler, no tubs, no
liferaft, no radar, no ring buoys. The plotter and the VHF are standard on this boat (VESSELS.plastsjark.std) and are part of her.

    pip install bpy==4.5.4   (Python 3.11)
    python3 tools/boats/plast31.py            -> src/data/boat-plast31.b64 (+ the side picture), renders in tools/boats/out/
    python3 tools/boats/plast31.py fast       -> the same without the renders
    python3 tools/boats/plast31.py fast dry   -> no renders, the GLB only in tools/boats/out
    python3 tools/boats/plast31.py check      -> the checks against the tables, the data and the rules only

Frame: x forward from the transom's top, y to port, z up from the keel's underside (the base line); the waterline is z = 1.35."""
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy, bmesh
from bpyutil import *
import bpyutil
import fittings as F
from mathutils import noise

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE)); OUT = os.path.join(HERE, 'out')
L = 9.45; BEAM = 3.30; DRAFT = 1.35; DISP = 6.0               # VESSELS.plastsjark
WL = 1.35; XA = 0.0; XF = 9.45; XM = (XA + XF) / 2; HB = BEAM / 2
X_KA = 1.30                  # the keel's after edge, the forward side of the propeller's aperture
RAKE = 0.10                  # the transom's rake: its top stands this far aft of its foot
BW_H = 0.55                  # the bulwark: the deck lies this far under the sheer
STRIPE = (0.31, 0.175)       # the navy sheer stripe: from this far under the sheer to this far under it
RUB = (0.115, 0.035, 0.032)  # the teak rubbing strake along the sheer: from this far under it to this far under it, standing out so far
SLB = 0.012                  # the paint lines rise 12 mm a metre forward of midships (planliste kap. 29: they follow the sheer)
Z_AF = WL + 0.04; Z_BT = WL + 0.13                           # the antifouling to 4 cm over the water, the black boot top over it


# ---------- the lines (metres). The sheer, the half-breadths at the sheer and the stem's top are the first script's (the published
# measures of the type); the keel, the body under the water and the half-breadths at the waterline are new (check(): 6.0 t) ----------
SHEER = [(XA, 2.50), (1.5, 2.44), (3.2, 2.41), (5.0, 2.46), (6.5, 2.58), (7.8, 2.76), (8.8, 2.93), (XF, 3.04)]
BS = [(XA, 1.42), (1.0, 1.55), (3.0, 1.65), (5.0, 1.65), (6.5, 1.56), (7.5, 1.36), (8.3, 1.02), (8.9, 0.60), (9.25, 0.25), (XF, 0.0)]
# the half-breadth at the waterline: about 87 % of the sheer's amidships (a round-bilged boat with flare; it cannot be read off any
# picture, sulebas-bygging kap. 13), the transom's foot just dipping
BW = [(XA, 1.06), (1.0, 1.27), (3.0, 1.40), (5.0, 1.38), (6.3, 1.21), (7.3, 0.92), (8.0, 0.57), (8.45, 0.24), (8.68, 0.0), (XF, 0.0)]
# the keel's underside, the forefoot and the stem's fore edge (the profile): 1.35 m under the water at the keel's after end (the game's
# draft), a little drag forward, the forefoot rising round into the stem raked about 15 degrees over the water, meeting it at 8.68 m
KB = [(X_KA, 0.03), (1.6, 0.0), (3.5, 0.0), (5.2, 0.07), (6.3, 0.20), (7.1, 0.38), (7.7, 0.62), (8.15, 0.92), (8.5, 1.22), (8.72, 1.50),
      (8.95, 1.90), (9.15, 2.30), (9.32, 2.65), (XF, 2.98)]
# the body's centreline where the garboard meets the keel's side (the canoe body), rising aft to the transom's foot 0.08 m under the
# water, and forward into the forefoot
ZROOT = [(XA, 1.28), (0.5, 1.16), (1.0, 1.04), (1.6, 0.93), (2.4, 0.86), (3.6, 0.82), (4.8, 0.84), (5.8, 0.89), (6.6, 0.96), (7.3, 1.05)]
WKB = [(X_KA, 0.0), (X_KA + 0.16, 0.075), (3.0, 0.080), (6.0, 0.070), (7.6, 0.052), (XF, 0.040)]   # the keel's (the stem's) half siding
GB = (0.28, 0.46, 0.34)       # the garboard and the bilge: the cubic's first handle (its share of the breadth, GB[2] its share of the depth), the second's reach
def zs(x): return interp(SHEER, x)
def stern_round(x):
    """the quarters rounded in plan into a narrower transom (72 % of the beam), the way the sjarks of the type are drawn, not a wide box"""
    if x >= 1.2: return 1.0
    u = (1.2 - x) / 1.2; return 0.72 + 0.28 * math.sqrt(max(0.0, 1 - u * u))
def hbs(x): return max(0.0, interp(BS, x) * stern_round(x))
def hbw(x): return max(0.0, interp(BW, x) * stern_round(x))
def kb(x): return interp(KB, x) if x >= X_KA - 1e-9 else None
def wk(x): return interp(WKB, x) if x >= X_KA - 1e-9 else 0.0
def smin(a, b, k):
    h = max(k - abs(a - b), 0.0) / k; return min(a, b) - h * h * k / 4
def zr(x):
    """the canoe body's centreline height: the root table aft and amidships, joining the profile forward with a soft fillet"""
    r = interp(ZROOT, x)
    if x < X_KA: return r
    return -smin(-r, -(kb(x) + 0.02), 0.14)
def x_of(x, z):
    """a station's point at height z, the transom's rake carried into the stations aft of 0.8 m: the transom's top at x = 0, its foot
    RAKE forward of it"""
    z0, z1 = zr(XA), zs(XA); t = max(0.0, min(1.0, (z - z0) / (z1 - z0)))
    return x + RAKE * (1 - t) * max(0.0, 1 - x / 0.8)
def z_deck(x): return zs(x) - BW_H


# ---------- the sections ----------
def catmull(P, n=10):
    out = [P[0]]; Q = [P[0]] + P + [P[-1]]
    for i in range(1, len(Q) - 2):
        p0, p1, p2, p3 = Q[i - 1], Q[i], Q[i + 1], Q[i + 2]
        for k in range(1, n + 1):
            t = k / n; t2, t3 = t * t, t * t * t
            out.append(tuple(0.5 * (2 * p1[c] + (-p0[c] + p2[c]) * t + (2 * p0[c] - 5 * p1[c] + 4 * p2[c] - p3[c]) * t2 + (-p0[c] + 3 * p1[c] - 3 * p2[c] + p3[c]) * t3) for c in (0, 1)))
    return out

_CV = {}
def body(x):
    """the body's half-section at x from the keel's root to the sheer as a polyline (y, z) rising in z: a hollow garboard out of the keel
    (the wine-glass section of a sjark), a soft round bilge to the waterline, the topsides flaring out to the sheer; forward of the stem's
    waterline a fine V flaring to the sheer"""
    k = round(x, 5)
    if k in _CV: return _CV[k]
    z0, s, Bs, Bw = zr(x), zs(x), hbs(x), hbw(x); w0 = wk(x) * 1.9 if x >= X_KA + 0.16 else wk(x) * (1 + 0.9 * max(0.0, x - X_KA) / 0.16)   # the keel tapers to its root
    if z0 >= WL - 0.03 or Bw < w0 + 0.02:
        P = [(w0, z0), (w0 + (Bs - w0) * 0.45, z0 + (s - z0) * 0.52), (Bs, s)]
        c = catmull(P, 14)
    else:
        # under the water a cubic from the root to the waterline: leaving the keel steeply (the hollow garboard), rounding through the
        # bilge, and meeting the waterline along the topside's own slope, so the side runs on without a knuckle; over it the flare
        D = WL - z0; b = Bw - w0; u = (Bs - Bw, s - WL); n_ = math.hypot(*u); u = (u[0] / n_, u[1] / n_)
        k = GB[1] * D / max(u[1], 0.3)
        Q = [(w0, z0), (w0 + b * GB[0], z0 + D * GB[2]), (Bw - u[0] * k, WL - u[1] * k), (Bw, WL)]
        c = [tuple((1 - t) ** 3 * Q[0][i] + 3 * (1 - t) ** 2 * t * Q[1][i] + 3 * (1 - t) * t * t * Q[2][i] + t ** 3 * Q[3][i] for i in (0, 1)) for t in [j / 28 for j in range(29)]]
        c += [(Bw + (Bs - Bw) * j / 10 + 0.012 * math.sin(math.pi * j / 10) * 0, WL + (s - WL) * j / 10) for j in range(1, 11)]
    mono = [c[0]]
    for p in c[1:]:
        if p[1] > mono[-1][1] + 1e-5: mono.append((max(w0, p[0]), p[1]))
    _CV[k] = mono; return mono

def y_at(x, z):
    """the outside's half-breadth at x and height z"""
    c = body(x)
    if z <= c[0][1]: return c[0][0] if x >= X_KA else 0.0
    for a, b in zip(c, c[1:]):
        if a[1] <= z <= b[1]: t = (z - a[1]) / max(1e-9, b[1] - a[1]); return a[0] + (b[0] - a[0]) * t
    return c[-1][0]

def arc_pts(x, z0_, z1, n):
    """n + 1 points along the body from height z0_ up to height z1, evenly by length"""
    c = [p for p in body(x)]; pts = [(y_at(x, z0_), z0_)] if z0_ > c[0][1] else [c[0]]
    for p in c[1:]:
        if p[1] <= pts[0][1]: continue
        if p[1] >= z1:
            a = pts[-1]; t = (z1 - a[1]) / max(1e-9, p[1] - a[1]); pts.append((a[0] + (p[0] - a[0]) * t, z1)); break
        pts.append(p)
    if len(pts) == 1: return [pts[0]] * (n + 1)
    Lc = [0.0]
    for a, b in zip(pts, pts[1:]): Lc.append(Lc[-1] + math.hypot(b[0] - a[0], b[1] - a[1]))
    out = []
    for k in range(n + 1):
        s = Lc[-1] * k / n
        for i in range(1, len(Lc)):
            if Lc[i] >= s - 1e-12:
                t = (s - Lc[i - 1]) / max(1e-12, Lc[i] - Lc[i - 1]); a, b = pts[i - 1], pts[i]; out.append((a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t)); break
    return out

NKB = 4                      # rows up the keel's side
def section(x, fine=True):
    """the whole half-section at x as (y, z, kind) from the keel's underside on the centre line to the sheer; the counts never change
    (points collapse where a band is empty: aft of the keel, at the stem). kind: 'k' keel, 'b' bottom, 't' topside, 'n' the stripe,
    's' the sheer"""
    out = []
    z0 = zr(x); w = wk(x); r = body(x)[0][0]
    nk = NKB if fine else 1
    if x >= X_KA:
        b = kb(x); f = min(1.0, (x - X_KA) / 0.16); ww = w * f
        out += [(0.0, b, 'k'), (ww * 0.55, b, 'k'), (ww * 0.92, b + 0.014, 'k'), (ww, b + 0.04, 'k')] if fine else [(0.0, b, 'k'), (ww, b + 0.02, 'k')]
        for i in range(1, nk + 1):
            z = b + 0.04 + (z0 - b - 0.04) * i / nk; out.append((ww + (r - ww) * i / nk, z, 'k'))
    else:
        out += [(0.0, z0, 'k')] * ((4 if fine else 2) + nk)
    s = zs(x); cl = lambda z: min(s, max(z0, z))
    nb, nt = (22, 10) if fine else (4, 2)
    zt = cl(WL + 0.25)
    out += [(yy, zz, 'b') for yy, zz in arc_pts(x, z0, zt, nb)[1:]]
    z1 = cl(s - STRIPE[0])
    out += [(yy, zz, 't') for yy, zz in arc_pts(x, zt, z1, nt)[1:]]
    fade = 1.0 - max(0.0, min(1.0, (x - 8.6) / 0.8)) ** 2                                   # the strake thins out at the stem
    top = ((cl(s - STRIPE[0] + 0.004), 0.0, 'n'), (cl(s - STRIPE[1]), 0.0, 't'), (cl(s - RUB[0]), 0.0, 'r'), (cl(s - RUB[0] + 0.012), 0.6, 'r'),
           (cl(s - (RUB[0] + RUB[1]) / 2), 1.0, 'r'), (cl(s - RUB[1] - 0.012), 0.6, 'r'), (cl(s - RUB[1]), 0.0, 't'), (s, 0.0, 's'))
    for zq, off, kd in (top if fine else top[:3] + top[4:5] + top[6:]):
        out.append((y_at(x, zq) + RUB[2] * off * fade, zq, kd))
    return out


# ---------- colours: white gelcoat, a navy sheer stripe, red antifouling, a black boot top, a cream wheelhouse, a green deck (paint
# zones: 1 the hull, 2 the stripe, 3 the superstructure, 4 the decks; 10j-paint.js) ----------
C = {}
def colours():
    w = lambda n, rgb, g=0.4, z=0, metal=0.0, emit=0.0: C.__setitem__(n, mat(n, rgb, g, zone=z, metal=metal, emit=emit))
    w('af', (0.55, 0.12, 0.08), 0.15); w('boot', (0.06, 0.06, 0.07), 0.45); w('hull', (0.93, 0.93, 0.90), 0.6, 1)
    w('stripe', (0.08, 0.14, 0.32), 0.55, 2); w('white', (0.93, 0.92, 0.86), 0.5, 3); w('roof', (0.88, 0.88, 0.84), 0.3, 3)
    w('inner', (0.88, 0.88, 0.84), 0.3); w('cap', (0.56, 0.37, 0.20), 0.35); w('deck', (0.42, 0.50, 0.45), 0.12, 4); w('nonslip', (0.40, 0.48, 0.43), 0.06, 4)
    w('steel', (0.78, 0.80, 0.82), 0.85, 0, 0.85); w('chrome', (0.86, 0.87, 0.89), 0.95, 0, 0.9); w('alu', (0.72, 0.74, 0.76), 0.6, 0, 0.7)
    w('dark', (0.12, 0.13, 0.14), 0.25); w('black', (0.04, 0.04, 0.05), 0.4); w('rubber', (0.05, 0.05, 0.06), 0.2); w('frame', (0.07, 0.07, 0.08), 0.45)
    w('screen', (0.03, 0.05, 0.07), 0.9); w('bezel', (0.10, 0.10, 0.11), 0.5); w('cush', (0.15, 0.16, 0.19), 0.35); w('switch', (0.20, 0.21, 0.22), 0.4)
    w('prop', (0.70, 0.52, 0.27), 0.8, 0, 0.9); w('anode', (0.55, 0.56, 0.55), 0.2); w('gutter', (0.50, 0.55, 0.52), 0.2); w('cabin', (0.05, 0.05, 0.06), 0.2)
    w('wood', (0.58, 0.38, 0.20), 0.3); w('board', (0.93, 0.93, 0.90), 0.35); w('hose', (0.10, 0.36, 0.20), 0.4)
    w('lampR', (0.90, 0.10, 0.08), 0.8, 0, 0, 0.5); w('lampG', (0.10, 0.80, 0.25), 0.8, 0, 0, 0.5); w('lampW', (1.0, 0.97, 0.88), 0.8, 0, 0, 0.5)
    w('lens', (0.95, 0.94, 0.85), 0.9)
    C['glass'] = mat('glass', (0.07, 0.10, 0.13), 0.95)

def paint_line(x, z0):
    """a paint line's height at x: z0 amidships, rising SLB a metre forward (the plane build() cuts it with)"""
    return z0 + SLB * (x - XM)


# ---------- the wear: per corner, so it runs across faces (B16; 1992, gelcoat) ----------
def n3(x, y, z=0.0): return noise.noise(V((x, y, z)))
def ss(a, b, x):
    t = max(0.0, min(1.0, (x - a) / (b - a))); return t * t * (3 - 2 * t)
def toward(m, rgb, k):
    base = m['rgb']; return [1 + (rgb[i] / max(base[i], 1e-3) - 1) * k for i in range(3)]

EXH_W = (2.10, -1, 0.26)     # the engine's cooling water outlet (x, side, height over the water): a soot and water mark under it
BILGE = (4.60, -1, 0.34)     # the bilge pump's outlet (x, side, height over the water)
def wear(p, m, n):
    x, y, z = p; nm = m.name; side = 1 if y > 0 else -1
    if nm == 'hull':
        g = 0.97 + 0.04 * n3(x * 3.0, z * 6.0, side)
        g *= 1 - 0.10 * ss(0.14, 0.0, z - paint_line(x, Z_BT))                                # grime over the boot top
        g *= 1 - 0.07 * ss(0.3, 0.75, n3(x * 5.0, z * 2.0, side * 3.3)) * ss(0.35, 0.0, abs(z - (WL + 0.6))) * (abs(n.y) > 0.5)   # scuffs from quays and fenders (on the sides)
        for (xo, so, ho), k in ((EXH_W, 0.28), (BILGE, 0.18)):
            if side == so and z < WL + ho:
                g *= 1 - k * ss(0.02 + (WL + ho - z) * 0.04, 0.004, abs(x - xo)) * ss(WL, WL + 0.12, z)
        for xs_ in (4.25, 5.45):                                                               # rust-brown streaks under the freeing ports
            g *= 1 - 0.10 * ss(0.05, 0.0, abs(x - xs_ - 0.2) - 0.15) * ss(z_deck(x) - 0.03, z_deck(x) - 0.6, z) * (z > WL + 0.2)
        c = toward(m, (0.82, 0.80, 0.72), 0.28 * ss(0.2, 0.7, n3(x * 1.2, z * 3.0, side * 7.1)))   # yellowed a little in patches (34 years)
        return [c[i] * g for i in range(3)]
    if nm in ('stripe', 'boot'):
        v = 0.93 + 0.08 * n3(x * 4.0, z * 9.0, side) - 0.08 * ss(WL + 0.06, WL - 0.02, z)
        return [v, v, v]
    if nm == 'af':
        v = 0.86 + 0.14 * n3(x * 2.5, z * 6.0, y * 2.0)
        g = ss(WL - 0.08, WL + 0.02, z) * (0.5 + 0.5 * ss(-0.3, 0.4, n3(x * 3.0, side * 1.3, 4.1)))   # slime and weed at the waterline
        return [v * (1 - 0.30 * g), v * (1 + 0.15 * g), v * (1 - 0.25 * g)]
    if nm in ('white', 'roof', 'inner', 'cap'):
        v = 0.95 + 0.05 * n3(x * 5.0, y * 5.0, z * 5.0)
        if nm in ('inner',): v -= 0.10 * ss(0.15, 0.0, z - z_deck(x))                          # the bulwark's inside dirty along the deck
        c = toward(m, (0.55, 0.42, 0.28), 0.18 * ss(0.55, 0.9, n3(x * 7.0, y * 7.0, z * 7.0 + 0.5)))
        return [c[i] * v for i in range(3)]
    if nm in ('deck', 'nonslip'):
        v = 0.92 + 0.10 * n3(x * 5.0, y * 5.0, 1.0)
        v *= 1 - 0.14 * ss(0.7, 0.0, math.hypot(x - 5.6, y + 1.0)) - 0.10 * ss(0.6, 0.0, math.hypot(x - 5.3, y - 0.9))   # worn where they work
        return toward(m, (0.55, 0.55, 0.50), 0.25 * ss(0.3, 0.8, n3(x * 2.0, y * 3.0, 2.0)) * v) if False else [v, v, v]
    return None

def tint(o, f=wear):
    bm = bmesh.new(); bm.from_mesh(o.data); lay = bm.loops.layers.float_color.new('TINT'); mats = [s.material for s in o.material_slots]
    for fc in bm.faces:
        m = mats[fc.material_index]; fc.normal_update()
        for l in fc.loops:
            t = f(l.vert.co, m, fc.normal)
            l[lay] = (t[0], t[1], t[2], 1.0) if t is not None else (1.0, 1.0, 1.0, 1.0)
    bm.to_mesh(o.data); bm.free(); return o


# ---------- one surface: a mesh whose faces share their points (skiff59.py, snekke26.py) ----------
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


# ---------- the plan of the decks: the wheelhouse aft, the working deck amidships, the cabin trunk forward (the first script) ----------
WX0, WX1, WY = 0.95, 3.75, 1.28     # the wheelhouse: its aft and forward walls, its half width
CX0, CX1 = 6.40, 8.55        # the cabin trunk: its aft face, and where its front has sloped down to the foredeck
CAP = 0.085                  # the bulwark's cap, its width
TT = 0.06                    # the transom's thickness: the deck and the transom's inside start this far forward of its outside
def ysh(x): return section(x)[-1][0]
def ycap(x): return max(0.0, ysh(x) - CAP)                  # the cap's inner edge
def ybw(x): return max(0.0, y_at(x, z_deck(x)) - 0.065)      # the bulwark's foot on the deck (its inside leans in a little)
def cabin_w(x):
    """the trunk's half width at its foot: full aft, narrowing with the hull forward and rounding in to nothing at CX1"""
    return min(1.05, ybw(x) - 0.38) * (1.0 if x < 8.1 else max(0.0, 1 - ((x - 8.1) / (CX1 - 8.1)) ** 2) ** 0.5)
def z_trunk(x):
    """the trunk's top at its side: 0.78 over the deck, sloping down over the last 0.9 m to the foredeck"""
    zt = z_deck(x) + 0.78
    return zt if x < CX1 - 0.9 else zt - 0.78 * min(1.0, (x - (CX1 - 0.9)) / 0.9) ** 1.6
def trunk_y(x, z):
    """the trunk's side at x and height z (it leans in 5 cm over its height)"""
    zd = z_deck(x); h = max(1e-3, z_trunk(x) - zd); return max(0.0, cabin_w(x) - 0.05 * max(0.0, min(1.0, (z - zd) / h)))
def ttop(x, y):
    """the trunk's cambered top at (x, y)"""
    wt = max(1e-3, trunk_y(x, z_trunk(x))); return z_trunk(x) + 0.05 * (1 - min(1.0, (y / wt) ** 2))
def camber(x, y):
    """the deck's camber: 4 cm on the centre line"""
    e = max(0.3, ybw(x)); return 0.04 * (1 - min(1.0, (y / e) ** 2))

def stations(fine=True):
    sp = [XA, X_KA - 0.002, X_KA, WX0, WX1, CX0, CX1]
    if fine:
        xs = [0.03, 0.06, 0.09] + [0.13 + 0.035 * i for i in range(240)] + [8.55 + 0.025 * i for i in range(36)] + [X_KA + 0.04 * k for k in range(1, 5)]
        sp += stem_stations(lambda x: kb(x) if x >= X_KA else 0.0, [Z_AF, Z_BT, lambda x: zs(x) - STRIPE[0], lambda x: zs(x) - STRIPE[1]], 6.0, XF - 0.015)
    else:
        xs = [0.4, 0.8, 1.6, 2.4, 3.2, 4.4, 5.4, 7.2, 7.8, 8.3, 8.7, 9.0, 9.25]
    xs = [x for x in xs if all(abs(x - s) > 0.008 for s in sp)] + sp + [XF - 0.008, XF]
    return sorted(set(round(x, 5) for x in xs if XA <= x <= XF))

HULL_MAT = {'k': 'af', 'b': 'hull', 't': 'hull', 'n': 'stripe', 's': 'hull', 'r': 'wood'}
HULL_KIND = {'n': 2, 'r': 3}
def hull_shell(M, fine=True):
    """the outside (both sides over the keel, one surface), the transom, the bulwarks' caps and insides, the decks, the cabin trunk"""
    xs = stations(fine); S = {}
    for x in xs: S[x] = [(x_of(x, z), y, z, k) for y, z, k in section(x, fine)]
    for sg in (1, -1):
        for a, b in zip(xs, xs[1:]):
            Sa, Sb = S[a], S[b]
            for j in range(len(Sa) - 1):
                k = Sa[j][3]; dy = Sa[j + 1][1] - Sa[j][1]; dz = Sa[j + 1][2] - Sa[j][2]
                out = (0, sg * dz, -dy) if abs(dy) + abs(dz) > 1e-7 else (0, sg, 0)
                q = [(Sa[j][0], sg * Sa[j][1], Sa[j][2]), (Sb[j][0], sg * Sb[j][1], Sb[j][2]), (Sb[j + 1][0], sg * Sb[j + 1][1], Sb[j + 1][2]), (Sa[j + 1][0], sg * Sa[j + 1][1], Sa[j + 1][2])]
                M.f(q, C[HULL_MAT[k]], out, HULL_KIND.get(k, 1))
    T = S[xs[0]]
    for j in range(len(T) - 1):
        q = [(T[j][0], T[j][1], T[j][2]), (T[j][0], -T[j][1], T[j][2]), (T[j + 1][0], -T[j + 1][1], T[j + 1][2]), (T[j + 1][0], T[j + 1][1], T[j + 1][2])]
        M.f(q, C[HULL_MAT[T[j][3]]] if T[j][3] in 'nr' else C['hull'], (-1, 0, 0), HULL_KIND.get(T[j][3], 1))
    # ---- inside the bulwarks: the cap, the inside down to the deck, the deck across (the trunk forward of CX0) ----
    ND = 12 if fine else 2; NT = 10 if fine else 2
    def edge(x, sg):
        """the sheer, the cap's inner edge, the bulwark's foot on the deck (the transom's rake carried in aft)"""
        s = zs(x); zd = z_deck(x); xx = lambda z: x_of(x, z)
        return [(xx(s), sg * ysh(x), s), (xx(s + 0.012), sg * ycap(x), s + 0.012), (xx(s - 0.03), sg * (ycap(x) - 0.006), s - 0.03), (xx(zd), sg * ybw(x), zd)]
    def drow(x):
        e = ybw(x); zd = z_deck(x); xd = x_of(x, zd)
        mid = [(xd, e * (1 - 2 * i / ND), zd + camber(x, e * (1 - 2 * i / ND))) for i in range(1, ND)]
        return edge(x, 1) + mid + list(reversed(edge(x, -1)))
    def trow(x):
        e = ybw(x); zd = z_deck(x); w = min(cabin_w(x), e - 0.04); wt = trunk_y(x, z_trunk(x)); t = z_trunk(x)
        P = [(x, w, zd + camber(x, w))] + [(x, wt * (1 - 2 * i / NT), max(t + 0.05 * (1 - (1 - 2 * i / NT) ** 2), zd + camber(x, wt * (1 - 2 * i / NT)) + 0.001)) for i in range(NT + 1)] + [(x, -w, zd + camber(x, w))]
        return edge(x, 1) + P + list(reversed(edge(x, -1)))
    aft = [x for x in xs if TT - 1e-9 <= x <= CX0 + 1e-9]; tr = [x for x in xs if CX0 - 1e-9 <= x <= CX1 + 1e-9]; fd = [x for x in xs if x >= CX1 - 1e-9]
    def em(j, n):
        return C['cap'] if j in (0, 1, n - 3, n - 2) else C['inner'] if j in (2, n - 4) else None
    def eo(j, n):
        return (0, 0, 1) if j in (0, 1, n - 3, n - 2) else (0, -1, 0) if j == 2 else (0, 1, 0) if j == n - 4 else (0, 0, 1)
    D = [drow(x) for x in aft]; n = len(D[0])
    M.strip(D, lambda i, j: em(j, n) or C['deck'], lambda i, j: eo(j, n))
    Tr = [trow(x) for x in tr]; nt = len(Tr[0])
    def tm(i, j):
        e = em(j, nt)
        if e: return e
        return C['deck'] if j in (3, nt - 5) else C['white'] if j in (4, nt - 6) else C['roof']
    def to(i, j):
        if j in (4, nt - 6): return (0, 1 if j == 4 else -1, 0.15)
        return eo(j, nt)
    M.strip(Tr, tm, to)
    Fd = [drow(x) for x in fd]
    M.strip(Fd, lambda i, j: em(j, n) or C['nonslip'], lambda i, j: eo(j, n))
    # the transom's inside: the cap across the top and the inside down to the deck
    r0 = D[0]
    # the cap across the transom's top: from the outside's sheer aft of TT (the transom's top edge and the quarters) in to the inside's edge
    tops = [x for x in xs if x < TT - 1e-9]
    port = [(S[x][-1][0], S[x][-1][1], S[x][-1][2]) for x in tops]
    M.f(list(reversed(port)) + [(p_[0], -p_[1], p_[2]) for p_ in port] + [r0[n - 1], r0[n - 2], r0[1], r0[0]], C['cap'], (0, 0, 1))
    M.f([r0[2]] + r0[3:n - 3] + [r0[n - 3]] if False else [r0[1], r0[2], r0[3], r0[n - 4], r0[n - 3], r0[n - 2]], C['inner'], (1, 0, 0))
    # the trunk's aft face, from the deck up to its cambered top
    c = Tr[0]
    M.f(c[3:nt - 4], C['white'], (-1, 0, 0))
    return S


# ---------- the openings: real holes, cut with a boolean and lined (ringnot38.py, snekke26.py) ----------
PORTS = [7.00, 7.70]                                           # the portholes on each side of the trunk
def port_z(x): return z_deck(x) + 0.42
COMP = (-0.30, 0.32, 0.06, 0.72)                              # the companionway in the trunk's aft face: y from, to; z over the deck from, to
HATCH_F = (7.02, 7.52, -0.25, 0.25)                           # the forward hatch on the trunk's top
HOLD = (4.62, 5.72, -0.62, 0.62)                              # the hold's hatch in the working deck
FREE = [(4.25, 0.40), (5.45, 0.40), (1.55, 0.36)]             # the freeing ports in the bulwarks at the deck (x from, length)
EXH_R = 0.035; BILGE_R = 0.016

def rr_pts(cx, cy, w, h, r, n=4):
    return rrect(cx, cy, w, h, max(0.004, min(r, w / 2 - 0.002, h / 2 - 0.002)), n=n)
def circle(r, n=16): return [(r * math.cos(2 * math.pi * k / n), r * math.sin(2 * math.pi * k / n)) for k in range(n)]

def cutters():
    out = []
    for sg in (1, -1):
        for x in PORTS:
            z = port_z(x); out.append(((x, sg * trunk_y(x, z), z), (1, 0, 0), (0, 0, 1), circle(0.105, 20), 0.10))
        for x0, l in FREE:                                     # through the bulwark: outside and inside
            zd = z_deck(x0 + l / 2); out.append(((x0 + l / 2, sg * (ybw(x0 + l / 2) + 0.03), zd + 0.10), (1, 0, 0), (0, 0, 1), rr_pts(0, 0, l, 0.15, 0.03), 0.16))
    y0, y1, z0, z1 = COMP; zd = z_deck(CX0)
    out.append(((CX0, (y0 + y1) / 2, zd + (z0 + z1) / 2), (0, 1, 0), (0, 0, 1), rr_pts(0, 0, y1 - y0, z1 - z0, 0.05), 0.06))
    x0, x1, y0, y1 = HATCH_F; out.append((((x0 + x1) / 2, 0, ttop((x0 + x1) / 2, 0)), (1, 0, 0), (0, 1, 0), rr_pts(0, 0, x1 - x0, y1 - y0, 0.05), 0.12))
    x0, x1, y0, y1 = HOLD; out.append((((x0 + x1) / 2, 0, z_deck(5.17) + 0.02), (1, 0, 0), (0, 1, 0), rr_pts(0, 0, x1 - x0, y1 - y0, 0.04), 0.10))
    out.append(((0, 0, z_deck(2.3)), (1, 0, 0), (0, 1, 0), wh_inner(), 0.12))                 # the deck inside the wheelhouse (its sole is sunk)
    for x, sg, h, r in ((EXH_W[0], EXH_W[1], EXH_W[2], EXH_R), (BILGE[0], BILGE[1], BILGE[2], BILGE_R)):
        out.append(((x, sg * y_at(x, WL + h), WL + h), (1, 0, 0), (0, 0, 1), circle(r, 16), 0.05))
    return out

def cut_holes(target):
    bm = bmesh.new()
    for o, u, v, poly, d in cutters():
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
    """the reveals, the glass, the frames and what is behind the openings"""
    s = lambda q: C['steel']
    # the portholes: a stainless ring proud of the trunk's side, the reveal, the glass in it, the cabin dark behind
    for sg in (1, -1):
        for x in PORTS:
            z = port_z(x); on = lambda p, q, d: V((x + p, sg * (trunk_y(x + p, z + q) - d), z + q))
            ring = [on(p, q, 0.0) for p, q in circle(0.105, 20)]
            tube(A, ring, (0, -sg, 0), 0.06, C['white'])
            G.poly([on(p, q, 0.03) for p, q in circle(0.105, 20)], C['glass'], (0, sg, 0))
            A.poly([on(p, q, 0.06) for p, q in circle(0.105, 20)], C['cabin'], (0, sg, 0))
            F.atorus(A, (x, sg * (trunk_y(x, z) + 0.004), z), (0, sg, 0), 0.118, 0.013, lambda a: C['steel'], seg=24, rseg=5)
            if fine:
                for k in range(3):                                                             # the dogs
                    a = 2 * math.pi * k / 3 + 0.5; acyl(A, (x + 0.15 * math.cos(a), sg * (trunk_y(x, z) - 0.002), z + 0.15 * math.sin(a)), (x + 0.15 * math.cos(a), sg * (trunk_y(x, z) + 0.022), z + 0.15 * math.sin(a)), 0.012, s, seg=8)
    # the freeing ports: the hole through the bulwark lined, a rubber flap hung outside on its hinge rod
    for sg in (1, -1):
        for x0, l in FREE:
            xc = x0 + l / 2; zd = z_deck(xc); o = rr_pts(xc, zd + 0.10, l, 0.15, 0.03, 3)
            ring = [V((p, sg * (y_at(p, q) + 0.001), q)) for p, q in o]
            tube(A, ring, (0, -sg, 0), max(0.03, y_at(xc, zd + 0.1) - ybw(xc) + 0.002), C['inner'])
            if fine:
                yo = sg * (y_at(xc, zd + 0.19) + 0.012)
                acyl(A, (x0 - 0.02, yo, zd + 0.19), (x0 + l + 0.02, yo, zd + 0.19), 0.008, s, seg=6)
                obox(A, (xc, yo + sg * 0.004 - sg * 0.004, zd + 0.10), (l / 2 + 0.01, 0, 0), (0, 0.004, 0), (0, 0, 0.085), C['rubber'])
    # the companionway: its reveal, the teak door a little in with its louvres and handle, a sill
    y0, y1, z0, z1 = COMP; zd = z_deck(CX0); o = rr_pts((y0 + y1) / 2, zd + (z0 + z1) / 2, y1 - y0, z1 - z0, 0.05, 5)
    tube(A, [(CX0, y, z) for y, z in o], (1, 0, 0), 0.05, C['white'])
    A.poly([(CX0 + 0.05, y, z) for y, z in o], C['wood'], (-1, 0, 0))
    if fine:
        for k in range(5):
            z = zd + z0 + 0.10 + 0.04 * k; abox(A, CX0 + 0.044, CX0 + 0.049, y0 + 0.12, y1 - 0.12, z, z + 0.014, C['dark'])
        acyl(A, (CX0 + 0.05, y0 + 0.07, zd + (z0 + z1) / 2), (CX0 + 0.02, y0 + 0.07, zd + (z0 + z1) / 2), 0.012, s, seg=8)
        for z in (zd + z0 + 0.12, zd + z1 - 0.12): acyl(A, (CX0 + 0.046, y1 - 0.02, z - 0.04), (CX0 + 0.046, y1 - 0.02, z + 0.04), 0.008, s, seg=8)
        abox(A, CX0 - 0.035, CX0 + 0.005, y0 - 0.01, y1 + 0.01, zd + z0 - 0.02, zd + z0, C['wood'])
    # the forward hatch: its reveal down into the cabin, an aluminium frame proud of the trunk's top, the smoked acrylic lid on it
    x0, x1, y0, y1 = HATCH_F; o = rr_pts((x0 + x1) / 2, 0, x1 - x0, y1 - y0, 0.05, 4)
    ring = [(x, y, ttop(x, y)) for x, y in o]
    tube(A, ring, (0, 0, -1), 0.06, C['inner'], C['cabin'])
    fo = rr_pts((x0 + x1) / 2, 0, x1 - x0 + 0.07, y1 - y0 + 0.07, 0.085, 4)
    zf = max(p[2] for p in ring) + 0.035
    F.loft(A, [[(x, y, ttop(x, y) - 0.004) for x, y in fo], [(x, y, zf) for x, y in fo]], lambda i: C['alu'], cap0=False, cap1=False)
    F.loft(A, [[(x, y, zf) for x, y in o], [(x, y, ttop(x, y) - 0.004) for x, y in o]], lambda i: C['alu'], cap0=False, cap1=False, out=lambda mid, cc: V((cc.x - mid.x, cc.y - mid.y, 0)))
    for k in range(len(o)):
        a, b = o[k], o[(k + 1) % len(o)]; c_, d_ = fo[(k + 1) % len(fo)], fo[k]
        A.poly([(a[0], a[1], zf), (b[0], b[1], zf), (c_[0], c_[1], zf), (d_[0], d_[1], zf)], C['alu'], (0, 0, 1))
    G.poly([(x, y, zf + 0.012) for x, y in rr_pts((x0 + x1) / 2, 0, x1 - x0 + 0.05, y1 - y0 + 0.05, 0.075, 4)], C['glass'], (0, 0, 1))
    if fine:
        for yy in (-0.11, 0.11): acyl(A, (x1 + 0.03, yy - 0.03, zf + 0.012), (x1 + 0.03, yy + 0.03, zf + 0.012), 0.009, s, seg=8)
    # the hold: a coaming round the hole up from the deck, dark down into the hold, the lid on the coaming with its lip and dogs
    x0, x1, y0, y1 = HOLD; zd0 = z_deck(5.17); o = rr_pts((x0 + x1) / 2, 0, x1 - x0, y1 - y0, 0.04, 3)
    ring = [(x, y, z_deck(x) + camber(x, y) - 0.03) for x, y in o]
    tube(A, ring, (0, 0, -1), 0.45, C['inner'], C['cabin'])
    F.loft(A, [[(x, y, z_deck(x) + camber(x, y) - 0.03) for x, y in o], [(x, y, zd0 + 0.18) for x, y in o]], lambda i: C['white'], cap0=False, cap1=False,
           out=lambda mid, cc: V((mid.x - cc.x, mid.y - cc.y, 0)))
    oi = rr_pts((x0 + x1) / 2, 0, x1 - x0 - 0.06, y1 - y0 - 0.06, 0.02, 3)
    F.loft(A, [[(x, y, zd0 + 0.18) for x, y in oi], [(x, y, zd0 + 0.02) for x, y in oi]], lambda i: C['white'], cap0=False, cap1=False,
           out=lambda mid, cc: V((cc.x - mid.x, cc.y - mid.y, 0)))
    for k in range(len(o)):
        a, b = o[k], o[(k + 1) % len(o)]; c_, d_ = oi[(k + 1) % len(oi)], oi[k]
        A.poly([(a[0], a[1], zd0 + 0.18), (b[0], b[1], zd0 + 0.18), (c_[0], c_[1], zd0 + 0.18), (d_[0], d_[1], zd0 + 0.18)], C['white'], (0, 0, 1))
    lo = rr_pts((x0 + x1) / 2, 0, x1 - x0 + 0.06, y1 - y0 + 0.06, 0.06, 3)
    F.loft(A, [[(x, y, zd0 + 0.12) for x, y in lo], [(x, y, zd0 + 0.19) for x, y in lo], [(x, y, zd0 + 0.225) for x, y in rr_pts((x0 + x1) / 2, 0, x1 - x0 + 0.02, y1 - y0 + 0.02, 0.05, 3)]],
           lambda i: C['white'], cap0=True, cap1=True)
    if fine:
        for x in (x0 + 0.2, x1 - 0.2):
            for yy in (y0 - 0.035, y1 + 0.035): obox(A, (x, yy, zd0 + 0.13), (0.02, 0, 0), (0, 0.006, 0), (0, 0, 0.04), C['steel'])
        for yy in (-0.3, 0.3): atorus(A, ((x0 + x1) / 2, yy, zd0 + 0.228), (0, 0, 1), 0.035, 0.006, lambda a: C['steel'], 14, 5)
    # the cooling water outlet and the bilge pump's: a stainless collar round each
    for (xb, sb, hb_), r in ((EXH_W, EXH_R), (BILGE, BILGE_R)):
        zb_ = WL + hb_
        ring = [(xb + p, sb * (y_at(xb + p, zb_ + q) + 0.001), zb_ + q) for p, q in circle(r, 12)]
        tube(A, ring, (0, -sb, 0), 0.05, C['dark'], C['black'])
        F.atorus(A, (xb, sb * (y_at(xb, zb_) + 0.006), zb_), (0, sb, 0), r + 0.008, 0.006, lambda a: C['steel'], seg=14, rseg=4)


# ---------- the wheelhouse aft: the walls on the deck with real window openings, the door forward to port, the roof ----------
SINK = 0.30                  # the wheelhouse's sole lies this far under the deck (a step down inside the door), so the house stands low
DOOR_H = 1.55                # the door's opening over the deck (1.85 from the sole inside)
def z_wh(): return z_deck(2.3) - SINK                         # the wheelhouse's sole
def wh_z():
    z0 = z_wh(); return z0, z0 + 0.95, z0 + 1.72, z0 + 1.96     # the sole, the sill, the window head, the roof's underside
LEAN = 0.14                  # the front leans forward from the sill up
DY0, DY1 = 0.30, 1.03        # the front's door section (port); the leaf at 0.34–0.98
SIDE_WIN = [(WX1 - 1.30, WX1 - 0.40), (WX1 - 2.30, WX1 - 1.42)]
WH_PLAN = [(WX0, -WY), (WX1 - 0.25, -WY), (WX1, -1.03), (WX1, -0.37), (WX1, DY0), (WX1, DY1), (WX1 - 0.25, WY), (WX0, WY)]
def wh_inner(): return [(x + (0.06 if x == WX0 else -0.06), y * 0.955) for x, y in WH_PLAN]   # the lining inside the walls
def wheelhouse(A, G, fine=True):
    """the wheelhouse: cream walls with a black band round the whole row of windows (planliste OVB-03, the small boats' way), the panes in
    real openings with a rubber frame and a reveal, the front leaning forward, the door forward to port, a thin roof with its drip edge and a
    visor over the front"""
    w = C['white']; z0, zs_, zh_, zr_ = wh_z(); zd_ = z_deck(2.3); zf = zd_ - 0.02
    def fx(z): return WX1 + LEAN * max(0.0, z - zs_) / (zr_ - zs_)
    oc = WH_PLAN
    KIND = ['side', 'glass', 'glass', 'glass', 'door', 'door', 'side', 'aft']
    def pt(p, z, k='glass'): return (p[0] + (LEAN * max(0.0, z - zs_) / (zr_ - zs_) if k == 'glass' and p[0] > WX1 - 0.26 else 0.0), p[1], z)
    for i in range(len(oc)):
        a, b = oc[i], oc[(i + 1) % len(oc)]; k = KIND[i]; nrm = (b[1] - a[1], -(b[0] - a[0]), 0)
        if k == 'door':
            if i == 4:                                                   # the door section: solid round the door's opening, the frame and leaf below
                A.poly([(WX1, DY0, zf), (WX1, 0.34, zf), (WX1, 0.34, zr_), (WX1, DY0, zr_)], w, nrm)
                A.poly([(WX1, 0.34, zd_ + DOOR_H), (WX1, 0.98, zd_ + DOOR_H), (WX1, 0.98, zr_), (WX1, 0.34, zr_)], w, nrm)
                A.poly([(WX1, 0.98, zf), (WX1, DY1, zf), (WX1, DY1, zr_), (WX1, 0.98, zr_)], w, nrm)
            continue
        if k == 'aft':
            A.poly([(WX0, -WY, zf), (WX0, WY, zf), (WX0, WY, zs_), (WX0, -WY, zs_)], w, nrm); A.poly([(WX0, -WY, zh_), (WX0, WY, zh_), (WX0, WY, zr_), (WX0, -WY, zr_)], w, nrm)
            A.poly([(WX0, -WY, zs_), (WX0, -0.5, zs_), (WX0, -0.5, zh_), (WX0, -WY, zh_)], C['frame'], nrm); A.poly([(WX0, 0.5, zs_), (WX0, WY, zs_), (WX0, WY, zh_), (WX0, 0.5, zh_)], C['frame'], nrm)
            G.poly([(WX0 + 0.02, -0.5, zs_), (WX0 + 0.02, 0.5, zs_), (WX0 + 0.02, 0.5, zh_), (WX0 + 0.02, -0.5, zh_)], C['glass'], (-1, 0, 0))
            for yy in (-0.5, 0.5): abox(A, WX0 - 0.012, WX0 + 0.04, yy - 0.025, yy + 0.025, zs_, zh_, C['frame'])
            for zz in (zs_, zh_): abox(A, WX0 - 0.012, WX0 + 0.04, -0.525, 0.525, zz - 0.02, zz + 0.02, C['frame'])
            continue
        A.poly([pt(a, zf, k), pt(b, zf, k), pt(b, zs_, k), pt(a, zs_, k)], w, nrm); A.poly([pt(a, zh_, k), pt(b, zh_, k), pt(b, zr_, k), pt(a, zr_, k)], w, nrm)
        if k == 'side':
            sg = 1 if i == 6 else -1; y = sg * WY
            for xa, xb in ((WX0, WX1 - 2.3), (WX1 - 1.42, WX1 - 1.3), (WX1 - 0.4, WX1 - 0.25)): A.poly([(xa, y, zs_), (xb, y, zs_), (xb, y, zh_), (xa, y, zh_)], C['frame'], (0, sg, 0))   # the black window band
            for xb_, xa_ in SIDE_WIN:
                G.poly([(xb_, y - sg * 0.02, zs_), (xa_, y - sg * 0.02, zs_), (xa_, y - sg * 0.02, zh_), (xb_, y - sg * 0.02, zh_)], C['glass'], (0, sg, 0))
                # the black rubber frame round the pane, proud of the wall; the reveal to the glass
                if not fine: continue
                for xe in (xb_, xa_): abox(A, xe - 0.025, xe + 0.025, min(y, y + sg * 0.012), max(y, y + sg * 0.012), zs_ - 0.025, zh_ + 0.025, C['frame'])
                for zz in (zs_, zh_): abox(A, xb_ - 0.025, xa_ + 0.025, min(y, y + sg * 0.012), max(y, y + sg * 0.012), zz - 0.025, zz + 0.025, C['frame'])
                for xe, nx in ((xb_, 1), (xa_, -1)): A.poly([(xe, y, zs_), (xe, y - sg * 0.05, zs_), (xe, y - sg * 0.05, zh_), (xe, y, zh_)], C['inner'], (nx, 0, 0))
                A.poly([(xb_, y, zs_), (xa_, y, zs_), (xa_, y - sg * 0.05, zs_), (xb_, y - sg * 0.05, zs_)], C['inner'], (0, 0, 1))
                A.poly([(xb_, y, zh_), (xa_, y, zh_), (xa_, y - sg * 0.05, zh_), (xb_, y - sg * 0.05, zh_)], C['inner'], (0, 0, -1))
            continue
        G.poly([pt(a, zs_ + 0.03), pt(b, zs_ + 0.03), pt(b, zh_ - 0.03), pt(a, zh_ - 0.03)], C['glass'], nrm)
        beam(A, pt(a, zs_), pt(a, zh_), 0.06, 0.06, C['frame']); beam(A, pt(b, zs_), pt(b, zh_), 0.06, 0.06, C['frame'])
        beam(A, pt(a, zs_ + 0.03), pt(b, zs_ + 0.03), 0.06, 0.05, C['frame']); beam(A, pt(a, zh_ - 0.03), pt(b, zh_ - 0.03), 0.06, 0.05, C['frame'])
    abox(A, WX1 - 0.02, WX1 + LEAN + 0.02, DY0 - 0.03, DY0 + 0.03, zs_, zr_, w)          # the post between the leaning panes and the door section
    io = wh_inner()
    lining(A, oc, io, z0 + 0.005, zs_, zh_, zr_ - 0.005, lambda p, z, i: pt(p, z, KIND[i]), C['inner'], lambda i: KIND[i] not in ('door',))
    A.poly([(x, y, z0 + 0.005) for x, y in io], C['nonslip'], (0, 0, 1))                     # the sole, sunk under the deck (the deck is cut away here)
    # the lining's band from the deck's cut down to the sole is the lining itself; the door's step down inside, a teak tread on a box
    abox(A, WX1 - 0.40, WX1 - 0.065, 0.36, 0.96, z0 + 0.005, z0 + SINK / 2, C['inner'], skip=('-z',)); abox(A, WX1 - 0.42, WX1 - 0.065, 0.35, 0.97, z0 + SINK / 2, z0 + SINK / 2 + 0.03, C['wood'])
    # the door: its frame in the opening, the steel sill, the leaf open a hand's breadth inward? (shut, a little in), its window and handle
    zt = zd_ + DOOR_H
    for y_ in (0.34, 0.98): abox(A, WX1 - 0.06, WX1 + 0.025, y_ - 0.025 if y_ < 0.5 else y_, y_ if y_ < 0.5 else y_ + 0.025, zd_, zt, C['white'])
    abox(A, WX1 - 0.06, WX1 + 0.025, 0.315, 1.005, zt, zt + 0.04, C['white']); abox(A, WX1 - 0.06, WX1 + 0.03, 0.34, 0.98, zd_, zd_ + 0.10, C['steel'])
    abox(A, WX1 - 0.045, WX1 - 0.01, 0.345, 0.975, zd_ + 0.10, zt - 0.005, C['white'])
    G.poly([(WX1 - 0.008, 0.45, zd_ + 0.72), (WX1 - 0.008, 0.87, zd_ + 0.72), (WX1 - 0.008, 0.87, zd_ + 1.32), (WX1 - 0.008, 0.45, zd_ + 1.32)], C['glass'], (1, 0, 0))
    for zz in (zd_ + 0.70, zd_ + 1.34): abox(A, WX1 - 0.012, WX1 + 0.004, 0.43, 0.89, zz - 0.02, zz + 0.02, C['frame'])
    for yy in (0.45, 0.87): abox(A, WX1 - 0.012, WX1 + 0.004, yy - 0.02, yy + 0.02, zd_ + 0.70, zd_ + 1.34, C['frame'])
    abox(A, WX1 - 0.045, WX1 - 0.012, 0.45, 0.87, zd_ + 0.74, zd_ + 1.30, C['cabin'])    # (the leaf's back, so the glass shows the dark inside)
    if fine:
        acyl(A, (WX1 - 0.01, 0.90, zd_ + 0.70), (WX1 + 0.04, 0.90, zd_ + 0.70), 0.012, lambda q: C['steel'], seg=8)
        abox(A, WX1 + 0.03, WX1 + 0.045, 0.83, 0.92, zd_ + 0.69, zd_ + 0.71, C['steel'])
        for zz in (zd_ + 0.30, zd_ + 1.25): acyl(A, (WX1 + 0.01, 0.355, zz - 0.05), (WX1 + 0.01, 0.355, zz + 0.05), 0.012, lambda q: C['steel'], seg=8)
    # the roof: its underside, a thin lip with a drip edge all round, the visor over the front, the crown cambered 6 cm
    ro = [(WX0 - 0.10, -WY - 0.08), (WX1 - 0.2, -WY - 0.08), (WX1 + LEAN + 0.04, -1.08), (WX1 + LEAN + 0.04, 1.08), (WX1 - 0.2, WY + 0.08), (WX0 - 0.10, WY + 0.08)]
    # (the visor stands only 4 cm past the front: the game's deck map takes a roof within 0.6 m and 1.6 m of a part it can step onto,
    # the hold's lid, for deck; vessel3d.js deckMap)
    A.poly([(x, y, zr_) for x, y in ro], C['inner'], (0, 0, -1))
    crown = lambda x, y: zr_ + 0.07 + 0.05 * (1 - min(1.0, (y / (WY + 0.08)) ** 2))
    ri = [(x + (0.16 if x < WX0 else -0.16 if x > WX1 else 0.0), y * 0.88) for x, y in ro]
    for i in range(len(ro)):
        a, b = ro[i], ro[(i + 1) % len(ro)]; c, d = ri[(i + 1) % len(ri)], ri[i]; nrm = (b[1] - a[1], -(b[0] - a[0]), 0)
        A.poly([(a[0], a[1], zr_), (b[0], b[1], zr_), (b[0], b[1], zr_ + 0.07), (a[0], a[1], zr_ + 0.07)], C['stripe'], nrm)   # the roof's lip navy, as the stripe
        A.poly([(a[0], a[1], zr_ + 0.07), (b[0], b[1], zr_ + 0.07), (c[0], c[1], crown(*c)), (d[0], d[1], crown(*d))], C['roof'], (0, 0, 1))
    A.poly([(x, y, crown(x, y)) for x, y in ri], C['roof'], (0, 0, 1))
    for i in range(len(ro)):                                                                 # the drip edge under the lip
        a, b = ro[i], ro[(i + 1) % len(ro)]; e = 0.02 / max(1e-6, math.hypot(b[0] - a[0], b[1] - a[1]))
        A.poly([(a[0], a[1], zr_ - 0.001), (b[0], b[1], zr_ - 0.001), (b[0], b[1], zr_ - 0.025), (a[0], a[1], zr_ - 0.025)], C['frame'], (b[1] - a[1], -(b[0] - a[0]), 0))
    if fine:
        # the roof rail aft round the mast on stanchions on bases; a grab rail along the roof's edge each side
        for x, y in ((WX0 - 0.02, -WY + 0.02), (WX0 - 0.02, WY - 0.02), (WX0 + 1.1, -WY + 0.02), (WX0 + 1.1, WY - 0.02)):
            zc = crown(x, y); acyl(A, (x, y, zc - 0.004), (x, y, zc + 0.012), 0.025, lambda q: C['steel'], seg=10); acyl(A, (x, y, zc), (x, y, zc + 0.45), 0.014, lambda q: C['steel'], seg=8)
        for y in (-WY + 0.02, WY - 0.02): acyl(A, (WX0 - 0.02, y, crown(WX0, y) + 0.45), (WX0 + 1.1, y, crown(WX0 + 1.1, y) + 0.45), 0.016, lambda q: C['steel'], seg=8, cap=False)
        acyl(A, (WX0 - 0.02, -WY + 0.02, crown(WX0, WY) + 0.45), (WX0 - 0.02, WY - 0.02, crown(WX0, WY) + 0.45), 0.016, lambda q: C['steel'], seg=8, cap=False)
        for sg in (1, -1):
            for x in (WX0 + 1.5, WX1 - 0.5): acyl(A, (x, sg * (WY - 0.06), crown(x, WY - 0.06) - 0.004), (x, sg * (WY - 0.06), crown(x, WY - 0.06) + 0.07), 0.01, lambda q: C['steel'], seg=6)
            acyl(A, (WX0 + 1.5, sg * (WY - 0.06), crown(WX0 + 1.5, WY) + 0.07), (WX1 - 0.5, sg * (WY - 0.06), crown(WX1 - 0.5, WY) + 0.07), 0.012, lambda q: C['steel'], seg=6)
        # the wipers on the two front panes to starboard and midships (pendulum: the motor over the pane, the arm and the blade on it)
        for ya, yb in ((-1.03, -0.37), (-0.37, DY0)):
            yc = (ya + yb) / 2; hp_ = V((fx(zh_) + 0.035, yc, zh_ + 0.03))
            acyl(A, hp_ - V((0.04, 0, 0)), hp_ + V((0.01, 0, 0)), 0.02, lambda q: C['frame'], seg=8)
            zb2 = zh_ - 0.55; bp = V((fx(zb2) + 0.03, yc + 0.08, zb2))
            acyl(A, hp_ + V((0.01, 0, 0)), bp, 0.006, lambda q: C['frame'], seg=5)
            acyl(A, (fx(zb2 + 0.2) + 0.026, yc + 0.08, zb2 + 0.2), (fx(zb2 - 0.2) + 0.026, yc + 0.08, zb2 - 0.2), 0.007, lambda q: C['rubber'], seg=5)
    return crown


# the helm on the starboard side under the front windows: the console with the dash sloping up forward, the wheel, the lever, the
# plotter, the sounder and the engine's panel facing the skipper (up and aft), the compass on top, the VHF overhead, the seat; the
# bench to port (plastsjark-grunnlag kap. 6.2)
HX0, HY0, HY1 = 3.28, -1.18, -0.06                          # the console's after face and its sides
def dash():
    z0, zs_, _, _ = wh_z(); return (3.30, z0 + 0.86), (3.62, z0 + 1.02)    # the dash's after foot and its fore top (x, z)
WHEEL = (3.22, -0.62); WHEEL_AX = (-1.0, 0.0, 0.55)          # the wheel's centre (x, y; z from the sole) and its axis toward the skipper
SKIP = (2.80, -0.62); SEAT = (2.38, -0.62)
def dash_pt(t, y):
    (x0, z0), (x1, z1) = dash(); return V((x0 + (x1 - x0) * t, y, z0 + (z1 - z0) * t))
def dash_n():
    (x0, z0), (x1, z1) = dash(); return V((-(z1 - z0), 0, x1 - x0)).normalized()
SCR = {'plot': (-1.08, -0.80, 0.16, 0.84), 'sound': (-0.42, -0.18, 0.18, 0.80), 'eng': (-0.76, -0.48, 0.55, 0.88)}
def helm(A, G, fine=True):
    w = C['inner']; z0, zs_, zh_, zr_ = wh_z(); (x0, dz0), (x1, dz1) = dash()
    A.poly([(HX0, HY0, z0), (HX0, HY1, z0), (HX0, HY1, dz0), (HX0, HY0, dz0)], w, (-1, 0, 0))
    A.poly([(HX0, HY0, dz0), (HX0, HY1, dz0), (x0, HY1, dz0), (x0, HY0, dz0)], w, (0, 0, 1))
    A.poly([(x0, HY0, dz0), (x0, HY1, dz0), (x1, HY1, dz1), (x1, HY0, dz1)], C['board'], dash_n())     # the dash light, the screens dark in their bezels (snekka's lesson)
    xw = WX1 - 0.07
    for y, sg in ((HY0, -1), (HY1, 1)):
        A.poly([(HX0, y, z0), (xw, y, z0), (xw, y, dz1), (x1, y, dz1), (x0, y, dz0), (HX0, y, dz0)], w, (0, sg, 0))
    A.poly([(x1, HY0, dz1), (x1, HY1, dz1), (xw, HY1, dz1), (xw, HY0, dz1)], w, (0, 0, 1))
    if not fine: return
    n = dash_n()
    for nm, (ya, yb_, ta, tb) in SCR.items():
        q = [dash_pt(ta, ya), dash_pt(ta, yb_), dash_pt(tb, yb_), dash_pt(tb, ya)]; c = sum(q, V()) / 4
        F.loft(A, [[p + n * 0.002 for p in q], [p + n * 0.014 for p in q]], lambda i: C['bezel'], cap0=False, cap1=False)
        A.poly([p + n * 0.014 for p in q], C['bezel'], n)
        A.poly([c + (p - c) * 0.86 + n * 0.0145 for p in q], C['screen'], n)
    for yg in (-0.70, -0.55):
        F.atorus(A, dash_pt(0.30, yg) + n * 0.004, n, 0.035, 0.004, lambda a: C['chrome'], seg=16, rseg=4)
        A.poly([dash_pt(0.30, yg) + n * 0.003 + V(p) for p in [(0.02, -0.03, -0.03), (0.02, 0.03, -0.03), (-0.02, 0.03, 0.03), (-0.02, -0.03, 0.03)]], C['screen'], n)
    cb = dash_pt(0.93, -0.30) + V((0.0, 0, -0.005))
    acyl(A, cb, cb + V((0, 0, 0.05)), 0.07, lambda q: C['dark'], seg=16)
    HELM_EXTRA.append(sphere('compass', cb + V((0, 0, 0.085)), 0.06, C['glass'], (1, 1, 0.7)))
    cp = dash_pt(0.12, -0.98) + n * 0.003
    obox(A, cp, V((0, 0.07, 0)), (dash_pt(1, 0) - dash_pt(0, 0)).normalized() * 0.03, n * 0.004, C['switch'])
    for k in range(4): obox(A, cp + n * 0.005 + V((0, -0.05 + 0.033 * k, 0)), V((0, 0.009, 0)), V((0.004, 0, 0.008)), n * 0.004, C['lampG'] if k < 3 else C['lampR'])
    wc = V((WHEEL[0], WHEEL[1], z0 + 0.98))
    F.helm_wheel(A, wc, WHEEL_AX, 0.21, C['cush'], C['steel'], C['dark'])
    acyl(A, wc - V(WHEEL_AX).normalized() * 0.14, (HX0 + 0.004, WHEEL[1], z0 + 1.0), 0.03, lambda q: C['dark'], seg=10)
    F.single_lever(A, (HX0 + 0.12, HY1, z0 + 0.74), (0, 1, 0), (1, 0, 0), C['dark'], C['steel'], C['black'])
    # the VHF under the roof over the skipper, its face aft and down; its microphone on a clip
    vc = V((3.05, -0.85, zr_ - 0.06))
    obox(A, vc, V((0.09, 0, 0)), V((0, 0.10, 0)), V((0, 0, 0.05)), C['dark'])
    A.poly([vc + V((-0.091, -0.08, -0.03)), vc + V((-0.091, 0.08, -0.03)), vc + V((-0.091, 0.08, 0.03)), vc + V((-0.091, -0.08, 0.03))], C['screen'], (-1, 0, 0))
    obox(A, vc + V((-0.05, 0.13, -0.02)), V((0.02, 0, 0)), V((0, 0.015, 0)), V((0, 0, 0.04)), C['black'])
    F.helm_seat(A, (SEAT[0], SEAT[1], z0), (1, 0, 0), 0.76, C['steel'], C['cush'])
    # the bench to port along the side, the chart shelf over it, a small stove's top at its forward end (the galley: a plate, VESSELS.fac)
    abox(A, WX0 + 0.10, 2.70, 0.72, WY - 0.06, z0, z0 + 0.42, C['inner']); abox(A, WX0 + 0.12, 2.68, 0.74, WY - 0.08, z0 + 0.42, z0 + 0.50, C['cush'])
    abox(A, WX0 + 0.12, 2.68, WY - 0.16, WY - 0.08, z0 + 0.50, z0 + 0.92, C['cush'])
    abox(A, 2.75, 3.25, 0.70, WY - 0.06, z0, z0 + 0.86, C['inner']); abox(A, 2.80, 3.20, 0.78, 1.15, z0 + 0.86, z0 + 0.88, C['dark'])
    for xx in (2.9, 3.1): F.atorus(A, (xx, 0.96, z0 + 0.885), (0, 0, 1), 0.07, 0.006, lambda a: C['steel'], seg=16, rseg=4)
HELM_EXTRA = []


# ---------- the mast on the roof aft, the radar's platform (the game's radome), the antennas, the lanterns, the work lights ----------
MX = WX0 + 0.55              # the mast
RX = MX + 0.42               # the radome's centre on the platform, clear of the mast
def white_z():
    _, _, _, zr_ = wh_z(); return zr_ + 2.68
def lamp_z():
    z0, _, zh_, zr_ = wh_z(); return (zh_ + zr_) / 2 + 0.005
LAMP_X = WX1 - 0.33          # the side lights on the wheelhouse's sides over the forward post, under the roof's lip
def mast(A, crown, fine=True):
    w = C['white']; s = lambda q: C['steel']; _, _, _, zr_ = wh_z(); zb = crown(MX, 0)
    abox(A, MX - 0.08, MX + 0.08, -0.07, 0.07, zb - 0.004, zb + 0.12, C['alu'])                   # the tabernacle
    if fine: acyl(A, (MX - 0.05, -0.085, zb + 0.08), (MX - 0.05, 0.085, zb + 0.08), 0.012, s, seg=8)
    acyl(A, (MX, 0, zb + 0.02), (MX, 0, white_z() - 0.07), 0.045, lambda q: w, seg=12, r1=0.034)
    abox(A, MX - 0.025, MX + 0.025, -0.42, 0.42, zr_ + 1.75, zr_ + 1.79, w)                     # the cross-tree
    # the platform for the radome, on the mast's forward side with two struts down to the mast
    abox(A, MX + 0.03, RX + 0.30, -0.30, 0.30, zr_ + 0.95, zr_ + 0.99, w); acyl(A, (MX, 0, zr_ + 0.90), (MX, 0, zr_ + 1.0), 0.07, lambda q: w, seg=12)
    for y in (-0.24, 0.24): acyl(A, (MX + 0.04, y * 0.25, zr_ + 0.55), (RX + 0.24, y, zr_ + 0.95), 0.015, s, seg=6)
    F.allround_lantern(A, (MX, 0, white_z()), C['lampW'], C['frame'], R=0.04, H=0.08)
    # the dry exhaust beside the mast to port (a stack up through the roof with a rain cap), braced to the mast
    ex0 = (MX - 0.32, 0.55)
    acyl(A, (ex0[0], ex0[1], crown(*ex0) - 0.01), (ex0[0], ex0[1], crown(*ex0) + 0.08), 0.11, lambda q: C['steel'], seg=14)
    acyl(A, (ex0[0], ex0[1], crown(*ex0) + 0.08), (ex0[0], ex0[1], zr_ + 1.30), 0.065, lambda q: C['steel'], seg=12)
    acyl(A, (ex0[0], ex0[1], zr_ + 1.30), (ex0[0], ex0[1], zr_ + 1.48), 0.065, lambda q: C['black'], seg=12)
    acyl(A, (ex0[0], ex0[1], zr_ + 1.48), (ex0[0] - 0.05, ex0[1], zr_ + 1.56), 0.075, lambda q: C['black'], seg=12)
    if fine:
        acyl(A, (ex0[0], ex0[1] - 0.06, zr_ + 1.2), (MX, 0.04, zr_ + 1.2), 0.012, s, seg=6)
        # the VHF whip on the cross-tree's port end, the GPS on its starboard end, the horn on the mast, the searchlight on the roof forward
        F.whip(A, (MX, 0.40, zr_ + 1.79), 1.6, w, r0=0.012, r1=0.005, m_foot=C['steel'])
        F.gps(A, (MX, -0.40, zr_ + 1.79), w, r=0.06, h=0.08, m_post=C['steel'])
        acyl(A, (MX + 0.04, 0, zr_ + 1.45), (MX + 0.20, 0, zr_ + 1.48), 0.025, lambda q: C['steel'], seg=10, r1=0.05)
        F.searchlight(A, (WX1 - 0.20, 0.0, crown(WX1 - 0.2, 0) + 0.24), (1, 0, -0.08), 0.08, C['dark'], C['lens'], C['steel'])
        acyl(A, (WX1 - 0.20, 0.0, crown(WX1 - 0.2, 0) - 0.004), (WX1 - 0.20, 0.0, crown(WX1 - 0.2, 0) + 0.14), 0.03, s, seg=8)
        # the work lights under the roof's lip aft and forward, over the decks
        for xx, ax in ((WX0 - 0.06, -1), (WX1 + LEAN + 0.0, 1)):
            for yy in (-0.6, 0.6):
                c = V((xx, yy, zr_ - 0.06)); obox(A, c, V((0.03, 0, 0)), V((0, 0.07, 0)), V((0, 0, 0.035)), C['dark'])
                A.poly([c + V((ax * 0.031, -0.055, -0.025)), c + V((ax * 0.031, 0.055, -0.025)), c + V((ax * 0.031, 0.055, 0.025)), c + V((ax * 0.031, -0.055, 0.025))], C['lens'], (ax, 0, -0.3))

def lanterns(A, fine=True):
    """the side lights on a plate on each side of the wheelhouse over the forward post, under the roof's lip (fittings.side_lantern draws
    its screen inboard, so neither shows across the bow)"""
    z = lamp_z()
    for sg, m in ((1, C['lampR']), (-1, C['lampG'])):
        obox(A, (LAMP_X, sg * (WY + 0.004), z), V((0.08, 0, 0)), V((0, 0.004, 0)), V((0, 0, 0.055)), C['frame'])
        F.side_lantern(A, (LAMP_X + 0.012, sg * (WY + 0.038), z), (1, 0, 0), (0, sg, 0), m, C['frame'], C['black'], R=0.03, H=0.05)


# ---------- on deck: the cleats, the pulpit, the windlass and the bow roller, the grab rails, the flag staff and the stern light, the
# filler, the boat's own gutting table, the fenders and the hose ----------
POLE = (0.20, -0.62)
def gunwale_y(x): return ycap(x) + CAP * 0.5
def deck_fittings(A, fine=True):
    s = lambda q: C['steel']
    def base(p, r=0.028): acyl(A, (p[0], p[1], p[2] - 0.003), (p[0], p[1], p[2] + 0.008), r, s, seg=10)
    # the pulpit round the bow, its stanchions on the cap
    if fine:
        xs = [8.55 + (XF - 0.12 - 8.55) * k / 8 for k in range(9)]
        for sg in (1, -1):
            P = [(x, sg * max(0.03, gunwale_y(x)), zs(x) + 0.012) for x in xs]
            for p in P[::2]: base(p); acyl(A, p, (p[0], p[1], p[2] + 0.55), 0.016, s, seg=8)
            F.pipe(A, [(p[0], p[1], p[2] + 0.55) for p in P] + [(XF - 0.05, 0.0, zs(XF - 0.05) + 0.58)], 0.018, C['steel'], 8)
            F.pipe(A, [(p[0], p[1], p[2] + 0.28) for p in P[:-1]], 0.012, C['steel'], 6)
    # the cleats on the caps at the quarters, amidships and forward
    for x in ((0.45, 3.95, 6.20, 8.30) if fine else ()):
        for sg in (1, -1): F.cleat(A, (x, sg * gunwale_y(x), zs(x) + 0.012), (0, 0, 1), (1, 0, 0), 0.22, C['steel'])
    # the windlass on the foredeck: its base, the motor's housing, the gypsy and the warping drum, the chain pipe forward of it
    wx = 8.72; zd = z_deck(wx) + camber(wx, 0)
    abox(A, wx - 0.18, wx + 0.18, -0.16, 0.16, zd - 0.004, zd + 0.06, C['steel'])
    acyl(A, (wx, -0.14, zd + 0.20), (wx, 0.14, zd + 0.20), 0.13, lambda q: C['alu'], seg=18)
    acyl(A, (wx, 0.14, zd + 0.20), (wx, 0.22, zd + 0.20), 0.09, lambda q: C['steel'], seg=16, r1=0.075)
    F.atorus(A, (wx, -0.19, zd + 0.20), (0, 1, 0), 0.085, 0.022, lambda a: C['steel'], seg=16, rseg=6)
    acyl(A, (wx, -0.22, zd + 0.20), (wx, -0.16, zd + 0.20), 0.06, lambda q: C['steel'], seg=12)
    obox(A, (wx, 0, zd + 0.10), V((0.14, 0, 0)), V((0, 0.13, 0)), V((0, 0, 0.05)), C['alu'])
    acyl(A, (wx + 0.25, -0.12, z_deck(wx + 0.25) + camber(wx + 0.25, 0.12) - 0.004), (wx + 0.25, -0.12, z_deck(wx + 0.25) + 0.05), 0.055, s, seg=12)   # the chain pipe
    # the bow roller over the stem (the anchor itself is the game's: bower)
    zr_ = zs(XF - 0.05) + 0.045
    F.bow_roller(A, (8.95, 0, zs(8.95) + 0.012), (XF + 0.06, 0, zr_), C['steel'], C['rubber'], R=0.04, W=0.12, deck=lambda x: zs(x) + 0.012, x_end=XF - 0.02)
    if not fine: return
    # the grab rails on the trunk's top, teak on feet
    for sg in (1, -1):
        y = sg * 0.60; feet = [6.55 + 0.33 * k for k in range(4)]
        for x in feet: abox(A, x - 0.03, x + 0.03, y - 0.014, y + 0.014, ttop(x, 0.6) - 0.004, ttop(x, 0.6) + 0.055, C['wood'])
        for a, b in zip(feet, feet[1:]): beam(A, (a, y, ttop(a, 0.6) + 0.07), (b, y, ttop(b, 0.6) + 0.07), 0.028, 0.03, C['wood'])
    # a mushroom vent on the trunk
    acyl(A, (6.75, -0.55, ttop(6.75, 0.55) - 0.004), (6.75, -0.55, ttop(6.75, 0.55) + 0.14), 0.04, lambda q: C['steel'], seg=10)
    acyl(A, (6.75, -0.55, ttop(6.75, 0.55) + 0.14), (6.75, -0.55, ttop(6.75, 0.55) + 0.20), 0.085, lambda q: C['steel'], seg=14, r1=0.05)
    # the flag staff in its socket on the aft deck's cap to starboard, with the stern light on its head
    px, py = POLE; zp = zs(px) + 0.012; yb = -gunwale_y(px)
    acyl(A, (px, yb, zp - 0.004), (px, yb, zp + 0.12), 0.024, s, seg=10)
    acyl(A, (px, yb, zp + 0.02), (px - 0.08, yb, zp + 1.15), 0.014, lambda q: C['wood'], seg=8)
    F.stern_lantern(A, (px - 0.085, yb, zp + 1.20), (-1, 0, 0), C['lampW'], C['frame'])
    # the diesel filler on the port side deck by the wheelhouse, its vent a hood on the side
    fx = 3.95; fy = ybw(fx) - 0.12; fz = z_deck(fx) + camber(fx, fy)
    acyl(A, (fx, fy, fz - 0.002), (fx, fy, fz + 0.012), 0.045, s, seg=16); acyl(A, (fx, fy, fz + 0.012), (fx, fy, fz + 0.018), 0.032, s, seg=16)
    vx, vz = fx + 0.35, zs(fx + 0.35) - 0.10; vy = y_at(vx, vz)
    acyl(A, (vx, vy - 0.002, vz), (vx, vy + 0.014, vz), 0.016, s, seg=10); obox(A, (vx, vy + 0.020, vz + 0.004), V((0.022, 0, 0)), V((0, 0.006, 0)), V((0, 0, 0.022)), C['steel'])
    # the fenders stowed on the aft deck along the bulwark's foot beside the wheelhouse, a hose coiled on the working deck
    for x in (1.6, 3.0):
        for sg in (1, -1):
            zd = z_deck(x) + 0.1; y = sg * (ybw(x) - 0.13); acyl(A, (x - 0.25, y, zd), (x + 0.25, y, zd), 0.1, lambda q: C['rubber'], seg=12)
    hx_, hy_ = 4.05, 1.12; hz = z_deck(hx_) + camber(hx_, hy_)
    for k in range(3): F.atorus(A, (hx_, hy_, hz + 0.022 + 0.04 * k), (0, 0, 1), 0.20 - 0.015 * k, 0.02, lambda a: C['hose'], seg=18, rseg=6)

GUT = (4.95, 5.75)           # the boat's own gutting table over the port bulwark (x from, to)
def gut_top(): return z_deck(5.35) + 0.90
def gutting_table(A):
    """a stainless table across the port bulwark at working height, its outer edge a little over the side so the offal goes into the sea,
    a lip along its inboard edge and its ends; two brackets from the cap up under it, two legs down to the deck"""
    x0, x1 = GUT; zt = gut_top(); yo = max(ysh(x0), ysh(x1)) + 0.03; yi_ = 1.02
    abox(A, x0, x1, yi_, yo, zt - 0.03, zt, C['steel'])
    abox(A, x0, x1, yi_, yi_ + 0.02, zt, zt + 0.05, C['steel'])
    for x in (x0, x1 - 0.02): abox(A, x, x + 0.02, yi_, yo - 0.08, zt, zt + 0.05, C['steel'])
    for x in (x0 + 0.08, x1 - 0.08):
        g = gunwale_y(x); acyl(A, (x, g, zs(x) + 0.010), (x, g, zt - 0.03), 0.016, lambda q: C['steel'], seg=8)
        acyl(A, (x, g, zs(x) + 0.008), (x, g, zs(x) + 0.016), 0.03, lambda q: C['steel'], seg=10)
        zd = z_deck(x) + camber(x, yi_ + 0.06); acyl(A, (x, yi_ + 0.06, zd - 0.004), (x, yi_ + 0.06, zt - 0.03), 0.016, lambda q: C['steel'], seg=8)
        acyl(A, (x, yi_ + 0.06, zd - 0.004), (x, yi_ + 0.06, zd + 0.006), 0.035, lambda q: C['steel'], seg=10)


# ---------- under water: the shoe, the rudder on its stock, the propeller on its shaft, the anodes, the transducer, the intake ----------
RX_ = 0.46                   # the rudder's stock (its leading edge)
PROP = (0.88, 0.0, 0.60); PR = 0.27                          # the propeller's centre and radius (100 hp at about 2.5:1, a 22 in wheel)
def underwater(fine=True):
    U = Acc('under')
    abox(U, RX_ - 0.09, X_KA + 0.18, -0.04, 0.04, -0.008, 0.045, C['prop'])                       # the shoe, bronze, keel to the rudder's heel
    acyl(U, (RX_, 0, 0.043), (RX_, 0, 0.08), 0.02, lambda q: C['prop'], seg=10)
    F.foil_rudder(U, (RX_, 0.0), 0.08, 1.2, 0.46, C['af'], thick=0.13, top=lambda x: zr(max(x, 0.0)) - 0.035, n=12 if fine else 5, rows=6 if fine else 2)
    acyl(U, (RX_ - 0.035, 0, 0.075), (RX_ - 0.035, 0, zr(RX_) + 0.06), 0.028, lambda q: C['steel'], seg=10)
    acyl(U, (RX_ - 0.035, 0, zr(RX_) - 0.04), (RX_ - 0.035, 0, zr(RX_) + 0.01), 0.055, lambda q: C['prop'], seg=12)
    px, py, pz = PROP
    acyl(U, (px + 0.07, 0, pz), (X_KA + 0.06, 0, pz), 0.02, lambda q: C['steel'], seg=10)
    acyl(U, (X_KA - 0.035, 0, pz), (X_KA + 0.05, 0, pz), 0.05, lambda q: C['prop'], seg=14, r1=0.058)
    acyl(U, (px + 0.13, 0, pz), (px + 0.19, 0, pz), 0.045, lambda q: C['anode'], seg=14)
    F.propeller(U, PROP, (1, 0, 0), PR, C['prop'], n=3, hub=0.20, pitch=0.80, skew=0.30, cpp=False, fine=fine)
    if fine:
        for sg in (1, -1):
            F.anode(U, (1.80, sg * (wk(1.80) + 0.004), 0.35), (0, sg, 0), (1, 0, 0), C['anode'], L=0.26, w=0.08, t=0.03, m_strap=C['steel'])
            F.anode(U, (x_of(0.0, WL - 0.04) + 0.003, sg * 0.30, WL - 0.04), (-1, 0, 0.09), (0, 1, 0), C['anode'], L=0.18, w=0.06, t=0.025, m_strap=C['steel'])
        def onb(xt, yt):
            for z in [zr(xt) + 0.25 * k / 60 for k in range(80)]:
                if y_at(xt, z) >= abs(yt): return z
            return zr(xt)
        zt = onb(3.6, -0.35); acyl(U, (3.6, -0.35, zt + 0.02), (3.6, -0.35, zt - 0.03), 0.05, lambda q: C['dark'], seg=16, r1=0.045)
        xi, yi_ = 3.0, 0.30; zi = onb(xi, yi_)
        for k in range(5): abox(U, xi - 0.07, xi + 0.07, yi_ - 0.05 + 0.025 * k - 0.006, yi_ - 0.05 + 0.025 * k + 0.006, zi - 0.012, zi + 0.02, C['dark'])
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
    crown = wheelhouse(A, G, fine); helm(A, G, fine); mast(A, crown, fine); lanterns(A, fine); deck_fittings(A, fine)
    if fine: gutting_table(A)
    out = [hull, A.done(35, tint=wear), underwater(fine)] + HELM_EXTRA
    g = G.done(35)
    return [o for o in out if o], [g] if g else [box('noglass', 0, 0.01, 0, 0.01, -50, -49.99, C['glass'])]


def to_game(p): return (-p[1], p[2] - WL, -(p[0] - XM))
def to_game_n(n): return (-n[1], n[2], -n[0])

def name_strips(G):
    """where the name is written (vessel3d.js nameStrips): a strip on each bow under the registration mark, and one across the transom
    between the boot top and the cap"""
    out = []
    # (the game's registration mark lies forward on the bow 0.7-1.3 m over the water, markStrips: the name goes under it, maletest)
    for sg, xs in ((1, [7.75 - 1.15 * k / 12 for k in range(13)]), (-1, [6.60 + 1.15 * k / 12 for k in range(13)])):
        B = []; T = []
        for x in xs:
            for arr, dz in ((B, 0.98), (T, 0.70)): z = zs(x) - dz; arr.append(G(x, sg * (y_at(x, z) + 0.03), z))
        out.append([B, T])
    zb, zt = 1.90, 2.20; ys = [0.75 - 1.5 * k / 12 for k in range(13)]
    out.append([[G(x_of(0.0, zb) - 0.025, y, zb) for y in ys], [G(x_of(0.0, zt) - 0.025, y, zt) for y in ys]])
    return out

def kit_places(G):
    """the places where the game sets the deck kit (nothing that can be bought is modelled in, only its place, 19.10.2026): the liferaft
    in its cradle on the wheelhouse roof forward of the mast to port, the ring buoys on the wheelhouse's aft wall to port (the first, with
    its light and line) and on the trunk's aft face to starboard of the companionway; the radome on the mast's platform; the net tub, the
    line tubs and the first freight on the hold's cover, the second pallet on the aft deck"""
    r = lambda a: round(a, 3); z0, _, _, zr_ = wh_z(); zl = z_deck(5.17) + 0.225
    return {'raft': [G(WX0 + 1.75, 0.60, zr_ + 0.12) + [r(math.pi / 2)]],
            'buoys': [G(WX0 - 0.03, 0.80, z0 + 0.90) + [0.0], G(CX0 - 0.03, -0.72, z_deck(CX0) + 0.62) + [0.0]],
            'radar': G(RX, 0.0, zr_ + 0.99),
            'garn': {'at': G(5.17, 0.0, zl), 'ry': 0.0},
            'stamps': {'at': G(4.80, -0.26, zl), 'ry': r(math.pi)},
            'cargo': [G(5.17, 0.0, zl) + [0.0], G(0.55, 0.62, z_deck(0.55)) + [r(math.pi / 2)]]}

def bower(G):
    return {'kind': 'plog', 'kg': 14, 'fair': G(XF + 0.06, 0, zs(XF - 0.05) + 0.085), 'gypsy': G(8.72, -0.19, z_deck(8.72) + 0.24), 'side': 0, 'deck': True}

HX = 5.95                    # the hauler's station on the starboard cap
HP, FOV = -0.30, 60          # the bridge view's pitch (rad) and field: the dash inside it (check())
def anchors():
    G = lambda x, y, z: [round(v, 3) for v in to_game((x, y, z))]
    z0, zs_, zh_, zr_ = wh_z(); hy = -(gunwale_y(HX) - 0.02); px, py = POLE
    return {'bower': bower(G), 'eye': G(SKIP[0], SKIP[1], z0 + 1.65), 'skipperAt': G(SKIP[0], SKIP[1], z0), 'hp': HP, 'fov': FOV,
            # the hands: the fisher at the hauler on the starboard rail, the one who guts at the table to port, one aft of the hold's hatch, one by
            # the wheelhouse door to port (the aft deck behind the house is too narrow to walk to)
            'crewSpots': [G(5.85, -1.02, z_deck(5.85)) + [1.57], G(5.30, 0.84, z_deck(5.3)) + [-1.57], G(4.20, -0.30, z_deck(4.2)) + [3.14], G(4.30, 1.12, z_deck(4.30)) + [0.0]],
            # typed lights (B8; rule 23 (d)(i), under 12 m: an all-round white and the side lights; the game also lights the stern light)
            'lights': [[G(MX, 0, white_z()), [1, 0.95, 0.85], 'allround'],
                       [G(LAMP_X + 0.012, WY + 0.068, lamp_z()), [1, 0.12, 0.1], 'port'],
                       [G(LAMP_X + 0.012, -(WY + 0.068), lamp_z()), [0.1, 1, 0.35], 'stbd'],
                       [G(px - 0.085, -gunwale_y(px), zs(px) + 1.212), [1, 0.95, 0.85], 'stern'],
                       [G(WX1 + LEAN + 0.03, 0.0, zr_ - 0.08), [1, 0.95, 0.85], 'work'], [G(WX0 - 0.06, 0.0, zr_ - 0.08), [1, 0.95, 0.85], 'work']],
            'doors': [{'at': G(WX1 + 0.03, 0.66, z_deck(2.3)), 'w': 0.64, 'h': DOOR_H, 'in': G(WX1 - 0.8, 0.66, z0), 'to': 'helm', 'hinge': 'port'},
                      {'at': G(CX0 - 0.03, 0.01, z_deck(CX0)), 'w': round(COMP[1] - COMP[0], 2), 'h': round(COMP[3], 2), 'in': G(CX0 + 0.8, 0.0, z_deck(CX0) - 0.5), 'to': 'cabin', 'hinge': 'port'}],
            'names': name_strips(G),
            # the work at sea, in its order (plastsjark-grunnlag kap. 6.2): the fisher at the starboard rail by the hauler; the bleeding tub
            # on the deck just aft of him; the gutting table is the boat's own, across the port bulwark abreast of him (own; top: where the fish
            # lie), the one who guts on the deck inboard of it; the gutted fish go down the hold's hatch between them, on ice
            'work': {'table': G(sum(GUT) / 2, 1.45, z_deck(5.35)), 'tub': G(5.30, -1.26, z_deck(5.30)), 'own': True, 'top': round(gut_top() - WL, 3)},
            'hatch': G(5.17, 0.0, z_deck(5.17) + 0.225), 'bunk': G(7.5, 0.5, z_deck(7.5) - 0.1), 'exhaust': G(MX - 0.37, 0.55, zr_ + 1.56),
            'deck': {'y': round(z_deck(5.0) - WL, 3), 'z': round(-(5.0 - XM), 3)}, 'gw': round(zs(5.0) - WL, 3),
            'stern': round(XM - XA, 3), 'bow': round(-(XF - XM), 3), 'side': HB, 'beam': BEAM, 'pl': 3.3, 'rl': 1.4, 'open': False, 'hand': False,
            'pole': G(px - 0.08, -gunwale_y(px), zs(px) + 1.16), 'hauler': G(HX, hy, zs(HX) + 0.42), 'filler': G(3.95, ybw(3.95) - 0.12, z_deck(3.95) + 0.06),
            'kit': kit_places(G)}


# ---------- the checks against the tables, the data and the rules ----------
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
    for _ in range(80):
        if displacement(wl1)[0] > DISP: wl1 -= 0.005
        else: break
    out.append(('deplasement %.2f t ved vannlinja (%.2f m over kjølen) mot %.1f t i VESSELS; %.1f t gir vannlinja %.2f m lavere (største snitt %.2f m2)' % (v, WL, DISP, DISP, WL - wl1, amax), abs(v - DISP) / DISP < 0.15))
    xs = [XA + (XF - XA) * i / 400 for i in range(401)]
    loa = XF - XA
    out.append(('lengde over alt %.2f m (speilets topp til stevnens topp; baugrulla til %.2f) mot %.2f' % (loa, XF + 0.10, L), abs(loa - L) / L < 0.01))
    mb = max(ysh(x) for x in xs[::4])
    out.append(('største bredde %.2f m mot %.2f (vannlinja %.2f m, %.0f %%)' % (2 * mb, BEAM, 2 * max(hbw(x) for x in xs), 100 * max(hbw(x) for x in xs) / mb), abs(2 * mb - BEAM) / BEAM < 0.03))
    dr = WL - min(kb(x) for x in xs if x >= X_KA)
    out.append(('dypgang %.2f m med kjølen (skoen 0,008 under) mot %.2f' % (dr, DRAFT), abs(dr - DRAFT) < 0.02))
    out.append(('fribord midtskips %.2f m, ved stevnen %.2f, ved speilet %.2f; dekket %.2f over vannet midtskips' % (zs(XM) - WL, zs(XF) - WL, zs(XA) - WL, z_deck(XM) - WL), z_deck(XM) - WL > 0.3))
    wz, lz = white_z(), lamp_z()
    out.append(('den hvite rundtlysende %.2f m over sidelanternene (vedlegg I 2(d): minst 1 m)' % (wz - lz), wz - lz >= 1.0))
    hs, hw = lz - zs(LAMP_X), wz - zs(MX)
    out.append(('sidelanternene %.2f m over skroget, den hvite %.2f (vedlegg I 2(g): sidene høyst tre firedeler så høyt, %.2f)' % (hs, hw, 0.75 * hw), hs <= 0.75 * hw))
    px, py = POLE
    out.append(('masta med den hvite står %.1f m fra flaggstanga og over den: spillet gir vimpel (båten har mast)' % math.hypot(MX - px, gunwale_y(px)), math.hypot(MX - px, gunwale_y(px)) > 1.0 and wz > zs(px) + 1.2))
    tip = PROP[2] + PR; low = PROP[2] - PR
    out.append(('propellen Ø %.2f: %.2f m klaring til skroget over, %.2f til skoen under, %.2f til kjølen forut, %.2f til roret akter' % (2 * PR, zr(PROP[0]) - tip, low - 0.045, X_KA - PROP[0] - 0.07, PROP[0] - 0.07 - RX_),
                zr(PROP[0]) - tip > 0.08 and low - 0.045 > 0.05 and X_KA - PROP[0] - 0.07 > 0.1 and PROP[0] - 0.07 - RX_ > 0.1))
    z0, zs_, zh_, zr_ = wh_z()
    out.append(('styrehuset: %.2f m under taket over dørken der skipperen står (brotest: 1.8 for den som står)' % (zr_ - z0), zr_ - z0 >= 1.8))
    ey = z0 + 1.65
    out.append(('øyet %.2f m over vinduskarmen, %.2f under vinduets overkant' % (ey - zs_, zh_ - ey), ey - zs_ > 0.4 and zh_ - ey > 0.05))
    (dx0, dz0), (dx1, dz1) = dash(); dd = math.hypot(dx1 - SKIP[0], ey - dz1)
    ang = math.degrees(math.atan2(ey - (dz0 + dz1) / 2, (dx0 + dx1) / 2 - SKIP[0]))
    out.append(('dashbordet %.0f grader under øyet (hp %.2f rad og fov %d: synsfeltet går ned til %.0f grader)' % (ang, HP, FOV, math.degrees(-HP) + FOV / 2), ang <= math.degrees(-HP) + FOV / 2))
    out.append(('rattet %.2f m forut for øyet (skipperen står bak det, ikke i det)' % (WHEEL[0] - SKIP[0]), 0.3 <= WHEEL[0] - SKIP[0] <= 0.55))
    out.append(('sløyebordet %.2f m over dekket, ytterkanten %.2f m utenfor ripa (vessel3d: bredden ±5 %%)' % (gut_top() - z_deck(5.35), 0.03), 0.8 <= gut_top() - z_deck(5.35) <= 0.95))
    for s, ok_ in out: print(('OK   ' if ok_ else 'FEIL ') + s)
    return all(o for _, o in out)


SHOTS = [('bow3q', (17.5, -9.5, 3.6), (4.7, 0, 2.2), 38), ('stern3q', (-7.5, 8.0, 4.2), (4.0, 0, 2.2), 35), ('side', (4.7, 19, 2.4), (4.7, 0, 2.3), 35),
         ('above', (11.0, -7.0, 9.5), (4.5, 0, 2.0), 35), ('deck', (8.5, -4.0, 5.0), (4.8, 0, 2.0), 38)]
def _eye(): return (SKIP[0], SKIP[1], z_wh() + 1.65)
EYE = (SKIP[0], SKIP[1], 1.87 + 1.65)
ZC = 1.87                    # the working deck's height (for shots.py K5)
CLOSE = [('c_helm', (2.45, -0.25, 3.55), (3.45, -0.75, 2.9), 30, False, False), ('c_wh', (6.8, -3.4, 3.6), (2.5, -0.4, 3.0), 30, True, False),
         ('c_stern', (-2.6, -2.0, 2.4), (0.2, 0, 1.8), 32, True, False), ('c_bow', (11.0, -1.8, 3.4), (9.0, 0, 2.8), 30, False, False),
         ('c_aperture', (0.9, -3.0, 0.5), (0.8, 0, 0.55), 30, False, False), ('c_work', (5.3, -0.2, 4.6), (5.2, 0.1, 1.9), 28, False, False),
         ('c_trunk', (9.6, -2.6, 3.6), (7.0, 0, 2.6), 30, False, False),
         ('K6p', (29.3, 19.2, 4.35), (4.725, 0, 2.25), 100, True, True)]      # K6 from the port bow: the red and the white only

def main():
    os.makedirs(OUT, exist_ok=True)
    if 'check' in sys.argv: sys.exit(0 if check() else 1)
    check()
    reset(); colours()
    solids, glass = build(True)
    join(solids, 'BOAT0'); join(glass, 'GLASS0')
    if 'fast' not in sys.argv and 'dry' not in sys.argv: beauty(OUT, 'pl31', WL, SHOTS)
    ex = {'frame': 'kystfiske: x starboard, y up from the waterline, z aft; metres', 'type': 'plastsjark', 'name': 'Plastsjark 31 fot', 'len': L, 'beam': BEAM, 'draft': DRAFT,
          'anchors': anchors()}
    export_boat(build, to_game, to_game_n, OUT, 'plast31.glb', os.path.join(ROOT, 'src', 'data', 'boat-plast31.b64'), ex,
                side=(os.path.join(ROOT, 'src', 'data', 'boat-plast31-side.b64'), 4.7, 1.9, 11.5), dry='dry' in sys.argv)


if __name__ == '__main__':
    main()
