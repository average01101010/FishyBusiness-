"""The new speed sjark (sjarkny), a 10.99 m coastal boat with the wheelhouse forward and a big working deck, built in Blender after the
drawing and the picture Jonas showed on 06.10.2026 (a 10.99 m fishing vessel for coastal fishing, «fisk i bulk»: length overall 10.99 m,
on the waterline 10.79 m, breadth 4.68 m over all, draft 2.06 m at most, depth 2.40 m, 42 t loaded). The drawing is not in the
repository; the lines were measured from it (131 px/m on the enlarged profile, the base line at the transom's foot): the waterline
1.18 m up, the keel dropping 0.3 m forward of the transom, the hard chine 0.38 m up at the transom rising to the waterline at the
stem, the deck at 2.11 m aft and the side 3.10 m forward, the near upright stem, the wheelhouse roof at 4.41 m, the skeg to 0.88 m
under the base line with the propeller in a nozzle. Jonas let us choose the colours and asked for room on deck for the gear («husk at
det må være dekksplass for utstyr»): the deckhouse on the drawing's aft deck is left out, so the working deck runs clear from the
transom to the short cabin behind the wheelhouse; the hauling station stands under the cabin's roof on the starboard side. A petrol
hull with a white rubbing strake, white superstructure, an orange crane. Exterior only (CLAUDE.md).

    pip install bpy==4.5.4
    python3 tools/boats/hs11.py            -> src/data/boat-hs11.b64 (+ the side picture), renders in tools/boats/out/
    python3 tools/boats/hs11.py fast dry   -> no renders to look at, and the GLB only in tools/boats/out

Frame: x forward from the transom, y to port, z up from the base line at the transom's foot; the waterline is z = 1.18."""
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy
from bpyutil import *

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE)); OUT = os.path.join(HERE, 'out')
WL = 1.18; XA = 0.0; XF = 10.99; XM = (XA + XF) / 2; HB = 2.34
ZMD = 2.11                  # the working deck aft
ZFD = 3.0                   # the foredeck
Z_RUB = 2.0                 # the rubbing strake
X_HS = 6.0                  # the wheelhouse's aft wall; the side steps up forward of it
CX0 = 4.6                   # the cabin's aft wall: the working deck runs clear from the transom to here


# ---------- lines (metres), measured from the drawing ----------
KEEL = [(XA, 0.0), (2.5, -0.17), (5.05, -0.3), (8.0, -0.3), (9.0, -0.15), (9.7, 0.1), (10.2, 0.45), (10.6, 0.9), (10.78, WL), (10.9, 2.0), (XF, 3.2)]
def z_keel(x): return interp(KEEL, x)
CHZ = [(XA, 0.38), (5.0, 0.5), (8.0, 0.75), (9.5, 0.98), (10.4, 1.15), (10.78, 1.25)]
CHY = [(XA, 2.12), (3.0, 2.2), (6.0, 2.2), (8.0, 2.0), (9.3, 1.55), (10.2, 0.9), (10.6, 0.45), (10.78, 0.0)]
DKY = [(XA, 2.25), (2.0, 2.34), (7.0, 2.34), (8.6, 2.18), (9.75, 1.76), (10.5, 1.07), (10.85, 0.45), (XF, 0.0)]
TOP = [(XA, 2.9), (X_HS, 2.9), (X_HS + 0.3, 3.12), (XF, 3.2)]
def z_top(x): return interp(TOP, x)

def section(x, sg=1):
    zk = z_keel(x); zt = z_top(x); yd = interp(DKY, x); yc = interp(CHY, x) if x < 10.78 else 0.0
    zc = max(interp(CHZ, x), zk + 0.01) if x < 10.78 else zk
    pts = [(0.0, zk)]
    if yc > 0.01:
        pts += [(yc * 0.5, zk + (zc - zk) * 0.42), (yc, zc)]
    z0, y0 = pts[-1][1], pts[-1][0]
    for k in range(1, 9):
        t = k / 8; pts.append((y0 + (yd - y0) * t ** 0.75, z0 + (zt - z0) * t))
    return [(sg * y, z) for y, z in pts]

