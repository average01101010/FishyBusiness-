"""The tackle shop and the yard as harbour units (Jonas 07.10.2026: the shop, the plant and the yard are places of their own, each with its
own quay; the yard has a diesel pump and a lift that can take boats out of the water, with animations; Jonas 08.10.2026: «Du må lage
verftet slik at den kan ta opp de aller største båtene også»). Both stand on a harbour unit's quay (the game places them as it places the
plants); the buildings and what stands about are made here, from the shop and the boat hall of the Finnsnes model (butikk.py).

  s  the tackle shop (harbour-unit-s), on the plants' quay (kaimottak.py: a block of 54.8 x 24.4 m): the two-storey shop of Finnsnes
     with FISKEUTSTYR on it, the float rack, the outboard rack, the bench and the A-board, crates and the flag; no ice (ice is sold at the
     plant) and no fuel
  y  the yard (harbour-unit-y), on a big quay of its own (UNIT_Y in 01-world.js: a face of 120 m, a deck 34 m deep, 13 m of dredged
     water): a boat hall 40 m wide with the roller door to the quay and VERFT · BÅTSALG on it, a boat on its trailer, a boat on blocks,
     drums and timber, the bunker station (tank and pump as in the plant, so the fuelling is the same), and the ship lift: a row of winch
     houses on the kerb with a sheave over the face each, and in the water in front of the main berth a steel platform with keel blocks
     that the winches raise to the deck, a boat on it, so the work can be done on the hull. The platform comes in four sizes (14 x 6, 26 x 9.5,
     56 x 14 and 90 x 21 m: the game takes the smallest that holds the boat, with three metres to spare in length, and scales it a little
     to fit), up to the pelagic seiner (75 m, 15.5 m abeam, 7.5 m draught). The platform and its cables are parts of their own.

    pip install bpy==4.5.4
    python3 tools/harbour/steder.py s|y          -> src/data/harbour-unit-s.b64 or -y.b64, renders in tools/harbour/out/
    python3 tools/harbour/steder.py s|y fast     -> without the renders to look at
    python3 tools/harbour/steder.py s|y dry      -> the GLB only in tools/harbour/out

Frame here as in kaimottak.py: x along the quay face (the face is y = 0, the middle x = 0), y inland, z up from mean sea level; in the
game x along the face, y up, z out to sea. The yard's main berth has its middle at x = -20 and the bunker berth at x = 30 (UNIT_Y.berth)."""
import os, sys, math
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))
sys.path.insert(0, os.path.join(ROOT, 'tools', 'boats')); sys.path.insert(0, HERE)
import bpy, bmesh
from bpyutil import *
import bpyutil
import kaimottak as K
import butikk as B

OUT = os.path.join(HERE, 'out')
KIND = 'y' if 'y' in sys.argv[1:] else 's'
QTOP = K.QTOP
B.SIGN_SHOP, B.SIGN_GABLE, B.SIGN_HALL = 'FISKEUTSTYR', 'FISKEUTSTYR', 'VERFT · BÅTSALG'   # the signs of these two places
# the shop's quay is the plants' (kaimottak.py); the yard's is the big one (UNIT_Y in 01-world.js)
YE, YB, YBOT = 60.0, 34.0, -14.0          # half the face, the deck's depth, the walls' foot
BX, BY = -5.0, -2.0                       # the shop: the Finnsnes model's frame has the berth's middle at x = 0 and the deck 2 m deeper
MAIN_X, BUNK_X = -20.0, 30.0              # the yard's berths' middles
WINCH = [-58.0 + 6.0 * k for k in range(14)]       # the winch houses on the kerb: clear of the lamp posts (every 24 m from 0) and the ladders (-37, -7)
# the lift's platforms, smallest first: [name, length, width from the inner edge's line]; the game takes the smallest with the boat's length + 3 m and
# her beam + 1.2 m, and scales it a little to fit
CLASSES = [['yard_lift_a', 14.0, 6.4], ['yard_lift_b', 26.0, 9.6], ['yard_lift_c', 56.0, 14.0], ['yard_lift_d', 90.0, 21.0]]
EDGE = 0.22                    # the platform's inner edge, out from the face (the fenders stand 0.28 out: the last cm of the edge is not seen)
BLOCK = 0.55                   # the keel blocks' height over the platform's deck
CABLE_Y, CABLE_Z = 0.33, QTOP + 0.40   # where the cables hang from: out from the face, and the sheave's top
LDECK = QTOP - 0.03            # the platform's deck at its top: nearly flush with the quay deck
C = {}


