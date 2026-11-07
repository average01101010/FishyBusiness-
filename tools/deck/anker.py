"""The boats' own anchors and their chain, built in Blender (Jonas 21.10.2026: «Lag også en blendermodell av ankeret til båtene, samt
en animasjon for utsett og opptak av ankeret»). The game scales each anchor to the boat's size and draws the chain or the rope itself
(view3d.js drawAnchor); every boat carries one (it is the ship's own, not bought gear, core/06e-anchor.js).

    plog    a plough anchor of the Delta kind for the boats up to about 15 m (the usual bower on Norwegian sjarks and coastal boats
            with a bow roller): a flat-bar shank curving down to a plough-shaped fluke whose ridge runs from the heel to a ballasted
            toe under the shank, the wings drooping to its sides, and a D-shackle at the eye. Modelled 1.00 m long over all for 20 kg;
            the game scales it by the cube root of the mass. Galvanised.
    hall    a stockless anchor of the Hall kind for the boats that stow theirs in a hawse pipe (from about 15 m): a tapered square shank
            with a big anchor shackle at the top, the crown (head) with its pivot pin and tripping palms, and two flukes side by side
            turned 40 degrees off the shank, as when it is dug in. Modelled for 1000 kg (1.62 m over all); scaled the same way. Black.
    link    a studless chain link and
    stud    a stud-link (with the crossbar) for the large ones, both at a wire size of 1 (the game scales them to the chain's size in
            metres): 6 long and 3.6 wide over all, the pitch (the inner length, the spacing from link to link) 4. The studless galvanised,
            the stud-link black.

Each anchor from the middle of its shackle's bow, where the chain is made fast (the origin), the shank running from there along +z to
the crown, its upper side +y. The links from their middle, lying along z in the x-z plane.

What I chose myself: the proportions of both anchors (from pictures of the common kinds, no maker's drawing), the 40 degree fluke angle,
the colours, the shackles' sizes and the chain's proportions (the usual 6d by 3.6d for both). No brand names on anything.

    pip install bpy==4.5.4
    python3 tools/deck/anker.py         -> src/data/deck-anchor.b64, renders tools/deck/out/anker_*.png
    python3 tools/deck/anker.py fast    -> without the renders

Frames. Here in Blender: x to the right, y forward, z up. The game's: x right, y up, z aft; to_game(p) = (x, z, -y). The points below are
written in the game's frame and taken to Blender by gb()."""
import os, sys, math, base64
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))
sys.path.insert(0, os.path.join(ROOT, 'tools', 'boats'))
import bpy, bmesh
from mathutils import Vector, Matrix
from bpyutil import *

OUT = os.path.join(HERE, 'out')
def to_game(p): return (p[0], p[2], -p[1])
def to_game_n(n): return (n[0], n[2], -n[1])
def gb(x, y, z): return V((x, -z, y))            # a point in the game's frame, in Blender's
def G(p): return [round(v, 4) for v in to_game(p)]

C = {}
def colours():
    C['galv'] = mat('galv', (0.60, 0.62, 0.62), 0.45, metal=0.6)
    C['galv2'] = mat('galv2', (0.52, 0.54, 0.54), 0.35, metal=0.6)
    C['black'] = mat('black', (0.06, 0.06, 0.065), 0.35)
    C['blk2'] = mat('blk2', (0.10, 0.09, 0.085), 0.25)
    C['chainb'] = mat('chainb', (0.11, 0.10, 0.09), 0.3, metal=0.3)

# ---------- helpers ----------
def extrude(A, poly_zy, x0, x1, m):
    """a flat plate: the polygon [(z, y)] in the game's frame between x0 and x1"""
    a = [A.v(gb(x0, y, z)) for z, y in poly_zy]; b = [A.v(gb(x1, y, z)) for z, y in poly_zy]; n = len(poly_zy)
    A.f(a, m, gb(-1, 0, 0)); A.f(b, m, gb(1, 0, 0))
    cz = sum(z for z, _ in poly_zy) / n; cy = sum(y for _, y in poly_zy) / n
    for k in range(n):
        k1 = (k + 1) % n; z, y = poly_zy[k]; z1, y1 = poly_zy[k1]
        A.f([a[k], a[k1], b[k1], b[k]], m, gb(0, (y + y1) / 2 - cy, (z + z1) / 2 - cz))

