"""What sits on the new head (FB5, steg 122): the hair, the beards and the hats, built on the head itself (Jonas 13.11.2026: «Da funker
det ikke å bruke noe fra den gamle. Det blir ikke bra»). The same names as in worker.b64, so the looks and the saves know them:
hair_<style> and hair_<style>_h (the same style under a hat), b_<beard>, hat_<kind>, hardhat, beanie, skippercap.

Everything is laid on the head by rays from the skull's middle: a part's inner side is the skin under it, so nothing floats and nothing
lies inside the head. The hair and the hats are the same for the man and the woman (as today), so they are laid on whichever of the
two skulls stands furthest out at each place (the skulls lie alike seen from each one's head joint). The beards are the man's.

Used by kropp_bygg.py; each builder returns a kropp_plagg.Mesh in the man's rest pose."""
import math
import numpy as np
from kropp_plagg import Mesh
import kropp as K

NA = 16                      # round the head (0 at the right ear, 4 the face, 8 the left ear, 12 the back)


class Head:
    def __init__(self, BM, BF):
        self.BM, self.BF = BM, BF; j = np.array(BM.J['head'], float); self.j = j
        self.c = j + np.array([0.0, K.HEADY['m'], 0.105])                       # the skull's middle
        self.df = np.array(BF.J['head'], float) - j                              # the woman's head from the man's
        (ex, ey, ez), er = __import__('kropp_bygg').EYES['m']; self.eye = np.array([ex, ey, ez])
        self.kr = 0.22; self.rim0 = np.array([0.0, ey + 0.012, ez + 0.036])      # the hats' rim: a plane through the brow's top, lower at the back

    def r(self, o, d, both=True, far=0.3):
        """how far from o the skin is along d (the further of the two heads); 0 when the ray leaves no head"""
        d = np.array(d, float); d /= np.linalg.norm(d); a = self.BM.out(tuple(o), tuple(d), far) or 0.0
        if both: a = max(a, self.BF.out(tuple(np.array(o) + self.df), tuple(d), far) or 0.0)
        return a

    def on(self, th, ph, off=0.0, both=True):
        """a point over the head in the direction th round (degrees, 90 the face) and ph up from the skull's middle, off above the skin"""
        t, p = math.radians(th), math.radians(ph); d = np.array([math.cos(t) * math.cos(p), math.sin(t) * math.cos(p), math.sin(p)])
        return self.c + d * (self.r(self.c, d, both) + off)

    def rim_z(self, y): return self.rim0[2] + self.kr * (y - self.rim0[1])

    def level(self, th, dz, off=0.0, floor=0.0):
        """a point at the height dz over the hats' rim plane in the direction th, off outside the skin (or floor from the axis)"""
        t = math.radians(th); d = np.array([math.cos(t), math.sin(t), self.kr * math.sin(t)]); d /= np.linalg.norm(d)
        a = np.array([0.0, self.c[1], self.rim_z(self.c[1]) + dz]); return a + d * max(self.r(a, d) + off, floor)


def _interp_line(pairs, x): return float(np.interp(x, [p[0] for p in pairs], [p[1] for p in pairs]))


# the hairline: how far down the hair reaches, as degrees up from the skull's middle, by the angle from the face's middle round to the nape
LINE = [(0, 20), (30, 21), (48, 15), (62, 0), (72, -14), (80, -17), (88, 0), (104, 4), (116, -20), (135, -42), (160, -52), (180, -54)]          # (down in front of the ear, over it, and down behind it to the nape)
LINE_LOW = [(0, 31), (30, 30), (52, 16), (68, -8), (84, -24), (100, -34), (125, -48), (155, -58), (180, -60)]          # over the ears and down the neck
LINE_BALD = [(0, 0), (60, 0), (72, 14), (100, 18), (140, 24), (180, 26)]                                    # thinning: where the band of hair begins (above it the scalp is bare)


