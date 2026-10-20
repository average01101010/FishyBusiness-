"""The deck crane: a marine knuckle-boom crane of the kind a 15-21 m Norwegian coastal boat carries on its deck, built in Blender
as parts that the game moves itself (the caller's spec 19.10.2026; the folds from Jonas' photos 20.10.2026). Modelled on the
marine knuckle-boom cranes of the 5-8 t*m class (HMF, Palfinger, Fassi); no maker's name, logo or text is on the model.

Real measures it leans on (read 19-20.10.2026; truck versions of the same booms, the marine versions add corrosion protection and a
pedestal):
    Palfinger PK 6501 57.9 kNm (5.9 t*m), max. lifting capacity 1.12 t, max. reach 5.4 m, 754-962 kg (lectura-specs.com)
    Fassi F65B.0      6.30 t*m, hydraulic outreach up to 10.65 m with more extensions (fassi.com)
    Fassi F32A        2.75 t*m, 6.90 m, Palfinger PK 2900 2.5 t*m, 6.4 m (the smaller class this crane was first drawn from)
and the folds from Jonas' photos (20.10.2026): loader cranes packed for the road (the main boom standing steeply up from a short
column, the outer boom folded fully down along it), and three knuckle-boom cranes packed for sea, which is the stow pose here: the
knuckle at the top, the main boom standing steeply up from a short column (its pivot at about 0.4 of the package's height), and the
outer boom, much longer than the main boom, with its telescopes in, sloping down diagonally past the column, so the crane lies in
itself as a compact triangle about as wide as it is high, with the lift cylinder inside it and the telescopes' end low down in
front. The booms are chunky boxes (about a sixth to an eighth of their length deep). The order of folding is the makers' (the
Palfinger PK 23002 operator manual Jonas sent, pp. 38 and 71-72: raise the main boom steeply, fold the outer arm in, retract the
telescopes, slew, and fold the arm down to its support on the base), which the a2_min table below keeps: the knuckle closes only
with the main boom up, and the telescopes come in before it does. The main boom is 1.17 m pivot to pivot, the outer boom 2.05 m to
its mouth (1.8 times the main boom, as in the photos) and the two telescopes slide 1.55 m each, which gives 6.5 m of hydraulic
reach with both booms level; the safe working load at full reach is put at 0.75 t (about 6 t*m spread over 6.5 m less the booms'
own weight, as the load charts of the class fall off).

Parts, each with its own origin at its pivot (the game composes base -> col (slew about y) -> b1 (a1 about x) -> b2 (a2 about x)
-> ext1 -> ext2 (sliding along b2's axis), the knuckle links on b1 and b2, the cylinders between their eyes, and hangs the hook on a
wire under the tip):
    base    the pedestal bolted to the deck: a 0.66 m square foot flange with eight bolts, a 0.42 m tube with four gussets, the top
            flange and the slewing ring's fixed race in its gear housing with a ring of bolts; 0.35 m high. From the deck.
    col     the slewing column: the slewing housing (a rounded box 0.60 x 0.62 m that turns on the ring) with the slewing motor at
            its back, the lift cylinder's bracket hanging down in front of the pedestal (its base eye low, as on the real cranes, so
            the cylinder is long enough for the boom's 100 degrees), a short tapered column (0.36 m square) up to the main boom's
            pivot bracket 0.60 m over the ring, the control valve bank (four sections) on a bracket on the +x side with two cross
            levers (each works two functions) with red knobs, and the hoses up to the boom. From the slew axis on the ring.
    b1      the main boom: a polygonal box section 0.24 x 0.28 m at the root, narrowing to a 0.16 m tongue at its end where the
            knuckle pin sits under it; the lift cylinder's lugs under it, the knuckle cylinder's bracket on top near the root, the
            pin of link1 through its end, hoses with clamps along its +x side. From its pivot, lying along -z.
    b2      the outer boom: 0.20 x 0.26 m, open at the far end where the telescopes come out (wear pads in the mouth), its heel a
            cranked fork of two plates round the main boom's tongue (its axis 0.26 m over the knuckle pin), carrying the knuckle pin
            and the pins of link2; hoses along its +x side. From the knuckle pin, lying along -z.
    link1   the rocker of the knuckle link: two plates from its pin on b1 to the joint J where link2 and the knuckle cylinder's
            rod meet, 0.478 m. From its pin on b1, lying along -z to J.
    link2   the push link: two plates from J to its pin on b2's heel, 0.634 m. From its pin on b2, lying along -z to J.
    ext1    the first telescope, 1.95 m, 0.17 x 0.22 m, with its collar and the wear pads for ext2. From its rear end.
    ext2    the second telescope, 1.90 m, 0.14 x 0.185 m, with the tip head: a sheave of 0.16 m in a fork. From its rear end.
    hook    the hook block: the wire's socket, a swivel with its nut, and a painted crane hook with a steel safety latch;
            0.35 m tall. From the top, where the wire is made fast.
    cyl1b   the lift cylinder's barrel (Ø0.14 m, 0.645 m), from its base eye, lying along -z; a steel pipe along it to the rod end
    cyl1r   its chrome rod (Ø0.08 m, 0.62 m), from the rod eye, lying along +z back into the barrel
    cyl2b   the knuckle cylinder's barrel (Ø0.116 m, 0.60 m), on top of b1, as cyl1b
    cyl2r   its rod (Ø0.064 m, 0.55 m), as cyl1r; its eye is on the joint J at the end of link1
    rest    the boom rest, for boats that have room for one: a square post with a foot flange and a rubber-lined V cradle that fits
            the outer boom's underside. From the deck; the cradle's seat is at rest_h.

The knuckle link (why there are links): the outer boom must close to about -170 degrees against the main boom to lie tight along it
in the road fold and open to level for the reach, 180 degrees in all, which a cylinder pushing straight on a lever cannot do (its
lever passes the dead points and the rod runs into the boom). The real cranes put a four-bar link between the cylinder and the outer
boom, and so does this one: link1 turns about q1 on b1, link2 about q2 on b2, they meet at J, and the knuckle cylinder pushes on J.
(The link was worked out at 1/1.3 of this size and scaled up round the knuckle pin with the booms' sections, so its angles are those
of the first design.) For each a2 the game finds J (b1 frame, in the plane x = 0) as the meeting point of the circle round q1 with
radius la and the circle round K + Rx(a2) q2 with radius lb (K = b2_at), on the side given by jside (the one with J above the line
from q1 to q2: J = m + jside * h * perp, perp the line q1->q2 turned +90 degrees about x), or reads the angles from the table klink
[a2, l1, l2], 5 degrees apart: link1 is placed at q1 on b1 turned l1 about x from its rest (along -z), link2 at q2 on b2 turned l2
about x. The knuckle cylinder runs from c2_a (on b1) to c2_b, which is J at the end of link1 (in link1's frame). With this geometry
the cylinder pulls to raise the outer boom (it is longest folded); a link where it pushes, as on most real cranes, did not fit with
the pin under the main boom and the folded outer boom tight along it.

What I chose myself: the column's height (0.60 m to the pivot, about 0.4 of the folded package's height), the mount points of both
cylinders and the link geometry (worked out in 2D so the cylinders fit their strokes over the whole ranges, the barrel never runs past
the rod's eye nor the rod past the barrel's base, the links keep a transmission angle over 30 degrees and the rod and the links clear
the booms), the lift cylinder's length (0.645 + 0.62 m, as the short column wants), the polygonal section of the booms, the
colours, the hoses' runs and the valve bank's look.

Limits for the game (extras): a1_range and a2_range are where the cylinders fit their strokes and clear the steel; a2_min is a
table [a1, a2] of how far the knuckle may close at each main boom angle before the folded outer boom touches the column, the pedestal
or the lift cylinder (fold the crane with the main boom raised, as on a real one). Checked in Blender: no part crosses another in the
stow, park and work poses (the pins through their eyes and the telescopes in their sleeves excepted).

The stow pose is the sea fold of the photos, for every boat: the main boom 99 degrees up (leaning 9 degrees back past upright, as in
all three photos, so the knuckle sits behind the column), the outer boom 49 degrees below level (a2 = -148 degrees), the telescopes
in and the hook block on a short wire under the mouth. Its envelope (the extras' stow_box: slew 0, the hook included, in the base
frame on the game's axes) is x -0.33..0.385, y 0..2.296, z -1.733..0.645: 2.30 m high and 2.38 m long (1.04 times its height), the
main boom's pivot at 0.41 of the height, the mouth 1.63 m forward of the slew axis and 0.56 m over the deck (the hook down to
0.17 m), the knuckle and its links up to 0.65 m aft.
The knuckle can still close to -170 for the road fold of the first photo (a2_min allows it with the main boom up). The park pose is
for boats with a boom rest: the main boom raised a little and the outer boom level, lying in the rest's cradle 0.35 m inside its
mouth.

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
P1 = V((0.0, -0.05, 0.60))                   # the main boom's pivot (col frame)
C1A = V((0.0, 0.58, -0.22))                  # the lift cylinder's base pin, low in front of the pedestal (col frame)
KS = 1.3                                     # the knuckle's link design, made at 1/1.3 of this size and scaled up round the pin
K2 = V((0.0, 1.16, -0.12 * KS))              # the knuckle pin under the main boom's end (b1 frame): 1.17 m pivot to pivot
C1B = V((0.0, 0.26, -0.18))                  # the lift cylinder's rod pin (b1 frame)
C2A = V((0.0, 0.18, 0.35))                   # the knuckle cylinder's base pin on its bracket near the root (b1 frame)
Q1 = K2 + V((0.0, -0.286, 0.185)) * KS       # link1's pin through the main boom's end (b1 frame)
Q2 = V((0.0, -0.033, 0.112)) * KS            # link2's pin on the outer boom's heel (b2 frame)
LA, LB, JSIDE = 0.368 * KS, 0.488 * KS, 1    # the links' lengths, and which of the two meeting points is J
VB = 0.20 * KS                               # b2's axis over its pin
B2W, B2H, B2_Y0, B2_Y1 = 0.20, 0.26, 0.12 * KS, 2.05   # b2's section, its heel and its mouth
E1W, E1H, E1L, E1_AT = 0.17, 0.22, 1.95, 0.15          # ext1: section, length, where its rear sits in b2 when in
E2W, E2H, E2L, E2_AT = 0.14, 0.185, 1.90, 0.05         # ext2: the same in ext1
EXT_MAX = 1.55                               # how far each telescope slides out (0.35 m of each stays inside)
SHV = V((0.0, E2L + 0.125, 0.0)); SHV_R = 0.08         # the tip sheave (ext2 frame) and its radius
TIP = SHV + V((0.0, 0.071, 0.0))             # where the wire leaves the sheave's groove, hanging down
L1B, R1B, L1R, R1R = 0.645, 0.07, 0.62, 0.040          # the lift cylinder: barrel and rod
L2B, R2B, L2R, R2R = 0.60, 0.058, 0.55, 0.032          # the knuckle cylinder
HOOK_H = 0.35
A1_RANGE = (math.radians(0), math.radians(100))        # where the lift cylinder fits its stroke and clears the steel
A2_RANGE = (math.radians(-176), math.radians(4))       # where the knuckle link works (and the cylinder fits)
X_TONGUE, X_FORK, X_L1, X_L2 = 0.08, (0.082, 0.102), (0.082, 0.098), (0.106, 0.122)   # the knuckle's layers across (|x|)
X_ROOT, X_CHEEK = 0.12, (0.124, 0.148)       # the main boom's root and the column's cheeks round it

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

def smooth(ctrl, step=32):
    """a Catmull-Rom curve through the points, with a point more for every step degrees it bends"""
    P = [V(p) for p in ctrl]; out = []
    def turn(i):
        if i <= 0 or i >= len(P) - 1: return 0.0
        a = (P[i] - P[i - 1]); b = (P[i + 1] - P[i])
        return a.angle(b) if a.length > 1e-6 and b.length > 1e-6 else 0.0
    for i in range(len(P) - 1):
        n = 1 + int(max(turn(i), turn(i + 1)) / math.radians(step))
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

def hose(A, ctrl, r=0.011, m=None, seg=5, step=32):
    asweep(A, smooth(ctrl, step), r, m or C['black'], seg)

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
    s, ch = 0.33, 0.07
    prism_z(A, [(-s + ch, -s), (s - ch, -s), (s, -s + ch), (s, s - ch), (s - ch, s), (-s + ch, s), (-s, s - ch), (-s, -s + ch)], 0.0, 0.03, g)
    for x, y in ((0.26, 0.26), (-0.26, 0.26), (0.26, -0.26), (-0.26, -0.26), (0.285, 0), (-0.285, 0), (0, 0.285), (0, -0.285)):
        bolt(A, (x, y, 0.03), 0.024, 0.02, C['steel'])                                   # a flanged nut
    ac(A, (0, 0, 0.03), (0, 0, 0.27), 0.21, g, seg=20, cap0=False, cap1=False)
    for k in range(4):
        a = math.pi / 4 + k * math.pi / 2; ca, sa = math.cos(a), math.sin(a)
        P = lambda r, z, t: V((r * ca - t * sa, r * sa + t * ca, z))
        extrude(A, [(0.205, 0.03), (0.32, 0.03), (0.32, 0.065), (0.205, 0.22)], P, -0.008, 0.008, g)
    ac(A, (0, 0, 0.27), (0, 0, 0.295), 0.30, g, seg=24, cap1=False)
    ac(A, (0, 0, 0.295), (0, 0, 0.334), 0.315, g, seg=24, cap1=False)                    # the gear housing
    ac(A, (0, 0, 0.334), (0, 0, 0.35), 0.285, C['race'], seg=24, cap0=False)             # the fixed race
    for k in range(10):
        a = 2 * math.pi * (k + 0.5) / 10
        bolt(A, (0.30 * math.cos(a), 0.30 * math.sin(a), 0.334), 0.011, 0.01, C['steel'])
    ac(A, (0.315, -0.07, 0.315), (0.34, -0.07, 0.315), 0.009, C['steel'], seg=6)       # grease nipple
    return A.done(40)

def column_ring(z, w, d, yc, c):
    return [V((x, yc + y, z)) for x, y in ((-w / 2 + c, -d / 2), (w / 2 - c, -d / 2), (w / 2, -d / 2 + c), (w / 2, d / 2 - c), (w / 2 - c, d / 2), (-w / 2 + c, d / 2), (-w / 2, d / 2 - c), (-w / 2, -d / 2 + c))]

def part_col():
    A = Acc('col'); r = C['red']; dk = C['dark']
    # the slewing housing: a rounded box that turns on the ring
    prism_z(A, rrect(0.0, -0.05, 0.60, 0.62, 0.08, 3), 0.0, 0.17, r)
    ac(A, (0, 0, -0.012), (0, 0, 0.0), 0.26, C['race'], seg=24, cap0=False, cap1=False)  # the turning race under it
    # the column: short, tapered, polygonal, from the housing to the pivot bracket
    zs = [(0.17, 0.36, 0.36, -0.02, 0.09), (0.44, 0.32, 0.34, -0.04, 0.08)]
    aloft(A, [column_ring(z, w, d, yc, c) for z, w, d, yc, c in zs], r, False, True, [V((0, yc, z)) for z, w, d, yc, c in zs], flat=True)
    abox(A, -0.19, 0.19, -0.21, 0.15, 0.17, 0.195, r)                                      # the column's foot plate
    # the pivot bracket: two cheeks round the pin, the pin and its caps
    py, pz = P1.y, P1.z
    cheek = [(0.14, 0.36), (0.12, 0.48)] + arc((py, pz), 0.12, -35, 215, 10) + [(-0.17, 0.50), (-0.18, 0.36)]
    plate_pair(A, cheek, X_CHEEK[0], X_CHEEK[1], r)
    apin(A, P1, X_CHEEK[1] + 0.02, 0.042, C['steel'], cap_r=0.06, sides=(-1, 1))
    bolt(A, (X_CHEEK[1] + 0.02, py + 0.07, pz), 0.014, 0.014, C['steel'], up=(1, 0, 0))   # the pin's lock bolt
    abox(A, X_CHEEK[1], X_CHEEK[1] + 0.008, py + 0.04, py + 0.10, pz - 0.018, pz + 0.018, C['steel'])
    abox(A, -X_CHEEK[0], X_CHEEK[0], -0.18, -0.145, 0.36, 0.40, r)                        # the bracket's back plate
    # the lift cylinder's bracket: two plates from the housing's front down in front of the pedestal to the cylinder's base eye
    cy, cz = C1A.y, C1A.z
    lug = [(0.20, 0.17), (0.20, 0.005), (0.33, 0.005), (0.33, -0.07), (cy - 0.07, cz - 0.05)] + arc((cy, cz), 0.08, -125, 60, 7) + [(0.42, 0.08), (0.33, 0.17)]
    plate_pair(A, lug, 0.075, 0.095, r)
    extrude(A, [(0.325, 0.0), (0.345, 0.0), (0.36, -0.06), (0.34, -0.07)], lambda a, b, t: V((t, a, b)), -0.075, 0.075, r)   # the web between them
    apin(A, C1A, 0.11, 0.03, C['steel'], cap_r=0.045)
    # the slewing motor at the back: a hydraulic motor standing on the housing, its pinion in the gear housing under it
    ac(A, (0, -0.30, 0.17), (0, -0.30, 0.19), 0.085, dk, seg=12, cap0=False)
    ac(A, (0, -0.30, 0.19), (0, -0.30, 0.34), 0.065, dk, seg=12, cap0=False, cap1=False)
    ac(A, (0, -0.30, 0.34), (0, -0.30, 0.36), 0.07, dk, seg=12, cap0=True)
    # the control valve bank on a bracket on the +x side: four sections between two end covers, tie rods, spools and two levers
    x0, x1, z0, z1 = 0.22, 0.32, 0.42, 0.565
    abox(A, 0.165, 0.180, -0.15, 0.15, 0.30, 0.52, dk)                                     # the bracket plate
    abox(A, 0.170, 0.220, -0.15, 0.15, 0.39, 0.41, dk)                                     # its arms
    abox(A, x0 - 0.005, x1 + 0.005, -0.135, -0.100, z0 - 0.01, z1 + 0.01, dk)              # the inlet cover
    abox(A, x0 - 0.005, x1 + 0.005, 0.088, 0.118, z0 - 0.01, z1 + 0.005, dk)               # the end cover
    ports = []
    for k in range(4):
        y0 = -0.098 + 0.0465 * k
        abox(A, x0, x1, y0, y0 + 0.044, z0, z1, mat('valve', (0.13, 0.135, 0.14), 0.5))
        ac(A, (0.27, y0 + 0.022, z1), (0.27, y0 + 0.022, z1 + 0.02), 0.011, C['steel'], seg=6, cap0=False)     # the spool's top
        q = V((x1, y0 + (0.012 if k % 2 == 0 else 0.032), z0 + 0.04 if k % 2 == 0 else z0 + 0.10)); ports.append(q + V((0.014, 0, 0)))
        ac(A, q, q + V((0.014, 0, 0)), 0.009, C['steel'], seg=6, cap0=False)                      # the work port
    for z in (z0 + 0.015, z1 - 0.015):
        ac(A, (0.31, -0.14, z), (0.31, 0.123, z), 0.006, C['steel'], seg=5)                 # tie rods
    # the levers: each on a gimbal block over two spools, so one lever works two functions
    for k, y in enumerate((-0.052, 0.041)):
        abox(A, 0.245, 0.295, y - 0.024, y + 0.024, z1 + 0.02, z1 + 0.05, dk)
        ac(A, (0.27, y, z1 + 0.05), (0.27, y, z1 + 0.07), 0.016, C['rubber'], seg=8, r1=0.010, cap0=False)    # the boot
        tip = V((0.35, y + (0.012 if k else -0.012), z1 + 0.27))
        ac(A, (0.27, y, z1 + 0.06), tip, 0.008, C['steel'], seg=6)
        sphere_a(A, tip + (tip - V((0.27, y, z1 + 0.06))).normalized() * 0.02, 0.026, C['knob'], seg=8, rings=5)
    # hoses: four work lines from the valve's ports back and up behind the pivot to the boom's root, a supply line into the housing
    for k, q in enumerate(ports):
        hose(A, [q, q + V((0.04, -0.02, 0.03)), (0.20 - 0.006 * k, -0.24 - 0.008 * k, 0.48), (0.118 - 0.022 * (k % 2), -0.29, 0.58 + 0.025 * (k // 2)),
                 (0.118 - 0.022 * (k % 2), -0.27, 0.65 + 0.025 * (k // 2))], 0.011, step=45)
    hose(A, [(x0 - 0.005, -0.12, z0 + 0.05), (0.21, -0.17, 0.27), (0.20, -0.21, 0.17)], 0.015)          # the supply line into the housing
    for k, a in enumerate((-50, -15)):
        q = V((0.065 * math.cos(math.radians(a)), -0.30 + 0.065 * math.sin(math.radians(a)), 0.30 - 0.06 * k))
        ac(A, q, q + V((0.02, -0.005, 0)), 0.012, C['steel'], seg=6, cap0=False)
        hose(A, [q + V((0.02, -0.005, 0)), q + V((0.09, 0.02, -0.01)), (0.218, -0.13 + 0.025 * k, z0 + 0.02)], 0.010)
    return A.done(40)

def part_b1():
    A = Acc('b1'); r = C['red']
    ac(A, (-X_ROOT, 0, 0), (X_ROOT, 0, 0), 0.09, r, seg=12)                                # the root boss round the pivot pin
    ky, kz = K2.y, K2.z
    # the box narrows to the tongue before link1's pin, so the link's plates lie outside it
    st = [(0.0, 2 * X_ROOT, 0.20, 0.0), (0.12, 2 * X_ROOT, 0.28, 0.0), (Q1.y - 0.19, 0.22, 0.27, -0.005), (Q1.y - 0.09, 2 * X_TONGUE, 0.26, -0.005),
          (ky - 0.20, 2 * X_TONGUE, 0.30, -0.06), (ky, 2 * X_TONGUE, 0.25, -0.085)]
    boom(A, st, r)
    ac(A, (-X_TONGUE, ky, kz), (X_TONGUE, ky, kz), 0.085, r, seg=12)                       # the knuckle's tongue boss
    ac(A, (-X_TONGUE - 0.002, Q1.y, Q1.z), (X_TONGUE + 0.002, Q1.y, Q1.z), 0.055, r, seg=10)   # link1's boss
    apin(A, Q1, X_L1[1] + 0.01, 0.024, C['steel'], cap_r=0.036, cap_t=0.01, sides=(-1, 1))
    # the lift cylinder's lugs under the boom
    y, z = C1B.y, C1B.z
    plate_pair(A, [(y - 0.16, -0.12), (y + 0.16, -0.12), (y + 0.09, z - 0.025)] + arc((y, z), 0.058, -20, -160, 6) + [(y - 0.09, z - 0.025)], 0.055, 0.072, r)
    apin(A, C1B, 0.085, 0.026, C['steel'], cap_r=0.038)
    # the knuckle cylinder's bracket on top, near the root
    y, z = C2A.y, C2A.z
    plate_pair(A, [(y - 0.16, 0.11), (y + 0.26, 0.11), (y + 0.06, z - 0.055)] + arc((y, z), 0.06, -40, 200, 8) + [(y - 0.10, z - 0.05)], 0.062, 0.078, r)
    abox(A, -0.062, 0.062, y - 0.12, y + 0.16, 0.11, 0.165, r)                              # the web between them
    apin(A, C2A, 0.09, 0.024, C['steel'], cap_r=0.036)
    # hoses along the +x side: two to the knuckle cylinder (a fitting block on its bracket), two on to the knuckle
    # (they come over the root from behind the pivot, where the column's hoses end, and meet b2's at the knuckle pin's axis)
    abox(A, 0.078, 0.094, y - 0.08, y - 0.02, 0.17, 0.24, C['dark'])
    for k in range(2):
        xh = 0.098 + 0.022 * k
        hose(A, [(xh, -0.10, 0.19), (xh, 0.0, 0.20), (0.105 + 0.022 * k, y - 0.06, 0.21 - 0.02 * k), (0.094, y - 0.05, 0.205 - 0.02 * k)], 0.011)
    for k in range(2):
        xh = 0.098 + 0.022 * k; zz = 0.0 - 0.026 * k
        hose(A, [(xh, -0.10, 0.165), (xh, 0.0, 0.16), (0.122, 0.30, zz + 0.05), (0.124, Q1.y - 0.19, zz), (0.128, Q1.y, zz - 0.01), (0.14, ky - 0.25, zz - 0.02),
                 (0.148, ky - 0.15, kz + 0.11 - 0.026 * k), (0.158, ky - 0.02, kz + 0.033 - 0.026 * k)], 0.011)
    for yc in (0.32, 0.52):
        clamp(A, (0.115, yc, 0.0), 0.03, C['dark'])
    return A.done(40)

def part_b2():
    A = Acc('b2'); r = C['red']
    # the heel: a cranked fork of two plates round b1's tongue, carrying the knuckle pin and link2's pin
    qy, qz = Q2.y, Q2.z; lo, hi = VB - B2H / 2, VB + B2H / 2
    fork = [(0.55, lo + 0.002), (0.18, lo)] + arc((0, 0), 0.11, 30, -195, 9) + arc((qy, qz), 0.048, 205, 60, 5) + [(0.15, hi), (0.55, hi)]
    plate_pair(A, fork, X_FORK[0], X_FORK[1], r)
    abox(A, -X_FORK[0], X_FORK[0], 0.15, 0.26, lo, hi, r)                                   # the heel's end plate
    apin(A, (0, 0, 0), X_FORK[1] + 0.001, 0.039, C['steel'])                                # the knuckle pin (flush: link2 passes over it)
    for sx in (-1, 1):                                                                      # link2's pins: stubs from the plates out (b1's tongue swings between)
        ac(A, (sx * X_FORK[0], Q2.y, Q2.z), (sx * (X_L2[1] + 0.01), Q2.y, Q2.z), 0.022, C['steel'], seg=8, cap0=False)
        ac(A, (sx * X_L2[1], Q2.y, Q2.z), (sx * (X_L2[1] + 0.01), Q2.y, Q2.z), 0.034, C['steel'], seg=8, cap0=False)
    # the boom, its collar and the open mouth with the wear pads
    boom(A, [(B2_Y0, B2W, B2H, VB), (B2_Y1 - 0.05, B2W, B2H, VB)], r, True, False)
    boom(A, [(B2_Y1 - 0.05, B2W + 0.016, B2H + 0.016, VB), (B2_Y1, B2W + 0.016, B2H + 0.016, VB)], r, True, False)
    mouth(A, B2_Y1, VB, B2W + 0.016, B2H + 0.016, B2W - 0.016, B2H - 0.016, 0.16, r, C['dark'])
    pads(A, B2_Y1 - 0.004, VB, B2W - 0.016, B2H - 0.016, E1W, E1H, 0.06, C['pad'])
    # hoses: the pair from the knuckle pin's axis into the boom (to the telescope cylinder), and a pair along it to a coupling block
    for k in range(2):
        hose(A, [(0.158, 0.02, 0.033 - 0.026 * k), (0.15, 0.20, 0.13 - 0.016 * k), (0.135, 0.38, VB - 0.05 + 0.013 * k), (0.122, 0.50, VB - 0.04 + 0.026 * k),
                 (0.10, 0.60, VB - 0.04 + 0.026 * k)], 0.011)
    abox(A, 0.092, 0.112, 0.56, 0.66, VB - 0.09, VB + 0.01, C['dark'])                     # the bulkhead fitting
    for k in range(2):
        zz = VB + 0.05 + 0.026 * k
        hose(A, [(0.112, 0.64, zz - 0.06), (0.114, 0.74, zz), (0.114, B2_Y1 - 0.22, zz), (0.09, B2_Y1 - 0.12, zz + 0.02 * (1 - k))], 0.011)
    abox(A, 0.06, 0.12, B2_Y1 - 0.15, B2_Y1 - 0.07, VB + 0.04, VB + 0.135, C['dark'])     # the coupling block
    for yc in (1.0, 1.5):
        clamp(A, (0.108, yc, VB + 0.063), 0.026, C['dark'])
    return A.done(40)

def link_plate(L, r0, r1, waist):
    """a link plate in (y, z): from a boss of radius r0 at the origin to one of r1 at (L, 0), drawn in at the middle"""
    top = [(L * t, waist + (1 - t) * (r0 - waist) * (1 - t) + t * t * (r1 - waist)) for t in (0.3, 0.5, 0.7)]
    return arc((L, 0), r1, -90, 90, 4) + list(reversed(top)) + arc((0, 0), r0, 90, 270, 4) + [(y, -z) for y, z in top]

def part_link1():
    """the rocker: two plates from its pin on b1 (the origin) to J at (0, LA, 0), with a spacer between them and J's pin"""
    A = Acc('link1'); r = C['red']
    plate_pair(A, link_plate(LA, 0.047, 0.047, 0.032), X_L1[0], X_L1[1], r)
    ac(A, (-X_L1[0], LA * 0.45, 0.0), (X_L1[0], LA * 0.45, 0.0), 0.02, r, seg=6, cap0=False, cap1=False)          # the spacer tube
    apin(A, (0, LA, 0), X_L2[1] + 0.01, 0.024, C['steel'], cap_r=0.034, cap_t=0.01, sides=(-1, 1))
    return A.done(40)

