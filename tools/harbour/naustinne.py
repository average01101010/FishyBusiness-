"""Inside Father's naust, with the trophy wall (Jonas 09.10.2026: «Kjør på med naustet»): a boat-house of tarred boards under a gabled roof,
seen from the floor in first person like the pub. The trophy wall on the back wall holds the biggest fish landed of each species (core/09b-records.js);
the game hangs the fish on the hooks, the plaques under them carry the brass. The naust's upgrades are parts the game shows or hides:
    roofold / roofnew   the leaking roof (boards with gaps, sky showing through) and the tight one (new boards, tar paper)    (tak)
    ovn                 the wood stove with its flue, a kettle and a stack of logs; its fire is the flickering share of the light  (ovn)
    benk / benkold      Father's workbench put right with the tools on the pegboard, or the old broken trestle                    (benk)
    vegg                the oak frame on the back wall with the hooks and the brass plaques; without it the nails stay bare      (vegg)
    room                the shell, the floor, the nail board on the back wall, the clutter; glass the windows

The light is baked into the vertices with Cycles (the dusk through the windows, a lamp over the wall, a lantern, one over the bench); a
second bake holds what the stove's fire alone gives. Two passes: the new parts together (the room, new roof, stove, bench, wall), and the
old parts with the new ones hidden.

    python3 tools/harbour/naustinne.py          -> src/data/naustinne.b64, renders in tools/harbour/out/
    python3 tools/harbour/naustinne.py fast     -> without the renders
    python3 tools/harbour/naustinne.py look     -> only the renders (no bake, no export)

Frame here: x to the right, y into the room towards the trophy wall, z up from the floor; the eye at EYE looks along +y. In the game:
x right, y up, z = -y (the eye looks along -z)."""
import os, sys, math, random
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))
sys.path.insert(0, os.path.join(ROOT, 'tools', 'boats')); sys.path.insert(0, HERE)
import bpy, bmesh, mathutils
from bpyutil import *
import pub as PB

OUT = os.path.join(HERE, 'out')
X0, X1, Y0, Y1 = -3.0, 3.0, 0.0, 6.4
EA, RG = 2.6, 4.2                      # the eaves and the ridge
EYE = (0.0, 1.3, 1.55)
# the trophy wall: ten hooks in two rows of five; a fish hangs with its middle at the hook, its plaque below
SLOT_X = [-1.96, -0.98, 0.0, 0.98, 1.96]; SLOT_Z = [2.0, 1.0]; PLAQ = 0.36
SLOTS = [(x, Y1, z) for z in SLOT_Z for x in SLOT_X]
WALL = (-2.55, 2.55, 0.42, 2.7)        # the oak frame: x0, x1, z0, z1
STOVE = (2.45, 3.9)                    # its middle x, y
BENCH = (-2.6, 2.1, 4.5)               # x of the front edge, y0, y1
LAMP_W = (0.0, 5.55, 3.05)             # the lamp over the wall
LANT = (0.0, 2.9, 2.3)
DOORX = (-1.1, 1.1); DOORH = 2.3
WIN_R = [(1.2, 2.4)]; WIN_L = [(2.4, 3.6)]; WZ = (1.1, 2.1)
C = {}
rr = random.Random(11)
roof_h = lambda x: EA + (RG - EA) * (1 - min(1.0, abs(x) / 3.05))


