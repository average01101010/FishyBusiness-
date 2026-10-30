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
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy
from bpyutil import *
import bmesh
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
# the shelter deck at the side (the top of the blue) with its sheer, and the top of the hull's side (the deck over the shelter deck,
# the high wall round the net bin aft). Measured on the side photograph 42432bd5 (30.10.2026, kap. 4.3 of the groundwork): 80.47 px/m
# from the stem's top to the transom, heights from the shelter deck's 6.60 m at midships (the build report's depth); the blue's top
# was read every 0.5 m by its colour. Both lines have a real sheer, low at about x = 15.5 and rising to both ends (the older side
# photograph a8a8e4c4 shows the same rise in metres, so it is not the lens)
ZS = [(XA, 7.39), (2.0, 7.25), (4.0, 7.12), (6.0, 6.97), (8.0, 6.86), (10.0, 6.72), (12.0, 6.65), (14.0, 6.57), (15.5, 6.54), (17.0, 6.56),
      (18.2, 6.60), (20.0, 6.69), (22.0, 6.75), (24.0, 6.89), (26.0, 7.05), (28.0, 7.25), (30.0, 7.43), (32.5, 7.66), (34.5, 7.80), (36.4, 7.97),
      (37.7, 8.13), (XF, 8.25)]
# (the side's top: the net bin's wall 9.85 m to the funnel's fore edge at 6.35 m, then the upper deck's edge with the rail straight on
# it, 8.44 m at its lowest, rising forward to 9.18 m at the stem)
ZB = [(XA, 9.85), (6.30, 9.85), (6.42, 8.70), (8.0, 8.68), (10.0, 8.62), (12.0, 8.54), (15.0, 8.44), (17.0, 8.49), (19.0, 8.55), (21.0, 8.61),
      (23.0, 8.70), (25.0, 8.84), (28.0, 8.95), (32.5, 9.08), (36.0, 9.14), (XF, 9.18)]
def z_sh(x): return interp(ZS, x)
# the starboard side is lower: an open working deck on the shelter deck runs along it from the net bin's high wall (which curves down
# to the deck at 5.5-7.3 m) to the forecastle (rising again at 25.8-26.6 m), with only a pipe rail on the side's edge (photographs
# 274df4a7 and 82e91969, Jonas 30.10.2026: "båten er høyere på babord rekka enn styrbord fordi den har et arbeidsdekk på styrbord")
X_WD = (7.3, 25.8)             # the starboard working deck's ends at the side: from the net bin's wall to the forecastle (Jonas
                               # 30.10.2026: "arbeidsdekk nesten hele veien bak på styrbord-siden"; a5d2b0af, 4929aa51)
Y_C = -0.6                     # the casing's starboard wall forward of the house: the upper deck to port of it
HX0, HX1, HY = 11.73, 20.35, 3.35   # the house under the wheelhouse (its starboard wall is the casing's aft of 20.35 m)
def y_c(x): return -HY if x < HX1 else Y_C
def z_bw(x, sg=1):
    if sg > 0 or x < X_WD[0] or x >= 26.6: return interp(ZB, x)
    lo = z_sh(x) + 0.35          # the low bulwark plate along the working deck, under the blue pipe rail
    if x <= X_WD[1]: return lo
    t = (x - X_WD[1]) / (26.6 - X_WD[1]); return lo + (interp(ZB, x) - lo) * (3 * t * t - 2 * t ** 3)
# the stem (z, x), read off the same photograph above the bow wave: raked about 33 degrees, through 35.2 m at the waterline (the
# forward perpendicular, AP + Lpp); below the water the forefoot runs into the bulb
STEM = [(0.0, 32.4), (0.5, 33.3), (1.2, 34.1), (2.0, 34.6), (3.0, 34.95), (WL, 35.2), (4.6, 35.45), (5.5, 35.95), (6.36, 36.43), (7.22, 37.0),
        (8.13, 37.67), (8.75, 38.24), (9.18, XF)]
def x_stem(z): return interp(STEM, z)
X_ENT = 28.0                   # the bow's rows from here forward
# the bow's fullness at each height: low, a fine entrance; high, full waterlines under the flare
PW = [(0.0, 1.5), (2.0, 1.7), (WL, 2.0), (6.6, 2.6), (9.3, 3.0)]
# the colours up the side: red to just over the waterline and a thin white line over it, level (the photograph on the slip); then
# blue with the broad white stripe in it, which follows a sheer of its own (the side photograph: 0.33 m wide, its top 4.92 m at its
# lowest and 5.57 m aft; continuous from 4.35 to 27.35 m, ending in three slanted dashes at each end)
BAND = [WL + 0.20, WL + 0.33]
STRIPE = [(2.7, 5.57), (4.6, 5.47), (6.5, 5.36), (8.3, 5.25), (10.2, 5.13), (12.05, 5.03), (13.9, 4.96), (15.8, 4.92), (17.65, 4.93), (19.5, 4.96),
          (21.4, 4.98), (23.2, 5.02), (25.1, 5.08), (27.0, 5.17), (28.8, 5.23), (30.5, 5.30)]
ST_W, ST_X = 0.33, (4.35, 27.35)
ST_DASH = [(2.58, 3.11), (3.16, 3.68), (3.78, 4.26), (27.44, 28.11), (28.25, 28.88), (29.07, 29.64)]
def st_top(x): return interp(STRIPE, x)
def st_bot(x): return st_top(x) - ST_W


def section_body(x, n=28):
    """the section at x aft of X_ENT, from the keel at the centreline up to the bulwark's top: (half-breadth, height)"""
    zl = z_low(x); zs = z_sh(x); zb = z_bw(x); bw = interp(HBW, x); bd = interp(HBD, x); nn = interp(NX, x); pts = []
    if zl < WL - 0.02:
        for k in range(n + 1):
            th = (math.pi / 2) * k / n; c = math.cos(th); s = math.sin(th)
            pts.append((bw * (s ** (2 / nn) if s > 0 else 0.0), zl + (WL - zl) * (1 - (c ** (2 / nn) if c > 0 else 0.0))))
        z0 = WL
    else:
        # the counter over the propeller, above the water: flat across, turned into the side with a soft round
        w0 = bw + (bd - bw) * max(0.0, min(1.0, (zl - WL) / (zs - WL))) ** 0.8; R = 0.65
        for k in range(n + 1):
            th = (math.pi / 2) * k / n; c = math.cos(th); s = math.sin(th)
            pts.append((w0 * (s ** (2 / 3.2) if s > 0 else 0.0), zl + R * (1 - (c ** (2 / 3.2) if c > 0 else 0.0))))
        z0 = zl + R
    for k in range(1, 13):
        z = z0 + (zs - z0) * k / 12; f = ((z - WL) / max(0.1, zs - WL)) if z > WL else 0.0
        pts.append((bw + (bd - bw) * max(0.0, min(1.0, f)) ** 0.75, z))
    for k in range(1, 5):
        z = zs + (zb - zs) * k / 4; pts.append((bd + 0.02 * (z - zs), z))
    return pts

# ---------- the forebody and the bulb: one smooth surface ----------
# The hull forward of X_ENT is the base section drawn in towards the stem (fine low down, full under the flare); the bulb is a round
# body of revolution-like sections. The two are joined by a smooth union of their signed half-breadths, so the bulb grows out of the
# forefoot with a fillet all round and the neck between it and the stem is a hollow curve, not a seam (Jonas 30.10.2026: "en båt er
# ikke en firkantig boks, den har former og kurver").
KF = 0.70                      # the fillet's size (m) in the smooth union
# the bulb: (x, half-breadth, half-height, centre height); its nose is half an ellipsoid from XB1 to XN
BULB = [(29.5, -0.40, 1.30, 2.05), (30.8, 0.55, 1.50, 2.05), (31.8, 1.02, 1.74, 2.05), (32.8, 1.28, 1.86, 2.05), (33.8, 1.38, 1.90, 2.05),
        (34.6, 1.40, 1.90, 2.07), (35.4, 1.38, 1.86, 2.10)]
XB1, XN = 35.4, 37.15
def bulb_at(x):
    """the bulb's half-breadth, half-height and centre at x (the half-breadth is negative where it has ended); forward of XB1 the nose
    is half an ellipsoid, a little blunter in plan than in profile"""
    if x <= XB1: return interp(BULB, x), interp([(b[0], b[2]) for b in BULB], x), interp([(b[0], b[3]) for b in BULB], x)
    ry0, rz0, zc0 = BULB[-1][1:]; t = (x - XB1) / (XN - XB1)
    if t >= 1: return -(x - XN) * 1.5, rz0 * 0.05, zc0 + 0.25
    f = math.sqrt(1 - t * t); return ry0 * f ** 0.85, rz0 * f, zc0 + 0.25 * t * t

def smax(a, b, k=KF):
    h = np.maximum(k - np.abs(a - b), 0.0) / k
    return np.maximum(a, b) + h * h * k / 4

_T = {}
def _tables():
    if _T: return _T
    sec = section_body(X_ENT, 600); _T['bz'] = np.array([p[1] for p in sec]); _T['by'] = np.array([p[0] for p in sec])
    zz = np.linspace(-1.0, 10.5, 1151); _T['zz'] = zz
    _T['xs'] = np.array([x_stem(z) for z in zz]); _T['pw'] = np.array([interp(PW, z) for z in zz])
    return _T

def hull_s(x, z):
    """the hull's own signed half-breadth at x for the heights z (an array): negative outside, without the bulb"""
    z = np.asarray(z, float)
    if x <= X_ENT:
        sec = section_body(x, 600); sz = np.array([p[1] for p in sec]); sy = np.array([p[0] for p in sec])
        y = np.interp(z, sz, sy); return np.where(z < sz[0], (z - sz[0]) * 3.0, y)
    T = _tables(); y0 = np.interp(z, T['bz'], T['by']); xs = np.interp(z, T['zz'], T['xs']); p = np.interp(z, T['zz'], T['pw'])
    s = (x - X_ENT) / (xs - X_ENT)
    y = np.where(s < 1, y0 * (1 - np.clip(s, 0, 1) ** p), -(x - xs) * 1.2)
    return np.where(z < 0, np.minimum(y, z * 3.0), y)

def bulb_s(x, z):
    z = np.asarray(z, float); ry, rz, zc = bulb_at(x); q = (z - zc) / rz
    if ry <= 0: return ry - np.abs(z - zc) * 0.5
    return np.where(np.abs(q) < 1, ry * np.sqrt(np.clip(1 - q * q, 0, 1)), -(np.abs(q) - 1) * rz)

def hb(x, z):
    """the signed half-breadth of the whole hull (the bulb joined on) at x for the heights z"""
    h = hull_s(x, z)
    return smax(h, bulb_s(x, z)) if x > BULB[0][0] else h

def hbz(x, z):
    """the hull's half-breadth at (x, z)"""
    return max(0.0, float(hb(x, np.array([z]))[0]))

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
    C['bin'] = mat('bin', (0.30, 0.30, 0.29), 0.12, zone=4)
    C['trim'] = mat('trim', (0.07, 0.24, 0.62), 0.5, zone=1)       # the blue bands on the superstructure and the masts
    C['steel'] = mat('steel', (0.62, 0.64, 0.66), 0.7, metal=0.7)
    C['galv'] = mat('galv', (0.70, 0.71, 0.70), 0.45, metal=0.6)
    C['dark'] = mat('dark', (0.10, 0.11, 0.12), 0.3)
    C['black'] = mat('black', (0.04, 0.04, 0.05), 0.35)
    C['rubber'] = mat('rubber', (0.05, 0.05, 0.055), 0.15)
    C['glass'] = mat('glass', (0.05, 0.11, 0.10), 0.95)
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
    return C['hull']


# ---------- the hull ----------
_SEC = {}
def _ys(x, z):
    """hb for a few heights, with the section at x kept (the bisections ask the same station many times)"""
    return hb(x, np.asarray(z, float))

def _cross(x, za, zb, up=True):
    """the height between za (outside) and zb (inside) where the hull's side meets the centreline"""
    lo, hi = za, zb
    for _ in range(36):
        m = (lo + hi) / 2
        if _ys(x, [m])[0] > 0: hi = m
        else: lo = m
    return hi

def pieces(x, sg=1):
    """the section at x from the bottom up, as polylines [(y, z)] starting and ending on the centreline (the top one ends at the
    side's top on side sg); forward of the neck there are two: the bulb, and the bow above it"""
    zt = z_bw(x, sg); z = np.append(np.arange(-0.6, zt, 0.004), zt); y = _ys(x, z); pos = y > 0; out = []; i = 0; n = len(z)
    while i < n:
        if not pos[i]: i += 1; continue
        j = i
        while j + 1 < n and pos[j + 1]: j += 1
        za = _cross(x, z[i - 1], z[i]) if i > 0 else z[0]
        zb = _cross(x, z[j + 1], z[j]) if j + 1 < n else None
        g = np.geomspace(1e-6, 0.03, 40); zz = [za + g]
        zz.append(z[i:j + 1])
        if zb is not None: zz.append(zb - g)
        zz = np.unique(np.concatenate(zz)); zz = zz[(zz > za) & (zz < (zb if zb is not None else zt + 1))]
        yy = np.maximum(_ys(x, zz), 0.0)
        poly = [(0.0, za)] + list(zip(yy.tolist(), zz.tolist()))
        if zb is not None: poly.append((0.0, zb))
        out.append(poly); i = j + 1
    return out

def split_at(poly, z):
    """a section polyline cut at height z: (below, above), sharing the cut point"""
    for k in range(1, len(poly)):
        if poly[k][1] >= z:
            a, b = poly[k - 1], poly[k]; t = (z - a[1]) / max(1e-12, b[1] - a[1]); c = (a[0] + (b[0] - a[0]) * t, z)
            return poly[:k] + [c], [c] + poly[k:]
    return poly, [poly[-1]]

