"""The wardrobe for the people of the game (Jonas 10.10.2026: character customisation, hair, beards, hats, jackets, trousers, shoes, and
the crew in the same clothes so nobody looks alike). Built on top of arbeider.py (same scene, same frames, same materials): arbeider.main()
calls build(A) and exports what it returns into the same GLB (src/data/worker.b64).

Paint zones (the game paints them per look, vessel3d.js wkPart): 1 jacket, 3 trousers, 4 skin, 5 hair (and the brows and the beard),
6 the hat, 7 the shoes. Everything here is plain garments: no brands, no logos.

Parts, each as (name, object, origin): origin 'neck' (hair, beard, hats: the base of the neck, 1.50 m up), 'hip' (jackets: the middle of
the hips, 0.92 m up), 'ground' (shoes: the ground under the ankle), 'wrist' (a bare hand).
  hair_*   short, side (side-swept fringe), mid (over the ears), long, pony, braid, bun, curl, ring (the sides and the back only), none
  b_*      beard: stache, goat, short, full, mutton (sideburns and a moustache)
  hat_*    bobble, flat (a flat cap), bucket (a rain hat with a brim), ball (a ball cap); the hard hat, the beanie and the skipper's cap are
           in arbeider.py
  torso/sweater (arbeider.py) + oilskin, parka, fleece; each also as <name>F for the woman's body
  shoe, sneaker (the boot is in arbeider.py)
  handbare"""
import math
from bpyutil import *


def tilt_hat(o, k=0.36, y0=-0.01, lift=0.016):
    """a hat sits tilted back on the head: the front rim rises above the brows and the eyes (Jonas 10.10.2026: «hvorfor dekker alle luene og
    hattene øynene?») and the back comes down a little. A shear in z (z += k * (y - y0)), not a turn: a turn pulled the back of the hat in
    against the head, and the hair and the head came through it. The widths stay as they were."""
    me = o.data
    for v in me.vertices: v.co.z += k * (v.co.y - y0) + lift      # the lift keeps the crown above the top of the skull where the shear lowers it
    me.update()
    return o


