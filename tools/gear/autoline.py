"""The autoline's own gear, built in Blender (havsteget H2d, docs/planer/havsteget-h2-autoline.md, 05.11.2026): the line hauler with
its hook cleaner that stands inside the autoliner's hauling port, and the line's small parts (the snood, the hook and the bait) that
the game draws many times over as the line goes out over the stern and comes in through the port.

The hauler is part of the autoline system that follows the boat (autoHooks, core/10-gear.js), but it is not modelled into the boat
(Jonas 18.10.2026: no gear in the boat models): the game sets it on the boat's anchor `hauler` (tools/boats/al45.py), as it sets the
coast boats' line hauler (tools/gear/haler.py).

What it is built after (no drawing; the measures are ours, in the class of the hydraulic autoline haulers on 40-60 m longliners):
    the hauling sheave   a V-groove sheave of 560 mm with rubber grip segments, on a hydraulic motor, its top 0.83 m over the port's
                         sill so the line comes up over the sill roller, round the top of the sheave and down inboard
    the pressure roller  a small roller on a sprung arm pressing the line into the groove where it leaves the sheave
    the inlet guide      two upright rollers and a lead roller on an arm out towards the port, keeping the line in the sheave's plane
    the hook cleaner     (krokrenseren) a stainless box with a brush roller across it that the line runs through after the hauler: it
                         brushes the old bait off the hooks before they go on to the magazine. Its lid is up, so the brush shows.
    the line guide       an arm with a roller that leads the line on inboard, towards the magazine behind the port's back wall
The colours (blue-grey paint, stainless, black rubber) are ours.

    the snood (forsyn)   0.45 m of light grey monofilament from the swivel clip on the mainline to the hook (autoline snoods are 0.3-0.5 m)
    the hook (krok)      an autoline hook of about 45 mm (size 12-13/0, the hook autoliners bait by machine), a ringed eye, barbed point
    the bait (agn)       a piece of squid (blekksprut, pale) or of saury (silver with a blue-black back), about 35 mm, on the hook
                         (H2a: half squid and half saury, as the fleet baits, HI-rapport 24-2013)

Parts (one GLB, src/data/gear-autoline.b64, in the page as glb-gear-autoline):
    frame      the hauler's fixed parts, from the foot of its pedestal on the floor of the port
    sheave     the hauling sheave, from its axle (turns about the game's z, the boat's length, as the coast haulers' sheaves)
    stripper   the hook cleaner's brush roller, from its axle (turns the other way)
    forsyn     the snood with its swivel clip, from the clip (on the mainline) hanging down
    krok       the hook, from its eye
    agn_b      a bait piece of squid, from its middle;  agn_s  of saury
    tom        snood and hook together, from the clip;  egnet_b / egnet_s  snood, hook and bait
and in the extras the axles, the sheave's radius, the line's path (from the sea in over the sill roller, round the sheave, through the
cleaner and on inboard to the magazine), the port (where the hull is: 1.0 m out from the foot), and the snood's length.

    pip install bpy==4.5.4
    python3 tools/gear/autoline.py          -> src/data/gear-autoline.b64, renders in tools/gear/out/
    python3 tools/gear/autoline.py fast     -> without the renders

Frames. Here in Blender: x out over the side (to the sea), y forward along the boat, z up, the foot of the pedestal at the origin.
The game's: x out over the side, y up, z aft; to_game(p) = (x, z, -y)."""
import os, sys, math, base64
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))
sys.path.insert(0, os.path.join(ROOT, 'tools', 'boats'))
import bpy, bmesh
from bpyutil import *

