"""The new people built in Blender (FB5, steg 122, 13.11.2026): the body of kropp.py as one mesh per sex, its forms, and every part of
today's src/data/worker.b64 again under the same name on the new body (kropp_plagg.py), written to src/data/folk2.b64. The game does
not read the file yet (FB6 does): src/data/worker.b64 and src/js are untouched.

    python3.11 -m pip install bpy==4.5.4 scikit-image scipy
    python3.11 tools/harbour/kropp_bygg.py            -> src/data/folk2.b64 (and out/folk2.glb)
    python3.11 tools/harbour/kropp_bygg.py dry        -> out/folk2.glb only
    python3.11 tools/harbour/kropp_bilder.py          -> the check: the crossings in the poses and the builds, and the pictures

The format is written in docs/systemer/folk-om-bord.md (5.33b) and in the GLB's own extras ('format')."""
import os, sys, math, json, struct, base64, time
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))
sys.path.insert(0, HERE); sys.path.insert(0, os.path.join(ROOT, 'tools', 'boats'))
import numpy as np
import bpy, bmesh
from mathutils import Vector
from mathutils.bvhtree import BVHTree
from scipy.spatial import cKDTree
from bpyutil import *
import kropp as K
import kropp_glb as GLB

OUT = os.path.join(HERE, 'out'); CACHE = os.path.join(OUT, 'cache')
SFORMS = ['thin', 'heavy', 'muscle', 'curvy', 'age']          # the forms that are other shapes of the body; 'tall' is a stretch of the skeleton
# Jonas 13.11.2026: «Du trenger sikkert ikke tynn, tykk de forskjellige kroppsvariasjonene, det holder med mann og kvinne med gode
# modeller». The forms are therefore not built or written (FORMS_ON); the code for them stays, should he want them later.
FORMS_ON = 'former' in sys.argv
HEAD_TRIS = 1500                                               # the head and the neck: what is drawn of the skin on a dressed figure
EYES = {'m': ((0.0327, 0.0960, 1.6630), 0.0155), 'f': ((0.0323, 0.0711, 1.6539), 0.0164)}      # the eyeballs' middles and radius, measured on the base meshes' own eyes
BODY_TRIS = 5200                                               # the whole skin (under the clothes it is not drawn; the head and the neck are)


def np_mesh(name, v, t, m=None):
    me = bpy.data.meshes.new(name); me.from_pydata([tuple(map(float, p)) for p in v], [], [tuple(map(int, f)) for f in t]); me.update()
    o = link(bpy.data.objects.new(name, me))
    if m: me.materials.append(m)
    return o


def mesh_np(o):
    me = o.data; me.calc_loop_triangles()
    v = np.array([p.co[:] for p in me.vertices], float); t = np.array([tr.vertices[:] for tr in me.loop_triangles], int)
    n = np.array([p.normal[:] for p in me.vertices], float)
    return v, t, n


def vnormals(v, t):
    fn = np.cross(v[t[:, 1]] - v[t[:, 0]], v[t[:, 2]] - v[t[:, 0]]); n = np.zeros_like(v)
    for k in range(3): np.add.at(n, t[:, k], fn)
    return n / np.maximum(np.linalg.norm(n, axis=1, keepdims=True), 1e-12)


def stretch_field(J0, J1, pts):
    """where points of the rest pose J0 go when the skeleton becomes J1 (joints moved, bones longer or shorter): each bone moves its
    joint and stretches along itself, blended by the weights. The field of 'tall', and of what moves the joints in any form."""
    idx, w = K.weights(J0, pts); p = np.asarray(pts, float); T0, T1 = K.tails(J0), K.tails(J1); out = np.zeros_like(p)
    Ms = []
    for n, _ in K.BONES:
        a0, b0, a1, b1 = (np.array(x, float) for x in (J0[n], T0[n], J1[n], T1[n])); d0 = b0 - a0; L0 = np.linalg.norm(d0); L1 = np.linalg.norm(b1 - a1); u = d0 / L0
        S = np.eye(3) + (L1 / L0 - 1) * np.outer(u, u); Ms.append((S, a1 - S @ a0))
    for k in range(idx.shape[1]):
        for b in np.unique(idx[:, k]):
            m = idx[:, k] == b; S, tr = Ms[b]; out[m] += w[m, k:k + 1] * (p[m] @ S.T + tr)
    return out


SRC = {'m': os.path.join(HERE, 'kilde', 'mann.obj'), 'f': os.path.join(HERE, 'kilde', 'kvinne.obj')}
STATURE = 1.776


def load_obj(fn):
    """the base mesh (tools/harbour/kilde/LISENS.md): its frame is y up, facing +z, in inches; here x to the person's right, y forward,
    z up, scaled to STATURE"""
    v = []; f = []
    for l in open(fn):
        if l.startswith('v '): a = l.split(); v.append((-float(a[1]), float(a[3]), float(a[2])))
        elif l.startswith('f '): f.append([int(x.split('/')[0]) - 1 for x in l.split()[1:]])
    v = np.array(v); v[:, 2] -= v[:, 2].min(); v *= STATURE / v[:, 2].max(); v[:, 0] -= (v[:, 0].min() + v[:, 0].max()) / 2
    return v, f


def sdf_normal(P, p, e=0.002):
    g = np.stack([K.field(P, p + np.array(d) * e) - K.field(P, p - np.array(d) * e) for d in ((1, 0, 0), (0, 1, 0), (0, 0, 1))], 1)
    return g / np.maximum(np.linalg.norm(g, axis=1, keepdims=True), 1e-12)


