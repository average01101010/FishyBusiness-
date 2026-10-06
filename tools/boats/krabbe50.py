"""The snow crab vessel (snokrabbe), a 50 m pot vessel with a freezing plant, built in Blender after the pictures of a modern crab
catcher that Jonas showed on 06.10.2026 (renders of a 57 x 12 m design: side, bow, three-quarter views). There is no drawing with
figures, so the model keeps the game's size (50 x 11 m, 6.0 m draft) and takes the proportions from the side view scaled to it: the
low pot deck aft with its bulwark 4.6 m over the water, the raised forecastle from 28 m forward, the wheelhouse on top of it with its
windows wrapping round the front, the mast on the roof, the portal for hauling the pots with the knuckle crane beside it, the shelter
roof over the pot deck aft, and the round forefoot under a near upright stem. Jonas asked for another colour scheme than the
pictures' («Bytt gjerne fargene til et annet design som ikke ligner denne»): an anthracite hull with an ochre sheer stripe and boot
top, a near black bottom, cream superstructure and ochre bands on the portal. Exterior only (CLAUDE.md).

    pip install bpy==4.5.4
    python3 tools/boats/krabbe50.py            -> src/data/boat-krabbe50.b64 (+ the side picture), renders in tools/boats/out/
    python3 tools/boats/krabbe50.py fast dry   -> no renders to look at, and the GLB only in tools/boats/out

Frame: x forward from the aft perpendicular, y to port, z up from the base line; the waterline is z = 6.0."""
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy
from bpyutil import *

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE)); OUT = os.path.join(HERE, 'out')
WL = 6.0; XA = -1.5; XF = 48.5; XM = (XA + XF) / 2; HB = 5.5
DK = 9.4                    # the pot deck aft
X_STEP = 28.0               # where the forecastle rises
TOP_A, TOP_F = 10.6, 12.6   # the bulwark aft, the forecastle side forward
DF = 12.45                  # the forecastle deck


# ---------- lines (metres) ----------
LOW = [(XA, 5.5), (0.0, 4.7), (2.0, 3.4), (4.0, 2.0), (6.0, 0.9), (8.0, 0.3), (11.0, 0.0), (43.8, 0.0)]
def z_low(x): return interp(LOW, x)
# the stem (z, x): the forefoot rounds up from the keel, the stem stands near upright and rakes a little forward to the top
STEM = [(0.0, 43.8), (0.4, 45.3), (1.2, 46.4), (2.4, 47.1), (3.8, 47.5), (WL, 47.8), (8.0, 48.0), (10.0, 48.2), (TOP_F, XF)]
def x_stem(z): return interp(STEM, z)
def z_top(x): return TOP_A + (TOP_F - TOP_A) * max(0.0, min(1.0, (x - X_STEP + 0.4) / 0.4))
HBD = [(XA, 5.2), (0.0, 5.4), (3.0, 5.5), (40.0, 5.5)]
HBW = [(XA, 4.8), (0.0, 5.15), (3.0, 5.45), (6.0, 5.5), (40.0, 5.5)]
NX = [(XA, 2.4), (2.0, 2.8), (5.0, 3.6), (9.0, 5.5), (12.0, 6.5), (40.0, 6.5)]
X_ENT = 34.0
PW = [(0.0, 2.2), (2.0, 2.6), (WL, 3.2), (9.0, 4.0), (TOP_F, 4.6)]


def section_body(x, n=24):
    zl = z_low(x); zt = z_top(x); bw = interp(HBW, x); bd = interp(HBD, x); nn = interp(NX, x); pts = []
    if zl < WL - 0.02:
        for k in range(n + 1):
            th = (math.pi / 2) * k / n; c = math.cos(th); s = math.sin(th)
            pts.append((bw * (s ** (2 / nn) if s > 0 else 0.0), zl + (WL - zl) * (1 - (c ** (2 / nn) if c > 0 else 0.0))))
    else:
        pts.append((0.0, zl))
    for k in range(1, 11):
        z = WL + (zt - WL) * k / 10; pts.append((bw + (bd - bw) * min(1.0, (z - WL) / 3.0) ** 1.3, z))
    return pts

