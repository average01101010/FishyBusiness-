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
    # the per-corner tint (Acc.done(tint=...)): multiplies the colour where its alpha is 1, nothing where the mesh has none
    # (the game shades its colours as they are, in display space; the renders take them to linear so they look the same)
    nt = m.node_tree; at = nt.nodes.new('ShaderNodeAttribute'); at.attribute_name = 'TINT'
    ga = nt.nodes.new('ShaderNodeGamma'); ga.inputs['Gamma'].default_value = 2.2; nt.links.new(at.outputs['Color'], ga.inputs['Color'])
    mx = nt.nodes.new('ShaderNodeMix'); mx.data_type = 'RGBA'; mx.blend_type = 'MULTIPLY'
    mx.inputs[6].default_value = (rgb[0] ** 2.2, rgb[1] ** 2.2, rgb[2] ** 2.2, 1)
    nt.links.new(at.outputs['Alpha'], mx.inputs[0]); nt.links.new(ga.outputs['Color'], mx.inputs[7]); nt.links.new(mx.outputs[2], b.inputs['Base Color'])
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
    tia = me.color_attributes.get('TINT')
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
            tc = tia.data[li].color if tia else None
            tt = (tc[0], tc[1], tc[2]) if tc is not None and tc[3] > 0.5 else (1.0, 1.0, 1.0)
            c = (int(round(max(0, min(1, rgb[0] * tt[0] * a)) * 255)), int(round(max(0, min(1, rgb[1] * tt[1] * a)) * 255)), int(round(max(0, min(1, rgb[2] * tt[2] * a)) * 255)), int(round(gl * 255)))
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


# ---------- shared by the boat scripts: tables, polygons, pictures and the export ----------
def interp(tab, x):
    """monotone cubic through (x, y) pairs (Fritsch-Carlson)"""
    xs = [p[0] for p in tab]; ys = [p[1] for p in tab]; n = len(xs)
    if x <= xs[0]: return ys[0]
    if x >= xs[-1]: return ys[-1]
    d = [(ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]) for i in range(n - 1)]
    m = [d[0]] + [0 if d[i - 1] * d[i] <= 0 else (d[i - 1] + d[i]) / 2 for i in range(1, n - 1)] + [d[-1]]
    for i in range(n - 1):
        if d[i] == 0: m[i] = m[i + 1] = 0
        else:
            a = m[i] / d[i]; b = m[i + 1] / d[i]; s = a * a + b * b
            if s > 9: t = 3 / math.sqrt(s); m[i] = t * a * d[i]; m[i + 1] = t * b * d[i]
    for i in range(n - 1):
        if xs[i] <= x <= xs[i + 1]:
            h = xs[i + 1] - xs[i]; t = (x - xs[i]) / h
            return (ys[i] * (2 * t ** 3 - 3 * t ** 2 + 1) + h * m[i] * (t ** 3 - 2 * t ** 2 + t) + ys[i + 1] * (-2 * t ** 3 + 3 * t ** 2) + h * m[i + 1] * (t ** 3 - t ** 2))


def resample(sec, bands):
    """points along a section polyline [(y, z)] with rows exactly at the colour boundaries: bands [(z_top, n)] from the bottom up"""
    L = [0.0]
    for a, b in zip(sec, sec[1:]): L.append(L[-1] + math.hypot(b[0] - a[0], b[1] - a[1]))
    def at_len(s):
        for i in range(1, len(L)):
            if L[i] >= s:
                t = (s - L[i - 1]) / max(1e-9, L[i] - L[i - 1]); a = sec[i - 1]; b = sec[i]; return (a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t)
        return sec[-1]
    def len_at_z(z):
        if z <= sec[0][1]: return 0.0
        for i in range(1, len(sec)):
            if sec[i][1] >= z:
                a = sec[i - 1]; b = sec[i]; t = (z - a[1]) / max(1e-9, b[1] - a[1]); return L[i - 1] + (L[i] - L[i - 1]) * t
        return L[-1]
    pts = [sec[0]]; s0 = 0.0
    for ztop, n in bands:
        s1 = max(s0, len_at_z(ztop) if ztop is not None else L[-1])
        for k in range(1, n + 1): pts.append(at_len(s0 + (s1 - s0) * k / n))
        s0 = s1
    return pts


