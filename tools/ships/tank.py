"""The tanker (Ø15 N7, steg 36; her traffic is N5, steg 37): a product and chemical tanker of the kind that supplies the coast with fuel,
145.0 × 23.0 × 8.5 m (each ship in the game is the model scaled to her own length and beam). A raked stem over a bulbous bow, a short
forecastle with the foremast, a long flush tank deck with its pipes, the catwalk on the centre line, the tank hatches in rows and the
manifold amidships with the hose crane, the house aft (four decks and the bridge with its wings), the funnel on its after end, the
free-fall lifeboat on her ramp over the stern.
The type that gave the arrangement: the 120-180 m product and chemical tankers of the North Sea and the coast (some 10 000-25 000 dwt,
built from the 2000s); no ship is copied, and no name, owner, mark or logo is on her hull or funnel (CLAUDE.md, valg 2 A 05.11.2026).
Measures: the type's (L, B, T from that range); the depth, the house and the deck's fittings assumed from the type (A).

    python3.11 tools/ships/tank.py fast dry | check | fast export   (shiplib.py's docstring)
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from shiplib import *

T_ID = 'ship-tank'; NAME = 'Tankskip (145 m)'
COLOURS = ((0.50, 0.11, 0.10), (0.07, 0.12, 0.24), (0.93, 0.93, 0.91))
L, B, T, D = 145.0, 23.0, 8.5, 12.5
FC = 2.6
H = Hull(dict(L=L, B=B, T=T,
              stem=[(0.0, 139.0), (T, 143.0), (D, 144.2), (D + FC + 0.2, 145.0)], stern=[(0.0, 7.0), (T, 2.2), (D, 0.5), (D + FC + 0.2, 0.0)],
              keel=[(0.0, 5.0), (0.05, 2.0), (0.13, 0.0), (0.93, 0.0), (0.975, 0.4), (1.0, 2.0)],
              deck=[(0.0, D), (0.88, D), (0.905, D + FC), (1.0, D + FC + 0.2)],
              fore=(0.78, 1.8, 3.4, 0.0), aft=(0.18, 1.6, 3.6, 0.6),
              p=[(0.0, 2.6), (0.22, 5.0), (0.78, 5.0), (1.0, 2.4)], flare=0.02,
              bands=[(T + 0.4, 'af'), (T + 1.0, 'boot'), (None, 'hull')]))
HT = 2.8
HOUSE = [(2.0, 24.0, B / 2 - 0.4), (3.0, 22.0, 9.5), (3.5, 22.0, 9.5), (4.0, 22.0, 9.5)]
ZH = [D + HT * i for i in range(len(HOUSE) + 1)]
BR = (13.0, 22.0, 9.5, ZH[-1], ZH[-1] + 2.9)
XM = 76.0                                                                        # the manifold amidships
XF = 7.0
LT = {'masthead': (140.0, 0.0, D + 17.0), 'masthead2': (16.0, 0.0, D + 21.6),
      'port': (21.0, B / 2 - 0.15, BR[3] + 1.2), 'stbd': (21.0, -(B / 2 - 0.15), BR[3] + 1.2), 'stern': (1.6, 0.0, D + 1.6)}
WIN = []

def build(fine=True):
    del WIN[:]
    C['deck'] = mat('deckG', (0.27, 0.40, 0.31), 0.25, zone=4)                 # (a tanker's green deck)
    hull, R, U = build_hull(H, fine)
    A = Acc('ship')
    deck_surface(A, H, R, U, C['deck'])
    bulwark(A, H, R, U, 1.1, C['hull'], C['sup'], 0.9, 1.0)
    capsule(A, (L - 5.2, 0.0, 3.8), 10.5, 4.2, 4.8, C['af'], n=12 if fine else 6, rings=8 if fine else 3)
    xs = 0.895 * L
    abox(A, xs - 0.3, xs, -H.hw(0.895, D) + 0.05, H.hw(0.895, D) - 0.05, D, D + FC, C['hull'])
    # the deck: the catwalk on the centre line on its posts, the pipes along the deck, the tank hatches and the manifold amidships
    x0d, x1d = HOUSE[0][1] + 0.5, xs - 0.6
    if fine:
        beam(A, (x0d, 0.0, D + 2.3), (x1d, 0.0, D + 2.3), 1.0, 0.15, C['sup'])
        rail(A, [(x0d, 0.5), (x1d, 0.5)], D + 2.3, 1.0, C['sup']); rail(A, [(x0d, -0.5), (x1d, -0.5)], D + 2.3, 1.0, C['sup'])
        x = x0d + 1.0
        while x < x1d: beam(A, (x, 0.0, D), (x, 0.0, D + 2.3), 0.22, 0.22, C['sup'], up=(1, 0, 0)); x += 6.0
        for y, r in ((1.6, 0.25), (2.4, 0.2), (-1.6, 0.25), (-2.4, 0.2), (3.4, 0.15), (-3.4, 0.15)):
            acyl(A, (x0d, y, D + 0.9), (x1d, y, D + 0.9), r, lambda z: C['steel'], seg=6, cap=False)
        for k in range(10):
            xh = x0d + 6.0 + k * (x1d - x0d - 12.0) / 9
            for y in (5.0, -5.0):
                acyl(A, (xh, y, D), (xh, y, D + 0.7), 0.55, lambda z: C['deck'], seg=8)
                abox(A, xh - 0.4, xh + 0.4, y - 0.4, y + 0.4, D + 0.7, D + 0.95, C['steel'])
            if k % 3 == 1:
                for y in (8.0, -8.0): acyl(A, (xh, y, D), (xh, y, D + 2.6), 0.15, lambda z: C['band'], seg=6)   # (the vent posts)
        # the manifold: pipes across to both sides, its platform, and the hose crane to starboard
        for k in range(4):
            xx = XM - 2.4 + k * 1.6
            acyl(A, (xx, -B / 2 + 1.2, D + 1.3), (xx, B / 2 - 1.2, D + 1.3), 0.22, lambda z: C['steel'], seg=6)
        abox(A, XM - 3.4, XM + 3.4, -B / 2 + 0.8, B / 2 - 0.8, D + 2.0, D + 2.15, C['steel'])
        deck_crane(A, XM + 4.6, -(B / 2 - 2.6), D, 3.4, 14.0, math.pi * 0.9, C['sup'], C['sup'], fine, rest=D + 3.0)
        for sg in (1, -1):
            pts = [(H.x(u, D), sg * (H.hw(u, D) - 0.15)) for u in [i / 50 for i in range(51)] if 0.17 <= u <= 0.89]
            rail(A, pts, D, 1.0, C['sup'])
            abox(A, 136.0, 138.0, sg * 1.8 - 0.8, sg * 1.8 + 0.8, D + FC, D + FC + 1.1, C['steel'])
            yh = H.hw(0.975, D + 1.0)
            abox(A, 139.5, 141.0, sg * (yh - 0.05) - 0.45, sg * (yh - 0.05) + 0.45, D - 0.6, D + 0.6, C['dark'])
    else:
        beam(A, (x0d, 0.0, D + 2.3), (x1d, 0.0, D + 2.3), 1.0, 0.15, C['sup'])
        abox(A, XM - 3.4, XM + 3.4, -B / 2 + 0.8, B / 2 - 0.8, D + 1.0, D + 2.15, C['steel'])
    # the house aft and the bridge
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
        abox(A, BR[1] - 3.4, BR[1], y0, y1, BR[3] - 0.25, BR[3], C['sup'])
        if fine:
            rail(A, [(BR[1] - 3.4, sg * (B / 2 - 0.1)), (BR[1], sg * (B / 2 - 0.1))], BR[3], 1.1, C['sup'])
            abox(A, BR[1] - 0.15, BR[1], y0, y1, BR[3], BR[3] + 1.1, C['sup'])
    abox(A, BR[0] - 0.1, BR[1] + 0.4, -BR[2] - 0.2, BR[2] + 0.2, BR[4], BR[4] + 0.2, C['sup'])
    funnel(A, XF, 0.0, ZH[-1], ZH[-1] + 6.0, 5.0, 4.2, C['band'], C['black'], rake=0.15, fine=fine)   # (plain dark blue, no mark)
    mast(A, LT['masthead'][0], 0.0, D + FC, LT['masthead'][2] + 0.5, 0.22, C['sup'], fine, yard=1.4)
    mast(A, LT['masthead2'][0], 0.0, BR[4], LT['masthead2'][2] + 0.5, 0.18, C['sup'], fine, yard=2.0)
    freefall(A, 3.0, 0.0, ZH[1] + 2.5, 8.6, 3.0, 3.3, math.radians(-32), fine)
    if fine:
        radar(A, 15.0, 0.0, BR[4] + 0.2, 4.2, fine); radar(A, 19.5, 2.5, BR[4] + 0.2, 3.0, fine)
        capsule(A, (18.0, -(B / 2 - 1.6), ZH[1] + 0.7), 5.4, 2.1, 1.3, C['orange'], n=8, rings=4)
        davits(A, 17.0, 19.0, -(B / 2 - 0.6), ZH[1], 1.9, -1)
        for sg in (1, -1):
            for x in (9.0, 11.0): raft(A, x, sg * (B / 2 - 0.9), ZH[1])
            abox(A, 26.0, 27.6, sg * 4.0 - 0.7, sg * 4.0 + 0.7, D, D + 1.0, C['steel'])
        place_lights(A, H, {k: v for k, v in LT.items() if k in ('masthead', 'masthead2', 'stern')}, fine)
        for k in ('port', 'stbd'): side_light(A, LT[k][0], LT[k][1], LT[k][2], 1 if k == 'port' else -1)
        rubbing_strake(A, H, R, U, D - 0.7, C['hull'], d=0.12, h=0.25)
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
    v = volume(H); say(0.74 < v / (L * B * T) < 0.84, 'deplasement %.0f t (Cb %.2f; et produkttankskip har Cb 0,76-0,82, antatt)' % (v * 1.025, v / (L * B * T)))
    say(D - T >= 3.5, 'fribord %.1f m (lastelinja for tankskip: rundt 3-4 m for lengden, antatt)' % (D - T))
    check_lights(H, LT, D, say)
    return ok[0]

if __name__ == '__main__':
    run(sys.modules[__name__])