# the bow forward of X_ENT: rows from the section there to the stem, as in al45.py
ZK0 = None
def bow_pt(yk, zk, x=None, s=None):
    global ZK0
    if ZK0 is None: ZK0 = z_low(X_ENT)
    xf = x_stem(zk)
    if s is None: s = max(0.0, min(1.0, (xf - x) / (xf - X_ENT)))
    else: x = xf - s * (xf - X_ENT)
    return x, (yk * (1 - (1 - s) ** interp(PW, zk)) if s > 0 else 0.0), zk

_SD = {}
def section(x, sg=1, n=24):
    if x <= X_ENT: pts = section_body(x, n)
    else:
        if 'd' not in _SD: _SD['d'] = resample(section_body(X_ENT, 48), [(None, 120)])
        pts = [bow_pt(y, z, x=x)[1:] for y, z in _SD['d']]
    return [(sg * y, z) for y, z in pts]

def hbz(x, z):
    sec = [(abs(y), zz) for y, zz in section(x, 1)]
    if z <= sec[0][1]: return 0.0
    for a, b in zip(sec, sec[1:]):
        if a[1] <= z <= b[1]: t = (z - a[1]) / max(1e-9, b[1] - a[1]); return a[0] + (b[0] - a[0]) * t
    return sec[-1][0]


# ---------- colours: anthracite, ochre and cream ----------
C = {}
def colours():
    C['af'] = mat('antifouling', (0.07, 0.075, 0.08), 0.15)
    C['boot'] = mat('ochre', (0.80, 0.50, 0.08), 0.5, zone=2)
    C['hull'] = mat('krhull', (0.15, 0.16, 0.175), 0.55, zone=1)
    C['white'] = mat('cream', (0.88, 0.86, 0.80), 0.5)
    C['inner'] = mat('inner', (0.78, 0.77, 0.73), 0.3)
    C['deck'] = mat('deck', (0.36, 0.38, 0.37), 0.12)
    C['roof'] = mat('roof', (0.70, 0.70, 0.67), 0.3)
    C['steel'] = mat('steel', (0.62, 0.64, 0.66), 0.75, metal=0.7)
    C['dark'] = mat('dark', (0.09, 0.10, 0.11), 0.25)
    C['black'] = mat('black', (0.05, 0.05, 0.06), 0.35)
    C['glass'] = mat('glass', (0.05, 0.08, 0.11), 0.95)
    C['prop'] = mat('bronze', (0.70, 0.52, 0.27), 0.8, metal=0.9)
    C['orange'] = mat('orange', (0.95, 0.38, 0.06), 0.45)

def stations(fine=True):
    if fine:
        xs = [XA + 0.05 * i for i in range(5)] + [XA + 0.25 + 0.4 * i for i in range(14)] + [4.0 + 0.8 * i for i in range(30)] + [X_STEP - 0.4, X_STEP - 0.2, X_STEP]
    else:
        xs = [XA, XA + 0.2, -0.5, 1.0, 3.0, 6.0, 10.0, 16.0, 22.0, X_STEP - 0.4, X_STEP, 31.0]
    return sorted(set(round(x, 4) for x in xs if XA <= x < X_ENT))

OUTH = lambda c: (0, c.y, min(c.z, 7.0) - 7.0)
NB = lambda fine: (11 if fine else 3, 2, 8 if fine else 2, 2)   # points in the bands: bottom, boot top, side, the stripe at the sheer

