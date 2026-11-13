"""The check of the new people (FB5, steg 122): reads the file as the game will (kropp_glb.Reader), and
  - compares the parts' names with src/data/worker.b64 (every old name must be there),
  - counts the triangles of a dressed figure for every look of the catalogue (core/09i-look.js), old against new,
  - poses three dressed figures in the standing pose and the five far poses and counts the triangles of different parts that cross,
  - renders the check pictures (tools/harbour/out/k2_*.png).

    python3.11 tools/harbour/kropp_bilder.py [fil] [tall]      (fil: out/folk2.glb unless given; tall: the numbers only, no pictures)"""
import os, sys, math, json, struct, base64, itertools
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))
sys.path.insert(0, HERE); sys.path.insert(0, os.path.join(ROOT, 'tools', 'boats'))
import numpy as np
import kropp as K, kropp_glb as GLB

OUT = os.path.join(HERE, 'out')
SKIN = (0.86, 0.64, 0.50); HAIRC = (0.26, 0.17, 0.10)
LOOKS = {   # three outfits (the crew's oilskins with the vest, the skipper, a woman in a parka), painted as the game paints them
    'mannskap': dict(sex='m', top='oilskin', hat='beanie', hair='hair_short_h', beard='b_short', shoe='boot', vest=True, c={1: (0.95, 0.42, 0.07), 3: (0.95, 0.42, 0.07), 6: (0.10, 0.14, 0.28), 7: (0.07, 0.07, 0.08)}),
    'skipper': dict(sex='m', top='sweater', hat='skippercap', hair='hair_mid_h', beard='b_full', shoe='shoe', vest=False, c={1: (0.10, 0.14, 0.28), 3: (0.40, 0.41, 0.43), 6: (0.07, 0.07, 0.08), 7: (0.35, 0.24, 0.14)}),
    'kvinne': dict(sex='f', top='parkaF', hat='hat_bobble', hair='hair_pony_h', beard=None, shoe='sneaker', vest=False, c={1: (0.72, 0.13, 0.12), 3: (0.10, 0.14, 0.28), 6: (0.88, 0.85, 0.74), 7: (0.20, 0.36, 0.64)}),
}


def from_game(p): p = np.asarray(p, float); return np.stack([p[..., 0], -p[..., 2], p[..., 1]], -1)


def look_parts(R, L):
    f = L['sex'] == 'f'; F = 'F' if f else ''
    n = [L['top'], 'head' + F, 'uarm' + F, 'farm' + F, 'thigh' + F, 'shin' + F, L['shoe'] + F] + (['hRF', 'hLF'] if f else ['hR_relax', 'hL_relax'])
    n += [x for x in (L['hat'], L['hair'], L['beard']) if x]
    if L.get('vest'): n.append(R.ex['vest'][L['top']])
    return n


def posed(R, name, sex, pose, grip=None):
    """a part's triangles' vertices in a pose (Blender's frame): (pos (N, 3), tri (M, 3), part)"""
    P = R.part(name); J = K.joints(sex); v = from_game(P['pos'])
    if P['bone'] and sex == 'f': v = v + np.array(J[P['bone']]) - np.array(K.joints('m')[P['bone']])          # a part on a bone, shared by both: from her joint
    Lc, root = K.POSES(J)[pose]
    if grip: Lc = dict(Lc); Lc.update(K.grip_turns(sex, grip, J))
    M, Jp = K.pose_mats(J, Lc, root)
    M = M.copy(); M[:, 2, 3] += J['foot_R'][2] - Jp['foot_R'][2]            # the feet stay on the ground
    return K.skin(v, P['joints'], P['weights'], M), P['tri'], P


