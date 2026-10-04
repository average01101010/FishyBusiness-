"""The catch, built in Blender (plan E1, 04.10.2026): the fish the player brings aboard, seen in the tub on the skiff, on the jig line, in
the decked boats' tub, and in the charm. One part per species, each 1 m long (the game scales it by the fish's weight):
    torsk   cod (Gadus morhua): stout, three dorsal and two anal fins, a chin barbel, the upper jaw over the lower, mottled olive-brown
            with a pale lateral line arched over the pectoral fin, a square tail
    sei     saithe (Pollachius virens): slender, dark green-grey over silver, a straight pale lateral line, the lower jaw longest,
            a forked tail, no barbel
    hyse    haddock (Melanogrammus aeglefinus): purple-grey over silver, a black lateral line and the black spot over the pectoral
            fin, a tall pointed first dorsal, a small barbel, a concave tail
    lyr     pollack (Pollachius pollachius): bronze-olive with a dark lateral line arched high over the pectoral, the lower jaw longest
    lange   ling (Molva molva): long and eel-like, two dorsal fins (the second long), a long anal fin, a long barbel, marbled brown,
            the fins dark with pale edges, a rounded tail
    brosme  tusk (Brosme brosme): long, one dorsal and one anal fin running into the rounded tail, brown-yellow, the fins edged with
            a dark band and a white rim, a barbel
    uer     redfish (Sebastes norvegicus): deep, a big head with large eyes, a spiny dorsal, red-orange
    kveite  Atlantic halibut (Hippoglossus hippoglossus): a flatfish, both eyes on its right side, olive-brown above with paler mottling,
            white below, long dorsal and anal fins along the edges, a concave tail; the lateral line arched over the pectoral
    krabbe  brown crab (Cancer pagurus, taskekrabbe): the pie-crust shell, red-brown above and cream below, two black-tipped claws
            and four pairs of walking legs; 1 m across the legs

    pip install bpy==4.5.4
    python3 tools/fish/fisk.py          -> src/data/fish.b64, renders in tools/fish/out/
    python3 tools/fish/fisk.py fast     -> without the renders

Frames (the game's: x to the right, y up, z backwards, so the fish faces -z, its back up and its right side to +x; the halibut's eyed
side is its right side, +x). Here in Blender: x to the right, y forward (the head), z up; to_game(p) = (x, z, -y). Each part is from its
middle: the fish from z -0.5 (the snout) to 0.5 (the tail's tip), the crab around its shell's centre."""
import os, sys, math, base64
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))
sys.path.insert(0, os.path.join(ROOT, 'tools', 'boats'))
import bpy, bmesh
from bpyutil import *

OUT = os.path.join(HERE, 'out')

def to_game(p): return (p[0], p[2], -p[1])
def to_game_n(n): return (n[0], n[2], -n[1])
def hsh(*a):
    h = 2166136261
    for v in a:
        h = ((h ^ (int(v) & 0xffffffff)) * 16777619) & 0xffffffff
        h ^= h >> 13; h = (h * 0x5bd1e995) & 0xffffffff; h ^= h >> 15
    return h / 4294967296.0
def mix(a, b, t): return tuple(x + (y - x) * t for x, y in zip(a, b))
def yof(t): return 0.5 - t      # t: 0 at the snout, 1 at the tail's tip