def hull_rows(sg, fine=True):
    rows = []; n0, n1, n2, n3 = NB(fine)
    def cut(sec, zt): return resample(sec, [(WL - 0.10, n0), (WL + 0.30, n1), (zt - 0.45, n2), (zt - 0.12, n3), (None, 1)])
    for x in stations(fine):
        rows.append([(x, sg * y, z) for y, z in cut([(abs(y), z) for y, z in section(x, sg)], z_top(x))])
    base = cut(section_body(X_ENT, 48), z_top(X_ENT)); n = 40 if fine else 12
    for i in range(n + 1):
        s = (1 - i / n) ** 1.5
        rows.append([(x, sg * y, z) for x, y, z in (bow_pt(yk, zk, s=s) for yk, zk in base)])
    return rows

def band_of(j, fine):
    n0, n1, n2, n3 = NB(fine)
    if j < n0: return C['af']
    if j < n0 + n1: return C['boot']
    if j < n0 + n1 + n2: return C['hull']
    if j < n0 + n1 + n2 + n3: return C['boot']
    return C['hull']

def build_hull(fine=True):
    objs = []; first = {}
    for sg, nm in ((1, 'p'), (-1, 's')):
        rows = hull_rows(sg, fine); first[sg] = rows[0]
        objs.append(grid('hull_' + nm, rows, lambda i, j: band_of(j, fine), out=OUTH))
    T = [[q, p] for p, q in zip(first[1], first[-1])]
    objs.append(grid('transom', T, lambda i, j: band_of(i, fine), angle=20, out=lambda c: (-1, 0, 0)))
    return objs


def decks(fine=True):
    A = Acc('decks')
    xs = sorted(set([x for x in stations(fine) if x <= X_STEP] + [X_STEP] + [X_STEP + 0.6 * k for k in range(40) if X_STEP + 0.6 * k < XF - 0.6] + [XF - 0.6]))
    for i in range(len(xs) - 1):
        x0, x1 = xs[i], xs[i + 1]; fwd = x0 >= X_STEP - 1e-6; zd = DF if fwd else DK
        ta, tb = z_top(x0 + 1e-3), z_top(x1 - 1e-3)
        y0, y1 = hbz(x0, zd) - 0.06, hbz(x1, zd) - 0.06
        if y0 < 0.05 and y1 < 0.05: continue
        A.poly([(x0, -y0, zd), (x1, -y1, zd), (x1, y1, zd), (x0, y0, zd)], C['deck'], (0, 0, 1))
        for sg in (1, -1):
            A.poly([(x0, sg * y0, zd), (x1, sg * y1, zd), (x1, sg * (hbz(x1, tb) - 0.06), tb), (x0, sg * (hbz(x0, ta) - 0.06), ta)], C['inner'], (0, -sg, 0))
            A.poly([(x0, sg * (hbz(x0, ta) - 0.06), ta), (x1, sg * (hbz(x1, tb) - 0.06), tb), (x1, sg * hbz(x1, tb), tb + 0.01), (x0, sg * hbz(x0, ta), ta + 0.01)], C['hull'], (0, 0, 1))
    # the forecastle's aft face over the pot deck, the transom's inner face
    y = hbz(X_STEP, DF) - 0.02
    A.poly([(X_STEP, -y, DK), (X_STEP, y, DK), (X_STEP, y, TOP_F), (X_STEP, -y, TOP_F)], C['white'], (-1, 0, 0))
    y = hbz(XA, TOP_A) - 0.06
    A.poly([(XA + 0.06, -y, DK), (XA + 0.06, y, DK), (XA + 0.06, y, TOP_A), (XA + 0.06, -y, TOP_A)], C['inner'], (1, 0, 0))
    abox(A, XA - 0.02, XA + 0.06, -y - 0.06, y + 0.06, TOP_A, TOP_A + 0.02, C['hull'])
    if fine:
        # rails: on the bulwark of the pot deck, round the forecastle deck
        for sg in (1, -1):
            for xa, xb, zt in ((XA + 0.3, X_STEP - 0.3, TOP_A), (X_STEP + 0.3, 46.6, TOP_F)):
                n = max(2, int((xb - xa) / 1.4)); pts = [(xa + (xb - xa) * k / n, 0, zt) for k in range(n + 1)]
                pts = [(x, sg * (hbz(x, zt) - 0.04), zt) for x, _, zt in pts]
                for p in pts: acyl(A, p, (p[0], p[1], p[2] + 1.0), 0.03, lambda z: C['white'], seg=6)
                for a, b in zip(pts, pts[1:]):
                    for h in (0.5, 1.0): acyl(A, (a[0], a[1], a[2] + h), (b[0], b[1], b[2] + h), 0.025, lambda z: C['white'], seg=5, cap=False)
    return [A.done(25)]


