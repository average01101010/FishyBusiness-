"""The cargo ship (Ø15 N7, steg 36; her traffic is N5, steg 37): a general cargo ship of the kind that carries goods along the coast and
across the North Sea, 90.0 × 15.2 × 5.6 m (each ship in the game is the model scaled to her own length and beam, as the ferries are).
A raked stem over a bulbous bow, a short forecastle with the foremast, three holds under their hatch covers on a long main deck with two
deck cranes on the centre line between them, the house aft (three decks and the bridge with its wings), the funnel on its after end, the
free-fall lifeboat on her ramp over the stern, liferafts and the rescue boat's davit at the house's sides.
The type that gave the arrangement: the 80-110 m general cargo and multipurpose ships of the North Sea trade (some 3 000-6 000 dwt,
built from the 1990s); no ship is copied, and no name, owner, mark or logo is on her hull or funnel (CLAUDE.md, valg 2 A 05.11.2026).
Measures: the type's (L, B, T from that range); the depth, the houses and the cranes assumed from the type (A).

    python3.11 tools/ships/last.py fast dry | check | fast export   (shiplib.py's docstring)
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from shiplib import *

T_ID = 'ship-last'; NAME = 'Lasteskip (90 m)'
COLOURS = ((0.09, 0.15, 0.25), (0.70, 0.10, 0.09), (0.93, 0.93, 0.91))
L, B, T, D = 90.0, 15.2, 5.6, 7.6
FC = 2.4                                    # the forecastle over the main deck
H = Hull(dict(L=L, B=B, T=T,
              stem=[(0.0, 85.5), (T, 88.4), (D, 89.3), (D + FC + 0.2, 90.0)], stern=[(0.0, 5.0), (T, 1.6), (D, 0.4), (D + FC + 0.2, 0.0)],
              keel=[(0.0, 3.4), (0.06, 1.3), (0.15, 0.0), (0.92, 0.0), (0.97, 0.3), (1.0, 1.5)],
              deck=[(0.0, D), (0.84, D), (0.875, D + FC), (1.0, D + FC + 0.2)],
              fore=(0.74, 1.8, 3.2, 0.0), aft=(0.2, 1.6, 3.4, 0.62),
              p=[(0.0, 2.4), (0.25, 4.5), (0.75, 4.5), (1.0, 2.2)], flare=0.03,
              bands=[(T + 0.3, 'af'), (T + 0.75, 'boot'), (None, 'hull')]))
HT = 2.7
HOUSE = [(2.0, 17.0, B / 2 - 0.6), (3.0, 16.6, 6.6), (3.5, 16.6, 6.6)]          # the house's decks over the main deck: x0, x1, half-width
ZH = [D + HT * i for i in range(len(HOUSE) + 1)]
BR = (9.0, 16.6, 6.6, ZH[-1], ZH[-1] + 2.9)                                     # the bridge: x0, x1, half-width, floor, roof
HOLDS = [(20.0, 35.5), (40.5, 55.5), (60.5, 76.0)]
CW = B / 2 - 1.3                                                                 # the coamings' half-width
CRANES = [38.0, 58.0]
XF = 5.6                                                                         # the funnel
LT = {'masthead': (85.5, 0.0, D + 13.0), 'masthead2': (13.0, 0.0, D + 17.9),
      'port': (15.6, B / 2 - 0.15, BR[3] + 1.2), 'stbd': (15.6, -(B / 2 - 0.15), BR[3] + 1.2), 'stern': (1.5, 0.0, D + 1.6)}
WIN = []

def build(fine=True):
    del WIN[:]
    C.setdefault('hatch', mat('hatch', (0.24, 0.30, 0.36), 0.35, zone=4))
    hull, R, U = build_hull(H, fine)
    A = Acc('ship'); seg = 3 if fine else 1
    deck_surface(A, H, R, U, C['deck'])
    bulwark(A, H, R, U, 1.1, C['hull'], C['sup'], 0.86, 1.0)                    # the forecastle's bulwark
    capsule(A, (L - 3.6, 0.0, 2.6), 7.0, 2.8, 3.2, C['af'], n=12 if fine else 6, rings=8 if fine else 3)   # the bulb
    # the forecastle's after wall (the hull's top steps up there)
    xs = 0.855 * L
    abox(A, xs - 0.3, xs, -H.hw(0.855, D) + 0.05, H.hw(0.855, D) - 0.05, D, D + FC, C['hull'])
    # the holds: coamings and their covers in panels
    for x0, x1 in HOLDS:
        abox(A, x0, x1, -CW, CW, D, D + 1.7, C['hull'])
        n = 3 if fine else 1; w = (x1 - x0) / n
        for k in range(n):
            a = x0 + k * w + (0.08 if fine else 0); b = x0 + (k + 1) * w - (0.08 if fine else 0)
            abox(A, a, b, -CW - 0.15, CW + 0.15, D + 1.7, D + 2.15, C['hatch'])
            if fine: abox(A, a + 0.6, b - 0.6, -CW + 0.4, CW - 0.4, D + 2.15, D + 2.3, C['hatch'])   # (the cover's raised middle)
    # the cranes between the holds, their jibs stowed forward on rests over the next hold
    for x in CRANES:
        deck_crane(A, x, 0.0, D, 6.0, 16.5, 0.0, C['sup'], C['steel'], fine, rest=D + 4.2)
    # the house aft, the bridge and its wings
    for i, (x0, x1, hw) in enumerate(HOUSE):
        pl = rrect(x0, x1, -hw, hw, 0.3, 0.3, 1)
        prism(A, pl, ZH[i], ZH[i + 1], C['sup'], C['roof'])
        if i >= 1:
            if fine: windows(A, pl, ZH[i] + 1.0, ZH[i] + 2.0, C['win'], every=2.4, w=1.1, margin=1.0, lit=WIN)
            else: band(A, pl, ZH[i] + 1.0, ZH[i] + 2.0, C['win'], edges=[0, 1, 2])
    bp = rrect(BR[0], BR[1], -BR[2], BR[2], 0.3, 0.3, 1)
    prism(A, bp, BR[3], BR[4], C['sup'], C['roof'])
    if fine: windows(A, bp, BR[3] + 1.15, BR[4] - 0.35, C['winB'], every=1.25, w=1.05, margin=0.3, lit=WIN, litk=3, edges=[0, 1, 2])
    else: band(A, bp, BR[3] + 1.15, BR[4] - 0.35, C['winB'], edges=[0, 1, 2])
    for sg in (1, -1):
        y0, y1 = sorted((sg * BR[2], sg * (B / 2 - 0.05)))
        abox(A, BR[1] - 3.2, BR[1], y0, y1, BR[3] - 0.25, BR[3], C['sup'])          # the wing's deck
        if fine: rail(A, [(BR[1] - 3.2, sg * (B / 2 - 0.1)), (BR[1], sg * (B / 2 - 0.1))], BR[3], 1.1, C['sup'])
        if fine: abox(A, BR[1] - 0.15, BR[1], y0, y1, BR[3], BR[3] + 1.1, C['sup'])     # (the wing's front plating)
    abox(A, BR[0] - 0.1, BR[1] + 0.4, -BR[2] - 0.2, BR[2] + 0.2, BR[4], BR[4] + 0.2, C['sup'])   # the roof's visor
    # the funnel on the house's after end, the masts and radars
    funnel(A, XF, 0.0, ZH[-1], ZH[-1] + 5.2, 4.0, 3.4, C['band'], C['black'], rake=0.15, fine=fine)
    mast(A, LT['masthead'][0], 0.0, D + FC, LT['masthead'][2] + 0.5, 0.18, C['sup'], fine, yard=1.2)
    mast(A, LT['masthead2'][0], 0.0, BR[4], LT['masthead2'][2] + 0.5, 0.16, C['sup'], fine, yard=1.6)
    if fine:
        radar(A, 11.0, 0.0, BR[4] + 0.2, 3.6, fine); radar(A, 15.0, 1.8, BR[4] + 0.2, 2.6, fine)
        # the free-fall boat on her ramp over the stern, on the first house deck's roof
        freefall(A, 2.6, 0.0, ZH[1] + 2.2, 7.6, 2.7, 3.0, math.radians(-32), fine)
        # the rescue boat (to starboard) and the liferafts (each side) by the house
        capsule(A, (13.0, -(B / 2 - 1.6), ZH[1] + 0.7), 5.0, 2.0, 1.2, C['orange'], n=8, rings=4)
        davits(A, 12.0, 14.0, -(B / 2 - 0.6), ZH[1], 1.8, -1)
        for sg in (1, -1): raft(A, 7.0, sg * (B / 2 - 0.9), ZH[1]); raft(A, 9.0, sg * (B / 2 - 0.9), ZH[1])
        # the main deck's rails, the forecastle's mooring winches, the windlass and the hawses, the after deck's winches
        for sg in (1, -1):
            pts = [(H.x(u, D), sg * (H.hw(u, D) - 0.15)) for u in [i / 40 for i in range(41)] if 0.19 <= u <= 0.85]
            rail(A, pts, D, 1.0, C['sup'])
            abox(A, 84.0, 85.6, sg * 1.2 - 0.6, sg * 1.2 + 0.6, D + FC, D + FC + 0.9, C['steel'])            # the windlass' gypsies
            abox(A, 86.5, 88.0, sg * (H.hw(0.97, D + 1.0) - 0.05) - 0.35, sg * (H.hw(0.97, D + 1.0) - 0.05) + 0.35, D - 0.4, D + 0.6, C['dark'])   # (the hawse's dark pocket)
            abox(A, 18.0, 19.4, sg * 3.0 - 0.6, sg * 3.0 + 0.6, D, D + 0.9, C['steel'])
        abox(A, 77.0, 78.0, -4.0, 4.0, D, D + 2.0, C['steel'])                            # the forecastle's foot (stores)
        place_lights(A, H, {k: v for k, v in LT.items() if k in ('masthead', 'masthead2', 'stern')}, fine)
        for k in ('port', 'stbd'): side_light(A, LT[k][0], LT[k][1], LT[k][2], 1 if k == 'port' else -1)
        rubbing_strake(A, H, R, U, D - 0.6, C['hull'], d=0.12, h=0.22)
    else:
        freefall(A, 2.6, 0.0, ZH[1] + 2.2, 7.6, 2.7, 3.0, math.radians(-32), fine)
    G = []; tiny_glass(G)
    return [hull, A.done(35)], G

def anchors():
    tg, _ = to_game_f(H)
    return {'lights': lights_game(H, LT), 'win': [[round(v, 2) for v in tg(p)] for p in WIN], 'winLit': 0.6, 'skipperAt': [round(v, 3) for v in tg((BR[1] - 2.0, 0.0, BR[3]))],
            'deck': {'y': round(D - T, 3), 'z': 0.0}, 'gw': round(D + 1.0 - T, 3), 'stern': L / 2, 'bow': -L / 2, 'side': H.HB, 'beam': B,
            'open': False, 'hand': False, 'ship': True}

def check():
    ok = [True]
    def say(good, txt):
        ok[0] = ok[0] and good; print(('OK   ' if good else 'FEIL ') + T_ID + ': ' + txt)
    top = D + FC + 0.2
    say(abs(H.x(1.0, top) - H.x(0.0, top) - L) < 0.05, 'lengde over alt %.2f m (modellens %.1f)' % (H.x(1.0, top) - H.x(0.0, top), L))
    say(abs(2 * H.hw(0.5, D) - B) < 0.05, 'bredde %.2f m (modellens %.1f)' % (2 * H.hw(0.5, D), B))
    v = volume(H); say(0.68 < v / (L * B * T) < 0.80, 'deplasement %.0f t (Cb %.2f; et stykkgodsskip har Cb 0,70-0,78, antatt)' % (v * 1.025, v / (L * B * T)))
    say(HOLDS[0][0] > HOUSE[0][1] and HOLDS[-1][1] < 0.855 * L, 'lukene mellom huset (%.1f m) og bakken (%.1f m)' % (HOUSE[0][1], 0.855 * L))
    say(all(HOLDS[i][1] + 1.2 < CRANES[i] < HOLDS[i + 1][0] - 1.2 for i in range(2)), 'kranene står mellom lukene, klar av karmene')
    check_lights(H, LT, D, say)
    return ok[0]

if __name__ == '__main__':
    run(sys.modules[__name__])
