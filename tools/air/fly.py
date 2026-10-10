"""The aircraft over the coast, built in Blender (plan E4, 05.10.2026): a generic regional turboprop (high wing, T-tail, two engines with
four-bladed propellers; about the size of the Dash 8-100/200 that flies the short runways of Northern Norway: 22.3 m long, 25.9 m
across the wings) and a generic medium twin-engined helicopter (13.8 m main rotor, five blades). White with a blue cheat line, and white
with a red band; no airline's or operator's marks. They fly between the coast's airports and bases (core/05b-air.js) and are drawn
within about 15 km (view3d.js drawAir), with their lights at night.

Parts (each from its own middle or hub):
    plane    the turboprop without its propellers, from the middle of the wing root
    prop     one propeller (four blades and the spinner), from its hub; spins about the game's z
    heli     the helicopter without its rotors, from below the main rotor at the cabin floor
    rotor    the main rotor (five blades and the head), from its hub; spins about the game's y
    trotor   the tail rotor, from its hub; spins about the game's x

    pip install bpy==4.5.4
    python3 tools/air/fly.py          -> src/data/air.b64, renders in tools/air/out/
    python3 tools/air/fly.py fast     -> without the renders

Frames (the game's: x to the right, y up, z backwards, so the aircraft faces -z). Here in Blender: x to the right, y forward, z up;
to_game(p) = (x, z, -y)."""
import os, sys, math, base64
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))
sys.path.insert(0, os.path.join(ROOT, 'tools', 'boats'))
import bpy, bmesh
from bpyutil import *

OUT = os.path.join(HERE, 'out')
def to_game(p): return (p[0], p[2], -p[1])
def to_game_n(n): return (n[0], n[2], -n[1])
def rel(o):
    g = to_game(o)
    return lambda p: tuple(a - b for a, b in zip(to_game(p), g))

C = {}
def colours():
    C['white'] = mat('white', (0.94, 0.95, 0.96), 0.6)
    C['belly'] = mat('belly', (0.62, 0.65, 0.69), 0.5)
    C['blue'] = mat('blue', (0.10, 0.25, 0.55), 0.6)
    C['red'] = mat('red', (0.78, 0.10, 0.08), 0.6)
    C['glass'] = mat('glass', (0.06, 0.09, 0.13), 0.95)
    C['dark'] = mat('dark', (0.14, 0.15, 0.17), 0.4)
    C['metal'] = mat('metal', (0.66, 0.68, 0.70), 0.7, metal=0.6)
    C['black'] = mat('black', (0.05, 0.05, 0.06), 0.4)
    C['tip'] = mat('tip', (0.95, 0.85, 0.15), 0.5)

def fuselage(name, stations, seg, matf):
    """stations: (y, radius_x, radius_z, zc) from the nose aft; matf(i, j, y, z) the material of a cell"""
    G = []
    for (y, rx, rz, zc) in stations:
        G.append([(rx * math.sin(2 * math.pi * j / seg), y, zc + rz * math.cos(2 * math.pi * j / seg)) for j in range(seg)])
    return grid(name, G, lambda i, j: matf(i, j, 0.5 * (stations[i][0] + stations[i + 1][0]), math.cos(2 * math.pi * (j + 0.5) / seg)), closed_v=True, angle=40,
                out=lambda c: (c.x, 0.0, c.z - 0.3))

def airfoil(x, y0, chord, th, z, dihedral=0.0, twist=0.0):
    """a ring round an airfoil section at span position x: leading edge at y0, from y0 back by chord"""
    pts = []
    for k in range(10):
        a = 2 * math.pi * k / 10; u = 0.5 - 0.5 * math.cos(a); s = math.sin(a)
        yy = y0 - chord * u; t = th * chord * (1.0 if s > 0 else 0.55) * 4 * u * (1 - u) ** 1.1 + 0.002
        pts.append((x, yy, z + x * dihedral + math.copysign(t, s) * 0.5))
    return pts

def wing(name, sections, m):
    rings = [airfoil(*s) for s in sections]
    return loft_rings(name, rings, m, angle=35)

