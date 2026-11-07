"""The snow crab vessel (snokrabbe, «Snøkrabbefartøy 50 m med fryseri»), rebuilt from the bottom for havsteget H3d1 (Jonas 07.11.2026:
«hele modellen skal revideres eller skapes fra bunn av med mye høyere kvalitet», the best model in the game). The game's size stands
(VESSELS.snokrabbe: 50 x 11 m, 6.0 m draft, 1 800 t loaded, steel, ice class 1C, a crane of 5 t, 900 m3 freezer hold, 400 m3 RSW tanks).

The arrangement is the one Jonas built her from on 06.10.2026 (renders of a modern crab catcher, not in the repository: the low pot deck
aft with its bulwark 4.6 m over the water, the raised forecastle from 28 m forward with the house and the wheelhouse on it, the portal for
the pots with the knuckle crane beside it, the shelter over the pot deck aft, the round forefoot under a near upright stem), filled out
from his GA drawing of 07.11.2026 (a 73.4 m snow crab catcher: the hauling station to starboard amidships, the pots stacked in rows over
the after deck, the hatches over the freezer hold and the RSW tanks, a deck crane and the stern booms) scaled to 50 m, and sized against
the Norwegian fleet (Polar Pioneer 49.95 x 11.2 m, Arctic Pioneer 45 m, Kvitungen 47.5 m, Polarbris 43.5 m, Frøyanes 69.9 m): the
sources and the self-assessment are in docs/skipsmodeller/snokrabbe-grunnlag.md, the build in snokrabbe-bygging.md. Jonas' colours from
20.10.2026 stand («Bytt gjerne fargene til et annet design som ikke ligner denne»): an anthracite hull with an ochre sheer stripe and boot
top, a near black bottom, cream superstructure.

Built after the pilot's way of working (sulebas-bygging.md; ringnot38.py and kyst15.py the template for the code): the hull is ONE surface,
both sides over the skeg, the transom with its corners rounded in plan, the bulwarks, their caps and insides and the decks share their
points (Mesh); the openings are real holes cut with a boolean and lined (the shelter's weather openings, the stern opening and the pot
chute's port in the transom, the freeing ports, the portholes, the hawse pipes, the cargo hatch and the stair well); the plate seams and
the ice belt (1C: the bow's waterline strakes) are welded strips on the plating; nothing lies in the plane of anything else. The crane's
head, boom and hook block and the cargo hatch's lid are parts of their own for the landing (H2d2, as al45.py). Nothing that can be bought
is modelled in (CLAUDE.md, 18.10.2026): no hauler, no radar, no rafts, no lifebuoys, no rescue boat (the game sets them on the places in
anchors: hauler, kit.raft, kit.buoys, kit.mob, kit.radarA); the portal, the conveyor, the sorting table, the pot chute, the crane and the
boom rest are the ship's own. No maker's or yard's name anywhere (CLAUDE.md).

    pip install bpy==4.5.4   (Python 3.11)
    python3 tools/boats/krabbe50.py            -> src/data/boat-krabbe50.b64 (+ the side picture), renders in tools/boats/out/
    python3 tools/boats/krabbe50.py fast       -> the same without the renders
    python3 tools/boats/krabbe50.py fast dry   -> no renders, the GLB only in tools/boats/out
    python3 tools/boats/krabbe50.py check      -> the checks against the data, the rules and the game's demands only

Frame: x forward from the transom's aft face, y to port, z up from the keel's underside (the shoe under the propeller); the waterline is
z = WL = 6.0 (the data's draft)."""
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy, bmesh
from bpyutil import *
import bpyutil
import fittings as F
from mathutils import noise

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE)); OUT = os.path.join(HERE, 'out')
L = 50.0; BEAM = 11.0; DRAFT = 6.0; DISP = 1800.0              # VESSELS.snokrabbe (disp: loaded, an estimate)
WL = 6.0; XA = 0.0; XF = 50.0; XM = (XA + XF) / 2


# ---------- the levels (the renders of 06.10.2026: the pot deck's bulwark 4.6 m over the water; the forecastle and the shelter one deck up) ----------
DK = 9.40                    # the pot deck (the main deck aft), flat
GW = 10.60                   # the open pot deck's bulwark top (4.6 m over the water)
X_SH = 14.50                 # the shelter's forward edge (the shelter over the pot deck from the stern to here)
X_FC = 28.50                 # the forecastle's aft bulkhead (the forecastle from here forward)
SD = 12.35                   # the shelter's top and the forecastle deck at its aft end (2.95 m over the pot deck)
CEIL = SD - 0.35             # the shelter's underside over the pot deck (the stacks of twelve pots are 2.38 m tall)
COAM = 0.25                  # the shelter's low coaming at its edge (pipe rails on it)
FCB = 1.05                   # the forecastle's bulwark over its deck


# ---------- the lines (no drawing with figures: chosen to the game's size and the renders' profile, weighed in check()) ----------
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

# the body's bottom on the centreline: the transom's foot just over the water, the run up from the propeller, the flat keel with its drag
# (0.5 m over 26 m: she trims by the stern as the Norwegian fleet's hulls do), the round forefoot and the stem raked 10 degrees
LOW = [(XA, 6.45), (1.0, 5.90), (2.2, 5.05), (3.6, 3.95), (5.2, 2.75), (7.0, 1.65), (9.0, 0.92), (11.5, 0.52), (14.0, 0.38), (20.0, 0.40),
       (28.0, 0.52), (36.0, 0.68), (40.0, 0.82), (42.5, 1.10), (44.5, 1.70), (46.0, 2.55), (47.2, 3.62), (48.1, 4.85), (48.75, 6.0),
       (49.25, 7.35), (49.62, 8.85), (49.86, 10.5), (XF, 13.0)]
def z_low(x): return pchip(LOW, x)
# the skeg (deadwood) under the after body: its underside from the stern tube's boss forward, running into the flat keel at X_KF
X_KA, X_KF = 4.40, 20.0
KEEL = [(X_KA, 0.0), (8.0, 0.05), (12.0, 0.15), (16.0, 0.28), (X_KF, z_low(X_KF))]
def kb(x):
    if x > X_KF: return z_low(x)
    k = pchip(KEEL, x); return k + (z_low(x) - k) * ss(17.0, X_KF, x)
def keel_t(x): return pchip([(X_KA, 0.70), (6.0, 0.62), (12.0, 0.40), (X_KF, 0.26)], x)
# the decks at the side: the shelter and the forecastle deck with the sheer forward (the forecastle's deck rises 0.45 m to the stem)
SDK = [(XA, SD), (X_FC, SD), (36.0, SD + 0.08), (42.0, SD + 0.18), (46.0, SD + 0.30), (XF, SD + 0.45)]
def z_sd(x): return pchip(SDK, x)
def z_deck(x):
    """the deck the bulwark stands on at x: the shelter's top aft, the pot deck in the open middle, the forecastle deck forward"""
    return z_sd(x) if x < X_SH or x >= X_FC else DK
# the hull's top (the bulwark's cap): the shelter's coaming aft, swept down to the pot deck's bulwark, up again to the forecastle's
# bulwark, rising to the stem; the sweeps are smooth (the hull is one surface)
SW_A = (X_SH, X_SH + 1.4)     # the shelter side's end, swept down
SW_F = (X_FC - 1.2, X_FC)     # the forecastle's bulwark, swept up
def z_cap(x, sg=1):
    a = z_sd(x) + COAM; b = GW; c = z_sd(x) + FCB + 0.40 * ss(42.0, XF, x)
    if x <= SW_A[0]: return a
    if x < SW_A[1]: return a + (b - a) * ss(SW_A[0], SW_A[1], x)
    if x <= SW_F[0]: return b
    if x < SW_F[1]: return b + (c - b) * ss(SW_F[0], SW_F[1], x)
    return c
# the half-breadth at the sheer, moulded: the transom's corners rounded in plan, the bow drawn in to the stem; the flare and the
# fullness of the sections are weighed in check() against the 1 800 t
HB = [(XA, 4.95), (0.15, 5.12), (0.45, 5.28), (1.0, 5.40), (2.0, 5.47), (3.5, 5.50), (34.0, 5.50), (37.0, 5.47), (40.0, 5.33), (42.5, 5.05),
      (44.5, 4.62), (46.0, 4.08), (47.3, 3.38), (48.4, 2.55), (49.2, 1.68), (49.7, 0.90), (XF, 0.0)]
def hb(x): return max(0.0, pchip(HB, x))
DR = [(XA, 3), (4.0, 4), (8.0, 4), (16.0, 3), (28.0, 3), (36.0, 5), (40.0, 9), (43.0, 18), (45.5, 32), (47.5, 50), (XF, 66)]
FL = [(XA, 1), (6.0, 0), (30.0, 0), (36.0, 2), (40.0, 6), (43.0, 12), (45.5, 18), (47.5, 24), (XF, 28)]
FULL = [(XA, 0.74), (4.0, 0.83), (8.0, 0.92), (14.0, 0.965), (30.0, 0.965), (36.0, 0.935), (40.0, 0.87), (43.0, 0.74), (45.5, 0.62), (47.5, 0.53), (XF, 0.46)]
# the rubbing bars (two half-round steel bars along the parallel body, at the pot deck and under the shelter's edge), the sheer stripe
# (the top of the bulwark in ochre, zone 2), the bottom paint and the boot top, parallel to the water
RUB = [8.05, 10.30]; RUB_X = (3.0, 44.0); RUBH, RUBW = 0.07, 0.07
def z_stripe(x): return z_cap(x) - 0.30
Z_AF = WL - 0.05; Z_BT = WL + 0.35


# ---------- the sections (kyst15.py: the body as one cubic, the skeg in the section) ----------
def vline(x, sg=1):
    """the body's half-section at x from the centreline (the bottom of the body) to the bulwark's top, as (y, z): a cubic from the keel's
    root out along the deadrise and round the bilge up along the flare to the sheer, its control points pulled toward the corner by the
    fullness"""
    zl = z_low(x); zs = z_cap(x, sg); h = hb(x); n = 56
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
        t = (k / n) ** 1.1; u = 1 - t
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
    """the skeg's (the stem's) half width at its underside"""
    if x < X_KA: return 0.0
    if x <= X_KF: return keel_t(x) * 0.36
    return pchip([(X_KF, keel_t(X_KF) * 0.36), (30.0, 0.10), (45.0, 0.08), (XF, 0.06)], x)
def wroot(x): return wk(x) * 1.7 if x <= X_KF else wk(x)

NKB, NF = 4, 3
_S = {}
def rub_on(x):
    """how far the rubbing bars stand out at x (they end in tapers at RUB_X)"""
    return ss(RUB_X[0], RUB_X[0] + 1.0, x) * (1 - ss(RUB_X[1] - 1.0, RUB_X[1], x))
def section(x, sg=1, fine=True):
    """the whole half-section at x as (y, z, kind) from the skeg's underside on the centreline to the bulwark's top; the counts never
    change (points collapse where a band is empty). Kinds: 'k' the skeg, 'f' the fillet at its root, 'b' the bottom, 't' the topside,
    'r' a rubbing bar, 'u' the ochre stripe, 's' the bulwark's top"""
    key = (round(x, 5), sg, fine)
    if key in _S: return _S[key]
    P = vline(x, sg); zl = P[0][1]; top = P[-1][1]; out = []
    nk = NKB if fine else 1; nf = NF if fine else 1
    if x >= X_KA:
        b = kb(x); f = min(1.0, (x - X_KA) / 0.10); ww = wk(x) * f; wr = wroot(x) * f
        if x <= X_KF:
            g = ss(X_KF, X_KF - 2.0, x); wr = ww + (wr - ww) * g
            fw = 0.30 * f * g; zc = z_on(P, wr); zt = max(b + 0.10 * g, zc - 0.25 * g); e1, e2 = 0.02 * g, (0.06 if fine else 0.03) * g
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
    nb = 20 if fine else 3
    zw = cl(WL + 0.6); out += [(yy, zz, 'b') for yy, zz in along(body, z0, zw, nb)]
    zprev = zw; ro = rub_on(x)
    for zr in RUB:
        zr0 = cl(zr - RUBH); out += [(yy, zz, 't') for yy, zz in along(body, zprev, zr0, 5 if fine else 1)]
        for dz, off in (((-0.062, 0.36), (-0.044, 0.72), (-0.018, 0.96), (0.018, 0.96), (0.044, 0.72), (0.062, 0.36), (RUBH, 0.0)) if fine else ((0.0, 1.0), (RUBH, 0.0))):
            zq = cl(zr + dz); yy, zz = at_z(body, zq); out.append((yy + RUBW * off * ro, zz, 'r' if off > 0 and ro > 1e-4 else 't'))
        zprev = cl(zr + RUBH)
    zst = cl(z_stripe(x))
    out += [(yy, zz, 't') for yy, zz in along(body, zprev, zst, 6 if fine else 1)]
    out += [(yy, zz, 'u') for yy, zz in along(body, zst, top, 3 if fine else 1)[:-1]]
    out.append((P[-1][0], top, 's'))
    _S[key] = out; return out

def y_at(x, z, sg=1):
    """the outside's half-breadth at x and height z (the body; the skeg under its root)"""
    P = vline(x, sg)
    if z <= P[0][1]: return wk(x) if x >= X_KA else 0.0
    return at_z(P, z)[0]

def xstem(z):
    lo, hi = 40.0, XF
    for _ in range(50):
        m = (lo + hi) / 2
        if z_low(m) < z: lo = m
        else: hi = m
    return lo


# ---------- the checks against the data, the rules and the game's demands (sulebas-bygging kap. 15), written before the shaping ----------
def displacement(wl):
    xs = [XA + (XF - XA) * i / 500 for i in range(501)]
    def area(x):
        s = section(x); a = 0.0
        for (y0, z0, _), (y1, z1, _) in zip(s, s[1:]):
            za, zb = min(z0, wl), min(z1, wl)
            if z1 > z0 and za < wl: a += (y0 + y1) / 2 * (zb - za)
        return 2 * a
    A = [area(x) for x in xs]
    return sum((A[i] + A[i + 1]) / 2 * (xs[i + 1] - xs[i]) for i in range(500)) * 1.025, max(A)

CHECKS = []      # (name, function returning (text, ok)) added by the parts below as they are built
def check():
    out = []
    v, amax = displacement(WL); wl1 = WL; st = -0.01 if v > DISP else 0.01
    for _ in range(200):
        if (displacement(wl1)[0] - DISP) * st < 0: wl1 += st
        else: break
    xs = [XA + (XF - XA) * i / 500 for i in range(501)]
    lwl = max(x for x in xs if z_low(x) < WL) - min(x for x in xs if z_low(x) < WL)
    bwl = 2 * max(y_at(x, WL) for x in xs[::5])
    out.append(('deplasement %.0f t ved vannlinja (lastet, VESSELS 1 800 t); %.0f t gir vannlinja %.2f m %s; Cb %.2f (LWL %.1f, BWL %.2f), største snitt %.1f m2' % (v, DISP, abs(WL - wl1), 'lavere' if wl1 < WL else 'høyere', v / 1.025 / (lwl * bwl * (WL - 0.25)), lwl, bwl, amax), abs(v - DISP) / DISP < 0.05))
    out.append(('lengde over alt %.2f m (speilet til stevnens topp) mot %.0f' % (XF - XA, L), abs(XF - XA - L) < 0.05))
    mb = max(y_at(x, z) for x in xs[::5] for z in (WL, WL + 1.5, DK, GW - 0.1))
    mr = max(y_at(x, z) + RUBW * rub_on(x) for x in xs[::5] for z in RUB)
    out.append(('største bredde %.2f m mallet, %.2f over rubbelistene, mot %.2f' % (2 * mb, 2 * mr, BEAM), abs(2 * max(mb, mr) - BEAM) / BEAM < 0.03))
    out.append(('dypgang %.2f m med skjegget (skoen under propellen) mot %.2f; kjølen forut %.2f m over grunnlinja (trim på hekken)' % (WL, DRAFT, z_low(40.0)), abs(WL - DRAFT) < 0.05))
    out.append(('fribord: teinedekket %.2f m over vannet, rekka %.2f (bildene: 4,6), shelteret og bakken %.2f, baugen %.2f' % (DK - WL, GW - WL, SD - WL, z_cap(XF) - WL), DK - WL > 2.5 and 4.3 <= GW - WL <= 4.9))
    out.append(('under shelteret %.2f m fri høyde over teinedekket (stablene på tolv er 2,38 m; dekkskartet 1.85)' % (CEIL - DK), CEIL - DK >= 2.38 + 0.15))
    for nm, f in CHECKS:
        try: out.append(f())
        except Exception as e: out.append(('%s: %s' % (nm, e), False))
    # vessel3d: the hull from 0.3 m under the water to 1.5 m over it, with what stands out
    z0b, z1b = WL - 0.3, WL + 1.5
    ln = max(x for x in xs if z_low(x) < z1b) - XA
    br = 2 * max(max(y_at(x, z) for z in (z0b, WL, z1b)) for x in xs[::5])
    out.append(('vessel3d: skroget i båndet -0.3 til 1.5 m er %.2f m langt (lengden %.0f, -6 %% til +3 %%) og %.2f m bredt (bredden %.0f, ±5 %%)' % (ln, L, br, BEAM), -0.06 < (ln - L) / L < 0.03 and abs(br - BEAM) / BEAM < 0.05))
    # the hull's fairness (sulebas-bygging kap. 16): the waterlines' slope from one 10 cm step to the next, away from the stem
    worst = (0.0, 0, 0)
    for z in (1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.5, 10.0):
        xs3 = [0.5 + 0.10 * i for i in range(490) if max(z_low(0.5 + 0.10 * i - 0.4), z_low(0.5 + 0.10 * i + 0.4)) < z - 0.5 and 0.5 + 0.10 * i < xstem(z) - 0.4]
        yv = [y_at(x, z) for x in xs3]; d = [b - a for a, b in zip(yv, yv[1:])]
        for i in range(1, len(d)): worst = max(worst, (abs(d[i] - d[i - 1]), xs3[i], z))
    out.append(('vannlinjene jevne: største endring i stigningen %.3f m per 10 cm-steg (ved x %.2f, z %.2f; en bule synes over rundt 0,02)' % worst, worst[0] < 0.02))
    for s, ok_ in out: print(('OK   ' if ok_ else 'FEIL ') + s)
    return all(o for _, o in out)



