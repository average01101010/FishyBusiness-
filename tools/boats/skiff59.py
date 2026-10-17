"""The starter boat: an open 5.9 m aluminium boat with a centre console and a 60 hp outboard, built in Blender from the general
arrangement of the Plate Alloy 5.9m Adventurer (Plate Alloy Australia): length overall 6.1 m, length 5.9 m, beam 2.45 m (2.02 m inside),
depth 1.17 m, draft 0.3 m, deadrise 10.5 degrees at the transom. The drawing is not in the repository; the numbers below were measured
from it (stations 700 mm apart, 93.9 px/m). Painted white with a navy boot stripe and a grey bottom (Jonas' choice). The cockpit is
open and seen from everywhere, so it is modelled in full; the wheel, the throttle, the outboard and the propeller move in the game
(view3d.js), so the motor and the propeller are parts of their own and the wheel and the lever are only drawn here for the renders.

    pip install bpy==4.5.4
    python3 tools/boats/skiff59.py            -> src/data/boat-skiff59.b64 (+ the side picture), renders in tools/boats/out/
    python3 tools/boats/skiff59.py check      -> only the overlays on the drawing (SKIFF_GA)
    python3 tools/boats/skiff59.py fast dry   -> no renders to look at, and the GLB only in tools/boats/out

Frame: x forward from the after end of the transom pods, y to port, z up from the keel at the transom; the waterline is z = 0.30."""
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy, bmesh
from bpyutil import *

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE)); OUT = os.path.join(HERE, 'out')
DRAWING = os.environ.get('SKIFF_GA', '')
WL = 0.30; XT = 0.60; XF = 5.80; XM = 3.0
Z_SOLE = 0.45; Z_CAST = 0.82; X_CAST = 4.08; X_BOW = 5.35; GW = 0.19; ZP = 0.62


# ---------- measured lines (metres) ----------
KEEL = [(0.0, 0.0), (4.0, 0.0), (4.66, 0.04), (4.92, 0.11), (5.19, 0.21), (5.40, 0.35), (5.62, 0.56), (5.70, 0.74), (5.75, 0.88), (XF, 1.15)]
SHEER = [(0.0, 1.06), (3.0, 1.09), (5.0, 1.13), (XF, 1.15)]
HBS = [(0.0, 1.17), (0.6, 1.20), (2.5, 1.21), (3.55, 1.15), (4.08, 1.08), (4.61, 0.92), (5.14, 0.71), (5.46, 0.52), (5.73, 0.20), (XF, 0.0)]
HBC = [(0.0, 1.04), (2.5, 1.07), (3.5, 1.01), (4.1, 0.90), (4.6, 0.72), (5.0, 0.52), (5.3, 0.33), (5.55, 0.12), (5.68, 0.0), (XF, 0.0)]
ZC = [(0.0, 0.20), (2.0, 0.22), (3.0, 0.27), (4.08, 0.38), (4.6, 0.47), (5.19, 0.61), (5.5, 0.70), (5.68, 0.76), (XF, 1.15)]
def zk(x): return interp(KEEL, x)
def zs(x): return interp(SHEER, x)
def hbs(x): return max(0.0, interp(HBS, x))
def hbc(x): return max(0.0, interp(HBC, x))
def zc(x): return max(interp(ZC, x), zk(x))
def cf(x): return 0.05 * min(1.0, hbc(x) / 0.25)          # the chine flat (spray rail), narrowing into the stem
def yi(x): return max(0.05, hbs(x) - GW)                   # inside edge of the gunwale, and the liner below it
Z_BOT = 0.34; Z_BT = 0.40                                  # grey bottom paint to 0.34, the navy boot stripe to 0.40


def section(x, nb=6, n1=3, n2=8):
    """the half-section at station x as (y, z): keel, flat bottom plate to the chine, the chine flat, flat topsides to the sheer,
    with rows on the paint lines; the counts never change, points collapse where a band is empty"""
    k = zk(x); c = zc(x); h = hbc(x); s = zs(x); H = hbs(x)
    pts = [(h * t / nb, k + (c - k) * t / nb) for t in range(nb + 1)]
    y0 = h + cf(x); z0 = min(c + 0.006, s); pts.append((y0, z0))
    ta = max(0.0, min(1.0, (Z_BOT - z0) / max(1e-6, s - z0))); tb = max(ta, min(1.0, (Z_BT - z0) / max(1e-6, s - z0)))
    for t in [ta * i / n1 for i in range(1, n1 + 1)] + [tb] + [tb + (1 - tb) * i / n2 for i in range(1, n2 + 1)]:
        pts.append((y0 + (H - y0) * t, z0 + (s - z0) * t))
    return pts

def y_at(x, z):
    """the half-breadth of the outside at station x and height z (from the chine up: the topsides plate)"""
    s = section(x)
    if z <= s[0][1]: return 0.0
    for a, b in zip(s, s[1:]):
        if a[1] <= z <= b[1] and b[1] > a[1]: return a[0] + (b[0] - a[0]) * (z - a[1]) / (b[1] - a[1])
    return s[-1][0]


