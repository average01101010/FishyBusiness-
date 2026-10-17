"""The used speed sjark (hurtigsjark), a 10.99 m planing coastal boat built in Blender after the pictures Jonas showed on 13.10.2026 (a
2020s Norwegian 10.99 m fishing boat, the Nor-Dan 10.99 in the pictures; the make is only named here). Jonas: «Vær nøye med detaljer
selv om du har litt frie tøyler». No drawings; the lines are read off the pictures and the game's numbers (10.99 x 3.9 m, 1.6 m draft
with the skeg):

    the hull     a hard-chined planing hull with spray rails, a high flared bow with a knuckle where the white begins, the sheer
                 rising forward; yellow from the boot top to the knuckle, a black rubbing strake there, white bulwarks over it, black
                 speed stripes along the yellow, ending aft in dashes; a flat transom, white over yellow, a ladder and a round light
    the house    the wheelhouse forward of the middle: black-framed windows all round (four raked panes in front, three a side and one
                 further aft), a yellow roof with a visor and a rail; its aft wall faces the working deck with a stainless door, the
                 open companionway and a window
    the masts    an A-frame mast on the roof with cross-trees, the radar dome and the work lights, a yellow derrick boom running aft
                 from it; a slim mast on the port quarter
    the deck     a clear working deck aft inside high bulwarks with a grab rail, the fish hold's chequer-plate hatch, the line hauler
                 in a hauling port in the starboard bulwark; a low foredeck with rails, the anchor winch and the bow roller

What I chose myself: the exact heights, the window count, the colours (yellow, white and black as in the pictures), the boom and the
aft mast simplified to poles and stays, no name on her (the game paints the player's name and mark). Exterior only (CLAUDE.md).

    pip install bpy==4.5.4
    python3 tools/boats/hurtig11.py            -> src/data/boat-hurtig11.b64 (+ the side picture), renders in tools/boats/out/
    python3 tools/boats/hurtig11.py fast dry   -> no renders to look at, and the GLB only in tools/boats/out

Frame: x forward from the transom, y to port, z up from the base line; the waterline is z = 1.0."""
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy
from bpyutil import *

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE)); OUT = os.path.join(HERE, 'out')
WL = 1.0; XA = 0.0; XF = 10.99; XM = (XA + XF) / 2; HB = 1.95
ZMD = 1.95                  # the working deck
ZFD = 2.7                   # the foredeck forward of the wheelhouse
WX0, WX1 = 4.4, 8.55        # the wheelhouse's aft wall (the shelter's) and the foot of its front
WY = 1.62                   # its half width
WR = 4.62                   # its roof


# ---------- lines (metres), read off the pictures ----------
KEEL = [(XA, 0.42), (3.0, 0.3), (6.0, 0.33), (7.8, 0.48), (9.0, 0.78), (9.9, 1.25), (10.5, 1.95), (10.85, 2.75), (XF, 3.42)]
CHZ = [(XA, 0.8), (5.0, 0.84), (7.6, 0.98), (9.0, 1.25), (10.0, 1.7), (10.6, 2.35)]
CHY = [(XA, 1.72), (3.0, 1.8), (6.0, 1.8), (7.4, 1.64), (8.4, 1.3), (9.3, 0.82), (10.0, 0.38), (10.5, 0.0)]
KNZ = [(XA, 2.02), (5.0, 2.08), (8.0, 2.24), (9.5, 2.5), (10.5, 2.86), (XF, 3.12)]          # the knuckle: the top of the yellow
KNY = [(XA, 1.88), (3.0, 1.95), (7.0, 1.93), (8.4, 1.76), (9.4, 1.36), (10.2, 0.8), (10.7, 0.32), (XF, 0.0)]
SHZ = [(XA, 2.88), (4.4, 2.9), (7.6, 3.04), (9.4, 3.24), (10.5, 3.4), (XF, 3.48)]         # the bulwarks' top
SHY = [(XA, 1.88), (3.0, 1.96), (7.0, 1.95), (8.4, 1.84), (9.4, 1.52), (10.2, 1.0), (10.7, 0.42), (XF, 0.0)]
f = lambda T: (lambda x: interp(T, x))
z_keel, z_ch, y_ch, z_kn, y_kn, z_sh, y_sh = map(f, (KEEL, CHZ, CHY, KNZ, KNY, SHZ, SHY))

def base_section(x):
    """keel, the bottom with a spray rail, the chine with its lip, the topside to the knuckle, the flare to the bulwark top"""
    zk = z_keel(x); zc = max(z_ch(x), zk + 0.01); yc = y_ch(x); zn = max(z_kn(x), zc + 0.02); yn = max(y_kn(x), yc * 0.98); zs = max(z_sh(x), zn + 0.02); ys = y_sh(x)
    if yc < 0.01: yc = 0.0
    P = [(0.0, zk), (yc * 0.25, zk + (zc - zk) * 0.18), (yc * 0.5, zk + (zc - zk) * 0.42), (yc * 0.53, zk + (zc - zk) * 0.42 + 0.015),   # the spray rail
         (yc * 0.78, zk + (zc - zk) * 0.7), (yc, zc), (yc + 0.05, zc + 0.008), (yc + 0.05, zc + 0.04)]                                   # the chine and its lip
    for k in range(1, 5): t = k / 4; P.append((yc + 0.05 + (yn - yc - 0.05) * t, zc + 0.04 + (zn - zc - 0.04) * t))
    for k in range(1, 4): t = k / 3; P.append((yn + (ys - yn) * (1 - (1 - t) ** 1.6), zn + (zs - zn) * t))
    out = [P[0]]
    for p in P[1:]: out.append((p[0], max(p[1], out[-1][1] + 1e-4)))
    return out

def stripe_z(x): return z_ch(x) + (z_kn(x) - z_ch(x)) * (0.42 + 0.12 * x / XF)
LEVELS = lambda x: [WL - 0.03, WL + 0.07, stripe_z(x), stripe_z(x) + 0.05, z_kn(x), z_kn(x) + 0.075]