OUT = os.path.join(HERE, 'out')
C = {}
def colours():
    C['paint'] = mat('alpaint', (0.20, 0.33, 0.48), 0.5)          # the machinery's blue-grey paint
    C['stain'] = mat('stain', (0.78, 0.80, 0.82), 0.75, metal=0.8)
    C['steel'] = mat('steel', (0.60, 0.62, 0.64), 0.5, metal=0.6)
    C['dark'] = mat('dark', (0.13, 0.14, 0.15), 0.35)
    C['rubber'] = mat('rubber', (0.05, 0.05, 0.055), 0.15)
    C['brush'] = mat('brush', (0.12, 0.30, 0.16), 0.1)             # green nylon bristles
    C['red'] = mat('red', (0.78, 0.07, 0.05), 0.6)
    C['yellow'] = mat('yellow', (0.95, 0.72, 0.10), 0.5)
    C['hose'] = mat('hose', (0.08, 0.08, 0.09), 0.3)
    C['mono'] = mat('mono', (0.80, 0.82, 0.80), 0.6)               # the snood
    C['hook'] = mat('hook', (0.42, 0.44, 0.47), 0.8, metal=0.8)    # a tinned hook
    C['squid'] = mat('squid', (0.92, 0.82, 0.76), 0.55)
    C['squid2'] = mat('squid2', (0.66, 0.34, 0.30), 0.4)
    C['saury'] = mat('saury', (0.78, 0.80, 0.84), 0.8, metal=0.3)
    C['sauryB'] = mat('sauryB', (0.10, 0.16, 0.30), 0.6)
    C['flesh'] = mat('flesh', (0.80, 0.52, 0.46), 0.4)

def to_game(p): return (p[0], p[2], -p[1])
def to_game_n(n): return (n[0], n[2], -n[1])
def rel(o):
    g = to_game(o)
    return lambda p: tuple(a - b for a, b in zip(to_game(p), g))

def lathe(name, prof, c, m, seg=40, angle=50):
    """a body of revolution about the y axis through c: prof is [(radius, y)] from one end to the other"""
    rings = [[(c[0] + r * math.cos(2 * math.pi * k / seg), c[1] + y, c[2] + r * math.sin(2 * math.pi * k / seg)) for k in range(seg)] for r, y in prof]
    return loft_rings(name, rings, m, True, True, angle)

def plate_y(name, pts, y0, y1, m):
    """a plate in the x-z plane (points (x, z)) from y0 to y1"""
    bm = bmesh.new(); a = [bm.verts.new((x, y0, z)) for x, z in pts]; b = [bm.verts.new((x, y1, z)) for x, z in pts]
    bm.faces.new(a); bm.faces.new(list(reversed(b)))
    for i in range(len(pts)):
        j = (i + 1) % len(pts); bm.faces.new([a[i], a[j], b[j], b[i]])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return shade(obj_from_bm(name, bm, [m]), 30)

# ---------- the hauler (metres from the foot of the pedestal) ----------
PORT = 1.0                   # the hull's plating is this far out from the foot (al45.py puts the anchor there)
SILL = 0.75                  # the port's sill over the floor
ROLL = (PORT + 0.12, 0.0, SILL + 0.12)        # the sill roller's top (part of the boat)
AX = (0.30, 0.0, 1.30)       # the sheave's axle
R = 0.28                     # the sheave's radius at the rim
RG = 0.22                    # the line's radius in the groove
ST = (-0.42, 0.0, 1.20)      # the hook cleaner's brush roller
BACK = (-1.40, 0.0, 1.70)    # where the line goes on to the magazine (the port's back wall, 2.4 m in from the plating)
PR_A = math.radians(150)     # the pressure roller's place on the sheave (from +x, counter-clockwise seen from -y)