def colours():
    C['floor'] = [mat('nfloor%d' % i, (0.30 * k, 0.22 * k, 0.15 * k), 0.15) for i, k in enumerate((0.8, 0.9, 1.0, 1.1))]
    C['gap'] = mat('ngap', (0.05, 0.04, 0.03), 0.1)
    C['tar'] = [mat('ntar%d' % i, (0.12 * k, 0.085 * k, 0.06 * k), 0.2) for i, k in enumerate((0.8, 0.95, 1.1, 1.25))]
    C['wallin'] = [mat('nwallin%d' % i, (0.24 * k, 0.19 * k, 0.14 * k), 0.15) for i, k in enumerate((0.8, 0.95, 1.1))]
    C['beam'] = mat('nbeam', (0.20, 0.13, 0.08), 0.2)
    C['roofold'] = [mat('nroofold%d' % i, (0.17 * k, 0.12 * k, 0.09 * k), 0.1) for i, k in enumerate((0.7, 0.9, 1.1))]
    C['roofnew'] = [mat('nroofnew%d' % i, (0.46 * k, 0.33 * k, 0.19 * k), 0.25) for i, k in enumerate((0.9, 1.0, 1.1))]
    C['tarpaper'] = mat('ntarpaper', (0.06, 0.06, 0.065), 0.1)
    C['sky'] = mat('dusk', (0.14, 0.20, 0.34), 0.0, emit=1.0)
    C['oak'] = [mat('noak%d' % i, (0.34 * k, 0.21 * k, 0.10 * k), 0.4) for i, k in enumerate((0.9, 1.0, 1.1))]
    C['oakdark'] = mat('noakdark', (0.19, 0.11, 0.05), 0.4)
    C['brass'] = mat('nbrass', (0.80, 0.60, 0.25), 0.85, metal=0.8)
    C['iron'] = mat('niron', (0.10, 0.10, 0.11), 0.4, metal=0.5)
    C['rust'] = mat('nrust', (0.30, 0.13, 0.07), 0.15)
    C['steel'] = mat('nsteel', (0.58, 0.60, 0.62), 0.7, metal=0.7)
    C['nailb'] = [mat('nnailb%d' % i, (0.26 * k, 0.17 * k, 0.11 * k), 0.15) for i, k in enumerate((0.8, 1.0, 1.2))]
    C['stovem'] = mat('nstove', (0.07, 0.07, 0.075), 0.35, metal=0.4)
    C['soot'] = mat('nsoot', (0.03, 0.028, 0.025), 0.05)
    C['log'] = [mat('nlog%d' % i, (0.27 * k, 0.18 * k, 0.11 * k), 0.1) for i, k in enumerate((0.8, 1.0, 1.2))]
    C['logend'] = mat('nlogend', (0.55, 0.42, 0.26), 0.1)
    C['ember'] = mat('nember', (1.0, 0.36, 0.08), 0.1, zone=4, emit=6.0)
    C['flame'] = mat('nflame', (1.0, 0.62, 0.20), 0.1, zone=4, emit=14.0)
    C['flame2'] = mat('nflame_core', (1.0, 0.85, 0.45), 0.1, zone=4, emit=22.0)
    C['bulb'] = mat('nbulb', (1.0, 0.82, 0.55), 0.1, emit=25.0)
    C['kettle'] = mat('nkettle', (0.35, 0.37, 0.38), 0.6, metal=0.5)
    C['frame'] = mat('nwindow_frame', (0.30, 0.26, 0.20), 0.3)
    C['glass'] = mat('npub_glass', (0.55, 0.62, 0.66), 0.95)
    C['rope'] = mat('nrope', (0.50, 0.40, 0.26), 0.05)
    C['net'] = mat('nnet', (0.22, 0.30, 0.20), 0.05)
    C['buoyr'] = mat('nbuoy_red', (0.72, 0.12, 0.08), 0.5)
    C['buoyw'] = mat('nbuoy_white', (0.88, 0.88, 0.84), 0.5)
    C['buoyo'] = mat('nbuoy_orange', (0.85, 0.40, 0.10), 0.5)
    C['float'] = [mat('nglass_float%d' % i, c, 0.95) for i, c in enumerate(((0.15, 0.45, 0.30), (0.20, 0.38, 0.48)))]
    C['crate'] = mat('ncrate', (0.40, 0.30, 0.18), 0.1)
    C['pegb'] = mat('npegboard', (0.40, 0.30, 0.20), 0.1)
    C['tool'] = mat('ntool', (0.45, 0.46, 0.48), 0.6, metal=0.5)
    C['handle'] = mat('nhandle', (0.45, 0.28, 0.12), 0.3)
    C['jar'] = mat('njar', (0.55, 0.65, 0.55), 0.9)
    C['paper'] = mat('npaper', (0.90, 0.86, 0.72), 0.05)
    C['hook'] = mat('nhook', (0.12, 0.12, 0.13), 0.5, metal=0.6)
    C['nail'] = mat('nnail', (0.20, 0.20, 0.21), 0.4, metal=0.5)
    C['bucket'] = mat('nbucket', (0.25, 0.30, 0.35), 0.3)
    C['lbuoy'] = mat('nlbuoy', (0.80, 0.30, 0.12), 0.4)


# ---------- the shell ----------
def vstrip(A, a, b, y, zlo, ha, hb, m, out, step=0.4):
    """a vertical strip of a gable-end wall in the plane y: from x=a to b, from zlo up to the heights ha (at a) and hb (at b)"""
    n = max(1, int(round(max(ha, hb) - zlo) / step)) if max(ha, hb) > zlo else 0
    if not n: return
    for j in range(n):
        s0, s1 = j / n, (j + 1) / n
        P = [V((a, y, zlo + (ha - zlo) * s0)), V((b, y, zlo + (hb - zlo) * s0)), V((b, y, zlo + (hb - zlo) * s1)), V((a, y, zlo + (ha - zlo) * s1))]
        A.poly(P, m, out)

def gable_wall(A, y, inward, opening=None, step=0.2):
    n = int(round((X1 - X0) / step))
    for i in range(n):
        a = X0 + i * step; b = a + step; m = rr.choice(C['wallin'])
        zlo = 0.0
        if opening and opening[0] <= (a + b) / 2 <= opening[1]: zlo = opening[2]
        vstrip(A, a + 0.003, b - 0.003, y, zlo, roof_h(a), roof_h(b), m, inward)
    # the outside is not seen; a thin slab behind keeps the light out
def side_wall(A, x, inward, opens):
    L = Y1 - Y0; step = 0.2; n = int(round(L / step)); nv = PB.seg_n(EA, 0.4)
    def mf(i, j):
        y = Y0 + (i + 0.5) * step; z = (j + 0.5) * EA / nv
        if any(a <= y <= b and WZ[0] <= z <= WZ[1] for a, b in opens): return None
        return C['wallin'][(i * 7 + 3) % 3]
    PB.panel(A, (x, Y0, 0), (0, L, 0), (0, 0, EA), n, nv, mf, inward)
