"""The freezer trawler (bunntral), a 60 m stern trawler with a stern ramp, built in Blender from the general arrangement «Fish
processing vessel 60 m, bottom and pelagic trawling» (drawing 101-001, 1:100) that Jonas showed on 06.10.2026: length overall
60.30 m, between perpendiculars 53.50 m, breadth moulded 12.50 m, depth to deck 1 5.80 m, deck 2 8.60 m, deck 3 11.00 m, deck 4
13.30 m, frame spacing 0.60 m, fish hold 915 m3, accommodation for 28. The drawing is not in the repository; the lines below were
measured from it (profile and plans about 18.1 px/m in Jonas' picture, frame 0 at the aft perpendicular).
The trawl doors hang in the gallows on the stern either side of the ramp, as on Jonas' picture of a trawler at the quay
(06.10.2026: «en tråler har slike tråldører på hekken som senkes i havet ved tråling»). The doors, the codend and the net on the
drum are parts of their own in the GLB, so the 3D view can shoot and haul the trawl (view3d.js TRAWL).
Where the drawing says nothing (colours, the shape of the hull below the waterline, the gantry) the choices are ours: a navy hull
with a white upper side and superstructure, blue doors, after the trawlers on the coast. Exterior only.

    pip install bpy==4.5.4
    python3 tools/boats/tral60.py            -> src/data/boat-tral60.b64 (+ the side picture), renders in tools/boats/out/
    python3 tools/boats/tral60.py fast dry   -> no renders to look at, and the GLB only in tools/boats/out

Frame: x forward from the aft perpendicular, y to port, z up from the baseline; the waterline is z = 4.70."""
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy
from bpyutil import *

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE)); OUT = os.path.join(HERE, 'out')
WL = 4.70; XA = -3.20; XF = 57.20; XM = (XA + XF) / 2
D1, D2, D3, D4 = 5.80, 8.60, 11.00, 13.30          # the decks (the drawing's depths)
RAMP_Y = 2.10                                       # half the width of the stern ramp
def ss(a, b, x): t = max(0.0, min(1.0, (x - a) / (b - a))); return t * t * (3 - 2 * t)


# ---------- measured lines (metres) ----------
# the bottom of the canoe body on the centreline (the skeg is separate): up to the transom aft, the keel's drag, up to the forefoot
LOW = [(XA, 4.35), (-2.4, 3.95), (-1.2, 3.30), (0.5, 2.45), (2.5, 1.35), (4.5, 0.50), (6.5, -0.05), (8.0, -0.22), (20.0, -0.10), (32.0, 0.05),
       (44.0, 0.35), (48.0, 0.62), (50.5, 1.00)]
def z_low(x): return interp(LOW, x)
# the stem without the bulb (the bulb is a body of its own): the forefoot behind the bulb, the knuckle at 7.6 m, the raked stem
STEM = [(0.6, 50.2), (2.5, 51.3), (4.0, 52.3), (5.5, 53.1), (6.5, 53.45), (7.6, 53.6), (8.5, 54.1), (9.5, 54.95), (10.5, 55.9), (11.0, 56.3),
        (11.6, 56.75), (12.3, XF)]
def x_stem(z): return interp(STEM, z)
# half-breadth at deck 3 (the deck plan) and at the waterline (the plans below deck 1); the shell's top: deck 3 aft, rising forward
HBD = [(XA, 6.05), (-2.2, 6.20), (0.0, 6.25), (44.0, 6.25), (46.0, 6.10), (48.0, 5.75), (50.0, 5.05), (52.0, 4.05), (54.0, 2.70), (55.5, 1.55),
       (56.6, 0.60), (XF, 0.0)]
HBW = [(XA, 5.25), (-2.0, 5.65), (0.0, 5.95), (4.0, 6.18), (8.0, 6.25), (36.0, 6.25), (40.0, 6.10), (43.0, 5.75), (46.0, 5.00), (48.5, 4.00),
       (50.5, 2.90), (52.0, 1.90), (53.3, 0.95), (54.2, 0.25)]
NX = [(XA, 2.2), (0.0, 2.4), (3.0, 3.2), (8.0, 5.5), (12.0, 7.0), (34.0, 7.0), (40.0, 4.6), (45.0, 3.0), (49.0, 2.0), (52.0, 1.5), (54.5, 1.25)]
def z_top(x): return D3 + (1.30 * ss(44.0, XF, x) ** 1.6 if x > 44.0 else 0.0)      # the bulwark rises to the stem at 12.3 m
def z_deck(x): return D3 + 0.30 * ss(44.5, 56.0, x)                                  # the foredeck rises a little


def section_body(x, n=26):
    """the half-section (y, z) of the body aft of the entry: a superellipse bilge below the waterline (fuller amidships), flare above it
    to deck 3, and the bulwark"""
    zl = z_low(x); zt = z_top(x); bw = interp(HBW, x); bd = interp(HBD, x); nn = interp(NX, x)
    pts = []
    if zl < WL - 0.02:
        for k in range(n + 1):
            th = (math.pi / 2) * k / n; c = math.cos(th); s = math.sin(th)
            pts.append((bw * (s ** (2 / nn) if s > 0 else 0.0), zl + (WL - zl) * (1 - (c ** (2 / nn) if c > 0 else 0.0))))
    else:
        pts.append((0.0, zl))
    for k in range(1, 9):
        z = WL + (D3 - WL) * k / 8; pts.append((bw + (bd - bw) * ((z - WL) / (D3 - WL)) ** 1.4, z))
    if zt > D3 + 0.02:
        for k in range(1, 5):
            z = D3 + (zt - D3) * k / 4; pts.append((bd + 0.12 * (z - D3), z))
    return pts

# the entry: forward of X_ENT every waterline runs from the body's breadth there to the stem, y = Ymid(z) (1 - (1 - s)^p), s the
# share of the way left to the stem; p (how full the waterline stays) was fitted to the deck plan (4.6 at deck 3) and the plans
# below deck 1 (3.1 at the waterline); the section's height is mapped onto the body's, so the flat of the bottom rises forward
X_ENT = 36.0
PW = [(0.0, 2.0), (2.0, 2.5), (WL, 3.1), (8.0, 4.0), (D3, 4.6), (12.4, 5.0)]
STEM_INV = [(x, z) for z, x in STEM]
_YM = {}
def ymid(zm):
    if 'sec' not in _YM: _YM['sec'] = section_body(X_ENT); _YM['zl'] = z_low(X_ENT)
    sec = _YM['sec']
    if zm >= D3: return interp([(z, y) for y, z in sec if z <= D3 + 1e-6], D3) + 0.12 * (zm - D3)
    return interp([(z, y) for y, z in sec], zm)
def z_bot(x): return max(z_low(x), interp(STEM_INV, x) if x > STEM[0][1] else -9.0)

