"""Shared fittings for the boat scripts (docs/skipsmodeller/kartlegging-spillet.md 7.4, 30.10.2026): the propeller and its hub, sacrificial
anodes, the thruster tunnel with its grid, draft marks and the hull's symbols, weld seams, freeing ports, whip antennas, radomes and
GPS mushrooms, searchlights, ladders with a cage, the net guard on a seiner's forecastle, the power block, the net funnel, the side
hauler, a hose reel and a riding sail of cloth. Before this every script drew its own (the door seven times, the underwater gear ten), so a fault had to be
fixed in each and a new boat took long; a script now calls these and keeps only what is its own.

Every function draws into an Acc (bpyutil) in the script's frame (x forward, y to port, z up in all the boat scripts here) and takes
its materials as arguments, so the boat's own colours and paint zones stay hers. Directions are given as vectors, so nothing assumes
which way a part faces. Measures are in metres. Each function says what it was drawn after; where nothing is said, the measure is a
common size of the fitting, our choice."""
import math
from bpyutil import V, obox, abox, beam, acyl, atorus, frame_of


def _onb(n, up=(0, 0, 1)):
    """an orthonormal frame (right, up, n) on a surface with outward normal n, up as near the given up as it can be"""
    n = V(n).normalized(); u = V(up)
    if abs(n.dot(u.normalized())) > 0.95: u = V((1, 0, 0)) if abs(n.x) < 0.9 else V((0, 1, 0))
    r = u.cross(n).normalized(); u = n.cross(r).normalized()
    return r, u, n


def pipe(A, pts, r, m, seg=8):
    """a pipe or a hose along the points (each leg a round timber, the joints overlapping)"""
    pts = [V(p) for p in pts]
    for a, b in zip(pts, pts[1:]):
        if (b - a).length > 1e-4: acyl(A, a, b, r, lambda z: m, seg=seg, cap=True)


def sag(a, b, drop, n=8):
    """points on a rope or a hose hanging from a to b with its middle drop below the straight line"""
    a, b = V(a), V(b)
    return [a + (b - a) * (i / n) - V((0, 0, drop * 4 * (i / n) * (1 - i / n))) for i in range(n + 1)]


# ---------- under water ----------
def propeller(A, c, ax, R, m, n=4, hub=0.24, pitch=0.95, skew=0.30, cpp=True, m_hub=None, m_bolt=None, m_guard=None, fine=True):
    """a propeller at c turning about ax (the shaft's direction, pointing from the propeller forward into the hull), R its radius:
    n blades, each widest at about 0.65 R with a rounded tip, skewed back against the rotation (skew, as a share of R at the tip),
    twisted to the pitch (pitch x 2R a turn) and given a thin section; the hub (hub x R), its cap tapering aft, and with cpp the
    controllable-pitch propeller's boss: the blades' palms bolted to it and a ring of bolts round the cap, as on the photo Jonas sent
    30.10.2026 (a five-bladed CPP in dock). m_guard draws the rope guard, a dark ring round the shaft just forward of the hub."""
    c = V(c); ax = V(ax).normalized(); s, u, _ = frame_of(ax); rh = hub * R; m_hub = m_hub or m; m_bolt = m_bolt or m_hub
    seg = 20 if fine else 10; L0 = 0.55 * rh                               # the hub's half length
    acyl(A, c - ax * L0, c + ax * L0, rh, lambda z: m_hub, seg=seg)
    acyl(A, c - ax * L0, c - ax * (L0 + 1.1 * rh), rh, lambda z: m_hub, seg=seg, r1=0.28 * rh)
    if cpp and fine:
        for k in range(12):                                              # the ring of bolts round the cap's root
            a = 2 * math.pi * k / 12; e = s * math.cos(a) + u * math.sin(a)
            obox(A, c - ax * (L0 - 0.04 * rh) + e * (rh * 0.99), ax * (0.03 * rh), e * (0.04 * rh), e.cross(ax) * (0.04 * rh), m_bolt)
    if m_guard is not None:
        acyl(A, c + ax * L0, c + ax * (L0 + 0.9 * rh), rh * 1.05, lambda z: m_guard, seg=seg)
    P = pitch * 2 * R; NS = 12 if fine else 5; NC = 9 if fine else 4
    for k in range(n):
        a0 = 2 * math.pi * k / n
        rows = []
        for i in range(NS + 1):
            q = i / NS; r = rh * 0.92 + (R - rh * 0.92) * q
            chord = R * (0.30 + 0.62 * math.sin(math.pi * min(1.0, 0.18 + 0.82 * q)) ** 0.8) * (0.25 + 0.75 * (1 - q ** 6) ** 0.5)
            if cpp: chord *= 1.0 if q > 0.12 else 0.85
            sk = skew * R * q * q                                         # the skew: the section moves back along its circle
            a = a0 + sk / max(r, 1e-6); er = s * math.cos(a) + u * math.sin(a); et = ax.cross(er).normalized()
            phi = math.atan2(P, 2 * math.pi * r)                          # the pitch angle at this radius
            cd = (et * math.cos(phi) + ax * math.sin(phi)).normalized()   # along the chord
            nd = cd.cross(er).normalized()                                # across the section's thickness
            th = R * (0.045 * (1 - q) + 0.006)
            ring = []
            for j in range(NC):
                f = j / (NC - 1); x = (f - 0.4) * chord; t = th * math.sin(math.pi * f) ** 0.7
                ring.append(c + er * r + cd * x + nd * t)
            for j in range(NC - 2, 0, -1):
                f = j / (NC - 1); x = (f - 0.4) * chord; t = th * math.sin(math.pi * f) ** 0.7
                ring.append(c + er * r + cd * x - nd * t)
            rows.append([A.v(p) for p in ring])
        cen = c
        for i in range(len(rows) - 1):
            ra, rb = rows[i], rows[i + 1]; L = len(ra)
            for j in range(L):
                jj = (j + 1) % L; A.f([ra[j], ra[jj], rb[jj], rb[j]], m, ((ra[j].co + rb[jj].co) / 2 - cen))
        A.f(list(rows[-1]), m, (rows[-1][0].co - c))
        if cpp and fine:                                                  # the blade's palm on the boss
            er = s * math.cos(a0) + u * math.sin(a0)
            acyl(A, c + er * (rh * 0.80), c + er * (rh * 1.04), 0.42 * rh, lambda z: m_hub, seg=14)


