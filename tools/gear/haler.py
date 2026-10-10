"""The haulers at the rail, built in Blender (the user's wish 03.10.2026, from the drawings and photos he sent; the drawings stay out of
the repo, only their measures are here):

    garnhaler   Lorentzen-type net hauler on a post at the rail: 1 562 mm out over the side from the post and 745 mm inboard, 1 950 mm
                high. A V-shaped sheave of black rubber with ribs (the net is pinched in the V), driven by a hydraulic motor on the
                fork, a stripper roller that lifts the net out of the V, and a V-shaped tray down inboard. Blue hoses along the arm.
    linehaler   line hauler on a post: overall 1 330 x 500 x 440 mm; a red V-groove sheave of 350 mm, a stripper wheel of 160 mm,
                two vertical guide rollers of 60 mm 225 mm apart and a lead roller of 104 mm at the inlet, a tray out of it.

What I chose myself: the colours of the steel (galvanised grey; the photos' frame colour is not in the measures), the post's height
(the rail of a small boat, so the hauler works at a man's chest), the motor's size, and the ribs on the net sheave.

Parts, each with its own origin so the game can turn it (view3d.js):
    frame       the post, the arm, the fork, the motor, the hoses and the tray, from the foot of the post (on deck)
    sheave      the hauling sheave, from its axle (turns about x in the game's frame)
    stripper    the stripper roller or wheel, from its axle (turns the other way)
and in the extras the axles, the radius and the path of the net or line (from the sea over the sheave to the tray's end).

    pip install bpy==4.5.4
    python3 tools/gear/haler.py          -> src/data/haul-garn.b64, src/data/haul-line.b64, renders in tools/gear/out/
    python3 tools/gear/haler.py fast     -> without the renders

Frames. Here in Blender: x out over the side (to the sea), y forward along the boat, z up, the foot of the post at the origin. The
game's: x out over the side, y up, z aft; to_game(p) = (x, z, -y)."""
import os, sys, math, base64
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))
sys.path.insert(0, os.path.join(ROOT, 'tools', 'boats'))
import bpy, bmesh
from bpyutil import *

OUT = os.path.join(HERE, 'out')
C = {}
def colours():
    C['steel'] = mat('steel', (0.62, 0.64, 0.66), 0.45, metal=0.6)
    C['dark'] = mat('dark', (0.16, 0.17, 0.18), 0.35)
    C['rubber'] = mat('rubber', (0.05, 0.05, 0.055), 0.15)
    C['red'] = mat('red', (0.72, 0.08, 0.06), 0.55)
    C['blue'] = mat('blue', (0.08, 0.22, 0.62), 0.5)
    C['stain'] = mat('stain', (0.78, 0.80, 0.82), 0.7, metal=0.8)
    C['yellow'] = mat('yellow', (0.95, 0.72, 0.10), 0.5)

def to_game(p): return (p[0], p[2], -p[1])
def to_game_n(n): return (n[0], n[2], -n[1])
def rel(o):
    g = to_game(o)
    return lambda p: tuple(a - b for a, b in zip(to_game(p), g))

def lathe(name, prof, c, m, seg=40, angle=50):
    """a body of revolution about the y axis through c: prof is [(radius, y)] from one end to the other"""
    rings = [[(c[0] + r * math.cos(2 * math.pi * k / seg), c[1] + y, c[2] + r * math.sin(2 * math.pi * k / seg)) for k in range(seg)] for r, y in prof]
    return loft_rings(name, rings, m, True, True, angle)

def plate_y(name, pts, y0, y1, m):
    """a plate in the x-z plane (points (x, z)) from y0 to y1"""
    bm = bmesh.new(); a = [bm.verts.new((x, y0, z)) for x, z in pts]; b = [bm.verts.new((x, y1, z)) for x, z in pts]
    bm.faces.new(a); bm.faces.new(list(reversed(b)))
    for i in range(len(pts)):
        j = (i + 1) % len(pts); bm.faces.new([a[i], a[j], b[j], b[i]])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return shade(obj_from_bm(name, bm, [m]), 30)

# ---------- the net hauler ----------
G_AX = (1.212, 0.0, 1.60)      # the sheave's axle: its rim reaches 1 562 mm out and 1 950 mm up
G_R, G_W = 0.35, 0.36           # its radius and width
G_ST = (0.93, 0.0, 1.83)        # the stripper roller's axle, at the sheave's top on the inboard side

