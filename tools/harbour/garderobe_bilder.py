"""Contact sheets of the wardrobe (check images, tools/harbour/out/gd_*.png): heads with every hairstyle and beard, the hats, the jackets
on both bodies, the shoes. Run after changing garderobe.py:  python3 tools/harbour/garderobe_bilder.py"""
import os, sys, math
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE); sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(HERE)), 'tools', 'boats'))
sys.argv.append('fast')
import bpy, mathutils
import arbeider as A
from bpyutil import *
A.main()
P, WR = A.LAST
W = {n: o for n, o, g in WR}
for o in list(P.values()) + [o for n, o, g in WR]: o.hide_render = True

def put(src, x, y=0.0, z=0.0, h=0.0):
    o = src.copy(); o.data = src.data.copy(); link(o); o.hide_render = False
    o.matrix_world = mathutils.Matrix.Translation((x, y, z)) @ mathutils.Matrix.Rotation(h, 4, 'Z'); return o

bm = bmesh.new(); bm.faces.new([bm.verts.new(p) for p in ((-9, -9, 0), (9, -9, 0), (9, 9, 0), (-9, 9, 0))]); obj_from_bm('ground', bm, [mat('ground', (0.55, 0.55, 0.55), 0.1)])
setup_render(1500, 900, samples=32)
OUT = A.OUT
def heads(names, fname, hat=None, turn=0.0, rowlen=6):
    for i, nm in enumerate(names):
        r, c = divmod(i, rowlen); x = (c - (rowlen - 1) / 2) * 0.36; z = -r * 0.34
        put(P['head'], x, 0, z, turn)
        if nm: put(W[nm] if nm in W else P[nm], x, 0, z, turn)
        if hat: put(W[hat] if hat in W else P[hat], x, 0, z, turn)
    n = (len(names) + rowlen - 1) // rowlen
    camera((0.0, 3.2, 1.62 - (n - 1) * 0.17), (0.0, 0, 1.62 - (n - 1) * 0.17), lens=48); render(os.path.join(OUT, fname))
    for o in [x for x in bpy.data.objects if x.name.startswith(('HEAD', 'HAIR', 'B_', 'HAT')) and x.hide_render is False and x.name not in [q.name for q in list(P.values()) + [w for _, w, _ in WR]]]: bpy.data.objects.remove(o)
hairs = ['hair_short', 'hair_side', 'hair_mid', 'hair_long', 'hair_pony', 'hair_braid', 'hair_bun', 'hair_curl', 'hair_ring', None]
heads(hairs, 'gd_hair_front.png', rowlen=5)
heads(hairs, 'gd_hair_back.png', turn=math.pi, rowlen=5)
beards = ['b_stache', 'b_goat', 'b_short', 'b_full', 'b_mutton', None]
for i, b in enumerate(beards):
    pass
def beardsheet(turn, fname):
    for i, nm in enumerate(beards):
        x = (i - 2.5) * 0.36; put(P['head'], x, 0, 0, turn); put(W['hair_short'], x, 0, 0, turn)
        if nm: put(W[nm], x, 0, 0, turn)
    camera((0.0, 3.0, 1.62), (0.0, 0, 1.62), lens=48); render(os.path.join(OUT, fname))
beardsheet(0.0, 'gd_beard_front.png')
for o in [x for x in bpy.data.objects if x.hide_render is False and x.type == 'MESH' and x.name != 'ground']: bpy.data.objects.remove(o)
def bodies():
    jk = [('torso', 'torso'), ('oilskin', 'oilskin'), ('parka', 'parka'), ('fleece', 'fleece'), ('sweater', 'sweater')]
    hats = ['hardhat', 'hat_bucket', 'hat_bobble', 'hat_ball', 'hat_flat']
    for i, (nm, _) in enumerate(jk):
        for r, f in enumerate((False, True)):
            x = (i - 2) * 0.55; z = -r * 1.0
            src = (W[nm] if nm in W else P[nm]) if not f else W[('jacket' if nm == 'torso' else nm) + 'F']
            put(src, x, 0, z); put(P['head'], x, 0, z); put(W['hair_mid'] if f else W['hair_short'], x, 0, z)
            h = hats[i]; put(W[h] if h in W else P[h], x, 0, z)
    camera((0.0, 6.0, 1.1), (0.0, 0, 0.55), lens=45); render(os.path.join(OUT, 'gd_bodies.png'))
    camera((3.2, 4.4, 1.7), (0.0, 0, 1.45), lens=60); render(os.path.join(OUT, 'gd_bodies_3q.png'))
bodies()
for o in [x for x in bpy.data.objects if x.hide_render is False and x.type == 'MESH' and x.name != 'ground']: bpy.data.objects.remove(o)

