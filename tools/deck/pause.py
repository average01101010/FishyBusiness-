"""The small things the crew handle on a break and at the gutting table, built in Blender (Jonas 23.10.2026: «Husk at vi må ha animasjoner
for alle handlinger og aktiviteter», with his pictures of a deck broom with red bristles, a flask and an enamel mug, a lunch in white
paper with brown cheese, a honing steel, a snus can and a fish being gutted head first). The game puts them in the hands (view3d.js
drawWorker, the break poses chosen by core/13-work.js idleAssign).

    termos   a steel vacuum flask, 0.31 m with its cup lid, from the middle of its foot
    krus     an enamel mug, white with a blue rim and coffee in it, from the middle of its foot; the handle on +x
    bryne    a honing steel: black handle with a guard, the steel rod along -z (the tool's head), from the middle of the grip
    snus     a round snus can, 68 mm across: a black base and a plain dark lid, no maker's name or mark, from its middle, the lid up
    lighter  a plastic lighter with its steel top, upright, from its middle
    sig      a cigarette along z: the paper towards -z (the lit end, a glowing tip) and the filter towards +z, from its middle
    tlf      a smartphone lying flat, the screen up (+y), the long side along z, from its middle
    tlf2     an old mobile with buttons, as the oldest hands carry, lying flat the same way
    kikk     binoculars: two barrels along z, the eyepieces towards +z (the face), from the middle of the hinge
    mat      a packed lunch: white sandwich paper opened out with two slices of bread on it, brown cheese on one, from the middle of the paper
    kosthode the head of a deck scrubbing broom: a wooden block with stiff red bristles under it, the handle's socket on top (the origin),
             the block across x
    spole    a hose reel on its stand, standing on the deck: a red drum turning on x with the green hose wound on it, from the middle of its
             foot; the hose leaves the drum at +z low down
    hode     a cod's head as it comes off behind the gill cover, about 0.15 m, the snout along -z, from the middle of the cut

What I chose myself: every measure (from the pictures and from ordinary kit, no maker's drawing), the colours, and the plain snus can and
lighter with nothing on them. No brand names on anything.

    pip install bpy==4.5.4
    python3 tools/deck/pause.py         -> src/data/deck-pause.b64, renders tools/deck/out/pause_*.png
    python3 tools/deck/pause.py fast    -> without the renders

Frames. Here in Blender: x to the right, y forward, z up. The game's: x right, y up, z aft; to_game(p) = (x, z, -y). The points below are
written in the game's frame and taken to Blender by gb()."""
import os, sys, math, base64
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))
sys.path.insert(0, os.path.join(ROOT, 'tools', 'boats'))
import bpy, bmesh
from mathutils import Vector
from bpyutil import *

OUT = os.path.join(HERE, 'out')
def to_game(p): return (p[0], p[2], -p[1])
def to_game_n(n): return (n[0], n[2], -n[1])
def gb(x, y, z): return V((x, -z, y))            # a point in the game's frame, in Blender's

