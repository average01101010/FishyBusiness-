"""The first boat: Father's old 23 ft wooden boat with an inboard semi-diesel (Jonas 05.10.2026: «Lag en blender modell av den første
båten spillerne skal få. Det er en 23fot trebåt med innenbords semidiesel ... Den må se slitt og gammel ut», with photos of clinker-built
Norwegian snekker). Worn: bare old wood outside (Jonas: «Kan du gjøre båten trefarget? Gammelt trevirke»), silvered in patches, dark where wet, rust
run from the fittings, slime and weed at the waterline, the bottom tarred; grey weathered wood inside. No fenders («Fjern fenderne»). A double-ender (spissgatter), clinker
built with nine strakes a side on bent frames, a small foredeck, three thwarts, the engine box amidships aft with the cylinder and its
hot bulb up through the lid and the exhaust pipe beside it, the rudder on the sternpost with a long tiller, the propeller in the
aperture; the old tarpaulin (Father's letter: «en slitt presenning») folded on the foredeck, oars, a bailer, two worn fenders.
The gutting table across the port gunwale aft of the middle thwart, its open end over the side, the knife and the bucket. Fish crates, faded blue and grey, on the floorboards forward of the middle thwart and a small one aft. The propeller is a part of its own (it turns in the game), and so are the tiller, the rudder and the flag pole on the rudder head (they swing together), and the exhaust's mouth is an anchor (the black puffs at each firing).

    pip install bpy==4.5.4
    python3 tools/boats/snekke23.py            -> src/data/boat-snekke23.b64 (+ the side picture), renders in tools/boats/out/
    python3 tools/boats/snekke23.py fast dry   -> no renders to look at, and the GLB only in tools/boats/out

Frame as the skiff's: x forward from the sternpost, y to port, z up from the bottom of the keel; the waterline is z = WL."""
import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy, bmesh
from bpyutil import *
from mathutils import noise

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE)); OUT = os.path.join(HERE, 'out')
L = 7.0; WL = 0.62; XM = 3.4                 # 23 ft; the waterline 0.62 m over the keel's bottom; the game's origin amidships
NSTRAKE = 9; LAP = 0.016; PLANK = 0.022      # nine strakes a side, the lap and the plank's thickness
Z_FLOOR = 0.66                               # the floorboards, just above the waterline (the game draws the sea over anything below it)
ENG = (2.30, 3.25, 0.42, 1.20)               # the engine box: x0, x1, half-width, top
EXH = (2.52, -0.27, 1.92)                    # the exhaust's mouth
PROP = (0.42, 0.0, 0.30)                     # the propeller's hub
TILLER = ((-0.05, 0.0, 1.70), (1.05, 0.0, 1.40))   # the tiller from the rudder head to the grip
SEAT = 1.02                                  # the aft thwart's top, where the skipper sits
C = {}

# ---------- the lines (metres) ----------
HB = [(0.0, 0.0), (0.25, 0.40), (0.7, 0.76), (1.4, 1.00), (2.4, 1.11), (3.4, 1.13), (4.4, 1.07), (5.2, 0.90), (5.9, 0.62), (6.45, 0.36), (6.85, 0.12), (L, 0.0)]
SH = [(0.0, 1.60), (1.0, 1.39), (2.4, 1.25), (3.4, 1.21), (4.8, 1.26), (6.0, 1.42), (6.7, 1.61), (L, 1.75)]
RB = [(0.0, 0.17), (0.5, 0.16), (5.9, 0.17), (6.35, 0.34), (6.7, 0.68), (6.92, 1.14), (L, 1.75)]   # the rabbet, where the garboard meets keel and stem
def hb(x): return max(0.0, interp(HB, x))
def zs(x): return interp(SH, x)
def zr(x): return interp(RB, x)

def sec(x, t):
    """a point (y, z) on the outside of the planking at station x, t from the rabbet (0) to the sheer (1): rounded amidships, V at the ends"""
    h = hb(x); full = min(1.0, h / 1.0); ny = 1.25 + 1.5 * full; nz = 1.2 + 1.2 * full; th = t * math.pi / 2
    return h * math.sin(th) ** (2 / ny), zr(x) + (zs(x) - zr(x)) * (1 - math.cos(th) ** (2 / nz))

def sec_n(x, t):
    """the outward normal (ny, nz) of the planking at station x, t"""
    a = sec(x, max(0.0, t - 0.01)); b = sec(x, min(1.0, t + 0.01)); dy, dz = b[0] - a[0], b[1] - a[1]; l = math.hypot(dy, dz) or 1.0
    return dz / l, -dy / l

XS = [0.02 + (L - 0.04) * (1 - math.cos(math.pi * i / 52)) / 2 for i in range(53)]   # stations, closer at the ends