def stations(fine=True):
    if fine:
        xs = [XT, 0.65, 0.75, 0.9] + [1.0 + 0.15 * i for i in range(21)] + [4.0 + 0.08 * i for i in range(19)] + [4.079, 4.081, 5.349, 5.351] + \
             [5.55, 5.6, 5.64, 5.68, 5.71, 5.74, 5.76, 5.78, 5.79, XF]
    else:
        xs = [XT, 1.5, 2.5, 3.5, 4.08, 4.6, 5.0, 5.35, 5.6, 5.72, XF]
    return sorted(set(round(x, 4) for x in xs if XT <= x <= XF))


C = {}
def colours():
    C['bottom'] = mat('bottom', (0.48, 0.50, 0.52), 0.25)
    C['boot'] = mat('boot', (0.10, 0.14, 0.24), 0.55, zone=2)
    C['hull'] = mat('hull', (0.92, 0.93, 0.92), 0.6, zone=1)
    C['rub'] = mat('rub', (0.08, 0.08, 0.09), 0.3)
    C['white'] = mat('white', (0.93, 0.94, 0.93), 0.5)
    C['inner'] = mat('inner', (0.82, 0.84, 0.84), 0.3)
    C['deck'] = mat('deck', (0.56, 0.58, 0.58), 0.1)
    C['steel'] = mat('steel', (0.76, 0.78, 0.80), 0.85, metal=0.8)
    C['dark'] = mat('dark', (0.10, 0.11, 0.12), 0.25)
    C['frame'] = mat('frame', (0.07, 0.07, 0.08), 0.45)
    C['glass'] = mat('glass', (0.25, 0.32, 0.36), 0.95)
    C['screen'] = mat('screen', (0.03, 0.05, 0.07), 0.9)
    C['cush'] = mat('cushion', (0.09, 0.09, 0.10), 0.35)
    C['tub'] = mat('tub', (0.20, 0.42, 0.62), 0.45)
    C['motor'] = mat('motor', (0.16, 0.17, 0.19), 0.65)
    C['motor2'] = mat('motor_grey', (0.55, 0.57, 0.60), 0.5)
    C['prop'] = mat('prop', (0.72, 0.74, 0.77), 0.8, metal=0.8)
    C['lred'] = mat('light_red', (0.9, 0.1, 0.08), 0.8, emit=0.5)
    C['lgreen'] = mat('light_green', (0.1, 0.8, 0.25), 0.8, emit=0.5)
    C['lwhite'] = mat('light_white', (1.0, 0.97, 0.88), 0.8, emit=0.5)


def side_mat(z):
    return C['bottom'] if z < Z_BOT - 1e-4 else C['boot'] if z < Z_BT - 1e-4 else C['hull']


# ---------- the hull ----------
OUTH = lambda c: (0, c.y, c.z - 0.25)

def build_hull(fine=True):
    objs = []; NB = 6 if fine else 2
    kw = {} if fine else {'nb': 2, 'n1': 1, 'n2': 2}
    for sg, nm in ((1, 'p'), (-1, 's')):
        rows = [[(x, sg * y, z) for y, z in section(x, **kw)] for x in stations(fine)]
        def mf(i, j, rows=rows):
            if j < NB + 1: return C['bottom']
            a = rows[i][j]; b = rows[i + 1][j + 1]; return side_mat((a[2] + b[2]) / 2)
        objs.append(grid('hull_' + nm, rows, mf, angle=30, out=OUTH))
    objs += transom(fine)
    objs += [pod(1, fine), pod(-1, fine)]
    return objs

def transom(fine=True):
    """the transom at XT with the notch for the outboard: a ladder across below the notch and a ladder each side above it"""
    objs = []; zn = 0.70
    zl = sorted(set([0.0, 0.03, 0.08, 0.13, 0.18, zc(XT), zc(XT) + 0.006, Z_BOT, Z_BT, 0.55, zn]))
    T = [[(XT, -y_at(XT, z), z), (XT, y_at(XT, z), z)] for z in zl]
    objs.append(grid('transom_low', T, lambda i, j: side_mat((T[i][0][2] + T[i + 1][0][2]) / 2), angle=20, out=lambda c: (-1, 0, 0)))
    for sg in (1, -1):
        zu = [zn + (zs(XT) - zn) * k / 4 for k in range(5)]
        U = [[(XT, sg * 0.30, z), (XT, sg * y_at(XT, z), z)] for z in zu]
        objs.append(grid('transom_up%d' % sg, U, lambda i, j: C['hull'], angle=20, out=lambda c: (-1, 0, 0)))
        objs.append(box('notch_side%d' % sg, XT - 0.005, XT + 0.06, sg * 0.30 - 0.03, sg * 0.30, zn, zs(XT), C['white']))
    objs.append(box('notch_cap', XT - 0.04, XT + 0.06, -0.33, 0.33, zn - 0.03, zn, C['white']))
    objs.append(box('bracket_plate', XT - 0.01, XT + 0.01, -0.16, 0.16, zn - 0.22, zn, C['steel']))
    return objs

