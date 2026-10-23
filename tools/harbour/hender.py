"""The hands and the boots of the people (Jonas 23.10.2026, with reference pictures of hand and foot topology: «da må vi modellere
hender og føtter bedre i blender ... Det er også viktig hvordan objekter holdes med hendene for realismen»). Used by arbeider.py.

The hand: a gloved hand with a palm, four fingers of three joints each and a thumb that stands against them, in the grips the work
and the breaks need. Each grip is the same hand with its joints bent:
  relax  the fingers lightly curled (hanging, walking, resting on something)
  flat   the hand open and flat (on the table, on the fish, on the rail, pushing)
  grip   a power grip round a handle about 3.5 cm thick (the knife, the broom, the hose, the gaff, the rail, a mug's body)
  hold   a looser grip round something wider (a phone held in both hands, the binoculars, a lunch box)
  pinch  the thumb against the index finger (a cigarette, a snus portion, a hook, the line)
  hook   the fingers bent at the middle joints like a hook (a crate's handle, a fish by the gills, the rail pulled on)
Both a right and a left hand: the left is the right mirrored, so the thumbs are on the inside of both.

Frame (the game's, exported as it is): from the wrist along +z, the palm facing +y, the thumb at +x on the right hand (-x on the left).
Each grip has a point (where the thing held sits) and an axis (along the handle) in that frame: extras 'hands' in worker.glb, so the
game puts what the hand holds where the hand holds it.

The boot: a rubber deck boot on a foot's last: heel, arch, the ball and the toe box with a little toe spring, a welted sole and a
heel block, the shaft round the ankle with a rolled top. Origin on the ground under the ankle, the toe along +y (Blender)."""
import math, os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'boats'))
import bpy, bmesh, mathutils
from bpyutil import *

V3 = mathutils.Vector

# ---------- the hand ----------
# where each finger's knuckle (MCP) sits on the palm (x across, z along, right hand), its spread, its radius and its three bones
# (gloved: the fingers side by side, touching at the knuckles)
FINGERS = {
    'index':  {'mcp': (0.031, 0.0, 0.093), 'spread': 0.05, 'r': 0.0114, 'len': (0.044, 0.026, 0.021)},
    'middle': {'mcp': (0.009, 0.0, 0.098), 'spread': 0.0, 'r': 0.0120, 'len': (0.048, 0.030, 0.023)},
    'ring':   {'mcp': (-0.013, 0.0, 0.094), 'spread': -0.05, 'r': 0.0113, 'len': (0.045, 0.028, 0.022)},
    'little': {'mcp': (-0.033, 0.0, 0.084), 'spread': -0.11, 'r': 0.0099, 'len': (0.034, 0.021, 0.019)},
}
THUMB = {'cmc': (0.022, 0.012, 0.014), 'r': 0.0135, 'len': (0.040, 0.032, 0.027)}
# the joints' bends (degrees) per grip: per finger (MCP, PIP, DIP); the thumb (spread out from the palm, roll toward it, MCP, IP) is found
# per grip so its tip lands where it does in a real hand (thumb_fit), and only a flat hand keeps the one given here
D = math.radians
GRIPS = {
    'relax': {'f': {'index': (12, 22, 10), 'middle': (16, 26, 12), 'ring': (19, 30, 14), 'little': (22, 34, 16)}, 't': (30, 35, 12, 10)},
    'flat':  {'f': {'index': (2, 4, 2), 'middle': (2, 4, 2), 'ring': (3, 5, 2), 'little': (4, 6, 3)}, 't': (14, 22, 4, 4)},
    'grip':  {'f': {'index': (60, 82, 40), 'middle': (64, 86, 44), 'ring': (67, 88, 46), 'little': (70, 90, 48)}, 't': (42, 75, 30, 32)},
    'hold':  {'f': {'index': (34, 40, 18), 'middle': (38, 44, 20), 'ring': (41, 48, 22), 'little': (44, 52, 24)}, 't': (48, 55, 14, 12)},
    'pinch': {'f': {'index': (38, 50, 22), 'middle': (52, 78, 44), 'ring': (60, 88, 50), 'little': (66, 92, 54)}, 't': (36, 70, 22, 18)},
    'hook':  {'f': {'index': (8, 88, 58), 'middle': (10, 92, 60), 'ring': (12, 94, 62), 'little': (14, 96, 64)}, 't': (24, 25, 8, 6)},
}
HAND_GRIPS = list(GRIPS)


