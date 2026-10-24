"""The gear shop and boat dealer on the quay at Finnsnes, where every new player starts (Jonas 05.10.2026: «Lag en blender modell av en
utstyrsbutikk/båtforhandler som kan stå på kaia der. Gjør det bra, det er tross alt der første brukerne ser»). Built in Blender like
the harbour unit (kaimottak.py) and set down behind the quay face in Finnsnes by the 3D view.

What it is: a two-storey shop in navy-painted standing boards with white trim, big shop windows towards the quay, the sign BÅT &
FISKEUTSTYR between the floors and a canopy over the door; beside it a lower boat hall in grey steel with a roller door, where the
boats are serviced. Out on the deck: an open boat on its trailer, an aluminium boat on blocks, a rack of outboards, the float rack,
the ice freezer with a pallet of bagged ice (Finnsnes has no ice chute: the shop sells the ice in bags), fish crates, a bench, lamp
posts and the flag. The deck itself, its fittings and the bunker station are the game's; the bunker tank stands 6 m in, about 2 m
east of the berth's middle, so nothing here stands on x -1.5 .. 6.5 nearer than 9 m from the face.

    pip install bpy==4.5.4
    python3 tools/harbour/butikk.py          -> src/data/harbour-shop.b64, renders in tools/harbour/out/
    python3 tools/harbour/butikk.py fast     -> without the renders to look at
    python3 tools/harbour/butikk.py dry      -> the GLB only in tools/harbour/out

Frame here as in kaimottak.py: x along the quay face (x = 0 is the berth's middle), the face at y = 0, y inland, z up from mean sea
level. In the game: x along the face, y up, z out to sea."""
import os, sys, math
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))
sys.path.insert(0, os.path.join(ROOT, 'tools', 'boats'))
import bpy, bmesh
from bpyutil import *

OUT = os.path.join(HERE, 'out')
QTOP = 2.4                                   # the deck above mean sea level, as QTOP in 07-harbours.js
SHOP = (-16.0, 4.0, 11.5, 23.5)              # the shop: x0, x1, y0, y1
FLOOR = QTOP + 0.45                          # its floor on a concrete plinth
EAVES = QTOP + 6.8; RIDGE = QTOP + 10.2      # two storeys, a 30-degree roof with the ridge along the quay
HALL = (4.0, 16.0, 11.5, 25.5)               # the boat hall: x0, x1, y0, y1
HEAVES = QTOP + 6.2; HRIDGE = QTOP + 7.8     # a low roof with the ridge running inland, the gable with the roller door to the quay
APRON = (-19.0, 19.0, 9.6, 27.5)             # the paved yard from the deck's back edge round the buildings
ROLL = (10.6, 5.0, 4.6)                      # the roller door: middle x, width, height
DOOR = -7.0                                  # the shop's glass doors (middle x)
SIGN_SHOP, SIGN_GABLE, SIGN_HALL = 'BÅT & FISKEUTSTYR', 'FISKEUTSTYR', 'BÅTSALG · VERKSTED'   # the signs (tools/harbour/steder.py sets its own)
C = {}


def colours():
    C['navy'] = mat('cladding', (0.09, 0.18, 0.34), 0.2)
    C['trim'] = mat('trim', (0.90, 0.90, 0.86), 0.3)
    C['roof'] = mat('roof', (0.12, 0.13, 0.14), 0.3)
    C['steel'] = mat('steel_cladding', (0.70, 0.72, 0.73), 0.45)
    C['roll'] = mat('roller_door', (0.82, 0.84, 0.85), 0.4)
    C['groove'] = mat('groove', (0.36, 0.38, 0.40), 0.3)
    C['conc'] = mat('concrete', (0.56, 0.56, 0.54), 0.1)
    C['asph'] = mat('asphalt', (0.19, 0.19, 0.20), 0.05)
    C['sign'] = mat('sign', (0.94, 0.94, 0.91), 0.35)
    C['letters'] = mat('letters', (0.06, 0.13, 0.28), 0.3)
    C['glass'] = mat('glass', (0.07, 0.10, 0.13), 0.9)
    C['dark'] = mat('dark', (0.10, 0.10, 0.11), 0.3)
    C['gutter'] = mat('gutter', (0.24, 0.25, 0.26), 0.4)
    C['hull'] = mat('hull_white', (0.92, 0.92, 0.90), 0.6)
    C['anti'] = mat('antifouling', (0.50, 0.11, 0.09), 0.3)
    C['deck'] = mat('boat_deck', (0.62, 0.64, 0.64), 0.3)
    C['alu'] = mat('aluminium', (0.66, 0.69, 0.71), 0.6, metal=0.6)
    C['galv'] = mat('galvanised', (0.60, 0.62, 0.63), 0.5, metal=0.5)
    C['tyre'] = mat('tyre', (0.05, 0.05, 0.05), 0.2)
    C['ob_blk'] = mat('outboard_black', (0.07, 0.07, 0.08), 0.6)
    C['ob_wht'] = mat('outboard_white', (0.90, 0.90, 0.90), 0.6)
    C['ob_gry'] = mat('outboard_grey', (0.45, 0.47, 0.50), 0.6)
    C['wood'] = mat('wood', (0.46, 0.34, 0.22), 0.15)
    C['red'] = mat('flag_red', (0.73, 0.06, 0.12), 0.3)
    C['blue'] = mat('flag_blue', (0.0, 0.13, 0.36), 0.3)
    C['white'] = mat('white', (0.95, 0.95, 0.94), 0.3)
    C['gold'] = mat('gold', (0.85, 0.65, 0.2), 0.7, metal=0.8)
    C['ice'] = mat('ice_bags', (0.90, 0.93, 0.96), 0.5)
    C['crate'] = mat('fish_crate', (0.12, 0.33, 0.62), 0.4)
    C['crate2'] = mat('fish_crate_grey', (0.55, 0.58, 0.60), 0.4)
    C['orange'] = mat('float_orange', (0.95, 0.40, 0.05), 0.5)
    C['yellow'] = mat('float_yellow', (0.95, 0.75, 0.10), 0.5)
    C['post'] = mat('lamp_post', (0.20, 0.21, 0.22), 0.4)
    C['lamp'] = mat('lamp', (1.0, 0.86, 0.6), 0.6, emit=0.6)
    C['seat'] = mat('seat', (0.16, 0.17, 0.19), 0.3)


