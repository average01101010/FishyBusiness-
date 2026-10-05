"""A red rorbu on stilts with its own small pile quay, where one boat can moor (Jonas 05.10.2026, with a photo of a classic Lofoten
rorbu at Reine). Built in Blender like the old naust (naust.py), the harbour unit (kaimottak.py) and the shop (butikk.py).

What it is: a one-and-a-half storey fisherman's cabin, 6.5 m wide and 8 m deep, its gable to the sea, standing on round timber
stilts over the rocky shore with its floor 0.8 m above the quay deck. Falu-red board-and-batten cladding (one material, 'clad', in
paint zone 1, so the game can paint it ochre or white), white corner boards, barge boards and fascia, white windows with mullions
(2x3 and 2x2 panes) and curtains behind them, a small attic window in each gable, the door in the sea gable in its white casing (a
red leaf with a small diamond window) and a lantern beside it. A grey steel-sheet roof at 38 degrees with its overhangs, the ridge
cap, snow guards and a roof ladder up to the black chimney with its cap, and a rooster weather vane on the sea end of the ridge. The
veranda (altan) on stilts along the sea gable and down the east side, with its railing, two tall poles with a rope and floats
hanging from it, a small table and a bench, rubber boots by the door; wooden stairs from it down to the quay. In front, the pile
quay: a deck of planks on bents of three piles with X bracing, a kerb, two wooden bollards, a ladder, fender piles and old tyres,
the piles dark and weedy in the tidal zone. The bank of rocks and rockweed under it all runs up to grass behind.

    pip install bpy==4.5.4
    python3 tools/harbour/rorbu.py          -> src/data/harbour-rorbu.b64, renders in tools/harbour/out/
    python3 tools/harbour/rorbu.py fast     -> without the renders to look at
    python3 tools/harbour/rorbu.py dry      -> the GLB only in tools/harbour/out

Frame as in naust.py: x along the quay face (x = 0 is the berth's middle), the face at y = 0, y inland, z up from mean sea level.
In the game: x along the face, y up, z out to sea."""
import os, sys, math, random
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))
sys.path.insert(0, os.path.join(ROOT, 'tools', 'boats'))
import bpy, bmesh
from mathutils import Vector as V
from bpyutil import *

OUT = os.path.join(HERE, 'out')
QTOP = 2.4                                   # the quay deck above mean sea level, as QTOP in 07-harbours.js
QUAY = (-7.0, 7.0, 0.0, 3.5)                 # the pile quay: x0, x1, the face, its back against the veranda
RX0, RX1, RY0, RY1 = -3.25, 3.25, 5.2, 13.2  # the cabin's walls (the sea gable at RY0)
XC = (RX0 + RX1) / 2; HW = (RX1 - RX0) / 2
FLOOR = QTOP + 0.8                           # its floor
WALLB = FLOOR - 0.32                         # where the cladding ends below
EAVES = FLOOR + 3.0                          # one and a half storeys: the ground floor and a knee wall under the eaves
A38 = math.radians(38); TP = math.tan(A38)   # the roof's pitch
RIDGE = EAVES + HW * TP
RL = 0.12                                    # the roof's top over the walls' line
OHE, OHG = 0.45, 0.375                       # the roof's overhang over the eaves and the gables
YA, YB = RY0 - OHG, RY1 + OHG                # the roof's ends
VFLOOR = FLOOR - 0.05                        # the veranda's deck, a step down from the door
VX0, VX1, VY0, VYS = RX0 - 0.2, RX1 + 1.5, 3.5, RY0 + 3.4   # the veranda: west end, east edge, front edge, the side part's end
STAIR = (VX0 + 0.13, VX0 + 1.03)             # the stairs down to the quay at the veranda's west end: x0, x1
NRISE = 4; RUN = 0.27                        # its risers and the run of a tread
POLES = [(VX1 - 0.08, VY0 + 0.08), (VX1 - 0.08, VYS - 0.08)]  # the two tall poles at the veranda's east corners
POLE_TOP = VFLOOR + 2.9
BENTS = [-6.75 + 2.25 * k for k in range(7)] # the quay's pile bents along x
PILE_Y = (0.3, 1.75, 3.2)
BOLL = [(-5.6, 0.5), (5.6, 0.5)]
LADDER = 3.35
TYRES = (-3.4, 1.15, 5.6)
LAMP = (XC + 0.8, RY0 - 0.2, FLOOR + 2.1)    # the lantern by the door (its light)
CHIM = (XC - 0.62, RY0 + 5.2, 0.5)           # the chimney: x, y, its side
TCUTS = (-0.6, 0.0, 1.15, 1.3, 1.6)          # the tidal bands on the piles and stilts: dark and weedy up to 1.6 m
# the windows: wall, where along it (x or y), sill, width, height, panes across and up
WINS = [('front', XC - 1.85, FLOOR + 0.8, 0.86, 1.24, 2, 3), ('front', XC + 1.85, FLOOR + 0.8, 0.86, 1.24, 2, 3), ('front', XC, EAVES + 0.42, 0.66, 0.84, 2, 2),
        ('east', RY0 + 1.7, FLOOR + 0.8, 0.86, 1.24, 2, 3), ('east', RY0 + 4.5, FLOOR + 0.8, 0.86, 1.24, 2, 3), ('east', RY0 + 6.8, FLOOR + 1.15, 0.7, 0.86, 2, 2),
        ('west', RY0 + 1.7, FLOOR + 0.8, 0.86, 1.24, 2, 3), ('west', RY0 + 4.1, FLOOR + 1.15, 0.7, 0.86, 2, 2), ('west', RY0 + 6.4, FLOOR + 0.8, 0.86, 1.24, 2, 3),
        ('back', XC + 1.3, FLOOR + 1.0, 0.7, 0.9, 2, 2), ('back', XC, EAVES + 0.42, 0.66, 0.84, 2, 2)]
DOOR = (XC, 0.9, 2.0)                        # the door in the sea gable: middle x, width, height
C = {}


def colours():
    # zone 2: takes snow where it faces up (rock above the high water, the roof); zone 3: grass and heather, snow on it and straw-coloured
    # tufts in winter (view3d.js siteSnow)
    Z = {'roof': 2, 'rock1': 2, 'rock2': 2, 'lichrock': 2, 'grass': 3, 'grass2': 3, 'heather': 3}
    w = lambda n, rgb, g=0.12: C.__setitem__(n, mat(n, rgb, g, zone=Z.get(n, 0)))
    C['clad'] = mat('clad', (0.55, 0.09, 0.07), 0.2, zone=1)    # all the red cladding (the game repaints zone 1)
    w('trim', (0.92, 0.91, 0.87), 0.3); w('door', (0.40, 0.065, 0.055), 0.35)
    w('roof', (0.30, 0.31, 0.32), 0.35); w('flash', (0.17, 0.175, 0.18), 0.35); w('soffit', (0.36, 0.32, 0.27), 0.1)
    w('chim', (0.07, 0.07, 0.075), 0.2); w('iron', (0.09, 0.09, 0.095), 0.4)
    w('inside', (0.06, 0.05, 0.045), 0.05); w('curtain', (0.86, 0.85, 0.80), 0.1); C['glass'] = mat('glass', (0.07, 0.09, 0.10), 0.9)
    w('deck', (0.46, 0.41, 0.34)); w('deck2', (0.41, 0.365, 0.305)); w('deckdk', (0.13, 0.115, 0.10), 0.05)
    w('stilt', (0.25, 0.22, 0.19), 0.1); w('pole', (0.50, 0.48, 0.44)); w('sark', (0.17, 0.15, 0.13), 0.05)
    w('w1', (0.44, 0.425, 0.395)); w('w2', (0.36, 0.345, 0.32)); w('w3', (0.50, 0.48, 0.445)); w('w4', (0.31, 0.295, 0.27))
    w('w5', (0.41, 0.365, 0.31)); w('wdark', (0.22, 0.21, 0.195)); w('wwet', (0.17, 0.16, 0.14), 0.3)
    w('rock1', (0.31, 0.30, 0.28)); w('rock2', (0.25, 0.245, 0.235)); w('rock3', (0.37, 0.355, 0.33)); w('lichrock', (0.45, 0.43, 0.34))
    w('weed', (0.40, 0.33, 0.10), 0.35); w('weed2', (0.25, 0.22, 0.08), 0.35); w('barn', (0.48, 0.47, 0.43)); w('barn2', (0.34, 0.33, 0.30)); w('slime', (0.17, 0.19, 0.10), 0.4)
    w('grass', (0.31, 0.39, 0.17), 0.05); w('grass2', (0.40, 0.43, 0.20), 0.05); w('heather', (0.30, 0.25, 0.20), 0.05)
    w('flower', (0.90, 0.90, 0.86), 0.1)
    w('rope', (0.55, 0.48, 0.35)); w('tyre', (0.05, 0.05, 0.05), 0.2)
    w('orange', (0.95, 0.40, 0.06), 0.5); w('fwhite', (0.88, 0.88, 0.85), 0.4); w('boot', (0.12, 0.22, 0.13), 0.4)
    w('crate', (0.12, 0.33, 0.62), 0.4); w('crate2', (0.55, 0.58, 0.60), 0.4)
    C['lamp'] = mat('lamp', (1.0, 0.86, 0.6), 0.6, emit=0.6)


