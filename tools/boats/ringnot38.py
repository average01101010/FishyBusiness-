"""The pilot boat (docs/planer/grafikk-batmodeller.md F4, docs/skipsmodeller/sulebas-pilot-grunnlag.md): a 38.55 m multi-purpose
purse seiner and fly-shooter of the Norwegian coastal fleet, built in Blender after the photographs and the build report of a Seacon
SC38 (delivered 2014) that Jonas gave on 30.10.2026. No real name, mark, call sign, logo or maker's name goes into the model (CLAUDE.md
07.10.2026): the game puts the player's own on the name strips. Exterior only.

The measures from the build report: length overall 38.55 m, between perpendiculars 34.00 m, breadth 9.50 m, depth to the main deck
4.30 m and to the shelter deck 6.60 m. The draft is not given; 3.85 m is read off the photographs (the blue hull runs from the
waterline to the shelter deck, about 2.75 m). Everything else is read off four photographs and checked by laying renders over them
(kap. 4 of the groundwork says what each measure rests on).

    pip install bpy==4.5.4
    python3 tools/boats/ringnot38.py dry      -> the GLB in tools/boats/out only, and the renders
    python3 tools/boats/ringnot38.py fast dry -> no renders

Frame: x forward from the transom's aft face, y to port, z up from the base line (the underside of the keel); the waterline is z = 3.85.
"""
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy
from bpyutil import *
import fittings as F

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE)); OUT = os.path.join(HERE, 'out')
LOA, LPP, BM = 38.55, 34.00, 9.50
WL = 3.85                      # the waterline (draft, read off the photographs)
D_MAIN, D_SH = 4.30, 6.60      # depth to the main deck and to the shelter deck (build report)
XA, XF = 0.0, LOA              # the transom's aft face, the stem's top
AP = 1.2; FP = AP + LPP        # the rudder stock and the forward perpendicular (the stem at the waterline)
HB = BM / 2

# ---------- the lines (metres) ----------
# the keel and the buttock at the centreline aft: the counter over the propeller, the run up from the flat keel
LOW = [(XA, 4.15), (1.0, 3.90), (2.2, 3.60), (3.8, 3.15), (5.5, 1.90), (7.5, 0.65), (9.5, 0.0), (31.5, 0.0), (32.6, 0.25)]
def z_low(x): return interp(LOW, x)
# the half-breadth at the waterline and at the shelter deck; the transom's corners are rounded in plan (the photographs: a large radius)
HBW = [(XA, 3.55), (1.5, 4.05), (4.0, 4.50), (8.0, 4.72), (27.0, 4.72)]
HBD = [(XA, 4.15), (0.6, 4.45), (1.5, 4.64), (3.0, 4.74), (27.0, HB)]
# how full the sections are under water (a superellipse's exponent): a V aft, nearly box-shaped amidships
NX = [(XA, 2.0), (3.0, 2.3), (6.0, 3.4), (10.0, 5.5), (27.0, 5.5)]
# the shelter deck at the side (the top of the blue), with its sheer; the bulwark's top (the high wall round the net bin aft, the low
# bulwark along the working deck, the forecastle's)
ZS = [(XA, 6.90), (6.0, 6.62), (14.0, 6.60), (24.0, 6.62), (28.0, 6.75), (33.0, 7.25), (XF, 8.10)]
# (laid over photo 2 at 16.7 px/m, 30.10.2026: the high wall 9.45 m round the bin, the house's flush side to 8.4 m, the working deck's
# bulwark to 8.15 m, the forecastle's to 9.05-9.3 m)
ZB = [(XA, 9.45), (6.35, 9.45), (6.55, 8.40), (20.0, 8.40), (20.2, 8.15), (28.3, 8.15), (28.6, 9.05), (33.0, 9.10), (XF, 9.30)]
def z_sh(x): return interp(ZS, x)
def z_bw(x): return interp(ZB, x)
# the stem (z, x): the forefoot runs into the bulb, a straight stem raked about 27 degrees above the water
STEM = [(0.0, 32.6), (0.5, 33.6), (1.2, 34.5), (2.0, 35.0), (3.0, 35.35), (WL, 35.6), (5.0, 36.15), (6.6, 36.95), (8.0, 37.75), (9.3, XF)]
def x_stem(z): return interp(STEM, z)
X_ENT = 28.0                   # the bow's rows from here forward
ZF = 8.40                      # the forecastle deck, forward of the step at 28.6 m
ZA = 8.40                      # deck A: the top of the full-width house aft (6.55-20.0 m)
# the bow's fullness at each height: low, a fine entrance; high, full waterlines under the flare
PW = [(0.0, 1.5), (2.0, 1.7), (WL, 2.0), (6.6, 2.6), (9.3, 3.0)]
# the colours up the side (the photograph on the slip, 30.10.2026): red to just over the waterline, a thin white line, blue, a broad
# white stripe, blue to the shelter deck
BAND = [WL + 0.20, WL + 0.33, WL + 0.95, WL + 1.22]


