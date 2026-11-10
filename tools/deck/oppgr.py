"""The upgrades one can see on deck (OPP5 of docs/planer/oppgraderinger.md, 10.11.2026): the knife and the gaff in their second and
third tiers, the line setter with its tub magazine, and the net chute. Built in Blender, all parts in one GLB (deck-upg). The first
tiers are the knife and the gaff the boat has from before (tools/deck/fisk.py kniv, hott). No maker's name or mark on anything; every
measure is our own, from ordinary kit of the kind (no maker's drawing).

    kniv2       «nye sløyekniver» (EQUIP.kniv tier 2): a new gutting knife with a bright yellow moulded handle, a black guard and butt,
                and a 15.5 cm stainless blade. The same origin and lie as fisk.py's kniv (the handle's middle, the blade along the
                game's -z, the edge down), so every pose that holds the old one holds this
    kniv3       «sløyekniver i ett stykke» (tier 3): a knife forged in one piece of stainless steel, the hollow handle with turned
                grooves and no joint to the blade (nothing for the blood to sit in). The steel glove of the tier is the left hand's
                own mesh drawn in steel by the game (view3d/09-landing-deck.js), not a part here
    hott2       «stålhøtt» (EQUIP.hott tier 2): a gaff of the same length as the old one (0.90 m) with a stainless tube for a shaft, a
                ribbed black rubber grip and a welded steel hook. The same origin (the grip, 0.25 m from the butt) and the hook the
                same place as fisk.py's hott
    hott3       «lang høtt med krok av stål» (tier 3): a long gaff, 1.45 m: an ash shaft that runs 0.80 m back from the grip, an
                orange band at the grip, a lanyard through the butt, a long steel socket and a heavier steel hook with a wider gape
    setter      the line setter (EQUIP.linesetter): a stainless chute over the stern the line runs out through. A saddle plate that
                lies on the rail's top with a flange down its outside and two bolts, two posts and a cradle strap, the chute itself
                (a half pipe 0.26 m wide inside, 1.0 m long, sloping down aft, with a bell mouth inboard where the line comes up
                from the tub), a stay from the flange to the chute's underside, and at the aft end a white roller the line runs over
                and a hoop that keeps it in. Origin: the middle of the rail's top at its outer (aft) edge; the game's +z out over
                the sea
    setter_mag  the tub magazine (EQUIP.linesetterLv tier 2), drawn with the setter: a roller rack inside the bulwark that holds two
                tubs in a row and lets the next one slide to the chute's mouth: two side rails with rollers between, a low guide on
                each side, a stop at each end, and two flat hangers up to the setter's saddle plate. Its inboard end stands on the
                legs below. The same origin as the setter
    setter_ben  the magazine's two legs with a cross stay: one unit (1 m) long down from the rack's inboard end, scaled by the game
                to the deck under it (extras mag.leg: where its top is). The same origin as the setter
    renne       the net chute (EQUIP.garnrenne): a wide aluminium chute over the stern the nets run out through, 0.67 m wide inside
                at the stern and 0.88 m at its mouth (1.0 m over all), 1.1 m long, sloping down aft, its sides 0.2 m high and flared, a rolled
                stainless lip at each end so nothing catches, on two saddle plates with flanges and two stays. The same origin as
                the setter's

Extras (the game's frame of the part): hott_butt = how far behind the grip each tier's butt is, hott_hook = how far ahead of the grip
the hook's bend is and how far it drops (the same for all three, the old one too), setter = {half (half width over all), mouth (the
bell mouth's middle), lip (where the line leaves it), in (how far inboard of the rail's outer edge it reaches)}, mag = {leg (the
legs' top), len, half, top (the rollers' top at the chute's end)}, renne = {half, in, lip}.

    python3.11 -m pip install bpy==4.5.4
    python3.11 tools/deck/oppgr.py          -> src/data/deck-upg.b64, renders tools/deck/out/oppgr_*.png
    python3.11 tools/deck/oppgr.py fast     -> without the renders

Frames. Here in Blender: x to the right, y forward (inboard for the things on the stern rail), z up. The game's: x right, y up, z aft;
to_game(p) = (x, z, -y)."""
import os, sys, math, base64
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))
sys.path.insert(0, os.path.join(ROOT, 'tools', 'boats')); sys.path.insert(0, HERE)
import bpy, bmesh
from mathutils import Vector
from bpyutil import *
from fisk import loft, ttube, catmull, rr_ring, even_side, add_tint, smooth01, to_game, to_game_n, G