def shell(A, top, bot, m):
    """a closed thin body from two grids of points (rows along, columns across) that meet round their edges"""
    nr, nc = len(top), len(top[0])
    T = [[A.v(p) for p in row] for row in top]; B = [[A.v(p) for p in row] for row in bot]
    for i in range(nr - 1):
        for j in range(nc - 1):
            A.f([T[i][j], T[i][j + 1], T[i + 1][j + 1], T[i + 1][j]], m, (T[i][j].co - B[i][j].co))
            A.f([B[i][j], B[i + 1][j], B[i + 1][j + 1], B[i][j + 1]], m, (B[i][j].co - T[i][j].co))
    mid = sum((v.co for row in T for v in row), V()) / (nr * nc)
    ring = [(i, 0) for i in range(nr)] + [(nr - 1, j) for j in range(1, nc)] + [(i, nc - 1) for i in range(nr - 2, -1, -1)] + [(0, j) for j in range(nc - 2, 0, -1)]
    for k in range(len(ring)):
        (i, j), (i1, j1) = ring[k], ring[(k + 1) % len(ring)]
        A.f([T[i][j], T[i1][j1], B[i1][j1], B[i][j]], m, (T[i][j].co + T[i1][j1].co) / 2 - mid)

def slab(A, p0, d, up, L, w0, w1, t0, t1, m, n=6):
    """a tapered bar from p0 along d (length L), w across (perpendicular to d and up), t along up; rounded off at the far end"""
    p0 = V(p0); d = V(d).normalized(); up = V(up); up = (up - d * up.dot(d)).normalized(); s = d.cross(up)
    rows = []
    for i in range(n + 1):
        f = i / n; c = p0 + d * (L * f); w = w0 + (w1 - w0) * f; t = t0 + (t1 - t0) * f
        if i == n: w *= 0.55; t *= 0.6
        rows.append([A.v(c + s * (w / 2 * a) + up * (t / 2 * b)) for a, b in ((-1, -1), (1, -1), (1, 1), (-1, 1))])
    for i in range(n):
        for k in range(4):
            k1 = (k + 1) % 4; q = rows[i]; r = rows[i + 1]
            A.f([q[k], q[k1], r[k1], r[k]], m, (q[k].co + q[k1].co) / 2 - (p0 + d * (L * (i + 0.5) / n)))
    A.f(rows[0], m, -d); A.f(rows[-1], m, d)

def dshackle(A, ez, R, r, pin, m, up=1.0):
    """a D-shackle through an eye at z = ez: the pin along x, the bow round towards -z (the chain's end at z = ez - R)"""
    acyl(A, gb(-pin, 0, ez), gb(pin, 0, ez), r * 0.9, lambda z: m, seg=10)
    for sx in (-1, 1): revolve(A, [(0.0, 0.0, m), (r * 1.5, 0.0, m), (r * 1.5, r * 0.8, m), (0.0, r * 0.8, m)], gb(sx * pin, 0, ez), gb(sx, 0, 0) - gb(0, 0, 0), seg=8)
    pts = [gb(math.cos(a) * R * 0.92, 0, ez - math.sin(a) * R) for a in [math.pi * k / 14 for k in range(15)]]
    atube(A, pts, r, lambda i: m, 10)

