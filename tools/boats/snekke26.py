"""The 26 ft fibreglass snekke (snekke): a 7.9 m coastal boat with a moulded clinker-look hull, a cabin trunk forward, a windscreen
with a hard top over the helm and an open cockpit aft for the gear; a 30 hp inboard diesel turning a three-bladed propeller in an
aperture between the keel and the rudder.

Rebuilt 01.11.2026 after the pilot boat's way of working (docs/skipsmodeller/snekke-grunnlag.md, sulebas-bygging.md; Jonas: «Løft den
til samme nivå og arbeidsmåte som pilotbåten»). The first script (17.10.2026) was drawn after the pictures Jonas showed on 13.10.2026
(a classic Norwegian 26 ft family snekke of the late 1970s and 80s, the Windy 26 in the pictures: 7.86 x 2.70 m; the pictures are not
in the repository, and the model's name is only in comments and docs). Its tables of the sheer, the stem and the half-breadths are
kept (read off those pictures); the keel, the depth of the body under the water and the sections are new: the old hull gave about
twice the displacement of the game's 3.0 t (check()). No photograph or drawing of the boat is here; check() compares the model with
the tables, the game's data (VESSELS.snekke: 7.9 x 2.7 m, 1.2 m draft with the keel, 3.0 t) and the rules for the lanterns.

The hull is ONE surface: both sides with the moulded laps and the keel, the transom, the gunwales, the cockpit's liner and sole, the
bulkhead, the side decks, the cabin trunk and the foredeck share their points (Mesh). Openings are real holes, cut with a boolean and
lined: the cabin windows, the companionway, the hatches, the scuppers, the exhaust and the bilge pump's outlet. Nothing lies in the
plane of anything else. The fittings other boats can use come from fittings.py (the propeller, the anodes, the cleats, the lanterns,
the bow roller, the hatch lids, the wheel, the single-lever control, the helm seat, the whip, the GPS, the ladder).

Nothing that can be bought is modelled in (the game sets the deck kit at the places in kit, 19.10.2026): no hauler, no tubs, no
liferaft, no radar, no ring buoys. The plotter and the VHF are standard on this boat (VESSELS.snekke.std) and are part of her.

    pip install bpy==4.5.4   (Python 3.11)
    python3 tools/boats/snekke26.py            -> src/data/boat-snekke26.b64 (+ the side picture), renders in tools/boats/out/
    python3 tools/boats/snekke26.py fast       -> the same without the renders
    python3 tools/boats/snekke26.py fast dry   -> no renders, the GLB only in tools/boats/out
    python3 tools/boats/snekke26.py check      -> the checks against the tables, the data and the rules only

Frame: x forward from the transom's foot, y to port, z up from the keel's underside (the base line); the waterline is z = 1.2."""
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy, bmesh
from bpyutil import *
import bpyutil
import fittings as F
from mathutils import noise

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE)); OUT = os.path.join(HERE, 'out')
L = 7.9; BEAM = 2.7; DRAFT = 1.2; DISP = 3.0                 # VESSELS.snekke
WL = 1.2; XA = 0.0; XF = 7.9; XM = (XA + XF) / 2; HB = BEAM / 2
ZC = 1.58                    # the cockpit sole, self-draining, 0.38 m over the water
X_BH = 3.75                  # the bulkhead at the cockpit's forward end: the cabin trunk's aft face with the companionway
X_KA = 1.05                  # the keel's after edge, the forward side of the propeller's aperture
RAKE = 0.10                  # the transom's rake: its top stands this far aft of its foot
LAPS = 7                     # the moulded clinker laps between the boot top and the band
LAP = 0.022                  # how far each lap's lower edge stands out
BAND = (0.20, 0.045)         # the dark band: from this far under the sheer to this far under it
SLB = 0.012                  # the paint lines rise 12 mm a metre forward of midships (planliste kap. 29: they follow the sheer)
Z_AF = WL + 0.05; Z_BT = WL + 0.13                           # the antifouling to 5 cm over the water, the boot top over it (amidships)
GW = 0.14                    # the gunwale's width over the cockpit


# ---------- the lines (metres). The sheer, the half-breadths and the stem are the first script's (read off Jonas' pictures of
# 13.10.2026, z + 0.2 for the new base line); the keel, the body's depth and the sections are new (check(): 3.0 t) ----------
SHEER = [(XA, 2.20), (1.0, 2.17), (2.5, 2.16), (4.0, 2.20), (5.5, 2.29), (6.6, 2.40), (7.4, 2.50), (XF, 2.56)]
BS = [(XA, 1.24), (1.0, 1.30), (2.5, 1.35), (4.0, 1.35), (5.2, 1.30), (6.1, 1.16), (6.8, 0.92), (7.3, 0.62), (7.65, 0.32), (XF, 0.0)]
BW = [(XA, 1.03), (1.0, 1.10), (2.5, 1.16), (4.0, 1.15), (5.2, 1.03), (6.1, 0.79), (6.7, 0.48), (7.1, 0.22), (7.36, 0.0), (XF, 0.0)]
# the keel's underside, the forefoot and the stem's fore edge (the profile): 1.2 m under the water at the after end of the keel (the
# game's draft), a little drag forward, the forefoot rising into the raked, rounded stem, which meets the water at 7.36 m
KB = [(X_KA, 0.03), (1.4, 0.0), (3.0, 0.0), (4.5, 0.08), (5.3, 0.22), (5.9, 0.38), (6.4, 0.56), (6.95, 0.82), (7.3, 1.12), (7.55, 1.45),
      (7.72, 1.80), (7.83, 2.18), (XF, 2.56)]
# the body's centreline where the garboard meets the keel's side (the canoe body), rising aft to the transom's foot 0.10 m under the
# water (a small transom that just dips, as on the snekker of the type), and forward into the forefoot
ZROOT = [(XA, 1.12), (0.5, 1.05), (1.0, 0.96), (1.6, 0.87), (2.4, 0.81), (3.6, 0.79), (4.6, 0.81), (5.4, 0.83), (6.0, 0.86), (6.6, 0.91)]
WKB = [(X_KA, 0.0), (X_KA + 0.14, 0.064), (4.6, 0.066), (5.8, 0.052), (6.6, 0.038), (XF, 0.032)]   # the keel's (the stem's) half siding
def zs(x): return interp(SHEER, x)
def stern_round(x):
    """the stern rounded in plan: full from 0.8 m forward, drawn in to 62 % at the transom (the first script)"""
    if x >= 0.8: return 1.0
    u = (0.8 - x) / 0.8; return 0.62 + 0.38 * math.sqrt(max(0.0, 1 - u * u))
def hbs(x): return max(0.0, interp(BS, x) * stern_round(x))
def hbw(x): return max(0.0, interp(BW, x) * stern_round(x))
def kb(x): return interp(KB, x) if x >= X_KA - 1e-9 else None
def wk(x): return interp(WKB, x) if x >= X_KA - 1e-9 else 0.0
def smin(a, b, k):
    h = max(k - abs(a - b), 0.0) / k; return min(a, b) - h * h * k / 4
def zr(x):
    """the canoe body's centreline height: the root table aft and amidships, joining the profile forward with a soft fillet"""
    r = interp(ZROOT, x)
    if x < X_KA: return r
    return -smin(-r, -(kb(x) + 0.02), 0.12)
def x_t(z, x0=XA):
    """the transom's raked face at height z (its foot at the hull's bottom there)"""
    return x0 - RAKE * max(0.0, z - zr(XA)) / (zs(XA) - zr(XA))


# ---------- the sections ----------
def catmull(P, n=10):
    out = [P[0]]; Q = [P[0]] + P + [P[-1]]
    for i in range(1, len(Q) - 2):
        p0, p1, p2, p3 = Q[i - 1], Q[i], Q[i + 1], Q[i + 2]
        for k in range(1, n + 1):
            t = k / n; t2, t3 = t * t, t * t * t
            out.append(tuple(0.5 * (2 * p1[c] + (-p0[c] + p2[c]) * t + (2 * p0[c] - 5 * p1[c] + 4 * p2[c] - p3[c]) * t2 + (-p0[c] + 3 * p1[c] - 3 * p2[c] + p3[c]) * t3) for c in (0, 1)))
    return out

_CV = {}
def body(x):
    """the body's half-section at x from the keel's root to the sheer as a polyline (y, z) rising in z: a hollow garboard out of the keel
    (the wine-glass section of a snekke), a soft bilge to the waterline, the topsides flaring out to the sheer; forward of the stem's
    waterline a fine V flaring to the sheer"""
    k = round(x, 5)
    if k in _CV: return _CV[k]
    z0, s, Bs, Bw = zr(x), zs(x), hbs(x), hbw(x); w0 = wk(x) + (0.018 if x >= X_KA + 0.14 else 0.018 * max(0.0, x - X_KA) / 0.14)
    if z0 >= WL - 0.03 or Bw < w0 + 0.02:
        P = [(w0, z0), (w0 + (Bs - w0) * 0.50, z0 + (s - z0) * 0.56), (Bs, s)]
    else:
        D = WL - z0; b = Bw - w0
        P = [(w0, z0), (w0 + b * 0.06, z0 + D * 0.14), (w0 + b * 0.45, z0 + D * 0.36), (w0 + b * 0.80, z0 + D * 0.62), (w0 + b * 0.96, z0 + D * 0.86), (Bw, WL),
             (Bw + (Bs - Bw) * 0.45, WL + (s - WL) * 0.50), (Bs, s)]
    c = catmull(P, 14); mono = [c[0]]
    for p in c[1:]:
        if p[1] > mono[-1][1] + 1e-5: mono.append((max(w0, p[0]), p[1]))
    _CV[k] = mono; return mono

def y_at(x, z):
    """the outside's half-breadth at x and height z (the body, without the laps)"""
    c = body(x)
    if z <= c[0][1]: return c[0][0] if x >= X_KA else 0.0
    for a, b in zip(c, c[1:]):
        if a[1] <= z <= b[1]: t = (z - a[1]) / max(1e-9, b[1] - a[1]); return a[0] + (b[0] - a[0]) * t
    return c[-1][0]

def arc_pts(x, z1, n):
    """n + 1 points along the body from its root up to height z1, evenly by length"""
    c = body(x); pts = [c[0]]
    for p in c[1:]:
        if p[1] >= z1:
            a = pts[-1]; t = (z1 - a[1]) / max(1e-9, p[1] - a[1]); pts.append((a[0] + (p[0] - a[0]) * t, z1)); break
        pts.append(p)
    if len(pts) == 1: return [pts[0]] * (n + 1)
    Lc = [0.0]
    for a, b in zip(pts, pts[1:]): Lc.append(Lc[-1] + math.hypot(b[0] - a[0], b[1] - a[1]))
    out = []
    for k in range(n + 1):
        s = Lc[-1] * k / n
        for i in range(1, len(Lc)):
            if Lc[i] >= s - 1e-12:
                t = (s - Lc[i - 1]) / max(1e-12, Lc[i] - Lc[i - 1]); a, b = pts[i - 1], pts[i]; out.append((a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t)); break
    return out

def lap_z(x, k):
    """the height of the k-th lap's lower edge (k = 0 the boot top's, LAPS the band's foot), following the sheer"""
    z0 = WL + 0.15; z1 = zs(x) - BAND[0] - 0.03; return z0 + (z1 - z0) * k / LAPS