def part_link2():
    """the push link: two plates from its pin on b2 (the origin) to J at (0, LB, 0)"""
    A = Acc('link2'); r = C['red']
    plate_pair(A, link_plate(LB, 0.045, 0.045, 0.031), X_L2[0], X_L2[1], r)
    ac(A, (-X_L2[0], LB * 0.5, 0.0), (X_L2[0], LB * 0.5, 0.0), 0.018, r, seg=6, cap0=False, cap1=False)            # the spacer tube
    return A.done(40)

def part_person(h=1.8):
    """a plain 1.8 m figure for the renders' scale (not exported)"""
    A = Acc('person'); m = mat('person', (0.45, 0.50, 0.58), 0.3); sk = mat('skin', (0.80, 0.62, 0.50), 0.3)
    for sx in (-1, 1):
        ac(A, (sx * 0.09, 0, 0.0), (sx * 0.09, 0, 0.84), 0.065, m, seg=8)
        ac(A, (sx * 0.23, 0, 0.82), (sx * 0.25, 0, 1.44), 0.045, m, seg=8)
    abox(A, -0.20, 0.20, -0.11, 0.11, 0.80, 1.47, m)
    ac(A, (0, 0, 1.47), (0, 0, 1.56), 0.05, sk, seg=8)
    sphere_a(A, (0, 0, h - 0.115), 0.115, sk, seg=10, rings=6)
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
    boom(A, [(E2L, E2W + 0.012, E2H + 0.012, 0.0), (E2L + 0.04, E2W + 0.012, E2H + 0.012, 0.0)], r, True, True)
    # the tip head: two cheeks carrying the sheave, a cover over it
    sy, sz = SHV.y, SHV.z; xc = (E2W / 2 - 0.015, E2W / 2 + 0.002)
    cheek = [(E2L + 0.02, -0.085), (E2L + 0.02, 0.09), (sy - 0.035, 0.105)] + arc((sy, sz), 0.105, 70, -100, 8) + [(sy - 0.07, -0.11)]
    plate_pair(A, cheek, xc[0], xc[1], r)
    abox(A, -xc[0], xc[0], E2L + 0.04, sy - 0.02, 0.085, 0.10, r)                          # the cover
    lathe_x(A, SHV, [(0.022, -0.04), (SHV_R, -0.04), (SHV_R, -0.028), (SHV_R - 0.014, -0.008), (SHV_R - 0.014, 0.008), (SHV_R, 0.028), (SHV_R, 0.04), (0.022, 0.04)], C['steel'], seg=12)
    apin(A, SHV, xc[1] + 0.008, 0.02, C['steel'], cap_r=0.032)
    ac(A, (-xc[0], sy + 0.04, 0.105), (xc[0], sy + 0.04, 0.105), 0.013, C['steel'], seg=6)   # the wire guard over the sheave
    return A.done(40)

