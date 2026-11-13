"""The Danish seiner (Ø15 N7, steg 36): the coastal fleet's snurrevad boat, 14.99 × 6.0 × 2.4 m (the register's 11-15 m group; each boat
in the game is the model scaled to her own length and beam). The wheelhouse forward on the high bow, the work deck aft with the net drum
on its frames over the stern, the gantry (galge) with its blocks aft of it, the two rope coilers on deck forward of the drum, the fish
hold's hatch, the tyres along the sides. fisklib.py has what the fishing boats share.
The type that gave the arrangement: the Norwegian coastal Danish seiners of 11-15 m (the net drum aft and the coilers on deck); no boat
is copied. Measures assumed from the type (A).

    python3.11 tools/ships/snurrevad.py fast dry | check | fast export   (shiplib.py's docstring)
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fisklib import *

T_ID = 'ship-snurrevad'; NAME = 'Snurrevadbåt (15 m)'
COLOURS = ((0.08, 0.16, 0.30), (0.75, 0.75, 0.73), (0.95, 0.95, 0.93))
L, B, T, D, SH = 14.99, 6.0, 2.4, 3.3, 1.2
H = fishing_hull(L, B, T, D, SH)
BW = 1.0
WH = (9.4, 12.4, 1.9, 2.3)
XD, ZD, RD, WD = 2.0, D + 1.35, 0.95, 3.0                    # the net drum: x, its axle's height, wound radius, width
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
    # the net drum on its frames, the net wound on it
    drum_y(A, XD, ZD, RD, WD, C['net'], flange=1.25, fine=fine, mf=C['blue'])
    for y in (-WD / 2 - 0.12, WD / 2 + 0.12):
        beam(A, (XD - 0.9, y, D), (XD, y, ZD), 0.16, 0.16, C['blue']); beam(A, (XD + 0.9, y, D), (XD, y, ZD), 0.16, 0.16, C['blue'])
    # the gantry over the stern
    for sg in (1, -1): beam(A, (0.45, sg * 2.25, D), (0.45, sg * 2.0, D + 3.9), 0.2, 0.2, C['blue'], up=(1, 0, 0))
    beam(A, (0.45, -2.1, D + 3.9), (0.45, 2.1, D + 3.9), 0.22, 0.22, C['blue'])
    if fine:
        for sg in (1, -1): abox(A, 0.3, 0.6, sg * 1.3 - 0.15, sg * 1.3 + 0.15, D + 3.2, D + 3.75, C['steel'])
        # the coilers for the ropes and the winch between them
        for sg in (1, -1):
            acyl(A, (5.4, sg * 1.35, D), (5.4, sg * 1.35, D + 0.25), 0.62, lambda z: C['blue'], seg=10)
            acyl(A, (5.4, sg * 1.35, D + 0.25), (5.4, sg * 1.35, D + 0.95), 0.55, lambda z: C['rope'], seg=10)
        abox(A, 6.3, 7.1, -0.5, 0.5, D, D + 0.8, C['blue'])
        abox(A, 7.4, 8.6, -0.8, 0.8, D, D + 0.35, C['sup2'])                 # the hold's hatch
        # the rollers at the stern for the ropes, the fish boxes by the hold
        for sg in (1, -1): acyl(A, (0.05, sg * 1.3 - 0.4, D + BW + 0.1), (0.05, sg * 1.3 + 0.4, D + BW + 0.1), 0.12, lambda z: C['steel'], seg=6)
        for k, x in enumerate((6.6, 7.4)):
            abox(A, x, x + 0.7, 1.6, 2.1, D, D + 0.32, C['sup'])
        tyres(A, H, (3.5, 7.0, 10.2), fine)
        fishing_lights(A, H, LT, fine)
    G = []; tiny_glass(G)
    return [hull, A.done(35)], G

def anchors():
    return fishing_anchors(H, LT, WIN, (WH[1] - 0.8, 0.0, ZW[0]), [(4.3, 0.9, D, 1.4), (3.4, -1.2, D, -1.2)], D, D + BW)

def check():
    set_lights()
    return fishing_check(T_ID, H, LT, D + BW, [
        (XD + RD + 0.2 < 5.4 - 0.62, 'nottrommelen (til %.1f m) og tauspolene (fra %.1f m) står klar av hverandre' % (XD + RD, 5.4 - 0.62)),
        (1.25 + ZD - D < 3.9, 'trommelen under galgen'),
        (H.hw(XD / L, D) > WD / 2 + 0.3, 'trommelen (%.1f m bred) innenfor skutesida (%.1f m)' % (WD, 2 * H.hw(XD / L, D)))])

if __name__ == '__main__':
    run(sys.modules[__name__])
