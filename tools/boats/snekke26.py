"""The 26 ft fibreglass snekke (snekke), a 7.9 m coastal boat built in Blender after the pictures Jonas showed on 13.10.2026 (a classic
Norwegian 26 ft family snekke of the late 1970s and 80s, the Windy 26 in the pictures: 7.86 x 2.70 m). Jonas on the first try: «Elendig
modell. Her må du jobbe mer nøye». There are no drawings; the lines are read off the pictures and the game's numbers (7.9 x 2.7 m, 1.2 m
draft with the keel), checked against them in renders from the same angles:

    the hull     high-sided and round-bilged, moulded with the look of clinker planking: seven deep laps from the boot top to the band,
                 each lap's lower edge standing out; a strong sheer rising forward, the bow flared and full at the top with a raked,
                 rounded stem; the stern rounded in plan into a small transom, the laps running round it
    the band     a broad dark rubbing band a hand under the sheer, a white deck edge over it
    the cabin    a low trunk forward with near upright sides inset from the deck edge (narrow side decks), three windows a side with
                 rounded corners, a front rounded in plan and sloping to a short foredeck, a hatch on its cambered top
    the helm     a three-pane raked windscreen in a stainless frame, its wings bent back to the sides, a hard top over the helm on
                 the windscreen and two posts a side, side windows under it, a sliding hatch in it
    the rails    a pulpit round the bow carried aft along the side decks to the windscreen, a stern rail round the quarters

What I chose myself for her as a working boat in the game: the cockpit aft kept clear for gear (no seats or table), the helm on the
starboard side under the hard top, a small hydraulic hauler on the starboard coaming, a short mast on the hard top, a boarding ladder;
white with a navy band and red antifouling. Exterior only (CLAUDE.md); the model's name is only in comments and docs.

    pip install bpy==4.5.4
    python3 tools/boats/snekke26.py            -> src/data/boat-snekke26.b64 (+ the side picture), renders in tools/boats/out/
    python3 tools/boats/snekke26.py fast dry   -> no renders to look at, and the GLB only in tools/boats/out

Frame: x forward from the transom, y to port, z up from the base line; the waterline is z = 1.0."""
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy
from bpyutil import *

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE)); OUT = os.path.join(HERE, 'out')
WL = 1.0; XA = 0.0; XF = 7.9; XM = (XA + XF) / 2; HB = 1.35
ZC = 1.38                   # the cockpit sole, self-draining over the waterline
CX = 3.35                   # the cockpit's forward end, where the helm and the cabin begin
LAPS = 7                    # the moulded clinker laps between the boot top and the band
LAP = 0.026                 # how far each lap's lower edge stands out
BAND = (0.2, 0.045)         # the dark band: from this far under the sheer to this far under it


# ---------- lines (metres) ----------
# the keel (the bottom on the centre line) and the stem: it meets the waterline at 7.35 m and rises raked and rounded to the sheer
KEEL = [(XA, 0.62), (0.6, 0.38), (1.5, 0.15), (2.8, 0.06), (4.6, 0.06), (5.6, 0.16), (6.4, 0.36), (6.95, 0.62), (7.3, 0.92), (7.55, 1.25),
        (7.72, 1.6), (7.83, 1.98), (XF, 2.36)]
# the sheer: about a metre over the water aft, rising in a sweep to 1.36 m at the stem
SHEER = [(XA, 2.0), (1.0, 1.97), (2.5, 1.96), (4.0, 2.0), (5.5, 2.09), (6.6, 2.2), (7.4, 2.3), (XF, 2.36)]
# half-breadths at the sheer and on the waterline (the bow flares out over the water)
BS = [(XA, 1.24), (1.0, 1.3), (2.5, 1.35), (4.0, 1.35), (5.2, 1.3), (6.1, 1.16), (6.8, 0.92), (7.3, 0.62), (7.65, 0.32), (XF, 0.0)]
BW = [(XA, 1.12), (1.0, 1.2), (2.5, 1.26), (4.0, 1.25), (5.2, 1.12), (6.1, 0.86), (6.7, 0.52), (7.1, 0.24), (7.35, 0.0), (XF, 0.0)]
def z_keel(x): return interp(KEEL, x)
def z_sheer(x): return interp(SHEER, x)
def stern_round(x):
    """the stern rounded in plan: full from 0.8 m forward, drawn in to 62 % at the transom"""
    if x >= 0.8: return 1.0
    u = (0.8 - x) / 0.8; return 0.62 + 0.38 * math.sqrt(max(0.0, 1 - u * u))
def b_sheer(x): return interp(BS, x) * stern_round(x)
def b_wl(x): return interp(BW, x) * stern_round(x)

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
    """the section as (y, z) from the keel to the sheer: a soft garboard, a round bilge under the water, the topside flaring out to the
    sheer (straight up aft, out over the water forward)"""
    k = round(x, 4)
    if k in _CV: return _CV[k]
    zk, zs, Bs, Bw = z_keel(x), z_sheer(x), b_sheer(x), b_wl(x)
    if zk >= WL - 0.02:                           # forward of where the stem meets the water: a fine V flaring to the sheer
        P = [(0.0, zk), (Bs * 0.55, zk + (zs - zk) * 0.55), (Bs, zs)]
    else:
        zb = zk + (WL - zk) * 0.45
        P = [(0.0, zk), (Bw * 0.45, zk + (WL - zk) * 0.1), (Bw * 0.86, zb), (Bw, WL), (Bw + (Bs - Bw) * 0.55, WL + (zs - WL) * 0.55), (Bs, zs)]
    c = catmull(P, 12)
    mono = [c[0]]                                 # keep it rising, for the lookup by height
    for p in c[1:]:
        if p[1] > mono[-1][1] + 1e-5: mono.append((max(0.0, p[0]), p[1]))
    _CV[k] = mono; return mono