def ring_at(p, side, up, d, rw, rh, n):
    """a ring round point p in the plane of side (width rw) and up (depth rh), slightly flattened like a finger"""
    out = []
    for k in range(n):
        t = 2 * math.pi * k / n; c, s = math.cos(t), math.sin(t)
        out.append(p + side * (c * rw) + up * (s * rh))
    return out


def chain(base, d0, side, bends, lens, r, n=8, tip=True):
    """a finger as rings along its bones: from base along d0, each joint bending the way toward the palm (about side); the joints are
    rounded (a few rings across each bend), the knuckles a little thicker, the tip a rounded cap. Returns (rings, joint points)."""
    side = V3(side).normalized(); d = V3(d0).normalized(); up = side.cross(d).normalized()   # up: toward the palm
    P = V3(base); rings = []; joints = [P.copy()]
    # radius along the finger: thicker over the knuckles, narrowing to the tip
    rr = [r * 1.06, r * 1.0, r * 0.94, r * 0.90, r * 0.84]
    for i, (L, b) in enumerate(zip(lens, bends)):
        # the bend at this joint, spread over three rings round the joint
        for k in range(2):
            q = mathutils.Quaternion(side, -b / 2)
            d = q @ d; up = side.cross(d).normalized()
            rk = r * (1.08 if i == 0 else 1.04) * (1 - 0.06 * i)
            rings.append(ring_at(P, side, up, d, rk, rk * 0.88, n)); P = P + d * (r * 0.375)
        # the bone itself
        steps = 2
        for k in range(1, steps + 1):
            rk = r * (1 - 0.06 * i) * (0.97 if k == steps else 1.0) * (0.92 if (i == 2 and k == steps) else 1.0)
            P = P + d * ((L - r * 0.75) / steps); rings.append(ring_at(P, side, up, d, rk, rk * 0.86, n))
        joints.append(P.copy())
    if tip:
        rk = r * (1 - 0.12) * 0.92
        for a in (0.5, 1.0, 1.38):
            rings.append(ring_at(P + d * (rk * math.sin(a) * 0.9), side, up, d, rk * math.cos(a) + 0.0015, rk * math.cos(a) * 0.86 + 0.0012, n))
    return rings, joints, d


def loft(name, rings, m, cap0=True, cap1=True):
    return loft_rings(name, [[tuple(p) for p in r] for r in rings], m, cap0, cap1, 50)


def palm(m, gauntlet=True):
    """the palm from the wrist to the knuckles: rounded sections, wider and flatter toward the knuckles, the thenar pad on the thumb
    side of the palm, the back a little domed; and the glove's gauntlet up the forearm"""
    lv = [  # z, half width, half depth, centre y, thumb-side pad
        (-0.004, 0.032, 0.022, 0.000, 0.0), (0.012, 0.036, 0.022, 0.001, 0.004), (0.030, 0.040, 0.020, 0.003, 0.008),
        (0.050, 0.043, 0.018, 0.003, 0.006), (0.070, 0.045, 0.016, 0.002, 0.002), (0.088, 0.045, 0.015, 0.001, 0.0),
        (0.100, 0.042, 0.013, 0.000, 0.0), (0.106, 0.034, 0.010, 0.000, 0.0)]
    rings = []
    for z, a, b, yc, pad in lv:
        r = []
        for k in range(14):
            t = 2 * math.pi * k / 14; c, s = math.cos(t), math.sin(t)
            x = a * math.copysign(abs(c) ** (2 / 3.2), c); y = b * math.copysign(abs(s) ** (2 / 2.4), s) + yc
            if s > 0 and c > 0: y += pad * (s * c) * 2           # the thenar pad: palm side, thumb side
            if s < 0: y -= 0.002 * (1 - abs(c))                  # the back of the hand a little domed
            r.append((x, y, z))
        rings.append(r)
    objs = [loft_rings('palm', rings, m, True, True, 50)]
    if gauntlet:
        # the glove's cuff up into the sleeve (narrower than the sleeve's cuff, so the oilskin hides it but a centimetre at the wrist)
        g = [[(a * math.cos(2 * math.pi * k / 14), b * math.sin(2 * math.pi * k / 14), z) for k in range(14)] for z, a, b in ((-0.045, 0.040, 0.034), (-0.012, 0.037, 0.028), (0.004, 0.034, 0.025))]
        objs.append(loft_rings('gauntlet', g, m, True, False, 50))
    return objs



