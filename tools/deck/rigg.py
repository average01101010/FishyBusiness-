"""The deck rig, built in Blender (the user's wish 19.10.2026, from his photos of line tubs on deck and of gill net heaped in fish
tubs; the photos stay out of the repo, only what was read off them is here): the line tub with its coiled longline and the hooks hung
on its rim, the gill net as it lies in a fish tub after hauling, and the deck cargo (wooden crates and a EUR pallet).

    stamp     the line tub ("linestamp"): a black polyethylene bucket like the photos', 0.462 m across the rolled rim, 0.362 m across
              the foot and 0.380 m high, the wall 4.5 mm thick and the bottom 16 mm over the deck inside; a reinforcing band 7 cm
              under the rim, two moulded lugs with gussets for the bail, and a galvanised steel bail (5.5 mm wire) that lies
              down against the wall on the side away from the hooks. Open, so the inside shows. From the middle of its foot.
    line_r    the longline coiled in the tub, red-pink braided line: a ring of coil with a hole in the middle that fills the tub
              from y = 0.02 (over its bottom) to y = 0.32: a body for the deep coils, ten turns of 7 mm rope laid in loops on top
              of it (each turn resting on the ones under it), a loose loop sagging into the hole and one across the top, and the
              end of the line with a spliced eye, a swivel and a longline snap lying on the coil. Same origin as the stamp.
    line_g    the same coil in green, its turns flecked lighter and darker so it reads as a braided line with a tracer.
    kroker    the hooks hung on the rim: 30 bright steel J hooks (48 mm long, 2.2 mm wire) on 150 degrees of the rim, each with its
              bend over the rim, the shank and its eye inside, the point outside tucked under the rolled lip, and a dark snood from
              the eye down to the coil. Same origin as the stamp, so it sits on the rim when placed at the same point.
    garn      a heap of gill net in a fish tub after hauling: a lumpy, folded mound of green and blue monofilament (ridged noise
              for the folds, patches of colour, strands and draped meshes of lighter line over it), the float line (light green,
              with small white floats) mostly along one side and the lead line (dark) along the other, both diving in and out of
              the netting. Inside a 1.06 x 0.86 m opening (long axis along z), from y = 0.05 up to y = 1.0 in the middle and
              0.70 at the walls; it tapers 4 cm a side towards its base like a fish tub. From the middle of its base.
    kasse     a wooden freight crate 1.20 x 0.80 x 0.80 m (long axis z) of rough sawn spruce: vertical boards (19 mm, 6 mm gaps,
              mixed widths and shades), corner posts 70 mm square, three battens 22 x 95 mm round each side, a lid of boards
              along its length with three battens across it; dark inside, so the gaps read as gaps. From the middle of its base.
    pall      a EUR pallet (EPAL 1) 1200 x 800 x 144 mm: three bottom boards (100, 145, 100 x 22 mm), nine blocks 78 mm high
              (six 145 x 100, three 145 x 145), three stringer boards 145 x 22 x 800 and five top boards (145, 100, 145, 100,
              145 x 22 mm) along its length; pale wood, the blocks darker. From the middle of its base.
    kasse_s   a smaller crate 0.80 x 0.60 x 0.60 m in the same style (60 mm posts, 80 mm battens).

Where the measures come from: the tub's from the user's photos and the common 60-70 litre line tub; the hooks are the common autoline
size; the EUR pallet's from the EPAL standard (EN 13698-1); the crates' are the caller's. What I chose myself: the tub's profile
(foot ring, band, rim bead), the bail's height (27 cm over the lugs), the line's thickness (7 mm, a little over a haddock line's
so it reads at a distance), the hole in the coil (14 cm), the net's colours and the heap's shape, the crate's posts and battens.

The line and the tub: the game scales the line in y to show how much is left. The tub tapers, so the coil's outer wall is made to
stay inside the tub's wall at every y scale down to 0.45 (a scale of 0.47 puts the top at 0.15); when full it stands 1-2 cm off the
wall at its top. Below 0.45 the game can scale x and z too by the extras' line.xz table, which keeps it inside the wall to the bottom.

    pip install bpy==4.5.4
    python3 tools/deck/rigg.py          -> src/data/deck-rig.b64, renders tools/deck/out/rigg_*.png
    python3 tools/deck/rigg.py fast     -> without the renders

Frames. Here in Blender: x to the right, y forward, z up. The game's: x right, y up, z aft; to_game(p) = (x, z, -y)."""
import os, sys, math, base64, random
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))
sys.path.insert(0, os.path.join(ROOT, 'tools', 'boats'))
import bpy, bmesh
from mathutils import Vector, Matrix, noise
from bpyutil import *

OUT = os.path.join(HERE, 'out')
def to_game(p): return (p[0], p[2], -p[1])
def to_game_n(n): return (n[0], n[2], -n[1])

C = {}
def colours():
    C['pe'] = mat('pe', (0.06, 0.06, 0.065), 0.42)
    C['galv'] = mat('galv', (0.62, 0.64, 0.66), 0.45, metal=0.6)
    C['steel'] = mat('steel', (0.80, 0.82, 0.85), 0.85, metal=0.9)
    C['snood'] = mat('snood', (0.12, 0.11, 0.10), 0.25)
    C['red'] = mat('red', (0.70, 0.10, 0.18), 0.3)
    C['green'] = mat('green', (0.30, 0.62, 0.55), 0.3)
    C['net'] = mat('net', (0.5, 0.5, 0.5), 0.55)          # the colour is in the tint (green and blue patches)
    C['mono'] = mat('mono', (0.5, 0.5, 0.5), 0.8)
    C['float'] = mat('float', (0.78, 0.88, 0.72), 0.3)
    C['lead'] = mat('lead', (0.15, 0.15, 0.17), 0.3)
    C['floats'] = mat('floats', (0.93, 0.92, 0.84), 0.5)
    C['wood'] = mat('wood', (0.72, 0.58, 0.38), 0.08)
    C['pal'] = mat('pal', (0.80, 0.69, 0.50), 0.08)
    C['block'] = mat('block', (0.56, 0.44, 0.30), 0.06)
    C['dark'] = mat('dark', (0.10, 0.08, 0.06), 0.0)

