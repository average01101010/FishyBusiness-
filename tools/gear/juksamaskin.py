"""The electric jigging machine on the rail, built in Blender (the user's wish 13.10.2026: «Lag en bra blendermodell av juksamaskin»,
with pictures of the machines in use along the coast). In the game up to three stand on the rail; the spool jerks the jig up and down
while it fishes and runs the line in when fish are on, and the sheave at the arm's end turns with it (drawSkipper in view3d.js).

    maskin   the machine as one piece: a clamp on the rail with a swivel post, the motor housing across the boat's length, the
             control box on the inboard side facing the fisher (a green display, a keypad and a red stop button), the cable to
             the battery, the stainless arm out over the side and the red block hanging from its end. From the top of the rail
             at the clamp.
    spole    the open spool with the line wound on it, from its axle (along the boat, so it turns about z in the game)
    skive    the block's sheave, from its axle (along the boat)

What I chose myself (no drawings, and no make: the pictures show several makers, and the game names none): a light grey motor
housing with a black end cap, a dark control box with a green display, a white spool, a 0.85 m arm rising out over the side and a
red block, the common look of the machines in the pictures; the spool 0.3 m across, the arm's tip 0.85 m outside the clamp and 0.62 m
over the rail, where the game has hung the line since the drawn machine.

    pip install bpy==4.5.4
    python3 tools/gear/juksamaskin.py          -> src/data/gear-jig.b64, renders in tools/gear/out/
    python3 tools/gear/juksamaskin.py fast     -> without the renders

Frames. Here in Blender: x to the right (out over the side), y forward, z up. The game's: x right, y up, z aft;
to_game(p) = (x, z, -y)."""
import os, sys, math, base64
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))
sys.path.insert(0, os.path.join(ROOT, 'tools', 'boats'))
import bpy, bmesh
from bpyutil import *

OUT = os.path.join(HERE, 'out')
def to_game(p): return (p[0], p[2], -p[1])
def to_game_n(n): return (n[0], n[2], -n[1])

C = {}
def colours():
    C['galv'] = mat('galv', (0.70, 0.72, 0.74), 0.7, metal=0.8)
    C['steel'] = mat('steel', (0.80, 0.81, 0.82), 0.85, metal=0.9)
    C['house'] = mat('house', (0.78, 0.79, 0.80), 0.55)
    C['cap'] = mat('cap', (0.06, 0.06, 0.07), 0.45)
    C['dark'] = mat('dark', (0.13, 0.14, 0.15), 0.4)
    C['box'] = mat('box', (0.09, 0.10, 0.11), 0.35)
    C['lcd'] = mat('lcd', (0.55, 0.78, 0.30), 0.9, emit=0.6)
    C['lcdrim'] = mat('lcdrim', (0.03, 0.03, 0.035), 0.5)
    C['kyel'] = mat('kyel', (0.92, 0.78, 0.12), 0.5)
    C['kgrn'] = mat('kgrn', (0.12, 0.62, 0.22), 0.5)
    C['kblu'] = mat('kblu', (0.10, 0.32, 0.78), 0.5)
    C['kred'] = mat('kred', (0.82, 0.08, 0.06), 0.55)
    C['spool'] = mat('spool', (0.93, 0.93, 0.92), 0.5)
    C['line'] = mat('line', (0.62, 0.64, 0.66), 0.4)
    C['red'] = mat('red', (0.78, 0.10, 0.06), 0.6)
    C['cable'] = mat('cable', (0.92, 0.45, 0.10), 0.4)
    C['rubber'] = mat('rubber', (0.05, 0.05, 0.055), 0.15)

AX = (0.0, 0.05, 0.30)       # the spool's axle: the machine's middle across, a little forward of the clamp, 0.3 m over the rail
SPR, SPW = 0.15, 0.12        # the spool flanges' radius and the spool's width (along y)
MOT = (-0.24, -0.02)         # the motor housing along y, aft of the spool
TIP = (0.84, AX[1], 0.66)    # the arm's end, where the block hangs
SH = (0.84, AX[1], 0.585)    # the block's sheave
SR = 0.04

