"""The middle car ferry (Ø15 N7, steg 36): the game's size class 1 (core/05b-ferje.js FERJE_SIZE[0][1], 64.0 × 13.4 × 3.4 m), a
double-ended ferry with a closed car deck (three lanes, the side casings and the upper deck over it, open at both ends with the ramps), a
saloon deck amidships with a smaller deck over it, the wheelhouse on top with windows all round and wings, one funnel on the starboard
casing, and a mast at each end with the masthead lights (two from 50 m: the leading end's lower, the other's 4.5 m higher).
The type that gave the arrangement: the Norwegian double-ended ferries of 60-70 m (some 80-120 cars) built from the 1990s; no ship is
copied, and no name, owner or mark is on her (CLAUDE.md, valg 2 A). Measures: the game's own (L, B, T); the depth to the car deck, the
clear height (4.8 m), the decks' heights and the house's plan assumed from the type (A).

    python3.11 tools/ships/ferje64.py fast dry | check | fast export   (shiplib.py's docstring; the arrangement is lukketferje.py)
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from shiplib import *
import lukketferje as LF

T_ID = 'ship-ferje64'; NAME = 'Bilferje, middels (64 m)'
COLOURS = ((0.07, 0.12, 0.24), (0.70, 0.10, 0.09), (0.93, 0.93, 0.91))
F = dict(L=64.0, B=13.4, T=3.4, D=4.7, spoon=7.0, xc=(7.0, 57.0), clear=4.8, cw=2.0, nl=3, ramp=5.0, cwin=3.0,
         tiers=[(16.0, 48.0, 4.8, 3.0), (25.0, 39.0, 3.8, 2.6)], wev=[2.2, 1.8], wh=(28.5, 35.5, 3.0, 2.6), wing=3.2,
         mastx=8.0, mh=(17.0, 21.6), funnels=[(32.0, -1)], fz=17.8, fl=3.2, fw=1.4, rafts=[20.0, 26.0, 38.0, 44.0], rescue=12.0)
H = LF.make(F)
def build(fine=True): return LF.build(F, fine)
def anchors(): return LF.anchors(F)
def check(): return LF.check(F, T_ID, (1300, 2400))

if __name__ == '__main__':
    run(sys.modules[__name__])