def section(x, sg=1, n=26):
    """the half-section at x from the keel to the shell's top, as (y, z)"""
    if x <= X_ENT: pts = section_body(x, n)
    else:
        zb = z_bot(x); zt = z_top(x); zl0 = _YM.get('zl', z_low(X_ENT)); ymid(D3); zl0 = _YM['zl']; pts = []
        for k in range(61):
            z = zb + (zt - zb) * (k / 60) ** 1.35
            zm = zl0 + (z - zb) * (D3 - zl0) / max(1e-6, D3 - zb) if z <= D3 else z
            xs = x_stem(z); s_ = max(0.0, min(1.0, (xs - x) / max(0.5, xs - X_ENT)))
            pts.append((ymid(zm) * (1 - (1 - s_) ** interp(PW, z)), z))
    return [(sg * y, z) for y, z in pts]


# ---------- colours ----------
C = {}
def colours():
    C['af'] = mat('antifouling', (0.40, 0.09, 0.07), 0.15)
    C['boot'] = mat('boot', (0.05, 0.05, 0.06), 0.5, zone=2)
    C['hull'] = mat('hull', (0.07, 0.16, 0.42), 0.55, zone=1)
    C['white'] = mat('white', (0.90, 0.91, 0.90), 0.5)
    C['inner'] = mat('inner', (0.80, 0.82, 0.81), 0.3)
    C['deck'] = mat('deck', (0.40, 0.44, 0.42), 0.12)
    C['ramp'] = mat('ramp', (0.30, 0.31, 0.31), 0.3, metal=0.4)
    C['roof'] = mat('roof', (0.78, 0.80, 0.79), 0.3)
    C['steel'] = mat('steel', (0.66, 0.68, 0.70), 0.75, metal=0.7)
    C['dark'] = mat('dark', (0.09, 0.10, 0.11), 0.25)
    C['frame'] = mat('frame', (0.07, 0.07, 0.08), 0.45)
    C['glass'] = mat('glass', (0.05, 0.08, 0.11), 0.95)
    C['prop'] = mat('bronze', (0.70, 0.52, 0.27), 0.8, metal=0.9)
    C['orange'] = mat('orange', (0.95, 0.38, 0.06), 0.45)
    C['yellow'] = mat('yellow', (0.92, 0.72, 0.10), 0.45)
    C['door'] = mat('doorblue', (0.08, 0.22, 0.62), 0.5)
    C['net'] = mat('net', (0.16, 0.30, 0.20), 0.15)
    C['float'] = mat('float', (0.92, 0.45, 0.10), 0.4)
    C['winch'] = mat('winch', (0.12, 0.28, 0.55), 0.5)
    C['rust'] = mat('rust', (0.35, 0.20, 0.12), 0.2)
    C['fish'] = mat('fishsilver', (0.66, 0.70, 0.72), 0.85, metal=0.4)


def band_mat(z):
    if z < WL - 0.08: return C['af']
    if z < WL + 0.30: return C['boot']
    if z < D2 + 0.10: return C['hull']
    return C['white']


def stations(fine=True):
    if fine:
        xs = [XA + 0.05 * i for i in range(5)] + [XA + 0.25 + 0.5 * i for i in range(14)] + [4.0 + 1.0 * i for i in range(37)] + \
             [41.0 + 0.5 * i for i in range(22)] + [52.0 + 0.25 * i for i in range(21)] + [57.12]
    else:
        xs = [XA, XA + 0.2, -1.5, 0.5, 3.0, 6.0, 10.0, 16.0, 24.0, 32.0, 38.0, 42.0, 45.0, 47.5, 50.0, 52.0, 53.5, 55.0, 56.0, 56.8, 57.12]
    return sorted(set(round(x, 4) for x in xs if XA <= x < XF - 0.01))


OUTH = lambda c: (0, c.y, min(c.z, 6.0) - 6.0)      # out and down below 6 m, out above (the bow flares)

def hull_rows(sg, fine=True):
    rows = []
    for x in stations(fine):
        sec = [(abs(y), z) for y, z in section(x, sg)]
        bands = [(WL - 0.08, 9 if fine else 3), (WL + 0.30, 1), (D2 + 0.10, 4 if fine else 2), (D3, 3 if fine else 1), (None, 3 if fine else 1)]
        rows.append([(x, sg * y, z) for y, z in resample(sec, bands)])
    return rows


def build_hull(fine=True):
    objs = []; first = {}
    for sg, nm in ((1, 'p'), (-1, 's')):
        rows = hull_rows(sg, fine); first[sg] = rows[0]
        def mf(i, j, rows=rows):
            a = rows[i][j]; b = rows[i + 1][j + 1]; return band_mat((a[2] + b[2]) / 2)
        objs.append(grid('hull_' + nm, rows, mf, out=OUTH))
    # the transom, with the slot of the stern ramp: below the ramp right across, beside it up to the top
    A = Acc('transom'); sec = [(abs(y), z) for y, z in section(XA, 1)]; zr = ramp_z(XA)
    yat = lambda z: interp([(z_, y_) for y_, z_ in sec], z)
    zs = [sec[0][1]] + [z for z in (WL - 0.08, WL + 0.3, zr) if z > sec[0][1]] + [D2 + 0.1, D3]
    for z0, z1 in zip(zs, zs[1:]):
        m = band_mat((z0 + z1) / 2)
        for sg in (1, -1):
            yi0 = 0.0 if z1 <= zr + 1e-6 else RAMP_Y; yi1 = 0.0 if z1 <= zr + 1e-6 else RAMP_Y
            A.poly([(XA, sg * yi0, z0), (XA, sg * yat(z0), z0), (XA, sg * yat(z1), z1), (XA, sg * yi1, z1)], m, (-1, 0, 0))
    objs.append(A.done(20))
    return objs


# ---------- the stern ramp, the decks and the bulwarks ----------
RAMP_X1 = 6.6                                       # where the ramp meets deck 3
DRUM_X, DRUM_Z = 8.2, D3 + 1.55                     # the net drum at the top of the ramp
WINCH_X, WINCH_Y = 13.8, 4.55                       # the split trawl winches
def ramp_z(x): return 5.70 + (D3 - 5.70) * max(0.0, min(1.0, (x - XA) / (RAMP_X1 - XA)))

