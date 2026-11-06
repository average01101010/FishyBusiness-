"""The rescue boat (MOB boat) with its davit and its cradle, for the fishing vessels from 45 m (Ø11.4, 06.11.2026; Jonas' references
28.10.2026 in docs/planer/lover-og-regler.md L6: a white davit with a column, a winch and one sloping arm with a block and a hook, a
lifting sling to three points in the boat; the boat orange, about 5-6 m, with a fender collar, a console with a hoop, an outboard or a
water jet, and an orange cover over it when it stands in its cradle on deck). No brand names, logos or text on the models.

The measures. The LSA Code (IMO resolution MSC.48(66), chapter V, 5.1.1.3) asks a rescue boat to be rigid, inflated or both, not less
than 3.8 m and not more than 8.5 m long, and able to carry at least five seated persons and a person lying on a stretcher; it must
manoeuvre at speeds up to 6 knots and keep that up for at least 4 h. The launching appliance (chapter VI, 6.1.2.8) lowers it at no
less than S = 0.4 + 0.02 H m/s (H from the davit head to the waterline). The official IMO text could not be opened from here; the
paragraphs were read in copies of the Code found by search (docs/planer/lover-regler-sikkerhet.md, Ø11.4). Within those limits the
sizes are my own, after the references: a rigid boat of 5.17 m over its foam collar (4.70 m GRP hull), 2.08 m wide over the collar,
the collar 0.40 m across at the sides and 0.32 m at the bow, the hull 0.78 m deep at the transom, a cockpit floor 0.36 m over the keel
(room for five seated and the stretcher between the console and the forward locker), a console with a hoop, a jockey seat and an
outboard on a 20 in shaft.

    mob_boat    the boat, from the bottom of its keel at the middle of the GRP hull (lying along y, the bow towards -z): the deep-V
                hull with a spray rail, the transom with the motor well, the cockpit floor, the inner sides and the forward locker,
                the foam collar round the gunwale with its rubbing strip and the becketed grab line, the console with its windscreen,
                wheel, display and throttle, the stainless hoop over it with the all-round light and the searchlight, the jockey
                seat, the outboard (cowling, leg, cavitation plate, gearcase, skeg, propeller) and the three lifting eyes (two on the
                transom's top corners, one on the collar's nose).
    mob_tarp    the orange cover over the cockpit (from the boat's origin): tucked on the collars' inner tops all round, tented over
                the console, the hoop and the seat, a curtain down at the transom, a dark hem round its edge. The game draws it while
                the boat stands in its cradle and leaves it off when the boat is in use.
    mob_sling   the lifting sling (from the boat's origin): the master link over the boat's centre of gravity and three wire legs
                with shackles to the lifting eyes.
    mob_vugge   the cradle (from the middle of its base on deck): two saddles under the hull's bottom (rubber pads clear of the
                hull by 3 mm), keel posts with rubber blocks, the base beams with foot plates and bolts, two rails between them, and
                pad eyes at the beams' ends for the lashings.
    mob_lash    the two lashing straps over the covered boat (from the cradle's origin), each from a pad eye up over the collar and
                the cover and down to a turnbuckle and a slip hook on the other pad eye.
    mob_davit   the davit's column (from the middle of its base on deck): the foot plate with its bolts and gussets, the column.
    mob_arm     what slews on the column (from the same origin; it turns about the column's axis, the game's y through the origin):
                the slewing ring and head, the winch with its drum, motor and hand crank socket, the arm with its pin, the luffing
                cylinder, the sheave at the arm's tip and the wire from the drum to the sheave. Stowed, it points inboard (towards
                -x) over the boat.
    mob_hook    the hook block (from its top, where the fall ends): the swivel, the release hook's body and the hook.
    mob_fall    the fall: a wire one unit long along +z (game), stretched by the game from the sheave (head_at) to the hook (hook_at).

Extras (the game's frame, metres): boat_at (the boat's origin in the cradle), davit_at (the davit's origin in the cradle frame, for
the stowed arrangement, outboard towards +x), slew (the slewing axis's point), head_at (where the fall leaves the sheave, davit frame,
stowed), hook_at (the hook block's top, davit frame, stowed), ring (the master link's top in the boat frame), lift (the lifting eyes
in the boat frame), reach (the arm's reach from the slewing axis to the fall), lsa (the Code's numbers the model was made to).

The occlusion is baked into the colours, each part with what shades it where it stands.

    pip install bpy==4.5.4 (Python 3.11)
    python3.11 tools/deck/mob.py          -> src/data/deck-mob.b64, renders tools/deck/out/mob_*.png
    python3.11 tools/deck/mob.py fast     -> without the renders
    python3.11 tools/deck/mob.py dry      -> no occlusion, no renders, writes only tools/deck/out/deck-mob.glb
    python3.11 tools/deck/mob.py side     -> only the named renders (side top front stern davit hook console cradle open)

Frames. Here in Blender: x to the right (outboard), y forward, z up. The game's: x right, y up, z aft; to_game(p) = (x, z, -y)."""
import os, sys, math, base64
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))
sys.path.insert(0, os.path.join(ROOT, 'tools', 'boats')); sys.path.insert(0, HERE)
import bpy, bmesh
from mathutils import Vector, Matrix
from bpyutil import *
import sikker as SK
from sikker import revolve, atube, aribbon, atorus2, loft_rr, hexnut, domebolt, tangent_pt
acyl = SK.acyl            # (sikker's: a material, both ends capped)

OUT = os.path.join(HERE, 'out')
def to_game(p): return (p[0], p[2], -p[1])
def to_game_n(n): return (n[0], n[2], -n[1])
def G(p): return [round(v, 4) for v in to_game(p)]

C = {}
def colours():
    C['grp'] = mat('mb_grp', (0.96, 0.40, 0.06), 0.55)            # the hull, international orange
    C['coll'] = mat('mb_coll', (0.93, 0.36, 0.05), 0.35)           # the foam collar's skin
    C['rub'] = mat('mb_rub', (0.07, 0.07, 0.075), 0.3)
    C['inner'] = mat('mb_inner', (0.84, 0.84, 0.81), 0.45)         # the cockpit's gelcoat
    C['floor'] = mat('mb_floor', (0.46, 0.47, 0.47), 0.15)         # the non-slip floor
    C['cons'] = mat('mb_cons', (0.90, 0.90, 0.88), 0.5)
    C['glass'] = mat('mb_glass', (0.42, 0.52, 0.58), 0.9)
    C['dark'] = mat('mb_dark', (0.09, 0.09, 0.10), 0.4)
    C['screen'] = mat('mb_screen', (0.03, 0.04, 0.05), 0.95)
    C['cush'] = mat('mb_cush', (0.14, 0.15, 0.16), 0.2)
    C['stain'] = mat('mb_stain', (0.78, 0.80, 0.82), 0.75, metal=0.85)
    C['lens'] = mat('mb_lens', (0.93, 0.94, 0.95), 0.9)
    C['eng'] = mat('mb_eng', (0.11, 0.11, 0.12), 0.6)
    C['eng2'] = mat('mb_eng2', (0.62, 0.63, 0.65), 0.5)
    C['rope'] = mat('mb_rope', (0.92, 0.92, 0.88), 0.15)
    C['tarp'] = mat('mb_tarp', (0.97, 0.43, 0.06), 0.2)
    C['hem'] = mat('mb_hem', (0.70, 0.27, 0.04), 0.2)
    C['white'] = mat('mb_white', (0.93, 0.93, 0.91), 0.55)          # the davit
    C['grey'] = mat('mb_grey', (0.48, 0.50, 0.52), 0.45)
    C['chrome'] = mat('mb_chrome', (0.85, 0.86, 0.88), 0.9, metal=0.9)
    C['wire'] = mat('mb_wire', (0.55, 0.56, 0.57), 0.5, metal=0.6)
    C['galv'] = mat('mb_galv', (0.66, 0.67, 0.68), 0.45, metal=0.6)
    C['hook'] = mat('mb_hook', (0.95, 0.42, 0.07), 0.5)
    C['steel'] = mat('mb_steel', (0.38, 0.40, 0.42), 0.35)          # the cradle, painted grey
    C['rubber'] = mat('mb_rubber', (0.05, 0.05, 0.05), 0.15)
    C['web'] = mat('mb_web', (0.12, 0.13, 0.14), 0.2)               # the lashing straps

# ---------- the hull's lines (the boat's frame: origin at the keel's bottom at the middle of the GRP hull) ----------
LB = 4.70; Y_TR = -LB / 2            # the GRP hull's length, the transom's y
ZD = 0.36; ZF = 0.64                 # the cockpit floor and the forward locker's top over the keel
T_FD = 0.80                          # the forward locker's after face (t)
RAIL = 0.035                         # the spray rail's flat
def ty(t): return Y_TR + LB * t
def hb(t):
    """the half-breadth at the gunwale: 0.76 at the transom, 0.80 from a quarter of the length, a round nose (2.2) forward of the middle"""
    if t <= 0.5: return 0.80 - 0.04 * max(0.0, 1 - t / 0.25) ** 2
    u = (t - 0.5) / 0.5; return 0.80 * max(0.0, 1 - u ** 2.2) ** 0.5
