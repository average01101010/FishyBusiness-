"""The garments on the new body (FB5, steg 122): the jackets with their trouser tops, the sleeves and the trouser legs, the boots
and shoes and the life vests, built as structured meshes round the body of kropp.py. Nothing is taken from arbeider.py, garderobe.py
or hender.py (Jonas 13.11.2026). The hair, the beards and the hats are kropp_hode.py's; the gloves are made of the body's own hands
in kropp_bygg.py. Used by kropp_bygg.py.

Every builder takes a Ctx (a body) and returns a Mesh."""
import math
import numpy as np
from mathutils import Vector
import kropp as K

NC = 20                      # columns round the torso (0 at the right side, 5 the front, 10 the left side, 15 the back)
NS = 12                      # round a sleeve and a trouser leg
PHI = [0, 10, 20, 30, 40, 52, 63]      # the rows over the shoulders: degrees up from the chest's middle (the armhole is rows 0 to 4)

KINDS = {  # ease: room round the body; taper: how fast the cloth may come in again under what holds it out (m per m); hem: its height
    'torso':   dict(ease=0.022, taper=0.10, hem=0.985, rows=[1.07, 1.16, 1.245], collar='fold', gloss='suit'),
    'sweater': dict(ease=0.017, taper=0.22, hem=0.955, rows=[1.01, 1.08, 1.16, 1.245], collar='rib'),
    'oilskin': dict(ease=0.032, taper=0.03, hem=0.775, rows=[0.86, 0.945, 1.03, 1.10, 1.17, 1.245], collar='stand'),
    'parka':   dict(ease=0.034, taper=0.10, hem=0.935, rows=[1.00, 1.07, 1.13, 1.19, 1.25], collar='hood'),
    'fleece':  dict(ease=0.019, taper=0.18, hem=0.975, rows=[1.06, 1.15, 1.245], collar='stand'),
}


class Ctx:
    def __init__(self, B, form=None):
        self.B = B; self.form = form; self.J = {k: np.array(v, float) for k, v in B.joints(form).items()}
        self.J0 = {k: np.array(v, float) for k, v in B.joints(None).items()}
        self.kz = (self.J['neck'][2] - self.J['thigh_R'][2]) / (self.J0['neck'][2] - self.J0['thigh_R'][2])
        self._crotch = None

    def out(self, o, d, far=0.5, default=None):
        r = self.B.out(tuple(o), tuple(d), far, self.form)
        return default if r is None else r

    def z(self, z0):
        """a height of the base body, on this one (the legs and the back stretch with the height)"""
        h0 = self.J0['thigh_R'][2]; h1 = self.J['thigh_R'][2]
        return h1 + (z0 - h0) * self.kz if z0 >= h0 else z0 * h1 / h0

    def yc(self, z):
        """the middle of the body front to back at a height: along the back's joints"""
        names = ['hips', 'spine1', 'spine2', 'spine3', 'neck']; zs = [self.J[n][2] for n in names]; ys = [self.J[n][1] for n in names]
        return float(np.interp(z, zs, ys)) + 0.004

    def crotch(self):
        if self._crotch is None:
            h = self.J['hips']; r = self.out((0.0, h[1], h[2]), (0, 0, -1), 0.4, 0.10); self._crotch = h[2] - r
        return self._crotch


class Mesh:
    """vertices in a fixed order and faces with a material and the point their outside faces away from"""
    def __init__(self): self.v = []; self.f = []
    def add(self, p): self.v.append(np.array(p, float)); return len(self.v) - 1
    def face(self, ids, m, ref, inside=False): self.f.append((tuple(ids), m, np.array(ref, float), inside))
    def grid(self, ids, m, ref, closed=True, skip=None, inside=False):
        R = len(ids); C = len(ids[0])
        for i in range(R - 1):
            for j in range(C if closed else C - 1):
                if skip and skip(i, j): continue
                j1 = (j + 1) % C; self.face((ids[i][j], ids[i][j1], ids[i + 1][j1], ids[i + 1][j]), m, ref(i, j) if callable(ref) else ref, inside)
    def mirror(self, ids):
        """the same vertices on the other side (x -> -x), in the same order"""
        return [self.add((-self.v[i][0], self.v[i][1], self.v[i][2])) for i in ids]
    def compact(self):
        used = sorted({i for f in self.f for i in f[0]}); mp = {o: n for n, o in enumerate(used)}
        self.v = [self.v[i] for i in used]; self.f = [(tuple(mp[i] for i in f[0]), f[1], f[2], f[3]) for f in self.f]; return self


def _smooth_ring(r, it=1):
    r = np.array(r, float)
    for _ in range(it): r = (np.roll(r, 1) + 2 * r + np.roll(r, -1)) / 4
    return r


