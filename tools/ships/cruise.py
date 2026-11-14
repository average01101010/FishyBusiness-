"""The cruise ship (Ø15 N7, steg 36; her traffic is N5, steg 37, the summer's calls in the fjords): 250.0 × 32.0 × 7.6 m (each ship in
the game is the model scaled to her own length and beam). A white hull over a bulbous bow with two rows of portholes, the promenade
deck with the lifeboats and tenders hanging along both sides under the public rooms' overhang, six decks of balcony cabins stepped back
aft in terraces, the bridge on the forward end of the ninth deck with its wings out over the sides, the pool deck and the sports deck on
top, the big funnel aft, the masts with the masthead lights, open mooring decks at the bow and the stern.
The type that gave the arrangement: the 200-300 m cruise ships that call at Bergen, Geiranger and the north in summer (some 2 000-3 000
passengers, built from the 2000s); no ship is copied, and no name, owner, mark or logo is on her hull or funnel (CLAUDE.md, valg 2 A).
Measures: the type's (L, B, T from that range); the depth, the decks and the house assumed from the type (A).

    python3.11 tools/ships/cruise.py fast dry | check | fast export   (shiplib.py's docstring)
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from shiplib import *

T_ID = 'ship-cruise'; NAME = 'Cruiseskip (250 m)'
COLOURS = ((0.94, 0.94, 0.92), (0.07, 0.12, 0.24), (0.95, 0.95, 0.93))
L, B, T, D = 250.0, 32.0, 7.6, 14.5
H = Hull(dict(L=L, B=B, T=T,
              stem=[(0.0, 240.5), (T, 246.5), (D, 249.0), (D + 2.7, 250.0)], stern=[(0.0, 10.0), (T, 3.0), (D, 0.6), (D + 2.7, 0.0)],
              keel=[(0.0, 6.5), (0.05, 2.5), (0.12, 0.0), (0.92, 0.0), (0.97, 0.5), (1.0, 2.4)],
              deck=[(0.0, D), (0.8, D), (1.0, D + 2.5)],
              fore=(0.6, 1.8, 2.9, 0.0), aft=(0.24, 1.5, 3.0, 0.75),
              p=[(0.0, 2.4), (0.25, 4.0), (0.75, 4.0), (1.0, 2.2)], flare=0.03,
              bands=[(T + 0.3, 'af'), (T + 0.8, 'boot'), (T + 2.0, 'band'), (None, 'hull')]))
HTS = [4.2, 3.4, 3.4, 2.9, 2.9, 2.9, 2.9, 2.9, 2.9, 3.2, 3.0]
ZT = [D]
for h in HTS: ZT.append(ZT[-1] + h)
# the tiers: x0, x1 (the nose's tip), half-width, the nose's length, the after corners' rounding, and the kind of windows
TIERS = [(14.0, 222.0, 12.2, 8.0, 2.0, 'prom'),     # deck 4: the promenade, inset for the lifeboats
         (12.0, 226.0, 16.0, 10.0, 2.0, 'pub'),     # deck 5-6: the public rooms over them
         (12.0, 224.0, 16.0, 10.0, 2.0, 'pub'),
         (16.0, 216.0, 16.0, 9.0, 3.0, 'bal'),      # deck 7-12: the balcony cabins, stepped back aft
         (19.0, 214.0, 16.0, 9.0, 3.0, 'bal'),
         (22.0, 212.0, 16.0, 9.0, 3.0, 'bal'),      # (deck 9: the bridge on its forward end)
         (26.0, 204.0, 16.0, 9.0, 3.0, 'bal'),
         (30.0, 201.0, 16.0, 9.0, 3.0, 'bal'),
         (34.0, 198.0, 16.0, 9.0, 3.0, 'bal'),
         (40.0, 190.0, 12.0, 6.0, 4.0, 'top'),      # deck 13: the pool deck's house
         (80.0, 170.0, 9.0, 4.0, 3.0, 'top')]       # deck 14: the sports deck's
BRI = 5                                              # the tier with the bridge
WG = 17.6                                            # the wings' reach from the centre line
BOATS = [70.0 + 12.5 * i for i in range(10)]
BL, BWD, BH, YB = 11.0, 3.8, 3.4, 14.3
XF = 62.0
xb = TIERS[BRI][1]
LT = {'masthead': (xb - 3.0, 0.0, ZT[9] + 2.1), 'masthead2': (88.0, 0.0, ZT[11] + 4.0),
      'port': (xb - 3.4, WG - 0.1, ZT[BRI] + 1.2), 'stbd': (xb - 3.4, -(WG - 0.1), ZT[BRI] + 1.2), 'stern': (0.8, 0.0, D + 1.4)}
WIN = []

def build(fine=True):
    del WIN[:]
    C.setdefault('pool', mat('pool', (0.20, 0.55, 0.70), 0.9, zone=4))
    hull, R, U = build_hull(H, fine)
    A = Acc('ship')
    deck_surface(A, H, R, U, C['deck'])
    bulwark(A, H, R, U, 1.2, C['hull'], C['sup'], 0.88, 1.0)
    capsule(A, (L - 5.5, 0.0, 3.6), 11.0, 4.6, 4.6, C['af'], n=12 if fine else 6, rings=8 if fine else 3)
    if fine:
        hull_windows(A, H, 22.0, 232.0, 9.4, 10.2, 3.2, 0.7, C['win'], WIN, 2)
        hull_windows(A, H, 18.0, 234.0, 11.8, 12.9, 3.2, 1.3, C['win'], WIN, 1)
    else:
        for z0, z1 in ((9.4, 10.2), (11.8, 12.9)):
            for sg in (1, -1): A.poly([(22.0, sg * (H.HB + 0.03), z0), (230.0, sg * (H.HB + 0.03), z0), (230.0, sg * (H.HB + 0.03), z1), (22.0, sg * (H.HB + 0.03), z1)], C['win'], (0, sg, 0))
    for i, (x0, x1, hw, nose, ra, kind) in enumerate(TIERS):
        z0, z1 = ZT[i], ZT[i + 1]
        pl = bowfront(x0, x1 - nose, -hw, hw, nose, 8 if fine else 3)
        prism(A, pl, z0, z1, C['sup'], C['roof'], bottom=(i == 1))
        n = len(pl); fronts = list(range(1, n - 1))
        if i == BRI:   # the bridge's windows round the nose, the cabins' along the sides behind it
            if fine:
                windows(A, pl, z0 + 1.1, z1 - 0.35, C['winB'], every=1.4, w=1.25, margin=0.2, lit=WIN, litk=3, edges=fronts)
                windows(A, pl, z0 + 0.9, z1 - 0.3, C['win'], every=3.0, w=2.6, margin=1.0, lit=WIN, edges=[0, n - 1])
            else:
                band(A, pl, z0 + 1.1, z1 - 0.35, C['winB'], edges=fronts); band(A, pl, z0 + 0.9, z1 - 0.3, C['win'], edges=[0, n - 1])
            continue
        if kind == 'prom': ev, w, a, b = 2.6, 2.0, 0.9, 3.0
        elif kind == 'pub': ev, w, a, b = 3.6, 3.2, 0.6, 2.9
        elif kind == 'bal': ev, w, a, b = 3.0, 2.6, 0.9, 2.6
        else: ev, w, a, b = 2.5, 2.0, 0.8, 2.4
        if fine: windows(A, pl, z0 + a, z0 + b, C['win'], every=ev, w=w, margin=1.0, lit=WIN)
        else: band(A, pl, z0 + a, z0 + b, C['win'])
        if fine and kind == 'bal':   # the balconies' glass fronts: a pale band along the sides in front of the cabins' windows
            for sg in (1, -1):
                y = sg * (hw + 0.45)
                A.poly([(x0 + 3.0, y, z0 + 0.05), (x1 - nose - 1.0, y, z0 + 0.05), (x1 - nose - 1.0, y, z0 + 1.05), (x0 + 3.0, y, z0 + 1.05)], C['glass'], (0, sg, 0))
                A.poly([(x0 + 3.0, sg * hw, z0 + 0.02), (x1 - nose - 1.0, sg * hw, z0 + 0.02), (x1 - nose - 1.0, y, z0 + 0.02), (x0 + 3.0, y, z0 + 0.02)], C['sup2'], (0, 0, 1))
    # the bridge's wings out over the sides
    for sg in (1, -1):
        y0, y1 = sorted((sg * TIERS[BRI][2], sg * WG))
        prism(A, rrect(xb - 4.0, xb - 0.2, y0, y1), ZT[BRI] + 0.0, ZT[BRI] + 2.5, C['sup'], C['roof'], bottom=True)
        if fine: band(A, rrect(xb - 4.0, xb - 0.2, y0, y1), ZT[BRI] + 1.2, ZT[BRI] + 2.2, C['winB'], edges=[0, 1] if sg > 0 else [0, 3])
    # the lifeboats along the sides on the promenade deck, under the public rooms' overhang
    for x in BOATS:
        for sg in (1, -1):
            capsule(A, (x, sg * YB, ZT[0] + 0.4 + BH / 2), BL, BWD, BH, C['orange'], n=10 if fine else 6, rings=6 if fine else 2, roofm=C['orange'] if fine else None)
            if fine: davits(A, x - BL / 2 + 1.4, x + BL / 2 - 1.4, sg * (YB - 1.2), ZT[0], BH + 0.5, sg)
    # the funnel aft on the pool deck, the masts, the radars
    funnel(A, XF, 0.0, ZT[10], ZT[10] + 10.0, 16.0, 7.0, C['sup'], C['band'], rake=0.12, fine=fine)
    mast(A, LT['masthead'][0], 0.0, ZT[BRI + 1], LT['masthead'][2] + 0.6, 0.25, C['sup'], fine, yard=2.0)
    mast(A, LT['masthead2'][0], 0.0, ZT[11], LT['masthead2'][2] + 0.6, 0.22, C['sup'], fine, yard=1.6)
    if fine:
        radar(A, xb - 6.0, 3.0, ZT[BRI + 1] + 0.2, 4.5, fine); radar(A, xb - 6.0, -3.0, ZT[BRI + 1] + 0.2, 4.5, fine)
        # the pool deck: two pools and the glass wind screens round the open deck
        abox(A, 110.0, 126.0, -6.0, 6.0, ZT[10], ZT[10] + 0.12, C['pool']); abox(A, 140.0, 150.0, -5.0, 5.0, ZT[10], ZT[10] + 0.12, C['pool'])
        for sg in (1, -1):
            parapet(A, [(42.0, sg * 11.8), (186.0, sg * 11.8)], ZT[10], 1.4, C['glass'])
            parapet(A, [(36.0, sg * 15.8), (194.0, sg * 15.8)], ZT[9], 1.2, C['sup'])
            abox(A, 238.0, 240.0, sg * 3.0 - 1.0, sg * 3.0 + 1.0, H.zd(239.0 / L), H.zd(239.0 / L) + 1.0, C['steel'])
            abox(A, 4.0, 6.0, sg * 5.0 - 0.8, sg * 5.0 + 0.8, D, D + 0.9, C['steel'])
            yh = H.hw(0.975, D + 0.6)
            abox(A, 243.5, 245.0, sg * (yh - 0.05) - 0.5, sg * (yh - 0.05) + 0.5, D - 1.0, D + 0.3, C['dark'])
        rail(A, [(1.0, B / 2 - 1.0), (1.0, -B / 2 + 1.0)], D, 1.1, C['sup'])
        place_lights(A, H, {k: v for k, v in LT.items() if k in ('masthead', 'masthead2', 'stern')}, fine)
        for k in ('port', 'stbd'): side_light(A, LT[k][0], LT[k][1], LT[k][2], 1 if k == 'port' else -1)
        rubbing_strake(A, H, R, U, D - 0.8, C['hull'], d=0.12, h=0.25)
    G = []; tiny_glass(G)
    return [hull, A.done(35)], G

def anchors():
    tg, _ = to_game_f(H)
    return {'lights': lights_game(H, LT), 'win': [[round(v, 2) for v in tg(p)] for p in WIN], 'winLit': 0.7, 'skipperAt': [round(v, 3) for v in tg((xb - 3.0, 0.0, ZT[BRI]))],
            'deck': {'y': round(D - T, 3), 'z': 0.0}, 'gw': round(D + 1.1 - T, 3), 'stern': L / 2, 'bow': -L / 2, 'side': H.HB, 'beam': B,
            'open': False, 'hand': False, 'ship': True}

def check():
    ok = [True]
    def say(good, txt):
        ok[0] = ok[0] and good; print(('OK   ' if good else 'FEIL ') + T_ID + ': ' + txt)
    top = D + 2.7
    say(abs(H.x(1.0, top) - H.x(0.0, top) - L) < 0.05, 'lengde over alt %.2f m (modellens %.1f)' % (H.x(1.0, top) - H.x(0.0, top), L))
    say(abs(2 * H.hw(0.5, D) - B) < 0.05, 'bredde %.2f m (modellens %.1f)' % (2 * H.hw(0.5, D), B))
    v = volume(H); say(0.62 < v / (L * B * T) < 0.72, 'deplasement %.0f t (Cb %.2f; et cruiseskip har Cb rundt 0,65-0,72, antatt)' % (v * 1.025, v / (L * B * T)))
    say(len(TIERS) >= 10, '%d dekk overbygg over skroget' % len(TIERS))
    say(YB - BWD / 2 > TIERS[0][2] and ZT[0] + 0.4 + BH < ZT[1], 'livbåtene klar av promenadedekket og under overhenget (topp %.1f m, dekket over %.1f)' % (ZT[0] + 0.4 + BH, ZT[1]))
    say(TIERS[BRI + 1][1] < LT['masthead'][0] - 0.5 < xb, 'den forre masta står på broas tak, foran dekket over')
    check_lights(H, LT, D, say)
    return ok[0]

if __name__ == '__main__':
    run(sys.modules[__name__])
