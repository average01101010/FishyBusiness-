"""The gulls round the boat, built in Blender (the user's wish 03.10.2026): an adult herring gull (gråmåke, Larus argentatus), about
0.6 m long and 1.4 m across the wings, white with a grey mantle, black wing tips with white mirrors, a yellow bill with the red spot and
pink legs tucked under the tail. The game also flies a great black-backed gull (svartbak) from the same model: zone 1 (the mantle and
the upper wing) is painted black-grey and the bird drawn 1.15 times larger.

Parts, each with its own origin so the game can beat the wings (drawWild in view3d.js):
    body    the bird without its wings, from its middle
    armR    the inner wing (the arm, shoulder to wrist), from the shoulder; armL the same mirrored
    handR   the outer wing (the hand with the primaries), from the wrist; handL the same mirrored

    pip install bpy==4.5.4
    python3 tools/wild/maake.py          -> src/data/gull.b64, renders in tools/wild/out/
    python3 tools/wild/maake.py fast     -> without the renders

Frames (the game's: x to the right, y up, z backwards, so the bird faces -z). Here in Blender: x to the right, y forward, z up;
to_game(p) = (x, z, -y)."""
import os, sys, math, base64
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))
sys.path.insert(0, os.path.join(ROOT, 'tools', 'boats'))
import bpy, bmesh
from bpyutil import *

OUT = os.path.join(HERE, 'out')
SHO = (0.045, 0.025, 0.035)      # the right shoulder (Blender frame)
WRI = (0.335, 0.055, 0.050)      # the right wrist
TIP = 0.70                       # the wing tip's x (span 1.4 m)

C = {}
def colours():
    C['white'] = mat('white', (0.93, 0.93, 0.92), 0.25)
    C['mantle'] = mat('mantle', (0.52, 0.57, 0.63), 0.25, zone=1)        # the grey of the back and the upper wing; svartbak repaints it
    C['black'] = mat('black', (0.07, 0.07, 0.08), 0.3)
    C['under'] = mat('under', (0.86, 0.87, 0.88), 0.2)
    C['dusk'] = mat('dusk', (0.30, 0.31, 0.33), 0.25)                   # the primaries' tips seen from below
    C['bill'] = mat('bill', (0.95, 0.78, 0.18), 0.5)
    C['spot'] = mat('spot', (0.85, 0.12, 0.08), 0.5)
    C['eye'] = mat('eye', (0.93, 0.85, 0.45), 0.7)
    C['pupil'] = mat('pupil', (0.03, 0.03, 0.03), 0.8)
    C['leg'] = mat('leg', (0.88, 0.62, 0.60), 0.3)

def to_game(p): return (p[0], p[2], -p[1])
def to_game_n(n): return (n[0], n[2], -n[1])
def rel(o):
    g = to_game(o)
    return lambda p: tuple(a - b for a, b in zip(to_game(p), g))
ident = lambda p: tuple(p)

# ---------- the body: rings across, stacked from the rump to the bill's base; grey on the back between the shoulders and the rump ----------
STA = [(-0.215, 0.022, 0.018, 0.004), (-0.17, 0.040, 0.034, 0.002), (-0.11, 0.058, 0.052, 0.0), (-0.04, 0.072, 0.066, 0.0), (0.03, 0.070, 0.066, 0.006),
       (0.09, 0.055, 0.058, 0.016), (0.135, 0.040, 0.045, 0.030), (0.165, 0.036, 0.042, 0.038), (0.20, 0.037, 0.043, 0.042), (0.232, 0.029, 0.034, 0.040),
       (0.252, 0.016, 0.019, 0.037)]
def ring(y, a, b, zc, seg=14):
    out = []
    for k in range(seg):
        t = 2 * math.pi * k / seg; c, s = math.cos(t), math.sin(t)
        # a flatter belly, a rounder back
        bz = b * (1.0 if s > 0 else 0.9)
        out.append((a * math.copysign(abs(c) ** 0.9, c), y, zc + bz * s))
    return out