OUT = os.path.join(HERE, 'out')
FAST = 'fast' in sys.argv

C = {}
def colours():
    C['pine'] = mat('pine', (0.86, 0.70, 0.47), 0.3)
    C['ash'] = mat('ash', (0.78, 0.66, 0.46), 0.35)
    C['galv'] = mat('galv', (0.62, 0.64, 0.66), 0.5, metal=0.7)
    C['hook'] = mat('hook', (0.66, 0.68, 0.70), 0.75, metal=0.9)
    C['blade'] = mat('blade', (0.78, 0.80, 0.82), 0.85, metal=0.9)
    C['bevel'] = mat('bevel', (0.90, 0.91, 0.92), 0.9, metal=0.9)
    C['black'] = mat('black', (0.055, 0.055, 0.06), 0.3)
    C['yellow'] = mat('yellow', (0.93, 0.74, 0.08), 0.4)
    C['orange'] = mat('orange', (0.92, 0.36, 0.10), 0.3)
    C['stain'] = mat('stain', (0.72, 0.74, 0.76), 0.7, metal=0.85)
    C['stain2'] = mat('stain2', (0.60, 0.62, 0.64), 0.55, metal=0.8)
    C['alu'] = mat('alu', (0.76, 0.78, 0.80), 0.5, metal=0.75)
    C['pe'] = mat('pe', (0.90, 0.90, 0.88), 0.3)
    C['rope'] = mat('rope', (0.85, 0.82, 0.70), 0.15)
    C['bolt'] = mat('bolt', (0.45, 0.46, 0.48), 0.6, metal=0.8)


def fix(o):
    """every face outwards (the parts here are closed shells)"""
    bm = bmesh.new(); bm.from_mesh(o.data); bmesh.ops.recalc_face_normals(bm, faces=bm.faces); bm.to_mesh(o.data); bm.free(); o.data.update()
    return o


# ---------- the knives ----------
TIPS = {}
def knife(name, one_piece):
    p = []
    if one_piece:
        # one forging: a round hollow handle that narrows into the bolster and runs on into the blade's back
        hp = [(-0.0640, 0.0030, 0.0030, 0.0), (-0.0625, 0.0080, 0.0074, 0.0), (-0.0580, 0.0106, 0.0096, 0.0), (-0.0400, 0.0112, 0.0100, 0.0004),
              (-0.0100, 0.0114, 0.0100, 0.0006), (0.0200, 0.0108, 0.0094, 0.0004), (0.0400, 0.0098, 0.0080, 0.0), (0.0500, 0.0104, 0.0058, -0.0012),
              (0.0560, 0.0118, 0.0034, -0.0022), (0.0600, 0.0126, 0.0016, -0.0026)]
        mh = C['stain']
    else:
        hp = [(-0.0640, 0.0040, 0.0030, 0.0000), (-0.0622, 0.0090, 0.0068, 0.0000), (-0.0580, 0.0116, 0.0086, 0.0002), (-0.0470, 0.0124, 0.0092, 0.0006),
              (-0.0250, 0.0120, 0.0090, 0.0010), (0.0050, 0.0112, 0.0084, 0.0006), (0.0320, 0.0106, 0.0080, 0.0000), (0.0440, 0.0114, 0.0082, -0.0010),
              (0.0510, 0.0142, 0.0086, -0.0028), (0.0570, 0.0144, 0.0080, -0.0030), (0.0600, 0.0100, 0.0052, -0.0010)]
        mh = C['yellow']
    seg = 16; rings = []
    for y, hz, hw, cz in hp:
        rings.append([(hw * math.sin(2 * math.pi * k / seg), y, cz + hz * math.cos(2 * math.pi * k / seg)) for k in range(seg)])
    if one_piece: mf = lambda i, j: mh
    else: mf = lambda i, j: C['black'] if (i < 2 or i >= 7) else mh        # the butt and the guard black, the grip yellow
    p.append(loft('handle', rings, mf, cap0=mh if one_piece else C['black'], cap1=mh if one_piece else C['black'], angle=50))
    y0, y1 = 0.056, (0.218 if one_piece else 0.212)
    ze = lambda t: -0.0118 + 0.034 * t ** 2.1
    w = lambda t: (0.0215 if one_piece else 0.0200) * max(0.0, 1 - t ** 2.4) ** 0.70
    rings = []
    for t in (0.0, 0.03, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.78, 0.85, 0.9, 0.94, 0.97, 1.0):
        y = y0 + (y1 - y0) * t; e = ze(t); ww = w(t); zs = e + ww; h = (0.0013 if one_piece else 0.0011) * (1 - 0.65 * t)
        if t >= 1.0: rings.append([(0.0, y, e)]); continue
        rings.append([(-h, y, zs), (h, y, zs), (0.8 * h, y, zs - 0.30 * ww), (0.25 * h, y, e + 0.13 * ww), (0.0, y, e), (-0.25 * h, y, e + 0.13 * ww), (-0.8 * h, y, zs - 0.30 * ww)])
    p.append(loft('blade', rings, lambda i, j: C['bevel'] if j in (3, 4) else C['blade'], cap0=C['blade'], angle=25))
    TIPS[name] = (0.0, y1, ze(1.0))
    o = join(p, name)
    if one_piece:
        # the turned grooves round the handle: darker bands
        def groove(co, mn, nrm, fi):
            if mn != 'stain' or co.y > 0.036 or co.y < -0.056: return None
            k = 1.0 - 0.22 * max(0.0, math.sin(co.y * 2 * math.pi / 0.0115)) ** 6
            return (k, k, k)
        add_tint(o, groove)
    return o


