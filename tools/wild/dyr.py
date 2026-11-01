"""The animals of the coast for G9 (docs/planer/grafikk-natur-og-miljo.md), built in Blender, low and light (a few hundred triangles
each), coloured by the corner (the TINT attribute, bpyutil mesh_arrays) so one material carries the patterns:
    havorn       the white-tailed eagle (Haliaeetus albicilla), 0.9 m long, 2.3 m across, soaring with the wings flat and the
                 primaries spread as fingers; parts: havorn (the body and tail), havorn_wR, havorn_wL (each wing from its shoulder)
    skarv        the great cormorant (Phalacrocorax carbo), 0.85 m, standing on a skerry: skarv (wings folded) and skarv_tork
                 (wings held out to dry), both from the feet
    ternM, ternF the common eider (Somateria mollissima) on the water, 0.6 m: the drake white and black with the green nape, the
                 duck brown with darker bars; from the waterline
    sauK, sauM   a sheep (the Norwegian spælsau), 1.3 m, standing: white, and grey-black; from the ground
    porpoise     the harbour porpoise (Phocoena phocoena), 1.7 m
    orca         the killer whale (Orcinus orca), a 7 m bull with the 1.6 m dorsal fin, the eye patch, the white belly and the grey saddle
    humpback     the humpback whale (Megaptera novaeangliae), 13 m, with the long white flippers
    fluke        the humpback's flukes for the deep dive (black above, white under), from the tail stock
The whales and the porpoise are from their middle at the waterline of the back, as the game's old meshes were
(view3d/19-wildlife-npc.js). Frames: the game's x right, y up, z backwards (the animal faces -z); in Blender x right, y forward,
z up, to_game(p) = (x, z, -y).
    pip install bpy==4.5.4 (Python 3.11)
    python3.11 tools/wild/dyr.py         -> src/data/dyr.b64, a render in tools/wild/out/dyr.png
    python3.11 tools/wild/dyr.py fast    -> without the render"""
import os, sys, math, base64, random
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))
sys.path.insert(0, os.path.join(ROOT, 'tools', 'boats'))
import bpy, bmesh
from mathutils import Vector as V, Matrix
from bpyutil import *

OUT = os.path.join(HERE, 'out')
def to_game(p): return (p[0], p[2], -p[1])
def to_game_n(n): return (n[0], n[2], -n[1])
WHITE = None

def paint(o, col):
    """the TINT per corner from col(x, y, z) in the object's own frame"""
    me = o.data; a = me.color_attributes.get('TINT') or me.color_attributes.new('TINT', 'FLOAT_COLOR', 'CORNER')
    for poly in me.polygons:
        for li in poly.loop_indices:
            p = me.vertices[me.loops[li].vertex_index].co; c = col(p.x, p.y, p.z); a.data[li].color = (c[0], c[1], c[2], 1.0)
    return o

def loft(name, st, n=10, cap=True):
    """a body along y from stations (y, half width, half height, centre z[, flatten under]); rings of n round an ellipse"""
    bm = bmesh.new(); rings = []
    for s in st:
        y, rx, rz, cz = s[:4]; fl = s[4] if len(s) > 4 else 1.0
        r = []
        for k in range(n):
            a = 2 * math.pi * k / n; cz_ = math.cos(a); z = cz + rz * cz_ * (fl if cz_ < 0 else 1.0)
            r.append(bm.verts.new((rx * math.sin(a), y, z)))
        rings.append(r)
    for i in range(len(rings) - 1):
        for k in range(n): bm.faces.new([rings[i][k], rings[i][(k + 1) % n], rings[i + 1][(k + 1) % n], rings[i + 1][k]])
    if cap:
        for r, rev in ((rings[0], True), (rings[-1], False)):
            c = bm.verts.new(sum((v.co for v in r), V()) / len(r))
            for k in range(n): bm.faces.new((r[(k + 1) % n], r[k], c) if rev else (r[k], r[(k + 1) % n], c))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return shade(obj_from_bm(name, bm, [WHITE]), 50)