def colours():
    w = lambda n, rgb, g=0.15: C.__setitem__(n, mat(n, rgb, g))
    # bare old wood outside (Jonas 05.10.2026: «Kan du gjøre båten trefarget? Gammelt trevirke»): planks a shade apart, the top strake
    # darker with old oil, the laps in shadow; the bottom tarred
    w('hull', (0.42, 0.32, 0.22), 0.12); w('hull2', (0.37, 0.28, 0.19), 0.12); w('hull3', (0.46, 0.36, 0.26), 0.1); w('hull_e', (0.24, 0.18, 0.12), 0.1)
    w('hulltop', (0.30, 0.22, 0.15), 0.2); w('paint2', (0.36, 0.28, 0.20), 0.12)
    w('chip', (0.40, 0.33, 0.25)); w('chip2', (0.34, 0.27, 0.20))
    w('anti', (0.14, 0.11, 0.09), 0.3); w('anti2', (0.17, 0.13, 0.10), 0.25); w('slime', (0.22, 0.27, 0.14), 0.35); w('weedline', (0.30, 0.30, 0.15), 0.3)
    w('rust', (0.33, 0.17, 0.09), 0.2); w('iron', (0.13, 0.13, 0.14), 0.35); w('brass', (0.55, 0.44, 0.22), 0.6)
    w('wood_in', (0.40, 0.37, 0.32)); w('wood_in2', (0.35, 0.32, 0.28)); w('wood_dk', (0.27, 0.24, 0.21)); w('bilge', (0.26, 0.23, 0.19), 0.3)
    w('rail', (0.28, 0.21, 0.15), 0.2); w('canvas', (0.36, 0.40, 0.33), 0.08); w('canvas2', (0.30, 0.34, 0.28), 0.08)
    w('fender', (0.70, 0.70, 0.66), 0.3); w('crate', (0.22, 0.36, 0.52), 0.25); w('crate2', (0.52, 0.55, 0.56), 0.25); w('crate3', (0.58, 0.56, 0.50), 0.25); w('crate_in', (0.17, 0.26, 0.36), 0.2); w('table', (0.62, 0.58, 0.50), 0.1); w('steel', (0.62, 0.64, 0.66), 0.7); w('stone', (0.30, 0.31, 0.33), 0.2); w('bronze', (0.48, 0.36, 0.20), 0.6); w('rope', (0.55, 0.48, 0.35))
    C['glass'] = mat('glass', (0.07, 0.09, 0.10), 0.9)


def n3(x, y, z=0.0): return noise.noise(V((x, y, z)))

HULLW = ('hull', 'hull2', 'hull3')
def paint_mat(x, z, k, side):
    """the outside by zone: the tarred bottom, a slimy line, then bare planks, each a shade of its own and changing at its scarf"""
    if z < WL - 0.03: return C['anti'] if n3(x * 1.3, z * 4, side) > -0.15 else C['anti2']
    if z < WL + 0.05: return C['slime'] if n3(x * 3, side) > -0.2 else C['weedline']
    if k == NSTRAKE - 1: return C['hulltop']
    seg = 0 if x < 2.0 + (k * 0.73 + (side > 0) * 1.1) % 2.8 else 1
    return C[HULLW[(k * 2 + seg + (side > 0)) % 3]]

def ss(a, b, x):
    t = max(0.0, min(1.0, (x - a) / (b - a))); return t * t * (3 - 2 * t)

GREY = (0.47, 0.44, 0.39)        # wood gone silver in the sun and the salt
def toward(m, rgb, k):
    base = m['rgb']; return [1 + (rgb[i] / max(base[i], 1e-3) - 1) * k for i in range(3)]

def wear(p, m, n):
    """the wear at a corner, as a multiplier of its colour, so it runs across faces: the paint chipped to grey wood (most at the
    waterline, under the rail and at the ends), grime running down from the rail, the wood inside dark low down, rusty iron"""
    x, y, z = p; nm = m.name; side = 1 if y > 0 else -1
    if nm in HULLW or nm in ('hull_e', 'hulltop'):
        e = n3(x * 1.6 + side * 7.3, z * 4.0, side) + 0.4 * n3(x * 5.3, z * 12.0, 2 + side)
        t = toward(m, GREY, min(0.85, ss(-0.1, 0.45, e) * 0.7 + 0.35 * ss(0.35, 0.0, zs(x) - z)))      # silvered in patches and up top
        g = 1 - 0.3 * ss(0.28, 0.0, z - WL)                                                                # dark where it is wet
        g *= 1 - 0.2 * ss(0.15, 0.55, n3(x * 14.0, side * 3.1, 0.7)) * ss(0.5, 0.05, zs(x) - z)            # streaks down from the rail
        g *= 0.9 + 0.12 * n3(x * 8.0, z * 20.0, side * 1.7)
        return [t[0] * g, t[1] * g, t[2] * g]
    if nm in ('anti', 'anti2'):
        v = 0.86 + 0.22 * n3(x * 2.5, z * 6.0, y * 2.0) + 0.18 * ss(WL - 0.25, WL, z); return [v, v, v]
    if nm in ('wood_in', 'wood_in2', 'wood_dk', 'rail', 'bilge', 'table', 'chip', 'chip2'):
        g = 1 - 0.16 * ss(0.95, 0.45, z); v = g * (0.88 + 0.16 * n3(x * 3.1, y * 3.1, z * 3.1) + 0.07 * n3(x * 11.0, y * 11.0, z * 11.0))
        if n.z > 0.7 and nm != 'table': v *= 1.07
        return [v, v * 0.98, v * 0.95]
    if nm == 'iron':
        return toward(m, (0.30, 0.16, 0.08), ss(0.05, 0.45, n3(x * 5.0, y * 5.0, z * 5.0)))
    if nm.startswith('crate') or nm.startswith('canvas'):
        v = (0.82 + 0.2 * n3(x * 6.0, y * 6.0, z * 6.0)) * (1 - 0.25 * ss(0.15, 0.0, z - Z_FLOOR)); return [v, v, v * 0.96]
    return None

