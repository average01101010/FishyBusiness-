"""The first boat: Father's old 23 ft wooden boat with an inboard semi-diesel (Jonas 05.10.2026: «Lag en blender modell av den første
båten spillerne skal få. Det er en 23fot trebåt med innenbords semidiesel ... Den må se slitt og gammel ut», with photos of clinker-built
Norwegian snekker). Rebuilt 31.10.2026 after the pilot boat's way of working (docs/skipsmodeller/trebat-grunnlag.md, sulebas-bygging.md;
Jonas: «Løft den til samme nivå og arbeidsmåte som pilotbåten», «ganske simpel», no life raft and no lifebuoy).

Worn: bare old wood outside (Jonas: «Kan du gjøre båten trefarget? Gammelt trevirke»), silvered in patches, dark where wet, rust run
from the fittings, slime at the waterline, the bottom tarred; grey weathered wood inside. No fenders («Fjern fenderne»), no stem band.
A double-ender (spissgatter), clinker built with nine strakes a side: the hull is ONE surface, the lands a step in it (the plank's
edge), the laps bevelled away into the rabbet at the hood ends (the gains), copper rivets along every land and through every frame.
The backbone (keel, stem, deadwood, sternpost) is a profile with the propeller's aperture cut through it as a real hole, the rudder
hung on the after post. Inside: bent frames, the floors, the floorboards, three thwarts on their risers with knees, a small foredeck
and the stern seat's deck, the engine box with the cylinder and its hot bulb up through a real hole in the lid, the exhaust with its
silencer, the flywheel. The old tarpaulin (Father's letter: «en slitt presenning») on the foredeck, the oars, the gutting table
across the port gunwale. Nothing that can be bought is modelled in (the game sets the deck kit at the places in kit, 19.10.2026).
The propeller is a part of its own (it turns in the game), and so are the tiller, the rudder and the flag pole on the rudder head
(they swing together), and the exhaust's mouth is an anchor (the black puffs at each firing).

There is no drawing and no photograph of this boat (Jonas 31.10.2026). The measures in the tables come from the game's data (length
7.00, beam 2.26, draft 0.62, displacement 1.9 t) and common measures of the type (grunnlaget kap. 4.0); check() at the end compares
the model with them.

    pip install bpy==4.5.4   (Python 3.11)
    python3 tools/boats/snekke23.py            -> src/data/boat-snekke23.b64 (+ the side picture), renders in tools/boats/out/
    python3 tools/boats/snekke23.py fast dry   -> no renders to look at, and the GLB only in tools/boats/out
    python3 tools/boats/snekke23.py check      -> the checks against the tables only

Frame: x forward from the sternpost's aft face at the sheer, y to port, z up from the bottom of the keel; the waterline is z = WL."""
import os, sys, math, random, bisect
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy, bmesh
from bpyutil import *
import fittings as F
from mathutils import noise

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE)); OUT = os.path.join(HERE, 'out')
L = 7.0; BEAM = 2.26; WL = 0.62; XM = 3.4   # 23 ft; the waterline 0.62 m over the keel's bottom; the game's origin amidships
DISP = 1.9                                   # tonnes (VESSELS.trebat)
SID = 0.045                                  # half the siding of the keel, stem and posts: the planking lands in the rabbet at y = SID
NSTRAKE = 9; PLANK = 0.018; LAP = 0.020      # nine strakes a side, the plank's thickness, the land's step
Z_FLOOR = 0.66                               # the floorboards, just above the waterline (the game draws the sea over anything below it)
ENG = (2.30, 3.25, 0.42, 1.20)               # the engine box: x0, x1, half-width, top
CYL = (2.95, 0.05)                           # the cylinder's axis (x, y)
EXH = (2.46, -0.27, 1.92)                    # the exhaust's mouth
PROP = (0.43, 0.0, 0.29); PROP_R = 0.19      # the propeller's hub and radius (16 in, a common size for 8 hp at 800 rpm)
APER = (0.29, 0.58, 0.05, 0.52)              # the aperture in the deadwood: x0, x1, z0, z1
POST_TOP = 1.66; STEM_TOP = 1.84             # the heads of the sternpost and the stem
SEAT = 1.02                                  # the aft thwart's top, where the skipper sits
POLE_TOP = (-0.13, 0.0, 2.66)                # the ensign staff's top on the rudder head: above the all-round light, so the game takes her
                                             # for a boat without a mast and flies no pennant (13-instruments.js mastTop, penshot)
C = {}


# ---------- tables ----------
class Tab:
    """a monotone cubic through (x, y) pairs (as bpyutil.interp, Fritsch-Carlson), with its slopes worked out once"""
    def __init__(s, tab):
        tab = sorted(tab); s.xs = [p[0] for p in tab]; s.ys = [p[1] for p in tab]; n = len(tab); xs, ys = s.xs, s.ys
        d = [(ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]) for i in range(n - 1)]
        m = [d[0]] + [0 if d[i - 1] * d[i] <= 0 else (d[i - 1] + d[i]) / 2 for i in range(1, n - 1)] + [d[-1]]
        for i in range(n - 1):
            if d[i] == 0: m[i] = m[i + 1] = 0
            else:
                a = m[i] / d[i]; b = m[i + 1] / d[i]; q = a * a + b * b
                if q > 9: t = 3 / math.sqrt(q); m[i] = t * a * d[i]; m[i + 1] = t * b * d[i]
        s.m = m
    def __call__(s, x):
        xs, ys, m = s.xs, s.ys, s.m
        if x <= xs[0]: return ys[0]
        if x >= xs[-1]: return ys[-1]
        i = bisect.bisect_right(xs, x) - 1; h = xs[i + 1] - xs[i]; t = (x - xs[i]) / h
        return ys[i] * (2 * t ** 3 - 3 * t ** 2 + 1) + h * m[i] * (t ** 3 - 2 * t ** 2 + t) + ys[i + 1] * (-2 * t ** 3 + 3 * t ** 2) + h * m[i + 1] * (t ** 3 - t ** 2)

def ss(a, b, x):
    t = max(0.0, min(1.0, (x - a) / (b - a))); return t * t * (3 - 2 * t)


# ---------- the lines (metres; grunnlaget kap. 4.0) ----------
# the stem's fore face, z -> x: a curved forefoot from the keel at 5.40 m up to a near-upright stem head at 7.02 m (the length over all)
STEMF = Tab([(0.0, 5.40), (0.02, 5.70), (0.06, 5.95), (0.13, 6.20), (0.25, 6.45), (0.42, 6.66), (0.65, 6.83), (0.95, 6.94), (1.30, 6.99), (STEM_TOP, 7.02)])
def stem_mw(z): return 0.16 + (0.085 - 0.16) * min(1.0, max(0.0, z) / STEM_TOP)       # the stem's moulded width, 16 cm at the forefoot
# the sternpost: raked, its aft face from the heel at 0.16 m up to the head over the sheer; the rabbet 9.5 cm in from the aft face
def post_aft(z): return 0.16 - 0.165 * z / POST_TOP
POST_RB = 0.095
RUD_OFF = 0.018                              # the rudder's leading edge aft of the post (the gudgeons between)
TILLER = ((round(post_aft(1.70) - RUD_OFF - 0.03, 3), 0.0, 1.70), (1.05, 0.0, 1.42))   # the tiller from the rudder head to the grip
ZS_A, ZS_F = 1.58, 1.74                      # the sheer at the planking's ends: the sternpost and the stem
ZR_K = 0.22                                  # the rabbet along the keel amidships (the keel's depth under the garboard; 22 cm
                                             # brings the canoe body's volume to the displacement, check())

def _rabbet():
    """the rabbet, where the planking lands on the backbone, as (x, z): up the sternpost, along the deadwood (high aft, over the
    aperture), along the keel, and up the stem 'the moulded width' in from its fore face"""
    pts = [(post_aft(z) + POST_RB, z) for z in [0.68 + (ZS_A - 0.68) * i / 40 for i in range(41)]]
    pts += [(0.30, 0.665), (0.60, 0.60), (0.90, 0.48), (1.20, 0.36), (1.60, 0.25), (2.10, 0.24), (2.70, ZR_K), (5.00, ZR_K)]
    fwd = []; prev = None
    for i in range(241):
        z = STEM_TOP * i / 240; x = STEMF(z); dz = 0.004; x1 = STEMF(z + dz); x0 = STEMF(max(0.0, z - dz))
        tx, tz = x1 - x0, (z + dz) - max(0.0, z - dz); ln = math.hypot(tx, tz); nx, nz = -tz / ln, tx / ln     # inward: aft and up
        p = (x + nx * stem_mw(z), z + nz * stem_mw(z))
        if p[1] < ZR_K + 0.01 or p[0] <= 5.05: continue
        if p[1] >= ZS_F:
            if prev is not None:
                t = (ZS_F - prev[1]) / (p[1] - prev[1]); fwd.append((prev[0] + (p[0] - prev[0]) * t, ZS_F))
            break
        if prev is None or p[0] > prev[0] + 1e-4: fwd.append(p); prev = p
    return pts + fwd
RBP = _rabbet()
XA0 = min(p[0] for p in RBP)                                       # the sternpost's rabbet at the sheer
XF0 = max(p[0] for p in RBP)                                       # the stem's rabbet at the sheer
zr = Tab(RBP)
# the sheer over the keel's bottom: 0.39 m of spring aft, 0.55 m forward; the freeboard amidships 0.57 m
zs = Tab([(XA0, ZS_A), (0.5, 1.48), (1.0, 1.38), (1.7, 1.29), (2.4, 1.235), (3.4, 1.19), (4.4, 1.215), (5.2, 1.29), (5.8, 1.39), (6.4, 1.55), (XF0, ZS_F)])
# the half-breadth at the sheer, outside the planking: 1.13 m amidships (the beam 2.26); a fuller end aft than forward
_HB = Tab([(XA0, SID), (0.3, 0.36), (0.7, 0.72), (1.4, 0.99), (2.4, 1.11), (3.4, 1.13), (4.4, 1.08), (5.2, 0.93), (5.9, 0.66), (6.4, 0.42), (6.75, 0.20), (XF0, SID)])
def hb(x): return max(SID, _HB(x))

SEC_P = [0.95, 1.0, 1.3, 0.9, 0.35]             # the sections' shape: the exponents across and up (ends + amidships), the deadrise
def sec(x, t):
    """a point (y, z) on the outside of the planking at station x, t from the rabbet (0) to the sheer (1), the laps left out: a slack
    bilge amidships, a hollow garboard and a V toward the ends"""
    h = hb(x); z0 = zr(x); z1 = zs(x); full = min(1.0, (h - SID) / 1.0); ny = SEC_P[0] + SEC_P[1] * full; nz = SEC_P[2] + SEC_P[3] * full; th = t * math.pi / 2
    y = SID + (h - SID) * math.sin(th) ** (2 / ny)
    z = z0 + (z1 - z0) * (1 - math.cos(th) ** (2 / nz))
    z += SEC_P[4] * full * math.sin(th) ** 1.2 * (1 - t) ** 1.5              # the garboard's rise off the keel (deadrise)
    return y, z

def sec_n(x, t):
    """the outward normal (ny, nz) of the planking at station x, t (in the station's plane)"""
    a = sec(x, max(0.0, t - 0.01)); b = sec(x, min(1.0, t + 0.01)); dy, dz = b[0] - a[0], b[1] - a[1]; l = math.hypot(dy, dz) or 1.0
    return dz / l, -dy / l

def nrm3(x, t):
    """the outward normal in 3D (port side), from the surface's slopes along and across"""
    dx = 0.004; a = V((x - dx, *sec(max(XA0 + 1e-4, x - dx), t))); b = V((x + dx, *sec(min(XF0 - 1e-4, x + dx), t)))
    dt = 0.004; c = V((x, *sec(x, max(0.0, t - dt)))); d = V((x, *sec(x, min(1.0, t + dt))))
    n = (b - a).cross(d - c)
    if n.length < 1e-9: ny, nz = sec_n(x, t); return V((0, ny, nz))
    n.normalize()
    return n if n.y >= 0 else -n