def pod(sg, fine=True):
    """a transom pod aft of the transom: the hull's section outboard of |y| = 0.34 up to the platform, carried straight aft"""
    y_in = 0.34; s = section(XT); pts = []
    for a, b in zip(s, s[1:]):
        if b[0] >= y_in and a[0] <= y_in:
            t = (y_in - a[0]) / max(1e-6, b[0] - a[0]); pts.append((y_in, a[1] + (b[1] - a[1]) * t))
        if b[0] > y_in and b[1] < ZP: pts.append(b)
        if a[1] < ZP <= b[1]:
            t = (ZP - a[1]) / (b[1] - a[1]); pts.append((a[0] + (b[0] - a[0]) * t, ZP)); break
    rows = [[(x, sg * y, z) for y, z in pts] for x in (XT, 0.0)]
    objs = [grid('pod_out%d' % sg, rows, lambda i, j: side_mat((pts[j][1] + pts[j + 1][1]) / 2), angle=30, out=OUTH)]
    # the end, the inner side and the platform on top
    zb = pts[0][1]; zl = sorted(set([zb + 0.001, Z_BOT, Z_BT, ZP] + [p[1] for p in pts if p[1] > zb + 0.002]))
    E = [[(0.0, sg * y_in, z), (0.0, sg * max(y_in, yy(pts, z)), z)] for z in zl]
    objs.append(grid('pod_end%d' % sg, E, lambda i, j: side_mat((E[i][0][2] + E[i + 1][0][2]) / 2), angle=20, out=lambda c: (-1, 0, 0)))
    I = [[(XT, sg * y_in, z), (0.0, sg * y_in, z)] for z in (zb, Z_BOT, Z_BT, ZP)]
    objs.append(grid('pod_in%d' % sg, I, lambda i, j: side_mat((I[i][0][2] + I[i + 1][0][2]) / 2), angle=20, out=lambda c: (0, -sg, 0)))
    yo = pts[-1][0]
    objs.append(grid('pod_top%d' % sg, [[(XT, sg * y_in, ZP), (XT, sg * yo, ZP)], [(0.0, sg * y_in, ZP), (0.0, sg * yo, ZP)]], lambda i, j: C['deck'], out=lambda c: (0, 0, 1)))
    return join(objs, 'pod%d' % sg)

def yy(pts, z):
    for a, b in zip(pts, pts[1:]):
        if a[1] <= z <= b[1] and b[1] > a[1]: return a[0] + (b[0] - a[0]) * (z - a[1]) / (b[1] - a[1])
    return pts[-1][0] if z >= pts[-1][1] else pts[0][0]


def rub_rail(fine=True):
    xs = [x for x in stations(fine) if x < 5.79]; pts = [(XT - 0.01, -0.30, zs(XT) - 0.02)]
    pts += [(x, -(hbs(x) + 0.018), zs(x) - 0.02) for x in xs]
    pts += [(XF + 0.01, 0.0, zs(XF) - 0.02)]
    pts += [(x, hbs(x) + 0.018, zs(x) - 0.02) for x in reversed(xs)]
    pts += [(XT - 0.01, 0.30, zs(XT) - 0.02)]
    return tube('rub_rail', pts, 0.028, C['rub'], 8 if fine else 4)