# ---------- the gaffs ----------
HOOK = [(0.530, 0.0), (0.565, 0.0), (0.592, -0.002), (0.618, -0.012), (0.638, -0.030), (0.648, -0.052), (0.643, -0.073), (0.625, -0.089),
        (0.598, -0.096), (0.570, -0.091), (0.546, -0.081), (0.522, -0.070)]
def hook(r, sc=1.0, y0=0.530):
    """the hook's rod from inside the shaft's end, round and back with its point toward the handle; sc widens the gape about its root"""
    H = [(y0 + (y - 0.530) * (sc if y > 0.565 else 1.0), z * sc) for y, z in HOOK]
    path = catmull([(0.0, y, z) for y, z in H], n=5)
    L = [0.0]
    for a, b in zip(path, path[1:]): L.append(L[-1] + (b - a).length)
    tl = L[-1]; taper = 0.055
    radii = [r if s < tl - taper else max(0.0, r * ((tl - s) / taper) ** 0.85) for s in L]; radii[-1] = 0.0
    return ttube('hook', path, radii, C['hook'], seg=10, cap0=False, cap1=False, angle=50), tuple(path[-1])


def gaff_steel():
    p = []
    # the tube, its plugged butt, the weld collar and the hook
    p.append(cyl('shaft', (0, -0.250, 0), (0, 0.540, 0), 0.0105, C['stain'], seg=14))
    p.append(ttube('butt', [(0, -0.262, 0), (0, -0.258, 0), (0, -0.250, 0), (0, -0.244, 0)], [0.0, 0.0125, 0.0165, 0.0165], C['black'], seg=14, cap0=False, cap1=True))
    # the rubber grip with its ribs, from the butt and 0.26 m up the shaft (both hands' places)
    prof = [(-0.246, 0.0165)]
    for k in range(13):
        y = -0.236 + k * 0.020; prof += [(y, 0.0150), (y + 0.004, 0.0166), (y + 0.012, 0.0166), (y + 0.016, 0.0150)]
    prof += [(0.028, 0.0150), (0.036, 0.0108)]
    p.append(ttube('grip', [(0, y, 0) for y, r in prof], [r for y, r in prof], C['black'], seg=14, cap0=False, cap1=False, angle=30))
    p.append(ttube('collar', [(0, 0.515, 0), (0, 0.522, 0), (0, 0.545, 0), (0, 0.556, 0)], [0.0106, 0.0128, 0.0128, 0.0062], C['stain2'], seg=14, cap0=False, cap1=False))
    h, tip = hook(0.0060); p.append(h); TIPS['hott2'] = tip
    return join(p, 'hott2')