# ---------- colours (Jonas 20.10.2026: anthracite, ochre, cream; the paint zones of 10j-paint.js: 1 the hull, 2 the ochre stripe and boot
# top, 3 the superstructure, 4 the decks) ----------
C = {}
def colours():
    w = lambda n, rgb, g=0.4, z=0, metal=0.0, emit=0.0: C.__setitem__(n, mat(n, rgb, g, zone=z, metal=metal, emit=emit))
    w('af', (0.075, 0.075, 0.08), 0.15); w('boot', (0.80, 0.50, 0.08), 0.5, 2); w('hull', (0.15, 0.16, 0.175), 0.55, 1)
    w('stripe', (0.80, 0.50, 0.08), 0.5, 2); w('rubbar', (0.13, 0.14, 0.15), 0.6, 1); w('mark', (0.92, 0.91, 0.86), 0.4)
    w('white', (0.88, 0.86, 0.80), 0.5, 3); w('cap', (0.84, 0.82, 0.76), 0.45, 3); w('roof', (0.74, 0.74, 0.70), 0.3, 3)
    w('inner', (0.80, 0.79, 0.74), 0.3); w('ceil', (0.70, 0.70, 0.66), 0.25); w('frameW', (0.76, 0.75, 0.70), 0.3)
    w('deck', (0.36, 0.38, 0.37), 0.12, 4); w('potdeck', (0.33, 0.35, 0.34), 0.10, 4); w('nonslip', (0.31, 0.33, 0.32), 0.06, 4)
    w('steel', (0.66, 0.68, 0.70), 0.75, 0, 0.75); w('inox', (0.80, 0.81, 0.83), 0.85, 0, 0.85); w('galv', (0.58, 0.60, 0.60), 0.45, 0, 0.6)
    w('ochre', (0.82, 0.52, 0.10), 0.5); w('yellow', (0.95, 0.72, 0.06), 0.5); w('mast', (0.88, 0.86, 0.80), 0.5, 3)
    w('dark', (0.09, 0.10, 0.11), 0.25); w('black', (0.04, 0.04, 0.05), 0.4); w('rubber', (0.05, 0.05, 0.055), 0.15)
    w('frame', (0.07, 0.07, 0.08), 0.45); w('cabin', (0.05, 0.05, 0.06), 0.2); w('sole', (0.30, 0.31, 0.32), 0.2)
    w('belt', (0.18, 0.19, 0.19), 0.2); w('roller', (0.55, 0.57, 0.58), 0.6, 0, 0.6); w('blue', (0.10, 0.28, 0.55), 0.4)
    w('prop', (0.70, 0.52, 0.27), 0.8, 0, 0.9); w('anode', (0.55, 0.56, 0.55), 0.2); w('red', (0.72, 0.16, 0.08), 0.5)
    w('rope', (0.20, 0.42, 0.62), 0.2); w('hose', (0.10, 0.36, 0.20), 0.4); w('orange', (0.95, 0.38, 0.06), 0.45)
    w('screen', (0.03, 0.05, 0.07), 0.9); w('bezel', (0.10, 0.10, 0.11), 0.5); w('cush', (0.15, 0.16, 0.19), 0.35); w('board', (0.24, 0.25, 0.27), 0.35)
    w('switch', (0.20, 0.21, 0.22), 0.4); w('wood', (0.58, 0.38, 0.20), 0.3)
    w('lampR', (0.90, 0.10, 0.08), 0.8, 0, 0, 0.5); w('lampG', (0.10, 0.80, 0.25), 0.8, 0, 0, 0.5); w('lampW', (1.0, 0.97, 0.88), 0.8, 0, 0, 0.5)
    w('lens', (0.95, 0.94, 0.85), 0.9)
    w('scr_plot', (0.10, 0.22, 0.42), 0.9, 0, 0, 0.6); w('scr_land', (0.55, 0.48, 0.28), 0.9, 0, 0, 0.5); w('scr_sound', (0.06, 0.10, 0.35), 0.9, 0, 0, 0.6)
    w('scr_bottom', (0.70, 0.25, 0.08), 0.9, 0, 0, 0.6); w('scr_radar', (0.03, 0.14, 0.06), 0.9, 0, 0, 0.6); w('scr_eng', (0.08, 0.08, 0.10), 0.9, 0, 0, 0.4)
    C['glass'] = mat('glass', (0.05, 0.08, 0.11), 0.95)


# ---------- the wear: per corner, so it runs across faces (B16; steel, 2001, 25 years in the ice) ----------
def n3(x, y, z=0.0): return noise.noise(V((x, y, z)))
def toward(m, rgb, k):
    base = m['rgb']; return [1 + (rgb[i] / max(base[i], 1e-3) - 1) * k for i in range(3)]
RUST = (0.42, 0.22, 0.10)
OUTLETS = [((22.0, -1, 1.2), 0.30), ((8.5, 1, 0.9), 0.25), ((30.5, -1, 1.6), 0.20), ((16.0, 1, 1.0), 0.15)]   # (x, side, height over the water)
def wear(p, m, n):
    x, y, z = p; nm = m.name; side = 1 if y > 0 else -1
    if nm in ('hull', 'rubbar'):
        g = 0.96 + 0.06 * n3(x * 0.8, z * 2.0, side * 1.3)
        # the ice and the quays: the bow's waterline scoured bare in places (1C), scuffs along the rubbing bars
        ice = ss(30.0, 44.0, x) * ss(1.2, 0.0, abs(z - WL - 0.2)) * ss(0.25, 0.75, n3(x * 1.6, z * 3.0, side * 2.1))
        rs = ss(0.55, 0.85, n3(x * 2.3, z * 4.0, side * 5.1)) * ss(0.35, 0.0, min(abs(z - RUB[0]), abs(z - RUB[1])) - 0.06)
        c = toward(m, RUST, 0.55 * ice + 0.35 * rs)
        # rust streaks running down from the scuppers and the hawse pipes
        for (xo, so, ho), k in OUTLETS:
            if side == so and z < WL + ho:
                c = [c[i] * (1 - k * ss(0.04 + (WL + ho - z) * 0.03, 0.006, abs(x - xo)) * ss(WL - 0.1, WL + 0.2, z)) for i in range(3)]
        if 45.5 < x < 48.5 and 8.0 < z < 11.6 and side != 0:
            c = toward({'rgb': [c[i] * m['rgb'][i] for i in range(3)]}, RUST, 0.25 * ss(0.4, 0.9, n3(x * 3.0, z * 0.7, side)) * ss(11.6, 10.0, z) * ss(0.6, 0.0, abs(x - 47.2)))
        return [c[i] * g for i in range(3)]
    if nm == 'af':
        v = 0.86 + 0.14 * n3(x * 1.5, z * 4.0, y)
        gr = ss(WL - 0.25, WL - 0.05, z) * (0.5 + 0.5 * ss(-0.3, 0.4, n3(x * 2.0, side * 1.3, 4.1)))   # (the weed line)
        return [v * (1 + 0.5 * gr), v * (1 + 0.9 * gr), v * (1 + 0.4 * gr)]
    if nm in ('boot', 'stripe'):
        v = 0.93 + 0.07 * n3(x * 2.0, z * 6.0, side) - 0.10 * ss(WL + 0.10, WL - 0.02, z)
        c = toward(m, RUST, 0.25 * ss(0.55, 0.85, n3(x * 3.1, z * 5.0, side * 2.7)))
        return [c[i] * v for i in range(3)]
    if nm in ('white', 'roof', 'cap', 'mast', 'inner', 'frameW'):
        v = 0.95 + 0.05 * n3(x * 3.0, y * 3.0, z * 3.0)
        c = toward(m, (0.55, 0.40, 0.25), 0.16 * ss(0.62, 0.92, n3(x * 4.0, y * 4.0, z * 4.0 + 0.5)))
        return [c[i] * v for i in range(3)]
    if nm in ('deck', 'potdeck', 'nonslip'):
        v = 0.90 + 0.12 * n3(x * 1.7, y * 1.7, 1.0)
        v *= 1 - 0.10 * ss(1.4, 0.0, abs(y + 4.1)) * ss(0.0, 1.0, x - 1.0) * ss(22.0, 20.0, x)   # worn along the conveyor
        c = toward(m, RUST, 0.18 * ss(0.6, 0.9, n3(x * 2.5, y * 2.5, 7.7)))
        return [c[i] * v for i in range(3)]
    return None

def tint(o, f=wear):
    bm = bmesh.new(); bm.from_mesh(o.data); lay = bm.loops.layers.float_color.new('TINT'); mats = [s.material for s in o.material_slots]
    for fc in bm.faces:
        m = mats[fc.material_index]; fc.normal_update()
        for l in fc.loops:
            t = f(l.vert.co, m, fc.normal)
            l[lay] = (t[0], t[1], t[2], 1.0) if t is not None else (1.0, 1.0, 1.0, 1.0)
    bm.to_mesh(o.data); bm.free(); return o


# ---------- one surface: a mesh whose faces share their points (havsjark35.py, kyst15.py) ----------
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
    def poly(s, pts, m, out=None): return s.f(pts, m, out)
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


# ---------- the stations: dense, with stations at every place a band or an opening ends so the cuts land on rows ----------
OPEN_S = [(1.6, 5.4), (6.6, 10.4)]               # the shelter's weather openings, both sides (x from, to)
OPEN_Z = (DK + 1.10, CEIL - 0.45)
STERN_O = (-3.10, 4.30, DK + 1.05, CEIL - 0.35)  # the stern opening in the transom over the pot deck (y from, to; z)
CHUTE_O = (-4.62, -3.52, DK + 0.38, DK + 1.62)   # the pot chute's port in the transom's starboard corner (y; z)
def stations(fine=True):
    sp = [XA, X_KA - 0.002, X_KA, X_KA + 0.05, X_KA + 0.10, X_KF, X_SH, X_FC - 0.006, X_FC, X_FC + 0.006] + list(SW_A) + list(SW_F)
    if fine:
        for a, b in OPEN_S: sp += [a, b]
        xs = [XA + 0.02, XA + 0.05, XA + 0.09, XA + 0.14, XA + 0.20, XA + 0.27, XA + 0.35, XA + 0.45, XA + 0.6, XA + 0.8] + [1.0 + 0.20 * i for i in range(240)] + [49.0 + 0.04 * i for i in range(25)]
        sp += stem_stations(lambda x: z_low(x) if x > X_KF else kb(x), [Z_AF, Z_BT, RUB[0] - RUBH, RUB[0] + RUBH, RUB[1] - RUBH, RUB[1] + RUBH, z_stripe], 40.0, XF - 0.012)
    else:
        xs = [0.6, 2.4, 8.0, 22.0, 34.0, 40.0, 43.5, 46.0, 47.6, 48.7, 49.5]
        sp = [XA, X_KA, X_KF, X_SH, X_FC - 0.006, X_FC] + list(SW_A) + list(SW_F)
    xs = [x for x in xs if all(abs(x - s) > 0.012 for s in sp)] + sp + [XF - 0.006, XF]
    return sorted(set(round(x, 5) for x in xs if XA <= x <= XF))


# ---------- the hull: the outside over the skeg, the transom, the caps, the insides, the decks ----------
TT = 0.08                    # the transom's and the sides' plating with their frames: the insides stand this far in
def ysh(x, sg=1): return section(x, sg)[-1][0]
def yin(x, z, sg=1): return max(0.0, y_at(x, z, sg) - TT)
def camber(x, y, e=None):
    e = e or max(0.3, yin(x, z_deck(x))); return 0.12 * (1 - min(1.0, (y / e) ** 2))
def floor_in(x): return DK if x < X_FC else z_sd(x)
def deck_at(x, y):
    """the deck one stands on at (x, y): the pot deck aft and amidships (flat: it drains to the freeing ports), the forecastle deck forward"""
    return DK if x < X_FC else z_sd(x) + camber(x, y)
def sd_top(x, y): return z_sd(x) + camber(x, y, max(0.3, yin(x, SD)))

HULL_MAT = {'k': 'af', 'f': 'hull', 'b': 'hull', 't': 'hull', 'r': 'rubbar', 'u': 'stripe', 's': 'stripe'}
HULL_KIND = {'r': 3, 'u': 4, 's': 4}
NIN = 12
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
    # the transom's outside: strips across between the first station's two sides, facing aft
    Tp, Ts = S[(xs[0], 1)], S[(xs[0], -1)]
    for j in range(len(Tp) - 1):
        q = [(Tp[j][0], Tp[j][1], Tp[j][2]), (Ts[j][0], -Ts[j][1], Ts[j][2]), (Ts[j + 1][0], -Ts[j + 1][1], Ts[j + 1][2]), (Tp[j + 1][0], Tp[j + 1][1], Tp[j + 1][2])]
        k = Tp[j][3]; M.f(q, C[HULL_MAT[k]] if k in 'us' else C['hull'], (-1, 0, 0), HULL_KIND.get(k, 1))
    # ---- the insides: from the floor (the pot deck, the forecastle deck) up to the cap's inner edge, NIN rows; the cap across ----
    nin = NIN if fine else 2
    xi = [x for x in xs if x >= XA + TT - 1e-9 and yin(x, z_cap(x)) > 0.05]
    if xi[0] > XA + TT + 1e-6: xi = [XA + TT] + xi
    def irow(x, sg):
        z0 = floor_in(x) - 0.004; z1 = z_cap(x, sg)
        zz = [z0 + (z1 - z0) * k / nin for k in range(nin + 1)]
        if x < X_SH and fine:     # (rows at the shelter's underside and top, where it meets the side)
            zz = [z0] + [z0 + (CEIL - z0) * k / (nin - 3) for k in range(1, nin - 3)] + [CEIL, SD, (SD + z1) / 2, z1]
        return [(x, sg * yin(x, z, sg), z) for z in zz]
    for sg in (1, -1):
        R = [irow(x, sg) for x in xi]
        M.strip(R, C['inner'], (0, -sg, 0))
        # the cap: from the outside's top to the inside's top, a little rounded
        CP = [[(x, sg * ysh(x, sg), z_cap(x, sg)), (x, sg * (ysh(x, sg) * 0.5 + yin(x, z_cap(x, sg), sg) * 0.5), z_cap(x, sg) + 0.012), (x, sg * yin(x, z_cap(x, sg), sg), z_cap(x, sg))] for x in xi]
        M.strip(CP, C['stripe'], (0, 0, 1), 4)
    # the transom's inside (the after bulkhead of the pot deck and the shelter's after coaming), across between the insides
    x = XA + TT; zz = [DK - 0.004] + [DK + (z_cap(x) - DK) * k / 10 for k in range(1, 11)] if fine else [DK - 0.004, z_cap(x)]
    ny = 24 if fine else 2
    R = [[(x, yin(x, z) * (1 - 2 * j / ny), z) for z in zz] for j in range(ny + 1)]
    M.strip(R, C['inner'], (1, 0, 0))
    # the transom's top: the cap from the outside aft of TT in to the inside
    tops = [x for x in xs if x < XA + TT - 1e-9]
    zc = z_cap(XA)
    for sg in (1, -1):
        A0 = [(x_, sg * ysh(x_), zc) for x_ in tops] + [(XA + TT, sg * yin(XA + TT, zc), zc)]
        for a, b in zip(A0, A0[1:]): M.f([a, b, (b[0], -b[1], b[2]), (a[0], -a[1], a[2])] if sg > 0 else [a, (a[0], -a[1], a[2]), (b[0], -b[1], b[2]), b], C['stripe'], (0, 0, 1), 4)
    # ---- the decks (in rows: a big flat face goes dark in the game, kap. 19) ----
    ND = 16 if fine else 2
    def across(x, z_of, e, n=ND): return [(x, e * (1 - 2 * i / n), z_of(x, e * (1 - 2 * i / n))) for i in range(n + 1)]
    # the pot deck from the transom's inside to the forecastle's bulkhead
    px = [x for x in xi if x <= X_FC + 1e-6]
    if px[-1] < X_FC - 1e-6: px.append(X_FC)
    M.strip([across(x, lambda x_, y: DK, yin(x, DK) + 0.002) for x in px], lambda i, j: C['potdeck'], (0, 0, 1))
    # the shelter: its top, its underside, its forward edge
    sx = [x for x in xi if x <= X_SH + 1e-6]
    if sx[-1] < X_SH - 1e-6: sx.append(X_SH)
    M.strip([across(x, sd_top, yin(x, SD) + 0.002) for x in sx], lambda i, j: C['deck'], (0, 0, 1))
    M.strip([across(x, lambda x_, y: CEIL, yin(x, CEIL) + 0.002) for x in sx], lambda i, j: C['ceil'], (0, 0, -1))
    e = yin(X_SH, CEIL) + 0.002; top = across(X_SH, sd_top, yin(X_SH, SD) + 0.002); bot = across(X_SH, lambda x_, y: CEIL, e)
    for i in range(len(top) - 1): M.f([bot[i], bot[i + 1], top[i + 1], top[i]], C['white'], (1, 0, 0), 4)
    # the forecastle deck from its bulkhead to the stem, and the bulkhead from the pot deck up to it (doors and windows: deck_house)
    fx = [x for x in xi if x >= X_FC - 1e-6 and yin(x, z_sd(x)) > 0.12]
    M.strip([across(x, lambda x_, y: z_sd(x_) + camber(x_, y), yin(x, z_sd(x)) + 0.002) for x in fx], lambda i, j: C['deck'], (0, 0, 1))
    last = across(fx[-1], lambda x_, y: z_sd(x_) + camber(x_, y), yin(fx[-1], z_sd(fx[-1])) + 0.002)
    tip = (fx[-1] + 0.25, 0.0, z_sd(fx[-1]))
    for a, b in zip(last, last[1:]): M.f([a, b, tip], C['deck'], (0, 0, 1))
    nb = 8 if fine else 1
    top = across(X_FC, lambda x_, y: z_sd(x_) + camber(x_, y), yin(X_FC, z_sd(X_FC)) + 0.002)
    for i in range(len(top) - 1):
        a, b = top[i], top[i + 1]
        col = [[(X_FC, p[1] * (yin(X_FC, DK + (p[2] - DK) * k / nb) + 0.002) / max(1e-6, yin(X_FC, z_sd(X_FC)) + 0.002), DK + (p[2] - DK) * k / nb) for k in range(nb + 1)] for p in (a, b)]
        for k in range(nb): M.f([col[0][k], col[1][k], col[1][k + 1], col[0][k + 1]], C['white'], (-1, 0, 0), 4)
    return S


# ---------- the openings: real holes, cut with a boolean and lined ----------
PORTS = [30.6, 32.0, 33.4, 34.8, 36.2, 37.6]       # the portholes in the forecastle's sides (the mess and the cabins), both sides
PORT_Z = DK + 1.05; PORT_R = 0.20
HAWSE = (47.15, 11.55); HAWSE_R = 0.30             # the hawse pipes' mouths high in the bow, forward of the registration mark
FREE = [15.6, 17.4, 19.2, 21.0, 26.6]              # the freeing ports in the open pot deck's bulwark at the deck (x of their middle)
FREE_W, FREE_H = 0.80, 0.30
SCUP = [2.0, 4.5, 7.0, 9.5, 12.0]                  # the scuppers under the shelter at the pot deck
def rr_pts(cx, cy, w, h, r, n=4): return rrect(cx, cy, w, h, max(0.004, min(r, w / 2 - 0.002, h / 2 - 0.002)), n=n)
def circle(r, n=16): return [(r * math.cos(2 * math.pi * k / n), r * math.sin(2 * math.pi * k / n)) for k in range(n)]
HATCH = (21.20, 23.80, -0.25, 2.35)                # the cargo hatch over the freezer hold on the pot deck (x0, x1, y0, y1; the coaming's outside)
HCH = 0.45                                         # the coaming's height over the pot deck

def cutters(fine=True):
    out = []
    for sg in (1, -1):
        for x0, x1 in OPEN_S:
            xc = (x0 + x1) / 2; zc = sum(OPEN_Z) / 2
            out.append(((xc, sg * y_at(xc, zc, sg), zc), (1, 0, 0), (0, 0, 1), rr_pts(0, 0, x1 - x0, OPEN_Z[1] - OPEN_Z[0], 0.40), 0.30))
        if not fine: continue
        for x in PORTS: out.append(((x, sg * y_at(x, PORT_Z, sg), PORT_Z), (1, 0, 0), (0, 0, 1), circle(PORT_R, 20), 0.12))
        out.append(((HAWSE[0], sg * y_at(HAWSE[0], HAWSE[1], sg), HAWSE[1]), (1, 0, 0), (0, 0, 1), circle(HAWSE_R, 20), 0.14))
        for xc in FREE: out.append(((xc, sg * (yin(xc, DK) + TT / 2), DK + 0.02 + FREE_H / 2), (1, 0, 0), (0, 0, 1), rr_pts(0, 0, FREE_W, FREE_H, 0.05), 0.16))
        for xc in SCUP: out.append(((xc, sg * (yin(xc, DK) + TT / 2), DK + 0.10), (1, 0, 0), (0, 0, 1), rr_pts(0, 0, 0.30, 0.16, 0.05), 0.16))
    # the stern opening and the chute's port through the transom
    y0, y1, z0, z1 = STERN_O; out.append(((XA + TT / 2, (y0 + y1) / 2, (z0 + z1) / 2), (0, 1, 0), (0, 0, 1), rr_pts(0, 0, y1 - y0, z1 - z0, 0.35), 0.15))
    y0, y1, z0, z1 = CHUTE_O; out.append(((XA + TT / 2, (y0 + y1) / 2, (z0 + z1) / 2), (0, 1, 0), (0, 0, 1), rr_pts(0, 0, y1 - y0, z1 - z0, 0.18), 0.15))
    # the cargo hatch through the pot deck
    x0, x1, y0, y1 = HATCH; t = 0.10
    out.append((((x0 + x1) / 2, (y0 + y1) / 2, DK), (1, 0, 0), (0, 1, 0), rr_pts(0, 0, x1 - x0 - 2 * t, y1 - y0 - 2 * t, 0.06), 0.10))
    return out

