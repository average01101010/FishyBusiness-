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


# ---------------- the inflatable lifejacket (Ø11.4, 06.11.2026) ----------------
# Jonas' references 28.10.2026 (three shop pictures, described in docs/planer/lover-og-regler.md L6; not in the repo): a collar round the
# neck that runs down the front of the chest in two thick, rounded tubes with a zip along their inner edges, red or orange; a black belt
# round the waist with a plastic buckle in the middle at the front; a black crotch strap; a red pull handle (a drop) hanging under the
# left side. An inflatable 150-165 N work vest folded in its cover (ISO 12402-3 is the 150 N class; the sizes are my own: the tubes 76 mm
# wide and 34 mm thick, the collar 70 mm wide, the belt 40 mm, the crotch strap 25 mm). No brand, no logo, no light and no transmitter
# (V10 C: no PLB or AIS-MOB on the vest; an inflatable's light sits inside the cover until it inflates). Two patches of retro-reflective
# tape on the chest and one on the collar at the back.
# It is worn over the jacket, so it is made for each kind of jacket (laid on its outermost surface 3 mm off it: the pockets, the zip, the
# collar, the hood): 'vest' over the work jacket, the sweater and the fleece (the man's body), 'vest_o' over the oilskin, 'vest_p' over
# the parka, and the same on the woman's body with F. Not over the flotation suit (it counts as a buoyancy aid: Ø11.5 draws no vest then).
# The hair: long hair, a ponytail and a braid are put up in a bun under the vest (VEST_HAIR; on deck long hair is tied up, and the vest's
# collar lies where it hangs); under the rain hat the bun is the medium cut as before.
VEST_GROUPS = [('vest', ['torso', 'sweater', 'fleece'], 0.138), ('vest_o', ['oilskin'], 0.162), ('vest_p', ['parka'], 0.182),
               ('vestF', ['jacketF', 'sweaterF', 'fleeceF'], 0.138), ('vest_oF', ['oilskinF'], 0.162), ('vest_pF', ['parkaF'], 0.182)]
VEST_FOR = {j: v for v, js, _ in VEST_GROUPS for j in js}
VEST_ON = {v: js[0] for v, js, _ in VEST_GROUPS}         # the jacket each is shaded on
VEST_HAIR = {'long': 'bun', 'pony': 'bun', 'braid': 'bun'}


def bvh_of(objs):
    from mathutils.bvhtree import BVHTree
    vs, polys = [], []
    for o in objs:
        me = o.data; M = o.matrix_world; n0 = len(vs)
        vs += [M @ v.co for v in me.vertices]; polys += [tuple(n0 + i for i in p.vertices) for p in me.polygons]
    return BVHTree.FromPolygons(vs, polys)


def vests(A, P, W):
    """the vests, each laid on its jackets and the head: [(name, object, 'hip')]"""
    out = []
    for name, js, rc in VEST_GROUPS:
        out.append((name, vest(A, name, [P[j] if j in P else W[j] for j in js] + [P['head']], rc), 'hip'))
    return out