def section_body(x, n=28):
    """the section at x aft of X_ENT, from the keel at the centreline up to the bulwark's top: (half-breadth, height)"""
    zl = z_low(x); zs = z_sh(x); zb = z_bw(x); bw = interp(HBW, x); bd = interp(HBD, x); nn = interp(NX, x); pts = []
    if zl < WL - 0.02:
        for k in range(n + 1):
            th = (math.pi / 2) * k / n; c = math.cos(th); s = math.sin(th)
            pts.append((bw * (s ** (2 / nn) if s > 0 else 0.0), zl + (WL - zl) * (1 - (c ** (2 / nn) if c > 0 else 0.0))))
        z0 = WL
    else:
        # the counter over the propeller, above the water: flat across, rounded into the side
        w0 = bw + (bd - bw) * max(0.0, min(1.0, (zl - WL) / (zs - WL))) ** 0.8
        for k in range(n + 1):
            t = k / n; pts.append((w0 * (1 - (1 - t) ** 3) if t < 1 else w0, zl + 0.35 * t ** 4))
        z0 = zl + 0.35
    for k in range(1, 13):
        z = z0 + (zs - z0) * k / 12; f = ((z - WL) / max(0.1, zs - WL)) if z > WL else 0.0
        pts.append((bw + (bd - bw) * max(0.0, min(1.0, f)) ** 0.75, z))
    for k in range(1, 5):
        z = zs + (zb - zs) * k / 4; pts.append((bd + 0.02 * (z - zs), z))
    return pts

_BASE = {}
def bow_pt(yk, zk, s):
    """a point of the bow: the base section's point (yk, zk) at X_ENT carried a fraction s of the way to the stem at its height"""
    xs = x_stem(zk); x = X_ENT + s * (xs - X_ENT)
    return x, (yk * (1 - s ** interp(PW, zk)) if s < 1 else 0.0), zk

def hbz(x, z):
    """the hull's half-breadth at (x, z)"""
    if x <= X_ENT: sec = section_body(x, 48)
    else:
        if 'b' not in _BASE: _BASE['b'] = resample(section_body(X_ENT, 96), [(None, 160)])
        xs = x_stem(z)
        if x >= xs: return 0.0
        s = (x - X_ENT) / (xs - X_ENT); sec = [(y * (1 - s ** interp(PW, zz)), zz) for y, zz in _BASE['b']]
    if z <= sec[0][1]: return 0.0
    for a, b in zip(sec, sec[1:]):
        if a[1] <= z <= b[1]: t = (z - a[1]) / max(1e-9, b[1] - a[1]); return a[0] + (b[0] - a[0]) * t
    return sec[-1][0]

def surf(x, z, sg, off=0.0):
    """the hull's outside at (x, z) on side sg (1 port): the point, its outward normal, and the direction along the hull forward"""
    p = lambda xx, zz: V((xx, sg * (hbz(xx, zz) + off), zz))
    tx = p(x + 0.12, z) - p(x - 0.12, z); tz = p(x, z + 0.12) - p(x, z - 0.12); n = tx.cross(tz)
    if n.y * sg < 0: n = -n
    return p(x, z), n.normalized(), tx.normalized()