N_LO, N_BW = 40, 8             # points from the keel to the split, and up the side over the shelter deck
N_A, N_S, N_B = 22, 3, 18      # from the split to the stripe, across it, from it to the shelter deck
N_UP = N_A + N_S + N_B
_F = [1.0]
def lo_pts(poly): return resample(poly, [(None, int(N_LO * _F[0]))])
def up_pts(poly, x):
    z0 = poly[0][1]; c = lambda z: max(z0, z)
    return resample(poly, [(c(st_bot(x)), int(N_A * _F[0])), (c(st_top(x)), N_S), (c(z_sh(x)), int(N_B * _F[0])), (None, int(N_BW * _F[0]))])

_NECK = []
def neck():
    """where the bulb parts from the stem (the first station with two pieces) and the height of the neck there"""
    if _NECK: return _NECK[0]
    lo, hi = 33.0, XN - 0.05
    for _ in range(30):
        m = (lo + hi) / 2
        if len(pieces(m)) > 1: hi = m
        else: lo = m
    p = pieces(hi); zp = (p[0][-1][1] + p[1][0][1]) / 2
    _NECK.append((lo, hi, zp)); return lo, hi, zp

def hull_rows(fine=True, sg=1):
    """the hull's rows (stations) for side sg: the main body from the transom to the neck, the bulb's nose and the bow above it"""
    x0, x1, zp = neck(); _F[0] = 1.0 if fine else 0.5
    st = [XA + 0.04 * i for i in range(5)] + [0.25 * i for i in range(1, 24)] + [6.0 + 0.4 * i for i in range(56)] + [28.4 + 0.2 * i for i in range(60)]
    st += list(ST_X) + [5.0 + 0.15 * i for i in range(17)] + [25.4 + 0.15 * i for i in range(10)]
    if not fine: st = [XA, 0.2, 0.6, 1.2, 2.0, 3.0, 4.0, 5.0, 6.5, 8.0, 10.0] + [12.0 + 2.0 * i for i in range(8)] + [28.0 + 1.0 * i for i in range(8)]
    st = sorted(set(round(x, 4) for x in st if x < x0 - 0.05)) + [x0]
    main = []
    for x in st:
        p = pieces(x, sg)[0]; zs = z_sh(x)
        lo, up = split_at(p, max(zp, p[0][1] + 0.25) if x < x0 else min(p, key=lambda q: q[0] if abs(q[1] - zp) < 0.6 else 9)[1])
        main.append((x, lo_pts(lo), up_pts(up, x)))
    nb, nu = (22, 30) if fine else (5, 6)
    bulb, bow = [main[-1][1]], [main[-1][2]]
    for k in range(1, nb):
        t = k / nb; x = x1 + (XN - x1) * (1 - (1 - t) ** 1.8); bulb.append(lo_pts(pieces(x, sg)[0]))
    _, _, zc = bulb_at(XN - 1e-3); bulb.append([(0.0, zc)] * (int(N_LO * _F[0]) + 1))
    xe = XF
    for k in range(1, nu):
        t = k / nu; x = x1 + (xe - x1) * (1 - (1 - t) ** 1.8); P = pieces(x, sg); bow.append(up_pts(P[-1], x))
    bow.append([(0.0, z_bw(xe))] * (len(bow[-1])))
    xb = [x1 + (XN - x1) * (1 - (1 - k / nb) ** 1.8) for k in range(nb)] + [XN]
    xu = [x1 + (xe - x1) * (1 - (1 - k / nu) ** 1.8) for k in range(nu)] + [xe]
    xb[0] = xu[0] = x0
    return ([[(x, y, z) for y, z in lo + up[1:]] for x, lo, up in main],
            [[(x, y, z) for y, z in r] for x, r in zip(xb, bulb)], [[(x, y, z) for y, z in r] for x, r in zip(xu, bow)])

def hull_mat(c):
    if c.z > z_sh(c.x) + 0.01: return C['white']
    if ST_X[0] <= c.x <= ST_X[1] and st_bot(c.x) - 0.01 < c.z < st_top(c.x) + 0.01: return C['stripe']
    if c.z < BAND[0]: return C['af']
    if c.z < BAND[1]: return C['stripe']
    return C['hull']

def build_hull(fine=True):
    """the hull's outside as one mesh, both sides and the transom, cut along the paint lines"""
    bm = bmesh.new()
    for sg in (1, -1):
        grids = hull_rows(fine, sg)
        for G in grids:
            vs = [[bm.verts.new((x, sg * y, z)) for x, y, z in r] for r in G]
            for i in range(len(G) - 1):
                for j in range(len(G[0]) - 1):
                    q = [vs[i][j], vs[i + 1][j], vs[i + 1][j + 1], vs[i][j + 1]]
                    if sg > 0: q.reverse()
                    u = []
                    for v in q:
                        if not u or (v.co - u[-1].co).length > 1e-6: u.append(v)
                    if len(u) > 2 and (u[0].co - u[-1].co).length < 1e-6: u.pop()
                    if len(u) < 3 or max(abs(v.co.y) for v in u) < 1e-4: continue
                    try: bm.faces.new(u)
                    except ValueError: pass
        r0 = grids[0][0]
        if sg > 0: port = r0
    # the transom: flat, across between the two sides' first stations
    vp = [bm.verts.new((x, y, z)) for x, y, z in port]; vq = [bm.verts.new((x, -y, z)) for x, y, z in port]
    for j in range(len(port) - 1):
        f = None
        u = [vp[j], vp[j + 1], vq[j + 1], vq[j]]
        if (u[0].co - u[3].co).length < 1e-6: u = u[:3]
        try: f = bm.faces.new(u)
        except ValueError: pass
        if f:
            f.normal_update()
            if f.normal.x > 0: f.normal_flip()
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=2e-4)
    for zb in BAND:
        g = list(bm.verts) + list(bm.edges) + list(bm.faces)
        bmesh.ops.bisect_plane(bm, geom=g, dist=1e-5, plane_co=(0, 0, zb), plane_no=(0, 0, 1))
    mats = []; mi = {}
    for f in bm.faces:
        m = hull_mat(f.calc_center_median())
        if m.name not in mi: mi[m.name] = len(mats); mats.append(m)
        f.material_index = mi[m.name]
    return [shade(obj_from_bm('hull', bm, mats), 50)]


def bulb(fine=True): return []      # the bulb is part of the hull's surface (build_hull)


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
    # (a symmetric foil, 18 % thick, its leading edge forward towards the propeller, the bottom rounded off)
    LE, TE = AP + 0.80, AP - 1.10; ch = LE - TE
    def foil(z, sc=1.0, n=20):
        us = [0.5 * (1 - math.cos(math.pi * k / n)) for k in range(n + 1)]
        yt = lambda u: 5 * 0.18 * ch * sc * (0.2969 * math.sqrt(u) - 0.1260 * u - 0.3516 * u * u + 0.2843 * u ** 3 - 0.1036 * u ** 4)
        c0 = LE - ch * (1 - sc) * 0.5
        return [(c0 - ch * sc * u, yt(u), z) for u in us] + [(c0 - ch * sc * u, -yt(u), z) for u in reversed(us[1:-1])]
    zr = [3.35, 3.0, 2.0, 1.0, 0.45, 0.25, 0.14, 0.10]; sr = [1.0, 1.0, 1.0, 1.0, 0.99, 0.95, 0.85, 0.6]
    objs.append(loft_rings('rudder', [foil(z, k) for z, k in zip(zr, sr)], C['af'], angle=60))
    wr = lambda x: 0.145
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
            tunnel_on_hull(U, 6.2, 2.35, 0.61, sg)
            tunnel_on_hull(U, 34.0, 1.75, 0.61, sg)
            # the sea chests' grilles low on the side amidships
            for x in (15.5, 17.0):
                p, n, tt = surf(x, 1.1, sg, off=0.004); r_, u_, nn = F._onb(n, (0, 0, 1))
                for k in range(6):
                    q = p + r_ * (-0.45 + 0.18 * k); U.poly([q - u_ * 0.25, q + r_ * 0.07 - u_ * 0.25, q + r_ * 0.07 + u_ * 0.25, q + u_ * 0.25], C['dark'], n)
        # the two sonars' trunks under the forward body (a lowered dome shows as a short round trunk with a flush cover)
        for x in (27.5, 29.0): objs.append(cyl('sonar%d' % int(x), (x, 0, 0.0), (x, 0, -0.06), 0.42, C['dark'], 16))
    objs.append(U.done(30))
    return objs


def tunnel_on_hull(A, xc, zc, r, sg, nb=5):
    """a thruster tunnel's mouth where the athwartship tube meets the curved hull (the bulb): the dark opening, its rim and the bolted
    grid, every point laid on the surface along the tunnel's axis so it follows the curve instead of cutting into it"""
    on = lambda x, z, off: V((x, sg * (hbz(x, z) + off), z))
    ring = [(xc + r * math.cos(2 * math.pi * k / 32), zc + r * math.sin(2 * math.pi * k / 32)) for k in range(32)]
    for k in range(32):
        a, b = ring[k], ring[(k + 1) % 32]
        for i in range(3):
            f0, f1 = i / 3, (i + 1) / 3
            P = [on(xc + (q[0] - xc) * f, zc + (q[1] - zc) * f, 0.006) for q, f in ((a, f0), (b, f0), (b, f1), (a, f1))]
            if i == 0: A.poly([P[0], P[2], P[3]], C['black'], (0, sg, 0))
            else: A.poly(P, C['black'], (0, sg, 0))
    for k in range(32):
        a, b = ring[k], ring[(k + 1) % 32]; acyl(A, on(a[0], a[1], 0.02), on(b[0], b[1], 0.02), 0.035, lambda z: C['af'], seg=6)
    bw = 0.025
    for i in range(1, nb + 1):
        dx = -r + 2 * r * i / (nb + 1); h = math.sqrt(r * r - dx * dx); zs = [zc - h + 2 * h * k / 8 for k in range(9)]
        for z0, z1 in zip(zs, zs[1:]): acyl(A, on(xc + dx, z0, 0.04), on(xc + dx, z1, 0.04), bw, lambda z: C['af'], seg=5)
    for i in range(1, nb):
        dz = -r + 2 * r * i / nb; h = math.sqrt(r * r - dz * dz); xs = [xc - h + 2 * h * k / 8 for k in range(9)]
        for x0, x1 in zip(xs, xs[1:]): acyl(A, on(x0, zc + dz, 0.065), on(x1, zc + dz, 0.065), bw * 0.8, lambda z: C['af'], seg=5)


# ---------- on the hull's side: the stripe's dashes, the anchor pockets, the openings, the windows, the steps (the side photograph) ----------
def on_hull(x, z, sg, off): return V((x, sg * (hbz(x, z) + off), z))

def hull_patch(A, outline, sg, m, off=0.004, rings=3):
    """a flat mark laid on the hull's side: the outline [(x, z)] (convex, counter-clockwise seen from port) filled from its middle in
    rings, every point put on the surface so it follows the curve"""
    cx = sum(p[0] for p in outline) / len(outline); cz = sum(p[1] for p in outline) / len(outline)
    dense = []
    for k in range(len(outline)):
        a, b = outline[k], outline[(k + 1) % len(outline)]; m_ = max(1, int(math.hypot(b[0] - a[0], b[1] - a[1]) / 0.08))
        dense += [(a[0] + (b[0] - a[0]) * t / m_, a[1] + (b[1] - a[1]) * t / m_) for t in range(m_)]
    outline = dense; n = len(outline); rings = max(rings, 3)
    for k in range(n):
        a, b = outline[k], outline[(k + 1) % n]
        for i in range(rings):
            f0, f1 = i / rings, (i + 1) / rings
            P = [on_hull(cx + (q[0] - cx) * f, cz + (q[1] - cz) * f, sg, off) for q, f in ((a, f0), (b, f0), (b, f1), (a, f1))]
            if i == 0: A.poly([P[0], P[2], P[3]], m, (0, sg, 0))
            else: A.poly(P, m, (0, sg, 0))

def hull_frame(A, outline, sg, m, w=0.04, h=0.02):
    """a raised rim round an opening on the hull (its edge plate), the outline's points pushed out a little and up off the surface"""
    n = len(outline); cx = sum(p[0] for p in outline) / n; cz = sum(p[1] for p in outline) / n
    for k in range(n):
        a, b = outline[k], outline[(k + 1) % n]
        da = V((a[0] - cx, 0, a[1] - cz)).normalized(); db = V((b[0] - cx, 0, b[1] - cz)).normalized()
        ia, ib = on_hull(a[0], a[1], sg, 0.005), on_hull(b[0], b[1], sg, 0.005)
        oa, ob = on_hull(a[0] + da.x * w, a[1] + da.z * w, sg, 0.005), on_hull(b[0] + db.x * w, b[1] + db.z * w, sg, 0.005)
        ta, tb = on_hull(a[0], a[1], sg, h), on_hull(b[0], b[1], sg, h)
        A.poly([ia, ib, tb, ta], m, (0, sg, 0)); A.poly([ta, tb, ob, oa], m, (0, sg, 0))

def opening(A, x0, x1, z0, z1, sg, r, m_in, m_rim=None, rim=0.04):
    o = [(p[0], p[1]) for p in rrect((x0 + x1) / 2, (z0 + z1) / 2, x1 - x0, z1 - z0, r, n=4)]
    hull_patch(A, o, sg, m_in, off=0.003)
    if m_rim is not None: hull_frame(A, o, sg, m_rim, w=rim)

