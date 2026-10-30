"""The old boathouse with its worn pile quay, where every new player starts (Jonas 05.10.2026: «Lag en blender-modell av et gammelt
falle-ferdig naust med en sliten kai av påler. Dette skal være plassen hvor alle nye spillere starter spillet», with a photo of a grey
two-storey sea house on posts over the foreshore). Built in Blender like the harbour unit (kaimottak.py) and the shop (butikk.py).

What it is: a naust of silver-grey standing boards, never painted, some missing, the bottoms dark with damp, on posts over the shore
with a dry-stone pier under its west gable; an old tile roof with moss and lichen that sags in the middle, a few tiles gone, a wall
dormer with broken barge boards and a hoist beam over the loft door; two small four-pane windows, one pane out; a pole hung along
the front on ropes, floats, a life ring and an anchor against the wall. In front of it, the quay on timber piles: the deck of loose
planks with gaps, one gone, one broken, the kerb log, the bents with their bracing (one brace hangs loose), fender piles, wooden
bollards, a ladder and old tyres for fenders, the piles green and weedy in the tidal zone and white with barnacles above it. The
bank of rocks and rockweed under it all runs up to grass behind; an old færing lies upside down on trestles beside the house.

    pip install bpy==4.5.4
    python3 tools/harbour/naust.py          -> src/data/harbour-naust.b64, renders in tools/harbour/out/
    python3 tools/harbour/naust.py fast     -> without the renders to look at
    python3 tools/harbour/naust.py dry      -> the GLB only in tools/harbour/out

Frame as in kaimottak.py: x along the quay face (x = 0 is the berth's middle), the face at y = 0, y inland, z up from mean sea level.
In the game: x along the face, y up, z out to sea."""
import os, sys, math, random
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))
sys.path.insert(0, os.path.join(ROOT, 'tools', 'boats'))
import bpy, bmesh
from mathutils import Vector as V
from bpyutil import *

OUT = os.path.join(HERE, 'out')
QTOP = 2.4                                   # the quay deck above mean sea level, as QTOP in 07-harbours.js
QUAY = (-8.6, 7.6, 0.0, 3.4)                 # the pile quay: x0, x1, the face, its back against the house
NX0, NX1, NY0, NY1 = -5.9, 5.9, 3.4, 9.4     # the naust's walls
FLOOR = QTOP + 0.1                           # its floor, a step up from the deck
EAVES = FLOOR + 3.0
A40 = math.radians(40); TP = math.tan(A40)   # the main roof's pitch
YM = (NY0 + NY1) / 2; HW = (NY1 - NY0) / 2
RIDGE = EAVES + HW * TP
OHE, OHG = 0.45, 0.35                        # the roof's overhang over the eaves and the gables
XA, XB = NX0 - OHG, NX1 + OHG
YE = NY0 - OHE; ZE = EAVES - OHE * TP        # the front eave's edge
XD, DW = 0.7, 2.6                            # the wall dormer over the loft door: its middle and width
A52 = math.radians(52); DT = math.tan(A52); DOH = 0.3
DTOP = EAVES + DW / 2 * DT; DM = DW / 2 + DOH
DOOR = (XD - 0.8, XD + 0.8, FLOOR + 2.0)     # the loft door under the dormer: x0, x1, its top
BENTS = [-8.4 + 2.25 * k for k in range(8)]  # the quay's pile bents along x
PILE_Y = (0.3, 1.75, 3.2)
BOLL = [(-7.6, 0.55), (-3.7, 0.55), (3.7, 0.55)]
LADDER = -4.95
WINS = [('front', -2.3, FLOOR + 1.45, 0.62, 0.7, True), ('front', 3.9, FLOOR + 1.5, 0.62, 0.7, False),
        ('back', 1.6, FLOOR + 1.4, 0.62, 0.7, False), ('east', YM, EAVES + 0.45, 0.5, 0.55, False)]
LAMP = (XD, NY0 - 0.42, FLOOR + 2.32)
C = {}


def colours():
    # zone 2: takes snow where it faces up (rock above the high water, the roof); zone 3: grass and heather, snow on it and straw-coloured
    # tufts in winter (view3d.js siteSnow)
    Z = {'tile1': 2, 'tile2': 2, 'tile3': 2, 'lichen': 2, 'moss_y': 2, 'moss_g': 2, 'rock1': 2, 'rock2': 2, 'lichrock': 2, 'grass': 3, 'grass2': 3, 'heather': 3}
    w = lambda n, rgb, g=0.12: C.__setitem__(n, mat(n, rgb, g, zone=Z.get(n, 0)))
    w('w1', (0.44, 0.425, 0.395)); w('w2', (0.36, 0.345, 0.32)); w('w3', (0.50, 0.48, 0.445)); w('w4', (0.31, 0.295, 0.27))
    w('w5', (0.41, 0.365, 0.31)); w('w6', (0.25, 0.24, 0.22)); w('wdark', (0.22, 0.21, 0.195)); w('wwet', (0.17, 0.16, 0.14), 0.3); w('trim', (0.52, 0.51, 0.47))
    w('inside', (0.05, 0.045, 0.04), 0.05); w('sark', (0.17, 0.15, 0.13), 0.05)
    w('tile1', (0.25, 0.21, 0.185), 0.2); w('tile2', (0.30, 0.25, 0.215), 0.2); w('tile3', (0.21, 0.19, 0.175), 0.2)
    w('lichen', (0.40, 0.385, 0.34)); w('moss_y', (0.52, 0.48, 0.19), 0.05); w('moss_g', (0.31, 0.35, 0.14), 0.05)
    w('frame', (0.76, 0.76, 0.72), 0.25); C['glass'] = mat('glass', (0.07, 0.09, 0.10), 0.9)
    w('rock1', (0.31, 0.30, 0.28)); w('rock2', (0.25, 0.245, 0.235)); w('rock3', (0.37, 0.355, 0.33)); w('lichrock', (0.45, 0.43, 0.34))
    w('weed', (0.40, 0.33, 0.10), 0.35); w('weed2', (0.25, 0.22, 0.08), 0.35); w('barn', (0.48, 0.47, 0.43)); w('slime', (0.17, 0.19, 0.10), 0.4)
    w('grass', (0.31, 0.39, 0.17), 0.05); w('grass2', (0.40, 0.43, 0.20), 0.05); w('heather', (0.30, 0.25, 0.20), 0.05)
    w('flower', (0.90, 0.90, 0.86), 0.1)
    w('rope', (0.55, 0.48, 0.35)); w('tyre', (0.05, 0.05, 0.05), 0.2); w('rust', (0.26, 0.15, 0.09), 0.2); w('iron', (0.18, 0.18, 0.19), 0.4)
    w('tar', (0.10, 0.085, 0.075), 0.3); w('strake', (0.50, 0.20, 0.14), 0.2)
    w('net', (0.26, 0.36, 0.31), 0.1); w('orange', (0.92, 0.38, 0.06), 0.5); w('fwhite', (0.88, 0.88, 0.85), 0.4)
    w('crate', (0.52, 0.55, 0.57), 0.3); w('crate_b', (0.15, 0.33, 0.55), 0.3); w('ring_w', (0.82, 0.80, 0.74), 0.3); w('ring_r', (0.66, 0.22, 0.16), 0.3)
    w('shade', (0.20, 0.30, 0.24), 0.5); C['lamp'] = mat('lamp', (1.0, 0.86, 0.6), 0.6, emit=0.6)


# (Acc, obox, abox, beam, board, acyl, arock and atorus are in bpyutil.py, shared with the boats)