def section(x):
    """the base section with points added exactly at the colour boundaries (each crossed once: the section rises all the way)"""
    P = base_section(x); out = list(P)
    for L in LEVELS(x):
        if L <= out[0][1]: out.insert(1, out[0]); continue
        if L >= out[-1][1]: out.append(out[-1]); continue
        for i in range(1, len(out)):
            a, b = out[i - 1], out[i]
            if a[1] < L <= b[1]:
                t = (L - a[1]) / max(1e-9, b[1] - a[1]); out.insert(i, (a[0] + (b[0] - a[0]) * t, L)); break
    return out

def hbz(x, z):
    sec = base_section(x)
    if z <= sec[0][1]: return 0.0
    for a, b in zip(sec, sec[1:]):
        if a[1] <= z <= b[1]: t = (z - a[1]) / max(1e-9, b[1] - a[1]); return a[0] + (b[0] - a[0]) * t
    return sec[-1][0]


# ---------- colours ----------
C = {}
def colours():
    C['af'] = mat('antifouling', (0.1, 0.1, 0.11), 0.15)
    C['boot'] = mat('boot', (0.04, 0.04, 0.05), 0.4)
    C['yellow'] = mat('hjyellow', (0.93, 0.86, 0.08), 0.65, zone=1)
    C['white'] = mat('house', (0.94, 0.94, 0.92), 0.55, zone=3)     # the bulwarks' white, the wheelhouse and the roof: paint zone 3 (superstructure)
    C['black'] = mat('black', (0.05, 0.05, 0.06), 0.45)
    C['stripe'] = mat('stripe', (0.05, 0.05, 0.06), 0.45, zone=2)   # the speed stripe: zone 2
    C['inner'] = mat('inner', (0.9, 0.9, 0.87), 0.3)
    C['deck'] = mat('deck', (0.78, 0.79, 0.78), 0.12, zone=4)
    C['lampR'] = mat('lampR', (0.85, 0.08, 0.06), 0.7); C['lampG'] = mat('lampG', (0.08, 0.75, 0.30), 0.7); C['lampW'] = mat('lampW', (0.95, 0.93, 0.85), 0.7)
    C['seat'] = mat('seat', (0.16, 0.17, 0.20), 0.3); C['screen'] = mat('screen', (0.06, 0.10, 0.14), 0.8)
    C['steel'] = mat('steel', (0.78, 0.8, 0.82), 0.85, metal=0.85)
    C['plate'] = mat('plate', (0.66, 0.68, 0.7), 0.7, metal=0.8)
    C['dark'] = mat('dark', (0.1, 0.11, 0.12), 0.25)
    C['glass'] = mat('glass', (0.06, 0.09, 0.12), 0.95)
    C['prop'] = mat('bronze', (0.70, 0.52, 0.27), 0.8, metal=0.9)
    C['roofy'] = mat('roofy', (0.93, 0.86, 0.08), 0.5, zone=3)
    C['orange'] = mat('orange', (0.95, 0.35, 0.08), 0.5)


# ---------- the hull ----------
def face_mat(x, z):
    Lv = LEVELS(x)
    if z < Lv[0]: return C['af']
    if z < Lv[1]: return C['boot']
    if Lv[2] < z < Lv[3]:
        # the speed stripe: from 1.4 m to 8.6 m, broken into dashes aft of 3.2 m
        if 1.4 < x < 8.6 and (x > 3.2 or int((x - 1.4) / 0.36) % 2 == 0): return C['stripe']
        return C['yellow']
    if z < Lv[4]: return C['yellow']
    if z < Lv[5]: return C['black']
    return C['white']

def hull_rows(sg, fine=True):
    xs = ([0.0, 0.03, 0.08] + [0.18 + 0.18 * i for i in range(47)] + [8.7 + 0.1 * i for i in range(23)]) if fine else [0.0, 0.1, 2.0, 5.0, 8.0, 9.5, 10.4, 10.8]
    xs = sorted(set(round(v, 4) for v in xs if v < XF - 0.01) | {1.4, 3.2, 8.6, XF - 0.01})
    return [[(x, sg * y, z) for y, z in section(x)] for x in xs]

def build_hull(fine=True):
    objs = []; first = {}
    for sg, nm in ((1, 'p'), (-1, 's')):
        rows = hull_rows(sg, fine); first[sg] = rows[0]
        def mf(i, j, R=rows): a, b, c = R[i][j], R[i][j + 1], R[i + 1][j]; return face_mat((a[0] + c[0]) / 2, (a[2] + b[2]) / 2)
        objs.append(grid('hull_' + nm, rows, mf, angle=25, out=lambda c: (0, c.y, min(c.z, 1.4) - 1.4)))
    T = [[q, p] for p, q in zip(first[1], first[-1])]
    objs.append(grid('transom', T, lambda i, j: face_mat(0.0, (T[i][0][2] + T[i + 1][0][2]) / 2), angle=20, out=lambda c: (-1, 0, 0)))
    return objs


