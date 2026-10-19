"""The things on deck for handling the catch, built in Blender (the coordinator's order 19.10.2026, from the user's photos of the tubs,
the gaff, the knife and the gutting table; the photos stay out of the repo, only the measures are here). All parts go into one GLB:

    kar460      an insulated fish tub of 460 l, modelled on the common Norwegian rotomoulded PE tubs of that size (the Saeplast /
                Nordic 460 l tub is the model; no name or logo on ours). Double-walled polyethylene: 1.20 x 1.00 m outside (the long
                axis aft), 0.74 m high; inside 1.06 x 0.86 m at the rim and 0.60 m deep, the inner walls 2.5 degrees out of plumb. A
                thick rolled rim that stands 18 mm out of the wall, rounded vertical corners (150 mm at the rim, 80 mm inside), tapered
                trapezoid ribs on the outside walls (the user's photo: wide at the foot, narrow under the rim), a four-way pallet base
                (fork pockets 90 mm high through the base from all four sides, nine feet) and a drain plug with a T-grip low on one
                short side (the end at the game's +z). Light grey-white, low gloss.
    kar460o     the same tub in fishery orange
    kar460b     the same tub in blue
    kar300      a smaller tub of the same make: 1.08 x 0.72 m, 0.66 m high, inside 0.96 x 0.60 m and 0.52 m deep
    kar1000     a big tub: 1.20 x 1.00 m, 1.00 m high, inside 1.06 x 0.86 m and 0.86 m deep
                (all tubs: origin at the centre of the base on the deck; the inner floor 0.14 m over the deck)
    vann        the bleeding water in a tub: a flat 1.0 x 1.0 m surface (corners rounded 60 mm) at y = 0, dark blood red and glossy;
                the game scales it to the tub's inner size at the water's level (extras 'tubs' give the sizes)
    is          a layer of crushed ice, 1.0 x 1.0 m and about 0.06 m thick with a lumpy top, from its base; scaled by the game
    hott        a line gaff («linehøtt»), 0.90 m from the knob to the front of the hook: a light pine handle, slightly bowed, thickening
                from 30 to 35 mm toward the head, with a round knob at the butt; a square steel ferrule (37 mm, 65 mm long, two
                rivets) and a forged hook of 10 mm rod bending down with about 8-10 cm reach, its sharp point turned back toward the
                handle. Along -z (head forward), hook down; origin on the axis 0.25 m from the butt (the grip).
    kniv        a curved gutting knife (sløyekniv): a black moulded handle of 12 cm with a small finger guard and a 15 cm stainless
                blade whose edge sweeps up to the point (the user's photo). Blade toward -z, edge down; origin at the grip's centre.
    bord        a free-standing plastic gutting table (the user's photo): a moulded top 1.15 x 0.60 m, very light blue-white, a
                raised rim round the edge, the cutting surface recessed 26 mm in it (0.925 m over the floor), a sink of 0.35 x 0.40 m
                and 12 cm deep at the right (+x) end with a steel drain and a spigot under it, a small chrome tap at the back corner
                behind the sink; black square steel legs (30 mm) with rails under the top, X braces on the ends, a low rail at the
                back and levelling feet. Long axis along x, the worker at +z facing -z; origin on the floor under the middle.
    benk        a stainless gutting bench for bigger boats: a 1.60 x 0.70 m top at 0.92 m with a rounded front edge, a 10 cm upstand
                along the back and both ends (the ends slope down to the front), an open chute (renne) through the back upstand near
                the -x end that slopes down and out over -z (the bench stands with its back to the rail, the chute out through where
                the bulwark is), a lower shelf with upturned edges, four round legs on bolted foot plates, rails under the top, and a
                hook for the rinse hose on the +x end. Same frame and origin as bord.
    botte       a black 12 l plastic bucket (Ø 0.30 m at the rim, 0.275 m high, a reinforcing band and a rolled rim, two ears) with
                a steel bail and a plastic grip; the bail lies folded down to the game's +z side. Origin at the base centre.

What I chose myself: everything not given above. The tubs' rib count and spacing (about 0.2 m), the rib taper (base 100 -> 56 mm,
standing 16 -> 10 mm out), the rim band's height (85 mm), the pocket and feet layout (corner feet 140-150 mm, middle feet 160-180
mm), the drain's place (between two ribs on the aft end, 0.125 m up) and the dirt toward the base; the gaff's ferrule, rivets and
the hook's exact curve; the knife's guard and the blade's curve (edge rising 24 mm over the blade); the table's rim (40 mm wide, 26
mm high), legs, bracing, tap and drain; the bench's sheet details, legs, shelf height (0.22 m), chute size (0.34 m wide, 0.33 m out,
0.12 m drop) and the hose hook; the bucket's profile. No brand names or logos anywhere on the models.

Extras (in the game's frame of the part they belong to): hott_tip, hott_len, kniv_tip, bord_top, bord_work, bord_drop, benk_top,
benk_work, benk_drop, and tubs = {name: outer size [x, y, z], rim (y of the rim's top), floor (y of the inner floor), in_top
[x, z] (inner size at the rim), in_floor [x, z] (inner size just over the floor's rounding), pocket (height of the fork pockets)}.

    pip install bpy==4.5.4
    python3 tools/deck/fisk.py          -> src/data/deck-fish.b64, renders tools/deck/out/fisk_*.png
    python3 tools/deck/fisk.py fast     -> without the renders

Frames. Here in Blender: x to the right (athwartships), y forward, z up, each part built round its own origin. The game's: x right,
y up, z aft; to_game(p) = (x, z, -y), so Blender +y (forward) is the game's -z."""
import os, sys, math, base64, random
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))
sys.path.insert(0, os.path.join(ROOT, 'tools', 'boats'))
import bpy, bmesh
from mathutils import Vector
from bpyutil import *

OUT = os.path.join(HERE, 'out')
FAST = 'fast' in sys.argv

def to_game(p): return (p[0], p[2], -p[1])
def to_game_n(n): return (n[0], n[2], -n[1])
def G(p): return [round(v, 4) for v in to_game(p)]

C = {}
def colours():
    C['tub'] = mat('tub', (0.86, 0.86, 0.84), 0.22)
    C['tubo'] = mat('tubo', (0.92, 0.36, 0.10), 0.25)
    C['tubb'] = mat('tubb', (0.10, 0.32, 0.62), 0.25)
    C['plug'] = mat('plug', (0.17, 0.17, 0.18), 0.3)
    C['hole'] = mat('hole', (0.03, 0.03, 0.03), 0.1)
    C['blood'] = mat('blood', (0.30, 0.05, 0.05), 0.85)
    C['ice'] = mat('ice', (0.90, 0.95, 1.0), 0.6)
    C['pine'] = mat('pine', (0.86, 0.70, 0.47), 0.3)
    C['galv'] = mat('galv', (0.62, 0.64, 0.66), 0.5, metal=0.7)
    C['hook'] = mat('hook', (0.56, 0.58, 0.60), 0.6, metal=0.8)
    C['blade'] = mat('blade', (0.78, 0.80, 0.82), 0.85, metal=0.9)
    C['bevel'] = mat('bevel', (0.90, 0.91, 0.92), 0.9, metal=0.9)
    C['black'] = mat('black', (0.055, 0.055, 0.06), 0.3)
    C['top'] = mat('top', (0.86, 0.90, 0.95), 0.35)
    C['frame'] = mat('frame', (0.05, 0.05, 0.055), 0.4)
    C['foot'] = mat('foot', (0.025, 0.025, 0.025), 0.2)
    C['chrome'] = mat('chrome', (0.86, 0.87, 0.89), 0.92, metal=1.0)
    C['stain'] = mat('stain', (0.75, 0.77, 0.79), 0.6, metal=0.85)
    C['bucket'] = mat('bucket', (0.06, 0.06, 0.065), 0.35)
    C['wire'] = mat('wire', (0.70, 0.72, 0.74), 0.6, metal=0.8)
    C['grip'] = mat('grip', (0.12, 0.12, 0.13), 0.3)

