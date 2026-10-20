"""The deck crane: a marine knuckle-boom crane of the kind a 15-21 m Norwegian coastal boat carries on its deck, built in Blender
as parts that the game moves itself (the caller's spec 19.10.2026). Modelled on the small marine knuckle-boom cranes of the
2-3 t*m class (HMF, Palfinger, Fassi); no maker's name, logo or text is on the model.

Real measures it leans on (the makers' product pages, read 19.10.2026; these are the truck versions of the same booms, the marine
versions add corrosion protection and a pedestal):
    Fassi F32A        2.75 t*m (27 kNm), hydraulic outreach up to 6.90 m, slewing 370 deg, dead weight 390-465 kg (fassi.com)
    Palfinger PK 2900 2.5 t*m, max. lifting capacity 990 kg, max. hydraulic outreach 6.4 m (the B version), 374 kg (palfinger.com)
    HMF 330 K3        28.4 kNm, max. reach 7.1 m (lectura-specs.com)
The boom lengths are the caller's (main boom 2.4 m pivot to pivot, outer boom 2.2 m, two telescopes of about 1.8 m sliding 1.45 m
each), which gives 7.7 m of hydraulic reach with the outer boom level: a little more than the cranes above, so the safe working load
at full reach is put at 0.3 t (about 2.6 t*m spread over 7.7 m, as the load charts of the class fall off).

Parts, each with its own origin at its pivot (the game composes base -> col (slew about y) -> b1 (a1 about x) -> b2 (a2 about x)
-> ext1 -> ext2 (sliding along b2's axis), and hangs the hook on a wire under the tip):
    base    the pedestal bolted to the deck: a 0.56 m square foot flange with eight bolts, a 0.34 m tube with four gussets, the top
            flange and the slewing ring's fixed race in its gear housing with a ring of bolts; 0.35 m high. From the deck.
    col     the slewing column: the slewing housing (a rounded box that turns on the ring) with the slewing motor at its back,
            the lift cylinder's lugs at its front, a tapered polygonal column up to the main boom's pivot bracket (two cheek
            plates and the pin) 1.15 m over the ring, the control valve bank (four sections) on the +x side with two cross
            levers (each works two functions) with red knobs, and the hoses up the column. From the slew axis on the ring.
    b1      the main boom: a polygonal box section 0.20 x 0.25 m at the root tapering to 0.18 x 0.22 m, its end cranked down
            and narrowed into the knuckle's tongue; the lift cylinder's lugs under it, the knuckle cylinder's raised bracket on
            top, hoses with clamps along its +x side. From its pivot, lying along -z.
    b2      the outer boom: 0.16 x 0.20 m, open at the far end where the telescopes come out (wear pads in the mouth), its heel a
            fork of two plates round the main boom's tongue, carrying the knuckle pin and the horn the knuckle cylinder pushes on;
            hoses along its +x side. From the knuckle pin, lying along -z (its axis 0.13 m over the pin).
    ext1    the first telescope, 1.85 m, 0.13 x 0.165 m, with its collar and the wear pads for ext2. From its rear end.
    ext2    the second telescope, 1.80 m, 0.104 x 0.136 m, with the tip head: a sheave of 0.15 m in a fork. From its rear end.
    hook    the hook block: the wire's socket, a swivel with its nut, and a painted crane hook with a steel safety latch;
            0.35 m tall. From the top, where the wire is made fast.
    cyl1b   the lift cylinder's barrel (Ø0.11 m), from its base eye, lying along -z; a steel pipe along it to the rod end
    cyl1r   its chrome rod (Ø0.06 m), from the rod eye, lying along +z back into the barrel
    cyl2b   the knuckle cylinder's barrel (Ø0.09 m), as cyl1b
    cyl2r   its rod (Ø0.05 m), as cyl1r
    rest    the boom rest: a square post with a foot flange and a rubber-lined V cradle that fits the outer boom's underside. From
            the deck; the cradle's seat is at rest_h.

What I chose myself: the column's height (1.15 m to the pivot, so the cylinder fits and people walk under the boom), the mount
points of both cylinders (worked out so they fit their strokes and clear the steel in every pose: the barrel never runs past the
rod's eye and the rod never past the barrel's base), the cylinders' lengths (the lift cylinder is 0.75 + 0.72 m, shorter than the
spec's 1.1 m, because a 1.15 m column cannot hold a longer one over the boom's 90 degrees; the knuckle cylinder is 1.15 + 1.10 m,
longer than the spec's 0.9 m, because a direct-acting cylinder needs that stroke for the 150 degrees of the knuckle), the
knuckle's horn instead of a link system (the game moves no links; the horn gives the knuckle -166..-18 degrees), the polygonal
section of the booms, the colours, the hoses' runs and the valve bank's look.

Limits for the game (extras): a1_range and a2_range are where the cylinders fit their strokes and clear the steel; a2_min is a
table [a1, a2] of how far the knuckle may close at each main boom angle before the folded outer boom touches the column or the
lift cylinder (fold the crane with the main boom raised, as on a real one). Checked in Blender: no part crosses another in the
stow, park and work poses (the pins through their eyes and the telescopes in their sleeves excepted).

The park pose: a folded crane cannot lie flat (the outer boom is nearly as long as the main boom and would hit the column and the
lift cylinder), so the parked crane lies stretched out with the knuckle a little closed and the outer boom resting in the rest's
cradle near its end, as cranes on boats are laid down for steaming.

    pip install bpy==4.5.4
    python3 tools/deck/kran.py          -> src/data/deck-crane.b64, renders tools/deck/out/kran_*.png
    python3 tools/deck/kran.py fast     -> without the renders

Frames. Here in Blender: x to starboard, y forward, z up; every part is built round its own origin. The game's: x to starboard, y
up, z aft; to_game(p) = (x, z, -y), a proper rotation, so a turn about x keeps its angle and sign (positive raises the tip)."""
import os, sys, math, base64
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))
sys.path.insert(0, os.path.join(ROOT, 'tools', 'boats'))
import bpy, bmesh
from mathutils import Vector, Matrix
from mathutils.bvhtree import BVHTree
from bpyutil import *

OUT = os.path.join(HERE, 'out')
C = {}
def colours():
    C['red'] = mat('red', (0.68, 0.08, 0.06), 0.5)                      # the crane's signal red, painted steel
    C['grey'] = mat('grey', (0.20, 0.21, 0.22), 0.4)                    # the pedestal and the rest
    C['dark'] = mat('dark', (0.09, 0.09, 0.10), 0.45)                   # the valve bank, the slewing motor, fittings
    C['black'] = mat('black', (0.03, 0.03, 0.035), 0.35)                # hoses
    C['rubber'] = mat('rubber', (0.035, 0.035, 0.04), 0.15)
    C['chrome'] = mat('chrome', (0.85, 0.86, 0.88), 0.92, metal=1.0)     # the rods
    C['steel'] = mat('steel', (0.56, 0.58, 0.60), 0.55, metal=0.7)       # pins, bolts, the latch
    C['race'] = mat('race', (0.30, 0.31, 0.32), 0.5, metal=0.6)          # the slewing ring's race
    C['knob'] = mat('knob', (0.78, 0.06, 0.05), 0.65)
    C['yellow'] = mat('yellow', (0.95, 0.72, 0.08), 0.5)
    C['pad'] = mat('pad', (0.80, 0.78, 0.70), 0.3)                      # the wear pads' nylon

def to_game(p): return (p[0], p[2], -p[1])
def to_game_n(n): return (n[0], n[2], -n[1])
def G(p): return [round(v, 4) for v in to_game(p)]