NKB = 4                      # rows up the keel's side
NBOT = 18                    # rows from the root to the boot top's foot
def section(x, fine=True):
    """the whole half-section at x as (y, z, kind) from the keel's underside on the centre line to the sheer; the counts never change
    (points collapse where a band is empty: aft of the keel, at the stem). kind: 'k' keel, 'b' bottom, 'l' lap (its lower edge, standing
    out), 't' topside, 'n' the band, 's' the sheer"""
    out = []
    z0 = zr(x); w = wk(x); r = body(x)[0][0]
    if x >= X_KA:
        b = kb(x); f = min(1.0, (x - X_KA) / 0.14); ww = w * f
        out += [(0.0, b, 'k'), (ww * 0.55, b, 'k'), (ww * 0.92, b + 0.012, 'k'), (ww, b + 0.035, 'k')]
        for i in range(1, NKB + 1):
            z = b + 0.035 + (z0 - b - 0.035) * i / NKB; out.append((ww + (r - ww) * i / NKB, z, 'k'))
    else:
        out += [(0.0, z0, 'k')] * (4 + NKB)
    nb = NBOT if fine else 4
    out += [(y, z, 'b') for y, z in arc_pts(x, min(zs(x), max(z0, WL + 0.15)), nb)[1:]]
    s = zs(x); fade = 1.0 - max(0.0, min(1.0, (x - 6.5) / 1.15)) ** 1.5
    cl = lambda z: min(s, max(z0, z))
    for k in range(LAPS if fine else 0):
        za, zz = cl(lap_z(x, k)), cl(lap_z(x, k + 1))
        for zq, off in ((za, LAP), (za + (zz - za) * 0.35, LAP * 0.45), (zz - 0.004, 0.0)):
            zq = cl(zq); y = y_at(x, zq); out.append((y + off * fade * min(1.0, y / max(hbs(x), 1e-3) * 2), zq, 'l' if off == LAP else 't'))
    if not fine: out.append((y_at(x, cl(WL + 0.6)), cl(WL + 0.6), 't'))
    for zq, off, kd in ((cl(s - BAND[0] - 0.03), 0.0, 't'), (cl(s - BAND[0]), 0.012, 'n'), (cl(s - BAND[1]), 0.012, 't'), (s, 0.0, 's')):
        out.append((y_at(x, zq) + off * fade, zq, kd))
    return out


# ---------- colours: white gelcoat, a navy band, red antifouling, a navy boot top (paint zones: 1 the hull, 2 the band, 3 the
# superstructure, 4 the decks; 10j-paint.js) ----------
C = {}
def colours():
    w = lambda n, rgb, g=0.4, z=0, metal=0.0, emit=0.0: C.__setitem__(n, mat(n, rgb, g, zone=z, metal=metal, emit=emit))
    w('af', (0.55, 0.12, 0.08), 0.15); w('boot', (0.07, 0.09, 0.16), 0.45); w('hull', (0.94, 0.94, 0.92), 0.65, 1)
    w('band', (0.09, 0.12, 0.22), 0.55, 2); w('white', (0.95, 0.95, 0.93), 0.55, 3); w('inner', (0.88, 0.88, 0.85), 0.3)
    w('deck', (0.86, 0.86, 0.82), 0.12, 4); w('nonslip', (0.80, 0.80, 0.76), 0.08, 4); w('sole', (0.60, 0.44, 0.27), 0.2); w('teak', (0.58, 0.38, 0.20), 0.3)
    w('steel', (0.78, 0.80, 0.82), 0.85, 0, 0.85); w('chrome', (0.86, 0.87, 0.89), 0.95, 0, 0.9); w('alu', (0.72, 0.74, 0.76), 0.6, 0, 0.7)
    w('dark', (0.12, 0.13, 0.14), 0.25); w('black', (0.04, 0.04, 0.05), 0.4); w('rubber', (0.04, 0.04, 0.05), 0.2); w('frame', (0.07, 0.07, 0.08), 0.45)
    w('screen', (0.03, 0.05, 0.07), 0.9); w('bezel', (0.10, 0.10, 0.11), 0.5); w('cush', (0.13, 0.13, 0.14), 0.35); w('switch', (0.20, 0.21, 0.22), 0.4)
    w('prop', (0.70, 0.52, 0.27), 0.8, 0, 0.9); w('anode', (0.55, 0.56, 0.55), 0.2); w('gutter', (0.55, 0.55, 0.52), 0.2); w('cabin', (0.05, 0.05, 0.06), 0.2)
    w('lampR', (0.90, 0.10, 0.08), 0.8, 0, 0, 0.5); w('lampG', (0.10, 0.80, 0.25), 0.8, 0, 0, 0.5); w('lampW', (1.0, 0.97, 0.88), 0.8, 0, 0, 0.5)
    w('lens', (0.95, 0.94, 0.85), 0.9); w('orange', (0.93, 0.36, 0.07), 0.45); w('board', (0.93, 0.93, 0.90), 0.35)
    C['glass'] = mat('glass', (0.07, 0.10, 0.13), 0.95)

def paint_line(x, z0):
    """a paint line's height at x: z0 amidships, rising SLB a metre forward (the plane build() cuts it with)"""
    return z0 + SLB * (x - XM)


# ---------- the wear: per corner, so it runs across faces (B16; 1994, gelcoat) ----------
def n3(x, y, z=0.0): return noise.noise(V((x, y, z)))
def ss(a, b, x):
    t = max(0.0, min(1.0, (x - a) / (b - a))); return t * t * (3 - 2 * t)
def toward(m, rgb, k):
    base = m['rgb']; return [1 + (rgb[i] / max(base[i], 1e-3) - 1) * k for i in range(3)]

EXH = (-0.45, 0.22)          # the wet exhaust's outlet in the transom (y, height over the water): soot and water marks under it
BILGE = (2.6, -1, 0.30)      # the bilge pump's outlet (x, side, height over the water)
def wear(p, m, n):
    x, y, z = p; nm = m.name; side = 1 if y > 0 else -1
    if nm == 'hull':
        g = 0.97 + 0.04 * n3(x * 3.0, z * 6.0, side)                                            # the gelcoat not quite even
        g *= 1 - 0.09 * ss(0.14, 0.0, z - paint_line(x, Z_BT))                                 # grime over the boot top
        g *= 1 - 0.07 * ss(0.3, 0.75, n3(x * 5.0, z * 2.0, side * 3.3)) * ss(0.30, 0.0, abs(z - (WL + 0.55)))   # scuffs from quays and fenders
        if x < 0.15 and n.x < -0.5:                                                           # the transom: soot and water under the exhaust
            g *= 1 - 0.30 * ss(0.10, 0.0, abs(y - EXH[0]) - 0.06 * max(0.0, WL + EXH[1] - z)) * ss(WL + EXH[1] + 0.05, WL, z)
        if side == BILGE[1] and z < WL + BILGE[2]:
            g *= 1 - 0.20 * ss(0.016 + (WL + BILGE[2] - z) * 0.03, 0.004, abs(x - BILGE[0])) * ss(WL, WL + 0.12, z)
        c = toward(m, (0.80, 0.79, 0.72), 0.30 * ss(0.2, 0.7, n3(x * 1.2, z * 3.0, side * 7.1)))   # yellowed a little in patches (32 years)
        return [c[i] * g for i in range(3)]
    if nm in ('band', 'boot'):
        v = 0.93 + 0.08 * n3(x * 4.0, z * 9.0, side) - 0.08 * ss(WL + 0.06, WL - 0.02, z)
        return [v, v, v]
    if nm == 'af':
        v = 0.86 + 0.14 * n3(x * 2.5, z * 6.0, y * 2.0)
        g = ss(WL - 0.08, WL + 0.02, z) * (0.5 + 0.5 * ss(-0.3, 0.4, n3(x * 3.0, side * 1.3, 4.1)))   # slime and weed at the waterline
        return [v * (1 - 0.30 * g), v * (1 + 0.15 * g), v * (1 - 0.25 * g)]
    if nm in ('deck', 'nonslip', 'white', 'inner'):
        v = 0.95 + 0.05 * n3(x * 5.0, y * 5.0, z * 5.0)
        if nm == 'inner': v -= 0.10 * ss(0.15, 0.0, z - ZC)                                   # the liner dirty along the sole
        if nm in ('deck', 'nonslip') and n.z > 0.7: v *= 1 - 0.07 * ss(0.3, 0.7, n3(x * 6.0, y * 6.0, 2.0))
        return [v, v, v]
    if nm in ('sole', 'teak'):
        v = 0.90 + 0.12 * n3(x * 7.0, y * 7.0, z * 3.0)
        v *= 1 - 0.18 * ss(0.6, 0.0, math.hypot(x - 1.6, y + 0.6)) - 0.10 * ss(0.5, 0.0, math.hypot(x - 2.9, y + 0.7))   # worn where they stand
        return toward(m, (0.62, 0.60, 0.56), 0.35 * ss(0.2, 0.8, n3(x * 2.0, y * 3.0, 1.0)))
    return None

def tint(o, f=wear):
    bm = bmesh.new(); bm.from_mesh(o.data); lay = bm.loops.layers.float_color.new('TINT'); mats = [s.material for s in o.material_slots]
    for fc in bm.faces:
        m = mats[fc.material_index]; fc.normal_update()
        for l in fc.loops:
            t = f(l.vert.co, m, fc.normal)
            l[lay] = (t[0], t[1], t[2], 1.0) if t is not None else (1.0, 1.0, 1.0, 1.0)
    bm.to_mesh(o.data); bm.free(); return o


# ---------- one surface: a mesh whose faces share their points (skiff59.py) ----------
class Mesh:
    def __init__(s, name):
        s.name = name; s.bm = bmesh.new(); s.d = {}; s.mats = []; s.ix = {}; s.kind = s.bm.faces.layers.int.new('kind')
    def mi(s, m):
        if m.name not in s.ix: s.ix[m.name] = len(s.mats); s.mats.append(m)
        return s.ix[m.name]
    def v(s, p):
        if isinstance(p, bmesh.types.BMVert): return p
        k = (round(p[0], 5), round(p[1], 5), round(p[2], 5)); q = s.d.get(k)
        if q is None: q = s.bm.verts.new(V(p)); s.d[k] = q
        return q
    def f(s, pts, m, out=None, kind=0):
        vs = []
        for p in pts:
            q = s.v(p)
            if q not in vs: vs.append(q)
        if len(vs) < 3: return None
        try: fc = s.bm.faces.new(vs)
        except ValueError: return None
        fc.normal_update()
        if fc.calc_area() < 1e-10: s.bm.faces.remove(fc); return None
        fc.material_index = s.mi(m); fc[s.kind] = kind
        if out is not None and fc.normal.dot(V(out)) < 0: fc.normal_flip()
        return fc
    def strip(s, R, m, out, kind=0):
        """faces between rows of points R[i][j]; m and out may be functions of (i, j)"""
        for i in range(len(R) - 1):
            for j in range(len(R[i]) - 1):
                mm = m(i, j) if callable(m) else m
                if mm is None: continue
                s.f([R[i][j], R[i + 1][j], R[i + 1][j + 1], R[i][j + 1]], mm, out(i, j) if callable(out) else out, kind)
    def done(s, angle=30):
        bmesh.ops.remove_doubles(s.bm, verts=s.bm.verts[:], dist=1e-5)
        bmesh.ops.dissolve_degenerate(s.bm, edges=s.bm.edges[:], dist=1e-6)
        return shade(obj_from_bm(s.name, s.bm, s.mats), angle)