def frame():
    p = []
    m = C['paint']
    # the foot and the pedestal, a head on top carrying the motor and the fork
    p.append(box('foot', -0.28, 0.28, -0.26, 0.26, 0.0, 0.03, C['steel'], bevel=0.01))
    for x in (-0.22, 0.22):
        for y in (-0.20, 0.20): p.append(cyl('bolt', (x, y, 0.03), (x, y, 0.05), 0.016, C['steel'], seg=6))
    p.append(box('ped', -0.11, 0.11, -0.11, 0.11, 0.03, 0.92, m, bevel=0.015))
    p.append(box('head', -0.16, 0.24, -0.15, 0.15, 0.92, 1.00, m, bevel=0.01))
    # the fork either side of the sheave, from the head to the axle's bosses
    for s in (-1, 1):
        y0, y1 = sorted((s * 0.085, s * 0.105))
        p.append(plate_y('fork', [(0.0, 0.98), (0.24, 0.98), (AX[0] + 0.08, AX[2] - 0.06), (AX[0] + 0.06, AX[2] + 0.07), (AX[0] - 0.07, AX[2] + 0.07), (0.0, 1.10)], y0, y1, m))
    p.append(cyl('boss', (AX[0], 0.105, AX[2]), (AX[0], 0.125, AX[2]), 0.06, C['steel'], seg=16))
    # the hydraulic motor on the aft side of the axle, its flange and the two hoses down the pedestal to the deck
    p.append(cyl('flange', (AX[0], -0.105, AX[2]), (AX[0], -0.125, AX[2]), 0.085, m, seg=20))
    p.append(cyl('motor', (AX[0], -0.125, AX[2]), (AX[0], -0.30, AX[2]), 0.075, C['dark'], seg=20))
    p.append(box('valve', AX[0] - 0.05, AX[0] + 0.05, -0.33, -0.27, AX[2] - 0.12, AX[2] - 0.04, C['dark']))
    for k in (0, 1):
        dx = 0.03 if k else -0.03
        p.append(tube('hose', [(AX[0] + dx, -0.30, AX[2] - 0.10), (AX[0] + dx + 0.02, -0.26, AX[2] - 0.35), (0.13 + dx, -0.12, 0.80), (0.13 + dx, -0.12, 0.25), (0.30 + dx, -0.15, 0.04)], 0.013, C['hose'], seg=8))
    # the pressure roller on a sprung arm, pressing the line into the groove where it leaves the sheave on the inboard side
    pa = (AX[0] + (R + 0.035) * math.cos(PR_A), 0.0, AX[2] + (R + 0.035) * math.sin(PR_A))
    piv = (AX[0] - 0.05, 0.0, AX[2] + 0.16)
    p.append(cyl('praxle', (pa[0], -0.07, pa[2]), (pa[0], 0.07, pa[2]), 0.012, C['steel'], seg=8))
    p.append(lathe('proller', [(0.012, -0.045), (0.045, -0.04), (0.045, 0.04), (0.012, 0.045)], pa, C['rubber'], seg=20))
    for s in (-1, 1): p.append(tube('prarm', [(pa[0], s * 0.06, pa[2]), (piv[0], s * 0.06, piv[2])], 0.012, C['stain'], seg=6))
    p.append(cyl('spring', (piv[0], -0.075, piv[2]), (piv[0], 0.075, piv[2]), 0.018, C['yellow'], seg=10))
    # the inlet guide on an arm out towards the port: two upright rollers 0.12 m apart and a lead roller under them
    gx, gz = 0.80, 1.00
    for s in (-1, 1):
        p.append(tube('garm', [(0.20, s * 0.12, 0.99), (0.55, s * 0.12, 0.96), (gx + 0.06, s * 0.12, gz - 0.06)], 0.02, m, seg=6))
    p.append(cyl('lead', (gx, -0.14, gz - 0.03), (gx, 0.14, gz - 0.03), 0.045, C['rubber'], seg=16))
    for y in (-0.06, 0.06):
        p.append(cyl('guide', (gx - 0.04, y, gz - 0.02), (gx - 0.04, y, gz + 0.20), 0.028, C['rubber'], seg=12))
    p.append(tube('gbar', [(gx - 0.04, -0.09, gz + 0.21), (gx - 0.04, 0.09, gz + 0.21)], 0.012, C['stain'], seg=6))
    # the stop button on the pedestal (red mushroom on a yellow box), where the man at the port reaches it
    p.append(box('estop', 0.11, 0.17, -0.06, 0.06, 0.72, 0.84, C['yellow']))
    p.append(cyl('estopb', (0.17, 0.0, 0.78), (0.20, 0.0, 0.78), 0.035, C['red'], seg=14))
    # the hook cleaner: an open stainless box across the line's way, on two legs, the brush roller inside, the lid hinged up aft
    x0, x1, y0, y1, z0, z1 = ST[0] - 0.22, ST[0] + 0.22, -0.17, 0.17, ST[2] - 0.20, ST[2] + 0.14
    bm = bmesh.new()
    def q(a, b, c, d): bm.faces.new([bm.verts.new(v) for v in (a, b, c, d)])
    # the walls, with the slot for the line through the outboard and the inboard wall (two plates each side of the slot)
    for x in (x0, x1):
        q((x, y0, z0), (x, -0.02, z0), (x, -0.02, z1), (x, y0, z1)); q((x, 0.02, z0), (x, y1, z0), (x, y1, z1), (x, 0.02, z1))
        q((x, -0.02, z0), (x, 0.02, z0), (x, 0.02, ST[2] - 0.01), (x, -0.02, ST[2] - 0.01))
    for y in (y0, y1): q((x0, y, z0), (x1, y, z0), (x1, y, z1), (x0, y, z1))
    q((x0, y0, z0), (x1, y0, z0), (x1, y1, z0), (x0, y1, z0))
    o = obj_from_bm('cleaner', bm, [C['stain']]); solidify(o, 0.004); p.append(shade(o, 30))
    # the funnel on the outboard face where the line comes in from the sheave, and the lid hinged up on the aft side
    p.append(cyl('funnel', (x1, 0.0, ST[2]), (x1 + 0.09, 0.0, ST[2] + 0.03), 0.025, C['stain'], seg=14, r1=0.06))
    p.append(plate_y('lid', [(x0, z1), (x1, z1), (x1, z1 + 0.006), (x0, z1 + 0.006)], y0 - 0.005, y0 + 0.001, C['stain']))
    bmL = bmesh.new(); L = [bmL.verts.new(v) for v in ((x0, y0, z1), (x1, y0, z1), (x1, y0 - 0.06, z1 + 0.34), (x0, y0 - 0.06, z1 + 0.34))]
    bmL.faces.new(L); oL = obj_from_bm('lidup', bmL, [C['stain']]); solidify(oL, 0.006); p.append(shade(oL, 30))
    # the brush's motor on the outside of the forward wall, and the cleaner's legs to the floor
    p.append(cyl('bmotor', (ST[0], y1, ST[2]), (ST[0], y1 + 0.12, ST[2]), 0.05, C['dark'], seg=16))
    for x in (x0 + 0.04, x1 - 0.04):
        for y in (y0 + 0.04, y1 - 0.04): p.append(cyl('leg', (x, y, 0.0), (x, y, z0), 0.02, C['stain'], seg=8))
    p.append(box('lfoot', x0, x1, y0, y1, 0.0, 0.012, C['stain']))
    # the line guide on inboard from the cleaner, up to a roller where the line goes on to the magazine
    gb = (BACK[0] + 0.12, 0.0, BACK[2] - 0.05)
    for s in (-1, 1): p.append(tube('lguide', [(x0 - 0.02, s * 0.05, ST[2] - 0.06), ((x0 + gb[0]) / 2, s * 0.05, (ST[2] + gb[2]) / 2 - 0.08), (gb[0], s * 0.05, gb[2] - 0.05)], 0.012, C['stain'], seg=6))
    p.append(cyl('broll', (gb[0], -0.08, gb[2]), (gb[0], 0.08, gb[2]), 0.04, C['rubber'], seg=14))
    p.append(cyl('bpost', (gb[0], 0.0, 0.0), (gb[0], 0.0, gb[2] - 0.05), 0.03, C['stain'], seg=10))
    p.append(box('bfoot', gb[0] - 0.12, gb[0] + 0.12, -0.12, 0.12, 0.0, 0.012, C['stain']))
    for o in p: apply_all(o)
    return join(p, 'frame')

