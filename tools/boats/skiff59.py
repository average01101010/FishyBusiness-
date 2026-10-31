"""The skiff: an open 5.9 m aluminium plate boat with a centre console and a 60 hp outboard, the cheapest boat in the game.

Rebuilt 31.10.2026 after the pilot boat's way of working (docs/skipsmodeller/skiff-grunnlag.md, sulebas-bygging.md; Jonas: «Løft den
til samme nivå og arbeidsmåte som pilotbåten», «En mye mer detaljert modell enn vi har i dag»). The lines are the old script's tables,
measured on the general arrangement of a 5.9 m plate boat (stations 700 mm apart, 93.9 px/m; the drawing is not in the repository):
length 5.9 m, beam 2.45 m, depth 1.17 m, draft 0.3 m, deadrise 10.5 degrees at the transom. Painted white with a navy boot stripe and
a grey bottom (Jonas' choice; paint zones 1 and 2). No photograph of the boat exists here; check() compares the model with the
tables, the game's data and the rules for the lanterns.

The hull is ONE surface: both sides, the keel line, the transom with its notch for the outboard, the pods each side of it, the gunwale
tops, the inner liner with the side pockets, the bench and the splash well, the sole, the casting deck and the bow deck share their
points (Mesh). Openings are real holes: the hatches in their gutters, the side pockets, the rod holders, the bilge pump's outlet and
the tank's vent. Nothing lies in the plane of anything else: what stands on a deck has no bottom and its feet a few mm into it.
The fittings other boats can use are in fittings.py (the cleat, the lanterns, the bow roller, the hatch lid, the tread plate, the
lining of a hole, the outboard).

Nothing that can be bought is modelled in (the game sets the deck kit at the places in kit, 19.10.2026). The wheel and the throttle
are drawn by the game (render_only() draws them for the renders); the outboard and its propeller are parts of their own (they turn),
and the console's screens are anchors (skiff.scr) where the game draws its live plotter, gauges and VHF (Jonas 31.10.2026).

    pip install bpy==4.5.4   (Python 3.11)
    python3 tools/boats/skiff59.py            -> src/data/boat-skiff59.b64 (+ the side picture), renders in tools/boats/out/
    python3 tools/boats/skiff59.py fast dry   -> no renders, the GLB only in tools/boats/out
    python3 tools/boats/skiff59.py check      -> the checks against the tables and the data only

Frame: x forward from the after end of the transom pods, y to port, z up from the keel at the transom; the waterline is z = 0.30."""
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy, bmesh
from bpyutil import *
import bpyutil
import fittings as F
from mathutils import noise

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE)); OUT = os.path.join(HERE, 'out')
L = 5.9; BEAM = 2.45; DISP = 1.0                     # VESSELS.skiff
WL = 0.30; XT = 0.60; XF = 5.80; XM = 3.0            # the waterline, the transom, the stem's top, the game's origin
Z_SOLE = 0.45; Z_CAST = 0.82; X_CAST = 4.08; X_BOW = 5.35; GW = 0.19; ZP = 0.62
YP = 0.34                                            # the pods' inner sides, the notch's half width
ZN = 0.70                                            # the notch's top, where the outboard clamps (25 in shaft)
ZWF = 0.56                                           # the splash well's floor, under the notch
XTT = XT + 0.20                                      # the transom top's inner edge
XW1 = 0.88                                           # the splash well's fore wall
XB1 = 1.10; Z_BENCH = 0.90                           # the bench's fore face and its top
PX0, PX1, PZ0, PZ1 = 1.30, 3.70, 0.60, 0.80          # the side pockets in the liner
Z_BOT = 0.34; Z_BT = 0.40                            # the grey bottom paint to 0.34, the navy boot stripe to 0.40, amidships (x 3.0)
SLB = 0.015                                          # the paint lines rise 15 mm a metre forward (they follow the sheer, planliste kap. 29)
PL = 0.004                                           # the plating's thickness (for the checks)


# ---------- the measured lines (metres; the general arrangement, the old script) ----------
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
def cf(x): return 0.05 * min(1.0, hbc(x) / 0.25)          # the chine flat (the reversed chine, a spray rail), narrowing into the stem
def yi(x): return max(0.05, hbs(x) - GW)                   # the inside edge of the gunwale, and the liner under it
YIT = yi(XTT)
def y4(x): return YP if x <= XT else YP * hbc(x) / hbc(XT)    # the bottom's column that is the pods' inner side aft of the transom

BI_F = [0.0, 0.25, 0.5, 0.75, 1.0]; BO_F = [0.12, 0.25, 0.38, 0.5, 0.62, 0.74, 0.86, 1.0]
BI_C = [0.0, 1.0]; BO_C = [0.5, 1.0]
def idx(fine):
    nb = len(BI_F if fine else BI_C); ich = nb + len(BO_F if fine else BO_C) - 1
    return nb - 1, ich, ich + 1, ich + 1 + (4 if fine else 3)      # the pods' column, the chine, the chine flat's edge, ZP

def section(x, fine=True):
    """the half-section at station x as (y, z), from the keel: the bottom plate straight to the chine (a column at the pods' inner
    side), the chine flat, the topsides straight to the sheer with rows on the paint lines and on the pods' top; the counts never
    change, so points collapse where a band is empty (the bow)"""
    k = zk(x); c = zc(x); h = hbc(x); s = zs(x); H = hbs(x); a = min(y4(x), h)
    BI, BO = (BI_F, BO_F) if fine else (BI_C, BO_C)
    bz = lambda y: k + (c - k) * (y / h) if h > 1e-6 else k
    pts = [(a * f, bz(a * f)) for f in BI] + [(a + (h - a) * f, bz(a + (h - a) * f)) for f in BO]
    y0 = h + cf(x); z0 = min(c + 0.006, s); pts.append((y0, z0))
    # the rows up the topsides: at the pods fixed heights (the paint lines, the pods' top), forward of them even steps from the chine to
    # the sheer, blended over a metre (the paint lines are cut in afterwards: build(), bisect_plane)
    zl = [Z_BOT, Z_BT, 0.51, ZP] if fine else [Z_BOT, Z_BT, ZP]
    NT = 6 if fine else 2; zb = max(ZP, z0); nr = len(zl) + NT
    zl += [zb + (s - zb) * i / NT for i in range(1, NT + 1)]
    w = ss(XT, XT + 1.0, x)
    for i, z in enumerate(zl):
        ze = z0 + (s - z0) * (i + 1) / nr
        zz = min(max(z * (1 - w) + ze * w, z0), s); t = (zz - z0) / (s - z0) if s - z0 > 1e-6 else 1.0
        pts.append((y0 + (H - y0) * t, zz))
    return pts

def y_at(x, z):
    """the half-breadth of the outside at station x and height z"""
    s = section(x)
    if z <= s[0][1]: return 0.0
    for a, b in zip(s, s[1:]):
        if a[1] <= z <= b[1] and b[1] > a[1]: return a[0] + (b[0] - a[0]) * (z - a[1]) / (b[1] - a[1])
    return s[-1][0]

def bot_z(x, y):
    """the bottom's height under (x, y) (from the keel to the chine)"""
    h = hbc(x); k = zk(x); c = zc(x)
    return k + (c - k) * min(1.0, y / h) if h > 1e-6 else k


# ---------- the places that need stations of their own ----------
HATCH_SOLE = (3.30, 3.92, -0.32, 0.32)
HATCH_BIG = (4.16, 4.76, -0.58, 0.58)
HATCH_SMALL = (4.84, 5.26, -0.28, 0.28)
HATCH_BOW = (5.40, 5.62, -0.16, 0.16)
LID_P = (XTT + 0.04, XB1 - 0.03, 0.40, 0.96)          # the bench's lids each side of the well (port; starboard mirrored)
RODS = (1.15, 1.55)                                   # the flush rod holders in the gunwales, both sides
HOLES = [(-1, 1.30, 0.74, 0.012, 'bilge'), (-1, 0.80, 0.94, 0.008, 'vent')]   # the hull's holes: side, x, z, radius, kind
def _cell(xc, w=0.035): return [xc - w, xc + w]
SPECIAL = [XT, XT + 0.05, XTT, XW1, XB1, PX0, PX1, X_CAST, X_BOW, XTT + 0.04, XB1 - 0.03] + [v for h in (HATCH_SOLE, HATCH_BIG, HATCH_SMALL, HATCH_BOW) for v in h[:2]] + \
          [v for x in RODS for v in _cell(x, 0.04)] + [v for h in HOLES for v in _cell(h[1])]

def stations(fine=True):
    if fine:
        xs = [0.0, 0.15, 0.3, 0.45] + [XT + 0.05 * i for i in range(1, 98)] + [5.55, 5.6, 5.64, 5.68, 5.71, 5.74, 5.76, 5.78, 5.79, XF]
        sp = [x for x in SPECIAL]
    else:
        xs = [0.0, 0.3, 1.5, 2.0, 2.5, 3.0, 3.5, 4.6, 5.0, 5.6, 5.72, XF]; sp = [XT, XTT, XW1, XB1, X_CAST, X_BOW]
    xs = [x for x in xs if all(abs(x - s) > 0.012 for s in sp)] + sp
    return sorted(set(round(x, 5) for x in xs if 0.0 <= x <= XF))