def floor(A):
    w = 0.2
    for k in range(int((Y1 - Y0) / w)):
        y0 = Y0 + k * w; cuts = [X0]; xx = X0 + rr.uniform(0.4, 2.6)
        while xx < X1 - 0.4: cuts.append(xx); xx += rr.uniform(1.8, 3.4)
        cuts.append(X1)
        for a, b in zip(cuts, cuts[1:]):
            PB.plank(A, (a + 0.003, y0 + 0.004, 0), (b - a - 0.006, 0, 0), (0, w - 0.008, 0), rr.choice(C['floor']), (0, 0, 1), 0.4)
    PB.panel(A, (X0, Y0, -0.006), (X1 - X0, 0, 0), (0, Y1 - Y0, 0), 8, 6, lambda i, j: C['gap'], (0, 0, 1))

def frame_timbers(A):
    for y in [0.15 + 0.82 * k for k in range(8)]:
        for sx in (-1, 1):
            beam(A, (sx * 3.08, y, EA - 0.06), (0, y, RG - 0.1), 0.1, 0.15, C['beam'], up=(0, 0, 1))
        beam(A, (X0, y, EA + 0.02), (X1, y, EA + 0.02), 0.12, 0.16, C['beam'])        # the tie beam across
    beam(A, (0, Y0, RG - 0.16), (0, Y1, RG - 0.16), 0.14, 0.2, C['beam'])             # the ridge
    for sx in (-1, 1):
        beam(A, (sx * 3.08, Y0, EA - 0.06), (sx * 3.08, Y1, EA - 0.06), 0.14, 0.16, C['beam'])   # the wall plate
    # posts at the corners
    for x in (X0 + 0.07, X1 - 0.07):
        for y in (Y0 + 0.07, Y1 - 0.07): beam(A, (x, y, 0), (x, y, EA), 0.14, 0.14, C['beam'])

def roof_planes(A, mats, old):
    """the underside of the roof: boards along the slope; the old roof has boards missing with the sky behind, and sags a little"""
    st = 0.2; n = int(round((Y1 - Y0) / st)); seg = 6
    for sx in (-1, 1):
        for i in range(n):
            y0 = Y0 + i * st; y1 = y0 + st - 0.004
            gap = old and ((i * 13 + (0 if sx < 0 else 5)) % 11 in (3,) or (i % 9 == 4))
            for s in range(seg):
                t0, t1 = s / seg, (s + 1) / seg
                def P(y, t):
                    x = sx * (3.08 - 3.08 * t); z = EA - 0.01 + (RG - 0.12 - EA) * t
                    if old: z -= 0.06 * math.sin(math.pi * t) * (0.6 + 0.4 * math.sin(i * 1.7 + sx))
                    return V((x, y, z))
                # missing in places: a gap through the middle of a run of boards
                if gap and 1 <= s <= 4 and (i + s) % 3 != 2: 
                    A.poly([P(y0, t0) + V((0, 0, 0.45)), P(y1, t0) + V((0, 0, 0.45)), P(y1, t1) + V((0, 0, 0.45)), P(y0, t1) + V((0, 0, 0.45))], C['sky'], (0, 0, -1))
                    continue
                m = mats[(i * 5 + s * 3 + (sx > 0)) % len(mats)]
                if not old and s % 2: m = C['tarpaper'] if False else m
                A.poly([P(y0, t0), P(y1, t0), P(y1, t1), P(y0, t1)], m, (0, 0, -1) if True else None)

def window(A, Gl, x, inward, y0, y1):
    n = V(inward); d = V((0, 1, 0)); o = V((x, 0, 0)); g = -n * 0.0
    Gl.poly([o + d * y0 + V((0, 0, WZ[0])), o + d * y1 + V((0, 0, WZ[0])), o + d * y1 + V((0, 0, WZ[1])), o + d * y0 + V((0, 0, WZ[1]))], C['glass'], n)
    for z in (WZ[0], WZ[1], (WZ[0] + WZ[1]) / 2):
        A.poly([o + d * y0 + V((0, 0, z - 0.03)), o + d * y1 + V((0, 0, z - 0.03)), o + d * y1 + V((0, 0, z + 0.03)), o + d * y0 + V((0, 0, z + 0.03))], C['frame'], n)
    for y in (y0, (y0 + y1) / 2, y1):
        A.poly([o + d * (y - 0.03) + V((0, 0, WZ[0])), o + d * (y + 0.03) + V((0, 0, WZ[0])), o + d * (y + 0.03) + V((0, 0, WZ[1])), o + d * (y - 0.03) + V((0, 0, WZ[1]))], C['frame'], n)
    # the dusk outside: a bright quad a little way out, so the baked light has a sky to take from
    out = -n * 0.5
    A.poly([o + out + d * (y0 - 0.2) + V((0, 0, WZ[0] - 0.2)), o + out + d * (y1 + 0.2) + V((0, 0, WZ[0] - 0.2)), o + out + d * (y1 + 0.2) + V((0, 0, WZ[1] + 0.2)), o + out + d * (y0 - 0.2) + V((0, 0, WZ[1] + 0.2))], C['sky'], n)

