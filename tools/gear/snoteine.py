"""The snow crab gear (havsteget H3d1, docs/planer/havsteget-h3-snokrabbe.md, 07.11.2026), built in Blender:

    kon, kontopp, konlag, konlag11
                the conical snow crab pot as it is fished in the Barents Sea (HI, Rapport fra havforskningen 2023-51, read: «konisk,
                stålramme og notlin, inngangen på toppen og tømming i bunnen»; the mesh about 135 mm, HI 2025-52): a heavy bottom ring
                1.30 m across, a top ring 0.70 m across, 0.60 m high (the sizes and the 14.5 kg are search snippets, kap. 2b), eight bars
                between them, the diamond netting over the cone, the netting funnel from the top ring down to the white entrance ring,
                the perforated bait box hanging under it, the bottom laced shut with a rope (it is emptied through the bottom), the
                escape opening of høstingsforskriften vedlegg 3 f (an opening of at least 20 cm in the side, its lower edge 10-40 cm over
                the bottom ring, laced with cotton yarn of at most 5 mm that rots if the pot is lost: here 22 cm, 12 cm over the ring), and
                the registration mark on its tag in the side's upper half (§ 66, since 1.1.2024). The whole pot (kon), the one on top of a
                stack (kontopp, its bottom hidden), and the nested ones under it (konlag, and eleven at once: konlag11): they nest 0.16 m
                apart, twelve to a stack (2.36 m). From the middle of its bottom.
    haler       the pot hauler at the bulwark under the portal (a hydraulic sheave hauler: the pedestal's yoke, the motor, the hoses, the
                stripper and the guide rollers the line comes in by); from its foot on its pedestal. Bought with the vessel's gear, so it
                is not in the hull (CLAUDE.md, 18.10.2026): the game sets it on anchors.hauler.
    haler_skive the hauler's V-sheave, 0.9 m across, from its axle (along the ship: it turns about the game's z)
    blase       the buoy at a string's end (an inflatable A-buoy 0.8 m across, orange, the band round it white where the registration
                mark is written, høstingsforskriften § 66 for the vak: «merkes om det brukes»); from the middle of its bottom eye
    boye        the marker buoy at the string's other end: a float with a pole, its flag, the radar reflector and the light; from the
                float's bottom

What I chose myself (no drawings): the netting's dark blue, the entrance ring and the bait box white with an orange lid, the cotton yarn
undyed, the tag yellow; the hauler's sheave 0.9 m and its pedestal; the buoy's 0.8 m and the pole's 3 m. No maker's name anywhere.

    pip install bpy==4.5.4   (Python 3.11)
    python3 tools/gear/snoteine.py          -> src/data/gear-snoteine.b64, renders in tools/gear/out/
    python3 tools/gear/snoteine.py fast     -> without the renders

Frames. Here in Blender: x to the right (out over the side for the hauler), y forward, z up. The game's: x right, y up, z aft;
to_game(p) = (x, z, -y)."""
import os, sys, math, base64
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))
sys.path.insert(0, os.path.join(ROOT, 'tools', 'boats'))
import bpy, bmesh
from bpyutil import *
import fittings as F

OUT = os.path.join(HERE, 'out')
def to_game(p): return (p[0], p[2], -p[1])
def to_game_n(n): return (n[0], n[2], -n[1])
def g(p): return [round(v, 4) for v in to_game(p)]