C = {}
def colours():
    w = lambda n, rgb, g=0.4, z=0, metal=0.0, emit=0.0: C.__setitem__(n, mat(n, rgb, g, zone=z, metal=metal, emit=emit))
    w('bottom', (0.46, 0.48, 0.50), 0.25); w('boot', (0.10, 0.14, 0.24), 0.55, 2); w('hull', (0.92, 0.93, 0.92), 0.6, 1)
    w('rub', (0.08, 0.08, 0.09), 0.3); w('white', (0.91, 0.92, 0.91), 0.45); w('inner', (0.84, 0.85, 0.85), 0.3)
    w('tread', (0.66, 0.68, 0.70), 0.55, 0, 0.6); w('gutter', (0.30, 0.31, 0.32), 0.2); w('alu', (0.72, 0.74, 0.76), 0.6, 0, 0.7)
    w('steel', (0.78, 0.80, 0.82), 0.85, 0, 0.8); w('chrome', (0.86, 0.87, 0.89), 0.95, 0, 0.9); w('dark', (0.06, 0.06, 0.07), 0.2)
    w('frame', (0.07, 0.07, 0.08), 0.45); w('screen', (0.03, 0.05, 0.07), 0.9); w('cush', (0.13, 0.13, 0.14), 0.35); w('cush2', (0.30, 0.31, 0.33), 0.3)
    w('motor', (0.12, 0.12, 0.13), 0.65); w('motor2', (0.55, 0.57, 0.60), 0.5); w('leg', (0.14, 0.14, 0.15), 0.55); w('rubber', (0.04, 0.04, 0.05), 0.2)
    w('prop', (0.70, 0.72, 0.75), 0.8, 0, 0.8); w('anode', (0.55, 0.56, 0.55), 0.2); w('brass', (0.60, 0.48, 0.24), 0.6, 0, 0.7)
    w('nylon', (0.10, 0.10, 0.11), 0.35); w('switch', (0.20, 0.21, 0.22), 0.4)
    w('lred', (0.90, 0.10, 0.08), 0.8, 0, 0, 0.5); w('lgreen', (0.10, 0.80, 0.25), 0.8, 0, 0, 0.5); w('lwhite', (1.0, 0.97, 0.88), 0.8, 0, 0, 0.5)
    C['glass'] = mat('glass', (0.25, 0.32, 0.36), 0.95)

def side_mat(p, x=None):
    """the hull's paint at a point (or at height p, amidships unless x is given): the bottom, the boot stripe or the topsides"""
    if hasattr(p, 'z'): z, x = p.z, p.x
    else: z = p
    d = SLB * ((x if x is not None else 3.0) - 3.0)
    return C['bottom'] if z < Z_BOT + d - 1e-4 else C['boot'] if z < Z_BT + d - 1e-4 else C['hull']


# ---------- the wear: per corner, so it runs across faces (B16; 2008, painted aluminium) ----------
def n3(x, y, z=0.0): return noise.noise(V((x, y, z)))
def ss(a, b, x):
    t = max(0.0, min(1.0, (x - a) / (b - a))); return t * t * (3 - 2 * t)
def toward(m, rgb, k):
    base = m['rgb']; return [1 + (rgb[i] / max(base[i], 1e-3) - 1) * k for i in range(3)]

def wear(p, m, n):
    x, y, z = p; nm = m.name; side = 1 if y > 0 else -1
    if nm == 'hull':
        g = 0.97 + 0.04 * n3(x * 3.0, z * 6.0, side)                                                # the paint not quite even
        g *= 1 - 0.10 * ss(0.12, 0.0, z - Z_BT)                                                     # grime over the boot stripe
        g *= 1 - 0.07 * ss(0.3, 0.75, n3(x * 6.0, z * 2.0, side * 3.3)) * ss(0.30, 0.0, abs(z - 0.80))   # scuffs from quays and fenders
        g *= 1 - 0.12 * ss(0.08, 0.0, zs(min(max(x, 0.0), XF)) - z)                                # black marks under the rubbing strake
        if side < 0 and z < 0.735: g *= 1 - 0.22 * ss(0.016 + (0.735 - z) * 0.03, 0.004, abs(x - 1.30)) * ss(WL, WL + 0.15, z)   # the run under the bilge outlet
        c = toward(m, (0.75, 0.74, 0.70), 0.25 * ss(0.2, 0.7, n3(x * 1.2, z * 3.0, side * 7.1)))   # chalked a little in patches
        return [c[i] * g for i in range(3)]
    if nm == 'boot':
        v = 0.92 + 0.10 * n3(x * 4.0, z * 9.0, side) - 0.08 * ss(WL + 0.05, WL - 0.02, z)
        if side < 0 and abs(x - 1.30) < 0.03: v *= 1 - 0.15 * ss(0.02, 0.004, abs(x - 1.30))
        return [v, v, v]
    if nm == 'bottom':
        v = 0.88 + 0.14 * n3(x * 2.5, z * 6.0, y * 2.0)
        g = ss(WL - 0.05, WL + 0.01, z) * (0.5 + 0.5 * ss(-0.3, 0.4, n3(x * 3.0, side * 1.3, 4.1))) * (0.5 + 0.5 * ss(4.5, 1.0, x))   # slime at the waterline
        return [v * (1 - 0.12 * g), v * (1 + 0.01 * g), v * (1 - 0.15 * g)]
    if nm in ('tread', 'alu'):
        v = 0.92 + 0.10 * n3(x * 9.0, y * 9.0, z * 9.0)
        v *= 1 - 0.12 * ss(0.5, 0.0, math.hypot(x - 2.0, y)) - 0.08 * ss(0.35, 0.0, math.hypot(x - 2.9, y + 0.45))   # worn where people stand
        return [v, v, v * 1.01]
    if nm in ('inner', 'white'):
        v = 0.95 + 0.05 * n3(x * 5.0, y * 5.0, z * 5.0) - 0.10 * ss(0.15, 0.0, z - Z_SOLE) * (1 if nm == 'inner' else 0)
        if nm == 'white' and n.z > 0.7: v *= 1 - 0.06 * ss(0.3, 0.7, n3(x * 8.0, side, 2.0))       # the gunwale's top worn by lines and boots
        return [v, v, v]
    if nm in ('motor', 'leg'):
        v = 0.95 + 0.08 * n3(x * 6.0, y * 6.0, z * 6.0)
        if z < WL + 0.05: return toward(m, (0.25, 0.27, 0.22), 0.6 * ss(WL + 0.05, WL - 0.1, z)) # growth on the leg
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


# ---------- one surface: a mesh whose faces share their points ----------
class Mesh:
    def __init__(s, name):
        s.name = name; s.bm = bmesh.new(); s.d = {}; s.mats = []; s.ix = {}; s.paint = s.bm.faces.layers.int.new('paint')
    def mi(s, m):
        if m.name not in s.ix: s.ix[m.name] = len(s.mats); s.mats.append(m)
        return s.ix[m.name]
    def v(s, p):
        if isinstance(p, bmesh.types.BMVert): return p
        k = (round(p[0], 5), round(p[1], 5), round(p[2], 5)); q = s.d.get(k)
        if q is None: q = s.bm.verts.new(V(p)); s.d[k] = q
        return q
    def f(s, pts, m, out=None, paint=False):
        vs = []
        for p in pts:
            q = s.v(p)
            if q not in vs: vs.append(q)
        if len(vs) < 3: return None
        try: fc = s.bm.faces.new(vs)
        except ValueError: return None
        fc.material_index = s.mi(m); fc[s.paint] = 1 if paint else 0
        if out is not None:
            fc.normal_update()
            if fc.normal.dot(V(out)) < 0: fc.normal_flip()
        return fc
    def strip(s, A, B, m, out, paint=False, skip=lambda i, j: False):
        """faces between rows of points: A[i][j] -> rows i, columns j"""
        for i in range(len(A) - 1):
            for j in range(len(A[i]) - 1):
                if not skip(i, j): s.f([A[i][j], A[i + 1][j], A[i + 1][j + 1], A[i][j + 1]], m, out(i, j) if callable(out) else out, paint)
    def quad_hole(s, pts, r, m, out, seg=16, paint=False):
        """a quad (four corners) with a round hole in its middle: a ring of points round the centre in the quad's plane, joined to the
        corners in a fan; returns the centre, the normal and the ring's points"""
        cs = [s.v(p) for p in pts]; P = [v.co.copy() for v in cs]; c = sum(P, V()) / 4
        n = (P[2] - P[0]).cross(P[3] - P[1]); n.normalize()
        if n.dot(V(out)) < 0: n = -n
        e1 = P[1] - P[0]; e1 -= n * e1.dot(n); e1.normalize(); e2 = n.cross(e1)
        ring = [c + (e1 * math.cos(2 * math.pi * k / seg) + e2 * math.sin(2 * math.pi * k / seg)) * r for k in range(seg)]
        rv = [s.bm.verts.new(p) for p in ring]
        ang = [math.atan2((p - c).dot(e2), (p - c).dot(e1)) for p in P]; order = sorted(range(4), key=lambda i: ang[i])
        rank = {order[i]: i for i in range(4)}
        near = [rank[max(range(4), key=lambda i: (P[i] - c).normalized().dot((q - c).normalized()))] for q in ring]
        for k in range(seg):
            k1 = (k + 1) % seg; s.f([rv[k], rv[k1], cs[order[near[k]]]], m, n, paint)
            r0 = near[k]
            while r0 != near[k1]:
                r1 = (r0 + 1) % 4; s.f([cs[order[r0]], cs[order[r1]], rv[k1]], m, n, paint); r0 = r1
        return c, n, ring
    def done(s, angle=30):
        bmesh.ops.remove_doubles(s.bm, verts=s.bm.verts[:], dist=1e-5)
        bmesh.ops.dissolve_degenerate(s.bm, edges=s.bm.edges[:], dist=1e-6)
        return shade(obj_from_bm(s.name, s.bm, s.mats), angle)


