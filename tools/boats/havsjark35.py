"""The Viksund Havsjark 35 ft (10.57 m), built in Blender from the yard's profile and deck plan (Viksund Båt Nor AS) and the boats
for sale: length 10.57 m, beam 4.20 m (4.1 m moulded on the plan), draft 1.6 m. A heavy displacement sjark with a long ballast keel,
the wheelhouse amidships on a short forecastle, the hold and a gear room aft, and a riding sail on the aft mast. The drawings are
not in the repository; the numbers below were measured from them (profile 156.3 px/m, plan 152 px/m, both set to 10.57 m overall).
Where the drawings say nothing (colours, the window panes, the hauler) the choices are ours. Exterior only.

    pip install bpy==4.5.4
    python3 tools/boats/havsjark35.py            -> src/data/boat-havsjark35.b64 (+ the side picture), renders in tools/boats/out/
    python3 tools/boats/havsjark35.py check      -> only the overlays on the drawings (HAVSJARK_PROFIL, HAVSJARK_GA)
    python3 tools/boats/havsjark35.py fast dry   -> no renders to look at, and the GLB only in tools/boats/out

Frame: x forward from the aft end of the hull at the fender strake, y to port, z up from the waterline."""
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy
from bpyutil import *

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE)); OUT = os.path.join(HERE, 'out')
PROFIL = os.environ.get('HAVSJARK_PROFIL', ''); GA = os.environ.get('HAVSJARK_GA', '')
WL = 0.0; XF = 10.60; XM = XF / 2


# ---------- measured lines (metres) ----------
# the bottom of the hull body on the centreline (the ballast keel is separate), then up the stem; the stem knuckles at the strake
LOW = [(0.0, -0.18), (1.0, -0.33), (2.0, -0.50), (3.0, -0.64), (4.0, -0.74), (5.0, -0.80), (6.0, -0.82), (7.0, -0.78), (8.0, -0.66),
       (8.6, -0.50), (9.1, -0.29), (9.5, 0.0), (9.8, 0.44), (10.1, 0.88), (10.35, 1.24), (10.56, 1.55), (10.585, 1.78), (XF, 1.98)]
def z_low(x): return interp(LOW, x)
# the top of the bulwark: the aft deck, the low waist where the line comes in (starboard only), the forecastle (bakk) from 6.05
def z_bakkcap(x): return 1.80 + 0.18 * max(0.0, min(1.0, (x - 6.05) / 4.55)) ** 1.3
def ss(a, b, x): t = max(0.0, min(1.0, (x - a) / (b - a))); return t * t * (3 - 2 * t)
def z_cap(x, sg=1):
    if sg < 0:      # starboard: down to the hauling waist and up to the forecastle
        return 1.48 - 0.20 * ss(3.40, 3.85, x) + (z_bakkcap(x) - 1.28) * ss(5.35, 6.05, x)
    return 1.48 + 0.02 * ss(3.40, 5.35, x) + (z_bakkcap(x) - 1.50) * ss(5.35, 6.05, x)
# half-breadth at the bulwark top, moulded (the plan's outline less the strake), and the section: deadrise, flare, bilge radius
HB = [(0.0, 1.70), (0.14, 1.76), (0.41, 1.79), (0.74, 1.81), (1.38, 1.84), (2.04, 1.87), (2.70, 1.90), (3.36, 1.93), (4.03, 1.96), (4.68, 1.98),
      (5.34, 1.99), (6.00, 1.98), (6.66, 1.96), (7.32, 1.92), (7.97, 1.83), (8.63, 1.68), (9.29, 1.43), (9.62, 1.26), (9.95, 1.03), (10.28, 0.70),
      (10.47, 0.38), (10.56, 0.16), (XF, 0.0)]
def hb(x): return interp(HB, x)
DR = [(0.0, 8), (2.0, 12), (4.0, 16), (6.0, 20), (7.5, 28), (8.5, 40), (9.3, 55), (10.0, 68), (XF, 75)]
FL = [(0.0, 2), (3.0, 3), (6.0, 5), (7.5, 9), (8.5, 15), (9.5, 22), (XF, 28)]
RB = [(0.0, 0.45), (2.0, 0.55), (5.0, 0.62), (7.0, 0.7), (8.5, 0.8), (9.5, 0.6), (10.2, 0.35), (XF, 0.2)]
# the fender strake, the painted line at the deck, and the bottom paint
RUB = [(0.0, 1.05), (2.0, 1.07), (4.0, 1.12), (6.0, 1.18), (7.74, 1.25), (9.0, 1.38), (10.0, 1.50), (10.56, 1.60)]
def z_rub(x): return interp(RUB, x)
def z_line(x): return 0.66 + 0.012 * x
Z_AF = 0.06; Z_BT = 0.16
def z_deck(x): return 0.56 + 0.01 * x
def z_bk(x): return z_bakkcap(x) - 0.06
X_BAKK = 6.05
# the transom rakes aft from the bottom to the strake, and the bulwark above it leans in
def x_t(z): return 0.30 - 0.2857 * z if z <= 1.05 else (z - 1.05) * 0.42
def X(s, z): return s + x_t(z) * max(0.0, 1.0 - s)          # a station's points: the first metre follows the transom's rake
# the ballast keel: its bottom, from the propeller aperture to the forefoot, and its thickness
KEEL = [(1.79, -1.78), (3.58, -1.68), (4.22, -1.60), (6.0, -1.45), (8.06, -1.20), (8.6, -1.05), (9.02, -0.75), (9.30, -0.40), (9.5, -0.02)]
def keel_t(x): return interp([(1.79, 0.24), (2.4, 0.32), (6.5, 0.32), (8.5, 0.22), (9.5, 0.14)], x)


