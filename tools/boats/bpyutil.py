"""Helpers for building the vessels in Blender (bpy as a Python module): meshes from grids and polygons, tubes and cylinders,
materials that carry the game colour (rgb, gloss and paint zone), booleans, ambient occlusion baked into the vertices, renders
for checking, and a writer for a compact GLB (positions as 16-bit integers, normals and colours as bytes; KHR_mesh_quantization).
Blender frame here: x forward, y to port, z up (the drawings' frame); the boat script gives the transform to the game's frame."""
import bpy, bmesh, math, json, struct, base64
from mathutils import Vector, Matrix

V = Vector


def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    sc.render.engine = 'CYCLES'; sc.cycles.device = 'CPU'
    return sc


# ---------- materials: one per game colour; the export reads rgb, gloss and zone from them ----------
MATS = {}
def mat(name, rgb, gloss=0.4, zone=0, metal=0.0, emit=0.0):
    if name in MATS: return MATS[name]
    m = bpy.data.materials.new(name); m.use_nodes = True
    b = m.node_tree.nodes.get('Principled BSDF')
    b.inputs['Base Color'].default_value = (rgb[0], rgb[1], rgb[2], 1)
    b.inputs['Roughness'].default_value = max(0.05, 1 - 0.85 * gloss)
    b.inputs['Metallic'].default_value = metal
    if emit: b.inputs['Emission Color'].default_value = (rgb[0], rgb[1], rgb[2], 1); b.inputs['Emission Strength'].default_value = emit
    m['rgb'] = list(rgb); m['gloss'] = gloss; m['zone'] = zone
    MATS[name] = m; return m


def link(obj):
    bpy.context.scene.collection.objects.link(obj); return obj


def obj_from_bm(name, bm, mats):
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    for m in mats: me.materials.append(m)
    return link(bpy.data.objects.new(name, me))


def shade(obj, angle=35):
    me = obj.data
    me.shade_smooth()
    me.set_sharp_from_angle(angle=math.radians(angle))
    return obj


def orient(o, out):
    """turn every face so its normal points along out(centre) (outwards, up, inboard ...)"""
    bm = bmesh.new(); bm.from_mesh(o.data)
    for f in bm.faces:
        f.normal_update(); d = V(out(f.calc_center_median()))
        if f.normal.dot(d) < 0: f.normal_flip()
    bm.to_mesh(o.data); bm.free(); o.data.update()
    return o


def grid(name, G, matf, closed_v=False, flip=False, angle=35, out=None):
    """G[i][j]: rows i (along the length) of points j (across); matf(i, j) gives a material for the cell"""
    bm = bmesh.new(); R = len(G); C = len(G[0]); vs = [[bm.verts.new(G[i][j]) for j in range(C)] for i in range(R)]
    mats = []; mi = {}
    for i in range(R - 1):
        for j in range(C - 1 + (1 if closed_v else 0)):
            j1 = (j + 1) % C
            q = [vs[i][j], vs[i + 1][j], vs[i + 1][j1], vs[i][j1]]
            if flip: q.reverse()
            # drop collapsed corners (the stem, the keel line)
            u = []
            for v in q:
                if not u or (v.co - u[-1].co).length > 1e-6: u.append(v)
            if len(u) > 2 and (u[0].co - u[-1].co).length < 1e-6: u.pop()
            if len(u) < 3: continue
            try: f = bm.faces.new(u)
            except ValueError: continue
            m = matf(i, j)
            if m.name not in mi: mi[m.name] = len(mats); mats.append(m)
            f.material_index = mi[m.name]
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)
    if out:
        for f in bm.faces:
            f.normal_update()
            if f.normal.dot(V(out(f.calc_center_median()))) < 0: f.normal_flip()
    return shade(obj_from_bm(name, bm, mats), angle)


def poly_prism(name, poly, z0, z1, m, bevel=0.0, seg=2, top=True, bottom=True):
    """a prism from a 2D polygon (x, y) between z0 and z1; poly counter-clockwise seen from above"""
    bm = bmesh.new(); b = [bm.verts.new((x, y, z0)) for x, y in poly]; t = [bm.verts.new((x, y, z1)) for x, y in poly]; n = len(poly)
    for i in range(n):
        j = (i + 1) % n; bm.faces.new([b[i], b[j], t[j], t[i]])
    if top: bm.faces.new(t)
    if bottom: bm.faces.new(list(reversed(b)))
    o = obj_from_bm(name, bm, [m])
    if bevel: bevel_mod(o, bevel, seg)
    return shade(o)