# ---------- helpers ----------
def text_obj(name, s, size, m, extrude=0.03, res=3):
    cu = bpy.data.curves.new(name, 'FONT'); cu.body = s; cu.size = size; cu.extrude = extrude; cu.resolution_u = res; cu.align_x = 'CENTER'; cu.align_y = 'CENTER'
    o = bpy.data.objects.new(name + '_c', cu); link(o)
    dg = bpy.context.evaluated_depsgraph_get(); me = bpy.data.meshes.new_from_object(o.evaluated_get(dg))
    bpy.data.objects.remove(o, do_unlink=True); me.materials.append(m)
    return link(bpy.data.objects.new(name, me))

def place(o, loc, rot=(0, 0, 0)):
    o.location = loc; o.rotation_euler = rot; return o

def ribs(name, a, b, z0, top, m, period, amp, out):
    """standing boards or trapezoidal steel from a to b (x, y): ribs every period/2 pushed out by amp along out; top(p) the height of
    the wall's top at p (flat walls, gables)"""
    a = V((a[0], a[1], 0)); b = V((b[0], b[1], 0)); d = b - a; L = d.length; o = V((out[0], out[1], 0))
    n = max(2, int(round(L / period)) * 2); rows = []
    for k in range(n + 1):
        p = a + d * (k / n); q = p + o * (amp if k % 2 else 0.0); rows.append([(q.x, q.y, z0), (q.x, q.y, top(p))])
    return grid(name, rows, lambda i, j: m, angle=60, out=lambda c, oo=o: (oo.x, oo.y, 0))

def window(name, a, b, s, z, w, h, nrm, frame=None, glass=None):
    """a window in the wall a->b at s along it, sill at z, w x h: [frame, glass]"""
    a = V((a[0], a[1], 0)); b = V((b[0], b[1], 0)); u = (b - a).normalized(); o = a + u * s; n = V(nrm)
    poly = rrect(0, z + h / 2, w, h, 0.03, 1); outer = rrect(0, z + h / 2, w + 0.16, h + 0.16, 0.04, 1)
    return [frame_ring(name + '_f', o + n * 0.09, u, (0, 0, 1), outer, poly, frame or C['trim'], 0.0, 0.07, nrm=nrm),
            plate(name + '_g', o + n * 0.05, u, (0, 0, 1), poly, glass or C['glass'], nrm=nrm)]

def prism_x(name, sec, x0, x1, m):
    """a prism along x from a polygon sec [(y, z)] (counter-clockwise seen from +x)"""
    bm = bmesh.new(); A = [bm.verts.new((x0, y, z)) for y, z in sec]; B = [bm.verts.new((x1, y, z)) for y, z in sec]; n = len(sec)
    for i in range(n):
        j = (i + 1) % n; bm.faces.new([A[i], A[j], B[j], B[i]])
    bm.faces.new(list(reversed(A))); bm.faces.new(B)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return shade(obj_from_bm(name, bm, [m]), 40)

def prism_y(name, sec, y0, y1, m):
    """a prism along y from a polygon sec [(x, z)]"""
    bm = bmesh.new(); A = [bm.verts.new((x, y0, z)) for x, z in sec]; B = [bm.verts.new((x, y1, z)) for x, z in sec]; n = len(sec)
    for i in range(n):
        j = (i + 1) % n; bm.faces.new([A[i], A[j], B[j], B[i]])
    bm.faces.new(list(reversed(A))); bm.faces.new(B)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return shade(obj_from_bm(name, bm, [m]), 40)

def slab(name, p0, p1, p2, p3, t, m):
    """a board from four corners (a quad), t thick towards its back"""
    P = [V(p) for p in (p0, p1, p2, p3)]; n = (P[1] - P[0]).cross(P[3] - P[0]).normalized()
    return loft_rings(name, [[p - n * t for p in P], P], m)


# ---------- the yard, the shop and the hall ----------
def yard(fine=True):
    x0, x1, y0, y1 = APRON
    objs = [box('apron', x0, x1, y0, y1, -3.0, QTOP + 0.02, C['asph'])]
    if fine:
        # a kerb of concrete round the yard's edge inland, and the parking lines along the hall
        objs.append(box('kerb_back', x0, x1, y1 - 0.25, y1, QTOP, QTOP + 0.15, C['conc']))
        for k in range(4): objs.append(box('pline%d' % k, 17.0, 18.6, 13.0 + 2.8 * k, 13.12 + 2.8 * k, QTOP + 0.02, QTOP + 0.03, C['white']))
    return objs

