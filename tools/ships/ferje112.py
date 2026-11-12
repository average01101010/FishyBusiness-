"""The big car ferry (Ø15 N7, steg 36): the game's size class 2 (core/05b-ferje.js FERJE_SIZE[0][2], 112.0 × 17.5 × 4.4 m), a
double-ended ferry with a closed car deck (four lanes), two passenger decks over it and a third small one under the wheelhouse, wings to
the sides, two funnels (one on each casing), liferafts and a rescue boat, and a mast at each end with the masthead lights.
The type that gave the arrangement: the big Norwegian double-ended ferries of 100-130 m (some 200-240 cars) on the busiest crossings; no
ship is copied, and no name, owner or mark is on her (CLAUDE.md, valg 2 A). Measures: the game's own (L, B, T); the depth, the clear
height (5.0 m) and the house assumed from the type (A).

    python3.11 tools/ships/ferje112.py fast dry | check | fast export   (shiplib.py's docstring; the arrangement is lukketferje.py)
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from shiplib import *
import lukketferje as LF

T_ID = 'ship-ferje112'; NAME = 'Bilferje, stor (112 m)'
COLOURS = ((0.07, 0.12, 0.24), (0.70, 0.10, 0.09), (0.93, 0.93, 0.91))
F = dict(L=112.0, B=17.5, T=4.4, D=6.0, spoon=11.0, xc=(11.0, 101.0), clear=5.0, cw=2.6, nl=4, ramp=6.5, cwin=3.2,
         tiers=[(26.0, 86.0, 6.6, 3.2), (34.0, 78.0, 6.0, 3.0), (46.0, 66.0, 4.2, 2.6)], wev=[2.4, 2.0, 1.8], wh=(52.0, 60.0, 3.4, 2.7), wing=4.9,
         mastx=14.0, mh=(18.3, 23.0), funnels=[(56.0, -1), (56.0, 1)], fz=25.0, fl=4.0, fw=1.6, rafts=[30.0, 36.0, 42.0, 70.0, 76.0, 82.0], rescue=20.0)
H = LF.make(F)
def build(fine=True): return LF.build(F, fine)
def anchors(): return LF.anchors(F)
def check(): return LF.check(F, T_ID, (4000, 7000))

if __name__ == '__main__':
    run(sys.modules[__name__])
