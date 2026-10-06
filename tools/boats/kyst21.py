"""The older coastal vessel (kyst21), a 21 m steel boat from the seventies with a forecastle (bakk), a cruiser stern (rundgatt) and a
gallows (galge), built in Blender after the pictures of old Norwegian coastal boats that Jonas showed on 06.10.2026 (Hindholmen, Erkna).
The game's size stands (21 x 7.2 m, 3.4 m draft); the pictures give the type: the sheer sweeping up to the bow, the white whaleback
over the forecastle, the mast at the forecastle break with its raked legs and the derrick laid aft, the open working deck with the
hatch, the deckhouse aft with the wheelhouse on it, the funnel and the mizzen, and the round stern. Jonas let us choose the colour
(«Skroget trenger ikke være grønt»): an oxblood hull with a white sheer line, a black bottom, a varnished teak wheelhouse on a white
deckhouse, cream masts and derrick. Exterior only (CLAUDE.md).

    pip install bpy==4.5.4
    python3 tools/boats/kyst21.py            -> src/data/boat-kyst21.b64 (+ the side picture), renders in tools/boats/out/
    python3 tools/boats/kyst21.py fast dry   -> no renders to look at, and the GLB only in tools/boats/out

Frame: x forward from the rudder post, y to port, z up from the bottom of the keel aft; the waterline is z = 3.2."""
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy
from bpyutil import *

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE)); OUT = os.path.join(HERE, 'out')
WL = 3.2; XS = -1.6; XF = 19.4; XM = (XS + XF) / 2; HB = 3.6
X_FC = 14.6                 # the forecastle break
X_RUN, X_ENT = 5.0, 10.0    # the body between the stern patch and the bow patch


# ---------- lines (metres) ----------
LOW = [(XS, 0.0), (1.0, 0.0), (6.0, 0.05), (10.0, 0.12), (15.6, 0.35)]
def z_low(x): return interp(LOW, x)
SHEER = [(XS, 5.55), (2.0, 5.25), (8.0, 5.1), (12.0, 5.3), (15.0, 5.8), (17.5, 6.4), (XF, 6.9)]
def z_top(x): return interp(SHEER, x)
# the stem (z, x): a round forefoot, then straight and raked
STEM = [(0.35, 15.6), (0.8, 17.0), (1.6, 17.8), (WL, 18.4), (5.0, 19.0), (6.9, XF)]
def x_stem(z): return interp(STEM, z)
# the cruiser stern (z, x): the hull closes on the sternpost under water and overhangs above it, round in plan
STERN = [(0.0, 1.0), (1.9, 1.0), (2.5, 0.3), (WL, -0.5), (4.2, -1.15), (5.0, -1.45), (5.55, XS)]
def x_sternp(z): return interp(STERN, z)
HBW = [(X_RUN, 3.40), (8.0, 3.45), (X_ENT, 3.40)]
HBD = [(X_RUN, 3.55), (8.0, 3.6), (X_ENT, 3.58)]
NX = [(X_RUN, 2.6), (8.0, 2.8), (X_ENT, 2.7)]


def section_body(x, n=24):
    zl = z_low(x); zt = z_top(x); bw = interp(HBW, x); bd = interp(HBD, x); nn = interp(NX, x); pts = []
    for k in range(n + 1):
        th = (math.pi / 2) * k / n; c = math.cos(th); s = math.sin(th)
        pts.append((bw * (s ** (2 / nn) if s > 0 else 0.0), zl + (WL - zl) * (1 - (c ** (2 / nn) if c > 0 else 0.0))))
    for k in range(1, 9):
        z = WL + (zt - WL) * k / 8; pts.append((bw + (bd - bw) * ((z - WL) / (zt - WL)) ** 0.8, z))
    return pts

def smooth(a, b, z):
    t = max(0.0, min(1.0, (z - a) / (b - a))); return t * t * (3 - 2 * t)

