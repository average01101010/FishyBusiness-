"""The marks and the anchors of the gear, built in Blender (plan E2, 05.10.2026): the blåsestake that marks each end of a set of nets or
lines (an orange float on a pole with a lead weight under it, a black flag on top and a radar reflector), and the grapnel (dregg) that
holds the end down. In the game the blåse floats at both ends of every set (drawGearSea in view3d.js), and goes over the stern with the
grapnel when a set is started (drawGearOp).

Parts:
    blaase  the float with its pole, from the waterline at the pole (the float rides half under)
    dregg   the four-fluked grapnel, about 0.55 m long, from the ring at the top of its shank
    havstang_v, havstang_o   the ocean marker pole (bøyestang) for gear outside the baselines (havsteget H2d, 05.11.2026), as the
            høstingsforskriften § 68 wants it (FOR-2021-12-23-3910, read on Lovdata 05.11.2026): a pole at least 2 m over the water
            with a radar reflector and flags, two flags over each other at the west end (havstang_v) and one at the east end
            (havstang_o), and at night yellow lights, two at the west end and one at the east, seen 2 nm, 20-25 flashes a minute if
            they flash. On a large orange float with a ballast weight under it; from the waterline at the pole. The lamps' centres
            are in the extras (havlys), so the game can light them at night (22 flashes a minute, blink).

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
    C['lamp'] = mat('lamp', (1.0, 0.80, 0.12), 0.9, emit=2.0)      # the ocean pole's yellow lamp

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

def havstang(west):
    """the ocean marker pole (§ 68): its top 3.15 m over the water, the lamps at the top, the flags under them, the reflector lower"""
    parts = []
    parts.append(sphere('float', (0, 0, 0.08), 0.36, C['orange'], scale=(1, 1, 0.85), seg=20, rings=10))
    parts.append(cyl('collar', (0, 0, 0.33), (0, 0, 0.45), 0.07, C['orange'], seg=12))
    parts.append(torus('band', (0, 0, 0.08), (0, 0, 1), 0.36, 0.012, C['rope'], seg=24, rseg=4))
    parts.append(cyl('pole', (0, 0, -1.6), (0, 0, 3.15), 0.03, C['pole'], seg=10, r1=0.022))
    parts.append(cyl('lead', (0, 0, -1.7), (0, 0, -1.4), 0.08, C['lead'], seg=12))
    # the radar reflector: three plates crossing (an octahedral corner reflector), larger than the coast's
    for ax in range(3):
        bm = bmesh.new(); r = 0.18; cz = 1.35
        if ax == 0: pts = [(0, -r, cz), (0, 0, cz + r), (0, r, cz), (0, 0, cz - r)]
        elif ax == 1: pts = [(-r, 0, cz), (0, 0, cz + r), (r, 0, cz), (0, 0, cz - r)]
        else: pts = [(-r, 0, cz), (0, -r, cz), (r, 0, cz), (0, r, cz)]
        bm.faces.new([bm.verts.new(p) for p in pts]); o = obj_from_bm('refl', bm, [C['refl']]); solidify(o, 0.006); parts.append(o)
    # the flags: two over each other at the west end, one at the east
    for z0 in ((2.6, 2.15) if west else (2.6,)):
        bm = bmesh.new(); G = []
        for i in range(7):
            u = i / 6; row = []
            for j in range(3):
                v = j / 2; row.append(bm.verts.new((0.03 + 0.5 * u, 0.03 * math.sin(math.pi * 1.6 * u) * (0.4 + u), z0 - 0.36 * v)))
            G.append(row)
        for i in range(6):
            for j in range(2): bm.faces.new([G[i][j], G[i + 1][j], G[i + 1][j + 1], G[i][j + 1]])
        o = obj_from_bm('flag', bm, [C['flag']]); solidify(o, 0.008); parts.append(shade(o, 40))
    # the yellow lamps at the top: two over each other at the west end, one at the east (a black base, a yellow lens, a black cap)
    lamps = []
    for zc in ((3.0, 2.72) if west else (3.0,)):
        parts.append(cyl('lbase', (0, 0, zc - 0.07), (0, 0, zc - 0.05), 0.05, C['flag'], seg=12))
        parts.append(cyl('lens', (0, 0, zc - 0.05), (0, 0, zc + 0.05), 0.042, C['lamp'], seg=12))
        parts.append(cyl('lcap', (0, 0, zc + 0.05), (0, 0, zc + 0.08), 0.05, C['flag'], seg=12, r1=0.02))
        lamps.append(list(to_game((0, 0, zc))))
    parts.append(tube('rope', [(0, 0, -1.7), (0.03, 0.02, -2.1), (0.1, 0.06, -2.8)], 0.011, C['rope'], seg=5))
    for p in parts: apply_all(p)
    return join(parts, 'havstang_v' if west else 'havstang_o'), lamps

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
    B = blaase(); D = dregg(); HV, LV = havstang(True); HO, LO = havstang(False)
    parts = [('blaase', mesh_arrays(B, to_game, to_game_n, ao=False), 1.0), ('dregg', mesh_arrays(D, to_game, to_game_n, ao=False), 1.0),
             ('havstang_v', mesh_arrays(HV, to_game, to_game_n, ao=False), 1.0), ('havstang_o', mesh_arrays(HO, to_game, to_game_n, ao=False), 1.0)]
    ex = {'frame': 'kystfiske gear marks: x right, y up, z back; the blåse and the ocean poles from the waterline at the pole, the grapnel from its ring', 'flag': list(to_game((0.2, 0, 2.4))),
          'havlys': {'havstang_v': LV, 'havstang_o': LO}, 'blink': 22, 'havtop': 3.15}
    glb = os.path.join(OUT, 'gear-marks.glb'); n = write_glb(glb, parts, ex)
    open(os.path.join(ROOT, 'src', 'data', 'gear-marks.b64'), 'w').write(base64.b64encode(open(glb, 'rb').read()).decode())
    print('gear marks GLB %.1f KB, %s' % (n / 1024, ', '.join('%s %d' % (p[0], len(p[1]['idx']) // 3) for p in parts)))
    if 'fast' in sys.argv: return
    D.location = (0.9, 0, 0.6); HV.location = (-1.4, 0.6, 0); HO.location = (-2.6, 1.2, 0)
    setup_render(1000, 1000, samples=24)
    camera((3.2, -5.2, 2.4), (-0.9, 0, 1.3), lens=40); render(os.path.join(OUT, 'marks_3q.png'))

if __name__ == '__main__':
    main()