def part_hook():
    A = Acc('hook'); st = C['steel']; y = C['yellow']
    ac(A, (0, 0, 0.0), (0, 0, -0.055), 0.013, st, seg=8, r1=0.017)                          # the wire's pressed socket
    atorus(A, (0, 0, -0.074), (1, 0, 0), 0.022, 0.008, lambda a: st, 7, 4)                  # its eye
    atorus(A, (0, 0, -0.108), (0, 1, 0), 0.024, 0.008, lambda a: st, 7, 4)                  # the swivel's shackle
    ac(A, (0, 0, -0.128), (0, 0, -0.17), 0.036, y, seg=10)                                   # the swivel head
    ac(A, (0, 0, -0.17), (0, 0, -0.183), 0.026, st, seg=6)                                   # its nut
    # the hook: shank, bowl and point, thickest at the bowl's bottom
    c = (0.047, -0.272); R = 0.047
    pts = [(0.0, -0.183), (0.0, -0.205), (0.0, -0.24)]
    pts += [(c[0] + R * math.cos(math.radians(a)), c[1] + R * math.sin(math.radians(a))) for a in range(180, 431, 26)]
    nb = len(pts) - 3
    rad = [0.019, 0.019, 0.020] + [0.020 + 0.003 * math.sin(math.pi * min(1, k / (nb / 2))) - 0.0145 * max(0, (k - nb / 2) / (nb / 2)) for k in range(nb)]
    asweep(A, [(0, py, pz) for py, pz in pts], rad, y, seg=8)
    # the safety latch: a steel strip from the shank to the point, its spring
    p0 = V((0, 0.018, -0.205)); p1 = V((0, pts[-1][0] + 0.004, pts[-1][1] + 0.006))
    d = (p1 - p0); L = d.length; d.normalize(); n = d.cross(V((1, 0, 0))).normalized()
    obox(A, (p0 + p1) / 2, V((0.008, 0, 0)), d * (L / 2), n * 0.002, st)
    atorus(A, p0 + V((0, -0.004, 0.004)), (1, 0, 0), 0.008, 0.003, lambda a: st, 6, 3)
    return A.done(40)