# The ends are patches of rows from the sections at X_RUN and X_ENT to the stern and the stem (as in al45.py): the rows near the
# bottom ride along the keel, those above the waterline follow the sheer up to the ends; the bow closes as y = yk (1 - (1 - s)^p),
# the stern above the water as an ellipse in plan, y = yk sqrt(1 - (1 - s)^2), the round of the cruiser stern.
def end_pt(yk, zk, bow, x=None, s=None):
    x0 = X_ENT if bow else X_RUN
    w = 1 - smooth(0.4, 1.8, zk); v = smooth(WL + 0.2, z_top(x0), zk)
    xe = x_stem if bow else x_sternp
    lift = lambda xx: w * (z_low(xx) - z_low(x0)) + v * (z_top(xx) - z_top(x0))
    xf = xe(zk); xf = xe(zk + lift(xf)); xf = xe(zk + lift(xf))
    if s is None: s = max(0.0, min(1.0, (xf - x) / (xf - x0) if bow else (x - xf) / (x0 - xf)))
    else: x = xf - s * (xf - x0) if bow else xf + s * (x0 - xf)
    z = zk + lift(x)
    if s <= 0: return x, 0.0, z
    if bow: return x, yk * (1 - (1 - s) ** interp([(0.0, 2.0), (WL, 2.6), (6.0, 3.0)], zk)), z
    r = smooth(1.6, WL + 0.4, zk)
    y_run = yk * (1 - (1 - s) ** 1.7); y_round = yk * math.sqrt(max(0.0, 1 - (1 - s) ** 2))
    return x, y_run + (y_round - y_run) * r, z

_SD = {}
def dense(x0):
    if x0 not in _SD: _SD[x0] = resample(section_body(x0, 48), [(None, 120)])
    return _SD[x0]

def section(x, sg=1, n=24):
    if X_RUN <= x <= X_ENT: pts = section_body(x, n)
    elif x > X_ENT: pts = [end_pt(y, z, True, x=x)[1:] for y, z in dense(X_ENT)]
    else: pts = [end_pt(y, z, False, x=x)[1:] for y, z in dense(X_RUN)]
    return [(sg * y, z) for y, z in pts]

def hbz(x, z):
    sec = [(abs(y), zz) for y, zz in section(x, 1)]
    if z <= sec[0][1]: return 0.0
    for a, b in zip(sec, sec[1:]):
        if a[1] <= z <= b[1]: t = (z - a[1]) / max(1e-9, b[1] - a[1]); return a[0] + (b[0] - a[0]) * t
    return sec[-1][0]


# ---------- colours: oxblood, white, teak and cream ----------
C = {}
def colours():
    C['af'] = mat('antifouling', (0.07, 0.07, 0.075), 0.15)
    C['boot'] = mat('boot', (0.05, 0.05, 0.06), 0.5, zone=2)
    C['hull'] = mat('oxblood', (0.34, 0.06, 0.06), 0.55, zone=1)
    C['line'] = mat('sheerline', (0.90, 0.90, 0.88), 0.5)
    C['white'] = mat('white', (0.90, 0.90, 0.88), 0.5)
    C['inner'] = mat('inner', (0.80, 0.80, 0.77), 0.3)
    C['deck'] = mat('deck', (0.36, 0.33, 0.30), 0.12)
    C['teak'] = mat('teak', (0.42, 0.22, 0.10), 0.6)
    C['cream'] = mat('cream', (0.90, 0.80, 0.56), 0.45)
    C['steel'] = mat('steel', (0.62, 0.64, 0.66), 0.75, metal=0.7)
    C['dark'] = mat('dark', (0.09, 0.10, 0.11), 0.25)
    C['black'] = mat('black', (0.05, 0.05, 0.06), 0.35)
    C['red'] = mat('red', (0.70, 0.08, 0.06), 0.45)
    C['glass'] = mat('glass', (0.05, 0.08, 0.11), 0.95)
    C['prop'] = mat('bronze', (0.70, 0.52, 0.27), 0.8, metal=0.9)
    C['orange'] = mat('orange', (0.95, 0.38, 0.06), 0.45)
    C['tarp'] = mat('tarp', (0.20, 0.26, 0.30), 0.2)