def tiles(A, P, N, t0, t1f, tw, rows, skip, matf, lift=0.03, amp=0.024):
    """roof tiles in rows: P(t, f) a point on the roof (t along a row, f from the eave to the ridge), N(t, f) its normal; t1f(f) where a
    row ends, tw a tile's width, rows [(f0, f1)] each row's lower edge and its top (under the next row); skip(t, f) leaves a tile out
    (a broken one, or where the dormer stands), matf(t, f) its material. Each tile is a shallow V with a lip at its lower edge."""
    for f0, f1 in rows:
        fm = (f0 + f1) / 2; t1 = t1f(fm); n = max(1, int(round((t1 - t0) / tw))); w = (t1 - t0) / n
        for j in range(n):
            ta = t0 + j * w; tm = ta + w / 2; tb = ta + w
            if skip(tm, fm): continue
            m = matf(tm, fm); B, T, L = [], [], []
            for t, o in ((ta, amp), (tm, -amp), (tb, amp)):
                nb = N(t, f0); B.append(A.v(P(t, f0) + nb * (lift + o))); T.append(A.v(P(t, f1) + N(t, f1) * (o * 0.5))); L.append(A.v(P(t, f0) + nb * (o - 0.012)))
            nn = N(tm, fm)
            for k in range(2):
                A.f([B[k], B[k + 1], T[k + 1], T[k]], m, nn); A.f([L[k], L[k + 1], B[k + 1], B[k]], m, (P(tm, f0) - P(tm, f1)).normalized())


# ---------- the ground: the bank of rock and rockweed up to the grass ----------
def interp1(tab, x):
    if x <= tab[0][0]: return tab[0][1]
    for (a, va), (b, vb) in zip(tab, tab[1:]):
        if x <= b: return va + (vb - va) * (x - a) / (b - a)
    return tab[-1][1]

BANK = [(-3.0, -2.9), (0.0, -2.6), (1.5, -1.6), (3.4, -0.45), (5.2, 0.55), (7.4, 1.45), (9.6, QTOP - 0.3), (12.0, QTOP + 0.35), (16.0, QTOP + 0.9)]
def noise(x, y): return 0.12 * math.sin(1.3 * x + 0.7 * y) * math.cos(0.9 * y - 0.4 * x) + 0.06 * math.sin(3.1 * x + 2.3 * y + 1.0)
def bankz(x, y):
    z = interp1(BANK, y) + noise(x, y); ax = abs(x)
    if ax > 11.0:
        t = min(1.0, (ax - 11.0) / 5.0); t = t * t * (3 - 2 * t); z += (min(z, interp1(BANK, y) - 1.2) - z) * t
    return z

def ground_mat(z, x, y, rr):
    if z < -0.6: return C['weed2']
    if z < 0.9: return C['weed'] if noise(x * 2.1, y * 1.7) > -0.08 else C['weed2']
    if z < 1.5: return C['barn'] if noise(x * 1.9 + 5, y * 2.7) > 0.07 else C['rock3']
    if z < QTOP + 0.1: return C['rock1'] if noise(x * 1.1 + 3, y * 1.3) > -0.02 else C['rock2']
    k = noise(x * 0.9 + 7, y * 1.3)
    return C['grass'] if k > -0.03 else C['grass2'] if k > -0.1 else C['heather']

def bank(A, fine=True):
    rr = random.Random(3); st = 1.0 if fine else 2.0; sy = 0.76 if fine else 1.9
    xs = [-17.0 + st * i for i in range(int(34 / st) + 1)]; ys = [-3.0 + sy * j for j in range(int(19 / sy) + 1)]
    G = [[A.v((x, y, bankz(x, y) + (rr.uniform(-0.04, 0.04) if fine else 0.0))) for y in ys] for x in xs]
    for i in range(len(xs) - 1):
        for j in range(len(ys) - 1):
            q = [G[i][j], G[i + 1][j], G[i + 1][j + 1], G[i][j + 1]]; cz = sum(v.co.z for v in q) / 4
            A.f(q, ground_mat(cz, xs[i], ys[j], rr), (0, 0, 1))
    if not fine: return
    # boulders along the shore, weedy below the high-water line, lichen on their tops above it
    def mf(cen, nrm):
        if cen.z < 0.85: return C['weed'] if cen.z > -0.4 else C['weed2']
        return C['lichrock'] if nrm.z > 0.65 and rr.random() < 0.5 else rr.choice((C['rock1'], C['rock2'], C['rock3']))
    for k in range(34):
        x = rr.uniform(-14.5, 14.5); y = rr.uniform(0.8, 8.0) if k < 27 else rr.uniform(9.0, 14.0); r = rr.uniform(0.22, 0.85) * (0.6 if k >= 27 else 1.0)
        if NX0 + 0.3 < x < NX1 - 0.3 and NY0 + 0.3 < y < NY1 - 0.3 and r > 0.5: r = 0.45   # under the house they are smaller
        arock(A, (x, y, bankz(x, y) - 0.25 * r), r, (rr.uniform(0.9, 1.3), rr.uniform(0.8, 1.2), rr.uniform(0.5, 0.75)), rr, mf, 1 if r > 0.55 else 0)
    # tufts of grass and a few cow parsley heads on the bank behind
    for k in range(40):
        x = rr.uniform(-12, 12); y = rr.uniform(9.6, 15.5)
        if NX0 - 0.2 < x < NX1 + 0.2 and y < NY1 + 0.2: continue
        z = bankz(x, y); m = rr.choice((C['grass'], C['grass2'], C['grass2']))
        for b in range(5):
            a = rr.uniform(0, 2 * math.pi); h = rr.uniform(0.25, 0.55); lx, ly = math.cos(a) * 0.1, math.sin(a) * 0.1
            base = V((x + lx, y + ly, z - 0.02)); tip = base + V((lx * 1.6, ly * 1.6, h)); s = V((-ly, lx, 0)).normalized() * 0.025
            for q in ((base - s, base + s, tip), (base + s, base - s + V((0, 0, 0.001)), tip)): A.poly(q, m)
        if k % 5 == 0:
            for b in range(3):
                bx, by = x + rr.uniform(-0.3, 0.3), y + rr.uniform(-0.3, 0.3); h = rr.uniform(0.7, 1.1)
                acyl(A, (bx, by, z), (bx, by, z + h), 0.012, lambda zz: C['grass'], 4, cap=False)
                arock(A, (bx, by, z + h), 0.09, (1.4, 1.4, 0.45), rr, lambda c_, n_: C['flower'], 0)

def stone_pier(A, rr):
    """the dry-stone pier under the west gable: courses of flat stones from the bank up to the sill"""
    top = FLOOR - 0.32; x0, x1 = NX0 - 0.42, NX0 + 0.42
    z = min(bankz(NX0, y) for y in (NY0, NY1)) - 0.2
    while z < top - 0.05:
        h = min(rr.uniform(0.2, 0.34), top - z); y = NY0 - rr.uniform(0.0, 0.3)
        while y < NY1:
            L = rr.uniform(0.42, 0.8); yc = min(y + L / 2, NY1 - 0.15)
            if z + h > bankz(NX0, yc) - 0.15:
                a = rr.uniform(-0.08, 0.08); ca, sa = math.cos(a), math.sin(a); dx = rr.uniform(-0.05, 0.05)
                obox(A, ((x0 + x1) / 2 + dx, yc, z + h / 2), (ca * (x1 - x0) / 2, sa * (x1 - x0) / 2, 0), (-sa * L / 2 * 0.96, ca * L / 2 * 0.96, 0), (0, 0, h / 2 * 0.95),
                     rr.choice((C['rock1'], C['rock2'], C['rock3'], C['lichrock'])))
            y += L
        z += h