# ---------- the turboprop ----------
def plane():
    parts = []
    ST = [(11.1, 0.02, 0.02, 0.15), (10.8, 0.45, 0.5, 0.05), (10.2, 0.85, 0.9, 0.05), (9.4, 1.15, 1.2, 0.05), (8.4, 1.32, 1.36, 0.02), (7.0, 1.38, 1.4, 0.0)]
    ST += [(y, 1.38, 1.4, 0.0) for y in (5.6, 4.6, 3.6, 2.6, 1.6, 0.6, -0.4, -1.4, -2.4, -3.4, -4.4)]
    ST += [(-5.6, 1.3, 1.32, 0.12), (-7.0, 1.05, 1.1, 0.42), (-8.4, 0.75, 0.8, 0.75), (-9.8, 0.42, 0.48, 1.05), (-11.1, 0.08, 0.12, 1.3)]
    def mf(i, j, y, cz):
        if 9.4 < y < 10.6 and 0.2 < cz < 0.75: return C['glass']                     # the cockpit windows
        if -4.6 < y < 6.6 and 0.12 < cz < 0.42: return C['glass'] if (i % 2 == 0) else C['white']   # the cabin windows, every other bay
        if -9.5 < y < 10.0 and -0.05 < cz < 0.08: return C['blue']                    # the cheat line
        return C['belly'] if cz < -0.45 else C['white']
    parts.append(fuselage('fus', ST, 20, mf))
    # the high wing: a centre section over the fuselage, tapering out to the tips
    for sd in (1, -1):
        parts.append(wing('wing', [(sd * 0.0, 1.9, 2.7, 0.14, 1.45, 0.0), (sd * 4.0, 1.8, 2.5, 0.14, 1.45, 0.012), (sd * 12.95, 1.0, 1.55, 0.12, 1.45, 0.012)], C['white']))
        # the engine nacelle under the wing, the spinner in front
        nx = sd * 4.0
        NS = [(4.6, 0.05, 0.05, 1.0), (4.4, 0.35, 0.4, 1.0), (3.8, 0.55, 0.65, 0.95), (2.0, 0.6, 0.75, 0.9), (0.0, 0.5, 0.7, 0.95), (-2.2, 0.32, 0.45, 1.15), (-3.0, 0.08, 0.1, 1.3)]
        G = [[(nx + rx * math.sin(2 * math.pi * j / 12), y, zc + rz * math.cos(2 * math.pi * j / 12)) for j in range(12)] for (y, rx, rz, zc) in NS]
        parts.append(grid('nacelle', G, lambda i, j: C['white'] if i > 0 else C['dark'], closed_v=True, angle=40, out=lambda c, nx=nx: (c.x - nx, 0, c.z - 1.0)))
    # the tail: the swept fin and the T-tail on top of it
    parts.append(loft_rings('fin', [[(x * 0.5, y, z) for (x, y) in ((0, -6.8), (0.18, -7.6), (0.14, -9.0), (0, -9.6), (-0.14, -9.0), (-0.18, -7.6))] for z in (1.6,)] +
                            [[(x * 0.5, y - 2.0, 5.6) for (x, y) in ((0, -7.4), (0.14, -8.0), (0.1, -9.0), (0, -9.4), (-0.1, -9.0), (-0.14, -8.0))]], C['white'], angle=35))
    for sd in (1, -1): parts.append(wing('stab', [(sd * 0.0, -9.2, 1.7, 0.1, 5.5, 0.0), (sd * 4.0, -9.9, 1.1, 0.1, 5.5, 0.02)], C['white']))
    parts.append(box('fintip', -0.12, 0.12, -11.6, -9.4, 5.45, 5.75, C['blue']))
    for p in parts: apply_all(p)
    return join(parts, 'plane')