NB = lambda fine: (10 if fine else 3, 2, 7 if fine else 2, 1)   # points in the bands: bottom, boot top, side, the sheer line

def cut(sec, zt, fine):
    n0, n1, n2, n3 = NB(fine)
    return resample(sec, [(WL - 0.08, n0), (WL + 0.22, n1), (zt - 0.14, n2), (None, n3)])

def hull_rows(sg, fine=True):
    rows = []; n = 30 if fine else 10
    base = cut(section_body(X_RUN, 48), z_top(X_RUN), fine)
    for i in range(n + 1):
        s = (i / n) ** 2.0      # dense at the stern's end, where the round stern turns fastest
        rows.append([(x, sg * y, z) for x, y, z in (end_pt(yk, zk, False, s=s) for yk, zk in base)])
    for x in ([X_RUN + 0.5 * k for k in range(1, 10)] if fine else [7.5]):
        rows.append([(x, sg * y, z) for y, z in cut([(abs(y), z) for y, z in section(x, sg)], z_top(x), fine)])
    base = cut(section_body(X_ENT, 48), z_top(X_ENT), fine); n = 36 if fine else 10
    for i in range(n + 1):
        s = (1 - i / n) ** 1.4
        rows.append([(x, sg * y, z) for x, y, z in (end_pt(yk, zk, True, s=s) for yk, zk in base)])
    return rows

def band_of(j, fine):
    n0, n1, n2, n3 = NB(fine)
    return C['af'] if j < n0 else C['boot'] if j < n0 + n1 else C['hull'] if j < n0 + n1 + n2 else C['line']

def build_hull(fine=True):
    return [grid('hull_' + nm, hull_rows(sg, fine), lambda i, j: band_of(j, fine), out=lambda c: (0, c.y, min(c.z, 4.0) - 4.0)) for sg, nm in ((1, 'p'), (-1, 's'))]


# ---------- decks: the main deck to the forecastle break, the forecastle with its white whaleback sides ----------
def z_deck(x): return z_top(x) - 0.95
# under the stern's overhang the deck rises to meet the stern where the hull ends below the deck's height
STERN_UP = [(x, z) for z, x in reversed(STERN) if z >= 2.5]
def z_deck_at(x): return max(z_deck(x), interp(STERN_UP, x) + 0.03) if x < 0.3 else z_deck(x)
def z_fb(x): return max(z_top(x), 6.5 + 0.4 * (x - X_FC) / (XF - X_FC))     # the forecastle's bulwark top
def z_fc(x): return z_fb(x) - 0.75                                           # the forecastle deck