def zk(t): return 0.30 * max(0.0, (t - 0.45) / 0.55) ** 2           # the keel rises forward
def zg(t): return 0.78 + 0.14 * max(0.0, (t - 0.40) / 0.60) ** 2    # the gunwale (sheer)
def dr(t): return math.radians(21 + 24 * max(0.0, (t - 0.35) / 0.65) ** 1.5)      # the deadrise: 21 degrees aft, 45 at the stem
def sec(t):
    """the starboard half of the section at t: keel to chine (six points), the spray rail, the flared side to the gunwale (six)"""
    b = hb(t); k = zk(t); g = zg(t); bc = 0.74 * b; tn = math.tan(dr(t))
    pts = [(bc * i / 5, k + bc * i / 5 * tn) for i in range(6)]
    zc = pts[-1][1]; pts.append((bc + RAIL * b / 0.80, zc - 0.004))
    x0, z0 = pts[-1]
    for i in range(1, 7):
        s = i / 6; pts.append((x0 + (b - x0) * (1 - (1 - s) ** 1.6), z0 + (g - z0) * s))
    return pts
def x_at(t, z):
    """the hull's outside half-breadth at height z (the section without the rail's lip)"""
    P = [p for i, p in enumerate(sec(t)) if i != 6]
    if z <= P[0][1]: return 0.0
    for (x0, z0), (x1, z1) in zip(P, P[1:]):
        if z0 <= z <= z1 and z1 > z0: return x0 + (x1 - x0) * (z - z0) / (z1 - z0)
    return P[-1][0]
T_ST = [1 - (1 - k / 44) ** 1.5 for k in range(45)]       # the stations, closer towards the stem

# ---------- the collar: its centre line round the gunwale, offset 3 cm out in plan, its radius ----------
C_OFF = 0.03; C_UP = 0.06; C_EXT = 0.15
def rc_of(t): return 0.20 - 0.04 * max(0.0, (t - 0.55) / 0.45) ** 1.3
def collar_line():
    """the starboard half of the collar's centre line from the transom (t = 0) to the nose: [(x, y, z, r, t)]"""
    ts = [1 - (1 - k / 40) ** 1.8 for k in range(41)]
    P = [(hb(t), ty(t)) for t in ts]
    out = []
    for i, t in enumerate(ts):
        a = P[max(0, i - 1)]; b = P[min(len(P) - 1, i + 1)]; dx, dy = b[0] - a[0], b[1] - a[1]; l = math.hypot(dx, dy)
        nx, ny = dy / l, -dx / l                           # the outward normal in plan (starboard)
        if i == len(ts) - 1: nx, ny = 0.0, 1.0
        out.append((P[i][0] + nx * C_OFF, P[i][1] + ny * C_OFF, zg(t) + C_UP, rc_of(t), t))
    return out
CL = None
def cl_at(y):
    """the collar's centre (x, z) and radius at a station y on the starboard side (interpolated); None forward of the nose"""
    for (x0, y0, z0, r0, _), (x1, y1, z1, r1, _) in zip(CL, CL[1:]):
        if y0 <= y <= y1:
            f = (y - y0) / (y1 - y0) if y1 > y0 else 0.0; return x0 + (x1 - x0) * f, z0 + (z1 - z0) * f, r0 + (r1 - r0) * f
    if y < CL[0][1]: return CL[0][0], CL[0][2], CL[0][3]
    return None

def collar(A):
    """the foam collar: one tube from the starboard stern round the nose to the port stern, its ends rounded, a black rubbing strip
    round its widest part, and the grab line becketed along each side"""
    S = [(x, y, z, r) for x, y, z, r, _ in CL]
    x0, y0, z0, r0 = S[0]; ext = [(x0, y0 - C_EXT * f, z0 + 0.02 * f, r0 - 0.02 * f) for f in (1.0, 0.66, 0.33)]
    half = ext + S
    dome = []
    xa, ya, za, ra = ext[0]
    for a in (25, 45, 62, 76, 86):
        q = math.radians(a); dome.append((xa, ya - ra * 0.75 * math.sin(q), za, max(0.01, ra * math.cos(q))))
    stb = list(reversed(dome)) + half
    path = stb + [(-x, y, z, r) for x, y, z, r in reversed(stb[:-1])]
    atube(A, [(x, y, z) for x, y, z, r in path], lambda i: path[i][3], lambda i: C['coll'], 20)
    # the rubbing strip at the widest part, from transom to transom round the nose
    rs = []
    for i, (x, y, z, r) in enumerate(S):
        a = S[max(0, i - 1)]; b = S[min(len(S) - 1, i + 1)]; dx, dy = b[0] - a[0], b[1] - a[1]; l = math.hypot(dx, dy) or 1
        nx, ny = (dy / l, -dx / l) if i < len(S) - 1 else (0.0, 1.0)
        rs.append((x + nx * (r - 0.010), y + ny * (r - 0.010), z))
    rs = rs + [(-x, y, z) for x, y, z in reversed(rs[:-1])]
    atube(A, rs, 0.022, lambda i: C['rub'], 8)
    # the grab line: beckets every 0.5 m along each side (t 0.06 to 0.80), the line lying slack on the collar between them
    for sx in (1, -1):
        seg = [p for p in CL if 0.06 <= p[4] <= 0.80]
        L = [0.0]
        for a, b in zip(seg, seg[1:]): L.append(L[-1] + math.hypot(b[0] - a[0], b[1] - a[1]))
        n = max(2, int(L[-1] / 0.5)); pts = []
        def at(s):
            for i in range(len(L) - 1):
                if L[i] <= s <= L[i + 1]:
                    f = (s - L[i]) / (L[i + 1] - L[i]); a, b = seg[i], seg[i + 1]
                    p = [a[k] + (b[k] - a[k]) * f for k in range(4)]; dx, dy = b[0] - a[0], b[1] - a[1]; l = math.hypot(dx, dy)
                    return p, (dy / l, -dx / l)
            a, b = seg[-2], seg[-1]; dx, dy = b[0] - a[0], b[1] - a[1]; l = math.hypot(dx, dy); return list(b[:4]), (dy / l, -dx / l)
        def on(s, th, off):
            (x, y, z, r), (nx, ny) = at(s); R = r + off
            return V((sx * (x + nx * R * math.cos(th)), y + ny * R * math.cos(th), z + R * math.sin(th)))
        for k in range(n * 8 + 1):
            s = L[-1] * k / (n * 8); f = (k % 8) / 8.0
            th = math.radians(42 - 22 * math.sin(math.pi * f))
            pts.append(on(s, th, 0.007))
        atube(A, pts, 0.007, lambda i: C['rope'], 5)
        for j in range(n + 1):
            s = L[-1] * j / n; c = on(s, math.radians(42), 0.004); (x, y, z, r), (nx, ny) = at(s)
            e = (c - V((sx * x, y, z))).normalized(); tg = V((-sx * ny, nx, 0)).normalized() if False else V((ny * -sx, nx, 0))
            tg = V((-ny * sx, nx, 0)).normalized() if abs(nx) + abs(ny) > 0 else V((0, 1, 0))
            obox(A, c, tg * 0.022, e.cross(tg).normalized() * 0.016, e * 0.005, C['rub'])

def loa_collar():
    """the boat's length over the collar: from the collar's nose to the end of its after cones"""
    x0, y0, z0, r0, _ = CL[0]; ra = r0 - 0.02
    return CL[-1][1] + CL[-1][3] - (y0 - C_EXT - ra * 0.75 * math.sin(math.radians(86)))