def thumb_axes(sp, roll):
    """the thumb's first bone (out from the base of the palm on its side, turned toward the palm by roll) and the axis its joints bend
    about (carrying it across the palm toward the fingers)"""
    sp, roll = D(sp), D(roll); d0 = V3((math.sin(sp), math.sin(roll) * 0.55, math.cos(sp))).normalized()
    curl = V3((-1.0, 0.7, 0.15)).normalized(); return d0, curl.cross(d0).normalized()


def thumb_joints(sp, roll, b1, b2):
    d, side = thumb_axes(sp, roll); P = V3(THUMB['cmc']); r = THUMB['r']; out = []
    for L, b in zip(THUMB['len'], (0.0, D(b1), D(b2))):
        q = mathutils.Quaternion(side, -b); d = q @ d; P = P + d * (r * 0.75 + (L - r * 0.75)); out.append(P.copy())
    return out


def inside_palm(p):
    return abs(p.x) < 0.044 and abs(p.y) < 0.017 and -0.01 < p.z < 0.1


def thumb_fit(target):
    """the thumb's angles that put its tip nearest the target without going through the palm: a coarse search, then a fine one"""
    best = None
    def score(a):
        J = thumb_joints(*a); e = (J[-1] - target).length ** 2
        e += sum(0.0004 for p in J[1:] if inside_palm(p)) + 1e-7 * (a[2] ** 2 + a[3] ** 2)
        return e
    for sp in range(8, 75, 6):
        for roll in range(0, 95, 10):
            for b1 in range(0, 65, 10):
                for b2 in range(0, 70, 12):
                    e = score((sp, roll, b1, b2))
                    if best is None or e < best[0]: best = (e, (sp, roll, b1, b2))
    a = list(best[1])
    for step in (3, 1.5):
        for _ in range(3):
            for i in range(4):
                for dv in (-step, step):
                    b = a[:]; b[i] += dv; e = score(b)
                    if e < best[0]: best = (e, tuple(b)); a = b
    return best[1]


def thumb_target(grip, J):
    """where the thumb's tip goes in each grip: on the curled index finger from outside (grip), against the index tip (pinch), beside
    the index on the near side of a wide thing (hold), alongside the index (relax, hook)"""
    ix, md = [V3(p) for p in J['index']], [V3(p) for p in J['middle']]
    if grip == 'grip':
        g = circle3(md[1], md[2], md[3]); m = (ix[1] + ix[2]) / 2; return m + (m - g).normalized() * 0.022 + V3((0.004, 0, 0))
    if grip == 'pinch': return ix[3] + V3((0.008, 0.017, -0.003))
    if grip == 'hold': return ix[1] + V3((0.016, 0.022, -0.004))
    if grip == 'hook': return ix[1] + V3((0.017, -0.002, -0.014))
    return ix[1] + V3((0.017, 0.012, -0.006))


def hand(m, grip='relax', left=False, name=None):
    """one hand in one grip; returns (object, grip point, grip axis) in the hand's frame (z along, palm +y, thumb +x on the right)"""
    G = GRIPS[grip]; objs = palm(m); tips = {}; joints = {}
    for fn, F in FINGERS.items():
        s = F['spread']; d0 = V3((math.sin(s) * 0.35, 0.0, 1.0)).normalized(); side = V3((math.cos(s), 0.0, -math.sin(s) * 0.35)).normalized()
        base = V3(F['mcp']) - d0 * 0.016          # (the finger starts inside the palm, so the join is hidden)
        b = [D(x) for x in G['f'][fn]]
        rings, J, dlast = chain(base, d0, side, b, (F['len'][0] + 0.016, F['len'][1], F['len'][2]), F['r'])
        objs.append(loft(fn, rings, m, True, True)); tips[fn] = J[-1]; joints[fn] = J
    # the thumb: out from the base of the palm on its side, turned toward the palm (opposition), then bent at its two joints
    ang = G['t'] if grip == 'flat' else thumb_fit(thumb_target(grip, joints))
    d0, side = thumb_axes(*ang[:2]); T = THUMB
    rings, J, _ = chain(V3(T['cmc']), d0, side, (0.0, D(ang[2]), D(ang[3])), T['len'], T['r'])
    objs.append(loft('thumb', rings, m, True, True)); tips['thumb'] = J[-1]; joints['thumb'] = J
    # the ball of the thumb: the muscle between the thumb's first bone and the palm
    c = V3(T['cmc']) + d0 * 0.018; objs.append(sphere('thenar', tuple(c + V3((-0.008, 0.002, 0.004))), 0.017, m, scale=(1.0, 0.8, 1.35), seg=10, rings=6))
    o = join(objs, name or 'HAND')
    at, ax = grip_point(grip, tips, joints)
    if left:
        bm = bmesh.new(); bm.from_mesh(o.data)
        for v in bm.verts: v.co.x = -v.co.x
        bmesh.ops.reverse_faces(bm, faces=bm.faces); bm.to_mesh(o.data); bm.free(); shade(o, 50)
        at = (-at[0], at[1], at[2]); ax = (ax[0], ax[1], ax[2])
    return o, [round(v, 4) for v in at], [round(v, 4) for v in ax]