def front_wall(A, Gl):
    gable_wall(A, Y0, (0, 1, 0), (DOORX[0], DOORX[1], DOORH))
    # the double door: tarred boards with iron straps, a little ajar at the bottom where the dusk shows
    x0, x1 = DOORX
    for k in range(int((x1 - x0) / 0.2)):
        a = x0 + k * 0.2
        PB.panel(A, (a + 0.003, Y0 + 0.05, 0.06), (0.194, 0, 0), (0, 0, DOORH - 0.06), 1, 6, lambda i, j: C['tar'][(k + j) % 4], (0, 1, 0))
    for z in (0.5, 1.7):
        abox(A, x0, x1, Y0 + 0.04, Y0 + 0.06, z, z + 0.12, C['iron'])
    abox(A, -0.02, 0.02, Y0 + 0.04, Y0 + 0.062, 0.0, DOORH, C['gap'])
    A.poly([V((x0 + 0.1, Y0 - 0.05, 0.0)), V((x1 - 0.1, Y0 - 0.05, 0.0)), V((x1 - 0.1, Y0 - 0.05, 0.05)), V((x0 + 0.1, Y0 - 0.05, 0.05))], C['sky'], (0, 1, 0))

def back_wall(A):
    gable_wall(A, Y1, (0, -1, 0))
    # the board the fish hang on: aged planks standing out from the wall, with a nail at every place (the oak frame covers them)
    x0, x1, z0, z1 = WALL
    for r in range(int((z1 - z0) / 0.22)):
        z = z0 + r * 0.22
        abox(A, x0, x1, Y1 - 0.045, Y1 - 0.003, z + 0.004, z + 0.216, C['nailb'][(r * 5) % 3], skip=('+y',))
    for x, y, z in SLOTS: acyl(A, (x, Y1 - 0.045, z), (x, Y1 - 0.075, z), 0.012, lambda q: C['nail'], 6)

def clutter(A, Gl):
    # oars crossed on the right wall, a lifebuoy, nets and floats on the left, buoys, ropes, crates, a barrel, a bucket
    for sx in (-1, 1):
        beam(A, (X1 - 0.1, 0.9 + 0.5 * sx, 2.0 - 0.55 * sx), (X1 - 0.1, 0.9 - 0.5 * sx, 2.0 + 0.55 * sx), 0.07, 0.07, C['crate'])
    PB.window_glass if False else None
    atorus(A, (X1 - 0.1, 3.0, 1.9), (1, 0, 0), 0.26, 0.07, lambda a: C['lbuoy'] if int(a * 4 / math.pi) % 2 else C['buoyw'], 20, 6)
    # hanging nets over the left corner
    for k in range(6):
        y = 0.4 + k * 0.22
        beam(A, (X0 + 0.06, y, 2.2), (X0 + 0.22, y + 0.02, 0.9 - 0.1 * (k % 2)), 0.05, 0.12, C['net'])
    for k in range(4): sphere_acc = PB.sphere_acc; sphere_acc(A, (X0 + 0.15, 0.5 + k * 0.4, 2.15), 0.09, C['float'][k % 2])
    # buoys along the right wall at the front
    for k, (y, m) in enumerate(((0.45, C['buoyr']), (0.9, C['buoyw']), (1.35, C['buoyo']))):
        PB.sphere_acc(A, (X1 - 0.3, y, 0.28), 0.26, m, 10, 6)
    # crates and a barrel by the door
    abox(A, X0 + 0.15, X0 + 0.75, 0.3, 0.85, 0.0, 0.42, C['crate']); abox(A, X0 + 0.2, X0 + 0.7, 0.35, 0.8, 0.42, 0.78, C['crate'])
    acyl(A, (X0 + 0.55, 1.45, 0), (X0 + 0.55, 1.45, 0.8), 0.28, lambda z: C['tar'][1] if int(z * 10) % 5 else C['iron'], 12, cuts=(0.15, 0.4, 0.65))
    # a coil of rope and a bucket
    atorus(A, (-0.9, 0.9, 0.06), (0, 0, 1), 0.28, 0.05, lambda a: C['rope'], 16, 6)
    acyl(A, (0.9, 0.7, 0.0), (0.9, 0.7, 0.3), 0.14, lambda z: C['bucket'], 10, r1=0.17)
    # the old soot patch where a stove might stand
    PB.panel(A, (X1 - 0.004, 3.45, 0.0), (0, 0.9, 0), (0, 0, 1.6), 3, 4, lambda i, j: C['soot'], (-1, 0, 0))
    # the lantern from the tie beam
    acyl(A, LANT[:2] + (EA + 0.0,), LANT, 0.006, lambda z: C['iron'], 5)
    acyl(A, (LANT[0], LANT[1], LANT[2] - 0.2), (LANT[0], LANT[1], LANT[2] - 0.04), 0.085, lambda z: C['iron'], 8, r1=0.11)
    PB.sphere_acc(A, (LANT[0], LANT[1], LANT[2] - 0.12), 0.05, C['bulb'])
    # the lamp over the trophy wall on its bracket
    beam(A, (LAMP_W[0], Y1 - 0.02, LAMP_W[2] - 0.1), (LAMP_W[0], LAMP_W[1], LAMP_W[2] - 0.1), 0.05, 0.05, C['brass'])
    acyl(A, (LAMP_W[0], LAMP_W[1], LAMP_W[2] - 0.2), (LAMP_W[0], LAMP_W[1], LAMP_W[2] - 0.05), 0.07, lambda z: C['iron'], 8, r1=0.12)
    PB.sphere_acc(A, (LAMP_W[0], LAMP_W[1], LAMP_W[2] - 0.12), 0.045, C['bulb'])

