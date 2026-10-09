"""The pub in the bygd, seen from a stool at the bar (Jonas 08.10.2026: «Spilleren trykker på pub og blir dermed sendt inn i puben hvor man
sitter ved bardisken i first-person-view. Man skal kunne spinne hjulet som tidligere»). One room, the same in every bygd; the game
writes the place's name on the board over the bar.

What it is: an old harbour pub in timber. A plank floor, dark panelling to the chair rail and green-grey boards above it, a board
ceiling under dark beams; the bar along the back with its brass foot rail, the taps, the back bar with bottles and a mirror; the
bartender behind it and two regulars on the stools. The wheel of fortune hangs on the back wall right of the bar (its own part: the
game turns it). A stone fireplace on the left wall, a chalkboard for the quiz beside it, the notice board on the right wall, three
tables (the crew looking for a berth, the fiskarlag's long table with its pennant, two men at cards), windows to the harbour at dusk,
glass floats, a lifebuoy and old photographs.

The light is baked into the vertices with Cycles (pendant lamps over the bar, sconces, the fire, the dusk through the windows), so the
game draws the colours as they are. A second bake holds what the fire alone gives, so the game can let it flicker.

    pip install bpy==4.5.4
    python3 tools/harbour/pub.py          -> src/data/pub.b64, renders in tools/harbour/out/
    python3 tools/harbour/pub.py fast     -> without the renders
    python3 tools/harbour/pub.py look     -> only the renders (no bake, no export)

Frame here: x to the right along the bar, y into the room towards the bar, z up from the floor; the player's eye at EYE looks along +y.
In the game: x right, y up, z = -y (the eye looks along -z)."""
import os, sys, math, random
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))
sys.path.insert(0, os.path.join(ROOT, 'tools', 'boats')); sys.path.insert(0, HERE)
import bpy, bmesh, mathutils
from bpyutil import *
import arbeider as WK

OUT = os.path.join(HERE, 'out')
X0, X1, Y0, Y1, H = -6.0, 6.0, 0.0, 8.0, 2.9      # the room
BX0, BX1, BF, BB, BT = -3.6, 2.6, 5.95, 6.6, 1.08  # the bar: x0, x1, its front, its back, its top
EYE = (0.0, 5.32, 1.50)                           # on the stool at the middle of the bar
WC, WR = (3.85, 7.90, 1.62), 0.6                  # the wheel's middle (in front of the back wall) and radius
# the wheel's segments, as PUB_WHEEL in src/js/core/03-simulation.js (pubtest.py checks they agree)
WHEEL = [('tom', 20), ('haill', 6), ('tom', 20), ('rykte', 25), ('haill', 6), ('tom', 20), ('luksus', 3)]
WCOL = {'tom': (0.34, 0.39, 0.43), 'rykte': (0.69, 0.47, 0.17), 'haill': (0.25, 0.64, 0.30), 'luksus': (0.83, 0.69, 0.22)}
WLAB = {'rykte': 'RYKTE', 'haill': 'HAILL'}
BOARD = (5.97, 3.35, 4.65, 1.05, 1.85)            # the notice board on the right wall: x, y0, y1, z0, z1
CHALK = (-5.97, 6.15, 7.25, 1.1, 1.85)            # the quiz chalkboard on the left wall
FIRE = (-6.0, 3.3, 5.1)                           # the fireplace on the left wall: x, y0, y1
T_CREW, T_LAG, T_CARD = (-3.3, 2.5), (0.7, 1.7), (3.7, 2.9)
SIGN = (-1.6, 0.8, 7.97, 2.38, 2.72)              # the name board over the back bar: x0, x1, y, z0, z1
WIN_F = [(-5.0, -3.75), (-2.25, -1.0), (0.5, 1.75)]; DOOR = (3.5, 4.5); WZ = (1.0, 2.25)
WIN_R = [(1.25, 2.5)]; WIN_L = [(0.75, 2.0)]
C = {}
rr = random.Random(7)


def colours():
    WK.colours()
    C['floor'] = [mat('floor%d' % i, (0.36 * k, 0.25 * k, 0.15 * k), 0.25) for i, k in enumerate((0.86, 0.93, 1.0, 1.07, 1.14))]
    C['gap'] = mat('floor_gap', (0.06, 0.04, 0.03), 0.1)
    C['wain'] = [mat('wainscot%d' % i, (0.22 * k, 0.13 * k, 0.07 * k), 0.35) for i, k in enumerate((0.9, 1.0, 1.1))]
    C['wall'] = mat('wall_paint', (0.25, 0.34, 0.31), 0.15)
    C['rail'] = mat('chair_rail', (0.17, 0.10, 0.05), 0.45)
    C['ceil'] = [mat('ceiling%d' % i, (0.62 * k, 0.50 * k, 0.34 * k), 0.2) for i, k in enumerate((0.92, 1.0, 1.08))]
    C['beam'] = mat('beam', (0.16, 0.10, 0.06), 0.2)
    C['bartop'] = mat('bar_top', (0.30, 0.12, 0.06), 0.85)
    C['barfront'] = [mat('bar_front%d' % i, (0.20 * k, 0.10 * k, 0.05 * k), 0.5) for i, k in enumerate((0.92, 1.0, 1.08))]
    C['brass'] = mat('pub_brass', (0.80, 0.60, 0.25), 0.8, metal=0.8)
    C['steel'] = mat('pub_steel', (0.62, 0.64, 0.66), 0.7, metal=0.7)
    C['mirror'] = mat('mirror', (0.20, 0.23, 0.25), 0.95, metal=0.9)
    C['shelf'] = mat('shelf', (0.24, 0.14, 0.07), 0.4)
    C['bottle'] = [mat('bottle%d' % i, c, 0.9) for i, c in enumerate(((0.10, 0.28, 0.12), (0.35, 0.18, 0.05), (0.75, 0.78, 0.74), (0.45, 0.10, 0.08), (0.62, 0.42, 0.10)))]
    C['label'] = [mat('label%d' % i, c, 0.1) for i, c in enumerate(((0.92, 0.88, 0.76), (0.12, 0.12, 0.14), (0.85, 0.75, 0.40), (0.70, 0.12, 0.10)))]
    C['beer'] = mat('beer', (0.78, 0.48, 0.10), 0.8)
    C['foam'] = mat('foam', (0.95, 0.92, 0.84), 0.2)
    C['glassm'] = mat('glass_mug', (0.80, 0.85, 0.85), 0.9)
    C['stool'] = mat('stool_wood', (0.26, 0.15, 0.08), 0.45)
    C['leather'] = mat('stool_leather', (0.13, 0.07, 0.05), 0.55)
    C['table'] = [mat('table%d' % i, (0.33 * k, 0.21 * k, 0.11 * k), 0.5) for i, k in enumerate((0.95, 1.05))]
    C['chair'] = mat('chair', (0.28, 0.17, 0.09), 0.4)
    C['stone'] = [mat('stone%d' % i, (0.40 * k, 0.39 * k, 0.37 * k), 0.15) for i, k in enumerate((0.75, 0.88, 1.0, 1.12))]
    C['soot'] = mat('soot', (0.04, 0.035, 0.03), 0.05)
    C['log'] = mat('log', (0.24, 0.16, 0.10), 0.1)
    C['ember'] = mat('ember', (1.0, 0.36, 0.08), 0.1, zone=4, emit=6.0)
    C['flame'] = mat('flame', (1.0, 0.62, 0.20), 0.1, zone=4, emit=14.0)
    C['flame2'] = mat('flame_core', (1.0, 0.85, 0.45), 0.1, zone=4, emit=22.0)
    C['bulb'] = mat('bulb', (1.0, 0.82, 0.55), 0.1, emit=25.0)
    C['shade'] = mat('lamp_shade', (0.16, 0.30, 0.24), 0.7)
    C['shade_in'] = mat('lamp_shade_in', (0.92, 0.88, 0.78), 0.4)
    C['cord'] = mat('cord', (0.05, 0.05, 0.05), 0.2)
    C['frame'] = mat('window_frame', (0.86, 0.85, 0.80), 0.35)
    C['glass'] = mat('pub_glass', (0.55, 0.62, 0.66), 0.95)
    C['door'] = mat('door', (0.20, 0.27, 0.33), 0.35)
    C['cork'] = mat('cork', (0.56, 0.40, 0.24), 0.05)
    C['paper'] = [mat('paper%d' % i, c, 0.05) for i, c in enumerate(((0.93, 0.92, 0.88), (0.95, 0.88, 0.55), (0.85, 0.90, 0.95), (0.95, 0.80, 0.80)))]
    C['ink'] = mat('ink', (0.12, 0.12, 0.14), 0.1)
    C['pin'] = mat('pin', (0.80, 0.10, 0.08), 0.6)
    C['chalk'] = mat('chalkboard', (0.10, 0.13, 0.12), 0.1)
    C['chalkw'] = mat('chalk', (0.88, 0.88, 0.84), 0.05)
    C['float'] = [mat('glass_float%d' % i, c, 0.95) for i, c in enumerate(((0.15, 0.45, 0.30), (0.20, 0.38, 0.48), (0.42, 0.55, 0.25)))]
    C['rope'] = mat('rope', (0.55, 0.45, 0.30), 0.05)
    C['buoyr'] = mat('buoy_red', (0.80, 0.12, 0.08), 0.5)
    C['buoyw'] = mat('buoy_white', (0.92, 0.92, 0.90), 0.5)
    C['photo'] = [mat('photo%d' % i, c, 0.3) for i, c in enumerate(((0.55, 0.47, 0.36), (0.42, 0.40, 0.37), (0.62, 0.56, 0.45)))]
    C['pframe'] = mat('photo_frame', (0.10, 0.07, 0.05), 0.5)
    C['sign'] = mat('sign_board', (0.12, 0.17, 0.22), 0.4)
    C['signedge'] = mat('sign_edge', (0.76, 0.60, 0.26), 0.7, metal=0.6)
    C['pennant'] = mat('pennant', (0.12, 0.25, 0.55), 0.2)
    C['pennant2'] = mat('pennant_white', (0.92, 0.92, 0.88), 0.2)
    C['card'] = mat('cards', (0.94, 0.93, 0.90), 0.3)
    C['wood_back'] = mat('wheel_back', (0.18, 0.10, 0.05), 0.4)
    C['wrim'] = mat('wheel_rim', (0.36, 0.20, 0.09), 0.6)
    C['wtext'] = mat('wheel_text', (0.97, 0.95, 0.88), 0.3)
    C['wseg'] = {k: mat('wheel_' + k, c, 0.55) for k, c in WCOL.items()}
    C['sky'] = mat('dusk', (0.10, 0.16, 0.30), 0.0, emit=1.0)
    C['water'] = mat('harbour_water', (0.02, 0.04, 0.07), 0.9)
    C['hill'] = mat('hill', (0.02, 0.025, 0.03), 0.0)
    C['light'] = mat('town_light', (1.0, 0.78, 0.45), 0.0, emit=30.0)
    C['quay'] = mat('quay', (0.10, 0.10, 0.11), 0.1)


