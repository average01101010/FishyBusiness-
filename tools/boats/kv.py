"""The coast guard's two ships (steg 100, valg 30: V1 C, V2 A, V3 A; Jonas 10.11.2026: «Du kan jo få lov til å lage en blender-modell av
en kystvaktbåt også. Den trenger ikke å være like detaljert som båtene spillerne bruker.»), from one script: a 47 m ship for the checks
along the coast and at the quay (the inner coast guard) and a 93 m one for the check at sea aboard an ocean vessel (the outer coast guard).
The groundwork is docs/skipsmodeller/kystvakt-grunnlag.md; every measure there has its source. The models stand for whichever ship comes:
no ship's name, pennant or call sign goes into them (CLAUDE.md), only the coast guard's grey hull, the slanted red, white and blue
stripes forward and «KYSTVAKT» on the side (V3 A; the coast guard is a public body and may be named). The classes that gave the measures
(the 47.2 m ST-610 type and the 93 m VS 794 type, the helicopter deck as on the 105 m class) are named here and in the groundwork only.

Middle detail (Jonas: «trenger ikke å være like detaljert»): the outside only, near 20 000-40 000 triangles, far under 4 000. The 93 m
ship's starboard boat (an 8.5 m RIB) is a part of its own ('rib', its own frame), which the game lowers and sends to the vessel being
inspected and hoists in again (V2 A); her port one, and the 47 m ship's, are in the hull.

    python3.11 tools/boats/kv.py dry          -> both GLBs in tools/boats/out only, and the renders
    python3.11 tools/boats/kv.py fast dry     -> no renders
    python3.11 tools/boats/kv.py check        -> the checks only (also without Blender: python3 tools/boats/qa/stubcheck.py tools/boats/kv.py)
    python3.11 tools/boats/kv.py fast export  -> src/data/boat-kv47.b64 and boat-kv90.b64
    KV_SHIP=47 python3.11 tools/boats/qa/shots.py tools/boats/kv.py kv47   (the critique loop's renders of one ship; KV_SHIP 47 or 90)

Frame: x forward from the transom's aft face, y to port, z up from the base line (the underside of the hull's flat keel); the waterline is
z = WL. to_game turns it to the game's frame (x starboard, y up from the waterline, z aft, the middle of the length at the origin).
"""
import os, sys, math
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy
from bpyutil import *
import bmesh
import fittings as F

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE)); OUT = os.path.join(HERE, 'out')

# ---------- the two ships' tables (docs/skipsmodeller/kystvakt-grunnlag.md kap. 1 and 4; R = a written source, A = assumed) ----------
# kv47: the 47.2 m ST-610 type (R: the designer's page, LOA 47.20 m, moulded breadth 10.30 m; draught 3.25 m and about 760 t from the
# coast guard's own presentation and the class's encyclopedia entry). Freeboard, the forecastle's height, the stations' fullness and the
# arrangement are assumed (A) from the type: the superstructure forward on a raised forecastle, an open towing and working deck aft
# kv90: the 93 m VS 794 type (R: 93 m, 16.6 m, draught 6.0 m, about 3 250 t, a 110 t bollard pull). Her greatest draught 6.0 is taken
# as to the skeg's underside; the hull's own, 4.9 m, is assumed so the volume gives the displacement (kap. 4). The helicopter deck aft
# with the hangar forward of it is valg 30's (the 105 m class has one; the VS 794 type's is not read), a flush upper deck (A)
SHIPS = {
  '47': dict(t='kv47', name='Kystvaktskip 47 m', L=47.2, B=10.3, T=3.25, disp=760.0,
             STEM=[(0.0, 42.4), (1.0, 43.6), (2.0, 44.35), (3.25, 45.0), (5.0, 45.75), (7.0, 46.5), (9.6, 47.2)],
             # (the fullness tuned so the volume under the waterline gives the 760 t: Cb 0.49, Cm 0.81, Cp 0.61; the waterline 9.9 m
             # wide under a deck of 10.3, the flare over it)
             KEEL=[(0.0, 2.95), (3.0, 2.45), (7.0, 1.4), (12.0, 0.4), (17.0, 0.0)],
             BW=[(0.0, 4.10), (4.0, 4.60), (10.0, 4.90), (16.0, 4.95), (30.0, 4.95)],
             BD=[(0.0, 4.70), (4.0, 5.05), (10.0, 5.15), (30.0, 5.15)],
             NX=[(0.0, 1.9), (4.0, 2.1), (10.0, 2.4), (16.0, 2.5), (30.0, 2.5)],
             X_ENT=22.0, KB=[(0.0, 1.05), (3.25, 1.4), (6.0, 2.2), (9.6, 2.9)],
             # the main deck at the side aft, the forecastle deck forward of X_FC, each with its sheer; the bulwark 1.0 m over both
             MD=[(0.0, 5.15), (12.0, 5.02), (25.0, 5.05)], FC=[(24.6, 7.60), (36.0, 7.72), (47.2, 8.55)], X_FC=24.6, BWH=1.0),
  '90': dict(t='kv90', name='Kystvaktskip 93 m', L=93.0, B=16.6, T=4.9, Tmax=6.0, disp=3250.0,
             STEM=[(0.0, 85.4), (1.5, 87.2), (3.0, 88.3), (5.2, 89.5), (8.0, 90.7), (11.0, 91.9), (13.4, 93.0)],
             # (the fullness tuned so the volume gives 3 390 t, 4 % over the 3 250 t of the sources, at the hull's draught 4.9 m: Cb
             # 0.46, Cm 0.78, Cp 0.59; the waterline 15.8 m wide under the deck's 16.6)
             KEEL=[(0.0, 4.55), (6.0, 3.75), (14.0, 2.1), (24.0, 0.7), (33.0, 0.0)],
             BW=[(0.0, 6.6), (6.0, 7.4), (14.0, 7.8), (22.0, 7.9), (55.0, 7.9)],
             BD=[(0.0, 7.55), (6.0, 8.15), (14.0, 8.30), (55.0, 8.30)],
             NX=[(0.0, 1.7), (6.0, 1.9), (14.0, 2.1), (24.0, 2.25), (55.0, 2.25)],
             X_ENT=42.0, KB=[(0.0, 0.95), (5.0, 1.25), (9.0, 2.1), (13.4, 2.8)],
             # one flush upper deck (the helicopter deck aft is its after end), its sheer rising forward; a bulwark only on the forecastle
             MD=[(0.0, 10.95), (30.0, 10.80), (60.0, 10.90), (75.0, 11.2), (93.0, 12.5)], FC=None, X_FC=None, BWH=1.1, X_BW=70.0),
}
SHIP = os.environ.get('KV_SHIP', '47')
P = SHIPS[SHIP]
def use(k):
    """switch the module to one ship's tables (the export runs both; the critique loop's shots one, KV_SHIP)"""
    global SHIP, P, LOA, BM, HB, WL, XA, XF, XM, X_ENT, ZC, _T
    SHIP = k; P = SHIPS[k]; LOA = P['L']; BM = P['B']; HB = BM / 2; WL = P['T']; XA = 0.0; XF = LOA; XM = LOA / 2; X_ENT = P['X_ENT']
    ZC = z_md(10.0); _T = {}

def z_md(x):
    """the deck at the side: the main deck aft (and the 93 m ship's whole upper deck), the forecastle deck forward of X_FC"""
    if P['FC'] and x >= P['X_FC']: return interp(P['FC'], x)
    return interp(P['MD'], x)
def z_bw(x):
    """the top of the hull's side: the bulwark 1 m over the deck; on the 47 m ship it steps up to the forecastle's over 1.2 m; on the
    93 m ship the bulwark is only on the forecastle (forward of X_BW), the deck's edge a 0.2 m coaming aft of it"""
    if P['FC']:
        a, b = P['X_FC'] - 1.2, P['X_FC']; lo = interp(P['MD'], x) + P['BWH']; hi = interp(P['FC'], max(x, b)) + P['BWH']
        if x <= a: return lo
        if x >= b: return hi
        t = (x - a) / (b - a); return lo + (hi - lo) * (3 * t * t - 2 * t ** 3)
    lo = z_md(x) + 0.2; xb = P['X_BW']
    if x <= xb - 3.0: return lo
    t = min(1.0, (x - (xb - 3.0)) / 3.0); return lo + (P['BWH'] - 0.2) * (3 * t * t - 2 * t ** 3)
def x_stem(z): return interp(P['STEM'], z)
def z_keel(x): return interp(P['KEEL'], x)

# ---------- the hull: one smooth surface ----------
def section_y(x, z):
    """the half-breadth of the body aft of X_ENT at x for heights z (an array), signed (negative outside): under the waterline a
    superellipse from the keel to the waterline's half-breadth (fuller amidships, an ellipse in the run aft), over it the flare out to
    the deck's half-breadth, and the bulwark straight up from it"""
    z = np.asarray(z, float); zl = z_keel(x); bw = interp(P['BW'], x); bd = interp(P['BD'], x); n = interp(P['NX'], x); zs = z_md(X_ENT)
    y = np.empty_like(z)
    lo = z <= WL
    s = np.clip((WL - z[lo]) / max(1e-6, WL - zl), 0.0, 1.0)
    y[lo] = bw * np.power(np.clip(1.0 - np.power(s, n), 0.0, 1.0), 1.0 / n)
    hi = ~lo; f = np.clip((z[hi] - WL) / max(0.1, zs - WL), 0.0, 1.0)
    y[hi] = bw + (bd - bw) * np.power(f, 0.8) + np.where(z[hi] > zs, 0.015 * (z[hi] - zs), 0.0)
    return np.where(z < zl, (z - zl) * 3.0, y)

def hb(x, z):
    """the signed half-breadth of the whole hull at x for the heights z: forward of X_ENT the section at X_ENT drawn in towards the stem
    with a fullness per height (a fine forefoot, full waterlines under the flare forward), negative outside"""
    z = np.asarray(z, float)
    if x <= X_ENT: return section_y(x, z)
    y0 = section_y(X_ENT, z); xs = np.array([x_stem(v) for v in np.clip(z, 0, None)]); k = np.array([interp(P['KB'], v) for v in z])
    s = (x - X_ENT) / np.maximum(1e-6, xs - X_ENT)
    y = np.where(s < 1, y0 * (1 - np.power(np.clip(s, 0, 1), k)), -(x - xs) * 1.2)
    return np.where(z < 0, np.minimum(y, z * 3.0), y)

def hbz(x, z): return max(0.0, float(hb(x, np.array([z]))[0]))