def shop(fine=True):
    x0, x1, y0, y1 = SHOP; ym = (y0 + y1) / 2; hw = (y1 - y0) / 2
    top = lambda p: EAVES + (RIDGE - EAVES) * max(0.0, 1 - abs(p.y - ym) / hw)
    o, g = [], []
    o.append(box('shop_plinth', x0 - 0.1, x1 + 0.1, y0 - 0.1, y1 + 0.1, -3.0, FLOOR, C['conc']))
    oh, t = 0.55, 0.22; dz = oh * (RIDGE - EAVES) / hw
    roof = [(y0 - oh, EAVES - dz), (y0 - oh, EAVES - dz + t), (ym, RIDGE + t), (y1 + oh, EAVES - dz + t), (y1 + oh, EAVES - dz), (ym, RIDGE)]
    o.append(prism_x('shop_roof', roof, x0 - 0.5, x1 + 0.5, C['roof']))
    if not fine:
        o.append(box('shop_walls', x0, x1, y0, y1, FLOOR, EAVES, C['navy']))
        o.append(prism_x('shop_gables', [(y0, EAVES), (y1, EAVES), (ym, RIDGE)], x0, x1, C['navy']))
        o.append(box('shop_sign', -12.0, 0.0, y0 - 0.12, y0, QTOP + 3.15, QTOP + 4.05, C['sign']))
        o.append(box('shop_windows', -15.2, -2.0, y0 - 0.1, y0, QTOP + 0.6, QTOP + 3.0, C['glass']))
        return o, g
    P, Q = 0.19, 0.022
    o.append(ribs('shop_front', (x1, y0), (x0, y0), FLOOR, lambda p: EAVES, C['navy'], P, Q, (0, -1)))
    o.append(ribs('shop_back', (x0, y1), (x1, y1), FLOOR, lambda p: EAVES, C['navy'], P, Q, (0, 1)))
    o.append(ribs('shop_west', (x0, y0), (x0, y1), FLOOR, top, C['navy'], P, Q, (-1, 0)))
    o.append(ribs('shop_east', (x1, y1), (x1, y0), HEAVES - 0.4, top, C['navy'], P, Q, (1, 0)))
    # white corner boards, the eaves' fascia, the barge boards and a plinth band
    for cx, cy in ((x0, y0), (x1, y0), (x0, y1), (x1, y1)):
        o.append(box('corner', cx - 0.11, cx + 0.11, cy - 0.11, cy + 0.11, FLOOR, EAVES, C['trim']))
    for yy, s in ((y0 - oh, -1), (y1 + oh, 1)):
        o.append(box('fascia', x0 - 0.5, x1 + 0.5, yy - 0.04 * (s < 0), yy + 0.04 * (s > 0), EAVES - dz - 0.22, EAVES - dz + t, C['trim']))
    for xx in (x0 - 0.53, x1 + 0.53):
        for ya, yb in ((y0 - oh, ym), (y1 + oh, ym)):
            za = EAVES - dz; zb = RIDGE
            o.append(slab('barge', (xx, ya, za - 0.2), (xx, yb, zb - 0.2), (xx, yb, zb + t + 0.02), (xx, ya, za + t + 0.02), 0.05, C['trim']))
    o.append(box('ridge_cap', x0 - 0.5, x1 + 0.5, ym - 0.18, ym + 0.18, RIDGE + t - 0.02, RIDGE + t + 0.07, C['dark']))
    # gutters and downpipes
    for yy in (y0 - oh - 0.12, y1 + oh + 0.12):
        o.append(box('gutter', x0 - 0.5, x1 + 0.5, yy - 0.08, yy + 0.08, EAVES - dz - 0.3, EAVES - dz - 0.14, C['gutter']))
    for cx, cy in ((x0 - 0.3, y0 - oh - 0.12), (x0 - 0.3, y1 + oh + 0.12)):
        o.append(cyl('downpipe', (cx, cy, FLOOR - 0.3), (cx, cy, EAVES - dz - 0.2), 0.05, C['gutter'], 8))
    # the front: three shop windows and the glass doors on the ground floor, the sign, six windows above
    a, b, n = (x1, y0), (x0, y0), (0, -1, 0)
    for k, xm in enumerate((-13.9, -10.1, -3.9, -0.1)):
        s = x1 - xm; f, gg = window('show%d' % k, a, b, s, QTOP + 0.6, 3.3, 2.4, n); o.append(f); g.append(gg)
        o.append(box('show_mull%d' % k, xm - 0.04, xm + 0.04, y0 - 0.1, y0 - 0.04, QTOP + 0.6, QTOP + 3.0, C['trim']))
    f, gg = window('doors', a, b, x1 - DOOR, FLOOR, 2.2, 2.35, n); o.append(f); g.append(gg)
    o.append(box('door_split', DOOR - 0.04, DOOR + 0.04, y0 - 0.1, y0 - 0.04, FLOOR, FLOOR + 2.35, C['trim']))
    for s_ in (-1, 1): o.append(box('door_bar', DOOR + s_ * 0.3 - 0.02, DOOR + s_ * 0.3 + 0.02, y0 - 0.16, y0 - 0.12, FLOOR + 0.9, FLOOR + 1.5, C['galv']))
    o.append(box('step', DOOR - 1.8, DOOR + 1.8, y0 - 1.3, y0, QTOP, FLOOR, C['conc']))
    # the canopy over the doors on two struts under it (tie rods above would cross the sign)
    o.append(box('canopy', DOOR - 1.9, DOOR + 1.9, y0 - 1.5, y0, QTOP + 3.0, QTOP + 3.14, C['trim']))
    for s_ in (-1, 1): o.append(cyl('strut', (DOOR + s_ * 1.6, y0 - 1.35, QTOP + 3.0), (DOOR + s_ * 1.6, y0, QTOP + 2.45), 0.03, C['galv'], 6))
    o.append(box('board', -12.4, 0.4, y0 - 0.12, y0, QTOP + 3.2, QTOP + 4.15, C['sign']))
    o.append(box('board_rim_t', -12.5, 0.5, y0 - 0.16, y0, QTOP + 4.15, QTOP + 4.22, C['letters']))
    o.append(box('board_rim_b', -12.5, 0.5, y0 - 0.16, y0, QTOP + 3.13, QTOP + 3.2, C['letters']))
    o.append(place(text_obj('sign_text', SIGN_SHOP, 0.76, C['letters']), (-6.0, y0 - 0.15, QTOP + 3.66), (math.pi / 2, 0, 0)))
    for k in range(6):
        xm = -14.4 + k * 3.0; f, gg = window('up%d' % k, a, b, x1 - xm, QTOP + 4.45, 1.2, 1.45, n); o.append(f); g.append(gg)
    # a downlight under the canopy (it glows in the renders)
    o.append(box('dlamp', DOOR - 0.3, DOOR + 0.3, y0 - 0.9, y0 - 0.6, QTOP + 2.94, QTOP + 3.0, C['lamp']))
    # the west gable: two windows down, one up, the sign FISKEUTSTYR high up for those coming along the quay
    a, b, n = (x0, y0), (x0, y1), (-1, 0, 0)
    for k, (s, z, w, h) in enumerate(((3.0, QTOP + 1.0, 1.4, 1.5), (9.0, QTOP + 1.0, 1.4, 1.5), (6.0, QTOP + 4.45, 1.2, 1.45))):
        f, gg = window('west%d' % k, a, b, s, z, w, h, n); o.append(f); g.append(gg)
    o.append(box('gable_board', x0 - 0.12, x0, ym - 3.0, ym + 3.0, EAVES + 0.35, EAVES + 1.15, C['sign']))
    o.append(place(text_obj('gable_text', SIGN_GABLE, 0.5, C['letters']), (x0 - 0.15, ym, EAVES + 0.75), (math.pi / 2, 0, -math.pi / 2)))
    # the back: windows on both floors and a back door
    a, b, n = (x0, y1), (x1, y1), (0, 1, 0)
    for k, s in enumerate((3.0, 7.0, 11.0, 15.0)):
        f, gg = window('back_up%d' % k, a, b, s, QTOP + 4.45, 1.2, 1.45, n); o.append(f); g.append(gg)
    for k, s in enumerate((5.0, 13.0)):
        f, gg = window('back_dn%d' % k, a, b, s, QTOP + 1.2, 1.4, 1.4, n); o.append(f); g.append(gg)
    o.append(box('back_door', x0 + 8.4, x0 + 9.4, y1, y1 + 0.08, FLOOR, FLOOR + 2.1, C['trim']))
    return o, g