# ---------- helpers: subdivided panels (the light is baked into the vertices, so big faces need enough of them) ----------
def panel(A, o, u, v, nu, nv, mf, out):
    """a grid of quads on o + u*s + v*t (s, t in 0..1), sharing its corners; mf(i, j) -> a material or None for a hole"""
    o = V(o); u = V(u); v = V(v)
    vs = [[None] * (nv + 1) for _ in range(nu + 1)]
    def at(i, j):
        if vs[i][j] is None: vs[i][j] = A.v(o + u * (i / nu) + v * (j / nv))
        return vs[i][j]
    for i in range(nu):
        for j in range(nv):
            m = mf(i, j)
            if m is not None: A.f([at(i, j), at(i + 1, j), at(i + 1, j + 1), at(i, j + 1)], m, out)

def seg_n(L, step=0.3): return max(1, int(round(L / step)))

def plank(A, o, u, v, m, out, step=0.3):
    """a board: one row of quads along u (v across it)"""
    panel(A, o, u, v, seg_n(V(u).length, step), 1, lambda i, j: m, out)

def holes(rects):
    """a hole test for a wall panel: rects [(s0, s1, z0, z1)] in the wall's own (along, up) metres"""
    return lambda s, z: any(a <= s < b and c <= z < d for a, b, c, d in rects)


# ---------- the room ----------
def floor(A):
    w = 0.15; n = int((Y1 - Y0) / w)
    for k in range(n):
        y0 = Y0 + k * w; x = X0
        # boards of 2.4 - 4.2 m, the joints staggered
        cuts = [X0]; xx = X0 + rr.uniform(0.3, 3.0)
        while xx < X1 - 0.4: cuts.append(xx); xx += rr.uniform(2.4, 4.2)
        cuts.append(X1)
        for a, b in zip(cuts, cuts[1:]):
            plank(A, (a + 0.003, y0 + 0.004, 0), (b - a - 0.006, 0, 0), (0, w - 0.008, 0), rr.choice(C['floor']), (0, 0, 1))
    panel(A, (X0, Y0, -0.006), (X1 - X0, 0, 0), (0, Y1 - Y0, 0), 12, 8, lambda i, j: C['gap'], (0, 0, 1))

def wall(A, o, d, L, inward, opens):
    """one wall from o along d (unit, horizontal) for L metres, facing inward; opens: [(s0, s1, z0, z1)] windows and doors"""
    o = V(o); d = V(d); n = V(inward); hole = holes(opens); up = V((0, 0, 1))
    # the wainscot: vertical boards to 1.0 m, a chair rail, painted boards above
    bw = 0.12; k = int(L / bw)
    for i in range(k):
        s0 = i * bw; s1 = min(L, s0 + bw)
        for z0, z1, m in ((0.0, 0.98, rr.choice(C['wain'])), (1.04, H, C['wall'])):
            zs = [z0 + (z1 - z0) * q / seg_n(z1 - z0, 0.25) for q in range(seg_n(z1 - z0, 0.25) + 1)]
            for za, zb in zip(zs, zs[1:]):
                if hole((s0 + s1) / 2, (za + zb) / 2): continue
                inset = 0.0 if m is C['wall'] else 0.0
                A.poly([o + d * (s0 + 0.002) + up * za + n * inset, o + d * (s1 - 0.002) + up * za + n * inset, o + d * (s1 - 0.002) + up * zb + n * inset, o + d * (s0 + 0.002) + up * zb + n * inset], m, n)
        # a groove behind the boards
    # the rail and the skirting, broken at the openings
    for z0, z1, dep, m in ((0.98, 1.04, 0.035, C['rail']), (0.0, 0.12, 0.02, C['rail'])):
        s = 0.0
        while s < L:
            e = min(L, s + 0.5)
            if not hole((s + e) / 2, (z0 + z1) / 2):
                a = o + d * s; b = o + d * e
                for P, out in (([a + up * z0 + n * dep, b + up * z0 + n * dep, b + up * z1 + n * dep, a + up * z1 + n * dep], n), ([a + up * z1, b + up * z1, b + up * z1 + n * dep, a + up * z1 + n * dep], up)):
                    A.poly(P, m, out)
            s = e
    # a dark backing behind the boards (the joints)
    nu = seg_n(L, 0.25); nv = seg_n(H, 0.25)
    panel(A, o - n * 0.012, d * L, up * H, nu, nv, lambda i, j: None if hole((i + 0.5) * L / nu, (j + 0.5) * H / nv) else C['gap'], n)
    # and a dark shell round the room, a little bigger, so no light from outside leaks in at the corners and under the ceiling
    su = int(round(L / 0.25)) + 2
    panel(A, o - n * 0.05 - d * 0.25 - up * 0.25, d * (L + 0.5), up * 3.25, su, 13, lambda i, j: None if hole((i - 0.5) * 0.25, (j - 0.5) * 0.25) else C['gap'], n)
    # the openings' frames and reveals
    for s0, s1, z0, z1 in opens:
        a = o + d * s0; b = o + d * s1; t = 0.16
        for P, out in (([a + up * z1, b + up * z1, b + up * z1 - n * t, a + up * z1 - n * t], -up), ([a + up * z0 - n * t, b + up * z0 - n * t, b + up * z0, a + up * z0], up),
                       ([a + up * z0, a + up * z1, a + up * z1 - n * t, a + up * z0 - n * t], d), ([b + up * z0, b + up * z1, b + up * z1 - n * t, b + up * z0 - n * t], -d)):
            if z0 > 0.01 or out is not up: A.poly(P, C['frame'], out)
        fw = 0.07
        for P in ([a - d * fw + up * (z0 - fw), b + d * fw + up * (z0 - fw), b + d * fw + up * z0, a - d * fw + up * z0], [a - d * fw + up * z1, b + d * fw + up * z1, b + d * fw + up * (z1 + fw), a - d * fw + up * (z1 + fw)],
                  [a - d * fw + up * max(0, z0 - fw), a + up * max(0, z0 - fw), a + up * (z1 + fw), a - d * fw + up * (z1 + fw)], [b + up * max(0, z0 - fw), b + d * fw + up * max(0, z0 - fw), b + d * fw + up * (z1 + fw), b + up * (z1 + fw)]):
            A.poly([p + n * 0.02 for p in P], C['frame'], n)
        if z0 > 0.01:    # a sill
            abox(A, *sorted([(a - d * 0.1).x, (b + d * 0.1).x]), *sorted([(a - d * 0.1 + n * 0.12).y, (a - n * 0.0).y]), z0 - 0.03, z0, C['frame']) if abs(d.x) > 0.5 else \
                abox(A, *sorted([(a - n * 0.0).x, (a + n * 0.12).x]), *sorted([(a - d * 0.1).y, (b + d * 0.1).y]), z0 - 0.03, z0, C['frame'])

def window_glass(Gl, A, o, d, inward, s0, s1, z0, z1):
    """the panes (glass part) and the glazing bars: a cross in each window"""
    o = V(o); d = V(d); n = V(inward); up = V((0, 0, 1)); g = -n * 0.08
    a = o + d * s0 + g; b = o + d * s1 + g
    Gl.poly([a + up * z0, b + up * z0, b + up * z1, a + up * z1], C['glass'], n)
    m = (s0 + s1) / 2; zm = z0 + (z1 - z0) * 0.62; w = 0.025
    for P in ([o + d * (m - w) + up * z0, o + d * (m + w) + up * z0, o + d * (m + w) + up * z1, o + d * (m - w) + up * z1], [a + up * (zm - w), b + up * (zm - w), b + up * (zm + w), a + up * (zm + w)]):
        A.poly([p + g + n * 0.01 for p in P], C['frame'], n)

def walls(A, Gl):
    front = [(x0 - X0, x1 - X0, WZ[0], WZ[1]) for x0, x1 in WIN_F] + [(DOOR[0] - X0, DOOR[1] - X0, 0.0, 2.25)]
    wall(A, (X0, Y0, 0), (1, 0, 0), X1 - X0, (0, 1, 0), front)
    wall(A, (X1, Y1, 0), (-1, 0, 0), X1 - X0, (0, -1, 0), [])
    wall(A, (X1, Y0, 0), (0, 1, 0), Y1 - Y0, (-1, 0, 0), [(y0 - Y0, y1 - Y0, WZ[0], WZ[1]) for y0, y1 in WIN_R])
    wall(A, (X0, Y1, 0), (0, -1, 0), Y1 - Y0, (1, 0, 0), [(Y1 - y1, Y1 - y0, WZ[0], WZ[1]) for y0, y1 in WIN_L] + [(Y1 - FIRE[2], Y1 - FIRE[1], 0.0, H)])
    for x0, x1 in WIN_F: window_glass(Gl, A, (X0, Y0, 0), (1, 0, 0), (0, 1, 0), x0 - X0, x1 - X0, *WZ)
    for y0, y1 in WIN_R: window_glass(Gl, A, (X1, Y0, 0), (0, 1, 0), (-1, 0, 0), y0, y1, *WZ)
    for y0, y1 in WIN_L: window_glass(Gl, A, (X0, Y1, 0), (0, -1, 0), (1, 0, 0), Y1 - y1, Y1 - y0, *WZ)
    # the door: boards with a small window
    x0, x1 = DOOR; y = Y0 + 0.06
    for k in range(5):
        a = x0 + k * 0.2; b = a + 0.2
        for z0, z1 in ((0.0, 1.25), (1.85, 2.25)):
            panel(A, (a + 0.003, y, z0), (0.194, 0, 0), (0, 0, z1 - z0), 1, seg_n(z1 - z0, 0.3), lambda i, j: C['door'], (0, 1, 0))
        if k in (0, 4):
            panel(A, (a + 0.003, y, 1.25), (0.194, 0, 0), (0, 0, 0.6), 1, 2, lambda i, j: C['door'], (0, 1, 0))
    Gl.poly([(x0 + 0.2, y - 0.01, 1.25), (x1 - 0.2, y - 0.01, 1.25), (x1 - 0.2, y - 0.01, 1.85), (x0 + 0.2, y - 0.01, 1.85)], C['glass'], (0, 1, 0))
    acyl(A, (x1 - 0.12, y + 0.04, 1.02), (x1 - 0.12, y + 0.04, 1.14), 0.018, lambda z: C['brass'], 8)

