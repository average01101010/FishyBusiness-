"""The new body of the people (FB5, steg 122, 13.11.2026; docs/planer/folk-2.md). Jonas 13.11.2026: «et sterkt grafisk løft, og større
mulighet for tilpasning», and on the bodies, with two reference pictures (grey base bodies in a row: men thin, normal, muscular,
overweight; women thin, normal, curvy, muscular, plus; the pictures are not in the repo and those models are not used): «Jeg tenker
jo at kroppene må være noe som disse 3d-modellene slik at folk blir forskjellige og har forskjellige kroppsbygninger.»

This file is the body itself, without Blender (numpy, scipy and scikit-image only):
  - the body as a smooth union of rounded shapes (the bones' flesh: ribcage, pelvis, muscles, fat), one set per sex, each a function
    of the build (thin, heavy, muscle, curvy, age): prims(sex, f). The surface is where the field is 0 (field()).
  - the skeleton: 24 joints with the rest pose (an A-pose) per sex and build: joints(sex, f).
  - the weights: a function of the place in the rest pose (weights()), the same for the skin and for everything worn, so two things
    in the same place move the same way and a garment follows the body under it.
  - the pose: linear blend skinning in numpy (skin()), and the poses the check uses (POSES).
kropp_bygg.py builds the meshes, the garments, the forms and the GLB in Blender from this.

Frame (Blender's, as arbeider.py): x to the person's right, y forward, z up, metres, the ground at z = 0.
"""
import math, hashlib, json, os
import numpy as np

FORMS = ['thin', 'heavy', 'muscle', 'curvy', 'age', 'tall']          # the forms that blend; 'tall' is negative for a short person


def F0(**kw):
    f = {k: 0.0 for k in FORMS}; f.update(kw); return f


# the named builds of Jonas' reference (what the wardrobe shows; the crew draws numbers between them). Weights per form.
BUILDS = {
    'm': {'thin': F0(thin=1), 'normal': F0(), 'muscular': F0(muscle=1), 'heavy': F0(heavy=1)},
    'f': {'thin': F0(thin=1), 'normal': F0(), 'curvy': F0(curvy=1), 'muscular': F0(muscle=1), 'heavy': F0(heavy=1)},
}

# ---------------- the skeleton ----------------
FINGERS = ['thumb', 'index', 'middle', 'ring', 'little']
BONES = [('hips', None), ('spine1', 'hips'), ('spine2', 'spine1'), ('spine3', 'spine2'), ('neck', 'spine3'), ('head', 'neck')]      # name, parent
for _sd in 'RL':
    BONES += [('clav_' + _sd, 'spine3'), ('uarm_' + _sd, 'clav_' + _sd), ('utw_' + _sd, 'uarm_' + _sd), ('farm_' + _sd, 'utw_' + _sd), ('ftw_' + _sd, 'farm_' + _sd), ('hand_' + _sd, 'ftw_' + _sd)]
    for _f in FINGERS: BONES += [('%s1_%s' % (_f, _sd), 'hand_' + _sd), ('%s2_%s' % (_f, _sd), '%s1_%s' % (_f, _sd)), ('%s3_%s' % (_f, _sd), '%s2_%s' % (_f, _sd))]
for _sd in 'RL':
    BONES += [('thigh_' + _sd, 'hips'), ('ttw_' + _sd, 'thigh_' + _sd), ('shin_' + _sd, 'ttw_' + _sd), ('foot_' + _sd, 'shin_' + _sd), ('toe_' + _sd, 'foot_' + _sd)]
# (utw, ftw, ttw: the twist bones half way down the upper arm, the forearm and the thigh. They carry a share of the limb's roll about
# its own length, so a turned wrist or shoulder does not wring the skin like a sweet's wrapper.)
BI = {n: i for i, (n, p) in enumerate(BONES)}
PARENT = [BI[p] if p else -1 for n, p in BONES]


# the joints of the body in its rest pose, measured on the base meshes (tools/harbour/kilde/, scaled to 1.776 m): the right side and
# the middle; the left side is the mirror. HEADY: how far in front of the head's joint the skull's middle is.
BASE = {
    'm': {'hips': (0.0, -0.015, 0.95), 'spine1': (0.0, -0.018, 1.05), 'spine2': (0.0, -0.030, 1.18), 'spine3': (0.0, -0.040, 1.31), 'neck': (0.0, -0.030, 1.49), 'head': (0.0, 0.000, 1.575),
          'clav': (0.022, -0.030, 1.445), 'uarm': (0.185, -0.045, 1.415), 'farm': (0.300, -0.085, 1.165), 'hand': (0.374, -0.017, 0.921),
          'thigh': (0.090, -0.010, 0.93), 'shin': (0.098, -0.025, 0.50), 'foot': (0.115, -0.058, 0.085), 'toe': (0.125, 0.070, 0.020)},
    'f': {'hips': (0.0, -0.012, 0.95), 'spine1': (0.0, -0.014, 1.05), 'spine2': (0.0, -0.024, 1.18), 'spine3': (0.0, -0.036, 1.31), 'neck': (0.0, -0.040, 1.49), 'head': (0.0, -0.028, 1.575),
          'clav': (0.020, -0.034, 1.440), 'uarm': (0.172, -0.050, 1.405), 'farm': (0.288, -0.080, 1.168), 'hand': (0.372, -0.016, 0.930),
          'thigh': (0.092, -0.010, 0.93), 'shin': (0.091, -0.021, 0.50), 'foot': (0.095, -0.058, 0.085), 'toe': (0.102, 0.070, 0.020)},
}
HEADY = {'m': 0.022, 'f': 0.032}


SRC = {'m': os.path.join(os.path.dirname(os.path.abspath(__file__)), 'kilde', 'mann.obj'), 'f': os.path.join(os.path.dirname(os.path.abspath(__file__)), 'kilde', 'kvinne.obj')}
STATURE = 1.776
_OBJ = {}; _FING = {}


def load_obj(sex):
    """the base mesh (tools/harbour/kilde/LISENS.md): its frame is y up, facing +z, in inches; here x to the person's right, y forward,
    z up, scaled to STATURE: (verts (N, 3), faces [[i, ...]])"""
    if sex not in _OBJ:
        v = []; f = []
        for l in open(SRC[sex]):
            if l.startswith('v '): a = l.split(); v.append((-float(a[1]), float(a[3]), float(a[2])))
            elif l.startswith('f '): f.append([int(x.split('/')[0]) - 1 for x in l.split()[1:]])
        v = np.array(v); v[:, 2] -= v[:, 2].min(); v *= STATURE / v[:, 2].max(); v[:, 0] -= (v[:, 0].min() + v[:, 0].max()) / 2
        _OBJ[sex] = (v, f)
    return _OBJ[sex]


def fingers(sex):
    """the fingers of the right hand, found in the base mesh: where the hand splits into four fingers and a thumb, each finger's line
    and its joints. {'d': the hand's direction, 'n': out of the palm, 'side': across the hand toward the thumb,
    finger: [knuckle, middle joint, last joint, tip]}"""
    if sex in _FING: return _FING[sex]
    v, faces = load_obj(sex); w = np.array(BASE[sex]['hand'], float)
    hand = np.where((v[:, 0] > 0.25) & (v[:, 2] < w[2] + 0.01))[0]; hs = set(hand.tolist()); P = v[hand]; c = P.mean(0)
    _, _, vt = np.linalg.svd(P - c); d = vt[0] if vt[0][2] < 0 else -vt[0]; n = vt[2] if vt[2][0] < 0 else -vt[2]        # the palm faces the thigh
    t = (v - w) @ d; adj = {i: set() for i in hand}
    for q in faces:
        for a, b in zip(q, q[1:] + q[:1]):
            if a in hs and b in hs: adj[a].add(b); adj[b].add(a)
    def comps(cut):
        keep = {i for i in hand if t[i] > cut}; seen = set(); out = []
        for i in sorted(keep):
            if i in seen: continue
            st = [i]; seen.add(i); cc = []
            while st:
                x = st.pop(); cc.append(x)
                for y in adj[x]:
                    if y in keep and y not in seen: seen.add(y); st.append(y)
            out.append(cc)
        return out
    cut = 0.06; th_cut = None
    while cut < 0.15:
        cs = comps(cut)
        if th_cut is None and len(cs) == 2: th_cut = cut; thumb = min(cs, key=len)
        if len(cs) == 5: break
        cut += 0.005
    cs = sorted(cs, key=len)[1:]; tc = v[thumb].mean(0)
    cs.sort(key=lambda cc: np.linalg.norm(v[cc].mean(0) - tc)); F = {'d': d, 'n': n}
    def chain(cc, start, back, fr):
        p = v[cc]; c0 = p.mean(0); _, _, vt_ = np.linalg.svd(p - c0); a = vt_[0] if vt_[0] @ d > 0 else -vt_[0]; s_ = (p - c0) @ a
        tip = c0 + a * s_.max(); base = c0 + a * (s_.min() - back); L = np.linalg.norm(tip - base)
        def cen(u):          # the middle of the finger's section at a share u of its length
            m = np.abs((p - base) @ a - u * L) < 0.006; return p[m].mean(0) if m.sum() >= 3 else base + a * u * L
        return [base, cen(fr[0]), cen(fr[1]), tip]
    for name, cc in zip(FINGERS[1:], cs): F[name] = chain(cc, None, 0.016, (0.46, 0.74))
    th = chain(thumb, None, 0.012, (0.50, 0.50)); mcp = th[0]; cmc = w + (mcp - w) * 0.30 + d * 0.004
    F['thumb'] = [cmc, mcp, th[1], th[3]]
    side = np.cross(n, d); side = side if side @ (F['index'][0] - F['little'][0]) > 0 else -side; F['side'] = side
    F['verts'] = {name: np.array(cc) for name, cc in zip(FINGERS[1:], cs)}; F['verts']['thumb'] = np.array(thumb); F['hand'] = hand; F['adj'] = adj          # (the mesh's own split: which vertices are which finger's)
    _FING[sex] = F; return F