# Every opening in the side is a real hole (Jonas 30.10.2026: "få med alle åpninger i skrog og rekke der de skal være, ikke bare bruk
# svarte teksturer"): the hull and the bulwark's inside are cut by a prism through the outline, a reveal lines the cut, and an
# opening into a closed space gets a box behind it (its depth, its back) so it shows depth and catches light; one through a bulwark
# shows the deck behind it. Each: (side, x0, x1, z0, z1, corner radius, kind, depth); kind 'thru' (a bulwark), 'box' (into a space),
# 'glass' (a window: a shallow box with the glass at its back), 'louvre' (a box with its blades), 'pocket' (the anchor's)
def holes():
    H = []
    for sg in (1, -1):
        H.append((sg, 30.60, 32.20, 7.40, 7.94, 0.10, 'pocket', 0.55))
        H.append((sg, 34.33, 34.67, 8.70, 8.90, 0.09, 'thru', 0.0)); H.append((sg, 37.90, 38.10, 8.62, 8.82, 0.09, 'thru', 0.0))
        for k in range(5):
            xc = 4.15 - 0.45 * k; H.append((sg, xc - 0.07, xc + 0.07, 4.62, 5.18, 0.03, 'box', 0.12))
    # port: the closed side of the shelter deck
    H.append((1, 25.90, 27.20, 7.55, 8.46, 0.25, 'box', 1.0)); H.append((1, 24.73, 25.65, 8.07, 8.60, 0.08, 'box', 0.4))
    for x0, x1 in ((26.15, 27.10), (23.87, 24.84), (22.84, 23.70), (21.33, 22.14), (20.40, 21.16), (18.57, 19.33), (19.38, 20.14), (16.80, 17.60)):
        H.append((1, x0, x1, 5.76, 6.05, 0.06, 'louvre', 0.25))
    H.append((1, 15.0, 15.5, 5.72, 6.02, 0.15, 'box', 0.2))
    z = 8.38
    while z > 4.85: H.append((1, 22.50, 22.92, z - 0.05, z + 0.05, 0.02, 'box', 0.12)); z -= 0.38
    for x0, x1, z0, z1 in ((13.03, 13.46, 7.17, 7.87), (13.92, 14.36, 7.17, 7.87), (9.35, 9.78, 7.30, 8.00), (10.04, 10.47, 7.30, 8.00), (4.69, 5.12, 7.40, 8.12)):
        H.append((1, x0, x1, z0, z1, 0.08, 'glass', 0.08))
    H.append((1, 6.65, 7.65, 7.22, 8.33, 0.06, 'box', 1.2)); H.append((1, 6.55, 7.36, 5.80, 6.00, 0.03, 'box', 0.15))
    # the recessed steps under the side door aft, from the door down to the waterline, on both sides (47d6785c, 1000a4bd)
    for sg in (1, -1):
        z = 7.0
        while z > 4.85: H.append((sg, 7.3, 7.72, z - 0.05, z + 0.05, 0.02, 'box', 0.12)); z -= 0.38
    # (no side door on the starboard side aft: the working deck is open there, a5d2b0af)
    for k in range(8):
        xc = 3.45 - 0.433 * k; H.append((1, xc - 0.13, xc + 0.13, 8.80, 9.07, 0.06, 'thru', 0.0))
    # starboard: the louvres under the working deck (the photographs from starboard show more of them, further aft; the places
    # aft of 16 m are read off 274df4a7 without a scale and are estimates), the steps down from the working deck at 8.6 m, the big
    # opening in the forecastle's side over the working deck's fore end
    for x0, x1 in ((26.15, 27.10), (23.87, 24.84), (22.84, 23.70), (21.33, 22.14), (20.40, 21.16), (18.57, 19.33), (19.38, 20.14), (16.80, 17.60),
                   (13.00, 13.70), (11.20, 11.90), (9.90, 10.60), (8.60, 9.30)):
        H.append((-1, x0, x1, 5.76, 6.05, 0.06, 'louvre', 0.25))
    z = z_sh(24.2) - 0.25
    while z > 4.85: H.append((-1, 24.0, 24.42, z - 0.05, z + 0.05, 0.02, 'box', 0.12)); z -= 0.38
    H.append((-1, 27.05, 28.45, 7.65, 8.60, 0.30, 'box', 1.0))
    return H

def hole_outline(h):
    sg, x0, x1, z0, z1, r = h[:6]
    o = rrect((x0 + x1) / 2, (z0 + z1) / 2, x1 - x0, z1 - z0, max(0.005, min(r, (x1 - x0) / 2 - 0.002, (z1 - z0) / 2 - 0.002)), n=5)
    dense = []
    for k in range(len(o)):
        a, b = o[k], o[(k + 1) % len(o)]; m_ = max(1, int(math.hypot(b[0] - a[0], b[1] - a[1]) / 0.14))
        dense += [(a[0] + (b[0] - a[0]) * t / m_, a[1] + (b[1] - a[1]) * t / m_) for t in range(m_)]
    return dense

def cutter(H, through):
    """one closed prism per hole along the side's normal (y), from outside the hull to inside it (past the bulwark for 'thru')"""
    bm = bmesh.new()
    for h in H:
        sg = h[0]; o = hole_outline(h); d = 0.25 if (through and h[6] == 'thru') else 0.04
        if through and h[6] != 'thru': continue
        out = [bm.verts.new((x, sg * (hbz(x, z) + 0.3), z)) for x, z in o]; inn = [bm.verts.new((x, sg * (hbz(x, z) - d), z)) for x, z in o]
        n = len(o)
        for k in range(n):
            j = (k + 1) % n; bm.faces.new([out[k], out[j], inn[j], inn[k]])
        bm.faces.new(out); bm.faces.new(list(reversed(inn)))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new('cut'); bm.to_mesh(me); bm.free()
    if 'cutmat' not in bpy.data.materials: bpy.data.materials.new('cutmat')
    me.materials.append(bpy.data.materials['cutmat'])
    return link(bpy.data.objects.new('cut', me))

def apply_cut(target, cut):
    """cut the holes; the solver closes each one with the cutter's faces as if the open hull were a solid, so those (they carry the
    cutter's own material) are taken out again and the hole stays open"""
    m = target.modifiers.new('cut', 'BOOLEAN'); m.operation = 'DIFFERENCE'; m.solver = 'EXACT'; m.object = cut; m.material_mode = 'TRANSFER'
    try: m.use_hole_tolerant = True
    except AttributeError: pass
    dg = bpy.context.evaluated_depsgraph_get(); ev = target.evaluated_get(dg)
    me = bpy.data.meshes.new_from_object(ev); target.modifiers.clear(); old = target.data; target.data = me; bpy.data.meshes.remove(old)
    ci = [i for i, mt in enumerate(me.materials) if mt and mt.name.startswith('cutmat')]
    bm = bmesh.new(); bm.from_mesh(me)
    bmesh.ops.delete(bm, geom=[f for f in bm.faces if f.material_index in ci], context='FACES')
    bm.to_mesh(me); bm.free()
    for i in reversed(ci): me.materials.pop(index=i)

def hull_side(fine=True):
    A = Acc('side'); W = C['white']
    for sg in (1, -1):
        # the broad stripe's dashes, slanted forward at the top
        for xa, xb in ST_DASH:
            sl = 0.10 if xa > 20 else -0.10
            pts = [(xa, st_bot(xa)), (xb, st_bot(xb)), (xb + sl, st_top(xb + sl)), (xa + sl, st_top(xa + sl))]
            if fine: hull_patch(A, pts, sg, C['stripe'], rings=2)
            else: A.poly([on_hull(x, z, sg, 0.004) for x, z in pts][::sg], C['stripe'], (0, sg, 0))
        if fine:
            # the hull's marks (the photograph on the slip 226293a9 and the stern 274df4a7): the draft scales on the bow close to the
            # stem and on the stern quarter, the thruster rings over both tunnels, the two V marks and the bulb mark forward
            along = lambda tt: -sg * tt
            F.draft_scale(A, lambda z: (lambda p, n, tt: (p, n, along(tt)))(*surf(x_stem(z) - 0.55, z, sg, off=0.004)), 2.6, 5.2, C['mark'])
            F.draft_scale(A, lambda z: (lambda p, n, tt: (p, n, along(tt)))(*surf(1.6, z, sg, off=0.004)), 2.6, 5.2, C['mark'])
            p, n, tt = surf(33.4, 4.62, sg, off=0.004); F.thruster_symbol(A, p, n, (0, 0, 1), 0.28, C['mark'])
            p, n, tt = surf(6.2, 4.62, sg, off=0.004); F.thruster_symbol(A, p, n, (0, 0, 1), 0.28, C['mark'])
            for x in (31.6, 30.6):
                p, n, tt = surf(x, 4.62, sg, off=0.004); F.vee(A, p, n, (0, 0, 1), 0.36, C['mark'])
            p, n, tt = surf(29.8, 4.62, sg, off=0.004); F.bulb_symbol(A, p, n, (0, 0, 1), 0.5, C['mark'], fwd=sg)
            # the anchor's crown bolster under the pocket (a raised blue lip)
            o = rrect(31.5, 6.91, 2.29, 0.42, 0.21, n=5); hull_frame(A, o, sg, C['hull'], w=0.02, h=0.09)
    if not fine: return [A.done(30)]
    for h in holes():
        sg, x0, x1, z0, z1, r, kind, d = h; o = hole_outline(h); n = len(o)
        P = lambda x, z, dd: V((x, sg * (hbz(x, z) - dd), z))
        # the reveal: the plate's edge for a bulwark (0.08 m to its inside), the box's sides for the rest
        dep = 0.08 if kind == 'thru' else d
        wall = W if (kind == 'thru' or z1 > z_sh(x0) + 0.02) else (C['hull'] if kind != 'glass' else W)
        inner = C['inner'] if kind in ('box', 'pocket') else wall
        for k in range(n):
            a, b = o[k], o[(k + 1) % n]
            if kind in ('thru', 'glass'):
                A.poly([P(a[0], a[1], 0.0), P(b[0], b[1], 0.0), P(b[0], b[1], dep), P(a[0], a[1], dep)], wall, (0, 0, 0)); continue
            # the plate's edge, then the dark space behind it
            A.poly([P(a[0], a[1], 0.0), P(b[0], b[1], 0.0), P(b[0], b[1], 0.03), P(a[0], a[1], 0.03)], wall, (0, 0, 0))
            A.poly([P(a[0], a[1], 0.03), P(b[0], b[1], 0.03), P(b[0], b[1], dep), P(a[0], a[1], dep)], C['dark'] if kind != 'pocket' else C['inner'], (0, 0, 0))
        if kind == 'thru': continue
        # the back of the box: dark in an opening into a space, the glass in a window, the pocket's grey steel behind the anchor
        back = {'box': C['dark'], 'louvre': C['black'], 'glass': C['glass'], 'pocket': C['steel']}[kind]
        A.poly([P(x, z, dep) for x, z in o], back, (0, -sg, 0))
        if kind == 'louvre':
            # the louvre: blades across the opening sloping down outwards, held by two dividers
            for t in range(4):
                zz = z0 + 0.05 + (z1 - z0 - 0.10) * t / 3
                beam(A, P(x0 + 0.02, zz, 0.09), P(x1 - 0.02, zz, 0.09), 0.01, 0.10, C['hull'], up=(0, -sg * 0.7, 0.7))
            for k in range(1, 3):
                xx = x0 + (x1 - x0) * k / 3
                abox(A, xx - 0.012, xx + 0.012, *sorted((sg * (hbz(xx, z0) - 0.16), sg * (hbz(xx, z0) - 0.03))), z0, z1, C['hull'])
        if kind == 'glass':
            # the window's frame (a white rim proud of the side) and its glass a little in
            hull_frame(A, o, sg, W, w=0.05, h=0.02)
        if kind == 'pocket':
            # the anchor in its pocket: the crown and flukes near the mouth, the shank running in and up to the hawse pipe
            cx, cz = (x0 + x1) / 2, (z0 + z1) / 2
            abox(A, cx - 0.55, cx + 0.55, *sorted((sg * (hbz(cx, cz) - 0.12), sg * (hbz(cx, cz) - 0.32))), cz - 0.2, cz + 0.12, C['dark'])
            beam(A, P(cx, cz, 0.25), P(cx + 0.25, cz + 0.2, 0.5), 0.14, 0.14, C['dark'])
    return [A.done(30)]


# ---------- the funnel: on the port side aft, flush with the side, tapering up to its blue cap and the exhaust ----------
def funnel(fine=True):
    A = Acc('funnel'); W = C['white']
    zb = 9.85; zt = 12.14; y0, y1 = 2.9, hbz(5.2, 9.5)
    # (the photograph at the quay 47d6785c: the funnel is a trapezoid seen from the side, 2.9 m at its foot on the bin's wall and
    # 1.45 m under the blue cap, its fore face sloping more than its aft)
    xa0, xa1, xt0, xt1 = 3.75, 6.65, 4.45, 5.90
    ring = lambda zz, t: [(xa0 + (xt0 - xa0) * t, y0 + 0.05 * t), (xa1 + (xt1 - xa1) * t, y0 + 0.05 * t), (xa1 + (xt1 - xa1) * t, y1 - 0.25 * t), (xa0 + (xt0 - xa0) * t, y1 - 0.25 * t)]
    lo, hi = ring(zb, 0), ring(zt, 1)
    for i in range(4):
        a, b, c, d = lo[i], lo[(i + 1) % 4], hi[(i + 1) % 4], hi[i]
        A.poly([(a[0], a[1], zb - 0.6), (b[0], b[1], zb - 0.6), (c[0], c[1], zt), (d[0], d[1], zt)], W, ((b[1] - a[1]), -(b[0] - a[0]), 0))
    # the blue cap, a little proud, and its top
    cap = [(p[0] + (0.06 if p[0] > 5 else -0.06), p[1] + (0.06 if p[1] > 3.5 else -0.06)) for p in hi]
    for i in range(4):
        a, b = cap[i], cap[(i + 1) % 4]
        A.poly([(a[0], a[1], zt), (b[0], b[1], zt), (b[0], b[1], 12.45), (a[0], a[1], 12.45)], C['trim'], ((b[1] - a[1]), -(b[0] - a[0]), 0))
    A.poly([(x, y, 12.45) for x, y in cap], C['trim'], (0, 0, 1))
    if fine:
        # the exhausts: two bare steel pipes out of the cap, each rising 1.3 m and bending aft in a swan neck (47d6785c, 82e91969)
        for yy, h in ((y0 + 0.5, 13.75), (y1 - 0.55, 13.55)):
            P = [(5.25, yy, 12.45), (5.25, yy, h - 0.45), (5.12, yy, h - 0.18), (4.88, yy, h - 0.02), (4.62, yy, h)]
            for a_, b_ in zip(P, P[1:]): acyl(A, a_, b_, 0.19, lambda z: C['steel'], seg=14)
            acyl(A, P[-1], (4.45, yy, h), 0.2, lambda z: C['black'], seg=14)
    return [A.done(30)]


