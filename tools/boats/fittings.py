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
def sail(A, tack, clew, head, peak, m, m_edge, m_seam=None, side=(0, 1, 0), belly=0.08, n=10, k=8, panels=5, hollow=0.06, fine=True):
    """a riding sail of cloth (SJK-11, M5: it was a flat board of one colour) between its corners, tack and peak on the luff (the
    mast), clew and head on the leech: the cloth with its belly out to side, curving most a third of the way aft and a little above the
    middle, the leech cut hollow; both faces 4 mm apart so it shows from either side; the panels' seams across it (m_seam), the tapes
    along all four edges and the reinforcing patches at the three loaded corners (m_edge); fine=False: the cloth only, coarser"""
    tack, clew, head, peak, sd = V(tack), V(clew), V(head), V(peak), V(side).normalized()
    if not fine: n, k = min(n, 4), min(k, 3)
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
        if not fine: continue
        lu = 0.05 / max(0.5, (clew - tack).length); lt = 0.05 / max(0.5, (peak - tack).length)
        if m_seam is not None:
            for i in range(1, panels): t = i / panels; strip(0.0, 1.0, t - lt * 0.25, t + lt * 0.25, m_seam, nu=k)
        strip(0.0, lu, 0.0, 1.0, m_edge, nt=n); strip(1.0 - lu, 1.0, 0.0, 1.0, m_edge, nt=n)
        strip(0.0, 1.0, 0.0, lt, m_edge, nu=k); strip(0.0, 1.0, 1.0 - lt, 1.0, m_edge, nu=k)
        for u0, t0 in ((0.0, 0.0), (1.0 - 5 * lu, 0.0), (1.0 - 5 * lu, 1.0 - 5 * lt)):
            strip(u0, u0 + 5 * lu, t0, t0 + 5 * lt, m_edge, nu=2, nt=2)


# ---------- small open boats (the skiff's revision, 31.10.2026; Jonas: «lag gjerne modeller av utstyr som kan brukes felles på andre
# båter»): lofts, a horn cleat, the lanterns with their screens, a bow roller, a hatch lid, tread plate, the lining of a hole, and an
# outboard motor sized by its horsepower ----------
def loft(A, rings, mf, cap0=False, cap1=True, out=None):
    """faces between closed rings of points (each the same count), mf(i) the material of band i; the faces turned away from each
    ring's centre (or along out(centre) when given); cap0/cap1 close the first and the last ring"""
    R = [[V(p) for p in r] for r in rings]; vs = [[A.v(p) for p in r] for r in R]; cen = [sum(r, V()) / len(r) for r in R]
    n = len(R[0])
    for i in range(len(R) - 1):
        for k in range(n):
            j = (k + 1) % n; mid = (R[i][k] + R[i][j] + R[i + 1][j] + R[i + 1][k]) / 4; cc = (cen[i] + cen[i + 1]) / 2
            A.f([vs[i][k], vs[i][j], vs[i + 1][j], vs[i + 1][k]], mf(i), out(mid, cc) if out else mid - cc)
    if cap0: A.f(list(vs[0]), mf(0), cen[0] - cen[1])
    if cap1: A.f(list(vs[-1]), mf(len(R) - 2), cen[-1] - cen[-2])


def sring(xc, z, lf, lb, ly, nf=2.6, nb=2.6, ny=2.6, seg=24, y0=0.0):
    """a horizontal superellipse ring at height z: lf forward (+x) of xc, lb aft, ly to each side; nf/nb its fullness forward and aft
    (2 an ellipse, higher fuller, lower pointed): the cowling, the leg and the plate of an outboard"""
    out = []
    for k in range(seg):
        t = 2 * math.pi * k / seg; c = math.cos(t); s = math.sin(t); n_ = nf if c >= 0 else nb
        out.append((xc + (lf if c >= 0 else lb) * math.copysign(abs(c) ** (2 / n_), c), y0 + ly * math.copysign(abs(s) ** (2 / ny), s), z))
    return out


