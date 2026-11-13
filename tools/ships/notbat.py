"""The purse seiner of the coast (Ø15 N7, steg 36): the coastal fleet's not boat, 14.99 × 6.4 × 2.6 m (the register's 11-15 m group; each
boat in the game is the model scaled to her own length and beam, also the many notsjarks under 11 m). The wheelhouse forward on the
high bow, the crane to starboard aft of it with the power block hanging from its boom, the seine in its heap on the after deck with the
floats along its edge, the hold's hatch, the tyres along the sides. fisklib.py has what the fishing boats share.
The type that gave the arrangement: the Norwegian coastal purse seiners (kystnot) of 11-15 m that seine herring, mackerel and saithe;
no boat is copied. Measures assumed from the type (A).

    python3.11 tools/ships/notbat.py fast dry | check | fast export   (shiplib.py's docstring)
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fisklib import *

T_ID = 'ship-not'; NAME = 'Notbåt (15 m)'
COLOURS = ((0.55, 0.10, 0.09), (0.75, 0.75, 0.73), (0.95, 0.95, 0.93))
L, B, T, D, SH = 14.99, 6.4, 2.6, 3.4, 1.2
H = fishing_hull(L, B, T, D, SH)
BW = 1.0
WH = (9.6, 12.6, 2.0, 2.3)
CR = (8.7, -2.0)                                              # the crane's pedestal
PB = (3.6, -1.0, D + 5.8)                                     # the boom's head, where the power block hangs
HEAP = (0.6, 6.4)                                             # the seine's heap aft, x0..x1
LT = {}; WIN = []
ZW = [0.0, 0.0]

def set_lights():
    z0 = wh_floor(H, WH[0], WH[1]); z1 = z0 + WH[3]
    LT.update({'masthead': (WH[1] - 0.35, 0.0, z1 + 2.5), 'port': (WH[1] - 0.6, WH[2] + 0.12, z0 + 1.45), 'stbd': (WH[1] - 0.6, -(WH[2] + 0.12), z0 + 1.45),
               'stern': (0.15, 0.0, D + BW + 0.35)})

def build(fine=True):
    del WIN[:]; more_colours()
    hull, R, U = build_hull(H, fine)
    A = Acc('ship')
    deck_and_rail(A, H, R, U, BW)
    z0, z1 = wheelhouse_f(A, H, WH[0], WH[1], WH[2], WH[3], fine, WIN); ZW[:] = [z0, z1]
    set_lights()
    mast(A, LT['masthead'][0], 0.0, z1 + 0.1, LT['masthead'][2] + 0.25, 0.07, C['sup'], fine, yard=0.5)
    # the crane and its boom up and aft over the heap, the power block under its head
    acyl(A, (CR[0], CR[1], D), (CR[0], CR[1], D + 2.4), 0.32, lambda z: C['blue'], seg=8 if fine else 5)
    beam(A, (CR[0], CR[1], D + 2.3), PB, 0.3, 0.36, C['blue'])
    obox(A, (PB[0], PB[1], PB[2] - 0.8), (0.32, 0, 0), (0, 0.22, 0), (0, 0, 0.42), C['dark'])
    if fine:
        beam(A, (PB[0], PB[1], PB[2] - 0.05), (PB[0], PB[1], PB[2] - 0.4), 0.06, 0.06, C['steel'], up=(1, 0, 0))
        beam(A, (CR[0] + 0.25, CR[1], D + 1.4), ((CR[0] + PB[0]) / 2, (CR[1] + PB[1]) / 2, (D + 2.3 + PB[2]) / 2 - 0.25), 0.16, 0.16, C['steel'])   # (the boom's ram)
    # the seine in its heap: lumps of net, the floats along its port edge, the lead line's side to starboard
    import random
    rnd = random.Random(7); x0, x1 = HEAP; n = 6 if fine else 2
    for i in range(n):
        xa = x0 + (x1 - x0) * i / n; xb = x0 + (x1 - x0) * (i + 1) / n; hw = min(H.hw(xa / L, D), H.hw(xb / L, D)) - 0.25
        h = 0.9 + 0.35 * rnd.random()
        abox(A, xa, xb, -hw, hw, D, D + h, C['net'])
        if fine:
            abox(A, xa + 0.15, xb - 0.15, -hw + 0.4, hw - 0.5, D + h, D + h + 0.25 + 0.2 * rnd.random(), C['net'])
            for k in range(3): abox(A, xa + 0.1 + k * (xb - xa) / 3, xa + 0.1 + k * (xb - xa) / 3 + 0.22, hw - 0.4, hw - 0.1, D + h, D + h + 0.16, C['yellow'])
    if fine:
        abox(A, 7.2, 8.2, -0.8, 0.8, D, D + 0.35, C['sup2'])                   # the hold's hatch
        abox(A, 6.6, 7.0, 1.3, 2.0, D, D + 0.9, C['blue'])                      # the purse winch
        tyres(A, H, (3.5, 7.0, 10.2), fine)
        fishing_lights(A, H, LT, fine)
    G = []; tiny_glass(G)
    return [hull, A.done(35)], G

def anchors():
    return fishing_anchors(H, LT, WIN, (WH[1] - 0.8, 0.0, ZW[0]), [(7.4, 1.0, D, 1.4), (6.9, -0.6, D, -1.4)], D, D + BW)

def check():
    set_lights()
    return fishing_check(T_ID, H, LT, D + BW, [
        (PB[0] > HEAP[0] + 1.0 and PB[0] < HEAP[1] - 1.0, 'kraftblokka (x %.1f m) henger over notbingen (%.1f-%.1f m)' % (PB[0], HEAP[0], HEAP[1])),
        (HEAP[1] < CR[0] - 0.4, 'notbingen går klar av kranfoten'),
        (abs(CR[1]) + 0.32 < H.hw(CR[0] / L, D), 'kranfoten innenfor skutesida')])

if __name__ == '__main__':
    run(sys.modules[__name__])