# ---------- the plan of the decks ----------
XC0 = 0.12                   # the cockpit's after end, inside the transom
CXF, CXN = 6.25, 6.75        # the cabin trunk's sides end at CXF; its front rounds forward to CXN
ZCT = 2.76                   # the trunk's top at its sides (cambered 6 cm higher on the centre line)
def cabin_w(x):
    """the trunk's half width at its foot: 0.98 aft, narrowing forward, rounded in plan between CXF and CXN (the first script)"""
    if x <= CXF: return 0.98 - 0.16 * max(0.0, (x - 4.6) / (CXF - 4.6)) ** 1.6
    u = min(1.0, (x - CXF) / (CXN - CXF)); return 0.82 * math.sqrt(max(0.0, 1 - u * u))
def zct(x): return ZCT - (0.0 if x <= CXF else 0.12 * min(1.0, (x - CXF) / (CXN - CXF)) ** 2)
def x_of(x, z):
    """a station's point at height z, with the transom's rake carried into the stations aft of 0.8 m: the transom's top at x = 0, its
    foot RAKE forward of it"""
    z0, z1 = zr(XA), zs(XA); t = max(0.0, min(1.0, (z - z0) / (z1 - z0)))
    return x + RAKE * (1 - t) * max(0.0, 1 - x / 0.8)
def ysh(x): return section(x)[-1][0]
def yi(x): return max(0.2, ysh(x) - GW)                     # the gunwale's inner edge over the cockpit
def yb(x): return max(0.2, min(yi(x) - 0.03, y_at(x, ZC) - 0.07))   # the liner's foot on the sole

def stations(fine=True):
    sp = [XA, XC0, X_KA - 0.002, X_KA, X_BH, CXF, CXN]
    if fine:
        xs = [0.03, 0.06, 0.09] + [0.16 + 0.035 * i for i in range(210)] + [7.5 + 0.025 * i for i in range(16)] + [X_KA + 0.035, X_KA + 0.07, X_KA + 0.105, X_KA + 0.14]
        laps = [lambda x, k=k: lap_z(x, k) for k in range(1, LAPS + 1)]
        sp += stem_stations(lambda x: kb(x) if x >= X_KA else 0.0, [WL + 0.15] + laps + [lambda x: zs(x) - BAND[0], lambda x: zs(x) - BAND[1]], 5.0, XF - 0.015)
    else:
        xs = [0.4, 0.8, 1.5, 2.2, 3.0, 4.6, 5.4, 7.0, 7.4, 7.7]
    xs = [x for x in xs if all(abs(x - s) > 0.008 for s in sp)] + sp + [XF - 0.008, XF]
    return sorted(set(round(x, 5) for x in xs if XA <= x <= XF))

HULL_MAT = {'k': 'af', 'b': 'hull', 'l': 'hull', 't': 'hull', 'n': 'band', 's': 'hull'}
def hull_shell(M, fine=True):
    """the outside (both sides over the keel, one surface), the transom, the gunwales and the cockpit, the bulkhead, the side decks, the
    cabin trunk and the foredeck"""
    xs = stations(fine); S = {}
    for x in xs: S[x] = [(x_of(x, z), y, z, k) for y, z, k in section(x, fine)]
    # the outside: kind 1 is painted by the paint lines (build), kind 2 is the band
    for sg in (1, -1):
        for a, b in zip(xs, xs[1:]):
            Sa, Sb = S[a], S[b]
            for j in range(len(Sa) - 1):
                k = Sa[j][3]; dy = Sa[j + 1][1] - Sa[j][1]; dz = Sa[j + 1][2] - Sa[j][2]
                out = (0, sg * dz, -dy) if abs(dy) + abs(dz) > 1e-7 else (0, sg, 0)
                q = [(Sa[j][0], sg * Sa[j][1], Sa[j][2]), (Sb[j][0], sg * Sb[j][1], Sb[j][2]), (Sb[j + 1][0], sg * Sb[j + 1][1], Sb[j + 1][2]), (Sa[j + 1][0], sg * Sa[j + 1][1], Sa[j + 1][2])]
                M.f(q, C[HULL_MAT[k]], out, 2 if k == 'n' else 1)
    # the transom: strips across between the first station's two sides, facing aft
    T = S[xs[0]]
    for j in range(len(T) - 1):
        q = [(T[j][0], T[j][1], T[j][2]), (T[j][0], -T[j][1], T[j][2]), (T[j + 1][0], -T[j + 1][1], T[j + 1][2]), (T[j + 1][0], T[j + 1][1], T[j + 1][2])]
        M.f(q, C['band'] if T[j][3] == 'n' else C['hull'], (-1, 0, 0), 2 if T[j][3] == 'n' else 1)
    # ---- the cockpit: the teak-capped gunwales, the liner, the sole; the transom's top and its inside ----
    cp = [x for x in xs if XC0 - 1e-9 <= x <= X_BH + 1e-9]
    NS = 8 if fine else 2
    def crow(x):
        s = zs(x); P = [(x, ysh(x), s), (x, yi(x), s - 0.006), (x_of(x, ZC) if x < 0.8 else x, yb(x), ZC)]
        P[1] = (x_of(x, s), P[1][1], P[1][2]); P[0] = (x_of(x, s), P[0][1], P[0][2])
        row = P + [(P[2][0], yb(x) * (1 - 2 * i / NS), ZC) for i in range(1, NS)] + [(P[2][0], -yb(x), ZC), (P[1][0], -yi(x), s - 0.006), (P[0][0], -ysh(x), s)]
        return row
    R = [crow(x) for x in cp]; nc = len(R[0])
    cm = lambda i, j: C['teak'] if j in (0, nc - 2) else C['inner'] if j in (1, nc - 3) else C['sole']
    co = lambda i, j: (0, 0, 1) if j in (0, nc - 2) or 2 <= j < nc - 3 else (0, -1 if j == 1 else 1, 0.3)
    M.strip(R, cm, co)
    # the aft wall (the transom's inside), its top across to the transom's outside, and the corners of the gunwale round to it
    r0 = R[0]; s0 = zs(XA); t0 = S[xs[0]][-1]
    M.f([r0[1]] + r0[2:nc - 2], C['inner'], (1, 0, 0))
    M.f([(t0[0], t0[1], s0), (t0[0], -t0[1], s0), r0[nc - 2], r0[1]], C['teak'], (0, 0, 1))
    for sg in (1, -1):
        aft = [x for x in xs if x <= XC0 + 1e-9]
        pts = [(S[x][-1][0], sg * S[x][-1][1], S[x][-1][2]) for x in aft]
        M.f(pts + [r0[1] if sg > 0 else r0[nc - 2]], C['teak'], (0, 0, 1))
    # ---- forward of the bulkhead: the side decks, the trunk's sides and top, the foredeck ----
    fw = [x for x in xs if x >= X_BH - 1e-9]
    NT = 10 if fine else 2
    def drow(x):
        s = zs(x); e = ysh(x); w = max(0.0, min(cabin_w(x), e - 0.02)); wt = max(0.0, w - 0.04); t = max(zct(x), s + 0.005)
        cam = lambda y: 0.06 * (1 - (y / max(wt, 1e-3)) ** 2) if wt > 1e-3 else 0.0
        P = [(x, e, s), (x, w, s + 0.012 * (1 - w / max(e, 1e-3)))]
        P += [(x, wt * (1 - 2 * i / NT), t + cam(wt * (1 - 2 * i / NT))) for i in range(NT + 1)]
        return P + [(x, -w, P[1][2]), (x, -e, s)]
    NF = 6 if fine else 2
    def frow(x):
        """the foredeck across, its camber growing from nothing under the trunk's nose (where its points lie on the side deck's edge)"""
        s = zs(x); e = ysh(x); g = min(1.0, (x - CXN) / 0.3)
        half = [(x, e * (1 - i / NF), s + 0.012 * i / NF + g * 0.045 * (1 - (1 - i / NF) ** 2)) for i in range(NF + 1)]
        return half + [(x, -p[1], p[2]) for p in reversed(half[:-1])]
    tr = [x for x in fw if x <= CXN + 1e-9]; fd = [x for x in fw if x >= CXN - 1e-9]
    D = [drow(x) for x in tr]; nd = len(D[0])
    dm = lambda i, j: C['nonslip'] if j in (0, nd - 2) else C['white'] if j in (1, nd - 3) else C['deck']
    do = lambda i, j: (0, 0, 1) if j in (0, nd - 2) or 2 <= j < nd - 3 else (0, 1 if j == 1 else -1, 0.1 if tr[i] < CXF else 0.6)
    M.strip(D, dm, do)
    M.strip([frow(x) for x in fd], C['nonslip'], (0, 0, 1))
    # the bulkhead: from the sole up the liner to the gunwale, out to the trunk's foot, up its aft face, across its top
    c = R[-1]; d = D[0]
    poly = [c[nc - 3], c[nc - 2]] + [d[nd - 2]] + list(reversed(d[2:nd - 2])) + [d[1], c[1], c[2]] + [c[2 + i] for i in range(1, NS)]
    M.f(poly, C['white'], (-1, 0, 0))
    return S, R, D


# ---------- the openings: real holes, cut with a boolean and lined (ringnot38.py) ----------
WIN = [(3.98, 4.62), (4.78, 5.42), (5.58, 6.06)]             # the cabin windows on each side (x from, to; the first script)
def win_z(xa, xb): return max(zs(xa), zs(xb)) + 0.13, ZCT - 0.08
def trunk_y(x, z):
    """the trunk's side at x and height z (it leans in 4 cm over its height)"""
    s = zs(x); w = min(cabin_w(x), ysh(x) - 0.02); return w - 0.04 * max(0.0, min(1.0, (z - s) / (zct(x) - s)))
DOOR = (0.08, 0.62, ZC + 0.30, ZCT - 0.07)                   # the companionway in the bulkhead: y from, to; z from, to
HATCH_F = (5.42, 5.98, -0.27, 0.27)                          # the forward hatch on the trunk's top
HATCH_E = (2.32, 3.10, -0.40, 0.40)                          # the engine's hatch in the cockpit sole
SCUP = [(0.55, ZC + 0.04), (-0.55, ZC + 0.04)]               # the cockpit's scuppers through the transom (y, z), r 0.03
EXH_R = 0.045; BILGE_R = 0.016

def rr_pts(cx, cy, w, h, r, n=4):
    return rrect(cx, cy, w, h, max(0.004, min(r, w / 2 - 0.002, h / 2 - 0.002)), n=n)
def circle(r, n=16): return [(r * math.cos(2 * math.pi * k / n), r * math.sin(2 * math.pi * k / n)) for k in range(n)]

def cutters():
    """the prisms that cut the openings, each (origin, u, v, outline in (u, v), how far along the normal both ways)"""
    out = []
    for sg in (1, -1):
        for xa, xb in WIN:
            za, zb = win_z(xa, xb); xc, zc = (xa + xb) / 2, (za + zb) / 2
            out.append(((xc, sg * trunk_y(xc, zc), zc), (1, 0, 0), (0, 0, 1), rr_pts(0, 0, xb - xa, zb - za, 0.07), 0.10))
    y0, y1, z0, z1 = DOOR
    out.append(((X_BH, (y0 + y1) / 2, (z0 + z1) / 2), (0, 1, 0), (0, 0, 1), rr_pts(0, 0, y1 - y0, z1 - z0, 0.06), 0.06))
    x0, x1, y0, y1 = HATCH_F
    out.append((((x0 + x1) / 2, 0, ZCT + 0.03), (1, 0, 0), (0, 1, 0), rr_pts(0, 0, x1 - x0, y1 - y0, 0.05), 0.12))
    x0, x1, y0, y1 = HATCH_E
    out.append((((x0 + x1) / 2, 0, ZC), (1, 0, 0), (0, 1, 0), rr_pts(0, 0, x1 - x0, y1 - y0, 0.03), 0.04))
    for y, z in SCUP: out.append(((0.06, y, z), (0, 1, 0), (0, 0, 1), circle(0.03), 0.16))
    out.append(((x_of(0.0, WL + EXH[1]), EXH[0], WL + EXH[1]), (0, 1, 0), (0, 0, 1), circle(EXH_R, 20), 0.05))
    xb, sb, hb_ = BILGE; out.append(((xb, sb * y_at(xb, WL + hb_), WL + hb_), (1, 0, 0), (0, 0, 1), circle(BILGE_R, 12), 0.04))
    return out

