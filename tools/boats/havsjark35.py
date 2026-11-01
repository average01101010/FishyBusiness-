"""The havsjark 35 ft (10.57 m; the type is `sjark` in VESSELS): a heavy fibreglass displacement sjark with a long ballast keel, the
wheelhouse amidships on a short forecastle (bakk), the hold and a gear room aft, a tall mast with a derrick and the fishing lights, and a
riding sail on the aft mast. The first script (02.10.2026) was measured on the yard's profile and general arrangement of the Viksund
Havsjark 35 (the make is only named here and in the docs, CLAUDE.md; profile 156.3 px/m, plan 152 px/m, both set to 10.57 m overall;
the drawings are not in the repository): the keel and the forefoot, the stem, the transom's rake, the sheer with the low starboard
waist and the forecastle, the fender strake, the half-breadths at the bulwark, the wheelhouse with its windows, the gear room, the hold's
hatch, the hauling station, the masts, the derrick and the riding sail. Those tables are kept as they were measured (marked G).

Rebuilt 01.11.2026 after the pilot boat's way of working (docs/skipsmodeller/havsjark-grunnlag.md, sulebas-bygging.md; Jonas: «Løft den
til samme nivå og arbeidsmåte som pilotbåten ringnot38 og de reviderte båtene»). The old hull was two loose grids and a transom ladder,
with the ballast keel a body of its own hung under it; now the hull is ONE surface: both sides over the keel (the section starts on the
keel's underside, so the keel is part of it, with a hollow root), the transom, the fender strake, the bulwarks' caps and insides, the
aft deck, the forecastle's bulkhead and deck share their points (Mesh). Openings are real holes, cut with a boolean and lined: the
portholes, the freeing ports, the hatches, the outlets, the wheelhouse's windows and door, the gear room's door and vent. Nothing lies in
the plane of anything else. The fittings other boats use come from fittings.py.

Nothing that can be bought is modelled in (the game sets the kit at the places in kit, 19.10.2026): no hauler, no tubs, no liferaft, no
radar, no ring buoys. The plotter and the VHF are standard on this boat (VESSELS.sjark.std) and are part of her. The riding sail is two
parts of its own the game shows by the state (set at sea, furled in port: M5).

    pip install bpy==4.5.4   (Python 3.11)
    python3 tools/boats/havsjark35.py            -> src/data/boat-havsjark35.b64 (+ the side picture), renders in tools/boats/out/
    python3 tools/boats/havsjark35.py fast       -> the same without the renders
    python3 tools/boats/havsjark35.py fast dry   -> no renders, the GLB only in tools/boats/out
    python3 tools/boats/havsjark35.py check      -> the checks against the tables, the data, the rules and the game's demands only

Frame (the drawings'): x forward from the aft end of the hull at the fender strake, y to port, z up from the waterline (WL = 0)."""
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy, bmesh
from bpyutil import *
import bpyutil
import fittings as F
from mathutils import noise

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE)); OUT = os.path.join(HERE, 'out')
L = 10.57; BEAM = 4.1; DRAFT = 1.6; DISP = 12.0             # VESSELS.sjark
WL = 0.0; XA = 0.0; XF = 10.60; XM = XF / 2; HB_ = BEAM / 2


# ---------- the measured lines (G: the yard's drawings, metres) ----------
# the bottom of the hull body on the centreline, then up the stem; the stem knuckles at the strake (G)
LOW = [(0.0, -0.18), (1.0, -0.33), (2.0, -0.50), (3.0, -0.64), (4.0, -0.74), (5.0, -0.80), (6.0, -0.82), (7.0, -0.78), (8.0, -0.66),
       (8.6, -0.50), (9.1, -0.29), (9.5, 0.0), (9.8, 0.44), (10.1, 0.88), (10.35, 1.24), (10.56, 1.55), (10.585, 1.78), (XF, 1.98)]
def z_low(x): return interp(LOW, x)
# the top of the bulwark: the aft deck, the low waist where the line comes in (starboard only), the forecastle from 6.05 (G)
def z_bakkcap(x): return 1.80 + 0.18 * max(0.0, min(1.0, (x - 6.05) / 4.55)) ** 1.3
def ss(a, b, x): t = max(0.0, min(1.0, (x - a) / (b - a))); return t * t * (3 - 2 * t)
def z_cap(x, sg=1):
    if sg < 0:      # starboard: down to the hauling waist and up to the forecastle
        return 1.48 - 0.20 * ss(3.40, 3.85, x) + (z_bakkcap(x) - 1.28) * ss(5.35, 6.05, x)
    return 1.48 + 0.02 * ss(3.40, 5.35, x) + (z_bakkcap(x) - 1.50) * ss(5.35, 6.05, x)
# the half-breadth at the bulwark top, moulded (the plan's outline less the strake) (G)
HB = [(0.0, 1.70), (0.14, 1.76), (0.41, 1.79), (0.74, 1.81), (1.38, 1.84), (2.04, 1.87), (2.70, 1.90), (3.36, 1.93), (4.03, 1.96), (4.68, 1.98),
      (5.34, 1.99), (6.00, 1.98), (6.66, 1.96), (7.32, 1.92), (7.97, 1.83), (8.63, 1.68), (9.29, 1.43), (9.62, 1.26), (9.95, 1.03), (10.28, 0.70),
      (10.47, 0.38), (10.56, 0.16), (XF, 0.0)]
def hb(x): return interp(HB, x)
# the section's deadrise, flare and bilge radius (the drawings say nothing under the water: chosen 02.10.2026, kept; check() weighs them)
DR = [(0.0, 8), (2.0, 12), (4.0, 16), (6.0, 20), (7.5, 28), (8.5, 40), (9.3, 55), (10.0, 68), (XF, 75)]
FL = [(0.0, 2), (3.0, 3), (6.0, 5), (7.5, 9), (8.5, 15), (9.5, 22), (XF, 28)]
FULL = [(0.0, 0.92), (3.0, 0.97), (6.0, 0.97), (7.5, 0.90), (8.5, 0.78), (9.5, 0.66), (XF, 0.56)]   # how full the bilge is (the cubic's pull toward the corner)
RB = [(0.0, 0.45), (2.0, 0.55), (5.0, 0.62), (7.0, 0.7), (8.5, 0.8), (9.5, 0.6), (10.2, 0.35), (XF, 0.2)]
# the fender strake (G), the painted line under it, the bottom paint
RUB = [(0.0, 1.05), (2.0, 1.07), (4.0, 1.12), (6.0, 1.18), (7.74, 1.25), (9.0, 1.38), (10.0, 1.50), (10.56, 1.60)]
def z_rub(x): return interp(RUB, x)
RUBH, RUBW = 0.055, 0.05     # the strake: half its height, how far it stands out
def z_line(x): return 0.66 + 0.012 * x
Z_AF = 0.06; Z_BT = 0.16; SLB = 0.012       # the antifouling and the black boot top, rising 12 mm a metre forward (planliste kap. 29)
def paint_line(x, z0): return z0 + SLB * (x - XM)
def z_deck(x): return 0.56 + 0.01 * x
def z_bk(x): return z_bakkcap(x) - 0.06
X_BAKK = 6.05
def dk(x): return z_deck(x) if x < X_BAKK else z_bk(x)
# the transom rakes aft from the bottom to the strake, and the bulwark above it leans in (G)
def x_t(z): return 0.30 - 0.2857 * z if z <= 1.05 else (z - 1.05) * 0.42
def x_of(s, z): return s + x_t(z) * max(0.0, 1.0 - s)          # a station's points: the first metre follows the transom's rake
# the ballast keel's underside from the propeller's aperture to the forefoot (G; the last point meets the forefoot of LOW), and its
# thickness (chosen)
KEEL = [(1.79, -1.78), (3.58, -1.68), (4.22, -1.60), (6.0, -1.45), (8.06, -1.20), (8.6, -1.05), (9.02, -0.75), (9.30, -0.40), (9.5, 0.0)]
def keel_t(x): return interp([(1.79, 0.24), (2.4, 0.32), (6.5, 0.32), (8.5, 0.22), (9.5, 0.14)], x)
X_KA, X_KF = 1.79, 9.5       # the keel's after edge (the propeller's aperture aft of it) and where it runs into the forefoot


# ---------- the sections ----------
def vline(x, sg=1):
    """the body's half-section at x from the centreline (the bottom of the body) to the bulwark top on side sg, as (y, z): a bottom line
    with deadrise, a round bilge filleted into a side line with flare (the first script's section, without the keel)"""
    zl = z_low(x); zs = z_cap(x, 1); h = hb(x); n = 48
    if h < 1e-4 or zs - zl < 1e-4: P = [(0.0, zl), (0.0, zs)]
    else:
        dr = math.radians(interp(DR, x)); fl = math.radians(interp(FL, x)); r = interp(RB, x)
        d1 = (math.cos(dr), math.sin(dr)); d2 = (-math.sin(fl), -math.cos(fl))
        den = d1[0] * d2[1] - d1[1] * d2[0]
        s_ = (h * d2[1] - (zs - zl) * d2[0]) / den
        C = (d1[0] * s_, zl + d1[1] * s_)
        if s_ <= 0 or C[1] >= zs or C[0] >= h + 1e-6:
            P = [(h * k / n, zl + (zs - zl) * k / n) for k in range(n + 1)]
        else:
            # a cubic from the keel's root out along the deadrise and round the bilge up along the flare to the sheer: its control points
            # pulled toward the corner by the fullness, so the section changes smoothly from station to station (the first script's arc
            # jumped where the deadrise rose fast toward the stem: the bow was lumpy, Jonas 01.11.2026)
            lb = math.hypot(h - C[0], zs - C[1]); a = interp(FULL, x)
            P0 = (0.0, zl); P1 = (d1[0] * s_ * a, zl + d1[1] * s_ * a); P3 = (h, zs); P2 = (h + d2[0] * lb * a, zs + d2[1] * lb * a)
            P = []
            for k in range(n + 1):
                t = (k / n) ** 1.15; u = 1 - t
                P.append((u ** 3 * P0[0] + 3 * u * u * t * P1[0] + 3 * u * t * t * P2[0] + t ** 3 * P3[0], u ** 3 * P0[1] + 3 * u * u * t * P1[1] + 3 * u * t * t * P2[1] + t ** 3 * P3[1]))
    if sg < 0: P = clip(P, z_cap(x, -1))
    return P

def clip(P, ztop):
    out = [P[0]]
    for a, b in zip(P, P[1:]):
        if b[1] >= ztop:
            t = (ztop - a[1]) / max(1e-9, b[1] - a[1]); out.append((a[0] + (b[0] - a[0]) * t, ztop)); return out
        out.append(b)
    return out

def z_on(P, y):
    """the height of the polyline at half-breadth y (it rises in y from the centreline)"""
    if y <= P[0][0]: return P[0][1]
    for a, b in zip(P, P[1:]):
        if a[0] <= y <= b[0] and b[0] > a[0]: return a[1] + (b[1] - a[1]) * (y - a[0]) / (b[0] - a[0])
    return P[-1][1]

def from_y(P, y):
    """the polyline from half-breadth y on"""
    for i, (a, b) in enumerate(zip(P, P[1:])):
        if b[0] >= y > a[0] - 1e-9 and b[0] > a[0]:
            t = (y - a[0]) / (b[0] - a[0]); return [(y, a[1] + (b[1] - a[1]) * t)] + P[i + 1:]
    return [P[-1]]

def along(P, z0, z1, n):
    """n points along the polyline P (rising in z) from height z0 to z1, evenly by length, the first after z0, the last at z1"""
    if z1 <= z0 + 1e-6:
        q = at_z(P, z0); return [q] * n
    pts = [at_z(P, z0)] + [p for p in P if z0 < p[1] < z1] + [at_z(P, z1)]
    Lc = [0.0]
    for a, b in zip(pts, pts[1:]): Lc.append(Lc[-1] + math.hypot(b[0] - a[0], b[1] - a[1]))
    out = []
    for k in range(1, n + 1):
        s = Lc[-1] * k / n
        for i in range(1, len(Lc)):
            if Lc[i] >= s - 1e-12:
                t = (s - Lc[i - 1]) / max(1e-12, Lc[i] - Lc[i - 1]); a, b = pts[i - 1], pts[i]; out.append((a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t)); break
    return out

def at_z(P, z):
    if z <= P[0][1]: return P[0]
    for a, b in zip(P, P[1:]):
        if a[1] <= z <= b[1] and b[1] > a[1]: t = (z - a[1]) / (b[1] - a[1]); return (a[0] + (b[0] - a[0]) * t, z)
    return P[-1]

def wk(x):
    """the keel's (the stem's) half width at its underside"""
    if x < X_KA: return 0.0
    if x <= X_KF: return keel_t(x) * 0.36
    return interp([(X_KF, keel_t(X_KF) * 0.36), (XF, 0.03)], x)
def wroot(x): return wk(x) * 1.45 if x <= X_KF else wk(x)
def kb(x): return interp(KEEL, x) if x <= X_KF else z_low(x)

NKB, NF = 4, 3               # rows up the keel's side, and in the fillet at its root
_S = {}
def section(x, sg=1, fine=True):
    """the whole half-section at x on side sg as (y, z, kind) from the keel's underside on the centreline to the bulwark top; the counts
    never change (points collapse where a band is empty: aft of the keel, at the stem). Kinds: 'k' the keel, 'f' the fillet at its
    root, 'b' the bottom, 't' the topside, 'n' the red line, 'r' the fender strake, 's' the bulwark top"""
    key = (round(x, 5), sg, fine)
    if key in _S: return _S[key]
    P = vline(x, sg); zl = P[0][1]; top = P[-1][1]; out = []
    nk = NKB if fine else 1; nf = NF if fine else 1
    if x >= X_KA:
        b = kb(x); f = min(1.0, (x - X_KA) / 0.10); ww = wk(x) * f; wr = wroot(x) * f
        if x <= X_KF:
            fw = 0.12 * f; zc = z_on(P, wr); zt = max(b + 0.06, zc - 0.10)
            out += [(0.0, b, 'k'), (ww * 0.55, b, 'k'), (ww * 0.92, b + 0.014, 'k'), (ww, b + 0.04, 'k')] if fine else [(0.0, b, 'k'), (ww, b + 0.02, 'k')]
            for i in range(1, nk + 1): t = i / nk; out.append((ww + (wr - ww) * t, b + (0.04 if fine else 0.02) + (zt - b - (0.04 if fine else 0.02)) * t, 'k'))
            y1 = wr + fw; z1 = z_on(P, y1)
            for i in range(1, nf + 1):
                t = i / (nf + 1); u = 1 - t
                out.append((u * u * wr + 2 * u * t * wr + t * t * y1, u * u * zt + 2 * u * t * zc + t * t * z1, 'f'))
            body = from_y(P, y1)
        else:                                       # the stem: its narrow face, nothing up its side
            out += [(0.0, zl, 'k'), (ww * 0.55, zl, 'k'), (ww * 0.92, zl, 'k'), (ww, zl, 'k')] if fine else [(0.0, zl, 'k'), (ww, zl, 'k')]
            out += [(ww, zl, 'k')] * nk + [(ww, zl, 'f')] * nf
            body = [(ww, zl)] + from_y(P, ww)
    else:
        out += [(0.0, zl, 'k')] * ((4 if fine else 2) + nk) + [(0.0, zl, 'f')] * nf
        body = P
    z0 = body[0][1]; cl = lambda z: min(top, max(z0, z))
    nb, nt = (16, 6) if fine else (4, 2)
    zw = cl(WL + 0.25); out += [(yy, zz, 'b') for yy, zz in along(body, z0, zw, nb)]
    zn = cl(z_line(x)); out += [(yy, zz, 't') for yy, zz in along(body, zw, zn, nt)]
    zn1 = cl(z_line(x) + 0.06); out += [(yy, zz, 'n') for yy, zz in along(body, zn, zn1, 1)]
    zr0 = cl(z_rub(x) - RUBH); out += [(yy, zz, 't') for yy, zz in along(body, zn1, zr0, 3 if fine else 1)]
    fade = 1.0 - ss(10.35, 10.55, x)
    for dz, off in (((-0.048, 0.38), (-0.034, 0.74), (-0.014, 0.97), (0.014, 0.97), (0.034, 0.74), (0.048, 0.38), (RUBH, 0.0)) if fine else ((0.0, 1.0), (RUBH, 0.0))):   # a rounded list
        zq = cl(z_rub(x) + dz); yy, zz = at_z(body, zq); out.append((yy + RUBW * off * fade, zz, 'r' if off > 0 or dz > 0 else 't'))
    zr1 = cl(z_rub(x) + RUBH); out += [(yy, zz, 't') for yy, zz in along(body, zr1, top, 2 if fine else 1)[:-1]]
    out.append((P[-1][0], top, 's'))
    _S[key] = out; return out

