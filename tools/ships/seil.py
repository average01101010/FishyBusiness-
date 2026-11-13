"""The sailing boat (Ø15 N7, steg 36; her traffic is N6, steg 38, the summer's leisure boats): a 34 ft cruising sloop, 10.4 × 3.4 m,
1.8 m over the fin keel (each boat in the game is the model scaled to her own length and beam). The hull with its fin keel and the
spade rudder, the low coachroof with its windows, the cockpit aft with the wheel, the mast with its spreaders, the shrouds and the stays,
the boom, the pulpit and the pushpit; the sails as parts of their own, set at sea and furled in port (the mainsail in its cover on the
boom, the jib rolled on the forestay), drawn by view3d drawSail as the havsjark's riding sail is. The steaming light on the mast's front
(she shows it under engine), the sidelights on the pulpit, the stern light on the pushpit.
The type that gave the arrangement: the Nordic 32-36 ft cruising sloops (a masthead or fractional rig on a fin keel); no boat is copied,
and no maker's name or mark is on her or her sails (CLAUDE.md). Measures assumed from the type (A).

    python3.11 tools/ships/seil.py fast dry | check | fast export   (shiplib.py's docstring)
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fisklib import *

T_ID = 'ship-seil'; NAME = 'Seilbåt (34 fot)'
COLOURS = ((0.94, 0.94, 0.92), (0.10, 0.22, 0.45), (0.95, 0.95, 0.93))
L, B, T, D = 10.4, 3.4, 0.38, 1.45                 # T: the canoe body's draught; the keel goes 1.42 m further down
KD = 1.42
H = Hull(dict(L=L, B=B, T=T,
              stem=[(0.0, 9.6), (T, 9.95), (D + 0.2, L)], stern=[(0.0, 0.7), (T, 0.35), (D + 0.2, 0.0)],
              keel=[(0.0, 0.42), (0.2, 0.05), (0.5, 0.0), (0.85, 0.12), (1.0, 0.5)],
              deck=[(0.0, D), (0.5, D - 0.03), (1.0, D + 0.2)],
              fore=(0.45, 1.6, 2.2, 0.0), aft=(0.2, 1.3, 1.7, 0.66),
              p=[(0.0, 1.3), (0.5, 1.5), (1.0, 1.2)], flare=0.08,
              bands=[(T + 0.04, 'af'), (T + 0.18, 'band'), (None, 'hull')]))
XM, ZTOP = 6.5, D + 13.6                           # the mast: x, its top
ZB = D + 0.45 + 1.15                               # the boom's height (over the coachroof)
XBE = 1.4                                          # the boom's end
XT = 9.95                                          # the forestay's foot
LT = {'masthead': (XM + 0.12, 0.0, D + 5.2), 'port': (9.7, 0.32, D + 0.75), 'stbd': (9.7, -0.32, D + 0.75), 'stern': (0.15, 0.0, D + 0.75)}
WIN = []

def mats():
    more_colours()
    C.setdefault('inox', mat('inox', (0.78, 0.80, 0.82), 0.8, zone=0)); C.setdefault('alu', mat('alu', (0.70, 0.72, 0.74), 0.6, zone=0))
    C.setdefault('sailw', mat('sailw', (0.93, 0.92, 0.88), 0.2, zone=0)); C.setdefault('teak', mat('teak', (0.52, 0.38, 0.24), 0.2, zone=0))

def build(fine=True):
    del WIN[:]; mats()
    hull, R, U = build_hull(H, fine)
    A = Acc('ship')
    deck_surface(A, H, R, U, C['sup2'])
    # the fin keel and its bulb, the rudder (under the canoe body)
    k0 = [(3.7, 0.05), (5.1, 0.05), (4.85, -KD), (4.0, -KD)]
    for sg in (1, -1): A.poly([(x, sg * 0.09, z) for x, z in (k0 if sg > 0 else list(reversed(k0)))], C['af'], (0, sg, 0))
    for i in range(4):
        a, b = k0[i], k0[(i + 1) % 4]; A.poly([(a[0], -0.09, a[1]), (b[0], -0.09, b[1]), (b[0], 0.09, b[1]), (a[0], 0.09, a[1])], C['af'], (b[1] - a[1], 0, -(b[0] - a[0])))
    capsule(A, (4.35, 0.0, -KD + 0.05), 1.6, 0.42, 0.36, C['af'], n=8, rings=4)
    abox(A, 0.9, 1.35, -0.05, 0.05, -0.75, 0.25, C['af'])
    # the coachroof with its windows, the cockpit's coamings and the wheel
    zc = H.zd(0.55); pl = [(8.1, -0.7), (8.1, 0.7), (4.2, 1.2), (4.2, -1.2)]
    prism(A, pl, zc - 0.05, zc + 0.45, C['sup'], C['sup'])
    if fine:
        for sg in (1, -1): A.poly([(4.8, sg * (1.12 + 0.03), zc + 0.12), (7.4, sg * (0.85 + 0.03), zc + 0.12), (7.4, sg * (0.85 + 0.03), zc + 0.32), (4.8, sg * (1.12 + 0.03), zc + 0.32)], C['win'], (0, sg, 0))
        for sg in (1, -1): abox(A, 1.2, 4.2, sg * 1.2 - 0.05, sg * 1.2 + 0.05, D, D + 0.32, C['teak'])
        atorus(A, (1.5, 0.0, D + 0.5), (1, 0, 0), 0.45, 0.025, lambda z: C['inox'], seg=12, rseg=4)
        acyl(A, (1.5, 0.0, D), (1.5, 0.0, D + 0.5), 0.05, lambda z: C['inox'], seg=6)
    # the mast, the spreaders, the boom, the stays and the shrouds
    acyl(A, (XM, 0.0, zc + 0.45), (XM, 0.0, ZTOP), 0.09, lambda z: C['alu'], seg=8 if fine else 4)
    beam(A, (XM, 0.0, ZB), (XBE, 0.0, ZB - 0.15), 0.1, 0.16, C['alu'])
    if fine:
        for zs in (D + 5.8, D + 10.0): beam(A, (XM - 0.15, -0.9, zs), (XM - 0.15, 0.9, zs), 0.04, 0.05, C['alu'])
        for sg in (1, -1):
            beam(A, (XM - 0.2, sg * 1.55, D + 0.05), (XM - 0.15, sg * 0.9, D + 5.8), 0.015, 0.015, C['inox'])
            beam(A, (XM - 0.15, sg * 0.9, D + 5.8), (XM - 0.15, sg * 0.75, D + 10.0), 0.015, 0.015, C['inox'])
            beam(A, (XM - 0.15, sg * 0.75, D + 10.0), (XM, 0.0, ZTOP - 0.2), 0.015, 0.015, C['inox'])
        beam(A, (XT, 0.0, H.zd(0.96)), (XM + 0.05, 0.0, ZTOP - 0.1), 0.02, 0.02, C['inox'])
        beam(A, (0.15, 0.0, D + 0.1), (XM - 0.05, 0.0, ZTOP - 0.05), 0.015, 0.015, C['inox'])
        pts = [(H.x(u, H.zd(u)), H.hw(u, H.zd(u)) - 0.05) for u in [0.8 + 0.2 * i / 6 for i in range(7)]]
        rail(A, pts + [(p[0], -p[1]) for p in reversed(pts)], H.zd(0.9), 0.6, C['inox'], t=0.025)
        rail(A, [(1.3, 1.25), (0.15, 0.9), (0.15, -0.9), (1.3, -1.25)], D, 0.6, C['inox'], t=0.025)
        place_lights(A, H, {k: v for k, v in LT.items() if k in ('masthead', 'stern')}, fine)
        for k in ('port', 'stbd'): lamp(A, LT[k], C['lampR'] if k == 'port' else C['lampG'], r=0.05, h=0.1)
    G = []; tiny_glass(G)
    return [hull, A.done(35)], G

def tri2(A, a, b, c, m):
    """a sail's panel seen from both sides"""
    A.poly([a, b, c], m); A.poly([a, c, b], m)