def anode(A, c, n, along, m, L=0.40, w=0.11, t=0.045, m_strap=None):
    """a sacrificial anode bolted to a surface at c (outward normal n), long along along: a rounded block on two steel straps, as on
    the rudder, the heel and the hull round the propeller in the photo from the dock (Jonas 30.10.2026)"""
    r, _, nn = _onb(n); a = V(along).normalized(); b = nn.cross(a).normalized(); c = V(c)
    obox(A, c + nn * (t / 2), a * (L / 2), b * (w / 2), nn * (t / 2), m)
    obox(A, c + nn * (t + 0.006), a * (L / 2 - 0.05), b * (w / 2 - 0.02), nn * 0.006, m)
    ms = m_strap or m
    for sg in (1, -1): obox(A, c + a * (sg * (L / 2 + 0.03)) + nn * 0.01, a * 0.03, b * (w / 2 - 0.01), nn * 0.012, ms)


def thruster_tunnel(A, c, n, r, m_dark, m_grid, m_prop=None, fine=True):
    """a thruster's tunnel mouth in the hull at c (outward normal n), radius r: the dark tunnel, its rim, and the bolted grid of
    curved vertical and straight horizontal bars over it, with the propeller seen inside (the photo from the dock, 30.10.2026)"""
    R_, U_, N_ = _onb(n); c = V(c); seg = 28 if fine else 12
    pts = [c + (R_ * math.cos(2 * math.pi * k / seg) + U_ * math.sin(2 * math.pi * k / seg)) * r + N_ * 0.006 for k in range(seg)]
    A.poly(pts, m_dark, N_)
    atorus(A, c + N_ * 0.004, N_, r, 0.035 * r + 0.012, lambda a: m_grid, seg=seg, rseg=4)
    if m_prop is not None and fine:                                      # the propeller deep in the tunnel
        for k in range(4):
            a = 2 * math.pi * k / 4 + 0.4; e = R_ * math.cos(a) + U_ * math.sin(a); f = e.cross(N_)
            q = c - N_ * (0.9 * r)
            A.poly([q + e * (0.18 * r) - f * (0.12 * r), q + e * (0.85 * r) - f * (0.20 * r), q + e * (0.85 * r) + f * (0.20 * r), q + e * (0.18 * r) + f * (0.12 * r)], m_prop, N_)
    nb = 5 if fine else 3; bw = 0.03 * r + 0.008
    for i in range(1, nb + 1):                                           # the vertical bars, bowed out a little
        x = -r + 2 * r * i / (nb + 1); h = math.sqrt(max(0.0, r * r - x * x))
        p0 = c + R_ * x - U_ * h; p1 = c + R_ * x + U_ * h; mid = c + R_ * x + N_ * (0.10 * r)
        beam(A, p0 + N_ * 0.01, mid + N_ * 0.01, bw, bw, m_grid, up=N_); beam(A, mid + N_ * 0.01, p1 + N_ * 0.01, bw, bw, m_grid, up=N_)
    for i in range(1, nb):                                               # the horizontal bars
        z = -r + 2 * r * i / nb; h = math.sqrt(max(0.0, r * r - z * z))
        beam(A, c + U_ * z - R_ * h + N_ * 0.05 * r, c + U_ * z + R_ * h + N_ * 0.05 * r, bw * 0.8, bw * 0.8, m_grid, up=N_)