# ---------- decks, bulwarks, rails ----------
def z_deck(x): return ZMD if x < WX0 + 1.2 else ZFD
def decks(fine=True):
    A = Acc('decks'); step = 0.25 if fine else 1.0
    xs = sorted(set([XA + 0.05] + [XA + 0.05 + step * k for k in range(int(XF / step) + 2) if XA + 0.05 + step * k < XF - 0.12] + [WX0 + 1.2, XF - 0.12]))
    for x0, x1 in zip(xs, xs[1:]):
        za = z_deck(x0); zb = za
        ya, yb = hbz(x0, za) - 0.06, hbz(x1, zb) - 0.06
        ta, tb = z_sh(x0), z_sh(x1); ea, eb = y_sh(x0) - 0.07, y_sh(x1) - 0.07
        A.poly([(x0, -ya, za), (x1, -yb, zb), (x1, yb, zb), (x0, ya, za)], C['deck'], (0, 0, 1))
        for sg in (1, -1):
            A.poly([(x0, sg * ya, za), (x1, sg * yb, zb), (x1, sg * eb, tb), (x0, sg * ea, ta)], C['inner'], (0, -sg, 0))
            A.poly([(x0, sg * ea, ta), (x1, sg * eb, tb), (x1, sg * (eb + 0.08), tb + 0.01), (x0, sg * (ea + 0.08), ta + 0.01)], C['white'], (0, 0, 1))
    # the step from the working deck up to the foredeck, inside the wheelhouse's forward part
    y = hbz(WX0 + 1.2, ZFD) - 0.06
    A.poly([(WX0 + 1.2, -y, ZMD), (WX0 + 1.2, y, ZMD), (WX0 + 1.2, y, ZFD), (WX0 + 1.2, -y, ZFD)], C['inner'], (-1, 0, 0))
    y = hbz(XA + 0.05, ZMD) - 0.06
    A.poly([(XA + 0.05, -y, ZMD), (XA + 0.05, y, ZMD), (XA + 0.05, y_sh(0) - 0.07, z_sh(0)), (XA + 0.05, -(y_sh(0) - 0.07), z_sh(0))], C['inner'], (1, 0, 0))
    # freeing ports along the foot of the bulwarks aft
    for x in (0.7, 1.7, 2.7, 3.7):
        for sg in (1, -1):
            yy = hbz(x, ZMD + 0.1) + 0.012; A.poly([(x, sg * yy, ZMD + 0.02), (x + 0.5, sg * yy, ZMD + 0.02), (x + 0.5, sg * yy, ZMD + 0.16), (x, sg * yy, ZMD + 0.16)], C['dark'], (0, sg, 0))
    # the fish hold's hatch: a chequer-plate coaming and lid, two lifting handles
    abox(A, 2.0, 3.4, -0.75, 0.75, ZMD, ZMD + 0.22, C['plate'])
    abox(A, 2.05, 3.35, -0.7, 0.7, ZMD + 0.22, ZMD + 0.26, C['steel'])
    if fine:
        for k in range(9):
            x = 2.15 + k * 0.14; A.poly([(x, -0.65, ZMD + 0.262), (x + 0.06, -0.65, ZMD + 0.262), (x + 0.06, 0.65, ZMD + 0.262), (x, 0.65, ZMD + 0.262)], C['plate'], (0, 0, 1))
        for y in (-0.35, 0.35): acyl(A, (2.6, y, ZMD + 0.26), (2.8, y, ZMD + 0.26), 0.015, lambda z: C['steel'], seg=5)
        # the grab rail along the inside of the bulwarks aft (Jonas' picture of the deck)
        for sg in (1, -1):
            pts = [(x, sg * (hbz(x, ZMD + 0.75) - 0.2), ZMD + 0.75) for x in (0.6, 1.4, 2.2, 3.0, 3.6)]
            for p in pts: acyl(A, (p[0], sg * (abs(p[1]) + 0.13), p[2]), p, 0.016, lambda z: C['steel'], seg=5)
            for a, b in zip(pts, pts[1:]): acyl(A, a, b, 0.024, lambda z: C['steel'], seg=6, cap=False)
            for a, b in zip(pts, pts[1:]): acyl(A, (a[0], a[1], a[2] - 0.3), (b[0], b[1], b[2] - 0.3), 0.014, lambda z: C['steel'], seg=5, cap=False)
            for p in pts: acyl(A, (p[0], p[1], p[2] - 0.3), p, 0.014, lambda z: C['steel'], seg=5)
        # the rails round the foredeck on the bulwark top, from the wheelhouse's front to the stem
        xs_ = [WX1 - 0.4 + (XF - 0.15 - WX1 + 0.4) * k / 12 for k in range(13)]
        for sg in (1, -1):
            pts = [(x, sg * max(0.03, y_sh(x) - 0.06), z_sh(x)) for x in xs_]
            for p in pts[::2]: acyl(A, p, (p[0], p[1], p[2] + 0.6), 0.02, lambda z: C['steel'], seg=5)
            for a, b in zip(pts, pts[1:]): acyl(A, (a[0], a[1], a[2] + 0.6), (b[0], b[1], b[2] + 0.6), 0.022, lambda z: C['steel'], seg=5, cap=False)
            for a, b in zip(pts, pts[1:]): acyl(A, (a[0], a[1], a[2] + 0.3), (b[0], b[1], b[2] + 0.3), 0.014, lambda z: C['steel'], seg=4, cap=False)
        # the anchor winch, the bow roller, cleats
        acyl(A, (9.6, -0.32, ZFD + 0.25), (9.6, 0.32, ZFD + 0.25), 0.16, lambda z: C['plate'], seg=14)
        abox(A, 9.4, 9.8, -0.25, 0.25, ZFD, ZFD + 0.18, C['plate'])
        abox(A, 10.2, 10.9, -0.08, 0.08, z_sh(10.6) - 0.02, z_sh(10.6) + 0.07, C['steel'])
        acyl(A, (10.86, -0.06, z_sh(10.6) + 0.05), (10.86, 0.06, z_sh(10.6) + 0.05), 0.045, lambda z: C['dark'], seg=10)
        # the stem bar: a half-round stainless strip up the stem from the forefoot to the sheer
        stem = [(x, 0.0, z_keel(x) + 0.02) for x in [9.6 + (XF - 0.02 - 9.6) * k / 14 for k in range(15)]]
        for a, b in zip(stem, stem[1:]): acyl(A, (a[0] + 0.012, 0, a[2]), (b[0] + 0.012, 0, b[2]), 0.03, lambda z: C['steel'] if z > WL + 0.1 else C['af'], seg=6, cap=False)
        for x, sg in ((0.4, 1), (0.4, -1), (9.1, 1), (9.1, -1)):
            yy = sg * (y_sh(x) - 0.15); abox(A, x - 0.1, x + 0.1, yy - 0.02, yy + 0.02, z_sh(x) + 0.01, z_sh(x) + 0.06, C['steel'])
    # the hauling port in the starboard bulwark and the line hauler at it, under the wheelhouse roof's overhang
    hx = 3.9; hy = -(y_sh(hx) - 0.07)
    A.poly([(hx - 0.35, hy - 0.002, z_sh(hx) - 0.42), (hx + 0.35, hy - 0.002, z_sh(hx) - 0.42), (hx + 0.35, hy - 0.002, z_sh(hx) + 0.011), (hx - 0.35, hy - 0.002, z_sh(hx) + 0.011)], C['dark'], (0, 1, 0))
    acyl(A, (hx, hy + 0.35, ZMD), (hx, hy + 0.35, z_sh(hx) + 0.15), 0.07, lambda z: C['plate'], seg=8)
    acyl(A, (hx, hy + 0.35, z_sh(hx) + 0.15), (hx, hy + 0.1, z_sh(hx) + 0.3), 0.045, lambda z: C['plate'], seg=8)
    acyl(A, (hx - 0.05, hy + 0.05, z_sh(hx) + 0.3), (hx + 0.05, hy + 0.05, z_sh(hx) + 0.3), 0.2, lambda z: C['dark'], seg=16)
    acyl(A, (hx + 0.05, hy + 0.05, z_sh(hx) + 0.3), (hx + 0.25, hy + 0.05, z_sh(hx) + 0.3), 0.1, lambda z: C['orange'], seg=12)
    # the transom: a ladder to starboard, the round light low in the middle
    if fine:
        for y in (-0.85, -1.15): acyl(A, (-0.02, y, z_sh(0) + 0.3), (-0.02, y, z_sh(0)), 0.016, lambda z: C['steel'], seg=5); acyl(A, (-0.02, y, z_sh(0)), (-0.06, y, WL - 0.35), 0.016, lambda z: C['steel'], seg=5)
        for k in range(6): z = WL - 0.25 + 0.3 * k; acyl(A, (-0.05, -0.85, z), (-0.05, -1.15, z), 0.014, lambda z: C['steel'], seg=4)
        acyl(A, (0.01, 0.0, 1.5), (-0.04, 0.0, 1.5), 0.1, lambda z: C['steel'], seg=14); acyl(A, (-0.04, 0.0, 1.5), (-0.05, 0.0, 1.5), 0.08, lambda z: C['white'], seg=14)
    return [A.done(25)]