def loft_rings(name, rings, m, cap0=True, cap1=True, angle=35):
    """closed rings of equal length stacked along any direction, joined by quads; caps fill the first and last ring"""
    bm = bmesh.new(); vs = [[bm.verts.new(p) for p in r] for r in rings]; n = len(rings[0])
    for i in range(len(rings) - 1):
        for j in range(n):
            k = (j + 1) % n
            try: bm.faces.new([vs[i][j], vs[i][k], vs[i + 1][k], vs[i + 1][j]])
            except ValueError: pass
    if cap0: bm.faces.new(list(reversed(vs[0])))
    if cap1: bm.faces.new(vs[-1])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return shade(obj_from_bm(name, bm, [m]), angle)


def box(name, x0, x1, y0, y1, z0, z1, m, bevel=0.0, seg=2):
    return poly_prism(name, [(x0, y0), (x1, y0), (x1, y1), (x0, y1)], z0, z1, m, bevel, seg)


def frame_of(d):
    d = V(d).normalized(); up = V((0, 0, 1)) if abs(d.z) < 0.95 else V((1, 0, 0))
    s = d.cross(up).normalized(); u = s.cross(d).normalized(); return s, u, d


def cyl(name, p0, p1, r, m, seg=16, caps=True, r1=None, angle=40):
    p0 = V(p0); p1 = V(p1); s, u, d = frame_of(p1 - p0); r1 = r if r1 is None else r1
    rings = [[p + (s * math.cos(a) + u * math.sin(a)) * rr for a in [2 * math.pi * k / seg for k in range(seg)]] for p, rr in ((p0, r), (p1, r1))]
    return loft_rings(name, rings, m, caps, caps, angle)


def tube(name, pts, r, m, seg=8, caps=True):
    pts = [V(p) for p in pts]; rings = []
    up0 = None
    for i, p in enumerate(pts):
        a = pts[max(0, i - 1)]; b = pts[min(len(pts) - 1, i + 1)]; d = (b - a).normalized()
        s, u, _ = frame_of(d)
        if up0 is not None and s.dot(up0) < 0: s = -s; u = -u
        up0 = s
        rings.append([p + (s * math.cos(t) + u * math.sin(t)) * r for t in [2 * math.pi * k / seg for k in range(seg)]])
    return loft_rings(name, rings, m, caps, caps, 60)


def torus(name, c, axis, R, r, m, seg=24, rseg=8):
    c = V(c); s, u, d = frame_of(axis); rings = []
    for k in range(seg):
        a = 2 * math.pi * k / seg; cen = c + (s * math.cos(a) + u * math.sin(a)) * R; out = (cen - c).normalized()
        rings.append([cen + (out * math.cos(b) + d * math.sin(b)) * r for b in [2 * math.pi * q / rseg for q in range(rseg)]])
    rings.append(rings[0])
    return loft_rings(name, rings, m, False, False, 60)


def sphere(name, c, r, m, scale=(1, 1, 1), seg=16, rings=8):
    bm = bmesh.new(); bmesh.ops.create_uvsphere(bm, u_segments=seg, v_segments=rings, radius=r)
    for v in bm.verts: v.co = V((v.co.x * scale[0] + c[0], v.co.y * scale[1] + c[1], v.co.z * scale[2] + c[2]))
    return shade(obj_from_bm(name, bm, [m]), 60)


def bevel_mod(o, w, seg=2):
    b = o.modifiers.new('bevel', 'BEVEL'); b.width = w; b.segments = seg; b.limit_method = 'ANGLE'; b.angle_limit = math.radians(40); b.harden_normals = False
    return o


def solidify(o, t, inner_mat_offset=0):
    s = o.modifiers.new('solid', 'SOLIDIFY'); s.thickness = t; s.offset = -1; s.use_rim = True; s.material_offset = inner_mat_offset
    return o


def apply_all(o):
    with bpy.context.temp_override(object=o, active_object=o, selected_objects=[o], selected_editable_objects=[o]):
        for md in list(o.modifiers): bpy.ops.object.modifier_apply(modifier=md.name)
    return o


