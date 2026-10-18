"""The 31 ft fibreglass sjark (plastsjark), a 9.45 m displacement coastal fishing boat of the kind that became the standard Norwegian
sjark from the late 1970s on (the Viksund 31 Sjark, «den første moderne sjarkmodellen»; the make is only named here, CLAUDE.md): the
wheelhouse aft, a clear working deck amidships with the hold hatch and the hauler's place at the starboard rail, a low cabin trunk forward
with two berths, a full keel and a slow diesel. Built in Blender (B1–B22 in docs/batplan.md del 10) after the published measures of the
type, read 17.10.2026 (no drawing is in the repository): length over all 9.26–9.45 m and beam 3.05–3.30 m in the registers and the
used-boat listings (finn.no 410602365, 342334894, 16205596), draft 1.2–1.5 m by the load (yachtdatabase.com, Viksund Sjark 31), hull
depth 1.0–1.35 m, weight 5–6 t as a working boat, engines 68–120 hp (a Sabb 100 hp on the later ones, erlingjensen.net), 8 knots. The
game's boat: 9.45 x 3.30 m, 1.35 m draft, 100 hp, built 1992.

What I chose myself where the sources say nothing: the exact sheer and the sections, the window count, white gelcoat with a navy sheer
stripe and a black boot top, a cream wheelhouse, a green deck. Exterior only.

    pip install bpy==4.5.4
    python3 tools/boats/plast31.py            -> src/data/boat-plast31.b64 (+ the side picture), renders in tools/boats/out/
    python3 tools/boats/plast31.py fast dry   -> no renders to look at, and the GLB only in tools/boats/out

Frame: x forward from the transom, y to port, z up from the bottom of the keel; the waterline is z = 1.35."""
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy
from mathutils import noise
from bpyutil import *

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE)); OUT = os.path.join(HERE, 'out')
WL = 1.35; XA = 0.0; XF = 9.45; XM = (XA + XF) / 2; HB = 1.65
BW_H = 0.55                 # the bulwark: the deck lies this far under the sheer
WX0, WX1, WY = 0.95, 3.75, 1.28     # the wheelhouse aft: its aft and forward walls, its half width
CX0, CX1 = 6.4, 8.55        # the cabin trunk forward: its aft face and where its front has sloped down to the foredeck
STRIPE = (0.26, 0.14)       # the navy sheer stripe: from this far under the sheer to this far under it
Z_BOOT = (WL - 0.02, WL + 0.1)


# ---------- lines (metres) ----------
# the keel line: a deep heel aft by the propeller, nearly flat along the body, a round forefoot and a stem raked about 15 degrees
KEEL = [(XA, 0.95), (0.5, 0.55), (1.2, 0.12), (2.5, 0.0), (5.0, 0.03), (6.5, 0.1), (7.5, 0.22), (8.2, 0.45), (8.7, 0.85), (9.0, 1.35), (9.2, 1.95), (9.35, 2.5), (XF, 2.98)]
# the sections' fullness along the boat (the superellipse's exponent in curve): a round bilge amidships, nearer a straight V towards the bow
QS = [(XA, 2.2), (1.5, 2.4), (4.0, 2.5), (6.0, 2.3), (7.3, 1.9), (8.2, 1.55), (8.8, 1.3), (9.2, 1.15), (XF, 1.1)]
SHEER = [(XA, 2.45), (2.0, 2.42), (4.0, 2.45), (6.0, 2.55), (7.5, 2.7), (8.7, 2.86), (XF, 2.98)]
BS = [(XA, 1.42), (1.0, 1.55), (3.0, 1.65), (5.0, 1.65), (6.5, 1.56), (7.5, 1.36), (8.3, 1.02), (8.9, 0.6), (9.25, 0.25), (XF, 0.0)]
def z_keel(x): return interp(KEEL, x)
def z_sheer(x): return interp(SHEER, x)
def b_sheer(x): return interp(BS, x)
def z_deck(x): return z_sheer(x) - BW_H
def x_tr(z): return -0.1 * max(0.0, (z - WL)) / 1.1        # the transom leans aft a little above the water

def catmull(P, n=10):
    out = [P[0]]; Q = [P[0]] + P + [P[-1]]
    for i in range(1, len(Q) - 2):
        p0, p1, p2, p3 = Q[i - 1], Q[i], Q[i + 1], Q[i + 2]
        for k in range(1, n + 1):
            t = k / n; t2, t3 = t * t, t * t * t
            out.append(tuple(0.5 * (2 * p1[c] + (-p0[c] + p2[c]) * t + (2 * p0[c] - 5 * p1[c] + 4 * p2[c] - p3[c]) * t2 + (-p0[c] + 3 * p1[c] - 3 * p2[c] + p3[c]) * t3) for c in (0, 1)))
    return out

_CV = {}
def curve(x):
    """the section as (y, z) from the keel to the sheer: a superellipse, flat at the keel and upright at the sheer, round-bilged amidships
    (q about 2.4) and nearer a straight V towards the bow (q towards 1.1). One formula for every station, so the bow fairs without a
    knuckle (18.10.2026: the earlier two-family sections gave a crease and flat facets at the forefoot)"""
    k = round(x, 4)
    if k in _CV: return _CV[k]
    zk, zs, Bs, q = z_keel(x), z_sheer(x), b_sheer(x), interp(QS, x); n = 16
    P = [(Bs * (1 - (1 - i / n) ** q) ** (1 / q), zk + (zs - zk) * i / n) for i in range(n + 1)]
    _CV[k] = P; return P

def y_at(x, z):
    c = curve(x)
    if z <= c[0][1]: return 0.0
    for a, b in zip(c, c[1:]):
        if a[1] <= z <= b[1]: t = (z - a[1]) / max(1e-9, b[1] - a[1]); return a[0] + (b[0] - a[0]) * t
    return c[-1][0]