def underwater(fine=True):
    objs = []
    xs = [1.2 + (7.0 - 1.2) * k / 10 for k in range(11)]
    top = [(x, z_keel(x) + 0.05) for x in xs]; bot = [(x, -0.58 + 0.9 * max(0.0, (x - 5.6) / 1.4) ** 1.6) for x in reversed(xs)]
    objs.append(loft_rings('skeg', [[(x, sy * 0.09, z) for x, z in top + bot] for sy in (1, -1)], C['af']))
    zc = -0.15
    objs.append(cyl('shaft', (0.75, 0, zc), (1.4, 0, zc + 0.08), 0.04, C['steel'], 8))
    objs.append(cyl('hub', (0.62, 0, zc), (0.85, 0, zc), 0.08, C['prop'], 10, r1=0.06))
    for k in range(4):
        a = 2 * math.pi * k / 4 + 0.4; e = (0, math.cos(a), math.sin(a)); t = (0, -math.sin(a), math.cos(a))
        bl = [(0.72 + 0.06 * f_, (0.07 + 0.3 * r) * e[1] + t[1] * w_, zc + (0.07 + 0.3 * r) * e[2] + t[2] * w_)
              for r, w_, f_ in ((0, -0.07, 0), (0.5, -0.11, 0.4), (1.0, -0.07, 1.0), (1.0, 0.07, 1.0), (0.5, 0.1, -0.4), (0, 0.07, 0))]
        objs.append(loft_rings('blade%d' % k, [[(p[0] - 0.014, p[1], p[2]) for p in bl], [(p[0] + 0.014, p[1], p[2]) for p in bl]], C['prop']))
    rud = [(0.4, z_keel(0.3) + 0.02), (-0.02, z_keel(0.0) + 0.02), (-0.05, zc - 0.4), (0.4, zc - 0.4)]
    w = lambda x: 0.045 * max(0.4, 1 - abs(x - 0.18) / 0.25)
    objs.append(loft_rings('rudder', [[(x, w(x), z) for x, z in rud], [(x, -w(x), z) for x, z in rud]], C['af']))
    return objs


# ---------- the wheelhouse, the masts ----------
WS, WH = 3.42, 4.46          # the window band
def lean(x, z):
    """the front leans aft from its foot at WX1 to the roof"""
    return x - 0.42 * (z - ZFD) / (WR - ZFD) if x > WX1 - 0.01 else x