# ---------- the hull ----------
def hull(A, fine=True):
    xs = XS if fine else XS[::3] + [XS[-1]]
    ns = NSTRAKE if fine else 3
    for side in (1, -1):
        for k in range(ns):
            t0 = k / ns; t1 = min(1.0, (k + 1) / ns + (0.012 if k < ns - 1 else 0.0))
            rows = []
            for x in xs:
                (y0, z0), (ym, zm), (y1, z1) = sec(x, t0), sec(x, (t0 + t1) / 2), sec(x, t1); n0 = sec_n(x, t0); lap = LAP * min(1.0, hb(x) / 0.25) if (fine and k > 0) else 0.0
                rows.append((V((x, side * y0, z0)), V((x, side * (y0 + n0[0] * lap), z0 + n0[1] * lap)), V((x, side * ym, zm)), V((x, side * y1, z1))))
            for i in range(len(xs) - 1):
                a, b = rows[i], rows[i + 1]; xc = (xs[i] + xs[i + 1]) / 2; out = V((0, side * sec_n(xc, (t0 + t1) / 2)[0], sec_n(xc, (t0 + t1) / 2)[1]))
                m0 = paint_mat(xc, (a[1].z + a[2].z) / 2, k, side); m1 = paint_mat(xc, (a[2].z + a[3].z) / 2, k, side)
                A.poly([a[1], b[1], b[2], a[2]], m0, out); A.poly([a[2], b[2], b[3], a[3]], m1, out)
                if fine and k > 0: A.poly([a[0], b[0], b[1], a[1]], C['hull_e'] if m0.name in HULLW else m0, V((0, 0, -1)) + out * 0.3)
    # the inside of the planking, grey weathered wood, dark with old bilge water low down
    nin = 10 if fine else 3
    for side in (1, -1):
        G = []
        for x in xs:
            row = []
            for j in range(nin + 1):
                t = 0.04 + 0.95 * j / nin; y, z = sec(x, t); ny, nz = sec_n(x, t)
                row.append(A.v(V((x, side * (y - ny * PLANK), z - nz * PLANK))))
            G.append(row)
        for i in range(len(xs) - 1):
            for j in range(nin):
                zc = G[i][j].co.z; m = C['bilge'] if zc < Z_FLOOR - 0.02 else C['wood_in'] if n3(xs[i] * 2, j * 0.9, side) > -0.05 else C['wood_in2']
                A.f([G[i][j], G[i][j + 1], G[i + 1][j + 1], G[i + 1][j]], m, V((0, -side * sec_n(xs[i], 0.5)[0], 0.3)))

def keel_stem(A, fine=True):
    """the keel along the bottom, the stem curving up at the bow, the sternpost, the cap rail and rubbing strake along the sheer"""
    w = 0.05
    xs = [0.0 + 6.3 * i / 24 for i in range(25)]
    for a, b in zip(xs, xs[1:]):
        za, zb = zr(a), zr(b)
        obox(A, ((a + b) / 2, 0, za / 2), ((b - a) / 2, 0, 0), (0, w, 0), (0, 0, max(za, zb) / 2 + 0.01), C['anti2'] if max(za, zb) < WL else C['paint2'], skip=('-x', '+x'))
    # the stem: from the forefoot up the bow, painted where above the water
    prof = [(5.9, 0.08), (6.3, 0.16), (6.6, 0.42), (6.82, 0.78), (6.97, 1.15), (7.0, 1.50), (7.02, 1.81)]
    for (xa, za), (xb, zb) in zip(prof, prof[1:]):
        m = C['anti2'] if (za + zb) / 2 < WL - 0.03 else C['chip']
        beam(A, (xa, 0, za), (xb, 0, zb), w * 1.6, 0.11, m, up=(0, 1, 0))
    beam(A, (0.22, 0, 0.0), (0.0, 0, 1.66), w * 1.8, 0.12, C['anti2'] if fine else C['chip'], up=(0, 1, 0))   # the sternpost
    # the cap rail (on the sheer) and the half-round rubbing strake a hand below it
    xs = XS if fine else XS[::3] + [XS[-1]]
    for side in (1, -1):
        for a, b in zip(xs, xs[1:]):
            ya, yb = hb(a), hb(b); za, zb = zs(a), zs(b)
            board(A, [V((a, side * (ya + 0.01), za + 0.035)), V((b, side * (yb + 0.01), zb + 0.035)), V((b, side * max(0.0, yb - 0.07), zb + 0.035)), V((a, side * max(0.0, ya - 0.07), za + 0.035))], (0, 0, 1), 0.035, C['rail'], edges=fine)
        if fine:
            pts = [V((x, side * (hb(x) + 0.018), zs(x) - 0.07)) for x in xs[1:-1]]
            A2 = pts
            for p, q in zip(A2, A2[1:]): acyl(A, p, q, 0.022, lambda zz: C['rail'], 6, cap=False)