def log_crib(A, rr):
    """a crib of round logs under the quay's west corner, as old quays stood on"""
    x0, x1, y0, y1 = -8.7, -7.3, 1.9, 3.5; z = bankz(-8.0, 2.7) - 0.15; k = 0
    while z < QTOP - 0.62:
        for s_ in (0, 1):
            if k % 2 == 0: p0, p1 = V((x0, y0 + 0.15 + s_ * (y1 - y0 - 0.3), z + 0.12)), V((x1, y0 + 0.15 + s_ * (y1 - y0 - 0.3), z + 0.12))
            else: p0, p1 = V((x0 + 0.15 + s_ * (x1 - x0 - 0.3), y0, z + 0.12)), V((x0 + 0.15 + s_ * (x1 - x0 - 0.3), y1, z + 0.12))
            acyl(A, p0, p1, 0.12, lambda zz: C['wwet'] if zz < 1.0 else C['w4'], 7)
        z += 0.2; k += 1


# ---------- the quay on piles ----------
def tidal(zz):
    return C['wwet'] if zz < -0.9 else C['slime'] if zz < 0.2 else C['weed2'] if zz < 0.72 else C['barn'] if zz < 0.88 else C['w4']

def quay(A, fine=True):
    rr = random.Random(5); x0, x1, y0, y1 = QUAY; tones = (C['w1'], C['w2'], C['w3'], C['w4'], C['w5'], C['w2'])
    if not fine:
        abox(A, x0, x1, y0, y1, QTOP - 0.55, QTOP, C['w2'])
        for xb in BENTS[::2]:
            for py in (PILE_Y[0], PILE_Y[2]): abox(A, xb - 0.15, xb + 0.15, py - 0.15, py + 0.15, -2.0, QTOP - 0.55, C['wwet'])
        return
    # the deck: loose planks across, with gaps; one is gone, one broken at the face and hanging down
    n = int((x1 - x0) / 0.245); gone = {9, 41}; broke = 27
    for k in range(n):
        xa = x0 + k * 0.245 + rr.uniform(0.0, 0.012); xb = xa + 0.22
        if k in gone: continue
        m = rr.choice(tones); zt = [QTOP + rr.uniform(-0.014, 0.01) for _ in range(4)]
        ya = rr.uniform(0.0, 0.04) if k != broke else 1.05
        P = [V((xa, ya, zt[0])), V((xb, ya, zt[1])), V((xb, y1, zt[2])), V((xa, y1, zt[3]))]
        A.poly(P, m, (0, 0, 1))
        for a, b, out in ((P[0], P[3], (-1, 0, 0)), (P[1], P[2], (1, 0, 0)), (P[0], P[1], (0, -1, 0))):
            A.poly([a, b, b - V((0, 0, 0.055)), a - V((0, 0, 0.055))], C['wdark'] if out[1] else m, out)
        if k == broke:
            # the outer piece hinges down from the break, its end in the water
            h0 = V((xa, 1.0, QTOP - 0.03)); ang = math.radians(28)
            Q = [h0 + V((dx, -dl * math.cos(ang), -dl * math.sin(ang))) for dx, dl in ((0, 0.95), (0.22, 0.95), (0.22, 0.0), (0, 0.0))]
            board(A, Q, (0, -math.sin(ang), math.cos(ang)), 0.05, m)
    # under the deck: the stringers along it, the caps of the bents, the face beam and the kerb log on top
    for sy in (0.3, 1.25, 2.2, 3.15): abox(A, x0, x1, sy - 0.09, sy + 0.09, QTOP - 0.305, QTOP - 0.055, C['w4'], skip=('+z',))
    abox(A, x0, x1, 0.0, 0.16, QTOP - 0.36, QTOP - 0.055, C['wdark'], skip=('+z',))
    for xb in BENTS: abox(A, xb - 0.12, xb + 0.12, -0.05, 3.45, QTOP - 0.55, QTOP - 0.305, C['w4'])
    for ka, kb in ((x0 + 0.1, LADDER - 0.4), (LADDER + 0.4, -0.2), (1.6, x1 - 0.1)):
        abox(A, ka, kb, 0.02, 0.2, QTOP - 0.01, QTOP + 0.15 + rr.uniform(-0.01, 0.01), C['w4'])
    # the piles: three to a bent, leaning a little; X bracing on every other bent, one brace hanging loose
    for i, xb in enumerate(BENTS):
        for py in PILE_Y:
            dx, dy = rr.uniform(-0.06, 0.06), rr.uniform(-0.05, 0.05)
            acyl(A, (xb + dx * 2, py + dy * 2, bankz(xb, py) - 0.4), (xb, py, QTOP - 0.55), rr.uniform(0.13, 0.17), tidal, 7, cuts=(-0.9, 0.2, 0.72, 0.88))
        if i % 2 == 1:
            xx = xb + 0.17; za, zb = -0.6, QTOP - 0.62
            beam(A, (xx, PILE_Y[0], za), (xx, PILE_Y[2], zb), 0.05, 0.18, C['w4'] if True else None, up=(1, 0, 0))
            if i == 3:
                # the other brace broke at its foot and hangs from its top bolt
                beam(A, (xx + 0.05, PILE_Y[2] - 0.05, zb), (xx + 0.05, PILE_Y[2] - 0.55, zb - 1.9), 0.05, 0.18, C['w2'], up=(1, 0, 0))
            else:
                beam(A, (xx + 0.05, PILE_Y[2], za), (xx + 0.05, PILE_Y[0], zb), 0.05, 0.18, C['w4'], up=(1, 0, 0))
        # a fender pile in front of each bent, its top rotted and slanted
        fx = xb + rr.uniform(-0.05, 0.05)
        acyl(A, (fx, -0.17, bankz(fx, -0.2) - 0.4), (fx, -0.17, QTOP + rr.uniform(0.25, 0.5)), 0.14, tidal, 7, cuts=(-0.9, 0.2, 0.72, 0.88))
    # wooden bollards through the deck, darker at the top with an iron band
    for bx, by in BOLL:
        acyl(A, (bx, by, QTOP - 0.6), (bx, by, QTOP + 0.75), 0.17, lambda zz: C['w2'] if zz < QTOP + 0.55 else C['wdark'], 10, cuts=(QTOP + 0.55,))
        acyl(A, (bx, by, QTOP + 0.44), (bx, by, QTOP + 0.52), 0.18, lambda zz: C['iron'], 10)
    # the ladder down the face: two rails, rungs, slimy below the high-water mark
    for lx in (LADDER - 0.25, LADDER + 0.25):
        acyl(A, (lx, -0.14, -1.6), (lx, -0.14, QTOP + 0.15), 0.035, lambda zz: C['slime'] if zz < 0.9 else C['w2'], 6, cuts=(0.9,))
        acyl(A, (lx, -0.14, QTOP + 0.15), (lx, 0.3, QTOP + 0.95), 0.035, lambda zz: C['w2'], 6)
    z = -1.4
    while z < QTOP - 0.1:
        acyl(A, (LADDER - 0.25, -0.14, z), (LADDER + 0.25, -0.14, z), 0.022, lambda zz, z_=z: C['slime'] if z_ < 0.9 else C['w3'], 6, cap=False); z += 0.3
    # old tyres for fenders, hung on ropes from the kerb
    for tx in (-1.9, 2.1):
        atorus(A, (tx, -0.33, QTOP - 0.95), (0, 1, 0), 0.3, 0.11, lambda a: C['tyre'], 14, 6)
        acyl(A, (tx, 0.1, QTOP + 0.12), (tx, -0.33, QTOP - 0.55), 0.015, lambda zz: C['rope'], 4, cap=False)


