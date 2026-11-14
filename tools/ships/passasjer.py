"""The passenger ferry (Ø15 N7, steg 36): a monohull for the game's local passenger ferries (core/05b-ferje.js FERJE_SIZE[2]: 19.9 × 6.5
and 28.0 × 8.0 m; the model is the bigger one, the smaller is it scaled by drawNPC). A raked stem and a transom, a saloon deckhouse
amidships with its windows, the wheelhouse on top of its forward end, an open foredeck for goods (a small crane), an after deck with seats
under the sky, the mast with the masthead light forward of the wheelhouse.
The type that gave the arrangement: the Norwegian local passenger boats of 20-30 m (some 50-150 passengers, 12-18 knots) that call at the
islands; no boat is copied, and no name, owner or mark is on her (CLAUDE.md, valg 2 A). Measures: the game's own (L, B, T); the depth
and the house assumed from the type (A).

    python3.11 tools/ships/passasjer.py fast dry | check | fast export   (shiplib.py's docstring)
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from shiplib import *

T_ID = 'ship-passasjer'; NAME = 'Passasjerferje (28 m)'
COLOURS = ((0.90, 0.90, 0.88), (0.07, 0.12, 0.24), (0.94, 0.94, 0.92))
L, B, T, D = 28.0, 8.0, 2.4, 3.7
H = Hull(dict(L=L, B=B, T=T,
              stem=[(0.0, 24.6), (T, 26.4), (D, 27.4), (D + 0.4, 28.0)], stern=[(0.0, 1.2), (T, 0.3), (D + 0.4, 0.0)],
              keel=[(0.0, 1.0), (0.12, 0.25), (0.3, 0.0), (0.72, 0.0), (0.9, 0.35), (1.0, 1.4)],
              deck=[(0.0, D), (0.6, D), (1.0, D + 0.5)],
              fore=(0.5, 1.6, 2.4, 0.0), aft=(0.12, 1.6, 2.6, 0.78),
              p=[(0.0, 2.2), (0.4, 2.4), (0.8, 2.0), (1.0, 1.6)], flare=0.09,
              bands=[(T + 0.2, 'af'), (T + 0.45, 'boot'), (D - 0.45, 'hull'), (None, 'band')]))
SAL = (5.5, 20.5, B / 2 - 0.55, D, D + 2.5)              # the saloon: x0, x1, half-width, floor, roof
WH = (15.2, 20.3, 2.3, D + 2.5, D + 4.6)                   # the wheelhouse on its forward end
XM = 21.6                                                  # the mast on the foredeck's after end
LT = {'masthead': (XM, 0.0, D + 8.2), 'port': (19.4, WH[2] + 0.12, WH[3] + 1.2), 'stbd': (19.4, -WH[2] - 0.12, WH[3] + 1.2), 'stern': (0.3, 0.0, D + 1.4)}
WIN = []

def build(fine=True):
    del WIN[:]
    hull, R, U = build_hull(H, fine)
    A = Acc('ship'); seg = 3 if fine else 1
    deck_surface(A, H, R, U, C['deck'])
    bulwark(A, H, R, U, 1.0, C['hull'], C['sup'], 0.0, 1.0)
    pl = rrect(SAL[0], SAL[1], -SAL[2], SAL[2], 1.2, 0.5, seg)
    prism(A, pl, SAL[3], SAL[4], C['sup'], C['roof'])
    if fine: windows(A, pl, SAL[3] + 0.95, SAL[4] - 0.45, C['win'], every=1.35, w=1.1, margin=0.5, lit=WIN)
    else: band(A, pl, SAL[3] + 0.95, SAL[4] - 0.45, C['win'])
    wheelhouse(A, WH[0], WH[1], WH[2], WH[3], WH[4], wing=0.0, fine=fine, both=False, lit=WIN)
    if fine:
        mast(A, XM, 0.0, D + 0.1, LT['masthead'][2] + 0.4, 0.09, C['sup'], fine, yard=0.6)
        radar(A, (WH[0] + WH[1]) / 2, 0.0, WH[4] + 0.18, 2.2, fine)
        # the small goods crane on the foredeck, folded
        acyl(A, (24.0, 0.0, H.zd(24.0 / L)), (24.0, 0.0, H.zd(24.0 / L) + 1.4), 0.22, lambda z: C['band'], seg=8)
        beam(A, (24.0, 0.0, H.zd(24.0 / L) + 1.4), (21.0, 0.0, H.zd(24.0 / L) + 0.9), 0.22, 0.26, C['band'])
        parapet(A, [(SAL[0] + 0.6, SAL[2] - 0.1), (WH[0] - 0.3, SAL[2] - 0.1), (WH[0] - 0.3, -SAL[2] + 0.1), (SAL[0] + 0.6, -SAL[2] + 0.1)], SAL[4], 0.7, C['sup'])
        for x in (8.0, 11.0): raft(A, x, 0.0, SAL[4])
        acyl(A, (0.3, 0.0, D + 0.1), (0.3, 0.0, D + 1.3), 0.05, lambda z: C['steel'], seg=6)
        place_lights(A, H, LT, fine)
        rubbing_strake(A, H, R, U, D - 0.5, C['rubber'], d=0.15, h=0.22)
    G = []; tiny_glass(G)
    return [hull, A.done(35)], G

def anchors():
    tg, _ = to_game_f(H)
    return {'lights': lights_game(H, LT), 'win': [[round(v, 2) for v in tg(p)] for p in WIN], 'skipperAt': [round(v, 3) for v in tg((WH[1] - 1.3, 0.0, WH[3]))],
            'deck': {'y': round(D - T, 3), 'z': 0.0}, 'gw': round(D + 1.0 - T, 3), 'stern': L / 2, 'bow': -L / 2, 'side': B / 2, 'beam': B,
            'open': False, 'hand': False, 'ship': True}

def check():
    ok = [True]
    def say(good, txt):
        ok[0] = ok[0] and good; print(('OK   ' if good else 'FEIL ') + T_ID + ': ' + txt)
    say(abs(H.x(1.0, D + 0.5) - H.x(0.0, D + 0.5) - L) < 0.3, 'lengde over alt %.2f m (spillets %.1f)' % (H.x(1.0, D + 0.4) - H.x(0.0, D + 0.4), L))
    say(abs(2 * H.hw(0.5, D) - B) < 0.05, 'bredde %.2f m (spillets %.1f)' % (2 * H.hw(0.5, D), B))
    v = volume(H); say(150 < v * 1.025 < 300, 'deplasement %.0f t (Cb %.2f; en passasjerbåt på 28 m med spillets dypgående 2,4 m: 150-300 t, antatt)' % (v * 1.025, v / (L * B * T)))
    check_lights(H, LT, D, say)
    return ok[0]

if __name__ == '__main__':
    run(sys.modules[__name__])
