"""The NPC fleet's ships (Ø15 N7, steg 36): what the ferries, the express boats, the passenger ferries and the coastal route's ship have in
common. One script per model in this folder (ferje34.py, ferje64.py, ferje112.py, hurtig.py, passasjer.py, kystrute.py) gives the tables
and the superstructure; this file builds the hull from them, the decks, the houses with their windows, the funnels, masts, boats and the
lanterns, and exports through tools/boats/bpyutil.py (export_boat) as the boats do, to src/data/ship-<type>.b64.

The rules (CLAUDE.md, docs/planer/npc-flaaten.md N7, Jonas 05.11.2026 valg 2 A): the outside only (no interiors), no real vessel's,
owner's or brand's name, mark or logo anywhere (the funnels are plain colour), neutral colours (white, dark blue, red). The models stand
for the type, not for a ship; the types that gave the measures are named in the scripts' comments and in docs/systemer/npc-trafikk.md only.
They are NPC models seen at 30-500 m: the near version (lod0) under the NPC budget of 40 000 triangles (the /blender skill), the far one
(lod1) under about 4 000.

Frame (as tools/boats/kv.py): x forward from the after end, y to port, z up from the base line (the keel's underside); the waterline is
z = T. to_game turns it to the game's (x starboard, y up from the waterline, z aft, the middle of the length at the origin).

    python3.11 tools/ships/<model>.py dry           -> the GLB in tools/ships/out only, and the renders
    python3.11 tools/ships/<model>.py fast dry      -> no renders
    python3.11 tools/ships/<model>.py check         -> the checks only
    python3.11 tools/ships/<model>.py fast export   -> src/data/ship-<type>.b64
"""
import os, sys, math
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE)); OUT = os.path.join(HERE, 'out')
sys.path.insert(0, os.path.join(ROOT, 'tools', 'boats'))
import bpy
from bpyutil import *          # (read only: tools/boats is Ø4's and the player's boats; the helpers are shared, as the coast guard's ships use them)

def lerp(a, b, t): return a + (b - a) * t
def clamp(v, a, b): return max(a, min(b, v))
def sstep(t): t = clamp(t, 0.0, 1.0); return t * t * (3 - 2 * t)


# ---------- colours (neutral; no owner's colours copied: white, dark blue, red, as Jonas' rule) ----------
C = {}
def colours(hull=(0.07, 0.12, 0.24), band=(0.70, 0.10, 0.09), sup=(0.92, 0.92, 0.90)):
    C.clear()
    C['af'] = mat('af', (0.36, 0.09, 0.08), 0.25, zone=1)           # the antifouling under the waterline
    C['boot'] = mat('boot', (0.05, 0.05, 0.06), 0.3, zone=1)        # the boot top at the waterline
    C['hull'] = mat('hull', hull, 0.55, zone=1)
    C['band'] = mat('band', band, 0.55, zone=1)
    C['sup'] = mat('sup', sup, 0.45, zone=3)
    C['sup2'] = mat('sup2', (sup[0] * 0.86, sup[1] * 0.86, sup[2] * 0.85), 0.4, zone=3)   # the houses' shaded and recessed faces
    C['roof'] = mat('roof', (0.62, 0.64, 0.64), 0.3, zone=4)
    C['deck'] = mat('deck', (0.36, 0.40, 0.40), 0.25, zone=4)       # the steel decks' grey-green
    C['cardeck'] = mat('cardeck', (0.30, 0.31, 0.32), 0.15, zone=4)
    C['lane'] = mat('lane', (0.85, 0.83, 0.70), 0.2)
    C['win'] = mat('win', (0.06, 0.09, 0.12), 0.95)                 # the windows: dark glass, glossy
    C['winB'] = mat('winB', (0.10, 0.16, 0.22), 0.95)               # the bridge's, a little lighter (the sky in them)
    C['steel'] = mat('steel', (0.55, 0.57, 0.58), 0.5)
    C['dark'] = mat('dark', (0.10, 0.10, 0.11), 0.3)
    C['black'] = mat('black', (0.04, 0.04, 0.04), 0.3)
    C['red'] = mat('red', band, 0.5)
    C['orange'] = mat('orange', (0.95, 0.42, 0.08), 0.5)            # the lifeboats and the rescue boat (SOLAS orange)
    C['raft'] = mat('raft', (0.88, 0.88, 0.86), 0.4)               # the liferaft canisters
    C['rubber'] = mat('rubber', (0.08, 0.08, 0.08), 0.2)           # the fendering
    C['lampW'] = mat('lampW', (1.0, 0.95, 0.80), 0.8, emit=0.6)
    C['lampR'] = mat('lampR', (0.9, 0.1, 0.1), 0.8, emit=0.6)
    C['lampG'] = mat('lampG', (0.1, 0.85, 0.3), 0.8, emit=0.6)
    C['glass'] = mat('glass', (0.25, 0.35, 0.40), 0.95)
    return C


