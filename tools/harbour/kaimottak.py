"""The harbour unit: one quay with the fish plant, the quay crane, the forklift, the ice silo with its chute and the bunker station, built
in Blender to be placed in every harbour (decided 02.10.2026). Sized for the coastal fleet: the quay face stands on at least 5 m of water
at the lowest tide in the game (about 1.55 m below mean sea level), so the deepest coastal boat (3.4 m) lies afloat at any tide. The
quay is a block with straight concrete walls down to 9 m below mean sea level on all sides, nothing sticking out into the water (Jonas,
02.10.2026); the game flattens the land behind it to the deck and raises the seabed to the walls' foot where it is deeper. No name on the wall: the sign says FISKEMOTTAK.

    pip install bpy==4.5.4
    python3 tools/harbour/kaimottak.py          -> src/data/harbour-unit.b64, renders in tools/harbour/out/
    python3 tools/harbour/kaimottak.py fast     -> without the renders to look at
    python3 tools/harbour/kaimottak.py dry      -> the GLB only in tools/harbour/out

Frame here: x along the quay face (the face is y = 0, the middle x = 0), y inland, z up from mean sea level. In the game the unit's own
frame is x along the face, y up from mean sea level, z out to sea; the 3D view places it with a position and a heading per harbour.
The crane, the forklift, the roller door and the ice chute move in the game: they are parts of their own, each in its own frame."""
import os, sys, math, random
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))
sys.path.insert(0, os.path.join(ROOT, 'tools', 'boats'))
import bpy, bmesh
from bpyutil import *

OUT = os.path.join(HERE, 'out')
QTOP = 2.4                      # the deck above mean sea level, as QTOP in 07-harbours.js
LW = 9.0                        # half the length of the quay face less 18 m: the face is 54 m long
HL = 27.0; DEPTH = 24.0         # half the face length, and the deck from the face inland
WALL_BOT = -9.0                 # the face goes down to here; the basin in front is dredged to -6.6 (5 m at the lowest tide)
KERB = 0.9                      # the kerb (capping beam) along the face is this wide
# where things stand (frame here)
CRANE = (-8.0, 1.9); DROP = (-9.5, 4.6); DOOR = (-13.0, 10.0); SILO = (2.5, 6.6); PUMP = (17.5, 1.7); TANK = (19.0, 20.0)
D2 = (-23.0, -19.6); PD = (-7.6, -6.6); BD = (-21.0, -17.0)   # BD: the dispatch door at the back                          # the small roller door and the personnel door (x from, to)
BERTH = -5.0                                                    # the landing berth's middle: the crane and the ice chute both reach it
BLDG = (-26.0, 0.5, 10.0, 23.5); BH = 7.2; RIDGE = 8.4      # the plant building: x0, x1, y0, y1, eaves and ridge


C = {}
def colours():
    C['conc'] = mat('concrete', (0.64, 0.64, 0.62), 0.15)
    C['conc_d'] = mat('concrete_wet', (0.36, 0.37, 0.36), 0.25)
    C['tidal'] = mat('tidal', (0.20, 0.22, 0.16), 0.35)
    C['asph'] = mat('asphalt', (0.25, 0.26, 0.27), 0.08)
    C['yellow'] = mat('yellow_paint', (0.95, 0.76, 0.12), 0.3)
    C['white_p'] = mat('white_paint', (0.88, 0.89, 0.88), 0.25)
    C['rubber'] = mat('rubber', (0.07, 0.07, 0.08), 0.25)
    C['steel'] = mat('steel', (0.70, 0.72, 0.74), 0.7, metal=0.7)
    C['dark'] = mat('dark', (0.12, 0.13, 0.14), 0.3)
    C['clad'] = mat('cladding', (0.86, 0.88, 0.89), 0.45)
    C['trim'] = mat('trim', (0.12, 0.21, 0.36), 0.45)
    C['roof'] = mat('roof', (0.22, 0.24, 0.26), 0.35)
    C['door'] = mat('door', (0.74, 0.76, 0.78), 0.4)
    C['glass'] = mat('glass', (0.08, 0.11, 0.14), 0.95)
    C['inside'] = mat('inside', (0.05, 0.05, 0.06), 0.1)
    C['sign'] = mat('sign', (0.10, 0.22, 0.42), 0.45)
    C['letters'] = mat('letters', (0.95, 0.96, 0.96), 0.4)
    C['silo'] = mat('silo', (0.90, 0.91, 0.92), 0.55)
    C['tank'] = mat('tank', (0.90, 0.90, 0.88), 0.5)
    C['red'] = mat('red', (0.75, 0.12, 0.10), 0.5)
    C['crane'] = mat('crane', (0.95, 0.70, 0.08), 0.5)
    C['truck'] = mat('truck', (0.85, 0.22, 0.10), 0.5)
    C['box_b'] = mat('box_blue', (0.18, 0.40, 0.74), 0.35)
    C['box_g'] = mat('box_grey', (0.62, 0.65, 0.68), 0.35)
    C['tub'] = mat('tub', (0.20, 0.38, 0.62), 0.35)
    C['wood'] = mat('pallet', (0.66, 0.53, 0.36), 0.08)
    C['cont'] = mat('container', (0.55, 0.20, 0.12), 0.3)
    C['van'] = mat('van', (0.92, 0.93, 0.93), 0.6)
    C['vest'] = mat('vest', (1.0, 0.45, 0.06), 0.3)
    C['coverall'] = mat('coverall', (0.13, 0.29, 0.62), 0.2)
    C['skin'] = mat('skin', (0.86, 0.66, 0.52), 0.2)
    C['lamp'] = mat('lamp', (1.0, 0.96, 0.85), 0.8, emit=0.6)


# ---------- helpers ----------
def text_obj(name, s, size, m, extrude=0.03, res=3):
    cu = bpy.data.curves.new(name, 'FONT'); cu.body = s; cu.size = size; cu.extrude = extrude; cu.resolution_u = res; cu.align_x = 'CENTER'; cu.align_y = 'CENTER'
    o = bpy.data.objects.new(name + '_c', cu); link(o)
    dg = bpy.context.evaluated_depsgraph_get(); me = bpy.data.meshes.new_from_object(o.evaluated_get(dg))
    bpy.data.objects.remove(o, do_unlink=True); me.materials.append(m)
    return link(bpy.data.objects.new(name, me))

def place(o, loc, rot=(0, 0, 0)):
    o.location = loc; o.rotation_euler = rot; return o

def corr_wall(name, a, b, z0, z1, m, period=0.25, amp=0.035):
    """corrugated cladding from a to b (x, y), facing to the left of a->b (walls run counter-clockwise seen from above)"""
    a = V((a[0], a[1], 0)); b = V((b[0], b[1], 0)); d = b - a; L = d.length; u = d / L; out = V((-u.y, u.x, 0))
    n = max(2, int(round(L / period)) * 2); rows = []
    for k in range(n + 1):
        p = a + d * (k / n) + out * (amp if k % 2 else 0.0); rows.append([(p.x, p.y, z0), (p.x, p.y, z1)])
    return grid(name, rows, lambda i, j: m, angle=60, out=lambda c, o=out: (o.x, o.y, 0))