def ceiling(A):
    w = 0.2
    for k in range(int((X1 - X0) / w)):
        x = X0 + k * w
        plank(A, (x + 0.004, Y0, H), (0, Y1 - Y0, 0), (w - 0.008, 0, 0), rr.choice(C['ceil']), (0, 0, -1), 0.35)
    panel(A, (X0, Y0, H + 0.01), (X1 - X0, 0, 0), (0, Y1 - Y0, 0), 6, 4, lambda i, j: C['gap'], (0, 0, -1))
    for y in (1.4, 3.0, 4.6, 6.3):
        # beams across the room
        for P, out in (([(X0, y - 0.11, H - 0.24), (X1, y - 0.11, H - 0.24), (X1, y + 0.11, H - 0.24), (X0, y + 0.11, H - 0.24)], (0, 0, -1)),
                       ([(X0, y - 0.11, H - 0.24), (X1, y - 0.11, H - 0.24), (X1, y - 0.11, H), (X0, y - 0.11, H)], (0, -1, 0)),
                       ([(X0, y + 0.11, H - 0.24), (X1, y + 0.11, H - 0.24), (X1, y + 0.11, H), (X0, y + 0.11, H)], (0, 1, 0))):
            P = [V(p) for p in P]; nseg = 40
            for i in range(nseg):
                t0 = i / nseg; t1 = (i + 1) / nseg
                A.poly([P[0].lerp(P[1], t0), P[0].lerp(P[1], t1), P[3].lerp(P[2], t1), P[3].lerp(P[2], t0)], C['beam'], out)


# ---------- the bar ----------
def bar(A):
    # the front: vertical boards between a plinth and the top, a brass foot rail on posts
    bw = 0.14
    for k in range(int((BX1 - BX0) / bw)):
        x = BX0 + k * bw
        panel(A, (x + 0.003, BF, 0.1), (bw - 0.006, 0, 0), (0, 0, BT - 0.16), 1, 4, lambda i, j: rr.choice(C['barfront']), (0, -1, 0))
    abox(A, BX0, BX1, BF - 0.02, BB, 0.0, 0.1, C['beam'], skip=('-z',))
    for x, d in ((BX0, -1), (BX1, 1)):
        panel(A, (x, BF, 0), (0, BB - BF, 0), (0, 0, BT - 0.06), 3, 4, lambda i, j: C['barfront'][1], (d, 0, 0))
    # the top: a thick lacquered slab with a rounded front edge
    top = BT - 0.06
    panel(A, (BX0 - 0.05, BF - 0.07, BT), (BX1 - BX0 + 0.1, 0, 0), (0, BB - BF + 0.07, 0), 40, 4, lambda i, j: C['bartop'], (0, 0, 1))
    for i in range(40):
        a = BX0 - 0.05 + (BX1 - BX0 + 0.1) * i / 40; b = BX0 - 0.05 + (BX1 - BX0 + 0.1) * (i + 1) / 40
        A.poly([(a, BF - 0.07, top), (b, BF - 0.07, top), (b, BF - 0.07, BT), (a, BF - 0.07, BT)], C['bartop'], (0, -1, 0))
        A.poly([(a, BF - 0.07, top), (b, BF - 0.07, top), (b, BF, top), (a, BF, top)], C['bartop'], (0, 0, -1))
    for x, d in ((BX0 - 0.05, -1), (BX1 + 0.05, 1)):
        A.poly([(x, BF - 0.07, top), (x, BB, top), (x, BB, BT), (x, BF - 0.07, BT)], C['bartop'], (d, 0, 0))
    # the foot rail
    tube_pts = [(BX0 + 0.1, BF - 0.2, 0.22), (BX1 - 0.1, BF - 0.2, 0.22)]
    acyl(A, tube_pts[0], tube_pts[1], 0.025, lambda z: C['brass'], 10, cap=True)
    for x in [BX0 + 0.3 + k * 1.1 for k in range(6)]:
        acyl(A, (x, BF, 0.22), (x, BF - 0.2, 0.22), 0.012, lambda z: C['brass'], 6)
    # the taps: a brass tower with three handles, the drip tray
    tx = -0.75
    acyl(A, (tx - 0.3, BF + 0.28, BT), (tx - 0.3, BF + 0.28, BT + 0.38), 0.03, lambda z: C['brass'], 10)
    acyl(A, (tx + 0.3, BF + 0.28, BT), (tx + 0.3, BF + 0.28, BT + 0.38), 0.03, lambda z: C['brass'], 10)
    acyl(A, (tx - 0.33, BF + 0.28, BT + 0.38), (tx + 0.33, BF + 0.28, BT + 0.38), 0.035, lambda z: C['brass'], 12)
    for k, hc in enumerate((C['label'][3], C['label'][1], C['label'][2])):
        x = tx - 0.2 + k * 0.2
        acyl(A, (x, BF + 0.28, BT + 0.38), (x, BF + 0.2, BT + 0.38), 0.012, lambda z: C['brass'], 6)
        acyl(A, (x, BF + 0.2, BT + 0.38), (x, BF + 0.2, BT + 0.3), 0.01, lambda z: C['brass'], 6)
        acyl(A, (x, BF + 0.28, BT + 0.42), (x, BF + 0.28, BT + 0.6), 0.016, lambda z, hc=hc: hc, 8, r1=0.022)
    abox(A, tx - 0.35, tx + 0.35, BF + 0.12, BF + 0.3, BT, BT + 0.02, C['steel'])

def glass_of_beer(A, x, y, z, full=0.85, h=0.15, r=0.04):
    acyl(A, (x, y, z), (x, y, z + h * full - 0.02), r * 0.92, lambda zz: C['beer'], 12, r1=r)
    acyl(A, (x, y, z + h * full - 0.02), (x, y, z + h * full + 0.012), r, lambda zz: C['foam'], 12)
    # the glass above the beer, and a handle
    acyl(A, (x, y, z + h * full + 0.012), (x, y, z + h), r * 1.02, lambda zz: C['glassm'], 12, cap=False)
    atorus(A, (x + r + 0.022, y, z + h * 0.5), (0, 1, 0), 0.035, 0.008, lambda a: C['glassm'], 10, 5, -math.pi / 2, math.pi / 2)

def back_bar(A):
    # a low cupboard, shelves on brackets, a mirror between them, bottles
    abox(A, BX0 + 0.2, BX1 - 0.2, Y1 - 0.5, Y1 - 0.01, 0.0, 0.95, C['shelf'], skip=('-z', '+y'))
    for x in [BX0 + 0.2 + k * 0.6 for k in range(int((BX1 - BX0 - 0.4) / 0.6))]:
        abox(A, x + 0.03, x + 0.57, Y1 - 0.505, Y1 - 0.5, 0.1, 0.85, C['barfront'][2], skip=('+y',))
        acyl(A, (x + 0.5, Y1 - 0.52, 0.72), (x + 0.5, Y1 - 0.54, 0.72), 0.012, lambda z: C['brass'], 6)
    mx0, mx1 = BX0 + 0.5, BX1 - 0.5
    panel(A, (mx0, Y1 - 0.02, 1.02), (mx1 - mx0, 0, 0), (0, 0, 1.25), 16, 5, lambda i, j: C['mirror'], (0, -1, 0))
    for z in (1.32, 1.72, 2.12):
        abox(A, BX0 + 0.3, BX1 - 0.3, Y1 - 0.32, Y1 - 0.02, z - 0.03, z, C['shelf'])
        x = BX0 + 0.42
        while x < BX1 - 0.42:
            if rr.random() < 0.85:
                m = rr.choice(C['bottle']); h = rr.uniform(0.24, 0.32); r = rr.uniform(0.03, 0.045)
                acyl(A, (x, Y1 - 0.17, z), (x, Y1 - 0.17, z + h * 0.62), r, lambda zz, m=m: m, 10)
                acyl(A, (x, Y1 - 0.17, z + h * 0.62), (x, Y1 - 0.17, z + h * 0.78), r, lambda zz, m=m: m, 10, r1=0.014, cap=False)
                acyl(A, (x, Y1 - 0.17, z + h * 0.78), (x, Y1 - 0.17, z + h), 0.013, lambda zz, m=m: m, 6)
                lb = rr.choice(C['label'])
                acyl(A, (x, Y1 - 0.17, z + h * 0.2), (x, Y1 - 0.17, z + h * 0.45), r + 0.002, lambda zz, lb=lb: lb, 10, cap=False)
            x += rr.uniform(0.09, 0.14)
    # glasses upside down on the cupboard
    for k in range(8):
        x = BX0 + 0.6 + k * 0.16
        acyl(A, (x, Y1 - 0.3, 0.95), (x, Y1 - 0.3, 1.08), 0.035, lambda z: C['glassm'], 10)

def stool(A, x, y, seat=0.76):
    acyl(A, (x, y, 0.0), (x, y, 0.03), 0.2, lambda z: C['brass'], 14)
    acyl(A, (x, y, 0.03), (x, y, seat - 0.04), 0.03, lambda z: C['brass'], 10)
    atorus(A, (x, y, 0.3), (0, 0, 1), 0.17, 0.012, lambda a: C['brass'], 18, 6)
    for k in range(4):
        a = k * math.pi / 2 + 0.4
        acyl(A, (x, y, 0.3), (x + 0.17 * math.cos(a), y + 0.17 * math.sin(a), 0.3), 0.008, lambda z: C['brass'], 5)
    acyl(A, (x, y, seat - 0.05), (x, y, seat), 0.19, lambda z: C['stool'], 18)
    acyl(A, (x, y, seat), (x, y, seat + 0.05), 0.2, lambda z: C['leather'], 18, r1=0.18)