def revolve(A, prof, c, ax, seg=16):
    c = V(c); ax = V(ax).normalized(); s, u, _ = frame_of(ax)
    dirs = [s * math.cos(2 * math.pi * k / seg) + u * math.sin(2 * math.pi * k / seg) for k in range(seg)]
    rings = [A.v(c + ax * h) if r <= 1e-9 else [A.v(c + ax * h + d * r) for d in dirs] for r, h, m in prof]
    for i in range(len(prof) - 1):
        a, b = rings[i], rings[i + 1]; m = prof[i][2]; mid = c + ax * ((prof[i][1] + prof[i + 1][1]) / 2)
        if isinstance(a, list) and isinstance(b, list):
            for k in range(seg): k1 = (k + 1) % seg; A.f([a[k], a[k1], b[k1], b[k]], m, (a[k].co + b[k1].co) / 2 - mid)
        elif isinstance(a, list):
            for k in range(seg): k1 = (k + 1) % seg; A.f([a[k], a[k1], b], m, ax * (prof[i + 1][1] - prof[i][1]))
        elif isinstance(b, list):
            for k in range(seg): k1 = (k + 1) % seg; A.f([a, b[k1], b[k]], m, ax * (prof[i][1] - prof[i + 1][1]))

def frames(pts):
    P = [V(p) for p in pts]; n = len(P); T = []
    for i in range(n):
        a = P[max(0, i - 1)]; b = P[min(n - 1, i + 1)]; T.append((b - a).normalized())
    ref = V((0, 0, 1)) if abs(T[0].z) < 0.9 else V((1, 0, 0))
    N = [(ref - T[0] * ref.dot(T[0])).normalized()]
    for i in range(1, n):
        v = N[-1] - T[i] * N[-1].dot(T[i]); N.append(v.normalized() if v.length > 1e-9 else N[-1])
    return P, T, N, [T[i].cross(N[i]) for i in range(n)]

def atube(A, pts, r, mf, seg=6, closed=False):
    P, T, N, B = frames(pts); n = len(P)
    R = [[A.v(P[i] + (N[i] * math.cos(2 * math.pi * k / seg) + B[i] * math.sin(2 * math.pi * k / seg)) * r) for k in range(seg)] for i in range(n)]
    for i in range(n if closed else n - 1):
        j = (i + 1) % n
        for k in range(seg):
            k1 = (k + 1) % seg; A.f([R[i][k], R[i][k1], R[j][k1], R[j][k]], mf(i), (R[i][k].co + R[j][k1].co) / 2 - (P[i] + P[j]) / 2)
    if not closed: A.f(list(R[0]), mf(0), -T[0]); A.f(list(R[-1]), mf(n - 2), T[-1])

# ---------- the plough anchor ----------
PL_L = 1.00; PL_KG = 20.0; PL_EZ = 0.034
def plog():
    A = Acc('plog'); M = C['galv']; M2 = C['galv2']
    # the shank: flat bar, curving down to the fluke's ridge behind the middle; the eye end rounded
    yc = lambda z: -0.05 * (z / 0.8) ** 2
    hh = lambda z: 0.085 + 0.060 * min(1, z / 0.8)
    vz = lambda z: (z - 0.36) / 0.60
    ridge = lambda v: -0.36 + 0.26 * v
    top = [(z, yc(z) + hh(z) / 2) for z in [0.92 * k / 14 for k in range(15)]]
    keel = [(0.92, ridge(vz(0.92)) + 0.004), (0.75, ridge(vz(0.75)) + 0.004), (0.58, ridge(vz(0.58)) + 0.004)]
    bottom = [(z, yc(z) - hh(z) / 2) for z in [0.58 - 0.58 * k / 8 for k in range(1, 9)]]
    cap = [(-math.sin(a) * hh(0) / 2, yc(0) + math.cos(a) * hh(0) / 2) for a in [math.pi * k / 6 for k in range(1, 6)]]
    poly = list(reversed(top)) + cap  # eye end to the heel along the top, then round
    poly = [(z, y) for z, y in top] + keel + bottom + [(z, y) for z, y in reversed(cap)]
    extrude(A, poly, -0.017, 0.017, M)
    # the fluke: a plough share from the ballasted toe under the shank to the heel, its ridge on the middle and the wings drooping
    T, B = [], []
    for i in range(13):
        v = i / 12; z = 0.36 + 0.60 * v; w = max(0.012, 0.25 * v ** 0.8); th = 0.016 + 0.045 * (1 - v) ** 3
        rt, rb = [], []
        for j in range(11):
            u = -1 + 2 * j / 10; x = u * w; y = ridge(v) - 0.55 * w * abs(u) ** 1.3 + 0.03 * v * (1 - u * u)
            rt.append(gb(x, y, z)); rb.append(gb(x, y - th * (1 - 0.35 * abs(u)), z))
        T.append(rt); B.append(rb)
    shell(A, T, B, M2)
    dshackle(A, PL_EZ, 0.046, 0.011, 0.030, M)
    return A.done(30)