def prism_side(A, poly, y0, y1, m, ax=(0, 1, 0)):
    """a flat plate cut to the outline poly [(x, z)] in the x-z plane, from y0 to y1 (both faces and the edges)"""
    a = [A.v((x, y0, z)) for x, z in poly]; b = [A.v((x, y1, z)) for x, z in poly]; n = len(poly)
    A.f(a, m, (0, -1, 0) if y0 < y1 else (0, 1, 0)); A.f(b, m, (0, 1, 0) if y0 < y1 else (0, -1, 0))
    c = V((sum(p[0] for p in poly) / n, (y0 + y1) / 2, sum(p[1] for p in poly) / n))
    for k in range(n):
        j = (k + 1) % n; A.f([a[k], a[j], b[j], b[k]], m, (a[k].co + a[j].co) / 2 - c)


def cleat(A, c, n, along, L, m):
    """a horn cleat on a surface at c (outward normal n), its horn along along, L long: two feet a little into the surface, the horn
    round, thickest in the middle and tapering to its tips, which turn up a little (FOR-04)"""
    n = V(n).normalized(); a = V(along); a = (a - n * a.dot(n)).normalized(); b = n.cross(a); c = V(c); h = 0.30 * L
    for sg in (1, -1):
        p0 = c + a * (sg * 0.20 * L) - n * 0.003; p1 = c + a * (sg * 0.15 * L) + n * h
        acyl(A, p0, p1, 0.07 * L, lambda z: m, seg=8, r1=0.055 * L)
    pts = []
    for i in range(9):
        t = -0.5 + i / 8; pts.append((c + a * (t * L) + n * (h + 0.05 * L * (2 * t) ** 2), 0.075 * L * (1 - 0.55 * (2 * t) ** 2) + 0.01 * L))
    for (p, r), (q, r1) in zip(pts, pts[1:]): acyl(A, p, q, r, lambda z: m, seg=8, r1=r1)
    A.poly([pts[0][0] + b * (pts[0][1] * math.cos(2 * math.pi * k / 8)) + n * (pts[0][1] * math.sin(2 * math.pi * k / 8)) for k in range(8)], m, -a)


def side_lantern(A, c, fwd, out, m_lens, m_body, m_screen, R=0.03, H=0.045, foot=0.0):
    """a sidelight for a small boat, its lens's centre at c: the lens an arc of a cylinder from right ahead round to 22.5 degrees abaft
    the beam on its own side (out; 112.5 degrees, COLREG annex I 9(a)), the housing behind it with base and cap, and a matt black
    screen inboard reaching past the lens's fore edge, so no light shows across the bow (LYS-02); foot: a pedestal down to the deck"""
    f = V(fwd).normalized(); o = V(out).normalized(); z = V((0, 0, 1)); c = V(c); seg = 10
    arc = [f * math.cos(math.radians(112.5) * k / seg) + o * math.sin(math.radians(112.5) * k / seg) for k in range(seg + 1)]
    lo = [A.v(c + d * R - z * (H / 2)) for d in arc]; hi = [A.v(c + d * R + z * (H / 2)) for d in arc]
    for k in range(seg): A.f([lo[k], lo[k + 1], hi[k + 1], hi[k]], m_lens, arc[k] + arc[k + 1])
    # the housing: aft of the lens and inboard, closing its back; base and cap over all
    obox(A, c - f * 0.018 + o * (0.45 * R), f * 0.02, o * (0.5 * R + 0.01), z * (H / 2), m_body)
    for zz in (-1, 1):
        obox(A, c + z * (zz * (H / 2 + 0.004)) + f * (0.5 * R - 0.018) + o * (0.5 * R), f * (0.5 * R + 0.026), o * (0.5 * R + 0.016), z * 0.004, m_body)
    obox(A, c + f * (0.5 * R + 0.002) - o * 0.012, f * (0.5 * R + 0.034), o * 0.003, z * (H / 2 + 0.008), m_screen)
    if foot > 0: obox(A, c - z * (H / 2 + 0.008 + foot / 2) + f * (0.5 * R - 0.018) + o * (0.5 * R), f * (0.5 * R + 0.02), o * (0.5 * R + 0.01), z * (foot / 2 + 0.003), m_body)