# ---------------- the arm: the rings of the sleeve ----------------
def arm_axes(c):
    sh, el, wr = c.J['uarm_R'], c.J['farm_R'], c.J['hand_R']; d1 = (el - sh) / np.linalg.norm(el - sh); d2 = (wr - el) / np.linalg.norm(wr - el)
    return sh, el, wr, d1, d2


def _ring_frame(d):
    e1 = np.array([0, 1.0, 0]); e1 = e1 - d * (e1 @ d); e1 /= np.linalg.norm(e1); e2 = np.cross(d, e1)      # e1 forward, e2 out and up (the right arm)
    return e1, e2


def arm_ring(c, k):
    """ring k of the right sleeve (0 the armhole ... 5 the elbow ... 10 the cuff, 11 the cuff turned in): NS points, the first at the
    armpit side (270 degrees), going round by the front"""
    sh, el, wr, d1, d2 = arm_axes(c); L1 = np.linalg.norm(el - sh); L2 = np.linalg.norm(wr - el)
    al = [math.radians(270 + 30 * i) for i in range(NS)]
    if k <= 5:
        s = [0.036, 0.32 * L1, 0.53 * L1, 0.74 * L1, 0.90 * L1, L1][k]; C = sh + d1 * s; d = d1 if k < 5 else (d1 + d2) / np.linalg.norm(d1 + d2)
    else:
        s = [0.13 * L2, 0.36 * L2, 0.60 * L2, 0.82 * L2, L2 - 0.034, L2 - 0.034][k - 6]; C = el + d2 * s; d = d2
    e1, e2 = _ring_frame(d); r = []
    floor = [0.060, 0.058, 0.056, 0.053, 0.052, 0.053, 0.051, 0.049, 0.048, 0.048, 0.050, 0.050][k]
    for a in al:
        u = e1 * math.cos(a) + e2 * math.sin(a)
        if k == 0 and math.sin(a) < -0.2: rb = 0.0                       # (toward the chest the ray would run on through it)
        else: rb = min(c.out(C, u, 0.2, 0.0), 0.095)
        if k == 0: r.append(rb + 0.012 if rb > 0 else floor)             # the armhole lies on the shoulder's own roundness
        else: r.append(max(rb + (0.015 if k <= 5 else 0.013), floor))
    r = _smooth_ring(r, 1)
    if k == 0: r = np.array([rr * (1.0 + 0.04 * max(0.0, math.sin(a))) for rr, a in zip(r, al)])          # the armhole stands a little higher over the shoulder's top
    # the cloth's folds: a soft crease inside the elbow and slack under the upper arm, a bell at the cuff
    if k in (4, 6): r = r + 0.004 * np.cos(np.array(al) * 3 + k)
    if k in (1, 2, 3): r = r + 0.005 * np.maximum(0, -np.sin(np.array(al)))
    if k == 11: r = r * 0.92
    return [C + (e1 * math.cos(a) + e2 * math.sin(a)) * rr for a, rr in zip(al, r)]


# ---------------- the leg: the rings of the trouser leg ----------------
AZ = [210, 240, 270, 300, 330, 0, 30, 60, 90, 120, 150, 180]         # round the right leg: from the back's middle, by the outside, to the front's middle, then the inside


def leg_ring(c, k, seat_ring=None):
    """ring k of the right trouser leg below the seat's (1 ... 5 the knee ... 10 the hem, 11 the hem turned in): NS points as AZ"""
    hp, kn, an = c.J['thigh_R'], c.J['shin_R'], c.J['foot_R']; zb = seat_bottom(c)
    if k <= 5:
        z = [None, zb - 0.075, zb - 0.075 - (zb - 0.075 - kn[2]) * 0.36, zb - 0.075 - (zb - 0.075 - kn[2]) * 0.66, kn[2] + 0.050, kn[2]][k]
        t = (hp[2] - z) / (hp[2] - kn[2]); C = hp + (kn - hp) * t
    else:
        zz = [kn[2] - 0.055, kn[2] - 0.13, kn[2] - 0.215, 0.215, 0.110, 0.110][k - 6]; z = zz
        t = (kn[2] - z) / (kn[2] - an[2]); C = kn + (an - kn) * t
    floor = [0, 0.094, 0.089, 0.084, 0.080, 0.079, 0.079, 0.079, 0.080, 0.081, 0.081, 0.081][k]; r = []     # work trousers: roomy, and straight from the knee down (clear of the boot's shaft)
    for a in AZ:
        u = np.array([math.cos(math.radians(a)), math.sin(math.radians(a)), 0.0])
        rb = min(c.out(C, u, 0.3, 0.0), 0.16); rr = max(rb + 0.020, floor)
        if u[0] < 0: rr = min(rr, (C[0] - 0.004) / max(1e-6, -u[0]))         # never over the middle
        r.append(rr)
    r = _smooth_ring(r, 1)
    for i, a in enumerate(AZ):
        u0 = math.cos(math.radians(a))
        if u0 < 0: r[i] = min(r[i], (C[0] - 0.004) / -u0)
    if k in (4, 6): r = r + 0.005 * np.cos(np.radians(AZ) * 3 + k)             # the creases round the knee
    if k == 11: r = r * 0.86
    return [C + np.array([math.cos(math.radians(a)), math.sin(math.radians(a)), 0.0]) * rr for a, rr in zip(AZ, r)]