# ---------- measures (Blender frame of each part, metres) ----------
H_BASE = 0.35                                # the slewing ring's top over the deck: col_at
P1 = V((0.0, -0.04, 1.15))                   # the main boom's pivot (col frame)
C1A = V((0.0, 0.31, 0.09))                   # the lift cylinder's base pin (col frame)
K2 = V((0.0, 2.40, -0.06))                   # the knuckle pin (b1 frame): the main boom is 2.40 m pivot to pivot
C1B = V((0.0, 0.36, -0.17))                  # the lift cylinder's rod pin (b1 frame)
C2A = V((0.0, 0.75, 0.42))                   # the knuckle cylinder's base pin on its bracket (b1 frame)
HR, HA = 0.46, math.radians(172)             # the horn on b2's heel: radius and angle from b2's axis
C2B = V((0.0, HR * math.cos(HA), HR * math.sin(HA)))   # the knuckle cylinder's rod pin (b2 frame)
VB = 0.13                                    # b2's axis over its pin
B2W, B2H, B2_Y0, B2_Y1 = 0.16, 0.20, 0.17, 2.25        # b2's section, its heel and its mouth (2.2 m of boom beyond the pin)
E1W, E1H, E1L, E1_AT = 0.13, 0.165, 1.85, 0.45         # ext1: section, length, where its rear sits in b2 when in
E2W, E2H, E2L, E2_AT = 0.104, 0.136, 1.80, 0.08        # ext2: the same in ext1
EXT_MAX = 1.45                               # how far each telescope slides out (0.35 and 0.32 m stay inside)
SHV = V((0.0, E2L + 0.14, 0.0)); SHV_R = 0.075         # the tip sheave (ext2 frame) and its radius
TIP = SHV + V((0.0, 0.067, 0.0))             # where the wire leaves the sheave's groove, hanging down
L1B, R1B, L1R, R1R = 0.75, 0.055, 0.72, 0.030          # the lift cylinder: barrel and rod
L2B, R2B, L2R, R2R = 1.15, 0.045, 1.10, 0.025          # the knuckle cylinder
HOOK_H = 0.35
A1_RANGE = (math.radians(-10), math.radians(80))       # where the lift cylinder fits its stroke and clears the steel
A2_RANGE = (math.radians(-166), math.radians(-18))     # the same for the knuckle

# ---------- small builders on an Acc (one mesh with a material per face) ----------
def arc(c, r, a0, a1, n):
    return [(c[0] + r * math.cos(math.radians(a0 + (a1 - a0) * k / n)), c[1] + r * math.sin(math.radians(a0 + (a1 - a0) * k / n))) for k in range(n + 1)]

def aloft(A, rings, m, cap0=False, cap1=False, cen=None, ref=None, flat=False, inward=False):
    """quads between rings of equal length; each face turned away from its rings' centre (or from ref), or towards it if inward;
    flat gives every strip its own vertices, so the section's corners stay sharp"""
    rings = [[V(p) for p in r] for r in rings]; n = len(rings[0])
    cs = [V(c) for c in cen] if cen else [sum(r, V()) / n for r in rings]
    sg = -1 if inward else 1
    vs = [[A.v(p) for p in r] for r in rings]
    for i in range(len(rings) - 1):
        for k in range(n):
            j = (k + 1) % n
            if flat: q = [A.v(rings[i][k]), A.v(rings[i][j]), A.v(rings[i + 1][j]), A.v(rings[i + 1][k])]
            else: q = [vs[i][k], vs[i][j], vs[i + 1][j], vs[i + 1][k]]
            mid = (rings[i][k] + rings[i][j] + rings[i + 1][j] + rings[i + 1][k]) / 4
            o = mid - (V(ref) if ref is not None else (cs[i] + cs[i + 1]) / 2)
            A.f(q, m, o * sg)
    if cap0: A.f(list(vs[0]) if not flat else [A.v(p) for p in rings[0]], m, (cs[0] - cs[1]) * sg)
    if cap1: A.f(list(vs[-1]) if not flat else [A.v(p) for p in rings[-1]], m, (cs[-1] - cs[-2]) * sg)

def ring_at(c, s, u, r, seg, a0=0.0):
    return [c + (s * math.cos(a0 + 2 * math.pi * k / seg) + u * math.sin(a0 + 2 * math.pi * k / seg)) * r for k in range(seg)]

def ac(A, p0, p1, r, m, seg=12, cap0=True, cap1=True, r1=None):
    """a cylinder (or a cone) from p0 to p1"""
    p0 = V(p0); p1 = V(p1); s, u, d = frame_of(p1 - p0); r1 = r if r1 is None else r1; a0 = math.pi / seg
    aloft(A, [ring_at(p0, s, u, r, seg, a0), ring_at(p1, s, u, r1, seg, a0)], m, cap0, cap1, [p0, p1])

def apin(A, c, half, r, m, cap_r=None, cap_t=0.012, seg=8, sides=(1,)):
    """a pin along x through c, with a cap (the retaining plate's boss) on the given ends"""
    c = V(c); ac(A, c - V((half, 0, 0)), c + V((half, 0, 0)), r, m, seg)
    if cap_r:
        for s in sides: ac(A, c + V((s * (half - cap_t), 0, 0)), c + V((s * half, 0, 0)), cap_r, m, seg, cap0=False)

def lathe_x(A, c, prof, m, seg=16, ref=None):
    """a body of revolution about x through c: prof [(radius, x)]"""
    c = V(c); rings = [[c + V((x, r * math.cos(2 * math.pi * k / seg), r * math.sin(2 * math.pi * k / seg))) for k in range(seg)] for r, x in prof]
    aloft(A, rings, m, True, True, ref=ref if ref is not None else c)

def extrude(A, poly, P, t0, t1, m):
    """a 2D polygon (a, b) pushed from t0 to t1 by the linear map P(a, b, t) -> 3D; sides turned away from its inside"""
    ar = sum(poly[i][0] * poly[(i + 1) % len(poly)][1] - poly[(i + 1) % len(poly)][0] * poly[i][1] for i in range(len(poly)))
    lo = [A.v(P(a, b, t0)) for a, b in poly]; hi = [A.v(P(a, b, t1)) for a, b in poly]
    ax = P(0, 0, t1) - P(0, 0, t0)
    A.f(lo, m, -ax); A.f(hi, m, ax)
    n = len(poly)
    for k in range(n):
        j = (k + 1) % n; ea = poly[j][0] - poly[k][0]; eb = poly[j][1] - poly[k][1]
        oa, ob = (eb, -ea) if ar > 0 else (-eb, ea)
        mid = ((poly[k][0] + poly[j][0]) / 2, (poly[k][1] + poly[j][1]) / 2)
        A.f([lo[k], lo[j], hi[j], hi[k]], m, P(mid[0] + oa, mid[1] + ob, t0) - P(mid[0], mid[1], t0))

def plate_x(A, poly, x0, x1, m):
    """a plate in the y-z plane (points (y, z)) from x0 to x1"""
    extrude(A, poly, lambda a, b, t: V((t, a, b)), x0, x1, m)

def prism_z(A, poly, z0, z1, m):
    extrude(A, poly, lambda a, b, t: V((a, b, t)), z0, z1, m)

def plate_pair(A, poly, x0, x1, m):
    """the same plate on both sides of x = 0, from |x| = x0 to x1"""
    plate_x(A, poly, x0, x1, m); plate_x(A, poly, -x1, -x0, m)

def catmull(p0, p1, p2, p3, t):
    t2 = t * t; t3 = t2 * t
    return 0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3)