def hall(fine=True):
    x0, x1, y0, y1 = HALL; xm = (x0 + x1) / 2; hw = (x1 - x0) / 2
    top = lambda p: HEAVES + (HRIDGE - HEAVES) * max(0.0, 1 - abs(p.x - xm) / hw)
    o, g = [], []
    o.append(box('hall_plinth', x0 - 0.05, x1 + 0.1, y0 - 0.1, y1 + 0.1, -3.0, QTOP + 0.25, C['conc']))
    oh, t = 0.4, 0.2; dz = oh * (HRIDGE - HEAVES) / hw
    roof = [(x0 - oh, HEAVES - dz), (xm, HRIDGE), (x1 + oh, HEAVES - dz), (x1 + oh, HEAVES - dz + t), (xm, HRIDGE + t), (x0 - oh, HEAVES - dz + t)]
    o.append(prism_y('hall_roof', roof, y0 - 0.45, y1 + 0.45, C['roof']))
    rx, rw, rh = ROLL
    if not fine:
        o.append(box('hall_walls', x0, x1, y0, y1, QTOP + 0.25, HEAVES, C['steel']))
        o.append(prism_y('hall_gables', [(x0, HEAVES), (x1, HEAVES), (xm, HRIDGE)], y0, y1, C['steel']))
        o.append(box('hall_door', rx - rw / 2, rx + rw / 2, y0 - 0.08, y0, QTOP, QTOP + rh, C['roll']))
        return o, g
    P, Q = 0.26, 0.035
    o.append(ribs('hall_front', (x1, y0), (x0, y0), QTOP + 0.25, top, C['steel'], P, Q, (0, -1)))
    o.append(ribs('hall_back', (x0, y1), (x1, y1), QTOP + 0.25, top, C['steel'], P, Q, (0, 1)))
    o.append(ribs('hall_east', (x1, y0), (x1, y1), QTOP + 0.25, lambda p: HEAVES, C['steel'], P, Q, (1, 0)))
    for cx, cy in ((x0, y0), (x1, y0), (x1, y1), (x0, y1)):
        o.append(box('hcorner', cx - 0.09, cx + 0.09, cy - 0.09, cy + 0.09, QTOP + 0.25, HEAVES, C['navy']))
    for xx in (x0 - oh, x1 + oh):
        o.append(box('hfascia', xx - 0.04, xx + 0.04, y0 - 0.45, y1 + 0.45, HEAVES - dz - 0.18, HEAVES - dz + t, C['navy']))
    for yy in (y0 - 0.45, y1 + 0.45):
        for xa, xb in ((x0 - oh, xm), (x1 + oh, xm)):
            o.append(slab('hbarge', (xa, yy - 0.02, HEAVES - dz - 0.15), (xb, yy - 0.02, HRIDGE - 0.15), (xb, yy - 0.02, HRIDGE + t + 0.02), (xa, yy - 0.02, HEAVES - dz + t + 0.02), 0.05, C['navy']))
    # the roller door: slats with grooves, the guides either side, two yellow posts against the corners
    o.append(box('roll', rx - rw / 2, rx + rw / 2, y0 - 0.09, y0 - 0.02, QTOP, QTOP + rh, C['roll']))
    for k in range(1, int(rh / 0.5)):
        o.append(box('groove%d' % k, rx - rw / 2, rx + rw / 2, y0 - 0.1, y0 - 0.085, QTOP + k * 0.5 - 0.02, QTOP + k * 0.5 + 0.02, C['groove']))
    for s_ in (-1, 1):
        o.append(box('guide', rx + s_ * (rw / 2 + 0.08) - 0.08, rx + s_ * (rw / 2 + 0.08) + 0.08, y0 - 0.16, y0, QTOP, QTOP + rh + 0.15, C['navy']))
        o.append(cyl('yellow_post', (rx + s_ * (rw / 2 + 0.45), y0 - 0.45, QTOP), (rx + s_ * (rw / 2 + 0.45), y0 - 0.45, QTOP + 1.1), 0.09, C['yellow'], 10))
    o.append(box('roll_box', rx - rw / 2 - 0.15, rx + rw / 2 + 0.15, y0 - 0.32, y0, QTOP + rh + 0.05, QTOP + rh + 0.6, C['navy']))
    o.append(box('pdoor', 5.4, 6.4, y0 - 0.07, y0, QTOP + 0.25, QTOP + 2.35, C['navy']))
    o.append(box('hall_board', rx - 2.9, rx + 2.9, y0 - 0.1, y0, QTOP + rh + 0.75, QTOP + rh + 1.35, C['navy']))
    o.append(place(text_obj('hall_text', SIGN_HALL, 0.36, C['white']), (rx, y0 - 0.12, QTOP + rh + 1.05), (math.pi / 2, 0, 0)))
    o.append(box('hlamp', rx - 0.2, rx + 0.2, y0 - 0.3, y0, QTOP + rh + 1.45, QTOP + rh + 1.62, C['lamp']))
    # a band of windows high on the east wall, three on the back
    a, b, n = (x1, y0), (x1, y1), (1, 0, 0)
    for k in range(4):
        f, gg = window('heast%d' % k, a, b, 2.2 + 3.2 * k, QTOP + 3.6, 1.8, 0.9, n, frame=C['navy']); o.append(f); g.append(gg)
    return o, g


