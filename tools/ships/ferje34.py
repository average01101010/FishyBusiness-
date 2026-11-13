"""The small car ferry (Ø15 N7, steg 36): the game's size class 0 (core/05b-ferje.js FERJE_SIZE[0][0], 34.0 × 9.6 × 2.6 m), a
double-ended shuttle ferry for the short crossings: ramps at both ends, an open car deck, a passenger saloon along the starboard side and
a casing to port, and the wheelhouse on a bridge over the car deck between them, with windows all round (she sails both ways).
The type that gave the arrangement: the small Norwegian side-house shuttle ferries of 30-40 m (some 35-50 cars) of the 1970s-2000s; no
ship is copied and no name, owner or mark is on her (CLAUDE.md, valg 2 A 05.11.2026). Measures: the game's own (L, B, T); the depth to
the car deck (3.8 m), the clear height under the bridge (4.6 m) and the house's heights are assumed from the type (A).

She is the same at both ends: lying at the quay with her bow in (core/05b-ferje.js ferjeAt) she has a ramp to the land, and when she
leaves she does not turn: her heading turns half round in the game, and the model looks the same either way (steg 36, the question in
start/36.md about ferjeAt: answered by the model, the timetable's places unchanged).

    python3.11 tools/ships/ferje34.py fast dry | check | fast export   (shiplib.py's docstring)
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from shiplib import *

T_ID = 'ship-ferje34'; NAME = 'Bilferje, liten (34 m)'
COLOURS = ((0.07, 0.12, 0.24), (0.70, 0.10, 0.09), (0.93, 0.93, 0.91))
L, B, T, D = 34.0, 9.6, 2.6, 3.8
H = Hull(dict(L=L, B=B, T=T,
              stem=[(0.0, 30.6), (T, 32.8), (D, 34.0)], stern=[(0.0, 3.4), (T, 1.2), (D, 0.0)],
              keel=[(0.0, 1.25), (0.14, 0.25), (0.3, 0.0), (0.7, 0.0), (0.86, 0.25), (1.0, 1.25)],
              deck=[(0.0, D), (1.0, D)],
              fore=(0.74, 1.7, 3.2, 0.5), aft=(0.26, 1.7, 3.2, 0.5),
              p=[(0.0, 2.4), (0.25, 4.0), (0.75, 4.0), (1.0, 2.4)], flare=0.05,
              bands=[(T + 0.25, 'af'), (T + 0.55, 'boot'), (D - 0.4, 'hull'), (None, 'band')]))
BW = 1.1                                      # the bulwark round the car deck
SH = (8.5, 25.5, -H.HB + 0.15, -H.HB + 2.7)   # the starboard side house (x0, x1, y0, y1)
PC = (13.5, 20.5, H.HB - 1.4, H.HB - 0.15)    # the port casing
BR = (14.6, 19.4, 2.3)                        # the wheelhouse on the bridge: x0, x1, half its width
ZB = D + 4.6                                  # the bridge's deck over the car deck's clear height
ZW = ZB + 0.3; ZR = ZW + 2.6                  # the wheelhouse's floor and roof
LT = {'masthead': (19.0, 0.0, ZR + 2.2), 'port': (18.6, BR[2] + 0.12, ZW + 1.55), 'stbd': (18.6, -BR[2] - 0.12, ZW + 1.55), 'stern': (0.7, -(H.HB - 0.45), D + BW + 1.3)}
WIN = []

def build(fine=True):
    del WIN[:]
    hull, R, U = build_hull(H, fine)
    A = Acc('ship')
    ue = 0.06
    deck_surface(A, H, R, U, C['cardeck'])
    if fine: lanes(A, 2.0, L - 2.0, (-1.3, 1.3), D + 0.012, C['lane'])
    bulwark(A, H, R, U, BW, C['hull'], C['sup'], ue, 1 - ue)
    for e in (0, 1): ramp(A, H, e, 2 * H.hw(e, D) * 0.86, 4.2, 32, D + 0.05, C['cardeck'], fine)
    # the starboard side house (the saloon), the port casing (stairs and the engine's air), the bridge over the deck between them
    sh = rrect(SH[0], SH[1], SH[2], SH[3], 0.6, 0.6, 2 if fine else 1)
    prism(A, sh, D, D + 2.7, C['sup'], C['roof'])
    if fine: windows(A, sh, D + 1.05, D + 2.15, C['win'], every=1.7, w=1.2, edges=None, lit=WIN, litk=1)
    else: band(A, sh, D + 1.05, D + 2.15, C['win'])
    up = rrect(SH[0] + 4.5, SH[1] - 4.5, SH[2] + 0.2, SH[3], 0.4, 0.4, 2 if fine else 1)
    prism(A, up, D + 2.7, ZB, C['sup'], C['roof'])
    if fine: windows(A, up, D + 3.3, ZB - 0.45, C['win'], every=1.7, w=1.1, lit=WIN)
    pc = rrect(PC[0], PC[1], PC[2], PC[3], 0.3, 0.3, 1)
    prism(A, pc, D, ZB, C['sup'], C['roof'])
    abox(A, BR[0] - 0.3, BR[1] + 0.3, SH[2] + 0.2, PC[3], ZB, ZB + 0.3, C['sup'])           # the bridge's deck over the car deck
    abox(A, BR[0] - 0.3, BR[1] + 0.3, SH[3], PC[2], ZB - 0.45, ZB, C['sup2'])              # (its girder, seen from the car deck)
    wheelhouse(A, BR[0], BR[1], BR[2], ZW, ZR, wing=0.0, fine=fine, both=True, lit=WIN)
    if fine:
        parapet(A, [(BR[0] - 0.3, SH[2] + 0.2), (BR[1] + 0.3, SH[2] + 0.2)], ZB + 0.3, 1.0, C['sup'])
        parapet(A, [(BR[0] - 0.3, PC[3]), (BR[1] + 0.3, PC[3])], ZB + 0.3, 1.0, C['sup'])
        # the masts at both ends of the wheelhouse roof (the forward one's masthead light lit as she goes; the other's dark)
        for x in (BR[1] - 0.4, BR[0] + 0.4): mast(A, x, 0.0, ZR + 0.18, ZR + 2.5, 0.07, C['sup'], fine)
        radar(A, (BR[0] + BR[1]) / 2, 0.0, ZR + 0.18, 2.4, fine)
        for x in (PC[0] + 1.5, PC[1] - 1.5): acyl(A, (x, (PC[2] + PC[3]) / 2, ZB), (x, (PC[2] + PC[3]) / 2, ZB + 1.6), 0.18, lambda z: C['dark'], seg=8)   # the exhausts
        for x in (SH[0] + 1.2, SH[1] - 1.2): raft(A, x, (SH[2] + SH[3]) / 2, D + 2.7)
        # the stern light's post at each end's starboard corner (the forward one dark)
        for x in (0.7, L - 0.7): acyl(A, (x, -(H.HB - 0.45), D + BW), (x, -(H.HB - 0.45), D + BW + 1.15), 0.05, lambda z: C['steel'], seg=6)
        place_lights(A, H, LT, fine)
        lamp(A, (L - LT['stern'][0], LT['stern'][1], LT['stern'][2]), C['lampW'])          # (the other end's stern light, dark)
        lamp(A, (L - LT['masthead'][0], 0.0, LT['masthead'][2]), C['lampW'])               # (the other end's masthead light)
        rubbing_strake(A, H, R, U, D - 0.55, C['rubber'])
    G = []; tiny_glass(G)
    return [hull, A.done(35)], G

def anchors():
    tg, _ = to_game_f(H); build_win()
    return {'lights': lights_game(H, LT), 'win': [[round(v, 2) for v in tg(p)] for p in WIN], 'skipperAt': [round(v, 3) for v in tg((BR[1] - 1.0, 0.0, ZW))],
            'deck': {'y': round(D - T, 3), 'z': 0.0}, 'gw': round(D + BW - T, 3), 'stern': L / 2, 'bow': -L / 2, 'side': H.HB, 'beam': B,
            'open': False, 'hand': False, 'ship': True}

def build_win():
    """the windows' middles without Blender (the anchors are written after the build, when WIN holds the fine build's)"""
    return WIN

def check():
    ok = [True]
    def say(good, txt):
        ok[0] = ok[0] and good; print(('OK   ' if good else 'FEIL ') + T_ID + ': ' + txt)
    say(abs(H.x(1.0, D) - L) < 0.05 and abs(H.x(0.0, D)) < 0.05, 'lengde over alt %.2f m (spillets %.1f)' % (H.x(1.0, D) - H.x(0.0, D), L))
    say(abs(2 * H.hw(0.5, D) - B) < 0.05, 'bredde %.2f m (spillets %.1f)' % (2 * H.hw(0.5, D), B))
    v = volume(H); say(400 < v * 1.025 < 650, 'deplasement %.0f t (Cb %.2f; en pendelferje på 34 m har 450-600 t, antatt)' % (v * 1.025, v / (L * B * T)))
    say(ZB - D >= 4.5, 'fri høyde under brua %.1f m (lastebil 4,5 m)' % (ZB - D))
    check_lights(H, LT, D, say)
    return ok[0]

if __name__ == '__main__':
    import shiplib; run(sys.modules[__name__])