def sheave():
    # a V-groove sheave: the flanges, the groove's floor at RG, the rubber grip segments in the groove
    prof = [(0.06, -0.075), (R, -0.07), (R, -0.05), (RG, -0.012), (RG, 0.012), (R, 0.05), (R, 0.07), (0.06, 0.075)]
    p = [lathe('sheave', prof, AX, C['stain'], seg=48)]
    for k in range(16):   # the grip segments, which show the turning
        a = 2 * math.pi * k / 16; a1 = a + 2 * math.pi / 16 * 0.55
        rr = RG + 0.012
        bm = bmesh.new(); vs = []
        for aa in (a, a1):
            for y in (-0.03, 0.03):
                for r_ in (RG - 0.002, rr + 0.02):
                    vs.append(bm.verts.new((AX[0] + r_ * math.cos(aa), y, AX[2] + r_ * math.sin(aa))))
        bmesh.ops.convex_hull(bm, input=vs); o = obj_from_bm('grip', bm, [C['rubber']]); p.append(o)
    for k in range(5):   # lightening holes in the web, dark discs so the turning shows from the side too
        a = 2 * math.pi * k / 5; qx = AX[0] + 0.15 * math.cos(a); qz = AX[2] + 0.15 * math.sin(a)
        for s in (-1, 1): p.append(cyl('hole', (qx, s * 0.068, qz), (qx, s * 0.078, qz), 0.035, C['dark'], seg=12))
    p.append(cyl('hub', (AX[0], -0.09, AX[2]), (AX[0], 0.09, AX[2]), 0.05, C['steel'], seg=14))
    for o in p: apply_all(o)
    return join(p, 'sheave')