def cut_holes(target):
    bm = bmesh.new()
    for o, u, v, poly, d in cutters():
        o, u, v = V(o), V(u), V(v); n = u.cross(v).normalized()
        a = [bm.verts.new(o + u * p + v * q - n * d) for p, q in poly]; b = [bm.verts.new(o + u * p + v * q + n * d) for p, q in poly]
        k = len(poly)
        for i in range(k): bm.faces.new([a[i], a[(i + 1) % k], b[(i + 1) % k], b[i]])
        bm.faces.new(a); bm.faces.new(list(reversed(b)))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new('cut'); bm.to_mesh(me); bm.free()
    cm = bpy.data.materials.get('cutmat') or bpy.data.materials.new('cutmat'); me.materials.append(cm)
    c = link(bpy.data.objects.new('cut', me))
    m = target.modifiers.new('cut', 'BOOLEAN'); m.operation = 'DIFFERENCE'; m.solver = 'EXACT'; m.object = c; m.material_mode = 'TRANSFER'
    try: m.use_hole_tolerant = True
    except AttributeError: pass
    dg = bpy.context.evaluated_depsgraph_get(); ev = target.evaluated_get(dg)
    me2 = bpy.data.meshes.new_from_object(ev); target.modifiers.clear(); old = target.data; target.data = me2; bpy.data.meshes.remove(old)
    ci = [i for i, mt in enumerate(me2.materials) if mt and mt.name.startswith('cutmat')]
    bm = bmesh.new(); bm.from_mesh(me2)
    bmesh.ops.delete(bm, geom=[f for f in bm.faces if f.material_index in ci], context='FACES')
    bm.to_mesh(me2); bm.free()
    for i in reversed(ci): me2.materials.pop(index=i)
    bpy.data.objects.remove(c)

def tube(A, ring, d, depth, m, m_end=None, out_in=True):
    """the inside of a hole, from its outline ring along d, depth deep, its faces turned in; closed at the end with m_end (else open)"""
    d = V(d).normalized(); P = [V(p) for p in ring]; c = sum(P, V()) / len(P); n = len(P)
    Q = [p + d * depth for p in P]
    for k in range(n):
        j = (k + 1) % n; mid = (P[k] + Q[j]) / 2
        A.poly([P[k], P[j], Q[j], Q[k]], m, (c + d * depth / 2) - mid)
    if m_end is not None: A.poly(Q, m_end, -d)

def linings(A, G, fine=True):
    """the reveals, the glass, the frames and what is behind the openings"""
    for sg in (1, -1):
        for xa, xb in WIN:
            za, zb = win_z(xa, xb); xc = (xa + xb) / 2
            o = rr_pts(xc, (za + zb) / 2, xb - xa, zb - za, 0.07, 5); fr = rr_pts(xc, (za + zb) / 2, xb - xa + 0.05, zb - za + 0.05, 0.095, 5)
            on = lambda x, z, d: V((x, sg * (trunk_y(x, z) - d), z))
            ring = [on(x, z, 0.0) for x, z in o]
            tube(A, ring, (0, -sg, 0), 0.035, C['white'])
            G.poly([on(x, z, 0.022) for x, z in o][::sg], C['glass'], (0, sg, 0))
            A.poly([on(x, z, 0.035) for x, z in o][::sg], C['cabin'], (0, sg, 0))      # the cabin dark behind the glass (no interior)
            for k in range(len(o)):                                                    # the black rubber frame round it, proud of the side
                a, b = o[k], o[(k + 1) % len(o)]; c_, d_ = fr[(k + 1) % len(fr)], fr[k]
                A.poly([on(a[0], a[1], -0.006), on(b[0], b[1], -0.006), on(c_[0], c_[1], -0.006), on(d_[0], d_[1], -0.006)], C['frame'], (0, sg, 0))
                A.poly([on(a[0], a[1], 0.0), on(b[0], b[1], 0.0), on(b[0], b[1], -0.006), on(a[0], a[1], -0.006)], C['frame'], (0, 0, 0))
                A.poly([on(d_[0], d_[1], -0.006), on(c_[0], c_[1], -0.006), on(c_[0], c_[1], 0.002), on(d_[0], d_[1], 0.002)], C['frame'], (0, sg, 0))
    # the companionway: its reveal, the teak door a little in with its louvres and handle, its sill
    y0, y1, z0, z1 = DOOR; o = rr_pts((y0 + y1) / 2, (z0 + z1) / 2, y1 - y0, z1 - z0, 0.06, 5)
    tube(A, [(X_BH, y, z) for y, z in o], (1, 0, 0), 0.05, C['white'])
    A.poly([(X_BH + 0.05, y, z) for y, z in o], C['teak'], (-1, 0, 0))
    if fine:
        for k in range(5):
            z = z0 + 0.12 + 0.035 * k; abox(A, X_BH + 0.044, X_BH + 0.049, y0 + 0.12, y1 - 0.12, z, z + 0.012, C['dark'])
        acyl(A, (X_BH + 0.05, y0 + 0.06, (z0 + z1) / 2), (X_BH + 0.02, y0 + 0.06, (z0 + z1) / 2), 0.012, lambda q: C['steel'], seg=8)
        for z in (z0 + 0.12, z1 - 0.12): acyl(A, (X_BH + 0.046, y1 - 0.02, z - 0.04), (X_BH + 0.046, y1 - 0.02, z + 0.04), 0.008, lambda q: C['steel'], seg=8)
        abox(A, X_BH - 0.035, X_BH + 0.005, y0 - 0.01, y1 + 0.01, z0 - 0.02, z0, C['teak'])
    # the forward hatch: its reveal down into the cabin, an aluminium frame proud of the trunk's top, the smoked acrylic lid on it
    x0, x1, y0, y1 = HATCH_F; o = rr_pts((x0 + x1) / 2, 0, x1 - x0, y1 - y0, 0.05, 4)
    top = lambda x, y: zct(x) + 0.06 * (1 - (y / (cabin_w(x) - 0.04)) ** 2)
    ring = [(x, y, top(x, y)) for x, y in o]
    tube(A, ring, (0, 0, -1), 0.06, C['inner'], C['cabin'])
    fo = rr_pts((x0 + x1) / 2, 0, x1 - x0 + 0.07, y1 - y0 + 0.07, 0.085, 4)
    zf = max(p[2] for p in ring) + 0.035
    F.loft(A, [[(x, y, top(x, y) - 0.004) for x, y in fo], [(x, y, zf) for x, y in fo]], lambda i: C['alu'], cap0=False, cap1=False)
    F.loft(A, [[(x, y, zf) for x, y in o], [(x, y, top(x, y) - 0.004) for x, y in o]], lambda i: C['alu'], cap0=False, cap1=False, out=lambda mid, cc: V((cc.x - mid.x, cc.y - mid.y, 0)))
    for k in range(len(o)):
        a, b = o[k], o[(k + 1) % len(o)]; c_, d_ = fo[(k + 1) % len(fo)], fo[k]
        A.poly([(a[0], a[1], zf), (b[0], b[1], zf), (c_[0], c_[1], zf), (d_[0], d_[1], zf)], C['alu'], (0, 0, 1))
    G.poly([(x, y, zf + 0.012) for x, y in rr_pts((x0 + x1) / 2, 0, x1 - x0 + 0.05, y1 - y0 + 0.05, 0.075, 4)], C['glass'], (0, 0, 1))
    if fine:
        for yy in (-0.12, 0.12): acyl(A, (x1 + 0.03, yy - 0.03, zf + 0.012), (x1 + 0.03, yy + 0.03, zf + 0.012), 0.009, lambda q: C['steel'], seg=8)
        abox(A, x0 - 0.045, x0 - 0.02, -0.04, 0.04, zf, zf + 0.025, C['frame'])
    # the engine's hatch in the sole: its gutter round the opening, a ledge, the teak lid lying 4 mm under the sole, its ring
    x0, x1, y0, y1 = HATCH_E; o = rr_pts((x0 + x1) / 2, 0, x1 - x0, y1 - y0, 0.03, 3)
    tube(A, [(x, y, ZC) for x, y in o], (0, 0, -1), 0.04, C['gutter'])
    li = rr_pts((x0 + x1) / 2, 0, x1 - x0 - 0.05, y1 - y0 - 0.05, 0.02, 3)
    for k in range(len(o)):
        a, b = o[k], o[(k + 1) % len(o)]; c_, d_ = li[(k + 1) % len(li)], li[k]
        A.poly([(a[0], a[1], ZC - 0.04), (b[0], b[1], ZC - 0.04), (c_[0], c_[1], ZC - 0.04), (d_[0], d_[1], ZC - 0.04)], C['gutter'], (0, 0, 1))
    A.poly([(x, y, ZC - 0.04) for x, y in li], C['cabin'], (0, 0, 1))
    F.hatch_lid(A, x0 + 0.006, x1 - 0.006, y0 + 0.006, y1 - 0.006, ZC - 0.004, C['sole'], C['steel'], hinge='+x', t=0.03)
    if fine:
        for k in range(1, 6):
            y = y0 + (y1 - y0) * k / 6; abox(A, x0 + 0.02, x1 - 0.02, y - 0.004, y + 0.004, ZC - 0.006, ZC - 0.0035, C['dark'])
    # the scuppers through the transom with their rubber flaps; the wet exhaust's stainless outlet; the bilge pump's outlet
    for y, z in SCUP:
        ring = [(x_of(0.0, z + q) - 0.002, y + p, z + q) for p, q in circle(0.03, 12)]
        tube(A, ring, (1, 0, 0), 0.15, C['dark'])
        obox(A, (x_of(0.0, z + 0.045) - 0.012, y, z), (0.004, 0, 0), (0, 0.042, 0), (0, 0, 0.045), C['rubber'])
    ey, ez = EXH[0], WL + EXH[1]
    ring = [(x_of(0.0, ez + q) - 0.002, ey + p, ez + q) for p, q in circle(EXH_R, 20)]
    tube(A, ring, (1, 0, 0), 0.14, C['black'], C['black'])
    F.atorus(A, (x_of(0.0, ez) - 0.008, ey, ez), (1, 0, 0), EXH_R + 0.012, 0.010, lambda a: C['steel'], seg=20, rseg=5)
    xb, sb, hb_ = BILGE; zb_ = WL + hb_
    ring = [(xb + p, sb * (y_at(xb + p, zb_ + q) + 0.001), zb_ + q) for p, q in circle(BILGE_R, 12)]
    tube(A, ring, (0, -sb, 0), 0.05, C['dark'], C['black'])
    F.atorus(A, (xb, sb * (y_at(xb, zb_) + 0.006), zb_), (0, sb, 0), BILGE_R + 0.008, 0.006, lambda a: C['steel'], seg=14, rseg=4)