# (Acc, obox, abox, beam, board, acyl, arock and atorus are in bpyutil.py, shared with the boats)
def frange(a, b, st):
    out = []; x = a
    while x < b - 1e-6: out.append(x); x += st
    return out

def xprism(A, poly, x0, x1, m):
    """a prism along x from a convex polygon [(y, z)]: its two ends and its sides"""
    n = len(poly); a = [A.v((x0, y, z)) for y, z in poly]; b = [A.v((x1, y, z)) for y, z in poly]
    cy = sum(p[0] for p in poly) / n; cz = sum(p[1] for p in poly) / n
    A.f(a, m, (-1, 0, 0)); A.f(b, m, (1, 0, 0))
    for i in range(n):
        j = (i + 1) % n; A.f([a[i], a[j], b[j], b[i]], m, (0, (poly[i][0] + poly[j][0]) / 2 - cy, (poly[i][1] + poly[j][1]) / 2 - cz))

def plate2(A, pts, n, t, m):
    """a flat plate from a polygon (any shape) facing n, t thick: both faces and its rim"""
    n = V(n); P = [V(p) for p in pts]; Q = [p - n * t for p in P]; c = sum(P, V()) / len(P)
    A.f([A.v(p) for p in P], m, n); A.f([A.v(q) for q in Q], m, -n)
    for i in range(len(P)):
        j = (i + 1) % len(P); A.poly([P[i], P[j], Q[j], Q[i]], m, (P[i] + P[j]) / 2 - c)


# ---------- the ground: the bank of rock and rockweed up to the grass ----------
def interp1(tab, x):
    if x <= tab[0][0]: return tab[0][1]
    for (a, va), (b, vb) in zip(tab, tab[1:]):
        if x <= b: return va + (vb - va) * (x - a) / (b - a)
    return tab[-1][1]

BANK = [(-3.0, -2.9), (0.0, -2.6), (1.5, -1.6), (3.4, -0.45), (5.2, 0.55), (7.4, 1.3), (9.6, 1.8), (12.0, 2.15), (14.0, 2.5), (16.5, 3.0), (21.0, 3.8)]
BX, BY0, BY1 = 16.0, -3.0, 21.0              # the bank's half width and its ends
def noise(x, y): return 0.12 * math.sin(1.3 * x + 0.7 * y) * math.cos(0.9 * y - 0.4 * x) + 0.06 * math.sin(3.1 * x + 2.3 * y + 1.0)
def bankz(x, y):
    z = interp1(BANK, y) + noise(x, y); ax = abs(x)
    if ax > 12.0:
        t = min(1.0, (ax - 12.0) / 4.0); t = t * t * (3 - 2 * t); z += (min(z, interp1(BANK, y) - 1.2) - z) * t
    return z

def under_house(x, y, pad=0.3): return RX0 - pad < x < RX1 + pad and RY0 - pad < y < RY1 + pad

def ground_mat(z, x, y):
    if z < -0.6: return C['weed2']
    if z < 1.2: return C['weed'] if noise(x * 2.1, y * 1.7) > -0.08 else C['weed2']
    if z < 1.62: return C['barn'] if noise(x * 1.9 + 5, y * 2.7) > 0.07 else C['rock3']
    if z < QTOP + 0.05 or under_house(x, y, 0.6): return C['rock1'] if noise(x * 1.1 + 3, y * 1.3) > -0.02 else C['rock2']
    k = noise(x * 0.9 + 7, y * 1.3)
    return C['grass'] if k > -0.02 else C['grass2'] if k > -0.15 else C['heather']

def bank(A, fine=True):
    rr = random.Random(3); nx, ny = (28, 30) if fine else (16, 12)
    xs = [-BX + 2 * BX * i / nx for i in range(nx + 1)]; ys = [BY0 + (BY1 - BY0) * j / ny for j in range(ny + 1)]
    G = [[A.v((x, y, bankz(x, y) + (rr.uniform(-0.04, 0.04) if fine else 0.0))) for y in ys] for x in xs]
    for i in range(len(xs) - 1):
        for j in range(len(ys) - 1):
            q = [G[i][j], G[i + 1][j], G[i + 1][j + 1], G[i][j + 1]]; cz = sum(v.co.z for v in q) / 4
            A.f(q, ground_mat(cz, (xs[i] + xs[i + 1]) / 2, (ys[j] + ys[j + 1]) / 2), (0, 0, 1))
    if not fine: return
    # boulders along the shore, weedy below the high-water line, lichen on their tops above it; smaller under the house
    def mf(cen, nrm):
        if cen.z < 1.2: return C['weed'] if cen.z > -0.4 else C['weed2']
        if cen.z < 1.62: return C['barn'] if rr.random() < 0.6 else C['rock3']
        return C['lichrock'] if nrm.z > 0.65 and rr.random() < 0.5 else rr.choice((C['rock1'], C['rock2'], C['rock3']))
    for k in range(30):
        if k < 22: x = rr.uniform(-14.0, 14.0); y = rr.uniform(0.6, 9.5); r = rr.uniform(0.22, 0.8)
        else: x = rr.uniform(-13.0, 13.0); y = rr.uniform(14.5, 20.0); r = rr.uniform(0.15, 0.5)
        if under_house(x, y, 0.0) and r > 0.45: r = 0.45
        arock(A, (x, y, bankz(x, y) - 0.25 * r), r, (rr.uniform(0.9, 1.3), rr.uniform(0.8, 1.2), rr.uniform(0.5, 0.75)), rr, mf, 1 if r > 0.5 else 0)
    # tufts of grass and a few cow parsley heads on the bank behind
    for k in range(34):
        x = rr.uniform(-13.0, 13.0); y = rr.uniform(10.0, 20.5)
        if under_house(x, y, 0.6) or (RX1 < x < VX1 + 0.3 and y < VYS + 0.3): continue
        z = bankz(x, y)
        if z < QTOP + 0.05: continue
        m = rr.choice((C['grass'], C['grass2'], C['grass2']))
        for b in range(5):
            a = rr.uniform(0, 2 * math.pi); h = rr.uniform(0.25, 0.55); lx, ly = math.cos(a) * 0.1, math.sin(a) * 0.1
            base = V((x + lx, y + ly, z - 0.02)); tip = base + V((lx * 1.6, ly * 1.6, h)); s = V((-ly, lx, 0)).normalized() * 0.025
            A.poly((base - s, base + s, tip), m)
        if k % 5 == 0:
            for b in range(3):
                bx, by = x + rr.uniform(-0.3, 0.3), y + rr.uniform(-0.3, 0.3); h = rr.uniform(0.7, 1.1)
                acyl(A, (bx, by, z), (bx, by, z + h), 0.012, lambda zz: C['grass'], 4, cap=False)
                arock(A, (bx, by, z + h), 0.09, (1.4, 1.4, 0.45), rr, lambda c_, n_: C['flower'], 0)


# ---------- the quay on piles ----------
def tidal(zz):
    return C['wwet'] if zz < -0.6 else C['slime'] if zz < 0.0 else C['weed2'] if zz < 1.15 else C['barn2'] if zz < 1.3 else C['wwet'] if zz < 1.6 else C['w4']
def stiltm(zz): return tidal(zz) if zz < 1.6 else C['stilt']