def decks(fine=True):
    A = Acc('decks'); m = C['deck']
    xs = sorted(set([x for x in stations(fine) if x <= 56.4] + [56.4, RAMP_X1]))
    # deck 3: beside the ramp aft, right across forward of it
    for i in range(len(xs) - 1):
        x0, x1 = xs[i], xs[i + 1]; z0, z1 = z_deck(x0), z_deck(x1); y0, y1 = hbz(x0, z0) - 0.06, hbz(x1, z1) - 0.06
        if y0 < 0.05 and y1 < 0.05: continue
        if x1 <= RAMP_X1 + 1e-6:
            for sg in (1, -1): A.poly([(x0, sg * RAMP_Y, z0), (x1, sg * RAMP_Y, z1), (x1, sg * y1, z1), (x0, sg * y0, z0)], m, (0, 0, 1))
        else:
            A.poly([(x0, -y0, z0), (x1, -y1, z1), (x1, y1, z1), (x0, y0, z0)], m, (0, 0, 1))
    # the ramp, and its walls up to deck 3
    A.poly([(XA, -RAMP_Y, ramp_z(XA)), (RAMP_X1, -RAMP_Y, D3), (RAMP_X1, RAMP_Y, D3), (XA, RAMP_Y, ramp_z(XA))], C['ramp'], (0, 0, 1))
    for sg in (1, -1):
        A.poly([(XA, sg * RAMP_Y, ramp_z(XA)), (RAMP_X1, sg * RAMP_Y, D3), (XA, sg * RAMP_Y, D3)], C['inner'], (0, -sg, 0))
    # ribs across the ramp
    for k in range(1, 8):
        x = XA + (RAMP_X1 - XA) * k / 8; z = ramp_z(x)
        abox(A, x - 0.05, x + 0.05, -RAMP_Y, RAMP_Y, z, z + 0.08, C['steel'], skip=('-z',))
    # the inside of the shell above the deck (the bulwark forward, the coaming of the trawl deck aft)
    for sg in (1, -1):
        for i in range(len(xs) - 1):
            x0, x1 = xs[i], xs[i + 1]
            if x1 < 44.0: continue
            za, zb = z_deck(x0), z_deck(x1); ta, tb = z_top(x0), z_top(x1)
            ya, yb = hbz(x0, za) - 0.06, hbz(x1, zb) - 0.06
            if ya < 0.05 and yb < 0.05: continue
            A.poly([(x0, sg * ya, za), (x1, sg * yb, zb), (x1, sg * (hbz(x1, tb) - 0.06), tb), (x0, sg * (hbz(x0, ta) - 0.06), ta)], C['inner'], (0, -sg, 0))
            A.poly([(x0, sg * (hbz(x0, ta) - 0.06), ta), (x1, sg * (hbz(x1, tb) - 0.06), tb), (x1, sg * hbz(x1, tb), tb + 0.01), (x0, sg * hbz(x0, ta), ta + 0.01)], C['white'], (0, 0, 1))
    return [A.done(25)]

def hbz(x, z):
    """the half-breadth of the shell at x and height z"""
    sec = [(abs(y), zz) for y, zz in section(x, 1)]
    if z <= sec[0][1]: return 0.0
    for a, b in zip(sec, sec[1:]):
        if a[1] <= z <= b[1]: t = (z - a[1]) / max(1e-9, b[1] - a[1]); return a[0] + (b[0] - a[0]) * t
    return sec[-1][0]


def rails(fine=True):
    """railings on deck 3 from the stern to the superstructure, and round deck 4 (stanchions and two rails)"""
    A = Acc('rails'); m = C['white']
    for sg in (1, -1):
        xs = [XA + 0.4 + 1.5 * k for k in range(int((44.0 - XA - 0.4) / 1.5) + 1)]
        pts = [(x, sg * (hbz(x, D3) - 0.10), D3) for x in xs]
        for p in pts:
            if fine and 3.6 < p[0] < 28.0: acyl(A, p, (p[0], p[1], p[2] + 1.05), 0.035, lambda z: m, seg=6)
        for h in (0.55, 1.05):
            run = [p for p in pts if 3.6 < p[0] < 28.0]
            if len(run) > 1: acyl(A, (run[0][0], run[0][1], D3 + h), (run[-1][0], run[-1][1], D3 + h), 0.03, lambda z: m, seg=6, cap=False)
    return [A.done(30)]


# ---------- the skeg, the nozzle and propeller, the rudder ----------
def underwater(fine=True):
    objs = []
    # the skeg under the canoe body aft, carrying the stern tube
    xs = [2.9 + (10.5 - 2.9) * k / 16 for k in range(17)]
    top = [(x, z_low(x) + 0.4) for x in xs]
    bot = [(x, -0.30 + 0.004 * (x - 2.9) if x < 8.0 else z_low(x) - 0.02) for x in reversed(xs)]
    rings = [[(x, sy * (0.45 if x < 9.0 else 0.45 * (10.5 - x) / 1.5 + 0.02), z) for x, z in top + bot] for sy in (1, -1)]
    objs.append(loft_rings('skeg', rings, C['af']))
    # the shoe from the skeg aft under the nozzle to the rudder's heel
    objs.append(box('shoe', -1.30, 3.00, -0.22, 0.22, -0.36, -0.12, C['af']))
    # the nozzle (a ring with a profile) and the propeller in it
    seg = 28 if fine else 12; zc = 1.75; xn0, xn1 = 0.95, 2.55
    prof = [(xn0, 1.78), (xn0 + 0.25, 1.92), (xn0 + 0.8, 1.90), (xn1, 1.80), (xn1 - 0.2, 1.60), (xn0 + 0.6, 1.52), (xn0 + 0.05, 1.62)]
    rr = [[(x, r * math.cos(2 * math.pi * k / seg), zc + r * math.sin(2 * math.pi * k / seg)) for k in range(seg)] for x, r in prof]
    bm = bmesh.new(); vs = [[bm.verts.new(p) for p in ring] for ring in rr]
    for i in range(len(rr)):
        for k in range(seg):
            j = (k + 1) % seg; i1 = (i + 1) % len(rr)
            try: bm.faces.new([vs[i][k], vs[i][j], vs[i1][j], vs[i1][k]])
            except ValueError: pass
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    objs.append(shade(obj_from_bm('nozzle', bm, [C['af']]), 40))
    objs.append(cyl('hub', (1.30, 0, zc), (2.30, 0, zc), 0.42, C['prop'], 12, r1=0.30))
    objs.append(cyl('shaft', (2.30, 0, zc), (3.2, 0, zc), 0.22, C['steel'], 10))
    for k in range(4):
        a = 2 * math.pi * k / 4 + 0.4; e = (0, math.cos(a), math.sin(a)); t = (0, -math.sin(a), math.cos(a))
        bl = [(1.95 + 0.25 * f, (0.35 + 1.15 * r) * e[1] + t[1] * w, zc + (0.35 + 1.15 * r) * e[2] + t[2] * w)
              for r, w, f in ((0, -0.30, 0), (0.5, -0.42, 0.4), (1.0, -0.20, 1.0), (1.0, 0.20, 1.0), (0.5, 0.40, -0.4), (0, 0.28, 0))]
        objs.append(loft_rings('blade%d' % k, [[(p[0] - 0.04, p[1], p[2]) for p in bl], [(p[0] + 0.04, p[1], p[2]) for p in bl]], C['prop']))
    # the rudder (a flap rudder), hung under the counter aft of the nozzle
    rud = [(-0.20, 4.05), (-2.05, 4.05), (-2.25, 3.6), (-2.25, 0.10), (-2.05, -0.15), (-0.20, -0.15), (-0.05, 0.4), (-0.05, 3.6)]
    w = lambda x: 0.30 * max(0.25, 1 - abs(x + 0.75) / 1.6)
    objs.append(loft_rings('rudder', [[(x, w(x), z) for x, z in rud], [(x, -w(x), z) for x, z in rud]], C['af']))
    # the bulbous bow
    B = [(50.6, 0.0, 0.0, 2.90), (51.6, 1.15, 1.95, 2.95), (53.0, 1.25, 1.85, 3.05), (54.5, 1.15, 1.6, 3.15), (55.6, 0.92, 1.28, 3.28),
         (56.3, 0.66, 0.92, 3.40), (56.75, 0.36, 0.52, 3.48), (56.95, 0.06, 0.10, 3.50)]
    sg2 = 24 if fine else 10; rings = []
    for x, ry, rz, zc2 in B:
        ry = max(ry, 0.02); rz = max(rz, 0.02)
        rings.append([(x, ry * math.cos(2 * math.pi * k / sg2), zc2 + rz * math.sin(2 * math.pi * k / sg2)) for k in range(sg2)])
    rings[0] = [(50.6, 0.6 * math.cos(2 * math.pi * k / sg2), 2.9 + 2.1 * math.sin(2 * math.pi * k / sg2)) for k in range(sg2)]
    bb = loft_rings('bulb', rings, C['af'], angle=60)
    objs.append(bb)
    return objs


