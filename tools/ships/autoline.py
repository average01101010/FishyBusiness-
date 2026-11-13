"""The coastal longliner (Ø15 N7, steg 36): the coastal fleet's autoline boat, 20.9 × 7.2 × 3.2 m (the register's 15-21 m group, where
the line boats with the autoline system are; each boat in the game is the model scaled to her own length and beam). The shelter deck
closed over the whole length, the hauling port in the starboard side forward where the line comes in, the wheelhouse on the shelter's
roof forward with the mast, the after mast with the radar and the boom, the liferafts and the small crane aft on the shelter's roof,
portholes along the shelter. fisklib.py has what the fishing boats share.
The type that gave the arrangement: the Norwegian coastal longliners of 15-28 m with a closed shelter deck and the autoline system
(the line hauled through a port in the side); no boat is copied. Measures assumed from the type (A).

    python3.11 tools/ships/autoline.py fast dry | check | fast export   (shiplib.py's docstring)
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fisklib import *

T_ID = 'ship-autoline'; NAME = 'Kystlinebåt (21 m)'
COLOURS = ((0.08, 0.16, 0.30), (0.75, 0.75, 0.73), (0.95, 0.95, 0.93))
L, B, T, D, SH = 20.9, 7.2, 3.2, 5.6, 0.9                    # D: the shelter deck's roof at the side
H = fishing_hull(L, B, T, D, SH, fine_bow=0.55)
BW = 0.9
WH = (13.6, 17.4, 2.5, 2.4)
ZW0 = T + 1.2                                                 # the work deck inside the shelter (the hauling port's sill)
LT = {}; WIN = []
ZW = [0.0, 0.0]

def set_lights():
    z0 = wh_floor(H, WH[0], WH[1], 0.3); z1 = z0 + WH[3]
    LT.update({'masthead': (WH[1] - 0.4, 0.0, D + 7.5), 'port': (WH[1] - 0.7, WH[2] + 0.12, z0 + 1.45), 'stbd': (WH[1] - 0.7, -(WH[2] + 0.12), z0 + 1.45),
               'stern': (0.2, 0.0, D + BW + 0.35)})

def build(fine=True):
    del WIN[:]; more_colours()
    hull, R, U = build_hull(H, fine)
    A = Acc('ship')
    deck_and_rail(A, H, R, U, BW)
    z0, z1 = wheelhouse_f(A, H, WH[0], WH[1], WH[2], WH[3], fine, WIN, raise_=0.3); ZW[:] = [z0, z1]
    set_lights()
    mast(A, LT['masthead'][0], 0.0, z1 + 0.1, LT['masthead'][2] + 0.25, 0.09, C['sup'], fine, yard=0.7)
    # the hauling port in the starboard side, the shelter's portholes
    xp0, xp1 = 14.2, 15.8
    q = []
    for (xx, zz) in ((xp0, ZW0), (xp1, ZW0), (xp1, ZW0 + 1.2), (xp0, ZW0 + 1.2)):
        u = clamp((xx - H.xa(zz)) / (H.xf(zz) - H.xa(zz)), 0, 1); q.append((xx, -(H.hw(u, zz) + 0.03), zz))
    A.poly(q, C['black'], (0, -1, 0))
    if fine:
        hull_windows(A, H, 4.0, 13.0, D - 1.3, D - 0.9, 2.2, 0.45, C['win'], WIN, 1)
        # the after mast with its radar and boom, the crane and the liferafts aft on the shelter's roof
        mast(A, 4.2, 0.0, D, D + 5.2, 0.09, C['sup'], fine, yard=0.6)
        radar(A, 4.2, 0.0, D + 5.25, 2.2, fine)
        beam(A, (4.2, 0.0, D + 1.5), (0.8, 0.0, D + 2.4), 0.12, 0.12, C['sup'])
        acyl(A, (6.5, -2.3, D), (6.5, -2.3, D + 1.4), 0.2, lambda z: C['blue'], seg=8)
        beam(A, (6.5, -2.3, D + 1.35), (9.5, -2.3, D + 1.0), 0.18, 0.2, C['blue'])
        for y in (2.3, 1.2): raft(A, 9.0, y, D)
        abox(A, 10.4, 12.6, -1.1, 1.1, D, D + 0.6, C['sup2'])                    # the shelter's hatch and the tubs' place
        radar(A, (WH[0] + WH[1]) / 2 - 0.6, 0.0, z1 + 0.12, 2.0, fine)
        tyres(A, H, (5.0, 9.0, 12.8), fine)
        fishing_lights(A, H, LT, fine)
    G = []; tiny_glass(G)
    return [hull, A.done(35)], G

def anchors():
    return fishing_anchors(H, LT, WIN, (WH[1] - 0.9, 0.0, ZW[0]), [(10.0, 1.4, D, 1.6), (8.0, -1.0, D, -1.6)], D, D + BW)

def check():
    set_lights()
    return fishing_check(T_ID, H, LT, D, [
        (ZW0 - T >= 1.0, 'haleluka %.1f m over vannlinja' % (ZW0 - T)),
        (14.2 > WH[0] - 1.0, 'haleluka forut, under styrhuset')], cb=(0.42, 0.62), scale_to=22.1)

if __name__ == '__main__':
    run(sys.modules[__name__])