class Body:
    """one sex's body: the mesh (v, t), its forms as differences per vertex, and what the garments are built on: the body in a
    build as a surface to cast rays at (surf(form)). The mesh is the base mesh of tools/harbour/kilde; the forms are those of
    kropp.py's shapes (how far their skin moves from the normal build to each form), laid on the mesh along its own skin."""
    def __init__(self, sex, skin_mat):
        self.sex = sex; t0 = time.time()
        self.J = K.joints(sex)
        v, faces = K.load_obj(sex)
        me = bpy.data.meshes.new('BODY' + ('F' if sex == 'f' else '')); me.from_pydata([tuple(p) for p in v], [], faces); me.update()
        bm = bmesh.new(); bm.from_mesh(me); bmesh.ops.recalc_face_normals(bm, faces=bm.faces); bmesh.ops.triangulate(bm, faces=bm.faces); bm.to_mesh(me); bm.free()
        self.o = self._thin_head(link(bpy.data.objects.new(me.name, me))); me = self.o.data; me.name = 'BODY' + ('F' if sex == 'f' else ''); self.o.name = me.name; me.materials.append(skin_mat); me.shade_smooth()
        self.v = np.array([p.co[:] for p in me.vertices], float); self.t = np.array([p.vertices[:] for p in me.polygons], int); self.n = vnormals(self.v, self.t)
        self.tree = cKDTree(self.v)
        P0 = K.prims(sex); f0 = K.field(P0, self.v); ns = sdf_normal(P0, self.v); ps = self.v - ns * f0[:, None]       # the place on the shapes' skin under each vertex
        self.fit = float(np.abs(f0).mean())
        self.d = {}                      # form -> (N, 3)
        for f in (SFORMS if FORMS_ON else []):
            if sex == 'm' and f == 'curvy': continue
            Pk = K.prims(sex, K.F0(**{f: 1.0})); Jk = K.joints(sex, K.F0(**{f: 1.0}))
            # first where the skeleton takes the point (the stoop, wider shoulders), then out or in as far as the shapes' skin moves there
            mv = stretch_field(self.J, Jk, ps) - ps
            tt, found = K.project(Pk, ps + mv, ns, lo=-0.06, hi=0.14); tt = np.where(found, tt, 0.0)
            self.d[f] = self._smooth(mv + ns * tt[:, None], 4)
        if FORMS_ON: Jt = K.joints(sex, K.F0(tall=1.0)); self.d['tall'] = stretch_field(self.J, Jt, self.v) - self.v
        self._bvh = {}
        print('body %s: %d verts, %d tris, shapes %.1f mm off the mesh on average, forms %s, %.0f s' % (sex, len(self.v), len(self.t), self.fit * 1000, {k: round(float(np.linalg.norm(x, axis=1).max()), 3) for k, x in self.d.items()}, time.time() - t0))

    def _thin_head(self, o):
        """the head and the neck with fewer triangles (the base mesh's head is 3 100; the old head was 936, and what a dressed figure
        may cost is today's): Blender's collapse held to the head by a vertex group, the two sides kept mirror images"""
        nz = self.J['neck'][2]; inhead = lambda c: c[2] > nz - 0.022 and abs(c[0]) < 0.11
        n_head = sum(1 for f in o.data.polygons if inhead(f.center)); n_all = len(o.data.polygons); ratio = (n_all - (n_head - HEAD_TRIS)) / n_all; best = None
        for it_ in range(5):
            c = o.copy(); c.data = o.data.copy(); link(c); vg = c.vertex_groups.new(name='go')
            for vtx in c.data.vertices:
                z = vtx.co.z; vg.add([vtx.index], 1.0 if (z > nz - 0.012 and abs(vtx.co.x) < 0.105) else 0.0, 'REPLACE')
            md = c.modifiers.new('d', 'DECIMATE'); md.decimate_type = 'COLLAPSE'; md.ratio = ratio; md.use_symmetry = True; md.symmetry_axis = 'X'; md.use_collapse_triangulate = True
            md.vertex_group = 'go'; md.vertex_group_factor = 1.0
            with bpy.context.temp_override(object=c, active_object=c, selected_objects=[c]): bpy.ops.object.modifier_apply(modifier='d')
            hd = sum(1 for f in c.data.polygons if inhead(f.center)); rest = len(c.data.polygons) - hd
            if best: bpy.data.objects.remove(best)
            best = c
            if abs(hd - HEAD_TRIS) < 60: break
            ratio += (HEAD_TRIS - hd) / n_all
        print('  head %d -> %d tris (the rest %d -> %d)' % (n_head, hd, n_all - n_head, rest)); bpy.data.objects.remove(o)
        return best

    def _smooth(self, d, it):
        nb = [[] for _ in range(len(self.v))]
        for a, b, c in self.t: nb[a] += [b, c]; nb[b] += [a, c]; nb[c] += [a, b]
        nb = [np.unique(x) for x in nb]
        for _ in range(it):
            d = np.array([0.5 * d[i] + 0.5 * d[nb[i]].mean(0) if len(nb[i]) else d[i] for i in range(len(d))])
        return d

    def joints(self, form=None):
        return K.joints(self.sex, K.F0(**{form: 1.0})) if form else self.J

    def verts(self, form=None):
        return self.v + self.d[form] if form else self.v

    def surf(self, form=None):
        if form not in self._bvh: self._bvh[form] = BVHTree.FromPolygons([tuple(p) for p in self.verts(form)], [tuple(int(i) for i in f) for f in self.t])
        return self._bvh[form]

    def out(self, o, d, far=0.6, form=None):
        """from a point inside the body, the way out along d: how far to the skin (the first crossing), or None"""
        h = self.surf(form).ray_cast(Vector(o), Vector(d).normalized(), far)
        return None if h[0] is None else h[3]

    def field(self, form, pts, k=6):
        """a form's move at any points near the body: that of the skin nearest them (the garment's own way of taking a form when it
        is not built again on the body in that form)"""
        dist, idx = self.tree.query(np.asarray(pts, float), k=k); w = 1.0 / (dist + 0.004) ** 2; w /= w.sum(1, keepdims=True)
        return (self.d[form][idx] * w[:, :, None]).sum(1)


COVER_ORDER = ['head', 'hands', 'arms', 'torso', 'legs', 'feet']