def y_at(x, z, sg=1):
    """the outside's half-breadth at x and height z (the body; the keel under its root)"""
    P = vline(x, sg)
    if z <= P[0][1]: return wk(x) if x >= X_KA else 0.0
    return at_z(P, z)[0]

def stations(fine=True):
    sp = [XA, X_KA - 0.002, X_KA, X_KA + 0.05, X_KA + 0.10, X_BAKK, X_KF, 5.25, 7.45]
    if fine:
        xs = [0.03, 0.07, 0.11, 0.16] + [0.22 + 0.06 * i for i in range(163)] + [10.0 + 0.03 * i for i in range(20)]
        sp += stem_stations(lambda x: z_low(x) if x > X_KF else kb(x), [Z_AF, Z_BT, z_line, lambda x: z_line(x) + 0.06, lambda x: z_rub(x) - RUBH, lambda x: z_rub(x) + RUBH], 9.0, XF - 0.012)
    else:
        xs = [0.4, 1.0, 1.5, 2.4, 3.4, 3.85, 4.6, 5.35, 5.7, 7.0, 8.0, 8.8, 9.3, 9.8, 10.15, 10.4, 10.52]
    xs = [x for x in xs if all(abs(x - s) > 0.008 for s in sp)] + sp + [XF - 0.006, XF]
    return sorted(set(round(x, 5) for x in xs if XA <= x <= XF))


# ---------- colours: white gelcoat, the dark red strake, caps and line, red antifouling, a black boot top, the house white, a grey-green
# deck (paint zones: 1 the hull, 2 the line, 3 the superstructure, 4 the decks; 10j-paint.js) ----------
C = {}
def colours():
    w = lambda n, rgb, g=0.4, z=0, metal=0.0, emit=0.0: C.__setitem__(n, mat(n, rgb, g, zone=z, metal=metal, emit=emit))
    w('af', (0.42, 0.10, 0.07), 0.12); w('boot', (0.05, 0.05, 0.06), 0.5); w('hull', (0.90, 0.91, 0.90), 0.6, 1)
    w('stripe', (0.60, 0.07, 0.06), 0.55, 2); w('cap', (0.46, 0.07, 0.06), 0.5); w('white', (0.92, 0.93, 0.92), 0.5, 3)
    w('roof', (0.82, 0.84, 0.83), 0.3, 3); w('inner', (0.85, 0.86, 0.85), 0.3); w('deck', (0.42, 0.47, 0.43), 0.12, 4); w('nonslip', (0.40, 0.45, 0.41), 0.06, 4)
    w('steel', (0.76, 0.78, 0.80), 0.85, 0, 0.85); w('chrome', (0.86, 0.87, 0.89), 0.95, 0, 0.9); w('alu', (0.72, 0.74, 0.76), 0.6, 0, 0.7); w('galv', (0.62, 0.64, 0.64), 0.4, 0, 0.5)
    w('mast', (0.88, 0.89, 0.88), 0.55, 3); w('dark', (0.12, 0.13, 0.14), 0.25); w('black', (0.04, 0.04, 0.05), 0.4); w('rubber', (0.05, 0.05, 0.06), 0.2)
    w('frame', (0.07, 0.07, 0.08), 0.45); w('screen', (0.03, 0.05, 0.07), 0.9); w('bezel', (0.10, 0.10, 0.11), 0.5); w('cush', (0.15, 0.16, 0.19), 0.35)
    w('switch', (0.20, 0.21, 0.22), 0.4); w('board', (0.93, 0.93, 0.90), 0.35); w('cabin', (0.05, 0.05, 0.06), 0.2); w('gutter', (0.50, 0.55, 0.52), 0.2)
    w('prop', (0.70, 0.52, 0.27), 0.8, 0, 0.9); w('anode', (0.55, 0.56, 0.55), 0.2); w('wood', (0.58, 0.38, 0.20), 0.3); w('red', (0.72, 0.18, 0.08), 0.5)
    w('rope', (0.85, 0.75, 0.25), 0.2); w('rope2', (0.20, 0.42, 0.62), 0.2); w('hose', (0.10, 0.36, 0.20), 0.4); w('fender', (0.08, 0.20, 0.42), 0.4)
    w('sail', (0.88, 0.84, 0.72), 0.15); w('sailedge', (0.95, 0.94, 0.90), 0.25); w('sailseam', (0.78, 0.74, 0.62), 0.15)
    w('lampR', (0.90, 0.10, 0.08), 0.8, 0, 0, 0.5); w('lampG', (0.10, 0.80, 0.25), 0.8, 0, 0, 0.5); w('lampW', (1.0, 0.97, 0.88), 0.8, 0, 0, 0.5)
    w('lens', (0.95, 0.94, 0.85), 0.9)
    C['glass'] = mat('glass', (0.05, 0.08, 0.11), 0.95)


# ---------- the wear: per corner, so it runs across faces (B16; 1985, gelcoat) ----------
def n3(x, y, z=0.0): return noise.noise(V((x, y, z)))
def toward(m, rgb, k):
    base = m['rgb']; return [1 + (rgb[i] / max(base[i], 1e-3) - 1) * k for i in range(3)]

EXH_W = (5.10, -1, 0.30)     # the engine's cooling water outlet (x, side, height over the water)
BILGE = (3.60, -1, 0.36)     # the bilge pump's outlet
FREE = [(0.54, 0.48), (2.18, 0.48), (4.11, 0.70)]            # the freeing ports in the aft bulwarks at the deck (x from, length; G)
def wear(p, m, n):
    x, y, z = p; nm = m.name; side = 1 if y > 0 else -1
    if nm == 'hull':
        g = 0.97 + 0.04 * n3(x * 3.0, z * 6.0, side)
        g *= 1 - 0.10 * ss(0.14, 0.0, z - paint_line(x, Z_BT))                                # grime over the boot top
        g *= 1 - 0.08 * ss(0.3, 0.75, n3(x * 5.0, z * 2.0, side * 3.3)) * ss(0.35, 0.0, abs(z - 0.75)) * (abs(n.y) > 0.5)   # scuffs from quays
        for (xo, so, ho), k in ((EXH_W, 0.30), (BILGE, 0.18)):
            if side == so and z < WL + ho:
                g *= 1 - k * ss(0.02 + (WL + ho - z) * 0.04, 0.004, abs(x - xo)) * ss(WL, WL + 0.12, z)
        for x0, l in FREE:                                                                     # rust-brown streaks under the freeing ports
            g *= 1 - 0.10 * ss(0.06, 0.0, abs(x - x0 - l / 2) - l / 2 + 0.05) * ss(z_deck(x) - 0.02, z_deck(x) - 0.55, z) * (z > WL + 0.2)
        c = toward(m, (0.82, 0.80, 0.72), 0.30 * ss(0.2, 0.7, n3(x * 1.2, z * 3.0, side * 7.1)))   # yellowed a little in patches (41 years)
        return [c[i] * g for i in range(3)]
    if nm in ('stripe', 'boot', 'cap'):
        v = 0.92 + 0.09 * n3(x * 4.0, z * 9.0, side) - 0.08 * ss(WL + 0.06, WL - 0.02, z)
        if nm == 'cap' and n.z > 0.6: v *= 1 - 0.12 * ss(0.3, 0.8, n3(x * 6.0, y * 6.0, 1.7))   # the caps worn pale where hands and ropes go
        return [v, v, v]
    if nm == 'af':
        v = 0.86 + 0.14 * n3(x * 2.5, z * 6.0, y * 2.0)
        g = ss(WL - 0.08, WL + 0.02, z) * (0.5 + 0.5 * ss(-0.3, 0.4, n3(x * 3.0, side * 1.3, 4.1)))   # slime and weed at the waterline
        return [v * (1 - 0.30 * g), v * (1 + 0.15 * g), v * (1 - 0.25 * g)]
    if nm in ('white', 'roof', 'inner', 'mast'):
        v = 0.95 + 0.05 * n3(x * 5.0, y * 5.0, z * 5.0)
        if nm == 'inner': v -= 0.10 * ss(0.15, 0.0, z - dk(x))
        c = toward(m, (0.55, 0.42, 0.28), 0.16 * ss(0.55, 0.9, n3(x * 7.0, y * 7.0, z * 7.0 + 0.5)))   # rust weeping from fittings
        return [c[i] * v for i in range(3)]
    if nm in ('deck', 'nonslip'):
        v = 0.92 + 0.10 * n3(x * 5.0, y * 5.0, 1.0)
        v *= 1 - 0.14 * ss(0.8, 0.0, math.hypot(x - 4.3, y + 1.2)) - 0.10 * ss(0.7, 0.0, math.hypot(x - 3.2, y - 1.0))   # worn where they work
        return [v, v, v]
    return None

def tint(o, f=wear):
    bm = bmesh.new(); bm.from_mesh(o.data); lay = bm.loops.layers.float_color.new('TINT'); mats = [s.material for s in o.material_slots]
    for fc in bm.faces:
        m = mats[fc.material_index]; fc.normal_update()
        for l in fc.loops:
            t = f(l.vert.co, m, fc.normal)
            l[lay] = (t[0], t[1], t[2], 1.0) if t is not None else (1.0, 1.0, 1.0, 1.0)
    bm.to_mesh(o.data); bm.free(); return o


# ---------- one surface: a mesh whose faces share their points (skiff59.py, snekke26.py, plast31.py) ----------
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
        for i in range(len(R) - 1):
            for j in range(len(R[i]) - 1):
                mm = m(i, j) if callable(m) else m
                if mm is None: continue
                s.f([R[i][j], R[i + 1][j], R[i + 1][j + 1], R[i][j + 1]], mm, out(i, j) if callable(out) else out, kind)
    def done(s, angle=30):
        bmesh.ops.remove_doubles(s.bm, verts=s.bm.verts[:], dist=1e-5)
        bmesh.ops.dissolve_degenerate(s.bm, edges=s.bm.edges[:], dist=1e-6)
        return shade(obj_from_bm(s.name, s.bm, s.mats), angle)


# ---------- the hull: the outside over the keel, the transom, the bulwarks' caps and insides, the decks ----------
CAP = 0.07                   # the bulwark's cap, its width
TT = 0.07                    # the transom's thickness: the deck and the transom's inside start this far forward of its outside
def ysh(x, sg=1): return section(x, sg)[-1][0]
def ycap(x, sg=1): return max(0.0, ysh(x, sg) - CAP)
def ybw(x, sg=1): return max(0.0, y_at(x, dk(x), sg) - 0.065)       # the bulwark's foot on the deck (its inside leans in a little)
def camber(x, y):
    e = max(0.3, ybw(x)); return (0.06 if x < X_BAKK else 0.05) * (1 - min(1.0, (y / e) ** 2))