def quay_props(A, rr):
    # a coil of rope by the middle bollard, a net heap with floats against the wall, crates, a barrel
    for k in range(4): atorus(A, (-3.0, 1.0, QTOP + 0.035 + 0.06 * k), (0, 0, 1), 0.3 - 0.015 * k, 0.03, lambda a: C['rope'], 14, 5)
    arock(A, (-4.3, 2.75, QTOP + 0.05), 0.75, (1.2, 0.8, 0.42), rr, lambda c_, n_: C['net'], 1)
    for k in range(5):
        arock(A, (-4.9 + 0.3 * k, 2.55 + 0.1 * (k % 2), QTOP + 0.3 + 0.04 * (k % 3)), 0.13, (1, 1, 1), rr, lambda c_, n_: C['orange'], 1)
    for k, (cx, cy, h) in enumerate(((4.7, 2.75, 0), (4.7, 2.75, 1), (5.55, 2.7, 0))):
        m = C['crate'] if k < 2 else C['crate_b']; z0 = QTOP + 0.31 * h
        abox(A, cx - 0.4, cx + 0.4, cy - 0.3, cy + 0.3, z0, z0 + 0.3, m)
    bx, by = -1.25, 2.95
    acyl(A, (bx, by, QTOP), (bx, by, QTOP + 0.85), 0.29, lambda zz: C['w5'], 12, r1=0.27)
    for hz in (QTOP + 0.15, QTOP + 0.68): acyl(A, (bx, by, hz), (bx, by, hz + 0.05), 0.3, lambda zz: C['rust'], 12, cap=False)


# ---------- the naust ----------
def wall(A, a, b, nrm, zb, top, opens, rr, lean=None, miss=0.03):
    """vertical boards from a to b facing nrm, from zb to top(s) (s along the wall), round the openings [(s0, s1, z0, z1)]; the bottom
    of each board is dark with damp; lean(s, z) moves a point (a gable that leans out)"""
    a = V((a[0], a[1], 0)); b = V((b[0], b[1], 0)); u = b - a; L = u.length; u.normalize(); n = V((nrm[0], nrm[1], 0))
    tones = (C['w1'], C['w2'], C['w3'], C['w4'], C['w5'], C['w1'], C['w2'], C['w3'], C['w6'])
    s = 0.0
    while s < L - 0.02:
        w = min(L - s, rr.uniform(0.18, 0.235)); g = rr.uniform(0.004, 0.012); s0, s1 = s + g / 2, s + w - g / 2; s += w
        if rr.random() < miss: continue
        off = rr.uniform(0.0, 0.012); m = rr.choice(tones); z0 = zb + rr.uniform(-0.06, 0.03); dark = z0 + rr.uniform(0.22, 0.5)
        pieces = [(s0, s1, z0, None)]
        for os0, os1, oz0, oz1 in opens:
            nxt = []
            for pa, pb, za, zt in pieces:
                if pb <= os0 or pa >= os1: nxt.append((pa, pb, za, zt)); continue
                if pa < os0: nxt.append((pa, os0, za, zt))
                if pb > os1: nxt.append((os1, pb, za, zt))
                ma, mb = max(pa, os0), min(pb, os1)
                if oz0 > za + 0.03: nxt.append((ma, mb, za, oz0))
                nxt.append((ma, mb, oz1, zt))
            pieces = nxt
        for pa, pb, za, zt in pieces:
            ta = top(pa) if zt is None else zt; tb = top(pb) if zt is None else zt
            if ta - za < 0.02 and tb - za < 0.02: continue
            P = lambda ss, zz: a + u * ss + n * off + V((0, 0, zz)) + (lean(ss, zz) if lean else V())
            cuts = [(za, min(dark, ta, tb), C['wdark'])] if za < dark and za <= z0 + 0.001 else []
            lo = cuts[0][1] if cuts else za
            if cuts: board(A, [P(pa, za), P(pb, za), P(pb, lo), P(pa, lo)], n, 0.024, C['wdark'], 'v')
            if max(ta, tb) - lo > 0.02: board(A, [P(pa, lo), P(pb, lo), P(pb, max(lo, tb)), P(pa, max(lo, ta))], n, 0.024, m, 'v')

def window(A, Gl, a, u, n, s, z, w, h, broken):
    """a small four-pane window with its casing, the sill board and the panes (one out if broken)"""
    a = V(a); u = V(u); n = V(n); P = lambda ss, zz, o: a + u * ss + n * o + V((0, 0, zz))
    for (sa, sb, za, zb) in ((s - w / 2 - 0.09, s - w / 2, z - 0.05, z + h + 0.06), (s + w / 2, s + w / 2 + 0.09, z - 0.05, z + h + 0.06), (s - w / 2 - 0.09, s + w / 2 + 0.09, z + h, z + h + 0.1)):
        board(A, [P(sa, za, 0.04), P(sb, za, 0.04), P(sb, zb, 0.04), P(sa, zb, 0.04)], n, 0.03, C['trim'])
    board(A, [P(s - w / 2 - 0.14, z - 0.06, 0.09), P(s + w / 2 + 0.14, z - 0.06, 0.09), P(s + w / 2 + 0.14, z, 0.0), P(s - w / 2 - 0.14, z, 0.0)], V((0, 0, 1)) * 0.5 + n * 0.5, 0.04, C['trim'])
    f = 0.045
    for (sa, sb, za, zb) in ((s - w / 2, s - w / 2 + f, z, z + h), (s + w / 2 - f, s + w / 2, z, z + h), (s - w / 2, s + w / 2, z, z + f), (s - w / 2, s + w / 2, z + h - f, z + h),
                             (s - 0.018, s + 0.018, z, z + h), (s - w / 2, s + w / 2, z + h / 2 - 0.018, z + h / 2 + 0.018)):
        board(A, [P(sa, za, 0.025), P(sb, za, 0.025), P(sb, zb, 0.025), P(sa, zb, 0.025)], n, 0.03, C['frame'])
    for i in range(2):
        for j in range(2):
            if broken and i == 0 and j == 0: continue
            sa = s - w / 2 + f + i * (w / 2 - f); sb = sa + w / 2 - f - 0.018; za = z + f + j * (h / 2 - f); zb = za + h / 2 - f - 0.018
            Gl.poly([P(sa, za, 0.0), P(sb, za, 0.0), P(sb, zb, 0.0), P(sa, zb, 0.0)], C['glass'], n)