# ---------- colours and the paint zones (B14): 1 the hull, 2 the sheer stripe, 3 the house and the trunk, 4 the decks ----------
C = {}
def colours():
    C['af'] = mat('antifouling', (0.55, 0.12, 0.08), 0.15)
    C['boot'] = mat('boot', (0.06, 0.06, 0.07), 0.45)
    C['hull'] = mat('plwhite', (0.93, 0.93, 0.9), 0.6, zone=1)
    C['stripe'] = mat('stripe', (0.08, 0.14, 0.32), 0.55, zone=2)
    C['white'] = mat('house', (0.93, 0.92, 0.86), 0.5, zone=3)
    C['roof'] = mat('roof', (0.86, 0.86, 0.82), 0.3, zone=3)
    C['inner'] = mat('inner', (0.86, 0.86, 0.82), 0.3)
    C['deck'] = mat('deck', (0.42, 0.5, 0.45), 0.12, zone=4)
    C['steel'] = mat('steel', (0.7, 0.72, 0.74), 0.8, metal=0.75)
    C['dark'] = mat('dark', (0.11, 0.12, 0.13), 0.25)
    C['black'] = mat('black', (0.05, 0.05, 0.06), 0.4)
    C['glass'] = mat('glass', (0.06, 0.09, 0.12), 0.95)
    C['prop'] = mat('bronze', (0.70, 0.52, 0.27), 0.8, metal=0.9)
    C['wood'] = mat('wood', (0.6, 0.4, 0.22), 0.4)
    C['rubber'] = mat('rubber', (0.1, 0.1, 0.11), 0.2); C['buoy'] = mat('buoy', (0.95, 0.45, 0.1), 0.3); C['buoyW'] = mat('buoyW', (0.93, 0.93, 0.9), 0.3)
    C['red'] = mat('red', (0.75, 0.1, 0.08), 0.4); C['seat'] = mat('seat', (0.16, 0.17, 0.2), 0.3); C['screen'] = mat('screen', (0.06, 0.1, 0.14), 0.8)
    C['lampR'] = mat('lampR', (0.85, 0.08, 0.06), 0.7); C['lampG'] = mat('lampG', (0.08, 0.75, 0.3), 0.7); C['lampW'] = mat('lampW', (0.95, 0.93, 0.85), 0.7)
    C['blue'] = mat('tub', (0.1, 0.36, 0.64), 0.45)


# ---------- the hull ----------
def levels(x, fine):
    """the heights of a section's points and the material from each to the next: the bottom, the boot top, the white, the stripe, the white cap"""
    zk, zs = z_keel(x), z_sheer(x); cl = lambda z: min(zs, max(zk, z))
    nb = 10 if fine else 3; out = []
    zb = cl(Z_BOOT[0])
    for k in range(nb): u = k / nb; out.append((cl(zk + (zb - zk) * (1 - math.cos(u * math.pi / 2))), 'af'))
    out.append((zb, 'boot')); zt = cl(Z_BOOT[1])
    z1 = cl(zs - STRIPE[0]); nw = 5 if fine else 1
    for k in range(nw): out.append((zt + (z1 - zt) * k / nw, 'hull'))
    out.append((z1, 'stripe')); out.append((cl(zs - STRIPE[1]), 'hull')); out.append((zs, None))
    return out

def hull_rows(sg, fine=True):
    xs = ([0.0, 0.04, 0.1, 0.2, 0.35, 0.55, 0.8] + [1.0 + 0.25 * i for i in range(30)] + [8.5 + 0.08 * i for i in range(11)]) if fine else [0.0, 0.2, 0.7, 1.8, 4.0, 6.2, 7.5, 8.4, 9.0]
    xs = sorted(set(round(v, 4) for v in xs if v < XF - 0.015) | {XF - 0.015})
    rows, mats = [], None
    for x in xs:
        L = levels(x, fine)
        rows.append([((x_tr(z) if x < 0.01 else x), sg * y_at(x, z), z) for z, _ in L]); mats = [m for _, m in L]
    return rows, mats

def build_hull(fine=True):
    objs = []; first = {}
    for sg, nm in ((1, 'p'), (-1, 's')):
        rows, mats = hull_rows(sg, fine); first[sg] = rows[0]
        objs.append(grid('hull_' + nm, rows, lambda i, j, m=mats: C[m[j] or 'hull'], angle=24, out=lambda c: (0, c.y, min(c.z, 1.6) - 1.6)))
    T = [[q, p] for p, q in zip(first[1], first[-1])]
    objs.append(grid('transom', T, lambda i, j, m=mats: C[m[i] or 'hull'], angle=20, out=lambda c: (-1, 0, 0.1)))
    return objs


# ---------- wear (B16): a boat of 1992; a grime line over the boot top, streaks under the scuppers, chalky gelcoat, slime on the bottom ----------
def n3(x, y, z=0.0): return noise.noise(Vector((x, y, z)))
def ss(a, b, x):
    t = max(0.0, min(1.0, (x - a) / (b - a) if b != a else 0.0)); return t * t * (3 - 2 * t)
def toward(m, rgb, k):
    base = m['rgb']; return [1 + (rgb[i] / max(base[i], 1e-3) - 1) * k for i in range(3)]

def wear(p, m, n):
    x, y, z = p; nm = m.name if m else ''; side = 1 if y > 0 else -1
    if nm == 'plwhite':
        g = 1 - 0.14 * ss(0.35, 0.0, z - Z_BOOT[1])
        g *= 1 - 0.09 * ss(0.3, 0.7, n3(x * 8.0, side * 2.3, 0.4)) * ss(0.7, 0.0, z_sheer(x) - z)
        t = toward(m, (0.86, 0.84, 0.74), 0.25 * ss(0.2, 0.7, n3(x * 1.7, z * 2.0, side)))
        return [t[0] * g, t[1] * g, t[2] * g]
    if nm == 'antifouling':
        v = 0.84 + 0.26 * n3(x * 2.5, z * 6.0, y * 2.0); return [v, v * 1.02, v * 0.98]
    if nm in ('house', 'inner'):
        return toward(m, (0.45, 0.28, 0.14), 0.3 * ss(0.55, 0.9, n3(x * 7.0, y * 7.0, z * 7.0 + 0.5)))
    return None