def part_cyl(name, L, R, rod=False, eye_w=0.05, eye_r=0.04, Lr=None, side=1):
    """barrel: from its base eye along +y (game -z) to the gland; rod: from its eye along -y (game +z) into the barrel; the ports,
    the pipe and the hose stub on the barrel's side +z (side 1) or -z (side -1), in the plane the cylinder swings in, so they stay
    between the plates of its brackets"""
    A = Acc(name)
    if not rod:
        r = C['red']
        ac(A, (-eye_w, 0, 0), (eye_w, 0, 0), eye_r, r, seg=10)                               # the base eye
        ac(A, (0, 0.0, 0), (0, 0.07, 0), R * 0.8, r, seg=12, r1=R + 0.004, cap0=False)      # the base cap
        ac(A, (0, 0.07, 0), (0, 0.09, 0), R + 0.004, r, seg=12, cap1=False)
        ac(A, (0, 0.09, 0), (0, L - 0.06, 0), R, r, seg=12, cap0=False, cap1=False)
        ac(A, (0, L - 0.06, 0), (0, L - 0.012, 0), R + 0.006, r, seg=12)                    # the gland
        ac(A, (0, L - 0.012, 0), (0, L, 0), R * 0.72, C['dark'], seg=12, cap0=False)       # the wiper
        # the ports and the steel pipe from the base end to the rod end
        z0, z1 = sorted((side * (R - 0.012), side * (R + 0.016)))
        for yy in (0.11, L - 0.085):
            abox(A, -0.018, 0.018, yy - 0.022, yy + 0.022, z0, z1, r)
        pz = side * (R + 0.024)
        asweep(A, [(0.0, 0.13, side * (R + 0.012)), (0.0, 0.16, pz), (0.0, L - 0.14, pz), (0.0, L - 0.105, side * (R + 0.012))], 0.008, C['steel'], seg=5)
        hose(A, [(0.0, 0.11, side * (R + 0.016)), (0.01, 0.08, side * (R + 0.06)), (0.03, -0.10, side * (R + 0.05))], 0.012)   # the hose stub to the valve
    else:
        ac(A, (-eye_w, 0, 0), (eye_w, 0, 0), eye_r, C['steel'], seg=10)                      # the rod eye
        ac(A, (0, -0.02, 0), (0, -0.075, 0), R * 1.25, C['steel'], seg=10, cap0=False)
        ac(A, (0, -0.075, 0), (0, -Lr, 0), R, C['chrome'], seg=12)
    return A.done(40)