def slab(name, poly, z, t, sweep=None):
    """a thin plate from a polygon (x, y) at height z (or z(x, y)), t thick"""
    bm = bmesh.new(); zf = z if callable(z) else (lambda x, y: z)
    top = [bm.verts.new((x, y, zf(x, y) + t / 2)) for x, y in poly]; bot = [bm.verts.new((x, y, zf(x, y) - t / 2)) for x, y in poly]
    bm.faces.new(top); bm.faces.new(list(reversed(bot)))
    for i in range(len(poly)):
        j = (i + 1) % len(poly); bm.faces.new([bot[i], bot[j], top[j], top[i]])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bmesh.ops.triangulate(bm, faces=bm.faces)
    return shade(obj_from_bm(name, bm, [WHITE]), 30)

def fin(name, pts, t):
    """a thin upright fin from a polygon (y, z) in the x = 0 plane"""
    bm = bmesh.new(); a = [bm.verts.new((t / 2, y, z)) for y, z in pts]; b = [bm.verts.new((-t / 2, y, z)) for y, z in pts]
    bm.faces.new(a); bm.faces.new(list(reversed(b)))
    for i in range(len(pts)):
        j = (i + 1) % len(pts); bm.faces.new([b[i], b[j], a[j], a[i]])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces); bmesh.ops.triangulate(bm, faces=bm.faces)
    return shade(obj_from_bm(name, bm, [WHITE]), 30)

def blob(name, c, r, sq, seed, sub=2, jit=0.12):
    bm = bmesh.new(); ret = bmesh.ops.create_icosphere(bm, subdivisions=sub, radius=r); rnd = random.Random(seed)
    for v in ret['verts']:
        s = 1 + rnd.uniform(-jit, jit); v.co = V((c[0] + v.co.x * sq[0] * s, c[1] + v.co.y * sq[1] * s, c[2] + v.co.z * sq[2] * s))
    return shade(obj_from_bm(name, bm, [WHITE]), 60)

def ell(x, y, z, c, r):   # inside an ellipsoid at c with radii r
    return ((x - c[0]) / r[0]) ** 2 + ((y - c[1]) / r[1]) ** 2 + ((z - c[2]) / r[2]) ** 2 < 1

# ---------- the birds ----------
def havorn():
    BR, PALE, WT, YEL, DK = (0.32, 0.23, 0.15), (0.72, 0.64, 0.5), (0.93, 0.92, 0.88), (0.92, 0.75, 0.2), (0.16, 0.12, 0.09)
    b = loft('havorn', [(-0.3, 0.03, 0.02, 0.0), (-0.18, 0.08, 0.06, 0.0), (0.0, 0.11, 0.09, 0.0), (0.18, 0.08, 0.07, 0.01), (0.3, 0.055, 0.055, 0.03), (0.37, 0.04, 0.04, 0.03), (0.44, 0.012, 0.025, 0.015)])
    tail = slab('tail', [(-0.1, -0.28), (0.1, -0.28), (0.13, -0.5), (0.0, -0.53), (-0.13, -0.5)], 0.0, 0.015)
    b = join([b, tail], 'havorn')
    paint(b, lambda x, y, z: WT if y < -0.27 else YEL if y > 0.4 else PALE if y > 0.24 else BR)
    def wing(s):
        # the broad plank of a wing with the primaries spread as six fingers at the tip, flat with a little dihedral
        P = [(0.06, 0.12), (0.5, 0.15), (0.82, 0.12)]
        for k in range(6): a = 0.12 - k * 0.07; P += [(0.98 + 0.12 * math.cos(k * 0.25), a + 0.02), (0.96 + 0.1 * math.cos(k * 0.25), a - 0.03)]
        P += [(0.8, -0.24), (0.45, -0.2), (0.06, -0.13)]
        P = [(x * s, y) for x, y in P]
        if s < 0: P = list(reversed(P))
        w = slab('wing', P, lambda x, y: 0.06 * abs(x) ** 1.3, 0.018)
        return paint(w, lambda x, y, z: DK if abs(x) > 0.8 else BR)
    return [b, wing(1), wing(-1)]