# ---------- colours (the photographs; the paint zones of 10j-paint.js: 1 the hull, 2 the stripe, 3 the superstructure, 4 the decks) ----------
C = {}
def colours():
    C['af'] = mat('antifouling', (0.40, 0.07, 0.08), 0.2)
    C['stripe'] = mat('stripe', (0.92, 0.92, 0.90), 0.55, zone=2)
    C['hull'] = mat('r38hull', (0.06, 0.20, 0.55), 0.6, zone=1)
    C['white'] = mat('white', (0.91, 0.91, 0.89), 0.5, zone=3)
    C['inner'] = mat('inner', (0.83, 0.84, 0.83), 0.35, zone=3)
    C['deck'] = mat('deck', (0.42, 0.44, 0.44), 0.15, zone=4)
    C['bin'] = mat('bin', (0.52, 0.47, 0.40), 0.12, zone=4)
    C['trim'] = mat('trim', (0.07, 0.24, 0.62), 0.5, zone=1)       # the blue bands on the superstructure and the masts
    C['steel'] = mat('steel', (0.62, 0.64, 0.66), 0.7, metal=0.7)
    C['galv'] = mat('galv', (0.70, 0.71, 0.70), 0.45, metal=0.6)
    C['dark'] = mat('dark', (0.10, 0.11, 0.12), 0.3)
    C['black'] = mat('black', (0.04, 0.04, 0.05), 0.35)
    C['rubber'] = mat('rubber', (0.05, 0.05, 0.055), 0.15)
    C['glass'] = mat('glass', (0.04, 0.07, 0.10), 0.95)
    C['prop'] = mat('bronze', (0.70, 0.52, 0.27), 0.8, metal=0.9)
    C['zinc'] = mat('zinc', (0.55, 0.57, 0.58), 0.35, metal=0.6)
    C['mark'] = mat('mark', (0.95, 0.95, 0.93), 0.4)
    C['orange'] = mat('orange', (0.93, 0.36, 0.07), 0.45)
    C['yellow'] = mat('yellow', (0.92, 0.72, 0.10), 0.45)
    C['green'] = mat('hose', (0.20, 0.55, 0.22), 0.35)
    C['tarp'] = mat('tarp', (0.07, 0.20, 0.55), 0.3)
    C['hydr'] = mat('hydr', (0.08, 0.20, 0.55), 0.4)
    C['lens'] = mat('lens', (0.95, 0.94, 0.85), 0.9)
    C['lampR'] = mat('lampR', (0.85, 0.08, 0.06), 0.7); C['lampG'] = mat('lampG', (0.08, 0.75, 0.3), 0.7); C['lampW'] = mat('lampW', (0.95, 0.93, 0.85), 0.7)

def band(z):
    if z < BAND[0]: return C['af']
    if z < BAND[1]: return C['stripe']
    if z < BAND[2]: return C['hull']
    if z < BAND[3]: return C['stripe']
    return C['hull']


# ---------- the hull ----------
def stations(fine=True):
    xs = [XA + 0.04 * i for i in range(6)] + [0.25 + 0.25 * i for i in range(24)] + [6.25 + (0.5 if fine else 2.0) * i for i in range(44 if fine else 11)]
    return sorted(set(round(x, 4) for x in xs if XA <= x <= X_ENT) | {X_ENT})

def girth(sec, fine):
    """resampled section: dense at the bilge, the stripe, the shelter deck's edge and the bulwark's top"""
    zs = sec[-5][1]; n = (1.0 if fine else 0.35)
    return resample(sec, [(BAND[0] - 0.02, int(16 * n) + 3), (BAND[0], 1), (BAND[1], 1), (BAND[2], 2), (BAND[3], 1), (zs - 0.02, int(8 * n) + 2), (zs, 1), (None, 4)])

def hull_rows(sg, fine=True):
    rows = []
    for x in stations(fine):
        rows.append([(x, sg * y, z) for y, z in girth(section_body(x), fine)])
    base = girth(section_body(X_ENT, 96), fine); n = 56 if fine else 14
    for i in range(1, n + 1):
        s = (i / n) ** 1.25
        rows.append([(x, sg * y, z) for x, y, z in (bow_pt(yk, zk, s) for yk, zk in base)])
    return rows

def cell_mat(rows, i, j):
    z = (rows[i][j][2] + rows[i][j + 1][2]) / 2
    zs = z_sh(rows[i][j][0])
    return C['white'] if z > zs + 0.01 else band(z)

