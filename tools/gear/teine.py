"""The king crab pot, the pot hauler on its davit and the live crab tank, built in Blender (the user's wish 04.10.2026: «Lager du
blender-modeller av teiner og kongekrabbe? Og animasjoner for haling av teiner»). In the game the pots come up on the rope over the
davit's block, swing in over the rail, are opened and emptied into the tank, baited and stacked; when setting they go over the side
(drawGearOp in view3d.js).

    kong        the conical king crab pot (OB16, Jonas 09.11.2026, «Denne typen teiner er mer plass-vennelig på alle typer båter»; the
                square pot of 1.4 m it replaces is out of the game, Jonas: «De firkantede teinene kan vi sikkert fjerne fra spillet»):
                a heavy black bottom ring 1.45 m across, a top ring 0.80 m across, 0.70 m high, 45 kg (Jonas' picture of a pot for
                sale, 09.11.2026), eight bars, green netting laced on with blue rope, the white plastic funnel with its steps from the
                top ring down into the pot, the bait jar under it, the bottom laced shut (it is emptied through it), the registration
                tag (§ 66), the bridle and the red egg float on it; no escape opening (west of 26° E none is allowed, J-138-2026).
    kongtopp    the one on top of a stack (its bottom hidden, fewer facets); konglag one nested under it, konglagfull the nine under
                the top one of a full stack of ten (0.15 m between them). From the middle of the bottom.
    davit       the pot hauler: a post at the rail with a curved arm out over the side and a block at its end, the hydraulic hauler's
                motor and hoses on the post. From the foot of the post on deck.
    davitskive  the hauler's V-sheave, from its axle (along the boat, so it turns about z in the game)
    krabbekar   the live crab tank: a blue insulated tub with running sea water, a pump hose over its rim. From the middle of its bottom.

What I chose myself (no drawings): the conical pot's funnel and nesting pitch (below), the davit's height and reach (the block 2.1 m over the deck and 0.9 m outside the
rail, so a pot clears the rail), and the tank's size (1.2 x 0.8 x 0.7 m).

    pip install bpy==4.5.4
    python3 tools/gear/teine.py          -> src/data/gear-pot.b64, renders in tools/gear/out/
    python3 tools/gear/teine.py fast     -> without the renders

Frames. Here in Blender: x to the right (out over the side for the davit), y forward, z up. The game's: x right, y up, z aft;
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
def rel(o):
    o.location = (0, 0, 0); return o

C = {}
def colours():
    C['bar'] = mat('bar', (0.10, 0.10, 0.11), 0.35, metal=0.3)
    C['net'] = mat('net', (0.03, 0.40, 0.29), 0.2)
    C['funnel'] = mat('funnel', (0.90, 0.90, 0.86), 0.45); C['funnel2'] = mat('funnel2', (0.78, 0.78, 0.74), 0.4);
    C['lace'] = mat('lace', (0.06, 0.20, 0.62), 0.3); C['egg'] = mat('egg', (0.85, 0.10, 0.12), 0.5); C['eggseam'] = mat('eggseam', (0.95, 0.85, 0.82), 0.4)
    C['tag'] = mat('tag', (0.96, 0.80, 0.10), 0.45); C['ink'] = mat('ink', (0.05, 0.05, 0.06), 0.4)
    C['bait'] = mat('bait', (0.92, 0.92, 0.88), 0.3)
    C['baitlid'] = mat('baitlid', (0.95, 0.55, 0.10), 0.4)
    C['rope'] = mat('rope', (0.85, 0.70, 0.22), 0.2)
    C['galv'] = mat('galv', (0.62, 0.64, 0.66), 0.5, metal=0.6)
    C['dark'] = mat('dark', (0.16, 0.17, 0.18), 0.35)
    C['red'] = mat('red', (0.72, 0.08, 0.06), 0.55)
    C['rubber'] = mat('rubber', (0.05, 0.05, 0.055), 0.15)
    C['blue'] = mat('blue', (0.08, 0.22, 0.62), 0.5)
    C['tank'] = mat('tank', (0.12, 0.34, 0.66), 0.45)
    C['tankin'] = mat('tankin', (0.20, 0.44, 0.72), 0.35)
    C['water'] = mat('water', (0.05, 0.20, 0.24), 0.9)
    C['hose'] = mat('hose', (0.10, 0.12, 0.13), 0.3)
    C['konin'] = mat('konin', (0.02, 0.05, 0.04), 0.1)

# ---------- the conical king crab pot (OB16, Jonas 09.11.2026) ----------
# Jonas' picture of a king crab pot for sale, 09.11.2026: «Kongekrabbeteine 145x80x70 cm, 45 kg» (a bottom ring 1.45 m across, a top
# ring 0.80 m across, 0.70 m high, 45 kg), green netting laced to the rings with blue rope, the heavy bottom ring black, and the
# entrance a white plastic funnel with steps in it from the top ring down into the pot; and a red egg float (120 x 150 mm, «brukes som
# flottør i bl.a. fisketeiner og kongekrabbeteiner») on the bridle. They nest in stacks (Jonas: «Denne typen teiner er mer
# plass-vennelig på alle typer båter»). No escape opening: west of 26° E the pots shall have none (J-138-2026, core/03e-rules.js kc5);
# east of it J-136-2026 asks for four of 150 mm, which this model does not show. The registration mark on its tag (§ 66).
# What I chose myself: the funnel's lower end 0.40 m across 0.34 m over the bottom, the nesting pitch 0.15 m (the cones and the
# funnels nest; the bait jar hangs inside the funnel of the one under it), ten to a full stack, the colours from the picture.
KR0, KR1, KH = 0.725, 0.40, 0.70
KRE, KZE = 0.20, 0.34
KP, KS = 0.15, 10
EGG = (0.06, 0.075)          # the egg float's radius and half length
def kr(z): return KR0 + (KR1 - KR0) * z / KH
def ring_at(a, z, r=None, d=0.0):
    r = (kr(z) if r is None else r) + d; return (r * math.cos(a), r * math.sin(a), z)
def cone_n(a): return (math.cos(a) * KH, math.sin(a) * KH, KR0 - KR1)
def strip(A, P, Q, w, m, nrm):
    """a flat strip w wide from P to Q facing nrm (a twine of the netting drawn flat: two triangles)"""
    P, Q, n = V(P), V(Q), V(nrm).normalized(); s = (Q - P).cross(n).normalized() * (w / 2)
    A.poly([P - s, Q - s, Q + s, P + s], m, n)
def fz(z): return KRE + (KR1 - KRE) * (z - KZE) / (KH - KZE)     # the funnel's radius at z

def kong(A, bottom=True, lite=False):
    """a whole pot (lite: the one on top of a stack, drawn many times: fewer facets, no bottom)"""
    m = C['bar']; nd, rows = (18, 4) if lite else (30, 7)
    atorus(A, (0, 0, 0.03), (0, 0, 1), KR0, 0.03, lambda a: m, seg=20 if lite else 36, rseg=4 if lite else 6)
    atorus(A, (0, 0, KH), (0, 0, 1), KR1, 0.013, lambda a: m, seg=16 if lite else 28, rseg=3 if lite else 4)
    for k in range(8):
        a = 2 * math.pi * k / 8 + 0.2; acyl(A, ring_at(a, 0.04, KR0), ring_at(a, KH, KR1), 0.011, lambda z: m, seg=5, cap=False)
    # the diamond netting over the cone, green
    turn = 2 * math.pi / nd; z0, z1 = 0.06, KH - 0.01
    for fam in (1, -1):
        for k in range(nd):
            pts = [(2 * math.pi * k / nd + fam * turn * (i / rows) * rows * 0.5, z0 + (z1 - z0) * i / rows) for i in range(rows + 1)]
            for (a0, za), (a1, zb) in zip(pts, pts[1:]): strip(A, ring_at(a0, za, d=0.004), ring_at(a1, zb, d=0.004), 0.007, C['net'], cone_n((a0 + a1) / 2))
    # the entrance: the white plastic funnel from the top ring down into the pot, in steps (the ribs), its lower lip a hard ring
    st = 3 if lite else 6; q = 18 if lite else 32
    for j in range(st):
        za, zb = KH - (KH - KZE) * j / st, KH - (KH - KZE) * (j + 1) / st
        for k in range(q):
            a0, a1 = 2 * math.pi * k / q, 2 * math.pi * (k + 1) / q; c0, s0, c1, s1 = math.cos(a0), math.sin(a0), math.cos(a1), math.sin(a1)
            ra, rb = fz(za), fz(zb) + 0.012
            A.poly([(ra * c1, ra * s1, za), (ra * c0, ra * s0, za), (rb * c0, rb * s0, zb), (rb * c1, rb * s1, zb)], C['funnel'], (-(c0 + c1) / 2, -(s0 + s1) / 2, 0.8))
            A.poly([(rb * c1, rb * s1, zb), (rb * c0, rb * s0, zb), (ra * c0, ra * s0, za), (ra * c1, ra * s1, za)], C['funnel2'], ((c0 + c1) / 2, (s0 + s1) / 2, -0.6))   # (its outside, seen through the netting)
            if j: A.poly([(ra * c1, ra * s1, za), (ra * c0, ra * s0, za), ((ra + 0.012) * c0, (ra + 0.012) * s0, za), ((ra + 0.012) * c1, (ra + 0.012) * s1, za)], C['funnel2'], (0, 0, 1))
    atorus(A, (0, 0, KZE), (0, 0, 1), KRE, 0.012, lambda a: C['funnel'], seg=16 if lite else 24, rseg=3)
    # the flange's blue lacing round the top ring
    if not lite:
        lace = [((KR1 + 0.022 * math.cos(t * 5.0)) * math.cos(t / 9), (KR1 + 0.022 * math.cos(t * 5.0)) * math.sin(t / 9), KH + 0.022 * math.sin(t * 5.0)) for t in [i * 2 * math.pi * 9 / 360 for i in range(361)]]
        F.pipe(A, lace, 0.004, C['lace'], 4)
        # and down the bars (the netting laced to them)
        for k in range(8):
            a = 2 * math.pi * k / 8 + 0.2; P0, P1 = V(ring_at(a, 0.06, d=0.012)), V(ring_at(a, KH - 0.04, d=0.012)); s = V((-math.sin(a), math.cos(a), 0)) * 0.018
            F.pipe(A, [P0 + (P1 - P0) * (i / 14) + s * (1 if i % 2 else -1) for i in range(15)], 0.003, C['lace'], 3)
    # the bait jar on three strings under the funnel
    acyl(A, (0, 0, 0.12), (0, 0, 0.28), 0.055, lambda z: C['bait'], seg=8 if lite else 10)
    acyl(A, (0, 0, 0.28), (0, 0, 0.30), 0.06, lambda z: C['baitlid'], seg=8 if lite else 10)
    for k in range(3):
        a = 2 * math.pi * k / 3; acyl(A, (0.04 * math.cos(a), 0.04 * math.sin(a), 0.30), ring_at(a, KZE, KRE), 0.003, lambda z: C['rope'], seg=3, cap=False)
    # the registration mark's tag zip-tied to the netting (§ 66)
    ta, tz = math.pi / 2, 0.48; c = V(ring_at(ta, tz, d=0.014)); n = V(cone_n(ta)).normalized(); s = V((-math.sin(ta), math.cos(ta), 0)); u = n.cross(s).normalized()
    obox(A, c, s * 0.07, u * 0.035, n * 0.002, C['tag'])
    if not lite:
        for k in range(5): obox(A, c + s * (-0.05 + 0.025 * k) + n * 0.0025, s * 0.008, u * 0.014, n * 0.0006, C['ink'])
    # the bridle over the top to the ring the line is made fast in, 0.32 m over the top ring, and the red egg float threaded on it above
    for k in range(3):
        a = 2 * math.pi * k / 3; acyl(A, ring_at(a, KH, KR1), (0, 0, KH + 0.30), 0.006, lambda z: C['rope'], seg=4, cap=False)
    atorus(A, (0, 0, KH + 0.32), (1, 0, 0), 0.03, 0.006, lambda a: C['galv'], seg=12, rseg=3)
    acyl(A, (0, 0, KH + 0.35), (0, 0, KH + 0.38), 0.008, lambda z: C['rope'], seg=4)
    egg(A, (0, 0, KH + 0.38 + EGG[1]), lite)
    if bottom:
        # the bottom's netting with its laced opening (emptied through it, the pot tipped over)
        for k in range(16):
            a = 2 * math.pi * k / 16; strip(A, (0.18 * math.cos(a), 0.18 * math.sin(a), 0.008), (KR0 * math.cos(a), KR0 * math.sin(a), 0.008), 0.007, C['net'], (0, 0, -1))
        for r in (0.36, 0.55): atorus(A, (0, 0, 0.008), (0, 0, 1), r, 0.003, lambda a: C['net'], seg=24, rseg=3)
        atorus(A, (0, 0, 0.008), (0, 0, 1), 0.18, 0.008, lambda a: C['rope'], seg=20, rseg=3)

def egg(A, c, lite=False):
    """the red egg float (120 mm across, 150 mm long) standing on its axis at c, the seam round its middle"""
    q, rr = (8, 5) if lite else (14, 8); R, H = EGG; c = V(c)
    ring = lambda i: [(c.x + R * math.sin(math.pi * i / rr) * math.cos(2 * math.pi * k / q), c.y + R * math.sin(math.pi * i / rr) * math.sin(2 * math.pi * k / q),
                       c.z - H * math.cos(math.pi * i / rr) * (1.08 if i < rr / 2 else 0.92)) for k in range(q)]
    for i in range(rr):
        L0, L1 = ring(i), ring(i + 1)
        for k in range(q):
            k1 = (k + 1) % q; P = [L0[k], L0[k1], L1[k1], L1[k]]; mid = V(P[0]) + V(P[2]); nrm = (mid * 0.5 - c)
            A.poly(P, C['egg'], nrm)
    if not lite: atorus(A, (c.x, c.y, c.z + 0.004), (0, 0, 1), R + 0.001, 0.0025, lambda a: C['eggseam'], seg=q, rseg=3)

def kong_lag(A, z0):
    """a pot nested under another, at z0: its bottom ring and the band of its cone below the next one's ring (dark, the netting's
    diamonds as flat strips over it)"""
    m = C['bar']; q = 16; P = lambda a, z, d=0.0: (kr(z) * math.cos(a) * (1 + d), kr(z) * math.sin(a) * (1 + d), z0 + z)
    atorus(A, (0, 0, z0 + 0.03), (0, 0, 1), KR0, 0.03, lambda a: m, seg=18, rseg=4)
    for k in range(q):
        a0, a1 = 2 * math.pi * k / q, 2 * math.pi * (k + 1) / q; nm = (math.cos((a0 + a1) / 2), math.sin((a0 + a1) / 2), 0.46)
        A.poly([P(a0, 0.05), P(a1, 0.05), P(a1, KP + 0.05), P(a0, KP + 0.05)], C['konin'], nm)
        A.poly([P(a0, 0.05, 0.006), P(a1, KP + 0.05, 0.006), P(a1 + 0.014, KP + 0.05, 0.006), P(a0 + 0.014, 0.05, 0.006)], C['net'], nm)
        A.poly([P(a1, 0.05, 0.006), P(a0, KP + 0.05, 0.006), P(a0 + 0.014, KP + 0.05, 0.006), P(a1 + 0.014, 0.05, 0.006)], C['net'], nm)

# the davit: the block 2.8 m up and 0.95 m out (the pot, 1.08 m to the egg float, hangs clear of the rail under it); the hauler's sheave on the post at
# 1.15 m, facing along the boat
BLOCK = (0.95, 0.0, 2.8); BR = 0.11; SHEAVE = (0.16, 0.0, 1.15); SR = 0.2
def davit():
    parts = []
    parts.append(cyl('foot', (0, 0, 0), (0, 0, 0.03), 0.16, C['galv'], seg=12))
    parts.append(cyl('post', (0, 0, 0), (0, 0, 2.3), 0.08, C['galv'], seg=12))
    for k in range(3): parts.append(box('gusset', -0.006, 0.006, -0.15, 0.15, 0.03, 0.28, C['galv'])); parts[-1].rotation_euler = (0, 0, k * math.pi / 3); apply_all(parts[-1])
    arm = [(0, 0, 2.25), (0.12, 0, 2.62), (0.4, 0, 2.9), (0.72, 0, 3.02), (BLOCK[0], 0, 3.02)]
    parts.append(tube('arm', arm, 0.055, C['galv'], seg=10))
    # the block hangs under the arm's end: a swivel, the cheek plates and the sheave
    parts.append(cyl('swivel', (BLOCK[0], 0, 3.02), (BLOCK[0], 0, BLOCK[2] + BR + 0.04), 0.018, C['galv'], seg=6))
    for sd in (1, -1): parts.append(box('cheek', BLOCK[0] - BR - 0.03, BLOCK[0] + BR + 0.03, sd * 0.035 - 0.006, sd * 0.035 + 0.006, BLOCK[2] - BR - 0.03, BLOCK[2] + BR + 0.05, C['red']))
    parts.append(cyl('bsheave', (BLOCK[0], -0.028, BLOCK[2]), (BLOCK[0], 0.028, BLOCK[2]), BR, C['dark'], seg=16))
    # the hauler: a bracket from the post, the hydraulic motor behind the sheave (aft), hoses down the post
    parts.append(box('bracket', 0.0, SHEAVE[0], -0.05, 0.05, SHEAVE[2] - 0.06, SHEAVE[2] + 0.06, C['galv']))
    parts.append(cyl('motor', (SHEAVE[0], -0.08, SHEAVE[2]), (SHEAVE[0], -0.24, SHEAVE[2]), 0.075, C['blue'], seg=12))
    parts.append(cyl('mcap', (SHEAVE[0], -0.24, SHEAVE[2]), (SHEAVE[0], -0.27, SHEAVE[2]), 0.05, C['dark'], seg=10))
    for dx in (-0.03, 0.03): parts.append(tube('hose', [(SHEAVE[0] + dx, -0.2, SHEAVE[2] - 0.07), (0.08 + dx, -0.12, SHEAVE[2] - 0.3), (0.08 + dx, -0.09, 0.4), (0.1 + dx, -0.2, 0.05)], 0.012, C['hose'], seg=6))
    # the control lever on the post
    parts.append(cyl('lever', (-0.06, 0.05, 1.0), (-0.16, 0.12, 1.22), 0.01, C['dark'], seg=6)); parts.append(sphere('knob', (-0.16, 0.12, 1.22), 0.022, C['red'], seg=8, rings=4))
    for p in parts: apply_all(p)
    return join(parts, 'davit')

def davitskive():
    # the V-sheave from its axle (along y): two flanges of steel and the black rubber V between them
    parts = []
    for sd in (1, -1): parts.append(cyl('flange', (0, sd * 0.05, 0), (0, sd * 0.065, 0), SR, C['red'], seg=24))
    parts.append(cyl('vee', (0, -0.05, 0), (0, 0.05, 0), SR * 0.78, C['rubber'], seg=24))
    for k in range(8):
        a = k * math.pi / 4; parts.append(box('rib', -0.012, 0.012, -0.05, 0.05, SR * 0.78 - 0.01, SR * 0.9, C['rubber'])); parts[-1].rotation_euler = (0, a, 0); apply_all(parts[-1])
    parts.append(cyl('hub', (0, -0.08, 0), (0, 0.08, 0), 0.04, C['dark'], seg=10))
    for p in parts: apply_all(p)
    return join(parts, 'davitskive')

# the tank: 0.8 m across the boat, 1.2 m along it, 0.7 m high; the water 0.12 m under the rim
TX, TY, TZ, TW = 0.4, 0.6, 0.7, 0.58
def krabbekar():
    parts = []; t = 0.04
    o = box('outer', -TX, TX, -TY, TY, 0, TZ, C['tank'], bevel=0.03, seg=2); parts.append(o)
    # the inside shows as a lighter tub (drawn over the outer's top) and the water
    parts.append(box('inner', -TX + t, TX - t, -TY + t, TY - t, TW - 0.001, TZ + 0.001, C['tankin']))
    parts.append(box('water', -TX + t, TX - t, -TY + t, TY - t, TW, TW + 0.004, C['water']))
    parts.append(tube('rim', [(-TX, -TY, TZ), (TX, -TY, TZ), (TX, TY, TZ), (-TX, TY, TZ), (-TX, -TY, TZ)], 0.018, C['tank'], seg=6))
    for sd in (1, -1): parts.append(box('handle', -0.12, 0.12, sd * TY - 0.015, sd * TY + 0.015, TZ - 0.12, TZ - 0.06, C['dark']))
    # the sea water hose from the deck pump over the rim, with its outlet just over the water
    parts.append(tube('hose', [(TX + 0.15, TY - 0.1, 0.02), (TX + 0.12, TY - 0.12, TZ - 0.1), (TX - 0.02, TY - 0.14, TZ + 0.08), (TX - 0.14, TY - 0.16, TZ - 0.02)], 0.02, C['hose'], seg=8))
    parts.append(box('drain', -0.03, 0.03, -TY - 0.03, -TY, 0.04, 0.1, C['dark']))
    for p in parts: apply_all(p)
    return join(parts, 'krabbekar')

def main():
    os.makedirs(OUT, exist_ok=True)
    reset(); colours()
    Dv = davit(); Sh = davitskive(); K = krabbekar()
    A = Acc('kong'); kong(A); Ko = A.done(40)
    A = Acc('kongtopp'); kong(A, bottom=False, lite=True); Kt = A.done(40)
    A = Acc('konglag'); kong_lag(A, 0.0); Kl = A.done(40)
    A = Acc('konglagfull'); [kong_lag(A, k * KP) for k in range(KS - 1)]; Klf = A.done(40)
    parts = [(nm, mesh_arrays(o, to_game, to_game_n, ao=False), 1.0) for nm, o in (('davit', Dv), ('davitskive', Sh), ('krabbekar', K),
                                                                               ('kong', Ko), ('kongtopp', Kt), ('konglag', Kl), ('konglagfull', Klf))]
    g = lambda p: [round(v, 4) for v in to_game(p)]
    ex = {'frame': 'kystfiske king crab pot, pot hauler and crab tank: x right (out over the side for the davit), y up, z aft; the pot and the tank from the middle of their bottoms, the davit from the foot of its post, the sheave from its axle',
          # the conical king crab pot: its bottom ring's and top ring's radius, its height, how much higher each nested one stands, how many
          # to a full stack (konglagfull: the ones under the top one), the ring over the top, the bridle's feet, the egg float, its kg
          'kong':{'r':KR0, 'top':KR1, 'h':KH, 'pitch':KP, 'stack':KS, 'ring':0.32, 'bridle':[g(ring_at(2 * math.pi * k / 3, KH, KR1)) for k in range(3)],
                  'entrance':g((0, 0, KZE)), 'egg':g((0, 0, KH + 0.38 + EGG[1])), 'kg':45, 'dim':[1.45, 0.80, 0.70]},
          'davit':{'block':g(BLOCK), 'blockR':BR, 'sheave':g(SHEAVE), 'sheaveR':SR},
          'tank':{'half':[TX - 0.04, TY - 0.04], 'water':TW}}
    glb = os.path.join(OUT, 'gear-pot.glb'); n = write_glb(glb, parts, ex)
    open(os.path.join(ROOT, 'src', 'data', 'gear-pot.b64'), 'w').write(base64.b64encode(open(glb, 'rb').read()).decode())
    print('gear pot GLB %.1f KB, %s' % (n / 1024, ', '.join('%s %d' % (p[0], len(p[1]['idx']) // 3) for p in parts)))
    if 'fast' in sys.argv: return
    # renders: a pot on its own, a full stack beside it (the nested ones and the top one), the davit and the tank
    Ko.location = (0, 0, 0); Klf.location = (1.8, 0.4, 0); Kt2 = Kt.copy(); Kt2.data = Kt.data.copy(); bpy.context.collection.objects.link(Kt2); Kt2.location = (1.8, 0.4, (KS - 1) * KP)
    Kt.hide_render = True; Kl.hide_render = True
    Dv.location = (-2.0, 1.2, 0); Sh.location = (-2.0 + SHEAVE[0], 1.2 + SHEAVE[1], SHEAVE[2]); K.location = (-1.6, -1.2, 0)
    setup_render(1600, 1000, samples=24)
    camera((3.6, -5.4, 2.8), (0.3, 0.2, 0.8), lens=35); render(os.path.join(OUT, 'pot_3q.png'))
    camera((0.0, -0.3, 3.0), (0.0, 0.0, 0.0), ortho=1.8); render(os.path.join(OUT, 'pot_top.png'))
    camera((1.2, -2.4, 1.1), (0.0, 0.0, 0.4), lens=40); render(os.path.join(OUT, 'pot_near.png'))

if __name__ == '__main__':
    main()
