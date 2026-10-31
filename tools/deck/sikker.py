"""The safety and navigation kit on deck and on the wheelhouse roof, built in Blender (the user's wish 19.10.2026): the radar (a
radome, or an open array on its pedestal), the ring buoy on its bracket with its light and its line, and the throw-overboard
liferaft in its cradle with the lashing and the hydrostatic release. No brand names, logos or text on the models; the makes named
below are only where the measures come from.

    radome      a 24-inch radar dome: 0.610 m across, 0.240 m high (Garmin GMR 24 HD: 61 cm x 24.4 cm; Raymarine's RD424HD is
                652 x 247 mm). White glossy cover with a slightly domed top and a rounded shoulder, the cover's lip and a dark seam
                line round its lower part where it sits on the base, a dark grey base ring with four bolt-down feet, and a cable
                gland with the cable going down at the back. From the middle of its base (y = 0), front towards -z.
    radar_ped   the pedestal (gearbox) of an open-array radar: 0.36 m wide (x) x 0.42 m long (z) x 0.38 m high to the top of the
                hub (the caller's measures; Raymarine's 4 kW Magnum pedestal is 409 x 314 x 430 mm with its hub). A grey base with a
                bolting flange, a white housing over a seam groove, its front sloping back to a rounded top, the round turntable hub
                on top 22 mm aft of the middle, a breather and a cable gland at the back. From the middle of its base. Extras:
                bar_at, the point on the hub where the bar's mount sits (the bar turns about y through it).
    radar_bar4  the open array bars, 4 ft (1.22 m) and 6 ft (1.83 m) long along x (nominal lengths; real 4 ft arrays measure
    radar_bar6  1.25-1.31 m over their end caps), 0.14 m tall and 0.10 m deep: a slim white section with a tall, nearly flat
                front face (the radiating face, towards -z) tapering to a rounded back, rounded grey end caps, and a short dark
                neck with a white fairing at the middle underneath. From the bottom of the neck (it sits on bar_at).
    livboye     a SOLAS ring life buoy, 0.610 m outside and 0.400 m inside (the common 2.5 kg size, 610 x 400-405 mm; the LSA Code
                asks for at most 800 mm outside and at least 400 mm inside), 0.090 m thick: a rounded, slightly flattened section
                (a superellipse), international orange, four bands of retro-reflective tape at 45, 135, 225 and 315 degrees that
                wrap the ring and hold the grab line (9.5 mm, as the LSA Code asks; four loops, the line four times the outer
                diameter long) where it passes under them at the outer rim, the loops slack between them (the top one lies on the
                rim, the side ones hang a little off it, the bottom one 8 cm below the ring). The ring stands in
                the x-y plane, faces +z and -z, from its centre. Extras: boye_strip_top and boye_strip_bot, the text strips on the
                +z face: 13 pairs [bottom point, top point] each, 0.065 m tall, 2 mm proud of the face's crown. top runs from 155 to
                25 degrees over the upper arc, left to right seen from +z, its bottom points on the inner edge (the boat's name);
                bot runs from 205 to 335 degrees over the lower arc, left to right, its bottom points on the outer edge so the
                letters stand upright seen from the front (the home port). The face falls away from its crown under the strip's
                edges, so they float 6.6 mm over it there. sikker_strips.png lays letters on them the way texStrip does. Extras:
                ring, its outer and inner diameter and thickness.
    livboye_w   the same ring in white with four red bands (34 degrees each) at the diagonals, the tape in the middle of them.
    boyeholder  a stainless (AISI 316) ring buoy bracket for a wheelhouse side or a rail: a back plate (40 x 4 mm flat bar, two bolts)
                with two 10 mm round-bar arms at its top that go out through the ring's hole and turn up at their tips; the ring
                hangs on them by the top of its hole and lifts off them forward (quick release, nothing to undo). From its lower
                bolt on the wall (y = 0), the wall in the x-y plane, the ring in front towards +z. Extras: boye_at, where the ring's
                centre sits when it hangs on the bracket (its mid-plane 0.05 m in front of the wall).
    boyelys     a ring buoy light (MOB light): 0.32 m long, a 0.07 m orange-yellow body with a float collar, a clear lens and a
                dark base with the lanyard eye (lifebuoy lights measure 340-355 mm by 70-95 mm). It is stored upside down in its
                bracket, as real ones are (they light when they float upright), held by two stainless clips on a back plate, the
                lower one under the collar. The lens is an opaque pale blue-grey (one mesh, one material pass). From the middle of
                the back plate on the wall.
    boyeline    30 m of 8 mm floating line (yellow polypropylene) coiled to 0.28 m across and hung on a small stainless wall hook:
                a bundle with the turns showing as ridges, one loose turn over it, four turns of the end bound round the top and
                the end hanging down inside. From the hook's fixing on the wall.
    flate4      throw-overboard liferaft containers, white GRP: two half-shells meeting at a raised flange with a dark seam round
    flate6      the middle, domed ends, raised ribs (one on each half for 4 and 6, two for 12), a label patch on each half (no
    flate12     text), drain holes under the flange and the painter (red and black cord) out of a grommet low on the +x end. Lying
                along x. VIKING's SOLAS throw-overboard containers (technical liferaft brochure 2015 and 2019, Marko's 12 DK
                listing): 4 DK 990 x 490 mm, 6 DK 1155 x 561 mm, 12 DK 1355 x 650 mm. From the bottom of the shell at the middle.
                The 4 DK's diameter is read from the brochure's table, whose column labels were not legible; 490 mm fits the 6 DK's
                row.
    vugge4      the matching stainless cradles: two saddles (6 mm flat bar on black rubber pads) under the container on legs, a
    vugge6      base frame of 30 mm square tube with cross members and bolted foot plates, tabs out at the middle with pad eyes,
    vugge12     and the lashing over the container's middle: a 50 mm webbing strap fitted to its own container, on the -z side
                (game frame) a turnbuckle and a senhouse slip hook, on the +z side the hydrostatic release unit (a light grey disc
                about 75 x 30 mm, the shape of the common Hammar H20, with its white rope sling) on a shackle, and the red weak link
                there with the painter made fast to it, running along the deck from the container's end. From the middle of the
                base on deck (y = 0). Extras: flate_at, where the container's origin sits in each cradle; release, per size, the
                release unit's middle (hru), the slip hook (hook) and the top of the strap (strapTop), for anything the game hangs
                on them.

The occlusion is baked into the colours, each part alone (a cradle with its container in place, and the container with its cradle).
Every extra and every part is in the game's frame.

What I chose myself: the colours, the radome's profile and its feet, the pedestal's shape (tapered and rounded) and the hub, the
array's section, the ring's section (90 mm thick, superellipse 2.8), the tape bands as the line's holders and where they sit, the
loops' sag, the bracket's design (two hooks), the light's profile and bracket, the coil's shape and binding, the container's dome
depth, ribs and flange, the cradle's design (saddle angle +-55 degrees, 70 mm under the container), the hardware's sizes.

    pip install bpy==4.5.4
    python3 tools/deck/sikker.py          -> src/data/deck-safety.b64, renders tools/deck/out/sikker_*.png
    python3 tools/deck/sikker.py fast     -> without the renders
    python3 tools/deck/sikker.py boye     -> only the named renders (radome radar boye lys strips flate tak)

Frames. Here in Blender: x to the right, y forward, z up. The game's: x right, y up, z aft; to_game(p) = (x, z, -y), so Blender
+y (forward) is the game's -z and Blender -y is the game's +z (the ring buoy's front, out from a wall)."""
import os, sys, math, base64
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))
sys.path.insert(0, os.path.join(ROOT, 'tools', 'boats'))
import bpy, bmesh
from mathutils import Vector, Matrix
from bpyutil import *

OUT = os.path.join(HERE, 'out')
def to_game(p): return (p[0], p[2], -p[1])
def to_game_n(n): return (n[0], n[2], -n[1])
def G(p): return [round(v, 4) for v in to_game(p)]

C = {}
def colours():
    C['white'] = mat('white', (0.93, 0.93, 0.92), 0.75)          # the radar plastics
    C['cap'] = mat('cap', (0.58, 0.60, 0.62), 0.55)              # the array's end caps
    C['grey'] = mat('grey', (0.50, 0.52, 0.54), 0.45)
    C['dgrey'] = mat('dgrey', (0.20, 0.21, 0.22), 0.4)
    C['seam'] = mat('seam', (0.28, 0.29, 0.30), 0.3)
    C['black'] = mat('black', (0.04, 0.04, 0.045), 0.35)
    C['orange'] = mat('orange', (0.95, 0.38, 0.05), 0.45)
    C['tape'] = mat('tape', (0.86, 0.87, 0.88), 0.85, metal=0.3)
    C['rope'] = mat('rope', (0.93, 0.93, 0.90), 0.15)
    C['red'] = mat('red', (0.80, 0.09, 0.07), 0.5)
    C['bwhite'] = mat('bwhite', (0.95, 0.95, 0.93), 0.5)
    C['stain'] = mat('stain', (0.78, 0.80, 0.82), 0.75, metal=0.85)
    C['mob'] = mat('mob', (0.98, 0.64, 0.06), 0.55)
    C['lens'] = mat('lens', (0.84, 0.90, 0.93), 0.95)
    C['line'] = mat('line', (0.96, 0.82, 0.12), 0.25)
    C['line2'] = mat('line2', (0.88, 0.72, 0.09), 0.2)
    C['grp'] = mat('grp', (0.90, 0.90, 0.88), 0.6)
    C['label'] = mat('label', (0.98, 0.98, 0.97), 0.3)
    C['web'] = mat('web', (0.86, 0.86, 0.83), 0.2)
    C['stitch'] = mat('stitch', (0.45, 0.45, 0.44), 0.2)
    C['hru'] = mat('hru', (0.82, 0.83, 0.82), 0.45)
    C['wlink'] = mat('wlink', (0.86, 0.08, 0.06), 0.5)
    C['pr'] = mat('pr', (0.74, 0.07, 0.05), 0.3)
    C['pk'] = mat('pk', (0.06, 0.06, 0.06), 0.3)
    C['rubber'] = mat('rubber', (0.05, 0.05, 0.05), 0.15)