def gaff_long():
    p = []
    bow = lambda y: 0.006 * math.sin(math.pi * min(1.0, max(0.0, (y + 0.80) / 1.28)))
    prof = [(-0.800, 0.0), (-0.7985, 0.0080), (-0.794, 0.0138), (-0.786, 0.0158), (-0.76, 0.0160), (-0.50, 0.0163), (-0.20, 0.0168), (0.10, 0.0172),
            (0.35, 0.0176), (0.470, 0.0178), (0.476, 0.0168)]
    p.append(ttube('handle', [(0.0, y, bow(y)) for y, r in prof], [r for y, r in prof], C['ash'], seg=14, cap0=False, cap1=True, angle=40))
    # the orange band where the forward hand holds, and one at the after hand
    for a, b in ((-0.10, 0.10), (-0.46, -0.34)):
        p.append(ttube('band', [(0, y, bow(y)) for y in (a, a + 0.004, b - 0.004, b)], [0.0168, 0.0186, 0.0188, 0.0170], C['orange'], seg=14, cap0=False, cap1=False, angle=30))
    # the lanyard through the butt: a loop of thin line
    lp = [(0.0, -0.770, 0.0165), (0.004, -0.790, 0.030), (0.012, -0.830, 0.040), (0.016, -0.880, 0.030), (0.010, -0.915, 0.0), (-0.004, -0.880, -0.030),
          (-0.012, -0.830, -0.040), (-0.006, -0.790, -0.030), (0.0, -0.770, -0.0165)]
    pth = catmull(lp, n=4); p.append(ttube('lanyard', pth, [0.0028] * len(pth), C['rope'], seg=6, angle=60))
    p.append(cyl('eye', (0, -0.770, -0.017), (0, -0.770, 0.017), 0.0034, C['rope'], seg=6))
    # the long steel socket over the shaft's end, two rivets through it, and the heavier hook with a wider gape
    sk = [(0.350, 0.0178), (0.354, 0.0196), (0.470, 0.0192), (0.520, 0.0150), (0.552, 0.0098), (0.560, 0.0070)]
    p.append(ttube('socket', [(0, y, bow(y)) for y, r in sk], [r for y, r in sk], C['stain2'], seg=14, cap0=False, cap1=False, angle=30))
    for y in (0.385, 0.440):
        p.append(cyl('rivet', (-0.0200, y, 0.0), (0.0200, y, 0.0), 0.0042, C['bolt'], seg=8))
    h, tip = hook(0.0068, sc=1.16); p.append(h); TIPS['hott3'] = tip
    o = join(p, 'hott3')
    def grain(co, mn, nrm, fi):
        if mn != 'ash': return None
        a = math.atan2(co.z - bow(co.y), co.x)
        k = 1.0 - 0.05 * (0.5 + 0.5 * math.sin(5 * a + 7 * co.y))
        k *= 1.0 - 0.12 * smooth01(0.15, 0.35, co.y)                            # the wet end at the hook
        return (k, k * 0.97, k * 0.93)
    return add_tint(o, grain)


# ---------- sheet metal: a section with thickness swept along stations ----------
def sheet_ring(mid, t):
    """a closed ring round a sheet's section: mid is its middle line [(x, z)], t the thickness; the ring runs along one face and back
    along the other"""
    n = len(mid); nr = []
    for i in range(n):
        a = mid[max(0, i - 1)]; b = mid[min(n - 1, i + 1)]; dx, dz = b[0] - a[0], b[1] - a[1]; l = math.hypot(dx, dz) or 1.0
        nr.append((-dz / l, dx / l))
    one = [(mid[i][0] + nr[i][0] * t / 2, mid[i][1] + nr[i][1] * t / 2) for i in range(n)]
    two = [(mid[i][0] - nr[i][0] * t / 2, mid[i][1] - nr[i][1] * t / 2) for i in range(n)]
    return one + list(reversed(two))


def sweep(name, stations, m, t=0.004):
    """stations [(y, mid)] with the same count of points in every mid"""
    rings = [[(x, y, z) for x, z in sheet_ring(mid, t)] for y, mid in stations]
    return fix(loft(name, rings, m, cap0=m, cap1=m, angle=40))


def saddle(p, x0, x1, depth=0.15, drop=0.13, m=None):
    """a saddle plate on the rail's top between x0 and x1 with a flange down the rail's outside and two bolts through the flange"""
    m = m or C['stain2']
    p.append(box('saddle', x0, x1, -0.006, depth, 0.0, 0.008, m))
    p.append(box('flange', x0, x1, -0.012, -0.004, -drop, 0.008, m))
    for fx in (0.25, 0.75):
        x = x0 + (x1 - x0) * fx
        p.append(cyl('bolt', (x, -0.024, -drop * 0.6), (x, -0.012, -drop * 0.6), 0.011, C['bolt'], seg=6))
        p.append(cyl('bolt', (x, depth * 0.55, 0.008), (x, depth * 0.55, 0.016), 0.011, C['bolt'], seg=6))