def stripper():
    # the brush roller: a core with rings of bristles, so it reads as a brush and its turning shows
    p = [cyl('core', (ST[0], -0.16, ST[2]), (ST[0], 0.16, ST[2]), 0.03, C['stain'], seg=12)]
    for k in range(7):
        y = -0.135 + k * 0.045
        p.append(cyl('bristle', (ST[0], y - 0.016, ST[2]), (ST[0], y + 0.016, ST[2]), 0.085, C['brush'], seg=14))
    for k in range(4):   # four dark stripes along it
        a = 2 * math.pi * k / 4; p.append(box('stripe', -0.008, 0.008, -0.15, 0.15, 0.0, 0.006, C['dark']))
        o = p[-1]; o.location = (ST[0] + 0.086 * math.cos(a), 0.0, ST[2] + 0.086 * math.sin(a)); o.rotation_euler = (0, -a + math.pi / 2, 0)
    for o in p: apply_all(o)
    return join(p, 'stripper')

def line_path():
    """the line's way: from the sea in to the sill roller, up to the inlet guide and onto the sheave on its outboard side, round over the
    top to the pressure roller, down to the cleaner's slot, through it, and on to the guide roller towards the magazine"""
    pts = [(PORT + 2.0, 0.0, -1.2), (ROLL[0], 0.0, ROLL[2] + 0.02), (0.80, 0.0, 1.0)]
    a0 = math.radians(-20)
    for k in range(0, 11):   # into the groove on the outboard side, over the top to the pressure roller
        a = a0 + (PR_A - a0) * k / 10
        pts.append((AX[0] + RG * math.cos(a), 0.0, AX[2] + RG * math.sin(a)))
    pts += [(ST[0] + 0.22, 0.0, ST[2]), (ST[0] - 0.22, 0.0, ST[2]), (BACK[0] + 0.12, 0.0, BACK[2] + 0.04), (BACK[0], 0.0, BACK[2])]
    return pts

# ---------- the line's small parts ----------
SNOOD = 0.45
def snood(name='forsyn'):
    p = []
    # the swivel clip that snaps on the mainline: a small stainless body with a hook over the line
    p.append(cyl('clip', (0, 0, -0.005), (0, 0, -0.035), 0.0045, C['stain'], seg=8))
    p.append(torus('cliphook', (0, 0, 0.0), (0, 1, 0), 0.007, 0.0016, C['stain'], seg=10, rseg=4))
    p.append(cyl('swivel', (0, 0, -0.035), (0, 0, -0.05), 0.003, C['steel'], seg=6))
    # the monofilament, with a small sag in it
    p.append(tube('mono', [(0, 0, -0.05), (0.004, 0, -0.2), (0.003, 0, -0.35), (0, 0, -SNOOD)], 0.0011, C['mono'], seg=5))
    for o in p: apply_all(o)
    return join(p, name)