def allround_lantern(A, c, m_lens, m_body, R=0.028, H=0.06):
    """an all-round white light on top of a pole, the lens's centre at c: the base, the lens all round and the cap with its dome"""
    c = V(c); z = V((0, 0, 1))
    acyl(A, c - z * (H / 2 + 0.035), c - z * (H / 2), R + 0.004, lambda q: m_body, seg=16, r1=R + 0.006)
    acyl(A, c - z * (H / 2), c + z * (H / 2), R, lambda q: m_lens, seg=16, cap=False)
    acyl(A, c + z * (H / 2), c + z * (H / 2 + 0.012), R + 0.006, lambda q: m_body, seg=16)
    acyl(A, c + z * (H / 2 + 0.012), c + z * (H / 2 + 0.03), R + 0.004, lambda q: m_body, seg=16, r1=0.008)


def bow_roller(A, aft, fore, m_frame, m_roller, R=0.035, W=0.11, deck=None, x_end=None):
    """a bow roller on its bracket from aft (on the deck) to fore (the roller's axis, out over the stem): two cheek plates, the roller,
    the keeper pin over it, the bolts in the base plate (FOR-07, M13); deck(x) the deck's height under it (default: aft's)"""
    aft, fore = V(aft), V(fore); dz = deck or (lambda x: aft.z)
    x0, x1 = aft.x, fore.x; zr = fore.z
    xe = min(x1 - 2.2 * R, x_end if x_end is not None else 1e9)        # where the cheeks leave the deck (x_end: where the deck ends at the stem)
    poly = [(x0, dz(x0) - 0.004), (xe, dz(xe) - 0.004), (x1 + R * 0.5, zr - R * 0.95), (x1 + R * 1.05, zr + R * 0.1),
            (x1 - R * 0.2, zr + R * 1.7), (x0 + 0.10, dz(x0 + 0.10) + 0.045), (x0, dz(x0) + 0.03)]
    for sg in (1, -1): prism_side(A, poly, sg * (W / 2 - 0.006), sg * (W / 2 + 0.002), m_frame)
    acyl(A, (x1, -W / 2 + 0.008, zr), (x1, W / 2 - 0.008, zr), R, lambda q: m_roller, seg=16)
    acyl(A, (x1 - R * 0.15, -W / 2 - 0.004, zr + R * 1.45), (x1 - R * 0.15, W / 2 + 0.004, zr + R * 1.45), 0.007, lambda q: m_frame, seg=8)
    obox(A, (x0 + 0.10, 0, dz(x0 + 0.10) + 0.002), (0.10, 0, 0), (0, W / 2 + 0.012, 0), (0, 0, 0.005), m_frame)