# ---------- what stands on the deck ----------
def hull_rings(L, B, H, x0, y0, z0, keel=0.35):
    """an open boat's hull as rings from the transom to the stem (solid), lying along x"""
    rings = []
    for t, bf, kf in ((0.0, 0.9, 0.55), (0.12, 1.0, 0.75), (0.45, 1.0, 1.0), (0.72, 0.86, 1.05), (0.88, 0.55, 1.1), (0.97, 0.18, 1.15), (1.0, 0.03, 1.2)):
        x = x0 + L * t; b = B / 2 * bf; zk = z0 - keel * (1 - kf * 0.25) + (H * 0.18 if t > 0.9 else 0.0); zt = z0 + H + (0.12 if t > 0.8 else 0.0)
        rings.append([(x, y0, zk), (x, y0 + b * 0.75, zk + H * 0.28), (x, y0 + b, zk + H * 0.55), (x, y0 + b, zt), (x, y0 - b, zt), (x, y0 - b, zk + H * 0.55), (x, y0 - b * 0.75, zk + H * 0.28)])
    return rings

def outboard(name, x, y, z, m, scale=1.0, facing=1):
    s = scale; o = []
    o.append(box(name + '_cowl', x - 0.32 * s * facing - 0.0, x + 0.18 * s * facing, y - 0.2 * s, y + 0.2 * s, z, z + 0.48 * s, m, bevel=0.06 * s))
    o.append(box(name + '_mid', x - 0.12 * s, x + 0.08 * s, y - 0.1 * s, y + 0.1 * s, z - 0.55 * s, z, C['ob_blk']))
    o.append(box(name + '_leg', x - 0.07 * s, x + 0.07 * s, y - 0.06 * s, y + 0.06 * s, z - 0.95 * s, z - 0.55 * s, C['ob_blk']))
    o.append(box(name + '_plate', x - 0.22 * s, x + 0.2 * s, y - 0.01, y + 0.01, z - 0.62 * s, z - 0.58 * s, C['ob_blk']))
    o.append(box(name + '_skeg', x - 0.02, x + 0.12 * s, y - 0.015, y + 0.015, z - 1.08 * s, z - 0.92 * s, C['ob_blk']))
    hub = (x - 0.12 * s * facing, y, z - 0.86 * s); o.append(cyl(name + '_hub', (hub[0] - 0.06 * facing, y, hub[2]), (hub[0] + 0.06 * facing, y, hub[2]), 0.05 * s, C['ob_gry'], 8))
    for k in range(3):
        a = 2 * math.pi * k / 3; o.append(box(name + '_blade%d' % k, hub[0] - 0.01, hub[0] + 0.01, y + math.cos(a) * 0.04 - 0.04, y + math.cos(a) * 0.16 + 0.04, hub[2] + math.sin(a) * 0.12 - 0.03, hub[2] + math.sin(a) * 0.12 + 0.03, C['ob_gry']))
    return o