def decks(fine=True):
    A = Acc('decks'); step = 0.4 if fine else 1.2
    xs = [XS + 0.06] + [XS + 0.25 + step * k for k in range(int((XF - XS) / step) + 2)]
    xs = sorted(set([x for x in xs if x < XF - 0.35] + [X_FC, XF - 0.35] + ([XS + 0.06 + 0.05 * k for k in range(16)] if fine else [])))
    for x0, x1 in zip(xs, xs[1:]):
        fc = x0 >= X_FC - 1e-6
        za, zb = (z_fc(x0), z_fc(x1)) if fc else (z_deck_at(x0), z_deck_at(x1))
        ta, tb = z_top(x0), z_top(x1)
        ins = lambda x: 0.05 + 0.2 * max(0.0, min(1.0, (0.4 - x) / 2.0))     # kept further in under the round stern
        ya, yb = max(0.0, hbz(x0, za) - ins(x0)), max(0.0, hbz(x1, zb) - ins(x1))
        if ya < 0.05 and yb < 0.05: continue
        A.poly([(x0, -ya, za), (x1, -yb, zb), (x1, yb, zb), (x0, ya, za)], C['deck'], (0, 0, 1))
        for sg in (1, -1):
            ea, eb = hbz(x0, ta), hbz(x1, tb)
            if fc:
                # the whaleback: its inner face follows the flared hull from the deck up to the sheer, then stands upright to the
                # bulwark top (the white plating outside and the capping are a grid of their own, whaleback() below)
                fa, fb = z_fb(x0), z_fb(x1); ma, mb = max(za, ta), max(zb, tb)
                if ma > za + 0.01 or mb > zb + 0.01: A.poly([(x0, sg * ya, za), (x1, sg * yb, zb), (x1, sg * (eb - 0.06), mb), (x0, sg * (ea - 0.06), ma)], C['inner'], (0, -sg, 0))
                A.poly([(x0, sg * (ea - 0.06), ma), (x1, sg * (eb - 0.06), mb), (x1, sg * (eb - 0.06), fb), (x0, sg * (ea - 0.06), fa)], C['inner'], (0, -sg, 0))
            else:
                A.poly([(x0, sg * ya, za), (x1, sg * yb, zb), (x1, sg * (eb - 0.06), tb), (x0, sg * (ea - 0.06), ta)], C['inner'], (0, -sg, 0))
                A.poly([(x0, sg * (ea - 0.06), ta), (x1, sg * (eb - 0.06), tb), (x1, sg * eb, tb + 0.01), (x0, sg * ea, ta + 0.01)], C['line'], (0, 0, 1))
    # the forecastle's aft face over the main deck, following the hull's section up to the forecastle deck, with its door
    zd, zf = z_deck(X_FC), z_fc(X_FC); zs = [zd + (zf - zd) * k / 8 for k in range(9)]
    A.poly([(X_FC, -(hbz(X_FC, z) - 0.04), z) for z in zs] + [(X_FC, hbz(X_FC, z) - 0.04, z) for z in reversed(zs)], C['white'], (-1, 0, 0))
    A.poly([(X_FC - 0.01, 0.4, zd), (X_FC - 0.01, 1.2, zd), (X_FC - 0.01, 1.2, zf - 0.05), (X_FC - 0.01, 0.4, zf - 0.05)], C['dark'], (-1, 0, 0))
    if fine:
        # pipe rails: round the stern, round the forecastle
        for xa, xb, zf in ((XS + 0.1, 3.0, z_top), (X_FC + 0.2, XF - 0.5, z_fb)):
            n = max(3, int((xb - xa) / 0.9)); xs_ = [xa + (xb - xa) * k / n for k in range(n + 1)]
            for sg in (1, -1):
                pts = [(x, sg * (hbz(x, z_top(x)) - 0.04), zf(x)) for x in xs_]
                for p in pts: acyl(A, p, (p[0], p[1], p[2] + 0.85), 0.025, lambda z: C['white'], seg=5)
                for a, b in zip(pts, pts[1:]): acyl(A, (a[0], a[1], a[2] + 0.85), (b[0], b[1], b[2] + 0.85), 0.025, lambda z: C['white'], seg=5, cap=False)
        y = hbz(X_FC + 0.2, z_top(X_FC + 0.2)) - 0.04; zf = z_fc(X_FC)
        for k in range(5): yy = -y + 2 * y * k / 4; acyl(A, (X_FC + 0.05, yy, zf), (X_FC + 0.05, yy, zf + 0.95), 0.025, lambda z: C['white'], seg=5)
        acyl(A, (X_FC + 0.05, -y, zf + 0.95), (X_FC + 0.05, y, zf + 0.95), 0.025, lambda z: C['white'], seg=5, cap=False)
    return [A.done(25)]