# ---------- helpers ----------
def loft(name, rings, mats, cap0=None, cap1=None, angle=35):
    """rings stacked along the profile; with each ring counter-clockwise seen from the way the profile advances, the faces point to
    the left of the profile (outwards when it runs up the outside of a body). A ring of one point is an apex. mats is a material or
    mats(band, j); cap0 / cap1 are the materials of the end caps (None: open)."""
    bm = bmesh.new(); vs = [[bm.verts.new(p) for p in r] for r in rings]
    ml = []; mi = {}
    def ix(m):
        if m.name not in mi: mi[m.name] = len(ml); ml.append(m)
        return mi[m.name]
    mf = mats if callable(mats) else (lambda i, j: mats)
    for i in range(len(vs) - 1):
        a, b = vs[i], vs[i + 1]
        if len(a) == 1 and len(b) == 1: continue
        n = max(len(a), len(b))
        for j in range(n):
            j1 = (j + 1) % n
            if len(b) == 1: q = [a[j], a[j1], b[0]]
            elif len(a) == 1: q = [a[0], b[j1], b[j]]
            else: q = [a[j], a[j1], b[j1], b[j]]
            u = []
            for v in q:
                if all((v.co - w.co).length > 1e-7 for w in u): u.append(v)
            if len(u) < 3: continue
            try: f = bm.faces.new(u)
            except ValueError: continue
            f.material_index = ix(mf(i, j))
    if cap0 is not None and len(vs[0]) > 2: f = bm.faces.new(list(reversed(vs[0]))); f.material_index = ix(cap0)
    if cap1 is not None and len(vs[-1]) > 2: f = bm.faces.new(vs[-1]); f.material_index = ix(cap1)
    return shade(obj_from_bm(name, bm, ml), angle)


def even_side(ns):
    def f(k, A, B, n):
        m = ns(k) if callable(ns) else ns
        return [(A[0] + (B[0] - A[0]) * i / (m + 1), A[1] + (B[1] - A[1]) * i / (m + 1)) for i in range(1, m + 1)]
    return f


def rr_ring(hx, hy, R, z, nc=6, side=None, d=0.0, rmin=0.008, c=(0.0, 0.0)):
    """a counter-clockwise ring (seen from above) round a rounded rectangle of half sizes hx, hy and corner radius R, pushed out by d;
    side(k, A, B, n) gives the points strictly between the corners on side k (0 +y, 1 -x, 2 -y, 3 +x; from A to B, outward n)"""
    hx += d; hy += d; R = min(max(rmin, R + d), hx - 1e-3, hy - 1e-3); cx, cy = hx - R, hy - R
    side = side or even_side(3)
    cs = ((1, 1, 0), (-1, 1, 90), (-1, -1, 180), (1, -1, 270)); ns = ((0, 1), (-1, 0), (0, -1), (1, 0))
    pts = []
    for k, (sx, sy, a0) in enumerate(cs):
        for i in range(nc + 1):
            a = math.radians(a0 + 90 * i / nc); pts.append((sx * cx + R * math.cos(a), sy * cy + R * math.sin(a)))
        A = pts[-1]; nx, ny, na = cs[(k + 1) % 4]; B = (nx * cx + R * math.cos(math.radians(na)), ny * cy + R * math.sin(math.radians(na)))
        pts += side(k, A, B, ns[k])
    return [(c[0] + x, c[1] + y, z) for x, y in pts]


def ring_frame(d, prev=None):
    """two unit vectors across the direction d with e1 x e2 = d (so a ring e1 cos + e2 sin runs the right way round)"""
    d = Vector(d).normalized()
    if prev is None:
        ref = Vector((1, 0, 0)) if abs(d.x) < 0.9 else Vector((0, 0, 1))
        e2 = (ref - d * ref.dot(d)).normalized()
    else:
        e2 = (prev - d * prev.dot(d)).normalized()
    e1 = e2.cross(d).normalized()
    return e1, e2


def ttube(name, pts, radii, m, seg=8, cap0=True, cap1=True, angle=50, mf=None):
    """a tube along a polyline with a radius at each point (0 at an end makes a point); frames carried along without twisting"""
    pts = [Vector(p) for p in pts]; rings = []; e2 = None
    for i, p in enumerate(pts):
        a = pts[max(0, i - 1)]; b = pts[min(len(pts) - 1, i + 1)]
        e1, e2 = ring_frame(b - a, e2)
        r = radii[i]
        if r < 1e-6: rings.append([tuple(p)])
        else: rings.append([tuple(p + (e1 * math.cos(t) + e2 * math.sin(t)) * r) for t in [2 * math.pi * k / seg for k in range(seg)]])
    return loft(name, rings, mf or m, m if cap0 else None, m if cap1 else None, angle)


def lathe_z(name, prof, m, seg=32, c=(0, 0), cap0=None, cap1=None, angle=40, mats=None):
    """a body of revolution about a vertical axis through c: prof [(r, z)] in the order the surface runs (outside up, inside down)"""
    rings = []
    for r, z in prof:
        if r < 1e-6: rings.append([(c[0], c[1], z)])
        else: rings.append([(c[0] + r * math.cos(2 * math.pi * k / seg), c[1] + r * math.sin(2 * math.pi * k / seg), z) for k in range(seg)])
    return loft(name, rings, mats or m, cap0, cap1, angle)


def catmull(pts, n=5):
    P = [Vector(pts[0])] + [Vector(p) for p in pts] + [Vector(pts[-1])]; out = []
    for i in range(1, len(P) - 2):
        p0, p1, p2, p3 = P[i - 1], P[i], P[i + 1], P[i + 2]
        for k in range(n):
            t = k / n
            out.append(0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t ** 3))
    out.append(Vector(pts[-1]))
    return out


def extrude_x(name, poly, x0, x1, m, angle=35):
    """a prism along x from a polygon in the (y, z) plane"""
    area = sum(poly[i][0] * poly[(i + 1) % len(poly)][1] - poly[(i + 1) % len(poly)][0] * poly[i][1] for i in range(len(poly)))
    if area < 0: poly = list(reversed(poly))          # counter-clockwise in (y, z): the sides below then face outwards
    if x1 < x0: x0, x1 = x1, x0
    bm = bmesh.new(); a = [bm.verts.new((x0, y, z)) for y, z in poly]; b = [bm.verts.new((x1, y, z)) for y, z in poly]; n = len(poly)
    for i in range(n):
        j = (i + 1) % n; bm.faces.new([a[i], a[j], b[j], b[i]])
    bm.faces.new(list(reversed(a))); bm.faces.new(b)
    return shade(obj_from_bm(name, bm, [m]), angle)