def smooth(ctrl):
    """a Catmull-Rom curve through the points, with more points where it bends"""
    P = [V(p) for p in ctrl]; out = []
    def turn(i):
        if i <= 0 or i >= len(P) - 1: return 0.0
        a = (P[i] - P[i - 1]); b = (P[i + 1] - P[i])
        return a.angle(b) if a.length > 1e-6 and b.length > 1e-6 else 0.0
    for i in range(len(P) - 1):
        n = 1 + int(max(turn(i), turn(i + 1)) / math.radians(32))
        for k in range(n): out.append(catmull(P[max(0, i - 1)], P[i], P[i + 1], P[min(len(P) - 1, i + 2)], k / n))
    out.append(P[-1]); return out

def asweep(A, pts, rad, m, seg=6, cap0=True, cap1=True):
    """a tube along the points with a rotation-minimising frame; rad is one radius or one per point"""
    pts = [V(p) for p in pts]; n = len(pts)
    rad = list(rad) if isinstance(rad, (list, tuple)) else [rad] * n
    T = [(pts[min(n - 1, i + 1)] - pts[max(0, i - 1)]).normalized() for i in range(n)]
    s, u, _ = frame_of(T[0]); rings = []
    for i in range(n):
        if i:
            q = T[i - 1].rotation_difference(T[i]); s = q @ s; u = q @ u
        rings.append(ring_at(pts[i], s, u, rad[i], seg))
    aloft(A, rings, m, cap0, cap1, pts)

def hose(A, ctrl, r=0.011, m=None, seg=5):
    asweep(A, smooth(ctrl), r, m or C['black'], seg)

def sect(w, h):
    """the booms' polygonal section in (x, z): flat top with small chamfers, upright sides, the lower half closing in"""
    hw, hh = w / 2, h / 2; c = 0.24 * hw
    return [(-hw + c, hh), (hw - c, hh), (hw, hh - c), (hw, -0.05 * hh), (0.50 * hw, -hh), (-0.50 * hw, -hh), (-hw, -0.05 * hh), (-hw, hh - c)]

def boom(A, st, m, cap0=True, cap1=True):
    """a boom along y through stations (y, w, h, zc)"""
    rings = [[(x, y, zc + z) for x, z in sect(w, h)] for y, w, h, zc in st]
    aloft(A, rings, m, cap0, cap1, [(0, y, zc) for y, w, h, zc in st], flat=True)

def mouth(A, y, zc, wo, ho, wi, hi, depth, m_rim, m_in):
    """the open end of a boom at y: the rim from the outer section to the inner, and the inside going back depth, dark"""
    o = [V((x, y, zc + z)) for x, z in sect(wo, ho)]; i0 = [V((x, y, zc + z)) for x, z in sect(wi, hi)]; i1 = [V((x, y - depth, zc + z)) for x, z in sect(wi, hi)]
    vo = [A.v(p) for p in o]; vi0 = [A.v(p) for p in i0]; n = len(o)
    for k in range(n):
        j = (k + 1) % n; A.f([vo[k], vo[j], vi0[j], vi0[k]], m_rim, (0, 1, 0))
    aloft(A, [i0, i1], m_in, False, False, [V((0, y, zc)), V((0, y - depth, zc))], flat=True, inward=True)
    A.poly(i1, m_in, (0, 1, 0))

def pads(A, y, zc, wi, hi, wo, ho, L, m):
    """wear pads in the gap between a boom's inside (wi x hi) and the boom sliding in it (wo x ho): top, bottom and the two sides"""
    t = 0.5 * (hi - ho); s = 0.5 * (wi - wo)
    for z0, z1, w in ((zc + ho / 2, zc + ho / 2 + t, 0.45 * wo), (zc - ho / 2 - t, zc - ho / 2, 0.35 * wo)):
        abox(A, -w / 2, w / 2, y - L, y, z0, z1, m)
    for sx in (-1, 1):
        x0, x1 = sorted((sx * wo / 2, sx * (wo / 2 + s)))
        abox(A, x0, x1, y - L, y, zc - 0.10 * ho, zc + 0.30 * ho, m)

def bolt(A, c, r, h, m, up=(0, 0, 1)):
    ac(A, V(c), V(c) + V(up) * h, r, m, seg=6, cap0=False)

def clamp(A, c, w, m):
    """a hose clamp: a small block over the hoses, w across"""
    abox(A, c[0] - 0.012, c[0] + 0.018, c[1] - w / 2, c[1] + w / 2, c[2] - 0.035, c[2] + 0.035, m)

# ---------- the parts ----------
def part_base():
    A = Acc('base'); g = C['grey']
    s, ch = 0.28, 0.06
    prism_z(A, [(-s + ch, -s), (s - ch, -s), (s, -s + ch), (s, s - ch), (s - ch, s), (-s + ch, s), (-s, s - ch), (-s, -s + ch)], 0.0, 0.03, g)
    for x, y in ((0.22, 0.22), (-0.22, 0.22), (0.22, -0.22), (-0.22, -0.22), (0.235, 0), (-0.235, 0), (0, 0.235), (0, -0.235)):
        bolt(A, (x, y, 0.03), 0.02, 0.018, C['steel'])                                   # a flanged nut
    ac(A, (0, 0, 0.03), (0, 0, 0.27), 0.17, g, seg=20, cap0=False, cap1=False)
    for k in range(4):
        a = math.pi / 4 + k * math.pi / 2; ca, sa = math.cos(a), math.sin(a)
        P = lambda r, z, t: V((r * ca - t * sa, r * sa + t * ca, z))
        extrude(A, [(0.165, 0.03), (0.265, 0.03), (0.265, 0.06), (0.165, 0.21)], P, -0.007, 0.007, g)
    ac(A, (0, 0, 0.27), (0, 0, 0.295), 0.25, g, seg=24, cap1=False)
    ac(A, (0, 0, 0.295), (0, 0, 0.334), 0.262, g, seg=24, cap1=False)                    # the gear housing
    ac(A, (0, 0, 0.334), (0, 0, 0.35), 0.232, C['race'], seg=24, cap0=False)             # the fixed race
    for k in range(10):
        a = 2 * math.pi * (k + 0.5) / 10
        bolt(A, (0.247 * math.cos(a), 0.247 * math.sin(a), 0.334), 0.010, 0.009, C['steel'])
    ac(A, (0.262, -0.06, 0.315), (0.285, -0.06, 0.315), 0.008, C['steel'], seg=6)       # grease nipple
    return A.done(40)

def column_ring(z, w, d, yc, c):
    return [V((x, yc + y, z)) for x, y in ((-w / 2 + c, -d / 2), (w / 2 - c, -d / 2), (w / 2, -d / 2 + c), (w / 2, d / 2 - c), (w / 2 - c, d / 2), (-w / 2 + c, d / 2), (-w / 2, d / 2 - c), (-w / 2, -d / 2 + c))]