def garn_frame():
    p = []
    # the foot and the post (a 140 mm pipe) with a slewing head
    p.append(box('foot', -0.17, 0.17, -0.17, 0.17, 0.0, 0.02, C['steel']))
    p.append(cyl('post', (0, 0, 0.02), (0, 0, 1.05), 0.07, C['steel'], seg=20))
    p.append(cyl('head', (0, 0, 1.05), (0, 0, 1.16), 0.10, C['dark'], seg=20))
    # the arm: a square tube rising out to the fork, and a stay under it
    p.append(tube('arm', [(-0.10, 0, 1.20), (0.55, 0, 1.30), (1.05, 0, 1.44)], 0.055, C['steel'], seg=4))
    p.append(tube('stay', [(0.0, 0, 0.80), (0.55, 0, 1.24)], 0.03, C['steel'], seg=8))
    # the fork: two plates either side of the sheave, from the arm's end to the axle, and the axle's bosses
    for s in (-1, 1):
        y0 = s * (G_W / 2 + 0.03); y1 = s * (G_W / 2 + 0.05)
        p.append(plate_y('fork', [(1.00, 1.38), (1.10, 1.34), (G_AX[0] + 0.07, G_AX[2] - 0.05), (G_AX[0] + 0.05, G_AX[2] + 0.06), (G_AX[0] - 0.06, G_AX[2] + 0.06), (0.98, 1.50)], min(y0, y1), max(y0, y1), C['steel']))
        p.append(cyl('boss', (G_AX[0], s * (G_W / 2 + 0.05), G_AX[2]), (G_AX[0], s * (G_W / 2 + 0.07), G_AX[2]), 0.06, C['dark'], seg=16))
    # the hydraulic motor on the fore side of the axle, and the hoses from it along the arm and down the post
    p.append(cyl('motor', (G_AX[0], G_W / 2 + 0.07, G_AX[2]), (G_AX[0], G_W / 2 + 0.24, G_AX[2]), 0.085, C['dark'], seg=20))
    p.append(cyl('motorcap', (G_AX[0], G_W / 2 + 0.24, G_AX[2]), (G_AX[0], G_W / 2 + 0.27, G_AX[2]), 0.06, C['dark'], seg=16))
    for k, dz in enumerate((0.03, -0.03)):
        y = G_W / 2 + 0.16 + k * 0.035
        p.append(tube('hose', [(G_AX[0] - 0.05, y, G_AX[2] + dz), (G_AX[0] - 0.25, y - 0.02, G_AX[2] - 0.08 + dz), (0.60, 0.09, 1.34 + dz),
                               (0.12, 0.08, 1.20 + dz), (0.07, 0.08, 1.0), (0.08, 0.07 + k * 0.03, 0.35), (0.25, 0.07 + k * 0.03, 0.03)], 0.014, C['blue'], seg=8))
    # the stripper's brackets
    for s in (-1, 1):
        p.append(plate_y('sbr', [(G_ST[0] - 0.05, G_ST[2] - 0.05), (G_ST[0] + 0.05, G_ST[2] - 0.05), (G_ST[0] + 0.14, G_AX[2] - 0.02), (G_ST[0] + 0.08, G_AX[2] - 0.08)],
                         s * (G_W / 2 + 0.03), s * (G_W / 2 + 0.03) + s * 0.015, C['steel']))
    # the tray: a V of stainless sheet from under the stripper down inboard to 745 mm behind the post
    ends = [(0.92, 1.70), (0.40, 1.40), (-0.745, 1.02)]
    rings = []
    for x, z in ends:
        rings.append([(x, -0.26, z + 0.17), (x, -0.05, z + 0.01), (x, 0.0, z), (x, 0.05, z + 0.01), (x, 0.26, z + 0.17)])
    bm = bmesh.new(); V2 = [[bm.verts.new(q) for q in r] for r in rings]
    for i in range(len(V2) - 1):
        for j in range(len(V2[0]) - 1): bm.faces.new([V2[i][j], V2[i][j + 1], V2[i + 1][j + 1], V2[i + 1][j]])
    tray = solidify(shade(obj_from_bm('tray', bm, [C['stain']]), 40), 0.006); p.append(tray)
    for (x, z) in ends[1:]:
        p.append(tube('trayleg', [(x, 0, z - 0.01), (min(x, 0.0) * 0.2, 0, max(0.9, z - 0.25))], 0.018, C['steel'], seg=6))
    return join(p, 'frame')