def whaleback(fine=True):
    # the white plating of the forecastle from the sheer up to its bulwark top and the capping on it, one strip per side
    xs = [X_FC + (XF - 0.02 - X_FC) * k / (24 if fine else 8) for k in range((24 if fine else 8) + 1)]
    out = []
    for sg, nm in ((1, 'p'), (-1, 's')):
        rows = [[(x, sg * hbz(x, z_top(x)), z_top(x) + (z_fb(x) - z_top(x)) * t) for t in (0.0, 0.5, 1.0)] + [(x, sg * (hbz(x, z_top(x)) - 0.06), z_fb(x))] for x in xs]
        out.append(grid('whaleback_' + nm, rows, lambda i, j: C['white'], out=lambda c, sg=sg: (0, sg, 0)))
    return out


def underwater(fine=True):
    objs = [box('keel', -0.45, 16.0, -0.12, 0.12, -0.2, 0.1, C['af'])]
    objs.append(box('deadwood', 1.0, 4.0, -0.18, 0.18, 0.0, 1.0, C['af']))
    zc = 1.15
    objs.append(cyl('hub', (0.35, 0, zc), (0.95, 0, zc), 0.2, C['prop'], 12, r1=0.15))
    for k in range(4):
        a = 2 * math.pi * k / 4 + 0.5; e = (0, math.cos(a), math.sin(a)); t = (0, -math.sin(a), math.cos(a))
        bl = [(0.55 + 0.12 * f, (0.18 + 0.55 * r) * e[1] + t[1] * w, zc + (0.18 + 0.55 * r) * e[2] + t[2] * w)
              for r, w, f in ((0, -0.14, 0), (0.5, -0.2, 0.4), (1.0, -0.1, 1.0), (1.0, 0.1, 1.0), (0.5, 0.19, -0.4), (0, 0.12, 0))]
        objs.append(loft_rings('blade%d' % k, [[(p[0] - 0.02, p[1], p[2]) for p in bl], [(p[0] + 0.02, p[1], p[2]) for p in bl]], C['prop']))
    rud = [(0.05, 2.45), (-0.85, 2.3), (-0.95, 2.0), (-0.95, 0.0), (-0.85, -0.12), (0.05, -0.12)]
    w = lambda x: 0.09 * max(0.35, 1 - abs(x + 0.45) / 0.6)
    objs.append(loft_rings('rudder', [[(x, w(x), z) for x, z in rud], [(x, -w(x), z) for x, z in rud]], C['af']))
    return objs