def house(fine=True):
    A = Acc('house'); G = Acc('glass'); w = C['white']
    # the plan: square aft, the front a shallow V; the sides stand on the deck (the working deck aft of WX0 + 1.2, the foredeck forward)
    oc = [(WX0, -WY), (WX1 - 0.25, -WY), (WX1, -0.75), (WX1 + 0.12, 0.0), (WX1, 0.75), (WX1 - 0.25, WY), (WX0, WY)]
    def pt(p, z): return (lean(p[0], z) if p[0] > WX1 - 0.3 else p[0], p[1], z)
    for i in range(len(oc) - 1):
        a, b = oc[i], oc[i + 1]; nrm = (b[1] - a[1], -(b[0] - a[0]), 0)
        z0 = ZMD if max(a[0], b[0]) <= WX0 + 1.2 else ZFD
        if a[1] == b[1]:                                  # a side: split at the step, panels down to each deck
            for xa, xb, zz in ((a[0], min(b[0], WX0 + 1.2), ZMD), (WX0 + 1.2, b[0], ZFD)) if a[0] < b[0] else ((b[0], WX0 + 1.2, ZMD), (WX0 + 1.2, a[0], ZFD)):
                if xb - xa < 1e-3: continue
                A.poly([(xa, a[1], zz), (xb, a[1], zz), (xb, a[1], WS), (xa, a[1], WS)], w, nrm)
                A.poly([(xa, a[1], WH), (xb, a[1], WH), (xb, a[1], WR), (xa, a[1], WR)], w, nrm)
        else:
            A.poly([pt(a, z0), pt(b, z0), pt(b, WS), pt(a, WS)], w, nrm)
            A.poly([pt(a, WH), pt(b, WH), pt(b, WR), pt(a, WR)], w, nrm)
    # the window band: black frames and mullions, glass between; on the sides solid between the windows
    def band(a, b, nrm, panes):
        for k in range(panes):
            t0 = k / panes; t1 = (k + 1) / panes
            p0 = (a[0] + (b[0] - a[0]) * t0, a[1] + (b[1] - a[1]) * t0); p1 = (a[0] + (b[0] - a[0]) * t1, a[1] + (b[1] - a[1]) * t1)
            G.poly([pt(p0, WS + 0.05), pt(p1, WS + 0.05), pt(p1, WH - 0.05), pt(p0, WH - 0.05)], C['glass'], nrm)
            A.poly([pt(p0, WS), pt(p1, WS), pt(p1, WS + 0.05), pt(p0, WS + 0.05)], C['black'], nrm)
            A.poly([pt(p0, WH - 0.05), pt(p1, WH - 0.05), pt(p1, WH), pt(p0, WH)], C['black'], nrm)
            beam(A, pt(p0, WS), pt(p0, WH), 0.07, 0.07, C['black'])
        beam(A, pt(b, WS), pt(b, WH), 0.07, 0.07, C['black'])
    for i in range(1, len(oc) - 2):
        a, b = oc[i], oc[i + 1]; band(a, b, (b[1] - a[1], -(b[0] - a[0]), 0), 2 if i in (2, 3) else 1)
    for sg in (1, -1):
        y = sg * WY; nrm = (0, sg, 0)
        # the shelter's big opening aft (open to the deck, a dark recess), then three tall windows forward with only mullions between
        segs = [(WX0, 4.55, None), (4.55, 5.8, 'open'), (5.8, 6.5, None), (6.5, 7.15, 'w'), (7.15, 7.8, 'w'), (7.8, WX1 - 0.25, 'w')]
        for xa, xb, k in segs:
            if k == 'w': band((xa, y), (xb, y), nrm, 1)
            elif k == 'open':
                A.poly([(xa, y, WS - 0.15), (xb, y, WS - 0.15), (xb, y, WH), (xa, y, WH)], C['dark'], nrm)
                A.poly([(xa, y, WS - 0.2), (xb, y, WS - 0.2), (xb, y + sg * 0.05, WS - 0.15), (xa, y + sg * 0.05, WS - 0.15)], w, (0, sg, 1))
                A.poly([(xa, y, WH), (xb, y, WH), (xb, y, WR), (xa, y, WR)], w, nrm)
                A.poly([(xa, y, ZMD if xb <= WX0 + 1.2 else ZFD), (xb, y, ZMD if xb <= WX0 + 1.2 else ZFD), (xb, y, WS - 0.2), (xa, y, WS - 0.2)], w, nrm)
            else: A.poly([(xa, y, WS), (xb, y, WS), (xb, y, WH), (xa, y, WH)], w, nrm)
    # the aft wall facing the working deck: a stainless locker door to port, the split door with its porthole and the open
    # companionway, a square window to starboard; two lamps under the roof's overhang
    A.poly([(WX0, -WY, ZMD), (WX0, WY, ZMD), (WX0, WY, WR), (WX0, -WY, WR)], w, (-1, 0, 0))
    abox(A, WX0 - 0.03, WX0, 0.95, 1.4, ZMD + 0.55, ZMD + 1.95, C['plate'])
    acyl(A, (WX0 - 0.05, 1.0, ZMD + 1.2), (WX0 - 0.05, 1.0, ZMD + 1.45), 0.012, lambda z: C['steel'], seg=5)
    abox(A, WX0 - 0.03, WX0, 0.2, 0.75, ZMD + 0.15, ZMD + 1.95, C['white'])
    abox(A, WX0 - 0.035, WX0 - 0.03, 0.2, 0.75, ZMD + 1.0, ZMD + 1.02, C['dark'])
    acyl(A, (WX0 - 0.03, 0.47, ZMD + 1.45), (WX0 - 0.06, 0.47, ZMD + 1.45), 0.17, lambda z: C['steel'], seg=16)
    acyl(A, (WX0 - 0.06, 0.47, ZMD + 1.45), (WX0 - 0.065, 0.47, ZMD + 1.45), 0.13, lambda z: C['glass'], seg=16)
    A.poly([(WX0 - 0.005, -0.4, ZMD + 0.1), (WX0 - 0.005, 0.15, ZMD + 0.1), (WX0 - 0.005, 0.15, ZMD + 2.0), (WX0 - 0.005, -0.4, ZMD + 2.0)], C['dark'], (-1, 0, 0))
    for y0, y1 in ((-0.45, -0.4), (0.15, 0.2)): abox(A, WX0 - 0.05, WX0, y0, y1, ZMD + 0.1, ZMD + 2.05, C['plate'])
    abox(A, WX0 - 0.05, WX0, -0.45, 0.2, ZMD + 2.0, ZMD + 2.06, C['plate'])
    A.poly([(WX0 - 0.006, -1.45, WS), (WX0 - 0.006, -0.75, WS), (WX0 - 0.006, -0.75, WH), (WX0 - 0.006, -1.45, WH)], C['black'], (-1, 0, 0))
    G.poly([(WX0 - 0.012, -1.4, WS + 0.06), (WX0 - 0.012, -0.8, WS + 0.06), (WX0 - 0.012, -0.8, WH - 0.06), (WX0 - 0.012, -1.4, WH - 0.06)], C['glass'], (-1, 0, 0))
    for y in (-1.1, 1.1): abox(A, WX0 - 0.35, WX0 - 0.2, y - 0.08, y + 0.08, WR - 0.12, WR - 0.02, C['dark'])
    # the roof: a thick yellow lid overhanging all round, a deep visor sloping down over the front windows, a rail round it
    T = 0.3
    ro = [(WX0 - 0.55, -WY - 0.12), (WX1 - 0.3, -WY - 0.12), (WX1 + 0.05, -0.85), (WX1 + 0.18, 0.0), (WX1 + 0.05, 0.85), (WX1 - 0.3, WY + 0.12), (WX0 - 0.55, WY + 0.12)]
    ro = [(lean(x, WR) + (0.32 if x > WX1 - 0.31 else 0.0), y) for x, y in ro]
    A.poly([(x, y, WR - (0.1 if x > WX1 - 0.4 else 0.0)) for x, y in ro], C['dark'], (0, 0, -1)); A.poly([(x, y, WR + T) for x, y in ro], C['roofy'], (0, 0, 1))
    for i in range(len(ro)):
        a, b = ro[i], ro[(i + 1) % len(ro)]
        za = WR - (0.1 if a[0] > WX1 - 0.4 else 0.0); zb = WR - (0.1 if b[0] > WX1 - 0.4 else 0.0)
        A.poly([(a[0], a[1], za), (b[0], b[1], zb), (b[0], b[1], WR + T), (a[0], a[1], WR + T)], C['roofy'], (b[1] - a[1], -(b[0] - a[0]), 0))
    if fine:
        rr = [(x - (0.2 if x > WX1 - 0.3 else -0.15 if x < WX0 else 0.0), y * 0.93) for x, y in ro]
        for x, y in rr: acyl(A, (x, y, WR + T), (x, y, WR + T + 0.5), 0.018, lambda z: C['steel'], seg=5)
        for a, b in zip(rr, rr[1:] + rr[:1]):
            if abs(a[0] - b[0]) < 1e-6 and a[0] < WX0: continue
            acyl(A, (a[0], a[1], WR + T + 0.5), (b[0], b[1], WR + T + 0.5), 0.02, lambda z: C['steel'], seg=5, cap=False)
        # the life raft in its cradle on the roof aft, the life ring on the shelter's aft corner, the horn and the search light forward
        acyl(A, (WX0 - 0.3, 0.75, WR + T + 0.24), (WX0 + 0.6, 0.75, WR + T + 0.24), 0.23, lambda z: C['white'], seg=14)
        for x in (WX0 - 0.25, WX0 + 0.55): acyl(A, (x, 0.75, WR + T + 0.24), (x + 0.03, 0.75, WR + T + 0.24), 0.25, lambda z: C['dark'], seg=14)
        abox(A, WX0 - 0.35, WX0 + 0.65, 0.5, 1.0, WR + T, WR + T + 0.04, C['steel'])
        torus('ring', (4.9, WY + 0.045, WS + 0.25), (0, 1, 0), 0.26, 0.055, C['orange'], seg=20, rseg=8)
        acyl(A, (8.1, -0.9, WR + T), (8.1, -0.9, WR + T + 0.2), 0.05, lambda z: C['dark'], seg=8)
        acyl(A, (8.1, -0.9, WR + T + 0.25), (8.35, -0.9, WR + T + 0.25), 0.11, lambda z: C['dark'], seg=12, r1=0.13)
    # the mast on the roof: the main pole, two steel legs to the roof's forward corners and two yellow stays down to its aft corners
    # (as in the pictures), cross-trees with the work lights and the navigation lights, the radar dome on its bracket forward, the
    # antennas; a hauling block hangs from an arm aft of the mast on a short chain
    mx = 6.6; top = 9.5; zr = WR + T
    acyl(A, (mx, 0, zr), (mx, 0, top), 0.075, lambda z: C['steel'], seg=12)
    for sg in (1, -1):
        acyl(A, (7.9, sg * 1.2, zr), (mx + 0.04, sg * 0.06, 7.6), 0.05, lambda z: C['steel'], seg=8)
        acyl(A, (WX0 - 0.3, sg * 1.45, zr), (mx - 0.04, sg * 0.06, 8.0), 0.055, lambda z: C['roofy'], seg=8)
        for x, yy in ((7.9, 1.2), (WX0 - 0.3, 1.45)): abox(A, x - 0.1, x + 0.1, sg * yy - 0.1, sg * yy + 0.1, zr, zr + 0.04, C['steel'])
    abox(A, mx - 0.06, mx + 0.06, -0.9, 0.9, 8.1, 8.16, C['steel'])
    abox(A, mx - 0.06, mx + 0.06, -0.6, 0.6, 8.85, 8.9, C['steel'])
    abox(A, mx + 0.05, mx + 0.8, -0.25, 0.25, 6.7, 6.75, C['steel'])
    beam(A, (mx + 0.05, 0, 6.3), (mx + 0.6, 0, 6.72), 0.05, 0.05, C['steel'])
    acyl(A, (mx + 0.45, 0, 6.75), (mx + 0.45, 0, 6.9), 0.33, lambda z: C['dark'], seg=18)
    out_dome = sphere('dome', (mx + 0.45, 0, 6.9), 0.34, C['white'], scale=(1, 1, 0.6), seg=20, rings=10)
    for sg in (1, -1):
        abox(A, mx + 0.06, mx + 0.24, sg * 0.75 - 0.13, sg * 0.75 + 0.13, 7.8, 8.1, C['dark'])
        abox(A, mx + 0.24, mx + 0.25, sg * 0.75 - 0.11, sg * 0.75 + 0.11, 7.82, 8.08, C['white'])
        acyl(A, (mx, sg * 0.85, 8.16), (mx, sg * 0.85, 8.5), 0.035, lambda z: C['white'], seg=6)
    for z in (top - 0.6, top - 0.25): acyl(A, (mx, 0, z), (mx, 0, z + 0.14), 0.06, lambda z: C['white'], seg=8)
    acyl(A, (mx, 0, top), (mx, 0, top + 0.15), 0.06, lambda z: C['lampW'], seg=8); acyl(A, (mx, 0, top + 0.15), (mx, 0, top + 0.18), 0.07, lambda z: C['dark'], seg=8)   # the all-round white
    for sg in (1, -1):                                                                                      # the side lights on the roof's sides (B8)
        y0 = sg * (WY + 0.12); abox(A, 7.45, 7.75, min(y0, y0 + sg * 0.1), max(y0, y0 + sg * 0.1), WR + T + 0.02, WR + T + 0.24, C['dark'])
        y1 = y0 + sg * 0.1; abox(A, 7.48, 7.72, min(y1, y1 + sg * 0.015), max(y1, y1 + sg * 0.015), WR + T + 0.05, WR + T + 0.21, C['lampR' if sg > 0 else 'lampG'])
        abox(A, 7.43, 7.77, min(y0 - sg * 0.01, y1 + sg * 0.02), max(y0 - sg * 0.01, y1 + sg * 0.02), WR + T + 0.24, WR + T + 0.26, C['dark'])
    for y in (-0.5, 0.5): acyl(A, (mx - 0.05, y, 8.9), (mx - 0.05, y, 10.4), 0.012, lambda z: C['white'], seg=4)
    acyl(A, (mx - 0.05, 0.0, top + 0.15), (mx - 0.05, 0.0, top + 0.9), 0.01, lambda z: C['white'], seg=4)
    hb = (mx - 0.75, 0.0, 7.0)
    beam(A, (mx, 0, 7.2), (hb[0], 0, 7.2), 0.08, 0.08, C['steel'])
    for k in range(6):
        z = 7.15 - 0.07 * k; acyl(A, (hb[0], 0, z), (hb[0], 0, z - 0.06), 0.02, lambda z: C['dark'], seg=5)
    acyl(A, (hb[0] - 0.08, 0, 6.55), (hb[0] + 0.08, 0, 6.55), 0.17, lambda z: C['dark'], seg=14)
    abox(A, hb[0] - 0.1, hb[0] + 0.1, -0.2, 0.2, 6.6, 6.75, C['plate'])
    for y in (-0.06, 0.06): acyl(A, (hb[0], y, 6.4), (hb[0] - 0.05, y, 5.6), 0.012, lambda z: C['dark'], seg=4)
    # the slim mast on the port quarter, a tripod with a cross-tree and the stern light
    qx, qy = 0.45, 1.5
    acyl(A, (qx, qy, z_sh(qx)), (qx, qy, 7.6), 0.055, lambda z: C['steel'], seg=8)
    for d in (0.9, 1.3): acyl(A, (qx + d, qy - 0.05, z_sh(qx + d)), (qx + 0.02, qy, 6.0), 0.035, lambda z: C['steel'], seg=6)
    abox(A, qx - 0.05, qx + 0.05, qy - 0.55, qy + 0.35, 6.9, 6.95, C['steel'])
    acyl(A, (qx, qy, 7.6), (qx, qy, 7.75), 0.05, lambda z: C['lampW'], seg=8); acyl(A, (qx, qy, 7.75), (qx, qy, 7.78), 0.06, lambda z: C['dark'], seg=8)   # the stern light
    # the gutting bench: a white moulded block on the starboard bulwark by the hatch (the picture of the deck), and a stainless
    # gear box in the starboard quarter aft; fish boxes stacked to port
    abox(A, 3.5, 4.0, -(y_sh(3.75) - 0.08), -(y_sh(3.75) - 0.6), ZMD, z_sh(3.75) + 0.35, C['white'])
    abox(A, 0.25, 1.4, -(y_sh(0.8) - 0.1), -(y_sh(0.8) - 0.7), ZMD, z_sh(0.8) + 0.3, C['plate'])
    for k in range(3): abox(A, 0.5, 1.1, 0.9, 1.5, ZMD + 0.3 * k, ZMD + 0.3 * k + 0.28, C['inner'])
    # the wheelhouse inside (B5): the console under the front windows with three screens and the wheel, the skipper's chair to
    # starboard on its pedestal, a bench along the port side; seen through the windows
    cx = lean(WX1, WS) - 0.55
    abox(A, cx - 0.5, cx, -1.3, 1.3, ZFD, ZFD + 0.9, C['inner'])
    for y0 in (-1.05, -0.45, 0.35):
        A.poly([(cx - 0.22, y0, ZFD + 0.95), (cx - 0.22, y0 + 0.5, ZFD + 0.95), (cx - 0.3, y0 + 0.5, ZFD + 1.3), (cx - 0.3, y0, ZFD + 1.3)], C['screen'], (-1, 0, 0.25))
        abox(A, cx - 0.3, cx - 0.2, y0 - 0.02, y0 + 0.52, ZFD + 0.93, ZFD + 1.32, C['dark'])
    acyl(A, (cx - 0.5, -0.75, ZFD + 1.0), (cx - 0.65, -0.75, ZFD + 1.07), 0.03, lambda z: C['steel'], seg=6)
    atorus(A, (cx - 0.67, -0.75, ZFD + 1.08), (1, 0, 0.45), 0.2, 0.018, lambda a: C['black'], 16, 6)
    sx = 7.15
    acyl(A, (sx, -0.75, ZFD), (sx, -0.75, ZFD + 0.55), 0.05, lambda z: C['steel'], seg=8)
    abox(A, sx - 0.22, sx + 0.25, -0.98, -0.52, ZFD + 0.55, ZFD + 0.65, C['seat']); abox(A, sx - 0.27, sx - 0.19, -0.98, -0.52, ZFD + 0.65, ZFD + 1.2, C['seat'])
    abox(A, 6.2, 7.4, 1.0, 1.55, ZFD + 0.42, ZFD + 0.5, C['seat']); abox(A, 6.2, 7.4, 1.48, 1.55, ZFD + 0.5, ZFD + 0.95, C['seat']); abox(A, 6.2, 7.4, 1.0, 1.55, ZFD, ZFD + 0.42, C['inner'])
    return [A.done(30), out_dome], [G.done(30)]