def lerp(a, b, t): return a + (b - a) * t
def lerp3(a, b, t): return tuple(lerp(a[k], b[k], t) for k in range(3))
def mul3(a, k): return (a[0] * k, a[1] * k, a[2] * k)
def smooth(e0, e1, x):
    t = max(0.0, min(1.0, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t)
def nz(x, y, z=0.0): return noise.noise(V((x, y, z)))

# ---------- a mesh whose vertices and faces carry a tint (the TINT corner colour that mesh_arrays multiplies in) ----------
class TM:
    def __init__(s, name):
        s.name = name; s.bm = bmesh.new(); s.mats = []; s.ix = {}; s.vt = {}; s.ft = {}
    def mi(s, m):
        if m.name not in s.ix: s.ix[m.name] = len(s.mats); s.mats.append(m)
        return s.ix[m.name]
    def v(s, p, t=None):
        vv = s.bm.verts.new(V(p))
        if t is not None: s.vt[vv] = t
        return vv
    def f(s, vs, m, out=None, t=None):
        u = []
        for v in vs:
            if all(v is not w for w in u): u.append(v)
        if len(u) < 3: return None
        try: fc = s.bm.faces.new(u)
        except ValueError: return None
        fc.material_index = s.mi(m)
        if out is not None:
            fc.normal_update()
            if fc.normal.dot(V(out)) < 0: fc.normal_flip()
        if t is not None: s.ft[fc] = t
        return fc
    def done(s, angle=35):
        lay = s.bm.loops.layers.float_color.new('TINT')
        for fc in s.bm.faces:
            ft = s.ft.get(fc)
            for l in fc.loops:
                t = s.vt.get(l.vert, (1.0, 1.0, 1.0))
                if ft: t = (t[0] * ft[0], t[1] * ft[1], t[2] * ft[2])
                l[lay] = (t[0], t[1], t[2], 1.0)
        return shade(obj_from_bm(s.name, s.bm, s.mats), angle)

def lathe(M, prof, m, seg, disp=None, tint=None, closed=False):
    """a body of revolution about z: prof [(r, z)] with the solid on its left (outward normals); disp(i, a, r, z) -> (r, z) moves a
    vertex, tint(i, a, r, z) -> rgb; m a material or m(i) for the band from profile point i; closed joins the last point to the first"""
    R = []
    for i, (r, z) in enumerate(prof):
        if r < 1e-9:
            c = M.v((0, 0, z), tint(i, 0.0, 0.0, z) if tint else None); R.append([c] * seg); continue
        ring = []
        for j in range(seg):
            a = 2 * math.pi * j / seg; rr, zz = disp(i, a, r, z) if disp else (r, z)
            ring.append(M.v((rr * math.cos(a), rr * math.sin(a), zz), tint(i, a, rr, zz) if tint else None))
        R.append(ring)
    n = len(prof)
    for i in range(n if closed else n - 1):
        A = R[i]; B = R[(i + 1) % n]; mm = m(i) if callable(m) else m
        for j in range(seg):
            k = (j + 1) % seg; M.f([A[j], A[k], B[k], B[j]], mm)
    return R

def frames(P, up=None):
    """tangents, sides and normals along a polyline: about a fixed up (the cross-section stays level) or rotation-minimising"""
    n = len(P); T = [(P[min(i + 1, n - 1)] - P[max(i - 1, 0)]).normalized() for i in range(n)]
    S = []; U = []
    if up is not None:
        up = V(up)
        for t in T:
            s = t.cross(up)
            s = s.normalized() if s.length > 1e-6 else frame_of(t)[0]
            S.append(s); U.append(s.cross(t).normalized())
        return T, S, U
    s0, u0, _ = frame_of(T[0]); s = s0
    for i, t in enumerate(T):
        s = s - t * s.dot(t)
        if s.length < 1e-6: s = frame_of(t)[0]
        s.normalize(); S.append(s.copy()); U.append(s.cross(t).normalized())
    return T, S, U

def tube_tm(M, pts, r, m, sides=6, tint=None, caps=True, up=None, arc=None):
    """a tube along pts: r a radius or one per point, tint(i) -> rgb for ring i; arc = (a0, a1) builds only that part of the
    section (from the side towards up), an open trough for a rope lying on something"""
    P = [V(p) for p in pts]; n = len(P); T, S, U = frames(P, up)
    rr = r if isinstance(r, (list, tuple)) else [r] * n
    if arc: ang = [arc[0] + (arc[1] - arc[0]) * k / sides for k in range(sides + 1)]
    else: ang = [2 * math.pi * k / sides for k in range(sides)]
    rings = []
    for i in range(n):
        t = tint(i) if tint else None
        rings.append([M.v(P[i] + (S[i] * math.cos(a) + U[i] * math.sin(a)) * rr[i], t) for a in ang])
    nq = sides if not arc else sides
    for i in range(n - 1):
        for k in range(nq):
            k1 = (k + 1) % len(ang)
            if arc and k1 == 0: continue
            q = [rings[i][k], rings[i + 1][k], rings[i + 1][k1], rings[i][k1]]
            mid = (P[i] + P[i + 1]) / 2; c = sum((v.co for v in q), V()) / 4
            M.f(q, m, out=c - mid)
    if caps and not arc and rr[0] > 1e-5: M.f(list(rings[0]), m, out=-T[0])
    if caps and not arc and rr[-1] > 1e-5: M.f(list(rings[-1]), m, out=T[-1])
    return rings

def ring_tm(M, c, e1, e2, R, r, m, seg=10, rseg=4, tint=None):
    """a closed ring (an eye, a swivel's ring) in the plane of e1, e2"""
    c = V(c); e1 = V(e1).normalized(); e2 = V(e2).normalized(); d = e1.cross(e2)
    pts = [c + (e1 * math.cos(2 * math.pi * k / seg) + e2 * math.sin(2 * math.pi * k / seg)) * R for k in range(seg)]
    rings = []
    for k, p in enumerate(pts):
        o = (p - c).normalized()
        rings.append([M.v(p + (o * math.cos(2 * math.pi * q / rseg) + d * math.sin(2 * math.pi * q / rseg)) * r, tint) for q in range(rseg)])
    for k in range(seg):
        A = rings[k]; B = rings[(k + 1) % seg]
        for q in range(rseg):
            q1 = (q + 1) % rseg; M.f([A[q], B[q], B[q1], A[q1]], m, out=(A[q].co + B[q1].co) / 2 - (pts[k] + pts[(k + 1) % seg]) / 2)

def ellipsoid(M, c, ax, r, m, seg=8, rings=5, tint=None):
    """an ellipsoid round c: ax its long axis (unit), r = (along, across)"""
    c = V(c); t = V(ax).normalized(); s, u, _ = frame_of(t)
    vs = []
    top = M.v(c + t * r[0], tint); bot = M.v(c - t * r[0], tint)
    for i in range(1, rings):
        ph = math.pi * i / rings; rows = []
        for j in range(seg):
            a = 2 * math.pi * j / seg
            rows.append(M.v(c + t * (r[0] * math.cos(ph)) + (s * math.cos(a) + u * math.sin(a)) * (r[1] * math.sin(ph)), tint))
        vs.append(rows)
    for j in range(seg):
        k = (j + 1) % seg
        M.f([top, vs[0][j], vs[0][k]], m, out=(vs[0][j].co + vs[0][k].co) / 2 - c)
        M.f([bot, vs[-1][k], vs[-1][j]], m, out=(vs[-1][j].co + vs[-1][k].co) / 2 - c)
        for i in range(len(vs) - 1):
            M.f([vs[i][j], vs[i + 1][j], vs[i + 1][k], vs[i][k]], m, out=(vs[i][j].co + vs[i + 1][k].co) / 2 - c)

def cbox(M, c, h, m, ch=0.003, tint=(1.0, 1.0, 1.0), grain=None, endt=(0.80, 0.72, 0.64), e=None, vnoise=0.0, seed=0.0, skip=()):
    """a box with chamfered edges round c, half sizes h along the axes e (default x, y, z): tint for the whole box, varied by vnoise
    along it; the two faces across the grain axis take the end grain's tint endt"""
    c = V(c); E = [V(v).normalized() for v in (e or ((1, 0, 0), (0, 1, 0), (0, 0, 1)))]; cache = {}
    off = V((seed * 1.71, seed * 3.13, seed * 0.77))
    def tv(p):
        if not vnoise: return tint
        k = 1 + vnoise * nz(*(p * 4.0 + off))
        return mul3(tint, k)
    def get(ax, sg, so):
        key = (ax, sg) + tuple(sorted(so.items()))
        if key not in cache:
            p = c + E[ax] * (h[ax] * sg)
            for a2, s2 in so.items(): p = p + E[a2] * ((h[a2] - ch) * s2)
            cache[key] = M.v(p, tv(p))
        return cache[key]
    for ax in range(3):
        o1, o2 = (ax + 1) % 3, (ax + 2) % 3
        for sg in (-1, 1):
            if (ax, sg) in skip: continue
            vs = [get(ax, sg, {o1: a, o2: b}) for a, b in ((-1, -1), (1, -1), (1, 1), (-1, 1))]
            M.f(vs, m, out=E[ax] * sg, t=endt if grain == ax else None)
    for a, b in ((0, 1), (1, 2), (0, 2)):
        k = 3 - a - b
        for sa in (-1, 1):
            for sb in (-1, 1):
                M.f([get(a, sa, {b: sb, k: -1}), get(a, sa, {b: sb, k: 1}), get(b, sb, {a: sa, k: 1}), get(b, sb, {a: sa, k: -1})], m, out=E[a] * sa + E[b] * sb)
    for sx in (-1, 1):
        for sy in (-1, 1):
            for sz in (-1, 1):
                M.f([get(0, sx, {1: sy, 2: sz}), get(1, sy, {0: sx, 2: sz}), get(2, sz, {0: sx, 1: sy})], m, out=E[0] * sx + E[1] * sy + E[2] * sz)

def catmull(pts, n):
    """n points along a Catmull-Rom spline through pts"""
    P = [V(p) for p in pts]; P = [P[0] * 2 - P[1]] + P + [P[-1] * 2 - P[-2]]; out = []
    segs = len(P) - 3
    for k in range(n):
        u = k / (n - 1) * segs; i = min(int(u), segs - 1); t = u - i
        p0, p1, p2, p3 = P[i], P[i + 1], P[i + 2], P[i + 3]
        out.append(0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t * t * t))
    return out