def cut_holes(target, cuts):
    bm = bmesh.new()
    for o, u, v, poly, d in cuts:
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
    """the reveals of the holes (the side's thickness between the outside and the inside), the portholes' glass with the dark behind and
    their rings, the hawse pipes, the freeing ports' flaps, the scuppers"""
    for sg in (1, -1):
        for x0, x1 in OPEN_S:
            o = rr_pts((x0 + x1) / 2, sum(OPEN_Z) / 2, x1 - x0, OPEN_Z[1] - OPEN_Z[0], 0.40, 4)
            ring = [V((p, sg * (y_at(p, q, sg) + 0.001), q)) for p, q in o]
            tube(A, ring, (0, -sg, 0), TT + 0.004, C['white'])
            if fine:     # a half-round steel lip round the opening, painted with the hull (it reads as the opening's edge from afar)
                F.pipe(A, [V((p, sg * (y_at(p, q, sg) + 0.012), q)) for p, q in o + [o[0]]], 0.022, C['rubbar'], 8)
        if not fine: continue
        for x in PORTS:
            on = lambda p, q, dd: V((x + p, sg * (y_at(x + p, PORT_Z + q, sg) - dd), PORT_Z + q))
            tube(A, [on(p, q, 0.0) for p, q in circle(PORT_R, 20)], (0, -sg, 0), 0.12, C['white'])
            G.poly([on(p, q, 0.05) for p, q in circle(PORT_R, 20)], C['glass'], (0, sg, 0))
            A.poly([on(p, q, 0.12) for p, q in circle(PORT_R, 20)], C['cabin'], (0, sg, 0))
            F.atorus(A, (x, sg * (y_at(x, PORT_Z, sg) + 0.01), PORT_Z), (0, sg, 0), PORT_R + 0.025, 0.022, lambda a: C['steel'], seg=24, rseg=5)
        hx, hz = HAWSE; ring = [V((hx + p, sg * (y_at(hx + p, hz + q, sg) + 0.001), hz + q)) for p, q in circle(HAWSE_R, 20)]
        tube(A, ring, (-0.35, -sg, 0.60), 0.45, C['steel'], C['black'])
        F.atorus(A, (hx, sg * (y_at(hx, hz, sg) + 0.03), hz), (0, sg, 0), HAWSE_R + 0.05, 0.05, lambda a: C['steel'], seg=24, rseg=6)
        for xc in FREE:
            o = rr_pts(xc, DK + 0.02 + FREE_H / 2, FREE_W, FREE_H, 0.05, 3)
            tube(A, [V((p, sg * (y_at(p, q, sg) + 0.001), q)) for p, q in o], (0, -sg, 0), TT + 0.004, C['inner'])
            # the flap hung from its top edge outside, so the sea does not come in (SKR-11)
            obox(A, (xc, sg * (y_at(xc, DK + 0.20, sg) + 0.03), DK + 0.17), V((FREE_W / 2 - 0.03, 0, 0)), V((0, 0.012, 0)), V((0, 0, FREE_H / 2 - 0.02)), C['hull'])
            acyl(A, (xc - FREE_W / 2, sg * (y_at(xc, DK + 0.33, sg) + 0.04), DK + 0.34), (xc + FREE_W / 2, sg * (y_at(xc, DK + 0.33, sg) + 0.04), DK + 0.34), 0.02, lambda q: C['steel'], seg=8)
        for xc in SCUP:
            o = rr_pts(xc, DK + 0.10, 0.30, 0.16, 0.05, 3)
            tube(A, [V((p, sg * (y_at(p, q, sg) + 0.001), q)) for p, q in o], (0, -sg, 0), TT + 0.004, C['inner'])
    # the transom's openings: their reveals; the chute's port lined in stainless, worn by the pots
    for (y0, y1, z0, z1), r, m in ((STERN_O, 0.35, C['white']), (CHUTE_O, 0.18, C['inox'])):
        o = rr_pts((y0 + y1) / 2, (z0 + z1) / 2, y1 - y0, z1 - z0, r, 4)
        tube(A, [V((XA - 0.001, p, q)) for p, q in o], (1, 0, 0), TT + 0.004, m)
        if fine: F.pipe(A, [V((XA - 0.012, p, q)) for p, q in o + [o[0]]], 0.022, C['rubbar'], 8)
    # the cargo hatch's trunk down into the hold, dark at its bottom (H2d: the pallets come up through it)
    x0, x1, y0, y1 = HATCH; t = 0.10; o = rr_pts((x0 + x1) / 2, (y0 + y1) / 2, x1 - x0 - 2 * t, y1 - y0 - 2 * t, 0.06, 3)
    tube(A, [V((p, q, DK + 0.001)) for p, q in o], (0, 0, -1), 2.6, C['inner'], C['dark'])


# ---------- the work on the pot deck (kap. 19: the places first; GA 07.11.2026 scaled): the line comes in over the portal's block to the
# hauler at the starboard bulwark, the pot lands on the sorting table aft of it, is emptied, baited and goes aft on the conveyor along the
# starboard side to the stacks (twelve nested to a stack, the game draws them, kit.pots.at) and to the chute at the starboard quarter ----------
PORTAL = (23.55, 25.65)                  # the portal's two legs (x) at the starboard bulwark
PT_Z = DK + 5.25                         # the portal's top beam
BLOCK = (24.60, -6.45, PT_Z - 0.55)      # the block's sheave centre, outboard on the portal's arm
HAULER = (24.60, None, GW + 0.02)        # the hauler's foot on its pedestal inside the bulwark (y from the side; the game sets it there)
TABLE = (20.30, 23.40, -4.85, -2.95)     # the sorting table (x0, x1, y0, y1)
TABLE_Z = DK + 0.95
CONV_Y, CONV_W, CONV_Z = -4.30, 0.80, DK + 0.80      # the conveyor's middle, width and the belt's top
CONV_X = (1.75, 20.30)
CHUTE = ((CONV_X[0], CONV_Y, CONV_Z), (XA - 1.35, (CHUTE_O[0] + CHUTE_O[1]) / 2, DK - 0.35))   # the pot chute from the conveyor's end out over the stern
STACK_Y = [-2.55, -1.17, 1.18, 2.56, 3.94]
STACK_X = [1.65 + 1.38 * k for k in range(14)]
STAIR_SH = (17.95, 14.42, -0.40, 0.40)   # the stair from the pot deck up to the shelter (foot x, top x, y0, y1)
STAIR_FC = (24.90, 28.46, -2.30, -1.50)  # the stair up to the forecastle deck
RSW = [(25.45, 1.05), (26.85, 1.05)]     # the hatches over the RSW tanks (centres; 0.9 m square coamings)
FC_DOOR = (2.05, 2.85)                   # the door in the forecastle's bulkhead into the factory and the mess (y)
FC_WIN = [(-4.25, -3.15), (-0.55, 0.55)] # its windows (y)
CR_AX = (27.30, 3.80, DK + 3.60)         # the crane's slewing axis on its pedestal's top
CR_HEEL = (27.05, 3.80, DK + 4.45)       # the boom's heel pin on the head
CR_PARK = (15.65, 4.15, DK + 3.90)       # the boom's tip laid aft in its rest, over the stacks
CR_REST = (20.70, 4.25)                  # the boom rest's post
BEAMS_X = [1.65 + 0.69 + 1.38 * k for k in range(9)]     # the deck beams under the shelter, between the stacks' tops (the frame spacing 1.38 m)
def hauler_at(): return (HAULER[0], -(yin(HAULER[0], GW) - 0.42), HAULER[2])

def white_band(A, p0, p1, w, h, m1, m2, k=0.12):
    """a member from p0 to p1 with an ochre band at its top end (the portal's and the crane's markings)"""
    P0, P1 = V(p0), V(p1); m = P0 + (P1 - P0) * (1 - k)
    beam(A, P0, m, w, h, m1); beam(A, m, P1, w + 0.004, h + 0.004, m2)

def pot_deck(A, G, fine=True):
    s = lambda q: C['steel']; w = C['white']
    # ---- the shelter's underside: the deck beams across, the web frames down the sides, the work lights ----
    for x in (BEAMS_X if fine else []):
        e = yin(x, CEIL) - 0.01
        abox(A, x - 0.06, x + 0.06, -e, e, CEIL - 0.26, CEIL - 0.002, C['frameW'], skip=('+z',))
        for sg in (1, -1):
            if any(a - 0.2 < x < b + 0.2 for a, b in OPEN_S): continue
            yy = yin(x, (DK + CEIL) / 2)
            abox(A, x - 0.05, x + 0.05, sg * (yy - 0.24) if sg > 0 else -yy + 0.001, sg * yy - 0.001 if sg > 0 else -(yy - 0.24), DK, CEIL - 0.24, C['frameW'])
    if fine:
        for x in (3.0, 7.7, 12.3):
            for y in (-3.4, 0.0, 3.0): F.work_light(A, (x, y, CEIL - 0.002), (0, 0.15 * (1 if y < 0 else -1), -1), C['dark'], C['lens'])
    # ---- the open pot deck's bulwark: the stays inside, the rail on its cap ----
    for x in ([15.3 + 1.8 * k for k in range(7)] if fine else []):
        for sg in (1, -1):
            if sg < 0 and PORTAL[0] - 0.4 < x < PORTAL[1] + 0.4: continue
            if sg > 0 and CR_AX[0] - 0.8 < x < CR_AX[0] + 0.8: continue
            yi = yin(x, DK); yt = yin(x, GW - 0.05)
            A.poly([(x, sg * yi, DK), (x, sg * (yi - 0.55), DK), (x, sg * yt, GW - 0.06)], C['inner'], (1, 0, 0)); A.poly([(x + 0.012, sg * yi, DK), (x + 0.012, sg * yt, GW - 0.06), (x + 0.012, sg * (yi - 0.55), DK)], C['inner'], (-1, 0, 0))
    # ---- the portal: two legs at the starboard bulwark, the top beam, the arm out over the side with the block; ochre bands ----
    yl = -(yin(PORTAL[0], DK) - 0.22)
    for x in PORTAL:
        white_band(A, (x, yl, DK), (x, yl, PT_Z + 0.15), 0.32, 0.32, w, C['ochre'], k=0.10)
        abox(A, x - 0.26, x + 0.26, yl - 0.26, yl + 0.26, DK - 0.004, DK + 0.03, C['steel'])
    beam(A, (PORTAL[0] - 0.20, yl, PT_Z), (PORTAL[1] + 0.20, yl, PT_Z), 0.34, 0.36, C['ochre'])
    mx = (PORTAL[0] + PORTAL[1]) / 2
    beam(A, (mx, yl + 0.6, PT_Z), (mx, BLOCK[1] - 0.25, PT_Z), 0.30, 0.36, w)
    for x in (PORTAL if fine else ()): beam(A, (x, yl, PT_Z - 0.9), (mx, BLOCK[1] + 0.6, PT_Z - 0.05), 0.14, 0.14, w)   # the knees under the arm
    # the block: its cheeks hung from a swivel under the arm's end, the sheave (it is the ship's own: the hauler is the game's)
    if fine: acyl(A, (mx, BLOCK[1], PT_Z - 0.18), (mx, BLOCK[1], BLOCK[2] + 0.36), 0.06, s, seg=10)
    for sg in ((1, -1) if fine else ()): obox(A, (mx, BLOCK[1] + sg * 0.11, BLOCK[2]), V((0.36, 0, 0)), V((0, 0.02, 0)), V((0, 0, 0.36)), C['yellow'])
    acyl(A, (mx, BLOCK[1] - 0.09, BLOCK[2]), (mx, BLOCK[1] + 0.09, BLOCK[2]), 0.30, lambda q: C['steel'], seg=24 if fine else 6)
    if fine: acyl(A, (mx, BLOCK[1] - 0.14, BLOCK[2]), (mx, BLOCK[1] + 0.14, BLOCK[2]), 0.05, lambda q: C['dark'], seg=10)
    # the hauler's pedestal at the bulwark (the hauler on it is the game's, anchors.hauler) and the roller on the bulwark's cap the pots come over
    hx, hy, hz = hauler_at()
    abox(A, hx - 0.30, hx + 0.30, hy - 0.30, hy + 0.30, DK - 0.004, hz, C['white'])
    abox(A, hx - 0.36, hx + 0.36, hy - 0.36, hy + 0.36, hz - 0.03, hz, C['steel'])
    if fine:
        yo = -(ysh(hx) + 0.02); yi = -yin(hx, GW)
        F.hauling_roller(A, PORTAL[0] + 0.25, PORTAL[1] - 0.25, yo - 0.05, yi + 0.05, GW + 0.03, C['steel'], C['rubber'], R=0.10)
        # the bulwark's inside lined with a stainless plate where the pots come over
        A.poly([(PORTAL[0] + 0.2, yi + 0.006, GW - 0.9), (PORTAL[1] - 0.2, yi + 0.006, GW - 0.9), (PORTAL[1] - 0.2, yi + 0.006, GW - 0.02), (PORTAL[0] + 0.2, yi + 0.006, GW - 0.02)], C['inox'], (0, 1, 0))
        F.work_light(A, (PORTAL[0], yl + 0.18, PT_Z - 0.2), (0.2, -0.6, -1), C['dark'], C['lens'])
        F.work_light(A, (PORTAL[1], yl + 0.18, PT_Z - 0.2), (-0.2, -0.6, -1), C['dark'], C['lens'])
    # ---- the sorting table: a stainless top with its rim, the hole the keepers go down to the factory, the box for the discards' chute
    # over the side; its legs ----
    x0, x1, y0, y1 = TABLE; z = TABLE_Z
    abox(A, x0, x1, y0, y1, z - 0.06, z, C['inox'])
    for xa, xb, ya, yb in (((x0, x1, y0, y0 + 0.04), (x0, x1, y1 - 0.04, y1), (x1 - 0.04, x1, y0, y1)) if fine else ()):
        abox(A, xa, xb, ya, yb, z, z + 0.16, C['inox'])
    if fine:
        abox(A, x0 + 0.5, x0 + 1.1, y1 - 0.75, y1 - 0.12, z + 0.001, z + 0.004, C['black'])        # the hole to the factory
        abox(A, x0 + 0.42, x0 + 1.18, y1 - 0.83, y1 - 0.04, z, z + 0.08, C['inox'], skip=('+z', '-z'))
        for xx, yy in ((x0 + 0.08, y0 + 0.08), (x1 - 0.08, y0 + 0.08), (x0 + 0.08, y1 - 0.08), (x1 - 0.08, y1 - 0.08), ((x0 + x1) / 2, y0 + 0.08), ((x0 + x1) / 2, y1 - 0.08)):
            acyl(A, (xx, yy, DK - 0.004), (xx, yy, z - 0.06), 0.035, s, seg=8)
        # the discards' chute: from the table's outboard edge through the bulwark, sloping down outboard
        cx = x0 + 1.9; yb = -(yin(cx, DK + 0.6)); acyl(A, (cx, y0 + 0.05, z - 0.05), (cx, yb + 0.02, DK + 0.55), 0.16, lambda q: C['inox'], seg=12)
        F.pipe(A, [(x1 + 0.05, y1 + 0.25, z + 0.2), (x1 + 0.05, y1 + 0.25, DK + 1.75)], 0.03, C['hose'], 8)       # the hose for washing the table
    # ---- the conveyor: the belt between its side rails, the rollers at the ends, the frames and legs ----
    ya, yb = CONV_Y - CONV_W / 2, CONV_Y + CONV_W / 2; xa, xb = CONV_X; zb = CONV_Z
    n = 24 if fine else 3
    for k in range(n):
        p, q = xa + (xb - xa) * k / n, xa + (xb - xa) * (k + 1) / n
        A.poly([(p, ya + 0.05, zb), (q, ya + 0.05, zb), (q, yb - 0.05, zb), (p, yb - 0.05, zb)], C['belt'], (0, 0, 1))
    for yy, sg in ((ya, -1), (yb, 1)):
        abox(A, xa, xb, yy - 0.02 if sg < 0 else yy - 0.03, yy + 0.03 if sg < 0 else yy + 0.02, zb - 0.22, zb + 0.10, C['galv'])
    abox(A, xa, xb, ya + 0.05, yb - 0.05, zb - 0.20, zb - 0.002, C['galv'], skip=('+z',))
    if not fine:
        P0, P1 = V(CHUTE[0]), V(CHUTE[1]); A.poly([P0 - V((0, 0.45, 0)), P1 - V((0, 0.45, 0)), P1 + V((0, 0.45, 0)), P0 + V((0, 0.45, 0))], C['inox'], (0.3, 0, 1))
        for (fx, tx, y0, y1), z1 in ((STAIR_SH, SD), (STAIR_FC, SD)): beam(A, (fx, (y0 + y1) / 2, DK + 0.1), (tx, (y0 + y1) / 2, z1 - 0.05), y1 - y0, 0.2, C['galv'], up=(-1 if tx > fx else 1, 0, 1))
        x0, x1, y0, y1 = HATCH; abox(A, x0, x1, y0, y1, DK - 0.004, DK + HCH, C['white'])
        abox(A, CR_AX[0] - 0.5, CR_AX[0] + 0.5, CR_AX[1] - 0.5, CR_AX[1] + 0.5, DK - 0.004, CR_AX[2], C['white'])
        return
    for xx in (xa + 0.12, xb - 0.12): acyl(A, (xx, ya + 0.04, zb - 0.12), (xx, yb - 0.04, zb - 0.12), 0.12, lambda q: C['roller'], seg=14 if fine else 6)
    for xx in [xa + 0.4 + 1.5 * k for k in range(13) if xa + 0.4 + 1.5 * k < xb]:
        for yy in (ya + 0.08, yb - 0.08): abox(A, xx - 0.04, xx + 0.04, yy - 0.04, yy + 0.04, DK - 0.004, zb - 0.2, C['galv'])
    if fine:
        for xx in [xa + 0.3 + 0.5 * k for k in range(37) if xa + 0.3 + 0.5 * k < xb - 0.2]:
            abox(A, xx - 0.008, xx + 0.008, ya + 0.06, yb - 0.06, zb + 0.001, zb + 0.012, C['rubber'])   # the cleats on the belt
        abox(A, xa + 0.05, xa + 0.45, yb - 0.02, yb + 0.30, zb - 0.32, zb - 0.02, C['blue'])   # the drive at the after end
    # ---- the pot chute: from the conveyor's end down through the port in the transom and out over the stern, stainless, its cheeks ----
    P0, P1 = V(CHUTE[0]), V(CHUTE[1]); d = (P1 - P0).normalized(); sd_ = V((0, 1, 0)); up = sd_.cross(d).normalized()
    if up.z < 0: up = -up
    hw = (CHUTE_O[1] - CHUTE_O[0]) / 2 - 0.10
    A.poly([P0 - sd_ * hw, P1 - sd_ * hw, P1 + sd_ * hw, P0 + sd_ * hw], C['inox'], up)
    A.poly([P0 - sd_ * hw - up * 0.03, P0 + sd_ * hw - up * 0.03, P1 + sd_ * hw - up * 0.03, P1 - sd_ * hw - up * 0.03], C['inox'], -up)
    for sg in (1, -1):
        e = sd_ * (sg * hw); A.poly([P0 + e, P1 + e, P1 + e + up * 0.30, P0 + e + up * 0.30], C['inox'], sd_ * sg)
        A.poly([P0 + e + sd_ * (sg * 0.01), P0 + e + sd_ * (sg * 0.01) + up * 0.30, P1 + e + sd_ * (sg * 0.01) + up * 0.30, P1 + e + sd_ * (sg * 0.01)], C['inox'], -sd_ * sg)
    if fine:
        for t in (0.2, 0.5, 0.8): beam(A, P0 + (P1 - P0) * t - up * 0.03, P0 + (P1 - P0) * t - up * 0.03 - up * 0.001 + V((0, 0, -0.5 if t < 0.6 else -0.2)), 0.06, 0.06, C['inox'])
        acyl(A, P1 - sd_ * hw, P1 + sd_ * hw, 0.08, lambda q: C['roller'], seg=12)
    # ---- the stairs: up to the shelter (its top on the shelter's front edge) and up to the forecastle deck ----
    for (fx, tx, y0, y1), z1 in ((STAIR_SH, SD), (STAIR_FC, SD)):
        stair(A, fx, tx, y0, y1, DK, z1, fine)
    # ---- the cargo hatch's coaming on the pot deck (the lid is its own part, hatch_lid), the RSW tanks' small hatches ----
    x0, x1, y0, y1 = HATCH; t = 0.10
    for xa_, xb_, ya_, yb_ in ((x0, x1, y0, y0 + t), (x0, x1, y1 - t, y1), (x0, x0 + t, y0, y1), (x1 - t, x1, y0, y1)):
        abox(A, xa_, xb_, ya_, yb_, DK - 0.004, DK + HCH, C['white'])
    for xa_, xb_, ya_, yb_ in ((x0 - 0.03, x1 + 0.03, y0 - 0.03, y0 + t), (x0 - 0.03, x1 + 0.03, y1 - t, y1 + 0.03), (x0 - 0.03, x0 + t, y0, y1), (x1 - t, x1 + 0.03, y0, y1)):
        abox(A, xa_, xb_, ya_, yb_, DK + HCH - 0.03, DK + HCH, C['white'])
    if fine:
        for x in (x0 + 0.45, (x0 + x1) / 2, x1 - 0.45): abox(A, x - 0.08, x + 0.08, y1, y1 + 0.12, DK + HCH - 0.16, DK + HCH + 0.02, C['steel'])
        for x in (x0 + 0.6, x1 - 0.6): abox(A, x - 0.05, x + 0.05, y0 - 0.10, y0, DK + HCH - 0.20, DK + HCH - 0.02, C['steel'])
    for cx, cy in RSW:
        abox(A, cx - 0.45, cx + 0.45, cy - 0.45, cy + 0.45, DK - 0.004, DK + 0.38, C['white'])
        abox(A, cx - 0.49, cx + 0.49, cy - 0.49, cy + 0.49, DK + 0.38, DK + 0.46, C['white'])
        if fine:
            for k in range(3): abox(A, cx - 0.42 + 0.42 * k - 0.02, cx - 0.42 + 0.42 * k + 0.02, cy - 0.47, cy + 0.47, DK + 0.46, DK + 0.52, C['white'])
            F.atorus(A, (cx + 0.32, cy, DK + 0.53), (0, 1, 0), 0.06, 0.012, lambda a: C['steel'], seg=12, rseg=4)
            acyl(A, (cx - 0.49, cy - 0.3, DK + 0.42), (cx - 0.49, cy + 0.3, DK + 0.42), 0.03, lambda q: C['steel'], seg=8)
    # ---- the crane's pedestal and the boom rest (the head, the boom and the hook are parts: crane_parts) ----
    acyl(A, (CR_AX[0], CR_AX[1], DK - 0.004), (CR_AX[0], CR_AX[1], DK + 0.25), 0.62, lambda q: C['white'], seg=24 if fine else 8)
    acyl(A, (CR_AX[0], CR_AX[1], DK + 0.25), CR_AX, 0.46, lambda q: C['white'], seg=24 if fine else 8)
    acyl(A, (CR_AX[0], CR_AX[1], CR_AX[2] - 0.10), CR_AX, 0.55, lambda q: C['white'], seg=24 if fine else 8)
    if fine:
        F.ladder(A, (CR_AX[0] - 0.47, CR_AX[1], DK + 0.3), (CR_AX[0] - 0.47, CR_AX[1], CR_AX[2] - 0.2), 0.40, C['steel'], side=(0, 1, 0), away=(-1, 0, 0))
    yi = yin(CR_REST[0], DK)
    boom_rest(A, CR_HEEL, CR_PARK, 0.42, 0.50, CR_REST, DK, C['white'], C['rubber'],
              brace=(((CR_REST[0], yi, DK + 1.6), (0, -1, 0)), (CR_REST[0] + 0.9, CR_REST[1] - 0.6, DK)), strap=C['yellow'], fine=fine)
    # ---- the bitts and the fairleads on the pot deck; the bulkhead's door and windows ----
    if fine:
        for x, y in ((16.2, 4.75), (26.1, 4.6)): F.bitts(A, x, y, DK, C['steel'], h=0.45, r=0.10, gap=0.32)
    deck_bulkhead(A, G, fine)