C = {}
def colours():
    w = lambda n, rgb, gl=0.4, metal=0.0: C.__setitem__(n, mat('sn_' + n, rgb, gl, metal=metal))
    w('bar', (0.10, 0.10, 0.11), 0.35, 0.3); w('net', (0.09, 0.20, 0.32), 0.15); w('net2', (0.07, 0.15, 0.24), 0.15); w('inside', (0.025, 0.045, 0.06), 0.1)
    w('ring', (0.88, 0.87, 0.82), 0.4); w('bait', (0.92, 0.92, 0.88), 0.3); w('baitlid', (0.95, 0.55, 0.10), 0.4); w('rope', (0.85, 0.70, 0.22), 0.2)
    w('cotton', (0.86, 0.80, 0.66), 0.1); w('tag', (0.96, 0.80, 0.10), 0.45); w('ink', (0.05, 0.05, 0.06), 0.4)
    w('galv', (0.62, 0.64, 0.66), 0.5, 0.6); w('steel', (0.72, 0.74, 0.76), 0.75, 0.75); w('dark', (0.12, 0.13, 0.14), 0.35); w('blue', (0.08, 0.22, 0.62), 0.5)
    w('hose', (0.08, 0.08, 0.09), 0.3); w('rubber', (0.05, 0.05, 0.055), 0.15); w('yellow', (0.95, 0.72, 0.06), 0.5); w('white', (0.90, 0.89, 0.85), 0.45)
    w('orange', (0.95, 0.36, 0.05), 0.5); w('red', (0.80, 0.08, 0.06), 0.5); w('lamp', (1.0, 0.95, 0.75), 0.8)

# ---------- the pot ----------
KR0, KR1, KH = 0.65, 0.35, 0.60          # the bottom ring's and the top ring's radius, the height (130/70/60 cm)
KRE, KZE = 0.22, 0.38                    # the entrance ring's radius and height
KP, KS = 0.16, 12                        # nested pitch, pots to a stack
ESC = (0.0, 0.12 + 0.11, 0.11)           # the escape opening: its angle round the pot, its middle's height (lower edge 12 cm over the ring), radius
TAG = (math.pi / 2, 0.42)                # the registration mark's tag: its angle and height (the side's upper half, § 66)
def kr(z): return KR0 + (KR1 - KR0) * z / KH
def ring_at(a, z, r=None, d=0.0):
    r = (kr(z) if r is None else r) + d; return (r * math.cos(a), r * math.sin(a), z)
def cone_n(a): return (math.cos(a) * KH, math.sin(a) * KH, KR0 - KR1)

def strip(A, P, Q, w, m, nrm):
    """a flat strip w wide from P to Q facing nrm (a twine of the netting, drawn flat: it reads as a line and costs two triangles)"""
    P, Q, n = V(P), V(Q), V(nrm).normalized(); s = (Q - P).cross(n).normalized() * (w / 2)
    A.poly([P - s, Q - s, Q + s, P + s], m, n)

def in_escape(a, z):
    """whether a point of the cone lies in the escape opening (its netting is cut away there; the yarn laces it)"""
    ea, ez, er = ESC; x = (a - ea) * kr(z); return math.hypot(x, (z - ez) * 1.08) < er

def netting(A, z0, z1, nd=28, rows=7, w=0.006, cut=True):
    """the diamond mesh over the cone between z0 and z1: two families of twines winding up the cone each way (135 mm meshes)"""
    turn = 2 * math.pi / nd
    for fam in (1, -1):
        for k in range(nd):
            pts = []
            for i in range(rows + 1):
                t = i / rows; z = z0 + (z1 - z0) * t; a = 2 * math.pi * k / nd + fam * turn * t * rows * 0.5
                pts.append((a, z))
            for (a0, za), (a1, zb) in zip(pts, pts[1:]):
                if cut and (in_escape(a0, za) or in_escape(a1, zb)): continue
                am = (a0 + a1) / 2; strip(A, ring_at(a0, za, d=0.004), ring_at(a1, zb, d=0.004), w, C['net'], cone_n(am))