# ---------- the hull: stations along u (0 at the after end, 1 at the bow), rows up the girth from the keel to the deck ----------
class Hull:
    """P: L (over all), B (moulded), T (draught), the tables
         stem   [(z, x)] the bow's profile (x of the stem at the height z)
         stern  [(z, x)] the after end's (a transom: x = 0 up the height; a double-ended ferry: the mirror of the stem)
         keel   [(u, z)] the keel's underside along u (rising at the ends)
         deck   [(u, z)] the deck at the side (the sheer)
         fore   (u_f, e_lo, e_hi, end): the waterlines narrow forward of u_f as 1 - t^e (e from the keel's e_lo to the deck's e_hi:
                fuller up high, the flare), to end x half-breadth at the stem (0 a sharp stem, a ferry's ramp end its share)
         aft    (u_a, e_lo, e_hi, end): the same aft of u_a (end: the transom's share of the half-breadth)
         p      [(u, p)] the sections' superellipse power (2 round, 4-6 the full midship of a ferry or a coaster; finer at the ends)
         flare  the share of the half-breadth the waterline lacks against the deck (the flare and the tumblehome-free side)
         bands  [(z, mat)] where the colours change up the side, from the bottom: [(T + 0.3, 'af'), (T + 0.7, 'boot'), (None, 'hull')]
    """
    def __init__(s, P):
        s.P = P; s.L = P['L']; s.B = P['B']; s.T = P['T']; s.HB = s.B / 2
    def xf(s, z): return interp(s.P['stem'], z)
    def xa(s, z): return interp(s.P['stern'], z)
    def zk(s, u): return interp(s.P['keel'], u)
    def zd(s, u): return interp(s.P['deck'], u)
    def x(s, u, z): a = s.xa(z); return a + u * (s.xf(z) - a)
    def plan(s, u, z):
        h = clamp(z / max(0.1, s.zd(u)), 0.0, 1.0)
        uf, e0, e1, end = s.P['fore']; ua, a0, a1, aend = s.P['aft']
        k = 1.0
        if u > uf:
            t = (u - uf) / (1 - uf); e = lerp(e0, e1, h); k = min(k, end + (1 - end) * (1 - t ** e))
        if u < ua:
            t = (ua - u) / ua; e = lerp(a0, a1, h); k = min(k, aend + (1 - aend) * (1 - t ** e))
        return max(0.0, k)
    def sec(s, u, z):
        """the section's half-breadth share at z: a superellipse from the keel (0) to the waterline (1), full above it"""
        z0 = s.zk(u); zr = max(z0 + 0.2, s.T * 1.02); sv = clamp((z - z0) / (zr - z0), 0.0, 1.0); p = interp(s.P['p'], u)
        return (1 - (1 - sv) ** p) ** (1 / p)
    def hw(s, u, z):
        fl = s.P.get('flare', 0.0); h = clamp((z - s.T) / max(0.1, s.zd(u) - s.T), 0.0, 1.0)
        return s.HB * (1 - fl * (1 - h)) * s.plan(u, z) * s.sec(u, z)
    def us(s, n):
        """the stations: closer at the ends, where the shape turns"""
        out = []
        for i in range(n + 1):
            t = i / n; out.append(0.5 - 0.5 * math.cos(math.pi * t) if s.P.get('ends_fine', True) else t)
        return out
    def rows(s, u, fine):
        """the heights of a station's rows: the bands' edges exactly (the colours change on a row), and between them as many as the
        shape needs (more down the bilge)"""
        z0 = s.zk(u); top = s.zd(u); out = [z0]
        nb = (7 if fine else 3)
        edges = [b[0] for b in s.P['bands'] if b[0] is not None]
        lo = z0
        for i, e in enumerate(edges + [top]):
            e = clamp(e, lo + 0.02, top) if e < top else top
            if e <= lo + 0.01: continue
            n = nb if i == 0 else (2 if fine and e - lo > 1.5 else 1)
            for k in range(1, n + 1):
                t = k / n
                if i == 0: t = 1 - (1 - t) ** 1.6          # the bottom's rows closer at the bilge
                out.append(lo + (e - lo) * t)
            lo = e
        return out
    def mat_at(s, z):
        for e, m in s.P['bands']:
            if e is None or z < e - 1e-4: return C[m]
        return C[s.P['bands'][-1][1]]