# ---------- inside: gunwales, liner, sole, decks, hatches ----------
def inside(fine=True):
    objs = []
    xs = [x for x in stations(fine) if XT <= x <= X_BOW]
    for sg in (1, -1):
        G_ = [[(x, sg * hbs(x), zs(x)), (x, sg * yi(x), zs(x) - 0.004)] for x in xs]
        objs.append(grid('gunwale%d' % sg, G_, lambda i, j: C['white'], angle=40, out=lambda c: (0, 0, 1)))
        L_ = [[(x, sg * yi(x), (Z_SOLE if x < X_CAST else Z_CAST)), (x, sg * yi(x), zs(x) - 0.004)] for x in xs if x >= XT + 0.2]
        objs.append(grid('liner%d' % sg, L_, lambda i, j: C['inner'], angle=40, out=lambda c, sg=sg: (0, -sg, 0)))
        # the gunwale's inner lip, a little rounded strip at the edge
        objs.append(tube('lip%d' % sg, [(x, sg * (yi(x) + 0.004), zs(x) - 0.012) for x in xs], 0.012, C['white'], 6 if fine else 3))
        # the transom top each side of the notch
        objs.append(box('ttop%d' % sg, XT, XT + 0.22, min(sg * 0.30, sg * hbs(XT)), max(sg * 0.30, sg * hbs(XT)), zs(XT) - 0.05, zs(XT), C['white'], 0.01 if fine else 0))
    sole = [x for x in xs if XT + 0.2 <= x <= X_CAST]
    objs.append(grid('sole', [[(x, -yi(x), Z_SOLE), (x, yi(x), Z_SOLE)] for x in sole], lambda i, j: C['deck'], out=lambda c: (0, 0, 1)))
    cast = [x for x in xs if X_CAST <= x <= X_BOW]
    objs.append(grid('cast_deck', [[(x, -yi(x), Z_CAST), (x, yi(x), Z_CAST)] for x in cast], lambda i, j: C['deck'], out=lambda c: (0, 0, 1)))
    objs.append(box('cast_step', X_CAST - 0.02, X_CAST, -yi(X_CAST), yi(X_CAST), Z_SOLE, Z_CAST, C['inner']))
    bow = [x for x in stations(fine) if x >= X_BOW]
    objs.append(grid('bow_deck', [[(x, -hbs(x), zs(x)), (x, hbs(x), zs(x))] for x in bow], lambda i, j: C['white'], out=lambda c: (0, 0, 1)))
    objs.append(box('bow_face', X_BOW - 0.02, X_BOW, -yi(X_BOW), yi(X_BOW), Z_CAST, zs(X_BOW), C['inner']))
    # the aft bench across the stern, with the splash well behind the outboard
    bench = box('bench', XT + 0.02, 1.10, -yi(0.9) + 0.005, yi(0.9) - 0.005, Z_SOLE, 0.90, C['white'], 0.0)
    if fine: cut(bench, [box('well_cut', XT - 0.1, 0.88, -0.34, 0.34, 0.70, 1.3, C['white'])])
    objs.append(bench)
    cz0 = 0.02 if fine else 0
    objs.append(box('bench_cush_p', 0.90, 1.08, 0.36, yi(0.9) - 0.03, 0.90, 0.96, C['cush'], cz0))
    objs.append(box('bench_cush_s', 0.90, 1.08, -(yi(0.9) - 0.03), -0.36, 0.90, 0.96, C['cush'], cz0))
    objs.append(box('bench_cush0', 0.90, 1.08, -0.34, 0.34, 0.90, 0.96, C['cush'], cz0))
    if not fine: return objs
    # hatches: the big one and the small one in the casting deck, the anchor locker in the bow deck
    for nm, x0, x1, y0, y1 in (('hatch_big', 4.14, 4.74, -0.66, 0.58), ('hatch_small', 4.82, 5.26, -0.32, 0.32)):
        objs.append(box(nm, x0, x1, y0, y1, Z_CAST, Z_CAST + 0.018, C['white'], 0.006))
        objs.append(box(nm + '_grip', (x0 + x1) / 2 - 0.08, (x0 + x1) / 2 + 0.08, y0 + 0.05, y0 + 0.08, Z_CAST + 0.018, Z_CAST + 0.026, C['steel']))
    zb = zs(5.5)
    objs.append(loft_rings('anchor_hatch', [[(5.40, -0.24, zb), (5.40, 0.24, zb), (5.68, 0.0, zb + 0.004)], [(5.40, -0.24, zb + 0.018), (5.40, 0.24, zb + 0.018), (5.68, 0.0, zb + 0.022)]], C['inner']))
    # bench lids: two seams across the bench top
    for y in (-0.36, 0.36): objs.append(box('bench_seam%d' % int(y * 100), 0.62, 0.90, y - 0.006, y + 0.006, 0.90, 0.904, C['dark']))
    return objs


# ---------- console, seat, tub and the fittings ----------
CX0 = 1.88; CX1 = 2.48; CW = 0.33; CTOP = 1.30
def x_aft(z): return CX0 + (z - Z_SOLE) / (CTOP - Z_SOLE) * 0.20       # the console's back slopes forward to the dash