def y_at(x, z):
    c = curve(x)
    if z <= c[0][1]: return 0.0
    for a, b in zip(c, c[1:]):
        if a[1] <= z <= b[1]: t = (z - a[1]) / max(1e-9, b[1] - a[1]); return a[0] + (b[0] - a[0]) * t
    return c[-1][0]


# ---------- colours: white, a navy band, red antifouling ----------
C = {}
def colours():
    C['af'] = mat('antifouling', (0.55, 0.12, 0.08), 0.15)
    C['boot'] = mat('boot', (0.07, 0.09, 0.16), 0.45)
    C['hull'] = mat('snwhite', (0.94, 0.94, 0.92), 0.65, zone=1)
    C['band'] = mat('band', (0.09, 0.12, 0.22), 0.55)
    C['white'] = mat('house', (0.95, 0.95, 0.93), 0.55, zone=3)     # the trunk, the hard top and the mast: paint zone 3 (superstructure)
    C['inner'] = mat('inner', (0.88, 0.88, 0.85), 0.3)
    C['deck'] = mat('deck', (0.86, 0.86, 0.82), 0.12, zone=4)       # the side decks, the trunk top and the foredeck: paint zone 4
    C['lampR'] = mat('lampR', (0.85, 0.08, 0.06), 0.7); C['lampG'] = mat('lampG', (0.08, 0.75, 0.30), 0.7); C['lampW'] = mat('lampW', (0.95, 0.93, 0.85), 0.7)
    C['sole'] = mat('sole', (0.6, 0.44, 0.27), 0.2)
    C['teak'] = mat('teak', (0.58, 0.38, 0.2), 0.3)
    C['steel'] = mat('steel', (0.78, 0.8, 0.82), 0.85, metal=0.85)
    C['dark'] = mat('dark', (0.12, 0.13, 0.14), 0.25)
    C['black'] = mat('black', (0.04, 0.04, 0.05), 0.4)
    C['glass'] = mat('glass', (0.07, 0.1, 0.13), 0.95)
    C['prop'] = mat('bronze', (0.70, 0.52, 0.27), 0.8, metal=0.9)


# ---------- the hull with its moulded laps ----------
def levels(x, fine):
    """the heights of a section's points, how far each stands out (a lap's lower edge), and the material from it to the next: the
    bottom, the boot top, the laps, the white over them, the dark band, the white deck edge"""
    zk, zs = z_keel(x), z_sheer(x); cl = lambda z: min(zs, max(zk, z))
    nb = 9 if fine else 3; out = []
    zb = cl(WL + 0.05)
    for k in range(nb): u = k / nb; out.append((cl(zk + (zb - zk) * (1 - math.cos(u * math.pi / 2))), 0.0, 'af'))
    zt = cl(WL + 0.12); out.append((zb, 0.0, 'boot'))
    z1 = cl(zs - BAND[0] - 0.03)
    nl = LAPS if fine else 1
    for k in range(nl):
        za = zt + (z1 - zt) * k / nl; zz = zt + (z1 - zt) * (k + 1) / nl
        if fine:
            out.append((za, LAP, 'hull'))                      # the lap's lower edge, standing out
            out.append((za + (zz - za) * 0.35, LAP * 0.45, 'hull'))
            out.append((zz - 0.004, 0.0, 'hull'))             # tucked under the next lap
        else: out.append((za, 0.0, 'hull'))
    out.append((z1, 0.0, 'hull')); out.append((cl(zs - BAND[0]), 0.012, 'band')); out.append((cl(zs - BAND[1]), 0.012, 'hull'))
    out.append((zs, 0.0, None))
    return out

def hull_rows(sg, fine=True):
    xs = ([0.0, 0.03, 0.08, 0.15, 0.25, 0.38, 0.52, 0.68, 0.85] + [1.0 + 0.2 * i for i in range(31)] + [7.2 + 0.07 * i for i in range(10)]) if fine \
        else [0.0, 0.2, 0.6, 1.5, 3.5, 5.5, 6.6, 7.3, 7.7]
    xs = sorted(set(round(v, 4) for v in xs if v < XF - 0.015) | {XF - 0.015})
    rows, mats = [], None
    for x in xs:
        L = levels(x, fine); B = max(b_sheer(x), 1e-3)
        fade = 1.0 - max(0.0, min(1.0, (x - 6.6) / 1.1)) ** 1.5      # the laps run out smoothly into the stem
        rows.append([(x, sg * (y_at(x, z) + lap * fade * min(1.0, y_at(x, z) / B * 2)), z) for z, lap, _ in L])
        mats = [m for _, _, m in L]
    return rows, mats