# ---------- builders on an Acc (one mesh, a material per face) ----------
def revolve(A, prof, c=(0, 0, 0), ax=(0, 0, 1), seg=32, a0=0.0, ref=None):
    """a body of revolution: prof [(r, h, m)] from one end to the other, h along ax, m the material of the band from the point to the
    next; the solid lies to the left of the profile's direction (so the faces turn outwards); r == 0 closes the end in a fan"""
    c = V(c); ax = V(ax).normalized()
    if ref is None: s, u, _ = frame_of(ax)
    else: s = V(ref) - ax * V(ref).dot(ax); s.normalize(); u = ax.cross(s)
    dirs = [s * math.cos(a0 + 2 * math.pi * k / seg) + u * math.sin(a0 + 2 * math.pi * k / seg) for k in range(seg)]
    rings = [A.v(c + ax * h) if r <= 1e-9 else [A.v(c + ax * h + d * r) for d in dirs] for r, h, m in prof]
    for i in range(len(prof) - 1):
        r0, h0, m = prof[i]; r1, h1, _ = prof[i + 1]; nr, nh = h1 - h0, -(r1 - r0)
        if abs(nr) + abs(nh) < 1e-9: continue
        a, b = rings[i], rings[i + 1]
        for k in range(seg):
            k1 = (k + 1) % seg; out = (dirs[k] + dirs[k1]).normalized() * nr + ax * nh
            if isinstance(a, list) and isinstance(b, list): q = [a[k], a[k1], b[k1], b[k]]
            elif isinstance(b, list): q = [a, b[k1], b[k]]
            elif isinstance(a, list): q = [a[k], a[k1], b]
            else: continue
            A.f(q, m, out)
    return rings, dirs

def frames(pts, closed=False):
    """points, tangents and a parallel-transported normal along a path (a closed path's twist spread along it)"""
    P = [V(p) for p in pts]; n = len(P); T = []
    for i in range(n):
        if closed: a = P[(i - 1) % n]; b = P[(i + 1) % n]
        else: a = P[max(0, i - 1)]; b = P[min(n - 1, i + 1)]
        T.append((b - a).normalized())
    ref = V((0, 0, 1)) if abs(T[0].z) < 0.9 else V((1, 0, 0))
    N = [(ref - T[0] * ref.dot(T[0])).normalized()]
    for i in range(1, n):
        v = N[-1] - T[i] * N[-1].dot(T[i]); N.append(v.normalized() if v.length > 1e-9 else N[-1])
    if closed:
        v = N[-1] - T[0] * N[-1].dot(T[0]); v.normalize(); ang = math.atan2(T[0].dot(v.cross(N[0])), v.dot(N[0]))
        N = [Matrix.Rotation(ang * i / n, 3, T[i]) @ N[i] for i in range(n)]
    return P, T, N, [T[i].cross(N[i]) for i in range(n)]

def atube(A, pts, r, mf, seg=6, closed=False, caps=True, mfk=None):
    """a round tube along a path; r a number or r(i); mf(i) the material of the stretch from point i, or mfk(i, k) face by face"""
    P, T, N, B = frames(pts, closed); n = len(P); rr = r if callable(r) else (lambda i: r)
    R = [[A.v(P[i] + (N[i] * math.cos(2 * math.pi * k / seg) + B[i] * math.sin(2 * math.pi * k / seg)) * rr(i)) for k in range(seg)] for i in range(n)]
    for i in range(n if closed else n - 1):
        j = (i + 1) % n
        for k in range(seg):
            k1 = (k + 1) % seg; A.f([R[i][k], R[i][k1], R[j][k1], R[j][k]], mfk(i, k) if mfk else mf(i), (R[i][k].co + R[j][k1].co) / 2 - (P[i] + P[j]) / 2)
    if caps and not closed:
        cm = (lambda i: mfk(i, 0)) if mfk else mf
        A.f(list(R[0]), cm(0), -T[0]); A.f(list(R[-1]), cm(n - 2), T[-1])
    return R

def aribbon(A, pts, side, w, t, mf, caps=True):
    """a flat band (webbing) along a path, w wide along side, t thick"""
    P, T, _, _ = frames(pts); side = V(side).normalized(); n = len(P); R = []
    for i in range(n):
        nn = T[i].cross(side).normalized()
        R.append([A.v(P[i] + side * sx * w / 2 + nn * sy * t / 2) for sx, sy in ((-1, -1), (1, -1), (1, 1), (-1, 1))])
    for i in range(n - 1):
        c = (P[i] + P[i + 1]) / 2
        for k in range(4):
            k1 = (k + 1) % 4; A.f([R[i][k], R[i][k1], R[i + 1][k1], R[i + 1][k]], mf(i), (R[i][k].co + R[i + 1][k1].co) / 2 - c)
    if caps: A.f(list(R[0]), mf(0), -T[0]); A.f(list(R[-1]), mf(n - 2), T[-1])

def acyl(A, p0, p1, r, m, seg=12, caps=(True, True), r1=None):
    """a cylinder (or a cone with r1) from p0 to p1, both ends capped by default"""
    p0 = V(p0); p1 = V(p1); s, u, d = frame_of(p1 - p0); r1 = r if r1 is None else r1
    a = [A.v(p0 + (s * math.cos(2 * math.pi * k / seg) + u * math.sin(2 * math.pi * k / seg)) * r) for k in range(seg)]
    b = [A.v(p1 + (s * math.cos(2 * math.pi * k / seg) + u * math.sin(2 * math.pi * k / seg)) * r1) for k in range(seg)]
    for k in range(seg):
        k1 = (k + 1) % seg; A.f([a[k], a[k1], b[k1], b[k]], m, (a[k].co + b[k1].co) / 2 - (p0 + p1) / 2)
    if caps[0]: A.f(a, m, -d)
    if caps[1]: A.f(b, m, d)

def atorus2(A, c, ax, R, r, m, seg=16, rseg=6, a0=0.0, a1=2 * math.pi, ref=None):
    """a ring (or an arc of one, open ends capped) about ax, its start angle measured from ref"""
    c = V(c); ax = V(ax).normalized()
    if ref is None: s, u, _ = frame_of(ax)
    else: s = V(ref) - ax * V(ref).dot(ax); s.normalize(); u = ax.cross(s)
    full = abs(a1 - a0 - 2 * math.pi) < 1e-6
    pts = [c + (s * math.cos(a0 + (a1 - a0) * i / seg) + u * math.sin(a0 + (a1 - a0) * i / seg)) * R for i in range(seg if full else seg + 1)]
    atube(A, pts, r, lambda i: m, rseg, closed=full, caps=not full)

def rr_ring(w, d, cr, n=4):
    """a rounded rectangle w (x) by d (y), centred, counter-clockwise from +x"""
    return rrect(0.0, 0.0, w, d, cr, n)

def loft_rr(A, rings, top=True, bottom=True):
    """a body lofted through rounded rectangles [(w, d, cr, z, m[, cy])] from the bottom up; m the band's material above the ring,
    cy the ring's centre along y"""
    rings = [tuple(r) + (0.0,) * (6 - len(r)) for r in rings]
    R = [[A.v((x, y + cy, z)) for x, y in rr_ring(w, d, cr)] for w, d, cr, z, m, cy in rings]; n = len(R[0])
    for i in range(len(rings) - 1):
        w0, d0, _, z0, m, c0 = rings[i]; w1, d1, _, z1, _, c1 = rings[i + 1]; nr, nh = z1 - z0, -((w1 + d1) - (w0 + d0)) / 4
        for k in range(n):
            k1 = (k + 1) % n; c = (R[i][k].co + R[i][k1].co) / 2; rad = V((c.x, c.y - (c0 + c1) / 2, 0)).normalized()
            A.f([R[i][k], R[i][k1], R[i + 1][k1], R[i + 1][k]], m, rad * nr + V((0, 0, nh)))
    if bottom: A.f(list(R[0]), rings[0][4], (0, 0, -1))
    if top: A.f(list(R[-1]), rings[-2][4], (0, 0, 1))
    return R

def hexnut(A, p, d, r, h, m):
    acyl(A, p, V(p) + V(d).normalized() * h, r, m, seg=6, caps=(False, True))

def domebolt(A, p, d, r, m):
    """a round bolt head on a surface at p facing d"""
    d = V(d).normalized(); p = V(p)
    revolve(A, [(r, 0.0, m), (r, r * 0.25, m), (r * 0.75, r * 0.55, m), (0.0, r * 0.65, m)], p, d, seg=8)

def size(o):
    P = [to_game(o.matrix_world @ v.co) for v in o.data.vertices]
    lo = [min(p[k] for p in P) for k in range(3)]; hi = [max(p[k] for p in P) for k in range(3)]
    return lo, hi