# ---------- the species: the body's half-width w, half-height h and centre line zc along t, the colours and the fins ----------
# fins: (t0, t1, height, peak) with peak < 1 for a fin highest at its front; tail: its kind and half-height at the tip;
# lat: the lateral line's angle above the waist (radians) along t; spots: the share of mottled faces on the back and sides
SPEC = {
  'torsk': dict(tp=0.84, belly=1.0, ex=0.9,
    w=[(0, 0.0), (0.02, 0.022), (0.06, 0.042), (0.13, 0.064), (0.25, 0.078), (0.4, 0.072), (0.58, 0.05), (0.74, 0.027), (0.84, 0.013)],
    h=[(0, 0.0), (0.02, 0.026), (0.06, 0.05), (0.13, 0.085), (0.25, 0.108), (0.4, 0.102), (0.58, 0.072), (0.74, 0.04), (0.84, 0.021)],
    zc=[(0, 0.004), (0.06, 0.0), (0.2, -0.004), (0.4, 0.0), (0.84, 0.012)],
    col=dict(back=(0.34, 0.31, 0.17), side=(0.60, 0.56, 0.37), belly=(0.92, 0.90, 0.82), fin=(0.38, 0.35, 0.22), line=(0.90, 0.88, 0.78),
             spot=(0.22, 0.19, 0.10), spot2=(0.52, 0.47, 0.27), iris=(0.78, 0.66, 0.30)),
    spots=0.42, lat=[(0.2, 0.30), (0.3, 0.34), (0.5, 0.12), (0.84, 0.0)], bands=(-0.35, 0.55),
    dors=[(0.27, 0.39, 0.085, 0.8), (0.42, 0.58, 0.07, 0.9), (0.61, 0.78, 0.062, 0.9)], anal=[(0.41, 0.58, 0.06, 0.9), (0.61, 0.78, 0.052, 0.9)],
    tail=('square', 0.105), pect=(0.22, 0.10, 0.05), pelv=(0.14, 0.06), eye=(0.075, 0.017, 0.55), barbel=0.045, mouth=(0.085, -0.28)),
  'sei': dict(tp=0.85, belly=0.95, ex=0.92,
    w=[(0, 0.0), (0.02, 0.018), (0.06, 0.036), (0.13, 0.054), (0.27, 0.064), (0.42, 0.06), (0.6, 0.044), (0.76, 0.024), (0.85, 0.012)],
    h=[(0, 0.0), (0.02, 0.022), (0.06, 0.044), (0.13, 0.072), (0.27, 0.088), (0.42, 0.084), (0.6, 0.06), (0.76, 0.034), (0.85, 0.02)],
    zc=[(0, -0.012), (0.04, -0.006), (0.15, 0.0), (0.85, 0.008)],
    col=dict(back=(0.16, 0.20, 0.20), side=(0.42, 0.47, 0.47), belly=(0.80, 0.82, 0.82), fin=(0.20, 0.23, 0.23), line=(0.85, 0.87, 0.85),
             spot=(0.18, 0.22, 0.22), spot2=(0.30, 0.35, 0.35), iris=(0.80, 0.80, 0.78)),
    spots=0.08, lat=[(0.2, 0.18), (0.4, 0.12), (0.85, 0.0)], bands=(-0.2, 0.45),
    dors=[(0.28, 0.40, 0.07, 0.75), (0.43, 0.60, 0.056, 0.9), (0.63, 0.79, 0.05, 0.9)], anal=[(0.42, 0.60, 0.052, 0.9), (0.63, 0.79, 0.048, 0.9)],
    tail=('forked', 0.115), pect=(0.22, 0.09, 0.04), pelv=(0.15, 0.04), eye=(0.07, 0.016, 0.5), barbel=0.0, mouth=(0.075, -0.15)),
  'hyse': dict(tp=0.84, belly=1.0, ex=0.9,
    w=[(0, 0.0), (0.02, 0.02), (0.06, 0.04), (0.13, 0.058), (0.26, 0.066), (0.4, 0.062), (0.58, 0.044), (0.74, 0.024), (0.84, 0.012)],
    h=[(0, 0.0), (0.02, 0.026), (0.06, 0.054), (0.13, 0.09), (0.26, 0.108), (0.4, 0.1), (0.58, 0.07), (0.74, 0.038), (0.84, 0.02)],
    zc=[(0, 0.006), (0.06, 0.002), (0.2, -0.004), (0.84, 0.01)],
    col=dict(back=(0.25, 0.25, 0.30), side=(0.64, 0.65, 0.68), belly=(0.93, 0.93, 0.94), fin=(0.26, 0.26, 0.30), line=(0.05, 0.05, 0.06),
             spot=(0.24, 0.24, 0.29), spot2=(0.33, 0.33, 0.38), iris=(0.82, 0.82, 0.80), blotch=(0.06, 0.06, 0.07)),
    spots=0.06, lat=[(0.2, 0.32), (0.3, 0.36), (0.5, 0.16), (0.84, 0.0)], bands=(-0.25, 0.6),
    dors=[(0.27, 0.37, 0.13, 0.45), (0.40, 0.58, 0.06, 0.9), (0.61, 0.78, 0.055, 0.9)], anal=[(0.40, 0.58, 0.055, 0.9), (0.61, 0.78, 0.05, 0.9)],
    tail=('concave', 0.105), pect=(0.22, 0.10, 0.045), pelv=(0.14, 0.05), eye=(0.075, 0.019, 0.55), barbel=0.015, mouth=(0.07, -0.3)),
  'lyr': dict(tp=0.85, belly=0.95, ex=0.92,
    w=[(0, 0.0), (0.02, 0.018), (0.06, 0.036), (0.13, 0.055), (0.27, 0.064), (0.42, 0.06), (0.6, 0.044), (0.76, 0.024), (0.85, 0.012)],
    h=[(0, 0.0), (0.02, 0.022), (0.06, 0.046), (0.13, 0.078), (0.27, 0.094), (0.42, 0.088), (0.6, 0.062), (0.76, 0.035), (0.85, 0.02)],
    zc=[(0, -0.014), (0.04, -0.007), (0.15, 0.0), (0.85, 0.008)],
    col=dict(back=(0.30, 0.28, 0.16), side=(0.68, 0.60, 0.37), belly=(0.88, 0.85, 0.74), fin=(0.32, 0.30, 0.18), line=(0.14, 0.13, 0.08),
             spot=(0.36, 0.32, 0.17), spot2=(0.55, 0.49, 0.28), iris=(0.80, 0.72, 0.42)),
    spots=0.12, lat=[(0.2, 0.55), (0.28, 0.6), (0.42, 0.25), (0.55, 0.05), (0.85, 0.0)], bands=(-0.25, 0.5),
    dors=[(0.28, 0.40, 0.075, 0.75), (0.43, 0.60, 0.058, 0.9), (0.63, 0.79, 0.05, 0.9)], anal=[(0.42, 0.60, 0.054, 0.9), (0.63, 0.79, 0.05, 0.9)],
    tail=('forked', 0.11), pect=(0.22, 0.09, 0.04), pelv=(0.15, 0.04), eye=(0.07, 0.017, 0.5), barbel=0.0, mouth=(0.08, -0.15)),
  'lange': dict(tp=0.93, belly=0.95, ex=0.85,
    w=[(0, 0.0), (0.015, 0.016), (0.05, 0.032), (0.1, 0.044), (0.2, 0.05), (0.4, 0.046), (0.65, 0.034), (0.85, 0.018), (0.93, 0.008)],
    h=[(0, 0.0), (0.015, 0.016), (0.05, 0.034), (0.1, 0.05), (0.2, 0.058), (0.4, 0.056), (0.65, 0.042), (0.85, 0.024), (0.93, 0.012)],
    zc=[(0, 0.003), (0.1, 0.0), (0.93, 0.004)],
    col=dict(back=(0.36, 0.30, 0.18), side=(0.55, 0.50, 0.34), belly=(0.86, 0.84, 0.74), fin=(0.24, 0.22, 0.16), edge=(0.88, 0.88, 0.84),
             spot=(0.26, 0.21, 0.12), spot2=(0.62, 0.56, 0.38), iris=(0.72, 0.66, 0.40)),
    spots=0.5, lat=None, bands=(-0.3, 0.45),
    dors=[(0.20, 0.31, 0.034, 0.7), (0.33, 0.93, 0.032, 1.0)], anal=[(0.42, 0.93, 0.03, 1.0)],
    tail=('round', 0.05), pect=(0.15, 0.06, 0.03), pelv=(0.10, 0.04), eye=(0.05, 0.012, 0.5), barbel=0.04, mouth=(0.07, -0.2)),
  'brosme': dict(tp=0.92, belly=1.0, ex=0.88,
    w=[(0, 0.0), (0.015, 0.02), (0.05, 0.04), (0.1, 0.054), (0.22, 0.062), (0.42, 0.056), (0.66, 0.04), (0.84, 0.022), (0.92, 0.01)],
    h=[(0, 0.0), (0.015, 0.02), (0.05, 0.042), (0.1, 0.062), (0.22, 0.076), (0.42, 0.072), (0.66, 0.054), (0.84, 0.03), (0.92, 0.015)],
    zc=[(0, 0.003), (0.1, 0.0), (0.92, 0.004)],
    col=dict(back=(0.40, 0.30, 0.18), side=(0.62, 0.50, 0.32), belly=(0.86, 0.80, 0.66), fin=(0.42, 0.33, 0.20), band=(0.10, 0.08, 0.06),
             edge=(0.92, 0.90, 0.84), spot=(0.34, 0.26, 0.15), spot2=(0.52, 0.42, 0.26), iris=(0.70, 0.62, 0.36)),
    spots=0.12, lat=None, bands=(-0.3, 0.45),
    dors=[(0.26, 0.92, 0.045, 1.0)], anal=[(0.44, 0.92, 0.042, 1.0)],
    tail=('round', 0.075), pect=(0.17, 0.07, 0.04), pelv=(0.11, 0.05), eye=(0.055, 0.014, 0.5), barbel=0.035, mouth=(0.075, -0.22)),
  'uer': dict(tp=0.83, belly=1.0, ex=0.92,
    w=[(0, 0.0), (0.02, 0.028), (0.07, 0.056), (0.15, 0.072), (0.28, 0.078), (0.45, 0.07), (0.62, 0.05), (0.76, 0.028), (0.83, 0.016)],
    h=[(0, 0.0), (0.02, 0.036), (0.07, 0.085), (0.15, 0.13), (0.28, 0.15), (0.45, 0.14), (0.62, 0.1), (0.76, 0.055), (0.83, 0.032)],
    zc=[(0, -0.01), (0.07, 0.0), (0.28, 0.006), (0.83, 0.012)],
    col=dict(back=(0.76, 0.20, 0.10), side=(0.88, 0.36, 0.18), belly=(0.95, 0.64, 0.48), fin=(0.82, 0.26, 0.14), line=(0.70, 0.18, 0.10),
             spot=(0.62, 0.15, 0.08), spot2=(0.84, 0.30, 0.15), iris=(0.92, 0.70, 0.30), blotch=(0.30, 0.10, 0.07)),
    spots=0.1, lat=[(0.2, 0.42), (0.45, 0.25), (0.83, 0.0)], bands=(-0.3, 0.5),
    dors=[(0.18, 0.55, 0.10, 1.0, 'spiny'), (0.56, 0.76, 0.085, 0.8)], anal=[(0.56, 0.74, 0.08, 0.7)],
    tail=('square', 0.12), pect=(0.24, 0.13, 0.07), pelv=(0.22, 0.08), eye=(0.085, 0.034, 0.55), barbel=0.0, mouth=(0.09, -0.18)),
  'kveite': dict(tp=0.84, belly=1.0, ex=0.85, flat=True,
    w=[(0, 0.0), (0.02, 0.012), (0.08, 0.026), (0.2, 0.036), (0.4, 0.038), (0.6, 0.032), (0.76, 0.02), (0.84, 0.012)],
    h=[(0, 0.0), (0.02, 0.03), (0.08, 0.075), (0.2, 0.135), (0.4, 0.16), (0.6, 0.13), (0.76, 0.065), (0.84, 0.03)],
    zc=[(0, -0.01), (0.08, 0.0), (0.84, 0.0)],
    col=dict(back=(0.25, 0.23, 0.16), side=(0.25, 0.23, 0.16), belly=(0.95, 0.95, 0.93), fin=(0.22, 0.20, 0.14), under=(0.93, 0.93, 0.91),
             line=(0.40, 0.37, 0.27), spot=(0.18, 0.16, 0.10), spot2=(0.40, 0.37, 0.26), iris=(0.86, 0.76, 0.40)),
    spots=0.4, lat=[(0.2, 0.62), (0.3, 0.7), (0.45, 0.25), (0.6, 0.05), (0.84, 0.0)], bands=(-9, 9),
    dors=[(0.07, 0.82, 0.07, 1.0)], anal=[(0.24, 0.82, 0.065, 1.0)],
    tail=('concave', 0.15), pect=(0.2, 0.08, 0.035), pelv=(0.16, 0.035), eye=(0.075, 0.018, 0.55), barbel=0.0, mouth=(0.11, -0.25)),
}