def circle3(a, b, c):
    """the centre of the circle through three points (the fingers wrapped round a handle)"""
    a, b, c = V3(a), V3(b), V3(c); ab = b - a; ac = c - a; n = ab.cross(ac)
    if n.length < 1e-9: return (a + b + c) / 3
    return a + (n.cross(ab) * ac.length_squared + ac.cross(n) * ab.length_squared) / (2 * n.length_squared)


def grip_point(grip, tips, J):
    """where the held thing sits, and its axis: round the middle finger's curl for a grip, between the thumb and the index for a pinch,
    inside the hook for a hook, before the palm for the rest"""
    m = J['middle']
    if grip in ('grip', 'hold'):
        c = circle3(m[1], m[2], m[3]) if grip == 'grip' else (V3(m[1]) + V3(m[3])) / 2 + V3((0, 0.012, 0))
        return tuple(c), (1.0, 0.0, 0.0)
    if grip == 'pinch':
        p = (V3(tips['index']) + V3(tips['thumb'])) / 2; return tuple(p), (0.0, 0.0, 1.0)
    if grip == 'hook':
        c = circle3(m[1], m[2], m[3]); return tuple(c), (1.0, 0.0, 0.0)
    if grip == 'flat': return (0.0, 0.02, 0.06), (0.0, 0.0, 1.0)
    return (0.004, 0.03, 0.08), (1.0, 0.0, 0.0)


# ---------- the boot ----------
def boot(C):
    """a rubber deck boot on a foot's last: origin on the ground under the ankle, the toe along +y. The sole's outline is a foot's
    (narrow heel, the arch drawn in on the inside, wide over the ball, a rounded toe), the toe box rises a little at the front (toe
    spring), the instep climbs to the ankle, the shaft goes up round the ankle to a rolled top."""
    B = C['boot']; SO = C['sole']
    # stations along the foot (y): half width out, half width in (the arch), top height, the sole's lift (toe spring)
    st = [(-0.080, 0.026, 0.026, 0.050, 0.004), (-0.068, 0.036, 0.036, 0.080, 0.0), (-0.040, 0.040, 0.038, 0.100, 0.0),
          (-0.005, 0.042, 0.036, 0.112, 0.0), (0.030, 0.045, 0.034, 0.104, 0.0), (0.070, 0.050, 0.045, 0.086, 0.0),
          (0.110, 0.053, 0.050, 0.072, 0.002), (0.150, 0.050, 0.048, 0.062, 0.006), (0.185, 0.043, 0.042, 0.054, 0.012),
          (0.208, 0.032, 0.032, 0.047, 0.018), (0.222, 0.018, 0.018, 0.040, 0.022), (0.228, 0.006, 0.006, 0.034, 0.024)]
    n = 16; rings = []; S0 = 0.026
    for y, wo, wi, top, lift in st:
        r = []
        for k in range(n):
            t = 2 * math.pi * k / n; c, s = math.cos(t), math.sin(t)
            w = wo if c >= 0 else wi
            x = w * math.copysign(abs(c) ** (2 / 2.6), c)
            # bottom flat on the sole, top rounded: the instep's height over the sole
            if s <= 0: z = S0 + lift + 0.004 * (1 + s)
            else: z = S0 + lift + (top - S0) * (s ** 0.75)
            r.append((x, y, z))
        rings.append(r)
    objs = [loft_rings('foot', rings, B, True, True, 50)]
    # the shaft round the ankle up to a rolled top (the oilskins come down over it)
    sh = []
    for z, rx, ry, yc in ((0.06, 0.058, 0.066, -0.012), (0.12, 0.056, 0.062, -0.014), (0.18, 0.058, 0.064, -0.016), (0.23, 0.062, 0.068, -0.016)):
        sh.append([(rx * math.cos(2 * math.pi * k / n), yc + ry * math.sin(2 * math.pi * k / n), z) for k in range(n)])
    objs.append(loft_rings('shaft', sh, B, False, True, 50))
    objs.append(loft_rings('roll', [[((0.062 + dr) * math.cos(2 * math.pi * k / n), -0.016 + (0.068 + dr) * math.sin(2 * math.pi * k / n), z) for k in range(n)] for z, dr in ((0.222, 0.0), (0.228, 0.005), (0.240, 0.005), (0.246, 0.0))], B, False, False, 50))
    # the sole: the foot's outline a little proud of the upper, with the heel block under the back
    out = []
    for y, wo, wi, top, lift in st:
        out.append((wo + 0.004, y, lift));
    inn = [(-(wi + 0.004), y, lift) for y, wo, wi, top, lift in st]
    pts = out + list(reversed(inn))
    bm = bmesh.new(); lo = [bm.verts.new((x, y, max(0.0, l - 0.002))) for x, y, l in pts]; hi = [bm.verts.new((x, y, S0 + l)) for x, y, l in pts]
    N = len(pts)
    bm.faces.new(list(reversed(lo))); bm.faces.new(hi)
    for i in range(N):
        j = (i + 1) % N; bm.faces.new([lo[i], lo[j], hi[j], hi[i]])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    objs.append(shade(obj_from_bm('sole', bm, [SO]), 40))
    return join(objs, 'BOOT')