def offset_poly(poly, d):
    """a convex counter-clockwise polygon (x, y) pushed out by d"""
    n = len(poly); lines = []
    for i in range(n):
        a = poly[i]; b = poly[(i + 1) % n]; ex = b[0] - a[0]; ey = b[1] - a[1]; L = math.hypot(ex, ey); nx, ny = ey / L, -ex / L
        lines.append(((a[0] + nx * d, a[1] + ny * d), (ex / L, ey / L)))
    out = []
    for i in range(n):
        (p1, d1), (p2, d2) = lines[i - 1], lines[i]
        den = d1[0] * d2[1] - d1[1] * d2[0]
        t = ((p2[0] - p1[0]) * d2[1] - (p2[1] - p1[1]) * d2[0]) / den
        out.append((p1[0] + d1[0] * t, p1[1] + d1[1] * t))
    return out


def beauty(out_dir, prefix, wl, shots):
    """renders to look at, on calm water at the waterline wl: shots [(name, camera, target, lens)]"""
    import os
    if 'water' not in bpy.data.objects:
        bm = bmesh.new(); s_ = 60
        bm.faces.new([bm.verts.new(p) for p in ((-s_, -s_, wl), (s_, -s_, wl), (s_, s_, wl), (-s_, s_, wl))])
        obj_from_bm('water', bm, [mat('water', (0.03, 0.09, 0.12), 0.9)])
    bpy.data.objects['water'].hide_render = False
    setup_render(1280, 720, samples=40)
    for nm, loc, look, lens in shots:
        camera(loc, look, lens=lens); render(os.path.join(out_dir, '%s_%s.png' % (prefix, nm)))
    bpy.data.objects['water'].hide_render = True


def side_picture(out_dir, path_b64, cx, cz, ortho):
    """the side view for the boat market: bow to the right, transparent, cropped, WebP as base64"""
    import os
    from PIL import Image
    setup_render(900, 760, samples=24, transparent=True)
    camera((cx, -40, cz), (cx, 0, cz), ortho=ortho); png = os.path.join(out_dir, 'side_pic.png'); render(png)
    im = Image.open(png); bb = im.getbbox(); im = im.crop(bb); im.thumbnail((360, 360), Image.LANCZOS)
    webp = os.path.join(out_dir, 'side_pic.webp'); im.save(webp, 'WEBP', quality=82, method=6)
    open(path_b64, 'w').write(base64.b64encode(open(webp, 'rb').read()).decode())
    return im.size, os.path.getsize(webp)


def on_drawing(render_png, drawing, box, out_png, alpha=0.55):
    """a render laid over a crop of a drawing (the drawing is not in the repository; its path comes from the environment)"""
    from PIL import Image
    r = Image.open(render_png).convert('RGBA'); g = Image.open(drawing).convert('RGBA').crop(box)
    if g.size != r.size: g = g.resize(r.size)
    a = r.split()[3].point(lambda v: int(v * alpha)); r.putalpha(a)
    g.alpha_composite(r); g.save(out_png)