def door(A, rr):
    """the loft door under the dormer: two ledged and braced leaves, the right one ajar"""
    x0, x1, zt = DOOR; n = V((0, -1, 0)); xm = (x0 + x1) / 2
    for (sa, sb, za, zb) in ((x0 - 0.1, x0, FLOOR - 0.05, zt + 0.1), (x1, x1 + 0.1, FLOOR - 0.05, zt + 0.1), (x0 - 0.1, x1 + 0.1, zt, zt + 0.12)):
        board(A, [V((sa, NY0 - 0.04, za)), V((sb, NY0 - 0.04, za)), V((sb, NY0 - 0.04, zb)), V((sa, NY0 - 0.04, zb))], n, 0.03, C['trim'])
    abox(A, x0 - 0.1, x1 + 0.1, NY0 - 0.3, NY0, FLOOR - 0.12, FLOOR - 0.02, C['w4'])
    for leaf, (ha, hb, ang) in enumerate(((x0, xm, 0.0), (x1, xm, math.radians(24)))):
        # points across the leaf from its hinge (d from the hinge, out from the wall)
        sgn = 1 if hb > ha else -1; W = abs(hb - ha) - 0.01
        P = lambda d, zz, o: V((ha + sgn * d * math.cos(ang), NY0 - 0.02 - o - d * math.sin(ang), zz))
        k = 0; d = 0.0
        while d < W - 0.02:
            bw = min(W - d, 0.2)
            board(A, [P(d, FLOOR, 0.0), P(d + bw - 0.006, FLOOR, 0.0), P(d + bw - 0.006, zt - 0.01, 0.0), P(d, zt - 0.01, 0.0)], V((sgn * math.sin(ang) * 0, -1, 0)), 0.03, rr.choice((C['w1'], C['w3'], C['w2'])))
            d += bw; k += 1
        for zz in (FLOOR + 0.25, FLOOR + 1.0, zt - 0.3):
            board(A, [P(0.05, zz, 0.03), P(W - 0.05, zz, 0.03), P(W - 0.05, zz + 0.12, 0.03), P(0.05, zz + 0.12, 0.03)], (0, -1, 0), 0.03, C['w4'])
        for za, zb in ((FLOOR + 0.37, FLOOR + 1.0), (FLOOR + 1.12, zt - 0.3)):
            board(A, [P(0.08, za, 0.03), P(0.2, za, 0.03), P(W - 0.08, zb, 0.03), P(W - 0.2, zb, 0.03)], (0, -1, 0), 0.03, C['w4'])
        if leaf == 0: abox(A, hb - 0.16, hb - 0.04, NY0 - 0.1, NY0 - 0.06, FLOOR + 1.0, FLOOR + 1.08, C['rust'])

def sag(x): return -0.17 * max(0.0, 1 - (x / 6.4) ** 2) + 0.025 * math.sin(x * 0.8 + 0.6)
def roofP(x, f, side):
    ye = YE if side < 0 else NY1 + OHE
    return V((x, ye + (YM - ye) * f, ZE + (RIDGE - ZE) * f + sag(x) * (0.35 + 0.65 * f)))
def roofN(side): return V((0, side * math.sin(A40), math.cos(A40)))
def fmeet(d):
    """how far up the front slope (f) the dormer's roof meets it, d from the dormer's middle"""
    return (DTOP - d * DT - ZE) / (RIDGE - ZE)
def under_dormer(x, f, pad=0.0): d = abs(x - XD); return d < DM + pad and f < fmeet(d) + 0.02

def roof(A, fine=True):
    rr = random.Random(9)
    if not fine:
        for side in (-1, 1):
            P = [roofP(XA, 0, side), roofP(XB, 0, side), roofP(XB, 1, side), roofP(XA, 1, side)]
            board(A, P, roofN(side), 0.15, C['tile1'])
        A.poly([V((XD - DM, NY0 - DOH, DTOP - DM * DT)), V((XD, NY0 - DOH, DTOP)), V((XD, NY0 + 2.0, DTOP))], C['tile1'], (-1, 0, 1))
        A.poly([V((XD + DM, NY0 - DOH, DTOP - DM * DT)), V((XD, NY0 - DOH, DTOP)), V((XD, NY0 + 2.0, DTOP))], C['tile1'], (1, 0, 1))
        return
    # the sarking under the tiles (seen where tiles are gone and from below at the overhangs)
    nx, nf = 25, 7
    for side in (-1, 1):
        for i in range(nx):
            for j in range(nf):
                xa = XA + (XB - XA) * i / nx; xb = XA + (XB - XA) * (i + 1) / nx; fa = j / nf; fb = (j + 1) / nf
                if side < 0 and under_dormer((xa + xb) / 2, (fa + fb) / 2, 0.15): continue
                P = [roofP(xa, fa, side), roofP(xb, fa, side), roofP(xb, fb, side), roofP(xa, fb, side)]
                A.poly(P, C['sark'], roofN(side))
                A.poly([p - V((0, 0, 0.06)) for p in P], C['sark'], -roofN(side))
    # the tiles, rows of 0.33 m on a 4.5 m slope, mossy in patches and along the eaves, a few gone
    nr = 13; rows = [(r / nr, min(1.0, (r + 1.15) / nr)) for r in range(nr)]
    gone = set((rr.randrange(38), rr.randrange(nr), rr.choice((-1, 1))) for _ in range(14))
    def matf(x, f, side, salt=0.0):
        mo = 0.5 + 0.5 * math.sin(0.9 * x + 3.1 * f + salt) * math.cos(0.55 * x - 2.3 * f + 1.0 + salt) + (0.22 if f < 0.2 else 0.0) + (0.1 if side > 0 else 0.0) + rr.uniform(-0.12, 0.12)
        if mo > 0.78: return C['moss_y']
        if mo > 0.66: return C['moss_g']
        if rr.random() < 0.03: return C['lichen']
        return rr.choice((C['tile1'], C['tile2'], C['tile3'], C['tile1']))
    tw = (XB - XA) / 38
    for side in (-1, 1):
        def skip(x, f, side=side):
            i = int((x - XA) / tw); r = int(f * nr)
            if (i, r, side) in gone: return True
            if side < 0 and under_dormer(x, f): return True
            # a broken patch beside the dormer's foot
            return side < 0 and XD + DM < x < XD + DM + 0.9 and f < 0.22 and rr.random() < 0.35
        tiles(A, lambda x, f, side=side: roofP(x, f, side), lambda x, f, side=side: roofN(side), XA, lambda f: XB, tw, rows, skip, lambda x, f, side=side: matf(x, f, side))
    # half-round ridge tiles along the sagging ridge
    x = XA - 0.05
    while x < XB:
        xb = min(XB + 0.05, x + 0.42); m = matf(x, 0.9, 1, 2.0); rot = rr.uniform(-0.04, 0.04)
        ring = lambda xx: [roofP(xx, 1, -1) + V((0, math.cos(a + rot) * 0.13, 0.02 + math.sin(a + rot) * 0.13)) for a in [math.pi * k / 6 for k in range(7)]]
        ra, rb = [A.v(p) for p in ring(x)], [A.v(p) for p in ring(xb + 0.02)]
        for k in range(6): A.f([ra[k], ra[k + 1], rb[k + 1], rb[k]], m, (0, math.cos(math.pi * (k + 0.5) / 6), math.sin(math.pi * (k + 0.5) / 6)))
        x = xb
    # the fascia along the eaves (broken off at the dormer on the front), barge boards on the gables, rafter tails
    for side in (-1, 1):
        ye = (YE if side < 0 else NY1 + OHE) + side * 0.03
        spans = ((XA, XD - DM), (XD + DM, XB)) if side < 0 else ((XA, XB),)
        for xa, xb in spans:
            k = 12; pts = [roofP(xa + (xb - xa) * i / k, 0, side) for i in range(k + 1)]
            for i in range(k):
                p, q = pts[i], pts[i + 1]
                board(A, [V((p.x, ye, p.z - 0.21)), V((q.x, ye, q.z - 0.21)), V((q.x, ye, q.z + 0.02)), V((p.x, ye, p.z + 0.02))], (0, side, 0), 0.03, C['w4'])
        for xr in [NX0 + 0.45 + 0.9 * k for k in range(13)]:
            if side < 0 and abs(xr - XD) < DM: continue
            p = roofP(xr, 0, side); q = roofP(xr, OHE / (OHE + HW), side)
            beam(A, p - V((0, 0, 0.14)), q - V((0, 0, 0.14)), 0.07, 0.14, C['w4'], up=roofN(side))
    for xx, sgn in ((XA - 0.03, -1), (XB + 0.03, 1)):
        for side in (-1, 1):
            f0 = 0.0
            if xx > 0 and side < 0:
                # the east barge board on the front lost its lower end; the piece hangs from a nail
                f0 = 0.28; p = roofP(xx, 0.27, side); q = p + V((0, -0.55, -0.85))
                board(A, [p - V((0, 0, 0.2)), q - V((0, 0, 0.2)), q, p], (sgn, 0, 0), 0.04, C['w2'])
            k = 8; pts = [roofP(xx, f0 + (1 - f0) * i / k, side) for i in range(k + 1)]
            for i in range(k):
                p, q = pts[i], pts[i + 1]
                board(A, [p - V((0, 0, 0.22)), q - V((0, 0, 0.22)), q + V((0, 0, 0.03)), p + V((0, 0, 0.03))], (sgn, 0, 0), 0.04, C['w3'])

