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
    C['bin'] = mat('bin', (0.52, 0.47, 0.40), 0.12, zone=4)
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
    if z < BAND[2]: return C['hull']
    if z < BAND[3]: return C['stripe']
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

def pieces(x):
    """the section at x from the bottom up, as polylines [(y, z)] starting and ending on the centreline (the top one ends at the
    bulwark's top); forward of the neck there are two: the bulb, and the bow above it"""
    zt = z_bw(x); z = np.append(np.arange(-0.6, zt, 0.004), zt); y = _ys(x, z); pos = y > 0; out = []; i = 0; n = len(z)
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

N_LO, N_UP, N_BW = 40, 44, 8   # points from the keel to the split, from the split to the shelter deck, and up the bulwark
def lo_pts(poly): return resample(poly, [(None, N_LO)])
def up_pts(poly, x): return resample(poly, [(max(poly[0][1], z_sh(x)), N_UP), (None, N_BW)])

def neck():
    """where the bulb parts from the stem (the first station with two pieces) and the height of the neck there"""
    lo, hi = 33.0, XN - 0.05
    for _ in range(30):
        m = (lo + hi) / 2
        if len(pieces(m)) > 1: hi = m
        else: lo = m
    p = pieces(hi); zp = (p[0][-1][1] + p[1][0][1]) / 2
    return lo, hi, zp

def hull_rows(fine=True):
    """the hull's rows (stations) for one side: the main body from the transom to the neck, the bulb's nose and the bow above it"""
    x0, x1, zp = neck()
    st = [XA + 0.04 * i for i in range(5)] + [0.25 * i for i in range(1, 24)] + [6.0 + 0.4 * i for i in range(56)] + [28.4 + 0.2 * i for i in range(60)]
    if not fine: st = [XA, 0.2, 0.6, 1.2, 2.0, 3.0, 4.0, 5.0, 6.5, 8.0, 10.0] + [12.0 + 2.0 * i for i in range(8)] + [28.0 + 1.0 * i for i in range(8)]
    st = sorted(set(round(x, 4) for x in st if x < x0 - 0.05)) + [x0]
    main = []
    for x in st:
        p = pieces(x)[0]; zs = z_sh(x)
        lo, up = split_at(p, max(zp, p[0][1] + 0.25) if x < x0 else min(p, key=lambda q: q[0] if abs(q[1] - zp) < 0.6 else 9)[1])
        main.append((x, lo_pts(lo), up_pts(up, x)))
    nb, nu = (22, 30) if fine else (6, 8)
    bulb, bow = [main[-1][1]], [main[-1][2]]
    for k in range(1, nb):
        t = k / nb; x = x1 + (XN - x1) * (1 - (1 - t) ** 1.8); bulb.append(lo_pts(pieces(x)[0]))
    _, _, zc = bulb_at(XN - 1e-3); bulb.append([(0.0, zc)] * (N_LO + 1))
    xe = XF
    for k in range(1, nu):
        t = k / nu; x = x1 + (xe - x1) * (1 - (1 - t) ** 1.8); P = pieces(x); bow.append(up_pts(P[-1], x))
    bow.append([(0.0, z_bw(xe))] * (N_UP + N_BW + 1))
    xb = [x1 + (XN - x1) * (1 - (1 - k / nb) ** 1.8) for k in range(nb)] + [XN]
    xu = [x1 + (xe - x1) * (1 - (1 - k / nu) ** 1.8) for k in range(nu)] + [xe]
    xb[0] = xu[0] = x0
    return ([[(x, y, z) for y, z in lo + up[1:]] for x, lo, up in main],
            [[(x, y, z) for y, z in r] for x, r in zip(xb, bulb)], [[(x, y, z) for y, z in r] for x, r in zip(xu, bow)])

def hull_mat(c):
    if c.z > z_sh(c.x) + 0.01: return C['white']
    return band(c.z)

def build_hull(fine=True):
    """the hull's outside as one mesh, both sides and the transom, cut along the paint lines"""
    bm = bmesh.new(); grids = hull_rows(fine)
    for sg in (1, -1):
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