def build_hull(fine=True):
    objs = []; first = {}
    for sg, nm in ((1, 'p'), (-1, 's')):
        rows, mats = hull_rows(sg, fine); first[sg] = rows[0]
        objs.append(grid('hull_' + nm, rows, lambda i, j, m=mats: C[m[j] or 'hull'], angle=22, out=lambda c: (0, c.y, min(c.z, 1.5) - 1.5)))
    T = [[q, p] for p, q in zip(first[1], first[-1])]
    objs.append(grid('transom', T, lambda i, j, m=mats: C[m[i] or 'hull'], angle=20, out=lambda c: (-1, 0, 0)))
    return objs


# ---------- the cockpit, the side decks, the cabin trunk and the foredeck ----------
CXF = 6.25                  # where the cabin's sides end; its front rounds forward of it to CXN
CXN = 6.75
ZCT = 2.56                  # the cabin top at its sides (cambered 6 cm higher on the centre line)

def cabin_w(x):
    """the cabin's half width: 0.98 aft, narrowing forward, and rounded in plan between CXF and CXN"""
    if x <= CXF: return 0.98 - 0.16 * max(0.0, (x - 4.6) / (CXF - 4.6)) ** 1.6
    u = (x - CXF) / (CXN - CXF); return 0.82 * math.sqrt(max(0.0, 1 - u * u))

def deck_edge(x): return b_sheer(x) - 0.035

def decks(fine=True):
    A = Acc('decks'); G = Acc('glass'); step = 0.2 if fine else 0.8
    # the cockpit: the sole, the inside of the sides up to the sheer, a teak cap on the coaming
    xs = sorted(set([XA + 0.06] + [XA + 0.06 + step * k for k in range(int(CX / step) + 1) if XA + 0.06 + step * k < CX] + [CX]))
    for x0, x1 in zip(xs, xs[1:]):
        ya, yb = y_at(x0, ZC) - 0.05, y_at(x1, ZC) - 0.05
        A.poly([(x0, -ya, ZC), (x1, -yb, ZC), (x1, yb, ZC), (x0, ya, ZC)], C['sole'], (0, 0, 1))
        sa, sb = z_sheer(x0), z_sheer(x1); ea, eb = deck_edge(x0) - 0.09, deck_edge(x1) - 0.09
        for sg in (1, -1):
            A.poly([(x0, sg * ya, ZC), (x1, sg * yb, ZC), (x1, sg * eb, sb), (x0, sg * ea, sa)], C['inner'], (0, -sg, 0))
            A.poly([(x0, sg * ea, sa), (x1, sg * eb, sb), (x1, sg * (eb + 0.13), sb + 0.01), (x0, sg * (ea + 0.13), sa + 0.01)], C['teak'], (0, 0, 1))
    y = y_at(XA + 0.06, ZC) - 0.05; e = deck_edge(XA + 0.06) - 0.09
    A.poly([(XA + 0.06, -y, ZC), (XA + 0.06, y, ZC), (XA + 0.06, e, z_sheer(XA)), (XA + 0.06, -e, z_sheer(XA))], C['inner'], (1, 0, 0))
    A.poly([(XA + 0.06, -e, z_sheer(XA)), (XA + 0.06, e, z_sheer(XA)), (XA, e + 0.1, z_sheer(XA) + 0.01), (XA, -e - 0.1, z_sheer(XA) + 0.01)], C['teak'], (0, 0, 1))
    # the cockpit's forward end: a step up under the helm to the bridge deck at the sheer
    w0 = deck_edge(CX)
    A.poly([(CX, -y_at(CX, ZC) + 0.05, ZC), (CX, y_at(CX, ZC) - 0.05, ZC), (CX, w0 - 0.09, z_sheer(CX)), (CX, -w0 + 0.09, z_sheer(CX))], C['inner'], (-1, 0, 0))
    # forward of the cockpit: the helm's floor (the bridge deck), the side decks, the cabin trunk, the foredeck; all at the sheer
    xs = sorted(set([CX] + [CX + step * k for k in range(1, int((XF - CX) / step) + 1) if CX + step * k < XF - 0.1] + [3.75, CXF, CXN, XF - 0.04]
                    + ([CXF + (CXN - CXF) * k / 6 for k in range(1, 6)] if fine else [])))
    for x0, x1 in zip(xs, xs[1:]):
        sa, sb = z_sheer(x0), z_sheer(x1); ea, eb = deck_edge(x0), deck_edge(x1)
        if x1 <= 3.75 + 1e-6:                   # the helm: open floor between the coamings, under the hard top
            A.poly([(x0, -ea, sa), (x1, -eb, sb), (x1, eb, sb), (x0, ea, sa)], C['sole'], (0, 0, 1))
            continue
        wa, wb = cabin_w(x0), cabin_w(x1)
        if wa < 0.02 and wb < 0.02:
            A.poly([(x0, -ea, sa), (x1, -eb, sb), (x1, eb, sb), (x0, ea, sa)], C['deck'], (0, 0, 1)); continue
        ta, tb = ZCT + (0.0 if x0 <= CXF else -0.12 * ((x0 - CXF) / (CXN - CXF)) ** 2), ZCT + (0.0 if x1 <= CXF else -0.12 * ((x1 - CXF) / (CXN - CXF)) ** 2)
        for sg in (1, -1):
            A.poly([(x0, sg * wa, sa), (x1, sg * wb, sb), (x1, sg * eb, sb), (x0, sg * ea, sa)], C['deck'], (0, 0, 1))
            # the trunk's side, leaning in 4 cm; forward of CXF it rounds in plan and slopes back
            A.poly([(x0, sg * wa, sa), (x1, sg * wb, sb), (x1, sg * max(0.0, wb - 0.04), tb), (x0, sg * max(0.0, wa - 0.04), ta)], C['white'], (0, sg, 0.1 if x0 < CXF else 0.6))
            A.poly([(x0, sg * max(0.0, wa - 0.04), ta), (x1, sg * max(0.0, wb - 0.04), tb), (x1, 0, tb + 0.06), (x0, 0, ta + 0.06)], C['deck'], (0, 0, 1))
        if wb < 0.02 <= wa:                     # closing the deck forward of the trunk's nose
            pass
    # the trunk's aft end under the windscreen: the companionway into the cabin
    wt = cabin_w(3.75) - 0.04
    A.poly([(3.75, -cabin_w(3.75), z_sheer(3.75)), (3.75, cabin_w(3.75), z_sheer(3.75)), (3.75, wt, ZCT), (3.75, -wt, ZCT)], C['white'], (-1, 0, 0))
    A.poly([(3.745, 0.05, z_sheer(3.75) + 0.02), (3.745, 0.6, z_sheer(3.75) + 0.02), (3.745, 0.6, ZCT - 0.04), (3.745, 0.05, ZCT - 0.04)], C['teak'], (-1, 0, 0))
    # three windows a side with rounded corners, in a black rim, on the trunk's leaning face
    def wy(x, z): return cabin_w(x) - 0.04 * (z - z_sheer(x)) / (ZCT - z_sheer(x))
    def win(x0, x1, z0, z1, r, n=3):
        pts = []
        for cx, cz, a0 in ((x1 - r, z0 + r, -90), (x1 - r, z1 - r, 0), (x0 + r, z1 - r, 90), (x0 + r, z0 + r, 180)):
            for k in range(n + 1): a = math.radians(a0 + 90 * k / n); pts.append((cx + r * math.cos(a), cz + r * math.sin(a)))
        return pts
    for sg in (1, -1):
        for xa, xb in ((3.95, 4.62), (4.78, 5.45), (5.6, 6.08)):
            z0 = max(z_sheer(xa), z_sheer(xb)) + 0.12; z1 = ZCT - 0.08
            rim = win(xa - 0.025, xb + 0.025, z0 - 0.025, z1 + 0.025, 0.07)
            A.poly([(x, sg * (wy(x, z) + 0.004), z) for x, z in rim], C['black'], (0, sg, 0))
            G.poly([(x, sg * (wy(x, z) + 0.008), z) for x, z in win(xa, xb, z0, z1, 0.05)], C['glass'], (0, sg, 0))
    # the forward hatch on the trunk, two small windows in its nose
    abox(A, 5.55, 6.05, -0.28, 0.28, ZCT + 0.04, ZCT + 0.1, C['white'])
    A.poly([(5.6, -0.23, ZCT + 0.101), (6.0, -0.23, ZCT + 0.101), (6.0, 0.23, ZCT + 0.101), (5.6, 0.23, ZCT + 0.101)], C['glass'], (0, 0, 1))
    return [A.done(28)], [G.done(28)]