def dormer(A, rr, fine=True):
    """the wall dormer: its gable is the front wall carried up (wall() does that), here its roof, sarking, ridge and barge boards"""
    if not fine: return
    yf = NY0 - DOH; ymeet = lambda d: YE + (DTOP - d * DT - ZE) / TP
    nr = 7; rows = [(r / nr, min(1.0, (r + 1.15) / nr)) for r in range(nr)]
    for s_ in (-1, 1):
        P = lambda y, f, s_=s_: V((XD + s_ * DM * (1 - f), y, DTOP - DM * (1 - f) * DT))
        N = lambda y, f, s_=s_: V((s_ * math.sin(A52), 0, math.cos(A52)))
        tiles(A, P, N, yf, lambda f: ymeet(DM * (1 - f)) + 0.08, 0.33, rows, lambda y, f: rr.random() < 0.03,
              lambda y, f: C['moss_y'] if rr.random() < 0.18 else C['moss_g'] if rr.random() < 0.15 else rr.choice((C['tile1'], C['tile2'], C['tile3'])))
        for j in range(4):
            fa, fb = j / 4, (j + 1) / 4
            Q = [P(yf, fa), P(yf, fb), P(ymeet(DM * (1 - fb)), fb), P(ymeet(DM * (1 - fa)), fa)]
            A.poly(Q, C['sark'], N(0, 0)); A.poly([q - V((0, 0, 0.06)) for q in Q], C['sark'], -N(0, 0))
    # the ridge over it, and the wide barge boards, the east one split with its tip gone
    y = yf - 0.03
    while y < ymeet(0):
        yb = min(ymeet(0) + 0.1, y + 0.42)
        ring = lambda yy: [V((XD + math.cos(a) * 0.12, yy, DTOP + 0.02 + math.sin(a) * 0.12)) for a in [math.pi * k / 6 for k in range(7)]]
        ra, rb = [A.v(p) for p in ring(y)], [A.v(p) for p in ring(yb + 0.02)]
        for k in range(6): A.f([ra[k], ra[k + 1], rb[k + 1], rb[k]], C['tile1'], (math.cos(math.pi * (k + 0.5) / 6), 0, math.sin(math.pi * (k + 0.5) / 6)))
        y = yb
    yb_ = yf - 0.04
    for s_ in (-1, 1):
        e = V((XD + s_ * DM, yb_, DTOP - DM * DT + 0.02)); t = V((XD - s_ * 0.16, yb_, DTOP + 0.16 + 0.02))
        if s_ > 0: e = e + (t - e) * 0.3   # the lower third of the east board is gone
        dn = V((0, 0, -0.3))
        board(A, [e + dn, t + dn, t, e], (0, -1, 0), 0.045, C['trim'])
    if True:
        # the piece of the east board, hanging down off the eave
        p = V((XD + DM * 0.72, yb_ - 0.02, DTOP - DM * 0.72 * DT - 0.25)); q = p + V((0.25, 0, -0.95))
        board(A, [p, p + V((0.26, 0, 0.05)), q + V((0.26, 0, 0.05)), q], (0, -1, 0), 0.04, C['w2'])
    # the hoist beam out of the dormer's gable, with its block and the rope down past the door
    hb = (XD, NY0 - 1.0, DTOP - 0.55)
    beam(A, (XD, NY0 + 0.2, DTOP - 0.55), hb, 0.16, 0.18, C['w4'])
    acyl(A, (XD, NY0 - 0.92, DTOP - 0.65), (XD, NY0 - 0.92, DTOP - 0.95), 0.07, lambda zz: C['w5'], 8)
    acyl(A, (XD + 0.05, NY0 - 0.9, DTOP - 0.95), (XD + 0.07, NY0 - 0.88, FLOOR + 0.6), 0.016, lambda zz: C['rope'], 4)
    acyl(A, (XD - 0.05, NY0 - 0.94, DTOP - 0.95), (XD - 0.2, NY0 - 0.6, FLOOR + 2.4), 0.016, lambda zz: C['rope'], 4)