def build_hull(H, fine=True, yoff=0.0, name='hull'):
    """the shell, both sides, and the end faces (the transom, a ferry's ramp ends); the deck is decks(). yoff: a catamaran's demi-hull,
    its middle yoff to port (R's half-breadths stay about its own middle)"""
    A = Acc(name); n = 56 if fine else 14; U = H.us(n)
    R = [[(H.x(u, z), H.hw(u, z), z) for z in H.rows(u, fine)] for u in U]
    nr = min(len(r) for r in R)
    R = [r[:1] + r[len(r) - nr + 1:] if len(r) > nr else r for r in R]   # (every station the same count: the extra rows of a fine bottom dropped at the top)
    for j in range(len(U) - 1):
        a, b = R[j], R[j + 1]
        for k in range(nr - 1):
            zc = (a[k][2] + a[k + 1][2] + b[k][2] + b[k + 1][2]) / 4; m = H.mat_at(zc)
            for sg in (1, -1):
                q = [(a[k][0], yoff + sg * a[k][1], a[k][2]), (b[k][0], yoff + sg * b[k][1], b[k][2]), (b[k + 1][0], yoff + sg * b[k + 1][1], b[k + 1][2]), (a[k + 1][0], yoff + sg * a[k + 1][1], a[k + 1][2])]
                if abs(q[0][1]) + abs(q[1][1]) + abs(q[2][1]) + abs(q[3][1]) < 1e-4: continue
                A.poly(q, m, (0, sg, -0.3 if k < 2 else 0.0))
    for j, out in ((0, (-1, 0, 0)), (len(U) - 1, (1, 0, 0))):
        r = R[j]
        if max(p[1] for p in r) < 0.05: continue
        pts = [(p[0], p[1], p[2]) for p in r] + [(p[0], -p[1], p[2]) for p in reversed(r)]
        # the end face in bands of colour: the same rows, port to starboard
        for k in range(nr - 1):
            zc = (r[k][2] + r[k + 1][2]) / 2
            A.poly([(r[k][0], yoff + r[k][1], r[k][2]), (r[k + 1][0], yoff + r[k + 1][1], r[k + 1][2]), (r[k + 1][0], yoff - r[k + 1][1], r[k + 1][2]), (r[k][0], yoff - r[k][1], r[k][2])], H.mat_at(zc), out)
    return A.done(40), R, U


def deck_surface(A, H, R, U, m, u0=0.0, u1=1.0, inset=0.0, dz=0.0):
    """the deck at the side's top between the stations u0..u1 (flat across, the camber does not show at these distances)"""
    for j in range(len(U) - 1):
        if U[j + 1] < u0 - 1e-6 or U[j] > u1 + 1e-6: continue
        a, b = R[j][-1], R[j + 1][-1]; ya = max(0.0, a[1] - inset); yb = max(0.0, b[1] - inset)
        if ya + yb < 1e-3: continue
        A.poly([(a[0], -ya, a[2] + dz), (b[0], -yb, b[2] + dz), (b[0], yb, b[2] + dz), (a[0], ya, a[2] + dz)], m, (0, 0, 1))

def bulwark(A, H, R, U, h, mo, mi, u0, u1, inset=0.06):
    """the bulwark over the deck's edge from u0 to u1, h high: the outside in mo (the hull's colour), the inside and the cap in mi"""
    for j in range(len(U) - 1):
        if U[j] < u0 - 1e-6 or U[j + 1] > u1 + 1e-6: continue
        a, b = R[j][-1], R[j + 1][-1]
        for sg in (1, -1):
            A.poly([(a[0], sg * a[1], a[2]), (b[0], sg * b[1], b[2]), (b[0], sg * b[1], b[2] + h), (a[0], sg * a[1], a[2] + h)], mo, (0, sg, 0))
            ai = max(0.0, a[1] - inset); bi = max(0.0, b[1] - inset)
            A.poly([(a[0], sg * ai, a[2]), (b[0], sg * bi, b[2]), (b[0], sg * bi, b[2] + h), (a[0], sg * ai, a[2] + h)], mi, (0, -sg, 0))
            A.poly([(a[0], sg * ai, a[2] + h), (b[0], sg * bi, b[2] + h), (b[0], sg * b[1], b[2] + h), (a[0], sg * a[1], a[2] + h)], mi, (0, 0, 1))

def rubbing_strake(A, H, R, U, z, m, d=0.18, h=0.25):
    """a fender belt round the hull at the height z (the ferries' and the express boats' rubber, the ships' steel belt)"""
    for j in range(len(U) - 1):
        ua, ub = U[j], U[j + 1]
        ya = H.hw(ua, z); yb = H.hw(ub, z); xa = H.x(ua, z); xb = H.x(ub, z)
        if ya < 0.05 and yb < 0.05: continue
        for sg in (1, -1):
            A.poly([(xa, sg * (ya + d), z), (xb, sg * (yb + d), z), (xb, sg * (yb + d), z + h), (xa, sg * (ya + d), z + h)], m, (0, sg, 0))
            A.poly([(xa, sg * ya, z + h), (xb, sg * yb, z + h), (xb, sg * (yb + d), z + h), (xa, sg * (ya + d), z + h)], m, (0, 0, 1))
            A.poly([(xa, sg * ya, z), (xb, sg * yb, z), (xb, sg * (yb + d), z), (xa, sg * (ya + d), z)], m, (0, 0, -1))


# ---------- houses ----------
def rrect(x0, x1, y0, y1, rf=0.0, ra=0.0, n=4):
    """a plan with rounded corners (rf forward, ra aft), counter-clockwise from above (x forward, y to port)"""
    pts = []
    def arc(cx, cy, r, a0, a1):
        if r <= 1e-3: pts.append((cx, cy)); return
        for k in range(n + 1):
            a = a0 + (a1 - a0) * k / n; pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    arc(x1 - rf, y0 + rf, rf, -math.pi / 2, 0.0) if rf > 1e-3 else pts.append((x1, y0))
    arc(x1 - rf, y1 - rf, rf, 0.0, math.pi / 2) if rf > 1e-3 else pts.append((x1, y1))
    arc(x0 + ra, y1 - ra, ra, math.pi / 2, math.pi) if ra > 1e-3 else pts.append((x0, y1))
    arc(x0 + ra, y0 + ra, ra, math.pi, 1.5 * math.pi) if ra > 1e-3 else pts.append((x0, y0))
    return pts