# ---------- the stockless (Hall) anchor ----------
HA_KG = 1000.0; HA_EZ = 0.11; HA_CZ = 1.36
def hall():
    A = Acc('hall'); M = C['black']; M2 = C['blk2']
    # the shank, tapered square, from the eye to the crown
    slab(A, gb(0, 0, HA_EZ + 0.04), gb(0, 0, 1) - gb(0, 0, 0), gb(0, 1, 0) - gb(0, 0, 0), HA_CZ - HA_EZ - 0.10, 0.085, 0.115, 0.10, 0.13, M, n=4)
    # the eye at the top (a thick ring the shackle goes through)
    atorus(A, gb(0, 0, HA_EZ + 0.02), gb(1, 0, 0) - gb(0, 0, 0), 0.055, 0.03, lambda a: M, seg=14, rseg=6)
    dshackle(A, HA_EZ - 0.02, 0.10, 0.028, 0.085, M2)
    # the crown: the head with its pivot pin, rounded, the tripping palms under it
    obox(A, gb(0, -0.02, HA_CZ + 0.02), gb(0.18, 0, 0) - gb(0, 0, 0), gb(0, 0.09, 0) - gb(0, 0, 0), gb(0, 0, 0.11) - gb(0, 0, 0), M)
    acyl(A, gb(-0.36, 0, HA_CZ), gb(0.36, 0, HA_CZ), 0.06, lambda z: M2, seg=12)
    for sx in (-1, 1):
        obox(A, gb(sx * 0.16, -0.12, HA_CZ - 0.02), gb(0.05, 0, 0) - gb(0, 0, 0), gb(0, 0.05, 0) - gb(0, 0, 0), gb(0, 0, 0.10) - gb(0, 0, 0), M2)
    # the flukes, side by side, turned 40 degrees off the shank towards -y (as dug in), each a tapered arm widening to its palm
    a = math.radians(40); d = gb(0, -math.sin(a), -math.cos(a)) - gb(0, 0, 0); n = gb(0, math.cos(a), -math.sin(a)) - gb(0, 0, 0)
    for sx in (-1, 1):
        p0 = gb(sx * 0.22, 0, HA_CZ)
        slab(A, p0, d, n, 0.80, 0.24, 0.28, 0.24, 0.06, M, n=6)
        # the palm's point
        slab(A, p0 + d * 0.78, d, n, 0.16, 0.27, 0.05, 0.065, 0.025, M, n=3)
    return A.done(30)

# ---------- the chain ----------
def chainlink(name, stud, m):
    A = Acc(name); r = 0.5; Rr = 1.3; s = 1.2
    pts = []
    for k in range(24):
        a = 2 * math.pi * k / 24
        if a < math.pi: z = s + Rr * math.sin(a); x = Rr * math.cos(a)
        else: z = -s + Rr * math.sin(a); x = Rr * math.cos(a)
        pts.append((x, z))
    # the straight sides between the round ends
    P = []
    for k in range(24):
        a = 2 * math.pi * k / 24; x, z = pts[k]; P.append(gb(x, 0, z))
        if k == 11: P += [gb(-Rr, 0, s - 2 * s * f) for f in (0.33, 0.67)]
        if k == 23: P += [gb(Rr, 0, -s + 2 * s * f) for f in (0.33, 0.67)]
    atube(A, P, r, lambda i: m, 8, closed=True)
    if stud: acyl(A, gb(-Rr + 0.3, 0, 0), gb(Rr - 0.3, 0, 0), 0.30, lambda z: m, seg=8)
    return A.done(40)