HOLE_AT = {}
def hull_shell(M, fine=True):
    """the outside (both sides, one surface over the keel), the pods, the transom with its notch, the transom top, the gunwale tops,
    the bow deck, the liner with the side pockets, the bench, the splash well, the sole, the casting deck and its face"""
    xs = stations(fine); S = {x: section(x, fine) for x in xs}; IC4, ICH, ICF, IZP = idx(fine)
    H = C['hull']
    def nrm(sec, j, sg):
        dy = sec[j + 1][0] - sec[j][0]; dz = sec[j + 1][1] - sec[j][1]
        return (0, sg * dz, -dy) if abs(dy) + abs(dz) > 1e-7 else (0, sg, 0)
    # the outside
    for sg in (1, -1):
        for a, b in zip(xs, xs[1:]):
            Sa, Sb = S[a], S[b]
            for j in range(len(Sa) - 1):
                if b <= XT + 1e-6 and (j < IC4 or j >= IZP): continue
                q = [(a, sg * Sa[j][0], Sa[j][1]), (b, sg * Sb[j][0], Sb[j][1]), (b, sg * Sb[j + 1][0], Sb[j + 1][1]), (a, sg * Sa[j + 1][0], Sa[j + 1][1])]
                out = nrm(Sa, j, sg); hit = None
                if fine and j >= ICF:
                    for h in HOLES:
                        if h[0] == sg and abs(a - (h[1] - 0.035)) < 1e-4 and abs(b - (h[1] + 0.035)) < 1e-4 and (Sa[j][1] + Sb[j][1]) / 2 <= h[2] < (Sa[j + 1][1] + Sb[j + 1][1]) / 2: hit = h
                if hit: HOLE_AT[hit[4]] = M.quad_hole(q, hit[3], H, out, 12, True)
                else: M.f(q, H, out, True)
    # the pods: inner side, top (tread plate), aft end
    pods = [x for x in xs if x <= XT + 1e-6]
    for sg in (1, -1):
        for a, b in zip(pods, pods[1:]):
            M.f([(a, sg * YP, S[a][IC4][1]), (b, sg * YP, S[b][IC4][1]), (b, sg * YP, ZP), (a, sg * YP, ZP)], H, (0, -sg, 0), True)
        PT = [0.0, 0.33, 0.66, 1.0]
        top = [[(x, sg * (YP + (S[x][IZP][0] - YP) * f), ZP) for f in PT] for x in pods]
        M.strip(top, None, C['tread'], (0, 0, 1))
        end = [(0.0, sg * YP, S[0.0][IC4][1])] + [(0.0, sg * S[0.0][j][0], S[0.0][j][1]) for j in range(IC4 + 1, IZP + 1)] + [top[0][k] for k in (2, 1, 0)]
        M.f(end, H, (-1, 0, 0), True)
    # the transom: one plate round the notch (its points those of the hull, the pods, the transom top and the well it meets)
    St = S[XT]; Hs = hbs(XT); zt = zs(XT)
    TT = lambda x: [YP, (YP + YIT) / 2, YIT, YIT + 0.055, YIT + 0.135, hbs(x)]
    P = [(-St[j][0], St[j][1]) for j in range(IC4, 0, -1)] + [(St[j][0], St[j][1]) for j in range(0, IC4 + 1)]
    P += [(YP, ZP)] + [(YP + (St[IZP][0] - YP) * f, ZP) for f in (0.33, 0.66)] + [(St[j][0], St[j][1]) for j in range(IZP, len(St))]
    P += [(y, zt) for y in reversed(TT(XT)[:-1])] + [(YP, ZN), (0.0, ZN), (-YP, ZN)] + [(-y, zt) for y in TT(XT)[:-1]]
    P += [(-St[j][0], St[j][1]) for j in range(len(St) - 1, IZP - 1, -1)] + [(-(YP + (St[IZP][0] - YP) * f), ZP) for f in (0.66, 0.33)] + [(-YP, ZP)]
    M.f([(XT, y, z) for y, z in P], H, (-1, 0, 0), True)
    # the transom top each side of the notch, into the gunwale tops
    tts = [x for x in xs if XT - 1e-6 <= x <= XTT + 1e-6]
    for sg in (1, -1):
        M.strip([[(x, sg * y, zs(x)) for y in TT(x)] for x in tts], None, C['white'], (0, 0, 1))
        # its inner face down to the bench
        M.f([(XTT, sg * YP, Z_BENCH), (XTT, sg * YIT, Z_BENCH), (XTT, sg * YIT, zs(XTT)), (XTT, sg * (YP + YIT) / 2, zs(XTT)), (XTT, sg * YP, zs(XTT))], C['inner'], (1, 0, 0))
    # the gunwale tops (with the rod holders' holes) and the bow deck
    gws = [x for x in xs if XTT - 1e-6 <= x <= X_BOW + 1e-6]
    GC = lambda x: [yi(x), yi(x) + 0.055, yi(x) + 0.135, hbs(x)]
    for sg in (1, -1):
        for a, b in zip(gws, gws[1:]):
            ga, gb = GC(a), GC(b)
            for j in range(3):
                q = [(a, sg * ga[j], zs(a)), (b, sg * gb[j], zs(b)), (b, sg * gb[j + 1], zs(b)), (a, sg * ga[j + 1], zs(a))]
                rod = [x for x in RODS if abs(a - (x - 0.04)) < 1e-4 and abs(b - (x + 0.04)) < 1e-4]
                if fine and rod and j == 1: HOLE_AT[('rod', rod[0], sg)] = M.quad_hole(q, 0.026, C['white'], (0, 0, 1), 14)
                else: M.f(q, C['white'], (0, 0, 1))
    bows = [x for x in xs if x >= X_BOW - 1e-6]; Hb = hbs(X_BOW); yb = yi(X_BOW)
    BC0 = [0.0, HATCH_BOW[3], yb, yb + 0.055, yb + 0.135, Hb]
    def BC(x):
        r = hbs(x) / Hb; out = []
        for k, c in enumerate(BC0): out.append(min(max(out[-1] if out else 0.0, c if k < 2 else c * r), hbs(x)))
        return out
    rows = [[(x, -y, zs(x)) for y in reversed(BC(x)[1:])] + [(x, y, zs(x)) for y in BC(x)] for x in bows]
    hb = HATCH_BOW
    M.strip(rows, None, C['white'], (0, 0, 1), skip=lambda i, j: fine and hb[0] <= (bows[i] + bows[i + 1]) / 2 <= hb[1] and abs((rows[i][j][1] + rows[i][j + 1][1]) / 2) < hb[3])
    if fine: gutter(M, [x for x in bows if hb[0] - 1e-6 <= x <= hb[1] + 1e-6], hb[2], hb[3], zs, [-hb[3], 0.0, hb[3]])
    # the liner: from the floor (the bench, the sole, the casting deck) up to the gunwale's inner edge, with the side pockets
    def liner(x0, x1, floor):
        lx = [x for x in xs if x0 - 1e-6 <= x <= x1 + 1e-6]
        for sg in (1, -1):
            R = [[(x, sg * yi(x), max(floor, z)) for z in (floor, PZ0, PZ1, Z_CAST, Z_BENCH)] + [(x, sg * yi(x), zs(x))] for x in lx]
            pk = lambda i, j: fine and floor < PZ0 and j == 1 and PX0 - 1e-6 <= (lx[i] + lx[i + 1]) / 2 <= PX1 + 1e-6
            M.strip(R, None, C['inner'], (0, -sg, 0), skip=pk)
            if fine and floor < PZ0:
                px = [x for x in lx if PX0 - 1e-6 <= x <= PX1 + 1e-6]; yb_ = lambda x: y_at(x, PZ0) - 0.012
                M.strip([[(x, sg * yi(x), PZ0), (x, sg * yb_(x), PZ0)] for x in px], None, C['inner'], (0, 0, 1))
                M.strip([[(x, sg * yi(x), PZ1), (x, sg * yb_(x), PZ1)] for x in px], None, C['inner'], (0, 0, -1))
                M.strip([[(x, sg * yb_(x), PZ0), (x, sg * yb_(x), PZ1)] for x in px], None, C['inner'], (0, -sg, 0))
                for x, d in ((px[0], 1), (px[-1], -1)):
                    M.f([(x, sg * yi(x), PZ0), (x, sg * yb_(x), PZ0), (x, sg * yb_(x), PZ1), (x, sg * yi(x), PZ1)], C['inner'], (d, 0, 0))
    liner(XTT, XB1, Z_BENCH); liner(XB1, X_CAST, Z_SOLE); liner(X_CAST, X_BOW, Z_CAST)
    # the bow deck's aft face down to the casting deck, and the casting deck's face down to the sole
    for x, z0, z1, d in ((X_BOW, Z_CAST, zs(X_BOW), -1), (X_CAST, Z_SOLE, Z_CAST, -1)):
        y = yi(x); ys = [-y, -HATCH_BOW[3], 0.0, HATCH_BOW[3], y] if x == X_BOW else sorted(set([-y, -0.58, -0.32, -0.28, 0.0, 0.28, 0.32, 0.58, y]))
        zz = [z0, Z_BENCH, z1] if x == X_BOW else [z0, PZ0, PZ1, z1]
        M.strip([[(x, yy, z) for z in zz] for yy in ys], None, C['inner'], (d, 0, 0))
    # the bench: its top round the well and the lids, its face; the splash well under the notch
    bx = [x for x in xs if XTT - 1e-6 <= x <= XB1 + 1e-6]
    lp = LID_P; BCOL = lambda x: [-yi(x), -lp[3], -lp[2], -YP, 0.0, YP, lp[2], lp[3], yi(x)]
    rows = [[(x, y, Z_BENCH) for y in BCOL(x)] for x in bx]
    def bskip(i, j):
        xm = (bx[i] + bx[i + 1]) / 2; ym = (rows[i][j][1] + rows[i][j + 1][1]) / 2
        return (xm < XW1 and abs(ym) < YP) or (fine and lp[0] < xm < lp[1] and lp[2] < abs(ym) < lp[3])
    M.strip(rows, None, C['white'], (0, 0, 1), skip=bskip)
    if fine:
        for sg in (1, -1):
            lx = [x for x in bx if lp[0] - 1e-6 <= x <= lp[1] + 1e-6]
            gutter(M, lx, lp[2] if sg > 0 else -lp[3], lp[3] if sg > 0 else -lp[2], lambda x: Z_BENCH, [lp[2], lp[3]] if sg > 0 else [-lp[3], -lp[2]], rect=True)
    M.strip([[(XB1, yy, z) for z in (Z_SOLE, PZ0, PZ1, Z_CAST, Z_BENCH)] for yy in sorted(set(BCOL(XB1) + [-0.32, 0.32]))], None, C['white'], (1, 0, 0))
    wx = [x for x in xs if XT - 1e-6 <= x <= XW1 + 1e-6]
    for sg in (1, -1):
        top = [(x, sg * YP, zs(x)) for x in wx if x <= XTT + 1e-6]
        bench = [(x, sg * YP, Z_BENCH) for x in wx if XTT - 1e-6 <= x]
        poly = [(XT, sg * YP, ZN), (XT + 0.05, sg * YP, ZN), (XT + 0.05, sg * YP, ZWF), (XW1, sg * YP, ZWF)] + list(reversed(bench)) + list(reversed(top))
        M.f(poly, C['inner'], (0, -sg, 0))
    M.strip([[(XT, y, ZN) for y in (-YP, 0.0, YP)], [(XT + 0.05, y, ZN) for y in (-YP, 0.0, YP)]], None, C['white'], (0, 0, 1))
    M.strip([[(XT + 0.05, y, z) for z in (ZWF, ZN)] for y in (-YP, 0.0, YP)], None, C['inner'], (1, 0, 0))
    fl = [XT + 0.05] + [x for x in wx if x > XT + 0.06]
    M.strip([[(x, y, ZWF) for y in (-YP, 0.0, YP)] for x in fl], None, C['tread'], (0, 0, 1))
    M.strip([[(XW1, y, z) for z in (ZWF, Z_BENCH)] for y in (-YP, 0.0, YP)], None, C['inner'], (-1, 0, 0))
    # the sole and the casting deck, tread plate, with their hatches
    def deck(x0, x1, z, hatches):
        dx = [x for x in xs if x0 - 1e-6 <= x <= x1 + 1e-6]
        cs = sorted(set([-9.0, 9.0, 0.0] + [v for h in hatches for v in h[2:]]))
        cols = lambda x: [min(max(c, -yi(x)), yi(x)) for c in cs]          # the hatches' columns, pressed in to the liner where she narrows
        for a, b in zip(dx, dx[1:]):
            ca, cb = cols(a), cols(b)
            for j in range(len(ca) - 1):
                xm = (a + b) / 2; ym = (ca[j] + ca[j + 1]) / 2
                if fine and any(h[0] < xm < h[1] and h[2] < ym < h[3] for h in hatches): continue
                M.f([(a, ca[j], z), (b, cb[j], z), (b, cb[j + 1], z), (a, ca[j + 1], z)], C['tread'], (0, 0, 1))
        if fine:
            for h in hatches: gutter(M, [x for x in dx if h[0] - 1e-6 <= x <= h[1] + 1e-6], h[2], h[3], lambda x: z, [c for c in cols(h[0]) if h[2] - 1e-6 <= c <= h[3] + 1e-6], rect=True)
    deck(XB1, X_CAST, Z_SOLE, [HATCH_SOLE]); deck(X_CAST, X_BOW, Z_CAST, [HATCH_BIG, HATCH_SMALL])


