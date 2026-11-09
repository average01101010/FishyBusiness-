"""The hand jig of the boats worked by hand, built in Blender after Jonas' picture (OB1, steg 70 in docs/planer/koen.md, 09.11.2026:
«Her er bilde av en jukse, og et juksahjul»; U4 in docs/skipsmodeller/kartlegging-spillet.md, the reel was a few boxes drawn in the code).
The pictures stay out of the repo; what the reel's shows and the proportions read off it are here:

    juksahjul  the reel clamped on the rail: a black steel bracket (a channel over the gunwale with a star knob that clamps it, an
               upright to the axle, a ball knob for the brake), a blue plastic spool of about 0.26 m with the clear line wound on it,
               turned by a black knob on its face, and a steel wire arm out over the side ending in a coiled eye the line runs through.
               In the picture the spool is about 3.5 times as broad across as it is wide, the arm about as long as the spool is broad.
    Jonas sent a hand line on its wooden frame too («jukse») and said one of the two is enough (09.11.2026: «Du trenger bare å lage
    en av delene. Ikke nødvendig med begge to»): the reel is the one the game uses at the rail, so only it is built.

Parts: vinde (the bracket, its knobs and the wire arm; from the spool's axle), trommel (the spool with the line and the knob; from its
axle, turning about the boat's length, z in the game).
The game's places (view3d/13-instruments.js drawSkiff, juksa): the axle 0.2 m over the rail; the hand on the knob and the eye the line
runs through from the extras (crank, eye). What I chose myself: the steel's black and the blue of the pictures, the sizes from the
proportions above (no measures are given), no maker's name or mark.

    python3.11 tools/gear/vinde.py         -> src/data/gear-vinde.b64, renders in tools/gear/out/
    python3.11 tools/gear/vinde.py fast    -> without the renders

Frames. Here in Blender: x out over the side, y forward along the boat, z up, the spool's axle at the origin. The game's: x out over the
side, y up, z aft; to_game(p) = (x, z, -y)."""
import os, sys, math, base64
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))
sys.path.insert(0, os.path.join(ROOT, 'tools', 'boats'))
import bpy, bmesh
from bpyutil import *

OUT = os.path.join(HERE, 'out')
C = {}
def colours():
    C['blue'] = mat('blue', (0.13, 0.22, 0.42), 0.55)
    C['black'] = mat('black', (0.03, 0.03, 0.035), 0.45)
    C['steel'] = mat('steel', (0.70, 0.71, 0.72), 0.5, metal=0.7)
    C['line'] = mat('line', (0.80, 0.82, 0.84), 0.75)

def to_game(p): return (p[0], p[2], -p[1])
def to_game_n(n): return (n[0], n[2], -n[1])

RAIL = -0.20                 # the rail's top under the axle (the game hangs the reel 0.2 m over it)
R_FL, HW = 0.13, 0.046       # the flanges' radius, half the spool's width between them
R_LINE = 0.088               # the line wound on
KNOB = (0.0, -0.105, 0.062)  # the knob on the spool's after face: 0.062 m from the axle, its middle 0.105 m aft
EYE = (0.34, 0.0, RAIL + 0.05)