def shift(objs, dx, dy, dz=0.0):
    for o in objs:
        if o is not None: o.location = (o.location.x + dx, o.location.y + dy, o.location.z + dz)
    return objs


def colours():
    B.colours()
    bpyutil.MATS.clear()        # the two models have colours of the same names: each keeps its own
    K.colours()
    C['plat'] = mat('lift_deck', (0.20, 0.22, 0.24), 0.2)
    C['girder'] = mat('lift_girder', (0.30, 0.33, 0.36), 0.35, metal=0.5)
    C['blockw'] = mat('keel_block', (0.55, 0.40, 0.24), 0.08)
    C['house'] = mat('winch_house', (0.46, 0.55, 0.50), 0.3)
    C['cable'] = mat('lift_cable', (0.09, 0.09, 0.10), 0.35, metal=0.4)


# ---------- the big quay of the yard (kaimottak.py's quay, for any length) ----------
def quay_big(fine=True):
    E, D = YE, YB; K_ = K.KERB; objs = []
    objs.append(box('deck', -E, E, K_, D, QTOP - 0.5, QTOP, K.C['asph']))
    objs.append(box('kerb', -E - 0.4, E + 0.4, 0.0, K_, QTOP - 0.9, QTOP + 0.12, K.C['conc'], 0.03 if fine else 0))
    if fine:
        objs.append(box('edge_line', -E + 0.4, E - 0.4, 0.15, 0.45, QTOP + 0.12, QTOP + 0.125, K.C['yellow']))
        objs.append(box('walk_line', -E + 0.4, E - 0.4, K_ + 2.0, K_ + 2.12, QTOP, QTOP + 0.005, K.C['yellow']))
    EW, BW = E + 0.4, D + 0.4
    for wn, org, u, L, nrm in (('face', (-EW, -0.002, 0), (1, 0, 0), 2 * EW, (0, -1, 0)), ('west', (-EW - 0.002, BW, 0), (0, -1, 0), BW, (-1, 0, 0)),
                               ('east', (EW + 0.002, 0, 0), (0, 1, 0), BW, (1, 0, 0)), ('back', (EW, BW + 0.002, 0), (-1, 0, 0), 2 * EW, (0, 1, 0))):
        for nm, z0, z1, m in (('low', YBOT, -1.7, K.C['conc_d']), ('tide', -1.7, 0.9, K.C['tidal']), ('high', 0.9, QTOP - 0.9, K.C['conc'])):
            objs.append(plate('%s_%s' % (wn, nm), org, u, (0, 0, 1), [(0, z0), (L, z0), (L, z1), (0, z1)], m, nrm=nrm))
    if fine:
        # rubber fenders every 4 m (the ladders' places left), steel ladders, bollards every 7 m on the kerb
        lad = (-37.0, -7.0)
        for k in range(int(2 * E / 4)):
            x = -E + 2 + 4 * k
            if any(abs(x - l) < 1 for l in lad): continue
            objs.append(box('fender%d' % k, x - 0.16, x + 0.16, -0.28, 0.0, -1.6, QTOP - 0.05, K.C['rubber']))
        for x in lad:
            for s_ in (-0.22, 0.22): objs.append(cyl('lad%d%d' % (int(x), int(s_ * 100)), (x + s_, -0.12, -2.2), (x + s_, -0.12, QTOP + 0.95), 0.025, K.C['steel'], 8))
            for z in [-2.0 + 0.3 * k for k in range(15)]: objs.append(cyl('rung%d%d' % (int(x), int(z * 10)), (x - 0.22, -0.12, z), (x + 0.22, -0.12, z), 0.018, K.C['steel'], 4))
            for s_ in (-0.22, 0.22): objs.append(tube('ladh%d%d' % (int(x), int(s_ * 100)), [(x + s_, -0.12, QTOP + 0.95), (x + s_, 0.3, QTOP + 1.05), (x + s_, 0.6, QTOP + 0.12)], 0.025, K.C['steel'], 8))
        for k in range(int(2 * E / 7)):
            x = -E + 3.5 + 7 * k
            objs.append(cyl('bol%d' % k, (x, 0.5, QTOP + 0.12), (x, 0.5, QTOP + 0.55), 0.16, K.C['dark'], 10))
            objs.append(cyl('bolc%d' % k, (x, 0.5, QTOP + 0.55), (x, 0.5, QTOP + 0.64), 0.22, K.C['dark'], 10))
        for sg in (-1, 1):
            objs.append(box('guard%d' % sg, sg * EW - 0.16, sg * EW + 0.16, -0.16, 0.16, YBOT, QTOP + 0.13, K.C['dark']))
            for y in (3.0, 7.0, 12.0): objs.append(box('efender%d%d' % (sg, int(y)), sg * EW + (0 if sg > 0 else -0.28), sg * EW + (0.28 if sg > 0 else 0), y - 0.16, y + 0.16, -1.6, QTOP - 0.05, K.C['rubber']))
    objs.append(box('edge_w', -EW, -E, K_, BW, QTOP - 0.9, QTOP + 0.05, K.C['conc']))
    objs.append(box('edge_e', E, EW, K_, BW, QTOP - 0.9, QTOP + 0.05, K.C['conc']))
    objs.append(box('edge_b', -E, E, D, BW, QTOP - 0.9, QTOP + 0.05, K.C['conc']))
    if fine:
        for k, (x, y) in enumerate([(-48.0 + 24.0 * i, 1.4) for i in range(5)] + [(-48.0 + 24.0 * i, D - 1.0) for i in range(5)]):
            objs.append(cyl('lp%d' % k, (x, y, QTOP), (x, y, QTOP + 9.0), 0.11, K.C['steel'], 10, r1=0.07))
            objs.append(box('lph%d' % k, x - 0.25, x + 0.25, y - 0.7, y + 0.1, QTOP + 8.9, QTOP + 9.1, K.C['dark']))
            objs.append(box('lpl%d' % k, x - 0.2, x + 0.2, y - 0.65, y + 0.05, QTOP + 8.86, QTOP + 8.9, K.C['lamp']))
        objs.append(cyl('lbpost', (-30.0, 1.2, QTOP), (-30.0, 1.2, QTOP + 1.6), 0.04, K.C['red'], 8))
        objs.append(torus('lifebuoy', (-30.0, 1.12, QTOP + 1.2), (0, 1, 0), 0.30, 0.07, K.C['red'], 22, 8))
    return objs