# ---------- the decks and the bulwarks' inside ----------
# The shelter deck (6.6 m at midships) is closed in along the whole length forward of the net bin; the upper deck over it runs from the
# net bin's fore wall at 6.42 m to the stem nearly level (the side photograph: its rail's top stays at 9.78 m from 8 m to the bow,
# while the side's top rises forward into a low bulwark round the forecastle)
X_BIN = 6.42
ZD = [(X_BIN, 8.66), (10.0, 8.60), (12.0, 8.52), (15.0, 8.42), (17.0, 8.47), (19.0, 8.53), (21.0, 8.59), (23.0, 8.65), (25.0, 8.68), (30.0, 8.70), (XF, 8.72)]
RAIL_TOP = 9.78
def z_dk(x): return interp(ZD, x)

X_FC = 26.0                    # the forecastle's aft bulkhead over the starboard working deck
def camber(y, x): return 0.12 * (1 - min(1.0, (y / max(0.5, hbz(x, z_dk(x)))) ** 2))

def side_wall(A, xs, sg, z_lo, z_hi, inset=0.07):
    """the inside of the side where it stands over a deck: from z_lo(x) up to z_hi(x), and its cap"""
    for x0, x1 in zip(xs, xs[1:]):
        la, lb, ta, tb = z_lo(x0), z_lo(x1), z_hi(x0), z_hi(x1)
        if ta - la < 0.03 and tb - lb < 0.03: continue
        ta, tb = max(ta, la), max(tb, lb)
        ya, yb = max(0.0, hbz(x0, ta) - inset), max(0.0, hbz(x1, tb) - inset); ia, ib = max(0.0, hbz(x0, la) - inset), max(0.0, hbz(x1, lb) - inset)
        A.poly([(x0, sg * ia, la), (x1, sg * ib, lb), (x1, sg * yb, tb), (x0, sg * ya, ta)], C['inner'], (0, -sg, 0))
        A.poly([(x0, sg * ya, ta), (x1, sg * yb, tb), (x1, sg * hbz(x1, tb), tb + 0.004), (x0, sg * hbz(x0, ta), ta + 0.004)], C['white'], (0, 0, 1))

def pipe_rail(A, P, top, m, every=1.0, rails=3, r=0.024):
    """stanchions from the points P up to the height top(x), and rails between them"""
    P = [V(p) for p in P]
    for q in P: acyl(A, q, V((q.x, q.y, top(q.x))), r, lambda z: m, seg=6)
    for a, b in zip(P, P[1:]):
        for k in range(rails):
            f = k / rails; ha = top(a.x) - (top(a.x) - a.z) * f; hb_ = top(b.x) - (top(b.x) - b.z) * f
            acyl(A, V((a.x, a.y, ha)), V((b.x, b.y, hb_)), (r + 0.006) if k == 0 else r - 0.004, lambda z: m, seg=6, cap=False)

def decks(fine=True):
    A = Acc('decks'); W = C['white']
    # ---- the net bin: its floor on the shelter deck, the high wall's inside and cap, the transom's inside ----
    xs = ([0.1 + 0.25 * i for i in range(26)] if fine else [0.1, 0.6, 1.5, 3.0, 4.5]) + [X_BIN]
    for x0, x1 in zip(xs, xs[1:]):
        y0, y1 = hbz(x0, z_sh(x0) + 0.02) - 0.05, hbz(x1, z_sh(x1) + 0.02) - 0.05; za, zb_ = z_sh(x0), z_sh(x1)
        A.poly([(x0, -y0, za), (x1, -y1, zb_), (x1, y1, zb_), (x0, y0, za)], C['bin'], (0, 0, 1))
    for sg in (1, -1): side_wall(A, xs, sg, z_sh, lambda x, sg=sg: z_bw(x, sg), inset=0.08)
    y = hbz(0.1, 8.0) - 0.08
    A.poly([(0.1, -y, z_sh(0.1)), (0.1, y, z_sh(0.1)), (0.1, y, z_bw(0.1)), (0.1, -y, z_bw(0.1))], C['inner'], (1, 0, 0))
    # the bin's fore wall: the casing's aft end to port, the working deck's aft end to starboard
    y = hbz(X_BIN, 7.5) - 0.06
    A.poly([(X_BIN, -y, z_sh(X_BIN)), (X_BIN, y, z_sh(X_BIN)), (X_BIN, y, z_dk(X_BIN)), (X_BIN, -y, z_dk(X_BIN))], W, (-1, 0, 0))
    # ---- the upper deck: over the casing to port of Y_C aft of the forecastle, the whole breadth on the forecastle ----
    dx = 0.4 if fine else 1.6
    xs = [X_BIN + dx * i for i in range(int((XF - X_BIN) / dx) + 1)] + [X_FC, X_WD[0]]
    xs = sorted(x for x in set(round(v, 4) for v in xs) if hbz(x, z_dk(x)) > 0.3); xs.append(xs[-1] + 0.25)
    for x0, x1 in zip(xs, xs[1:]):
        e0, e1 = hbz(x0, z_dk(x0)) - 0.02, max(0.0, hbz(x1, z_dk(x1)) - 0.02)
        if X_BIN - 1e-6 <= x0 and x1 <= X_FC + 1e-6: lo0, lo1 = y_c(x0), y_c(x1)
        else: lo0, lo1 = -e0, -e1
        for k in range(4):
            f0, f1 = k / 4, (k + 1) / 4
            P = lambda x, e, lo, f: (x, lo + (e - lo) * f, z_dk(x) + camber(lo + (e - lo) * f, x))
            A.poly([P(x0, e0, lo0, f0), P(x0, e0, lo0, f1), P(x1, e1, lo1, f1), P(x1, e1, lo1, f0)], C['deck'], (0, 0, 1))
    # the casing's starboard wall down to the working deck, the working deck itself, the forecastle's aft bulkhead over it
    xw = [X_BIN + dx * i for i in range(int((X_FC - X_BIN) / dx) + 1)] + [X_FC, HX1]
    xw = sorted(set(round(v, 4) for v in xw))
    for x0, x1 in zip(xw, xw[1:]):
        yc0, yc1 = y_c(x0), y_c(min(x1, HX1 - 1e-6) if x0 < HX1 else x1)
        # (under the house the wall ends just below the house's own wall, so the two never lie in one plane)
        t0 = z_dk(x0) - 0.11 if HX0 - 0.9 < x0 < HX1 else z_dk(x0) + camber(yc0, x0); t1 = z_dk(x1) - 0.11 if HX0 - 0.9 < x1 <= HX1 else z_dk(x1) + camber(yc1, x1)
        A.poly([(x0, yc0, z_sh(x0)), (x1, yc1, z_sh(x1)), (x1, yc1, t1), (x0, yc0, t0)], W, (0, -1, 0))
        e0, e1 = hbz(x0, z_sh(x0) + 0.02) - 0.05, hbz(x1, z_sh(x1) + 0.02) - 0.05
        A.poly([(x0, -e0, z_sh(x0)), (x1, -e1, z_sh(x1)), (x1, yc1, z_sh(x1)), (x0, yc0, z_sh(x0))], C['deck'], (0, 0, 1))
    e = hbz(X_FC, z_dk(X_FC)) - 0.02
    A.poly([(X_FC, -e, z_sh(X_FC)), (X_FC, Y_C, z_sh(X_FC)), (X_FC, Y_C, z_dk(X_FC) + camber(Y_C, X_FC)), (X_FC, -e, z_dk(X_FC))], W, (-1, 0, 0))
    # the step in the casing at the house's front: the wall across from the house's starboard side in to the casing's wall
    A.poly([(HX1, -HY, z_sh(HX1)), (HX1, Y_C, z_sh(HX1)), (HX1, Y_C, z_dk(HX1) + camber(Y_C, HX1)), (HX1, -HY, z_dk(HX1) + camber(-HY, HX1))], W, (1, 0, 0))
    # the side's inside: over the working deck where it rises at its ends, round the forecastle on both sides
    xf = [X_FC + dx * i for i in range(int((XF - X_FC) / dx) + 1)]; xf = [x for x in xf if hbz(x, z_dk(x)) > 0.3]
    for sg in (1, -1): side_wall(A, xf, sg, z_dk, lambda x, sg=sg: z_bw(x, sg))
    side_wall(A, [X_WD[0] + (0.1 if fine else 0.5) * i for i in range(int((X_FC - X_WD[0]) / (0.1 if fine else 0.5)) + 1)], -1, z_sh, lambda x: z_bw(x, -1))
    if fine:
        # the rails: to port along the side's top from the bin to the stem, to starboard round the forecastle, the blue pipe rail
        # along the working deck's edge, white rails on the casing's edge and across the casing's and the forecastle's aft ends
        top = lambda x: RAIL_TOP
        xs = [x for x in [X_BIN + 0.1 + 0.7 * i for i in range(48)] if x < XF - 0.15] + [XF - 0.12]
        pipe_rail(A, [(x, hbz(x, z_bw(x)) - 0.04, z_bw(x)) for x in xs], top, W)
        xs = [x for x in [26.6 + 0.7 * i for i in range(18)] if x < XF - 0.15] + [XF - 0.12]
        pipe_rail(A, [(x, -(hbz(x, z_bw(x, -1)) - 0.04), z_bw(x, -1)) for x in xs], top, W)
        xs = [X_WD[0] + (X_WD[1] - X_WD[0]) * i / 18 for i in range(19)]
        pipe_rail(A, [(x, -(hbz(x, z_bw(x, -1)) - 0.04), z_bw(x, -1)) for x in xs], lambda x: z_sh(x) + 1.1, C['trim'], rails=2)
        # the rail on the casing's edge: along the box aft of the house, and along the casing forward of it, with the cross piece at the step
        xs = [X_BIN + 0.1 + (HX0 - 0.2 - X_BIN) * i / 6 for i in range(7)]
        pipe_rail(A, [(x, -HY + 0.05, z_dk(x) + camber(-HY, x)) for x in xs], lambda x: z_dk(x) + 1.05, W)
        xs = [HX1 + 0.1 + (X_FC - 0.2 - HX1) * i / 6 for i in range(7)]
        pipe_rail(A, [(x, Y_C + 0.05, z_dk(x) + camber(Y_C, x)) for x in xs] + [(HX1 + 0.1, Y_C + 0.05, z_dk(HX1) + camber(Y_C, HX1))][:0], lambda x: z_dk(x) + 1.05, W)
        pipe_rail(A, [(HX1 + 0.08, Y_C + 0.05, z_dk(HX1) + camber(Y_C, HX1)), (HX1 + 0.08, (Y_C - HY) / 2, z_dk(HX1) + camber((Y_C - HY) / 2, HX1)), (HX1 + 0.08, -HY + 0.3, z_dk(HX1) + camber(-HY, HX1))], lambda x: z_dk(x) + 1.05, W)
        y = hbz(X_BIN, z_dk(X_BIN)) - 0.05
        pipe_rail(A, [(X_BIN + 0.05, -y, z_dk(X_BIN)), (X_BIN + 0.05, -y / 2, z_dk(X_BIN)), (X_BIN + 0.05, 0.0, z_dk(X_BIN)), (X_BIN + 0.05, y / 2, z_dk(X_BIN)), (X_BIN + 0.05, y, z_dk(X_BIN))], top, W)
        e = hbz(X_FC, z_dk(X_FC)) - 0.1
        pipe_rail(A, [(X_FC + 0.05, -e, z_dk(X_FC)), (X_FC + 0.05, (Y_C - e) / 2, z_dk(X_FC)), (X_FC + 0.05, Y_C, z_dk(X_FC))], lambda x: z_dk(x) + 1.05, W)
    return [A.done(30)]


# ---------- the superstructure ----------
# Measured on the side photograph 42432bd5 (kap. 4.3): the house on the upper deck 11.73-20.35 m up to deck B; deck B a platform round
# the wheelhouse at 11.05 m with its rail (front edge 21.22, aft 10.28 m); the wheelhouse's glass from the sill at 11.95 m to the head at
# 13.18 m, leaning out at the top on every side (0.30 m over the front, 0.36 m aft, read off the end posts); the roof's blue edge band
# 13.26-13.42 m standing 0.64 m out over the front, 0.3 m elsewhere; the roof slopes up 0.6 m inwards to the flat top at 14.02 m with
# its rail (Jonas 30.10.2026: "taket over vinduene som skrår innover"); the door on the port side between 11.58 and 12.18 m
ZB2 = 11.05                    # deck B: the platform round the wheelhouse and its floor
WX0, WX1, WY = 11.21, 20.80, 3.90   # the wheelhouse at the sill: aft, forward (on the centreline), half-width
WS, WH, WF, WR = 11.95, 13.18, 13.26, 13.42   # the sill, the head, the fascia's top (the blue band's foot), the roof's edge
ZR = 14.02                     # the roof's flat top (the compass deck)
# the wheelhouse's side posts aft of the front's corners (bottoms read off the photograph); the door's pane
W_POSTS = [11.63, 12.13, 12.98, 13.94, 14.90, 16.07, 17.14, 18.24]
W_DOOR = (11.58, 12.18)

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