C = {}
def colours():
    C['steel'] = mat('steel', (0.70, 0.72, 0.74), 0.7, metal=0.7)
    C['steel2'] = mat('steel2', (0.50, 0.52, 0.54), 0.5, metal=0.6)
    C['lid'] = mat('lid', (0.18, 0.19, 0.20), 0.35)
    C['enamel'] = mat('enamel', (0.93, 0.93, 0.90), 0.8)
    C['rim'] = mat('rim', (0.10, 0.22, 0.48), 0.7)
    C['coffee'] = mat('coffee', (0.16, 0.08, 0.04), 0.9)
    C['black'] = mat('black', (0.05, 0.05, 0.055), 0.35)
    C['rubber'] = mat('rubber', (0.08, 0.08, 0.08), 0.15)
    C['snuslid'] = mat('snuslid', (0.12, 0.16, 0.24), 0.45)
    C['red'] = mat('red', (0.70, 0.08, 0.06), 0.6)
    C['paper'] = mat('paper', (0.92, 0.91, 0.88), 0.1)
    C['filter'] = mat('filter', (0.80, 0.52, 0.22), 0.2)
    C['ember'] = mat('ember', (1.00, 0.35, 0.05), 0.3)
    C['ash'] = mat('ash', (0.45, 0.44, 0.42), 0.1)
    C['screen'] = mat('screen', (0.10, 0.16, 0.24), 0.9)
    C['grey'] = mat('grey', (0.42, 0.43, 0.45), 0.35)
    C['key'] = mat('key', (0.75, 0.76, 0.78), 0.3)
    C['crumb'] = mat('crumb', (0.86, 0.74, 0.52), 0.1)
    C['crust'] = mat('crust', (0.48, 0.30, 0.14), 0.15)
    C['brunost'] = mat('brunost', (0.62, 0.36, 0.14), 0.35)
    C['wood'] = mat('wood', (0.58, 0.42, 0.24), 0.25)
    C['bristle'] = mat('bristle', (0.78, 0.10, 0.07), 0.2)
    C['hose'] = mat('hose', (0.12, 0.45, 0.20), 0.35)
    C['codback'] = mat('codback', (0.42, 0.38, 0.26), 0.45)
    C['codbelly'] = mat('codbelly', (0.88, 0.86, 0.80), 0.45)
    C['gill'] = mat('gill', (0.62, 0.12, 0.10), 0.5)
    C['eye'] = mat('eye', (0.05, 0.05, 0.05), 0.9)

one = lambda m: (lambda z: m)

def ring_cyl(A, y0, y1, r0, r1, m, seg=20, cap0=True, cap1=True, x=0.0, z=0.0):
    """a turned piece upright on y from y0 to y1, radius r0 at the foot and r1 at the top"""
    acyl(A, gb(x, y0, z), gb(x, y1, z), r0, one(m), seg=seg, cap=cap1, r1=r1)
    if cap0:
        vs = [A.v(gb(x + math.cos(a) * r0, y0, z + math.sin(a) * r0)) for a in [2 * math.pi * k / seg for k in range(seg)]]
        A.f(vs, m, gb(0, -1, 0))

def termos():
    A = Acc('termos')
    ring_cyl(A, 0.0, 0.012, 0.042, 0.045, C['steel2'])
    ring_cyl(A, 0.012, 0.235, 0.045, 0.045, C['steel'], cap0=False)
    ring_cyl(A, 0.235, 0.255, 0.045, 0.030, C['steel'], cap0=False)
    ring_cyl(A, 0.255, 0.262, 0.030, 0.030, C['black'], cap0=False)
    ring_cyl(A, 0.262, 0.312, 0.047, 0.049, C['lid'], cap0=True)   # the cup that is the lid
    return A.done(30)

def krus():
    A = Acc('krus'); seg = 20
    ring_cyl(A, 0.0, 0.004, 0.036, 0.038, C['enamel'])
    ring_cyl(A, 0.004, 0.085, 0.040, 0.041, C['enamel'], cap0=False, cap1=False)
    ring_cyl(A, 0.085, 0.092, 0.041, 0.041, C['rim'], cap0=False, cap1=False)
    # the coffee a little below the rim, and the inside wall down to it
    acyl(A, gb(0, 0.092, 0), gb(0, 0.072, 0), 0.0375, one(C['enamel']), seg=seg, cap=False)
    vs = [A.v(gb(math.cos(a) * 0.0375, 0.072, math.sin(a) * 0.0375)) for a in [2 * math.pi * k / seg for k in range(seg)]]; A.f(vs, C['coffee'], gb(0, 1, 0))
    # the rim's top
    for k in range(seg):
        a0 = 2 * math.pi * k / seg; a1 = 2 * math.pi * (k + 1) / seg
        A.f([A.v(gb(math.cos(a0) * 0.041, 0.092, math.sin(a0) * 0.041)), A.v(gb(math.cos(a1) * 0.041, 0.092, math.sin(a1) * 0.041)),
             A.v(gb(math.cos(a1) * 0.0375, 0.092, math.sin(a1) * 0.0375)), A.v(gb(math.cos(a0) * 0.0375, 0.092, math.sin(a0) * 0.0375))], C['rim'], gb(0, 1, 0))
    atorus(A, gb(0.052, 0.048, 0), gb(0, 0, 1), 0.024, 0.0055, one(C['enamel']), seg=12, rseg=6, a0=-math.pi / 2 - 0.2, a1=math.pi / 2 + 0.2)
    return A.done(30)