def joints(sex='m', f=None):
    """the joints' places in the rest pose: {name: (x, y, z)}. The height stretches the legs, the back and the arms (the head keeps its
    size), age shortens and stoops, muscle widens the shoulders a little."""
    f = f or F0(); B = {k: np.array(v, float) for k, v in BASE[sex].items()}
    FG = fingers(sex)
    tall = f['tall']; age = f['age']
    kl = 1 + 0.075 * tall - 0.012 * age            # the legs
    kb = 1 + 0.060 * tall - 0.030 * age            # the back
    ka = 1 + 0.070 * tall                          # the arms
    dsw = 0.010 * f['muscle'] + 0.006 * f['heavy'] - 0.006 * f['thin'] + 0.008 * tall
    dhw = 0.004 * f['heavy'] + 0.003 * f['curvy']
    st = age * 0.03                                # the stoop: the upper back and the head come forward
    h0 = B['thigh'][2]; hz = h0 * kl
    def up(p, sty=0.0, drop=0.0):                  # a point of the upper body: the back stretches from the hips' joints up
        return np.array([p[0], p[1] + sty, hz + (p[2] - h0) * kb - drop])
    J = {}
    J['hips'] = tuple(up(B['hips'])); J['spine1'] = tuple(up(B['spine1'])); J['spine2'] = tuple(up(B['spine2'], st * 0.3)); J['spine3'] = tuple(up(B['spine3'], st * 0.8))
    nk = up(B['neck'], st * 1.7, st * 0.25); J['neck'] = tuple(nk); J['head'] = tuple(nk + (B['head'] - B['neck']) + np.array([0, st * 0.9, 0]))
    sh = up(B['uarm'], st * 1.2, st * 0.25) + np.array([dsw, 0, 0]); el = sh + (B['farm'] - B['uarm']) * ka; wr = el + (B['hand'] - B['farm']) * ka
    cl = up(B['clav'], st * 1.4, st * 0.25)
    th = np.array([B['thigh'][0] + dhw, B['thigh'][1], hz]); kn = np.array([B['shin'][0] + dhw, B['shin'][1], 0.085 + (B['shin'][2] - 0.085) * (hz - 0.085) / (h0 - 0.085)])
    ft = B['foot'] + np.array([dhw, 0, 0]); to = B['toe'] + np.array([dhw, 0, 0])
    for s, sd in ((1, 'R'), (-1, 'L')):
        m = lambda p: (s * float(p[0]), float(p[1]), float(p[2]))
        J['clav_' + sd] = m(cl); J['uarm_' + sd] = m(sh); J['utw_' + sd] = m((sh + el) / 2); J['farm_' + sd] = m(el); J['ftw_' + sd] = m((el + wr) / 2); J['hand_' + sd] = m(wr)
        J['thigh_' + sd] = m(th); J['ttw_' + sd] = m((th + kn) / 2); J['shin_' + sd] = m(kn); J['foot_' + sd] = m(ft); J['toe_' + sd] = m(to)
        for fn in FINGERS:
            for k in range(3): J['%s%d_%s' % (fn, k + 1, sd)] = m(FG[fn][k] + (wr - B['hand']))
    return J


def tails(J, sex=None):
    """the far end of each bone (where its child starts; the leaves get a tail of their own)"""
    T = {}; kids = {}
    for n, p in BONES: kids.setdefault(p, []).append(n)
    for n, p in BONES:
        ch = kids.get(n, []); sd = n[-1]; A = lambda q: np.array(J[q], float)
        if n == 'hips': T[n] = J['spine1']
        elif n == 'spine3': T[n] = J['neck']
        elif n == 'head': T[n] = (J['head'][0], J['head'][1] - 0.01, J['head'][2] + 0.19)
        elif n.startswith('hand'): T[n] = J['middle1_' + sd]
        elif n.startswith('toe'): T[n] = (J[n][0], J[n][1] + 0.08, J[n][2])
        elif n.startswith('clav'): T[n] = J['uarm_' + sd]
        elif n[:-3] in FINGERS and n[-3] == '3': a, b = A(n[:-3] + '2_' + sd), A(n); T[n] = tuple(b + (b - a) / np.linalg.norm(b - a) * (0.024 if n.startswith('thumb') else 0.020))
        else: T[n] = J[ch[0]]
    return T