def garn_sheave():
    # the V: two rubber cones meeting 170 mm from the axle, flanges at the rim, ribs on the cones for the grip
    prof = [(0.07, -G_W / 2 - 0.01), (G_R, -G_W / 2), (G_R, -G_W / 2 + 0.02), (0.17, -0.004), (0.17, 0.004), (G_R, G_W / 2 - 0.02), (G_R, G_W / 2), (0.07, G_W / 2 + 0.01)]
    p = [lathe('sheave', prof, G_AX, C['rubber'], seg=48)]
    p.append(cyl('hub', (G_AX[0], -G_W / 2 - 0.05, G_AX[2]), (G_AX[0], G_W / 2 + 0.05, G_AX[2]), 0.05, C['steel'], seg=16))
    for k in range(14):
        a = 2 * math.pi * k / 14; ca, sa = math.cos(a), math.sin(a)
        for s in (-1, 1):
            r0, r1 = 0.18, G_R - 0.01; y0 = s * (0.004 + (r0 - 0.17) / (G_R - 0.17) * (G_W / 2 - 0.024)); y1 = s * (0.004 + (r1 - 0.17) / (G_R - 0.17) * (G_W / 2 - 0.024))
            p.append(cyl('rib', (G_AX[0] + r0 * ca, y0 - s * 0.012, G_AX[2] + r0 * sa), (G_AX[0] + r1 * ca, y1 - s * 0.012, G_AX[2] + r1 * sa), 0.011, C['rubber'], seg=6))
    return join(p, 'sheave')

def garn_stripper():
    p = [lathe('stripper', [(0.02, -G_W / 2 - 0.02), (0.06, -G_W / 2 + 0.01), (0.06, G_W / 2 - 0.01), (0.02, G_W / 2 + 0.02)], G_ST, C['rubber'], seg=20)]
    p.append(cyl('saxle', (G_ST[0], -G_W / 2 - 0.035, G_ST[2]), (G_ST[0], G_W / 2 + 0.035, G_ST[2]), 0.015, C['steel'], seg=8))
    return join(p, 'stripper')

# the net's path (Blender frame): from the water out at the side, up onto the sheave's outboard side, over the top into the V, round
# to the stripper and down the tray; the game draws the net along it and the sea's end follows the water
def garn_path():
    pts = [(G_AX[0] + G_R + 0.25, 0.0, -0.6)]
    for k in range(0, 9):   # on the sheave from its outboard side (0 deg) over the top to the stripper (about 125 deg)
        a = math.radians(k * 125 / 8); r = 0.26
        pts.append((G_AX[0] + r * math.cos(a), 0.0, G_AX[2] + r * math.sin(a)))
    pts += [(G_ST[0] - 0.04, 0.0, G_ST[2] - 0.08), (0.40, 0.0, 1.43), (-0.745, 0.0, 1.05)]
    return pts