def wall_window(A, G, x0, x1, z0, z1, y, sg, r=0.08, frame=0.05):
    """a window in a flat side wall at y (sg the side): the glass a little in, a white frame round it, rounded corners"""
    cx, cz = (x0 + x1) / 2, (z0 + z1) / 2
    o = rrect(cx, cz, x1 - x0 + 2 * frame, z1 - z0 + 2 * frame, r + frame, n=3); i = rrect(cx, cz, x1 - x0, z1 - z0, r, n=3)
    for k in range(len(o)):
        a, b, c, d = o[k], o[(k + 1) % len(o)], i[(k + 1) % len(i)], i[k]
        A.poly([(a[0], y + sg * 0.03, a[1]), (b[0], y + sg * 0.03, b[1]), (c[0], y + sg * 0.03, c[1]), (d[0], y + sg * 0.03, d[1])], C['white'], (0, sg, 0))
        A.poly([(d[0], y + sg * 0.03, d[1]), (c[0], y + sg * 0.03, c[1]), (c[0], y + sg * 0.012, c[1]), (d[0], y + sg * 0.012, d[1])], C['inner'], (0, 0, 0))
    A.poly([(p[0], y + sg * 0.011, p[1]) for p in i][::sg], C['dark'], (0, sg, 0))
    G.poly([(p[0], y + sg * 0.012, p[1]) for p in i][::sg], C['glass'], (0, sg, 0))

def superstructure(fine=True):
    A = Acc('house'); G = Acc('glass'); w = C['white']
    zd = z_dk(HX0)
    # ---- the house on the upper deck, its corners rounded, the blue line round it at 9.88-10.0 m ----
    hp = rrect((HX0 + HX1) / 2, 0.0, HX1 - HX0, 2 * HY, 0.85, n=6)
    prism(A, hp, zd - 0.1, ZB2 - 0.2, w, top=False)
    # (the casing's wall aft of the house, at the house's side down to the working deck, is drawn by decks(); a second coplanar
    # face here shadowed it black in the renders, 30.10.2026)
    hn = plan_normals(hp)
    for i in range(len(hp)):
        a, b = hp[i], hp[(i + 1) % len(hp)]; na, nb = hn[i], hn[(i + 1) % len(hp)]
        A.poly([(a[0] + na[0] * 0.006, a[1] + na[1] * 0.006, 9.88), (b[0] + nb[0] * 0.006, b[1] + nb[1] * 0.006, 9.88),
                (b[0] + nb[0] * 0.006, b[1] + nb[1] * 0.006, 10.0), (a[0] + na[0] * 0.006, a[1] + na[1] * 0.006, 10.0)], C['trim'], (b[1] - a[1], -(b[0] - a[0]), 0))
    if fine:
        for sg in (1, -1):
            for x0, x1 in ((16.78, 17.10), (16.24, 16.56), (15.19, 15.46), (14.65, 14.96)):
                wall_window(A, G, x0, x1, 9.72, 10.50, sg * HY, sg)
            door(A, 13.30, 14.10, sg * HY, zd if sg > 0 else z_sh(13.7), face=sg)
        for yy in (-1.6, -0.55, 0.55, 1.6):
            P = rrect(yy, 10.11, 0.5, 0.78, 0.08, n=3)
            G.poly([(HX1 + 0.01, p[0], p[1]) for p in P][::-1], C['glass'], (1, 0, 0))
        door_x(A, HX0, 1.6, zd, face=-1)
        for x0, x1 in ((13.03, 13.46), (13.92, 14.36), (9.35, 9.78), (10.04, 10.47)): wall_window(A, G, x0, x1, 7.17, 7.87, -HY, -1)
        door(A, 8.8, 9.6, -HY, z_sh(9.2), face=-1)
    # ---- deck B: the platform round the wheelhouse, its edge plate (the name board's place on the front), its rail ----
    pp, plw = wh_plan(10.28, 21.22, 4.45, n=10, a=2.1, e=3.2)
    # the cut-out round the net chute on the starboard side (5f57d449): the edge steps inboard to y -3.0 between 10.35 and 13.9 m
    pp = [pp[0]] + [(10.35, -4.45), (10.35, -3.0), (13.9, -3.0), (13.9, -4.45)] + pp[1:]; plw = [plw[0]] + [0.0] * 4 + plw[1:]
    pn = plan_normals(pp)
    prism(A, offset_plan(pp, pn, lambda i: -0.05), ZB2 - 0.2, ZB2, C['deck'])
    for i in range(len(pp)):
        a, b = pp[i], pp[(i + 1) % len(pp)]; nr = (b[1] - a[1], -(b[0] - a[0]), 0)
        A.poly([(a[0], a[1], ZB2 - 0.32), (b[0], b[1], ZB2 - 0.32), (b[0], b[1], ZB2 + 0.30), (a[0], a[1], ZB2 + 0.30)], w, nr)
        ia = (a[0] - pn[i][0] * 0.04, a[1] - pn[i][1] * 0.04); ib = (b[0] - pn[(i + 1) % len(pp)][0] * 0.04, b[1] - pn[(i + 1) % len(pp)][1] * 0.04)
        A.poly([(ia[0], ia[1], ZB2 + 0.30), (ib[0], ib[1], ZB2 + 0.30), (ib[0], ib[1], ZB2), (ia[0], ia[1], ZB2)], C['inner'], (-nr[0], -nr[1], 0))
        A.poly([(a[0], a[1], ZB2 + 0.30), (b[0], b[1], ZB2 + 0.30), (ib[0], ib[1], ZB2 + 0.30), (ia[0], ia[1], ZB2 + 0.30)], w, (0, 0, 1))
    if fine:
        # the rail on the platform's edge, open at its aft end over the ladders (the posts every 0.9 m, a top and a middle rail)
        # (the rail stops at the cut-out's inboard corner; the walkway's rail takes over round the chute)
        ri = [(p[0] - n[0] * 0.03, p[1] - n[1] * 0.03, ZB2 + 0.30) for p, n in zip(pp, pn)][2:]
        rail(A, ri, h=12.05 - (ZB2 + 0.30), every=0.9)
    # ---- the starboard walkway aft of the wheelhouse (7b36cbe5, 3bd16b40): deck B carried aft to 8.3 m over the upper deck, on two
    #      stanchions, with its edge plate and rail; the lower balcony on the house's top under it ----
    # (a U round the chute's cut-out: the strip along the side, the strip inboard, the cross strip aft)
    WK = [(8.3, -4.35), (10.35, -4.35), (10.35, -0.9), (8.3, -0.9)]
    prism(A, [(x + (0.05 if x < 9 else -0.05), y + (0.05 if y < -2 else -0.05)) for x, y in WK], ZB2 - 0.2, ZB2, C['deck'])
    for i in range(len(WK)):
        a, b = WK[i], WK[(i + 1) % len(WK)]
        if a[0] == 10.35 and b[0] == 10.35: continue
        A.poly([(a[0], a[1], ZB2 - 0.32), (b[0], b[1], ZB2 - 0.32), (b[0], b[1], ZB2 + 0.30), (a[0], a[1], ZB2 + 0.30)], w, (b[1] - a[1], -(b[0] - a[0]), 0))
    for yy in (-4.1, -1.15): acyl(A, (8.55, yy, z_dk(8.55) + 0.1), (8.55, yy, ZB2 - 0.2), 0.06, lambda z: w, seg=8)
    if fine:
        # the walkway's rail wraps the chute's inboard side: out along the side to 9.45 m, in to the cut-out, forward to the platform
        rail(A, [(10.3, -0.93, ZB2 + 0.30), (8.33, -0.93, ZB2 + 0.30), (8.33, -4.32, ZB2 + 0.30), (9.45, -4.32, ZB2 + 0.30), (9.45, -3.03, ZB2 + 0.30), (10.35, -3.03, ZB2 + 0.30)], h=12.05 - (ZB2 + 0.30), every=0.9)
        abox(A, 8.6, HX0 + 0.05, -3.3, -1.3, ZB2 - 0.95, ZB2 - 0.85, w)
        rail(A, [(HX0, -1.33, ZB2 - 0.85), (8.63, -1.33, ZB2 - 0.85), (8.63, -3.27, ZB2 - 0.85), (HX0, -3.27, ZB2 - 0.85)], h=0.95, every=0.8, r=0.02)
    # ---- the wheelhouse ----
    oc, lw = wh_plan(WX0, WX1, WY)
    nrm_at = plan_normals(oc)
    LF, LS, LA = 0.30, 0.25, 0.36
    def lout(i):
        p = oc[i]
        if p[0] <= WX0 + 1e-6: return LA
        return LF * lw[i] + LS * (1 - lw[i])
    def lean(p, z):
        i = oc.index(p) if p in oc else None
        if i is None or z <= WS: return (p[0], p[1], z)
        d = lout(i) * (min(z, WH) - WS) / (WH - WS); n = nrm_at[i]; return (p[0] + n[0] * d, p[1] + n[1] * d, z)
    for i in range(len(oc)):
        a, b = oc[i], oc[(i + 1) % len(oc)]; nr = (b[1] - a[1], -(b[0] - a[0]), 0)
        A.poly([lean(a, ZB2), lean(b, ZB2), lean(b, WS), lean(a, WS)], w, nr)
        A.poly([lean(a, WH), lean(b, WH), lean(b, WF), lean(a, WF)], w, nr)
        # the posts: at every corner, and along the long sides where the photograph has them
        q0, q1 = lean(a, WS), lean(b, WS); r0, r1 = lean(a, WH), lean(b, WH)
        at = lambda t: ([q0[c] + (q1[c] - q0[c]) * t for c in range(3)], [r0[c] + (r1[c] - r0[c]) * t for c in range(3)])
        ts = [0.0]
        side = abs(a[1] - b[1]) < 1e-6 and abs(abs(a[1]) - WY) < 1e-6
        if side:
            for xp in W_POSTS:
                t = (xp - a[0]) / (b[0] - a[0])
                if 0 < t < 1: ts.append(t)
        if not side:
            # the aft wall and the front's facets: posts between the windows about every 1.3 m (Jonas 30.10.2026)
            Lg = math.hypot(b[0] - a[0], b[1] - a[1]); k = int(Lg / 1.3 + 0.5)
            ts += [j / k for j in range(1, k)]
        ts = sorted(ts) + [1.0]
        door_here = side and a[1] > 0
        for t0, t1 in zip(ts, ts[1:]):
            (s0, h0), (s1, h1) = at(t0), at(t1)
            xm = (s0[0] + s1[0]) / 2
            if door_here and W_DOOR[0] < xm < W_DOOR[1]:
                A.poly([s0, s1, h1, h0], w, nr)
                continue
            G.poly([s0, s1, h1, h0], C['glass'], nr)
        for t in (ts[:-1] if fine else ts[:1]):
            s0, h0 = at(t); beam(A, s0, h0, 0.11, 0.10, w)
        beam(A, lean(a, WS), lean(b, WS), 0.12, 0.10, w); beam(A, lean(a, WH), lean(b, WH), 0.12, 0.10, w)
    if fine:
        # the port door: its leaf over the whole height, a small window high in it, the dogs
        x0, x1 = W_DOOR; y = WY
        abox(A, x0 + 0.03, x1 - 0.03, y + 0.01, y + 0.05, ZB2 + 0.05, WH - 0.03, w)
        abox(A, x0 + 0.18, x1 - 0.18, y + 0.05, y + 0.055, 12.55, 12.95, C['glass'])
        for zz in (11.6, 12.1, 12.6): abox(A, x0 + 0.06, x0 + 0.13, y + 0.05, y + 0.09, zz - 0.03, zz + 0.03, C['steel'])
    io = [(x + n[0] * -0.25, y + n[1] * -0.25) for (x, y), n in zip(oc, nrm_at)]
    if fine: lining(A, oc, io, ZB2, WS, WH, WF, lambda p, z, i: lean(p, z), C['dark'], lambda i: True)
    # ---- the roof: the soffit out to the edge, the blue band, the slope up inwards, the flat top, its rail ----
    head = [lean(p, WH)[:2] for p in oc]
    ro = offset_plan(head, nrm_at, lambda i: 0.64 if oc[i][0] > WX0 + 1e-6 and lw[i] > 0.5 else (0.28 if oc[i][0] <= WX0 + 1e-6 else 0.30 + 0.34 * lw[i]))
    rin = offset_plan(ro, nrm_at, lambda i: -(0.85 if lw[i] > 0.5 else 0.70))
    for i in range(len(ro)):
        j = (i + 1) % len(ro); a, b = ro[i], ro[j]; nr = (b[1] - a[1], -(b[0] - a[0]), 0)
        A.poly([(head[i][0], head[i][1], WF), (head[j][0], head[j][1], WF), (b[0], b[1], WF), (a[0], a[1], WF)], C['inner'], (0, 0, -1))
        A.poly([(a[0], a[1], WF), (b[0], b[1], WF), (b[0], b[1], WR), (a[0], a[1], WR)], C['trim'], nr)
        A.poly([(a[0], a[1], WR), (b[0], b[1], WR), (rin[j][0], rin[j][1], ZR), (rin[i][0], rin[i][1], ZR)], C['inner'], (nr[0], nr[1], 1.4))
    A.poly([(x, y, ZR) for x, y in rin], C['deck'], (0, 0, 1))
    if fine: rail(A, [(x - n[0] * 0.3, y - n[1] * 0.3, ZR) for (x, y), n in zip(rin, nrm_at)] + [(rin[0][0] - nrm_at[0][0] * 0.3, rin[0][1] - nrm_at[0][1] * 0.3, ZR)], h=0.98, every=1.0)
    # ---- the call sign boards on the roof's slope, port and starboard (the game writes the player's on them) ----
    for sg in (1, -1):
        y = sg * (WY + 0.22); x0, x1, z0, z1 = 11.85, 14.69, 13.88, 14.98
        abox(A, x0, x1, min(y, y + sg * 0.05), max(y, y + sg * 0.05), z0, z1, w)
        for x in (12.3, 14.2): acyl(A, (x, y - sg * 0.04, 13.6), (x, y - sg * 0.04, z0 + 0.1), 0.035, lambda z: C['steel'], seg=6)
    # ---- the sidelights on the roof's slope: a black screen forward of each lamp, red to port, green to starboard ----
    for sg, m in ((1, C['lampR']), (-1, C['lampG'])):
        y = sg * (WY + 0.36)
        abox(A, 14.62, 15.43, min(y, y - sg * 0.24), max(y, y - sg * 0.24), 13.66, 13.94, C['black'])
        acyl(A, (14.5, y - sg * 0.1, 13.70), (14.5, y - sg * 0.1, 13.90), 0.09, lambda z: m, seg=12)
    return [A.done(30)], [G.done(30)]