def hbz(x, z):
    sec = [(abs(y), zz) for y, zz in section(x, 1)]
    if z <= sec[0][1]: return 0.0
    for a, b in zip(sec, sec[1:]):
        if a[1] <= z <= b[1]: t = (z - a[1]) / max(1e-9, b[1] - a[1]); return a[0] + (b[0] - a[0]) * t
    return sec[-1][0]


# ---------- colours: petrol, white and orange ----------
C = {}
def colours():
    C['af'] = mat('antifouling', (0.08, 0.08, 0.09), 0.15)
    C['hull'] = mat('hspetrol', (0.04, 0.27, 0.31), 0.6, zone=1)
    C['white'] = mat('white', (0.92, 0.92, 0.90), 0.5)
    C['inner'] = mat('inner', (0.82, 0.82, 0.80), 0.3)
    C['deck'] = mat('deck', (0.40, 0.42, 0.42), 0.12)
    C['roof'] = mat('roof', (0.80, 0.80, 0.78), 0.3)
    C['steel'] = mat('steel', (0.66, 0.68, 0.70), 0.75, metal=0.7)
    C['dark'] = mat('dark', (0.12, 0.13, 0.14), 0.25)
    C['black'] = mat('black', (0.05, 0.05, 0.06), 0.35)
    C['glass'] = mat('glass', (0.05, 0.08, 0.11), 0.95)
    C['prop'] = mat('bronze', (0.70, 0.52, 0.27), 0.8, metal=0.9)
    C['orange'] = mat('orange', (0.95, 0.42, 0.06), 0.45)

NB = lambda fine: (8 if fine else 3, 1, 4 if fine else 2, 1, 4 if fine else 1)   # bottom, boot top, side to the strake, the strake, side to the top

def hull_rows(sg, fine=True):
    rows = []; n = NB(fine)
    xs = ([0.0, 0.03, 0.08] + [0.2 + 0.3 * i for i in range(28)] + [8.6 + 0.12 * i for i in range(20)]) if fine else [0.0, 0.1, 2.0, 5.0, 8.0, 9.5, 10.4, 10.8]
    xs = sorted(set(round(v, 4) for v in xs if v < XF - 0.01) | {X_HS, X_HS + 0.15, X_HS + 0.3, XF - 0.01})
    for x in xs:
        sec = [(abs(y), z) for y, z in section(x, sg)]
        rows.append([(x, sg * y, z) for y, z in resample(sec, [(WL - 0.03, n[0]), (WL + 0.08, n[1]), (Z_RUB - 0.05, n[2]), (Z_RUB + 0.05, n[3]), (None, n[4])])])
    return rows

def band_of(j, fine):
    n = NB(fine); k = 0
    for m, c in zip(n, ('af', 'black', 'hull', 'white', 'hull')):
        k += m
        if j < k: return C[c]
    return C['hull']

def build_hull(fine=True):
    objs = []; first = {}
    for sg, nm in ((1, 'p'), (-1, 's')):
        rows = hull_rows(sg, fine); first[sg] = rows[0]
        objs.append(grid('hull_' + nm, rows, lambda i, j: band_of(j, fine), angle=28, out=lambda c: (0, c.y, min(c.z, 1.6) - 1.6)))
    T = [[q, p] for p, q in zip(first[1], first[-1])]
    objs.append(grid('transom', T, lambda i, j: band_of(i, fine), angle=20, out=lambda c: (-1, 0, 0)))
    return objs