def window(name, a, b, s, z, w, h, nrm):
    """a window in the wall a->b at distance s along it, sill at z, w x h; frames dark, glass dark"""
    a = V((a[0], a[1], 0)); b = V((b[0], b[1], 0)); u = (b - a).normalized(); o = a + u * s; n = V(nrm)
    poly = rrect(0, z + h / 2, w, h, 0.03, 1); outer = rrect(0, z + h / 2, w + 0.12, h + 0.12, 0.04, 1)
    return [frame_ring(name + '_f', o + n * 0.1, u, (0, 0, 1), outer, poly, C['trim'], 0.0, 0.07, nrm=nrm),
            plate(name + '_g', o + n * 0.06, u, (0, 0, 1), poly, C['glass'], nrm=nrm)]


# ---------- the quay ----------
def quay(fine=True):
    objs = []
    # the deck and the kerb along the face, with the yellow edge line
    objs.append(box('deck', -HL, HL, KERB, DEPTH, QTOP - 0.5, QTOP, C['asph']))
    objs.append(box('kerb', -HL - 0.4, HL + 0.4, 0.0, KERB, QTOP - 0.9, QTOP + 0.12, C['conc'], 0.03 if fine else 0))
    if fine:
        objs.append(box('edge_line', -HL + 0.4, HL - 0.4, 0.15, 0.45, QTOP + 0.12, QTOP + 0.125, C['yellow']))
        objs.append(box('walk_line', -HL + 0.4, HL - 0.4, KERB + 2.0, KERB + 2.12, QTOP, QTOP + 0.005, C['yellow']))
        # the drop spot under the crane, hatched
        x0, y0 = DROP[0] - 1.6, DROP[1] - 1.2
        for k in range(4): objs.append(box('drop_l%d' % k, x0, x0 + 3.2, y0 + 0.8 * k, y0 + 0.8 * k + 0.1, QTOP, QTOP + 0.006, C['yellow']))
        for xx in (x0, x0 + 3.1): objs.append(box('drop_s%d' % int(xx * 10), xx, xx + 0.1, y0, y0 + 2.5, QTOP, QTOP + 0.006, C['yellow']))
    # the walls: the face to the sea, both ends and the back stand straight down to the foot (nothing sticks out into the water);
    # concrete above the tide, wet and weedy between the tides, dark below
    E = HL + 0.4; B = DEPTH + 0.4
    walls = (('face', (-E, -0.002, 0), (1, 0, 0), 2 * E, (0, -1, 0)), ('west', (-E - 0.002, B, 0), (0, -1, 0), B, (-1, 0, 0)),
             ('east', (E + 0.002, 0, 0), (0, 1, 0), B, (1, 0, 0)), ('back', (E, B + 0.002, 0), (-1, 0, 0), 2 * E, (0, 1, 0)))
    for wn, org, u, L, nrm in walls:
        for nm, z0, z1, m in (('low', WALL_BOT, -1.7, C['conc_d']), ('tide', -1.7, 0.9, C['tidal']), ('high', 0.9, QTOP - 0.9, C['conc'])):
            objs.append(plate('%s_%s' % (wn, nm), org, u, (0, 0, 1), [(0, z0), (L, z0), (L, z1), (0, z1)], m, nrm=nrm))
    if fine:
        # rubber fenders every 4 m, steel ladders, bollards on the kerb
        for k in range(13):
            x = -24 + 4 * k
            if abs(x - (-20)) < 1 or abs(x - 8) < 1: continue
            objs.append(box('fender%d' % k, x - 0.16, x + 0.16, -0.28, 0.0, -1.6, QTOP - 0.05, C['rubber']))
        for x in (-20.0, 8.0):
            for s in (-0.22, 0.22): objs.append(cyl('lad%d%d' % (int(x), int(s * 100)), (x + s, -0.12, -2.2), (x + s, -0.12, QTOP + 0.95), 0.025, C['steel'], 8))
            for z in [-2.0 + 0.3 * k for k in range(15)]: objs.append(cyl('rung%d%d' % (int(x), int(z * 10)), (x - 0.22, -0.12, z), (x + 0.22, -0.12, z), 0.018, C['steel'], 4))
            for s in (-0.22, 0.22): objs.append(tube('ladh%d%d' % (int(x), int(s * 100)), [(x + s, -0.12, QTOP + 0.95), (x + s, 0.3, QTOP + 1.05), (x + s, 0.6, QTOP + 0.12)], 0.025, C['steel'], 8))
        for k in range(8):
            x = -24.5 + 7 * k
            objs.append(cyl('bol%d' % k, (x, 0.5, QTOP + 0.12), (x, 0.5, QTOP + 0.55), 0.16, C['dark'], 10))
            objs.append(cyl('bolc%d' % k, (x, 0.5, QTOP + 0.55), (x, 0.5, QTOP + 0.64), 0.22, C['dark'], 10))
    if fine:
        # steel corner guards at the front, and two fenders on each end
        for sg in (-1, 1):
            objs.append(box('guard%d' % sg, sg * (HL + 0.4) - 0.16, sg * (HL + 0.4) + 0.16, -0.16, 0.16, -1.6, QTOP + 0.13, C['dark']))
            for y in (3.0, 7.0): objs.append(box('efender%d%d' % (sg, int(y)), sg * (HL + 0.4) + (0 if sg > 0 else -0.28), sg * (HL + 0.4) + (0.28 if sg > 0 else 0), y - 0.16, y + 0.16, -1.6, QTOP - 0.05, C['rubber']))
    # the deck's edges on the sides and the back: a concrete edge beam
    objs.append(box('edge_w', -HL - 0.4, -HL, KERB, DEPTH + 0.4, QTOP - 0.9, QTOP + 0.05, C['conc']))
    objs.append(box('edge_e', HL, HL + 0.4, KERB, DEPTH + 0.4, QTOP - 0.9, QTOP + 0.05, C['conc']))
    objs.append(box('edge_b', -HL, HL, DEPTH, DEPTH + 0.4, QTOP - 0.9, QTOP + 0.05, C['conc']))
    if fine:
        # lamp posts along the face and at the back
        for k, (x, y) in enumerate(((-24.0, 1.4), (0.0, 1.4), (24.0, 1.4), (-6.0, 23.0), (12.0, 23.0))):
            objs.append(cyl('lp%d' % k, (x, y, QTOP), (x, y, QTOP + 9.0), 0.11, C['steel'], 10, r1=0.07))
            objs.append(box('lph%d' % k, x - 0.25, x + 0.25, y - 0.7, y + 0.1, QTOP + 8.9, QTOP + 9.1, C['dark']))
            objs.append(box('lpl%d' % k, x - 0.2, x + 0.2, y - 0.65, y + 0.05, QTOP + 8.86, QTOP + 8.9, C['lamp']))
        # a lifebuoy on its post
        objs.append(cyl('lbpost', (3.0, 1.2, QTOP), (3.0, 1.2, QTOP + 1.6), 0.04, C['red'], 8))
        objs.append(torus('lifebuoy', (3.0, 1.12, QTOP + 1.2), (0, 1, 0), 0.30, 0.07, C['red'], 22, 8))
    return objs