M = {}
def mats(sp, col):
    out = {}
    for k, c in col.items(): out[k] = mat('%s_%s' % (sp, k), c, 0.55 if k in ('belly', 'side', 'line', 'under') else 0.4)
    out['dark'] = mat('fish_dark', (0.07, 0.06, 0.05), 0.3)
    out['pupil'] = mat('fish_pupil', (0.02, 0.02, 0.02), 0.9)
    out['gill'] = mat('%s_gill' % sp, tuple(c * 0.72 for c in col['side']), 0.4)
    return out

def body_at(S, t):
    return interp(S['w'], t), interp(S['h'], t), interp(S['zc'], t)

NB_, NL_, NA_ = 4, 1, 5        # segments per side: belly to the lateral line, the line itself, the line to the back
DL = 0.035                     # the lateral line's half width (radians)
def side_angles(S, t):
    L = interp(S['lat'], t) if S.get('lat') else 0.15
    a0, a1 = L - DL, L + DL
    R = [-math.pi / 2 + (a0 + math.pi / 2) * k / NB_ for k in range(NB_)] + [a0, a1]
    R += [a1 + (math.pi / 2 - a1) * k / NA_ for k in range(1, NA_ + 1)]
    return R          # NB_ + NA_ + 2 angles from the belly (-pi/2) to the back (pi/2)