# ---------- decks: the working deck aft, the foredeck, bulwarks and rails ----------
def decks(fine=True):
    A = Acc('decks'); step = 0.3 if fine else 1.2
    xs = sorted(set([XA + 0.04] + [XA + 0.2 + step * k for k in range(int(XF / step) + 2) if XA + 0.2 + step * k < XF - 0.2] + [X_HS, XF - 0.2]))
    for x0, x1 in zip(xs, xs[1:]):
        fd = x0 >= X_HS - 1e-6; za = zb = ZFD if fd else ZMD
        ya, yb = hbz(x0, za) - 0.05, hbz(x1, zb) - 0.05
        ta, tb = z_top(x0), z_top(x1); ea, eb = hbz(x0, ta), hbz(x1, tb)
        A.poly([(x0, -ya, za), (x1, -yb, zb), (x1, yb, zb), (x0, ya, za)], C['deck'], (0, 0, 1))
        for sg in (1, -1):
            A.poly([(x0, sg * ya, za), (x1, sg * yb, zb), (x1, sg * (eb - 0.05), tb), (x0, sg * (ea - 0.05), ta)], C['inner'], (0, -sg, 0))
            A.poly([(x0, sg * (ea - 0.05), ta), (x1, sg * (eb - 0.05), tb), (x1, sg * eb, tb + 0.01), (x0, sg * ea, ta + 0.01)], C['white'], (0, 0, 1))
    y = hbz(XA, ZMD) - 0.05
    A.poly([(XA + 0.04, -y, ZMD), (XA + 0.04, y, ZMD), (XA + 0.04, y, z_top(XA)), (XA + 0.04, -y, z_top(XA))], C['inner'], (1, 0, 0))
    # freeing ports along the aft bulwark, the hatch on the working deck (flush, low coaming)
    for x in (0.6, 1.5, 2.4, 3.3):
        for sg in (1, -1):
            y = hbz(x, ZMD + 0.15) + 0.012; A.poly([(x, sg * y, ZMD + 0.02), (x + 0.45, sg * y, ZMD + 0.02), (x + 0.45, sg * y, ZMD + 0.24), (x, sg * y, ZMD + 0.24)], C['dark'], (0, sg, 0))
    abox(A, 1.4, 2.6, -0.75, 0.75, ZMD, ZMD + 0.12, C['steel'])
    if fine:
        # a rail on the foredeck's low bulwark
        xs_ = [X_HS + 0.2 + (XF - 0.5 - X_HS - 0.2) * k / 16 for k in range(17)]
        for sg in (1, -1):
            pts = [(x, sg * (hbz(x, z_top(x)) - 0.04), z_top(x)) for x in xs_]
            for p in pts[::2]: acyl(A, p, (p[0], p[1], p[2] + 0.75), 0.022, lambda z: C['white'], seg=5)
            for a, b in zip(pts, pts[1:]): acyl(A, (a[0], a[1], a[2] + 0.75), (b[0], b[1], b[2] + 0.75), 0.022, lambda z: C['white'], seg=5, cap=False)
    return [A.done(25)]