# ---------- the boat ----------
def hull(A):
    O, I, Fl = C['grp'], C['inner'], C['floor']
    rows = []
    for t in T_ST:
        s = sec(t); y = ty(t)
        rows.append([A.v((-x, y, z)) for x, z in reversed(s[1:])] + [A.v((x, y, z)) for x, z in s])
    n = len(rows[0])
    for i in range(len(rows) - 1):
        y = (ty(T_ST[i]) + ty(T_ST[i + 1])) / 2
        for j in range(n - 1):
            q = [rows[i][j], rows[i][j + 1], rows[i + 1][j + 1], rows[i + 1][j]]
            c = sum((v.co for v in q), V()) / 4; A.f(q, O, c - V((0, y, 0.55)))
    # the transom: the section, its top with the motor well (0.56 over the keel, 0.72 wide at the top)
    s0 = sec(0.0); g0 = zg(0.0); b0 = hb(0.0)
    tr = [(-x, z) for x, z in reversed(s0[1:])] + [(x, z) for x, z in s0] + [(0.45, g0), (0.36, 0.56), (-0.36, 0.56), (-0.45, g0)]
    A.poly([(x, Y_TR, z) for x, z in tr], O, (0, -1, 0))
    yi = Y_TR + 0.03; wf0 = x_at(0.0064, ZD) - 0.03; wt = x_at(0.0064, g0 - 0.02) - 0.03
    ti = [(-wf0, ZD), (wf0, ZD), (wt, g0 - 0.02), (0.45, g0 - 0.02), (0.36, 0.56), (-0.36, 0.56), (-0.45, g0 - 0.02), (-wt, g0 - 0.02)]
    A.poly([(x, yi, z) for x, z in ti], I, (0, 1, 0))
    for (xa, za), (xb, zb) in ((( 0.45, g0), (0.36, 0.56)), ((0.36, 0.56), (-0.36, 0.56)), ((-0.36, 0.56), (-0.45, g0))):
        A.poly([(xa, Y_TR, za), (xb, Y_TR, zb), (xb, yi, zb if abs(zb - 0.56) < 1e-6 else zb - 0.02), (xa, yi, za if abs(za - 0.56) < 1e-6 else za - 0.02)], I, (0, 0, 1))
    # the inner sides from the floor (or the locker's top) up under the collar, the floor, the locker's face and top
    tin = [t for t in T_ST if 0.0064 <= t <= 0.999]
    for sx in (1, -1):
        R = []
        for t in tin:
            zb = ZD if t <= T_FD else ZF; ztop = zg(t) - 0.02
            R.append([A.v((sx * max(0.0, x_at(t, zb + (ztop - zb) * k / 4) - 0.03), ty(t), zb + (ztop - zb) * k / 4)) for k in range(5)])
        for i in range(len(R) - 1):
            for k in range(4):
                A.f([R[i][k], R[i + 1][k], R[i + 1][k + 1], R[i][k + 1]], I, (-sx, 0, 0.2))
    fl = [t for t in tin if t <= T_FD] + [T_FD]
    for t0, t1 in zip(fl, fl[1:]):
        w0, w1 = x_at(t0, ZD) - 0.03, x_at(t1, ZD) - 0.03
        A.poly([(-w0, ty(t0), ZD), (w0, ty(t0), ZD), (w1, ty(t1), ZD), (-w1, ty(t1), ZD)], Fl, (0, 0, 1))
    wa, wb = x_at(T_FD, ZD) - 0.03, x_at(T_FD, ZF) - 0.03
    A.poly([(-wa, ty(T_FD), ZD), (wa, ty(T_FD), ZD), (wb, ty(T_FD), ZF), (-wb, ty(T_FD), ZF)], I, (0, -1, 0))
    fd = [T_FD] + [t for t in tin if t > T_FD]
    for t0, t1 in zip(fd, fd[1:]):
        w0, w1 = x_at(t0, ZF) - 0.03, x_at(t1, ZF) - 0.03
        A.poly([(-w0, ty(t0), ZF), (w0, ty(t0), ZF), (w1, ty(t1), ZF), (-w1, ty(t1), ZF)], I, (0, 0, 1))
    # a hatch in the locker's top
    abox(A, -0.20, 0.20, ty(0.86) - 0.18, ty(0.86) + 0.18, ZF, ZF + 0.012, C['inner'])
    abox(A, 0.13, 0.17, ty(0.86) - 0.04, ty(0.86) + 0.04, ZF + 0.012, ZF + 0.022, C['stain'])

YC = -0.55                      # the console's middle
def console(A):
    W, D, St = C['cons'], C['dark'], C['stain']
    z0 = ZD; z1 = ZD + 0.82
    loft_rr(A, [(0.62, 0.56, 0.06, z0, W, YC), (0.62, 0.56, 0.06, z0 + 0.04, W, YC), (0.60, 0.54, 0.06, z0 + 0.56, W, YC), (0.56, 0.46, 0.05, z1 - 0.02, W, YC + 0.04), (0.54, 0.44, 0.05, z1, W, YC + 0.04)])
    # the windscreen on the top's forward edge, leaning aft, in its dark frame
    yf = YC + 0.04 + 0.21; ws = [(-0.26, yf, z1), (0.26, yf, z1), (0.24, yf - 0.10, z1 + 0.27), (-0.24, yf - 0.10, z1 + 0.27)]
    A.poly(ws, C['glass'], (0, 1, 0.35)); A.poly(list(reversed([(x, y - 0.006, z) for x, y, z in ws])), C['glass'], (0, -1, -0.35))
    for a, b in ((ws[0], ws[3]), (ws[1], ws[2]), (ws[3], ws[2])): atube(A, [a, b], 0.009, lambda i: D, 6)
    # the display and the switch panel on the top, the wheel and the throttle aft
    obox(A, (0, YC + 0.07, z1 + 0.004), (0.13, 0, 0), (0, 0.09, 0), (0, 0, 0.006), C['screen'])
    obox(A, (0, YC - 0.12, z1 + 0.004), (0.18, 0, 0), (0, 0.035, 0), (0, 0, 0.005), D)
    wc = V((0, YC - 0.29, ZD + 0.66)); wa = V((0, -0.85, 0.53)).normalized()
    acyl(A, V((0, YC - 0.255, ZD + 0.66 + 0.02)), wc + wa * 0.02, 0.025, D, seg=10)
    atorus2(A, wc, wa, 0.17, 0.014, D, seg=24, rseg=6)
    s_, u_, _ = frame_of(wa)
    for k in range(3):
        a = math.pi / 2 + 2 * math.pi * k / 3; e = s_ * math.cos(a) + u_ * math.sin(a); atube(A, [wc + e * 0.025, wc + e * 0.16], 0.008, lambda i: D, 5)
    obox(A, (0.31, YC - 0.10, ZD + 0.66), (0.012, 0, 0), (0, 0.08, 0), (0, 0, 0.06), D)
    atube(A, [(0.322, YC - 0.10, ZD + 0.68), (0.36, YC - 0.12, ZD + 0.78), (0.37, YC - 0.14, ZD + 0.84)], 0.009, lambda i: St, 6)
    revolve(A, [(0.0, -0.02, D), (0.022, -0.02, D), (0.022, 0.02, D), (0.0, 0.02, D)], (0.372, YC - 0.143, ZD + 0.855), (0.2, -0.3, 1.0), seg=10)
    # the hoop: two raked uprights from the top's sides, a top bar, the all-round light on a short post, the searchlight
    yb, zt = YC - 0.14, ZD + 0.82 + 0.56
    for sx in (-1, 1):
        atube(A, [(sx * 0.25, yb + 0.05, z1 - 0.01), (sx * 0.25, yb + 0.02, z1 + 0.25), (sx * 0.24, yb - 0.02, zt - 0.06), (sx * 0.20, yb - 0.035, zt)], 0.022, lambda i: St, 10)
        revolve(A, [(0.0, 0.0, St), (0.045, 0.0, St), (0.045, 0.008, St), (0.028, 0.012, St), (0.0, 0.012, St)], (sx * 0.25, yb + 0.05, z1), (0, 0, 1), seg=12)
    atube(A, [(-0.20, yb - 0.035, zt), (0.20, yb - 0.035, zt)], 0.022, lambda i: St, 10, caps=False)
    acyl(A, (0, yb - 0.035, zt), (0, yb - 0.035, zt + 0.10), 0.012, St, seg=8)
    revolve(A, [(0.0, 0.0, D), (0.034, 0.0, D), (0.034, 0.012, D), (0.030, 0.014, C['lens']), (0.030, 0.060, C['lens']), (0.034, 0.062, D), (0.034, 0.070, D), (0.0, 0.074, D)], (0, yb - 0.035, zt + 0.10), (0, 0, 1), seg=14)
    sl = V((0.13, yb - 0.035, zt + 0.06))
    acyl(A, (0.13, yb - 0.035, zt + 0.02), sl, 0.010, St, seg=8)
    revolve(A, [(0.0, -0.07, D), (0.050, -0.07, D), (0.058, 0.06, D), (0.058, 0.07, C['lens']), (0.0, 0.072, C['lens'])], sl + V((0, 0, 0.055)), (0, 1, 0), seg=16)
    # the jockey seat aft of the console: a pedestal box, a dark cushion, a grab rail round its back
    ys = YC - 0.55
    loft_rr(A, [(0.42, 0.40, 0.05, ZD, W, ys), (0.40, 0.38, 0.05, ZD + 0.54, W, ys)])
    loft_rr(A, [(0.46, 0.44, 0.07, ZD + 0.54, C['cush'], ys), (0.46, 0.44, 0.08, ZD + 0.60, C['cush'], ys), (0.42, 0.40, 0.08, ZD + 0.635, C['cush'], ys)])
    atube(A, [(-0.22, ys + 0.10, ZD + 0.56), (-0.24, ys - 0.12, ZD + 0.70), (0.0, ys - 0.24, ZD + 0.74), (0.24, ys - 0.12, ZD + 0.70), (0.22, ys + 0.10, ZD + 0.56)], 0.014, lambda i: St, 8)