def build_hull(fine=True):
    objs = []; first = {}
    for sg, nm in ((1, 'p'), (-1, 's')):
        rows = hull_rows(sg, fine); first[sg] = rows[0]
        objs.append(grid('hull_' + nm, rows, lambda i, j, rows=rows: cell_mat(rows, i, j), out=lambda c: (0, c.y, min(c.z, WL) - WL)))
    # the transom: flat, closing the two sides
    T = [[q, p] for p, q in zip(first[1], first[-1])]
    objs.append(grid('transom', T, lambda i, j: C['white'] if T[i][0][2] > z_sh(XA) + 0.01 else band(T[i][0][2]), angle=20, out=lambda c: (-1, 0, 0)))
    return objs


# ---------- the bulb ----------
# (the photograph on the slip: a large round bulb, its underside running on from the keel, its top just under the waterline, its nose
# nearly as far forward as the stem's top, a hollow neck between it and the stem)
BULB = [(30.8, 0.60, 1.40, 2.20), (31.8, 1.02, 1.90, 2.05), (32.8, 1.25, 2.02, 2.00), (33.8, 1.35, 2.00, 2.02), (34.8, 1.36, 1.95, 2.05),
        (35.7, 1.30, 1.84, 2.08), (36.5, 1.16, 1.62, 2.10), (37.1, 0.95, 1.30, 2.12), (37.5, 0.67, 0.90, 2.13), (37.75, 0.35, 0.46, 2.13), (37.84, 0.06, 0.07, 2.13)]
def bulb(fine=True):
    sg = 24 if fine else 10; rings = []
    for x, ry, rz, zc in BULB:
        rings.append([(x, ry * math.cos(2 * math.pi * k / sg), zc + rz * math.sin(2 * math.pi * k / sg)) for k in range(sg)])
    return [loft_rings('bulb', rings, C['af'], angle=50)]


# ---------- under water: the skeg, the propeller in its aperture, the rudder, the thrusters, the bilge keels, the anodes ----------
# (the build report: a controllable pitch propeller type P70.22.280.4, read as four blades 2.80 m across; two tunnel thrusters of 368 and
# 450 kW, read as 1.225 m tunnels; the photograph on the slip shows the propeller and the rudder aft and the bow thruster's grille low in
# the bulb)
PX, PZ, PR = 3.05, 1.55, 1.40       # the propeller's centre and radius
def underwater(fine=True):
    objs = []; U = Acc('under')
    # the skeg under the run, carrying the stern tube, ending forward of the propeller
    xs = [3.75 + (11.0 - 3.75) * k / 16 for k in range(17)]
    top = [(x, z_low(x) + 0.35) for x in xs]; bot = [(x, 0.0 if x > 4.4 else 0.6 * (4.4 - x) / 0.65) for x in reversed(xs)]
    wd = lambda x: 0.32 if x < 9.0 else 0.32 * (11.0 - x) / 2.0 + 0.02
    objs.append(loft_rings('skeg', [[(x, sy * wd(x), z) for x, z in top + bot] for sy in (1, -1)], C['af']))
    objs.append(cyl('boss', (3.75, 0, PZ), (4.5, 0, PZ), 0.42, C['af'], 16, r1=0.36))
    objs.append(cyl('shaft', (PX + 0.2, 0, PZ), (3.8, 0, PZ), 0.2, C['steel'], 12))
    F.propeller(U, (PX, 0, PZ), (1, 0, 0), PR, C['prop'], n=4, hub=0.25, cpp=True, m_hub=C['prop'], m_bolt=C['steel'], m_guard=C['af'], fine=fine)
    # the rudder aft of it, on its stock at the aft perpendicular, a horn over it and a flap-less blade with an end plate
    rud = [(AP + 0.70, 3.30), (AP - 1.05, 3.30), (AP - 1.15, 3.0), (AP - 1.15, 0.25), (AP - 1.0, 0.12), (AP + 0.70, 0.12), (AP + 0.82, 0.45), (AP + 0.82, 3.05)]
    wr = lambda x: 0.30 * max(0.25, 1 - abs(x - (AP - 0.1)) / 1.05)
    objs.append(loft_rings('rudder', [[(x, wr(x), z) for x, z in rud], [(x, -wr(x), z) for x, z in rud]], C['af']))
    objs.append(cyl('stock', (AP, 0, 3.3), (AP, 0, z_low(AP) + 0.2), 0.16, C['af'], 12))
    if fine:
        for sg in (1, -1):
            # the zinc anodes on the rudder, the skeg, the hull aft and along the bilge
            for z in (0.8, 2.4): F.anode(U, (AP - 0.2, sg * (wr(AP - 0.2) + 0.003), z), (0, sg, 0), (1, 0, 0), C['zinc'], L=0.36, m_strap=C['steel'])
            for x, z in ((5.0, 0.9), (7.5, 0.35)): F.anode(U, (x, sg * 0.322, z), (0, sg, 0), (1, 0, 0), C['zinc'], L=0.36, m_strap=C['steel'])
            for x in (12.0, 18.0, 24.0):
                p, n, tt = surf(x, 0.9, sg, off=0.003); F.anode(U, p, n, (1, 0, 0), C['zinc'], L=0.4, m_strap=C['steel'])
            # the bilge keels amidships at the turn of the bilge
            pts = [surf(x, 0.55, sg)[0] for x in [10.0 + 0.8 * k for k in range(18)]]
            for a, b in zip(pts, pts[1:]):
                n = surf((a.x + b.x) / 2, 0.55, sg)[1]; d = V((n.x, n.y, n.z)); d.z = min(d.z, -0.35); d.normalize()
                U.poly([a, b, b + d * 0.32, a + d * 0.32], C['af'], (0, sg, 0.2)); U.poly([a + d * 0.32, b + d * 0.32, b, a], C['af'], (0, -sg, -0.2))
            # the stern thruster in the run, the bow thruster through the bulb's neck
            p, n, tt = surf(6.2, 2.35, sg); F.thruster_tunnel(U, p, n, 0.61, C['dark'], C['af'], m_prop=C['prop'], fine=fine)
            F.thruster_tunnel(U, V((34.0, sg * 1.37, 1.95)), V((0, sg, 0)), 0.61, C['dark'], C['af'], m_prop=C['prop'], fine=fine)
            # the sea chests' grilles low on the side amidships
            for x in (15.5, 17.0):
                p, n, tt = surf(x, 1.1, sg, off=0.004); r_, u_, nn = F._onb(n, (0, 0, 1))
                for k in range(6):
                    q = p + r_ * (-0.45 + 0.18 * k); U.poly([q - u_ * 0.25, q + r_ * 0.07 - u_ * 0.25, q + r_ * 0.07 + u_ * 0.25, q + u_ * 0.25], C['dark'], n)
        # the two sonars' trunks under the forward body (a lowered dome shows as a short round trunk with a flush cover)
        for x in (27.5, 29.0): objs.append(cyl('sonar%d' % int(x), (x, 0, 0.0), (x, 0, -0.06), 0.42, C['dark'], 16))
    objs.append(U.done(30))
    return objs