def underwater(fine=True):
    objs = []
    sk = [(1.3, -0.68), (6.5, -0.3)]; zk = lambda x: z_keel(x) + 0.05
    xs = [1.3 + (6.5 - 1.3) * k / 10 for k in range(11)]
    top = [(x, zk(x)) for x in xs]; bot = [(x, sk[0][1] + (sk[1][1] - sk[0][1]) * (x - 1.3) / 5.2) for x in reversed(xs)]
    objs.append(loft_rings('skeg', [[(x, sy * 0.1, z) for x, z in top + bot] for sy in (1, -1)], C['af']))
    objs.append(box('sole', -0.05, 1.35, -0.07, 0.07, -0.88, -0.78, C['af']))
    zc = -0.38
    objs.append(cyl('hub', (0.7, 0, zc), (1.05, 0, zc), 0.1, C['prop'], 12, r1=0.07))
    objs.append(cyl('shaft', (1.05, 0, zc), (1.4, 0, zc), 0.05, C['steel'], 8))
    for k in range(4):
        a = 2 * math.pi * k / 4 + 0.4; e = (0, math.cos(a), math.sin(a)); t = (0, -math.sin(a), math.cos(a))
        bl = [(0.82 + 0.06 * f, (0.09 + 0.28 * r) * e[1] + t[1] * w, zc + (0.09 + 0.28 * r) * e[2] + t[2] * w)
              for r, w, f in ((0, -0.08, 0), (0.5, -0.12, 0.4), (1.0, -0.07, 1.0), (1.0, 0.07, 1.0), (0.5, 0.11, -0.4), (0, 0.07, 0))]
        objs.append(loft_rings('blade%d' % k, [[(p[0] - 0.015, p[1], p[2]) for p in bl], [(p[0] + 0.015, p[1], p[2]) for p in bl]], C['prop']))
    objs.append(torus('nozzle', (0.85, 0, zc), (1, 0, 0), 0.41, 0.05, C['af'], seg=20, rseg=6))
    objs.append(box('strut', 0.75, 0.95, -0.03, 0.03, zc + 0.42, z_keel(0.85) + 0.05, C['af']))
    rud = [(0.4, 0.0), (-0.02, 0.0), (-0.05, -0.1), (-0.05, -0.76), (0.4, -0.76)]
    w = lambda x: 0.05 * max(0.4, 1 - abs(x - 0.18) / 0.25)
    objs.append(loft_rings('rudder', [[(x, w(x), z) for x, z in rud], [(x, -w(x), z) for x, z in rud]], C['af']))
    return [o for o in objs if o]


# ---------- the wheelhouse forward, the cabin with the hauling station under its roof, the mast; the crane aft ----------
WX0, WX1, WY = X_HS, 8.9, 2.1
WS, WH, WR = 3.45, 4.15, 4.41