HOOKL = 0.048
def hook(z0=0.0, name='krok'):
    """an autoline hook hanging from its eye at (0, 0, z0): the shank down, the bend, the point up with a barb"""
    p = []
    w = 0.0016
    p.append(torus('eye', (0, 0, z0 - 0.003), (0, 1, 0), 0.0035, w, C['hook'], seg=10, rseg=4))
    pts = [(0, 0, z0 - 0.0065), (0, 0, z0 - 0.035)]
    rb = 0.009; cz = z0 - 0.035
    for k in range(1, 8):
        a = math.pi * k / 7; pts.append((rb - rb * math.cos(a), 0, cz - rb * math.sin(a)))
    pts += [(2 * rb + 0.001, 0, cz + 0.006), (2 * rb - 0.002, 0, cz + 0.016)]
    p.append(tube('shank', pts, w, C['hook'], seg=6))
    tip = pts[-1]; p.append(cyl('point', tip, (tip[0] - 0.003, 0, tip[2] + 0.007), w, C['hook'], seg=6, r1=0.0003))
    p.append(cyl('barb', (tip[0] - 0.0005, 0, tip[2] - 0.001), (tip[0] + 0.0025, 0, tip[2] - 0.006), 0.0008, C['hook'], seg=4, r1=0.0002))
    for o in p: apply_all(o)
    return join(p, name)

def bait(kind, c=(0, 0, 0), name=None):
    """a bait piece of about 35 mm: squid (a pale curled strip with a reddish skin) or saury (a chunk with a dark back)"""
    p = []
    if kind == 'b':
        p.append(sphere('squid', c, 0.018, C['squid'], scale=(1.0, 0.45, 0.75), seg=10, rings=6))
        p.append(sphere('skin', (c[0] + 0.004, c[1] + 0.003, c[2] + 0.006), 0.012, C['squid2'], scale=(1.0, 0.45, 0.6), seg=8, rings=4))
    else:
        p.append(sphere('saury', c, 0.017, C['saury'], scale=(1.0, 0.55, 0.62), seg=10, rings=6))
        p.append(sphere('back', (c[0], c[1], c[2] + 0.007), 0.015, C['sauryB'], scale=(0.95, 0.45, 0.35), seg=8, rings=4))
        p.append(cyl('cut', (c[0] - 0.017, c[1], c[2]), (c[0] - 0.0185, c[1], c[2]), 0.011, C['flesh'], seg=8))
    for o in p: apply_all(o)
    return join(p, name or ('agn_' + kind))

