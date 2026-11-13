"""The coastal fleet's fishing boats by their gear (Ø15 N7, steg 36): what the Danish seiner (snurrevad.py), the purse seiner (notbat.py),
the shrimp trawler (reketral.py), the pot boat (teine.py) and the coastal longliner (autoline.py) have in common. The register's boats
under 28 m (src/data/flaate.json, the main gear of each) were drawn as the player's boat nearest in length and beam (vessel3d.js npcKit),
whatever they fished with; a boat whose gear these models show is drawn as hers now (view3d/20-trawl-seine.js npcGearT). The boats that
fish with nets, lines under 13 m and the jig keep the player's boats: those are net and line boats.

A working boat's lines: a raked stem, a high bow with the flare, a transom, the bulwark round the deck with its white cap, the wheelhouse
forward with windows round it, the mast on its roof with the masthead light, the sidelights on the wheelhouse's sides, the stern light on
the transom, the work deck aft with the gear's own machinery. The hull's colour is the livery's (zone 1: navy, red, teal or the model's
own; vessel3d.js LIVERY), the house white. No name, registration mark or owner's mark on any of them (CLAUDE.md).

Measures: the length groups' typical boats (the register's 11-15 and 15-21 m groups); the hull's depth, the house and the machinery
assumed from the type (A), no boat's drawing used.

    python3.11 tools/ships/<model>.py fast dry | check | fast export   (shiplib.py's docstring)
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from shiplib import *

def fishing_hull(L, B, T, D, sheer=1.1, fine_bow=0.5):
    """a working boat's hull: raked stem, transom, the keel deep with a skeg aft, the deck rising forward by sheer"""
    return Hull(dict(L=L, B=B, T=T,
                     stem=[(0.0, L - 0.11 * L), (T, L - 0.05 * L), (D + sheer, L)], stern=[(0.0, 0.06 * L), (T, 0.015 * L), (D + sheer, 0.0)],
                     keel=[(0.0, 0.55 * T), (0.08, 0.2 * T), (0.22, 0.0), (0.8, 0.0), (0.95, 0.35 * T), (1.0, 0.9 * T)],
                     deck=[(0.0, D), (0.5, D + 0.12 * sheer), (0.8, D + 0.45 * sheer), (1.0, D + sheer)],
                     fore=(fine_bow, 1.6, 2.7, 0.0), aft=(0.14, 1.6, 2.4, 0.8),
                     p=[(0.0, 2.2), (0.4, 2.7), (0.8, 2.3), (1.0, 1.8)], flare=0.13, ends_fine=True,
                     bands=[(T + 0.12, 'af'), (T + 0.3, 'boot'), (None, 'hull')]))

def more_colours():
    C.setdefault('net', mat('net', (0.12, 0.20, 0.16), 0.15, zone=0))       # a net wound on its drum or in its heap (dark green)
    C.setdefault('rope', mat('rope', (0.20, 0.17, 0.13), 0.15, zone=0))     # the ropes on their coilers
    C.setdefault('yellow', mat('yellow', (0.92, 0.72, 0.10), 0.5, zone=0))  # the floats
    C.setdefault('potn', mat('potn', (0.16, 0.24, 0.20), 0.2, zone=0))      # a pot's netting
    C.setdefault('blue', mat('blueg', (0.10, 0.28, 0.55), 0.4, zone=0))     # the blue of a winch or a hauler
    C.setdefault('tyre', mat('tyre', (0.07, 0.07, 0.07), 0.15, zone=0))     # the old tyres hung as fenders

def deck_and_rail(A, H, R, U, bw=1.0, cap=0.1):
    """the deck, the bulwark (the hull's colour outside, white inside and on the cap) and the tyres along the sides"""
    deck_surface(A, H, R, U, C['deck'])
    bulwark(A, H, R, U, bw, C['hull'], C['sup'], 0.0, 1.0, inset=0.08)

def tyres(A, H, xs, fine=True):
    """old tyres hung over the bulwark as fenders, a pair each side at the stations xs"""
    if not fine: return
    for x in xs:
        u = clamp((x - H.xa(H.T + 0.8)) / (H.xf(H.T + 0.8) - H.xa(H.T + 0.8)), 0, 1); z = H.zd(u) - 0.55
        for sg in (1, -1):
            y = sg * (max(H.hw(u, z - 0.35), H.hw(u, z + 0.35)) + 0.13)   # (clear of the flare above it)
            atorus(A, (x, y, z), (0, 1, 0), 0.32, 0.11, lambda zz: C['tyre'], seg=8, rseg=4)

def wh_floor(H, x0, x1, raise_=0.6):
    u = ((x0 + x1) / 2 - H.xa(H.T)) / (H.xf(H.T) - H.xa(H.T)); return H.zd(u) + 0.05 + raise_