def frames(A):
    """bent frames inside every 0.28 m, from the keelson up to the sheer clamp, and the clamp itself"""
    x = 0.55
    while x < 6.3:
        for side in (1, -1):
            prev = None
            for j in range(12):
                t = 0.05 + 0.92 * j / 11; y, z = sec(x, t); ny, nz = sec_n(x, t)
                p = V((x, side * (y - ny * (PLANK + 0.018)), z - nz * (PLANK + 0.018)))
                if prev is not None: beam(A, prev, p, 0.045, 0.03, C['wood_in2'], up=V((0, side * ny, nz)), skip=('-z',))
                prev = p
        x += 0.28
    for side in (1, -1):
        pts = [V((xx, side * (hb(xx) - 0.07), zs(xx) - 0.09)) for xx in XS[3:-3]]
        for p, q in zip(pts, pts[1:]): beam(A, p, q, 0.05, 0.06, C['wood_dk'])

def inner_hb(x, z):
    """the half-breadth of the inside at station x and height z"""
    lo, hi = 0.0, 1.0
    for _ in range(18):
        m = (lo + hi) / 2
        if sec(x, m)[1] < z: lo = m
        else: hi = m
    y, _ = sec(x, lo); return max(0.0, y - PLANK - 0.04)

def interior(A, fine=True):
    rr = random.Random(7)
    # floorboards, loose and worn, a gap or two
    y = -0.6
    while y < 0.6:
        x0 = 0.95; x1 = 5.55
        while x0 < x1 and inner_hb(x0, Z_FLOOR) < abs(y) + 0.1: x0 += 0.05
        while x1 > x0 and inner_hb(x1, Z_FLOOR) < abs(y) + 0.1: x1 -= 0.05
        if x1 - x0 > 0.3: abox(A, x0, x1, y, y + 0.14, Z_FLOOR - 0.025, Z_FLOOR + rr.uniform(-0.004, 0.006), rr.choice((C['wood_in'], C['wood_in2'], C['wood_in'], C['rail'])), skip=('-z',))
        y += 0.155
    # the thwarts: aft (the skipper's), middle, forward; their knees
    for tx, tz, wd in ((1.12, SEAT, 0.30), (4.25, 1.04, 0.25), (5.45, 1.08, 0.25)):
        hw = inner_hb(tx, tz)
        abox(A, tx - wd / 2, tx + wd / 2, -hw, hw, tz - 0.04, tz, C['wood_in'])
        for side in (1, -1): abox(A, tx - 0.03, tx + 0.03, side * hw - (0.12 if side > 0 else 0), side * hw + (0 if side > 0 else 0.12), tz - 0.25, tz - 0.04, C['wood_dk'])
    # the small foredeck and the stern seat's deck
    for x0, x1, dz in ((6.05, 6.95, -0.02), (0.08, 0.62, -0.05)):
        n = 8
        for i in range(n):
            a = x0 + (x1 - x0) * i / n; b = x0 + (x1 - x0) * (i + 1) / n; ha, hbb = inner_hb(a, zs(a) - 0.05) + 0.03, inner_hb(b, zs(b) - 0.05) + 0.03
            A.poly([V((a, -ha, zs(a) + dz)), V((b, -hbb, zs(b) + dz)), V((b, hbb, zs(b) + dz)), V((a, ha, zs(a) + dz))], C['wood_in2'], (0, 0, 1))