# ---------- the decks and the bulwarks' inside ----------
def decks(fine=True):
    A = Acc('decks')
    xs = [0.25 * i for i in range(113)] + [X_ENT + 0.5 * k for k in range(1, 20) if X_ENT + 0.5 * k < x_stem(z_sh(X_ENT + 0.5 * k)) - 0.4]
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
    # the house on deck A (deck B over it), set in from the sides, its corners rounded
    HX0, HX1, HY = 11.2, 19.6, 3.35
    hp = rrect((HX0 + HX1) / 2, 0.0, HX1 - HX0, 2 * HY, 0.85, n=6)
    prism(A, hp, ZA, ZB2 - 0.14, w)
    if fine:
        for sg in (1, -1):
            for x in (12.2, 13.4, 16.8, 18.0):
                yy = sg * (HY + 0.005); A.poly([(x, yy, 9.55), (x + 0.75, yy, 9.55), (x + 0.75, yy, 10.15), (x, yy, 10.15)][::sg], C['glass'], (0, sg, 0))
            door_y(A, 14.6, 15.4, sg * HY, ZA, sg)
        for yy in (-1.9, -0.65, 0.65, 1.9):
            A.poly([(HX1 + 0.005, yy - 0.5, 9.45), (HX1 + 0.005, yy + 0.5, 9.45), (HX1 + 0.005, yy + 0.5, 10.2), (HX1 + 0.005, yy - 0.5, 10.2)], C['glass'], (1, 0, 0))
        door_x(A, HX0, 1.6, ZA, face=-1)
    # the wheelhouse: a broad front rounded in plan in eight facets, glass all round leaning out at the top on the front, the sill and
    # the head as dark frames, a white fascia with the blue band and the roof's overhang over it (the photographs: the bridge reads as
    # one rounded glass front, not a box with a black strip)
    oc, lw = wh_plan()
    nrm_at = plan_normals(oc)
    def lean(p, z):
        i = oc.index(p) if p in oc else None
        if i is None or z <= WS: return (p[0], p[1], z)
        d = 0.55 * lw[i] * (min(z, WR) - WS) / (WR - WS); n = nrm_at[i]; return (p[0] + n[0] * d, p[1] + n[1] * d, z)
    # deck B's ledge round the wheelhouse's foot, and its underside where it overhangs the house below
    lp = offset_plan(oc, nrm_at, lambda i: 0.25)
    prism(A, lp, ZB2 - 0.14, ZB2, w)
    for i in range(len(oc)):
        a, b = oc[i], oc[(i + 1) % len(oc)]; nr = (b[1] - a[1], -(b[0] - a[0]), 0)
        A.poly([lean(a, ZB2), lean(b, ZB2), lean(b, WS), lean(a, WS)], w, nr)
        A.poly([lean(a, WH), lean(b, WH), lean(b, WR), lean(a, WR)], w, nr)
        G.poly([lean(a, WS), lean(b, WS), lean(b, WH), lean(a, WH)], C['glass'], nr)
        Lg = math.hypot(b[0] - a[0], b[1] - a[1]); k = max(1, int(Lg / 1.25 + 0.5))
        for j in range(k + 1):
            t = j / k; p = (a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t)
            q0, q1 = lean(a, WS), lean(b, WS); r0, r1 = lean(a, WH), lean(b, WH)
            P0 = [q0[c] + (q1[c] - q0[c]) * t for c in range(3)]; P1 = [r0[c] + (r1[c] - r0[c]) * t for c in range(3)]
            beam(A, P0, P1, 0.07, 0.07, C['dark'])
        beam(A, lean(a, WS), lean(b, WS), 0.09, 0.06, C['dark']); beam(A, lean(a, WH), lean(b, WH), 0.09, 0.06, C['dark'])
    io = [(x + n[0] * -0.25, y + n[1] * -0.25) for (x, y), n in zip(oc, nrm_at)]
    lining(A, oc, io, ZB2, WS, WH, WR, lambda p, z, i: lean(p, z), C['dark'], lambda i: True)
    # the roof: its overhang wider over the front, the blue band round its edge, the white coaming over it
    ro = offset_plan([lean(p, WR)[:2] for p in oc], nrm_at, lambda i: 0.30 + 0.35 * lw[i])
    A.poly([(x, y, WR) for x, y in ro], C['inner'], (0, 0, -1)); A.poly([(x, y, WR + 0.25) for x, y in ro], w, (0, 0, 1))
    for i in range(len(ro)):
        a, b = ro[i], ro[(i + 1) % len(ro)]; nr = (b[1] - a[1], -(b[0] - a[0]), 0)
        A.poly([(a[0], a[1], WR), (b[0], b[1], WR), (b[0], b[1], WR + 0.11), (a[0], a[1], WR + 0.11)], C['trim'], nr)
        A.poly([(a[0], a[1], WR + 0.11), (b[0], b[1], WR + 0.11), (b[0], b[1], WR + 0.25), (a[0], a[1], WR + 0.25)], w, nr)
    # the inside of the overhang between the fascia and the roof's edge
    fo = [lean(p, WR)[:2] for p in oc]
    for i in range(len(ro)):
        a, b = ro[i], ro[(i + 1) % len(ro)]; c_, d_ = fo[i], fo[(i + 1) % len(fo)]
        A.poly([(c_[0], c_[1], WR), (d_[0], d_[1], WR), (b[0], b[1], WR), (a[0], a[1], WR)], C['inner'], (0, 0, -1))
    if fine: rail(A, [(x, y, WR + 0.25) for x, y in ro] + [(ro[0][0], ro[0][1], WR + 0.25)], h=1.0)
    # the signs for the call sign on the roof's edge, port and starboard (the game writes the player's on them)
    for sg in (1, -1):
        y = sg * (WY + 0.2); abox(A, 12.0, 14.6, min(y, y + sg * 0.06), max(y, y + sg * 0.06), WR + 0.5, WR + 1.4, w)
        abox(A, 11.98, 14.62, min(y + sg * 0.06, y + sg * 0.07), max(y + sg * 0.06, y + sg * 0.07), WR + 0.48, WR + 1.42, C['black'])
        abox(A, 12.03, 14.57, min(y + sg * 0.07, y + sg * 0.075), max(y + sg * 0.07, y + sg * 0.075), WR + 0.53, WR + 1.37, w)
        for x in (12.3, 14.3): acyl(A, (x, y - sg * 0.04, WR + 0.25), (x, y - sg * 0.04, WR + 0.5), 0.03, lambda z: C['steel'], seg=6)
    return [A.done(30)], [G.done(30)]

def wh_plan(n=10, a=2.8, e=2.3):
    """the wheelhouse in plan, counter-clockwise from the aft starboard corner: straight sides and a broad superelliptic front; with
    each corner's lean weight (1 at the front's middle, 0 on the sides and aft)"""
    pts = [(WX0, -WY)]; lw = [0.0]
    for k in range(n + 1):
        ph = -math.pi / 2 + math.pi * k / n; c, s_ = math.cos(ph), math.sin(ph)
        pts.append((WX1 - a + a * abs(c) ** (2 / e), WY * math.copysign(abs(s_) ** (2 / e), s_))); lw.append(abs(c) ** 0.8)
    pts.append((WX0, WY)); lw.append(0.0)
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