def bowfront(x0, x1, y0, y1, nose, n=6):
    """a plan whose front is a curve that runs out to a point nose metres forward of x1 (a superstructure's rounded front)"""
    pts = [(x0, y0)]
    for k in range(n + 1):
        t = k / n; a = -math.pi / 2 + math.pi * t; yy = (y0 + y1) / 2 + (y1 - y0) / 2 * math.sin(a); pts.append((x1 + nose * math.cos(a), yy))
    pts.append((x0, y1))
    return pts

def prism(A, poly, z0, z1, mw, mr, top=True, bottom=False, skip=()):
    """walls round a counter-clockwise plan from z0 to z1 (skip: edges left open), the roof in mr"""
    n = len(poly)
    for i in range(n):
        if i in skip: continue
        a, b = poly[i], poly[(i + 1) % n]
        if math.hypot(b[0] - a[0], b[1] - a[1]) < 1e-4: continue
        A.poly([(a[0], a[1], z0), (b[0], b[1], z0), (b[0], b[1], z1), (a[0], a[1], z1)], mw, (b[1] - a[1], -(b[0] - a[0]), 0))
    if top: A.poly([(p[0], p[1], z1) for p in poly], mr, (0, 0, 1))
    if bottom: A.poly([(p[0], p[1], z0) for p in reversed(poly)], mr, (0, 0, -1))

def edge_n(a, b):
    L = math.hypot(b[0] - a[0], b[1] - a[1]) or 1.0; return ((b[1] - a[1]) / L, -(b[0] - a[0]) / L), L