def export_boat(build, to_game, to_game_n, out_dir, glb_name, data_b64, extras, side=None, dry=False, more=None):
    """bake and write a boat: build(fine) -> (solids, glass); lod0 + glass + lod1 into a GLB, base64 to data_b64 (unless dry), and the
    side picture side = (pic_b64, cx, cz, ortho). The objects of the fine build must already exist as BOAT0 and GLASS0.
    more: further parts [{name, obj, alpha, xf_p, xf_n, ao, show}] (a lid, a motor in its own frame ...), written after lod1."""
    import os
    boat = bpy.data.objects['BOAT0']; gl = bpy.data.objects['GLASS0']
    bake_ao(boat, samples=48, distance=0.9)
    A0 = mesh_arrays(boat, to_game, to_game_n); AG = mesh_arrays(gl, to_game, to_game_n, ao=False)
    AM = []
    for p in more or []:
        p['_o'] = p['obj']() if callable(p['obj']) else p['obj']          # a callable makes its object after the hull is baked
        if p.get('ao'): bake_ao(p['_o'], samples=32, distance=0.5)
        AM.append((p['name'], mesh_arrays(p['_o'], p.get('xf_p', to_game), p.get('xf_n', to_game_n), ao=bool(p.get('ao'))), p.get('alpha', 1.0)))
    # the simple version for the fleet at a distance
    for o in list(bpy.data.objects):
        if o.name not in ('cam', 'sun'): o.hide_render = True; o.hide_viewport = True
    s1, g1 = build(False); boat1 = join(s1, 'BOAT1')
    for o in g1: bpy.data.objects.remove(o, do_unlink=True)
    bake_ao(boat1, samples=16, distance=0.9)
    A1 = mesh_arrays(boat1, to_game, to_game_n)
    for o in [boat, gl] + [p['_o'] for p in more or [] if p.get('show')]: o.hide_render = False; o.hide_viewport = False
    boat1.hide_render = True
    size_pic = side_picture(out_dir, side[0] if not dry else os.path.join(out_dir, 'side_pic.b64'), *side[1:]) if side else None
    glb = os.path.join(out_dir, glb_name)
    n = write_glb(glb, [('lod0', A0, 1.0), ('glass', AG, 0.35), ('lod1', A1, 1.0)] + AM, extras)
    open(data_b64 if not dry else glb + '.b64', 'w').write(base64.b64encode(open(glb, 'rb').read()).decode())
    tri = lambda A: len(A['idx']) // 3
    print('GLB %.0f KB, lod0 %d tris / %d verts, glass %d tris, lod1 %d tris / %d verts; side picture %s' % (n / 1024, tri(A0), len(A0['pos']), tri(AG), tri(A1), len(A1['pos']), size_pic))
    return A0, A1


# ---------- one mesh for many small parts: faces with a material each (from tools/harbour/naust.py) ----------
class Acc:
    def __init__(self, name):
        self.name = name; self.bm = bmesh.new(); self.mats = []; self.ix = {}
    def mi(self, m):
        if m.name not in self.ix: self.ix[m.name] = len(self.mats); self.mats.append(m)
        return self.ix[m.name]
    def v(self, p): return self.bm.verts.new(p)
    def f(self, vs, m, out=None):
        try: fc = self.bm.faces.new(vs)
        except ValueError: return None
        fc.material_index = self.mi(m)
        if out is not None:
            fc.normal_update()
            if fc.normal.dot(V(out)) < 0: fc.normal_flip()
        return fc
    def poly(self, pts, m, out=None): return self.f([self.v(V(p)) for p in pts], m, out)
    def done(self, angle=35, tint=None):
        """the object; tint(point, material, normal) -> an rgb multiplier (or None) at every corner, for wear that runs across faces"""
        if not len(self.bm.faces): self.bm.free(); return None
        if tint:
            lay = self.bm.loops.layers.float_color.new('TINT')
            for fc in self.bm.faces:
                m = self.mats[fc.material_index]; fc.normal_update()
                for l in fc.loops:
                    t = tint(l.vert.co, m, fc.normal)
                    if t is not None: l[lay] = (t[0], t[1], t[2], 1.0)
        return shade(obj_from_bm(self.name, self.bm, self.mats), angle)


def obox(A, c, ax, ay, az, m, skip=()):
    """a box round c with half-extent vectors ax, ay, az; skip faces by name ('-z', '+y' ...)"""
    c = V(c); ax = V(ax); ay = V(ay); az = V(az)
    P = lambda i, j, k: c + ax * i + ay * j + az * k
    for nm, pts, out in (('-x', [P(-1, -1, -1), P(-1, 1, -1), P(-1, 1, 1), P(-1, -1, 1)], -ax), ('+x', [P(1, -1, -1), P(1, 1, -1), P(1, 1, 1), P(1, -1, 1)], ax),
                         ('-y', [P(-1, -1, -1), P(1, -1, -1), P(1, -1, 1), P(-1, -1, 1)], -ay), ('+y', [P(-1, 1, -1), P(1, 1, -1), P(1, 1, 1), P(-1, 1, 1)], ay),
                         ('-z', [P(-1, -1, -1), P(1, -1, -1), P(1, 1, -1), P(-1, 1, -1)], -az), ('+z', [P(-1, -1, 1), P(1, -1, 1), P(1, 1, 1), P(-1, 1, 1)], az)):
        if nm not in skip: A.poly(pts, m, out)