def engine(A, fine=True):
    """the engine box with the cylinder and its hot bulb up through the lid, the oil cup, the exhaust pipe, the flywheel's guard"""
    x0, x1, hw, top = ENG
    abox(A, x0, x1, -hw, hw, Z_FLOOR, top, C['wood_in2'], skip=('-z',))
    if fine:
        for k in range(1, 4): abox(A, x0 - 0.004, x1 + 0.004, -hw - 0.004, hw + 0.004, Z_FLOOR + k * 0.14 - 0.008, Z_FLOOR + k * 0.14, C['wood_dk'], skip=('-z', '+z'))
        abox(A, x0 - 0.02, x1 + 0.02, -hw - 0.02, hw + 0.02, top, top + 0.035, C['wood_dk'])               # the lid's rim
        obox(A, ((x0 + x1) / 2, hw + 0.03, top - 0.12), (0.06, 0, 0), (0, 0.02, 0), (0, 0, 0.02), C['iron'])   # a handle
    cx = 2.95
    acyl(A, (cx, 0.05, top), (cx, 0.05, top + 0.26), 0.13, lambda zz: C['iron'], 14)                     # the cylinder
    if fine:
        for k in range(4): acyl(A, (cx, 0.05, top + 0.05 + 0.05 * k), (cx, 0.05, top + 0.07 + 0.05 * k), 0.15, lambda zz: C['iron'], 14, cap=False)   # cooling fins
    arock(A, (cx, 0.05, top + 0.36), 0.13, (1, 1, 0.8), random.Random(2), lambda c_, n_: C['rust'], 2 if fine else 1)   # the hot bulb, rust-black
    acyl(A, (cx + 0.1, 0.18, top + 0.2), (cx + 0.1, 0.18, top + 0.3), 0.03, lambda zz: C['brass'], 8)    # the oil cup
    # the exhaust: out of the box's side, up past the gunwale, a little bend and a cap
    ex, ey, ez = EXH
    acyl(A, (ex, ey, top - 0.1), (ex, ey, ez - 0.12), 0.042, lambda zz: C['rust'] if zz < top + 0.3 else C['iron'], 10, cap=False, cuts=(top + 0.3,))
    acyl(A, (ex, ey, ez - 0.12), (ex - 0.06, ey, ez), 0.042, lambda zz: C['iron'], 10)
    # the flywheel's guard aft of the box, the gear lever and the throttle beside the skipper
    if fine:
        fx, fz = x0 - 0.08, Z_FLOOR + 0.31
        atorus(A, (fx, 0, fz), (1, 0, 0), 0.25, 0.035, lambda a: C['iron'], 24, 6)
        acyl(A, (fx - 0.05, 0, fz), (x0, 0, fz), 0.055, lambda zz: C['iron'], 10)
        for k in range(6):
            e = V((0, math.cos(k * math.pi / 3), math.sin(k * math.pi / 3))); beam(A, V((fx, 0, fz)) + e * 0.05, V((fx, 0, fz)) + e * 0.225, 0.03, 0.05, C['iron'], up=(1, 0, 0))
        acyl(A, (x0 - 0.15, 0.36, Z_FLOOR), (x0 - 0.05, 0.36, Z_FLOOR + 0.62), 0.016, lambda zz: C['iron'], 6)
        arock(A, (x0 - 0.05, 0.36, Z_FLOOR + 0.64), 0.035, (1, 1, 1), random.Random(4), lambda c_, n_: C['wood_dk'], 1)

def rudder(A):
    """the rudder: tall and narrow along the raked sternpost, its stock up to the head where the tiller goes in"""
    pts = [(0.15, 0.05), (-0.27, 0.08), (-0.38, 0.5), (-0.36, 1.0), (-0.16, 1.36), (-0.06, 1.38)]
    th = 0.025
    poly = [V((x, 0, z)) for x, z in pts]
    A.poly([p + V((0, th, 0)) for p in poly], C['chip2'], (0, 1, 0)); A.poly([p - V((0, th, 0)) for p in poly], C['chip2'], (0, -1, 0))
    for a, b in zip(poly, poly[1:]):
        A.poly([a + V((0, th, 0)), b + V((0, th, 0)), b - V((0, th, 0)), a - V((0, th, 0))], C['chip2'], ((a + b) / 2 - V((-0.12, 0, 0.7))))
    acyl(A, (-0.05, 0, 1.3), (-0.05, 0, 1.72), 0.03, lambda zz: C['wood_dk'], 8)

def steering(A, fine=True):
    """the iron gudgeons on the sternpost (the rudder itself turns with the tiller, tiller_part); the far model keeps a rudder of its own"""
    if fine:
        for z in (0.35, 0.8, 1.25): obox(A, (0.15 - 0.16 * z, 0, z), (0.06, 0, 0), (0, 0.035, 0), (0, 0, 0.025), C['rust'])
    else: rudder(A)

def tiller_part():
    """the tiller, the rudder and the flag pole lashed to the rudder head (their own part: they swing together about the rudder head)"""
    A = Acc('tiller')
    beam(A, TILLER[0], TILLER[1], 0.045, 0.05, C['wood_in'])
    acyl(A, (TILLER[1][0] - 0.03, 0, TILLER[1][2] + 0.003), (TILLER[1][0] + 0.07, 0, TILLER[1][2] - 0.013), 0.028, lambda zz: C['wood_dk'], 8)
    rudder(A)
    acyl(A, (-0.12, 0.08, 1.35), (-0.15, 0.1, 2.35), 0.018, lambda zz: C['wood_dk'], 6)
    return A.done(tint=wear)