def naust(A, Gl, fine=True):
    rr = random.Random(21)
    if not fine:
        abox(A, NX0, NX1, NY0, NY1, FLOOR - 0.35, EAVES, C['w2'])
        for x in (NX0, NX1):
            A.poly([V((x, NY0, EAVES)), V((x, NY1, EAVES)), V((x, YM, RIDGE))], C['w2'], (1 if x > 0 else -1, 0, 0))
        A.poly([V((XD - DW / 2, NY0, EAVES)), V((XD + DW / 2, NY0, EAVES)), V((XD, NY0, DTOP))], C['w2'], (0, -1, 0))
        for y in (NY0, YM, NY1):
            for x in (-3.0, 0.0, 3.0, NX1): abox(A, x - 0.13, x + 0.13, y - 0.13, y + 0.13, bankz(x, y) - 0.2, FLOOR - 0.32, C['w4'])
        abox(A, NX0 - 0.42, NX0 + 0.42, NY0, NY1, bankz(NX0, YM) - 0.3, FLOOR - 0.32, C['rock2'])
        return
    # what stands under the floor: posts on the rocks, the sills, the floor's underside, the stone pier under the west gable
    for y in (NY0, YM, NY1):
        for x in (-3.0, 0.0, 3.0, NX1):
            dx, dy = rr.uniform(-0.05, 0.05), rr.uniform(-0.05, 0.05)
            acyl(A, (x + dx, y + dy, bankz(x, y) - 0.25), (x, y, FLOOR - 0.32), 0.13, lambda zz: C['wwet'] if zz < 0.6 else C['barn'] if zz < 0.85 else C['w4'], 8, cuts=(0.6, 0.85))
        abox(A, NX0, NX1, y - 0.12, y + 0.12, FLOOR - 0.32, FLOOR - 0.08, C['w4'])
    abox(A, NX0, NX1, NY0, NY1, FLOOR - 0.12, FLOOR - 0.02, C['sark'], skip=('+z',))
    stone_pier(A, rr)
    # dark inside, behind the boards, where one is missing or the door stands open
    abox(A, NX0 + 0.05, NX1 - 0.05, NY0 + 0.05, NY1 - 0.05, FLOOR - 0.3, EAVES, C['inside'], skip=('+z', '-z'))
    for x, sx in ((NX0 + 0.05, -1), (NX1 - 0.05, 1)):
        A.poly([V((x, NY0 + 0.05, EAVES)), V((x, NY1 - 0.05, EAVES)), V((x, YM, RIDGE - 0.15))], C['inside'], (sx, 0, 0))
    A.poly([V((XD - DW / 2 + 0.05, NY0 + 0.05, EAVES)), V((XD + DW / 2 - 0.05, NY0 + 0.05, EAVES)), V((XD, NY0 + 0.05, DTOP - 0.1))], C['inside'], (0, -1, 0))
    # the walls: the front carried up into the dormer's gable, the gables up to the roof (the west one leaning out), the back
    zb = FLOOR - 0.34
    def ftop(s):
        x = NX0 + s; d = abs(x - XD)
        return EAVES + (DW / 2 - d) * DT - 0.03 if d < DW / 2 else EAVES
    gtop = lambda y: EAVES + (HW - abs(y - YM)) * TP - 0.03
    wins = {'front': [], 'back': [], 'east': [], 'west': []}
    for wall_, wx, wz, ww, wh, br in WINS: wins[wall_].append((wx, wz, ww, wh, br))
    fo = [(x - NX0 - w / 2 - 0.09, x - NX0 + w / 2 + 0.09, z - 0.05, z + h + 0.1) for x, z, w, h, b in wins['front']] + [(DOOR[0] - NX0 - 0.1, DOOR[1] - NX0 + 0.1, zb - 0.1, DOOR[2] + 0.12)]
    # a gap high in the dormer's gable where boards came off
    fo.append((XD - NX0 - 0.35, XD - NX0 + 0.2, DTOP - 0.95, DTOP + 1.0))
    wall(A, (NX0, NY0), (NX1, NY0), (0, -1), zb, ftop, fo, rr)
    bo = [(NX1 - x - w / 2 - 0.09, NX1 - x + w / 2 + 0.09, z - 0.05, z + h + 0.1) for x, z, w, h, b in wins['back']]
    wall(A, (NX1, NY1), (NX0, NY1), (0, 1), zb, lambda s: EAVES, bo, rr)
    eo = [(y - NY0 - w / 2 - 0.09, y - NY0 + w / 2 + 0.09, z - 0.05, z + h + 0.1) for y, z, w, h, b in wins['east']]
    wall(A, (NX1, NY0), (NX1, NY1), (1, 0), zb, lambda s: gtop(NY0 + s), eo, rr)
    wall(A, (NX0, NY1), (NX0, NY0), (-1, 0), zb, lambda s: gtop(NY1 - s), [], rr, lean=lambda s, z: V((-0.12 * max(0.0, z - FLOOR) / (RIDGE - FLOOR), 0, 0)), miss=0.06)
    # a crooked board hanging in the dormer's gable gap
    p = V((XD - 0.15, NY0 - 0.05, DTOP - 0.95)); board(A, [p, p + V((0.2, 0, 0)), p + V((0.45, -0.02, 0.85)), p + V((0.25, -0.02, 0.85))], (0, -1, 0), 0.024, C['w1'])
    # the windows, the door, the wall plate under the eaves
    for x, z, w, h, br in wins['front']: window(A, Gl, (NX0, NY0, 0), (1, 0, 0), (0, -1, 0), x - NX0, z, w, h, br)
    for x, z, w, h, br in wins['back']: window(A, Gl, (NX1, NY1, 0), (-1, 0, 0), (0, 1, 0), NX1 - x, z, w, h, br)
    for y, z, w, h, br in wins['east']: window(A, Gl, (NX1, NY0, 0), (0, 1, 0), (1, 0, 0), y - NY0, z, w, h, br)
    door(A, rr)
    for y, sgn in ((NY0 - 0.04, -1), (NY1 + 0.04, 1)):
        for xa, xb in (((NX0, XD - DW / 2), (XD + DW / 2, NX1)) if sgn < 0 else ((NX0, NX1),)):
            abox(A, xa, xb, min(y, y - sgn * 0.14), max(y, y - sgn * 0.14), EAVES - 0.22, EAVES - 0.02, C['w4'])
    # the pole along the front, hung on two ropes from the eaves (as in the photo), the floats, the life ring, the anchor, the lamp
    py, pz = NY0 - 0.32, FLOOR + 2.15
    acyl(A, (-4.9, py, pz + 0.04), (4.7, py, pz - 0.08), 0.045, lambda zz: C['w3'], 7)
    for rx in (-3.6, 3.4): acyl(A, (rx, py, pz), (rx, YE + 0.25, sag(rx) * 0.35 + ZE - 0.15), 0.013, lambda zz: C['rope'], 4)
    acyl(A, (-4.3, NY0 - 0.06, FLOOR + 2.2), (-4.25, NY0 - 0.14, FLOOR + 0.9), 0.012, lambda zz: C['rope'], 4)
    for k, (fz, m, sc) in enumerate(((FLOOR + 1.85, C['orange'], (1, 1, 1)), (FLOOR + 1.45, C['fwhite'], (0.8, 0.8, 1.4)), (FLOOR + 1.05, C['orange'], (1, 1, 1)))):
        arock(A, (-4.27 + 0.02 * k, NY0 - 0.25, fz), 0.16, sc, rr, lambda c_, n_, m=m: m, 1)
    atorus(A, (5.0, NY0 - 0.12, FLOOR + 1.55), (0, 1, 0), 0.31, 0.065, lambda a: C['ring_r'] if int((a + 0.4) / (math.pi / 2)) % 2 == 0 else C['ring_w'], 20, 6)
    ax0 = V((2.75, NY0 - 0.7, FLOOR)); ax1 = V((2.85, NY0 - 0.14, FLOOR + 1.35))
    acyl(A, ax0, ax1, 0.035, lambda zz: C['rust'], 6)
    acyl(A, ax1 + V((-0.45, 0, -0.06)), ax1 + V((0.45, 0, 0.06)), 0.03, lambda zz: C['rust'], 6)
    for s_ in (-1, 1):
        q = ax0 + V((s_ * 0.45, 0.08, 0.28)); acyl(A, ax0, q, 0.032, lambda zz: C['rust'], 6)
        obox(A, q + V((s_ * 0.06, 0.0, 0.08)), (0.09, 0, 0.0), (0, 0.02, 0), (0, 0, 0.13), C['rust'])
    lx, ly, lz = LAMP
    acyl(A, (lx, NY0 - 0.02, lz + 0.3), (lx, ly, lz + 0.3), 0.015, lambda zz: C['iron'], 5)
    acyl(A, (lx, ly, lz + 0.3), (lx, ly, lz + 0.12), 0.015, lambda zz: C['iron'], 5)
    acyl(A, (lx, ly, lz + 0.12), (lx, ly, lz - 0.02), 0.04, lambda zz: C['shade'], 10, r1=0.17)
    arock(A, (lx, ly, lz - 0.04), 0.045, (1, 1, 1), rr, lambda c_, n_: C['lamp'], 1)