# ---------- the shop ----------
def shop_unit(fine):
    o, g = B.shop(fine); sol = list(o) + B.deck_props(fine, ice=False)
    shift(sol + g, BX, BY)
    return sol, g


# ---------- the yard ----------
def hull_on_blocks(fine, X0=-57.0, Y=15.0, L=12.0, Bm=3.8, H=1.8):
    """a boat of 12 m out of the water on keel blocks and jack stands, the bottom in red antifouling, the topsides white"""
    Z = QTOP + 1.2; o = []
    if not fine: return [box('hb', X0, X0 + L, Y - Bm / 2, Y + Bm / 2, QTOP + 0.4, Z + H, B.C['hull'])]
    o.append(loft_rings('hb_hull', B.hull_rings(L, Bm, H, X0, Y, Z, keel=0.7), B.C['hull']))
    o.append(loft_rings('hb_boot', B.hull_rings(L, Bm * 1.01, H * 0.42, X0 + 0.02, Y, Z - 0.05, keel=0.7), B.C['anti']))
    o.append(box('hb_deck', X0 + 0.2, X0 + L * 0.84, Y - Bm * 0.42, Y + Bm * 0.42, Z + H - 0.02, Z + H + 0.02, B.C['deck']))
    o.append(box('hb_house', X0 + 4.6, X0 + 7.2, Y - 1.1, Y + 1.1, Z + H, Z + H + 1.5, B.C['hull'], bevel=0.06))
    o.append(box('hb_glass', X0 + 7.18, X0 + 7.22, Y - 0.95, Y + 0.95, Z + H + 0.65, Z + H + 1.2, K.C['glass']))
    for k in range(6): o.append(box('hb_blk%d' % k, X0 + 1.0 + 2.1 * k - 0.4, X0 + 1.0 + 2.1 * k + 0.4, Y - 0.25, Y + 0.25, QTOP, Z - 0.45, C['blockw']))
    for k, xx in enumerate((X0 + 2.4, X0 + 7.6)):
        for s_ in (-1, 1):
            o.append(cyl('hb_stand%d%d' % (k, s_), (xx, Y + s_ * 2.3, QTOP + 0.05), (xx, Y + s_ * 1.3, Z + 0.65), 0.07, K.C['steel'], 8))
            o.append(box('hb_shoe%d%d' % (k, s_), xx - 0.35, xx + 0.35, Y + s_ * 2.3 - 0.3, Y + s_ * 2.3 + 0.3, QTOP, QTOP + 0.06, K.C['dark']))
    return o


