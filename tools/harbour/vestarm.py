"""The life jacket against the arms as the game poses them (Ø11.5, 06.11.2026; Jonas: «Kjør klasjsjekk på vesten mot armene i spillet»).

garderobe_bilder.py measures the vest against the arms in the standing pose of the Blender figure, where the parka vests' collar
crossed the top of the upper arm (35 pairs, Ø11.4). In the game the arms are posed live: view3d/08-plants.js drawWorker puts the
upper arm from the shoulder (0.21 m out, 1.42 m up) to an elbow halfway to the hand, and the forearm on to the hand, for each task's
hands; deckcrew.js poseSegs has every task's hands at the furthest reach of its movement. This takes those hands, poses the worker
GLB's uarm and farm exactly as drawWorker's limbM does, puts the vest where the torso is drawn (the hips 0.92 m up), and counts, per
vest and pose, the arm's triangles that cross the vest but not the jacket under it: the arm's root is inside the jacket's shoulder
at every joint of a figure built in parts (200-500 crossings with the jacket alone in every pose), so a crossing that the jacket has
too is the pose's and not the vest's. With the vest on, the game sets the shoulder joint VEST_SH lower and further out (vessel3d.js
VEST_SH, the same numbers), so the arm's root comes out under the collar instead of through it. No Blender:

    python3 tools/harbour/vestarm.py            the poses with a crossing, and the sums
    python3 tools/harbour/vestarm.py --all      every pose
    python3 tools/harbour/vestarm.py --sh 0,0   the shoulder where it is without the vest (as Ø11.4 left it); --sh 0.02,0.02,0.04 with the
                                                elbow 4 cm further out too

Frames: the person's own [forward, up, right] (deckcrew), the game's figure frame x right, y up, z back (drawWorker with h = 0)."""
import os, sys, json, struct, base64, math

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))
SRC = os.path.join(ROOT, 'src', 'data', 'worker.b64')
# the hands of each task (deckcrew.js poseSegs, without a rail: R = [0.42, 1.0]); [forward, up, right] for the right and the left hand
D, TOP = 0.44, 1.04
POSES = {'stå': ([0, 0.93, 0.19], [0, 0.93, -0.19]), 'hvile (drawWorker)': ([0, 0.76, 0.26], [0, 0.76, -0.26]), 'lene': ([D, TOP, 0.2], [D, TOP, -0.2]),
         'kaffe': ([0.18, 1.5, 0.04], [0.05, 0.85, -0.25]), 'prat': ([0.34, 1.3, 0.2], [0.04, 0.92, -0.22]), 'kniv': ([0.45, 1.2, 0.13], [0.3, 1.02, -0.06]),
         'mat': ([0.13, 1.5, 0.03], [0.3, 1.03, -0.1]), 'telefon': ([0.26, 1.13, 0.035], [0.26, 1.12, -0.035]), 'kikkert': ([0.15, 1.56, 0.07], [0.15, 1.56, -0.07]),
         'røyk': ([0.24, 1.52, 0.17], [D, TOP, -0.2]), 'snus': ([0.26, 1.47, 0.02], [0.26, 1.1, -0.04]), 'feie': ([0.25, 1.0, 0.1], [0.35, 0.8, -0.05]),
         'spyle': ([0.45, 1.15, 0.12], [0.3, 1.1, -0.1]), 'jukse': ([0.34, 1.3, 0.16], [0.3, 0.9, -0.16]), 'jukse ved rekka': ([D, TOP + 0.4, 0.16], [D - 0.04, TOP + 0.01, -0.16]),
         'hale': ([0.42, 1.08, 0.2], [0.52, 1.22, -0.06]), 'blø': ([0.3, 0.92, 0.2], [0.28, 0.95, -0.18]), 'plukke': ([0.48, 0.92, 0.16], [0.48, 0.92, -0.16]),
         'bøte': ([0.42, 1.0, 0.12], [0.42, 1.02, -0.1]), 'ror': ([0.3, 1.1, 0.17], [0.3, 1.1, -0.17]), 'sløye': ([0.42, 1.18, 0.2], [0.36, 0.96, -0.12]),
         'pakke': ([0.4, 0.95, 0.15], [0.08, 1.02, -0.2]), 'bære': ([0.3, 1.0, 0.2], [0.3, 1.0, -0.2]), 'vise kranen': ([0.42, 1.62, 0.22], [0.42, 1.62, -0.22]),
         'hekte av': ([0.38, 1.9, 0.08], [0.35, 1.3, -0.18]), 'signal': ([0.2, 1.72, 0.32], [0.25, 0.95, -0.22]), 'kveile': ([0.47, 1.05, 0.12], [0.3, 1.0, -0.15])}