# ---------- the stern: casings beside the ramp, the gantry with the gallows, the A-frame mast ----------
GAL_Y = 3.55; GAL_X = XA - 0.55; GAL_Z = 14.55       # where the doors hang (the gallows block's sheave)

def stern(fine=True):
    A = Acc('stern'); w = C['white']; st = C['steel']
    for sg in (1, -1):
        # the casings either side of the ramp, up to the gantry deck
        y0, y1 = RAMP_Y + 0.15, hbz(-1.0, D3) - 0.25
        abox(A, XA + 0.05, 3.4, sg * y0 if sg > 0 else -y1, sg * y1 if sg > 0 else -y0, D3, D3 + 2.45, w)
        abox(A, XA - 0.05, 3.6, sg * (y0 - 0.1) if sg > 0 else -(y1 + 0.15), sg * (y1 + 0.15) if sg > 0 else -(y0 - 0.1), D3 + 2.45, D3 + 2.6, C['roof'])
        # doors and portholes in the casings
        abox(A, 3.40, 3.43, sg * 4.0 if sg > 0 else -4.9, sg * 4.9 if sg > 0 else -4.0, D3 + 0.05, D3 + 2.0, C['dark'])
        # the gantry legs at the stern corners, tapering up to the crossbeam
        lx0, lx1 = XA - 0.10, XA + 1.40
        for z0, z1, yi, yo in ((D3 + 2.6, 16.2, 4.75, 5.85),):
            A.poly([(lx0, sg * yi, z0), (lx1, sg * yi, z0), (lx1, sg * (yi + 0.15), z1), (lx0, sg * (yi + 0.15), z1)], w, (0, -sg, 0))
            A.poly([(lx0, sg * yo, z0), (lx1, sg * yo, z0), (lx1, sg * (yo - 0.1), z1), (lx0, sg * (yo - 0.1), z1)], w, (0, sg, 0))
            A.poly([(lx0, sg * yi, z0), (lx0, sg * yo, z0), (lx0, sg * (yo - 0.1), z1), (lx0, sg * (yi + 0.15), z1)], w, (-1, 0, 0))
            A.poly([(lx1, sg * yi, z0), (lx1, sg * yo, z0), (lx1, sg * (yo - 0.1), z1), (lx1, sg * (yi + 0.15), z1)], w, (1, 0, 0))
        # the gallows arm out over the stern, with the block the warp runs over
        abox(A, GAL_X - 0.30, XA + 0.2, sg * (GAL_Y - 0.35) if sg > 0 else -(GAL_Y + 0.35), sg * (GAL_Y + 0.35) if sg > 0 else -(GAL_Y - 0.35), 15.45, 16.2, w)
        cyl_ = acyl(A, (GAL_X, sg * GAL_Y - 0.12, GAL_Z), (GAL_X, sg * GAL_Y + 0.12, GAL_Z), 0.55, lambda z: C['yellow'], seg=14 if fine else 8)
        abox(A, GAL_X - 0.08, GAL_X + 0.08, sg * GAL_Y - 0.2, sg * GAL_Y + 0.2, GAL_Z, 15.45, st)
        # floodlights under the beam
        abox(A, XA + 0.3, XA + 0.6, sg * 2.4 - 0.15, sg * 2.4 + 0.15, 15.25, 15.45, C['dark'])
    # the crossbeam over the ramp, with the stern light
    abox(A, XA - 0.10, XA + 1.40, -5.85, 5.85, 16.2, 17.1, w)
    abox(A, XA - 0.2, XA + 1.5, -5.95, 5.95, 17.1, 17.25, C['roof'])
    acyl(A, (XA + 0.6, 0, 17.25), (XA + 0.6, 0, 18.6), 0.07, lambda z: w, seg=8)
    # the A-frame mast over the trawl lane: two inclined legs from deck 3 to a platform at 20 m, with the exhaust in the starboard one
    for sg in (1, -1):
        p0 = (10.3, sg * 3.4, D3); p1 = (3.6, sg * 1.35, 20.0); q0 = (2.9, sg * 2.9, D3 + 2.6); q1 = (2.9, sg * 1.25, 20.0)
        beam(A, p0, p1, 0.75, 0.9, w); beam(A, q0, q1, 0.55, 0.7, w)
        for t in (0.3, 0.55, 0.8):
            a = [p0[i] + (p1[i] - p0[i]) * t for i in range(3)]; b = [q0[i] + (q1[i] - q0[i]) * t for i in range(3)]
            beam(A, a, b, 0.22, 0.22, w)
    abox(A, 2.4, 4.6, -2.0, 2.0, 19.8, 20.6, w)
    abox(A, 2.2, 4.8, -2.15, 2.15, 20.6, 20.75, C['roof'])
    acyl(A, (3.5, 0, 20.75), (3.5, 0, 24.5), 0.12, lambda z: w, seg=8, r1=0.07)
    abox(A, 3.2, 3.8, -1.2, 1.2, 22.6, 22.75, w)
    for sg in (1, -1):
        acyl(A, (3.0, sg * 1.5, 20.75), (3.0, sg * 1.5, 22.2), 0.33, lambda z: C['steel'] if z < 21.9 else C['dark'], seg=10, cuts=(21.9,))   # the exhausts
    # the block the net is hoisted on, under the platform
    acyl(A, (3.6, -0.15, 19.2), (3.6, 0.15, 19.2), 0.45, lambda z: C['yellow'], seg=12)
    return [A.done(30)]