def surf(x, z, sg, off=0.0):
    """the hull's outside at (x, z) on side sg (1 port): the point, its outward normal, the direction along the hull forward"""
    p = lambda xx, zz: V((xx, sg * (hbz(xx, zz) + off), zz))
    tx = p(x + 0.1, z) - p(x - 0.1, z); tz = p(x, z + 0.1) - p(x, z - 0.1); n = tx.cross(tz)
    if n.y * sg < 0: n = -n
    return p(x, z), n.normalized(), tx.normalized()

def section(x):
    """the section at x from the keel on the centreline up to the bulwark's top: [(y, z)] (one piece: the forefoot rises with the stem)"""
    zt = z_bw(x); z = np.append(np.arange(-0.3, zt, 0.004), zt); y = hb(x, z); pos = np.where(y > 0)[0]
    if not len(pos): return None
    i = pos[0]; za = z[i - 1] if i > 0 else z[0]
    lo, hi = za, z[i]
    for _ in range(30):
        m = (lo + hi) / 2
        if hb(x, np.array([m]))[0] > 0: hi = m
        else: lo = m
    g = np.geomspace(1e-5, 0.03, 24); zz = np.unique(np.concatenate([hi + g, z[i:]])); zz = zz[(zz > hi) & (zz <= zt)]
    return [(0.0, hi)] + list(zip(np.maximum(hb(x, zz), 0.0).tolist(), zz.tolist()))

AF = 0.25                       # the antifouling's top over the waterline (A: the grey hull down to just over the water)
def rows(x, fine):
    sec = section(x)
    if sec is None: return None
    n1, n2, n3 = ((18, 12, 3) if SHIP == '47' else (16, 11, 3)) if fine else (5, 3, 1)
    return resample(sec, [(WL + AF, n1), (z_md(x), n2), (None, n3)])

def stations(fine):
    L = LOA; xs0 = x_stem(0.0)
    if fine:
        k = L / 47.2; d1, d2 = 0.6 * k, 0.35 * k   # (the stations spaced with the length: the 93 m ship's twice as far apart)
        st = [0.0, 0.05, 0.15] + [0.3 * k * i for i in range(1, 8)] + [2.4 * k + d1 * i for i in range(int((X_ENT - 2.4 * k) / d1) + 1)]
        st += [X_ENT + d2 * i for i in range(1, int((xs0 - X_ENT) / d2))] + [xs0 + (L - 0.01 - xs0) * (1 - (1 - i / 32) ** 1.6) for i in range(33)]
        if P['FC']: st += [P['X_FC'] - 1.2 + 0.2 * i for i in range(8)]
    else:
        st = [0.0, 0.4, 1.5, 3.5, 7.0] + [X_ENT * i / 6 for i in range(2, 7)] + [X_ENT + (xs0 - X_ENT) * i / 4 for i in range(1, 4)] + [xs0 + (L - 0.01 - xs0) * i / 5 for i in range(6)]
    return sorted(set(round(v, 4) for v in st if 0 <= v < L))

def hull_mat(c):
    if c.z < WL + AF - 0.005: return C['af']
    return C['hull']

def build_hull(fine=True):
    """the hull's outside as one mesh: both sides, the transom, cut along the antifouling's line"""
    bm = bmesh.new(); st = stations(fine); G = [(x, rows(x, fine)) for x in st]; G = [(x, r) for x, r in G if r]
    n = len(G[0][1])
    for sg in (1, -1):
        vs = [[bm.verts.new((x, sg * y, z)) for y, z in r] for x, r in G]
        for i in range(len(G) - 1):
            for j in range(n - 1):
                q = [vs[i][j], vs[i + 1][j], vs[i + 1][j + 1], vs[i][j + 1]]
                if sg > 0: q.reverse()
                u = []
                for v in q:
                    if not u or (v.co - u[-1].co).length > 1e-6: u.append(v)
                if len(u) > 2 and (u[0].co - u[-1].co).length < 1e-6: u.pop()
                if len(u) < 3 or max(abs(v.co.y) for v in u) < 1e-4: continue
                try: bm.faces.new(u)
                except ValueError: pass
    # the transom: flat across between the two sides' first station
    x0, r0 = G[0]; vp = [bm.verts.new((x0, y, z)) for y, z in r0]; vq = [bm.verts.new((x0, -y, z)) for y, z in r0]
    for j in range(len(r0) - 1):
        u = [vp[j], vp[j + 1], vq[j + 1], vq[j]]
        if (u[0].co - u[3].co).length < 1e-6: u = u[:3]
        try: f = bm.faces.new(u); f.normal_update()
        except ValueError: continue
        if f.normal.x > 0: f.normal_flip()
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=2e-4)
    g = list(bm.verts) + list(bm.edges) + list(bm.faces)
    bmesh.ops.bisect_plane(bm, geom=g, dist=1e-5, plane_co=(0, 0, WL + AF), plane_no=(0, 0, 1))
    mats = []; mi = {}
    for f in bm.faces:
        m = hull_mat(f.calc_center_median())
        if m.name not in mi: mi[m.name] = len(mats); mats.append(m)
        f.material_index = mi[m.name]
    return [shade(obj_from_bm('hull', bm, mats), 50)]


# ---------- colours (the paint zones of 10j-paint.js: 1 the hull, 3 the superstructure, 4 the decks; the game paints none of them) ----------
C = {}
def colours():
    C['af'] = mat('antifouling', (0.36, 0.09, 0.08), 0.2)
    C['hull'] = mat('kvhull', (0.43, 0.47, 0.50), 0.45, zone=1)        # the coast guard's grey (A: no paint code read)
    C['house'] = mat('kvhouse', (0.62, 0.65, 0.67), 0.45, zone=3)      # the superstructure a lighter grey
    C['inner'] = mat('inner', (0.56, 0.59, 0.61), 0.35, zone=3)
    C['deck'] = mat('deck', (0.27, 0.30, 0.30), 0.15, zone=4)
    C['heli'] = mat('helideck', (0.20, 0.25, 0.23), 0.15, zone=4)
    C['white'] = mat('white', (0.92, 0.92, 0.90), 0.5)
    C['yellow'] = mat('yellow', (0.95, 0.78, 0.12), 0.4)
    C['red'] = mat('kvred', (0.80, 0.10, 0.11), 0.5)                   # the slanted stripes: red, white, blue (V3 A)
    C['blue'] = mat('kvblue', (0.06, 0.16, 0.45), 0.5)
    C['letter'] = mat('letter', (0.08, 0.09, 0.11), 0.45)              # «KYSTVAKT» dark on the grey (A)
    C['steel'] = mat('steel', (0.62, 0.64, 0.66), 0.7, metal=0.7)
    C['dark'] = mat('dark', (0.10, 0.11, 0.12), 0.3)
    C['black'] = mat('black', (0.04, 0.04, 0.05), 0.35)
    C['rubber'] = mat('rubber', (0.07, 0.07, 0.08), 0.2)
    C['glass'] = mat('glass', (0.05, 0.10, 0.12), 0.95)
    C['net'] = mat('net', (0.16, 0.17, 0.16), 0.2)
    C['prop'] = mat('bronze', (0.70, 0.52, 0.27), 0.8, metal=0.9)
    C['orange'] = mat('orange', (0.93, 0.36, 0.07), 0.45)
    C['tube'] = mat('ribtube', (0.16, 0.17, 0.18), 0.3)                # the RIB's tubes, dark grey
    C['ribhull'] = mat('ribhull', (0.40, 0.43, 0.45), 0.45)
    C['lens'] = mat('lens', (0.95, 0.94, 0.85), 0.9)
    C['lampR'] = mat('lampR', (0.85, 0.08, 0.06), 0.7); C['lampG'] = mat('lampG', (0.08, 0.75, 0.3), 0.7); C['lampW'] = mat('lampW', (0.95, 0.93, 0.85), 0.7)


# ---------- the decks and the bulwarks' inside ----------
def camber(y, x, e): return 0.10 * BM / 10.3 * (1 - min(1.0, (y / max(0.5, e)) ** 2))

def deck_strip(A, xs, zf, m, inset=0.08):
    """a cambered deck between the bulwarks along the stations xs at the deck z = zf(x)"""
    for x0, x1 in zip(xs, xs[1:]):
        e0, e1 = max(0.0, hbz(x0, zf(x0)) - inset), max(0.0, hbz(x1, zf(x1)) - inset)
        if e0 < 0.05 and e1 < 0.05: continue
        for k in range(4):
            f0, f1 = -1 + 2 * k / 4, -1 + 2 * (k + 1) / 4
            Q = lambda x, e, f: (x, e * f, zf(x) + camber(e * f, x, e))
            A.poly([Q(x0, e0, f0), Q(x0, e0, f1), Q(x1, e1, f1), Q(x1, e1, f0)], m, (0, 0, 1))

def side_wall(A, xs, sg, z_lo, z_hi, inset=0.08):
    """the bulwark's inside from z_lo(x) to z_hi(x) and its cap"""
    for x0, x1 in zip(xs, xs[1:]):
        la, lb, ta, tb = z_lo(x0), z_lo(x1), z_hi(x0), z_hi(x1)
        if ta - la < 0.03 and tb - lb < 0.03: continue
        ta, tb = max(ta, la), max(tb, lb)
        ya, yb = max(0.0, hbz(x0, ta) - inset), max(0.0, hbz(x1, tb) - inset); ia, ib = max(0.0, hbz(x0, la) - inset), max(0.0, hbz(x1, lb) - inset)
        A.poly([(x0, sg * ia, la), (x1, sg * ib, lb), (x1, sg * yb, tb), (x0, sg * ya, ta)], C['inner'], (0, -sg, 0))
        A.poly([(x0, sg * ya, ta), (x1, sg * yb, tb), (x1, sg * hbz(x1, tb), tb + 0.004), (x0, sg * hbz(x0, ta), ta + 0.004)], C['hull'], (0, 0, 1))

def rail(A, pts, h=1.0, m=None, every=1.5, r=0.024, mid=True):
    """a pipe rail along the points: posts about every 1.5 m, the top rail and a knee rail"""
    m = m or C['house']; Pp = [V(p) for p in pts]
    for a, b in zip(Pp, Pp[1:]):
        for hh in ((h, h * 0.5) if mid else (h,)): acyl(A, a + V((0, 0, hh)), b + V((0, 0, hh)), r, lambda z: m, seg=6, cap=False)
        n = max(1, int((b - a).length / every))
        for k in range(n + 1):
            q = a + (b - a) * (k / n); acyl(A, q, q + V((0, 0, h)), r, lambda z: m, seg=6)