# ======================================================================================================================
# the line tub
RO0, TAPER = 0.1815, 0.1082      # the outer wall: radius at z = 0.008 and its taper (dr/dz)
WALL = 0.0045
def r_out(z): return RO0 + TAPER * (z - 0.008)
def r_in(z): return r_out(z) - WALL
Z_RIM, R_RIM, Z_FLOOR = 0.380, 0.2312, 0.016
Z_LUG = 0.334                    # the bail's pivot (the lugs' holes)
LUG_OUT = 0.017                  # how far the lugs stand out of the wall

def stamp_profile():
    p = [(0.0, 0.006), (0.150, 0.006), (0.158, 0.0035), (0.163, 0.0), (0.176, 0.0), (0.1802, 0.003), (r_out(0.008), 0.008)]
    for z in (0.06, 0.15, 0.24, 0.293): p.append((r_out(z), z))
    p += [(r_out(0.297) + 0.0026, 0.298), (r_out(0.309) + 0.0026, 0.309), (r_out(0.313), 0.313), (r_out(0.345), 0.345)]
    # the rolled rim: out from the wall under it, round over its top, back in to the inner wall
    p += [(r_out(0.350) + 0.0005, 0.350), (0.2245, 0.3525), (0.2290, 0.3572), (0.2309, 0.3636), (R_RIM, 0.3700), (0.2293, 0.3762),
          (0.2252, 0.3796), (0.2203, Z_RIM), (0.2176, 0.3787), (r_in(0.373) + 0.0004, 0.3752), (r_in(0.366), 0.366)]
    for z in (0.30, 0.20, 0.10, 0.04): p.append((r_in(z), z))
    p += [(r_in(0.026) - 0.0015, 0.0215), (r_in(Z_FLOOR) - 0.007, Z_FLOOR), (0.0, Z_FLOOR)]
    return p
def r_outer_at(z):
    """the tub's outside radius at height z (the band and the rim included), for the bail's rest"""
    pr = stamp_profile(); best = 0.0
    for (r0, z0), (r1, z1) in zip(pr, pr[1:]):
        if min(z0, z1) <= z <= max(z0, z1) and abs(z1 - z0) > 1e-9:
            best = max(best, r0 + (r1 - r0) * (z - z0) / (z1 - z0))
    return best

def stamp():
    M = TM('stamp'); prof = stamp_profile()
    # the rim and the foot a little lighter where they are worn
    def tint(i, a, r, z):
        if z > 0.352 and r > 0.212: return (1.45, 1.45, 1.45)
        if z < 0.004: return (1.3, 1.3, 1.3)
        return None
    lathe(M, prof, C['pe'], 48, tint=tint)
    # the lugs: a moulded boss under the rim with a gusset under it, at +-y, a dark hole for the bail's end
    for sg in (-1, 1):
        er = V((0, sg, 0)); et = V((1, 0, 0)); ez = V((0, 0, 1)); r0 = r_out(Z_LUG)
        c = er * (r0 + LUG_OUT / 2 - 0.0015) + ez * (Z_LUG + 0.0005)
        cbox(M, c, (0.022, LUG_OUT / 2 + 0.0015, 0.0165), C['pe'], ch=0.004, e=(et, er, ez), tint=(1.15, 1.15, 1.15))
        g = [er * (r_out(0.316) - 0.0015) + ez * 0.316, er * (r0 + LUG_OUT - 0.002) + ez * 0.318, er * (r_out(0.312) + 0.0026) + ez * 0.312]
        a0 = [M.v(p + et * -0.004) for p in g]; a1 = [M.v(p + et * 0.004) for p in g]
        M.f(a0, C['pe'], out=-et); M.f(a1, C['pe'], out=et)
        for k in range(3):
            k1 = (k + 1) % 3; M.f([a0[k], a0[k1], a1[k1], a1[k]], C['pe'], out=((a0[k].co + a0[k1].co) / 2 - (g[0] + g[1] + g[2]) / 3))
        hc = er * (r0 + LUG_OUT + 0.0004) + ez * Z_LUG
        M.f([M.v(hc + (et * math.cos(2 * math.pi * k / 8) + ez * math.sin(2 * math.pi * k / 8)) * 0.0045) for k in range(8)], C['pe'], out=er, t=(0.3, 0.3, 0.3))
    # the bail: its ends in the lugs along the pivot (y), a tall arch between them, turned down about y until it rests on the wall
    U = r_out(Z_LUG) + LUG_OUT + 0.008; H = 0.27; WR = 0.00275
    # in the bail's own frame: w out from the pivot, u along it; the ends sit in the lugs, the arch is a half ellipse a little
    # flattened at the top (its legs leave the lugs steeply)
    loc = [(0.0, r_out(Z_LUG) + 0.004)]
    for k in range(25):
        ph = math.pi * k / 24; loc.append((H * math.sin(ph) ** 0.75, U * math.cos(ph)))
    loc.append((0.0, -(r_out(Z_LUG) + 0.004)))
    def place(th):
        return [V((-w * math.sin(th), u, Z_LUG + w * math.cos(th))) for w, u in loc]
    th_rest = math.radians(95)
    for d in range(95, 175):
        th = math.radians(d); clear = 1.0
        for w, u in loc:
            if w < 0.03: continue
            p = V((-w * math.sin(th), u, Z_LUG + w * math.cos(th))); rr = math.hypot(p.x, p.y)
            clear = min(clear, rr - r_outer_at(p.z) - WR)
        th_rest = th
        if clear < 0.0012: break
    tube_tm(M, place(th_rest), WR, C['galv'], sides=6)
    o = M.done(65); o['bail'] = math.degrees(th_rest)
    return o

# ---------- the coiled line ----------
L_Y0, L_Y1 = 0.02, 0.32
S_MIN = 0.45                     # the coil stays inside the tub's wall at y scales down to this
L_GAP = 0.003
def r_fit(z): return r_in(S_MIN * z) - L_GAP
RH = 0.055                       # the hole in the coil's middle, at its top
RR = 0.0040                      # the rope's radius (8 mm line)
NT, ST = 15, 28                  # turns of rope on top, steps per turn
R_T0, R_T1 = RH + RR + 0.004, 0.181   # the turns' radii run between these