def stair(A, fx, tx, y0, y1, z0, z1, fine=True):
    """a ship's stair (steep, treads between two stringers, handrails both sides) from (fx, z0) to (tx, z1) between y0 and y1"""
    s = lambda q: C['steel']; L = abs(tx - fx); nt = max(3, int((z1 - z0) / 0.24)); dirx = 1 if tx > fx else -1
    for k in range(1, nt + 1):
        xk = fx + dirx * L * k / (nt + 1); zk = z0 + (z1 - z0) * k / (nt + 1)
        abox(A, xk - 0.11, xk + 0.11, y0 + 0.05, y1 - 0.05, zk - 0.035, zk, C['galv'])
    for yy in (y0 + 0.025, y1 - 0.025):
        beam(A, (fx, yy, z0 + 0.10), (tx, yy, z1 - 0.05), 0.05, 0.22, C['galv'], up=(-dirx, 0, 1))
        if fine: F.pipe(A, [(fx, yy, z0 + 0.95), (tx, yy, z1 + 0.95)], 0.022, C['steel'], 8)
        if fine: acyl(A, (fx, yy, z0 + 0.10), (fx, yy, z0 + 0.95), 0.02, s, seg=8)

def deck_bulkhead(A, G, fine=True):
    """the forecastle's after bulkhead facing the pot deck: the door into the factory and the mess (hooked open: the game walks the crew
    through it), the windows of the factory, a ladder of rungs up the side of it beside the stair"""
    x = X_FC - 0.012; y0, y1 = FC_DOOR; zd = DK
    abox(A, x - 0.03, x, y0 - 0.06, y1 + 0.06, zd, zd + 2.06, C['frame'], skip=('+x',))
    A.poly([(x - 0.031, y0, zd + 0.01), (x - 0.031, y1, zd + 0.01), (x - 0.031, y1, zd + 2.0), (x - 0.031, y0, zd + 2.0)], C['cabin'], (-1, 0, 0))
    if fine:
        abox(A, x - 0.85, x - 0.80, y1 + 0.05, y1 + 0.10, zd + 0.04, zd + 1.98, C['white'])   # (the leaf hooked open against the bulkhead)
        abox(A, x - 0.83, x - 0.04, y1 + 0.06, y1 + 0.10, zd + 0.04, zd + 1.98, C['white'])
        G.poly([(x - 0.6, y1 + 0.101, zd + 1.4), (x - 0.25, y1 + 0.101, zd + 1.4), (x - 0.25, y1 + 0.101, zd + 1.8), (x - 0.6, y1 + 0.101, zd + 1.8)], C['glass'], (0, 1, 0))
    for a, b in FC_WIN:
        zw0, zw1 = DK + 1.20, DK + 1.95
        abox(A, x - 0.03, x, a - 0.05, b + 0.05, zw0 - 0.05, zw1 + 0.05, C['frame'], skip=('+x',))
        G.poly([(x - 0.032, a, zw0), (x - 0.032, b, zw0), (x - 0.032, b, zw1), (x - 0.032, a, zw1)], C['glass'], (-1, 0, 0))
    if fine:
        F.work_light(A, (x - 0.02, -3.7, SD - 0.25), (-1, 0, -0.6), C['dark'], C['lens'])
        F.work_light(A, (x - 0.02, 3.0, SD - 0.25), (-1, 0, -0.6), C['dark'], C['lens'])
        for y in (-0.9, 1.4): abox(A, x - 0.12, x - 0.02, y - 0.25, y + 0.25, DK + 2.3, DK + 2.6, C['white'])   # (the vents' louvre boxes)


# ---------- the shelter's top: the rails on its coaming, the funnel on the centreline with the after mast, the bollards and the
# fairleads, the stern light; the rescue boat and the rafts are the game's on their places (kit.mob, kit.raft) ----------
FUN = (8.90, 12.75, 1.25)                # the funnel casing (x0, x1, half width), raked aft
FUN_TOP = SD + 4.05
AMX = 12.35                              # the after mast's foot (on the centreline: the masthead lights stand over it, vedlegg I)
AM_TOP = 28.15                           # its top: the second masthead light 4.5 m over the forward one (2(a)(ii))
STERN_L = (XA + 0.30, 0.0, SD + COAM + 1.05)
RAIL_H = 1.00
def rail_line(A, pts, h=RAIL_H, every=1.6, base_z=None, fine=True, r=0.024, knee=0.5):
    """a pipe rail along pts (x, y, z of the foot), stanchions every so often, a top rail and a knee rail"""
    s = lambda q: C['steel']
    if not fine:
        F.pipe(A, [(x, y, z + h) for x, y, z in pts], r, C['steel'], 4); return
    Lc = [0.0]
    for a, b in zip(pts, pts[1:]): Lc.append(Lc[-1] + math.dist(a, b))
    n = max(1, int(Lc[-1] / every)); posts = []
    for k in range(n + 1):
        t = Lc[-1] * k / n
        for i in range(1, len(Lc)):
            if Lc[i] >= t - 1e-9:
                u = (t - Lc[i - 1]) / max(1e-9, Lc[i] - Lc[i - 1]); a, b = pts[i - 1], pts[i]; posts.append(tuple(a[j] + (b[j] - a[j]) * u for j in range(3))); break
    for x, y, z in posts:
        acyl(A, (x, y, z - 0.003), (x, y, z + 0.012), r + 0.012, s, seg=8); acyl(A, (x, y, z), (x, y, z + h), r * 0.9, s, seg=8)
    F.pipe(A, [(x, y, z + h) for x, y, z in pts], r, C['steel'], 8)
    if knee: F.pipe(A, [(x, y, z + knee) for x, y, z in pts], r * 0.75, C['steel'], 8)

def shelter_top(A, G, fine=True):
    s = lambda q: C['steel']; w = C['white']
    # the rails on the coaming along both sides and across the stern; across the front edge, open where the stair comes up
    for sg in ((1, -1) if fine else ()):
        pts = [(x, sg * (yin(x, SD + COAM) + 0.04), SD + COAM + 0.012) for x in [XA + 0.2 + 0.8 * k for k in range(18)] + [X_SH - 0.05]]
        rail_line(A, pts, fine=fine)
    yt = yin(0.2, SD + COAM) + 0.04
    if fine: rail_line(A, [(XA + 0.16, -yt, SD + COAM + 0.012), (XA + 0.16, yt, SD + COAM + 0.012)], fine=fine)
    for y0, y1 in () if not fine else ((STAIR_SH[3] + 0.05, yin(X_SH, SD) - 0.05), (-(yin(X_SH, SD) - 0.05), STAIR_SH[2] - 0.05)):
        rail_line(A, [(X_SH - 0.08, y0, sd_top(X_SH - 0.08, y0)), (X_SH - 0.08, y1, sd_top(X_SH - 0.08, y1))], every=1.4, fine=fine)
    # the funnel: a raked casing with rounded ends, cream with an ochre band and a black top, two exhausts with their rain caps
    x0, x1, hw = FUN; zt = FUN_TOP; rake = 0.45
    def fring(z, sh=0.0):
        k = (z - SD) / (zt - SD); xa_, xb_ = x0 + rake * k, x1 + rake * k * 0.6; h_ = hw - 0.05 * k + sh
        nr = 32 if fine else 10
        return [(xa_ + (xb_ - xa_) * 0.5 + (xb_ - xa_) * 0.5 * math.copysign(abs(math.cos(t)) ** 0.25, math.cos(t)), h_ * math.copysign(abs(math.sin(t)) ** 0.25, math.sin(t)), z) for t in [2 * math.pi * k_ / nr for k_ in range(nr)]]
    zs_ = [SD - 0.03, SD + 0.4, zt - 1.1, zt - 0.75, zt - 0.45, zt] if fine else [SD - 0.03, zt - 1.1, zt - 0.75, zt]
    F.loft(A, [fring(z) for z in zs_], (lambda i: C['ochre'] if i == 2 else C['black'] if i >= 3 else w) if fine else (lambda i: C['ochre'] if i == 1 else C['black'] if i == 2 else w), cap0=False, cap1=True,
           out=lambda mid, cc: V((mid.x - cc.x, mid.y - cc.y, 0)))
    for y in (-0.42, 0.42):
        ex = x0 + 1.3 + rake
        acyl(A, (ex, y, zt - 0.05), (ex - 0.05, y, zt + 0.75), 0.17, s, seg=14 if fine else 6)
        acyl(A, (ex - 0.05, y, zt + 0.75), (ex - 0.10, y, zt + 0.85), 0.19, lambda q: C['black'], seg=14 if fine else 6)
    if fine:
        F.ladder(A, (x0 + 0.02, 0.6, SD + 0.05), (x0 + rake * 0.9, 0.6, zt - 0.1), 0.40, C['steel'], side=(0, 1, 0), away=(-1, 0, 0))
        for y in (-0.9, 0.9): abox(A, x1 - 0.5, x1 + 0.05, y - 0.32, y + 0.32, SD + 1.1, SD + 1.7, w)   # (the engine room's air intakes)
        for y in (-0.9, 0.9):
            for k in range(5): abox(A, x1 + 0.051, x1 + 0.07, y - 0.28, y + 0.28, SD + 1.16 + 0.11 * k, SD + 1.20 + 0.11 * k, C['dark'])
    # the bollards aft, the panama fairleads in the coaming, the stern light's post, air pipes and a mushroom vent
    if fine:
        for x, y in ((1.15, 3.5), (1.15, -3.5), (13.2, 4.1), (13.2, -4.1)): F.bitts(A, x, y, sd_top(x, y), C['steel'], h=0.45, r=0.11, gap=0.34)
        for x, sg in ((0.7, 1), (0.7, -1), (12.6, 1), (12.6, -1)):
            yy = sg * (yin(x, SD + COAM) + 0.02); abox(A, x - 0.25, x + 0.25, yy - 0.06, yy + 0.06, SD + 0.02, SD + COAM + 0.10, C['steel'])
        for x, y in ((2.6, -2.2), (2.6, 2.2), (6.3, -1.0), (6.3, 1.0)):
            z0_ = sd_top(x, y); acyl(A, (x, y, z0_ - 0.004), (x, y, z0_ + 0.62), 0.07, s, seg=10); F.pipe(A, [(x, y, z0_ + 0.62), (x, y, z0_ + 0.72), (x + 0.12, y, z0_ + 0.74), (x + 0.18, y, z0_ + 0.66)], 0.07, C['steel'], 10)
        F.mushroom_vent(A, (7.4, 0.0, sd_top(7.4, 0)), C['white'], r=0.14, h=0.6)
    acyl(A, (STERN_L[0], 0, sd_top(STERN_L[0], 0) - 0.004), (STERN_L[0], 0, STERN_L[2] - 0.08), 0.05, s, seg=10)
    if fine: F.stern_lantern(A, STERN_L, (-1, 0, 0), C['lampW'], C['frame'])
    else: obox(A, STERN_L, V((0.04, 0, 0)), V((0, 0.04, 0)), V((0, 0, 0.04)), C['lampW'])
    # the flag staff at the stern, raked aft
    if fine: acyl(A, (0.35, 1.9, SD + COAM + 0.012), (0.10, 1.9, SD + COAM + 2.2), 0.03, lambda q: C['white'], seg=8)

def after_mast(A, fine=True):
    """the after mast on the funnel's fore end: the second masthead light on its top, the radar platform, the cross-tree with the
    antennas, a work light over the pot deck; stays to the funnel"""
    seg = 14 if fine else 6; m = C['mast']; s = lambda q: C['steel']; zb = FUN_TOP - 0.6; x = AMX
    acyl(A, (x, 0, zb), (x, 0, 22.0), 0.18, lambda q: m, seg=seg, r1=0.13)
    acyl(A, (x, 0, 22.0), (x, 0, AM_TOP - 0.06), 0.13, lambda q: m, seg=seg, r1=0.07)
    if fine: F.allround_lantern(A, (x, 0, AM_TOP), C['lampW'], C['frame'], R=0.07, H=0.14)
    else: acyl(A, (x, 0, AM_TOP - 0.06), (x, 0, AM_TOP + 0.08), 0.07, lambda q: C['lampW'], seg=6)
    abox(A, x - 0.03, x + 0.03, -1.6, 1.6, 24.6, 24.68, m)                 # the cross-tree
    if not fine: return
    abox(A, x - 0.55, x + 0.55, -0.55, 0.55, 19.30, 19.36, C['galv'])       # a platform with its rail
    F.pipe(A, [(x - 0.55, -0.55, 19.95), (x + 0.55, -0.55, 19.95), (x + 0.55, 0.55, 19.95), (x - 0.55, 0.55, 19.95), (x - 0.55, -0.55, 19.95)], 0.02, C['steel'], 6)
    for sy in (-1.5, 1.5): F.whip(A, (x, sy, 24.68), 2.2, C['white'], r0=0.02, r1=0.007, m_foot=C['steel'])
    F.gps(A, (x, 0.9, 24.68), C['white'], r=0.08, h=0.14, m_post=C['steel'])
    F.work_light(A, (x + 0.2, 0, 21.0), (1, 0, -1.2), C['dark'], C['lens'])
    F.work_light(A, (x - 0.2, 0, 21.0), (-1, 0, -1.6), C['dark'], C['lens'])
    for sy in (-1, 1): acyl(A, (x, 0, 23.5), (FUN[0] + 0.6, sy * 1.0, FUN_TOP - 0.3), 0.012, lambda q: C['dark'], seg=4)