def tint_obj(o, fn):
    me = o.data; lay = me.color_attributes.get('TINT') or me.color_attributes.new('TINT', 'FLOAT_COLOR', 'CORNER')
    for poly in me.polygons:
        m = me.materials[poly.material_index] if me.materials else None
        for li in poly.loop_indices:
            t = fn(me.vertices[me.loops[li].vertex_index].co, m, poly.normal)
            lay.data[li].color = (t[0], t[1], t[2], 1.0) if t else (1.0, 1.0, 1.0, 1.0)


# ---------- doors (B4): a frame with jambs and a head, a steel sill, the leaf with a porthole and a handle ----------
def door(A, axis, at, u0, u1, z0, h, face=1, hinge=1, leaf=None):
    w = C['white']; lo, hi = min(u0, u1), max(u0, u1); f = face; lm = leaf or w
    def B(a0, a1, u_0, u_1, z_0, z_1, m):
        if axis == 'x': abox(A, min(a0, a1), max(a0, a1), u_0, u_1, z_0, z_1, m)
        else: abox(A, u_0, u_1, min(a0, a1), max(a0, a1), z_0, z_1, m)
    B(at - 0.02 * f, at + 0.06 * f, lo - 0.05, lo, z0, z0 + h + 0.08, w); B(at - 0.02 * f, at + 0.06 * f, hi, hi + 0.05, z0, z0 + h + 0.08, w)
    B(at - 0.02 * f, at + 0.06 * f, lo - 0.05, hi + 0.05, z0 + h, z0 + h + 0.08, w)
    B(at - 0.02 * f, at + 0.07 * f, lo - 0.05, hi + 0.05, z0, z0 + 0.12, C['steel'])
    B(at + 0.005 * f, at + 0.045 * f, lo + 0.01, hi - 0.01, z0 + 0.12, z0 + h - 0.01, lm)
    # the porthole and the handle sit by the door's own height (a low companionway door gets them low too, not floating over the trunk)
    cu = (lo + hi) / 2; zp = z0 + 0.65 * h; zh = z0 + 0.5 * h; rp = min(0.175, 0.2 * h)
    B(at + 0.045 * f, at + 0.055 * f, cu - 0.15, cu + 0.15, zp - rp, zp + rp, C['dark'])
    B(at + 0.055 * f, at + 0.06 * f, cu - 0.12, cu + 0.12, zp - rp + 0.03, zp + rp - 0.03, C['glass'])
    hu = lo + 0.12 if hinge > 0 else hi - 0.12
    B(at + 0.06 * f, at + 0.09 * f, hu - 0.012, hu + 0.012, zh - 0.06, zh + 0.06, C['steel'])


# ---------- the decks, the bulwarks, the cabin trunk forward, the wheelhouse aft ----------
def cabin_w(x):
    """the trunk's half width: full aft, narrowing with the hull forward"""
    return min(1.05, b_sheer(x) - 0.42) * (1.0 if x < 8.1 else max(0.0, 1 - ((x - 8.1) / (CX1 - 8.1)) ** 2) ** 0.5)
def z_trunk(x):
    """the trunk's top at its side: 0.78 over the deck, sloping down over the last 0.9 m to the foredeck"""
    zt = z_deck(x) + 0.78
    return zt if x < CX1 - 0.9 else zt - 0.78 * ((x - (CX1 - 0.9)) / 0.9) ** 1.6