# ---------- the plant ----------
def plant(fine=True):
    objs = []; glass = []
    x0, x1, y0, y1 = BLDG; zb = QTOP; ze = QTOP + BH; zr = QTOP + RIDGE; dw = 4.4; dh = 4.8
    # the plinth round the walls, open at the doors so the forklift drives in level with the deck
    gaps = sorted([(DOOR[0] - dw / 2, DOOR[0] + dw / 2), D2, PD])
    xs = [x0 - 0.1] + [v for g in gaps for v in g] + [x1 + 0.1]
    for k in range(0, len(xs), 2): objs.append(box('plinth_f%d' % k, xs[k], xs[k + 1], y0 - 0.1, y0 + 0.2, zb, zb + 0.45, C['conc']))
    for k, (a, b) in enumerate(((x0 - 0.1, BD[0]), (BD[1], x1 + 0.1))): objs.append(box('plinth_b%d' % k, a, b, y1 - 0.2, y1 + 0.1, zb, zb + 0.45, C['conc']))
    objs.append(box('plinth_w', x0 - 0.1, x0 + 0.2, y0 + 0.2, y1 - 0.2, zb, zb + 0.45, C['conc']))
    objs.append(box('plinth_e', x1 - 0.2, x1 + 0.1, y0 + 0.2, y1 - 0.2, zb, zb + 0.45, C['conc']))
    if fine:
        # the front with the big roller door at DOOR, a small roller door, the office end with windows and a door
        fx = lambda a, b: corr_wall('front_%d' % int(a * 10), (b, y0), (a, y0), zb + 0.45, ze, C['clad'])
        d0, d1 = DOOR[0] - dw / 2, DOOR[0] + dw / 2
        objs.append(fx(x0, d0)); objs.append(fx(d1, x1))
        objs.append(corr_wall('front_over', (d1, y0), (d0, y0), zb + dh, ze, C['clad']))
        # the opening: a dark room behind it (open to the door, faces inwards) the forklift drives into, a frame round it, the drum
        # box over it; the door itself is a part of its own
        rm = box('door_in', d0, d1, y0, y0 + 6.5, zb, zb + dh, C['inside'])
        bm = bmesh.new(); bm.from_mesh(rm.data); bm.faces.ensure_lookup_table()
        bmesh.ops.delete(bm, geom=[f for f in bm.faces if f.calc_center_median().y < y0 + 0.01], context='FACES')
        bmesh.ops.reverse_faces(bm, faces=bm.faces); bm.to_mesh(rm.data); bm.free(); objs.append(rm)
        for s in (d0 - 0.15, d1): objs.append(box('door_jamb%d' % int(s), s, s + 0.15, y0 - 0.12, y0 + 0.05, zb, zb + dh + 0.1, C['trim']))
        objs.append(box('door_drum', d0 - 0.2, d1 + 0.2, y0 - 0.55, y0, zb + dh, zb + dh + 0.6, C['trim'], 0.04))
        objs.append(box('canopy', d0 - 1.2, d1 + 1.2, y0 - 2.4, y0, zb + dh + 0.7, zb + dh + 0.85, C['trim'], 0.03))
        for s in (d0 - 1.0, d1 + 1.0): objs.append(cyl('canopy_rod%d' % int(s), (s, y0 - 2.3, zb + dh + 0.78), (s, y0, zb + dh + 2.2), 0.03, C['steel'], 6))
        objs.append(box('door2', D2[0], D2[1], y0 - 0.06, y0, zb, zb + 4.0, C['door']))
        for k in range(11): objs.append(box('door2r%d' % k, D2[0], D2[1], y0 - 0.08, y0 - 0.06, zb + 0.2 + 0.34 * k, zb + 0.24 + 0.34 * k, C['steel']))
        objs.append(box('pdoor', PD[0], PD[1], y0 - 0.06, y0, zb, zb + 2.2, C['trim']))
        objs.append(box('pdoor_can', PD[0] - 0.4, PD[1] + 0.4, y0 - 1.0, y0, zb + 2.75, zb + 2.85, C['trim']))
        for k, s in enumerate((1.5, 3.5, 5.5)):
            for zz in (zb + 1.2, zb + 4.4):
                o = window('fw%d%d' % (k, int(zz)), (x1, y0), (x0, y0), s, zz, 1.4, 1.2, (0, -1, 0)); objs.append(o[0]); glass.append(o[1])
        # the other walls
        objs.append(corr_wall('wall_w', (x0, y0), (x0, y1), zb + 0.45, ze, C['clad']))
        objs.append(corr_wall('wall_b', (x0, y1), (x1, y1), zb + 0.45, ze, C['clad']))
        objs.append(corr_wall('wall_e', (x1, y1), (x1, y0), zb + 0.45, ze, C['clad']))
        # the back: the dispatch door the lorries load at, under a canopy, and a row of windows; two windows on the west end
        objs.append(box('bdoor', BD[0], BD[1], y1, y1 + 0.06, zb, zb + 4.2, C['door']))
        for k in range(12): objs.append(box('bdoor_r%d' % k, BD[0], BD[1], y1 + 0.06, y1 + 0.08, zb + 0.2 + 0.34 * k, zb + 0.24 + 0.34 * k, C['steel']))
        objs.append(box('bdoor_f', BD[0] - 0.15, BD[1] + 0.15, y1, y1 + 0.12, zb + 4.2, zb + 4.45, C['trim']))
        objs.append(box('bcanopy', BD[0] - 1.0, BD[1] + 1.0, y1, y1 + 2.0, zb + 4.8, zb + 4.95, C['trim'], 0.03))
        for k in range(2): objs.append(box('bumper%d' % k, BD[0] + 0.3 + k * 3.1, BD[0] + 0.6 + k * 3.1, y1 + 0.06, y1 + 0.3, zb + 0.9, zb + 1.3, C['rubber']))
        for k, s in enumerate((5.0, 8.0, 11.0, 14.0, 17.0)):
            o = window('bw%d' % k, (x0, y1), (x1, y1), s + 6.0, zb + 4.6, 1.4, 1.0, (0, 1, 0)); objs.append(o[0]); glass.append(o[1])
        for k, s in enumerate((4.0, 9.5)):
            o = window('ww%d' % k, (x0, y0), (x0, y1), s, zb + 4.6, 1.4, 1.0, (-1, 0, 0)); objs.append(o[0]); glass.append(o[1])
        for k, s in enumerate((7.5, 10.0, 12.3)):
            o = window('ew%d' % k, (x1, y1), (x1, y0), s, zb + 4.4, 1.4, 1.1, (1, 0, 0)); objs.append(o[0]); glass.append(o[1])
        # trim: corners and the eaves
        for (cx, cy) in ((x0, y0), (x1, y0), (x0, y1), (x1, y1)): objs.append(box('corner%d%d' % (int(cx), int(cy)), cx - 0.12, cx + 0.12, cy - 0.12, cy + 0.12, zb + 0.45, ze + 0.05, C['trim']))
    else:
        objs.append(box('walls', x0, x1, y0, y1, zb + 0.45, ze, C['clad']))
        objs.append(box('door_d', DOOR[0] - dw / 2, DOOR[0] + dw / 2, y0 - 0.02, y0, zb, zb + dh, C['door']))
    # the roof: a low pitch along the length, overhanging a little, dark
    yc = (y0 + y1) / 2; o = 0.35
    rows = [[(x0 - o, y0 - o, ze - 0.1), (x0 - o, yc, zr), (x0 - o, y1 + o, ze - 0.1)], [(x1 + o, y0 - o, ze - 0.1), (x1 + o, yc, zr), (x1 + o, y1 + o, ze - 0.1)]]
    rf = grid('roof', rows, lambda i, j: C['roof'], angle=10, out=lambda c: (0, 0, 1)); solidify(rf, 0.12); objs.append(rf)
    for x in (x0, x1):
        tri = [(x, y0, ze), (x, yc, zr), (x, y1, ze)]
        bm = bmesh.new(); f = bm.faces.new([bm.verts.new(p) for p in tri]); f.normal_update()
        if f.normal.x * (-1 if x == x0 else 1) < 0: f.normal_flip()
        objs.append(obj_from_bm('gable%d' % int(x), bm, [C['clad']]))
    if fine:
        # the sign over the big door: navy board, white letters
        sx = DOOR[0]; sz = zb + dh + 1.55
        objs.append(box('sign_board', sx - 2.95, sx + 2.95, y0 - 0.14, y0 - 0.02, sz - 0.55, sz + 0.55, C['sign'], 0.02))
        t = text_obj('sign_text', 'FISKEMOTTAK', 0.82, C['letters'], 0.02); place(t, (sx, y0 - 0.16, sz), (math.pi / 2, 0, 0)); objs.append(t)
        # on the roof: two fans and the cooling unit
        for k, x in enumerate((-20.0, -8.0)): objs.append(box('fan%d' % k, x - 1.0, x + 1.0, yc + 1.0, yc + 3.0, zr - 0.6, zr + 0.6, C['steel'], 0.05))
        objs.append(box('cooler', -15.0, -11.0, yc - 4.5, yc - 1.5, ze + 0.2, ze + 1.3, C['steel'], 0.05))
        # an outside stair to the office door on the east end
        for k in range(12): objs.append(box('step%d' % k, x1 + 0.2, x1 + 1.3, y1 - 6.0 + 0.28 * k, y1 - 5.72 + 0.28 * k, zb + 0.25 * k, zb + 0.25 * k + 0.08, C['steel']))
        objs.append(box('landing', x1 + 0.2, x1 + 1.4, y1 - 2.6, y1 - 1.0, zb + 3.0, zb + 3.1, C['steel']))
        objs.append(tube('stair_rail', [(x1 + 1.35, y1 - 6.0, zb + 1.0), (x1 + 1.35, y1 - 2.6, zb + 4.0), (x1 + 1.35, y1 - 1.0, zb + 4.0)], 0.025, C['steel'], 6))
        objs.append(box('odoor', x1 - 0.02, x1 + 0.02, y1 - 2.3, y1 - 1.3, zb + 3.1, zb + 5.2, C['trim']))
    return objs, glass