def tri_cross(T, U, eps=1e-4):
    """for pairs of triangles (n, 3, 3) each: whether they cross (an edge of one goes through the inside of the other); touching at
    an edge or a corner is not a crossing"""
    def edges_through(A, B):
        n = np.cross(B[:, 1] - B[:, 0], B[:, 2] - B[:, 0]); nn = np.einsum('ij,ij->i', n, n); hit = np.zeros(len(A), bool)
        for i in range(3):
            a = A[:, i]; b = A[:, (i + 1) % 3]; da = np.einsum('ij,ij->i', n, a - B[:, 0]); db = np.einsum('ij,ij->i', n, b - B[:, 0])
            ok = (da * db < 0) & (nn > 1e-18); t = np.where(ok, da / np.where(ok, da - db, 1), 0.5); p = a + (b - a) * t[:, None]
            ins = ok & (t > eps) & (t < 1 - eps)
            for k in range(3):
                e = B[:, (k + 1) % 3] - B[:, k]; ins &= np.einsum('ij,ij->i', n, np.cross(e, p - B[:, k])) > eps * nn
            hit |= ins
        return hit
    return edges_through(T, U) | edges_through(U, T)


KLASSER = ['synlig', 'samme stoff', 'sitter på']


def crossings(a, b):
    """the pairs of triangles of two posed parts that cross, leaving out the pairs that share a vertex (a seam the two parts have in
    common), in three classes: [seen (two things of different paint), the same cloth (a sleeve against its jacket, a trouser leg
    against the seat: the same paint zone, so the line where they meet does not show), sits on (hair and beard in the skin)]"""
    import bpy; from mathutils.bvhtree import BVHTree
    (va, ta, za), (vb, tb, zb) = a, b
    ov = BVHTree.FromPolygons([tuple(p) for p in va], [tuple(int(i) for i in t) for t in ta]).overlap(BVHTree.FromPolygons([tuple(p) for p in vb], [tuple(int(i) for i in t) for t in tb]))
    if not ov: return np.zeros(3, int)
    ov = np.array(ov); T = va[ta[ov[:, 0]]]; U = vb[tb[ov[:, 1]]]
    d = np.linalg.norm(T[:, :, None, :] - U[:, None, :, :], axis=3).min((1, 2)); keep = d > 2e-4
    hit = np.zeros(len(ov), bool); hit[keep] = tri_cross(T[keep], U[keep]); z1 = za[ov[:, 0]][hit]; z2 = zb[ov[:, 1]][hit]
    same = (z1 == z2) & np.isin(z1, (1, 3)); on = ((z1 == 4) & (z2 == 5)) | ((z1 == 5) & (z2 == 4)) | ((z1 == 5) & (z2 == 5)) | ((z1 == 4) & (z2 == 4))
    return np.array([int((~same & ~on).sum()), int(same.sum()), int(on.sum())])