def backing(A):
    # a dark shell behind every wall: the cracks between the boards show it, not the sky
    e = 0.04
    for y, n in ((Y0 - e, (0, 1, 0)), (Y1 + e, (0, -1, 0))):
        for a, b in ((-3.0, 0.0), (0.0, 3.0)):
            A.poly([V((a, y, 0)), V((b, y, 0)), V((b, y, roof_h(b))), V((a, y, roof_h(a)))], C['gap'], n)
    for x, n, op in ((X0 - e, (1, 0, 0), WIN_L), (X1 + e, (-1, 0, 0), WIN_R)):
        # the windows stay open in the shell, so the dusk outside shows through them
        ys = [Y0] + [v for a_, b_ in op for v in (a_, b_)] + [Y1]
        for a_, b_ in zip(ys[0::2], ys[1::2]):
            A.poly([V((x, a_, 0)), V((x, b_, 0)), V((x, b_, EA)), V((x, a_, EA))], C['gap'], n) if (a_, b_) in [(Y0, op[0][0]), (op[0][1], Y1)] else None
        for a_, b_ in op:
            A.poly([V((x, a_, 0)), V((x, b_, 0)), V((x, b_, WZ[0])), V((x, a_, WZ[0]))], C['gap'], n); A.poly([V((x, a_, WZ[1])), V((x, b_, WZ[1])), V((x, b_, EA)), V((x, a_, EA))], C['gap'], n)

def build_room():
    A = Acc('ROOM'); Gl = Acc('GLASS'); backing(A)
    floor(A); front_wall(A, Gl); back_wall(A)
    side_wall(A, X1, (-1, 0, 0), WIN_R); side_wall(A, X0, (1, 0, 0), WIN_L)
    for y0, y1 in WIN_R: window(A, Gl, X1, (-1, 0, 0), y0, y1)
    for y0, y1 in WIN_L: window(A, Gl, X0, (1, 0, 0), y0, y1)
    frame_timbers(A); clutter(A, Gl)
    return A.done(40), Gl.done(40)

def build_roof(old):
    A = Acc('ROOFOLD' if old else 'ROOFNEW')
    roof_planes(A, C['roofold'] if old else C['roofnew'], old)
    if not old:
        # new tar paper along the ridge and the eaves, a lighter board now and then
        for sx in (-1, 1): beam(A, (sx * 0.2, Y0, RG - 0.14), (sx * 0.2, Y1, RG - 0.14), 0.05, 0.03, C['tarpaper'])
    return A.done(40)

def build_vegg():
    A = Acc('VEGG'); x0, x1, z0, z1 = WALL; y = Y1 - 0.05
    # the oak frame round the board, a shelf for the lamp's light, brass hooks and plaques
    for a, b, c, d in ((x0 - 0.1, x1 + 0.1, z1, z1 + 0.1), (x0 - 0.1, x1 + 0.1, z0 - 0.1, z0), (x0 - 0.1, x0, z0, z1), (x1, x1 + 0.1, z0, z1)):
        abox(A, a, b, y - 0.06, y + 0.02, c, d, C['oak'][0])
    # five columns of boards in oak, each a little different, standing out from the nail board
    for k in range(10):
        a = x0 + k * (x1 - x0) / 10
        abox(A, a + 0.004, a + (x1 - x0) / 10 - 0.004, y - 0.03, y + 0.01, z0, z1, C['oak'][k % 3], skip=('+y',))
    for z in SLOT_Z:
        for x in SLOT_X:
            acyl(A, (x, y - 0.03, z + 0.05), (x, y - 0.12, z + 0.05), 0.012, lambda q: C['hook'], 6)
            acyl(A, (x, y - 0.12, z + 0.05), (x, y - 0.14, z + 0.0), 0.012, lambda q: C['hook'], 6)
            abox(A, x - 0.17, x + 0.17, y - 0.045, y - 0.03, z - PLAQ - 0.05, z - PLAQ + 0.05, C['brass'])
            for sx in (-1, 1): PB.sphere_acc(A, (x + sx * 0.14, y - 0.048, z - PLAQ), 0.008, C['steel'], 5, 3)
    return A.done(40)