def hatch_lid(A, x0, x1, y0, y1, z, m_lid, m_fit, hinge='+x', t=0.012):
    """a hatch lid lying in its frame, its top at z: the lid's top and its edges down t (the frame's gutter is the deck's own), two
    hinges on the hinge side and a flush lifting ring at the other (DKS-03)"""
    for nm, pts, out in (('top', [(x0, y0, z), (x1, y0, z), (x1, y1, z), (x0, y1, z)], (0, 0, 1)),):
        A.poly(pts, m_lid, out)
    for (a, b, out) in (((x0, y0), (x1, y0), (0, -1, 0)), ((x1, y0), (x1, y1), (1, 0, 0)), ((x1, y1), (x0, y1), (0, 1, 0)), ((x0, y1), (x0, y0), (-1, 0, 0))):
        A.poly([(a[0], a[1], z), (b[0], b[1], z), (b[0], b[1], z - t), (a[0], a[1], z - t)], m_lid, out)
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    if hinge in ('+x', '-x'):
        xh = x1 if hinge == '+x' else x0
        for yy in (y0 + 0.25 * (y1 - y0), y0 + 0.75 * (y1 - y0)):
            acyl(A, (xh, yy - 0.03, z + 0.004), (xh, yy + 0.03, z + 0.004), 0.007, lambda q: m_fit, seg=8)
        xr = x0 + 0.06 if hinge == '+x' else x1 - 0.06
        atorus(A, (xr, cy, z + 0.002), (0, 0, 1), 0.026, 0.004, lambda a: m_fit, seg=14, rseg=5)
    else:
        yh = y1 if hinge == '+y' else y0
        for xx in (x0 + 0.25 * (x1 - x0), x0 + 0.75 * (x1 - x0)):
            acyl(A, (xx - 0.03, yh, z + 0.004), (xx + 0.03, yh, z + 0.004), 0.007, lambda q: m_fit, seg=8)
        yr = y0 + 0.06 if hinge == '+y' else y1 - 0.06
        atorus(A, (cx, yr, z + 0.002), (0, 0, 1), 0.026, 0.004, lambda a: m_fit, seg=14, rseg=5)


def tread_plate(A, x0, x1, y0, y1, z, m, inside=lambda x, y: True, pitch=0.05, L=0.026, w=0.007, h=0.0016):
    """aluminium tread plate (DKS-02, MAT-04): raised lozenges in a checker of crossed pairs, pitch apart, on the flat at height z
    (their feet a little into it, so no face lies in its plane); inside(x, y) leaves out the places where they must not be"""
    nx = int((x1 - x0) / pitch); ny = int((y1 - y0) / pitch)
    for i in range(nx + 1):
        for j in range(ny + 1):
            x = x0 + (i + 0.5) * pitch; y = y0 + (j + 0.5) * pitch
            if x > x1 - pitch * 0.3 or y > y1 - pitch * 0.3 or not inside(x, y): continue
            a = math.pi / 4 if (i + j) % 2 else -math.pi / 4
            d = V((math.cos(a), math.sin(a), 0)); s = V((-d.y, d.x, 0)); c = V((x, y, z - 0.0004))
            b0, b1, b2, b3 = c - d * (L / 2), c - s * (w / 2), c + d * (L / 2), c + s * (w / 2)
            r0 = c - d * (L / 2 - w * 0.6) + V((0, 0, h)); r1 = c + d * (L / 2 - w * 0.6) + V((0, 0, h))
            A.poly([b0, b1, r0], m, (b0 + b1) / 2 - c - s * 0.001); A.poly([b1, b2, r1, r0], m, -s + V((0, 0, 0.5)))
            A.poly([b2, b3, r1], m, (b2 + b3) / 2 - c + s * 0.001); A.poly([b3, b0, r0, r1], m, s + V((0, 0, 0.5)))


def hole_lining(A, ring, d, depth, m, m_end=None, steps=2):
    """the inside of a real hole: from the hole's ring of points (a hole the script has cut in a surface) a tube along d, depth deep,
    its faces turned inward, closed at the bottom (m_end): a rod holder's tube, an outlet's pipe"""
    d = V(d).normalized(); P = [V(p) for p in ring]; c = sum(P, V()) / len(P); n = len(P)
    rings = [P] + [[p + d * (depth * k / steps) for p in P] for k in range(1, steps + 1)]
    vs = [[A.v(p) for p in r] for r in rings]
    for i in range(steps):
        cc = c + d * (depth * (i + 0.5) / steps)
        for k in range(n):
            j = (k + 1) % n; mid = (rings[i][k] + rings[i + 1][j]) / 2
            A.f([vs[i][k], vs[i][j], vs[i + 1][j], vs[i + 1][k]], m, cc - mid)
    A.f(list(vs[-1]), m_end or m, -d)