# ---------- the line setter ----------
SET = {}; MAG = {}
SLOPE = math.tan(math.radians(11))
def chute_bottom(y): return 0.105 + SLOPE * (y - 0.07)        # the inside bottom of the setter's chute over the rail's top


def setter():
    p = []; T = 0.004
    def mid(R, wall, n=14):
        pts = [(-R, R + wall)]
        for k in range(n + 1):
            a = math.pi + math.pi * k / n; pts.append((R * math.cos(a), R + R * math.sin(a)))
        pts.append((R, R + wall)); return pts
    # the stations: the bell mouth inboard (wider and deeper), the body, a slight flare at the lip
    st = []
    for y, R, wall in ((0.400, 0.215, 0.000), (0.385, 0.200, 0.004), (0.360, 0.176, 0.010), (0.320, 0.152, 0.020), (0.270, 0.136, 0.028), (0.210, 0.130, 0.030),
                       (0.000, 0.130, 0.030), (-0.300, 0.130, 0.030), (-0.520, 0.130, 0.030), (-0.580, 0.136, 0.026), (-0.615, 0.148, 0.020)):
        b = chute_bottom(y) - (R - 0.130) * 0.6            # (the mouth opens downwards too, toward the tub)
        st.append((y, [(x, z + b) for x, z in mid(R, wall)]))
    p.append(sweep('chute', st, C['stain'], T))
    # the rolled edge along each wall's top: a thin tube
    for s in (-1, 1):
        pts = [(s * (R), y, chute_bottom(y) - (R - 0.130) * 0.6 + R + wall) for y, R, wall in
               ((0.400, 0.215, 0.000), (0.360, 0.176, 0.010), (0.320, 0.152, 0.020), (0.270, 0.136, 0.028), (0.210, 0.130, 0.030), (0.000, 0.130, 0.030),
                (-0.300, 0.130, 0.030), (-0.520, 0.130, 0.030), (-0.580, 0.136, 0.026), (-0.615, 0.148, 0.020))]
        p.append(ttube('edge', pts, [0.006] * len(pts), C['stain'], seg=8, angle=50))
    # on the rail: the saddle plate, two posts and the cradle strap under the chute
    saddle(p, -0.17, 0.17)
    yc = 0.075; b = chute_bottom(yc); R = 0.130 + T / 2
    for s in (-1, 1):
        x = s * 0.105; zt = b + 0.130 - math.sqrt(R * R - x * x) - 0.001
        p.append(cyl('post', (x, yc, 0.006), (x, yc, zt), 0.014, C['stain2'], seg=10))
    strap = [((R + 0.0095) * math.cos(a), yc, b + 0.130 + (R + 0.0095) * math.sin(a)) for a in [math.pi + math.pi * k / 16 for k in range(17)]]
    p.append(ttube('strap', strap, [0.007] * len(strap), C['stain2'], seg=8, angle=50))
    # the stay from the flange's foot out to the chute's underside
    ys = -0.400; p.append(cyl('stay', (0.0, -0.014, -0.115), (0.0, ys, chute_bottom(ys) - T - 0.020), 0.011, C['stain2'], seg=10))
    p.append(box('staypad', -0.04, 0.04, ys - 0.035, ys + 0.035, chute_bottom(ys) - T - 0.030, chute_bottom(ys) - T - 0.004, C['stain2']))
    # the lip: two cheeks, the white roller the line runs over, and the hoop over it
    yl = -0.640; bl = chute_bottom(-0.615) - 0.011
    for s in (-1, 1):
        p.append(box('cheek', s * 0.150 - 0.004, s * 0.150 + 0.004, yl - 0.030, -0.585, bl - 0.020, bl + 0.115, C['stain2']))
    p.append(cyl('roller', (-0.146, yl, bl + 0.012), (0.146, yl, bl + 0.012), 0.026, C['pe'], seg=16))
    p.append(cyl('axle', (-0.160, yl, bl + 0.012), (0.160, yl, bl + 0.012), 0.007, C['bolt'], seg=8))
    hoop = [(0.150 * math.cos(a), yl, bl + 0.105 + 0.150 * math.sin(a)) for a in [math.pi * k / 16 for k in range(17)]]
    p.append(ttube('hoop', hoop, [0.007] * len(hoop), C['stain2'], seg=8, angle=50))
    SET.update({'half': 0.215, 'mouth': G((0.0, 0.400, chute_bottom(0.400) + 0.10)), 'lip': G((0.0, yl, bl + 0.045)), 'in': 0.400, 'out': 0.672,
                'top': round(chute_bottom(0.400) + 0.215 + 0.2, 3)})
    return join(p, 'setter')