def part_rest(S, tilt=0.0):
    """the boom rest: S is the seat's height (the cradle's rubber where b2's underside lies); the cradle is pitched by tilt about x
    (the outer boom's slope in the park pose), so the boom lies along its whole length"""
    A = Acc('rest'); g = C['grey']; rb = C['rubber']
    abox(A, -0.17, 0.17, -0.17, 0.17, 0.0, 0.018, g)
    for x, y in ((0.13, 0.13), (-0.13, 0.13), (0.13, -0.13), (-0.13, -0.13)):
        bolt(A, (x, y, 0.018), 0.016, 0.014, C['steel'])
    top = S - 0.12
    aloft(A, [column_ring(0.018, 0.12, 0.12, 0.0, 0.014), column_ring(top, 0.12, 0.12, 0.0, 0.014)], g, False, False, [V((0, 0, 0.018)), V((0, 0, top))], flat=True)
    for k in range(4):
        a = k * math.pi / 2; ca, sa = math.cos(a), math.sin(a)
        P = lambda r, z, t: V((r * ca - t * sa, r * sa + t * ca, z))
        extrude(A, [(0.06, 0.018), (0.16, 0.018), (0.16, 0.034), (0.06, 0.18)], P, -0.006, 0.006, g)
    abox(A, -0.10, 0.10, -0.10, 0.10, top, top + 0.016, g)                                   # the head plate
    # the V cradle (steel) and its rubber lining, fitting b2's lower section with a little play, on a block over the head plate
    Rt = Matrix.Rotation(tilt, 3, 'X'); Q = V((0, 0, S))
    P = lambda a, b, t: Q + Rt @ V((a, t, b - S))
    hw, hh = B2W / 2, B2H / 2
    a0 = 0.5 * hw + 0.006; h1 = 0.16; a1 = a0 + h1 * (0.5 * hw) / (0.95 * hh)     # the lining follows b2's lower sides
    yl = 0.11
    steel = [(-(a1 + 0.033), S + h1), (-(a1 + 0.015), S + h1), (-(a0 + 0.012), S - 0.018), (a0 + 0.012, S - 0.018), (a1 + 0.015, S + h1), (a1 + 0.033, S + h1), (a0 + 0.024, S - 0.044), (-(a0 + 0.024), S - 0.044)]
    extrude(A, steel, P, -yl, yl, g)
    lining = [(-(a1 + 0.015), S + h1), (-(a0 + 0.012), S - 0.018), (a0 + 0.012, S - 0.018), (a1 + 0.015, S + h1), (a1, S + h1), (a0, S - 0.003), (-a0, S - 0.003), (-a1, S + h1)]
    extrude(A, lining, P, -yl + 0.008, yl - 0.008, rb)
    extrude(A, [(-0.06, S - 0.14), (0.06, S - 0.14), (0.06, S - 0.044), (-0.06, S - 0.044)], P, -0.08, 0.08, g)
    return A.done(40)