def yard_props(fine):
    o = []
    if not fine: return o
    for k, (x, y) in enumerate([(-8.0, 8.0), (-7.3, 7.8), (-7.7, 7.1), (-6.4, 7.9), (-6.9, 8.7)]): o.append(cyl('drum%d' % k, (x, y, QTOP), (x, y, QTOP + 0.88), 0.29, B.C['blue'] if k % 2 else B.C['galv'], 14))
    for lay in range(5):   # a stack of timber west of the hall
        o.append(box('timber%d' % lay, -24.0, -17.0, 8.0, 8.35, QTOP + 0.15 * lay + 0.08, QTOP + 0.15 * lay + 0.22, B.C['wood']))
    for sx in (-23.5, -20.5, -17.5): o.append(box('timber_sp%s' % sx, sx - 0.05, sx + 0.05, 7.9, 8.45, QTOP, QTOP + 0.08, B.C['post']))
    # a flag as at Finnsnes, at the quay's west end
    fx, fy = -58.5, 8.0
    o.append(cyl('flagpole', (fx, fy, QTOP), (fx, fy, QTOP + 10.0), 0.07, K.C['white_p'], 10, r1=0.045))
    o.append(box('flagbase', fx - 0.3, fx + 0.3, fy - 0.3, fy + 0.3, QTOP, QTOP + 0.15, K.C['conc']))
    W, Hf = 2.2, 1.6; zt = QTOP + 9.8
    o.append(plate('flag_red', (fx + 0.06, fy, zt), (1, 0, 0), (0, 0, 1), [(0, -Hf), (W, -Hf), (W, 0), (0, 0)], B.C['red'], nrm=(0, -1, 0), thick=0.01))
    o.append(plate('flag_blue', (fx + 0.06, fy, zt), (1, 0, 0), (0, 0, 1), [(0.75, -Hf), (1.05, -Hf), (1.05, 0), (0.75, 0)], B.C['blue'], nrm=(0, -1, 0), thick=0.012))
    return o