# ---------- the trawl deck: net drum, trawl winches, the main winch, the crane and the rescue boat ----------
def trawl_deck(fine=True):
    A = Acc('trawldeck'); sg_ = 22 if fine else 10
    # the net drum across the top of the ramp (the net on it is a part of its own, view3d.js unwinds it)
    for sg in (1, -1): abox(A, DRUM_X - 0.9, DRUM_X + 0.9, sg * 2.25 - 0.17, sg * 2.25 + 0.17, D3, D3 + 2.6, C['winch'])
    acyl(A, (DRUM_X, -2.1, DRUM_Z), (DRUM_X, 2.1, DRUM_Z), 0.45, lambda z: C['winch'], seg=sg_)
    for sg in (1, -1): acyl(A, (DRUM_X, sg * 1.95, DRUM_Z), (DRUM_X, sg * 2.1, DRUM_Z), 1.35, lambda z: C['winch'], seg=sg_)
    # the split trawl winches either side, each a drum of warp between flanges on a frame
    for sg in (1, -1):
        y = sg * WINCH_Y; abox(A, WINCH_X - 1.4, WINCH_X + 1.4, y - 0.95, y + 0.95, D3, D3 + 0.35, C['winch'])
        for dy in (-0.95, 0.95): acyl(A, (WINCH_X, y + dy - 0.06, D3 + 1.25), (WINCH_X, y + dy + 0.06, D3 + 1.25), 0.95, lambda z: C['winch'], seg=sg_)
        acyl(A, (WINCH_X, y - 0.9, D3 + 1.25), (WINCH_X, y + 0.9, D3 + 1.25), 0.7, lambda z: C['steel'], seg=sg_)
        for dy in (-1.0, 1.0): abox(A, WINCH_X - 1.2, WINCH_X + 1.2, y + dy - 0.08, y + dy + 0.08, D3 + 0.35, D3 + 2.1, C['winch'])
    # the main winch in front of the superstructure
    acyl(A, (26.2, -1.6, D3 + 0.9), (26.2, 1.6, D3 + 0.9), 0.75, lambda z: C['winch'], seg=sg_)
    for sg in (1, -1): abox(A, 25.5, 26.9, sg * 1.7 - 0.12, sg * 1.7 + 0.12, D3, D3 + 1.8, C['winch'])
    # the knuckle-boom crane on the starboard side, boom laid forward
    acyl(A, (17.0, -4.3, D3), (17.0, -4.3, D3 + 2.2), 0.55, lambda z: C['white'], seg=sg_)
    beam(A, (17.0, -4.3, D3 + 2.4), (23.6, -4.0, D3 + 2.9), 0.45, 0.6, C['white']); beam(A, (23.6, -4.0, D3 + 2.9), (19.0, -3.9, D3 + 3.15), 0.35, 0.45, C['white'])
    acyl(A, (23.6, -4.0, D3 + 2.9), (23.6, -4.0, D3 + 1.6), 0.06, lambda z: C['steel'], seg=6); abox(A, 23.4, 23.8, -4.2, -3.8, D3 + 1.3, D3 + 1.6, C['yellow'])
    # the rescue boat on its cradle on the port side, with its davit
    for sg in (1,):
        bx0, bx1, by, bz = 17.6, 23.6, 4.45, D3 + 0.9
        rb = [(bx0, 0.0, 0.0), (bx0 + 0.2, 0.75, 0.0), (bx1 - 1.4, 0.95, 0.0), (bx1 - 0.2, 0.45, 0.25), (bx1, 0.0, 0.45)]
        ring = lambda z, sc: [(x, by + sc * y, z + h) for x, y, h in rb] + [(x, by - sc * y, z + h) for x, y, h in reversed(rb[1:-1])]
        R0 = ring(bz, 0.75); R1 = ring(bz + 0.8, 1.05)
        for i in range(len(R0)):
            j = (i + 1) % len(R0); A.poly([R0[i], R0[j], R1[j], R1[i]], C['orange'], ((R0[i][0] + R0[j][0]) / 2 - 20.6, (R0[i][1] + R0[j][1]) / 2 - by, 0))
        A.poly(list(reversed(R0)), C['orange'], (0, 0, -1)); A.poly(R1, C['dark'], (0, 0, 1))
        abox(A, 19.3, 21.0, by - 0.5, by + 0.5, bz + 0.8, bz + 1.5, C['white'])
        for x in (bx0 + 1.0, bx1 - 1.5): abox(A, x - 0.2, x + 0.2, by - 0.9, by + 0.9, D3, bz + 0.05, C['steel'])
        acyl(A, (24.4, 5.5, D3), (24.4, 5.5, D3 + 4.2), 0.18, lambda z: C['white'], seg=8); beam(A, (24.4, 5.5, D3 + 4.2), (21.0, 4.6, D3 + 4.6), 0.25, 0.3, C['white'])
    # liferaft canisters forward on deck 3
    for sg in (1, -1):
        for k in range(3):
            x = 45.4 + 0.95 * k; y = sg * (hbz(x, D3) - 0.75); acyl(A, (x, y - 0.4, D3 + 1.25), (x, y + 0.4, D3 + 1.25), 0.36, lambda z: C['white'], seg=10)
            acyl(A, (x, y + 0.4, D3 + 1.25), (x, y - 0.4, D3 + 1.25), 0.36, lambda z: C['white'], seg=10)
            abox(A, x - 0.3, x + 0.3, y - 0.45, y + 0.45, z_deck(x), D3 + 0.9, C['steel'])
    return [A.done(30)]


# ---------- the superstructure: deck 3 to 4 from frame 47, the wheelhouse on deck 4, the mast ----------
SX0, SX1 = 28.0, 44.3            # the block on deck 3
WX0, WX1, WY, WCH = 30.5, 42.1, 4.95, 1.6       # the wheelhouse (octagonal in plan) and its chamfers
WZ0, WS, WZ1 = D4, 15.15, 16.75                  # its floor, the window sill and head

def octo(x0, x1, y, ch):
    return [(x0, -y + ch), (x0 + ch, -y), (x1 - ch, -y), (x1, -y + ch), (x1, y - ch), (x1 - ch, y), (x0 + ch, y), (x0, y - ch)]