def kon(A, bottom=True, nd=28, rows=7, fine=True, lite=False):
    """a whole pot (lite: the one on top of a stack, drawn many times: fewer facets)"""
    m = C['bar']
    F.atorus(A, (0, 0, 0.02), (0, 0, 1), KR0, 0.02, lambda a: m, seg=20 if lite else 32, rseg=3 if lite else 5)
    F.atorus(A, (0, 0, KH), (0, 0, 1), KR1, 0.012, lambda a: m, seg=14 if lite else 24, rseg=3 if lite else 4)
    for k in range(8):
        a = 2 * math.pi * k / 8 + 0.2; acyl(A, ring_at(a, 0.02, KR0), ring_at(a, KH, KR1), 0.010, lambda z: m, seg=5, cap=False)
    netting(A, 0.035, KH - 0.01, nd, rows)
    # the dark inside seen through the netting (the pots under it in a stack, the deck under a lone one), with the escape opening's hole
    q = 16 if lite else 24
    for k in range(q):
        a0, a1 = 2 * math.pi * k / q, 2 * math.pi * (k + 1) / q
        zs = [0.04, 0.12, 0.34, KH - 0.02] if not lite else ([0.04, 0.12, 0.34, KH - 0.02] if abs(((a0 + a1) / 2 - ESC[0] + math.pi) % (2 * math.pi) - math.pi) < 0.6 else [0.04, KH - 0.02])
        for za, zb in zip(zs, zs[1:]):
            if fine and in_escape((a0 + a1) / 2, (za + zb) / 2) and za >= 0.12 and zb <= 0.34: continue
            A.poly([ring_at(a0, za, d=-0.012), ring_at(a1, za, d=-0.012), ring_at(a1, zb, d=-0.012), ring_at(a0, zb, d=-0.012)], C['inside'], (math.cos((a0 + a1) / 2), math.sin((a0 + a1) / 2), 0.45))
    # the entrance: the funnel of netting from the top ring down to the white entrance ring
    F.atorus(A, (0, 0, KZE), (0, 0, 1), KRE, 0.012, lambda a: C['ring'], seg=14 if lite else 20, rseg=3)
    for k in range(10 if lite else 14):
        a = 2 * math.pi * k / 14
        strip(A, ring_at(a, KH - 0.005, KR1 - 0.005), ring_at(a + 0.15, KZE + 0.005, KRE + 0.005), 0.006, C['net2'], (math.cos(a), math.sin(a), -0.6))
    for z in ((KH + KZE) / 2,) if lite else (KH - 0.08, (KH + KZE) / 2):
        rr = KRE + (KR1 - KRE) * (z - KZE) / (KH - KZE); F.atorus(A, (0, 0, z), (0, 0, 1), rr, 0.003, lambda a: C['net2'], seg=18, rseg=3)
    # the bait box (perforated, white with an orange lid) hanging on three lines under the entrance ring, squid in it
    abox(A, -0.07, 0.07, -0.05, 0.05, 0.13, 0.27, C['bait'])
    abox(A, -0.075, 0.075, -0.055, 0.055, 0.27, 0.29, C['baitlid'])
    if fine:
        for k in range(4):
            for j in range(3): abox(A, -0.055 + 0.04 * k - 0.006, -0.055 + 0.04 * k + 0.006, -0.051, -0.049, 0.16 + 0.035 * j, 0.172 + 0.035 * j, C['dark'])
    for k in range(3):
        a = 2 * math.pi * k / 3 + 0.5; acyl(A, (0.05 * math.cos(a), 0.04 * math.sin(a), 0.29), ring_at(a, KZE, KRE), 0.003, lambda z: C['rope'], seg=3, cap=False)
    # the escape opening: its rim of netting knotted round, the cotton yarn laced across it in a zigzag (vedlegg 3 f)
    ea, ez, er = ESC
    if fine:
        rim = []
        for k in range(17):
            t = 2 * math.pi * k / 16; z = ez + er * math.sin(t) / 1.08; a = ea + er * math.cos(t) / kr(z); rim.append(ring_at(a, z, d=0.006))
        F.pipe(A, rim, 0.006, C['net'], 5)
        for k in range(9):
            z = ez - er * 0.85 + er * 1.7 * k / 8; hw = math.sqrt(max(0.0, er * er - ((z - ez) * 1.08) ** 2)) / kr(z) * 0.95
            z2 = ez - er * 0.85 + er * 1.7 * (k + 0.5) / 8; hw2 = math.sqrt(max(0.0, er * er - ((z2 - ez) * 1.08) ** 2)) / kr(z2) * 0.95
            if k < 8: F.pipe(A, [ring_at(ea - hw, z, d=0.007), ring_at(ea + hw2, z2, d=0.007)], 0.0025, C['cotton'], 4)
            if k < 8: F.pipe(A, [ring_at(ea + hw2, z2, d=0.007), ring_at(ea - hw, z + er * 1.7 / 8, d=0.007)], 0.0025, C['cotton'], 4)
    # the registration mark's tag zip-tied to the netting (the letters drawn as dark marks: the game does not write the mark this small)
    ta, tz = TAG; c = V(ring_at(ta, tz, d=0.012)); n = V(cone_n(ta)).normalized(); s = V((-math.sin(ta), math.cos(ta), 0)); u = n.cross(s).normalized()
    obox(A, c, s * 0.07, u * 0.035, n * 0.002, C['tag'])
    if fine:
        for k in range(5): obox(A, c + s * (-0.05 + 0.025 * k) + n * 0.0025, s * 0.008, u * 0.014, n * 0.0006, C['ink'])
        acyl(A, c + s * 0.07, c + s * 0.09 - n * 0.01, 0.003, lambda z: C['dark'], seg=3)
    # the bridle over the top to the ring the main line is made fast in, 0.30 m over the top ring
    for k in range(3):
        a = 2 * math.pi * k / 3; acyl(A, ring_at(a, KH, KR1), (0, 0, KH + 0.28), 0.005, lambda z: C['rope'], seg=4, cap=False)
    F.atorus(A, (0, 0, KH + 0.30), (1, 0, 0), 0.03, 0.006, lambda a: C['galv'], seg=12, rseg=3)
    if bottom:
        # the bottom's netting with its laced opening (the pot is emptied through it)
        for k in range(16):
            a = 2 * math.pi * k / 16; strip(A, (0.17 * math.cos(a), 0.17 * math.sin(a), 0.008), (KR0 * math.cos(a), KR0 * math.sin(a), 0.008), 0.006, C['net'], (0, 0, -1))
        for r in (0.34, 0.50): F.atorus(A, (0, 0, 0.008), (0, 0, 1), r, 0.003, lambda a: C['net'], seg=24, rseg=3)
        F.atorus(A, (0, 0, 0.008), (0, 0, 1), 0.17, 0.008, lambda a: C['rope'], seg=20, rseg=3)