def winches(fine):
    """the ship lift's winch houses along the kerb, a sheave over the face at each"""
    o = []
    for k, x in enumerate(WINCH):
        o.append(box('wh%d' % k, x - 1.2, x + 1.2, 0.95, 3.1, QTOP, QTOP + 2.3, C['house'], 0.03 if fine else 0))
        o.append(box('whr%d' % k, x - 1.3, x + 1.3, 0.85, 3.2, QTOP + 2.3, QTOP + 2.42, B.C['roof']))
        if not fine: continue
        o.append(box('whd%d' % k, x - 0.45, x + 0.45, 3.1, 3.14, QTOP, QTOP + 1.95, K.C['door']))
        o.append(box('whw%d' % k, x + 0.7, x + 1.0, 3.1, 3.14, QTOP + 1.1, QTOP + 1.7, K.C['glass']))
        # the cable's way: a bracket on the kerb with the sheave out over the face, the drum behind it under a cover
        o.append(box('whb%d' % k, x - 0.14, x + 0.14, -0.3, 0.95, QTOP + 0.12, QTOP + 0.3, K.C['dark']))
        o.append(cyl('whs%d' % k, (x - 0.12, 0.0, CABLE_Z - 0.33), (x + 0.12, 0.0, CABLE_Z - 0.33), 0.33, K.C['dark'], 18))
        o.append(cyl('whh%d' % k, (x - 0.14, 0.0, CABLE_Z - 0.33), (x + 0.14, 0.0, CABLE_Z - 0.33), 0.08, K.C['steel'], 8))
        o.append(box('whc%d' % k, x - 0.2, x + 0.2, 0.3, 0.95, QTOP + 0.3, CABLE_Z - 0.3, K.C['dark']))
    # the yellow line along the kerb where the platform lies, and a warning board at its east end
    o.append(box('lift_line', WINCH[0] - 1.4, WINCH[-1] + 1.4, 3.4, 3.52, QTOP, QTOP + 0.006, K.C['yellow']))
    o.append(box('lb_post', WINCH[-1] + 1.8, WINCH[-1] + 1.88, 3.5, 3.58, QTOP, QTOP + 2.3, K.C['steel']))
    o.append(box('lb_board', WINCH[-1] + 1.3, WINCH[-1] + 2.4, 3.46, 3.5, QTOP + 1.55, QTOP + 2.25, K.C['yellow']))
    if fine:
        t = B.text_obj('lb_text', 'LØFT', 0.2, K.C['dark']); B.place(t, (WINCH[-1] + 1.85, 3.455, QTOP + 1.9), (math.pi / 2, 0, 0)); o.append(t)
    return o


def lift_part(name, length, width):
    """one platform at its top (the deck nearly flush with the quay's), pivot at the berth's middle on the face's line: a steel deck with girders
    under, the keel blocks along the middle and the bilge blocks on both sides. The game scales it to the boat"""
    x0, x1 = MAIN_X - length / 2, MAIN_X + length / 2; ya, yb = -width, -EDGE; z = LDECK; o = []
    thick = 0.28 if length < 40 else 0.4; gird = 0.85 if length < 40 else 1.5
    o.append(box('pl_deck', x0, x1, ya, yb, z - thick, z, C['plat'], 0.02))
    nx = max(2, int(length / 2.0))
    for k in range(nx + 1): o.append(box('pl_gx%d' % k, x0 + length * k / nx - 0.1, x0 + length * k / nx + 0.1, ya, yb, z - gird, z - thick, C['girder']))
    ny = max(2, int((width - EDGE) / 1.9))
    for k in range(ny + 1):
        yy = ya + (width - EDGE) * k / ny; o.append(box('pl_gy%d' % k, x0, x1, yy - 0.12, yy + 0.12, z - gird - 0.05, z - thick, C['girder']))
    o.append(box('pl_edge', x0, x1, ya, ya + 0.14, z, z + 0.16, K.C['yellow']))
    for xx in (x0, x1 - 0.14): o.append(box('pl_end', xx, xx + 0.14, ya, yb, z, z + 0.16, K.C['yellow']))
    ym = (ya + yb) / 2; sp = 1.4 if length < 40 else 1.8
    for k in range(int((length - 1.0) / sp)):
        x = x0 + 0.7 + sp * k
        o.append(box('keel_blk', x - 0.26, x + 0.26, ym - 0.32, ym + 0.32, z, z + BLOCK, C['blockw'], 0.02))
    rows = [1.5] if width < 8 else [width * 0.18, width * 0.34] if width < 17 else [width * 0.16, width * 0.28, width * 0.38]
    for r in rows:
        for s_ in (-1, 1):
            for k in range(int((length - 2.0) / (2.8 if length < 40 else 3.6))):
                x = x0 + 1.4 + (2.8 if length < 40 else 3.6) * k
                o.append(box('bilge_blk', x - 0.3, x + 0.3, ym + s_ * r - 0.3, ym + s_ * r + 0.3, z, z + 0.85, C['blockw'], 0.02))
    # the eyes the cables take hold of, at the inner edge, every 6 m (the winch houses' spacing)
    for k in range(int(length / 6) + 1): o.append(box('pl_eye', x0 + 1.0 + 6.0 * k - 0.25, x0 + 1.0 + 6.0 * k + 0.25, yb - 0.04, yb + 0.1, z - 0.4, z + 0.12, K.C['dark']))
    return join(o, name.upper())