def cover_groups(B):
    """which part of the skin each triangle is, for hiding it under what is worn: the head and the neck (always drawn), the hands
    (drawn bare without gloves), the arms, the torso, the legs, the feet"""
    c = B.v[B.t].mean(1); idx, w = K.weights(B.J, c); W = np.zeros((len(c), len(K.BONES)))
    for k in range(idx.shape[1]): np.add.at(W, (np.arange(len(c)), idx[:, k]), w[:, k])
    g = lambda names: W[:, [K.BI[n] for n in names]].sum(1)
    hand = g([n for n, _ in K.BONES if n.startswith('hand') or n[:-3] in K.FINGERS]); arm = g([n for n, _ in K.BONES if n.startswith(('uarm', 'utw', 'farm', 'ftw'))])
    leg = g([n for n, _ in K.BONES if n.startswith(('thigh', 'ttw', 'shin'))]); foot = g([n for n, _ in K.BONES if n.startswith(('foot', 'toe'))])
    out = np.full(len(c), 3)
    out[leg > 0.5] = 4; out[foot > 0.5] = 5; out[arm + hand > 0.5] = 2; out[hand > 0.5] = 1; out[((c[:, 2] > B.J['neck'][2] + 0.006) & (np.abs(c[:, 0]) < 0.072)) | (c[:, 2] > B.J['neck'][2] + 0.045)] = 0          # (the neck from just inside the collars' rims, and all above)
    return out


def connected(t, n):
    par = list(range(n))
    def f(i):
        while par[i] != i: par[i] = par[par[i]]; i = par[i]
        return i
    for a, b, c in t: par[f(a)] = f(b); par[f(b)] = f(c)
    return len({f(i) for i in set(t.ravel().tolist())})


MATNAME = {'suit': 'suit', 'trousers': 'trou', 'zip': 'zip', 'wool': 'wool', 'skin': 'skin'}


def mesh_obj(name, M, C, angle=72):
    """a kropp_plagg.Mesh as a Blender object: the vertices in M's order, each face turned away from its own reference point"""
    names = []; me = bpy.data.meshes.new(name)
    faces = []
    for ids, m, ref, inside in M.f:
        p = [M.v[i] for i in ids]; n = np.cross(p[1] - p[0], p[2] - p[0]) if len(p) == 3 else np.cross(p[2] - p[0], p[3] - p[1]); c = sum(p) / len(p)
        flip = (n @ (c - ref) < 0) != inside
        faces.append(tuple(reversed(ids)) if flip else tuple(ids))
        if m not in names: names.append(m)
    me.from_pydata([tuple(map(float, q)) for q in M.v], [], [tuple(int(i) for i in f) for f in faces]); me.update()
    for m in names: me.materials.append(C[MATNAME[m]])
    for poly, (ids, m, ref, inside) in zip(me.polygons, M.f): poly.material_index = names.index(m)
    o = link(bpy.data.objects.new(name, me)); shade(o, angle); return o


def pos_of(M): return np.array(M.v, float)


def build_garments(BM, BF, C):
    """the parts built on the new body: {name: {'o': object, 'sex': 'm'|'f'|'mf', 'var': {target: positions}}}. A part for both sexes
    (the sleeves, the legs) is the man's, with the woman's as the form 'fem' and her builds as '<form>F'."""
    import kropp_plagg as G
    out = {}
    def variants(fn, B, base):
        v = {}
        for f in list(B.d):
            v[f] = pos_of(fn(G.Ctx(B, f))) - base
        return v
    for name, fn in G.BUILDERS.items():
        M0 = fn(G.Ctx(BM)); base = pos_of(M0); o = mesh_obj(name.upper(), M0, C)
        var = variants(fn, BM, base); MF = fn(G.Ctx(BF)); bf = pos_of(MF); var['fem'] = bf - base
        for f, d in variants(fn, BF, bf).items(): var[f + 'F'] = d
        out[name] = {'o': o, 'sex': 'mf', 'var': var}
    for B, table in ((BM, G.JACKETS_M), (BF, G.JACKETS_F)):
        for name, kind in table.items():
            fn = lambda c, kind=kind: G.jacket(c, kind)
            M0 = fn(G.Ctx(B)); base = pos_of(M0); o = mesh_obj(name.upper(), M0, C)
            out[name] = {'o': o, 'sex': B.sex, 'var': variants(fn, B, base)}
    return out


def posed_copy(o, v):
    c = o.copy(); c.data = o.data.copy(); link(c)
    for vtx, p in zip(c.data.vertices, v): vtx.co = tuple(map(float, p))
    c.data.update(); c.hide_render = False; return c


def figure(parts, names, B, build=None, pose='hvile', x=0.0):
    """a dressed figure for a picture: the parts in a build and a pose, moved to x"""
    f = K.BUILDS[B.sex][build] if build else K.F0(); J = K.joints(B.sex, f); L, root = K.POSES(J)[pose]; M, _ = K.pose_mats(J, L, root); res = []
    for n in names:
        P = parts[n]; o = P['o']; v = np.array([q.co[:] for q in o.data.vertices], float)
        if 'var' in P:
            if B.sex == 'f' and 'fem' in P['var']: v = v + P['var']['fem']
            for fn, wt in f.items():
                key = fn + ('F' if B.sex == 'f' and P['sex'] == 'mf' else '')
                if wt and key in P['var']: v = v + wt * P['var'][key]
        idx, w = K.weights(J, v); v = K.skin(v, idx, w, M); c = posed_copy(o, v); c.location = (x, 0, 0); res.append(c)
        if n.startswith('body') and len(names) > 1:          # dressed: only the head, the neck and the hands of the skin are drawn
            cg = cover_groups(B); bm = bmesh.new(); bm.from_mesh(c.data); bm.faces.ensure_lookup_table()
            bmesh.ops.delete(bm, geom=[f for f, gq in zip(bm.faces, cg) if gq > 1], context='FACES'); bm.to_mesh(c.data); bm.free()
    return res