def part_col():
    A = Acc('col'); r = C['red']; dk = C['dark']
    # the slewing housing: a rounded box that turns on the ring
    prism_z(A, rrect(0.0, -0.045, 0.50, 0.51, 0.07, 3), 0.0, 0.15, r)
    ac(A, (0, 0, -0.012), (0, 0, 0.0), 0.215, C['race'], seg=24, cap0=False, cap1=False)  # the turning race under it
    # the column: tapered, polygonal, from the housing to the pivot bracket
    zs = [(0.15, 0.30, 0.30, -0.01, 0.075), (0.95, 0.24, 0.27, -0.03, 0.06)]
    aloft(A, [column_ring(z, w, d, yc, c) for z, w, d, yc, c in zs], r, False, True, [V((0, yc, z)) for z, w, d, yc, c in zs], flat=True)
    abox(A, -0.16, 0.16, -0.17, 0.11, 0.15, 0.175, r)                                      # the column's foot plate
    # the pivot bracket: two cheeks round the pin, the pin and its caps
    py, pz = P1.y, P1.z
    cheek = [(0.115, 0.88), (0.10, 1.0)] + arc((py, pz), 0.105, -35, 215, 10) + [(-0.17, 1.02), (-0.18, 0.88)]
    plate_pair(A, cheek, 0.104, 0.124, r)
    apin(A, P1, 0.142, 0.035, C['steel'], cap_r=0.05, sides=(-1, 1))
    bolt(A, (0.142, py + 0.06, pz), 0.012, 0.012, C['steel'], up=(1, 0, 0))               # the pin's lock bolt
    abox(A, 0.124, 0.13, py + 0.035, py + 0.085, pz - 0.015, pz + 0.015, C['steel'])
    abox(A, -0.104, 0.104, -0.17, -0.12, 0.88, 1.05, r)                                    # the bracket's back plate
    # the lift cylinder's lugs at the front, welded to the housing and the column
    cy, cz = C1A.y, C1A.z
    lug = [(0.12, 0.012), (cy, 0.012)] + arc((cy, cz), 0.065, -90, 100, 8) + [(0.20, 0.27), (0.125, 0.36)]
    plate_pair(A, lug, 0.062, 0.078, r)
    apin(A, C1A, 0.092, 0.024, C['steel'], cap_r=0.036)
    # the slewing motor at the back: a hydraulic motor standing on the housing, its pinion in the gear housing under it
    ac(A, (0, -0.25, 0.15), (0, -0.25, 0.17), 0.075, dk, seg=12, cap0=False)
    ac(A, (0, -0.25, 0.17), (0, -0.25, 0.30), 0.056, dk, seg=12, cap0=False, cap1=False)
    ac(A, (0, -0.25, 0.30), (0, -0.25, 0.32), 0.06, dk, seg=12, cap0=True)
    for k, a in enumerate((-50, -15)):
        q = V((0.056 * math.cos(math.radians(a)), -0.25 + 0.056 * math.sin(math.radians(a)), 0.27 - 0.05 * k))
        ac(A, q, q + V((0.02, -0.005, 0)), 0.012, C['steel'], seg=6, cap0=False)
        hose(A, [q + V((0.02, -0.005, 0)), q + V((0.09, 0.02, -0.02)), (0.225, -0.06 + 0.03 * k, 0.43)], 0.010)
    # the control valve bank on the +x side: a bracket, four sections between two end covers, tie rods, spools and two levers
    abox(A, 0.140, 0.190, -0.13, 0.13, 0.40, 0.42, dk)                                     # the bracket's arms
    abox(A, 0.135, 0.150, -0.13, 0.13, 0.40, 0.62, dk)
    x0, x1, z0, z1 = 0.19, 0.29, 0.43, 0.575
    abox(A, x0 - 0.005, x1 + 0.005, -0.135, -0.100, z0 - 0.01, z1 + 0.01, dk)              # the inlet cover
    abox(A, x0 - 0.005, x1 + 0.005, 0.088, 0.118, z0 - 0.01, z1 + 0.005, dk)               # the end cover
    ports = []
    for k in range(4):
        y0 = -0.098 + 0.0465 * k
        abox(A, x0, x1, y0, y0 + 0.044, z0, z1, mat('valve', (0.13, 0.135, 0.14), 0.5))
        ac(A, (0.24, y0 + 0.022, z1), (0.24, y0 + 0.022, z1 + 0.02), 0.011, C['steel'], seg=6, cap0=False)     # the spool's top
        q = V((x1, y0 + (0.012 if k % 2 == 0 else 0.032), 0.47 if k % 2 == 0 else 0.53)); ports.append(q + V((0.014, 0, 0)))
        ac(A, q, q + V((0.014, 0, 0)), 0.009, C['steel'], seg=6, cap0=False)                      # the work port
    for z in (0.445, 0.56):
        ac(A, (0.28, -0.14, z), (0.28, 0.123, z), 0.006, C['steel'], seg=5)                 # tie rods
    # the levers: each on a gimbal block over two spools, so one lever works two functions
    for k, y in enumerate((-0.052, 0.041)):
        abox(A, 0.215, 0.265, y - 0.024, y + 0.024, z1 + 0.02, z1 + 0.05, dk)
        ac(A, (0.24, y, z1 + 0.05), (0.24, y, z1 + 0.07), 0.016, C['rubber'], seg=8, r1=0.010, cap0=False)    # the boot
        tip = V((0.33, y + (0.012 if k else -0.012), 0.86))
        ac(A, (0.24, y, z1 + 0.06), tip, 0.008, C['steel'], seg=6)
        sphere_a(A, tip + (tip - V((0.24, y, z1 + 0.06))).normalized() * 0.02, 0.026, C['knob'], seg=8, rings=5)
    # hoses: four work lines from the valve's ports up the column to the boom's root, two supply lines into the housing
    for k, q in enumerate(ports):
        xs = 0.165 + 0.02 * (k % 2)
        hose(A, [q, q + V((0.04, 0, 0.04)), (x1 + 0.02, q.y - 0.03, 0.66), (xs, -0.15 - 0.012 * k, 0.80), (0.15 - 0.004 * k, -0.20 - 0.008 * k, 1.0),
                 (0.097 - 0.022 * k, -0.235, 1.17), (0.097 - 0.022 * k, -0.20, 1.27)], 0.0105)
    for k in range(2):
        y0 = -0.125 + 0.012 * k
        hose(A, [(x0 - 0.005, y0, 0.50 - 0.03 * k), (0.185, -0.17 + 0.03 * k, 0.30), (0.175, -0.20 + 0.03 * k, 0.15)], 0.013)
    return A.done(40)

def sphere_a(A, c, r, m, seg=10, rings=6):
    c = V(c); vs = []
    for i in range(1, rings):
        t = math.pi * i / rings
        vs.append([c + V((r * math.sin(t) * math.cos(2 * math.pi * k / seg), r * math.sin(t) * math.sin(2 * math.pi * k / seg), r * math.cos(t))) for k in range(seg)])
    aloft(A, vs, m, False, False, ref=c)
    top = A.v(c + V((0, 0, r))); bot = A.v(c - V((0, 0, r)))
    r0 = [A.v(p) for p in vs[0]]; r1 = [A.v(p) for p in vs[-1]]
    for k in range(seg):
        j = (k + 1) % seg
        A.f([top, r0[k], r0[j]], m, (vs[0][k] + vs[0][j]) / 2 - c + V((0, 0, r)))
        A.f([bot, r1[j], r1[k]], m, (vs[-1][k] + vs[-1][j]) / 2 - c - V((0, 0, r)))