def underwater(fine=True):
    objs = []
    xs = [3.0 + (10.5 - 3.0) * k / 14 for k in range(15)]
    top = [(x, z_low(x) + 0.4) for x in xs]; bot = [(x, -0.3 if x < 9.0 else -0.3 * (10.5 - x) / 1.5) for x in reversed(xs)]
    rings = [[(x, sy * (0.35 if x < 9.0 else 0.35 * (10.5 - x) / 1.5 + 0.02), z) for x, z in top + bot] for sy in (1, -1)]
    objs.append(loft_rings('skeg', rings, C['af']))
    objs.append(box('shoe', -1.6, 3.1, -0.15, 0.15, -0.45, -0.28, C['af']))
    zc = 1.6
    objs.append(cyl('hub', (1.0, 0, zc), (2.0, 0, zc), 0.4, C['prop'], 12, r1=0.3))
    objs.append(cyl('shaft', (2.0, 0, zc), (3.1, 0, zc), 0.2, C['steel'], 10))
    for k in range(4):
        a = 2 * math.pi * k / 4 + 0.5; e = (0, math.cos(a), math.sin(a)); t = (0, -math.sin(a), math.cos(a))
        bl = [(1.5 + 0.25 * f, (0.35 + 1.15 * r) * e[1] + t[1] * w, zc + (0.35 + 1.15 * r) * e[2] + t[2] * w)
              for r, w, f in ((0, -0.28, 0), (0.5, -0.4, 0.4), (1.0, -0.2, 1.0), (1.0, 0.2, 1.0), (0.5, 0.38, -0.4), (0, 0.25, 0))]
        objs.append(loft_rings('blade%d' % k, [[(p[0] - 0.03, p[1], p[2]) for p in bl], [(p[0] + 0.03, p[1], p[2]) for p in bl]], C['prop']))
    rud = [(-0.3, 4.4), (-1.6, 4.4), (-1.7, 4.1), (-1.7, -0.15), (-1.6, -0.28), (-0.3, -0.28), (-0.2, 0.1), (-0.2, 4.1)]
    w = lambda x: 0.24 * max(0.25, 1 - abs(x + 0.9) / 1.1)
    objs.append(loft_rings('rudder', [[(x, w(x), z) for x, z in rud], [(x, -w(x), z) for x, z in rud]], C['af']))
    return objs