# ---------- the line hauler ----------
L_POST = 0.86                    # the post's top: the hauler works at a man's chest over a small boat's rail
L_AX = (0.0, 0.0, L_POST + 0.265)     # the sheave's axle (its top 440 mm over the bottom of the motor)
L_R = 0.175
L_ST = (-0.205, 0.0, L_AX[2] + 0.095)    # the stripper wheel's axle, pressing into the groove on the inboard side
def line_frame():
    p = []
    p.append(box('foot', -0.12, 0.12, -0.12, 0.12, 0.0, 0.02, C['steel']))
    p.append(cyl('post', (0, 0, 0.02), (0, 0, L_POST), 0.05, C['steel'], seg=16))
    # the motor under the sheave, on the aft side, and its flange
    p.append(cyl('motor', (0.0, -0.06, L_AX[2]), (0.0, -0.24, L_AX[2]), 0.075, C['dark'], seg=20))
    p.append(box('valve', -0.05, 0.05, -0.30, -0.24, L_AX[2] - 0.05, L_AX[2] + 0.05, C['dark']))
    p.append(box('base', -0.16, 0.16, -0.10, 0.10, L_POST, L_POST + 0.04, C['steel']))
    p.append(plate_y('cheek', [(-0.13, L_POST + 0.04), (0.13, L_POST + 0.04), (0.09, L_AX[2] + 0.02), (-0.09, L_AX[2] + 0.02)], -0.07, -0.05, C['steel']))
    # the inlet arm out over the side: the lead roller (104 mm) at its end, the two vertical guides (60 mm, 225 mm apart) before it
    p.append(tube('inarm', [(0.12, -0.14, L_POST + 0.05), (0.45, -0.15, L_POST + 0.10), (0.575, -0.15, L_POST + 0.12)], 0.022, C['steel'], seg=6))
    p.append(tube('inarm2', [(0.12, 0.14, L_POST + 0.05), (0.45, 0.15, L_POST + 0.10), (0.575, 0.15, L_POST + 0.12)], 0.022, C['steel'], seg=6))
    p.append(cyl('lead', (0.59, -0.17, L_POST + 0.15), (0.59, 0.20, L_POST + 0.15), 0.052, C['dark'], seg=16))
    for y in (-0.1125, 0.1125):
        p.append(cyl('guide', (0.47, y, L_POST + 0.12), (0.47, y, L_POST + 0.30), 0.03, C['dark'], seg=12))
    p.append(tube('gbar', [(0.47, -0.12, L_POST + 0.31), (0.47, 0.12, L_POST + 0.31)], 0.012, C['steel'], seg=6))
    # the stripper's arm, the hoses and the tray (a U trough down inboard)
    p.append(tube('sarm', [(-0.06, -0.06, L_AX[2] - 0.02), (L_ST[0], -0.06, L_ST[2])], 0.02, C['steel'], seg=6))
    for k in range(2):
        p.append(tube('hose', [(0.0, -0.22, L_AX[2] + 0.02 - 0.04 * k), (0.03 + 0.03 * k, -0.25, L_AX[2] - 0.1), (0.05, -0.08 + 0.03 * k, L_POST - 0.1), (0.06, -0.06 + 0.03 * k, 0.3), (0.2, -0.06 + 0.03 * k, 0.03)], 0.011, C['blue'], seg=8))
    rings = []
    for x, z in ((-0.26, L_AX[2] + 0.02), (-0.688, L_POST + 0.08)):
        rings.append([(x, -0.07, z + 0.06), (x, -0.05, z), (x, 0.05, z), (x, 0.07, z + 0.06)])
    bm = bmesh.new(); V2 = [[bm.verts.new(q) for q in r] for r in rings]
    for j in range(3): bm.faces.new([V2[0][j], V2[0][j + 1], V2[1][j + 1], V2[1][j]])
    p.append(solidify(shade(obj_from_bm('tray', bm, [C['stain']]), 40), 0.004))
    p.append(tube('tleg', [(-0.60, 0, L_POST + 0.09), (-0.10, 0, L_POST + 0.02)], 0.014, C['steel'], seg=6))
    return join(p, 'frame')

def line_sheave():
    prof = [(0.03, -0.06), (L_R, -0.055), (L_R, -0.035), (0.11, -0.004), (0.11, 0.004), (L_R, 0.035), (L_R, 0.055), (0.03, 0.06)]
    p = [lathe('sheave', prof, L_AX, C['red'], seg=40)]
    for k in range(6):   # the spokes' lightening holes as dark discs, so the turning shows
        a = 2 * math.pi * k / 6; q = (L_AX[0] + 0.07 * math.cos(a), 0.0, L_AX[2] + 0.07 * math.sin(a))
        for s in (-1, 1): p.append(cyl('hole', (q[0], s * 0.050, q[2]), (q[0], s * 0.058, q[2]), 0.022, C['dark'], seg=10))
    p.append(cyl('hub', (L_AX[0], -0.07, L_AX[2]), (L_AX[0], 0.07, L_AX[2]), 0.03, C['steel'], seg=12))
    return join(p, 'sheave')

def line_stripper():
    prof = [(0.02, -0.02), (0.08, -0.012), (0.08, 0.012), (0.02, 0.02)]
    p = [lathe('stripper', prof, L_ST, C['yellow'], seg=24)]
    p.append(cyl('saxle', (L_ST[0], -0.06, L_ST[2]), (L_ST[0], 0.03, L_ST[2]), 0.012, C['steel'], seg=8))
    return join(p, 'stripper')

def line_path():
    pts = [(1.2, 0.0, -0.4), (0.59, 0.0, L_POST + 0.205), (0.47, 0.0, L_POST + 0.20)]
    for k in range(0, 9):   # into the groove on the outboard side, over the top to the stripper
        a = math.radians(20 + k * 105 / 8); r = 0.125
        pts.append((L_AX[0] + r * math.cos(a), 0.0, L_AX[2] + r * math.sin(a)))
    pts += [(-0.30, 0.0, L_AX[2] + 0.03), (-0.688, 0.0, L_POST + 0.10)]
    return pts