def part_b1():
    A = Acc('b1'); r = C['red']
    ac(A, (-0.10, 0, 0), (0.10, 0, 0), 0.075, r, seg=12)                                   # the root boss round the pivot pin
    st = [(0.0, 0.20, 0.16, 0.0), (0.12, 0.20, 0.25, 0.0), (1.80, 0.18, 0.22, 0.0), (2.06, 0.13, 0.18, -0.022), (2.34, 0.13, 0.15, -0.050)]
    boom(A, st, r)
    ky, kz = K2.y, K2.z
    ac(A, (-0.065, ky, kz), (0.065, ky, kz), 0.07, r, seg=12)                               # the knuckle's tongue boss
    # the lift cylinder's lugs under the boom
    y, z = C1B.y, C1B.z
    plate_pair(A, [(y - 0.15, -0.10), (y + 0.15, -0.10), (y + 0.09, z - 0.02)] + arc((y, z), 0.05, -20, -160, 6) + [(y - 0.09, z - 0.02)], 0.044, 0.058, r)
    apin(A, C1B, 0.07, 0.02, C['steel'], cap_r=0.03)
    # the knuckle cylinder's bracket on top
    y, z = C2A.y, C2A.z
    plate_pair(A, [(y - 0.25, 0.10), (y + 0.28, 0.10), (y + 0.05, z - 0.045)] + arc((y, z), 0.055, -40, 200, 8) + [(y - 0.12, z - 0.05)], 0.048, 0.062, r)
    abox(A, -0.048, 0.048, y - 0.20, y + 0.16, 0.10, 0.14, r)                               # the web between them
    apin(A, C2A, 0.074, 0.019, C['steel'], cap_r=0.03)
    # hoses along the +x side: two to the knuckle cylinder (a fitting block on the bracket), two on to the knuckle
    abox(A, 0.062, 0.085, y - 0.10, y - 0.04, 0.17, 0.25, C['dark'])
    # (they come over the root from behind the pivot, where the column's hoses end)
    for k in range(2):
        x0 = 0.075 + 0.022 * k
        hose(A, [(x0, -0.13, 0.15), (x0, -0.02, 0.14), (0.108, 0.16, 0.085 - 0.026 * k), (0.112, y - 0.30, 0.07 - 0.026 * k),
                 (0.10, y - 0.17, 0.14 + 0.01 * k), (0.086, y - 0.08 + 0.02 * k, 0.20 + 0.025 * k)], 0.011)
    for k in range(2):
        zz = 0.01 - 0.026 * k; x0 = 0.031 + 0.022 * k
        hose(A, [(x0, -0.13, 0.15), (x0, -0.02, 0.14), (0.106, 0.22, zz + 0.02), (0.112, 0.40, zz), (0.108, 1.80, zz), (0.102, 2.06, zz - 0.03),
                 (0.106, 2.24, -0.02 - 0.024 * k), (0.12, 2.385, -0.035 - 0.022 * k)], 0.011)
    abox(A, 0.06, 0.092, 2.08, 2.14, -0.09, -0.02, C['dark'])                              # a hose bracket on the nose
    for yc in (0.45, 1.30, 1.75):
        clamp(A, (0.105 if yc < 1.0 else 0.10, yc, 0.045 if yc < y else 0.0), 0.03, C['dark'])
    return A.done(40)

def part_b2():
    A = Acc('b2'); r = C['red']
    # the heel: a fork of two plates round b1's tongue, carrying the knuckle pin and the horn
    hy, hz = C2B.y, C2B.z
    fork = [(0.45, 0.035), (0.10, 0.03)] + arc((0, 0), 0.088, -20, -170, 6) + [(hy + 0.02, hz - 0.058)] + arc((hy, hz), 0.06, -100, -260, 7) + [(hy + 0.10, hz + 0.075), (0.0, 0.20), (0.12, 0.232), (0.45, 0.232)]
    plate_pair(A, fork, 0.066, 0.084, r)
    abox(A, -0.066, 0.066, hy + 0.05, hy + 0.20, hz + 0.02, hz + 0.075, r)                 # the horn's web
    apin(A, (0, 0, 0), 0.098, 0.03, C['steel'], cap_r=0.046, sides=(-1, 1))
    apin(A, C2B, 0.094, 0.018, C['steel'], cap_r=0.03)
    # the boom, its collar and the open mouth with the wear pads
    boom(A, [(B2_Y0, B2W, B2H, VB), (B2_Y1 - 0.045, B2W, B2H, VB)], r, True, False)
    boom(A, [(B2_Y1 - 0.045, B2W + 0.014, B2H + 0.014, VB), (B2_Y1, B2W + 0.014, B2H + 0.014, VB)], r, True, False)
    mouth(A, B2_Y1, VB, B2W + 0.014, B2H + 0.014, B2W - 0.016, B2H - 0.016, 0.14, r, C['dark'])
    pads(A, B2_Y1 - 0.004, VB, B2W - 0.016, B2H - 0.016, E1W, E1H, 0.05, C['pad'])
    # hoses: the pair from the knuckle into the boom (to the telescope cylinder), and a pair along it to a coupling block
    for k in range(2):
        hose(A, [(0.12, 0.015, 0.025 - 0.022 * k), (0.115, 0.14, 0.065 - 0.012 * k), (0.10, 0.26, 0.08 + 0.01 * k), (0.094, 0.36, 0.085 + 0.02 * k), (0.07, 0.46, 0.09 + 0.02 * k)], 0.011)
    abox(A, 0.075, 0.09, 0.42, 0.50, 0.06, 0.14, C['dark'])                                # the bulkhead fitting
    for k in range(2):
        zz = 0.17 + 0.026 * k
        hose(A, [(0.09, 0.47, zz - 0.05), (0.093, 0.56, zz), (0.093, 1.95, zz), (0.07, 2.04, zz + 0.02 * (1 - k))], 0.010)
    abox(A, 0.05, 0.095, 2.02, 2.10, 0.17, 0.235, C['dark'])                               # the coupling block
    for yc in (0.9, 1.5):
        clamp(A, (0.087, yc, 0.183), 0.026, C['dark'])
    return A.done(40)

def part_ext1():
    A = Acc('ext1'); r = C['red']
    boom(A, [(0.0, E1W, E1H, 0.0), (E1L - 0.04, E1W, E1H, 0.0)], r, True, False)
    boom(A, [(E1L - 0.04, E1W + 0.012, E1H + 0.012, 0.0), (E1L, E1W + 0.012, E1H + 0.012, 0.0)], r, True, False)
    mouth(A, E1L, 0.0, E1W + 0.012, E1H + 0.012, E1W - 0.014, E1H - 0.014, 0.12, r, C['dark'])
    pads(A, E1L - 0.004, 0.0, E1W - 0.014, E1H - 0.014, E2W, E2H, 0.045, C['pad'])
    return A.done(40)

def part_ext2():
    A = Acc('ext2'); r = C['red']
    boom(A, [(0.0, E2W, E2H, 0.0), (E2L, E2W, E2H, 0.0)], r, True, False)
    boom(A, [(E2L, E2W + 0.01, E2H + 0.01, 0.0), (E2L + 0.035, E2W + 0.01, E2H + 0.01, 0.0)], r, True, True)
    # the tip head: two cheeks carrying the sheave, a cover over it
    sy, sz = SHV.y, SHV.z
    cheek = [(E2L + 0.02, -0.06), (E2L + 0.02, 0.063), (sy - 0.03, 0.085)] + arc((sy, sz), 0.09, 70, -100, 8) + [(sy - 0.06, -0.09)]
    plate_pair(A, cheek, 0.040, 0.053, r)
    abox(A, -0.040, 0.040, E2L + 0.03, sy - 0.02, 0.06, 0.075, r)                          # the cover
    lathe_x(A, SHV, [(0.018, -0.034), (SHV_R, -0.034), (SHV_R, -0.024), (0.060, -0.007), (0.060, 0.007), (SHV_R, 0.024), (SHV_R, 0.034), (0.018, 0.034)], C['steel'], seg=12)
    apin(A, SHV, 0.064, 0.016, C['steel'], cap_r=0.026)
    ac(A, (-0.040, sy + 0.035, 0.088), (0.040, sy + 0.035, 0.088), 0.011, C['steel'], seg=6)   # the wire guard over the sheave
    return A.done(40)

