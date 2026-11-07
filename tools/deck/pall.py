"""The frozen catch on pallets, built in Blender (havsteget H2d, docs/planer/havsteget-h2-autoline.md, 05.11.2026): an autoliner lands its
sea-frozen fish on pallets (V1 A, Jonas 05.11.2026: «men husk at vi må ha blendermodeller og animasjoner for hele operasjonen»), about a
tonne a lift (PALL in core/07-harbours.js). Until now the game drew a simple box pallet (view3d/08-plants.js palF).

    kartong   a carton of frozen fish, 0.60 x 0.40 x 0.14 m, about 22 kg of headed and gutted fish frozen in a block (the cartons
              autoliners pack at sea are 20-25 kg; the size is ours). White waxed board with a pale blue band and a blank label on
              its end: no names or marks (CLAUDE.md). From the middle of its base, its length along z.
    pall      a EUR pallet 1.20 x 0.80 x 0.144 m as in tools/deck/rigg.py (three bottom boards, nine blocks, three stringer boards,
              five top boards), its length along z. From the middle of its base.
    pall_full the pallet with 11 layers of four cartons (44 cartons, about 970 kg; 1.68 m high), wrapped in stretch film as it leaves
              the freezer hold: the film is drawn as three milky glossy bands (low over the pallet's top boards, in the middle and
              over the top layer, folded over its edge) with the cartons showing between them, and brown corner boards up the four
              corners. From the middle of its base.
    pall_sno, kartong_sno
              the snow crab's clusters frozen at sea (havsteget H3d1, 07.11.2026): 25 kg cartons, 0.60 x 0.40 x 0.20 m, white with an
              orange band, eight layers of four on the pallet (800 kg, 1.74 m), wrapped like the fish
    kar_levende
              the tub the live snow crab is landed in (H3b): a 1 000 litre insulated tub with sea water in it; the crabs are the game's
    gaffel    the pallet fork for the crane (a C-hook): a lifting eye over the load's middle on a top arm, a column down behind the
              pallet's short end and two tines that go into the pallet under its top boards. Yellow lifting gear, a white load plate
              without text. From the lifting eye (the crane's hook takes it there); the pallet carried on it has its base at
              gaffel.base under the eye (extras).

    pip install bpy==4.5.4
    python3 tools/deck/pall.py          -> src/data/deck-pall.b64, renders in tools/deck/out/
    python3 tools/deck/pall.py fast     -> without the renders

Frames. Here in Blender: x across the pallet (0.80 m), y along it (1.20 m), z up. The game's: x right, y up, z aft; to_game(p) =
(x, z, -y), so the pallet's length lies along the game's z."""
import os, sys, math, base64, random
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))
sys.path.insert(0, os.path.join(ROOT, 'tools', 'boats'))
import bpy, bmesh
from bpyutil import *

OUT = os.path.join(HERE, 'out')
C = {}
def colours():
    C['pal'] = mat('pal', (0.78, 0.66, 0.48), 0.12)
    C['palB'] = mat('palB', (0.62, 0.50, 0.35), 0.1)
    C['cart'] = mat('cart', (0.90, 0.90, 0.87), 0.35)
    C['cartE'] = mat('cartE', (0.84, 0.85, 0.82), 0.3)
    C['band'] = mat('band', (0.36, 0.55, 0.78), 0.35)
    C['label'] = mat('label', (0.97, 0.97, 0.95), 0.3)
    C['seam'] = mat('seam', (0.62, 0.62, 0.60), 0.2)
    C['film'] = mat('film', (0.86, 0.90, 0.93), 0.92)
    C['corner'] = mat('corner', (0.58, 0.44, 0.28), 0.15)
    C['yellow'] = mat('yellow', (0.95, 0.72, 0.10), 0.5)
    C['steel'] = mat('steel', (0.58, 0.60, 0.62), 0.55, metal=0.6)
    C['white'] = mat('white', (0.93, 0.93, 0.91), 0.4)
    C['bandS'] = mat('bandS', (0.90, 0.46, 0.12), 0.35)
    C['karB'] = mat('karB', (0.20, 0.36, 0.56), 0.4); C['karI'] = mat('karI', (0.30, 0.48, 0.66), 0.3); C['sea'] = mat('sea', (0.05, 0.20, 0.24), 0.9)
    C['karR'] = mat('karR', (0.14, 0.27, 0.44), 0.4)