def trailer_boat(fine=True):
    """an open 5.4 m boat with a console and its outboard on a galvanised trailer, bow towards the shop corner"""
    X0, Y, Z = -15.4, 6.0, QTOP + 0.78; L, B, H = 5.4, 2.0, 0.85; o = []
    if not fine: return [box('tb', X0, X0 + L, Y - B / 2, Y + B / 2, QTOP + 0.4, Z + H, C['hull'])]
    o.append(loft_rings('tb_hull', hull_rings(L, B, H, X0, Y, Z), C['hull']))
    o.append(loft_rings('tb_boot', hull_rings(L, B * 1.01, H * 0.4, X0 + 0.02, Y, Z - 0.03), C['anti']))
    o.append(box('tb_deck', X0 + 0.15, X0 + L * 0.82, Y - B * 0.42, Y + B * 0.42, Z + H - 0.02, Z + H + 0.02, C['deck']))
    o.append(tube('tb_rub', [(X0, Y - B / 2 - 0.02, Z + H), (X0 + L * 0.72, Y - B * 0.43 - 0.02, Z + H), (X0 + L * 0.97, Y - B * 0.09, Z + H + 0.12)], 0.04, C['dark'], 6))
    o.append(tube('tb_rub2', [(X0, Y + B / 2 + 0.02, Z + H), (X0 + L * 0.72, Y + B * 0.43 + 0.02, Z + H), (X0 + L * 0.97, Y + B * 0.09, Z + H + 0.12)], 0.04, C['dark'], 6))
    o.append(box('tb_console', X0 + 2.5, X0 + 3.2, Y - 0.45, Y + 0.45, Z + H, Z + H + 0.75, C['hull'], bevel=0.05))
    o.append(slab('tb_screen', (X0 + 3.25, Y - 0.45, Z + H + 0.75), (X0 + 3.25, Y + 0.45, Z + H + 0.75), (X0 + 3.05, Y + 0.42, Z + H + 1.1), (X0 + 3.05, Y - 0.42, Z + H + 1.1), 0.02, C['glass']))
    o.append(box('tb_seat', X0 + 1.4, X0 + 2.1, Y - 0.6, Y + 0.6, Z + H, Z + H + 0.42, C['seat'], bevel=0.04))
    o += outboard('tb_ob', X0 - 0.22, Y, Z + H + 0.2, C['ob_blk'], 1.0, 1)
    # the trailer: two rails, the axle with wheels and mudguards, the drawbar to a coupling and the winch post
    tz = QTOP + 0.42
    for s_ in (-1, 1):
        o.append(box('tr_rail', X0 + 0.3, X0 + L + 0.2, Y + s_ * 0.55 - 0.05, Y + s_ * 0.55 + 0.05, tz, tz + 0.12, C['galv']))
        o.append(box('tr_bunk', X0 + 0.6, X0 + 3.8, Y + s_ * 0.5 - 0.06, Y + s_ * 0.5 + 0.06, tz + 0.12, Z - 0.28, C['wood']))
        wx, wy = X0 + 2.4, Y + s_ * 0.98
        o.append(cyl('tr_tyre', (wx, wy - 0.1, QTOP + 0.3), (wx, wy + 0.1, QTOP + 0.3), 0.3, C['tyre'], 16))
        o.append(cyl('tr_hub', (wx, wy - 0.11, QTOP + 0.3), (wx, wy + 0.11, QTOP + 0.3), 0.15, C['galv'], 10))
        o.append(box('tr_guard', wx - 0.4, wx + 0.4, wy - 0.13, wy + 0.13, QTOP + 0.64, QTOP + 0.68, C['galv']))
    o.append(box('tr_axle', X0 + 2.35, X0 + 2.45, Y - 0.98, Y + 0.98, QTOP + 0.27, QTOP + 0.33, C['galv']))
    o.append(tube('tr_draw', [(X0 + L + 0.2, Y - 0.55, tz + 0.06), (X0 + L + 1.3, Y, tz + 0.06), (X0 + L + 0.2, Y + 0.55, tz + 0.06)], 0.05, C['galv'], 6))
    o.append(box('tr_coupling', X0 + L + 1.25, X0 + L + 1.55, Y - 0.07, Y + 0.07, tz, tz + 0.14, C['dark']))
    o.append(cyl('tr_jockey', (X0 + L + 1.0, Y + 0.15, QTOP + 0.05), (X0 + L + 1.0, Y + 0.15, tz + 0.3), 0.04, C['galv'], 8))
    o.append(cyl('tr_jwheel', (X0 + L + 1.0, Y + 0.1, QTOP + 0.09), (X0 + L + 1.0, Y + 0.2, QTOP + 0.09), 0.09, C['tyre'], 10))
    o.append(box('tr_winch', X0 + L + 0.15, X0 + L + 0.25, Y - 0.05, Y + 0.05, tz, Z + 0.55, C['galv']))
    return o

def alu_boat(fine=True):
    """a 4.6 m aluminium boat on two timber cradles, with a price board"""
    X0, Y, Z = -7.0, 5.4, QTOP + 0.62; L, B, H = 4.6, 1.75, 0.7
    if not fine: return [box('ab', X0, X0 + L, Y - B / 2, Y + B / 2, QTOP, Z + H, C['alu'])]
    o = [loft_rings('ab_hull', hull_rings(L, B, H, X0, Y, Z, keel=0.15), C['alu'])]
    o.append(box('ab_inner', X0 + 0.1, X0 + L * 0.85, Y - B * 0.43, Y + B * 0.43, Z + H - 0.03, Z + H + 0.01, C['ob_gry']))
    for xx in (X0 + 0.9, X0 + 2.2, X0 + 3.4): o.append(box('ab_thwart', xx - 0.15, xx + 0.15, Y - B * 0.44, Y + B * 0.44, Z + H - 0.2, Z + H - 0.12, C['alu']))
    for xx in (X0 + 1.0, X0 + 3.3):
        for k in range(3): o.append(box('cradle%d' % k, xx - 0.12, xx + 0.12, Y - 0.7 + k * 0.0, Y + 0.7, QTOP + k * 0.14, QTOP + (k + 1) * 0.14, C['wood']))
    o.append(box('price_post', X0 + L + 0.5, X0 + L + 0.56, Y - 1.2, Y - 1.14, QTOP, QTOP + 1.2, C['galv']))
    o.append(box('price_board', X0 + L + 0.22, X0 + L + 0.84, Y - 1.23, Y - 1.2, QTOP + 1.0, QTOP + 1.45, C['white']))
    o.append(place(text_obj('price_text', 'TILBUD', 0.12, C['red']), (X0 + L + 0.53, Y - 1.245, QTOP + 1.23), (math.pi / 2, 0, 0)))
    return o