def bryne():
    A = Acc('bryne')
    acyl(A, gb(0, 0, 0.065), gb(0, 0, -0.05), 0.0135, one(C['black']), seg=12, r1=0.0145)
    acyl(A, gb(0, 0, -0.05), gb(0, 0, -0.058), 0.024, one(C['black']), seg=14)
    acyl(A, gb(0, 0, -0.058), gb(0, 0, -0.30), 0.0065, one(C['steel']), seg=10, r1=0.0045)
    atorus(A, gb(0, 0, 0.078), gb(1, 0, 0), 0.011, 0.0022, one(C['steel2']), seg=10, rseg=5)
    return A.done(40)

def snus():
    A = Acc('snus')
    ring_cyl(A, -0.011, 0.004, 0.0330, 0.0330, C['black'], seg=28)
    ring_cyl(A, 0.003, 0.0105, 0.0342, 0.0342, C['snuslid'], seg=28, cap1=False)
    ring_cyl(A, 0.0105, 0.011, 0.0342, 0.0325, C['snuslid'], seg=28, cap0=False)
    return A.done(40)

def lighter():
    A = Acc('lighter')
    # (abox takes Blender's own frame: x across, y depth, z up)
    abox(A, -0.0125, 0.0125, -0.006, 0.006, -0.040, 0.026, C['red'])
    abox(A, -0.0125, 0.0125, -0.0062, 0.0062, 0.026, 0.040, C['steel'])
    acyl(A, gb(-0.004, 0.032, 0), gb(0.004, 0.032, 0), 0.0045, one(C['steel2']), seg=10)
    return A.done(30)

def sig():
    A = Acc('sig')
    acyl(A, gb(0, 0, -0.040), gb(0, 0, 0.019), 0.0037, one(C['paper']), seg=10)
    acyl(A, gb(0, 0, 0.019), gb(0, 0, 0.042), 0.0038, one(C['filter']), seg=10)
    acyl(A, gb(0, 0, -0.040), gb(0, 0, -0.043), 0.0036, one(C['ash']), seg=10, cap=False)
    acyl(A, gb(0, 0, -0.043), gb(0, 0, -0.0445), 0.0034, one(C['ember']), seg=10)
    return A.done(40)

def tlf():
    A = Acc('tlf')
    obox(A, gb(0, 0, 0), gb(0.036, 0, 0) - gb(0, 0, 0), gb(0, 0.004, 0) - gb(0, 0, 0), gb(0, 0, 0.075) - gb(0, 0, 0), C['black'])
    A.poly([gb(-0.033, 0.0042, -0.069), gb(0.033, 0.0042, -0.069), gb(0.033, 0.0042, 0.069), gb(-0.033, 0.0042, 0.069)], C['screen'], gb(0, 1, 0))
    return A.done(30)

def tlf2():
    A = Acc('tlf2')
    obox(A, gb(0, 0, 0), gb(0.025, 0, 0) - gb(0, 0, 0), gb(0, 0.008, 0) - gb(0, 0, 0), gb(0, 0, 0.055) - gb(0, 0, 0), C['grey'])
    A.poly([gb(-0.018, 0.0082, -0.048), gb(0.018, 0.0082, -0.048), gb(0.018, 0.0082, -0.018), gb(-0.018, 0.0082, -0.018)], C['screen'], gb(0, 1, 0))
    for i in range(4):
        for j in range(3):
            x = -0.012 + j * 0.012; z = -0.004 + i * 0.012
            abox(A, x - 0.004, x + 0.004, -(z + 0.004), -(z - 0.004), 0.0082, 0.0098, C['key'])
    return A.done(30)