# ---------- the ice silo with its stand, the chute is a part of its own ----------
CHUTE_L = 10.0; SILO_R = 2.0; SILO_Z0 = QTOP + 5.0; SILO_Z1 = QTOP + 12.5; CHUTE_Z = QTOP + 5.6
def ice(fine=True):
    objs = []; sx, sy = SILO
    for dx, dy in ((1, 1), (1, -1), (-1, 1), (-1, -1)):
        objs.append(cyl('leg%d%d' % (dx, dy), (sx + dx * 1.3, sy + dy * 1.3, QTOP), (sx + dx * 1.3, sy + dy * 1.3, SILO_Z0 + 0.3), 0.12, C['steel'], 8))
    if fine:
        for dx, dy in ((1, 1), (-1, -1)): objs.append(cyl('brace%d' % dx, (sx + dx * 1.3, sy - 1.3, QTOP + 0.3), (sx - dx * 1.3, sy - 1.3, SILO_Z0 - 0.3), 0.05, C['steel'], 6))
    objs.append(cyl('silo', (sx, sy, SILO_Z0), (sx, sy, SILO_Z1), SILO_R, C['silo'], 28 if fine else 10))
    objs.append(cyl('silo_cone', (sx, sy, SILO_Z0), (sx, sy, SILO_Z0 - 1.2), SILO_R, C['silo'], 28 if fine else 10, r1=0.35))
    objs.append(cyl('silo_top', (sx, sy, SILO_Z1), (sx, sy, SILO_Z1 + 0.6), SILO_R, C['silo'], 28 if fine else 10, r1=0.4))
    if fine:
        objs.append(cyl('silo_band', (sx, sy, SILO_Z1 - 1.6), (sx, sy, SILO_Z1 - 1.0), SILO_R + 0.02, C['trim'], 28))
        t = text_obj('ice_text', 'IS', 1.3, C['trim'], 0.0); place(t, (sx, sy - SILO_R - 0.02, SILO_Z0 + 3.4), (math.pi / 2, 0, 0)); objs.append(t)
        # the turntable the chute swings on, the ladder up the side and the railing on top
        objs.append(cyl('turntable', (sx, sy, CHUTE_Z - 0.3), (sx, sy, CHUTE_Z + 0.2), 0.7, C['steel'], 18))
        objs.append(cyl('feed', (sx, sy, SILO_Z0 - 1.2), (sx, sy, CHUTE_Z + 0.2), 0.3, C['steel'], 12))
        for s in (-0.25, 0.25): objs.append(cyl('sl%d' % int(s * 100), (sx + SILO_R + 0.12, sy + s, QTOP), (sx + SILO_R + 0.12, sy + s, SILO_Z1 + 1.4), 0.025, C['steel'], 6))
        for z in [QTOP + 0.4 + 0.4 * k for k in range(29)]: objs.append(cyl('slr%d' % int(z * 10), (sx + SILO_R + 0.12, sy - 0.25, z), (sx + SILO_R + 0.12, sy + 0.25, z), 0.016, C['steel'], 4))
        objs.append(torus('silo_rail', (sx, sy, SILO_Z1 + 1.5), (0, 0, 1), SILO_R - 0.1, 0.025, C['steel'], 28, 4))
        for k in range(8): a = 2 * math.pi * k / 8; objs.append(cyl('srp%d' % k, (sx + math.cos(a) * (SILO_R - 0.1), sy + math.sin(a) * (SILO_R - 0.1), SILO_Z1 + 0.4), (sx + math.cos(a) * (SILO_R - 0.1), sy + math.sin(a) * (SILO_R - 0.1), SILO_Z1 + 1.5), 0.02, C['steel'], 4))
    return objs