# ---------- the hull's marks: draft scales, the thruster and bulb symbols, the V marks ----------
SEG7 = {'0': 'abcdef', '1': 'bc', '2': 'abged', '3': 'abgcd', '4': 'fgbc', '5': 'afgcd', '6': 'afgedc', '7': 'abc', '8': 'abcdefg', '9': 'abcdfg'}

def glyph(A, ch, o, r, u, h, m, n=None):
    """one figure of a draft mark at o (its lower left corner) on a surface: r to the right, u up, h high; block figures as the welded
    and painted marks are (seven bars), and M for the whole metres"""
    o = V(o); r = V(r).normalized(); u = V(u).normalized(); n = V(n) if n is not None else r.cross(u); w = 0.55 * h; t = 0.16 * h
    def bar(x0, y0, x1, y1): A.poly([o + r * x0 + u * y0, o + r * x1 + u * y0, o + r * x1 + u * y1, o + r * x0 + u * y1], m, n)
    if ch == 'M':
        w = 0.75 * h; bar(0, 0, t, h); bar(w - t, 0, w, h)
        # the two strokes from the tops of the stems down to the middle, each a quad that starts where its stem ends (no overlap, so
        # neither the render nor the baked shadow darkens the corners)
        for sg, xa in ((1, t), (-1, w - t)):
            xm = w / 2; A.poly([o + r * xa + u * h, o + r * xa + u * (h - 1.6 * t), o + r * (xm - sg * t * 0.5) + u * (h * 0.40), o + r * (xm + sg * t * 0.5) + u * (h * 0.40 + 1.4 * t)], m, n)
        return w
    segs = SEG7.get(ch, '')
    # the bars meet end to end: the stems run to the top or the bottom only where no bar lies across there
    ta = h - t if 'a' in segs else h; td = t if 'd' in segs else 0.0; gu = h / 2 + t / 2 if 'g' in segs else h / 2; gd = h / 2 - t / 2 if 'g' in segs else h / 2
    S_ = {'a': (0, h - t, w, h), 'g': (0, h / 2 - t / 2, w, h / 2 + t / 2), 'd': (0, 0, w, t), 'f': (0, gu, t, ta), 'b': (w - t, gu, w, ta),
          'e': (0, td, t, gd), 'c': (w - t, td, w, gd)}
    for k in segs:
        x0, y0, x1, y1 = S_[k]
        if k in 'agd':                                                   # the bars across stop short of a stem beside them
            if ('f' in segs or 'e' in segs) and k != 'g': x0 = x0
        if y1 > y0 + 1e-6: bar(x0, y0, x1, y1)
    return w

def text_at(A, txt, o, r, u, h, m, gap=0.25):
    """a row of figures from o (lower left) along r"""
    o = V(o); r = V(r).normalized(); x = 0.0
    for ch in txt: x += glyph(A, ch, o + r * x, r, u, h, m) + gap * h
    return x