def part_hook():
    A = Acc('hook'); st = C['steel']; y = C['yellow']
    ac(A, (0, 0, 0.0), (0, 0, -0.055), 0.013, st, seg=8, r1=0.017)                          # the wire's pressed socket
    atorus(A, (0, 0, -0.074), (1, 0, 0), 0.022, 0.008, lambda a: st, 8, 4)                  # its eye
    atorus(A, (0, 0, -0.108), (0, 1, 0), 0.024, 0.008, lambda a: st, 8, 4)                  # the swivel's shackle
    ac(A, (0, 0, -0.128), (0, 0, -0.17), 0.036, y, seg=12)                                   # the swivel head
    ac(A, (0, 0, -0.17), (0, 0, -0.183), 0.026, st, seg=6)                                   # its nut
    # the hook: shank, bowl and point, thickest at the bowl's bottom
    c = (0.047, -0.272); R = 0.047
    pts = [(0.0, -0.183), (0.0, -0.205), (0.0, -0.24)]
    pts += [(c[0] + R * math.cos(math.radians(a)), c[1] + R * math.sin(math.radians(a))) for a in range(180, 431, 21)]
    nb = len(pts) - 3
    rad = [0.019, 0.019, 0.020] + [0.020 + 0.003 * math.sin(math.pi * min(1, k / (nb / 2))) - 0.0145 * max(0, (k - nb / 2) / (nb / 2)) for k in range(nb)]
    asweep(A, [(0, py, pz) for py, pz in pts], rad, y, seg=8)
    # the safety latch: a steel strip from the shank to the point, its spring
    p0 = V((0, 0.018, -0.205)); p1 = V((0, pts[-1][0] + 0.004, pts[-1][1] + 0.006))
    d = (p1 - p0); L = d.length; d.normalize(); n = d.cross(V((1, 0, 0))).normalized()
    obox(A, (p0 + p1) / 2, V((0.008, 0, 0)), d * (L / 2), n * 0.002, st)
    atorus(A, p0 + V((0, -0.004, 0.004)), (1, 0, 0), 0.008, 0.003, lambda a: st, 6, 3)
    return A.done(40)

def part_cyl(name, L, R, rod=False, eye_w=0.05, eye_r=0.04, Lr=None):
    """barrel: from its base eye along +y (game -z) to the gland; rod: from its eye along -y (game +z) into the barrel"""
    A = Acc(name)
    if not rod:
        r = C['red']
        ac(A, (-eye_w, 0, 0), (eye_w, 0, 0), eye_r, r, seg=10)                               # the base eye
        ac(A, (0, 0.0, 0), (0, 0.07, 0), R * 0.8, r, seg=12, r1=R + 0.004, cap0=False)      # the base cap
        ac(A, (0, 0.07, 0), (0, 0.09, 0), R + 0.004, r, seg=12, cap1=False)
        ac(A, (0, 0.09, 0), (0, L - 0.06, 0), R, r, seg=12, cap0=False, cap1=False)
        ac(A, (0, L - 0.06, 0), (0, L - 0.012, 0), R + 0.006, r, seg=12)                    # the gland
        ac(A, (0, L - 0.012, 0), (0, L, 0), R * 0.72, C['dark'], seg=12, cap0=False)       # the wiper
        # the ports and the steel pipe from the base end to the rod end, on the +x side
        for yy in (0.11, L - 0.085):
            abox(A, R - 0.012, R + 0.016, yy - 0.022, yy + 0.022, -0.018, 0.018, r)
        px = R + 0.024
        asweep(A, [(R + 0.012, 0.13, 0.0), (px, 0.16, 0.0), (px, L - 0.14, 0.0), (R + 0.012, L - 0.105, 0.0)], 0.008, C['steel'], seg=5)
        hose(A, [(R + 0.016, 0.095, 0.0), (R + 0.055, 0.06, -0.015), (R + 0.05, -0.10, -0.06)], 0.011)   # the hose stubs to the valve
        hose(A, [(R + 0.016, 0.125, 0.008), (R + 0.07, 0.10, 0.025), (R + 0.06, -0.10, 0.0)], 0.011)
    else:
        ac(A, (-eye_w, 0, 0), (eye_w, 0, 0), eye_r, C['steel'], seg=10)                      # the rod eye
        ac(A, (0, -0.02, 0), (0, -0.075, 0), R * 1.25, C['steel'], seg=10, cap0=False)
        ac(A, (0, -0.075, 0), (0, -Lr, 0), R, C['chrome'], seg=12)
    return A.done(40)

def part_rest(S, tilt=0.0):
    """the boom rest: S is the seat's height (the cradle's rubber where b2's underside lies); the cradle is pitched by tilt about x
    (the outer boom's slope in the park pose), so the boom lies along its whole length"""
    A = Acc('rest'); g = C['grey']; rb = C['rubber']
    abox(A, -0.15, 0.15, -0.15, 0.15, 0.0, 0.016, g)
    for x, y in ((0.115, 0.115), (-0.115, 0.115), (0.115, -0.115), (-0.115, -0.115)):
        bolt(A, (x, y, 0.016), 0.014, 0.013, C['steel'])
    top = S - 0.10
    aloft(A, [column_ring(0.016, 0.10, 0.10, 0.0, 0.012), column_ring(top, 0.10, 0.10, 0.0, 0.012)], g, False, False, [V((0, 0, 0.016)), V((0, 0, top))], flat=True)
    for k in range(4):
        a = k * math.pi / 2; ca, sa = math.cos(a), math.sin(a)
        P = lambda r, z, t: V((r * ca - t * sa, r * sa + t * ca, z))
        extrude(A, [(0.05, 0.016), (0.14, 0.016), (0.14, 0.03), (0.05, 0.16)], P, -0.005, 0.005, g)
    abox(A, -0.09, 0.09, -0.09, 0.09, top, top + 0.015, g)                                   # the head plate
    # the V cradle (steel) and its rubber lining, fitting b2's lower section with a little play, on a block over the head plate
    Rt = Matrix.Rotation(tilt, 3, 'X'); Q = V((0, 0, S))
    P = lambda a, b, t: Q + Rt @ V((a, t, b - S))
    yl = 0.10
    steel = [(-0.13, S + 0.125), (-0.112, S + 0.125), (-0.066, S - 0.018), (0.066, S - 0.018), (0.112, S + 0.125), (0.13, S + 0.125), (0.078, S - 0.04), (-0.078, S - 0.04)]
    extrude(A, steel, P, -yl, yl, g)
    lining = [(-0.112, S + 0.125), (-0.066, S - 0.018), (0.066, S - 0.018), (0.112, S + 0.125), (0.097, S + 0.125), (0.054, S - 0.003), (-0.054, S - 0.003), (-0.097, S + 0.125)]
    extrude(A, lining, P, -yl + 0.008, yl - 0.008, rb)
    extrude(A, [(-0.05, S - 0.13), (0.05, S - 0.13), (0.05, S - 0.04), (-0.05, S - 0.04)], P, -0.07, 0.07, g)
    return A.done(40)

# ---------- the chain, as the game composes it ----------
def T(v): return Matrix.Translation(V(v))
def Rx(a): return Matrix.Rotation(a, 4, 'X')
def Rz(a): return Matrix.Rotation(a, 4, 'Z')

