"""The 36-foot Malo sjark (10.99 m), built in Blender from the general arrangement drawing (Jemar Norpower, 2014) and its data sheet:
length 10.99 m, beam 4.20 m (moulded, 4.40 over the fenders), depth 2.34 m, height with mast about 9.5 m, hold 19 m3, 300 hp, about
10 kn. The drawing itself is not in the repository; the numbers below were measured from it (stations 1 m apart, 92.4 px/m).
Exterior only, with a dark wheelhouse so the windows read as glass.

    pip install bpy==4.5.4
    python3 tools/boats/malo36.py            -> src/data/boat-malo36.b64 (+ the side picture), renders in tools/boats/out/
    python3 tools/boats/malo36.py check      -> only the overlay on the drawing (needs the drawing at DRAWING)
    python3 tools/boats/malo36.py fast dry   -> no renders to look at, and the GLB only in tools/boats/out (src/data untouched)

Frame: x forward from the aft perpendicular, y to port, z up from the baseline; the waterline is z = 1.38."""
import os, sys, math, json, base64
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy
from bpyutil import *

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE)); OUT = os.path.join(HERE, 'out')
DRAWING = os.environ.get('MALO_GA', '')
WL = 1.38; XA = -0.42; XF = 10.78; XM = (XA + XF) / 2


# ---------- measured lines (metres) ----------
# the bottom of the hull body on the centreline: the canoe body aft (the skeg is separate), the keel line, the forefoot and the stem
LOW = [(XA, 1.12), (0.0, 1.05), (1.0, 0.83), (2.0, 0.62), (3.0, 0.41), (4.0, 0.21), (5.0, 0.03), (6.0, -0.16), (7.0, -0.09), (8.0, -0.02),
       (8.5, 0.0), (9.0, 0.04), (9.56, 0.09), (9.92, 0.16), (10.18, 0.31), (10.34, 0.49), (10.42, 0.80), (10.45, 1.09), (10.46, 1.38),
       (10.50, 1.60), (10.62, 2.40), (10.75, 3.30), (10.78, 3.95)]
def z_low(x):
    # below 10.46 the forefoot rises steeply; a table in x is fine because x only grows along it
    return interp(LOW, x)
# the top of the side (bulwark top): high aft bulwark, the step down to the shelter, the forecastle from 6.55
SHEER = [(XA, 3.76), (0.5, 3.75), (1.5, 3.73), (2.2, 3.70), (2.5, 3.52), (2.75, 3.20), (3.0, 3.00), (3.3, 2.96), (6.40, 2.97),
         (6.50, 3.05), (6.58, 3.55), (6.66, 3.86), (8.0, 3.89), (9.0, 3.91), (10.0, 3.93), (XF, 3.95)]
def z_sheer(x): return interp(SHEER, x)
# half-breadth at the sheer, moulded (the plan's outline less the fender strake)
HB = [(XA, 1.88), (-0.3, 1.95), (0.0, 1.98), (0.5, 2.0), (1.0, 2.01), (2.0, 2.03), (3.0, 2.04), (6.0, 2.04), (7.0, 2.04), (7.5, 2.01), (8.0, 1.97),
      (8.5, 1.90), (9.0, 1.75), (9.5, 1.55), (10.0, 1.22), (10.3, 0.96), (10.5, 0.70), (10.6, 0.50), (10.7, 0.24), (XF, 0.0)]
def hb(x): return interp(HB, x)
# section shape: deadrise at the keel (deg), flare at the sheer (deg), and how full the bilge is
DR = [(XA, 7), (2.0, 11), (5.0, 15), (7.0, 22), (8.0, 31), (9.0, 44), (9.8, 56), (10.3, 66), (XF, 75)]
FL = [(XA, 3), (3.0, 4), (6.0, 5), (7.5, 8), (8.5, 13), (9.3, 18), (10.0, 24), (XF, 28)]
RB = [(XA, 0.42), (2.0, 0.5), (5.0, 0.58), (7.0, 0.66), (8.0, 0.8), (9.0, 0.95), (10.0, 0.8), (10.5, 0.4), (XF, 0.2)]
# the fender strake and the colour bands
RUB = [(XA, 2.70), (6.0, 2.70), (7.0, 2.78), (8.0, 2.92), (9.0, 3.04), (10.0, 3.14), (10.6, 3.20)]
def z_rub(x): return interp(RUB, x)
Z_AF = 1.30; Z_BT = 1.46        # antifouling up to 1.30, the white boot top to 1.46 (the waterline is 1.38)
Z_DECK = 2.26                   # main deck at the side (2.34 on the centreline)
def z_bakk(x): return 3.25 + 0.18 * max(0, min(1, (x - 6.55) / 4.2)) ** 1.5
def x_transom(z): return -0.30 - 0.045 * (z - 1.12)