def outboard(A, P, at, hp, M, shaft=0.635, tw=0.05, fine=True):
    """an outboard motor clamped on a transom's notch (FRM-01, M15; the skiff's 60 hp, and any other hp: the powerhead and the
    gearcase grow with hp ** 0.3), in the boat's frame (x forward): at = (x of the transom's aft face, y of the motor's centre line,
    z of the notch's top); shaft from the notch to the anti-cavitation plate (20 in 0.51, 25 in 0.635), tw the transom's thickness at
    the notch (the brackets' inner legs and screws on its inside). Drawn into A: the cowling
    with its grey band and the lower cowl, the leg as a foil, the plate, the gearcase with its torpedo, skeg, water intakes and the
    trim tab anode, the clamp brackets over the notch with their screws, the tilt tube, the swivel and the power trim and tilt, the
    steering arm, the rigging hose. The propeller into P (its own part: it turns) with F.propeller. Returns the propeller's centre.
    M: materials {'cowl', 'band', 'leg', 'steel', 'chrome', 'dark', 'rubber', 'anode', 'prop'}."""
    xt, y0, zn = at; s = (hp / 60.0) ** 0.3; zc = zn - shaft; zt = zc - 0.165 * s
    X = lambda dx: xt + dx * s
    def ring(dz, xc, lf, lb, ly, nf=2.6, nb=2.4, seg=24): return sring(X(xc), dz, lf * s, lb * s, ly * s, nf, nb, 2.6, seg, y0)
    seg = 24 if fine else 10
    # the leg, the lower cowl and the cowling in one loft from the plate up: grey band at the split line
    zH = lambda dz: zn + 0.10 + (dz - 0.10) * s if dz > 0.10 else zn + dz
    R = [ring(zc + 0.004, -0.50, 0.18, 0.23, 0.068, 2.2, 1.4, seg), ring(zc + 0.20, -0.50, 0.18, 0.23, 0.068, 2.2, 1.4, seg),
         ring(zn - 0.24, -0.50, 0.19, 0.23, 0.075, 2.2, 1.5, seg), ring(zn - 0.17, -0.50, 0.21, 0.24, 0.12, 2.4, 2.0, seg),
         ring(zn - 0.11, -0.50, 0.24, 0.255, 0.155, 2.6, 2.3, seg), ring(zn - 0.03, -0.505, 0.28, 0.28, 0.18, 2.6, 2.4, seg),
         ring(zn + 0.06, -0.51, 0.305, 0.29, 0.19, 2.6, 2.4, seg), ring(zH(0.10), -0.515, 0.315, 0.295, 0.195, 2.6, 2.4, seg),
         ring(zH(0.10), -0.52, 0.338, 0.31, 0.208, 2.7, 2.5, seg), ring(zH(0.16), -0.52, 0.338, 0.31, 0.208, 2.7, 2.5, seg),
         ring(zH(0.165), -0.52, 0.335, 0.307, 0.206, 2.7, 2.5, seg), ring(zH(0.26), -0.525, 0.33, 0.305, 0.203, 2.7, 2.5, seg),
         ring(zH(0.37), -0.535, 0.32, 0.30, 0.198, 2.7, 2.5, seg), ring(zH(0.46), -0.545, 0.30, 0.285, 0.185, 2.6, 2.4, seg),
         ring(zH(0.53), -0.555, 0.265, 0.26, 0.16, 2.5, 2.3, seg), ring(zH(0.575), -0.56, 0.20, 0.21, 0.12, 2.4, 2.2, seg),
         ring(zH(0.60), -0.565, 0.10, 0.12, 0.06, 2.2, 2.0, seg)]
    mats = [M['leg']] * 7 + [M['cowl'], M['band'], M['band']] + [M['cowl']] * 7
    loft(A, R, lambda i: mats[i], cap0=False, cap1=True)
    # the plate over the propeller, the gearcase's strut, the torpedo and the skeg
    pl = ring(zc, -0.55, 0.24, 0.25, 0.15, 3.0, 4.0, seg)
    loft(A, [pl, [(p[0], p[1], zc + 0.018) for p in pl]], lambda i: M['leg'], cap0=True, cap1=True)
    loft(A, [ring(zt + 0.02, -0.47, 0.17, 0.17, 0.05, 2.2, 1.5, seg), ring(zc + 0.006, -0.49, 0.17, 0.18, 0.058, 2.2, 1.5, seg)], lambda i: M['leg'], cap0=False, cap1=False)
    tor = [(-0.28, 0.0), (-0.285, 0.026), (-0.30, 0.045), (-0.33, 0.06), (-0.38, 0.068), (-0.52, 0.067), (-0.59, 0.058), (-0.625, 0.048)]
    TR = []
    for dx, r in tor:
        TR.append([(X(dx), y0 + r * s * math.cos(2 * math.pi * k / 16), zt + r * s * math.sin(2 * math.pi * k / 16)) for k in range(16)])
    loft(A, TR, lambda i: M['leg'], cap0=False, cap1=True, out=lambda mid, cc: V((0, mid.y - y0, mid.z - zt)))
    skeg = [(X(-0.58), zt - 0.02 * s), (X(-0.36), zt - 0.02 * s), (X(-0.45), zt - 0.19 * s), (X(-0.525), zt - 0.215 * s), (X(-0.585), zt - 0.18 * s)]
    prism_side(A, skeg, y0 - 0.009 * s, y0 + 0.009 * s, M['leg'])
    obox(A, (X(-0.66), y0, zc - 0.012), (0.04 * s, 0, 0), (0, 0.012, 0), (0, 0, 0.012), M['anode'])           # the trim tab, an anode
    if fine:
        for sg in (1, -1):                                                                                # the water intakes
            for k in range(4):
                obox(A, (X(-0.40 - 0.022 * k), y0 + sg * 0.05 * s, zt + 0.075 * s), (0.006, 0, 0), (0, 0.004, 0), (0, 0, 0.03 * s), M['dark'])
        acyl(A, (X(-0.70), y0, zn - 0.30), (X(-0.735), y0, zn - 0.30), 0.012, lambda q: M['dark'], seg=10)   # the idle exhaust relief
        acyl(A, (X(-0.40), y0 + 0.19 * s, zn - 0.04), (X(-0.40), y0 + 0.205 * s, zn - 0.04), 0.006, lambda q: M['steel'], seg=8)   # the tell-tale
        obox(A, (X(-0.83), y0, zH(0.13)), (0.008, 0, 0), (0, 0.04, 0), (0, 0, 0.018), M['dark'])          # the cowl's latch
    # the clamp brackets over the notch, their screws in the well, the tilt tube, the swivel with its steering tube, the trim and tilt
    xi = xt + tw + 0.003; xo = xi + 0.028
    br = [(xo, zn + 0.06), (xo, zn - 0.12), (xi, zn - 0.12), (xi, zn + 0.004), (xt - 0.004, zn + 0.004),
          (xt - 0.004, zn - 0.20), (X(-0.12), zn - 0.22), (X(-0.16), zn - 0.08), (X(-0.12), zn + 0.06)]
    for sg in (1, -1):
        prism_side(A, br, y0 + sg * 0.095 * s, y0 + sg * 0.11 * s, M['leg'])
        if fine:
            yy = y0 + sg * 0.10 * s
            acyl(A, (xo, yy, zn - 0.07), (xo + 0.06, yy, zn - 0.07), 0.009, lambda q: M['steel'], seg=8)
            acyl(A, (xo + 0.06, yy - 0.04, zn - 0.07), (xo + 0.06, yy + 0.04, zn - 0.07), 0.008, lambda q: M['steel'], seg=8)
    acyl(A, (X(-0.06), y0 - 0.125 * s, zn + 0.035), (X(-0.06), y0 + 0.125 * s, zn + 0.035), 0.022, lambda q: M['steel'], seg=12)
    acyl(A, (X(-0.20), y0, zn - 0.24), (X(-0.20), y0, zn + 0.07), 0.042 * s, lambda q: M['leg'], seg=14)
    acyl(A, (X(-0.09), y0, zn - 0.22), (X(-0.09), y0, zn - 0.07), 0.04 * s, lambda q: M['leg'], seg=12)
    acyl(A, (X(-0.09), y0, zn - 0.07), (X(-0.16), y0, zn + 0.01), 0.012, lambda q: M['chrome'], seg=8)
    obox(A, (X(-0.13), y0, zn - 0.225), (0.05, 0, 0), (0, 0.035, 0), (0, 0, 0.012), M['anode'])
    # the steering arm forward over the notch, and the rigging hose from the lower cowl's front down into the well
    obox(A, (X(-0.10), y0, zn + 0.085), (0.11 * s, 0, 0), (0, 0.016, 0), (0, 0, 0.01), M['steel'])
    if fine:
        h0 = V((X(-0.21), y0 - 0.06 * s, zn - 0.02)); h1 = V((xt + 0.20, y0 - 0.12, zn - 0.10))
        pts = [h0 + (h1 - h0) * (i / 6) + V((0, 0, 0.07 * math.sin(math.pi * i / 6))) for i in range(7)]
        for a, b in zip(pts, pts[1:]): acyl(A, a, b, 0.02, lambda q: M['rubber'], seg=10)
    c = V((X(-0.66), y0, zt))
    propeller(P, c, (1, 0, 0), 0.17 * s, M['prop'], n=3, hub=0.30, pitch=1.25, skew=0.32, cpp=False, fine=fine)
    acyl(P, c - V((0.028 * s + 0.055 * s, 0, 0)), c - V((0.028 * s + 0.058 * s, 0, 0)), 0.018 * s, lambda q: M['dark'], seg=12)
    return c