LIDS = []
def gutter(M, gx, y0, y1, zf, ycols, rect=False, depth=0.03, w=0.016):
    """the frame of a hatch in a deck: the walls down from the hole's edge (its points the deck's), the gutter's floor round the
    lid; the lid itself (hatch_lid) sits in it 4 mm under the deck"""
    x0, x1 = gx[0], gx[-1]; ycols = ycols or [y0, (y0 + y1) / 2, y1]
    z = lambda x: zf(x)
    rim = [(x, y0) for x in gx] + [(x1, y) for y in ycols[1:]] + [(x, y1) for x in reversed(gx[:-1])] + [(x0, y) for y in reversed(ycols[1:-1])]
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    for (xa, ya), (xb, yb) in zip(rim, rim[1:] + rim[:1]):
        out = V((cx - (xa + xb) / 2, cy - (ya + yb) / 2, 0))
        M.f([(xa, ya, z(xa)), (xb, yb, z(xb)), (xb, yb, z(xb) - depth), (xa, ya, z(xa) - depth)], C['gutter'], out)
        ia = (xa + (w if xa < cx else -w), ya + (w if ya < cy else -w)); ib = (xb + (w if xb < cx else -w), yb + (w if yb < cy else -w))
        ia = (min(max(ia[0], x0 + w), x1 - w), min(max(ia[1], y0 + w), y1 - w)); ib = (min(max(ib[0], x0 + w), x1 - w), min(max(ib[1], y0 + w), y1 - w))
        M.f([(xa, ya, z(xa) - depth), (xb, yb, z(xb) - depth), (ib[0], ib[1], z(xb) - depth), (ia[0], ia[1], z(xa) - depth)], C['gutter'], (0, 0, 1))
    LIDS.append((x0 + 0.006, x1 - 0.006, y0 + 0.006, y1 - 0.006, z(cx) - 0.004))


# ---------- on the hull: the keel and stem bar, the welds, the strakes, the rubbing strake ----------
def sweep(A, path, outs, prof, mf, cap=True):
    """a profile [(a, b)] swept along path, a along outs[i] (made square to the path) and b across; mf(z) the material per segment"""
    n = len(path); rings = []
    for i, p in enumerate(path):
        T = (path[min(i + 1, n - 1)] - path[max(i - 1, 0)]).normalized(); o = outs[i] - T * outs[i].dot(T); o.normalize(); u = T.cross(o)
        rings.append((p, [A.v(p + o * a + u * b) for a, b in prof]))
    k = len(prof)
    for i in range(n - 1):
        (p, ra), (q, rb) = rings[i], rings[i + 1]; m = mf((p + q) / 2)
        for j in range(k):
            jj = (j + 1) % k; A.f([ra[j], rb[j], rb[jj], ra[jj]], m, (ra[j].co + rb[jj].co) / 2 - (p + q) / 2)
    if cap:
        A.f(list(rings[0][1]), mf(path[0]), path[0] - path[1]); A.f(list(rings[-1][1]), mf(path[-1]), path[-1] - path[-2])

def half_round(w, h, emb, n=6):
    return [(-emb, -w / 2)] + [(h * math.sin(math.pi * k / n), -w / 2 * math.cos(math.pi * k / n)) for k in range(n + 1)] + [(-emb, w / 2)]

def weld(A, pts, r=0.004, seg=6):
    pts = [V(p) for p in pts]
    for a, b in zip(pts, pts[1:]):
        if (b - a).length > 1e-4: m = side_mat((a + b) / 2); acyl(A, a, b, r, lambda z, m=m: m, seg=seg, cap=False)

def on_hull(A, fine=True):
    xs = stations(fine); IC4, ICH, ICF, IZP = idx(fine)
    # the keel bar along the keel and up the stem
    kx = [x for x in xs if x >= XT]
    path = [V((x, 0, zk(x))) for x in kx]
    outs = []
    for i, x in enumerate(kx):
        a = path[max(0, i - 1)]; b = path[min(len(kx) - 1, i + 1)]; t = (b - a).normalized(); outs.append(V((t.z, 0, -t.x)) if t.x > 0 else V((0, 0, -1)))
    sweep(A, path, outs, half_round(0.03 if fine else 0.04, 0.022, 0.004, 6 if fine else 2), side_mat)
    if not fine: return
    # the welds: the chine's two corners, the transom's edge, the pods' corners
    for sg in (1, -1):
        cx = [x for x in xs if hbc(x) > 0.01]
        weld(A, [(x, sg * section(x)[ICH][0], section(x)[ICH][1]) for x in cx])
        weld(A, [(x, sg * section(x)[ICF][0], section(x)[ICF][1]) for x in cx])
        St = section(XT); weld(A, [(XT, sg * St[j][0], St[j][1]) for j in range(IZP, len(St))])
        weld(A, [(XT, sg * YP, St[IC4][1]), (XT, sg * YP, ZP)])
        S0 = section(0.0); weld(A, [(0.0, sg * YP, S0[IC4][1])] + [(0.0, sg * S0[j][0], S0[j][1]) for j in range(IC4 + 1, IZP + 1)])
        pods = [x for x in xs if x <= XT]
        weld(A, [(x, sg * section(x)[IZP][0], ZP) for x in pods]); weld(A, [(x, sg * YP, ZP) for x in pods])
        weld(A, [(x, sg * YP, section(x)[IC4][1]) for x in pods])
        weld(A, [(0.0, sg * YP, ZP), (0.0, sg * YP, S0[IC4][1])])
    St = section(XT); weld(A, [(XT, -St[j][0], St[j][1]) for j in range(IC4, 0, -1)] + [(XT, St[j][0], St[j][1]) for j in range(IC4 + 1)])
    # a lifting strake a side on the bottom: an angle welded on, its ledge flat and its face upright, tapering out forward
    for sg in (1, -1):
        sx = [x for x in xs if 0.02 <= x <= 4.30]; L_ = []; R_ = []
        for x in sx:
            h = hbc(x); a = min(y4(x), h); ys_ = a + (h - a) * 0.38; w = 0.045 * ss(4.30, 3.70, x) * ss(0.02, 0.15, x) + 1e-4
            z0 = bot_z(x, ys_); z1 = bot_z(x, ys_ + w)
            L_.append([(x, sg * (ys_ - 0.002), z0 - 0.002), (x, sg * (ys_ + w), z0), (x, sg * (ys_ + w), z1 - 0.002)])
        for a, b in zip(L_, L_[1:]):
            m = side_mat(V(a[1]) * 0.5 + V(b[1]) * 0.5); A.poly([a[0], b[0], b[1], a[1]], m, (0, 0, -1)); A.poly([a[1], b[1], b[2], a[2]], m, (0, sg, 0))
    # the rubbing strake: a black D-profile round the sheer from the notch, round the transom's corners and the stem
    xs2 = [x for x in xs if XT + 0.03 <= x <= XF - 0.02]
    def side(sg): return [V((x, sg * hbs(x), zs(x) - 0.022)) for x in xs2]
    def corner(sg):
        c = V((XT + 0.03, sg * (hbs(XT) - 0.03), zs(XT) - 0.022)); return [c + V((-0.03 * math.cos(a), sg * 0.03 * math.sin(a), 0)) for a in [math.pi / 2 * k / 4 for k in range(5)]]
    aft = lambda sg: [V((XT, sg * (YP + 0.02), zs(XT) - 0.022)), V((XT, sg * (YP + 0.3), zs(XT) - 0.022))]
    path = aft(-1) + list(reversed(corner(-1)))[:0] + corner(-1) + side(-1) + [V((XF + 0.004, 0, zs(XF) - 0.022))] + list(reversed(side(1))) + list(reversed(corner(1))) + list(reversed(aft(1)))
    path = [p for i, p in enumerate(path) if i == 0 or (p - path[i - 1]).length > 1e-4]
    outs = []
    for i, p in enumerate(path):
        a = path[max(0, i - 1)]; b = path[min(len(path) - 1, i + 1)]; t = (b - a).normalized(); o = V((t.y, -t.x, 0))
        if o.dot(V((p.x - 3.0, p.y, 0))) < 0 and abs(p.x - XT) > 0.002: o = -o
        if abs(p.x - XT) < 0.002: o = V((-1, 0, 0))
        outs.append(o.normalized())
    sweep(A, path, outs, half_round(0.045, 0.028, 0.004, 6), lambda z: C['rub'])