def quay(A, fine=True):
    rr = random.Random(5); x0, x1, y0, y1 = QUAY
    if not fine:
        abox(A, x0, x1, y0, y1, QTOP - 0.5, QTOP, C['w2'])
        abox(A, x0, x1, 0.0, 0.17, QTOP, QTOP + 0.15, C['w4'])
        for xb in BENTS[::2]:
            for py in (PILE_Y[0], PILE_Y[2]): abox(A, xb - 0.15, xb + 0.15, py - 0.15, py + 0.15, bankz(xb, py) - 0.2, QTOP - 0.5, C['wwet'])
        for bx, by in BOLL: abox(A, bx - 0.15, bx + 0.15, by - 0.15, by + 0.15, QTOP, QTOP + 0.7, C['w2'])
        return
    # the deck: planks from the face to the back, 0.2 m apart with gaps, the tones of old grey wood
    tones = (C['w1'], C['w2'], C['w3'], C['w4'], C['w5'], C['w1'])
    n = int(round((x1 - x0) / 0.2)); pw = (x1 - x0) / n
    for k in range(n):
        xa = x0 + k * pw + 0.008; xb = xa + pw - 0.016; m = rr.choice(tones); zt = QTOP + rr.uniform(-0.006, 0.006)
        ya = rr.uniform(-0.01, 0.02); yb = y1 - rr.uniform(0.0, 0.02)
        A.poly([(xa, ya, zt), (xb, ya, zt), (xb, yb, zt), (xa, yb, zt)], m, (0, 0, 1))
        A.poly([(xa, ya, zt), (xb, ya, zt), (xb, ya, zt - 0.05), (xa, ya, zt - 0.05)], C['wdark'], (0, -1, 0))
        if k in (0, n - 1):
            xs = xa if k == 0 else xb
            A.poly([(xs, ya, zt), (xs, yb, zt), (xs, yb, zt - 0.05), (xs, ya, zt - 0.05)], C['wdark'], (-1 if k == 0 else 1, 0, 0))
    # under the deck: the stringers along it, the face beam, the caps of the bents; the kerb along the face
    for sy in (0.3, 1.25, 2.2, 3.15): abox(A, x0, x1, sy - 0.08, sy + 0.08, QTOP - 0.3, QTOP - 0.05, C['w4'], skip=('+z',))
    abox(A, x0, x1, 0.0, 0.15, QTOP - 0.36, QTOP - 0.05, C['wdark'], skip=('+z',))
    for xb in BENTS: abox(A, xb - 0.12, xb + 0.12, -0.05, y1 - 0.05, QTOP - 0.55, QTOP - 0.3, C['w4'])
    for ka, kb in ((x0 + 0.04, LADDER - 0.42), (LADDER + 0.42, x1 - 0.04)): abox(A, ka, kb, 0.0, 0.17, QTOP - 0.01, QTOP + 0.15, C['w4'])
    # the piles: three to a bent; X bracing on every other bent; a fender pile in front of each
    for i, xb in enumerate(BENTS):
        for py in PILE_Y:
            dx, dy = rr.uniform(-0.04, 0.04), rr.uniform(-0.04, 0.04)
            acyl(A, (xb + dx, py + dy, bankz(xb, py) - 0.4), (xb, py, QTOP - 0.55), rr.uniform(0.13, 0.16), tidal, 6, cuts=TCUTS)
        if i % 2 == 1:
            xx = xb + 0.17; za, zb = -0.6, QTOP - 0.62
            beam(A, (xx, PILE_Y[0], za), (xx, PILE_Y[2], zb), 0.18, 0.05, C['w4'], up=(1, 0, 0))
            beam(A, (xx + 0.05, PILE_Y[2], za), (xx + 0.05, PILE_Y[0], zb), 0.18, 0.05, C['w4'], up=(1, 0, 0))
        fx = xb + rr.uniform(-0.03, 0.03)
        acyl(A, (fx, -0.17, bankz(fx, -0.2) - 0.4), (fx, -0.17, QTOP + 0.3), 0.14, tidal, 6, cuts=TCUTS)
    # a waling along the face piles, at half tide
    abox(A, x0 + 0.1, x1 - 0.1, 0.03, 0.15, 0.6, 0.82, C['weed2'])
    # wooden bollards through the deck, darker at the top with an iron band
    for bx, by in BOLL:
        acyl(A, (bx, by, QTOP - 0.5), (bx, by, QTOP + 0.7), 0.16, lambda zz: C['w2'] if zz < QTOP + 0.5 else C['wdark'], 10, cuts=(QTOP + 0.5,))
        acyl(A, (bx, by, QTOP + 0.4), (bx, by, QTOP + 0.48), 0.17, lambda zz: C['iron'], 10)
    # the ladder down the face: two rails bent over the kerb, rungs, slimy below the high-water mark
    lm = lambda zz: C['slime'] if zz < 1.5 else C['w2']
    for lx in (LADDER - 0.25, LADDER + 0.25):
        acyl(A, (lx, -0.14, -1.6), (lx, -0.14, QTOP + 0.15), 0.035, lm, 6, cuts=(1.5,))
        acyl(A, (lx, -0.14, QTOP + 0.15), (lx, 0.3, QTOP + 0.95), 0.035, lm, 6)
    z = -1.4
    while z < QTOP - 0.1:
        acyl(A, (LADDER - 0.25, -0.14, z), (LADDER + 0.25, -0.14, z), 0.022, lambda zz, z_=z: C['slime'] if z_ < 1.5 else C['w3'], 6, cap=False); z += 0.3
    # old tyres for fenders, hung on ropes from the kerb
    for tx in TYRES:
        atorus(A, (tx, -0.36, QTOP - 0.95), (0, 1, 0), 0.3, 0.11, lambda a: C['tyre'], 12, 5)
        acyl(A, (tx, 0.1, QTOP + 0.15), (tx, -0.36, QTOP - 0.55), 0.015, lambda zz: C['rope'], 4, cap=False)


# ---------- the cabin ----------
def gtop(x): return EAVES + (HW - abs(x - XC)) * TP + 0.05
WALLS = {'front': ((RX0, RY0), (1, 0), (0, -1), RX1 - RX0, lambda s: gtop(RX0 + s), lambda c: c - RX0),
         'back': ((RX1, RY1), (-1, 0), (0, 1), RX1 - RX0, lambda s: gtop(RX1 - s), lambda c: RX1 - c),
         'east': ((RX1, RY0), (0, 1), (1, 0), RY1 - RY0, lambda s: EAVES + 0.05, lambda c: c - RY0),
         'west': ((RX0, RY1), (0, -1), (-1, 0), RY1 - RY0, lambda s: EAVES + 0.05, lambda c: RY1 - c)}

def pieces(opens, sa, sb, zb):
    """the parts of the strip sa..sb from zb up that are not in the openings [(s0, s1, z0, z1)]; a part's top None is the wall's top"""
    ps = [(sa, sb, zb, None)]
    for os0, os1, oz0, oz1 in opens:
        nxt = []
        for pa, pb, za, zt in ps:
            if pb <= os0 or pa >= os1 or oz1 <= za or (zt is not None and oz0 >= zt): nxt.append((pa, pb, za, zt)); continue
            if pa < os0: nxt.append((pa, os0, za, zt))
            if pb > os1: nxt.append((os1, pb, za, zt))
            ma, mb = max(pa, os0), min(pb, os1)
            if oz0 > za + 0.01: nxt.append((ma, mb, za, oz0))
            if zt is None or zt > oz1 + 0.01: nxt.append((ma, mb, oz1, zt))
        ps = nxt
    return ps

def cladwall(A, wall, opens, step=0.25):
    """the board-and-batten cladding of a wall: the boards in the wall's plane, a batten over every joint, round the openings"""
    a, u, n, L, top, _ = WALLS[wall]; a = V((a[0], a[1], 0)); u = V((u[0], u[1], 0)); n = V((n[0], n[1], 0)); m = C['clad']
    P = lambda s, z, o=0.0: a + u * s + n * o + V((0, 0, z))
    k = max(1, int(round(L / step))); st = L / k
    for i in range(k):
        for pa, pb, za, zt in pieces(opens, st * i, st * (i + 1), WALLB):
            ta = top(pa) if zt is None else zt; tb = top(pb) if zt is None else zt
            if ta - za < 0.01 and tb - za < 0.01: continue
            A.poly([P(pa, za), P(pb, za), P(pb, tb), P(pa, ta)], m, n)
    bw, bd = 0.055, 0.022
    for i in range(1, k):
        s = st * i
        if s < 0.14 or s > L - 0.14: continue          # under the corner boards
        for pa, pb, za, zt in pieces(opens, s - bw / 2, s + bw / 2, WALLB):
            ta = top(pa) if zt is None else zt; tb = top(pb) if zt is None else zt
            if ta - za < 0.01 and tb - za < 0.01: continue
            A.poly([P(pa, za, bd), P(pb, za, bd), P(pb, tb, bd), P(pa, ta, bd)], m, n)
            A.poly([P(pa, za), P(pa, za, bd), P(pa, ta, bd), P(pa, ta)], m, -u)
            A.poly([P(pb, za), P(pb, za, bd), P(pb, tb, bd), P(pb, tb)], m, u)
            A.poly([P(pa, za), P(pb, za), P(pb, za, bd), P(pa, za, bd)], m, (0, 0, -1))
            if zt is not None: A.poly([P(pa, zt), P(pb, zt), P(pb, zt, bd), P(pa, zt, bd)], m, (0, 0, 1))

def bar(A, P4, n, t, m, sides=(0, 1, 2, 3)):
    """a board from its four front corners facing n, t thick, with only the given sides (0 bottom, 1 right, 2 top, 3 left)"""
    P4 = [V(p) for p in P4]; n = V(n); c = sum(P4, V()) / 4; A.poly(P4, m, n)
    for i in sides:
        p, q = P4[i], P4[(i + 1) % 4]; A.poly([p, q, q - n * t, p - n * t], m, (p + q) / 2 - c)