def chute():
    """the ice chute: a covered trough from the turntable out over the berth, sloping down, with a spout; pivot at the silo's axis"""
    sx, sy = SILO; L = CHUTE_L; z0 = CHUTE_Z; z1 = CHUTE_Z - 1.6
    objs = [cyl('ch_tube', (sx, sy, z0), (sx, sy - L, z1), 0.32, C['steel'], 14)]
    objs.append(cyl('ch_spout', (sx, sy - L, z1), (sx, sy - L, z1 - 1.3), 0.3, C['steel'], 14, r1=0.22))
    objs.append(box('ch_motor', sx - 0.35, sx + 0.35, sy - 0.2, sy + 0.6, z0 - 0.3, z0 + 0.4, C['trim'], 0.05))
    for k in range(4): t = (k + 1) / 5; objs.append(cyl('ch_rib%d' % k, (sx, sy - L * t, z0 + (z1 - z0) * t - 0.36), (sx, sy - L * t + 0.06, z0 + (z1 - z0) * t - 0.36), 0.36, C['trim'], 14))
    objs.append(cyl('ch_stay', (sx, sy, z0 + 2.2), (sx, sy - L * 0.7, z0 + (z1 - z0) * 0.7 + 0.3), 0.03, C['steel'], 6))
    objs.append(cyl('ch_mast', (sx, sy, z0), (sx, sy, z0 + 2.3), 0.08, C['steel'], 8))
    return join(objs, 'CHUTE')


# ---------- the bunker station ----------
def bunker(fine=True):
    objs = []; tx, ty = TANK
    # the bund round the tank, the tank on its saddles
    objs.append(box('bund_floor', tx - 5.5, tx + 5.5, ty - 2.6, ty + 2.6, QTOP, QTOP + 0.12, C['conc']))
    for nm, a in (('bund_n', (tx - 5.5, tx + 5.5, ty + 2.4, ty + 2.6)), ('bund_s', (tx - 5.5, tx + 5.5, ty - 2.6, ty - 2.4)), ('bund_w', (tx - 5.5, tx - 5.3, ty - 2.6, ty + 2.6)), ('bund_e', (tx + 5.3, tx + 5.5, ty - 2.6, ty + 2.6))):
        objs.append(box(nm, *a, QTOP, QTOP + 0.9, C['conc']))
    for s in (-3.0, 3.0): objs.append(box('saddle%d' % int(s), tx + s - 0.3, tx + s + 0.3, ty - 1.1, ty + 1.1, QTOP + 0.12, QTOP + 0.9, C['conc']))
    objs.append(cyl('tank', (tx - 4.6, ty, QTOP + 2.15), (tx + 4.6, ty, QTOP + 2.15), 1.35, C['tank'], 24 if fine else 10))
    for s in (-4.6, 4.6): objs.append(sphere('tank_end%d' % int(s), (tx + s, ty, QTOP + 2.15), 1.35, C['tank'], (0.25, 1, 1), 24 if fine else 10, 8))
    if not fine: return objs
    objs.append(cyl('tank_band', (tx - 0.5, ty, QTOP + 2.15), (tx + 0.5, ty, QTOP + 2.15), 1.37, C['red'], 24))
    t = text_obj('tank_text', 'DIESEL', 0.75, C['red'], 0.0); place(t, (tx + 2.6, ty - 1.36, QTOP + 2.15), (math.pi / 2, 0, 0)); objs.append(t)
    objs.append(cyl('tank_vent', (tx + 3.6, ty, QTOP + 3.4), (tx + 3.6, ty, QTOP + 4.4), 0.05, C['steel'], 6))
    # the pipe from the tank to the pump at the face, on low supports
    px, py = PUMP; pipe = [(tx - 4.0, ty - 1.2, QTOP + 1.0), (tx - 4.0, ty - 3.2, QTOP + 0.35), (px + 0.6, ty - 3.2, QTOP + 0.35), (px + 0.6, py + 0.7, QTOP + 0.35), (px + 0.3, py + 0.35, QTOP + 0.6)]
    objs.append(tube('pipe', pipe, 0.06, C['steel'], 8))
    for y in range(int(py + 3), int(ty - 3), 3): objs.append(box('pipe_sup%d' % y, px + 0.45, px + 0.75, y - 0.05, y + 0.05, QTOP, QTOP + 0.3, C['conc']))
    # the pump cabinet with its hose reel, a sign and an extinguisher
    objs.append(box('pump', px - 0.55, px + 0.55, py - 0.35, py + 0.35, QTOP, QTOP + 1.7, C['red'], 0.04))
    objs.append(box('pump_face', px - 0.4, px + 0.4, py - 0.37, py - 0.35, QTOP + 1.1, QTOP + 1.5, C['dark']))
    objs.append(cyl('reel', (px + 0.58, py, QTOP + 1.0), (px + 0.9, py, QTOP + 1.0), 0.45, C['dark'], 18))
    objs.append(torus('hose', (px + 0.74, py, QTOP + 1.0), (1, 0, 0), 0.34, 0.06, C['rubber'], 20, 6))
    objs.append(cyl('nozzle_hold', (px - 0.62, py - 0.2, QTOP + 1.2), (px - 0.62, py - 0.2, QTOP + 1.45), 0.05, C['dark'], 8))
    objs.append(box('sign_post', px - 1.5, px - 1.42, py + 0.1, py + 0.18, QTOP, QTOP + 2.6, C['steel']))
    objs.append(box('sign_b', px - 2.1, px - 0.8, py + 0.05, py + 0.1, QTOP + 2.0, QTOP + 2.6, C['red']))
    t = text_obj('pump_text', 'BUNKERS', 0.26, C['letters'], 0.0, 2); place(t, (px - 1.45, py + 0.04, QTOP + 2.3), (math.pi / 2, 0, 0)); objs.append(t)
    objs.append(cyl('ext', (px - 0.8, py + 0.2, QTOP), (px - 0.8, py + 0.2, QTOP + 0.6), 0.09, C['red'], 10))
    return objs


# ---------- the crane: the pedestal stays, the slewing house, the two boom sections and the hook move ----------
CR_PIV = QTOP + 2.6           # the boom's heel, as in view3d.js
def crane_pedestal():
    cx, cy = CRANE
    return [cyl('cr_base', (cx, cy, QTOP), (cx, cy, QTOP + 0.15), 0.9, C['crane'], 18), cyl('cr_ped', (cx, cy, QTOP + 0.15), (cx, cy, QTOP + 1.1), 0.42, C['crane'], 16)]