def decks(fine=True):
    A = Acc('decks'); dx = 0.5 if fine else 3.0
    if P['FC']:
        xa = [0.12] + [0.6 + dx * i for i in range(int((P['X_FC'] - 0.6) / dx) + 1)] + [P['X_FC']]
        xa = sorted(set(round(v, 4) for v in xa)); deck_strip(A, xa, lambda x: interp(P['MD'], x), C['deck'])
        for sg in (1, -1): side_wall(A, xa, sg, lambda x: interp(P['MD'], x), z_bw)
        xf = [P['X_FC'] + dx * i for i in range(int((LOA - P['X_FC']) / dx) + 1)]; xf = [x for x in xf if hbz(x, z_md(x)) > 0.15]
        deck_strip(A, xf, z_md, C['deck'])
        for sg in (1, -1): side_wall(A, xf, sg, z_md, z_bw)
        # the forecastle's aft bulkhead from the main deck up to the forecastle deck, across the whole breadth (the 01 house abuts it)
        X = P['X_FC']; e = hbz(X, interp(P['FC'], X)) - 0.08; zl, zh = interp(P['MD'], X), interp(P['FC'], X)
        A.poly([(X, -e, zl), (X, e, zl), (X, e, zh), (X, -e, zh)], C['house'], (-1, 0, 0))
        # the transom's inside over the main deck
        y = hbz(0.12, z_bw(0.12)) - 0.08; A.poly([(0.12, -y, interp(P['MD'], 0.12)), (0.12, y, interp(P['MD'], 0.12)), (0.12, y, z_bw(0.12)), (0.12, -y, z_bw(0.12))], C['inner'], (1, 0, 0))
    else:
        xa = [0.0] + [0.6 + dx * 2 * i for i in range(int((LOA - 0.6) / (dx * 2)) + 1)]; xa = [x for x in xa if hbz(x, z_md(x)) > 0.15]
        # the after end of the upper deck is the helicopter deck (its own colour and markings, heli())
        xh = [x for x in xa if x <= HELI[1]] + [HELI[1]]; xr = [HELI[1]] + [x for x in xa if x > HELI[1]]
        deck_strip(A, xh, z_md, C['heli'], inset=0.05); deck_strip(A, xr, z_md, C['deck'], inset=0.05)
        for sg in (1, -1): side_wall(A, xa, sg, z_md, z_bw, inset=0.05)
        if fine:
            # the rails along the deck's edge where there is no bulwark, from the hangar's front to the forecastle
            for sg in (1, -1):
                pts = [(x, sg * (hbz(x, z_md(x)) - 0.06), z_md(x) + 0.2) for x in [HELI[1] + 0.3 + 1.5 * i for i in range(int((P['X_BW'] - 3.0 - HELI[1]) / 1.5) + 1)]]
                rail(A, pts, h=0.9)
    return [A.done(30)]


# ---------- houses ----------
def prism(A, Pl, z0, z1, m, top=True, bottom=False, skip=()):
    """an upright prism on a counter-clockwise plan polygon; skip: indices of walls left out"""
    for i in range(len(Pl)):
        if i in skip: continue
        a, b = Pl[i], Pl[(i + 1) % len(Pl)]; A.poly([(a[0], a[1], z0), (b[0], b[1], z0), (b[0], b[1], z1), (a[0], a[1], z1)], m, (b[1] - a[1], -(b[0] - a[0]), 0))
    if top: A.poly([(x, y, z1) for x, y in Pl], m, (0, 0, 1))
    if bottom: A.poly([(x, y, z0) for x, y in Pl], m, (0, 0, -1))

def window_row(A, G, a, b, z0, z1, every, w, nrm):
    """a row of windows on the wall from a to b (plan points): a dark recess with the glass over it, each w wide, about every m"""
    a = V((a[0], a[1], 0)); b = V((b[0], b[1], 0)); L = (b - a).length; d = (b - a) / max(1e-6, L); n = V(nrm).normalized()
    k = max(1, int(L / every))
    for i in range(k):
        c = a + d * (L * (i + 0.5) / k); p0 = c - d * (w / 2) + n * 0.012; p1 = c + d * (w / 2) + n * 0.012
        A.poly([(p0.x, p0.y, z0), (p1.x, p1.y, z0), (p1.x, p1.y, z1), (p0.x, p0.y, z1)], C['dark'], n)
        G.poly([(p0.x + n.x * 0.01, p0.y + n.y * 0.01, z0 + 0.02), (p1.x + n.x * 0.01, p1.y + n.y * 0.01, z0 + 0.02), (p1.x + n.x * 0.01, p1.y + n.y * 0.01, z1 - 0.02), (p0.x + n.x * 0.01, p0.y + n.y * 0.01, z1 - 0.02)], C['glass'], n)

def door(A, x0, x1, y, z0, sg, h=1.95):
    """a steel door in a wall at y facing sg: its frame proud of the wall, the leaf, the small window, the dogs"""
    abox(A, x0 - 0.06, x1 + 0.06, *sorted((y, y + sg * 0.04)), z0, z0 + h + 0.06, C['inner'])
    abox(A, x0, x1, *sorted((y + sg * 0.04, y + sg * 0.07)), z0 + 0.12, z0 + h - 0.02, C['house'])
    cx = (x0 + x1) / 2; abox(A, cx - 0.13, cx + 0.13, *sorted((y + sg * 0.07, y + sg * 0.075)), z0 + 1.25, z0 + 1.6, C['glass'])

def bridge(A, G, x0, x1, hw, z0, z1, wing, fine, sill=1.0, head=None):
    """the wheelhouse: walls to the sill, the glass all round leaning out at the top (forward 0.30 m, 0.15 elsewhere), the head and the
    roof with its overhang; a dark lining inside so the windows read as glass; the wings out to the side (wing = their half-width) at
    the floor's height, with a solid bulwark round them"""
    ws = z0 + sill; wh = head or (z1 - 0.35)
    pl = [(x0, -hw), (x1 - 1.2, -hw), (x1, -hw + 1.2), (x1, hw - 1.2), (x1 - 1.2, hw), (x0, hw)]
    prism(A, pl, z0, ws, C['house'], top=False, bottom=True)
    nrm = [(pl[(i + 1) % 6][1] - pl[i][1], -(pl[(i + 1) % 6][0] - pl[i][0])) for i in range(6)]
    lean = lambda i, d: (nrm[i][0] / max(1e-6, math.hypot(*nrm[i])) * d, nrm[i][1] / max(1e-6, math.hypot(*nrm[i])) * d)
    for i in range(6):
        a, b = pl[i], pl[(i + 1) % 6]; L = math.hypot(b[0] - a[0], b[1] - a[1]); d = 0.30 if a[0] >= x1 - 1.3 and b[0] >= x1 - 1.3 else 0.15
        ox, oy = lean(i, d); k = max(1, int(L / 1.25 + 0.5))
        for j in range(k):
            t0, t1 = j / k, (j + 1) / k; p0 = (a[0] + (b[0] - a[0]) * t0, a[1] + (b[1] - a[1]) * t0); p1 = (a[0] + (b[0] - a[0]) * t1, a[1] + (b[1] - a[1]) * t1)
            G.poly([(p0[0], p0[1], ws), (p1[0], p1[1], ws), (p1[0] + ox, p1[1] + oy, wh), (p0[0] + ox, p0[1] + oy, wh)], C['glass'], (nrm[i][0], nrm[i][1], 0))
            if fine or j == 0: beam(A, (p0[0], p0[1], ws), (p0[0] + ox, p0[1] + oy, wh), 0.10, 0.08, C['house'], up=(nrm[i][0], nrm[i][1], 0.001))
        # the head band from the glass's top to the roof, leaning with it
        A.poly([(a[0] + ox, a[1] + oy, wh), (b[0] + ox, b[1] + oy, wh), (b[0] + ox, b[1] + oy, z1), (a[0] + ox, a[1] + oy, z1)], C['house'], (nrm[i][0], nrm[i][1], 0))
    # the roof over the leaning head, a little proud all round
    rp = [(x0 - 0.15, -hw - 0.3), (x1 - 1.2, -hw - 0.3), (x1 + 0.45, -hw + 1.0), (x1 + 0.45, hw - 1.0), (x1 - 1.2, hw + 0.3), (x0 - 0.15, hw + 0.3)]
    prism(A, rp, z1, z1 + 0.25, C['house'], bottom=True)
    # the lining inside: dark walls 0.3 m in, so the glass looks into a room (and the console under the front windows)
    ip = [(x0 + 0.3, -hw + 0.3), (x1 - 0.5, -hw + 0.3), (x1 - 0.5, hw - 0.3), (x0 + 0.3, hw - 0.3)]
    prism(A, ip, z0 + 0.05, z1 - 0.05, C['dark'], top=False, bottom=True)
    abox(A, x1 - 1.5, x1 - 0.55, -hw + 0.8, hw - 0.8, z0 + 0.05, z0 + 1.05, C['black'])
    if wing:
        for sg in (1, -1):
            # the wing: a platform from the house out to its end, over the forward part of the house's side, a bulwark round it
            wx0, wx1 = x1 - 4.2, x1 - 0.6; y0, y1 = sg * hw, sg * wing
            abox(A, wx0, wx1, *sorted((y0, y1)), z0 - 0.25, z0, C['house'])
            for (p, q) in (((wx0, y1), (wx1, y1)), ((wx1, y0), (wx1, y1)), ((wx0, y0), (wx0, y1))):
                A.poly([(p[0], p[1], z0), (q[0], q[1], z0), (q[0], q[1], z0 + 1.1), (p[0], p[1], z0 + 1.1)], C['house'], (0, 0, 0))
            abox(A, wx0, wx1, *sorted((y1 - sg * 0.06, y1 + sg * 0.01)), z0 + 1.1, z0 + 1.16, C['house'])
            # its windows: a pane forward (the wing's front is glazed above the bulwark on many coast guard ships; A)
            A.poly([(wx0, y0, z0 - 0.25), (wx0, y1, z0 - 0.25), (wx1, y1, z0 - 0.25), (wx1, y0, z0 - 0.25)], C['inner'], (0, 0, -1))

def lamp(A, c, m, r=0.10, h=0.24):
    c = V(c); acyl(A, c, c + V((0, 0, h)), r, lambda z: m, seg=10); acyl(A, c + V((0, 0, h)), c + V((0, 0, h + 0.03)), r * 1.1, lambda z: C['black'], seg=10)

def radar_scanner(A, c, L, fine):
    """an open array radar on its gearbox: the box and the long bar across (MST-03)"""
    c = V(c); abox(A, c.x - 0.25, c.x + 0.25, c.y - 0.2, c.y + 0.2, c.z, c.z + 0.35, C['white'])
    abox(A, c.x - 0.12, c.x + 0.12, c.y - L / 2, c.y + L / 2, c.z + 0.38, c.z + 0.62, C['white'])