def window(A, Gl, wall, c, z, w, h, cols, rows, curtains=True):
    """a white window in its casing: the jambs, the head with its drip cap, the sloped sill, the sash with its mullions, the glass,
    and curtains behind it"""
    a, u, n, L, top, sof = WALLS[wall]; a = V((a[0], a[1], 0)); u = V((u[0], u[1], 0)); n = V((n[0], n[1], 0)); s = sof(c); T = C['trim']
    P = lambda ss, zz, o: a + u * ss + n * o + V((0, 0, zz))
    Q = lambda sa, sb, za, zb, o: [P(sa, za, o), P(sb, za, o), P(sb, zb, o), P(sa, zb, o)]
    cw = 0.1; l, r = s - w / 2, s + w / 2
    bar(A, Q(l - cw, l, z - 0.03, z + h, 0.055), n, 0.055, T, (1, 3)); bar(A, Q(r, r + cw, z - 0.03, z + h, 0.055), n, 0.055, T, (1, 3))
    bar(A, Q(l - cw - 0.02, r + cw + 0.02, z + h, z + h + 0.13, 0.06), n, 0.06, T)
    up = V((0, 0, 1))
    bar(A, [P(l - cw - 0.05, z + h + 0.16, 0.0), P(r + cw + 0.05, z + h + 0.16, 0.0), P(r + cw + 0.05, z + h + 0.16, 0.12), P(l - cw - 0.05, z + h + 0.16, 0.12)], up, 0.03, T)
    bar(A, [P(l - cw - 0.04, z - 0.03, 0.11), P(r + cw + 0.04, z - 0.03, 0.11), P(r + cw + 0.04, z + 0.005, 0.0), P(l - cw - 0.04, z + 0.005, 0.0)], (up * 0.95 + n * 0.3).normalized(), 0.04, T)
    f = 0.05; mb = 0.03
    bar(A, Q(l, l + f, z, z + h, 0.032), n, 0.032, T, (1, 3)); bar(A, Q(r - f, r, z, z + h, 0.032), n, 0.032, T, (1, 3))
    bar(A, Q(l + f, r - f, z, z + f, 0.032), n, 0.032, T, (2,)); bar(A, Q(l + f, r - f, z + h - f, z + h, 0.032), n, 0.032, T, (0,))
    for i in range(1, cols):
        sx = l + f + (w - 2 * f) * i / cols; bar(A, Q(sx - mb / 2, sx + mb / 2, z + f, z + h - f, 0.03), n, 0.02, T, (1, 3))
    for j in range(1, rows):
        zz = z + f + (h - 2 * f) * j / rows; bar(A, Q(l + f, r - f, zz - mb / 2, zz + mb / 2, 0.024), n, 0.014, T, (0, 2))
    Gl.poly(Q(l, r, z, z + h, 0.012), C['glass'], n)
    if curtains:
        # the curtains, gathered to the sides, and the valance across the top
        cw2 = min(0.24, w * 0.3)
        A.poly([P(l, z + 0.1 * h, -0.05), P(l + cw2 * 0.45, z + 0.1 * h, -0.05), P(l + cw2, z + h - 0.12, -0.05), P(l, z + h - 0.12, -0.05)], C['curtain'], n)
        A.poly([P(r - cw2 * 0.45, z + 0.1 * h, -0.05), P(r, z + 0.1 * h, -0.05), P(r, z + h - 0.12, -0.05), P(r - cw2, z + h - 0.12, -0.05)], C['curtain'], n)
        A.poly(Q(l, r, z + h - 0.17, z + h, -0.045), C['curtain'], n)
    return (s - w / 2 - cw - 0.02, s + w / 2 + cw + 0.02, z - 0.03, z + h + 0.13)

def door(A, Gl):
    """the door in the sea gable: the white casing with its drip cap, the red panelled leaf (stiles, rails, two panels) with a small
    diamond window, the handle and the threshold"""
    a, u, n, L, top, sof = WALLS['front']; a = V((a[0], a[1], 0)); u = V((u[0], u[1], 0)); n = V((n[0], n[1], 0)); T = C['trim']; D = C['door']
    dc, w, h = DOOR; s = sof(dc); l, r = s - w / 2, s + w / 2; z0 = FLOOR; zt = FLOOR + h
    P = lambda ss, zz, o: a + u * ss + n * o + V((0, 0, zz))
    Q = lambda sa, sb, za, zb, o: [P(sa, za, o), P(sb, za, o), P(sb, zb, o), P(sa, zb, o)]
    bar(A, Q(l - 0.12, l, z0 - 0.05, zt, 0.055), n, 0.055, T, (1, 3)); bar(A, Q(r, r + 0.12, z0 - 0.05, zt, 0.055), n, 0.055, T, (1, 3))
    bar(A, Q(l - 0.14, r + 0.14, zt, zt + 0.16, 0.06), n, 0.06, T)
    bar(A, [P(l - 0.18, zt + 0.19, 0.0), P(r + 0.18, zt + 0.19, 0.0), P(r + 0.18, zt + 0.19, 0.12), P(l - 0.18, zt + 0.19, 0.12)], (0, 0, 1), 0.03, T)
    # the leaf, set back in the casing, and its frame a little proud of the panels
    A.poly(Q(l, r, z0, zt, 0.015), D, n)
    st = 0.11; zl = z0 + 0.95
    for sa, sb, za, zb, sides in ((l, l + st, z0, zt, (1, 3)), (r - st, r, z0, zt, (1, 3)), (l + st, r - st, z0, z0 + 0.2, (2,)), (l + st, r - st, zl, zl + 0.14, (0, 2)),
                                  (l + st, r - st, zt - 0.11, zt, (0,)), (s - 0.04, s + 0.04, z0 + 0.2, zl, (1, 3))):
        bar(A, Q(sa, sb, za, zb, 0.034), n, 0.019, D, sides)
    # the diamond window
    dz = z0 + 1.5; R0 = 0.17; R1 = R0 + 0.045
    dia = lambda R, o: [P(s, dz - R, o), P(s + R, dz, o), P(s, dz + R, o), P(s - R, dz, o)]
    A.poly(dia(R0, 0.02), C['inside'], n)
    Gl.poly(dia(R0, 0.03), C['glass'], n)
    O, I = dia(R1, 0.042), dia(R0, 0.042)
    for i in range(4):
        j = (i + 1) % 4; A.poly([O[i], O[j], I[j], I[i]], T, n)
        A.poly([O[i], O[j], O[j] - n * 0.025, O[i] - n * 0.025], T, (O[i] + O[j]) / 2 - P(s, dz, 0.042))
    # the handle, the key plate and the threshold
    hx = r - 0.09
    obox(A, P(hx, z0 + 1.0, 0.04), u * 0.022, n * 0.006, V((0, 0, 0.08)), C['iron'])
    beam(A, P(hx, z0 + 1.03, 0.04), P(hx, z0 + 1.03, 0.1), 0.022, 0.022, C['iron'])
    beam(A, P(hx, z0 + 1.03, 0.1), P(hx - 0.13, z0 + 1.03, 0.1), 0.02, 0.02, C['iron'])
    bar(A, [P(l - 0.04, z0 + 0.0, 0.1), P(r + 0.04, z0 + 0.0, 0.1), P(r + 0.04, z0 + 0.0, -0.05), P(l - 0.04, z0 + 0.0, -0.05)], (0, 0, 1), 0.06, C['deck2'])
    return (l - 0.14, r + 0.14, z0 - 0.05, zt + 0.16)

def interior(A):
    """dark rooms behind the windows: the ground floor and the loft, their faces turned inwards"""
    m = C['inside']; i = 0.3; x0, x1, y0, y1 = RX0 + i, RX1 - i, RY0 + i, RY1 - i; zc = FLOOR + 2.4; ze = EAVES - 0.05
    cen = V((XC, (RY0 + RY1) / 2, FLOOR + 1.2))
    def q(pts): A.poly(pts, m, cen - sum((V(p) for p in pts), V()) / len(pts))
    q([(x0, y0, FLOOR), (x1, y0, FLOOR), (x1, y1, FLOOR), (x0, y1, FLOOR)])
    q([(x0, y0, zc), (x1, y0, zc), (x1, y1, zc), (x0, y1, zc)])
    for (ax, ay), (bx, by) in (((x0, y0), (x1, y0)), ((x1, y0), (x1, y1)), ((x1, y1), (x0, y1)), ((x0, y1), (x0, y0))): q([(ax, ay, FLOOR), (bx, by, FLOOR), (bx, by, ze), (ax, ay, ze)])
    # the loft: its floor (from above), the gables and the roof's underside
    lc = V((XC, (RY0 + RY1) / 2, ze + 0.6)); zr = RIDGE - 0.2
    def ql(pts): A.poly(pts, m, lc - sum((V(p) for p in pts), V()) / len(pts))
    ql([(x0, y0, zc + 0.01), (x1, y0, zc + 0.01), (x1, y1, zc + 0.01), (x0, y1, zc + 0.01)])
    for y in (y0, y1): ql([(x0, y, ze), (x1, y, ze), (XC, y, zr)])
    for x in (x0, x1): ql([(x, y0, ze), (x, y1, ze), (XC, y1, zr), (XC, y0, zr)])