def build(A):
    C = A.C; HEAD, HN, TORSO, TN = A.HEAD, A.HN, A.TORSO, A.TN
    fy = lambda x, z, off=0.0: A.surf(HEAD, HN, x, z, off)[1]
    out = []
    H = C['hair']

    def add(name, objs, origin):
        o = join(objs, name.upper())
        if name.startswith('hat_'): tilt_hat(o)
        out.append((name, o, origin))

    # ---------------- hair ----------------
    cap = lambda s=1.0, y=-0.012, z=1.715: sphere('cap', (0, y, z), 1.0, H, (0.087 * s, 0.103 * s, 0.075 * s), 18, 10)
    add('hair_short', [cap()], 'neck')
    add('hair_side', [cap(1.02), sphere('fringe', (0.026, 0.060, 1.744), 1.0, H, (0.056, 0.032, 0.022), 12, 8),
                      sphere('fringe2', (-0.03, 0.050, 1.750), 1.0, H, (0.04, 0.03, 0.018), 10, 6)], 'neck')
    mid = lambda: [cap(1.0), sphere('capm', (0, -0.04, 1.665), 1.0, H, (0.086, 0.085, 0.085), 16, 10),
                   sphere('back', (0, -0.06, 1.60), 1.0, H, (0.080, 0.050, 0.070), 14, 8)] + \
                  [sphere('side%d' % s, (s * 0.075, -0.012, 1.635), 1.0, H, (0.016, 0.032, 0.046), 8, 6) for s in (-1, 1)]
    add('hair_mid', mid(), 'neck')
    add('hair_long', mid() + [sphere('panel', (0, -0.078, 1.50), 1.0, H, (0.082, 0.050, 0.14), 14, 8), sphere('panel2', (0, -0.066, 1.575), 1.0, H, (0.088, 0.055, 0.09), 14, 8)] +
        [sphere('lock%d' % s, (s * 0.080, -0.022, 1.575), 1.0, H, (0.014, 0.040, 0.09), 8, 6) for s in (-1, 1)], 'neck')
    add('hair_pony', [cap(1.01), sphere('tie', (0, -0.105, 1.685), 0.02, H, (1.2, 1.2, 1.2), 8, 6),
                      tube('tail', [(0, -0.108, 1.682), (0, -0.14, 1.625), (0, -0.152, 1.55), (0, -0.145, 1.475)], 0.026, H, 8),
                      sphere('tip', (0, -0.145, 1.468), 0.024, H, (1, 1, 1.4), 8, 6)], 'neck')
    add('hair_braid', [cap(1.01)] + [sphere('b%d' % k, (0.005 * (-1) ** k, -0.108 - 0.006 * k, 1.665 - 0.040 * k), 1.0, H, (0.024, 0.021, 0.033), 8, 6) for k in range(7)], 'neck')
    add('hair_bun', [cap(1.01), sphere('bun', (0, -0.075, 1.775), 0.042, H, (1.0, 1.0, 0.9), 12, 8)], 'neck')
    bumps = []
    cx, cy, cz, ra, rb, rc = 0.0, -0.012, 1.715, 0.087 * 1.02, 0.103 * 1.02, 0.075 * 1.02      # the cap's ellipsoid; the curls sit on its surface, half in it
    # the curls round the head: at the back and the sides they run down to the nape; at the front the lowest are well above the brows and the eyes
    for phi, n in ((-0.30, 14), (0.15, 14), (0.60, 10), (1.00, 6)):
        for k in range(n):
            th = 2 * math.pi * (k + (0.5 if phi > 0.1 else 0.0)) / n
            if math.sin(th) > 0.12 and phi < 0.34: continue      # the front: no curl below the hairline
            bumps.append(sphere('bump', (cx + ra * math.cos(phi) * math.cos(th), cy + rb * math.cos(phi) * math.sin(th), cz + rc * math.sin(phi)), 0.026, H, (1, 1, 1), 8, 6))
    for k in range(7):          # the fringe: a row of curls on the hairline, clear of the brows
        th = math.pi * (0.18 + 0.64 * k / 6); phi = 0.40
        bumps.append(sphere('bumpf', (cx + ra * math.cos(phi) * math.cos(th), cy + rb * math.cos(phi) * math.sin(th), cz + rc * math.sin(phi)), 0.025, H, (1, 1, 1), 8, 6))
    bumps.append(sphere('bumpt', (0, cy, cz + rc), 0.030, H, (1, 1, 1), 8, 6))
    add('hair_curl', [cap(1.02)] + bumps, 'neck')
    def head_at(z):
        """the head's own width, depth and centre at a height: what the hair under a hat is laid on"""
        return A.lerp_lv(HEAD, z)
    def ring_obj(low=False):
        """the band of hair at the sides and the back, on the head's own surface (3 mm off it); its top edge is lower at the sides than at the back.
        low: it runs on down the nape to 1.575 at the back, so what hangs from it (a bun, a tail, a braid, curls) has hair to sit on"""
        G = []; fr = (0.0, 0.25, 0.55, 0.8, 1.0) if not low else (0.0, 0.16, 0.34, 0.55, 0.78, 1.0)
        for f in fr:
            row = []
            for k in range(15):
                u = k / 14.0; ext = 0.02; t_ = math.pi - ext + (math.pi + 2 * ext) * u; back = math.sin(math.pi * u)        # 1 at the middle of the back, 0 at the sides
                zt = 1.700 - 0.045 * (1 - back) ** 1.3                                                  # the top edge
                zb = (1.575 + 0.035 * (1 - back) ** 0.7) if low else 1.610                                # the bottom edge (the nape, lower at the back)
                z = zb + (zt - zb) * f; a_, b_, yc_ = head_at(z); x, y = A.sell(a_ + 0.003, b_ + 0.003, HN, t_); row.append((x, y + yc_, z))
            G.append(row)
        r = grid('ring', G, lambda i, j: H, angle=50, out=lambda c: (c[0], c[1] + 0.012, 0.0)); solidify(r, 0.003); return r
    def back_at(z, embed=0.012):
        """the y of the hair band's back at a height, a little inside it: where something hanging from the hair starts"""
        a_, b_, yc_ = head_at(z); return yc_ - b_ - 0.003 + embed
    add('hair_ring', [ring_obj()], 'neck')

    # the same styles under a hat (hair_<style>_h): nothing on top of the head, only the band at the sides and the back, and what hangs
    # below the rim, so no hair reaches through a hat (garderobe_bilder.py counts the triangles that cross, per hat and style, and that
    # everything hangs together: every part of a style touches the band). The band runs down the nape for the styles with something hanging.
    def tail_obj(path, radii):
        rg = []
        for (y, z), r in zip(path, radii):
            rg.append([(r * math.cos(2 * math.pi * k / 10), y + r * 0.9 * math.sin(2 * math.pi * k / 10), z) for k in range(10)])
        return loft_rings('tail', rg, H, True, True, 50)
    add('hair_short_h', [ring_obj()], 'neck')
    add('hair_side_h', [ring_obj()], 'neck')
    add('hair_mid_h', [ring_obj(True), sphere('back', (0, back_at(1.585, 0.03), 1.592), 1.0, H, (0.078, 0.046, 0.034), 14, 8)] +
        [sphere('side%d' % s, (s * 0.074, -0.014, 1.622), 1.0, H, (0.016, 0.034, 0.030), 8, 6) for s in (-1, 1)], 'neck')
    add('hair_long_h', [ring_obj(True), sphere('back', (0, back_at(1.585, 0.03), 1.592), 1.0, H, (0.078, 0.046, 0.034), 14, 8), sphere('panel', (0, -0.080, 1.52), 1.0, H, (0.080, 0.046, 0.085), 14, 8),
                        sphere('panel2', (0, -0.072, 1.565), 1.0, H, (0.084, 0.050, 0.050), 14, 8)] +
        [sphere('lock%d' % s, (s * 0.078, -0.026, 1.56), 1.0, H, (0.014, 0.040, 0.060), 8, 6) for s in (-1, 1)], 'neck')
    yb = back_at(1.60)
    add('hair_pony_h', [ring_obj(True), tail_obj([(yb + 0.004, 1.612), (yb - 0.010, 1.595), (yb - 0.040, 1.56), (yb - 0.062, 1.51), (yb - 0.058, 1.46), (yb - 0.054, 1.44)], [0.012, 0.020, 0.027, 0.025, 0.016, 0.006])], 'neck')
    add('hair_braid_h', [ring_obj(True)] + [sphere('b%d' % k, (0.004 * (-1) ** k, yb - 0.004 - 0.009 * k, 1.612 - 0.036 * k), 1.0, H, (0.016 + 0.002 * min(k, 4), 0.016 + 0.002 * min(k, 4), 0.030), 8, 6) for k in range(7)], 'neck')
    add('hair_bun_h', [ring_obj(True), sphere('bun', (0, back_at(1.585, -0.012) - 0.02, 1.583), 0.036, H, (1.0, 1.0, 0.9), 12, 8)], 'neck')
    def curl_bump(k):
        a_ = math.pi - 0.15 + (math.pi + 0.3) * k / 8
        rim = 1.642 + 0.36 * ((head_at(1.63)[2] + (head_at(1.63)[1] + 0.003) * math.sin(a_)) + 0.01)       # the lowest rim of the hats there (z 1.65 less a margin, sheared as the hats are)
        z = rim - 0.030 + 0.006 * ((k % 2) - 0.5); aa, bb, yy = head_at(z)
        return sphere('bump%d' % k, ((aa + 0.003) * math.cos(a_), yy + (bb + 0.003) * math.sin(a_), z), 0.021, H, (1, 1, 1), 8, 6)       # centred on the band's surface: half in it
    add('hair_curl_h', [ring_obj(True)] + [curl_bump(k) for k in range(9)], 'neck')

    # ---------------- beards and moustaches ----------------
    def stache(k=1.0, drop=0.0):
        o = []
        for s in (-1, 1):
            o.append(sphere('st%d' % s, (s * 0.015, fy(s * 0.015, 1.612) + 0.002, 1.612), 1.0, H, (0.019 * k, 0.009 * k, 0.0075 * k), 8, 5))
            o.append(sphere('sd%d' % s, (s * 0.028, fy(s * 0.028, 1.606 - drop) + 0.002, 1.606 - drop), 1.0, H, (0.012 * k, 0.008 * k, 0.012 * k + drop * 0.4), 8, 5))
        return o
    def shell(name, zs, tr, off, hole=None, nk=14):
        """a beard laid on the head's own surface: rows at heights zs, each from tr(z)[0] to tr(z)[1] (the angle round the head: pi/2 is the
        front), pushed off by off(z); hole(x, z) leaves a cell open (the mouth, the lip)"""
        Gs = []
        for z in zs:
            a, b, yc = A.lerp_lv(HEAD, z); t0, t1 = tr(z); o = off(z) if callable(off) else off
            row = []
            for k in range(nk + 1):
                tt = t0 + (t1 - t0) * k / nk; x, y = A.sell(a + o, b + o, HN, tt); row.append((x, y + yc, z))
            Gs.append(row)
        def mf(i, j):
            if hole:
                cx = sum(Gs[r][c][0] for r in (i, i + 1) for c in (j, j + 1)) / 4; cz = (Gs[i][0][2] + Gs[i + 1][0][2]) / 2
                if hole(cx, cz): return None
            return H
        mo = max((off(z) if callable(off) else off) for z in zs)
        o = grid(name, Gs, mf, angle=60, out=lambda c: (c[0], c[1] + 0.012, 0.0)); solidify(o, mo + 0.0015); return o       # thick enough that its inner face is inside the skin: it sits on the face, not 4 mm off it
    mouth = lambda x, z: (1.582 < z < 1.606 and abs(x) < 0.030) or (z >= 1.606 and abs(x) < 0.055 + (z - 1.606) * 0.5)
    add('b_stache', stache(), 'neck')
    add('b_goat', stache(0.9) + [sphere('chin', (0, fy(0, 1.566) + 0.004, 1.558), 1.0, H, (0.022, 0.016, 0.028), 10, 6), sphere('lip', (0, fy(0, 1.585) + 0.003, 1.586), 1.0, H, (0.011, 0.006, 0.008), 8, 5)], 'neck')
    zs = [1.548, 1.560, 1.575, 1.590, 1.605, 1.620, 1.636, 1.652]
    add('b_short', [shell('sh', zs[:5], lambda z: (0.12 * math.pi, 0.88 * math.pi), 0.0035, mouth)] + stache(1.0), 'neck')
    hang = loft_rings('hang', A.rings([(1.58, 0.050, 0.045, 0.030), (1.55, 0.050, 0.050, 0.040), (1.52, 0.040, 0.045, 0.045), (1.49, 0.020, 0.030, 0.045), (1.475, 0.006, 0.012, 0.045)], 14, 2.2), H, True, True, 50)
    add('b_full', [shell('fu', zs, lambda z: (0.06 * math.pi, 0.94 * math.pi), lambda z: 0.0085 + 0.004 * max(0.0, 1.57 - z) / 0.02, mouth, 18), hang] + stache(1.25, 0.008), 'neck')
    add('b_mutton', [shell('muR', zs[2:], lambda z: (0.03 * math.pi, 0.20 * math.pi), 0.007), shell('muL', zs[2:], lambda z: (0.80 * math.pi, 0.97 * math.pi), 0.007)] + stache(1.2), 'neck')

    # ---------------- hats (zone 6, all in the colour of C['beanie']) ----------------
    HT = C['beanie']
    def peak(depth, drop, y_front=0.0):
        a, b, yc, z0 = 0.088, 0.110, -0.008, 1.662
        Gp = []
        for k in range(13):
            t = math.pi * (0.1 + 0.8 * k / 12); x, y = A.sell(a, b, 2.3, t); y += yc; d = depth * math.sin(t) ** 0.7
            Gp.append([(x, y - 0.002, z0 + 0.004), (x + math.cos(t) * d, y + math.sin(t) * d, z0 - drop)])
        pk = grid('peak', Gp, lambda i, j: HT, angle=50, out=lambda c: (0, 0.3, 1)); solidify(pk, 0.004); return pk
    lv = [(1.650, 0.092, 0.114, -0.012), (1.698, 0.092, 0.114, -0.012), (1.700, 0.087, 0.109, -0.013), (1.745, 0.082, 0.103, -0.016), (1.777, 0.062, 0.080, -0.017), (1.796, 0.022, 0.030, -0.018)]
    add('hat_bobble', [loft_rings('bn', A.rings(lv, 18, 2.2), HT, True, True, 50), sphere('pom', (0, -0.018, 1.822), 0.034, HT, (1, 1, 1), 12, 8)], 'neck')
    lv = [(1.655, 0.088, 0.110, -0.008), (1.690, 0.092, 0.114, -0.005), (1.730, 0.102, 0.126, 0.0), (1.768, 0.106, 0.131, 0.004), (1.786, 0.090, 0.112, 0.004), (1.792, 0.030, 0.040, 0.003)]
    add('hat_flat', [loft_rings('fl', A.rings(lv, 24, 2.3), HT, True, True, 40), peak(0.05, 0.012)], 'neck')
    lv = [(1.655, 0.088, 0.110, -0.008), (1.700, 0.090, 0.113, -0.006), (1.740, 0.088, 0.113, -0.004), (1.775, 0.070, 0.092, -0.004), (1.792, 0.022, 0.030, -0.004)]
    add('hat_ball', [loft_rings('bl', A.rings(lv, 24, 2.3), HT, True, True, 40), peak(0.072, 0.02), sphere('btn', (0, -0.004, 1.795), 0.009, HT, (1, 1, 1), 8, 5)], 'neck')
    lv = [(1.660, 0.088, 0.110, -0.010), (1.700, 0.090, 0.112, -0.010), (1.745, 0.084, 0.106, -0.012), (1.775, 0.060, 0.076, -0.013), (1.790, 0.020, 0.026, -0.013)]
    Gb = []
    for k in range(25):
        t = 2 * math.pi * k / 24; back = max(0.0, -math.sin(t)); ca, sa = math.cos(t), math.sin(t)
        xi, yi = 0.086 * ca, -0.010 + 0.108 * sa          # the crown's own rim (a little inside it), so the brim meets the crown with no gap
        ext = 0.060 + 0.062 * back; nx_, ny_ = ca, 1.15 * sa; nl = math.hypot(nx_, ny_)
        Gb.append([(xi, yi, 1.664), (xi + nx_ / nl * ext, yi + ny_ / nl * ext, 1.664 - 0.010 - 0.075 * back)])
    br = grid('brim', Gb, lambda i, j: HT, angle=40, out=lambda c: (0, 0, 1)); solidify(br, 0.005)
    add('hat_bucket', [loft_rings('bk', A.rings(lv, 24, 2.3), HT, True, True, 40), br], 'neck')

    # ---------------- jackets: levels for the man (arbeider's TORSO) and the woman; oilskin, parka, fleece ----------------
    TF = [(0.79, 0.12, 0.08, -0.01), (0.83, 0.17, 0.10, -0.012), (0.90, 0.192, 0.112, -0.015), (0.99, 0.166, 0.106, -0.005), (1.07, 0.140, 0.100, 0.004),
          (1.17, 0.156, 0.108, 0.010), (1.27, 0.176, 0.114, 0.012), (1.35, 0.186, 0.106, 0.004), (1.415, 0.170, 0.092, -0.006), (1.465, 0.115, 0.075, -0.010), (1.50, 0.062, 0.058, -0.010)]
    def bust(z, t):
        return 0.020 * math.exp(-((z - 1.25) / 0.05) ** 2) * max(0.0, math.sin(t)) ** 2 * math.exp(-((abs(math.cos(t)) - 0.42) / 0.28) ** 2)
    def shape(L, k=0.0, f=False):
        """the levels widened by k (loose clothes)"""
        return [(z, a + (k if z > 0.85 else 0.0), b + (k * 0.7 if z > 0.85 else 0.0), yc) for z, a, b, yc in L]
    def jacket(kind, f):
        L = TF if f else TORSO; bu = bust if f else None
        if kind == 'oilskin':
            L = [(0.76, 0.192, 0.128, -0.012)] + shape(L, 0.016); cut = 2
        elif kind == 'parka':
            L = shape(L, 0.012); cut = 3
        else: cut = 3
        bg = bu
        if kind == 'parka':
            bg = (lambda z, t: (bu(z, t) if bu else 0.0) + 0.011 * math.sin(z * 95))
        top = loft_rings('top', A.rings(L[cut:], 20, TN, bg), C['suit'], False, True, 50 if kind != 'parka' else 40)
        seat = loft_rings('seat', A.rings(L[:cut + 1], 20, TN), C['trou'], True, False, 50)
        o = [top, seat] + [sphere('delt%d' % s, (s * (0.188 + (0.016 if kind != 'fleece' else 0.0)), -0.004, 1.382), 0.058, C['suit'], (1.0, 1.2, 1.0), 12, 8) for s in (-1, 1)]
        if kind == 'oilskin':
            o.append(torus('collar', (0, -0.006, 1.484), (0, 0, 1), 0.092, 0.03, C['suit'], 18, 6))
            o.append(patch2(L, TN, 'placket', -0.012, 0.012, 0.86, 1.46, 0.006, C['zip']))
            for zz in (0.95, 1.10, 1.25, 1.38): o.append(sphere('bt%d' % int(zz * 100), (0, A.surf(L, TN, 0, zz, 0.012)[1], zz), 0.011, C['wool'], (1, 0.6, 1), 8, 5))
        elif kind == 'parka':
            o.append(torus('hood', (0, -0.02, 1.49), (0, 0, 1), 0.104, 0.038, C['suit'], 18, 8))
            o.append(sphere('hoodb', (0, -0.075, 1.50), 1.0, C['suit'], (0.092, 0.060, 0.075), 12, 8))
            o.append(patch2(L, TN, 'zip', -0.007, 0.007, 0.96, 1.45, 0.016, C['zip']))
        elif kind == 'fleece':
            o.append(cyl('stand', (0, -0.011, 1.455), (0, -0.011, 1.52), 0.072, C['suit'], 18, r1=0.066))
            o.append(patch2(L, TN, 'zip', -0.007, 0.007, 0.96, 1.50, 0.004, C['zip']))
            o.append(patch2(L, TN, 'pocket', 0.035, 0.12, 1.22, 1.32, 0.005, C['suit']))
        return o
    def patch2(L, n, name, x0, x1, z0, z1, off, m):
        return A.patch(name, L, n, x0, x1, z0, z1, off, m, 1 if x1 - x0 < 0.03 else 4, 6)
    for kind in ('oilskin', 'parka', 'fleece'):
        add(kind, jacket(kind, False), 'hip')
    for kind in ('jacket', 'oilskin', 'parka', 'fleece', 'sweater'):
        add(kind + 'F', jacket_f(A, kind, TF, bust, jacket) if kind in ('jacket', 'sweater') else jacket(kind, True), 'hip')

    # ---------------- shoes (zone 7) ----------------
    SH = C['boot']; SO = C['sole']
    def foot(ht, wid, toe=0.0):
        lv = [(-0.085, 0.030, 0.040), (-0.07, 0.048, 0.072), (0.0, 0.052, 0.095), (0.08, 0.054, 0.085), (0.14, 0.052, 0.070), (0.18, 0.044, 0.055), (0.20, 0.030, 0.042), (0.21, 0.012, 0.032)]
        rs = [[(r * wid * math.cos(t), y, 0.022 + (min(h, ht) - 0.022) * max(0.0, math.sin(t)) ** 0.8) for t in [2 * math.pi * k / 14 for k in range(14)]] for y, r, h in lv]
        return loft_rings('foot', rs, SH, True, True, 50)
    add('shoe', [cyl('cuff', (0, -0.01, 0.03), (0, -0.01, 0.075), 0.060, SH, 12, r1=0.058), foot(0.08, 1.0),
                 box('sole', -0.056, 0.056, -0.09, 0.205, 0.0, 0.020, SO, 0.006), box('heel', -0.054, 0.054, -0.09, -0.01, 0.0, 0.030, SO, 0.005)], 'ground')
    add('sneaker', [cyl('cuff', (0, -0.01, 0.035), (0, -0.01, 0.085), 0.058, SH, 12, r1=0.056), foot(0.085, 1.04),
                    box('sole', -0.058, 0.058, -0.092, 0.208, 0.0, 0.032, C['cream'], 0.010), sphere('toe', (0, 0.17, 0.05), 1.0, C['cream'], (0.045, 0.045, 0.03), 10, 6)], 'ground')

    # ---------------- a bare hand ----------------
    SK = C['skin']
    lvh = [(0.03, 0.040, 0.022, 0.0), (0.06, 0.046, 0.024, 0.0), (0.10, 0.044, 0.021, 0.0), (0.135, 0.038, 0.018, 0.0), (0.155, 0.026, 0.012, 0.0)]
    add('handbare', [cyl('wrist', (0, 0, -0.01), (0, 0, 0.035), 0.040, SK, 12), loft_rings('palm', A.rings(lvh, 12, 2.6), SK, True, True, 50), cyl('thumb', (0.03, 0.006, 0.05), (0.052, 0.022, 0.10), 0.014, SK, 8)], 'wrist')
    return out


