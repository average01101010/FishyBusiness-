"""The rescue boat (plan E3, 05.10.2026): a generic 16.5 m all-weather rescue boat in international orange with a white wheelhouse, a
black fender collar along the sides, a mast with radar and blue lights, and a towing hook on the after deck. No organisation's marks or
colours scheme copied: it stands for whichever rescue boat comes (Redningsselskapet's boats are not drawn). It comes out from the nearest
harbour at 25 knots and tows the player's boat in at 6 knots (core/05-vessels.js, rescue and towStep).

Parts (each from the boat's middle at the waterline):
    hull    the whole boat but its blue lights
    blue    the two blue lights on the mast, flashing in the game

    pip install bpy==4.5.4
    python3 tools/boats/redning.py          -> src/data/boat-redning.b64, renders in tools/boats/out/
    python3 tools/boats/redning.py fast     -> without the renders

Frame here: x forward from the transom, y to port, z up from the keel at the transom; the waterline is z = WL. The game's frame: x to
starboard, y up, z aft; to_game(p) = (-y, z - WL, -(x - XM))."""
import os, sys, math, base64
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy, bmesh
from bpyutil import *

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE)); OUT = os.path.join(HERE, 'out')
L = 16.5; XM = L / 2; WL = 0.95; HB = 2.4

def to_game(p): return (-p[1], p[2] - WL, -(p[0] - XM))
def to_game_n(n): return (-n[1], n[2], -n[0])

C = {}
def colours():
    C['orange'] = mat('orange', (0.93, 0.36, 0.07), 0.55)
    C['white'] = mat('white', (0.93, 0.94, 0.95), 0.5)
    C['bottom'] = mat('bottom', (0.30, 0.09, 0.07), 0.3)
    C['boot'] = mat('boot', (0.06, 0.06, 0.07), 0.5)
    C['fender'] = mat('fender', (0.07, 0.07, 0.08), 0.25)
    C['deck'] = mat('deck', (0.42, 0.44, 0.46), 0.2)
    C['glass'] = mat('glass', (0.06, 0.10, 0.14), 0.95)
    C['steel'] = mat('steel', (0.70, 0.72, 0.74), 0.7, metal=0.6)
    C['dark'] = mat('dark', (0.16, 0.17, 0.19), 0.4)
    C['blue'] = mat('blue', (0.15, 0.35, 1.0), 0.8, emit=2.0)
    C['lamp'] = mat('lamp', (0.95, 0.95, 0.85), 0.9)

# ---------- the lines: half-beams at the gunwale and the chine, the keel, the chine's height and the sheer ----------
def hb(x): return HB * math.sqrt(max(0.0, 1 - (max(0.0, x - 9.5) / (L - 9.5)) ** 2))
def hc(x): return 2.1 * math.sqrt(max(0.0, 1 - (max(0.0, x - 8.0) / 7.6) ** 2))
def zk(x): return 2.3 * (max(0.0, x - 10.5) / (L - 10.5)) ** 2
def zs(x): return 2.65 + 0.7 * (x / L) ** 2.2
def zc(x):
    dr = math.radians(18 + 24 * max(0.0, (x - 5.0) / (L - 5.0)) ** 1.4)
    return min(zs(x) - 0.05, zk(x) + hc(x) * math.tan(dr))
ZD = lambda x: zs(x) - 0.55          # the deck inside the bulwark

def section(x):
    """the port half from the gunwale down to the keel"""
    b, c, k, s, ch = hb(x), hc(x), zk(x), zs(x), zc(x)
    pts = [(b, s)]
    for u in (0.25, 0.5, 0.75):
        z = s + (ch + 0.05 - s) * u; pts.append((c + (b - c) * (1 - u) ** 0.7 + 0.06 * u, z))
    pts.append((c + 0.06, ch + 0.03)); pts.append((c, ch))
    for u in (0.33, 0.66):
        pts.append((c * (1 - u), ch + (k - ch) * u - 0.04 * math.sin(math.pi * u)))
    pts.append((0.0, k))
    return pts