def clip_poly(poly, a, b, c):
    """the part of a polygon where a x + b y <= c"""
    out = []; n = len(poly)
    for i in range(n):
        P = poly[i]; Q = poly[(i + 1) % n]; fp = a * P[0] + b * P[1] - c; fq = a * Q[0] + b * Q[1] - c
        if fp <= 0: out.append(P)
        if (fp < 0 < fq) or (fq < 0 < fp):
            t = fp / (fp - fq); out.append((P[0] + (Q[0] - P[0]) * t, P[1] + (Q[1] - P[1]) * t))
    return out


def clean_poly(poly, eps=1e-5):
    pts = []
    for p in poly:
        if not pts or math.dist(p, pts[-1]) > eps: pts.append(p)
    if len(pts) > 1 and math.dist(pts[0], pts[-1]) <= eps: pts.pop()
    changed = True
    while changed and len(pts) > 3:
        changed = False
        for i in range(len(pts)):
            a, b, c = pts[i - 1], pts[i], pts[(i + 1) % len(pts)]
            if abs((b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0])) < 1e-8: pts.pop(i); changed = True; break
    return pts


def add_tint(o, fn):
    """a per-corner colour multiplier (the TINT layer the export and the renders read): fn(co, material name, normal, face) -> rgb or None"""
    me = o.data
    lay = me.color_attributes.get('TINT') or me.color_attributes.new('TINT', 'FLOAT_COLOR', 'CORNER')
    for p in me.polygons:
        mn = me.materials[p.material_index].name
        for li in p.loop_indices:
            t = fn(me.vertices[me.loops[li].vertex_index].co, mn, p.normal, p.index)
            lay.data[li].color = (t[0], t[1], t[2], 1.0) if t else (1.0, 1.0, 1.0, 0.0)
    return o


def weld(o, dist=1e-5):
    bm = bmesh.new(); bm.from_mesh(o.data); bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=dist); bm.to_mesh(o.data); bm.free(); o.data.update()
    return o


def bake_alone(o, samples=32, distance=0.6):
    """ambient occlusion into the corners, with every other mesh out of the way"""
    hid = []
    for p in bpy.context.scene.objects:
        if p is not o and p.type == 'MESH' and not p.hide_render: p.hide_render = True; hid.append(p)
    bake_ao(o, samples=samples, distance=distance)
    for p in hid: p.hide_render = False
    return o


def cut_m(o, cutters):
    """boolean difference with Blender's manifold solver (the exact one let a cutter through on the 1000 l tub), cutters deleted"""
    apply_all(o)
    for c in cutters:
        md = o.modifiers.new('cut', 'BOOLEAN'); md.operation = 'DIFFERENCE'; md.solver = 'MANIFOLD'; md.object = c
        apply_all(o)
    for c in cutters: bpy.data.objects.remove(c, do_unlink=True)
    return o


def smooth01(a, b, x):
    t = max(0.0, min(1.0, (x - a) / (b - a))); return t * t * (3 - 2 * t)

# ---------- the tubs ----------
LIP = 0.020      # how far the rolled rim stands out of the wall
PH = 0.09        # the fork pockets' height
HR = 0.085       # the rim band's height
FR = 0.04        # the rounding between the inner walls and the floor
TUBS = {}