# ---------- on deck ----------
def deck_gear(fine=True):
    A = Acc('gear'); w = C['white']; sg_ = 18 if fine else 8
    # the shelter over the pot deck aft: a house across the stern, the roof forward of it on posts, its rail
    abox(A, XA + 0.1, 2.6, -4.9, 4.9, DK, 12.3, w)
    for x in (0.0, 1.4):
        for sg in (1, -1): A.poly([(x, sg * 4.92, 10.9), (x + 0.9, sg * 4.92, 10.9), (x + 0.9, sg * 4.92, 11.8), (x, sg * 4.92, 11.8)], C['glass'], (0, sg, 0))
    abox(A, XA, 13.0, -5.0, 5.0, 12.3, 12.5, C['roof'])
    for x in (5.2, 8.6, 12.6):
        for sg in (1, -1): abox(A, x - 0.12, x + 0.12, sg * 4.75 - 0.12, sg * 4.75 + 0.12, DK, 12.3, w)
    if fine:
        for sg in (1, -1): acyl(A, (XA + 0.2, sg * 4.9, 13.4), (12.9, sg * 4.9, 13.4), 0.03, lambda z: w, seg=6, cap=False)
        acyl(A, (XA + 0.2, -4.9, 13.4), (XA + 0.2, 4.9, 13.4), 0.03, lambda z: w, seg=6, cap=False)
        for x in [XA + 0.2 + 1.45 * k for k in range(10)]:
            for sg in (1, -1): acyl(A, (x, sg * 4.9, 12.5), (x, sg * 4.9, 13.4), 0.03, lambda z: w, seg=5)
    # the exhaust stack on the port quarter, black, two pipes raked aft
    abox(A, 2.8, 4.6, 2.9, 4.7, DK, 14.2, C['black'], skip=())
    for y in (3.35, 4.25): acyl(A, (3.7, y, 14.2), (3.2, y, 15.3), 0.22, lambda z: C['black'], seg=10)
    # the pots go out over the stern: the chute on the starboard quarter
    beam(A, (3.0, -3.6, DK + 0.9), (XA - 0.4, -3.6, TOP_A - 0.2), 1.2, 0.12, C['steel'])
    # the pot conveyor along the starboard side to the hauling station
    abox(A, 3.5, 24.0, -4.6, -3.4, DK, DK + 0.75, C['steel'])
    # the portal over the hauling station: two posts with ochre bands, the beam over them with its sheaves
    for x in (21.6, 24.6):
        for y in (-4.5, -1.5):
            abox(A, x - 0.2, x + 0.2, y - 0.2, y + 0.2, DK, 19.0, w)
            abox(A, x - 0.21, x + 0.21, y - 0.21, y + 0.21, 17.6, 18.2, C['boot'])
    abox(A, 21.2, 25.0, -4.7, -1.3, 19.0, 19.5, w)
    for y in (-4.4, -3.5, -2.6):
        acyl(A, (23.1, y - 0.12, 19.0), (23.1, y + 0.12, 19.0), 0.42, lambda z: C['steel'], seg=12)
    acyl(A, (23.1, -4.4, 18.6), (23.1, -5.4, 11.2), 0.02, lambda z: C['dark'], seg=4)
    # the knuckle crane on the port side by the portal, its boom folded aft along the deck
    acyl(A, (19.0, 3.4, DK), (19.0, 3.4, DK + 2.4), 0.5, lambda z: w, seg=sg_)
    beam(A, (19.0, 3.4, DK + 2.6), (18.8, 3.3, DK + 3.6), 0.6, 0.6, w)
    beam(A, (18.8, 3.3, DK + 3.6), (12.0, 3.0, DK + 2.6), 0.42, 0.5, w); beam(A, (12.0, 3.0, DK + 2.6), (17.0, 2.8, DK + 1.5), 0.32, 0.38, w)
    # a second, taller crane forward of the portal with its boom up and aft
    acyl(A, (26.6, 3.6, DK), (26.6, 3.6, DK + 1.8), 0.42, lambda z: w, seg=sg_)
    beam(A, (26.6, 3.6, DK + 1.8), (26.2, 3.4, DK + 9.5), 0.34, 0.38, w); beam(A, (26.2, 3.4, DK + 9.5), (22.5, 3.0, DK + 6.8), 0.26, 0.3, w)
    # the rescue boat on its platform on the port side forward of the shelter
    bx0, bx1, by, bz = 14.0, 18.6, 3.7, 11.2
    abox(A, 13.6, 19.0, 2.6, 4.9, 10.95, 11.15, C['steel'])
    for x in (13.8, 18.8):
        for y in (2.8, 4.7): acyl(A, (x, y, DK), (x, y, 10.95), 0.06, lambda z: C['steel'], seg=6)
    rb = [(bx0, 0.0, 0.0), (bx0 + 0.15, 0.62, 0.0), (bx1 - 1.1, 0.8, 0.0), (bx1 - 0.15, 0.38, 0.2), (bx1, 0.0, 0.38)]
    ring = lambda z, sc: [(x, by + sc * y, z + h) for x, y, h in rb] + [(x, by - sc * y, z + h) for x, y, h in reversed(rb[1:-1])]
    R0 = ring(bz, 0.72); R1 = ring(bz + 0.7, 1.0)
    for i in range(len(R0)):
        j = (i + 1) % len(R0); A.poly([R0[i], R0[j], R1[j], R1[i]], C['orange'], ((R0[i][0] + R0[j][0]) / 2 - 16.3, (R0[i][1] + R0[j][1]) / 2 - by, 0))
    A.poly(list(reversed(R0)), C['orange'], (0, 0, -1)); A.poly(R1, C['dark'], (0, 0, 1))
    # the hull side forward: windows of the accommodation in the forecastle, the anchors, the bow thruster
    for sg in (1, -1):
        for x in [30.0 + 2.4 * k for k in range(6)]:
            y = hbz(x, 11.3) + 0.015; A.poly([(x - 0.3, sg * y, 10.9), (x + 0.3, sg * y, 10.9), (x + 0.3, sg * y, 11.7), (x - 0.3, sg * y, 11.7)], C['glass'], (0, sg, 0))
        x = 46.0; y = hbz(x, 10.6) + 0.02
        A.poly([(x - 0.5, sg * y, 10.1), (x + 0.5, sg * y, 10.25), (x + 0.5, sg * y, 11.0), (x - 0.5, sg * y, 10.85)], C['dark'], (0, sg, 0))
    # the forecastle deck: windlasses and the rail at the bow
    for sg in (1, -1):
        acyl(A, (44.4, sg * 0.6, DF + 0.6), (44.4, sg * 1.7, DF + 0.6), 0.5, lambda z: C['steel'], seg=sg_)
    abox(A, 43.8, 45.0, -1.8, 1.8, DF, DF + 0.35, C['dark'])
    acyl(A, (47.8, 0, TOP_F), (47.8, 0, TOP_F + 2.0), 0.06, lambda z: w, seg=8)
    return [A.done(30)]


