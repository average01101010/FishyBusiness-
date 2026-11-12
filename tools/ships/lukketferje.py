"""The double-ended car ferries with a closed car deck (ferje64.py, ferje112.py; Ø15 N7, steg 36): the hull to the car deck, the car deck
closed by the side casings and the upper deck over it and open at both ends, the ramps, the saloon deck(s) amidships, the wheelhouse on top
with windows all round and wings, the funnels on the side casings, the masts at both ends with their masthead lights. The same at both
ends, as the ferries are (they do not turn at the quay; core/05b-ferje.js ferjeAt turns the heading, the model looks the same).
Each script gives the tables (the dict F); see shiplib.py for the frame and the commands."""
from shiplib import *

def make(F):
    L, B, T, D = F['L'], F['B'], F['T'], F['D']
    H = Hull(dict(L=L, B=B, T=T,
                  stem=[(0.0, L - F['spoon']), (T, L - F['spoon'] * 0.35), (D, L)], stern=[(0.0, F['spoon']), (T, F['spoon'] * 0.35), (D, 0.0)],
                  keel=[(0.0, T * 0.55), (0.12, T * 0.12), (0.26, 0.0), (0.74, 0.0), (0.88, T * 0.12), (1.0, T * 0.55)],
                  deck=[(0.0, D), (1.0, D)],
                  fore=(0.78, 1.8, 3.4, 0.55), aft=(0.22, 1.8, 3.4, 0.55),
                  p=[(0.0, 2.6), (0.22, 4.5), (0.78, 4.5), (1.0, 2.6)], flare=0.04,
                  bands=[(T + 0.3, 'af'), (T + 0.65, 'boot'), (D - 0.45, 'hull'), (None, 'band')]))
    F['H'] = H
    HB = H.HB; XC0, XC1 = F['xc']          # the closed car deck's (the casings' and the upper deck's) ends
    ZU = D + F['clear']                     # the upper deck (the saloon deck) over the car deck
    F['ZU'] = ZU
    # the decks up the house: [x0, x1, half-width, height] from the upper deck up, the last the wheelhouse's
    zs = [ZU + 0.4]
    for t in F['tiers']: zs.append(zs[-1] + t[3])
    F['zs'] = zs
    ZW = zs[-1]; ZR = ZW + F['wh'][3]
    F['ZW'] = ZW; F['ZR'] = ZR
    xm = L / 2
    # the lanterns (vedlegg I): the forward masthead light on the forward mast, the after one higher on the after mast, half the length
    # apart; the sidelights on the first tier's sides, low enough (2(g)) and aft of the forward masthead light; the stern light under the
    # upper deck's after edge on the centre line
    xmf, xma = L - F['mastx'], F['mastx']
    F['LT'] = {'masthead': (xmf, 0.0, F['mh'][0]), 'masthead2': (xma, 0.0, F['mh'][1]),
               'port': (F['tiers'][0][1] - 1.2, F['tiers'][0][2] + 0.12, zs[0] + 1.6), 'stbd': (F['tiers'][0][1] - 1.2, -F['tiers'][0][2] - 0.12, zs[0] + 1.6),
               'stern': (XC0 - 0.05, 0.0, ZU - 0.35)}
    return H