def side_light(A, x, y, z, sg):
    """a sidelight in its box on the wing's bulwark: red to port, green to starboard, the black screen inboard"""
    m = C['lampR'] if sg > 0 else C['lampG']
    abox(A, x - 0.35, x + 0.25, *sorted((y, y + sg * 0.32)), z, z + 0.42, C['black'])
    acyl(A, (x + 0.05, y + sg * 0.22, z + 0.08), (x + 0.05, y + sg * 0.22, z + 0.34), 0.11, lambda q: m, seg=10)


# ---------- the lettering: «KYSTVAKT» on the side, block capitals of strokes, laid on the hull ----------
GLYPHS = {
    'K': [[(0.0, 0.0), (0.0, 1.0)], [(0.0, 0.42), (0.66, 1.0)], [(0.20, 0.60), (0.68, 0.0)]],
    'Y': [[(0.36, 0.0), (0.36, 0.50)], [(0.36, 0.50), (0.0, 1.0)], [(0.36, 0.50), (0.72, 1.0)]],
    'S': [[(0.68, 0.88), (0.52, 1.0), (0.16, 1.0), (0.0, 0.86), (0.0, 0.64), (0.14, 0.53), (0.54, 0.47), (0.68, 0.36), (0.68, 0.14), (0.52, 0.0), (0.16, 0.0), (0.0, 0.12)]],
    'T': [[(0.0, 1.0), (0.72, 1.0)], [(0.36, 1.0), (0.36, 0.0)]],
    'V': [[(0.0, 1.0), (0.36, 0.0)], [(0.36, 0.0), (0.72, 1.0)]],
    'A': [[(0.0, 0.0), (0.36, 1.0)], [(0.36, 1.0), (0.72, 0.0)], [(0.14, 0.36), (0.58, 0.36)]],
}
def hull_quad(A, P4, sg, m, off=0.015, nu=1, nv=1):
    """a mark on the hull: the quad P4 [(x, z)] x 4 (bilinear) cut into nu x nv pieces, every corner laid on the surface; whole, its
    flat faces would sink into the curved bow between their corners (the stripes' and the letters' saw-teeth in the first render)"""
    a, b, c, d = P4; Q = lambda u, v: ((a[0] * (1 - u) + b[0] * u) * (1 - v) + (d[0] * (1 - u) + c[0] * u) * v, (a[1] * (1 - u) + b[1] * u) * (1 - v) + (d[1] * (1 - u) + c[1] * u) * v)
    G = [[V(surf(*Q(i / nu, j / nv), sg, off=off)[0]) for i in range(nu + 1)] for j in range(nv + 1)]
    for j in range(nv):
        for i in range(nu): A.poly([G[j][i], G[j][i + 1], G[j + 1][i + 1], G[j + 1][i]], m, (0, sg, 0))

def lettering(A, txt, x0, z0, h, sg, m, fine=True):
    """txt along the hull's side on side sg, its lower left at (x0, z0), h high: reading from the bow aft on the port side and from aft
    forward on the starboard (as one reads it from the water), each stroke a band 0.16 h wide laid on the surface in short pieces"""
    t = 0.16 * h; adv = 0.0; dirx = -1.0 if sg > 0 else 1.0
    for ch in txt:
        for stroke in GLYPHS[ch]:
            for (u0, v0), (u1, v1) in zip(stroke, stroke[1:]):
                du, dv = u1 - u0, v1 - v0; Ls = math.hypot(du, dv); nu, nv = -dv / Ls * t / 2 / h, du / Ls * t / 2 / h
                eu, ev = du / Ls * t / 2 / h, dv / Ls * t / 2 / h
                pts = [(u0 - eu + nu, v0 - ev + nv), (u0 - eu - nu, v0 - ev - nv), (u1 + eu - nu, v1 + ev - nv), (u1 + eu + nu, v1 + ev + nv)]
                X = [(x0 + dirx * (adv + u) * h, z0 + v * h) for u, v in pts]
                hull_quad(A, [X[0], X[3], X[2], X[1]], sg, m, nu=max(1, int(Ls * h / 0.15)), nv=1)
        adv += 0.72 + 0.22
    return adv * h

def fender_belt(A, fine):
    """the rubbing strake: a heavy black rubber belt along both sides at the main deck's height (a ship that comes alongside boats; A),
    from the transom's corner to where the bow draws in"""
    z0 = (lambda x: interp(P['MD'], x) - 0.35) if P['FC'] else (lambda x: WL + 1.6 + 0.012 * x)
    x1 = x_stem(z0(LOA * 0.8)) - (3.0 if SHIP == '47' else 6.0); n = int(x1 / (0.8 if fine else 4.0)) + 1
    xs = [0.15 + (x1 - 0.15) * i / n for i in range(n + 1)]
    for sg in (1, -1):
        pts = [V(surf(x, z0(x), sg, off=0.10)[0]) for x in xs]
        for a, b in zip(pts, pts[1:]): acyl(A, a, b, 0.16 if SHIP == '90' else 0.13, lambda z: C['rubber'], seg=8 if fine else 4, cap=False)
    y = hbz(0.15, z0(0.15)) + 0.10
    acyl(A, (0.05, -y, z0(0.15)), (0.05, y, z0(0.15)), 0.13, lambda z: C['rubber'], seg=8 if fine else 4, cap=False)

def side_windows(A, fine):
    """a row of square windows in the hull's side under the deck (the cabins; A, a middle-detail model's pattern, not counted from a
    drawing): dark glass in a light frame, kept clear of the stripes, the lettering and the boat bays"""
    if not fine: return
    if SHIP == '47': return             # (the 47 m ship's forecastle side carries the lettering)
    z, s_ = 9.35, 0.6
    xs = [12.0 + 2.2 * i for i in range(5)] + [32.0 + 2.2 * i for i in range(10)]
    for sg in (1, -1):
        for x in xs:
            hull_quad(A, [(x - s_ / 2 - 0.08, z - 0.08), (x + s_ / 2 + 0.08, z - 0.08), (x + s_ / 2 + 0.08, z + s_ + 0.08), (x - s_ / 2 - 0.08, z + s_ + 0.08)], sg, C['house'], off=0.012)
            hull_quad(A, [(x - s_ / 2, z), (x + s_ / 2, z), (x + s_ / 2, z + s_), (x - s_ / 2, z + s_)], sg, C['glass'], off=0.02)

def stripes(A, fine):
    """the slanted stripes forward on both sides (V3 A): a broad red band, a narrow white and a blue one, leaning forward at the top as the
    stem does (A: the pattern from the coast guard's emblem, the racing stripe; the widths are read from no drawing), from just over the
    boot top to under the bulwark's top; then «KYSTVAKT» aft of them"""
    if SHIP == '47': xb, z0, z1, wr, ww, wb, sl, h, xt, zt = 37.6, WL + 0.75, 8.1, 1.7, 0.45, 0.85, 0.45, 1.05, 34.3, 5.65
    else: xb, z0, z1, wr, ww, wb, sl, h, xt, zt = 73.5, WL + 1.3, 11.6, 3.0, 0.8, 1.5, 0.45, 1.75, 68.0, 8.15
    for sg in (1, -1):
        x = xb
        for w, m in ((wr, C['red']), (ww, C['white']), (wb, C['blue'])):
            # (from the bow aft: red, white, blue), each band a strip of patches up the side so it follows the flare
            xt0 = x + sl * (z1 - z0)
            hull_quad(A, [(x - w, z0), (x, z0), (xt0, z1), (xt0 - w, z1)], sg, m, nu=max(1, int(w / 0.3)) if fine else 1, nv=12 if fine else 2)
            x -= w
        if fine:
            if sg > 0: lettering(A, 'KYSTVAKT', xt, zt, h, sg, C['letter'])
            else: lettering(A, 'KYSTVAKT', xt - (8 * 0.94 - 0.22) * h, zt, h, sg, C['letter'])


# ---------- the coast guard's boat: a RIB with its console and two outboards (V2 A); its own frame x forward from the transom, y to port,
# z up from the keel; its waterline at RWL ----------
RIB = {'47': (7.4, 2.75), '90': (8.5, 3.0)}
RWL = 0.42
def rib(A, o, fine=True):
    """a RIB at o (its transom's foot on the centreline): the deep-V hull, the tubes round it, the deck, the console with its windscreen
    and the jockey seats, the arch with its lights, two outboards on the transom"""
    RL, RB = RIB[SHIP]; o = V(o); hw = RB / 2 - 0.30; zs = 0.95; rt = 0.27
    def sec(x):
        t = x / RL; f = 1.0 if t < 0.62 else max(0.0, 1 - ((t - 0.62) / 0.38) ** 1.8)
        zk = 0.0 if t < 0.7 else 0.55 * ((t - 0.7) / 0.3) ** 1.6
        return hw * f, zk, f
    xs = [RL * i / (14 if fine else 5) for i in range(15 if fine else 6)]
    rings = []
    for x in xs:
        w, zk, f = sec(min(x, RL - 0.02))
        rings.append([o + V((x, 0, zk)), o + V((x, w * 0.92, zk + 0.32 * f + 0.05)), o + V((x, w, zs)), o + V((x, -w, zs)), o + V((x, -w * 0.92, zk + 0.32 * f + 0.05))])
    for i in range(len(rings) - 1):
        for k in range(5):
            j = (k + 1) % 5; a, b, c, d = rings[i][k], rings[i][j], rings[i + 1][j], rings[i + 1][k]
            m = C['deck'] if k == 2 else C['ribhull']
            A.poly([a, b, c, d], m, ((a + c) / 2 - (o + V(((a.x + c.x) / 2 - o.x, 0, 0.5)))) if k != 2 else (0, 0, 1))
    A.poly(list(reversed(rings[0])), C['ribhull'], (-1, 0, 0))
    # the tubes: a U from the transom round the bow, on the hull's sheer
    path = []
    for sg in (1, -1):
        side = [o + V((x, sg * (sec(x)[0] + 0.05), zs + 0.12)) for x in [0.15] + [RL * i / 10 for i in range(1, 9)]]
        path.append(side)
    nose = [o + V((RL - 0.32 + 0.30 * math.sin(math.pi * k / 8), 0.30 * math.cos(math.pi * k / 8) * (path[0][-1].y - o.y) / 0.30, zs + 0.12 + 0.12 * math.sin(math.pi * k / 8))) for k in range(9)]
    U = path[0] + nose[1:-1] + list(reversed(path[1]))
    seg = 8 if fine else 5
    for a, b in zip(U, U[1:]): acyl(A, a, b, rt, lambda z: C['tube'], seg=seg, cap=False)
    for p in (U[0], U[-1]): acyl(A, p, p - V((0.12, 0, 0)), rt * 0.85, lambda z: C['tube'], seg=seg)
    if not fine: return
    # the console with its windscreen, the seats aft of it, the arch with the lights
    cx = RL * 0.48; abox(A, cx - 0.45, cx + 0.45, -0.42, 0.42, o.z + zs, o.z + zs + 0.95, C['white'])
    abox(A, cx + 0.40, cx + 0.47, -0.42, 0.42, o.z + zs + 0.95, o.z + zs + 1.35, C['glass'])
    for dy in (-0.45, 0.45):
        abox(A, cx - 1.25, cx - 0.75, dy - 0.22, dy + 0.22, o.z + zs, o.z + zs + 0.75, C['dark'])
    ax = RL * 0.24
    for sg in (1, -1): acyl(A, o + V((ax, sg * (hw - 0.25), zs)), o + V((ax, sg * 0.45, zs + 1.75)), 0.045, lambda z: C['steel'], seg=6)
    acyl(A, o + V((ax, -0.45, zs + 1.75)), o + V((ax, 0.45, zs + 1.75)), 0.045, lambda z: C['steel'], seg=6)
    abox(A, ax - 0.12, ax + 0.12, -0.10, 0.10, o.z + zs + 1.78, o.z + zs + 2.0, C['white'])
    lamp(A, o + V((ax, 0.0, zs + 2.0)), C['lampW'], r=0.05, h=0.12)
    for dy in (-0.55, 0.55):
        abox(A, o.x - 0.55, o.x - 0.02, o.y + dy - 0.28, o.y + dy + 0.28, o.z + 0.35, o.z + 1.45, C['dark'])
        abox(A, o.x - 0.40, o.x - 0.15, o.y + dy - 0.06, o.y + dy + 0.06, o.z - 0.35, o.z + 0.35, C['dark'])