def magazine():
    """the rack for two tubs inside the bulwark, its top a tub's height under the chute's mouth and sloping gently to it"""
    p = []; ya, yb = 0.46, 1.52; hx = 0.270
    top = lambda y: -0.215 + 0.045 * (y - ya) / (yb - ya)              # the rollers' top
    for s in (-1, 1):
        p.append(cyl('rail', (s * hx, ya, top(ya) - 0.024), (s * hx, yb, top(yb) - 0.024), 0.018, C['stain2'], seg=10))
        # the guide over each rail on short stanchions
        p.append(cyl('guide', (s * (hx + 0.012), ya + 0.02, top(ya) + 0.075), (s * (hx + 0.012), yb - 0.02, top(yb) + 0.075), 0.009, C['stain'], seg=8))
        for y in (ya + 0.05, (ya + yb) / 2, yb - 0.05):
            p.append(cyl('stan', (s * hx, y, top(y) - 0.02), (s * (hx + 0.012), y, top(y) + 0.075), 0.007, C['stain'], seg=6))
        # the flat hanger from the rack's after end up to the saddle plate on the rail
        pts = [(s * hx, ya + 0.01, top(ya) - 0.03), (s * hx, 0.30, -0.06), (s * 0.20, 0.155, 0.004), (s * 0.15, 0.10, 0.012)]
        p.append(ttube('hanger', pts, [0.010] * len(pts), C['stain2'], seg=8, angle=50))
    n = 12
    for k in range(n):
        y = ya + 0.05 + (yb - ya - 0.10) * k / (n - 1)
        p.append(cyl('roll', (-hx + 0.016, y, top(y) - 0.022), (hx - 0.016, y, top(y) - 0.022), 0.022, C['pe'], seg=12))
    for y in (ya, yb):
        p.append(cyl('stop', (-hx, y, top(y) + 0.045), (hx, y, top(y) + 0.045), 0.009, C['stain'], seg=8))
        for s in (-1, 1): p.append(cyl('stopp', (s * hx, y, top(y) - 0.03), (s * hx, y, top(y) + 0.045), 0.009, C['stain'], seg=8))
    MAG.update({'leg': G((0.0, yb - 0.06, top(yb) - 0.040)), 'len': round(yb - ya, 3), 'half': hx + 0.03, 'top': round(top(ya), 3), 'at': [round(ya, 3), round(yb, 3)]})
    mag = join(p, 'setter_mag')
    # the legs: one unit down from the rack, a cross stay near the top (the game scales the unit to the deck)
    q = []; ly = yb - 0.06; lz = top(yb) - 0.040
    for s in (-1, 1): q.append(cyl('leg', (s * hx, ly, lz), (s * hx, ly, lz - 1.0), 0.016, C['stain2'], seg=10))
    q.append(cyl('cross', (-hx, ly, lz - 0.22), (hx, ly, lz - 0.22), 0.010, C['stain2'], seg=8))
    return mag, join(q, 'setter_ben')


