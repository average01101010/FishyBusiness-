"""The king crab pot, the pot hauler on its davit and the live crab tank, built in Blender (the user's wish 04.10.2026: «Lager du
blender-modeller av teiner og kongekrabbe? Og animasjoner for haling av teiner»). In the game the pots come up on the rope over the
davit's block, swing in over the rail, are opened and emptied into the tank, baited and stacked; when setting they go over the side
(drawGearOp in view3d.js).

    teine       a king crab pot as they are fished west of 26° E: a square frame of steel bar 1.4 x 1.4 m and 0.65 m high, covered in
                netting, with a netting funnel (the entrance) in two opposite sides, a perforated bait box hanging in the middle and
                a hatch in the top to empty it by; no escape vent (J-138-2026 § 5). From the middle of its bottom.
    teinedor    the hatch, 0.6 x 0.6 m, from its hinge (along x, at the forward edge; it opens about x)
    davit       the pot hauler: a post at the rail with a curved arm out over the side and a block at its end, the hydraulic hauler's
                motor and hoses on the post. From the foot of the post on deck.
    davitskive  the hauler's V-sheave, from its axle (along the boat, so it turns about z in the game)
    krabbekar   the live crab tank: a blue insulated tub with running sea water, a pump hose over its rim. From the middle of its bottom.

What I chose myself (no drawings): the pot's measures are of the common square king crab pot (about 140 x 140 x 65 cm); the colours
(black bar, dark green netting, a white bait box), the davit's height and reach (the block 2.1 m over the deck and 0.9 m outside the
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

OUT = os.path.join(HERE, 'out')
def to_game(p): return (p[0], p[2], -p[1])
def to_game_n(n): return (n[0], n[2], -n[1])
def rel(o):
    o.location = (0, 0, 0); return o

C = {}
def colours():
    C['bar'] = mat('bar', (0.10, 0.10, 0.11), 0.35, metal=0.3)
    C['net'] = mat('net', (0.10, 0.26, 0.16), 0.15)
    C['funnel'] = mat('funnel', (0.16, 0.34, 0.20), 0.15)
    C['ring'] = mat('ring', (0.80, 0.78, 0.70), 0.4)
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

PX, PZ = 0.7, 0.65           # the pot's half width and height
HATCH = 0.3                  # the hatch's half width
ENT = (0.25, 0.20, 0.42)     # the entrances: half width, bottom and top of the opening in the side

def net_line(name, a, b, parts, m=None):
    parts.append(cyl(name, a, b, 0.0035, m or C['net'], seg=3, caps=False))

def clip(a0, a1, holes):
    """the pieces of the span a0..a1 outside the holes [(h0, h1)]"""
    out = [(a0, a1)]
    for h0, h1 in holes:
        nxt = []
        for s0, s1 in out:
            if h1 <= s0 or h0 >= s1: nxt.append((s0, s1)); continue
            if s0 < h0: nxt.append((s0, h0))
            if h1 < s1: nxt.append((h1, s1))
        out = nxt
    return out

def teine():
    parts = []; r = 0.012; m = C['bar']
    # the frame: bottom and top squares, the corner posts and a bar across the bottom
    corners = [(-PX, -PX), (PX, -PX), (PX, PX), (-PX, PX)]
    for z in (0.0, PZ):
        parts.append(tube('frame', [(x, y, z) for x, y in corners] + [(corners[0][0], corners[0][1], z)], r, m, seg=6))
    for x, y in corners: parts.append(cyl('post', (x, y, 0), (x, y, PZ), r, m, seg=6))
    parts.append(cyl('bar', (-PX, 0, 0), (PX, 0, 0), r, m, seg=6)); parts.append(cyl('bar', (0, -PX, 0), (0, PX, 0), r, m, seg=6))
    # the hatch's frame in the top
    parts.append(tube('hframe', [(-HATCH, -HATCH, PZ), (HATCH, -HATCH, PZ), (HATCH, HATCH, PZ), (-HATCH, HATCH, PZ), (-HATCH, -HATCH, PZ)], 0.009, m, seg=6))
    st = 0.14; ks = [k * st for k in range(-4, 5)]
    # the netting: the bottom whole, the top round the hatch, the sides with the entrances in the two at x = +-PX
    for k in ks:
        net_line('nb', (k, -PX, 0.002), (k, PX, 0.002), parts); net_line('nb', (-PX, k, 0.002), (PX, k, 0.002), parts)
        for y0, y1 in clip(-PX, PX, [(-HATCH, HATCH)] if abs(k) < HATCH else []): net_line('nt', (k, y0, PZ), (k, y1, PZ), parts)
        for x0, x1 in clip(-PX, PX, [(-HATCH, HATCH)] if abs(k) < HATCH else []): net_line('nt', (x0, k, PZ), (x1, k, PZ), parts)
    zs = [PZ * i / 5 for i in range(1, 5)]
    for sd in (1, -1):
        # the sides at y = +-PX: whole
        for k in ks: net_line('ns', (k, sd * PX, 0), (k, sd * PX, PZ), parts)
        for z in zs: net_line('ns', (-PX, sd * PX, z), (PX, sd * PX, z), parts)
        # the sides at x = +-PX: with the entrance's opening
        for k in ks:
            for z0, z1 in clip(0, PZ, [(ENT[1], ENT[2])] if abs(k) < ENT[0] else []): net_line('ns', (sd * PX, k, z0), (sd * PX, k, z1), parts)
        for z in zs:
            for y0, y1 in clip(-PX, PX, [(-ENT[0], ENT[0])] if ENT[1] < z < ENT[2] else []): net_line('ns', (sd * PX, y0, z), (sd * PX, y1, z), parts)
        # the entrance: a bar round the opening, a netting funnel in to a hard ring 0.35 m inside, a little higher (the crab climbs in)
        o = [(sd * PX, -ENT[0], ENT[1]), (sd * PX, ENT[0], ENT[1]), (sd * PX, ENT[0], ENT[2]), (sd * PX, -ENT[0], ENT[2])]
        xi = sd * (PX - 0.35); i = [(xi, -0.15, 0.30), (xi, 0.15, 0.30), (xi, 0.15, 0.40), (xi, -0.15, 0.40)]
        parts.append(tube('eframe', o + [o[0]], 0.008, m, seg=6)); parts.append(tube('ering', i + [i[0]], 0.007, C['ring'], seg=6))
        for q in range(4):
            a, b = V(o[q]), V(o[(q + 1) % 4]); c, d = V(i[q]), V(i[(q + 1) % 4])
            for t in (0.0, 0.33, 0.66): net_line('nf', a + (b - a) * t, c + (d - c) * t, parts, C['funnel'])
    # the bait box: a perforated tube hanging from the top's cross ropes, with an orange lid
    for sx, sy in ((1, 1), (1, -1)): net_line('hang', (-sx * PX * 0.9, -sy * PX * 0.9, PZ - 0.01), (sx * PX * 0.9, sy * PX * 0.9, PZ - 0.01), parts, C['rope'])
    parts.append(cyl('bait', (0, 0, 0.30), (0, 0, 0.52), 0.06, C['bait'], seg=10))
    for z in (0.34, 0.40, 0.46): parts.append(torus('holes', (0, 0, z), (0, 0, 1), 0.061, 0.004, C['dark'], seg=12, rseg=3))
    parts.append(cyl('blid', (0, 0, 0.52), (0, 0, 0.55), 0.065, C['baitlid'], seg=10))
    parts.append(cyl('bstring', (0, 0, 0.55), (0, 0, PZ - 0.01), 0.004, C['rope'], seg=4, caps=False))
    for p in parts: apply_all(p)
    return join(parts, 'teine')

def teinedor():
    # from its hinge at the hatch's forward edge (y = HATCH, z = PZ): the frame and its netting, a rubber strap to hold it shut
    parts = []; w = HATCH; m = C['bar']
    parts.append(tube('dframe', [(-w, 0, 0), (w, 0, 0), (w, -2 * w, 0), (-w, -2 * w, 0), (-w, 0, 0)], 0.01, m, seg=6))
    for k in range(1, 4):
        net_line('dn', (-w + k * w / 2, 0, 0.004), (-w + k * w / 2, -2 * w, 0.004), parts); net_line('dn', (-w, -k * w / 2, 0.004), (w, -k * w / 2, 0.004), parts)
    for x in (-w * 0.7, w * 0.7): parts.append(cyl('hinge', (x - 0.03, 0, 0), (x + 0.03, 0, 0), 0.016, C['galv'], seg=8))
    parts.append(cyl('strap', (0, -2 * w, 0.004), (0, -2 * w - 0.08, -0.02), 0.012, C['rubber'], seg=5))
    for p in parts: apply_all(p)
    return join(parts, 'teinedor')

# the davit: the block 2.1 m up and 0.9 m out; the hauler's sheave on the post at 1.15 m, facing along the boat
BLOCK = (0.9, 0.0, 2.1); BR = 0.11; SHEAVE = (0.16, 0.0, 1.15); SR = 0.2
def davit():
    parts = []
    parts.append(cyl('foot', (0, 0, 0), (0, 0, 0.03), 0.16, C['galv'], seg=12))
    parts.append(cyl('post', (0, 0, 0), (0, 0, 1.6), 0.07, C['galv'], seg=12))
    arm = [(0, 0, 1.55), (0.12, 0, 1.92), (0.38, 0, 2.18), (0.7, 0, 2.32), (BLOCK[0], 0, 2.32)]
    parts.append(tube('arm', arm, 0.05, C['galv'], seg=10))
    # the block hangs under the arm's end: a swivel, the cheek plates and the sheave
    parts.append(cyl('swivel', (BLOCK[0], 0, 2.32), (BLOCK[0], 0, BLOCK[2] + BR + 0.04), 0.018, C['galv'], seg=6))
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
    T = teine(); D = teinedor(); Dv = davit(); Sh = davitskive(); K = krabbekar()
    parts = [(nm, mesh_arrays(o, to_game, to_game_n, ao=False), 1.0) for nm, o in (('teine', T), ('teinedor', D), ('davit', Dv), ('davitskive', Sh), ('krabbekar', K))]
    g = lambda p: [round(v, 4) for v in to_game(p)]
    ex = {'frame': 'kystfiske king crab pot, pot hauler and crab tank: x right (out over the side for the davit), y up, z aft; the pot and the tank from the middle of their bottoms, the hatch from its hinge, the davit from the foot of its post, the sheave from its axle',
          'pot':{'half':PX, 'h':PZ, 'hinge':g((0, HATCH, PZ)), 'bridle':[g((x, y, PZ)) for x, y in ((-PX, -PX), (PX, -PX), (PX, PX), (-PX, PX))], 'bait':g((0, 0, 0.42))},
          'davit':{'block':g(BLOCK), 'blockR':BR, 'sheave':g(SHEAVE), 'sheaveR':SR},
          'tank':{'half':[TX - 0.04, TY - 0.04], 'water':TW}}
    glb = os.path.join(OUT, 'gear-pot.glb'); n = write_glb(glb, parts, ex)
    open(os.path.join(ROOT, 'src', 'data', 'gear-pot.b64'), 'w').write(base64.b64encode(open(glb, 'rb').read()).decode())
    print('gear pot GLB %.1f KB, %s' % (n / 1024, ', '.join('%s %d' % (p[0], len(p[1]['idx']) // 3) for p in parts)))
    if 'fast' in sys.argv: return
    # renders: the pot with its hatch open, the davit and the tank beside it
    D.location = (0, HATCH, PZ); D.rotation_euler = (math.radians(70), 0, 0)
    Dv.location = (2.2, 0.3, 0); Sh.location = (2.2 + SHEAVE[0], 0.3 + SHEAVE[1], SHEAVE[2]); K.location = (-2.0, 0.2, 0)
    setup_render(1600, 1000, samples=24)
    camera((4.6, -5.2, 3.2), (0.2, 0.2, 0.7), lens=35); render(os.path.join(OUT, 'pot_3q.png'))
    camera((0.0, -0.4, 4.0), (0.0, 0.0, 0.0), ortho=2.0); render(os.path.join(OUT, 'pot_top.png'))

if __name__ == '__main__':
    main()