def top_F(r, a):
    """the body's top (the coils under the top turns): a little higher between the hole and the wall, falling off at the wall
    and into the hole, lumpy"""
    d = (r - 0.12) / 0.06
    z = 0.2945 + 0.004 * max(0.0, 1 - d * d) + 0.0022 * nz(math.cos(a) * 3.1, math.sin(a) * 3.1, r * 9)
    if r > 0.168: z -= 40 * (r - 0.168) ** 2
    if r < RH + 0.014: z -= 60 * (RH + 0.014 - r) ** 2
    return z

class Coil:
    """the geometry of the coil (the same for both colours): the body's profile, the turns on top, the loose loops and the end"""
    def __init__(s, seed=7):
        rng = random.Random(seed); s.rng = rng
        # the turns: a continuous rope going round; each turn keeps near a radius of its own (laid from the wall inwards, the
        # order shuffled a little) and moves over to the next one's in its last part, crossing the turns between
        n = NT + 1; tg = [R_T1 - (R_T1 - R_T0) * i / (n - 1) for i in range(n)]
        order = sorted(range(n), key=lambda i: i + rng.uniform(-3.5, 3.5)); tg = [tg[i] + rng.uniform(-0.002, 0.002) for i in order]
        ph = [rng.uniform(0, 2 * math.pi) for _ in range(3 * n)]
        s.a0 = rng.uniform(0, 2 * math.pi); N = NT * ST + 1; P = []
        for k in range(N):
            t = k / ST; i = min(int(t), NT - 1); f = t - i; a = s.a0 + 2 * math.pi * t
            R = lerp(tg[i], tg[i + 1], smooth(0.5, 1.0, f)) + 0.0035 * math.sin(2 * a + ph[i]) + 0.002 * math.sin(3 * a + ph[n + i])
            R = max(R_T0, min(R_T1, R))
            cx = 0.004 * math.sin(2 * math.pi * t / 2.3 + ph[0]); cy = 0.004 * math.cos(2 * math.pi * t / 1.7 + ph[1])
            P.append([cx + R * math.cos(a), cy + R * math.sin(a), 0.0])
        # each point rests on the body or on the turns laid before it (later turns lie on top)
        for k in range(N):
            x, y, _ = P[k]; z = top_F(math.hypot(x, y), math.atan2(y, x)) + RR * 0.45
            if k < 6: z -= RR * (6 - k) / 6 * 1.4              # the first turn comes up out of the coil
            m = 1
            while k - m * ST + 2 >= 0:
                for d in (-2, -1, 0, 1, 2):
                    e = k - m * ST + d
                    if 0 <= e < k - 3:
                        dd = math.hypot(P[e][0] - x, P[e][1] - y)
                        if dd < 2 * RR * 0.98: z = max(z, P[e][2] + math.sqrt((2 * RR) ** 2 - dd * dd) * 0.9)
                m += 1
            P[k][2] = z
        for _ in range(3):   # smooth the steps where a turn climbs over another, never down into it
            Z = [p[2] for p in P]
            for k in range(1, N - 1): P[k][2] = max(Z[k], (Z[k - 1] + 2 * Z[k] + Z[k + 1]) / 4)
        s.turns = [V((p[0], p[1], p[2])) for p in P]
        # the loose loops: one hanging into the hole, one lying across the top
        b = s.a0 + 2.4
        s.loops = []
        for cps, sag in (([(0.150, b), (0.118, b + 0.35), (0.075, b + 0.62), (0.030, b + 1.05), (0.040, b + 1.65), (0.085, b + 1.95), (0.130, b + 2.10), (0.158, b + 2.18)], 0.045),
                         ([(0.176, b + 3.3), (0.152, b + 3.52), (0.118, b + 3.90), (0.104, b + 4.40), (0.128, b + 4.78), (0.162, b + 4.72)], 0.0)):
            pts = catmull([(r * math.cos(a), r * math.sin(a), 0) for r, a in cps], 36)
            s.loops.append(s.drape(pts, sag=sag, dive=True))
        # the end: off the last turn, across the top towards the hole, the spliced eye and the snap
        e0 = s.turns[-1]; ae = math.atan2(e0.y, e0.x); re = math.hypot(e0.x, e0.y)
        cps = [(e0.x, e0.y, 0)] + [((re - dr) * math.cos(ae + da), (re - dr) * math.sin(ae + da), 0) for dr, da in ((0.004, 0.10), (0.016, 0.24), (0.030, 0.38), (0.040, 0.52))]
        s.tail = s.drape(catmull(cps, 16), sag=0.0, dive=False, skip=12)
        s.tail[0] = e0.copy()
    def height(s, x, y, skip=0):
        """the top of everything at (x, y): the body or a turn of rope under it; None over the hole"""
        r = math.hypot(x, y)
        if r < RH + 0.003: return None
        z = top_F(r, math.atan2(y, x)) - RR * 0.3
        for p in (s.turns[:len(s.turns) - skip] if skip else s.turns):
            dd = math.hypot(p.x - x, p.y - y)
            if dd < 2 * RR: z = max(z, p.z + math.sqrt((2 * RR) ** 2 - dd * dd) * 0.92 - RR)
        return z
    def drape(s, pts, sag=0.03, dive=True, skip=0):
        """the points laid on the coil (a rope's centre RR over what is under it), hanging where they cross the hole; the ends
        dive into the coil when dive"""
        H = [s.height(p.x, p.y, skip) for p in pts]; n = len(pts); Z = [None] * n
        for k in range(n):
            if H[k] is not None: Z[k] = H[k] + RR * 0.95
        k = 0
        while k < n:
            if Z[k] is None:
                k1 = k
                while k1 < n and Z[k1] is None: k1 += 1
                za = Z[k - 1] if k > 0 else Z[k1]; zb = Z[k1] if k1 < n else za
                for q in range(k, k1):
                    u = (q - k + 1) / (k1 - k + 1); Z[q] = lerp(za, zb, u) - sag * math.sin(math.pi * u) ** 0.8
                k = k1
            k += 1
        for _ in range(4):
            Zs = Z[:]
            for q in range(1, n - 1):
                av = (Zs[q - 1] + 2 * Zs[q] + Zs[q + 1]) / 4
                Z[q] = max(Zs[q], av) if H[q] is not None else av        # resting points never sink, hanging ones smooth freely
                if H[q] is not None: Z[q] = max(Z[q], H[q] + RR * 0.95)
        if dive:
            for q, f in ((0, 1.6), (1, 0.9), (n - 1, 1.6), (n - 2, 0.9)): Z[q] -= RR * f
        return [V((p.x, p.y, Z[q])) for q, p in enumerate(pts)]
    def body_prof(s):
        p = [(RH - 0.006, L_Y0), (0.12, L_Y0), (r_fit(L_Y0), L_Y0)]
        for z in (0.08, 0.15, 0.22, 0.265): p.append((r_fit(z), z))
        s.wall1 = len(p)
        rt = [0.185, 0.178, 0.166, 0.150, 0.132, 0.114, 0.096, 0.080, 0.066, 0.058]
        s.top0 = len(p); p += [(r, 0.0) for r in rt]; s.top1 = len(p)
        # the hole's wall: the turns stacked in it, a ridge for each band
        for k, z in enumerate((0.262, 0.236, 0.210, 0.184, 0.158, 0.132, 0.106, 0.080, 0.054)):
            p.append((RH - 0.0045 * (0.27 - z) / 0.25 + (0.0016 if k % 2 else -0.0008), z))
        return p