def _cap(H, M, thick, line=LINE, rows=6, na=NA, top=90.0, bump=None, inner=True):
    """a shell of hair from the crown down to the hairline; thick(th, ph) its depth. Returns the lowest ring (ids) and its points."""
    G = []; gone = set()
    for i in range(rows + 1):
        row = []
        for k in range(na):
            th = 360.0 * k / na; fr = abs(((th - 90 + 180) % 360) - 180); lo = _interp_line(line, fr); hi = top if not callable(top) else top(fr)
            if hi < lo + 2.0: lo = hi; gone.add(k)                     # (no hair here: the rim is below the hairline, or the scalp is bare)
            ph = hi - (hi - lo) * (i / rows) ** 0.9; t = thick(th, ph) if callable(thick) else thick
            if not callable(top): t *= 0.75 + 0.75 * max(0.0, math.sin(math.radians(ph))) ** 0.7          # fuller on top than at the edges
            if bump: t += bump(th, ph, i, k)
            if i == rows: t *= 0.55                                  # the edge thins toward the skin
            if callable(top) and i == 0: t = min(t, 0.002)           # (under a hat: thin where it meets the rim)
            if callable(top) and i == 1: t = min(t, 0.006)
            row.append(H.on(th, ph, t))
        G.append(row)
    ids = [[M.add(p) for p in r] for r in G]
    if top == 90.0 and not callable(top):
        ap = M.add(sum(G[0]) / na + np.array([0, 0, 0.001]))
        for k in range(na): M.face((ids[0][k], ids[0][(k + 1) % na], ap), 'hair', H.c)
    M.grid(ids, 'hair', H.c, skip=lambda i, j: j in gone or (j + 1) % na in gone)
    if inner:                                                       # the edge turned in to the skin
        low = [M.add(G[-1][k] + (H.c - G[-1][k]) / np.linalg.norm(H.c - G[-1][k]) * 0.004 - np.array([0, 0, 0.002])) for k in range(na)]
        M.grid([ids[-1], low], 'hair', H.c, skip=lambda i, j: j in gone or (j + 1) % na in gone)
    return ids, G


def _tube(M, path, radii, m='hair', seg=6, flat=1.0):
    """a round strand along a path (a tail, a braid); closed at its end"""
    prev = None; path = [np.array(p, float) for p in path]
    for i, (p, r) in enumerate(zip(path, radii)):
        d = path[min(i + 1, len(path) - 1)] - path[max(i - 1, 0)]; d /= np.linalg.norm(d); a = np.cross(d, [1.0, 0, 0]); a /= np.linalg.norm(a); b = np.cross(d, a)
        ring = [M.add(p + (a * math.cos(2 * math.pi * q / seg) * flat + b * math.sin(2 * math.pi * q / seg)) * r) for q in range(seg)]
        if prev is not None:
            for q in range(seg): q1 = (q + 1) % seg; M.face((prev[q], prev[q1], ring[q1], ring[q]), m, (path[i - 1] + p) / 2)
        prev = ring
    tip = M.add(path[-1] + (path[-1] - path[-2]) * 0.3)
    for q in range(seg): M.face((prev[q], prev[(q + 1) % seg], tip), m, path[-1])


def _ball(M, c, r, m='hair', seg=8, sq=(1, 1, 1)):
    c = np.array(c, float); rings = []
    for pa in (35, 70, 110, 145):
        a = math.radians(pa); rings.append([M.add(c + np.array([r * math.sin(a) * math.cos(2 * math.pi * q / seg) * sq[0], r * math.sin(a) * math.sin(2 * math.pi * q / seg) * sq[1], r * math.cos(a) * sq[2]])) for q in range(seg)])
    t = M.add(c + np.array([0, 0, r * sq[2]])); b = M.add(c - np.array([0, 0, r * sq[2]]))
    for q in range(seg): q1 = (q + 1) % seg; M.face((t, rings[0][q], rings[0][q1]), m, c); M.face((b, rings[-1][q], rings[-1][q1]), m, c)
    for i in range(3):
        for q in range(seg): q1 = (q + 1) % seg; M.face((rings[i][q], rings[i][q1], rings[i + 1][q1], rings[i + 1][q]), m, c)


def _back(H, z, off=0.0):
    """the skin at the back of the head and the neck at a height: its y (for what hangs down the back)"""
    o = np.array([0.0, H.c[1], z]); return o[1] - (H.r(o, (0, -1, 0)) or 0.05) - off


def _under(H, th):
    """for the hair under a hat: where the hat's rim crosses the head in the direction th, as degrees up from the skull's middle (a little
    below the rim: the hair begins where the hat ends, so the two do not cross)"""
    p = H.level(th, -0.009, 0.0); v = p - H.c; return math.degrees(math.atan2(v[2], math.hypot(v[0], v[1])))