def bracket():
    p = []
    # the channel over the gunwale and its star knob, the upright up the after side of the spool to the axle
    p.append(box('foot', -0.04, 0.04, -0.13, -0.015, RAIL, RAIL + 0.008, C['black']))
    for x in (-0.04, 0.032): p.append(box('lip', x, x + 0.008, -0.13, -0.015, RAIL - 0.055, RAIL, C['black']))
    p.append(cyl('star', (0.0, -0.08, RAIL + 0.008), (0.0, -0.08, RAIL + 0.03), 0.022, C['black'], seg=8))
    p.append(box('upright', -0.016, 0.016, -0.072, -0.064, RAIL + 0.008, 0.012, C['black']))
    p.append(cyl('axle', (0.0, -0.075, 0.0), (0.0, 0.058, 0.0), 0.008, C['steel'], seg=10))
    p.append(cyl('nut', (0.0, -0.085, 0.0), (0.0, -0.072, 0.0), 0.016, C['steel'], seg=6))
    # the brake: a ball knob on a bolt through the upright under the spool
    p.append(cyl('bolt', (0.0, -0.072, -0.115), (0.0, -0.1, -0.115), 0.006, C['steel'], seg=8))
    p.append(sphere('brake', (0.0, -0.112, -0.115), 0.024, C['black'], scale=(1, 0.9, 1)))
    # the wire arm out over the side from the foot of the upright, bent up and out, with its coiled eye at the end
    p.append(tube('arm', [(0.0, -0.068, RAIL + 0.03), (0.12, -0.045, RAIL + 0.03), (0.2, -0.01, RAIL + 0.07), (0.27, 0.0, RAIL + 0.05), (EYE[0] - 0.015, 0.0, EYE[2])], 0.0035, C['steel'], seg=6))
    for k in range(3): p.append(torus('eye', (EYE[0] + 0.006 * k, 0.0, EYE[2]), (1, 0, 0), 0.016, 0.0032, C['steel'], seg=16, rseg=6))
    return join(p, 'vinde')

def spool():
    p = []
    for s in (-1, 1):
        p.append(cyl('flange', (0, s * HW, 0), (0, s * (HW + 0.009), 0), R_FL, C['blue'], seg=36))
        p.append(torus('rim', (0, s * (HW + 0.004), 0), (0, 1, 0), R_FL - 0.006, 0.008, C['blue'], seg=36, rseg=6))
        for k in range(4):   # the moulded dimples on the faces, so the turning shows
            a = math.pi / 2 * k + 0.4; q = (0.095 * math.cos(a), s * (HW + 0.0095), 0.095 * math.sin(a))
            p.append(cyl('dimple', q, (q[0], q[1] + s * 0.002, q[2]), 0.008, C['black'], seg=8))
    p.append(cyl('hub', (0, -HW, 0), (0, HW, 0), 0.035, C['blue'], seg=20))
    p.append(cyl('wound', (0, -HW + 0.002, 0), (0, HW - 0.002, 0), R_LINE, C['line'], seg=28))
    # the knob on the after face that turns it
    p.append(cyl('stem', (KNOB[0], -HW - 0.009, KNOB[2]), (KNOB[0], KNOB[1] + 0.02, KNOB[2]), 0.009, C['steel'], seg=8))
    p.append(sphere('knob', KNOB, 0.03, C['black'], scale=(1, 0.85, 1)))
    return join(p, 'trommel')

def main():
    os.makedirs(OUT, exist_ok=True)
    reset(); colours()
    F = bracket(); D = spool()
    parts = [(n, mesh_arrays(o, to_game, to_game_n, ao=False), 1.0) for n, o in (('vinde', F), ('trommel', D))]
    ex = {'frame': 'kystfiske juksahjul: x out over the side, y up, z aft; vinde and trommel from the spool axle (turning about z)',
          'eye': list(to_game(EYE)), 'drumR': R_LINE, 'crank': [round(math.hypot(KNOB[0], KNOB[2]), 3), 0.0, round(-KNOB[1], 3)], 'rail': RAIL}
    glb = os.path.join(OUT, 'gear-vinde.glb'); n = write_glb(glb, parts, ex)
    open(os.path.join(ROOT, 'src', 'data', 'gear-vinde.b64'), 'w').write(base64.b64encode(open(glb, 'rb').read()).decode())
    print('juksahjul GLB %.1f KB, %s' % (n / 1024, ', '.join('%s %d' % (q[0], len(q[1]['idx']) // 3) for q in parts)))
    if 'fast' not in sys.argv:
        setup_render(1000, 800, samples=24); bpy.context.scene.world.node_tree.nodes.get('Background').inputs['Color'].default_value = (0.9, 0.9, 0.9, 1)
        for nm, loc, look, lens in (('3q', (0.55, -0.75, 0.25), (0.08, 0.15, -0.08), 40), ('side', (0.12, -1.0, -0.05), (0.12, 0, -0.05), 45)):
            camera(loc, look, lens=lens); render(os.path.join(OUT, 'vinde_%s.png' % nm))

if __name__ == '__main__':
    main()