def kon_lag(A, z0):
    """a pot nested under another, at z0: its bottom ring and the band of its cone below the next one's ring (dark, with the netting's
    diamonds as flat strips over it), the escape opening's yarn showing where it falls in the band"""
    m = C['bar']; q = 16; P = lambda a, z, d=0.0: (kr(z) * math.cos(a) * (1 + d), kr(z) * math.sin(a) * (1 + d), z0 + z)
    F.atorus(A, (0, 0, z0 + 0.02), (0, 0, 1), KR0, 0.02, lambda a: m, seg=16, rseg=3)
    for k in range(q):
        a0, a1 = 2 * math.pi * k / q, 2 * math.pi * (k + 1) / q; nm = (math.cos((a0 + a1) / 2), math.sin((a0 + a1) / 2), 0.48)
        A.poly([P(a0, 0.035), P(a1, 0.035), P(a1, KP + 0.035), P(a0, KP + 0.035)], C['inside'], nm)
        A.poly([P(a0, 0.035, 0.006), P(a1, KP + 0.035, 0.006), P(a1 + 0.014, KP + 0.035, 0.006), P(a0 + 0.014, 0.035, 0.006)], C['net'], nm)
        A.poly([P(a1, 0.035, 0.006), P(a0, KP + 0.035, 0.006), P(a0 + 0.014, KP + 0.035, 0.006), P(a1 + 0.014, 0.035, 0.006)], C['net'], nm)