def hair(H, style, hat=False):
    M = Mesh(); top = (lambda fr, H=H: 0) if False else 90.0
    if hat:
        # under a hat: only what shows below the rim (the band at the sides and the back), and what hangs
        tops = {}
        def topf(fr):
            return max(_under(H, 90 + fr), _under(H, 90 - fr))
        top = topf
    low = style in ('mid', 'long', 'curl')
    if style == 'ring' or style in ('short', 'side', 'pony', 'braid', 'bun') or low:
        line = LINE_LOW if low else LINE
        th_ = {'short': 0.007, 'side': 0.009, 'mid': 0.013, 'long': 0.014, 'pony': 0.007, 'braid': 0.007, 'bun': 0.007, 'curl': 0.017, 'ring': 0.006}[style]
        bump = None
        if style == 'side' and not hat: bump = lambda th, ph, i, k: 0.009 * max(0.0, math.cos(math.radians(th - 50))) * (1.0 if 30 < ph < 75 else 0.4)     # fuller over one side of the forehead: the fringe swept across
        if style == 'curl': bump = lambda th, ph, i, k: 0.006 * math.sin(math.radians(th * 5 + i * 70)) * math.cos(math.radians(ph * 4 + k * 40))
        if style == 'ring' and not hat: top = lambda fr: _interp_line(LINE_BALD, fr) + 14.0 if fr > 66 else _interp_line(LINE, fr)      # bare on top and at the front: only the band
        _cap(H, M, th_, line, rows=5 if (hat or style == 'ring') else (8 if style == 'curl' else 6), na=20 if style == 'curl' else NA, top=top, bump=bump)
    nape = H.on(270, -30, 0.004); zc = H.c[2]
    if style == 'long':                                              # the hair down the back to the shoulder blades: a broad, flat fall
        path = []; rad = []
        for i, z in enumerate((nape[2] + 0.035, nape[2] - 0.02, nape[2] - 0.08, nape[2] - 0.15, nape[2] - 0.21)):
            path.append((0.0, min(_back(H, max(z, H.j[2] - 0.07), 0.026), nape[1] + 0.004), z)); rad.append((0.062, 0.078, 0.082, 0.074, 0.050)[i])
        _tube(M, path, rad, seg=8, flat=0.36)
    if style in ('pony', 'braid'):
        tie = H.on(270, 8 if not hat else -22, 0.004); n_ = 6 if style == 'pony' else 8; path = []; rad = []
        for i in range(n_):
            f = i / (n_ - 1); z = tie[2] - 0.02 - 0.17 * f; path.append((0.006 * math.sin(i * 2.4) if style == 'braid' else 0.0, min(tie[1] - 0.012 - 0.035 * math.sin(math.pi * min(1, f * 1.3)), _back(H, max(z, H.j[2] - 0.06), 0.02)), z))
            rad.append((0.020 - 0.010 * f) if style == 'pony' else (0.015 + (0.004 if i % 2 else -0.002) - 0.005 * f))
        _tube(M, [tuple(tie + np.array([0, 0.012, 0.004]))] + path, [0.013] + rad)
    if style == 'bun':
        b = H.on(270, 20 if not hat else -24, 0.0); _ball(M, b + np.array([0, -0.022, 0.0]), 0.036, sq=(1.0, 0.85, 0.9))
    if style == 'mid' and hat: pass
    return M.compact()


# ---------------- the beards (the man's) ----------------
def _face_grid(H, M, th0, th1, ph, thick, hole=None, na=10, m='hair'):
    """a patch of beard on the face: columns from th0 to th1 (degrees round, 90 the face's middle), rows at the heights ph(th) -> (low,
    high) seen from the mouth's own middle; thick(u, v) its depth; hole(th, ph) leaves a cell open"""
    cb = np.array([0.0, H.c[1] - 0.012, H.eye[2] - 0.062])
    def pt(th, p, off):
        t, pp = math.radians(th), math.radians(p); d = np.array([math.cos(t) * math.cos(pp), math.sin(t) * math.cos(pp), math.sin(pp)]); return cb + d * (H.r(cb, d, both=False) + off)
    G = []; I = []; nr = 6
    for i in range(nr + 1):
        row = []
        for k in range(na + 1):
            th = th0 + (th1 - th0) * k / na; lo, hi = ph(th); p = lo + (hi - lo) * i / nr; e = min(i, nr - i, k, na - k)
            row.append(pt(th, p, (thick(k / na, i / nr) if callable(thick) else thick) * (0.35 if e == 0 else 1.0) + 0.0008))
        G.append(row)
    ids = [[M.add(p) for p in r] for r in G]
    def skip(i, j):
        if not hole: return False
        th = th0 + (th1 - th0) * (j + 0.5) / na; lo, hi = ph(th); return hole(th, lo + (hi - lo) * (i + 0.5) / nr)
    M.grid(ids, m, cb, closed=False, skip=skip)
    return cb