def prop(name):
    parts = [sphere('spinner', (0, 0.25, 0), 0.32, C['dark'], scale=(1, 1.4, 1), seg=12, rings=6)]
    for k in range(4):
        a = k * math.pi / 2 + math.pi / 4
        bm = bmesh.new(); vs = []
        for (r, c, tw) in ((0.25, 0.22, 0.6), (1.0, 0.26, 0.35), (1.9, 0.14, 0.12), (2.0, 0.08, 0.1)):
            x, z = r * math.cos(a), r * math.sin(a); tx, tz = -math.sin(a), math.cos(a)
            vs.append((bm.verts.new((x + tx * c * 0.5 * math.cos(tw), 0.05 + c * 0.5 * math.sin(tw), z + tz * c * 0.5 * math.cos(tw))),
                       bm.verts.new((x - tx * c * 0.5 * math.cos(tw), 0.05 - c * 0.5 * math.sin(tw), z - tz * c * 0.5 * math.cos(tw)))))
        for i in range(3): bm.faces.new([vs[i][0], vs[i + 1][0], vs[i + 1][1], vs[i][1]])
        o = obj_from_bm('blade', bm, [C['black']]); solidify(o, 0.03); parts.append(o)
    for p in parts: apply_all(p)
    return join(parts, name)

# ---------- the helicopter ----------
def heli():
    parts = []
    ST = [(3.0, 0.05, 0.05, 0.75), (2.85, 0.55, 0.55, 0.8), (2.4, 0.95, 0.85, 0.85), (1.6, 1.15, 1.0, 0.95), (0.6, 1.2, 1.05, 1.0), (-0.8, 1.2, 1.05, 1.0), (-2.0, 1.0, 0.95, 1.05),
          (-3.0, 0.55, 0.6, 1.35), (-4.4, 0.32, 0.38, 1.55), (-6.4, 0.24, 0.28, 1.6), (-8.2, 0.18, 0.22, 1.65), (-8.8, 0.04, 0.05, 1.7)]
    def mf(i, j, y, cz):
        if 1.2 < y < 2.9 and cz > -0.1: return C['glass']
        if -1.2 < y < 0.8 and 0.15 < cz < 0.6: return C['glass']
        if -0.2 < cz < 0.1 and y > -8.0: return C['red']
        return C['white']
    parts.append(fuselage('hfus', ST, 18, mf))
    parts.append(sphere('engines', (0, -0.6, 2.05), 0.75, C['white'], scale=(1.0, 2.2, 0.45), seg=14, rings=6))
    parts.append(cyl('mast', (0, 0.0, 2.2), (0, 0.0, 2.65), 0.16, C['metal'], seg=10))
    # the fin with the tail rotor's gearbox, the small tailplane
    parts.append(loft_rings('hfin', [[(x, y, 1.6) for (x, y) in ((0.0, -7.6), (0.1, -8.2), (0.0, -8.8), (-0.1, -8.2))], [(x, y - 0.6, 3.2) for (x, y) in ((0.0, -8.0), (0.08, -8.4), (0.0, -8.8), (-0.08, -8.4))]], C['red'], angle=35))
    for sd in (1, -1): parts.append(box('htail', min(0, sd * 1.4), max(0, sd * 1.4), -7.4, -6.9, 1.55, 1.62, C['white']))
    # skids
    for sd in (1, -1):
        parts.append(tube('skid', [(sd * 1.15, 2.2, -0.05), (sd * 1.2, 1.8, -0.15), (sd * 1.2, -2.0, -0.15)], 0.05, C['dark'], seg=6))
        for y in (1.2, -1.2): parts.append(cyl('strut', (sd * 0.9, y, 0.15), (sd * 1.2, y, -0.12), 0.04, C['dark'], seg=6))
    for p in parts: apply_all(p)
    return join(parts, 'heli')

def rotor(name, R, nb, chord, root, tips=True):
    parts = [cyl('hub', (0, 0, -0.08), (0, 0, 0.12), 0.22 if R > 3 else 0.08, C['metal'], seg=10)]
    for k in range(nb):
        a = 2 * math.pi * k / nb; c, s = math.cos(a), math.sin(a)
        bm = bmesh.new(); vs = []
        for r in (root, R * 0.9, R):
            x, y = r * c, r * s; tx, ty = -s, c
            vs.append((bm.verts.new((x + tx * chord * 0.5, y + ty * chord * 0.5, -0.02 * r / R)), bm.verts.new((x - tx * chord * 0.5, y - ty * chord * 0.5, -0.02 * r / R))))
        f1 = bm.faces.new([vs[0][0], vs[1][0], vs[1][1], vs[0][1]]); f1.material_index = 0
        f2 = bm.faces.new([vs[1][0], vs[2][0], vs[2][1], vs[1][1]]); f2.material_index = 1 if tips else 0
        o = obj_from_bm('blade', bm, [C['dark'], C['tip']]); solidify(o, 0.04); parts.append(o)
    for p in parts: apply_all(p)
    return join(parts, name)