def crane_parts():
    """a quay crane worked by remote control from the quay (no cab): slewing ring and housing, a tapered column with the boom's
    heel on top, a valve block and a control stand on the column"""
    cx, cy = CRANE; z = QTOP + 1.1
    h = [cyl('cr_ring', (cx, cy, z), (cx, cy, z + 0.22), 0.56, C['dark'], 20), cyl('cr_slew', (cx, cy, z + 0.22), (cx, cy, z + 0.7), 0.5, C['crane'], 20),
         cyl('cr_col', (cx, cy, z + 0.7), (cx, cy, CR_PIV - 0.2), 0.33, C['crane'], 14, r1=0.26),
         box('cr_cap', cx - 0.3, cx + 0.3, cy - 0.32, cy + 0.32, CR_PIV - 0.35, CR_PIV - 0.15, C['crane'], 0.03),
         box('cr_heel_l', cx - 0.36, cx - 0.26, cy - 0.32, cy + 0.32, CR_PIV - 0.35, CR_PIV + 0.3, C['crane'], 0.02),
         box('cr_heel_r', cx + 0.26, cx + 0.36, cy - 0.32, cy + 0.32, CR_PIV - 0.35, CR_PIV + 0.3, C['crane'], 0.02),
         cyl('cr_pin', (cx - 0.42, cy, CR_PIV), (cx + 0.42, cy, CR_PIV), 0.09, C['steel'], 10),
         box('cr_lug', cx - 0.14, cx + 0.14, cy - 0.42, cy - 0.2, CR_PIV - 1.55, CR_PIV - 1.25, C['crane'], 0.02),
         box('cr_valve', cx - 0.25, cx + 0.25, cy + 0.3, cy + 0.55, z + 0.9, z + 1.4, C['dark'], 0.03),
         box('cr_ctrl', cx + 0.42, cx + 0.72, cy - 0.15, cy + 0.2, z + 0.75, z + 1.25, C['dark'], 0.03)]
    for k in range(3): h.append(cyl('cr_lever%d' % k, (cx + 0.57, cy - 0.08 + 0.1 * k, z + 1.25), (cx + 0.57, cy - 0.1 + 0.1 * k, z + 1.45), 0.012, C['steel'], 5))
    for k, dx in enumerate((-0.12, 0.0, 0.12)): h.append(tube('cr_hose%d' % k, [(cx + dx, cy + 0.42, z + 1.4), (cx + dx, cy + 0.36, CR_PIV - 0.6), (cx + dx * 1.5, cy + 0.15, CR_PIV + 0.3)], 0.018, C['rubber'], 5))
    house = join(h, 'CR_HOUSE')
    # the boom sections lie along -y from the heel (towards the sea), as the game's frame has them along +z
    b1 = join([box('b1', cx - 0.24, cx + 0.24, cy - 4.8, cy + 0.3, CR_PIV - 0.28, CR_PIV + 0.28, C['crane'], 0.04),
               cyl('b1_barrel', (cx, cy - 0.31, CR_PIV - 1.4), (cx, cy - 1.3, CR_PIV - 0.85), 0.13, C['crane'], 12),
               cyl('b1_ram', (cx, cy - 1.2, CR_PIV - 0.9), (cx, cy - 2.2, CR_PIV - 0.32), 0.08, C['steel'], 10),
               box('b1_lug', cx - 0.12, cx + 0.12, cy - 2.4, cy - 2.0, CR_PIV - 0.42, CR_PIV - 0.27, C['crane']),
               tube('b1_hose', [(cx + 0.27, cy + 0.2, CR_PIV + 0.1), (cx + 0.27, cy - 4.6, CR_PIV + 0.1)], 0.02, C['rubber'], 5)], 'CR_BOOM1')
    b2 = join([box('b2', cx - 0.18, cx + 0.18, cy - 4.9, cy, CR_PIV - 0.21, CR_PIV + 0.21, C['crane'], 0.03),
               cyl('b2_sheave', (cx - 0.12, cy - 4.95, CR_PIV), (cx + 0.12, cy - 4.95, CR_PIV), 0.2, C['dark'], 14)], 'CR_BOOM2')
    hk = join([box('hk_block', cx - 0.16, cx + 0.16, cy - 0.12, cy + 0.12, -0.45, 0.0, C['crane'], 0.03), torus('hk_hook', (cx, cy, -0.57), (1, 0, 0), 0.12, 0.03, C['dark'], 14, 5)], 'CR_HOOK')   # origin where the wire is made fast
    return house, b1, b2, hk


# ---------- the forklift: body with the driver and the mast; the carriage with the forks lifts ----------
TRUCK_AT = (-2.0, 7.5)          # where it is parked in the renders, facing inland
def truck_parts():
    x, y = TRUCK_AT; z = QTOP
    b = []
    for wx, wy, r in ((-0.55, 0.45, 0.32), (0.55, 0.45, 0.32), (-0.5, -0.85, 0.26), (0.5, -0.85, 0.26)):
        b.append(cyl('tw%d%d' % (int(wx * 10), int(wy * 10)), (x + wx - 0.12 * (1 if wx > 0 else -1), y + wy, z + r), (x + wx + 0.12 * (1 if wx > 0 else -1), y + wy, z + r), r, C['rubber'], 16))
    b.append(box('tbody', x - 0.55, x + 0.55, y - 0.85, y + 0.75, z + 0.25, z + 1.0, C['truck'], 0.06))
    b.append(box('tcw', x - 0.55, x + 0.55, y - 1.35, y - 0.8, z + 0.25, z + 1.15, C['truck'], 0.1))                        # the counterweight
    b.append(box('tcw_b', x - 0.56, x + 0.56, y - 1.37, y - 1.2, z + 0.3, z + 0.5, C['dark']))
    b.append(box('tseat', x - 0.24, x + 0.24, y - 0.75, y - 0.25, z + 1.0, z + 1.12, C['dark'], 0.03))
    b.append(box('tseat_b', x - 0.24, x + 0.24, y - 0.8, y - 0.68, z + 1.12, z + 1.6, C['dark'], 0.03))
    b.append(cyl('twheel', (x, y + 0.25, z + 1.25), (x, y + 0.12, z + 1.45), 0.17, C['dark'], 12, r1=0.17))
    for px in (-0.5, 0.5):
        for py in (-0.75, 0.55): b.append(cyl('tg%d%d' % (int(px * 10), int(py * 10)), (x + px, y + py, z + 1.1), (x + px, y + py, z + 2.15), 0.035, C['dark'], 6))
    b.append(box('tguard', x - 0.55, x + 0.55, y - 0.8, y + 0.6, z + 2.12, z + 2.2, C['dark']))
    for px in (-0.38, 0.38): b.append(box('tmast%d' % int(px * 10), x + px - 0.05, x + px + 0.05, y + 0.78, y + 0.9, z + 0.15, z + 2.3, C['dark']))
    b.append(box('tmast_top', x - 0.43, x + 0.43, y + 0.78, y + 0.9, z + 2.2, z + 2.3, C['dark']))
    # the driver, seated, facing the forks: legs forward, in the blue coverall and the yellow hard hat
    for dx in (-0.12, 0.12):
        b.append(box('drv_t%d' % int(dx * 100), x + dx - 0.07, x + dx + 0.07, y - 0.65, y - 0.1, z + 1.1, z + 1.25, C['coverall']))
        b.append(box('drv_s%d' % int(dx * 100), x + dx - 0.06, x + dx + 0.06, y - 0.18, y - 0.06, z + 0.85, z + 1.2, C['coverall']))
    b.append(box('drv_b', x - 0.2, x + 0.2, y - 0.66, y - 0.38, z + 1.12, z + 1.7, C['coverall'], 0.04))
    b.append(sphere('drv_h', (x, y - 0.5, z + 1.84), 0.11, C['skin'])); b.append(sphere('drv_c', (x, y - 0.5, z + 1.9), 0.125, C['yellow'], (1, 1, 0.7)))
    body = join(b, 'TRUCK')
    f = [box('tcarr', x - 0.45, x + 0.45, y + 0.92, y + 1.0, z + 0.15, z + 1.0, C['dark'])]
    for px in (-0.28, 0.28): f.append(box('tfork%d' % int(px * 10), x + px - 0.05, x + px + 0.05, y + 0.92, y + 2.1, z + 0.1, z + 0.16, C['steel']))
    forks = join(f, 'TRUCK_FORKS')
    return body, forks