# ---------- the fittings on and in the hull ----------
def fittings(A, fine=True):
    if not fine: return
    # the rod holders in their holes, the bilge pump's outlet and the vent
    for k, (c, n, ring) in HOLE_AT.items():
        if isinstance(k, tuple):
            d = (-n + V((-0.25, 0, 0))).normalized(); F.hole_lining(A, ring, d, 0.22, C['dark'], C['dark'])
            F.atorus(A, c + n * 0.003, n, 0.031, 0.006, lambda a: C['steel'], seg=16, rseg=5)
        else:
            F.hole_lining(A, ring, -n, 0.05, C['dark'], C['dark'])
            F.atorus(A, c + n * 0.002, n, ring[0].__sub__(c).length + 0.007, 0.005, lambda a: C['steel'], seg=14, rseg=5)
            if k == 'vent':       # the vent's hood over the hole, open downward
                A.poly([c + n * 0.004 + V((-0.02, 0, 0.018)), c + n * 0.004 + V((0.02, 0, 0.018)), c + n * 0.022 + V((0.02, 0, -0.004)), c + n * 0.022 + V((-0.02, 0, -0.004))], C['steel'], n + V((0, 0, 1)))
    # the hatch lids in their gutters
    for x0, x1, y0, y1, z in LIDS:
        hinge = '-x' if abs(z - (Z_BENCH - 0.004)) < 1e-3 else '+x'
        F.hatch_lid(A, x0, x1, y0, y1, z, C['tread'] if z < 1.0 else C['white'], C['steel'], hinge)
        if z < 1.0: F.tread_plate(A, x0 + 0.01, x1 - 0.01, y0 + 0.01, y1 - 0.01, z, C['tread'], pitch=0.05)
    # tread plate on the sole, the casting deck, the pods and the well's floor
    inh = lambda hs: (lambda x, y: all(not (h[0] - 0.02 < x < h[1] + 0.02 and h[2] - 0.02 < y < h[3] + 0.02) for h in hs))
    con = lambda x, y: not (CX0 - 0.03 < x < CX1 + 0.03 and abs(y) < CW + 0.03) and math.hypot(x - 1.35, y) > 0.20 and math.hypot(x - 2.75, y) > 0.10
    F.tread_plate(A, XB1 + 0.01, X_CAST - 0.01, -1.10, 1.10, Z_SOLE, C['tread'], lambda x, y: abs(y) < yi(x) - 0.02 and inh([HATCH_SOLE])(x, y) and con(x, y))
    F.tread_plate(A, X_CAST + 0.01, X_BOW - 0.01, -1.0, 1.0, Z_CAST, C['tread'], lambda x, y: abs(y) < yi(x) - 0.02 and inh([HATCH_BIG, HATCH_SMALL])(x, y))
    for sg in (1, -1):
        F.tread_plate(A, 0.02, XT - 0.02, (YP + 0.02) if sg > 0 else -1.15, -(YP + 0.02) if sg < 0 else 1.15, ZP, C['tread'], lambda x, y: abs(y) < y_at(x, ZP) - 0.03)
    # the deck plate over the tank's sender, the bung, the anodes and the eyes on the transom, the hull's plate
    F.atorus(A, (2.75, 0, Z_SOLE + 0.004), (0, 0, 1), 0.075, 0.006, lambda a: C['alu'], seg=20, rseg=5)
    acyl(A, (2.75, 0, Z_SOLE - 0.002), (2.75, 0, Z_SOLE + 0.006), 0.07, lambda z: C['alu'], seg=20)
    for k in range(2): obox(A, (2.75, 0, Z_SOLE + 0.008), V((0.035, 0, 0)) if k else V((0, 0.035, 0)), V((0, 0.005, 0)) if k else V((0.005, 0, 0)), (0, 0, 0.003), C['alu'])
    acyl(A, (XT + 0.003, 0.12, 0.075), (XT - 0.015, 0.12, 0.075), 0.017, lambda z: C['brass'], seg=12)
    acyl(A, (XT - 0.015, 0.12, 0.075), (XT - 0.028, 0.12, 0.075), 0.022, lambda z: C['brass'], seg=6)
    for y in (-0.20, 0.20): F.anode(A, (XT + 0.002, y, 0.17), (-1, 0, 0), (0, 1, 0), C['anode'], L=0.15, w=0.05, t=0.02, m_strap=C['steel'])
    for y in (-0.80, 0.80):
        c = V((XT, y, 0.92)); pts = [c + V((0.01, -0.035, 0))] + [c + V((-0.04 - 0.035 * math.sin(math.pi * k / 6), -0.035 * math.cos(math.pi * k / 6), 0)) for k in range(7)] + [c + V((0.01, 0.035, 0))]
        F.pipe(A, pts, 0.006, C['steel'], 6)
        obox(A, c + V((-0.002, 0, 0)), (0.004, 0, 0), (0, 0.06, 0), (0, 0, 0.025), C['steel'])
    obox(A, (XT - 0.0015, -0.55, 0.98), (0.0035, 0, 0), (0, 0.07, 0), (0, 0, 0.025), C['steel'])
    # the bow eye on the stem, for the trailer's winch
    xe = 5.47; ze = zk(xe); d = V((0.04, 0, zk(xe + 0.02) - zk(xe - 0.02))).normalized(); t = V((d.z, 0, -d.x))     # out from the stem
    F.atorus(A, V((xe, 0, ze)) + t * 0.03, (0, 1, 0), 0.03, 0.007, lambda a: C['steel'], seg=12, rseg=6, a0=0, a1=2 * math.pi)
    # the cleats: aft and forward on the gunwales
    for x in (0.95, 4.45):
        for sg in (1, -1): F.cleat(A, (x, sg * (hbs(x) - 0.075), zs(x)), (0, 0, 1), (1, 0, 0), 0.20, C['steel'])
    # the fuel filler on the starboard gunwale aft, its cap and chain
    fx = 0.95; fy = -(hbs(fx) - 0.10)
    F.atorus(A, (fx, fy, zs(fx) + 0.004), (0, 0, 1), 0.034, 0.006, lambda a: C['steel'], seg=18, rseg=5)
    acyl(A, (fx, fy, zs(fx) - 0.002), (fx, fy, zs(fx) + 0.012), 0.03, lambda z: C['steel'], seg=18)
    obox(A, (fx, fy, zs(fx) + 0.016), (0.022, 0, 0), (0, 0.005, 0), (0, 0, 0.005), C['steel'])
    # the bow roller at the stem (the anchor is the game's own, stowed in it: bower())
    zt = zs(5.7) + 0.02
    F.bow_roller(A, (5.52, 0, zs(5.52)), (5.95, 0, zt), C['steel'], C['nylon'], R=0.035, W=0.12, deck=zs, x_end=XF - 0.01)
    # the boarding ladder on the port pod, folded up
    for y in (0.62, 0.86):
        F.pipe(A, [(0.24, y, ZP - 0.003), (0.24, y, ZP + 0.02), (0.06, y, ZP + 0.04), (-0.02, y, ZP - 0.02), (-0.02, y, 0.06)], 0.011, C['steel'], 8)
        obox(A, (0.24, y, ZP + 0.006), (0.03, 0, 0), (0, 0.02, 0), (0, 0, 0.008), C['steel'])
    for z in (0.14, 0.30, 0.46): acyl(A, (-0.02, 0.62, z), (-0.02, 0.86, z), 0.014, lambda q: C['steel'], seg=8)
    # the cushions on the bench's lids and in front of the well (no bottom: they lie 2 mm over the lids)
    for y0, y1 in ((LID_P[2] + 0.01, LID_P[3] - 0.02), (-(LID_P[3] - 0.02), -(LID_P[2] + 0.01)), (-0.30, 0.30)):
        x0, x1 = (0.86, 1.06) if abs(y0) > 0.31 else (XW1 + 0.01, 1.06)
        cushion(A, x0, x1, y0, y1, Z_BENCH + 0.002, 0.06)