# ---------- the hauler ----------
HZ = 0.95                                # the sheave's axle over the hauler's foot
HR = 0.45                                # the sheave's radius
def haler():
    A = Acc('haler'); w = C['white']
    abox(A, -0.30, 0.30, -0.30, 0.30, 0.0, 0.04, C['galv'])                 # the foot plate
    acyl(A, (0, 0, 0.04), (0, 0, 0.55), 0.14, lambda z: C['blue'], seg=16)  # the slewing column
    acyl(A, (0, 0, 0.50), (0, 0, 0.58), 0.22, lambda z: C['dark'], seg=18)
    for sg in (1, -1):                                                       # the yoke's two arms up to the axle, either side of the sheave
        beam(A, (0.0, sg * 0.20, 0.58), (0.10, sg * 0.20, HZ), 0.12, 0.08, C['blue'], up=(1, 0, 0))
    acyl(A, (0.10, -0.26, HZ), (0.10, 0.26, HZ), 0.05, lambda z: C['steel'], seg=12)                     # the axle
    acyl(A, (0.10, 0.20, HZ), (0.10, 0.42, HZ), 0.15, lambda z: C['blue'], seg=16)                      # the hydraulic motor
    acyl(A, (0.10, 0.42, HZ), (0.10, 0.46, HZ), 0.10, lambda z: C['dark'], seg=14)
    F.pipe(A, [(0.10, 0.46, HZ + 0.05), (0.05, 0.55, HZ - 0.2), (-0.10, 0.45, 0.35), (-0.25, 0.30, 0.05)], 0.018, C['hose'], 6)
    F.pipe(A, [(0.10, 0.46, HZ - 0.05), (0.15, 0.56, HZ - 0.3), (-0.05, 0.40, 0.30), (-0.25, 0.22, 0.05)], 0.018, C['hose'], 6)
    # the stripper that takes the line out of the sheave's groove, and the guide with two vertical rollers the line comes in by
    beam(A, (0.10 - 0.10, 0.0, HZ - 0.40), (-0.30, 0.0, HZ - 0.55), 0.06, 0.05, C['steel'])
    abox(A, 0.42, 0.62, -0.18, 0.18, HZ + HR - 0.05, HZ + HR + 0.02, C['steel'])
    for sg in (1, -1): acyl(A, (0.52, sg * 0.08, HZ + HR - 0.30), (0.52, sg * 0.08, HZ + HR - 0.05), 0.04, lambda z: C['rubber'], seg=10)
    beam(A, (0.10, 0.20, HZ + 0.1), (0.52, 0.16, HZ + HR - 0.04), 0.06, 0.06, C['blue'])
    return A.done(35)

def haler_skive():
    """the V-sheave from its axle, in the y = 0 plane (the axle along y)"""
    A = Acc('haler_skive'); n = 32
    def disc(y0, y1, r0, r1, m):
        rings = [[(r * math.cos(2 * math.pi * k / n), y, r * math.sin(2 * math.pi * k / n)) for k in range(n)] for y, r in ((y0, r0), (y1, r1))]
        F.loft(A, rings, lambda i: m, cap0=False, cap1=False, out=lambda mid, cc: V((mid.x, 0, mid.z)))
    disc(-0.10, -0.03, HR, HR - 0.12, C['steel']); disc(0.03, 0.10, HR - 0.12, HR, C['steel'])
    disc(-0.03, 0.03, HR - 0.12, HR - 0.12, C['rubber'])
    for y in (-0.10, 0.10):
        rings = [[(r * math.cos(2 * math.pi * k / n), y, r * math.sin(2 * math.pi * k / n)) for k in range(n)] for r in (HR, 0.07)]
        F.loft(A, rings, lambda i: C['blue'], cap0=False, cap1=False, out=lambda mid, cc, y=y: V((0, y, 0)))
    for k in range(6):   # the spokes' bolts on the face, so the turning shows
        a = 2 * math.pi * k / 6; acyl(A, (0.24 * math.cos(a), -0.105, 0.24 * math.sin(a)), (0.24 * math.cos(a), -0.12, 0.24 * math.sin(a)), 0.025, lambda z: C['yellow'], seg=8)
    acyl(A, (0, -0.13, 0), (0, 0.13, 0), 0.08, lambda z: C['dark'], seg=12)
    return A.done(40)