def gear(fine=True):
    A = Acc('gear'); G = Acc('glass'); w = C['white']; sg_ = 14 if fine else 8
    # the wheelhouse on the foredeck, its aft wall down to the working deck; the front leans out over the foredeck
    oc = [(WX0, -WY), (WX1 - 0.6, -WY), (WX1, -WY + 0.6), (WX1, WY - 0.6), (WX1 - 0.6, WY), (WX0, WY)]
    lean = lambda p, z: (p[0] + (0.28 * (z - ZFD) / (WR - ZFD) if p[0] > WX1 - 0.61 else 0.0), p[1], z)
    for i in range(len(oc)):
        a, b = oc[i], oc[(i + 1) % len(oc)]; nrm = (b[1] - a[1], -(b[0] - a[0]), 0)
        if a[0] == WX0 and b[0] == WX0: continue
        A.poly([lean(a, ZFD), lean(b, ZFD), lean(b, WS), lean(a, WS)], w, nrm)
        A.poly([lean(a, WH), lean(b, WH), lean(b, WR), lean(a, WR)], C['dark'], nrm)
        G.poly([lean(a, WS), lean(b, WS), lean(b, WH), lean(a, WH)], C['glass'], nrm)
        L = math.hypot(b[0] - a[0], b[1] - a[1]); k = max(1, int(L / 0.9))
        for j in range(k + 1):
            t = j / k; p = (a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t); beam(A, lean(p, WS), lean(p, WH), 0.06, 0.06, C['dark'])
    io = [(x + (0.12 if x == WX0 else -0.12), y * 0.94) for x, y in oc]
    for i in range(len(io)):
        a, b = io[i], io[(i + 1) % len(io)]; A.poly([(a[0], a[1], ZFD), (b[0], b[1], ZFD), (b[0], b[1], WR), (a[0], a[1], WR)], C['dark'], (-(b[1] - a[1]), b[0] - a[0], 0))
    # the cabin aft of it on the working deck: closed on the port side, open to starboard where the hauler stands under the roof
    abox(A, CX0, WX0 + 0.02, -0.5, WY, ZMD, WR, w)
    A.poly([(CX0 - 0.01, 0.3, ZMD), (CX0 - 0.01, 1.0, ZMD), (CX0 - 0.01, 1.0, ZMD + 1.85), (CX0 - 0.01, 0.3, ZMD + 1.85)], C['dark'], (-1, 0, 0))
    G.poly([(CX0 + 0.3, WY + 0.005, 3.3), (WX0 - 0.3, WY + 0.005, 3.3), (WX0 - 0.3, WY + 0.005, 4.05), (CX0 + 0.3, WY + 0.005, 4.05)], C['glass'], (0, 1, 0))
    abox(A, WX0, WX0 + 0.04, -WY, -0.5, ZMD, WR, w)
    for x in (CX0 + 0.05,): abox(A, x - 0.05, x + 0.05, -WY - 0.02, -WY + 0.08, ZMD + 0.8, WR, w)
    # the roof over both, with its rail and the visor over the front windows
    ro = [(CX0 - 0.1, -WY - 0.1), (WX1 - 0.45, -WY - 0.1), (WX1 + 0.4, -WY + 0.55), (WX1 + 0.4, WY - 0.55), (WX1 - 0.45, WY + 0.1), (CX0 - 0.1, WY + 0.1)]
    A.poly([(x, y, WR) for x, y in ro], C['roof'], (0, 0, -1)); A.poly([(x, y, WR + 0.12) for x, y in ro], C['roof'], (0, 0, 1))
    for i in range(len(ro)):
        a, b = ro[i], ro[(i + 1) % len(ro)]; A.poly([(a[0], a[1], WR), (b[0], b[1], WR), (b[0], b[1], WR + 0.12), (a[0], a[1], WR + 0.12)], C['orange'], (b[1] - a[1], -(b[0] - a[0]), 0))
        if fine: acyl(A, (a[0], a[1], WR + 0.8), (b[0], b[1], WR + 0.8), 0.02, lambda z: w, seg=5, cap=False)
    if fine:
        for x, y in ro: acyl(A, (x, y, WR + 0.12), (x, y, WR + 0.8), 0.02, lambda z: w, seg=5)
    for sg in (1, -1): abox(A, 8.2, 8.5, sg * (WY + 0.12) - 0.05, sg * (WY + 0.12) + 0.05, WR - 0.25, WR - 0.05, C['dark'])
    # the mast on the roof raked aft, the radar, the dome, the antennas
    P0 = (6.9, 0, WR + 0.12); P1 = (6.4, 0, 6.6)
    beam(A, P0, P1, 0.22, 0.32, w)
    abox(A, 6.2, 6.8, -0.5, 0.5, 5.55, 5.62, w); acyl(A, (6.5, 0.0, 5.62), (6.5, 0.0, 5.95), 0.3, lambda z: w, seg=12, r1=0.26)
    abox(A, 6.25, 6.55, -0.7, 0.7, 6.25, 6.3, w); abox(A, 6.35, 6.45, -0.06, 0.06, 6.6, 7.5, w)
    for y in (-0.65, 0.65): acyl(A, (6.4, y, 6.3), (6.4, y, 7.4), 0.012, lambda z: w, seg=4)
    acyl(A, (7.6, -1.6, WR + 0.12), (7.6, -1.6, 6.8), 0.02, lambda z: w, seg=4)
    acyl(A, (8.3, 1.4, WR + 0.12), (8.3, 1.4, 4.85), 0.12, lambda z: C['steel'], seg=10)
    # the hauling station: a hauler post on the starboard rail under the roof
    hx = 5.3; hy = -(hbz(hx, z_top(hx)) - 0.3)
    acyl(A, (hx, hy, ZMD), (hx, hy, z_top(hx) + 0.35), 0.08, lambda z: C['steel'], seg=8)
    # the crane on the port quarter, its boom laid forward along the bulwark
    acyl(A, (0.6, 1.7, ZMD), (0.6, 1.7, z_top(0.6) + 0.6), 0.16, lambda z: C['orange'], seg=sg_)
    beam(A, (0.6, 1.7, z_top(0.6) + 0.6), (0.75, 1.7, z_top(0.6) + 1.2), 0.2, 0.22, C['orange'])
    beam(A, (0.75, 1.7, z_top(0.6) + 1.2), (3.4, 1.85, z_top(0.6) + 0.75), 0.16, 0.18, C['orange'])
    # the anchor in the bow, a fender board at the strake aft
    for sg in (1, -1):
        x = 10.3; y = hbz(x, 2.6) + 0.02
        A.poly([(x - 0.2, sg * y, 2.4), (x + 0.2, sg * y, 2.48), (x + 0.2, sg * y, 2.8), (x - 0.2, sg * y, 2.72)], C['dark'], (0, sg, 0))
    return [A.done(30)], [G.done(30)]