def to_game(p): return (p[0], p[2], -p[1])
def to_game_n(n): return (n[0], n[2], -n[1])

CW, CL, CH = 0.40, 0.60, 0.14          # a carton: across, along, high
KG = 22                                # kg of fish in a carton
LAYERS, PER = 11, 4
PH = 0.144                             # the pallet's height
FULLH = PH + LAYERS * CH

def carton(A, cx, cy, z0, rot=False, rng=None):
    """a carton standing on z0 with its middle at (cx, cy): length along y (along x when rot); a little crooked when rng is given"""
    w, l = (CL, CW) if rot else (CW, CL)
    j = (rng.uniform(-0.006, 0.006), rng.uniform(-0.006, 0.006)) if rng else (0, 0)
    x0, x1, y0, y1 = cx - w / 2 + 0.003 + j[0], cx + w / 2 - 0.003 + j[0], cy - l / 2 + 0.003 + j[1], cy + l / 2 - 0.003 + j[1]
    z1 = z0 + CH - 0.002
    abox(A, x0, x1, y0, y1, z0, z1, C['cart'])
    # the pale blue band round its middle, the lid's seam, and a blank label on each end
    zb0, zb1 = z0 + 0.045, z0 + 0.075
    for y, s in ((y0, -1), (y1, 1)):
        A.poly([(x0, y + 0.0015 * s, zb0), (x1, y + 0.0015 * s, zb0), (x1, y + 0.0015 * s, zb1), (x0, y + 0.0015 * s, zb1)], C['band'], (0, s, 0))
        lx = (x0 + x1) / 2; A.poly([(lx - 0.09, y + 0.002 * s, z0 + 0.085), (lx + 0.09, y + 0.002 * s, z0 + 0.085), (lx + 0.09, y + 0.002 * s, z0 + 0.125), (lx - 0.09, y + 0.002 * s, z0 + 0.125)], C['label'], (0, s, 0))
    for x, s in ((x0, -1), (x1, 1)):
        A.poly([(x + 0.0015 * s, y0, zb0), (x + 0.0015 * s, y1, zb0), (x + 0.0015 * s, y1, zb1), (x + 0.0015 * s, y0, zb1)], C['band'], (s, 0, 0))
    A.poly([((x0 + x1) / 2 - 0.004, y0, z1 + 0.001), ((x0 + x1) / 2 + 0.004, y0, z1 + 0.001), ((x0 + x1) / 2 + 0.004, y1, z1 + 0.001), ((x0 + x1) / 2 - 0.004, y1, z1 + 0.001)], C['seam'], (0, 0, 1))

def pallet(A, z0=0.0):
    """a EUR pallet 1.20 x 0.80 x 0.144 m, its length along y"""
    t = 0.022
    for x, w in ((-0.35, 0.10), (0.0, 0.145), (0.35, 0.10)):      # the bottom boards, along y
        abox(A, x - w / 2, x + w / 2, -0.6, 0.6, z0, z0 + t, C['pal'])
    for x in (-0.3275, 0.0, 0.3275):                               # the nine blocks
        for y in (-0.5275, 0.0, 0.5275):
            w = 0.145 if x == 0.0 else 0.145; d = 0.145 if y == 0.0 or x == 0.0 else 0.10
            abox(A, x - w / 2 if x else -0.0725, x + w / 2 if x else 0.0725, y - d / 2, y + d / 2, z0 + t, z0 + t + 0.078, C['palB'])
    for y in (-0.5275, 0.0, 0.5275):                               # the stringer boards across
        abox(A, -0.4, 0.4, y - 0.0725, y + 0.0725, z0 + t + 0.078, z0 + 2 * t + 0.078, C['pal'])
    for x, w in ((-0.3275, 0.145), (-0.1625, 0.10), (0.0, 0.145), (0.1625, 0.10), (0.3275, 0.145)):   # the top boards, along y
        abox(A, x - w / 2, x + w / 2, -0.6, 0.6, z0 + PH - t, z0 + PH, C['pal'])