def decks(fine=True):
    A = Acc('decks'); G = Acc('glass'); step = 0.2 if fine else 0.8
    xs = sorted(set([XA + 0.05] + [XA + 0.05 + step * k for k in range(1, int(XF / step) + 2) if XA + 0.05 + step * k < XF - 0.2] + [WX0, WX1, CX0, CX1, XF - 0.2]))
    for x0, x1 in zip(xs, xs[1:]):
        za, zb = z_deck(x0), z_deck(x1); ya, yb = y_at(x0, za) - 0.05, y_at(x1, zb) - 0.05
        sa, sb = z_sheer(x0), z_sheer(x1); ea, eb = y_at(x0, sa) - 0.06, y_at(x1, sb) - 0.06
        inT = x0 >= CX0 - 1e-6 and x1 <= CX1 + 1e-6
        if inT:
            wa, wb = cabin_w(x0), cabin_w(x1); ta, tb = z_trunk(x0), z_trunk(x1)
            for sg in (1, -1): A.poly([(x0, sg * wa, za), (x1, sg * wb, zb), (x1, sg * yb, zb), (x0, sg * ya, za)], C['deck'], (0, 0, 1))      # the side decks
            for sg in (1, -1):                                                                                                               # the trunk's sides, leaning in
                A.poly([(x0, sg * wa, za), (x1, sg * wb, zb), (x1, sg * max(0.0, wb - 0.05), tb), (x0, sg * max(0.0, wa - 0.05), ta)], C['white'], (0, sg, 0.12))
                A.poly([(x0, sg * max(0.0, wa - 0.05), ta), (x1, sg * max(0.0, wb - 0.05), tb), (x1, 0, tb + 0.05), (x0, 0, ta + 0.05)], C['roof'], (0, 0, 1))   # the cambered top
        else:
            A.poly([(x0, -ya, za), (x1, -yb, zb), (x1, yb, zb), (x0, ya, za)], C['deck'], (0, 0, 1))
        for sg in (1, -1):                                                                                                                   # the bulwark inside and its cap
            A.poly([(x0, sg * ya, za), (x1, sg * yb, zb), (x1, sg * eb, sb), (x0, sg * ea, sa)], C['inner'], (0, -sg, 0))
            A.poly([(x0, sg * ea, sa), (x1, sg * eb, sb), (x1, sg * (eb + 0.08), sb + 0.012), (x0, sg * (ea + 0.08), sa + 0.012)], C['inner'], (0, 0, 1))
    y = y_at(XA + 0.05, z_deck(XA)) - 0.05; e = y_at(XA + 0.05, z_sheer(XA)) - 0.06
    A.poly([(XA + 0.05, -y, z_deck(XA)), (XA + 0.05, y, z_deck(XA)), (XA + 0.05, e, z_sheer(XA)), (XA + 0.05, -e, z_sheer(XA))], C['inner'], (1, 0, 0))
    # the trunk's aft face with the companionway door on the centre line, two portholes a side, the hatch on top
    za, wa, ta = z_deck(CX0), cabin_w(CX0), z_trunk(CX0)
    A.poly([(CX0, -wa, za), (CX0, wa, za), (CX0, wa - 0.05, ta), (CX0, -wa + 0.05, ta), (CX0, 0, ta + 0.05)], C['white'], (-1, 0, 0))
    door(A, 'x', CX0, -0.3, 0.32, za, 0.72, face=-1, hinge=+1, leaf=C['wood'])
    for sg in (1, -1):
        for x in (7.0, 7.7):
            yy = sg * (cabin_w(x) - 0.012); zz = z_deck(x) + 0.42
            acyl(A, (x, yy, zz), (x, yy + sg * 0.03, zz), 0.17, lambda z: C['steel'], seg=14); acyl(A, (x, yy + sg * 0.03, zz), (x, yy + sg * 0.035, zz), 0.13, lambda z: C['glass'], seg=14)
    abox(A, 7.0, 7.55, -0.3, 0.3, z_trunk(7.2) + 0.05, z_trunk(7.2) + 0.12, C['white']); A.poly([(7.05, -0.25, z_trunk(7.2) + 0.121), (7.5, -0.25, z_trunk(7.2) + 0.121), (7.5, 0.25, z_trunk(7.2) + 0.121), (7.05, 0.25, z_trunk(7.2) + 0.121)], C['glass'], (0, 0, 1))
    # freeing ports along the working deck's bulwarks, the hold hatch with its coaming and lid
    for x in (4.2, 5.4):
        for sg in (1, -1):
            yy = sg * (y_at(x, z_deck(x) + 0.12) + 0.012); A.poly([(x, yy, z_deck(x) + 0.03), (x + 0.4, yy, z_deck(x) + 0.03), (x + 0.4, yy, z_deck(x) + 0.2), (x, yy, z_deck(x) + 0.2)], C['dark'], (0, sg, 0))
    zd = z_deck(5.0); abox(A, 4.4, 5.6, -0.62, 0.62, zd, zd + 0.14, C['white']); abox(A, 4.36, 5.64, -0.66, 0.66, zd + 0.14, zd + 0.19, C['inner'])
    return [A.done(26)], [G.done(26)]