def build_stove():
    A = Acc('OVN'); sx, sy = STOVE; x0 = sx - 0.3
    # the stove on four legs against the right wall, its door to the room, a flue through the roof, a kettle, logs
    for dx in (-0.2, 0.2):
        for dy in (-0.2, 0.2): acyl(A, (sx + dx, sy + dy, 0), (sx + dx, sy + dy, 0.16), 0.025, lambda z: C['stovem'], 6)
    abox(A, sx - 0.3, sx + 0.3, sy - 0.27, sy + 0.27, 0.16, 0.78, C['stovem'])
    abox(A, sx - 0.32, sx + 0.32, sy - 0.29, sy + 0.29, 0.78, 0.82, C['iron'])
    # the firebox door on the room side: a dark frame, a soot square, flames behind
    xf = sx - 0.305
    A.poly([V((xf, sy - 0.17, 0.3)), V((xf, sy + 0.17, 0.3)), V((xf, sy + 0.17, 0.62)), V((xf, sy - 0.17, 0.62))], C['soot'], (-1, 0, 0))
    for k in range(7):
        py = sy + rr.uniform(-0.13, 0.13); hg = rr.uniform(0.1, 0.22); w = rr.uniform(0.03, 0.06); m = C['flame2'] if hg < 0.14 else C['flame']
        A.poly([V((xf - 0.004, py - w, 0.31)), V((xf - 0.004, py + w, 0.31)), V((xf - 0.004, py + rr.uniform(-0.02, 0.02), 0.31 + hg))], m, (-1, 0, 0))
    for k in range(8): PB.sphere_acc(A, (xf - 0.004, sy + rr.uniform(-0.14, 0.14), 0.31), 0.018, C['ember'], 5, 3)
    abox(A, xf - 0.03, xf - 0.0, sy - 0.2, sy + 0.2, 0.28, 0.3, C['iron']); abox(A, xf - 0.03, xf, sy - 0.2, sy - 0.18, 0.28, 0.64, C['iron']); abox(A, xf - 0.03, xf, sy + 0.18, sy + 0.2, 0.28, 0.64, C['iron'])
    abox(A, xf - 0.03, xf, sy - 0.2, sy + 0.2, 0.62, 0.64, C['iron'])
    acyl(A, (xf - 0.04, sy + 0.22, 0.45), (xf - 0.07, sy + 0.22, 0.45), 0.02, lambda z: C['brass'], 6)
    # the flue
    top = roof_h(sx) - 0.02
    acyl(A, (sx + 0.1, sy, 0.82), (sx + 0.1, sy, top), 0.065, lambda z: C['stovem'], 10, cuts=(1.4, 2.0, 2.5))
    acyl(A, (sx + 0.1, sy, top - 0.06), (sx + 0.1, sy, top), 0.1, lambda z: C['iron'], 10)
    # a kettle and a pot on top
    acyl(A, (sx - 0.1, sy - 0.12, 0.82), (sx - 0.1, sy - 0.12, 0.98), 0.1, lambda z: C['kettle'], 12, r1=0.08)
    atorus(A, (sx - 0.1, sy - 0.12, 0.98), (0, 1, 0), 0.07, 0.008, lambda a: C['iron'], 12, 4, 0.0, math.pi)
    acyl(A, (sx - 0.1, sy - 0.2, 0.9), (sx - 0.16, sy - 0.27, 0.9), 0.012, lambda z: C['kettle'], 6)
    # the log stack
    for r in range(4):
        for k in range(5 - r % 2):
            yy = sy + 0.5 + k * 0.17 + (r % 2) * 0.085
            acyl(A, (sx - 0.22, yy, 0.09 + r * 0.16), (sx + 0.25, yy, 0.09 + r * 0.16), 0.075, lambda z: C['log'][(k + r) % 3], 8)
            A.poly([V((sx - 0.225, yy - 0.04, 0.09 + r * 0.16 - 0.04)), V((sx - 0.225, yy + 0.04, 0.09 + r * 0.16 - 0.04)), V((sx - 0.225, yy + 0.04, 0.09 + r * 0.16 + 0.04)), V((sx - 0.225, yy - 0.04, 0.09 + r * 0.16 + 0.04))], C['logend'], (-1, 0, 0))
    return A.done(40)

def build_bench(old):
    A = Acc('BENKOLD' if old else 'BENK'); bx, by0, by1 = BENCH; xb = bx - 0.1; d = 0.7
    if old:
        # a plank on two trestles, sagging, a rusty saw and a hammer head on it
        for y in (by0 + 0.5, by1 - 0.5):
            for s in (-1, 1): beam(A, (X0 + 0.1, y + s * 0.2, 0.0), (X0 + 0.5, y, 0.8), 0.06, 0.06, C['crate'])
            beam(A, (X0 + 0.5, y, 0.8), (X0 + 0.5, y, 0.82), 0.06, 0.06, C['crate'])
        beam(A, (X0 + 0.5, by0 + 0.2, 0.84), (X0 + 0.5, (by0 + by1) / 2, 0.8), 0.6, 0.05, C['crate'], up=(0, 0, 1))
        beam(A, (X0 + 0.5, (by0 + by1) / 2, 0.8), (X0 + 0.5, by1 - 0.2, 0.84), 0.6, 0.05, C['crate'], up=(0, 0, 1))
        abox(A, X0 + 0.3, X0 + 0.5, by0 + 0.5, by0 + 0.95, 0.865, 0.875, C['rust'])
        abox(A, X0 + 0.45, X0 + 0.65, by0 + 1.1, by0 + 1.2, 0.84, 0.9, C['rust'])
        abox(A, X0 + 0.2, X0 + 0.55, by1 - 0.9, by1 - 0.4, 0.0, 0.04, C['crate'])
        return A.done(40)
    # Father's bench: a thick top, drawers, a vise, a shelf of jars, the pegboard with his tools, a lamp
    xw = X0 + 0.03
    abox(A, xw, xw + 0.72, by0, by1, 0.84, 0.92, C['oak'][1])
    for y in (by0 + 0.08, by1 - 0.08):
        abox(A, xw + 0.04, xw + 0.14, y - 0.04, y + 0.04, 0.0, 0.84, C['oak'][0]); abox(A, xw + 0.58, xw + 0.68, y - 0.04, y + 0.04, 0.0, 0.84, C['oak'][0])
    abox(A, xw + 0.04, xw + 0.68, by0 + 0.04, by1 - 0.04, 0.3, 0.34, C['oak'][2])
    for k in range(3):
        ya = by0 + 0.2 + k * 0.7
        abox(A, xw + 0.58, xw + 0.7, ya, ya + 0.62, 0.45, 0.8, C['oak'][k % 3]); abox(A, xw + 0.7, xw + 0.715, ya + 0.25, ya + 0.37, 0.6, 0.63, C['brass'])
    abox(A, xw + 0.55, xw + 0.72, by1 - 0.3, by1 - 0.1, 0.92, 1.0, C['iron']); abox(A, xw + 0.62, xw + 0.7, by1 - 0.34, by1 - 0.26, 0.92, 1.05, C['iron'])   # the vise
    for k in range(4): acyl(A, (xw + 0.2 + 0.1 * (k % 2), by0 + 0.2 + 0.3 * k, 0.34), (xw + 0.2 + 0.1 * (k % 2), by0 + 0.2 + 0.3 * k, 0.5), 0.05, lambda z: C['jar'], 8)
    # the pegboard on the wall with silhouettes of tools
    abox(A, X0 + 0.002, X0 + 0.03, by0 + 0.1, by1 - 0.1, 1.15, 2.1, C['pegb'], skip=('-x',))
    for k in range(5):
        yy = by0 + 0.35 + k * 0.38
        abox(A, X0 + 0.03, X0 + 0.045, yy - 0.02, yy + 0.02, 1.5, 1.95, C['handle']); abox(A, X0 + 0.03, X0 + 0.05, yy - 0.07, yy + 0.07, 1.9, 1.99, C['tool'])
    abox(A, X0 + 0.03, X0 + 0.05, by0 + 0.3, by0 + 1.3, 1.3, 1.36, C['tool'])    # a saw
    # a small lamp on the bench
    acyl(A, (xw + 0.3, by1 - 0.5, 0.92), (xw + 0.3, by1 - 0.5, 1.04), 0.06, lambda z: C['iron'], 8); PB.sphere_acc(A, (xw + 0.3, by1 - 0.5, 1.1), 0.045, C['bulb'])
    # a half-built model boat on the bench: the hull of two boards and a mast
    abox(A, xw + 0.15, xw + 0.5, by0 + 0.3, by0 + 0.8, 0.92, 0.98, C['oak'][2]); acyl(A, (xw + 0.32, by0 + 0.55, 0.98), (xw + 0.32, by0 + 0.55, 1.22), 0.008, lambda z: C['handle'], 5)
    return A.done(40)