def line(colour, fleck, name):
    """the coil in one colour: fleck = (dark, light) tints alternating along the rope and between the body's bands"""
    K = Coil(); M = TM(name); m = C[colour]; prof = K.body_prof()
    def disp(i, a, r, z):
        if K.top0 <= i < K.top1: return r + 0.0015 * nz(math.cos(a) * 4, math.sin(a) * 4, i), top_F(r, a)
        dr = 0.0018 * nz(math.cos(a) * 3.3, math.sin(a) * 3.3, z * 20 + i)
        if 1 <= i < K.wall1: dr = -abs(dr)                     # the outer wall: only inwards (the tub's wall is there)
        return r + dr, z
    def tint(i, a, r, z):
        k = 0.55 if K.top0 <= i < K.top1 else 0.66
        if i >= K.top1 or 3 <= i < K.top0: k *= (fleck[0] if i % 2 else fleck[1])     # the stacked turns on the walls
        return (k, k, k)
    lathe(M, prof, m, 32, disp=disp, tint=tint, closed=True)
    # the turns on top: a trough of rope (its underside lies in the coil), the braid flecked along it
    tt = lambda i: (lambda k: (k, k, k))(fleck[i % 2] * (1.0 + 0.05 * math.sin(i * 0.37)))
    tube_tm(M, K.turns, RR, m, sides=3, tint=tt, up=(0, 0, 1), arc=(math.radians(-25), math.radians(205)))
    for lp in K.loops:
        tube_tm(M, lp, RR, m, sides=5, tint=lambda i: (lambda k: (k, k, k))(fleck[i % 2] * 1.04))
    tube_tm(M, K.tail, [RR] * (len(K.tail) - 4) + [RR * 1.3, RR * 1.45, RR * 1.45, RR * 0.9], m, sides=6, tint=lambda i: (lambda k: (k, k, k))(fleck[i % 2]))
    # the snap at the end: a swivel and the spring clip lying on the coil
    e = K.tail[-1]; d = (K.tail[-1] - K.tail[-3]); d.z = 0; d.normalize(); sd = V((-d.y, d.x, 0)); up = V((0, 0, 1))
    sw0 = e + d * 0.004; sw1 = sw0 + d * 0.020
    tube_tm(M, [sw0, sw0 + d * 0.003, sw1 - d * 0.003, sw1], [0.0022, 0.0034, 0.0034, 0.0022], C['steel'], sides=6)
    ring_tm(M, sw1 + d * 0.0045, d, up, 0.0042, 0.0011, C['steel'], seg=8, rseg=4)
    clip = []
    L = 0.058; W = 0.0075; base = sw1 + d * 0.0085
    for k in range(17):
        u = k / 16 * 2 * math.pi
        x = (1 - math.cos(u)) / 2 * L; y = math.sin(u) * W * (0.55 + 0.45 * math.sin(min(math.pi, x / L * math.pi)))
        clip.append(base + d * x + sd * y + up * 0.0012 * math.sin(u * 0.5))
    tube_tm(M, clip, 0.0013, C['steel'], sides=4, caps=False)
    return M.done(70), K

def fit_xz():
    """the x-z scale for the coil at y scales under S_MIN, which keeps it inside the tub's wall to the bottom"""
    out = []
    for s in (0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.45):
        k = 1.0
        for i in range(30):
            z = L_Y0 + (0.293 - L_Y0) * i / 29
            k = min(k, (r_in(s * z) - L_GAP) / r_fit(z))
        out.append([s, round(k, 4)])
    return out

# ---------- the hooks on the rim ----------
N_HOOK = 30; HOOK_A = 75.0       # hooks on +-75 deg about +x
R_HOOK = (r_in(0.373) + R_RIM) / 2
def kroker(K):
    M = TM('kroker'); rng = random.Random(11); wr = 0.0011
    Rc = (R_RIM - r_in(0.373)) / 2 + 0.0024 + wr              # the bend's centre line: clears the rim by 2 mm a side
    zc = Z_RIM - Rc + wr                                      # its inside rests on the rim's top
    for h in range(N_HOOK):
        a = math.radians(-HOOK_A + 2 * HOOK_A * h / (N_HOOK - 1) + rng.uniform(-1.0, 1.0))
        er = V((math.cos(a), math.sin(a), 0)); et = V((-math.sin(a), math.cos(a), 0)); ez = V((0, 0, 1))
        yaw = math.radians(rng.uniform(-7, 7)); roll = math.radians(rng.uniform(-6, 6))
        Lsh = 0.034 + rng.uniform(-0.002, 0.002); lean = math.radians(8)
        loc = [(-Rc - Lsh * math.sin(lean), -Lsh * math.cos(lean)), (-Rc - Lsh * 0.5 * math.sin(lean), -Lsh * 0.5 * math.cos(lean))]
        for k in range(7):
            ph = math.pi * (1 - k / 6); loc.append((Rc * math.cos(ph), Rc * math.sin(ph)))
        loc += [(Rc + 0.0003, -0.008), (Rc - 0.0012, -0.0135), (Rc - 0.0042, -0.0172)]
        rad = [wr] * (len(loc) - 2) + [wr * 0.75, wr * 0.25]
        Rm = Matrix.Rotation(yaw, 3, 'Z') @ Matrix.Rotation(roll, 3, 'X')    # local: x radial, y tangential, z up
        def W(q, t=0.0):
            l = Rm @ V((q[0], t, q[1]))
            return er * (R_HOOK + l.x) + et * l.y + ez * (zc + l.z)
        tube_tm(M, [W(q) for q in loc], rad, C['steel'], sides=4)
        # the snood: a knot round the shank's end, then down the inside of the wall and in to the coil
        E = W(loc[0]); eo = er * -1
        ang = a + math.radians(rng.uniform(-6, 6)); rend = rng.uniform(0.160, 0.178)
        end = V((rend * math.cos(ang), rend * math.sin(ang), 0)); zh = K.height(end.x, end.y); end.z = (zh if zh is not None else 0.29) - 0.0015
        mid1 = E + eo * 0.006 - ez * 0.016 + et * ((end - E).dot(et) * 0.2)
        mid2 = V((lerp(mid1.x, end.x, 0.5), lerp(mid1.y, end.y, 0.5), lerp(mid1.z, end.z, 0.6) - 0.003))
        sn = catmull([E + ez * 0.0035, E - ez * 0.002, mid1, mid2, end], 8)
        tube_tm(M, sn, [0.0021, 0.0021] + [0.0011] * 6, C['snood'], sides=3)
    return M.done(130)

# ======================================================================================================================
# the gill net in its tub
GA, GB = 0.420, 0.520            # the heap's half width (x) and half length (y) where it meets the tub's walls
GA0, GB0 = 0.380, 0.480          # at its base (fish tubs taper)
G_Y0, G_TOP, G_EDGE = 0.05, 1.0, 0.70
G_P = 4.5                        # the squircle's power (the tub's rounded corners)
NET_G = (0.24, 0.50, 0.36); NET_B = (0.20, 0.36, 0.60)
def squircle(u, v, a, b):
    s = max(abs(u), abs(v))
    if s < 1e-9: return 0.0, 0.0
    lam = ((abs(u) / s) ** G_P + (abs(v) / s) ** G_P) ** (-1 / G_P)
    return a * lam * u, b * lam * v
def rho(x, y):
    return ((abs(x) / GA) ** G_P + (abs(y) / GB) ** G_P) ** (1 / G_P)
def ridge(x, y, z):
    return (1 - abs(nz(x, y, z))) ** 4