def deck_props(fine=True, ice=True):
    o = []
    y0 = SHOP[2]
    if not fine:
        o.append(cyl('flagpole', (-17.6, 9.0, QTOP), (-17.6, 9.0, QTOP + 10.0), 0.07, C['white'], 6))
        if ice: o.append(box('freezer', 7.0, 8.6, 9.6, 10.4, QTOP, QTOP + 0.9, C['white']))
        return o
    # the flag on its pole at the yard's west corner
    fx, fy = -17.6, 9.0
    o.append(cyl('flagpole', (fx, fy, QTOP), (fx, fy, QTOP + 10.0), 0.07, C['white'], 10, r1=0.045))
    o.append(sphere('flagball', (fx, fy, QTOP + 10.08), 0.1, C['gold'], seg=10, rings=6))
    o.append(box('flagbase', fx - 0.3, fx + 0.3, fy - 0.3, fy + 0.3, QTOP, QTOP + 0.15, C['conc']))
    W, Hf = 2.2, 1.6; zt = QTOP + 9.8; u = W / 22; v = Hf / 16
    def band(nm, a0, a1, b0, b1, m): o.append(plate(nm, (fx + 0.06, fy, zt), (1, 0, 0), (0, 0, 1), [(a0 * u, -b1 * v), (a1 * u, -b1 * v), (a1 * u, -b0 * v), (a0 * u, -b0 * v)], m, nrm=(0, -1, 0), thick=0.01))
    for (a0, a1, b0, b1) in ((0, 6, 0, 6), (10, 22, 0, 6), (0, 6, 10, 16), (10, 22, 10, 16)): band('fl_red', a0, a1, b0, b1, C['red'])
    for (a0, a1, b0, b1) in ((6, 7, 0, 16), (9, 10, 0, 16), (0, 6, 6, 7), (10, 22, 6, 7), (0, 6, 9, 10), (10, 22, 9, 10)): band('fl_white', a0, a1, b0, b1, C['white'])
    for (a0, a1, b0, b1) in ((7, 9, 0, 16), (0, 7, 7, 9), (9, 22, 7, 9)): band('fl_blue', a0, a1, b0, b1, C['blue'])
    # the outboard rack by the shop's east corner
    rx, ry = -1.2, 10.3
    for s_ in (-1, 1): o.append(box('rack_leg', rx + s_ * 1.3 - 0.04, rx + s_ * 1.3 + 0.04, ry - 0.04, ry + 0.04, QTOP, QTOP + 1.25, C['galv']))
    o.append(box('rack_bar', rx - 1.35, rx + 1.35, ry - 0.05, ry + 0.05, QTOP + 1.15, QTOP + 1.27, C['galv']))
    for s_ in (-1, 1): o.append(box('rack_foot', rx + s_ * 1.3 - 0.05, rx + s_ * 1.3 + 0.05, ry - 0.4, ry + 0.4, QTOP, QTOP + 0.05, C['galv']))
    for k, m in enumerate((C['ob_blk'], C['ob_wht'], C['ob_gry'])):
        o += outboard('rack_ob%d' % k, rx - 0.85 + 0.85 * k, ry - 0.25, QTOP + 1.27, m, 0.85, 1)
    # the float rack west of the doors: orange balls and yellow cylinder floats on a timber frame
    fx0 = -13.6
    for s_ in (0, 1): o.append(box('frack_post', fx0 + s_ * 2.4 - 0.05, fx0 + s_ * 2.4 + 0.05, y0 - 0.5, y0 - 0.4, QTOP, QTOP + 1.8, C['wood']))
    for zz in (QTOP + 0.6, QTOP + 1.3): o.append(box('frack_bar', fx0 - 0.05, fx0 + 2.45, y0 - 0.5, y0 - 0.42, zz, zz + 0.06, C['wood']))
    for k in range(4): o.append(sphere('float%d' % k, (fx0 + 0.35 + 0.57 * k, y0 - 0.75, QTOP + 0.9), 0.24, C['orange'], seg=12, rings=8))
    for k in range(5): o.append(cyl('cfloat%d' % k, (fx0 + 0.3 + 0.45 * k, y0 - 0.7, QTOP + 1.42), (fx0 + 0.3 + 0.45 * k, y0 - 0.7, QTOP + 1.72), 0.12, C['yellow'], 10))
    # a bench by the doors and an A-board saying the shop is open
    bx = DOOR + 2.6
    for s_ in (-1, 1): o.append(box('bench_leg', bx + s_ * 0.7 - 0.03, bx + s_ * 0.7 + 0.03, y0 - 0.75, y0 - 0.35, QTOP, QTOP + 0.44, C['post']))
    for k in range(3): o.append(box('bench_slat', bx - 0.85, bx + 0.85, y0 - 0.78 + 0.15 * k, y0 - 0.66 + 0.15 * k, QTOP + 0.44, QTOP + 0.48, C['wood']))
    o.append(slab('bench_back', (bx - 0.85, y0 - 0.32, QTOP + 0.5), (bx + 0.85, y0 - 0.32, QTOP + 0.5), (bx + 0.85, y0 - 0.25, QTOP + 0.9), (bx - 0.85, y0 - 0.25, QTOP + 0.9), 0.03, C['wood']))
    ax = DOOR - 2.7
    for s_ in (-1, 1): o.append(slab('aboard', (ax - 0.3, y0 - 1.6 + s_ * 0.25, QTOP), (ax + 0.3, y0 - 1.6 + s_ * 0.25, QTOP), (ax + 0.3, y0 - 1.6, QTOP + 0.9), (ax - 0.3, y0 - 1.6, QTOP + 0.9), 0.025, C['white']))
    o.append(place(text_obj('open_text', 'ÅPENT', 0.14, C['letters']), (ax, y0 - 1.76, QTOP + 0.5), (math.pi / 2 - 0.27, 0, 0)))
    if ice:
        # the ice: a chest freezer saying IS and a pallet of bagged ice beside it
        ix, iy = 7.2, 9.9
        o.append(box('freezer', ix, ix + 1.6, iy - 0.4, iy + 0.4, QTOP, QTOP + 0.88, C['white'], bevel=0.03))
        o.append(box('freezer_lid', ix - 0.02, ix + 1.62, iy - 0.42, iy + 0.42, QTOP + 0.88, QTOP + 0.95, C['blue'], bevel=0.02))
        o.append(place(text_obj('ice_text', 'IS', 0.36, C['blue']), (ix + 0.8, iy - 0.415, QTOP + 0.48), (math.pi / 2, 0, 0)))
        px = ix + 2.1
        o.append(box('pallet', px, px + 1.2, iy - 0.4, iy + 0.4, QTOP, QTOP + 0.14, C['wood']))
        for lay in range(3):
            for i in range(3):
                for j in range(2):
                    o.append(box('icebag', px + 0.05 + 0.38 * i, px + 0.39 + 0.38 * i, iy - 0.36 + 0.37 * j, iy - 0.02 + 0.37 * j, QTOP + 0.14 + 0.16 * lay, QTOP + 0.29 + 0.16 * lay, C['ice'], bevel=0.04))
    # fish crates stacked by the hall
    for k, (cx, cy, nh, m) in enumerate(((14.4, 9.4, 6, C['crate']), (15.2, 9.4, 5, C['crate']), (14.8, 8.6, 4, C['crate2']), (16.2, 9.5, 3, C['crate2']))):
        for h in range(nh): o.append(box('crate%d_%d' % (k, h), cx - 0.4, cx + 0.4, cy - 0.3, cy + 0.3, QTOP + 0.25 * h, QTOP + 0.25 * h + 0.24, m, bevel=0.015))
    # lamp posts along the yard
    for k, (lx, ly) in enumerate(LAMPS):
        o.append(cyl('lpost%d' % k, (lx, ly, QTOP), (lx, ly, QTOP + 5.2), 0.07, C['post'], 8))
        o.append(box('lhead%d' % k, lx - 0.35, lx + 0.15, ly - 0.12, ly + 0.12, QTOP + 5.05, QTOP + 5.25, C['post']))
        o.append(box('llamp%d' % k, lx - 0.33, lx + 0.13, ly - 0.1, ly + 0.1, QTOP + 5.0, QTOP + 5.05, C['lamp']))
    return o