def build():
    room, glass = build_room()
    return {'room': room, 'glass': glass, 'roofold': build_roof(True), 'roofnew': build_roof(False), 'ovn': build_stove(), 'benk': build_bench(False),
            'benkold': build_bench(True), 'vegg': build_vegg()}

# ---------- light ----------
def lights():
    L = {}
    def pt(name, p, w, col, r=0.12, kind='POINT'):
        l = bpy.data.lights.new(name, kind); l.energy = w; l.color = col
        if kind == 'POINT': l.shadow_soft_size = r
        o = link(bpy.data.objects.new(name, l)); o.location = p; L[name] = o; return o
    pt('lantern', (LANT[0], LANT[1], LANT[2] - 0.12), 110, (1.0, 0.74, 0.46))
    pt('wall', (LAMP_W[0], LAMP_W[1], LAMP_W[2] - 0.12), 150, (1.0, 0.78, 0.50))
    pt('bench', (BENCH[0] + 0.4, 3.3, 1.2), 40, (1.0, 0.74, 0.46))
    # the dusk through the windows
    for k, (x, y0, y1, inw) in enumerate([(X1 + 0.2, WIN_R[0][0], WIN_R[0][1], -1), (X0 - 0.2, WIN_L[0][0], WIN_L[0][1], 1)]):
        l = bpy.data.lights.new('win%d' % k, 'AREA'); l.energy = 160; l.color = (0.55, 0.66, 1.0); l.shape = 'RECTANGLE'; l.size = y1 - y0; l.size_y = WZ[1] - WZ[0]
        o = link(bpy.data.objects.new('win%d' % k, l)); o.location = (x, (y0 + y1) / 2, (WZ[0] + WZ[1]) / 2); o.rotation_euler = (0, math.radians(90 * inw), 0); L['win%d' % k] = o
    pt('door', (0, -0.3, 0.6), 18, (0.5, 0.62, 1.0), 0.3)
    fire = pt('fire', (STOVE[0] - 0.5, STOVE[1], 0.4), 85, (1.0, 0.5, 0.18), 0.2)
    w = bpy.context.scene.world or bpy.data.worlds.new('w'); bpy.context.scene.world = w; w.use_nodes = True
    bg = w.node_tree.nodes.get('Background'); bg.inputs['Color'].default_value = (0.03, 0.04, 0.08, 1); bg.inputs['Strength'].default_value = 1.0
    g = MATS['npub_glass']; b = g.node_tree.nodes.get('Principled BSDF'); b.inputs['Transmission Weight'].default_value = 1.0; b.inputs['Roughness'].default_value = 0.05
    return L, fire

def dim_sky(o, k=0.17):
    me = o.data; B = me.color_attributes['BAKE']; slots = [s.material for s in o.material_slots]
    for p_ in me.polygons:
        m = slots[p_.material_index] if slots else None
        if m and m.name == 'dusk':
            for li in p_.loop_indices:
                c = B.data[li].color; B.data[li].color = (c[0] * k, c[1] * k, c[2] * k * 1.15, 1.0)