def cabin(A, Gl, fine=True):
    T = C['trim']
    if not fine:
        abox(A, RX0, RX1, RY0, RY1, WALLB, EAVES, C['clad'])
        for y, sg in ((RY0, -1), (RY1, 1)): A.poly([(RX0, y, EAVES), (RX1, y, EAVES), (XC, y, RIDGE)], C['clad'], (0, sg, 0))
        for cx, cy in ((RX0, RY0), (RX1, RY0), (RX0, RY1), (RX1, RY1)): abox(A, cx - 0.05, cx + 0.05, cy - 0.05, cy + 0.05, WALLB, EAVES, T, skip=('+z', '-z'))
        for wall, c, z, w, h, cols, rows in WINS + [('front', DOOR[0], FLOOR, DOOR[1], DOOR[2], 0, 0)]:
            a, u, n, L, top, sof = WALLS[wall]; a = V((a[0], a[1], 0)); u = V((u[0], u[1], 0)); n = V((n[0], n[1], 0)); s = sof(c)
            P = lambda ss, zz, o: a + u * ss + n * o + V((0, 0, zz))
            A.poly([P(s - w / 2 - 0.1, z - 0.05, 0.02), P(s + w / 2 + 0.1, z - 0.05, 0.02), P(s + w / 2 + 0.1, z + h + 0.12, 0.02), P(s - w / 2 - 0.1, z + h + 0.12, 0.02)], T, n)
            A.poly([P(s - w / 2, z, 0.04), P(s + w / 2, z, 0.04), P(s + w / 2, z + h, 0.04), P(s - w / 2, z + h, 0.04)], C['door'] if cols == 0 else C['inside'], n)
        return
    # the openings (casings) in each wall, the cladding round them, the windows and the door
    opens = {k: [] for k in WALLS}
    for wall, c, z, w, h, cols, rows in WINS:
        opens[wall].append(window(A, Gl, wall, c, z, w, h, cols, rows, curtains=z < EAVES))
    opens['front'].append(door(A, Gl))
    for k in WALLS: cladwall(A, k, opens[k])
    # white corner boards
    for cx, cy, sx, sy in ((RX0, RY0, -1, -1), (RX1, RY0, 1, -1), (RX0, RY1, -1, 1), (RX1, RY1, 1, 1)):
        xa, xb = sorted((cx + sx * 0.045, cx - sx * 0.12)); ya, yb = sorted((cy + sy * 0.045, cy - sy * 0.12))
        abox(A, xa, xb, ya, yb, WALLB - 0.02, EAVES + 0.03, T, skip=('+z',))
    interior(A)
    lantern(A)


def lantern(A):
    """the black lantern on its arm beside the door"""
    lx, ly, lz = LAMP; I = C['iron']
    abox(A, lx - 0.05, lx + 0.05, RY0 - 0.065, RY0 - 0.028, lz + 0.1, lz + 0.34, I)
    beam(A, (lx, RY0 - 0.05, lz + 0.27), (lx, ly, lz + 0.27), 0.022, 0.022, I)
    acyl(A, (lx, ly, lz + 0.27), (lx, ly, lz + 0.17), 0.008, lambda zz: I, 4, cap=False)
    abox(A, lx - 0.05, lx + 0.05, ly - 0.05, ly + 0.05, lz - 0.09, lz + 0.07, C['lamp'])
    for dx in (-1, 1):
        for dy in (-1, 1): abox(A, lx + dx * 0.06 - 0.008, lx + dx * 0.06 + 0.008, ly + dy * 0.06 - 0.008, ly + dy * 0.06 + 0.008, lz - 0.1, lz + 0.08, I)
    abox(A, lx - 0.075, lx + 0.075, ly - 0.075, ly + 0.075, lz - 0.13, lz - 0.09, I)
    c = [V((lx + dx * 0.09, ly + dy * 0.09, lz + 0.08)) for dx, dy in ((-1, -1), (1, -1), (1, 1), (-1, 1))]; ap = V((lx, ly, lz + 0.17))
    for i in range(4): A.poly([c[i], c[(i + 1) % 4], ap], I, (c[i] + c[(i + 1) % 4]) / 2 - V((lx, ly, lz)))
    A.poly(c, I, (0, 0, -1))


# ---------- what stands under the cabin ----------
SXS = (RX0 + 0.18, XC, RX1 - 0.18); SYS = (RY0 + 0.18, RY0 + 2.72, RY0 + 5.26, RY1 - 0.18)
def under(A, fine=True):
    rr = random.Random(11); zt = FLOOR - 0.58
    if not fine:
        for x in SXS[::2]:
            for y in SYS[::3]: abox(A, x - 0.12, x + 0.12, y - 0.12, y + 0.12, bankz(x, y) - 0.2, zt, C['stilt'])
        abox(A, RX0 + 0.05, RX1 - 0.05, RY0 + 0.05, RY1 - 0.05, zt, WALLB, C['stilt'], skip=('+z',))
        return
    for y in SYS:
        for x in SXS:
            acyl(A, (x + rr.uniform(-0.04, 0.04), y + rr.uniform(-0.04, 0.04), bankz(x, y) - 0.25), (x, y, zt), 0.13, stiltm, 7, cuts=TCUTS)
    for x in SXS: abox(A, x - 0.1, x + 0.1, RY0 + 0.02, RY1 - 0.02, zt, WALLB, C['stilt'], skip=('+z',))
    A.poly([(RX0, RY0, WALLB), (RX1, RY0, WALLB), (RX1, RY1, WALLB), (RX0, RY1, WALLB)], C['sark'], (0, 0, -1))
    # X bracing between the tall stilts under the sea gable, and down the long sides' first bay
    y = SYS[0] - 0.15
    for xa, xb in ((SXS[0], SXS[1]), (SXS[1], SXS[2])):
        za = max(bankz(xa, y), bankz(xb, y)) + 0.25; zb = zt - 0.05
        if zb - za > 0.6:
            beam(A, (xa, y, za), (xb, y, zb), 0.15, 0.045, C['stilt'], up=(0, 1, 0))
            beam(A, (xa, y - 0.045, zb), (xb, y - 0.045, za), 0.15, 0.045, C['stilt'], up=(0, 1, 0))
    for x, sx in ((SXS[0] - 0.15, -1), (SXS[2] + 0.15, 1)):
        za = max(bankz(x, SYS[0]), bankz(x, SYS[1])) + 0.25; zb = zt - 0.05
        if zb - za > 0.6:
            beam(A, (x, SYS[0], za), (x, SYS[1], zb), 0.15, 0.045, C['stilt'], up=(1, 0, 0))
            beam(A, (x + sx * 0.045, SYS[0], zb), (x + sx * 0.045, SYS[1], za), 0.15, 0.045, C['stilt'], up=(1, 0, 0))


# ---------- the roof ----------
def rz(x): return EAVES + RL + (HW - abs(x - XC)) * TP
def rN(sg): return V((sg * math.sin(A38), 0, math.cos(A38)))