def skarv(dry):
    BK, GL, WH, YEL = (0.06, 0.07, 0.07), (0.1, 0.13, 0.12), (0.88, 0.88, 0.85), (0.8, 0.65, 0.25)
    # upright on its feet, the body tilted up, the neck and head over it
    body = loft('skarv', [(-0.02, 0.03, 0.03, 0.1), (0.0, 0.1, 0.09, 0.25), (0.04, 0.12, 0.12, 0.42), (0.05, 0.1, 0.1, 0.56), (0.06, 0.05, 0.05, 0.66), (0.07, 0.035, 0.035, 0.74), (0.1, 0.045, 0.04, 0.8), (0.17, 0.02, 0.02, 0.8), (0.24, 0.008, 0.01, 0.79)])
    tail = slab('t', [(-0.045, -0.02), (0.045, -0.02), (0.035, -0.12), (-0.035, -0.12)], lambda x, y: 0.2 + y * 1.2, 0.012)
    legs = [cyl('l', (s * 0.05, 0.02, 0.0), (s * 0.05, 0.02, 0.18), 0.012, WHITE, seg=5) for s in (-1, 1)]
    parts = [body, tail] + legs
    if dry:
        for s in (-1, 1):
            P = [(0.08, 0.6), (0.45, 0.55), (0.5, 0.4), (0.42, 0.28), (0.1, 0.42)]
            parts.append(fin('w', [(0.02, z) for x, z in P], 0.01))   # placeholder replaced below
            parts[-1].data.transform(Matrix.Identity(4))
            bm = bmesh.new(); vs = [bm.verts.new((s * x, 0.05, z)) for x, z in P]; vs2 = [bm.verts.new((s * x, 0.06, z)) for x, z in P]
            bm.faces.new(vs); bm.faces.new(list(reversed(vs2)))
            for i in range(len(P)): j = (i + 1) % len(P); bm.faces.new([vs2[i], vs2[j], vs[j], vs[i]])
            bmesh.ops.recalc_face_normals(bm, faces=bm.faces); bmesh.ops.triangulate(bm, faces=bm.faces)
            bpy.data.objects.remove(parts.pop(), do_unlink=True); parts.append(shade(obj_from_bm('w', bm, [WHITE]), 30))
    o = join(parts, 'skarv_tork' if dry else 'skarv')
    paint(o, lambda x, y, z: YEL if y > 0.16 and z > 0.76 else WH if (0.72 < z < 0.8 and 0.05 < y < 0.12 and abs(x) > 0.02) else GL if z > 0.5 and abs(x) < 0.3 else BK)
    return o

def eider(male):
    W, BK, GR, PK, BRN, BRD, BL = (0.94, 0.94, 0.9), (0.05, 0.05, 0.06), (0.55, 0.75, 0.5), (0.95, 0.85, 0.75), (0.5, 0.36, 0.22), (0.3, 0.2, 0.12), (0.45, 0.5, 0.35)
    b = loft('tern', [(-0.3, 0.03, 0.03, 0.06), (-0.22, 0.12, 0.08, 0.05, 0.5), (-0.05, 0.16, 0.1, 0.05, 0.5), (0.12, 0.13, 0.09, 0.07, 0.5), (0.2, 0.06, 0.06, 0.14), (0.22, 0.05, 0.06, 0.2), (0.27, 0.045, 0.05, 0.22), (0.32, 0.03, 0.03, 0.2), (0.38, 0.012, 0.015, 0.19)])
    rnd = random.Random(5)
    if male: col = lambda x, y, z: BL if y > 0.32 else BK if (z > 0.24 and y > 0.2) else GR if (y > 0.18 and z > 0.17 and y < 0.26 and z < 0.23 and abs(x) > 0.02) else BK if (z < 0.05 or y < -0.17) else PK if (y > 0.08 and z < 0.12) else W
    else: col = lambda x, y, z: BL if y > 0.32 else (BRD if (math.sin(y * 70 + x * 30) > 0.4) else BRN)
    paint(b, col); b.name = b.data.name = 'ternM' if male else 'ternF'
    return b