def console(fine=True):
    objs = []; glass = []
    def ring(z):
        xa = x_aft(z); r = 0.12; pts = [(xa, -CW), (CX1 - r, -CW)]
        for k in range(1, 6): a = -math.pi / 2 + math.pi / 2 * k / 6; pts.append((CX1 - r + r * math.cos(a), -CW + r + r * math.sin(a)))
        pts += [(CX1, -CW + r), (CX1, CW - r)]
        for k in range(1, 6): a = math.pi / 2 * k / 6; pts.append((CX1 - r + r * math.cos(a), CW - r + r * math.sin(a)))
        pts += [(CX1 - r, CW), (xa, CW)]
        return [(x, y, z) for x, y in pts]
    body = loft_rings('console', [ring(Z_SOLE), ring(CTOP)], C['white'], angle=30)
    if fine: bevel_mod(body, 0.015, 2)
    objs.append(body)
    if not fine:
        objs.append(box('screen_lo', 2.30, 2.34, -0.34, 0.34, CTOP, 1.60, C['dark'])); return objs, glass
    # the dash: a dark binnacle with two screens (not live), a compass; a door on the back under the wheel
    objs.append(box('binnacle', x_aft(CTOP) + 0.02, 2.30, -0.30, 0.30, CTOP, CTOP + 0.05, C['dark'], 0.01))
    for nm, y0, y1 in (('scr1', -0.27, 0.02), ('scr2', 0.06, 0.27)):
        objs.append(plate(nm, (2.20, 0, CTOP + 0.05), (0, 1, 0), (-0.35, 0, 1), [(y0, 0.0), (y1, 0.0), (y1, 0.17), (y0, 0.17)], C['screen'], 0.004, 0.0, nrm=(-1, 0, 0.35)))
        objs.append(plate(nm + 'f', (2.20, 0, CTOP + 0.05), (0, 1, 0), (-0.35, 0, 1), [(y0 - 0.02, -0.02), (y1 + 0.02, -0.02), (y1 + 0.02, 0.19), (y0 - 0.02, 0.19)], C['frame'], 0.001, 0.0, nrm=(-1, 0, 0.35)))
    objs.append(cyl('compass_base', (2.10, 0.0, CTOP + 0.05), (2.10, 0.0, CTOP + 0.09), 0.07, C['dark'], 16))
    objs.append(sphere('compass', (2.10, 0.0, CTOP + 0.10), 0.055, C['screen'], (1, 1, 0.8)))
    za = 0.62; objs.append(plate('door', (0, 0, 0), (0, 1, 0), (0.20 / 0.85, 0, 1), [(-0.20, 0), (0.20, 0), (0.20, 0.36), (-0.20, 0.36)], C['inner'], 0.0, 0.0, nrm=(-1, 0, 0.24)))
    objs[-1].location = (x_aft(za) - 0.004, 0, za)
    objs.append(box('door_grip', x_aft(0.86) - 0.02, x_aft(0.86), 0.10, 0.18, 0.84, 0.87, C['steel']))
    # the windscreen, its frame and the grab rail round it
    zw0 = CTOP + 0.02; zw1 = 1.62; xw0 = 2.40; xw1 = 2.22
    W = [(xw0, -0.36, zw0), (xw0, 0.36, zw0), (xw1, 0.34, zw1), (xw1, -0.34, zw1)]
    bm = bmesh.new(); f = bm.faces.new([bm.verts.new(p) for p in W]); f.normal_update()
    if f.normal.x < 0: f.normal_flip()
    glass.append(obj_from_bm('windscreen', bm, [C['glass']]))
    objs.append(tube('ws_frame', [(xw0, -0.37, zw0), (xw1 - 0.005, -0.35, zw1 + 0.01), (xw1 - 0.005, 0.35, zw1 + 0.01), (xw0, 0.37, zw0)], 0.013, C['frame'], 6))
    rail = [(2.32, -0.39, CTOP), (2.16, -0.38, zw1 + 0.05), (2.16, 0.38, zw1 + 0.05), (2.32, 0.39, CTOP)]
    objs.append(tube('grab_rail', rail, 0.014, C['steel'], 8))
    objs.append(tube('grab_rail2', [(2.06, -0.39, CTOP), (2.06, -0.39, CTOP + 0.20), (2.14, -0.38, zw1 + 0.05)], 0.013, C['steel'], 8))
    objs.append(tube('grab_rail3', [(2.06, 0.39, CTOP), (2.06, 0.39, CTOP + 0.20), (2.14, 0.38, zw1 + 0.05)], 0.013, C['steel'], 8))
    return objs, glass

def seat(fine=True):
    objs = []; x = 1.35
    objs.append(cyl('seat_post', (x, 0, Z_SOLE), (x, 0, 0.84), 0.04, C['steel'], 12 if fine else 6))
    objs.append(cyl('seat_base', (x, 0, Z_SOLE), (x, 0, Z_SOLE + 0.02), 0.16, C['steel'], 16 if fine else 6))
    objs.append(box('seat', x - 0.22, x + 0.22, -0.22, 0.22, 0.84, 0.94, C['cush'], 0.04 if fine else 0))
    objs.append(box('seat_back', x - 0.24, x - 0.16, -0.20, 0.20, 0.94, 1.33, C['cush'], 0.04 if fine else 0))
    if fine: objs.append(torus('footrest', (x, 0, 0.60), (0, 0, 1), 0.16, 0.012, C['steel'], 20, 6))
    return objs