def film_band(A, z0, z1, over=False, d=0.005):
    """a band of stretch film round the stack from z0 to z1, d outside the cartons, its corners rounded; over: folded over the top edge"""
    hw, hl, r = 0.40 + d, 0.60 + d, 0.03
    ring = []
    for cx, cy, a0 in ((hw - r, hl - r, 0), (-hw + r, hl - r, 90), (-hw + r, -hl + r, 180), (hw - r, -hl + r, 270)):
        for k in range(4):
            a = math.radians(a0 + 90 * k / 3); ring.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    n = len(ring)
    for i in range(n):
        a, b = ring[i], ring[(i + 1) % n]; o = ((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, 0)
        A.poly([(a[0], a[1], z0), (b[0], b[1], z0), (b[0], b[1], z1), (a[0], a[1], z1)], C['film'], o)
    if over:   # folded in over the top layer's edge by 6 cm
        inner = [(x * (1 - 0.06 / 0.4), y * (1 - 0.06 / 0.6)) for x, y in ring]
        for i in range(n):
            a, b, c, e = ring[i], ring[(i + 1) % n], inner[(i + 1) % n], inner[i]
            A.poly([(a[0], a[1], z1), (b[0], b[1], z1), (c[0], c[1], z1 + 0.002), (e[0], e[1], z1 + 0.002)], C['film'], (0, 0, 1))

def corner_boards(A, z0, z1):
    for sx in (-1, 1):
        for sy in (-1, 1):
            x, y, w, t = sx * (0.40 + 0.007), sy * (0.60 + 0.007), 0.05, 0.004
            abox(A, min(x, x - sx * w), max(x, x - sx * w), min(y, y + sy * t), max(y, y + sy * t), z0, z1, C['corner'])
            abox(A, min(x, x + sx * t), max(x, x + sx * t), min(y, y - sy * w), max(y, y - sy * w), z0, z1, C['corner'])

def build_pallet():
    A = Acc('pall'); pallet(A); return A.done(20)

def build_full():
    A = Acc('pall_full'); rng = random.Random(5); pallet(A)
    for L in range(LAYERS):
        z0 = PH + L * CH
        for cx in (-0.2, 0.2):
            for cy in (-0.3, 0.3): carton(A, cx, cy, z0, rng=rng)
    film_band(A, PH - 0.10, PH + 3 * CH)
    film_band(A, PH + 4.6 * CH, PH + 6.4 * CH)
    film_band(A, FULLH - 2.2 * CH, FULLH, over=True)
    corner_boards(A, PH, FULLH - 0.01)
    return A.done(20)

def build_carton():
    A = Acc('kartong'); carton(A, 0, 0, 0); return A.done(20)

# ---------- the snow crab's (havsteget H3d1, 07.11.2026): the clusters frozen in 25 kg cartons on pallets, and the tub the live crab is
# landed in (H3b: «levende krabbe i kar med kran»; FHF 901919: «pumpes et parti levende krabbe fra RSW-tank til lossekar») ----------
SW, SL, SHH = 0.40, 0.60, 0.20          # a carton of clusters: across, along, high (25 kg of glazed clusters; the size is ours)
SKG = 25
SLAYERS = 8
SFULLH = PH + SLAYERS * SHH
def carton_sno(A, cx, cy, z0, rng=None):
    """a carton of frozen clusters: white waxed board with an orange band and a blank label on its end, no names or marks (CLAUDE.md)"""
    j = (rng.uniform(-0.006, 0.006), rng.uniform(-0.006, 0.006)) if rng else (0, 0)
    x0, x1, y0, y1 = cx - SW / 2 + 0.003 + j[0], cx + SW / 2 - 0.003 + j[0], cy - SL / 2 + 0.003 + j[1], cy + SL / 2 - 0.003 + j[1]
    z1 = z0 + SHH - 0.002
    abox(A, x0, x1, y0, y1, z0, z1, C['cart'])
    abox(A, x0 - 0.001, x1 + 0.001, y0 - 0.001, y1 + 0.001, z0 + SHH * 0.40, z0 + SHH * 0.60, C['bandS'], skip=('+z', '-z'))
    abox(A, x0 + 0.02, x1 - 0.02, y0 + 0.02, y1 - 0.02, z1, z1 + 0.001, C['seam'], skip=('-z',))
    A.poly([(cx - 0.10 + j[0], y0 - 0.002, z0 + SHH * 0.66), (cx + 0.10 + j[0], y0 - 0.002, z0 + SHH * 0.66), (cx + 0.10 + j[0], y0 - 0.002, z0 + SHH * 0.92), (cx - 0.10 + j[0], y0 - 0.002, z0 + SHH * 0.92)], C['label'], (0, -1, 0))

def build_full_sno():
    A = Acc('pall_sno'); rng = random.Random(7); pallet(A)
    for L in range(SLAYERS):
        z0 = PH + L * SHH
        for cx in (-0.2, 0.2):
            for cy in (-0.3, 0.3): carton_sno(A, cx, cy, z0, rng=rng)
    film_band(A, PH - 0.10, PH + 2 * SHH)
    film_band(A, PH + 3.4 * SHH, PH + 4.6 * SHH)
    film_band(A, SFULLH - 1.6 * SHH, SFULLH, over=True)
    corner_boards(A, PH, SFULLH - 0.01)
    return A.done(20)

def build_carton_sno():
    A = Acc('kartong_sno'); carton_sno(A, 0, 0, 0); return A.done(20)

KW, KL, KH, KWATER = 1.00, 1.20, 0.80, 0.62     # the tub for the live crab: across, along, high, the water in it
def build_tub():
    """an insulated 1 000 litre tub of blue polyethylene with rounded corners, a rim, the forklift's openings in its foot, and sea water
    in it (the crabs are the game's); from the middle of its base, its length along z"""
    A = Acc('kar_levende'); n = 4
    def rr(w, l, r, z): return [(x, y, z) for x, y in rrect(0, 0, w, l, r, n=n)]
    rings = [rr(KW - 0.06, KL - 0.06, 0.10, 0.12), rr(KW, KL, 0.12, 0.16), rr(KW, KL, 0.12, KH - 0.06), rr(KW + 0.03, KL + 0.03, 0.13, KH - 0.05), rr(KW + 0.03, KL + 0.03, 0.13, KH)]
    for a, b in zip(rings, rings[1:]):
        for i in range(len(a)):
            p, q, r_, t = a[i], a[(i + 1) % len(a)], b[(i + 1) % len(b)], b[i]
            A.poly([p, q, r_, t], C['karB'] if b is not rings[-1] else C['karR'], ((p[0] + q[0]) / 2, (p[1] + q[1]) / 2, 0))
    inner = rr(KW - 0.10, KL - 0.10, 0.08, KH)
    top = rings[-1]
    for i in range(len(top)):
        p, q = top[i], top[(i + 1) % len(top)]; r_, t = inner[(i + 1) % len(inner)], inner[i]
        A.poly([p, q, r_, t], C['karR'], (0, 0, 1))
    deep = rr(KW - 0.10, KL - 0.10, 0.08, KWATER)
    for i in range(len(inner)):
        p, q = inner[i], inner[(i + 1) % len(inner)]; r_, t = deep[(i + 1) % len(deep)], deep[i]
        A.poly([p, q, r_, t], C['karI'], (-(p[0] + q[0]) / 2, -(p[1] + q[1]) / 2, 0))
    A.poly(deep, C['sea'], (0, 0, 1))
    A.poly(rings[0], C['karR'], (0, 0, -1))
    # the foot: four legs with the forklift's openings between them on all sides
    for x in (-1, 1):
        for y in (-1, 1): abox(A, x * (KW / 2 - 0.16) - 0.12, x * (KW / 2 - 0.16) + 0.12, y * (KL / 2 - 0.18) - 0.14, y * (KL / 2 - 0.18) + 0.14, 0.0, 0.13, C['karR'])
    for y in (-0.25, 0.25): abox(A, -0.06, 0.06, y - 0.03, y + 0.03, 0.0, 0.13, C['karR'])
    return A.done(25)

# the pallet fork: the eye at the origin, the load's base at GBASE under it
GBASE = -(FULLH + 0.32)                # the pallet's base under the eye: the load, and 0.32 m clear under the top arm
TINE = GBASE + PH - 0.022              # the tines' top: in the pallet's openings, under its top boards
COLY = -0.68                           # the column, behind the pallet's short end (y = -0.6)
def build_fork():
    A = Acc('gaffel'); y = C['yellow']
    # the lifting eye: a ring standing on a lug on the top arm
    atorus(A, (0, 0, -0.07), (1, 0, 0), 0.07, 0.018, lambda q: C['steel'], seg=16, rseg=6)
    abox(A, -0.02, 0.02, -0.06, 0.06, -0.16, -0.12, y)
    # the top arm from over the load's middle back to the column, a box section
    beam(A, (0, 0.08, -0.20), (0, COLY, -0.20), 0.12, 0.12, y)
    # the column down behind the pallet, a gusset at the top
    beam(A, (0, COLY, -0.14), (0, COLY, TINE + 0.04), 0.14, 0.12, y, up=(0, 1, 0))
    A.poly([(0.0, COLY + 0.06, -0.26), (0.0, COLY + 0.36, -0.26), (0.0, COLY + 0.06, -0.56)], y, (1, 0, 0))
    A.poly([(0.0, COLY + 0.06, -0.26), (0.0, COLY + 0.06, -0.56), (0.0, COLY + 0.36, -0.26)], y, (-1, 0, 0))
    # the heel across the column's foot and the two tines forward under the pallet (0.5 m apart, 1.1 m long, tapered at the tips)
    beam(A, (-0.34, COLY, TINE - 0.04), (0.34, COLY, TINE - 0.04), 0.10, 0.10, y)
    for x in (-0.25, 0.25):
        beam(A, (x, COLY, TINE - 0.025), (x, 0.42, TINE - 0.025), 0.10, 0.05, y)
        A.poly([(x - 0.05, 0.42, TINE), (x + 0.05, 0.42, TINE), (x + 0.05, 0.50, TINE - 0.02), (x - 0.05, 0.50, TINE - 0.02)], y, (0, 0.3, 1))
        A.poly([(x - 0.05, 0.42, TINE - 0.05), (x - 0.05, 0.50, TINE - 0.03), (x + 0.05, 0.50, TINE - 0.03), (x + 0.05, 0.42, TINE - 0.05)], y, (0, 0.3, -1))
        A.poly([(x - 0.05, 0.50, TINE - 0.02), (x + 0.05, 0.50, TINE - 0.02), (x + 0.05, 0.50, TINE - 0.03), (x - 0.05, 0.50, TINE - 0.03)], y, (0, 1, 0))
    # the white load plate on the column, the back stop of steel bars behind the load
    A.poly([(0.071, COLY - 0.04, -0.45), (0.071, COLY + 0.04, -0.45), (0.071, COLY + 0.04, -0.62), (0.071, COLY - 0.04, -0.62)], C['white'], (1, 0, 0))
    for z in (TINE + 0.5, TINE + 1.2):
        beam(A, (-0.36, COLY + 0.07, z), (0.36, COLY + 0.07, z), 0.05, 0.05, y)
    return A.done(25)

def main():
    os.makedirs(OUT, exist_ok=True)
    reset(); colours()
    F = build_full(); P = build_pallet(); K = build_carton(); G = build_fork(); FS = build_full_sno(); KS = build_carton_sno(); T = build_tub()
    gx = lambda p: tuple(a - b for a, b in zip(to_game(p), to_game((0, 0, 0))))
    parts = [('pall_full', mesh_arrays(F, to_game, to_game_n, ao=False), 1.0), ('pall', mesh_arrays(P, to_game, to_game_n, ao=False), 1.0),
             ('kartong', mesh_arrays(K, to_game, to_game_n, ao=False), 1.0), ('gaffel', mesh_arrays(G, gx, to_game_n, ao=False), 1.0),
             ('pall_sno', mesh_arrays(FS, to_game, to_game_n, ao=False), 1.0), ('kartong_sno', mesh_arrays(KS, to_game, to_game_n, ao=False), 1.0),
             ('kar_levende', mesh_arrays(T, to_game, to_game_n, ao=False), 1.0)]
    ex = {'frame': 'kystfiske frozen catch: metres, x right, y up, z aft; the pallets and the carton from the middle of their base, their length along z; the fork from its lifting eye',
          'kartong': {'w': CW, 'l': CL, 'h': CH, 'kg': KG}, 'layers': LAYERS, 'per': PER, 'n': LAYERS * PER, 'kg': LAYERS * PER * KG,
          'h': round(FULLH, 3), 'ph': PH,
          # the snow crab's: the pallet of clusters (8 layers of four 25 kg cartons, 800 kg) and the live crab's tub
          'sno': {'kartong': {'w': SW, 'l': SL, 'h': SHH, 'kg': SKG}, 'layers': SLAYERS, 'per': PER, 'n': SLAYERS * PER, 'kg': SLAYERS * PER * SKG, 'h': round(SFULLH, 3)},
          'kar': {'w': KW, 'l': KL, 'h': KH, 'water': KWATER, 'litres': 1000},
          'gaffel': {'base': round(GBASE, 3), 'tine': round(TINE, 3), 'col': -COLY, 'h': round(-TINE + 0.06, 3)}}
    glb = os.path.join(OUT, 'deck-pall.glb'); n = write_glb(glb, parts, ex)
    open(os.path.join(ROOT, 'src', 'data', 'deck-pall.b64'), 'w').write(base64.b64encode(open(glb, 'rb').read()).decode())
    print('deck-pall GLB %.1f KB, %s; full pallet %.2f m high, %d cartons, %d kg' % (n / 1024, ', '.join('%s %d' % (p[0], len(p[1]['idx']) // 3) for p in parts), FULLH, LAYERS * PER, LAYERS * PER * KG))
    if 'fast' in sys.argv: return
    # the fork carrying a full pallet, an empty pallet and a carton beside it
    G.location = (2.0, 0, -GBASE); F2 = build_full(); F2.location = (2.0, 0, 0)
    P.location = (-1.0, 0.0, 0); K.location = (-1.0, 0.0, PH); F.location = (0.5, 0, 0)
    setup_render(1200, 800, samples=24); bpy.context.scene.world.node_tree.nodes.get('Background').inputs['Color'].default_value = (0.62, 0.72, 0.84, 1)
    for nm, loc, look, lens in (('3q', (3.8, -4.6, 2.6), (0.6, 0, 1.0), 35), ('end', (-0.5, -4.2, 1.1), (0.5, 0, 1.0), 40), ('fork', (6.2, 0.0, 1.2), (2.0, 0.001, 1.1), 35)):
        camera(loc, look, lens=lens); render(os.path.join(OUT, 'pall_%s.png' % nm))

if __name__ == '__main__':
    main()