def rib_part():
    """the 93 m ship's starboard RIB as its own part (its own frame, the middle of its length at the waterline: the game puts it in the
    davit, in the water, on its way and alongside the vessel)"""
    A = Acc('rib'); rib(A, (0, 0, 0), True); return A.done(30)
def rib_game(p): RL = RIB[SHIP][0]; return (-p[1], p[2] - RWL, -(p[0] - RL / 2))


# ---------- the arrangement of each ship ----------
HELI = (0.8, 22.0)              # the 93 m ship's helicopter deck (x): from the stern to the hangar's door (valg 30; A: 21 m long, the
                                # whole breadth, for a helicopter of the NH90's size, D about 19.6 m: a deck at least 1 D long)
def heli(A, fine):
    """the markings on the helicopter deck (A, after CAP 437's pattern: the white edge line, the yellow touchdown circle, the white H)
    and the safety nets angled out round its after part"""
    x0, x1 = HELI; z = lambda x: z_md(x) + camber(0, x, 8) + 0.006; e = lambda x: hbz(x, z_md(x)) - 0.25
    xs = [x0 + (x1 - x0) * i / 10 for i in range(11)]
    for sg in (1, -1):
        for a, b in zip(xs, xs[1:]): A.poly([(a, sg * e(a), z(a)), (b, sg * e(b), z(b)), (b, sg * (e(b) - 0.3), z(b)), (a, sg * (e(a) - 0.3), z(a))][::sg], C['white'], (0, 0, 1))
    A.poly([(x0 + 0.3, -e(x0), z(x0)), (x0 + 0.3, e(x0), z(x0)), (x0 + 0.6, e(x0), z(x0)), (x0 + 0.6, -e(x0), z(x0))], C['white'], (0, 0, 1))
    cx = (x0 + x1) / 2; R = 4.6; w = 0.5; n = 48 if fine else 16
    for k in range(n):
        a, b = 2 * math.pi * k / n, 2 * math.pi * (k + 1) / n
        P_ = lambda r, t: (cx + r * math.cos(t), r * math.sin(t), z(cx) + 0.002)
        A.poly([P_(R, a), P_(R, b), P_(R - w, b), P_(R - w, a)], C['yellow'], (0, 0, 1))
    if fine:
        hz = z(cx) + 0.004; hx, hy, t = 2.0, 1.5, 0.5     # the H, its bars along the ship (the approach from astern)
        for yy in (-hy, hy - t): A.poly([(cx - hx, yy, hz), (cx + hx, yy, hz), (cx + hx, yy + t, hz), (cx - hx, yy + t, hz)], C['white'], (0, 0, 1))
        A.poly([(cx - t / 2, -hy + t, hz), (cx + t / 2, -hy + t, hz), (cx + t / 2, hy - t, hz), (cx - t / 2, hy - t, hz)], C['white'], (0, 0, 1))
        # the nets: a shelf 1.5 m wide, angled 10 degrees up, outboard of the deck's edge along the sides and across the stern
        for sg in (1, -1):
            for a, b in zip(xs, xs[1:]):
                ya, yb = hbz(a, z_md(a)), hbz(b, z_md(b))
                A.poly([(a, sg * ya, z_md(a) - 0.05), (b, sg * yb, z_md(b) - 0.05), (b, sg * (yb + 1.5), z_md(b) + 0.21), (a, sg * (ya + 1.5), z_md(a) + 0.21)], C['net'], (0, 0, 1))
                acyl(A, (a, sg * (ya + 1.5), z_md(a) + 0.21), (b, sg * (yb + 1.5), z_md(b) + 0.21), 0.03, lambda q: C['steel'], seg=5, cap=False)
        y = hbz(0.05, z_md(0.05))
        A.poly([(0.05, -y, z_md(0.05) - 0.05), (0.05, y, z_md(0.05) - 0.05), (-1.4, y, z_md(0.05) + 0.21), (-1.4, -y, z_md(0.05) + 0.21)], C['net'], (0, 0, 1))
        acyl(A, (-1.4, -y, z_md(0.05) + 0.21), (-1.4, y, z_md(0.05) + 0.21), 0.03, lambda q: C['steel'], seg=5, cap=False)

def davit(A, xm, yp, yh, zd, fine):
    """a single-arm davit for the boat: its pedestal at yp inboard of the cradle, the arm up and out to over the boat's middle (yh), the
    fall down to the hook block over the console (the boat hangs from one point; A)"""
    acyl(A, (xm, yp, zd), (xm, yp, zd + 4.35), 0.22, lambda z: C['house'], seg=10 if fine else 6)
    beam(A, (xm, yp, zd + 4.2), (xm, yh, zd + 4.65), 0.30, 0.34, C['house'])
    if fine:
        acyl(A, (xm, yh, zd + 4.45), (xm, yh, zd + 3.45), 0.02, lambda z: C['dark'], seg=4)
        abox(A, xm - 0.15, xm + 0.15, yh - 0.12, yh + 0.12, zd + 3.2, zd + 3.45, C['yellow'])

def cradle(A, x0, x1, yc, zd):
    """the chocks the boat stands in"""
    for x in (x0 + 1.4, x1 - 2.2): abox(A, x - 0.12, x + 0.12, yc - 0.9, yc + 0.9, zd, zd + 0.38, C['dark'])

def mast47(A, fine):
    """the 47 m ship's mast on the wheelhouse roof: a tapered pole with the yard and the radar platform; the masthead light on top (one
    under 50 m, vedlegg I 2(a)(i): at least the breadth, 10.3 m, over the hull)"""
    x, zr = MAST[0], BR[4] + 0.25
    acyl(A, (x, 0, zr), (x, 0, MAST[1]), 0.20, lambda z: C['house'], seg=10 if fine else 6, r1=0.11)
    abox(A, x - 0.7, x + 0.9, -1.0, 1.0, zr + 1.3, zr + 1.45, C['house'])                 # the radar platform
    radar_scanner(A, (x + 0.1, 0, zr + 1.45), 2.6, fine)
    beam(A, (x, -2.2, zr + 2.9), (x, 2.2, zr + 2.9), 0.10, 0.12, C['house'])            # the yard
    lamp(A, (x, 0, MAST[1]), C['lampW'])
    if fine:
        F.radome(A, (BR[0] + 1.6, 1.4, zr), 0.55, C['white'], m_base=C['steel'], seg=16, rings=4)
        F.whip(A, (BR[0] + 0.6, -1.8, zr), 6.0, C['white'], m_joint=C['black'], m_foot=C['steel'])
        F.whip(A, (BR[0] + 0.6, 1.8, zr), 5.0, C['white'], m_joint=C['black'], m_foot=C['steel'])
        for yy in (-0.8, 0.8): F.searchlight(A, (BR[1] - 0.2, yy, zr), (1, 0), 0.22, C['white'], C['lens'], m_yoke=C['steel'])
        radar_scanner(A, (BR[1] - 1.4, 0, zr + 0.2), 3.6, fine)
        for yy in (-2.2, 2.2): lamp(A, (x, yy, zr + 2.75), C['lampW'], r=0.06, h=0.14)

def masts90(A, fine):
    """the 93 m ship's masts: the radar mast on the wheelhouse roof; the foremast on the forecastle with the forward masthead light, the
    after masthead light on the mast over the funnel 4.6 m higher and 48 m aft (vedlegg I 2(a)(ii), 3(a); kap. 6 of the groundwork)"""
    x, zr = MAST[0], BR[4] + 0.25
    oct_ = lambda cx, z, h: [(cx - h, -h * 0.8, z), (cx + h, -h * 0.8, z), (cx + h, h * 0.8, z), (cx - h, h * 0.8, z)]
    loft_acc(A, [oct_(x, zr, 0.9), oct_(x, zr + 4.2, 0.45)], C['house'])
    abox(A, x - 1.3, x + 1.3, -1.5, 1.5, zr + 4.2, zr + 4.4, C['house'])
    radar_scanner(A, (x, 0, zr + 4.4), 4.2, fine)
    acyl(A, (x, 0, zr + 4.4), (x, 0, zr + 6.0), 0.14, lambda z: C['house'], seg=8, r1=0.08)
    beam(A, (x, -2.8, zr + 5.4), (x, 2.8, zr + 5.4), 0.12, 0.14, C['house'])
    F.radome(A, (x - 2.5, 0, zr + 4.4), 0.75, C['white'], m_base=C['steel'], seg=16 if fine else 8, rings=4 if fine else 2)
    xf, zf = FORE
    acyl(A, (xf, 0, z_md(xf)), (xf, 0, zf - 0.2), 0.20, lambda z: C['house'], seg=8 if fine else 5, r1=0.10)
    lamp(A, (xf, 0, zf - 0.2), C['lampW'])
    xa, za = AFTM
    acyl(A, (xa, 0, FUN[3]), (xa, 0, za - 0.2), 0.18, lambda z: C['house'], seg=8 if fine else 5, r1=0.10)
    lamp(A, (xa, 0, za - 0.2), C['lampW'])
    if fine:
        F.whip(A, (BR[0] + 1.0, -2.5, zr), 7.0, C['white'], m_joint=C['black'], m_foot=C['steel'])
        F.whip(A, (BR[0] + 1.0, 2.5, zr), 7.0, C['white'], m_joint=C['black'], m_foot=C['steel'])
        radar_scanner(A, (BR[1] - 2.0, 0, zr + 0.2), 3.0, fine)
        for yy in (-1.2, 1.2): F.searchlight(A, (BR[1] - 0.4, yy, zr), (1, 0), 0.26, C['white'], C['lens'], m_yoke=C['steel'])
        for yy in (-2.8, 2.8): lamp(A, (x, yy, zr + 5.47), C['lampW'], r=0.06, h=0.14)
        F.gps(A, (x - 0.6, 0.9, zr + 4.4), C['white'], m_post=C['steel']); F.gps(A, (x - 0.6, -0.9, zr + 4.4), C['white'], m_post=C['steel'])