# ---------- the decks and the bulwarks' inside ----------
def decks(fine=True):
    A = Acc('decks')
    xs = [x for x in stations(fine) if x <= X_ENT] + [X_ENT + 0.5 * k for k in range(1, 20) if X_ENT + 0.5 * k < x_stem(z_sh(X_ENT + 0.5 * k)) - 0.4]
    for x0, x1 in zip(xs, xs[1:]):
        zd0, zd1 = z_sh(x0), z_sh(x1)
        if x0 >= 28.6: zd0 = zd1 = None
        y0, y1 = hbz(x0, z_sh(x0) + 0.02) - 0.05, hbz(x1, z_sh(x1) + 0.02) - 0.05
        if y0 < 0.05 and y1 < 0.05: continue
        m = C['bin'] if x1 <= 6.4 else C['deck']
        if zd0 is not None: A.poly([(x0, -y0, zd0), (x1, -y1, zd1), (x1, y1, zd1), (x0, y0, zd0)], m, (0, 0, 1))
        for sg in (1, -1):
            ta, tb = z_bw(x0), z_bw(x1); za, zb_ = z_sh(x0), z_sh(x1)
            ya0, yb0 = hbz(x0, ta) - 0.06, hbz(x1, tb) - 0.06
            A.poly([(x0, sg * y0, za), (x1, sg * y1, zb_), (x1, sg * yb0, tb), (x0, sg * ya0, ta)], C['inner'], (0, -sg, 0))
            A.poly([(x0, sg * ya0, ta), (x1, sg * yb0, tb), (x1, sg * hbz(x1, tb), tb + 0.005), (x0, sg * hbz(x0, ta), ta + 0.005)], C['white'], (0, 0, 1))
    # the forecastle deck, a level forward from the step at 28.6 m
    zf = ZF
    for x0, x1 in zip([28.6 + 0.4 * k for k in range(24)], [28.6 + 0.4 * (k + 1) for k in range(24)]):
        y0, y1 = hbz(x0, zf) - 0.05, hbz(x1, zf) - 0.05
        if y0 < 0.05 or y1 < 0.05: break
        A.poly([(x0, -y0, zf), (x1, -y1, zf), (x1, y1, zf), (x0, y0, zf)], C['deck'], (0, 0, 1))
    y = hbz(28.6, zf) - 0.05; A.poly([(28.6, -y, z_sh(28.6)), (28.6, y, z_sh(28.6)), (28.6, y, zf), (28.6, -y, zf)], C['white'], (-1, 0, 0))
    # the transom's inside (the net bin's aft wall)
    y = hbz(XA + 0.1, 8.0) - 0.06
    A.poly([(XA + 0.08, -y, z_sh(XA)), (XA + 0.08, y, z_sh(XA)), (XA + 0.08, y, z_bw(XA)), (XA + 0.08, -y, z_bw(XA))], C['inner'], (1, 0, 0))
    return [A.done(30)]