TUB = (3.30, 0.55)
def fittings(fine=True):
    objs = []
    if not fine: return objs
    # the fish tub on the sole forward of the console, port side
    tx, ty = TUB; W, D, H = 0.84, 0.52, 0.34
    for nm, a in (('tub_b', (tx - D / 2, tx + D / 2, ty - W / 2, ty + W / 2, Z_SOLE, Z_SOLE + 0.03)),
                  ('tub_f', (tx + D / 2 - 0.03, tx + D / 2, ty - W / 2, ty + W / 2, Z_SOLE, Z_SOLE + H)), ('tub_a', (tx - D / 2, tx - D / 2 + 0.03, ty - W / 2, ty + W / 2, Z_SOLE, Z_SOLE + H)),
                  ('tub_p', (tx - D / 2, tx + D / 2, ty + W / 2 - 0.03, ty + W / 2, Z_SOLE, Z_SOLE + H)), ('tub_s', (tx - D / 2, tx + D / 2, ty - W / 2, ty - W / 2 + 0.03, Z_SOLE, Z_SOLE + H))):
        objs.append(box(nm, *a, C['tub'], 0.008))
    # cleats on the gunwales and the bow, rod holders, the fuel filler
    for x in (0.85, 4.45):
        for sg in (1, -1):
            y = sg * (hbs(x) - 0.08); z = zs(x)
            objs.append(box('cleat_b%d%d' % (int(x * 10), sg), x - 0.03, x + 0.03, y - 0.02, y + 0.02, z, z + 0.04, C['steel']))
            objs.append(box('cleat_t%d%d' % (int(x * 10), sg), x - 0.10, x + 0.10, y - 0.018, y + 0.018, z + 0.04, z + 0.06, C['steel'], 0.008))
    for x in (1.15, 1.55):
        for sg in (1, -1):
            y = sg * (hbs(x) - 0.09); z = zs(x)
            objs.append(cyl('rod%d%d' % (int(x * 10), sg), (x, y, z + 0.01), (x + 0.06, y, z - 0.20), 0.028, C['dark'], 10))
            objs.append(torus('rodr%d%d' % (int(x * 10), sg), (x, y, z + 0.008), (0, 0, 1), 0.03, 0.007, C['steel'], 12, 4))
    objs.append(cyl('filler', (0.95, -(hbs(0.95) - 0.10), zs(0.95)), (0.95, -(hbs(0.95) - 0.10), zs(0.95) + 0.015), 0.04, C['steel'], 12))
    # lights: red and green on the bow deck, the white light on its pole at the port quarter
    zb = zs(5.40)
    objs.append(box('bow_red', 5.38, 5.46, 0.36, 0.44, zb, zb + 0.06, C['lred'], 0.01))
    objs.append(box('bow_green', 5.38, 5.46, -0.44, -0.36, zb, zb + 0.06, C['lgreen'], 0.01))
    objs.append(cyl('pole', (0.85, 1.05, zs(0.85)), (0.85, 1.05, 2.0), 0.016, C['steel'], 8))
    objs.append(cyl('pole_light', (0.85, 1.05, 2.0), (0.85, 1.05, 2.06), 0.035, C['lwhite'], 10))
    # the bow roller on its bracket at the stem, with the anchor's shank
    zt = zs(5.7) + 0.02
    for y in (-0.06, 0.06): objs.append(box('roller_cheek%d' % int(y * 100), 5.55, 5.98, y - 0.008, y + 0.008, zt - 0.05, zt + 0.07, C['steel'], 0.005))
    objs.append(cyl('roller', (5.95, -0.055, zt), (5.95, 0.055, zt), 0.035, C['dark'], 12))
    objs.append(cyl('anchor_shank', (5.60, 0, zt + 0.06), (5.98, 0, zt + 0.02), 0.016, C['dark'], 8))
    # the boarding ladder on the port pod
    for y in (0.62, 0.86): objs.append(tube('ladder%d' % int(y * 100), [(0.20, y, ZP), (0.03, y, ZP + 0.04), (-0.02, y, ZP - 0.05), (-0.02, y, 0.05)], 0.012, C['steel'], 6))
    for z in (0.15, 0.32, 0.49): objs.append(cyl('rung%d' % int(z * 100), (-0.02, 0.62, z), (-0.02, 0.86, z), 0.012, C['steel'], 6))
    return objs


# ---------- the outboard and its propeller (parts of their own, they move in the game) ----------
PIVOT = (XT, 0.0, 0.70)
PROPC = (XT - 0.66, 0.0, -0.10)
def outboard(fine=True):
    """a 60 hp four-stroke on a 25 inch shaft, clamped on the transom notch"""
    px = XT; objs = []
    objs.append(box('ob_clamp', px - 0.10, px + 0.02, -0.12, 0.12, 0.54, 0.74, C['motor'], 0.02))
    objs.append(box('ob_swivel', px - 0.24, px - 0.08, -0.10, 0.10, 0.50, 0.78, C['motor'], 0.03))
    # the cowling: a rounded lid over the engine, with a grey band
    cw = poly_prism('ob_cowl', [(px - 0.82, -0.17), (px - 0.30, -0.21), (px - 0.18, -0.16), (px - 0.18, 0.16), (px - 0.30, 0.21), (px - 0.82, 0.17)], 0.80, 1.30, C['motor'], 0.06, 3)
    objs.append(cw)
    objs.append(poly_prism('ob_band', [(px - 0.835, -0.175), (px - 0.30, -0.215), (px - 0.165, -0.165), (px - 0.165, 0.165), (px - 0.30, 0.215), (px - 0.835, 0.175)], 0.80, 0.86, C['motor2'], 0.01))
    objs.append(poly_prism('ob_apron', [(px - 0.74, -0.15), (px - 0.30, -0.17), (px - 0.22, -0.13), (px - 0.22, 0.13), (px - 0.30, 0.17), (px - 0.74, 0.15)], 0.55, 0.80, C['motor'], 0.03))
    # the shaft housing, the anti-cavitation plate, the gearcase with its torpedo nose and the skeg
    objs.append(poly_prism('ob_leg', [(px - 0.64, -0.06), (px - 0.36, -0.07), (px - 0.30, 0.0), (px - 0.36, 0.07), (px - 0.64, 0.06), (px - 0.70, 0.0)], 0.05, 0.56, C['motor'], 0.02))
    objs.append(poly_prism('ob_plate', [(px - 0.78, -0.15), (px - 0.36, -0.13), (px - 0.30, 0.0), (px - 0.36, 0.13), (px - 0.78, 0.15)], 0.05, 0.07, C['motor'], 0.01))
    objs.append(cyl('ob_gear', (px - 0.62, 0, -0.10), (px - 0.30, 0, -0.10), 0.065, C['motor'], 14 if fine else 6, r1=0.03))
    objs.append(poly_prism('ob_fin', [(px - 0.60, -0.012), (px - 0.38, -0.012), (px - 0.40, 0.012), (px - 0.60, 0.012)], -0.05, 0.05, C['motor'], 0.0))
    objs.append(loft_rings('ob_skeg', [[(px - 0.56, -0.012, -0.12), (px - 0.36, -0.012, -0.12), (px - 0.50, -0.012, -0.32)], [(px - 0.56, 0.012, -0.12), (px - 0.36, 0.012, -0.12), (px - 0.50, 0.012, -0.32)]], C['motor']))
    objs.append(tube('ob_cable', [(px - 0.20, -0.08, 0.80), (px - 0.05, -0.10, 0.92), (px + 0.20, -0.14, 0.80)], 0.016, C['dark'], 6))
    o = join(objs, 'OUTBOARD')
    p = []
    p.append(cyl('pr_hub', (PROPC[0] + 0.05, 0, PROPC[2]), (PROPC[0] - 0.08, 0, PROPC[2]), 0.045, C['prop'], 12, r1=0.03))
    for k in range(3):
        a0 = 2 * math.pi / 3 * k; rows = []
        for i in range(7):
            r = 0.04 + 0.13 * i / 6; ch = 0.12 * max(0.0, math.sin(math.pi * (0.2 + 0.8 * i / 6))) ** 0.6 + 0.02; phi = math.atan(0.33 / (2 * math.pi * r)); row = []
            for j in range(4):
                c = (j / 3 - 0.5) * ch; a = a0 + (c * math.cos(phi)) / r + 0.15 * (i / 6) ** 2
                row.append((PROPC[0] + c * math.sin(phi), r * math.sin(a), PROPC[2] + r * math.cos(a)))
            rows.append(row)
        b = grid('pr_blade%d' % k, rows, lambda i, j: C['prop'], angle=80); solidify(b, 0.008); p.append(b)
    pr = join(p, 'PROP')
    return o, pr