VESTS = ['vest', 'vest_o', 'vest_p', 'vestF', 'vest_oF', 'vest_pF']
JACKET = {'vest': 'torso', 'vest_o': 'oilskin', 'vest_p': 'parka', 'vestF': 'jacketF', 'vest_oF': 'oilskinF', 'vest_pF': 'parkaF'}
VEST_SH = (0.02, 0.02, 0.04)     # the shoulder under the vest: out and down, and the elbow further out (m), as vessel3d.js VEST_SH


def load():
    raw = base64.b64decode(open(SRC, 'rb').read()); jl = struct.unpack_from('<I', raw, 12)[0]; J = json.loads(raw[20:20 + jl]); bo = 20 + jl + 8
    def part(name):
        nd = next(n for n in J['nodes'] if n['name'] == name); pr = J['meshes'][nd['mesh']]['primitives'][0]
        A = J['accessors'][pr['attributes']['POSITION']]; BV = J['bufferViews'][A['bufferView']]; o = bo + BV.get('byteOffset', 0); t, s = nd['translation'], nd['scale']
        P = [tuple(t[k] + s[k] * struct.unpack_from('<hhhh', raw, o + 8 * i)[k] / 32767 for k in range(3)) for i in range(A['count'])]
        IA = J['accessors'][pr['indices']]; IB = J['bufferViews'][IA['bufferView']]; fmt = 'I' if IA['componentType'] == 5125 else 'H'
        I = struct.unpack_from('<%d%s' % (IA['count'], fmt), raw, bo + IB.get('byteOffset', 0))
        return [(P[I[i]], P[I[i + 1]], P[I[i + 2]]) for i in range(0, len(I), 3)]
    return part


def sub(a, b): return (a[0] - b[0], a[1] - b[1], a[2] - b[2])
def cross(a, b): return (a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0])
def dot(a, b): return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
def nrm(a): l = math.sqrt(dot(a, a)) or 1e-9; return (a[0] / l, a[1] / l, a[2] / l)


def limb(A, B):
    """view3d limbM(A, B, 1): the part's z stretched from A to B, x and y the cross-section"""
    d = sub(B, A); L = math.sqrt(dot(d, d)) or 1e-6; z = (d[0] / L, d[1] / L, d[2] / L); up = (1, 0, 0) if abs(z[1]) > 0.9 else (0, 1, 0)
    x = nrm(cross(up, z)); y = cross(z, x)
    return lambda p: (A[0] + x[0] * p[0] + y[0] * p[1] + z[0] * L * p[2], A[1] + x[1] * p[0] + y[1] * p[1] + z[1] * L * p[2], A[2] + x[2] * p[0] + y[2] * p[1] + z[2] * L * p[2])


def tri_cross(T, U):
    """whether two triangles cross (each one's edges against the other's plane and inside it)"""
    def edge_hits(T, U):
        n = cross(sub(U[1], U[0]), sub(U[2], U[0])); nn = dot(n, n)
        if nn < 1e-18: return False
        for i in range(3):
            a, b = T[i], T[(i + 1) % 3]; da, db = dot(n, sub(a, U[0])), dot(n, sub(b, U[0]))
            if da * db > 0 or da == db: continue
            t = da / (da - db); p = (a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t)
            if all(dot(n, cross(sub(U[(k + 1) % 3], U[k]), sub(p, U[k]))) >= 0 for k in range(3)): return True
        return False
    return edge_hits(T, U) or edge_hits(U, T)


def box(T): return [min(p[k] for p in T) for k in range(3)], [max(p[k] for p in T) for k in range(3)]