def chain(slew, a1, a2, ext=0.0, wire=0.6):
    M = {'base': Matrix.Identity(4)}
    M['col'] = T((0, 0, H_BASE)) @ Rz(slew)
    M['b1'] = M['col'] @ T(P1) @ Rx(a1)
    M['b2'] = M['b1'] @ T(K2) @ Rx(a2)
    M['ext1'] = M['b2'] @ T((0, E1_AT + ext, VB))
    M['ext2'] = M['ext1'] @ T((0, E2_AT + ext, 0))
    tip = M['ext2'] @ TIP
    M['hook'] = T(tip - V((0, 0, wire)))
    for nm, a, b, frame_a, frame_b in (('cyl1', C1A, C1B, 'col', 'b1'), ('cyl2', C2A, C2B, 'b1', 'b2')):
        pa = M[frame_a] @ a; pb = M[frame_b] @ b; d = (pb - pa).normalized()
        X = (M[frame_a].to_3x3() @ V((1, 0, 0))).normalized(); Z = X.cross(d).normalized()
        R = Matrix((X, d, Z)).transposed().to_4x4()
        M[nm + 'b'] = T(pa) @ R; M[nm + 'r'] = T(pb) @ R
    return M, tip

def cyl_d(a1=None, a2=None):
    if a1 is not None:
        pb = T(P1) @ Rx(a1) @ C1B; return (pb - C1A).length
    pb = T(K2) @ Rx(a2) @ C2B; return (pb - C2A).length

def size(o):
    P = [to_game(v.co) for v in o.data.vertices]
    lo = [min(p[k] for p in P) for k in range(3)]; hi = [max(p[k] for p in P) for k in range(3)]
    return lo, hi

def overlaps(objs, M, skip):
    """pairs of parts whose triangles cross in this pose (the pairs in skip are joined by design)"""
    trees = {}
    for nm, o in objs.items():
        me = o.data; W = M[nm]
        trees[nm] = BVHTree.FromPolygons([W @ v.co for v in me.vertices], [tuple(p.vertices) for p in me.polygons], all_triangles=False)
    out = []
    names = list(objs)
    for i, a in enumerate(names):
        for b in names[i + 1:]:
            if (a, b) in skip or (b, a) in skip: continue
            n = len(trees[a].overlap(trees[b]))
            if n: out.append((a, b, n))
    return out

JOINED = {('base', 'col'), ('col', 'b1'), ('col', 'cyl1b'), ('b1', 'cyl1r'), ('cyl1b', 'cyl1r'), ('b1', 'cyl2b'), ('b2', 'cyl2r'), ('cyl2b', 'cyl2r'),
          ('b1', 'b2'), ('b2', 'ext1'), ('ext1', 'ext2'), ('b2', 'ext2')}

def fold_limits(objs, step=10):
    """for a1 from the bottom of its range up, the most the knuckle may close (a2) before the outer boom or the telescopes (in)
    touch the column, the pedestal or the lift cylinder; the game keeps a2 over this (interpolated) so the crane never folds into
    itself"""
    near = {k: objs[k] for k in ('base', 'col', 'cyl1b', 'cyl1r', 'b2', 'ext1', 'ext2')}
    pairs = {(a, b) for a in ('base', 'col', 'cyl1b', 'cyl1r') for b in ('b2', 'ext1', 'ext2')}
    skip = {(a, b) for a in near for b in near if (a, b) not in pairs and (b, a) not in pairs}
    out = []
    for a1d in range(int(round(math.degrees(A1_RANGE[0]))), int(round(math.degrees(A1_RANGE[1]))) + 1, step):
        a1 = math.radians(a1d); lo, hi = A2_RANGE
        clear = lambda a2: not overlaps(near, chain(0.0, a1, a2, 0.0)[0], skip)
        if clear(lo): out.append([round(a1, 4), round(lo, 4)]); continue
        for _ in range(12):
            mid = (lo + hi) / 2
            if clear(mid): hi = mid
            else: lo = mid
        out.append([round(a1, 4), round(hi + math.radians(2), 4)])          # two degrees of margin
    return out