# ---------- the chain, as the game composes it ----------
def T(v): return Matrix.Translation(V(v))
def Rx(a): return Matrix.Rotation(a, 4, 'X')
def Rz(a): return Matrix.Rotation(a, 4, 'Z')

def joint(a2):
    """the knuckle link's joint J in b1's frame for the knuckle angle a2: where the circle round Q1 (radius LA) meets the circle round
    link2's pin (radius LB), on the JSIDE side of the line from Q1 to that pin"""
    q2 = K2 + Rx(a2).to_3x3() @ Q2
    d = (q2 - Q1).length
    if d > LA + LB or d < abs(LA - LB): raise ValueError('the knuckle link cannot reach at a2 = %.3f' % a2)
    a = (LA * LA - LB * LB + d * d) / (2 * d); h = math.sqrt(max(0.0, LA * LA - a * a))
    e = (q2 - Q1) / d; perp = V((0.0, -e.z, e.y))           # e turned +90 degrees about x
    return Q1 + e * a + perp * (JSIDE * h), q2

def link_angles(a2):
    """l1: link1's turn about x on b1 (from its rest along -z in the game's frame, +y here); l2: link2's turn on b2"""
    J, q2 = joint(a2)
    l1 = math.atan2(J.z - Q1.z, J.y - Q1.y)
    J2 = Rx(-a2).to_3x3() @ (J - K2)                      # J in b2's frame
    l2 = math.atan2(J2.z - Q2.z, J2.y - Q2.y)
    return l1, l2, J

def chain(slew, a1, a2, ext=0.0, wire=0.6):
    M = {'base': Matrix.Identity(4)}
    M['col'] = T((0, 0, H_BASE)) @ Rz(slew)
    M['b1'] = M['col'] @ T(P1) @ Rx(a1)
    M['b2'] = M['b1'] @ T(K2) @ Rx(a2)
    l1, l2, J = link_angles(a2)
    M['link1'] = M['b1'] @ T(Q1) @ Rx(l1)
    M['link2'] = M['b2'] @ T(Q2) @ Rx(l2)
    M['ext1'] = M['b2'] @ T((0, E1_AT + ext, VB))
    M['ext2'] = M['ext1'] @ T((0, E2_AT + ext, 0))
    tip = M['ext2'] @ TIP
    M['hook'] = T(tip - V((0, 0, wire)))
    for nm, pa, pb in (('cyl1', M['col'] @ C1A, M['b1'] @ C1B), ('cyl2', M['b1'] @ C2A, M['link1'] @ V((0, LA, 0)))):
        d = (pb - pa).normalized()
        X = (M['col'].to_3x3() @ V((1, 0, 0))).normalized(); Z = X.cross(d).normalized()
        R = Matrix((X, d, Z)).transposed().to_4x4()
        M[nm + 'b'] = T(pa) @ R; M[nm + 'r'] = T(pb) @ R
    return M, tip

def cyl_d(a1=None, a2=None):
    if a1 is not None:
        pb = T(P1) @ Rx(a1) @ C1B; return (pb - C1A).length
    return (joint(a2)[0] - C2A).length

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

# the pairs joined by design: a pin through an eye, a rod in its barrel, a telescope in its sleeve, the knuckle's tongue in its fork
JOINED = {('base', 'col'), ('col', 'b1'), ('col', 'cyl1b'), ('b1', 'cyl1r'), ('cyl1b', 'cyl1r'), ('b1', 'cyl2b'), ('link1', 'cyl2r'), ('cyl2b', 'cyl2r'),
          ('b1', 'b2'), ('b1', 'link1'), ('b2', 'link2'), ('link1', 'link2'), ('b2', 'ext1'), ('ext1', 'ext2'), ('b2', 'ext2')}