def count(A, B):
    """the pairs of triangles of A and B that cross (B in a coarse grid of 6 cm cells)"""
    cell, grid = 0.06, {}
    for j, U in enumerate(B):
        lo, hi = box(U)
        for gx in range(int(math.floor(lo[0] / cell)), int(math.floor(hi[0] / cell)) + 1):
            for gy in range(int(math.floor(lo[1] / cell)), int(math.floor(hi[1] / cell)) + 1):
                for gz in range(int(math.floor(lo[2] / cell)), int(math.floor(hi[2] / cell)) + 1): grid.setdefault((gx, gy, gz), []).append(j)
    n, seen = 0, set()
    for i, T in enumerate(A):
        lo, hi = box(T); cand = set()
        for gx in range(int(math.floor(lo[0] / cell)), int(math.floor(hi[0] / cell)) + 1):
            for gy in range(int(math.floor(lo[1] / cell)), int(math.floor(hi[1] / cell)) + 1):
                for gz in range(int(math.floor(lo[2] / cell)), int(math.floor(hi[2] / cell)) + 1): cand.update(grid.get((gx, gy, gz), ()))
        for j in cand:
            if (i, j) in seen: continue
            bl, bh = box(B[j])
            if any(hi[k] < bl[k] or lo[k] > bh[k] for k in range(3)): continue
            if tri_cross(T, B[j]): n += 1; seen.add((i, j))
    return n


def hits(A, B):
    """the indices of A's triangles that cross any of B's"""
    cell, grid, out = 0.06, {}, set()
    for j, U in enumerate(B):
        lo, hi = box(U)
        for gx in range(int(math.floor(lo[0] / cell)), int(math.floor(hi[0] / cell)) + 1):
            for gy in range(int(math.floor(lo[1] / cell)), int(math.floor(hi[1] / cell)) + 1):
                for gz in range(int(math.floor(lo[2] / cell)), int(math.floor(hi[2] / cell)) + 1): grid.setdefault((gx, gy, gz), []).append(j)
    for i, T in enumerate(A):
        lo, hi = box(T); cand = set()
        for gx in range(int(math.floor(lo[0] / cell)), int(math.floor(hi[0] / cell)) + 1):
            for gy in range(int(math.floor(lo[1] / cell)), int(math.floor(hi[1] / cell)) + 1):
                for gz in range(int(math.floor(lo[2] / cell)), int(math.floor(hi[2] / cell)) + 1): cand.update(grid.get((gx, gy, gz), ()))
        for j in cand:
            bl, bh = box(B[j])
            if any(hi[k] < bl[k] or lo[k] > bh[k] for k in range(3)): continue
            if tri_cross(T, B[j]): out.add(i); break
    return out


def main():
    part = load(); uarm, farm = part('uarm'), part('farm'); show_all = '--all' in sys.argv
    vs = VEST_SH
    if '--sh' in sys.argv: vs = tuple(float(v) for v in sys.argv[sys.argv.index('--sh') + 1].split(',')) + (0.0,)
    vs = (vs + (0.0,))[:3]
    W = lambda a, up, r: (r, up, -a)          # [forward, up, right] -> the figure's frame (facing -z)
    lift = lambda n: [tuple((p[0], p[1] + 0.92, p[2]) for p in T) for T in part(n)]   # the torso is drawn from the hips, 0.92 m up
    G = {n: lift(n) for v in VESTS for n in (v, JACKET[v])}
    rows = []
    for name, (hr, hl) in POSES.items():
        row = [name]
        for v in VESTS:
            n = 0
            for r, h in ((0.21, hr), (-0.21, hl)):
                sg = 1 if r > 0 else -1; sh = W(0, 1.42 - vs[1], r + sg * vs[0]); q = W(*h)
                el = ((sh[0] + q[0]) / 2 + r * 0.25 + sg * vs[2], (sh[1] + q[1]) / 2 - 0.08, (sh[2] + q[2]) / 2 + 0.05)
                for f, P in ((limb(sh, el), uarm), (limb(el, q), farm)):
                    A = [tuple(f(p) for p in T) for T in P]; n += len(hits(A, G[v]) - hits(A, G[JACKET[v]]))
            row.append(n)
        rows.append(row)
    print('skulderen under vesten: %.3f m ut, %.3f m ned, albuen %.3f m lenger ut' % vs)
    print('%-20s' % 'stilling' + ''.join('%9s' % v for v in VESTS))
    for r in rows:
        if show_all or any(r[1:]): print('%-20s' % r[0] + ''.join('%9d' % x for x in r[1:]))
    tot = [sum(r[k] for r in rows) for k in range(1, len(VESTS) + 1)]
    print('%-20s' % 'sum' + ''.join('%9d' % x for x in tot)); print('stillinger:', len(rows), ' med kryss:', sum(1 for r in rows if any(r[1:])))


if __name__ == '__main__':
    main()