def body():
    bm = bmesh.new(); R = [[bm.verts.new(p) for p in ring(*st)] for st in STA]; n = len(R[0])
    for i in range(len(R) - 1):
        for j in range(n):
            k = (j + 1) % n; f = bm.faces.new([R[i][j], R[i][k], R[i + 1][k], R[i + 1][j]])
            c = f.calc_center_median(); y, z = c.y, c.z; zc = STA[i][3]
            f.material_index = 1 if (-0.16 < y < 0.07 and z > zc + 0.035) else 0
    bm.faces.new(list(reversed(R[0]))); bm.faces.new(R[-1])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    o = shade(obj_from_bm('body', bm, [C['white'], C['mantle']]), 50)
    parts = [o]
    # the bill: a narrowing loft from the head with the hooked tip, and the red spot on the lower mandible
    bl = []
    for y, a, b, dz in ((0.248, 0.012, 0.014, 0.0), (0.27, 0.008, 0.011, -0.001), (0.29, 0.006, 0.010, -0.002), (0.305, 0.004, 0.008, -0.005), (0.314, 0.0015, 0.004, -0.009)):
        bl.append([(a * math.cos(2 * math.pi * k / 8), y, 0.036 + dz + b * math.sin(2 * math.pi * k / 8)) for k in range(8)])
    parts.append(loft_rings('bill', bl, C['bill'], angle=60))
    parts.append(sphere('spot', (0.0, 0.296, 0.027), 0.0045, C['spot'], scale=(1.2, 1.4, 0.8), seg=8, rings=4))
    for s in (-1, 1):
        parts.append(sphere('eye', (s * 0.026, 0.212, 0.052), 0.0055, C['eye'], seg=8, rings=4))
        parts.append(sphere('pupil', (s * 0.030, 0.214, 0.053), 0.0028, C['pupil'], seg=6, rings=3))
        # the legs tucked under the tail, the feet folded
        parts.append(cyl('leg', (s * 0.018, -0.10, -0.035), (s * 0.022, -0.19, -0.032), 0.006, C['leg'], seg=6))
        bm = bmesh.new(); vs = [bm.verts.new(p) for p in ((s * 0.016, -0.19, -0.031), (s * 0.030, -0.19, -0.031), (s * 0.026, -0.235, -0.028), (s * 0.019, -0.235, -0.028))]
        bm.faces.new(vs); parts.append(solidify(obj_from_bm('foot', bm, [C['leg']]), 0.004))
    # the tail: a thin fan, white
    bm = bmesh.new(); top = []; bot = []
    for (x, y) in ((-0.024, -0.19), (-0.058, -0.30), (-0.03, -0.325), (0.0, -0.33), (0.03, -0.325), (0.058, -0.30), (0.024, -0.19)):
        top.append(bm.verts.new((x, y, 0.010 - (y + 0.19) * 0.05))); bot.append(bm.verts.new((x, y, 0.0 - (y + 0.19) * 0.05)))
    bm.faces.new(top); bm.faces.new(list(reversed(bot)))
    for i in range(len(top)):
        j = (i + 1) % len(top); bm.faces.new([top[i], bot[i], bot[j], top[j]])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    parts.append(shade(obj_from_bm('tail', bm, [C['white']]), 30))
    for p in parts: apply_all(p)
    return join(parts, 'body')

# ---------- the wings: a cambered plate with thickness, top and bottom joined at the edges, capped at the joints ----------
def wing_piece(name, x0, x1, le, te, zc, thick, top_mat, bot_mat, nu, nv):
    """the right wing between x0 and x1: le(u), te(u) the leading and trailing edges' y, zc(u) the chord line's height, thick(u) the
    thickness at the front; top_mat(u, v), bot_mat(u, v) the material index (u along the span, v from the leading edge back)"""
    bm = bmesh.new(); T = []; B = []
    for i in range(nu + 1):
        u = i / nu; x = x0 + (x1 - x0) * u; rt = []; rb = []
        for j in range(nv + 1):
            v = j / nv; y = le(u) + (te(u) - le(u)) * v
            camber = 0.035 * (le(u) - te(u)) * math.sin(math.pi * v) * (1 - 0.5 * u)
            th = thick(u) * (1 - v) ** 1.6 * math.sin(math.pi * min(1, v * 3 + 0.12) / 2)
            rt.append(bm.verts.new((x, y, zc(u) + camber + th * 0.6))); rb.append(bm.verts.new((x, y, zc(u) + camber - th * 0.4)))
        T.append(rt); B.append(rb)
    for i in range(nu):
        for j in range(nv):
            u = (i + 0.5) / nu; v = (j + 0.5) / nv
            f = bm.faces.new([T[i][j], T[i][j + 1], T[i + 1][j + 1], T[i + 1][j]]); f.material_index = top_mat(u, v)
            f = bm.faces.new([B[i][j], B[i + 1][j], B[i + 1][j + 1], B[i][j + 1]]); f.material_index = bot_mat(u, v)
        # the leading and trailing edges
        f = bm.faces.new([T[i][0], T[i + 1][0], B[i + 1][0], B[i][0]]); f.material_index = top_mat((i + 0.5) / nu, 0.0)
        f = bm.faces.new([T[i][nv], B[i][nv], B[i + 1][nv], T[i + 1][nv]]); f.material_index = top_mat((i + 0.5) / nu, 1.0)
    for i in (0, nu):   # caps at both ends
        try:
            vs = T[i] + list(reversed(B[i])); f = bm.faces.new(vs if i == nu else list(reversed(vs))); f.material_index = top_mat(i / nu, 0.5)
        except ValueError: pass
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    mats = [C['mantle'], C['white'], C['black'], C['under'], C['dusk']]
    return shade(obj_from_bm(name, bm, mats), 40)