# the stations: close at the ends, where the rabbet climbs the stem and the sternpost
def stations(n):
    return [XA0 + 0.0015 + (XF0 - XA0 - 0.003) * (1 - math.cos(math.pi * i / n)) / 2 for i in range(n + 1)]
XS = stations(160)

# the strakes: their widths amidships as shares of the girth (the garboard and the sheer strake a little wider); each plank's hood
# end lands on the rabbet at its own height (nine landings evenly up the stem and up the deadwood and sternpost aft)
W_ST = [1.10, 1.04, 1.0, 0.98, 0.97, 0.97, 0.99, 1.0, 1.06]
FC = [sum(W_ST[:k]) / sum(W_ST) for k in range(NSTRAKE + 1)]
def eaten(x):
    """the share of the strakes that have landed on the rabbet aft of / forward of station x (0 amidships)"""
    z = zr(x)
    if x > 3.0: return max(0.0, min(1.0, (z - ZR_K) / (ZS_F - ZR_K)))
    return max(0.0, min(1.0, (z - ZR_K) / (ZS_A - ZR_K)))
def _fe(e):
    k = min(NSTRAKE - 1, int(e * NSTRAKE)); f = e * NSTRAKE - k; return FC[k] + (FC[k + 1] - FC[k]) * f
def land_g(x, k):
    """land k's place as a share of the girth at station x (0 the rabbet, 1 the sheer)"""
    fe = _fe(eaten(x)); return max(0.0, min(1.0, (FC[k] - fe) / max(1e-6, 1 - fe)))

_GT = {}
def girth_t(x):
    """t at a share of the girth, for station x (a table of 121 points along the section)"""
    if x in _GT: return _GT[x]
    ts = [i / 120 for i in range(121)]; P = [sec(x, t) for t in ts]; S = [0.0]
    for a, b in zip(P, P[1:]): S.append(S[-1] + math.hypot(b[0] - a[0], b[1] - a[1]))
    tot = S[-1] or 1.0; G = [s / tot for s in S]
    def f(g):
        i = min(119, max(0, bisect.bisect_right(G, g) - 1)); d = G[i + 1] - G[i]
        return ts[i] + (ts[i + 1] - ts[i]) * ((g - G[i]) / d if d > 1e-12 else 0.0)
    _GT[x] = f; return f

def _land_end(k, fwd):
    """the station where land k reaches the rabbet (forward or aft)"""
    target = k / NSTRAKE
    lo, hi = (3.0, XF0) if fwd else (XA0, 3.0)
    for _ in range(40):
        m = (lo + hi) / 2; e = eaten(m)
        if (e < target) == fwd: lo = m
        else: hi = m
    return (lo + hi) / 2
LAND_END = [(_land_end(k, False), _land_end(k, True)) for k in range(NSTRAKE + 1)]
def lap(x, k):
    """the step of land k (the lower edge of strake k) at station x, bevelled away over the last 0.45 m before the rabbet (the gains)"""
    if k == 0: return 0.0
    a, f = LAND_END[k]; return LAP * ss(0.0, 0.45, f - x) * ss(0.0, 0.45, x - a)


# ---------- colours ----------
def colours():
    w = lambda n, rgb, g=0.15, z=0: C.__setitem__(n, mat(n, rgb, g, zone=z))
    # bare old wood outside (Jonas 05.10.2026), a shade apart per plank; the planks are paint zone 1 (the paint shop paints over them,
    # the lands stay dark between); the bottom tarred
    w('hull', (0.42, 0.32, 0.22), 0.12, 1); w('hull2', (0.37, 0.28, 0.19), 0.12, 1); w('hull3', (0.46, 0.36, 0.26), 0.1, 1); w('hull_e', (0.24, 0.18, 0.12), 0.1, 1)
    w('hulltop', (0.30, 0.22, 0.15), 0.2, 1); w('post', (0.36, 0.28, 0.20), 0.12)
    w('chip', (0.40, 0.33, 0.25)); w('chip2', (0.34, 0.27, 0.20))
    w('anti', (0.14, 0.11, 0.09), 0.3); w('anti2', (0.17, 0.13, 0.10), 0.25); w('slime', (0.22, 0.27, 0.14), 0.35)
    w('rust', (0.33, 0.17, 0.09), 0.2); w('iron', (0.13, 0.13, 0.14), 0.35); w('brass', (0.55, 0.44, 0.22), 0.6); w('copper', (0.42, 0.30, 0.20), 0.5); w('rivet', (0.38, 0.30, 0.22), 0.45, 1)
    w('wood_in', (0.40, 0.37, 0.32)); w('wood_in2', (0.35, 0.32, 0.28)); w('wood_dk', (0.27, 0.24, 0.21)); w('bilge', (0.26, 0.23, 0.19), 0.3)
    w('rail', (0.28, 0.21, 0.15), 0.2); w('canvas', (0.36, 0.40, 0.33), 0.08); w('canvas2', (0.30, 0.34, 0.28), 0.08)
    w('crate3', (0.58, 0.56, 0.50), 0.25); w('table', (0.62, 0.58, 0.50), 0.1); w('steel', (0.62, 0.64, 0.66), 0.7); w('stone', (0.30, 0.31, 0.33), 0.2); w('bronze', (0.48, 0.36, 0.20), 0.6); w('rope', (0.55, 0.48, 0.35))
    w('soot', (0.06, 0.06, 0.06), 0.1); w('dark', (0.05, 0.05, 0.05), 0.1)
    # the lanterns' coloured glass (lanterns as geometry, typed in the anchors)
    w('lampR', (0.85, 0.08, 0.06), 0.7); w('lampG', (0.08, 0.75, 0.30), 0.7); w('lampW', (0.95, 0.93, 0.85), 0.7)
    C['glass'] = mat('glass', (0.07, 0.09, 0.10), 0.9)


def n3(x, y, z=0.0): return noise.noise(V((x, y, z)))

HULLW = ('hull', 'hull2', 'hull3')
OUTER = HULLW + ('hulltop', 'hull_e')
GREY = (0.47, 0.44, 0.39)        # wood gone silver in the sun and the salt
def toward(m, rgb, k):
    base = m['rgb']; return [1 + (rgb[i] / max(base[i], 1e-3) - 1) * k for i in range(3)]

def wear(p, m, n):
    """the wear at a corner, as a multiplier of its colour, so it runs across faces: the wood gone grey (most at the waterline, under
    the rail and at the ends), grime and rust running down from the rail and the rivets, dark where wet; the wood inside dark low down;
    soot round the exhaust; rusty iron"""
    x, y, z = p; nm = m.name; side = 1 if y > 0 else -1
    if nm in OUTER or nm in ('post', 'chip', 'chip2'):
        e = n3(x * 1.6 + side * 7.3, z * 4.0, side) + 0.4 * n3(x * 5.3, z * 12.0, 2 + side)
        t = toward(m, GREY, min(0.85, ss(-0.1, 0.45, e) * 0.7 + 0.35 * ss(0.35, 0.0, zs(min(max(x, XA0), XF0)) - z)))   # silvered in patches and up top
        g = 1 - 0.3 * ss(0.28, 0.0, z - WL)                                                               # dark where it is wet
        g *= 1 - 0.2 * ss(0.15, 0.55, n3(x * 14.0, side * 3.1, 0.7)) * ss(0.5, 0.05, zs(min(max(x, XA0), XF0)) - z)   # streaks from the rail
        r = ss(0.35, 0.75, n3(x * 9.0, side * 2.2, 3.3)) * ss(0.45, 0.1, zs(min(max(x, XA0), XF0)) - z) * 0.5          # rust runs from the rivets
        g *= 0.9 + 0.12 * n3(x * 8.0, z * 20.0, side * 1.7)
        c = [t[0] * g, t[1] * g, t[2] * g]
        if r > 0.01: c = [c[i] * (1 + ((0.33, 0.17, 0.09)[i] / max(m['rgb'][i], 1e-3) - 1) * r) for i in range(3)]
        return c
    if nm in ('anti', 'anti2', 'slime'):
        v = 0.86 + 0.22 * n3(x * 2.5, z * 6.0, y * 2.0) + 0.18 * ss(WL - 0.25, WL, z)
        if nm == 'slime': g = 0.5 + 0.5 * ss(-0.3, 0.4, n3(x * 3.0, side * 1.3, 4.1)); return [v * (1.1 - 0.2 * g), v * (0.95 + 0.1 * g), v * (0.9 - 0.15 * g)]
        return [v, v, v]
    if nm in ('wood_in', 'wood_in2', 'wood_dk', 'rail', 'bilge', 'table'):
        g = 1 - 0.16 * ss(0.95, 0.45, z); v = g * (0.88 + 0.16 * n3(x * 3.1, y * 3.1, z * 3.1) + 0.07 * n3(x * 11.0, y * 11.0, z * 11.0))
        if n.z > 0.7 and nm not in ('table', 'bilge'): v *= 1.07
        if nm == 'rail': v *= 1 + 0.18 * ss(0.2, 0.6, n3(x * 6.0, side, 9.0))                           # the gunwale worn pale by hands and lines
        return [v, v * 0.98, v * 0.95]
    if nm in ('iron', 'rust'):
        c = toward(m, (0.30, 0.16, 0.08), ss(0.05, 0.45, n3(x * 5.0, y * 5.0, z * 5.0)))
        if nm == 'iron':
            s_ = ss(0.45, 0.0, (V((x, y, z)) - V(EXH)).length); c = [ci * (1 - 0.6 * s_) for ci in c]      # soot at the exhaust's mouth
        return c
    if nm in ('rivet', 'copper'):
        return toward(m, (0.22, 0.36, 0.30), ss(-0.2, 0.5, n3(x * 7.0, y * 7.0, z * 7.0)) * 0.6)         # verdigris
    if nm.startswith('crate') or nm.startswith('canvas'):
        v = (0.82 + 0.2 * n3(x * 6.0, y * 6.0, z * 6.0)) * (1 - 0.25 * ss(0.15, 0.0, z - Z_FLOOR)); return [v, v, v * 0.96]
    return None

def tint_obj(o, tintf=wear):
    """the per-corner wear (Acc.done's TINT) on an object made otherwise (the backbone after its boolean)"""
    bm = bmesh.new(); bm.from_mesh(o.data); lay = bm.loops.layers.float_color.new('TINT'); mats = [s.material for s in o.material_slots]
    for fc in bm.faces:
        m = mats[fc.material_index]; fc.normal_update()
        for l in fc.loops:
            t = tintf(l.vert.co, m, fc.normal)
            if t is not None: l[lay] = (t[0], t[1], t[2], 1.0)
    bm.to_mesh(o.data); bm.free(); return o


# ---------- the hull: one surface a side, the lands a step in it ----------
ROWS_FINE = [(0.0, 0.55), (0.05, 0.97), (0.35, 0.65), (0.70, 0.30), (1.0, 0.0)]      # (share across the plank, share of the land's step)
ROWS_IN = [(0.0, 0.55), (0.06, 0.94), (0.55, 0.45), (1.0, 0.0)]
def plank_mat(x, k, side):
    """each plank a shade of its own, changing at its scarf (a different station on each plank and side)"""
    if k == NSTRAKE - 1: return C['hulltop']
    seg = 0 if x < 2.0 + (k * 0.73 + (side > 0) * 1.1) % 2.8 else 1
    return C[HULLW[(k * 2 + seg + (side > 0)) % 3]]

def hull_point(x, k, f, s_off, side, inner=False):
    """the point on strake k at the share f across it at station x, pushed out along the normal by the land's step"""
    gt = girth_t(x); g0, g1 = land_g(x, k), land_g(x, k + 1); t = gt(g0 + (g1 - g0) * f)
    y, z = sec(x, t); n = nrm3(x, t); o = lap(x, k) * s_off - (PLANK if inner else 0.0)
    return V((x, side * (y + n.y * o), z + n.z * o)), V((n.x, side * n.y, n.z))