# ---------- the marks at the string's ends ----------
BR_ = 0.40                               # the buoy's radius
BAND = (0.28, 0.52)                      # the white band where the mark is written (heights over the bottom eye)
def blase():
    A = Acc('blase'); n = 32
    prof = [(0.0, 0.10), (0.18, 0.12), (0.30, 0.18), (0.38, 0.30), (0.40, 0.42), (0.38, 0.55), (0.30, 0.68), (0.17, 0.76), (0.0, 0.79)]
    for (r0, z0), (r1, z1) in zip(prof, prof[1:]):
        for k in range(n):
            a0, a1 = 2 * math.pi * k / n, 2 * math.pi * (k + 1) / n
            zm = (z0 + z1) / 2; m = C['white'] if BAND[0] <= zm <= BAND[1] else C['orange']
            P = lambda a, r, z: (r * math.cos(a), r * math.sin(a), z)
            A.poly([P(a0, r0, z0), P(a1, r0, z0), P(a1, r1, z1), P(a0, r1, z1)], m, (math.cos((a0 + a1) / 2), math.sin((a0 + a1) / 2), (z0 + z1) / 2 - 0.44))
    for z in (0.10, 0.79):   # the eyes, the rope's ends
        F.atorus(A, (0, 0, z - 0.04 if z < 0.5 else z + 0.04), (1, 0, 0), 0.045, 0.012, lambda a: C['orange'], seg=12, rseg=4)
    acyl(A, (0, 0, -0.30), (0, 0, 0.06), 0.012, lambda z: C['rope'], seg=6)
    return A.done(50)

def boye():
    """a marker buoy: the float, the pole through it with the counterweight under, the flag, the radar reflector, the light on top"""
    A = Acc('boye'); n = 20
    acyl(A, (0, 0, 0.0), (0, 0, 0.40), 0.28, lambda z: C['orange'], seg=n)
    acyl(A, (0, 0, 0.40), (0, 0, 0.46), 0.22, lambda z: C['orange'], seg=n)
    acyl(A, (0, 0, -0.9), (0, 0, 3.0), 0.025, lambda z: C['yellow'], seg=8)
    acyl(A, (0, 0, -0.9), (0, 0, -0.6), 0.07, lambda z: C['dark'], seg=10)
    # the flag on the pole's top, the radar reflector under it, the light
    A.poly([(0.0, 0.0, 2.95), (0.0, 0.0, 2.45), (0.55, 0.0, 2.55), (0.55, 0.0, 2.92)], C['orange'], (0, -1, 0))
    A.poly([(0.0, 0.0, 2.95), (0.55, 0.0, 2.92), (0.55, 0.0, 2.55), (0.0, 0.0, 2.45)], C['orange'], (0, 1, 0))
    for k in range(3):
        a = 2 * math.pi * k / 3; d = V((math.cos(a), math.sin(a), 0)) * 0.16
        A.poly([(0, 0, 1.85), (d.x, d.y, 2.0), (0, 0, 2.15)], C['galv'], (-d.y, d.x, 0)); A.poly([(0, 0, 1.85), (0, 0, 2.15), (d.x, d.y, 2.0)], C['galv'], (d.y, -d.x, 0))
    acyl(A, (0, 0, 3.0), (0, 0, 3.10), 0.05, lambda z: C['lamp'], seg=10)
    return A.done(45)