def outboard(A):
    E, E2, D, St = C['eng'], C['eng2'], C['dark'], C['stain']
    yl = Y_TR - 0.23
    obox(A, (0, Y_TR - 0.01, 0.59), (0.12, 0, 0), (0, 0.085, 0), (0, 0, 0.05), D)              # the clamp bracket over the transom
    acyl(A, (-0.10, Y_TR - 0.10, 0.62), (0.10, Y_TR - 0.10, 0.62), 0.025, D, seg=10)            # the tilt tube
    loft_rr(A, [(0.09, 0.20, 0.04, 0.04, D, yl), (0.10, 0.22, 0.045, 0.30, D, yl), (0.12, 0.24, 0.05, 0.60, D, yl), (0.16, 0.28, 0.06, 0.66, D, yl - 0.01)])
    loft_rr(A, [(0.26, 0.36, 0.05, 0.035, D, yl - 0.05), (0.26, 0.36, 0.05, 0.050, D, yl - 0.05)])        # the cavitation plate
    revolve(A, [(0.0, -0.22, D), (0.030, -0.205, D), (0.050, -0.16, D), (0.056, -0.06, D), (0.056, 0.10, D), (0.046, 0.17, D), (0.024, 0.205, D), (0.0, 0.215, D)], (0, yl - 0.02, -0.07), (0, -1, 0), seg=14)
    A.poly([(0, yl + 0.06, -0.05), (0, yl - 0.14, -0.05), (0, yl - 0.12, -0.26), (0, yl + 0.02, -0.24)], D, (1, 0, 0))
    A.poly([(0.006, yl + 0.06, -0.05), (0.006, yl - 0.14, -0.05), (0.006, yl - 0.12, -0.26), (0.006, yl + 0.02, -0.24)], D, (1, 0, 0))
    A.poly([(-0.006, yl + 0.06, -0.05), (-0.006, yl - 0.14, -0.05), (-0.006, yl - 0.12, -0.26), (-0.006, yl + 0.02, -0.24)], D, (-1, 0, 0))
    hub = V((0, yl - 0.235, -0.07))
    revolve(A, [(0.0, 0.0, St), (0.034, 0.0, St), (0.032, 0.07, St), (0.016, 0.10, St), (0.0, 0.105, St)], hub, (0, -1, 0), seg=12)
    for k in range(3):
        a = 2 * math.pi * k / 3; e = V((math.cos(a), 0, math.sin(a))); f = V((-math.sin(a), 0, math.cos(a)))
        bl = [hub + e * 0.03 + f * -0.035 + V((0, -0.02, 0)), hub + e * 0.15 + f * -0.05 + V((0, -0.035, 0)), hub + e * 0.165 + f * 0.0 + V((0, -0.05, 0)),
              hub + e * 0.14 + f * 0.045 + V((0, -0.06, 0)), hub + e * 0.03 + f * 0.03 + V((0, -0.06, 0))]
        A.poly(bl, St, f.cross(V((0, -1, 0))) * -1); A.poly(list(reversed([p + V((0, 0.004, 0)) for p in bl])), St, f.cross(V((0, -1, 0))))
    # the cowling: a grey lower cowl, the black hood over the powerhead
    yc = Y_TR - 0.22
    loft_rr(A, [(0.30, 0.42, 0.07, 0.64, E2, yc), (0.38, 0.56, 0.10, 0.66, E2, yc), (0.40, 0.60, 0.11, 0.78, E2, yc)])
    loft_rr(A, [(0.40, 0.60, 0.11, 0.78, E, yc), (0.41, 0.62, 0.12, 0.84, E, yc), (0.40, 0.60, 0.13, 0.98, E, yc - 0.01), (0.34, 0.52, 0.12, 1.08, E, yc - 0.02), (0.22, 0.38, 0.09, 1.12, E, yc - 0.02)])

# the lifting eyes and the sling's master link (the boat's frame)
Y_RING, Z_RING = -0.40, 2.35
def lift_points():
    st = [V((sx * 0.50, Y_TR - 0.035, 0.865)) for sx in (1, -1)]
    nose = CL[-1]; q = math.radians(45)
    bw = V((0, nose[1] + nose[3] * math.cos(q) * 0.92, nose[2] + nose[3] * math.sin(q) * 0.92))
    return st + [bw + V((0, 0.0, 0.065))], bw
def eyes(A):
    St = C['stain']; (e1, e2, e3), bw = lift_points()
    for e in (e1, e2):
        obox(A, (e.x, Y_TR - 0.006, 0.74), (0.035, 0, 0), (0, 0.006, 0), (0, 0, 0.07), St)       # the plate on the transom's aft face
        obox(A, (e.x, Y_TR - 0.024, 0.805), (0.008, 0, 0), (0, 0.018, 0), (0, 0, 0.012), St)
        atorus2(A, e + V((0, 0, -0.025)), (1, 0, 0), 0.020, 0.007, St, seg=12, rseg=5)
    # the bow eye: a foot on the collar's nose (on its forward-upper side), a post, the eye
    q = math.radians(45); n = V((0, math.cos(q), math.sin(q)))
    revolve(A, [(0.0, -0.012, St), (0.050, -0.012, St), (0.050, 0.006, St), (0.020, 0.012, St), (0.016, 0.030, St), (0.0, 0.030, St)], bw, n, seg=12)
    acyl(A, bw + n * 0.02, e3 + V((0, 0, -0.035)), 0.012, St, seg=8)
    atorus2(A, e3 + V((0, 0, -0.022)), (1, 0, 0), 0.020, 0.007, St, seg=12, rseg=5)

def boat():
    A = Acc('mob_boat')
    hull(A); collar(A); console(A); outboard(A); eyes(A)
    return A.done(40)

# ---------- the cover: a height field over the cockpit, tucked on the collars' inner tops ----------
TUCK = math.radians(62)
EDGE = None
def edge_line():
    """the cover's edge on the starboard collar, from the transom to where it meets the port edge on the nose: the collar's centre line
    moved inwards in plan by (r + 6 mm) cos 62 degrees and up by (r + 6 mm) sin 62 (on the collar's inner shoulder), [(x, y, z)]"""
    out = []
    for i, (x, y, z, r, t) in enumerate(CL):
        a = CL[max(0, i - 1)]; b = CL[min(len(CL) - 1, i + 1)]; dx, dy = b[0] - a[0], b[1] - a[1]; l = math.hypot(dx, dy)
        nx, ny = (-dy / l, dx / l) if i < len(CL) - 1 else (0.0, -1.0)          # inwards in plan
        k = (r + 0.006) * math.cos(TUCK); out.append((x + nx * k, y + ny * k, z + (r + 0.006) * math.sin(TUCK)))
    # up to where it crosses the middle line, sorted along y
    res = []
    for p, q in zip(out, out[1:]):
        res.append(p)
        if q[0] <= 0.0:
            f = p[0] / (p[0] - q[0]); res.append((0.0, p[1] + (q[1] - p[1]) * f, p[2] + (q[2] - p[2]) * f)); break
    return res
def edge_at(y):
    """the cover's edge at a station: its half-width and height; None forward of the tip"""
    for (x0, y0, z0), (x1, y1, z1) in zip(EDGE, EDGE[1:]):
        if y0 <= y <= y1:
            f = (y - y0) / (y1 - y0) if y1 > y0 else 0.0; return x0 + (x1 - x0) * f, z0 + (z1 - z0) * f
    if y < EDGE[0][1]: return EDGE[0][0], EDGE[0][2]
    return None
def supports(B, cell=0.02):
    """what the cover rests on, read off the boat itself: the highest point of the boat in each 2 cm square inside the cover's edge
    that stands higher than the flat cover (the hoop, its lights, the windscreen, the console, the seat's rail)"""
    cells = {}; me = B.data; me.calc_loop_triangles(); vs = [v.co.copy() for v in me.vertices]
    def put(p):
        x, y, z = p
        if y < TY0 - 0.02: return
        e = edge_at(y)
        if e is None or abs(x) > e[0] - 0.02 or z < e[1] + 0.02: return
        k = (round(x / cell), round(y / cell))
        if k not in cells or z > cells[k][2]: cells[k] = (x, y, z)
    for t in me.loop_triangles:          # points over each triangle, at most a cell apart (a long face has no corner in its middle)
        a, b, c = (vs[i] for i in t.vertices)
        if max(a.z, b.z, c.z) < 0.9: continue
        n = max(1, int(math.ceil(max((a - b).length, (b - c).length, (c - a).length) / cell)))
        for i in range(n + 1):
            for j in range(n + 1 - i): put(a + (b - a) * (i / n) + (c - a) * (j / n))
    return list(cells.values())
SUP = None
ENDS = None
def row_hull(y):
    """the cover across a station, pulled taut: the upper hull of the two edges and of what it rests on (each support at the height its
    ridge has at this station: straight along the boat from the support to the cover's ends); with the flat cover's crown under it"""
    xe, ze = edge_at(y); (ya, za), (yf, zf) = ENDS; P = [(-xe, ze), (xe, ze)]
    for px, py, pz in SUP:
        top = pz + 0.040
        f = (y - py) / max(1e-6, yf - py) if y >= py else (py - y) / max(1e-6, py - ya)
        zr = top + ((zf if y >= py else za) - top) * min(1.0, f)
        if zr > ze and abs(px) < xe: P.append((px, zr))
    P.sort(); H = []
    for p in P:
        while len(H) >= 2 and (H[-1][0] - H[-2][0]) * (p[1] - H[-2][1]) - (H[-1][1] - H[-2][1]) * (p[0] - H[-2][0]) >= 0: H.pop()
        H.append(p)
    def z(x):
        u = min(1.0, abs(x) / max(xe, 1e-6)); base = ze + 0.012 * (1 - u * u)
        for (x0, z0), (x1, z1) in zip(H, H[1:]):
            if x0 <= x <= x1: return max(base, z0 + (z1 - z0) * (x - x0) / max(1e-9, x1 - x0))
        return base
    return xe, z
def tarp_z(x, y):
    """the cover's height at (x, y) (row_hull at that station)"""
    if edge_at(y) is None: return None
    return row_hull(y)[1](x)
def front_y():
    """the cover's front row: where its two edges come within 25 mm of the middle on the nose"""
    for y in [EDGE[-1][1] - 0.001 * k for k in range(600)]:
        e = edge_at(y)
        if e and e[0] > 0.025: return y
def set_ends():
    """the cover's two ends along the boat (its after row and its front row): where the ridges from what it rests on run to"""
    global ENDS
    ENDS = ((TY0, edge_at(TY0)[1]), (front_y(), edge_at(front_y())[1]))