def table_round(A, x, y, r=0.5, z=0.74):
    acyl(A, (x, y, z - 0.04), (x, y, z), r, lambda zz: rr.choice(C['table']), 24)
    acyl(A, (x, y, 0.0), (x, y, 0.04), 0.28, lambda zz: C['beam'], 14)
    acyl(A, (x, y, 0.04), (x, y, z - 0.04), 0.05, lambda zz: C['beam'], 10)
    # the top's face subdivided for the light: rings
    for k in range(1, 4):
        pass

def chair(A, x, y, h):
    """a plain wooden chair at (x, y) facing h (0 = +y)"""
    c, s = math.cos(h), math.sin(h)
    P = lambda a, b, z: (x + a * c - b * s, y + a * s + b * c, z)
    f = (-s * 0, 0, 0)
    for a, b in ((-0.2, -0.2), (0.2, -0.2), (-0.2, 0.2), (0.2, 0.2)):
        acyl(A, P(a, b, 0), P(a, b, 0.45), 0.018, lambda z: C['chair'], 6)
    obox(A, P(0, 0, 0.465), (0.23 * c, 0.23 * s, 0), (-0.23 * s, 0.23 * c, 0), (0, 0, 0.02), C['chair'])
    for a in (-0.2, 0.2):
        acyl(A, P(a, -0.21, 0.45), P(a, -0.24, 0.92), 0.018, lambda z: C['chair'], 6)
    for z in (0.66, 0.84):
        obox(A, P(0, -0.225 - (z - 0.45) * 0.06, z), (0.22 * c, 0.22 * s, 0), (-0.012 * -s * 0 + 0.012 * -s, 0.012 * c, 0), (0, 0, 0.04), C['chair'])

def bench(A, x0, x1, y, z=0.45, d=0.32):
    abox(A, x0, x1, y - d / 2, y + d / 2, z - 0.04, z, C['chair'])
    for x in (x0 + 0.1, x1 - 0.1):
        abox(A, x - 0.03, x + 0.03, y - d / 2 + 0.03, y + d / 2 - 0.03, 0, z - 0.04, C['chair'])

def tables(A):
    table_round(A, *T_CREW)
    for k in range(4):
        a = k * math.pi / 2 + math.pi / 4; chair(A, T_CREW[0] + 0.78 * math.cos(a), T_CREW[1] + 0.78 * math.sin(a), a + math.pi / 2)
    table_round(A, *T_CARD, r=0.45)
    for a in (0.3, math.pi + 0.3, math.pi / 2 + 0.3):
        chair(A, T_CARD[0] + 0.72 * math.cos(a), T_CARD[1] + 0.72 * math.sin(a), a + math.pi / 2)
    # the fiskarlag's long table with benches and its pennant on a little stand
    x, y = T_LAG
    abox(A, x - 1.0, x + 1.0, y - 0.4, y + 0.4, 0.70, 0.75, C['table'][0])
    for xx in (x - 0.85, x + 0.85):
        abox(A, xx - 0.04, xx + 0.04, y - 0.32, y + 0.32, 0, 0.70, C['beam'])
    bench(A, x - 1.0, x + 1.0, y - 0.68); bench(A, x - 1.0, x + 1.0, y + 0.68)
    acyl(A, (x, y, 0.75), (x, y, 0.77), 0.06, lambda z: C['brass'], 10)
    acyl(A, (x, y, 0.77), (x, y, 1.12), 0.006, lambda z: C['brass'], 6)
    A.poly([(x, y, 1.1), (x, y, 0.92), (x + 0.3, y, 1.01)], C['pennant'], (0, -1, 0)); A.poly([(x, y + 0.002, 1.1), (x, y + 0.002, 0.92), (x + 0.3, y + 0.002, 1.01)], C['pennant'], (0, 1, 0))
    A.poly([(x + 0.02, y - 0.002, 1.04), (x + 0.02, y - 0.002, 0.98), (x + 0.16, y - 0.002, 1.01)], C['pennant2'], (0, -1, 0))
    # things on the tables: beers, the cards
    for gx, gy in ((-0.2, 0.15), (0.18, 0.2), (0.05, -0.25)): glass_of_beer(A, T_CREW[0] + gx, T_CREW[1] + gy, 0.74)
    for gx, gy in ((-0.15, 0.1), (0.2, -0.1)): glass_of_beer(A, T_CARD[0] + gx, T_CARD[1] + gy, 0.74)
    for k in range(9):
        cx = T_CARD[0] + rr.uniform(-0.18, 0.18); cy = T_CARD[1] + rr.uniform(-0.15, 0.15); a = rr.uniform(0, math.pi)
        c, s = math.cos(a) * 0.045, math.sin(a) * 0.045
        A.poly([(cx - c + s * 0.7, cy - s - c * 0.7, 0.742 + k * 0.0005), (cx + c + s * 0.7, cy + s - c * 0.7, 0.742 + k * 0.0005), (cx + c - s * 0.7, cy + s + c * 0.7, 0.742 + k * 0.0005), (cx - c - s * 0.7, cy - s + c * 0.7, 0.742 + k * 0.0005)], C['card'], (0, 0, 1))
    for gx in (-0.5, 0.4): glass_of_beer(A, x + gx, y + 0.15, 0.75)


# ---------- the fireplace, the lamps and the things on the walls ----------
def fireplace(A):
    x, y0, y1 = FIRE; dep = 0.55
    # the chimney breast in stone blocks, the firebox opening, a mantel
    for zi in range(int(H / 0.22) + 1):
        z0 = zi * 0.22; z1 = min(H, z0 + 0.22)
        if z0 >= H: break
        off = 0.0 if zi % 2 else 0.18
        ys = [y0] + [y0 + off + k * 0.36 for k in range(1, 7) if y0 + off + k * 0.36 < y1 - 0.1] + [y1]
        for a, b in zip(ys, ys[1:]):
            m = rr.choice(C['stone']); bulge = rr.uniform(0.0, 0.025)
            inbox = z0 < 0.95 and y0 + 0.45 < (a + b) / 2 < y1 - 0.45
            if inbox: continue
            fx = x + dep + bulge
            A.poly([(fx, a + 0.008, z0 + 0.008), (fx, b - 0.008, z0 + 0.008), (fx, b - 0.008, z1 - 0.008), (fx, a + 0.008, z1 - 0.008)], m, (1, 0, 0))
            if a == y0: A.poly([(x, a, z0), (fx, a, z0), (fx, a, z1), (x, a, z1)], m, (0, -1, 0))
            if b == y1: A.poly([(x, b, z0), (fx, b, z0), (fx, b, z1), (x, b, z1)], m, (0, 1, 0))
        A.poly([(x + dep - 0.002, y0, z0), (x + dep - 0.002, y1, z0), (x + dep - 0.002, y1, z1), (x + dep - 0.002, y0, z1)], C['soot'], (1, 0, 0))
    # the firebox
    fb0, fb1 = y0 + 0.45, y1 - 0.45
    for P, out in (([(x + 0.1, fb0, 0), (x + 0.1, fb1, 0), (x + 0.1, fb1, 0.88), (x + 0.1, fb0, 0.88)], (1, 0, 0)), ([(x + 0.1, fb0, 0.88), (x + dep, fb0, 0.88), (x + dep, fb1, 0.88), (x + 0.1, fb1, 0.88)], (0, 0, -1)),
                   ([(x + 0.1, fb0, 0), (x + dep, fb0, 0), (x + dep, fb0, 0.88), (x + 0.1, fb0, 0.88)], (0, 1, 0)), ([(x + 0.1, fb1, 0), (x + dep, fb1, 0), (x + dep, fb1, 0.88), (x + 0.1, fb1, 0.88)], (0, -1, 0))):
        P = [V(p) for p in P]
        for i in range(4):
            for j in range(3):
                q = lambda s, t: P[0] + (P[1] - P[0]) * s + (P[3] - P[0]) * t
                A.poly([q(i / 4, j / 3), q((i + 1) / 4, j / 3), q((i + 1) / 4, (j + 1) / 3), q(i / 4, (j + 1) / 3)], C['soot'], out)
    abox(A, x + 0.1, x + dep + 0.3, fb0 - 0.2, fb1 + 0.2, 0, 0.04, C['stone'][0], skip=('-z',))   # the hearth
    abox(A, x, x + dep + 0.12, y0 - 0.08, y1 + 0.08, 1.1, 1.18, C['beam'])                        # the mantel
    # logs, embers, flames
    yc = (fb0 + fb1) / 2; xc = x + 0.32
    for a, b in (((xc - 0.08, yc - 0.3, 0.1), (xc + 0.05, yc + 0.28, 0.12)), ((xc + 0.06, yc - 0.28, 0.11), (xc - 0.04, yc + 0.3, 0.1)), ((xc, yc - 0.25, 0.2), (xc + 0.02, yc + 0.22, 0.21))):
        acyl(A, a, b, 0.055, lambda z: C['log'], 8)
    for k in range(9):
        py = yc + rr.uniform(-0.25, 0.25); px = xc + rr.uniform(-0.08, 0.08); hgt = rr.uniform(0.18, 0.42); w = rr.uniform(0.05, 0.09)
        m = C['flame2'] if hgt < 0.25 else C['flame']
        A.poly([(px, py - w, 0.16), (px, py + w, 0.16), (px + rr.uniform(-0.03, 0.03), py + rr.uniform(-0.03, 0.03), 0.16 + hgt)], m, (1, 0, 0))
        A.poly([(px - w, py, 0.16), (px + w, py, 0.16), (px + rr.uniform(-0.03, 0.03), py, 0.16 + hgt)], m, (0, 1, 0))
    for k in range(14):
        sphere_acc(A, (xc + rr.uniform(-0.12, 0.12), yc + rr.uniform(-0.28, 0.28), 0.06), rr.uniform(0.02, 0.04), C['ember'])
    # on the mantel: a ship's lantern and a model boat
    acyl(A, (x + 0.35, y0 + 0.3, 1.18), (x + 0.35, y0 + 0.3, 1.42), 0.07, lambda z: C['brass'], 8)
    hull = [(x + 0.35, y1 - 0.9, 1.2), (x + 0.35, y1 - 0.3, 1.2)]
    obox(A, (x + 0.35, y1 - 0.6, 1.24), (0, 0.3, 0), (0.06, 0, 0), (0, 0, 0.05), C['buoyr'])
    obox(A, (x + 0.35, y1 - 0.55, 1.33), (0, 0.08, 0), (0.04, 0, 0), (0, 0, 0.04), C['buoyw'])