# ---------- the superstructure (positions laid over photo 2, 30.10.2026) ----------
ZB2 = 10.65                    # deck B, the wheelhouse's floor
WX0, WX1, WY = 10.9, 21.1, 3.9 # the wheelhouse: aft, forward, half-width
WS, WH, WR = 11.70, 12.80, 13.10   # its windows' sill and head, the roof's underside

def rail(A, pts, h=1.0, m=None, every=1.5, r=0.024, mid=True):
    """a pipe rail along the points: posts about every 1.5 m, the top rail and a knee rail"""
    m = m or C['white']; P = [V(p) for p in pts]; L = sum((b - a).length for a, b in zip(P, P[1:]))
    for a, b in zip(P, P[1:]):
        for hh in ((h, h * 0.5) if mid else (h,)): acyl(A, a + V((0, 0, hh)), b + V((0, 0, hh)), r, lambda z: m, seg=6, cap=False)
        n = max(1, int((b - a).length / every))
        for k in range(n + 1):
            q = a + (b - a) * (k / n); acyl(A, q, q + V((0, 0, h)), r, lambda z: m, seg=6)

def door(A, x0, x1, y, z0, h=2.0, face=1, m=None):
    """a steel door in a wall at y (face the side it looks to): frame, leaf with its window and dogs"""
    m = m or C['white']; f = face
    abox(A, x0 - 0.06, x1 + 0.06, min(y, y + f * 0.05), max(y, y + f * 0.05), z0, z0 + h + 0.07, C['inner'])
    abox(A, x0, x1, min(y + f * 0.05, y + f * 0.09), max(y + f * 0.05, y + f * 0.09), z0 + 0.12, z0 + h - 0.02, m)
    cx = (x0 + x1) / 2; abox(A, cx - 0.14, cx + 0.14, min(y + f * 0.09, y + f * 0.095), max(y + f * 0.09, y + f * 0.095), z0 + 1.25, z0 + 1.65, C['glass'])
    for zz in (z0 + 0.55, z0 + 1.0, z0 + 1.5): abox(A, x1 - 0.12, x1 - 0.04, min(y + f * 0.09, y + f * 0.13), max(y + f * 0.09, y + f * 0.13), zz - 0.03, zz + 0.03, C['steel'])