def wh_plan(x0, x1, y, n=8, a=1.75, e=3.2):
    """a wheelhouse-like plan, counter-clockwise from the aft starboard corner: straight sides and a broad front of n facets, nearly
    flat across the middle and turned round at the corners (a superellipse); with each corner's weight on the front (1 at its middle,
    0 on the sides and aft)"""
    pts = [(x0, -y)]; lw = [0.0]
    for k in range(n + 1):
        ph = -math.pi / 2 + math.pi * k / n; c, s_ = math.cos(ph), math.sin(ph)
        pts.append((x1 - a + a * abs(c) ** (2 / e), y * math.copysign(abs(s_) ** (2 / e), s_))); lw.append(abs(c) ** 0.8)
    pts.append((x0, y)); lw.append(0.0)
    return pts, lw

def plan_normals(P):
    """the outward normal at each corner of a counter-clockwise plan polygon (the mean of its two sides')"""
    out = []
    for i in range(len(P)):
        a, b, c = P[i - 1], P[i], P[(i + 1) % len(P)]
        n1 = (b[1] - a[1], -(b[0] - a[0])); n2 = (c[1] - b[1], -(c[0] - b[0]))
        l1 = math.hypot(*n1) or 1; l2 = math.hypot(*n2) or 1; n = (n1[0] / l1 + n2[0] / l2, n1[1] / l1 + n2[1] / l2); l = math.hypot(*n) or 1
        out.append((n[0] / l, n[1] / l))
    return out

def offset_plan(P, N, d):
    return [(p[0] + n[0] * d(i), p[1] + n[1] * d(i)) for i, (p, n) in enumerate(zip(P, N))]

def prism(A, P, z0, z1, m, top=True):
    """an upright prism on a counter-clockwise plan polygon"""
    for i in range(len(P)):
        a, b = P[i], P[(i + 1) % len(P)]; A.poly([(a[0], a[1], z0), (b[0], b[1], z0), (b[0], b[1], z1), (a[0], a[1], z1)], m, (b[1] - a[1], -(b[0] - a[0]), 0))
    if top: A.poly([(x, y, z1) for x, y in P], m, (0, 0, 1))
    A.poly([(x, y, z0) for x, y in P], m, (0, 0, -1))

def door_x(A, x, yc, z0, face=1, w=0.8):
    """a door in a wall across the boat at x, centred at yc"""
    f = face; m = C['white']
    abox(A, min(x, x + f * 0.05), max(x, x + f * 0.05), yc - w / 2 - 0.06, yc + w / 2 + 0.06, z0, z0 + 2.07, C['inner'])
    abox(A, min(x + f * 0.05, x + f * 0.09), max(x + f * 0.05, x + f * 0.09), yc - w / 2, yc + w / 2, z0 + 0.12, z0 + 1.98, m)
    abox(A, min(x + f * 0.09, x + f * 0.095), max(x + f * 0.09, x + f * 0.095), yc - 0.14, yc + 0.14, z0 + 1.25, z0 + 1.65, C['glass'])
    for zz in (z0 + 0.55, z0 + 1.0, z0 + 1.5): abox(A, min(x + f * 0.09, x + f * 0.13), max(x + f * 0.09, x + f * 0.13), yc + w / 2 - 0.12, yc + w / 2 - 0.04, zz - 0.03, zz + 0.03, C['steel'])

def door_y(A, x0, x1, y, z0, face):
    door(A, x0, x1, y, z0, face=face)


# ---------- masts, radars, domes, lights and antennas (the side photograph; the athwartship places are the centreline unless said) ----------
def aring_loft(A, rings, m, cap0=False, cap1=True):
    """closed rings of equal length joined by quads (into an Acc), outward by the ring's centre"""
    vs = [[A.v(V(p)) for p in r] for r in rings]; n = len(rings[0])
    for i in range(len(rings) - 1):
        c = sum((v.co for v in vs[i]), V((0, 0, 0))) / n
        for k in range(n):
            j = (k + 1) % n; A.f([vs[i][k], vs[i][j], vs[i + 1][j], vs[i + 1][k]], m, (vs[i][k].co + vs[i][j].co) / 2 - c)
    if cap0: A.f(list(reversed(vs[0])), m, (0, 0, -1))
    if cap1: A.f(list(vs[-1]), m, (0, 0, 1))

def ell(cx, cy, z, rx, ry, n=16): return [(cx + rx * math.cos(2 * math.pi * k / n), cy + ry * math.sin(2 * math.pi * k / n), z) for k in range(n)]

def dome(A, c, r, h, m, base=None, fine=True):
    """a radome: a short cylinder of height h under a hemisphere of radius r, on its base plate"""
    n = 20 if fine else 10; kk = 7 if fine else 4
    c = V(c); rings = [ell(c.x, c.y, c.z, r, r, n), ell(c.x, c.y, c.z + h, r, r, n)]
    for k in range(1, kk):
        a = math.pi / 2 * k / kk; rings.append(ell(c.x, c.y, c.z + h + r * math.sin(a), r * math.cos(a), r * math.cos(a), n))
    aring_loft(A, rings, m, cap0=True)
    acyl(A, c + V((0, 0, -0.04)), c, r * 0.75, lambda z: base or C['steel'], seg=16)

def platform(A, x0, x1, hw, z, m_edge, rail_h=0.35, fine=True):
    """a small mast platform: the blue edge band under it, its grating and a low rail round it"""
    abox(A, x0, x1, -hw, hw, z - 0.22, z, m_edge)
    abox(A, x0 + 0.02, x1 - 0.02, -hw + 0.02, hw - 0.02, z, z + 0.01, C['deck'])
    if fine and rail_h:
        rail(A, [(x0, -hw, z), (x1, -hw, z), (x1, hw, z), (x0, hw, z), (x0, -hw, z)], h=rail_h, every=0.6, r=0.02, mid=False)

def lamp(A, c, m, r=0.09, h=0.22):
    c = V(c); acyl(A, c, c + V((0, 0, h)), r, lambda z: m, seg=10); acyl(A, c + V((0, 0, h)), c + V((0, 0, h + 0.03)), r * 1.1, lambda z: C['black'], seg=10)

def searchlight(A, c, r, aim=(1, 0, 0)):
    """a searchlight: the pedestal, the drum, the glass forward"""
    c = V(c); d = V(aim).normalized()
    acyl(A, c + V((0, 0, -r - 0.35)), c + V((0, 0, -r - 0.05)), 0.07, lambda z: C['white'], seg=8)
    acyl(A, c - d * r * 0.7, c + d * r * 0.5, r, lambda z: C['white'], seg=18)
    acyl(A, c + d * r * 0.5, c + d * r * 0.55, r * 0.9, lambda z: C['lens'], seg=18)

def masts(fine=True):
    A = Acc('masts'); W = C['white']; T = C['trim']
    # -- the forward mast on the forecastle: its fore edge raked aft, its aft edge near upright, tapering from 1.24 m to 0.4 m --
    rings = []
    for z, xf, xa, hy in ((8.70, 31.38, 30.14, 0.42), (11.0, 31.08, 30.10, 0.38), (13.3, 30.70, 30.02, 0.32), (15.33, 30.30, 29.90, 0.24)):
        rings.append(ell((xf + xa) / 2, 0.0, z, (xf - xa) / 2, hy, 16))
    aring_loft(A, rings, W)
    acyl(A, (30.1, 0, 15.33), (29.97, 0, 17.45), 0.11, lambda z: W, seg=10, r1=0.08)
    platform(A, 29.50, 31.70, 0.85, 13.52, T, fine=fine)
    platform(A, 29.46, 30.80, 0.55, 15.33, T, rail_h=0.27, fine=fine)
    abox(A, 29.50, 30.14, -0.35, 0.35, 17.25, 17.45, T)
    lamp(A, (29.97, 0, 17.47), C['lampW'])                 # the masthead light
    if fine:
        searchlight(A, (31.05, 0.0, 14.45), 0.38)
        searchlight(A, (30.95, 0.3, 13.0), 0.16)            # the deck floodlight under the lower platform
        acyl(A, (29.72, 0, 14.77), (29.92, 0, 14.77), 0.12, lambda z: C['black'], seg=10)   # the horn on its aft face
        for z in [15.6 + 0.3 * k for k in range(6)]: acyl(A, (30.05, -0.12, z), (30.05, 0.12, z), 0.012, lambda z_: C['steel'], seg=4)
    # -- the radar mast on the wheelhouse's roof: the tapered tower to the upper platform, its column to the dome's platform, the
    #    ladder mast with the top lights, the second dome on its pole aft --
    # (95c900de: both towers are plate towers, flat-sided with chamfered corners, tapering up; a thin blue band under each platform)
    oct_ = lambda cx, cy, z, hx, hy, c=0.12: [(cx - hx + c, cy - hy, z), (cx + hx - c, cy - hy, z), (cx + hx, cy - hy + c, z), (cx + hx, cy + hy - c, z),
                                             (cx + hx - c, cy + hy, z), (cx - hx + c, cy + hy, z), (cx - hx, cy + hy - c, z), (cx - hx, cy - hy + c, z)]
    aring_loft(A, [oct_(12.7, 0, ZR, 1.05, 0.95), oct_(12.6, 0, 16.95, 0.55, 0.6)], W)
    platform(A, 11.90, 15.85, 1.30, 17.20, T, fine=fine)
    aring_loft(A, [oct_(13.85, 0, 17.2, 0.52, 0.48, 0.08), oct_(13.9, 0, 19.1, 0.32, 0.32, 0.06)], W)
    abox(A, 12.88, 14.47, -0.75, 0.75, 19.10, 19.30, T)
    dome(A, (14.30, 0, 19.30), 0.66, 0.55, W, fine=fine)
    for x in (14.05, 12.33):
        for yy in (-0.25, 0.25): acyl(A, (x, yy, 17.2), (x, yy, 22.12), 0.05, lambda z: W, seg=8)
    for z in (21.2, 21.7, 22.1):
        for yy in (-0.25, 0.25): beam(A, (14.05, yy, z), (12.33, yy, z), 0.06, 0.06, W)
    if fine:
        for z in [17.5 + 0.3 * k for k in range(16)]: acyl(A, (14.05, -0.25, z), (14.05, 0.25, z), 0.015, lambda z_: W, seg=4)
        beam(A, (14.6, 0, 21.2), (13.5, 0, 21.2), 0.1, 0.08, W); acyl(A, (14.6, 0, 21.24), (14.6, 0, 21.36), 0.09, lambda z: W, seg=10)
    for x in (14.05, 12.5): lamp(A, (x, 0, 22.12), C['lampR'])
    lamp(A, (13.5, 0, 22.0), C['lampW'], r=0.07)
    acyl(A, (11.48, 0, ZR), (11.48, 0, 19.8), 0.10, lambda z: W, seg=10)
    dome(A, (11.50, 0, 19.80), 0.76, 0.55, W, fine=fine)
    acyl(A, (12.13, 0.4, 17.2), (12.13, 0.4, 18.8), 0.04, lambda z: W, seg=6); dome(A, (12.13, 0.4, 18.8), 0.16, 0.08, W)
    # the radars: the long scanner low on the compass deck, the short one on the upper platform
    abox(A, 15.75, 16.65, -0.35, 0.35, ZR, 15.75, W); abox(A, 15.9, 16.5, -0.25, 0.25, 15.75, 15.92, C['dark'])
    abox(A, 14.00, 18.40, -0.14, 0.14, 15.92, 16.20, W)
    abox(A, 14.75, 15.50, -0.30, 0.30, 17.20, 17.95, W); abox(A, 14.30, 15.90, -0.12, 0.12, 17.98, 18.20, W)
    # the whips, the searchlights and the horn on the compass deck
    acyl(A, (17.1, -1.2, ZR), (17.1, -1.2, 24.2), 0.03, lambda z: W, seg=6, r1=0.012)
    acyl(A, (16.06, 1.2, ZR), (15.85, 1.2, 24.7), 0.03, lambda z: W, seg=6, r1=0.012)
    acyl(A, (13.0, 0, 21.7), (13.0, 0, 23.4), 0.015, lambda z: W, seg=5, r1=0.008)
    if fine:
        searchlight(A, (19.45, 0.9, 15.15), 0.24); searchlight(A, (19.45, -0.9, 15.15), 0.24)
        acyl(A, (18.55, 0, ZR), (18.55, 0, 14.75), 0.08, lambda z: W, seg=8); dome(A, (18.55, 0, 14.75), 0.2, 0.2, W)
    return [A.done(30)]