def windows(A, poly, z0, z1, m, every=1.6, w=1.1, edges=None, off=0.03, margin=0.6, lit=None, litk=1):
    """windows on the walls of a plan: on each edge (all, or those in edges) as many panes w wide as fit every metres apart, from z0 to
    z1, standing off the wall by off (never two faces in one plane). lit: a list that gets the panes' middles (the lights at night;
    every litk-th pane)"""
    n = len(poly); c = 0
    for i in range(n):
        if edges is not None and i not in edges: continue
        a, b = poly[i], poly[(i + 1) % n]; (nx, ny), L = edge_n(a, b)
        if L < w + 2 * margin * 0.5: continue
        k = max(1, int((L - 2 * margin + (every - w)) / every)); used = k * every - (every - w); s0 = (L - used) / 2
        for j in range(k):
            t0 = (s0 + j * every) / L; t1 = (s0 + j * every + w) / L
            p0 = (a[0] + (b[0] - a[0]) * t0 + nx * off, a[1] + (b[1] - a[1]) * t0 + ny * off); p1 = (a[0] + (b[0] - a[0]) * t1 + nx * off, a[1] + (b[1] - a[1]) * t1 + ny * off)
            A.poly([(p0[0], p0[1], z0), (p1[0], p1[1], z0), (p1[0], p1[1], z1), (p0[0], p0[1], z1)], m, (nx, ny, 0))
            if lit is not None and c % litk == 0: lit.append(((p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2, (z0 + z1) / 2))
            c += 1

def band(A, poly, z0, z1, m, edges=None, off=0.03):
    """a continuous band on the walls (a row of windows seen from afar, a stripe of colour)"""
    n = len(poly)
    for i in range(n):
        if edges is not None and i not in edges: continue
        a, b = poly[i], poly[(i + 1) % n]; (nx, ny), L = edge_n(a, b)
        if L < 1e-3: continue
        A.poly([(a[0] + nx * off, a[1] + ny * off, z0), (b[0] + nx * off, b[1] + ny * off, z0), (b[0] + nx * off, b[1] + ny * off, z1), (a[0] + nx * off, a[1] + ny * off, z1)], m, (nx, ny, 0))

def parapet(A, pts, z, h, m, closed=False, t=0.06):
    """a solid rail (the white plating and glass of a ship's open decks, cheaper than posts and rails at these distances), t thick"""
    n = len(pts); rng = range(n if closed else n - 1)
    for i in rng:
        a, b = pts[i], pts[(i + 1) % n]
        if math.hypot(b[0] - a[0], b[1] - a[1]) < 1e-3: continue
        beam(A, (a[0], a[1], z + h / 2), (b[0], b[1], z + h / 2), t, h, m)

def wheelhouse(A, x0, x1, hw, z0, z1, wing=0.0, fine=True, both=False, lit=None):
    """a bridge: a house x0..x1, hw to each side, with its windows all round the front (and the back on a double-ended ferry, both),
    and wings out to hw + wing at the front; the windows lean out at the top as on a ship's bridge"""
    pl = rrect(x0, x1, -hw, hw, 0.4, 0.4 if both else 0.2, 2)
    prism(A, pl, z0, z1, C['sup'], C['roof'])
    zw0 = z0 + (z1 - z0) * 0.42; zw1 = z1 - 0.35
    if fine:
        windows(A, pl, zw0, zw1, C['winB'], every=1.25, w=1.05, margin=0.15, lit=lit, litk=3)
    else:
        band(A, pl, zw0, zw1, C['winB'])
    # the roof's visor
    abox(A, x0 - 0.1, x1 + 0.35, -hw - 0.15, hw + 0.15, z1, z1 + 0.18, C['sup'])
    if wing > 0:
        for sg in (1, -1):
            yy0 = sg * hw; yy1 = sg * (hw + wing)
            abox(A, x1 - 2.6, x1, min(yy0, yy1), max(yy0, yy1), z0 + 0.0, z0 + 0.25, C['sup'])   # (the wing's deck)
            prism(A, rrect(x1 - 2.4, x1 - 0.2, min(yy0, yy1) + (0 if sg > 0 else 0.2), max(yy0, yy1) - (0.2 if sg > 0 else 0)), z0 + 0.25, z0 + 1.2, C['sup'], C['sup'])
            if both:
                abox(A, x0, x0 + 2.6, min(yy0, yy1), max(yy0, yy1), z0, z0 + 0.25, C['sup'])
                prism(A, rrect(x0 + 0.2, x0 + 2.4, min(yy0, yy1) + (0 if sg > 0 else 0.2), max(yy0, yy1) - (0.2 if sg > 0 else 0)), z0 + 0.25, z0 + 1.2, C['sup'], C['sup'])


# ---------- the fittings over the houses ----------
def funnel(A, x, y, z0, z1, l, w, m, mtop, rake=0.25, fine=True):
    """a funnel: a rounded plan raked aft (rake metres per metre up), its top in mtop"""
    seg = 4 if fine else 1
    base = rrect(x - l / 2, x + l / 2, y - w / 2, y + w / 2, w * 0.45, w * 0.3, seg)
    h = z1 - z0; zt = z1 - min(1.0, h * 0.18)
    sh = lambda p, z: (p[0] - rake * (z - z0), p[1])
    n = len(base)
    for i in range(n):
        a, b = base[i], base[(i + 1) % n]
        for za, zb, mm in ((z0, zt, m), (zt, z1, mtop)):
            A.poly([sh(a, za) + (za,), sh(b, za) + (za,), sh(b, zb) + (zb,), sh(a, zb) + (zb,)], mm, (b[1] - a[1], -(b[0] - a[0]), 0))
    A.poly([sh(p, z1) + (z1,) for p in base], C['black'], (0, 0, 1))

def mast(A, x, y, z0, z1, r=0.12, m=None, fine=True, yard=0.0):
    """a pole mast with a yard (the radar's and the lights' platform)"""
    m = m or C['sup']; acyl(A, (x, y, z0), (x, y, z1), r, lambda z: m, seg=8 if fine else 4, r1=r * 0.7)
    if yard > 0: abox(A, x - 0.12, x + 0.12, y - yard, y + yard, z1 - 1.6, z1 - 1.45, m)

def radar(A, x, y, z, L=3.2, fine=True):
    abox(A, x - 0.2, x + 0.2, y - 0.2, y + 0.2, z, z + 0.4, C['steel'])
    if fine: abox(A, x - 0.16, x + 0.16, y - L / 2, y + L / 2, z + 0.4, z + 0.62, C['sup'])

def lamp(A, c, m, r=0.14, h=0.32):
    acyl(A, (c[0], c[1], c[2] - h / 2), (c[0], c[1], c[2] + h / 2), r, lambda z: m, seg=6)

def side_light(A, x, y, z, sg):
    """a sidelight in its screen (rule 21 b; the screen inboard and aft of the lamp, painted black)"""
    yy = y - sg * 0.06
    abox(A, x - 0.75, x + 0.05, min(yy, yy - sg * 0.05), max(yy, yy - sg * 0.05), z - 0.35, z + 0.35, C['black'])
    lamp(A, (x - 0.15, y + sg * 0.12, z), C['lampR'] if sg > 0 else C['lampG'], r=0.11, h=0.24)

def capsule(A, c, L, W, H, m, n=10, rings=6, keel=0.0, roofm=None, pitch=0.0):
    """a boat shape (a lifeboat, a rescue boat): an ellipsoid-ish loft along x, flatter on top; roofm the canopy's colour over the sheer;
    pitch: the +x end tipped up by that many radians about the middle (a free-fall boat on her ramp, her bow down over the stern)"""
    cx, cy, cz = c; R = []
    cp, sp = math.cos(pitch), math.sin(pitch)
    rot = (lambda q: (cx + (q[0] - cx) * cp - (q[2] - cz) * sp, q[1], cz + (q[0] - cx) * sp + (q[2] - cz) * cp)) if pitch else (lambda q: q)
    for i in range(rings + 1):
        t = -1 + 2 * i / rings; sx = cx + t * L / 2; k = (1 - abs(t) ** 2.4) ** 0.5
        ring = []
        for j in range(n):
            a = 2 * math.pi * j / n; yy = math.cos(a) * W / 2 * max(0.05, k); zz = math.sin(a) * H / 2 * max(0.05, k)
            if zz < 0: zz *= 0.8
            ring.append(rot((sx, cy + yy, cz + zz)))
        R.append(ring)
    for i in range(rings):
        for j in range(n):
            jj = (j + 1) % n; a, b, cc, d = R[i][j], R[i + 1][j], R[i + 1][jj], R[i][jj]
            mm = roofm if roofm is not None and (math.sin(2 * math.pi * j / n) + math.sin(2 * math.pi * jj / n)) / 2 > 0.24 else m
            A.poly([a, b, cc, d], mm, ((a[0] + cc[0]) / 2 - cx, (a[1] + cc[1]) / 2 - cy, (a[2] + cc[2]) / 2 - cz))

def davits(A, x0, x1, y, z0, h, sg, m=None):
    """a lifeboat's pair of davits: arms from the deck at z0 out over the side at y and up h"""
    m = m or C['steel']
    for x in (x0, x1):
        beam(A, (x, y - sg * 0.9, z0), (x, y - sg * 0.4, z0 + h), 0.22, 0.22, m)
        beam(A, (x, y - sg * 0.4, z0 + h), (x, y + sg * 0.5, z0 + h + 0.2), 0.2, 0.2, m)

def raft(A, x, y, z, m=None):
    """a liferaft canister in its cradle"""
    acyl(A, (x - 0.6, y, z + 0.33), (x + 0.6, y, z + 0.33), 0.33, lambda zz: m or C['raft'], seg=8)
    abox(A, x - 0.5, x + 0.5, y - 0.3, y + 0.3, z, z + 0.08, C['steel'])


# ---------- the merchant ships' own parts (last.py, tank.py, cruise.py) ----------
def rail(A, pts, z, h=1.0, m=None, t=0.05):
    """a pipe rail along pts (the deck's edge on a merchant ship): the top rail and a knee rail, posts every 3 m; at 30-500 m a thin line"""
    m = m or C['sup']
    for i in range(len(pts) - 1):
        a, b = pts[i], pts[i + 1]; L = math.hypot(b[0] - a[0], b[1] - a[1])
        if L < 1e-3: continue
        for zz in (z + h, z + h * 0.5): beam(A, (a[0], a[1], zz), (b[0], b[1], zz), t, t, m)
        k = max(1, int(L / 3.0))
        for j in range(k + 1):
            if j == 0 and i > 0: continue
            q = (a[0] + (b[0] - a[0]) * j / k, a[1] + (b[1] - a[1]) * j / k); beam(A, (q[0], q[1], z), (q[0], q[1], z + h), t, t, m, up=(1, 0, 0))

def deck_crane(A, x, y, z0, ped, jib, ang, m, mj=None, fine=True, rest=None):
    """a ship's deck crane: the pedestal ped high, the crane house on it, the jib jib long lowered and stowed pointing ang radians from
    forward (0 forward, pi aft) down to its rest at the height rest (or level); mj the jib's colour"""
    mj = mj or m; seg = 10 if fine else 6
    acyl(A, (x, y, z0), (x, y, z0 + ped), 1.15, lambda z: m, seg=seg)
    zh = z0 + ped; ca, sa = math.cos(ang), math.sin(ang)
    obox(A, (x - ca * 0.4, y - sa * 0.4, zh + 1.3), (ca * 2.0, sa * 2.0, 0), (-sa * 1.5, ca * 1.5, 0), (0, 0, 1.3), m)
    if fine: obox(A, (x + ca * 1.7, y + sa * 1.7 + (-ca) * 0.0, zh + 2.2), (ca * 0.3, sa * 0.3, 0), (-sa * 0.7, ca * 0.7, 0), (0, 0, 0.45), C['win'])   # (the cab's window)
    p0 = (x + ca * 1.0, y + sa * 1.0, zh + 1.2); zt = rest if rest is not None else zh + 1.2
    p1 = (x + ca * jib, y + sa * jib, zt)
    beam(A, p0, p1, 0.9, 1.0, mj)
    if fine and rest is not None:   # the jib's rest: a post under its head
        acyl(A, (p1[0] - ca * 0.6, p1[1] - sa * 0.6, z0), (p1[0] - ca * 0.6, p1[1] - sa * 0.6, zt - 0.5), 0.25, lambda z: m, seg=6)

def freefall(A, x, y, z, L, W, H, ang, fine=True):
    """a free-fall lifeboat on her ramp over the stern: her middle at (x, y, z), bow aft and down ang radians, the ramp's two rails under
    her (SOLAS: a bulk ship's or a tanker's boat; the colour orange)"""
    capsule(A, (x, y, z), L, W, H, C['orange'], n=10 if fine else 6, rings=6 if fine else 2, pitch=ang)
    if fine:
        ca, sa = math.cos(ang), math.sin(ang)
        for yy in (y - W * 0.3, y + W * 0.3):
            beam(A, (x - ca * L * 0.55, yy, z - H * 0.55 - sa * L * 0.55), (x + ca * L * 0.55, yy, z - H * 0.55 + sa * L * 0.55), 0.25, 0.35, C['steel'])
        for xx in (x + ca * L * 0.45, x - ca * L * 0.1):
            zt = z - H * 0.55 + (xx - x) * sa / max(0.2, ca)
            beam(A, (xx, y - W * 0.5, zt), (xx, y + W * 0.5, zt), 0.25, 0.3, C['steel'])

def hull_windows(A, H, x0, x1, z0, z1, every, w, m, lit=None, litk=1, skip=()):
    """windows on the hull's side between x0 and x1 (as kystrute.py's), each a quad 3 cm off the plating at its own station"""
    x = x0; k = 0
    while x + w <= x1:
        if not any(a <= x <= b for a, b in skip):
            for sg in (1, -1):
                q = []
                for (xx, zz) in ((x, z0), (x + w, z0), (x + w, z1), (x, z1)):
                    u = clamp((xx - H.xa(zz)) / (H.xf(zz) - H.xa(zz)), 0, 1); q.append((xx, sg * (H.hw(u, zz) + 0.03), zz))
                A.poly(q, m, (0, sg, 0))
                if lit is not None and k % litk == 0:
                    u = clamp((x + w / 2 - H.xa((z0 + z1) / 2)) / (H.xf((z0 + z1) / 2) - H.xa((z0 + z1) / 2)), 0, 1); lit.append((x + w / 2, sg * (H.hw(u, (z0 + z1) / 2) + 0.03), (z0 + z1) / 2))
            k += 1
        x += every

def lit_band(lit, x0, x1, y, z, every):
    """the lights at night along a band of windows drawn as one quad (no panes): a point every so many metres"""
    x = x0 + every / 2
    while x < x1: lit.append((x, y, z)); x += every


# ---------- the game's frame and the export ----------
def to_game_f(H):
    return (lambda p: (-p[1], p[2] - H.T, -(p[0] - H.L / 2))), (lambda n: (-n[1], n[2], -n[0]))

def lights_game(H, L):
    """the lanterns {kind: (x, y, z)} in the model's frame -> the game's typed list ([pos, colour, kind]; vessel3d.js lanterns)"""
    tg, _ = to_game_f(H); col = {'masthead': [1, 0.95, 0.85], 'masthead2': [1, 0.95, 0.85], 'stern': [1, 0.95, 0.85], 'port': [1, 0.12, 0.1], 'stbd': [0.1, 1, 0.35]}
    return [[[round(v, 3) for v in tg(p)], col[k], k] for k, p in L.items()]

def place_lights(A, H, L, fine=True):
    """the lamps where the lanterns are (the masthead lights white on their mast, the sidelights in their screens, the stern light)"""
    for k, p in L.items():
        if k in ('port', 'stbd'): side_light(A, p[0], p[1], p[2], 1 if k == 'port' else -1)
        else: lamp(A, p, C['lampW'])

def check_lights(H, L, hull_z, say):
    """the lanterns against the rules (FOR-1975-12-01-5, vedlegg I; read on Lovdata for kv.py 10.11.2026): one masthead light under 50 m,
    two from 50 m, the after one at least 4.5 m higher and at least half the length aft of the forward one (or 100 m); the forward one
    within a quarter of the length from the stem; the forward one at least 12 m (or the beam, at least 6 m) over the hull; the sidelights at
    most 3/4 of the masthead's height and not forward of it; red to port, green to starboard"""
    xx = lambda k: L[k][0]; zz = lambda k: L[k][2]; LOA = H.L
    mh = zz('masthead') - hull_z
    if LOA < 50:
        say(mh >= min(12.0, max(6.0, H.B)) - 1e-6 if LOA >= 20 else mh >= 2.5, 'topplanterna %.1f m over skroget (vedlegg I 2(a)(i): minst bredden, 6-12 m; under 20 m 2(c): 2,5 m)' % mh)
        say('masthead2' not in L, 'én topplanterne (under 50 m, regel 23 a ii)')
    else:
        say(mh >= min(12.0, max(6.0, H.B)) - 1e-6, 'den forre topplanterna %.1f m over skroget (2(a)(i))' % mh)
        d2 = zz('masthead2') - zz('masthead'); sep = xx('masthead') - xx('masthead2')
        say(d2 >= 4.5 - 1e-6, 'den aktre topplanterna %.1f m høyere (2(a)(ii): minst 4,5 m)' % d2)
        say(sep >= min(100.0, LOA / 2) - 1e-6, '%.1f m mellom topplanternene (3(a): minst halve lengden, %.1f m)' % (sep, LOA / 2))
        say(LOA - xx('masthead') <= LOA / 4 + 1e-6, 'den forre %.1f m fra stevnen (3(a): høyst en firedel av lengden)' % (LOA - xx('masthead')))
    sh = zz('port') - hull_z
    say(sh <= 0.75 * mh + 1e-6, 'sidelanternene %.1f m over skroget, høyst 3/4 av topplanterna (2(g))' % sh)
    if LOA >= 20: say(xx('port') <= xx('masthead') + 1e-6, 'sidelanternene ikke forut for den forre topplanterna (3(b), fra 20 m)')
    say(L['port'][1] > 0 and L['stbd'][1] < 0 and abs(L['port'][1] + L['stbd'][1]) < 1e-6, 'rød om babord, grønn om styrbord')

def volume(H):
    """the displaced volume under the waterline (m3), by sections (Simpson-ish trapezes)"""
    n = 120; vol = 0.0; prev = None
    for i in range(n + 1):
        u = i / n; zs = [H.zk(u) + (H.T - H.zk(u)) * k / 40 for k in range(41)] if H.T > H.zk(u) else []
        a = 0.0
        for k in range(len(zs) - 1): a += (H.hw(u, zs[k]) + H.hw(u, zs[k + 1])) * (zs[k + 1] - zs[k])
        x = H.x(u, H.T)
        if prev is not None: vol += (a + prev[1]) / 2 * (x - prev[0])
        prev = (x, a)
    return vol

# ---------- the double-ended car ferries' own parts (ferje34.py, ferje64.py, ferje112.py) ----------
def ramp(A, H, end, w, L, ang, z, m, fine=True):
    """a car ramp hinged at the end of the deck (end 0 aft, 1 forward), w wide, L long, raised ang degrees for sailing; its hinge at z"""
    x0 = 0.0 if end == 0 else H.L; s = -1 if end == 0 else 1; a = math.radians(ang)
    xt = x0 + s * L * math.cos(a); zt = z + L * math.sin(a); t = 0.25
    A.poly([(x0, -w / 2, z), (x0, w / 2, z), (xt, w / 2, zt), (xt, -w / 2, zt)], m, (-s * math.sin(a), 0, math.cos(a)))
    A.poly([(x0, -w / 2, z - t), (xt, -w / 2, zt - t), (xt, w / 2, zt - t), (x0, w / 2, z - t)], C['dark'], (s * math.sin(a), 0, -math.cos(a)))
    for yy, sg in ((-w / 2, -1), (w / 2, 1)):
        A.poly([(x0, yy, z - t), (xt, yy, zt - t), (xt, yy, zt), (x0, yy, z)], C['dark'], (0, sg, 0))
    A.poly([(xt, -w / 2, zt - t), (xt, -w / 2, zt), (xt, w / 2, zt), (xt, w / 2, zt - t)], C['dark'], (s, 0, 0))
    if fine:   # the ramp's hydraulic arms, one each side
        for yy in (-w / 2 - 0.15, w / 2 + 0.15):
            beam(A, (x0 - s * 0.3, yy, z + 0.2), (x0 + s * L * 0.55 * math.cos(a), yy, z + L * 0.55 * math.sin(a) + 0.1), 0.14, 0.14, C['steel'])

def lanes(A, x0, x1, ys, z, m, dash=3.0, gap=2.0):
    """the car deck's lane lines (dashed)"""
    for y in ys:
        x = x0
        while x < x1 - 0.5:
            xe = min(x1, x + dash); A.poly([(x, y - 0.06, z), (xe, y - 0.06, z), (xe, y + 0.06, z), (x, y + 0.06, z)], m, (0, 0, 1)); x = xe + gap

def tiny_glass(G):
    """the exporter wants a glass part; the ships' windows are opaque in the hull (an NPC is drawn without glass), so a pane inside"""
    A = Acc('glass'); A.poly([(0, -0.01, 0.5), (0.02, -0.01, 0.5), (0.02, 0.01, 0.5)], C['glass'], (0, 0, 1)); G.append(A.done())

def run(M):
    """the model's main: M is the script's module (H, T_ID, NAME, build(fine), anchors(), check(), shots)"""
    os.makedirs(OUT, exist_ok=True)
    ok = M.check()
    if 'check' in sys.argv: sys.exit(0 if ok else 1)
    if not ok: print('check() har feil')
    export = 'export' in sys.argv or 'dry' in sys.argv; dry = 'dry' in sys.argv
    reset(); MATS.clear(); colours(*M.COLOURS)
    solids, glass = M.build(True)
    join(solids, 'BOAT0'); join(glass, 'GLASS0')
    H = M.H
    if 'fast' not in sys.argv:
        shown = M.show_parts() if hasattr(M, 'show_parts') else []   # (the sails set, in the renders only)
        L, XM, T = H.L, H.L / 2, H.T
        beauty(OUT, M.T_ID, T, [('side', (XM, -2.6 * L, T + 4), (XM, 0, T + 4), 50), ('bow3q', (L * 1.25, -L * 0.8, T + L * 0.12), (XM, 0, T + 3), 50),
                                 ('stern3q', (-L * 0.35, L * 0.75, T + L * 0.16), (XM, 0, T + 3), 50)])
        for o in shown: bpy.data.objects.remove(o, do_unlink=True)
    if export:
        tg, tn = to_game_f(H)
        ex = {'frame': 'kystfiske: x starboard, y up from the waterline, z aft; metres', 'type': M.T_ID, 'name': M.NAME, 'len': H.L, 'beam': H.B, 'draft': H.T,
              'anchors': M.anchors()}
        more = M.more() if hasattr(M, 'more') else None   # (parts of their own: the sailing boat's sails set and furled, drawn by view3d drawSail)
        export_boat(lambda fine: M.build(fine), tg, tn, OUT, M.T_ID + '.glb', os.path.join(ROOT, 'src', 'data', M.T_ID + '.b64'), ex, side=None, dry=dry, more=more)