TY0 = Y_TR + 0.32                   # the cover's after edge (its curtain): forward of where the stern legs of the sling rise through its level
def tarp_rows():
    yn = front_y(); y0, y1 = YC - 0.80, YC + 0.40          # the rows 3 cm apart over the console, the hoop and the seat, 10 cm elsewhere
    ys = sorted(set([round(TY0 + (y0 - TY0) * k / 7, 4) for k in range(8)] + [round(y0 + (y1 - y0) * k / 40, 4) for k in range(41)] +
                    [round(y1 + (yn - y1) * k / 26, 4) for k in range(27)]))
    rows = []
    for y in ys:
        xe, z = row_hull(y)
        rows.append([(xe * (-1 + 2 * j / 30), y, z(xe * (-1 + 2 * j / 30))) for j in range(31)])
    return rows
def tarp():
    """one layer (the game draws both sides of a face, and the cover's underside is never seen), its curtain, its hem"""
    A = Acc('mob_tarp'); T, Hm = C['tarp'], C['hem']
    R = tarp_rows(); top = [[A.v(p) for p in r] for r in R]
    for i in range(len(R) - 1):
        for j in range(len(R[0]) - 1):
            A.f([top[i][j], top[i][j + 1], top[i + 1][j + 1], top[i + 1][j]], T, (0, 0, 1))
    # the curtain at its after edge: from the after row down to 0.70 over the keel, kept 8 mm inside the collars' inner sides
    xc, zc, rr = cl_at(TY0); xe0 = R[0][-1][0]
    def half(z):
        d = z - zc; inner = xc - math.sqrt(max(0.0, rr * rr - d * d)) if abs(d) < rr else xc
        return min(xe0, inner - 0.008)
    CR = []
    for f in [(1 - math.cos(math.pi * k / 12)) / 2 for k in range(13)]:
        row = []
        for p in R[0]:
            z = p[2] + (0.70 - p[2]) * f; u = p[0] / xe0; row.append((u * half(z), TY0, z))
        CR.append(row)
    CA = [top[0]] + [[A.v(q) for q in r] for r in CR[1:]]
    for i in range(len(CA) - 1):
        for j in range(len(R[0]) - 1):
            A.f([CA[i][j], CA[i][j + 1], CA[i + 1][j + 1], CA[i + 1][j]], T, (0, -1, 0))
    # the hem round the edge (sides and front), a little proud, and along the curtain's foot
    for sx in (1, -1):
        nrm = V((-math.cos(TUCK), 0, math.sin(TUCK)))
        pts = [V((sx * (r[-1][0] + nrm.x * 0.006), r[-1][1], r[-1][2] + nrm.z * 0.006)) for r in R]
        atube(A, pts, 0.007, lambda i: Hm, 6)
    atube(A, [V((q[0], TY0 - 0.006, q[2] + 0.004)) for q in CR[-1]], 0.006, lambda i: Hm, 6)
    return A.done(40)

# ---------- the sling ----------
def sling():
    A = Acc('mob_sling'); W, Gv = C['wire'], C['galv']
    ring = [V((0, Y_RING + 0.040 * math.sin(2 * math.pi * k / 20), Z_RING + 0.070 * math.cos(2 * math.pi * k / 20))) for k in range(20)]
    atube(A, ring, 0.012, lambda i: Gv, 8, closed=True)
    (e1, e2, e3), _ = lift_points(); bot = V((0, Y_RING, Z_RING - 0.082))
    for e in (e1, e2, e3):
        d = (bot - e).normalized(); top = e + V((0, 0, 0.030))
        # the shackle on the eye (its pin across the leg), the thimble at each end, the wire between
        atorus2(A, e + V((0, 0, 0.004)), (0, 1, 0), 0.024, 0.006, Gv, seg=12, rseg=5)
        atube(A, [top + d * 0.01, bot - d * 0.03], 0.0075, lambda i: W, 6)
        for p in (top + d * 0.02, bot - d * 0.045):
            acyl(A, p - d * 0.025, p + d * 0.025, 0.013, Gv, seg=8)
    return A.done(40)

# ---------- the cradle and the lashings (the cradle's frame: origin at the middle of its base on deck) ----------
HK = 0.45                        # the keel's bottom over the deck in the cradle
YS = (-1.10, 1.10)               # the saddles
XB = 1.20                        # the base beams' half-length
def vugge():
    A = Acc('mob_vugge'); S, Rb = C['steel'], C['rubber']
    for ys in YS:
        t = (ys - Y_TR) / LB; tn = math.tan(dr(t)); bc = 0.74 * hb(t)
        tw = [(ys + dy - Y_TR) / LB for dy in (-0.08, -0.04, 0.0, 0.04, 0.08)]
        k = min(zk(q) for q in tw) + HK
        bot = lambda x: min(zk(q) + x * math.tan(dr(q)) for q in tw) + HK          # the lowest bottom under the pad's width
        abox(A, -XB, XB, ys - 0.06, ys + 0.06, 0.0, 0.10, S)
        for sx in (-1, 1):
            abox(A, sx * XB - 0.07, sx * XB + 0.07, ys - 0.11, ys + 0.11, 0.0, 0.012, S)
            for by in (-1, 1): hexnut(A, (sx * (XB - 0.035), ys + by * 0.075, 0.012), (0, 0, 1), 0.012, 0.008, S)
            # the pad eye for the lashing at the beam's end
            abox(A, sx * (XB - 0.10) - 0.02, sx * (XB - 0.10) + 0.02, ys - 0.006, ys + 0.006, 0.10, 0.15, S)
            atorus2(A, (sx * (XB - 0.10), ys, 0.15), (0, 1, 0), 0.020, 0.007, S, seg=12, rseg=5)
        # the keel post and its rubber block, 3 mm under the keel
        abox(A, -0.05, 0.05, ys - 0.05, ys + 0.05, 0.10, k - 0.023, S); abox(A, -0.045, 0.045, ys - 0.07, ys + 0.07, k - 0.023, k - 0.003, Rb)
        # the pads under the bottom from 0.12 to 0.50 out (or to the chine), on two posts each side
        for sx in (-1, 1):
            x0, x1 = 0.12, min(0.50, bc - 0.03); tq = (bot(x1) - bot(x0)) / (x1 - x0); nn = V((-sx * math.sin(math.atan(tq)), 0, math.cos(math.atan(tq))))
            P = lambda x, off: V((sx * x, 0, bot(x0) + (x - x0) * tq)) + nn * off
            for (o0, o1, m, w) in ((-0.003 - 0.015, -0.003, Rb, 0.13), (-0.003 - 0.015 - 0.010, -0.003 - 0.015, S, 0.15)):
                q = [P(x0, o0), P(x1, o0), P(x1, o1), P(x0, o1)]
                for i_, (a, b) in enumerate(((0, 1), (1, 2), (2, 3), (3, 0))):
                    A.poly([q[a] + V((0, ys - w / 2, 0)), q[b] + V((0, ys - w / 2, 0)), q[b] + V((0, ys + w / 2, 0)), q[a] + V((0, ys + w / 2, 0))], m,
                           ((q[a] + q[b]) / 2 - (q[0] + q[2]) / 2))
                A.poly([p + V((0, ys - w / 2, 0)) for p in q], m, (0, -1, 0)); A.poly([p + V((0, ys + w / 2, 0)) for p in q], m, (0, 1, 0))
            for x in (x0 + 0.05, x1 - 0.05):
                top = P(x, -0.028); abox(A, sx * x - 0.03, sx * x + 0.03, ys - 0.04, ys + 0.04, 0.10, top.z - 0.004, S)
    for sx in (-1, 1):
        abox(A, sx * 0.40 - 0.04, sx * 0.40 + 0.04, YS[0] + 0.06, YS[1] - 0.06, 0.0, 0.08, S)
    return A.done(40)