# ---------- the forecastle: the house (tier A) on its deck, the wheelhouse on the house's top with windows all round and its wings ----------
TA_X = (30.00, 43.00)                    # the house's aft wall and its front
TA = 15.00                               # the house's top (its roof's underside); the roof 8 cm, the wheelhouse's floor on it
WF = TA + 0.08
WX0 = 35.60                              # the wheelhouse's aft wall
WS, WH, WR = WF + 0.95, WF + 2.30, WF + 2.70           # the window band's sill and head, the roof's underside
LEAN = 0.30                              # the front leans out this much from the sill to the roof
WT = 0.07
WING = (40.05, 41.65, 5.45)              # the bridge wings (x from, to; how far out)
def ta_w(x): return min(4.35, yin(x, z_sd(x) + 0.5) - 1.00)
def ta_plan():
    """the house's plan, counter-clockwise from above: along the starboard side forward, the rounded front, aft along the port side,
    across the aft wall"""
    xs = [TA_X[0] + 0.0, 31.5, 33.0, 34.5, 36.0, 37.5, 39.0, 40.5, 41.6]
    P = [(x, -ta_w(x)) for x in xs] + [(42.45, -2.95), (42.85, -1.70), (43.0, 0.0), (42.85, 1.70), (42.45, 2.95)] + [(x, ta_w(x)) for x in reversed(xs)]
    return P + [(TA_X[0], ta_w(TA_X[0]) - 2 * ta_w(TA_X[0]) * k / 8) for k in range(1, 8)]
def ta_foot(x, y): return z_sd(x) + camber(x, y) - 0.02
TA_WIN_X = [31.0, 32.6, 34.2, 35.8, 37.4, 39.0, 40.6]  # the windows along the house's sides (their middles)
TA_WIN_Z = (TA - 1.62, TA - 0.95)
TA_DOOR = (-1.70, -0.90)                  # the door in the house's aft wall (y), onto the forecastle deck
def wy(x): return 4.10 if x >= 36.0 else 3.60 + 0.5 * (x - WX0) / 0.40
def wh_plan():
    """the wheelhouse's plan, counter-clockwise from above, (x, y, front) with front 1 for the points the lean moves"""
    P = [(WX0, -3.60, 0), (36.0, -4.10, 0), (37.4, -4.10, 0), (38.8, -4.10, 0), (40.05, -4.10, 0), (41.65, -4.10, 1), (42.45, -2.75, 1), (42.85, -1.25, 1),
         (42.85, 1.25, 1), (42.45, 2.75, 1), (41.65, 4.10, 1), (40.05, 4.10, 0), (38.8, 4.10, 0), (37.4, 4.10, 0), (36.0, 4.10, 0), (WX0, 3.60, 0)]
    return P + [(WX0, 3.60 - 7.2 * k / 8, 0) for k in range(1, 8)]
def lean_at(z): return LEAN * max(0.0, z - WS) / (WR - WS)
def wh_crown(x, y): return WR + 0.14 + 0.06 * (1 - min(1.0, (y / 4.3) ** 2))
def wh_ring(z): return [(x + (lean_at(z) if fr else 0.0), y, z) for x, y, fr in wh_plan()]

def walls(name, rings, mat_out, t, cuts, objs):
    """a house's walls lofted through the rings (open top and bottom), made t thick inward, the cutters taken out"""
    sh = loft_rings(name, rings, mat_out, cap0=False, cap1=False, angle=25)
    sh.data.materials.append(C['inner']); solidify(sh, t, 1); apply_all(sh)
    if cuts: cut(sh, cuts)
    objs.append(sh); return sh

def win(objs, glass, name, o, u, v, poly, n, fine, frame=0.03):
    """a window: its cutter, the black frame round it a little proud, the glass a little in"""
    if fine:
        cx = sum(p[0] for p in poly) / len(poly); cy = sum(p[1] for p in poly) / len(poly)
        outer = [(p[0] + (frame if p[0] > cx else -frame), p[1] + (frame if p[1] > cy else -frame)) for p in poly]
        objs.append(frame_ring('wf_' + name, V(o) + V(n) * 0.006, u, v, outer, poly, C['frame'], 0.0, 0.02, nrm=n))
        glass.append(plate('wg_' + name, V(o) - V(n) * 0.035, u, v, poly, C['glass'], nrm=n))
        return plate_cutter('wc_' + name, o, u, v, poly, 0.45)
    us = [q[0] for q in poly]; ws = [q[1] for q in poly]
    objs.append(plate('wd_' + name, V(o) + V(n) * 0.01, u, v, [(min(us), min(ws)), (max(us), min(ws)), (max(us), max(ws)), (min(us), max(ws))], C['dark'], nrm=n))
    return None