def sails(fine=True):
    """the sails set: the mainsail from the mast to the boom's end, the jib from the stem to some 85 % up the forestay, both drawn in a
    little to starboard as on a reach; an object of its own"""
    mats(); A = Acc('SAIL'); sw = math.radians(12); ys = lambda x: -(XM - x) * math.sin(sw)
    xb = XM - (XM - XBE) * math.cos(sw)
    zt = ZTOP - 0.4; zm = (ZB + zt) / 2
    tri2(A, (XM - 0.1, 0.0, ZB + 0.05), (xb, ys(XBE), ZB - 0.1), (XM - 0.12, 0.0, zt), C['sailw'])
    tri2(A, (xb, ys(XBE), ZB - 0.1), (XM - 0.1 - (XM - xb) * 0.45, ys(XBE) * 0.45 - 0.08, zm), (XM - 0.12, 0.0, zt), C['sailw'])   # (the roach)
    zj = H.zd(0.96) + 0.4; zh = zj + (ZTOP - zj) * 0.82; xh = XT - (XT - XM) * 0.82
    tri2(A, (XT - 0.05, 0.0, zj), (xh, 0.0, zh), (XM - 0.6, -0.55, D + 0.95), C['sailw'])
    return A.done(60)

def furled():
    """the sails furled: the mainsail in its cover on the boom, the jib rolled on the forestay"""
    mats(); A = Acc('SAILF')
    acyl(A, (XM - 0.2, 0.0, ZB + 0.18), (XBE + 0.6, 0.0, ZB + 0.08), 0.17, lambda z: C['blue'], seg=8)
    zj = H.zd(0.96) + 0.3
    acyl(A, (XT - 0.05, 0.0, zj), (XT - (XT - XM) * 0.85, 0.0, zj + (ZTOP - zj) * 0.85), 0.07, lambda z: C['sailw'], seg=6, r1=0.03)
    return A.done(60)

def more():
    return [{'name': 'sail', 'obj': lambda: sails(True), 'ao': False, 'show': False}, {'name': 'sailf', 'obj': furled, 'ao': False, 'show': False}]

def show_parts():
    return [sails(True)]

def anchors():
    return fishing_anchors(H, LT, WIN, (1.0, 0.0, D), [(2.4, 0.7, D, 3.14), (2.6, -0.7, D, 3.14)], D, D)

def check():
    return fishing_check(T_ID, H, LT, D, [
        (T + KD >= 1.6, 'dypgående %.2f m over kjølen (en 34 fots seilbåt: 1,6-2,0 m)' % (T + KD)),
        (ZTOP - T > 13.0, 'masta %.1f m over vannet' % (ZTOP - T)),
        (ZB - (H.zd(0.55) + 0.45) > 1.0, 'bommen %.1f m over ruftaket' % (ZB - (H.zd(0.55) + 0.45)))], cb=(0.25, 0.50), what='skroget uten kjølen', disp=(2.5, 6.0))

if __name__ == '__main__':
    run(sys.modules[__name__])