# ---------- on deck: the forecastle house and its windlass, the cranes, the fish pump's tank, the rescue boat ----------
def deck_gear(fine=True):
    A = Acc('gear'); W = C['white']; objs = []
    zd = z_dk
    # the forecastle house (its aft face sloping), the windlass under its tarpaulin forward of the mast, the rope winch by the mast
    xs0, xs1, hy = 25.9, 31.4, 3.0
    aring_loft(A, [[(xs0, -hy, zd(xs0)), (xs1, -hy * 0.95, zd(xs1)), (xs1, hy * 0.95, zd(xs1)), (xs0, hy, zd(xs0))],
                   [(xs0 + 0.6, -hy, 10.1), (xs1, -hy * 0.95, 10.1), (xs1, hy * 0.95, 10.1), (xs0 + 0.6, hy, 10.1)]], W)
    if fine: rail(A, [(xs0 + 0.7, -hy + 0.1, 10.1), (xs0 + 0.7, hy - 0.1, 10.1)], h=0.9, every=0.8)
    # the blue tarpaulin over the anchor windlass (fore.png: 33.2-34.9 m, up to 10.6 m, rounded over the top)
    zt = zd(33.3) + 0.12
    aring_loft(A, [[(33.2, -1.1, zt), (34.9, -1.1, zt), (34.9, 1.1, zt), (33.2, 1.1, zt)], [(33.25, -1.08, zt + 1.0), (34.85, -1.08, zt + 1.0), (34.85, 1.08, zt + 1.0), (33.25, 1.08, zt + 1.0)],
                   [(33.45, -0.85, zt + 1.3), (34.65, -0.85, zt + 1.3), (34.65, 0.85, zt + 1.3), (33.45, 0.85, zt + 1.3)], [(33.8, -0.4, zt + 1.42), (34.3, -0.4, zt + 1.42), (34.3, 0.4, zt + 1.42), (33.8, 0.4, zt + 1.42)]], C['tarp'], cap0=True)
    if fine:
        # the big rope reel at the forecastle's aft end to port (82e91969), the round hatch, the two warping winches on the working deck
        zf2 = zd(28.5) + 0.12
        for yy in (1.0, 2.7): abox(A, 27.9, 29.3, yy - 0.05, yy + 0.05, zf2, zf2 + 1.75, W)
        acyl(A, (28.6, 1.0, zf2 + 0.95), (28.6, 2.7, zf2 + 0.95), 0.78, lambda z: W, seg=20)
        acyl(A, (28.6, 1.1, zf2 + 0.95), (28.6, 2.6, zf2 + 0.95), 0.80, lambda z: C['bin'], seg=20)
        acyl(A, (30.2, -1.6, zd(30.2) + 0.1), (30.2, -1.6, zd(30.2) + 0.22), 0.45, lambda z: C['trim'], seg=18)
        for x, yy in ((23.6, -3.6), (22.2, -3.4)):
            abox(A, x - 0.35, x + 0.35, yy - 0.5, yy + 0.5, z_sh(x), z_sh(x) + 0.35, C['steel'])
            acyl(A, (x, yy - 0.45, z_sh(x) + 0.65), (x, yy + 0.45, z_sh(x) + 0.65), 0.32, lambda z: C['dark'], seg=14)
            acyl(A, (x, yy - 0.2, z_sh(x) + 0.65), (x, yy + 0.2, z_sh(x) + 0.65), 0.34, lambda z: C['green'], seg=14)
    abox(A, 31.45, 32.4, -0.9, 0.9, zd(32), 10.5, W); acyl(A, (31.9, -0.75, 9.9), (31.9, 0.75, 9.9), 0.45, lambda z: C['bin'], seg=14)
    # the fish pump's vacuum tank and its housing between the wheelhouse and the forecastle, the boxes on it, the yellow chest
    abox(A, 26.5, 28.8, -1.8, 1.8, 10.1, 10.8, C['dark'])
    abox(A, 21.3, 22.5, -4.15, -3.35, z_sh(21.9), z_sh(21.9) + 0.9, C['yellow'])
    # -- the forward crane (knuckle boom, folded on its rest along the port side): its pedestal at the forecastle's aft end, the
    #    main boom aft and up to the knuckle at 19.7 m, the jib folded down and aft beside the house to its rest; the cylinders --
    yc = -3.0
    acyl(A, (26.85, yc, zd(26.85)), (26.85, yc, 10.2), 0.34, lambda z: W, seg=14)
    abox(A, 26.45, 27.25, yc - 0.4, yc + 0.4, 10.15, 10.55, W)
    # (the knuckle stands forward of deck B's front at 21.6 m, outboard of the vacuum tanks; the jib folds aft and down under the
    # platform to the working deck's aft end)
    # (4929aa51: the boom rises aft to the knuckle just under the wheelhouse's sill at the ship's side, outboard of deck B; the jib
    # folds down and aft along the side to the working deck)
    beam(A, (26.85, yc, 10.5), (21.0, yc - 1.65, 11.9), 0.36, 0.32, W)
    beam(A, (21.0, yc - 1.65, 11.85), (18.6, yc - 1.65, 9.4), 0.30, 0.30, W)
    acyl(A, (26.2, yc - 0.3, 10.1), (23.3, yc - 1.1, 11.15), 0.07, lambda z: C['steel'], seg=8)
    acyl(A, (20.9, yc - 1.85, 11.4), (19.5, yc - 1.85, 10.0), 0.08, lambda z: C['steel'], seg=8)
    abox(A, 25.6, 26.1, yc - 0.4, yc - 0.381, 10.55, 10.75, C['yellow'])
    # -- the aft crane by the funnel: its column, the slewing head, the main boom forward over the deck, the link over it, the
    #    folded jib under it, the lift cylinder, the hanging arm with the yoke and the net hauler's wheel --
    xc, yc = 7.16, 3.2
    # (the photographs 8cdb9214 and 82e91969: a tapered box pedestal, 1.3 x 1.1 m at the deck to 0.8 m square under the head)
    R = lambda z, hx, hy: [(xc - hx, yc - hy, z), (xc + hx, yc - hy, z), (xc + hx, yc + hy, z), (xc - hx, yc + hy, z)]
    aring_loft(A, [R(zd(xc), 0.65, 0.55), R(10.9, 0.5, 0.45), R(16.7, 0.4, 0.4)], W, cap1=True)
    abox(A, 6.04, 7.78, yc - 0.45, yc + 0.45, 16.64, 18.13, W)
    beam(A, (7.66, yc, 17.62), (11.75, yc, 17.20), 0.40, 0.36, W)
    beam(A, (7.70, yc, 17.98), (11.2, yc, 17.65), 0.12, 0.10, W)
    abox(A, 11.3, 12.05, yc - 0.22, yc + 0.22, 16.75, 17.45, W)                  # the knuckle
    beam(A, (11.65, yc, 17.0), (5.2, yc, 14.45), 0.30, 0.26, W)                   # the jib, folded aft under the boom
    acyl(A, (9.9, yc - 0.3, 16.95), (7.75, yc - 0.3, 17.2), 0.08, lambda z: C['steel'], seg=8)   # the jib's cylinder
    acyl(A, (7.90, yc - 0.42, 10.8), (7.90, yc - 0.42, 13.6), 0.11, lambda z: C['steel'], seg=8, r1=0.09)   # the lift cylinder
    beam(A, (5.2, yc, 14.35), (9.7, -4.55, 14.95), 0.24, 0.30, W)                  # the swing arm from the jib's tip to over the chute
    if fine:
        # the power block: two spoked sheaves 1.6 m across either side of the hydraulic motor, a rubber-lined groove between
        bc = -4.55; bx = 9.7
        for yy, R in ((bc - 0.55, 0.80), (bc + 0.55, 0.72)): spoked_wheel(A, (bx, yy, 14.75), (0, 1, 0), R, 0.16, W)
        acyl(A, (bx, bc - 0.42, 14.75), (bx, bc + 0.42, 14.75), 0.34, lambda z: C['rubber'], seg=18)
        acyl(A, (bx, bc + 0.68, 14.75), (bx, bc + 0.95, 14.75), 0.18, lambda z: C['dark'], seg=12)
        abox(A, bx - 0.25, bx + 0.25, bc - 0.12, bc + 0.12, 14.75, 15.2, W)
        # the tarpaulin-covered box on the deck under the boom, the net chute's mouth just aft of the wheelhouse
        abox(A, 8.4, 10.2, 1.3, 2.9, zd(9.3), 12.17, C['tarp'])
    # -- the rescue boat (4.25 m) on its cradle aft at port, its davit, the tarpaulin-covered box by it, the rollers on the bin's wall --
    if fine:
        bx0, bx1, by, bz = 7.55, 11.6, 3.3, 9.55
        path = [(bx0, by + 0.62), (bx1 - 0.75, by + 0.62)] + [(bx1 - 0.75 + 0.62 * math.sin(math.pi * k / 8), by + 0.62 * math.cos(math.pi * k / 8)) for k in range(1, 8)] + [(bx1 - 0.75, by - 0.62), (bx0, by - 0.62)]
        objs.append(tube('rescueboat', [(x, y, bz + 0.25 * max(0.0, (x - (bx1 - 1.4)) / 1.4)) for x, y in path], 0.23, C['orange'], seg=12))
        A.poly([(bx0, by - 0.55, bz - 0.2), (bx1 - 0.8, by - 0.55, bz - 0.2), (bx1 - 0.3, by, bz - 0.05), (bx1 - 0.8, by + 0.55, bz - 0.2), (bx0, by + 0.55, bz - 0.2)], C['dark'], (0, 0, -1))
        abox(A, 9.0, 9.7, by - 0.3, by + 0.3, bz - 0.2, bz + 0.45, C['dark'])
        for x in (8.3, 10.6): abox(A, x - 0.1, x + 0.1, by - 0.7, by + 0.7, zd(x), bz - 0.18, C['steel'])
        acyl(A, (10.0, 4.2, zd(10.0)), (10.0, 4.2, 11.4), 0.13, lambda z: W, seg=10)
        beam(A, (10.0, 4.2, 11.35), (8.9, 3.6, 12.0), 0.16, 0.16, W)
        for x in (0.8, 2.0):
            for yy in (-3.4, 3.4): acyl(A, (x - 0.45, yy, 10.12), (x + 0.45, yy, 10.12), 0.22, lambda z: C['dark'], seg=12)
    objs.append(A.done(30))
    return objs


# ---------- the aft deck: the net bin's inside, the net chute, the power block, the vacuum tanks, the ladders and stairs ----------
# (the photographs 82e91969 from the air, 1000a4bd from the starboard quarter, 8cdb9214 from the port quarter, 274df4a7 the stern)
def spoked_wheel(A, c, ax, R, w, m, spokes=6, rim=0.06):
    """a sheave: the rim as a short wide cylinder, a hub and flat spokes"""
    c = V(c); ax = V(ax).normalized()
    acyl(A, c - ax * w / 2, c + ax * w / 2, R, lambda z: m, seg=28, r1=R)
    acyl(A, c - ax * (w / 2 + 0.03), c + ax * (w / 2 + 0.03), R * 0.28, lambda z: C['steel'], seg=12)
    s, u, _ = frame_of(ax)
    for k in range(spokes):
        a = 2 * math.pi * k / spokes; d = s * math.cos(a) + u * math.sin(a)
        beam(A, c + d * R * 0.25 + ax * (w / 2 + 0.02), c + d * R * 0.92 + ax * (w / 2 + 0.02), 0.07, 0.03, m, up=ax)
        beam(A, c + d * R * 0.25 - ax * (w / 2 + 0.02), c + d * R * 0.92 - ax * (w / 2 + 0.02), 0.07, 0.03, m, up=ax)

def ladder(A, p0, p1, w, m, step=0.3, out=(0, 1, 0)):
    """a vertical ladder from p0 up to p1, w wide, standing out from its wall along out"""
    p0 = V(p0); p1 = V(p1); o = V(out).normalized(); s = (p1 - p0).normalized().cross(o).normalized()
    for sg in (1, -1):
        acyl(A, p0 + s * sg * w / 2, p1 + s * sg * w / 2, 0.02, lambda z: m, seg=6)
    n = int((p1 - p0).length / step); L = (p1 - p0).length
    for k in range(1, n + 1):
        q = p0 + (p1 - p0) * (k * step / L); acyl(A, q - s * w / 2, q + s * w / 2, 0.014, lambda z: m, seg=5, cap=False)
    for t in (0.1, 0.9):
        q = p0 + (p1 - p0) * t
        for sg in (1, -1): acyl(A, q + s * sg * w / 2 - o * 0.15, q + s * sg * w / 2, 0.016, lambda z: m, seg=5)

def stair(A, x0, y0, z0, x1, z1, w, m, side=(0, 1, 0)):
    """an inclined stair from (x0, z0) up to (x1, z1), w wide across y from y0: the two stringers, the treads, a rail each side"""
    n = max(2, int(abs(z1 - z0) / 0.24)); s = V(side).normalized() * w
    a, b = V((x0, y0, z0)), V((x1, y0, z1))
    for e in (V((0, 0, 0)), s):
        beam(A, a + e, b + e, 0.04, 0.22, m)
    for k in range(1, n + 1):
        t = k / n; q = a + (b - a) * t
        beam(A, q, q + s, 0.25, 0.03, m)
    for e in (V((0, 0, 0)), s):
        for t in (0.0, 0.5, 1.0):
            q = a + (b - a) * t + e; acyl(A, q, q + V((0, 0, 0.95)), 0.02, lambda z: m, seg=6)
        acyl(A, a + e + V((0, 0, 0.95)), b + e + V((0, 0, 0.95)), 0.024, lambda z: m, seg=6, cap=False)