def maskin():
    P = []
    # the clamp on the rail: a U over the rail's cap with two bolts, the swivel post and its turntable
    P.append(box('clamp', -0.07, 0.07, -0.09, 0.09, -0.01, 0.025, C['galv'], bevel=0.008))
    for sx in (-1, 1): P.append(box('jaw', sx * 0.07 - 0.012, sx * 0.07 + 0.012, -0.09, 0.09, -0.12, 0.0, C['galv'], bevel=0.004))
    for sy in (-0.05, 0.05): P.append(cyl('bolt', (-0.1, sy, -0.08), (0.1, sy, -0.08), 0.009, C['steel'], seg=8))
    P.append(cyl('post', (0, 0, 0.02), (0, 0, 0.13), 0.032, C['galv'], seg=14))
    P.append(cyl('turn', (0, 0, 0.12), (0, 0, 0.145), 0.075, C['dark'], seg=20))
    # the base under the machine and the two side plates that carry the axle
    P.append(box('base', -0.11, 0.11, MOT[0] - 0.01, AX[1] + SPW / 2 + 0.04, 0.145, 0.165, C['dark'], bevel=0.006))
    P.append(box('plate', -0.07, 0.07, AX[1] + SPW / 2 + 0.01, AX[1] + SPW / 2 + 0.03, 0.15, AX[2] + 0.04, C['dark'], bevel=0.005))
    P.append(cyl('boss', (0, AX[1] + SPW / 2 + 0.03, AX[2]), (0, AX[1] + SPW / 2 + 0.05, AX[2]), 0.04, C['cap'], seg=16))
    # the motor housing across the boat's length, with cooling ribs and a black end cap
    P.append(cyl('motor', (0, MOT[0], AX[2]), (0, MOT[1], AX[2]), 0.135, C['house'], seg=32))
    for k in range(4): y = MOT[0] + 0.035 + k * 0.045; P.append(cyl('rib', (0, y, AX[2]), (0, y + 0.012, AX[2]), 0.141, C['house'], seg=32))
    P.append(cyl('ecap', (0, MOT[0] - 0.03, AX[2]), (0, MOT[0], AX[2]), 0.128, C['cap'], seg=32, r1=0.138))
    P.append(cyl('hub', (0, MOT[0] - 0.045, AX[2]), (0, MOT[0] - 0.03, AX[2]), 0.05, C['dark'], seg=16))
    P.append(box('foot', -0.1, 0.1, MOT[0] + 0.02, MOT[1] - 0.02, 0.16, AX[2] - 0.1, C['house'], bevel=0.01))
    # the control box on the inboard side (-x), facing the fisher, a little tilted up: display, keypad, stop button
    bx0, bx1, by0, by1, bz0, bz1 = -0.24, -0.14, MOT[0] + 0.02, MOT[1] + 0.02, 0.17, 0.43
    P.append(box('cbox', bx0, bx1, by0, by1, bz0, bz1, C['box'], bevel=0.012))
    P.append(box('carm', bx1 - 0.005, -0.09, by0 + 0.06, by1 - 0.06, 0.24, 0.3, C['dark']))
    f = bx0 - 0.004
    P.append(box('lcdrim', f - 0.004, bx0 + 0.002, by0 + 0.03, by1 - 0.03, 0.33, 0.41, C['lcdrim']))
    P.append(box('lcd', f - 0.007, f - 0.003, by0 + 0.04, by1 - 0.04, 0.343, 0.4, C['lcd']))
    keys = [C['kyel'], C['kyel'], C['kyel'], C['kgrn'], C['kyel'], C['kblu'], C['kyel'], C['kyel'], C['kgrn']]
    for i, m in enumerate(keys):
        r, c = divmod(i, 3); y = by0 + 0.05 + c * 0.05; z = 0.29 - r * 0.035
        P.append(box('key', f - 0.012, bx0 + 0.002, y - 0.015, y + 0.015, z - 0.012, z + 0.012, m, bevel=0.004))
    P.append(cyl('stop', (f, by1 - 0.035, 0.205), (f - 0.02, by1 - 0.035, 0.205), 0.022, C['kred'], seg=14))
    # the cable from the box down the post to the battery, and its plug
    P.append(tube('cable', [(bx0 + 0.04, by0 + 0.03, bz0 + 0.01), (-0.2, by0 - 0.02, 0.1), (-0.09, -0.04, 0.03), (-0.08, -0.03, -0.15), (-0.16, -0.06, -0.3)], 0.011, C['cable'], seg=7))
    P.append(cyl('plug', (-0.08, -0.03, -0.05), (-0.08, -0.03, -0.09), 0.018, C['rubber'], seg=10))
    # the arm: a holder on top of the housing and the stainless rod rising out over the side, an eye at its end
    P.append(box('holder', -0.04, 0.06, AX[1] - 0.03, AX[1] + 0.03, AX[2] + 0.12, AX[2] + 0.17, C['dark'], bevel=0.008))
    P.append(cyl('hstem', (0, AX[1], AX[2] + 0.08), (0, AX[1], AX[2] + 0.13), 0.02, C['dark'], seg=10))
    arm = [(0.0, AX[1], AX[2] + 0.145), (0.12, AX[1], AX[2] + 0.2), (0.36, AX[1], AX[2] + 0.28), (0.62, AX[1], TIP[2] + 0.015), (TIP[0], AX[1], TIP[2])]
    P.append(tube('arm', arm, 0.014, C['steel'], seg=10))
    P.append(torus('eye', (TIP[0] + 0.012, AX[1], TIP[2]), (0, 1, 0), 0.016, 0.005, C['steel'], seg=12, rseg=6))
    # the block: a swivel and two red cheeks round the sheave, a guard over its top
    P.append(cyl('swivel', (TIP[0], AX[1], TIP[2] - 0.005), (TIP[0], AX[1], SH[2] + SR + 0.02), 0.008, C['steel'], seg=6))
    for sd in (1, -1):
        c = P.append(cyl('cheek', (SH[0], AX[1] + sd * 0.016, SH[2]), (SH[0], AX[1] + sd * 0.024, SH[2]), SR + 0.018, C['red'], seg=18))
    P.append(box('guard', SH[0] - SR - 0.012, SH[0] + SR + 0.012, AX[1] - 0.02, AX[1] + 0.02, SH[2] + SR + 0.004, SH[2] + SR + 0.02, C['red'], bevel=0.006))
    P.append(cyl('pin', (SH[0], AX[1] - 0.03, SH[2]), (SH[0], AX[1] + 0.03, SH[2]), 0.006, C['steel'], seg=8))
    for p in P: apply_all(p)
    return join(P, 'maskin')