def build(fine=True):
    hh, hg = house(fine)
    solids = build_hull(fine) + decks(fine) + underwater(fine) + hh
    return [s for s in solids if s], [x for x in hg if x]


def to_game(p): return (-p[1], p[2] - WL, -(p[0] - XM))
def to_game_n(n): return (-n[1], n[2], -n[0])

def anchors():
    G = lambda x, y, z: [round(v, 3) for v in to_game((x, y, z))]
    hx = 3.9; hy = -(y_sh(hx) - 0.07)
    names = []
    for sg, xs in ((1, [9.0 - 1.2 * k / 12 for k in range(13)]), (-1, [7.8 + 1.2 * k / 12 for k in range(13)])):      # on the white bulwark forward (B12)
        B = []; Tt = []
        for x in xs:
            for arr, dz in ((B, 0.14), (Tt, 0.46)): z = z_kn(x) + 0.075 + dz; arr.append(G(x, sg * (hbz(x, z) + 0.03), z))
        names.append([B, Tt])
    ys = [1.0 - 2.0 * k / 12 for k in range(13)]
    names.append([[G(XA - 0.02, y, z_kn(XA) + 0.22) for y in ys], [G(XA - 0.02, y, z_kn(XA) + 0.56) for y in ys]])    # across the transom's white, port to starboard
    return {'eye': G(7.3, -0.75, ZFD + 1.65), 'skipperAt': G(7.15, -0.75, ZFD), 'hp': -0.08, 'fov': 60,
            'crewSpots': [G(3.6, -1.2, ZMD) + [1.57], G(2.0, 1.15, ZMD) + [0.0], G(1.0, -0.9, ZMD) + [3.14], G(2.6, 0.0, ZMD + 0.26) + [0.0]],
            'lights': [[G(6.6, 0, 9.6), [1, 0.95, 0.85], 'allround'], [G(7.6, WY + 0.25, WR + 0.43), [1, 0.12, 0.1], 'port'], [G(7.6, -WY - 0.25, WR + 0.43), [0.1, 1, 0.35], 'stbd'],
                       [G(0.45, 1.5, 7.7), [1, 0.95, 0.85], 'stern']],
            # the aft wall's openings (B4): the open companionway into the wheelhouse and the split door to the cabin, both on the centre line's sides
            'doors': [{'at': G(WX0 - 0.03, -0.125, ZMD), 'w': 0.55, 'h': 1.9, 'in': G(WX0 + 0.8, -0.125, ZMD), 'to': 'helm', 'open': True},
                      {'at': G(WX0 - 0.03, 0.475, ZMD), 'w': 0.55, 'h': 1.8, 'in': G(WX0 + 0.8, 0.475, ZMD), 'to': 'cabin', 'hinge': 'port'}],
            'names': names,
            # the moulded gutting bench on the starboard bulwark is the model's own; the bleeding tub stands aft of it
            'work': {'table': G(3.75, -(y_sh(3.75) - 0.34), ZMD), 'tub': G(2.9, -(y_sh(2.9) - 0.5), ZMD), 'own': True, 'top': round(z_sh(3.75) + 0.35 - WL, 3)},
            'hatch': G(2.7, 0.0, ZMD + 0.26),
            # the clear working deck aft: the hauler at its port in the starboard bulwark, the hold's hatch in the middle
            'deck': {'y': round(ZMD - WL, 3), 'z': round(-(2.4 - XM), 3)}, 'gw': round(z_sh(3.0) - WL, 3),
            'stern': round(XM - XA, 3), 'bow': round(-(XF - XM), 3), 'side': HB, 'beam': 3.9, 'pl': 4.2, 'rl': 1.6, 'open': False, 'hand': False,
            'pole': G(0.45, 1.5, 7.6), 'hauler': G(hx, hy + 0.05, z_sh(hx) + 0.3), 'filler': G(6.2, HB, z_sh(6.2) + 0.2)}