# ---------- the radome ----------
def radome():
    A = Acc('radome'); W, D, S = C['white'], C['dgrey'], C['seam']
    prof = [(0.000, 0.000, D), (0.258, 0.000, D), (0.265, 0.005, D), (0.265, 0.030, D),
            (0.270, 0.034, W), (0.299, 0.034, W), (0.305, 0.040, W),            # the cover's lip, over the base
            (0.305, 0.051, S), (0.3015, 0.054, S), (0.3015, 0.058, W),          # the seam groove round the lower part
            (0.304, 0.061, W), (0.302, 0.125, W),                               # the skirt (a little draft)
            (0.298, 0.150, W), (0.289, 0.172, W), (0.275, 0.191, W), (0.254, 0.207, W), (0.225, 0.220, W),
            (0.185, 0.229, W), (0.135, 0.235, W), (0.080, 0.2385, W), (0.030, 0.2398, W), (0.000, 0.240, W)]
    revolve(A, prof, seg=44, a0=math.pi / 44)
    # four bolt-down feet out of the base ring, under the cover's lip
    for k in range(4):
        a = math.pi / 4 + k * math.pi / 2; e = V((math.cos(a), math.sin(a), 0)); s = V((-e.y, e.x, 0))
        obox(A, e * 0.2735 + V((0, 0, 0.006)), e * 0.0165, s * 0.019, V((0, 0, 0.006)), D)
        domebolt(A, e * 0.279 + V((0, 0, 0.012)), (0, 0, 1), 0.0075, C['stain'])
    # the cable gland at the back (Blender -y) and the cable down to the mount
    acyl(A, (0, -0.262, 0.017), (0, -0.290, 0.017), 0.011, D, seg=10)
    hexnut(A, (0, -0.274, 0.017), (0, -1, 0), 0.0145, 0.008, D)
    atube(A, [(0, -0.288, 0.017), (0, -0.306, 0.016), (0, -0.320, 0.011), (0, -0.327, 0.002), (0, -0.329, -0.004)], 0.0055, lambda i: C['black'], 8)
    return A.done(38)

# ---------- the open array: pedestal and bars ----------
PED_H = 0.38; PED_HY = -0.022        # the hub's top and its place along y (a little aft of the middle; the front slopes back)
def radar_ped():
    A = Acc('radar_ped'); W, Gr, S, D = C['white'], C['grey'], C['seam'], C['dgrey']
    loft_rr(A, [(0.360, 0.420, 0.060, 0.000, Gr), (0.360, 0.420, 0.060, 0.010, Gr), (0.346, 0.406, 0.055, 0.014, Gr),
                (0.344, 0.404, 0.055, 0.098, S), (0.338, 0.398, 0.052, 0.102, W), (0.352, 0.412, 0.060, 0.106, W),
                (0.352, 0.412, 0.060, 0.116, W), (0.338, 0.374, 0.068, 0.240, W, -0.017), (0.328, 0.346, 0.070, 0.284, W, -0.031),
                (0.312, 0.322, 0.070, 0.308, W, -0.040), (0.290, 0.298, 0.070, 0.323, W, -0.046), (0.256, 0.264, 0.070, 0.333, W, -0.049),
                (0.206, 0.214, 0.070, 0.338, W, -0.050)])
    # the hub: a dark base ring, the lighter turntable, the mounting face the bar's neck sits on
    revolve(A, [(0.000, 0.330, D), (0.104, 0.330, D), (0.104, 0.344, D), (0.098, 0.348, Gr), (0.094, 0.366, Gr), (0.086, 0.370, Gr),
                (0.064, 0.371, D), (0.062, PED_H, D), (0.000, PED_H, D)], (0, PED_HY, 0), seg=32)
    # bolts on the flange's corners, a cable gland at the back, the cable down
    for sx in (-1, 1):
        for sy in (-1, 1): domebolt(A, (sx * 0.150, sy * 0.180, 0.010), (0, 0, 1), 0.008, C['stain'])
    acyl(A, (0, -0.200, 0.055), (0, -0.232, 0.055), 0.014, D, seg=10)
    hexnut(A, (0, -0.212, 0.055), (0, -1, 0), 0.018, 0.009, D)
    atube(A, [(0, -0.230, 0.055), (0, -0.250, 0.052), (0, -0.264, 0.040), (0, -0.270, 0.018), (0, -0.271, -0.004)], 0.007, lambda i: C['black'], 8)
    # a breather on the back of the housing
    acyl(A, (0.05, -0.200, 0.20), (0.05, -0.211, 0.20), 0.008, Gr, seg=8)
    return A.done(38)

BAR_SEC = [(0.0500, 0.102), (0.0496, 0.136), (0.0482, 0.153), (0.0448, 0.164), (0.0388, 0.170), (0.0300, 0.172), (0.0150, 0.171),
           (0.0000, 0.167), (-0.0150, 0.160), (-0.0300, 0.150), (-0.0420, 0.139), (-0.0490, 0.127), (-0.0520, 0.112), (-0.0520, 0.092),
           (-0.0490, 0.077), (-0.0420, 0.065), (-0.0300, 0.054), (-0.0150, 0.044), (0.0000, 0.037), (0.0150, 0.033), (0.0300, 0.032),
           (0.0388, 0.034), (0.0448, 0.040), (0.0482, 0.051), (0.0496, 0.068)]
def radar_bar(Lb, name):
    A = Acc(name); W, Cp, D = C['white'], C['cap'], C['dgrey']
    yc, zc = 0.0, 0.102; Re = 0.050; xe = Lb / 2 - Re
    stations = [(-xe - Re * math.sin(a), max(0.18, math.cos(a))) for a in [math.pi / 2 * k / 5 for k in range(5, 0, -1)]]
    stations += [(-xe, 1.0), (-xe + 0.02, 1.0), (xe - 0.02, 1.0), (xe, 1.0)]
    stations += [(xe + Re * math.sin(a), max(0.18, math.cos(a))) for a in [math.pi / 2 * k / 5 for k in range(1, 6)]]
    R = [[A.v((x, yc + (y - yc) * s, zc + (z - zc) * s)) for y, z in BAR_SEC] for x, s in stations]; n = len(BAR_SEC)
    for i in range(len(stations) - 1):
        xm = (stations[i][0] + stations[i + 1][0]) / 2; m = W if abs(xm) < xe - 0.02 else Cp
        for k in range(n):
            k1 = (k + 1) % n; c = (R[i][k].co + R[i][k1].co) / 2
            A.f([R[i][k], R[i][k1], R[i + 1][k1], R[i + 1][k]], m, V((0, c.y - yc, c.z - zc)))
    A.f(list(R[0]), Cp, (-1, 0, 0)); A.f(list(R[-1]), Cp, (1, 0, 0))
    # the neck on the hub and a fairing into the bar's underside
    revolve(A, [(0.000, 0.000, D), (0.050, 0.000, D), (0.050, 0.008, D), (0.044, 0.010, D), (0.044, 0.030, D), (0.000, 0.030, D)], seg=20)
    loft_rr(A, [(0.090, 0.060, 0.025, 0.026, W), (0.120, 0.066, 0.028, 0.034, W), (0.200, 0.074, 0.030, 0.064, W)], top=False)
    return A.done(40)

# ---------- the ring buoy ----------
B_RO, B_RI = 0.305, 0.200
B_RM = (B_RO + B_RI) / 2; B_A = (B_RO - B_RI) / 2; B_B = 0.045; B_N = 2.8
B_SEG = 64; B_SECN = 16
TAPE_AT = [math.radians(a) for a in (45, 135, 225, 315)]
STRIP_H = 0.065
def sec_uv(t):
    c, s = math.cos(t), math.sin(t)
    return (B_A * math.copysign(abs(c) ** (2 / B_N), c), B_B * math.copysign(abs(s) ** (2 / B_N), s))
def sec_n(t):
    u, v = sec_uv(t)
    gu = math.copysign(abs(u / B_A) ** (B_N - 1), u) / B_A; gv = math.copysign(abs(v / B_B) ** (B_N - 1), v) / B_B; l = math.hypot(gu, gv) or 1
    return (gu / l, gv / l)
def ring_pt(phi, u, v):
    """a point of the ring: phi round the ring in the x-z plane from +x towards +z, u out from the section's middle, v along +y (back)"""
    return V(((B_RM + u) * math.cos(phi), v, (B_RM + u) * math.sin(phi)))