SEAT_EASE = 0.022


def seat_bottom(c): return c.crotch() + 0.018


def seat_grid(c):
    """the trousers' top: rings from the waist down to the crotch's height (NC round), and the point between the legs"""
    zb = seat_bottom(c); zt = c.z(1.045); rows = []
    for z in (zt, zt - (zt - zb) * 0.36, zt - (zt - zb) * 0.72, zb):
        o = np.array([0.0, c.yc(z) - 0.004, z]); r = []
        for k in range(NC):
            a = 2 * math.pi * k / NC; r.append(c.out(o, (math.cos(a), math.sin(a), 0), 0.4, 0.15) + SEAT_EASE)
        r = _smooth_ring(r, 1); rows.append([o + np.array([math.cos(2 * math.pi * k / NC), math.sin(2 * math.pi * k / NC), 0]) * r[k] for k in range(NC)])
    cv = np.array([0.0, c.yc(zb) - 0.004, c.crotch() - 0.022])
    return rows, cv


def leg_ring0(c):
    rows, cv = seat_grid(c); b = rows[-1]
    return [b[15], b[16], b[17], b[18], b[19], b[0], b[1], b[2], b[3], b[4], b[5], cv]


# ---------------- the parts ----------------
def sleeves(c, upper):
    """'uarm' (the armhole to the elbow) or 'farm' (the elbow to the cuff), both arms in one part"""
    M = Mesh(); ks = range(0, 6) if upper else range(5, 12)
    R = [[M.add(p) for p in arm_ring(c, k)] for k in ks]; L = [M.mirror(r) for r in R]
    sh, el, wr, d1, d2 = arm_axes(c)
    for side, rings in ((1, R), (-1, L)):
        for i in range(len(rings) - 1):
            k = list(ks)[i]; ax = (sum(M.v[q] for q in rings[i]) + sum(M.v[q] for q in rings[i + 1])) / (2 * NS)
            for j in range(NS):
                j1 = (j + 1) % NS; M.face((rings[i][j], rings[i][j1], rings[i + 1][j1], rings[i + 1][j]), 'suit', ax, inside=(k == 10))
    return M


def legs(c, upper):
    """'thigh' (the seat's leg ring to the knee) or 'shin' (the knee to the hem), both legs in one part"""
    M = Mesh()
    if upper: R = [[M.add(p) for p in leg_ring0(c)]] + [[M.add(p) for p in leg_ring(c, k)] for k in range(1, 6)]
    else: R = [[M.add(p) for p in leg_ring(c, k)] for k in range(5, 12)]
    L = [M.mirror(r) for r in R]; hp, kn, an = c.J['thigh_R'], c.J['shin_R'], c.J['foot_R']
    for side, rings in ((1, R), (-1, L)):
        for i in range(len(rings) - 1):
            ax = (sum(M.v[q] for q in rings[i]) + sum(M.v[q] for q in rings[i + 1])) / (2 * NS)       # the middle of the two rings
            last = (not upper) and i == len(rings) - 2
            for j in range(NS):
                j1 = (j + 1) % NS; M.face((rings[i][j], rings[i][j1], rings[i + 1][j1], rings[i + 1][j]), 'trousers', ax, inside=last)
    return M