def vest(A, name, obst, RC, neck_y=-0.012):
    """one vest over the obstacles (its jackets and the head). RC: the collar's middle from the neck's axis, clear of the jackets' own
    collars (the work jacket's 0.098, the oilskin's 0.122, the parka's rolled hood 0.142, and 4 cm more)"""
    C = A.C; GAP = 0.003
    RED = mat('vest', (0.80, 0.11, 0.08), 0.35); ZIPV = mat('vest_zip', (0.08, 0.08, 0.09), 0.45); REFL = C['refl']
    BELT = C['harness']; BUCK = mat('vest_buckle', (0.15, 0.15, 0.16), 0.5); TOG = mat('vest_toggle', (0.86, 0.10, 0.06), 0.6)
    tree = [bvh_of(obst)]
    def cast(p, n, far=0.32):
        """the outermost surface met coming in along -n towards p (from p + n far): the point, or None"""
        n = V(n).normalized(); h = tree[0].ray_cast(V(p) + n * far, -n, far * 2)
        return h[0]
    def env(p, n, da, db):
        """the outermost surface over a patch round p (p + da * i + db * j, i and j from -1 to 1), brought back onto the ray through p: with
        da and db the spacing to the neighbours, a face between two such points never dips into something narrow that lies between them
        (a button, a zip, a pocket's flap)"""
        n = V(n).normalized(); best = None
        for i in (-1, -0.5, 0, 0.5, 1):
            for j in (-1, -0.5, 0, 0.5, 1):
                h = cast(V(p) + da * i + db * j, n)
                if h is not None:
                    d = (h - V(p)).dot(n)
                    if best is None or d > best: best = d
        return None if best is None else V(p) + n * best
    NECK = V((0, neck_y, 0))       # (the new body of kropp_bygg.py has its neck further back: it passes its own)
    # ---- the belt: a 40 mm band round the waist, 3 mm off the outermost surface over its height ----
    B = Acc(name + '_belt'); zb0, zb1 = 1.088, 1.128; NB = 56; RB = []
    for k in range(NB):
        a = 2 * math.pi * k / NB; d = V((math.cos(a), math.sin(a), 0)); r = 0.0
        for q in range(-4, 5):                     # (the outermost from the segment before to the one after: the faces between never dip)
            aq = a + q * math.pi / NB / 2; dq = V((math.cos(aq), math.sin(aq), 0))
            for z in [zb0 + (zb1 - zb0) * q2 / 6 for q2 in range(7)]:
                h = cast(V((0, -0.004, z)), dq)
                if h is not None: r = max(r, (h - V((0, -0.004, z))).dot(d))
        RB.append((d, r + GAP))
    rows = [[B.v(V((0, -0.004, z)) + d * (r + dr)) for d, r in RB] for z, dr in ((zb0, 0.0), (zb1, 0.0), (zb1, 0.0035), (zb0, 0.0035))]
    for k in range(NB):
        k1 = (k + 1) % NB; d = RB[k][0]
        for (i, j, out) in ((3, 2, d), (0, 1, -d), (1, 2, V((0, 0, 1))), (3, 0, V((0, 0, -1)))):
            B.f([rows[i][k], rows[i][k1], rows[j][k1], rows[j][k]], BELT, out)
    # the buckle at the front: two halves meeting in the middle, the release tabs at their sides
    d, r = RB[NB // 4]; fc = V((0, -0.004, (zb0 + zb1) / 2)) + d * (r + 0.0035)
    for sx in (-1, 1):
        obox(B, fc + V((sx * 0.0155, 0.0055, 0)), V((0.0145, 0, 0)), V((0, 0.0055, 0)), V((0, 0, 0.021)), BUCK)
        obox(B, fc + V((sx * 0.033, 0.004, 0)), V((0.004, 0, 0)), V((0, 0.004, 0)), V((0, 0, 0.012)), BUCK)
    belt = B.done(40); tree[0] = bvh_of(obst + [belt])
    # ---- the collar and the two tubes: one strip from the left tube's foot, round the back of the neck, to the right tube's foot ----
    def half():
        """the right half from the tube's foot to the middle of the back: [(target, outward direction, width, thickness)]. The tube runs
        up the chest to where it meets a circle round the neck at RC from its axis (clear of the jacket's own collar or hood); from there
        it sweeps round the neck on that circle to the middle of the back, the rays turning smoothly from the chest's front (nearly level)
        over the shoulder (from above) to the back (from behind and above)"""
        G = []; yf = 0.112; xt = math.sqrt(max(0.0, RC * RC - yf * yf)); ph0 = math.atan2(yf, xt)
        for k in range(10):                          # the tube up the chest from its foot on the belt
            f = k / 9; z = 1.105 + 0.27 * f; x = 0.074 + (xt - 0.074) * f ** 1.4
            G.append((V((x, 0.0, z)), V((0.0, 1.0, 0.0)), 0.076, 0.034))
        n0 = 18
        for k in range(1, n0 + 1):                   # round the neck from ph0 to the middle of the back
            f = k / n0; ph = ph0 - (ph0 + math.pi / 2) * f
            fs = min(1.0, (ph0 - ph) / ph0) if ph >= 0 else 1.0           # 0 at the chest's top, 1 on top of the shoulder
            fb = max(0.0, -ph / (math.pi / 2))                             # 0 on top of the shoulder, 1 at the middle of the back
            gam = math.radians(4 + 86 * (0.5 - 0.5 * math.cos(math.pi * fs)) - 60 * (0.5 - 0.5 * math.cos(math.pi * fb)))
            radial = V((math.cos(ph), math.sin(ph), 0.0)); level = V((0.0, 1.0, 0.0)).lerp(radial, min(1.0, fs * 2.0)).normalized() if ph >= 0 else radial
            w = 0.076 - 0.006 * min(1.0, f * 3); t = 0.034 - 0.003 * min(1.0, f * 3)
            G.append((NECK + V((RC * math.cos(ph), RC * math.sin(ph), 1.40 + 0.03 * min(1.0, fs + fb))), (level * math.cos(gam) + V((0, 0, math.sin(gam)))).normalized(), w, t))
        return G
    R = half(); L = [(V((-p.x, p.y, p.z)), V((-n.x, n.y, n.z)), w, t) for p, n, w, t in R]
    G = L + list(reversed(R))[1:]
    # the centre line: the rays' hits, then smoothed (twice) and laid on the surface again, the directions smoothed too
    ns = len(G); NN = [n.normalized() for p, n, w, t in G]
    for _ in range(2): NN = [(NN[max(0, i - 1)] + NN[i] * 2 + NN[min(ns - 1, i + 1)]).normalized() for i in range(ns)]
    H = [cast(p, n) or p for (p, _, _, _), n in zip(G, NN)]
    for _ in range(2):
        Hs = [H[0]] + [(H[i - 1] + H[i] * 2 + H[i + 1]) / 4 for i in range(1, ns - 1)] + [H[-1]]
        H = [cast(q, n) or q for q, n in zip(Hs, NN)]
    S = Acc(name + '_tubes'); K = 7
    def thick(u, t): return 0.0035 + t * max(0.0, 1 - abs(u) ** 2.4) ** (1 / 2.4)
    # each vertex of the inner face on the outermost surface over its patch (3 mm off); the outer face smoothed outwards (never in):
    # a stiff tube lies flat over a pocket's flap or a button, it does not follow them
    D = []; FR = []
    for i in range(ns):
        p, _, w, t = G[i]; n = NN[i]
        T = (H[min(ns - 1, i + 1)] - H[max(0, i - 1)]).normalized(); b = T.cross(n).normalized(); bn = n
        e = min(i, ns - 1 - i); sw, st = ((0.55, 0.45), (0.85, 0.80), (0.97, 0.95))[e] if e < 3 else (1.0, 1.0)
        da = T * max((H[min(ns - 1, i + 1)] - H[i]).length, (H[i] - H[max(0, i - 1)]).length); db = b * (w * sw / (K - 1))
        row = []
        for k in range(K):
            u = -1 + 2 * k / (K - 1); base = H[i] + b * (u * w * sw / 2); q = env(base, n, da, db)
            row.append((q - base).dot(n) if q is not None else 0.0)
        D.append(row); FR.append((b, n, w * sw, t * st))
    OD = [r[:] for r in D]
    for _ in range(3):
        OD = [[max(OD[i][k], (OD[i][max(0, k - 1)] + OD[i][min(K - 1, k + 1)] + OD[max(0, i - 1)][k] + OD[min(ns - 1, i + 1)][k]) / 4) for k in range(K)] for i in range(ns)]
    IN, OUT = [], []
    for i in range(ns):
        b, n, w, t = FR[i]; ri, ro = [], []
        for k in range(K):
            u = -1 + 2 * k / (K - 1); base = H[i] + b * (u * w / 2)
            ri.append(S.v(base + n * (D[i][k] + GAP))); ro.append(S.v(base + n * (OD[i][k] + GAP + thick(u, t))))
        IN.append(ri); OUT.append(ro)
    zc = [h.z for h in H]
    for i in range(ns - 1):
        for k in range(K - 1):
            front = H[i].y > 0.02 and 1.29 < zc[i] < 1.36; back = abs(H[i].x) < 0.03 and H[i].y < -0.05
            m = ZIPV if k == 0 else (REFL if (front or back) and 2 <= k <= 4 else RED)
            n = NN[i]
            S.f([OUT[i][k], OUT[i][k + 1], OUT[i + 1][k + 1], OUT[i + 1][k]], m, n)      # (no inner face: it lies 3 mm off the jacket, never seen)
        for k, sg in ((0, -1), (K - 1, 1)):
            S.f([IN[i][k], OUT[i][k], OUT[i + 1][k], IN[i + 1][k]], ZIPV if k == 0 else RED, FR[i][0] * sg)
    for i, sg in ((0, -1), (ns - 1, 1)):            # the tubes' feet, closed
        T = (H[min(ns - 1, i + 1)] - H[max(0, i - 1)]).normalized()
        S.f(IN[i] + list(reversed(OUT[i])), RED, T * sg)
    # ---- the pull handle: a short cord from the left tube's foot (the wearer's left, -x) and a red drop ----
    foot = (IN[0][K // 2].co + OUT[0][K // 2].co) / 2; ztop = foot.z - 0.035; zbot = ztop - 0.056
    yf = max((cast(V((foot.x, 0.0, z)), (0, 1, 0)) or V((0, 0.12, 0))).y for z in [zbot + (ztop - zbot) * q / 6 for q in range(7)])
    tc = V((foot.x, yf + 0.0135 + 0.004, ztop))
    revolve_drop(S, tc, TOG)
    thin_tube(S, [foot + V((0, 0.004, -0.004)), (foot + tc) / 2 + V((0, 0.003, 0)), tc], 0.0022, TOG)
    # ---- the crotch strap: from under the belt at the front, between the legs, up the back to the belt ----
    def outer(p, n, along):
        """the outermost over the strap's width (x) and half its spacing along (along: that vector), on the ray through p"""
        return env(p, n, V((0.0135, 0, 0)), along)
    ZC = 0.90; CC = V((0, -0.012, ZC)); pts = []
    for k in range(8):                                         # down the front from under the belt
        z = zb0 - 0.004 - (zb0 - 0.004 - ZC) * k / 8; h = outer(V((0, -0.012, z)), (0, 1, 0), V((0, 0, 0.026)))
        if h is not None: pts.append(h + V((0, GAP + 0.0015, 0)))
    for k in range(33):                                        # round the bottom: rays out from the seat's middle, front to back
        a = math.pi * k / 32; d = V((0, math.cos(a), -math.sin(a)))
        h = outer(CC, d, d.cross(V((1, 0, 0))).normalized() * 0.03)
        if h is not None: pts.append(h + d * (GAP + 0.009))           # (round a flat bottom's sharp edge, the oilskin's hem: more room)
    for k in range(1, 9):                                      # up the back to the belt
        z = ZC + (zb0 - 0.004 - ZC) * k / 8; h = outer(V((0, -0.012, z)), (0, -1, 0), V((0, 0, 0.026)))
        if h is not None: pts.append(h - V((0, GAP + 0.0015, 0)))
    ribbon(S, pts, V((1, 0, 0)), 0.025, 0.003, BELT)
    tubes = S.done(40)
    return join([belt, tubes], name.upper())


def revolve_drop(A, top, m):
    """the pull handle: a drop 56 mm long, 26 mm across, hanging from top"""
    prof = [(0.0, 0.0), (0.004, -0.002), (0.008, -0.010), (0.012, -0.026), (0.013, -0.036), (0.011, -0.047), (0.006, -0.054), (0.0, -0.056)]
    seg = 12; rings = []
    for r, h in prof:
        rings.append([A.v(top + V((r * math.cos(2 * math.pi * k / seg), 0.55 * r * math.sin(2 * math.pi * k / seg), h))) if r > 0 else A.v(top + V((0, 0, h))) for k in range(seg)] if r > 0 else A.v(top + V((0, 0, h))))
    for i in range(len(rings) - 1):
        a, b = rings[i], rings[i + 1]
        for k in range(seg):
            k1 = (k + 1) % seg
            if isinstance(a, list) and isinstance(b, list): q = [a[k], b[k], b[k1], a[k1]]
            elif isinstance(b, list): q = [a, b[k], b[k1]]
            else: q = [a[k], b, a[k1]]
            c = sum((v.co for v in q), V()) / len(q); A.f(q, m, c - (top + V((0, 0, c.z - top.z))))


def thin_tube(A, pts, r, m, seg=6):
    pts = [V(p) for p in pts]; R = []
    for i, p in enumerate(pts):
        d = (pts[min(len(pts) - 1, i + 1)] - pts[max(0, i - 1)]).normalized(); s, u, _ = frame_of(d)
        R.append([A.v(p + (s * math.cos(2 * math.pi * k / seg) + u * math.sin(2 * math.pi * k / seg)) * r) for k in range(seg)])
    for i in range(len(R) - 1):
        for k in range(seg):
            k1 = (k + 1) % seg; A.f([R[i][k], R[i][k1], R[i + 1][k1], R[i + 1][k]], m, (R[i][k].co + R[i + 1][k1].co) / 2 - (pts[i] + pts[i + 1]) / 2)


def ribbon(A, pts, side, w, t, m):
    """a flat band along a path: its inner face on the points, w wide along side, t thick outwards (away from the body's middle)"""
    side = V(side).normalized(); R = []
    for i, p in enumerate(pts):
        T = (pts[min(len(pts) - 1, i + 1)] - pts[max(0, i - 1)]).normalized(); nn = T.cross(side).normalized()
        if nn.dot(p - V((0, -0.01, 0.95))) < 0: nn = -nn
        R.append([A.v(p + side * sx * w / 2 + nn * (sy * t / 2)) for sx, sy in ((-1, -1), (1, -1), (1, 1), (-1, 1))])
    for i in range(len(R) - 1):
        c = (pts[i] + pts[i + 1]) / 2
        for k in range(4):
            k1 = (k + 1) % 4; A.f([R[i][k], R[i][k1], R[i + 1][k1], R[i + 1][k]], m, (R[i][k].co + R[i + 1][k1].co) / 2 - c)
    for i, sg in ((0, -1), (len(R) - 1, 1)):
        T = (pts[min(len(pts) - 1, i + 1)] - pts[max(0, i - 1)]).normalized(); A.f(list(R[i]), m, T * sg)