def spole():
    P = []
    y0, y1 = -SPW / 2, SPW / 2
    P.append(cyl('core', (0, y0, 0), (0, y1, 0), 0.06, C['spool'], seg=24))
    P.append(cyl('wound', (0, y0 + 0.008, 0), (0, y1 - 0.008, 0), 0.115, C['line'], seg=28))
    for y in (y0, y1 - 0.008): P.append(cyl('flange', (0, y, 0), (0, y + 0.008, 0), SPR, C['spool'], seg=32))
    # spokes cut in the outer flange as raised ribs, so the turning reads
    for k in range(5):
        a = k * 2 * math.pi / 5; P.append(box('spoke', -0.008, 0.008, y1, y1 + 0.006, 0.03, SPR - 0.015, C['dark']))
        P[-1].rotation_euler = (0, a, 0); apply_all(P[-1])
    P.append(cyl('nut', (0, y1, 0), (0, y1 + 0.014, 0), 0.025, C['steel'], seg=6))
    for p in P: apply_all(p)
    return join(P, 'spole')

def skive():
    P = [cyl('sheave', (0, -0.014, 0), (0, 0.014, 0), SR, C['dark'], seg=20), torus('groove', (0, 0, 0), (0, 1, 0), SR - 0.004, 0.007, C['steel'], seg=20, rseg=6)]
    for p in P: apply_all(p)
    return join(P, 'skive')

def main():
    os.makedirs(OUT, exist_ok=True)
    reset(); colours()
    M = maskin(); S = spole(); K = skive()
    parts = [(nm, mesh_arrays(o, to_game, to_game_n, ao=False), 1.0) for nm, o in (('maskin', M), ('spole', S), ('skive', K))]
    g = lambda p: [round(v, 4) for v in to_game(p)]
    ex = {'frame': 'kystfiske jigging machine: x right (out over the side), y up, z aft; the machine from the top of the rail at its clamp, the spool and the sheave from their axles (along z)',
          'spool': g(AX), 'spoolR': 0.115, 'sheave': g(SH), 'sheaveR': SR,
          'tip': g((SH[0] + SR, SH[1], SH[2])), 'lead': g((SH[0] - SR, SH[1], SH[2] + SR * 0.4))}
    glb = os.path.join(OUT, 'gear-jig.glb'); n = write_glb(glb, parts, ex)
    open(os.path.join(ROOT, 'src', 'data', 'gear-jig.b64'), 'w').write(base64.b64encode(open(glb, 'rb').read()).decode())
    print('jigging machine GLB %.1f KB, %s' % (n / 1024, ', '.join('%s %d' % (p[0], len(p[1]['idx']) // 3) for p in parts)))
    if 'fast' in sys.argv: return
    S.location = AX; K.location = SH
    # the rail it stands on, only in the renders
    rail = box('rail', -0.06, 0.06, -0.8, 0.8, -0.14, -0.02, mat('wood', (0.45, 0.30, 0.18), 0.3))
    setup_render(1600, 1000, samples=32)
    camera((-1.5, -1.7, 1.0), (0.25, 0.0, 0.35), lens=40); render(os.path.join(OUT, 'jig_3q.png'))
    camera((-1.3, 0.9, 0.7), (0.0, 0.0, 0.3), lens=55); render(os.path.join(OUT, 'jig_panel.png'))
    camera((0.35, -3.0, 0.35), (0.35, 0.0, 0.35), ortho=1.3); render(os.path.join(OUT, 'jig_side.png'))

if __name__ == '__main__':
    main()