SHOTS = [('bow3q', (19.0, 9.5, 5.0), (5.5, 0, 3.0), 38), ('stern3q', (-6.5, -8.5, 6.2), (4.0, 0, 3.0), 35), ('side', (5.5, 22, 3.6), (5.5, 0, 3.6), 35),
         ('deck', (-2.5, -3.2, 5.8), (3.5, 0, 2.4), 35), ('bow', (17.0, -3.0, 3.0), (6.0, 0, 3.0), 40), ('above', (12.0, -7.0, 11.0), (5.0, 0, 3.0), 35),
         ('stern', (-14.0, 0.5, 4.0), (3.5, 0, 2.8), 30), ('helm', (14.0, -5.0, 5.2), (7.5, -0.3, 4.0), 30)]

def main():
    os.makedirs(OUT, exist_ok=True)
    reset(); colours()
    solids, glass = build(True)
    join(solids, 'BOAT0'); join(glass, 'GLASS0')
    if 'fast' not in sys.argv: beauty(OUT, 'hj', WL, SHOTS)
    ex = {'frame': 'kystfiske: x starboard, y up from the waterline, z aft; metres', 'type': 'hurtigsjark', 'name': 'Used speed sjark 10.99 m',
          'len': 10.99, 'beam': 3.9, 'draft': 1.6, 'anchors': anchors()}
    export_boat(build, to_game, to_game_n, OUT, 'hurtig11.glb', os.path.join(ROOT, 'src', 'data', 'boat-hurtig11.b64'), ex,
                side=(os.path.join(ROOT, 'src', 'data', 'boat-hurtig11-side.b64'), 5.5, 4.0, 13.0), dry='dry' in sys.argv)


if __name__ == '__main__':
    main()