def heap_h(x, y):
    """the heap's top: a mound off the middle a little, lumps and the folds of the netting (ridged noise), calmer at the walls"""
    r = rho(x - 0.03 * (1 - rho(x, y)), y + 0.06 * (1 - rho(x, y)))
    dome = max(0.0, 1 - min(1.0, r) ** 2.3) ** 0.6
    lumps = 0.060 * nz(x * 2.4, y * 2.4, 3.1) + 0.030 * nz(x * 5.2, y * 5.2, 7.7)
    folds = 0.034 * ridge(x * 5.0 + 0.3 * nz(x * 2, y * 2, 1), y * 5.0, 11.3) + 0.016 * ridge(x * 11, y * 11, 5.5)
    return G_EDGE + (G_TOP - 0.06 - G_EDGE) * dome + (lumps + folds - 0.02) * (0.25 + 0.75 * dome)
def heap_n(x, y):
    e = 0.01; dx = (heap_h(x + e, y) - heap_h(x - e, y)) / (2 * e); dy = (heap_h(x, y + e) - heap_h(x, y - e)) / (2 * e)
    return V((-dx, -dy, 1)).normalized()
def net_col(x, y):
    b = smooth(-0.12, 0.12, nz(x * 2.0 + 4, y * 2.0, 2.2) + 0.15)
    c = lerp3(NET_G, NET_B, b)
    k = 1.0 + 0.10 * nz(x * 9, y * 9, 0.4)
    return mul3(c, k)

def garn():
    M = TM('garn'); NU, NV = 27, 33; G = []
    for i in range(NU):
        row = []
        for j in range(NV):
            u = -1 + 2 * i / (NU - 1); v = -1 + 2 * j / (NV - 1); x, y = squircle(u, v, GA, GB)
            edge = i in (0, NU - 1) or j in (0, NV - 1)
            z = G_EDGE + 0.012 * nz(x * 6, y * 6, 2) if edge else heap_h(x, y)
            col = net_col(x, y)
            # the crests of the folds catch the light (monofilament), the creases are darker (and the AO deepens them)
            f = ridge(x * 5.0 + 0.3 * nz(x * 2, y * 2, 1), y * 5.0, 11.3)
            k = 0.82 + 0.45 * f ** 1.5
            row.append(M.v((x, y, z), mul3(col, k / 0.5)))
        G.append(row)
    for i in range(NU - 1):
        for j in range(NV - 1):
            M.f([G[i][j], G[i + 1][j], G[i + 1][j + 1], G[i][j + 1]], C['net'], out=(0, 0, 1))
    # the sides down the tub's walls to the base, and the base
    ring = [G[i][0] for i in range(NU)] + [G[NU - 1][j] for j in range(1, NV)] + [G[i][NV - 1] for i in range(NU - 2, -1, -1)] + [G[0][j] for j in range(NV - 2, 0, -1)]
    low = []
    for v in ring:
        x, y = v.co.x, v.co.y; low.append(M.v((x * GA0 / GA, y * GB0 / GB, G_Y0), mul3(net_col(x, y), 0.6 / 0.5)))
    n = len(ring); cen = M.v((0, 0, G_Y0), (0.8, 0.8, 0.8))
    for k in range(n):
        k1 = (k + 1) % n; c = (ring[k].co + low[k1].co) / 2
        M.f([ring[k], ring[k1], low[k1], low[k]], C['net'], out=V((c.x, c.y, 0)))
        M.f([cen, low[k1], low[k]], C['net'], out=(0, 0, -1))
    rng = random.Random(5)
    # draped meshes of the netting: two families of lines crossing in diamonds, flat strips on the surface
    def strip(pts, w, tintf):
        vs = []
        for k, p in enumerate(pts):
            t = (pts[min(k + 1, len(pts) - 1)] - pts[max(k - 1, 0)]); nrm = heap_n(p.x, p.y); sd = nrm.cross(t).normalized()
            c = tintf(p); vs.append((M.v(p + sd * (w / 2), c), M.v(p - sd * (w / 2), c), nrm))
        for k in range(len(vs) - 1):
            M.f([vs[k][0], vs[k][1], vs[k + 1][1], vs[k + 1][0]], C['mono'], out=vs[k][2])
    def surf(x, y, lift=0.003): return V((x, y, heap_h(x, y) + lift))
    def light(p):
        c = net_col(p.x, p.y); return tuple(min(0.95, c[k] * 1.5 + 0.18) / 0.5 for k in range(3))
    for pc in range(5):
        while True:
            cx = rng.uniform(-0.28, 0.28); cy = rng.uniform(-0.36, 0.36)
            if rho(cx, cy) < 0.72: break
        ang = rng.uniform(0, math.pi); ea = V((math.cos(ang), math.sin(ang), 0)); eb = V((-math.sin(ang), math.cos(ang), 0))
        A, B = rng.uniform(0.13, 0.20), rng.uniform(0.08, 0.13); sp = 0.036
        for fam in (-1, 1):
            dl = (ea * math.cos(math.radians(30)) + eb * (fam * math.sin(math.radians(30)))).normalized(); dp = V((-dl.y, dl.x, 0))
            for q in range(-6, 7):
                pts = []
                for k in range(-12, 13):
                    p = V((cx, cy, 0)) + dp * (q * sp) + dl * (k * 0.022)
                    du = (p - V((cx, cy, 0))).dot(ea) / A; dv = (p - V((cx, cy, 0))).dot(eb) / B
                    if du * du + dv * dv > 1 or rho(p.x, p.y) > 0.9:
                        if len(pts) > 2: strip(pts, 0.0026, light)
                        pts = []; continue
                    wob = 0.004 * nz(p.x * 30, p.y * 30, fam)
                    pts.append(surf(p.x + dp.x * wob, p.y + dp.y * wob))
                if len(pts) > 2: strip(pts, 0.0026, light)
    # loose strands of netting across the heap
    for s in range(16):
        x, y = rng.uniform(-0.3, 0.3), rng.uniform(-0.4, 0.4); h = rng.uniform(0, 2 * math.pi); pts = []
        for k in range(18):
            if rho(x, y) > 0.9: break
            pts.append(surf(x, y, 0.0025)); h += rng.uniform(-0.35, 0.35); x += 0.024 * math.cos(h); y += 0.024 * math.sin(h)
        if len(pts) > 3: strip(pts, 0.0022, light)
    # the float line (one side) and the lead line (the other), folded back and forth as hauled, in and out of the netting
    def rope(side, r, m, seed, nleg):
        rr = random.Random(seed); cps = []
        for leg in range(nleg):
            y = (0.37 + rr.uniform(-0.04, 0.03)) * (1 if leg % 2 else -1); x = side * (0.31 - 0.25 * leg / (nleg - 1)) + rr.uniform(-0.03, 0.03)
            cps.append((x, y))
            if leg < nleg - 1: cps.append((x + side * rr.uniform(-0.07, 0.07), rr.uniform(-0.12, 0.12)))
        P = catmull([(x, y, 0) for x, y in cps], 90); pts = []; depth = []
        for k, p in enumerate(P):
            t = k / (len(P) - 1)
            dv = 0.9 * nz(t * 9.0, seed, 0.5) + 0.25                 # > 0 lying on the net, < 0 under it
            d = r * (1.0 if dv > 0 else 1.0 + 4.0 * min(1.0, -dv * 2))
            z = heap_h(p.x, p.y) + (r * 0.9 if dv > 0 else -d + r)
            pts.append(V((p.x, p.y, z))); depth.append(dv)
        tube_tm(M, pts, r, m, sides=6)
        return pts, depth
    fl, fd = rope(1, 0.0065, C['float'], 3, 5)
    rope(-1, 0.0050, C['lead'], 8, 5)
    # small floats threaded on the float line where it lies on top
    last = -99
    for k in range(4, len(fl) - 4):
        if fd[k] > 0.15 and k - last > 9:
            t = (fl[k + 1] - fl[k - 1]).normalized(); ellipsoid(M, fl[k] + heap_n(fl[k].x, fl[k].y) * 0.006, t, (0.036, 0.017), C['floats'], seg=8, rings=5); last = k
    return M.done(65)