def build(F, fine=True):
    H = F['H']; L, B, T, D = F['L'], F['B'], F['T'], F['D']; HB = H.HB; XC0, XC1 = F['xc']; ZU = F['ZU']; zs = F['zs']; ZW, ZR = F['ZW'], F['ZR']
    WIN = F.setdefault('WIN', []); del WIN[:]
    hull, R, U = build_hull(H, fine)
    A = Acc('ship'); seg = 3 if fine else 1
    deck_surface(A, H, R, U, C['cardeck'])
    if fine: lanes(A, 2.5, L - 2.5, [(-HB + F['cw']) + k * (2 * HB - 2 * F['cw']) / F['nl'] for k in range(1, F['nl'])], D + 0.012, C['lane'])
    # the open ends: a bulwark and the ramps
    ue = 0.04; ux0 = (XC0) / L; ux1 = XC1 / L
    bulwark(A, H, R, U, 1.1, C['hull'], C['sup'], ue, ux0 + 0.01); bulwark(A, H, R, U, 1.1, C['hull'], C['sup'], ux1 - 0.01, 1 - ue)
    for e in (0, 1): ramp(A, H, e, 2 * H.hw(e, D) * 0.86, F['ramp'], 30, D + 0.05, C['cardeck'], fine)
    # the side casings, the full height of the car deck, white over a band of the hull's colour; their insides lighter grey
    for sg in (1, -1):
        y0, y1 = (HB - F['cw'], HB) if sg > 0 else (-HB, -HB + F['cw'])
        pl = rrect(XC0, XC1, y0 + (0.0 if sg > 0 else 0.0), y1, 0.0, 0.0, 1)
        prism(A, pl, D, ZU, C['sup'], C['sup2'], top=False)
        band(A, [(XC0, sg * HB), (XC1, sg * HB)] if sg < 0 else [(XC1, sg * HB), (XC0, sg * HB)], D, D + 1.2, C['hull'], off=0.025)
        band(A, [(XC0, sg * HB), (XC1, sg * HB)] if sg < 0 else [(XC1, sg * HB), (XC0, sg * HB)], D + 1.2, D + 1.45, C['band'], off=0.025)
        if fine:   # the casings' small windows (the crew's and the stairs'), and the openings in them over the car deck
            windows(A, [(XC0, sg * HB), (XC1, sg * HB)] if sg < 0 else [(XC1, sg * HB), (XC0, sg * HB)], ZU - 1.9, ZU - 1.1, C['win'], every=F['cwin'], w=0.9, off=0.035, margin=4.0)
    # the upper deck over the car deck (its underside dark: the car deck's ceiling), and its rail
    abox(A, XC0, XC1, -HB, HB, ZU, ZU + 0.4, C['sup'])
    A.poly([(XC0, -HB + F['cw'], ZU - 0.01), (XC0, HB - F['cw'], ZU - 0.01), (XC1, HB - F['cw'], ZU - 0.01), (XC1, -HB + F['cw'], ZU - 0.01)], C['dark'], (0, 0, -1))
    if fine:
        for x0e in (XC0, XC1):   # the car deck's back light: the ceiling's beams over the opening (a dark lintel)
            abox(A, x0e - 0.15, x0e + 0.15, -HB + F['cw'], HB - F['cw'], ZU - 0.6, ZU, C['sup2'])
        parapet(A, [(XC0 + 0.1, -HB + 0.1), (XC1 - 0.1, -HB + 0.1), (XC1 - 0.1, HB - 0.1), (XC0 + 0.1, HB - 0.1)], ZU + 0.4, 1.1, C['sup'], closed=True)
    # the tiers of the house: windows all round, the first (the saloon) with the big ones
    for i, (x0, x1, hw, h) in enumerate(F['tiers']):
        z0 = zs[i]; pl = rrect(x0, x1, -hw, hw, min(2.5, hw * 0.4), min(2.5, hw * 0.4), seg)
        prism(A, pl, z0, z0 + h, C['sup'], C['roof'])
        wz = (z0 + 0.9, z0 + h - 0.6) if i == 0 else (z0 + 1.1, z0 + h - 0.7)
        if fine: windows(A, pl, wz[0], wz[1], C['win'], every=F['wev'][i], w=F['wev'][i] - 0.4, margin=0.6, lit=WIN)
        else: band(A, pl, wz[0], wz[1], C['win'])
        if fine and i > 0:   # (the first tier's roof is the next one's deck; the rail round the upper ones)
            parapet(A, [(x0 + 0.1, -hw + 0.1), (x1 - 0.1, -hw + 0.1), (x1 - 0.1, hw - 0.1), (x0 + 0.1, hw - 0.1)], z0 + h, 1.0, C['sup'], closed=True)
    x0, x1, hw, h = F['wh']
    wheelhouse(A, x0, x1, hw, ZW, ZR, wing=F['wing'], fine=fine, both=True, lit=WIN)
    if fine:
        radar(A, (x0 + x1) / 2 - 1.0, 0.0, ZR + 0.18, 3.2, fine); radar(A, (x0 + x1) / 2 + 1.0, 0.0, ZR + 0.18, 3.2, fine)
        mast(A, (x0 + x1) / 2, 0.0, ZR + 0.18, ZR + 2.6, 0.1, C['sup'], fine, yard=1.2)
    # the funnels on the casings' tops beside the house (one to starboard on the middle ferry, one each side on the big one)
    for (fx, sg) in F['funnels']:
        y = sg * (HB - 0.2 - F['fw'] / 2)
        funnel(A, fx, y, ZU + 0.4, F['fz'], F['fl'], F['fw'], C['sup'], C['band'], rake=0.0, fine=fine)
    # the masts at both ends of the upper deck: each carries the lower masthead light (lit when that end leads) and the higher one
    # (lit when it is astern)
    for xm_ in (F['mastx'], L - F['mastx']):
        mast(A, xm_, 0.0, ZU + 0.4, F['mh'][1] + 0.4, 0.16 if L > 80 else 0.12, C['sup'], fine, yard=0.9)
        if fine:
            lamp(A, (xm_, 0.0, F['mh'][0]), C['lampW']); lamp(A, (xm_, 0.0, F['mh'][1]), C['lampW'])
            abox(A, xm_ - 0.4, xm_ + 0.4, -0.4, 0.4, F['mh'][0] - 0.3, F['mh'][0] - 0.22, C['sup'])
    if fine:
        LT = F['LT']
        for k in ('port', 'stbd'): side_light(A, LT[k][0], LT[k][1], LT[k][2], 1 if k == 'port' else -1)
        lamp(A, LT['stern'], C['lampW']); lamp(A, (L - LT['stern'][0], 0.0, LT['stern'][2]), C['lampW'])
        # the lifesaving: liferafts (marine evacuation) along the upper deck's sides, the rescue boat in her davit to starboard
        for x in F['rafts']:
            for sg in (1, -1): raft(A, x, sg * (HB - 0.9), ZU + 0.4)
        rx = F['rescue']; capsule(A, (rx, -(HB - 1.6), ZU + 1.6), 6.0, 2.3, 1.1, C['orange'], n=10, rings=6)
        davits(A, rx - 1.6, rx + 1.6, -(HB - 1.2), ZU + 0.4, 2.6, -1)
        rubbing_strake(A, H, R, U, D - 0.6, C['rubber'], d=0.22, h=0.3)
    G = []; tiny_glass(G)
    return [hull, A.done(35)], G