# ---------------- the whole file ----------------
def arrays(o, tri_key=None):
    """an object's triangles as unique vertices (as bpyutil.mesh_arrays, in Blender's frame): pos, nor, col, pnt, idx; tri_key(polygon
    index) orders the triangles (the skin's cover groups) and 'groups' tells how many indices each key has"""
    dg = bpy.context.evaluated_depsgraph_get(); oe = o.evaluated_get(dg); me = oe.to_mesh(); me.calc_loop_triangles(); M = o.matrix_world; R = M.to_3x3()
    aoa = me.color_attributes.get('AO'); slots = [s.material for s in o.material_slots]
    tris = list(me.loop_triangles)
    if tri_key: tris.sort(key=lambda t: tri_key(t.polygon_index))
    pos = []; nor = []; col = []; pnt = []; idx = []; seen = {}; groups = {}
    for t in tris:
        m = slots[t.material_index] if slots else None
        rgb = m['rgb'] if m and 'rgb' in m else (0.8, 0.8, 0.8); gl = m['gloss'] if m and 'gloss' in m else 0.3; zn = m['zone'] if m and 'zone' in m else 0
        for li in t.loops:
            l = me.loops[li]; p = M @ me.vertices[l.vertex_index].co; n = (R @ me.corner_normals[li].vector).normalized()
            a = 0.3 + 0.7 * (aoa.data[li].color[0] if aoa else 1.0)
            c = tuple(int(round(max(0, min(1, rgb[k] * a)) * 255)) for k in range(3)) + (int(round(gl * 255)),)
            key = (round(p[0], 5), round(p[1], 5), round(p[2], 5), round(n[0], 2), round(n[1], 2), round(n[2], 2), c, zn)
            if key not in seen: seen[key] = len(pos); pos.append(tuple(p)); nor.append(tuple(n)); col.append(c); pnt.append((zn, int(round(a * 255)), 0, 0))
            idx.append(seen[key])
        if tri_key: k = tri_key(t.polygon_index); groups[k] = groups.get(k, 0) + 3
    oe.to_mesh_clear()
    return {'pos': np.array(pos, float), 'nor': np.array(nor, float), 'col': col, 'pnt': pnt, 'idx': idx, 'groups': groups}


def cat(A, B):
    n = len(A['pos']); return {'pos': np.concatenate([A['pos'], B['pos']]), 'nor': np.concatenate([A['nor'], B['nor']]), 'col': A['col'] + B['col'], 'pnt': A['pnt'] + B['pnt'], 'idx': A['idx'] + [i + n for i in B['idx']]}


def eye_obj(sex, C):
    """the two eyeballs: a white ball with a dark iris toward the front, where the base mesh's own eyes sit"""
    (cx, cy, cz), r = EYES[sex]; A = Acc('EYES' + sex); W = C['eyewhite']; I = C['eye']
    for sg in (1, -1):
        c = V((sg * cx, cy, cz)); rings = []
        for pa in (0, 24, 50, 80, 115):
            if pa == 0: rings.append([A.v(c + V((0, r, 0)))]); continue
            a = math.radians(pa); rings.append([A.v(c + V((r * math.sin(a) * math.cos(2 * math.pi * k / 10), r * math.cos(a), r * math.sin(a) * math.sin(2 * math.pi * k / 10)))) for k in range(10)])
        for k in range(10): A.f([rings[0][0], rings[1][k], rings[1][(k + 1) % 10]], I, (0, 1, 0))
        for i in range(1, 4):
            for k in range(10):
                k1 = (k + 1) % 10; q = [rings[i][k], rings[i][k1], rings[i + 1][k1], rings[i + 1][k]]; cc = sum((v.co for v in q), V()) / 4; A.f(q, W, cc - c)
    return A.done(60)


def brow_obj(B, C):
    """the brows: a strip of hair on the skin over each eye (zone 5, the hair's colour), laid on the head by rays from the front"""
    (cx, cy, cz), r = EYES[B.sex]; A = Acc('BROWS' + B.sex); H = C['brow']; bv = B.surf()
    for sg in (1, -1):
        rows = []
        for u in (0.0, 0.25, 0.5, 0.75, 1.0):
            x = sg * (cx - 0.019 + 0.040 * u); zc = cz + 0.0225 + 0.0028 * math.sin(math.pi * u) - 0.004 * u * u; hw = (0.0024 if B.sex == 'f' else 0.0034) - 0.0014 * u; row = []          # (hers are finer)
            for dz in (-hw, hw):
                h = bv.ray_cast(Vector((x, cy + 0.2, zc + dz)), Vector((0, -1, 0)), 0.4); row.append(A.v((x, (h[0].y if h[0] is not None else cy + r) + 0.0007, zc + dz)))
            rows.append(row)
        for a, b in zip(rows[:-1], rows[1:]): A.f([a[0], a[1], b[1], b[0]], H, (0, 1, 0))
    return A.done(60)


def head_align(BM, BF):
    """how far the woman's skull is from the man's when both are seen from their head joints: the parts on the head (hair, hats) are
    the same for both, so they are laid on whichever of the two heads stands furthest out at each place"""
    def box(B):
        v = B.v[(B.v[:, 2] > B.J['head'][2] + 0.06)] - np.array(B.J['head']); return (v.min(0) + v.max(0)) / 2
    return box(BF) - box(BM)


def reseat(o, old_bvh, BM, BF, shift, falign, far=0.045):
    """move a part made for the old head (arbeider.py's) onto the new one: each vertex keeps its place over the old skin, and the old
    skin under it goes to the new skin along the ray from the head's middle (the outermost of the man's and the woman's heads)."""
    me = o.data; sm = BM.surf(); sf = BF.surf(); c_old = Vector((0, -0.010, 1.665)); c_new = c_old + Vector(shift); dj = Vector(BF.J['head']) - Vector(BM.J['head'])
    for vtx in me.vertices:
        p = vtx.co; q, _n, _i, d = old_bvh.find_nearest(p); q2 = q + Vector(shift); dr = (q2 - c_new)
        if dr.length < 1e-6: vtx.co = p + Vector(shift); continue
        dr.normalize(); best = None
        for bv, off in ((sm, Vector((0, 0, 0))), (sf, dj)):
            h = bv.ray_cast(c_new + off, dr, 0.4)
            if h[0] is not None:
                r = (h[0] - off - c_new).length
                if best is None or r > best: best = r
        mv = Vector((0, 0, 0))
        if best is not None:
            mv = dr * (best - (q2 - c_new).length)
            if mv.length > 0.035: mv *= 0.035 / mv.length
            mv *= max(0.0, 1.0 - max(0.0, d - far) / 0.06)
        vtx.co = p + Vector(shift) + mv
    me.update(); return o