# ---------- the wheel and the throttle, only for the renders (the game draws its own, turning) ----------
WHEEL = (1.995, 0.0, 1.12); TILT = 0.35; LEVER = (2.10, -0.345, 1.05)
def render_only():
    objs = [torus('r_wheel', WHEEL, (-math.cos(TILT), 0, math.sin(TILT)), 0.19, 0.016, C['dark'], 24, 6)]
    objs.append(cyl('r_hub', WHEEL, (WHEEL[0] + 0.12, 0, WHEEL[2] - 0.04), 0.03, C['dark'], 10))
    objs.append(box('r_lever_box', LEVER[0] - 0.08, LEVER[0] + 0.08, -0.345, -0.33, LEVER[2] - 0.08, LEVER[2] + 0.08, C['dark']))
    objs.append(cyl('r_lever', (LEVER[0], -0.36, LEVER[2]), (LEVER[0] - 0.03, -0.37, LEVER[2] + 0.17), 0.012, C['dark'], 8))
    return objs


def build(fine=True):
    solids = build_hull(fine)
    solids.append(rub_rail(fine))
    solids += inside(fine)
    o, glass = console(fine); solids += o
    solids += seat(fine)
    solids += fittings(fine)
    return solids, glass


def cap_obj():
    """the lid inside the gunwales (depth only in the game, so the sea does not show in the open boat)"""
    xs = [x for x in stations(True) if XT <= x <= X_BOW]
    ring = [(x, -yi(x), zs(x) - 0.03) for x in xs] + [(x, yi(x), zs(x) - 0.03) for x in reversed(xs)]
    bm = bmesh.new(); f = bm.faces.new([bm.verts.new(p) for p in ring]); f.normal_update()
    if f.normal.z < 0: f.normal_flip()
    o = obj_from_bm('CAP', bm, [C['white']]); o.hide_render = True
    return o


def to_game(p): return (-p[1], p[2] - WL, -(p[0] - XM))
def to_game_n(n): return (-n[1], n[2], -n[0])
def rel_game(c):
    g = to_game(c); return lambda p: tuple(a - b for a, b in zip(to_game(p), g))