# ---------- under water: the shoe, the rudder on its stock, the propeller on its shaft, the anodes, the transducer ----------
RX = 0.46                    # the rudder's stock (its leading edge)
PROP = (0.80, 0.0, 0.56); PR = 0.21                          # the propeller's centre and radius (30 hp at about 2:1, a 17 in wheel)
def underwater(fine=True):
    U = Acc('under')
    # the shoe: a bronze bar from under the keel's after end aft to the rudder's heel, carrying the heel pin
    abox(U, RX - 0.08, X_KA + 0.16, -0.035, 0.035, -0.006, 0.042, C['prop'])
    acyl(U, (RX, 0, 0.040), (RX, 0, 0.075), 0.018, lambda q: C['prop'], seg=10)
    # the rudder: a foil blade aft of its stock, its top under the hull's bottom; the stock up through the hull in its bearing
    F.foil_rudder(U, (RX, 0.0), 0.075, 1.0, 0.40, C['af'], thick=0.13, top=lambda x: zr(max(x, 0.0)) - 0.035, n=12 if fine else 5, rows=6 if fine else 2)
    acyl(U, (RX - 0.03, 0, 0.07), (RX - 0.03, 0, zr(RX) + 0.06), 0.022, lambda q: C['steel'], seg=10)
    acyl(U, (RX - 0.03, 0, zr(RX) - 0.035), (RX - 0.03, 0, zr(RX) + 0.01), 0.045, lambda q: C['prop'], seg=12)
    # the shaft out of the keel's after edge through its bearing, the shaft anode, the propeller (three blades, fixed pitch)
    px, py, pz = PROP
    acyl(U, (px + 0.06, 0, pz), (X_KA + 0.05, 0, pz), 0.0135, lambda q: C['steel'], seg=10)
    acyl(U, (X_KA - 0.03, 0, pz), (X_KA + 0.04, 0, pz), 0.038, lambda q: C['prop'], seg=14, r1=0.044)
    acyl(U, (px + 0.12, 0, pz), (px + 0.17, 0, pz), 0.034, lambda q: C['anode'], seg=14)
    F.propeller(U, PROP, (1, 0, 0), PR, C['prop'], n=3, hub=0.20, pitch=0.85, skew=0.30, cpp=False, fine=fine)
    if fine:
        # the anodes: one on each side of the keel's after end, two on the transom under the water; the sounder's transducer, the
        # engine's water intake (a slotted grille)
        for sg in (1, -1):
            F.anode(U, (1.55, sg * (wk(1.55) + 0.003), 0.30), (0, sg, 0), (1, 0, 0), C['anode'], L=0.22, w=0.07, t=0.028, m_strap=C['steel'])
            F.anode(U, (x_of(0.0, WL - 0.035) - 0.003, sg * 0.22, WL - 0.035), (-1, 0, 0.09), (0, 1, 0), C['anode'], L=0.16, w=0.06, t=0.025, m_strap=C['steel'])
        xt, yt = 2.75, -0.30; zt = 0.0
        for z in [zr(xt) + 0.15 * k / 40 for k in range(60)]:
            if y_at(xt, z) >= abs(yt): zt = z; break
        acyl(U, (xt, yt, zt + 0.02), (xt, yt, zt - 0.03), 0.045, lambda q: C['dark'], seg=16, r1=0.04)
        xi, yi_ = 3.05, 0.26; zi = zr(xi)
        for z in [zr(xi) + 0.15 * k / 40 for k in range(60)]:
            if y_at(xi, z) >= abs(yi_): zi = z; break
        for k in range(5): abox(U, xi - 0.06, xi + 0.06, yi_ - 0.05 + 0.025 * k - 0.006, yi_ - 0.05 + 0.025 * k + 0.006, zi - 0.012, zi + 0.02, C['dark'])
    return U.done(35)


# ---------- on deck: the rails, the cleats, the bow roller, the toe rail, the grab rails, the ladder, the flag staff, the filler ----------
def gunwale_y(x): return yi(x) + 0.03                       # where things stand on the gunwale's top (inside the teak's middle)
POLE = (0.05, -0.56)
def deck_fittings(A, fine=True):
    s = lambda q: C['steel']
    def base(p, r=0.028): acyl(A, (p[0], p[1], p[2] - 0.003), (p[0], p[1], p[2] + 0.008), r, s, seg=10)
    # the pulpit round the bow carried aft along the side decks to the windscreen's corner; posts on bases screwed to the deck
    if fine:
        xs = [3.95 + (7.55 - 3.95) * k / 10 for k in range(11)]
        for sg in (1, -1):
            P = [(x, sg * max(0.05, ysh(x) - 0.06), zs(x) + 0.012) for x in xs]
            for p in P: base(p); acyl(A, p, (p[0], p[1], p[2] + 0.60), 0.0125, s, seg=8)
            top = [(p[0], p[1], p[2] + 0.60) for p in P] + [(7.70, 0.0, zs(7.7) + 0.66)]; mid = [(p[0], p[1], p[2] + 0.30) for p in P]
            F.pipe(A, top, 0.0125, C['steel'], 8); F.pipe(A, mid, 0.010, C['steel'], 6)
        acyl(A, (7.70, 0, zs(7.7) + 0.66), (7.62, 0, zs(7.62) + 0.06), 0.0125, s, seg=8); base((7.62, 0, zs(7.62) + 0.055))
        # the stern rail round the quarters, open aft over the transom; its posts on the gunwale's top
        for sg in (1, -1):
            st = [(1.40, sg * gunwale_y(1.40)), (0.75, sg * gunwale_y(0.75)), (0.25, sg * (gunwale_y(0.25) - 0.04)), (0.06, sg * (gunwale_y(0.06) - 0.30))]
            P = [(x, y, zs(x) - 0.004) for x, y in st]
            for p in P: base(p); acyl(A, p, (p[0], p[1], p[2] + 0.62), 0.0125, s, seg=8)
            F.pipe(A, [(p[0], p[1], p[2] + 0.62) for p in P], 0.0125, C['steel'], 8); F.pipe(A, [(p[0], p[1], p[2] + 0.31) for p in P], 0.010, C['steel'], 6)
    # the toe rail along the side decks and the foredeck: a teak strip on the deck's edge, its ends cut back
    xs = [X_BH + 0.04 + (7.70 - X_BH - 0.04) * k / (36 if fine else 6) for k in range((36 if fine else 6) + 1)]
    for sg in (1, -1):
        for a, b in zip(xs, xs[1:]):
            pa = V((a, sg * (ysh(a) - 0.022), zs(a) + 0.002)); pb = V((b, sg * (ysh(b) - 0.022), zs(b) + 0.002))
            beam(A, pa + V((0, 0, 0.012)), pb + V((0, 0, 0.012)), 0.028, 0.03, C['teak'])
    if not fine: return
    # the grab rails on the trunk's top, teak on feet
    for sg in (1, -1):
        y = sg * 0.66; zt_ = lambda x: zct(x) + 0.06 * (1 - (0.66 / (cabin_w(x) - 0.04)) ** 2)
        feet = [4.25 + 0.36 * k for k in range(5)]
        for x in feet: abox(A, x - 0.03, x + 0.03, y - 0.014, y + 0.014, zt_(x) - 0.004, zt_(x) + 0.055, C['teak'])
        for a, b in zip(feet, feet[1:]): beam(A, (a, y, zt_(a) + 0.07), (b, y, zt_(b) + 0.07), 0.028, 0.03, C['teak'])
    # the cleats: on the gunwale at the quarters, on the side decks by the windscreen, two on the foredeck by the bow roller
    for x, sg in ((0.40, 1), (0.40, -1)): F.cleat(A, (x, sg * gunwale_y(x), zs(x) - 0.004), (0, 0, 1), (1, 0, 0), 0.20, C['steel'])
    for sg in (1, -1): F.cleat(A, (4.05, sg * (ysh(4.05) - 0.10), zs(4.05) + 0.010), (0, 0, 1), (1, 0, 0), 0.20, C['steel'])
    for sg in (1, -1): F.cleat(A, (7.15, sg * 0.18, zs(7.15) + 0.056), (0, 0, 1), (1, 0, 0), 0.20, C['steel'])
    # the bow roller over the stem with its keeper (the anchor itself is the game's: bower)
    zr_ = zs(7.75) + 0.035
    F.bow_roller(A, (7.30, 0, zs(7.30) + 0.012 + 0.045), (7.96, 0, zr_), C['steel'], C['rubber'], R=0.035, W=0.10, deck=lambda x: zs(x) + 0.012 + 0.045, x_end=XF - 0.02)
    # the boarding ladder on the transom to port: its hooks over the transom's top, the stiles down the raked face into the water
    yl = 0.55; zt0 = zs(XA)
    for y in (yl - 0.12, yl + 0.12):
        F.pipe(A, [(0.07, y, zt0 - 0.002), (0.07, y, zt0 + 0.05), (-0.03, y, zt0 + 0.05), (-0.03, y, zt0 - 0.10)], 0.0125, C['steel'], 8)
        F.pipe(A, [(-0.03, y, zt0 - 0.10), (x_of(0.0, WL - 0.40) - 0.05, y, WL - 0.40)], 0.0125, C['steel'], 8)
        acyl(A, (x_of(0.0, 1.85) - 0.002, y, 1.85), (x_of(0.0, 1.85) - 0.04, y, 1.85), 0.016, s, seg=8)    # its stand-off on the transom
    for k in range(5):
        z = WL - 0.32 + 0.24 * k; x = x_of(0.0, z) - 0.04 - 0.01 * (1 - k / 4)
        acyl(A, (x, yl - 0.12, z), (x, yl + 0.12, z), 0.011, s, seg=6)
    # the flag staff in its socket on the transom's top to starboard, raked aft, with the stern light on its head
    px, py = POLE; ztop = zt0 + 0.92
    acyl(A, (px, py, zt0 - 0.004), (px, py, zt0 + 0.10), 0.022, s, seg=10)
    acyl(A, (px, py, zt0 + 0.02), (px - 0.10, py, ztop), 0.012, lambda q: C['teak'], seg=8)
    F.stern_lantern(A, (px - 0.105, py, ztop + 0.04), (-1, 0, 0), C['lampW'], C['frame'])
    # the diesel filler on the port side deck, the vent beside it
    fx = 4.15; fy = ysh(fx) - 0.16
    acyl(A, (fx, fy, zs(fx) + 0.008), (fx, fy, zs(fx) + 0.018), 0.042, s, seg=16); acyl(A, (fx, fy, zs(fx) + 0.018), (fx, fy, zs(fx) + 0.024), 0.03, s, seg=16)
    abox(A, fx - 0.008, fx + 0.008, fy - 0.02, fy + 0.02, zs(fx) + 0.024, zs(fx) + 0.034, C['steel'])
    vx, vz = fx + 0.30, zs(fx + 0.30) - 0.09; vy = y_at(vx, vz)                     # the tank's vent: a little stainless hood on the side
    acyl(A, (vx, vy - 0.002, vz), (vx, vy + 0.014, vz), 0.016, s, seg=10); obox(A, (vx, vy + 0.020, vz + 0.004), V((0.022, 0, 0)), V((0, 0.006, 0)), V((0, 0, 0.022)), C['steel'])


# ---------- the doghouse over the helm: the windscreen on the trunk's aft end, its sides on the gunwales, the hard top on them ----------
WSX = 3.95                   # the windscreen's foot on the trunk's top amidships
WS_K = 0.55                  # it leans aft 0.55 m a metre (about 29 degrees)
HT0, HTF, HTZ = 2.20, 3.62, 3.56                             # the hard top: its after edge, its fore edge, its underside
HTW = 1.02                   # the hard top's half width at the sides' heads
YSB = 1.24                   # the sides' foot on the gunwale (and forward of the bulkhead on the side deck)
XP = 2.93                    # the post at the side window's after edge
def side_y(z, x=None):
    """the doghouse's side, leaning in from its foot on the gunwale to the hard top's edge"""
    zb = zs(X_BH); return YSB - (YSB - HTW) * max(0.0, min(1.0, (z - zb) / (HTZ - zb)))