def roof(A, fine=True):
    T = C['trim']; R = C['roof']
    xe = {sg: XC + sg * (HW + OHE) for sg in (-1, 1)}
    if not fine:
        for sg in (-1, 1):
            P = [V((xe[sg], YA, rz(xe[sg]))), V((XC, YA, rz(XC))), V((XC, YB, rz(XC))), V((xe[sg], YB, rz(xe[sg])))]
            A.poly(P, R, rN(sg)); A.poly([p - V((0, 0, 0.2)) for p in P], C['soffit'], -rN(sg))
            A.poly([V((xe[sg], YA - 0.02, rz(xe[sg]) - 0.22)), V((XC, YA - 0.02, rz(XC) - 0.22)), V((XC, YA - 0.02, rz(XC) + 0.03)), V((xe[sg], YA - 0.02, rz(xe[sg]) + 0.03))], T, (0, -1, 0))
            A.poly([V((xe[sg], YB + 0.02, rz(xe[sg]) - 0.22)), V((XC, YB + 0.02, rz(XC) - 0.22)), V((XC, YB + 0.02, rz(XC) + 0.03)), V((xe[sg], YB + 0.02, rz(xe[sg]) + 0.03))], T, (0, 1, 0))
            A.poly([V((xe[sg] + sg * 0.02, YA, rz(xe[sg]) - 0.22)), V((xe[sg] + sg * 0.02, YB, rz(xe[sg]) - 0.22)), V((xe[sg] + sg * 0.02, YB, rz(xe[sg]))), V((xe[sg] + sg * 0.02, YA, rz(xe[sg])))], T, (sg, 0, 0))
        cx, cy, cs = CHIM; abox(A, cx - cs / 2, cx + cs / 2, cy - cs / 2, cy + cs / 2, rz(cx - cs / 2), rz(XC) + 0.75, C['chim'], skip=('-z',))
        return
    # the sheets: a trapezoid profile across, its ribs running from the eave to the ridge, 0.25 m apart
    prof = [(0.0, 0.0), (0.155, 0.0), (0.178, 0.032), (0.227, 0.032)]
    k = int(round((YB - YA) / 0.25)); pts = [(YA + 0.25 * i + dy, hh) for i in range(k) for dy, hh in prof] + [(YB, 0.0)]
    for sg in (-1, 1):
        x0 = xe[sg]
        for (ya, ha), (yb, hb) in zip(pts, pts[1:]):
            A.poly([(x0, ya, rz(x0) + ha), (x0, yb, rz(x0) + hb), (XC, yb, rz(XC) + hb), (XC, ya, rz(XC) + ha)], R, rN(sg))
        # the soffit under the overhangs (and the whole slope's underside)
        xf = x0 - sg * 0.04
        A.poly([(xf, YA, rz(xf) - 0.2), (xf, YB, rz(xf) - 0.2), (XC, YB, rz(XC) - 0.2), (XC, YA, rz(XC) - 0.2)], C['soffit'], -rN(sg))
        # the fascia, set in under the sheets' edge
        bar(A, [(xf, YA, rz(xf) - 0.24), (xf, YB, rz(xf) - 0.24), (xf, YB, rz(xf) - 0.005), (xf, YA, rz(xf) - 0.005)], (sg, 0, 0), 0.04, T)
        # the barge boards on both gables
        xg = x0 + sg * 0.03                            # out past the sheets' edge, covering their ends
        for y, sy in ((YA - 0.03, -1), (YB + 0.03, 1)):
            bar(A, [(xg, y, rz(xg) - 0.27), (XC, y, rz(XC) - 0.27), (XC, y, rz(XC) + 0.065), (xg, y, rz(xg) + 0.065)], (0, sy, 0), 0.05, T, (0, 2, 3))
        # the ridge cap
        xr = XC + sg * 0.22
        bar(A, [(XC, YA - 0.06, rz(XC) + 0.07), (XC, YB + 0.06, rz(XC) + 0.07), (xr, YB + 0.06, rz(xr) + 0.045), (xr, YA - 0.06, rz(xr) + 0.045)], (rN(sg) * 0.6 + V((0, 0, 0.4))).normalized(), 0.02, C['flash'], (1, 2, 3))
        # snow guards along the eave: two tubes on brackets
        xs_ = XC + sg * (HW - 0.2); nn = rN(sg)
        for yy in frange(RY0 + 0.1, RY1 + 0.01, 1.6):
            base = V((xs_, yy, rz(xs_) + 0.032)); beam(A, base, base + nn * 0.17, 0.05, 0.01, C['flash'], up=(0, 1, 0))
        for hh in (0.08, 0.15):
            p = V((xs_, 0, rz(xs_) + 0.032)) + nn * hh
            acyl(A, (p.x, RY0 - 0.1, p.z), (p.x, RY1 + 0.11, p.z), 0.017, lambda zz: C['flash'], 5)
    chimney(A)
    vane(A)

def chimney(A):
    """the black chimney near the ridge with its cap on four legs, and the roof ladder up to it"""
    cx, cy, cs = CHIM; h = cs / 2; zt = rz(XC) + 0.75; K = C['chim']
    abox(A, cx - h, cx + h, cy - h, cy + h, rz(cx - h) - 0.05, zt, K, skip=('-z',))
    abox(A, cx - h - 0.03, cx + h + 0.03, cy - h - 0.03, cy + h + 0.03, zt - 0.12, zt - 0.06, K)
    for dx in (-1, 1):
        for dy in (-1, 1): abox(A, cx + dx * (h - 0.06) - 0.02, cx + dx * (h - 0.06) + 0.02, cy + dy * (h - 0.06) - 0.02, cy + dy * (h - 0.06) + 0.02, zt, zt + 0.17, K)
    abox(A, cx - h - 0.1, cx + h + 0.1, cy - h - 0.1, cy + h + 0.1, zt + 0.17, zt + 0.22, K)
    # the roof ladder from the eave up to the chimney (the sweep's way), on brackets off the sheets
    nn = rN(-1); xa = RX0 - 0.1; xb = cx - h - 0.08; I = C['iron']
    lp = lambda x, y, o=0.1: V((x, y, rz(x) + 0.032)) + nn * o
    for y in (cy - 0.2, cy + 0.2):
        beam(A, lp(xa, y), lp(xb, y), 0.025, 0.05, I, up=nn)
        for x in (xa + 0.15, xb - 0.15): beam(A, lp(x, y, 0.0), lp(x, y, 0.08), 0.02, 0.04, I, up=(0, 1, 0))
    L = (xb - xa) / math.cos(A38); nr = int(L / 0.3)
    for i in range(1, nr + 1):
        x = xa + (xb - xa) * i / (nr + 1); beam(A, lp(x, cy - 0.2, 0.13), lp(x, cy + 0.2, 0.13), 0.022, 0.022, I, up=nn)

ROOSTER = [(-0.01, 0.0), (0.06, 0.0), (0.04, 0.02), (0.035, 0.09), (0.10, 0.11), (0.16, 0.16), (0.19, 0.23), (0.195, 0.28), (0.215, 0.305),
           (0.225, 0.33), (0.27, 0.345), (0.225, 0.36), (0.215, 0.385), (0.205, 0.415), (0.19, 0.40), (0.175, 0.43), (0.16, 0.405), (0.145, 0.425),
           (0.135, 0.395), (0.12, 0.38), (0.12, 0.33), (0.09, 0.26), (0.03, 0.235), (-0.03, 0.26), (-0.08, 0.37), (-0.14, 0.42), (-0.12, 0.35),
           (-0.19, 0.34), (-0.135, 0.27), (-0.20, 0.22), (-0.12, 0.17), (-0.05, 0.12), (0.0, 0.09), (0.005, 0.02)]

def vane(A):
    """the weather vane on the ridge's sea end: the rod on its mount, a ball, the arms of the compass, the arrow and the rooster"""
    I = C['iron']; x, y = XC, YA + 0.3; z0 = rz(XC) + 0.07
    acyl(A, (x, y, z0 - 0.05), (x, y, z0 + 0.1), 0.045, lambda zz: I, 8, r1=0.02)
    acyl(A, (x, y, z0 + 0.1), (x, y, z0 + 1.0), 0.013, lambda zz: I, 6)
    acyl(A, (x, y, z0 + 0.24), (x, y, z0 + 0.31), 0.04, lambda zz: I, 8)
    za = z0 + 0.42
    beam(A, (x - 0.28, y, za), (x + 0.28, y, za), 0.012, 0.012, I); beam(A, (x, y - 0.28, za), (x, y + 0.28, za), 0.012, 0.012, I)
    for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)): obox(A, (x + dx * 0.29, y + dy * 0.29, za), (0.025, 0, 0), (0, 0.025, 0), (0, 0, 0.025), I)
    zr = z0 + 0.66; n = V((0, -1, 0))
    beam(A, (x - 0.38, y, zr), (x + 0.3, y, zr), 0.012, 0.012, I)
    plate2(A, [(x + 0.42, y - 0.004, zr), (x + 0.28, y - 0.004, zr + 0.07), (x + 0.28, y - 0.004, zr - 0.07)], n, 0.008, I)
    plate2(A, [(x - 0.42, y - 0.004, zr - 0.06), (x - 0.3, y - 0.004, zr - 0.02), (x - 0.3, y - 0.004, zr + 0.1), (x - 0.42, y - 0.004, zr + 0.13)], n, 0.008, I)
    k = 1.35; pts = [(x + (u - 0.03) * k, y - 0.005, zr + 0.02 + v * k) for u, v in ROOSTER]
    plate2(A, pts, n, 0.01, I)