def ring(S, t):
    a, b, zc = body_at(S, t); e = S['ex']; R = side_angles(S, t); K = len(R) - 1
    pts = []
    for v in range(2 * K):
        lvl = v if v <= K else 2 * K - v; s = 1 if v <= K else -1; ph = R[lvl]
        c, sn = math.cos(ph), math.sin(ph)
        bb = b * (S['belly'] if sn < 0 else 1.0)
        pts.append((s * a * abs(c) ** e, yof(t), zc + bb * math.copysign(abs(sn) ** e, sn)))
    return pts, R, K

def surf(S, t, ph, side=1, out=0.0):
    """a point on the body's surface at t and angle ph above the waist, pushed out along the normal"""
    a, b, zc = body_at(S, t); e = S['ex']; c, sn = math.cos(ph), math.sin(ph); bb = b * (S['belly'] if sn < 0 else 1.0)
    x = side * a * abs(c) ** e; z = zc + bb * math.copysign(abs(sn) ** e, sn)
    n = V((side * c / max(a, 1e-4), 0, sn / max(bb, 1e-4))).normalized()
    return V((x, yof(t), z)) + n * out, n

def stations(S):
    tp = S['tp']; T = [0.0, 0.012, 0.03, 0.055, 0.085, 0.12, 0.16, 0.2, 0.208]
    n = max(6, int(round((tp - 0.24) / 0.055)))
    T += [0.24 + (tp - 0.24) * k / n for k in range(n + 1)]
    return T