# ---------- the lanterns (Sjøveisreglene rules 21–23; docs/batplan.md del 11): the side lights in black housings on the trunk's sides
# just abaft the forward window post, screened inboard; the stern light on the flag staff ----------
LAMP_X = 4.70                       # the side lights' station, in the gap between the first and second window

def lamp_z(): return ZCT - 0.17

def lantern_geo(A):
    z = lamp_z()
    for side, glass in ((1, 'lampR'), (-1, 'lampG')):                                  # port red, starboard green (y to port)
        y = side * (cabin_w(LAMP_X) - 0.04 * (z - z_sheer(LAMP_X)) / (ZCT - z_sheer(LAMP_X)))   # on the leaning face of the trunk
        abox(A, LAMP_X - 0.05, LAMP_X + 0.05, min(y, y + side * 0.07), max(y, y + side * 0.07), z - 0.07, z + 0.07, C["black"])       # the housing
        abox(A, LAMP_X - 0.05, LAMP_X + 0.05, min(y + side * 0.07, y + side * 0.085), max(y + side * 0.07, y + side * 0.085), z - 0.045, z + 0.045, C[glass])   # the glass, outboard
        abox(A, LAMP_X - 0.07, LAMP_X + 0.07, min(y - side * 0.005, y + side * 0.09), max(y - side * 0.005, y + side * 0.09), z + 0.07, z + 0.085, C['black'])   # the cap
    # the stern light on the flag staff's head, a white lantern in a dark cap
    sx, sy, zt = -0.08, -0.5, z_sheer(0) + 0.85
    acyl(A, (sx, sy, zt - 0.1), (sx, sy, zt + 0.02), 0.03, lambda zz: C['lampW'], seg=8)
    acyl(A, (sx, sy, zt + 0.02), (sx, sy, zt + 0.04), 0.036, lambda zz: C['dark'], seg=8)