# ---------- the roller door ----------
def door_part():
    d0, d1 = DOOR[0] - 2.2, DOOR[0] + 2.2; y = BLDG[2]
    o = [box('rd', d0, d1, y - 0.08, y - 0.02, QTOP, QTOP + 4.8, C['door'])]
    for k in range(14): o.append(box('rdr%d' % k, d0, d1, y - 0.1, y - 0.08, QTOP + 0.2 + 0.34 * k, QTOP + 0.24 + 0.34 * k, C['steel']))
    o.append(box('rd_win', d0 + 0.6, d1 - 0.6, y - 0.11, y - 0.1, QTOP + 2.8, QTOP + 3.3, C['glass']))
    return join(o, 'DOOR')


# ---------- things standing about ----------
def props(fine=True):
    objs = []
    if not fine: return objs
    rnd = random.Random(3)
    def pallet(x, y, n, colm):
        o = [box('pal%d%d' % (int(x * 10), int(y * 10)), x - 0.6, x + 0.6, y - 0.4, y + 0.4, QTOP, QTOP + 0.14, C['wood'])]
        for k in range(n):
            lay, i = divmod(k, 3)
            o.append(box('fb%d%d%d' % (int(x * 10), int(y * 10), k), x - 0.6 + 0.4 * i + 0.01, x - 0.2 + 0.4 * i - 0.01, y - 0.39, y + 0.39, QTOP + 0.14 + 0.29 * lay, QTOP + 0.42 + 0.29 * lay, colm if lay % 2 == 0 else C['box_g']))
        return o
    for k, (x, y) in enumerate(((-25.3, 8.6), (-23.9, 8.6), (-25.3, 7.4), (-23.9, 7.4))):
        objs += pallet(x, y, 6 + 3 * (k % 3), C['box_b'])
    # empty tubs stacked by the door, and one on its own
    for k, (x, y) in enumerate(((-18.6, 8.6), (-17.3, 8.6))):
        for j in range(3): objs.append(box('tub%d%d' % (k, j), x - 0.6, x + 0.6, y - 0.5, y + 0.5, QTOP + 0.78 * j, QTOP + 0.78 * j + 0.8, C['tub'], 0.04))
    # a container and a van at the back, a skip by the van
    objs.append(box('container', 6.0, 12.1, 21.0, 23.45, QTOP, QTOP + 2.6, C['cont'], 0.03))
    for k in range(12): objs.append(box('cont_r%d' % k, 6.0 + 0.5 * k + 0.2, 6.0 + 0.5 * k + 0.26, 20.98, 21.0, QTOP + 0.1, QTOP + 2.5, C['cont']))
    objs.append(box('van', 7.0, 8.9, 12.0, 16.9, QTOP + 0.35, QTOP + 2.3, C['van'], 0.12))
    objs.append(box('van_w', 7.05, 8.85, 11.96, 12.0, QTOP + 1.3, QTOP + 2.0, C['glass']))
    for wx, wy in ((7.1, 12.9), (8.8, 12.9), (7.1, 15.9), (8.8, 15.9)): objs.append(cyl('vw%d%d' % (int(wx), int(wy)), (wx - 0.12, wy, QTOP + 0.35), (wx + 0.12, wy, QTOP + 0.35), 0.35, C['rubber'], 14))
    objs.append(box('skip', 10.6, 13.0, 13.0, 15.4, QTOP, QTOP + 1.4, C['trim'], 0.05))
    # a couple of people on the quay for the renders are drawn by the game; here only a bench by the plant door
    objs.append(box('bench', -6.5, -5.0, 9.4, 9.8, QTOP + 0.42, QTOP + 0.48, C['wood']))
    for x in (-6.4, -5.1): objs.append(box('bench_l%d' % int(x * 10), x, x + 0.08, 9.45, 9.75, QTOP, QTOP + 0.42, C['dark']))
    return objs


def build(fine=True):
    solids = quay(fine)
    o, g = plant(fine); solids += o
    solids += ice(fine)
    solids += bunker(fine)
    solids += crane_pedestal()
    solids += props(fine)
    if not g: g = [box('noglass', 0, 0.01, 0, 0.01, -50, -49.99, C['glass'])]
    return solids, g


# ---------- export ----------
def to_game(p): return (p[0], p[2], -p[1])
def to_game_n(n): return (n[0], n[2], -n[1])
def rel_game(c):
    g = to_game(c); return lambda p: tuple(a - b for a, b in zip(to_game(p), g))