def build_body(sp, S, C):
    T = stations(S); G = []; RR = []
    for t in T:
        pts, R, K = ring(S, t); G.append(pts); RR.append(R)
    G.append([(0.0, yof(S['tp'] + 0.004), interp(S['zc'], S['tp']))] * len(G[0]))       # close the peduncle
    RR.append(RR[-1]); T = T + [S['tp'] + 0.004]
    K = len(RR[0]) - 1; flat = S.get('flat'); lo, hi = S['bands']
    def matf(i, j):
        t = 0.5 * (T[i] + T[i + 1]); jj = j + 1
        lvl = min(j if j <= K else 2 * K - j, jj if jj <= K else 2 * K - jj)
        right = j < K
        ph = 0.5 * (RR[i][lvl] + RR[i][min(lvl + 1, K)])
        sd = 1 if right else -1
        if flat and not right: return C['under']
        if 0.2 < t < 0.212 and -1.0 < ph < 1.0: return C['gill']
        if S.get('lat') and lvl == NB_ and t > 0.212: return C['line']
        if 'blotch' in C and 0.22 < t < 0.31 and S['lat'] and interp(S['lat'], t) < ph < interp(S['lat'], t) + 0.55 and sp == 'hyse': return C['blotch']
        if 'blotch' in C and sp == 'uer' and 0.16 < t < 0.2 and 0.0 < ph < 0.6: return C['blotch']
        r = hsh(i, lvl, sd, len(sp))
        if flat:
            if r < S['spots']: return C['spot'] if hsh(i, lvl, 7) < 0.55 else C['spot2']
            return C['back']
        base = C['back'] if ph > hi else (C['belly'] if ph < lo else C['side'])
        if ph > lo + 0.15 and r < S['spots'] * (1.0 if ph > 0.2 else 0.6): return C['spot'] if hsh(i, lvl, 5) < 0.5 else C['spot2']
        return base
    zc0 = lambda y: interp(S['zc'], 0.5 - y)
    return grid(sp + '_body', G, matf, closed_v=True, angle=55, out=lambda c: (c.x, 0.0, c.z - zc0(c.y)))

def plate(name, G, m, out, t=0.004):
    """a thin plate from a grid in the x = 0 plane; out is +1 or -1: the side it faces; it is solidified towards the middle"""
    G = [[(out * t + p[0], p[1], p[2]) for p in row] for row in G]
    o = grid(name, G, lambda i, j: m if not callable(m) else m(i, j), angle=50, out=lambda c: (out, 0, 0))
    solidify(o, t); apply_all(o); return o

def fin(name, G, C, sd_mats=None):
    """a fin from a grid (rows from the base out to the edge); sd_mats(i, j, side) gives the material. One plate solidified through the
    middle; the halibut's fins are two, dark above and white below"""
    if not SPECF['flat']:
        G2 = [[(p[0] + 0.0015, p[1], p[2]) for p in row] for row in G]
        o = grid(name, G2, lambda i, j: sd_mats(i, j, 1), angle=50, out=lambda c: (1, 0, 0)); solidify(o, 0.003); apply_all(o); return [o]
    return [plate(name + ('p' if out > 0 else 'n'), G, (lambda i, j, o=out: sd_mats(i, j, o)), out, 0.0015) for out in (1, -1)]

def fin_mats(S, C, nrows):
    flat = S.get('flat')
    def f(i, j, out):
        if flat and out < 0: return C['under']
        if 'edge' in C and i == nrows - 1: return C['edge']
        if 'band' in C and i == nrows - 2: return C['band']
        return C['fin']
    return f