def superstructure(fine=True):
    A = Acc('super'); G = Acc('glassw'); w = C['white']
    # the block: full breadth aft, chamfered forward, with a row of windows
    blk = [(SX0, -6.0), (SX1 - 2.2, -6.0), (SX1, -4.6), (SX1, 4.6), (SX1 - 2.2, 6.0), (SX0, 6.0)]
    n = len(blk)
    for i in range(n):
        a, b = blk[i], blk[(i + 1) % n]; nx, ny = b[1] - a[1], -(b[0] - a[0])
        A.poly([(a[0], a[1], D3), (b[0], b[1], D3), (b[0], b[1], D4), (a[0], a[1], D4)], w, (nx, ny, 0))
        L = math.hypot(b[0] - a[0], b[1] - a[1]); k = int(L / 2.2)
        for j in range(k):
            t0 = (j + 0.3) / k; t1 = (j + 0.7) / k; P = lambda t, z: (a[0] + (b[0] - a[0]) * t + nx / L * 0.02, a[1] + (b[1] - a[1]) * t + ny / L * 0.02, z)
            if L > 3 and not (a[0] == SX0 and b[0] == SX0): A.poly([P(t0, D3 + 1.05), P(t1, D3 + 1.05), P(t1, D3 + 1.85), P(t0, D3 + 1.85)], C['glass'], (nx, ny, 0))
    # deck 4 over it, a little proud, with its railing
    d4 = [(SX0 - 0.3, -6.1), (SX1 - 2.0, -6.1), (SX1 + 0.3, -4.5), (SX1 + 0.3, 4.5), (SX1 - 2.0, 6.1), (SX0 - 0.3, 6.1)]
    A.poly([(x, y, D4) for x, y in d4], C['deck'], (0, 0, 1))
    for i in range(len(d4)):
        a, b = d4[i], d4[(i + 1) % len(d4)]; A.poly([(a[0], a[1], D4 - 0.25), (b[0], b[1], D4 - 0.25), (b[0], b[1], D4), (a[0], a[1], D4)], w, (b[1] - a[1], -(b[0] - a[0]), 0))
        for h in (0.55, 1.05): acyl(A, (a[0], a[1], D4 + h), (b[0], b[1], D4 + h), 0.03, lambda z: w, seg=6, cap=False)
        L = math.hypot(b[0] - a[0], b[1] - a[1]); k = max(1, int(L / 1.6))
        if fine:
            for j in range(k + 1): t = j / k; acyl(A, (a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, D4), (a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, D4 + 1.05), 0.035, lambda z: w, seg=6)
    # the wheelhouse: walls to the sill, a band of windows all round (the front leaning out), the roof with its overhang
    oc = octo(WX0, WX1, WY, WCH); n = len(oc)
    lean = lambda p, z: (p[0] + (0.35 * (z - WS) / (WZ1 - WS) if p[0] > WX1 - WCH - 0.01 else 0.0), p[1], z)
    for i in range(n):
        a, b = oc[i], oc[(i + 1) % n]; nrm = (b[1] - a[1], -(b[0] - a[0]), 0)
        A.poly([(a[0], a[1], WZ0), (b[0], b[1], WZ0), (b[0], b[1], WS), (a[0], a[1], WS)], w, nrm)
        A.poly([lean(a, WZ1), lean(b, WZ1), lean(b, WZ1 + 0.45), lean(a, WZ1 + 0.45)], w, nrm)
        # the glass, with the mullions
        G.poly([lean(a, WS), lean(b, WS), lean(b, WZ1), lean(a, WZ1)], C['glass'], nrm)
        L = math.hypot(b[0] - a[0], b[1] - a[1]); k = max(1, int(L / 1.45))
        for j in range(k + 1):
            t = j / k; p = (a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t)
            q0 = lean(p, WS); q1 = lean(p, WZ1); beam(A, q0, q1, 0.12, 0.12, C['frame'])
    # the dark room behind the glass
    io = octo(WX0 + 0.25, WX1 - 0.25, WY - 0.25, WCH)
    for i in range(len(io)):
        a, b = io[i], io[(i + 1) % len(io)]; A.poly([(a[0], a[1], WZ0), (b[0], b[1], WZ0), (b[0], b[1], WZ1 + 0.4), (a[0], a[1], WZ1 + 0.4)], C['dark'], (-(b[1] - a[1]), b[0] - a[0], 0))
    A.poly([(x, y, WS - 0.9) for x, y in io], C['dark'], (0, 0, 1))
    # the roof with an overhang, a visor over the front windows
    ro = octo(WX0 - 0.3, WX1 + 0.75, WY + 0.3, WCH + 0.1)
    A.poly([(x, y, WZ1 + 0.45) for x, y in ro], C['roof'], (0, 0, -1)); A.poly([(x, y, WZ1 + 0.62) for x, y in ro], C['roof'], (0, 0, 1))
    for i in range(len(ro)):
        a, b = ro[i], ro[(i + 1) % len(ro)]; A.poly([(a[0], a[1], WZ1 + 0.45), (b[0], b[1], WZ1 + 0.45), (b[0], b[1], WZ1 + 0.62), (a[0], a[1], WZ1 + 0.62)], w, (b[1] - a[1], -(b[0] - a[0]), 0))
    # the mast on the roof: a tapering post, the radar platform with two scanners, domes and the masthead lights
    mx = 33.4; zr = WZ1 + 0.62
    acyl(A, (mx, 0, zr), (mx, 0, 29.0), 0.32, lambda z: w, seg=10, r1=0.10)
    abox(A, mx - 0.6, mx + 3.0, -1.6, 1.6, 19.4, 19.6, w)
    for h in (0.5,):
        for a, b in (((mx - 0.6, -1.6), (mx + 3.0, -1.6)), ((mx + 3.0, -1.6), (mx + 3.0, 1.6)), ((mx + 3.0, 1.6), (mx - 0.6, 1.6))):
            acyl(A, (a[0], a[1], 19.6 + h), (b[0], b[1], 19.6 + h), 0.025, lambda z: w, seg=5, cap=False)
    abox(A, mx + 0.8, mx + 1.2, -0.2, 0.2, 19.6, 20.1, C['dark']); abox(A, mx - 1.2, mx + 3.2, -0.12, 0.12, 20.1, 20.32, C['dark'])
    abox(A, mx + 0.4, mx + 0.7, -0.15, 0.15, 21.8, 22.2, C['dark']); abox(A, mx - 1.0, mx + 2.1, -0.1, 0.1, 22.2, 22.4, C['dark'])
    for y in (-1.2, 1.2): sphere_ = acyl(A, (mx - 2.2, y, zr), (mx - 2.2, y, zr + 0.7), 0.1, lambda z: w, seg=6); acyl(A, (mx - 2.2, y, zr + 0.7), (mx - 2.2, y, zr + 1.4), 0.55, lambda z: C['white'], seg=12, r1=0.35)
    for z in (24.8, 26.6, 28.4): acyl(A, (mx + 0.2, 0, z), (mx + 0.2, 0, z + 0.3), 0.1, lambda z_: C['white'], seg=8)
    for y in (-0.4, 0.4): acyl(A, (mx + 1.5, y, zr), (mx + 1.5, y, 26.0), 0.04, lambda z: C['steel'], seg=5)
    # sidelights on the wheelhouse wings, the ladders from deck 3
    for sg in (1, -1): abox(A, 39.6, 40.4, sg * (WY + 0.32) - 0.12, sg * (WY + 0.32) + 0.12, WZ1 + 0.15, WZ1 + 0.42, C['dark'])
    for sg in (1, -1):
        for k in range(8): z = D3 + 0.29 * k; x = SX0 - 1.8 + 0.25 * k; abox(A, x, x + 0.25, sg * 5.0 - 0.5, sg * 5.0 + 0.5, z, z + 0.06, C['steel'])
    return [A.done(30)], [G.done(30)]