# ======================================================================================================================
# the crates and the pallet
def boards(span, nominal, gap, rng):
    """widths of boards filling span with gaps between them, of mixed widths"""
    n = max(1, round((span + gap) / (nominal + gap))); w = [rng.uniform(0.85, 1.15) for _ in range(n)]; k = (span - gap * (n - 1)) / sum(w)
    out = []; x = -span / 2
    for wi in w:
        out.append((x, x + wi * k)); x += wi * k + gap
    return out
def wood_tint(rng):
    v = rng.uniform(0.86, 1.12); return (v, v * rng.uniform(0.96, 1.03), v * rng.uniform(0.90, 1.06))

def crate(name, L, W, H, post, bh, seed):
    """a crate L long (y), W wide (x), H high: posts at the corners, vertical boards in the sides, three battens round each side,
    a lid of boards along it with three battens across"""
    M = TM(name); rng = random.Random(seed); m = C['wood']; bt = 0.022; tb = 0.019; gap = 0.006; lt = 0.022
    Hc = H - 2 * lt                          # the top of the sides (the lid's boards and its battens on top)
    hw, hl = W / 2, L / 2
    # the posts, from the floor to the lid
    for sx in (-1, 1):
        for sy in (-1, 1):
            cbox(M, (sx * (hw - post / 2), sy * (hl - post / 2), Hc / 2), (post / 2, post / 2, Hc / 2), m, ch=0.004, tint=wood_tint(rng), grain=2, vnoise=0.06, seed=rng.random() * 9)
    # the sides: boards between the posts, set in behind the battens; the battens over them
    zb = [(0.0, bh), ((Hc - bh) / 2, (Hc + bh) / 2), (Hc - bh, Hc)]
    for ax, half, other in ((0, hw, hl), (1, hl, hw)):          # ax: the side's normal axis
        span = 2 * (other - post)
        for sg in (-1, 1):
            for b0, b1 in boards(span, 0.125, gap, rng):
                c = [0, 0, Hc / 2]; h = [0, 0, Hc / 2 - 0.002]
                c[ax] = sg * (half - bt - tb / 2); h[ax] = tb / 2; c[1 - ax] = (b0 + b1) / 2; h[1 - ax] = (b1 - b0) / 2
                cbox(M, c, h, m, ch=0.0025, tint=wood_tint(rng), grain=2, vnoise=0.07, seed=rng.random() * 9)
            for z0, z1 in zb:
                c = [0, 0, (z0 + z1) / 2]; h = [0, 0, (z1 - z0) / 2]
                c[ax] = sg * (half - bt / 2); h[ax] = bt / 2; c[1 - ax] = 0; h[1 - ax] = other - post
                cbox(M, c, h, m, ch=0.003, tint=mul3(wood_tint(rng), 0.97), grain=1 - ax, vnoise=0.06, seed=rng.random() * 9)
    # the inside, dark, so the gaps between the boards read as gaps
    cbox(M, (0, 0, Hc / 2), (hw - bt - tb - 0.001, hl - bt - tb - 0.001, Hc / 2 - 0.004), C['dark'], ch=0.001)
    # the lid: boards along the length, three battens across on top of them
    for b0, b1 in boards(W, 0.13, gap, rng):
        cbox(M, ((b0 + b1) / 2, 0, Hc + lt / 2), ((b1 - b0) / 2, hl, lt / 2), m, ch=0.0025, tint=wood_tint(rng), grain=1, vnoise=0.07, seed=rng.random() * 9)
    for y in (-(hl - post / 2 - 0.01), 0.0, hl - post / 2 - 0.01):
        cbox(M, (0, y, Hc + lt * 1.5), (hw, bh / 2, lt / 2), m, ch=0.003, tint=mul3(wood_tint(rng), 0.97), grain=0, vnoise=0.06, seed=rng.random() * 9)
    return M.done(30)

def pall():
    """the EUR pallet: 1200 along y, 800 across x, 144 high"""
    M = TM('pall'); rng = random.Random(21); m = C['pal']; t = 0.022
    for x, w in ((-0.35, 0.100), (0.0, 0.145), (0.35, 0.100)):           # the bottom boards
        cbox(M, (x, 0, t / 2), (w / 2, 0.600, t / 2), m, ch=0.003, tint=wood_tint(rng), grain=1, vnoise=0.07, seed=rng.random() * 9)
    for y in (-0.5275, 0.0, 0.5275):                                       # the blocks, the stringer boards on them
        for x, w in ((-0.35, 0.100), (0.0, 0.145), (0.35, 0.100)):
            k = rng.uniform(0.9, 1.08)
            cbox(M, (x, y, t + 0.039), (w / 2, 0.0725, 0.039), C['block'], ch=0.004, tint=(k, k * 0.98, k * 0.95), grain=2, endt=(1.0, 1.0, 1.0), vnoise=0.16, seed=rng.random() * 9)
        cbox(M, (0, y, t + 0.078 + t / 2), (0.400, 0.0725, t / 2), m, ch=0.003, tint=wood_tint(rng), grain=0, vnoise=0.07, seed=rng.random() * 9)
    for x, w in ((-0.3275, 0.145), (-0.16375, 0.100), (0.0, 0.145), (0.16375, 0.100), (0.3275, 0.145)):   # the top boards
        cbox(M, (x, 0, 0.144 - t / 2), (w / 2, 0.600, t / 2), m, ch=0.003, tint=wood_tint(rng), grain=1, vnoise=0.07, seed=rng.random() * 9)
    return M.done(30)

# ======================================================================================================================
def size(o):
    P = [to_game(o.matrix_world @ v.co) for v in o.data.vertices]
    lo = [min(p[k] for p in P) for k in range(3)]; hi = [max(p[k] for p in P) for k in range(3)]
    return lo, hi

def floor(z=0.0, s=6.0, rgb=(0.40, 0.41, 0.40)):
    bm = bmesh.new(); bm.faces.new([bm.verts.new(p) for p in ((-s, -s, z), (s, -s, z), (s, s, z), (-s, s, z))])
    return obj_from_bm('floor', bm, [mat('deck', rgb, 0.2)])

def tub_outline(front=True):
    """a simple open box, 1.2 x 1.0 x 0.74 outside and 1.06 x 0.86 inside, to judge the heap's fit"""
    M = TM('tubline'); m = mat('tubblue', (0.12, 0.30, 0.58), 0.4); w = 0.07
    cbox(M, (0, 0, 0.025), (0.6, 0.5, 0.025), m, ch=0.005)
    for sx in (-1, 1): cbox(M, (sx * 0.465, 0, 0.37), (0.035, 0.5, 0.37), m, ch=0.005)
    for sy in ((-1, 1) if front else (1,)): cbox(M, (0, sy * 0.565, 0.37), (0.43, 0.035, 0.37), m, ch=0.005)
    return M.done(30)