def main():
    os.makedirs(OUT, exist_ok=True)
    reset(); colours()
    # the cylinders against their strokes over the working ranges
    d1 = [cyl_d(a1=A1_RANGE[0] + (A1_RANGE[1] - A1_RANGE[0]) * k / 60) for k in range(61)]
    d2 = [cyl_d(a2=A2_RANGE[0] + (A2_RANGE[1] - A2_RANGE[0]) * k / 60) for k in range(61)]
    for nm, d, Lb, Lr in (('lift', d1, L1B, L1R), ('knuckle', d2, L2B, L2R)):
        lo, hi = min(d), max(d)
        print('%-7s cylinder: pin to pin %.3f..%.3f m; barrel %.2f (needs <= %.3f), rod %.2f (needs <= %.3f), overlap at full stroke %.3f m'
              % (nm, lo, hi, Lb, lo - 0.07, Lr, lo - 0.10, Lb + Lr - hi))
    # the park pose: a1 chosen, a2 so b2's underside lies on a rest of 1.20 m near b2's end
    a1p = 0.10; s_rest = 1.95
    def rest_pt(a2):
        M, _ = chain(0.0, a1p, a2); return M['b2'] @ V((0, s_rest, VB - B2H / 2))
    lo_, hi_ = -0.9, A2_RANGE[1]
    for _ in range(50):
        mid = (lo_ + hi_) / 2
        if rest_pt(mid).z > 1.20: hi_ = mid
        else: lo_ = mid
    a2p = round((lo_ + hi_) / 2, 4); rp = rest_pt(a2p); REST_H = round(rp.z, 4)
    POSES = {'stow': {'a1': round(math.radians(78), 4), 'a2': round(math.radians(-165), 4), 'ext': 0.0, 'wire': 0.12},
             'park': {'a1': a1p, 'a2': a2p, 'ext': 0.0, 'wire': 0.12},
             'work': {'a1': 0.55, 'a2': -0.78, 'ext': 0.40, 'wire': 1.3}}
    for nm, p in POSES.items():
        assert A1_RANGE[0] - 1e-6 <= p['a1'] <= A1_RANGE[1] + 1e-6 and A2_RANGE[0] - 1e-6 <= p['a2'] <= A2_RANGE[1] + 1e-6, nm

    objs = {'base': part_base(), 'col': part_col(), 'b1': part_b1(), 'b2': part_b2(), 'ext1': part_ext1(), 'ext2': part_ext2(), 'hook': part_hook(),
            'cyl1b': part_cyl('cyl1b', L1B, R1B, eye_w=0.058, eye_r=0.042), 'cyl1r': part_cyl('cyl1r', 0, R1R, True, eye_w=0.04, eye_r=0.036, Lr=L1R),
            'cyl2b': part_cyl('cyl2b', L2B, R2B, eye_w=0.046, eye_r=0.034), 'cyl2r': part_cyl('cyl2r', 0, R2R, True, eye_w=0.036, eye_r=0.03, Lr=L2R),
            'rest': part_rest(REST_H, a1p + a2p)}
    # a little occlusion baked into the colours, each part alone (they move against each other)
    setup_render(64, 64, samples=8)
    for nm, o in objs.items():
        for p in bpy.context.scene.objects:
            if p.type == 'MESH': p.hide_render = p is not o
        bake_ao(o, samples=16, distance=0.10)
    for p in bpy.context.scene.objects:
        if p.type == 'MESH': p.hide_render = False
    parts = [(nm, mesh_arrays(o, to_game, to_game_n, ao=True), 1.0) for nm, o in objs.items()]

    # reach with the outer boom level and both telescopes out
    a1r = 0.32; Mr, tipr = chain(0.0, a1r, -a1r, EXT_MAX)
    reach = round(tipr.y, 3)
    Mw, tipw = chain(0.0, POSES['work']['a1'], POSES['work']['a2'], POSES['work']['ext'])
    sz = {nm: size(o) for nm, o in objs.items()}
    r4 = lambda v: round(v, 4)
    ex = {'frame': 'kystfiske deck crane: metres, x to starboard, y up, z aft; each part from its own pivot; booms and cylinder barrels lie along -z, rods along +z; '
                   'base -> col (slew about y) -> b1 (a1 about x at b1_at) -> b2 (a2 about x at b2_at) -> ext1 at ext_at + ext_dir*e -> ext2 at ext2_at + ext_dir*e; '
                   'angles in radians, positive raises the tip; the hook hangs on a wire straight down from tip',
          'col_at': G((0, 0, H_BASE)),
          'b1_at': G(P1), 'c1_a': G(C1A),
          'b2_at': G(K2), 'c1_b': G(C1B), 'c2_a': G(C2A),
          'c2_b': G(C2B), 'ext_at': G((0, E1_AT, VB)), 'ext_dir': [0, 0, -1],
          'ext2_at': G((0, E2_AT, 0)), 'ext_max': EXT_MAX,
          'tip': G(TIP), 'sheave': G(SHV), 'sheave_r': SHV_R,
          'cyl1_len': L1B, 'cyl1_rod': L1R, 'cyl2_len': L2B, 'cyl2_rod': L2R,
          'a1_range': [r4(A1_RANGE[0]), r4(A1_RANGE[1])], 'a2_range': [r4(A2_RANGE[0]), r4(A2_RANGE[1])],
          'a2_min': fold_limits(objs),
          'stow': POSES['stow'], 'park': POSES['park'], 'work': POSES['work'],
          'rest_at': [0.0, 0.0, r4(-rp.y)], 'rest_h': REST_H, 'rest_tilt': r4(a1p + a2p),
          'hook_h': HOOK_H, 'wire_min': 0.10,
          'reach_max': reach, 'reach_work': round(tipw.y, 3), 'swl': 0.3, 'lift_moment_tm': 2.6,
          'size': {nm: [r4(hi[k] - lo[k]) for k in range(3)] for nm, (lo, hi) in sz.items()}}
    glb = os.path.join(OUT, 'deck-crane.glb'); n = write_glb(glb, parts, ex)
    open(os.path.join(ROOT, 'src', 'data', 'deck-crane.b64'), 'w').write(base64.b64encode(open(glb, 'rb').read()).decode())
    tot = sum(len(A['idx']) // 3 for _, A, _ in parts)
    print('deck crane GLB %.1f KB, %d triangles' % (n / 1024, tot))
    for nm, A, _ in parts:
        lo, hi = sz[nm]
        print('  %-6s %5d tris  x %.3f..%.3f  y %.3f..%.3f  z %.3f..%.3f' % (nm, len(A['idx']) // 3, lo[0], hi[0], lo[1], hi[1], lo[2], hi[2]))
    print('  a2_min     %s' % ', '.join('%.0f:%.0f' % (math.degrees(x), math.degrees(y)) for x, y in ex['a2_min']))
    for k in ('col_at', 'b1_at', 'c1_a', 'b2_at', 'c1_b', 'c2_a', 'c2_b', 'ext_at', 'ext2_at', 'tip', 'rest_at', 'rest_h', 'reach_max', 'reach_work', 'stow', 'park', 'work'):
        print('  %-10s %s' % (k, ex[k]))
    crane = {k: v for k, v in objs.items() if k != 'rest'}
    for nm, p in POSES.items():
        M, tip = chain(0.0, p['a1'], p['a2'], p['ext'], p['wire'])
        if nm == 'park': M['rest'] = T((0, rp.y, 0))
        print('  %s: overlaps %s; tip at %.2f m out, %.2f m up; cylinders %.3f, %.3f m' % (nm, overlaps({**crane, **({'rest': objs['rest']} if nm == 'park' else {})}, M, JOINED),
              tip.y, tip.z, cyl_d(a1=p['a1']), cyl_d(a2=p['a2'])))
    if 'fast' in sys.argv: return
    renders(objs, POSES, rp)

def place(objs, M, show):
    for nm, o in objs.items():
        if nm in M: o.matrix_world = M[nm]
        o.hide_render = nm not in show

def wire_obj(a, b):
    A = Acc('wire'); ac(A, a, b, 0.004, C['steel'], seg=6); return A.done(40)

def renders(objs, POSES, rp):
    sc = setup_render(1000, 700, samples=16)
    try: sc.cycles.use_denoising = True
    except Exception: pass
    bm = bmesh.new(); s_ = 12
    bm.faces.new([bm.verts.new(p) for p in ((-s_, -s_, -0.002), (s_, -s_, -0.002), (s_, s_, -0.002), (-s_, s_, -0.002))])
    deck = obj_from_bm('deck', bm, [mat('deck', (0.36, 0.40, 0.41), 0.3)])
    crane = [k for k in objs if k != 'rest']
    only = [x for x in sys.argv[1:] if x != 'fast']
    def want(k): return not only or k in only
    def shot(nm, pose, slew, show, cams, rest=None, wire=None):
        p = POSES[pose]; M, tip = chain(slew, p['a1'], p['a2'], p['ext'], wire or p['wire'])
        if rest is not None: M['rest'] = T(rest)
        place(objs, M, show)
        w = wire_obj(tip, M['hook'] @ V((0, 0, 0)))
        for cn, loc, look, lens in cams:
            camera(loc, look, lens=lens); render(os.path.join(OUT, 'kran_%s.png' % (nm + cn)))
        bpy.data.objects.remove(w, do_unlink=True)
    if want('stow'):
        shot('stow', 'stow', 0.0, crane, [('', (5.6, 5.4, 2.7), (0.0, 0.4, 2.0), 30), ('_side', (8.0, 0.5, 2.2), (0.0, 0.5, 2.05), 30)])
    if want('park'):
        shot('park', 'park', 0.0, crane + ['rest'], [('', (5.2, 0.4, 3.0), (0.0, 2.6, 1.3), 32), ('_rest', (1.2, 5.6, 1.8), (0.0, 4.2, 1.2), 35)], rest=(0, rp.y, 0))
    if want('work'):
        shot('work', 'work', -0.45, crane, [('', (6.6, -1.6, 3.2), (1.3, 2.5, 1.7), 32)])
    if want('column'):
        shot('column', 'work', 0.0, crane, [('', (1.55, 1.25, 1.55), (0.12, 0.05, 0.95), 38), ('_back', (1.2, -1.5, 1.3), (0.05, -0.05, 0.85), 38)])
    if want('knuckle'):
        p = POSES['work']; M, tip = chain(0.0, p['a1'], p['a2'], p['ext'], p['wire']); kn = M['b2'].to_translation()
        shot('knuckle', 'work', 0.0, crane, [('', (kn.x + 1.5, kn.y - 0.9, kn.z + 0.7), (kn.x, kn.y - 0.2, kn.z), 40)])
    if want('hook'):
        p = POSES['work']; M, tip = chain(0.0, p['a1'], p['a2'], p['ext'], 0.5)
        shot('hook', 'work', 0.0, crane, [('', (tip.x + 0.75, tip.y - 0.55, tip.z - 0.45), (tip.x, tip.y, tip.z - 0.62), 50)], wire=0.45)

if __name__ == '__main__':
    main()