def kikk():
    A = Acc('kikk')
    for s in (-1, 1):
        x = s * 0.034
        acyl(A, gb(x, 0, -0.075), gb(x, 0, 0.035), 0.026, one(C['rubber']), seg=16)
        acyl(A, gb(x, 0, 0.035), gb(x, 0, 0.070), 0.017, one(C['black']), seg=14)
        acyl(A, gb(x, 0, -0.075), gb(x, 0, -0.078), 0.024, one(C['screen']), seg=16)
    abox(A, -0.034, 0.034, -0.035, 0.012, -0.010, 0.010, C['black'])
    acyl(A, gb(0, 0.016, -0.03), gb(0, 0.016, 0.03), 0.008, one(C['black']), seg=10)
    return A.done(35)

def mat_():
    A = Acc('mat')
    # the paper opened out flat
    abox(A, -0.13, 0.13, -0.10, 0.10, 0.002, 0.004, C['paper'])
    for (cx, cz, top) in ((-0.055, 0.0, True), (0.058, 0.004, False)):
        y0, y1 = 0.004, 0.018
        abox(A, cx - 0.048, cx + 0.048, -(cz + 0.046), -(cz - 0.046), y0, y1, C['crust'], skip=('+z',))
        A.poly([gb(cx - 0.046, y1 + 0.0005, cz - 0.044), gb(cx + 0.046, y1 + 0.0005, cz - 0.044), gb(cx + 0.046, y1 + 0.0005, cz + 0.044), gb(cx - 0.046, y1 + 0.0005, cz + 0.044)], C['crumb'], gb(0, 1, 0))
        if top:
            for k in range(3):
                o = k * 0.028 - 0.028
                abox(A, cx - 0.041, cx + 0.041, -(cz + o + 0.0145), -(cz + o - 0.0145), y1 + 0.001 + k * 0.0006, y1 + 0.0035 + k * 0.0006, C['brunost'])
    return A.done(30)

def kosthode():
    A = Acc('kosthode')
    abox(A, -0.15, 0.15, -0.035, 0.035, -0.045, 0.0, C['wood'])
    abox(A, -0.143, 0.143, -0.031, 0.031, -0.105, -0.045, C['bristle'])
    acyl(A, gb(0, 0.0, 0.0), gb(0, 0.03, -0.02), 0.019, one(C['wood']), seg=10)
    return A.done(30)

def spole():
    A = Acc('spole')
    # the stand: two side frames and a foot
    for s in (-1, 1):
        x = s * 0.11
        acyl(A, gb(x, 0.0, -0.13), gb(x, 0.30, 0.0), 0.012, one(C['steel2']), seg=8)
        acyl(A, gb(x, 0.0, 0.13), gb(x, 0.30, 0.0), 0.012, one(C['steel2']), seg=8)
    acyl(A, gb(-0.12, 0.01, -0.13), gb(0.12, 0.01, -0.13), 0.012, one(C['steel2']), seg=8)
    acyl(A, gb(-0.12, 0.01, 0.13), gb(0.12, 0.01, 0.13), 0.012, one(C['steel2']), seg=8)
    # the drum and its cheeks, and the hose wound on it
    acyl(A, gb(-0.09, 0.30, 0), gb(0.09, 0.30, 0), 0.07, one(C['red']), seg=20)
    for x in (-0.095, 0.095):
        acyl(A, gb(x - 0.006, 0.30, 0), gb(x + 0.006, 0.30, 0), 0.16, one(C['red']), seg=24)
    for k in range(7):
        x = -0.072 + k * 0.024
        atorus(A, gb(x, 0.30, 0), gb(1, 0, 0), 0.105, 0.0115, one(C["hose"]), seg=14, rseg=5)
    acyl(A, gb(0.10, 0.30, 0), gb(0.15, 0.30, 0), 0.008, one(C['steel']), seg=8)
    acyl(A, gb(0.15, 0.30, 0), gb(0.15, 0.30, -0.09), 0.006, one(C['steel']), seg=8)
    return A.done(30)