def helm_wheel(A, c, ax, R, m_rim, m_spoke, m_hub, n=5, knob=True, dish=0.045):
    """a steering wheel for a console or a dash (every boat but the old wooden one gets one: Jonas 31.10.2026): centre c, ax its axis
    pointing out toward the helmsman, R the rim's radius; a foam-gripped rim, n stainless spokes dished back to the hub, the hub
    with its nut cap, the helm's shaft back into the dash, and a spinner knob on the rim. Draw it at the origin with ax along the
    game's own axis when the game turns it (skiff59.py: the part 'wheel')."""
    c = V(c); a = V(ax).normalized(); s, u, _ = frame_of(a)
    atorus(A, c, a, R, 0.017, lambda q: m_rim, seg=40, rseg=8)
    h = c - a * dish
    for k in range(n):
        t = 2 * math.pi * k / n + math.pi / 2; e = s * math.cos(t) + u * math.sin(t)
        p0 = h + e * 0.040; pm = c - a * (dish * 0.35) + e * (R * 0.6); p1 = c + e * (R - 0.012)
        acyl(A, p0, pm, 0.0075, lambda q: m_spoke, seg=6, cap=False); acyl(A, pm, p1, 0.0075, lambda q: m_spoke, seg=6, cap=False)
    acyl(A, h - a * 0.015, h + a * 0.012, 0.048, lambda q: m_spoke, seg=18)
    acyl(A, h + a * 0.012, h + a * 0.032, 0.030, lambda q: m_hub, seg=14, r1=0.022)
    acyl(A, h - a * 0.015, h - a * 0.14, 0.022, lambda q: m_hub, seg=12)
    if knob:
        e = s * math.cos(-0.5) + u * math.sin(-0.5); k0 = c + e * R
        acyl(A, k0, k0 + a * 0.065, 0.012, lambda q: m_hub, seg=10, r1=0.014)