def wheelhouse(fine=True):
    A = Acc('house'); G = Acc('glass'); w = C['white']
    z0 = z_deck(2.3); zs, zh, zr = z0 + 0.95, z0 + 1.72, z0 + 1.98
    lean = 0.14                                                   # the front leans forward from the sill up
    def fx(z): return WX1 + lean * max(0.0, (z - zs)) / (zr - zs)
    # the walls (Jonas 18.10.2026: the door stood through the front windows): the sides to the sill and over the windows, small chamfers at
    # the front corners, the front with two leaning window panes to starboard of the centre and an upright, solid door section to port (the
    # helmsman stands to starboard, the door beside the windows, as on the type), the aft wall with a window
    DY0, DY1 = 0.30, 1.03                                         # the door section of the front wall; the leaf sits at 0.34–0.98
    oc = [(WX0, -WY), (WX1 - 0.25, -WY), (WX1, -1.03), (WX1, -0.37), (WX1, DY0), (WX1, DY1), (WX1 - 0.25, WY), (WX0, WY)]
    KIND = ['side', 'glass', 'glass', 'glass', 'door', 'door', 'side', 'aft']
    def pt(p, z, k='glass'): return (p[0] + (lean * max(0.0, z - zs) / (zr - zs) if k == 'glass' and p[0] > WX1 - 0.26 else 0.0), p[1], z)
    for i in range(len(oc)):
        a, b = oc[i], oc[(i + 1) % len(oc)]; k = KIND[i]; nrm = (b[1] - a[1], -(b[0] - a[0]), 0)
        if k == 'door':                                               # upright and solid from the deck to the roof; the door is drawn on it below
            A.poly([(a[0], a[1], z0), (b[0], b[1], z0), (b[0], b[1], zr), (a[0], a[1], zr)], w, nrm); continue
        A.poly([pt(a, z0, k), pt(b, z0, k), pt(b, zs, k), pt(a, zs, k)], w, nrm); A.poly([pt(a, zh, k), pt(b, zh, k), pt(b, zr, k), pt(a, zr, k)], w, nrm)
        if k == 'aft':                                                # the aft wall: a window in the middle, solid at the sides
            A.poly([(WX0, -WY, zs), (WX0, -0.5, zs), (WX0, -0.5, zh), (WX0, -WY, zh)], w, nrm); A.poly([(WX0, 0.5, zs), (WX0, WY, zs), (WX0, WY, zh), (WX0, 0.5, zh)], w, nrm)
            G.poly([(WX0 - 0.005, -0.5, zs + 0.04), (WX0 - 0.005, 0.5, zs + 0.04), (WX0 - 0.005, 0.5, zh - 0.04), (WX0 - 0.005, -0.5, zh - 0.04)], C['glass'], nrm)
            abox(A, WX0 - 0.03, WX0 + 0.02, -0.55, -0.5, zs, zh, C['dark']); abox(A, WX0 - 0.03, WX0 + 0.02, 0.5, 0.55, zs, zh, C['dark']); continue
        if k == 'side':                                               # the sides: two windows each, a mullion between, solid aft of them
            segs = [(WX1 - 1.3, WX1 - 0.4), (WX1 - 2.3, WX1 - 1.42)]          # the same two panes on both sides, forward of the solid part aft
            sg = 1 if i == 6 else -1; y = sg * WY
            A.poly([(WX0, y, zs), (WX1 - 0.25, y, zs), (WX1 - 0.25, y, zh), (WX0, y, zh)], w, (0, sg, 0))
            for xa, xb in segs: G.poly([(min(xa, xb), y + sg * 0.004, zs + 0.04), (max(xa, xb), y + sg * 0.004, zs + 0.04), (max(xa, xb), y + sg * 0.004, zh - 0.04), (min(xa, xb), y + sg * 0.004, zh - 0.04)], C['glass'], (0, sg, 0))
            for xa, xb in segs: abox(A, min(xa, xb) - 0.03, max(xa, xb) + 0.03, min(y, y + sg * 0.012), max(y, y + sg * 0.012), zs, zs + 0.04, C['dark']); abox(A, min(xa, xb) - 0.03, max(xa, xb) + 0.03, min(y, y + sg * 0.012), max(y, y + sg * 0.012), zh - 0.04, zh, C['dark'])
            continue
        G.poly([pt(a, zs + 0.04), pt(b, zs + 0.04), pt(b, zh - 0.04), pt(a, zh - 0.04)], C['glass'], nrm)   # the front panes
        beam(A, pt(a, zs), pt(a, zh), 0.06, 0.06, C['dark']); beam(A, pt(b, zs), pt(b, zh), 0.06, 0.06, C['dark'])
    abox(A, WX1 - 0.02, WX1 + lean + 0.02, DY0 - 0.03, DY0 + 0.03, z0, zr, w)             # the post between the leaning panes and the upright door section
    io = [(x + (0.1 if x == WX0 else -0.1), y * 0.93) for x, y in oc]                          # the inside, dark
    for i in range(len(io)):
        a, b = io[i], io[(i + 1) % len(io)]; A.poly([(a[0], a[1], z0), (b[0], b[1], z0), (b[0], b[1], zr), (a[0], a[1], zr)], C['dark'], (-(b[1] - a[1]), b[0] - a[0], 0))
    door(A, 'x', WX1, 0.34, 0.98, z0, 1.85, face=+1, hinge=1)                                # the door forward to port, out onto the working deck
    # the roof with its lip and the visor, a rail aft, the side lights on its forward corners
    ro = [(WX0 - 0.12, -WY - 0.1), (WX1 - 0.2, -WY - 0.1), (WX1 + lean + 0.2, -1.05), (WX1 + lean + 0.2, 1.05), (WX1 - 0.2, WY + 0.1), (WX0 - 0.12, WY + 0.1)]
    A.poly([(x, y, zr) for x, y in ro], C['inner'], (0, 0, -1)); A.poly([(x, y, zr + 0.1) for x, y in ro], C['roof'], (0, 0, 1))
    for i in range(len(ro)):
        a, b = ro[i], ro[(i + 1) % len(ro)]; A.poly([(a[0], a[1], zr), (b[0], b[1], zr), (b[0], b[1], zr + 0.1), (a[0], a[1], zr + 0.1)], w, (b[1] - a[1], -(b[0] - a[0]), 0))
    if fine:
        for x, y in ((WX0 - 0.05, -WY), (WX0 - 0.05, WY), (WX0 + 1.2, -WY), (WX0 + 1.2, WY)): acyl(A, (x, y, zr + 0.1), (x, y, zr + 0.6), 0.016, lambda z: C['steel'], seg=5)
        for y in (-WY, WY): acyl(A, (WX0 - 0.05, y, zr + 0.6), (WX0 + 1.2, y, zr + 0.6), 0.018, lambda z: C['steel'], seg=5, cap=False)
        acyl(A, (WX0 - 0.05, -WY, zr + 0.6), (WX0 - 0.05, WY, zr + 0.6), 0.018, lambda z: C['steel'], seg=5, cap=False)
    for sg in (1, -1):
        y0 = sg * (WY + 0.1); abox(A, WX1 - 0.55, WX1 - 0.3, min(y0, y0 + sg * 0.09), max(y0, y0 + sg * 0.09), zr - 0.26, zr - 0.06, C['black'])
        y1 = y0 + sg * 0.09; abox(A, WX1 - 0.52, WX1 - 0.33, min(y1, y1 + sg * 0.015), max(y1, y1 + sg * 0.015), zr - 0.23, zr - 0.09, C['lampR' if sg > 0 else 'lampG'])
    # the mast on the roof aft with the radar, the all-round white at its head, antennas; the exhaust beside it; the floodlight forward
    mx = WX0 + 0.55
    acyl(A, (mx, 0.0, zr + 0.1), (mx, 0.0, zr + 2.6), 0.045, lambda z: w, seg=8); abox(A, mx - 0.04, mx + 0.04, -0.4, 0.4, zr + 1.75, zr + 1.8, w)
    acyl(A, (mx + 0.25, 0.0, zr + 1.0), (mx + 0.25, 0.0, zr + 1.12), 0.26, lambda z: w, seg=14, r1=0.22); abox(A, mx, mx + 0.3, -0.05, 0.05, zr + 0.95, zr + 1.0, w)
    acyl(A, (mx, 0.0, zr + 2.6), (mx, 0.0, zr + 2.76), 0.06, lambda z: C['lampW'], seg=10); acyl(A, (mx, 0.0, zr + 2.76), (mx, 0.0, zr + 2.8), 0.07, lambda z: C['dark'], seg=10)
    for y in (-0.38, 0.38): acyl(A, (mx, y, zr + 1.8), (mx, y, zr + 3.2), 0.01, lambda z: w, seg=4)
    acyl(A, (mx - 0.3, 0.55, zr + 0.1), (mx - 0.3, 0.55, zr + 1.5), 0.06, lambda z: C['black'], seg=8); acyl(A, (mx - 0.3, 0.55, zr + 1.5), (mx - 0.32, 0.55, zr + 1.58), 0.075, lambda z: C['black'], seg=8)
    abox(A, WX1 + lean - 0.02, WX1 + lean + 0.02, -0.02, 0.02, zr + 0.1, zr + 0.3, C['steel']); abox(A, WX1 + lean - 0.08, WX1 + lean + 0.16, -0.09, 0.09, zr + 0.28, zr + 0.43, C['dark'])
    abox(A, WX1 + lean + 0.16, WX1 + lean + 0.17, -0.07, 0.07, zr + 0.3, zr + 0.41, C['lampW'])
    # inside (B5): the console under the front windows, the wheel to starboard, the skipper's seat, a bench to port
    cx = WX1 - 0.12
    abox(A, cx - 0.5, cx, -1.0, 0.22, z0, z0 + 0.88, C['inner'])
    for y0 in (-0.85, -0.3):
        A.poly([(cx - 0.2, y0, z0 + 0.93), (cx - 0.2, y0 + 0.45, z0 + 0.93), (cx - 0.28, y0 + 0.45, z0 + 1.25), (cx - 0.28, y0, z0 + 1.25)], C['screen'], (-1, 0, 0.25))
        abox(A, cx - 0.3, cx - 0.2, y0 - 0.02, y0 + 0.47, z0 + 0.91, z0 + 1.27, C['dark'])
    acyl(A, (cx - 0.5, -0.6, z0 + 0.98), (cx - 0.65, -0.6, z0 + 1.05), 0.03, lambda z: C['steel'], seg=6)
    atorus(A, (cx - 0.67, -0.6, z0 + 1.06), (1, 0, 0.45), 0.2, 0.018, lambda a: C['black'], 16, 6)
    acyl(A, (2.75, -0.6, z0), (2.75, -0.6, z0 + 0.5), 0.05, lambda z: C['steel'], seg=8); abox(A, 2.55, 3.0, -0.83, -0.37, z0 + 0.5, z0 + 0.6, C['seat']); abox(A, 2.5, 2.58, -0.83, -0.37, z0 + 0.6, z0 + 1.1, C['seat'])
    abox(A, WX0 + 0.15, 2.6, 0.7, 1.18, z0 + 0.42, z0 + 0.5, C['seat']); abox(A, WX0 + 0.15, 2.6, 1.1, 1.18, z0 + 0.5, z0 + 0.95, C['seat']); abox(A, WX0 + 0.15, 2.6, 0.7, 1.18, z0, z0 + 0.42, C['inner'])
    # the lifebuoy on the aft wall, the liferaft in its cradle on the roof
    atorus(A, (WX0 - 0.07, -0.9, z0 + 1.3), (1, 0, 0), 0.28, 0.045, lambda a: C['buoyW'] if (a % (math.pi / 2)) < math.pi / 9 else C['buoy'], 18, 6)
    acyl(A, (WX0 + 1.35, 0.72, zr + 0.4), (WX0 + 2.25, 0.72, zr + 0.4), 0.28, lambda z: w, seg=14)
    for x in (WX0 + 1.5, WX0 + 2.1): acyl(A, (x - 0.02, 0.72, zr + 0.4), (x + 0.02, 0.72, zr + 0.4), 0.285, lambda z: C['dark'], seg=14); abox(A, x - 0.05, x + 0.05, 0.4, 1.04, zr + 0.1, zr + 0.17, C['steel'])
    return [A.done(28)], [G.done(28)]