def drop_lid(o):
    """a hat's underside (the loft's cap, inside the head and never seen) is taken away: it crossed the hair and the skin"""
    lid = Vector((0, 0.36, -1.0)).normalized(); bm = bmesh.new(); bm.from_mesh(o.data); bm.normal_update()
    kill = [f for f in bm.faces if f.normal.dot(lid) > 0.96 and len(f.verts) > 4]
    bmesh.ops.delete(bm, geom=kill, context='FACES'); bm.to_mesh(o.data); bm.free(); o.data.update()


def mirror_obj(o, name):
    c = o.copy(); c.data = o.data.copy(); link(c); c.name = name; bm = bmesh.new(); bm.from_mesh(c.data)
    for v in bm.verts: v.co.x = -v.co.x
    bmesh.ops.reverse_faces(bm, faces=bm.faces); bm.to_mesh(c.data); bm.free(); c.data.update(); return c


def join_copy(objs, name):
    cs = []
    for o in objs: c = o.copy(); c.data = o.data.copy(); link(c); cs.append(c)
    return join(cs, name)


_FW = {}
def lay_fingers(sex, pos, idx, w):
    """the hands' weights by the mesh's own fingers (kropp.finger_weights) laid over the weights by place: what a vertex of the hand
    (or of the glove made of it, within 5 mm of it) holds for the hand and its fingers is shared out as the mesh's split says"""
    if sex not in _FW: fp, fs = K.finger_weights(sex); _FW[sex] = (cKDTree(fp), fs)
    tree, fs = _FW[sex]; d, j = tree.query(pos); fam = np.array([n.startswith('hand') or n[:-3] in K.FINGERS for n, _ in K.BONES])
    W = np.zeros((len(pos), len(K.BONES)))
    for k in range(idx.shape[1]): np.add.at(W, (np.arange(len(pos)), idx[:, k]), w[:, k])
    m = (d < 0.005) & (W[:, fam].sum(1) > 1e-6); h = W[m][:, fam].sum(1); Wm = W[m]; Wm[:, fam] = 0.0; Wm += h[:, None] * fs[j[m]]; W[m] = Wm
    i2 = np.argsort(-W, 1)[:, :4]; w2 = np.take_along_axis(W, i2, 1); return i2, w2 / w2.sum(1, keepdims=True)


def glove_obj(B, C):
    """a pair of work gloves made of the body's own hands: the skin from 6 cm up the forearm to the fingertips, 1.5 mm thicker, the
    cuff widening to go over the sleeve's cuff. And the tape round the left palm (a cut hand, taped over the glove)."""
    J = B.J; A = Acc('GLOVE' + B.sex); T = Acc('TAPE'); vn = B.n; idx, w = K.weights(J, B.v)
    armw = np.zeros(len(B.v)); 
    for k in range(4):
        for i, bi in enumerate(idx[:, k]):
            n_ = K.BONES[bi][0]
            if n_.startswith(('hand', 'ftw', 'farm')) or n_[:-3] in K.FINGERS: armw[i] += w[i, k]
    for sd, sg in (('R', 1), ('L', -1)):
        wr = np.array(J['hand_' + sd]); el = np.array(J['farm_' + sd]); d = (wr - el) / np.linalg.norm(wr - el); Fg = K.fingers(B.sex); hd = Fg['d'] * np.array([sg, 1, 1.0])
        t = (B.v - wr) @ d; rad = B.v - wr - np.outer(t, d); rl = np.linalg.norm(rad, axis=1)
        sel = (armw > 0.5) & (t > -0.062) & (sg * B.v[:, 0] > 0.2); vid = {}
        for tri in B.t:
            if not all(sel[i] for i in tri): continue
            q = []
            for i in tri:
                if i not in vid:
                    up = K._ss(-t[i], 0.0, 0.028); p = B.v[i] + vn[i] * 0.0016
                    if up > 0: p = wr + d * max(t[i], -0.052) + rad[i] / max(rl[i], 1e-6) * (rl[i] + 0.0016 + (0.061 - rl[i] - 0.0016) * up)          # (the rim is one clean ring)
                    vid[i] = (A.v(tuple(p)), tuple(p + vn[i] * 0.0012))
                q.append(vid[i][0])
            c = B.v[list(tri)].mean(0); A.f(q, C['glove'], tuple(vn[tri[0]]))
            th = (c - wr) @ hd
            if sd == 'L' and 0.030 < th < 0.062 and np.linalg.norm(c - wr - hd * th) < 0.05: T.poly([vid[i][1] for i in tri], C['tape'], tuple(vn[tri[0]]))
    return A.done(70), T.done(70)


