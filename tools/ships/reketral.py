"""The shrimp trawler of the coast (Ø15 N7, steg 36): the coastal fleet's trawler, 14.99 × 6.0 × 2.5 m (the register's 11-15 m group;
each boat in the game is the model scaled to her own length and beam). The wheelhouse forward on the high bow, the trawl winch's two
drums aft of it, the net drum on its frames aft, the gantry over the stern with the trawl doors hung outboard of it, the hold's hatch,
the tyres along the sides. fisklib.py has what the fishing boats share.
The type that gave the arrangement: the Norwegian coastal shrimp trawlers of 11-15 m (stern trawling over a gantry, the doors hung on
it); no boat is copied. Measures assumed from the type (A).

    python3.11 tools/ships/reketral.py fast dry | check | fast export   (shiplib.py's docstring)
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fisklib import *

T_ID = 'ship-tral'; NAME = 'Reketråler (15 m)'
COLOURS = ((0.06, 0.32, 0.36), (0.75, 0.75, 0.73), (0.95, 0.95, 0.93))
L, B, T, D, SH = 14.99, 6.0, 2.5, 3.3, 1.1
H = fishing_hull(L, B, T, D, SH)
BW = 1.0
WH = (9.2, 12.2, 1.9, 2.3)
XG, GH = 0.4, 4.4                                             # the gantry: x, its height over the deck
XD, ZD, RD, WD = 2.7, D + 1.15, 0.8, 2.6                      # the net drum
LT = {}; WIN = []
ZW = [0.0, 0.0]

def set_lights():
    z0 = wh_floor(H, WH[0], WH[1]); z1 = z0 + WH[3]
    LT.update({'masthead': (WH[1] - 0.35, 0.0, z1 + 3.8),   # (high enough that a boat of the register's 27.5 m, the model scaled, has it the beam over her hull, vedlegg I 2(a)(i))
                'port': (WH[1] - 0.6, WH[2] + 0.12, z0 + 1.45), 'stbd': (WH[1] - 0.6, -(WH[2] + 0.12), z0 + 1.45),
               'stern': (0.15, 0.0, D + BW + 0.35)})

def build(fine=True):
    del WIN[:]; more_colours()
    hull, R, U = build_hull(H, fine)
    A = Acc('ship')
    deck_and_rail(A, H, R, U, BW)
    z0, z1 = wheelhouse_f(A, H, WH[0], WH[1], WH[2], WH[3], fine, WIN); ZW[:] = [z0, z1]
    set_lights()
    mast(A, LT['masthead'][0], 0.0, z1 + 0.1, LT['masthead'][2] + 0.25, 0.07, C['sup'], fine, yard=0.5)
    # the gantry over the stern and the doors hung outboard of its legs
    for sg in (1, -1): beam(A, (XG, sg * 2.3, D), (XG, sg * 2.1, D + GH), 0.22, 0.22, C['blue'], up=(1, 0, 0))
    beam(A, (XG, -2.25, D + GH), (XG, 2.25, D + GH), 0.24, 0.24, C['blue'])
    for sg in (1, -1):
        obox(A, (XG + 0.1, sg * 2.62, D + GH - 1.9), (0.85, 0, 0), (0, 0.07, 0), (0, 0, 0.55), C['dark'])
        if fine: beam(A, (XG, sg * 2.5, D + GH - 0.1), (XG + 0.1, sg * 2.62, D + GH - 1.35), 0.04, 0.04, C['steel'])
    drum_y(A, XD, ZD, RD, WD, C['net'], flange=1.05, fine=fine, mf=C['blue'])
    for y in (-WD / 2 - 0.12, WD / 2 + 0.12):
        beam(A, (XD - 0.8, y, D), (XD, y, ZD), 0.15, 0.15, C['blue']); beam(A, (XD + 0.8, y, D), (XD, y, ZD), 0.15, 0.15, C['blue'])
    if fine:
        # the trawl winch: two drums of wire side by side on an athwartships axle, aft of the wheelhouse
        for sg in (1, -1):
            acyl(A, (7.7, sg * 0.25, D + 0.75), (7.7, sg * 1.25, D + 0.75), 0.42, lambda z: C['dark'], seg=10)
            acyl(A, (7.7, sg * 1.25, D + 0.75), (7.7, sg * 0.25, D + 0.75), 0.42, lambda z: C['dark'], seg=10)
        abox(A, 7.2, 8.2, -1.45, 1.45, D, D + 0.4, C['blue'])
        for sg in (1, -1): abox(A, 7.4, 8.0, sg * 1.35 - 0.08, sg * 1.35 + 0.08, D + 0.4, D + 1.3, C['blue'])
        abox(A, 5.4, 6.6, -0.8, 0.8, D, D + 0.35, C['sup2'])                    # the hold's hatch
        abox(A, 4.2, 5.0, 1.4, 2.1, D, D + 0.9, C['steel'])                     # the shrimp cooker's box
        for sg in (1, -1): acyl(A, (XG, sg * 1.2, D + GH - 0.35), (XG, sg * 1.2, D + GH - 0.75), 0.18, lambda z: C['steel'], seg=6)
        tyres(A, H, (3.5, 7.0, 10.2), fine)
        fishing_lights(A, H, LT, fine)
    G = []; tiny_glass(G)
    return [hull, A.done(35)], G

def anchors():
    return fishing_anchors(H, LT, WIN, (WH[1] - 0.8, 0.0, ZW[0]), [(4.4, -0.9, D, -1.2), (5.8, 1.3, D, 1.6)], D, D + BW)

def check():
    set_lights()
    return fishing_check(T_ID, H, LT, D + BW, [
        (XD - 1.05 > XG + 0.2, 'nettrommelen går klar av galgen'),
        (XD + 1.05 < 7.2, 'nettrommelen går klar av trålvinsjen'),
        (2.62 + 0.07 < H.hw(XG / L, D) + 0.6, 'trålbordene henger tett inntil hekken (%.2f m ut, skutesida %.2f m)' % (2.62, H.hw(XG / L, D)))], scale_to=23.4)

if __name__ == '__main__':
    run(sys.modules[__name__])