def fold_limits(objs, step=10):
    """for a1 from the bottom of its range up, the most the knuckle may close (a2) before the outer boom or the telescopes (in)
    touch the column, the pedestal or the lift cylinder; the game keeps a2 over this (interpolated) so the crane never folds into
    itself"""
    near = {k: objs[k] for k in ('base', 'col', 'cyl1b', 'cyl1r', 'b2', 'ext1', 'ext2')}
    pairs = {(a, b) for a in ('base', 'col', 'cyl1b', 'cyl1r') for b in ('b2', 'ext1', 'ext2')}
    skip = {(a, b) for a in near for b in near if (a, b) not in pairs and (b, a) not in pairs}
    out = []
    a1s = list(range(int(round(math.degrees(A1_RANGE[0]))), int(round(math.degrees(A1_RANGE[1]))), step)) + [int(round(math.degrees(A1_RANGE[1])))]
    for a1d in a1s:
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
    # the cylinders against their strokes over the working ranges, and the link's transmission angle
    d1 = [cyl_d(a1=A1_RANGE[0] + (A1_RANGE[1] - A1_RANGE[0]) * k / 60) for k in range(61)]
    a2s = [A2_RANGE[0] + (A2_RANGE[1] - A2_RANGE[0]) * k / 60 for k in range(61)]
    d2 = [cyl_d(a2=a) for a in a2s]
    for nm, d, Lb, Lr in (('lift', d1, L1B, L1R), ('knuckle', d2, L2B, L2R)):
        lo, hi = min(d), max(d)
        print('%-7s cylinder: pin to pin %.3f..%.3f m; barrel %.3f (needs <= %.3f), rod %.3f (needs <= %.3f), overlap at full stroke %.3f m'
              % (nm, lo, hi, Lb, lo - 0.07, Lr, lo - 0.10, Lb + Lr - hi))
    mus = []
    for a in a2s:
        J, q2 = joint(a); u = (Q1 - J).normalized(); w = (q2 - J).normalized(); mus.append(math.degrees(u.angle(w)))
    print('knuckle link: transmission angle %.0f..%.0f deg; the cylinder %s' % (min(mus), max(mus), 'pushes to raise' if d2[-1] > d2[0] else 'pulls to raise'))
    # the park pose (for boats with a rest): both booms level, a1 = -a2, so b2's underside lies at 1.20 m over the deck near its mouth
    s_rest = B2_Y1 - 0.35
    def rest_pt(a1):
        M, _ = chain(0.0, a1, -a1); return M['b2'] @ V((0, s_rest, VB - B2H / 2))
    lo_, hi_ = 0.0, 0.6
    for _ in range(50):
        mid = (lo_ + hi_) / 2
        if rest_pt(mid).z > 1.20: hi_ = mid
        else: lo_ = mid
    a1p = round((lo_ + hi_) / 2, 4); rp = rest_pt(a1p); REST_H = round(rp.z, 4)
    POSES = {'stow': {'a1': round(math.radians(99), 4), 'a2': round(math.radians(-148), 4), 'ext': 0.0, 'wire': 0.05},
             'park': {'a1': a1p, 'a2': -a1p, 'ext': 0.0, 'wire': 0.10},
             'work': {'a1': 0.60, 'a2': -0.76, 'ext': 0.80, 'wire': 0.6}}
    for nm, p in POSES.items():
        assert A1_RANGE[0] - 1e-6 <= p['a1'] <= A1_RANGE[1] + 1e-6 and A2_RANGE[0] - 1e-6 <= p['a2'] <= A2_RANGE[1] + 1e-6, nm

    objs = {'base': part_base(), 'col': part_col(), 'b1': part_b1(), 'b2': part_b2(), 'link1': part_link1(), 'link2': part_link2(),
            'ext1': part_ext1(), 'ext2': part_ext2(), 'hook': part_hook(),
            'cyl1b': part_cyl('cyl1b', L1B, R1B, eye_w=0.072, eye_r=0.055, side=-1), 'cyl1r': part_cyl('cyl1r', 0, R1R, True, eye_w=0.05, eye_r=0.045, Lr=L1R),
            'cyl2b': part_cyl('cyl2b', L2B, R2B, eye_w=0.058, eye_r=0.045), 'cyl2r': part_cyl('cyl2r', 0, R2R, True, eye_w=0.045, eye_r=0.038, Lr=L2R),
            'rest': part_rest(REST_H, 0.0)}
    # a little occlusion baked into the colours, each part alone (they move against each other)
    setup_render(64, 64, samples=8)
    for nm, o in objs.items():
        for p in bpy.context.scene.objects:
            if p.type == 'MESH': p.hide_render = p is not o
        bake_ao(o, samples=16, distance=0.10)
    for p in bpy.context.scene.objects:
        if p.type == 'MESH': p.hide_render = False
    parts = [(nm, mesh_arrays(o, to_game, to_game_n, ao=True), 1.0) for nm, o in objs.items()]

    # reach with both booms level and both telescopes out
    Mr, tipr = chain(0.0, 0.0, 0.0, EXT_MAX)
    Mw, tipw = chain(0.0, POSES['work']['a1'], POSES['work']['a2'], POSES['work']['ext'])
    # the folded crane's envelope (stow, slew 0, hook included), in the base frame on the game's axes, so boats can check clearance
    Ms, tips = chain(0.0, POSES['stow']['a1'], POSES['stow']['a2'], POSES['stow']['ext'], POSES['stow']['wire'])
    pts = [to_game(Ms[k] @ v.co) for k, o in objs.items() if k != 'rest' for v in o.data.vertices]
    stow_box = {'min': [round(min(p[k] for p in pts), 3) for k in range(3)], 'max': [round(max(p[k] for p in pts), 3) for k in range(3)]}
    sz = {nm: size(o) for nm, o in objs.items()}
    r4 = lambda v: round(v, 4)
    klink = []
    for k in range(int(round(math.degrees(A2_RANGE[0]))), int(round(math.degrees(A2_RANGE[1]))) + 1, 5):
        a = math.radians(k); l1, l2, J = link_angles(a); klink.append([r4(a), r4(l1), r4(l2)])
    if abs(klink[-1][0] - A2_RANGE[1]) > 1e-4:
        l1, l2, J = link_angles(A2_RANGE[1]); klink.append([r4(A2_RANGE[1]), r4(l1), r4(l2)])
    for i in range(1, len(klink)):                                   # unwrapped, so the game can interpolate straight between rows
        for j in (1, 2):
            while klink[i][j] - klink[i - 1][j] > math.pi: klink[i][j] = r4(klink[i][j] - 2 * math.pi)
            while klink[i][j] - klink[i - 1][j] < -math.pi: klink[i][j] = r4(klink[i][j] + 2 * math.pi)
    ex = {'frame': 'kystfiske deck crane: metres, x to starboard, y up, z aft; each part from its own pivot; booms, links and cylinder barrels lie along -z, rods along +z; '
                   'base -> col (slew about y) -> b1 (a1 about x at b1_at) -> b2 (a2 about x at b2_at) -> ext1 at ext_at + ext_dir*e -> ext2 at ext2_at + ext_dir*e; '
                   'link1 on b1 at q1 turned l1 about x, link2 on b2 at q2 turned l2 about x (klink: [a2, l1, l2], or J from the two circles); '
                   'cyl1 from c1_a (col) to c1_b (b1); cyl2 from c2_a (b1) to c2_b (link1); angles in radians, positive raises the tip; the hook hangs on a wire straight down from tip',
          'col_at': G((0, 0, H_BASE)),
          'b1_at': G(P1), 'c1_a': G(C1A),
          'b2_at': G(K2), 'c1_b': G(C1B), 'c2_a': G(C2A),
          'q1': G(Q1), 'q2': G(Q2), 'la': LA, 'lb': LB, 'jside': JSIDE,
          'c2_b': G((0, LA, 0)), 'c2_b_in': 'link1',
          'klink': klink,
          'ext_at': G((0, E1_AT, VB)), 'ext_dir': [0, 0, -1],
          'ext2_at': G((0, E2_AT, 0)), 'ext_max': EXT_MAX,
          'tip': G(TIP), 'sheave': G(SHV), 'sheave_r': SHV_R,
          'cyl1_len': L1B, 'cyl1_rod': L1R, 'cyl2_len': L2B, 'cyl2_rod': L2R,
          'a1_range': [r4(A1_RANGE[0]), r4(A1_RANGE[1])], 'a2_range': [r4(A2_RANGE[0]), r4(A2_RANGE[1])],
          'a2_min': fold_limits(objs),
          'stow': POSES['stow'], 'stow_box': stow_box, 'park': POSES['park'], 'work': POSES['work'],
          'rest_at': [0.0, 0.0, r4(-rp.y)], 'rest_h': REST_H, 'rest_tilt': 0.0,
          'hook_h': HOOK_H, 'wire_min': 0.04,
          'reach_max': round(tipr.y, 3), 'reach_work': round(tipw.y, 3), 'swl': 0.75, 'lift_moment_tm': 6.0,
          'size': {nm: [r4(hi[k] - lo[k]) for k in range(3)] for nm, (lo, hi) in sz.items()}}
    glb = os.path.join(OUT, 'deck-crane.glb'); n = write_glb(glb, parts, ex)
    open(os.path.join(ROOT, 'src', 'data', 'deck-crane.b64'), 'w').write(base64.b64encode(open(glb, 'rb').read()).decode())
    tot = sum(len(A['idx']) // 3 for _, A, _ in parts)
    print('deck crane GLB %.1f KB, %d triangles' % (n / 1024, tot))
    for nm, A, _ in parts:
        lo, hi = sz[nm]
        print('  %-6s %5d tris  x %.3f..%.3f  y %.3f..%.3f  z %.3f..%.3f' % (nm, len(A['idx']) // 3, lo[0], hi[0], lo[1], hi[1], lo[2], hi[2]))
    print('  a2_min     %s' % ', '.join('%.0f:%.0f' % (math.degrees(x), math.degrees(y)) for x, y in ex['a2_min']))
    for k in ('col_at', 'b1_at', 'c1_a', 'b2_at', 'c1_b', 'c2_a', 'q1', 'q2', 'c2_b', 'ext_at', 'ext2_at', 'tip', 'rest_at', 'rest_h', 'reach_max', 'reach_work', 'stow', 'stow_box', 'park', 'work'):
        print('  %-10s %s' % (k, ex[k]))
    crane = {k: v for k, v in objs.items() if k != 'rest'}
    for nm, p in POSES.items():
        M, tip = chain(0.0, p['a1'], p['a2'], p['ext'], p['wire'])
        if nm == 'park': M['rest'] = T((0, rp.y, 0))
        show = {**crane, **({'rest': objs['rest']} if nm == 'park' else {})}
        top = max((M[k] @ v.co).z for k, o in show.items() for v in o.data.vertices)
        hk = min((M['hook'] @ v.co).z for v in objs['hook'].data.vertices)
        print('  %s: overlaps %s; top %.3f m, tip %.2f m out %.2f m up, hook down to %.3f m; cylinders %.3f, %.3f m' % (nm, overlaps(show, M, JOINED), top,
              tip.y, tip.z, hk, cyl_d(a1=p['a1']), cyl_d(a2=p['a2'])))
    if 'fast' in sys.argv: return
    renders(objs, POSES, rp)

def place(objs, M, show):
    for nm, o in objs.items():
        if nm in M: o.matrix_world = M[nm]
        o.hide_render = nm not in show

def wire_obj(a, b):
    A = Acc('wire'); ac(A, a, b, 0.004, C['steel'], seg=6); return A.done(40)

def renders(objs, POSES, rp):
    sc = setup_render(1000, 700, samples=12)
    try: sc.cycles.use_denoising = True
    except Exception: pass
    bm = bmesh.new(); s_ = 12
    bm.faces.new([bm.verts.new(p) for p in ((-s_, -s_, -0.002), (s_, -s_, -0.002), (s_, s_, -0.002), (-s_, s_, -0.002))])
    obj_from_bm('deck', bm, [mat('deck', (0.36, 0.40, 0.41), 0.3)])
    man = part_person(); objs = dict(objs); objs['person'] = man
    crane = [k for k in objs if k not in ('rest', 'person')]
    only = [x for x in sys.argv[1:] if x != 'fast']
    def want(k): return not only or k in only
    def shot(nm, pose, slew, show, cams, rest=None, wire=None, person=None):
        p = POSES[pose]; M, tip = chain(slew, p['a1'], p['a2'], p['ext'], wire or p['wire'])
        if rest is not None: M['rest'] = T(rest)
        if person is not None: M['person'] = T(person) @ Rz(math.pi / 2); show = show + ['person']
        place(objs, M, show)
        w = wire_obj(tip, M['hook'] @ V((0, 0, 0)))
        for cn, loc, look, lens in cams:
            camera(loc, look, lens=lens); render(os.path.join(OUT, 'kran_%s.png' % (nm + cn)))
        bpy.data.objects.remove(w, do_unlink=True)
    if want('stow'):
        shot('stow', 'stow', 0.0, crane, [('', (4.4, 4.3, 2.0), (0.0, 0.55, 1.1), 30), ('_side', (6.8, 0.55, 1.2), (0.0, 0.55, 1.15), 30)], person=(0.0, -1.5, 0.0))
        # from the photos' side and height (the low end to the left), and the photos over the renders when they are at hand:
        # KRAN_PHOTO = 'path@x0,y0,x1,y1' (the crop as fractions of the image), several joined by os.pathsep; they stay out of the repo
        shot('stow', 'stow', 0.0, crane, [('_photo', (-4.5, 2.1, 1.9), (0.0, 0.55, 1.15), 35)])
        specs = [p for p in os.environ.get('KRAN_PHOTO', '').split(os.pathsep) if p]
        if specs:
            from PIL import Image
            hh = 360; top = []
            for spec in specs:
                path, box = spec.split('@'); f = [float(v) for v in box.split(',')]
                ph = Image.open(path).convert('RGB'); W, H = ph.size; ph = ph.crop((int(f[0] * W), int(f[1] * H), int(f[2] * W), int(f[3] * H)))
                top.append(ph.resize((int(ph.size[0] * hh / ph.size[1]), hh)))
            bot = [Image.open(os.path.join(OUT, 'kran_stow%s.png' % k)).convert('RGB') for k in ('_side', '_photo')]
            bot = [im.resize((int(im.size[0] * hh / im.size[1]), hh)) for im in bot]
            W = max(sum(im.size[0] for im in top), sum(im.size[0] for im in bot))
            sheet = Image.new('RGB', (W, 2 * hh), (255, 255, 255)); x = 0
            for im in top: sheet.paste(im, (x, 0)); x += im.size[0]
            x = 0
            for im in bot: sheet.paste(im, (x, hh)); x += im.size[0]
            sheet.save(os.path.join(OUT, 'kran_stow_vs_photo.png'))
    if want('park'):
        shot('park', 'park', 0.0, crane + ['rest'], [('', (4.6, 0.2, 2.6), (0.0, 2.1, 1.0), 32)], rest=(0, rp.y, 0))
    if want('work'):
        shot('work', 'work', -0.45, crane, [('', (6.2, -1.4, 3.0), (1.3, 2.3, 1.5), 32)])
    if want('knuckle'):
        for pose, cn in (('work', ''), ('stow', '_stow')):
            p = POSES[pose]; M, tip = chain(0.0, p['a1'], p['a2'], p['ext'], p['wire']); kn = M['b2'].to_translation()
            off = (1.3, -0.7, 0.5) if pose == 'work' else (1.3, 0.8, 0.5)
            shot('knuckle' + cn, pose, 0.0, crane, [('', (kn.x + off[0], kn.y + off[1], kn.z + off[2]), (kn.x, kn.y, kn.z - 0.1), 40)])
    if want('column'):
        shot('column', 'work', 0.0, crane, [('', (1.65, 1.4, 1.3), (0.14, 0.05, 0.75), 38)])

if __name__ == '__main__':
    main()