def rib_positions(straight, b0):
    """rib centres along a straight wall of this length, about 0.2 m apart, symmetric"""
    avail = straight / 2 - b0 - 0.02
    nh = int(avail // 0.18)
    if nh == 0: return [-0.11, 0.11] if avail >= 0.10 else [0.0]
    sp = min(0.22, avail / nh)
    return [k * sp for k in range(-nh, nh + 1)]


def tub(name, Wo, Lo, H, Wi, Li, D, body, draft=2.5):
    rw = (Wo - Wi) / 2; assert abs(rw - (Lo - Li) / 2) < 1e-6
    hx, hy = Wo / 2, Lo / 2; R = rw + 0.08; zr0 = H - HR; zf = H - D; tg = math.tan(math.radians(draft))
    parts = []
    # --- the outer wall with its tapered ribs, from the deck up under the rim; the fork pockets are cut out of its foot below
    b0, b1 = 0.060, 0.026           # half width of a rib's foot at the deck and under the rim (a trapezoid seen from the side)
    p0, p1 = 0.020, 0.010           # how far it stands out of the wall
    l0, l1 = 0.014, 0.008           # the run of its sloping flanks
    rx = rib_positions(2 * (hx - R), b0)   # on the short ends (along x)
    ry = rib_positions(2 * (hy - R), b0)   # on the long sides (along y)
    ztop = zr0 + 0.012
    def ribbed(z, d):
        s = z / ztop; b = b0 + (b1 - b0) * s; f = b - (l0 + (l1 - l0) * s); p = p0 + (p1 - p0) * s
        def side(k, A, B, n):
            L = math.dist(A, B); t = ((B[0] - A[0]) / L, (B[1] - A[1]) / L); M = ((A[0] + B[0]) / 2, (A[1] + B[1]) / 2); out = []
            for u in sorted(rx if k in (0, 2) else ry):
                for uu, pp in ((u - b, 0), (u - f, p), (u + f, p), (u + b, 0)):
                    out.append((M[0] + t[0] * uu + n[0] * pp, M[1] + t[1] * uu + n[1] * pp))
            return out
        return rr_ring(hx, hy, R, z, nc=5, side=side, d=-LIP + d)
    zs = [0.0, 0.008, PH + 0.016, (PH + zr0) / 2, ztop]
    rings = [ribbed(zs[0], -0.006)] + [ribbed(z, 0.0) for z in zs[1:]]
    wall = loft('wall', rings, body, cap0=body, cap1=body, angle=30)
    # the four-way pallet base: channels 90 mm high right through under the tub from all four sides leave nine feet
    hxw, hyw = hx - LIP, hy - LIP
    cwx, cfx = (0.14, 0.08) if Wo > 0.85 else (0.12, 0.07)
    cwy, cfy = (0.15, 0.09) if Lo > 1.1 else (0.13, 0.08)
    cutters = []
    for sg in (-1, 1):
        ya, yb = sorted((sg * cfy, sg * (hyw - cwy))); xa, xb = sorted((sg * cfx, sg * (hxw - cwx)))
        cutters.append(apply_all(box('pk', -1, 1, ya, yb, -0.05, PH, body, bevel=0.012, seg=2)))
        cutters.append(apply_all(box('pk', xa, xb, -1, 1, -0.05, PH, body, bevel=0.012, seg=2)))
    cut_m(wall, cutters); shade(wall, 30)
    parts.append(wall)
    # --- the rim and the inside: under the lip, out and up the rim's face, over the top, down the inner wall and along the floor
    prof = [(-LIP - 0.002, zr0), (-LIP + 0.006, zr0 + 0.002), (-0.004, zr0 + 0.010), (0.0, zr0 + 0.024), (0.0, H - 0.030),
            (-0.004, H - 0.012), (-0.012, H - 0.003), (-0.024, H), (-rw + 0.024, H), (-rw + 0.011, H - 0.004), (-rw + 0.002, H - 0.014), (-rw, H - 0.030)]
    zt = H - 0.030; zb = zf + FR; dwb = -rw - (zt - zb) * tg
    nmid = 2 if D > 0.7 else 1
    for k in range(1, nmid + 1):
        z = zt + (zb - zt) * k / (nmid + 1); prof.append((-rw - (zt - z) * tg, z))
    prof.append((dwb, zb))
    for a in (30, 60, 90):
        t = math.radians(a); prof.append((dwb - FR + FR * math.cos(t), zb - FR * math.sin(t)))
    prof.append((dwb - FR - 0.10, zf))
    rings = [rr_ring(hx, hy, R, z, nc=6, side=even_side(lambda k: 3 if k in (0, 2) else 4), d=d) for d, z in prof]
    parts.append(loft('rim', rings, body, cap1=body, angle=38))
    # --- the drain on the aft end (Blender -y, the game's +z): a boss, a plug with a T-grip, and the hole inside at the floor
    free = []; ribs = sorted(rx); lim = hx - R
    edges = [-lim] + [v for u in ribs for v in (u - b0, u + b0)] + [lim]
    for i in range(0, len(edges), 2): free.append(((edges[i] + edges[i + 1]) / 2, edges[i + 1] - edges[i]))
    xd = min((c for c, w in free if c >= -1e-6 and w >= 0.075), key=lambda c: abs(c - 0.11))
    yw = -(hy - LIP); zd = 0.125
    parts.append(cyl('boss', (xd, yw + 0.01, zd), (xd, yw - 0.013, zd), 0.032, body, seg=16))
    parts.append(cyl('plug', (xd, yw - 0.012, zd), (xd, yw - 0.026, zd), 0.026, C['plug'], seg=16))
    parts.append(box('tgrip', xd - 0.022, xd + 0.022, yw - 0.038, yw - 0.025, zd - 0.006, zd + 0.006, C['plug']))
    zh = zf + 0.055; yh = -(hy + (-rw - (zt - zh) * tg)) + 0.0015
    parts.append(cyl('hole', (xd, yh - 0.004, zh), (xd, yh, zh), 0.014, C['hole'], seg=12))
    o = join(parts, name)
    wf = 2 * (hx + dwb); lf = 2 * (hy + dwb)
    TUBS[name] = {'outer': [Wo, H, Lo], 'rim': H, 'floor': round(zf, 4), 'in_top': [round(Wi, 4), round(Li, 4)], 'in_floor': [round(wf, 4), round(lf, 4)], 'pocket': PH}
    # a little grime toward the foot and on the floor inside
    def grime(co, mn, nrm, fi):
        if mn not in ('tub', 'tubo', 'tubb'): return None
        k = 1.0 - 0.13 * (1 - smooth01(0.0, 0.16, co.z))
        if co.z < zf + 0.03 and nrm.z > 0.5 and abs(co.x) < hx - rw and abs(co.y) < hy - rw: k *= 0.93
        return (k, k * 0.985, k * 0.96)
    add_tint(o, grime)
    return o


def recolour(o, name, frm, to):
    c = o.copy(); c.data = o.data.copy(); c.name = name; link(c)
    for i, m in enumerate(c.data.materials):
        if m.name == frm.name: c.data.materials[i] = to
    return c

# ---------- the water and the ice ----------
def water():
    pts = rr_ring(0.5, 0.5, 0.06, 0.0, nc=4, side=even_side(1))
    bm = bmesh.new(); f = bm.faces.new([bm.verts.new(p) for p in pts]); f.normal_update()
    return shade(obj_from_bm('vann', bm, [C['blood']]), 30)


def rr_map(u, v, r=0.06, h=0.5):
    """a point of the square [-h, h]^2 moved so the square's edge lands on the rounded square's"""
    m = max(abs(u), abs(v))
    if m < 1e-9: return u, v
    su, sv = u / m * h, v / m * h; L = math.hypot(su, sv)
    du, dv = su / L, sv / L
    # the ray (du, dv) t against the rounded square: in a corner zone, against the corner's circle
    c = h - r; t = L
    if abs(su) > c and abs(sv) > c:
        cx, cy = math.copysign(c, su), math.copysign(c, sv)
        bq = du * cx + dv * cy; cc = cx * cx + cy * cy - r * r
        t = bq + math.sqrt(max(0.0, bq * bq - cc))
    return u * t / L, v * t / L


def ice():
    rnd = random.Random(7); N = 22; h = 0.5
    bumps = [((rnd.uniform(-0.5, 0.5), rnd.uniform(-0.5, 0.5)), rnd.uniform(0.02, 0.06), rnd.uniform(0.005, 0.016)) for _ in range(110)]
    bm = bmesh.new(); Vg = {}
    for i in range(N + 1):
        for j in range(N + 1):
            u = -h + 2 * h * i / N; v = -h + 2 * h * j / N; edge = i in (0, N) or j in (0, N)
            if not edge: u += rnd.uniform(-0.3, 0.3) / N; v += rnd.uniform(-0.3, 0.3) / N
            x, y = rr_map(u, v)
            z = 0.040 + sum(hh * math.exp(-((x - c[0]) ** 2 + (y - c[1]) ** 2) / (2 * s * s)) for c, s, hh in bumps)
            z += rnd.uniform(-0.006, 0.006)
            if edge: z = 0.034 + rnd.uniform(-0.003, 0.003)
            Vg[i, j] = bm.verts.new((x, y, min(z, 0.068)))
    for i in range(N):
        for j in range(N):
            bm.faces.new([Vg[i, j], Vg[i + 1, j], Vg[i + 1, j + 1], Vg[i, j + 1]])
    loop = [Vg[i, 0] for i in range(N)] + [Vg[N, j] for j in range(N)] + [Vg[i, N] for i in range(N, 0, -1)] + [Vg[0, j] for j in range(N, 0, -1)]
    B = [bm.verts.new((v.co.x, v.co.y, 0.0)) for v in loop]; n = len(loop)
    for k in range(n):
        k1 = (k + 1) % n; bm.faces.new([B[k], B[k1], loop[k1], loop[k]])
    bm.faces.new(list(reversed(B)))
    o = shade(obj_from_bm('is', bm, [C['ice']]), 22)
    zr = [v.co.z for v in o.data.vertices if v.co.z > 0.01]; z0, z1 = min(zr), max(zr)
    fr = random.Random(3); ft = [fr.uniform(0.90, 1.04) for _ in o.data.polygons]
    def t(co, mn, nrm, fi):
        s = smooth01(z0, z1, co.z) if co.z > 0.01 else 0.6
        k = ft[fi]; return (min(1.0, (0.78 + 0.22 * s) * k), min(1.0, (0.85 + 0.15 * s) * k), min(1.0, (0.97 + 0.03 * s) * k))
    return add_tint(o, t)

# ---------- the gaff ----------
HOTT_TIP = None
def gaff():
    global HOTT_TIP
    p = []
    bow = lambda y: 0.010 * math.sin(math.pi * min(1.0, max(0.0, (y + 0.25) / 0.755)))
    prof = [(-0.2500, 0.0), (-0.2494, 0.0075), (-0.2472, 0.0140), (-0.2430, 0.0186), (-0.2368, 0.0210), (-0.2295, 0.0216), (-0.2222, 0.0204),
            (-0.2165, 0.0178), (-0.2118, 0.0155), (-0.2060, 0.0148), (-0.1950, 0.0150), (-0.10, 0.0153), (0.05, 0.0158), (0.20, 0.0163),
            (0.35, 0.0169), (0.45, 0.0173), (0.496, 0.0175), (0.503, 0.0166)]
    p.append(ttube('handle', [(0.0, y, bow(y)) for y, r in prof], [r for y, r in prof], C['pine'], seg=12, cap0=False, cap1=True, angle=40))
    # the square ferrule over the handle's end, and two rivets through it
    fr = []
    for y, hh in ((0.497, 0.0170), (0.501, 0.0186), (0.560, 0.0186), (0.565, 0.0166)):
        fr.append([(q[1], y, q[0]) for q in rr_ring(hh, hh, 0.005, 0, nc=2, side=even_side(0))])
    p.append(loft('ferrule', fr, C['galv'], cap0=C['galv'], cap1=C['galv'], angle=50))
    for s in (-1, 1):
        p.append(cyl('rivet', (s * 0.0180, 0.530, 0.0), (s * 0.0215, 0.530, 0.0), 0.0045, C['galv'], seg=8))
    # the hook: 10 mm rod out of the ferrule, bending down and round with its point back toward the handle
    H = [(0.530, 0.0), (0.565, 0.0), (0.592, -0.002), (0.618, -0.012), (0.638, -0.030), (0.648, -0.052), (0.643, -0.073), (0.625, -0.089),
         (0.598, -0.096), (0.570, -0.091), (0.546, -0.081), (0.522, -0.070)]
    path = catmull([(0.0, y, z) for y, z in H], n=4)
    L = [0.0]
    for a, b in zip(path, path[1:]): L.append(L[-1] + (b - a).length)
    tl = L[-1]; taper = 0.050
    radii = [0.0052 if s < tl - taper else max(0.0, 0.0052 * ((tl - s) / taper) ** 0.85) for s in L]
    radii[-1] = 0.0
    p.append(ttube('hook', path, radii, C['hook'], seg=8, cap0=False, cap1=False, angle=50))
    HOTT_TIP = tuple(path[-1])
    o = join(p, 'hott')
    def grain(co, mn, nrm, fi):
        if mn != 'pine': return None
        a = math.atan2(co.z - bow(co.y), co.x)
        k = 1.0 - 0.05 * (0.5 + 0.5 * math.sin(5 * a + 9 * co.y))
        k *= 1.0 - 0.07 * (1 - smooth01(0.05, 0.16, abs(co.y + 0.02)))          # the grip, darker from the hands
        k *= 1.0 - 0.20 * smooth01(0.30, 0.50, co.y)                            # the wet, bloodied end at the hook
        return (k, k * 0.97, k * 0.93)
    return add_tint(o, grain)

# ---------- the knife ----------
KNIV_TIP = None
def knife():
    global KNIV_TIP
    p = []
    # the handle: rings across it (half height, half width, centre's height); the guard drops at the front
    hp = [(-0.0620, 0.0040, 0.0030, 0.0000), (-0.0605, 0.0082, 0.0062, 0.0000), (-0.0570, 0.0108, 0.0080, 0.0002), (-0.0480, 0.0118, 0.0086, 0.0006),
          (-0.0250, 0.0122, 0.0089, 0.0008), (0.0050, 0.0116, 0.0085, 0.0006), (0.0320, 0.0104, 0.0078, 0.0000), (0.0450, 0.0110, 0.0080, -0.0010),
          (0.0520, 0.0136, 0.0083, -0.0026), (0.0575, 0.0137, 0.0078, -0.0027), (0.0600, 0.0100, 0.0052, -0.0010)]
    seg = 14; rings = []
    for y, hz, hw, cz in hp:
        rings.append([(hw * math.sin(2 * math.pi * k / seg), y, cz + hz * math.cos(2 * math.pi * k / seg)) for k in range(seg)])
    p.append(loft('handle', rings, C['black'], cap0=C['black'], cap1=C['black'], angle=50))
    # the blade: stations from inside the guard to the point; the edge sweeps up toward the point
    y0, y1 = 0.056, 0.212
    ze = lambda t: -0.0110 + 0.034 * t ** 2.0
    w = lambda t: 0.0195 * max(0.0, 1 - t ** 2.2) ** 0.72
    rings = []
    for t in (0.0, 0.03, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.78, 0.85, 0.9, 0.94, 0.97, 1.0):
        y = y0 + (y1 - y0) * t; e = ze(t); ww = w(t); zs = e + ww; h = 0.0011 * (1 - 0.65 * t)
        if t >= 1.0: rings.append([(0.0, y, e)]); continue
        rings.append([(-h, y, zs), (h, y, zs), (0.8 * h, y, zs - 0.30 * ww), (0.25 * h, y, e + 0.13 * ww), (0.0, y, e), (-0.25 * h, y, e + 0.13 * ww), (-0.8 * h, y, zs - 0.30 * ww)])
    p.append(loft('blade', rings, lambda i, j: C['bevel'] if j in (3, 4) else C['blade'], cap0=C['blade'], angle=25))
    KNIV_TIP = (0.0, y1, ze(1.0))
    return join(p, 'kniv')

# ---------- the plastic gutting table ----------
BORD = {}
def table():
    A = []; T = C['top']
    hx, hy, R = 0.575, 0.30, 0.05; zw = 0.925
    prof = [(-0.004, 0.878), (0.0, 0.883), (0.0, 0.940), (-0.003, 0.948), (-0.010, 0.9515), (-0.030, 0.9515), (-0.036, 0.949),
            (-0.040, 0.943), (-0.041, 0.931), (-0.044, 0.9265), (-0.049, zw)]
    sd = even_side(lambda k: 6 if k in (0, 2) else 2)
    rings = [rr_ring(hx, hy, R, z, nc=4, side=sd, d=d, rmin=0.012) for d, z in prof]
    A.append(loft('rim', rings, T, cap0=T, angle=38))
    # the sink at the right end, toward the front so the tap has room behind it
    sc = (0.326, -0.025); shx, shy, sR = 0.175, 0.20, 0.035
    ssd = even_side(2)
    hole = rr_ring(shx, shy, sR, zw, nc=4, side=ssd, c=sc)
    # the cutting surface: the recess's floor round the sink's opening
    bm = bmesh.new(); ra = [bm.verts.new(q) for q in rings[-1]]; rb = [bm.verts.new(q) for q in hole]; es = []
    for L in (ra, rb):
        for i in range(len(L)): es.append(bm.edges.new((L[i], L[(i + 1) % len(L)])))
    bmesh.ops.triangle_fill(bm, use_beauty=True, use_dissolve=False, edges=es, normal=(0, 0, 1))
    for f in bm.faces:
        f.normal_update()
        if f.normal.z < 0: f.normal_flip()
    A.append(shade(obj_from_bm('surface', bm, [T]), 30))
    # the sink's inside: down the walls, round onto the floor, and in to the drain
    sp = [(0.0, zw), (-0.002, zw - 0.004), (-0.004, zw - 0.012), (-0.011, 0.818)]
    for a in (30, 60, 90):
        t = math.radians(a); sp.append((-0.023 + 0.012 * math.cos(t), 0.818 - 0.012 * math.sin(t)))
    srings = [rr_ring(shx, shy, sR, z, nc=4, side=ssd, d=d, c=sc, rmin=0.008) for d, z in sp]
    fl = srings[-1]; circ = []
    for q in fl:
        dx, dy = q[0] - sc[0], q[1] - sc[1]; L = math.hypot(dx, dy); circ.append((sc[0] + 0.035 * dx / L, sc[1] + 0.035 * dy / L, q[2]))
    srings.append(circ)
    A.append(loft('sink', srings, T, angle=38))
    # its outside under the top
    op = [(-0.004, 0.793), (0.004, 0.797), (0.008, 0.810), (0.008, 0.885)]
    A.append(loft('sinkout', [rr_ring(shx, shy, sR, z, nc=4, side=ssd, d=d, c=sc) for d, z in op], T, cap0=T, angle=38))
    # the steel drain: a flange, the dark hole with a cross over it, the spigot under the sink
    zf = 0.806
    A.append(lathe_z('drain', [(0.0365, zf - 0.001), (0.0365, zf + 0.0012), (0.033, zf + 0.0022), (0.024, zf + 0.0022), (0.022, zf), (0.022, zf - 0.016), (0.0, zf - 0.016)],
                     None, seg=20, c=sc, mats=lambda i, j: C['chrome'] if i < 3 else C['hole'], angle=50))
    A.append(box('cross', sc[0] - 0.022, sc[0] + 0.022, sc[1] - 0.002, sc[1] + 0.002, zf - 0.003, zf + 0.0015, C['chrome']))
    A.append(box('cross', sc[0] - 0.002, sc[0] + 0.002, sc[1] - 0.022, sc[1] + 0.022, zf - 0.003, zf + 0.0015, C['chrome']))
    A.append(cyl('spigot', (sc[0], sc[1], 0.796), (sc[0], sc[1], 0.70), 0.019, C['frame'], seg=12))
    A.append(cyl('spigot2', (sc[0], sc[1], 0.70), (sc[0], sc[1], 0.69), 0.016, C['frame'], seg=12))
    # the tap at the back corner behind the sink
    tx, ty = 0.43, 0.213
    A.append(cyl('tapbase', (tx, ty, zw - 0.002), (tx, ty, zw + 0.005), 0.021, C['chrome'], seg=16))
    A.append(cyl('tapbody', (tx, ty, zw + 0.005), (tx, ty, zw + 0.066), 0.0135, C['chrome'], seg=16, r1=0.0125))
    A.append(sphere('tapdome', (tx, ty, zw + 0.066), 0.0125, C['chrome'], scale=(1, 1, 0.55), seg=16, rings=6))
    sp = catmull([(tx, ty, zw + 0.050), (tx, ty - 0.03, zw + 0.060), (tx, ty - 0.08, zw + 0.062), (tx, ty - 0.118, zw + 0.050), (tx, ty - 0.132, zw + 0.030)], n=3)
    A.append(ttube('spout', sp, [0.0080] * len(sp), C['chrome'], seg=10, angle=60))
    A.append(cyl('aerator', (tx, ty - 0.132, zw + 0.032), (tx, ty - 0.133, zw + 0.020), 0.0095, C['chrome'], seg=12))
    A.append(ttube('lever', [(tx, ty + 0.004, zw + 0.072), (tx, ty + 0.03, zw + 0.084), (tx, ty + 0.062, zw + 0.090)], [0.0045, 0.0042, 0.0040], C['chrome'], seg=8, angle=60))
    A.append(box('leverend', tx - 0.009, tx + 0.009, ty + 0.055, ty + 0.072, zw + 0.086, zw + 0.094, C['chrome'], bevel=0.002))
    # the stand: black square steel, rails under the top, X braces on the ends, a low rail at the back, levelling feet
    F = Acc('stand'); M = C['frame']; lx, ly, s = 0.50, 0.235, 0.015; zt = 0.878
    for sx in (-1, 1):
        for sy in (-1, 1):
            abox(F, sx * lx - s, sx * lx + s, sy * ly - s, sy * ly + s, 0.030, zt, M)
            abox(F, sx * lx - s - 0.001, sx * lx + s + 0.001, sy * ly - s - 0.001, sy * ly + s + 0.001, 0.022, 0.034, C['foot'])
    for sy in (-1, 1): abox(F, -lx + s, lx - s, sy * ly - s, sy * ly + s, zt - 0.03, zt, M, skip=('-x', '+x'))
    for sx in (-1, 1):
        abox(F, sx * lx - s, sx * lx + s, -ly + s, ly - s, zt - 0.03, zt, M, skip=('-y', '+y'))
        abox(F, sx * lx - s, sx * lx + s, -ly + s, ly - s, 0.150, 0.180, M, skip=('-y', '+y'))
        for k, (ya, yb) in enumerate(((-ly, ly), (ly, -ly))):
            xo = sx * (lx + (0.004 if k == 0 else -0.004) * sx)
            beam(F, (xo, ya * 0.93, 0.18), (xo, yb * 0.93, zt - 0.03), 0.028, 0.004, M, up=(1, 0, 0))
    abox(F, -lx + s, lx - s, ly - s, ly + s, 0.150, 0.180, M, skip=('-x', '+x'))
    stand = F.done(angle=30)
    for sx in (-1, 1):
        for sy in (-1, 1):
            A.append(cyl('stem', (sx * lx, sy * ly, 0.010), (sx * lx, sy * ly, 0.024), 0.0055, C['chrome'], seg=8))
            A.append(cyl('pad', (sx * lx, sy * ly, 0.0), (sx * lx, sy * ly, 0.011), 0.022, C['foot'], seg=14, r1=0.019))
    A.append(stand)
    o = join(A, 'bord'); weld(o)
    BORD.update({'bord_top': zw, 'bord_work': G((-0.22, -0.03, zw)), 'bord_drop': G((-0.40, hy, 0.9515))})
    return o

# ---------- the stainless gutting bench ----------
BENK = {}
def bench():
    S = C['stain']; A = []
    X0, X1, Y0, Y1, ZT = -0.80, 0.80, -0.35, 0.35, 0.92
    cx0, cx1 = -0.70, -0.36          # the chute's opening in the back upstand
    # the top, its rounded front edge folded down 42 mm with a hem under
    top = [(Y1, ZT - 0.025), (Y1, ZT), (Y0 + 0.010, ZT), (Y0 + 0.004, ZT - 0.0015), (Y0 + 0.0008, ZT - 0.005), (Y0, ZT - 0.010), (Y0, ZT - 0.040),
           (Y0 + 0.003, ZT - 0.043), (Y0 + 0.012, ZT - 0.043), (Y0 + 0.012, ZT - 0.025)]
    A.append(extrude_x('top', top, X0, X1, S))
    # the upstands: along the back (broken by the chute) and the two ends, which slope down to the front
    ups = [(Y1 - 0.02, ZT - 0.005), (Y1, ZT - 0.005), (Y1, ZT + 0.092), (Y1 - 0.003, ZT + 0.0985), (Y1 - 0.010, ZT + 0.100), (Y1 - 0.017, ZT + 0.0985), (Y1 - 0.02, ZT + 0.092)]
    A.append(extrude_x('upb', ups, X0, cx0, S)); A.append(extrude_x('upb', ups, cx1, X1, S))
    endp = [(Y0, ZT - 0.005), (Y1, ZT - 0.005), (Y1, ZT + 0.100), (Y0 + 0.16, ZT + 0.100), (Y0 + 0.01, ZT + 0.035), (Y0, ZT + 0.030)]
    A.append(extrude_x('upe', endp, X1 - 0.02, X1, S)); A.append(extrude_x('upe', endp, X0, X0 + 0.02, S))
    # the chute: a folded sheet from the top's back edge down and out over the rail, 0.33 m out and 0.12 m down
    ya, za, yb, zb = Y1 - 0.02, ZT, Y1 + 0.33, ZT - 0.12
    F = Acc('chute')
    dl = Vector((0, yb - ya, zb - za)); Ln = dl.length; dn = dl.normalized(); nn = Vector((0, -dn.z, dn.y))
    if nn.z < 0: nn = -nn
    cen = Vector(((cx0 + cx1) / 2, (ya + yb) / 2, (za + zb) / 2)) - nn * 0.002
    obox(F, cen, ((cx1 - cx0) / 2 + 0.002, 0, 0), dn * (Ln / 2), nn * 0.002, S)
    lip0 = Vector(((cx0 + cx1) / 2, yb, zb)); obox(F, lip0 + Vector((0, 0.004, -0.012)), ((cx1 - cx0) / 2 + 0.002, 0, 0), (0, 0.002, 0), (0, 0, 0.013), S)
    A.append(F.done(angle=30))
    for xw in (cx0, cx1):
        side = [(ya, za - 0.004), (yb, zb - 0.004), (yb, zb + 0.075), (ya + 0.02, ZT + 0.100), (ya, ZT + 0.100)]
        A.append(extrude_x('chwall', side, xw - 0.002, xw + 0.002, S))
    # the frame: four round legs on bolted foot plates, rails under the top, a lower shelf with upturned edges
    lx, ly = 0.75, 0.30
    for sx in (-1, 1):
        for sy in (-1, 1):
            A.append(cyl('leg', (sx * lx, sy * ly, 0.008), (sx * lx, sy * ly, ZT - 0.025), 0.021, S, seg=14))
            A.append(cyl('plate', (sx * lx, sy * ly, 0.0), (sx * lx, sy * ly, 0.008), 0.045, S, seg=18))
            A.append(cyl('cone', (sx * lx, sy * ly, 0.008), (sx * lx, sy * ly, 0.030), 0.029, S, seg=14, r1=0.021))
            for k in range(3):
                a = math.radians(90 + 120 * k); bx, by = sx * lx + 0.034 * math.cos(a), sy * ly + 0.034 * math.sin(a)
                A.append(cyl('bolt', (bx, by, 0.008), (bx, by, 0.013), 0.0065, S, seg=6))
    for sy in (-1, 1): A.append(box('rail', -lx, lx, sy * ly - 0.02, sy * ly + 0.02, ZT - 0.065, ZT - 0.025, S))
    for sx in (-1, 1): A.append(box('rail', sx * lx - 0.02, sx * lx + 0.02, -ly, ly, ZT - 0.065, ZT - 0.025, S))
    zs = 0.22
    A.append(box('shelf', -lx + 0.022, lx - 0.022, -ly + 0.022, ly - 0.022, zs - 0.02, zs, S))
    for sy in (-1, 1): A.append(box('shup', -lx + 0.022, lx - 0.022, sy * (ly - 0.022) - 0.0015, sy * (ly - 0.022) + 0.0015, zs, zs + 0.025, S))
    for sx in (-1, 1): A.append(box('shup', sx * (lx - 0.022) - 0.0015, sx * (lx - 0.022) + 0.0015, -ly + 0.022, ly - 0.022, zs, zs + 0.025, S))
    for sy in (-1, 1): A.append(box('shrail', -lx, lx, sy * ly - 0.015, sy * ly + 0.015, zs - 0.05, zs - 0.02, S))
    for sx in (-1, 1): A.append(box('shrail', sx * lx - 0.015, sx * lx + 0.015, -ly, ly, zs - 0.05, zs - 0.02, S))
    # a strut under the chute from the back leg
    A.append(tube('strut', [(-lx, ly, 0.56), (-0.53, Y1 + 0.24, zb + 0.024)], 0.010, S, seg=8))
    # the rinse hose's hook on the +x end
    A.append(box('hookplate', X1 - 0.001, X1 + 0.004, 0.07, 0.13, ZT + 0.030, ZT + 0.080, S))
    hp = catmull([(X1 + 0.002, 0.10, ZT + 0.055), (X1 + 0.05, 0.10, ZT + 0.053), (X1 + 0.075, 0.10, ZT + 0.065), (X1 + 0.080, 0.10, ZT + 0.087)], n=4)
    A.append(ttube('hook', hp, [0.0055] * len(hp), S, seg=8, angle=60))
    o = join(A, 'benk')
    BENK.update({'benk_top': ZT, 'benk_work': G((0.10, -0.08, ZT)), 'benk_drop': G(((cx0 + cx1) / 2, yb + 0.004, zb - 0.002))})
    return o

# ---------- the bucket ----------
def bucket():
    B = C['bucket']; p = []
    prof = [(0.112, 0.0), (0.118, 0.0015), (0.1215, 0.006), (0.1225, 0.018), (0.1405, 0.226), (0.1445, 0.229), (0.1455, 0.245), (0.1485, 0.250),
            (0.1530, 0.257), (0.1540, 0.266), (0.1515, 0.2735), (0.1465, 0.2752), (0.1420, 0.2725), (0.1395, 0.262), (0.1165, 0.022), (0.1135, 0.0135),
            (0.1070, 0.0098), (0.060, 0.0095)]
    p.append(lathe_z('pail', prof, B, seg=32, cap0=B, cap1=B, angle=40))
    # the ears for the bail
    for s in (-1, 1):
        p.append(box('ear', min(s * 0.141, s * 0.159), max(s * 0.141, s * 0.159), -0.015, 0.015, 0.222, 0.249, B, bevel=0.003))
    # the bail: steel wire from ear to ear, lying folded down toward Blender -y (the game's +z), with a plastic grip
    phi = math.radians(128); a, hb, zp = 0.166, 0.170, 0.237
    hv = Vector((0, -math.sin(phi), math.cos(phi)))
    arc = lambda th: Vector((a * math.cos(th), 0, zp)) + hv * (hb * math.sin(th) ** 0.85)
    pts = [Vector((0.150, 0, zp))] + [arc(math.pi * k / 24) for k in range(25)] + [Vector((-0.150, 0, zp))]
    p.append(ttube('bail', pts, [0.0028] * len(pts), C['wire'], seg=6, angle=60))
    gp = [arc(math.pi * (0.5 + 0.17 * k / 4 - 0.085)) for k in range(5)]
    p.append(ttube('grip', gp, [0.0105] * len(gp), C['grip'], seg=10, angle=60))
    return join(p, 'botte')

# ---------- measuring, export and renders ----------
def measure(name, A):
    P = A['pos']; lo = [min(q[k] for q in P) for k in range(3)]; hi = [max(q[k] for q in P) for k in range(3)]
    return lo, hi, len(A['idx']) // 3


def main():
    os.makedirs(OUT, exist_ok=True)
    reset(); colours()
    # the tubs (Blender: x across, y along the long axis)
    k460 = tub('kar460', 1.00, 1.20, 0.74, 0.86, 1.06, 0.60, C['tub'])
    k300 = tub('kar300', 0.72, 1.08, 0.66, 0.60, 0.96, 0.52, C['tub'])
    k1000 = tub('kar1000', 1.00, 1.20, 1.00, 0.86, 1.06, 0.86, C['tub'], draft=2.0)
    for o in (k460, k300, k1000): bake_alone(o, samples=32, distance=0.6)
    k460o = recolour(k460, 'kar460o', C['tub'], C['tubo']); k460b = recolour(k460, 'kar460b', C['tub'], C['tubb'])
    TUBS['kar460o'] = TUBS['kar460']; TUBS['kar460b'] = TUBS['kar460']
    vann = water(); isl = ice(); hott = gaff(); kniv = knife(); bord = table(); benk = bench(); botte = bucket()
    bake_alone(botte, samples=32, distance=0.3)
    parts = []
    for o, ao in ((k460, True), (k460o, True), (k460b, True), (k300, True), (k1000, True), (vann, False), (isl, False), (hott, False), (kniv, False),
                  (bord, False), (benk, False), (botte, True)):
        parts.append((o.name, mesh_arrays(o, to_game, to_game_n, ao=ao), 1.0))
    ex = {'frame': 'kystfiske deck gear for the catch: x right, y up, z aft (the long axis of a tub aft, a table\'s or bench\'s along x with the worker at +z); '
                   'every part from its own origin (tools/deck/fisk.py)',
          'tubs': TUBS, 'hott_tip': G(HOTT_TIP), 'hott_len': 0.90, 'kniv_tip': G(KNIV_TIP)}
    ex.update(BORD); ex.update(BENK)
    glb = os.path.join(OUT, 'deck-fish.glb'); n = write_glb(glb, parts, ex)
    open(os.path.join(ROOT, 'src', 'data', 'deck-fish.b64'), 'w').write(base64.b64encode(open(glb, 'rb').read()).decode())
    print('GLB %.1f KB' % (n / 1024))
    for name, A, _ in parts:
        lo, hi, t = measure(name, A)
        print('  %-8s %5d tris  size x %.3f  y %.3f  z %.3f   (x %.3f..%.3f, y %.3f..%.3f, z %.3f..%.3f)' % (name, t, hi[0] - lo[0], hi[1] - lo[1], hi[2] - lo[2], lo[0], hi[0], lo[1], hi[1], lo[2], hi[2]))
    for k, v in ex.items():
        if k != 'frame': print('  %s = %s' % (k, v))
    if FAST: return
    renders({'kar460': k460, 'kar460o': k460o, 'kar460b': k460b, 'kar300': k300, 'kar1000': k1000, 'vann': vann, 'is': isl, 'hott': hott,
             'kniv': kniv, 'bord': bord, 'benk': benk, 'botte': botte})


def renders(O):
    sc = setup_render(1000, 700, samples=16)
    try: sc.cycles.use_denoising = True; sc.cycles.denoiser = 'OPENIMAGEDENOISE'
    except Exception: pass
    sc.world.node_tree.nodes.get('Background').inputs['Color'].default_value = (0.62, 0.70, 0.80, 1)
    bm = bmesh.new(); s = 12
    bm.faces.new([bm.verts.new(q) for q in ((-s, -s, 0), (s, -s, 0), (s, s, 0), (-s, s, 0))])
    deck = obj_from_bm('deck', bm, [mat('deck', (0.36, 0.40, 0.40), 0.25)])
    def show(objs, placed):
        for o in O.values(): o.hide_render = True; o.location = (0, 0, 0); o.rotation_euler = (0, 0, 0); o.scale = (1, 1, 1)
        for o in objs: o.hide_render = False
        for o, loc in placed.items(): o.location = loc
    def shot(nm, loc, look, lens=35):
        camera(loc, look, lens=lens); render(os.path.join(OUT, 'fisk_%s.png' % nm))
    # the three sizes and the three colours side by side, and the bucket
    show([O[k] for k in ('kar300', 'kar460', 'kar460o', 'kar460b', 'kar1000', 'botte')],
         {O['kar300']: (-2.55, 0, 0), O['kar460']: (-1.30, 0, 0), O['kar460o']: (0.0, 0, 0), O['kar460b']: (1.30, 0, 0), O['kar1000']: (2.60, 0, 0), O['botte']: (-0.65, -1.0, 0)})
    shot('kar', (0.9, -5.0, 2.4), (0.0, 0.0, 0.40), 33)
    # a tub close, three quarters
    show([O['kar460']], {}); shot('kar_close', (1.55, -1.75, 1.45), (0.0, 0.0, 0.32), 38)
    shot('kar_low', (1.9, -1.2, 0.30), (0.0, 0.0, 0.25), 38)
    # filled: blood water in the orange one, ice in the blue one (scaled to the inner size at their level, as the game will)
    t = TUBS['kar460']
    def inner_at(y):
        a = (y - t['floor'] - FR) / (t['rim'] - 0.03 - t['floor'] - FR); a = max(0.0, min(1.0, a))
        return (t['in_floor'][0] + (t['in_top'][0] - t['in_floor'][0]) * a, t['in_floor'][1] + (t['in_top'][1] - t['in_floor'][1]) * a)
    show([O['kar460o'], O['kar460b'], O['vann'], O['is']], {O['kar460o']: (-0.65, 0, 0), O['kar460b']: (0.65, 0, 0), O['vann']: (-0.65, 0, 0.50), O['is']: (0.65, 0, 0.42)})
    w, l = inner_at(0.50); O['vann'].scale = (w, l, 1); w, l = inner_at(0.45); O['is'].scale = (w, l, 1)
    shot('kar_fill', (0.4, -2.6, 2.3), (0.0, 0.0, 0.40), 35)
    # the gaff and the knife on the deck (turned on their side for the picture)
    show([O['hott'], O['kniv']], {O['hott']: (0.0, 0.0, 0.025), O['kniv']: (0.22, 0.10, 0.012)})
    O['hott'].rotation_euler = (0, math.radians(90), 0); O['kniv'].rotation_euler = (0, math.radians(90), math.radians(-25))
    shot('hott', (0.55, -0.55, 0.85), (0.08, 0.22, 0.0), 30)
    show([O['hott'], O['kniv']], {O['hott']: (0.0, 0.0, 0.6), O['kniv']: (0.0, 0.42, 0.66)})
    shot('hott_hook', (0.45, 0.42, 0.62), (0.0, 0.53, 0.58), 50)
    shot('kniv', (0.40, 0.50, 0.72), (0.0, 0.495, 0.66), 50)
    # the plastic table and the steel bench
    show([O['bord'], O['botte']], {O['botte']: (-0.75, 0.15, 0)}); shot('bord_3q', (1.55, -1.85, 1.75), (0.0, 0.0, 0.70), 35)
    shot('bord_front', (0.0, -2.6, 1.30), (0.0, 0.0, 0.62), 35)
    show([O['benk']], {}); shot('benk_3q', (1.9, -2.1, 1.85), (-0.1, 0.1, 0.65), 35)
    shot('benk_back', (-1.4, 2.4, 1.7), (-0.3, 0.1, 0.70), 35)


if __name__ == '__main__':
    main()