def export(kind, F, Sh, St, ax, st, r, path, size):
    parts = [('frame', mesh_arrays(F, to_game, to_game_n, ao=False), 1.0),
             ('sheave', mesh_arrays(Sh, rel(ax), to_game_n, ao=False), 1.0),
             ('stripper', mesh_arrays(St, rel(st), to_game_n, ao=False), 1.0)]
    ex = {'frame': 'kystfiske %s: x out over the side, y up, z aft; frame from the foot of the post, sheave and stripper from their axles (turning about x)' % kind,
          'axle': list(to_game(ax)), 'stripper': list(to_game(st)), 'r': r, 'path': [list(to_game(q)) for q in path], 'size': size}
    glb = os.path.join(OUT, 'haul-%s.glb' % kind); n = write_glb(glb, parts, ex)
    open(os.path.join(ROOT, 'src', 'data', 'haul-%s.b64' % kind), 'w').write(base64.b64encode(open(glb, 'rb').read()).decode())
    print('%s GLB %.1f KB, %s' % (kind, n / 1024, ', '.join('%s %d' % (p[0], len(p[1]['idx']) // 3) for p in parts)))

def main():
    os.makedirs(OUT, exist_ok=True)
    reset(); colours()
    F = garn_frame(); Sh = garn_sheave(); St = garn_stripper()
    lo = [min((F.matrix_world @ v.co)[k] for v in F.data.vertices) for k in range(3)]; hi = [max((F.matrix_world @ v.co)[k] for v in F.data.vertices) for k in range(3)]
    hs = max((Sh.matrix_world @ v.co)[2] for v in Sh.data.vertices); xs = max((Sh.matrix_world @ v.co)[0] for v in Sh.data.vertices)
    print('garnhaler: out %.3f m, in %.3f m, high %.3f m (drawing 1.562, 0.745, 1.950)' % (xs, -lo[0], hs))
    export('garn', F, Sh, St, G_AX, G_ST, G_R, garn_path(), [round(xs + 0.745, 3), round(hs, 3)])
    if 'fast' not in sys.argv:
        setup_render(1200, 800, samples=24); bpy.context.scene.world.node_tree.nodes.get('Background').inputs['Color'].default_value = (0.62, 0.72, 0.84, 1)
        for nm, loc, look, lens in (('3q', (2.4, -2.6, 2.2), (0.45, 0, 1.2), 35), ('side', (0.4, -4.2, 1.1), (0.4, 0, 1.0), 35), ('sheave', (1.9, -1.3, 2.3), (1.15, 0, 1.6), 45)):
            camera(loc, look, lens=lens); render(os.path.join(OUT, 'garn_%s.png' % nm))
    reset(); MATS.clear(); colours()
    F = line_frame(); Sh = line_sheave(); St = line_stripper()
    xs = [(o.matrix_world @ v.co) for o in (F, Sh, St) for v in o.data.vertices]
    top = [v for v in xs if v.z > L_POST - 0.005]   # the hauler over the post's top (the post and the hoses down it are not in the drawing's box)
    L = max(v.x for v in top) - min(v.x for v in top); W = max(v.y for v in top) - min(v.y for v in top); H = max(v.z for v in top) - L_POST
    print('linehaler: %.3f x %.3f x %.3f m over the post (drawing 1.330 x 0.500 x 0.440)' % (L, W, H))
    export('line', F, Sh, St, L_AX, L_ST, L_R, line_path(), [round(L, 3), round(W, 3), round(H, 3)])
    if 'fast' not in sys.argv:
        setup_render(1200, 800, samples=24); bpy.context.scene.world.node_tree.nodes.get('Background').inputs['Color'].default_value = (0.62, 0.72, 0.84, 1)
        for nm, loc, look, lens in (('3q', (1.5, -1.6, 1.7), (0.0, 0, 1.05), 40), ('side', (0.0, -2.6, 1.1), (0.0, 0, 1.05), 40), ('top', (0.0, -0.2, 2.8), (0.0, 0, 1.0), 40)):
            camera(loc, look, lens=lens); render(os.path.join(OUT, 'line_%s.png' % nm))

if __name__ == '__main__':
    main()