# ---------- the working deck (B6) and the fittings (B3, B7, B9–B11, B13) ----------
TABLE = (4.95, 5.7, -1.5, -0.95)
HX = 5.95                   # the hauler's station on the starboard rail

def fittings(fine=True):
    A = Acc('fit'); s = lambda z: C['steel']
    x0, x1, y0, y1 = TABLE; zt = z_deck(5.3) + 0.9
    abox(A, x0, x1, y0, y1, zt - 0.05, zt, C['steel']); abox(A, x0, x1, y0 - 0.02, y0, zt - 0.05, zt + 0.12, C['steel'])
    for x, y in ((x0 + 0.05, y0 + 0.05), (x1 - 0.05, y0 + 0.05), (x0 + 0.05, y1 - 0.05), (x1 - 0.05, y1 - 0.05)): acyl(A, (x, y, z_deck(x)), (x, y, zt - 0.05), 0.02, s, seg=5)
    for k in range(2): abox(A, 4.3, 4.85, 0.95, 1.45, z_deck(4.6) + 0.3 * k, z_deck(4.6) + 0.3 * k + 0.28, C['inner'])        # fish boxes to port
    # no hauler in the model (Jonas 18.10.2026: no boat carries modelled gear, only the places for it): the hauler the player buys is drawn
    # by the game at the hauler anchor on the starboard rail (HX)
    if fine:
        for x in (0.5, 3.2, 6.1, 8.7):                                                                     # bollards on the cap
            for sg in (1, -1):
                y = sg * (y_at(x, z_sheer(x)) - 0.12); zc = z_sheer(x) + 0.012
                acyl(A, (x, y, zc), (x, y, zc + 0.22), 0.04, s, seg=8); acyl(A, (x - 0.09, y, zc + 0.17), (x + 0.09, y, zc + 0.17), 0.02, s, seg=6)
        for x in (1.6, 3.2):                                                                               # fenders stowed on deck along the bulwark's foot beside the wheelhouse (hung outboard they widen the hull's measure)
            for sg in (1, -1):
                zd = z_deck(x) + 0.1; y = sg * (y_at(x, zd) - 0.17); acyl(A, (x - 0.25, y, zd), (x + 0.25, y, zd), 0.1, lambda z: C['rubber'], seg=10)
        # the pulpit round the bow and the rail along the foredeck's cap, the windlass and the bow roller, a mushroom vent on the trunk
        xs = [8.6 + (XF - 0.08 - 8.6) * k / 8 for k in range(9)]
        for sg in (1, -1):
            pts = [(x, sg * max(0.02, y_at(x, z_sheer(x)) - 0.06), z_sheer(x)) for x in xs]
            for p in pts[::2]: acyl(A, p, (p[0], p[1], p[2] + 0.55), 0.016, s, seg=5)
            for a, b in zip(pts, pts[1:]): acyl(A, (a[0], a[1], a[2] + 0.55), (b[0], b[1], b[2] + 0.55), 0.018, s, seg=5, cap=False)
        abox(A, 8.65, 9.0, -0.22, 0.22, z_deck(8.8), z_deck(8.8) + 0.16, s(0)); acyl(A, (8.82, -0.24, z_deck(8.8) + 0.26), (8.82, 0.24, z_deck(8.8) + 0.26), 0.1, s, seg=10)
        abox(A, 9.15, XF + 0.05, -0.05, 0.05, z_sheer(9.3) - 0.03, z_sheer(9.3) + 0.05, s(0)); acyl(A, (XF - 0.02, -0.04, z_sheer(9.3) + 0.01), (XF - 0.02, 0.04, z_sheer(9.3) + 0.01), 0.03, lambda z: C['dark'], seg=8)
        acyl(A, (6.7, 0.55, z_trunk(6.7) + 0.05), (6.7, 0.55, z_trunk(6.7) + 0.22), 0.04, lambda z: C['white'], seg=8); acyl(A, (6.7, 0.55, z_trunk(6.7) + 0.22), (6.7, 0.55, z_trunk(6.7) + 0.28), 0.08, lambda z: C['white'], seg=10)
        atorus(A, (4.0, 1.3, z_deck(4.0) + 0.04), (0, 0, 1), 0.2, 0.03, lambda a: C['dark'], 14, 5)       # a coiled hose
    # the flag staff at the transom with the stern light beside it
    zt0 = z_sheer(XA); acyl(A, (XA + 0.15, 0.0, zt0 - 0.1), (XA + 0.15, 0.0, zt0 + 1.2), 0.016, lambda z: C['white'], seg=6); abox(A, XA + 0.1, XA + 0.2, -0.04, 0.04, zt0, zt0 + 0.1, s(0))
    acyl(A, (XA + 0.15, 0.45, zt0 + 0.05), (XA + 0.15, 0.45, zt0 + 0.72), 0.014, s, seg=5); acyl(A, (XA + 0.15, 0.45, zt0 + 0.72), (XA + 0.15, 0.45, zt0 + 0.84), 0.035, lambda z: C['lampW'], seg=8)
    acyl(A, (XA + 0.15, 0.45, zt0 + 0.84), (XA + 0.15, 0.45, zt0 + 0.87), 0.042, lambda z: C['dark'], seg=8)
    objs = [A.done(30)]
    # the keel shoe, the propeller in its aperture, the rudder
    xs = [1.0 + (7.4 - 1.0) * k / 12 for k in range(13)]
    top = [(x, z_keel(x) + 0.06) for x in xs]; bot = [(x, z_keel(x) - 0.05) for x in reversed(xs)]
    objs.append(loft_rings('keel', [[(x, sy * 0.07, z) for x, z in top + bot] for sy in (1, -1)], C['af']))
    zc = 0.5
    objs.append(cyl('shaft', (0.55, 0, zc), (1.3, 0, zc + 0.08), 0.03, C['steel'], 8))
    objs.append(cyl('hub', (0.48, 0, zc), (0.66, 0, zc), 0.07, C['prop'], 10, r1=0.05))
    for k in range(3):
        a = 2 * math.pi * k / 3 + 0.3; e = (0, math.cos(a), math.sin(a)); t = (0, -math.sin(a), math.cos(a))
        bl = [(0.57 + 0.05 * f, (0.06 + 0.27 * r) * e[1] + t[1] * w_, zc + (0.06 + 0.27 * r) * e[2] + t[2] * w_)
              for r, w_, f in ((0, -0.06, 0), (0.5, -0.1, 0.4), (1.0, -0.06, 1.0), (1.0, 0.06, 1.0), (0.5, 0.09, -0.4), (0, 0.06, 0))]
        objs.append(loft_rings('blade%d' % k, [[(p[0] - 0.014, p[1], p[2]) for p in bl], [(p[0] + 0.014, p[1], p[2]) for p in bl]], C['prop']))
    rud = [(0.4, z_keel(0.35) + 0.02), (0.02, z_keel(0.02) + 0.02), (-0.04, zc - 0.36), (0.36, zc - 0.36)]
    wr = lambda x: 0.04 * max(0.4, 1 - abs(x - 0.15) / 0.25)
    objs.append(loft_rings('rudder', [[(x, wr(x), z) for x, z in rud], [(x, -wr(x), z) for x, z in rud]], C['af']))
    return [o for o in objs if o]