def hull(fine=True):
    """the planking: the outside and the inside of each side as one grid each, rows by the strakes (a pair of rows at each land with the
    plank's edge between them), the sheer's top edge joining them; cut along the waterline so the tar and the slime have sharp edges"""
    A = Acc('hull')
    if fine:
        xs = XS; RO = [(k, f, so) for k in range(NSTRAKE) for f, so in ROWS_FINE]; RI = [(k, f, so) for k in range(NSTRAKE) for f, so in ROWS_IN]
    else:
        xs = stations(24); RO = [(k, 0.0, 0.0) for k in (0, 2, 4, 6, 8)] + [(8, 1.0, 0.0)]; RI = [(0, 0.0, 0.0), (4, 0.0, 0.0), (8, 1.0, 0.0)]
    def grid(side, R, inner):
        G = []; N = []
        for x in xs:
            row = []; nr = []
            for k, f, so in R:
                p, n = hull_point(x, k, f, so, side, inner); row.append(A.v(p)); nr.append(n)
            G.append(row); N.append(nr)
        return G, N
    for side in (1, -1):
        (Go, No), (Gi, Ni) = grid(side, RO, False), grid(side, RI, True)
        for i in range(len(xs) - 1):
            xc = (xs[i] + xs[i + 1]) / 2
            for j in range(len(RO) - 1):
                q = [Go[i][j], Go[i + 1][j], Go[i + 1][j + 1], Go[i][j + 1]]; (ka, fa, _), (kb, fb, _) = RO[j], RO[j + 1]
                if kb == ka + 1 and fa == 1.0 and fb == 0.0:             # the next plank's lower edge over this one's top
                    A.f(q, C['hull_e'], Go[i][j].co - Go[i][max(0, j - 1)].co if j else -No[i][j])
                else: A.f(q, plank_mat(xc, ka, side), No[i][j] + No[i + 1][j + 1])
            for j in range(len(RI) - 1):
                q = [Gi[i][j], Gi[i + 1][j], Gi[i + 1][j + 1], Gi[i][j + 1]]; (ka, fa, _), (kb, fb, _) = RI[j], RI[j + 1]
                if kb == ka + 1 and fa == 1.0 and fb == 0.0:
                    A.f(q, C['wood_dk'], Gi[i][min(len(RI) - 1, j + 2)].co - Gi[i][j + 1].co)
                else:
                    zc = q[0].co.z; m = C['bilge'] if zc < Z_FLOOR - 0.02 else C['wood_in'] if n3(xc * 2, ka * 0.9, side) > -0.05 else C['wood_in2']
                    A.f(q, m, -(Ni[i][j] + Ni[i + 1][j + 1]))
            A.f([Go[i][-1], Go[i + 1][-1], Gi[i + 1][-1], Gi[i][-1]], C['hulltop'], (0, 0, 1))
    bm = A.bm
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-6)
    bmesh.ops.dissolve_degenerate(bm, edges=bm.edges, dist=1e-6)
    # the waterline: the tar below, a band of slime and weed at it, both cut along the plane so their edges are sharp
    zt, zb = WL - 0.02, WL + 0.035
    for zc in (zt, zb):
        bmesh.ops.bisect_plane(bm, geom=list(bm.verts) + list(bm.edges) + list(bm.faces), plane_co=(0, 0, zc), plane_no=(0, 0, 1))
    outer = {A.mi(C[n]) for n in OUTER}
    for fc in bm.faces:
        if fc.material_index not in outer: continue
        c = fc.calc_center_median()
        if c.z < zt: fc.material_index = A.mi(C['anti'] if n3(c.x * 1.3, c.z * 4, c.y) > -0.15 else C['anti2'])
        elif c.z < zb: fc.material_index = A.mi(C['slime'])
    return A.done(40, tint=wear)


def rivets(A):
    """copper rivets: along every land at every frame, and through every plank into the frame (two rows), as small domes"""
    for x in FRAMES:
        for side in (1, -1):
            for k in range(NSTRAKE):
                g0, g1 = land_g(x, k), land_g(x, k + 1)
                if g1 - g0 < 0.02: continue
                for f, so in ((0.12, 0.89), (0.55, 0.45)) if k > 0 else ((0.55, 0.45),):
                    if k > 0 and f == 0.12 and lap(x, k) < 0.004: continue
                    p, n = hull_point(x, k, f, so, side); n.normalize(); r, u, nn = F._onb(n); s = 0.0065
                    base = [p + r * s + u * s, p - r * s + u * s, p - r * s - u * s, p + r * s - u * s]; tip = p + nn * 0.0045
                    vs = [A.v(q) for q in base]; tv = A.v(tip)
                    for a in range(4): A.f([vs[a], vs[(a + 1) % 4], tv], C['rivet'], (vs[a].co + vs[(a + 1) % 4].co) / 2 + nn * 0.002 - p)


# ---------- the backbone: keel, stem, deadwood and sternpost, the aperture cut through ----------
def _rb_dense(n=400):
    """the rabbet from the stem's top round to the sternpost's top, densely"""
    out = []
    for i in range(n):
        x = XF0 - (XF0 - XA0) * (1 - math.cos(math.pi * i / (n - 1))) / 2; out.append((x, zr(x)))
    return out

def prism_xz(name, poly, y0, y1, m):
    """a polygon in the xz plane extruded from y0 to y1"""
    bm = bmesh.new(); a = [bm.verts.new((x, y0, z)) for x, z in poly]; b = [bm.verts.new((x, y1, z)) for x, z in poly]
    bm.faces.new(a); bm.faces.new(b[::-1]); n = len(poly)
    for i in range(n):
        j = (i + 1) % n
        try: bm.faces.new([a[i], a[j], b[j], b[i]])
        except ValueError: pass
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-6); bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return obj_from_bm(name, bm, [m])

def paint_heights(o, rules):
    """cut an object along the waterline's planes and give each face its material by its height: rules [(z_top, material)]"""
    me = o.data
    for _, m in rules:
        if m.name not in [s.name for s in me.materials]: me.materials.append(m)
    names = [s.name for s in me.materials]
    bm = bmesh.new(); bm.from_mesh(me)
    for zc, _ in rules[:-1]: bmesh.ops.bisect_plane(bm, geom=list(bm.verts) + list(bm.edges) + list(bm.faces), plane_co=(0, 0, zc), plane_no=(0, 0, 1))
    for fc in bm.faces:
        z = fc.calc_center_median().z
        for zc, m in rules:
            if z < zc: fc.material_index = names.index(m.name); break
    bm.to_mesh(me); bm.free()

def backbone(fine=True):
    """the keel, the stem with its forefoot, the deadwood and the sternpost as one profile sided 9 cm, from the rabbet out; the hog and
    apron inside the planking (narrower, so they never lie in the planking's plane); the aperture for the propeller cut through the
    deadwood between the inner and the after post, the edges rounded"""
    poly = [(0.16, 0.0)]
    poly += [(x, 0.0) for x in (1.0, 2.0, 3.0, 4.0, 5.0, 5.40)]
    ns = 60 if fine else 12
    poly += [(STEMF(z), z) for z in [STEM_TOP * i / ns for i in range(1, ns + 1)]]
    poly += [(XF0 + 0.012, STEM_TOP)]
    poly += [p for p in _rb_dense(400 if fine else 60)]
    poly += [(XA0 + 0.01, POST_TOP), (post_aft(POST_TOP), POST_TOP)]
    poly += [(post_aft(z), z) for z in [POST_TOP * (1 - i / 12) for i in range(1, 12)]]
    clean = [poly[0]]
    for p in poly[1:]:
        if math.hypot(p[0] - clean[-1][0], p[1] - clean[-1][1]) > 2e-3: clean.append(p)
    o = prism_xz('backbone', clean, -SID, SID, C['post'])
    if fine:
        x0, x1, z0, z1 = APER; cut_poly = rrect((x0 + x1) / 2, (z0 + z1) / 2, x1 - x0, z1 - z0, 0.07, n=6)
        cutter = prism_xz('aper', cut_poly, -0.3, 0.3, C['dark']); cut(o, [cutter])
        md = o.modifiers.new('bev', 'BEVEL'); md.width = 0.012; md.segments = 2; md.limit_method = 'ANGLE'; md.angle_limit = math.radians(30); apply_all(o)
    paint_heights(o, [(WL - 0.02, C['anti2']), (WL + 0.035, C['slime']), (99, C['post'])])
    tint_obj(o); shade(o, 40)
    if not fine: return [o]
    # the hog along the keel and the apron up the stem and the inner post: a band inboard of the rabbet
    R = [p for p in _rb_dense() if XA0 + 0.06 < p[0] < XF0 - 0.04][::-1]
    band = []
    for i, (x, z) in enumerate(R):
        a = R[max(0, i - 1)]; b = R[min(len(R) - 1, i + 1)]; tx, tz = b[0] - a[0], b[1] - a[1]; l = math.hypot(tx, tz) or 1; nx, nz = -tz / l, tx / l
        band.append(((x - nx * 0.01, z - nz * 0.01), (x + nx * 0.075, z + nz * 0.075)))
    poly2 = [p for p, _ in band] + [q for _, q in band[::-1]]
    o2 = prism_xz('hog', poly2, -0.028, 0.028, C['wood_dk']); tint_obj(o2); shade(o2, 40)
    return [o, o2]

def underwater(A, fine=True):
    """the shaft from the inner post to the propeller with the stern tube's bronze boss; the gudgeons on the after post"""
    hx, hy, hz = PROP
    acyl(A, (hx + 0.03, 0, hz), (APER[1] + 0.03, 0, hz + 0.003), 0.022, lambda z: C['bronze'], 10)
    acyl(A, (APER[1] - 0.025, 0, hz + 0.002), (APER[1] + 0.005, 0, hz + 0.003), 0.045, lambda z: C['bronze'], 12)
    if not fine: return
    for zg in RUD_PINS:
        xa = post_aft(zg); d = V((-0.165, 0, POST_TOP)).normalized(); s = V((0, 1, 0)); o_ = d.cross(s).normalized()   # o_ points aft
        if o_.x > 0: o_ = -o_
        c = V((xa, 0, zg)) + o_ * 0.006
        obox(A, c, d * 0.03, s * (SID + 0.012), o_ * 0.006, C['rust'], skip=('-z',))
        for sg in (1, -1):
            obox(A, V((xa + 0.05, sg * (SID + 0.005), zg)), d * 0.03, V((0.06, 0, 0)), V((0, sg * 0.005, 0)), C['rust'], skip=('-z',))
            for bx in (0.03, 0.08): acyl(A, (xa + bx, sg * (SID + 0.009), zg), (xa + bx, sg * (SID + 0.014), zg), 0.008, lambda z: C['iron'], 6)


# ---------- the gunwale: the cap, the rubbing strake, the inwale ----------
def sweep(A, path, outs, prof, m, cap=True, scale=None):
    """a profile [(a, b)] swept along path, a along outs[i] (made square to the path) and b up, scaled by scale[i] (a, b); capped at
    both ends"""
    n = len(path); rings = []
    for i, p in enumerate(path):
        T = (path[min(i + 1, n - 1)] - path[max(i - 1, 0)]).normalized(); o = outs[i] - T * outs[i].dot(T); o.normalize(); u = T.cross(o)
        if u.z < 0: u = -u
        sa, sb = scale[i] if scale else (1.0, 1.0)
        rings.append((p, [A.v(p + o * (a * sa) + u * (b * sb)) for a, b in prof]))
    k = len(prof)
    for i in range(n - 1):
        (p, ra), (_, rb) = rings[i], rings[i + 1]
        for j in range(k):
            jj = (j + 1) % k; A.f([ra[j], rb[j], rb[jj], ra[jj]], m, (ra[j].co + rb[jj].co) / 2 - p)
    if cap:
        A.f(list(rings[0][1]), m, path[0] - path[1]); A.f(list(rings[-1][1]), m, path[-1] - path[-2])

