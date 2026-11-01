"""The trees of the Norwegian coast (G4 of docs/planer/grafikk-natur-og-miljo.md), built in Blender: Norway spruce (gran, Picea abies),
Scots pine (furu, Pinus sylvestris) and downy birch (bjørk, Betula pubescens), each in two levels of detail. All are one metre tall
from the ground at the origin; the game scales them to the height the canopy map gives (tools/trees/trees.py) and turns each its own way.

Parts (the game's frame: x to the right, y up, z backwards):
    spruce0, spruce1   a narrow trunk under a crown of drooping whorls that narrow to the tip; and a cone of six sides
    pine0, pine1       a tall trunk, reddish in the upper part, under a flat crown of a few clumps; and one flat clump on a trunk
    birch0, birch1     a white trunk with dark marks, under a loose, round crown of overlapping clumps; and one clump
Paint zones (the game colours them by the season, view3d/17c-trees.js): 1 the needles or leaves, 2 the birch's twigs (shown when it is
bare), 0 the bark as it is.

    pip install bpy==4.5.4 (Python 3.11)
    python3.11 tools/wild/trees.py          -> src/data/trees.b64, renders in tools/wild/out/
    python3.11 tools/wild/trees.py fast     -> without the renders
Blender frame: x right, y forward, z up; to_game(p) = (x, z, -y)."""
import os, sys, math, base64, random
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))
sys.path.insert(0, os.path.join(ROOT, 'tools', 'boats'))
import bpy, bmesh
from bpyutil import *

OUT = os.path.join(HERE, 'out')
def to_game(p): return (p[0], p[2], -p[1])
def to_game_n(n): return (n[0], n[2], -n[1])

C = {}
def colours():
    C['bark'] = mat('bark', (0.30, 0.22, 0.16), 0.15)
    C['pinebark'] = mat('pinebark', (0.62, 0.36, 0.20), 0.15)
    C['birchbark'] = mat('birchbark', (0.88, 0.86, 0.80), 0.2)
    C['birchmark'] = mat('birchmark', (0.12, 0.11, 0.10), 0.2)
    C['spruce'] = mat('spruce', (0.07, 0.15, 0.08), 0.1, zone=1)
    C['pine'] = mat('pine', (0.13, 0.21, 0.10), 0.1, zone=1)
    C['birch'] = mat('birch', (0.24, 0.37, 0.12), 0.1, zone=1)
    C['twig'] = mat('twig', (0.33, 0.27, 0.24), 0.1, zone=2)

def bm_obj(name, build):
    bm = bmesh.new(); mats = build(bm); o = obj_from_bm(name, bm, mats); bm.free(); return o

def cone(bm, c, r0, r1, z0, z1, n, mi, droop=0.0, jit=0.0, rnd=None):
    """a ring of n at z0 with radius r0 to a ring (or a point) at z1 with r1; droop lowers the rim, jit jitters it"""
    v0 = []; v1 = []
    for k in range(n):
        a = 2 * math.pi * (k + (rnd.random() * jit if rnd else 0)) / n; rr = r0 * (1 + (rnd.uniform(-jit, jit) if rnd else 0))
        v0.append(bm.verts.new((c[0] + math.cos(a) * rr, c[1] + math.sin(a) * rr, z0 - droop)))
    if r1 <= 1e-4:
        top = bm.verts.new((c[0], c[1], z1))
        for k in range(n): f = bm.faces.new((v0[k], v0[(k + 1) % n], top)); f.material_index = mi
    else:
        for k in range(n):
            a = 2 * math.pi * k / n; v1.append(bm.verts.new((c[0] + math.cos(a) * r1, c[1] + math.sin(a) * r1, z1)))
        for k in range(n): f = bm.faces.new((v0[k], v0[(k + 1) % n], v1[(k + 1) % n], v1[k])); f.material_index = mi
    return v0

def disc(bm, ring, z, c, mi, up=False):
    ctr = bm.verts.new((c[0], c[1], z)); n = len(ring)
    for k in range(n):
        f = bm.faces.new((ring[(k + 1) % n], ring[k], ctr) if not up else (ring[k], ring[(k + 1) % n], ctr)); f.material_index = mi

def blob(bm, c, r, sq, mi, rnd, sub=1, jit=0.18):
    """a lumpy clump: an icosphere squashed by sq (x, y, z) with its vertices jittered"""
    ret = bmesh.ops.create_icosphere(bm, subdivisions=sub, radius=r)
    for v in ret['verts']:
        s = 1 + rnd.uniform(-jit, jit); v.co.x = c[0] + v.co.x * sq[0] * s; v.co.y = c[1] + v.co.y * sq[1] * s; v.co.z = c[2] + v.co.z * sq[2] * s
    for f in {f for v in ret['verts'] for f in v.link_faces}: f.material_index = mi

def trunk(bm, h0, h1, r0, r1, n, mi):
    cone(bm, (0, 0), r0, r1, h0, h1, n, mi)