def sphere_acc(A, c, r, m, seg=8, rings=5):
    c = V(c); rows = []
    for i in range(rings + 1):
        th = math.pi * i / rings
        rows.append([A.v(c + V((math.sin(th) * math.cos(2 * math.pi * k / seg), math.sin(th) * math.sin(2 * math.pi * k / seg), math.cos(th))) * r) for k in range(seg)])
    for i in range(rings):
        for k in range(seg):
            j = (k + 1) % seg; q = [rows[i][k], rows[i + 1][k], rows[i + 1][j], rows[i][j]]
            cen = sum((v.co for v in q), V()) / 4
            A.f(q if i not in (0, rings - 1) else q, m, cen - c)

LAMPS = [(-2.6, 6.3, 2.05), (-0.6, 6.3, 2.05), (1.4, 6.3, 2.05)]
SCONCES = [(X0 + 0.12, 6.9, 1.95), (X1 - 0.12, 0.6, 1.95), (X1 - 0.12, 5.6, 1.95), (-2.9, Y0 + 0.12, 1.95), (2.8, Y0 + 0.12, 1.95), (X0 + 0.12, 2.6, 1.95)]
TABLE_LAMPS = [(T_CREW[0], T_CREW[1], 2.0), (T_CARD[0], T_CARD[1], 2.0), (T_LAG[0], T_LAG[1], 2.0)]

def lamps(A):
    for x, y, z in LAMPS + TABLE_LAMPS:
        acyl(A, (x, y, H), (x, y, z + 0.18), 0.005, lambda q: C['cord'], 5)
        # an enamel shade: green outside, white inside
        rings = 16
        for i in range(rings):
            a0 = 2 * math.pi * i / rings; a1 = 2 * math.pi * (i + 1) / rings
            for (r0, z0), (r1, z1) in (((0.04, z + 0.18), (0.1, z + 0.12)), ((0.1, z + 0.12), (0.2, z))):
                P = [(x + r0 * math.cos(a0), y + r0 * math.sin(a0), z0), (x + r0 * math.cos(a1), y + r0 * math.sin(a1), z0), (x + r1 * math.cos(a1), y + r1 * math.sin(a1), z1), (x + r1 * math.cos(a0), y + r1 * math.sin(a0), z1)]
                mid = ((a0 + a1) / 2)
                A.poly(P, C['shade'], (math.cos(mid), math.sin(mid), 0.6))
                A.poly([(p[0], p[1], p[2] - 0.003) for p in P], C['shade_in'], (-math.cos(mid), -math.sin(mid), -0.6))
        sphere_acc(A, (x, y, z + 0.06), 0.045, C['bulb'])
    for x, y, z in SCONCES:
        nx = 1 if x < 0 and abs(x - X0) < 0.5 else -1 if abs(x - X1) < 0.5 else 0; ny = 1 if abs(y - Y0) < 0.5 else 0
        acyl(A, (x - nx * 0.1, y - ny * 0.1, z), (x + nx * 0.05, y + ny * 0.05, z), 0.012, lambda q: C['brass'], 6)
        acyl(A, (x + nx * 0.05, y + ny * 0.05, z - 0.02), (x + nx * 0.05, y + ny * 0.05, z + 0.14), 0.07, lambda q: C['shade_in'], 10, r1=0.09)
        sphere_acc(A, (x + nx * 0.05, y + ny * 0.05, z + 0.05), 0.03, C['bulb'])

def walls_dressing(A):
    # the notice board: cork in a frame with papers and pins
    x, y0, y1, z0, z1 = BOARD
    panel(A, (x - 0.02, y0, z0), (0, y1 - y0, 0), (0, 0, z1 - z0), 6, 4, lambda i, j: C['cork'], (-1, 0, 0))
    for P in (((y0 - 0.04, z0 - 0.04), (y1 + 0.04, z0)), ((y0 - 0.04, z1), (y1 + 0.04, z1 + 0.04)), ((y0 - 0.04, z0), (y0, z1)), ((y1, z0), (y1 + 0.04, z1))):
        abox(A, x - 0.045, x, P[0][0], P[1][0], P[0][1], P[1][1], C['pframe'])
    for k, (py, pz, w, h) in enumerate(((y0 + 0.08, z0 + 0.42, 0.3, 0.28), (y0 + 0.45, z0 + 0.38, 0.22, 0.34), (y0 + 0.75, z0 + 0.46, 0.4, 0.26), (y0 + 0.1, z0 + 0.06, 0.26, 0.3),
                                         (y0 + 0.42, z0 + 0.05, 0.36, 0.28), (y0 + 0.85, z0 + 0.08, 0.32, 0.32))):
        m = C['paper'][k % 4]; d = x - 0.025 - k * 0.0008
        A.poly([(d, py, pz), (d, py + w, pz), (d, py + w, pz + h), (d, py, pz + h)], m, (-1, 0, 0))
        for ln in range(4):     # lines of text
            lz = pz + h - 0.07 - ln * 0.045
            if lz < pz + 0.03: break
            A.poly([(d - 0.001, py + 0.03, lz), (d - 0.001, py + w * rr.uniform(0.5, 0.9), lz), (d - 0.001, py + w * rr.uniform(0.5, 0.9), lz + 0.012), (d - 0.001, py + 0.03, lz + 0.012)], C['ink'], (-1, 0, 0))
        sphere_acc(A, (d - 0.008, py + w / 2, pz + h - 0.025), 0.009, C['pin'], 6, 3)
    # the quiz chalkboard: QUIZ in chalk and lines
    x, y0, y1, z0, z1 = CHALK
    panel(A, (x + 0.02, y1, z0), (0, -(y1 - y0), 0), (0, 0, z1 - z0), 4, 3, lambda i, j: C['chalk'], (1, 0, 0))
    for P in (((y0 - 0.04, z0 - 0.04), (y1 + 0.04, z0)), ((y0 - 0.04, z1), (y1 + 0.04, z1 + 0.04)), ((y0 - 0.04, z0), (y0, z1)), ((y1, z0), (y1 + 0.04, z1))):
        abox(A, x, x + 0.045, P[0][0], P[1][0], P[0][1], P[1][1], C['beam'])
    abox(A, x, x + 0.08, y0, y1, z0 - 0.06, z0 - 0.04, C['beam'])
    for ln in range(5):
        lz = z1 - 0.32 - ln * 0.08
        A.poly([(x + 0.022, y1 - 0.1, lz), (x + 0.022, y1 - 0.1 - rr.uniform(0.4, 0.85), lz), (x + 0.022, y1 - 0.1 - rr.uniform(0.4, 0.85), lz + 0.014), (x + 0.022, y1 - 0.1, lz + 0.014)], C['chalkw'], (1, 0, 0))
    text(A, 'QUIZ', 0.16, C['chalkw'], (x + 0.023, (y0 + y1) / 2, z1 - 0.16), (0, -1, 0), (0, 0, 1))
    # glass floats in nets on the walls
    for (fx, fy, fz, r, k) in ((X1 - 0.16, 6.9, 2.2, 0.14, 0), (X1 - 0.16, 7.25, 2.05, 0.11, 1), (X0 + 0.16, 0.4, 2.3, 0.12, 2), (-4.4, Y1 - 0.16, 2.35, 0.13, 1), (-4.05, Y1 - 0.16, 2.2, 0.1, 0)):
        sphere_acc(A, (fx, fy, fz), r, C['float'][k], 12, 8)
        for a in range(4):
            aa = a * math.pi / 4
            atorus(A, (fx, fy, fz), (math.cos(aa), math.sin(aa), 0), r + 0.004, 0.004, lambda q: C['rope'], 16, 4)
    # a lifebuoy by the door, photographs on the walls
    for i in range(8):
        a0 = i * math.pi / 4
        atorus(A, (DOOR[1] + 0.55, Y0 + 0.07, 1.55), (0, 1, 0), 0.26, 0.06, lambda q, i=i: C['buoyr'] if i % 2 else C['buoyw'], 4, 8, a0, a0 + math.pi / 4)
    for (px, py, pz, w, h, nrm) in ((-5.1, Y1 - 0.02, 1.7, 0.4, 0.3, (0, -1, 0)), (-0.9, Y0 + 0.02, 1.62, 0.34, 0.26, (0, 1, 0)), (X1 - 0.02, 3.0, 1.55, 0.3, 0.4, (-1, 0, 0)), (X1 - 0.02, 6.5, 1.6, 0.44, 0.32, (-1, 0, 0)), (X0 + 0.02, 1.4, 1.6, 0.4, 0.3, (1, 0, 0))):
        n = V(nrm); u = V((-n.y, n.x, 0)); c = V((px, py, pz)); up = V((0, 0, 1))
        obox(A, c + n * 0.012, u * (w / 2 + 0.03), up * (h / 2 + 0.03), n * 0.012, C['pframe'])
        A.poly([c + n * 0.026 + u * sx * w / 2 + up * sz * h / 2 for sx, sz in ((-1, -1), (1, -1), (1, 1), (-1, 1))], rr.choice(C['photo']), n)
    # the name board over the back bar (the game writes the place's name on it)
    x0, x1, y, z0, z1 = SIGN
    obox(A, ((x0 + x1) / 2, y - 0.02, (z0 + z1) / 2), ((x1 - x0) / 2 + 0.04, 0, 0), (0, 0.02, 0), (0, 0, (z1 - z0) / 2 + 0.04), C['signedge'])
    panel(A, (x0, y - 0.041, z0), (x1 - x0, 0, 0), (0, 0, z1 - z0), 8, 2, lambda i, j: C['sign'], (0, -1, 0))

def text(A, s, size, m, c, right, up, depth=0.0):
    """a word as a flat mesh at c in the plane of right/up (facing right x up)"""
    cu = bpy.data.curves.new('txt', 'FONT'); cu.body = s; cu.size = size; cu.align_x = 'CENTER'; cu.align_y = 'CENTER'; cu.extrude = depth
    ob = bpy.data.objects.new('txt', cu); link(ob)
    dg = bpy.context.evaluated_depsgraph_get(); me = bpy.data.meshes.new_from_object(ob.evaluated_get(dg))
    bpy.data.objects.remove(ob, do_unlink=True)
    r = V(right).normalized(); u = V(up).normalized(); n = r.cross(u)
    bm = bmesh.new(); bm.from_mesh(me)
    vm = {v: A.v(V(c) + r * v.co.x + u * v.co.y + n * v.co.z) for v in bm.verts}
    for f in bm.faces: A.f([vm[v] for v in f.verts], m, n)
    bm.free(); bpy.data.meshes.remove(me)