# ---------- the export ----------
def main():
    os.makedirs(OUT, exist_ok=True)
    reset(); colours()
    objs = {'plog': plog(), 'hall': hall(), 'link': chainlink('link', False, C['galv']), 'stud': chainlink('stud', True, C['chainb'])}
    setup_render(64, 64, samples=8)
    for nm, o in objs.items():
        for p in bpy.context.scene.objects:
            if p.type == 'MESH': p.hide_render = p is not o
        bake_ao(o, samples=16, distance=0.08 if nm == 'plog' else 0.15 if nm == 'hall' else 0.6)
    for p in bpy.context.scene.objects:
        if p.type == 'MESH': p.hide_render = False
    parts = [(nm, mesh_arrays(o, to_game, to_game_n, ao=True), 1.0) for nm, o in objs.items()]
    def size(o):
        P = [to_game(o.matrix_world @ v.co) for v in o.data.vertices]
        return [min(p[k] for p in P) for k in range(3)], [max(p[k] for p in P) for k in range(3)]
    sz = {nm: size(o) for nm, o in objs.items()}
    r4 = lambda v: round(v, 4)
    ex = {'frame': 'kystfiske anchors: metres, x right, y up, z aft; each anchor from its shackle bow (where the chain is made fast), the shank along +z, '
                   'its upper side +y; the links from their middle along z in the x-z plane, at a wire size of 1',
          'plog': {'kg': PL_KG, 'len': PL_L, 'crown': [0, -0.30, 0.66]},
          'hall': {'kg': HA_KG, 'len': r4(sz['hall'][1][2] - sz['hall'][0][2]), 'crown': [0, 0, HA_CZ]},
          'link': {'pitch': 4.0, 'w': 3.6}, 'stud': {'pitch': 4.0, 'w': 3.6},
          'size': {nm: [r4(hi[k] - lo[k]) for k in range(3)] for nm, (lo, hi) in sz.items()}}
    glb = os.path.join(OUT, 'deck-anchor.glb'); nb = write_glb(glb, parts, ex)
    open(os.path.join(ROOT, 'src', 'data', 'deck-anchor.b64'), 'w').write(base64.b64encode(open(glb, 'rb').read()).decode())
    print('anchor GLB %.1f KB' % (nb / 1024))
    for nm, A, _ in parts:
        lo, hi = sz[nm]
        print('  %-5s %5d tris  x %.3f..%.3f  y %.3f..%.3f  z %.3f..%.3f' % (nm, len(A['idx']) // 3, lo[0], hi[0], lo[1], hi[1], lo[2], hi[2]))
    if 'fast' in sys.argv: return
    # renders: each anchor on its own from the side and from the quarter, the chain links in a short length
    sc = setup_render(900, 640, samples=24)
    def show(*keep):
        for p in bpy.context.scene.objects:
            if p.type == 'MESH': p.hide_render = p not in keep
    P, H, Lk, St = objs['plog'], objs['hall'], objs['link'], objs['stud']
    show(P); camera(gb(1.25, 0.55, 0.15), gb(0, -0.15, 0.48), lens=40); render(os.path.join(OUT, 'anker_plog.png'))
    camera(gb(0.05, 0.05, 0.5 + 1.6), gb(0, -0.15, 0.48), lens=40); render(os.path.join(OUT, 'anker_plog_side.png'))
    show(H); camera(gb(2.2, 0.9, 0.4), gb(0, -0.2, 0.85), lens=40); render(os.path.join(OUT, 'anker_hall.png'))
    camera(gb(2.6, 0.1, 0.8), gb(0, -0.2, 0.8), lens=40); render(os.path.join(OUT, 'anker_hall_side.png'))
    # a length of chain: links alternating a quarter turn
    keep = []
    for i, (src, nm) in enumerate(((Lk, 'l'), (St, 's'))):
        for k in range(5):
            o = src.copy(); o.data = src.data; bpy.context.scene.collection.objects.link(o)
            o.location = gb(i * 6 - 3, 0, k * 4.0 - 8); o.rotation_euler = (0, math.pi / 2 if k % 2 else 0, 0); keep.append(o)
    show(*keep); camera(gb(10, 9, 14), gb(0, 0, 0), lens=40); render(os.path.join(OUT, 'anker_kjetting.png'))

main()
