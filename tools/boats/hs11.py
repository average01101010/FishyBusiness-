"""The new speed sjark (sjarkny), a 10.99 m coastal boat with the wheelhouse forward and a big working deck, built in Blender after the
drawing and the picture Jonas showed on 06.10.2026 (a 10.99 m fishing vessel for coastal fishing, «fisk i bulk»: length overall 10.99 m,
on the waterline 10.79 m, breadth 4.68 m over all, draft 2.06 m at most, depth 2.40 m, 42 t loaded). The drawing is not in the
repository; the lines were measured from it (131 px/m on the enlarged profile, the base line at the transom's foot): the waterline
1.18 m up, the keel dropping 0.3 m forward of the transom, the hard chine 0.38 m up at the transom rising to the waterline at the
stem, the deck at 2.11 m aft and the side 3.10 m forward, the near upright stem, the wheelhouse roof at 4.41 m, the skeg to 0.88 m
under the base line with the propeller in a nozzle. Jonas let us choose the colours and asked for room on deck for the gear («husk at
det må være dekksplass for utstyr»): the deckhouse on the drawing's aft deck is left out, so the working deck runs clear from the
transom to the short cabin behind the wheelhouse; the hauling station stands under the cabin's roof on the starboard side. A petrol
hull with a white rubbing strake, white superstructure, an orange roof edge. Exterior only (CLAUDE.md). The radars, the liferaft and the
lifebuoys are the game's deck kit (tools/deck), drawn at the places in anchors.kit (the user's wish 19.10.2026), and so is the folding
deck crane on the stainless gear locker in the starboard quarter (Jonas 21.10.2026: «Hurtigsjarken min skal også ha kran»; the orange
one on the port quarter of the picture is out with the rest of the baked gear). The wheelhouse's sole is sunk below the foredeck, a
step up from the working deck, so the one at the wheel stands with his head under the roof, and its dark lining is open at the windows
so the bridge view looks out (Jonas 21.10.2026).

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
    C['strake'] = mat('strake', (0.92, 0.92, 0.90), 0.5, zone=2)     # the white rubbing strake and the gunwale cap: paint zone 2 (the stripe)
    C['white'] = mat('house', (0.92, 0.92, 0.90), 0.5, zone=3)       # the wheelhouse, the cabin and the mast: zone 3 (superstructure)
    C['inner'] = mat('inner', (0.82, 0.82, 0.80), 0.3)
    C['deck'] = mat('deck', (0.40, 0.42, 0.42), 0.12, zone=4)        # the working deck and the foredeck: zone 4
    C['roof'] = mat('roof', (0.80, 0.80, 0.78), 0.3, zone=3)
    C['lampR'] = mat('lampR', (0.85, 0.08, 0.06), 0.7); C['lampG'] = mat('lampG', (0.08, 0.75, 0.30), 0.7); C['lampW'] = mat('lampW', (0.95, 0.93, 0.85), 0.7)
    C['rubber'] = mat('rubber', (0.10, 0.10, 0.11), 0.2); C['buoy'] = mat('buoy', (0.95, 0.45, 0.10), 0.3); C['buoyW'] = mat('buoyW', (0.93, 0.93, 0.90), 0.3)
    C['red'] = mat('red', (0.75, 0.10, 0.08), 0.4); C['seat'] = mat('seat', (0.16, 0.17, 0.20), 0.3); C['screen'] = mat('screen', (0.06, 0.10, 0.14), 0.8)
    C['steel'] = mat('steel', (0.66, 0.68, 0.70), 0.75, metal=0.7)
    C['dark'] = mat('dark', (0.12, 0.13, 0.14), 0.25)
    C['black'] = mat('black', (0.05, 0.05, 0.06), 0.35)
    C['glass'] = mat('glass', (0.05, 0.08, 0.11), 0.95)
    C['prop'] = mat('bronze', (0.70, 0.52, 0.27), 0.8, metal=0.9)
    C['orange'] = mat('orange', (0.95, 0.42, 0.06), 0.45)

NB = lambda fine: (8 if fine else 3, 1, 4 if fine else 2, 1, 4 if fine else 1)   # bottom, boot top, side to the strake, the strake, side to the top

BAND_Z = (WL - 0.03, WL + 0.08, Z_RUB - 0.05, Z_RUB + 0.05)   # the tops of the antifouling, the boot top, the side and the strake

def hull_rows(sg, fine=True):
    rows = []; n = NB(fine)
    xs = ([0.0, 0.03, 0.08] + [0.2 + 0.3 * i for i in range(28)] + [8.6 + 0.12 * i for i in range(20)]) if fine else [0.0, 0.1, 2.0, 5.0, 8.0, 9.5, 10.4, 10.8]
    # a section where the stem passes each band's top, so a band ends on the stem at its own height (bpyutil stem_stations; Jonas
    # 21.10.2026, #89: the antifouling and the white stripe went up the bow, and the stripe's two sides met in a notch at the stem)
    xs += stem_stations(z_keel, BAND_Z, 8.0, XF - 0.01)
    # (and a last section at the stem's tip, where the section is a point: without it the hull stopped a centimetre short and its open
    # end showed as a light notch at the top of the stem)
    xs = sorted(set(round(v, 4) for v in xs if v < XF - 0.01) | {X_HS, X_HS + 0.15, X_HS + 0.3, XF - 0.01, XF})
    for x in xs:
        sec = [(abs(y), z) for y, z in section(x, sg)]
        rows.append([(x, sg * y, z) for y, z in resample(sec, list(zip(BAND_Z, n)) + [(None, n[4])])])
    return rows

def band_of(j, fine):
    n = NB(fine); k = 0
    for m, c in zip(n, ('af', 'black', 'hull', 'strake', 'hull')):
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
    xs = sorted(set([XA + 0.04] + [XA + 0.2 + step * k for k in range(int(XF / step) + 2) if XA + 0.2 + step * k < XF - 0.2] + [X_HS, XF - 0.2, WX0 + 0.12, WX1 - 0.72, WX1 - 0.12]))
    for x0, x1 in zip(xs, xs[1:]):
        fd = x0 >= X_HS - 1e-6; za = zb = ZFD if fd else ZMD
        ya, yb = hbz(x0, za) - 0.05, hbz(x1, zb) - 0.05
        ta, tb = z_top(x0), z_top(x1); ea, eb = hbz(x0, ta), hbz(x1, tb)
        ia, ib = house_in(x0), house_in(x1)
        if fd and ia > 0 and ib > 0:
            # inside the wheelhouse: the sunk sole, and the foredeck's strips under its walls each side
            A.poly([(x0, -ia, ZWH), (x1, -ib, ZWH), (x1, ib, ZWH), (x0, ia, ZWH)], C['deck'], (0, 0, 1))
            for sg in (1, -1): A.poly([(x0, sg * ia, za), (x1, sg * ib, zb), (x1, sg * yb, zb), (x0, sg * ya, za)], C['deck'], (0, 0, 1))
        else: A.poly([(x0, -ya, za), (x1, -yb, zb), (x1, yb, zb), (x0, ya, za)], C['deck'], (0, 0, 1))
        for sg in (1, -1):
            A.poly([(x0, sg * ya, za), (x1, sg * yb, zb), (x1, sg * (eb - 0.05), tb), (x0, sg * (ea - 0.05), ta)], C['inner'], (0, -sg, 0))
            A.poly([(x0, sg * (ea - 0.05), ta), (x1, sg * (eb - 0.05), tb), (x1, sg * eb, tb + 0.01), (x0, sg * ea, ta + 0.01)], C['strake'], (0, 0, 1))
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


# ---------- the wheelhouse forward, the cabin with the hauling station under its roof, the mast ----------
WX0, WX1, WY = X_HS, 8.9, 2.1
WS, WH, WR = 3.45, 4.15, 4.41
# the wheelhouse's sole is sunk below the foredeck, a step up from the working deck, so the one at the wheel stands with his head under the
# roof and sees out of the windows over the console (Jonas 21.10.2026: the head went up through the roof when the sole was the foredeck)
ZWH = ZMD + 0.25
def house_in(x):
    """the half breadth of the wheelhouse inside (its lining) at x, 0 outside it"""
    if x < WX0 + 0.12 - 1e-6 or x > WX1 - 0.12 + 1e-6: return 0.0
    return WY * 0.94 if x <= WX1 - 0.72 else WY * 0.94 + (x - (WX1 - 0.72)) / 0.6 * ((WY - 0.6) * 0.94 - WY * 0.94)
LOCKER = (0.4, 1.4, 0.1, 0.7, 3.2)     # the gear locker in the starboard quarter: x0, x1, its sides in from the hull's side, its top
RAD_X = 7.45                # the open array's pedestal on the radar platform, forward of the mast

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
    # the lining inside, dark, from the sunk sole to the roof and open at the window band, so the bridge view looks out (Jonas 21.10.2026:
    # «Vinduene på båten er svarte»); the sills and heads close the walls' thickness, and the door aft to starboard is left open
    io = [(x + (0.12 if x == WX0 else -0.12), y * 0.94) for x, y in oc]
    for i in range(len(io)):
        a, b = io[i], io[(i + 1) % len(io)]; nrm = (-(b[1] - a[1]), b[0] - a[0], 0)
        segs = [(a, b)]
        if a[0] == b[0] == WX0 + 0.12:      # the aft lining: round the door (y -1.55 to -0.85, up to its head)
            lo, hi = sorted((a[1], b[1])); dz = ZMD + 1.95 + 0.08
            for y0, y1 in ((lo, -1.6), (-0.8, hi)): A.poly([(a[0], y0, ZWH), (a[0], y1, ZWH), (a[0], y1, WR), (a[0], y0, WR)], C['dark'], nrm)
            A.poly([(a[0], -1.6, dz), (a[0], -0.8, dz), (a[0], -0.8, WR), (a[0], -1.6, WR)], C['dark'], nrm)
            continue
        A.poly([(a[0], a[1], ZWH), (b[0], b[1], ZWH), (b[0], b[1], WS), (a[0], a[1], WS)], C['dark'], nrm)
        A.poly([(a[0], a[1], WH), (b[0], b[1], WH), (b[0], b[1], WR), (a[0], a[1], WR)], C['dark'], nrm)
        oa, ob = oc[i], oc[(i + 1) % len(oc)]
        A.poly([(a[0], a[1], WS), (b[0], b[1], WS), lean(ob, WS), lean(oa, WS)], C['dark'], (0, 0, 1))      # the sill
        A.poly([lean(oa, WH), lean(ob, WH), (b[0], b[1], WH), (a[0], a[1], WH)], C['dark'], (0, 0, -1))     # the head
    A.poly([(x, y, WR - 0.002) for x, y in io], C['inner'], (0, 0, -1))                                      # the deckhead
    # the cabin aft of it on the working deck: closed on the port side, open to starboard where the hauler stands under the roof
    abox(A, CX0, WX0 + 0.02, -0.5, WY, ZMD, WR, w)
    door(A, G, CX0, 0.3, 1.0, ZMD, 1.85, hinge=1)                  # the cabin door aft, port of the centre line, hung on its outboard side
    door(A, G, WX0, -1.55, -0.85, ZMD, 1.95, hinge=-1)             # the wheelhouse door aft to starboard, out to the hauling station
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
    for sg in (1, -1):
        abox(A, 8.2, 8.5, sg * (WY + 0.12) - 0.05, sg * (WY + 0.12) + 0.05, WR - 0.25, WR - 0.05, C['dark'])                           # the side lights' housings
        y0 = sg * (WY + 0.17); abox(A, 8.23, 8.47, min(y0, y0 + sg * 0.015), max(y0, y0 + sg * 0.015), WR - 0.22, WR - 0.08, C['lampR' if sg > 0 else 'lampG'])   # the glass, outboard
    lantern_geo(A)
    # the mast on the roof raked aft, the radar platform (now carried forward of the mast on a strut, where the radar the player buys
    # stands clear of it, the open array or the dome: kit.radarA, kit.radar), the antennas
    P0 = (6.9, 0, WR + 0.12); P1 = (6.4, 0, 6.6)
    beam(A, P0, P1, 0.22, 0.32, w)
    abox(A, 6.2, 6.8, -0.5, 0.5, 5.55, 5.62, w); abox(A, 6.75, RAD_X + 0.3, -0.3, 0.3, 5.55, 5.62, w); beam(A, (6.98, 0, 5.0), (RAD_X + 0.2, 0, 5.56), 0.08, 0.08, w)
    abox(A, 6.25, 6.55, -0.7, 0.7, 6.25, 6.3, w); abox(A, 6.35, 6.45, -0.06, 0.06, 6.6, 7.5, w)
    for y in (-0.65, 0.65): acyl(A, (6.4, y, 6.3), (6.4, y, 7.4), 0.012, lambda z: w, seg=4)
    acyl(A, (7.6, -1.6, WR + 0.12), (7.6, -1.6, 6.8), 0.02, lambda z: w, seg=4)
    acyl(A, (8.3, 1.4, WR + 0.12), (8.3, 1.4, 4.85), 0.12, lambda z: C['steel'], seg=10)
    # the hauling station on the starboard rail under the roof has no hauler in the model (Jonas 18.10.2026: no boat carries modelled gear);
    # the one the player buys is drawn at the hauler anchor
    # the anchor pockets in the bow
    for sg in (1, -1):
        x = 10.3; y = hbz(x, 2.6) + 0.02
        A.poly([(x - 0.2, sg * y, 2.4), (x + 0.2, sg * y, 2.48), (x + 0.2, sg * y, 2.8), (x - 0.2, sg * y, 2.72)], C['dark'], (0, sg, 0))
    helm_interior(A, G); work_deck(A); fittings(A, fine)
    return [A.done(30)], [G.done(30)]


# ---------- doors (B4): a frame with jambs and a head, a steel sill, the leaf with a porthole and a handle; hung on the side hinge gives
# (+1 the port jamb, -1 the starboard jamb), so it swings out and aft against the house. The leaf is part of the house for now; the
# doors anchor carries the hinge so the game can turn it when someone goes through ----------
def door(A, G, x, y0, y1, z0, h, hinge=1):
    w = C['white']; lo, hi = min(y0, y1), max(y0, y1)
    abox(A, x - 0.06, x + 0.02, lo - 0.05, lo, z0, z0 + h + 0.08, w); abox(A, x - 0.06, x + 0.02, hi, hi + 0.05, z0, z0 + h + 0.08, w)   # the jambs
    abox(A, x - 0.06, x + 0.02, lo - 0.05, hi + 0.05, z0 + h, z0 + h + 0.08, w)                                                           # the head
    abox(A, x - 0.07, x + 0.02, lo - 0.05, hi + 0.05, z0, z0 + 0.12, C['steel'])                                                           # the sill
    abox(A, x - 0.045, x - 0.005, lo + 0.01, hi - 0.01, z0 + 0.12, z0 + h - 0.01, w)                                                        # the leaf
    cy = (lo + hi) / 2; G.poly([(x - 0.05, cy - 0.14, z0 + 1.15), (x - 0.05, cy + 0.14, z0 + 1.15), (x - 0.05, cy + 0.14, z0 + 1.5), (x - 0.05, cy - 0.14, z0 + 1.5)], C['glass'], (-1, 0, 0))
    abox(A, x - 0.055, x - 0.045, cy - 0.16, cy + 0.16, z0 + 1.13, z0 + 1.52, C['dark'])                                                   # the porthole's rim
    hy = hi - 0.12 if hinge < 0 else lo + 0.12                                                                                             # the handle away from the hinge
    acyl(A, (x - 0.07, hy, z0 + 1.0), (x - 0.07, hy, z0 + 1.12), 0.012, lambda z: C['steel'], seg=6)
    acyl(A, (x - 0.045, hy, z0 + 1.06), (x - 0.09, hy, z0 + 1.06), 0.012, lambda z: C['steel'], seg=6)


# ---------- the lanterns (B8, rules 21–23 under 12 m): the side lights in their housings on the roof's sides, the all-round white on a
# bracket at the mast head, the stern light on the transom bulwark; all exported as typed lights ----------
def lantern_geo(A):
    abox(A, 6.5, 6.7, -0.03, 0.03, 6.38, 6.43, C['white'])                                                   # the bracket forward of the mast head
    acyl(A, (6.68, 0.0, 6.43), (6.68, 0.0, 6.6), 0.055, lambda z: C['lampW'], seg=10)                       # the all-round white
    acyl(A, (6.68, 0.0, 6.6), (6.68, 0.0, 6.64), 0.065, lambda z: C['dark'], seg=10)
    zt = z_top(XA); abox(A, XA + 0.08, XA + 0.18, 0.55, 0.65, zt, zt + 0.08, C['steel'])                     # the stern light on the transom bulwark, to port of the staff
    acyl(A, (XA + 0.13, 0.6, zt + 0.08), (XA + 0.13, 0.6, zt + 0.2), 0.035, lambda z: C['lampW'], seg=8)
    acyl(A, (XA + 0.13, 0.6, zt + 0.2), (XA + 0.13, 0.6, zt + 0.23), 0.042, lambda z: C['dark'], seg=8)
    for sg in (1, -1):                                                                                      # two deck floodlights on the roof's aft edge
        abox(A, CX0 - 0.02, CX0 + 0.02, sg * 1.3 - 0.02, sg * 1.3 + 0.02, WR + 0.12, WR + 0.32, C['steel'])
        abox(A, CX0 - 0.12, CX0 + 0.08, sg * 1.3 - 0.09, sg * 1.3 + 0.09, WR + 0.3, WR + 0.44, C['dark'])
        abox(A, CX0 - 0.13, CX0 - 0.12, sg * 1.3 - 0.07, sg * 1.3 + 0.07, WR + 0.32, WR + 0.42, C['lampW'])

def lantern_anchors(G):
    return [[G(6.68, 0.0, 6.52), [1, 0.95, 0.85], 'allround'], [G(8.35, WY + 0.2, WR - 0.15), [1, 0.12, 0.1], 'port'],
            [G(8.35, -WY - 0.2, WR - 0.15), [0.1, 1, 0.35], 'stbd'], [G(XA + 0.13, 0.6, z_top(XA) + 0.15), [1, 0.95, 0.85], 'stern']]


# ---------- the wheelhouse inside (B5): the console under the front windows with its screens and the wheel, the skipper's chair to
# starboard, a bench along the port side, all on the sunk sole; seen through the windows, so HELM_KIT is not needed ----------
def helm_interior(A, G):
    abox(A, 8.2, 8.75, -1.45, 1.45, ZWH, ZWH + 0.85, C['inner'])                                            # the console
    A.poly([(8.2, -1.45, ZWH + 0.85), (8.75, -1.45, ZWH + 0.85), (8.75, 1.45, ZWH + 0.85), (8.2, 1.45, ZWH + 0.85)], C['dark'], (0, 0, 1))
    for y0 in (-1.15, -0.5, 0.35):                                                                          # the plotter, the sounder and the radar screens
        A.poly([(8.5, y0, ZWH + 0.9), (8.5, y0 + 0.5, ZWH + 0.9), (8.42, y0 + 0.5, ZWH + 1.25), (8.42, y0, ZWH + 1.25)], C['screen'], (-1, 0, 0.25))
        abox(A, 8.42, 8.52, y0 - 0.02, y0 + 0.52, ZWH + 0.88, ZWH + 1.27, C['dark'])
    acyl(A, (8.2, -0.75, ZWH + 0.95), (8.05, -0.75, ZWH + 1.02), 0.03, lambda z: C['steel'], seg=6)
    atorus(A, (8.03, -0.75, ZWH + 1.03), (1, 0, 0.45), 0.2, 0.018, lambda a: C['black'], 16, 6)
    acyl(A, (7.55, -0.75, ZWH), (7.55, -0.75, ZWH + 0.5), 0.05, lambda z: C['steel'], seg=8)                  # the chair on its pedestal
    abox(A, 7.33, 7.8, -0.98, -0.52, ZWH + 0.5, ZWH + 0.6, C['seat']); abox(A, 7.28, 7.36, -0.98, -0.52, ZWH + 0.6, ZWH + 1.12, C['seat'])
    abox(A, 6.3, 7.7, 1.35, 1.95, ZWH + 0.42, ZWH + 0.5, C['seat']); abox(A, 6.3, 7.7, 1.88, 1.95, ZWH + 0.5, ZWH + 0.95, C['seat'])      # the bench to port
    abox(A, 6.3, 7.7, 1.35, 1.95, ZWH, ZWH + 0.42, C['inner'])


# ---------- the working deck (B6): the gutting table; the bleeding tub is the game's own, at the work anchor, and the fish boxes, the tubs
# and the crates are the game's deck kit ----------
TABLE = (3.0, 3.9, -1.9, -1.3)      # x0, x1, y0, y1 of the gutting table, starboard side by the hauling station
def work_deck(A):
    x0, x1, y0, y1 = TABLE; zt = ZMD + 0.9
    abox(A, x0, x1, y0, y1, zt - 0.05, zt, C['steel'])
    for x, y in ((x0 + 0.05, y0 + 0.05), (x1 - 0.05, y0 + 0.05), (x0 + 0.05, y1 - 0.05), (x1 - 0.05, y1 - 0.05)): acyl(A, (x, y, ZMD), (x, y, zt - 0.05), 0.02, lambda z: C['steel'], seg=5)
    abox(A, x0, x1, y0 - 0.02, y0, zt - 0.05, zt + 0.12, C['steel'])                                       # the lip outboard
    atorus(A, (3.3, 1.95, ZMD + 0.04), (0, 0, 1), 0.22, 0.03, lambda a: C['dark'], 14, 5)                     # a coiled deck hose


# ---------- fittings (B3, B7, B9–B11, B13): bollards, fenders, bilge keels, the windlass, vents, the exhaust, the flare locker, the flag
# staff (the liferaft and the lifebuoys are the game's deck kit) ----------
def fittings(A, fine=True):
    s = lambda z: C['steel']
    for x in (0.5, 3.6, 7.0, 9.9):                                                                           # bollards on the gunwale cap
        for sg in (1, -1):
            y = sg * (hbz(x, z_top(x)) - 0.14); zt = z_top(x)
            acyl(A, (x, y, zt), (x, y, zt + 0.26), 0.05, s, seg=8); acyl(A, (x - 0.1, y, zt + 0.2), (x + 0.1, y, zt + 0.2), 0.022, s, seg=6)
    for x in (1.6, 3.0, 4.3):                                                                               # fenders stowed inboard on the working deck, hung from the cap (outboard they widen the hull's measure)
        for sg in (1, -1):
            zt = z_top(x); y = sg * (hbz(x, zt) - 0.20); acyl(A, (x, y, zt - 0.06), (x, y, zt - 0.5), 0.12, lambda z: C['rubber'], seg=10)
            acyl(A, (x, sg * (hbz(x, zt) - 0.04), zt), (x, y, zt - 0.06), 0.008, lambda z: C['dark'], seg=4)
    for sg in (1, -1):                                                                                      # bilge keels along the chine
        xs = [3.0 + 0.5 * k for k in range(9)]
        for x0, x1 in zip(xs, xs[1:]):
            y0, y1 = interp(CHY, x0), interp(CHY, x1); z0, z1 = interp(CHZ, x0), interp(CHZ, x1)
            A.poly([(x0, sg * (y0 - 0.02), z0), (x1, sg * (y1 - 0.02), z1), (x1, sg * (y1 + 0.2), z1 + 0.08), (x0, sg * (y0 + 0.2), z0 + 0.08)], C['af'], (0, sg * 0.3, -1))
            A.poly([(x0, sg * (y0 - 0.02), z0 + 0.03), (x0, sg * (y0 + 0.2), z0 + 0.11), (x1, sg * (y1 + 0.2), z1 + 0.11), (x1, sg * (y1 - 0.02), z1 + 0.03)], C['af'], (0, -sg * 0.3, 1))
    abox(A, 9.45, 9.95, -0.3, 0.3, ZFD, ZFD + 0.18, s(0)); acyl(A, (9.7, -0.32, ZFD + 0.3), (9.7, 0.32, ZFD + 0.3), 0.13, s, seg=12)     # the windlass
    acyl(A, (9.7, 0.32, ZFD + 0.3), (9.7, 0.4, ZFD + 0.3), 0.07, s, seg=8)
    for sg in (1, -1): acyl(A, (9.0, sg * 0.8, ZFD), (9.0, sg * 0.8, ZFD + 0.22), 0.05, lambda z: C['white'], seg=8); acyl(A, (9.0, sg * 0.8, ZFD + 0.22), (9.0, sg * 0.8, ZFD + 0.3), 0.1, lambda z: C['white'], seg=10)   # mushroom vents
    acyl(A, (7.05, 0.42, WR + 0.12), (6.62, 0.42, 5.95), 0.07, lambda z: C['black'], seg=8)                  # the dry exhaust up the mast's aft side
    acyl(A, (6.62, 0.42, 5.95), (6.6, 0.42, 6.05), 0.085, lambda z: C['black'], seg=8)
    abox(A, CX0 - 0.12, CX0, 1.85, 2.05, ZMD + 0.9, ZMD + 1.2, C['red'])                                     # the flare locker
    ys = hbz(0.95, ZMD + 0.5); abox(A, LOCKER[0], LOCKER[1], -(ys - LOCKER[2]), -(ys - LOCKER[3]), ZMD, LOCKER[4], C['steel'])   # the gear locker in the starboard quarter, the crane's pedestal (kit.crane)
    zt = z_top(XA); acyl(A, (XA + 0.15, 0.0, zt - 0.1), (XA + 0.15, 0.0, zt + 1.25), 0.015, lambda z: C['white'], seg=6)    # the flag staff
    abox(A, XA + 0.1, XA + 0.2, -0.04, 0.04, zt, zt + 0.1, s(0))
    for sg in (1, -1):                                                                                      # mooring eyes on the bulwark aft
        acyl(A, (0.25, sg * (hbz(0.25, ZMD + 0.5) - 0.02), ZMD + 0.5), (0.25, sg * (hbz(0.25, ZMD + 0.5) - 0.1), ZMD + 0.5), 0.03, s, seg=6)


def build(fine=True):
    solids = build_hull(fine) + decks(fine) + underwater(fine)
    o, g = gear(fine); solids += o
    return [s for s in solids if s], [x for x in g if x]


def to_game(p): return (-p[1], p[2] - WL, -(p[0] - XM))
def to_game_n(n): return (-n[1], n[2], -n[0])

def name_strips(G):
    """where the name is written (vessel3d.js nameStrips, B12): on both topsides under the wheelhouse front, aft of the registration mark
    that the game puts near the stem, and across the transom over the strake"""
    out = []
    for sg, xs in ((1, [8.3 - 1.3 * k / 12 for k in range(13)]), (-1, [7.0 + 1.3 * k / 12 for k in range(13)])):
        B = []; T = []
        for x in xs:
            for arr, z in ((B, 2.3), (T, 2.66)): arr.append(G(x, sg * (hbz(x, z) + 0.03), z))
        out.append([B, T])
    ys = [1.0 - 2.0 * k / 12 for k in range(13)]      # port to starboard: left to right seen from astern
    out.append([[G(XA - 0.02, y, 2.28) for y in ys], [G(XA - 0.02, y, 2.62) for y in ys]])
    return out

# the boat's own anchor (tools/deck/anker.py, drawn and let go by the game, view3d.js drawAnchor; Jonas 21.10.2026): its kind and mass,
# the fairlead where the rode leaves her (the bow roller's top, or the hawse pipe's mouth on the side), the hawse pipe's deck end, the
# windlass's gypsy the chain comes off, whether the game draws the chain on deck (deck), and the spare in the other hawse
def bower(G):
    return {'kind': 'plog', 'kg': 16, 'fair': G(10.3, -(hbz(10.3, 2.6) + 0.03), 2.6), 'pipe': G(9.95, -0.6, ZFD + 0.03), 'gypsy': G(9.7, -0.2, ZFD + 0.43), 'side': 1, 'deck': True}


def anchors():
    G = lambda x, y, z: [round(v, 3) for v in to_game((x, y, z))]
    hx = 5.3
    x0, x1, y0, y1 = TABLE
    # the one at the wheel stands on the sunk sole forward of the chair, his eyes in the window band over the console's screens
    return {'bower': bower(G), 'eye': G(8.0, -0.75, ZWH + 1.62), 'skipperAt': G(7.9, -0.75, ZWH), 'hp': -0.08, 'fov': 60,
            'crewSpots': [G(4.4, -1.4, ZMD) + [1.57], G(2.6, 1.2, ZMD) + [0.0], G(1.2, -1.0, ZMD) + [3.14], G(3.4, 0.2, ZMD) + [0.0]],
            'lights': lantern_anchors(G),
            # the real doors (B4): the cabin door aft to port, the wheelhouse door aft to starboard out to the hauling station; the sill in
            # the game's frame, the hinge side and where one stands inside
            'doors': [{'at': G(CX0 - 0.03, 0.65, ZMD), 'w': 0.7, 'h': 1.85, 'in': G(CX0 + 0.8, 0.65, ZMD), 'to': 'cabin', 'hinge': 'port'},
                      {'at': G(WX0 - 0.03, -1.2, ZMD), 'w': 0.7, 'h': 1.95, 'in': G(WX0 + 0.8, -1.2, ZWH), 'to': 'helm', 'hinge': 'stbd'}],
            'names': name_strips(G),
            # the gutting table is the model's own (own, its top), the bleeding tub is drawn by the game aft of it, a little further out
            'work': {'table': G((x0 + x1) / 2, (y0 + y1) / 2, ZMD), 'tub': G(2.6, -1.75, ZMD), 'own': True, 'top': round(ZMD + 0.9 - WL, 3)},
            'hatch': G(2.0, 0.0, ZMD + 0.12), 'bunk': G(5.3, 1.2, ZMD + 0.6),
            # the clear working deck aft: the hauler on the starboard rail under the cabin's roof, the gear stacked aft of it
            'deck': {'y': round(ZMD - WL, 3), 'z': round(-(2.6 - XM), 3)}, 'gw': round(z_top(3.0) - WL, 3),
            'stern': round(XM - XA, 3), 'bow': round(-(XF - XM), 3), 'side': HB, 'beam': 4.68, 'pl': 4.4, 'rl': 1.78, 'open': False, 'hand': False,
            'pole': G(XA + 0.15, 0, z_top(XA) + 1.2), 'hauler': G(hx, -(hbz(hx, z_top(hx)) - 0.3), z_top(hx) + 0.35), 'filler': G(6.5, HB, ZFD + 0.3),
            'kit': kit(G)}


def kit(G):
    """the places of the deck kit (tools/deck, drawn by the game; the user's wish 19.10.2026), in the game's frame: the liferaft in its
    cradle on the roof aft to starboard where the old one lay; a buoy on the cabin's side in the hauling station, by the hauler, and one
    on the port bulwark between the fenders; the dome on the roof forward of the mast, the open array on the radar platform forward of it;
    the net tub at the stern in the middle, where the nets go out over the transom (the deck by the hauler is the table's, the bleeding
    tub's and the crew's); the line tubs along the port bulwark aft, inboard of the fenders; the deck cargo on the hatch and on the deck
    forward of it to port, clear of the cabin door; the folding crane (s 0.7, as the used speed sjark's) slewing on the gear locker in the
    starboard quarter, its booms folded forward along the starboard bulwark (ry 0), aft of the bleeding tub"""
    r = lambda v: round(v, 3); h = math.pi / 2
    return {'raft': [G(5.3, -1.7, WR + 0.12) + [r(h)]],
            # (the bulwark flares out as it rises: the port bracket stands off it as far as its face comes in at the ring's foot)
            'buoys': [G(5.3, -0.5, 3.6) + [r(h)], G(2.35, hbz(2.35, ZMD) - 0.06, 2.85) + [r(h)]],
            # (the dome on the radar platform in the mast, where the open array goes: Jonas 21.10.2026, #88: it lay on the roof)
            'radar': G(RAD_X, 0, 5.62),
            'radarA': G(RAD_X, 0, 5.62),
            'garn': {'at': G(0.75, 0.0, ZMD), 'ry': r(h)},
            'stamps': {'at': G(1.975, 1.72, ZMD), 'ry': 0.0},
            'cargo': [G(2.0, 0.0, ZMD + 0.12) + [0.0], G(3.4, 1.07, ZMD) + [r(h)]],
            'crane': {'at': G((LOCKER[0] + LOCKER[1]) / 2, -(hbz(0.95, ZMD + 0.5) - (LOCKER[2] + LOCKER[3]) / 2), LOCKER[4]), 'ry': 0.0, 's': 0.7, 'rest': None}}


SHOTS = [('bow3q', (21.0, -13.0, 5.5), (5.5, 0, 2.6), 35), ('stern3q', (-7.0, -9.0, 6.0), (4.5, 0, 2.6), 35), ('side', (5.5, -23, 2.8), (5.5, 0, 3.0), 35),
         ('above', (15.0, 10.0, 12.0), (5.0, 0, 2.0), 35), ('deck', (-3.0, 4.5, 6.0), (3.5, 0, 2.2), 35), ('stern', (-15.0, 0.5, 3.8), (3.5, 0, 2.6), 30),
         ('helm', (14.0, -5.5, 4.8), (8.0, -0.3, 3.7), 30), ('stb', (2.0, -11.5, 4.6), (4.8, 0, 2.8), 40)]

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