def build(fine=True):
    solids = build_hull(fine) + decks(fine) + underwater(fine)
    o, g = gear(fine); solids += o
    return [s for s in solids if s], [x for x in g if x]


def to_game(p): return (-p[1], p[2] - WL, -(p[0] - XM))
def to_game_n(n): return (-n[1], n[2], -n[0])

def anchors():
    G = lambda x, y, z: [round(v, 3) for v in to_game((x, y, z))]
    hx = 5.3
    return {'eye': G(8.2, -0.7, 3.95), 'skipperAt': G(7.9, -0.7, 2.35), 'hp': -0.08, 'fov': 60,
            'crewSpots': [G(4.4, -1.4, ZMD) + [1.57], G(2.6, 1.2, ZMD) + [0.0], G(1.2, -1.0, ZMD) + [3.14], G(3.4, 0.2, ZMD) + [0.0]],
            'lights': [[G(6.4, 0, 7.4), [1, 0.95, 0.85]], [G(8.35, WY + 0.12, WR - 0.15), [1, 0.12, 0.1]], [G(8.35, -WY - 0.12, WR - 0.15), [0.1, 1, 0.35]],
                       [G(XA + 0.2, 0, z_top(XA) + 0.7), [1, 0.95, 0.85]]],
            # the clear working deck aft: the hauler on the starboard rail under the cabin's roof, the gear stacked aft of it
            'deck': {'y': round(ZMD - WL, 3), 'z': round(-(2.6 - XM), 3)}, 'gw': round(z_top(3.0) - WL, 3),
            'stern': round(XM - XA, 3), 'bow': round(-(XF - XM), 3), 'side': HB, 'beam': 4.68, 'pl': 4.4, 'rl': 1.78, 'open': False, 'hand': False,
            'pole': G(XA + 0.15, 0, z_top(XA) + 1.2), 'hauler': G(hx, -(hbz(hx, z_top(hx)) - 0.3), z_top(hx) + 0.35), 'filler': G(6.5, HB, ZFD + 0.3)}


SHOTS = [('bow3q', (21.0, -13.0, 5.5), (5.5, 0, 2.6), 35), ('stern3q', (-7.0, -9.0, 6.0), (4.5, 0, 2.6), 35), ('side', (5.5, -23, 2.8), (5.5, 0, 3.0), 35),
         ('above', (15.0, 10.0, 12.0), (5.0, 0, 2.0), 35), ('deck', (-3.0, 4.5, 6.0), (3.5, 0, 2.2), 35)]

def main():
    os.makedirs(OUT, exist_ok=True)
    reset(); colours()
    solids, glass = build(True)
    join(solids, 'BOAT0'); join(glass, 'GLASS0')
    if 'fast' not in sys.argv: beauty(OUT, 'hs', WL, SHOTS)
    ex = {'frame': 'kystfiske: x starboard, y up from the waterline, z aft; metres', 'type': 'sjarkny', 'name': 'Speed sjark 10.99 m',
          'len': 10.99, 'beam': 4.68, 'draft': 2.06, 'anchors': anchors()}
    export_boat(build, to_game, to_game_n, OUT, 'hs11.glb', os.path.join(ROOT, 'src', 'data', 'boat-hs11.b64'), ex,
                side=(os.path.join(ROOT, 'src', 'data', 'boat-hs11-side.b64'), 5.3, 2.6, 13.5), dry='dry' in sys.argv)


if __name__ == '__main__':
    main()
