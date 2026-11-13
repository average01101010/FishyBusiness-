"""The motor boat (Ø15 N7, steg 36; her traffic is N6, steg 38, the summer's leisure boats): a 25 ft cabin boat of the kind that fills
the small boat harbours, 7.6 × 2.6 × 0.42 m (each boat in the game is the model scaled to her own length and beam). A fine planing bow,
the small cabin forward with its side windows and the windscreen, the hardtop over the helm, the open cockpit aft with its seats, the
outboard on the transom, the pulpit at the bow, the all-round light's pole on the cabin's roof, the sidelights on the cabin's sides.
The type that gave the arrangement: the Nordic 22-27 ft cabin and day boats with an outboard; no boat is copied, and no maker's name or
mark is on her (CLAUDE.md). Measures assumed from the type (A). fisklib.py has the helpers the small boats share.

    python3.11 tools/ships/fritid.py fast dry | check | fast export   (shiplib.py's docstring)
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fisklib import *

T_ID = 'ship-fritid'; NAME = 'Fritidsbåt (25 fot)'
COLOURS = ((0.93, 0.93, 0.91), (0.10, 0.22, 0.45), (0.95, 0.95, 0.93))
L, B, T, D = 7.6, 2.6, 0.42, 1.15
H = Hull(dict(L=L, B=B, T=T,
              stem=[(0.0, 6.7), (T, 7.15), (D + 0.35, L)], stern=[(0.0, 0.2), (T, 0.08), (D + 0.35, 0.0)],
              keel=[(0.0, 0.3), (0.3, 0.0), (0.8, 0.05), (1.0, 0.55)],
              deck=[(0.0, D), (0.6, D + 0.05), (1.0, D + 0.35)],
              fore=(0.5, 1.5, 2.4, 0.0), aft=(0.08, 1.4, 2.0, 0.86),
              p=[(0.0, 1.15), (0.5, 1.3), (1.0, 1.1)], flare=0.12,
              bands=[(T + 0.05, 'af'), (T + 0.22, 'band'), (None, 'hull')]))
CAB = (3.7, 6.3, 0.95, 0.75)                     # the cabin: x0, x1, half-width, height over the deck
HT = (1.9, 3.6, 1.1, 1.95)                       # the hardtop: x0, x1, half-width, its roof over the deck
LT = {'masthead': (6.0, 0.0, D + 2.6), 'port': (5.7, CAB[2] + 0.05, D + 0.45), 'stbd': (5.7, -(CAB[2] + 0.05), D + 0.45), 'stern': (0.1, 0.0, D + 0.55)}
WIN = []

def build(fine=True):
    del WIN[:]; more_colours(); C.setdefault('inox', mat('inox', (0.78, 0.80, 0.82), 0.8, zone=0)); C.setdefault('seat', mat('seat', (0.82, 0.80, 0.74), 0.3, zone=0))
    hull, R, U = build_hull(H, fine)
    A = Acc('ship')
    deck_surface(A, H, R, U, C['sup2'])                          # (a leisure boat's deck: white, non-slip)
    # the cabin, its windows, the windscreen, the hardtop on its posts
    zc = H.zd(0.65); pl = [(CAB[1], -0.45), (CAB[1], 0.45), (CAB[0], CAB[2]), (CAB[0], -CAB[2])]
    prism(A, pl, zc - 0.1, zc + CAB[3], C['sup'], C['sup'])
    if fine:
        for sg in (1, -1): A.poly([(CAB[0] + 0.5, sg * (CAB[2] - 0.1 + 0.03), zc + 0.35), (CAB[1] - 0.6, sg * (0.6 + 0.03), zc + 0.35), (CAB[1] - 0.6, sg * (0.6 + 0.03), zc + 0.6), (CAB[0] + 0.5, sg * (CAB[2] - 0.1 + 0.03), zc + 0.6)], C['win'], (0, sg, 0))
    # the windscreen from the cabin's after edge up to the hardtop's front, leaning back, in its white frame
    zt = D + HT[3]; zw = zc + CAB[3]
    ws = [(CAB[0], -0.98, zw), (CAB[0], 0.98, zw), (HT[1] + 0.02, 1.02, zt), (HT[1] + 0.02, -1.02, zt)]
    A.poly(ws, C['glass'], (1, 0, 0.3)); A.poly(list(reversed(ws)), C['glass'], (-1, 0, -0.3))
    if fine:
        for sg in (1, -1): beam(A, (CAB[0], sg * 1.0, zw), (HT[1] + 0.02, sg * 1.04, zt), 0.05, 0.05, C['sup'])
    abox(A, HT[0], HT[1], -HT[2], HT[2], zt, zt + 0.08, C['sup'])
    for x in (HT[0] + 0.05, ):
        for sg in (1, -1): beam(A, (x, sg * (HT[2] - 0.08), D), (x, sg * (HT[2] - 0.08), zt), 0.06, 0.06, C['inox'], up=(1, 0, 0))
    # the cockpit's seats and the helm console, the outboard on the transom
    abox(A, 0.5, 1.6, -1.0, 1.0, D, D + 0.42, C['seat'])
    abox(A, 2.6, 3.2, -0.9, -0.2, D, D + 0.8, C['sup']); abox(A, 2.6, 3.2, 0.2, 0.9, D, D + 0.45, C['seat'])
    # the outboard: the leg down into the water and the cowl over the transom's top
    abox(A, -0.4, -0.18, -0.1, 0.1, T - 0.55, D + 0.2, C['dark'])
    obox(A, (-0.36, 0.0, D + 0.42), (0.3, 0, 0), (0, 0.24, 0), (0, 0, 0.27), C['black'])
    if fine:
        abox(A, -0.15, 0.0, -0.18, 0.18, D - 0.05, D + 0.2, C['dark'])
        # the pulpit at the bow, the toe rails, the all-round light's pole
        pts = [(H.x(u, H.zd(u)), H.hw(u, H.zd(u)) - 0.05) for u in [0.78 + 0.22 * i / 6 for i in range(7)]]
        rail(A, pts + [(p[0], -p[1]) for p in reversed(pts)], H.zd(0.9), 0.6, C['inox'], t=0.03)
        acyl(A, (LT['masthead'][0], 0.0, zc + CAB[3]), (LT['masthead'][0], 0.0, LT['masthead'][2] - 0.1), 0.025, lambda z: C['inox'], seg=5)
        for k in ('masthead', 'stern'): lamp(A, LT[k], C['lampW'], r=0.05, h=0.1)
        for k in ('port', 'stbd'): lamp(A, LT[k], C['lampR'] if k == 'port' else C['lampG'], r=0.05, h=0.1)
    G = []; tiny_glass(G)
    return [hull, A.done(35)], G

def anchors():
    return fishing_anchors(H, LT, WIN, (2.9, 0.55, D), [(1.0, 0.5, D + 0.42, 3.14), (1.0, -0.5, D + 0.42, 3.14)], D, D)

def check():
    return fishing_check(T_ID, H, LT, D, [(HT[1] < CAB[0], 'hardtoppen bak vindskjermen')], cb=(0.25, 0.45), what='en planende kabinbåt', disp=(1.5, 3.0))

if __name__ == '__main__':
    run(sys.modules[__name__])