def lash(B, T):
    """B, T: the boat and the cover as built (their meshes are what the straps lie over)"""
    from mathutils.bvhtree import BVHTree
    A = Acc('mob_lash'); Wb, S = C['web'], C['stain']
    trees = []
    for o in (B, T):
        me = o.data; me.calc_loop_triangles(); trees.append(BVHTree.FromPolygons([v.co.copy() for v in me.vertices], [tuple(t.vertices) for t in me.loop_triangles]))
    def down(x, y):
        """the highest point of the boat or the cover straight under (x, y), in the boat's frame"""
        z = -9.0
        for tr in trees:
            hit = tr.ray_cast(V((x, y, 4.0)), V((0, 0, -1)))
            if hit[0] is not None: z = max(z, hit[0].z)
        return z
    for ys in YS:
        yb = ys + 0.0; xc, zc, r = cl_at(yb)
        sl = abs(cl_at(yb + 0.03)[0] - cl_at(yb - 0.03)[0]) / 0.06               # the collar's slope in plan here
        Rs = r * math.sqrt(1 + sl * sl) + sl * 0.025 + 0.022; zcH = zc + HK      # clear of the rubbing strip and the grab line (out to r + 14 mm)
        E = {s: V((s * (XB - 0.10), yb, 0.17 + 0.020)) for s in (1, -1)}
        Tp = {}
        for s in (1, -1):
            ty_, tz_, ang = tangent_pt((s * E[s].x, E[s].z), (xc, zcH), Rs, 1)
            Tp[s] = V((s * ty_, yb, tz_))
        # round each collar on an arc of radius Rs from the tangent point up to its top, then across: the highest of that arc and
        # what lies under the strap's width (the collar's top, the cover's hem, the cover), 15 mm over it
        def arc(s):
            a0 = math.atan2(Tp[s].z - zcH, s * Tp[s].x - xc); a1 = math.pi / 2
            return [V((s * (xc + Rs * math.cos(a0 + (a1 - a0) * k / 12)), yb, zcH + Rs * math.sin(a0 + (a1 - a0) * k / 12))) for k in range(12)]
        A1, A2 = arc(1), arc(-1)
        def over(x):
            z = -9.0
            for sc in (1, -1):
                d = abs(x - sc * xc)
                if d < Rs: z = max(z, zcH + math.sqrt(Rs * Rs - d * d))
            return max(z, max(down(x, yb + dy) for dy in (-0.026, -0.013, 0.0, 0.013, 0.026)) + HK + 0.015)
        top = [V((x, yb, over(x))) for x in [xc - 2 * xc * k / 120 for k in range(121)]]
        path = [E[1] + (Tp[1] - E[1]) * 0.15] + A1 + top + list(reversed(A2)) + [E[-1] + (Tp[-1] - E[-1]) * 0.45]
        aribbon(A, path, (0, 1, 0), 0.050, 0.003, lambda i: Wb)
        # the starboard end on its pad eye (a sewn loop), the port end: a turnbuckle and a slip hook on the pad eye
        a = E[1]; d = (Tp[1] - E[1]).normalized(); w0 = V((a.x, yb, 0.17))
        atorus2(A, w0, (1, 0, 0), 0.015, 0.0035, Wb, seg=12, rseg=4)                # the sewn loop round the pad eye's top wire
        aribbon(A, [w0 + V((0, 0, 0.019)), E[1] + (Tp[1] - E[1]) * 0.15], (0, 1, 0), 0.030, 0.003, lambda i: Wb)
        a = E[-1]; d = (Tp[-1] - E[-1]).normalized(); q = E[-1] + (Tp[-1] - E[-1]) * 0.45; w0 = V((a.x, yb, 0.17))
        atorus2(A, w0, (1, 0, 0), 0.015, 0.0035, S, seg=12, rseg=4)                 # the turnbuckle's hook round the pad eye's top wire
        acyl(A, a + d * 0.03, a + d * 0.07, 0.006, S, seg=8)
        for so in (-1, 1): acyl(A, a + d * 0.07 + V((0, so * 0.009, 0)), a + d * 0.15 + V((0, so * 0.009, 0)), 0.004, S, seg=6)
        hexnut(A, a + d * 0.065, d, 0.012, 0.012, S); hexnut(A, a + d * 0.150, d, 0.012, 0.012, S)
        acyl(A, a + d * 0.16, q - d * 0.03, 0.006, S, seg=8)
        beam(A, q - d * 0.04, q + d * 0.02, 0.054, 0.010, S, up=V((0, 1, 0)).cross(d).normalized())
    return A.done(40)

# ---------- the davit (its frame: origin at the middle of its base on deck; stowed, the arm points towards -x) ----------
DX = 1.75                                     # the davit's axis from the boat's centre line (outboard, +x)
HOOK_BOWL = 0.33                              # the hook's bowl (its wire's centre) under the hook block's top
FALL0 = 0.30                                  # the fall's length, stowed
def stowed():
    """where the hook block's top and the fall's start at the sheave are, stowed (davit frame)"""
    ring_in = Z_RING + 0.070 - 0.012 + HK           # the master link's inside top over the deck
    hook_top = ring_in - 0.012 - 0.002 + HOOK_BOWL
    return V((-DX, 0.0, hook_top)), V((-DX, 0.0, hook_top + FALL0))
SHEAVE_R = 0.11
def davit():
    A = Acc('mob_davit'); W, S = C['white'], C['stain']
    pl = rrect(0.0, 0.0, 0.70, 0.70, 0.04, 3)
    vb = [A.v((x, y, 0.0)) for x, y in pl]; vt = [A.v((x, y, 0.030)) for x, y in pl]; n = len(pl)
    A.f(vt, W, (0, 0, 1))
    for k in range(n):
        k1 = (k + 1) % n; A.f([vb[k], vb[k1], vt[k1], vt[k]], W, V((pl[k][0], pl[k][1], 0)))
    for k in range(8):
        a = math.pi / 8 + k * math.pi / 4; hexnut(A, (0.30 * math.cos(a) / max(abs(math.cos(a)), abs(math.sin(a))) * 0.95, 0.30 * math.sin(a) / max(abs(math.cos(a)), abs(math.sin(a))) * 0.95, 0.030), (0, 0, 1), 0.018, 0.014, S)
    revolve(A, [(0.25, 0.030, W), (0.25, 0.060, W), (0.20, 0.26, W), (0.19, 0.30, W), (0.19, 1.43, W), (0.205, 1.44, W), (0.205, 1.446, W), (0.0, 1.446, W)], seg=32)
    for k in range(4):
        a = k * math.pi / 2 + math.pi / 4; e = V((math.cos(a), math.sin(a), 0)); s = V((-e.y, e.x, 0))
        A.poly([e * 0.22 + V((0, 0, 0.03)) + s * 0.006, e * 0.33 + V((0, 0, 0.03)) + s * 0.006, e * 0.20 + V((0, 0, 0.40)) + s * 0.006], W, s)
        A.poly([e * 0.22 + V((0, 0, 0.03)) - s * 0.006, e * 0.33 + V((0, 0, 0.03)) - s * 0.006, e * 0.20 + V((0, 0, 0.40)) - s * 0.006], W, -s)
        A.poly([e * 0.33 + V((0, 0, 0.03)) + s * 0.006, e * 0.33 + V((0, 0, 0.03)) - s * 0.006, e * 0.20 + V((0, 0, 0.40)) - s * 0.006, e * 0.20 + V((0, 0, 0.40)) + s * 0.006], W, e + V((0, 0, 0.3)))
    return A.done(40)
def arm_geom():
    hook_top, head = stowed()
    sc = V((-DX + SHEAVE_R, 0.0, head.z))                      # the sheave's centre (the fall leaves it on its inboard side)
    root = V((-0.12, 0.0, 1.86))
    return root, sc, head, hook_top