# ---------- a look at them on their own: python3 tools/harbour/hender.py -> tools/harbour/out/hender_*.png ----------
def preview(out):
    import bpy, os
    C = {'glove': mat('glove', (0.84, 0.78, 0.50), 0.15), 'boot': mat('boot', (0.09, 0.09, 0.10), 0.35), 'sole': mat('sole', (0.24, 0.22, 0.20), 0.1)}
    red = mat('held', (0.8, 0.12, 0.1), 0.3)
    for i, g in enumerate(HAND_GRIPS):
        for j, left in enumerate((False, True)):
            o, at, ax = hand(C['glove'], g, left, 'h%s_%s' % ('L' if left else 'R', g))
            # the hand standing up (fingers +z up in Blender): the game frame is the hand frame as it is, so turn it for the picture
            o.location = (j * 0.16 - 0.08 + i * 0.36 - 0.9, 0, 0.0)
            # what it holds: a red rod along the grip axis through the grip point
            c = cyl('held_' + g + str(j), (at[0] - ax[0] * 0.07, at[1] - ax[1] * 0.07, at[2] - ax[2] * 0.07), (at[0] + ax[0] * 0.07, at[1] + ax[1] * 0.07, at[2] + ax[2] * 0.07), 0.016 if g in ('grip', 'hook') else 0.005, red, 12)
            c.location = o.location
    b = boot(C); b.location = (1.3, 0.0, 0.0); b2 = boot(C); b2.location = (1.3, 0.35, 0.0); b2.rotation_euler = (0, 0, math.pi / 2)
    bm = bmesh.new(); bm.faces.new([bm.verts.new(p) for p in ((-5, -5, -0.1), (5, -5, -0.1), (5, 5, -0.1), (-5, 5, -0.1))]); obj_from_bm('ground', bm, [mat('ground', (0.5, 0.5, 0.5), 0.1)])
    setup_render(1800, 900, samples=32)
    for nm, loc, look, lens in (('palm', (0.2, 1.9, 0.25), (0.2, 0, 0.07), 26), ('back', (0.2, -1.9, 0.25), (0.2, 0, 0.07), 26), ('side', (2.2, 0.6, 0.5), (0.4, 0, 0.07), 30)):
        camera(loc, look, lens=lens); render(os.path.join(out, 'hender_%s.png' % nm))
    # close: each grip's right hand from in front and a little to the side, at about the size the game shows it close up
    setup_render(900, 900, samples=32)
    for i, g in enumerate(HAND_GRIPS):
        x = i * 0.36 - 0.9 - 0.08
        camera((x + 0.22, 0.30, 0.20), (x, 0.0, 0.08), lens=50); render(os.path.join(out, 'hender_naer_%s.png' % g))


if __name__ == '__main__':
    import os, sys
    reset(); preview(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'out'))