# ---------- the wheel of fortune (its own part, turned by the game) and its board on the wall ----------
def wheel_board(A):
    x, y, z = WC
    rings = 24
    # the round backboard on the wall and the pointer at the top
    for i in range(rings):
        a0 = 2 * math.pi * i / rings; a1 = 2 * math.pi * (i + 1) / rings; R = WR + 0.14
        A.poly([(x, Y1 - 0.03, z), (x + R * math.sin(a0), Y1 - 0.03, z + R * math.cos(a0)), (x + R * math.sin(a1), Y1 - 0.03, z + R * math.cos(a1))], C['wood_back'], (0, -1, 0))
    atorus(A, (x, Y1 - 0.04, z), (0, 1, 0), WR + 0.14, 0.02, lambda q: C['brass'], 32, 6)
    tip = (x, y - 0.1, z + WR - 0.06)
    A.poly([(x - 0.06, y - 0.1, z + WR + 0.12), (x + 0.06, y - 0.1, z + WR + 0.12), tip], C['buoyr'], (0, -1, 0))
    A.poly([(x - 0.06, y - 0.09, z + WR + 0.12), (x + 0.06, y - 0.09, z + WR + 0.12), (tip[0], tip[1] + 0.01, tip[2])], C['buoyr'], (0, 1, 0))
    abox(A, x - 0.03, x + 0.03, y - 0.1, Y1 - 0.03, z + WR + 0.09, z + WR + 0.15, C['brass'])
    text(A, 'LYKKEHJULET', 0.11, C['brass'], (x, Y1 - 0.031, z + WR + 0.3), (1, 0, 0), (0, 0, 1))

def wheel():
    """the wheel round its own middle: the face towards -y, segment angles clockwise from the top as the player sees it"""
    A = Acc('WHEEL'); tot = sum(w for _, w in WHEEL); a = 0.0; f = -0.05
    for k, w in WHEEL:
        s0 = a; s1 = a + w / tot * 2 * math.pi; a = s1
        n = max(2, int((s1 - s0) / math.radians(4)))
        for i in range(n):
            t0 = s0 + (s1 - s0) * i / n; t1 = s0 + (s1 - s0) * (i + 1) / n
            for r0, r1 in ((0.07, 0.3), (0.3, WR)):
                A.poly([(r0 * math.sin(t0), f, r0 * math.cos(t0)), (r1 * math.sin(t0), f, r1 * math.cos(t0)), (r1 * math.sin(t1), f, r1 * math.cos(t1)), (r0 * math.sin(t1), f, r0 * math.cos(t1))], C['wseg'][k], (0, -1, 0))
        # a brass divider and peg at the segment's start
        e = V((math.sin(s0), 0, math.cos(s0))); t = V((math.cos(s0), 0, -math.sin(s0)))
        obox(A, e * ((0.07 + WR) / 2) + V((0, f - 0.004, 0)), e * ((WR - 0.07) / 2), t * 0.006, V((0, 0.004, 0)), C['brass'])
        acyl(A, e * (WR - 0.03) + V((0, f, 0)), e * (WR - 0.03) + V((0, f - 0.05, 0)), 0.01, lambda z: C['brass'], 6)
        # the label along the radius, reading outwards
        m = (s0 + s1) / 2; er = V((math.sin(m), 0, math.cos(m))); up = V((-math.cos(m), 0, math.sin(m)))
        if k in WLAB: text(A, WLAB[k], 0.085, C['wtext'], er * 0.4 + V((0, f - 0.002, 0)), er, up)
        elif k == 'luksus':
            c = er * 0.46 + V((0, f - 0.002, 0)); pts = []
            for q in range(10):
                rr_ = 0.045 if q % 2 == 0 else 0.019; aa = m + math.pi + q * math.pi / 5
                pts.append(c + V((rr_ * math.sin(aa), 0, rr_ * math.cos(aa))))
            for q in range(10): A.poly([c, pts[q], pts[(q + 1) % 10]], C['wtext'], (0, -1, 0))
        else: sphere_acc(A, er * 0.42 + V((0, f, 0)), 0.018, C['wtext'], 8, 4)
    # the rim, the hub, the back
    atorus(A, (0, f + 0.01, 0), (0, 1, 0), WR + 0.015, 0.03, lambda q: C['wrim'], 40, 8)
    acyl(A, (0, f, 0), (0, f - 0.05, 0), 0.075, lambda z: C['brass'], 16)
    acyl(A, (0, f - 0.05, 0), (0, f - 0.07, 0), 0.04, lambda z: C['wrim'], 12)
    acyl(A, (0, f + 0.002, 0), (0, f + 0.03, 0), WR, lambda z: C['wood_back'], 40, cap=False)
    return A.done(40)


# ---------- the people ----------
def person(P, x, y, h, top, legs, hat='beanie', seat=None, foot=0.0, arms=None, reach=None):
    """a figure from the worker's parts (arbeider.py): standing, or seated with the hips at seat + 0.1; arms {side: hand point in the
    figure's own frame (x right, y forward, z up from the floor)}; h turns it (0 = facing +y)"""
    out = []; R = mathutils.Matrix.Rotation(h, 4, 'Z'); T = mathutils.Matrix.Translation((x, y, 0))
    hip = WK.HIP if seat is None else seat + 0.1; dz = hip - WK.HIP; TT = T @ mathutils.Matrix.Translation((0, 0, dz))
    def cp(nm):
        o = P[nm].copy(); o.data = P[nm].data.copy(); link(o); o.hide_render = False; out.append(o)
        for i, m in enumerate(o.data.materials):
            if m and m.name == 'suit': o.data.materials[i] = top
            elif m and m.name == 'trousers': o.data.materials[i] = legs
        return o
    def put(o, M): o.matrix_world = M
    put(cp('sweater'), TT @ R); put(cp('head'), TT @ R)
    if hat: put(cp(hat), TT @ R)
    else:
        # short hair: the knitted cap's shape in the hair's colour, pushed down a little
        o = cp('beanie'); o.data.materials.clear(); o.data.materials.append(WK.C['hair']); Z = mathutils.Matrix.Translation((0, 0, 1.797)); put(o, TT @ R @ mathutils.Matrix.Translation((0, -0.008, 0.004)) @ Z @ mathutils.Matrix.Diagonal((1.04, 1.05, 0.68, 1)) @ Z.inverted())
    def seg(nm, a, b):
        a = V(a); b = V(b); d = b - a; L = d.length; q = V((0, 0, 1)).rotation_difference(d.normalized())
        put(cp(nm), T @ R @ mathutils.Matrix.Translation(a) @ q.to_matrix().to_4x4() @ mathutils.Matrix.Diagonal((1, 1, L, 1)))
    for s in (-1, 1):
        hp = (s * 0.11, 0, hip)
        if seat is None: knee = (s * 0.115, 0.03, 0.50); ft = (s * 0.12, 0.0, 0.08); bt = (s * 0.12, 0, 0)
        else: knee = (s * 0.13, 0.44, hip + 0.03); ft = (s * 0.14, 0.40 if foot else 0.5, foot + 0.08); bt = (ft[0], ft[1], foot)
        seg('thigh', hp, knee); seg('shin', knee, ft)
        put(cp('boot'), T @ R @ mathutils.Matrix.Translation(bt))
        sh = (s * WK.SHO[0], 0, WK.SHO[1] + dz); hd = arms[s] if arms and s in arms else (s * 0.26, 0.02 if seat is None else 0.18, 0.82 + dz)
        el = ((sh[0] + hd[0]) / 2 + s * 0.04, (sh[1] + hd[1]) / 2 - 0.05, (sh[2] + hd[2]) / 2 - 0.06)
        seg('uarm', sh, el); seg('farm', el, hd)
        d = (V(hd) - V(el)).normalized(); seg('hand', hd, tuple(V(hd) + d))
    return out

def people():
    P = WK.build_all()
    for o in P.values(): o.hide_render = True; o.hide_viewport = True
    KIT = [((0.12, 0.17, 0.30), (0.14, 0.15, 0.18)), ((0.45, 0.12, 0.10), (0.18, 0.20, 0.26)), ((0.42, 0.42, 0.40), (0.12, 0.13, 0.16)), ((0.18, 0.32, 0.22), (0.20, 0.17, 0.14)),
           ((0.55, 0.50, 0.42), (0.13, 0.14, 0.17)), ((0.10, 0.10, 0.12), (0.22, 0.22, 0.24)), ((0.70, 0.62, 0.48), (0.16, 0.16, 0.20))]
    M = [(mat('top%d' % i, t, 0.08), mat('legs%d' % i, l, 0.15)) for i, (t, l) in enumerate(KIT)]
    shirt = mat('bartender_shirt', (0.20, 0.27, 0.36), 0.15); apron = mat('apron', (0.10, 0.10, 0.11), 0.2)
    objs = []
    # the bartender behind the bar, facing the player, his hands on the counter
    objs += person(P, -0.15, 7.0, math.pi, shirt, apron, hat=None, arms={-1: (-0.28, 0.42, BT + 0.02), 1: (0.3, 0.38, BT + 0.02)})
    # two regulars on the stools, one with his beer up
    objs += person(P, -2.4, BF - 0.42, 0.12, *M[0], hat='beanie', seat=0.81, foot=0.22, arms={-1: (-0.16, 0.5, BT + 0.03), 1: (0.16, 0.42, BT + 0.03)})
    objs += person(P, 1.6, BF - 0.42, -0.25, *M[1], hat='skippercap', seat=0.81, foot=0.22, arms={-1: (-0.18, 0.48, BT + 0.03), 1: (0.14, 0.3, 1.38)})
    # the crew looking for a berth at the round table
    for k, (a, mi, hat) in enumerate(((math.pi / 4, 2, 'beanie'), (math.pi * 3 / 4, 3, None), (math.pi * 7 / 4, 4, 'beanie'))):
        cx = T_CREW[0] + 0.78 * math.cos(a); cy = T_CREW[1] + 0.78 * math.sin(a); h = a + math.pi / 2
        objs += person(P, cx - 0.0 * math.cos(a), cy, h, *M[mi], hat=hat, seat=0.47, arms={-1: (-0.16, 0.42, 0.77), 1: (0.17, 0.4, 0.77)})
    # two at cards
    for a, mi in ((0.3, 5), (math.pi + 0.3, 6)):
        cx = T_CARD[0] + 0.72 * math.cos(a); cy = T_CARD[1] + 0.72 * math.sin(a)
        objs += person(P, cx, cy, a + math.pi / 2, *M[mi], hat='beanie' if mi == 5 else None, seat=0.47, arms={-1: (-0.12, 0.36, 0.86), 1: (0.15, 0.4, 0.77)})
    return objs