HULL_MAT = {'k': 'af', 'f': 'hull', 'b': 'hull', 't': 'hull', 'n': 'stripe', 'r': 'cap', 's': 'hull'}
HULL_KIND = {'n': 2, 'r': 3}
def hull_shell(M, fine=True):
    xs = stations(fine); S = {}
    for x in xs:
        for sg in (1, -1): S[(x, sg)] = [(x_of(x, z), y, z, k) for y, z, k in section(x, sg, fine)]
    for sg in (1, -1):
        for a, b in zip(xs, xs[1:]):
            Sa, Sb = S[(a, sg)], S[(b, sg)]
            for j in range(len(Sa) - 1):
                k = Sa[j][3]; dy = Sa[j + 1][1] - Sa[j][1]; dz = Sa[j + 1][2] - Sa[j][2]
                out = (0, sg * dz, -dy) if abs(dy) + abs(dz) > 1e-7 else (0, sg, 0)
                q = [(Sa[j][0], sg * Sa[j][1], Sa[j][2]), (Sb[j][0], sg * Sb[j][1], Sb[j][2]), (Sb[j + 1][0], sg * Sb[j + 1][1], Sb[j + 1][2]), (Sa[j + 1][0], sg * Sa[j + 1][1], Sa[j + 1][2])]
                M.f(q, C[HULL_MAT[k]], out, HULL_KIND.get(k, 1))
    # the transom: strips across between the first station's two sides, facing aft
    Tp, Ts = S[(xs[0], 1)], S[(xs[0], -1)]
    for j in range(len(Tp) - 1):
        q = [(Tp[j][0], Tp[j][1], Tp[j][2]), (Ts[j][0], -Ts[j][1], Ts[j][2]), (Ts[j + 1][0], -Ts[j + 1][1], Ts[j + 1][2]), (Tp[j + 1][0], Tp[j + 1][1], Tp[j + 1][2])]
        k = Tp[j][3]; M.f(q, C[HULL_MAT[k]] if k in 'nr' else C['hull'], (-1, 0, 0), HULL_KIND.get(k, 1))
    # ---- inside the bulwarks: the cap, the inside down to the deck, the deck across; the forecastle's deck forward of X_BAKK ----
    ND = 12 if fine else 2
    def edge(x, sg):
        s = z_cap(x, sg); zd = dk(x); xx = lambda z: x_of(x, z)
        return [(xx(s), sg * ysh(x, sg), s), (xx(s + 0.012), sg * ycap(x, sg), s + 0.012), (xx(s - 0.03), sg * (ycap(x, sg) - 0.006), s - 0.03), (xx(zd), sg * ybw(x, sg), zd)]
    def drow(x, bakk=None):
        if bakk is not None:
            keep = dk; globals()['dk'] = (lambda q: z_bk(q)) if bakk else (lambda q: z_deck(q))
        e = ybw(x); zd = dk(x); xd = x_of(x, zd)
        mid = [(xd, e * (1 - 2 * i / ND), zd + camber(x, e * (1 - 2 * i / ND))) for i in range(1, ND)]
        r = edge(x, 1) + mid + list(reversed(edge(x, -1)))
        if bakk is not None: globals()['dk'] = keep
        return r
    aft = [x for x in xs if TT - 1e-9 <= x < X_BAKK - 1e-9] + [X_BAKK]; fd = [x for x in xs if x >= X_BAKK - 1e-9 and ysh(x) > 0.02]
    def em(j, n): return C['cap'] if j in (0, 1, n - 3, n - 2) else C['inner'] if j in (2, n - 4) else None
    def eo(j, n): return (0, 0, 1) if j in (0, 1, n - 3, n - 2) else (0, -1, 0) if j == 2 else (0, 1, 0) if j == n - 4 else (0, 0, 1)
    D = [drow(x, False) for x in aft]; n = len(D[0])
    M.strip(D, lambda i, j: em(j, n) or C['deck'], lambda i, j: eo(j, n))
    B = [drow(x, True) for x in fd]
    M.strip(B, lambda i, j: em(j, n) or C['nonslip'], lambda i, j: eo(j, n))
    # the forecastle's after bulkhead, from the aft deck up to the forecastle's deck, across between the two rows at X_BAKK
    M.strip([D[-1], B[0]], lambda i, j: None if j in (0, 1, n - 3, n - 2) else C['white'], (-1, 0, 0))
    # the stem's top: the forecastle's deck closed over the last station
    last = B[-1]; M.f([last[0], last[n - 1]] + [last[n // 2]], C['cap'], (0, 0, 1))
    # the transom's top: the cap from the outside's top aft of TT in to the inside's edge, and the inside down to the deck
    r0 = D[0]; tops = [x for x in xs if x < TT - 1e-9]
    port = [(S[(x, 1)][-1][0], S[(x, 1)][-1][1], S[(x, 1)][-1][2]) for x in tops]
    M.f(list(reversed(port)) + [(p_[0], -p_[1], p_[2]) for p_ in port] + [r0[n - 1], r0[n - 2], r0[1], r0[0]], C['cap'], (0, 0, 1))
    M.f([r0[1], r0[2], r0[3], r0[n - 4], r0[n - 3], r0[n - 2]], C['inner'], (1, 0, 0))
    return S


# ---------- the openings: real holes, cut with a boolean and lined (ringnot38.py, plast31.py) ----------
PORTS = [6.30, 7.39]                                           # the portholes in the forecastle's sides (G)
PORT_Z = 1.56; PORT_R = 0.115
HATCH_F = (7.80, 8.41, -0.37, 0.37)                            # the forward hatch on the forecastle (G)
HOLD = (2.40, 4.00, -0.66, 0.66)                               # the hold's coaming (G)
HOLD_H = 0.30
EXH_R = 0.04; BILGE_R = 0.018

def rr_pts(cx, cy, w, h, r, n=4): return rrect(cx, cy, w, h, max(0.004, min(r, w / 2 - 0.002, h / 2 - 0.002)), n=n)
def circle(r, n=16): return [(r * math.cos(2 * math.pi * k / n), r * math.sin(2 * math.pi * k / n)) for k in range(n)]

def cutters():
    out = []
    for sg in (1, -1):
        for x in PORTS: out.append(((x, sg * y_at(x, PORT_Z, sg), PORT_Z), (1, 0, 0), (0, 0, 1), circle(PORT_R, 20), 0.10))
        for x0, l in FREE:                                     # through the bulwark: outside and inside
            xc = x0 + l / 2; zd = z_deck(xc); out.append(((xc, sg * (ybw(xc, sg) + 0.03), zd + 0.095), (1, 0, 0), (0, 0, 1), rr_pts(0, 0, l, 0.15, 0.03), 0.16))
    x0, x1, y0, y1 = HATCH_F; out.append((((x0 + x1) / 2, 0, z_bk(8.1) + 0.03), (1, 0, 0), (0, 1, 0), rr_pts(0, 0, x1 - x0, y1 - y0, 0.05), 0.12))
    x0, x1, y0, y1 = HOLD; out.append((((x0 + x1) / 2, 0, z_deck(3.2) + 0.03), (1, 0, 0), (0, 1, 0), rr_pts(0, 0, x1 - x0, y1 - y0, 0.04), 0.10))
    out.append(((0, 0, (WH_FLOOR - 0.05 + 2.05) / 2), (1, 0, 0), (0, 1, 0), wh_inner(0.055), (2.05 - WH_FLOOR + 0.05) / 2))   # the forecastle inside the wheelhouse
    for x, sg, h, r in ((EXH_W[0], EXH_W[1], EXH_W[2], EXH_R), (BILGE[0], BILGE[1], BILGE[2], BILGE_R)):
        out.append(((x, sg * y_at(x, WL + h, sg), WL + h), (1, 0, 0), (0, 0, 1), circle(r, 16), 0.05))
    return out

def cut_holes(target, cuts=None):
    bm = bmesh.new()
    for o, u, v, poly, d in (cuts or cutters()):
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

def tube(A, ring, d, depth, m, m_end=None):
    """the inside of a hole, from its outline ring along d, depth deep, its faces turned in; closed at the end with m_end (else open)"""
    d = V(d).normalized(); P = [V(p) for p in ring]; c = sum(P, V()) / len(P); n = len(P)
    Q = [p + d * depth for p in P]
    for k in range(n):
        j = (k + 1) % n; mid = (P[k] + Q[j]) / 2
        A.poly([P[k], P[j], Q[j], Q[k]], m, (c + d * depth / 2) - mid)
    if m_end is not None: A.poly(Q, m_end, -d)

def linings(A, G, fine=True):
    s = lambda q: C['steel']
    # the portholes: the reveal through the side, the glass in it, the cabin dark behind, a stainless ring with its dogs outside
    for sg in (1, -1):
        for x in PORTS:
            on = lambda p, q, d: V((x + p, sg * (y_at(x + p, PORT_Z + q, sg) - d), PORT_Z + q))
            tube(A, [on(p, q, 0.0) for p, q in circle(PORT_R, 20)], (0, -sg, 0), 0.07, C['white'])
            G.poly([on(p, q, 0.035) for p, q in circle(PORT_R, 20)], C['glass'], (0, sg, 0))
            A.poly([on(p, q, 0.07) for p, q in circle(PORT_R, 20)], C['cabin'], (0, sg, 0))
            F.atorus(A, (x, sg * (y_at(x, PORT_Z, sg) + 0.006), PORT_Z), (0, sg, 0), PORT_R + 0.014, 0.014, lambda a: C['steel'], seg=24, rseg=5)
            if fine:
                for k in range(3):
                    a = 2 * math.pi * k / 3 + 0.5; px, pz = x + 0.165 * math.cos(a), PORT_Z + 0.165 * math.sin(a)
                    acyl(A, (px, sg * (y_at(px, pz, sg) - 0.002), pz), (px, sg * (y_at(px, pz, sg) + 0.022), pz), 0.012, s, seg=8)
    # the freeing ports: the hole through the bulwark lined, open (Jonas 01.11.2026: the rubber flaps over them read as black blocks)
    for sg in (1, -1):
        for x0, l in FREE:
            xc = x0 + l / 2; zd = z_deck(xc); o = rr_pts(xc, zd + 0.095, l, 0.15, 0.03, 3)
            ring = [V((p, sg * (y_at(p, q, sg) + 0.001), q)) for p, q in o]
            tube(A, ring, (0, -sg, 0), max(0.03, y_at(xc, zd + 0.1, sg) - ybw(xc, sg) + 0.002), C['inner'])
    # the forward hatch: its reveal into the cabin, an aluminium frame proud of the deck, the smoked acrylic lid
    x0, x1, y0, y1 = HATCH_F; o = rr_pts((x0 + x1) / 2, 0, x1 - x0, y1 - y0, 0.05, 4)
    top = lambda x, y: z_bk(x) + camber(x, y)
    ring = [(x, y, top(x, y) - 0.002) for x, y in o]
    tube(A, ring, (0, 0, -1), 0.06, C['inner'], C['cabin'])
    fo = rr_pts((x0 + x1) / 2, 0, x1 - x0 + 0.08, y1 - y0 + 0.08, 0.09, 4); zf = max(p[2] for p in ring) + 0.06
    F.loft(A, [[(x, y, top(x, y) - 0.004) for x, y in fo], [(x, y, zf) for x, y in fo]], lambda i: C['alu'], cap0=False, cap1=False)
    F.loft(A, [[(x, y, zf) for x, y in o], [(x, y, top(x, y) - 0.004) for x, y in o]], lambda i: C['alu'], cap0=False, cap1=False, out=lambda mid, cc: V((cc.x - mid.x, cc.y - mid.y, 0)))
    for k in range(len(o)):
        a, b = o[k], o[(k + 1) % len(o)]; c_, d_ = fo[(k + 1) % len(fo)], fo[k]
        A.poly([(a[0], a[1], zf), (b[0], b[1], zf), (c_[0], c_[1], zf), (d_[0], d_[1], zf)], C['alu'], (0, 0, 1))
    G.poly([(x, y, zf + 0.012) for x, y in rr_pts((x0 + x1) / 2, 0, x1 - x0 + 0.06, y1 - y0 + 0.06, 0.08, 4)], C['glass'], (0, 0, 1))
    if fine:
        for yy in (-0.12, 0.12): acyl(A, (x1 + 0.035, yy - 0.03, zf + 0.012), (x1 + 0.035, yy + 0.03, zf + 0.012), 0.009, s, seg=8)
    # the hold: a coaming round the hole up from the deck, dark down into the hold, the hatch boards on it with the small hatch and grips
    x0, x1, y0, y1 = HOLD; zd0 = z_deck(3.2); o = rr_pts((x0 + x1) / 2, 0, x1 - x0, y1 - y0, 0.04, 3)
    ring = [(x, y, z_deck(x) + camber(x, y) - 0.03) for x, y in o]
    tube(A, ring, (0, 0, -1), 0.6, C['inner'], C['cabin'])
    F.loft(A, [[(x, y, z_deck(x) + camber(x, y) - 0.03) for x, y in o], [(x, y, zd0 + HOLD_H) for x, y in o]], lambda i: C['white'], cap0=False, cap1=False,
           out=lambda mid, cc: V((mid.x - cc.x, mid.y - cc.y, 0)))
    oi = rr_pts((x0 + x1) / 2, 0, x1 - x0 - 0.08, y1 - y0 - 0.08, 0.02, 3)
    F.loft(A, [[(x, y, zd0 + HOLD_H) for x, y in oi], [(x, y, zd0 + 0.05) for x, y in oi]], lambda i: C['white'], cap0=False, cap1=False,
           out=lambda mid, cc: V((cc.x - mid.x, cc.y - mid.y, 0)))
    for k in range(len(o)):
        a, b = o[k], o[(k + 1) % len(o)]; c_, d_ = oi[(k + 1) % len(oi)], oi[k]
        A.poly([(a[0], a[1], zd0 + HOLD_H), (b[0], b[1], zd0 + HOLD_H), (c_[0], c_[1], zd0 + HOLD_H), (d_[0], d_[1], zd0 + HOLD_H)], C['white'], (0, 0, 1))
    zt = zd0 + HOLD_H + 0.04; nbd = 6
    for k in range(nbd):                                       # the hatch boards across, each a little apart, lying on the coaming
        bx0 = x0 - 0.04 + (x1 - x0 + 0.08) * k / nbd + 0.004; bx1 = x0 - 0.04 + (x1 - x0 + 0.08) * (k + 1) / nbd - 0.004
        abox(A, bx0, bx1, y0 - 0.04, y1 + 0.04, zd0 + HOLD_H + 0.002, zt, C['deck'])
    if fine:
        abox(A, 2.50, 3.15, -0.34, 0.40, zt - 0.002, zt + 0.12, C['white']); abox(A, 2.47, 3.18, -0.37, 0.43, zt + 0.12, zt + 0.15, C['roof'])
        for y in (-0.2, 0.26): F.pipe(A, [(2.70, y, zt + 0.148), (2.70, y, zt + 0.19), (2.95, y, zt + 0.19), (2.95, y, zt + 0.148)], 0.012, C['steel'], 6)
        for x in (x0 + 0.25, x1 - 0.25):                       # the cleats that hold the boards down
            for yy in (y0 - 0.025, y1 + 0.025): obox(A, (x, yy, zd0 + HOLD_H - 0.04), (0.03, 0, 0), (0, 0.008, 0), (0, 0, 0.05), C['steel'])
    # the cooling water outlet and the bilge pump's: a stainless collar round each
    for (xb, sb, hb_), r in ((EXH_W, EXH_R), (BILGE, BILGE_R)):
        zb_ = WL + hb_
        ring = [(xb + p, sb * (y_at(xb + p, zb_ + q, sb) + 0.001), zb_ + q) for p, q in circle(r, 12)]
        tube(A, ring, (0, -sb, 0), 0.05, C['dark'], C['black'])
        F.atorus(A, (xb, sb * (y_at(xb, zb_, sb) + 0.006), zb_), (0, sb, 0), r + 0.008, 0.006, lambda a: C['steel'], seg=14, rseg=4)


# ---------- the wheelhouse amidships, on the forecastle's after end: the walls with real windows and a door, the floor between the
# aft deck and the forecastle, the roof (G: its plan, height, lean and windows) ----------
WH_X0 = 5.25; WH_XC = 7.20; WH_XF = 7.45; WH_W = 1.20; WH_WF = 0.95; WH_SILL = 1.90; WH_TOP = 3.00; LEAN = 0.23; WH_FLOOR = 1.00; WT = 0.06
WIN_Z = (2.30, 2.90)
DOOR = (5.34, 5.90, 0.79, 2.62)                                # the door aft on the starboard side, from the aft deck (G): x, sill, head
def wh_ring(z):
    d = LEAN * max(0.0, z - WH_SILL)
    return [(WH_X0, -WH_W, z), (WH_XC + d, -WH_W, z), (WH_XF + d, -WH_WF, z), (WH_XF + d, WH_WF, z), (WH_XC + d, WH_W, z), (WH_X0, WH_W, z)]
def wh_inner(inset=WT):
    """the wheelhouse's inner plan at its floor (the walls are WT thick)"""
    return [(WH_X0 + inset, -WH_W + inset), (WH_XC, -WH_W + inset), (WH_XF - inset, -WH_WF + inset * 0.6), (WH_XF - inset, WH_WF - inset * 0.6), (WH_XC, WH_W - inset), (WH_X0 + inset, WH_W - inset)]
def roof_z(x): return WH_TOP + 0.06 * max(0.0, min(1.0, (x - WH_X0) / 2.4))

def arch(cx, z0, z1, w, n=6):
    r = w / 2; pts = [(cx + r, z0), (cx + r, z1 - r)]
    for k in range(1, n): a = math.pi * k / n; pts.append((cx + r * math.cos(a), z1 - r + r * math.sin(a)))
    pts += [(cx - r, z1 - r), (cx - r, z0)]
    return pts

def wh_faces():
    """(name, origin, u, v, windows) for the walls carrying windows; windows as polygons in (u, v) (G)"""
    vl = (LEAN, 0, 1.0); Fc = []
    vlen = math.hypot(LEAN, 1.0); s = lambda z: (z - WH_SILL) * vlen
    Fc.append(('front', (WH_XF, 0, WH_SILL), (0, 1, 0), vl, [rrect(u, (s(WIN_Z[0]) + s(WIN_Z[1])) / 2, 0.56, s(WIN_Z[1]) - s(WIN_Z[0]), 0.06, 3) for u in (-0.62, 0.0, 0.62)]))
    for nm, a, b in (('corner_p', (WH_XF, WH_WF), (WH_XC, WH_W)), ('corner_s', (WH_XC, -WH_W), (WH_XF, -WH_WF))):
        u = (b[0] - a[0], b[1] - a[1], 0); mid = ((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, WH_SILL)
        Fc.append((nm, mid, u, vl, [rrect(0.0, (s(WIN_Z[0]) + s(WIN_Z[1])) / 2, 0.24, s(WIN_Z[1]) - s(WIN_Z[0]), 0.05, 3)]))
    side = lambda: [rrect(7.00, 2.58, 0.42, 0.52, 0.07, 3), arch(6.25, 2.22, 2.90, 0.27), arch(6.59, 2.22, 2.90, 0.27)]
    Fc.append(('side_p', (0, WH_W, 0), (1, 0, 0), (0, 0, 1), side()))
    Fc.append(('side_s', (0, -WH_W, 0), (1, 0, 0), (0, 0, 1), side()))
    Fc.append(('aft', (WH_X0, 0, 0), (0, 1, 0), (0, 0, 1), [rrect(-0.35, 2.58, 0.46, 0.50, 0.07, 3), rrect(0.35, 2.58, 0.46, 0.50, 0.07, 3)]))
    return Fc

def wheelhouse(fine=True):
    objs = []; glass = []; A = Acc('wh_fit')
    shell = loft_rings('wheelhouse', [wh_ring(z_deck(WH_X0) - 0.004), wh_ring(WH_SILL), wh_ring(WH_TOP)], C['white'], cap0=False, cap1=True, angle=25)
    shell.data.materials.append(C['inner']); solidify(shell, WT, 1); apply_all(shell)
    cuts = []
    for nm, o, u, v, wins in (wh_faces() if fine else []):
        vv = V(v).normalized(); n = V(u).normalized().cross(vv).normalized()
        if nm.startswith('side'): n = V((0, 1 if nm.endswith('p') else -1, 0))
        if nm == 'aft': n = V((-1, 0, 0))
        for k, poly in enumerate(wins):
            cuts.append(plate_cutter('wc_%s%d' % (nm, k), o, u, vv, poly, 0.35))
            cx = sum(p[0] for p in poly) / len(poly); cy = sum(p[1] for p in poly) / len(poly)
            outer = [(p[0] + (0.03 if p[0] > cx else -0.03), p[1] + (0.03 if p[1] > cy else -0.03)) for p in poly]
            objs.append(frame_ring('wf_%s%d' % (nm, k), V(o) + n * 0.004, u, vv, outer, poly, C['frame'], 0.0, 0.022, nrm=n))
            glass.append(plate('wg_%s%d' % (nm, k), V(o) - n * 0.03, u, vv, poly, C['glass'], nrm=n))
    if fine:
        x0, x1, z0, z1 = DOOR
        cuts.append(plate_cutter('wc_door', (0, -WH_W, 0), (1, 0, 0), (0, 0, 1), rrect((x0 + x1) / 2, (z0 + z1) / 2, x1 - x0, z1 - z0, 0.06, 3), 0.35))
        cut(shell, cuts)
    objs.append(shell)
    if not fine:
        for nm, o, u, v, wins in wh_faces():
            vv = V(v).normalized(); n = V(u).normalized().cross(vv).normalized()
            if nm.startswith('side'): n = V((0, 1 if nm.endswith('p') else -1, 0))
            if nm == 'aft': n = V((-1, 0, 0))
            for k, poly in enumerate(wins): objs.append(plate('wd_%s%d' % (nm, k), V(o) + n * 0.004, u, vv, poly, C['dark'], nrm=n))
    else:
        # the door: a white frame round the opening, the leaf in it a little in (its window, its handle, its hinges forward), a step
        # inside from the sill down to the floor
        x0, x1, z0, z1 = DOOR; y = -WH_W
        o = rr_pts((x0 + x1) / 2, (z0 + z1) / 2, x1 - x0, z1 - z0, 0.06, 3); fo = rr_pts((x0 + x1) / 2, (z0 + z1) / 2, x1 - x0 + 0.07, z1 - z0 + 0.07, 0.09, 3)
        for k in range(len(o)):
            a, b = o[k], o[(k + 1) % len(o)]; c_, d_ = fo[(k + 1) % len(fo)], fo[k]
            A.poly([(a[0], y - 0.012, a[1]), (b[0], y - 0.012, b[1]), (c_[0], y - 0.012, c_[1]), (d_[0], y - 0.012, d_[1])], C['white'], (0, -1, 0))
            A.poly([(a[0], y - 0.012, a[1]), (b[0], y - 0.012, b[1]), (b[0], y + 0.002, b[1]), (a[0], y + 0.002, a[1])], C['white'], (0, 0, 0))
        lo = rr_pts((x0 + x1) / 2, (z0 + z1) / 2, x1 - x0 - 0.016, z1 - z0 - 0.016, 0.05, 3)
        A.poly([(p, y + 0.022, q) for p, q in lo], C['roof'], (0, -1, 0)); A.poly([(p, y + 0.045, q) for p, q in lo], C['roof'], (0, 1, 0))
        G1 = rr_pts((x0 + x1) / 2, z1 - 0.42, 0.34, 0.40, 0.06, 3)
        glass.append(plate('door_glass', (0, y + 0.020, 0), (1, 0, 0), (0, 0, 1), G1, C['glass'], nrm=(0, -1, 0)))
        acyl(A, (x0 + 0.07, y + 0.02, z0 + 0.95), (x0 + 0.07, y - 0.035, z0 + 0.95), 0.012, lambda q: C['steel'], seg=8)
        abox(A, x0 + 0.04, x0 + 0.16, y - 0.05, y - 0.035, z0 + 0.935, z0 + 0.965, C['steel'])
        for zz in (z0 + 0.25, z1 - 0.25): acyl(A, (x1 - 0.03, y - 0.004, zz - 0.06), (x1 - 0.03, y - 0.004, zz + 0.06), 0.013, lambda q: C['steel'], seg=8)
        abox(A, x0 + 0.02, x1 - 0.02, y + WT, y + WT + 0.34, z0 - 0.004, WH_FLOOR - 0.12, C['inner'], skip=('-z',)); abox(A, x0 + 0.02, x1 - 0.02, y + WT, y + WT + 0.34, WH_FLOOR - 0.12, WH_FLOOR - 0.10, C['wood'])
        # the floor inside, over the aft deck and down in the forecastle
        A.poly([(x, yy, WH_FLOOR) for x, yy in wh_inner(WT + 0.002)], C['nonslip'], (0, 0, 1))
    # the roof: its underside, a thin lip with a drip edge all round, a visor over the front, the crown rising a little forward
    ring = offset_poly([(p[0], p[1]) for p in wh_ring(WH_TOP)], 0.10); ring = [(x + (0.06 if x > WH_X0 + 1 else 0), y) for x, y in ring]
    zr_ = WH_TOP
    A.poly([(x, y, zr_ + 0.001) for x, y in ring], C['inner'], (0, 0, -1))
    crown = lambda x, y: roof_z(x) + 0.08 + 0.04 * (1 - min(1.0, (y / (WH_W + 0.1)) ** 2))
    ri = offset_poly(ring, -0.14)
    for i in range(len(ring)):
        a, b = ring[i], ring[(i + 1) % len(ring)]; c, d = ri[(i + 1) % len(ri)], ri[i]; nrm = (b[1] - a[1], -(b[0] - a[0]), 0)
        A.poly([(a[0], a[1], zr_), (b[0], b[1], zr_), (b[0], b[1], roof_z(b[0]) + 0.07), (a[0], a[1], roof_z(a[0]) + 0.07)], C['cap'], nrm)   # the lip, dark red as the strake
        A.poly([(a[0], a[1], roof_z(a[0]) + 0.07), (b[0], b[1], roof_z(b[0]) + 0.07), (c[0], c[1], crown(*c)), (d[0], d[1], crown(*d))], C['roof'], (0, 0, 1))
        e = 0.02
        A.poly([(a[0], a[1], zr_ - 0.001), (b[0], b[1], zr_ - 0.001), (b[0], b[1], zr_ - 0.025), (a[0], a[1], zr_ - 0.025)], C['frame'], nrm)   # the drip edge
    A.poly([(x, y, crown(x, y)) for x, y in ri], C['roof'], (0, 0, 1))
    if fine:
        # the wipers on the three front panes (the motor over the pane, the arm and the blade on the glass)
        for u in (-0.62, 0.0, 0.62):
            zt_ = WIN_Z[1] + 0.04; xt_ = WH_XF + LEAN * (zt_ - WH_SILL) + 0.03
            acyl(A, (xt_ - 0.04, u, zt_), (xt_ + 0.01, u, zt_), 0.02, lambda q: C['frame'], seg=8)
            zb2 = WIN_Z[1] - 0.45; xb2 = WH_XF + LEAN * (zb2 - WH_SILL) + 0.025
            acyl(A, (xt_ + 0.01, u, zt_), (xb2, u + 0.08, zb2), 0.006, lambda q: C['frame'], seg=5)
            for dz in (-0.18, 0.18): pass
            acyl(A, (WH_XF + LEAN * (zb2 + 0.18 - WH_SILL) + 0.022, u + 0.08, zb2 + 0.18), (WH_XF + LEAN * (zb2 - 0.18 - WH_SILL) + 0.022, u + 0.08, zb2 - 0.18), 0.007, lambda q: C['rubber'], seg=5)
    objs.append(A.done(35, tint=wear))
    return objs, glass, crown


# the helm on the starboard side under the front windows: the console with the dash sloping up forward, the wheel, the lever, the plotter,
# the sounder and the engine's panel facing the skipper (up and aft), the compass on top, the VHF overhead, the seat; the bench and the
# galley's plate to port; the mast stands in the house's after port corner
HX0, HY0, HY1 = 7.04, -0.98, -0.05                            # the console's after face and its sides
DASH = ((7.06, 1.98), (7.36, 2.15))                           # the dash's after foot and fore top (x, z)
WHEEL = (6.99, -0.48, 1.98); WHEEL_AX = (-1.0, 0.0, 0.55)
SKIP = (6.60, -0.48); SEAT = (6.18, -0.48)
EYE_H = 1.65
HP, FOV = -0.26, 60          # the bridge view's pitch (rad) and field: the dash inside it (check())
def dash_pt(t, y):
    (x0, z0), (x1, z1) = DASH; return V((x0 + (x1 - x0) * t, y, z0 + (z1 - z0) * t))
def dash_n():
    (x0, z0), (x1, z1) = DASH; return V((-(z1 - z0), 0, x1 - x0)).normalized()
SCR = {'plot': (-0.92, -0.62, 0.15, 0.85), 'sound': (-0.32, -0.10, 0.18, 0.82), 'eng': (-0.58, -0.38, 0.50, 0.88)}
HELM_EXTRA = []
def helm(A, G, fine=True):
    w = C['inner']; z0 = WH_FLOOR; (x0, dz0), (x1, dz1) = DASH; xw = WH_XF - WT - 0.01
    A.poly([(HX0, HY0, z0), (HX0, HY1, z0), (HX0, HY1, dz0), (HX0, HY0, dz0)], w, (-1, 0, 0))
    A.poly([(HX0, HY0, dz0), (HX0, HY1, dz0), (x0, HY1, dz0), (x0, HY0, dz0)], w, (0, 0, 1))
    A.poly([(x0, HY0, dz0), (x0, HY1, dz0), (x1, HY1, dz1), (x1, HY0, dz1)], C['board'], dash_n())
    for y, sg in ((HY0, -1), (HY1, 1)):
        A.poly([(HX0, y, z0), (xw, y, z0), (xw, y, dz1), (x1, y, dz1), (x0, y, dz0), (HX0, y, dz0)], w, (0, sg, 0))
    A.poly([(x1, HY0, dz1), (x1, HY1, dz1), (xw, HY1, dz1), (xw, HY0, dz1)], w, (0, 0, 1))
    if not fine: return
    n = dash_n()
    for nm, (ya, yb_, ta, tb) in SCR.items():
        q = [dash_pt(ta, ya), dash_pt(ta, yb_), dash_pt(tb, yb_), dash_pt(tb, ya)]; c = sum(q, V()) / 4
        F.loft(A, [[p + n * 0.002 for p in q], [p + n * 0.014 for p in q]], lambda i: C['bezel'], cap0=False, cap1=False)
        A.poly([p + n * 0.014 for p in q], C['bezel'], n)
        A.poly([c + (p - c) * 0.86 + n * 0.0145 for p in q], C['screen'], n)
    for yg in (-0.54, -0.42):
        F.atorus(A, dash_pt(0.25, yg) + n * 0.004, n, 0.035, 0.004, lambda a: C['chrome'], seg=16, rseg=4)
    cb = dash_pt(0.93, -0.25) + V((0.0, 0, -0.005))
    acyl(A, cb, cb + V((0, 0, 0.05)), 0.07, lambda q: C['dark'], seg=16)
    HELM_EXTRA.append(sphere('compass', cb + V((0, 0, 0.085)), 0.06, C['glass'], (1, 1, 0.7)))
    cp = dash_pt(0.12, -0.80) + n * 0.003
    obox(A, cp, V((0, 0.07, 0)), (dash_pt(1, 0) - dash_pt(0, 0)).normalized() * 0.03, n * 0.004, C['switch'])
    for k in range(4): obox(A, cp + n * 0.005 + V((0, -0.05 + 0.033 * k, 0)), V((0, 0.009, 0)), V((0.004, 0, 0.008)), n * 0.004, C['lampG'] if k < 3 else C['lampR'])
    F.helm_wheel(A, WHEEL, WHEEL_AX, 0.21, C['cush'], C['steel'], C['dark'])
    acyl(A, V(WHEEL) - V(WHEEL_AX).normalized() * 0.14, (HX0 + 0.004, WHEEL[1], WHEEL[2] + 0.02), 0.03, lambda q: C['dark'], seg=10)
    F.single_lever(A, (HX0 + 0.12, HY1, z0 + 0.80), (0, 1, 0), (1, 0, 0), C['dark'], C['steel'], C['black'])
    vc = V((6.80, -0.70, WH_TOP - 0.06))
    obox(A, vc, V((0.09, 0, 0)), V((0, 0.10, 0)), V((0, 0, 0.05)), C['dark'])
    A.poly([vc + V((-0.091, -0.08, -0.03)), vc + V((-0.091, 0.08, -0.03)), vc + V((-0.091, 0.08, 0.03)), vc + V((-0.091, -0.08, 0.03))], C['screen'], (-1, 0, 0))
    obox(A, vc + V((-0.05, 0.13, -0.02)), V((0.02, 0, 0)), V((0, 0.015, 0)), V((0, 0, 0.04)), C['black'])
    F.helm_seat(A, (SEAT[0], SEAT[1], z0), (1, 0, 0), 0.76, C['steel'], C['cush'])
    # the bench to port along the side forward of the mast, the chart shelf over it, the galley's plate at its forward end
    yi = WH_W - WT
    abox(A, 5.70, 6.75, 0.62, yi - 0.004, z0, z0 + 0.42, C['inner']); abox(A, 5.72, 6.73, 0.64, yi - 0.006, z0 + 0.42, z0 + 0.50, C['cush'])
    abox(A, 5.72, 6.73, yi - 0.09, yi - 0.006, z0 + 0.50, z0 + 0.92, C['cush'])
    abox(A, 6.80, 7.25, 0.55, yi - 0.004, z0, z0 + 0.86, C['inner']); abox(A, 6.85, 7.20, 0.62, 1.00, z0 + 0.86, z0 + 0.88, C['dark'])
    for xx in (6.95, 7.12): F.atorus(A, (xx, 0.81, z0 + 0.885), (0, 0, 1), 0.07, 0.006, lambda a: C['steel'], seg=16, rseg=4)


# ---------- the forecastle: rails, the windlass and the bow roller, cleats and bitts, vents, the steps up from the aft deck ----------
def gunwale_y(x, sg=1): return ycap(x, sg) + CAP * 0.5
def bitts(A, x, y, z, h=0.26):
    abox(A, x - 0.12, x + 0.12, y - 0.06, y + 0.06, z - 0.004, z + 0.02, C['steel'])
    for dx in (-0.065, 0.065):
        acyl(A, (x + dx, y, z), (x + dx, y, z + h), 0.042, lambda q: C['steel'], seg=12)
        acyl(A, (x + dx, y, z + h), (x + dx, y, z + h + 0.015), 0.052, lambda q: C['steel'], seg=12)
    acyl(A, (x - 0.065, y, z + h * 0.7), (x + 0.065, y, z + h * 0.7), 0.012, lambda q: C['steel'], seg=8)

def forecastle(A, fine=True):
    s = lambda q: C['steel']
    def base(p, r=0.026): acyl(A, (p[0], p[1], p[2] - 0.003), (p[0], p[1], p[2] + 0.008), r, s, seg=10)
    xs = [6.35, 6.95, 7.55, 8.15, 8.75, 9.30, 9.80, 10.20]
    if fine:
        # the rails: posts on bases on the cap, a top and a knee rail, closing round the bow (G: the post spacing)
        for sg in (1, -1):
            for x in xs:
                zc = z_cap(x, sg) + 0.012; y = sg * gunwale_y(x, sg); base((x, y, zc)); acyl(A, (x, y, zc), (x, y, zc + 0.58), 0.016, s, seg=8)
        for h, r in ((0.58, 0.018), (0.30, 0.013)):
            pts = [(6.15, -gunwale_y(6.15, -1), z_cap(6.15, -1) + 0.012 + h * 0.6)] + [(x, -gunwale_y(x, -1), z_cap(x, -1) + 0.012 + h) for x in xs]
            pts += [(10.42, -0.26, z_cap(10.42) + 0.012 + h), (10.50, 0.0, z_cap(10.5) + 0.012 + h + 0.02), (10.42, 0.26, z_cap(10.42) + 0.012 + h)]
            pts += [(x, gunwale_y(x), z_cap(x) + 0.012 + h) for x in reversed(xs)] + [(6.15, gunwale_y(6.15), z_cap(6.15) + 0.012 + h * 0.6)]
            F.pipe(A, pts, r, C['steel'], 8)
        for sg in (1, -1): acyl(A, (6.15, sg * gunwale_y(6.15, sg), z_cap(6.15, sg) + 0.012), (6.15, sg * gunwale_y(6.15, sg), z_cap(6.15, sg) + 0.36), 0.016, s, seg=8)
    # the windlass on the forecastle: its base, the motor's housing, the gypsy and the warping drum, the chain pipe forward of it (G: 9.45)
    wx = 9.45; zd = z_bk(wx) + camber(wx, 0)
    abox(A, wx - 0.20, wx + 0.20, -0.18, 0.18, zd - 0.03, zd + 0.08, C['red'])
    acyl(A, (wx, -0.16, zd + 0.24), (wx, 0.16, zd + 0.24), 0.13, lambda q: C['red'], seg=18)
    acyl(A, (wx, 0.16, zd + 0.24), (wx, 0.30, zd + 0.24), 0.09, lambda q: C['steel'], seg=16, r1=0.075)
    F.atorus(A, (wx, -0.21, zd + 0.24), (0, 1, 0), 0.09, 0.024, lambda a: C['steel'], seg=16, rseg=6)
    acyl(A, (wx, -0.25, zd + 0.24), (wx, -0.17, zd + 0.24), 0.065, lambda q: C['steel'], seg=12)
    obox(A, (wx, 0, zd + 0.12), V((0.16, 0, 0)), V((0, 0.15, 0)), V((0, 0, 0.05)), C['red'])
    cp = wx + 0.32; acyl(A, (cp, -0.21, z_bk(cp) + camber(cp, 0.21) - 0.004), (cp, -0.21, z_bk(cp) + 0.06), 0.06, s, seg=12)
    # the bow roller over the stem (the anchor itself is the game's: bower)
    zr_ = z_cap(10.55) + 0.04
    F.bow_roller(A, (10.05, 0, z_cap(10.05) + 0.004), (10.74, 0, zr_), C['steel'], C['rubber'], R=0.05, W=0.15, deck=lambda x: z_cap(x) + 0.004, x_end=XF - 0.02)
    if not fine: return
    # the bitts forward and abreast the wheelhouse, the cleats on the caps, two mushroom vents, a grab rail on the wheelhouse front
    for x, y in ((9.95, 0.72), (9.95, -0.72)): bitts(A, x, y, z_bk(x) + camber(x, y))
    for x in (6.55, 8.6):
        for sg in (1, -1): F.cleat(A, (x, sg * gunwale_y(x, sg), z_cap(x, sg) + 0.006), (0, 0, 1), (1, 0, 0), 0.24, C['steel'])
    for y in (0.9, -0.9):
        zv = z_bk(7.75) + camber(7.75, y)
        acyl(A, (7.75, y, zv - 0.004), (7.75, y, zv + 0.26), 0.05, lambda q: C['white'], seg=12)
        acyl(A, (7.75, y, zv + 0.26), (7.75, y, zv + 0.34), 0.12, lambda q: C['white'], seg=16, r1=0.05)
    # the steps up from the aft deck to the forecastle, outboard of the wheelhouse on both sides: three treads on brackets on the bulkhead
    for sg in (1, -1):
        ya, yb = sg * (WH_W + 0.06), sg * (WH_W + 0.36); y0, y1 = min(ya, yb), max(ya, yb)    # a narrow step against the house: the game's way up runs outboard of it (deckMap)
        zd0, zd1 = z_deck(X_BAKK - 0.02), z_bk(X_BAKK)
        for k in (1, 2):
            zt = zd0 + (zd1 - zd0) * k / 3; abox(A, X_BAKK - 0.30, X_BAKK - 0.001, y0, y1, zt - 0.04, zt, C['wood'])
            for yy in (y0 + 0.03, y1 - 0.03): abox(A, X_BAKK - 0.28, X_BAKK - 0.001, yy - 0.012, yy + 0.012, zt - 0.20, zt - 0.04, C['steel'])
        gx = X_BAKK - 0.02; gy = sg * (WH_W + 0.04)
        F.pipe(A, [(gx, gy, zd0 + 0.9), (gx - 0.06, gy, zd0 + 0.9), (gx - 0.06, gy, zd1 + 0.75), (gx, gy, zd1 + 0.75)], 0.014, C['steel'], 8)


# ---------- the aft deck: the gear room, the hauling station, the rails round the stern, the bitts, the filler, the flag staff ----------
GR = [(1.25, -0.15), (1.62, -0.15), (2.55, 1.20), (2.62, 1.70), (1.25, 1.70)]     # the gear room in plan (G; the last two out to the bulwark)
GR_TOP = 2.94
def gr_out(x): return ycap(x) - 0.005                         # its outboard wall stands on the cap's inner edge
def gear_room(A, G, fine=True):
    """the gear room: its walls on the deck (the outboard one on the bulwark's cap), a door in its slanted face (toward starboard and
    forward) in a real opening with frame and leaf, a louvred vent in its after wall, the roof with its lip and drip edge"""
    w = C['white']; zr = GR_TOP; P = [GR[0], GR[1], GR[2], (GR[3][0], gr_out(GR[3][0])), (GR[4][0], gr_out(GR[4][0]))]
    zd = lambda x, y: z_deck(x) + camber(x, y) - 0.004
    a, b = V((GR[1][0], GR[1][1], 0)), V((GR[2][0], GR[2][1], 0)); u = (b - a).normalized(); n = V((u.y, -u.x, 0)); Ld = (b - a).length
    # the walls: the starboard and the slanted one (with the door), the forward one, the after one (with the vent); the outboard one
    def wall(p, q, nrm, z0f, holes=()):
        """a wall from p to q (x, y) up to the roof, its foot z0f(x, y), leaving the rectangles holes [(t0, t1, z0, z1)] open"""
        cuts = sorted(holes)
        ts = [0.0] + [v for h in cuts for v in h[:2]] + [1.0]
        P_ = lambda t, z: (p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t, z)
        foot = lambda t: z0f(p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t)
        if not cuts: A.poly([P_(0, foot(0)), P_(1, foot(1)), P_(1, zr), P_(0, zr)], w, nrm); return
        prev = 0.0
        for t0, t1, h0, h1 in cuts:
            A.poly([P_(prev, foot(prev)), P_(t0, foot(t0)), P_(t0, zr), P_(prev, zr)], w, nrm)
            A.poly([P_(t0, foot(t0)), P_(t1, foot(t1)), P_(t1, h0), P_(t0, h0)], w, nrm)
            A.poly([P_(t0, h1), P_(t1, h1), P_(t1, zr), P_(t0, zr)], w, nrm)
            prev = t1
        A.poly([P_(prev, foot(prev)), P_(1, foot(1)), P_(1, zr), P_(prev, zr)], w, nrm)
    zdw = lambda x, y: zd(x, y)
    dt0, dt1 = 0.5 - 0.31 / Ld, 0.5 + 0.31 / Ld; dz0, dz1 = z_deck(2.08) + 0.16, z_deck(2.08) + 1.86
    wall(GR[0], GR[1], (0, -1, 0), zdw)
    wall(GR[1], GR[2], n, zdw, [(dt0, dt1, dz0, dz1)] if fine else [])
    wall(GR[2], P[3], (1, 0.14, 0), zdw)
    vt0, vt1 = 0.30, 0.62; vz0, vz1 = 2.15, 2.55
    capz = lambda x, y: z_cap(x) + 0.013
    wall(P[4], GR[0], (-1, 0, 0), lambda x, y: zd(x, y) if y < ybw(x) - 0.002 else capz(x, y), [((vt0, vt1, vz0, vz1))] if fine else [])
    A.poly([(P[3][0], P[3][1], z_cap(P[3][0]) + 0.013), (P[4][0], P[4][1], z_cap(P[4][0]) + 0.013), (P[4][0], P[4][1], zr), (P[3][0], P[3][1], zr)], w, (0, 1, 0))
    if fine:
        # the door's frame and leaf (a little in), its window, handle and hinges; the opening's reveal
        dp = lambda t, z, o=0.0: (a.x + u.x * Ld * t + n.x * o, a.y + u.y * Ld * t + n.y * o, z)
        for t in (dt0, dt1): A.poly([dp(t, dz0), dp(t, dz1), dp(t, dz1, -0.06), dp(t, dz0, -0.06)], C['inner'], (u.x * (1 if t == dt0 else -1), u.y * (1 if t == dt0 else -1), 0))
        A.poly([dp(dt0, dz1), dp(dt1, dz1), dp(dt1, dz1, -0.06), dp(dt0, dz1, -0.06)], C['inner'], (0, 0, -1))
        A.poly([dp(dt0, dz0), dp(dt1, dz0), dp(dt1, dz0, -0.06), dp(dt0, dz0, -0.06)], C['inner'], (0, 0, 1))
        A.poly([dp(dt0 + 0.004, dz0 + 0.004, -0.045), dp(dt1 - 0.004, dz0 + 0.004, -0.045), dp(dt1 - 0.004, dz1 - 0.004, -0.045), dp(dt0 + 0.004, dz1 - 0.004, -0.045)], C['roof'], n)
        for t, z in ((dt0 - 0.03 / Ld, None), (dt1 + 0.03 / Ld, None)): A.poly([dp(t - 0.02 / Ld, dz0 - 0.02, 0.012), dp(t + 0.02 / Ld, dz0 - 0.02, 0.012), dp(t + 0.02 / Ld, dz1 + 0.03, 0.012), dp(t - 0.02 / Ld, dz1 + 0.03, 0.012)], C['white'], n)
        G.poly([dp(0.5 - 0.15 / Ld, dz1 - 0.55, -0.046), dp(0.5 + 0.15 / Ld, dz1 - 0.55, -0.046), dp(0.5 + 0.15 / Ld, dz1 - 0.18, -0.046), dp(0.5 - 0.15 / Ld, dz1 - 0.18, -0.046)], C['glass'], n)
        acyl(A, dp(dt1 - 0.07 / Ld, dz0 + 0.95, -0.045), dp(dt1 - 0.07 / Ld, dz0 + 0.95, 0.01), 0.012, lambda q: C['steel'], seg=8)
        for zz in (dz0 + 0.3, dz1 - 0.3): acyl(A, dp(dt0 + 0.02 / Ld, zz - 0.06, 0.008), dp(dt0 + 0.02 / Ld, zz + 0.06, 0.008), 0.013, lambda q: C['steel'], seg=8)
        # the louvred vent in the after wall: the reveal, dark behind, four blades sloping down outward
        yv0 = GR[0][1] + (P[4][1] - GR[0][1]) * (1 - vt1); yv1 = GR[0][1] + (P[4][1] - GR[0][1]) * (1 - vt0); xv = GR[0][0]
        for yy in (yv0, yv1): A.poly([(xv, yy, vz0), (xv, yy, vz1), (xv + 0.05, yy, vz1), (xv + 0.05, yy, vz0)], C['inner'], (0, 1 if yy == yv0 else -1, 0))
        for zz in (vz0, vz1): A.poly([(xv, yv0, zz), (xv, yv1, zz), (xv + 0.05, yv1, zz), (xv + 0.05, yv0, zz)], C['inner'], (0, 0, 1 if zz == vz0 else -1))
        A.poly([(xv + 0.05, yv0, vz0), (xv + 0.05, yv1, vz0), (xv + 0.05, yv1, vz1), (xv + 0.05, yv0, vz1)], C['black'], (-1, 0, 0))
        for k in range(4):
            zz = vz0 + 0.06 + (vz1 - vz0 - 0.12) * k / 3; beam(A, (xv + 0.02, yv0 + 0.01, zz), (xv + 0.02, yv1 - 0.01, zz), 0.008, 0.07, C['white'], up=(0.7, 0, 0.7))
        # a handrail along the starboard wall
        F.pipe(A, [(1.32, -0.15, 1.65), (1.32, -0.21, 1.65), (1.55, -0.21, 1.65), (1.55, -0.15, 1.65)], 0.014, C['steel'], 6)
    # the roof: a lip with a drip edge, a little over the walls, the top cambered
    ro = offset_poly(P, 0.06); ro = [(x, min(y, ysh(x) - 0.002), ) for x, y in ro]
    A.poly([(x, y, zr + 0.001) for x, y in ro], C['inner'], (0, 0, -1))
    rt = lambda x, y: zr + 0.06 + 0.02 * ss(-0.2, 0.9, y)
    for i in range(len(ro)):
        p, q = ro[i], ro[(i + 1) % len(ro)]; nrm = (q[1] - p[1], -(q[0] - p[0]), 0)
        A.poly([(p[0], p[1], zr), (q[0], q[1], zr), (q[0], q[1], rt(*q)), (p[0], p[1], rt(*p))], C['cap'], nrm)
        A.poly([(p[0], p[1], zr - 0.001), (q[0], q[1], zr - 0.001), (q[0], q[1], zr - 0.022), (p[0], p[1], zr - 0.022)], C['frame'], nrm)
    A.poly([(x, y, rt(x, y)) for x, y in ro], C['roof'], (0, 0, 1))

def aft_deck(A, fine=True):
    s = lambda q: C['steel']
    # the hauling station on the starboard waist: the roller over the low bulwark between its cheeks (G; the hauler is the game's)
    yc = -(y_at(4.5, 1.28, -1) + 0.06)
    for x in (4.15, 4.85): abox(A, x - 0.02, x + 0.02, yc - 0.10, yc + 0.12, 1.20, 1.46, C['steel'])
    acyl(A, (4.13, yc, 1.36), (4.87, yc, 1.36), 0.06, lambda q: C['dark'], seg=16)
    for x in (4.15, 4.85): abox(A, x - 0.04, x + 0.04, yc + 0.06, -ycap(x, -1) + 0.04, 1.27, 1.30, C['steel'])
    if not fine: return
    # the rails on the aft bulwark: posts on bases on the cap, the top rail round the stern, down to the waist (G)
    xs = [0.45, 1.05, 1.65, 2.25, 2.85, 3.45]
    for sg in (1, -1):
        for x in xs:
            if sg > 0 and 1.2 < x < 2.7: continue                   # (the gear room stands there)
            zc = z_cap(x, sg) + 0.012; y = sg * gunwale_y(x, sg)
            acyl(A, (x_of(x, zc), y, zc - 0.003), (x_of(x, zc), y, zc + 0.008), 0.026, s, seg=10); acyl(A, (x_of(x, zc), y, zc), (x_of(x, zc), y, 1.75), 0.016, s, seg=8)
    XS = [0.45] + xs[1:]; xr = x_t(1.48) + 0.04; yy = gunwale_y(0.0) * 0.98
    pts = [(3.80, -gunwale_y(3.80, -1), z_cap(3.80, -1) + 0.02)] + [(x_of(x, 1.48), -gunwale_y(x, -1), 1.75) for x in reversed(XS)]
    pts += [(xr, -yy * 0.92, 1.75), (xr, 0.0, 1.75), (xr, yy * 0.92, 1.75)] + [(x_of(x, 1.48), gunwale_y(x), 1.75) for x in XS if x < 1.2]
    F.pipe(A, pts, 0.018, C['steel'], 8)
    F.pipe(A, [(x_of(x, 1.48), gunwale_y(x), 1.75) for x in XS if x > 2.7] + [(3.80, gunwale_y(3.80), z_cap(3.80) + 0.02)], 0.018, C['steel'], 8)
    for y in (-1.1, 0.0, 1.1):
        acyl(A, (xr, y, z_cap(0.0) + 0.012), (xr, y, 1.75), 0.016, s, seg=8); acyl(A, (xr, y, z_cap(0.0) + 0.009), (xr, y, z_cap(0.0) + 0.02), 0.026, s, seg=10)
    # the bitts on the quarters, the cleats amidships, the diesel filler by the wheelhouse, the fenders stowed, a deck hose coiled
    for y in (1.40, -1.40): bitts(A, 0.48, y, z_deck(0.48) + camber(0.48, y), 0.30)
    for x in (3.2,):
        for sg in (1, -1): F.cleat(A, (x, sg * gunwale_y(x, sg), z_cap(x, sg) + 0.006), (0, 0, 1), (1, 0, 0), 0.24, C['steel'])
    fx, fy = 5.10, 1.62; fz = z_deck(fx) + camber(fx, fy)
    acyl(A, (fx, fy, fz - 0.002), (fx, fy, fz + 0.012), 0.05, s, seg=16); acyl(A, (fx, fy, fz + 0.012), (fx, fy, fz + 0.02), 0.036, s, seg=16)
    vx, vz = fx + 0.3, z_cap(fx + 0.3) - 0.12; vy = y_at(vx, vz)
    acyl(A, (vx, vy - 0.002, vz), (vx, vy + 0.014, vz), 0.016, s, seg=10); obox(A, (vx, vy + 0.020, vz + 0.004), V((0.022, 0, 0)), V((0, 0.006, 0)), V((0, 0, 0.022)), C['steel'])
    for x in (0.95,):
        for yv in (0.55, -0.55): acyl(A, (x - 0.30, yv, z_deck(x) + camber(x, abs(yv) - 0.12) + 0.125), (x + 0.30, yv, z_deck(x) + camber(x, abs(yv) - 0.12) + 0.125), 0.12, lambda q: C['fender'], seg=14)
    hx, hy = 4.70, 0.95; hz = z_deck(hx) + camber(hx, hy)
    for k in range(3): F.atorus(A, (hx, hy, hz + 0.024 + 0.044 * k), (0, 0, 1), 0.24 - 0.02 * k, 0.022, lambda a: C['hose'], seg=20, rseg=6)
    # a mooring rope coiled on the forecastle by the bitts
    for k in range(4): F.atorus(A, (9.20, -0.75, z_bk(9.2) + camber(9.2, 0.75) + 0.02 + 0.035 * k), (0, 0, 1), 0.20 - 0.015 * k, 0.018, lambda a: C['rope2'], seg=20, rseg=5)
    # the flag staff in its socket on the transom rail to port, raked aft
    px, py = POLE; zp = z_cap(0.0) + 0.012
    acyl(A, (px, py, zp - 0.004), (px, py, zp + 0.14), 0.024, s, seg=10)
    acyl(A, (px, py, zp + 0.02), (px - 0.16, py, zp + 1.22), 0.016, lambda q: C['wood'], seg=8)
POLE = (0.20, 1.40)


# ---------- the masts and rigging: the tall mast in the wheelhouse's after port corner with its derrick, the fishing lights and the
# white all-round light on top; the aft mast through the gear room with the riding sail (G) ----------
FM = (5.40, 0.98)            # the forward mast (G: 5.46 on the profile, 5.15 on the plan; inside the house's after port corner)
FM_TOP = 8.34
RA = (4.49, 0.98)            # the open array's platform aft of the forward mast (its pedestal's centre)
AM = (1.50, 0.0)             # the aft mast up through the gear room
FISH_R, FISH_W = 8.23, 6.82  # the fishing lights on arms forward of the mast, red over white (G)
LAMP_ARM = 0.49
def white_z(): return FM_TOP + 0.20                           # the all-round white on the mast's top
SIDE_X = 7.02; SIDE_Z = 2.90 # the side lights on the wheelhouse's sides at its forward corners, under the roof's lip
STERN_L = (AM[0] - 0.10, 0.0, 4.16)

def rig(A, crown, fine=True):
    seg = 12 if fine else 6; fx, fy = FM; ax, ay = AM; m = C['mast']; s = lambda q: C['steel']; d = lambda q: C['dark']
    acyl(A, (fx, fy, WH_FLOOR - 0.004), (fx, fy, 7.42), 0.07, lambda q: m, seg=seg)
    acyl(A, (fx, fy, 7.42), (fx, fy, FM_TOP), 0.05, lambda q: m, seg=seg)
    acyl(A, (fx, fy, roof_z(fx) + 0.04), (fx, fy, roof_z(fx) + 0.16), 0.10, lambda q: C['rubber'], seg=seg)      # the mast boot on the roof
    acyl(A, (ax, ay, z_deck(ax) - 0.004), (ax, ay, 7.59), 0.065, lambda q: m, seg=seg)
    acyl(A, (ax, ay, GR_TOP + 0.06), (ax, ay, GR_TOP + 0.16), 0.09, lambda q: C['rubber'], seg=seg)
    acyl(A, (ax, ay, 7.59), (ax, ay, 7.66), 0.08, lambda q: m, seg=seg)
    # the all-round white on the forward mast's top (B8; the fishing lights under it on their arms)
    acyl(A, (fx, fy, FM_TOP), (fx, fy, white_z() - 0.05), 0.02, lambda q: m, seg=8)
    F.allround_lantern(A, (fx, fy, white_z()), C['lampW'], C['frame'], R=0.035, H=0.07)
    # the radar brackets (no radar in the model: kit.radar, kit.radarA): the dome's bracket forward of the mast, the open array's platform aft
    abox(A, fx, 6.20, fy - 0.04, fy + 0.04, 4.39, 4.47, m); abox(A, 5.94, 6.30, fy - 0.40, fy + 0.04, 4.39, 4.47, m)
    rx, ry = RA
    abox(A, rx - 0.25, rx + 0.25, ry - 0.22, ry + 0.22, 4.43, 4.47, m); abox(A, rx + 0.25, fx - 0.06, ry - 0.04, ry + 0.04, 4.39, 4.47, m)
    if fine:
        for sy in (-0.16, 0.16): acyl(A, (fx - 0.06, fy + sy * 0.3, 3.95), (rx - 0.18, ry + sy, 4.43), 0.018, lambda q: m, seg=6)
        acyl(A, (6.24, fy - 0.18, 4.39), (fx + 0.06, fy - 0.12, 3.90), 0.016, lambda q: m, seg=6)
    # the fishing lights: red over white on arms forward of the mast (rule 26; 1.41 m apart)
    for z, mt in ((FISH_R, C['lampR']), (FISH_W, C['lampW'])):
        abox(A, fx + 0.05, fx + LAMP_ARM - 0.03, fy - 0.02, fy + 0.02, z - 0.10, z - 0.07, m)
        acyl(A, (fx + LAMP_ARM, fy, z - 0.10), (fx + LAMP_ARM, fy, z - 0.07), 0.04, lambda q: m, seg=10)
        F.allround_lantern(A, (fx + LAMP_ARM, fy, z), mt, C['frame'], R=0.035, H=0.07)
    if not fine: return
    # the aerial bar with the whips, the cross-tree, the shrouds to chain plates on the caps, the forestay to an eye on the roof's front
    abox(A, fx - 0.10, fx + 0.95, fy - 0.03, fy + 0.03, 6.27, 6.33, m)
    F.whip(A, (fx + 0.55, fy, 6.33), 1.0, C['white'], r0=0.012, r1=0.005, m_foot=C['steel']); F.whip(A, (fx + 0.85, fy, 6.33), 0.8, C['white'], r0=0.012, r1=0.005, m_foot=C['steel'])
    abox(A, fx - 0.03, fx + 0.03, fy - 0.45, fy + 0.45, 6.20, 6.26, m)
    # the shrouds: to port down to a chain plate on the side abeam the mast; to starboard (the mast stands to port, so a shroud to the
    # starboard rail would cross the walkway beside the house at head height) to an eye on the roof's starboard edge
    cx = FM[0] + 0.05; cy = gunwale_y(cx) + 0.02; cz = z_cap(cx)
    obox(A, (cx, cy + 0.03, cz - 0.08), (0.04, 0, 0), (0, 0.006, 0), (0, 0, 0.12), C['steel'])            # the chain plate on the side
    acyl(A, (cx, cy + 0.03, cz + 0.02), (cx - 0.03, cy + 0.02, cz + 0.22), 0.012, s, seg=8)                # the bottle screw
    acyl(A, (fx, fy + 0.45, 6.22), (cx - 0.03, cy + 0.02, cz + 0.22), 0.007, d, seg=4)
    rx_, ry_ = 5.55, -(WH_W + 0.06); rz_ = roof_z(rx_) + 0.035
    obox(A, (rx_, ry_ - 0.01, rz_ + 0.04), (0.035, 0, 0), (0, 0.006, 0), (0, 0, 0.045), C['steel'])         # the eye plate on the roof's lip
    acyl(A, (rx_, ry_ - 0.01, rz_ + 0.08), (rx_ - 0.02, ry_ + 0.02, rz_ + 0.28), 0.012, s, seg=8)
    acyl(A, (fx, fy - 0.45, 6.22), (rx_ - 0.02, ry_ + 0.02, rz_ + 0.28), 0.007, d, seg=4)
    ef = (WH_XF + LEAN * (WH_TOP - WH_SILL) + 0.12, 0.0, roof_z(7.5) + 0.07)
    obox(A, (ef[0], 0, ef[2] + 0.02), (0.03, 0, 0), (0, 0.006, 0), (0, 0, 0.03), C['steel'])
    acyl(A, (fx, fy, 6.24), (ef[0], 0, ef[2] + 0.04), 0.007, d, seg=4)
    # the derrick: its heel in a gooseneck on the mast over the roof, the boom aft over the hatch, its topping lift, block and hook, the winch
    heel = (fx - 0.08, fy - 0.03, 3.40); tip = (3.33, 0.25, 4.95)
    obox(A, (fx - 0.06, fy, 3.40), (0.04, 0, 0), (0, 0.06, 0), (0, 0, 0.08), C['steel'])
    acyl(A, heel, tip, 0.05, lambda q: m, seg=10, r1=0.04)
    acyl(A, tip, (fx, fy, 6.20), 0.007, d, seg=4)
    sphere_ = sphere('d_block', (tip[0] - 0.02, tip[1], tip[2] - 0.10), 0.07, C['dark']); EXTRA.append(sphere_)
    acyl(A, (tip[0] - 0.02, tip[1], tip[2] - 0.14), (tip[0] - 0.02, tip[1], 4.40), 0.006, d, seg=4)
    F.atorus(A, (tip[0] - 0.02, tip[1], 4.34), (0, 1, 0), 0.06, 0.012, lambda a: C['dark'], seg=12, rseg=4)
    acyl(A, (fx - 0.12, fy - 0.20, 3.62), (fx - 0.12, fy + 0.06, 3.62), 0.09, lambda q: C['red'], seg=14)
    abox(A, fx - 0.16, fx - 0.08, fy - 0.20, fy + 0.06, 3.50, 3.54, C['steel'])
    acyl(A, (fx - 0.12, fy - 0.05, 3.71), (tip[0], tip[1], tip[2] - 0.12), 0.006, d, seg=4)
    # the aft mast: the boom on its gooseneck, the luff pole, the struts, the stays to the caps; the stern light on its aft face
    lx = ax - 0.11
    acyl(A, (ax, 0, 3.30), (-1.06, 0, 3.30), 0.04, lambda q: m, seg=10)
    acyl(A, (lx, 0, 3.30), (lx, 0, 7.40), 0.025, lambda q: m, seg=8)
    acyl(A, (-0.70, 0, 3.28), (ax - 0.05, 0, 4.62), 0.03, lambda q: m, seg=8)
    acyl(A, (-0.70, 0, 3.26), (1.34, 0, GR_TOP + 0.08), 0.03, lambda q: m, seg=8)
    for sg in (1, -1):
        cx = 3.70; cy = sg * (gunwale_y(cx, sg) + 0.02); cz = z_cap(cx, sg)
        obox(A, (cx, cy + sg * 0.03, cz - 0.08), (0.04, 0, 0), (0, 0.006, 0), (0, 0, 0.12), C['steel'])
        acyl(A, (ax, 0, 5.96), (cx, cy + sg * 0.03, cz + 0.05), 0.007, d, seg=4)
    F.stern_lantern(A, STERN_L, (-1, 0, 0), C['lampW'], C['frame'])
    abox(A, ax - 0.065, STERN_L[0] + 0.03, -0.03, 0.03, STERN_L[2] - 0.05, STERN_L[2] - 0.03, m)
    # on the wheelhouse roof: the rail aft, the dry exhaust with its rain cap, the searchlight, the horn, the compass, the GPS
    posts = [(5.22, y) for y in (-1.05, -0.35)] + [(x, sy * 1.18) for x in (5.6, 6.2, 6.8) for sy in (1, -1)]
    zr = lambda x, y: crown(x, y)
    for (x, y) in posts: acyl(A, (x, y, zr(x, y) - 0.004), (x, y, zr(x, y) + 0.32), 0.016, s, seg=8); acyl(A, (x, y, zr(x, y) - 0.004), (x, y, zr(x, y) + 0.01), 0.026, s, seg=10)
    F.pipe(A, [(6.8, 1.18, zr(6.8, 1.18) + 0.32), (5.32, 1.18, zr(5.3, 1.18) + 0.32), (5.22, 1.08, zr(5.2, 1.08) + 0.32), (5.22, -1.08, zr(5.2, 1.08) + 0.32),
               (5.32, -1.18, zr(5.3, 1.18) + 0.32), (6.8, -1.18, zr(6.8, 1.18) + 0.32)], 0.018, C['steel'], 8)
    ex = (6.05, 0.55)
    acyl(A, (ex[0], ex[1], zr(*ex) - 0.004), (ex[0], ex[1], zr(*ex) + 0.08), 0.11, s, seg=14)
    acyl(A, (ex[0], ex[1], zr(*ex) + 0.08), (ex[0], ex[1], 4.00), 0.065, s, seg=12)
    acyl(A, (ex[0], ex[1], 4.00), (ex[0], ex[1], 4.12), 0.065, lambda q: C['black'], seg=12)
    acyl(A, (ex[0], ex[1], 4.12), (ex[0] - 0.05, ex[1], 4.20), 0.075, lambda q: C['black'], seg=12)
    acyl(A, (ex[0], ex[1] + 0.06, 3.75), (fx + 0.06, fy - 0.02, 3.75), 0.012, s, seg=6)
    F.searchlight(A, (5.12, -0.60, zr(5.12, -0.6)), (1, 0), 0.085, C['dark'], C['lens'], C['steel'])
    acyl(A, (5.40, 0.30, zr(5.4, 0.3) + 0.12), (5.62, 0.30, zr(5.4, 0.3) + 0.15), 0.028, lambda q: C['white'], seg=10, r1=0.07)
    abox(A, 5.36, 5.44, 0.27, 0.33, zr(5.4, 0.3) - 0.004, zr(5.4, 0.3) + 0.12, C['steel'])
    abox(A, 6.95, 7.30, -0.20, 0.20, zr(7.1, 0) - 0.004, zr(7.1, 0) + 0.14, C['white']); EXTRA.append(sphere('roof_compass', (7.12, 0, zr(7.1, 0) + 0.20), 0.07, C['glass'], (1, 1, 0.7)))
    F.gps(A, (6.6, -0.75, zr(6.6, 0.75)), C['white'], r=0.07, h=0.12, m_post=C['steel'])
    # the work lights under the roof's lip aft, over the aft deck
    for yy in (-0.6, 0.6):
        c = V((WH_X0 - 0.06, yy, WH_TOP - 0.05)); obox(A, c, V((0.03, 0, 0)), V((0, 0.07, 0)), V((0, 0, 0.035)), C['dark'])
        A.poly([c + V((-0.031, -0.055, -0.025)), c + V((-0.031, 0.055, -0.025)), c + V((-0.031, 0.055, 0.025)), c + V((-0.031, -0.055, 0.025))], C['lens'], (-1, 0, -0.3))
EXTRA = []

def lanterns_side(A):
    """the side lights on a plate on each side of the wheelhouse at its forward corner, under the roof's lip (fittings.side_lantern draws
    its screen inboard, so neither shows across the bow)"""
    for sg, m in ((1, C['lampR']), (-1, C['lampG'])):
        obox(A, (SIDE_X, sg * (WH_W + 0.004), SIDE_Z), V((0.09, 0, 0)), V((0, 0.004, 0)), V((0, 0, 0.06)), C['frame'])
        F.side_lantern(A, (SIDE_X + 0.012, sg * (WH_W + 0.038), SIDE_Z), (1, 0, 0), (0, sg, 0), m, C['frame'], C['black'], R=0.03, H=0.05)


# ---------- the riding sail: set at sea, furled in port (M5), each a part of its own (the game shows the one the state asks for) ----------
SAIL = dict(tack=(AM[0] - 0.11, 3.40), clew=(-0.96, 3.40), head=(-0.38, 7.27), peak=(AM[0] - 0.11, 7.40))
def sail_set(fine=True):
    A = Acc('sail'); P3 = lambda q: (q[0], 0.0, q[1]); ax = AM[0]
    F.sail(A, P3(SAIL['tack']), P3(SAIL['clew']), P3(SAIL['head']), P3(SAIL['peak']), C['sail'], C['sailedge'], m_seam=C['sailseam'], belly=0.11, panels=5, fine=fine)
    acyl(A, (ax, 0, 7.43), (-0.40, 0, 7.27), 0.035, lambda q: C['mast'], seg=10)                          # the gaff
    acyl(A, (-0.36, 0, 7.25), (1.24, 0, 5.92), 0.03, lambda q: C['mast'], seg=8)                          # the sprit
    acyl(A, (1.30, 0, 7.45), (0.36, 0, 6.74), 0.03, lambda q: C['mast'], seg=8)
    EXTRA_SAIL.append(sphere('sprit_block', (0.38, 0, 6.72), 0.06, C['dark']))
    acyl(A, (-0.38, 0, 7.25), (-0.96, 0, 3.32), 0.008, lambda q: C['dark'], seg=4)
    return A.done(80)
def sail_furled(fine=True):
    """the sail furled on the boom under its lashings, the gaff lowered onto it"""
    A = Acc('sailf'); ax = AM[0]; x0, x1 = ax - 0.16, -0.92; zb = 3.30
    rr = lambda t: 0.10 * math.sin(math.pi * min(1.0, 0.15 + t * 0.85)) + 0.03
    rings = [[(x0 + (x1 - x0) * t, 0.11 * math.cos(2 * math.pi * k / 12) * rr(t) / 0.13, zb + 0.10 + rr(t) * (0.8 + 0.8 * math.sin(2 * math.pi * k / 12))) for k in range(12)] for t in [i / 10 for i in range(11)]]
    F.loft(A, rings, lambda i: C['sail'], cap0=True, cap1=True)
    for t in (0.15, 0.4, 0.65, 0.88):
        xx = x0 + (x1 - x0) * t; F.atorus(A, (xx, 0, zb + 0.10 + rr(t) * 0.8), (1, 0, 0), rr(t) * 1.02 + 0.012, 0.008, lambda a: C['sailedge'], seg=12, rseg=4)
    acyl(A, (ax, 0.04, 3.55), (-0.38, 0.04, 3.48), 0.035, lambda q: C['mast'], seg=10)                     # the gaff, lowered
    return A.done(60)
EXTRA_SAIL = []


# ---------- under water: the shoe, the rudder on its stock, the propeller on its shaft out of the keel, the anodes ----------
RX_ = 1.02                   # the rudder's stock (its leading edge; G)
PROP = (1.43, 0.0, -0.85); PR = 0.34                         # the propeller's centre and radius (180 hp at about 2.5:1, a 27 in wheel)
def underwater(fine=True):
    U = Acc('under')
    abox(U, 0.80, X_KA + 0.06, -0.07, 0.07, -1.78, -1.70, C['af'])                                # the shoe, from the keel to the rudder's heel (G)
    acyl(U, (RX_, 0, -1.70), (RX_, 0, -1.64), 0.03, lambda q: C['steel'], seg=10)
    F.foil_rudder(U, (RX_, 0.0), -1.66, 0.0, 0.62, C['af'], thick=0.14, top=lambda x: z_low(max(x, 0.0)) - 0.04, n=12 if fine else 5, rows=6 if fine else 2)
    acyl(U, (RX_ - 0.04, 0, -1.66), (RX_ - 0.04, 0, z_low(RX_) + 0.08), 0.035, lambda q: C['steel'], seg=10)
    acyl(U, (RX_ - 0.04, 0, z_low(RX_) - 0.05), (RX_ - 0.04, 0, z_low(RX_) + 0.01), 0.07, lambda q: C['prop'], seg=12)
    px, py, pz = PROP
    acyl(U, (px + 0.07, 0, pz), (X_KA + 0.06, 0, pz), 0.03, lambda q: C['steel'], seg=10)
    acyl(U, (X_KA - 0.04, 0, pz), (X_KA + 0.06, 0, pz), 0.07, lambda q: C['prop'], seg=14, r1=0.08)
    acyl(U, (px + 0.14, 0, pz), (px + 0.20, 0, pz), 0.06, lambda q: C['anode'], seg=14)
    F.propeller(U, PROP, (1, 0, 0), PR, C['prop'], n=3, hub=0.20, pitch=0.80, skew=0.30, cpp=False, fine=fine)
    if fine:
        for sg in (1, -1):
            for x, z in ((2.3, -1.0), (5.0, -1.2)): F.anode(U, (x, sg * (wk(x) + 0.004), z), (0, sg, 0), (1, 0, 0), C['anode'], L=0.30, w=0.09, t=0.035, m_strap=C['steel'])
            F.anode(U, (x_of(0.0, -0.06) - 0.003, sg * 0.45, -0.06), (-1, 0, 0.29), (0, 1, 0), C['anode'], L=0.20, w=0.07, t=0.03, m_strap=C['steel'])
        def onb(xt, yt):
            P = vline(xt); return z_on(P, abs(yt))
        zt = onb(4.6, 0.45); acyl(U, (4.6, -0.45, zt + 0.02), (4.6, -0.45, zt - 0.03), 0.06, lambda q: C['dark'], seg=16, r1=0.055)
        xi, yi_ = 3.4, 0.42; zi = onb(xi, yi_)
        for k in range(5): abox(U, xi - 0.08, xi + 0.08, yi_ - 0.06 + 0.03 * k - 0.007, yi_ - 0.06 + 0.03 * k + 0.007, zi - 0.012, zi + 0.02, C['dark'])
    return U.done(35)


def build(fine=True):
    HELM_EXTRA.clear(); EXTRA.clear()
    M = Mesh('hull'); hull_shell(M, fine)
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
    wh, wg, crown = wheelhouse(fine)
    if fine: helm(A, G, fine)
    forecastle(A, fine); aft_deck(A, fine); gear_room(A, G, fine); rig(A, crown, fine); lanterns_side(A)
    # the transom's fender across the stern at the strake (G)
    if fine:
        z = z_rub(0.0); xt = x_t(z) - 0.02; yy = y_at(0.0, z) + 0.01
        acyl(A, (xt, -yy, z), (xt, yy, z), RUBH, lambda q: C['cap'], seg=10)
    out = [hull, A.done(35, tint=wear), underwater(fine)] + wh + HELM_EXTRA + EXTRA
    g = G.done(35)
    return [o for o in out if o], wg + ([g] if g else [])


def to_game(p): return (-p[1], p[2] - WL, -(p[0] - XM))
def to_game_n(n): return (-n[1], n[2], -n[0])

def name_strips(G):
    """where the name is written (vessel3d.js nameStrips): on the white topsides under the strake on the forecastle, aft of the
    registration mark's place forward (markStrips; maletest: never on each other), and across the transom over the red line"""
    out = []
    for sg, xs in ((1, [7.45 - 1.25 * k / 12 for k in range(13)]), (-1, [6.20 + 1.25 * k / 12 for k in range(13)])):
        B = []; T = []
        for x in xs:
            for arr, z in ((B, NAME_Z[0]), (T, NAME_Z[1])): arr.append(G(x, sg * (y_at(x, z, sg) + 0.03), z))
        out.append([B, T])
    w = y_at(0.0, 0.9) * 0.72; ys = [w - 2 * w * k / 12 for k in range(13)]
    out.append([[G(x_t(0.79) - 0.025, y, 0.79) for y in ys], [G(x_t(1.00) - 0.025, y, 1.00) for y in ys]])
    return out
NAME_Z = (0.84, 1.12)

def kit_places(G):
    """the places where the game sets the deck kit (nothing that can be bought is modelled in, only its place, 19.10.2026): the liferaft
    in its cradle on the wheelhouse roof forward of the rail; the ring buoys on the wheelhouse's aft wall to starboard (the first, with its
    light and line) and on the gear room's forward face to port; the radome on its bracket forward of the mast, the open array on the
    platform aft of it; the net tub and the line tubs on the deck forward of the hatch to port, the freight on the hatch boards and aft"""
    r = lambda a: round(a, 3); zt = HOLD_H + 0.04
    gx, gy = 2.60, 1.50; gn = math.atan2(GR[3][0] - GR[2][0], GR[3][1] - GR[2][1])
    return {'raft': [G(6.45, -0.05, roof_z(6.45) + 0.12) + [0.0]],
            'buoys': [G(WH_X0 - 0.03, -0.62, 2.35) + [0.0], G(gx, gy, 2.45) + [r(math.pi - gn)]],
            'radar': G(6.12, FM[1] - 0.18, 4.47), 'radarA': G(RA[0], RA[1], 4.47),
            'garn': {'at': G(4.62, 0.95, z_deck(4.62) + camber(4.62, 0.95)), 'ry': r(math.pi / 2)},
            'stamps': {'at': G(4.40, 1.10, z_deck(4.40) + camber(4.4, 1.1)), 'ry': r(math.pi / 2)},
            'cargo': [G(3.2, 0.0, z_deck(3.2) + zt) + [r(math.pi / 2)], G(0.95, -0.60, z_deck(0.95) + 0.03) + [0.0]]}

def bower(G):
    return {'kind': 'plog', 'kg': 16, 'fair': G(10.74, 0, z_cap(10.55) + 0.09), 'gypsy': G(9.45, -0.21, z_bk(9.45) + 0.33), 'side': 0, 'deck': True}

HX = 4.50                    # the hauler's station on the starboard waist (G)
def anchors():
    G = lambda x, y, z: [round(v, 3) for v in to_game((x, y, z))]
    zd = z_deck(3.0); px, py = POLE
    return {'bower': bower(G), 'eye': G(SKIP[0], SKIP[1], WH_FLOOR + EYE_H), 'skipperAt': G(SKIP[0], SKIP[1], WH_FLOOR), 'hp': HP, 'fov': FOV,
            # the hands: the fisher at the hauler on the starboard waist, the one who guts at the bench to port of the hatch, one by the
            # bleeding tub, one aft by the gear room's door
            'crewSpots': [G(4.40, -1.30, z_deck(4.4)) + [1.57], G(3.30, 0.95, z_deck(3.3)) + [-1.57], G(3.85, -0.95, z_deck(3.85)) + [3.14], G(1.20, -0.75, z_deck(1.2)) + [0.0]],
            # typed lights (B8): under 12 m an all-round white (on the mast's top) and the side lights, the stern light on the aft mast;
            # the fishing lights red over white on their arms (rule 26; lanterns() lights them where the model has them); work lights
            'lights': [[G(FM[0], FM[1], white_z()), [1, 0.95, 0.85], 'allround'],
                       [G(SIDE_X + 0.012, WH_W + 0.068, SIDE_Z), [1, 0.12, 0.1], 'port'], [G(SIDE_X + 0.012, -(WH_W + 0.068), SIDE_Z), [0.1, 1, 0.35], 'stbd'],
                       [G(*STERN_L), [1, 0.95, 0.85], 'stern'], [G(FM[0] + LAMP_ARM, FM[1], FISH_R), [1, 0.12, 0.1], 'fishR'], [G(FM[0] + LAMP_ARM, FM[1], FISH_W), [1, 0.95, 0.85], 'fishW'],
                       [G(WH_X0 - 0.08, 0.0, WH_TOP - 0.08), [1, 0.95, 0.85], 'work']],
            # the steps up to the forecastle beside the wheelhouse, both sides (deckMap: the walkway is too narrow for the map's own link)
            'stairs': [{'from': G(5.50, sg * 1.62, z_deck(5.5)), 'to': G(6.40, sg * 1.62, z_bk(6.4))} for sg in (1, -1)],
            'doors': [{'at': G((DOOR[0] + DOOR[1]) / 2, -WH_W - 0.03, z_deck(5.6)), 'w': round(DOOR[1] - DOOR[0], 2), 'h': round(DOOR[3] - z_deck(5.6), 2),
                       'in': G((DOOR[0] + DOOR[1]) / 2, -WH_W + 0.6, WH_FLOOR), 'to': 'helm', 'hinge': 'fwd'}],
            'names': name_strips(G),
            # the work at sea (havsjark-grunnlag kap. 6.2): the fisher at the hauler on the starboard waist; the bleeding tub on the deck just
            # aft of him; the gutting bench (the game's steel one) across the hatch at the port bulwark, the one who guts inboard of it; the
            # gutted fish go down the hatch between them, on ice
            'work': {'table': G(3.30, 1.55, z_deck(3.3)), 'tub': G(3.80, -1.38, z_deck(3.8))},
            'hatch': G(3.2, 0.0, z_deck(3.2) + HOLD_H + 0.04), 'bunk': G(8.0, 0.6, z_bk(8.0) - 0.6), 'exhaust': G(6.0, 0.55, 4.20),
            'deck': {'y': round(zd - WL, 3), 'z': round(-(3.0 - XM), 3)}, 'gw': round(z_cap(4.5, -1) - WL, 3),
            'stern': round(XM + 0.2, 3), 'bow': round(-(10.3 - XM), 3), 'side': 1.9, 'beam': BEAM, 'pl': 4.2, 'rl': 1.56, 'open': False, 'hand': False,
            'pole': G(px - 0.16, py, z_cap(0.0) + 1.24), 'hauler': G(HX, -(gunwale_y(HX, -1) - 0.02), z_cap(HX, -1) + 0.24), 'filler': G(5.10, 1.62, z_deck(5.1) + 0.06),
            'kit': kit_places(G)}


# ---------- the checks against the tables, the data, the rules and the game's demands ----------
def displacement(wl):
    xs = [XA + (XF - XA) * i / 400 for i in range(401)]
    def area(x):
        s = section(x); a = 0.0
        for (y0, z0, _), (y1, z1, _) in zip(s, s[1:]):
            za, zb = min(z0, wl), min(z1, wl)
            if z1 > z0 and za < wl: a += (y0 + y1) / 2 * (zb - za)
        return 2 * a
    A = [area(x) for x in xs]
    return sum((A[i] + A[i + 1]) / 2 * (xs[i + 1] - xs[i]) for i in range(400)) * 1.025, max(A)

def check():
    out = []
    v, amax = displacement(WL); wl1 = WL
    st = -0.005 if v > DISP else 0.005
    for _ in range(80):
        if (displacement(wl1)[0] - DISP) * st < 0: wl1 += st
        else: break
    out.append(('deplasement %.2f t ved tegningens vannlinje (kjølen med) mot %.1f t i VESSELS; %.1f t gir vannlinja %.2f m %s (største snitt %.2f m2)' % (v, DISP, DISP, abs(WL - wl1), 'lavere' if wl1 < WL else 'høyere', amax), abs(v - DISP) / DISP < 0.15))
    xs = [XA + (XF - XA) * i / 400 for i in range(401)]
    loa = XF - (x_t(z_rub(0.0)) - 0.02 - RUBH)
    out.append(('lengde over alt %.2f m (fenderlista over speilet til stevnens topp; baugrulla til %.2f) mot %.2f' % (loa, 10.74 + 0.05, L), abs(loa - L) / L < 0.015))
    mb = max(ysh(x) for x in xs[::4]); mr = max(y_at(x, z_rub(x)) + RUBW for x in xs[::4])
    out.append(('største bredde %.2f m ved ripa, %.2f over fenderlista, mot %.2f (vannlinja %.2f m, %.0f %%)' % (2 * mb, 2 * mr, BEAM, 2 * max(y_at(x, WL) for x in xs), 100 * max(y_at(x, WL) for x in xs) / mb), abs(2 * mr - BEAM) / BEAM < 0.03))
    dr = WL - min(kb(x) for x in xs if X_KA <= x <= X_KF); dsh = WL + 1.78
    out.append(('AVVIK dypgang %.2f m med kjølen (%.2f med skoen) på tegningens vannlinje mot %.2f i VESSELS (annonsene; tegningens lastelinje er trolig dypere)' % (dr, dsh, DRAFT), True))
    out.append(('fribord midtskips %.2f m, ved stevnen %.2f, ved speilet %.2f; dekket %.2f over vannet midtskips' % (z_cap(XM) - WL, z_cap(XF) - WL, z_cap(XA) - WL, z_deck(XM) - WL), z_deck(XM) - WL > 0.3))
    wz = white_z()
    out.append(('den hvite rundtlysende %.2f m over sidelanternene (vedlegg I 2(d): minst 1 m)' % (wz - SIDE_Z), wz - SIDE_Z >= 1.0))
    hs, hw = SIDE_Z - z_cap(SIDE_X), wz - z_cap(FM[0])
    out.append(('sidelanternene %.2f m over skroget, den hvite %.2f (vedlegg I 2(g): sidene høyst tre firedeler så høyt, %.2f)' % (hs, hw, 0.75 * hw), hs <= 0.75 * hw))
    sp = FISH_R - FISH_W
    out.append(('fiskelysene rødt over hvitt %.2f m fra hverandre (vedlegg I 2(i), under 20 m: minst 1 m), det hvite %.2f m over sidelanternene (2(j): minst to ganger avstanden, %.2f)' % (sp, FISH_W - SIDE_Z, 2 * sp),
                sp >= 1.0 and FISH_W - SIDE_Z >= 2 * sp))
    px, py = POLE
    out.append(('masta med den hvite står %.1f m fra flaggstanga og over den: spillet gir vimpel (båten har mast)' % math.hypot(FM[0] - px, FM[1] - py), math.hypot(FM[0] - px, FM[1] - py) > 1.0 and wz > z_cap(0.0) + 1.3))
    tip = PROP[2] + PR; low = PROP[2] - PR
    out.append(('propellen Ø %.2f: %.2f m klaring til skroget over, %.2f til skoen under, %.2f til kjølen forut, %.2f til roret akter' % (2 * PR, z_low(PROP[0]) - tip, low + 1.70, X_KA - PROP[0] - 0.08, PROP[0] - 0.08 - RX_),
                z_low(PROP[0]) - tip > 0.08 and low + 1.70 > 0.05 and X_KA - PROP[0] - 0.08 > 0.1 and PROP[0] - 0.08 - RX_ > 0.1))
    out.append(('styrehuset: %.2f m under taket over dørken der skipperen står (brotest: 1.8 for den som står)' % (WH_TOP - WH_FLOOR), WH_TOP - WH_FLOOR >= 1.8))
    ey = WH_FLOOR + EYE_H
    out.append(('øyet %.2f m over frontvinduenes underkant, %.2f under overkanten' % (ey - WIN_Z[0], WIN_Z[1] - ey), ey - WIN_Z[0] > 0.2 and WIN_Z[1] - ey > 0.05))
    (dx0, dz0), (dx1, dz1) = DASH
    ang = math.degrees(math.atan2(ey - (dz0 + dz1) / 2, (dx0 + dx1) / 2 - SKIP[0])); up = math.degrees(math.atan2(WIN_Z[1] - ey, WH_XF + LEAN * (WIN_Z[1] - WH_SILL) - SKIP[0]))
    out.append(('dashbordet %.0f grader under øyet, vinduets overkant %.0f over (hp %.2f rad og fov %d: synsfeltet går fra %.0f ned til %.0f grader)' % (ang, up, HP, FOV, FOV / 2 - math.degrees(-HP), math.degrees(-HP) + FOV / 2),
                ang <= math.degrees(-HP) + FOV / 2 and up <= FOV / 2 - math.degrees(-HP) + 12))
    out.append(('rattet %.2f m forut for skipperen (han står bak det, ikke i det)' % (WHEEL[0] - SKIP[0]), 0.3 <= WHEEL[0] - SKIP[0] <= 0.55))
    # the game's deck map (vessel3d.js deckMap, sulebas-bygging kap. 15): a floor needs DM_HEAD 1.85 m free over it; a part within 0.6 m and
    # up to 1.6 m higher than the deck is joined to it. The forecastle's deck beside the wheelhouse is deck (the steps): the roof over it
    # must stand more than 1.6 m higher, or the game's rule that a roof over a room is no deck (deckMap, 01.11.2026) must hold
    side = ybw(6.6) - (WH_W + 0.10); rh = (WH_TOP + 0.07) - z_bk(6.6)
    out.append(('taket %.2f m over forskipets gang (%.2f m bred) ved siden av styrhuset: spillet tar et tak over et rom (styrhusets dørk %.2f m under) for tak, ikke dekk' % (rh, side, WH_TOP + 0.07 - WH_FLOOR),
                WH_TOP + 0.07 - WH_FLOOR >= 1.85 and side >= 0.4))
    over = 0.10; head = WH_TOP - z_deck(WH_X0)
    out.append(('taket henger %.2f m over aktre dekk med %.2f m fri høyde (dekkskartet: 1.85, ellers høyst en celle)' % (over, head), head >= 1.85 or over <= 0.2))
    out.append(('redskapsrommets tak %.2f m over dekket (knyttes ikke til dekket over 1.6 m)' % (GR_TOP + 0.06 - z_deck(1.9)), GR_TOP + 0.06 - z_deck(1.9) > 1.6))
    # the name strips under the strake, the mark forward (markStrips: on 9-15 m a 0.34 m strip about 1.1 m from the stem): never on each other
    out.append(('navnefeltene på sidene %.2f-%.2f m over vannet fra x %.2f til %.2f, merket forut for x 8.3 (maletest: aldri oppå hverandre)' % (NAME_Z[0], NAME_Z[1], 6.20, 7.45), 7.45 < 8.3))
    # vessel3d: the hull from 0.3 m under the water to 1.5 m over it, with what stands out over the rail
    xs2 = [x for x in xs if True]; z0b, z1b = -0.3, 1.5
    ln = max(x_of(x, z1b) for x in xs2 if z_low(x) < z1b) - min(x_of(0.0, z) for z in (z0b, z1b))
    out.append(('vessel3d: skroget i båndet -0.3 til 1.5 m er %.2f m langt (lengden %.2f, -6 %% til +3 %%) og %.2f m bredt (bredden %.2f, ±5 %%)' % (ln, L, 2 * mr, BEAM), -0.06 < (ln - L) / L < 0.03 and abs(2 * mr - BEAM) / BEAM < 0.05))
    for s, ok_ in out: print(('OK   ' if ok_ else 'FEIL ') + s)
    return all(o for _, o in out)


SHOTS = [('bow3q', (16.5, -11.5, 4.2), (5.0, 0, 2.2), 35), ('stern3q', (-8.0, 10.5, 5.2), (4.0, 0, 2.2), 35), ('side', (5.0, -21, 1.6), (5.0, 0, 2.6), 35),
         ('above', (13.0, -9.0, 13.0), (5.0, 0, 1.5), 35), ('deck', (0.6, -4.2, 4.6), (5.0, 0.4, 1.6), 24)]
ZC = z_deck(3.0)             # the working deck's height (shots.py K5)
K5 = ((0.55, -1.15, z_deck(0.6) + 1.70), (5.2, 0.2, z_deck(5.0) + 0.6))      # from the starboard quarter (the gear room stands on the centreline aft)
EYE = (SKIP[0], SKIP[1], WH_FLOOR + EYE_H)
CLOSE = [('c_helm', (6.40, -0.10, 2.80), (7.25, -0.55, 2.05), 30, False, False), ('c_wh', (9.5, -4.6, 3.4), (6.2, -0.4, 2.3), 30, True, False),
         ('c_stern', (-3.4, -2.6, 2.3), (0.3, 0, 1.0), 32, True, False), ('c_bow', (12.6, -2.6, 3.0), (9.8, 0, 1.9), 30, False, False),
         ('c_aperture', (1.4, -3.4, -0.9), (1.35, 0, -0.95), 30, False, False), ('c_work', (5.8, -0.2, 4.6), (3.4, 0.0, 0.8), 30, False, False),
         ('c_gear', (4.2, -2.6, 3.3), (1.9, 0.6, 2.0), 30, False, False), ('c_rig', (8.5, -6.0, 5.5), (4.5, 0.5, 5.5), 35, True, False),
         ('K6p', (5.3 + 31.0, 24.0, 3.0), (5.3, 0, 0.9), 100, True, True)]      # K6 from the port bow: the red and the white only

def main():
    os.makedirs(OUT, exist_ok=True)
    if 'check' in sys.argv: sys.exit(0 if check() else 1)
    check()
    reset(); colours()
    solids, glass = build(True)
    join(solids, 'BOAT0'); join(glass, 'GLASS0')
    if 'fast' not in sys.argv and 'dry' not in sys.argv: beauty(OUT, 'hj', WL, SHOTS)
    # the riding sail's two parts (the game draws the one the state asks for; the middle version wears them on top: LODM_TRIS less theirs)
    EXTRA_SAIL.clear(); sS = sail_set(True); sF = sail_furled(True); join([sS] + EXTRA_SAIL, 'SAIL');
    for o in (bpy.data.objects['SAIL'], sF): o.hide_render = True
    ns = max(len(o.data.polygons) for o in (bpy.data.objects['SAIL'], sF)) * 2
    bpyutil.LODM_TRIS = 40000 - ns
    ex = {'frame': 'kystfiske: x starboard, y up from the waterline, z aft; metres', 'type': 'sjark', 'name': 'Havsjark 35 fot', 'len': L, 'beam': BEAM, 'draft': DRAFT,
          'anchors': anchors()}
    export_boat(build, to_game, to_game_n, OUT, 'havsjark35.glb', os.path.join(ROOT, 'src', 'data', 'boat-havsjark35.b64'), ex,
                side=(os.path.join(ROOT, 'src', 'data', 'boat-havsjark35-side.b64'), 4.8, 3.6, 12.8), dry='dry' in sys.argv,
                more=[{'name': 'sail', 'obj': bpy.data.objects['SAIL'], 'ao': False, 'show': False}, {'name': 'sailf', 'obj': sF, 'ao': False, 'show': False}])


if __name__ == '__main__':
    main()