GUT = (2.30, 2.90)                                   # the gutting board across the port gunwale by the console (x from, to)
def gut_top(): return zs(sum(GUT) / 2) + 0.07
def gutting_board(A):
    """the boat's own gutting board across the port gunwale abreast the console (Jonas 31.10.2026: the game's table stood behind the
    skipper, «Det går jo ikke»): a white polyethylene board from over the cockpit out a little past the rubbing strake, so the offal goes over
    the side, with a low lip round its three inboard sides and a slot to the outboard edge; on two brackets clamped to the gunwale;
    the one who guts stands on the sole between it and the console"""
    x0, x1 = GUT; zt = gut_top(); yin = yi(x0) - 0.26; yout = hbs(x0) + 0.09; t = 0.025     # 6 cm past the rubbing strake: vessel3d's beam (±5 %)
    obox(A, ((x0 + x1) / 2, (yin + yout) / 2, zt - t / 2), ((x1 - x0) / 2, 0, 0), (0, (yout - yin) / 2, 0), (0, 0, t / 2), C['white'])
    for (a, b) in (((x0, yin), (x1, yin)), ((x0, yin), (x0, yout - 0.05)), ((x1, yin), (x1, yout - 0.05))):
        c = V(((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, zt + 0.012)); d = V((b[0] - a[0], b[1] - a[1], 0))
        obox(A, c, d * 0.5 + d.normalized() * 0.006, d.normalized().cross(V((0, 0, 1))) * 0.006, (0, 0, 0.0125), C['white'])
    A.poly([(x0 + 0.24, yout - 0.18, zt + 0.0005), (x1 - 0.24, yout - 0.18, zt + 0.0005), (x1 - 0.24, yout, zt + 0.0005), (x0 + 0.24, yout, zt + 0.0005)], C['gutter'], (0, 0, 1))
    for x in (x0 + 0.08, x1 - 0.08):                                  # the brackets: over the gunwale and down its inside and outside
        zg = zs(x); yo = hbs(x) + 0.03; yi_ = yi(x) - 0.004
        obox(A, (x, (yi_ + yo) / 2, zg + 0.012), (0.025, 0, 0), (0, (yo - yi_) / 2, 0), (0, 0, 0.012), C['alu'])
        obox(A, (x, yo + 0.004, zg - 0.022), (0.025, 0, 0), (0, 0.004, 0), (0, 0, 0.034), C['alu'])     # down over the rubbing strake
        obox(A, (x, yi_ - 0.004, zg - 0.05), (0.025, 0, 0), (0, 0.004, 0), (0, 0, 0.06), C['alu'])
        acyl(A, (x, yi_ - 0.008, zg - 0.08), (x, yi_ - 0.04, zg - 0.08), 0.008, lambda z: C['steel'], seg=8)
        obox(A, (x, (yin + yout) / 2, zg + 0.024 + (zt - t - zg - 0.024) / 2), (0.02, 0, 0), (0, 0.02, 0), (0, 0, (zt - t - zg - 0.024) / 2 + 0.002), C['alu'])

def cushion(A, x0, x1, y0, y1, z, h, r=0.02):
    """a vinyl cushion, rounded at its top edges, its piping darker"""
    ring = lambda inset, zz: [(x0 + inset, y0 + inset, zz), (x1 - inset, y0 + inset, zz), (x1 - inset, y1 - inset, zz), (x0 + inset, y1 - inset, zz)]
    R = [ring(0, z), ring(0, z + h - r), ring(r * 0.3, z + h - r * 0.3), ring(r, z + h)]
    F.loft(A, R, lambda i: C['cush2'] if i == 1 else C['cush'], cap0=False, cap1=True)


# ---------- the console, the seat and the lights ----------
CX0 = 1.88; CX1 = 2.48; CW = 0.33; CTOP = 1.30
def x_aft(z): return CX0 + (z - Z_SOLE) / (CTOP - Z_SOLE) * 0.20       # the console's back slopes forward to the dash
SCR_X = 2.19                                                           # the screens' bottom edge on the binnacle
SCR = {'plot': (0.03, 0.25, 0.15), 'gauge': (-0.16, -0.01, 0.12), 'vhf': (-0.25, -0.18, 0.07)}   # the dash's screens (the game's live ones): y from, y to, height

def console(fine=True):
    objs = []; glass = []; A = Acc('console')
    def ring(z, d=0.0):
        xa = x_aft(z) - d; r = 0.12 + d; w = CW + d; x1 = CX1 + d; pts = [(xa, -w), (x1 - r, -w)]
        for k in range(1, 6): a = -math.pi / 2 + math.pi / 2 * k / 6; pts.append((x1 - r + r * math.cos(a), -w + r + r * math.sin(a)))
        pts += [(x1, -w + r), (x1, w - r)]
        for k in range(1, 6): a = math.pi / 2 * k / 6; pts.append((x1 - r + r * math.cos(a), w - r + r * math.sin(a)))
        pts += [(x1 - r, w), (xa, w)]
        return [(x, y, z) for x, y in pts]
    body = loft_rings('console', [ring(Z_SOLE), ring(CTOP)], C['white'], cap0=False, angle=30)
    if fine: bevel_mod(body, 0.015, 2)
    objs.append(body)
    if fine: F.loft(A, [ring(Z_SOLE + 0.001, 0.006), ring(Z_SOLE + 0.03, 0.006)], lambda i: C['rubber'], cap0=False, cap1=True)   # the kick strip
    if not fine:
        objs.append(box('screen_lo', 2.30, 2.34, -0.34, 0.34, CTOP, 1.60, C['dark'])); return objs, glass
    # the dash: a dark binnacle, the two screens' bezels (the game draws the live pictures on them), the compass
    objs.append(box('binnacle', x_aft(CTOP) + 0.02, 2.30, -0.28, 0.28, CTOP + 0.001, CTOP + 0.05, C['dark'], 0.01))
    for nm, (y0, y1, h) in SCR.items():
        objs.append(plate(nm, (SCR_X, 0, CTOP + 0.05), (0, 1, 0), (0.35, 0, 1), [(y0, 0.0), (y1, 0.0), (y1, h), (y0, h)], C['screen'], 0.004, 0.0, nrm=(-1, 0, 0.35)))
        objs.append(plate(nm + 'f', (SCR_X, 0, CTOP + 0.05), (0, 1, 0), (0.35, 0, 1), [(y0 - 0.02, -0.02), (y1 + 0.02, -0.02), (y1 + 0.02, h + 0.02), (y0 - 0.02, h + 0.02)], C['frame'], 0.001, 0.0, nrm=(-1, 0, 0.35)))
    acyl(A, (2.13, 0.0, CTOP + 0.045), (2.13, 0.0, CTOP + 0.075), 0.045, lambda z: C['dark'], seg=16)
    objs.append(sphere('compass', (2.13, 0.0, CTOP + 0.105), 0.042, C['screen'], (1, 1, 0.8)))
    # the door on the back under the wheel: a panel in its frame, the hinges and the latch
    za = 0.58; zb = 0.94; nz = V((-(CTOP - Z_SOLE), 0, 0.20)).normalized(); up = V((0.20, 0, CTOP - Z_SOLE)).normalized()
    c0 = V((x_aft((za + zb) / 2), 0, (za + zb) / 2)); hh = (zb - za) / 2 / up.z
    obox(A, c0 + nz * 0.004, V((0, 0.20, 0)), up * hh, nz * 0.004, C['white'])
    for sg in (1, -1):
        obox(A, c0 + nz * 0.007 + V((0, sg * 0.212, 0)), V((0, 0.012, 0)), up * (hh + 0.024), nz * 0.007, C['frame'])
        obox(A, c0 + nz * 0.007 + up * (sg * (hh + 0.012)), V((0, 0.224, 0)), up * 0.012, nz * 0.007, C['frame'])
        acyl(A, c0 + nz * 0.012 + V((0, 0.20, 0)) + up * (sg * 0.10) - up * 0.03, c0 + nz * 0.012 + V((0, 0.20, 0)) + up * (sg * 0.10) + up * 0.03, 0.006, lambda z: C['steel'], seg=8)
    obox(A, c0 + nz * 0.014 + V((0, -0.16, 0)), V((0, 0.012, 0)), up * 0.04, nz * 0.006, C['steel'])
    # the switch panel left of the wheel, the VHF's place (its picture is the game's, when one is bought), the key switch by the lever
    zp = 1.16; cp = V((x_aft(zp), 0.25, zp)) + nz * 0.003
    obox(A, cp, V((0, 0.05, 0)), up * 0.09, nz * 0.004, C['switch'])
    for k in range(5):
        p = cp + nz * 0.004 + up * (-0.07 + 0.035 * k)
        acyl(A, p + V((0, -0.02, 0)), p + V((0, -0.02, 0)) + nz * 0.022, 0.004, lambda z: C['steel'], seg=6)
        obox(A, p + V((0, 0.02, 0)) + nz * 0.002, V((0, 0.008, 0)), up * 0.005, nz * 0.002, C['lgreen'] if k < 3 else C['lred'])
    ck = V((2.26, -CW - 0.004, 0.86)); obox(A, ck, (0.045, 0, 0), (0, 0.004, 0), (0, 0, 0.035), C['switch'])
    acyl(A, ck + V((0, -0.004, 0.0)), ck + V((0, -0.022, 0.0)), 0.009, lambda z: C['steel'], seg=10)
    # the windscreen: curved acrylic round the console's front, standing in a black U-channel screwed to the console's top, rubber
    # trim on its top and back edges, an angle bracket bolted through it at each back corner, and the stainless rail over it on
    # side-mounted bases on the console's walls, with three clips holding the screen's top edge to it (Jonas 31.10.2026: «festet
    # på en realistisk måte»)
    zw0 = CTOP + 0.012; zw1 = 1.62
    def wring(z):
        t = (z - zw0) / (zw1 - zw0); xb = 2.45 - 0.15 * t; r = 0.10 * (1 - 0.3 * t); w = 0.305 - 0.02 * t; back = 2.32 - 0.15 * t; pts = [(back, -w)]
        for k in range(7): a = -math.pi / 2 + math.pi / 2 * k / 6; pts.append((xb - r + r * math.cos(a), -w + r + r * math.sin(a)))
        for k in range(7): a = math.pi / 2 * k / 6; pts.append((xb - r + r * math.cos(a), w - r + r * math.sin(a)))
        pts.append((back, w)); return [V((x, y, z)) for x, y in pts]
    lo = wring(zw0); hi = wring(zw1)
    bm = bmesh.new(); vl = [bm.verts.new(p) for p in lo]; vh = [bm.verts.new(p) for p in hi]
    for k in range(len(lo) - 1):
        f = bm.faces.new([vl[k], vl[k + 1], vh[k + 1], vh[k]]); f.normal_update()
        if f.normal.dot(lo[k] - V((2.2, 0, zw0))) < 0: f.normal_flip()
    glass.append(shade(obj_from_bm('windscreen', bm, [C['glass']]), 40))
    def pnorm(P):
        o = []
        for i, p in enumerate(P):
            t = (P[min(i + 1, len(P) - 1)] - P[max(i - 1, 0)]); n = V((t.y, -t.x, 0)).normalized()
            if n.dot(V((p.x - 2.25, p.y, 0))) < 0: n = -n
            o.append(n)
        return o
    base = [V((p.x, p.y, CTOP - 0.002)) for p in lo]
    sweep(A, base, pnorm(base), [(-0.016, 0.0), (0.016, 0.0), (0.016, 0.036), (0.004, 0.036), (0.004, 0.012), (-0.004, 0.012), (-0.004, 0.036), (-0.016, 0.036)], lambda z: C['frame'])
    for i in range(len(base) - 1):                                   # the channel's screws, outside the glass
        for f in ((0.5,) if i % 2 else ()):
            p = base[i] + (base[i + 1] - base[i]) * f; n = pnorm(base)[i]
            acyl(A, p + n * 0.017 + V((0, 0, 0.018)), p + n * 0.020 + V((0, 0, 0.018)), 0.004, lambda z: C['steel'], seg=6)
    sweep(A, hi, pnorm(hi), [(-0.007, -0.004), (0.007, -0.004), (0.007, 0.006), (-0.007, 0.006)], lambda z: C['rubber'])
    for sg, (pb, pt) in ((1, (lo[-1], hi[-1])), (-1, (lo[0], hi[0]))):
        d = (pt - pb).normalized(); e = V((1, 0, 0)).cross(d).normalized() if False else V((0, 1, 0))
        for k in range(6):
            a = pb + (pt - pb) * (k / 6); b = pb + (pt - pb) * ((k + 1) / 6); acyl(A, a, b, 0.008, lambda z: C['rubber'], seg=6, cap=False)
        # the angle bracket: a foot on the console's top and an upright against the screen's inside, two bolts through it
        bx = pb.x - 0.03
        obox(A, (bx + 0.02, pb.y - sg * 0.022, CTOP + 0.003), (0.035, 0, 0), (0, 0.016, 0), (0, 0, 0.004), C['alu'])
        obox(A, (bx + 0.02, pb.y - sg * 0.008, CTOP + 0.06), (0.035, 0, 0), (0, 0.003, 0), (0, 0, 0.06), C['alu'])
        for zz in (CTOP + 0.035, CTOP + 0.09):
            acyl(A, (bx + 0.02, pb.y + sg * 0.004, zz), (bx + 0.02, pb.y - sg * 0.013, zz), 0.0055, lambda z: C['steel'], seg=6)
    # the rail over the screen: up from the side bases on the console's walls, over the top edge, back down the other side
    rz = zw1 + 0.045
    for sg in (1, -1):
        c = V((2.36, sg * (CW + 0.004), CTOP - 0.07))
        obox(A, c + V((0, sg * 0.004, 0)), (0.04, 0, 0), (0, 0.004, 0), (0, 0, 0.04), C['steel'])
    top = [p + V((-0.035, 0, 0.045)) for p in hi[2:-2]]
    rail = [V((2.36, -(CW + 0.035), CTOP - 0.07)), V((2.36, -(CW + 0.035), CTOP + 0.06)), V((2.30, -0.335, rz - 0.06))] + [V((p.x, p.y, rz)) for p in top] + \
           [V((2.30, 0.335, rz - 0.06)), V((2.36, CW + 0.035, CTOP + 0.06)), V((2.36, CW + 0.035, CTOP - 0.07))]
    F.pipe(A, rail, 0.013, C['steel'], 8)
    for sg in (1, -1): acyl(A, (2.36, sg * (CW + 0.035), CTOP - 0.07), (2.36, sg * (CW + 0.006), CTOP - 0.07), 0.016, lambda z: C['steel'], seg=8)
    for k in (len(hi) // 2 - 4, len(hi) // 2, len(hi) // 2 + 3):    # the clips from the rail down over the screen's edge
        p = hi[k]; q = V((p.x - 0.035, p.y, rz))
        obox(A, (p + q) / 2 + V((0, 0, 0.004)), (q - p) * 0.5 + V((0.006, 0, 0)), V((0, 0.012, 0)), V((0, 0, 0.006)), C['frame'])
    for sg in (1, -1):
        F.pipe(A, [(2.00, sg * (CW + 0.004), 0.95), (2.00, sg * (CW + 0.06), 0.97), (2.40, sg * (CW + 0.06), 0.97), (2.40, sg * (CW + 0.004), 0.95)], 0.012, C['steel'], 8)
    objs.append(A.done(35, tint=wear))
    return objs, glass

def seat(A, fine=True):
    x = 1.35
    acyl(A, (x, 0, Z_SOLE - 0.002), (x, 0, Z_SOLE + 0.012), 0.16, lambda z: C['alu'], seg=20 if fine else 8)
    acyl(A, (x, 0, Z_SOLE + 0.012), (x, 0, 0.82), 0.04, lambda z: C['alu'], seg=14 if fine else 6)
    acyl(A, (x, 0, 0.82), (x, 0, 0.845), 0.10, lambda z: C['dark'], seg=14 if fine else 6)
    cushion(A, x - 0.22, x + 0.22, -0.22, 0.22, 0.845, 0.10, 0.035)
    # the backrest on its bracket
    obox(A, (x - 0.21, 0, 0.92), (0.012, 0, 0), (0, 0.05, 0), (0, 0, 0.08), C['alu'])
    rr = lambda d, z: [(x - 0.21 + p[0], p[1], z) for p in rrect(0, 0, 0.08 - 2 * d, 0.40 - 2 * d, 0.03 - d, n=4)]
    F.loft(A, [rr(0.012, 0.97), rr(0.0, 0.985), rr(0.0, 1.29), rr(0.012, 1.305)], lambda i: C['cush2'] if i != 1 else C['cush'], cap0=True, cap1=True)
    if fine: F.atorus(A, (x, 0, 0.60), (0, 0, 1), 0.16, 0.012, lambda a: C['steel'], seg=24, rseg=6)
    if fine:
        for k in range(3):
            a = 2 * math.pi * k / 3; acyl(A, (x + 0.04 * math.cos(a), 0.04 * math.sin(a), 0.60), (x + 0.15 * math.cos(a), 0.15 * math.sin(a), 0.60), 0.008, lambda z: C['steel'], seg=6)

LAMP_S = (5.42, 0.40); POLE = (0.85, 1.05)
def lamp_z(): return zs(LAMP_S[0]) + 0.045
def white_z(): return lamp_z() + 1.05
def lanterns(A, fine=True):
    """the sidelights on the bow deck, each with its screen inboard; the all-round white on its pole at the port quarter, which carries
    the ensign too (pole)"""
    for sg, m in ((1, C['lred']), (-1, C['lgreen'])):
        F.side_lantern(A, (LAMP_S[0], sg * LAMP_S[1], lamp_z()), (1, 0, 0), (0, sg, 0), m, C['frame'], C['dark'], foot=0.015)
    x, y = POLE; zb = zs(x)
    acyl(A, (x, y, zb - 0.002), (x, y, zb + 0.03), 0.032, lambda z: C['steel'], seg=14)
    acyl(A, (x, y, zb + 0.03), (x, y, white_z() - 0.065), 0.014, lambda z: C['steel'], seg=10)
    F.allround_lantern(A, (x, y, white_z()), C['lwhite'], C['frame'])


# ---------- the outboard and its propeller (parts of their own; they turn in the game) ----------
PIVOT = (XT, 0.0, ZN)
OBM = {}
def outboard(fine=True):
    A = Acc('outboard'); P = Acc('prop')
    M_ = {'cowl': C['motor'], 'band': C['motor2'], 'leg': C['leg'], 'steel': C['steel'], 'chrome': C['chrome'], 'dark': C['dark'], 'rubber': C['rubber'], 'anode': C['anode'], 'prop': C['prop']}
    pc = F.outboard(A, P, (XT, 0.0, ZN), 60, M_, shaft=0.635, fine=fine)
    OBM['prop'] = tuple(round(v, 4) for v in pc)
    return A.done(35, tint=wear), P.done(60)
PROPC = (XT - 0.66, 0.0, ZN - 0.635 - 0.165)


# ---------- the wheel and the throttle, only for the renders (the game draws its own, turning) ----------
WHEEL = (1.995, 0.0, 1.12); TILT = 0.35; LEVER = (2.10, -0.345, 1.05)
def wheel_part():
    """the steering wheel (fittings.helm_wheel) at the origin, its axis aft toward the skipper: the part 'wheel', which the game turns
    at skiff.wheel, tilted by wheelTilt (13-instruments.js)"""
    A = Acc('wheel'); F.helm_wheel(A, (0, 0, 0), (-1, 0, 0), 0.19, C['cush'], C['steel'], C['dark']); return A.done(40)

def render_only():
    w = wheel_part(); w.name = 'r_wheel'; w.location = WHEEL; w.rotation_euler = (0, TILT, 0)
    objs = [w]
    objs.append(box('r_lever_box', LEVER[0] - 0.08, LEVER[0] + 0.08, -0.36, -0.336, LEVER[2] - 0.08, LEVER[2] + 0.08, C['dark']))
    objs.append(cyl('r_lever', (LEVER[0], -0.36, LEVER[2]), (LEVER[0] - 0.03, -0.37, LEVER[2] + 0.17), 0.012, C['dark'], 8))
    return objs


def build(fine=True):
    HOLE_AT.clear(); LIDS.clear()
    M = Mesh('hull'); hull_shell(M, fine)
    for z in (Z_BOT, Z_BT):
        g = [f for f in M.bm.faces if f[M.paint]]
        ge = list(set([e for f in g for e in f.edges])); gv = list(set([v for f in g for v in f.verts]))
        bmesh.ops.bisect_plane(M.bm, geom=g + ge + gv, dist=1e-6, plane_co=(3.0, 0, z), plane_no=V((-SLB, 0, 1)).normalized())
    for f in M.bm.faces:
        if f[M.paint]: f.material_index = M.mi(side_mat(f.calc_center_median()))
    hull = tint(M.done(30))
    A = Acc('fit'); on_hull(A, fine); fittings(A, fine); seat(A, fine); lanterns(A, fine); gutting_board(A)
    objs, glass = console(fine)
    out = [hull, A.done(35, tint=wear)] + objs
    if not glass: glass = [box('noglass', 0, 0.01, 0, 0.01, -50, -49.99, C['glass'])]
    return out, glass


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

TUB = (3.30, 0.55)          # the catch tub's place on the sole forward of the console, port side
def kit_places(G):
    """the places where the game sets the deck kit (tools/deck; nothing that can be bought is modelled in, only its place, 19.10.2026):
    the ring buoy on the inside of the starboard side aft by the skipper's seat, its bracket under the gunwale's edge (a spare place
    on the port side); the 300 l catch tub on the sole forward of the console to port, where the catch is drawn (TUB); the net tub and
    the freight on the casting deck, the line tubs on the sole forward of the fisher's place, by the hauler"""
    r = lambda a: round(a, 3)
    return {'buoys': [G(1.63, -(yi(1.63) + 0.004), zs(1.63) - 0.04) + [r(-math.pi / 2)], G(2.42, yi(2.42) + 0.004, zs(2.42) - 0.04) + [r(math.pi / 2)]],
            'tubs': [G(TUB[0], TUB[1], Z_SOLE) + [0.0, 300]],
            'garn': {'at': G(4.58, 0.0, Z_CAST), 'ry': r(math.pi / 2)},
            'stamps': {'at': G(3.78, -0.10, Z_SOLE), 'ry': 0.0},
            'cargo': [G(4.70, 0.0, Z_CAST) + [0.0]]}

# the boat's own anchor (tools/deck/anker.py, drawn and let go by the game): its kind and mass, the fairlead (the bow roller's top)
def bower(G):
    return {'kind': 'plog', 'kg': 4, 'fair': G(5.95, 0, zs(5.7) + 0.055), 'side': 0}

def screens(G):
    """the corners of the live screens (the game's plotter, gauges and VHF), in the order texQuad takes them (bottom left, bottom
    right, top right, top left as seen by the skipper), 2 mm proud of the bezels"""
    out = {}
    u = V((0.35, 0, 1)); n = V((-1, 0, 0.35)).normalized(); o = V((SCR_X, 0, CTOP + 0.05)) + n * 0.0065
    for nm, (y0, y1, h) in SCR.items():
        # the skipper looks forward (+x), so his left is +y: bottom left is y1
        out[nm] = [G(*(o + V((0, y1, 0)))), G(*(o + V((0, y0, 0)))), G(*(o + V((0, y0, 0)) + u * h)), G(*(o + V((0, y1, 0)) + u * h))]
    return out

def anchors():
    G = lambda x, y, z: [round(v, 3) for v in to_game((x, y, z))]
    sole = round(Z_SOLE - WL, 3); gwz = lambda x: zs(x) - WL
    rgy = lambda x: round(hbs(x) - GW / 2, 3)            # the middle of the starboard gunwale (game x is to starboard)
    names = []
    for sg, xs in ((1, [4.95 - 0.70 * k / 12 for k in range(13)]), (-1, [4.25 + 0.70 * k / 12 for k in range(13)])):
        B = []; T = []
        for x in xs:
            for arr, dz in ((B, 0.31), (T, 0.13)):
                z = zs(x) - dz; y = y_at(x, z) + 0.012; arr.append(G(x, sg * y, z))
        names.append([B, T])
    gw_ = lambda x, up: [rgy(x), round(gwz(x) + up, 3), round(-(x - XM), 3)]
    sk = {'sole': sole, 'wheel': G(*WHEEL), 'wheelTilt': TILT, 'lever': G(LEVER[0], -0.38, LEVER[2]), 'motor': G(*PIVOT),
          'prop': [round(a - b, 3) for a, b in zip(to_game(PROPC), to_game(PIVOT))],
          'tub': G(TUB[0], TUB[1], Z_SOLE), 'fisher': G(2.90, -0.45, Z_SOLE), 'reel': gw_(2.95, 0.215), 'haul': gw_(3.15, 0.25),
          'mach': [gw_(x, 0.13) for x in (2.70, 3.30, 3.85)], 'stack': G(3.95, -0.15, Z_SOLE), 'charm': G(2.16, -0.20, 1.69),
          'skipper': G(1.55, 0.0, Z_SOLE), 'seat': G(0.95, 0.55, 0.96 - 0.46), 'filler': G(0.95, -(hbs(0.95) - 0.10), zs(0.95) + 0.02), 'names': names,
          'scr': screens(G)}
    x, y = POLE
    return {'bower': bower(G), 'eye': G(1.62, 0.0, Z_SOLE + 1.62), 'skipperAt': G(1.55, 0.0, Z_SOLE), 'hp': -0.40, 'fov': 62,
            'crewSpots': [G(0.95, 0.55, 0.96 - 0.46) + [0.0]], 'hauler': sk['haul'], 'filler': sk['filler'], 'pole': G(x, y, white_z() - 0.10),
            # typed lights (B8; rule 23 (d)(i): she makes 24 kn): the sides on the bow deck, the all-round white on its pole at the port
            # quarter, 1.05 m over the sides (annex I 2(d)) and within a metre of the ensign (mastTop: no pennant)
            'lights': [[G(LAMP_S[0], LAMP_S[1], lamp_z()), [1, 0.12, 0.1], 'port'], [G(LAMP_S[0], -LAMP_S[1], lamp_z()), [0.1, 1, 0.35], 'stbd'], [G(x, y, white_z()), [1, 0.95, 0.85], 'allround']],
            'deck': {'y': sole, 'z': round(-(1.2 - XM), 3)}, 'gw': round(gwz(3.0), 3), 'stern': round(XM + 0.1, 3), 'bow': -2.2, 'side': 0.83,
            'beam': 2.45, 'pl': 2.4, 'rl': 1.0, 'open': True, 'hand': True, 'skiff': sk,
            # the work at sea, in its order (Jonas 31.10.2026: «logisk og realistisk»): the fisher at the starboard rail forward of the
            # console by the hauler; the bleeding tub on the sole just forward of him, so the fish go from the rail straight into it (it
            # stood by the skipper's seat aft); the gutting board is the boat's own, across the port gunwale abreast the console (own:
            # the game draws no table; top: where the fish lie), the one who guts on the sole between it and the console; the iced
            # catch in the 300 l tub forward of the board (kit.tubs, TUB)
            'work': {'table': G(sum(GUT) / 2, 0.92, Z_SOLE), 'tub': G(3.25, -0.60, Z_SOLE), 's': 0.75, 'own': True, 'top': round(gut_top() - WL, 3)}, 'kit': kit_places(G)}


# ---------- the checks against the tables, the data and the rules ----------
def check():
    out = []
    xs = [XT + (XF - XT) * i / 400 for i in range(401)]
    def area(x, wl=WL):
        s = section(x); a = 0.0
        for (y0, z0), (y1, z1) in zip(s, s[1:]):
            za, zb = min(z0, wl), min(z1, wl)
            if z1 > z0 and za < wl: a += (y0 + y1) / 2 * (zb - za)
        return 2 * a
    def vol(wl):
        A_ = [area(x, wl) for x in xs]; v = sum((A_[i] + A_[i + 1]) / 2 * (xs[i + 1] - xs[i]) for i in range(400))
        s = section(XT); pa = 0.0
        for (y0, z0), (y1, z1) in zip(s, s[1:]):
            za, zb = min(z0, wl), min(z1, wl)
            if z1 > z0 and za < wl: pa += max(0.0, (y0 + y1) / 2 - YP) * (zb - za)
        return v + 2 * pa * XT
    v = vol(WL); wl1 = WL
    for _ in range(40):
        if vol(wl1) * 1.025 > DISP: wl1 -= 0.005
        else: break
    out.append(('deplasement %.2f t ved vannlinja %.2f (tegningen) mot %.1f t i VESSELS; %.1f t gir vannlinja %.2f' % (v * 1.025, WL, DISP, DISP, wl1), True))
    out.append(('lengde %.2f m (podene til stevnen; baugrulla til %.2f) mot %.1f' % (XF, 5.95 + 0.035 * 1.1, L), abs(XF - L) / L < 0.03))
    mb = max(hbs(x) for x in xs)
    out.append(('største bredde ved ripa %.3f m, over fenderlista %.3f, mot %.2f' % (2 * mb, 2 * mb + 0.056, BEAM), abs(2 * mb - BEAM) / BEAM < 0.05))
    out.append(('dybde midtskips %.2f m, fribord %.2f m' % (zs(3.0), zs(3.0) - WL), 1.0 <= zs(3.0) <= 1.2))
    out.append(('den hvite rundtlysende %.2f m over sidelanternene (vedlegg I 2(d): minst 1 m)' % (white_z() - lamp_z()), white_z() - lamp_z() >= 1.0))
    x, y = POLE
    out.append(('flagget på lyktestanga, %.2f m under lykta (spillet: en hvit lykt mer enn 1 m fra flaggstanga er en mast)' % 0.10, True))
    out.append(('propellen %.3f m under kjølen, skroget klar av motorbeinet' % (0.0 - (PROPC[2] - 0.17)), PROPC[2] + 0.17 < 0.0 + 0.10))
    out.append(('motorbrønnen: gulvet %.2f over vannlinja, hakket %.2f over dørken' % (ZWF - WL, ZN - Z_SOLE), ZWF > WL + 0.2))
    for s, ok_ in out: print(('OK   ' if ok_ else 'FEIL ') + s)
    return all(o for _, o in out)


SHOTS = [('bow3q', (8.5, -5.6, 2.6), (2.9, 0, 0.8), 35), ('stern3q', (-3.6, 4.4, 2.8), (2.4, 0, 0.7), 35), ('side', (2.9, -11.5, 1.0), (2.9, 0, 0.9), 35),
         ('above', (6.5, -4.5, 6.5), (2.8, 0, 0.6), 35), ('cockpit', (0.3, -1.6, 2.3), (3.2, 0.2, 0.7), 26)]

# the middle version (lodm) under bpyutil's 40 000: the game draws the outboard (1 828 triangles) and the propeller (1 344) on top of it,
# and the middle model with them must stay within the 120 000 points vessel3d allows (the same as the wooden boat, 31.10.2026)
bpyutil.LODM_TRIS = 36500

def main():
    os.makedirs(OUT, exist_ok=True)
    if 'check' in sys.argv: sys.exit(0 if check() else 1)
    check()
    reset(); colours()
    solids, glass = build(True)
    join(solids, 'BOAT0'); join(glass, 'GLASS0')
    ob, pr = outboard(True); ro = join(render_only(), 'RENDER_ONLY'); wh = wheel_part(); wh.hide_render = True
    if 'fast' not in sys.argv and 'dry' not in sys.argv: beauty(OUT, 'sk', WL, SHOTS)
    ro.hide_render = True
    ex = {'frame': 'kystfiske: x starboard, y up from the waterline, z aft; metres', 'type': 'skiff', 'name': 'Aluminiumsbåt 19 fot med midtkonsoll (5,9 m)', 'len': L, 'beam': BEAM, 'draft': 0.6,
          'anchors': anchors()}
    more = [{'name': 'cap', 'obj': cap_obj}, {'name': 'outboard', 'obj': ob, 'xf_p': rel_game(PIVOT), 'ao': True, 'show': True},
            {'name': 'prop', 'obj': pr, 'xf_p': rel_game(PROPC), 'ao': False, 'show': True},
            {'name': 'wheel', 'obj': wh, 'xf_p': lambda p: (-p[1], p[2], -p[0]), 'ao': False, 'show': False}]
    ro.hide_render = False
    export_boat(build, to_game, to_game_n, OUT, 'skiff59.glb', os.path.join(ROOT, 'src', 'data', 'boat-skiff59.b64'), ex,
                side=(os.path.join(ROOT, 'src', 'data', 'boat-skiff59-side.b64'), 2.9, 1.0, 7.0), dry='dry' in sys.argv, more=more)


if __name__ == '__main__':
    main()