def lantern_anchors(G):
    z = lamp_z(); y = lambda side: side * (cabin_w(LAMP_X) - 0.04 * (z - z_sheer(LAMP_X)) / (ZCT - z_sheer(LAMP_X)) + 0.1)
    return [[G(3.12, 0, HTZ + 1.1), [1, 0.95, 0.85], 'allround'], [G(LAMP_X, y(1), z), [1, 0.12, 0.1], 'port'], [G(LAMP_X, y(-1), z), [0.1, 1, 0.35], 'stbd'],
            [G(-0.08, -0.5, z_sheer(0) + 0.81), [1, 0.95, 0.85], 'stern']]


# ---------- the windscreen and the hard top over the helm ----------
WSX, WSZ = 3.95, ZCT + 0.04         # the windscreen's foot, on the trunk top
HT0, HT1, HTZ = 2.25, 3.55, 3.36    # the hard top from aft to forward, its underside

def helm(fine=True):
    A = Acc('helm'); G = Acc('glass'); w = C['white']; s = lambda z: C['steel']
    wf = cabin_w(WSX) - 0.08; wt = 1.02
    # three panes: the middle one square to the boat, the wings bent back to the sides; raked about 30 degrees
    foot = [(WSX - 0.32, -wf), (WSX, -wf * 0.5), (WSX, wf * 0.5), (WSX - 0.32, wf)]
    head = [(HT1 - 0.18, -wt), (HT1, -wt * 0.5), (HT1, wt * 0.5), (HT1 - 0.18, wt)]
    for i in range(3):
        (a0, a1), (b0, b1) = foot[i], foot[i + 1]; (c0, c1), (d0, d1) = head[i], head[i + 1]
        G.poly([(a0, a1, WSZ), (b0, b1, WSZ), (d0, d1, HTZ), (c0, c1, HTZ)], C['glass'], (1, 0, 0.6))
    for (a0, a1), (c0, c1) in zip(foot, head): acyl(A, (a0, a1, WSZ), (c0, c1, HTZ), 0.022, s, seg=6)
    for P in (foot, head):
        zz = WSZ if P is foot else HTZ - 0.01
        for (a0, a1), (b0, b1) in zip(P, P[1:]): acyl(A, (a0, a1, zz), (b0, b1, zz), 0.02, s, seg=6, cap=False)
    # the wings' foot meets the trunk; a side window each side under the hard top, from the wing aft to the forward post, over the coaming
    for sg in (1, -1):
        xa, ya = foot[3 if sg > 0 else 0]; xh, yh = head[3 if sg > 0 else 0]
        xp = HT1 - 0.62; yp = sg * (deck_edge(xp) - 0.07); zc = z_sheer(xp) + 0.42
        G.poly([(xa, ya, WSZ), (xh, yh, HTZ), (xp, sg * wt, HTZ), (xp, yp, zc), (CX + 0.05, sg * (deck_edge(CX) - 0.07), zc)], C['glass'], (0, sg, 0))
        A.poly([(xa, ya, WSZ), (CX + 0.05, sg * (deck_edge(CX) - 0.07), zc), (CX + 0.05, sg * (deck_edge(CX) - 0.07), z_sheer(CX)), (xa, sg * cabin_w(xa), z_sheer(xa))], w, (0, sg, 0))
        acyl(A, (xp, yp, z_sheer(xp)), (xp, sg * wt, HTZ), 0.022, s, seg=6)
        acyl(A, (CX + 0.05, sg * (deck_edge(CX) - 0.07), zc), (xp, yp, zc), 0.016, s, seg=5)
        acyl(A, (HT0 + 0.1, sg * (deck_edge(HT0) - 0.07), z_sheer(HT0)), (HT0 + 0.1, sg * wt, HTZ), 0.026, s, seg=6)
    # the hard top: a moulded lid with a rounded lip, a sliding hatch
    n = 7; ro = []
    for cx, cy, a0 in ((HT1 - 0.15, -wt + 0.15, -90), (HT1 - 0.15, wt - 0.15, 0), (HT0 + 0.15, wt - 0.15, 90), (HT0 + 0.15, -wt + 0.15, 180)):
        for k in range(n + 1): a = math.radians(a0 + 90 * k / n); ro.append((cx + 0.21 * math.cos(a), cy + 0.21 * math.sin(a)))
    A.poly([(x, y, HTZ) for x, y in ro], C['inner'], (0, 0, -1))
    A.poly([(x, y, HTZ + 0.1) for x, y in ro], w, (0, 0, 1))
    for i in range(len(ro)):
        a, b = ro[i], ro[(i + 1) % len(ro)]; A.poly([(a[0], a[1], HTZ), (b[0], b[1], HTZ), (b[0], b[1], HTZ + 0.1), (a[0], a[1], HTZ + 0.1)], w, (b[1] - a[1], -(b[0] - a[0]), 0))
    abox(A, 2.55, 3.2, -0.36, 0.36, HTZ + 0.1, HTZ + 0.13, C['dark'])
    # the helm on the starboard side: a console with the wheel, the throttle, the plotter; the helmsman's seat on a pedestal
    zb = z_sheer(3.5)
    abox(A, 3.5, 3.72, -0.92, -0.3, zb, zb + 0.82, C['inner'])
    A.poly([(3.5, -0.88, zb + 0.84), (3.62, -0.88, zb + 1.02), (3.62, -0.42, zb + 1.02), (3.5, -0.42, zb + 0.84)], C['black'], (-1, 0, 0.6))
    abox(A, 3.48, 3.5, -0.85, -0.35, zb + 0.3, zb + 0.7, C['teak'])
    acyl(A, (3.42, -0.75, zb + 0.6), (3.5, -0.75, zb + 0.66), 0.025, s, seg=6)
    acyl(A, (2.95, -0.62, z_sheer(2.95) - 0.6 + 0.6), (2.95, -0.62, z_sheer(2.95) + 0.12), 0.05, s, seg=8)
    abox(A, 2.75, 3.15, -0.84, -0.4, z_sheer(2.95) + 0.12, z_sheer(2.95) + 0.22, C['inner'])
    abox(A, 2.75, 2.82, -0.84, -0.4, z_sheer(2.95) + 0.22, z_sheer(2.95) + 0.62, C['inner'])
    abox(A, 3.52, 3.6, 0.0, 0.12, zb + 0.7, zb + 0.82, C['dark'])
    # the mast on the hard top with its cross-tree and the masthead light, the VHF whip
    acyl(A, (3.2, 0.0, HTZ + 0.1), (3.12, 0.0, HTZ + 1.05), 0.03, lambda z: w, seg=8)
    abox(A, 3.11, 3.19, -0.22, 0.22, HTZ + 0.72, HTZ + 0.75, w)
    acyl(A, (3.12, 0.0, HTZ + 1.05), (3.12, 0.0, HTZ + 1.13), 0.035, lambda z: C['lampW'], seg=8)      # the all-round white light (rule 23 d, under 12 m)
    acyl(A, (3.12, 0.0, HTZ + 1.13), (3.12, 0.0, HTZ + 1.15), 0.04, lambda z: C['dark'], seg=8)
    acyl(A, (2.45, -0.8, HTZ + 0.1), (2.45, -0.8, HTZ + 1.6), 0.01, lambda z: w, seg=4)
    lantern_geo(A)
    out = [A.done(30)]
    if fine: out.append(torus('wheel', (3.38, -0.62, zb + 0.66), (1, 0, 0.45), 0.17, 0.016, C['steel'], seg=18, rseg=6))
    return out, [G.done(30)]