def rprof(w, h, r, n=3):
    """a rounded rectangle's outline (a across, b up), centred on (0, 0)"""
    pts = []
    for cx, cy, a0 in ((w / 2 - r, h / 2 - r, 0), (-w / 2 + r, h / 2 - r, 90), (-w / 2 + r, -h / 2 + r, 180), (w / 2 - r, -h / 2 + r, 270)):
        for i in range(n + 1):
            a = math.radians(a0 + 90 * i / n); pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    return pts

def sheer_pt(x, side, inset=0.0, dz=0.0):
    """on the top of the sheer strake at station x (inset inboard from its outside)"""
    return V((x, side * (hb(x) - inset), zs(x) + dz))

def gunwale(A, fine=True):
    xs = [x for x in (XS[2:-2][::2] if fine else stations(30)[1:-1]) if hb(x) > 0.075]
    for side in (1, -1):
        # the cap (ripebordet) over the sheer strake and the inwale, 7.5 cm wide, a little proud outside; its underside 3 mm under the
        # sheer, so the planking's top edge is inside it (never two faces in one plane); it stops where the two sides would meet
        P = [sheer_pt(x, side, 0.026, 0.014) for x in xs]; O = [V((0, side, 0)) for x in xs]
        sweep(A, P, O, rprof(0.075, 0.034, 0.010, 2) if fine else [(0.0375, 0.017), (-0.0375, 0.017), (-0.0375, -0.017), (0.0375, -0.017)], C['rail'])
        if side == 1:
            # the breasthook and the stern's hook: a board over the sheer at each end, between the caps' ends and the stem and the post
            for xa, xb in ((XA0 + 0.012, xs[0] + 0.02), (xs[-1] - 0.02, XF0 - 0.012)):
                xe = [xa + (xb - xa) * i / 8 for i in range(9)]; zt = lambda x: zs(x) + 0.033; zb_ = lambda x: zs(x) - 0.006   # 2 mm proud of the caps: never one plane
                wy = lambda x: max(SID + 0.004, hb(x) + 0.0115)
                top = [(x, wy(x), zt(x)) for x in xe] + [(x, -wy(x), zt(x)) for x in xe[::-1]]
                bot = [(x, y, zb_(x)) for x, y, _ in top]
                A.poly(top, C['rail'], (0, 0, 1)); A.poly(bot, C['rail'], (0, 0, -1))
                for i in range(len(top)):
                    j = (i + 1) % len(top); A.poly([top[i], top[j], bot[j], bot[i]], C['rail'], ((top[i][0] + top[j][0]) / 2 - (xa + xb) / 2, (top[i][1] + top[j][1]) / 2, 0))
        if not fine: continue
        # the rubbing strake (skvettlista), half round, along the sheer strake's middle
        t_ = lambda x: girth_t(x)((land_g(x, NSTRAKE - 1) + 1.0) / 2)
        xr = [x for x in xs if 0.35 < x < XF0 - 0.25]
        P = []; O = []
        for x in xr:
            t = t_(x); y, z = sec(x, t); n = nrm3(x, t); o = lap(x, NSTRAKE - 1) * 0.5
            P.append(V((x, side * (y + n.y * o), z + n.z * o))); O.append(V((0, side * n.y, n.z)))
        S = [(ss(xr[0], xr[0] + 0.30, x) * ss(xr[-1], xr[-1] - 0.30, x),) * 2 for x in xr]      # tapered to nothing at its ends
        S = [(max(0.12, a), max(0.25, b)) for a, b in S]
        sweep(A, P, O, [(0.0, -0.017), (0.012, -0.013), (0.020, 0.0), (0.012, 0.013), (0.0, 0.017), (-0.004, 0.0)], C['rail'], scale=S)
        # the inwale (the sheer clamp inside, the frames' heads under it)
        xi = [x for x in xs if 0.76 < x < 6.22]
        P = []; O = []
        for x in xi:
            t = girth_t(x)(0.965); y, z = sec(x, t); n = nrm3(x, t)
            P.append(V((x, side * (y - n.y * (PLANK + 0.030)), z - n.z * (PLANK + 0.030)))); O.append(V((0, side * n.y, n.z)))
        sweep(A, P, O, rprof(0.040, 0.060, 0.008, 1), C['wood_dk'])


# ---------- inside: frames, floors, floorboards, thwarts, risers, knees, the decks ----------
FRAMES = [0.55 + 0.25 * i for i in range(24)]          # bent frames every 25 cm, 0.55 to 6.30 m

def inner_pt(x, t, d, side=1):
    """inboard of the planking's inside by d at station x, t (on the innermost points: the planks' upper edges)"""
    y, z = sec(x, t); n = nrm3(x, t); o = PLANK + d
    return V((x, side * (y - n.y * o), z - n.z * o)), V((0, side * n.y, n.z))

def inner_y(x, z):
    """the half-breadth of the planking's inside (its innermost face) at station x and height z"""
    def inz(t):
        y, zz = sec(x, t); n = sec_n(x, t); return y - n[0] * PLANK, zz - n[1] * PLANK
    lo, hi = 0.0, 1.0
    for _ in range(24):
        m = (lo + hi) / 2
        if inz(m)[1] < z: lo = m
        else: hi = m
    return inz(lo)[0]

def inner_hb(x, z):
    """the half-breadth of the inside at station x and height z (to the frames' faces)"""
    lo, hi = 0.0, 1.0
    for _ in range(18):
        m = (lo + hi) / 2
        if sec(x, m)[1] < z: lo = m
        else: hi = m
    y, _ = sec(x, lo); return max(0.0, y - PLANK - 0.04)

def frames(A, fine=True):
    """the bent frames from the keel up to the inwale, 45 x 32 mm; the floors across the keel at every other frame, seen where the
    floorboards end"""
    if not fine: return
    for i, x in enumerate(FRAMES):
        ttop = 0.95
        if x > 6.0 or x < 0.7:                                       # under the decks: the frame's head under the deck beam
            lo, hi = 0.0, 1.0
            for _ in range(20):
                m = (lo + hi) / 2
                if sec(x, m)[1] < zs(x) - 0.085: lo = m
                else: hi = m
            ttop = min(ttop, lo)
        for side in (1, -1):
            pts = []
            t0 = 0.06 if 1.5 < x < 5.6 else 0.16                         # the heel clear of the twisted garboard at the ends
            for j in range(19):
                t = t0 + (ttop - t0) * j / 18; p, n = inner_pt(x, t, 0.0, side)
                sl = abs(sec(x + 0.03, t)[0] - sec(x - 0.03, t)[0]) / 0.06       # where the side narrows along the boat, the frame's
                pts.append((p, n, 0.020 + 0.065 * sl))                          # narrow edge would cut the planking: set it in
            P = [p - n * d for p, n, d in pts]; O = [-n for _, n, _ in pts]
            sweep(A, P, O, [(-0.016, -0.0225), (0.016, -0.0225), (0.016, 0.0225), (-0.016, 0.0225)], C['wood_in2'])
        if i % 2 == 0:                                                # the floor: its sides follow the planking's inside, 5 mm off it
            z0 = zr(x) + 0.03; zt = min(Z_FLOOR - 0.03, zr(x) + 0.16)
            if zt - z0 < 0.04: continue
            zz = [z0 + (zt - z0) * j / 4 for j in range(5)]; ws = [max(0.02, min(inner_y(x - 0.025, z), inner_y(x + 0.025, z)) - 0.005) for z in zz]
            prof = [(-w, z) for w, z in zip(ws, zz)] + [(w, z) for w, z in zip(ws[::-1], zz[::-1])]
            for xx, out in ((x - 0.025, -1), (x + 0.025, 1)): A.poly([(xx, y, z) for y, z in prof], C['wood_dk'], (out, 0, 0))
            for (ya, za), (yb, zb) in zip(prof, prof[1:] + prof[:1]):
                A.poly([(x - 0.025, ya, za), (x + 0.025, ya, za), (x + 0.025, yb, zb), (x - 0.025, yb, zb)], C['wood_dk'], ((ya + yb) / 2, 0, (za + zb) / 2 - (z0 + zt) / 2))

def floorboards(A, fine=True):
    """the floorboards, loose and worn, a gap between each, their outer edges cut to the hull's shape; a cross batten under each end"""
    rr = random.Random(7); x0, x1 = 0.95, 5.55; y = -0.62; nx = 40 if fine else 5
    while y < 0.62:
        y0, y1 = y, y + 0.14; xs = [x0 + (x1 - x0) * i / nx for i in range(nx + 1)]; zz = Z_FLOOR + rr.uniform(-0.004, 0.006)
        m = rr.choice((C['wood_in'], C['wood_in2'], C['wood_in'], C['rail']))
        seg = []
        for x in xs:
            w = inner_hb(x, Z_FLOOR - 0.025)
            a, b = max(y0, -w), min(y1, w)
            seg.append((x, a, b) if b - a > 0.03 else None)
        run = [s for s in seg if s]
        if len(run) > 2:
            for (xa, a0, b0), (xb, a1, b1) in zip(run, run[1:]):
                A.poly([(xa, a0, zz), (xb, a1, zz), (xb, b1, zz), (xa, b0, zz)], m, (0, 0, 1))
                A.poly([(xa, a0, zz), (xb, a1, zz), (xb, a1, zz - 0.022), (xa, a0, zz - 0.022)], m, (0, -1, 0))
                A.poly([(xa, b0, zz), (xb, b1, zz), (xb, b1, zz - 0.022), (xa, b0, zz - 0.022)], m, (0, 1, 0))
            for (xa, a0, b0), out in ((run[0], -1), (run[-1], 1)):
                A.poly([(xa, a0, zz), (xa, b0, zz), (xa, b0, zz - 0.022), (xa, a0, zz - 0.022)], m, (out, 0, 0))
        y += 0.155
    if fine:
        for bx in (1.0, 5.5):
            w = min(inner_y(bx - 0.03, Z_FLOOR - 0.05), inner_y(bx + 0.03, Z_FLOOR - 0.05)) - 0.006; abox(A, bx - 0.03, bx + 0.03, -w, w, Z_FLOOR - 0.05, Z_FLOOR - 0.026, C['wood_dk'])

THWARTS = ((1.12, SEAT, 0.30), (4.25, 1.04, 0.25), (5.45, 1.08, 0.25))
def thwarts(A, fine=True):
    """the three thwarts (the aft one the skipper's) on the risers along each side, a hanging knee at each end up to the inwale"""
    for tx, tz, wd in THWARTS:
        hw = min(inner_hb(tx - wd / 2, tz - 0.04), inner_hb(tx + wd / 2, tz - 0.04)) + 0.002
        abox(A, tx - wd / 2, tx + wd / 2, -hw, hw, tz - 0.04, tz, C['wood_in'])
        if fine:
            for side in (1, -1):
                # the hanging knee: a board on the thwart against the side, its throat curved
                yi = side * (hw - 0.02); zt = zs(tx) - 0.08; zb = tz
                prof = [(0.0, 0.0), (0.22, 0.0), (0.13, 0.04), (0.06, 0.10), (0.02, 0.18), (0.0, zt - zb)]
                pts = [V((tx - 0.018, yi - side * a, zb + b)) for a, b in prof]
                A.poly(pts, C['wood_dk'], (-1, 0, 0)); A.poly([p + V((0.036, 0, 0)) for p in pts], C['wood_dk'], (1, 0, 0))
                for a, b in zip(pts, pts[1:] + pts[:1]): A.poly([a, b, b + V((0.036, 0, 0)), a + V((0.036, 0, 0))], C['wood_dk'], (a + b) / 2 - V((tx, yi - side * 0.06, zb + 0.06)))
    if not fine: return
    # the risers: a stringer along each side under the thwarts' ends
    xs = [x for x in XS if 0.85 < x < 5.75][::3]
    zr_ = Tab([(t[0], t[1] - 0.04) for t in THWARTS])
    for side in (1, -1):
        P = []; O = []
        for x in xs:
            z = zr_(x) - 0.025; w = inner_hb(x, z) - 0.006
            P.append(V((x, side * w, z))); O.append(V((0, side, 0)))
        sweep(A, P, O, rprof(0.024, 0.05, 0.005, 1), C['wood_dk'])