def arm():
    A = Acc('mob_arm'); W, S, D, Gr = C['white'], C['stain'], C['dark'], C['grey']
    root, sc, head, _ = arm_geom()
    # the slewing ring and the head on it
    revolve(A, [(0.0, 1.45, D), (0.235, 1.45, D), (0.235, 1.49, D), (0.24, 1.49, W), (0.24, 1.62, W), (0.0, 1.62, W)], seg=32)
    loft_rr(A, [(0.42, 0.30, 0.06, 1.62, W, 0.0), (0.42, 0.30, 0.06, 1.80, W, 0.0), (0.30, 0.26, 0.05, 1.95, W, 0.0)])
    for sy in (-1, 1):            # the arm's pin lugs
        A.poly([(-0.22, sy * 0.118, 1.80), (-0.02, sy * 0.118, 1.80), (-0.06, sy * 0.118, 1.95), (-0.18, sy * 0.118, 1.95)], W, (0, sy, 0))
    acyl(A, (root.x, -0.13, root.z), (root.x, 0.13, root.z), 0.035, S, seg=12)
    # the arm: a tapered box from the root to the head, two cheek plates round the sheave at its tip
    d = (sc - root).normalized(); up = V((0, 1, 0)).cross(d).normalized()
    if up.z < 0: up = -up
    L = (sc - root).length
    def box_at(f, w, h): return root + d * (L * f)
    secs = [(0.0, 0.18, 0.24), (0.10, 0.18, 0.24), (0.85, 0.14, 0.18), (1.0, 0.13, 0.16)]
    rings = []
    for f, w, h in secs:
        c = root + d * (L * f) + up * 0.0
        rings.append([A.v(c + V((0, sy * w / 2, 0)) + up * (sz * h / 2)) for sy, sz in ((-1, -1), (1, -1), (1, 1), (-1, 1))])
    for i in range(len(rings) - 1):
        for k in range(4):
            k1 = (k + 1) % 4; q = [rings[i][k], rings[i][k1], rings[i + 1][k1], rings[i + 1][k]]
            A.f(q, W, sum((v.co for v in q), V()) / 4 - (root + d * (L * (secs[i][0] + secs[i + 1][0]) / 2)))
    A.f(list(rings[0]), W, -d)
    for sy in (-1, 1):
        cp = [sc + d * 0.06 + up * 0.10, sc - d * 0.12 + up * 0.10, sc - d * 0.16 + up * -0.06, sc + d * 0.0 + up * -0.15, sc + d * 0.10 + up * -0.06]
        A.poly([p + V((0, sy * 0.045, 0)) for p in cp], W, (0, sy, 0)); A.poly([p + V((0, sy * 0.035, 0)) for p in cp], W, (0, -sy, 0))
    revolve(A, [(0.0, -0.028, Gr), (SHEAVE_R + 0.01, -0.028, Gr), (SHEAVE_R + 0.01, -0.020, Gr), (SHEAVE_R - 0.012, -0.010, Gr), (SHEAVE_R - 0.012, 0.010, Gr),
                (SHEAVE_R + 0.01, 0.020, Gr), (SHEAVE_R + 0.01, 0.028, Gr), (0.0, 0.028, Gr)], sc, (0, 1, 0), seg=24)
    acyl(A, sc + V((0, -0.06, 0)), sc + V((0, 0.06, 0)), 0.018, S, seg=10)
    # the luffing cylinder: from a lug low on the head's inboard side to a lug under the arm
    p0 = V((-0.24, 0.0, 1.66)); p1 = root + d * (L * 0.40) - up * 0.12
    for sy in (-1, 1):
        A.poly([(-0.20, sy * 0.06, 1.62), (-0.30, sy * 0.06, 1.62), (-0.28, sy * 0.06, 1.72), (-0.22, sy * 0.06, 1.72)], W, (0, sy, 0))
        q = root + d * (L * 0.40); A.poly([q - d * 0.06 + V((0, sy * 0.05, 0)) - up * 0.11, q + d * 0.06 + V((0, sy * 0.05, 0)) - up * 0.11, q + d * 0.05 + V((0, sy * 0.05, 0)) - up * 0.15, q - d * 0.05 + V((0, sy * 0.05, 0)) - up * 0.15], W, (0, sy, 0))
    cd = (p1 - p0).normalized(); cl = (p1 - p0).length
    acyl(A, p0 - cd * 0.04, p0 + cd * (cl * 0.62), 0.055, W, seg=14)
    acyl(A, p0 + cd * (cl * 0.62), p1 + cd * 0.03, 0.030, C['chrome'], seg=12)
    for p in (p0, p1): acyl(A, p + V((0, -0.07, 0)), p + V((0, 0.07, 0)), 0.025, S, seg=10)
    # the winch on the outboard side of the head: the drum with its wire, the motor, the gearbox, the hand crank's socket
    dc = V((0.27, 0.0, 1.80))
    for sy in (-1, 1): revolve(A, [(0.0, -0.006, Gr), (0.15, -0.006, Gr), (0.15, 0.006, Gr), (0.0, 0.006, Gr)], dc + V((0, sy * 0.13, 0)), (0, 1, 0), seg=24)
    revolve(A, [(0.0, -0.125, C['wire']), (0.105, -0.125, C['wire']), (0.105, 0.125, C['wire']), (0.0, 0.125, C['wire'])], dc, (0, 1, 0), seg=24)
    for k in range(12):
        atorus2(A, dc + V((0, -0.115 + 0.021 * k, 0)), (0, 1, 0), 0.108, 0.006, C['wire'], seg=20, rseg=4)
    revolve(A, [(0.0, 0.0, D), (0.095, 0.0, D), (0.095, 0.26, D), (0.07, 0.29, D), (0.0, 0.29, D)], dc + V((0, -0.136, 0)), (0, -1, 0), seg=18)
    obox(A, dc + V((0, 0.19, 0)), (0.10, 0, 0), (0, 0.05, 0), (0, 0, 0.12), D)
    acyl(A, dc + V((0, 0.24, 0.03)), dc + V((0, 0.29, 0.03)), 0.022, S, seg=8)
    obox(A, (0.18, 0.0, 1.66), (0.06, 0, 0), (0, 0.15, 0), (0, 0, 0.04), W)
    # the wire: off the drum's top, over a lead roller at the arm's root, along the arm's top to over the sheave
    wt = dc + V((0, 0, 0.115)); lead = root + up * 0.15 + d * 0.06
    tip = sc + up * (SHEAVE_R - 0.004)
    atube(A, [wt, lead, tip], 0.008, lambda i: C['wire'], 6)
    acyl(A, lead - up * 0.035 + V((0, -0.05, 0)), lead - up * 0.035 + V((0, 0.05, 0)), 0.03, Gr, seg=12)
    for sy in (-1, 1): obox(A, lead - up * 0.06 + V((0, sy * 0.056, 0)), d * 0.03, V((0, 0.005, 0)), up * 0.05, W)
    # round the sheave's far side, down to where the fall leaves it
    arc = [sc + (up * math.cos(a) - d * math.sin(a)) * (SHEAVE_R - 0.004) for a in [math.radians(x) for x in range(0, 91, 15)]]
    atube(A, arc + [V((head.x, 0.0, head.z - 0.01))], 0.008, lambda i: C['wire'], 6)
    return A.done(40)
def hook():
    """the hook block from its top (the fall's end): a swivel eye, the release hook's body with its lever, the hook"""
    A = Acc('mob_hook'); H, S, D = C['hook'], C['stain'], C['dark']
    atorus2(A, (0, 0, -0.025), (0, 1, 0), 0.020, 0.008, S, seg=12, rseg=5)
    acyl(A, (0, 0, -0.045), (0, 0, -0.075), 0.022, S, seg=12)
    loft_rr(A, [(0.07, 0.06, 0.012, -0.21, H), (0.08, 0.065, 0.014, -0.15, H), (0.08, 0.065, 0.014, -0.09, H), (0.06, 0.05, 0.012, -0.075, H)])
    obox(A, (0.046, 0, -0.13), (0.006, 0, 0), (0, 0.012, 0), (0, 0, 0.045), D)
    acyl(A, (0.046, 0, -0.09), (0.046, 0, -0.06), 0.006, D, seg=6)
    # the hook: down from the body, round under (its bowl at HOOK_BOWL), up to the tip, the safety latch across its mouth
    c = V((0, 0, -HOOK_BOWL + 0.030)); pts = [V((0.030, 0, -0.205)), V((0.032, 0, -0.25)), V((0.030, 0, -HOOK_BOWL + 0.030))]
    pts += [c + V((0.030 * math.cos(a), 0, -0.030 * math.sin(a))) for a in [math.radians(x) for x in range(15, 181, 15)]]
    pts += [V((-0.030, 0, -0.27)), V((-0.026, 0, -0.255))]
    atube(A, pts, lambda i: 0.012 if i < len(pts) - 2 else 0.009, lambda i: S, 8)
    atube(A, [(-0.024, 0, -0.252), (0.022, 0, -0.215)], 0.003, lambda i: S, 5)
    return A.done(40)
def fall():
    A = Acc('mob_fall'); acyl(A, (0, 0, 0), (0, -1, 0), 0.008, C['wire'], seg=6, caps=(False, False)); return A.done(60)

# ---------- the clash check: the parts as they stand stowed, triangle pairs that cross between two of them (0 is right) ----------
def clash(objs):
    from mathutils.bvhtree import BVHTree
    hook_top, head = stowed()
    at = {'mob_boat': (0, 0, HK), 'mob_tarp': (0, 0, HK), 'mob_sling': (0, 0, HK), 'mob_vugge': (0, 0, 0), 'mob_lash': (0, 0, 0),
          'mob_davit': (DX, Y_RING, 0), 'mob_arm': (DX, Y_RING, 0), 'mob_hook': (DX + hook_top.x, Y_RING, hook_top.z)}
    T = {}
    for nm, loc in at.items():
        me = objs[nm].data; vs = [v.co + V(loc) for v in me.vertices]; me.calc_loop_triangles()
        T[nm] = BVHTree.FromPolygons(vs, [tuple(t.vertices) for t in me.loop_triangles])
    pairs = [('mob_boat', 'mob_vugge'), ('mob_boat', 'mob_tarp'), ('mob_boat', 'mob_sling'), ('mob_boat', 'mob_lash'), ('mob_tarp', 'mob_sling'),
             ('mob_tarp', 'mob_lash'), ('mob_vugge', 'mob_lash'), ('mob_sling', 'mob_lash'), ('mob_davit', 'mob_arm'), ('mob_arm', 'mob_boat'),
             ('mob_arm', 'mob_tarp'), ('mob_arm', 'mob_sling'), ('mob_davit', 'mob_boat'), ('mob_davit', 'mob_vugge'), ('mob_hook', 'mob_sling'),
             ('mob_hook', 'mob_arm'), ('mob_hook', 'mob_tarp')]
    res = {'%s/%s' % (a[4:], b[4:]): len(T[a].overlap(T[b])) for a, b in pairs}
    print('CLASH (crossing triangle pairs, stowed; 0 is right):', res, '-> all 0' if not any(res.values()) else '-> NOT 0')
    return res

# ---------- the export ----------
def size(o):
    P = [to_game(o.matrix_world @ v.co) for v in o.data.vertices]
    lo = [min(p[k] for p in P) for k in range(3)]; hi = [max(p[k] for p in P) for k in range(3)]
    return lo, hi