def build_all():
    import arbeider as A, garderobe as GD, kropp_plagg as G
    reset(); A.colours(); C = A.C
    C['eyewhite'] = mat('eyewhite', (0.93, 0.92, 0.89), 0.6); C['suit']['gloss'] = 0.3
    BM, BF = Body('m', C['skin']), Body('f', C['skin']); B_ = {'m': BM, 'f': BF}
    parts = {}        # name -> {'o', 'kind': 'skin'|'rigid'|'alias', 'sex', 'bone', ...}
    # ---- the garments built on the bodies ----
    for B in (BM, BF):
        F = 'F' if B.sex == 'f' else ''; c = G.Ctx(B)
        for name, fn in G.BUILDERS.items(): parts[name + F] = {'o': mesh_obj((name + F).upper(), fn(c), C), 'kind': 'skin', 'sex': B.sex, 'arm': name in ('uarm', 'farm')}
        for name, kind in (G.JACKETS_F if F else G.JACKETS_M).items(): parts[name] = {'o': mesh_obj(name.upper(), G.jacket(c, kind), C), 'kind': 'skin', 'sex': B.sex, 'torso': True}
    # ---- the parts kept from arbeider.py, garderobe.py and hender.py ----
    P = A.build_all(); W = {n: (o, g) for n, o, g in GD.build(A)}
    old_head = GD.bvh_of([P['head']]); falign = head_align(BM, BF)
    hb = BM.v[BM.v[:, 2] > BM.J['head'][2] + 0.06]; shift = ((0.0, (hb[:, 1].min() + hb[:, 1].max()) / 2 - (-0.010), hb[:, 2].max() - 1.774))
    print('the head: the old parts moved by', np.round(shift, 4), ' the woman\'s skull from the man\'s, seen from the joints:', np.round(falign, 4))
    head_names = ['hardhat', 'beanie', 'skippercap'] + [n for n in W if n.startswith(('hair_', 'b_', 'hat_'))]
    for n in head_names:
        o = P[n] if n in P else W[n][0]; reseat(o, old_head, BM, BF, shift, falign)
        if n in ('hardhat', 'beanie', 'skippercap') or n.startswith('hat_'): drop_lid(o)
        parts[n] = {'o': o, 'kind': 'rigid', 'bone': 'head', 'sex': 'mf'}
    # the boots and the shoes: the old one is a right foot at the origin; both feet on the ankles, for each sex
    for n in ('boot', 'shoe', 'sneaker'):
        src = P[n] if n in P else W[n][0]
        for B in (BM, BF):
            F = 'F' if B.sex == 'f' else ''; a = B.J['foot_R']; r = src.copy(); r.data = src.data.copy(); link(r)
            for vtx in r.data.vertices: vtx.co.x += a[0]; vtx.co.y += a[1] + 0.024
            r.data.update()
            if n != 'boot':            # a sock up into the trouser leg (Jonas 13.11.2026: «Leggen mangler jo»: the skin under the clothes is not drawn)
                kn = B.J['shin_R']; sk = Acc('sock'); rr = [[sk.v((a[0] + (kn[0] - a[0]) * (z - a[2]) / (kn[2] - a[2]) + 0.047 * math.cos(2 * math.pi * k / 8), a[1] + (kn[1] - a[1]) * (z - a[2]) / (kn[2] - a[2]) + 0.050 * math.sin(2 * math.pi * k / 8), z)) for k in range(8)] for z in (0.055, 0.185)]
                for k in range(8): sk.f([rr[0][k], rr[0][(k + 1) % 8], rr[1][(k + 1) % 8], rr[1][k]], C['wool'], (math.cos(2 * math.pi * (k + 0.5) / 8), math.sin(2 * math.pi * (k + 0.5) / 8), 0))
                r = join([r, sk.done(60)], 'r')
            l = mirror_obj(r, 'l'); parts[n + F] = {'o': join([r, l], (n + F).upper()), 'kind': 'skin', 'sex': B.sex}
    # ---- the gloves: the body's own hands, a little thicker, with a cuff that goes over the sleeve's (Jonas 13.11.2026: nothing
    # of the old hands; the grips are the fingers' turns now, kropp.py GRIPS) ----
    C['glove'] = mat('glove2', (0.13, 0.30, 0.58), 0.45); C['glovecuff'] = mat('glovecuff', (0.07, 0.08, 0.10), 0.3)
    for B in (BM, BF):
        F = 'F' if B.sex == 'f' else ''; g, tp = glove_obj(B, C); parts['glove' + F] = {'o': g, 'kind': 'skin', 'sex': B.sex, 'sides': True, 'arm': True}
        if not F: parts['tape_L'] = {'o': tp, 'kind': 'skin', 'sex': 'm', 'arm': True}
        else: bpy.data.objects.remove(tp)
    # ---- the vests: garderobe.py's own builder, laid on the new jackets and heads ----
    heads = {}
    for B in (BM, BF):       # (the head and the neck alone: the vest's collar lies round them, not round the arms)
        h = B.o.copy(); h.data = B.o.data.copy(); link(h); bm = bmesh.new(); bm.from_mesh(h.data)
        bmesh.ops.delete(bm, geom=[f for f in bm.faces if f.calc_center_median().z < B.J['neck'][2] - 0.03 or abs(f.calc_center_median().x) > 0.12], context='FACES'); bm.to_mesh(h.data); bm.free(); heads[B.sex] = h
    for name, js, rc in GD.VEST_GROUPS:
        B = BF if name.endswith('F') else BM
        parts[name] = {'o': GD.vest(A, name, [parts[j]['o'] for j in js] + [heads[B.sex], parts['thigh' + ('F' if B.sex == 'f' else '')]['o']], rc, neck_y=B.J['neck'][1] + 0.004), 'kind': 'skin', 'sex': B.sex, 'torso': True}
    # ---- the skin, with the eyes and the brows in the head's range ----
    for h in heads.values(): bpy.data.objects.remove(h)
    for B in (BM, BF):
        F = 'F' if B.sex == 'f' else ''; parts['body' + F] = {'o': B.o, 'kind': 'skin', 'sex': B.sex, 'body': B, 'face': [eye_obj(B.sex, C), brow_obj(B, C)]}
    return parts, B_, C


def bake_all(parts):
    hide = lambda keep: [x for x in bpy.data.objects if x.type == 'MESH' and x not in keep and not x.hide_render]
    for n, Pt in parts.items():
        o = Pt['o']; o.hide_render = False; keep = [o]
        if Pt.get('bone') == 'head': keep.append(parts['body']['o'])
        if 'body' in Pt: keep += Pt['face']
        hid = hide(keep)
        for x in hid: x.hide_render = True
        bake_ao(o, 32 if 'body' in Pt else 20, 0.06 if Pt['kind'] == 'rigid' else 0.10)
        for x in hid: x.hide_render = False