def sheep(dark):
    WO, WD, FACE, FD, LEG = (0.86, 0.84, 0.78), (0.24, 0.22, 0.21), (0.9, 0.88, 0.83), (0.12, 0.11, 0.1), (0.18, 0.16, 0.14)
    body = blob('b', (0, 0, 0.64), 0.36, (1.05, 1.7, 0.85), 3 if dark else 7)
    head = loft('h', [(0.48, 0.07, 0.08, 0.8), (0.58, 0.095, 0.11, 0.78), (0.7, 0.08, 0.09, 0.72), (0.8, 0.05, 0.055, 0.66)], n=8)
    ears = [slab('e', [(s * 0.07, 0.58), (s * 0.17, 0.56), (s * 0.17, 0.53), (s * 0.07, 0.54)], 0.84, 0.012) for s in (-1, 1)]
    legs = [cyl('l', (sx * 0.16, sy, 0.0), (sx * 0.16, sy, 0.42), 0.04, WHITE, seg=6, r1=0.05) for sx in (-1, 1) for sy in (-0.36, 0.36)]
    o = join([body, head] + ears + legs, 'sauM' if dark else 'sauK')
    wool = WD if dark else WO
    paint(o, lambda x, y, z: LEG if z < 0.36 else (FD if dark else FACE) if y > 0.55 else wool)
    return o

# ---------- the whales ----------
def porpoise():
    DK, LT = (0.2, 0.22, 0.25), (0.6, 0.62, 0.64)
    b = loft('porpoise', [(-0.85, 0.02, 0.03, 0.0), (-0.65, 0.07, 0.09, 0.0), (-0.3, 0.2, 0.23, 0.0), (0.1, 0.27, 0.28, 0.0), (0.5, 0.23, 0.24, 0.0), (0.75, 0.14, 0.15, 0.0), (0.85, 0.06, 0.07, -0.02)], n=12)
    d = fin('d', [(-0.1, 0.24), (0.15, 0.24), (0.02, 0.44)], 0.04)
    fl = slab('f', [(0, -0.82), (0.32, -0.95), (0.3, -1.0), (0, -0.9), (-0.3, -1.0), (-0.32, -0.95)], 0.0, 0.03)
    o = join([b, d, fl], 'porpoise'); paint(o, lambda x, y, z: LT if z < -0.1 else DK); return o

def orca():
    BK, WH, GR = (0.04, 0.04, 0.05), (0.93, 0.93, 0.9), (0.5, 0.52, 0.55)
    st = [(-3.5, 0.08, 0.12, 0.0), (-3.0, 0.25, 0.35, 0.0), (-2.0, 0.62, 0.72, 0.0), (-0.6, 0.9, 0.95, 0.0), (0.6, 0.95, 0.98, 0.0), (1.8, 0.82, 0.85, -0.05), (2.8, 0.55, 0.55, -0.12), (3.4, 0.25, 0.28, -0.2), (3.55, 0.05, 0.08, -0.22)]
    b = loft('orca', st, n=14)
    d = fin('d', [(-0.5, 0.9), (0.5, 0.92), (0.05, 2.5), (-0.05, 2.45)], 0.12)
    fl = slab('f', [(0, -3.3), (1.1, -3.9), (1.05, -4.15), (0, -3.85), (-1.05, -4.15), (-1.1, -3.9)], 0.0, 0.1)
    pec = [slab('p', [(s * 0.7, 1.6), (s * 1.6, 1.0), (s * 1.5, 0.6), (s * 0.7, 1.1)], -0.6, 0.08) for s in (-1, 1)]
    o = join([b, d, fl] + pec, 'orca')
    def col(x, y, z):
        if ell(abs(x), y, z, (0.5, 2.2, 0.25), (0.45, 0.65, 0.2)): return WH            # the eye patch
        if z < -0.35 and y > -1.2: return WH                                              # the belly and chin
        if z < -0.25 and -2.6 < y < -1.4 and abs(x) > 0.3: return WH                      # the flank's white sweep
        if z > 0.7 and -1.4 < y < -0.4: return GR                                         # the saddle behind the fin
        return BK
    paint(o, col); return o

def humpback():
    DK, WH, MID = (0.12, 0.13, 0.15), (0.88, 0.88, 0.86), (0.35, 0.36, 0.38)
    st = [(-6.5, 0.15, 0.2, 0.0), (-5.5, 0.4, 0.5, 0.0), (-3.5, 1.1, 1.2, -0.05), (-1.0, 1.6, 1.55, -0.1), (1.5, 1.6, 1.5, -0.15), (3.5, 1.3, 1.15, -0.2), (5.2, 0.9, 0.7, -0.3), (6.3, 0.5, 0.35, -0.35), (6.6, 0.2, 0.15, -0.4)]
    b = loft('humpback', st, n=14)
    d = fin('d', [(-2.8, 1.0), (-1.8, 1.1), (-2.4, 1.5)], 0.25)
    fl = slab('f', [(0, -6.3), (2.2, -7.2), (2.0, -7.6), (0, -7.0), (-2.0, -7.6), (-2.2, -7.2)], 0.0, 0.15)
    pec = [slab('p', [(s * 1.3, 3.2), (s * 5.0, 1.0), (s * 4.9, 0.6), (s * 1.3, 2.4)], -0.9, 0.18) for s in (-1, 1)]
    o = join([b, d, fl] + pec, 'humpback')
    paint(o, lambda x, y, z: WH if abs(x) > 1.4 and z < -0.5 else MID if z < -0.9 else DK); return o

