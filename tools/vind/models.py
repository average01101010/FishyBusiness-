"""The landmarks of G7 (docs/planer/grafikk-natur-og-miljo.md) built in Blender: a wind turbine of three parts and two kinds of power
line mast. The game scales them to each turbine's hub and rotor and each mast's height (tools/vind/vind.py, view3d/17d-vind.js).

Parts (the game's frame: x to the right, y up, z backwards):
    tower      the turbine's white steel tower, 1 m high from the ground at the origin (scaled by the hub height), with its
               foundation ring
    nacelle    the nacelle and the spinner for a rotor 1 m across (scaled by the rotor): the hub at the origin, the rotor facing +z
               (the game turns it into the wind), the nacelle back along -z
    blades     the three blades in the x-y plane round the hub at the origin (the game spins them about z)
    portal     a steel portal mast for the big lines (66-420 kV), 1 m high: two slanting legs, a cross-arm 0.84 wide with the three
               phases' insulators hanging at x -0.38, 0, 0.38, their ends at y 0.9
    hpole      a wooden H-pole for the lines under 66 kV, 1 m high: two poles and a cross-arm, the phases at x -0.2, 0, 0.2, y 0.95

    pip install bpy==4.5.4 (Python 3.11)
    python3.11 tools/vind/models.py          -> src/data/vind.b64, a render in tools/vind/out/
    python3.11 tools/vind/models.py fast     -> without the render
Blender frame: x right, y forward, z up; to_game(p) = (x, z, -y)."""
import os, sys, math, base64
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))
sys.path.insert(0, os.path.join(ROOT, 'tools', 'boats'))
import bpy, bmesh
from bpyutil import *

OUT = os.path.join(HERE, 'out')
def to_game(p): return (p[0], p[2], -p[1])
def to_game_n(n): return (n[0], n[2], -n[1])

def tower(m, base):
    t = cyl('t', (0, 0, 0), (0, 0, 1.0), 0.045, m, seg=14, r1=0.024)
    f = cyl('f', (0, 0, -0.02), (0, 0, 0.012), 0.11, base, seg=14)
    door = box('d', -0.012, 0.012, -0.0462, -0.04, 0.012, 0.045, base)
    return join([t, f, door], 'tower')

def nacelle(m, dark):
    # the nacelle from the hub back (Blender +y is the game's -z), rounded at the front; the spinner forward of the hub
    n = box('n', -0.022, 0.022, 0.025, 0.14, -0.024, 0.026, m, bevel=0.008, seg=2)
    s = cyl('s', (0, 0.03, 0), (0, -0.045, 0), 0.026, m, seg=14, r1=0.002)
    vent = box('v', -0.012, 0.012, 0.11, 0.135, 0.026, 0.032, dark)
    # the obstacle light's housing on the roof at the back
    l = cyl('l', (0, 0.12, 0.026), (0, 0.12, 0.034), 0.004, dark, seg=6)
    return join([n, s, vent, l], 'nacelle')

def blade(m, a):
    """one blade from the root at r 0.02 to the tip at 0.5, its chord widest a fifth out, twisted and thin; a is its angle in the x-z plane"""
    bm = bmesh.new(); rings = []
    R = [0.02, 0.06, 0.1, 0.16, 0.24, 0.32, 0.4, 0.46, 0.5]
    for r in R:
        t = (r - 0.02) / 0.48; ch = 0.012 + 0.034 * math.sin(math.pi * min(1, t * 2.2 + 0.25)) * (1 - 0.75 * t) if t > 0 else 0.022
        if t == 0: ch = 0.02
        th = 0.25 * ch if t > 0.05 else 0.9 * ch; tw = math.radians(16 * (1 - t))
        pts = []
        for k in range(8):
            u = 2 * math.pi * k / 8; cx = 0.5 * ch * math.cos(u) - 0.15 * ch; cy = 0.5 * th * math.sin(u)
            x = cx * math.cos(tw) - cy * math.sin(tw); y = cx * math.sin(tw) + cy * math.cos(tw)
            pts.append((x, y - 0.03, r))
        rings.append(pts)
    vs = [[bm.verts.new(p) for p in r] for r in rings]
    for i in range(len(vs) - 1):
        for j in range(8): bm.faces.new([vs[i][j], vs[i][(j + 1) % 8], vs[i + 1][(j + 1) % 8], vs[i + 1][j]])
    bm.faces.new(list(reversed(vs[0]))); bm.faces.new(vs[-1])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bmesh.ops.rotate(bm, verts=bm.verts, cent=(0, 0, 0), matrix=__import__('mathutils').Matrix.Rotation(a, 3, 'Y'))
    return shade(obj_from_bm('b', bm, [m]), 40)