def loft_acc(A, rings, m):
    vs = [[A.v(V(p)) for p in r] for r in rings]; n = len(rings[0])
    for i in range(len(rings) - 1):
        c = sum((v.co for v in vs[i]), V((0, 0, 0))) / n
        for k in range(n):
            j = (k + 1) % n; A.f([vs[i][k], vs[i][j], vs[i + 1][j], vs[i + 1][k]], m, (vs[i][k].co + vs[i][j].co) / 2 - c)
    A.f(list(vs[-1]), m, (0, 0, 1))

def funnel(A, fine):
    """the funnel: a tapered casing, its black top, two exhausts (the 47 m ship's stands on the 02 deck aft of the wheelhouse)"""
    x0, x1, hw, zt, zb = FUN
    loft_acc(A, [[(x0, -hw, zb), (x1, -hw, zb), (x1, hw, zb), (x0, hw, zb)], [(x0 + 0.5, -hw * 0.82, zt), (x1 - 0.1, -hw * 0.82, zt), (x1 - 0.1, hw * 0.82, zt), (x0 + 0.5, hw * 0.82, zt)]], C['house'])
    abox(A, x0 + 0.45, x1 - 0.05, -hw * 0.84, hw * 0.84, zt - 0.6, zt + 0.02, C['black'])
    for yy in (-hw * 0.4, hw * 0.4): acyl(A, ((x0 + x1) / 2, yy, zt), ((x0 + x1) / 2 - 0.15, yy, zt + 0.9), 0.22 * BM / 10.3, lambda z: C['black'], seg=10 if fine else 6)

def anchors_bow(A, fine):
    """the anchor pockets in the bow (dark recesses with the anchor's crown) and the windlass on the forecastle"""
    xp, zp, w, h = (44.3, 5.5, 1.2, 0.7) if SHIP == '47' else (88.0, 8.2, 1.9, 1.05)
    for sg in (1, -1):
        hull_quad(A, [(xp - w / 2, zp - h / 2), (xp + w / 2, zp - h / 2 + 0.15), (xp + w / 2, zp + h / 2), (xp - w / 2, zp + h / 2 - 0.1)], sg, C['dark'], off=0.012, nu=4, nv=3)
    if not fine: return
    xw = xp - (3.0 if SHIP == '47' else 5.0); zd = z_md(xw)
    for sg in (1, -1):
        y = sg * (1.3 if SHIP == '47' else 2.2)
        # (its gypsy on a pedestal, the brake band and the drum beside it; round 3: the first ones were 0.84 m tyres)
        r = 0.30 if SHIP == '47' else 0.42; abox(A, xw - 0.5, xw + 0.5, y - 0.45, y + 0.45, zd, zd + 0.40, C['house'])
        acyl(A, (xw, y - 0.16, zd + 0.40 + r), (xw, y + 0.16, zd + 0.40 + r), r, lambda z: C['dark'], seg=18)
        acyl(A, (xw, y + sg * 0.18, zd + 0.40 + r), (xw, y + sg * 0.42, zd + 0.40 + r), r * 0.8, lambda z: C['steel'], seg=18)
        for e in (-0.22, 0.22): abox(A, xw - 0.35, xw + 0.35, y + e - 0.03, y + e + 0.03, zd + 0.40, zd + 0.40 + 1.7 * r, C['house'])
        acyl(A, (xw + 0.5, y, zd + 0.02), (xp - 0.3, sg * (hbz(xp - 0.3, zp) - 0.2), zd + 0.05), 0.06, lambda z: C['dark'], seg=6)
    for x in ((xw - 3.0, 9.0, 3.5) if SHIP == '47' else (81.0, 30.0)):
        for sg in (1, -1): F.bitts(A, x, sg * (hbz(x, z_md(x)) - 0.6), z_md(x), C['dark'], h=0.45, r=0.12, gap=0.35)

# the arrangements (x from the transom; the houses' half-widths; z of their floors and roofs). kap. 4 of the groundwork
def arrangement():
    global BR, MAST, FUN, FORE, AFTM, BAY
    if SHIP == '47':
        md, fc = interp(P['MD'], 20.0), interp(P['FC'], 30.0)
        # the 01 house on the main deck aft of the forecastle, the 02 deck on the forecastle, the wheelhouse on it with its wings
        BR = (28.2, 34.6, 3.45, fc + 2.55, fc + 2.55 + 2.65)       # x0, x1, half-width, floor, roof
        MAST = (31.0, BR[4] + 0.25 + 3.9)                           # x, the top (the masthead light's foot)
        FUN = (21.2, 23.6, 1.15, fc + 2.55 + 1.6, fc)               # x0, x1, half-width, top, foot
        BAY = (10.9, 18.6, -3.3, md)                                # the RIB's cradle: x0, x1, y of its centre line, deck
        FORE = AFTM = None
    else:
        ud = z_md(50.0)
        BR = (59.5, 72.5, 6.0, ud + 5.7, ud + 5.7 + 3.0)
        MAST = (64.5, BR[4] + 0.25 + 6.0)
        FUN = (33.0, 39.5, 2.3, ud + 10.0, ud + 2.85)
        BAY = (39.2, 48.2, -6.45, ud)
        FORE = (84.0, z_md(50.0) + 12.15)                           # the forward masthead light's centre: 12 m over the hull's deck
        AFTM = (36.2, FORE[1] + 4.6)                                # the after one: 4.6 m higher, 47.8 m aft