# ---- clip check: triangles of each hair style (the _h version under a hat) that cross each hat's surface ----
from mathutils.bvhtree import BVHTree
def bvh(o, nolid=False):
    dg = bpy.context.evaluated_depsgraph_get(); oe = o.evaluated_get(dg); me = oe.to_mesh(); me.transform(o.matrix_world)
    vs = [v.co.copy() for v in me.vertices]; tris = [tuple(t.vertices) for t in me.loop_triangles] if me.loop_triangles else []
    me.calc_loop_triangles()
    lid = mathutils.Vector((0, 0.36, -1.0)).normalized()
    # a hat's underside lid (the loft's cap, hidden inside the head) is no clip: leave it out of the hat's triangles
    tris = [tuple(t.vertices) for t in me.loop_triangles if not (nolid and t.normal.dot(lid) > 0.96)]; b = BVHTree.FromPolygons(vs, tris); oe.to_mesh_clear(); return b
hats = ['hardhat', 'beanie', 'skippercap', 'hat_bobble', 'hat_flat', 'hat_ball', 'hat_bucket']
styles = ['short', 'side', 'mid', 'long', 'pony', 'braid', 'bun', 'curl']
hb = {h: bvh(W[h] if h in W else P[h], True) for h in hats}
print('CLIP (triangle pairs that cross; hat x style_h):')
print('%-12s' % '', ' '.join('%6s' % s for s in styles))
for h in hats:
    print('%-12s' % h, ' '.join('%6d' % len(hb[h].overlap(bvh(W['hair_' + s + '_h']))) for s in styles))
hd = bvh(P['head'])
print('HEAD through hat (triangle pairs):', {h: len(hb[h].overlap(hd)) for h in hats})
# ---- do the parts of each style hang together? every part of a hat variant must touch the band (its own surface within 2 mm of another part) ----
def components(o, root=None):
    """pieces of a hair mesh (loose triangles that share vertices), then joined where two pieces' surfaces cross or come within 1.5 mm: returns
    the number of groups that hang together (1 = everything is attached)"""
    dg = bpy.context.evaluated_depsgraph_get(); oe = o.evaluated_get(dg); me = oe.to_mesh(); me.transform(o.matrix_world); me.calc_loop_triangles()
    par = list(range(len(me.vertices)))
    def f(i):
        while par[i] != i: par[i] = par[par[i]]; i = par[i]
        return i
    for e in me.edges: par[f(e.vertices[0])] = f(e.vertices[1])
    vs = [v.co.copy() for v in me.vertices]; piece = {}
    for tr in me.loop_triangles: piece.setdefault(f(tr.vertices[0]), []).append(tuple(tr.vertices))
    keys = list(piece); trees = {k: BVHTree.FromPolygons(vs, piece[k]) for k in keys}
    if root is not None: keys.append('root'); trees['root'] = root; piece['root'] = []
    uf = {k: k for k in keys}
    def g(k):
        while uf[k] != k: uf[k] = uf[uf[k]]; k = uf[k]
        return k
    for i, a in enumerate(keys):
        for b in keys[i + 1:]:
            if g(a) == g(b): continue
            near = trees[a].overlap(trees[b])
            if not near:
                # within 1.5 mm: a vertex of one close to the other's surface
                pts = {v for tr in piece[a] for v in tr} if a != 'root' else set(); close = False
                if a == 'root': a, b = b, a; pts = {v for tr in piece[a] for v in tr}
                for vi in list(pts)[::2]:
                    r = trees[b].find_nearest(vs[vi])
                    if r[0] is not None and r[3] < 0.0015: close = True; break
                near = close
            if near: uf[g(a)] = g(b)
    n = len({g(k) for k in keys if root is None or g(k) != g('root')}); oe.to_mesh_clear(); return n, len([k for k in keys if k != 'root'])
print('HANGS TOGETHER (groups after joining pieces that touch; 1 = all attached):')
for s in ['short', 'side', 'mid', 'long', 'pony', 'braid', 'bun', 'curl']:
    n, k = components(W['hair_' + s + '_h']); print('  %-6s pieces %2d -> groups %d%s' % (s, k, n, '' if n == 1 else '   <-- LOOSE'))
hd0 = bvh(P['head'])
print('ATTACHED to the head (loose = groups of pieces that touch neither the head nor the rest; 0 is right for hair and beards, 1 for a hat):')
for nm in [n for n in W if n.startswith(('hair_', 'b_', 'hat_')) and not n.endswith('_h')] + ['hardhat', 'beanie', 'skippercap']:
    o = W[nm] if nm in W else P[nm]; hatq = nm.startswith('hat_') or nm in ('hardhat', 'beanie', 'skippercap')
    n, k = components(o) if hatq else components(o, hd0); ok = (n == 1) if hatq else (n == 0)
    print('  %-12s pieces %2d -> %s %d%s' % (nm, k, 'groups' if hatq else 'loose', n, '' if ok else '   <-- LOOSE'))