def deck_gear(A, fine=True):
    rr = random.Random(11)
    if not fine: return
    # the old tarpaulin folded on the foredeck, sagging over its edge
    tarp(A)
    # a bollard on the foredeck, a cleat aft, thole pins amidships, the oars along the port side, a bailer and two fenders
    acyl(A, (6.55, 0, zs(6.55) - 0.02), (6.55, 0, zs(6.55) + 0.17), 0.05, lambda zz: C['wood_dk'], 8)
    acyl(A, (6.49, 0, zs(6.55) + 0.12), (6.61, 0, zs(6.55) + 0.12), 0.018, lambda zz: C['wood_dk'], 6)
    obox(A, (0.45, 0, zs(0.45) - 0.01), (0.09, 0, 0), (0, 0.02, 0), (0, 0, 0.02), C['iron'])
    for side in (1, -1):
        for tx in (4.0, 4.4): acyl(A, (tx, side * hb(tx), zs(tx) + 0.02), (tx, side * hb(tx), zs(tx) + 0.14), 0.014, lambda zz: C['wood_dk'], 6)
    for k, oz in enumerate((0.0, 0.03)):
        a = V((1.5, 0.55 - 0.08 * k, 1.045 + oz)); b = V((4.6, 0.62 - 0.08 * k, 1.065 + oz)); acyl(A, a, b, 0.022, lambda zz: C['wood_in'], 6)
        d = (b - a).normalized(); obox(A, b + d * 0.25, d * 0.25, V((0, 0, 1)).cross(d).normalized() * 0.065, V((0, 0, 0.012)), C['wood_in'])
    # rust run down from the fittings, on both sides
    for side in (1, -1):
        for fx in (1.0, 2.6, 4.2, 5.6):
            y, z = hb(fx) + 0.004, zs(fx) - 0.09
            A.poly([V((fx - 0.012, side * (y + 0.002), z)), V((fx + 0.012, side * (y + 0.002), z)), V((fx + 0.006, side * (hb(fx) * 0.97 + 0.004), z - 0.32)), V((fx - 0.006, side * (hb(fx) * 0.97 + 0.004), z - 0.32))], C['rust'], (0, side, 0))

def tarp(A):
    """Father's worn tarpaulin, folded in a heap on the foredeck, its loose end hanging down over the deck's aft edge"""
    nu, nv = 20, 12; xe = 6.07; zd = lambda x: zs(x) - 0.02; G = []; hang = 6
    for i in range(nu + 1):
        if i < hang:
            s = i / hang; x = xe - 0.04 + 0.04 * s; hw = 0.37
        else:
            s = (i - hang) / (nu - hang); x = xe + 0.52 * s; hw = max(0.06, min(0.36, inner_hb(x, zs(x) - 0.05) - 0.03))
        row = []
        for j in range(nv + 1):
            v = j / nv; yy = (2 * v - 1) * hw
            if i < hang:
                zz = zd(xe) + 0.01 - (0.30 + 0.06 * n3(yy * 6.0, 1.7)) * (1 - s) ** 1.3; xx = x - 0.025 * (1 - s) * (1 + n3(yy * 5.0, 2.3))
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

def crate(A, x0, y0, z0, m, L=0.80, W=0.40, H=0.30, rot=0.0):
    """a 70 litre fish crate, open at the top: the walls inside and out, the rim, the hand holds in the ends"""
    c = V((x0, y0, z0)); ca, sa = math.cos(rot), math.sin(rot); ax = V((ca, sa, 0)); ay = V((-sa, ca, 0)); t = 0.025
    P = lambda u, v, w: c + ax * u + ay * v + V((0, 0, w))
    for (u0, v0, u1, v1, n) in ((-L / 2, -W / 2, L / 2, -W / 2, -ay), (L / 2, -W / 2, L / 2, W / 2, ax), (L / 2, W / 2, -L / 2, W / 2, ay), (-L / 2, W / 2, -L / 2, -W / 2, -ax)):
        A.poly([P(u0, v0, 0), P(u1, v1, 0), P(u1, v1, H), P(u0, v0, H)], m, n)                         # outside, tapering a little
        iu0, iv0, iu1, iv1 = u0 * (1 - 2 * t / L), v0 * (1 - 2 * t / W), u1 * (1 - 2 * t / L), v1 * (1 - 2 * t / W)
        A.poly([P(iu0, iv0, 0.03), P(iu1, iv1, 0.03), P(iu1, iv1, H), P(iu0, iv0, H)], m, -n)          # inside
        A.poly([P(u0, v0, H), P(u1, v1, H), P(iu1, iv1, H), P(iu0, iv0, H)], m, (0, 0, 1))             # the rim
    A.poly([P(-L / 2 + t, -W / 2 + t, 0.03), P(L / 2 - t, -W / 2 + t, 0.03), P(L / 2 - t, W / 2 - t, 0.03), P(-L / 2 + t, W / 2 - t, 0.03)], C['crate_in'], (0, 0, 1))
    for su in (-1, 1):                                                                                   # the hand holds
        A.poly([P(su * (L / 2 + 0.002), -0.07, H - 0.09), P(su * (L / 2 + 0.002), 0.07, H - 0.09), P(su * (L / 2 + 0.002), 0.07, H - 0.04), P(su * (L / 2 + 0.002), -0.07, H - 0.04)], C['iron'], ax * su)