def jacket_f(A, kind, TF, bust, jacket):
    """the woman's work jacket and knitted sweater: the shared builders of arbeider.py, on her levels"""
    C = A.C; TN = A.TN
    if kind == 'jacket':
        L = TF
        o = [loft_rings('torso', A.rings(L[3:], 20, TN, bust), C['suit'], False, True, 50), loft_rings('seat', A.rings(L[:4], 20, TN), C['trou'], True, False, 50)]
        for s in (-1, 1): o.append(sphere('delt%d' % s, (s * 0.186, -0.004, 1.382), 0.058, C['suit'], (1.0, 1.2, 1.0), 12, 8))
        o.append(torus('collar', (0, -0.012, 1.478), (0, 0, 1), 0.078, 0.02, C['suit'], 18, 6))
        o.append(sphere('collar_f', (0, 0.045, 1.455), 0.04, C['suit'], (1.4, 0.5, 0.9), 10, 6))
        o.append(A.patch('zip', L, TN, -0.007, 0.007, 0.96, 1.45, 0.014, C['zip'], 1, 6))
        for s in (-1, 1):
            x0, x1 = (0.04, 0.12) if s > 0 else (-0.12, -0.04)
            o.append(A.patch('flap%d' % s, L, TN, x0, x1, 0.99, 1.03, 0.012, C['suit'], 4, 1))
        return o
    L = TF
    o = [loft_rings('body', A.rings(L[3:], 20, TN, bust), C['suit'], False, True, 50), loft_rings('seat', A.rings(L[:4], 20, TN), C['trou'], True, False, 50)]
    for s in (-1, 1): o.append(sphere('delt%d' % s, (s * 0.186, -0.004, 1.382), 0.058, C['suit'], (1.0, 1.2, 1.0), 12, 8))
    for k, (z0, z1) in enumerate(((1.446, 1.462), (1.462, 1.474), (1.474, 1.486), (1.486, 1.498), (1.498, 1.512))):
        o.append(cyl('neck%d' % k, (0, -0.011, z0), (0, -0.011, z1), 0.074 - 0.002 * k, C['cream'] if k % 2 == 0 else C['suit'], 18))
    o.append(loft_rings('rib', A.rings([(0.95, 0.164, 0.108, -0.004), (1.01, 0.158, 0.104, -0.002)], 20, TN), C['suit'], True, True))
    return o