MANTLE, WHITE, BLACK, UNDER, DUSK = range(5)
def arm():
    # chord 0.22 m at the body, 0.19 at the wrist; a white trailing edge; a little dihedral
    le = lambda u: SHO[1] + 0.03 + (WRI[1] + 0.02 - SHO[1] - 0.03) * u
    te = lambda u: -0.19 + 0.06 * u
    zc = lambda u: SHO[2] + (WRI[2] - SHO[2]) * u
    th = lambda u: 0.030 - 0.012 * u
    top = lambda u, v: WHITE if v > 0.86 else MANTLE
    bot = lambda u, v: UNDER
    return wing_piece('armR', SHO[0], WRI[0], le, te, zc, th, top, bot, 6, 6)

def hand():
    # the primaries: swept back to a pointed tip; black from 55 % of the way out with two white mirrors, white tips
    le = lambda u: WRI[1] + 0.02 - 0.19 * u ** 1.3
    te = lambda u: -0.13 - 0.03 * u + 0.0 * u
    def te_(u): return min(te(u), le(u) - 0.012 - 0.17 * (1 - u) ** 1.1)
    zc = lambda u: WRI[2] - 0.03 * u * u
    th = lambda u: 0.018 * (1 - u) + 0.003
    def top(u, v):
        if u > 0.965: return WHITE
        if 0.80 < u < 0.90 and 0.25 < v < 0.75: return WHITE
        if u > 0.45 + 0.3 * v: return BLACK
        return WHITE if v > 0.88 and u < 0.45 else MANTLE
    def bot(u, v):
        if u > 0.965: return WHITE
        if 0.80 < u < 0.90 and 0.25 < v < 0.75: return WHITE
        return DUSK if u > 0.5 + 0.3 * v else UNDER
    return wing_piece('handR', WRI[0], TIP, le, te_, zc, th, top, bot, 10, 6)

def mirror_x(o, name):
    m = o.copy(); m.data = o.data.copy(); m.name = name; link(m)
    m.scale = (-1, 1, 1); apply_all(m)
    bm = bmesh.new(); bm.from_mesh(m.data); bmesh.ops.reverse_faces(bm, faces=bm.faces); bm.to_mesh(m.data); bm.free(); m.data.update()
    return m

def main():
    os.makedirs(OUT, exist_ok=True)
    reset(); colours()
    B = body(); A = arm(); H = hand(); AL = mirror_x(A, 'armL'); HL = mirror_x(H, 'handL')
    SL = (-SHO[0], SHO[1], SHO[2]); WL = (-WRI[0], WRI[1], WRI[2])
    parts = [('body', mesh_arrays(B, to_game, to_game_n, ao=False), 1.0),
             ('armR', mesh_arrays(A, rel(SHO), to_game_n, ao=False), 1.0), ('handR', mesh_arrays(H, rel(WRI), to_game_n, ao=False), 1.0),
             ('armL', mesh_arrays(AL, rel(SL), to_game_n, ao=False), 1.0), ('handL', mesh_arrays(HL, rel(WL), to_game_n, ao=False), 1.0)]
    ex = {'frame': 'kystfiske gull: x right, y up, z back (faces -z); body from its middle, arm from the shoulder, hand from the wrist',
          'shoulder': list(to_game(SHO)), 'wrist': list(to_game(WRI)), 'span': 2 * TIP, 'zones': {'1': 'mantle and upper wing'}}
    glb = os.path.join(OUT, 'gull.glb'); n = write_glb(glb, parts, ex)
    open(os.path.join(ROOT, 'src', 'data', 'gull.b64'), 'w').write(base64.b64encode(open(glb, 'rb').read()).decode())
    print('gull GLB %.1f KB, %s' % (n / 1024, ', '.join('%s %d' % (p[0], len(p[1]['idx']) // 3) for p in parts)))
    if 'fast' in sys.argv: return
    # renders: from above and behind, from below, and a svartbak beside it
    setup_render(1200, 800, samples=24)
    bpy.context.scene.world.node_tree.nodes.get('Background').inputs['Color'].default_value = (0.62, 0.72, 0.84, 1)
    for nm, loc, look, lens in (('3q', (1.3, -1.4, 1.0), (0.05, -0.02, 0.02), 50), ('top', (0.0, -0.05, 2.0), (0.0, -0.04, 0.0), 45), ('below', (0.6, 0.9, -1.3), (0.05, 0.0, 0.02), 50),
                                ('head', (0.35, 0.55, 0.15), (0.0, 0.22, 0.04), 60)):
        camera(loc, look, lens=lens); render(os.path.join(OUT, 'gull_%s.png' % nm))

if __name__ == '__main__':
    main()