def spruce(lod):
    rnd = random.Random(7)
    def b(bm):
        if lod == 0:
            trunk(bm, 0.0, 0.25, 0.018, 0.012, 5, 0)
            tiers = 9; z = 0.12
            for i in range(tiers):
                t = i / (tiers - 1); r = 0.21 * (1 - t) ** 0.9 + 0.02; h = (0.98 - 0.12) / tiers * 1.6
                zb = 0.12 + (0.98 - 0.12) * t * 0.93; ring = cone(bm, (0, 0), r, 0.0, zb, zb + h, 8, 1, droop=0.035 * (1 - t), jit=0.12, rnd=rnd)
                disc(bm, ring, zb - 0.035 * (1 - t) + 0.01, (0, 0), 1)
            cone(bm, (0, 0), 0.03, 0.0, 0.93, 1.0, 5, 1)
        else:
            trunk(bm, 0.0, 0.14, 0.02, 0.015, 4, 0)
            ring = cone(bm, (0, 0), 0.2, 0.0, 0.1, 1.0, 6, 1); disc(bm, ring, 0.1, (0, 0), 1)
        return [C['bark'], C['spruce']]
    return bm_obj('spruce%d' % lod, b)

def pine(lod):
    rnd = random.Random(11)
    def b(bm):
        if lod == 0:
            trunk(bm, 0.0, 0.45, 0.02, 0.014, 5, 0); trunk(bm, 0.45, 0.82, 0.014, 0.008, 5, 1)
            for (x, y, z, r) in ((0.0, 0.0, 0.86, 0.15), (0.11, 0.05, 0.78, 0.1), (-0.1, -0.06, 0.74, 0.1), (0.03, -0.12, 0.8, 0.09)):
                blob(bm, (x, y, z), r, (1.25, 1.25, 0.55), 2, rnd)
        else:
            trunk(bm, 0.0, 0.7, 0.02, 0.012, 4, 0)
            blob(bm, (0, 0, 0.82), 0.17, (1.3, 1.3, 0.6), 2, rnd, sub=0)
        return [C['bark'], C['pinebark'], C['pine']]
    return bm_obj('pine%d' % lod, b)

def birch(lod):
    rnd = random.Random(23)
    def b(bm):
        if lod == 0:
            trunk(bm, 0.0, 0.62, 0.016, 0.008, 6, 0)
            for zz in (0.12, 0.27, 0.41): cone(bm, (0, 0), 0.0165 - zz * 0.012, 0.0165 - zz * 0.012 - 0.0005, zz, zz + 0.025, 6, 1)
            for (x, y, z, r) in ((0.0, 0.0, 0.8, 0.17), (0.12, 0.04, 0.66, 0.12), (-0.11, -0.05, 0.62, 0.12), (0.03, -0.11, 0.7, 0.11), (-0.03, 0.12, 0.72, 0.1)):
                blob(bm, (x, y, z), r, (1.0, 1.0, 1.05), 2, rnd)
            for (x, y, z) in ((0.08, 0.0, 0.62), (-0.07, 0.03, 0.66), (0.0, -0.07, 0.7)):   # twigs to show when it is bare
                blob(bm, (x * 0.6, y * 0.6, z), 0.07, (1.0, 1.0, 1.6), 3, rnd, sub=0)
        else:
            trunk(bm, 0.0, 0.55, 0.018, 0.01, 4, 0)
            blob(bm, (0, 0, 0.72), 0.22, (1.0, 1.0, 1.15), 2, rnd, sub=0)
        return [C['birchbark'], C['birchmark'], C['birch'], C['twig']]
    return bm_obj('birch%d' % lod, b)

def main():
    os.makedirs(OUT, exist_ok=True)
    reset(); colours()
    objs = [spruce(0), spruce(1), pine(0), pine(1), birch(0), birch(1)]
    for o in objs: shade(o, 50)
    parts = [(o.name, mesh_arrays(o, to_game, to_game_n, ao=False), 1.0) for o in objs]
    ex = {'frame': 'kystfiske trees: x right, y up, z back; 1 m tall from the ground at the origin', 'zones': {'1': 'needles or leaves', '2': "the birch's twigs (bare)"}}
    glb = os.path.join(OUT, 'trees.glb'); n = write_glb(glb, parts, ex)
    open(os.path.join(ROOT, 'src', 'data', 'trees.b64'), 'w').write(base64.b64encode(open(glb, 'rb').read()).decode())
    print('trees GLB %.1f KB, %s' % (n / 1024, ', '.join('%s %d' % (p[0], len(p[1]['idx']) // 3) for p in parts)))
    if 'fast' in sys.argv: return
    setup_render(1400, 600, samples=24)
    bpy.context.scene.world.node_tree.nodes.get('Background').inputs['Color'].default_value = (0.62, 0.72, 0.84, 1)
    for i, o in enumerate(objs): o.location.x = (i - 2.5) * 0.6
    camera((0.0, -4.2, 0.7), (0.0, 0.0, 0.5), lens=50); render(os.path.join(OUT, 'trees_side.png'))

if __name__ == '__main__':
    main()