# ---------- the wheelhouse over the forecastle house, the mast ----------
HX0, HX1, HY = 27.6, 38.6, 4.6            # the house on the forecastle deck
WX0, WX1, WY = 29.0, 37.4, 5.1            # the wheelhouse, wider than the house below it
WF, WS, WH, WR = 14.4, 15.25, 16.45, 17.1

def wheelhouse(fine=True):
    A = Acc('wh'); G = Acc('whglass'); w = C['white']
    abox(A, HX0, HX1, -HY, HY, DF, WF, w)
    for sg in (1, -1):
        for x in [HX0 + 1.0 + 2.0 * k for k in range(5)]: A.poly([(x, sg * (HY + 0.01), 13.2), (x + 0.8, sg * (HY + 0.01), 13.2), (x + 0.8, sg * (HY + 0.01), 13.9), (x, sg * (HY + 0.01), 13.9)], C['glass'], (0, sg, 0))
    abox(A, HX0 - 0.6, HX1 + 0.8, -HY - 0.5, HY + 0.5, WF - 0.15, WF, C['roof'])
    # the wheelhouse: the front in three facets leaning out, the sides with windows; glass all round the front and the wings
    oc = [(WX0, -WY + 0.6), (WX1 - 2.0, -WY), (WX1, -WY + 1.8), (WX1, WY - 1.8), (WX1 - 2.0, WY), (WX0, WY - 0.6)]
    lean = lambda p, z: (p[0] + (0.7 * (z - WF) / (WR - WF) if p[0] > WX1 - 2.01 else 0.0), p[1], z)
    for i in range(len(oc)):
        a, b = oc[i], oc[(i + 1) % len(oc)]; nrm = (b[1] - a[1], -(b[0] - a[0]), 0)
        A.poly([lean(a, WF), lean(b, WF), lean(b, WS), lean(a, WS)], w, nrm)
        A.poly([lean(a, WH), lean(b, WH), lean(b, WR), lean(a, WR)], w, nrm)
        if a[0] == WX0 and b[0] == WX0:
            A.poly([lean(a, WS), lean(b, WS), lean(b, WH), lean(a, WH)], w, nrm); continue
        G.poly([lean(a, WS), lean(b, WS), lean(b, WH), lean(a, WH)], C['glass'], nrm)
        L = math.hypot(b[0] - a[0], b[1] - a[1]); k = max(1, int(L / 1.2))
        for j in range(k + 1):
            t = j / k; p = (a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t); beam(A, lean(p, WS), lean(p, WH), 0.1, 0.1, C['black'])
    A.poly([(x, y, WF + 0.02) for x, y in oc], C['dark'], (0, 0, 1))
    io = [(x + (0.2 if x == WX0 else -0.25), y * 0.94) for x, y in oc]
    for i in range(len(io)):
        a, b = io[i], io[(i + 1) % len(io)]; A.poly([(a[0], a[1], WF), (b[0], b[1], WF), (b[0], b[1], WR), (a[0], a[1], WR)], C['dark'], (-(b[1] - a[1]), b[0] - a[0], 0))
    ro = [(WX0 - 0.3, -WY + 0.3), (WX1 - 1.8, -WY - 0.3), (WX1 + 1.0, -WY + 1.6), (WX1 + 1.0, WY - 1.6), (WX1 - 1.8, WY + 0.3), (WX0 - 0.3, WY - 0.3)]
    A.poly([(x, y, WR) for x, y in ro], C['roof'], (0, 0, -1)); A.poly([(x, y, WR + 0.25) for x, y in ro], C['roof'], (0, 0, 1))
    for i in range(len(ro)):
        a, b = ro[i], ro[(i + 1) % len(ro)]; A.poly([(a[0], a[1], WR), (b[0], b[1], WR), (b[0], b[1], WR + 0.25), (a[0], a[1], WR + 0.25)], w, (b[1] - a[1], -(b[0] - a[0]), 0))
        if fine: acyl(A, (a[0], a[1], WR + 1.05), (b[0], b[1], WR + 1.05), 0.03, lambda z: w, seg=6, cap=False)
    if fine:
        for x, y in ro: acyl(A, (x, y, WR + 0.25), (x, y, WR + 1.05), 0.03, lambda z: w, seg=5)
    # yellow searchlights on the roof's front corners
    for sg in (1, -1): acyl(A, (WX1 - 0.6, sg * (WY - 0.9), WR + 0.25), (WX1 - 0.6, sg * (WY - 0.9), WR + 0.9), 0.2, lambda z: C['boot'], seg=10)
    # the mast on the roof: a tapered tower, two yards with the radars and lights, the pole
    acyl(A, (32.0, 0, WR + 0.25), (32.0, 0, 21.5), 0.42, lambda z: w, seg=12, r1=0.28)
    for z, L in ((19.6, 1.6), (21.2, 1.1)): abox(A, 31.8, 32.2, -L, L, z, z + 0.12, w)
    abox(A, 31.4, 32.6, -0.12, 0.12, 20.0, 20.15, C['dark']); abox(A, 31.6, 32.4, -0.1, 0.1, 21.5, 21.65, C['dark'])
    acyl(A, (32.0, 0, 21.5), (32.0, 0, 23.2), 0.05, lambda z: w, seg=6)
    for sg in (1, -1): abox(A, 36.0, 36.6, sg * (WY + 0.25) - 0.1, sg * (WY + 0.25) + 0.1, WR - 0.3, WR - 0.05, C['dark'])
    # ladders from the pot deck up to the forecastle deck
    for sg in (1, -1):
        for k in range(8): abox(A, X_STEP - 0.4 - 0.32 * k, X_STEP - 0.12 - 0.32 * k, sg * 2.6 - 0.45, sg * 2.6 + 0.45, DF - 0.42 * (k + 1) + 0.04, DF - 0.42 * (k + 1) + 0.1, C['steel'])
    return [A.done(30)], [G.done(30)]