def ttop(x, y):
    """the trunk's top at (x, y)"""
    wt = cabin_w(x) - 0.04; return zct(x) + 0.06 * (1 - min(1.0, (y / wt) ** 2))
def ws_x(z, y=0.0):
    """the windscreen's raked face at height z: WSX at the trunk's top, leaning aft"""
    return WSX - WS_K * (z - ttop(WSX, 0.0))

def doghouse(A, G, fine=True):
    w = C['white']; s = lambda q: C['steel']; f = lambda q: C['frame']
    zt0 = ttop(WSX, 0.0); yc = 0.55
    # the panes: the middle one across the boat, the wings bent back to the trunk's after corner and the side, raked as one screen
    yk = cabin_w(X_BH + 0.04) - 0.06; zk = ttop(X_BH + 0.04, yk)
    xk = X_BH + 0.06; yso = side_y(zk)
    foot = [(WSX, -yc, ttop(WSX, yc)), (xk, -yk, zk), (xk, -yso, zk)]
    foot = [(p[0], p[1], p[2]) for p in reversed(foot)] + [(WSX, yc, ttop(WSX, yc)), (xk, yk, zk), (xk, yso, zk)]
    foot = [foot[0], foot[1], foot[2], foot[3], foot[4], foot[5]]
    # foot: stbd outer, stbd corner, stbd middle, port middle, port corner, port outer; heads straight over them on the raked face
    def head(p):
        dz = HTZ - p[2]; y = p[1]
        if abs(y) > yc + 0.01: y = math.copysign(HTW, y)
        else: y = math.copysign(min(abs(y), 0.52), y)
        return (p[0] - WS_K * dz, y, HTZ)
    H = [head(p) for p in foot]
    # glass: the middle pane, and each wing in two triangles' worth (its foot bends at the trunk's corner)
    G.poly([foot[2], foot[3], H[3], H[2]], C['glass'], (1, 0, 0.5))
    for a, b, c in ((1, 2, None), (4, 3, None)):
        G.poly([foot[a], foot[b], H[b], H[a]], C['glass'], (1, math.copysign(0.6, foot[a][1]), 0.5))
    for a, b in ((0, 1), (5, 4)):
        G.poly([foot[a], foot[b], H[b], H[a]], C['glass'], (0.6, math.copysign(1, foot[a][1]), 0.4))
    # the frame: the black U-channel along the foot, the posts at every bend, the head rail under the hard top
    for a, b in zip(foot, foot[1:]): acyl(A, a, b, 0.018, f, seg=6)
    for p, h in zip(foot, H): acyl(A, p, h, 0.02, f, seg=6)
    for a, b in zip(H, H[1:]): acyl(A, (a[0], a[1], a[2] - 0.015), (b[0], b[1], b[2] - 0.015), 0.018, f, seg=6)
    # the bulkhead's extension out to the doghouse's side, under the wings' outer feet (the doghouse's front corner)
    for sg in (1, -1):
        zb = zs(X_BH); A.poly([(X_BH, sg * cabin_w(X_BH), zb + 0.01), (X_BH, sg * YSB, zb), (xk, sg * yso, zk), (xk, sg * yk, zk)], w, (-1, 0, 0))
        A.poly([(xk, sg * yk, zk), (xk, sg * yso, zk), (xk + 0.02, sg * yso, zk - 0.004), (xk + 0.02, sg * yk, zk - 0.004)], w, (0, 0, 1))
    # the sides: a white panel from the gunwale to the trunk's top, the window over it to the hard top, between the post and the wing
    for sg in (1, -1):
        P = lambda x, z: (x, sg * side_y(z), z)
        zb_ = lambda x: zs(x) - 0.003
        xs = [XP + (X_BH - XP) * k / 6 for k in range(7)]
        for a, b in zip(xs, xs[1:]): A.poly([P(a, zb_(a)), P(b, zb_(b)), P(b, zk), P(a, zk)], w, (0, sg, 0.15))
        A.poly([P(X_BH, zb_(X_BH)), P(xk, zk), P(xs[-1], zk)], w, (0, sg, 0.15))
        G.poly([P(XP, zk), P(xk, zk), H[5 if sg > 0 else 0][:1] + (sg * HTW, HTZ), P(XP, HTZ)], C['glass'], (0, sg, 0.15))
        for z in (zk,): acyl(A, P(XP, z), P(xk, z), 0.016, f, seg=6)
        acyl(A, P(XP, zb_(XP)), P(XP, HTZ + 0.01), 0.024, s, seg=8)                  # the post, stainless, at the window's after edge
        acyl(A, (XP, sg * (gunwale_y(XP)), zs(XP) - 0.003), (XP, sg * gunwale_y(XP), zs(XP) + 0.008), 0.034, s, seg=10)
        # the after posts, from the gunwale to the hard top's after corners, on their bases
        xa = HT0 + 0.12; pa = (xa, sg * gunwale_y(xa), zs(xa) - 0.003)
        acyl(A, pa, (xa, sg * (HTW - 0.02), HTZ + 0.01), 0.024, s, seg=8); acyl(A, pa, (pa[0], pa[1], pa[2] + 0.011), 0.034, s, seg=10)
        # a grab rail along the hard top's edge underneath
        if fine:
            for x in (HT0 + 0.35, HT0 + 0.95): acyl(A, (x, sg * (HTW - 0.10), HTZ), (x, sg * (HTW - 0.10), HTZ - 0.06), 0.009, s, seg=6)
            acyl(A, (HT0 + 0.35, sg * (HTW - 0.10), HTZ - 0.06), (HT0 + 0.95, sg * (HTW - 0.10), HTZ - 0.06), 0.011, s, seg=6)
    # the hard top: a moulded lid with a rounded lip, its underside lined, the crown on top
    n = 7 if fine else 2; ro = []
    for cx, cy, a0, r in ((HTF - 0.22, -HTW + 0.22, -90, 0.25), (HTF - 0.22, HTW - 0.22, 0, 0.25), (HT0 + 0.12, HTW - 0.12, 90, 0.15), (HT0 + 0.12, -HTW + 0.12, 180, 0.15)):
        for k in range(n + 1): a = math.radians(a0 + 90 * k / n); ro.append((cx + (r - 0.0) * math.cos(a) + 0.03 * math.cos(a), cy + (r + 0.03) * math.sin(a)))
    A.poly([(x, y, HTZ) for x, y in ro], C['inner'], (0, 0, -1))
    crown = lambda x, y: HTZ + 0.10 + 0.03 * (1 - (y / (HTW + 0.03)) ** 2)
    ri = [(HT0 + 0.12 + (x - HT0 - 0.12) * 0.94, y * 0.94) for x, y in ro]
    for i in range(len(ro)):
        a, b = ro[i], ro[(i + 1) % len(ro)]; c, d = ri[(i + 1) % len(ri)], ri[i]
        A.poly([(a[0], a[1], HTZ), (b[0], b[1], HTZ), (b[0], b[1], HTZ + 0.10), (a[0], a[1], HTZ + 0.10)], w, (b[1] - a[1], -(b[0] - a[0]), 0))
        A.poly([(a[0], a[1], HTZ + 0.10), (b[0], b[1], HTZ + 0.10), (c[0], c[1], crown(*c)), (d[0], d[1], crown(*d))], w, (0, 0, 1))
    A.poly([(x, y, crown(x, y)) for x, y in ri], C['nonslip'], (0, 0, 1))
    if not fine: return
    # the wipers on the middle pane and the skipper's (starboard): the motor on the head rail, the arm and the blade on the glass
    for yw in (0.0, -0.78):
        hp_ = (ws_x(HTZ - 0.04) + 0.03, yw, HTZ - 0.04)
        acyl(A, (hp_[0] - 0.04, yw, hp_[2]), (hp_[0] + 0.012, yw, hp_[2]), 0.02, f, seg=8)
        zb2 = HTZ - 0.50; bp = (ws_x(zb2) + 0.028, yw + 0.10, zb2)
        acyl(A, (hp_[0] + 0.012, yw, hp_[2]), bp, 0.006, f, seg=5)
        acyl(A, (ws_x(zb2 + 0.18) + 0.024, yw + 0.10, zb2 + 0.18), (ws_x(zb2 - 0.18) + 0.024, yw + 0.10, zb2 - 0.18), 0.007, lambda q: C['rubber'], seg=5)

# the helm on the starboard side against the bulkhead: the console with the dash, the wheel, the lever, the plotter, the compass and the
# engine's panel, the VHF overhead, the seat; the skipper stands on the sole with the seat at his back (snekke-grunnlag kap. 6.2)
HX0, HY0, HY1 = 3.40, -1.10, -0.28                         # the console's after face, its sides
DASH = ((3.42, 2.44), (3.73, 2.72))                         # the dash's foot and top (x, z), sloping up forward toward the skipper
WHEEL = (3.36, -0.68, 2.36); WHEEL_AX = (-1.0, 0.0, 0.55)    # the wheel's centre and its axis toward the skipper
SKIP = (2.95, -0.68)                                        # where the skipper stands
SEAT = (2.58, -0.68)
def dash_pt(t, y):
    (x0, z0), (x1, z1) = DASH; return V((x0 + (x1 - x0) * t, y, z0 + (z1 - z0) * t))
def dash_n():
    (x0, z0), (x1, z1) = DASH; return V((-(z1 - z0), 0, x1 - x0)).normalized()