def build_fins(sp, S, C):
    parts = []; flat = S.get('flat')
    # dorsal and anal fins: columns along the base, rows from the base to the edge
    for kind, lst in (('dors', S['dors']), ('anal', S['anal'])):
        for k, fdef in enumerate(lst):
            t0, t1, h, pk = fdef[:4]; spiny = len(fdef) > 4 and fdef[4] == 'spiny'
            nu = max(4, int(round((t1 - t0) / 0.028))); rows = [0.0, 0.72, 0.88, 1.0] if 'band' in C else ([0.0, 0.82, 1.0] if 'edge' in C else [0.0, 1.0])
            G = []
            for r in rows:
                row = []
                for i in range(nu + 1):
                    u = i / nu; t = t0 + (t1 - t0) * u; a, b, zc = body_at(S, t)
                    hh = h * max(0.12, math.sin(math.pi * min(1.0, max(0.0, u) ** pk)) ** 0.55)
                    if spiny and i % 2 == 1: hh *= 0.72
                    if kind == 'dors': z0 = zc + b * 0.9; z = z0 + hh * r
                    else: z0 = zc - b * S['belly'] * 0.9; z = z0 - hh * r
                    row.append((0.0, yof(t) - 0.25 * hh * r, z))
                G.append(row)
            parts += fin('%s_%s%d' % (sp, kind, k), G, C, fin_mats(S, C, len(rows) - 1))
    # the tail: columns from the bottom tip to the top tip, rows from the peduncle out to the trailing edge
    kind, hT = S['tail']; tp = S['tp']; a, b, zc = body_at(S, tp - 0.02); hb = b * 0.95
    def tend(v):
        if kind == 'square': return 1.0 - 0.012 * (1 - v * v)
        if kind == 'concave': return 1.0 - 0.05 * (1 - v * v)
        if kind == 'forked': return 1.0 - 0.11 * (1 - abs(v)) ** 1.3
        return tp + (1 - tp) * (1 - 0.5 * v * v)
    rows = [0.0, 0.5, 0.85, 1.0] if ('band' in C or 'edge' in C) else [0.0, 0.5, 1.0]; nv = 8; G = []
    for u in rows:
        row = []
        for j in range(nv + 1):
            v = -1 + 2 * j / nv; t = (tp - 0.025) + (tend(v) - (tp - 0.025)) * u
            hh = hb + (hT - hb) * u ** 0.8
            if kind == 'round': hh = hb + (hT - hb) * math.sin(math.pi / 2 * min(1, u * 1.3))
            row.append((0.0, yof(t), zc + v * hh))
        G.append(row)
    parts += fin(sp + '_tail', G, C, fin_mats(S, C, len(rows) - 1))
    # the pectoral fins: a rounded paddle lying back along the side, a little out from the body
    t, ln, wd = S['pect']; ph0 = (interp(S['lat'], t) - 0.35) if S.get('lat') else 0.0
    for sd in ((1,) if flat else (1, -1)):
        p0, n = surf(S, t, ph0, sd, 0.002); G = []
        for r in (0.0, 0.5, 1.0):
            row = []
            for k in range(5):
                q = -1 + 2 * k / 4; w = wd * (0.55 + 0.45 * r) * math.sqrt(max(0.0, 1 - (q * r * 0.6) ** 2)); L = ln * r * (1 - 0.25 * q * q)
                row.append((p0.x + sd * L * 0.28, p0.y - L, p0.z + q * w * 0.5 - L * 0.12))
            G.append(row)
        parts.append(plate('%s_pect%d' % (sp, sd), G, (lambda i, j: C['fin']), sd, 0.003))
        if flat:      # the blind side's pectoral, white
            G2 = [[(-p[0], p[1], p[2]) for p in row] for row in G]
            parts.append(plate('%s_pectb' % sp, G2, (lambda i, j: C['under']), -1, 0.003))
    # the pelvic fins under the throat (on the halibut on the lower edge)
    t, ln = S['pelv']
    for sd in (1, -1):
        p0, n = surf(S, t, -1.35, sd, 0.001); G = []
        for r in (0.0, 1.0):
            row = []
            for k in range(4):
                q = k / 3; w = 0.012 * (1 - 0.6 * r)
                row.append((p0.x + sd * (q * w + 0.006 * r), p0.y - ln * r * (1 - 0.3 * q), p0.z - 0.012 * r - q * 0.004))
            G.append(row)
        G = [[(p[0], p[1], p[2]) for p in row] for row in G]
        bm = bmesh.new()
        vs = [[bm.verts.new(p) for p in row] for row in G]
        for j in range(3): bm.faces.new([vs[0][j], vs[0][j + 1], vs[1][j + 1], vs[1][j]])
        o = obj_from_bm('%s_pelv%d' % (sp, sd), bm, [C['under'] if (flat and sd < 0) else C['fin']]); solidify(o, 0.003); apply_all(o); shade(o, 50)
        parts.append(o)
    return parts