def crates(A):
    """fish crates on the floorboards between the middle and the forward thwart (the work place aft of the middle thwart stays clear)"""
    crate(A, 4.86, -0.22, Z_FLOOR, C['crate'], rot=0.02); crate(A, 4.86, 0.22, Z_FLOOR, C['crate2'], rot=-0.03)
    crate(A, 4.84, -0.21, Z_FLOOR + 0.30, C['crate'], rot=0.07)                                           # one stacked on top
    crate(A, 1.75, 0.34, Z_FLOOR, C['crate3'], L=0.6, W=0.4, H=0.25, rot=1.5)                            # a smaller one aft for bait and the jig

def gutting_table(A):
    """the gutting table across the port gunwale aft of the middle thwart: a scrubbed board with a rim on three sides, open over the
    side so the guts go overboard, on legs to the floor; the knife, a whetstone, the bucket for liver and roe"""
    x0, x1 = 3.42, 4.08; zt = zs(3.75) + 0.05; yo = hb(3.75) + 0.06; yi = 0.50
    abox(A, x0, x1, yi, yo, zt - 0.04, zt, C['table'])                                                   # the board, scrubbed pale
    for (a, b, c_, d) in ((x0, x0 + 0.03, yi, yo - 0.08), (x1 - 0.03, x1, yi, yo - 0.08), (x0, x1, yi, yi + 0.03)):
        abox(A, a, b, c_, d, zt, zt + 0.05, C['wood_dk'])                                               # the rim
    abox(A, 3.47, 3.53, yi + 0.02, yi + 0.08, Z_FLOOR, zt - 0.04, C['wood_dk'])                          # the leg
    abox(A, 4.01, 4.07, yi + 0.02, yi + 0.08, Z_FLOOR, zt - 0.04, C['wood_dk'])
    abox(A, 3.66, 3.80, yi + 0.12, yi + 0.17, zt, zt + 0.018, C['wood_dk'])                              # the knife's handle
    board(A, [V((3.80, yi + 0.135, zt + 0.004)), V((3.98, yi + 0.13, zt + 0.004)), V((3.98, yi + 0.155, zt + 0.004)), V((3.80, yi + 0.165, zt + 0.004))], (0, 0, 1), 0.003, C['steel'])
    abox(A, 3.48, 3.60, yi + 0.25, yi + 0.30, zt, zt + 0.022, C['stone'])                                # the whetstone
    acyl(A, (3.95, 0.30, Z_FLOOR), (3.95, 0.30, Z_FLOOR + 0.24), 0.13, lambda zz: C['crate3'], 12, r1=0.15, cap=False)   # the bucket
    acyl(A, (3.95, 0.30, Z_FLOOR + 0.005), (3.95, 0.30, Z_FLOOR + 0.01), 0.13, lambda zz: C['bilge'], 12)

def propeller():
    """the propeller (its own part, it turns in the game): three bronze blades, in the frame of its hub"""
    A = Acc('prop'); hx, hy, hz = PROP
    acyl(A, (hx - 0.06, hy, hz), (hx + 0.08, hy, hz), 0.045, lambda zz: C['bronze'], 10)
    for k in range(3):
        a = 2 * math.pi * k / 3
        c = V((hx, hy + math.cos(a) * 0.12, hz + math.sin(a) * 0.12)); r = V((0, math.cos(a), math.sin(a))); t = V((0, -math.sin(a), math.cos(a)))
        board(A, [c - r * 0.08 - t * 0.05 + V((0.02, 0, 0)), c - r * 0.08 + t * 0.05 - V((0.02, 0, 0)), c + r * 0.06 + t * 0.06 - V((0.02, 0, 0)), c + r * 0.06 - t * 0.05 + V((0.02, 0, 0))], V((1, 0, 0)) + t * 0.3, 0.01, C['bronze'])
    return A.done()

def build(fine=True):
    A = Acc('snekke')
    hull(A, fine); keel_stem(A, fine); interior(A, fine); engine(A, fine); steering(A, fine)
    if fine: frames(A); deck_gear(A, fine); crates(A); gutting_table(A)
    return [A.done(40, tint=wear)], [box('noglass', 0, 0.01, 0, 0.01, -50, -49.99, C['glass'])]


def cap_obj():
    """the lid inside the gunwales (drawn into depth only in the game, so the sea does not show inside the open boat when she rolls)"""
    xs = [x for x in XS if 0.06 <= x <= 6.96]
    yi = lambda x: max(0.004, hb(x) - PLANK - 0.02)
    ring = [(x, -yi(x), zs(x) - 0.03) for x in xs] + [(x, yi(x), zs(x) - 0.03) for x in reversed(xs)]
    bm = bmesh.new(); f = bm.faces.new([bm.verts.new(p) for p in ring]); f.normal_update()
    if f.normal.z < 0: f.normal_flip()
    o = obj_from_bm('CAP', bm, [C['paint2']]); o.hide_render = True
    return o


def to_game(p): return (-p[1], p[2] - WL, -(p[0] - XM))
def to_game_n(n): return (-n[1], n[2], -n[0])

