"""The near field on land for G8 (docs/planer/grafikk-natur-og-miljo.md): small things the game strews as instances within a hundred
metres of the eye (view3d/17f-near.js), each 1 m to its scale from the ground at the origin:
    gress          a tuft of grass, a dozen blades leaning out (zone 1, the game tints it by the season)
    lyng           a clump of heather, low and lumpy (zone 1)
    stein0..2      three boulders, irregular and flattened a little, for the scree under the steep faces and the loose blocks on the fell
    tang           rockweed lying on the foreshore, a few straps fanned out
    pip install bpy==4.5.4 (Python 3.11)
    python3.11 tools/wild/naer.py        -> src/data/naer.b64, a render in tools/wild/out/naer.png
    python3.11 tools/wild/naer.py fast   -> without the render
Frames: the game's x right, y up, z back; Blender x right, y forward, z up; to_game(p) = (x, z, -y)."""
import os, sys, math, base64, random
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))
sys.path.insert(0, os.path.join(ROOT, 'tools', 'boats'))
import bpy, bmesh
from mathutils import Vector as V
from bpyutil import *
OUT = os.path.join(HERE, 'out')
def to_game(p): return (p[0], p[2], -p[1])
def to_game_n(n): return (n[0], n[2], -n[1])

def gress(m):
    bm = bmesh.new(); rnd = random.Random(3)
    for k in range(12):
        a = 2 * math.pi * k / 12 + rnd.uniform(-0.2, 0.2); lean = rnd.uniform(0.25, 0.6); h = rnd.uniform(0.6, 1.0); w = 0.035
        bx, by = math.cos(a) * 0.05, math.sin(a) * 0.05; tx, ty = bx + math.cos(a) * lean * h, by + math.sin(a) * lean * h
        px, py = -math.sin(a) * w, math.cos(a) * w
        v = [bm.verts.new((bx - px, by - py, 0)), bm.verts.new((bx + px, by + py, 0)), bm.verts.new(((bx + tx) / 2 + px * 0.6, (by + ty) / 2 + py * 0.6, h * 0.55)), bm.verts.new(((bx + tx) / 2 - px * 0.6, (by + ty) / 2 - py * 0.6, h * 0.55)), bm.verts.new((tx, ty, h))]
        bm.faces.new([v[0], v[1], v[2], v[3]]); bm.faces.new([v[3], v[2], v[4]])
    return shade(obj_from_bm('gress', bm, [m]), 80)

def lyng(m):
    bm = bmesh.new(); rnd = random.Random(9); ret = bmesh.ops.create_icosphere(bm, subdivisions=2, radius=0.5)
    for v in ret['verts']:
        s = 1 + rnd.uniform(-0.25, 0.25); v.co = V((v.co.x * s, v.co.y * s, max(0.0, v.co.z * 0.55 * s + 0.12)))
    return shade(obj_from_bm('lyng', bm, [m]), 70)

def stein(m, seed):
    bm = bmesh.new(); rnd = random.Random(seed); ret = bmesh.ops.create_icosphere(bm, subdivisions=2, radius=0.5)
    sx, sy, sz = rnd.uniform(0.8, 1.2), rnd.uniform(0.7, 1.1), rnd.uniform(0.5, 0.75)
    for v in ret['verts']:
        s = 1 + rnd.uniform(-0.18, 0.18); v.co = V((v.co.x * sx * s, v.co.y * sy * s, v.co.z * sz * s + 0.5 * sz * 0.6))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return shade(obj_from_bm('stein%d' % seed, bm, [m]), 35)

def tang(m):
    bm = bmesh.new(); rnd = random.Random(4)
    for k in range(7):
        a = 2 * math.pi * k / 7 + rnd.uniform(-0.3, 0.3); L = rnd.uniform(0.6, 1.0); w = 0.06
        pts = [(math.cos(a) * L * f + math.sin(f * 6 + k) * 0.04, math.sin(a) * L * f, 0.02 + 0.04 * math.sin(f * 3.1)) for f in (0, 0.33, 0.66, 1.0)]
        px, py = -math.sin(a) * w, math.cos(a) * w; prev = None
        for i, (x, y, z) in enumerate(pts):
            ww = 1 - 0.6 * i / 3; a1 = bm.verts.new((x - px * ww, y - py * ww, z)); a2 = bm.verts.new((x + px * ww, y + py * ww, z))
            if prev: bm.faces.new([prev[0], prev[1], a2, a1])
            prev = (a1, a2)
    return shade(obj_from_bm('tang', bm, [m]), 80)

def main():
    os.makedirs(OUT, exist_ok=True); reset()
    grass = mat('grass', (0.42, 0.52, 0.2), 0.15, zone=1); heath = mat('heath', (0.33, 0.27, 0.22), 0.1, zone=1); rock = mat('rock', (0.46, 0.46, 0.44), 0.15); weed = mat('weed', (0.32, 0.27, 0.1), 0.45)
    objs = [gress(grass), lyng(heath), stein(rock, 0), stein(rock, 1), stein(rock, 2), tang(weed)]
    parts = [(o.name, mesh_arrays(o, to_game, to_game_n, ao=False), 1.0) for o in objs]
    glb = os.path.join(OUT, 'naer.glb'); n = write_glb(glb, parts, {'frame': 'kystfiske near field: x right, y up, z back; 1 m to the scale', 'zones': {'1': 'grass or heather (season)'}})
    open(os.path.join(ROOT, 'src', 'data', 'naer.b64'), 'w').write(base64.b64encode(open(glb, 'rb').read()).decode())
    print('naer GLB %.1f KB, %s' % (n / 1024, ', '.join('%s %d' % (p[0], len(p[1]['idx']) // 3) for p in parts)))
    if 'fast' in sys.argv: return
    for i, o in enumerate(objs): o.location.x = (i - 2.5) * 1.3
    setup_render(1400, 500, samples=24)
    bpy.context.scene.world.node_tree.nodes.get('Background').inputs['Color'].default_value = (0.62, 0.72, 0.84, 1)
    camera((0.0, -11.0, 3.0), (0.0, 0, 0.3), lens=45); render(os.path.join(OUT, 'naer.png'))

if __name__ == '__main__':
    main()