# ---------- the veranda (altan) on stilts, its railing, the poles with the floats, and the stairs ----------
VST = [(x, VY0 + 0.08) for x in (VX0 + 0.08, -1.05, 1.35)] + POLES[:1] + [(VX1 - 0.08, 6.1)] + POLES[1:]
def veranda(A, fine=True):
    rr = random.Random(13); zb = VFLOOR - 0.27; T = C['trim']
    if not fine:
        abox(A, VX0, VX1, VY0, RY0, VFLOOR - 0.25, VFLOOR, C['deck'])
        abox(A, RX1, VX1, RY0, VYS, VFLOOR - 0.25, VFLOOR, C['deck'])
        for za, zb_ in ((VFLOOR + 0.94, VFLOOR + 1.02), (VFLOOR + 0.46, VFLOOR + 0.54)):
            abox(A, STAIR[1], VX1, VY0, VY0 + 0.08, za, zb_, T); abox(A, VX1 - 0.08, VX1, VY0, VYS, za, zb_, T)
            abox(A, RX1, VX1, VYS - 0.08, VYS, za, zb_, T); abox(A, VX0, VX0 + 0.08, VY0, RY0, za, zb_, T)
        for x, y in VST: abox(A, x - 0.1, x + 0.1, y - 0.1, y + 0.1, bankz(x, y) - 0.2, POLE_TOP if (x, y) in POLES else zb, C['stilt'])
        return
    # the stilts, the east corners' going on up as the tall poles
    for x, y in VST:
        pole = (x, y) in POLES
        acyl(A, (x + rr.uniform(-0.03, 0.03), y + rr.uniform(-0.03, 0.03), bankz(x, y) - 0.25), (x, y, POLE_TOP if pole else zb), 0.11, lambda zz: stiltm(zz) if zz < VFLOOR else C['pole'], 7,
             cuts=TCUTS + ((VFLOOR,) if pole else ()), r1=0.085 if pole else None)
    # the beams on them and the joists under the deck
    abox(A, VX0, VX1, VY0, VY0 + 0.16, zb, VFLOOR - 0.045, C['stilt'], skip=('+z',))
    abox(A, VX1 - 0.16, VX1, VY0, VYS, zb, VFLOOR - 0.045, C['stilt'], skip=('+z',))
    for x in frange(VX0 + 0.3, VX1 - 0.2, 0.6): abox(A, x - 0.025, x + 0.025, VY0 + 0.16, RY0, VFLOOR - 0.2, VFLOOR - 0.045, C['stilt'], skip=('+z',))
    for y in frange(RY0 + 0.4, VYS - 0.1, 0.6): abox(A, RX1, VX1 - 0.16, y - 0.025, y + 0.025, VFLOOR - 0.2, VFLOOR - 0.045, C['stilt'], skip=('+z',))
    # the deck: planks along the gable in front, along the long wall down the side; dark between them, their undersides below
    def planks(a0, a1, b0, b1, along_x):
        n = int((b1 - b0) / 0.135); w = (b1 - b0) / n
        for k in range(n):
            ba = b0 + k * w + 0.006; bb = ba + w - 0.012; m = rr.choice((C['deck'], C['deck2'], C['deck'], C['w3']))
            P = [(a0, ba), (a1, ba), (a1, bb), (a0, bb)] if along_x else [(ba, a0), (ba, a1), (bb, a1), (bb, a0)]
            A.poly([(p, q, VFLOOR) for p, q in P], m, (0, 0, 1))
        R = [(a0, b0), (a1, b0), (a1, b1), (a0, b1)] if along_x else [(b0, a0), (b0, a1), (b1, a1), (b1, a0)]
        A.poly([(p, q, VFLOOR - 0.03) for p, q in R], C['deckdk'], (0, 0, 1)); A.poly([(p, q, VFLOOR - 0.045) for p, q in R], C['deck2'], (0, 0, -1))
    planks(VX0, VX1, VY0, RY0, True); planks(RY0, VYS, RX1, VX1, False)
    # the rim boards round its edge
    for xa, xb, ya, yb in ((VX0 - 0.035, VX1 + 0.035, VY0 - 0.035, VY0), (VX1, VX1 + 0.035, VY0, VYS + 0.035), (RX1, VX1, VYS, VYS + 0.035), (VX0 - 0.035, VX0, VY0, RY0)):
        abox(A, xa, xb, ya, yb, VFLOOR - 0.24, VFLOOR + 0.01, T)
    # the railing: posts, the flat top rail and a mid rail
    def run(a, b, p0=True, p1=True):
        a = V((a[0], a[1], 0)); b = V((b[0], b[1], 0)); L = (b - a).length; n = max(1, int(math.ceil(L / 1.3)))
        for i in range(n + 1):
            if (i == 0 and not p0) or (i == n and not p1): continue
            p = a + (b - a) * (i / n); abox(A, p.x - 0.043, p.x + 0.043, p.y - 0.043, p.y + 0.043, VFLOOR, VFLOOR + 0.98, T, skip=('-z',))
        beam(A, a + V((0, 0, VFLOOR + 1.0)), b + V((0, 0, VFLOOR + 1.0)), 0.12, 0.04, T)
        beam(A, a + V((0, 0, VFLOOR + 0.5)), b + V((0, 0, VFLOOR + 0.5)), 0.035, 0.085, T)
    yf = VY0 + 0.08; xe = VX1 - 0.08; xw = VX0 + 0.08
    run((STAIR[1] + 0.045, yf), (xe, yf), True, False)
    run((xe, yf), (xe, VYS - 0.08), False, False)
    run((RX1 + 0.05, VYS - 0.08), (xe, VYS - 0.08), True, False)
    run((xw, yf), (xw, RY0 - 0.05), True, True)
    # the rope between the poles' tops, sagging, with the floats hanging from it
    za = POLE_TOP - 0.12; ya, yb = POLES[0][1], POLES[1][1]; sag = 0.42
    rp = lambda t: V((xe, ya + (yb - ya) * t, za - sag * 4 * t * (1 - t)))
    for i in range(8): acyl(A, rp(i / 8), rp((i + 1) / 8), 0.012, lambda zz: C['rope'], 4, cap=False)
    for t, r, m, cord in ((0.27, 0.13, C['orange'], 0.22), (0.52, 0.2, C['orange'], 0.12), (0.76, 0.12, C['fwhite'], 0.3)):
        p = rp(t); c = p - V((0, 0, cord + r))
        acyl(A, p, c + V((0, 0, r)), 0.008, lambda zz: C['rope'], 3, cap=False)
        bm_ = bmesh.new(); bmesh.ops.create_uvsphere(bm_, u_segments=10, v_segments=7, radius=r)
        vm = {v: A.v(c + V((v.co.x, v.co.y, v.co.z * (1.12 if r > 0.15 else 1.0)))) for v in bm_.verts}
        for fc in bm_.faces: A.f([vm[v] for v in fc.verts], m, fc.calc_center_median())
        bm_.free()
        if r > 0.15: atorus(A, c + V((0, 0, r * 1.12 + 0.03)), (1, 0, 0), 0.04, 0.012, lambda a_: m, 8, 4)

def stairs(A, fine=True):
    """the stairs from the veranda's west end down to the quay: two stringers, open treads, a handrail each side on its newel"""
    x0, x1 = STAIR; r = (VFLOOR - QTOP) / NRISE; T = C['trim']; W = C['deck2']
    if not fine:
        xprism(A, [(VY0 - NRISE * RUN, QTOP), (VY0, QTOP), (VY0, VFLOOR)], x0, x1, W)
        return
    slope = r / RUN; yb = VY0 - (NRISE - 1) * RUN - r / slope   # where the line of the nosings meets the deck
    dv = 0.26
    for xa, xb in ((x0, x0 + 0.045), (x1 - 0.045, x1)):
        xprism(A, [(yb, QTOP), (yb + dv / slope, QTOP), (VY0, VFLOOR - dv), (VY0, VFLOOR + 0.0)], xa, xb, W)
    for k in range(1, NRISE):
        zt = QTOP + k * r; ya = VY0 - (NRISE - k) * RUN - 0.025; yb2 = ya + RUN + 0.025
        abox(A, x0 + 0.045, x1 - 0.045, ya, yb2, zt - 0.036, zt, C['deck'] if k % 2 else C['w3'])
    # the handrails, from a newel on the quay up to the veranda's corner post and the front railing's first post
    yn = yb - 0.08
    for xh in (VX0 + 0.08, STAIR[1] + 0.045):
        abox(A, xh - 0.043, xh + 0.043, yn - 0.043, yn + 0.043, QTOP, QTOP + 0.95, T, skip=('-z',))
        beam(A, (xh, yn, QTOP + 0.97), (xh, VY0 + 0.08, VFLOOR + 0.97), 0.07, 0.045, T)
        beam(A, (xh, yn, QTOP + 0.5), (xh, VY0 + 0.08, VFLOOR + 0.5), 0.03, 0.07, T)