def aft_deck(fine=True):
    A = Acc('aftdeck'); W = C['white']; objs = []
    zs = z_sh
    # ---- the net bin: a divider down the middle, the forward well with its rail on top, the rollers on the aft wall, the buoys ----
    abox(A, 0.3, X_BIN - 0.05, -0.06, 0.06, zs(3.0), 8.9, W)
    abox(A, 2.9, 3.0, -hbz(2.95, 8.0) + 0.1, 0.0, zs(2.95), 8.6, W)
    if fine:
        rail(A, [(0.35, -0.08, 8.9), (X_BIN - 0.1, -0.08, 8.9)], h=0.9, every=0.75, r=0.02)
        rail(A, [(2.95, -hbz(2.95, 8.0) + 0.15, 8.6), (2.95, -0.1, 8.6)], h=0.9, every=0.75, r=0.02)
        # the buoys and the rope coils in the bin
        for c, r, m in (((1.2, 1.6, zs(1.2) + 0.55), 0.55, C['orange']), ((2.0, 2.5, zs(2.0) + 0.45), 0.45, C['orange']), ((4.2, 1.1, zs(4.2) + 0.4), 0.4, C['orange'])):
            objs.append(sphere('buoy%d' % int(c[0] * 10), c, r, m, seg=16, rings=10))
        for c, r, m in (((1.0, -2.2, zs(1.0)), 0.55, C['yellow']), ((2.2, -2.4, zs(2.2)), 0.5, C['green']), ((4.0, -1.4, zs(4.0)), 0.45, C['yellow'])):
            acyl(A, c, (c[0], c[1], c[2] + 0.35), r, lambda z: m, seg=16)
        # the two rollers on the transom wall's top aft, their frames
        for yy in (-2.3, 2.3):
            acyl(A, (0.25, yy - 0.5, z_bw(0.2) + 0.25), (0.25, yy + 0.5, z_bw(0.2) + 0.25), 0.22, lambda z: C['dark'], seg=12)
            for e in (-0.55, 0.55): abox(A, 0.1, 0.4, yy + e - 0.04, yy + e + 0.04, z_bw(0.2), z_bw(0.2) + 0.3, C['steel'])
        # the pipe A-frame on the transom's top to port (bd3f0c22): two legs to an apex 1.5 m up, a brace forward, a lamp on top
        zt_ = z_bw(0.3) + 0.03; apex = (0.35, 1.5, zt_ + 1.5)
        for yy in (0.7, 2.3): acyl(A, (0.3, yy, zt_), apex, 0.04, lambda z: C['galv'], seg=8)
        acyl(A, (1.6, 1.5, zt_), apex, 0.035, lambda z: C['galv'], seg=8)
        acyl(A, (0.3, 0.7, zt_), (0.3, 2.3, zt_), 0.03, lambda z: C['galv'], seg=8)
        lamp(A, (apex[0], apex[1], apex[2]), C['lampW'], r=0.06, h=0.14)
        # the ladder on the transom, from the waterline up the wall to its top
        ladder(A, (-0.03, 0.9, WL + 0.3), (-0.03, 0.9, z_bw(0.0) - 0.1), 0.4, C['steel'], out=(-1, 0, 0))
    if fine:
        pts = [(x, hbz(x, z_bw(x)) - 0.05, z_bw(x) + 0.03) for x in [0.15 + 0.5 * k for k in range(13)]]
        for sg in (1, -1):
            P = [V((x, sg * y, z)) for x, y, z in pts]
            for a, b in zip(P, P[1:]): acyl(A, a, b, 0.03, lambda z: W, seg=8, cap=False)
        y = hbz(0.15, z_bw(0.15)) - 0.05
        acyl(A, (0.15, -y, z_bw(0.15) + 0.03), (0.15, y, z_bw(0.15) + 0.03), 0.03, lambda z: W, seg=8, cap=False)
    # ---- the net chute: a wide white cone standing on the deck aft of the house at port, leaning aft, its mouth up and forward ----
    # (7b36cbe5, 3bd16b40, c6db804c, Jonas 30.10.2026: the chute stands at the wheelhouse's aft starboard corner, its mouth aft and up
    # at the windows' level, the tube leaning so its open foot points forward and down onto the upper deck; the net is hauled over the
    # power block above the mouth, falls through the chute and is laid in the net bin aft)
    foot = V((12.3, -4.55, 9.8)); tip = V((9.7, -4.55, 13.05)); ax = (tip - foot).normalized(); s, u, _ = frame_of(ax)
    ts_ = (0.0, 0.2, 0.5, 0.75, 0.9, 1.0); rings = []
    for t, r in zip(ts_, (0.5, 0.5, 0.56, 0.7, 0.86, 0.98)):
        c = foot + (tip - foot) * t; rings.append([c + (s * math.cos(2 * math.pi * k / 20) + u * math.sin(2 * math.pi * k / 20)) * r for k in range(20)])
    aring_loft(A, rings, W, cap0=False, cap1=False)
    inner = [[p + (c_ - p).normalized() * 0.06 for p in r] for r, c_ in zip(rings, [foot + (tip - foot) * t for t in ts_])]
    aring_loft(A, inner[::-1], C['dark'], cap0=False, cap1=False)
    aring_loft(A, [rings[-1], inner[-1]], W, cap0=False, cap1=False); aring_loft(A, [inner[0], rings[0]], W, cap0=False, cap1=False)
    # (the fish pump's three vacuum tanks at the house's front were here; taken out, Jonas 30.10.2026: "Hva er disse svarte rørene? Fjern dem")
    # ---- the fish pump's hopper amidships: a steel tank with a grating top, the pipes from it over the side ----
    abox(A, 22.3, 25.4, -3.5, -0.7, zs(23.5), 10.1, C['steel'])
    if fine:
        for k in range(9): abox(A, 22.4 + 0.33 * k, 22.44 + 0.33 * k, -3.4, -0.8, 10.1, 10.14, C['dark'])
        for k in range(8): abox(A, 22.4, 25.3, -3.4 + 0.33 * k, -3.36 + 0.33 * k, 10.1, 10.14, C['dark'])
        P = [(23.5, -3.5, 9.6), (23.5, -3.7, 9.6), (23.5, -4.0, 9.2), (23.5, -4.4, 8.3)]
        for a_, b_ in zip(P, P[1:]): acyl(A, a_, b_, 0.17, lambda z: C['steel'], seg=12)
    # ---- the stairs: from the working deck up to the forecastle at starboard, and to the casing's deck by the house ----
    if fine:
        stair(A, X_FC - 2.6, -3.9, zs(24.5), X_FC + 0.05, z_dk(X_FC), 0.8, W)
        stair(A, 20.6, Y_C - 0.9, zs(20.6), 22.3, z_dk(22.3), 0.8, W)
        door_x(A, X_FC, -2.3, zs(X_FC), face=-1)
        for yy in (-1.45, -0.85):
            A.poly([(X_FC - 0.005, yy - 0.22, 7.45), (X_FC - 0.005, yy + 0.22, 7.45), (X_FC - 0.005, yy + 0.22, 8.05), (X_FC - 0.005, yy - 0.22, 8.05)], C['glass'], (-1, 0, 0))
    # ---- the forecastle: the windlass (a drum with its rope between two cheeks), the two warping heads, the rope piles ----
    zf = z_dk(33.0) + 0.12
    for yy in (-1.6, 1.6):
        acyl(A, (33.3, yy - 0.55, zf + 0.6), (33.3, yy + 0.55, zf + 0.6), 0.5, lambda z: C['dark'], seg=16)
        for e in (-0.6, 0.6): abox(A, 32.8, 33.8, yy + e - 0.05, yy + e + 0.05, zf, zf + 1.1, W)
        acyl(A, (33.3, yy - 0.3, zf + 0.6), (33.3, yy + 0.3, zf + 0.6), 0.52, lambda z: C['green'], seg=16)
    for yy in (-2.6, 2.6):
        acyl(A, (31.2, yy, zf), (31.2, yy, zf + 0.75), 0.22, lambda z: W, seg=12); acyl(A, (31.2, yy, zf + 0.75), (31.2, yy, zf + 0.9), 0.28, lambda z: C['steel'], seg=12)
    objs.append(A.done(30))
    return objs


def build(fine=True):
    hull = build_hull(fine); dk = decks(fine)
    if fine:
        # cut the openings: every hole through the hull's side, the bulwark's ones through its inside as well
        c1 = cutter(holes(), False); apply_cut(hull[0], c1); bpy.data.objects.remove(c1)
        c2 = cutter(holes(), True); apply_cut(hull[0], c2); apply_cut(dk[0], c2); bpy.data.objects.remove(c2)
    solids = hull + bulb(fine) + underwater(fine) + dk + hull_side(fine) + funnel(fine) + masts(fine) + deck_gear(fine) + aft_deck(fine)
    o, g = superstructure(fine); solids += o
    return [s for s in solids if s], [x for x in g if x]


def name_strips(G):
    """where the game writes the player's name and marks: the registration on both bows on the forecastle's white side under the rail
    (the photographs: 30.5-34.3 m, 8.3-9.0 m), the name across the transom, and on the net bin's wall both sides"""
    out = []
    for sg, xs in ((1, [34.3 - 3.8 * k / 12 for k in range(13)]), (-1, [30.5 + 3.8 * k / 12 for k in range(13)])):
        out.append([[G(x, sg * (hbz(x, 8.3) + 0.03), 8.3) for x in xs], [G(x, sg * (hbz(x, 9.0) + 0.03), 9.0) for x in xs]])
    ys = [2.4 - 4.8 * k / 12 for k in range(13)]
    out.append([[G(XA - 0.03, y, 8.1) for y in ys], [G(XA - 0.03, y, 9.0) for y in ys]])
    for sg, xs in ((1, [5.9 - 3.4 * k / 12 for k in range(13)]), (-1, [2.5 + 3.4 * k / 12 for k in range(13)])):
        out.append([[G(x, sg * (hbz(x, 8.3) + 0.03), 8.3) for x in xs], [G(x, sg * (hbz(x, 9.1) + 0.03), 9.1) for x in xs]])
    return out

def bower(G):
    """the anchor in its pocket on the starboard bow (the slip and the aerial photographs), its hawse pipe up to the windlass under
    the tarpaulin, the spare to port"""
    hw = lambda sg: {'fair': G(31.5, sg * (hbz(31.5, 7.7) + 0.03), 7.7), 'pipe': G(33.0, sg * 1.3, z_dk(33.0) + 0.17)}
    return dict(hw(-1), kind='hall', kg=900, gypsy=G(33.3, -1.6, z_dk(33.3) + 0.72), side=1, deck=False, spare=hw(1))

def anchors():
    G = lambda x, y, z: [round(v, 3) for v in to_game((x, y, z))]
    DK = z_sh(23.0); UD = z_dk(16.0) + 0.12
    return {'bower': bower(G), 'eye': G(17.0, 1.0, ZB2 + 1.65), 'skipperAt': G(17.0, 1.0, ZB2), 'hp': -0.10, 'fov': 58,
            # the crew on the working deck by the hopper and the vacuum tanks, one on the upper deck aft by the net chute
            'crewSpots': [G(23.0, -3.5, DK) + [1.57], G(21.5, -2.0, DK) + [0.0], G(24.5, -1.5, DK) + [3.14], G(9.5, 0.2, z_dk(9.5) + 0.12) + [3.14]],
            # the lights (kap. 6 of the groundwork, FOR-1975-12-01-5): the one masthead light on the foremast's top, the sidelights in
            # their screens on the wheelhouse roof's slope, the stern light on the A-frame's apex, the floodlights as work lights
            'lights': [[G(29.97, 0, 17.69), [1, 0.95, 0.85], 'masthead'], [G(14.5, WY + 0.26, 13.9), [1, 0.12, 0.1], 'port'],
                       [G(14.5, -WY - 0.26, 13.9), [0.1, 1, 0.35], 'stbd'], [G(0.35, 1.5, z_bw(0.3) + 1.67), [1, 0.95, 0.85], 'stern'],
                       [G(31.05, 0.0, 14.45), [1, 0.95, 0.85], 'work'], [G(19.45, 0.9, 15.15), [1, 0.95, 0.85], 'work'], [G(19.45, -0.9, 15.15), [1, 0.95, 0.85], 'work']],
            # the doors: the wheelhouse's port door onto deck B, the house's doors on the upper deck, the forecastle's door on the working deck
            'doors': [{'at': G((W_DOOR[0] + W_DOOR[1]) / 2, WY + 0.03, ZB2), 'w': 0.6, 'h': 2.0, 'in': G((W_DOOR[0] + W_DOOR[1]) / 2, WY - 1.0, ZB2), 'to': 'bridge', 'hinge': 'stbd'},
                      {'at': G(13.7, HY + 0.03, UD), 'w': 0.8, 'h': 2.0, 'in': G(13.7, HY - 1.0, UD), 'to': 'mess', 'hinge': 'port'},
                      {'at': G(HX0 - 0.03, 1.6, UD), 'w': 0.8, 'h': 2.07, 'in': G(HX0 + 1.0, 1.6, UD), 'to': 'cabin', 'hinge': 'port'},
                      {'at': G(X_FC - 0.03, -2.3, DK), 'w': 0.8, 'h': 2.07, 'in': G(X_FC + 1.0, -2.3, DK), 'to': 'mess', 'hinge': 'stbd'}],
            'names': name_strips(G),
            # the working deck to starboard between the house and the forecastle: the net comes aboard over the power block aft and
            # is stacked in the net bin; the fish are pumped over the starboard side into the hopper
            'deck': {'y': round(DK - WL, 3), 'z': round(-(23.0 - LOA / 2), 3)}, 'gw': round(DK + 0.35 - WL, 3),
            'stern': round(LOA / 2 - XA, 3), 'bow': round(-(XF - LOA / 2), 3), 'side': HB, 'beam': BM, 'pl': 20.0, 'rl': 4.2, 'open': True, 'hand': False,
            'pole': G(XA + 0.4, 0, z_bw(0.4) + 0.2), 'hauler': G(9.7, -4.55, 14.75), 'filler': G(23.5, -4.4, 8.3)}


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
    if 'export' in sys.argv:
        ex = {'frame': 'kystfiske: x starboard, y up from the waterline, z aft; metres', 'type': 'ringnot38', 'name': 'Purse seiner and fly-shooter 38.55 m',
              'len': LOA, 'beam': BM, 'draft': WL, 'anchors': anchors()}
        export_boat(build, to_game, to_game_n, OUT, 'ringnot38.glb', os.path.join(ROOT, 'src', 'data', 'boat-ringnot38.b64'), ex,
                    side=(os.path.join(ROOT, 'src', 'data', 'boat-ringnot38-side.b64'), LOA / 2, 9.0, 44.0), dry='dry' in sys.argv)


if __name__ == '__main__':
    main()