def draft_scale(A, at, z0, z1, m, h=0.10, metric=True):
    """the draft marks on a stem or a stern, read from the keel: at(z) -> (point on the hull at height z, outward normal, the
    direction along the hull the figures run, forward on the bow scale); from z0 to z1 metres. Metric marks are 10 cm figures every
    20 cm whose bottom is the draft they mark, 2, 4, 6 and 8 between the whole metres, and the whole metre with M (5M); IDN-06"""
    z = math.ceil(z0 / 0.2 - 1e-6) * 0.2
    while z <= z1 + 1e-6:
        p, n, r = at(z); n = V(n).normalized(); r = V(r).normalized(); u = n.cross(r).normalized()
        if u.z < 0: u = -u; r = -r
        dm = int(round(z * 10)); txt = ('%dM' % (dm // 10)) if dm % 10 == 0 else str(dm % 10)
        text_at(A, txt, V(p) + n * 0.008, r, u, h, m)
        z += 0.2

def ring_mark(A, c, n, up, R, w, m, seg=24, a0=0.0, a1=2 * math.pi):
    """a painted ring (or an arc of one) on a surface"""
    r, u, n = _onb(n, up); c = V(c) + n * 0.008; k = seg
    for i in range(k):
        a = a0 + (a1 - a0) * i / k; b = a0 + (a1 - a0) * (i + 1) / k
        ea = r * math.cos(a) + u * math.sin(a); eb = r * math.cos(b) + u * math.sin(b)
        A.poly([c + ea * (R - w), c + eb * (R - w), c + eb * R, c + ea * R], m, n)

def thruster_symbol(A, c, n, up, R, m):
    """the thruster mark over the tunnel: a white ring with a four-bladed propeller in it (IDN-08)"""
    ring_mark(A, c, n, up, R, 0.18 * R, m)
    r, u, nn = _onb(n, up); c = V(c) + nn * 0.009
    for k in range(4):
        a = math.pi / 4 + k * math.pi / 2; e = r * math.cos(a) + u * math.sin(a); f = nn.cross(e)
        A.poly([c + e * (0.12 * R) - f * (0.10 * R), c + e * (0.70 * R) - f * (0.22 * R), c + e * (0.70 * R) + f * (0.22 * R), c + e * (0.12 * R) + f * (0.10 * R)], m, nn)

def bulb_symbol(A, c, n, up, h, m, fwd=1):
    """the bulb mark: the bow's profile with its bulb, drawn as two arcs on top of each other (the «3» on Grotle, Trønderhav and the
    render; IDN-08); fwd = 1 when the bow is to the mark's right"""
    r, u, nn = _onb(n, up)
    if fwd < 0: r = -r
    c = V(c)
    ring_mark(A, c + u * (h * 0.25), nn, u, h * 0.25, 0.08 * h, m, seg=12, a0=-math.pi / 2, a1=math.pi / 2)
    ring_mark(A, c - u * (h * 0.25), nn, u, h * 0.25, 0.08 * h, m, seg=12, a0=-math.pi / 2 + 0.12, a1=math.pi / 2 - 0.02)

def vee(A, c, n, up, s, m):
    """a V mark (point down) by the symbols"""
    r, u, nn = _onb(n, up); c = V(c) + nn * 0.008; t = 0.18 * s
    # one outline, so the two strokes do not overlap at the point
    P = lambda x, y: c + r * (x * s) + u * (y * s)
    A.poly([P(-0.5, 0.5), P(-0.5 + t / s, 0.5), P(0, -0.5 + 1.9 * t / s), P(0.5 - t / s, 0.5), P(0.5, 0.5), P(0.05, -0.5), P(-0.05, -0.5)], m, nn)


# ---------- plating ----------
def seam(A, pts, nf, m, w=0.02, h=0.005):
    """a weld seam or a plate edge along the points on a surface (nf(p) the outward normal there): a strip w wide and h proud, in the
    surface's own material so a repaint takes it, and the light and the baked shadow make it read as a line (SKR-09)"""
    pts = [V(p) for p in pts]
    for a, b in zip(pts, pts[1:]):
        d = b - a
        if d.length < 1e-5: continue
        na = V(nf(a)).normalized(); nb = V(nf(b)).normalized(); d.normalize()
        sa = na.cross(d).normalized() * (w / 2); sb = nb.cross(d).normalized() * (w / 2)
        A.poly([a - sa + na * h, b - sb + nb * h, b + sb + nb * h, a + sa + na * h], m, (na + nb) / 2)
        A.poly([a - sa, b - sb, b - sb + nb * h, a - sa + na * h], m, -(sa + sb))
        A.poly([a + sa + na * h, b + sb + nb * h, b + sb, a + sa], m, (sa + sb))

def freeing_port(A, c, n, w, h, m_frame, m_dark, flap=None, up=(0, 0, 1)):
    """a freeing port (or a scupper) in a bulwark at c (outward normal n): the dark opening, its frame proud of the plating, and
    with flap a hinged flap hanging in it from its top edge (SKR-11)"""
    r, u, nn = _onb(n, up); c = V(c); f = 0.035
    A.poly([c - r * (w / 2) - u * (h / 2) + nn * 0.004, c + r * (w / 2) - u * (h / 2) + nn * 0.004, c + r * (w / 2) + u * (h / 2) + nn * 0.004, c - r * (w / 2) + u * (h / 2) + nn * 0.004], m_dark, nn)
    for (cx, cy, hw, hh) in ((0, h / 2 + f / 2, w / 2 + f, f / 2), (0, -h / 2 - f / 2, w / 2 + f, f / 2), (w / 2 + f / 2, 0, f / 2, h / 2), (-w / 2 - f / 2, 0, f / 2, h / 2)):
        obox(A, c + r * cx + u * cy + nn * 0.012, r * hw, u * hh, nn * 0.012, m_frame)
    if flap is not None:
        obox(A, c + nn * 0.03 - u * 0.02, r * (w / 2 - 0.02), u * (h / 2 - 0.03), nn * 0.008, flap)


# ---------- the mast and the roof: antennas, radomes, lights ----------
def whip(A, base, h, m, r0=0.022, r1=0.007, joint=0.62, m_joint=None, m_foot=None):
    """a whip antenna standing h from its foot at base: a glass-fibre rod tapering up, the joint ring a little over half way (the long
    MF/HF whips), and the foot's bracket (MST-05)"""
    b = V(base); top = b + V((0, 0, h)); mj = b + V((0, 0, h * joint))
    acyl(A, b, mj, r0, lambda z: m, seg=6, r1=r0 * 0.7 + r1 * 0.3)
    acyl(A, mj, top, r0 * 0.7 + r1 * 0.3, lambda z: m, seg=6, r1=r1)
    acyl(A, mj - V((0, 0, 0.06)), mj + V((0, 0, 0.06)), r0 * 1.5, lambda z: m_joint or m, seg=6)
    acyl(A, b - V((0, 0, 0.12)), b + V((0, 0, 0.10)), r0 * 2.2, lambda z: m_foot or m, seg=6)

def radome(A, c, R, m, m_base=None, h=None, seg=20, rings=6):
    """a satellite radome (VSAT, TV) with its foot at c: a short cylinder, the dome over it, a flat flange and a pedestal (MST-04)"""
    c = V(c); h = h if h is not None else 0.55 * R; mb = m_base or m
    acyl(A, c, c + V((0, 0, 0.25 * R)), 0.32 * R, lambda z: mb, seg=12)
    acyl(A, c + V((0, 0, 0.25 * R)), c + V((0, 0, 0.32 * R)), 1.04 * R, lambda z: mb, seg=seg)
    z0 = c.z + 0.32 * R; acyl(A, V((c.x, c.y, z0)), V((c.x, c.y, z0 + h)), R, lambda z: m, seg=seg, cap=False)
    prev = None
    for i in range(rings + 1):
        a = (math.pi / 2) * i / rings; rr = R * math.cos(a); zz = z0 + h + R * math.sin(a) * 0.95
        ring = [A.v(V((c.x + rr * math.cos(2 * math.pi * k / seg), c.y + rr * math.sin(2 * math.pi * k / seg), zz))) for k in range(seg)] if rr > 1e-4 else None
        if prev is not None:
            if ring is None:
                tip = A.v(V((c.x, c.y, zz)))
                for k in range(seg): A.f([prev[k], prev[(k + 1) % seg], tip], m, (prev[k].co - V((c.x, c.y, zz - R))))
            else:
                for k in range(seg): A.f([prev[k], prev[(k + 1) % seg], ring[(k + 1) % seg], ring[k]], m, (prev[k].co - V((c.x, c.y, z0 + h - R * 0.3))))
        prev = ring

def gps(A, c, m, r=0.08, h=0.18, m_post=None):
    """a GPS, AIS or Inmarsat-C mushroom on its short post (MST-06)"""
    c = V(c); acyl(A, c, c + V((0, 0, h)), 0.018, lambda z: m_post or m, seg=6)
    acyl(A, c + V((0, 0, h)), c + V((0, 0, h + 0.04)), r, lambda z: m, seg=12)
    acyl(A, c + V((0, 0, h + 0.04)), c + V((0, 0, h + 0.07)), r, lambda z: m, seg=12, r1=r * 0.55)

def searchlight(A, c, d, r, m_body, m_lens, m_yoke=None):
    """a searchlight on its yoke at c (the foot), aimed along d: the drum, the lens, the yoke and the foot (LYS-08)"""
    c = V(c); d = V((d[0], d[1], 0)).normalized(); my = m_yoke or m_body; zc = c + V((0, 0, 1.25 * r + 0.05))
    acyl(A, c, c + V((0, 0, 0.12)), 0.6 * r, lambda z: my, seg=10)
    s = d.cross(V((0, 0, 1))).normalized()
    for sg in (1, -1): beam(A, c + V((0, 0, 0.1)) + s * (sg * 1.05 * r), zc + s * (sg * 1.05 * r), 0.04, 0.05, my)
    acyl(A, zc - d * (0.8 * r), zc + d * (0.55 * r), r, lambda z: m_body, seg=14)
    acyl(A, zc + d * (0.55 * r), zc + d * (0.62 * r), r * 0.9, lambda z: m_lens, seg=14)

def ladder(A, p0, p1, w, m, side=(0, 1, 0), rung=0.28, cage=False, r=0.018, away=None):
    """a vertical or steep ladder from p0 to p1 (its foot and top on the centre line between the stiles), side across it; with cage
    the safety hoops from 2.2 m up and the bars between them, on the side away from the wall (away, the direction from the wall out
    to the climber) (DKS-08)"""
    p0, p1 = V(p0), V(p1); s = V(side).normalized(); L = (p1 - p0).length; d = (p1 - p0).normalized()
    for sg in (1, -1): acyl(A, p0 + s * (sg * w / 2), p1 + s * (sg * w / 2), r, lambda z: m, seg=6)
    k = 1
    while k * rung < L - 0.05:
        q = p0 + d * (k * rung); acyl(A, q - s * (w / 2), q + s * (w / 2), r * 0.8, lambda z: m, seg=6); k += 1
    if cage and L > 2.6:
        out = V(away).normalized() if away is not None else d.cross(s).normalized()
        zz = 2.2
        while zz < L:
            q = p0 + d * zz
            atorus(A, q + out * (0.35), d, 0.38, r * 0.9, lambda a: m, seg=10, rseg=4, a0=0.0, a1=math.pi)
            zz += 0.9
        for t in (-1, 0, 1):
            e = s * (t * 0.36) + out * (0.35 + (0.36 if t == 0 else 0.0))
            acyl(A, p0 + d * 2.2 + e, p1 + e, r * 0.8, lambda z: m, seg=5)


# ---------- the seiner's gear (RNG) ----------
def net_guard(A, pts, h, m_post, m_rope, every=1.6, r=0.035):
    """the net guard along a forecastle's edge (pts on the deck edge): tall posts every few metres and the ropes between them, two
    along and one in a zigzag, that keep the seine from fouling the bow (RNG-11, Sulebas' forecastle)"""
    pts = [V(p) for p in pts]; posts = [pts[0]]
    for a, b in zip(pts, pts[1:]):
        L = (b - a).length; n = max(1, int(round(L / every)))
        posts += [a + (b - a) * (i / n) for i in range(1, n + 1)]
    for p in posts: acyl(A, p, p + V((0, 0, h)), r, lambda z: m_post, seg=6)
    for zr in (0.45 * h, 0.95 * h): pipe(A, [p + V((0, 0, zr)) for p in posts], 0.022, m_rope, seg=5)
    for i, (a, b) in enumerate(zip(posts, posts[1:])):
        lo, hi = (0.45 * h, 0.95 * h) if i % 2 == 0 else (0.95 * h, 0.45 * h)
        pipe(A, [a + V((0, 0, lo)), b + V((0, 0, hi))], 0.018, m_rope, seg=5)

def power_block(A, hang, ax, R, m_frame, m_rubber, m_motor, m_hose=None, fine=True):
    """the power block hanging from a crane's boom tip at hang: a swivel and a shackle, the fork down both sides of the sheave, the
    sheave (two cones lined with rubber ribs, the net pinched in the V) turning about ax, the hydraulic motor on one side and its
    hoses up to the boom (RNG-01; Sulebas and Trønderhav). Returns the sheave's centre."""
    h = V(hang); ax = V((ax[0], ax[1], 0)).normalized(); s = ax.cross(V((0, 0, 1))).normalized(); seg = 24 if fine else 10
    acyl(A, h, h - V((0, 0, 0.35)), 0.11, lambda z: m_frame, seg=10)               # the swivel
    atorus(A, h - V((0, 0, 0.45)), s, 0.12, 0.03, lambda a: m_frame, seg=10, rseg=4)   # the shackle
    cz = h - V((0, 0, 0.55 + 0.15 + R)); w = 0.55 * R
    obox(A, h - V((0, 0, 0.62)), ax * (w / 2 + 0.12), s * 0.10, V((0, 0, 0.06)), m_frame)    # the fork's head
    for sg in (1, -1):
        beam(A, h - V((0, 0, 0.62)) + ax * (sg * (w / 2 + 0.08)), cz + ax * (sg * (w / 2 + 0.08)), 0.10, 0.22, m_frame, up=s)
    for sg in (1, -1):                                                              # the sheave's two cones and their flanges
        acyl(A, cz + ax * (sg * 0.05), cz + ax * (sg * w / 2), 0.35 * R, lambda z: m_frame, seg=seg, r1=R)
        acyl(A, cz + ax * (sg * w / 2), cz + ax * (sg * (w / 2 + 0.03)), R, lambda z: m_frame, seg=seg)
    acyl(A, cz - ax * 0.06, cz + ax * 0.06, 0.38 * R, lambda z: m_rubber, seg=seg)
    if fine:                                                                        # the rubber ribs in the V
        # the rubber ribs lie on the cones' faces in the V (each cone runs from 0.35 R at 0.05 m out to R at w / 2)
        cone = lambda rr: 0.05 + (w / 2 - 0.05) * (rr - 0.35 * R) / (0.65 * R)
        for k in range(18):
            a = 2 * math.pi * k / 18; e = s * math.cos(a) + V((0, 0, 1)) * math.sin(a)
            for sg in (1, -1): beam(A, cz + e * (0.45 * R) + ax * (sg * (cone(0.45 * R) - 0.02)), cz + e * (0.90 * R) + ax * (sg * (cone(0.90 * R) - 0.02)), 0.045, 0.03, m_rubber, up=ax)
    acyl(A, cz + ax * (w / 2 + 0.05), cz + ax * (w / 2 + 0.42), 0.26 * R, lambda z: m_motor, seg=14)   # the hydraulic motor
    if m_hose is not None:
        for dz in (-0.08, 0.08):
            pipe(A, [cz + ax * (w / 2 + 0.3) + V((0, 0, 0.2 * R + dz)), cz + ax * (w / 2 + 0.45) + V((0, 0, 0.7 * R)), h + ax * (w / 2 + 0.25) - V((0, 0, 0.3)), h + V((0, 0, 0.2)) + ax * 0.15], 0.025, m_hose, seg=5)
    return cz

def net_funnel(A, top, bottom, ctrl, r, m, m_in, flare=0.9, seg=20, n=14):
    """the net funnel («nottrakt») under the power block: a big curved tube from its flared, trumpet-shaped mouth at top down to bottom,
    bent through ctrl, white outside and dark inside (RNG-15; Sulebas and Trønderhav: the net is hauled through it, Jonas' reading)"""
    top, bottom, ctrl = V(top), V(bottom), V(ctrl)
    pts = [top * (1 - t) ** 2 + ctrl * 2 * t * (1 - t) + bottom * t * t for t in [i / n for i in range(n + 1)]]
    rings_o, rings_i = [], []; prev_s = None
    for i, p in enumerate(pts):
        a = pts[max(0, i - 1)]; b = pts[min(n, i + 1)]; d = (b - a).normalized(); s, u, _ = frame_of(d)
        if prev_s is not None and s.dot(prev_s) < 0: s, u = -s, -u
        prev_s = s; t = i / n; rr = r * (1 + flare * (1 - t) ** 4)
        rings_o.append([A.v(p + (s * math.cos(2 * math.pi * k / seg) + u * math.sin(2 * math.pi * k / seg)) * rr) for k in range(seg)])
        rings_i.append([A.v(p + (s * math.cos(2 * math.pi * k / seg) + u * math.sin(2 * math.pi * k / seg)) * (rr - 0.04)) for k in range(seg)])
    for i in range(n):
        for k in range(seg):
            j = (k + 1) % seg; po, qo = rings_o[i], rings_o[i + 1]; pi_, qi = rings_i[i], rings_i[i + 1]; cen = pts[i]
            A.f([po[k], po[j], qo[j], qo[k]], m, (po[k].co - cen))
            A.f([pi_[k], qi[k], qi[j], pi_[j]], m_in, (cen - pi_[k].co))
    for k in range(seg):                                                            # the mouth's rolled lip
        j = (k + 1) % seg; A.f([rings_o[0][k], rings_i[0][k], rings_i[0][j], rings_o[0][j]], m, (rings_o[0][k].co - pts[1]))

def side_hauler(A, foot, out, L, R, m_frame, m_roller, m_motor=None, fine=True):
    """the side hauler on the bulwark at foot (its root on the rail), out the horizontal direction over the side: a frame with an arm
    out over the water and two big rubber rollers along the boat that pinch and draw the seine (RNG-05)"""
    f = V(foot); o = V((out[0], out[1], 0)).normalized(); a = o.cross(V((0, 0, 1))).normalized(); seg = 18 if fine else 8
    beam(A, f - V((0, 0, 0.9)), f + V((0, 0, 0.5)), 0.35, 0.35, m_frame, up=o)
    arm_end = f + o * 1.3 + V((0, 0, 0.35))
    for sg in (1, -1): beam(A, f + a * (sg * L / 2) + V((0, 0, 0.35)), arm_end + a * (sg * L / 2), 0.18, 0.25, m_frame)
    beam(A, f + a * (-L / 2) + V((0, 0, 0.45)), f + a * (L / 2) + V((0, 0, 0.45)), 0.22, 0.22, m_frame)
    for k, (dz, dx) in enumerate(((0.0, 0.85), (0.0, 0.85 + 2.15 * R))):
        cc = f + o * dx + V((0, 0, 0.35 - R * 0.3))
        acyl(A, cc - a * (L / 2 - 0.1), cc + a * (L / 2 - 0.1), R, lambda z: m_roller, seg=seg)
        for sg in (1, -1): acyl(A, cc + a * (sg * (L / 2 - 0.1)), cc + a * (sg * (L / 2 - 0.02)), R * 0.4, lambda z: m_frame, seg=10)
    if m_motor is not None:
        acyl(A, f + o * 0.85 + a * (L / 2) + V((0, 0, 0.05)), f + o * 0.85 + a * (L / 2 + 0.35) + V((0, 0, 0.05)), 0.2, lambda z: m_motor, seg=12)

def hose_reel(A, c, ax, R, w, m_frame, m_drum, m_hose, fine=True):
    """a hose reel standing on the deck at c (the middle of its foot), its drum about the horizontal ax: the frame, the drum and the
    hose wound on it in turns (FSK-02; the pump hose on Quantus' and Trønderhav's cranes, on a seiner's deck)"""
    c = V(c); ax = V((ax[0], ax[1], 0)).normalized(); zc = c + V((0, 0, R + 0.25)); seg = 20 if fine else 10
    for sg in (1, -1):
        p = c + ax * (sg * (w / 2 + 0.08))
        beam(A, p - ax.cross(V((0, 0, 1))) * (R * 0.8), zc + ax * (sg * (w / 2 + 0.08)), 0.12, 0.12, m_frame)
        beam(A, p + ax.cross(V((0, 0, 1))) * (R * 0.8), zc + ax * (sg * (w / 2 + 0.08)), 0.12, 0.12, m_frame)
        acyl(A, zc + ax * (sg * w / 2), zc + ax * (sg * (w / 2 + 0.05)), R * 1.12, lambda z: m_drum, seg=seg)
    acyl(A, zc - ax * (w / 2), zc + ax * (w / 2), R * 0.55, lambda z: m_drum, seg=seg)
    nt = 4 if fine else 2; hr = min(0.12, w / (2 * nt + 1))
    for k in range(nt):
        atorus(A, zc - ax * (w / 2 - hr * (2 * k + 1.2)), ax, R * 0.55 + hr * 2.4, hr, lambda a: m_hose, seg=seg, rseg=6)


# ---------- the riding sail ----------
def sail(A, tack, clew, head, peak, m, m_edge, m_seam=None, side=(0, 1, 0), belly=0.08, n=10, k=8, panels=5, hollow=0.06):
    """a riding sail of cloth (SJK-11, M5: it was a flat board of one colour) between its corners, tack and peak on the luff (the
    mast), clew and head on the leech: the cloth with its belly out to side, curving most a third of the way aft and a little above the
    middle, the leech cut hollow; both faces 4 mm apart so it shows from either side; the panels' seams across it (m_seam), the tapes
    along all four edges and the reinforcing patches at the three loaded corners (m_edge)"""
    tack, clew, head, peak, sd = V(tack), V(clew), V(head), V(peak), V(side).normalized()
    def P(u, t, o=0.0):
        L = tack + (peak - tack) * t; R = clew + (head - clew) * t
        hl = hollow * math.sin(math.pi * t) * (head - clew).length / 4   # the hollow leech, in toward the luff
        R = R + (L - R).normalized() * hl * u ** 4
        b = belly * math.sin(math.pi * min(1.0, u * 1.35)) * (0.55 + 0.45 * math.sin(math.pi * (0.1 + 0.8 * t)))
        return L + (R - L) * u + sd * (b + o)
    for o, f in ((0.002, 1), (-0.002, -1)):
        for i in range(n):
            for j in range(k):
                q = [P(j / k, i / n, o), P((j + 1) / k, i / n, o), P((j + 1) / k, (i + 1) / n, o), P(j / k, (i + 1) / n, o)]
                A.poly(q if f > 0 else q[::-1], m, sd * f)
        # strips on the cloth: (u0, u1, t0, t1) in the sail's own measure, lifted a little more off the face
        def strip(u0, u1, t0, t1, mm, nu=1, nt=1):
            for a in range(nu):
                for b in range(nt):
                    ua, ub = u0 + (u1 - u0) * a / nu, u0 + (u1 - u0) * (a + 1) / nu; ta, tb = t0 + (t1 - t0) * b / nt, t0 + (t1 - t0) * (b + 1) / nt
                    q = [P(ua, ta, o + f * 0.002), P(ub, ta, o + f * 0.002), P(ub, tb, o + f * 0.002), P(ua, tb, o + f * 0.002)]
                    A.poly(q if f > 0 else q[::-1], mm, sd * f)
        lu = 0.05 / max(0.5, (clew - tack).length); lt = 0.05 / max(0.5, (peak - tack).length)
        if m_seam is not None:
            for i in range(1, panels): t = i / panels; strip(0.0, 1.0, t - lt * 0.25, t + lt * 0.25, m_seam, nu=k)
        strip(0.0, lu, 0.0, 1.0, m_edge, nt=n); strip(1.0 - lu, 1.0, 0.0, 1.0, m_edge, nt=n)
        strip(0.0, 1.0, 0.0, lt, m_edge, nu=k); strip(0.0, 1.0, 1.0 - lt, 1.0, m_edge, nu=k)
        for u0, t0 in ((0.0, 0.0), (1.0 - 5 * lu, 0.0), (1.0 - 5 * lu, 1.0 - 5 * lt)):
            strip(u0, u0 + 5 * lu, t0, t0 + 5 * lt, m_edge, nu=2, nt=2)