def cut(o, cutters, keep=False):
    """boolean difference of each cutter from o (exact solver), applied; the cutters are deleted unless keep"""
    apply_all(o)
    for c in cutters:
        md = o.modifiers.new('cut', 'BOOLEAN'); md.operation = 'DIFFERENCE'; md.solver = 'EXACT'; md.object = c
        apply_all(o)
    if not keep:
        for c in cutters: bpy.data.objects.remove(c, do_unlink=True)
    return o


def rrect(cx, cy, w, h, r, n=4, skew=0.0):
    """a rounded rectangle in 2D (u, v) centred at (cx, cy); skew moves the top edge along u (raked windows)"""
    r = min(r, w / 2 - 1e-4, h / 2 - 1e-4); pts = []
    for (ox, oy, a0) in ((w / 2 - r, h / 2 - r, 0), (-w / 2 + r, h / 2 - r, 90), (-w / 2 + r, -h / 2 + r, 180), (w / 2 - r, -h / 2 + r, 270)):
        for k in range(n + 1):
            a = math.radians(a0 + 90 * k / n); x = ox + r * math.cos(a); y = oy + r * math.sin(a)
            pts.append((cx + x + skew * (y / h), cy + y))
    return pts


def plate_cutter(name, origin, ax_u, ax_v, poly_uv, depth=0.5):
    """a prism cutting through a wall: poly in the wall's (u, v) plane at origin, pushed both ways along the normal"""
    o = V(origin); u = V(ax_u).normalized(); v = V(ax_v).normalized(); n = u.cross(v).normalized()
    ring = lambda off: [o + u * a + v * b + n * off for a, b in poly_uv]
    return loft_rings(name, [ring(-depth), ring(depth)], mat('cutter', (1, 0, 1)))


def plate(name, origin, ax_u, ax_v, poly_uv, m, off=0.0, thick=0.0, nrm=None):
    """a flat plate (glass, a board) in a wall's (u, v) plane, moved off along the normal; nrm sets which way it faces"""
    o = V(origin); u = V(ax_u).normalized(); v = V(ax_v).normalized(); n = V(nrm).normalized() if nrm else u.cross(v).normalized()
    ring = lambda d: [o + u * a + v * b + n * d for a, b in poly_uv]
    if thick: return loft_rings(name, [ring(off - thick), ring(off)], m)
    bm = bmesh.new(); f = bm.faces.new([bm.verts.new(p) for p in ring(off)]); f.normal_update()
    if f.normal.dot(n) < 0: f.normal_flip()
    return shade(obj_from_bm(name, bm, [m]))


def frame_ring(name, origin, ax_u, ax_v, outer, inner, m, off=0.01, depth=0.03, nrm=None):
    """a window frame: the band between two rings of the same length in a wall's plane, with a little depth into the wall"""
    o = V(origin); u = V(ax_u).normalized(); v = V(ax_v).normalized(); n = V(nrm).normalized() if nrm else u.cross(v).normalized()
    P = lambda pts, d: [o + u * a + v * b + n * d for a, b in pts]
    bm = bmesh.new(); A = [bm.verts.new(p) for p in P(outer, off)]; B = [bm.verts.new(p) for p in P(inner, off)]
    A0 = [bm.verts.new(p) for p in P(outer, off - depth)]; B0 = [bm.verts.new(p) for p in P(inner, off - depth)]; k = len(outer)
    front = []
    for i in range(k):
        j = (i + 1) % k
        for q, fr in (([A[i], A[j], B[j], B[i]], True), ([A0[i], A[i], A[j], A0[j]], False), ([B[i], B[j], B0[j], B0[i]], False)):
            try:
                f = bm.faces.new(q)
                if fr: front.append(f)
            except ValueError: pass
    for f in front:
        f.normal_update()
        if f.normal.dot(n) < 0: f.normal_flip()
    return shade(obj_from_bm(name, bm, [m]), 50)


def join(objs, name):
    objs = [o for o in objs if o is not None]
    for o in objs: apply_all(o)
    ctx = {'object': objs[0], 'active_object': objs[0], 'selected_objects': objs, 'selected_editable_objects': objs}
    with bpy.context.temp_override(**ctx): bpy.ops.object.join()
    o = objs[0]; o.name = name; o.data.name = name
    return o


def mirror_y(o):
    """a copy mirrored to the other side (y -> -y)"""
    c = o.copy(); c.data = o.data.copy(); link(c)
    bm = bmesh.new(); bm.from_mesh(c.data)
    for v in bm.verts: v.co.y = -v.co.y
    bmesh.ops.reverse_faces(bm, faces=bm.faces)
    bm.to_mesh(c.data); bm.free(); shade(c)
    return c