def build(fine=True):
    solids = build_hull(fine) + decks(fine) + underwater(fine) + deck_gear(fine)
    o, g = wheelhouse(fine); solids += o
    return [s for s in solids if s], [x for x in g if x]


def to_game(p): return (-p[1], p[2] - WL, -(p[0] - XM))
def to_game_n(n): return (-n[1], n[2], -n[0])

def anchors():
    G = lambda x, y, z: [round(v, 3) for v in to_game((x, y, z))]
    return {'eye': G(36.6, -0.8, WF + 1.75), 'skipperAt': G(36.2, -0.8, WF), 'hp': -0.10, 'fov': 58,
            'crewSpots': [G(20.0, -2.6, DK) + [1.57], G(14.0, 1.0, DK) + [0.0], G(8.0, -2.0, DK) + [3.14], G(25.0, 0.5, DK) + [0.0]],
            'lights': [[G(32.0, 0, 23.0), [1, 0.95, 0.85]], [G(36.3, WY + 0.25, WR - 0.15), [1, 0.12, 0.1]], [G(36.3, -WY - 0.25, WR - 0.15), [0.1, 1, 0.35]],
                       [G(XA + 0.3, 0, 13.6), [1, 0.95, 0.85]], [G(23.1, -3.0, 18.8), [1, 0.95, 0.85]], [G(47.8, 0, TOP_F + 1.9), [1, 0.95, 0.85]]],
            # the pot deck: the pots come up under the portal on the starboard side, are emptied and stacked aft under the shelter
            'deck': {'y': round(DK - WL, 3), 'z': round(-(16.0 - XM), 3)}, 'gw': round(TOP_A - WL, 3),
            'stern': round(XM - XA, 3), 'bow': round(-(XF - XM), 3), 'side': HB, 'beam': 11.0, 'pl': 20.0, 'rl': 4.2, 'open': False, 'hand': False,
            'pole': G(XA + 0.4, 0, 14.6), 'hauler': G(23.1, -(HB - 0.5), TOP_A + 0.4), 'filler': G(26.0, HB, DK + 0.3)}