# ---------- on deck: the hatch, the mast with its legs and derrick, the gallows; aft the deckhouse, the wheelhouse, funnel, mizzen ----------
DH0, DH1, DHY = 1.0, 7.4, 2.45        # the deckhouse (aft of 1.0 m the round stern is narrower than it)
WX0, WX1, WY = 4.3, 7.2, 1.7          # the wheelhouse on it
def deck_gear(fine=True):
    A = Acc('gear'); G = Acc('glass'); w = C['white']; sg_ = 16 if fine else 8
    zd = z_deck(9.0)
    # the hatch amidships under its tarpaulin, fish boxes beside it
    abox(A, 9.0, 11.4, -1.2, 1.2, zd, zd + 0.5, C['white']); abox(A, 9.05, 11.35, -1.15, 1.15, zd + 0.5, zd + 0.6, C['tarp'])
    for k in range(3): abox(A, 11.9 + 0.62 * k, 12.45 + 0.62 * k, 1.4, 2.1, z_deck(12.5), z_deck(12.5) + 0.35 * (1 + k % 2), C['orange'] if k != 1 else C['steel'])
    # the mast at the forecastle break, its two raked legs from the forecastle deck, the yard, the derrick laid aft and up
    mx = X_FC - 0.5; mz0 = z_deck(mx)
    acyl(A, (mx, 0, mz0), (mx, 0, 13.4), 0.14, lambda z: C['cream'], seg=10, r1=0.08)
    for sg in (1, -1): acyl(A, (X_FC + 1.6, sg * 1.5, z_fc(X_FC + 1.6)), (mx, 0, 9.4), 0.08, lambda z: C['cream'], seg=8)
    abox(A, mx - 0.06, mx + 0.06, -1.3, 1.3, 9.9, 10.0, C['cream'])
    acyl(A, (mx - 0.25, 0, mz0 + 1.0), (8.6, 0.0, 9.6), 0.09, lambda z: C['cream'], seg=8)
    acyl(A, (mx, 0, 13.2), (8.6, 0, 9.6), 0.012, lambda z: C['dark'], seg=4)
    acyl(A, (8.6, 0, 9.6), (8.6, 0, 7.4), 0.012, lambda z: C['dark'], seg=4); abox(A, 8.5, 8.7, -0.1, 0.1, 7.2, 7.4, C['dark'])
    for z in (11.6, 12.6): abox(A, mx - 0.12, mx + 0.12, -0.12, 0.12, z, z + 0.22, C['dark'])
    # the gallows on the starboard side forward of the hatch: a bent pipe frame over the rail with a block
    gx, gy = 12.9, -(hbz(12.9, z_top(12.9)) - 0.3)
    for x in (gx - 0.45, gx + 0.45): acyl(A, (x, gy, z_deck(x)), (x, gy, z_top(x) + 1.55), 0.07, lambda z: C['cream'], seg=8)
    acyl(A, (gx - 0.45, gy, z_top(gx) + 1.55), (gx + 0.45, gy, z_top(gx) + 1.55), 0.07, lambda z: C['cream'], seg=8)
    abox(A, gx - 0.12, gx + 0.12, gy - 0.12, gy + 0.12, z_top(gx) + 1.25, z_top(gx) + 1.5, C['dark'])
    # the deckhouse aft, white with portholes and doors; its roof a boat deck with the rail
    z0 = z_deck(DH0); z1 = z0 + 2.0
    abox(A, DH0, DH1, -DHY, DHY, z0 - 0.1, z1, w)
    abox(A, DH0 - 0.15, DH1 + 0.15, -DHY - 0.15, DHY + 0.15, z1, z1 + 0.1, C['inner'])
    for sg in (1, -1):
        for x in (1.4, 2.9, 5.6): acyl(A, (x, sg * (DHY - 0.02), z0 + 1.35), (x, sg * (DHY + 0.02), z0 + 1.35), 0.18, lambda z: C['glass'], seg=12)
        A.poly([(3.7, sg * (DHY + 0.01), z0), (4.5, sg * (DHY + 0.01), z0), (4.5, sg * (DHY + 0.01), z0 + 1.8), (3.7, sg * (DHY + 0.01), z0 + 1.8)], C['teak'], (0, sg, 0))
        acyl(A, (6.6, sg * (DHY + 0.04), z0 + 1.1), (6.6, sg * (DHY + 0.14), z0 + 1.1), 0.3, lambda z: C['orange'], seg=12)
    if fine:
        for sg in (1, -1): acyl(A, (DH0 - 0.1, sg * (DHY + 0.1), z1 + 0.9), (DH1 + 0.1, sg * (DHY + 0.1), z1 + 0.9), 0.025, lambda z: w, seg=5, cap=False)
        acyl(A, (DH0 - 0.1, -DHY - 0.1, z1 + 0.9), (DH0 - 0.1, DHY + 0.1, z1 + 0.9), 0.025, lambda z: w, seg=5, cap=False)
        for x in (DH0 - 0.1, 2.0, 3.6, DH1 + 0.1):
            for sg in (1, -1): acyl(A, (x, sg * (DHY + 0.1), z1 + 0.1), (x, sg * (DHY + 0.1), z1 + 0.9), 0.025, lambda z: w, seg=5)
    # the wheelhouse in varnished teak, windows all round, a white roof with the radar and searchlight
    zw0, zws, zwh, zwr = z1 + 0.1, z1 + 1.1, z1 + 1.85, z1 + 2.2
    abox(A, WX0, WX1, -WY, WY, zw0, zws, C['teak']); abox(A, WX0, WX1, -WY, WY, zwh, zwr, C['teak'])
    abox(A, WX0, WX0 + 0.1, -WY, WY, zws, zwh, C['teak'])
    for sg in (1, -1):
        for xa in (WX0 + 0.2, WX0 + 1.15, WX0 + 2.1):
            G.poly([(xa, sg * (WY + 0.005), zws), (xa + 0.75, sg * (WY + 0.005), zws), (xa + 0.75, sg * (WY + 0.005), zwh), (xa, sg * (WY + 0.005), zwh)], C['glass'], (0, sg, 0))
        for xa in (WX0 + 0.1, WX0 + 0.95, WX0 + 1.9, WX0 + 2.85, WX1): abox(A, xa - 0.06, xa + 0.06, sg * WY - 0.06, sg * WY + 0.06, zws, zwh, C['teak'])
    for k in range(5):
        ya = -WY + 0.1 + k * (2 * WY - 0.2) / 5
        G.poly([(WX1 + 0.005, ya, zws), (WX1 + 0.005, ya + 0.6, zws), (WX1 + 0.005, ya + 0.6, zwh), (WX1 + 0.005, ya, zwh)], C['glass'], (1, 0, 0))
        abox(A, WX1 - 0.06, WX1 + 0.06, ya - 0.06, ya + 0.02, zws, zwh, C['teak'])
    abox(A, WX0 - 0.15, WX1 + 0.3, -WY - 0.2, WY + 0.2, zwr, zwr + 0.12, w)
    abox(A, 5.4, 5.7, -0.15, 0.15, zwr + 0.12, zwr + 0.55, C['dark']); abox(A, 4.8, 6.3, -0.08, 0.08, zwr + 0.55, zwr + 0.65, C['dark'])
    acyl(A, (6.7, 0.9, zwr + 0.12), (6.7, 0.9, zwr + 0.45), 0.16, lambda z: C['steel'], seg=10)
    for sg in (1, -1): abox(A, 6.4, 6.8, sg * (WY + 0.22) - 0.07, sg * (WY + 0.22) + 0.07, zwr - 0.4, zwr - 0.1, C['dark'])
    # the funnel aft of the wheelhouse: cream with a red band, black top
    acyl(A, (3.5, 0, z1 + 0.1), (3.5, 0, z1 + 2.9), 0.42, lambda z: C['black'] if z > z1 + 2.55 else C['red'] if z1 + 1.8 < z < z1 + 2.2 else C['cream'], seg=sg_, cuts=(z1 + 1.8, z1 + 2.2, z1 + 2.55))
    # the mizzen on the boat deck aft, with the flag pole on the stern
    acyl(A, (1.2, 0, z1 + 0.1), (1.2, 0, z1 + 5.4), 0.08, lambda z: C['cream'], seg=8, r1=0.05)
    acyl(A, (1.2, 0, z1 + 1.2), (-0.8, 0, z1 + 1.9), 0.05, lambda z: C['cream'], seg=6)
    # the anchors and the hawse pipes in the bow
    for sg in (1, -1):
        x = 17.8; y = hbz(x, 5.4) + 0.02
        A.poly([(x - 0.35, sg * y, 5.0), (x + 0.35, sg * y, 5.15), (x + 0.35, sg * y, 5.7), (x - 0.35, sg * y, 5.55)], C['dark'], (0, sg, 0))
    # the windlass on the forecastle deck
    abox(A, 16.4, 17.2, -0.7, 0.7, z_fc(16.8), z_fc(16.8) + 0.45, C['dark'])
    for sg in (1, -1): acyl(A, (16.8, sg * 0.5, z_fc(16.8) + 0.45), (16.8, sg * 0.95, z_fc(16.8) + 0.45), 0.25, lambda z: C['steel'], seg=12)
    return [A.done(30)], [G.done(30)]