def bake_ao(o, samples=48, distance=0.9):
    sc = bpy.context.scene; sc.cycles.samples = samples; sc.cycles.bake_type = 'AO'
    if bpy.context.scene.world is None: sc.world = bpy.data.worlds.new('w')
    sc.world.light_settings.distance = distance
    me = o.data
    if 'AO' not in me.color_attributes: me.color_attributes.new('AO', 'BYTE_COLOR', 'CORNER')
    me.color_attributes.active_color = me.color_attributes['AO']
    for p in bpy.context.scene.objects: p.select_set(False)
    o.select_set(True); bpy.context.view_layer.objects.active = o
    bpy.ops.object.bake(type='AO', target='VERTEX_COLORS')
    return o


# ---------- the GLB writer ----------
def mesh_arrays(o, xf_p, xf_n, ao=True):
    """triangles of an object as unique vertices: position, normal, colour (rgb x ao, gloss) and paint (zone, ao)"""
    dg = bpy.context.evaluated_depsgraph_get(); oe = o.evaluated_get(dg); me = oe.to_mesh()
    me.calc_loop_triangles(); M = o.matrix_world; R = M.to_3x3()
    aoa = me.color_attributes.get('AO') if ao else None
    slots = [s.material for s in o.material_slots]
    pos = []; nor = []; col = []; pnt = []; idx = []; seen = {}
    for t in me.loop_triangles:
        m = slots[t.material_index] if slots else None
        rgb = m['rgb'] if m and 'rgb' in m else (0.8, 0.8, 0.8); gl = m['gloss'] if m and 'gloss' in m else 0.3; zn = m['zone'] if m and 'zone' in m else 0
        tri = []
        for li in t.loops:
            l = me.loops[li]; p = xf_p(M @ me.vertices[l.vertex_index].co); n = xf_n((R @ me.corner_normals[li].vector).normalized())
            a = aoa.data[li].color[0] if aoa else 1.0
            a = 0.3 + 0.7 * a
            c = (int(round(min(1, rgb[0] * a) * 255)), int(round(min(1, rgb[1] * a) * 255)), int(round(min(1, rgb[2] * a) * 255)), int(round(gl * 255)))
            key = (round(p[0], 4), round(p[1], 4), round(p[2], 4), round(n[0], 2), round(n[1], 2), round(n[2], 2), c, zn)
            if key not in seen:
                seen[key] = len(pos); pos.append(p); nor.append(n); col.append(c); pnt.append((zn, int(round(a * 255)), 0, 0))
            tri.append(seen[key])
        idx.extend(tri)
    oe.to_mesh_clear()
    return {'pos': pos, 'nor': nor, 'col': col, 'pnt': pnt, 'idx': idx}