def jacket(c, kind):
    """a jacket with its sleeves' holes, its collar and what is on it, and the trousers' top under it (the seat). The armholes' rims are
    the sleeves' first rings and the seat's leg holes the legs' first rings, vertex for vertex."""
    Kd = KINDS[kind]; M = Mesh(); sh = c.J['uarm_R']; J = c.J
    z0 = sh[2] - 0.105; O = np.array([0.0, c.yc(z0), z0]); ease = Kd['ease']
    zrows = [c.z(Kd['hem'])] + [c.z(z) for z in Kd['rows']]; nz = len(zrows)
    th = [2 * math.pi * k / NC for k in range(NC)]
    # the body under each vertex, as a distance from the row's middle
    rb = []; org = []; dirs = []
    for z in zrows:
        o = np.array([0.0, c.yc(z), z]); org.append([o] * NC); dirs.append([np.array([math.cos(a), math.sin(a), 0.0]) for a in th])
        rb.append([c.out(o, d, 0.45, 0.16) for d in dirs[-1]])
    for ph in PHI:
        p = math.radians(ph); org.append([O] * NC); dirs.append([np.array([math.cos(a) * math.cos(p), math.sin(a) * math.cos(p), math.sin(p)]) for a in th])
        rb.append([c.out(O, d, 0.45, 0.16) for d in dirs[-1]])
    rb = np.array(rb); nr = len(rb)
    # the cloth: the body and its ease; under what holds it out it hangs, coming in no faster than the taper
    rg = rb + ease
    rg[nz:] = rb[nz:] + ease * np.array([1.0, 1.0, 0.95, 0.85, 0.75, 0.6, 0.55])[:, None]
    for i in range(nz - 1, -1, -1):
        dz = (zrows[i + 1] if i + 1 < nz else z0) - zrows[i]
        rg[i] = np.maximum(rg[i], rg[i + 1] - Kd['taper'] * dz)
    for i in range(nr): rg[i] = np.maximum(_smooth_ring(rg[i], 1), rb[i] + ease * 0.5)
    zt = c.z(1.045)
    for i in range(nz):
        if zrows[i] < zt + 0.03: rg[i] = np.maximum(rg[i], _smooth_ring(rb[i] + SEAT_EASE, 1) + 0.011)      # over the trousers' top, never in it
    if kind == 'sweater': rg[1] = rg[1] + 0.006                                                             # the body blouses a little over the ribbed hem
    if kind == 'parka':
        for i in range(1, nz, 2): rg[i] = rg[i] + 0.008                                                       # the quilting
    if kind == 'oilskin': rg[0] = rg[0] + 0.006 + 0.004 * np.cos(np.array(th) * 2); rg[1] = rg[1] + 0.002 * np.cos(np.array(th) * 2)   # stiff: it stands out in a few broad folds
    P = [[org[i][k] + dirs[i][k] * rg[i][k] for k in range(NC)] for i in range(nr)]
    # the neck's opening: a clean ring round the neck itself (the rays from the chest meet the neck unevenly)
    nc_ = np.array([0.0, J['neck'][1] + 0.006, J['neck'][2] + 0.004]); rn = _smooth_ring([c.out(nc_, (math.cos(a), math.sin(a), 0.0), 0.2, 0.06) for a in th], 3) + 0.010 + ease * 0.4
    P[-1] = [nc_ + np.array([math.cos(a), math.sin(a), 0.0]) * rn[k] + np.array([0, 0, -0.012 * max(0.0, math.sin(a))]) for k, a in enumerate(th)]
    for k in range(NC):
        if k % 10 not in (0,): P[-2][k] = P[-3][k] * 0.5 + P[-1][k] * 0.5 + np.array([0, 0, 0.004])
    # the armholes: the rim is the sleeve's first ring
    ja = nz; ring = arm_ring(c, 0)
    loop = [(ja, 0), (ja, 1), (ja + 1, 1), (ja + 2, 1), (ja + 3, 1), (ja + 4, 1), (ja + 4, 0), (ja + 4, -1), (ja + 3, -1), (ja + 2, -1), (ja + 1, -1), (ja, -1)]
    for (i, k), p in zip(loop, ring):
        P[i][k % NC] = p; P[i][(10 - k) % NC] = p * np.array([-1, 1, 1])
    # next to the rim the cloth eases toward it (so no vertex of the chest stands outside the sleeve's top)
    for i in range(ja - 1, ja + 6):
        for k, kk in ((2, 1), (-2, -1)):
            if 0 <= i < nr:
                a = P[i][k % NC]; b = P[min(max(i, ja), ja + 4)][kk % NC]; q = a * 0.8 + b * 0.2; P[i][k % NC] = q; P[i][(10 - k) % NC] = q * np.array([-1, 1, 1])
    ids = [[M.add(p) for p in row] for row in P]
    hole = lambda i, j: ja <= i < ja + 4 and (j % NC) in (19, 0, 9, 10)
    M.grid(ids, 'suit', lambda i, j: np.array([0.0, c.yc(P[i][j][2]), min(P[i][j][2], z0 + 0.06)]), skip=hole)
    # the hem turned in (the cloth's thickness)
    hin = [M.add(org[0][k] + dirs[0][k] * (rg[0][k] - 0.010) + np.array([0, 0, 0.004])) for k in range(NC)]
    M.grid([hin, ids[0]], 'suit', np.array([0.0, c.yc(zrows[0]), zrows[0] + 0.3]))
    S = lambda i, kf, off=0.0: _surf(P, org, i, kf, off)
    # ---- the collar ----
    top = ids[-1]; ptop = P[-1]; nk = J['neck'] + np.array([0, 0.0, 0.02]); col = Kd['collar']
    lean = (J['head'][1] - J['neck'][1]) / (J['head'][2] - J['neck'][2])
    def ringup(rows_, m='suit'):
        prev = top; out_ = []
        for dz, dr, tilt in rows_:
            cur = []
            for k in range(NC):
                p = ptop[k]; rad = np.array([p[0], p[1] - nk[1], 0.0]); rl = np.linalg.norm(rad); u = rad / rl
                cur.append(M.add(p + u * (dr + tilt * max(0.0, -u[1])) + np.array([0, lean * dz, dz])))          # (the collar stands along the neck, which leans forward)
            M.grid([prev, cur], m, lambda i, j: nk + np.array([0, 0, 0.02])); prev = cur; out_.append(cur)
        return out_
    if col == 'fold': ringup([(0.030, 0.004, 0.0), (0.036, 0.020, 0.0), (0.012, 0.030, 0.0)])                 # up, over and down again: a turned-down collar
    elif col == 'rib':
        r = ringup([(0.022, -0.003, 0.0), (0.045, -0.005, 0.0)]); ringup_in(M, r[-1], nk, 0.010)
    elif col == 'stand':
        r = ringup([(0.030, 0.000, 0.0), (0.062 if kind == 'oilskin' else 0.052, 0.004, 0.0)]); ringup_in(M, r[-1], nk, 0.009)
    elif col == 'hood':
        r = ringup([(0.028, 0.006, 0.0), (0.050, 0.024, 0.030), (0.030, 0.046, 0.060), (-0.004, 0.040, 0.066)])     # the hood rolled down round the neck, thick at the back
    # ---- what is on it ----
    if kind != 'sweater':
        zc = [(S(i, 5 - 0.16, 0.0045), S(i, 5 + 0.16, 0.0045)) for i in range(0, nr)]
        za = [(M.add(a), M.add(b)) for a, b in zc]
        for i in range(len(za) - 1): M.face((za[i][0], za[i][1], za[i + 1][1], za[i + 1][0]), 'zip' if kind != 'oilskin' else 'suit', np.array([0.0, c.yc(zc[i][0][2]), zc[i][0][2]]))
    if kind == 'oilskin':
        for i in (1, 3, 4, 5):                                           # the buttons down the placket
            b = [M.add(S(i + 0.5 + dy, 5 + dx, 0.008)) for dx, dy in ((0, -0.13), (0.11, 0), (0, 0.13), (-0.11, 0))]
            M.face(b, 'wool', np.array([0.0, c.yc(P[i][5][2]), P[i][5][2]]))
    if kind in ('torso', 'fleece', 'parka'):
        i0 = nz - 2.2 if kind != 'parka' else 0.4
        for sgn in ((1, -1) if kind != 'fleece' else (1,)):
            ka = 5 - sgn * 0.75; kb = 5 - sgn * 2.2
            q = [M.add(S(i0 + a, kc, 0.006)) for a, kc in ((0, ka), (0, kb), (1.25, kb), (1.25, ka))]
            M.face(q, 'suit', np.array([0.0, c.yc(z0), zrows[0] + 0.1]))
            if kind != 'fleece':
                q = [M.add(S(i0 + a, kc, 0.011 if a > 1.0 else 0.013)) for a, kc in ((0.85, ka + sgn * 0.06), (0.85, kb - sgn * 0.06), (1.35, kb - sgn * 0.06), (1.35, ka + sgn * 0.06))]
                M.face(q, 'suit', np.array([0.0, c.yc(z0), zrows[0] + 0.1]))
    # ---- the seat: the trousers' top under the jacket, down to the leg holes ----
    rows, cv = seat_grid(c); sid = [[M.add(p) for p in r] for r in rows]; icv = M.add(cv)
    M.grid(sid, 'trousers', lambda i, j: np.array([0.0, c.yc(rows[i][j][2]), rows[i][j][2]]))
    return M.compact()


