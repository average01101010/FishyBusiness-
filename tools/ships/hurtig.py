"""The express boat (Ø15 N7, steg 36): a catamaran in aluminium for the game's express boats (core/05b-ferje.js FERJE_SIZE[1]: 27.0 × 8.6
and 35.0 × 10.5 m; the model is the bigger one, the smaller is it scaled by drawNPC). Two slender hulls under a cross deck, a low saloon
the length of her with a band of big windows and a rounded front, the wheelhouse raised on its forward end, an open after deck, a short
mast with the radar and the masthead light.
The type that gave the arrangement: the Norwegian 30-35 m passenger catamarans (some 150-300 seats, 30-35 knots) built from the 1980s;
no boat is copied, and no name, owner or mark is on her (CLAUDE.md, valg 2 A). Measures: the game's own (L, B, T); the demi-hulls'
breadth (2.7 m) and the heights assumed from the type (A).

The lanterns of a high-speed craft (FOR-1975-12-01-5 vedlegg I 13 a): the masthead light may be lower than 2(a)(i) asks as long as the
triangle it makes with the sidelights, seen from ahead, has base angles of at least 27 degrees (check()).

    python3.11 tools/ships/hurtig.py fast dry | check | fast export   (shiplib.py's docstring)
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from shiplib import *

T_ID = 'ship-hurtig'; NAME = 'Hurtigbåt (katamaran, 35 m)'
COLOURS = ((0.90, 0.90, 0.88), (0.07, 0.12, 0.24), (0.94, 0.94, 0.92))
L, B, T, D = 35.0, 10.5, 1.6, 3.4
BD = 2.7; YD = B / 2 - BD / 2          # the demi-hulls' breadth and their middles' distance from the centre line
# one demi-hull (its own breadth BD), placed twice
DH = Hull(dict(L=L - 0.0, B=BD, T=T,
               stem=[(0.0, 30.5), (T, 32.6), (D, 35.0)], stern=[(0.0, 0.0), (D, 0.0)],
               keel=[(0.0, 0.25), (0.35, 0.0), (0.7, 0.0), (0.88, 0.45), (1.0, 1.2)],
               deck=[(0.0, D), (1.0, D)],
               fore=(0.45, 1.5, 2.2, 0.0), aft=(0.06, 1.5, 2.0, 0.8),
               p=[(0.0, 2.2), (0.5, 1.8), (1.0, 1.5)], flare=0.16,
               bands=[(T + 0.15, 'af'), (T + 0.4, 'boot'), (D - 0.55, 'hull'), (None, 'band')]))
class _Hs: pass
H = _Hs(); H.L = L; H.B = B; H.T = T; H.HB = B / 2           # (the ship's measures for the frame and the export)
ZX = D + 0.1                                                 # the cross deck's top
SAL = (2.6, 27.0, B / 2 - 0.35, ZX, ZX + 2.7)                # the saloon: x0, x1, half-width, floor, roof
WH = (21.2, 26.0, 2.4, ZX + 2.7, ZX + 4.6)                    # the wheelhouse on its forward end
LT = {'masthead': (25.0, 0.0, WH[4] + 1.6), 'port': (24.6, SAL[2] + 0.15, ZX + 1.9), 'stbd': (24.6, -SAL[2] - 0.15, ZX + 1.9), 'stern': (0.35, 0.0, ZX + 1.25)}
WIN = []

def build(fine=True):
    del WIN[:]
    parts = []
    for sg in (1, -1):
        h, R, U = build_hull(DH, fine, yoff=sg * YD, name='demi%d' % sg); parts.append(h)
    A = Acc('ship'); seg = 3 if fine else 1
    # the cross deck: from the transom to forward of the saloon, the width of the boat; its underside (the wet deck) dark, its bow rounded
    xb = 30.0
    cd = bowfront(0.0, xb - 1.5, -B / 2, B / 2, 1.5, 6 if fine else 2)
    prism(A, cd, T + 1.35, ZX, C['hull'], C['deck'], top=True, bottom=True)
    band(A, cd, ZX - 0.45, ZX, C['band'], off=0.02)
    # the saloon: a rounded front, a band of big windows all round (its posts in the hull's white), the door aft
    pl = bowfront(SAL[0], SAL[1] - 2.2, -SAL[2], SAL[2], 2.2, 6 if fine else 2)
    prism(A, pl, SAL[3], SAL[4], C['sup'], C['roof'])
    if fine: windows(A, pl, SAL[3] + 0.85, SAL[4] - 0.45, C['win'], every=1.45, w=1.3, margin=0.3, lit=WIN, litk=1)
    else: band(A, pl, SAL[3] + 0.85, SAL[4] - 0.45, C['win'])
    band(A, pl, SAL[3] + 0.25, SAL[3] + 0.55, C['band'], off=0.02)
    # the wheelhouse raised on the saloon's forward end, its front raked, windows all round
    wp = bowfront(WH[0], WH[1] - 1.2, -WH[2], WH[2], 1.2, 4 if fine else 1)
    prism(A, wp, WH[3], WH[4], C['sup'], C['roof'])
    if fine: windows(A, wp, WH[3] + 0.85, WH[4] - 0.3, C['winB'], every=1.15, w=1.0, margin=0.15, lit=WIN, litk=2)
    else: band(A, wp, WH[3] + 0.85, WH[4] - 0.3, C['winB'])
    if fine:
        mast(A, LT['masthead'][0], 0.0, WH[4], LT['masthead'][2] + 0.3, 0.07, C['sup'], fine, yard=0.7)
        radar(A, WH[0] + 0.8, 0.0, WH[4], 2.4, fine)
        parapet(A, [(SAL[0] - 0.05, B / 2 - 0.2), (0.2, B / 2 - 0.2), (0.2, -B / 2 + 0.2), (SAL[0] - 0.05, -B / 2 + 0.2)], ZX, 1.0, C['sup'])   # the after deck's rail
        parapet(A, [(SAL[0] + 1, SAL[2] - 0.1), (WH[0] - 0.3, SAL[2] - 0.1), (WH[0] - 0.3, -SAL[2] + 0.1), (SAL[0] + 1, -SAL[2] + 0.1)], SAL[4], 0.5, C['sup'])   # the roof's low rail
        for x in (6.0, 9.0, 12.0): raft(A, x, 0.0, SAL[4])
        acyl(A, (0.35, 0.0, ZX), (0.35, 0.0, ZX + 1.1), 0.05, lambda z: C['steel'], seg=6)
        place_lights(A, H, LT, fine)
    G = []; tiny_glass(G)
    return parts + [A.done(35)], G

def anchors():
    tg, _ = to_game_f(H)
    return {'lights': lights_game(H, LT), 'win': [[round(v, 2) for v in tg(p)] for p in WIN], 'skipperAt': [round(v, 3) for v in tg((WH[1] - 1.6, 0.0, WH[3]))],
            'deck': {'y': round(ZX - T, 3), 'z': 0.0}, 'gw': round(ZX + 1.0 - T, 3), 'stern': L / 2, 'bow': -L / 2, 'side': B / 2, 'beam': B,
            'open': False, 'hand': False, 'ship': True}

def check():
    ok = [True]
    def say(good, txt):
        ok[0] = ok[0] and good; print(('OK   ' if good else 'FEIL ') + T_ID + ': ' + txt)
    say(abs(DH.x(1.0, D) - L) < 0.05, 'lengde over alt %.2f m (spillets %.1f)' % (DH.x(1.0, D), L))
    say(abs(2 * (YD + DH.hw(0.5, D)) - B) < 0.05, 'bredde over skrogene %.2f m (spillets %.1f)' % (2 * (YD + DH.hw(0.5, D)), B))
    v = 2 * volume(DH); say(70 < v * 1.025 < 160, 'deplasement %.0f t (to skrog; en katamaran på 35 m har 90-140 t fullastet, antatt)' % (v * 1.025))
    say(T + 1.35 - T >= 1.2, 'klaring under tverrskipsdekket %.2f m over vannlinja' % 1.35)
    # vedlegg I 13 a: the base angle of the triangle of the masthead light and the sidelights, seen from ahead, at least 27°
    ang = math.degrees(math.atan2(LT['masthead'][2] - LT['port'][2], LT['port'][1]))
    say(ang >= 27.0, 'topplanterna over sidelanternene: grunnvinkel %.1f° (vedlegg I 13 a, høyhastighetsfartøy: minst 27°)' % ang)
    say(LT['port'][0] <= LT['masthead'][0], 'sidelanternene ikke forut for topplanterna (3(b); %.1f mot %.1f)' % (LT['port'][0], LT['masthead'][0]))
    say(LT['port'][1] > 0 and LT['stbd'][1] < 0, 'rød om babord, grønn om styrbord')
    return ok[0]

if __name__ == '__main__':
    run(sys.modules[__name__])