def hode():
    A = Acc('hode'); seg = 14
    # a tapering head from the cut (z = 0, wide) to the snout (z = -0.15), darker on the back, white under the jaw
    rings = []
    prof = [(0.0, 0.050, 0.060), (-0.04, 0.046, 0.054), (-0.085, 0.036, 0.043), (-0.12, 0.024, 0.030), (-0.148, 0.010, 0.014)]
    for z, rx, ry in prof:
        rings.append([A.v(gb(math.cos(a) * rx, math.sin(a) * ry, z)) for a in [2 * math.pi * k / seg for k in range(seg)]])
    for i in range(len(rings) - 1):
        for k in range(seg):
            j = (k + 1) % seg; a = 2 * math.pi * (k + 0.5) / seg
            m = C['codback'] if math.sin(a) > -0.15 else C['codbelly']
            A.f([rings[i][k], rings[i][j], rings[i + 1][j], rings[i + 1][k]], m, gb(math.cos(a), math.sin(a), 0))
    A.f(list(rings[0]), C['gill'], gb(0, 0, 1))
    A.f(list(rings[-1]), C['codbelly'], gb(0, 0, -1))
    for s in (-1, 1):
        sphere_c = gb(s * 0.040, 0.020, -0.075)
        acyl(A, sphere_c - V((0, 0, 0)), sphere_c + gb(s * 0.006, 0, 0) - gb(0, 0, 0), 0.010, one(C['eye']), seg=10)
    return A.done(40)

def main():
    os.makedirs(OUT, exist_ok=True)
    reset(); colours()
    objs = {'termos': termos(), 'krus': krus(), 'bryne': bryne(), 'snus': snus(), 'lighter': lighter(), 'sig': sig(), 'tlf': tlf(), 'tlf2': tlf2(),
            'kikk': kikk(), 'mat': mat_(), 'kosthode': kosthode(), 'spole': spole(), 'hode': hode()}
    setup_render(64, 64, samples=8)
    for nm, o in objs.items():
        for p in bpy.context.scene.objects:
            if p.type == 'MESH': p.hide_render = p is not o
        bake_ao(o, samples=16, distance=0.03 if nm in ('snus', 'lighter', 'sig', 'tlf', 'tlf2') else 0.06)
    for p in bpy.context.scene.objects:
        if p.type == 'MESH': p.hide_render = False
    parts = [(nm, mesh_arrays(o, to_game, to_game_n, ao=True), 1.0) for nm, o in objs.items()]
    def size(o):
        P = [to_game(o.matrix_world @ v.co) for v in o.data.vertices]
        return [min(p[k] for p in P) for k in range(3)], [max(p[k] for p in P) for k in range(3)]
    sz = {nm: size(o) for nm, o in objs.items()}
    r4 = lambda v: round(v, 4)
    ex = {'frame': 'kystfiske break props: metres, x right, y up, z aft (towards the one holding it); each from the point named in tools/deck/pause.py',
          'size': {nm: [r4(hi[k] - lo[k]) for k in range(3)] for nm, (lo, hi) in sz.items()}}
    glb = os.path.join(OUT, 'deck-pause.glb'); nb = write_glb(glb, parts, ex)
    open(os.path.join(ROOT, 'src', 'data', 'deck-pause.b64'), 'w').write(base64.b64encode(open(glb, 'rb').read()).decode())
    print('break props GLB %.1f KB' % (nb / 1024))
    for nm, A, _ in parts:
        lo, hi = sz[nm]
        print('  %-8s %5d tris  x %.3f..%.3f  y %.3f..%.3f  z %.3f..%.3f' % (nm, len(A['idx']) // 3, lo[0], hi[0], lo[1], hi[1], lo[2], hi[2]))
    if 'fast' in sys.argv: return
    # a contact sheet: every piece laid out on a row, from the quarter
    setup_render(1400, 520, samples=24)
    xs = 0.0
    for nm, o in objs.items():
        lo, hi = sz[nm]; w = hi[0] - lo[0]
        o.location = gb(xs - lo[0], 0, 0) if nm not in ('kosthode', 'spole') else gb(xs - lo[0], 0.105 if nm == 'kosthode' else 0, 0)
        xs += w + 0.06
    camera(gb(xs / 2, 0.9, 1.6), gb(xs / 2, 0.05, 0), lens=22); render(os.path.join(OUT, 'pause_alle.png'))
    camera(gb(xs / 2, 2.2, 0.02), gb(xs / 2, 0.0, 0), lens=22); render(os.path.join(OUT, 'pause_ovenfra.png'))

main()