def ringup_in(M, ring, nk, dr):
    """the collar's rim turned in (its thickness)"""
    cur = []
    for i in ring:
        p = M.v[i]; rad = np.array([p[0], p[1] - nk[1], 0.0]); u = rad / np.linalg.norm(rad); cur.append(M.add(p - u * dr - np.array([0, 0, 0.006])))
    M.grid([ring, cur], 'suit', nk + np.array([0, 0, 0.3]))


def _surf(P, org, i, kf, off):
    """a point on the jacket's grid at row i (may be between rows) and column kf, pushed off along the way out"""
    i0 = int(math.floor(i)); fi = i - i0; i1 = min(i0 + 1, len(P) - 1); k0 = int(math.floor(kf)) % NC; fk = kf - math.floor(kf); k1 = (k0 + 1) % NC
    p = (P[i0][k0] * (1 - fk) + P[i0][k1] * fk) * (1 - fi) + (P[i1][k0] * (1 - fk) + P[i1][k1] * fk) * fi
    o = org[i0][0] * (1 - fi) + org[i1][0] * fi; d = p - o; d[2] *= 0.3; d /= np.linalg.norm(d)
    return p + d * off


# ---------------- the shoes: built on the body's own feet (Jonas 13.11.2026: nothing of the old; «at sålene på skoene ikke er firkanter») ----------------
SHOES = {   # sole: its thickness; shaft: the heights of the shaft's rings (none: a low shoe); sock: a sock up into the trouser leg
    'boot':    dict(sole=0.022, shaft=[0.10, 0.16, 0.23, 0.295, 0.318], roll=True, sock=False, solem='sole', cap=False),      # a rubber deck boot
    'shoe':    dict(sole=0.024, shaft=[0.085, 0.115, 0.142], roll=False, sock=True, solem='sole', cap=False),                  # an ankle boot
    'sneaker': dict(sole=0.028, shaft=[], roll=False, sock=True, solem='cream', cap=True),                                    # a deck shoe: a light sole and toe cap
}