def anchors():
    G = lambda x, y, z: [round(v, 3) for v in to_game((x, y, z))]
    sole = round(Z_SOLE - WL, 3); gwz = lambda x: zs(x) - WL
    tg = lambda x, y, z: [round(v, 3) for v in to_game((x, y, z))]
    rgy = lambda x: round(hbs(x) - GW / 2, 3)            # the middle of the starboard gunwale (game x is to starboard)
    names = []
    for sg, xs in ((1, [4.95 - 0.70 * k / 12 for k in range(13)]), (-1, [4.25 + 0.70 * k / 12 for k in range(13)])):
        B = []; T = []
        for x in xs:
            for arr, dz in ((B, 0.31), (T, 0.13)):
                z = zs(x) - dz; y = y_at(x, z) + 0.012; arr.append(tg(x, sg * y, z))
        names.append([B, T])
    gw_ = lambda x, up: [rgy(x), round(gwz(x) + up, 3), round(-(x - XM), 3)]
    sk = {'sole': sole, 'wheel': G(*WHEEL), 'wheelTilt': TILT, 'lever': G(LEVER[0], -0.38, LEVER[2]), 'motor': G(*PIVOT),
          'prop': [round(a - b, 3) for a, b in zip(to_game(PROPC), to_game(PIVOT))],
          'tub': G(TUB[0], TUB[1], Z_SOLE), 'fisher': G(2.90, -0.45, Z_SOLE), 'reel': gw_(2.95, 0.215), 'haul': gw_(3.15, 0.25),
          'mach': [gw_(x, 0.13) for x in (2.70, 3.30, 3.85)], 'stack': G(3.95, -0.15, Z_SOLE), 'charm': G(2.16, -0.20, 1.69),
          'skipper': G(1.55, 0.0, Z_SOLE), 'seat': G(0.95, 0.55, 0.96 - 0.46), 'filler': G(0.95, -(hbs(0.95) - 0.10), zs(0.95) + 0.02), 'names': names}
    return {'eye': G(1.62, 0.0, Z_SOLE + 1.62), 'skipperAt': G(1.55, 0.0, Z_SOLE), 'hp': -0.3, 'fov': 62,
            'crewSpots': [G(0.95, 0.55, 0.96 - 0.46) + [0.0]], 'hauler': sk['haul'], 'filler': sk['filler'], 'pole': G(0.85, 1.05, 2.03),
            'lights': [[G(5.42, 0.40, zs(5.4) + 0.04), [1, 0.12, 0.1]], [G(5.42, -0.40, zs(5.4) + 0.04), [0.1, 1, 0.35]], [G(0.85, 1.05, 2.03), [1, 0.95, 0.85]]],
            'deck': {'y': sole, 'z': round(-(1.2 - XM), 3)}, 'gw': round(gwz(3.0), 3), 'stern': round(XM + 0.1, 3), 'bow': -2.2, 'side': 0.83,
            'beam': 2.45, 'pl': 2.4, 'rl': 1.0, 'open': True, 'hand': True, 'skiff': sk,
            'work': {'table': G(1.50, 0.72, Z_SOLE), 'tub': G(1.45, -0.62, Z_SOLE), 's': 0.75}}


# ---------- checks against the drawing ----------
S_ = 93.9; X0 = 107.0; ZK0 = 432.5; YC = 170.0      # px per metre; the pods' after end, the keel and the plan's centre line in pixels

def check_overlay():
    setup_render(1260, 400, samples=8, transparent=True)
    cx = (405 - X0) / S_; cz = (ZK0 - 380) / S_
    camera((cx, -30, cz), (cx, 0, cz), ortho=630 / S_)
    render(os.path.join(OUT, 'sk_ov_side.png'))
    bpy.context.scene.render.resolution_y = 520
    cy = -(170 - YC) / S_
    c = camera((cx, cy, 30), (cx, cy, 0), ortho=630 / S_); c.rotation_euler = (0, 0, 0)
    render(os.path.join(OUT, 'sk_ov_top.png'))
    if DRAWING:
        on_drawing(os.path.join(OUT, 'sk_ov_side.png'), DRAWING, (90, 280, 720, 480), os.path.join(OUT, 'sk_ov_side_on.png'))
        on_drawing(os.path.join(OUT, 'sk_ov_top.png'), DRAWING, (90, 40, 720, 300), os.path.join(OUT, 'sk_ov_top_on.png'))


SHOTS = [('bow3q', (8.5, -5.6, 2.6), (2.9, 0, 0.8), 35), ('stern3q', (-3.6, 4.4, 2.8), (2.4, 0, 0.7), 35), ('side', (2.9, -11.5, 1.0), (2.9, 0, 0.9), 35),
         ('above', (6.5, -4.5, 6.5), (2.8, 0, 0.6), 35), ('cockpit', (0.3, -1.6, 2.3), (3.2, 0.2, 0.7), 26)]

def main():
    os.makedirs(OUT, exist_ok=True)
    only_check = len(sys.argv) > 1 and sys.argv[1] == 'check'
    reset(); colours()
    solids, glass = build(True)
    join(solids, 'BOAT0'); join(glass, 'GLASS0')
    ob, pr = outboard(True); ro = join(render_only(), 'RENDER_ONLY')
    if only_check or 'fast' not in sys.argv:
        check_overlay()
        if only_check: return
        beauty(OUT, 'sk', WL, SHOTS)
    ro.hide_render = True
    ex = {'frame': 'kystfiske: x starboard, y up from the waterline, z aft; metres', 'type': 'skiff', 'name': 'Plate Alloy 5.9m Adventurer (5.9 m)', 'len': 5.9, 'beam': 2.45, 'draft': 0.6,
          'anchors': anchors()}
    more = [{'name': 'cap', 'obj': cap_obj}, {'name': 'outboard', 'obj': ob, 'xf_p': rel_game(PIVOT), 'ao': True, 'show': True},
            {'name': 'prop', 'obj': pr, 'xf_p': rel_game(PROPC), 'ao': False, 'show': True}]
    ro.hide_render = False
    export_boat(build, to_game, to_game_n, OUT, 'skiff59.glb', os.path.join(ROOT, 'src', 'data', 'boat-skiff59.b64'), ex,
                side=(os.path.join(ROOT, 'src', 'data', 'boat-skiff59-side.b64'), 2.9, 1.0, 7.0), dry='dry' in sys.argv, more=more)


if __name__ == '__main__':
    main()