# ---------- the things about the place ----------
def props(A, rr):
    # a table and a bench on the side veranda, in the evening sun
    tx, ty = RX1 + 0.85, RY0 + 1.0; W = C['w3']
    abox(A, tx - 0.3, tx + 0.3, ty - 0.35, ty + 0.35, VFLOOR + 0.69, VFLOOR + 0.73, W)
    for dx in (-1, 1):
        for dy in (-1, 1): abox(A, tx + dx * 0.24 - 0.022, tx + dx * 0.24 + 0.022, ty + dy * 0.29 - 0.022, ty + dy * 0.29 + 0.022, VFLOOR, VFLOOR + 0.69, W)
    bx = RX1 + 0.28
    abox(A, bx - 0.17, bx + 0.17, ty - 0.75, ty + 0.75, VFLOOR + 0.42, VFLOOR + 0.46, W)
    for dy in (-0.65, 0.65): abox(A, bx - 0.15, bx + 0.15, ty + dy - 0.025, ty + dy + 0.025, VFLOOR, VFLOOR + 0.42, W)
    # rubber boots by the door
    for k, bx2 in enumerate((XC + 0.63, XC + 0.77)):
        by = RY0 - 0.17 - 0.03 * k
        acyl(A, (bx2, by, VFLOOR + 0.04), (bx2, by, VFLOOR + 0.38), 0.05, lambda zz: C['boot'], 8, r1=0.056)
        obox(A, (bx2, by - 0.08, VFLOOR + 0.045), (0.045, 0, 0), (0, 0.11, 0), (0, 0, 0.045), C['boot'])
        abox(A, bx2 - 0.05, bx2 + 0.05, by - 0.2, by + 0.06, VFLOOR, VFLOOR + 0.02, C['tyre'])
    # on the quay: a coil of rope by the west bollard, fish crates by the east one
    for k in range(3): atorus(A, (BOLL[0][0] + 0.7, 1.1, QTOP + 0.035 + 0.06 * k), (0, 0, 1), 0.3 - 0.02 * k, 0.03, lambda a: C['rope'], 12, 4)
    for k, (cx, cy, h, m) in enumerate(((5.0, 2.95, 0, C['crate']), (5.0, 2.95, 1, C['crate']), (5.85, 2.9, 0, C['crate2']))):
        z0 = QTOP + 0.31 * h; abox(A, cx - 0.4, cx + 0.4, cy - 0.3, cy + 0.3, z0, z0 + 0.3, m)


# ---------- all of it ----------
# mat() multiplies a material's colour by the mesh's per-corner TINT where its alpha is 1, and Cycles reads a mesh without TINT as
# alpha 1 and black, so every mesh here carries a neutral tint (white): the renders show the colours, and the export is the same.
NEUTRAL = lambda p, m, n: (1.0, 1.0, 1.0)
def neutral(o):
    me = o.data
    if 'TINT' not in me.color_attributes:
        lay = me.color_attributes.new('TINT', 'FLOAT_COLOR', 'CORNER')
        for d in lay.data: d.color = (1.0, 1.0, 1.0, 1.0)
    return o

def build(fine=True):
    A = Acc('rorbu'); Gl = Acc('rorbu_glass'); rr = random.Random(1)
    bank(A, fine); quay(A, fine); under(A, fine); cabin(A, Gl, fine); roof(A, fine); veranda(A, fine); stairs(A, fine)
    if fine: props(A, rr)
    solids = [A.done(tint=NEUTRAL)]
    g = Gl.done(tint=NEUTRAL) if fine else None
    if g is None: g = neutral(box('noglass', 0, 0.01, 0, 0.01, -50, -49.99, C['glass']))
    return solids, [g]


def to_game(p): return (p[0], p[2], -p[1])
def to_game_n(n): return (n[0], n[2], -n[1])

def anchors():
    """the places the game needs, in the rorbu's frame (x along the face, y up from mean sea level, z out to sea; metres)"""
    G = lambda x, y, z=QTOP: [round(v, 3) for v in to_game((x, y, z))]
    sm = (STAIR[0] + STAIR[1]) / 2; r = (VFLOOR - QTOP) / NRISE; yb = VY0 - (NRISE - 1) * RUN - RUN
    return {'face': {'x0': QUAY[0], 'x1': QUAY[1], 'deck': QTOP},
            'bollards': [G(x, y, QTOP + 0.7) for x, y in BOLL], 'ladder': G(LADDER, -0.14),
            # the door is up on the veranda (its deck at 'veranda'.deck); the stairs come down to the quay deck
            'door': G(DOOR[0], RY0 - 0.6, VFLOOR),
            'stairs': {'bottom': G(sm, yb - 0.35, QTOP), 'top': G(sm, VY0 + 0.35, VFLOOR)},
            'veranda': {'deck': round(VFLOOR, 3), 'front': [VX0, VX1, VY0, RY0], 'side': [RX1, VX1, RY0, VYS]},
            # [cx, cz, sx, sz, y0, y1] for the camera to stay out of: the cabin with its roof and vane, the veranda's two parts
            'solids': [[round(v, 3) for v in q] for q in (
                       [XC, -(RY0 + RY1) / 2, 2 * (HW + OHE) + 0.2, YB - YA + 0.2, -1.0, rz(XC) + 1.4],
                       [(VX0 + VX1) / 2, -(VY0 + RY0) / 2, VX1 - VX0 + 0.1, RY0 - VY0 + 0.1, -1.0, VFLOOR + 1.1],
                       [(RX1 + VX1) / 2, -(RY0 + VYS) / 2, VX1 - RX1 + 0.1, VYS - RY0 + 0.1, -1.0, VFLOOR + 1.1])],
            # the ground the model brings (the bank: its profile inland, sinking 1.2 m between 12 and 16 m out to the sides), and
            # where the map's houses go
            'bank': {'x0': -BX, 'x1': BX, 'y0': BY0, 'y1': BY1, 'prof': [[a, round(b, 3)] for a, b in BANK]},
            'clear': [[-15.0, 1.0, 15.0, -21.0]],
            'lamps': [G(LAMP[0], LAMP[1], LAMP[2])]}

SHOTS = [('sea', (1.0, -24.0, 3.0), (0.5, 7.0, 4.6), 30), ('sea3q', (19.0, -15.0, 7.0), (0.0, 6.5, 4.0), 30),
         ('side', (17.0, 3.5, 5.0), (0.0, 7.5, 4.4), 30), ('quay', (5.5, 0.7, QTOP + 1.7), (-2.6, 4.6, QTOP + 1.4), 28),
         ('door', (2.2, 1.6, QTOP + 1.9), (0.0, 5.2, FLOOR + 1.3), 30), ('piles', (-1.0, -6.5, 0.8), (0.0, 2.0, 1.3), 24),
         ('above', (18.0, -16.0, 22.0), (0.0, 7.0, 2.0), 30), ('roof', (-12.0, -4.0, 12.0), (0.0, 8.0, 7.0), 32),
         ('back', (-9.0, 26.0, 7.0), (0.0, 9.0, 4.5), 30), ('stairs', (-7.0, 0.6, QTOP + 1.6), (-2.6, 4.4, QTOP + 1.1), 28)]

def scene():
    """for the renders only: the water a little above mean sea level, the shore rising behind the bank and the land beside it"""
    extra = []
    bm = bmesh.new(); s_ = 200
    bm.faces.new([bm.verts.new(p) for p in ((-s_, -s_, 0.25), (s_, -s_, 0.25), (s_, s_, 0.25), (-s_, s_, 0.25))])
    extra.append(obj_from_bm('water', bm, [mat('water', (0.03, 0.09, 0.12), 0.9)]))
    ys = [BY1 - 0.5, 28, 36, 50, 85]; zs = [interp1(BANK, BY1) - 0.1, 5.5, 13.0, 25.0, 42.0]
    extra.append(grid('shore', [[(x, y, z) for y, z in zip(ys, zs)] for x in (-80, -BX, BX, 80)], lambda i, j: mat('cliff', (0.30, 0.31, 0.24), 0.05) if j >= 1 else mat('land', (0.27, 0.33, 0.16), 0.05), out=lambda c: (0, -1, 1)))
    for sx in (-1, 1):
        ys2 = [-30, -6, 0, 6, BY1 - 0.5]
        extra.append(grid('side', [[(sx * x, y, (interp1(BANK, y) - 1.2 if y > -6 else -4.0) + (x - BX) * 0.04 * (1 if y > 0 else 0)) for y in ys2] for x in (BX, 90)][::sx],
                          lambda i, j: mat('land2', (0.27, 0.32, 0.18), 0.05) if j >= 2 else mat('rockside', (0.26, 0.255, 0.24), 0.05), out=lambda c: (0, 0, 1)))
    for o in extra: neutral(o)
    return extra

def main():
    os.makedirs(OUT, exist_ok=True)
    reset(); colours()
    solids, glass = build(True)
    join(solids, 'BOAT0'); join(glass, 'GLASS0')
    if 'fast' not in sys.argv and 'dry' not in sys.argv:
        extra = scene()
        beauty(OUT, 'rorbu', 0.25, SHOTS)
        for o in extra: bpy.data.objects.remove(o, do_unlink=True)
    ex = {'frame': 'kystfiske rorbu: x along the quay face, y up from mean sea level, z out to sea; metres', 'name': 'Den røde rorbua med kaia på påler',
          'anchors': anchors()}
    export_boat(build, to_game, to_game_n, OUT, 'harbour-rorbu.glb', os.path.join(ROOT, 'src', 'data', 'harbour-rorbu.b64'), ex, side=None, dry='dry' in sys.argv)


if __name__ == '__main__':
    main()