def wheelhouse_f(A, H, x0, x1, hw, h, fine, lit, aft_door=True, raise_=0.6):
    """the wheelhouse forward on the deck, raised raise_ on its deckhouse (the bakk's step): walls, roof with a visor, windows all round,
    the door aft; returns (floor, roof)"""
    z0 = wh_floor(H, x0, x1, raise_); z1 = z0 + h
    pl = rrect(x0, x1, -hw, hw, 0.35, 0.15, 2 if fine else 1)
    if raise_ > 0:   # (the deckhouse no wider than the hull at its front: the bow narrows there, and a corner stood out through the side)
        zb = z0 - raise_ - 0.4; uf = clamp((x1 + 0.1 - H.xa(zb)) / (H.xf(zb) - H.xa(zb)), 0, 1); wb = min(hw + 0.1, H.hw(uf, H.zd(uf) - 0.4) - 0.12)
        ua = clamp((x0 - 0.1 - H.xa(zb)) / (H.xf(zb) - H.xa(zb)), 0, 1); wa = min(hw + 0.1, H.hw(ua, H.zd(ua) - 0.4) - 0.12)
        prism(A, [(x1 + 0.1, -wb), (x1 + 0.1, wb), (x0 - 0.1, wa), (x0 - 0.1, -wa)], zb, z0, C['sup2'], C['sup2'], top=False)
    prism(A, pl, z0, z1, C['sup'], C['roof'])
    if fine:
        windows(A, pl, z0 + h * 0.5, z1 - 0.25, C['winB'], every=0.95, w=0.8, margin=0.12, lit=lit, litk=2)
        if aft_door: abox(A, x0 - 0.03, x0, -0.35, 0.35, z0 + 0.1, z0 + 1.85, C['sup2'])
    else:
        band(A, pl, z0 + h * 0.5, z1 - 0.25, C['winB'])
    abox(A, x0 - 0.05, x1 + 0.25, -hw - 0.08, hw + 0.08, z1, z1 + 0.1, C['sup'])
    return z0, z1

def fishing_lights(A, H, LT, fine=True):
    """the lamps (place_lights) and the sidelights in their screens on the wheelhouse's sides"""
    if not fine: return
    place_lights(A, H, {k: v for k, v in LT.items() if k in ('masthead', 'stern')}, fine)
    for k in ('port', 'stbd'): side_light(A, LT[k][0], LT[k][1], LT[k][2], 1 if k == 'port' else -1)

def drum_y(A, x, z, r, w, m, flange=None, fine=True, mf=None):
    """a drum on an athwartships axis (a net drum, a trawl winch's), w wide, r its wound radius, flanges of radius flange"""
    seg = 12 if fine else 6
    acyl(A, (x, -w / 2, z), (x, w / 2, z), r, lambda zz: m, seg=seg)
    acyl(A, (x, w / 2, z), (x, -w / 2, z), r, lambda zz: m, seg=seg)   # (the other end capped)
    if flange:
        for y in (-w / 2, w / 2):
            acyl(A, (x, y - 0.04, z), (x, y + 0.04, z), flange, lambda zz: mf or C['steel'], seg=seg)
            acyl(A, (x, y + 0.04, z), (x, y - 0.04, z), flange, lambda zz: mf or C['steel'], seg=seg)

def fishing_anchors(H, LT, WIN, skipper, crew, deck_z, gw):
    """the GLB's anchors: lanterns, lit windows, the skipper's place and two hands on the work deck ([x, y, z, ry] in the game's frame),
    the decks for the people (as the player's boats' geo); liv: the hull takes the fleet's liveries"""
    tg, _ = to_game_f(H)
    return {'lights': lights_game(H, LT), 'win': [[round(v, 2) for v in tg(p)] for p in WIN], 'skipperAt': [round(v, 3) for v in tg(skipper)],
            'crewSpots': [[round(v, 3) for v in tg(c[:3])] + [c[3]] for c in crew],
            'deck': {'y': round(deck_z - H.T, 3), 'z': 0.0}, 'gw': round(gw - H.T, 3), 'stern': H.L / 2, 'bow': -H.L / 2, 'side': H.HB, 'beam': H.B,
            'open': False, 'hand': False, 'liv': True}

def fishing_check(T_ID, H, LT, hull_z, more, cb=(0.40, 0.60), what='en fiskebåt med skjegg og kjøl', disp=None, scale_to=None):
    ok = [True]
    def say(good, txt):
        ok[0] = ok[0] and good; print(('OK   ' if good else 'FEIL ') + T_ID + ': ' + txt)
    top = H.zd(1.0)
    say(abs(H.x(1.0, top) - H.x(0.0, top) - H.L) < 0.05, 'lengde over alt %.2f m (modellens %.2f)' % (H.x(1.0, top) - H.x(0.0, top), H.L))
    say(abs(2 * H.hw(0.5, H.zd(0.5)) - H.B) < 0.05, 'bredde %.2f m (modellens %.2f)' % (2 * H.hw(0.5, H.zd(0.5)), H.B))
    v = volume(H); say(cb[0] < v / (H.L * H.B * H.T) < cb[1], 'deplasement %.1f t (Cb %.2f; %s har Cb %.2f-%.2f, antatt)' % (v * 1.025, v / (H.L * H.B * H.T), what, cb[0], cb[1]))
    if disp: say(disp[0] <= v * 1.025 <= disp[1], 'deplasementet %.1f t innenfor %.1f-%.1f t for typen (antatt)' % (v * 1.025, disp[0], disp[1]))
    for good, txt in more: say(good, txt)
    check_lights(H, LT, hull_z, say)
    # the model is drawn scaled to each boat of the register it stands for (npcMesh: the beam as 0.3 L + 0.9, flaate.json; the height by
    # the mean of the two): from 20 m the masthead light must stand the beam over the hull (6-12 m, vedlegg I 2(a)(i)) on the longest too
    if scale_to:
        Lx = scale_to; Bx = 0.3 * Lx + 0.9; sy = (Bx / H.B + Lx / H.L) / 2; mh = (LT['masthead'][2] - hull_z) * sy
        say(Lx < 20 or mh >= min(12.0, max(6.0, Bx)) - 1e-6, 'skalert til %.1f m (%.2f m bred): topplanterna %.1f m over skroget (minst %.1f m fra 20 m)' % (Lx, Bx, mh, min(12.0, max(6.0, Bx))))
    return ok[0]