def superstructure(fine=True):
    A = Acc('house'); G = Acc('glass'); w = C['white']
    # deck A over the full-width house (its sides are the hull's, up to 8.4 m): the deck, the house's front with two doors
    xs = [6.55 + 0.45 * k for k in range(31) if 6.55 + 0.45 * k <= 20.0] + [20.0]
    for x0, x1 in zip(xs, xs[1:]):
        y0, y1 = hbz(x0, ZA - 0.02) - 0.03, hbz(x1, ZA - 0.02) - 0.03
        A.poly([(x0, -y0, ZA), (x1, -y1, ZA), (x1, y1, ZA), (x0, y0, ZA)], C['deck'], (0, 0, 1))
    yf = hbz(20.0, 7.5) - 0.06
    A.poly([(20.0, -yf, D_SH), (20.0, yf, D_SH), (20.0, yf, ZA), (20.0, -yf, ZA)], w, (1, 0, 0))
    abox(A, 19.95, 20.05, -yf, yf, ZA - 0.12, ZA, w)
    # the aft face of the house over the net bin
    ya = hbz(6.55, 7.5) - 0.06; A.poly([(6.55, -ya, D_SH), (6.55, ya, D_SH), (6.55, ya, ZA), (6.55, -ya, ZA)], w, (-1, 0, 0))
    if fine:
        for yy in (-2.6, 2.6): door_x(A, 20.0, yy, D_SH)
        # the rails along deck A's edges, and across its aft end over the bin
        for sg in (1, -1): rail(A, [(x, sg * (hbz(x, ZA) - 0.06), ZA) for x in (6.7, 9.0, 12.0, 15.0, 18.0, 19.9)])
        rail(A, [(6.62, -ya, ZA), (6.62, ya, ZA)])
    # the house on deck A (deck B over it), set in from the sides
    HX0, HX1, HY = 11.2, 19.6, 3.35
    abox(A, HX0, HX1, -HY, HY, ZA, ZB2, w)
    abox(A, HX0 - 0.3, HX1 + 0.3, -HY - 0.35, HY + 0.35, ZB2 - 0.14, ZB2, w)
    if fine:
        for sg in (1, -1):
            for x in (12.2, 13.4, 16.8, 18.0):
                yy = sg * (HY + 0.005); A.poly([(x, yy, 9.55), (x + 0.75, yy, 9.55), (x + 0.75, yy, 10.15), (x, yy, 10.15)][::sg], C['glass'], (0, sg, 0))
            door_y(A, 14.6, 15.4, sg * HY, ZA, sg)
        door_x(A, HX0, 1.6, ZA, face=-1)
    # the wheelhouse: the front in three facets leaning out at the top, glass all round, the roof with its overhang and the blue band
    oc = [(WX0, -WY), (WX1 - 1.6, -WY), (WX1, -WY + 1.5), (WX1, WY - 1.5), (WX1 - 1.6, WY), (WX0, WY)]
    lean = lambda p, z: (p[0] + (0.45 * (z - WS) / (WR - WS) if p[0] > WX1 - 1.61 and z > WS else 0.0), p[1], z)
    for i in range(len(oc)):
        a, b = oc[i], oc[(i + 1) % len(oc)]; nrm = (b[1] - a[1], -(b[0] - a[0]), 0)
        A.poly([lean(a, ZB2), lean(b, ZB2), lean(b, WS), lean(a, WS)], w, nrm)
        A.poly([lean(a, WH), lean(b, WH), lean(b, WR), lean(a, WR)], w, nrm)
        aft = a[0] == WX0 and b[0] == WX0
        G.poly([lean(a, WS), lean(b, WS), lean(b, WH), lean(a, WH)], C['glass'], nrm)
        Lg = math.hypot(b[0] - a[0], b[1] - a[1]); k = max(1, int(Lg / (1.15 if not aft else 1.6)))
        for j in range(k + 1):
            t = j / k; p = (a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t); beam(A, lean(p, WS), lean(p, WH), 0.09, 0.09, C['black'])
        beam(A, lean(a, WS), lean(b, WS), 0.07, 0.07, C['black']); beam(A, lean(a, WH), lean(b, WH), 0.07, 0.07, C['black'])
    # the floor under the overhang forward of the house below, and the inside seen through the glass
    A.poly([(HX1, -WY, ZB2), (WX1 - 1.6, -WY, ZB2), (WX1, -WY + 1.5), (WX1, WY - 1.5, ZB2), (WX1 - 1.6, WY, ZB2), (HX1, WY, ZB2)][::-1] if False else
           [(x, y, ZB2 - 0.01) for x, y in [(HX1, -WY), (WX1 - 1.6, -WY), (WX1, -WY + 1.5), (WX1, WY - 1.5), (WX1 - 1.6, WY), (HX1, WY)]], w, (0, 0, -1))
    io = [(x + (0.2 if x == WX0 else -0.2), y * 0.94) for x, y in oc]
    lining(A, oc, io, ZB2, WS, WH, WR, lambda p, z, i: lean(p, z), C['dark'], lambda i: True)
    ro = [(WX0 - 0.35, -WY - 0.35), (WX1 - 1.5, -WY - 0.35), (WX1 + 0.85, -WY + 1.3), (WX1 + 0.85, WY - 1.3), (WX1 - 1.5, WY + 0.35), (WX0 - 0.35, WY + 0.35)]
    A.poly([(x, y, WR) for x, y in ro], C['inner'], (0, 0, -1)); A.poly([(x, y, WR + 0.25) for x, y in ro], w, (0, 0, 1))
    for i in range(len(ro)):
        a, b = ro[i], ro[(i + 1) % len(ro)]; nrm = (b[1] - a[1], -(b[0] - a[0]), 0)
        A.poly([(a[0], a[1], WR), (b[0], b[1], WR), (b[0], b[1], WR + 0.11), (a[0], a[1], WR + 0.11)], C['trim'], nrm)
        A.poly([(a[0], a[1], WR + 0.11), (b[0], b[1], WR + 0.11), (b[0], b[1], WR + 0.25), (a[0], a[1], WR + 0.25)], w, nrm)
    if fine: rail(A, [(x, y, WR + 0.25) for x, y in ro] + [(ro[0][0], ro[0][1], WR + 0.25)], h=1.0)
    # the signs for the call sign on the roof's edge, port and starboard (the game writes the player's on them)
    for sg in (1, -1):
        y = sg * (WY + 0.2); abox(A, 12.0, 14.6, min(y, y + sg * 0.06), max(y, y + sg * 0.06), WR + 0.5, WR + 1.4, w)
        abox(A, 11.98, 14.62, min(y + sg * 0.06, y + sg * 0.07), max(y + sg * 0.06, y + sg * 0.07), WR + 0.48, WR + 1.42, C['black'])
        abox(A, 12.03, 14.57, min(y + sg * 0.07, y + sg * 0.075), max(y + sg * 0.07, y + sg * 0.075), WR + 0.53, WR + 1.37, w)
        for x in (12.3, 14.3): acyl(A, (x, y - sg * 0.04, WR + 0.25), (x, y - sg * 0.04, WR + 0.5), 0.03, lambda z: C['steel'], seg=6)
    return [A.done(30)], [G.done(30)]