# ---------- rails, the hauler, the ladder; the keel, the rudder and the propeller ----------
def fittings(fine=True):
    A = Acc('fit'); s = lambda z: C['steel']; h = 0.6
    if fine:
        # the pulpit round the bow, carried aft along the side decks to the windscreen
        xs = [3.95 + (XF - 0.07 - 3.95) * k / 16 for k in range(17)]
        for sg in (1, -1):
            pts = [(x, sg * max(0.02, deck_edge(x) - 0.05), z_sheer(x)) for x in xs]
            for p in pts[::2]: acyl(A, p, (p[0], p[1], p[2] + h), 0.016, s, seg=5)
            for a, b in zip(pts, pts[1:]): acyl(A, (a[0], a[1], a[2] + h), (b[0], b[1], b[2] + h), 0.018, s, seg=5, cap=False)
            for a, b in zip(pts[8:], pts[9:]): acyl(A, (a[0], a[1], a[2] + h * 0.5), (b[0], b[1], b[2] + h * 0.5), 0.012, s, seg=4, cap=False)
            acyl(A, (4.3, sg * (cabin_w(4.3) - 0.12), ZCT + 0.02), (5.9, sg * (cabin_w(5.9) - 0.12), ZCT + 0.02), 0.014, s, seg=5)
        # the stern rail round the quarters, open aft over the ladder
        for sg in (1, -1):
            st = [(1.3, sg * (deck_edge(1.3) - 0.06)), (0.6, sg * (deck_edge(0.6) - 0.06)), (0.18, sg * (deck_edge(0.18) - 0.08)), (0.05, sg * (deck_edge(0.05) - 0.28))]
            pts = [(x, y, z_sheer(x) + 0.01) for x, y in st]
            for p in pts: acyl(A, p, (p[0], p[1], p[2] + 0.66), 0.018, s, seg=5)
            for a, b in zip(pts, pts[1:]): acyl(A, (a[0], a[1], a[2] + 0.66), (b[0], b[1], b[2] + 0.66), 0.02, s, seg=5, cap=False)
            for a, b in zip(pts, pts[1:]): acyl(A, (a[0], a[1], a[2] + 0.33), (b[0], b[1], b[2] + 0.33), 0.012, s, seg=4, cap=False)
        # the boarding ladder on the transom, to port, and the flag staff to starboard
        yl = (0.1, 0.36)
        for y in yl: acyl(A, (-0.02, y, z_sheer(0) + 0.35), (-0.02, y, z_sheer(0)), 0.016, s, seg=5); acyl(A, (-0.02, y, z_sheer(0)), (-0.06, y, WL - 0.45), 0.016, s, seg=5)
        for k in range(5):
            z = WL - 0.35 + 0.22 * k; xx = -0.06 + 0.04 * (z - WL + 0.45) / (z_sheer(0) - WL + 0.45)
            acyl(A, (xx, yl[0], z), (xx, yl[1], z), 0.014, s, seg=4)
        acyl(A, (-0.02, -0.5, z_sheer(0) - 0.15), (-0.08, -0.5, z_sheer(0) + 0.85), 0.012, lambda z: C['teak'], seg=5)
        for z in (z_sheer(0) - 0.12, z_sheer(0) + 0.05): abox(A, -0.05, 0.0, -0.53, -0.47, z, z + 0.04, C['steel'])
        # cleats, the bow roller with its anchor
        for x, sg in ((0.35, 1), (0.35, -1), (3.3, 1), (3.3, -1), (7.35, 1), (7.35, -1)):
            y = sg * (deck_edge(x) - 0.12); abox(A, x - 0.09, x + 0.09, y - 0.018, y + 0.018, z_sheer(x) + 0.012, z_sheer(x) + 0.055, C['steel'])
        abox(A, 7.55, 7.96, -0.06, 0.06, z_sheer(7.75) - 0.02, z_sheer(7.75) + 0.06, C['steel'])
        acyl(A, (7.93, -0.04, z_sheer(7.75) + 0.02), (7.93, 0.04, z_sheer(7.75) + 0.02), 0.035, lambda z: C['dark'], seg=10)
    # no hauler in the model (Jonas 18.10.2026: no boat carries modelled gear): the one the player buys is drawn at the hauler anchor on the coaming
    objs = [A.done(30)]
    # the keel, the propeller on its shaft, the rudder behind it
    zk = lambda x: z_keel(x) + 0.05
    xs = [1.0 + (5.3 - 1.0) * k / 12 for k in range(13)]
    def kb(x): return -0.2 + 0.32 * max(0.0, (x - 4.2) / 1.1) ** 2 + 0.3 * max(0.0, (1.5 - x) / 0.5) ** 1.5
    top = [(x, zk(x)) for x in xs]; bot = [(x, kb(x)) for x in reversed(xs)]
    objs.append(loft_rings('keel', [[(x, sy * 0.075, z) for x, z in top + bot] for sy in (1, -1)], C['af']))
    zc = 0.22
    objs.append(cyl('shaft', (0.5, 0, zc), (1.1, 0, zc + 0.05), 0.025, C['steel'], 8))
    objs.append(cyl('hub', (0.42, 0, zc), (0.6, 0, zc), 0.06, C['prop'], 10, r1=0.045))
    for k in range(3):
        a = 2 * math.pi * k / 3 + 0.3; e = (0, math.cos(a), math.sin(a)); t = (0, -math.sin(a), math.cos(a))
        bl = [(0.51 + 0.05 * f, (0.05 + 0.2 * r) * e[1] + t[1] * w_, zc + (0.05 + 0.2 * r) * e[2] + t[2] * w_)
              for r, w_, f in ((0, -0.05, 0), (0.5, -0.08, 0.4), (1.0, -0.05, 1.0), (1.0, 0.05, 1.0), (0.5, 0.07, -0.4), (0, 0.05, 0))]
        objs.append(loft_rings('blade%d' % k, [[(p[0] - 0.012, p[1], p[2]) for p in bl], [(p[0] + 0.012, p[1], p[2]) for p in bl]], C['prop']))
    rud = [(0.28, z_keel(0.2) + 0.02), (-0.02, z_keel(0.02) + 0.02), (-0.06, zc - 0.27), (0.28, zc - 0.27)]
    wr = lambda x: 0.035 * max(0.4, 1 - abs(x - 0.12) / 0.2)
    objs.append(loft_rings('rudder', [[(x, wr(x), z) for x, z in rud], [(x, -wr(x), z) for x, z in rud]], C['af']))
    return [o for o in objs if o]