def build_head(sp, S, C):
    parts = []; flat = S.get('flat')
    te, r, phe = S['eye']
    eyes = [(te, phe, 1), (te + 0.025, phe - 0.75, 1)] if flat else [(te, phe, 1), (te, phe, -1)]
    for k, (t, ph, sd) in enumerate(eyes):
        p, n = surf(S, t, ph, sd, -0.25 * r)
        parts.append(sphere('%s_eye%d' % (sp, k), p, r, C['iris'], seg=10, rings=5))
        q = p + n * (0.62 * r)
        parts.append(sphere('%s_pup%d' % (sp, k), q, r * 0.55, C['pupil'], seg=8, rings=4))
    # the mouth: a dark line from the snout to the corner of the jaw on each side
    tm, phm = S['mouth']
    for sd in (1, -1):
        pts = [surf(S, 0.006, -0.3, sd, 0.0015)[0], surf(S, tm * 0.45, phm * 0.9, sd, 0.0015)[0], surf(S, tm, phm, sd, 0.0015)[0]]
        parts.append(tube('%s_mouth%d' % (sp, sd), pts, 0.0035, C['dark'], seg=6))
    if S['barbel']:
        p, n = surf(S, 0.035, -math.pi / 2 + 0.001, 1, -0.002); p.x = 0.0
        parts.append(cyl('%s_barbel' % sp, p, p + V((0, 0.006, -S['barbel'])), 0.0035, C['belly'], seg=6, r1=0.0012))
    return parts

SPECF = {'flat': False}
def build_fish(sp):
    S = SPEC[sp]; C = mats(sp, S['col']); SPECF['flat'] = bool(S.get('flat'))
    parts = [build_body(sp, S, C)] + build_fins(sp, S, C) + build_head(sp, S, C)
    for p in parts: apply_all(p)
    return join(parts, sp)

# ---------- the brown crab: the pie-crust shell, the claws and the legs ----------
def build_crab():
    C = {'top': mat('crab_top', (0.60, 0.30, 0.16), 0.45), 'rim': mat('crab_rim', (0.52, 0.25, 0.13), 0.45), 'under': mat('crab_under', (0.90, 0.80, 0.62), 0.35),
         'leg': mat('crab_leg', (0.66, 0.36, 0.20), 0.45), 'tip': mat('crab_tip', (0.10, 0.07, 0.05), 0.6), 'eye': mat('fish_pupil', (0.02, 0.02, 0.02), 0.9)}
    AX, AY = 0.30, 0.20; NT = 32
    def edge(th):
        s = math.sin(th); lob = 0.035 * abs(math.sin(5 * th)) if s > -0.15 else 0.0      # the front's pie-crust lobes
        return (AX * math.cos(th) * (1 + lob), AY * s * (1 + lob * 0.5) + 0.02 * (1 - abs(math.cos(th))) * (1 if s > 0 else 0))
    RHO_T = [0.0, 0.25, 0.5, 0.7, 0.85, 0.95, 1.0]; RHO_B = [1.0, 0.92, 0.7, 0.4, 0.0]
    G = []
    for k, rho in enumerate(RHO_T + RHO_B[1:]):
        top = k < len(RHO_T); row = []
        for j in range(NT):
            th = 2 * math.pi * j / NT; ex, ey = edge(th)
            z = 0.075 * (1 - rho * rho) ** 0.55 + 0.006 if top else -0.035 * (1 - rho * rho) ** 0.5 - 0.004
            if top and rho >= 1.0: z = 0.0
            row.append((ex * rho, ey * rho, z))
        G.append(row)
    nt = len(RHO_T)
    shell = grid('crab_shell', G, lambda i, j: C['top'] if i < nt - 2 else (C['rim'] if i < nt else C['under']), closed_v=True, angle=60, out=lambda c: (c.x, c.y, c.z))
    parts = [shell]
    for sd in (1, -1):
        # the eyes on short stalks at the front
        parts.append(sphere('crab_eye', (sd * 0.035, AY + 0.015, 0.03), 0.009, C['eye'], seg=8, rings=4))
        # the claw: arm, wrist, the swollen hand and the two black-tipped fingers
        a0 = V((sd * 0.16, 0.14, -0.005)); a1 = V((sd * 0.26, 0.24, -0.002)); a2 = V((sd * 0.24, 0.33, 0.0))
        parts.append(tube('crab_arm', [a0, a1], 0.028, C['leg'], seg=8)); parts.append(tube('crab_wrist', [a1, a2], 0.032, C['leg'], seg=8))
        h0 = a2; h1 = V((sd * 0.13, 0.40, 0.003))
        # the hand: built round the origin, turned along the claw and then moved to its place (turning it in place swung it off the arm)
        hand = sphere('crab_hand', (0, 0, 0), 0.05, C['leg'], scale=(1.5, 0.75, 0.6), seg=12, rings=6); d = (h1 - h0).normalized()
        hand.rotation_euler = (0, 0, math.atan2(d.y, d.x)); hand.location = (h0 + h1) / 2; apply_all(hand); parts.append(hand)
        f0 = h1 + V((0, 0, 0.012)); f1 = f0 + V((-sd * 0.09, 0.03, 0.0)); g0 = h1 + V((0, 0, -0.012)); g1 = g0 + V((-sd * 0.085, 0.022, 0.0))
        parts.append(cyl('crab_dact', f0, f0 + (f1 - f0) * 0.55, 0.016, C['leg'], seg=6, r1=0.012)); parts.append(cyl('crab_dact2', f0 + (f1 - f0) * 0.55, f1, 0.012, C['tip'], seg=6, r1=0.002))
        parts.append(cyl('crab_fix', g0, g0 + (g1 - g0) * 0.55, 0.016, C['leg'], seg=6, r1=0.012)); parts.append(cyl('crab_fix2', g0 + (g1 - g0) * 0.55, g1, 0.012, C['tip'], seg=6, r1=0.002))
        # four walking legs: out from under the shell, up to the knee and down to the dark tip
        for k in range(4):
            th = math.radians(18 - k * 26); base = V((sd * AX * 0.75 * math.cos(th), AY * 0.75 * math.sin(th), -0.01))
            dirv = V((sd * math.cos(th), math.sin(th) * 0.8, 0.0)).normalized()
            knee = base + dirv * 0.15 + V((0, 0, 0.06)); ank = knee + dirv * 0.13 + V((0, -0.01 * k, -0.04)); tip = ank + dirv * 0.06 + V((0, -0.02, -0.06))
            parts.append(tube('crab_leg', [base, knee], 0.017, C['leg'], seg=6)); parts.append(tube('crab_leg2', [knee, ank], 0.014, C['leg'], seg=6))
            parts.append(cyl('crab_leg3', ank, tip, 0.011, C['tip'], seg=6, r1=0.002))
    for p in parts: apply_all(p)
    return join(parts, 'krabbe')