print('ATTACHED, the hat variants (hair_<style>_h):')
for s in ['short', 'side', 'mid', 'long', 'pony', 'braid', 'bun', 'curl']:
    n, k = components(W['hair_' + s + '_h'], hd0); print('  %-6s pieces %2d -> loose %d%s' % (s, k, n, '' if n == 0 else '   <-- LOOSE'))
# ---- the eyes stay free: no vertex of hair, beard or hat in front of the eyes and brows (the face's front, 2 cm of margin round them) ----
def eye_zone(o):
    """vertices of a part that lie in front of the face's skin round the eyes and the brows: x within 6 cm, z 1.652 to 1.700, and in front of the
    head's own front surface there (so it would hide or cover the eye, the brow or the skin between)"""
    dg = bpy.context.evaluated_depsgraph_get(); oe = o.evaluated_get(dg); me = oe.to_mesh(); me.transform(o.matrix_world); n = 0
    for v in me.vertices:
        if v.co.y > 0.04 and abs(v.co.x) < 0.062 and 1.652 < v.co.z < 1.700 and v.co.y > A.surf(A.HEAD, A.HN, v.co.x, v.co.z, 0.0)[1] + 0.0008: n += 1
    oe.to_mesh_clear(); return n
print('EYE ZONE (vertices of the part in front of the eyes and brows; 0 is right):')
bad = {}
for nm in [n for n in W if n.startswith(('hair_', 'b_', 'hat_'))] + ['hardhat', 'beanie', 'skippercap']:
    n = eye_zone(W[nm] if nm in W else P[nm])
    if n: bad[nm] = n
print('  over the eyes:', bad if bad else 'none')
print('CLIP no hat reference (full style vs hat, expected high):')
for h in ('hat_bobble',): print('%-12s' % h, ' '.join('%6d' % len(hb[h].overlap(bvh(W['hair_' + s]))) for s in styles))

def combo(hat, styles_, fname, turns=(0.0, math.pi / 2, math.pi)):
    for j, tr in enumerate(turns):
        for i, s in enumerate(styles_):
            x = (i - (len(styles_) - 1) / 2) * 0.36; z = -j * 0.36
            put(P['head'], x, 0, z, tr); put(W['hair_' + s + '_h'], x, 0, z, tr); put(W[hat] if hat in W else P[hat], x, 0, z, tr)
    camera((0.0, 3.4, 1.62 - 0.36), (0.0, 0, 1.62 - 0.36), lens=44); render(os.path.join(OUT, fname))
    for o in [x for x in bpy.data.objects if x.hide_render is False and x.type == 'MESH' and x.name != 'ground']: bpy.data.objects.remove(o)
def closeup(hat, style, fname):
    put(P['head'], 0, 0, 0); put(W['hair_' + style + '_h'], 0, 0, 0); put(W[hat] if hat in W else P[hat], 0, 0, 0)
    camera((0.0, 1.5, 1.66), (0.0, 0, 1.64), lens=60); render(os.path.join(OUT, fname))
    for o in [x for x in bpy.data.objects if x.hide_render is False and x.type == 'MESH' and x.name != 'ground']: bpy.data.objects.remove(o)
def fullrow(names, fname, turns=(0.0, math.pi / 2, math.pi, -math.pi / 2)):
    for j, tr in enumerate(turns):
        for i, nm in enumerate(names):
            x = (i - (len(names) - 1) / 2) * 0.34; z = -j * 0.34
            put(P['head'], x, 0, z, tr); put(W[nm], x, 0, z, tr)
    camera((0.0, 3.4, 1.62 - 0.5), (0.0, 0, 1.62 - 0.5), lens=44); render(os.path.join(OUT, fname))
    for o in [x for x in bpy.data.objects if x.hide_render is False and x.type == 'MESH' and x.name != 'ground']: bpy.data.objects.remove(o)
fullrow(['hair_curl', 'hair_pony', 'hair_braid', 'hair_bun', 'hair_ring'], 'gd_full_views.png')
closeup('hat_bucket', 'mid', 'gd_close_bucket.png'); closeup('beanie', 'short', 'gd_close_beanie.png')
combo('beanie', ['short', 'mid', 'long', 'pony', 'bun', 'curl'], 'gd_clip_beanie.png')
combo('hat_bucket', ['short', 'mid', 'long', 'pony', 'bun', 'curl'], 'gd_clip_bucket.png')
combo('hardhat', ['short', 'mid', 'long', 'pony', 'bun', 'curl'], 'gd_clip_hardhat.png')
print('sheets done')