def main():
    os.makedirs(OUT, exist_ok=True)
    reset(); colours()
    P = plane(); PR = prop('prop'); H = heli(); RO = rotor('rotor', 6.9, 5, 0.55, 0.3); TR = rotor('trotor', 1.35, 4, 0.2, 0.1, tips=False)
    # the tail rotor turns in the fin's plane: about the x axis, on the left of the fin
    TR.rotation_euler = (0, math.pi / 2, 0); apply_all(TR)
    HUBP = [(sd * 4.0, 4.65, 1.0) for sd in (1, -1)]; HUBR = (0, 0, 2.75); HUBT = (-0.32, -9.0, 2.75)
    parts = [('plane', mesh_arrays(P, to_game, to_game_n, ao=False), 1.0), ('prop', mesh_arrays(PR, to_game, to_game_n, ao=False), 1.0),
             ('heli', mesh_arrays(H, to_game, to_game_n, ao=False), 1.0), ('rotor', mesh_arrays(RO, to_game, to_game_n, ao=False), 1.0), ('trotor', mesh_arrays(TR, to_game, to_game_n, ao=False), 1.0)]
    ex = {'frame': 'kystfiske aircraft: x right, y up, z back (they face -z); the plane from its wing root, the helicopter from its cabin floor under the rotor',
          'props': [list(to_game(h)) for h in HUBP], 'rotor': list(to_game(HUBR)), 'trotor': list(to_game(HUBT)),
          # the lights: red to port and green to starboard on the wing tips (white strobes there too), white on the tail, red beacons
          'planeLights': [list(to_game((-12.95, 1.0, 1.3))) + ['r'], list(to_game((12.95, 1.0, 1.3))) + ['g'], list(to_game((0, -11.4, 5.8))) + ['w'],
                          list(to_game((0, 0.0, 1.45 + 0.35))) + ['B'], list(to_game((0, 0.0, -1.42))) + ['B'], list(to_game((-12.95, 0.8, 1.3))) + ['S'], list(to_game((12.95, 0.8, 1.3))) + ['S']],
          'heliLights': [list(to_game((-1.25, -0.2, 0.9))) + ['r'], list(to_game((1.25, -0.2, 0.9))) + ['g'], list(to_game((0, -8.8, 1.7))) + ['w'], list(to_game((0, -2.0, 2.4))) + ['B'], list(to_game((0, 0.5, -0.05))) + ['B']]}
    glb = os.path.join(OUT, 'air.glb'); n = write_glb(glb, parts, ex)
    open(os.path.join(ROOT, 'src', 'data', 'air.b64'), 'w').write(base64.b64encode(open(glb, 'rb').read()).decode())
    print('air GLB %.1f KB, %s' % (n / 1024, ', '.join('%s %d' % (p[0], len(p[1]['idx']) // 3) for p in parts)))
    if 'fast' in sys.argv: return
    # renders: the plane with its propellers on, the helicopter with its rotors, side by side
    for (sd, h) in zip((1, -1), HUBP):
        c = PR.copy(); c.data = PR.data.copy(); link(c); c.location = h
    PR.hide_render = True
    for o in (H, RO, TR): o.location.x += 22.0
    RO.location = (22.0 + HUBR[0], HUBR[1], HUBR[2]); TR.location = (22.0 + HUBT[0], HUBT[1], HUBT[2])
    setup_render(1600, 900, samples=24)
    camera((30.0, 38.0, 14.0), (11.0, 0.0, 1.5), lens=40); render(os.path.join(OUT, 'air_3q.png'))
    camera((11.0, 0.0, 60.0), (11.0, 0.0, 0.0), ortho=40); render(os.path.join(OUT, 'air_top.png'))

if __name__ == '__main__':
    main()