def cable_part():
    """one cable, 1 m long from its pivot (the sheave's tangent) down: the game stretches it from the sheave to the platform"""
    o = [cyl('cb', (0.0, -CABLE_Y, CABLE_Z), (0.0, -CABLE_Y, CABLE_Z - 1.0), 0.045, C['cable'], 8),
         box('cb_clamp', -0.1, 0.1, -CABLE_Y - 0.1, -CABLE_Y + 0.1, CABLE_Z - 0.14, CABLE_Z, K.C['dark'], 0.01)]
    return join(o, 'YARD_CABLE')


# ---------- the unit ----------
def hall_parts(fine):
    """the boat hall, 40 m wide and 20 m deep with the roller door to the quay (butikk.py's hall at another size and place)"""
    B.HALL = (4.0, 44.0, 11.5, 31.5); B.ROLL = (24.0, 8.0, 7.0); B.HEAVES = QTOP + 9.0; B.HRIDGE = QTOP + 11.8
    o, g = B.hall(fine); o = list(o); g = list(g); shift(o + g, -18.0, 0.5)
    return o, g


def build(fine=True):
    if KIND == 's':
        solids = K.quay(fine); o, g = shop_unit(fine); solids += o
    else:
        solids = quay_big(fine)
        o, g = hall_parts(fine); solids += o
        t = B.trailer_boat(fine); shift(t, -18.0, 0.0); solids += t
        solids += hull_on_blocks(fine) + yard_props(fine) + winches(fine) + K.bunker(fine)
    if not g: g = [box('noglass', 0, 0.01, 0, 0.01, -50, -49.99, K.C['glass'])]
    return solids, g