def main():
    os.makedirs(OUT, exist_ok=True)
    reset(); colours()
    S = stamp(); LR, K = line('red', (0.92, 1.08), 'line_r'); LG, _ = line('green', (0.80, 1.22), 'line_g'); KR = kroker(K)
    NET = garn(); KA = crate('kasse', 1.20, 0.80, 0.80, 0.07, 0.095, 31); KS = crate('kasse_s', 0.80, 0.60, 0.60, 0.06, 0.08, 41); PA = pall()
    objs = {'stamp': S, 'line_r': LR, 'line_g': LG, 'kroker': KR, 'garn': NET, 'kasse': KA, 'pall': PA, 'kasse_s': KS}
    # the occlusion baked into the colours: the coil in its tub, the net in a tub, the wood alone
    setup_render(64, 64, samples=8)
    tl = tub_outline(); fl = floor()
    def bake(o, others, samples, dist):
        for p in bpy.context.scene.objects:
            if p.type == 'MESH': p.hide_render = not (p is o or p in others)
        bake_ao(o, samples=samples, distance=dist)
    bake(LR, [S], 24, 0.06); bake(LG, [S], 24, 0.06)
    bake(NET, [tl], 24, 0.12)
    for o in (KA, KS, PA): bake(o, [], 16, 0.10)
    for p in bpy.context.scene.objects:
        if p.type == 'MESH': p.hide_render = False
    baked = {'line_r', 'line_g', 'garn', 'kasse', 'pall', 'kasse_s'}
    parts = [(nm, mesh_arrays(o, to_game, to_game_n, ao=nm in baked), 1.0) for nm, o in objs.items()]
    sz = {nm: size(o) for nm, o in objs.items()}
    r4 = lambda v: round(v, 4)
    ex = {'frame': 'kystfiske deck rig: metres, x right, y up, z aft; every part from the middle of its base (y = 0); the line, the hooks and the stamp share an origin',
          'stamp': {'rimY': Z_RIM, 'rimR': R_RIM, 'innerR': [r4(r_in(Z_FLOOR)), r4(r_in(0.366))], 'floorY': Z_FLOOR, 'lugs': [[0.0, Z_LUG, -r4(r_out(Z_LUG) + LUG_OUT)], [0.0, Z_LUG, r4(r_out(Z_LUG) + LUG_OUT)]],
                    'bail': 'lies down to -x, %.0f deg from upright' % S['bail']},
          'line': {'y0': L_Y0, 'y1': L_Y1, 'sMin': S_MIN, 'xz': fit_xz(), 'note': 'scale y by s for how much line is left; for s under sMin scale x and z by xz(s) too, so the coil stays inside the tub'},
          'hooks': {'n': N_HOOK, 'r': r4(R_HOOK), 'y': Z_RIM, 'a0': -HOOK_A, 'a1': HOOK_A, 'note': 'on the rim about +x, the angle in the x-z plane from +x towards -z'},
          'garn': {'y0': G_Y0, 'top': G_TOP, 'edgeY': G_EDGE, 'half': [GA, GB], 'halfBase': [GA0, GB0], 'note': 'half sizes in x and z; scale y with the net aboard'},
          'size': {nm: [r4(hi[k] - lo[k]) for k in range(3)] for nm, (lo, hi) in sz.items()}}
    glb = os.path.join(OUT, 'deck-rig.glb'); n = write_glb(glb, parts, ex)
    open(os.path.join(ROOT, 'src', 'data', 'deck-rig.b64'), 'w').write(base64.b64encode(open(glb, 'rb').read()).decode())
    print('deck rig GLB %.1f KB' % (n / 1024))
    for nm, A, _ in parts:
        lo, hi = sz[nm]
        print('  %-8s %5d tris  x %.3f..%.3f  y %.3f..%.3f  z %.3f..%.3f' % (nm, len(A['idx']) // 3, lo[0], hi[0], lo[1], hi[1], lo[2], hi[2]))
    print('  bail rests %.0f deg from upright; line xz %s' % (S['bail'], fit_xz()))
    if 'fast' in sys.argv: return
    renders(objs, tl, fl)

def show(objs, *keep):
    for o in bpy.context.scene.objects:
        if o.type == 'MESH': o.hide_render = o not in keep
def dup(o, loc, sc=(1, 1, 1)):
    c = o.copy(); link(c); c.location = loc; c.scale = sc; return c

def renders(objs, tl, fl):
    sc = setup_render(1000, 700, samples=16)
    try: sc.cycles.use_denoising = True
    except Exception: pass
    S, LR, LG, KR = objs['stamp'], objs['line_r'], objs['line_g'], objs['kroker']
    only = [x for x in sys.argv[1:] if x != 'fast']
    def want(k): return not only or k in only
    if want('stamp'):
        show(objs, S, LR, KR, fl); camera((0.95, -0.85, 1.05), (0.0, 0.0, 0.22), lens=50); render(os.path.join(OUT, 'rigg_stamp.png'))
        camera((0.0, -0.18, 1.25), (0.0, 0.0, 0.2), lens=50); render(os.path.join(OUT, 'rigg_stamp_top.png'))
        show(objs, S, LG, fl); camera((-0.9, -0.95, 1.0), (0.0, 0.0, 0.2), lens=50); render(os.path.join(OUT, 'rigg_stamp_g.png'))
        show(objs, S, fl); camera((0.8, -0.95, 0.95), (0.0, 0.0, 0.18), lens=50); render(os.path.join(OUT, 'rigg_stamp_empty.png'))
    if want('stamps'):
        extra = [dup(S, (0.52, 0, 0)), dup(LR, (0.52, 0, 0), (1, 1, 0.47)), dup(KR, (0.52, 0, 0)), dup(S, (1.04, 0, 0)), dup(LG, (1.04, 0, 0)),
                 dup(S, (0.26, 0.50, 0)), dup(S, (0.26, 0.50, 0.045)), dup(S, (0.26, 0.50, 0.09))]
        show(objs, S, LR, KR, fl, *extra); camera((1.9, -1.55, 1.55), (0.55, 0.15, 0.2), lens=40); render(os.path.join(OUT, 'rigg_stamps.png'))
        for o in extra: bpy.data.objects.remove(o, do_unlink=True)
    if want('garn'):
        NET = objs['garn']; tc = tub_outline(front=False); tc.location = (2.0, 0, 0); n2 = dup(NET, (2.0, 0, 0)); n3 = dup(NET, (3.4, 0, 0), (1, 1, 0.55)); t3 = dup(tl, (3.4, 0, 0))
        show(objs, NET, tl, fl, tc, n2, n3, t3); camera((1.7, -3.6, 2.6), (1.75, 0, 0.55), lens=38); render(os.path.join(OUT, 'rigg_garn.png'))
        show(objs, NET, fl); camera((0.9, -1.3, 1.9), (0.0, 0.0, 0.75), lens=40); render(os.path.join(OUT, 'rigg_garn_near.png'))
        for o in (tc, n2, n3, t3): bpy.data.objects.remove(o, do_unlink=True)
    if want('kasse'):
        KA, KS, PA = objs['kasse'], objs['kasse_s'], objs['pall']
        KA.location = (0, 0, 0); KS.location = (1.25, -0.2, 0); PA.location = (-1.25, 0, 0); k2 = dup(KA, (-1.25, 0, 0.144)); p2 = dup(PA, (1.25, 1.1, 0))
        show(objs, KA, KS, PA, fl, k2, p2); camera((2.6, -3.6, 2.4), (0.0, 0.1, 0.4), lens=35); render(os.path.join(OUT, 'rigg_kasser.png'))
        camera((1.1, -1.5, 1.2), (0.0, 0.0, 0.45), lens=45); render(os.path.join(OUT, 'rigg_kasse_near.png'))
        for o in (k2, p2): bpy.data.objects.remove(o, do_unlink=True)

if __name__ == '__main__':
    main()
