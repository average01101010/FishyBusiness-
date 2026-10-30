"""The marks and the anchors of the gear, built in Blender (plan E2, 05.10.2026): the blåsestake that marks each end of a set of nets or
lines (an orange float on a pole with a lead weight under it, a black flag on top and a radar reflector), and the grapnel (dregg) that
holds the end down. In the game the blåse floats at both ends of every set (drawGearSea in view3d.js), and goes over the stern with the
grapnel when a set is started (drawGearOp).

Parts:
    blaase  the float with its pole, from the waterline at the pole (the float rides half under)
    dregg   the four-fluked grapnel, about 0.55 m long, from the ring at the top of its shank

    pip install bpy==4.5.4
    python3 tools/gear/blaase.py          -> src/data/gear-marks.b64, renders in tools/gear/out/
    python3 tools/gear/blaase.py fast     -> without the renders

Frames (the game's: x to the right, y up, z backwards). Here in Blender: x to the right, y forward, z up; to_game(p) = (x, z, -y)."""
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
    C['orange'] = mat('orange', (0.96, 0.40, 0.08), 0.55)
    C['pole'] = mat('pole', (0.80, 0.70, 0.45), 0.3)              # a bamboo-coloured glass-fibre pole
    C['flag'] = mat('flag', (0.06, 0.06, 0.07), 0.15)
    C['refl'] = mat('refl', (0.78, 0.80, 0.82), 0.8, metal=0.7)
    C['lead'] = mat('lead', (0.30, 0.31, 0.33), 0.4)
    C['rope'] = mat('rope', (0.85, 0.70, 0.22), 0.2)
    C['galv'] = mat('galv', (0.60, 0.62, 0.64), 0.6, metal=0.5)

def blaase():
    parts = []
    # the float: an oval with a collar round the pole
    parts.append(sphere('float', (0, 0, 0.05), 0.22, C['orange'], scale=(1, 1, 0.82), seg=16, rings=8))
    parts.append(cyl('collar', (0, 0, 0.2), (0, 0, 0.27), 0.045, C['orange'], seg=10))
    # the pole through it, the lead weight under it
    parts.append(cyl('pole', (0, 0, -1.0), (0, 0, 2.6), 0.022, C['pole'], seg=8, r1=0.016))
    parts.append(cyl('lead', (0, 0, -1.05), (0, 0, -0.85), 0.055, C['lead'], seg=10))
    # the radar reflector: three plates crossing (an octahedral corner reflector)
    for ax in range(3):
        bm = bmesh.new(); r = 0.13; cz = 1.75
        if ax == 0: pts = [(0, -r, cz), (0, 0, cz + r), (0, r, cz), (0, 0, cz - r)]
        elif ax == 1: pts = [(-r, 0, cz), (0, 0, cz + r), (r, 0, cz), (0, 0, cz - r)]
        else: pts = [(-r, 0, cz), (0, -r, cz), (r, 0, cz), (0, r, cz)]
        bm.faces.new([bm.verts.new(p) for p in pts]); o = obj_from_bm('refl', bm, [C['refl']]); solidify(o, 0.006); parts.append(o)
    # the flag on top, a little wave in it
    bm = bmesh.new(); G = []
    for i in range(6):
        u = i / 5; row = []
        for j in range(3):
            v = j / 2; row.append(bm.verts.new((0.02 + 0.42 * u, 0.025 * math.sin(math.pi * 1.6 * u) * (0.4 + u), 2.55 - 0.3 * v)))
        G.append(row)
    for i in range(5):
        for j in range(2): bm.faces.new([G[i][j], G[i + 1][j], G[i + 1][j + 1], G[i][j + 1]])
    o = obj_from_bm('flag', bm, [C['flag']]); solidify(o, 0.008); parts.append(shade(o, 40))
    # the buoy rope going down from the weight
    parts.append(tube('rope', [(0, 0, -1.05), (0.03, 0.02, -1.4), (0.08, 0.05, -2.0)], 0.009, C['rope'], seg=5))
    for p in parts: apply_all(p)
    return join(parts, 'blaase')

def dregg():
    parts = []
    parts.append(cyl('shank', (0, 0, 0.0), (0, 0, -0.5), 0.02, C['galv'], seg=8))
    parts.append(torus('ring', (0, 0, 0.03), (0, 1, 0), 0.045, 0.01, C['galv'], seg=12, rseg=5))
    for k in range(4):
        a = k * math.pi / 2; c, s = math.cos(a), math.sin(a)
        pts = [(0, 0, -0.5)] + [(c * 0.22 * math.sin(u * 1.4), s * 0.22 * math.sin(u * 1.4), -0.5 + 0.2 * (1 - math.cos(u * 1.6))) for u in (0.25, 0.5, 0.75, 1.0)]
        parts.append(tube('fluke', pts, 0.016, C['galv'], seg=6))
        tip = pts[-1]; parts.append(sphere('palm', tip, 0.03, C['galv'], scale=(1.2, 1.2, 0.5), seg=8, rings=4))
    for p in parts: apply_all(p)
    return join(parts, 'dregg')

def main():
    os.makedirs(OUT, exist_ok=True)
    reset(); colours()
    B = blaase(); D = dregg()
    parts = [('blaase', mesh_arrays(B, to_game, to_game_n, ao=False), 1.0), ('dregg', mesh_arrays(D, to_game, to_game_n, ao=False), 1.0)]
    ex = {'frame': 'kystfiske gear marks: x right, y up, z back; the blåse from the waterline at its pole, the grapnel from its ring', 'flag': list(to_game((0.2, 0, 2.4)))}
    glb = os.path.join(OUT, 'gear-marks.glb'); n = write_glb(glb, parts, ex)
    open(os.path.join(ROOT, 'src', 'data', 'gear-marks.b64'), 'w').write(base64.b64encode(open(glb, 'rb').read()).decode())
    print('gear marks GLB %.1f KB, %s' % (n / 1024, ', '.join('%s %d' % (p[0], len(p[1]['idx']) // 3) for p in parts)))
    if 'fast' in sys.argv: return
    D.location = (0.9, 0, 0.6)
    setup_render(1000, 1000, samples=24)
    camera((3.2, -3.4, 1.6), (0.4, 0, 0.8), lens=45); render(os.path.join(OUT, 'marks_3q.png'))

if __name__ == '__main__':
    main()