def foot_shape(c, n=11):
    """the right foot seen from above and from the side: its line from the heel to the toes, and at n places along it how far it
    reaches to the inside and the outside and how high it stands (the instep; the leg above the ankle is not the foot's)"""
    v = c.B.v; f = v[(v[:, 0] > 0) & (v[:, 2] < 0.16)]; low = f[f[:, 2] < 0.05]
    c0 = low[low[:, 1] < low[:, 1].min() + 0.03].mean(0); c1 = low[low[:, 1] > low[:, 1].max() - 0.03].mean(0); ax = (c1 - c0)[:2]; ax /= np.linalg.norm(ax); nx = np.array([ax[1], -ax[0]])
    t = (f[:, :2] - c0[:2]) @ ax; u = (f[:, :2] - c0[:2]) @ nx; ts = np.linspace(t.min(), t.max(), n); lo = []; hi = []; top = []
    for tk in ts:
        m = np.abs(t - tk) < 0.016; q = f[m]; lo.append(u[m].min()); hi.append(u[m].max()); zz = q[q[:, 2] < 0.112][:, 2]; top.append(zz.max() if len(zz) else 0.05)
    sm = lambda a: np.convolve(np.pad(np.array(a, float), 1, mode='edge'), [0.25, 0.5, 0.25], mode='valid')
    return c0[:2], ax, nx, ts, sm(lo), sm(hi), sm(top)


def shoes(c, kind):
    """a pair of shoes on the body's feet: the upper over the foot's own outline and instep, a sole that follows the same outline
    (rounded at the heel and the toe), the shaft round the leg, and for the low ones a sock up into the trouser leg"""
    S = SHOES[kind]; M = Mesh(); o, ax, nx, ts, lo, hi, top = foot_shape(c); n = len(ts); sh = S['sole']
    P3 = lambda t, u, z: np.array([o[0] + ax[0] * t + nx[0] * u, o[1] + ax[1] * t + nx[1] * u, z])
    rings = []; tt = list(ts); tt[0] -= 0.006; tt[-1] += 0.008
    for k in range(n):
        e = min(k, n - 1 - k); kw = (0.62, 0.90)[e] if e < 2 else 1.0                    # the heel and the toe round off
        uc = (lo[k] + hi[k]) / 2; hw = (hi[k] - lo[k]) / 2 * kw + 0.006; tp = max(sh + 0.018, top[k] + 0.008) * (0.80 if e == 0 else 1.0)
        r = [P3(tt[k], uc - hw * 0.94, 0.0), P3(tt[k], uc + hw * 0.94, 0.0), P3(tt[k], uc + hw + 0.003, sh)]
        for ph in range(20, 161, 20):
            a = math.radians(ph); cu = math.copysign(abs(math.cos(a)) ** 0.8, math.cos(a)); r.append(P3(tt[k], uc + hw * cu, sh + (tp - sh) * math.sin(a) ** 0.75))
        r.append(P3(tt[k], uc - hw - 0.003, sh)); rings.append(r)
    def side(mir):
        ids = [[M.add(p * mir) for p in r] for r in rings]; nr = len(rings[0])
        for k in range(n - 1):
            cen = (sum(rings[k]) + sum(rings[k + 1])) / (2 * nr) * mir
            for j in range(nr):
                j1 = (j + 1) % nr; m = S['solem'] if j in (0, 1, nr - 1) else ('cream' if S['cap'] and k >= n - 3 else 'boot')
                M.face((ids[k][j], ids[k][j1], ids[k + 1][j1], ids[k + 1][j]), m, cen)
        for k, back in ((0, -1), (n - 1, 1)):                                              # the heel's and the toe's ends
            cp = sum(rings[k]) / nr + np.array([ax[0], ax[1], 0.0]) * back * 0.004; ic = M.add(cp * mir); cen = sum(rings[k]) / nr * mir - np.array([ax[0] * mir[0], ax[1], 0.0]) * back * 0.05
            for j in range(nr):
                j1 = (j + 1) % nr; M.face((ids[k][j], ids[k][j1], ic), S['solem'] if j in (0, 1, nr - 1) else ('cream' if S['cap'] and k else 'boot'), cen)
        # the shaft round the leg, and the sock
        kn, an = c.J['shin_R'], c.J['foot_R']
        def tube(zs, rad, m, turn=False, rmax=0.067):
            prev = None
            for i, z in enumerate(zs):
                cc = an + (kn - an) * (z - an[2]) / (kn[2] - an[2]); ring = []
                for q in range(NS):
                    a = 2 * math.pi * q / NS; d = np.array([math.cos(a), math.sin(a), 0.0]); rb = c.out(cc, d, 0.2, 0.05) if rad is None else rad - 0.011
                    rr = min(max(rb + 0.011, 0.050), rmax)
                    if turn and i == len(zs) - 1: rr = rr - 0.008 if not S['roll'] else rr
                    if S['roll'] and m == 'boot' and i == len(zs) - 2: rr += 0.004
                    ring.append(M.add((cc + d * rr) * mir))
                if prev is not None:
                    cen = np.array([cc[0], cc[1], z - 0.02]) * mir
                    for q in range(NS): q1 = (q + 1) % NS; M.face((prev[q], prev[q1], ring[q1], ring[q]), m, cen, inside=(turn and i == len(zs) - 1 and not S['roll']))
                prev = ring
        if S['shaft']: tube([0.045] + S['shaft'] + [S['shaft'][-1] - (0.0 if S['roll'] else 0.004)], None, 'boot', turn=True)
        if S['sock']: tube([0.05, 0.12, 0.19], 0.047, 'wool', rmax=0.047)
    side(np.array([1, 1, 1.0])); side(np.array([-1, 1, 1.0]))
    return M