SPECIES = ['torsk', 'sei', 'hyse', 'lyr', 'lange', 'brosme', 'uer', 'kveite']

def main():
    os.makedirs(OUT, exist_ok=True)
    reset()
    objs = {sp: build_fish(sp) for sp in SPECIES}; objs['krabbe'] = build_crab()
    parts = [(sp, mesh_arrays(o, to_game, to_game_n, ao=False), 1.0) for sp, o in objs.items()]
    ex = {'frame': 'kystfiske fish: x right, y up, z back (the head at -z, the halibut eyed side +x); 1 m long from z -0.5 to 0.5; the crab 1 m across its legs',
          'species': list(objs)}
    glb = os.path.join(OUT, 'fish.glb'); n = write_glb(glb, parts, ex)
    open(os.path.join(ROOT, 'src', 'data', 'fish.b64'), 'w').write(base64.b64encode(open(glb, 'rb').read()).decode())
    print('fish GLB %.1f KB, %s' % (n / 1024, ', '.join('%s %d' % (p[0], len(p[1]['idx']) // 3) for p in parts)))
    if 'fast' in sys.argv: return
    # renders: the species side by side on a light deck, from the side and from above at an angle
    for k, (sp, o) in enumerate(objs.items()):
        o.location = (0.0, (k % 3) * 1.25 - 1.25, -(k // 3) * 0.55 + 0.55) if sp != 'krabbe' else (0.0, 1.25, -0.55)
        if sp == 'krabbe': o.rotation_euler = (0, 1.0, 0)      # the fish from their right side, the crab tilted to show its shell
    setup_render(1600, 1000, samples=24)
    bpy.context.scene.world.node_tree.nodes.get('Background').inputs['Color'].default_value = (0.70, 0.76, 0.82, 1)
    camera((4.2, 0.0, 0.0), (0.0, 0.0, 0.0), ortho=4.1); render(os.path.join(OUT, 'fish_side.png'))
    camera((3.0, 1.6, 1.3), (0.0, 0.0, 0.0), lens=40); render(os.path.join(OUT, 'fish_3q.png'))

if __name__ == '__main__':
    main()