def anchors():
    G = lambda x, y, z=QTOP: [round(v, 3) for v in K.to_game((x, y, z))]
    if KIND == 's':
        A = K.anchors(); quay = A['solids'][0]
        x0, x1, y0, y1 = [B.SHOP[0] + BX, B.SHOP[1] + BX, B.SHOP[2] + BY, B.SHOP[3] + BY]
        A['solids'] = [quay, [(x0 + x1) / 2, -(y0 + y1) / 2, x1 - x0 + 1.1, y1 - y0 + 1.1, -3.0, B.RIDGE + 0.3]]
        A['lamps'] = [G(x, y, QTOP + 8.85) for x, y in ((-24.0, 1.4), (0.0, 1.4), (24.0, 1.4), (-6.0, 23.0), (12.0, 23.0))] + [G(B.DOOR + BX, B.SHOP[2] + BY - 0.75, QTOP + 2.9)]
        return A
    K.HL, K.DEPTH, K.WALL_BOT = YE - 0.4, YB - 0.4, YBOT
    A = K.anchors()
    hx0, hx1, hy0, hy1 = -14.0, 26.0, 12.0, 32.0
    A['face'] = {'hl': YE + 0.4, 'depth': YB + 0.4, 'kerb': K.KERB, 'deckY': QTOP, 'bottom': YBOT}
    A['deck'] = [G(-YE - 0.4, 0.0), G(YE + 0.4, 0.0), G(YE + 0.4, YB + 0.4), G(-YE - 0.4, YB + 0.4)]
    A['basin'] = {'x': 66.0, 'z': 44.0, 'depth': -13.0}
    A['berths'] = {'main': {'x': MAIN_X, 'len': 90.0}, 'bunker': {'x': BUNK_X, 'len': 40.0}}
    A['bollards'] = [G(-YE + 3.5 + 7 * k, 0.5, QTOP + 0.55) for k in range(int(2 * YE / 7))]
    A['solids'] = [[0.0, -(YB + 0.4) / 2, 2 * YE + 0.8, YB + 0.4, YBOT, QTOP], [(hx0 + hx1) / 2, -(hy0 + hy1) / 2, hx1 - hx0 + 0.8, hy1 - hy0 + 0.9, -3.0, B.HRIDGE + 0.3],
                   [K.TANK[0], -K.TANK[1], 11.0, 5.2, QTOP, QTOP + 3.5], [(WINCH[0] + WINCH[-1]) / 2, -2.0, WINCH[-1] - WINCH[0] + 2.8, 2.4, QTOP, QTOP + 2.5]]
    A['lamps'] = [G(-48.0 + 24.0 * i, 1.4 - 0.3, QTOP + 8.85) for i in range(5)] + [G(-48.0 + 24.0 * i, YB - 1.3, QTOP + 8.85) for i in range(5)] + [G(B.ROLL[0] - 18.0, B.HALL[2] + 0.5 - 0.35, QTOP + B.ROLL[2] + 1.45)]
    A['lift'] = {'x': MAIN_X, 'edge': EDGE, 'block': BLOCK, 'deck': round(LDECK, 3), 'cable': [round(CABLE_Y, 3), round(CABLE_Z, 3)], 'winch': [round(x, 3) for x in WINCH], 'depth': 13.0,
                 'classes': [{'part': n, 'len': l, 'wid': w} for n, l, w in CLASSES]}
    for k in ('crane', 'truck', 'silo', 'workers', 'rounds', 'stacks', 'drop', 'door'): A.pop(k, None)
    return A