SCR = {'plot': (-1.05, -0.83, 0.18, 0.70), 'eng': (-0.52, -0.33, 0.22, 0.78)}   # y from, to; t from, to on the dash
def helm(A, G, fine=True):
    w = C['white']
    zb = ZC
    # the console: moulded, its after face down to the sole, the dash sloping up to the bulkhead, its sides
    (x0, z0), (x1, z1) = DASH
    for y0_, y1_ in ((HY0, HY1),):
        A.poly([(HX0, y0_, zb), (HX0, y1_, zb), (HX0, y1_, z0), (HX0, y0_, z0)], w, (-1, 0, 0))
        A.poly([(HX0, y0_, z0), (HX0, y1_, z0), (x0, y1_, z0), (x0, y0_, z0)], w, (0, 0, 1))
        A.poly([(x0, y0_, z0), (x0, y1_, z0), (x1, y1_, z1), (x1, y0_, z1)], C['inner'], dash_n())
        for y, sg in ((y0_, -1), (y1_, 1)):
            A.poly([(HX0, y, zb), (X_BH - 0.002, y, zb), (X_BH - 0.002, y, z1), (x1, y, z1), (x0, y, z0), (HX0, y, z0)], w, (0, sg, 0))
    A.poly([(x1, HY0, z1), (x1, HY1, z1), (X_BH - 0.002, HY1, z1), (X_BH - 0.002, HY0, z1)], w, (0, 0, 1))
    if not fine: return
    n = dash_n()
    # the plotter and the engine's panel: bezels flush on the dash, the screens facing the skipper (up and aft); the compass on top
    for nm, (ya, yb_, ta, tb) in SCR.items():
        q = [dash_pt(ta, ya), dash_pt(ta, yb_), dash_pt(tb, yb_), dash_pt(tb, ya)]
        c = sum(q, V()) / 4
        F.loft(A, [[p + n * 0.002 for p in q], [p + n * 0.012 for p in q]], lambda i: C['bezel'], cap0=False, cap1=False)
        A.poly([c + (p - c) * 1.0 + n * 0.012 for p in q], C['bezel'], n)
        A.poly([c + (p - c) * 0.84 + n * 0.0125 for p in q], C['screen'], n)
    for k, yg in enumerate((-0.48, -0.37)):                     # the engine's gauges in the panel: rev counter and temperature
        F.atorus(A, dash_pt(0.50, yg) + n * 0.013, n, 0.035, 0.004, lambda a: C['chrome'], seg=16, rseg=4)
    cb = dash_pt(0.80, -0.68) + V((0.0, 0, -0.01))
    acyl(A, cb, cb + V((0, 0, 0.05)), 0.07, lambda q: C['dark'], seg=16)
    A_s = sphere('compass', cb + V((0, 0, 0.085)), 0.062, C['glass'], (1, 1, 0.7))
    HELM_EXTRA.append(A_s)
    # the switch panel under the wheel's side, the key
    cp = dash_pt(0.25, -0.95) + n * 0.003
    obox(A, cp, V((0, 0.07, 0)), (dash_pt(1, 0) - dash_pt(0, 0)).normalized() * 0.04, n * 0.004, C['switch'])
    for k in range(4): obox(A, cp + n * 0.005 + V((0, -0.05 + 0.033 * k, 0)), V((0, 0.009, 0)), V((0.004, 0, 0.01)), n * 0.004, C['lampG'] if k < 3 else C['lampR'])
    # the wheel (fittings.helm_wheel), its shaft into the console's after face
    F.helm_wheel(A, WHEEL, WHEEL_AX, 0.19, C['cush'], C['steel'], C['dark'])
    acyl(A, V(WHEEL) - V(WHEEL_AX).normalized() * 0.14, (HX0 + 0.004, WHEEL[1], WHEEL[2] + 0.02), 0.03, lambda q: C['dark'], seg=10)
    # the single lever on the console's inboard side, by the skipper's right hand
    F.single_lever(A, (HX0 + 0.13, HY1, 2.24), (0, 1, 0), (1, 0, 0), C['dark'], C['steel'], C['black'])
    # the VHF overhead under the hard top, its face down and aft to the skipper; the microphone on its clip
    vc = V((3.18, -0.62, HTZ - 0.055)); vn = V((-0.6, 0, -1)).normalized()
    obox(A, vc, V((0.09, 0, 0)), V((0, 0.10, 0)), V((0, 0, 0.05)), C['dark'])
    A.poly([vc + V((-0.091, -0.08, -0.03)), vc + V((-0.091, 0.08, -0.03)), vc + V((-0.091, 0.08, 0.03)), vc + V((-0.091, -0.08, 0.03))], C['screen'], (-1, 0, 0))
    obox(A, vc + V((-0.05, 0.13, -0.02)), V((0.02, 0, 0)), V((0, 0.015, 0)), V((0, 0, 0.04)), C['black'])
    # the seat on its pedestal behind the skipper
    F.helm_seat(A, (SEAT[0], SEAT[1], ZC), (1, 0, 0), 0.74, C['steel'], C['cush'])
HELM_EXTRA = []


# ---------- the mast on the hard top, the antennas, the lanterns, the work light ----------
MASTX = 3.02
def zh(x, y): return HTZ + 0.10 + 0.03 * (1 - (y / (HTW + 0.03)) ** 2)   # the hard top's crown
LAMP_X = 4.70                                                # the side lights on the trunk's sides between the first and second window
def lamp_z(): return ZCT - 0.15
def white_z(): return zh(MASTX, 0) + 1.10
def mast(A, fine=True):
    w = C['white']; s = lambda q: C['steel']
    zb = zh(MASTX, 0)
    # the tabernacle on the hard top, the mast in it (it folds aft for low bridges), the cross-tree, the all-round light on its head
    abox(A, MASTX - 0.07, MASTX + 0.07, -0.06, 0.06, zb - 0.004, zb + 0.10, C['alu'])
    if fine: acyl(A, (MASTX - 0.04, -0.075, zb + 0.07), (MASTX - 0.04, 0.075, zb + 0.07), 0.011, s, seg=8)
    acyl(A, (MASTX, 0, zb + 0.02), (MASTX, 0, white_z() - 0.07), 0.032, lambda q: w, seg=10, r1=0.026)
    abox(A, MASTX - 0.02, MASTX + 0.02, -0.24, 0.24, zb + 0.70, zb + 0.73, w)
    F.allround_lantern(A, (MASTX, 0, white_z()), C['lampW'], C['frame'])
    if not fine: return
    # the VHF whip on the hard top's after port corner, the GPS, the horn on the crown forward
    F.whip(A, (HT0 + 0.25, HTW - 0.18, zh(HT0 + 0.25, HTW - 0.18) - 0.06), 1.45, w, r0=0.012, r1=0.005, m_foot=C['steel'])
    F.gps(A, (HT0 + 0.30, -(HTW - 0.25), zh(HT0 + 0.3, HTW - 0.25)), w, r=0.06, h=0.08, m_post=C['steel'])
    acyl(A, (HTF - 0.25, 0.30, zh(HTF - 0.25, 0.3) + 0.03), (HTF - 0.10, 0.30, zh(HTF - 0.25, 0.3) + 0.05), 0.03, lambda q: C['steel'], seg=10, r1=0.05)
    abox(A, HTF - 0.30, HTF - 0.22, 0.27, 0.33, zh(HTF - 0.25, 0.3) - 0.004, zh(HTF - 0.25, 0.3) + 0.04, C['steel'])
    # the work light under the hard top's after edge, over the cockpit, aimed aft and down
    for yy in (-0.35, 0.35):
        c = V((HT0 + 0.10, yy, HTZ - 0.05)); acyl(A, c + V((0, 0, 0.05)), c, 0.012, lambda q: C['steel'], seg=6)
        obox(A, c, V((0.035, 0, -0.02)), V((0, 0.06, 0)), V((0.02, 0, 0.035)), C['dark'])
        A.poly([c + V((-0.037, -0.05, -0.03)), c + V((-0.037, 0.05, -0.03)), c + V((-0.03, 0.05, 0.03)), c + V((-0.03, -0.05, 0.03))], C['lens'], (-1, 0, -0.5))

def lanterns(A, fine=True):
    """the side lights on the trunk's sides between the first and second window, on a small plate, the trunk screening them inboard
    (fittings.side_lantern draws its own screen too)"""
    z = lamp_z()
    for sg, m in ((1, C['lampR']), (-1, C['lampG'])):
        y = sg * (trunk_y(LAMP_X, z) + 0.035)
        obox(A, (LAMP_X, sg * (trunk_y(LAMP_X, z) + 0.004), z), V((0.07, 0, 0)), V((0, 0.004, 0)), V((0, 0, 0.05)), C['frame'])
        F.side_lantern(A, (LAMP_X + 0.01, y, z), (1, 0, 0), (0, sg, 0), m, C['frame'], C['black'], R=0.03, H=0.05)


# ---------- the work at sea (snekke-grunnlag kap. 6.2): the boat's own gutting board over the port gunwale abreast of the hauler ----------
GUT = (1.55, 2.12)                                           # the board along the boat (x from, to)
def gut_top(): return ZC + 0.86
def gutting_board(A):
    """a white board across the port gunwale at working height, its outer edge a little over the side so the offal goes into the sea,
    a lip along its inboard edge; two stainless brackets from the gunwale's top up under it, and two struts down to the liner"""
    x0, x1 = GUT; zt = gut_top(); yo = max(ysh(x0), ysh(x1)) + 0.03; yi_ = 0.80
    abox(A, x0, x1, yi_, yo, zt - 0.03, zt, C['board'])
    abox(A, x0, x1, yi_, yi_ + 0.025, zt, zt + 0.03, C['board'])
    for x in (x0 + 0.08, x1 - 0.08):
        g = gunwale_y(x); p0 = (x, g, zs(x) - 0.003)
        acyl(A, p0, (x, g, zt - 0.03), 0.014, lambda q: C['steel'], seg=8); acyl(A, p0, (p0[0], p0[1], p0[2] + 0.01), 0.026, lambda q: C['steel'], seg=10)
        q = (x, yb(x) + 0.05 * 0 + (yi(x) - yb(x)) * 0.5, (ZC + zs(x)) / 2 + 0.05)
        acyl(A, (x, yi_ + 0.06, zt - 0.03), (q[0], q[1] - 0.012, q[2]), 0.012, lambda q_: C['steel'], seg=8)


def build(fine=True):
    HELM_EXTRA.clear()
    M = Mesh('hull'); hull_shell(M, fine)
    # the paint lines cut into the outside on planes rising forward (they follow the sheer), each face painted by its side of them
    for z in (Z_AF, Z_BT):
        g = [f for f in M.bm.faces if f[M.kind] == 1]
        ge = list(set(e for f in g for e in f.edges)); gv = list(set(v for f in g for v in f.verts))
        bmesh.ops.bisect_plane(M.bm, geom=g + ge + gv, dist=1e-6, plane_co=(XM, 0, z), plane_no=V((-SLB, 0, 1)).normalized())
    for f in M.bm.faces:
        if f[M.kind] == 1:
            c = f.calc_center_median(); f.material_index = M.mi(C['af'] if c.z < paint_line(c.x, Z_AF) else C['boot'] if c.z < paint_line(c.x, Z_BT) else C['hull'])
    hull = M.done(30)
    if fine: cut_holes(hull)
    tint(hull)
    A = Acc('fit'); G = Acc('glass')
    if fine: linings(A, G, fine)
    deck_fittings(A, fine); doghouse(A, G, fine); helm(A, G, fine); mast(A, fine); lanterns(A, fine)
    if fine: gutting_board(A)
    out = [hull, A.done(35, tint=wear), underwater(fine)] + HELM_EXTRA
    g = G.done(35)
    return [o for o in out if o], [g] if g else [box('noglass', 0, 0.01, 0, 0.01, -50, -49.99, C['glass'])]


def to_game(p): return (-p[1], p[2] - WL, -(p[0] - XM))
def to_game_n(n): return (-n[1], n[2], -n[0])

def name_strips(G):
    """where the name is written (vessel3d.js nameStrips): a strip on each bow under the band, a hand aft of the stem, and one across the
    transom between the scuppers and its top (the name and home port belong on the stern as well)"""
    out = []; zt = lambda x: zs(x) - BAND[0] - 0.08
    for sg, xs in ((1, [6.35 - 1.05 * k / 12 for k in range(13)]), (-1, [5.3 + 1.05 * k / 12 for k in range(13)])):
        B = []; T = []
        for x in xs:
            for arr, dz in ((B, 0.27), (T, 0.0)):
                z = zt(x) - dz; arr.append(G(x, sg * (y_at(x, z) + 0.03), z))
        out.append([B, T])
    zb, zt0 = ZC + 0.12, ZC + 0.38; ys = [0.36 - 0.72 * k / 12 for k in range(13)]          # port to starboard: left to right seen from astern
    out.append([[G(x_of(0.0, zb) - 0.02, y, zb) for y in ys], [G(x_of(0.0, zt0) - 0.02, y, zt0) for y in ys]])
    return out