# ---------- the net chute ----------
REN = {}
def net_chute():
    p = []; T = 0.005; sl = math.tan(math.radians(9))
    bot = lambda y: 0.060 + sl * (y - 0.07)
    def mid(hw, wall, flare, r=0.09, n=6):
        """a flat bottom of half width hw, a rounded corner, and a wall of height wall leaning out by flare"""
        pts = []
        for s in (-1, 1):
            side = [(s * (hw + r + flare), r + wall)]
            for k in range(n + 1):
                a = math.pi / 2 * k / n; side.append((s * (hw + r * math.cos(a)), r - r * math.sin(a)))
            pts += side if s < 0 else list(reversed(side))
        return pts
    st = []; prof = ((0.340, 0.350, 0.060, 0.050), (0.300, 0.335, 0.090, 0.040), (0.220, 0.310, 0.115, 0.028), (0.100, 0.285, 0.125, 0.020), (-0.200, 0.265, 0.125, 0.016),
                     (-0.500, 0.250, 0.115, 0.016), (-0.700, 0.245, 0.100, 0.020), (-0.760, 0.245, 0.085, 0.026))
    for y, hw, wall, flare in prof: st.append((y, [(x, z + bot(y)) for x, z in mid(hw, wall, flare)]))
    p.append(sweep('trough', st, C['alu'], T))
    # the rolled lips: a stainless tube across each end under the bottom's edge, and along each wall's top
    for y in (prof[0][0], prof[-1][0]):
        hw = prof[0][1] if y > 0 else prof[-1][1]
        p.append(cyl('lip', (-hw - 0.05, y, bot(y) - 0.016), (hw + 0.05, y, bot(y) - 0.016), 0.022, C['stain'], seg=12))
    for s in (-1, 1):
        pts = [(s * (hw + 0.09 + flare), y, bot(y) + 0.09 + wall) for y, hw, wall, flare in prof]
        p.append(ttube('edge', pts, [0.011] * len(pts), C['stain'], seg=8, angle=50))
    # on the rail: a saddle plate under each side, a post to the bottom, and a stay from each flange out under the chute
    for s in (-1, 1):
        saddle(p, s * 0.24 - 0.09, s * 0.24 + 0.09)
        p.append(box('block', s * 0.24 - 0.05, s * 0.24 + 0.05, 0.02, 0.12, 0.006, bot(0.02) - T, C['stain2']))
        ys = -0.520; p.append(cyl('stay', (s * 0.24, -0.014, -0.115), (s * 0.20, ys, bot(ys) - T - 0.022), 0.012, C['stain2'], seg=10))
        p.append(box('staypad', s * 0.20 - 0.04, s * 0.20 + 0.04, ys - 0.035, ys + 0.035, bot(ys) - T - 0.032, bot(ys) - T - 0.004, C['stain2']))
    # three low ribs under the bottom so it does not drum
    for y in (0.20, -0.25, -0.62):
        hw = 0.27
        p.append(box('rib', -hw, hw, y - 0.012, y + 0.012, bot(y) - T - 0.026, bot(y) - T - 0.003, C['alu']))
    REN.update({'half': round(prof[0][1] + 0.09 + prof[0][3] + 0.011, 3), 'in': prof[0][0], 'out': 0.782, 'lip': G((0.0, prof[-1][0], bot(prof[-1][0]) + 0.01)),
                'top': round(bot(0.34) + 0.09 + 0.06 + 0.2, 3)})
    return join(p, 'renne')


# ---------- export and renders ----------
def measure(A):
    P = A['pos']; lo = [min(q[k] for q in P) for k in range(3)]; hi = [max(q[k] for q in P) for k in range(3)]
    return lo, hi, len(A['idx']) // 3


def main():
    os.makedirs(OUT, exist_ok=True)
    reset(); colours()
    k2 = knife('kniv2', False); k3 = knife('kniv3', True); h2 = gaff_steel(); h3 = gaff_long()
    se = setter(); mg, ben = magazine(); rn = net_chute()
    objs = [k2, k3, h2, h3, se, mg, ben, rn]
    parts = [(o.name, mesh_arrays(o, to_game, to_game_n, ao=False), 1.0) for o in objs]
    ex = {'frame': 'kystfiske deck upgrades: x right, y up, z aft. The knives and gaffs as tools/deck/fisk.py kniv and hott (the head along -z); '
                   'the setter, its magazine and the net chute from the middle of the stern rail\'s top at its outer edge, +z out over the sea (tools/deck/oppgr.py)',
          'kniv_tip': {k: G(TIPS[k]) for k in ('kniv2', 'kniv3')}, 'hott_tip': {k: G(TIPS[k]) for k in ('hott2', 'hott3')},
          'hott_butt': {'hott': 0.25, 'hott2': 0.262, 'hott3': 0.80}, 'hott_hook': [0.648, 0.096], 'setter': SET, 'mag': MAG, 'renne': REN}
    glb = os.path.join(OUT, 'deck-upg.glb'); n = write_glb(glb, parts, ex)
    open(os.path.join(ROOT, 'src', 'data', 'deck-upg.b64'), 'w').write(base64.b64encode(open(glb, 'rb').read()).decode())
    print('GLB %.1f KB' % (n / 1024))
    for name, A, _ in parts:
        lo, hi, t = measure(A)
        print('  %-10s %5d tris  size x %.3f  y %.3f  z %.3f   (x %.3f..%.3f, y %.3f..%.3f, z %.3f..%.3f)' % (name, t, hi[0] - lo[0], hi[1] - lo[1], hi[2] - lo[2], lo[0], hi[0], lo[1], hi[1], lo[2], hi[2]))
    for k, v in ex.items():
        if k != 'frame': print('  %s = %s' % (k, v))
    if FAST: return
    renders({o.name: o for o in objs})