def anchors():
    G = lambda x, y, z=QTOP: [round(v, 3) for v in to_game((x, y, z))]
    # the forklift's round, in the unit's frame on the deck: wait by the drop spot, in to the loads, back, over to the door and in, out
    # again; every point keeps the truck's corners 2.5 m or more from the face and the deck's edges (checked in the test)
    path = [(-6.0, 6.6), (-9.5, 6.6), (-12.0, 7.4), (-13.0, 9.0), (-13.0, 13.5), (-13.0, 9.0), (-11.5, 7.0), (-8.0, 6.4), (-6.0, 6.6)]
    return {'face': {'hl': HL, 'depth': DEPTH, 'kerb': KERB, 'deckY': QTOP, 'bottom': WALL_BOT},
            'deck': [G(-HL - 0.4, 0.0), G(HL + 0.4, 0.0), G(HL + 0.4, DEPTH + 0.4), G(-HL - 0.4, DEPTH + 0.4)],
            'basin': {'poly': [G(-HL - 6, 0.0), G(HL + 6, 0.0), G(HL + 6, -26.0), G(-HL - 6, -26.0)], 'depth': -6.6},
            'footprint': {'poly': [G(-HL - 3, 0.0), G(HL + 3, 0.0), G(HL + 3, DEPTH + 3), G(-HL - 3, DEPTH + 3)]},
            'berths': {'main': {'at': G(BERTH, 0.0), 'len': 24.0}, 'bunker': {'at': G(17.5, 0.0), 'len': 18.0}},
            'crane': {'base': G(CRANE[0], CRANE[1], QTOP + 1.1), 'heel': G(CRANE[0], CRANE[1], CR_PIV), 'boom1': 4.8, 'boom2': 4.9},
            'drop': G(*DROP), 'door': {'out': G(DOOR[0], DOOR[1] - 3.0), 'in': G(DOOR[0], DOOR[1] + 4.0), 'at': G(DOOR[0], DOOR[1]), 'w': 4.4, 'h': 4.8},
            'truckPath': [G(x, y) for x, y in path], 'truck': {'park': G(*TRUCK_AT), 'front': 2.1, 'back': 1.35, 'half': 0.7},
            'silo': {'axis': G(SILO[0], SILO[1], CHUTE_Z), 'r': SILO_R, 'chute': CHUTE_L, 'drop': CHUTE_Z - 1.6 - 1.3},
            'pump': G(PUMP[0], PUMP[1], QTOP + 1.2), 'reel': G(PUMP[0] + 0.74, PUMP[1], QTOP + 1.0),
            'workers': {'signal': G(-4.5, 1.0), 'receive': G(-11.0, 4.0), 'tally': G(-10.0, 8.6), 'remote': G(-10.5, 2.4), 'bunker': G(16.6, 1.4), 'ice': G(4.2, 3.6)},
            'lamps': [G(x, y - 0.3, QTOP + 8.85) for x, y in ((-24.0, 1.4), (0.0, 1.4), (24.0, 1.4), (-6.0, 23.0), (12.0, 23.0))]}

SHOTS = [('sea3q', (34.0, -42.0, 16.0), (-2.0, 8.0, 3.0), 30), ('front', (0.0, -55.0, 6.0), (0.0, 8.0, 4.0), 32), ('above', (30.0, -20.0, 45.0), (0.0, 10.0, 0.0), 30),
         ('quay', (3.0, 2.6, QTOP + 1.7), (-14.0, 9.0, QTOP + 2.4), 30), ('truck', (-5.0, 3.6, QTOP + 2.3), (-1.5, 8.0, QTOP + 0.9), 35),
         ('crane', (0.0, -16.0, 3.0), (-8.0, 0.0, 4.2), 35), ('bunker', (10.0, -6.0, QTOP + 4.0), (19.0, 8.0, QTOP + 1.0), 30),
         ('land', (-40.0, 45.0, 18.0), (0.0, 8.0, 2.0), 30)]

def main():
    os.makedirs(OUT, exist_ok=True)
    reset(); colours()
    solids, glass = build(True)
    join(solids, 'BOAT0'); join(glass, 'GLASS0')
    house, b1, b2, hk = crane_parts(); body, forks = truck_parts(); dr = door_part(); ch = chute()
    cx, cy = CRANE; tx, ty = TRUCK_AT; sx, sy = SILO; dx = DOOR[0]
    if 'fast' not in sys.argv and 'dry' not in sys.argv:
        # for the renders only: water and a shore behind the quay, the boom run out with the hook on its wire, a few people
        bm = bmesh.new(); s_ = 160
        bm.faces.new([bm.verts.new(p) for p in ((-s_, -s_, 0), (s_, -s_, 0), (s_, s_, 0), (-s_, s_, 0))])
        obj_from_bm('water', bm, [mat('water', (0.03, 0.09, 0.12), 0.9)])
        ys = [DEPTH - 9, DEPTH + 0.35, 60, 160]; zs = [-4.0, QTOP - 0.03, 7.0, 15.0]
        shore = grid('shore', [[(x, y, z) for y, z in zip(ys, zs)] for x in (-160, 160)], lambda i, j: mat('land', (0.27, 0.31, 0.22), 0.05), out=lambda c: (0, 0, 1))
        b2.location = (0, -4.5, 0); hk.location = (0, -9.4, CR_PIV - 1.6)
        extra = [shore, cyl('wire', (cx, cy - 9.4, CR_PIV - 0.2), (cx, cy - 9.4, CR_PIV - 1.6), 0.012, C['dark'], 6)]
        # the harbour workers from arbeider.py, standing at their stations facing the berth
        import arbeider
        arbeider.colours(); WP = arbeider.build_all()
        for o in WP.values(): o.hide_render = True
        for k, (x, y, h) in enumerate(((-4.5, 1.0, math.pi), (-11.0, 4.0, math.pi * 0.9), (16.6, 1.4, math.pi), (-10.0, 8.6, math.pi * 1.2))):
            for o in arbeider.pose(WP, x, y, h, 'hw'): o.location.z += QTOP; extra.append(o)
        extra += list(WP.values())
        beauty(OUT, 'hu', 0.0, SHOTS)
        for o in extra: bpy.data.objects.remove(o, do_unlink=True)
        b2.location = (0, 0, 0); hk.location = (0, 0, 0)
    more = [{'name': 'crane_house', 'obj': house, 'xf_p': rel_game((cx, cy, QTOP + 1.1)), 'ao': True, 'show': True},
            {'name': 'crane_boom1', 'obj': b1, 'xf_p': rel_game((cx, cy, CR_PIV)), 'ao': True, 'show': True},
            {'name': 'crane_boom2', 'obj': b2, 'xf_p': rel_game((cx, cy, CR_PIV)), 'ao': True, 'show': True},
            {'name': 'crane_hook', 'obj': hk, 'xf_p': rel_game((cx, cy, 0.0)), 'ao': False, 'show': True},
            {'name': 'truck', 'obj': body, 'xf_p': rel_game((tx, ty, QTOP)), 'ao': True, 'show': True},
            {'name': 'truck_forks', 'obj': forks, 'xf_p': rel_game((tx, ty, QTOP)), 'ao': False, 'show': True},
            {'name': 'door', 'obj': dr, 'xf_p': rel_game((dx, BLDG[2], QTOP + 4.8)), 'ao': False, 'show': True},
            {'name': 'chute', 'obj': ch, 'xf_p': rel_game((sx, sy, CHUTE_Z)), 'ao': True, 'show': True}]
    ex = {'frame': 'kystfiske harbour unit: x along the quay face, y up from mean sea level, z out to sea; metres', 'name': 'Kai med fiskemottak, is og bunkers',
          'anchors': anchors()}
    export_boat(build, to_game, to_game_n, OUT, 'harbour-unit.glb', os.path.join(ROOT, 'src', 'data', 'harbour-unit.b64'), ex, side=None, dry='dry' in sys.argv, more=more)


if __name__ == '__main__':
    main()