# ---------- the side: portholes, the side door, the name, fenders ----------
def side_details(fine=True):
    A = Acc('side')
    for sg in (1, -1):
        for x in [29.0 + 2.6 * k for k in range(6)]:
            y = hbz(x, 10.2) + 0.015
            acyl(A, (x, sg * y, 10.2), (x, sg * (y + 0.02), 10.2), 0.24, lambda z: C['dark'], seg=10 if fine else 6)
        x = 24.6; y = hbz(x, 9.6) + 0.012
        A.poly([(x - 0.9, sg * y, 8.9), (x + 0.9, sg * y, 8.9), (x + 0.9, sg * y, 10.4), (x - 0.9, sg * y, 10.4)], C['dark'], (0, sg, 0))
        # the anchors in their pockets
        x = 53.6; y = hbz(x, 9.4) + 0.02
        A.poly([(x - 0.6, sg * y, 8.9), (x + 0.6, sg * y, 9.1), (x + 0.6, sg * y, 10.0), (x - 0.6, sg * y, 9.8)], C['dark'], (0, sg, 0))
    # the windlass and bollards on the foredeck
    for sg in (1, -1):
        acyl(A, (51.5, sg * 1.0, z_deck(51.5) + 0.75), (51.5, sg * 2.1, z_deck(51.5) + 0.75), 0.55, lambda z: C['winch'], seg=14)
        abox(A, 50.9, 52.1, sg * 0.4 if sg > 0 else -2.3, sg * 2.3 if sg > 0 else -0.4, z_deck(51.5), z_deck(51.5) + 0.5, C['winch'])
        for x in (47.0, 54.5): acyl(A, (x, sg * (hbz(x, D3) - 0.7), z_deck(x)), (x, sg * (hbz(x, D3) - 0.7), z_deck(x) + 0.6), 0.2, lambda z: C['steel'], seg=8)
    acyl(A, (55.6, 0, z_deck(55.6)), (55.6, 0, z_deck(55.6) + 3.0), 0.08, lambda z: C['white'], seg=8)   # the forward light post
    return [A.done(30)]


def build(fine=True):
    """all the parts: solids (to be joined and baked) and glass"""
    solids = build_hull(fine)
    solids += decks(fine)
    solids += rails(fine)
    solids += underwater(fine)
    solids += stern(fine)
    solids += trawl_deck(fine)
    o, g = superstructure(fine); solids += o
    solids += side_details(fine)
    return [s for s in solids if s], [x for x in g if x]


# ---------- the parts the 3D view moves: a trawl door, the net on the drum, the codend ----------
DOOR_W, DOOR_H = 2.2, 3.6

def door_part():
    """one trawl door in its own frame: origin at the bracket where the warp is made fast, the door hanging below it, its face across
    y (the starboard door is the same turned round); a cambered plate with three slots, a frame, a shoe and the backstrops"""
    A = Acc('door'); m = C['door']; n = 8; T = 0.16
    def P(u, v, s=0.0):        # u across (y) from -1 to 1, v down from 0 to 1, s through (x)
        return (-0.35 - 0.25 * (1 - u * u) + s, u * DOOR_W / 2, -0.55 - v * DOOR_H)
    slots = [(0.22, 0.30), (0.45, 0.53), (0.68, 0.76)]
    vs = [0.0] + sorted(set([a for a, b in slots] + [b for a, b in slots])) + [1.0]
    for i in range(len(vs) - 1):
        v0, v1 = vs[i], vs[i + 1]
        if any(abs(v0 - a) < 1e-6 and abs(v1 - b) < 1e-6 for a, b in slots): continue
        for k in range(n):
            u0 = -1 + 2 * k / n; u1 = -1 + 2 * (k + 1) / n
            A.poly([P(u0, v0), P(u1, v0), P(u1, v1), P(u0, v1)], m, (-1, 0, 0))
            A.poly([P(u0, v0, T), P(u1, v0, T), P(u1, v1, T), P(u0, v1, T)], m, (1, 0, 0))
    for a, b in slots:
        for k in range(n):
            u0 = -1 + 2 * k / n; u1 = -1 + 2 * (k + 1) / n
            A.poly([P(u0, a), P(u1, a), P(u1, a, T), P(u0, a, T)], m, (0, 0, 1)); A.poly([P(u0, b), P(u1, b), P(u1, b, T), P(u0, b, T)], m, (0, 0, -1))
    for u in (-1, 1):
        A.poly([P(u, 0), P(u, 1), P(u, 1, T), P(u, 0, T)], C['steel'], (0, u, 0))
    for k in range(n):
        u0 = -1 + 2 * k / n; u1 = -1 + 2 * (k + 1) / n
        A.poly([P(u0, 0), P(u1, 0), P(u1, 0, T), P(u0, 0, T)], C['steel'], (0, 0, 1)); A.poly([P(u0, 1), P(u1, 1), P(u1, 1, T), P(u0, 1, T)], C['rust'], (0, 0, -1))
    # the shoe along the foot, worn bright
    abox(A, -0.60, -0.20, -DOOR_W / 2, DOOR_W / 2, -0.55 - DOOR_H - 0.18, -0.55 - DOOR_H + 0.02, C['rust'])
    # the bracket and the backstrops up to the shackle at the origin
    for u in (-0.55, 0.55):
        acyl(A, (0, 0, 0), P(u, 0.12, 0.08), 0.035, lambda z: C['steel'], seg=5)
    acyl(A, (0, 0, -0.05), (0, 0, 0.12), 0.09, lambda z: C['steel'], seg=8)
    return A.done(40)