# ---------------- the inflatable lifejacket, new (Jonas' references 28.10.2026, described in docs/planer/lover-og-regler.md L6: a collar
# round the neck running down the chest in two thick tubes, a black belt with a buckle, a crotch strap, a red pull handle) ----------------
VEST_GROUPS = [('vest', ['torso', 'sweater', 'fleece']), ('vest_o', ['oilskin']), ('vest_p', ['parka']), ('vestF', ['jacketF', 'sweaterF', 'fleeceF']), ('vest_oF', ['oilskinF']), ('vest_pF', ['parkaF'])]
VEST_FOR = {j: v for v, js in VEST_GROUPS for j in js}
VEST_HAIR = {'long': 'bun', 'pony': 'bun', 'braid': 'bun'}            # long hair is put up under the vest's collar (as today)


def vest(c, hit):
    """a vest over what hit(origin, direction) meets: hit casts a ray from far out in toward origin + direction * far and gives the
    outermost point of the jackets (and the neck) there, or None. Laid 4 mm off it."""
    M = Mesh(); J = c.J; sh = J['uarm_R']; nk = J['neck']; GAP = 0.004
    zb = c.z(1.105); yc = c.yc(zb); cen = np.array([0.0, yc, zb])
    # the belt
    NB = 24; ring = []
    for k in range(NB):
        a = 2 * math.pi * k / NB; d = np.array([math.cos(a), math.sin(a), 0.0]); r = 0.0
        for dz in (-0.02, 0.0, 0.02):
            h = hit(cen + np.array([0, 0, dz]), d)
            if h is not None: r = max(r, float((h - cen) @ d))
        ring.append((d, (r or 0.2) + GAP + 0.004))
    rows = [[M.add(cen + d * (r + dr) + np.array([0, 0, dz])) for d, r in ring] for dz, dr in ((-0.02, 0.0), (-0.02, 0.005), (0.02, 0.005), (0.02, 0.0))]
    M.grid(rows, 'belt', lambda i, j: cen + np.array([0, 0, (-0.3, 0.0, 0.3)[i]]) if i != 1 else cen)
    fr = cen + ring[NB // 4][0] * (ring[NB // 4][1] + 0.005)
    for sx in (-1, 1):                                  # the buckle's two halves
        b = [M.add(fr + np.array([sx * dx, 0.006, dz])) for dx, dz in ((0.002, -0.017), (0.030, -0.017), (0.030, 0.017), (0.002, 0.017))]; M.face(b, 'buckle', cen)
    # the two tubes and the collar: a path from the right tube's foot on the belt, up the chest, over the shoulder beside the neck and
    # round behind it to the middle of the back; the left is the mirror
    path = []
    def front(x, z):
        o = np.array([x, yc, z]); h = hit(o, (0, 1, 0)); return (h if h is not None else o + np.array([0, 0.12, 0])), np.array([0, 1.0, 0])
    zs = sh[2] - 0.02
    for i in range(8):
        f = i / 7; p, n = front(0.070 + 0.022 * f, zb + 0.012 + (zs - zb - 0.012) * f); path.append((p, n, 0.074, 0.030))
    cs = np.array([0.0, nk[1] - 0.004, zs - 0.05])
    for i in range(1, 7):                               # over the shoulder: the ray turns from the front, over the top, to the back
        al = math.radians(18 + 26 * i); x = 0.092 - 0.004 * i; o = np.array([x, cs[1], cs[2]]); d = np.array([0.0, math.cos(al), math.sin(al)])
        h = hit(o, d); path.append(((h if h is not None else o + d * 0.14), d, 0.070, 0.028))
    for i in range(1, 4):                               # round the back of the neck to the middle
        x = 0.076 * (1 - i / 3); o = np.array([x, nk[1], nk[2] + 0.012]); d = np.array([0.35 * x / 0.076, -1.0, 0.25]); d /= np.linalg.norm(d)
        h = hit(o, d); path.append(((h if h is not None else o + d * 0.09), d, 0.066, 0.026))
    def tube(mir):
        prev = None; n = len(path)
        for i, (p, nrm, w, t) in enumerate(path):
            p = p * mir; nrm = nrm * mir; a = path[min(i + 1, n - 1)][0] * mir - path[max(i - 1, 0)][0] * mir; a /= np.linalg.norm(a); side = np.cross(a, nrm); side /= np.linalg.norm(side)
            e = min(i, 3) / 3.0; w2 = w * (0.6 + 0.4 * e); t2 = t * (0.5 + 0.5 * e)
            ring = []
            for sx, tz in ((-1, 0.0), (-0.85, 0.75), (0, 1.0), (0.85, 0.75), (1, 0.0)):          # each point on the cloth under itself: a tube's edge does not dip into a rounded chest
                b0 = p + side * (w2 / 2 * sx); h = hit(b0 - nrm * 0.10, nrm); lift = max(0.0, float((h - b0) @ nrm)) if h is not None else 0.0
                ring.append(M.add(b0 + nrm * (min(lift, 0.075) + GAP + 0.006 + (0.008 if i >= len(path) - 4 else 0.0) + t2 * tz)))          # (more room round the neck)
            if prev is not None:
                for q in range(4):
                    cc = (M.v[prev[q]] + M.v[ring[q + 1]]) / 2 - nrm * 0.05
                    m = 'vest'
                    if q in (1, 2) and (i in (5, 6) or i >= n - 2): m = 'refl'
                    if (q == 0 and mir[0] > 0) or (q == 3 and mir[0] < 0): m = 'vestzip'
                    M.face((prev[q], prev[q + 1], ring[q + 1], ring[q]), m, cc)
            else:
                M.face(ring, 'vest', p + a * 0.05)
            prev = ring
        return prev
    eR = tube(np.array([1, 1, 1.0])); eL = tube(np.array([-1, 1, 1.0]))
    # the pull handle under the left tube's foot (the wearer's left)
    f0 = path[0][0] * np.array([-1, 1, 1.0]) + np.array([0, 0.012, -0.03]); tip = M.add(f0 + np.array([0, 0, -0.05])); rr = [M.add(f0 + np.array([0.011 * math.cos(q * 2.094), 0.006 * math.sin(q * 2.094) + 0.004, 0.0])) for q in range(3)]
    for q in range(3): M.face((rr[q], rr[(q + 1) % 3], tip), 'toggle', f0 + np.array([0, 0, -0.02]))
    # the crotch strap: from the belt's front, down between the legs, up to the belt's back
    hp = np.array([0.0, yc, c.crotch() + 0.07]); strap = []
    for i in range(13):
        al = math.radians(-8 + 196 * i / 12); d = np.array([0.0, math.cos(al), -math.sin(al)]); r = 0.0
        for dx in (-0.012, 0.0, 0.012):
            h = hit(hp + np.array([dx, 0, 0]), d)
            if h is not None: r = max(r, float((h - hp) @ d))
        if d[2] < -1e-6: r = min(r or 0.12, 0.085 / -d[2])          # (never below the trousers' crotch: between the legs the outermost thing a ray meets is a trouser leg far down)
        p = hp + d * ((r or 0.12) + GAP + 0.009); strap.append([M.add(p + np.array([-0.0125, 0, 0])), M.add(p + np.array([0.0125, 0, 0]))])
    M.grid(strap, 'belt', hp, closed=False)
    return M


BUILDERS = {
    'uarm': lambda c: sleeves(c, True), 'farm': lambda c: sleeves(c, False), 'thigh': lambda c: legs(c, True), 'shin': lambda c: legs(c, False),
}
JACKETS_M = {'torso': 'torso', 'sweater': 'sweater', 'oilskin': 'oilskin', 'parka': 'parka', 'fleece': 'fleece'}
JACKETS_F = {'jacketF': 'torso', 'sweaterF': 'sweater', 'oilskinF': 'oilskin', 'parkaF': 'parka', 'fleeceF': 'fleece'}