def main():
    global CL, SUP
    os.makedirs(OUT, exist_ok=True)
    reset(); colours()
    global EDGE
    CL = collar_line(); EDGE = edge_line(); B = boat(); SUP = supports(B); set_ends()
    T = tarp()
    objs = {'mob_boat': B, 'mob_tarp': T, 'mob_sling': sling(), 'mob_vugge': vugge(), 'mob_lash': lash(B, T),
            'mob_davit': davit(), 'mob_arm': arm(), 'mob_hook': hook(), 'mob_fall': fall()}
    hook_top, head = stowed()
    clash(objs)
    # the occlusion, each part with what shades it where it stands (the boat on the cradle under its cover, the davit's two parts)
    setup_render(64, 64, samples=8)
    def place(stowed_):
        for nm in ('mob_boat', 'mob_tarp', 'mob_sling'): objs[nm].location = (0, 0, HK) if stowed_ else (0, 0, 0)
        for nm in ('mob_davit', 'mob_arm'): objs[nm].location = (DX, Y_RING, 0) if stowed_ else (0, 0, 0)
        objs['mob_hook'].location = (DX + hook_top.x, Y_RING, hook_top.z) if stowed_ else (0, 0, 0)
        bpy.context.view_layer.update()
    def bake(o, others, samples, dist):
        for p in bpy.context.scene.objects:
            if p.type == 'MESH': p.hide_render = not (p is o or p in others)
        bake_ao(o, samples=samples, distance=dist)
    place(True)
    dry = 'dry' in sys.argv
    if dry: bake = lambda o, others, samples, dist: None        # (dry: no occlusion, nothing written to src/data)
    bake(objs['mob_boat'], [], 24, 0.25)
    bake(objs['mob_tarp'], [objs['mob_boat'], objs['mob_lash']], 16, 0.20)
    bake(objs['mob_vugge'], [objs['mob_boat']], 24, 0.20)
    bake(objs['mob_lash'], [objs['mob_boat'], objs['mob_tarp']], 16, 0.10)
    bake(objs['mob_sling'], [], 8, 0.05)
    bake(objs['mob_davit'], [objs['mob_arm']], 24, 0.20)
    bake(objs['mob_arm'], [objs['mob_davit']], 24, 0.15)
    bake(objs['mob_hook'], [], 16, 0.04)
    for p in bpy.context.scene.objects:
        if p.type == 'MESH': p.hide_render = False
    place(False)
    parts = [(nm, mesh_arrays(o, to_game, to_game_n, ao=nm != 'mob_fall'), 1.0) for nm, o in objs.items()]
    sz = {nm: size(o) for nm, o in objs.items()}; r4 = lambda v: round(v, 4)
    (e1, e2, e3), _ = lift_points()
    ex = {'frame': 'kystfiske rescue boat, davit and cradle: metres, x right (outboard), y up, z aft; mob_boat, mob_tarp and mob_sling from the keel\'s bottom at the '
                   'middle of the hull (the bow towards -z); mob_vugge and mob_lash from the middle of the cradle\'s base on deck; mob_davit and mob_arm from the middle of '
                   'the davit\'s base on deck (mob_arm slews about y through it; stowed it points towards -x); mob_hook from its top; mob_fall one unit along +z',
          'boat_at': G(V((0, 0, HK))), 'davit_at': G(V((DX, Y_RING, 0))), 'slew': [0.0, 0.0, 0.0],
          'head_at': G(head), 'hook_at': G(hook_top), 'ring': G(V((0, Y_RING, Z_RING + 0.082))), 'lift': [G(e) for e in (e1, e2, e3)],
          'reach': r4(DX), 'loa': r4(loa_collar()), 'loa_motor': r4(sz['mob_boat'][1][2] - sz['mob_boat'][0][2]), 'beam': r4(sz['mob_boat'][1][0] - sz['mob_boat'][0][0]),
          'lsa': {'len': [3.8, 8.5], 'seated': 5, 'stretcher': 1, 'kn': 6, 'h': 4, 'lower': '0.4 + 0.02 H m/s'},
          'size': {nm: [r4(hi[k] - lo[k]) for k in range(3)] for nm, (lo, hi) in sz.items()}}
    glb = os.path.join(OUT, 'deck-mob.glb'); nb = write_glb(glb, parts, ex)
    if not dry: open(os.path.join(ROOT, 'src', 'data', 'deck-mob.b64'), 'w').write(base64.b64encode(open(glb, 'rb').read()).decode())
    print('deck mob GLB %.1f KB' % (nb / 1024))
    tot = 0
    for nm, Ar, _ in parts:
        lo, hi = sz[nm]; tot += len(Ar['idx']) // 3
        print('  %-10s %6d tris %6d verts  x %.3f..%.3f  y %.3f..%.3f  z %.3f..%.3f' % (nm, len(Ar['idx']) // 3, len(Ar['pos']), lo[0], hi[0], lo[1], hi[1], lo[2], hi[2]))
    print('  all %d tris; loa %.3f (over the collar; %.3f with the motor) beam %.3f; boat_at %s davit_at %s head_at %s hook_at %s ring %s' % (tot, ex['loa'], ex['loa_motor'], ex['beam'], ex['boat_at'], ex['davit_at'], ex['head_at'], ex['hook_at'], ex['ring']))
    global OBJS; OBJS = objs
    if 'fast' in sys.argv or 'dry' in sys.argv: return
    renders(objs)

# ---------- renders for checking ----------
def dup(o, loc, rot=(0, 0, 0)):
    c = o.copy(); link(c); c.location = loc; c.rotation_euler = rot; return c
def show(*keep):
    for o in bpy.context.scene.objects:
        if o.type == 'MESH': o.hide_render = o not in keep
def stowed_set(objs, cover=True):
    hook_top, head = stowed()
    B = [dup(objs['mob_boat'], (0, 0, HK)), dup(objs['mob_sling'], (0, 0, HK)), dup(objs['mob_vugge'], (0, 0, 0)),
         dup(objs['mob_davit'], (DX, Y_RING, 0)), dup(objs['mob_arm'], (DX, Y_RING, 0)), dup(objs['mob_hook'], (DX + hook_top.x, Y_RING, hook_top.z))]
    f = objs['mob_fall'].copy(); link(f); f.location = (DX + hook_top.x, Y_RING, hook_top.z); f.rotation_euler = (math.radians(-90), 0, 0); f.scale = (1, FALL0, 1); B.append(f)
    if cover: B += [dup(objs['mob_tarp'], (0, 0, HK)), dup(objs['mob_lash'], (0, 0, 0))]
    return B
def renders(objs):
    sc = setup_render(1200, 800, samples=24)
    try: sc.cycles.use_denoising = True
    except Exception: pass
    only = [x for x in sys.argv[1:] if x not in ('fast', 'dry')]; want = lambda k: not only or k in only
    deck = box('deck', -6, 6, -6, 6, -0.02, 0.0, mat('deckm', (0.42, 0.43, 0.42), 0.3))
    side = box('bulwark', 2.55, 2.62, -4.0, 4.0, 0.0, 1.10, mat('bulw', (0.80, 0.82, 0.83), 0.4))
    man = [cyl('man', (-1.55, -1.8, 0.0), (-1.55, -1.8, 1.55), 0.17, mat('manm', (0.95, 0.42, 0.07), 0.2), 12), sphere('manh', (-1.55, -1.8, 1.68), 0.11, mat('skin', (0.86, 0.64, 0.50), 0.2), (1, 1, 1), 12, 8)]
    S = stowed_set(objs); env = [deck, side] + man
    if want('side'):
        show(*(S + env)); camera((-11.0, Y_RING, 1.6), (0, Y_RING, 1.6), ortho=7.0); render(os.path.join(OUT, 'mob_side.png'))
    if want('top'):
        show(*(S + [deck, side])); camera((0.4, -0.3, 14.0), (0.4, -0.3, 0.0), ortho=7.5); render(os.path.join(OUT, 'mob_top.png'))
    if want('front'):
        show(*(S + env)); camera((-5.8, 6.4, 4.2), (0.4, -0.2, 1.3), lens=35); render(os.path.join(OUT, 'mob_3q.png'))
        camera((5.8, 5.6, 2.6), (0.6, -0.3, 1.6), lens=35); render(os.path.join(OUT, 'mob_3q_out.png'))
    if want('stern'):
        show(*(S + env)); camera((-3.8, -6.6, 2.3), (0.2, -1.6, 1.1), lens=35); render(os.path.join(OUT, 'mob_stern.png'))
    if want('davit'):
        show(*(S + [deck, side])); camera((4.2, -2.6, 3.4), (1.0, Y_RING, 2.7), lens=35); render(os.path.join(OUT, 'mob_davit.png'))
    if want('hook'):
        show(*(S + [deck, side])); ht, _ = stowed(); camera((DX + ht.x + 0.95, Y_RING - 0.85, ht.z + 0.10), (DX + ht.x, Y_RING, ht.z - 0.30), lens=50); render(os.path.join(OUT, 'mob_hook.png'))
    for o in S: bpy.data.objects.remove(o, do_unlink=True)
    S = stowed_set(objs, cover=False)
    if want('open') or want('console'):
        show(*(S + env)); camera((-4.2, 4.4, 4.6), (0, -0.4, 0.8), lens=35); render(os.path.join(OUT, 'mob_open.png'))
        camera((-2.4, -3.6, 2.6), (0, -0.4, 0.9), lens=35); render(os.path.join(OUT, 'mob_open_aft.png'))
    if want('console'):
        show(*S); camera((1.3, -2.2, 2.4), (0, YC, ZD + HK + 0.8), lens=45); render(os.path.join(OUT, 'mob_console.png'))
        camera((-1.2, Y_TR - 1.6, 1.4), (0, Y_TR - 0.2, 0.7), lens=45); render(os.path.join(OUT, 'mob_outboard.png'))
    if want('cradle'):
        show(objs['mob_vugge'], deck); camera((-3.4, 3.2, 2.4), (0, 0, 0.3), lens=35); render(os.path.join(OUT, 'mob_cradle.png'))
        Bt = dup(objs['mob_boat'], (0, 0, HK)); show(objs['mob_vugge'], deck, Bt)
        camera((0.0, -6.5, 0.55), (0, 0, 0.55), ortho=3.0); render(os.path.join(OUT, 'mob_cradle_aft.png'))
        bpy.data.objects.remove(Bt, do_unlink=True)

if __name__ == '__main__':
    main()