def superstructure(fine=True):
    A = Acc('house'); G = Acc('glass'); H = C['house']
    if SHIP == '47':
        md = lambda x: interp(P['MD'], x); fc = interp(P['FC'], 30.0)
        # 01: on the main deck from 19.4 m to the forecastle's bulkhead (its roof is the forecastle deck's level), its front left out
        hw1 = 3.95; pl = [(19.4, -hw1), (P['X_FC'], -hw1), (P['X_FC'], hw1), (19.4, hw1)]
        prism(A, pl, md(20.0) - 0.05, interp(P['FC'], P['X_FC']), H, skip=(1,))
        if fine:
            for sg in (1, -1):
                window_row(A, G, (20.2, sg * hw1), (23.8, sg * hw1), md(20) + 1.1, md(20) + 1.8, 1.4, 0.7, (0, sg, 0))
                door(A, 19.7, 20.5, sg * hw1, md(20), sg)
            abox(A, 19.33, 19.4, -0.45, 0.45, md(20) + 0.12, md(20) + 2.0, H)
        # 02: on the forecastle deck from 21.0 to 34.0 m, narrower; its windows; the wheelhouse on top
        hw2 = 3.65; pl2 = [(21.0, -hw2), (33.2, -hw2), (34.0, -hw2 + 0.8), (34.0, hw2 - 0.8), (33.2, hw2), (21.0, hw2)]
        prism(A, pl2, fc - 0.02, BR[3], H)
        if fine:
            for sg in (1, -1): window_row(A, G, (24.0, sg * hw2), (32.6, sg * hw2), fc + 1.1, fc + 1.8, 1.3, 0.75, (0, sg, 0))
            window_row(A, G, (34.0, -hw2 + 1.0), (34.0, hw2 - 1.0), fc + 1.1, fc + 1.8, 1.2, 0.8, (1, 0, 0))
            for sg in (1, -1): rail(A, [(21.1, sg * (hw2 - 0.05), BR[3]), (28.0, sg * (hw2 - 0.05), BR[3])], h=1.0, every=1.4)
            rail(A, [(21.1, -hw2 + 0.05, BR[3]), (21.1, hw2 - 0.05, BR[3])], h=1.0, every=1.4)
            # the 01 roof aft of the 02 house: a deck with its rail round it
            rail(A, [(19.45, -hw1 + 0.05, interp(P['FC'], P['X_FC'])), (19.45, hw1 - 0.05, interp(P['FC'], P['X_FC']))], h=1.0)
        bridge(A, G, BR[0], BR[1], BR[2], BR[3], BR[4], HB + 0.05, fine)
        mast47(A, fine); funnel(A, fine)
        # the towing and working deck aft: the towing winch, the stern roller between the tow pins, the H-bitt, the crane to port
        z0 = md(10.0)
        acyl(A, (16.6, -1.3, z0 + 1.0), (16.6, 1.3, z0 + 1.0), 0.72, lambda z: C['dark'], seg=16 if fine else 8)
        for yy in (-1.42, 1.42): abox(A, 15.9, 17.3, yy - 0.1, yy + 0.1, z0, z0 + 1.9, H)
        abox(A, 15.7, 17.5, -1.6, 1.6, z0, z0 + 0.25, H)
        acyl(A, (0.35, -1.6, z_bw(0.3) - 0.25), (0.35, 1.6, z_bw(0.3) - 0.25), 0.36, lambda z: C['dark'], seg=14 if fine else 6)
        for yy in (-1.85, 1.85): acyl(A, (1.0, yy, md(1.0)), (1.0, yy, z_bw(1.0) + 0.6), 0.14, lambda z: C['yellow'], seg=10 if fine else 5)
        if fine:
            for yy in (-1.0, 1.0): acyl(A, (10.6, yy, z0), (10.6, yy, z0 + 1.1), 0.18, lambda z: C['dark'], seg=10)
            beam(A, (10.6, -1.2, z0 + 0.95), (10.6, 1.2, z0 + 0.95), 0.25, 0.25, C['dark'])
            # the knuckle crane by the port bulwark, folded aft along it
            acyl(A, (17.9, 3.6, z0), (17.9, 3.6, z0 + 2.2), 0.32, lambda z: C['yellow'], seg=12)
            beam(A, (17.9, 3.6, z0 + 2.1), (14.0, 3.7, z0 + 2.6), 0.32, 0.36, C['yellow'])
            beam(A, (14.0, 3.7, z0 + 2.4), (16.6, 3.8, z0 + 1.7), 0.26, 0.28, C['yellow'])
            acyl(A, (17.4, 3.35, z0 + 1.0), (15.6, 3.4, z0 + 2.4), 0.08, lambda z: C['steel'], seg=6)
        RL, RB = RIB[SHIP]; xm = BAY[0] + 0.1 + RL / 2
        cradle(A, BAY[0], BAY[1], BAY[2], BAY[3]); davit(A, xm, BAY[2] + RB / 2 + 0.45, BAY[2], BAY[3], fine)
        rib(A, (BAY[0] + 0.1, BAY[2], BAY[3] + 0.38), fine)
    else:
        ud = z_md(40.0)
        # the hangar forward of the helicopter deck: its door to the deck, a roof walk
        hpl = [(HELI[1], -5.7), (31.0, -5.7), (31.0, 5.7), (HELI[1], 5.7)]
        prism(A, hpl, z_md(26.0) - 0.05, ud + 5.6, H)
        A.poly([(HELI[1] - 0.02, -4.4, ud + 0.05), (HELI[1] - 0.02, 4.4, ud + 0.05), (HELI[1] - 0.02, 4.4, ud + 4.9), (HELI[1] - 0.02, -4.4, ud + 4.9)], C['inner'], (-1, 0, 0))
        if fine:
            for k in range(1, 8): A.poly([(HELI[1] - 0.03, -4.4 + 1.1 * k - 0.02, ud + 0.05), (HELI[1] - 0.03, -4.4 + 1.1 * k + 0.02, ud + 0.05), (HELI[1] - 0.03, -4.4 + 1.1 * k + 0.02, ud + 4.9), (HELI[1] - 0.03, -4.4 + 1.1 * k - 0.02, ud + 4.9)], C['dark'], (-1, 0, 0))
        # 01: from the hangar to 72 m, with the boat bays in its sides (39.2-48.2 m), 02 over its forward part, the wheelhouse on it
        hw1 = 7.0; bi = 4.3
        pl = [(31.0, -hw1), (BAY[0], -hw1), (BAY[0], -bi), (BAY[1], -bi), (BAY[1], -hw1), (70.8, -hw1), (72.4, -hw1 + 1.6), (72.4, hw1 - 1.6), (70.8, hw1), (BAY[1], hw1), (BAY[1], bi), (BAY[0], bi), (BAY[0], hw1), (31.0, hw1)]
        prism(A, pl, ud - 0.05, ud + 2.85, H)
        hw2 = 6.5; pl2 = [(49.0, -hw2), (70.0, -hw2), (71.6, -hw2 + 1.5), (71.6, hw2 - 1.5), (70.0, hw2), (49.0, hw2)]
        prism(A, pl2, ud + 2.85, BR[3], H)
        if fine:
            for sg in (1, -1):
                for a, b in ((31.6, BAY[0] - 0.4), (BAY[1] + 0.4, 70.4)): window_row(A, G, (a, sg * hw1), (b, sg * hw1), ud + 1.2, ud + 1.9, 1.6, 0.8, (0, sg, 0))
                window_row(A, G, (50.0, sg * hw2), (69.4, sg * hw2), ud + 4.05, ud + 4.75, 1.5, 0.8, (0, sg, 0))
                door(A, 32.0, 32.8, sg * hw1, ud, sg); door(A, BAY[1] + 0.3, BAY[1] + 1.1, sg * hw1, ud, sg)
                rail(A, [(31.1, sg * (hw1 - 0.05), ud + 2.85), (BAY[0], sg * (hw1 - 0.05), ud + 2.85), (BAY[0], sg * (bi - 0.05), ud + 2.85), (48.9, sg * (bi - 0.05), ud + 2.85)], h=1.0, every=1.4)
            window_row(A, G, (71.6, -hw2 + 1.6), (71.6, hw2 - 1.6), ud + 4.05, ud + 4.75, 1.2, 0.8, (1, 0, 0))
            rail(A, [(22.1, -5.65, ud + 5.6), (30.9, -5.65, ud + 5.6), (30.9, 5.65, ud + 5.6), (22.1, 5.65, ud + 5.6)], h=1.0, every=1.4)
        bridge(A, G, BR[0], BR[1], BR[2], BR[3], BR[4], HB + 0.1, fine)
        masts90(A, fine); funnel(A, fine); heli(A, fine)
        RL, RB = RIB[SHIP]; xm = BAY[0] + 0.1 + RL / 2
        for sg in (1, -1):
            cradle(A, BAY[0], BAY[1], sg * abs(BAY[2]), ud); davit(A, xm, sg * (bi + 0.3), sg * abs(BAY[2]), ud, fine)
        rib(A, (BAY[0] + 0.1, abs(BAY[2]), ud + 0.38), fine)     # the port one; the starboard one is the part 'rib'
    anchors_bow(A, fine); stripes(A, fine); fender_belt(A, fine); side_windows(A, fine)
    return [A.done(30)], [G.done(30)]


# ---------- under water: the skeg, the propellers, the rudders ----------
def underwater(fine=True):
    U = Acc('under'); objs = []
    if SHIP == '47':
        # one skeg on the centreline carrying the shaft, the propeller in front of a spade rudder (A: the propulsion is not read)
        xs = [2.6 + 0.5 * i for i in range(16)]
        top = [(x, z_keel(x) + 0.3) for x in xs]; bot = [(x, 0.75 * max(0.0, (10.0 - x) / 7.4)) for x in reversed(xs)]
        objs.append(loft_rings('skeg', [[(x, sy * 0.22, z) for x, z in top + bot] for sy in (1, -1)], C['af']))
        F.propeller(U, (2.2, 0, 1.25), (1, 0, 0), 0.95, C['prop'], n=4, hub=0.22, cpp=True, m_hub=C['prop'], m_bolt=C['steel'], m_guard=C['af'], fine=fine)
        F.foil_rudder(U, (1.65, 0.0), 0.35, 2.9, 1.4, C['af'], thick=0.13, top=lambda x: z_keel(x) + 0.05)
    else:
        # twin screws on their shafts and brackets, twin rudders, the centre skeg down to the greatest draught 6.0 m (Tmax, R)
        # (its after edge raked up into the run, its fore end faired into the keel at 66 m)
        dz = P['Tmax'] - WL; xs = [18.0 + 1.0 * i for i in range(49)]
        bl = [(18.0, 1.2), (24.0, 0.0), (30.0, -dz), (58.0, -dz), (66.0, -0.02)]
        top = [(x, z_keel(x) + 0.2) for x in xs]; bot = [(x, min(interp(bl, x), z_keel(x) - 0.01)) for x in reversed(xs)]
        objs.append(loft_rings('skeg', [[(x, sy * 0.3, z) for x, z in top + bot] for sy in (1, -1)], C['af']))
        for sg in (1, -1):
            yy = sg * 3.6
            F.propeller(U, (3.8, yy, 1.9), (1, 0, 0), 1.75, C['prop'], n=4, hub=0.35, cpp=True, m_hub=C['prop'], m_bolt=C['steel'], m_guard=C['af'], fine=fine)
            acyl(U, (4.1, yy, 1.9), (12.0, yy, 2.6), 0.22, lambda z: C['steel'], seg=10)
            beam(U, (8.0, yy, 2.25), (8.0, yy * 0.6, z_keel(8.0) + 0.4), 0.25, 0.6, C['af'], up=(1, 0, 0))
            F.foil_rudder(U, (2.0, yy), 0.4, 4.6, 1.9, C['af'], thick=0.14, top=lambda x: z_keel(x) + 0.3)
    o = U.done(30)
    if o: objs.append(o)
    return objs


def build(fine=True):
    arrangement(); lights_place()
    hull = build_hull(fine); dk = decks(fine)
    o, g = superstructure(fine)
    L = Acc('lights'); stern_light(L)
    solids = hull + dk + o + (underwater(fine) if fine else []) + [L.done(30)]   # (far off nothing under the water shows)
    return [s for s in solids if s], [x for x in g if x]


# ---------- the anchors for the game ----------
def to_game(p): return (-p[1], p[2] - WL, -(p[0] - LOA / 2))
def to_game_n(n): return (-n[1], n[2], -n[0])

def anchors():
    G = lambda x, y, z: [round(v, 3) for v in to_game((x, y, z))]
    arrangement()
    md = z_md(LOA * 0.3)
    ex = {'eye': G(BR[1] - 2.0, 0.6, BR[3] + 1.7), 'skipperAt': G(BR[1] - 2.0, 0.6, BR[3]), 'hp': -0.1, 'fov': 58,
          'deck': {'y': round(md - WL, 3), 'z': round(-(LOA * 0.3 - LOA / 2), 3)}, 'gw': round(md + 0.2 - WL, 3),
          'stern': round(LOA / 2, 3), 'bow': round(-LOA / 2, 3), 'side': HB, 'beam': BM, 'open': False, 'hand': False, 'kv': True}
    if SHIP == '47':
        ex['crewSpots'] = [G(13.0, -1.6, interp(P['MD'], 13.0)) + [1.57], G(20.5, 3.6, interp(P['MD'], 20.5)) + [-1.2], G(38.0, -2.5, interp(P['FC'], 38.0)) + [3.14]]
        ex['lights'] = [[G(MAST[0], 0, MAST[1] + 0.12), [1, 0.95, 0.85], 'masthead'],
                        [G(LIGHTS['side'][0], HB - 0.15, LIGHTS['side'][1]), [1, 0.12, 0.1], 'port'], [G(LIGHTS['side'][0], -(HB - 0.15), LIGHTS['side'][1]), [0.1, 1, 0.35], 'stbd'],
                        [G(0.25, 0, LIGHTS['stern']), [1, 0.95, 0.85], 'stern'],
                        [G(BR[0] - 0.1, 2.0, BR[4] - 0.5), [1, 0.95, 0.85], 'work'], [G(BR[0] - 0.1, -2.0, BR[4] - 0.5), [1, 0.95, 0.85], 'work']]
    else:
        ex['crewSpots'] = [G(BAY[0] + 4.5, -7.6, z_md(43.0)) + [1.57], G(75.0, -4.0, z_md(75.0)) + [3.14], G(25.0, 3.0, z_md(25.0)) + [1.2]]
        ex['lights'] = [[G(FORE[0], 0, FORE[1]), [1, 0.95, 0.85], 'masthead'], [G(AFTM[0], 0, AFTM[1]), [1, 0.95, 0.85], 'masthead2'],
                        [G(LIGHTS['side'][0], HB - 0.15, LIGHTS['side'][1]), [1, 0.12, 0.1], 'port'], [G(LIGHTS['side'][0], -(HB - 0.15), LIGHTS['side'][1]), [0.1, 1, 0.35], 'stbd'],
                        [G(0.3, 0, LIGHTS['stern']), [1, 0.95, 0.85], 'stern'],
                        [G(HELI[1] + 0.5, 3.5, z_md(22) + 5.2), [1, 0.95, 0.85], 'work'], [G(HELI[1] + 0.5, -3.5, z_md(22) + 5.2), [1, 0.95, 0.85], 'work']]
        RL, RB = RIB[SHIP]
        # the starboard RIB in its cradle (the part's origin: the middle of its length at its waterline), its length and beam, and
        # where its coxswain stands (in its own frame, the game's axes)
        ex['rib'] = {'at': G(BAY[0] + 0.1 + RL / 2, -abs(BAY[2]), z_md(43.0) + 0.38 + RWL), 'L': RL, 'B': RB, 'cox': [0.0, 0.95 - RWL, round(-(RL * 0.48 - 0.75 - RL / 2), 3)]}
    return ex