def check_names(R):
    raw = base64.b64decode(open(os.path.join(ROOT, 'src', 'data', 'worker.b64')).read()); jl = struct.unpack_from('<I', raw, 12)[0]; Jo = json.loads(raw[20:20 + jl])
    old = {n['name']: Jo['accessors'][Jo['meshes'][n['mesh']]['primitives'][0]['indices']]['count'] // 3 for n in Jo['nodes']}
    miss = [n for n in old if n not in R.names]
    print('NAVN: %d deler i worker.b64, %d i den nye fila, mangler: %s' % (len(old), len(R.names), miss or 'ingen'))
    return old


def check_tris(R, old):
    """every look of the catalogue (core/09i-look.js: body, jacket, hat, hair, beard, shoes), with and without the vest"""
    new = {n: v['tris'] for n, v in R.ex['parts'].items()}
    tops = [('torso', 'jacketF'), ('sweater', 'sweaterF'), ('oilskin', 'oilskinF'), ('parka', 'parkaF'), ('fleece', 'fleeceF')]
    hats = [None, 'skippercap', 'beanie', 'hat_bobble', 'hat_bucket', 'hat_flat', 'hat_ball', 'hardhat']; hairs = [None] + [n for n in old if n.startswith('hair_')]
    beards = [None] + [n for n in old if n.startswith('b_')]; shoes = ['boot', 'shoe', 'sneaker']; worst = None; rows = []
    for f in (False, True):
        for tm, tf in tops:
            for hat, hair, beard, shoe, vest in itertools.product(hats, hairs, beards if not f else [None], shoes, (False, True)):
                top = tf if f else tm; F = 'F' if f else ''
                o = old[top] + old['head'] + 2 * (old['uarm'] + old['farm'] + old['thigh'] + old['shin'] + old[shoe]) + old['hR_relax'] + old['hL_relax']
                n = new[top] + new['head' + F] + new['uarm' + F] + new['farm' + F] + new['thigh' + F] + new['shin' + F] + new[shoe + F] + (new['hRF'] + new['hLF'] if f else new['hR_relax'] + new['hL_relax'])
                for x in (hat, hair, beard):
                    if x: o += old[x]; n += new[x]
                if vest: v = R.ex['vest'][top]; o += old[v]; n += new[v]
                rows.append((n - o, o, n, top, hat, hair, beard, shoe, vest))
    rows.sort(key=lambda r: -r[0]); d = np.array([r[0] for r in rows]); o = np.array([r[1] for r in rows]); n = np.array([r[2] for r in rows])
    print('TREKANTER, påkledd figur nært, alle %d utseender i katalogen: i dag %d–%d (median %d), ny %d–%d (median %d)' % (len(rows), o.min(), o.max(), np.median(o), n.min(), n.max(), np.median(n)))
    print('  størst økning: %+d (%s); flest over i dag: %d av %d utseender' % (rows[0][0], rows[0][3:], int((d > 0).sum()), len(rows)))
    return int((d > 0).sum())


def check_stretch(R):
    """the weights' own check: an edge of a part that a pose pulls out to more than twice its length in the rest pose is a vertex
    going with the wrong bone (a spike, a web under an arm). Per outfit and pose: how many such edges, and the worst one."""
    tot = 0
    for ln, L in LOOKS.items():
        names = look_parts(R, L); rest = {}
        for n in names: v, t, _ = posed(R, n, L['sex'], 'hvile'); rest[n] = v
        for pose in K.CHECK_POSES:
            bad = {}; worst = (1.0, '')
            for n in names:
                v, t, _ = posed(R, n, L['sex'], pose); e = np.concatenate([t[:, [0, 1]], t[:, [1, 2]], t[:, [2, 0]]])
                l0 = np.linalg.norm(rest[n][e[:, 0]] - rest[n][e[:, 1]], axis=1); l1 = np.linalg.norm(v[e[:, 0]] - v[e[:, 1]], axis=1); r = l1 / np.maximum(l0, 1e-6); r = r[l0 > 0.004]
                k = int((r > 2.0).sum())
                if k: bad[n] = k
                if len(r) and r.max() > worst[0]: worst = (float(r.max()), n)
            tot += sum(bad.values())
            print('STREKK %-9s %-16s kanter over 2x: %4d  verst %.1fx (%s)  %s' % (ln, pose, sum(bad.values()), worst[0], worst[1], ', '.join('%s %d' % kv for kv in sorted(bad.items(), key=lambda q: -q[1])[:6])))
    # the grips: the gloves and the bare hands with the fingers bent (an edge at a knuckle's outside may grow, to 2.5x; more is a vertex with the wrong finger)
    for sex, names in (('m', ['hR_relax', 'hL_relax', 'handbare']), ('f', ['hRF', 'hLF', 'handbareF'])):
        for g in K.GRIPS:
            k = 0; worst = 1.0
            for n in names:
                v0, t, _ = posed(R, n, sex, 'hvile'); v, t, _ = posed(R, n, sex, 'hvile', g); e = np.concatenate([t[:, [0, 1]], t[:, [1, 2]], t[:, [2, 0]]])
                l0 = np.linalg.norm(v0[e[:, 0]] - v0[e[:, 1]], axis=1); r = np.linalg.norm(v[e[:, 0]] - v[e[:, 1]], axis=1) / np.maximum(l0, 1e-6); r = r[l0 > 0.002]; k += int((r > 2.5).sum()); worst = max(worst, float(r.max()))
            tot += k; print('STREKK grep %s %-6s kanter over 2,5x: %3d  verst %.1fx' % (sex, g, k, worst))
    print('STREKK i alt: %d kanter over 2x' % tot); return tot


def check_cross(R, poses=None):
    poses = poses or K.CHECK_POSES; tot = np.zeros(3, int); table = {}
    for ln, L in LOOKS.items():
        names = look_parts(R, L)
        for pose in poses:
            geo = {}
            for n in names: v, t, P = posed(R, n, L['sex'], pose); geo[n] = (v, t, P['pnt'][:, 0][t[:, 0]])
            cnt = {}; s3 = np.zeros(3, int)
            for a, b in itertools.combinations(names, 2):
                c = crossings(geo[a], geo[b]); s3 += c
                if c[0]: cnt[(a, b)] = int(c[0])
            table[(ln, pose)] = s3; tot += s3
            print('KRYSS %-9s %-16s synlig %4d  samme stoff %4d  sitter på %4d   synlig: %s' % (ln, pose, s3[0], s3[1], s3[2], ', '.join('%s×%s %d' % (a, b, c) for (a, b), c in sorted(cnt.items(), key=lambda x: -x[1])[:8])))
    print('KRYSS i alt: synlig %d, samme stoff %d, sitter på %d' % tuple(tot))
    return table, tot


# ---------------- the pictures ----------------
def blender_setup():
    global bpy, bmesh, BU
    import bpy, bmesh
    import bpyutil as BU
    BU.reset(); m = bpy.data.materials.new('vc'); m.use_nodes = True; nt = m.node_tree; b = nt.nodes.get('Principled BSDF')
    at = nt.nodes.new('ShaderNodeAttribute'); at.attribute_name = 'C'; ga = nt.nodes.new('ShaderNodeGamma'); ga.inputs['Gamma'].default_value = 2.2
    nt.links.new(at.outputs['Color'], ga.inputs['Color']); nt.links.new(ga.outputs['Color'], b.inputs['Base Color']); b.inputs['Roughness'].default_value = 0.65
    return m


def put(R, mat_, name, sex, pose, x, colours, y=0.0, turn=0.0, plain=None, grip=None):
    v, t, P = posed(R, name, sex, pose, grip); me = bpy.data.meshes.new(name); me.from_pydata([tuple(p) for p in v], [], [tuple(int(i) for i in f) for f in t]); me.update()
    lay = me.color_attributes.new('C', 'FLOAT_COLOR', 'POINT'); col = P['col'][:, :3].astype(float) / 255; zone = P['pnt'][:, 0]; shade = P['pnt'][:, 1].astype(float) / 255
    for z, c in list(colours.items()) + [(4, SKIN), (5, HAIRC)]:
        m = zone == z; col[m] = np.array(c)[None, :] * shade[m][:, None]
    if plain: col = np.array(plain)[None, :] * shade[:, None]
    for i, d in enumerate(lay.data): d.color = (col[i][0], col[i][1], col[i][2], 1.0)
    # the normals as the file has them
    me.materials.append(mat_); o = BU.link(bpy.data.objects.new(name, me)); me.shade_smooth()
    if not P['bone']:                    # (the parts on the head are drawn with smooth normals: Blender fell over setting the file's own on them)
        try: me.normals_split_custom_set_from_vertices([tuple(q) for q in from_game_n(P, sex, pose)])
        except Exception: pass
    o.location = (x, y, 0); o.rotation_euler = (0, 0, turn); return o


def from_game_n(P, sex, pose):
    n = from_game(P['nor']); J = K.joints(sex); Lc, root = K.POSES(J)[pose]; M, _ = K.pose_mats(J, Lc, root); out = np.zeros_like(n)
    for k in range(4): out += P['weights'][:, k:k + 1] * np.einsum('nij,nj->ni', M[P['joints'][:, k]][:, :3, :3], n)
    return out / np.maximum(np.linalg.norm(out, axis=1, keepdims=True), 1e-9)


def clear():
    for o in [x for x in bpy.data.objects if x.type == 'MESH' and x.name != 'ground']: bpy.data.objects.remove(o)


def pictures(R):
    m = blender_setup(); os.makedirs(OUT, exist_ok=True)
    bm = bmesh.new(); bm.faces.new([bm.verts.new(p) for p in ((-9, -9, 0), (9, -9, 0), (9, 9, 0), (-9, 9, 0))]); BU.obj_from_bm('ground', bm, [BU.mat('ground', (0.5, 0.5, 0.52), 0.1)])
    def fig(ln, pose, x, turn=0.0, y=0.0):
        L = LOOKS[ln]
        for n in look_parts(R, L): put(R, m, n, L['sex'], pose, x, L['c'], y, turn)
    only = os.environ.get('KROPP_ARK')          # (KROPP_ARK=haar,hatter: only the sheets whose name holds one of these)
    def shot(name, loc, look, lens=50, w=2000, h=1000):
        if only and not any(q in name for q in only.split(',')): return
        BU.setup_render(w, h, samples=40); BU.camera(loc, look, lens=lens); BU.render(os.path.join(OUT, name))
    # 1. the bodies: the man and the woman, from the front, the side and three quarters, and from behind
    for i, (sex, nm) in enumerate((('m', 'body'), ('f', 'bodyF'))):
        for j, tn in enumerate((0.0, -math.pi / 2, -math.pi / 4, math.pi)): put(R, m, nm, sex, 'hvile', -((i * 4 + j) - 3.5) * 0.85, {}, turn=tn)
    shot('k2_kropp.png', (0.0, 8.6, 1.05), (0.0, 0, 0.90), 50, 2400, 820); clear()
    # 2. the faces
    for i, (sex, nm) in enumerate((('m', 'head'), ('f', 'headF'))):
        for j, tn in enumerate((0.0, -math.pi / 4, -math.pi / 2)): put(R, m, nm, sex, 'hvile', -((i * 3 + j) - 2.5) * 0.36, {}, turn=tn)
    shot('k2_ansikt.png', (0.0, 2.7, 1.66), (0.0, 0, 1.63), 60, 2400, 700); clear()
    # 3. the hands: the bare ones of the skin, and the gloves in their six grips on the wrists
    items = [('handbare', 'm', None), ('handbareF', 'f', None)] + [('hR_' + g, 'm', g) for g in K.GRIPS]
    for i, (n, sx, g) in enumerate(items):
        o = put(R, m, n, sx, 'hvile', 0.0, {}, grip=g or 'relax')
        # only the right hand, moved so the hands stand in a row
        bm_ = bmesh.new(); bm_.from_mesh(o.data); bmesh.ops.delete(bm_, geom=[v for v in bm_.verts if v.co.x < 0], context='VERTS'); bm_.to_mesh(o.data); bm_.free(); o.location = (-0.38 + (i - 3.5) * -0.17, 0, 0)
    shot('k2_hender.png', (0.0, 1.9, 0.86), (0.0, 0, 0.84), 70, 2400, 560)
    shot('k2_hender_side.png', (-0.9, 1.6, 1.0), (0.0, 0, 0.84), 70, 2400, 620); clear()
    # 4. the three outfits from the front, the side and three quarters
    for i, ln in enumerate(LOOKS):
        for j, tn in enumerate((0.0, -math.pi / 2, -math.pi / 4)): fig(ln, 'stå', -((i * 3 + j) - 4) * 0.85, tn)
    shot('k2_antrekk.png', (0.0, 9.4, 1.05), (0.0, 0, 0.90), 50, 2600, 820)
    shot('k2_antrekk_naer.png', (0.0, 4.2, 1.45), (0.0, 0, 1.38), 50, 2600, 820); clear()
    # 5. the poses
    for ln in LOOKS:
        for i, pose in enumerate(K.CHECK_POSES): fig(ln, pose, -(i - 2.5) * 1.05, -math.pi / 5)
        shot('k2_stillinger_%s.png' % ln, (0.0, 9.0, 1.3), (0.0, 0, 0.85), 50, 2600, 820); clear()
    # 6. every jacket on both bodies, with every hat, and the vests
    tops = ['torso', 'sweater', 'oilskin', 'parka', 'fleece']; hats = ['hardhat', 'hat_bucket', 'hat_bobble', 'hat_ball', 'hat_flat']; hairs = ['hair_short_h', 'hair_side_h', 'hair_mid_h', 'hair_curl_h', 'hair_ring']
    for r, f in enumerate((False, True)):
        for i, tp in enumerate(tops):
            L = dict(sex='f' if f else 'm', top=(('jacketF' if tp == 'torso' else tp + 'F') if f else tp), hat=hats[i], hair=hairs[i] if not f else ['hair_long_h', 'hair_pony_h', 'hair_braid_h', 'hair_bun_h', 'hair_mid_h'][i],
                     beard=None if f else [None, 'b_stache', 'b_goat', 'b_mutton', 'b_full'][i], shoe=['boot', 'shoe', 'sneaker', 'boot', 'shoe'][i], vest=i % 2 == 0,
                     c={1: [(0.20, 0.36, 0.64), (0.88, 0.85, 0.74), (0.93, 0.74, 0.12), (0.09, 0.30, 0.20), (0.40, 0.10, 0.14)][i], 3: [(0.10, 0.14, 0.28), (0.40, 0.41, 0.43), (0.93, 0.74, 0.12), (0.07, 0.07, 0.08), (0.35, 0.24, 0.14)][i], 6: [(0.98, 0.80, 0.06), (0.93, 0.74, 0.12), (0.72, 0.13, 0.12), (0.10, 0.14, 0.28), (0.55, 0.48, 0.30)][i], 7: (0.09, 0.09, 0.10)})
            for n in look_parts(R, L): put(R, m, n, L['sex'], 'stå', -((r * 5 + i) - 4.5) * 0.8, L['c'], turn=-0.35 if (r * 5 + i) % 2 else 0.25)
    shot('k2_jakker.png', (0.0, 9.6, 1.1), (0.0, 0, 0.90), 50, 2600, 760)
    shot('k2_jakker_bak.png', (0.0, -9.6, 1.1), (0.0, 0, 0.90), 50, 2600, 760); clear()
    # 6b. the shoes close: the boot, the ankle boot and the deck shoe, from the side and from above in front
    for i, (sh_, col) in enumerate((('boot', (0.07, 0.07, 0.08)), ('shoe', (0.35, 0.24, 0.14)), ('sneaker', (0.20, 0.36, 0.64)))):
        for n in (sh_, 'shin'): put(R, m, n, 'm', 'hvile', -(i - 1) * 0.55, {7: col, 3: (0.40, 0.41, 0.43)}, turn=-0.9)
    shot('k2_sko.png', (0.0, 1.9, 0.42), (0.0, 0, 0.14), 60, 2400, 760); clear()
    # 7. the heads with every hair, beard and hat
    hs = [n for n in R.names if n.startswith('hair_') and not n.endswith('_h')] + [n for n in R.names if n.startswith('b_')]
    for i, n in enumerate(hs):
        r, c = divmod(i, 7)
        for q in ('head', n): o = put(R, m, q, 'm', 'hvile', -(c - 3) * 0.36, {}, turn=-0.45); o.location.z = -r * 0.36
    shot('k2_haar.png', (0.0, 3.6, 1.66 - 0.18), (0.0, 0, 1.63 - 0.18), 60, 2400, 760); clear()
    hts = ['hardhat', 'beanie', 'skippercap', 'hat_bobble', 'hat_flat', 'hat_ball', 'hat_bucket']
    for r, (sex, hd, hair) in enumerate((('m', 'head', 'hair_short_h'), ('f', 'headF', 'hair_long_h'))):
        for c, n in enumerate(hts):
            for q in (hd, n, hair): o = put(R, m, q, sex, 'hvile', -(c - 3) * 0.36, {6: (0.72, 0.15, 0.12)}, turn=-0.5); o.location.z = -r * 0.36
    shot('k2_hatter.png', (0.0, 3.6, 1.66 - 0.18), (0.0, 0, 1.63 - 0.18), 60, 2400, 760); clear()


if __name__ == '__main__':
    args = [a for a in sys.argv[1:] if a != 'tall']; path = args[0] if args else os.path.join(OUT, 'folk2.glb')
    R = GLB.Reader(path); print('FIL: %s, %.2f MB (worker.b64: %.2f MB)' % (os.path.relpath(path, ROOT), R.size / 1e6, len(base64.b64decode(open(os.path.join(ROOT, 'src', 'data', 'worker.b64')).read())) / 1e6))
    old = check_names(R); check_tris(R, old); check_stretch(R); check_cross(R)
    if 'tall' not in sys.argv: pictures(R)