SHOTS = [('bow3q', (80.0, -46.0, 16.0), (24.0, 0, 9.0), 35), ('stern3q', (-30.0, 34.0, 22.0), (18.0, 0, 9.0), 35), ('side', (23.5, -88, 10.0), (23.5, 0, 11.0), 35),
         ('above', (62.0, -40.0, 50.0), (23.0, 0, 8.0), 35), ('deck', (8.0, -24.0, 18.0), (20.0, 0, 11.0), 35)]

def main():
    os.makedirs(OUT, exist_ok=True)
    reset(); colours()
    solids, glass = build(True)
    join(solids, 'BOAT0'); join(glass, 'GLASS0')
    if 'fast' not in sys.argv: beauty(OUT, 'kr', WL, SHOTS)
    ex = {'frame': 'kystfiske: x starboard, y up from the waterline, z aft; metres', 'type': 'snokrabbe', 'name': 'Snow crab pot vessel 50 m',
          'len': 50.0, 'beam': 11.0, 'draft': 6.0, 'anchors': anchors()}
    export_boat(build, to_game, to_game_n, OUT, 'krabbe50.glb', os.path.join(ROOT, 'src', 'data', 'boat-krabbe50.b64'), ex,
                side=(os.path.join(ROOT, 'src', 'data', 'boat-krabbe50-side.b64'), 23.5, 11.0, 54.0), dry='dry' in sys.argv)


if __name__ == '__main__':
    main()