# ---------- export ----------
def main():
    os.makedirs(OUT, exist_ok=True)
    reset(); colours()
    Fr = frame(); Sh = sheave(); St = stripper()
    parts = [('frame', mesh_arrays(Fr, to_game, to_game_n, ao=False), 1.0), ('sheave', mesh_arrays(Sh, rel(AX), to_game_n, ao=False), 1.0),
             ('stripper', mesh_arrays(St, rel(ST), to_game_n, ao=False), 1.0)]
    # the small parts, each in its own frame: the snood from the clip, the hook from its eye, the bait from its middle
    HZ = -SNOOD                                    # the hook's eye at the snood's end
    BZ = HZ - 0.037                                # the bait on the hook's bend
    small = [('forsyn', snood()), ('krok', hook()), ('agn_b', bait('b')), ('agn_s', bait('s')),
             ('tom', join([snood('t1'), hook(HZ, 't2')], 'tom')),
             ('egnet_b', join([snood('b1'), hook(HZ, 'b2'), bait('b', (0.009, 0.0, BZ), 'b3')], 'egnet_b')),
             ('egnet_s', join([snood('s1'), hook(HZ, 's2'), bait('s', (0.009, 0.0, BZ), 's3')], 'egnet_s'))]
    for nm, o in small: parts.append((nm, mesh_arrays(o, to_game, to_game_n, ao=False), 1.0)); o.hide_render = True
    ex = {'frame': 'kystfiske autoline gear: x out over the side, y up, z aft; the hauler from the foot of its pedestal, the sheave and the brush from their axles (turning about z), the snood from its clip on the mainline, the hook from its eye, the bait from its middle',
          'axle': list(to_game(AX)), 'stripper': list(to_game(ST)), 'r': R, 'rg': RG, 'path': [list(to_game(q)) for q in line_path()],
          'port': PORT, 'sill': SILL, 'roll': list(to_game(ROLL)), 'back': list(to_game(BACK)), 'snood': SNOOD, 'hook': HOOKL,
          'baitAt': list(to_game((0.009, 0.0, BZ)))}
    glb = os.path.join(OUT, 'gear-autoline.glb'); n = write_glb(glb, parts, ex)
    open(os.path.join(ROOT, 'src', 'data', 'gear-autoline.b64'), 'w').write(base64.b64encode(open(glb, 'rb').read()).decode())
    xs = [(o.matrix_world @ v.co) for o in (Fr, Sh, St) for v in o.data.vertices]
    print('autoline hauler: %.2f m from the cleaner to the guide, %.2f m wide, %.2f m high; the sheave Ø %.2f m, its top %.2f m over the sill'
          % (max(v.x for v in xs) - min(v.x for v in xs), max(v.y for v in xs) - min(v.y for v in xs), max(v.z for v in xs), 2 * R, AX[2] + R - SILL))
    print('gear-autoline GLB %.1f KB, %s' % (n / 1024, ', '.join('%s %d' % (p[0], len(p[1]['idx']) // 3) for p in parts)))
    if 'fast' in sys.argv: return
    # the renders: the hauler in a mock-up of the port (the plating, the sill and its roller, the floor), and the hook parts big
    bm = bmesh.new()
    for pts in (((PORT, -1.6, 0), (PORT, 1.6, 0), (PORT, 1.6, SILL), (PORT, -1.6, SILL)), ((PORT, -1.6, SILL + 1.55), (PORT, 1.6, SILL + 1.55), (PORT, 1.6, 2.6), (PORT, -1.6, 2.6)),
                ((-1.6, -1.6, 0), (PORT, -1.6, 0), (PORT, 1.6, 0), (-1.6, 1.6, 0))):
        bm.faces.new([bm.verts.new(q) for q in pts])
    obj_from_bm('mock', bm, [mat('mock', (0.10, 0.18, 0.36), 0.5)])
    cyl('sillroll', (ROLL[0], -1.1, ROLL[2] - 0.11), (ROLL[0], 1.1, ROLL[2] - 0.11), 0.11, C['steel'], seg=16)
    tube('line', line_path(), 0.004, C['dark'], seg=6)
    setup_render(1200, 800, samples=24); bpy.context.scene.world.node_tree.nodes.get('Background').inputs['Color'].default_value = (0.62, 0.72, 0.84, 1)
    for nm, loc, look, lens in (('3q', (2.6, -2.2, 2.1), (-0.1, 0, 1.0), 35), ('side', (-0.2, -3.6, 1.2), (-0.2, 0, 1.1), 35), ('in', (-2.4, -1.6, 2.0), (0.1, 0, 1.1), 35)):
        camera(loc, look, lens=lens); render(os.path.join(OUT, 'auto_%s.png' % nm))
    for o in list(bpy.data.objects):
        if o.type == 'MESH': o.hide_render = True
    for i, (nm, o) in enumerate(small[4:]):
        o.hide_render = False; o.location = (0.05 * i, 0, 0.2)
    camera((0.06, -0.20, -0.22), (0.06, 0, -0.27), lens=50); render(os.path.join(OUT, 'auto_hooks.png'))

if __name__ == '__main__':
    main()
