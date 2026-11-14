"""The coastal route's ship (Ø15 N7, steg 36): the game's coastal ships (core/05b-ferje.js KYST_SIZE: 121.8 × 21.0, 135.8 × 21.5 and
123.3 × 19.2 m; the model is 125.0 × 21.0 × 4.9 m, each ship is it scaled to her own length and beam by drawNPC). A bulbous bow under a raked
stem, a dark hull with two rows of cabin windows, eight decks of white superstructure stepped back aft, the lifeboats in their davits along
both sides under the overhang, the bridge forward with its wings, a panorama lounge over it, the funnel aft, the masts with the masthead
lights (two: the forward lower), a crane on the foredeck and the side port for goods and cars.
The type that gave the arrangement: the Norwegian coastal route ships of 120-136 m built from the 1990s; no ship is copied, and no name,
owner, mark or logo is on her or her funnel (CLAUDE.md, valg 2 A 05.11.2026: made-up names on every vessel, also the coastal route's).
Measures: the game's own (L, B, T); the depth, the decks' heights and the house assumed from the type (A).

    python3.11 tools/ships/kystrute.py fast dry | check | fast export   (shiplib.py's docstring)
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from shiplib import *

T_ID = 'ship-kystrute'; NAME = 'Kystruteskip (125 m)'
COLOURS = ((0.06, 0.10, 0.20), (0.70, 0.10, 0.09), (0.94, 0.94, 0.92))
L, B, T, D = 125.0, 21.0, 4.9, 10.0
H = Hull(dict(L=L, B=B, T=T,
              stem=[(0.0, 117.0), (T, 120.2), (D, 123.4), (12.6, 125.0)], stern=[(0.0, 4.0), (T, 1.2), (D, 0.3), (12.6, 0.0)],
              keel=[(0.0, 2.6), (0.07, 0.9), (0.18, 0.0), (0.86, 0.0), (0.95, 0.35), (1.0, 1.6)],
              deck=[(0.0, D), (0.6, D), (0.86, D + 0.6), (1.0, 12.6)],
              fore=(0.55, 1.7, 2.8, 0.0), aft=(0.16, 1.7, 3.2, 0.6),
              p=[(0.0, 2.3), (0.3, 3.0), (0.7, 3.0), (1.0, 2.0)], flare=0.04,
              bands=[(T + 0.35, 'af'), (T + 0.8, 'boot'), (None, 'hull')]))
HT = 2.9                                    # a deck's height
# the tiers over the hull: (x0, x1, half-width, front's nose, aft's rounding, windows: (every, width, z0 over the deck, z1), bottom shown)
TIERS = [
    (13.0, 111.0, B / 2 - 0.3, 5.0, 1.0, (2.6, 1.5, 0.95, 2.15)),     # deck 5 (A): cabins; its roof is the lifeboats' deck
    (17.0, 105.0, 7.5, 4.0, 1.5, (2.2, 1.6, 0.85, 2.2)),              # deck 6 (B): the saloons, inset over the lifeboats
    (19.0, 104.0, 9.2, 4.5, 1.5, (2.6, 1.5, 0.95, 2.15)),             # deck 7 (C): cabins, out over the lifeboats again
    (24.0, 101.0, 8.9, 4.5, 2.0, (2.6, 1.5, 0.95, 2.15)),             # deck 8 (D): cabins
    (30.0, 92.0, 8.4, 2.0, 2.0, (2.6, 1.5, 0.95, 2.15)),              # deck 9 (E): cabins (the bridge on its forward end, below)
    (52.0, 97.0, 7.0, 3.5, 2.0, (1.9, 1.7, 0.4, 2.5)),                # deck 10 (F): the panorama lounge, glass all round
    (64.0, 86.0, 5.0, 1.5, 1.5, (2.4, 1.4, 0.9, 2.0)),                # deck 11 (G): the sun deck's house
    (70.0, 81.0, 3.4, 1.0, 1.0, (2.2, 1.3, 0.8, 1.8)),                # deck 12 (H): the observation deck's house over it
]
HTS = [HT, 3.4, HT, HT, HT, 3.1, 2.6, 2.4]                            # (deck 6 higher: the lifeboats hang under deck 7)
ZT = [D + 0.0]
for h in HTS: ZT.append(ZT[-1] + h)
BR = (92.0, 101.0, 8.0, ZT[4], ZT[5])                                 # the bridge: x0, x1, half-width, floor, roof (deck 9's level)
BOATS = [46.0, 58.0, 70.0]                                            # the lifeboats' middles along each side
BL, BWD, BH = 9.5, 3.3, 2.8
YB = B / 2 - 1.15                                                     # their middles out from the centre line
XF, ZF0, ZF1 = 40.0, ZT[5], ZT[5] + 9.0                               # the funnel
LT = {'masthead': (99.0, 0.0, ZT[5] + 5.5), 'masthead2': (33.0, 0.0, ZT[5] + 11.0),
      'port': (98.4, BR[2] + 2.6 + 0.1, BR[3] + 1.4), 'stbd': (98.4, -(BR[2] + 2.6 + 0.1), BR[3] + 1.4), 'stern': (0.6, 0.0, D + 1.6)}
WIN = []

def hull_windows(A, x0, x1, z0, z1, every, w, lit=None, litk=1, skip=()):
    """windows on the hull's side between x0 and x1, each a quad standing 3 cm off the plating at its own station (the side is near
    upright amidships)"""
    x = x0; k = 0
    while x + w <= x1:
        if not any(a <= x <= b for a, b in skip):
            for sg in (1, -1):
                q = []
                for (xx, zz) in ((x, z0), (x + w, z0), (x + w, z1), (x, z1)):
                    u = clamp((xx - H.xa(zz)) / (H.xf(zz) - H.xa(zz)), 0, 1); q.append((xx, sg * (H.hw(u, zz) + 0.03), zz))
                A.poly(q, C['win'], (0, sg, 0))
                if lit is not None and k % litk == 0: lit.append((x + w / 2, sg * (H.hw(0.5, (z0 + z1) / 2) + 0.03), (z0 + z1) / 2))
            k += 1
        x += every

def build(fine=True):
    del WIN[:]
    hull, R, U = build_hull(H, fine)
    A = Acc('ship'); seg = 3 if fine else 1
    deck_surface(A, H, R, U, C['deck'])
    bulwark(A, H, R, U, 1.1, C['hull'], C['sup'], 0.86, 1.0)          # the foredeck's bulwark
    bulwark(A, H, R, U, 1.1, C['hull'], C['sup'], 0.0, 0.1)           # the after deck's
    capsule(A, (119.0, 0.0, 2.3), 9.0, 3.2, 3.4, C['af'], n=12 if fine else 6, rings=8 if fine else 3)   # the bulb
    if fine:
        hull_windows(A, 16.0, 108.0, 6.0, 6.9, 3.0, 0.75, WIN, 2)                        # deck 3's portholes
        hull_windows(A, 14.5, 109.0, 8.0, 9.2, 3.0, 1.3, WIN, 1, skip=((79.0, 87.0),))   # deck 4's windows (the side port's place left)
        for sg in (1, -1):   # the side port (goods and cars), shut
            q = []
            for (xx, zz) in ((80.0, 5.8), (86.0, 5.8), (86.0, 8.9), (80.0, 8.9)): u = (xx - H.xa(zz)) / (H.xf(zz) - H.xa(zz)); q.append((xx, sg * (H.hw(u, zz) + 0.02), zz))
            A.poly(q, C['dark'], (0, sg, 0))
        rubbing_strake(A, H, R, U, 5.4, C['hull'], d=0.12, h=0.25)
    else:
        for sg in (1, -1):
            A.poly([(15.0, sg * (H.HB + 0.03), 8.0), (108.0, sg * (H.HB + 0.03), 8.0), (108.0, sg * (H.HB + 0.03), 9.2), (15.0, sg * (H.HB + 0.03), 9.2)], C['win'], (0, sg, 0))
    # the tiers
    for i, (x0, x1, hw, nose, ra, wv) in enumerate(TIERS):
        z0 = ZT[i]; z1 = ZT[i + 1]
        pl = bowfront(x0, x1 - nose, -hw, hw, nose, 8 if fine else 3)
        prism(A, pl, z0, z1, C['sup'], C['roof'], top=True, bottom=(i == 2))
        every, w, w0, w1 = wv
        if i == 4:      # deck 9: its forward end is the bridge (built below), its windows aft of it
            if fine: windows(A, pl, z0 + w0, z0 + w1, C['win'], every=every, w=w, margin=1.0, lit=WIN, edges=[0, len(pl) - 2, len(pl) - 1])
            else: band(A, pl, z0 + w0, z0 + w1, C['win'], edges=[0, len(pl) - 1])
        elif fine: windows(A, pl, z0 + w0, z0 + w1, C['win'], every=every, w=w, margin=0.8, lit=WIN)
        else: band(A, pl, z0 + w0, z0 + w1, C['win'])
        if fine and i >= 1:   # the rail round the open deck on the tier's roof's edge below it (the tier under is wider)
            x0b, x1b, hwb = TIERS[i - 1][0], TIERS[i - 1][1], TIERS[i - 1][2]
            if hwb > hw + 0.8: parapet(A, [(x0b + 0.4, hwb - 0.15), (x1b - TIERS[i - 1][3] - 0.5, hwb - 0.15)], z0, 1.1, C['sup']); parapet(A, [(x0b + 0.4, -hwb + 0.15), (x1b - TIERS[i - 1][3] - 0.5, -hwb + 0.15)], z0, 1.1, C['sup'])
            parapet(A, [(x0b + 0.2, hwb - 0.15), (x0b + 0.2, -hwb + 0.15)], z0, 1.1, C['sup'])
    # the bridge on deck 9's forward end: windows round its front, the wings out to the sides
    bp = bowfront(BR[0], BR[1] - 2.0, -BR[2], BR[2], 2.0, 6 if fine else 2)
    prism(A, bp, BR[3], BR[4], C['sup'], C['roof'])
    if fine: windows(A, bp, BR[3] + 1.2, BR[4] - 0.35, C['winB'], every=1.3, w=1.15, margin=0.2, lit=WIN, litk=3, edges=list(range(1, len(bp) - 1)))
    else: band(A, bp, BR[3] + 1.2, BR[4] - 0.35, C['winB'], edges=list(range(1, len(bp) - 1)))
    for sg in (1, -1):
        y0, y1 = sorted((sg * BR[2], sg * (BR[2] + 2.6)))
        prism(A, rrect(BR[1] - 4.0, BR[1] - 0.6, y0, y1), BR[3] + 0.0, BR[3] + 2.4, C['sup'], C['roof'], bottom=True)
        if fine: band(A, rrect(BR[1] - 4.0, BR[1] - 0.6, y0, y1), BR[3] + 1.2, BR[3] + 2.1, C['winB'], edges=[0, 1] if sg > 0 else [0, 3])
    # the lifeboats in their davits along the sides, on deck 5's roof under deck 7's overhang
    zb = ZT[1] + 0.3                                                  # (the boats' keels)
    for x in BOATS:
        for sg in (1, -1):
            capsule(A, (x, sg * YB, zb + BH / 2), BL, BWD, BH, C['orange'], n=10 if fine else 6, rings=6 if fine else 2)
            if fine: davits(A, x - BL / 2 + 1.0, x + BL / 2 - 1.0, sg * (YB - 1.0), ZT[1], BH + 0.6, sg)
    # the funnel aft, the masts, the radars, the crane forward
    funnel(A, XF, 0.0, ZF0, ZF1, 7.5, 5.0, C['band'], C['black'], rake=0.18, fine=fine)
    mast(A, LT['masthead'][0], 0.0, BR[4], LT['masthead'][2] + 0.8, 0.18, C['sup'], fine, yard=1.8)
    mast(A, LT['masthead2'][0], 0.0, ZT[5], LT['masthead2'][2] + 0.8, 0.2, C['sup'], fine, yard=1.4)
    if fine:
        radar(A, 95.5, 0.0, BR[4] + 0.2, 4.0, fine); radar(A, 33.0, 0.0, LT['masthead2'][2] - 3.2, 4.0, fine)
        xc, zc = 113.5, H.zd(113.5 / L)
        acyl(A, (xc, 0.0, zc), (xc, 0.0, zc + 3.2), 0.55, lambda z: C['sup'], seg=10)
        beam(A, (xc, 0.0, zc + 3.2), (xc - 9.0, 0.0, zc + 2.0), 0.5, 0.6, C['sup'])
        abox(A, 108.0, 111.0, -4.0, 4.0, zc, zc + 1.4, C['sup'])           # the hatch to the hold
        place_lights(A, H, {k: v for k, v in LT.items() if k in ('masthead', 'masthead2', 'stern')}, fine)
        for k in ('port', 'stbd'): side_light(A, LT[k][0], LT[k][1], LT[k][2], 1 if k == 'port' else -1)
        for x in (25.0, 30.0, 85.0, 90.0):
            for sg in (1, -1): raft(A, x, sg * (B / 2 - 0.9), ZT[1])
        parapet(A, [(1.0, B / 2 - 2.0), (1.0, -B / 2 + 2.0)], D + 1.1 - 1.1, 1.1, C['sup'])
    G = []; tiny_glass(G)
    return [hull, A.done(35)], G

def anchors():
    tg, _ = to_game_f(H)
    return {'lights': lights_game(H, LT), 'win': [[round(v, 2) for v in tg(p)] for p in WIN], 'skipperAt': [round(v, 3) for v in tg((BR[1] - 2.5, 0.0, BR[3]))],
            'deck': {'y': round(D - T, 3), 'z': 0.0}, 'gw': round(D + 1.1 - T, 3), 'stern': L / 2, 'bow': -L / 2, 'side': H.HB, 'beam': B,
            'open': False, 'hand': False, 'ship': True}

def check():
    ok = [True]
    def say(good, txt):
        ok[0] = ok[0] and good; print(('OK   ' if good else 'FEIL ') + T_ID + ': ' + txt)
    say(abs(H.x(1.0, 12.6) - H.x(0.0, 12.6) - L) < 0.05, 'lengde over alt %.2f m (modellens %.1f)' % (H.x(1.0, 12.6) - H.x(0.0, 12.6), L))
    say(abs(2 * H.hw(0.5, D) - B) < 0.05, 'bredde %.2f m (modellens %.1f)' % (2 * H.hw(0.5, D), B))
    v = volume(H); say(0.55 < v / (L * B * T) < 0.66, 'deplasement %.0f t (Cb %.2f; Cb rundt 0,6 for et passasjerskip, antatt)' % (v * 1.025, v / (L * B * T)))
    say(len(TIERS) >= 8, '%d dekk overbygg over skroget, og to i skroget med vinduer' % len(TIERS))
    say(YB - BWD / 2 > TIERS[1][2], 'livbåtene (%.2f-%.2f m ut) går klar av dekk 6 (%.1f m)' % (YB - BWD / 2, YB + BWD / 2, TIERS[1][2]))
    say(ZT[1] + 0.3 + BH + 0.2 < ZT[2], 'livbåtene under overhenget på dekk 7 (topp %.1f m, dekket %.1f)' % (ZT[1] + 0.3 + BH, ZT[2]))
    check_lights(H, LT, D, say)
    return ok[0]

if __name__ == '__main__':
    run(sys.modules[__name__])