# ---------------- the body as rounded shapes ----------------
def _ss(x, a, b):
    t = np.clip((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t)


def _rot_to(d, roll=0.0):
    """a rotation whose local z runs along d (local x as level as it can be), turned roll about it"""
    z = np.array(d, float); z /= np.linalg.norm(z); up = np.array([0, 1.0, 0]) if abs(z[1]) < 0.9 else np.array([1.0, 0, 0])
    x = np.cross(up, z); x /= np.linalg.norm(x); y = np.cross(z, x)
    c, s = math.cos(roll), math.sin(roll); x2 = x * c + y * s; y2 = -x * s + y * c
    return np.stack([x2, y2, z], 1)


def E(c, r, R=None, k=None, neg=False, g='b'):
    return {'t': 'e', 'c': np.array(c, float), 'r': np.array(r, float), 'R': R, 'k': k, 'neg': neg, 'g': g}


def Cn(a, b, ra, rb, k=None, flat=1.0, g='b'):
    """a rounded cone from a (radius ra) to b (rb); flat squeezes it along y (a limb's section is not a circle)"""
    return {'t': 'c', 'a': np.array(a, float), 'b': np.array(b, float), 'ra': ra, 'rb': rb, 'k': k, 'neg': False, 'flat': flat, 'g': g}


def prims(sex='m', f=None):
    """the shapes of the right half (x >= 0) and the middle; the left half is the mirror (field() takes |x|)"""
    f = f or F0(); F = sex == 'f'
    t, h, m, cv, age = f['thin'], f['heavy'], f['muscle'], f['curvy'], f['age']
    J = joints(sex, f); A = lambda n: np.array(J[n]); P = []
    hipz = J['thigh_R'][2]; nz = J['neck'][2]; kb = (J['spine3'][2] - J['hips'][2]) / 0.33
    zs = lambda z: J['hips'][2] + (z - 0.95) * kb if z > 0.95 else hipz + (z - 0.92)            # a height of the 1.78 m body, on this one
    lean = 1 - 0.13 * t + 0.20 * h + 0.07 * m + 0.05 * cv - 0.04 * age                             # the limbs' thickness
    fat = h + 0.35 * cv + 0.25 * age
    _zs = [J[n][2] for n in ('hips', 'spine1', 'spine2', 'spine3', 'neck')]; _ys = [J[n][1] + 0.012 for n in ('hips', 'spine1', 'spine2', 'spine3', 'neck')]
    yst = lambda z: float(np.interp(z, _zs, _ys))           # the body's middle front to back at a height (the back's joints, and the stoop with them)
    # ---- the torso ----
    pw = (0.160 if F else 0.150) * (1 - 0.07 * t + 0.20 * h + 0.07 * cv); pd = 0.100 * (1 - 0.08 * t + 0.34 * h + 0.05 * cv)
    P.append(E((0, -0.006 + yst(zs(0.955)), zs(0.955)), (pw, pd, 0.105), k=0.022))                                           # the pelvis
    gl = (1.10 if F else 1.0) * (1 - 0.10 * t + 0.22 * h + 0.16 * cv + 0.08 * m)
    P.append(E((0.082 + 0.01 * h, -0.058 - 0.012 * h - 0.01 * cv + yst(zs(0.905)), zs(0.905)), (0.080 * gl, 0.078 * gl, 0.092 * gl)))   # the buttock
    ww = (0.124 if F else 0.139) * (1 - 0.09 * t + 0.42 * h - 0.05 * cv + 0.03 * m + 0.10 * age)
    wd = (0.086 if F else 0.094) * (1 - 0.10 * t + 0.62 * h + 0.16 * age)
    P.append(E((0, 0.004 + 0.035 * h + 0.012 * age + yst(zs(1.09)), zs(1.09)), (ww, wd, 0.165), k=0.026))    # the waist and the belly
    if h > 0 or age > 0:                                                                            # the paunch hangs forward and low
        q = h + 0.4 * age; P.append(E((0, 0.060 + 0.045 * q + yst(zs(1.045)), zs(1.045) - 0.02 * q), (0.118 * (0.6 + 0.5 * q), 0.075 * (0.5 + 0.6 * q), 0.105 * (0.7 + 0.4 * q)), k=0.03))
        P.append(E((0.125 + 0.03 * h, -0.02 + yst(zs(1.03)), zs(1.03)), (0.05 * (0.5 + 0.7 * h), 0.085 * (0.6 + 0.5 * h), 0.07), k=0.03))     # the flank
    rw = (0.136 if F else 0.156) * (1 - 0.07 * t + 0.14 * h + 0.07 * m); rd = (0.098 if F else 0.110) * (1 - 0.08 * t + 0.22 * h + 0.06 * m)
    P.append(E((0, -0.002 + yst(zs(1.265)), zs(1.265)), (rw, rd, 0.165), k=0.022))                           # the ribcage
    ys3 = yst(zs(1.36))
    if F:
        b = 1 - 0.22 * t + 0.30 * h + 0.34 * cv - 0.12 * m - 0.05 * age
        P.append(E((0.068 + 0.006 * h, 0.082 + 0.012 * (b - 1) + ys3, zs(1.275) - 0.012 * age - 0.01 * max(0, b - 1)), (0.056 * b, 0.050 * b, 0.057 * b), k=0.012))
    else:
        pc = 1 - 0.25 * t + 0.55 * m + 0.45 * h
        P.append(E((0.078, 0.066 + 0.014 * m + 0.02 * h + ys3, zs(1.322) - 0.012 * h), (0.070 * (1 + 0.1 * m + 0.1 * h), 0.022 * pc, 0.046 * (1 + 0.08 * m + 0.2 * h)), k=0.022))
    P.append(E((0, -0.050 + ys3 - 0.01 * m, zs(1.385)), ((0.130 if F else 0.150) * (1 + 0.06 * m + 0.08 * h), 0.066 * (1 + 0.14 * m + 0.2 * h + 0.1 * age), 0.085)))   # the upper back
    lt = 1 - 0.3 * t + 0.5 * m + 0.25 * h
    P.append(E(((0.098 if F else 0.122) + 0.014 * m, -0.032 + yst(zs(1.25)), zs(1.25)), ((0.030 if F else 0.038) * lt, 0.066, 0.125), k=0.022))        # the lats
    sh = A('uarm_R')
    P.append(Cn((0.035, -0.018 + ys3, nz - 0.052), sh + np.array([-0.022, 0.004, 0.012]), 0.046 * (1 + 0.1 * m + 0.12 * h), 0.046 * (1 + 0.08 * m + 0.1 * h)))    # the shoulder girdle
    P.append(Cn((0.0, -0.034 + ys3 * 1.6, nz - 0.03), (0.095, -0.030 + ys3, nz - 0.058), 0.036 * (1 + 0.32 * m + 0.2 * h), 0.022 * (1 + 0.4 * m + 0.2 * h)))     # the trapezius
    nr = (0.044 if F else 0.052) * (1 - 0.10 * t + 0.20 * h + 0.14 * m)
    P.append(Cn((0, J['neck'][1] - 0.004, nz - 0.07), (0, J['head'][1] - 0.012, J['head'][2] + 0.012), nr * 1.04, nr * 0.98))    # the neck
    # ---- the arm ----
    el, wr = A('farm_R'), A('hand_R'); d = (el - sh) / np.linalg.norm(el - sh); d2 = (wr - el) / np.linalg.norm(wr - el)
    al = lean * (0.86 if F else 1.0); R1 = _rot_to(d); R2 = _rot_to(d2)
    dl = 1 - 0.14 * t + 0.26 * m + 0.14 * h
    P.append(E(sh + d * 0.030 + np.array([0.006, 0, 0.004]), (0.052 * dl * (0.9 if F else 1), 0.058 * dl * (0.9 if F else 1), 0.078), R1))      # the deltoid
    P.append(Cn(sh + d * 0.02, el, 0.045 * al, 0.037 * al))
    bi = 1 + 0.5 * m - 0.2 * t
    P.append(E(sh + d * 0.165 + np.array([0, 0.016, 0]), (0.034 * al, 0.036 * al * bi, 0.085), R1))             # the biceps
    P.append(E(sh + d * 0.150 + np.array([0, -0.018, 0]), (0.033 * al, 0.032 * al * (1 + 0.4 * m), 0.095), R1))   # the triceps
    P.append(Cn(el, wr, 0.039 * al, 0.0265 * (1 + 0.5 * (al - 1))))
    P.append(E(el + d2 * 0.075 + np.array([0.004, 0.004, 0]), (0.040 * al * (1 + 0.12 * m), 0.037 * al * (1 + 0.12 * m), 0.085), R2))        # the forearm's belly
    # the hand: a mitten (the palm, the fingers together, the thumb forward); the gloves and the bare hand in grips come from hender.py
    Rh = _rot_to(d2, 0.0); hx = Rh[:, 0]; hy = Rh[:, 1]         # hx: the level one across the arm (forward-ish), hy: toward the body
    P.append(E(wr + d2 * 0.048, (0.040, 0.016, 0.050), Rh, k=0.008))
    P.append(E(wr + d2 * 0.125, (0.036, 0.0125, 0.052), Rh, k=0.008))
    P.append(Cn(wr + d2 * 0.022 + hx * 0.030, wr + d2 * 0.090 + hx * 0.058, 0.014, 0.011, k=0.006))
    # ---- the leg ----
    hp, kn, an = A('thigh_R'), A('shin_R'), A('foot_R'); ll = lean * (1.0 if not F else 0.97)
    th = ll * (1 + 0.10 * cv + 0.08 * h + 0.05 * m) * (1.04 if F else 1.0)
    P.append(Cn(hp + np.array([0.004, 0, -0.03]), kn + np.array([0, 0, 0.05]), (0.082 if F else 0.077) * th, 0.052 * ll))
    P.append(E(hp + (kn - hp) * 0.42 + np.array([0.004, 0.030, 0]), (0.058 * th, 0.048 * th * (1 + 0.25 * m), 0.165), _rot_to(kn - hp)))        # the quadriceps
    P.append(E(hp + (kn - hp) * 0.45 + np.array([0.0, -0.030, 0]), (0.056 * th, 0.044 * th * (1 + 0.15 * m), 0.16), _rot_to(kn - hp)))          # the hamstrings
    if F or h > 0 or cv > 0:
        q = (0.3 if F else 0.0) + 0.6 * h + 0.6 * cv; P.append(E(hp + np.array([0.030 + 0.012 * q, -0.01, -0.06]), (0.046 * (0.7 + 0.4 * q), 0.070, 0.11), k=0.03))    # the hip's and the outer thigh's padding
    P.append(E(kn + np.array([0, 0.012, 0.0]), (0.050 * (1 + 0.5 * (ll - 1)), 0.052 * (1 + 0.5 * (ll - 1)), 0.058)))                             # the knee
    P.append(Cn(kn, an + np.array([0, 0, 0.03]), 0.049 * ll, 0.037 * (1 + 0.5 * (ll - 1))))
    P.append(E(kn + (an - kn) * 0.30 + np.array([0.004, -0.028, 0]), (0.050 * ll * (1 + 0.14 * m), 0.052 * ll * (1 + 0.22 * m), 0.105), _rot_to(an - kn)))   # the calf
    fx = an[0]; an = an + np.array([0, 0.042, 0])            # (the shapes of the foot are placed from the middle of the ankle's section)
    P.append(E((fx, an[1] - 0.036, 0.040), (0.034, 0.042, 0.040), k=0.01))                                                       # the heel
    P.append(Cn((fx, an[1], 0.062), (fx + 0.006, an[1] + 0.120, 0.032), 0.041, 0.030, k=0.01, flat=1.0))                         # the instep
    P.append(E((fx + 0.010, an[1] + 0.165, 0.022), (0.049, 0.058, 0.021), k=0.01))                                               # the ball and the toes
    # ---- the head (the skull keeps the old head's size, so the hair, the hats and the beards of garderobe.py fit it) ----
    H = A('head'); hz = H[2] - 1.585; hy0 = H[1] + HEADY[sex] + 0.012        # (the 1.78 m head's heights and depths, moved to this neck)
    hp_ = lambda x, y, z: (x, y + hy0, z + hz)
    K = 0.009
    fw = 1 - 0.05 * t + 0.09 * h + 0.03 * age                   # the face's fullness (below the brow only: the skull is the same for all)
    jw = (0.92 if F else 1.0) * (1 - 0.05 * t + 0.08 * h + 0.04 * m)
    P.append(E(hp_(0, -0.012, 1.692), (0.0765, 0.100, 0.084), k=K, g='h'))                                                        # the cranium
    P.append(E(hp_(0, 0.014, 1.627), (0.0620 * fw * jw, 0.070, 0.079), k=K, g='h'))                                               # the face and the jaw
    P.append(E(hp_(0.036 * jw, -0.006, 1.592), (0.020 * fw, 0.038, 0.024), k=K, g='h'))                                           # the jaw's corner
    P.append(E(hp_(0, 0.040, 1.590), (0.040 * fw * jw, 0.046, 0.043), k=K, g='h'))                                                # the mouth's and the chin's block: the profile stands upright
    if h > 0 or age > 0:
        q = h + 0.5 * age; P.append(E(hp_(0, 0.030, 1.553 - 0.006 * q), (0.040 * (0.6 + 0.5 * q), 0.040, 0.022 * (0.6 + 0.6 * q)), k=0.012, g='h'))   # under the chin
        P.append(E(hp_(0.040, 0.048, 1.596 - 0.008 * q), (0.022 * (0.6 + 0.5 * q), 0.026, 0.024), k=0.010, g='h'))                # the jowl
    P.append(E(hp_(0.0790, -0.014, 1.652), (0.0070, 0.0180, 0.0300), _rot_to((0.22, -0.10, 1.0)), k=0.004, g='h'))                # the ear
    P.append(E(hp_(0.0870, -0.011, 1.653), (0.0055, 0.0105, 0.0180), k=0.004, neg=True, g='h'))                                   # the ear's hollow
    # the face's relief: heights (m, out from the head's own surface) as bumps and dents over the face seen from the front (x, z)
    G = []
    def g(x, z, sx, sz, amp): G.append((x, z + hz, sx, sz, amp))
    g(0.029, 1.6900, 0.021, 0.0060, 0.0032 if F else 0.0056)      # the brow ridge
    g(0.0, 1.689, 0.011, 0.008, 0.0016 if F else 0.0034)          # between the brows
    g(0.0315, 1.6680, 0.0140, 0.0080, -0.0105)                    # the eye's socket
    g(0.048, 1.646, 0.016, 0.011, 0.0048)                         # the cheekbone
    g(0.062, 1.690, 0.012, 0.018, -0.0020)                        # the temple
    g(0.0, 1.602, 0.021, 0.0125, 0.0050 if F else 0.0042)         # the mouth's mound
    g(0.027, 1.6005, 0.006, 0.006, -0.0022)                       # the mouth's corner
    g(0.0, 1.5825, 0.013, 0.0048, -0.0036)                         # under the lip
    g(0.0, 1.5650, 0.016 if F else 0.019, 0.0105, 0.0060 if F else 0.0085)   # the chin
    g(0.024, 1.618, 0.006, 0.012, -0.0020)                        # beside the nose's wing, down to the mouth
    g(0.036, 1.588, 0.013, 0.014, -0.0034 + 0.004 * h)            # the cheek's hollow under the cheekbone
    if age > 0: g(0.022, 1.652, 0.012, 0.004, -0.0022 * age); g(0.034, 1.598, 0.008, 0.014, -0.0020 * age)     # under the eye, and the fold beside the mouth
    P.append({'t': 'd', 'G': G, 'neg': False, 'y0': hy0, 'z0': hz,
              'nose': {'top': 1.676 + hz, 'tip': 1.6335 + hz, 'a0': 0.0055, 'a1': 0.0195 if F else 0.0230, 'w0': 0.0062, 'w1': 0.0098 if F else 0.0112,
                       'wing': (0.0128, 1.6290 + hz, 0.0058, 0.0060, 0.0085 if F else 0.0098)}})
    return P


def _disp(q, p):
    """the face's relief at points p (N, 3; x already |x|): a height to take from the field"""
    x, y, z = p[:, 0], p[:, 1] - q['y0'], p[:, 2]
    m = _ss(y, 0.025, 0.060) * _ss(z, 1.535 + q['z0'], 1.552 + q['z0'])
    D = np.zeros(len(p))
    for cx, cz, sx, sz, amp in q['G']:
        D += amp * (np.exp(-((x - cx) / sx) ** 2 - ((z - cz) / sz) ** 2) + (np.exp(-((x + cx) / sx) ** 2 - ((z - cz) / sz) ** 2) if cx > 0 else 0.0))
    n = q['nose']; u = np.clip((n['top'] - z) / (n['top'] - n['tip']), 0, 1)             # 0 at the root, 1 at the tip
    amp = n['a0'] + (n['a1'] - n['a0']) * u ** 1.25; w = n['w0'] + (n['w1'] - n['w0']) * u ** 1.5
    along = _ss(z, n['tip'] - 0.0150, n['tip'] - 0.0005) * _ss(z, n['top'] + 0.014, n['top'] - 0.004)
    D += amp * np.exp(-(x / w) ** 2) * along
    cx, cz, sx, sz, a = n['wing']; D += a * np.exp(-((x - cx) / sx) ** 2 - ((z - cz) / sz) ** 2)
    return D * m


def _dist(p, q):
    """the (approximate) signed distance of points p (N, 3) to one shape"""
    if q['t'] == 'e':
        v = p - q['c']
        if q['R'] is not None: v = v @ q['R']
        r = q['r']; k0 = np.sqrt(((v / r) ** 2).sum(1)); k1 = np.sqrt(((v / (r * r)) ** 2).sum(1)) + 1e-12
        return np.where(k0 < 1e-6, -r.min(), k0 * (k0 - 1) / k1)
    a, b = q['a'], q['b']; ab = b - a; L2 = float(ab @ ab); v = p - a
    h = np.clip((v @ ab) / L2, 0, 1); c = v - h[:, None] * ab
    return np.sqrt((c * c).sum(1)) - (q['ra'] + (q['rb'] - q['ra']) * h)


KB, KG = 0.014, 0.010          # the blend between the body's shapes, and between the head and the body


def _bbox(q, pad):
    if q['t'] == 'e':
        r = float(q['r'].max()); return q['c'] - r - pad, q['c'] + r + pad
    r = max(q['ra'], q['rb']); return np.minimum(q['a'], q['b']) - r - pad, np.maximum(q['a'], q['b']) + r + pad


def field(P, pts):
    """the body's field at points (N, 3): negative inside. Both halves (the shapes are the right half's: x -> |x|)."""
    p = np.array(pts, np.float64).reshape(-1, 3).copy(); p[:, 0] = np.abs(p[:, 0]); N = len(p)
    acc = {}
    for q in P:
        if q['neg'] or q['t'] == 'd': continue
        k = q['k'] or KB; key = (q['g'], k); d = _dist(p, q)
        acc[key] = acc.get(key, 0.0) + np.exp(np.clip(-d / k, -60, 60))
    G = {}
    for (g, k), s in acc.items():
        G.setdefault(g, []).append(-k * np.log(s + 1e-300))
    def smin(ds, k):
        return -k * np.log(sum(np.exp(np.clip(-d / k, -60, 60)) for d in ds) + 1e-300)
    fg = [smin(v, 0.006) for v in G.values()]
    fv = smin(fg, KG)
    for q in P:
        if q['t'] == 'd': fv = fv - _disp(q, p)
    for q in P:
        if q['neg']:
            k = q['k'] or 0.006; d = -_dist(p, q); fv = k * np.log(np.exp(np.clip(fv / k, -60, 60)) + np.exp(np.clip(d / k, -60, 60)))
    return fv


def grid_mesh(P, h=0.003, cache=None, box=None):
    """the surface by marching cubes on a grid of spacing h (the right half and a little over the middle, then mirrored and welded):
    (verts (N, 3), tris (M, 3)). Cached on the shapes' numbers."""
    from skimage import measure
    key = hashlib.md5((repr([(q['t'], [np.round(np.asarray(v, float), 6).tolist() if not isinstance(v, (str, bool, type(None), dict, list)) else repr(v) for k_, v in sorted(q.items()) if k_ != 't']) for q in P]) + str(h) + repr(box)).encode()).hexdigest()[:16]
    if cache:
        fn = os.path.join(cache, 'kropp_%s.npz' % key)
        if os.path.exists(fn):
            z = np.load(fn); return z['v'], z['t']
    lo = np.array([-2 * h, -0.24, -0.012]); hi = np.array([0.80, 0.24, 1.86])
    if box: lo, hi = np.array(box[0], float), np.array(box[1], float)
    n = np.ceil((hi - lo) / h).astype(int) + 1
    ax = [lo[i] + h * np.arange(n[i]) for i in range(3)]
    acc = {}; negs = []; disp = []
    for q in P:
        if q['t'] == 'd': disp.append(q); continue
        if q['neg']: negs.append(q); continue
        k = q['k'] or KB; key2 = (q['g'], k)
        if key2 not in acc: acc[key2] = np.zeros(n, np.float32)
        b0, b1 = _bbox(q, k * 14 + 2 * h)
        i0 = np.maximum(0, np.floor((b0 - lo) / h).astype(int)); i1 = np.minimum(n, np.ceil((b1 - lo) / h).astype(int) + 1)
        if np.any(i1 <= i0): continue
        X, Y, Z = np.meshgrid(ax[0][i0[0]:i1[0]], ax[1][i0[1]:i1[1]], ax[2][i0[2]:i1[2]], indexing='ij')
        pts = np.stack([np.abs(X).ravel(), Y.ravel(), Z.ravel()], 1); d = _dist(pts, q)
        acc[key2][i0[0]:i1[0], i0[1]:i1[1], i0[2]:i1[2]] += np.exp(np.clip(-d / k, -60, 60)).reshape(X.shape).astype(np.float32)
    G = {}
    for (g, k), s in acc.items():
        G.setdefault(g, []).append((-k * np.log(s.astype(np.float64) + 1e-300)))
    def smin(ds, k):
        return -k * np.log(sum(np.exp(np.clip(-d / k, -60, 60)) for d in ds) + 1e-300)
    fg = [smin(v, 0.006) for v in G.values()]; fv = smin(fg, KG); del G, fg, acc
    for q in disp:
        b0 = np.array([0.0, q['y0'] + 0.0, 1.50 + q['z0']]); b1 = np.array([0.12, q['y0'] + 0.20, 1.75 + q['z0']])
        i0 = np.maximum(0, np.floor((b0 - lo) / h).astype(int)); i1 = np.minimum(n, np.ceil((b1 - lo) / h).astype(int) + 1); i0[0] = 0
        X, Y, Z = np.meshgrid(ax[0][i0[0]:i1[0]], ax[1][i0[1]:i1[1]], ax[2][i0[2]:i1[2]], indexing='ij')
        pts = np.stack([np.abs(X).ravel(), Y.ravel(), Z.ravel()], 1); fv[i0[0]:i1[0], i0[1]:i1[1], i0[2]:i1[2]] -= _disp(q, pts).reshape(X.shape)
    for q in negs:
        k = q['k'] or 0.006; b0, b1 = _bbox(q, k * 14 + 2 * h)
        i0 = np.maximum(0, np.floor((b0 - lo) / h).astype(int)); i1 = np.minimum(n, np.ceil((b1 - lo) / h).astype(int) + 1)
        X, Y, Z = np.meshgrid(ax[0][i0[0]:i1[0]], ax[1][i0[1]:i1[1]], ax[2][i0[2]:i1[2]], indexing='ij')
        pts = np.stack([np.abs(X).ravel(), Y.ravel(), Z.ravel()], 1); d = (-_dist(pts, q)).reshape(X.shape)
        sl = fv[i0[0]:i1[0], i0[1]:i1[1], i0[2]:i1[2]]
        fv[i0[0]:i1[0], i0[1]:i1[1], i0[2]:i1[2]] = k * np.log(np.exp(np.clip(sl / k, -60, 60)) + np.exp(np.clip(d / k, -60, 60)))
    fv = np.clip(fv, -1, 1).astype(np.float32)
    v, t, _, _ = measure.marching_cubes(fv, 0.0, spacing=(h, h, h)); v = v + lo
    if cache:
        os.makedirs(cache, exist_ok=True); np.savez_compressed(fn, v=v.astype(np.float32), t=t.astype(np.int32))
    return v, t


def project(P, v, n, lo=-0.05, hi=0.14, it=26):
    """move each point v along its normal n onto the surface of the shapes P: the distance (N,). Bisection from the outermost
    crossing inwards, so a point lands on the outer skin."""
    v = np.asarray(v, float); n = np.asarray(n, float)
    ts = np.linspace(hi, lo, 39); t_out = np.full(len(v), hi); t_in = np.full(len(v), lo); found = np.zeros(len(v), bool)
    prev = field(P, v + n * ts[0])
    for a, b in zip(ts[:-1], ts[1:]):
        cur = field(P, v + n * b); hit = (~found) & (prev > 0) & (cur <= 0)
        t_out[hit] = a; t_in[hit] = b; found |= hit; prev = cur
    for _ in range(it):
        mid = (t_out + t_in) / 2; fm = field(P, v + n * mid[:, None]); ins = fm <= 0
        t_in = np.where(ins, mid, t_in); t_out = np.where(ins, t_out, mid)
    t = (t_out + t_in) / 2; t[~found] = 0.0
    return t, found


# ---------------- the weights: a function of the place in the rest pose ----------------
def _seg_d(p, a, b):
    ab = b - a; L2 = float(ab @ ab) + 1e-12; h = np.clip(((p - a) @ ab) / L2, 0, 1); c = p - a - h[:, None] * ab
    return np.sqrt((c * c).sum(1)), h


# how far each joint's bend is spread along the bones (m, either side): wide enough that the inside of the deepest bend of the
# check's poses folds without crossing itself (a section of radius r bent by an angle a crosses within r * tan(a / 2) of the joint)
SPREAD = {'knee': 0.13, 'hip': 0.16, 'elbow': 0.085, 'shoulder': 0.10, 'wrist': 0.04, 'ankle': 0.05, 'toe': 0.035, 'spine': 0.075, 'neck': 0.045, 'head': 0.035}


def weights(J, pts, top=4, cls='body'):
    """the weights of points (N, 3) in the rest pose J: (idx (N, top), w (N, top)), the bones as BONES. Along each chain (the back, an
    arm, a leg) a point takes its place along the chain's line and the weights cross over smoothly round each joint; between the
    chains (the arm and the chest, the two legs, the legs and the pelvis) the nearest chain wins, blended over a few centimetres."""
    p = np.asarray(pts, float).reshape(-1, 3); N = len(p); W = np.zeros((N, len(BONES)))
    A = lambda n: np.array(J[n], float)
    def chain(names, spreads, tail):
        """weights along a chain of joints: the arc length of the nearest place on its polyline, crossed over at the joints"""
        pts_ = [A(n) for n in names] + [np.array(tail, float)]
        segs = list(zip(pts_[:-1], pts_[1:])); cum = [0.0]
        for a, b in segs: cum.append(cum[-1] + float(np.linalg.norm(b - a)))
        best = np.full(N, 1e9); s = np.zeros(N)
        for i, (a, b) in enumerate(segs):
            ab = b - a; L = cum[i + 1] - cum[i]; hh = ((p - a) @ ab) / (L * L + 1e-12)
            if i == 0: hc = np.minimum(hh, 1.0)                      # before the first joint: still the first bone's
            elif i == len(segs) - 1: hc = np.maximum(hh, 0.0)
            else: hc = hh
            hcl = np.clip(hh, 0, 1); c = p - a - hcl[:, None] * ab; d = np.sqrt((c * c).sum(1))
            better = d < best; best = np.where(better, d, best); s = np.where(better, cum[i] + np.clip(hc, -0.5, 1.5) * L, s)
        w = np.zeros((N, len(names))); w[:, 0] = 1.0
        for i in range(1, len(names)):
            u = _ss(s, cum[i] - spreads[i], cum[i] + spreads[i])
            w[:, i] = u; w[:, :i] *= (1 - u)[:, None]
        return w, best
    S = SPREAD
    x = p[:, 0]
    # the back: hips, three in the back, the neck, the head
    back = ['hips', 'spine1', 'spine2', 'spine3', 'neck', 'head']
    wb, db = chain(back, [0, S['spine'], S['spine'], S['spine'], S['neck'], S['head']], tails(J)['head'])
    for i, n in enumerate(back): W[:, BI[n]] = wb[:, i]
    # (the face is the head's, whole: the jaw and the mouth lie level with the head's joint, where the neck hands over)
    hj = A('head'); fm = _ss(p[:, 1], hj[1] + 0.010, hj[1] + 0.050) * _ss(p[:, 2], hj[2] - 0.080, hj[2] - 0.025)
    if cls == 'body': W[:, BI['head']] += fm * W[:, BI['neck']]; W[:, BI['neck']] *= 1 - fm
    else:          # (a collar stands on the chest: it never turns with the head, and only a third as far as the neck)
        up = W[:, BI['neck']] + W[:, BI['head']]; W[:, BI['head']] = 0.0; W[:, BI['neck']] = 0.35 * up; W[:, BI['spine3']] += 0.65 * up
    for sd, sg in (('R', 1), ('L', -1)):
        # the arm, from the collar bone out
        names = ['clav_' + sd, 'uarm_' + sd, 'utw_' + sd, 'farm_' + sd, 'ftw_' + sd, 'hand_' + sd]
        wa, da = chain(names, [0, S['shoulder'], 0.07, S['elbow'], 0.07, S['wrist']], A('hand_' + sd) + (A('hand_' + sd) - A('farm_' + sd)) * 0.75)
        sh = A('uarm_' + sd); el = A('farm_' + sd); ad = (el - sh) / np.linalg.norm(el - sh)
        ta = (p - sh) @ ad                                            # how far out along the arm
        # the arm takes over from the chest: by how far out along the arm a point is, and only near the arm's own line (the chest's
        # side under the armpit is the chest's)
        rad = np.sqrt(np.maximum(((p - sh) ** 2).sum(1) - ta * ta, 0.0)); lim = 0.115 + 0.30 * _ss(ta, 0.10, 0.28)
        side = _ss(sg * x, 0.0, 0.06)
        # (the armpit: what is inside and under a plane through it, tipped up and out, is the chest's, however near the arm's line)
        pit = (sg * x - (sh[0] * sg - 0.020)) * 0.94 + (p[:, 2] - (sh[2] - 0.085)) * 0.34
        # (and only what is within a sleeve's reach of the arm's own line: the arm hangs close to the hip, and a jacket's hem there is the body's)
        # (from the wrist out the reach is a hand's: the thumb and the spread fingers stand further from the arm's line than a sleeve does)
        tw = (p - A('hand_' + sd)) @ ((A('hand_' + sd) - el) / np.linalg.norm(A('hand_' + sd) - el)); reach = 0.068 + 0.045 * _ss(tw, -0.03, 0.01)
        ka = _ss(ta, -0.055, 0.075) * _ss(da, reach + 0.030, reach) * side * np.maximum(_ss(pit, -0.020, 0.030), _ss(ta, 0.16, 0.24))
        # (below the armpit the arm hangs close along the body: the arm's is what lies outside a line down the arm's inner side, however
        # near the two are. The arm's own line at each height, less the arm's half thickness there.)
        wr_ = A('hand_' + sd); tip_ = wr_ + (wr_ - el) / np.linalg.norm(wr_ - el) * 0.20
        zs_ = [tip_[2], wr_[2], el[2], sh[2]]; xl = np.interp(p[:, 2], zs_, [tip_[0] * sg, wr_[0] * sg, el[0] * sg, sh[0] * sg]); rin = np.interp(p[:, 2], zs_, [0.082, 0.080, 0.076, 0.078])          # (wider than a sleeve, a cuff or a glove seen level: the arm leans)
        below = _ss(p[:, 2], sh[2] - 0.075, sh[2] - 0.115)
        ka0 = ka
        ka = ka * (1 - below + below * _ss(sg * x - (xl - rin), -0.007, 0.007))
        if cls == 'torso':          # a jacket's body and a vest never go with the arm below the armhole: only the sleeves do
            # (but the cloth under the armhole is drawn along a little, fading out down the side: the pull of a raised arm is spread
            # over the side panel and not taken by the one row under the rim)
            ka = ka * _ss(p[:, 2], sh[2] - 0.165, sh[2] - 0.105)          # (gone by the first row under the armhole's rim)
        else:
            ka = np.maximum(ka, _ss(tw, -0.02, 0.01) * _ss(da, 0.125, 0.100) * side)          # the hand is the arm's, whole
            if cls == 'arm': ka = np.maximum(ka, _ss(ta, 0.05, 0.10) * side)                          # a sleeve and a glove are the arm's from the armhole out (at the armhole's rim as the jacket there)
        # the collar bone itself: a share of the shoulder's top, on its side
        kc = side * _ss(p[:, 2], sh[2] - 0.10, sh[2] + 0.01) * _ss(sg * x, 0.03, sh[0] * sg - 0.02) * 0.6 * (1 - ka)
        arm = wa.copy(); arm[:, 0] = 0.0; tot = arm.sum(1, keepdims=True); arm = np.where(tot > 1e-9, arm / np.maximum(tot, 1e-9), 0.0); arm[:, 1] += (tot[:, 0] <= 1e-9)
        keep = 1 - ka - kc
        W[:, [BI[n] for n in back]] *= keep[:, None]
        # the fingers take over from the hand: each point of the hand goes to the finger whose line it is nearest, within a finger's
        # (or a glove's) thickness, and along it the joints cross over
        wh = ka * arm[:, -1]; arm[:, -1] = 0.0
        for i, n in enumerate(names): W[:, BI[n]] += ka * arm[:, i]
        m = wh > 1e-6; fw = np.zeros((N, 0)); 
        if m.any():
            pm = p[m]; best = np.full(len(pm), 1e9); wf = np.zeros((len(pm), len(BONES)))
            for fn in FINGERS:
                js = [A('%s%d_%s' % (fn, k, sd)) for k in (1, 2, 3)]; tip = np.array(tails(J)['%s3_%s' % (fn, sd)], float); pts_ = js + [tip]
                dmin = np.full(len(pm), 1e9); sarc = np.zeros(len(pm)); cum = [0.0]
                for a_, b_ in zip(pts_[:-1], pts_[1:]): cum.append(cum[-1] + float(np.linalg.norm(b_ - a_)))
                for k, (a_, b_) in enumerate(zip(pts_[:-1], pts_[1:])):
                    ab = b_ - a_; L = cum[k + 1] - cum[k]; hh = ((pm - a_) @ ab) / (L * L); hc = np.clip(hh, 0, 1); dd = np.linalg.norm(pm - a_ - hc[:, None] * ab, axis=1)
                    if k == 2: dd = np.where(hh > 1, np.linalg.norm(pm - a_ - np.minimum(hh, 1.6)[:, None] * ab, axis=1), dd); hc = np.clip(hh, 0, 1.6)
                    bt = dd < dmin; dmin = np.where(bt, dd, dmin); sarc = np.where(bt, cum[k] + hc * L, sarc)
                # (round the knuckle the finger's reach is the hand's thickness: the back of the hand over the knuckle goes with the finger)
                rad = (0.019 if fn == 'thumb' else 0.0135) + 0.012 * (1 - _ss(sarc, 0.006, 0.030))
                near = _ss(dmin, rad, rad - 0.004) * _ss(sarc, -0.014, 0.014 if fn != 'thumb' else 0.02); take = (dmin < best) & (near > 0); best = np.where(take, dmin, best)
                u2 = _ss(sarc, cum[1] - 0.008, cum[1] + 0.008); u3 = _ss(sarc, cum[2] - 0.007, cum[2] + 0.007)
                row = np.zeros((len(pm), len(BONES))); row[:, BI['%s1_%s' % (fn, sd)]] = near * (1 - u2); row[:, BI['%s2_%s' % (fn, sd)]] = near * u2 * (1 - u3); row[:, BI['%s3_%s' % (fn, sd)]] = near * u2 * u3
                row[:, BI['hand_' + sd]] = 1 - near; wf = np.where(take[:, None], row, wf)
            none = wf.sum(1) < 1e-9; wf[none, BI['hand_' + sd]] = 1.0
            W[m] += wh[m][:, None] * wf
        W[:, BI['clav_' + sd]] += kc
    # the legs: each on its side, taking over from the pelvis round the hip
    lw = {}
    for sd, sg in (('R', 1), ('L', -1)):
        names = ['thigh_' + sd, 'ttw_' + sd, 'shin_' + sd, 'foot_' + sd, 'toe_' + sd]
        hp = A('thigh_' + sd); kn = A('shin_' + sd); an = A('foot_' + sd); to = A('toe_' + sd)
        w = np.zeros((N, 5)); z = p[:, 2]; zm = (hp[2] + kn[2]) / 2; utw = _ss(z, zm + 0.07, zm - 0.07)
        # down the leg by height (the leg hangs straight): the knee, then the ankle; the toe by the place along the foot
        uk = _ss(z, kn[2] + S['knee'], kn[2] - S['knee']); ua = _ss(z, an[2] + S['ankle'] + 0.03, an[2] - S['ankle'] + 0.05)
        ut = _ss(p[:, 1], to[1] - S['toe'], to[1] + S['toe']) * _ss(z, 0.12, 0.07)
        w[:, 0] = (1 - uk) * (1 - utw); w[:, 1] = (1 - uk) * utw; w[:, 2] = uk * (1 - ua); w[:, 3] = ua * (1 - ut); w[:, 4] = ua * ut
        # (the two legs share the cloth and the skin only in the crotch: below it each leg is its own to the middle line, or a
        # stride pulls the inside of one trouser leg along with the other leg. A coat's skirt is one piece and keeps the wide share.)
        lw_ = 0.100 if cls == 'torso' else 0.004 + 0.026 * _ss(z, hp[2] - 0.255, hp[2] - 0.185)
        kl = _ss(z, hp[2] + S['hip'] * 0.55, hp[2] - S['hip']) * _ss(sg * x / lw_, -1.0, 1.0)
        lw[sd] = (names, w, kl)
    kt = lw['R'][2] + lw['L'][2]; kt = np.clip(kt, 0, 1)
    arms_w = W.copy(); arms_w[:, [BI[n] for n in back]] = 0.0; ak = arms_w.sum(1)       # (what the arms hold stays theirs: a hand at the thigh)
    kt = kt * (1 - ak)
    W[:, [BI[n] for n in back]] *= (1 - kt / np.maximum(1 - ak, 1e-9))[:, None]
    for sd in 'RL':
        names, w, kl = lw[sd]; share = np.where(lw['R'][2] + lw['L'][2] > 1e-9, kl / np.maximum(lw['R'][2] + lw['L'][2], 1e-9), 0.0)
        for i, n in enumerate(names): W[:, BI[n]] += kt * share * w[:, i]
    W = np.maximum(W, 0); W /= W.sum(1, keepdims=True)
    idx = np.argsort(-W, 1)[:, :top]; w = np.take_along_axis(W, idx, 1); w /= w.sum(1, keepdims=True)
    return idx, w


def relax_rim(pos, tri, idx, w, rim=None, share=0.6, it=24, rings=1):
    """the weights round an armhole, evened out over the mesh. The armhole's rim is the sleeve's first ring and the jacket's edge
    (the same places): by place alone the rim went with the arm and the cloth beside it with the chest, so an arm swung forward
    pulled one row of edges out to three times their length. Now the rim holds a share of what the arm had there (the rest goes to
    the back's bones), and the ring of vertices beside it settles between the rim and what lies beyond, in the sleeve and in the
    jacket alike. For a sleeve (rim None) the rim is its top open loop on each side; for a jacket, rim is what the sleeve's call
    returned, and the jacket's vertices at those places take those weights. Returns (idx, w, (the rim's places, their weights))."""
    from scipy.spatial import cKDTree
    pos = np.asarray(pos, float); tri = np.asarray(tri).reshape(-1, 3); key = {}; rep = np.zeros(len(pos), int)
    for i, q in enumerate(np.round(pos, 5)): rep[i] = key.setdefault(tuple(q), len(key))
    n = len(key); t = rep[tri]; e = np.concatenate([t[:, [0, 1]], t[:, [1, 2]], t[:, [2, 0]]]); e = e[e[:, 0] != e[:, 1]]
    ue, cnt = np.unique(np.sort(e, 1), axis=0, return_counts=True); P = np.zeros((n, 3)); P[rep] = pos
    adj = [[] for _ in range(n)]
    for a_, b_ in ue: adj[a_].append(b_); adj[b_].append(a_)
    W = np.zeros((n, len(BONES))); cnt_ = np.zeros(n)
    for k in range(idx.shape[1]): np.add.at(W, (rep, idx[:, k]), w[:, k])
    np.add.at(cnt_, rep, 1.0); W /= np.maximum(cnt_, 1)[:, None]
    if rim is None:
        b = ue[cnt == 1]; comp = np.arange(n)
        def find(i):
            while comp[i] != i: comp[i] = comp[comp[i]]; i = comp[i]
            return i
        for a_, b_ in b: comp[find(a_)] = find(b_)
        loops = {}
        for i in np.unique(b.ravel()): loops.setdefault(find(i), []).append(i)
        ids = []
        for sg in (1, -1):
            cand = [l for l in loops.values() if P[l][:, 0].mean() * sg > 0]
            if cand: ids += max(cand, key=lambda l: P[l][:, 2].mean())
        ids = np.array(ids, int); back = [BI[x] for x in ('hips', 'spine1', 'spine2', 'spine3', 'neck', 'head', 'clav_R', 'clav_L')]; arm = np.ones(len(BONES), bool); arm[back] = False
        R_ = W[ids].copy(); gone = R_[:, arm].sum(1) * (1 - share); R_[:, arm] *= share; bs = R_[:, back].sum(1)
        for k, i in enumerate(ids):
            if bs[k] > 1e-6: R_[k, back] *= 1 + gone[k] / bs[k]
            else: R_[k, BI['spine3']] += gone[k]
        W[ids] = R_
    else:
        d, j = cKDTree(rim[0]).query(P); ids = np.where(d < 1e-3)[0]; W[ids] = rim[1][j[ids]]
    fixed = np.zeros(n, bool); fixed[ids] = True; free = set(); edge = set(int(i) for i in ids)
    for _ in range(rings):
        edge = {j for i in edge for j in adj[i] if not fixed[j] and j not in free}; free |= edge
    free = sorted(free)
    for _ in range(it):
        new = W.copy()
        for i in free: new[i] = W[adj[i]].mean(0)
        W = new
    Wv = W[rep]; i2 = np.argsort(-Wv, 1)[:, :idx.shape[1]]; w2 = np.take_along_axis(Wv, i2, 1)
    return i2, w2 / w2.sum(1, keepdims=True), (P[ids].copy(), W[ids].copy())


def finger_weights(sex):
    """the hands' weights by the mesh's own split into fingers (a vertex of a finger goes with that finger's bones and no other's):
    (positions (M, 3) of both hands' vertices in the rest pose, shares (M, len(BONES)) of what the hand and its fingers hold of each).
    Along a finger the joints cross over; round the knuckle the finger hands over to the hand. kropp_bygg.py lays these over what
    weights() gives the skin's hands and the gloves made of them."""
    v, _ = load_obj(sex); F = fingers(sex); J = joints(sex); T = tails(J); pos = []; sh = []
    owner = {}
    for fn, ids in F['verts'].items():
        for i in ids: owner[int(i)] = fn
    for sd, sg in (('R', 1), ('L', -1)):
        mir = np.array([sg, 1, 1.0])
        chains = {fn: [np.array(J['%s%d_%s' % (fn, k, sd)], float) for k in (1, 2, 3)] + [np.array(T['%s3_%s' % (fn, sd)], float)] for fn in FINGERS}
        def along(p, pts):
            best = 1e9; s_ = 0.0; cum = [0.0]
            for a, b in zip(pts[:-1], pts[1:]): cum.append(cum[-1] + float(np.linalg.norm(b - a)))
            for k, (a, b) in enumerate(zip(pts[:-1], pts[1:])):
                ab = b - a; L = cum[k + 1] - cum[k]; h = float((p - a) @ ab) / (L * L); hc = min(max(h, -1.0 if k == 0 else 0.0), 1.8 if k == 2 else 1.0); d = float(np.linalg.norm(p - a - min(max(h, 0), 1) * ab))
                if d < best: best = d; s_ = cum[k] + hc * L
            return s_, best, cum
        for i in F['hand']:
            p = v[i] * mir; row = np.zeros(len(BONES)); fn = owner.get(int(i))
            if fn is None:           # the palm and the back of the hand: a little of the nearest finger just at its knuckle
                cand = [(along(p, chains[f])[1], f) for f in FINGERS]; d_, fn = min(cand); s_, d_, cum = along(p, chains[fn]); sv = F['side'] * mir; pts_ = chains[fn]; u_ = (pts_[1] - pts_[0]) / np.linalg.norm(pts_[1] - pts_[0]); lat = abs(float((p - pts_[0] - u_ * ((p - pts_[0]) @ u_)) @ sv))
                # (in the finger's own column across the hand, whatever side of the hand: the knuckle's back and its pad go with the finger's root)
                k1 = float(_ss(s_, -0.012, 0.010)) * (float(_ss(lat, 0.013, 0.007)) if fn != 'thumb' else float(_ss(d_, 0.026, 0.014)))
                row[BI['%s1_%s' % (fn, sd)]] = k1; row[BI['hand_' + sd]] = 1 - k1
            else:
                s_, d_, cum = along(p, chains[fn]); k1 = float(_ss(s_, -0.012, 0.010)); u2 = float(_ss(s_, cum[1] - 0.007, cum[1] + 0.007)); u3 = float(_ss(s_, cum[2] - 0.006, cum[2] + 0.006))
                row[BI['hand_' + sd]] = 1 - k1; row[BI['%s1_%s' % (fn, sd)]] = k1 * (1 - u2); row[BI['%s2_%s' % (fn, sd)]] = k1 * u2 * (1 - u3); row[BI['%s3_%s' % (fn, sd)]] = k1 * u2 * u3
            pos.append(p); sh.append(row)
    # the web between two fingers and the fingers' roots beside it: the shares are evened out over the mesh's own neighbours, so no
    # edge runs from a vertex wholly the hand's to one wholly a finger's
    sh = np.array(sh); nh = len(F['hand']); at = {int(i): k for k, i in enumerate(F['hand'])}
    for _ in range(5):
        new = sh.copy()
        for half in (0, nh):
            for i in F['hand']:
                nb = [at[j] + half for j in F['adj'][int(i)]]; k = at[int(i)] + half
                if nb: new[k] = 0.4 * sh[k] + 0.6 * sh[nb].mean(0)
        sh = new
    return np.array(pos), sh


# ---------------- the pose ----------------
def rot(axis, deg):
    a = np.array(axis, float); a /= np.linalg.norm(a); t = math.radians(deg); c, s = math.cos(t), math.sin(t); x, y, z = a
    return np.array([[c + x * x * (1 - c), x * y * (1 - c) - z * s, x * z * (1 - c) + y * s], [y * x * (1 - c) + z * s, c + y * y * (1 - c), y * z * (1 - c) - x * s], [z * x * (1 - c) - y * s, z * y * (1 - c) + x * s, c + z * z * (1 - c)]])


def pose_mats(J, local, root=(0, 0, 0)):
    """the bones' matrices (4x4 each, rest -> posed) from local turns {bone: 3x3 in the parent's frame, about the bone's joint};
    root moves the hips. The rest frames are the world's axes (no rest rotation), so a bone's matrix is T(joint posed) R T(-joint rest)."""
    M = [None] * len(BONES); G = [None] * len(BONES)
    for i, (n, par) in enumerate(BONES):
        R = np.array(local.get(n, np.eye(3))); j = np.array(J[n], float)
        if par is None: Rg = R; pj = j + np.array(root, float)
        else:
            Rp, pp = G[BI[par]]; Rg = Rp @ R; pj = pp + Rp @ (j - np.array(J[par], float))
        G[i] = (Rg, pj); m = np.eye(4); m[:3, :3] = Rg; m[:3, 3] = pj - Rg @ j; M[i] = m
    return np.array(M), {n: G[i][1] for i, (n, _) in enumerate(BONES)}


def skin(v, idx, w, M):
    v = np.asarray(v, float); vh = np.concatenate([v, np.ones((len(v), 1))], 1); out = np.zeros((len(v), 3))
    for k in range(idx.shape[1]):
        out += w[:, k:k + 1] * np.einsum('nij,nj->ni', M[idx[:, k]], vh)[:, :3]
    return out


def _between(a, b):
    """the turn that takes direction a to direction b the short way"""
    a = np.array(a, float) / np.linalg.norm(a); b = np.array(b, float) / np.linalg.norm(b); c = float(np.clip(a @ b, -1, 1)); ax = np.cross(a, b); n = np.linalg.norm(ax)
    return np.eye(3) if n < 1e-9 else rot(ax / n, math.degrees(math.acos(c)))


def _arms(J, L, out=20.0, fwd=0.0, el=15.0):
    """put both arms into the local turns L: out (deg, how far out from hanging straight down), fwd (swung forward), el (the elbow's
    bend, forward), as seen in the world whatever the back does and whatever the rest pose holds them at"""
    Rb = np.eye(3)
    for n in ('hips', 'spine1', 'spine2', 'spine3'): Rb = Rb @ np.array(L.get(n, np.eye(3)))
    for sd, sg in (('R', 1), ('L', -1)):
        sh, e, w = (np.array(J[n + sd], float) for n in ('uarm_', 'farm_', 'hand_')); d1 = e - sh; d2 = w - e
        down = np.array([sg * math.sin(math.radians(out)), 0, -math.cos(math.radians(out))])
        t1 = rot((1, 0, 0), fwd) @ down; t2 = rot((1, 0, 0), fwd + el) @ down
        Rp = Rb @ np.array(L.get('clav_' + sd, np.eye(3))); R1 = _between(d1, Rp.T @ t1); L['uarm_' + sd] = R1
        L['farm_' + sd] = _between(d2, (Rp @ R1).T @ t2)
    return L


def POSES(J):
    """the rest and the five far poses of the check (startmeldingen: armene opp, dyp knebøy, sittende, bøyd over rekka, vridd), and the
    standing pose the game holds (the arms down along the body), for a body whose rest pose is J. Each: (local turns, where the hips move)"""
    X = (-1, 0, 0); Z = (0, 0, 1); P = {}          # (a turn about X by a positive angle bends forward)
    P['hvile'] = ({}, (0, 0, 0))
    P['stå'] = (_arms(J, {}, out=13, el=14), (0, 0, 0))                    # the arms 13 degrees out from the body, the elbows a little bent
    a = {'clav_R': rot((0, 1, 0), -18), 'clav_L': rot((0, 1, 0), 18)}
    P['armene opp'] = (_arms(J, a, out=140, fwd=14, el=10), (0, 0, 0))     # the hands above the head
    d = {'hips': rot(X, 28), 'spine1': rot(X, 8), 'spine2': rot(X, 6)}
    for sd in 'RL': d['thigh_' + sd] = rot(X, -28 - 100); d['shin_' + sd] = rot(X, 128); d['foot_' + sd] = rot(X, -28)
    P['dyp knebøy'] = (_arms(J, d, out=14, fwd=62, el=35), (0, -0.20, -0.47))
    s_ = {'hips': rot(X, 6), 'spine1': rot(X, 4)}
    for sd in 'RL': s_['thigh_' + sd] = rot(X, -6 - 86); s_['shin_' + sd] = rot(X, 88)
    P['sittende'] = (_arms(J, s_, out=12, fwd=38, el=62), (0, -0.28, -0.40))
    b = {'hips': rot(X, 34), 'spine1': rot(X, 16), 'spine2': rot(X, 12), 'spine3': rot(X, 8), 'neck': rot(X, -12), 'head': rot(X, -10)}
    for sd in 'RL': b['thigh_' + sd] = rot(X, -34 - 4); b['shin_' + sd] = rot(X, 8)
    P['bøyd over rekka'] = (_arms(J, b, out=10, fwd=58, el=20), (0, -0.06, -0.02))
    v = {'spine1': rot(Z, 14), 'spine2': rot(Z, 16), 'spine3': rot(Z, 16), 'neck': rot(Z, 14), 'head': rot(Z, 16)}
    # (the arms turn with the chest: set as seen from the body and not from the world, or the arm on the side the chest turns
    # away from is left behind and goes through the jacket's side; Jonas 13.11.2026: «Clipper den ene armen gjennom siden på jakken?»)
    va = _arms(J, {}, out=16, fwd=20, el=40); va.update(v); P['vridd'] = (va, (0, 0, 0))
    # the weights' own poses (the control of 13.11.2026: what the six above never ask of the weights): a stride with the legs
    # apart fore and aft, the head turned as far as the neck lets it, the arms straight forward
    g = {}
    g['thigh_R'] = rot(X, -32); g['shin_R'] = rot(X, 12); g['thigh_L'] = rot(X, 22); g['shin_L'] = rot(X, 30)
    P['gange'] = (_arms(J, g, out=13, fwd=0, el=14), (0, 0, -0.04))          # (the arms as standing: what a jacket's sides are cut to clear)
    P['hodevri'] = (_arms(J, {'neck': rot(Z, 35), 'head': rot(Z, 40)}, out=13, el=14), (0, 0, 0))
    P['arm frem'] = (_arms(J, {}, out=6, fwd=90, el=4), (0, 0, 0))
    return P


# ---------------- the hands' grips: the same hand with its fingers bent (Jonas 23.10.2026: «hvordan objekter holdes med hendene») ----------------
# per grip: the four fingers' bends at the knuckle, the middle and the last joint (degrees, toward the palm, on top of the rest pose's
# light curl), and the thumb's (across the palm, its middle joint, its last joint). Start values, to be tuned on the tablet.
GRIPS = {
    'relax': {'f': {n: (0, 0, 0) for n in FINGERS[1:]}, 't': (0, 0, 0)},
    'flat':  {'f': {'index': (-8, -12, -6), 'middle': (-8, -12, -6), 'ring': (-8, -12, -6), 'little': (-8, -12, -6)}, 't': (-10, -4, -4)},
    'grip':  {'f': {'index': (58, 78, 38), 'middle': (62, 82, 42), 'ring': (65, 84, 44), 'little': (68, 86, 46)}, 't': (46, 26, 34)},
    'hold':  {'f': {'index': (30, 36, 16), 'middle': (34, 40, 18), 'ring': (37, 44, 20), 'little': (40, 48, 22)}, 't': (34, 12, 12)},
    'pinch': {'f': {'index': (36, 42, 18), 'middle': (52, 76, 42), 'ring': (60, 84, 46), 'little': (66, 88, 50)}, 't': (40, 18, 18)},
    'hook':  {'f': {'index': (6, 84, 54), 'middle': (8, 88, 56), 'ring': (10, 90, 58), 'little': (12, 92, 60)}, 't': (12, 6, 4)},
}


def grip_turns(sex, grip, J=None):
    """the fingers' local turns for a grip, both hands: {bone: 3x3}"""
    J = J or joints(sex); F = fingers(sex); G = GRIPS[grip]; L = {}
    for sd, sg in (('R', 1), ('L', -1)):
        mir = np.array([sg, 1, 1.0]); n = F['n'] * mir; d = F['d'] * mir
        for fn in FINGERS[1:]:
            pts = [np.array(J['%s%d_%s' % (fn, k, sd)], float) for k in (1, 2, 3)] + [np.array(tails(J)['%s3_%s' % (fn, sd)], float)]
            for k, ang in enumerate(G['f'][fn]):
                u = pts[k + 1] - pts[k]; ax = np.cross(u, n); L['%s%d_%s' % (fn, k + 1, sd)] = rot(ax, ang)
        pts = [np.array(J['thumb%d_%s' % (k, sd)], float) for k in (1, 2, 3)] + [np.array(tails(J)['thumb3_%s' % sd], float)]
        goal = np.array(J['middle1_' + sd], float) + n * 0.035 - pts[1]          # the thumb swings across the palm, toward in front of the middle finger's knuckle
        if grip in ('pinch', 'grip'):
            # the thumb's two outer joints curl, and the first joint turns the curled thumb to point where it shall lie (within the
            # joint's reach). Pinch: the thumb's pad meets the index finger's tip as the grip holds it. Grip: the thumb lies over
            # the outside of the index finger's last joint, round the shaft the fingers close on, and not through it.
            for k in (1, 2):
                u = pts[k + 1] - pts[k]; L['thumb%d_%s' % (k + 1, sd)] = rot(np.cross(u, goal), G['t'][k])
            M, Jp = pose_mats(J, {k_: v_ for k_, v_ in L.items() if k_.endswith(sd)})
            at = lambda fn: (M[BI['%s3_%s' % (fn, sd)]] @ np.append(np.array(tails(J)['%s3_%s' % (fn, sd)], float), 1))[:3]
            if grip == 'pinch': to = at('index')
            else:
                c_ = circle3(Jp['middle2_' + sd], Jp['middle3_' + sd], at('middle')); i3 = Jp['index3_' + sd]; r_ = np.linalg.norm(i3 - c_); to = c_ + (i3 - c_) / r_ * (r_ + 0.018)
            a_ = at('thumb') - pts[0]; b_ = to - pts[0]; a_ /= np.linalg.norm(a_); b_ /= np.linalg.norm(b_)
            ang = math.degrees(math.acos(float(np.clip(a_ @ b_, -1, 1)))); L['thumb1_' + sd] = rot(np.cross(a_, b_), min(ang, 60.0))
            continue
        u = pts[1] - pts[0]; L['thumb1_' + sd] = rot(np.cross(u, goal), G['t'][0])
        for k in (1, 2):
            u = pts[k + 1] - pts[k]; L['thumb%d_%s' % (k + 1, sd)] = rot(np.cross(u, goal), G['t'][k])
    return L


def circle3(a, b, c):
    a, b, c = (np.array(x, float) for x in (a, b, c)); ab = b - a; ac = c - a; n = np.cross(ab, ac); nn = float(n @ n)
    if nn < 1e-14: return (a + b + c) / 3
    return a + (np.cross(n, ab) * float(ac @ ac) + np.cross(ac, n) * float(ab @ ab)) / (2 * nn)


def grip_point(sex, grip, sd):
    """where the thing held sits in a grip and the line it lies along, from the wrist's joint in the rest pose: round the middle
    finger's curl for a grip and a hook, between the thumb and the index for a pinch, before the palm for the rest"""
    J = joints(sex); F = fingers(sex); sg = 1 if sd == 'R' else -1; mir = np.array([sg, 1, 1.0]); L = grip_turns(sex, grip, J); M, Jp = pose_mats(J, L)
    tip = lambda fn: (M[BI['%s3_%s' % (fn, sd)]] @ np.append(np.array(tails(J)['%s3_%s' % (fn, sd)], float), 1))[:3]
    w = np.array(J['hand_' + sd], float); n = F['n'] * mir; d = F['d'] * mir; side = F['side'] * mir; m = [Jp['middle%d_%s' % (k, sd)] for k in (1, 2, 3)] + [tip('middle')]
    if grip == 'grip': at = circle3(m[0], m[2], m[3]); ax = side          # (the ring the hand closes: the knuckle, the last joint and the fingertip)
    elif grip == 'hook': at = circle3(m[1], m[2], m[3]); ax = side
    elif grip == 'hold': at = (m[1] + m[3]) / 2 + n * 0.012; ax = side
    elif grip == 'pinch': at = (tip('index') + tip('thumb')) / 2; ax = d
    elif grip == 'flat': at = w + d * 0.085 + n * 0.014; ax = d
    else: at = w + d * 0.085 + n * 0.030; ax = side
    return at - w, ax


# how far each joint turns in a body (degrees; flex: bending forward or closing the joint, the other way negative). Start values from
# the usual tables of the joints' range of motion (not looked up at a source in this step), for FB2's reach and FB6's poses to stay inside.
LIMITS = {
    'spine1': {'flex': [-8, 22], 'side': [-10, 10], 'twist': [-8, 8]}, 'spine2': {'flex': [-8, 22], 'side': [-10, 10], 'twist': [-12, 12]}, 'spine3': {'flex': [-8, 20], 'side': [-10, 10], 'twist': [-15, 15]},
    'neck': {'flex': [-25, 30], 'side': [-20, 20], 'twist': [-35, 35]}, 'head': {'flex': [-25, 25], 'side': [-15, 15], 'twist': [-40, 40]},
    'clav': {'up': [-5, 30], 'forward': [-15, 20]}, 'uarm': {'flex': [-50, 170], 'out': [0, 170], 'twist': [-70, 80]}, 'farm': {'flex': [0, 150]}, 'ftw': {'twist': [-80, 80]},
    'hand': {'flex': [-70, 80], 'side': [-20, 35]}, 'finger1': {'flex': [-20, 90]}, 'finger2': {'flex': [0, 105]}, 'finger3': {'flex': [0, 80]}, 'thumb1': {'flex': [-15, 55]}, 'thumb2': {'flex': [0, 55]}, 'thumb3': {'flex': [-10, 80]},
    'thigh': {'flex': [-20, 125], 'out': [-25, 45], 'twist': [-40, 40]}, 'shin': {'flex': [0, 150]}, 'foot': {'flex': [-45, 20], 'side': [-20, 20]}, 'toe': {'flex': [-30, 60]},
}


CHECK_POSES = ['stå', 'armene opp', 'dyp knebøy', 'sittende', 'bøyd over rekka', 'vridd']
WEIGHT_POSES = ['gange', 'hodevri', 'arm frem']          # measured for stretch only


if __name__ == '__main__':
    import time, sys
    for sex in 'mf':
        t0 = time.time(); v, t = grid_mesh(prims(sex), 0.004 if 'fast' in sys.argv else 0.003, cache=os.path.join(os.path.dirname(os.path.abspath(__file__)), 'out', 'cache'))
        print(sex, len(v), len(t), 'x %.3f..%.3f y %.3f..%.3f z %.3f..%.3f' % (v[:, 0].min(), v[:, 0].max(), v[:, 1].min(), v[:, 1].max(), v[:, 2].min(), v[:, 2].max()), '%.1fs' % (time.time() - t0))
        for z in (0.30, 0.50, 0.70, 0.86, 0.95, 1.08, 1.27, 1.40, 1.52, 1.65):
            m = np.abs(v[:, 2] - z) < 0.004; c = v[m]; body = c[np.abs(c[:, 0]) < (0.22 if z > 0.8 else 1)]
            print('  z %.2f  halvbredde %.3f  dybde %.3f..%.3f' % (z, np.abs(body[:, 0]).max(), body[:, 1].min(), body[:, 1].max()))