def build(fine=True):
    d, dg = decks(fine); hh, hg = helm(fine)
    solids = build_hull(fine) + d + hh + fittings(fine)
    return [s for s in solids if s], [x for x in dg + hg if x]


def to_game(p): return (-p[1], p[2] - WL, -(p[0] - XM))
def to_game_n(n): return (-n[1], n[2], -n[0])

def name_strips(G):
    """where the name is written (vessel3d.js nameStrips): a strip on each bow under the band, a hand aft of the stem, and one across the
    transom over the boot top (the name and home port belong on the stern as well; the game writes the name there)"""
    out = []; zt = lambda x: z_sheer(x) - BAND[0] - 0.08
    for sg, xs in ((1, [6.35 - 1.05 * k / 12 for k in range(13)]), (-1, [5.3 + 1.05 * k / 12 for k in range(13)])):
        B = []; T = []
        for x in xs:
            for arr, dz in ((B, 0.27), (T, 0.0)):
                z = zt(x) - dz; arr.append(G(x, sg * (y_at(x, z) + 0.03), z))
        out.append([B, T])
    # the transom: from starboard to port seen from astern, on the flat of the transom under the band
    zb, zt0 = z_sheer(XA) - 0.62, z_sheer(XA) - 0.36; ys = [0.62 - 1.24 * k / 12 for k in range(13)]      # port to starboard: left to right seen from astern
    out.append([[G(XA - 0.02, y, zb) for y in ys], [G(XA - 0.02, y, zt0) for y in ys]])
    return out