def decks(A, fine=True):
    """the small foredeck (fore and aft planks with their seams, the beam at its aft edge) and the stern seat's deck with its quarter
    knees"""
    nseg = 16 if fine else 3
    for x0, x1, dz, n in ((6.05, XF0 - 0.02, -0.025, 7 if fine else 1), (XA0 + 0.08, 0.66, -0.05, 6 if fine else 1)):
        xs = [x0 + (x1 - x0) * i / nseg for i in range(nseg + 1)]; w = lambda x: inner_hb(x, zs(x) + dz - 0.027) + 0.029
        for j in range(n):
            for i in range(nseg):
                a, b = xs[i], xs[i + 1]; wa, wb = w(a), w(b); fa0, fa1 = -1 + 2 * j / n, -1 + 2 * (j + 1) / n
                za = zs(a) + dz; zb = zs(b) + dz; g = 0.004
                q = [V((a, wa * fa0 + g, za)), V((b, wb * fa0 + g, zb)), V((b, wb * fa1 - g, zb)), V((a, wa * fa1 - g, za))]
                A.poly(q, C['wood_in2'] if (j + i // 6) % 2 else C['wood_in'], (0, 0, 1))
                if fine and i == 0: A.poly([q[0], q[3], q[3] - V((0, 0, 0.025)), q[0] - V((0, 0, 0.025))], C['wood_dk'], (-1, 0, 0))
                if fine and i == nseg - 1: A.poly([q[1], q[2], q[2] - V((0, 0, 0.025)), q[1] - V((0, 0, 0.025))], C['wood_dk'], (1, 0, 0))
            if fine:
                for i in range(nseg):
                    a, b = xs[i], xs[i + 1]
                    for f in (-1 + 2 * j / n,) if j else ():
                        za = zs(a) + dz - 0.003; zb = zs(b) + dz - 0.003
                        A.poly([V((a, w(a) * f - 0.004, za)), V((b, w(b) * f - 0.004, zb)), V((b, w(b) * f + 0.004, zb)), V((a, w(a) * f + 0.004, za))], C['dark'], (0, 0, 1))
        # the deck beam under the open edge
        xe = x0 if x0 > 3 else x1; we = w(xe + 0.03 if x0 > 3 else xe - 0.03) - 0.01
        abox(A, xe - 0.03, xe + 0.03, -we, we, zs(xe) + dz - 0.08, zs(xe) + dz - 0.026, C['wood_dk'])


# ---------- the engine: the box, the semi-diesel's cylinder and hot bulb through the lid, the exhaust, the flywheel ----------
def lid_board(A, x0, x1, y0, y1, z, t, hole, m, n=28):
    """a board with a round hole (hole = (x, y, r)): the top and the underside as rings from the board's edge to the hole, its
    edges, and the wall of the hole"""
    hx, hy, r = hole
    def edge_pt(a):
        dx, dy = math.cos(a), math.sin(a); ks = []
        if dx > 1e-9: ks.append((x1 - hx) / dx)
        if dx < -1e-9: ks.append((x0 - hx) / dx)
        if dy > 1e-9: ks.append((y1 - hy) / dy)
        if dy < -1e-9: ks.append((y0 - hy) / dy)
        k = min(ks); return (hx + dx * k, hy + dy * k)
    angs = [2 * math.pi * i / n for i in range(n)] + [math.atan2(cy - hy, cx - hx) for cx, cy in ((x0, y0), (x1, y0), (x1, y1), (x0, y1))]
    angs = sorted(a % (2 * math.pi) for a in angs)
    for zz, up in ((z, 1), (z - t, -1)):
        for i in range(len(angs)):
            a, b = angs[i], angs[(i + 1) % len(angs)]; ea, eb = edge_pt(a), edge_pt(b)
            A.poly([(hx + r * math.cos(a), hy + r * math.sin(a), zz), (hx + r * math.cos(b), hy + r * math.sin(b), zz), (eb[0], eb[1], zz), (ea[0], ea[1], zz)], m, (0, 0, up))
    for i in range(len(angs)):
        a, b = angs[i], angs[(i + 1) % len(angs)]
        pa, pb = (hx + r * math.cos(a), hy + r * math.sin(a)), (hx + r * math.cos(b), hy + r * math.sin(b))
        A.poly([(pa[0], pa[1], z), (pb[0], pb[1], z), (pb[0], pb[1], z - t), (pa[0], pa[1], z - t)], C['wood_dk'], (hx - (pa[0] + pb[0]) / 2, hy - (pa[1] + pb[1]) / 2, 0))
    for (ax, ay), (bx, by), o in (((x0, y0), (x1, y0), (0, -1, 0)), ((x1, y0), (x1, y1), (1, 0, 0)), ((x1, y1), (x0, y1), (0, 1, 0)), ((x0, y1), (x0, y0), (-1, 0, 0))):
        A.poly([(ax, ay, z), (bx, by, z), (bx, by, z - t), (ax, ay, z - t)], m, o)

def engine(A, fine=True):
    x0, x1, hw, top = ENG
    if not fine:
        abox(A, x0, x1, -hw, hw, Z_FLOOR, top, C['wood_in2'], skip=('-z',)); acyl(A, (CYL[0], CYL[1], top), (CYL[0], CYL[1], top + 0.36), 0.13, lambda z: C['iron'], 8); return
    # the box: four boards a side with a groove between them, corner posts, a backing inside the grooves
    hb_ = 0.13; nb = int((top - 0.035 - Z_FLOOR) / hb_ + 0.999); bh = (top - 0.035 - Z_FLOOR) / nb
    for k in range(nb):
        z0 = Z_FLOOR + k * bh + 0.003; z1 = Z_FLOOR + (k + 1) * bh - 0.003; m = C['wood_in2'] if k % 2 else C['wood_in']
        z1 = min(z1, top - 0.037)
        abox(A, x0 + 0.03, x1 - 0.03, -hw, -hw + 0.022, z0, z1, m); abox(A, x0 + 0.03, x1 - 0.03, hw - 0.022, hw, z0, z1, m)
        abox(A, x0, x0 + 0.022, -hw + 0.03, hw - 0.03, z0, z1, m); abox(A, x1 - 0.022, x1, -hw + 0.03, hw - 0.03, z0, z1, m)
    abox(A, x0 + 0.012, x1 - 0.012, -hw + 0.012, hw - 0.012, Z_FLOOR, top - 0.035, C['dark'], skip=('-z', '+z'))
    for cx in (x0 + 0.02, x1 - 0.02):
        for cy in (-hw + 0.02, hw - 0.02): abox(A, cx - 0.022, cx + 0.022, cy - 0.022, cy + 0.022, Z_FLOOR, top - 0.035, C['wood_dk'])
    # the lid: two boards, the aft one with the exhaust's hole, the fore one with the cylinder's; the hinges and the hasp
    xm = 2.70
    lid_board(A, x0 - 0.02, xm - 0.002, -hw - 0.02, hw + 0.02, top, 0.035, (EXH[0] + 0.06, EXH[1], 0.055), C['wood_in'])
    lid_board(A, xm + 0.002, x1 + 0.02, -hw - 0.02, hw + 0.02, top, 0.035, (CYL[0], CYL[1], 0.17), C['wood_in2'])
    for hy in (-0.25, 0.25):
        obox(A, (x0 + 0.06, hy, top + 0.003), (0.08, 0, 0), (0, 0.022, 0), (0, 0, 0.003), C['iron'], skip=('-z',))
        acyl(A, (x0 - 0.02, hy - 0.03, top - 0.012), (x0 - 0.02, hy + 0.03, top - 0.012), 0.009, lambda z: C['iron'], 6)
    obox(A, (x1 + 0.03, 0.0, top - 0.06), (0.004, 0, 0), (0, 0.025, 0), (0, 0, 0.05), C['iron'], skip=('-x',))
    obox(A, ((x0 + x1) / 2, hw + 0.026, top - 0.12), (0.06, 0, 0), (0, 0.004, 0), (0, 0, 0.012), C['iron'], skip=('-y',))   # a handle
    # the fuel tank's filler on the lid, brass
    acyl(A, (2.45, 0.30, top), (2.45, 0.30, top + 0.03), 0.032, lambda z: C['brass'], 12)
    acyl(A, (2.45, 0.30, top + 0.03), (2.45, 0.30, top + 0.042), 0.036, lambda z: C['brass'], 12)
    # the cylinder: the water jacket from inside the box up through the lid, the head's flange with its studs, the hot bulb on top
    cx, cy = CYL; z0 = top - 0.25
    acyl(A, (cx, cy, z0), (cx, cy, top + 0.20), 0.125, lambda z: C['iron'], 20)
    for zz in (top + 0.04, top + 0.12): atorus(A, (cx, cy, zz), (0, 0, 1), 0.125, 0.008, lambda a: C['iron'], 20, 4)
    acyl(A, (cx, cy, top + 0.20), (cx, cy, top + 0.235), 0.155, lambda z: C['iron'], 20)
    for k in range(6):
        a = 2 * math.pi * k / 6 + 0.3; acyl(A, (cx + 0.137 * math.cos(a), cy + 0.137 * math.sin(a), top + 0.235), (cx + 0.137 * math.cos(a), cy + 0.137 * math.sin(a), top + 0.26), 0.012, lambda z: C['iron'], 6)
    # the hot bulb (glødehodet), a pear of iron, rust-black, with the blowlamp's bracket under it to the side
    prof = [(0.0, 0.235), (0.07, 0.235), (0.085, 0.27), (0.095, 0.31), (0.09, 0.35), (0.07, 0.385), (0.04, 0.405), (0.0, 0.41)]
    seg = 16; rings = []
    for r, h in prof:
        rings.append([A.v(V((cx + r * math.cos(2 * math.pi * k / seg), cy + r * math.sin(2 * math.pi * k / seg), top + h))) for k in range(seg)])
    for i in range(len(rings) - 1):
        for k in range(seg):
            j = (k + 1) % seg; A.f([rings[i][k], rings[i][j], rings[i + 1][j], rings[i + 1][k]], C['rust'], (rings[i][k].co + rings[i + 1][j].co) / 2 - V((cx, cy, top + 0.31)))
    bx = cx - 0.17; beam(A, (cx - 0.09, cy, top + 0.27), (bx, cy, top + 0.27), 0.02, 0.008, C['iron'])
    atorus(A, (bx, cy, top + 0.27), (0, 0, 1), 0.035, 0.006, lambda a: C['iron'], 12, 4)
    # the fuel pump and the lubricator on the cylinder's side, with their copper pipes
    abox(A, cx + 0.12, cx + 0.20, cy - 0.04, cy + 0.04, top + 0.02, top + 0.12, C['iron'])
    abox(A, cx + 0.06, cx + 0.14, cy + 0.12, cy + 0.17, top + 0.10, top + 0.19, C['brass'])
    for k in range(2): acyl(A, (cx + 0.08 + 0.04 * k, cy + 0.145, top + 0.19), (cx + 0.08 + 0.04 * k, cy + 0.145, top + 0.23), 0.012, lambda z: C['glass'], 8)
    F.pipe(A, [(cx + 0.16, cy, top + 0.12), (cx + 0.16, cy, top + 0.30), (cx + 0.06, cy, top + 0.33)], 0.006, C['copper'], 6)
    F.pipe(A, [(cx + 0.10, cy + 0.12, top + 0.14), (cx + 0.05, cy + 0.10, top + 0.14)], 0.005, C['copper'], 6)
    F.pipe(A, [(cx - 0.12, cy - 0.06, top + 0.215), (cx - 0.20, cy - 0.10, top + 0.15), (cx - 0.22, cy - 0.10, top)], 0.012, C['copper'], 8)   # the cooling water
    # the exhaust: up through the lid, the silencer, a stay to the box, the bend and the mouth
    ex, ey, ez = EXH; px = ex + 0.06
    acyl(A, (px, ey, top - 0.12), (px, ey, top + 0.14), 0.042, lambda z: C['rust'], 12, cap=False)
    acyl(A, (px, ey, top + 0.14), (px, ey, top + 0.20), 0.042, lambda z: C['iron'], 12, cap=False, r1=0.07)
    acyl(A, (px, ey, top + 0.20), (px, ey, top + 0.50), 0.07, lambda z: C['iron'], 14, cap=False)
    acyl(A, (px, ey, top + 0.50), (px, ey, top + 0.56), 0.07, lambda z: C['iron'], 14, cap=False, r1=0.042)
    for zz in (top + 0.26, top + 0.44): atorus(A, (px, ey, zz), (0, 0, 1), 0.07, 0.008, lambda a: C['iron'], 14, 4)
    acyl(A, (px, ey, top + 0.56), (px, ey, ez - 0.10), 0.042, lambda z: C['iron'], 12, cap=False)
    bend = [(px, ey, ez - 0.10), (px - 0.015, ey, ez - 0.045), (px - 0.04, ey, ez - 0.012), (ex, ey, ez)]
    F.pipe(A, bend, 0.042, C['iron'], 12)
    atorus(A, (ex, ey, ez), (-0.8, 0, 0.6), 0.042, 0.006, lambda a: C['soot'], 12, 4)
    beam(A, (px, ey - 0.05, top + 0.35), (px, -hw - 0.005, top + 0.02), 0.025, 0.006, C['iron'])
    # the flywheel aft of the box (its own guard rail), the gear lever and the throttle beside the skipper
    fx, fz = x0 - 0.08, Z_FLOOR + 0.31
    atorus(A, (fx, 0, fz), (1, 0, 0), 0.25, 0.035, lambda a: C['iron'], 32, 8)
    acyl(A, (fx - 0.05, 0, fz), (x0, 0, fz), 0.055, lambda zz: C['iron'], 12)
    for k in range(6):
        e = V((0, math.cos(k * math.pi / 3), math.sin(k * math.pi / 3))); beam(A, V((fx, 0, fz)) + e * 0.05, V((fx, 0, fz)) + e * 0.225, 0.03, 0.05, C['iron'], up=(1, 0, 0))
    acyl(A, (x0 - 0.15, 0.38, Z_FLOOR), (x0 - 0.05, 0.38, Z_FLOOR + 0.62), 0.016, lambda zz: C['iron'], 8)
    acyl(A, (x0 - 0.05, 0.38, Z_FLOOR + 0.60), (x0 - 0.04, 0.38, Z_FLOOR + 0.72), 0.024, lambda zz: C['wood_dk'], 8)
    acyl(A, (x0 - 0.10, 0.315, Z_FLOOR + 0.30), (x0 - 0.02, 0.315, Z_FLOOR + 0.52), 0.009, lambda zz: C['iron'], 6)
    acyl(A, (x0 - 0.02, 0.315, Z_FLOOR + 0.52), (x0 - 0.01, 0.315, Z_FLOOR + 0.57), 0.016, lambda zz: C['wood_dk'], 6)
    abox(A, x0 - 0.17, x0 - 0.06, 0.34, 0.42, Z_FLOOR, Z_FLOOR + 0.06, C['iron'])        # the lever's quadrant


# ---------- the rudder and the tiller (their own part), the propeller (its own part) ----------
RUD_PINS = (0.20, 0.62, 1.05)
def _rud_axis():
    a = V((post_aft(0.04) - RUD_OFF, 0, 0.04)); b = V((post_aft(TILLER[0][2]) - RUD_OFF, 0, TILLER[0][2]))
    return a, (b - a).normalized()

def rudder(A, fine=True):
    """the rudder: three boards edge to edge, thicker at the post and thinning aft, its foot clear of the keel's heel, narrowing over
    the water to the stock; iron straps across both sides at the pintles; the stock up to the head the tiller goes into"""
    a, d = _rud_axis(); c = V((-d.z, 0, d.x))                      # c: aft along the chord, square to the axis
    if c.x > 0: c = -c
    chord = Tab([(0.0, 0.36), (0.08, 0.42), (0.40, 0.40), (0.62, 0.30), (0.78, 0.17), (0.86, 0.09), (1.0, 0.07)])
    H = 1.34; ns = 22 if fine else 6; nc = 6 if fine else 2
    th = lambda u: 0.024 * (1 - 0.5 * u)
    G = {}
    for sg in (1, -1):
        for i in range(ns + 1):
            s = i / ns; ch = chord(s)
            for j in range(nc + 1):
                u = j / nc; p = a + d * (s * H) + c * (ch * u)
                if s == 0: p = p + d * (0.03 * u * u)              # the foot rounded up aft
                G[(sg, i, j)] = A.v(p + V((0, sg * th(u), 0)))
        for i in range(ns):
            for j in range(nc):
                A.f([G[(sg, i, j)], G[(sg, i + 1, j)], G[(sg, i + 1, j + 1)], G[(sg, i, j + 1)]], C['chip2'], (0, sg, 0))
    for i in range(ns):          # the leading and trailing edges
        A.f([G[(1, i, 0)], G[(1, i + 1, 0)], G[(-1, i + 1, 0)], G[(-1, i, 0)]], C['chip2'], -c)
        A.f([G[(1, i, nc)], G[(1, i + 1, nc)], G[(-1, i + 1, nc)], G[(-1, i, nc)]], C['chip2'], c)
    for j in range(nc):          # the foot and the top
        A.f([G[(1, 0, j)], G[(1, 0, j + 1)], G[(-1, 0, j + 1)], G[(-1, 0, j)]], C['anti2'], -d)
        A.f([G[(1, ns, j)], G[(1, ns, j + 1)], G[(-1, ns, j + 1)], G[(-1, ns, j)]], C['chip2'], d)
    # the stock from the blade's top to the head
    top = a + d * H; head = a + d * ((TILLER[0][2] - a.z) / d.z + 0.06)
    beam(A, top - d * 0.02 + c * 0.03, head + c * 0.03, 0.055, 0.06, C['wood_dk'], up=c)
    if not fine: return
    for zp in RUD_PINS:
        s = (zp - a.z) / (d.z * H); p = a + d * (s * H)
        for sg in (1, -1):
            obox(A, p + c * 0.12 + V((0, sg * (th(0.3) + 0.003), 0)), c * 0.12, V((0, sg * 0.003, 0)), d * 0.018, C['rust'], skip=('-y',))
        acyl(A, p - d * 0.03 - c * 0.004, p + d * 0.03 - c * 0.004, 0.012, lambda z: C['iron'], 8)
    for s_ in (0.24, 0.56):      # the seams between the boards, a dark line down each side
        for sg in (1, -1):
            P = [a + d * (H * (i / 10) * 0.8) + c * (chord(i / 10 * 0.8) * s_ * 1.6) for i in range(11)]
            for p0, p1 in zip(P, P[1:]):
                q = [p0 + V((0, sg * (th(s_) + 0.0008), 0)), p1 + V((0, sg * (th(s_) + 0.0008), 0))]
                A.poly([q[0] - d * 0.0 + c * 0.003, q[1] + c * 0.003, q[1] - c * 0.003, q[0] - c * 0.003], C['wood_dk'], (0, sg, 0))

def tiller_part():
    """the tiller, the rudder and the flag pole lashed to the rudder head (their own part: they swing together about the rudder head)"""
    A = Acc('tiller')
    p0, p1 = V(TILLER[0]), V(TILLER[1]); d = (p1 - p0).normalized()
    beam(A, p0 - d * 0.04, p0 + d * 0.55, 0.048, 0.055, C['wood_in'])
    beam(A, p0 + d * 0.55, p1 - d * 0.10, 0.042, 0.045, C['wood_in'])
    acyl(A, p1 - d * 0.12, p1 + d * 0.04, 0.022, lambda zz: C['wood_dk'], 10)
    rudder(A, True)
    acyl(A, (TILLER[0][0] - 0.035, 0, TILLER[0][2] + 0.02), POLE_TOP, 0.016, lambda zz: C['wood_dk'], 8)
    for zz in (TILLER[0][2] + 0.06, TILLER[0][2] + 0.14):
        k = (zz - TILLER[0][2] - 0.02) / (POLE_TOP[2] - TILLER[0][2] - 0.02); px = TILLER[0][0] - 0.035 + (POLE_TOP[0] - TILLER[0][0] + 0.035) * k
        atorus(A, (px, 0, zz), (0, 0, 1), 0.022, 0.007, lambda a: C['rope'], 10, 4)
    return A.done(tint=wear)

def propeller():
    """the propeller (its own part, it turns in the game): three bronze blades of fixed pitch, in the frame of its hub"""
    A = Acc('prop')
    F.propeller(A, PROP, (1, 0, 0), PROP_R, C['bronze'], n=3, hub=0.26, pitch=0.8, skew=0.25, cpp=False)
    return A.done()


# ---------- on deck: the lanterns, the bollard, the thole pins, the oars, the bailer and the pump, the tarpaulin, the gutting table ----------
# the lanterns (Sjøveisreglene regel 23 (d)(i): 7.00 m is not under 7 m, so one all-round white and the sidelights; vedlegg I 2(d): the
# white at least 1 m higher than the sidelights): the sidelights in small iron lanterns on the gunwales by the forward thwart, red and
# green glass outboard, a screen board inboard; the all-round white on a staff lashed inside the port gunwale just forward of the
# skipper's thwart: the tiller swings 41 degrees each way (13-instruments.js: wheelA x 0.3, at most 2.4), which sweeps the whole stern
# seat, so a staff there would be struck; here it is out of the tiller's reach (1.6 m from the rudder head against the tiller's 1.15).
# The anchors carry their type (vessel3d.js lanterns)
LAMP_X = 6.05; LAMP_W = (1.30, 0.86)
def lamp_z(): return zs(LAMP_X) + 0.10
def white_z(): return lamp_z() + 1.03
def lantern_geo(A, fine=True):
    for side, glass in ((1, 'lampR'), (-1, 'lampG')):                                  # port red, starboard green (y to port)
        yo = side * (hb(LAMP_X) - 0.01); z = lamp_z(); g = C[glass]
        abox(A, LAMP_X - 0.07, LAMP_X + 0.07, min(yo - side * 0.06, yo + side * 0.03), max(yo - side * 0.06, yo + side * 0.03), zs(LAMP_X) + 0.034, zs(LAMP_X) + 0.045, C['rail'])   # the board on the cap
        yb = yo + side * 0.0
        abox(A, LAMP_X - 0.05, LAMP_X + 0.05, min(yb - side * 0.045, yb + side * 0.02), max(yb - side * 0.045, yb + side * 0.02), z - 0.055, z + 0.06, C['iron'])        # the housing
        if fine:
            # the lens: a half round of coloured glass outboard
            for k in range(8):
                a0, a1 = -math.pi / 2 + math.pi * k / 8, -math.pi / 2 + math.pi * (k + 1) / 8
                p = lambda a, zz: V((LAMP_X + 0.042 * math.sin(a), yb + side * (0.02 + 0.03 * math.cos(a)), zz))
                A.poly([p(a0, z - 0.04), p(a1, z - 0.04), p(a1, z + 0.045), p(a0, z + 0.045)], g, V((math.sin((a0 + a1) / 2), side * math.cos((a0 + a1) / 2), 0)))
            # the screen board inboard of it, matt black inside (LYS-02), and the chimney cap
            abox(A, LAMP_X - 0.09, LAMP_X + 0.09, min(yb - side * 0.065, yb - side * 0.05), max(yb - side * 0.065, yb - side * 0.05), zs(LAMP_X) + 0.045, z + 0.09, C['dark'])
            acyl(A, (LAMP_X, yb - side * 0.012, z + 0.06), (LAMP_X, yb - side * 0.012, z + 0.10), 0.02, lambda zz: C['iron'], 8)
            acyl(A, (LAMP_X, yb - side * 0.012, z + 0.10), (LAMP_X, yb - side * 0.012, z + 0.115), 0.035, lambda zz: C['iron'], 8, r1=0.01)
        else: abox(A, LAMP_X - 0.04, LAMP_X + 0.04, min(yb + side * 0.02, yb + side * 0.03), max(yb + side * 0.02, yb + side * 0.03), z - 0.04, z + 0.04, g)
    sx, sy = LAMP_W; z0 = zs(sx) - 0.30; zt = white_z()
    acyl(A, (sx, sy, z0), (sx, sy, zt - 0.08), 0.016, lambda zz: C['iron'], 8)                                                     # the staff
    acyl(A, (sx, sy, zt - 0.08), (sx, sy, zt - 0.065), 0.04, lambda zz: C['iron'], 12)
    acyl(A, (sx, sy, zt - 0.065), (sx, sy, zt + 0.055), 0.036, lambda zz: C['lampW'], 12)                                          # the white glass
    acyl(A, (sx, sy, zt + 0.055), (sx, sy, zt + 0.075), 0.045, lambda zz: C['iron'], 12, r1=0.02)                                   # its cap
    if fine:
        for k in range(3):
            a = 2 * math.pi * k / 3; acyl(A, (sx + 0.038 * math.cos(a), sy + 0.038 * math.sin(a), zt - 0.065), (sx + 0.038 * math.cos(a), sy + 0.038 * math.sin(a), zt + 0.055), 0.004, lambda zz: C['iron'], 4)
        atorus(A, (sx, sy, zt + 0.10), (1, 0, 0), 0.025, 0.004, lambda a: C['iron'], 10, 4, 0, math.pi)
        for zz in (zs(sx) - 0.24, zs(sx) + 0.045):                                                                                 # the brackets to the inwale and the cap
            yb = hb(sx) - (0.09 if zz < zs(sx) else 0.05); obox(A, (sx, (sy + yb) / 2, zz), (0.012, 0, 0), (0, (yb - sy) / 2 + 0.018, 0), (0, 0, 0.005), C['iron'])
def lantern_anchors(G):
    z = lamp_z(); sx, sy = LAMP_W
    return [[G(LAMP_X, hb(LAMP_X) + 0.03, z), [1, 0.12, 0.1], 'port'], [G(LAMP_X, -(hb(LAMP_X) + 0.03), z), [0.1, 1, 0.35], 'stbd'], [G(sx, sy, white_z()), [1, 0.95, 0.85], 'allround']]

def tarp(A):
    """Father's worn tarpaulin, folded in a heap on the foredeck, its loose end hanging down over the deck's aft edge"""
    nu, nv = 20, 12; xe = 6.07; zd = lambda x: zs(x) - 0.025; G = []; hang = 6
    for i in range(nu + 1):
        if i < hang:
            s = i / hang; x = xe - 0.04 + 0.04 * s; hw = 0.37
        else:
            s = (i - hang) / (nu - hang); x = xe + 0.52 * s; hw = max(0.06, min(0.36, inner_hb(x, zs(x) - 0.05) - 0.03))
        row = []
        for j in range(nv + 1):
            v = j / nv; yy = (2 * v - 1) * hw
            if i < hang:
                zz = zd(xe) + 0.012 - (0.30 + 0.06 * n3(yy * 6.0, 1.7)) * (1 - s) ** 1.3; xx = x - 0.025 * (1 - s) * (1 + n3(yy * 5.0, 2.3))
            else:
                hump = 0.14 * (1 - abs(2 * v - 1) ** 3) * math.sin(math.pi * min(1.0, s * 1.12)) ** 0.5
                fold = 0.3 * math.sin(yy * 21 + 2.5 * n3(x * 4.0, yy * 4.0)) + 0.4 * n3(x * 7.0, yy * 7.0, 1)
                zz = zd(x) + 0.008 + hump * (1 + 0.35 * fold); xx = x
            row.append(V((xx, yy, zz)))
        G.append(row)
    for i in range(nu):
        for j in range(nv):
            q = [G[i][j], G[i][j + 1], G[i + 1][j + 1], G[i + 1][j]]
            if i < hang:
                A.poly(q, C['canvas'], (-1, 0, 0.2)); A.poly([p + V((0.006, 0, 0)) for p in q], C['canvas2'], (1, 0, 0))
            else: A.poly(q, C['canvas'], (0, 0, 1))

def gutting_table(A):
    """the gutting table across the port gunwale aft of the middle thwart: a scrubbed board with a rim on three sides, open over the
    side so the guts go overboard, on legs to the floor; the knife, a whetstone, the bucket for liver and roe"""
    x0, x1 = 3.42, 4.08; zt = zs(3.75) + 0.07; yo = hb(3.75) + 0.06; yi = 0.50
    abox(A, x0, x1, yi, yo, zt - 0.04, zt, C['table'])
    for (a, b, c_, d) in ((x0, x0 + 0.03, yi, yo - 0.08), (x1 - 0.03, x1, yi, yo - 0.08), (x0, x1, yi, yi + 0.03)):
        abox(A, a, b, c_, d, zt, zt + 0.05, C['wood_dk'])
    abox(A, 3.47, 3.53, yi + 0.02, yi + 0.08, Z_FLOOR, zt - 0.04, C['wood_dk'])
    abox(A, 4.01, 4.07, yi + 0.02, yi + 0.08, Z_FLOOR, zt - 0.04, C['wood_dk'])
    abox(A, 3.66, 3.80, yi + 0.12, yi + 0.17, zt, zt + 0.018, C['wood_dk'])
    board(A, [V((3.80, yi + 0.135, zt + 0.004)), V((3.98, yi + 0.13, zt + 0.004)), V((3.98, yi + 0.155, zt + 0.004)), V((3.80, yi + 0.165, zt + 0.004))], (0, 0, 1), 0.003, C['steel'])
    abox(A, 3.48, 3.60, yi + 0.25, yi + 0.30, zt, zt + 0.022, C['stone'])
    acyl(A, (3.95, 0.30, Z_FLOOR), (3.95, 0.30, Z_FLOOR + 0.24), 0.13, lambda zz: C['crate3'], 16, r1=0.15, cap=False)
    acyl(A, (3.95, 0.30, Z_FLOOR + 0.005), (3.95, 0.30, Z_FLOOR + 0.01), 0.13, lambda zz: C['bilge'], 16)
    atorus(A, (3.95, 0.30, Z_FLOOR + 0.24), (0, 0, 1), 0.15, 0.006, lambda a: C['crate3'], 16, 4)

def oar(A, a, b, flat):
    """an oar from the grip at a to the blade's tip at b, the blade lying flat (flat: the blade's width direction)"""
    a, b = V(a), V(b); d = (b - a).normalized(); Ln = (b - a).length
    acyl(A, a, a + d * 0.12, 0.016, lambda z: C['wood_dk'], 8)
    acyl(A, a + d * 0.12, a + d * (Ln * 0.33), 0.022, lambda z: C['wood_in'], 8)
    acyl(A, a + d * (Ln * 0.33), a + d * (Ln - 0.62), 0.022, lambda z: C['wood_in'], 8, r1=0.017)
    w = V(flat).normalized(); n = d.cross(w).normalized()
    P = [a + d * (Ln - 0.64) + w * 0.018, a + d * (Ln - 0.38) + w * 0.065, a + d * (Ln - 0.02) + w * 0.068, b + w * 0.03,
         b - w * 0.03, a + d * (Ln - 0.02) - w * 0.068, a + d * (Ln - 0.38) - w * 0.065, a + d * (Ln - 0.64) - w * 0.018]
    A.poly([p + n * 0.006 for p in P], C['wood_in'], n); A.poly([p - n * 0.006 for p in P], C['wood_in'], -n)
    for p, q in zip(P, P[1:] + P[:1]): A.poly([p + n * 0.006, q + n * 0.006, q - n * 0.006, p - n * 0.006], C['wood_in'], (p + q) / 2 - (a + d * (Ln - 0.3)))

def deck_gear(A, fine=True):
    if not fine: return
    tarp(A)
    # the bollard on the foredeck with its cross pin, a cleat on the stern deck
    bx = 6.55; zb = zs(bx) - 0.025
    acyl(A, (bx, 0, zb), (bx, 0, zb + 0.17), 0.05, lambda zz: C['wood_dk'], 12)
    acyl(A, (bx, 0, zb + 0.17), (bx, 0, zb + 0.185), 0.056, lambda zz: C['wood_dk'], 12)
    acyl(A, (bx, -0.085, zb + 0.12), (bx, 0.085, zb + 0.12), 0.016, lambda zz: C['iron'], 8)
    cx_ = 0.40; zc = zs(cx_) - 0.05
    obox(A, (cx_, 0, zc + 0.03), (0.09, 0, 0), (0, 0.018, 0), (0, 0, 0.012), C['iron'])
    for e in (-0.035, 0.035): acyl(A, (cx_ + e, 0, zc), (cx_ + e, 0, zc + 0.02), 0.012, lambda zz: C['iron'], 6)
    # the thole pins (pairs) on the cap amidships, each side
    for side in (1, -1):
        for tx in (4.0, 4.16):
            y = side * (hb(tx) - 0.026); acyl(A, (tx, y, zs(tx) + 0.034), (tx, y, zs(tx) + 0.17), 0.013, lambda zz: C['wood_dk'], 8)
    # the oars along the port side on the thwarts
    for k in range(2):
        y = 0.64 + 0.055 * k; oar(A, (0.99, y, SEAT + 0.022), (4.60, y + 0.03, 1.04 + 0.022), (0, 0.0, 1))
    # the bailer, a wooden scoop on the floor aft, and the old hand pump by the engine box to port: the barrel, its handle and spout
    bx, by = 1.45, -0.32
    acyl(A, (bx, by, Z_FLOOR + 0.01), (bx, by, Z_FLOOR + 0.09), 0.08, lambda zz: C['wood_in'], 12, cap=False, r1=0.095)
    acyl(A, (bx, by, Z_FLOOR + 0.008), (bx, by, Z_FLOOR + 0.014), 0.08, lambda zz: C['wood_dk'], 12)
    beam(A, (bx + 0.07, by, Z_FLOOR + 0.06), (bx + 0.25, by, Z_FLOOR + 0.11), 0.03, 0.022, C['wood_dk'])
    px, py = 2.05, -0.33
    acyl(A, (px, py, Z_FLOOR - 0.15), (px, py, Z_FLOOR + 0.62), 0.045, lambda zz: C['wood_dk'], 12)
    acyl(A, (px, py, Z_FLOOR + 0.62), (px, py, Z_FLOOR + 0.64), 0.052, lambda zz: C['iron'], 12)
    acyl(A, (px, py, Z_FLOOR + 0.64), (px, py, Z_FLOOR + 0.80), 0.01, lambda zz: C['iron'], 6)
    acyl(A, (px - 0.10, py, Z_FLOOR + 0.80), (px + 0.10, py, Z_FLOOR + 0.80), 0.014, lambda zz: C['wood_dk'], 8)
    acyl(A, (px, py - 0.03, Z_FLOOR + 0.55), (px, py - 0.16, Z_FLOOR + 0.52), 0.02, lambda zz: C['wood_dk'], 8)
    for zz in (Z_FLOOR + 0.1, Z_FLOOR + 0.5): atorus(A, (px, py, zz), (0, 0, 1), 0.045, 0.005, lambda a: C['iron'], 12, 4)
    # a coil of the mooring line on the stern deck, its end made fast round the cleat
    for k in range(4):
        atorus(A, (0.40, -0.16, zc + 0.012 + 0.012 * k), (0, 0, 1), 0.11 - 0.012 * k, 0.008, lambda a: C['rope'], 18, 4)


def build(fine=True):
    A = Acc('snekke')
    gunwale(A, fine); frames(A, fine); floorboards(A, fine); thwarts(A, fine); decks(A, fine); engine(A, fine); underwater(A, fine)
    if fine: rivets(A); deck_gear(A, fine); gutting_table(A)
    else:
        R = Acc('rud'); rudder(R, False); A2 = R.done(tint=wear)
    lantern_geo(A, fine)
    out = [hull(fine)] + backbone(fine) + [A.done(40, tint=wear)]
    if not fine: out.append(A2)
    return out, [box('noglass', 0, 0.01, 0, 0.01, -50, -49.99, C['glass'])]


def cap_obj():
    """the lid inside the gunwales (drawn into depth only in the game, so the sea does not show inside the open boat when she rolls)"""
    xs = [x for x in XS if XA0 + 0.05 <= x <= XF0 - 0.04]
    yi = lambda x: max(0.004, hb(x) - PLANK - 0.02)
    ring = [(x, -yi(x), zs(x) - 0.03) for x in xs] + [(x, yi(x), zs(x) - 0.03) for x in reversed(xs)]
    bm = bmesh.new(); f = bm.faces.new([bm.verts.new(p) for p in ring]); f.normal_update()
    if f.normal.z < 0: f.normal_flip()
    o = obj_from_bm('CAP', bm, [C['post']]); o.hide_render = True
    return o


def to_game(p): return (-p[1], p[2] - WL, -(p[0] - XM))
def to_game_n(n): return (-n[1], n[2], -n[0])

def kit_places(G):
    """the places where the game sets the deck kit (tools/deck; nothing that can be bought is modelled in, only its place, 19.10.2026):
    the ring buoy under the forward edge of the stern seat, facing forward behind the skipper's thwart, clear of the tiller (and a
    spare place on the starboard side abreast of the engine); the net tub, the line tubs and the freight on the floorboards between
    the middle and the forward thwart, clear of the oars to port. No catch tub: the catch is drawn at the 'tub' anchor, in the
    bleeding tub the game sets at work.tub. (Jonas 31.10.2026: no life raft and no lifebuoy in the model; the places stay for kit
    the player buys.)"""
    r = lambda a: round(a, 3); xs_ = 0.62
    return {'buoys': [G(xs_, 0.0, zs(xs_) - 0.05) + [r(math.pi)], G(2.6, -(hb(2.6) - 0.095), zs(2.6) - 0.06) + [r(-math.pi / 2)]],
            'garn': {'at': G(4.85, -0.15, Z_FLOOR), 'ry': r(math.pi / 2)},
            'stamps': {'at': G(5.08, 0.16, Z_FLOOR), 'ry': 0.0},
            'cargo': [G(4.85, -0.15, Z_FLOOR) + [r(math.pi / 2)]]}

# the boat's own anchor (tools/deck/anker.py, drawn and let go by the game, view3d.js drawAnchor; Jonas 21.10.2026): a grapnel of 5 kg,
# the rode over the stem head, stowed on the floor forward
def bower(G):
    return {'kind': 'dregg', 'kg': 5, 'fair': G(6.97, 0, STEM_TOP + 0.01), 'side': 0,
            'stow': {'eye': G(L - 1.30, 0.14, Z_FLOOR + 0.06), 'crown': G(L - 0.82, 0.14, Z_FLOOR + 0.06)}}


def anchors():
    G = lambda x, y, z: [round(v, 3) for v in to_game((x, y, z))]
    gw = lambda x: round(zs(x) - WL, 3)
    names = []
    # the name boards on the bows: on the second and third strakes from the top, just outside the laps
    for sg, xs in ((1, [6.45 - 0.6 * k / 12 for k in range(13)]), (-1, [5.85 + 0.6 * k / 12 for k in range(13)])):
        B = []; T = []
        for x in xs:
            for arr, t in ((B, 0.72), (T, 0.86)):
                y, z = sec(x, t); n = sec_n(x, t); o = 0.012 + LAP; arr.append(G(x, sg * (y + n[0] * o), z + n[1] * o))
        names.append([B, T])
    gwx = lambda x, up: [round(hb(x) - 0.05, 3), round(zs(x) - WL + up, 3), round(-(x - XM), 3)]   # on the starboard gunwale (game x to starboard)
    sk = {'sole': round(Z_FLOOR - WL, 3), 'tiller': {'post': G(*TILLER[0]), 'grip': G(*TILLER[1])}, 'inboard': True, 'prop': G(*PROP), 'sit': True,
          'tub': G(3.85, -0.55, Z_FLOOR), 'fisher': G(3.5, -0.45, Z_FLOOR), 'reel': gwx(3.6, 0.2), 'haul': gwx(4.7, 0.24),
          'mach': [gwx(x, 0.12) for x in (3.2, 3.75, 4.35)], 'stack': G(1.85, 0.0, Z_FLOOR), 'charm': G(2.75, 0.32, ENG[3] + 0.06),
          'skipper': G(1.12, 0.36, SEAT - 0.46), 'seat': G(4.25, 0.45, 1.04 - 0.46), 'filler': G(2.45, 0.3, ENG[3] + 0.04), 'names': names}
    return {'bower': bower(G), 'eye': G(1.12, 0.36, SEAT + 0.82), 'skipperAt': G(1.12, 0.36, Z_FLOOR), 'hp': -0.22, 'fov': 62,
            'crewSpots': [G(4.25, 0.45, 1.04) + [0.0]], 'hauler': sk['haul'], 'filler': sk['filler'], 'pole': G(*POLE_TOP),
            'exhaust': G(*EXH), 'engine': G(CYL[0], CYL[1], ENG[3] + 0.2), 'skiff': sk,
            'lights': lantern_anchors(G),
            'deck': {'y': round(Z_FLOOR - WL, 3), 'z': round(-(1.2 - XM), 3)}, 'gw': gw(3.4), 'stern': round(XM + 0.1, 3), 'bow': round(-(L - XM), 3), 'side': 1.0,
            'beam': BEAM, 'pl': 2.6, 'rl': 1.2, 'open': True, 'hand': True, 'inboard': True,
            'work': {'table': G(3.75, 0.62, Z_FLOOR), 'tub': G(3.8, -0.6, Z_FLOOR), 's': 0.75, 'own': True, 'top': round(zs(3.75) + 0.07 - WL, 3)},
            'kit': kit_places(G)}


# ---------- checks against the tables (B1) ----------
def check():
    """the model against its tables and the game's data: the length over all, the beam, the depth, the displacement up to the waterline
    (the planking's outside and the backbone), the propeller's clearance in the aperture, the lanterns' heights"""
    out = []
    # the displacement: the sections' areas under the waterline, Simpson along the length
    xs = stations(400); A_ = []
    for x in xs:
        ts = [i / 200 for i in range(201)]; P = [sec(x, t) for t in ts]; a = 0.0
        for (y0, z0), (y1, z1) in zip(P, P[1:]):
            za, zb = min(z0, WL), min(z1, WL)
            if z0 >= WL and z1 >= WL: continue
            a += (y0 + y1) / 2 * (zb - za) if z1 > z0 else 0.0
        zb_ = min(zr(x), WL); a += SID * zb_        # the backbone under the rabbet
        A_.append(2 * max(0.0, a))
    vol = sum((A_[i] + A_[i + 1]) / 2 * (xs[i + 1] - xs[i]) for i in range(len(xs) - 1))
    out.append(('deplasement %.2f t (1,025 t/m3) mot %.1f t i VESSELS' % (vol * 1.025, DISP), abs(vol * 1.025 - DISP) / DISP < 0.12))
    out.append(('lengde over alt %.2f m (stevn %.3f til akterstevn %.3f) mot %.2f' % (STEMF(STEM_TOP) - post_aft(POST_TOP), STEMF(STEM_TOP), post_aft(POST_TOP), L), abs(STEMF(STEM_TOP) - post_aft(POST_TOP) - L) < 0.04))
    mb = max(hb(x) for x in xs)
    out.append(('største bredde utenpå bordene %.3f m mot %.2f (pluss skvettlista 2 x 2 cm)' % (2 * mb, BEAM), abs(2 * mb - BEAM) < 0.01))
    out.append(('dybde midtskips (sponning til ripe) %.2f m, fribord %.2f m' % (zs(3.4) - zr(3.4), zs(3.4) - WL), 0.9 <= zs(3.4) - zr(3.4) <= 1.1))
    x0, x1, z0, z1 = APER; hx, _, hz = PROP
    out.append(('propellbrønnen: klaring over bladene %.3f m, under %.3f m; deadwood over brønnen %.3f m' % (z1 - (hz + PROP_R), hz - PROP_R - z0, zr((x0 + x1) / 2) - z1), z1 - (hz + PROP_R) > 0.02 and hz - PROP_R - z0 > 0.02 and zr(x1) - z1 > 0.04))
    out.append(('den hvite rundtlysende %.2f m over sidelanternene (vedlegg I 2(d): minst 1 m)' % (white_z() - lamp_z()), white_z() - lamp_z() >= 1.0))
    out.append(('sidelanternene %.2f over ripa, den hvite %.2f: høyst 3/4 (vedlegg I 2(g))' % (lamp_z() - zs(LAMP_X), white_z() - zs(LAMP_W[0])), (lamp_z() - zs(LAMP_X)) <= 0.75 * (white_z() - zs(LAMP_W[0]))))
    out.append(('flaggstanga %.2f m over den hvite (spillet tar en lykt over stanga for en mast og setter vimpel)' % (POLE_TOP[2] - white_z()), POLE_TOP[2] > white_z()))
    rr = math.hypot(LAMP_W[0] - TILLER[0][0], LAMP_W[1]); tl = (V(TILLER[1]) - V(TILLER[0])).length + 0.05
    out.append(('den hvite staken %.2f m fra rorhodet, rorkulten %.2f m lang (svinger 41 grader)' % (rr, tl), rr > tl + 0.1))
    for s, ok_ in out: print(('OK   ' if ok_ else 'FEIL ') + s)
    return all(o for _, o in out)


SHOTS = [('side', (3.4, -11.0, 1.2), (3.4, 0.0, 0.9), 30), ('q3', (9.5, -6.5, 2.8), (3.4, 0.0, 0.8), 30), ('stern', (-4.5, -4.5, 2.6), (2.6, 0.0, 0.9), 30),
         ('above', (3.0, -3.5, 6.5), (3.3, 0.0, 0.7), 34), ('engine', (1.2, -1.7, 2.1), (2.9, 0.0, 1.0), 32)]

# the middle version (lodm) a little under bpyutil's 40 000: the game draws the tiller with the rudder and the propeller on top of it, and
# the middle model with them must stay within the 120 000 points vessel3d allows (127 206 with 40 000, 31.10.2026)
import bpyutil
bpyutil.LODM_TRIS = 36500

def main():
    os.makedirs(OUT, exist_ok=True)
    if 'check' in sys.argv: sys.exit(0 if check() else 1)
    check()
    reset(); colours()
    solids, glass = build(True)
    join(solids, 'BOAT0'); join(glass, 'GLASS0')
    pr = propeller(); tl = tiller_part()
    if 'fast' not in sys.argv and 'dry' not in sys.argv: beauty(OUT, 'snekke', WL, SHOTS)
    rel = lambda c: (lambda p: tuple(a - b for a, b in zip(to_game(p), to_game(c))))
    more = [{'name': 'cap', 'obj': cap_obj}, {'name': 'prop', 'obj': pr, 'xf_p': rel(PROP), 'xf_n': to_game_n, 'ao': False, 'show': True},
            {'name': 'tiller', 'obj': tl, 'xf_p': rel(TILLER[0]), 'xf_n': to_game_n, 'ao': True, 'show': True}]
    ex = {'frame': 'kystfiske: x starboard, y up from the waterline, z aft; metres', 'type': 'snekke23', 'name': 'Trebåt 23 fot med semidiesel (7,0 m)', 'len': L, 'beam': BEAM, 'draft': WL,
          'anchors': anchors()}
    export_boat(build, to_game, to_game_n, OUT, 'snekke23.glb', os.path.join(ROOT, 'src', 'data', 'boat-snekke23.b64'), ex,
                side=(os.path.join(ROOT, 'src', 'data', 'boat-snekke23-side.b64'), 3.4, 0.9, 8.2), dry='dry' in sys.argv, more=more)


if __name__ == '__main__':
    main()