def fluke():
    DK, WH = (0.1, 0.11, 0.12), (0.85, 0.85, 0.83)
    stock = loft('s', [(1.6, 0.5, 0.55, 0.0), (0.6, 0.35, 0.4, 0.0), (0.0, 0.2, 0.25, 0.0)], n=10)
    f = slab('f', [(0, 0.1), (1.2, -0.6), (2.35, -1.2), (2.2, -1.4), (1.0, -1.15), (0.2, -1.3), (0, -1.0), (-0.2, -1.3), (-1.0, -1.15), (-2.2, -1.4), (-2.35, -1.2), (-1.2, -0.6)], 0.0, 0.12)
    o = join([stock, f], 'fluke'); paint(o, lambda x, y, z: WH if z < -0.02 and y < 0 else DK); return o

def main():
    global WHITE
    os.makedirs(OUT, exist_ok=True); reset(); WHITE = mat('white', (1.0, 1.0, 1.0), 0.25)
    objs = havorn() + [skarv(False), skarv(True), eider(True), eider(False), sheep(False), sheep(True), porpoise(), orca(), humpback(), fluke()]
    names = ['havorn', 'havorn_wR', 'havorn_wL', 'skarv', 'skarv_tork', 'ternM', 'ternF', 'sauK', 'sauM', 'porpoise', 'orca', 'humpback', 'fluke']
    for o, nm in zip(objs, names): o.name = o.data.name = nm
    parts = [(o.name, mesh_arrays(o, to_game, to_game_n, ao=False), 1.0) for o in objs]
    glb = os.path.join(OUT, 'dyr.glb'); n = write_glb(glb, parts, {'frame': 'kystfiske animals: x right, y up, z back (they face -z)'})
    open(os.path.join(ROOT, 'src', 'data', 'dyr.b64'), 'w').write(base64.b64encode(open(glb, 'rb').read()).decode())
    print('dyr GLB %.1f KB, %s' % (n / 1024, ', '.join('%s %d' % (p[0], len(p[1]['idx']) // 3) for p in parts)))
    if 'fast' in sys.argv: return
    lay = {'havorn': (-3.0, 0, 1.6), 'havorn_wR': (-3.0, 0, 1.6), 'havorn_wL': (-3.0, 0, 1.6), 'skarv': (-2.2, 0, 0), 'skarv_tork': (-1.5, 0, 0), 'ternM': (-0.6, 0, 0), 'ternF': (0.1, 0, 0),
           'sauK': (1.1, 0, 0), 'sauM': (2.6, 0, 0), 'porpoise': (4.5, 0, 0.3)}
    for o in objs:
        if o.name in lay: o.location = lay[o.name]; o.rotation_euler = (0, 0, math.radians(-60))
        else: o.hide_render = True
    setup_render(1600, 700, samples=24)
    bpy.context.scene.world.node_tree.nodes.get('Background').inputs['Color'].default_value = (0.62, 0.72, 0.84, 1)
    camera((0.4, -10.5, 3.0), (0.4, 0, 0.7), lens=42); render(os.path.join(OUT, 'dyr.png'))
    for o in objs: o.hide_render = o.name not in ('orca', 'humpback', 'fluke')
    for nm, at in (('orca', (-9, 0, 0)), ('humpback', (4, 0, 0)), ('fluke', (14, 0, 1))): bpy.data.objects[nm].location = at; bpy.data.objects[nm].rotation_euler = (0, 0, math.radians(-70))
    camera((2.5, -30.0, 8.0), (2.5, 0, 0), lens=50); render(os.path.join(OUT, 'hval.png'))

if __name__ == '__main__':
    main()