# ---------- anchors, renders, export ----------
G = lambda p: [round(v, 3) for v in PB.to_game(p)]
def anchors():
    return {'eye': G(EYE), 'look': G((EYE[0], EYE[1] + 1, EYE[2] + 0.05)),
            'slots': [G(s) for s in SLOTS], 'plaq': PLAQ, 'wall': G((0, Y1, 1.55)),
            'spots': [['vegg', G((0, Y1 - 0.1, 1.5)), 2.5], ['ovn', G((STOVE[0] - 0.2, STOVE[1], 0.6)), 0.6], ['benk', G((BENCH[0] + 0.3, (BENCH[1] + BENCH[2]) / 2, 0.95)), 1.0],
                      ['tak', G((0, 3.2, 3.6)), 1.3], ['door', G((0, Y0, 1.1)), 1.0]],
            'fire': G((STOVE[0] - 0.4, STOVE[1], 0.4))}
SHOTS = [('wall', EYE, (0, Y1, 1.5), 36), ('room', EYE, (-0.6, 3.0, 1.2), 20), ('stove', EYE, (STOVE[0], STOVE[1], 0.9), 28), ('bench', EYE, (BENCH[0], 3.3, 1.1), 28),
         ('roof', EYE, (0, 3.2, 3.4), 24), ('over', (-2.7, 0.3, 2.0), (1.5, 5.0, 1.2), 16), ('door', (0, 5.5, 1.5), (0, 0, 1.2), 22)]
def renders(prefix, variants=''):
    sc = bpy.context.scene; sc.render.resolution_x = 1280; sc.render.resolution_y = 720; sc.render.resolution_percentage = 100
    sc.cycles.samples = int(os.environ.get('NAUST_RS', '48')); sc.cycles.use_denoising = True; sc.view_settings.view_transform = 'AgX'; sc.view_settings.exposure = 0.6
    for nm, loc, look, lens in SHOTS:
        camera(loc, look, lens=lens); bpy.context.scene.camera.data.clip_start = 0.05; render(os.path.join(OUT, '%s%s_%s.png' % (prefix, variants, nm)))

def set_variant(P, new):
    for k in ('roofnew', 'benk', 'ovn', 'vegg'): P[k].hide_render = not new
    for k in ('roofold', 'benkold'): P[k].hide_render = new

def main():
    os.makedirs(OUT, exist_ok=True); os.environ.setdefault('PUB_EXPO_K', '0.24')   # the room is dim: keep it so on the screen
    reset(); colours()
    P = build(); L, fire = lights()
    for o in P.values(): PB.white_tint(o)
    if 'look' in sys.argv or 'fast' not in sys.argv:
        set_variant(P, True); renders('naust', '_new')
        set_variant(P, False); renders('naust', '_old')
        if 'look' in sys.argv: return
    sm = int(os.environ.get('NAUST_SAMPLES', '140'))
    sc = bpy.context.scene; bg = sc.world.node_tree.nodes.get('Background'); b0 = bg.inputs['Strength'].default_value
    PB.emissions(True)
    passes = (('new', ['room', 'roofnew', 'ovn', 'benk', 'vegg']), ('old', ['roofold', 'benkold']))
    for tag, names in passes:
        set_variant(P, tag == 'new')
        for k in names: PB.bake(P[k], 'BAKE', sm)
        # the fire's own share
        for n, l in L.items(): l.data['e0'] = l.data.energy; l.data.energy = l.data.energy if l is fire else 0.0
        bg.inputs['Strength'].default_value = 0.0; PB.emissions(False)
        for k in names: PB.bake(P[k], 'FIRE', max(24, sm // 2))
        for n, l in L.items(): l.data.energy = l.data['e0']
        bg.inputs['Strength'].default_value = b0; PB.emissions(True)
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT, 'naustinne_baked.blend'))
    export(P)

def export(P):
    import base64
    for k in ('room', 'roofnew', 'ovn', 'benk', 'vegg', 'roofold', 'benkold'):
        PB.smooth_bake(P[k]); dim_sky(P[k])
    expo = PB.exposure(P['room'])
    parts = []
    for k, al in (('room', 1.0), ('roofnew', 1.0), ('roofold', 1.0), ('ovn', 1.0), ('benk', 1.0), ('benkold', 1.0), ('vegg', 1.0)):
        parts.append((k, PB.baked_arrays(P[k], PB.to_game, PB.to_game_n, expo), al))
    parts.append(('glass', mesh_arrays(P['glass'], PB.to_game, PB.to_game_n, ao=False), 0.2))
    ex = {'frame': 'kystfiske naustinne: x right, y up from the floor, z towards the player (the eye looks along -z); metres. Baked light; _PAINT[1] is the fire\'s share, zone 4 the flames',
          'name': 'Naustet', 'anchors': anchors(), 'expo': round(expo, 4)}
    glb = os.path.join(OUT, 'naustinne.glb'); n = write_glb(glb, parts, ex)
    if 'dry' not in sys.argv: open(os.path.join(ROOT, 'src', 'data', 'naustinne.b64'), 'w').write(base64.b64encode(open(glb, 'rb').read()).decode())
    print('naustinne GLB %.0f KB: ' % (n / 1024) + ', '.join('%s %d tris' % (k, len(a['idx']) // 3) for k, a, _ in parts) + '; exposure %.3f' % expo)

if __name__ == '__main__':
    main()