def section(x, n=48):
    """the half-section at station x from the centreline to the port bulwark top, as (y, z): a bottom line with deadrise, a round
    bilge filleted into a side line with flare; starboard uses the same surface cut at its lower bulwark"""
    zl = z_low(x); zs = z_cap(x, 1); h = hb(x)
    if h < 1e-4 or zs - zl < 1e-4: return [(0.0, zl), (0.0, zs)]
    dr = math.radians(interp(DR, x)); fl = math.radians(interp(FL, x)); r = interp(RB, x)
    d1 = (math.cos(dr), math.sin(dr)); d2 = (-math.sin(fl), -math.cos(fl))
    den = d1[0] * d2[1] - d1[1] * d2[0]
    s_ = (h * d2[1] - (zs - zl) * d2[0]) / den
    C = (d1[0] * s_, zl + d1[1] * s_)
    if s_ <= 0 or C[1] >= zs or C[0] >= h + 1e-6:
        return [(h * k / n, zl + (zs - zl) * k / n) for k in range(n + 1)]
    ua = (-d1[0], -d1[1]); ub = (h - C[0], zs - C[1]); lb = math.hypot(*ub); ub = (ub[0] / lb, ub[1] / lb)
    th = math.acos(max(-1, min(1, ua[0] * ub[0] + ua[1] * ub[1])))
    dt = min(r / max(1e-6, math.tan(th / 2)), 0.85 * s_, 0.85 * lb); rr = dt * math.tan(th / 2)
    T1 = (C[0] + ua[0] * dt, C[1] + ua[1] * dt); T2 = (C[0] + ub[0] * dt, C[1] + ub[1] * dt)
    bis = (ua[0] + ub[0], ua[1] + ub[1]); bl = math.hypot(*bis); bis = (bis[0] / bl, bis[1] / bl)
    cd = rr / math.sin(th / 2); O = (C[0] + bis[0] * cd, C[1] + bis[1] * cd)
    a1 = math.atan2(T1[1] - O[1], T1[0] - O[0]); a2 = math.atan2(T2[1] - O[1], T2[0] - O[0])
    a2 = a1 + (a2 - a1 + math.pi) % (2 * math.pi) - math.pi
    out = [(0.0, zl)]; nb = max(2, n // 4); na = max(4, n // 2); ns = max(2, n // 4)
    for k in range(1, nb + 1): t = k / nb; out.append((T1[0] * t, zl + (T1[1] - zl) * t))
    for k in range(1, na + 1): a = a1 + (a2 - a1) * k / na; out.append((O[0] + rr * math.cos(a), O[1] + rr * math.sin(a)))
    for k in range(1, ns + 1): t = k / ns; out.append((T2[0] + (h - T2[0]) * t, T2[1] + (zs - T2[1]) * t))
    return out

def clip(sec, ztop):
    """the section up to ztop"""
    out = [sec[0]]
    for a, b in zip(sec, sec[1:]):
        if b[1] >= ztop:
            t = (ztop - a[1]) / max(1e-9, b[1] - a[1]); out.append((a[0] + (b[0] - a[0]) * t, ztop)); return out
        out.append(b)
    return out

SEC = {}
def sec_of(x, sg=1):
    k = (round(x, 4), sg)
    if k not in SEC:
        s = section(x); SEC[k] = s if sg > 0 else clip(s, z_cap(x, -1))
    return SEC[k]

def y_at(x, z, sg=1):
    """the half-breadth of the outside of the hull at station x and height z"""
    s = sec_of(x, sg)
    if z <= s[0][1]: return 0.0
    for a, b in zip(s, s[1:]):
        if a[1] <= z <= b[1] and b[1] > a[1]: return a[0] + (b[0] - a[0]) * (z - a[1]) / (b[1] - a[1])
    return s[-1][0]


def stations(fine=True):
    if fine:
        xs = [0.0, 0.03, 0.08, 0.15, 0.25, 0.4, 0.6, 0.8] + [1.0 + 0.25 * i for i in range(37)] + [3.4 + 0.075 * i for i in range(7)] + \
             [5.35 + 0.07 * i for i in range(11)] + [10.1, 10.2, 10.3, 10.38, 10.45, 10.5, 10.54, 10.565, 10.58, 10.59, XF]
    else:
        xs = [0.0, 0.25, 1.0, 2.0, 3.4, 3.85, 5.0, 5.35, 5.7, 6.05, 7.0, 8.0, 9.0, 9.6, 10.1, 10.4, 10.55, XF]
    return sorted(set(round(x, 4) for x in xs if x <= XF))


C = {}
def colours():
    C['af'] = mat('antifouling', (0.42, 0.10, 0.07), 0.1)
    C['boot'] = mat('boot', (0.05, 0.05, 0.06), 0.5, zone=2)
    C['hull'] = mat('hull', (0.90, 0.91, 0.90), 0.6, zone=1)
    C['stripe'] = mat('stripe', (0.60, 0.07, 0.06), 0.55, zone=2)
    C['cap'] = mat('cap', (0.46, 0.07, 0.06), 0.5)
    C['white'] = mat('white', (0.92, 0.93, 0.92), 0.5)
    C['inner'] = mat('inner', (0.85, 0.86, 0.85), 0.3)
    C['deck'] = mat('deck', (0.42, 0.47, 0.43), 0.12)
    C['roof'] = mat('roof', (0.80, 0.82, 0.81), 0.3)
    C['steel'] = mat('steel', (0.74, 0.76, 0.78), 0.85, metal=0.8)
    C['mast'] = mat('mast', (0.88, 0.89, 0.88), 0.55)
    C['dark'] = mat('dark', (0.10, 0.11, 0.12), 0.25)
    C['frame'] = mat('frame', (0.07, 0.07, 0.08), 0.45)
    C['glass'] = mat('glass', (0.05, 0.08, 0.11), 0.95)
    C['prop'] = mat('bronze', (0.70, 0.52, 0.27), 0.8, metal=0.9)
    C['zinc'] = mat('zinc', (0.62, 0.63, 0.64), 0.4)
    C['orange'] = mat('orange', (0.95, 0.38, 0.06), 0.45)
    C['red'] = mat('machine', (0.72, 0.18, 0.08), 0.5)
    C['tub'] = mat('tub', (0.10, 0.36, 0.64), 0.45)
    C['box'] = mat('fishbox', (0.86, 0.88, 0.90), 0.4)
    C['rope'] = mat('rope', (0.85, 0.75, 0.25), 0.2)
    C['sail'] = mat('sail', (0.88, 0.84, 0.72), 0.15)
    C['lred'] = mat('light_red', (0.9, 0.1, 0.08), 0.8, emit=0.5)
    C['lgreen'] = mat('light_green', (0.1, 0.8, 0.25), 0.8, emit=0.5)
    C['lwhite'] = mat('light_white', (1.0, 0.97, 0.88), 0.8, emit=0.5)


def band_mat(z, x):
    if z < Z_AF - 1e-4: return C['af']
    if z < Z_BT - 1e-4: return C['boot']
    zl = z_line(x)
    if zl - 1e-4 <= z < zl + 0.06 - 1e-4: return C['stripe']
    return C['hull']


# ---------- the hull ----------
OUTH = lambda c: (0, c.y, c.z - 0.3)

def hull_rows(sg, fine=True):
    rows = []
    for x in stations(fine):
        sec = sec_of(x, sg); zt = sec[-1][1]; zl = z_line(x)
        bands = [(Z_AF, 10 if fine else 3), (Z_BT, 2 if fine else 1)]
        if zl + 0.06 < zt: bands += [(zl, 8 if fine else 3), (zl + 0.06, 1)]
        bands.append((None, 8 if fine else 2))
        rows.append([(X(x, z), sg * y, z) for y, z in resample(sec, bands)])
    return rows

def build_hull(fine=True):
    objs = []; first = {}
    for sg, nm in ((1, 'p'), (-1, 's')):
        rows = hull_rows(sg, fine); first[sg] = rows[0]
        def mf(i, j, rows=rows):
            a = rows[i][j]; b = rows[i + 1][j + 1]; return band_mat((a[2] + b[2]) / 2, (a[0] + b[0]) / 2)
        objs.append(grid('hull_' + nm, rows, mf, out=OUTH))
    # the transom: a ladder across the first section (both sides end at the same height there)
    T = [[q, p] for p, q in zip(first[1], first[-1])]
    objs.append(grid('transom', T, lambda i, j: band_mat((T[i][0][2] + T[i + 1][0][2]) / 2, 0.0), angle=20, out=lambda c: (-1, 0, 0)))
    return objs


T_BW = 0.07     # bulwark thickness

def bulwark_inner(x0, x1, deckf, name, fine=True):
    objs = []
    for sg, nm in ((1, 'p'), (-1, 's')):
        xs = [x for x in stations(fine) if x0 <= x <= x1]
        if xs[0] > x0: xs = [x0] + xs
        if xs[-1] < x1: xs.append(x1)
        rows = []; caps = []
        for x in xs:
            zd = deckf(x); zs = z_cap(x, sg)
            if zs - zd < 0.02: zs = zd + 0.02
            row = []
            for k in range(6):
                z = zd + (zs - zd) * k / 5; row.append((X(x, z) + T_BW * max(0.0, 1 - x / 0.3), sg * max(0.02, y_at(x, z, sg) - T_BW), z))
            rows.append(row)
            yo = y_at(x, zs, sg); xx = X(x, zs)
            caps.append([(xx, sg * (yo + 0.014), zs - 0.012), (xx, sg * (yo - T_BW / 2), zs + 0.03), (xx + T_BW * max(0.0, 1 - x / 0.3), sg * max(0.02, yo - T_BW - 0.014), zs - 0.012)])
        objs.append(grid(name + '_in_' + nm, rows, lambda i, j: C['inner'], out=lambda c, sg=sg: (0.001, -sg, 0)))
        objs.append(grid(name + '_cap_' + nm, caps, lambda i, j: C['cap'], angle=60, out=lambda c: (0, 0, 1)))
    return objs

def transom_inner(fine=True):
    zs = z_cap(0.0); rows = []
    for k in range(6):
        z = z_deck(0) + (zs - z_deck(0)) * k / 5; yy = y_at(0.0, z) - T_BW; x = x_t(z) + T_BW
        rows.append([(x, -yy, z), (x, yy, z)])
    objs = [grid('transom_in', rows, lambda i, j: C['inner'], out=lambda c: (1, 0, 0))]
    # the cap across the stern
    z = zs; yy = y_at(0.0, z); x = x_t(z)
    objs.append(box('transom_cap', x - 0.012, x + T_BW + 0.014, -yy, yy, z - 0.012, z + 0.03, C['cap']))
    return objs

def deck(x0, x1, zf, camber, name, m, fine=True, n=10):
    xs = [x for x in stations(fine) if x0 <= x <= x1]
    if not xs or xs[0] > x0: xs = [x0] + xs
    if xs[-1] < x1: xs.append(x1)
    rows = []
    for x in xs:
        zd = zf(x); yp = max(0.03, y_at(x, zd, 1) - T_BW); ys_ = max(0.03, y_at(x, zd, -1) - T_BW); xx = X(x, zd) + T_BW * max(0.0, 1 - x / 0.3)
        rows.append([(xx, -ys_ + (yp + ys_) * k / n, zd + camber * (1 - (2 * k / n - 1) ** 2)) for k in range(n + 1)])
    return grid(name, rows, lambda i, j: m, out=lambda c: (0, 0, 1))


# ---------- the ballast keel, propeller aperture, rudder, strakes ----------
def underwater(fine=True):
    objs = []
    xs = [1.79 + (9.5 - 1.79) * k / 30 for k in range(31)]
    top = [(x, z_low(x) + 0.06) for x in xs]; bot = [(x, interp(KEEL, x)) for x in reversed(xs)]
    poly = top + bot
    rings = [[(x, sy * keel_t(x) / 2, z) for x, z in poly] for sy in (1, -1)]
    k = loft_rings('keel', rings, C['af'])
    if fine: bevel_mod(k, 0.06, 2)
    objs.append(k)
    # the shoe under the aperture, carrying the rudder's heel
    objs.append(box('shoe', 0.80, 1.85, -0.07, 0.07, -1.78, -1.70, C['af'], 0.02 if fine else 0))
    # the rudder, hung on its stock between the hull and the shoe
    rud = [(0.40, -0.21), (0.98, -0.29), (1.02, -0.40), (1.02, -1.60), (0.98, -1.66), (0.45, -1.66), (0.38, -1.55)]
    ru = loft_rings('rudder', [[(x, 0.05, z) for x, z in rud], [(x, -0.05, z) for x, z in rud]], C['af'])
    if fine: bevel_mod(ru, 0.025, 2)
    objs.append(ru)
    objs.append(cyl('stock', (1.0, 0, -1.70), (1.0, 0, 0.10), 0.04, C['steel'], 10))
    if fine:
        objs.append(cyl('shaft', (1.85, 0, -0.85), (1.50, 0, -0.85), 0.04, C['steel'], 10))
        objs.append(cyl('hub', (1.56, 0, -0.85), (1.30, 0, -0.85), 0.08, C['prop'], 14, r1=0.055))
        for kk in range(3):
            a0 = 2 * math.pi / 3 * kk + 0.4; rows = []
            for i in range(9):
                r = 0.07 + 0.31 * i / 8; ch = 0.26 * math.sin(math.pi * (0.15 + 0.85 * i / 8)) ** 0.7 + 0.04; phi = math.atan(0.6 / (2 * math.pi * r))
                skew = 0.10 * (i / 8) ** 2; row = []
                for j in range(5):
                    c = (j / 4 - 0.5) * ch; a = a0 + (c * math.cos(phi)) / r + skew
                    row.append((1.43 + c * math.sin(phi), r * math.sin(a), -0.85 + r * math.cos(a)))
                rows.append(row)
            b = grid('blade%d' % kk, rows, lambda i, j: C['prop'], angle=80)
            solidify(b, 0.016); objs.append(b)
        for sy in (1, -1):
            objs.append(box('zinc%d' % sy, 2.3, 2.7, sy * 0.15 - 0.02, sy * 0.15 + 0.02, -1.05, -0.9, C['zinc'], 0.01))
    return objs

def strakes(fine=True):
    """the fender strake round the hull and across the transom, a little spray rail at the stem"""
    xs = [x for x in stations(fine) if 0.02 < x <= 10.52]; pts = []
    for x in reversed(xs): z = z_rub(x); pts.append((X(x, z), -(y_at(x, z, -1) + 0.035), z))
    z = z_rub(0.0); xt = x_t(z) - 0.035; yy = y_at(0.0, z) + 0.02
    for k in range(9): pts.append((xt, -yy + 2 * yy * k / 8, z))
    for x in xs: z = z_rub(x); pts.append((X(x, z), y_at(x, z, 1) + 0.035, z))
    objs = [tube('fender_strake', pts, 0.055, C['cap'], 8 if fine else 4)]
    if fine: objs.append(tube('stem_band', [(x, 0, z_low(x)) for x in [9.5 + 1.06 * k / 12 for k in range(13)]] + [(10.585, 0, 1.78), (XF, 0, 1.98)], 0.035, C['cap'], 8))
    return objs


# ---------- the forecastle and the wheelhouse ----------
WH_X0 = 5.25; WH_XC = 7.20; WH_XF = 7.45; WH_W = 1.20; WH_WF = 0.95; WH_SILL = 1.90; WH_TOP = 3.00; LEAN = 0.23; WH_FLOOR = 1.00
WIN_Z = (2.30, 2.90)
def wh_ring(z):
    d = LEAN * max(0.0, z - WH_SILL)
    return [(WH_X0, -WH_W, z), (WH_XC + d, -WH_W, z), (WH_XF + d, -WH_WF, z), (WH_XF + d, WH_WF, z), (WH_XC + d, WH_W, z), (WH_X0, WH_W, z)]
def roof_z(x): return WH_TOP + 0.06 * max(0.0, min(1.0, (x - WH_X0) / 2.4))

def arch(cx, z0, z1, w, n=6):
    """a window with a round top: (u, v) from the sill z0 up to the crown z1"""
    r = w / 2; pts = [(cx + r, z0), (cx + r, z1 - r)]
    for k in range(1, n): a = math.pi * k / n; pts.append((cx + r * math.cos(a), z1 - r + r * math.sin(a)))
    pts += [(cx - r, z1 - r), (cx - r, z0)]
    return pts

def wh_faces():
    """(name, origin, u, v, windows) for the walls carrying windows; windows as polygons in (u, v)"""
    vl = (LEAN, 0, 1.0); F = []
    vlen = math.hypot(LEAN, 1.0); s = lambda z: (z - WH_SILL) * vlen      # distance up a leaning wall
    F.append(('front', (WH_XF, 0, WH_SILL), (0, 1, 0), vl, [rrect(u, (s(WIN_Z[0]) + s(WIN_Z[1])) / 2, 0.56, s(WIN_Z[1]) - s(WIN_Z[0]), 0.06, 3) for u in (-0.62, 0.0, 0.62)]))
    for nm, a, b in (('corner_p', (WH_XF, WH_WF), (WH_XC, WH_W)), ('corner_s', (WH_XC, -WH_W), (WH_XF, -WH_WF))):
        u = (b[0] - a[0], b[1] - a[1], 0); mid = ((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, WH_SILL)
        F.append((nm, mid, u, vl, [rrect(0.0, (s(WIN_Z[0]) + s(WIN_Z[1])) / 2, 0.24, s(WIN_Z[1]) - s(WIN_Z[0]), 0.05, 3)]))
    side = lambda: [rrect(7.05, 2.58, 0.42, 0.52, 0.07, 3), arch(6.25, 2.22, 2.90, 0.27), arch(6.59, 2.22, 2.90, 0.27)]
    F.append(('side_p', (0, WH_W, 0), (1, 0, 0), (0, 0, 1), side()))
    F.append(('side_s', (0, -WH_W, 0), (1, 0, 0), (0, 0, 1), side()))
    return F

def wheelhouse(fine=True):
    objs = []; glass = []
    shell = loft_rings('wheelhouse', [wh_ring(z_deck(WH_X0)), wh_ring(WH_SILL), wh_ring(WH_TOP)], C['white'], angle=25)
    shell.data.materials.append(C['dark']); solidify(shell, 0.06, 1); apply_all(shell)
    if fine:
        cutters = []
        for nm, o, u, v, wins in wh_faces():
            vv = V(v).normalized(); n = V(u).normalized().cross(vv).normalized()
            if nm.startswith('side'): n = V((0, 1 if nm.endswith('p') else -1, 0))
            for k, poly in enumerate(wins):
                cutters.append(plate_cutter('wc_%s%d' % (nm, k), o, u, vv, poly, 0.35))
                cx = sum(p[0] for p in poly) / len(poly); cy = sum(p[1] for p in poly) / len(poly)
                outer = [(cx + (p[0] - cx) * 1.0 + (0.035 if p[0] > cx else -0.035), cy + (p[1] - cy) + (0.035 if p[1] > cy else -0.035)) for p in poly]
                objs.append(frame_ring('wf_%s%d' % (nm, k), V(o) + n * 0.004, u, vv, outer, poly, C['frame'], 0.0, 0.025, nrm=n))
                glass.append(plate('wg_%s%d' % (nm, k), V(o) - n * 0.03, u, vv, poly, C['glass'], nrm=n))
        cut(shell, cutters)
        # the door aft on the starboard side, from the main deck, with its window and handle
        objs.append(plate('door', (0, -WH_W - 0.012, 0), (1, 0, 0), (0, 0, 1), rrect(5.62, 1.72, 0.56, 1.86, 0.06, 2), C['roof'], 0.0, 0.012, nrm=(0, -1, 0)))
        glass.append(plate('door_glass', (0, -WH_W - 0.026, 0), (1, 0, 0), (0, 0, 1), rrect(5.62, 2.35, 0.34, 0.42, 0.06, 2), C['glass'], nrm=(0, -1, 0)))
        objs.append(cyl('door_handle', (5.85, -WH_W - 0.06, 1.55), (5.85, -WH_W - 0.06, 1.85), 0.015, C['steel'], 8))
        # inside, for the helm view: a dark console under the front windows, the wheel and a chair, on a raised floor
        objs.append(box('floor', WH_X0 + 0.05, WH_XC, -WH_W + 0.05, WH_W - 0.05, WH_FLOOR - 0.04, WH_FLOOR, C['dark']))
        objs.append(box('console', 7.05, WH_XF - 0.02, -WH_WF, WH_WF, WH_FLOOR, 2.25, C['dark'], 0.02))
        objs.append(torus('wheel', (7.02, -0.40, 2.12), (-0.9, 0, 0.45), 0.20, 0.018, C['dark'], 20, 5))
        objs.append(box('chair', 6.45, 6.85, -0.65, -0.15, WH_FLOOR, 1.55, C['dark'], 0.04))
        objs.append(box('chair_back', 6.35, 6.47, -0.65, -0.15, 1.55, 2.10, C['dark'], 0.03))
    else:
        for nm, o, u, v, wins in wh_faces():
            vv = V(v).normalized(); n = V(u).normalized().cross(vv).normalized()
            if nm.startswith('side'): n = V((0, 1 if nm.endswith('p') else -1, 0))
            for k, poly in enumerate(wins):
                objs.append(plate('wd_%s%d' % (nm, k), V(o) + n * 0.004, u, vv, poly, C['dark'], nrm=n))
    objs.append(shell)
    # the roof with an overhang, a visor forward, rising a little towards the front
    foot = [(p[0], p[1]) for p in wh_ring(WH_TOP)]; ring = offset_poly(foot, 0.10)
    ring = [(x + (0.08 if x > WH_X0 + 1 else 0), y) for x, y in ring]
    roof = loft_rings('wh_roof', [[(x, y, WH_TOP) for x, y in ring], [(x, y, roof_z(x) + 0.06) for x, y in ring]], C['roof'], angle=30)
    if fine: bevel_mod(roof, 0.025, 2)
    objs.append(roof)
    return objs, glass


def forecastle(fine=True):
    """the forecastle's after bulkhead and deck, its rails, portholes, hatch, vents and the anchor gear"""
    objs = []; glass = []
    for sg in (1, -1):
        y0 = WH_W if sg > 0 else -WH_W; y1 = sg * (min(y_at(X_BAKK, z_deck(X_BAKK), sg), y_at(X_BAKK, z_bk(X_BAKK), sg)) - T_BW - 0.005)
        objs.append(box('bakk_face_%d' % sg, X_BAKK - 0.03, X_BAKK + 0.03, min(y0, y1), max(y0, y1), z_deck(X_BAKK), z_bk(X_BAKK), C['white']))
    if not fine: return objs, glass
    # rails: posts on the bulwark top, a top and a middle rail, closing round the bow
    xs = [6.35, 6.95, 7.55, 8.15, 8.75, 9.30, 9.80, 10.20]
    for sg in (1, -1):
        for k, x in enumerate(xs):
            zc = z_cap(x, sg); y = sg * (y_at(x, zc, sg) - 0.04)
            objs.append(cyl('bs%d%d' % (k, sg), (x, y, zc), (x, y, zc + 0.58), 0.02, C['steel'], 8))
    for h, nm, r in ((0.58, 'top', 0.024), (0.30, 'mid', 0.017)):
        pts = [(6.15, -(y_at(6.15, z_cap(6.15, -1), -1) - 0.04), z_cap(6.15, -1) + h * 0.6)]
        pts += [(x, -(y_at(x, z_cap(x, -1), -1) - 0.04), z_cap(x, -1) + h) for x in xs]
        pts += [(10.45, -0.26, z_cap(10.45) + h), (10.55, 0.0, z_cap(10.55) + h), (10.45, 0.26, z_cap(10.45) + h)]
        pts += [(x, y_at(x, z_cap(x)) - 0.04, z_cap(x) + h) for x in reversed(xs)]
        pts += [(6.15, y_at(6.15, z_cap(6.15)) - 0.04, z_cap(6.15) + h * 0.6)]
        objs.append(tube('bakk_rail_' + nm, pts, r, C['steel'], 8))
    # two portholes a side in the forecastle
    for sg in (1, -1):
        for x in (6.24, 7.39):
            z = 1.58; y = y_at(x, z, sg) + 0.006
            objs.append(torus('port%d%d' % (int(x * 10), sg), (x, sg * y, z), (0, 1, 0), 0.14, 0.025, C['steel'], 20, 6))
            glass.append(plate('portg%d%d' % (int(x * 10), sg), (x, sg * (y - 0.002), 0), (1, 0, 0), (0, 0, 1),
                               [(0.12 * math.cos(2 * math.pi * k / 16), z + 0.12 * math.sin(2 * math.pi * k / 16)) for k in range(16)], C['glass'], nrm=(0, sg, 0)))
    zb = z_bk(8.1)
    objs.append(box('fore_hatch', 7.80, 8.41, -0.37, 0.37, zb, zb + 0.14, C['white'], 0.02))
    objs.append(box('fore_hatch_lid', 7.76, 8.45, -0.41, 0.41, zb + 0.14, zb + 0.18, C['roof'], 0.015))
    for y in (0.9, -0.9):
        zv = z_bk(7.75)
        objs.append(cyl('vent%d' % int(y * 10), (7.75, y, zv), (7.75, y, zv + 0.28), 0.05, C['white'], 10))
        objs.append(cyl('vent_cap%d' % int(y * 10), (7.75, y, zv + 0.28), (7.75, y, zv + 0.36), 0.12, C['white'], 14, r1=0.05))
    # a small windlass, the chain to the bow roller and the anchor stowed in it
    zw = z_bk(9.45)
    objs.append(box('windlass_base', 9.25, 9.65, -0.20, 0.20, zw, zw + 0.12, C['red'], 0.02))
    objs.append(cyl('gypsy', (9.45, -0.20, zw + 0.26), (9.45, 0.20, zw + 0.26), 0.11, C['red'], 16))
    objs.append(cyl('wl_drum', (9.45, 0.20, zw + 0.26), (9.45, 0.36, zw + 0.26), 0.08, C['dark'], 12))
    zr = z_cap(10.55)
    objs.append(tube('chain', [(9.50, 0, zw + 0.36), (10.30, 0, zr + 0.06), (10.70, 0, zr + 0.04)], 0.022, C['dark'], 6))
    for sy in (0.09, -0.09): objs.append(box('roller_cheek%d' % int(sy * 100), 10.35, 10.82, sy - 0.013, sy + 0.013, zr - 0.10, zr + 0.12, C['steel'], 0.01))
    objs.append(cyl('bow_roller', (10.76, -0.08, zr - 0.01), (10.76, 0.08, zr - 0.01), 0.06, C['dark'], 14))
    objs.append(cyl('anchor_shank', (10.48, 0, zr + 0.14), (10.84, 0, zr + 0.02), 0.028, C['dark'], 8))
    objs.append(loft_rings('anchor_fluke', [[(10.82, -0.12, zr - 0.02), (10.82, 0.12, zr - 0.02), (10.88, 0.0, zr - 0.24)], [(10.87, -0.12, zr), (10.87, 0.12, zr), (10.92, 0.0, zr - 0.22)]], C['dark']))
    # bollards on the forecastle, and a lifebuoy on the rail
    for x, y in ((9.95, 0.72), (9.95, -0.72), (6.45, 1.55), (6.45, -1.55)):
        zb2 = z_bk(x)
        objs.append(box('bp%d' % int(x * 10 + y * 100), x - 0.11, x + 0.11, y - 0.055, y + 0.055, zb2, zb2 + 0.04, C['dark']))
        for dx in (-0.065, 0.065): objs.append(cyl('bol%d%d' % (int(x * 10 + y * 100), int(dx * 100)), (x + dx, y, zb2), (x + dx, y, zb2 + 0.26), 0.042, C['dark'], 10))
    objs.append(torus('buoy_fwd', (8.45, 1.62, z_cap(8.45) + 0.36), (0, 1, 0), 0.25, 0.055, C['orange'], 22, 8))
    return objs, glass


# ---------- the aft deck: gear room, hatch, hauler, rails, tubs ----------
GR = [(1.25, -0.15), (1.62, -0.15), (2.55, 1.20), (2.62, 1.70), (1.25, 1.70)]     # the gear room in plan (counter-clockwise), inside the bulwark
GR_TOP = 2.94

def aft_deck(fine=True):
    objs = []; glass = []
    yi = min(y_at(x, z_deck(x)) for x in (1.25, 2.62)) - T_BW - 0.01; GR[3] = (2.62, yi); GR[4] = (1.25, yi)
    gr = poly_prism('gear_room', GR, z_deck(1.5), GR_TOP, C['white'], 0.03 if fine else 0)
    objs.append(gr)
    objs.append(poly_prism('gear_roof', offset_poly(GR, 0.06), GR_TOP, GR_TOP + 0.06, C['roof'], 0.015 if fine else 0))
    # the hold: a coaming with its hatch boards and the small hatch at the after end
    objs.append(box('coaming', 2.40, 4.00, -0.66, 0.66, z_deck(3.2), z_deck(3.2) + 0.30, C['white'], 0.02 if fine else 0))
    objs.append(box('hatch_boards', 2.36, 4.04, -0.70, 0.70, z_deck(3.2) + 0.30, z_deck(3.2) + 0.34, C['deck'], 0.01 if fine else 0))
    if not fine: return objs, glass
    zt = z_deck(3.2) + 0.34
    for k in range(1, 6): objs.append(box('board_seam%d' % k, 2.36 + 0.28 * k - 0.006, 2.36 + 0.28 * k + 0.006, -0.70, 0.70, zt, zt + 0.004, C['dark']))
    objs.append(box('small_hatch', 2.50, 3.15, -0.34, 0.40, zt, zt + 0.12, C['white'], 0.02))
    for y in (-0.2, 0.26): objs.append(tube('hatch_grip%d' % int(y * 100), [(2.70, y, zt + 0.12), (2.70, y, zt + 0.17), (2.95, y, zt + 0.17), (2.95, y, zt + 0.12)], 0.012, C['steel'], 6))
    # the gear room's door (on its slanted side, facing starboard and forward), handrails and a lifebuoy
    a = V((1.62, -0.15, 0)); b = V((2.55, 1.20, 0)); u = (b - a).normalized(); n = V((u.y, -u.x, 0))
    mid = (a + b) / 2
    objs.append(plate('gr_door', (mid.x, mid.y, 0), (u.x, u.y, 0), (0, 0, 1), rrect(0.0, 1.70, 0.62, 1.90, 0.06, 2), C['roof'], 0.012, 0.012, nrm=n))
    glass.append(plate('gr_door_glass', (mid.x, mid.y, 0), (u.x, u.y, 0), (0, 0, 1), rrect(0.0, 2.35, 0.30, 0.36, 0.05, 2), C['glass'], 0.026, nrm=n))
    for k, (x0, x1) in enumerate(((1.30, 1.58),)):
        objs.append(tube('gr_rail%d' % k, [(x0, -0.21, 1.70), (x0, -0.21, 1.74), (x1, -0.21, 1.74), (x1, -0.21, 1.70)], 0.014, C['steel'], 6))
    objs.append(torus('buoy_aft', (2.62 + 0.07, 1.50, 2.25), (1, 0, 0), 0.25, 0.055, C['orange'], 22, 8))
    # the line hauler on the starboard waist, and the roller over the low bulwark
    zd = z_deck(4.5)
    objs.append(cyl('haul_post', (4.50, -1.30, zd), (4.50, -1.30, 1.25), 0.09, C['red'], 12))
    objs.append(box('haul_arm', 4.42, 4.58, -1.50, -1.22, 1.20, 1.40, C['red'], 0.02))
    objs.append(cyl('haul_sheave', (4.46, -1.48, 1.52), (4.56, -1.48, 1.52), 0.22, C['red'], 22))
    objs.append(cyl('haul_motor', (4.56, -1.48, 1.52), (4.74, -1.48, 1.52), 0.09, C['dark'], 12))
    yc = -(y_at(4.5, 1.28, -1) + 0.06)
    for x in (4.15, 4.85):
        objs.append(box('roller_cheek%d' % int(x * 100), x - 0.02, x + 0.02, yc - 0.10, yc + 0.12, 1.20, 1.46, C['steel'], 0.01))
    objs.append(cyl('line_roller', (4.13, yc, 1.36), (4.87, yc, 1.36), 0.06, C['dark'], 14))
    # rails on the aft bulwark (posts, a top rail round the stern, sloping down to the waist)
    xs = [0.45, 1.05, 1.65, 2.25, 2.85, 3.45]
    for sg in (1, -1):
        for k, x in enumerate(xs):
            if sg > 0 and 1.2 < x < 2.7: continue
            zc = z_cap(x, sg); y = sg * (y_at(x, zc, sg) - 0.04)
            objs.append(cyl('ap%d%d' % (k, sg), (X(x, zc), y, zc), (X(x, zc), y, 1.75), 0.02, C['steel'], 8))
    XS = [0.45] + xs[1:] + [3.55]; xr = x_t(1.48) + 0.035; yy = y_at(0.0, 1.48) - 0.04
    pts = [(3.80, -(y_at(3.80, z_cap(3.80, -1), -1) - 0.04), z_cap(3.80, -1) + 0.02)]
    pts += [(X(x, 1.48), -(y_at(x, 1.48, -1) - 0.04), 1.75) for x in reversed(XS)]
    pts += [(xr, -yy * 0.92, 1.75), (xr, 0.0, 1.75), (xr, yy * 0.92, 1.75)]
    pts += [(X(x, 1.48), y_at(x, 1.48) - 0.04, 1.75) for x in XS]
    pts += [(3.80, y_at(3.80, z_cap(3.80)) - 0.04, z_cap(3.80) + 0.02)]
    objs.append(tube('aft_rail', pts, 0.022, C['steel'], 8))
    for y in (-1.1, 0.0, 1.1): objs.append(cyl('sp%d' % int(y * 10), (xr, y, 1.48), (xr, y, 1.75), 0.02, C['steel'], 8))
    # line tubs and fish boxes on the aft deck, bollards on the quarters
    zd0 = z_deck(0.8)
    for k, (x, y) in enumerate(((0.75, -1.15), (0.75, -0.45), (1.40, -1.15))):
        objs.append(cyl('tub%d' % k, (x, y, zd0), (x, y, zd0 + 0.42), 0.30, C['tub'], 18, r1=0.33))
        objs.append(cyl('tub_in%d' % k, (x, y, zd0 + 0.40), (x, y, zd0 + 0.425), 0.30, C['dark'], 18))
    for k, (x, y) in enumerate(((4.55, 0.55), (4.55, 1.20))):
        objs.append(box('fishbox%d' % k, x - 0.40, x + 0.40, y - 0.30, y + 0.30, z_deck(x), z_deck(x) + 0.32, C['box'], 0.03))
    for x, y in ((0.45, 1.45), (0.45, -1.45)):
        objs.append(box('abp%d' % int(y * 10), x - 0.11, x + 0.11, y - 0.055, y + 0.055, z_deck(x), z_deck(x) + 0.04, C['dark']))
        for dx in (-0.065, 0.065): objs.append(cyl('abol%d%d' % (int(y * 10), int(dx * 100)), (x + dx, y, z_deck(x)), (x + dx, y, z_deck(x) + 0.30), 0.042, C['dark'], 10))
    # freeing ports in the bulwarks and the fuel filler
    for sg in (1, -1):
        for x, w in ((0.78, 0.48), (2.42, 0.48), (4.46, 0.70)):
            z = 0.82; yo = y_at(x, z, sg) + 0.006
            objs.append(plate('fp%d%d' % (int(x * 10), sg), (0, sg * yo, 0), (1, 0, 0), (0, 0, 1), rrect(x, z, w, 0.12, 0.05, 2), C['dark'], nrm=(0, sg, 0)))
    objs.append(cyl('filler', (5.55, 1.72, z_deck(5.55)), (5.55, 1.72, z_deck(5.55) + 0.08), 0.05, C['steel'], 10))
    objs.append(cyl('flagpole', (0.20, 1.55, z_cap(0.2)), (0.02, 1.55, 2.70), 0.02, C['rope'], 8))
    return objs, glass


# ---------- masts and rigging: the tall mast by the wheelhouse with its derrick, the aft mast with the riding sail ----------
FM = (5.27, 1.02)       # the forward mast stands against the after port corner of the wheelhouse, through the roof overhang
AM = (1.50, 0.0)        # the aft mast goes up through the gear room

def rig(fine=True):
    objs = []; seg = 12 if fine else 6
    fx, fy = FM; ax, ay = AM
    objs.append(cyl('fmast', (fx, fy, z_deck(fx)), (fx, fy, 7.42), 0.07, C['mast'], seg))
    objs.append(cyl('fmast_top', (fx, fy, 7.42), (fx, fy, 8.34), 0.05, C['mast'], seg))
    objs.append(cyl('amast', (ax, ay, z_deck(ax)), (ax, ay, 7.59), 0.065, C['mast'], seg))
    # the radome on its bracket forward of the mast
    objs.append(box('radar_arm', fx, 6.20, fy - 0.04, fy + 0.04, 4.39, 4.47, C['mast']))
    objs.append(cyl('radome', (6.12, fy - 0.35, 4.47), (6.12, fy - 0.35, 4.72), 0.32, C['white'], 22 if fine else 10, r1=0.30))
    objs.append(box('radar_arm2', 6.0, 6.24, fy - 0.40, fy + 0.04, 4.39, 4.47, C['mast']))
    # the riding sail: a quadrilateral between the gaff, the boom and the luff pole, slightly full
    lx = ax - 0.11
    head = (-0.38, 7.27); clew = (-0.96, 3.40); tack = (lx, 3.40); peak = (lx, 7.40)
    rows = []
    for i in range(9):
        t = i / 8; xl = tack[0] + (peak[0] - tack[0]) * t; zl = tack[1] + (peak[1] - tack[1]) * t
        xr = clew[0] + (head[0] - clew[0]) * t; zr = clew[1] + (head[1] - clew[1]) * t; row = []
        for j in range(7):
            u = j / 6; belly = 0.10 * math.sin(math.pi * u) * math.sin(math.pi * (0.15 + 0.7 * t))
            row.append((xl + (xr - xl) * u, belly, zl + (zr - zl) * u))
        rows.append(row)
    sail = grid('sail', rows, lambda i, j: C['sail'], angle=80)
    solidify(sail, 0.006); objs.append(sail)
    objs.append(cyl('boom', (ax, 0, 3.30), (-1.06, 0, 3.30), 0.04, C['mast'], 10 if fine else 5))
    objs.append(cyl('gaff', (ax, 0, 7.43), (-0.40, 0, 7.27), 0.035, C['mast'], 10 if fine else 5))
    if not fine: return objs
    objs.append(cyl('luff_pole', (lx, 0, 3.30), (lx, 0, 7.40), 0.025, C['mast'], 8))
    objs.append(cyl('sprit', (-0.36, 0, 7.25), (1.24, 0, 5.92), 0.03, C['mast'], 8))
    objs.append(cyl('strut', (1.30, 0, 7.45), (0.36, 0, 6.74), 0.03, C['mast'], 8))
    objs.append(sphere('sprit_block', (0.38, 0, 6.72), 0.06, C['dark']))
    objs.append(cyl('boom_strut', (-0.70, 0, 3.28), (ax - 0.05, 0, 4.62), 0.03, C['mast'], 8))
    objs.append(cyl('boom_brace', (-0.70, 0, 3.26), (1.34, 0, GR_TOP + 0.02), 0.03, C['mast'], 8))
    objs.append(cyl('leech', (-0.38, 0, 7.25), (-0.96, 0, 3.32), 0.008, C['dark'], 4))
    objs.append(cyl('amast_cap', (ax, 0, 7.59), (ax, 0, 7.66), 0.08, C['mast'], 12))
    for sg in (1, -1):
        objs.append(cyl('astay%d' % sg, (ax, 0, 5.96), (3.70, sg * (y_at(3.7, z_cap(3.7, sg), sg) - 0.05), z_cap(3.7, sg)), 0.008, C['dark'], 4))
    objs.append(box('sternlight', ax + 0.06, ax + 0.16, -0.05, 0.05, 4.10, 4.22, C['lwhite']))
    # the forward mast: lantern arms, the aerial bar and crosstree, a whip on top, stays, the derrick and its winch
    for z in (8.23, 6.82):
        objs.append(box('larm%d' % int(z * 10), fx, fx + 0.48, fy - 0.025, fy + 0.025, z - 0.025, z + 0.025, C['mast']))
        objs.append(box('lantern%d' % int(z * 10), fx + 0.42, fx + 0.56, fy - 0.06, fy + 0.06, z - 0.20, z + 0.20, C['lwhite'], 0.01))
    objs.append(box('aerial_bar', fx - 0.10, fx + 0.95, fy - 0.03, fy + 0.03, 6.27, 6.33, C['mast']))
    for k, x in enumerate((fx + 0.55, fx + 0.85)): objs.append(cyl('whip%d' % k, (x, fy, 6.33), (x, fy, 7.30 - 0.2 * k), 0.010, C['white'], 6))
    objs.append(box('crosstree', fx - 0.03, fx + 0.03, fy - 0.45, fy + 0.45, 6.20, 6.26, C['mast']))
    objs.append(cyl('topwhip', (fx, fy, 8.34), (fx, fy, 9.86), 0.012, C['white'], 6))
    objs.append(cyl('fstay', (fx, fy, 6.24), (WH_XF + 0.15, 0.0, roof_z(7.5) + 0.06), 0.008, C['dark'], 4))
    for sy in (1, -1):
        objs.append(cyl('shroud%d' % sy, (fx, fy + sy * 0.45, 6.22), (fx - 0.15, sy * (y_at(4.95, z_cap(4.95, sy), sy) - 0.05), z_cap(4.95, sy)), 0.008, C['dark'], 4))
    heel = (fx - 0.05, fy - 0.05, 2.28); tip = (3.33, 0.25, 5.00)
    objs.append(cyl('derrick', heel, tip, 0.05, C['mast'], 10))
    objs.append(cyl('topping', tip, (fx, fy, 6.20), 0.008, C['dark'], 4))
    objs.append(sphere('d_block', (tip[0] - 0.02, tip[1], tip[2] - 0.08), 0.07, C['dark']))
    objs.append(cyl('hookline', (tip[0] - 0.02, tip[1], tip[2] - 0.12), (tip[0] - 0.02, tip[1], 4.45), 0.008, C['dark'], 4))
    objs.append(torus('hook', (tip[0] - 0.02, tip[1], 4.39), (0, 1, 0), 0.06, 0.012, C['dark'], 12, 4))
    objs.append(cyl('d_winch', (fx - 0.12, fy - 0.16, 2.12), (fx - 0.12, fy + 0.10, 2.12), 0.10, C['red'], 14))
    # on the wheelhouse roof: rail, liferaft, exhaust, searchlight, horn, the side lights
    zr = roof_z(5.5) + 0.06
    posts = [(5.22, y) for y in (-1.05, -0.35, 0.35)] + [(x, sy * 1.18) for x in (5.6, 6.2, 6.8) for sy in (1, -1)]
    for k, (x, y) in enumerate(posts): objs.append(cyl('rp%d' % k, (x, y, roof_z(x) + 0.06), (x, y, roof_z(x) + 0.36), 0.016, C['steel'], 8))
    objs.append(tube('roof_rail', [(6.8, 1.18, roof_z(6.8) + 0.36), (5.32, 1.18, roof_z(5.3) + 0.36), (5.22, 1.08, roof_z(5.2) + 0.36), (5.22, -1.08, roof_z(5.2) + 0.36),
                                   (5.32, -1.18, roof_z(5.3) + 0.36), (6.8, -1.18, roof_z(6.8) + 0.36)], 0.02, C['steel'], 8))
    objs.append(box('raft_cradle', 6.40, 6.90, -0.55, 0.45, roof_z(6.6) + 0.06, roof_z(6.6) + 0.12, C['dark']))
    objs.append(cyl('liferaft', (6.65, -0.55, roof_z(6.6) + 0.34), (6.65, 0.45, roof_z(6.6) + 0.34), 0.22, C['white'], 18))
    for yy in (-0.30, 0.20): objs.append(torus('raftband%d' % int(yy * 100), (6.65, yy, roof_z(6.6) + 0.34), (0, 1, 0), 0.225, 0.012, C['dark'], 20, 4))
    objs.append(tube('exhaust', [(6.05, 0.62, roof_z(6.05) + 0.06), (6.05, 0.62, 3.95), (6.08, 0.62, 4.06), (6.17, 0.62, 4.10), (6.26, 0.62, 4.04)], 0.06, C['steel'], 12))
    objs.append(cyl('sl_post', (5.12, -0.60, zr), (5.12, -0.60, zr + 0.22), 0.025, C['mast'], 8))
    objs.append(cyl('searchlight', (5.0, -0.60, zr + 0.30), (5.26, -0.60, zr + 0.30), 0.085, C['dark'], 14))
    objs.append(cyl('horn', (5.35, 0.30, zr + 0.18), (5.62, 0.30, zr + 0.22), 0.028, C['white'], 10, r1=0.075))
    objs.append(box('compass', 6.95, 7.30, -0.20, 0.20, roof_z(7.1) + 0.06, roof_z(7.1) + 0.20, C['white'], 0.02))
    objs.append(cyl('lightmast', (7.50, 0.0, roof_z(7.5) + 0.06), (7.50, 0.0, 3.62), 0.025, C['mast'], 8))
    objs.append(box('mastlight', 7.45, 7.57, -0.05, 0.05, 3.62, 3.76, C['lwhite'], 0.01))
    for y, m in ((WH_WF + 0.10, C['lred']), (-WH_WF - 0.10, C['lgreen'])):
        x = WH_XF + LEAN * (WH_TOP - WH_SILL) - 0.05
        objs.append(box('sidelight%d' % int(y * 10), x - 0.18, x + 0.02, y - 0.05, y + 0.05, WH_TOP - 0.10, WH_TOP + 0.02, m, 0.01))
    objs.append(torus('buoy_wh', (WH_X0 - 0.012, -0.55, 2.10), (1, 0, 0), 0.25, 0.055, C['orange'], 22, 8))
    return objs


def build(fine=True):
    """all the parts: solids (to be joined and baked) and glass"""
    solids = build_hull(fine)
    solids += bulwark_inner(0.0, X_BAKK, z_deck, 'bw_aft', fine)
    solids += bulwark_inner(X_BAKK, 10.52, z_bk, 'bw_fwd', fine)
    solids += transom_inner(fine)
    solids.append(deck(0.0, X_BAKK, z_deck, 0.06, 'main_deck', C['deck'], fine))
    solids.append(deck(X_BAKK, 10.50, z_bk, 0.05, 'bakk_deck', C['deck'], fine))
    solids += underwater(fine)
    solids += strakes(fine)
    o, g1 = wheelhouse(fine); solids += o
    o, g2 = forecastle(fine); solids += o
    o, g3 = aft_deck(fine); solids += o
    solids += rig(fine)
    return solids, g1 + g2 + g3


def to_game(p): return (-p[1], p[2] - WL, -(p[0] - XM))
def to_game_n(n): return (-n[1], n[2], -n[0])

def anchors():
    G = lambda x, y, z: [round(v, 3) for v in to_game((x, y, z))]
    zd = z_deck(3.0)
    return {'eye': G(6.85, -0.40, 2.62), 'skipperAt': G(6.62, -0.40, WH_FLOOR), 'hp': -0.06, 'fov': 58,
            'crewSpots': [G(4.15, -1.10, z_deck(4.15) + 0.04) + [1.57], G(3.25, 1.00, zd + 0.04) + [0.0], G(0.95, 0.30, z_deck(0.95) + 0.04) + [3.14], G(3.10, -1.00, zd + 0.04) + [3.14]],
            'hauler': G(4.51, -1.48, 1.52), 'filler': G(5.55, 1.72, z_deck(5.55) + 0.1), 'pole': G(0.02, 1.55, 2.70),
            'lights': [[G(FM[0] + 0.49, FM[1], 8.23), [1, 0.95, 0.85]], [G(FM[0] + 0.49, FM[1], 6.82), [1, 0.95, 0.85]], [G(7.50, WH_WF + 0.10, WH_TOP - 0.04), [1, 0.12, 0.1]],
                       [G(7.50, -WH_WF - 0.10, WH_TOP - 0.04), [0.1, 1, 0.35]], [G(AM[0] + 0.11, 0, 4.16), [1, 0.95, 0.85]], [G(7.51, 0, 3.69), [1, 0.95, 0.85]]],
            'deck': {'y': round(zd - WL, 3), 'z': round(-(3.0 - XM), 3)}, 'gw': round(z_cap(4.5, -1) - WL, 3),
            'stern': round(XM + 0.2, 3), 'bow': round(-(10.3 - XM), 3), 'side': 1.9, 'beam': 4.1, 'pl': 4.2, 'rl': 1.56, 'open': False, 'hand': False}


# ---------- checks against the drawings ----------
SP = 156.3; PX0 = 440.0; PZ0 = 1572.0           # profile: px per metre, x = 0 and the waterline in pixels
SG = 152.0; GX0 = 588.0                         # plan: px per metre and x = 0; the plan is turned 1.75 degrees (bow lower)

def check_overlay():
    """the model drawn over the drawings: from the side (starboard, bow right) and from above (port up, bow right)"""
    setup_render(2000, 2000, samples=8, transparent=True)
    # side: the crop (210, 0) .. (2210, 2000) of the profile, 2000 px = 2000 / SP metres
    cx = (1210 - PX0) / SP; cz = (PZ0 - 1000) / SP
    camera((cx, -40, cz), (cx, 0, cz), ortho=2000 / SP)
    render(os.path.join(OUT, 'hj_ov_side.png'))
    # above: the crop (500, 60) .. (2300, 960) of the plan
    bpy.context.scene.render.resolution_x = 1800; bpy.context.scene.render.resolution_y = 900
    cx = (1400 - GX0) / SG; cy = -((510 - 487) / SG)
    c = camera((cx, cy, 40), (cx, cy, 0), ortho=1800 / SG); c.rotation_euler = (0, 0, math.radians(1.75))
    render(os.path.join(OUT, 'hj_ov_top.png'))
    if PROFIL: on_drawing(os.path.join(OUT, 'hj_ov_side.png'), PROFIL, (210, 0, 2210, 2000), os.path.join(OUT, 'hj_ov_side_on.png'))
    if GA: on_drawing(os.path.join(OUT, 'hj_ov_top.png'), GA, (500, 60, 2300, 960), os.path.join(OUT, 'hj_ov_top_on.png'))


SHOTS = [('bow3q', (16.5, -11.5, 4.2), (5.0, 0, 2.2), 35), ('stern3q', (-8.0, 10.5, 5.2), (4.0, 0, 2.2), 35), ('side', (5.0, -21, 1.6), (5.0, 0, 2.6), 35),
         ('above', (13.0, -9.0, 13.0), (5.0, 0, 1.5), 35), ('deck', (0.6, -4.2, 4.6), (5.0, 0.4, 1.6), 24)]

def main():
    os.makedirs(OUT, exist_ok=True)
    only_check = len(sys.argv) > 1 and sys.argv[1] == 'check'
    reset(); colours()
    solids, glass = build(True)
    join(solids, 'BOAT0'); join(glass, 'GLASS0')
    if only_check or 'fast' not in sys.argv:
        check_overlay()
        if only_check: return
        beauty(OUT, 'hj', WL, SHOTS)
    ex = {'frame': 'kystfiske: x starboard, y up from the waterline, z aft; metres', 'type': 'sjark', 'name': 'Viksund Havsjark 35 (10.57 m)', 'len': 10.57, 'beam': 4.1, 'draft': 1.6,
          'anchors': anchors()}
    export_boat(build, to_game, to_game_n, OUT, 'havsjark35.glb', os.path.join(ROOT, 'src', 'data', 'boat-havsjark35.b64'), ex,
                side=(os.path.join(ROOT, 'src', 'data', 'boat-havsjark35-side.b64'), 4.8, 3.6, 12.8), dry='dry' in sys.argv)


if __name__ == '__main__':
    main()