LAMPS = [(-15.0, 9.8), (-4.5, 9.9), (9.8, 10.6), (17.6, 20.0)]


def build(fine=True):
    solids = yard(fine)
    o, g = shop(fine); solids += o
    o, g2 = hall(fine); solids += o; g += g2
    solids += trailer_boat(fine)
    solids += alu_boat(fine)
    solids += deck_props(fine)
    if not g: g = [box('noglass', 0, 0.01, 0, 0.01, -50, -49.99, C['glass'])]
    return solids, g


# ---------- export ----------
def to_game(p): return (p[0], p[2], -p[1])
def to_game_n(n): return (n[0], n[2], -n[1])

def anchors():
    """the places the game needs, in the shop's frame (x along the face, y up from mean sea level, z out to sea; metres)"""
    G = lambda x, y, z=QTOP: [round(v, 3) for v in to_game((x, y, z))]
    sx0, sx1, sy0, sy1 = SHOP; hx0, hx1, hy0, hy1 = HALL; ax0, ax1, ay0, ay1 = APRON
    return {'apron': [ax0, ax1, ay0, ay1],
            # [cx, cz, sx, sz, y0, y1] for the camera to stay out of; the buildings' footprints also clear the map's houses
            'solids': [[(sx0 + sx1) / 2, -(sy0 + sy1) / 2, sx1 - sx0 + 1.1, sy1 - sy0 + 1.1, -3.0, RIDGE + 0.3],
                       [(hx0 + hx1) / 2, -(hy0 + hy1) / 2, hx1 - hx0 + 0.8, hy1 - hy0 + 0.9, -3.0, HRIDGE + 0.3]],
            'clear': [[ax0, -ay0, ax1, -ay1]],
            'lamps': [G(x, y, QTOP + 4.95) for x, y in LAMPS] + [G(DOOR, SHOP[2] - 0.75, QTOP + 2.9), G(ROLL[0], HALL[2] - 0.35, QTOP + ROLL[2] + 1.45)],
            'door': G(DOOR, SHOP[2] - 1.5), 'roller': G(ROLL[0], HALL[2] - 0.5)}

SHOTS = [('sea', (-2.0, -46.0, 7.5), (-1.0, 12.0, 6.0), 32), ('sea3q', (30.0, -34.0, 14.0), (-1.0, 12.0, 4.0), 30),
         ('quay', (-22.0, 2.0, QTOP + 1.7), (-2.0, 12.0, QTOP + 3.2), 28), ('entrance', (-3.0, 1.5, QTOP + 1.6), (-8.0, 11.5, QTOP + 2.4), 26),
         ('above', (25.0, -18.0, 40.0), (0.0, 14.0, 0.0), 30), ('boats', (-2.0, 1.8, QTOP + 2.2), (-11.0, 6.0, QTOP + 0.8), 30)]

def main():
    os.makedirs(OUT, exist_ok=True)
    reset(); colours()
    solids, glass = build(True)
    join(solids, 'BOAT0'); join(glass, 'GLASS0')
    if 'fast' not in sys.argv and 'dry' not in sys.argv:
        # for the renders only: the game's quay deck and bunker tank, water, a shore behind
        extra = [box('r_deck', -42.0, 42.0, 0.0, 9.6, -3.0, QTOP, mat('r_deck', (0.52, 0.53, 0.50), 0.1)),
                 box('r_kerb', -42.0, 42.0, 0.0, 0.5, QTOP, QTOP + 0.15, mat('r_kerb', (0.85, 0.75, 0.15), 0.3)),
                 cyl('r_tank', (2.4 - 2.3, 6.2, QTOP + 1.45), (2.4 + 2.3, 6.2, QTOP + 1.45), 1.05, mat('r_tank', (0.9, 0.91, 0.9), 0.35), 18)]
        bm = bmesh.new(); s_ = 160
        bm.faces.new([bm.verts.new(p) for p in ((-s_, -s_, 0), (s_, -s_, 0), (s_, s_, 0), (-s_, s_, 0))])
        extra.append(obj_from_bm('water', bm, [mat('water', (0.03, 0.09, 0.12), 0.9)]))
        ys = [APRON[3] - 0.5, 40, 80, 160]; zs = [QTOP - 0.05, 5.0, 14.0, 30.0]
        extra.append(grid('shore', [[(x, y, z) for y, z in zip(ys, zs)] for x in (-160, 160)], lambda i, j: mat('land', (0.27, 0.31, 0.22), 0.05), out=lambda c: (0, 0, 1)))
        beauty(OUT, 'shop', 0.0, SHOTS)
        for o in extra: bpy.data.objects.remove(o, do_unlink=True)
    ex = {'frame': 'kystfiske harbour shop: x along the quay face, y up from mean sea level, z out to sea; metres', 'name': 'Båt & fiskeutstyr på kaia i Finnsnes',
          'anchors': anchors()}
    export_boat(build, to_game, to_game_n, OUT, 'harbour-shop.glb', os.path.join(ROOT, 'src', 'data', 'harbour-shop.b64'), ex, side=None, dry='dry' in sys.argv)


if __name__ == '__main__':
    main()