# ---------- the færing upside down on trestles beside the house ----------
def faering(fine=True):
    X0, X1, Y, Zk = 7.4, 12.0, 8.9, QTOP + 1.05; L = X1 - X0; B = 1.45; H = 0.55
    if not fine: return [box('fb', X0, X1, Y - B / 2, Y + B / 2, Zk - H, Zk, C['tar'])]
    A = Acc('faering'); rings = []; th = (0.0, 0.3, 0.6, 0.85, 1.0)
    for t in (0.0, 0.05, 0.15, 0.3, 0.5, 0.7, 0.85, 0.95, 1.0):
        b = B / 2 * max(0.03, math.sin(math.pi * t)) ** 0.75; x = X0 + L * t; sh = 0.22 * (abs(t - 0.5) * 2) ** 3   # the sheer rises to the stems
        zg = Zk - H - sh; zk = Zk - 0.05 * (1 - abs(t - 0.5) * 2)                                                  # upside down: the keel on top
        half = [(b * math.sin(a * math.pi / 2) ** 0.85, zk - (zk - zg) * (1 - math.cos(a * math.pi / 2))) for a in th]
        pts = [(x, Y + yy, zz) for yy, zz in half] + [(x, Y - yy, zz) for yy, zz in reversed(half[1:])]
        rings.append(([A.v(p) for p in pts], V((x, Y, (zk + zg) / 2)), zg))
    for (ra, ca, ga), (rb, cb, gb) in zip(rings, rings[1:]):
        n = len(ra)
        for k in range(n):
            j = (k + 1) % n; q = [ra[k], ra[j], rb[j], rb[k]]; zc = sum(v.co.z for v in q) / 4; cen = sum((v.co for v in q), V()) / 4
            m = C['inside'] if k == 4 else C['strake'] if zc < (ga + gb) / 2 + 0.16 else C['tar']   # the top strake (low, the boat being upside down)
            A.f(q, m, cen - (ca + cb) / 2)
    for r, c, g in (rings[0], rings[-1]): A.f(list(r), C['tar'], V((-1 if r is rings[0][0] else 1, 0, 0)))
    for tx in (X0 + 1.0, X1 - 1.0):
        for s_ in (-1, 1):
            beam(A, (tx - 0.35, Y + s_ * 0.55, bankz(tx - 0.35, Y + s_ * 0.55) - 0.1), (tx, Y + s_ * 0.5, Zk - H - 0.05), 0.08, 0.08, C['w4'])
            beam(A, (tx + 0.35, Y + s_ * 0.55, bankz(tx + 0.35, Y + s_ * 0.55) - 0.1), (tx, Y + s_ * 0.5, Zk - H - 0.05), 0.08, 0.08, C['w4'])
        beam(A, (tx, Y - 0.8, Zk - H - 0.1), (tx, Y + 0.8, Zk - H - 0.1), 0.12, 0.1, C['w2'])
    # two oars against the boat
    for k, oy in enumerate((Y - B / 2 - 0.15, Y - B / 2 - 0.35)):
        ox = X0 + 1.6 + 0.9 * k; base = V((ox, oy - 0.35, bankz(ox, oy - 0.35))); tip = V((ox + 0.4, oy, Zk + 0.1))
        acyl(A, base, tip, 0.025, lambda zz: C['w3'], 6)
        d = (tip - base).normalized(); obox(A, base + d * 0.35, d * 0.35, V((0, 0, 1)).cross(d).normalized() * 0.075, V((0, 0, 1)).cross(d).cross(d).normalized() * 0.012, C['w3'])
    return [A.done(40)]


# ---------- all of it ----------
def build(fine=True):
    A = Acc('naust'); Gl = Acc('naust_glass'); rr = random.Random(1)
    bank(A, fine); quay(A, fine); naust(A, Gl, fine); roof(A, fine); dormer(A, rr, fine)
    if fine: log_crib(A, rr); quay_props(A, rr)
    solids = [A.done()] + faering(fine)
    g = Gl.done() if fine else None
    if g is None: g = box('noglass', 0, 0.01, 0, 0.01, -50, -49.99, C['glass'])
    return solids, [g]


def to_game(p): return (p[0], p[2], -p[1])
def to_game_n(n): return (n[0], n[2], -n[1])

def anchors():
    """the places the game needs, in the naust's frame (x along the face, y up from mean sea level, z out to sea; metres)"""
    G = lambda x, y, z=QTOP: [round(v, 3) for v in to_game((x, y, z))]
    return {'face': {'x0': QUAY[0], 'x1': QUAY[1], 'deck': QTOP},
            'bollards': [G(x, y, QTOP + 0.75) for x, y in BOLL], 'ladder': G(LADDER, -0.14), 'door': G(XD, NY0 - 0.6),
            # [cx, cz, sx, sz, y0, y1] for the camera to stay out of: the house and the boat on its trestles
            'solids': [[(NX0 + NX1) / 2, -(NY0 + NY1) / 2, NX1 - NX0 + 0.9, NY1 - NY0 + 1.0, -1.0, RIDGE + 0.3], [9.7, -8.9, 4.8, 1.8, 0.0, QTOP + 1.2]],
            # the ground the model brings (the bank), and where the map's houses go
            'bank': {'x0': -17.0, 'x1': 17.0, 'y0': -3.0, 'y1': 16.0}, 'clear': [[-14.0, 1.0, 14.0, -16.0]],
            'lamps': [G(LAMP[0], LAMP[1], LAMP[2] - 0.05)]}

SHOTS = [('sea', (-4.0, -21.0, 2.4), (0.5, 6.0, 3.6), 30), ('sea3q', (17.0, -15.0, 6.5), (0.0, 5.0, 3.0), 30),
         ('quay', (7.0, 0.9, QTOP + 1.7), (-4.0, 3.6, QTOP + 1.8), 26), ('door', (2.6, 0.6, QTOP + 1.65), (0.6, 3.4, QTOP + 1.9), 28),
         ('piles', (-1.0, -6.5, 0.7), (0.0, 1.6, 0.9), 24), ('above', (16.0, -14.0, 20.0), (0.0, 5.0, 1.5), 30), ('roof', (-9.0, -6.0, 9.5), (0.5, 6.0, 6.5), 30)]

def main():
    os.makedirs(OUT, exist_ok=True)
    reset(); colours()
    solids, glass = build(True)
    join(solids, 'BOAT0'); join(glass, 'GLASS0')
    if 'fast' not in sys.argv and 'dry' not in sys.argv:
        # for the renders only: the water a little above mean sea level, and the shore and a mossy rock face round it
        extra = []
        bm = bmesh.new(); s_ = 200
        bm.faces.new([bm.verts.new(p) for p in ((-s_, -s_, 0.25), (s_, -s_, 0.25), (s_, s_, 0.25), (-s_, s_, 0.25))])
        extra.append(obj_from_bm('water', bm, [mat('water', (0.03, 0.09, 0.12), 0.9)]))
        ys = [15.5, 22, 30, 45, 80]; zs = [QTOP + 0.7, QTOP + 2.0, 12.0, 24.0, 40.0]
        extra.append(grid('shore', [[(x, y, z + (0 if abs(x) < 16 else 0)) for y, z in zip(ys, zs)] for x in (-80, -16, 16, 80)], lambda i, j: mat('cliff', (0.30, 0.31, 0.24), 0.05) if j >= 1 else mat('land', (0.27, 0.33, 0.16), 0.05), out=lambda c: (0, -1, 1)))
        for sx in (-1, 1):
            ys2 = [-30, -6, 0, 6, 15.5]
            extra.append(grid('side', [[(sx * x, y, (interp1(BANK, y) - 1.2 if y > -6 else -4.0) + (x - 16) * 0.04 * (1 if y > 0 else 0)) for y in ys2] for x in (16, 90)][::sx],
                              lambda i, j: mat('land2', (0.27, 0.32, 0.18), 0.05) if j >= 2 else mat('rockside', (0.26, 0.255, 0.24), 0.05), out=lambda c: (0, 0, 1)))
        beauty(OUT, 'naust', 0.25, SHOTS)
        for o in extra: bpy.data.objects.remove(o, do_unlink=True)
    ex = {'frame': 'kystfiske naust: x along the quay face, y up from mean sea level, z out to sea; metres', 'name': 'Det gamle naustet med kaia på påler',
          'anchors': anchors()}
    export_boat(build, to_game, to_game_n, OUT, 'harbour-naust.glb', os.path.join(ROOT, 'src', 'data', 'harbour-naust.b64'), ex, side=None, dry='dry' in sys.argv)


if __name__ == '__main__':
    main()