def kit_places(G):
    """the places where the game sets the deck kit (tools/deck; the user's wish 19.10.2026: nothing that can be bought is modelled in,
    only its place): the liferaft in its cradle on the starboard side of the hard top, the canister along the boat beside the sliding
    hatch; the ring buoys on the stern rail's side runs, facing out (the first, with the light and the line, to starboard); the radome on
    the port side of the hard top abreast of the mast. The cockpit is small: the default gutting table (port) and bleeding tub
    (starboard aft) of the game stand in its after half, the helm seat to starboard forward and the walk to the cabin door forward
    in the middle, so the catch tub (one 300 l) stands aft on the centre line between them; the net tub stands forward to port,
    the eight line tubs across the forward end (low enough to go under the helm seat), and the freight pallet forward to port
    (the net tub, the line tubs and the freight share the forward end: the net and the line rig never stand together)"""
    r = lambda a: round(a, 3); zt = HTZ + 0.1
    yr = lambda x: deck_edge(x) - 0.06                                        # the stern rail's side run (fittings)
    xb = 0.95; zb = (z_sheer(1.3) + z_sheer(0.6)) / 2 + 0.67; yb = (yr(1.3) + yr(0.6)) / 2 + 0.02
    a = math.atan2(yr(1.3) - yr(0.6), 0.7)                                   # the run's angle in plan, the bracket square to it
    return {'raft': [G(2.95, -0.70, zt) + [r(math.pi / 2)]],
            'buoys': [G(xb, -yb, zb) + [r(math.pi / 2 - a)], G(xb, yb, zb) + [r(-(math.pi / 2 - a))]],
            'radar': G(2.9, 0.72, zt),
            'tubs': [G(0.62, 0.05, ZC) + [0.0, 300]],
            'garn': {'at': G(2.74, 0.62, ZC), 'ry': 0.0},
            'stamps': {'at': G(2.53, 0.92, ZC), 'ry': r(math.pi / 2)},
            'cargo': [G(2.73, 0.58, ZC) + [0.0]]}

def anchors():
    G = lambda x, y, z: [round(v, 3) for v in to_game((x, y, z))]
    hx = 2.0; hy = -(deck_edge(hx) - 0.12); zb = z_sheer(3.5)
    return {'eye': G(3.0, -0.62, zb + 1.22), 'skipperAt': G(3.0, -0.62, zb), 'hp': -0.1, 'fov': 62,
            'crewSpots': [G(1.6, -0.75, ZC) + [1.57], G(1.0, 0.6, ZC) + [0.0], G(0.6, -0.4, ZC) + [3.14]],
            'lights': lantern_anchors(G),
            # the companionway door in the trunk's aft end (the real door into the cabin), its sill on the bridge deck; the crew go in here
            'doors': [{'at': G(3.75, 0.33, z_sheer(3.75)), 'w': 0.55, 'h': round(ZCT - 0.04 - z_sheer(3.75), 2), 'in': G(4.4, 0.33, z_sheer(3.75) - 0.4), 'to': 'cabin'}],
            'names': name_strips(G),
            # the open cockpit aft: the hauler on the starboard coaming, the gear in the cockpit
            'deck': {'y': round(ZC - WL, 3), 'z': round(-(1.4 - XM), 3)}, 'gw': round(z_sheer(1.5) - WL, 3),
            'stern': round(XM - XA, 3), 'bow': round(-(XF - XM), 3), 'side': HB, 'beam': 2.7, 'pl': 2.6, 'rl': 1.2, 'open': True, 'hand': False,
            'pole': G(-0.08, -0.5, z_sheer(0) + 0.85), 'hauler': G(hx, hy, z_sheer(hx) + 0.42), 'filler': G(3.2, HB, z_sheer(3.2) + 0.2),
            'kit': kit_places(G)}


# the renders: from the same angles as Jonas' pictures (bow quarter from port, low; stern quarter; broadside; the cockpit from above)
SHOTS = [('bow3q', (14.5, 7.5, 3.0), (3.9, 0, 1.9), 40), ('stern3q', (-6.0, 6.5, 3.6), (3.4, 0, 1.9), 35), ('side', (3.9, 16, 2.0), (3.9, 0, 1.9), 35),
         ('above', (9.0, -6.0, 8.0), (3.5, 0, 1.6), 35), ('cockpit', (-2.2, -2.6, 4.2), (2.4, 0, 1.6), 35), ('bow', (13.0, -2.5, 2.4), (4.0, 0, 2.0), 40)]

def main():
    os.makedirs(OUT, exist_ok=True)
    reset(); colours()
    solids, glass = build(True)
    join(solids, 'BOAT0'); join(glass, 'GLASS0')
    if 'fast' not in sys.argv: beauty(OUT, 'sn26', WL, SHOTS)
    ex = {'frame': 'kystfiske: x starboard, y up from the waterline, z aft; metres', 'type': 'snekke', 'name': '26 ft fibreglass snekke',
          'len': 7.9, 'beam': 2.7, 'draft': 1.2, 'anchors': anchors()}
    export_boat(build, to_game, to_game_n, OUT, 'snekke26.glb', os.path.join(ROOT, 'src', 'data', 'boat-snekke26.b64'), ex,
                side=(os.path.join(ROOT, 'src', 'data', 'boat-snekke26-side.b64'), 3.9, 1.8, 9.5), dry='dry' in sys.argv)


if __name__ == '__main__':
    main()