# the lights' places (z), worked out from the arrangement: the sidelights on the wings' outer ends, aft of the forward masthead light
# (vedlegg I 3(b)); the stern light on the transom's top (the 47 m ship) or under the helicopter deck's after edge (the 93 m one)
LIGHTS = {}
def lights_place():
    arrangement()
    LIGHTS['side'] = ((BR[1] - 4.0, BR[3] + 1.25) if SHIP == '47' else (BR[1] - 3.6, BR[3] + 1.25))
    LIGHTS['stern'] = z_bw(0.3) + 0.45 if SHIP == '47' else z_md(0.3) - 0.6

def stern_light(A):
    if SHIP == '47':
        acyl(A, (0.25, 0, z_bw(0.3)), (0.25, 0, LIGHTS['stern'] - 0.1), 0.05, lambda z: C['steel'], seg=6); lamp(A, (0.25, 0, LIGHTS['stern'] - 0.1), C['lampW'], r=0.08, h=0.18)
    else:
        abox(A, 0.0, 0.25, -0.2, 0.2, LIGHTS['stern'] - 0.25, LIGHTS['stern'] + 0.2, C['black']); lamp(A, (-0.05, 0, LIGHTS['stern'] - 0.12), C['lampW'], r=0.08, h=0.18)
    for sg in (1, -1): side_light(A, LIGHTS['side'][0], sg * (HB - 0.15) - sg * 0.32, LIGHTS['side'][1] - 0.15, sg)


# ---------- check(): the model against the sources and the rules ----------
def volume():
    """the displaced volume under WL (m3) and the waterline's length, from the hull's sections (Simpson over x), plus the 93 m ship's skeg"""
    xs = np.linspace(0.0, LOA, 401); zz = np.linspace(-0.3, WL, 700); A = []
    for x in xs:
        y = np.maximum(hb(x, zz), 0.0); A.append(2 * np.trapz(y, zz))
    A = np.array(A); vol = np.trapz(A, xs)
    wl = [x for x in xs if hbz(x, WL - 0.01) > 0.01]
    return vol, (max(wl) - min(wl)) if wl else 0.0, xs, A

def check():
    ok = True; was = SHIP
    def say(good, txt):
        nonlocal ok; ok = ok and good; print(('OK   ' if good else 'FEIL ') + txt)
    for k in ('47', '90'):
        use(k); arrangement(); lights_place()
        vol, lwl, xs, Ar = volume(); disp = vol * 1.025
        bmax = 2 * max(hbz(x, z) for x in np.linspace(0, LOA, 120) for z in np.linspace(0, z_bw(x), 40))
        say(abs(x_stem(P['STEM'][-1][0]) - LOA) < 0.02, '%s: lengde over alt %.2f m (kilden %.2f)' % (P['t'], x_stem(P['STEM'][-1][0]), LOA))
        say(abs(bmax - BM) / BM < 0.02, '%s: største bredde %.2f m (kilden %.2f, ±2 %%)' % (P['t'], bmax, BM))
        say(abs(disp - P['disp']) / P['disp'] < 0.08, '%s: deplasement %.0f t mot %.0f t (±8 %%; vannlinjelengde %.1f m, Cb %.2f)' % (P['t'], disp, P['disp'], lwl, vol / (lwl * BM * WL)))
        say(all(abs(hbz(x, z) - float(np.maximum(hb(x, np.array([z])), 0)[0])) < 1e-9 for x in (5, LOA / 2, LOA - 3) for z in (1, WL, z_md(x))), '%s: sidene er like (snittet regnes én gang og speiles)' % P['t'])
        hull = z_md(LOA * 0.3)    # «over the hull»: the uppermost continuous deck (the main deck; on the 93 m ship the upper deck)
        lt = anchors()['lights']; L = {l[2]: l for l in lt}; yz = lambda l: l[0][1] + WL; xx = lambda l: LOA / 2 - l[0][2]
        mh = yz(L['masthead']) - hull
        if LOA < 50:
            say(mh >= min(12.0, max(6.0, BM)) - 1e-6, '%s: topplanterna %.1f m over skroget (vedlegg I 2(a)(i): minst bredden %.1f m)' % (P['t'], mh, BM))
            say('masthead2' not in L, '%s: én topplanterne (under 50 m, regel 23 a ii)' % P['t'])
        else:
            say(mh >= 12.0 - 1e-6, '%s: den forre topplanterna %.1f m over skroget (vedlegg I 2(a)(i): 12 m når bredden er over 12)' % (P['t'], mh))
            d2 = yz(L['masthead2']) - yz(L['masthead']); sep = xx(L['masthead']) - xx(L['masthead2'])
            say(d2 >= 4.5 - 1e-6, '%s: den aktre topplanterna %.1f m høyere (2(a)(ii): minst 4,5 m)' % (P['t'], d2))
            say(sep >= min(100.0, LOA / 2) - 1e-6, '%s: %.1f m mellom topplanternene (3(a): minst halve lengden, %.1f m)' % (P['t'], sep, LOA / 2))
            say(LOA - xx(L['masthead']) <= LOA / 4 + 1e-6, '%s: den forre %.1f m fra stevnen (3(a): høyst en firedel av lengden)' % (P['t'], LOA - xx(L['masthead'])))
        sh = yz(L['port']) - hull
        say(sh <= 0.75 * mh + 1e-6, '%s: sidelanternene %.1f m over skroget, høyst 3/4 av topplanterna (2(g))' % (P['t'], sh))
        say(xx(L['port']) <= xx(L['masthead']) + 1e-6, '%s: sidelanternene ikke forut for den forre topplanterna (3(b))' % P['t'])
        say(abs(L['port'][0][0] + L['stbd'][0][0]) < 1e-6 and L['port'][0][0] < 0, '%s: rød om babord, grønn om styrbord' % P['t'])
        # the RIB in its bay: clear of the house's side and inside the deck's edge
        RL, RB = RIB[k]; yb = abs(BAY[2]); e = hbz((BAY[0] + BAY[1]) / 2, BAY[3]) - 0.1
        say(yb + RB / 2 + 0.28 <= e + 0.4, '%s: lettbåten (%.1f × %.1f m) står innenfor skutesiden (ytterkant %.2f, siden %.2f)' % (P['t'], RL, RB, yb + RB / 2 + 0.28, e))
        say(BAY[1] - BAY[0] >= RL + 0.3, '%s: vugga er lang nok for lettbåten (%.1f m mot %.1f)' % (P['t'], BAY[1] - BAY[0], RL))
    use(was); lights_place()
    return ok


SHOTS = lambda: [('side', (XM, -3.4 * LOA, WL + 4), (XM, 0, WL + 4), 50), ('bow3q', (LOA * 1.35, -LOA * 0.85, WL + 10), (XM, 0, WL + 3), 50),
                 ('stern3q', (-LOA * 0.5, LOA * 0.7, WL + 14), (XM, 0, WL + 3), 50)]

def export_one(k, export, dry):
    use(k); reset(); MATS.clear(); colours()
    solids, glass = build(True)
    join(solids, 'BOAT0')
    if glass: join(glass, 'GLASS0')
    if 'fast' not in sys.argv: beauty(OUT, P['t'], WL, SHOTS())
    if export:
        ex = {'frame': 'kystfiske: x starboard, y up from the waterline, z aft; metres', 'type': P['t'], 'name': P['name'], 'len': LOA, 'beam': BM, 'draft': P.get('Tmax', WL), 'anchors': anchors()}
        more = [{'name': 'rib', 'obj': rib_part, 'xf_p': rib_game, 'xf_n': to_game_n, 'ao': True}] if k == '90' else None
        export_boat(build, to_game, to_game_n, OUT, 'kv%s.glb' % k, os.path.join(ROOT, 'src', 'data', 'boat-kv%s.b64' % k), ex, side=None, dry=dry, more=more)

# the critique loop's shots (tools/boats/qa/shots.py) build the ship KV_SHIP names; its fore and aft views are for a boat of a few metres,
# so the ships have their own (CLOSE: name, camera, target, lens or ('o', ortho), water, night)
use(SHIP); lights_place()
CLOSE = [('c_fore', (XF + 80, 0, WL + 4), (XM, 0, WL + 4), ('o', BM * 2.2), True, False), ('c_aft', (-80, 0, WL + 4), (XM, 0, WL + 4), ('o', BM * 2.2), True, False),
         ('c_bridge', (BR[1] + 14, -14, BR[3] + 4), ((BR[0] + BR[1]) / 2, 0, BR[3] + 1), 35, True, False),
         ('c_bay', ((BAY[0] + BAY[1]) / 2 + 2, -(HB + 12), BAY[3] + 5), ((BAY[0] + BAY[1]) / 2, -HB + 2, BAY[3] + 1), 35, True, False),
         ('c_K6p', (XM + 3.3 * LOA * 0.79, 3.3 * LOA * 0.62, WL + 3), (XM, 0, WL + 0.9), 100, True, True),
         ('c_K7', (XM + 0.55 * LOA, -0.45 * LOA, WL + 0.55 * LOA), (XM, 0, WL), 50, True, False)]

def main():
    os.makedirs(OUT, exist_ok=True)
    if 'check' in sys.argv: sys.exit(0 if check() else 1)
    if not check(): print('check() har feil')
    for k in ([SHIP] if 'one' in sys.argv else ['47', '90']):
        export_one(k, 'export' in sys.argv or 'dry' in sys.argv, 'dry' in sys.argv)

if __name__ == '__main__':
    main()