def beard(H, kind):
    M = Mesh(); dth = lambda th: abs(th - 90)
    def stache(w=17, t=0.006, droop=0.0):
        _face_grid(H, M, 90 - w, 90 + w, lambda th: (0.5 - droop * dth(th) / w, 6.5 - 2.5 * dth(th) / w), lambda u, v: t * (0.6 + 0.4 * math.sin(math.pi * u)), na=8)
    # the beard's upper edge: under the lower lip in the middle, up the cheek to the ear at the sides (one clean line, no hole for the mouth)
    edge = lambda th: -7.0 + 31.0 * (min(1.0, max(0.0, (dth(th) - 12.0) / 52.0)) ** 0.9)
    if kind == 'stache': stache(19, 0.005, 4.0)
    elif kind == 'goat':
        stache(15, 0.004); _face_grid(H, M, 74, 106, lambda th: (-54.0, -13.0), lambda u, v: 0.011 * math.sin(math.pi * u) ** 0.6, na=6)
    elif kind in ('short', 'full'):
        t = 0.0035 if kind == 'short' else 0.010
        _face_grid(H, M, 10, 170, lambda th: (-44.0 if kind == 'short' else -54.0, edge(th)), lambda u, v: t * (1.0 + (0.9 * (1 - v) * math.sin(math.pi * u) ** 2 if kind == 'full' else 0.0)), na=20)
        stache(17, 0.004 if kind == 'short' else 0.006, 3.0)
    elif kind == 'mutton':
        for a, b in ((14, 62), (118, 166)): _face_grid(H, M, a, b, lambda th: (-34.0, edge(th)), 0.008, na=6)
        stache(19, 0.005, 3.0)
    return M.compact()


# ---------------- the hats ----------------
def _crown(H, M, levels, m, na=NA, peak=None):
    """a hat as rings over the rim plane: levels [(dz, off, floor)]: the height over the rim, how far outside the skin, and the least
    distance from the axis (what gives a crown its own shape where the skull falls away under it). Returns the rings (ids, points)."""
    G = [[H.level(360.0 * k / na, dz, off, fl) for k in range(na)] for dz, off, fl in levels]; ids = [[M.add(p) for p in r] for r in G]
    cen = np.array([0.0, H.c[1], H.rim_z(H.c[1]) + 0.03]); M.grid(ids, m, cen)
    apz = max((sum(G[-1]) / na)[2] + 0.004, H.c[2] + H.r(H.c, (0, 0, 1)) + levels[-1][1])          # (never under the skull's top)
    ap = M.add(np.array([(sum(G[-1]) / na)[0], (sum(G[-1]) / na)[1], apz]))
    for k in range(na): M.face((ids[-1][k], ids[-1][(k + 1) % na], ap), m, cen)
    inn = [M.add(H.level(360.0 * k / na, levels[0][0] + 0.004, max(0.002, levels[0][1] - 0.007))) for k in range(na)]          # the rim turned in
    M.grid([inn, ids[0]], m, cen + np.array([0, 0, 0.2]))
    return ids, G


def _brim(H, M, G0, ids0, depth, drop, m, na=NA, thick=0.004):
    """a brim or a peak from the hat's lowest ring: depth(th) out and drop(th) down; where depth is 0 there is none"""
    out = []; und = []
    for k in range(na):
        th = 360.0 * k / na; p = G0[k]; d = np.array([p[0], p[1] - H.c[1], 0.0]); d /= np.linalg.norm(d); dp = depth(th)
        q = p + d * dp - np.array([0, 0, drop(th)]); out.append(M.add(q)); und.append(M.add(q - np.array([0, 0, thick])))
    cen = np.array([0.0, H.c[1], G0[0][2] - 0.3])
    for k in range(na):
        k1 = (k + 1) % na
        if depth(360.0 * k / na) < 1e-4 and depth(360.0 * k1 / na) < 1e-4: continue
        M.face((ids0[k], ids0[k1], out[k1], out[k]), m, cen); M.face((ids0[k], ids0[k1], und[k1], und[k]), m, cen, inside=True); M.face((out[k], out[k1], und[k1], und[k]), m, np.array([0.0, H.c[1], G0[0][2]]))