def write_glb(path, parts, extras):
    """parts: [(name, arrays, alpha)] -> a GLB with one node and mesh per part"""
    bin_ = bytearray(); views = []; accs = []; meshes = []; nodes = []
    def view(data, stride=None, target=None):
        while len(bin_) % 4: bin_.append(0)
        off = len(bin_); bin_.extend(data); v = {'buffer': 0, 'byteOffset': off, 'byteLength': len(data)}
        if stride: v['byteStride'] = stride
        if target: v['target'] = target
        views.append(v); return len(views) - 1
    def acc(view_i, ctype, count, typ, normalized=False, mn=None, mx=None):
        a = {'bufferView': view_i, 'componentType': ctype, 'count': count, 'type': typ}
        if normalized: a['normalized'] = True
        if mn is not None: a['min'] = mn; a['max'] = mx
        accs.append(a); return len(accs) - 1
    mats = [{'name': 'paint', 'pbrMetallicRoughness': {'baseColorFactor': [1, 1, 1, 1], 'metallicFactor': 0, 'roughnessFactor': 0.6}},
            {'name': 'glass', 'pbrMetallicRoughness': {'baseColorFactor': [1, 1, 1, 0.35], 'metallicFactor': 0, 'roughnessFactor': 0.1}, 'alphaMode': 'BLEND'}]
    for name, A, alpha in parts:
        P = A['pos']; n = len(P)
        lo = [min(p[k] for p in P) for k in range(3)]; hi = [max(p[k] for p in P) for k in range(3)]
        c = [(lo[k] + hi[k]) / 2 for k in range(3)]; h = [max(1e-6, (hi[k] - lo[k]) / 2) for k in range(3)]
        q = bytearray(); [q.extend(struct.pack('<hhhh', *[int(round(max(-1, min(1, (p[k] - c[k]) / h[k])) * 32767)) for k in range(3)], 0)) for p in P]
        vp = view(bytes(q), 8, 34962); ap = acc(vp, 5122, n, 'VEC3', True, [-32767] * 3, [32767] * 3)
        qn = bytearray(); [qn.extend(struct.pack('<bbbb', *[int(round(max(-1, min(1, v)) * 127)) for v in nn], 0)) for nn in A['nor']]
        vn = view(bytes(qn), 4, 34962); an = acc(vn, 5120, n, 'VEC3', True)
        vc = view(bytes(bytearray(b for cc in A['col'] for b in cc)), 4, 34962); ac = acc(vc, 5121, n, 'VEC4', True)
        vq = view(bytes(bytearray(b for cc in A['pnt'] for b in cc)), 4, 34962); aq = acc(vq, 5121, n, 'VEC4')
        I = A['idx']; big = n > 65535
        vi = view(struct.pack('<%d%s' % (len(I), 'I' if big else 'H'), *I), None, 34963); ai = acc(vi, 5125 if big else 5123, len(I), 'SCALAR')
        meshes.append({'name': name, 'primitives': [{'attributes': {'POSITION': ap, 'NORMAL': an, 'COLOR_0': ac, '_PAINT': aq}, 'indices': ai, 'material': 1 if alpha < 1 else 0}]})
        nodes.append({'name': name, 'mesh': len(meshes) - 1, 'translation': c, 'scale': h})
    while len(bin_) % 4: bin_.append(0)
    js = {'asset': {'version': '2.0', 'generator': 'Kystfiske tools/boats'}, 'extensionsUsed': ['KHR_mesh_quantization'], 'extensionsRequired': ['KHR_mesh_quantization'],
          'scene': 0, 'scenes': [{'nodes': list(range(len(nodes))), 'extras': extras}], 'nodes': nodes, 'meshes': meshes, 'materials': mats,
          'accessors': accs, 'bufferViews': views, 'buffers': [{'byteLength': len(bin_)}]}
    j = json.dumps(js, separators=(',', ':')).encode()
    while len(j) % 4: j += b' '
    out = struct.pack('<III', 0x46546C67, 2, 12 + 8 + len(j) + 8 + len(bin_)) + struct.pack('<II', len(j), 0x4E4F534A) + j + struct.pack('<II', len(bin_), 0x004E4942) + bytes(bin_)
    open(path, 'wb').write(out)
    return len(out)


# ---------- renders for checking ----------
def setup_render(w, h, samples=32, transparent=False, sky=True):
    sc = bpy.context.scene; sc.render.resolution_x = w; sc.render.resolution_y = h; sc.render.resolution_percentage = 100
    sc.cycles.samples = samples; sc.render.film_transparent = transparent; sc.cycles.use_denoising = False
    if sc.world is None: sc.world = bpy.data.worlds.new('w')
    w_ = sc.world; w_.use_nodes = True; bg = w_.node_tree.nodes.get('Background')
    bg.inputs['Color'].default_value = (0.55, 0.68, 0.85, 1) if sky else (1, 1, 1, 1); bg.inputs['Strength'].default_value = 0.9
    if 'sun' not in bpy.data.objects:
        l = bpy.data.lights.new('sun', 'SUN'); l.energy = 3.2; l.angle = math.radians(4)
        so = link(bpy.data.objects.new('sun', l)); so.rotation_euler = (math.radians(50), math.radians(10), math.radians(-35))
    return sc


def camera(loc, look, ortho=None, lens=35):
    sc = bpy.context.scene
    if 'cam' in bpy.data.objects: cam = bpy.data.objects['cam']
    else: cam = link(bpy.data.objects.new('cam', bpy.data.cameras.new('cam')))
    cam.location = V(loc); d = (V(look) - V(loc)); cam.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()
    if ortho: cam.data.type = 'ORTHO'; cam.data.ortho_scale = ortho
    else: cam.data.type = 'PERSP'; cam.data.lens = lens
    cam.data.clip_end = 500; sc.camera = cam
    return cam


def render(path):
    bpy.context.scene.render.filepath = path; bpy.ops.render.render(write_still=True)