def section(x, n=48):
    """the half-section at station x, from the centreline bottom to the sheer, as a polyline of (y, z): a bottom line with deadrise,
    a round bilge of radius RB filleted into a side line with flare up to the sheer"""
    zl = z_low(x); zs = z_sheer(x); h = hb(x)
    if h < 1e-4 or zs - zl < 1e-4: return [(0.0, zl), (0.0, zs)]
    dr = math.radians(interp(DR, x)); fl = math.radians(interp(FL, x)); r = interp(RB, x)
    d1 = (math.cos(dr), math.sin(dr)); d2 = (-math.sin(fl), -math.cos(fl))
    # intersection of the bottom line from (0, zl) and the side line from (h, zs) going down
    den = d1[0] * d2[1] - d1[1] * d2[0]
    s_ = ((h - 0) * d2[1] - (zs - zl) * d2[0]) / den
    C = (d1[0] * s_, zl + d1[1] * s_)
    if s_ <= 0 or C[1] >= zs or C[0] >= h + 1e-6:      # a V section (near the stem): straight from the keel to the sheer
        return [(h * k / n, zl + (zs - zl) * k / n) for k in range(n + 1)]
    ua = (-d1[0], -d1[1]); ub = (h - C[0], zs - C[1]); lb = math.hypot(*ub); ub = (ub[0] / lb, ub[1] / lb)
    cosang = max(-1, min(1, ua[0] * ub[0] + ua[1] * ub[1])); th = math.acos(cosang)
    dt = min(r / max(1e-6, math.tan(th / 2)), 0.85 * s_, 0.85 * lb)
    rr = dt * math.tan(th / 2)
    T1 = (C[0] + ua[0] * dt, C[1] + ua[1] * dt); T2 = (C[0] + ub[0] * dt, C[1] + ub[1] * dt)
    bis = (ua[0] + ub[0], ua[1] + ub[1]); bl = math.hypot(*bis); bis = (bis[0] / bl, bis[1] / bl)
    cdist = rr / math.sin(th / 2); O = (C[0] + bis[0] * cdist, C[1] + bis[1] * cdist)
    a1 = math.atan2(T1[1] - O[1], T1[0] - O[0]); a2 = math.atan2(T2[1] - O[1], T2[0] - O[0])
    da = (a2 - a1 + math.pi) % (2 * math.pi) - math.pi; a2 = a1 + da   # the short way round, bulging out towards the corner
    out = [(0.0, zl)]
    nb = max(2, n // 4); na = max(4, n // 2); ns = max(2, n // 4)
    for k in range(1, nb + 1): t = k / nb; out.append((T1[0] * t, zl + (T1[1] - zl) * t))
    for k in range(1, na + 1): a = a1 + (a2 - a1) * k / na; out.append((O[0] + rr * math.cos(a), O[1] + rr * math.sin(a)))
    for k in range(1, ns + 1): t = k / ns; out.append((T2[0] + (h - T2[0]) * t, T2[1] + (zs - T2[1]) * t))
    return out


def y_at(x, z):
    """the half-breadth of the outside of the hull at station x and height z"""
    s = section(x)
    if z <= s[0][1]: return 0.0
    for a, b in zip(s, s[1:]):
        if a[1] <= z <= b[1] and b[1] > a[1]: return a[0] + (b[0] - a[0]) * (z - a[1]) / (b[1] - a[1])
    return s[-1][0]


def stations(fine=True):
    xs = [XA]
    if fine:
        xs += [-0.3, -0.15] + [i * 0.25 for i in range(0, 26)] + [6.4, 6.45, 6.5, 6.54, 6.58, 6.62, 6.66, 6.72, 6.8, 6.9] + [7.0 + i * 0.2 for i in range(0, 15)] + \
              [10.0, 10.12, 10.24, 10.34, 10.42, 10.48, 10.54, 10.6, 10.65, 10.69, 10.72, 10.745, 10.765, XF]
    else:
        xs += [0.5, 1.5, 2.5, 3.0, 4.5, 6.4, 6.6, 7.5, 8.5, 9.3, 10.0, 10.4, 10.6, 10.72, XF]
    return sorted(set(round(x, 4) for x in xs))


C = {}
def colours():
    C['af'] = mat('antifouling', (0.34, 0.08, 0.06), 0.1)
    C['boot'] = mat('boot', (0.92, 0.93, 0.92), 0.55, zone=2)
    C['hull'] = mat('hull', (0.05, 0.16, 0.38), 0.65, zone=1)
    C['white'] = mat('house', (0.91, 0.92, 0.91), 0.5, zone=3)     # the bulwarks' white, the shelter and the wheelhouse: paint zone 3
    C['inner'] = mat('inner', (0.84, 0.85, 0.84), 0.3)
    C['deck'] = mat('deck', (0.46, 0.49, 0.48), 0.12, zone=4)
    C['rub'] = mat('rub', (0.05, 0.05, 0.06), 0.3)
    C['steel'] = mat('steel', (0.74, 0.76, 0.78), 0.85, metal=0.8)
    C['mast'] = mat('mast', (0.90, 0.91, 0.90), 0.55, zone=3)
    C['dark'] = mat('dark', (0.10, 0.11, 0.12), 0.25)
    C['frame'] = mat('frame', (0.07, 0.07, 0.08), 0.45)
    C['glass'] = mat('glass', (0.05, 0.08, 0.11), 0.95)
    C['prop'] = mat('bronze', (0.70, 0.52, 0.27), 0.8, metal=0.9)
    C['zinc'] = mat('zinc', (0.62, 0.63, 0.64), 0.4)
    C['orange'] = mat('orange', (0.95, 0.38, 0.06), 0.45)
    C['red'] = mat('machine', (0.72, 0.18, 0.08), 0.5)
    C['tub'] = mat('tub', (0.10, 0.36, 0.64), 0.45)
    C['rope'] = mat('rope', (0.85, 0.75, 0.25), 0.2)
    C['lred'] = mat('light_red', (0.9, 0.1, 0.08), 0.8, emit=0.5)
    C['lgreen'] = mat('light_green', (0.1, 0.8, 0.25), 0.8, emit=0.5)
    C['lwhite'] = mat('light_white', (1.0, 0.97, 0.88), 0.8, emit=0.5)


def band_mat(z, x):
    return C['af'] if z < Z_AF - 1e-4 else C['boot'] if z < Z_BT - 1e-4 else C['hull'] if z < z_rub(x) - 1e-4 else C['white']


def build_hull(fine=True):
    xs = stations(fine)
    nb = [(Z_AF, 12 if fine else 4), (Z_BT, 2 if fine else 1), (None, 0)]   # placeholder; the rub and sheer bands are per station
    rows = []
    for x in xs:
        sec = section(x)
        bands = [(Z_AF, 12 if fine else 4), (Z_BT, 2 if fine else 1), (z_rub(x), 10 if fine else 3), (None, 6 if fine else 2)]
        pts = resample(sec, bands)
        rows.append([(x_transom(z) if x == XA else x, y, z) for y, z in pts])
    def mf(i, j):
        a = rows[i][j]; b = rows[i + 1][j + 1]; return band_mat((a[2] + b[2]) / 2, (a[0] + b[0]) / 2)
    OUTH = lambda c: (0, c.y, c.z - 1.6)
    port = grid('hull_p', rows, mf, out=OUTH)
    stbd = grid('hull_s', [[(p[0], -p[1], p[2]) for p in r] for r in rows], mf, out=OUTH)
    # the transom: a ladder across the first section
    r0 = rows[0]; T = [[(p[0], -p[1], p[2]), (p[0], p[1], p[2])] for p in r0]
    tr = grid('transom', T, lambda i, j: band_mat((T[i][0][2] + T[i + 1][0][2]) / 2, XA), angle=20, out=lambda c: (-1, 0, 0))
    return [port, stbd, tr], rows



# ---------- inside of the bulwarks, the top rail, the decks ----------
T_BW = 0.07     # bulwark thickness

def bulwark_inner(x0, x1, deckf, name, fine=True):
    xs = [x for x in stations(fine) if x0 <= x <= x1]
    if xs[0] > x0: xs = [x0] + xs
    if xs[-1] < x1: xs.append(x1)
    rows = []; caps = []
    for x in xs:
        zd = deckf(x); zs = z_sheer(x)
        if zs - zd < 0.02: zs = zd + 0.02
        n = 5; row = []
        for k in range(n + 1):
            z = zd + (zs - zd) * k / n; y = max(0.02, y_at(x, z) - T_BW); xx = x_transom(z) + T_BW if x <= XA + 1e-6 else x
            row.append((xx, y, z))
        rows.append(row)
        yo = y_at(x, zs); xx = x_transom(zs) if x <= XA + 1e-6 else x
        caps.append([(xx, yo + 0.012, zs - 0.01), (xx, yo - T_BW / 2, zs + 0.025), (xx + (T_BW if x <= XA + 1e-6 else 0), max(0.02, yo - T_BW - 0.012), zs - 0.01)])
    objs = []
    for sg, nm in ((1, 'p'), (-1, 's')):
        G = [[(p[0], sg * p[1], p[2]) for p in r] for r in rows]; objs.append(grid(name + '_in_' + nm, G, lambda i, j: C['inner'], out=lambda c: (0.001, -c.y, 0)))
        G = [[(p[0], sg * p[1], p[2]) for p in r] for r in caps]; objs.append(grid(name + '_cap_' + nm, G, lambda i, j: C['white'], angle=60, out=lambda c: (0, 0, 1)))
    return objs


def deck(x0, x1, zf, camber, name, m, fine=True, n=10):
    xs = [x for x in stations(fine) if x0 <= x <= x1]
    if not xs or xs[0] > x0: xs = [x0] + xs
    if xs[-1] < x1: xs.append(x1)
    rows = []
    for x in xs:
        zd = zf(x); yi = max(0.03, y_at(x, zd) - T_BW); xx = x_transom(zd) + T_BW if x <= XA + 1e-6 else x
        rows.append([(xx, yi * (2 * k / n - 1), zd + camber * (1 - (2 * k / n - 1) ** 2)) for k in range(n + 1)])
    return grid(name, rows, lambda i, j: m, out=lambda c: (0, 0, 1))


def transom_inner(fine=True):
    """the inside of the transom above the deck"""
    zs = z_sheer(XA); rows = []
    for k in range(6):
        z = Z_DECK + (zs - Z_DECK) * k / 5; yy = y_at(XA, z) - T_BW; x = x_transom(z) + T_BW
        rows.append([(x, -yy, z), (x, yy, z)])
    return grid('transom_in', rows, lambda i, j: C['inner'], out=lambda c: (1, 0, 0))


# ---------- the skeg, rudder, propeller, fender strake ----------
def keel_line(x): return -0.62 + 0.0755 * x

def underwater(fine=True):
    objs = []
    # skeg: between the canoe body and the keel line, from the stern post at x = 1.0 to where they meet
    top = [(x, z_low(x) + 0.05) for x in [1.0 + 0.25 * k for k in range(22)]]
    bot = [(x, keel_line(x)) for x in [1.0 + 0.25 * k for k in range(22)]]
    poly_xz = top + list(reversed(bot))
    rings = []
    for yy in (0.12, -0.12):
        rings.append([(x, yy, z) for x, z in poly_xz])
    sk = loft_rings('skeg', rings, C['af'])
    if fine: bevel_mod(sk, 0.04, 2)
    objs.append(sk)
    objs.append(box('shoe', -0.34, 1.05, -0.06, 0.06, -0.62, -0.53, C['af'], 0.015 if fine else 0))
    # rudder with its stock
    rud = [(-0.31, -0.55), (0.24, -0.55), (0.27, -0.4), (0.27, 0.92), (0.2, 0.98), (-0.25, 0.98), (-0.31, 0.9)]
    ru = loft_rings('rudder', [[(x, 0.055, z) for x, z in rud], [(x, -0.055, z) for x, z in rud]], C['af'])
    if fine: bevel_mod(ru, 0.025, 2)
    objs.append(ru)
    objs.append(cyl('stock', (0.0, 0, 0.92), (0.0, 0, 1.12), 0.045, C['steel'], 10))
    if fine:
        # the shaft and a four-bladed propeller (pitch about 0.8 m), 1.1 m across
        objs.append(cyl('shaft', (1.02, 0, 0.30), (0.62, 0, 0.30), 0.04, C['steel'], 10))
        objs.append(cyl('hub', (0.70, 0, 0.30), (0.46, 0, 0.30), 0.085, C['prop'], 14, r1=0.06))
        for k in range(4):
            a0 = math.pi / 2 * k + 0.3; rows = []
            for i in range(9):
                r = 0.08 + 0.47 * i / 8; ch = 0.30 * math.sin(math.pi * (0.15 + 0.85 * i / 8)) ** 0.7 + 0.04; phi = math.atan(0.8 / (2 * math.pi * r))
                skew = 0.10 * (i / 8) ** 2; row = []
                for j in range(5):
                    c = (j / 4 - 0.5) * ch; a = a0 + (c * math.cos(phi)) / r + skew
                    row.append((0.58 + c * math.sin(phi), r * math.sin(a), 0.30 + r * math.cos(a)))
                rows.append(row)
            b = grid('blade%d' % k, rows, lambda i, j: C['prop'], angle=80)
            solidify(b, 0.018); objs.append(b)
        for sx in (1, -1):
            objs.append(box('zinc%d' % sx, 1.6, 2.0, sx * 0.12 - 0.02, sx * 0.12 + 0.02, -0.25, -0.1, C['zinc'], 0.01))
    return objs


def fender_strake(fine=True):
    """the black rubbing strake round the hull at the deck line, across the transom too"""
    xs = [x for x in stations(fine) if XA + 0.01 < x <= 10.55]; pts = []
    for x in reversed(xs): z = z_rub(x); pts.append((x, -(y_at(x, z) + 0.03), z))
    z = z_rub(XA); xt = x_transom(z) - 0.03; yy = y_at(XA, z) + 0.02
    for k in range(9): pts.append((xt, -yy + 2 * yy * k / 8, z))
    for x in xs: z = z_rub(x); pts.append((x, y_at(x, z) + 0.03, z))
    return tube('fender_strake', pts, 0.05, C['rub'], 8 if fine else 4)



# ---------- the shelter (ly) amidships, with two big windows a side and the hauling port to starboard ----------
SH_X0 = 2.98; SH_X1 = 5.95; SH_TOP = 4.70; ROOF_SH = 4.84
WIN_SH = [(3.78, 0.91, 0.29), (4.80, 0.90, 0.30)]           # (centre x, width, how far the top leans forward)
WIN_Z = (3.13, 4.53)
HAUL_PORT = [(5.06, 2.88), (6.05, 2.88), (6.05, 4.62), (5.82, 4.62), (5.64, 4.18), (5.44, 3.64), (5.26, 3.24)]

def shelter(fine=True):
    objs = []; glass = []
    for sg in (1, -1):
        xs = [SH_X0 + (SH_X1 - SH_X0) * k / 12 for k in range(13)]; rows = []
        for x in xs:
            zs = z_sheer(x); yw = hb(x)
            rows.append([(x, sg * yw, zs + (SH_TOP + 0.02 - zs) * k / 6) for k in range(7)])
        w = grid('shelter_wall_%d' % sg, rows, lambda i, j: C['white'], angle=30, out=lambda c: (0, c.y, 0))
        w.data.materials.append(C['inner']); solidify(w, 0.06, 1); apply_all(w)
        yw = hb(4.5)
        if fine:
            cutters = []
            for k, (cx, ww, sk) in enumerate(WIN_SH):
                poly = rrect(cx, sum(WIN_Z) / 2, ww, WIN_Z[1] - WIN_Z[0], 0.14, 4, sk)
                cutters.append(plate_cutter('cw%d' % k, (0, sg * 2.0, 0), (1, 0, 0), (0, 0, 1), poly, 0.4))
                outer = rrect(cx, sum(WIN_Z) / 2, ww + 0.09, WIN_Z[1] - WIN_Z[0] + 0.09, 0.18, 4, sk)
                objs.append(frame_ring('shf%d%d' % (k, sg), (0, sg * (yw + 0.006), 0), (1, 0, 0), (0, 0, 1), outer, poly, C['frame'], 0.0, 0.03, nrm=(0, sg, 0)))
                glass.append(plate('shg%d%d' % (k, sg), (0, sg * (yw - 0.03), 0), (1, 0, 0), (0, 0, 1), poly, C['glass'], nrm=(0, sg, 0)))
            if sg < 0: cutters.append(plate_cutter('haul', (0, -2.0, 0), (1, 0, 0), (0, 0, 1), HAUL_PORT, 0.4))
            cut(w, cutters)
        else:
            for k, (cx, ww, sk) in enumerate(WIN_SH):
                objs.append(plate('shw%d%d' % (k, sg), (0, sg * (yw + 0.004), 0), (1, 0, 0), (0, 0, 1), rrect(cx, sum(WIN_Z) / 2, ww, WIN_Z[1] - WIN_Z[0], 0.14, 2, sk), C['dark'], nrm=(0, sg, 0)))
        objs.append(w)
    objs.append(box('shelter_roof', 2.20, SH_X1 + 0.04, -2.10, 2.10, SH_TOP, ROOF_SH, C['white'], 0.03 if fine else 0))
    # the face under the wheelhouse at the front of the shelter, and the steps of the forecastle at the walkways
    objs.append(box('bakk_face', SH_X1 - 0.02, SH_X1 + 0.02, -1.97, 1.97, Z_DECK, 3.27, C['white']))
    objs.append(box('bakk_face_p', 6.53, 6.57, 1.74, 1.98, Z_DECK, 3.27, C['white']))
    objs.append(box('bakk_face_s', 6.53, 6.57, -1.98, -1.48, Z_DECK, 3.27, C['white']))
    if fine:
        # rail round the roof, a ladder up from the aft deck (the liferaft and the buoys are the game's deck kit, drawn at anchors.kit:
        # the user's wish 19.10.2026)
        posts = [(x, sy * 2.0) for x in (2.32, 3.0, 3.7, 4.4, 5.1, 5.8) for sy in (1, -1)] + [(2.32, y) for y in (-1.0, 0.0, 1.0)]
        for k, (x, y) in enumerate(posts): objs.append(cyl('rp%d' % k, (x, y, ROOF_SH), (x, y, ROOF_SH + 0.36), 0.018, C['steel'], 8))
        objs.append(tube('roof_rail', [(5.85, 2.0, ROOF_SH + 0.36), (2.45, 2.0, ROOF_SH + 0.36), (2.32, 1.87, ROOF_SH + 0.36), (2.32, -1.87, ROOF_SH + 0.36), (2.45, -2.0, ROOF_SH + 0.36), (5.85, -2.0, ROOF_SH + 0.36)], 0.022, C['steel'], 8))
        for sy in (-1.45, -0.95): objs.append(cyl('lad%d' % int(sy * 100), (2.64, sy, Z_DECK), (2.26, sy, ROOF_SH + 0.25), 0.022, C['steel'], 8))
        for k in range(8):
            t = (k + 0.6) / 8.6; x = 2.64 + (2.26 - 2.64) * t; z = Z_DECK + (ROOF_SH + 0.25 - Z_DECK) * t
            objs.append(cyl('rung%d' % k, (x, -1.45, z), (x, -0.95, z), 0.016, C['steel'], 6))
        # inside: the hold hatch; no hauler in the model (Jonas 18.10.2026: no boat carries modelled gear), the bought one is drawn at the anchor
        objs.append(box('hatch_coaming', 3.92, 5.48, -0.72, 0.72, Z_DECK, Z_DECK + 0.26, C['deck'], 0.02))
        objs.append(box('hatch_cover', 3.88, 5.52, -0.76, 0.76, Z_DECK + 0.26, Z_DECK + 0.31, C['inner'], 0.015))
    return objs, glass


# ---------- the wheelhouse on the forecastle ----------
WH_YC = 0.13; WH_FLOOR = 3.25; WH_SILL = 4.0; WH_TOP = 5.10; LEAN = 0.47
def wh_ring(z):
    d = LEAN * max(0.0, z - WH_SILL)
    return [(5.95, -1.50, z), (7.97 + d, -1.50, z), (8.45 + d, -1.00, z), (8.45 + d, 1.26, z), (7.97 + d, 1.76, z), (5.95, 1.76, z)]

def roof_z(x): return 5.18 + 0.42 * max(0.0, min(1.0, (x - 5.83) / (9.09 - 5.83)))

def wh_faces():
    """(origin, u, v) for each wall carrying windows: front, the two corners, the two sides; u along the wall, v up it"""
    vl = (LEAN, 0, 1.0)
    F = []
    F.append(('front', (8.45, WH_YC, WH_SILL), (0, 1, 0), vl, [(-0.74, 0.66), (0.0, 0.66), (0.74, 0.66)]))
    for nm, a, b in (('corner_p', (8.45, 1.26), (7.97, 1.76)), ('corner_s', (7.97, -1.50), (8.45, -1.00))):
        u = (b[0] - a[0], b[1] - a[1], 0); mid = ((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, WH_SILL)
        F.append((nm, mid, u, vl, [(0.0, 0.50)]))
    F.append(('side_p', (0, 1.76, WH_SILL), (-1, 0, 0), (0, 0, 1), [(-7.05, 0.60), (-7.665, 0.42)]))
    F.append(('side_s', (0, -1.50, WH_SILL), (1, 0, 0), (0, 0, 1), [(7.05, 0.60), (7.665, 0.42)]))
    return F

def wheelhouse(fine=True):
    objs = []; glass = []
    shell = loft_rings('wheelhouse', [wh_ring(WH_FLOOR), wh_ring(WH_SILL), wh_ring(WH_TOP)], C['white'], angle=25)
    shell.data.materials.append(C['dark']); solidify(shell, 0.06, 1); apply_all(shell)
    if fine:
        cutters = []
        for nm, o, u, v, wins in wh_faces():
            vv = V(v).normalized(); L_ = V(v).length
            for k, (cu, ww) in enumerate(wins):
                v0 = 0.07; v1 = 0.96 if nm.startswith('side') else 1.05
                poly = rrect(cu, (v0 + v1) / 2, ww, v1 - v0, 0.07, 3)
                cutters.append(plate_cutter('wc_%s%d' % (nm, k), o, u, vv, poly, 0.35))
                n = V(u).normalized().cross(vv).normalized()
                outer = rrect(cu, (v0 + v1) / 2, ww + 0.07, v1 - v0 + 0.07, 0.1, 3)
                objs.append(frame_ring('wf_%s%d' % (nm, k), V(o) + n * 0.004, u, vv, outer, poly, C['frame'], 0.0, 0.025))
                glass.append(plate('wg_%s%d' % (nm, k), V(o) - n * 0.03, u, vv, poly, C['glass']))
        cut(shell, cutters)
        # the door aft on the starboard side, with a little window
        objs.append(plate('door', (0, -1.50 - 0.012, 0), (1, 0, 0), (0, 0, 1), [(6.08, 3.32), (6.70, 3.32), (6.70, 5.0), (6.08, 5.0)], C['inner'], 0.0, 0.01))
        glass.append(plate('door_glass', (0, -1.50 - 0.024, 0), (1, 0, 0), (0, 0, 1), rrect(6.39, 4.55, 0.36, 0.5, 0.06, 2), C['glass']))
        # a dark console under the front windows and the wheel, for the helm view
        objs.append(box('console', 7.98, 8.42, -0.95, 1.20, WH_FLOOR, 4.02, C['dark'], 0.02))
        objs.append(torus('wheel', (8.0, -0.55, 4.32), (-0.9, 0, 0.45), 0.20, 0.018, C['dark'], 20, 5))
        objs.append(box('chair', 7.40, 7.80, -0.80, -0.30, WH_FLOOR, 3.78, C['dark'], 0.04))
        objs.append(box('chair_back', 7.30, 7.42, -0.80, -0.30, 3.78, 4.35, C['dark'], 0.03))
    else:
        for nm, o, u, v, wins in wh_faces():
            vv = V(v).normalized(); n = V(u).normalized().cross(vv).normalized()
            for k, (cu, ww) in enumerate(wins):
                objs.append(plate('wd_%s%d' % (nm, k), V(o) + n * 0.004, u, vv, rrect(cu, 0.52, ww, 0.9, 0.06, 1), C['dark']))
    objs.append(shell)
    # roof with overhang, rising towards the visor at the front
    foot = [(p[0], p[1]) for p in wh_ring(WH_TOP)]; ring = offset_poly(foot, 0.12)
    roof = loft_rings('wh_roof', [[(x, y, WH_TOP) for x, y in ring], [(x, y, roof_z(x)) for x, y in ring]], C['white'], angle=30)
    if fine: bevel_mod(roof, 0.03, 2)
    objs.append(roof)
    return objs, glass


# ---------- the forecastle: rails, anchor gear, hatch ----------
def forecastle(fine=True):
    objs = []
    if not fine: return objs
    xs = [7.0, 7.6, 8.2, 8.8, 9.35, 9.85, 10.25]
    for sg in (1, -1):
        for k, x in enumerate(xs):
            y = sg * (y_at(x, z_sheer(x)) - 0.05); objs.append(cyl('bs%d%d' % (k, sg), (x, y, z_sheer(x)), (x, y, 4.66), 0.02, C['steel'], 8))
    for h, nm in ((4.66, 'top'), (4.37, 'mid')):
        pts = [(x, -(y_at(x, z_sheer(x)) - 0.05), h) for x in xs] + [(10.45, -0.35, h), (10.55, 0.0, h), (10.45, 0.35, h)] + [(x, y_at(x, z_sheer(x)) - 0.05, h) for x in reversed(xs)]
        objs.append(tube('bakk_rail_' + nm, pts, 0.024 if nm == 'top' else 0.018, C['steel'], 8))
    zb = z_bakk(10.0)
    objs.append(box('windlass_base', 9.85, 10.30, -0.25, 0.25, zb, zb + 0.16, C['red'], 0.02))
    objs.append(cyl('gypsy', (10.06, -0.22, zb + 0.32), (10.06, 0.22, zb + 0.32), 0.14, C['red'], 18))
    objs.append(cyl('wl_motor', (10.06, 0.22, zb + 0.30), (10.06, 0.46, zb + 0.30), 0.10, C['dark'], 14))
    objs.append(tube('chain', [(10.12, 0, zb + 0.44), (10.55, 0, 3.96), (10.92, 0, 3.94)], 0.025, C['dark'], 6))
    for sy in (0.11, -0.11): objs.append(box('roller_cheek%d' % int(sy * 100), 10.50, 11.02, sy - 0.015, sy + 0.015, 3.78, 4.02, C['steel'], 0.01))
    objs.append(cyl('bow_roller', (10.95, -0.1, 3.88), (10.95, 0.1, 3.88), 0.07, C['dark'], 14))
    # the anchor stowed in the roller, its flukes against the stem
    objs.append(cyl('anchor_shank', (10.66, 0, 4.03), (11.02, 0, 3.90), 0.03, C['dark'], 8))
    objs.append(loft_rings('anchor_fluke', [[(11.00, -0.13, 3.86), (11.00, 0.13, 3.86), (11.06, 0.0, 3.62)], [(11.05, -0.13, 3.88), (11.05, 0.13, 3.88), (11.10, 0.0, 3.64)]], C['dark']))
    objs.append(cyl('capstan_post', (9.2, 0, z_bakk(9.2)), (9.2, 0, 4.0), 0.12, C['red'], 14))
    objs.append(cyl('capstan_drum', (9.2, 0, 4.0), (9.2, 0, 4.42), 0.19, C['red'], 20, r1=0.16))
    objs.append(box('fore_hatch', 8.95, 9.45, 1.00, 1.50, z_bakk(9.2), z_bakk(9.2) + 0.16, C['inner'], 0.02))
    for x, y in ((10.15, 0.72), (10.15, -0.72), (7.3, 1.75), (7.3, -1.75)):
        zb2 = z_bakk(x)
        objs.append(box('bp%d' % int(x * 10 + y * 100), x - 0.12, x + 0.12, y - 0.06, y + 0.06, zb2, zb2 + 0.04, C['dark']))
        for dx in (-0.07, 0.07): objs.append(cyl('bol%d%d' % (int(x * 10 + y * 100), int(dx * 100)), (x + dx, y, zb2), (x + dx, y, zb2 + 0.28), 0.045, C['dark'], 10))
    return objs


# ---------- masts, rigging and the aft deck ----------
TABLE = (3.3, 4.2, -1.92, -1.3)      # x0, x1, y0, y1 of the gutting table under the shelter, starboard side
RDM = (7.1, 1.0, roof_z(7.1 + 0.33) + 0.02)      # the radome's foot on the wheelhouse roof, forward to port: a plate with its top level over the roof's rise

def rig(fine=True):
    objs = []; seg = 12 if fine else 6
    zr = roof_z(6.47)
    objs.append(cyl('fmast', (6.47, WH_YC, zr), (6.47, WH_YC, 9.09), 0.065, C['mast'], seg))
    objs.append(cyl('amast', (1.62, 0, Z_DECK), (1.62, 0, 8.85), 0.08, C['mast'], seg))
    # the radar arm forward from the mast with a plate at its end, where the open array the player buys stands (kit.radarA: its bar turns
    # clear of the mast and the fishing lights); the dome he can buy stands on a foot on the roof (kit.radar)
    objs.append(box('radar_arm', 6.47, 7.78, WH_YC - 0.04, WH_YC + 0.04, 7.21, 7.29, C['mast']))
    objs.append(box('radar_plate', 7.12, 7.72, WH_YC - 0.3, WH_YC + 0.3, 7.21, 7.29, C['mast'], 0.01 if fine else 0))
    objs.append(box('radome_foot', RDM[0] - 0.33, RDM[0] + 0.33, RDM[1] - 0.33, RDM[1] + 0.33, roof_z(RDM[0] - 0.33) - 0.03, RDM[2], C['mast'], 0.01 if fine else 0))
    if not fine: return objs
    objs.append(cyl('radar_strut', (6.53, WH_YC, 6.62), (7.3, WH_YC, 7.21), 0.03, C['mast'], 8))
    objs.append(box('arm2', 6.47, 7.88, WH_YC - 0.035, WH_YC + 0.035, 6.47, 6.53, C['mast']))
    objs.append(cyl('dome_post', (7.55, WH_YC, 6.53), (7.55, WH_YC, 6.66), 0.03, C['mast'], 8))
    objs.append(sphere('satdome', (7.55, WH_YC, 6.84), 0.22, C['white'], (1, 1, 0.95)))
    objs.append(box('tbar', 6.45, 6.49, WH_YC - 0.28, WH_YC + 0.28, 9.0, 9.05, C['mast']))
    for sy in (-0.25, 0.25): objs.append(cyl('whip%d' % int(sy * 100), (6.47, WH_YC + sy, 9.05), (6.47, WH_YC + sy, 9.75), 0.012, C['white'], 6))
    objs.append(cyl('topmast', (6.47, WH_YC, 9.09), (6.47, WH_YC, 9.2), 0.04, C['lwhite'], 10))
    for z, m in ((8.82, C['lred']), (7.85, C['lwhite'])): objs.append(box('mhl%d' % int(z * 10), 6.53, 6.65, WH_YC - 0.05, WH_YC + 0.05, z - 0.06, z + 0.06, m, 0.01))   # the fishing lights, red over white
    objs.append(box('arm2_light', 7.82, 7.94, WH_YC - 0.05, WH_YC + 0.05, 6.39, 6.47, C['lwhite']))
    objs.append(cyl('fstay', (6.50, WH_YC, 7.55), (7.85, WH_YC, roof_z(7.85)), 0.032, C['mast'], 8))
    # the derrick over the shelter, its topping lift and the hook
    tip = (4.50, WH_YC, 7.70)
    objs.append(cyl('derrick', (6.38, WH_YC, 5.48), tip, 0.05, C['mast'], 10))
    objs.append(cyl('topping', tip, (6.47, WH_YC, 7.65), 0.008, C['dark'], 4))
    objs.append(sphere('d_block', (4.48, WH_YC, 7.62), 0.07, C['dark']))
    objs.append(cyl('hookline', (4.48, WH_YC, 7.58), (4.48, WH_YC, 5.95), 0.008, C['dark'], 4))
    objs.append(torus('hook', (4.48, WH_YC, 5.88), (0, 1, 0), 0.06, 0.012, C['dark'], 12, 4))
    # searchlight and horn on the roof, the side lights
    zr2 = roof_z(7.8)
    objs.append(cyl('sl_post', (7.80, WH_YC + 0.4, zr2), (7.80, WH_YC + 0.4, zr2 + 0.32), 0.03, C['mast'], 8))
    objs.append(cyl('searchlight', (7.70, WH_YC + 0.4, zr2 + 0.40), (7.96, WH_YC + 0.4, zr2 + 0.40), 0.09, C['dark'], 14))
    objs.append(cyl('horn', (7.72, WH_YC - 0.3, zr2 + 0.18), (8.02, WH_YC - 0.3, zr2 + 0.22), 0.03, C['white'], 10, r1=0.08))
    for y, m in ((1.55, C['lred']), (-1.29, C['lgreen'])):
        objs.append(box('sidelight%d' % int(y * 10), 8.62, 8.80, y - 0.05, y + 0.05, roof_z(8.7) - 0.02, roof_z(8.7) + 0.10, m, 0.01))
    # the aft mast: a bipod to the stern frame, a leg forward to the shelter roof, the boom, and the net roller over the stern
    objs.append(cyl('amast_top', (1.62, 0, 8.85), (1.62, 0, 8.90), 0.10, C['mast'], 12))
    for sy in (0.62, -0.62): objs.append(cyl('aleg%d' % int(sy * 100), (1.62, 0, 7.40), (0.28, sy, 5.05), 0.05, C['mast'], 10))
    objs.append(cyl('aleg_f', (1.62, 0, 7.05), (2.55, 0, ROOF_SH), 0.05, C['mast'], 10))
    objs.append(cyl('aboom', (1.62, 0, 7.60), (0.38, 0, 8.30), 0.045, C['mast'], 10))
    objs.append(cyl('aboom_stay', (0.40, 0, 8.30), (1.62, 0, 8.62), 0.008, C['dark'], 4))
    objs.append(box('awinch', 1.35, 1.89, -0.22, 0.22, 4.05, 4.75, C['red'], 0.03))
    for sy in (0.62, -0.62): objs.append(box('frame_beam%d' % int(sy * 100), -0.62, 1.64, sy - 0.045, sy + 0.045, 4.95, 5.05, C['mast'], 0.01))
    for x in (-0.62, 0.28): objs.append(box('frame_x%d' % int(x * 100), x - 0.045, x + 0.045, -0.66, 0.66, 4.95, 5.05, C['mast'], 0.01))
    for sy in (0.56, -0.56): objs.append(box('roller_hanger%d' % int(sy * 100), -0.50, -0.34, sy - 0.015, sy + 0.015, 4.40, 4.95, C['mast']))
    objs.append(cyl('net_roller', (-0.42, -0.54, 4.52), (-0.42, 0.54, 4.52), 0.15, C['red'], 18))
    for sy in (0.54, -0.54): objs.append(cyl('rflange%d' % int(sy * 100), (-0.42, sy - 0.01, 4.52), (-0.42, sy + 0.01, 4.52), 0.25, C['red'], 18))
    objs.append(cyl('roller_motor', (-0.42, 0.58, 4.52), (-0.42, 0.78, 4.52), 0.09, C['dark'], 12))
    objs.append(box('sternlight', -0.68, -0.58, -0.05, 0.05, 5.05, 5.15, C['lwhite']))
    objs.append(cyl('wire', (1.62, 0, 8.0), (6.47, WH_YC, 8.0), 0.007, C['dark'], 4))
    objs.append(cyl('flagpole', (-0.36, 1.62, 3.78), (-0.52, 1.62, 4.95), 0.02, C['rope'], 8))
    # the aft deck: a casing to port, the exhaust, freeing ports (the tubs and the fish boxes are the game's deck kit)
    objs.append(box('casing', 1.0, 2.85, 1.02, 1.92, Z_DECK, 3.35, C['white'], 0.04))
    objs.append(plate('casing_door', (0, 1.02 - 0.008, 0), (1, 0, 0), (0, 0, 1), [(1.55, 2.34), (2.25, 2.34), (2.25, 3.22), (1.55, 3.22)], C['inner'], 0.0, 0.01))
    objs.append(tube('exhaust', [(2.73, 1.0, 3.35), (2.73, 1.0, 5.10), (2.75, 1.0, 5.22), (2.84, 1.0, 5.28), (2.93, 1.0, 5.22)], 0.07, C['steel'], 12))
    # the gutting table under the shelter to starboard (B6), its top a working height over the deck, a lip outboard
    x0, x1, y0, y1 = TABLE; zt = Z_DECK + 0.9
    objs.append(box('table_top', x0, x1, y0, y1, zt - 0.05, zt, C['steel'], 0.01))
    objs.append(box('table_lip', x0, x1, y0 - 0.02, y0, zt - 0.05, zt + 0.12, C['steel']))
    for x, y in ((x0 + 0.05, y0 + 0.05), (x1 - 0.05, y0 + 0.05), (x0 + 0.05, y1 - 0.05), (x1 - 0.05, y1 - 0.05)): objs.append(cyl('tleg%d' % int(x * 10 + y * 3), (x, y, Z_DECK), (x, y, zt - 0.05), 0.02, C['steel'], 6))
    for sg in (1, -1):
        for x in (0.6, 1.6):
            yo = y_at(x, 2.4) + 0.006
            objs.append(plate('fp%d%d' % (int(x * 10), sg), (0, sg * yo, 0), (1, 0, 0), (0, 0, 1), rrect(x, 2.42, 0.42, 0.18, 0.04, 2), C['dark'], nrm=(0, sg, 0)))
    # fuel filler on the port side deck, stairs up to the forecastle walkway
    objs.append(cyl('filler', (4.6, 1.80, Z_DECK), (4.6, 1.80, Z_DECK + 0.08), 0.05, C['steel'], 10))
    for k in range(3):
        objs.append(box('step%d' % k, 6.02 + 0.17 * k, 6.55, -1.96, -1.52, Z_DECK + 0.33 * k, Z_DECK + 0.33 * (k + 1), C['deck'], 0.01))
    return objs


def build(fine=True):
    """all the parts: solids (to be joined and baked) and glass"""
    hull, rows = build_hull(fine)
    if fine:
        for o in hull: tint_obj(o, wear)
    solids = list(hull)
    solids += bulwark_inner(XA, 6.55, lambda x: Z_DECK, 'bw_aft', fine)
    solids += bulwark_inner(6.55, 10.70, z_bakk, 'bw_fwd', fine)
    solids.append(transom_inner(fine))
    solids.append(deck(XA, 6.55, lambda x: Z_DECK, 0.08, 'main_deck', C['deck'], fine))
    solids.append(deck(6.55, 10.66, z_bakk, 0.06, 'bakk_deck', C['deck'], fine))
    solids += underwater(fine)
    solids.append(fender_strake(fine))
    o, g1 = shelter(fine); solids += o
    o, g2 = wheelhouse(fine); solids += o
    solids += forecastle(fine)
    solids += rig(fine)
    return solids, g1 + g2


from mathutils import noise
def n3(x, y, z=0.0): return noise.noise(Vector((x, y, z)))
def ss(a, b, x):
    t = max(0.0, min(1.0, (x - a) / (b - a) if b != a else 0.0)); return t * t * (3 - 2 * t)
def toward(m, rgb, k):
    base = m['rgb']; return [1 + (rgb[i] / max(base[i], 1e-3) - 1) * k for i in range(3)]

def wear(p, m, n):
    """light wear for a boat of 2015 (B16): grime over the boot top and streaks down from the rub rail on the blue, slime on the
    antifouling, rust runs down the white under the bulwark cap; a multiplier of the colour at every corner"""
    x, y, z = p; nm = m.name if m else ''; side = 1 if y > 0 else -1
    if nm == 'hull':
        g = 1 - 0.14 * ss(0.35, 0.0, z - Z_BT)
        g *= 1 - 0.10 * ss(0.25, 0.65, n3(x * 9.0, side * 2.3, 0.4)) * ss(0.6, 0.0, z_rub(x) - z)
        g *= 0.97 + 0.05 * n3(x * 4.0, z * 7.0, side * 1.3)
        return [g, g, g]
    if nm == 'antifouling':
        v = 0.84 + 0.26 * n3(x * 2.5, z * 6.0, y * 2.0) + 0.12 * ss(Z_AF - 0.3, Z_AF, z); return [v, v * 1.02, v * 0.98]
    if nm == 'house' and z < Z_DECK + 1.2 and abs(y) > 1.6:
        return toward(m, (0.45, 0.25, 0.12), 0.45 * ss(0.5, 0.85, n3(x * 7.0, side * 4.0, 1.1)) * ss(0.8, 0.0, z - Z_DECK))
    return None

def tint_obj(o, fn):
    """writes the per-corner TINT colour attribute of a mesh object from fn(point, material, face normal) -> rgb or None"""
    me = o.data; lay = me.color_attributes.get('TINT') or me.color_attributes.new('TINT', 'FLOAT_COLOR', 'CORNER')
    for poly in me.polygons:
        m = me.materials[poly.material_index] if me.materials else None
        for li in poly.loop_indices:
            t = fn(me.vertices[me.loops[li].vertex_index].co, m, poly.normal)
            lay.data[li].color = (t[0], t[1], t[2], 1.0) if t else (1.0, 1.0, 1.0, 1.0)

def to_game(p): return (-p[1], p[2] - WL, -(p[0] - XM))
def to_game_n(n): return (-n[1], n[2], -n[0])

def name_strips(G):
    """where the name is written (B12): on the blue topsides forward under the rub rail, both sides, and across the transom"""
    out = []
    for sg, xs in ((1, [8.9 - 1.3 * k / 12 for k in range(13)]), (-1, [7.6 + 1.3 * k / 12 for k in range(13)])):
        B = []; T = []
        for x in xs:
            for arr, dz in ((B, 0.72), (T, 0.36)): z = z_rub(x) - dz; arr.append(G(x, sg * (y_at(x, z) + 0.03), z))
        out.append([B, T])
    ys = [0.9 - 1.8 * k / 12 for k in range(13)]      # port to starboard: left to right seen from astern
    out.append([[G(x_transom(2.0) - 0.02, y, 2.0) for y in ys], [G(x_transom(2.34) - 0.02, y, 2.34) for y in ys]])
    return out

def anchors():
    G = lambda x, y, z: [round(v, 3) for v in to_game((x, y, z))]
    return {'eye': G(7.80, -0.55, 4.86), 'skipperAt': G(7.62, -0.55, WH_FLOOR), 'hp': -0.06, 'fov': 58,
            'crewSpots': [G(5.05, -1.15, Z_DECK + 0.04) + [1.57], G(4.25, -0.35, Z_DECK + 0.04) + [0.0], G(1.25, -0.55, Z_DECK + 0.04) + [3.14], G(0.55, 0.65, Z_DECK + 0.04) + [3.14]],
            'hauler': G(5.30, -1.62, 3.52), 'filler': G(4.6, 1.80, Z_DECK + 0.1), 'pole': G(-0.52, 1.62, 4.95),
            'lights': [[G(6.47, WH_YC, 9.16), [1, 0.95, 0.85], 'allround'], [G(8.71, 1.55, roof_z(8.7) + 0.04), [1, 0.12, 0.1], 'port'],
                       [G(8.71, -1.29, roof_z(8.7) + 0.04), [0.1, 1, 0.35], 'stbd'], [G(-0.63, 0, 5.10), [1, 0.95, 0.85], 'stern']],
            # the doors (B4): the wheelhouse door aft on the starboard side, out onto the forecastle walkway, and the casing's door on the aft deck
            'doors': [{'at': G(6.39, -1.52, 3.32), 'w': 0.62, 'h': 1.68, 'in': G(6.39, -0.9, WH_FLOOR), 'to': 'helm', 'hinge': 'fwd'},
                      {'at': G(1.9, 1.0, Z_DECK), 'w': 0.7, 'h': 0.88, 'in': G(1.9, 1.5, Z_DECK), 'to': 'casing', 'hinge': 'aft'}],
            'names': name_strips(G),
            'work': {'table': G((TABLE[0] + TABLE[1]) / 2, (TABLE[2] + TABLE[3]) / 2, Z_DECK), 'tub': G(0.55, -1.37, Z_DECK), 'own': True, 'top': round(Z_DECK + 0.9 - WL, 3)},
            'hatch': G(4.7, 0.0, Z_DECK + 0.31),
            'deck': {'y': round(Z_DECK - WL, 3), 'z': round(-(4.5 - XM), 3)}, 'gw': round(z_sheer(4.5) - WL, 3),
            'stern': round(-(XA - XM) + 0.2, 3), 'bow': round(-(10.3 - XM), 3), 'side': 1.89, 'beam': 4.2, 'pl': 4.4, 'rl': 1.6, 'open': False, 'hand': False,
            'kit': kit(G)}


def kit(G):
    """the places of the deck kit (tools/deck, drawn by the game; the user's wish 19.10.2026), in the game's frame: the liferaft in its
    cradle on the shelter roof where the old one lay, athwartships; two buoys on the inside of the high aft bulwarks, one a side, clear of
    the casing, the ladder and the crew; the dome on its foot on the wheelhouse roof, the open array on the radar arm's plate; the net tub
    and the line tubs (never aboard together) under the shelter to port, across the hatch from the hauler (the starboard side is the
    hauler's, the table's and the crew's), the line tubs set so the fuel filler stands between two rows; the deck cargo on the hatch
    cover and on the aft deck by the ladder. The main deck has 8 cm of camber: a place stands at the mean of the deck under it."""
    r = lambda v: round(v, 3); h = math.pi / 2
    yi = lambda x: max(0.03, y_at(x, Z_DECK) - T_BW)
    zc = lambda x, ys: Z_DECK + sum(0.08 * (1 - (y / yi(x)) ** 2) for y in ys) / len(ys)        # the cambered deck under the place
    def wall(x, sg, z=3.45):  # a buoy bracket on the bulwark's inner face, its +z inboard (away from the wall); the bulwark flares out
        # as it rises, so the bracket stands off the wall as far as the face comes in at the ring's foot
        return G(x, sg * (y_at(x, z - 0.62) - T_BW - 0.01), z) + [r(sg * h)]
    return {'raft': [G(3.4, 0.9, ROOF_SH) + [0.0]],
            'buoys': [wall(2.0, -1), wall(0.45, 1)],
            'radar': G(RDM[0], RDM[1], RDM[2]),
            'radarA': G(7.42, WH_YC, 7.29),
            'garn': {'at': G(5.28, 1.35, zc(5.28, (0.85, 1.85))), 'ry': 0.0},
            'stamps': {'at': G(5.35, 1.57, zc(5.35, (1.05, 1.57))), 'ry': 0.0},
            'cargo': [G(5.0, 0.0, Z_DECK + 0.31) + [r(h)], G(2.35, -0.48, zc(2.35, (-0.88, -0.08))) + [0.0]]}


def check_overlay(objs):
    """the model drawn over the drawing: side view at 92.4 px/m (profile) and from above (plan)"""
    from PIL import Image
    S = 92.4; X0 = 185.1; Z0 = 873.0; Y0 = 1221.0
    setup_render(1408, 980, samples=8, transparent=True)
    camera((( 704 - X0) / S, -40, (Z0 - 490) / S), ((704 - X0) / S, 0, (Z0 - 490) / S), ortho=1408 / S)
    render(os.path.join(OUT, 'ov_side.png'))
    bpy.context.scene.render.resolution_y = 460
    c = camera(((704 - X0) / S, -(1225 - Y0) / S, 40), ((704 - X0) / S, -(1225 - Y0) / S, 0), ortho=1408 / S)
    c.rotation_euler = (0, 0, 0)
    render(os.path.join(OUT, 'ov_top.png'))
    if not DRAWING: return
    for nm, box in (('ov_side.png', (0, 0, 1408, 980)), ('ov_top.png', (0, 995, 1408, 1455))):
        on_drawing(os.path.join(OUT, nm), DRAWING, box, os.path.join(OUT, nm.replace('.png', '_on_ga.png')))


SHOTS = [('bow3q', (17.5, -12.5, 5.2), (5.0, 0, 3.4), 35), ('stern3q', (-8.5, 11.0, 6.2), (4.0, 0, 3.4), 35), ('side', (5.0, -21, 2.6), (5.0, 0, 3.6), 35),
         ('above', (13.0, -9.0, 15.0), (5.0, 0, 3.0), 35), ('deck', (1.5, -4.5, 6.6), (5.5, 0.5, 3.0), 24),
         ('stern', (-13.0, 0.5, 4.2), (3.0, 0, 3.4), 30), ('shelter', (0.5, -9.5, 5.0), (4.5, -0.6, 3.0), 40), ('bow', (16.0, 3.0, 4.0), (6.0, 0, 3.4), 40)]

def main():
    os.makedirs(OUT, exist_ok=True)
    only_check = len(sys.argv) > 1 and sys.argv[1] == 'check'
    reset(); colours()
    solids, glass = build(True)
    if only_check:
        check_overlay(solids); return
    join(solids, 'BOAT0'); join(glass, 'GLASS0')
    if 'fast' not in sys.argv:
        check_overlay([bpy.data.objects['BOAT0']]); beauty(OUT, 'lod0', WL, SHOTS)
    ex = {'frame': 'kystfiske: x starboard, y up from the waterline, z aft; metres', 'type': 'breisjark', 'name': 'Malo 36 (10.99 m)', 'len': 10.99, 'beam': 4.2, 'draft': 2.0,
          'anchors': anchors()}
    export_boat(build, to_game, to_game_n, OUT, 'malo36.glb', os.path.join(ROOT, 'src', 'data', 'boat-malo36.b64'), ex,
                side=(os.path.join(ROOT, 'src', 'data', 'boat-malo36-side.b64'), 5.2, 4.5, 12.4), dry='dry' in sys.argv)


if __name__ == '__main__':
    main()