# ---------- outside the windows: the harbour at dusk ----------
def outside(A):
    for (o, u, v, n) in (((-30, -12, -4), (60, 0, 0), (0, 0, 22), (0, 1, 0)), ((14, -20, -4), (0, 40, 0), (0, 0, 22), (-1, 0, 0)), ((-14, 30, -4), (0, -40, 0), (0, 0, 22), (1, 0, 0))):
        # a sky: light near the horizon, dark above
        nz = 11; o = V(o); u = V(u); v = V(v)
        for j in range(nz):
            t0 = j / nz; t1 = (j + 1) / nz; zc = o.z + v.z * (t0 + t1) / 2
            k = max(0.0, min(1.0, 1 - (zc - 0.0) / 14))
            m = mat('dusk%d' % j, (0.05 + 0.25 * k ** 2, 0.08 + 0.2 * k ** 2, 0.16 + 0.22 * k), 0.0, emit=1.0)
            panel(A, o + v * t0, u, v * (t1 - t0), 12, 1, lambda i, jj, m=m: m, n)
    panel(A, (-30, -12, -1.2), (60, 0, 0), (0, 40, 0), 6, 4, lambda i, j: C['water'], (0, 0, 1))
    abox(A, -14, 14, -3.5, 0, -1.2, -0.25, C['quay'])
    # hills across the water and the lights in the bygd
    hp = [(-30, -11.5)] + [(-30 + i * 2.5, -11.5) for i in range(25)]
    for i in range(24):
        xa = -30 + i * 2.5; xb = xa + 2.5; za = 1.2 + 1.6 * math.sin(xa * 0.21) + 0.7 * math.sin(xa * 0.57); zb = 1.2 + 1.6 * math.sin(xb * 0.21) + 0.7 * math.sin(xb * 0.57)
        A.poly([(xa, -11.5, -1.2), (xb, -11.5, -1.2), (xb, -11.5, zb), (xa, -11.5, za)], C['hill'], (0, 1, 0))
    for k in range(26):
        lx = rr.uniform(-26, 26); lz = rr.uniform(-0.9, 0.6)
        sphere_acc(A, (lx, -11.3, lz), rr.uniform(0.04, 0.08), C['light'], 6, 3)


# ---------- build, lights, bake ----------
def build():
    A = Acc('ROOM'); Gl = Acc('GLASS')
    floor(A); walls(A, Gl); ceiling(A); bar(A); back_bar(A)
    for x in (-2.4, -1.2, 0.0, 1.6):
        stool(A, x, BF - 0.42)
    tables(A); fireplace(A); lamps(A); walls_dressing(A); wheel_board(A); outside(A)
    glass_of_beer(A, EYE[0] + 0.05, BF + 0.16, BT)        # the player's own beer
    glass_of_beer(A, -2.3, BF + 0.12, BT, 0.5); glass_of_beer(A, 1.75, BF + 0.1, BT, 0.7)
    room = A.done(40); glass = Gl.done(40)
    figs = people()
    return room, glass, figs

def lights():
    L = []
    def pt(name, p, w, col, r=0.15):
        l = bpy.data.lights.new(name, 'POINT'); l.energy = w; l.color = col; l.shadow_soft_size = r
        o = link(bpy.data.objects.new(name, l)); o.location = p; L.append(o); return o
    for k, (x, y, z) in enumerate(LAMPS): pt('lamp%d' % k, (x, y, z + 0.02), 70, (1.0, 0.74, 0.46))
    for k, (x, y, z) in enumerate(TABLE_LAMPS): pt('tlamp%d' % k, (x, y, z + 0.02), 55, (1.0, 0.74, 0.46))
    for k, (x, y, z) in enumerate(SCONCES):
        nx = 1 if abs(x - X0) < 0.5 else -1 if abs(x - X1) < 0.5 else 0; ny = 1 if abs(y - Y0) < 0.5 else 0
        pt('sconce%d' % k, (x + nx * 0.08, y + ny * 0.08, z + 0.06), 22, (1.0, 0.72, 0.42))
    fire = pt('fire', (FIRE[0] + 0.45, (FIRE[1] + FIRE[2]) / 2, 0.35), 160, (1.0, 0.5, 0.18), 0.2)
    # a warm strip under the top shelf of the back bar, so the bottles glow
    l = bpy.data.lights.new('backbar', 'AREA'); l.energy = 40; l.color = (1.0, 0.8, 0.55); l.shape = 'RECTANGLE'; l.size = BX1 - BX0 - 1.0; l.size_y = 0.1
    o = link(bpy.data.objects.new('backbar', l)); o.location = ((BX0 + BX1) / 2, Y1 - 0.2, 2.05); o.rotation_euler = (0, 0, 0); L.append(o)
    w = bpy.context.scene.world or bpy.data.worlds.new('w'); bpy.context.scene.world = w; w.use_nodes = True
    bg = w.node_tree.nodes.get('Background'); bg.inputs['Color'].default_value = (0.02, 0.025, 0.04, 1); bg.inputs['Strength'].default_value = 1.0
    # glass lets the light through in the renders and the bake
    g = MATS['pub_glass']; b = g.node_tree.nodes.get('Principled BSDF'); b.inputs['Transmission Weight'].default_value = 1.0; b.inputs['Roughness'].default_value = 0.05
    return L, fire

def white_tint(o):
    if 'TINT' not in o.data.color_attributes:
        lay = o.data.color_attributes.new('TINT', 'FLOAT_COLOR', 'CORNER')
        for d in lay.data: d.color = (1.0, 1.0, 1.0, 1.0)

def bake(o, name, samples):
    sc = bpy.context.scene; sc.cycles.samples = samples; sc.cycles.use_denoising = False
    me = o.data
    if name not in me.color_attributes: me.color_attributes.new(name, 'FLOAT_COLOR', 'CORNER')
    me.color_attributes.active_color = me.color_attributes[name]
    for p in sc.objects: p.select_set(False)
    o.select_set(True); bpy.context.view_layer.objects.active = o
    bpy.ops.object.bake(type='COMBINED', pass_filter={'DIRECT', 'INDIRECT', 'DIFFUSE', 'EMIT', 'TRANSMISSION'}, target='VERTEX_COLORS')

EMITS = {}
def emissions(on):
    """switch every emitting material off (for the fire's own bake) or back on, except the fire's"""
    for m in bpy.data.materials:
        if not m.use_nodes: continue
        b = m.node_tree.nodes.get('Principled BSDF')
        if b is None: continue
        if m.name not in EMITS: EMITS[m.name] = b.inputs['Emission Strength'].default_value
        fire = m.get('zone', 0) == 4
        b.inputs['Emission Strength'].default_value = EMITS[m.name] if (on or fire) else 0.0


# ---------- export: colours from the bake, smoothed and toned for the screen ----------
def smooth_bake(o, names=('BAKE', 'FIRE'), passes=2):
    """the bake is per face corner, each with its own samples: corners at one place facing one way are made one, then smoothed a little
    over the mesh towards neighbours facing the same way, so the boards and panels do not come out in blotches"""
    me = o.data; me.calc_loop_triangles()
    grp = {}; lg = [0] * len(me.loops); gv = []; gn = []
    for li, l in enumerate(me.loops):
        co = me.vertices[l.vertex_index].co; n = me.corner_normals[li].vector
        k = (round(co.x, 3), round(co.y, 3), round(co.z, 3), round(n.x, 1), round(n.y, 1), round(n.z, 1))
        if k not in grp: grp[k] = len(gv); gv.append(l.vertex_index); gn.append(V(n))
        lg[li] = grp[k]
    G = len(gv)
    # neighbours: the groups at the two ends of each edge that face nearly the same way
    by_v = {}
    for g in range(G): by_v.setdefault(gv[g], []).append(g)
    pos_v = {}
    for v in me.vertices: pos_v.setdefault((round(v.co.x, 3), round(v.co.y, 3), round(v.co.z, 3)), []).append(v.index)
    nb = [[] for _ in range(G)]
    for e in me.edges:
        a_, b_ = e.vertices
        for ga in by_v.get(a_, []):
            for gb in by_v.get(b_, []):
                if gn[ga].dot(gn[gb]) > 0.85: nb[ga].append(gb); nb[gb].append(ga)
    for nm in names:
        A = me.color_attributes.get(nm)
        if A is None: continue
        acc = [[0.0, 0.0, 0.0, 0] for _ in range(G)]
        for li, d in enumerate(A.data):
            c = d.color; q = acc[lg[li]]; q[0] += c[0]; q[1] += c[1]; q[2] += c[2]; q[3] += 1
        col = [(q[0] / q[3], q[1] / q[3], q[2] / q[3]) if q[3] else (0, 0, 0) for q in acc]
        for _ in range(passes):
            new = []
            for g in range(G):
                if not nb[g]: new.append(col[g]); continue
                m = [sum(col[h][k] for h in nb[g]) / len(nb[g]) for k in range(3)]
                new.append(tuple(col[g][k] * 0.5 + m[k] * 0.5 for k in range(3)))
            col = new
        for li, d in enumerate(A.data):
            c = col[lg[li]]; d.color = (c[0], c[1], c[2], 1.0)

def tone(x):
    # a soft shoulder, then to display
    y = x * (1 + x / 6.0) / (1 + x)
    return max(0.0, min(1.0, y)) ** (1 / 2.2)

def lum(c): return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]

def to_game(p): return (p[0], p[2], -p[1])
def to_game_n(n): return (n[0], n[2], -n[1])