def anchors():
    G = lambda x, y, z: [round(v, 3) for v in to_game((x, y, z))]
    gw = lambda x: round(zs(x) - WL, 3)
    names = []
    for sg, xs in ((1, [6.45 - 0.6 * k / 12 for k in range(13)]), (-1, [5.85 + 0.6 * k / 12 for k in range(13)])):
        B = []; T = []
        for x in xs:
            for arr, t in ((B, 0.72), (T, 0.86)):
                y, z = sec(x, t); n = sec_n(x, t); arr.append(G(x, sg * (y + n[0] * 0.012), z + n[1] * 0.012))
        names.append([B, T])
    gwx = lambda x, up: [round(-(hb(x) - 0.05), 3) * -1, round(zs(x) - WL + up, 3), round(-(x - XM), 3)]   # on the starboard gunwale (game x to starboard)
    sk = {'sole': round(Z_FLOOR - WL, 3), 'tiller': {'post': G(*TILLER[0]), 'grip': G(*TILLER[1])}, 'inboard': True, 'prop': G(*PROP), 'sit': True,
          'tub': G(3.85, -0.55, Z_FLOOR), 'fisher': G(3.5, -0.45, Z_FLOOR), 'reel': gwx(3.6, 0.2), 'haul': gwx(4.7, 0.24),
          'mach': [gwx(x, 0.12) for x in (3.2, 3.75, 4.35)], 'stack': G(1.85, 0.0, Z_FLOOR), 'charm': G(2.75, 0.32, ENG[3] + 0.06),
          'skipper': G(1.12, 0.36, SEAT - 0.46), 'seat': G(4.25, 0.45, 1.04 - 0.46), 'filler': G(2.45, 0.3, ENG[3] + 0.04), 'names': names}
    return {'eye': G(1.12, 0.36, SEAT + 0.82), 'skipperAt': G(1.12, 0.36, Z_FLOOR), 'hp': -0.22, 'fov': 62,
            'crewSpots': [G(4.25, 0.45, 1.04) + [0.0]], 'hauler': sk['haul'], 'filler': sk['filler'], 'pole': G(-0.15, 0.1, 2.35),
            'exhaust': G(*EXH), 'engine': G(2.95, 0.05, ENG[3] + 0.2), 'skiff': sk,
            'lights': [[G(6.6, 0.45, zs(6.6) + 0.04), [1, 0.12, 0.1]], [G(6.6, -0.45, zs(6.6) + 0.04), [0.1, 1, 0.35]], [G(-0.05, 0, 1.76), [1, 0.95, 0.85]]],
            'deck': {'y': round(Z_FLOOR - WL, 3), 'z': round(-(1.2 - XM), 3)}, 'gw': gw(3.4), 'stern': round(XM + 0.1, 3), 'bow': round(-(L - XM), 3), 'side': 1.0,
            'beam': 2.26, 'pl': 2.6, 'rl': 1.2, 'open': True, 'hand': True, 'inboard': True,
            'work': {'table': G(3.75, 0.62, Z_FLOOR), 'tub': G(3.8, -0.6, Z_FLOOR), 's': 0.75, 'own': True, 'top': round(zs(3.75) + 0.05 - WL, 3)}}

SHOTS = [('side', (3.2, -11.0, 1.4), (3.2, 0.0, 0.9), 30), ('q3', (9.5, -7.5, 3.0), (3.2, 0.0, 0.8), 30), ('stern', (-5.5, -4.0, 2.6), (2.6, 0.0, 0.9), 30),
         ('above', (3.0, -3.5, 6.5), (3.3, 0.0, 0.7), 34), ('engine', (1.2, -1.7, 2.1), (2.9, 0.0, 1.0), 32)]

def main():
    os.makedirs(OUT, exist_ok=True)
    reset(); colours()
    solids, glass = build(True)
    join(solids, 'BOAT0'); join(glass, 'GLASS0')
    pr = propeller(); tl = tiller_part()
    if 'fast' not in sys.argv and 'dry' not in sys.argv: beauty(OUT, 'snekke', WL, SHOTS)
    rel = lambda c: (lambda p: tuple(a - b for a, b in zip(to_game(p), to_game(c))))
    more = [{'name': 'cap', 'obj': cap_obj}, {'name': 'prop', 'obj': pr, 'xf_p': rel(PROP), 'xf_n': to_game_n, 'ao': False, 'show': True},
            {'name': 'tiller', 'obj': tl, 'xf_p': rel(TILLER[0]), 'xf_n': to_game_n, 'ao': True, 'show': True}]
    ex = {'frame': 'kystfiske: x starboard, y up from the waterline, z aft; metres', 'type': 'snekke23', 'name': 'Trebåt 23 fot med semidiesel (7,0 m)', 'len': L, 'beam': 2.26, 'draft': WL,
          'anchors': anchors()}
    export_boat(build, to_game, to_game_n, OUT, 'snekke23.glb', os.path.join(ROOT, 'src', 'data', 'boat-snekke23.b64'), ex,
                side=(os.path.join(ROOT, 'src', 'data', 'boat-snekke23-side.b64'), 3.4, 0.9, 8.2), dry='dry' in sys.argv, more=more)


if __name__ == '__main__':
    main()