def livboye(white=False):
    A = Acc('livboye_w' if white else 'livboye')
    ts = [2 * math.pi * k / B_SECN for k in range(B_SECN)]
    def body_m(phi):
        if not white: return C['orange']
        d = min(abs((phi - a + math.pi) % (2 * math.pi) - math.pi) for a in TAPE_AT)
        return C['red'] if d < math.radians(17) else C['bwhite']
    R = []
    for i in range(B_SEG):
        phi = 2 * math.pi * i / B_SEG; R.append([A.v(ring_pt(phi, *sec_uv(t))) for t in ts])
    for i in range(B_SEG):
        j = (i + 1) % B_SEG; pm = 2 * math.pi * (i + 0.5) / B_SEG; cm = ring_pt(pm, 0, 0)
        for k in range(B_SECN):
            k1 = (k + 1) % B_SECN; A.f([R[i][k], R[j][k], R[j][k1], R[i][k1]], body_m(pm), (R[i][k].co + R[j][k1].co) / 2 - cm)
    # the tape bands: wrapped round the ring, standing up over the grab line where it passes under them at the outer rim
    dl = 0.025 / B_RM
    def off(t): return 0.0012 + 0.0105 * max(0.0, math.cos(t)) ** 6
    for a in TAPE_AT:
        rings = []
        for ph in (a - dl, a + dl):
            rings.append(([A.v(ring_pt(ph, *[p + q * off(t) for p, q in zip(sec_uv(t), sec_n(t))])) for t in ts],
                          [A.v(ring_pt(ph, *[p - q * 0.0006 for p, q in zip(sec_uv(t), sec_n(t))])) for t in ts]))
        (o0, i0), (o1, i1) = rings; cm = ring_pt(a, 0, 0)
        for k in range(B_SECN):
            k1 = (k + 1) % B_SECN
            A.f([o0[k], o1[k], o1[k1], o0[k1]], C['tape'], (o0[k].co + o1[k1].co) / 2 - cm)
            A.f([i0[k], o0[k], o0[k1], i0[k1]], C['tape'], ring_pt(a - 1, 0, 0) - ring_pt(a, 0, 0))
            A.f([i1[k], o1[k], o1[k1], i1[k1]], C['tape'], ring_pt(a + 1, 0, 0) - ring_pt(a, 0, 0))
    # the grab line: one closed line round the outside, under the four bands, the loops between them slack
    Rl = B_RO + 0.0048; SAG = 0.07; pts = []
    for q in range(4):
        a0 = TAPE_AT[q]; a1 = a0 + math.pi / 2
        for k in range(18):
            t = k / 18; ph = a0 + (a1 - a0) * t
            held = min(t, 1 - t) < 0.06
            b = V((Rl * math.cos(ph), 0.0, Rl * math.sin(ph)))
            p = b if held else b + V((0, 0, -SAG * math.sin(math.pi * t) ** 1.2))
            r = math.hypot(p.x, p.z)
            if r < Rl:          # pressed onto the rim: it lies along it and rides a little towards the back
                p = V((p.x * Rl / r, min(0.016, 0.5 * (Rl - r)), p.z * Rl / r))
            pts.append(p)
    atube(A, pts, 0.0048, lambda i: C['rope'], 5, closed=True)
    return A.done(55)

def boye_strips():
    """the text strips on the front face (Blender -y, the game's +z): [bottom points, top points], left to right seen from the front"""
    y = -(B_B + 0.002); r0, r1 = B_RM - STRIP_H / 2, B_RM + STRIP_H / 2; N = 12
    top = [math.radians(155 - 130 * k / N) for k in range(N + 1)]
    bot = [math.radians(205 + 130 * k / N) for k in range(N + 1)]
    P = lambda r, a: V((r * math.cos(a), y, r * math.sin(a)))
    return ([[P(r0, a) for a in top], [P(r1, a) for a in top]], [[P(r1, a) for a in bot], [P(r0, a) for a in bot]])

def strip_crown_gap():
    """how far the strip's edges float over the face (the face falls away from its crown under the strip's edges)"""
    u = STRIP_H / 2; v = B_B * (1 - abs(u / B_A) ** B_N) ** (1 / B_N)
    return B_B + 0.002 - v

# ---------- the bracket, the light, the line ----------
BH_ARM = 0.300; BH_XA = 0.070; BH_ROD = 0.005; BH_Y = -0.050
BH_ZC = BH_ARM - math.sqrt((B_RI - BH_ROD) ** 2 - BH_XA ** 2)     # the ring hangs on the arms by the top of its hole
def boyeholder():
    A = Acc('boyeholder'); S = C['stain']
    t = 0.004
    # the back plate: 40 mm flat bar, rounded ends, two bolts
    pl = rrect(0.0, (BH_ARM + 0.03 - 0.025) / 2, 0.040, BH_ARM + 0.03 + 0.025, 0.018, 4)
    vb = [A.v((x, 0.0, z)) for x, z in pl]; vf = [A.v((x, -t, z)) for x, z in pl]; n = len(pl)
    A.f(vf, S, (0, -1, 0)); A.f(vb, S, (0, 1, 0))
    for k in range(n):
        k1 = (k + 1) % n; A.f([vb[k], vb[k1], vf[k1], vf[k]], S, V((pl[k][0], 0, pl[k][1] - 0.15)))
    for z in (0.0, BH_ARM - 0.045): domebolt(A, (0, -t, z), (0, -1, 0), 0.0085, S)
    # a block welded to the plate at the top, the two arms out of it, through the ring's hole, turned up at the tips with ball ends
    obox(A, (0, -t - 0.008, BH_ARM), (0.034, 0, 0), (0, 0.008, 0), (0, 0, 0.011), S)
    for sx in (-1, 1):
        x = sx * BH_XA
        pts = [(sx * 0.024, -t - 0.010, BH_ARM), (sx * 0.040, -0.022, BH_ARM), (sx * 0.060, -0.032, BH_ARM), (x, -0.044, BH_ARM), (x, -0.100, BH_ARM),
               (x, -0.112, BH_ARM + 0.004), (x, -0.119, BH_ARM + 0.014), (x, -0.121, BH_ARM + 0.028), (x, -0.121, BH_ARM + 0.036)]
        atube(A, pts, BH_ROD, lambda i: S, 10)
        revolve(A, [(0.0, -0.002, S), (0.006, 0.0, S), (0.0072, 0.004, S), (0.006, 0.008, S), (0.0, 0.0095, S)], (x, -0.121, BH_ARM + 0.036), (0, 0, 1), seg=10)
    return A.done(40)

def mob_profile(D, Y, L):
    """the light upright (base at 0, lens at the top 0.32)"""
    return [(0.000, 0.000, D), (0.030, 0.000, D), (0.034, 0.004, D), (0.034, 0.022, D), (0.035, 0.024, Y), (0.035, 0.027, Y), (0.035, 0.098, Y),
            (0.035, 0.100, Y), (0.0325, 0.1025, Y), (0.0325, 0.1075, Y), (0.035, 0.110, Y), (0.035, 0.112, Y), (0.035, 0.148, Y), (0.035, 0.150, Y),
            (0.0325, 0.1525, Y), (0.0325, 0.1575, Y), (0.035, 0.160, Y), (0.035, 0.162, Y), (0.035, 0.234, Y), (0.035, 0.236, Y), (0.039, 0.240, Y),
            (0.039, 0.257, Y), (0.036, 0.261, D), (0.031, 0.262, D), (0.031, 0.268, L), (0.029, 0.270, L), (0.029, 0.298, L), (0.0285, 0.303, L),
            (0.026, 0.310, L), (0.018, 0.316, L), (0.008, 0.319, L), (0.000, 0.320, L)]
ML_Y = -0.051
def boyelys():
    A = Acc('boyelys'); S = C['stain']; t = 0.004
    # the light upside down: its base up at z = 0.16, the lens down at -0.16
    prof = [(r, 0.16 - h, m) for r, h, m in mob_profile(C['dgrey'], C['mob'], C['lens'])]
    revolve(A, prof, (0, ML_Y, 0), (0, 0, 1), seg=20)
    # (the profile runs downwards now, so its faces turn inwards: flip them by the normals' check below)
    atorus2(A, (0, ML_Y, 0.168), (1, 0, 0), 0.008, 0.0022, C['dgrey'], seg=10, rseg=5)
    # the back plate and the two clips (the lower one under the float collar)
    pl = rrect(0.0, 0.0, 0.050, 0.250, 0.02, 4)
    vb = [A.v((x, 0.0, z)) for x, z in pl]; vf = [A.v((x, -t, z)) for x, z in pl]; n = len(pl)
    A.f(vf, S, (0, -1, 0)); A.f(vb, S, (0, 1, 0))
    for k in range(n):
        k1 = (k + 1) % n; A.f([vb[k], vb[k1], vf[k1], vf[k]], S, V((pl[k][0], 0, pl[k][1])))
    for z in (-0.095, 0.095): domebolt(A, (0, -t, z), (0, -1, 0), 0.007, S)
    for z, r in ((0.060, 0.0365), (-0.104, 0.0365)):
        obox(A, (0, -t - 0.006, z), (0.012, 0, 0), (0, 0.006, 0), (0, 0, 0.007), S)
        # a clip of 280 degrees open to the front (the light pulls out forward when the buoy goes)
        rr = r + 0.0015; a0 = math.radians(-50); a1 = math.radians(230); m = 14
        ring = lambda R_, zz: [V((R_ * math.cos(a0 + (a1 - a0) * i / m), ML_Y + R_ * math.sin(a0 + (a1 - a0) * i / m), zz)) for i in range(m + 1)]
        o0, o1, i0, i1 = [[A.v(p) for p in ring(R_, zz)] for R_, zz in ((rr + 0.002, z - 0.007), (rr + 0.002, z + 0.007), (rr, z - 0.007), (rr, z + 0.007))]
        for i in range(m):
            cm = V((0, ML_Y, z))
            A.f([o0[i], o0[i + 1], o1[i + 1], o1[i]], S, (o0[i].co + o1[i + 1].co) / 2 - cm)
            A.f([i0[i], i0[i + 1], i1[i + 1], i1[i]], S, cm - (i0[i].co + i1[i + 1].co) / 2)
            A.f([o1[i], o1[i + 1], i1[i + 1], i1[i]], S, (0, 0, 1)); A.f([o0[i], o0[i + 1], i0[i + 1], i0[i]], S, (0, 0, -1))
        for e in (0, m): A.f([o0[e], o1[e], i1[e], i0[e]], S, (o0[e].co - V((0, ML_Y, z))).cross(V((0, 0, 1))) * (-1 if e else 1))
        if z < 0:   # the lower clip has a floor under the collar: a ring the collar rests on
            zf = -0.103
            revolve(A, [(0.031, zf, S), (0.031, zf - 0.002, S), (rr + 0.002, zf - 0.002, S), (rr + 0.002, zf, S), (0.031, zf, S)], (0, ML_Y, 0), (0, 0, 1), seg=20)
    return A.done(40)