def build(fine=True):
    hull = build_hull(fine)
    if fine:
        for o in hull: tint_obj(o, wear)
    d, dg = decks(fine); h, hg = wheelhouse(fine)
    solids = hull + d + h + fittings(fine)
    return [s for s in solids if s], [x for x in dg + hg if x]


def to_game(p): return (-p[1], p[2] - WL, -(p[0] - XM))
def to_game_n(n): return (-n[1], n[2], -n[0])

def name_strips(G):
    """where the name is written (B12): on both bows under the sheer stripe, and across the transom"""
    out = []
    for sg, xs in ((1, [8.4 - 1.1 * k / 12 for k in range(13)]), (-1, [7.3 + 1.1 * k / 12 for k in range(13)])):
        B = []; T = []
        for x in xs:
            for arr, dz in ((B, 0.62), (T, 0.34)): z = z_sheer(x) - dz; arr.append(G(x, sg * (y_at(x, z) + 0.03), z))
        out.append([B, T])
    ys = [0.75 - 1.5 * k / 12 for k in range(13)]          # port to starboard: left to right seen from astern
    out.append([[G(x_tr(1.95) - 0.025, y, 1.95) for y in ys], [G(x_tr(2.25) - 0.025, y, 2.25) for y in ys]])
    return out

def anchors():
    G = lambda x, y, z: [round(v, 3) for v in to_game((x, y, z))]
    z0 = z_deck(2.3); zr = z0 + 1.98; x0, x1, y0, y1 = TABLE; hy = -(y_at(HX, z_sheer(HX)) - 0.14)
    return {'eye': G(2.85, -0.6, z0 + 1.55), 'skipperAt': G(2.95, -0.6, z0), 'hp': -0.08, 'fov': 60,
            'crewSpots': [G(5.9, -1.0, z_deck(5.9)) + [1.57], G(4.6, 0.55, z_deck(4.6)) + [0.0], G(5.9, 0.9, z_deck(5.9)) + [0.0], G(4.05, 0.0, z_deck(4.05)) + [3.14]],
            'lights': [[G(WX0 + 0.55, 0, zr + 2.68), [1, 0.95, 0.85], 'allround'], [G(WX1 - 0.42, WY + 0.21, zr - 0.16), [1, 0.12, 0.1], 'port'],
                       [G(WX1 - 0.42, -WY - 0.21, zr - 0.16), [0.1, 1, 0.35], 'stbd'], [G(XA + 0.15, 0.45, z_sheer(XA) + 0.78), [1, 0.95, 0.85], 'stern']],
            # the doors (B4): the wheelhouse door forward to port out onto the working deck (the helm is to starboard), the companionway into the cabin trunk
            'doors': [{'at': G(WX1 + 0.03, 0.66, z0), 'w': 0.64, 'h': 1.85, 'in': G(WX1 - 0.8, 0.66, z0), 'to': 'helm', 'hinge': 'port'},
                      {'at': G(CX0 - 0.03, 0.01, z_deck(CX0)), 'w': 0.62, 'h': 0.72, 'in': G(CX0 + 0.8, 0.0, z_deck(CX0) - 0.5), 'to': 'cabin', 'hinge': 'port'}],
            'names': name_strips(G),
            'work': {'table': G((x0 + x1) / 2, (y0 + y1) / 2, z_deck(5.3)), 'tub': G(4.3, -1.22, z_deck(4.3)), 'own': True, 'top': round(z_deck(5.3) + 0.9 - WL, 3)},
            'hatch': G(5.0, 0.0, z_deck(5.0) + 0.19), 'bunk': G(7.5, 0.5, z_deck(7.5) - 0.1), 'exhaust': G(WX0 + 0.25, 0.55, zr + 1.58),
            # the clear working deck amidships: the hauler at the starboard rail forward, the gear and the catch aft of it
            'deck': {'y': round(z_deck(5.0) - WL, 3), 'z': round(-(5.0 - XM), 3)}, 'gw': round(z_sheer(5.0) - WL, 3),
            'stern': round(XM - XA, 3), 'bow': round(-(XF - XM), 3), 'side': HB, 'beam': 3.3, 'pl': 3.3, 'rl': 1.4, 'open': False, 'hand': False,
            'pole': G(XA + 0.15, 0, z_sheer(XA) + 1.2), 'hauler': G(HX, hy - 0.12, z_sheer(HX) + 0.42), 'filler': G(6.0, HB - 0.2, z_deck(6.0) + 0.12)}