def renders(O):
    sc = setup_render(1100, 760, samples=24)
    try: sc.cycles.use_denoising = True; sc.cycles.denoiser = 'OPENIMAGEDENOISE'
    except Exception: pass
    sc.world.node_tree.nodes.get('Background').inputs['Color'].default_value = (0.62, 0.70, 0.80, 1)
    bm = bmesh.new(); s = 12
    bm.faces.new([bm.verts.new(q) for q in ((-s, -s, 0), (s, -s, 0), (s, s, 0), (-s, s, 0))])
    deck = obj_from_bm('deck', bm, [mat('deck', (0.36, 0.40, 0.40), 0.25)])
    # a stand-in stern: the bulwark 0.9 m high and 0.12 m thick with the deck inboard of it (+y) and the sea aft
    wall = box('wall', -1.6, 1.6, 0.0, 0.12, 0.0, 0.9, mat('hullw', (0.80, 0.80, 0.78), 0.3))
    def show(objs, placed, stern=False):
        for o in O.values(): o.hide_render = True; o.location = (0, 0, 0); o.rotation_euler = (0, 0, 0); o.scale = (1, 1, 1)
        for o in objs: o.hide_render = False
        for o, loc in placed.items(): o.location = loc
        wall.hide_render = not stern
    def shot(nm, loc, look, lens=35):
        camera(loc, look, lens=lens); render(os.path.join(OUT, 'oppgr_%s.png' % nm))
    # the knives on the deck, turned on their side
    show([O['kniv2'], O['kniv3']], {O['kniv2']: (-0.06, 0.0, 0.012), O['kniv3']: (0.06, 0.0, 0.012)})
    for k in ('kniv2', 'kniv3'): O[k].rotation_euler = (0, math.radians(90), 0)
    shot('kniver', (0.0, -0.02, 0.55), (0.0, 0.075, 0.0), 50)
    show([O['kniv2'], O['kniv3']], {O['kniv2']: (-0.05, 0.0, 0.3), O['kniv3']: (0.05, 0.0, 0.3)})
    shot('kniver_side', (0.55, 0.075, 0.33), (0.0, 0.075, 0.30), 50)
    # the gaffs on the deck
    show([O['hott2'], O['hott3']], {O['hott2']: (-0.12, 0.0, 0.03), O['hott3']: (0.12, 0.0, 0.03)})
    for k in ('hott2', 'hott3'): O[k].rotation_euler = (0, math.radians(90), 0)
    shot('hotter', (0.9, -1.2, 1.5), (0.0, -0.05, 0.0), 40)
    show([O['hott2'], O['hott3']], {O['hott2']: (0.0, 0.0, 0.5), O['hott3']: (0.0, 0.0, 0.72)})
    shot('hotter_krok', (0.55, 0.50, 0.63), (0.0, 0.58, 0.58), 50)
    # the setter on the stand-in stern (the origin at the rail's top, its outer edge), with and without the magazine, and the chute
    top = (0.0, 0.0, 0.9)
    show([O['setter']], {O['setter']: top}, stern=True)
    shot('setter', (1.5, -1.3, 1.75), (0.0, -0.05, 1.0), 40)
    shot('setter_inne', (-1.3, 1.7, 1.9), (0.0, 0.1, 0.95), 40)
    show([O['setter'], O['setter_mag'], O['setter_ben']], {O['setter']: top, O['setter_mag']: top, O['setter_ben']: top}, stern=True)
    lz = MAG['leg'][1]; O['setter_ben'].location = (0, 0, 0.9 + lz - lz * (0.9 + lz)); O['setter_ben'].scale = (1, 1, 0.9 + lz)
    shot('setter_mag', (-1.9, 2.2, 2.0), (0.0, 0.6, 0.75), 40)
    shot('setter_mag_side', (2.6, 0.5, 1.2), (0.0, 0.45, 0.8), 40)
    show([O['renne']], {O['renne']: top}, stern=True)
    shot('renne', (1.7, -1.5, 1.8), (0.0, -0.1, 1.0), 40)
    shot('renne_inne', (-1.5, 1.9, 1.9), (0.0, 0.0, 0.95), 40)


if __name__ == '__main__':
    main()