def build(fine=True):
    solids = build_hull(fine) + decks(fine) + whaleback(fine) + underwater(fine)
    o, g = deck_gear(fine); solids += o
    return [s for s in solids if s], [x for x in g if x]


def to_game(p): return (-p[1], p[2] - WL, -(p[0] - XM))
def to_game_n(n): return (-n[1], n[2], -n[0])

def anchors():
    G = lambda x, y, z: [round(v, 3) for v in to_game((x, y, z))]
    zw0 = z_deck(DH0) + 2.1
    return {'eye': G(6.6, -0.5, zw0 + 1.7), 'skipperAt': G(6.3, -0.5, zw0), 'hp': -0.08, 'fov': 58,
            'crewSpots': [G(11.6, -2.4, z_deck(11.6)) + [1.57], G(10.2, 2.2, z_deck(10.2)) + [0.0], G(8.2, -2.0, z_deck(8.2)) + [3.14], G(13.0, 1.6, z_deck(13.0)) + [0.0]],
            'lights': [[G(X_FC - 0.5, 0, 13.3), [1, 0.95, 0.85]], [G(6.6, WY + 0.22, zw0 + 1.85), [1, 0.12, 0.1]], [G(6.6, -WY - 0.22, zw0 + 1.85), [0.1, 1, 0.35]],
                       [G(XS + 0.3, 0, z_top(XS) + 0.9), [1, 0.95, 0.85]], [G(1.2, 0, zw0 + 5.2), [1, 0.95, 0.85]]],
            # the open working deck amidships: the hauler on the starboard rail by the gallows, the catch and the gear aft of it
            'deck': {'y': round(z_deck(10.5) - WL, 3), 'z': round(-(10.5 - XM), 3)}, 'gw': round(z_top(10.5) - WL, 3),
            'stern': round(XM - XS, 3), 'bow': round(-(XF - XM), 3), 'side': HB, 'beam': 7.2, 'pl': 8.4, 'rl': 2.7, 'open': False, 'hand': False,
            'pole': G(XS + 0.25, 0, z_top(XS) + 1.6), 'hauler': G(12.0, -(hbz(12.0, z_top(12.0)) - 0.3), z_top(12.0) + 0.35), 'filler': G(10.0, HB, z_deck(10.0) + 0.3)}