def house(fine=True):
    """tier A: the mess, the galley and the cabins on the forecastle deck; its windows, the door aft, the roof (the boat deck) with its
    rail, the stair up to it from the forecastle deck to port"""
    objs = []; glass = []; A = Acc('ta_fit'); cuts = []
    P = ta_plan(); foot = [(x, y, ta_foot(x, y)) for x, y in P]; top = [(x, y, TA) for x, y in P]
    mid = [(x, y, TA_WIN_Z[0] - 0.3) for x, y in P]
    for sg in (1, -1):
        for k, xc in enumerate(TA_WIN_X):
            y = sg * ta_w(xc); t = (ta_w(xc + 0.05) - ta_w(xc - 0.05)) / 0.10; u = V((1, sg * t, 0)).normalized()
            c = win(objs, glass, 'ta%d%d' % (k, sg > 0), (xc, y, 0), u, (0, 0, 1), rr_pts(0.0, sum(TA_WIN_Z) / 2, 0.85, TA_WIN_Z[1] - TA_WIN_Z[0], 0.10, 3), V((-sg * t, sg, 0)).normalized(), fine)
            if c: cuts.append(c)
    # the front: three windows in the middle facets
    for k, (a, b) in enumerate(((P[10], P[11]), (P[11], P[12]), (P[12], P[13]))):
        u = V((b[0] - a[0], b[1] - a[1], 0)); Lf = u.length; m_ = ((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, 0); n = V((u.y, -u.x, 0)).normalized()
        if n.x < 0: n = -n
        c = win(objs, glass, 'taf%d' % k, m_, u, (0, 0, 1), rr_pts(0.0, sum(TA_WIN_Z) / 2, Lf - 0.5, TA_WIN_Z[1] - TA_WIN_Z[0], 0.10, 3), n, fine)
        if c: cuts.append(c)
    # the aft wall: two windows and the door
    for k, yc in enumerate((-3.0, 2.2)):
        c = win(objs, glass, 'taa%d' % k, (TA_X[0], yc, 0), (0, 1, 0), (0, 0, 1), rr_pts(0.0, sum(TA_WIN_Z) / 2, 0.85, TA_WIN_Z[1] - TA_WIN_Z[0], 0.10, 3), V((-1, 0, 0)), fine)
        if c: cuts.append(c)
    y0, y1 = TA_DOOR; zd0 = ta_foot(TA_X[0], (y0 + y1) / 2)
    if fine: cuts.append(plate_cutter('tc_door', (TA_X[0], (y0 + y1) / 2, 0), (0, 1, 0), (0, 0, 1), rr_pts(0, zd0 + 1.0, y1 - y0, 2.0, 0.06, 3), 0.35))
    walls('house', [foot, mid, top], C['white'], 0.06, cuts, objs)
    if fine:
        x = TA_X[0]; z1 = zd0 + 2.0
        A.poly([(x - 0.01, y0, zd0), (x - 0.01, y1, zd0), (x - 0.01, y1, z1), (x - 0.01, y0, z1)], C['cabin'], (-1, 0, 0))
        abox(A, x - 0.05, x - 0.01, y0 - 0.05, y0, zd0, z1 + 0.05, C['frame']); abox(A, x - 0.05, x - 0.01, y1, y1 + 0.05, zd0, z1 + 0.05, C['frame']); abox(A, x - 0.05, x - 0.01, y0 - 0.05, y1 + 0.05, z1, z1 + 0.05, C['frame'])
        # (the leaf hooked open to starboard against the wall)
        abox(A, x - 0.83, x - 0.06, y0 - 0.12, y0 - 0.07, zd0 + 0.03, z1 - 0.02, C['white'])
        glass.append(plate('ta_doorglass', (x - 0.45, y0 - 0.121, 0), (1, 0, 0), (0, 0, 1), rr_pts(0, z1 - 0.45, 0.4, 0.45, 0.06, 3), C['glass'], nrm=(0, -1, 0)))
    # the roof: its slab with a lip all round, the rail round its after part (the boat deck), open where the stair comes up
    R0 = [(x, y) for x, y in P]
    zt = TA + 0.08
    F.loft(A, [[(x, y, TA) for x, y in R0], [(x, y, zt) for x, y in R0]], lambda i: C['white'], cap0=True, cap1=False, out=lambda mid_, cc: V((mid_.x - cc.x, mid_.y - cc.y, 0)))
    # the roof's top in a grid (kap. 19), lower where the wheelhouse stands on it
    nx_, ny_ = (12, 10) if fine else (1, 1)
    xs_ = [TA_X[0] + (42.40 - TA_X[0]) * i / nx_ for i in range(nx_ + 1)]
    for a, b in zip(xs_, xs_[1:]):
        wa, wb = ta_w(min(a, 41.6)), ta_w(min(b, 41.6))
        if b > 41.6: wa, wb = min(wa, 4.2 - (a - 41.6) * 1.5), min(wb, 4.2 - (b - 41.6) * 1.5)
        for j in range(ny_):
            A.poly([(a, -wa + 2 * wa * j / ny_, zt), (b, -wb + 2 * wb * j / ny_, zt), (b, -wb + 2 * wb * (j + 1) / ny_, zt), (a, -wa + 2 * wa * (j + 1) / ny_, zt)], C['roof'], (0, 0, 1))
    tipP = [p for p in R0 if p[0] > 42.4]
    A.poly([(42.40, -min(ta_w(41.6), 4.2 - 0.8 * 1.5), zt)] + [(x, y, zt) for x, y in tipP] + [(42.40, min(ta_w(41.6), 4.2 - 0.8 * 1.5), zt)], C['roof'], (0, 0, 1))
    if fine:
        for sg in (1, -1):
            pts = [(TA_X[0] + 0.1, sg * 1.2, zt), (TA_X[0] + 0.1, sg * (ta_w(TA_X[0]) - 0.08), zt), (WX0 - 0.15, sg * (ta_w(WX0) - 0.08), zt)]
            if sg > 0: pts = [(TA_X[0] + 0.1, 1.2, zt), (TA_X[0] + 0.1, 2.9, zt)]
            rail_line(A, pts, every=1.2, fine=fine)
        rail_line(A, [(TA_X[0] + 0.9, 4.0, zt), (WX0 - 0.15, ta_w(WX0) - 0.08, zt)], every=1.2, fine=fine)
        rail_line(A, [(TA_X[0] + 0.1, -1.2, zt), (TA_X[0] + 0.1, 1.2, zt)], every=1.2, fine=fine)
        # the stair from the forecastle deck to the boat deck along the house's aft wall, rising to port
        x0, x1 = TA_X[0] - 0.95, TA_X[0] - 0.12; zb = ta_foot(TA_X[0], 2.0)
        nt = 11
        for k in range(1, nt + 1):
            yk = 0.75 + (3.95 - 0.75) * k / (nt + 1); zk = zb + (zt - zb) * k / (nt + 1)
            abox(A, x0 + 0.05, x1 - 0.05, yk - 0.11, yk + 0.11, zk - 0.035, zk, C['galv'])
        for xx in (x0 + 0.025, x1 - 0.025):
            beam(A, (xx, 0.75, zb + 0.10), (xx, 3.95, zt - 0.05), 0.05, 0.22, C['galv'], up=(0, -1, 1))
        F.pipe(A, [(x0 + 0.025, 0.75, zb + 0.95), (x0 + 0.025, 3.95, zt + 0.95), (x0 + 0.025, 4.3, zt + 0.95)], 0.022, C['steel'], 8)
        # the house's details: the vents and the galley's exhaust on the roof, the work lights under its edge, the name board's bracket
        for y in (-2.6, 2.6): F.mushroom_vent(A, (31.2, y, zt), C['white'], r=0.12, h=0.5)
        acyl(A, (32.4, -3.2, zt), (32.4, -3.2, zt + 1.1), 0.09, lambda q: C['steel'], seg=10)
        acyl(A, (32.4, -3.2, zt + 1.1), (32.3, -3.2, zt + 1.22), 0.12, lambda q: C['black'], seg=10)
        F.work_light(A, (TA_X[0] - 0.02, -3.2, TA - 0.08), (-1, 0, -0.5), C['dark'], C['lens'])
        F.work_light(A, (TA_X[0] - 0.02, 3.2, TA - 0.08), (-1, 0, -0.5), C['dark'], C['lens'])
        for sg in (1, -1): F.work_light(A, (42.2, sg * 2.9, TA - 0.05), (1, sg * 0.3, -0.5), C['dark'], C['lens'])
    objs.append(A.done(35, tint=wear))
    return objs, glass


def wh_panes():
    """(name, origin, u, v, panes) for the windows round the wheelhouse in the dark band: two in the front's middle, one in each of the
    facets round the corners, three and the wing door's pane down each side, six across the aft wall over the deck (the pots are worked
    from there), the door in its middle"""
    vl = (LEAN / (WR - WS), 0, 1.0); vlen = math.hypot(vl[0], 1.0); s = lambda z: (z - WS) * vlen
    wz = (s(WS + 0.04) + s(WH - 0.04)) / 2; wh_ = s(WH - 0.04) - s(WS + 0.04); out = []
    P = wh_plan()
    for k, (i, j) in enumerate(((5, 6), (6, 7), (7, 8), (8, 9), (9, 10))):
        a, b = P[i], P[j]; u = (b[0] - a[0], b[1] - a[1], 0); Lf = math.hypot(u[0], u[1]); mid = ((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, WS)
        panes = [rrect(0.0, wz, Lf - 0.12, wh_, 0.04, 3)] if k != 2 else [rrect(-(Lf / 4 + 0.015), wz, Lf / 2 - 0.09, wh_, 0.04, 3), rrect(Lf / 4 + 0.015, wz, Lf / 2 - 0.09, wh_, 0.04, 3)]
        out.append(('f%d' % k, mid, u, vl, panes))
    zc = (WS + WH) / 2; hz = WH - WS - 0.08
    for sg in (1, -1):
        y = sg * 4.10
        out.append(('s%d' % (sg > 0), (0, y, 0), (1, 0, 0), (0, 0, 1), [rrect(x, zc, 1.0, hz, 0.04, 3) for x in (36.85, 37.95, 39.05)] + [rrect(41.15, zc, 0.62, hz, 0.04, 3)]))
    out.append(('a', (WX0, 0, 0), (0, 1, 0), (0, 0, 1), [rrect(y, zc, 0.86, hz, 0.04, 3) for y in (-2.95, -1.97, -0.99, 0.99, 1.97, 2.95)]))
    return out
WDOOR = (-0.40, 0.40)                    # the wheelhouse's aft door (y), onto the boat deck
WSDOOR = (40.15, 40.85)                  # the wing doors (x)

def wheelhouse(fine=True):
    objs = []; glass = []; A = Acc('wh_fit'); cuts = []
    def nrm_of(nm, u, vv):
        n = V(u).normalized().cross(V(vv).normalized()).normalized()
        if nm == 's1': return V((0, 1, 0))
        if nm == 's0': return V((0, -1, 0))
        if nm == 'a': return V((-1, 0, 0))
        return n if n.x > 0 else -n
    for nm, o, u, v, panes in wh_panes():
        vv = V(v).normalized(); n = nrm_of(nm, u, vv)
        for k, poly in enumerate(panes):
            c = win(objs, glass, 'wh%s%d' % (nm, k), o, u, vv, poly, n, fine, frame=0.02)
            if c: cuts.append(c)
    if fine:
        cuts.append(plate_cutter('wc_door', (WX0, 0, 0), (0, 1, 0), (0, 0, 1), rr_pts(sum(WDOOR) / 2, WF + 0.98, WDOOR[1] - WDOOR[0], 1.96, 0.06, 3), 0.35))
        for sg in (1, -1): cuts.append(plate_cutter('wc_sd%d' % (sg > 0), (0, sg * 4.10, 0), (1, 0, 0), (0, 0, 1), rr_pts(sum(WSDOOR) / 2, WF + 0.98, WSDOOR[1] - WSDOOR[0], 1.96, 0.06, 3), 0.35))
    shell = walls('wheelhouse', [wh_ring(WF - 0.01), wh_ring(WS), wh_ring(WR)], C['white'], WT, cuts, objs)
    # the window band dark all round, the panes in it and the mullions between them black (kyst15.py)
    me = shell.data
    if 'frame' not in [m.name for m in me.materials]: me.materials.append(C['frame'])
    fi = [m.name for m in me.materials].index('frame'); wi = [m.name for m in me.materials].index(C['white'].name)
    bm = bmesh.new(); bm.from_mesh(me)
    bmesh.ops.bisect_plane(bm, geom=bm.verts[:] + bm.edges[:] + bm.faces[:], dist=1e-5, plane_co=(0, 0, WS - 0.05), plane_no=(0, 0, 1))
    bmesh.ops.bisect_plane(bm, geom=bm.verts[:] + bm.edges[:] + bm.faces[:], dist=1e-5, plane_co=(0, 0, WH + 0.05), plane_no=(0, 0, 1))
    for f in bm.faces:
        if f.material_index == wi and WS - 0.05 < f.calc_center_median().z < WH + 0.05: f.material_index = fi
    bm.to_mesh(me); bm.free()
    if fine:
        # the doors: the aft one hooked open to starboard, the wing doors shut (white leaves with a pane), their frames
        y0, y1 = WDOOR; x = WX0; z1 = WF + 1.96
        A.poly([(x + WT + 0.01, y0, WF), (x + WT + 0.01, y1, WF), (x + WT + 0.01, y1, z1), (x + WT + 0.01, y0, z1)], C['cabin'], (-1, 0, 0))
        abox(A, x - 0.80, x - 0.04, y0 - 0.10, y0 - 0.05, WF + 0.03, z1 - 0.02, C['white'])
        glass.append(plate('wh_doorglass', (x - 0.42, y0 - 0.101, 0), (1, 0, 0), (0, 0, 1), rr_pts(0, z1 - 0.45, 0.42, 0.45, 0.06, 3), C['glass'], nrm=(0, -1, 0)))
        for sg in (1, -1):
            a, b = WSDOOR; yy = sg * (4.10 - 0.02)
            abox(A, a + 0.01, b - 0.01, min(yy, yy - sg * 0.04), max(yy, yy - sg * 0.04), WF + 0.03, z1 - 0.02, C['roof'])
            glass.append(plate('wh_sdglass%d' % (sg > 0), ((a + b) / 2, yy + sg * 0.002, 0), (1, 0, 0), (0, 0, 1), rr_pts(0, z1 - 0.48, 0.42, 0.50, 0.06, 3), C['glass'], nrm=(0, sg, 0)))
            acyl(A, (b - 0.08, yy, WF + 1.0), (b - 0.08, yy + sg * 0.06, WF + 1.0), 0.014, lambda q: C['steel'], seg=8)
    # the floor inside (the boat deck's grid runs under it), the lining under the band
    nX = 8 if fine else 1
    for i in range(nX):
        xa_, xb_ = WX0 + 0.08 + (41.6 - WX0 - 0.08) * i / nX, WX0 + 0.08 + (41.6 - WX0 - 0.08) * (i + 1) / nX
        A.poly([(xa_, -3.95, WF + 0.003), (xb_, -3.95, WF + 0.003), (xb_, 3.95, WF + 0.003), (xa_, 3.95, WF + 0.003)], C['sole'], (0, 0, 1))
    A.poly([(41.6, -3.95, WF + 0.003), (42.35, -2.65, WF + 0.003), (42.75, -1.2, WF + 0.003), (42.75, 1.2, WF + 0.003), (42.35, 2.65, WF + 0.003), (41.6, 3.95, WF + 0.003)], C['sole'], (0, 0, 1))
    # the roof: its underside, a lip all round with a drip edge, the visor over the front, the crown (in a grid), the rail round its top
    R_ = wh_ring(WR); ring = offset_poly([(R_[i][0], R_[i][1]) for i in (0, 1, 5, 6, 7, 8, 9, 10, 14, 15)], 0.14)
    ring = [(x + (0.25 if x > 41.5 else 0.0), y) for x, y in ring]       # (the visor over the front panes)
    A.poly([(x, y, WR + 0.001) for x, y in ring], C['inner'], (0, 0, -1))
    crown = wh_crown
    ri = offset_poly(ring, -0.18)
    for i in range(len(ring)):
        a, b = ring[i], ring[(i + 1) % len(ring)]; c, d = ri[(i + 1) % len(ri)], ri[i]; nrm = (b[1] - a[1], -(b[0] - a[0]), 0)
        A.poly([(a[0], a[1], WR), (b[0], b[1], WR), (b[0], b[1], WR + 0.12), (a[0], a[1], WR + 0.12)], C['white'], nrm)
        A.poly([(a[0], a[1], WR + 0.12), (b[0], b[1], WR + 0.12), (c[0], c[1], crown(*c)), (d[0], d[1], crown(*d))], C['roof'], (0, 0, 1))
        A.poly([(a[0], a[1], WR - 0.001), (b[0], b[1], WR - 0.001), (b[0], b[1], WR - 0.03), (a[0], a[1], WR - 0.03)], C['frame'], nrm)
    xr0, xr1 = WX0 + 0.20, 41.5; NXR, NYR = (12, 10) if fine else (1, 1); yr = 3.8
    for i in range(NXR):
        xa_, xb_ = xr0 + (xr1 - xr0) * i / NXR, xr0 + (xr1 - xr0) * (i + 1) / NXR
        for j in range(NYR):
            P4 = [(xa_, -yr + 2 * yr * j / NYR), (xb_, -yr + 2 * yr * j / NYR), (xb_, -yr + 2 * yr * (j + 1) / NYR), (xa_, -yr + 2 * yr * (j + 1) / NYR)]
            A.poly([(x, y, crown(x, y) + 0.004) for x, y in P4], C['roof'], (0, 0, 1))
    tip = [p for p in ri if p[0] > xr1 + 0.05]
    if tip: A.poly([(xr1, -yr, crown(xr1, yr) + 0.004)] + [(x, y, crown(x, y) + 0.004) for x, y in sorted(tip, key=lambda p: p[1])] + [(xr1, yr, crown(xr1, yr) + 0.004)], C['roof'], (0, 0, 1))
    # the wings: the floor, a solid bulwark round them with its cap, the brackets under them; the sidelights on their fore ends
    a, b, out = WING
    for sg in (1, -1):
        y0 = sg * 4.08; y1 = sg * out
        A.poly([(a, y0, WF), (b, y0, WF), (b, y1, WF), (a, y1, WF)], C['sole'], (0, 0, 1))
        A.poly([(a, y0, WF - 0.12), (a, y1, WF - 0.12), (b, y1, WF - 0.12), (b, y0, WF - 0.12)], C['white'], (0, 0, -1))
        for xa_, xb_, ya_, yb_ in ((a, b, y1 - sg * 0.05, y1), (a, a + 0.05, y0, y1), (b - 0.05, b, y0, y1)):
            abox(A, xa_, xb_, min(ya_, yb_), max(ya_, yb_), WF - 0.12, WF + 1.05, C['white'])
        abox(A, a - 0.02, b + 0.02, min(y1 - sg * 0.07, y1 + sg * 0.02), max(y1 - sg * 0.07, y1 + sg * 0.02), WF + 1.05, WF + 1.09, C['cap'])
        for x in ((a + 0.3, b - 0.3) if fine else ()): beam(A, (x, sg * ta_w(x), TA - 1.2), (x, sg * (out - 0.2), WF - 0.12), 0.12, 0.12, C['white'])
        if fine:
            # the wing's console: a small one at the fore end, looking down the side at the hauling station
            abox(A, b - 0.45, b - 0.06, sg * (out - 0.95) if sg > 0 else -(out - 0.12), sg * (out - 0.12) if sg > 0 else -(out - 0.95), WF, WF + 1.0, C['white'])
            obox(A, (b - 0.30, sg * (out - 0.54), WF + 1.02), V((0.12, 0, -0.04)), V((0, 0.36, 0)), V((0.01, 0, 0.03)), C['board'])
    objs.append(A.done(35, tint=wear))
    return objs, glass, crown


# the helm across under the front panes: the console with its dash sloping up forward, the radars, the plotter, the sonar and the sounder,
# the engines' panel; the wheel and the levers in the middle, the skipper's chair; the aft console under the aft panes for the hauling
DASH = (41.95, 42.35); DASHZ = (0.92, 1.06)
SKIP = (41.10, -0.80); SEAT = (40.65, -0.80)
EYE_H = 1.65
HP, FOV = -0.30, 60
def dz(z): return WF + z
def dash_pt(t, y): return V((DASH[0] + (DASH[1] - DASH[0]) * t, y, dz(DASHZ[0] + (DASHZ[1] - DASHZ[0]) * t)))
def dash_n(): return V((-(DASHZ[1] - DASHZ[0]), 0, DASH[1] - DASH[0])).normalized()
SCR = {'radar': (-2.40, -1.75, 0.12, 0.90), 'plot': (-1.60, -0.95, 0.12, 0.90), 'sound': (0.55, 1.10, 0.12, 0.90), 'radar2': (1.25, 1.90, 0.12, 0.90), 'eng': (2.05, 2.55, 0.15, 0.85)}
HELM_EXTRA = []
def helm(A, G, fine=True):
    w = C['inner']; z0 = WF; x0, x1 = DASH; dz0, dz1 = dz(DASHZ[0]), dz(DASHZ[1]); xw = 42.55; Y0, Y1 = -2.65, 2.65
    A.poly([(x0, Y0, z0), (x0, Y1, z0), (x0, Y1, dz0), (x0, Y0, dz0)], w, (-1, 0, 0))
    A.poly([(x0, Y0, dz0), (x0, Y1, dz0), (x1, Y1, dz1), (x1, Y0, dz1)], C['board'], dash_n())
    for y, sg in ((Y0, -1), (Y1, 1)): A.poly([(x0, y, z0), (xw, y, z0), (xw, y, dz1), (x1, y, dz1), (x0, y, dz0)], w, (0, sg, 0))
    A.poly([(x1, Y0, dz1), (x1, Y1, dz1), (xw, Y1, dz1), (xw, Y0, dz1)], w, (0, 0, 1))
    if not fine: return
    n = dash_n()
    for nm, (ya, yb_, ta, tb) in SCR.items():
        q = [dash_pt(ta, ya), dash_pt(ta, yb_), dash_pt(tb, yb_), dash_pt(tb, ya)]; c = sum(q, V()) / 4
        F.loft(A, [[p + n * 0.002 for p in q], [p + n * 0.014 for p in q]], lambda i: C['bezel'], cap0=False, cap1=False)
        A.poly([p + n * 0.014 for p in q], C['bezel'], n)
        A.poly([c + (p - c) * 0.88 + n * 0.0145 for p in q], C['scr_radar' if nm.startswith('radar') else 'scr_' + nm], n)
        if nm == 'plot': A.poly([c + (p - c) * 0.40 + (q[2] - q[1]) * 0.18 + n * 0.0150 for p in q], C['scr_land'], n)
        if nm == 'sound': A.poly([c + (p - c) * V((0.80, 0.80, 0.80)) - (q[2] - q[1]) * 0.30 + n * 0.0150 for p in q], C['scr_bottom'], n)
    # the small wheel, the autopilot, the levers for the propeller's pitch and the thrusters, the compass
    wc = (41.82, -0.80, dz(0.98))
    F.helm_wheel(A, wc, (-1.0, 0.0, 0.55), 0.18, C['cush'], C['steel'], C['dark'])
    acyl(A, V(wc) - V((-1.0, 0.0, 0.55)).normalized() * 0.12, (x0 + 0.004, -0.80, wc[2] + 0.02), 0.03, lambda q: C['dark'], seg=10)
    for y in (-0.30, 0.0, 0.30): F.single_lever(A, (x0 + 0.10, y, dz(0.90)), (0, 1, 0), (1, 0, 0), C['dark'], C['steel'], C['black'])
    cb = dash_pt(0.9, -0.80) + V((0, 0, -0.005)); acyl(A, cb, cb + V((0, 0, 0.05)), 0.07, lambda q: C['dark'], seg=16)
    HELM_EXTRA.append(sphere('compass', cb + V((0, 0, 0.085)), 0.06, C['glass'], (1, 1, 0.7)))
    vc = V((40.6, -2.6, WR - 0.06)); obox(A, vc, V((0.09, 0, 0)), V((0, 0.12, 0)), V((0, 0, 0.05)), C['dark'])
    F.helm_seat(A, (SEAT[0], SEAT[1], z0), (1, 0, 0), 0.85, C['steel'], C['cush'])
    F.helm_seat(A, (SEAT[0], 1.20, z0), (1, 0, 0), 0.85, C['steel'], C['cush'])
    # the aft console under the aft panes: the hauling's screens and the crane's and the hauler's controls
    xa = WX0 + WT + 0.02
    abox(A, xa, xa + 0.55, -2.4, 2.4, z0, dz(0.90), w)
    for y in (-1.6, -0.4, 0.8): obox(A, (xa + 0.30, y, dz(0.92)), V((0.18, 0, 0.06)), V((0, 0.26, 0)), V((-0.02, 0, 0.05)), C['bezel'])
    # the chart table to port along the side, a bench aft of it
    abox(A, 39.2, 40.0, 3.30, 4.02, z0, z0 + 0.92, w); abox(A, 39.18, 40.02, 3.28, 4.02, z0 + 0.92, z0 + 0.95, C['wood'])
    abox(A, 37.2, 38.9, 3.45, 4.02, z0, z0 + 0.45, w); abox(A, 37.22, 38.88, 3.47, 4.0, z0 + 0.45, z0 + 0.53, C['cush'])


# ---------- the foremast on the wheelhouse roof and the lanterns (FOR-1975-12-01-5 vedlegg I, checked in check()) ----------
FMX = 38.60                              # the foremast (11.4 m from the stem: 3(a) allows a quarter of the length, 12.5 m)
MH_Z = 23.65                             # the masthead light on its top
FISH_R, FISH_W = 22.30, 20.30            # the fishing lights red over white on the arm forward of the mast (rule 26, 2(i)(ii))
FISH_ARM = 0.55
RAD_A = (37.70, 19.35)                   # the open array's platform aft of the mast (kit.radarA: x, its top)
RAD_D = (36.55, 2.35)                    # the dome's pedestal on the roof aft to port (kit.radar)
SIDE = (41.55, 5.38, WF + 1.12)          # the sidelights on the wings' fore ends (x, out, z), screened inboard
def fore(A, crown, fine=True):
    seg = 14 if fine else 6; m = C['mast']; s = lambda q: C['steel']; zr = crown(FMX, 0); x = FMX
    acyl(A, (x, 0, zr - 0.02), (x, 0, 21.2), 0.20, lambda q: m, seg=seg, r1=0.14)
    acyl(A, (x, 0, 21.2), (x, 0, MH_Z - 0.06), 0.14, lambda q: m, seg=seg, r1=0.07)
    abox(A, x - 0.32, x + 0.32, -0.32, 0.32, zr - 0.01, zr + 0.05, C['steel'])
    if fine: F.allround_lantern(A, (x, 0, MH_Z), C['lampW'], C['frame'], R=0.07, H=0.14)
    else: acyl(A, (x, 0, MH_Z - 0.06), (x, 0, MH_Z + 0.08), 0.07, lambda q: C['lampW'], seg=6)
    # the arm with the fishing lights, forward of the mast so the mast does not hide them
    for z, mt in ((FISH_R, C['lampR']), (FISH_W, C['lampW'])):
        abox(A, x + 0.10, x + FISH_ARM - 0.04, -0.03, 0.03, z - 0.16, z - 0.11, m)
        acyl(A, (x + FISH_ARM, 0, z - 0.16), (x + FISH_ARM, 0, z - 0.10), 0.06, lambda q: m, seg=10 if fine else 5)
        if fine: F.allround_lantern(A, (x + FISH_ARM, 0, z), mt, C['frame'], R=0.06, H=0.12)
        else: acyl(A, (x + FISH_ARM, 0, z - 0.06), (x + FISH_ARM, 0, z + 0.06), 0.06, lambda q: mt, seg=6)
    # the open array's platform aft on a strut, with its rail; the cross-tree
    rx, rz = RAD_A
    abox(A, rx - 0.55, x - 0.12, -0.55, 0.55, rz - 0.07, rz, C['galv'])
    beam(A, (x - 0.12, 0, rz - 0.85), (rx - 0.2, 0, rz - 0.07), 0.10, 0.10, m)
    abox(A, x - 0.03, x + 0.03, -1.4, 1.4, 21.4, 21.48, m)
    if not fine: return
    F.pipe(A, [(rx - 0.55, -0.55, rz + 0.45), (rx - 0.55, 0.55, rz + 0.45)], 0.02, C['steel'], 6)
    for sy in (-1.3, 1.3): F.whip(A, (x, sy, 21.48), 2.0, C['white'], r0=0.018, r1=0.006, m_foot=C['steel'])
    F.gps(A, (x, 0.75, 21.48), C['white'], r=0.08, h=0.14, m_post=C['steel']); F.gps(A, (x, -0.75, 21.48), C['white'], r=0.08, h=0.14, m_post=C['steel'])
    # the dome's pedestal (the radome is the game's), the searchlights and the horn on the roof's fore edge, the satellite dome's foot
    px, py = RAD_D; zp = crown(px, py)
    acyl(A, (px, py, zp - 0.01), (px, py, zp + 0.55), 0.10, lambda q: C['white'], seg=10); abox(A, px - 0.25, px + 0.25, py - 0.25, py + 0.25, zp + 0.55, zp + 0.60, C['white'])
    for sy in (-2.6, 2.6): F.searchlight(A, (41.2, sy, crown(41.2, sy)), (1, 0), 0.16, C['dark'], C['lens'], C['steel'])
    acyl(A, (40.3, 0.5, crown(40.3, 0.5) + 0.20), (40.65, 0.5, crown(40.3, 0.5) + 0.26), 0.04, lambda q: C['white'], seg=10, r1=0.11)
    abox(A, 40.25, 40.35, 0.45, 0.55, crown(40.3, 0.5) - 0.004, crown(40.3, 0.5) + 0.20, C['steel'])
    rail_line(A, [(WX0 + 0.3, -3.6, crown(WX0 + 0.3, 3.6)), (WX0 + 0.3, 3.6, crown(WX0 + 0.3, 3.6))], h=0.9, every=1.2, fine=fine)
    for sg in (1, -1): F.work_light(A, (WX0 - 0.05, sg * 3.3, WR - 0.03), (-0.6, 0, -1), C['dark'], C['lens'])
    for sg in (1, -1): F.work_light(A, (42.9, sg * 1.5, WR + 0.05), (1, 0, -0.9), C['dark'], C['lens'])
    for sg in (1, -1): F.work_light(A, (WING[1] - 0.3, sg * (WING[2] - 0.15), WF + 2.2), (0, sg * 0.6, -1), C['dark'], C['lens'])

def lanterns_side(A, fine=True):
    """the sidelights on the wings' fore ends with their screens inboard (fittings.side_lantern), so neither shows across the bow"""
    for sg, mt in ((1, C['lampR']), (-1, C['lampG'])):
        x, out, z = SIDE; y = sg * out
        abox(A, x - 0.22, x + 0.18, min(y, y - sg * 0.20), max(y, y - sg * 0.20), z - 0.12, z - 0.07, C['frame'])
        if fine: F.side_lantern(A, (x, y, z - 0.07), (1, 0, 0), (0, sg, 0), mt, C['frame'], C['black'], R=0.06, H=0.09)
        else: obox(A, (x, y, z), V((0.05, 0, 0)), V((0, 0.04, 0)), V((0, 0, 0.05)), mt)


# ---------- the foredeck: the windlass with its two gypsies, the hawse pipes' deck ends, bitts, fairleads, vents, the jack staff ----------
WLX = 46.10
HPIPE = (46.95, 1.55)
def foredeck(A, fine=True):
    s = lambda q: C['steel']; zd = z_sd(WLX) + camber(WLX, 0)
    abox(A, WLX - 0.55, WLX + 0.45, -1.10, 1.10, zd - 0.006, zd + 0.30, C['red'])
    for sg in (1, -1):
        acyl(A, (WLX, sg * 0.35, zd + 0.62), (WLX, sg * 1.25, zd + 0.62), 0.34, lambda q: C['red'], seg=20 if fine else 6)
        if fine:
            F.atorus(A, (WLX, sg * 1.35, zd + 0.62), (0, 1, 0), 0.30, 0.06, lambda a: C['steel'], seg=18, rseg=6)
            acyl(A, (WLX, sg * 1.25, zd + 0.62), (WLX, sg * 1.60, zd + 0.62), 0.22, lambda q: C['steel'], seg=14)
            hx, hy = HPIPE; z0_ = z_sd(hx) + camber(hx, hy)
            acyl(A, (hx, sg * hy, z0_ - 0.004), (hx, sg * hy, z0_ + 0.12), 0.26, s, seg=16)
            F.atorus(A, (hx, sg * hy, z0_ + 0.12), (0, 0, 1), 0.26, 0.04, lambda a: C['steel'], seg=18, rseg=5)
            acyl(A, (WLX - 0.9, sg * 0.8, z_sd(WLX - 0.9) + 0.1), (WLX - 0.9, sg * 0.8, z_sd(WLX - 0.9) + 0.26), 0.14, s, seg=12)   # the chain pipes
    obox(A, (WLX - 0.45, 0, zd + 0.42), V((0.28, 0, 0)), V((0, 0.32, 0)), V((0, 0, 0.14)), C['red'])
    if not fine: return
    for x, y in ((44.2, 3.0), (44.2, -3.0), (48.2, 1.5), (48.2, -1.5)): F.bitts(A, x, y, z_sd(x) + camber(x, y), C['steel'], h=0.45, r=0.11, gap=0.34)
    for x in (43.6, 47.6):
        for sg in (1, -1):
            yy = sg * (yin(x, z_cap(x) - 0.4) + 0.03); zc = z_cap(x)
            abox(A, x - 0.28, x + 0.28, yy - 0.07, yy + 0.07, zc - 0.55, zc + 0.08, C['steel'])
    for y in (0.9, -0.9): F.mushroom_vent(A, (44.8, y, z_sd(44.8) + camber(44.8, y)), C['white'], r=0.14, h=0.6)
    for x, y in ((45.2, 2.4), (45.2, -2.4)):
        z0_ = z_sd(x) + camber(x, y); acyl(A, (x, y, z0_ - 0.004), (x, y, z0_ + 0.7), 0.08, s, seg=10); F.pipe(A, [(x, y, z0_ + 0.7), (x, y, z0_ + 0.8), (x + 0.13, y, z0_ + 0.82), (x + 0.2, y, z0_ + 0.74)], 0.08, C['steel'], 10)
    js = 49.2; acyl(A, (js, 0, z_sd(js) + 0.1), (js + 0.25, 0, z_cap(js) + 1.6), 0.035, lambda q: C['white'], seg=8)
    rail_line(A, [(x, sg * (yin(x, z_cap(x)) - 0.02), z_cap(x) + 0.012) for sg in (1,) for x in (44.5, 46.0, 47.5, 48.7)] + [(49.45, 0.0, z_cap(49.45) + 0.012)] +
              [(x, -(yin(x, z_cap(x)) - 0.02), z_cap(x) + 0.012) for x in (48.7, 47.5, 46.0, 44.5)], h=0.55, every=1.2, fine=fine, knee=0.28)


# ---------- under water: the shoe, the rudder, the propeller in its aperture, the bow thruster, the bilge keels, the anodes, the sonar ----------
RX_ = 2.05                               # the rudder's leading edge (its stock)
PROP = (3.35, 0.0, 1.75); PR = 1.35      # the propeller (3 600 hp, a four-bladed CPP)
THR = (45.30, 3.10); THR_R = 0.55        # the bow thruster's tunnel (x, z)
def surf(x, z, sg, off=0.0):
    p = lambda xx, zz: V((xx, sg * (y_at(xx, zz, sg) + off), zz))
    tx = p(x + 0.08, z) - p(x - 0.08, z); tz = p(x, z + 0.08) - p(x, z - 0.08); n = tx.cross(tz)
    if n.y * sg < 0: n = -n
    return p(x, z), n.normalized(), tx.normalized()
def underwater(fine=True):
    U = Acc('under')
    abox(U, -0.05, X_KA + 0.08, -0.22, 0.22, 0.0, 0.16, C['af'])                                       # the shoe under the propeller
    F.foil_rudder(U, (RX_, 0.0), 0.22, 5.4, 2.10, C['af'], thick=0.16, top=lambda x: z_low(max(x, XA)) - 0.06, n=12 if fine else 5, rows=8 if fine else 2)
    acyl(U, (RX_ - 0.30, 0, 0.16), (RX_ - 0.30, 0, 0.24), 0.12, lambda q: C['steel'], seg=12)
    px, py, pz = PROP
    if not fine: return U.done(35)
    acyl(U, (px + 0.20, 0, pz), (X_KA + 0.10, 0, pz), 0.22, lambda q: C['steel'], seg=16)
    acyl(U, (X_KA - 0.14, 0, pz), (X_KA + 0.10, 0, pz), 0.40, lambda q: C['af'], seg=18, r1=0.46)
    F.propeller(U, PROP, (1, 0, 0), PR, C['prop'], n=4, hub=0.26, pitch=0.85, skew=0.30, cpp=True, m_guard=C['dark'], fine=fine)
    for sg in (1, -1):
        for x, z in ((6.0, 0.55), (10.0, 0.35), (14.0, 0.40), (24.0, 0.55), (32.0, 0.70)):
            F.anode(U, (x, sg * (max(wk(x), 0.05) + 0.01), z) if x < X_KF else surf(x, z_low(x) + 0.6, sg)[0], (0, sg, 0) if x < X_KF else surf(x, z_low(x) + 0.6, sg)[1], (1, 0, 0), C['anode'], L=0.50, w=0.14, t=0.06, m_strap=C['steel'])
        F.anode(U, (-0.005, sg * 2.2, WL - 0.35), (-1, 0, 0), (0, 1, 0), C['anode'], L=0.40, w=0.12, t=0.05, m_strap=C['steel'])
        # the bilge keels along the turn of the bilge (SKR-07)
        pts = [surf(x, 0.95, sg)[0] for x in [12.0 + 1.0 * k for k in range(24)]]
        for a, b in zip(pts, pts[1:]):
            n = surf((a.x + b.x) / 2, 0.95, sg)[1]; d = V((n.x, n.y, min(n.z, -0.45))).normalized()
            U.poly([a, b, b + d * 0.40, a + d * 0.40], C['af'], (0, sg, 0.2)); U.poly([a + d * 0.40, b + d * 0.40, b, a], C['af'], (0, -sg, -0.2))
        # the bow thruster's tunnel and the sea chests' grilles
        p, n, tt = surf(THR[0], THR[1], sg); F.thruster_tunnel(U, p, n, THR_R, C['dark'], C['af'], m_prop=C['prop'], fine=fine)
        for xs_ in (17.0, 21.0):
            p, n, tt = surf(xs_, 1.6, sg)
            for k in range(6): U.poly([p + tt * (-0.45) + V((0, 0, -0.30 + 0.11 * k)) + n * 0.01, p + tt * 0.45 + V((0, 0, -0.30 + 0.11 * k)) + n * 0.01, p + tt * 0.45 + V((0, 0, -0.26 + 0.11 * k)) + n * 0.01, p + tt * (-0.45) + V((0, 0, -0.26 + 0.11 * k)) + n * 0.01], C['dark'], n)
    # the sonar's trunk forward and the echo sounders' transducers under the flat keel
    xs_ = 40.5; zt = z_low(xs_); acyl(U, (xs_, 0, zt + 0.02), (xs_, 0, zt - 0.06), 0.36, lambda q: C['dark'], seg=20, r1=0.33)
    for x, y in ((30.0, 0.8), (30.0, -0.8)):
        zt = z_on(vline(x), abs(y)); acyl(U, (x, y, zt + 0.02), (x, y, zt - 0.04), 0.12, lambda q: C['dark'], seg=16, r1=0.11)
    return U.done(35)


# ---------- on the plating: the weld seams, the ice belt's edges (1C), the draft marks and the thruster's symbol (SKR-09, IDN-06) ----------
SEAM_Z = [1.4, 3.0, 4.6, WL - 0.65, WL + 0.80, 8.75, 11.40]
BUTTS = [3.2, 9.0, 15.0, 21.0, 27.0, 33.0, 38.6, 44.6]
def paint_of(z, x):
    if z < Z_AF: return C['af']
    if z < Z_BT: return C['boot']
    if z >= z_stripe(x) - 0.002: return C['stripe']
    return C['hull']
def clear_for_text(x, z): return not ((31.0 <= x <= 46.0 and 10.7 <= z <= z_cap(x) + 0.1) or (x <= 0.6 and 6.8 <= z <= 9.0))
def seams(A, fine=True):
    if not fine: return
    for sg in (1, -1):
        nf = lambda p, sg=sg: surf(p.x, p.z, sg)[1]
        for z in SEAM_Z:
            ice = z in (WL - 0.65, WL + 0.80)
            x0 = 24.0 if ice else (3.0 if z > z_low(3.0) + 0.5 else 8.0)
            xs = [x for x in [x0 + 0.5 * k for k in range(100)] if x < xstem(z) - 0.25 and z_low(x) < z - 0.25 and z < z_cap(x) - 0.15]
            run = []
            for x in xs + [None]:
                if x is not None and clear_for_text(x, z): run.append(x); continue
                if len(run) > 1:
                    pts = [V((xx, sg * (y_at(xx, z, sg) + 0.001), z)) for xx in run]
                    for a, b in zip(pts, pts[1:]): F.seam(A, [a, b], nf, paint_of(z, (a.x + b.x) / 2), w=0.035 if ice else 0.024, h=0.008 if ice else 0.005)
                run = []
        for x in BUTTS:
            zs = [z for z in [z_low(x) + 0.3 + 0.25 * k for k in range(60)] if z < z_cap(x) - 0.20 and not (RUB[0] - 0.12 < z < RUB[0] + 0.12) and not (RUB[1] - 0.12 < z < RUB[1] + 0.12)]
            run = []
            for z in zs + [None]:
                if z is not None and clear_for_text(x, z) and not any(a - 0.05 < x < b + 0.05 and OPEN_Z[0] - 0.1 < z < OPEN_Z[1] + 0.1 for a, b in OPEN_S): run.append(z); continue
                if len(run) > 1:
                    pts = [V((x, sg * (y_at(x, zz, sg) + 0.001), zz)) for zz in run]
                    for a, b in zip(pts, pts[1:]): F.seam(A, [a, b], nf, paint_of((a.z + b.z) / 2, x), w=0.024, h=0.005)
                run = []
        # the draft marks at the stern, midships and the bow; the bow thruster's symbol over it
        for x in (1.0, 25.0):
            F.draft_scale(A, lambda zq, x=x, sg=sg: (lambda p, n, tt: (p, n, -sg * tt))(*surf(x, zq, sg, off=0.004)), WL - 1.6, WL + 1.0, C['mark'])
        F.draft_scale(A, lambda zq, sg=sg: (lambda p, n, tt: (p, n, -sg * tt))(*surf(xstem(zq) - 0.55, zq, sg, off=0.004)), WL - 1.6, WL + 1.0, C['mark'])
        p, n, tt = surf(THR[0], WL + 1.25, sg, off=0.004); F.thruster_symbol(A, p, n, (0, 0, 1), 0.38, C['mark'])


def build(fine=True):
    HELM_EXTRA.clear()
    M = Mesh('hull'); hull_shell(M, fine)
    for z in (Z_AF, Z_BT):
        g = [f for f in M.bm.faces if f[M.kind] == 1]
        ge = list(set(e for f in g for e in f.edges)); gv = list(set(v for f in g for v in f.verts))
        bmesh.ops.bisect_plane(M.bm, geom=g + ge + gv, dist=1e-6, plane_co=(XM, 0, z), plane_no=(0, 0, 1))
    for f in M.bm.faces:
        if f[M.kind] == 1:
            c = f.calc_center_median()
            f.material_index = M.mi(C['af'] if c.z < Z_AF else C['boot'] if c.z < Z_BT else C['hull'])
    hull = M.done(30)
    if fine: cut_holes(hull, cutters(fine))
    tint(hull)
    A = Acc('fit'); G = Acc('glass')
    if fine: linings(A, G, fine)
    else:     # (the far model: the openings as dark plates on the plating)
        for sg in (1, -1):
            for x0, x1 in OPEN_S: A.poly([(x0, sg * (y_at(x0, OPEN_Z[0]) + 0.03), OPEN_Z[0]), (x1, sg * (y_at(x1, OPEN_Z[0]) + 0.03), OPEN_Z[0]), (x1, sg * (y_at(x1, OPEN_Z[1]) + 0.03), OPEN_Z[1]), (x0, sg * (y_at(x0, OPEN_Z[1]) + 0.03), OPEN_Z[1])], C['cabin'], (0, sg, 0))
        y0, y1, z0, z1 = STERN_O; A.poly([(XA - 0.03, y0, z0), (XA - 0.03, y1, z0), (XA - 0.03, y1, z1), (XA - 0.03, y0, z1)], C['cabin'], (-1, 0, 0))
    pot_deck(A, G, fine); shelter_top(A, G, fine); after_mast(A, fine)
    ho, hg = house(fine); wo, wg, crown = wheelhouse(fine)
    helm(A, G, fine); fore(A, crown, fine); lanterns_side(A, fine); foredeck(A, fine); seams(A, fine)
    out = [hull, A.done(35, tint=wear), underwater(fine)] + ho + wo + HELM_EXTRA
    if not fine: out += list(crane_parts(False)[:3]) + [hatch_lid(False)]   # (the far model carries her crane parked and the hatch shut)
    g = G.done(35)
    return [o for o in out if o], hg + wg + ([g] if g else [])


# ---------- the parts the game moves (H2d2, as al45.py): the cargo hatch's lid, the crane's head, boom and hook block ----------
HINGE = (0.0, HATCH[3] + 0.06, DK + HCH + 0.06)
def hatch_lid(fine=True):
    """the lid from its hinge on the port edge, so the game turns it open about the boat's length"""
    A = Acc('hatch_lid'); w = C['white']; x0, x1, y0, y1 = HATCH[0] - 0.05, HATCH[1] + 0.05, HATCH[2] - 0.05, HATCH[3] + 0.05; z0 = DK + HCH
    abox(A, x0, x1, y0, y1, z0 + 0.02, z0 + 0.14, w)
    abox(A, x0 + 0.05, x1 - 0.05, y0 + 0.05, y1 - 0.05, z0, z0 + 0.02, C['black'])
    if fine:
        for k in range(4):
            x = x0 + 0.3 + (x1 - x0 - 0.6) * k / 3; abox(A, x - 0.04, x + 0.04, y0 + 0.05, y1 - 0.05, z0 + 0.14, z0 + 0.24, w)
        for x in (HATCH[0] + 0.45, (HATCH[0] + HATCH[1]) / 2, HATCH[1] - 0.45):
            acyl(A, (x - 0.07, HINGE[1], HINGE[2]), (x + 0.07, HINGE[1], HINGE[2]), 0.06, lambda z: C['steel'], seg=10)
            abox(A, x - 0.05, x + 0.05, y1 - 0.10, HINGE[1], z0 + 0.06, z0 + 0.14, C['steel'])
        acyl(A, (HATCH[0] + 0.3, HINGE[1], HINGE[2]), (HATCH[1] - 0.3, HINGE[1], HINGE[2]), 0.025, lambda z: C['steel'], seg=8)
        for x in (HATCH[0] + 0.6, HATCH[1] - 0.6): abox(A, x - 0.06, x + 0.06, y0 - 0.06, y0 + 0.02, z0 - 0.05, z0 + 0.10, C['steel'])
    return A.done(25)

def crane_parts(fine=True):
    """the crane's moving parts (H2d2), each in its own frame for the game: the slewing head from the slewing axis on the pedestal's
    top (turns about the game's y), the knuckle boom (the main boom and the outer boom run out in one line with the telescope) from its
    heel pin lying straight along the game's -z, and the hook block from the eye it hangs by"""
    w = C['white']; Lb = (V(CR_PARK) - V(CR_HEEL)).length; seg = 16 if fine else 6
    H = Acc('crane_head')
    acyl(H, CR_AX, (CR_AX[0], CR_AX[1], CR_AX[2] + 0.22), 0.58, lambda z: C['dark'], seg=seg)            # the slewing ring
    abox(H, CR_AX[0] - 0.55, CR_AX[0] + 0.45, CR_AX[1] - 0.42, CR_AX[1] + 0.42, CR_AX[2] + 0.22, CR_HEEL[2] - 0.10, w)
    for sg in (-1, 1): abox(H, CR_HEEL[0] - 0.22, CR_HEEL[0] + 0.22, CR_HEEL[1] + sg * 0.30, CR_HEEL[1] + sg * 0.40, CR_HEEL[2] - 0.30, CR_HEEL[2] + 0.22, w)
    if fine:
        # the operator's seat with its controls under a small roof on the head's side (the cranes of the fleet are run from the deck)
        abox(H, CR_AX[0] - 0.50, CR_AX[0] - 0.10, CR_AX[1] - 0.82, CR_AX[1] - 0.42, CR_AX[2] + 0.22, CR_AX[2] + 0.62, C['dark'])
        beam(H, (CR_AX[0] + 0.40, CR_AX[1], CR_AX[2] + 0.5), (CR_AX[0] - 0.9, CR_AX[1], CR_HEEL[2] - 0.2), 0.16, 0.16, C['steel'])   # the luffing cylinder's foot
    B = Acc('crane_boom'); x0, y0, z0 = CR_HEEL; d = V((-1, 0, 0))   # (along -x in the script: aft, as it lies parked)
    pd = (V(CR_PARK) - V(CR_HEEL)).normalized()
    tip = V(CR_HEEL) + pd * Lb
    # the main boom, the knuckle, the outer boom in line, the telescope out of it; each a box section, the ochre band at the knuckle
    k1 = V(CR_HEEL) + pd * (Lb * 0.48); k2 = V(CR_HEEL) + pd * (Lb * 0.80)
    beam(B, V(CR_HEEL), k1, 0.42, 0.50, w); beam(B, k1, k1 + pd * 0.35, 0.50, 0.58, C['ochre']); beam(B, k1 + pd * 0.35, k2, 0.36, 0.42, w); beam(B, k2, tip, 0.28, 0.32, w)
    acyl(B, (x0, y0 - 0.30, z0), (x0, y0 + 0.30, z0), 0.10, lambda z: C['steel'], seg=10)          # the heel pin
    acyl(B, tip + V((0, -0.18, -0.10)), tip + V((0, 0.18, -0.10)), 0.16, lambda z: C['steel'], seg=12)   # the sheave at the tip
    if fine:
        up = V((0, 0, 1)); s_ = pd.cross(up).normalized(); u_ = s_.cross(pd).normalized()
        acyl(B, V(CR_HEEL) + pd * 1.0 - u_ * 0.25, V(CR_HEEL) + pd * (Lb * 0.40) - u_ * 0.25, 0.09, lambda z: C['steel'], seg=10)   # the luffing cylinder's rod
        acyl(B, k1 - u_ * 0.3 + pd * 0.2, k1 + pd * 1.6 + u_ * 0.25, 0.08, lambda z: C['steel'], seg=10)                             # the knuckle's cylinder
        F.pipe(B, [V(CR_HEEL) + u_ * 0.30 + s_ * 0.15, k1 + u_ * 0.35 + s_ * 0.15, k2 + u_ * 0.27 + s_ * 0.12], 0.025, C['hose'], 6)
    K = Acc('crane_block'); abox(K, -0.22, 0.22, -0.16, 0.16, -0.34, 0.0, C['yellow'])
    acyl(K, (0, 0, -0.34), (0, 0, -0.48), 0.035, lambda z: C['steel'], seg=6); acyl(K, (0, 0, -0.48), (0.07, 0, -0.58), 0.03, lambda z: C['steel'], seg=6)
    return H.done(30), B.done(30), K.done(30), Lb


def to_game(p): return (-p[1], p[2] - WL, -(p[0] - XM))
def to_game_n(n): return (-n[1], n[2], -n[0])

NAME_X = (31.40, 38.60); NAME_Z = (11.05, 11.95)
def name_strips(G):
    """where the name is written (vessel3d.js nameStrips): on the forecastle's side over the portholes, aft of the registration mark's
    place (markStrips 11-19 % from the stem; maletest: never on each other), and across the transom under the stern opening"""
    out = []
    for sg, xs in ((1, [NAME_X[1] - (NAME_X[1] - NAME_X[0]) * k / 12 for k in range(13)]), (-1, [NAME_X[0] + (NAME_X[1] - NAME_X[0]) * k / 12 for k in range(13)])):
        B = []; T = []
        for x in xs:
            for arr, z in ((B, NAME_Z[0]), (T, NAME_Z[1])): arr.append(G(x, sg * (y_at(x, z, sg) + 0.04), z))
        out.append([B, T])
    w = 3.4; ys = [w - 2 * w * k / 12 for k in range(13)]
    out.append([[G(XA - 0.03, y, 7.45) for y in ys], [G(XA - 0.03, y, 8.25) for y in ys]])
    return out

def bower(G):
    """the boat's own anchors (tools/deck/anker.py, view3d drawAnchor): Hall anchors of 1 300 kg stowed in the hawse pipes high in the bow,
    the chain from the windlass's gypsies down the deck pipes"""
    hw = lambda sg: {'fair': G(HAWSE[0], sg * (y_at(HAWSE[0], HAWSE[1], sg) + 0.04), HAWSE[1]), 'pipe': G(HPIPE[0], sg * HPIPE[1], z_sd(HPIPE[0]) + 0.12)}
    return dict(hw(-1), kind='hall', kg=1300, gypsy=G(WLX, -0.80, z_sd(WLX) + 0.95), side=1, deck=True, spare=hw(1))

def kit(G):
    """the places of the deck kit, in the game's frame (19.10.2026, Ø11.5): the stacks of conical pots (twelve nested to a stack, drawn as
    many as are aboard, view3d drawPotStacks) in five rows on the pot deck from the stern under the shelter to the cargo hatch, the
    walkway between the second and third rows and along the conveyor kept clear; where a hauled pot is emptied (spot: on the sorting
    table); the two liferafts at the shelter's after corners where they float free (§ 7-5); the six lifebuoys on the rails (§ 7-10); the
    rescue boat on the shelter to starboard with its davit at the side (§ 7-5, tools/deck/mob.py); the open array on the foremast's
    platform and the dome on its pedestal"""
    r = lambda v: round(v, 3); h = math.pi / 2
    at = [G(x, y, DK) + [r((x * 7 + y * 3) % 6.28)] for y in STACK_Y for x in STACK_X]
    buoy = lambda x, sg, z, ytop: G(x, sg * (ytop + 0.03), z) + [r(-sg * h)]
    zr = SD + COAM + RAIL_H
    return {'pots': {'kind': 'kon', 'spot': G(22.55, -3.85, TABLE_Z), 'at': at},
            'raft': [G(2.2, -(yin(2.2, SD) - 0.65), SD) + [r(h)], G(2.2, yin(2.2, SD) - 0.65, SD) + [r(-h)]],
            'buoys': [buoy(5.6, -1, zr - 0.02, yin(5.6, SD + COAM)), buoy(5.6, 1, zr - 0.02, yin(5.6, SD + COAM)), buoy(13.5, -1, zr - 0.02, yin(13.5, SD + COAM)),
                      buoy(13.5, 1, zr - 0.02, yin(13.5, SD + COAM)), buoy(31.0, -1, TA + 0.08 + 1.0, ta_w(31.0) - 0.08), buoy(31.0, 1, TA + 0.08 + 1.0, ta_w(31.0) - 0.08)],
            'mob': G(10.6, -3.05, SD + camber(10.6, 3.05, yin(10.6, SD))) + [0.0, 1, 0],
            'radarA': G(RAD_A[0], 0, RAD_A[1]), 'radar': G(RAD_D[0], RAD_D[1], wh_crown(*RAD_D) + 0.60)}

def anchors():
    G = lambda x, y, z: [round(v, 3) for v in to_game((x, y, z))]
    fl = WF; hx, hy, hz = hauler_at(); x0, x1, y0, y1 = HATCH
    return {'bower': bower(G), 'eye': G(SKIP[0], SKIP[1], fl + EYE_H), 'skipperAt': G(SKIP[0], SKIP[1], fl), 'hp': HP, 'fov': FOV,
            # the hands on deck (H3b's deck team): at the hauler, at the sorting table (two), stacking along the conveyor, at the chute
            'crewSpots': [G(24.2, -4.3, DK) + [1.57], G(22.1, -2.55, DK) + [-1.57], G(20.9, -2.55, DK) + [-1.57], G(12.0, -3.45, DK) + [-1.57], G(4.0, -3.45, DK) + [-1.57], G(27.5, -1.0, DK) + [3.14]],
            # typed lights (B8): the masthead lights, the sidelights with their screens, the stern light, the fishing lights red over
            # white; the work lights on the portal, under the shelter and on the masts
            'lights': [[G(FMX, 0, MH_Z), [1, 0.95, 0.85], 'masthead'], [G(AMX, 0, AM_TOP), [1, 0.95, 0.85], 'masthead2'],
                       [G(SIDE[0], SIDE[1], SIDE[2]), [1, 0.12, 0.1], 'port'], [G(SIDE[0], -SIDE[1], SIDE[2]), [0.1, 1, 0.35], 'stbd'],
                       [G(*STERN_L), [1, 0.95, 0.85], 'stern'], [G(FMX + FISH_ARM, 0, FISH_R), [1, 0.12, 0.1], 'fishR'], [G(FMX + FISH_ARM, 0, FISH_W), [1, 0.95, 0.85], 'fishW'],
                       [G(PORTAL[0], -4.9, PT_Z - 0.3), [1, 0.95, 0.85], 'work'], [G(7.7, 0, CEIL - 0.1), [1, 0.95, 0.85], 'work'], [G(AMX + 0.2, 0, 21.0), [1, 0.95, 0.85], 'work'],
                       [G(42.9, 0, WR), [1, 0.95, 0.85], 'work']],
            # the stairs (deckMap: the shelter and the forecastle deck lie 2.95 m over the pot deck, the boat deck 2.65 over the forecastle's)
            'stairs': [{'from': G(STAIR_SH[0] + 0.35, 0.0, DK), 'to': G(STAIR_SH[1] - 0.45, 0.0, SD)},
                       {'from': G(STAIR_FC[0] - 0.35, (STAIR_FC[2] + STAIR_FC[3]) / 2, DK), 'to': G(STAIR_FC[1] + 0.50, (STAIR_FC[2] + STAIR_FC[3]) / 2, z_sd(X_FC + 0.5))},
                       {'from': G(TA_X[0] - 0.55, 0.45, ta_foot(TA_X[0] - 0.5, 0.45)), 'to': G(TA_X[0] + 0.55, 4.0, TA + 0.08)}],
            'doors': [{'at': G(X_FC - 0.03, sum(FC_DOOR) / 2, DK), 'w': round(FC_DOOR[1] - FC_DOOR[0], 2), 'h': 2.0, 'in': G(X_FC + 0.9, sum(FC_DOOR) / 2, DK), 'to': 'mess', 'open': True},
                      {'at': G(TA_X[0] - 0.03, sum(TA_DOOR) / 2, ta_foot(TA_X[0], -1.3)), 'w': round(TA_DOOR[1] - TA_DOOR[0], 2), 'h': 2.0, 'in': G(TA_X[0] + 0.9, sum(TA_DOOR) / 2, ta_foot(TA_X[0], -1.3)), 'to': 'cabin', 'open': True},
                      {'at': G(WX0 - 0.03, sum(WDOOR) / 2, WF), 'w': round(WDOOR[1] - WDOOR[0], 2), 'h': 1.96, 'in': G(WX0 + 0.9, sum(WDOOR) / 2, WF), 'to': 'helm', 'open': True}],
            'names': name_strips(G),
            # the pot deck: the pots come in over the portal's block to the hauler at the starboard bulwark, are emptied on the sorting
            # table, go aft on the conveyor to the stacks and the chute
            'deck': {'y': round(DK - WL, 3), 'z': round(-(18.0 - XM), 3)}, 'gw': round(GW - WL, 3),
            'stern': round(XM - XA, 3), 'bow': round(-(XF - XM), 3), 'side': round(BEAM / 2, 3), 'beam': BEAM, 'pl': 20.0, 'rl': 4.2, 'open': False, 'hand': False,
            'kit': kit(G), 'pole': G(0.10, 1.9, SD + COAM + 2.2), 'hauler': G(hx, hy, hz), 'filler': G(26.0, ysh(26.0), DK + 0.3), 'exhaust': G(FUN[0] + 1.25, 0.42, FUN_TOP + 0.85),
            # the snow crab's work (H3d2 animates it): the hauler's foot, the block over the side the line comes over, the hook where a pot
            # hangs as it comes in, the sorting table (its middle on its top, its size across and along), the conveyor's belt from the
            # table to the chute (its top), the chute's top and its lip over the stern, the hatches over the RSW tanks
            'snok': {'hauler': G(hx, hy, hz), 'block': G(*BLOCK), 'hook': G((PORTAL[0] + PORTAL[1]) / 2, -(yin(24.6, GW) - 0.6), GW + 1.2),
                     'table': G((TABLE[0] + TABLE[1]) / 2, (TABLE[2] + TABLE[3]) / 2, TABLE_Z), 'tsize': [round(TABLE[3] - TABLE[2], 3), round(TABLE[1] - TABLE[0], 3)],
                     'conv': [G(CONV_X[1], CONV_Y, CONV_Z), G(CONV_X[0], CONV_Y, CONV_Z)], 'chute': [G(*CHUTE[0]), G(*CHUTE[1])],
                     'rsw': [G(cx, cy, DK + 0.52) for cx, cy in RSW], 'stackPitch': 0.16, 'stackN': 12},
            # the cargo hatch over the freezer hold: its middle on the coaming's top, the inside opening (across, along), the lid's hinge
            # (it turns about the boat's length, open to port), how far it opens
            'hatch': {'at': G((x0 + x1) / 2, (y0 + y1) / 2, DK + HCH), 'deck': round(DK - WL, 3), 'size': [round(y1 - y0 - 0.2, 3), round(x1 - x0 - 0.2, 3)],
                      'hinge': G(*HINGE), 'open': 1.85, 'axis': [0, 0, 1]},
            # the crane (H2d2): the slewing axis, the heel pin, the boom's length to the tip's sheave, the tip parked in its rest
            'crane': {'axis': G(*CR_AX), 'heel': G(*CR_HEEL), 'len': round((V(CR_PARK) - V(CR_HEEL)).length - 0.1, 3), 'park': G(*CR_PARK), 'hang': 1.0,
                      'clear': round(SD + 0.6 - WL, 3)}}


# ---------- the checks of the parts (kap. 15), added to check() ----------
def _ck_bridge():
    out = []
    out.append(('styrhuset: %.2f m fra dørken til takets underside (brotest 1.8, dekkskartet 1.85); huset på bakken %.2f m' % (WR - WF, TA - z_sd(36.0)), WR - WF >= 1.88 and TA - z_sd(36.0) >= 2.2))
    ey = WF + EYE_H
    out.append(('øyet %.2f m over vannet, %.2f m over vinduenes underkant og %.2f under overkanten' % (ey - WL, ey - WS, WH - ey), ey - WS > 0.3 and WH - ey > 0.1))
    dzm = dz((DASHZ[0] + DASHZ[1]) / 2); dxm = (DASH[0] + DASH[1]) / 2
    ang = math.degrees(math.atan2(ey - dzm, dxm - SKIP[0])); up = math.degrees(math.atan2(WH - ey, 42.85 + lean_at(WH) - SKIP[0]))
    out.append(('dashbordet %.0f grader under øyet, vinduets overkant %.0f over (hp %.2f, fov %d: synsfeltet %.0f opp, %.0f ned)' % (ang, up, HP, FOV, FOV / 2 - math.degrees(-HP), math.degrees(-HP) + FOV / 2),
                ang <= math.degrees(-HP) + FOV / 2 - 3 and up <= FOV / 2 - math.degrees(-HP) + 12))
    bow = math.degrees(math.atan2(ey - z_cap(XF), XF - SKIP[0]))
    out.append(('baugen %.0f grader under øyet (synsfeltet går %.0f ned): stevnen synes fra rattet' % (bow, math.degrees(-HP) + FOV / 2), bow < math.degrees(-HP) + FOV / 2 - 5))
    return out
def _ck_lights():
    out = []; hull = DK                  # (the uppermost continuous deck: the pot deck; the forecastle and the shelter are not continuous)
    out.append(('forreste topplanterne %.1f m fra stevnen (3(a): høyst en firedel av lengden, %.1f)' % (XF - FMX, L / 4), XF - FMX <= L / 4))
    out.append(('forreste topplanterne %.2f m over skroget (2(a)(i): minst bredden, 11 m)' % (MH_Z - hull), MH_Z - hull >= BEAM))
    out.append(('aktre topplanterne %.2f m over den forreste (2(a)(ii): minst 4,5) og %.1f m bak den (3(a): minst halve lengden, 25)' % (AM_TOP - MH_Z, FMX - AMX), AM_TOP - MH_Z >= 4.5 and FMX - AMX >= L / 2))
    out.append(('sidelysene %.2f m over skroget, høyst tre firedeler av topplanternas %.2f (2(g)), og forut for den: %.1f m' % (SIDE[2] - hull, 0.75 * (MH_Z - hull), SIDE[0] - FMX), SIDE[2] - hull <= 0.75 * (MH_Z - hull) and SIDE[0] > FMX))
    sp = FISH_R - FISH_W
    out.append(('fiskelysene rødt over hvitt %.2f m fra hverandre (2(i)(ii): minst 2 m fra 20 m), det nederste %.2f over skroget (minst 4), %.2f over sidelysene (2(j): minst %.2f)' % (sp, FISH_W - hull, FISH_W - SIDE[2], 2 * sp),
                sp >= 2.0 and FISH_W - hull >= 4.0 and FISH_W - SIDE[2] >= 2 * sp))
    out.append(('topplanterna over fiskelysene (%.2f over det røde) og akterlyset %.2f m over vannet' % (MH_Z - FISH_R, STERN_L[2] - WL), MH_Z > FISH_R + 0.5))
    return out
def _ck_work():
    out = []; hx, hy, hz = hauler_at()
    out.append(('rekka %.2f m over teinedekket ved haleren (jigRail 0.35-1.3), blokka %.2f m utenfor siden og %.2f over rekka' % (GW - DK, -BLOCK[1] - ysh(BLOCK[0]), BLOCK[2] - GW), 0.9 <= GW - DK <= 1.3 and -BLOCK[1] - ysh(BLOCK[0]) > 0.6))
    out.append(('sorteringsbordet %.2f m høyt, %.2f over båndet; båndet %.2f m langt fra bordet til renna' % (TABLE_Z - DK, TABLE_Z - CONV_Z, CONV_X[1] - CONV_X[0]), 0.85 <= TABLE_Z - DK <= 1.0 and TABLE_Z > CONV_Z))
    clr = min(abs(sy - CONV_Y) - CONV_W / 2 - 0.66 for sy in STACK_Y); wk_ = STACK_Y[2] - STACK_Y[1] - 1.32
    side = yin(10.0, DK) - (STACK_Y[-1] + 0.66)
    out.append(('stablene: %d plasser (%d teiner), %.2f m fri gang langs båndet, %.2f i midtgangen, %.2f langs babord side' % (len(STACK_X) * len(STACK_Y), 12 * len(STACK_X) * len(STACK_Y), clr, wk_, side), clr >= 0.55 and wk_ >= 0.9 and side >= 0.55))
    top = DK + 0.62 + 11 * 0.16
    gap = min(abs(b - x) for b in BEAMS_X for x in STACK_X) - 0.35 - 0.06
    out.append(('stablene på tolv er %.2f m høye, %.2f m under shelterets tak, bjelkene mellom toppene (%.2f m fri); %.2f under kranbommen i støtta' % (top - DK, CEIL - top, gap, CR_PARK[2] - 0.25 - top), CEIL - top > 0.1 and gap > 0.1 and CR_PARK[2] - 0.25 - top > 0.2))
    rch = math.hypot((HATCH[0] + HATCH[1]) / 2 - CR_AX[0], (HATCH[2] + HATCH[3]) / 2 - CR_AX[1]); Lb = (V(CR_PARK) - V(CR_HEEL)).length
    out.append(('kranen: bommen %.1f m, %.1f m til lukas midte, %.1f m utenfor babord side og %.1f utenfor styrbord' % (Lb, rch, Lb - (ysh(CR_AX[0]) - CR_AX[1]), Lb - (ysh(CR_AX[0]) + CR_AX[1])), rch < Lb - 1.0 and Lb - (ysh(CR_AX[0]) + CR_AX[1]) > 1.0))
    tip = PROP[2] + PR; low = PROP[2] - PR
    out.append(('propellen Ø %.2f: %.2f m klaring til skroget over (%.0f %%), %.2f til skoen, %.2f til skjegget forut, %.2f til roret' % (2 * PR, z_low(PROP[0]) - tip, 100 * (z_low(PROP[0]) - tip) / (2 * PR), low - 0.16, X_KA - 0.14 - PROP[0] - 0.3, PROP[0] - 0.3 - RX_),
                z_low(PROP[0]) - tip > 0.2 * 2 * PR and low - 0.16 > 0.15 and X_KA - 0.14 - PROP[0] - 0.3 > 0.3 and PROP[0] - 0.3 - RX_ > 0.5))
    xm_ = XF - 0.11 * L
    out.append(('navnefeltene x %.2f-%.2f, z %.2f-%.2f; merket fra x %.2f forut for dem (11-19 %% fra stevnen; maletest)' % (NAME_X[0], NAME_X[1], NAME_Z[0], NAME_Z[1], XF - 0.19 * L), NAME_X[1] < XF - 0.19 * L))
    return out
CHECKS += [('broa', lambda: (lambda o: ('; '.join(s for s, _ in o), all(k for _, k in o)))(_ck_bridge())),
           ('lanternene', lambda: (lambda o: ('; '.join(s for s, _ in o), all(k for _, k in o)))(_ck_lights())),
           ('arbeidet', lambda: (lambda o: ('; '.join(s for s, _ in o), all(k for _, k in o)))(_ck_work()))]


SHOTS = [('bow3q', (82.0, -48.0, 18.0), (25.0, 0, 9.0), 35), ('stern3q', (-28.0, 34.0, 22.0), (18.0, 0, 10.0), 35), ('side', (25.0, -95, 10.0), (25.0, 0, 11.0), 35),
         ('above', (64.0, -42.0, 52.0), (24.0, 0, 9.0), 35), ('deck', (8.0, -26.0, 20.0), (18.0, 0, 10.0), 35)]
ZC = DK
K5 = ((15.0, -3.4, DK + 1.75), (24.0, -4.2, DK + 1.2))   # on the pot deck by the conveyor, looking forward at the table and the portal
EYE = (SKIP[0], SKIP[1], WF + EYE_H)
CLOSE = [('c_helm', (40.3, 0.2, WF + 1.9), (42.3, -0.8, WF + 0.9), 30, False, False), ('c_wh', (55.0, -22.0, 20.0), (39.5, -1.0, 16.5), 30, True, False),
         ('c_stern', (-16.0, -11.0, 11.0), (1.0, -1.0, 9.0), 32, True, False), ('c_bow', (62.0, -14.0, 11.0), (46.5, 0, 9.0), 30, True, False),
         ('c_aperture', (3.0, -8.0, 2.0), (3.0, 0, 2.0), 30, False, False), ('c_portal', (30.0, -18.0, 15.0), (23.0, -4.0, 11.0), 30, True, False),
         ('c_potdeck', (24.0, 2.0, DK + 4.5), (10.0, -1.0, DK + 0.8), 30, False, False), ('c_shelter', (18.0, 8.0, 18.0), (8.0, 0.0, 13.0), 30, True, False),
         ('c_fore', (40.0, 6.0, 19.5), (47.0, 0, 13.0), 32, True, False), ('c_rig', (52.0, -16.0, 26.0), (38.0, 0.0, 20.0), 35, True, False),
         ('c_chute', (-5.0, -9.0, 10.5), (0.5, -3.8, 9.4), 30, True, False), ('c_crane', (20.0, 12.0, 17.0), (24.0, 3.0, 12.0), 32, True, False),
         ('K6p', (25.0 + 120.0, 90.0, 12.0), (25.0, 0, 10.0), 100, True, True)]

def main():
    os.makedirs(OUT, exist_ok=True)
    if 'check' in sys.argv: sys.exit(0 if check() else 1)
    check()
    reset(); colours()
    solids, glass = build(True)
    join(solids, 'BOAT0'); join(glass, 'GLASS0')
    if 'fast' not in sys.argv and 'dry' not in sys.argv: beauty(OUT, 'kr', WL, SHOTS)
    ex = {'frame': 'kystfiske: x starboard, y up from the waterline, z aft; metres', 'type': 'snokrabbe', 'name': 'Snow crab pot vessel 50 m',
          'len': L, 'beam': BEAM, 'draft': DRAFT, 'anchors': anchors()}
    hg = to_game(HINGE)
    CPC = []; CP = lambda: CPC[0] if CPC else (CPC.append(crane_parts(True)) or CPC[0])
    export_boat(build, to_game, to_game_n, OUT, 'krabbe50.glb', os.path.join(ROOT, 'src', 'data', 'boat-krabbe50.b64'), ex,
                side=(os.path.join(ROOT, 'src', 'data', 'boat-krabbe50-side.b64'), 25.0, 11.0, 56.0), dry='dry' in sys.argv,
                more=[{'name': 'hatch', 'obj': lambda: hatch_lid(True), 'xf_p': lambda p: tuple(a - b for a, b in zip(to_game(p), hg)), 'ao': True, 'show': True}] +
                     [{'name': nm, 'obj': (lambda i=i: CP()[i]), 'xf_p': (lambda p, o=o: tuple(a - b for a, b in zip(to_game(p), o))), 'ao': True, 'show': True}
                      for i, (nm, o) in enumerate((('crane_head', to_game(CR_AX)), ('crane_boom', to_game(CR_HEEL)), ('crane_block', to_game((0.0, 0.0, 0.0)))))])


if __name__ == '__main__':
    main()