def door_x(A, x, yc, z0, face=1, w=0.8):
    """a door in a wall across the boat at x, centred at yc"""
    f = face; m = C['white']
    abox(A, min(x, x + f * 0.05), max(x, x + f * 0.05), yc - w / 2 - 0.06, yc + w / 2 + 0.06, z0, z0 + 2.07, C['inner'])
    abox(A, min(x + f * 0.05, x + f * 0.09), max(x + f * 0.05, x + f * 0.09), yc - w / 2, yc + w / 2, z0 + 0.12, z0 + 1.98, m)
    abox(A, min(x + f * 0.09, x + f * 0.095), max(x + f * 0.09, x + f * 0.095), yc - 0.14, yc + 0.14, z0 + 1.25, z0 + 1.65, C['glass'])
    for zz in (z0 + 0.55, z0 + 1.0, z0 + 1.5): abox(A, min(x + f * 0.09, x + f * 0.13), max(x + f * 0.09, x + f * 0.13), yc + w / 2 - 0.12, yc + w / 2 - 0.04, zz - 0.03, zz + 0.03, C['steel'])

def door_y(A, x0, x1, y, z0, face):
    door(A, x0, x1, y, z0, face=face)


def build(fine=True):
    solids = build_hull(fine) + bulb(fine) + underwater(fine) + decks(fine)
    o, g = superstructure(fine); solids += o
    return [s for s in solids if s], [x for x in g if x]


def to_game(p): return (-p[1], p[2] - WL, -(p[0] - LOA / 2))
def to_game_n(n): return (-n[1], n[2], -n[0])

SHOTS = [('side', (19.3, -95.0, 6.0), (19.3, 0, 6.0), 35), ('bow3q', (62.0, -38.0, 12.0), (20.0, 0, 6.0), 35),
         ('stern3q', (-22.0, -30.0, 14.0), (14.0, 0, 6.0), 35), ('above', (55.0, 30.0, 40.0), (19.0, 0, 5.0), 35)]

def main():
    os.makedirs(OUT, exist_ok=True)
    reset(); colours()
    solids, glass = build(True)
    join(solids, 'BOAT0')
    if glass: join(glass, 'GLASS0')
    if 'fast' not in sys.argv: beauty(OUT, 'r38', WL, SHOTS)


if __name__ == '__main__':
    main()