SHOTS = [('bow3q', (36.0, -22.0, 8.0), (9.0, 0, 5.0), 35), ('stern3q', (-14.0, 15.0, 10.0), (7.0, 0, 5.0), 35), ('side', (9.0, -40, 5.5), (9.0, 0, 6.0), 35),
         ('above', (28.0, -18.0, 24.0), (9.0, 0, 4.0), 35), ('deck', (4.0, -9.0, 10.0), (11.0, 0, 5.5), 35)]

def main():
    os.makedirs(OUT, exist_ok=True)
    reset(); colours()
    solids, glass = build(True)
    join(solids, 'BOAT0'); join(glass, 'GLASS0')
    if 'fast' not in sys.argv: beauty(OUT, 'ky', WL, SHOTS)
    ex = {'frame': 'kystfiske: x starboard, y up from the waterline, z aft; metres', 'type': 'kyst21', 'name': 'Older coastal vessel 21 m',
          'len': 21.0, 'beam': 7.2, 'draft': 3.4, 'anchors': anchors()}
    export_boat(build, to_game, to_game_n, OUT, 'kyst21.glb', os.path.join(ROOT, 'src', 'data', 'boat-kyst21.b64'), ex,
                side=(os.path.join(ROOT, 'src', 'data', 'boat-kyst21-side.b64'), 9.0, 5.0, 24.0), dry='dry' in sys.argv)


if __name__ == '__main__':
    main()