def codend_part():
    """the codend full of fish, as it comes up the ramp: a fat bag of mesh 8 m long, origin at its mouth, lying along -x (aft)"""
    A = Acc('codend'); seg = 12; ns = 10
    rings = []
    for i in range(ns + 1):
        t = i / ns; x = -8.0 * t; r = 0.55 + 0.75 * math.sin(math.pi * min(1.0, t * 1.15)) ** 0.7 * (1 - 0.35 * t)
        if i == ns: r = 0.25
        rings.append([(x, r * math.cos(2 * math.pi * k / seg), r + r * 0.85 * math.sin(2 * math.pi * k / seg)) for k in range(seg)])
    for i in range(ns):
        for k in range(seg):
            j = (k + 1) % seg; a, b, c, d = rings[i][k], rings[i][j], rings[i + 1][j], rings[i + 1][k]
            # green mesh in bands, the fish bulging silver between them, an orange chafer underneath
            m = C['float'] if (k in (8, 9) and i % 2 == 0) else C['net'] if (i % 2 == 0 or k % 4 == 0) else C['fish']
            A.poly([a, b, c, d], m, (0, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2 - 0.6))
    A.poly(list(reversed(rings[-1])), C['net'], (-1, 0, 0))
    return A.done(50)

def netroll_part():
    """the trawl wound on the drum: a green roll round the drum's axis (y), origin on the axis; the 3D view scales it as the net
    pays out"""
    A = Acc('netroll'); seg = 18
    acyl(A, (0, 0, 0), (0, 1.9, 0), 1.25, lambda z: C['net'], seg=seg)
    acyl(A, (0, 0, 0), (0, -1.9, 0), 1.25, lambda z: C['net'], seg=seg)
    for k in range(5):
        y = -1.6 + 0.8 * k; acyl(A, (0, y - 0.06, 0), (0, y + 0.06, 0), 1.27, lambda z: C['float'], seg=seg)
    return A.done(50)


def to_game(p): return (-p[1], p[2] - WL, -(p[0] - XM))
def to_game_n(n): return (-n[1], n[2], -n[0])

def anchors():
    G = lambda x, y, z: [round(v, 3) for v in to_game((x, y, z))]
    return {'eye': G(40.6, -0.9, WZ0 + 1.75), 'skipperAt': G(40.2, -0.9, WZ0), 'hp': -0.10, 'fov': 58,
            'crewSpots': [G(10.0, 2.6, D3) + [1.57], G(14.5, -3.0, D3) + [0.0], G(6.8, -3.2, D3) + [3.14], G(20.0, 2.8, D3) + [0.0]],
            'lights': [[G(33.6, 0, 26.75), [1, 0.95, 0.85]], [G(40.0, WY + 0.32, WZ1 + 0.28), [1, 0.12, 0.1]], [G(40.0, -WY - 0.32, WZ1 + 0.28), [0.1, 1, 0.35]],
                       [G(XA + 0.6, 0, 18.4), [1, 0.95, 0.85]], [G(XA + 0.45, 2.4, 15.2), [1, 0.95, 0.85]], [G(XA + 0.45, -2.4, 15.2), [1, 0.95, 0.85]], [G(55.6, 0, z_deck(55.6) + 2.9), [1, 0.95, 0.85]]],
            'deck': {'y': round(D3 - WL, 3), 'z': round(-(15.0 - XM), 3)}, 'gw': round(D3 + 1.05 - WL, 3),
            'stern': round(XM - XA, 3), 'bow': round(-(XF - XM), 3), 'side': 6.25, 'beam': 12.5, 'pl': 24.0, 'rl': 4.7, 'open': False, 'hand': False,
            'pole': G(XA + 1.2, 0, 18.6), 'hauler': G(21.0, -5.9, D3 + 1.0), 'filler': G(24.0, 6.0, D3 + 0.3),
            # the trawl (view3d.js TRAWL): where the doors hang (port; starboard is mirrored), the ramp, the drum and the warps' leads
            'trawl': {'door': G(GAL_X, GAL_Y, GAL_Z), 'doorW': DOOR_W, 'doorH': DOOR_H, 'rampTop': G(RAMP_X1, 0, D3 + 0.1), 'rampFoot': G(XA, 0, ramp_z(XA)),
                      'drum': G(DRUM_X, 0, DRUM_Z), 'winch': G(WINCH_X, WINCH_Y, D3 + 1.25), 'block': G(3.6, 0, 19.2)}}


SHOTS = [('bow3q', (95.0, -55.0, 20.0), (27.0, 0, 8.0), 35), ('stern3q', (-38.0, 42.0, 24.0), (20.0, 0, 9.0), 35), ('side', (27.0, -105, 9.0), (27.0, 0, 10.0), 35),
         ('above', (72.0, -48.0, 62.0), (27.0, 0, 6.0), 35), ('stern', (-46.0, -6.0, 13.0), (0.0, 0, 11.0), 30), ('deck', (-4.0, -10.0, 22.0), (14.0, 0, 11.0), 30)]

def main():
    os.makedirs(OUT, exist_ok=True)
    reset(); colours()
    solids, glass = build(True)
    join(solids, 'BOAT0'); join(glass, 'GLASS0')
    # the doors hanging in the gallows and the net on the drum, for the pictures (the GLB has them as parts of their own)
    show = []
    for sg in (1, -1):
        d = door_part(); d.location = (GAL_X, sg * GAL_Y, GAL_Z); d.rotation_euler = (0, 0, 0 if sg > 0 else math.pi); show.append(d)
    nr = netroll_part(); nr.location = (DRUM_X, 0, DRUM_Z); show.append(nr)
    if 'fast' not in sys.argv: beauty(OUT, 'tr', WL, SHOTS)
    for o in show: bpy.data.objects.remove(o, do_unlink=True)
    ex = {'frame': 'kystfiske: x starboard, y up from the waterline, z aft; metres', 'type': 'bunntral', 'name': 'Fish processing vessel 60 m (stern trawler)',
          'len': 60.3, 'beam': 12.5, 'draft': 5.1, 'anchors': anchors()}
    part = lambda f: (lambda: f())
    more = [{'name': 'door', 'obj': part(door_part), 'xf_p': lambda p: (-p[1], p[2], -p[0]), 'xf_n': lambda n: (-n[1], n[2], -n[0]), 'ao': True},
            {'name': 'codend', 'obj': part(codend_part), 'xf_p': lambda p: (-p[1], p[2], -p[0]), 'xf_n': lambda n: (-n[1], n[2], -n[0])},
            {'name': 'netroll', 'obj': part(netroll_part), 'xf_p': lambda p: (-p[1], p[2], -p[0]), 'xf_n': lambda n: (-n[1], n[2], -n[0])}]
    export_boat(build, to_game, to_game_n, OUT, 'tral60.glb', os.path.join(ROOT, 'src', 'data', 'boat-tral60.b64'), ex,
                side=(os.path.join(ROOT, 'src', 'data', 'boat-tral60-side.b64'), 27.0, 12.0, 66.0), dry='dry' in sys.argv, more=more)


if __name__ == '__main__':
    main()