def baked_arrays(o, xf_p, xf_n, expo, fire=True, shift=(0, 0, 0)):
    me = o.data; me.calc_loop_triangles(); M = o.matrix_world; R = M.to_3x3()
    B = me.color_attributes['BAKE']; F = me.color_attributes.get('FIRE') if fire else None
    slots = [s.material for s in o.material_slots]
    pos = []; nor = []; col = []; pnt = []; idx = []; seen = {}
    for t in me.loop_triangles:
        m = slots[t.material_index] if slots else None
        gl = m['gloss'] if m and 'gloss' in m else 0.3; zn = m['zone'] if m and 'zone' in m else 0
        rgb = m['rgb'] if m and 'rgb' in m else (0.5, 0.5, 0.5)
        for li in t.loops:
            l = me.loops[li]; p = xf_p(M @ me.vertices[l.vertex_index].co - V(shift)); n = xf_n((R @ me.corner_normals[li].vector).normalized())
            b = B.data[li].color
            # a floor of light by the colour: corners hidden inside other parts (a neck in its collar) come out black in the bake, and
            # the faces they belong to would carry the black out into sight
            fl = [(rgb[k] ** 2.2) * 0.3 / expo for k in range(3)]
            b = [max(b[k], fl[k]) for k in range(3)]
            c = (int(round(tone(b[0] * expo) * 255)), int(round(tone(b[1] * expo) * 255)), int(round(tone(b[2] * expo) * 255)), int(round(gl * 255)))
            fr = 0
            if F is not None:
                f = F.data[li].color; fr = int(round(max(0.0, min(1.0, lum(f) / max(1e-4, lum(b)))) * 255))
            key = (round(p[0], 4), round(p[1], 4), round(p[2], 4), round(n[0], 2), round(n[1], 2), round(n[2], 2), c, zn, fr)
            if key not in seen:
                seen[key] = len(pos); pos.append(p); nor.append(n); col.append(c); pnt.append((zn, fr, 0, 0))
            idx.append(seen[key])
    return {'pos': pos, 'nor': nor, 'col': col, 'pnt': pnt, 'idx': idx}

def exposure(o):
    B = o.data.color_attributes['BAKE']; L = sorted(lum(d.color) for d in B.data)
    p = L[int(len(L) * 0.9)]
    return float(os.environ.get('PUB_EXPO_K', '0.55')) / max(p, 1e-4)

def G(p): return [round(v, 3) for v in to_game(p)]

def anchors():
    tot = sum(w for _, w in WHEEL); a = 0.0; segs = []
    for k, w in WHEEL: segs.append([k, round(a, 3), round(a + w / tot * 360, 3)]); a += w / tot * 360
    x0, x1, y, z0, z1 = SIGN; bx, by0, by1, bz0, bz1 = BOARD; cx, cy0, cy1, cz0, cz1 = CHALK
    return {'eye': G(EYE), 'look': G((EYE[0], EYE[1] + 1, EYE[2] - 0.08)),
            'wheel': {'c': G((WC[0], WC[1], WC[2])), 'r': WR, 'segs': segs},
            'sign': [G((x0, y - 0.045, z0)), G((x1, y - 0.045, z0)), G((x1, y - 0.045, z1)), G((x0, y - 0.045, z1))],
            # what can be tapped: [name, middle, radius]
            'spots': [['wheel', G(WC), WR + 0.1], ['bartender', G((-0.15, 7.0, 1.45)), 0.42], ['board', G((bx, (by0 + by1) / 2, (bz0 + bz1) / 2)), 0.7],
                      ['crew', G((T_CREW[0], T_CREW[1], 0.95)), 1.0], ['lag', G((T_LAG[0], T_LAG[1], 0.9)), 1.0], ['quiz', G((cx, (cy0 + cy1) / 2, (cz0 + cz1) / 2)), 0.6],
                      ['cards', G((T_CARD[0], T_CARD[1], 0.95)), 0.9], ['door', G(((DOOR[0] + DOOR[1]) / 2, Y0, 1.1)), 0.7], ['fire', G((FIRE[0] + 0.4, (FIRE[1] + FIRE[2]) / 2, 0.5)), 0.6]],
            'fire': G((FIRE[0] + 0.4, (FIRE[1] + FIRE[2]) / 2, 0.4))}


SHOTS = [('bar', EYE, (EYE[0], EYE[1] + 3, EYE[2] - 0.15), 24), ('wheel', EYE, (WC[0], WC[1], WC[2]), 26), ('room', EYE, (EYE[0] - 1.0, 0.0, 1.1), 20),
         ('fire', EYE, (FIRE[0], (FIRE[1] + FIRE[2]) / 2, 1.0), 24), ('board', EYE, (BOARD[0], (BOARD[1] + BOARD[2]) / 2, 1.4), 24), ('over', (4.8, 0.6, 2.5), (-1.0, 6.0, 0.9), 16)]

def renders(prefix):
    sc = bpy.context.scene; sc.render.resolution_x = 1280; sc.render.resolution_y = 720; sc.render.resolution_percentage = 100
    sc.cycles.samples = 96; sc.cycles.use_denoising = True; sc.view_settings.view_transform = 'AgX'; sc.view_settings.exposure = 0.6
    for nm, loc, look, lens in SHOTS:
        camera(loc, look, lens=lens); bpy.context.scene.camera.data.clip_start = 0.05; render(os.path.join(OUT, '%s_%s.png' % (prefix, nm)))

def game_look(room, figs_joined, glass, expo):
    """renders of the baked vertex colours as the game shows them (emission of the toned colours, no lights)"""
    sc = bpy.context.scene
    m = bpy.data.materials.new('baked'); m.use_nodes = True; nt = m.node_tree; nt.nodes.clear()
    at = nt.nodes.new('ShaderNodeAttribute'); at.attribute_name = 'SHOW'; em = nt.nodes.new('ShaderNodeEmission'); out = nt.nodes.new('ShaderNodeOutputMaterial')
    nt.links.new(at.outputs['Color'], em.inputs['Color']); nt.links.new(em.outputs['Emission'], out.inputs['Surface'])
    for o in (room,):
        me = o.data; B = me.color_attributes['BAKE']; S_ = me.color_attributes.new('SHOW', 'FLOAT_COLOR', 'CORNER')
        for i, d in enumerate(B.data):
            S_.data[i].color = tuple(tone(d.color[k] * expo) ** 2.2 for k in range(3)) + (1.0,)
        me.materials.clear(); me.materials.append(m)
    glass.hide_render = True
    for l in [x for x in sc.objects if x.type == 'LIGHT']: l.hide_render = True
    sc.world.node_tree.nodes.get('Background').inputs['Strength'].default_value = 0.0
    sc.view_settings.view_transform = 'Standard'; sc.view_settings.exposure = 0.0; sc.cycles.samples = 8; sc.cycles.use_denoising = False
    for nm, loc, look, lens in SHOTS[:4]:
        camera(loc, look, lens=lens); bpy.context.scene.camera.data.clip_start = 0.05; render(os.path.join(OUT, 'pubgame_%s.png' % nm))


def main():
    os.makedirs(OUT, exist_ok=True)
    if 'retone' in sys.argv:
        # the bake kept from the last run: only the smoothing, the tone and the export again
        bpy.ops.wm.open_mainfile(filepath=os.path.join(OUT, 'pub_baked.blend'))
        for m in bpy.data.materials:
            if 'rgb' in m: MATS[m.name] = m
        return export(bpy.data.objects['ROOM'], bpy.data.objects['WHEEL'], bpy.data.objects['GLASS'])
    reset(); colours()
    room, glass, figs = build()
    wh = wheel(); wh.location = V((WC[0], WC[1], WC[2]))
    L, fire = lights()
    for o in [room, glass, wh] + figs: white_tint(o)
    if 'look' in sys.argv or 'fast' not in sys.argv:
        renders('pub')
        if 'look' in sys.argv: return
    # one object for the room with its people; the wheel on its own
    room = join([room] + figs, 'ROOM'); white_tint(room)
    glass.hide_render = False
    sm = int(os.environ.get('PUB_SAMPLES', '160'))
    emissions(True); bake(room, 'BAKE', sm); bake(wh, 'BAKE', sm // 2)
    # the fire's own share: every other light and emission off
    for l in L: l.data['e0'] = l.data.energy; l.data.energy = l.data.energy if l is fire else 0.0
    sc = bpy.context.scene; bg = sc.world.node_tree.nodes.get('Background'); b0 = bg.inputs['Strength'].default_value; bg.inputs['Strength'].default_value = 0.0
    emissions(False); bake(room, 'FIRE', sm // 2)
    for l in L: l.data.energy = l.data['e0']
    bg.inputs['Strength'].default_value = b0; emissions(True)
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT, 'pub_baked.blend'))
    export(room, wh, glass)

def dim_sky(o, k=0.12):
    """the dusk outside the windows: the bake sees it as bright as the lamps; in the game it is a deep evening blue"""
    me = o.data; B = me.color_attributes['BAKE']; slots = [s.material for s in o.material_slots]
    for p_ in me.polygons:
        m = slots[p_.material_index] if slots else None
        if m and (m.name.startswith('dusk') or m.name in ('harbour_water', 'hill', 'quay')):
            for li in p_.loop_indices:
                c = B.data[li].color; B.data[li].color = (c[0] * k, c[1] * k, c[2] * k * 1.15, 1.0)

def export(room, wh, glass):
    smooth_bake(room); smooth_bake(wh, ('BAKE',)); dim_sky(room)
    expo = exposure(room)
    AR = baked_arrays(room, to_game, to_game_n, expo)
    AW = baked_arrays(wh, to_game, to_game_n, expo, fire=False, shift=WC)
    # the glass: a faint cool tint over what is outside
    AG = mesh_arrays(glass, to_game, to_game_n, ao=False)
    ex = {'frame': 'kystfiske pub: x right, y up from the floor, z towards the player (the eye looks along -z); metres. Colours are baked light, toned for the screen; _PAINT[1] is the fire\'s share of the light, zone 4 the flames',
          'name': 'Puben', 'anchors': anchors(), 'expo': round(expo, 4)}
    glb = os.path.join(OUT, 'pub.glb')
    n = write_glb(glb, [('room', AR, 1.0), ('glass', AG, 0.25), ('wheel', AW, 1.0)], ex)
    import base64
    if 'dry' not in sys.argv: open(os.path.join(ROOT, 'src', 'data', 'pub.b64'), 'w').write(base64.b64encode(open(glb, 'rb').read()).decode())
    print('pub GLB %.0f KB: room %d tris / %d verts, glass %d tris, wheel %d tris; exposure %.3f' % (n / 1024, len(AR['idx']) // 3, len(AR['pos']), len(AG['idx']) // 3, len(AW['idx']) // 3, expo))
    if 'fast' not in sys.argv: game_look(room, None, glass, expo)


if __name__ == '__main__':
    main()