def hull():
    XS = [0.0, 0.6, 1.5, 2.5, 3.5, 4.5, 5.5, 6.5, 7.5, 8.5, 9.5, 10.3, 11.1, 11.9, 12.6, 13.3, 14.0, 14.6, 15.1, 15.55, 15.9, 16.2, L]
    G = []
    for x in XS:
        h = section(x); ring = [(x, y, z) for (y, z) in h] + [(x, -y, z) for (y, z) in reversed(h[:-1])]
        G.append(ring)
    def matf(i, j):
        z = 0.25 * (G[i][j][2] + G[i + 1][j][2] + G[i][(j + 1) % len(G[i])][2] + G[i + 1][(j + 1) % len(G[i])][2])
        return C['bottom'] if z < WL else (C['boot'] if z < WL + 0.28 else C['orange'])
    o = grid('hull', G, matf, angle=40, out=lambda c: (0.0, c.y, (c.z - 1.2) * 0.5))
    parts = [o]
    # the transom: a flat plate across the stern
    bm = bmesh.new(); vs = [bm.verts.new(p) for p in G[0]]; f = bm.faces.new(list(reversed(vs)))
    parts.append(orient(obj_from_bm('transom', bm, [C['orange']]), lambda c: (-1, 0, 0)))
    # the deck, the inside of the bulwark and the cap rail
    XD = [x for x in XS if x < 16.0]
    D = [[(x, hb(x) - 0.12, ZD(x)), (x, 0.0, ZD(x) + 0.04), (x, -(hb(x) - 0.12), ZD(x))] for x in XD]
    parts.append(grid('deck', D, lambda i, j: C['deck'], angle=30, out=lambda c: (0, 0, 1)))
    for sd in (1, -1):
        W = [[(x, sd * (hb(x) - 0.12), ZD(x)), (x, sd * (hb(x) - 0.12), zs(x) - 0.04), (x, sd * hb(x), zs(x))] for x in XD]
        parts.append(grid('bulwark', W, lambda i, j: C['white'] if j == 0 else C['orange'], angle=40, out=lambda c, sd=sd: (0, -sd * 0.3 if c.z < zs(c.x) - 0.06 else 0, 1 if c.z >= zs(c.x) - 0.06 else 0)))
        # the fender collar along the side
        pts = [(x, sd * (hb(x) + 0.12), zs(x) - 0.42) for x in (0.25, 1.5, 3.0, 4.5, 6.0, 7.5, 9.0, 10.5, 11.8, 12.9, 13.8, 14.5)]
        parts.append(tube('fender', pts, 0.2, C['fender'], seg=8))
    return parts

def ring_plan(x0, x1, hw, z, r=0.35, rake=0.0):
    """a rounded rectangle in plan at height z: from x0 (aft) to x1 (forward), half-width hw"""
    pts = []; x1 = x1 - rake
    for (cx, cy, a0) in ((x1 - r, hw - r, 0), (x0 + r, hw - r, 90), (x0 + r, -hw + r, 180), (x1 - r, -hw + r, 270)):
        for k in range(4):
            a = math.radians(a0 + 90 * k / 3); pts.append((cx + r * math.cos(a), cy + r * math.sin(a), z))
    return pts

def wheelhouse():
    parts = []; z0 = ZD(8.5)
    X0, X1 = 5.6, 11.6
    bands = [(z0, z0 + 1.15, 1.95, 0.0, C['white']), (z0 + 1.15, z0 + 1.95, 1.9, 0.35, C['glass']), (z0 + 1.95, z0 + 2.2, 1.78, 0.55, C['white'])]
    rk = lambda z: 0.55 * (z - z0 - 1.15) / 1.05 if z > z0 + 1.15 else 0.0       # the windscreen leans back
    for (za, zb, hw, _, m) in bands:
        hwa = 1.95 - 0.08 * (za - z0); hwb = 1.95 - 0.08 * (zb - z0)
        parts.append(loft_rings('wh', [ring_plan(X0, X1, hwa, za, rake=rk(za)), ring_plan(X0, X1, hwb, zb, rake=rk(zb))], m, cap0=False, cap1=(m is C['white'] and zb > z0 + 2.0), angle=40))
    zr = z0 + 2.2
    # the mast on the roof: two legs, a cross-tree with the radar and the blue lights, a whip aerial
    for sd in (1, -1):
        parts.append(cyl('leg', (8.0, sd * 1.4, zr), (8.6, sd * 0.9, zr + 1.5), 0.07, C['white'], seg=8))
        parts.append(cyl('aerial', (8.2, sd * 0.6, zr + 1.5), (8.2, sd * 0.6, zr + 3.4), 0.02, C['dark'], seg=4, r1=0.01))
    parts.append(cyl('tree', (8.6, -1.0, zr + 1.5), (8.6, 1.0, zr + 1.5), 0.08, C['white'], seg=8))
    parts.append(cyl('radar', (8.6, 0.0, zr + 1.58), (8.6, 0.0, zr + 1.62), 0.1, C['dark'], seg=8))
    parts.append(box('radar_ant', 8.45, 8.75, -0.9, 0.9, zr + 1.66, zr + 1.82, C['white'], bevel=0.04))
    parts.append(cyl('search', (10.4, 0.0, zr + 0.05), (10.4, 0.0, zr + 0.4), 0.12, C['dark'], seg=8))
    parts.append(cyl('searchL', (10.4, 0.0, zr + 0.45), (10.75, 0.0, zr + 0.45), 0.16, C['lamp'], seg=10))
    # the after deck: the towing hook on its post, a bollard at the stern, a liferaft canister on the wheelhouse's back
    zd = ZD(2.0)
    parts.append(cyl('post', (3.2, 0.0, zd), (3.2, 0.0, zd + 1.0), 0.12, C['steel'], seg=10))
    parts.append(box('hook', 3.0, 3.4, -0.12, 0.12, zd + 0.95, zd + 1.15, C['steel'], bevel=0.03))
    parts.append(cyl('bollard', (0.9, 0.0, zd), (0.9, 0.0, zd + 0.45), 0.13, C['steel'], seg=10))
    parts.append(cyl('raft', (5.35, -1.1, z0 + 1.6), (5.35, 1.1, z0 + 1.6), 0.28, C['white'], seg=12))
    # a hatch and a pair of bitts on the foredeck
    parts.append(box('hatch', 12.4, 13.2, -0.5, 0.5, ZD(12.8), ZD(12.8) + 0.12, C['white'], bevel=0.04))
    for sd in (1, -1): parts.append(cyl('bitt', (14.0, sd * 0.3, ZD(14.0)), (14.0, sd * 0.3, ZD(14.0) + 0.35), 0.08, C['steel'], seg=8))
    return parts