# the coil: hung on the hook by the top of its hole
CL_A, CL_B = 0.028, 0.024           # the bundle's half sizes (in the coil's plane, and across it)
CL_RM = 0.140 - CL_A                 # the bundle's middle
CL_Y = -0.034                        # the coil's plane, out from the wall
CL_Z = 0.024 - 1.05 * CL_RM        # the binding at the top rests on the hook
def coil_c(phi):
    s, c = math.sin(phi), math.cos(phi); pinch = 1 - 0.13 * max(0.0, s) ** 3
    return V((CL_RM * c * pinch, CL_Y, CL_Z + 1.05 * CL_RM * s))
def coil_e(phi):
    """the outward direction in the coil's plane at phi"""
    d = coil_c(phi + 1e-3) - coil_c(phi - 1e-3); e = V((d.z, 0, -d.x)).normalized()
    return e if e.dot(coil_c(phi) - V((0, CL_Y, CL_Z))) > 0 else -e
def squeeze(phi):
    d = abs((phi - math.pi / 2 + math.pi) % (2 * math.pi) - math.pi)
    return 1 - 0.22 * max(0.0, 1 - d / 0.30)
def boyeline():
    A = Acc('boyeline'); Y1, Y2 = C['line'], C['line2']; S = C['stain']
    # the bundle: its section a ring of ridges (one turn of line each, the grooves between them), a little uneven along the coil
    # as a coil laid by hand is, every other ridge a shade darker
    seg = 40; sn = 24; ts = [2 * math.pi * k / sn for k in range(sn)]
    def amp(k, ph): return (1.10 + 0.035 * math.sin(3 * ph + 1.7 * k)) if k % 2 == 0 else 0.90
    R = []
    for i in range(seg):
        ph = math.pi / 2 + 2 * math.pi * i / seg; c = coil_c(ph); e = coil_e(ph); q = squeeze(ph)
        R.append([A.v(c + e * (CL_A * q * math.cos(t) * amp(k, ph)) + V((0, CL_B * q * math.sin(t) * amp(k, ph), 0))) for k, t in enumerate(ts)])
    for i in range(seg):
        j = (i + 1) % seg; cm = (coil_c(math.pi / 2 + 2 * math.pi * i / seg) + coil_c(math.pi / 2 + 2 * math.pi * j / seg)) / 2
        for k in range(sn):
            k1 = (k + 1) % sn; rg = k if k % 2 == 0 else (k + 1) % sn      # the ridge this flank belongs to
            A.f([R[i][k], R[j][k], R[j][k1], R[i][k1]], Y1 if (rg // 2) % 2 else Y2, (R[i][k].co + R[j][k1].co) / 2 - cm)
    # one loose turn going once round the bundle's section over the whole coil
    pts = []
    for i in range(40):
        ph = math.pi / 2 + 2 * math.pi * i / 40; c = coil_c(ph); e = coil_e(ph); q = squeeze(ph); w = 0.6 + ph
        pts.append(c + e * ((CL_A * 1.12 * q + 0.004) * math.cos(w)) + V((0, (CL_B * 1.12 * q + 0.004) * math.sin(w), 0)))
    atube(A, pts, 0.004, lambda i: Y1, 5, closed=True)
    # the end bound four times round the top, and hanging down inside
    for k in range(4):
        ph = math.pi / 2 + (k - 1.5) * 0.055; c = coil_c(ph); e = coil_e(ph); q = squeeze(ph)
        tng = (coil_c(ph + 1e-3) - coil_c(ph - 1e-3)).normalized()
        atorus2(A, c, tng, CL_A * q * 1.0 + 0.004, 0.004, Y1, seg=14, rseg=5, ref=e)
    c0 = coil_c(math.pi / 2 - 0.12); e0 = coil_e(math.pi / 2 - 0.12)
    tail = [c0 - e0 * (CL_A * 0.8 + 0.004), c0 - e0 * (CL_A + 0.02) + V((0.004, -0.004, -0.02)), c0 - e0 * (CL_A + 0.03) + V((0.012, -0.006, -0.07)),
            c0 - e0 * (CL_A + 0.03) + V((0.016, -0.004, -0.11)), c0 - e0 * (CL_A + 0.03) + V((0.016, -0.003, -0.13))]
    atube(A, tail, 0.004, lambda i: Y2 if i == len(tail) - 2 else Y1, 5)
    # the hook: a small plate on the wall and a round bar out and up
    pl = rrect(0.0, 0.0, 0.026, 0.050, 0.010, 3)
    vb = [A.v((x, 0.0, z - 0.01)) for x, z in pl]; vf = [A.v((x, -0.003, z - 0.01)) for x, z in pl]; n = len(pl)
    A.f(vf, S, (0, -1, 0))
    for k in range(n):
        k1 = (k + 1) % n; A.f([vb[k], vb[k1], vf[k1], vf[k]], S, V((pl[k][0], 0, pl[k][1])))
    for z in (-0.026, 0.006): domebolt(A, (0, -0.003, z), (0, -1, 0), 0.005, S)
    atube(A, [(0, -0.003, -0.008), (0, -0.020, -0.010), (0, -0.040, -0.009), (0, -0.056, -0.006), (0, -0.064, 0.004), (0, -0.065, 0.018)], 0.0035, lambda i: S, 8)
    return A.done(50)

# ---------- the liferaft container ----------
FL = {4: (0.990, 0.490), 6: (1.155, 0.561), 12: (1.355, 0.650)}
FLANGE_H = 0.018; FL_P = 2.2
def fl_dims(n):
    L, D = FL[n]; R = D / 2; hd = 0.22 * D; xc = L / 2 - hd
    ribs = [xc - 0.07] if n != 12 else [xc - 0.07, 0.34]
    return L, D, R, hd, xc, ribs
def painter_out(n):
    """where the painter leaves the container's +x end: the grommet's point, its outward direction, and the cord's end below"""
    L, D, R, hd, xc, ribs = fl_dims(n); rr = 0.55 * R; th = math.radians(235)        # low on the end, towards -y (the game's +z)
    p_ = FL_P; x = xc + hd * (1 - (rr / R) ** p_) ** (1 / p_)
    p = V((x, rr * math.cos(th), R + rr * math.sin(th)))
    nx = (x - xc) ** (p_ - 1) / hd ** p_; nr = rr ** (p_ - 1) / R ** p_          # the end's normal (the superellipse's gradient)
    nrm = V((nx, nr * math.cos(th), nr * math.sin(th))).normalized()
    return p, nrm
def flate(n):
    A = Acc('flate%d' % n); W, S, Lb = C['grp'], C['seam'], C['label']
    L, D, R, hd, xc, ribs = fl_dims(n); p_ = FL_P
    def end(sg):   # the domed end from the cylinder's edge to the axis
        pts = []
        for k in range(8):
            th = math.pi / 2 * k / 7; c, s = math.cos(th), math.sin(th)
            pts.append((R * c ** (2 / p_) if k < 7 else 0.0, sg * (xc + hd * s ** (2 / p_))))
        return pts
    prof = [(r, x, W) for r, x in reversed(end(-1))]
    body = []
    for xr in sorted([-x for x in ribs] + ribs):
        body += [(R, xr - 0.028, W), (R + 0.009, xr - 0.016, W), (R + 0.009, xr + 0.016, W), (R, xr + 0.028, W)]
    flange = [(R, -0.040, W), (R + 0.014, -0.030, W), (R + FLANGE_H, -0.008, S), (R + 0.011, -0.003, S), (R + 0.011, 0.003, S),
              (R + FLANGE_H, 0.008, W), (R + 0.014, 0.030, W), (R, 0.040, W)]
    body = sorted(body + flange, key=lambda q: q[1])
    prof += body + [(r, x, W) for r, x in end(1)]
    # shift so the shell's bottom is at z = 0 (the axis at z = R)
    revolve(A, [(r, x, m) for r, x, m in prof], (0, 0, R), (1, 0, 0), seg=36, ref=(0, 0, -1))
    # the label patches: a lighter flat patch on each half, -y on the +x half and +y on the -x half
    for sg, xs in ((-1, 1), (1, -1)):
        lw = min(0.20 * D / 0.49, min(ribs) - 0.03 - 0.07)
        x0 = 0.07 if xs > 0 else -(0.07 + lw)
        x1 = x0 + lw; hh = 0.075 * D / 0.49 / R; rr = R + 0.0012
        grid = [[A.v((x, sg * rr * math.cos(a), R + rr * math.sin(a))) for a in [-hh + 2 * hh * j / 4 for j in range(5)]] for x in (x0, (x0 + x1) / 2, x1)]
        for i in range(2):
            for j in range(4):
                A.f([grid[i][j], grid[i + 1][j], grid[i + 1][j + 1], grid[i][j + 1]], Lb, V((0, sg, 0)))
    # the drain holes under the flange, one each side of it
    for xs in (-0.06, 0.06):
        acyl(A, (xs, 0, 0.0015), (xs, 0, -0.0005), 0.007, C['dgrey'], seg=8)
    # the painter's grommet low on the +x end, and the cord out of it, down to the container's bottom level
    p, nrm = painter_out(n)
    acyl(A, p - nrm * 0.004, p + nrm * 0.008, 0.012, C['dgrey'], seg=10)
    pts = [p + nrm * 0.006, p + nrm * 0.02 + V((0, 0, -0.008)), p + nrm * 0.03 + V((0, -0.004, -0.035)), V((p.x + 0.03, p.y - 0.006, 0.010)), V((p.x + 0.032, p.y - 0.008, 0.0))]
    atube(A, pts, 0.004, None, 6, mfk=lambda i, k: C['pk'] if (i + k) % 3 == 0 else C['pr'])
    return A.done(36), pts[-1]

# ---------- the cradle, the lashing and the release ----------
FL_H0 = 0.070       # the container's bottom over the deck
def tangent_pt(E, O, Rs, side):
    """the point where a line from E (y, z) touches the circle (O, Rs) on the given side (-1: -y, 1: +y), wrapping over the top"""
    dy, dz = E[0] - O[0], E[1] - O[1]; d = math.hypot(dy, dz); al = math.atan2(dz, dy); be = math.acos(Rs / d)
    P = [(O[0] + Rs * math.cos(a), O[1] + Rs * math.sin(a), a) for a in (al + be, al - be)]
    return min(P, key=lambda q: q[0]) if side < 0 else max(P, key=lambda q: q[0])

def vugge(n, stub):
    A = Acc('vugge%d' % n); S, Rb = C['stain'], C['rubber']
    L, D, R, hd, xc, ribs = fl_dims(n); zc = FL_H0 + R
    xs = 0.25 * L if n != 12 else (ribs[0] + ribs[1]) / 2           # the saddles clear of the ribs (between them on the 12)
    yr = 0.36 * D; XR = xs + 0.10; tb = 0.030; zb = 0.005
    # the base frame: two rails, the cross members under the saddles, foot plates at the ends with their bolts
    for sy in (-1, 1):
        abox(A, -XR, XR, sy * yr - tb / 2, sy * yr + tb / 2, zb, zb + tb, S)
        for sx in (-1, 1):
            abox(A, sx * XR - 0.040, sx * XR + 0.050, sy * yr - 0.035, sy * yr + 0.035, 0.0, zb, S)
            for by in (-1, 1): hexnut(A, (sx * (XR + 0.028), sy * yr + by * 0.020, zb), (0, 0, 1), 0.009, 0.006, S)
    for sx in (-1, 1): abox(A, sx * xs - tb / 2, sx * xs + tb / 2, -yr + tb / 2, yr - tb / 2, zb, zb + tb, S)
    # the saddles: 6 mm flat bar, 50 mm wide, round the container's bottom (+-55 degrees) on 10 mm rubber pads, on legs to the rails
    a0, a1 = math.radians(215), math.radians(325); ns = 14
    for sx in (-1, 1):
        x = sx * xs
        for (r0, r1, w, m, aa0, aa1) in ((R + 0.010, R + 0.016, 0.050, S, a0, a1), (R - 0.0005, R + 0.010, 0.040, Rb, a0 + 0.04, a1 - 0.04)):
            G4 = [[A.v((x + wx, rr * math.cos(aa0 + (aa1 - aa0) * i / ns), zc + rr * math.sin(aa0 + (aa1 - aa0) * i / ns))) for wx, rr in ((-w / 2, r0), (w / 2, r0), (w / 2, r1), (-w / 2, r1))] for i in range(ns + 1)]
            for i in range(ns):
                am = aa0 + (aa1 - aa0) * (i + 0.5) / ns; rad = V((0, math.cos(am), math.sin(am)))
                for k, out in enumerate((-rad, V((1, 0, 0)), rad, V((-1, 0, 0)))):     # the inner face, the +x side, the outer face, the -x side
                    k1 = (k + 1) % 4; A.f([G4[i][k], G4[i][k1], G4[i + 1][k1], G4[i + 1][k]], m, out)
            A.f(G4[0], m, G4[0][0].co - G4[1][0].co); A.f(G4[-1], m, G4[-1][0].co - G4[-2][0].co)
        for a in (a0, a1):
            top = V((x, (R + 0.013) * math.cos(a), zc + (R + 0.013) * math.sin(a))); bot = V((x, math.copysign(yr, math.cos(a)), zb + tb))
            beam(A, top, bot, 0.050, 0.006, S, up=V((1, 0, 0)).cross(bot - top).normalized())
        abox(A, x - 0.025, x + 0.025, -0.015, 0.015, zb + tb, zc - R - 0.016 + 0.002, S)
    # tabs out from the rails at the middle, with pad eyes for the lashing
    YE = R + 0.030
    for sy in (-1, 1):
        abox(A, -0.030, 0.030, sy * (yr - tb / 2) if sy > 0 else -YE - 0.02, YE + 0.02 if sy > 0 else -(yr - tb / 2), 0.0, 0.006, S)
        hexnut(A, (0.0, sy * (YE + 0.006), 0.006), (0, 0, 1), 0.008, 0.005, S)
        abox(A, -0.016, 0.016, sy * (YE - 0.026) - 0.003, sy * (YE - 0.026) + 0.003, 0.006, 0.030, S)
        atorus2(A, (0.0, sy * (YE - 0.026), 0.030), (0, 1, 0), 0.011, 0.0035, S, seg=12, rseg=5)
    # the lashing: from each pad eye's ring along the tangent to the container's middle (over the flange) and over the top
    O = (0.0, zc); Rs = R + FLANGE_H + 0.0016
    def chain(sy):
        E = V((0.0, sy * (YE - 0.026), 0.040))
        ty, tz, ang = tangent_pt((E.y, E.z), O, Rs, sy)
        T = V((0.0, ty, tz)); d = (T - E).normalized(); return E, T, d, ang
    Eh, Th, dh, ah = chain(-1); Es, Ts, ds, as_ = chain(1)
    X = V((1, 0, 0))
    # +y: a turnbuckle and a senhouse slip hook
    E, d = Es, ds; nn = d.cross(X).normalized()
    atorus2(A, E + d * 0.010, X, 0.009, 0.0028, S, seg=10, rseg=5)
    acyl(A, E + d * 0.018, E + d * 0.042, 0.004, S, seg=8)
    for q in (0.042, 0.098): hexnut(A, E + d * (q - 0.005), d, 0.009, 0.010, S)
    for so in (-1, 1): acyl(A, E + d * 0.045 + X * so * 0.0075, E + d * 0.095 + X * so * 0.0075, 0.003, S, seg=6)
    acyl(A, E + d * 0.103, E + d * 0.122, 0.004, S, seg=8)
    atorus2(A, E + d * 0.130, nn, 0.009, 0.0028, S, seg=10, rseg=5)
    # the slip hook: a shank, the tongue curled back along it, the ring that keeps it shut, the eye for the strap
    beam(A, E + d * 0.136, E + d * 0.196, 0.012, 0.007, S, up=nn)
    tongue = [E + d * 0.196 + nn * 0.000, E + d * 0.204 + nn * 0.008, E + d * 0.198 + nn * 0.016, E + d * 0.180 + nn * 0.016, E + d * 0.150 + nn * 0.010]
    atube(A, tongue, 0.0035, lambda i: S, 6)
    atorus2(A, E + d * 0.168 + nn * 0.006, d, 0.014, 0.0028, S, seg=12, rseg=5)
    atorus2(A, E + d * 0.142 + nn * -0.000, X, 0.007, 0.0025, S, seg=8, rseg=4)
    S_s = E + d * 0.215
    # -y: a shackle on the pad eye, the release unit, its rope sling round the strap's end; the weak link on the shackle too
    E, d = Eh, dh; nn = d.cross(X).normalized()
    if nn.y > 0: nn = -nn     # outwards, away from the container
    atorus2(A, E + d * 0.004, nn, 0.012, 0.003, S, seg=10, rseg=5, a0=-math.pi / 2, a1=math.pi / 2, ref=d)
    acyl(A, E + d * 0.004 + X * -0.016, E + d * 0.004 + X * 0.016, 0.0035, S, seg=6)
    for q in (-1, 1): acyl(A, E + d * 0.004 + X * q * 0.016, E + d * 0.004 + X * q * 0.019, 0.0055, S, seg=6)
    hc = E + d * 0.066                                     # the unit's middle: a disc 75 mm across, 30 mm thick, facing outwards
    revolve(A, [(0.000, -0.015, C['hru']), (0.034, -0.015, C['hru']), (0.0375, -0.011, C['hru']), (0.0375, 0.010, C['hru']), (0.034, 0.015, C['hru']),
                (0.024, 0.015, C['dgrey']), (0.022, 0.018, C['dgrey']), (0.010, 0.019, C['dgrey']), (0.009, 0.022, C['grey']), (0.000, 0.022, C['grey'])],
            hc, nn, seg=20)
    for q in (-1, 1): obox(A, hc + d * q * 0.039, X * 0.010, d * 0.006, nn * 0.010, C['hru'])
    sling = []
    for i in range(16):   # the white rope sling: a long loop from the unit's top through the strap's end
        a = 2 * math.pi * i / 16; sling.append(hc + d * (0.075 + 0.032 * math.cos(a)) + X * (0.010 * math.sin(a)))
    atube(A, sling, 0.0035, lambda i: C['rope'], 5, closed=True)
    wl = [E + d * 0.004 + X * 0.012, E + X * 0.030 + nn * 0.006 + V((0, 0, -0.012)), E + X * 0.046 + nn * 0.004 + V((0, 0, -0.022)),
          E + X * 0.034 + nn * 0.002 + V((0, 0, -0.026)), E + X * 0.016 + V((0, 0, -0.010))]
    atube(A, wl, 0.0032, lambda i: C['wlink'], 6, closed=True)
    S_h = E + d * 0.150
    # the strap: from the hook's eye to the tangent, over the top (on the flange), down to the sling
    arc = []; a_s, a_h = as_, ah
    if a_h < a_s: a_h += 2 * math.pi
    for i in range(29):
        a = a_s + (a_h - a_s) * i / 28; arc.append(V((0.0, O[0] + Rs * math.cos(a), O[1] + Rs * math.sin(a))))
    path = [S_s, S_s + (Ts - S_s) * 0.5] + arc + [Th + (S_h - Th) * 0.5, S_h]
    aribbon(A, path, X, 0.050, 0.0028, lambda i: C['web'])
    for P0, P1 in ((S_s, Ts), (S_h, Th)):         # the sewn ends: doubled webbing with a dark stitch
        dd = (P1 - P0).normalized(); no = dd.cross(X).normalized()
        if no.dot(V((0, P0.y, P0.z - zc))) < 0: no = -no
        aribbon(A, [P0 + no * 0.0028, P0 + dd * 0.05 + no * 0.0028], X, 0.050, 0.0026, lambda i: C['web'])
        for q in (0.012, 0.038): aribbon(A, [P0 + dd * q + no * 0.0043 + X * -0.022, P0 + dd * q + no * 0.0043 + X * 0.022], dd, 0.003, 0.0006, lambda i: C['stitch'], caps=False)
    # the painter: from the container's cord down to the deck, along outside the -y rail, up to the weak link
    pe = stub + V((0, 0, FL_H0))
    wk = E + X * 0.040 + V((0, 0, -0.024))
    ppts = [pe, V((pe.x + 0.03, pe.y - 0.01, 0.006)), V((pe.x - 0.05, -R - 0.004, 0.0045)), V((xs - 0.02, -R - 0.010, 0.0045)),
            V((0.16, -R - 0.012, 0.0045)), V((0.075, -R - 0.012, 0.0045)), V((wk.x + 0.012, wk.y + 0.004, wk.z - 0.010)), wk]
    # resample the painter so its red and black stretches are even
    fine = [ppts[0]]
    for a, b in zip(ppts, ppts[1:]):
        k = max(1, int((b - a).length / 0.02))
        for i in range(1, k + 1): fine.append(a + (b - a) * (i / k))
    atube(A, fine, 0.004, None, 6, mfk=lambda i, k: C['pk'] if (i + k) % 3 == 0 else C['pr'])     # red with a black tracer
    return A.done(36), V((0, 0, FL_H0)), {'hru': G(hc), 'hook': G(Es + ds * 0.17), 'strapTop': G(V((0, 0, zc + Rs)))}

# ---------- the export ----------
def main():
    os.makedirs(OUT, exist_ok=True)
    reset(); colours()
    objs = {}
    objs['radome'] = radome()
    objs['radar_ped'] = radar_ped()
    objs['radar_bar4'] = radar_bar(1.22, 'radar_bar4')
    objs['radar_bar6'] = radar_bar(1.83, 'radar_bar6')
    objs['livboye'] = livboye(False)
    objs['livboye_w'] = livboye(True)
    objs['boyeholder'] = boyeholder()
    objs['boyelys'] = boyelys()
    objs['boyeline'] = boyeline()
    flate_at = {}; hw = {}
    for n in (4, 6, 12):
        F, stub = flate(n); objs['flate%d' % n] = F
        Vg, fa, h = vugge(n, stub); objs['vugge%d' % n] = Vg; flate_at[str(n)] = G(fa); hw[str(n)] = h
    # the occlusion baked into the colours, each part alone (the cradle with its container over it)
    setup_render(64, 64, samples=8)
    def bake(o, others, samples, dist):
        for p in bpy.context.scene.objects:
            if p.type == 'MESH': p.hide_render = not (p is o or p in others)
        bake_ao(o, samples=samples, distance=dist)
    baked = {}
    for nm, o in objs.items():
        if nm.startswith('flate'): continue
        if nm.startswith('vugge'):
            F = objs['flate' + nm[5:]]; F.location = (0, 0, FL_H0); bpy.context.view_layer.update()
            bake(o, [F], 24, 0.10); bake(F, [o], 16, 0.08); baked[F.name] = True
            F.location = (0, 0, 0); bpy.context.view_layer.update()
        elif nm in ('livboye', 'livboye_w', 'boyeline', 'boyelys', 'boyeholder'): bake(o, [], 24, 0.04)
        else: bake(o, [], 16, 0.06)
        baked[nm] = True
    for p in bpy.context.scene.objects:
        if p.type == 'MESH': p.hide_render = False
    parts = [(nm, mesh_arrays(o, to_game, to_game_n, ao=nm in baked), 1.0) for nm, o in objs.items()]
    sz = {nm: size(o) for nm, o in objs.items()}
    r4 = lambda v: round(v, 4)
    st, sb = boye_strips()
    ex = {'frame': 'kystfiske safety kit: metres, x right, y up, z aft; radome, radar_ped and the cradles from the middle of their base (y = 0), '
                   'the bars from their mount, the ring buoys from their centre (facing +z), boyeholder, boyelys and boyeline from their fixing on the wall '
                   '(the wall in the x-y plane, they stand out towards +z), the liferaft containers from the bottom of the shell at the middle (lying along x)',
          'bar_at': G(V((0, PED_HY, PED_H))),
          'boye_strip_top': [[G(p) for p in st[0]], [G(p) for p in st[1]]],
          'boye_strip_bot': [[G(p) for p in sb[0]], [G(p) for p in sb[1]]],
          'boye_at': G(V((0, BH_Y, BH_ZC))),
          'flate_at': flate_at,
          'release': hw,
          'ring': {'ro': B_RO, 'ri': B_RI, 'thick': 2 * B_B},
          'size': {nm: [r4(hi[k] - lo[k]) for k in range(3)] for nm, (lo, hi) in sz.items()}}
    glb = os.path.join(OUT, 'deck-safety.glb'); nb = write_glb(glb, parts, ex)
    open(os.path.join(ROOT, 'src', 'data', 'deck-safety.b64'), 'w').write(base64.b64encode(open(glb, 'rb').read()).decode())
    print('deck safety GLB %.1f KB' % (nb / 1024))
    for nm, A, _ in parts:
        lo, hi = sz[nm]
        print('  %-11s %5d tris  x %.3f..%.3f  y %.3f..%.3f  z %.3f..%.3f' % (nm, len(A['idx']) // 3, lo[0], hi[0], lo[1], hi[1], lo[2], hi[2]))
    print('  bar_at %s  boye_at %s  flate_at %s' % (ex['bar_at'], ex['boye_at'], flate_at))
    print('  strips: top %s .. %s, bot %s .. %s; edges float %.1f mm over the face' % (ex['boye_strip_top'][0][0], ex['boye_strip_top'][0][-1], ex['boye_strip_bot'][0][0], ex['boye_strip_bot'][0][-1], strip_crown_gap() * 1000))
    if 'fast' in sys.argv: return
    renders(objs, flate_at)

# ---------- renders for checking ----------
def show(objs, *keep):
    for o in bpy.context.scene.objects:
        if o.type == 'MESH': o.hide_render = o not in keep
def dup(o, loc, rot=(0, 0, 0)):
    c = o.copy(); link(c); c.location = loc; c.rotation_euler = rot; return c
def slab(name, x0, x1, y0, y1, z0, z1, rgb, gloss=0.4):
    return box(name, x0, x1, y0, y1, z0, z1, mat(name, rgb, gloss))

def strip_text(st, text, name, rgb):
    """letters laid on a strip the way the game lays its canvas (texStrip): u along the rows, v from the bottom points to the top"""
    B, T = st; N = len(B) - 1
    Ls = sum((B[i + 1] - B[i]).length + (T[i + 1] - T[i]).length for i in range(N)) / 2; hs = sum((T[i] - B[i]).length for i in range(N + 1)) / (N + 1)
    cu = bpy.data.curves.new(name, 'FONT'); cu.body = text; cu.size = 1.0; to = bpy.data.objects.new(name, cu); link(to)
    bpy.context.view_layer.update(); dg = bpy.context.evaluated_depsgraph_get(); me = to.evaluated_get(dg).to_mesh()
    xs = [v.co.x for v in me.vertices]; ys = [v.co.y for v in me.vertices]; x0, x1, y0, y1 = min(xs), max(xs), min(ys), max(ys)
    hfrac = 0.72; wt = (x1 - x0) / (y1 - y0) * hfrac * hs / Ls; u0 = 0.5 - wt / 2
    def mapq(x, y):
        u = u0 + (x - x0) / (x1 - x0) * wt; v = 0.5 + ((y - y0) / (y1 - y0) - 0.5) * hfrac
        s = min(N - 1e-6, max(0.0, u * N)); i = int(s); f = s - i
        pb = B[i] + (B[i + 1] - B[i]) * f; pt = T[i] + (T[i + 1] - T[i]) * f
        return pb + (pt - pb) * v + V((0, -0.0008, 0))
    bm = bmesh.new(); vm = [bm.verts.new(mapq(v.co.x, v.co.y)) for v in me.vertices]
    for p in me.polygons:
        try: bm.faces.new([vm[i] for i in p.vertices])
        except ValueError: pass
    to.evaluated_get(dg).to_mesh_clear(); bpy.data.objects.remove(to, do_unlink=True)
    o = obj_from_bm(name + '_m', bm, [mat(name + 'c', rgb, 0.2)])
    # the strip itself as a checker, its first quad green (u = 0), so the run and the up of the rows show
    bm = bmesh.new(); ms = [mat('chk0', (0.98, 0.98, 0.98), 0.2), mat('chk1', (0.78, 0.80, 0.82), 0.2), mat('chkg', (0.10, 0.75, 0.20), 0.2), mat('chkt', (0.15, 0.35, 0.85), 0.2)]
    for i in range(N):
        for (va, vb_, mi) in ((0.0, 0.85, 2 if i == 0 else i % 2), (0.85, 1.0, 3)):   # a blue band along the top points
            q = [B[i] + (T[i] - B[i]) * va, B[i + 1] + (T[i + 1] - B[i + 1]) * va, B[i + 1] + (T[i + 1] - B[i + 1]) * vb_, B[i] + (T[i] - B[i]) * vb_]
            f = bm.faces.new([bm.verts.new(p) for p in q]); f.material_index = mi
    so = obj_from_bm(name + '_s', bm, ms)
    return [o, so]

def renders(objs, flate_at):
    sc = setup_render(1000, 700, samples=16)
    try: sc.cycles.use_denoising = True
    except Exception: pass
    only = [x for x in sys.argv[1:] if x != 'fast']
    want = lambda k: not only or k in only
    deck = slab('deck', -4, 4, -4, 4, -0.02, 0.0, (0.42, 0.43, 0.42))
    if want('radome'):
        R = objs['radome']; plate = slab('rplate', -0.40, 0.40, -0.40, 0.40, 0.0, 0.012, (0.70, 0.71, 0.70))
        R.location = (0, 0, 0.012)
        show(objs, R, deck, plate); camera((0.95, 1.25, 0.62), (0, 0, 0.12), lens=50); render(os.path.join(OUT, 'sikker_radome.png'))
        camera((0.55, -1.30, 0.40), (0, 0, 0.10), lens=50); render(os.path.join(OUT, 'sikker_radome_back.png'))
        R.location = (0, 0, 0)
    if want('radar'):
        Pd = objs['radar_ped']
        for nm, lens, loc in (('radar_bar4', 40, (1.5, 1.9, 1.0)), ('radar_bar6', 40, (2.0, 2.5, 1.2))):
            B = dup(objs[nm], (0, PED_HY, PED_H), (0, 0, math.radians(25)))
            show(objs, Pd, B, deck); camera(loc, (0, 0, 0.25), lens=lens); render(os.path.join(OUT, 'sikker_%s.png' % nm[6:]))
            if nm == 'radar_bar4':
                camera((0.55, -0.75, 0.55), (0, 0, 0.22), lens=45); render(os.path.join(OUT, 'sikker_ped.png'))
            bpy.data.objects.remove(B, do_unlink=True)
    if want('boye') or want('strips') or want('lys'):
        wall = slab('wall', -1.5, 1.5, 0.0, 0.05, -0.3, 2.5, (0.92, 0.92, 0.90), 0.3)
        Z0 = 1.15; Bh = dup(objs['boyeholder'], (0, 0, Z0)); bz = (0, BH_Y, Z0 + BH_ZC)
        Bl = dup(objs['boyelys'], (0.48, 0, Z0 + 0.10)); Ln = dup(objs['boyeline'], (-0.50, 0, Z0 + 0.25))
        if want('boye'):
            for nm, tag in (('livboye', ''), ('livboye_w', '_w')):
                Bo = dup(objs[nm], bz)
                show(objs, wall, deck, Bh, Bl, Ln, Bo)
                camera((0, -2.6, Z0 + 0.10), (0, 0, Z0 + 0.05), lens=40); render(os.path.join(OUT, 'sikker_boye%s_front.png' % tag))
                if not tag:
                    camera((1.45, -1.75, Z0 + 0.55), (0.0, 0, Z0 + 0.02), lens=40); render(os.path.join(OUT, 'sikker_boye_3q.png'))
                    camera((0.85, -0.55, Z0 + 0.75), (0, -0.05, Z0 + 0.30), lens=45); render(os.path.join(OUT, 'sikker_boye_top.png'))
                    show(objs, wall, deck, Bh); camera((0.75, -0.95, Z0 + 0.45), (0, -0.05, Z0 + 0.15), lens=45); render(os.path.join(OUT, 'sikker_boyeholder.png'))
                bpy.data.objects.remove(Bo, do_unlink=True)
        if want('lys'):
            show(objs, wall, deck, Ln); camera((-0.22, -0.62, Z0 + 0.38), (-0.50, -0.03, Z0 + 0.15), lens=50); render(os.path.join(OUT, 'sikker_line.png'))
            show(objs, wall, deck, Bl); camera((0.72, -0.52, Z0 + 0.26), (0.48, -0.05, Z0 + 0.10), lens=50); render(os.path.join(OUT, 'sikker_lys.png'))
        if want('strips'):
            Bo = dup(objs['livboye'], bz); st, sb = boye_strips(); off = V(bz)
            st = [[p + off for p in row] for row in st]; sb = [[p + off for p in row] for row in sb]
            tx = strip_text(st, 'SKARVHOLM', 'txt_top', (0.03, 0.03, 0.03)) + strip_text(sb, 'BERGEN', 'txt_bot', (0.03, 0.03, 0.03))
            show(objs, wall, deck, Bh, Bo, *tx); camera((0, -1.9, Z0 + BH_ZC), (0, 0, Z0 + BH_ZC), lens=50); render(os.path.join(OUT, 'sikker_strips.png'))
            camera((0.9, -1.4, Z0 + BH_ZC + 0.2), (0, 0, Z0 + BH_ZC), lens=50); render(os.path.join(OUT, 'sikker_strips_3q.png'))
            for o in tx: bpy.data.objects.remove(o, do_unlink=True)
            bpy.data.objects.remove(Bo, do_unlink=True)
        for o in (Bh, Bl, Ln, wall): bpy.data.objects.remove(o, do_unlink=True)
    if want('flate'):
        for n in (4, 6, 12):
            L, D = FL[n]; Vg = objs['vugge%d' % n]; F = dup(objs['flate%d' % n], (0, 0, FL_H0)); k = L / 0.99
            show(objs, deck, Vg, F)
            camera((1.05 * k, -1.65 * k, 1.05 * k), (0.05, 0, 0.26 * k), lens=40); render(os.path.join(OUT, 'sikker_flate%d.png' % n))
            if n == 4:
                camera((-0.70, 1.35, 0.85), (0, 0, 0.25), lens=40); render(os.path.join(OUT, 'sikker_flate4_b.png'))
                camera((0.42, -0.62, 0.30), (0.02, -0.25, 0.14), lens=45); render(os.path.join(OUT, 'sikker_hru.png'))
            bpy.data.objects.remove(F, do_unlink=True)
    if want('tak'):
        roofm = mat('roof', (0.55, 0.57, 0.58), 0.35)
        roof = box('roof', -1.3, 1.3, -1.1, 1.1, 1.90, 2.0, roofm); hull = box('house', -1.25, 1.25, -1.05, 1.05, 0.0, 1.90, mat('house', (0.80, 0.82, 0.83), 0.4))
        win = box('win', -1.0, 1.0, 1.04, 1.06, 1.25, 1.75, mat('win', (0.08, 0.12, 0.16), 0.9))
        Zr = 2.0
        Vg = dup(objs['vugge4'], (0.15, -0.55, Zr)); F = dup(objs['flate4'], (0.15, -0.55, Zr + FL_H0))
        mast = cyl('mast', (0.55, 0.45, Zr), (0.55, 0.45, Zr + 0.55), 0.045, mat('mastm', (0.78, 0.80, 0.82), 0.75, metal=0.85), seg=16)
        mplate = box('mplate', 0.55 - 0.22, 0.55 + 0.22, 0.45 - 0.24, 0.45 + 0.24, Zr + 0.55, Zr + 0.565, mat('mastm', (0.78, 0.80, 0.82), 0.75, metal=0.85))
        Pd = dup(objs['radar_ped'], (0.55, 0.45, Zr + 0.565)); B4 = dup(objs['radar_bar4'], (0.55, 0.45 + PED_HY, Zr + 0.565 + PED_H), (0, 0, math.radians(-20)))
        rpost = cyl('rpost', (-0.75, 0.55, Zr), (-0.75, 0.55, Zr + 0.30), 0.035, mat('mastm', (0.78, 0.80, 0.82), 0.75, metal=0.85), seg=14)
        rplate = box('rplate2', -0.75 - 0.20, -0.75 + 0.20, 0.55 - 0.20, 0.55 + 0.20, Zr + 0.30, Zr + 0.31, mat('mastm', (0.78, 0.80, 0.82), 0.75, metal=0.85))
        Rd = dup(objs['radome'], (-0.75, 0.55, Zr + 0.31))
        show(objs, deck, roof, hull, win, Vg, F, mast, mplate, Pd, B4, rpost, rplate, Rd)
        camera((3.2, -3.4, 3.6), (0.0, 0.0, 2.25), lens=38); render(os.path.join(OUT, 'sikker_tak.png'))
        camera((-2.6, 2.9, 3.1), (0.0, 0.0, 2.3), lens=38); render(os.path.join(OUT, 'sikker_tak_b.png'))

if __name__ == '__main__':
    main()
