"""The pot boat (Ø15 N7, steg 36): the coastal fleet's crab and lobster pot boat, 10.99 × 4.2 × 1.7 m (the register's under-11 m group,
where nearly all the pot boats are; each boat in the game is the model scaled to her own length and beam). The wheelhouse forward,
the pot hauler on its davit to starboard by the wheelhouse, the pots stacked on the after deck, the buoys and the dhan poles in their
rack at the stern, the tyres along the sides. fisklib.py has what the fishing boats share.
The type that gave the arrangement: the Norwegian sjarks of 9-11 m that fish crab with pots (the hauler on a davit, the pots stacked
aft); no boat is copied. Measures assumed from the type (A).

    python3.11 tools/ships/teine.py fast dry | check | fast export   (shiplib.py's docstring)
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fisklib import *

T_ID = 'ship-teine'; NAME = 'Teinebåt (11 m)'
COLOURS = ((0.90, 0.90, 0.88), (0.08, 0.16, 0.30), (0.95, 0.95, 0.93))
L, B, T, D, SH = 10.99, 4.2, 1.7, 2.3, 0.9
H = fishing_hull(L, B, T, D, SH)
BW = 0.85
WH = (6.6, 8.9, 1.45, 2.1)
DV = (6.1, -1.75)                                             # the hauler's davit
POT = (1.0, 0.7, 0.42)                                        # a pot: length, breadth, height
STACKS = [(1.6, 0.85, 3), (2.75, 0.85, 3), (3.9, 0.85, 2), (1.6, -0.85, 3), (2.75, -0.85, 2), (3.9, -0.85, 2)]
LT = {}; WIN = []
ZW = [0.0, 0.0]

def set_lights():
    z0 = wh_floor(H, WH[0], WH[1], 0.45); z1 = z0 + WH[3]
    LT.update({'masthead': (WH[1] - 0.3, 0.0, z1 + 1.8), 'port': (WH[1] - 0.5, WH[2] + 0.12, z0 + 1.35), 'stbd': (WH[1] - 0.5, -(WH[2] + 0.12), z0 + 1.35),
               'stern': (0.12, 0.0, D + BW + 0.3)})

def build(fine=True):
    del WIN[:]; more_colours()
    hull, R, U = build_hull(H, fine)
    A = Acc('ship')
    deck_and_rail(A, H, R, U, BW)
    z0, z1 = wheelhouse_f(A, H, WH[0], WH[1], WH[2], WH[3], fine, WIN, raise_=0.45); ZW[:] = [z0, z1]
    set_lights()
    mast(A, LT['masthead'][0], 0.0, z1 + 0.1, LT['masthead'][2] + 0.25, 0.06, C['sup'], fine, yard=0.4)
    # the hauler on its davit out over the starboard rail
    beam(A, (DV[0], DV[1], D), (DV[0], DV[1], D + 2.1), 0.14, 0.14, C['blue'], up=(1, 0, 0))
    beam(A, (DV[0], DV[1], D + 2.05), (DV[0], DV[1] - 0.75, D + 2.2), 0.12, 0.14, C['blue'])
    obox(A, (DV[0], DV[1] - 0.15, D + 1.3), (0.22, 0, 0), (0, 0.2, 0), (0, 0, 0.24), C['blue'])
    if fine: acyl(A, (DV[0] - 0.05, DV[1] - 0.75, D + 2.05), (DV[0] + 0.05, DV[1] - 0.75, D + 2.05), 0.16, lambda z: C['steel'], seg=8)
    # the pots in their stacks on the after deck
    for x, y, n in STACKS:
        for k in range(n if fine else 1):
            zz = D + k * POT[2]; h = POT[2] if fine else POT[2] * n
            abox(A, x - POT[0] / 2, x + POT[0] / 2, y - POT[1] / 2, y + POT[1] / 2, zz, zz + h - 0.02, C['potn'])
            if fine: abox(A, x - POT[0] / 2 - 0.02, x + POT[0] / 2 + 0.02, y - POT[1] / 2 - 0.02, y + POT[1] / 2 + 0.02, zz + h - 0.06, zz + h - 0.02, C['dark'])
    if fine:
        # the buoys and the dhan poles with their flags in the rack at the stern
        for k, y in enumerate((-1.2, -0.7, 0.7, 1.2)):
            acyl(A, (0.55, y, D + 0.05), (0.55, y, D + 0.45), 0.2, lambda z: C['orange'], seg=8)
        for y in (-0.35, 0.35):
            acyl(A, (0.35, y, D), (0.25, y, D + 3.2), 0.03, lambda z: C['steel'], seg=4)
            A.poly([(0.25, y, D + 3.2), (0.25, y, D + 2.75), (0.25, y + 0.35, D + 2.95)], C['dark'], (1, 0, 0))
        abox(A, 5.2, 5.9, -0.55, 0.55, D, D + 0.3, C['sup2'])                    # the hatch to the crab tank
        tyres(A, H, (2.5, 5.0, 7.4), fine)
        fishing_lights(A, H, LT, fine)
    G = []; tiny_glass(G)
    return [hull, A.done(35)], G

def anchors():
    return fishing_anchors(H, LT, WIN, (WH[1] - 0.7, 0.0, ZW[0]), [(5.6, -1.2, D, -1.6), (4.8, 0.6, D, 0.0)], D, D + BW)

def check():
    set_lights()
    hw = lambda x: H.hw(clamp(x / L, 0, 1), D) - 0.1
    return fishing_check(T_ID, H, LT, D + BW, [
        (all(abs(y) + POT[1] / 2 < hw(x - POT[0] / 2) and abs(y) + POT[1] / 2 < hw(x + POT[0] / 2) for x, y, n in STACKS), 'teinestablene innenfor ripa'),
        (max(x + POT[0] / 2 for x, y, n in STACKS) < DV[0] - 0.4, 'teinene går klar av haleren'),
        (max(n for x, y, n in STACKS) * POT[2] < BW + 0.6, 'stablene høyst %.1f m over ripa' % (max(n for x, y, n in STACKS) * POT[2] - BW))], cb=(0.38, 0.58))

if __name__ == '__main__':
    run(sys.modules[__name__])