def abox(A, x0, x1, y0, y1, z0, z1, m, skip=()):
    obox(A, ((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2), ((x1 - x0) / 2, 0, 0), (0, (y1 - y0) / 2, 0), (0, 0, (z1 - z0) / 2), m, skip)

def beam(A, p0, p1, w, h, m, up=(0, 0, 1), skip=()):
    """a squared timber from p0 to p1, w wide and h high (h along up)"""
    p0 = V(p0); p1 = V(p1); d = p1 - p0; L = d.length; d.normalize(); u = V(up); s = d.cross(u).normalized(); u = s.cross(d).normalized()
    obox(A, (p0 + p1) / 2, d * (L / 2), s * (w / 2), u * (h / 2), m, skip)

def board(A, P, n, t, m, edges=True):
    """a board from its four front corners P (round it, bottom edge first) facing n, t thick behind; its back is left open, and
    edges='v' gives it only its two long sides"""
    P = [V(p) for p in P]; n = V(n); c = sum(P, V()) / 4
    A.poly(P, m, n)
    if edges:
        for i in ((1, 3) if edges == 'v' else range(4)):
            a, b = P[i], P[(i + 1) % 4]; A.poly([a, b, b - n * t, a - n * t], m, (a + b) / 2 - c)

def acyl(A, p0, p1, r, mf, seg=8, cuts=(), cap=True, r1=None, lean=None):
    """a round timber from p0 to p1 cut in bands at the heights in cuts; mf(z) gives a band's material; the top is capped"""
    p0 = V(p0); p1 = V(p1); s, u, d = frame_of(p1 - p0); r1 = r if r1 is None else r1
    ts = [0.0] + sorted(t for t in ((z - p0.z) / (p1.z - p0.z) if abs(p1.z - p0.z) > 1e-6 else -1 for z in cuts) if 0.0 < t < 1.0) + [1.0]
    rings = []
    for t in ts:
        c = p0 + (p1 - p0) * t; rr = r + (r1 - r) * t
        rings.append([A.v(c + (s * math.cos(a) + u * math.sin(a)) * rr) for a in [2 * math.pi * k / seg for k in range(seg)]])
    for i in range(len(rings) - 1):
        zc = p0.z + (p1.z - p0.z) * (ts[i] + ts[i + 1]) / 2; m = mf(zc)
        for k in range(seg):
            j = (k + 1) % seg; A.f([rings[i][k], rings[i][j], rings[i + 1][j], rings[i + 1][k]], m, (rings[i][k].co + rings[i][j].co) / 2 - (p0 + (p1 - p0) * ts[i]))
    if cap: A.f(list(rings[-1]), mf(p1.z), d)

def arock(A, c, r, sc, rr, mf, sub=1):
    """a boulder: a lumpy icosphere at c, radius r, scaled by sc; mf(centre, normal) gives a face's material"""
    t = bmesh.new(); bmesh.ops.create_icosphere(t, subdivisions=sub, radius=1.0)
    c = V(c); vm = {}
    for v in t.verts:
        k = 1 + rr.uniform(-0.22, 0.22); p = v.co * k
        vm[v] = A.v(c + V((p.x * r * sc[0], p.y * r * sc[1], p.z * r * sc[2])))
    for fc in t.faces:
        vs = [vm[v] for v in fc.verts]; cen = sum((v.co for v in vs), V()) / len(vs); nrm = (cen - c).normalized()
        A.f(vs, mf(cen, nrm), nrm)
    t.free()

def atorus(A, c, ax, R, r, mf, seg=16, rseg=6, a0=0.0, a1=2 * math.pi):
    """a ring round the axis ax (mf(angle) for each segment's material), or an arc of it from a0 to a1"""
    c = V(c); s, u, d = frame_of(ax); full = abs(a1 - a0 - 2 * math.pi) < 1e-6; n = seg if full else seg + 1
    rings = []
    for i in range(n):
        a = a0 + (a1 - a0) * i / seg; e = s * math.cos(a) + u * math.sin(a); cc = c + e * R
        rings.append((a, cc, [A.v(cc + (e * math.cos(b) + d * math.sin(b)) * r) for b in [2 * math.pi * k / rseg for k in range(rseg)]]))
    for i in range(seg if full else seg):
        a, cc, ra = rings[i]; _, _, rb = rings[(i + 1) % n]
        for k in range(rseg):
            j = (k + 1) % rseg; A.f([ra[k], ra[j], rb[j], rb[k]], mf(a), (ra[k].co + rb[j].co) / 2 - cc)