def kit_places(G):
    """the places where the game sets the deck kit (nothing that can be bought is modelled in, only its place, 19.10.2026): the liferaft
    in its cradle on the starboard side of the hard top, the radome on the port side of it; the ring buoys on the stern rail's side runs,
    facing out (the first, with the light and the line, to starboard); the 300 l catch tub aft on the centre line, where the gutted and
    iced fish go; the net tub, the line tubs and the freight forward in the cockpit to port (the net and the line rig never stand
    together), clear of the skipper, the seat and the bleeding tub to starboard"""
    r = lambda a: round(a, 3); zt = zh(2.75, 0.55)
    yr = lambda x: gunwale_y(x)
    zb = (zs(1.40) + zs(0.75)) / 2 + 0.60; yb_ = (yr(1.40) + yr(0.75)) / 2 + 0.02; a = math.atan2(yr(1.40) - yr(0.75), 0.65)
    return {'raft': [G(2.72, -0.55, zt) + [r(math.pi / 2)]],
            'buoys': [G(1.07, -yb_, zb) + [r(math.pi / 2 - a)], G(1.07, yb_, zb) + [r(-(math.pi / 2 - a))]],
            'radar': G(2.72, 0.60, zt),
            'tubs': [G(0.74, 0.0, ZC) + [0.0, 300]],
            'garn': {'at': G(2.72, 0.68, ZC), 'ry': 0.0},
            'stamps': {'at': G(2.50, 0.90, ZC), 'ry': r(math.pi / 2)},
            'cargo': [G(2.72, 0.66, ZC) + [0.0]]}

# the boat's own anchor (tools/deck/anker.py, drawn and let go by the game): a plough on the bow roller
def bower(G):
    return {'kind': 'plog', 'kg': 8, 'fair': G(7.96, 0, zs(7.75) + 0.075), 'side': 0}

def anchors():
    G = lambda x, y, z: [round(v, 3) for v in to_game((x, y, z))]
    hx = 2.05; hy = -(ysh(hx) - 0.12); px, py = POLE
    return {'bower': bower(G), 'eye': G(SKIP[0], SKIP[1], ZC + 1.65), 'skipperAt': G(SKIP[0], SKIP[1], ZC), 'hp': -0.32, 'fov': 62,
            # the hands: the fisher at the hauler on the starboard gunwale, the one who guts at the board to port, one aft by the catch tub
            'crewSpots': [G(1.98, -0.62, ZC) + [1.57], G(1.84, 0.42, ZC) + [-1.57], G(1.05, -0.05, ZC) + [3.14]],
            # typed lights (B8; rule 23 (d)(i), under 12 m): the all-round white on the mast on the hard top, 2 m over the side lights
            # (annex I 2(d)); the side lights on the trunk's sides; the stern light on the flag staff's head; the work light under the hard top
            'lights': [[G(MASTX, 0, white_z()), [1, 0.95, 0.85], 'allround'],
                       [G(LAMP_X + 0.01, trunk_y(LAMP_X, lamp_z()) + 0.065, lamp_z()), [1, 0.12, 0.1], 'port'],
                       [G(LAMP_X + 0.01, -(trunk_y(LAMP_X, lamp_z()) + 0.065), lamp_z()), [0.1, 1, 0.35], 'stbd'],
                       [G(px - 0.105, py, zs(XA) + 0.96), [1, 0.95, 0.85], 'stern'],
                       [G(HT0 + 0.08, 0.0, HTZ - 0.06), [1, 0.95, 0.85], 'work']],
            # the companionway in the bulkhead (the real door into the cabin), its sill on the sole; the crew go in here
            'doors': [{'at': G(X_BH - 0.03, (DOOR[0] + DOOR[1]) / 2, ZC), 'w': round(DOOR[1] - DOOR[0], 2), 'h': round(DOOR[3] - ZC, 2),
                       'in': G(4.4, (DOOR[0] + DOOR[1]) / 2, WL + 0.15), 'to': 'cabin', 'hinge': 'stbd'}],
            'names': name_strips(G),
            # the open cockpit aft: the hauler on the starboard gunwale abreast of the board, the gear in the cockpit
            'deck': {'y': round(ZC - WL, 3), 'z': round(-(1.4 - XM), 3)}, 'gw': round(zs(1.5) - WL, 3),
            'stern': round(XM - XA, 3), 'bow': round(-(XF - XM), 3), 'side': HB, 'beam': BEAM, 'pl': 2.6, 'rl': 1.2, 'open': True, 'hand': False,
            'pole': G(px - 0.10, py, zs(XA) + 0.90), 'hauler': G(hx, hy, zs(hx) + 0.42), 'filler': G(4.15, ysh(4.15) - 0.16, zs(4.15) + 0.06),
            # the work at sea, in its order (snekke-grunnlag kap. 6.2): the fisher at the starboard gunwale by the hauler; the bleeding tub
            # on the sole just aft of him; the gutting board is the boat's own, over the port gunwale abreast of him (own: the game draws
            # no table; top: where the fish lie), the one who guts on the sole inboard of it; the iced catch in the 300 l tub aft (kit.tubs)
            'work': {'table': G(sum(GUT) / 2, 1.08, ZC), 'tub': G(1.50, -0.80, ZC), 's': 0.75, 'own': True, 'top': round(gut_top() - WL, 3)},
            'kit': kit_places(G)}


# ---------- the checks against the tables, the data and the rules ----------
def check():
    out = []
    xs = [XA + (XF - XA) * i / 400 for i in range(401)]
    def area(x, wl):
        s = section(x); a = 0.0
        for (y0, z0, _), (y1, z1, _) in zip(s, s[1:]):
            za, zb = min(z0, wl), min(z1, wl)
            if z1 > z0 and za < wl: a += (y0 + y1) / 2 * (zb - za)
        return 2 * a
    vol = lambda wl: sum((area(xs[i], wl) + area(xs[i + 1], wl)) / 2 * (xs[i + 1] - xs[i]) for i in range(400))
    v = vol(WL); wl1 = WL
    for _ in range(60):
        if vol(wl1) * 1.025 > DISP: wl1 -= 0.005
        else: break
    out.append(('deplasement %.2f t ved vannlinja (%.2f m over kjølen) mot %.1f t i VESSELS; %.1f t gir vannlinja %.2f m lavere' % (v * 1.025, WL, DISP, DISP, WL - wl1), True))
    loa = XF - x_of(XA, zs(XA))
    out.append(('lengde over alt %.2f m (speilets topp til stevnens topp; baugrulla til %.2f) mot %.1f' % (loa, 7.96 + 0.035, L), abs(loa - L) / L < 0.01))
    mb = max(ysh(x) for x in xs[::4]) + 0.012
    out.append(('største bredde %.2f m (over det mørke båndet) mot %.1f' % (2 * mb, BEAM), abs(2 * mb - BEAM) / BEAM < 0.03))
    out.append(('dypgang %.2f m med kjølen (skoen %.3f under) mot %.1f' % (WL - min(kb(x) for x in xs if x >= X_KA), 0.006, DRAFT), abs(WL - min(kb(x) for x in xs if x >= X_KA) - DRAFT) < 0.02))
    out.append(('fribord midtskips %.2f m, ved stevnen %.2f, ved speilet %.2f; cockpitdørken %.2f over vannet' % (zs(XM) - WL, zs(XF) - WL, zs(XA) - WL, ZC - WL), ZC - WL > 0.3))
    wz, lz = white_z(), lamp_z()
    out.append(('den hvite rundtlysende %.2f m over sidelanternene (vedlegg I 2(d): minst 1 m)' % (wz - lz), wz - lz >= 1.0))
    hs, hw = lz - zs(LAMP_X), wz - zs(MASTX)
    out.append(('sidelanternene %.2f m over skroget, den hvite %.2f (vedlegg I 2(g): sidene høyst tre firedeler så høyt, %.2f)' % (hs, hw, 0.75 * hw), hs <= 0.75 * hw))
    px, py = POLE
    out.append(('masta med den hvite står %.1f m fra flaggstanga og over den: spillet gir vimpel (båten har mast)' % math.hypot(MASTX - px, py), math.hypot(MASTX - px, py) > 1.0 and wz > zs(XA) + 0.96))
    tip = PROP[2] + PR; low = PROP[2] - PR
    out.append(('propellen: %.2f m klaring til skroget over, %.2f til skoen under, %.2f til kjølen forut, %.2f til roret akter' % (zr(PROP[0]) - tip, low - 0.042, X_KA - PROP[0] - 0.06, PROP[0] - 0.06 - RX),
                zr(PROP[0]) - tip > 0.08 and low - 0.042 > 0.05 and X_KA - PROP[0] - 0.06 > 0.1 and PROP[0] - 0.06 - RX > 0.1))
    out.append(('styrehuset: %.2f m under taket over dørken der skipperen står (brotest: 1.8 for den som står)' % (HTZ - ZC), HTZ - ZC >= 1.8))
    ey = ZC + 1.65
    out.append(('øyet %.2f m over vindskjermens fot, %.2f under taket' % (ey - ttop(WSX, 0), HTZ - ey), ey - ttop(WSX, 0) > 0.2 and HTZ - ey > 0.15))
    out.append(('sløyebordet %.2f m over dørken, ytterkanten %.2f m utenfor ripa (vessel3d: bredden ±5 %%)' % (gut_top() - ZC, 0.03), 0.8 <= gut_top() - ZC <= 0.95))
    for s, ok_ in out: print(('OK   ' if ok_ else 'FEIL ') + s)
    return all(o for _, o in out)


SHOTS = [('bow3q', (14.5, -7.5, 3.4), (3.9, 0, 2.1), 40), ('stern3q', (-6.0, 6.5, 4.0), (3.4, 0, 2.1), 35), ('side', (3.9, 16, 2.2), (3.9, 0, 2.1), 35),
         ('above', (9.0, -6.0, 8.4), (3.5, 0, 1.8), 35), ('cockpit', (-2.2, -2.6, 4.4), (2.4, 0, 1.8), 35), ('bow', (13.0, -2.5, 2.6), (4.0, 0, 2.2), 40)]
EYE = (SKIP[0], SKIP[1], ZC + 1.65)
CLOSE = [('c_helm', (2.6, -0.2, 3.1), (3.5, -0.75, 2.45), 30, False, False), ('c_screen', (4.8, -2.2, 3.0), (3.7, -0.6, 3.0), 30, False, False),
         ('c_stern', (-2.2, -1.6, 1.9), (0.1, 0, 1.6), 30, True, False), ('c_bow', (9.0, -1.4, 3.1), (7.6, 0, 2.5), 30, False, False),
         ('c_aperture', (0.8, -2.6, 0.4), (0.8, 0, 0.45), 30, False, False), ('c_work', (1.0, 0.0, 3.6), (1.9, 0.2, 1.8), 28, False, False)]

def main():
    os.makedirs(OUT, exist_ok=True)
    if 'check' in sys.argv: sys.exit(0 if check() else 1)
    check()
    reset(); colours()
    solids, glass = build(True)
    join(solids, 'BOAT0'); join(glass, 'GLASS0')
    if 'fast' not in sys.argv and 'dry' not in sys.argv: beauty(OUT, 'sn26', WL, SHOTS)
    ex = {'frame': 'kystfiske: x starboard, y up from the waterline, z aft; metres', 'type': 'snekke', 'name': 'Plastsnekke 26 fot', 'len': L, 'beam': BEAM, 'draft': DRAFT,
          'anchors': anchors()}
    export_boat(build, to_game, to_game_n, OUT, 'snekke26.glb', os.path.join(ROOT, 'src', 'data', 'boat-snekke26.b64'), ex,
                side=(os.path.join(ROOT, 'src', 'data', 'boat-snekke26-side.b64'), 3.9, 2.0, 9.5), dry='dry' in sys.argv)


if __name__ == '__main__':
    main()