def export(parts, B_, path):
    import garderobe as GD
    Wr = GLB.Writer(); bone_node = {}
    # the skeleton: the man's rest places as the nodes' translations; the woman's in the extras and her own skin's matrices
    rest = {sx: {n: GLB.to_game(np.array(B.J[n])).tolist() for n, _ in K.BONES} for sx, B in B_.items()}
    for n, par in K.BONES:
        j = np.array(rest['m'][n]) - (np.array(rest['m'][par]) if par else 0); Wr.nodes.append({'name': n, 'translation': j.tolist()}); bone_node[n] = len(Wr.nodes) - 1
    for n, par in K.BONES:
        if par: Wr.nodes[bone_node[par]].setdefault('children', []).append(bone_node[n])
    skin = {}
    for sx in 'mf':
        ibm = np.array([np.array([[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [-rest[sx][n][0], -rest[sx][n][1], -rest[sx][n][2], 1]], np.float32) for n, _ in K.BONES])     # column-major
        a = Wr.acc(Wr.view(ibm.tobytes()), 5126, len(K.BONES), 'MAT4'); Wr.skins.append({'name': 'folk_' + sx, 'joints': [bone_node[n] for n, _ in K.BONES], 'inverseBindMatrices': a, 'skeleton': bone_node['hips']}); skin[sx] = len(Wr.skins) - 1
    roots = [bone_node['hips']]; info = {}; cover = {}; src = {}
    for name, Pt in parts.items():
        o = Pt['o']; sx = Pt['sex']
        if 'body' in Pt:
            B = Pt['body']; cg = cover_groups(B); A_ = arrays(o, lambda pi: int(cg[pi])); n_head = A_['groups'].get(0, 0)
            fa = None
            for f in Pt['face']: fa = arrays(f) if fa is None else cat(fa, arrays(f))
            # the face's pieces go into the head's range: right after the head's own triangles
            n0 = len(A_['pos']); idx = A_['idx'][:n_head] + [i + n0 for i in fa['idx']] + A_['idx'][n_head:]
            A_ = {'pos': np.concatenate([A_['pos'], fa['pos']]), 'nor': np.concatenate([A_['nor'], fa['nor']]), 'col': A_['col'] + fa['col'], 'pnt': A_['pnt'] + fa['pnt'], 'idx': idx, 'groups': dict(A_['groups'])}
            A_['groups'][0] = n_head + len(fa['idx']); first = 0; cover[name] = {}
            for gi, gn in enumerate(COVER_ORDER): cover[name][gn] = [first, A_['groups'].get(gi, 0)]; first += A_['groups'].get(gi, 0)
        elif Pt.get('sides'): A_ = arrays(o, lambda pi, o=o: 0 if o.data.polygons[pi].center.x > 0 else 1)          # the right glove's triangles first, then the left's
        else: A_ = arrays(o)
        ntri = len(A_['idx']) // 3
        if Pt['kind'] == 'skin':
            J = B_[sx].J; idx, w = K.weights(J, A_['pos'], cls='torso' if Pt.get('torso') else ('arm' if Pt.get('arm') else 'body'))
            if 'body' in Pt or Pt.get('sides') or name == 'tape_L': idx, w = lay_fingers(sx, A_['pos'], idx, w)
            A_['joints'] = idx; A_['weights'] = w; A_['pos'] = GLB.to_game(A_['pos']); A_['nor'] = GLB.to_game(A_['nor'])
            ni, s_ = Wr.skinned(name, A_, skin[sx]); roots.append(ni); info[name] = {'skinned': True, 'sex': sx, 'tris': ntri}
            if Pt.get('sides'): info[name]['sides'] = {'R': [0, A_['groups'].get(0, 0)], 'L': [A_['groups'].get(0, 0), A_['groups'].get(1, 0)]}
        else:
            b = Pt['bone']; A_['pos'] = GLB.to_game(A_['pos'] - np.array(B_['m'].J[b])); A_['nor'] = GLB.to_game(A_['nor']); ni, s_ = Wr.rigid(name, A_)
            Wr.nodes[bone_node[b]].setdefault('children', []).append(ni); info[name] = {'bone': b, 'sex': sx, 'tris': ntri}
        src[name] = (ni, s_)
    # the parts that are pieces of another's vertices
    for F in ('', 'F'):
        b = 'body' + F; ni, s_ = src[b]
        for nm, grp in (('head' + F, 'head'), ('handbare' + F, 'hands')):
            a = Wr.alias(nm, s_, cover[b][grp][0], cover[b][grp][1], ni); roots.append(a); info[nm] = {'skinned': True, 'sex': 'f' if F else 'm', 'tris': cover[b][grp][1] // 3, 'of': b}
    # the hands by their old names: every grip is the same glove (its right or its left half), posed by the fingers' turns in 'grips'
    for F in ('', 'F'):
        ni, s_ = src['glove' + F]; sd_ = info['glove' + F]['sides']; sx = 'f' if F else 'm'
        names = [('h%s_%s' % (h, g), h) for g in K.GRIPS for h in 'RL'] + [('hand', 'R'), ('hand_lo', 'R')] if not F else [('hRF', 'R'), ('hLF', 'L')]
        for nm, h in names:
            a = Wr.alias(nm, s_, sd_[h][0], sd_[h][1], ni); roots.append(a); info[nm] = {'skinned': True, 'sex': sx, 'tris': sd_[h][1] // 3, 'of': 'glove' + F}
    G3 = np.array([[1, 0, 0], [0, 0, 1], [0, -1, 0.0]]); grips = {}
    for sx in 'mf':
        grips[sx] = {}
        for g in K.GRIPS:
            L = K.grip_turns(sx, g); e = {'turn': {b: [round(x, 5) for x in GLB.quat(G3 @ R_ @ G3.T)] for b, R_ in L.items()}}
            for h in 'RL': at, ax = K.grip_point(sx, g, h); e[h] = {'at': [round(float(x), 4) for x in GLB.to_game(at)], 'ax': [round(float(x), 4) for x in GLB.to_game(ax / np.linalg.norm(ax))]}
            grips[sx][g] = e
    ex = {'format': 'folk2/1: docs/systemer/folk-om-bord.md 5.33b and tools/harbour/kropp_glb.py',
          'frame': 'x right, y up, z back (the person faces -z), metres, the ground at y = 0; skinned parts in the rest pose, rigid parts from their bone\'s joint',
          'bones': [n for n, _ in K.BONES], 'parents': [p for _, p in K.BONES], 'rest': rest, 'parts': info, 'cover': cover,
          'zones': {'1': 'jacket', '3': 'trousers', '4': 'skin', '5': 'hair', '6': 'hat', '7': 'shoes'}, 'grips': grips, 'limits': K.LIMITS,
          'twist': {'utw': 'uarm', 'ftw': 'farm', 'ttw': 'thigh'},
          'vest': GD.VEST_FOR, 'vestHair': GD.VEST_HAIR, 'spread': K.SPREAD,
          'source': 'the skin: "Realistic White Male and Female Low Poly" by novisoj (RenderHub, Extended Use License), tools/harbour/kilde/LISENS.md'}
    return Wr.done(path, roots, ex), info


if __name__ == '__main__' and not [a for a in sys.argv[1:] if a in ('plagg', 'kropp')]:
    t0 = time.time(); os.makedirs(OUT, exist_ok=True)
    parts, B_, C = build_all(); bake_all(parts)
    glb = os.path.join(OUT, 'folk2.glb'); n, info = export(parts, B_, glb)
    if 'dry' not in sys.argv: open(os.path.join(ROOT, 'src', 'data', 'folk2.b64'), 'w').write(base64.b64encode(open(glb, 'rb').read()).decode())
    print('folk2 GLB %.2f MB, %d parts, %.0f s' % (n / 1e6, len(info), time.time() - t0))
    print(', '.join('%s %d' % (k, v['tris']) for k, v in info.items()))
    sys.exit()


if __name__ == '__main__' and 'plagg' in sys.argv:
    # a look at the garments on the bodies (out/kp_*.png)
    import arbeider as A
    os.makedirs(OUT, exist_ok=True); reset(); A.colours(); C = A.C
    C['suit'] = mat('suit', (0.95, 0.42, 0.07), 0.45, zone=1); C['trou'] = mat('trousers', (0.16, 0.20, 0.30), 0.2, zone=3)
    BM, BF = Body('m', C['skin']), Body('f', C['skin']); parts = build_garments(BM, BF, C)
    parts['body'] = {'o': BM.o, 'sex': 'm', 'var': BM.d}; parts['bodyF'] = {'o': BF.o, 'sex': 'f', 'var': BF.d}
    for n, P in parts.items(): P['o'].hide_render = True; print('%-10s %5d tris' % (n, sum(len(p.vertices) - 2 for p in P['o'].data.polygons)))
    limbs = ['uarm', 'farm', 'thigh', 'shin']; i = 0; row = []
    for B, tab in ((BM, ['torso', 'sweater', 'oilskin', 'parka', 'fleece']), (BF, ['jacketF', 'sweaterF', 'oilskinF', 'parkaF', 'fleeceF'])):
        for j, jn in enumerate(tab):
            build = [None, 'thin', 'heavy', None, 'muscular'][j]; pose = ['hvile', 'stå', 'stå', 'armene opp', 'sittende'][j]
            figure(parts, [jn] + limbs + ['body' if B.sex == 'm' else 'bodyF'], B, build, pose, x=-(i - 4.5) * 0.95); i += 1
    bm = bmesh.new(); bm.faces.new([bm.verts.new(p) for p in ((-9, -9, 0), (9, -9, 0), (9, 9, 0), (-9, 9, 0))]); obj_from_bm('ground', bm, [mat('ground', (0.5, 0.5, 0.52), 0.1)])
    setup_render(2600, 760, samples=24)
    camera((0.0, 10.4, 1.05), (0.0, 0, 0.88), lens=50); render(os.path.join(OUT, 'kp_front.png'))
    camera((8.0, 6.6, 1.5), (0.0, 0, 0.85), lens=50); render(os.path.join(OUT, 'kp_3q.png'))
    sys.exit()


if __name__ == '__main__' and 'kropp' in sys.argv:
    # a first look: the bodies in their builds and in the check's poses (out/kb_*.png)
    os.makedirs(OUT, exist_ok=True); reset(); skin = mat('skin', (0.62, 0.62, 0.63), 0.25, zone=4)
    for sex in 'mf':
        B = Body(sex, skin); cg = cover_groups(B); print(' one piece:', connected(B.t, len(B.v)), ' tris per cover group:', {n: int((cg == i).sum()) for i, n in enumerate(COVER_ORDER)})
        B.o.hide_render = True
        cols = [('normal', None, 'hvile')] + [(b, f, 'hvile') for b, f in K.BUILDS[sex].items() if b != 'normal'] + [('normal', None, p) for p in K.CHECK_POSES]
        for i, (b, f, pose) in enumerate(cols):
            v = B.v.copy(); J = dict(B.J)
            if f:
                for fn, wt in f.items():
                    if wt and fn in B.d: v = v + wt * B.d[fn]
                J = K.joints(sex, f)
            L, root = K.POSES(J)[pose]; M, _ = K.pose_mats(J, L, root); idx, w = K.weights(J, v); v = K.skin(v, idx, w, M)
            o = np_mesh('%s_%d' % (sex, i), v, B.t, skin); o.data.shade_smooth(); o.location = (-(i - (len(cols) - 1) / 2) * 0.95, 0, 0 if sex == 'm' else 0)
            o['row'] = sex
    bm = bmesh.new(); bm.faces.new([bm.verts.new(p) for p in ((-9, -9, 0), (9, -9, 0), (9, 9, 0), (-9, 9, 0))]); obj_from_bm('ground', bm, [mat('ground', (0.5, 0.5, 0.52), 0.1)])
    for sex in 'mf':
        for o in bpy.data.objects:
            if o.type == 'MESH' and 'row' in o: o.hide_render = o['row'] != sex
        setup_render(2400, 760, samples=24)
        camera((0.0, 9.6, 1.05), (0.0, 0, 0.88), lens=50); render(os.path.join(OUT, 'kb_%s_front.png' % sex))
        camera((7.5, 6.2, 1.5), (0.0, 0, 0.85), lens=50); render(os.path.join(OUT, 'kb_%s_3q.png' % sex))