def main():
    os.makedirs(OUT, exist_ok=True)
    reset(); colours()
    if KIND == 'y': K.HL, K.DEPTH, K.WALL_BOT = YE - 0.4, YB - 0.4, YBOT; K.TANK, K.PUMP = (BUNK_X + 3.0, 22.0), (BUNK_X + 1.0, 1.7)
    solids, glass = build(True)
    join(solids, 'BOAT0'); join(glass, 'GLASS0')
    more = []
    if KIND == 'y':
        lifts = [lift_part(n, l, w) for n, l, w in CLASSES]; cable = cable_part()
        more = [{'name': n, 'obj': o, 'xf_p': K.rel_game((MAIN_X, 0.0, LDECK)), 'ao': True, 'show': True} for (n, l, w), o in zip(CLASSES, lifts)]
        more.append({'name': 'yard_cable', 'obj': cable, 'xf_p': K.rel_game((0.0, -CABLE_Y, CABLE_Z)), 'ao': False, 'show': True})
    if 'fast' not in sys.argv and 'dry' not in sys.argv:
        bm = bmesh.new(); s_ = 400
        bm.faces.new([bm.verts.new(p) for p in ((-s_, -s_, 0), (s_, -s_, 0), (s_, s_, 0), (-s_, s_, 0))])
        obj_from_bm('water', bm, [mat('water', (0.03, 0.09, 0.12), 0.9)])
        DD = YB if KIND == 'y' else K.DEPTH
        ys = [DD - 9, DD + 0.35, 90, 300]; zs = [-4.0, QTOP - 0.03, 7.0, 25.0]
        shore = grid('shore', [[(x, y, z) for y, z in zip(ys, zs)] for x in (-400, 400)], lambda i, j: mat('land', (0.27, 0.31, 0.22), 0.05), out=lambda c: (0, 0, 1))
        extra = [shore]
        if KIND == 'y':
            # the pelagic seiner on the lift (a plain hull, only for the pictures): 75 m, 15.5 m abeam, 7.5 m draught, the biggest; the lift's biggest platform up,
            # then down in the water with the cables stretched; and a small boat on the smallest
            Lb, Bb, Db = 75.0, 15.5, 7.5; d = lifts[3]; hx0 = MAIN_X - Lb / 2; yc = -(Bb / 2 + 0.4)
            hull = loft_rings('r_boat', B.hull_rings(Lb, Bb, 11.0, hx0, yc, LDECK + BLOCK + Db * 0.45, keel=Db * 0.5), B.C['hull'])
            boot = loft_rings('r_boot', B.hull_rings(Lb, Bb * 1.01, 5.0, hx0 + 0.02, yc, LDECK + BLOCK + Db * 0.4, keel=Db * 0.5), B.C['anti'])
            for o in lifts[:3]: o.hide_render = True
            wires = []
            for x in WINCH:
                w = cable.copy(); w.data = cable.data.copy(); link(w); w.location = (x, 0, CABLE_Z * (1 - 1.0)); w.scale = (1, 1, 1); wires.append(w)
            def stretch(h):
                for w in wires: k = (CABLE_Z - LDECK) + h; w.scale = (1, 1, k); w.location.z = CABLE_Z * (1 - k)
            stretch(0.0)
            shots = [('sea3q', (80.0, -150.0, 60.0), (-10.0, 8.0, 6.0), 30), ('front', (MAIN_X, -170.0, 22.0), (MAIN_X, 10.0, 8.0), 34), ('above', (90.0, -70.0, 130.0), (0.0, 18.0, 0.0), 30),
                     ('bunker', (60.0, -20.0, QTOP + 6.0), (48.0, 8.0, QTOP + 1.0), 30), ('hall', (20.0, -22.0, QTOP + 7.0), (20.0, 20.0, QTOP + 4.0), 32)]
            beauty(OUT, 'yard_up', 0.0, shots)
            for o in (hull, boot): o.location.z -= Db + 2.4
            d.location.z -= Db + 2.4; stretch(Db + 2.4)
            beauty(OUT, 'yard_down', 0.0, [('sea3q', (80.0, -150.0, 60.0), (-10.0, 8.0, 6.0), 30), ('front', (MAIN_X, -90.0, 6.0), (MAIN_X, 0.0, -2.0), 34)])
            for o in (hull, boot) + tuple(wires): bpy.data.objects.remove(o, do_unlink=True)
            d.location.z = 0.0
            for o in lifts[:3]: o.hide_render = False
        else:
            shots = [s for s in K.SHOTS if s[0] in ('sea3q', 'front', 'above', 'quay', 'land')]
            beauty(OUT, 'shop', 0.0, shots)
        for o in extra: bpy.data.objects.remove(o, do_unlink=True)
    name = 'Utstyrsbutikk med kai' if KIND == 's' else 'Verft med stor kai, diesel og skipsløft for alle båter'
    ex = {'frame': 'kystfiske harbour unit: x along the quay face, y up from mean sea level, z out to sea; metres', 'name': name, 'look': KIND, 'anchors': anchors()}
    file = 'harbour-unit-' + KIND
    export_boat(build, K.to_game, K.to_game_n, OUT, file + '.glb', os.path.join(ROOT, 'src', 'data', file + '.b64'), ex, side=None, dry='dry' in sys.argv, more=more)


if __name__ == '__main__':
    main()