def anchors(F):
    H = F['H']; tg, _ = to_game_f(H); x0, x1 = F['wh'][0], F['wh'][1]
    return {'lights': lights_game(H, F['LT']), 'win': [[round(v, 2) for v in tg(p)] for p in F['WIN']], 'skipperAt': [round(v, 3) for v in tg((x1 - 1.2, 0.0, F['ZW']))],
            'deck': {'y': round(F['D'] - F['T'], 3), 'z': 0.0}, 'gw': round(F['ZU'] + 0.4 - F['T'], 3), 'stern': F['L'] / 2, 'bow': -F['L'] / 2, 'side': H.HB, 'beam': F['B'],
            'open': False, 'hand': False, 'ship': True}

def check(F, tid, cb):
    H = F['H']; L, B, T, D = F['L'], F['B'], F['T'], F['D']; ok = [True]
    def say(good, txt):
        ok[0] = ok[0] and good; print(('OK   ' if good else 'FEIL ') + tid + ': ' + txt)
    say(abs(H.x(1.0, D) - H.x(0.0, D) - L) < 0.05, 'lengde over alt %.2f m (spillets %.1f)' % (H.x(1.0, D) - H.x(0.0, D), L))
    say(abs(2 * H.hw(0.5, D) - B) < 0.05, 'bredde %.2f m (spillets %.1f)' % (2 * H.hw(0.5, D), B))
    v = volume(H); say(cb[0] < v * 1.025 < cb[1], 'deplasement %.0f t (Cb %.2f; antatt %d-%d t for typen)' % (v * 1.025, v / (L * B * T), cb[0], cb[1]))
    say(F['clear'] >= 4.6, 'fri høyde på bildekket %.1f m' % F['clear'])
    check_lights(H, F['LT'], D, say)
    return ok[0]