def hat(H, kind):
    M = Mesh(); fr = lambda th: abs(((th - 90 + 180) % 360) - 180)              # degrees from the face's middle
    if kind in ('beanie', 'hat_bobble'):
        ids, G = _crown(H, M, [(-0.004, 0.013, 0), (0.018, 0.014, 0), (0.030, 0.010, 0), (0.060, 0.009, 0.062), (0.085, 0.009, 0.046), (0.105, 0.008, 0.024)], 'hat')
        if kind == 'hat_bobble': _ball(M, sum(G[-1]) / NA + np.array([0, 0, 0.016]), 0.030, 'hat')
    elif kind == 'skippercap':
        ids, G = _crown(H, M, [(0.0, 0.011, 0), (0.034, 0.012, 0), (0.050, 0.022, 0.100), (0.082, 0.024, 0.100), (0.098, 0.010, 0.078)], 'wool')
        _brim(H, M, G[0], ids[0], lambda th: 0.058 * max(0.0, math.cos(math.radians(fr(th) * 1.5))) ** 0.7 if fr(th) < 60 else 0.0, lambda th: 0.016, 'peak')
    elif kind == 'hat_flat':
        ids, G = _crown(H, M, [(0.0, 0.011, 0), (0.030, 0.013, 0), (0.060, 0.013, 0.086), (0.086, 0.011, 0.052)], 'hat')
        _brim(H, M, G[0], ids[0], lambda th: 0.046 * max(0.0, math.cos(math.radians(fr(th) * 1.5))) ** 0.7 if fr(th) < 60 else 0.0, lambda th: 0.012, 'hat')
    elif kind == 'hat_ball':
        ids, G = _crown(H, M, [(0.0, 0.010, 0), (0.030, 0.010, 0), (0.060, 0.009, 0.060), (0.084, 0.008, 0.040), (0.100, 0.007, 0.018)], 'hat')
        _brim(H, M, G[0], ids[0], lambda th: 0.078 * max(0.0, math.cos(math.radians(fr(th) * 1.5))) ** 0.6 if fr(th) < 60 else 0.0, lambda th: 0.020, 'hat')
    elif kind == 'hat_bucket':                                       # a sou'wester: the brim short at the front, long and low at the back
        ids, G = _crown(H, M, [(0.0, 0.012, 0), (0.035, 0.012, 0), (0.065, 0.010, 0.058), (0.090, 0.009, 0.036), (0.104, 0.008, 0.016)], 'hat')
        _brim(H, M, G[0], ids[0], lambda th: 0.050 + 0.065 * (fr(th) / 180.0) ** 1.5, lambda th: 0.012 + 0.060 * (fr(th) / 180.0) ** 1.5, 'hat')
    elif kind == 'hardhat':
        ids, G = _crown(H, M, [(0.004, 0.024, 0), (0.030, 0.024, 0.100), (0.062, 0.022, 0.090), (0.090, 0.020, 0.066), (0.108, 0.018, 0.034)], 'helmet', na=20)
        _brim(H, M, G[0], ids[0], lambda th: 0.012 + 0.040 * max(0.0, math.cos(math.radians(fr(th)))) ** 2, lambda th: 0.004, 'helmet', na=20)
        top = sum(G[-1]) / 20; path = [H.level(90, 0.03, 0.026, 0.102) + np.array([0, 0, 0.004]), H.level(90, 0.085, 0.024, 0.072), top + np.array([0, 0, 0.012]), H.level(270, 0.085, 0.024, 0.072), H.level(270, 0.03, 0.026, 0.102)]
        _tube(M, path, [0.009, 0.010, 0.010, 0.010, 0.009], 'helmet', seg=5)
    return M.compact()


HAIRS = ['short', 'side', 'mid', 'long', 'pony', 'braid', 'bun', 'curl']
BEARDS = ['stache', 'goat', 'short', 'full', 'mutton']
HATS = ['hardhat', 'beanie', 'skippercap', 'hat_bobble', 'hat_flat', 'hat_ball', 'hat_bucket']


def build_all(BM, BF):
    """{name: Mesh} for every part on the head"""
    H = Head(BM, BF); out = {}
    for s in HAIRS: out['hair_' + s] = hair(H, s); out['hair_%s_h' % s] = hair(H, s, hat=True)
    out['hair_ring'] = hair(H, 'ring')
    for b in BEARDS: out['b_' + b] = beard(H, b)
    for h in HATS: out[h] = hat(H, h)
    return out