SHOTS = [('bow3q', (17.5, -9.5, 3.6), (4.7, 0, 2.2), 38), ('stern3q', (-7.5, 8.0, 4.2), (4.0, 0, 2.2), 35), ('side', (4.7, 19, 2.4), (4.7, 0, 2.3), 35),
         ('above', (11.0, -7.0, 9.5), (4.5, 0, 2.0), 35), ('deck', (8.5, -4.0, 5.0), (4.8, 0, 2.0), 38), ('stern', (-15.0, 0.5, 3.5), (4.0, 0, 2.3), 30),
         ('helm', (9.0, -5.5, 4.0), (3.0, -0.3, 3.1), 32), ('bow', (15.0, 2.5, 2.8), (6.5, 0, 2.4), 40)]

def main():
    os.makedirs(OUT, exist_ok=True)
    reset(); colours()
    solids, glass = build(True)
    join(solids, 'BOAT0'); join(glass, 'GLASS0')
    if 'fast' not in sys.argv: beauty(OUT, 'pl31', WL, SHOTS)
    ex = {'frame': 'kystfiske: x starboard, y up from the waterline, z aft; metres', 'type': 'plastsjark', 'name': '31 ft fibreglass sjark',
          'len': 9.45, 'beam': 3.3, 'draft': 1.35, 'anchors': anchors()}
    export_boat(build, to_game, to_game_n, OUT, 'plast31.glb', os.path.join(ROOT, 'src', 'data', 'boat-plast31.b64'), ex,
                side=(os.path.join(ROOT, 'src', 'data', 'boat-plast31-side.b64'), 4.7, 1.7, 11.5), dry='dry' in sys.argv)


if __name__ == '__main__':
    main()
