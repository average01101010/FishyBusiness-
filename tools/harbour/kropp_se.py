"""A quick look at the body's surface straight from the shapes (no remesh): python3.11 tools/harbour/kropp_se.py [m|f] [build ...]
-> tools/harbour/out/se_*.png. For shaping the body while kropp.py is changed."""
import os, sys, math
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE); sys.path.insert(0, os.path.join(os.path.dirname(HERE), 'boats'))
import numpy as np, bpy, bmesh
from bpyutil import *
import kropp as K
OUT = os.path.join(HERE, 'out'); os.makedirs(OUT, exist_ok=True)

def raw(name, v, t, m):
    me = bpy.data.meshes.new(name); me.from_pydata(v.tolist(), [], t.tolist()); me.update()
    o = link(bpy.data.objects.new(name, me)); me.materials.append(m)
    bm = bmesh.new(); bm.from_mesh(me); bmesh.ops.bisect_plane(bm, geom=bm.verts[:] + bm.edges[:] + bm.faces[:], plane_co=(0, 0, 0), plane_no=(-1, 0, 0), clear_outer=True); bm.to_mesh(me); bm.free()
    bm = bmesh.new(); bm.from_mesh(me); g = bm.verts[:] + bm.edges[:] + bm.faces[:]
    r = bmesh.ops.duplicate(bm, geom=g); nv = [e for e in r['geom'] if isinstance(e, bmesh.types.BMVert)]
    for q in nv: q.co.x = -q.co.x
    bmesh.ops.reverse_faces(bm, faces=[e for e in r['geom'] if isinstance(e, bmesh.types.BMFace)])
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=0.0006); bmesh.ops.recalc_face_normals(bm, faces=bm.faces); bm.to_mesh(me); bm.free()
    me.shade_smooth(); return o

if __name__ == '__main__':
    args = [a for a in sys.argv[1:]]
    h = 0.004; HEADBOX = ((-0.004, -0.15, 1.40), (0.13, 0.15, 1.80)) if 'face' in args else None
    args = [a for a in args if a != 'face']
    reset(); grey = mat('grey', (0.62, 0.62, 0.63), 0.25)
    what = []
    for sex in 'mf':
        if sex in args or not [a for a in args if a in 'mf']:
            for b in K.BUILDS[sex]:
                if b in args or not [a for a in args if a not in 'mf' and a != 'close']: what.append((sex, b))
    for i, (sex, b) in enumerate(what):
        v, t = K.grid_mesh(K.prims(sex, K.BUILDS[sex][b]), 0.0015 if HEADBOX else h, cache=os.path.join(OUT, 'cache'), box=HEADBOX)
        o = raw('%s_%s' % (sex, b), v, t[:, ::-1], grey); o.location = (-(i - (len(what) - 1) / 2) * (0.3 if HEADBOX else 0.95), 0, 0)
    bm = bmesh.new(); bm.faces.new([bm.verts.new(p) for p in ((-9, -9, 0), (9, -9, 0), (9, 9, 0), (-9, 9, 0))]); obj_from_bm('ground', bm, [mat('ground', (0.5, 0.5, 0.52), 0.1)])
    n = len(what); tag = '_'.join(args) or 'alle'
    if HEADBOX:
        setup_render(min(2000, 640 * n), 760, samples=24)
        l = bpy.data.lights.new('fill', 'SUN'); l.energy = 2.2; lo = link(bpy.data.objects.new('fill', l)); lo.rotation_euler = (math.radians(-55), 0, math.radians(70)); l.energy = 1.2
        for nm, th in (('f', 0.0), ('q', 0.7), ('s', 1.5708)):
            for o in bpy.data.objects:
                if o.type == 'MESH' and o.name != 'ground': o.rotation_euler = (0, 0, th)
            camera((0.0, 0.75 + 0.42 * n, 1.66), (0.0, 0, 1.64), lens=110); render(os.path.join(OUT, 'se_face_%s_%s.png' % (tag, nm)))
        sys.exit()
    setup_render(min(2000, 420 * n + 300), 1000, samples=24)
    w = 0.95 * n
    camera((0.0, 2.2 + 1.9 * w / 2, 1.0), (0.0, 0, 0.92), lens=50); render(os.path.join(OUT, 'se_%s_front.png' % tag))
    camera((2.2 + 1.6 * w / 2, 0.6, 1.0), (0.0, 0, 0.92), lens=50) if n == 1 else camera((1.6 + w, 2.0 + w, 1.3), (0.0, 0, 0.92), lens=50); render(os.path.join(OUT, 'se_%s_side.png' % tag))
    if 'close' in args or n == 1:
        setup_render(1400, 900, samples=24)
        x0 = bpy.data.objects['%s_%s' % what[0]].location.x
        camera((x0 + 0.25, 0.85, 1.67), (x0, 0, 1.655), lens=70); render(os.path.join(OUT, 'se_%s_face.png' % tag))
        camera((x0 + 0.9, 0.12, 1.66), (x0, 0, 1.655), lens=70); render(os.path.join(OUT, 'se_%s_faceside.png' % tag))