def main():
    os.makedirs(OUT, exist_ok=True)
    reset(); colours()
    A = Acc('kon'); kon(A); Ko = A.done(40)
    A = Acc('kontopp'); kon(A, bottom=False, nd=16, rows=4, lite=True); Kt = A.done(40)
    A = Acc('konlag'); kon_lag(A, 0.0); Kl = A.done(40)
    A = Acc('konlag11'); [kon_lag(A, k * KP) for k in range(KS - 1)]; Kl11 = A.done(40)
    H = haler(); Hs = haler_skive(); B = blase(); Bo = boye()
    sk = lambda p: (p[0] - 0.10, p[1], p[2] - HZ)     # (the sheave's own frame: from its axle)
    parts = [(nm, mesh_arrays(o, to_game, to_game_n, ao=False), 1.0) for nm, o in (('kon', Ko), ('kontopp', Kt), ('konlag', Kl), ('konlag11', Kl11), ('haler', H), ('blase', B), ('boye', Bo))]
    parts.insert(5, ('haler_skive', mesh_arrays(Hs, to_game, to_game_n, ao=False), 1.0))
    # the band's strip round the buoy where the game writes the registration mark (two rows round it, as the lifebuoys' text)
    rb = lambda z: 0.40 - 0.002 if 0.30 < z < 0.55 else 0.38
    ring_pts = lambda z: [g((rb(z) * 1.01 * math.cos(math.pi * 0.25 + math.pi * 0.5 * k / 12), rb(z) * 1.01 * math.sin(math.pi * 0.25 + math.pi * 0.5 * k / 12), z)) for k in range(13)]
    ex = {'frame': 'kystfiske snow crab gear: x right (out over the side for the hauler), y up, z aft; the pots from the middle of their bottoms, the hauler from its foot, its sheave from its axle (along z), the buoys from their bottoms',
          # the conical pot (the same keys as gear-pot's kon, which this replaces when it is in the page)
          'kon': {'r': KR0, 'h': KH, 'pitch': KP, 'stack': KS, 'ring': 0.30, 'top': KR1, 'bridle': [g(ring_at(2 * math.pi * k / 3, KH, KR1)) for k in range(3)],
                  'entrance': g((0, 0, KZE)), 'bait': g((0, 0, 0.20)), 'escape': {'at': g(ring_at(ESC[0], ESC[1])), 'r': ESC[2], 'lower': round(ESC[1] - ESC[2] - 0.02, 3)},
                  'tag': g(ring_at(TAG[0], TAG[1])), 'mesh': 0.135, 'kg': 14.5},
          'haler': {'axle': g((0.10, 0.0, HZ)), 'R': HR, 'in': g((0.52, 0.0, HZ + HR)), 'out': g((-0.35, 0.0, HZ - 0.6))},
          'blase': {'r': BR_, 'h': 0.79, 'eye': g((0, 0, 0.06)), 'band': list(BAND), 'strip_top': ring_pts(0.49), 'strip_bot': ring_pts(0.31)},
          'boye': {'h': 3.1, 'light': g((0, 0, 3.05)), 'flag': g((0.3, 0, 2.7))}}
    glb = os.path.join(OUT, 'gear-snoteine.glb'); n = write_glb(glb, parts, ex)
    open(os.path.join(ROOT, 'src', 'data', 'gear-snoteine.b64'), 'w').write(base64.b64encode(open(glb, 'rb').read()).decode())
    print('snow crab gear GLB %.1f KB, %s' % (n / 1024, ', '.join('%s %d' % (p[0], len(p[1]['idx']) // 3) for p in parts)))
    if 'fast' in sys.argv: return
    # renders: a pot on its own seen from the side of its escape opening, a stack of twelve, the hauler, the buoys
    Ko.location = (0, 0, 0); Ko.rotation_euler = (0, 0, -math.pi / 2 + 0.35)
    Kl11.location = (1.8, 0.6, 0); Kt2 = Kt.copy(); Kt2.data = Kt.data.copy(); bpy.context.collection.objects.link(Kt2); Kt2.location = (1.8, 0.6, (KS - 1) * KP); Kt.hide_render = True
    H.location = (-1.6, 0.8, 0); Hs.location = (-1.6 + 0.10, 0.8, HZ); B.location = (-1.0, -1.2, 0); Bo.location = (-2.2, -1.0, 0)
    setup_render(1600, 1000, samples=32)
    camera((3.8, -5.6, 2.6), (0.2, 0.2, 0.9), lens=35); render(os.path.join(OUT, 'sno_3q.png'))
    camera((0.25, -1.9, 0.55), (0.0, 0.0, 0.30), lens=40); render(os.path.join(OUT, 'sno_escape.png'))
    camera((0.0, -0.3, 2.6), (0.0, 0.0, 0.0), ortho=1.6); render(os.path.join(OUT, 'sno_top.png'))

if __name__ == '__main__':
    main()