def blades(m):
    return join([blade(m, 2 * math.pi * k / 3) for k in range(3)], 'blades')

def portal(steel, glass):
    P = []
    for s in (-1, 1):
        # the legs splay out to the ground (0.42 out at the foot, 0.3 under the cross-arm), square lattice bars
        P.append(cyl('leg', (s * 0.42, 0, 0), (s * 0.3, 0, 1.0), 0.016, steel, seg=4, r1=0.011))
        # the lattice's bracing as a ladder of thin bars across each leg
        for k in range(6):
            z = 0.08 + k * 0.14; x = s * (0.42 - 0.12 * z); P.append(box('br', x - 0.022, x + 0.022, -0.004, 0.004, z, z + 0.008, steel))
    P.append(box('arm', -0.42, 0.42, -0.014, 0.014, 0.96, 1.0, steel))
    P.append(box('arm2', -0.3, 0.3, -0.008, 0.008, 0.9, 0.915, steel))
    for x in (-0.38, 0, 0.38): P.append(cyl('ins', (x, 0, 0.96), (x, 0, 0.9), 0.006, glass, seg=6))
    return join(P, 'portal')

def hpole(wood, glass):
    P = [cyl('p', (s * 0.12, 0, 0), (s * 0.12, 0, 1.0), 0.012, wood, seg=8, r1=0.009) for s in (-1, 1)]
    P.append(box('arm', -0.26, 0.26, -0.008, 0.008, 0.96, 0.98, wood))
    P.append(box('x1', -0.12, 0.12, -0.004, 0.004, 0.55, 0.56, wood))
    for x in (-0.2, 0, 0.2): P.append(cyl('ins', (x, 0, 0.98), (x, 0, 1.0), 0.006, glass, seg=6))
    return join(P, 'hpole')

def main():
    os.makedirs(OUT, exist_ok=True); reset()
    white = mat('white', (0.86, 0.87, 0.86), 0.45); base = mat('base', (0.58, 0.58, 0.56), 0.2); dark = mat('dark', (0.32, 0.33, 0.34), 0.3)
    steel = mat('steel', (0.55, 0.57, 0.58), 0.35); wood = mat('wood', (0.33, 0.25, 0.18), 0.1); glass = mat('glass', (0.42, 0.55, 0.5), 0.6)
    objs = [tower(white, base), nacelle(white, dark), blades(white), portal(steel, glass), hpole(wood, glass)]
    parts = [(o.name, mesh_arrays(o, to_game, to_game_n, ao=False), 1.0) for o in objs]
    ex = {'frame': 'kystfiske landmarks: x right, y up, z back; tower 1 m high, rotor 1 m across about the hub, masts 1 m high'}
    glb = os.path.join(OUT, 'vind.glb'); n = write_glb(glb, parts, ex)
    open(os.path.join(ROOT, 'src', 'data', 'vind.b64'), 'w').write(base64.b64encode(open(glb, 'rb').read()).decode())
    print('vind GLB %.1f KB, %s' % (n / 1024, ', '.join('%s %d' % (p[0], len(p[1]['idx']) // 3) for p in parts)))
    if 'fast' in sys.argv: return
    # a turbine of 90 m hub and 110 m rotor beside a portal of 30 m and a pole of 12 m, as the game puts them
    t, nc, bl, po, hp = objs
    nc.scale = bl.scale = (1.1, 1.1, 1.1); nc.location = bl.location = (0, 0, 0.9); t.scale = (0.9, 0.9, 0.9)
    bl.rotation_euler = (0, 0.3, 0); po.scale = (0.3, 0.3, 0.3); po.location = (0.9, 0.2, 0); hp.scale = (0.12, 0.12, 0.12); hp.location = (1.35, 0.2, 0)
    setup_render(1000, 800, samples=24)
    bpy.context.scene.world.node_tree.nodes.get('Background').inputs['Color'].default_value = (0.62, 0.72, 0.84, 1)
    camera((1.2, -3.2, 0.9), (0.45, 0, 0.55), lens=45); render(os.path.join(OUT, 'vind.png'))

if __name__ == '__main__':
    main()