def blue_lights():
    zr = ZD(8.5) + 2.2
    return [cyl('blue', (8.6, sd * 0.95, zr + 1.58), (8.6, sd * 0.95, zr + 1.85), 0.08, C['blue'], seg=8) for sd in (1, -1)]

def main():
    os.makedirs(OUT, exist_ok=True)
    reset(); colours()
    H = join([apply_all(p) for p in hull() + wheelhouse()], 'hull'); B = join([apply_all(p) for p in blue_lights()], 'blue')
    parts = [('hull', mesh_arrays(H, to_game, to_game_n, ao=False), 1.0), ('blue', mesh_arrays(B, to_game, to_game_n, ao=False), 1.0)]
    ex = {'frame': 'kystfiske rescue boat: x starboard, y up from the waterline, z aft, from midships', 'len': L, 'beam': 2 * HB,
          'tow': list(to_game((3.3, 0.0, ZD(2.0) + 1.05))), 'bow': list(to_game((L, 0.0, zs(L)))), 'stern': list(to_game((0.0, 0.0, zs(0.0)))),
          # the lights for the night: the blue lights, the masthead light, the sidelights on the wheelhouse's front corners (red to port) and the stern light
          'lights': [list(to_game((8.6, sd * 0.95, ZD(8.5) + 2.2 + 1.72))) + ['b'] for sd in (1, -1)] + [list(to_game((8.2, 0.6, ZD(8.5) + 2.2 + 3.4))) + ['w'],
                     list(to_game((11.0, 1.9, ZD(8.5) + 1.0))) + ['r'], list(to_game((11.0, -1.9, ZD(8.5) + 1.0))) + ['g'], list(to_game((0.2, 0.0, zs(0.0) + 0.3))) + ['w']]}
    glb = os.path.join(OUT, 'redning.glb'); n = write_glb(glb, parts, ex)
    open(os.path.join(ROOT, 'src', 'data', 'boat-redning.b64'), 'w').write(base64.b64encode(open(glb, 'rb').read()).decode())
    print('rescue boat GLB %.1f KB, %s' % (n / 1024, ', '.join('%s %d' % (p[0], len(p[1]['idx']) // 3) for p in parts)))
    if 'fast' in sys.argv: return
    setup_render(1600, 900, samples=24)
    for nm, loc, look, lens in (('3q', (24.0, -18.0, 9.0), (8.0, 0.0, 2.2), 40), ('side', (8.25, -40.0, 2.5), (8.25, 0.0, 2.5), 50), ('aft', (-14.0, 9.0, 8.0), (6.0, 0.0, 2.5), 40)):
        camera(loc, look, lens=lens); render(os.path.join(OUT, 'redning_%s.png' % nm))

if __name__ == '__main__':
    main()
