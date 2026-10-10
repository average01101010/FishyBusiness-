#!/usr/bin/env python3
"""Footprints of the game's places (mottak, yards, shops, rorbuer, naust) against the vector packs' objects (tools/steder/bruflytt.py uses
measure()). Run alone it prints the conflict report (and writes konflikt.json and units.pkl to FOTAVTRYKK_OUT or the temp dir).
Conflicts of the game's places (mottak, verft, butikk, rorbu, naust) with the map's vec objects.
Mirrors the game's rules: buildings under units/sites are hidden (view3d bldOnUnit/onSite), vec piers/roads/bridges are NOT.
Read-only on the repo. Usage: python3 konflikt.py [--rorbu-limit N]"""
import json, math, os, re, struct, sys, zlib, base64, collections, time
import numpy as np
from pyproj import Transformer
from shapely.geometry import Polygon, LineString, Point, box as sbox
from shapely.prepared import prep
from shapely.strtree import STRtree

R = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
GAME = os.environ.get('KYST_MAP') or R + '/tools/map/out/game'
OUTD = os.environ.get('FOTAVTRYKK_OUT') or __import__('tempfile').gettempdir()
tr = Transformer.from_crs(4326, 25833, always_xy=True)
def natP(lat, lon):
    E, N = tr.transform(lon, lat); return ((E + 250000) / 1000, (8050000 - N) / 1000)
KY = 111.32; KX = 111.32 * math.cos(69.35 * math.pi / 180); W = 2 * KX; H = 0.74 * KY
def LG(x, y): return natP(69.72 - y / KY, 16.55 + x / KX)
def LGm(a): q = LG(a[0] / 1000, a[1] / 1000); return (q[0] * 1000, q[1] * 1000)
def LGu(o, u):
    a = LGm(o); b = LGm((o[0] + u[0] * 10, o[1] + u[1] * 10)); l = math.hypot(b[0] - a[0], b[1] - a[1]); return ((b[0] - a[0]) / l, (b[1] - a[1]) / l)
SENJA = Polygon([(q[0] * 1000, q[1] * 1000) for q in [LG(0, 0), LG(W, 0), LG(W, H), LG(0, H)]])
SENJAP = prep(SENJA)
def in_senja(x, z): return SENJAP.contains(Point(x, z))

man = json.load(open(GAME + '/manifest.json'))
TILE = man['tile']; BLK = man['block']; B = TILE // BLK
PK = {}
for p in man['packs']:
    PK[(p['kind'], p['tile'][0], p['tile'][1])] = p
    for t in p.get('tiles', []): PK.setdefault((p['kind'], t[0], t[1]), p)
_pack = {}
def pack(p):
    f = p['file']
    if f in _pack: return _pack[f]
    b = open(GAME + '/' + f, 'rb').read(); assert b[:4] == b'KMP1'
    hl = struct.unpack('<I', b[4:8])[0]; head = json.loads(b[8:8 + hl]); at = 8 + hl
    idx = {'%s:%s:%s' % (e[0], e[1], e[2]): (at + e[3], e[4], e[5] if len(e) > 5 else 0) for e in head['blocks']}
    _pack[f] = (b, idx); return _pack[f]
def inflate(b): return zlib.decompress(b, -15)

# ---------------------------------------------------------------- vec decode (port of 01c-vec.js vecDecode)
def qlen(q): return q * 0.5 if q <= 160 else 80 + (q - 160) * 2
def varlines(b, ox, oz):
    i = 0
    def nx():
        nonlocal i
        v = 0; s = 0
        while True:
            x = b[i]; i += 1; v += (x & 127) << s; s += 7
            if not x & 128: return v
    zz = lambda v: -(v + 1) // 2 if v % 2 else v // 2
    n = nx(); out = []
    for _ in range(n):
        c = nx(); m = nx(); xs = []; zs = []; x = z = 0
        for _ in range(m):
            x += zz(nx()); z += zz(nx()); xs.append(ox + x); zs.append(oz + z)
        out.append((c, xs, zs))
    return out
def pier_boxes(kind, xs, zs, src):
    n = len(xs); out = []; bw = kind == 1
    closed = n > 3 and math.hypot(xs[0] - xs[-1], zs[0] - zs[-1]) < 1
    if closed and kind == 0:
        cx = sum(xs[:-1]) / (n - 1); cz = sum(zs[:-1]) / (n - 1)
        sxx = szz = sxz = 0
        for k in range(n - 1):
            a = xs[k] - cx; b = zs[k] - cz; sxx += a * a; szz += b * b; sxz += a * b
        th = 0.5 * math.atan2(2 * sxz, sxx - szz); ux = math.cos(th); uz = math.sin(th)
        l0 = w0 = 1e9; l1 = w1 = -1e9
        for k in range(n - 1):
            a = xs[k] - cx; b = zs[k] - cz; pu = a * ux + b * uz; pv = -a * uz + b * ux
            l0 = min(l0, pu); l1 = max(l1, pu); w0 = min(w0, pv); w1 = max(w1, pv)
        out.append(dict(x=cx + ux * (l0 + l1) / 2 - uz * (w0 + w1) / 2, z=cz + uz * (l0 + l1) / 2 + ux * (w0 + w1) / 2, w=max(3, w1 - w0), l=max(3, l1 - l0), ang=math.atan2(ux, uz), bw=False, closed=True, made=False, src=src, kind=kind))
    else:
        for k in range(n - 1):
            ax, az, bx, bz = xs[k], zs[k], xs[k + 1], zs[k + 1]; L = math.hypot(bx - ax, bz - az)
            if L < 0.5: continue
            if kind == 2:
                nx_ = -(bz - az) / L; nz_ = (bx - ax) / L
                out.append(dict(x=(ax + bx) / 2 - nx_ * 3, z=(az + bz) / 2 - nz_ * 3, w=6, l=L + 1, ang=math.atan2(bx - ax, bz - az), bw=False, closed=False, made=True, src=src, kind=kind)); continue
            out.append(dict(x=(ax + bx) / 2, z=(az + bz) / 2, w=9 if bw else 4.2, l=L + (4 if bw else 1), ang=math.atan2(bx - ax, bz - az), bw=bw, closed=False, made=False, src=src, kind=kind))
    return out
def box_poly(q):
    ax, az = math.sin(q['ang']), math.cos(q['ang']); nx, nz = math.cos(q['ang']), -math.sin(q['ang']); l = q['l'] / 2; w = q['w'] / 2
    return Polygon([(q['x'] + ax * a + nx * b, q['z'] + az * a + nz * b) for a, b in [(-l, -w), (l, -w), (l, w), (-l, w)]])

_vec = {}
def vec_tile(tx, ty):
    k = (tx, ty)
    if k in _vec: return _vec[k]
    p = PK.get(('vec', tx, ty))
    if not p: _vec[k] = None; return None
    b, idx = pack(p); ox = tx * TILE * 1000; oz = ty * TILE * 1000
    def get(n):
        e = idx.get('%s:%d:%d' % (n, tx * B, ty * B))
        return (inflate(b[e[0]:e[0] + e[1]]), e[2]) if e else (None, 0)
    t = dict(bld=[], roads=[], bridges=[], piers=[], slabs=[], molos=[])
    raw, n = get('bld')
    if raw:
        u16 = lambda o: raw[o] | raw[o + 1] << 8
        for i in range(n):
            x = ox + u16(2 * i); z = oz + u16(2 * n + 2 * i)
            if in_senja(x, z): continue
            L = qlen(raw[4 * n + i]); Wd = max(1.5, qlen(raw[5 * n + i])); a = raw[6 * n + i] / 256 * math.pi
            t['bld'].append((x, z, L, Wd, a, raw[7 * n + i] & 15))
    raw, n = get('road')
    if raw:
        for c, xs, zs in varlines(raw, ox, oz):
            a = 0
            def own(i): mx = (xs[i - 1] + xs[i]) / 2; mz = (zs[i - 1] + zs[i]) / 2; return not in_senja(mx, mz)
            for j in range(1, len(xs)):
                if not own(j):
                    if j - 1 - a >= 1: t['roads'].append((c, xs[a:j], zs[a:j]))
                    a = j
            if len(xs) - 1 - a >= 1: t['roads'].append((c, xs[a:], zs[a:]))
    raw, n = get('bridge')
    if raw:
        for q in json.loads(raw):
            for i in range(4, len(q) - 1, 2): q[i] += ox; q[i + 1] += oz
            m = 4 + 2 * ((len(q) - 4) // 4)
            if not in_senja(q[m], q[m + 1]): t['bridges'].append(q)
    raw, n = get('pier')
    if raw:
        for c, xs, zs in varlines(raw, ox, oz):
            if in_senja(sum(xs) / len(xs), sum(zs) / len(zs)): continue
            si = len(t['slabs'])
            t['piers'] += pier_boxes(c, xs, zs, si)
            if c == 1: t['molos'].append(list(zip(xs, zs)))
            elif c == 0 and len(xs) > 3 and math.hypot(xs[0] - xs[-1], zs[0] - zs[-1]) < 1: t['slabs'].append(list(zip(xs, zs)))
    _vec[k] = t; return t

# ---------------------------------------------------------------- legacy Senja data (embedded in the page)
_leg = None
def legacy():
    global _leg
    if _leg: return _leg
    raw = zlib.decompress(base64.b64decode(open(R + '/src/data/geo-roads.b64').read().strip()))
    i = 0
    def nx():
        nonlocal i
        v = 0; s = 0
        while True:
            x = raw[i]; i += 1; v += (x & 127) << s; s += 7
            if not x & 128: return v
    zz = lambda v: -(v + 1) // 2 if v % 2 else v // 2
    n = nx(); roads = []
    for _ in range(n):
        c = nx(); m = nx(); x = z = 0; xs = []; zs = []
        for _ in range(m):
            x += zz(nx()); z += zz(nx()); q = LGm((x, z)); xs.append(q[0]); zs.append(q[1])
        roads.append((c, xs, zs))
    src = open(R + '/src/js/core/01-world.js').read()
    m = re.search(r'const BRIDGES = (\[\[.*?\]\]);', src, re.S); br = json.loads(m.group(1))
    for q in br:
        for i2 in range(4, len(q) - 1, 2): g = LGm((q[i2], q[i2 + 1])); q[i2], q[i2 + 1] = g
    piers = []
    for si, pr in enumerate(json.load(open(R + '/src/data/piers.json'))):
        pts = [LG(pr[j], pr[j + 1]) for j in range(1, len(pr) - 1, 2)]
        xs = [p[0] * 1000 for p in pts]; zs = [p[1] * 1000 for p in pts]
        piers += pier_boxes(pr[0], xs, zs, si)
    _leg = dict(roads=roads, bridges=br, piers=piers); return _leg

# ---------------------------------------------------------------- places
def unit_geo(y): return dict(E=60, B=34, basinX=66, basinZ=44) if y else dict(E=27.4, B=24.4, basinX=33.4, basinZ=26)
class Unit:
    def __init__(s, id, o, u, y=False, f=None, kind='', name=''):
        s.id = id; s.o = o; s.u = u; s.n = (-u[1], u[0]); s.y = y; s.g = unit_geo(y); s.kind = kind; s.name = name; s.f = f
    def w(s, lx, lz): return (s.o[0] + s.u[0] * lx + s.n[0] * lz, s.o[1] + s.u[1] * lx + s.n[1] * lz)
    def L(s, x, z): dx = x - s.o[0]; dz = z - s.o[1]; return (dx * s.u[0] + dz * s.u[1], dx * s.n[0] + dz * s.n[1])
    def poly_land(s):
        g = s.g; ps = [Polygon([s.w(-g['E'], -g['B']), s.w(g['E'], -g['B']), s.w(g['E'], 0), s.w(-g['E'], 0)])]
        if s.f:
            ff = s.f; ps.append(Polygon([s.w(ff[i], ff[i + 1]) for i in range(0, len(ff), 2)]).buffer(0))
        from shapely.ops import unary_union
        return unary_union(ps)
    def poly_basin(s):
        g = s.g; return Polygon([s.w(-g['basinX'], 0), s.w(g['basinX'], 0), s.w(g['basinX'], g['basinZ']), s.w(-g['basinX'], g['basinZ'])])
    def hide_poly(s):   # where onUnit(.., 3) is true: land + 3 m, plus basin
        return s.poly_land().buffer(3).union(s.poly_basin())

def make_unit(id, kind, x, y, a, name=''):
    # a unit on the quay face (x, y km; a the normal's angle), as 06b-coastports.js and 06c-steder.js set it down
    nx, nz = math.cos(a), math.sin(a)
    if kind == 'mottak': return Unit(id, (x * 1000, y * 1000), (nz, -nx), False, [27.4, -24.4, 27.4, -28.4, -27.4, -28.4, -27.4, -24.4], 'mottak', name)
    yd = kind == 'verft'; g = unit_geo(yd)
    return Unit(id, (x * 1000, y * 1000), (nz, -nx), yd, [g['E'], -g['B'], g['E'], -g['B'] - 4, -g['E'], -g['B'] - 4, -g['E'], -g['B']], kind, name)

def load_places():
    P = []
    # legacy Senja harbours with a unit (01-world.js UNITS)
    src = open(R + '/src/js/core/01-world.js').read()
    mu = re.search(r'const UNITS = \{(.*?)\n\};', src, re.S).group(1)
    for m in re.finditer(r'(\w+):\{o:\[([\d.]+), ([\d.]+)\], u:\[([-\d.]+), ([-\d.]+)\](?:, v:\'(\w)\')?, f:\[([^\]]*)\]\}', mu):
        id = m.group(1); o = (float(m.group(2)), float(m.group(3))); u = (float(m.group(4)), float(m.group(5))); l = math.hypot(*u); u = (u[0] / l, u[1] / l)
        f = [float(v) for v in m.group(7).split(',')]
        uu = LGu(o, u); oo = LGm(o)
        P.append(Unit(id, oo, uu, False, f, 'mottak', id))
    legacy_ports = []
    for id, xy in [('finnsnes', (56.035, 53.611)), ('botnhamn', (53.288, 23.495)), ('husoy', (43.803, 19.676)), ('senjahopen', (36.807, 25.119)), ('gryllefjord', (20.319, 39.836)), ('sommaroy', (56.761, 9.545)), ('brensholmen', (58.589, 12.628)), ('torsken', (21.856, 42.58)), ('frovag', (19.651, 71.922)), ('vangshamn', (57.395, 27.563))]:
        q = LG(*xy); legacy_ports.append((id, q[0], q[1]))
    # coast mottak (06b-coastports.js)
    M = json.load(open(R + '/src/data/mottak.json'))['m']
    COAST_WF = ['torsk', 'hyse', 'sei', 'lyr', 'lange', 'brosme', 'uer', 'kveite', 'kongekrabbe', 'krabbe']
    wf = lambda x: sum((x['sp'].get(s) or [0])[0] or 0 for s in COAST_WF)
    conv = lambda x: sum(v for k, v in (x.get('gear') or {}).items() if re.search('Konv|Garn|Line|Jukse|Teine|Snurre', k))
    ok = sorted([x for x in M if x['t'] in ('Ordinært anlegg', 'Kaiselger') and x.get('q') and wf(x) >= 10000 and ((x.get('small') or 0) >= 0.05 or conv(x) >= 0.3)], key=lambda x: -wf(x))
    groups = []
    for x in ok:
        for g in groups:
            if math.hypot(g[0]['p'][0] - x['p'][0], g[0]['p'][1] - x['p'][1]) < 1.2: break
        else: groups.append([x])
    own = [(q[1], q[2]) for q in legacy_ports]
    nm = 0
    for g in groups:
        x = g[0]
        if any(math.hypot(o[0] - x['p'][0], o[1] - x['p'][1]) < 2 for o in own): continue
        q = x['q']; cx = q[0] * 1000; cz = q[1] * 1000; nx_, nz_ = math.cos(q[2]), math.sin(q[2])
        P.append(Unit('m' + x['id'], (cx, cz), (nz_, -nx_), False, [27.4, -24.4, 27.4, -28.4, -27.4, -28.4, -27.4, -24.4], 'mottak', (x.get('v') or x.get('k') or x['id']))); P[-1].ref = ('m', x['id'])
    # steder (06c-steder.js)
    S = json.load(open(R + '/src/data/steder.json'))['r']
    for r in S:
        x, y, a, ln, dp, kind, town = r; nx_, nz_ = math.cos(a), math.sin(a); g = unit_geo(kind)
        P.append(Unit('s%s%d_%d' % ('v' if kind else 'b', round(x * 1000), round(y * 1000)), (x * 1000, y * 1000), (nz_, -nx_), bool(kind),
                      [g['E'], -g['B'], g['E'], -g['B'] - 4, -g['E'], -g['B'] - 4, -g['E'], -g['B']], 'verft' if kind else 'butikk', town)); P[-1].ref = ('s', S.index(r))
    return P, legacy_ports

# ---------------------------------------------------------------- land mask (approximation of isLand: the 25 m mask)
_mask = {}
def mask_block(bx, by):
    k = (bx, by)
    if k in _mask: return _mask[k]
    p = PK.get(('sim', bx // 5, by // 5)); r = None
    if p:
        b, idx = pack(p); e = idx.get('mask:%d:%d' % (bx, by))
        if e: r = inflate(b[e[0]:e[0] + e[1]])
    _mask[k] = r; return r
class Missing(Exception): pass
def land(x, z):
    ix = int(math.floor(x / 25.0)); iy = int(math.floor(z / 25.0)); bx = ix // 400; by = iy // 400
    r = mask_block(bx, by)
    if r is None: raise Missing()
    return r[(iy - by * 400) * 400 + (ix - bx * 400)] == 1

# ---------------------------------------------------------------- the fine coast (the game's truth for land and sea near the boats)
# The chart packs' coast2 (01d-coast.js): rings in metres from the tile's corner, class 0/1 land, 2/3 breakwaters, the nonzero winding rule
# (land: the land rings wind round the point, or a breakwater does). land_fine() reads it as the game's isLand does, for a tile that has a chart
# pack, else the 25 m mask; it is built per 800 m window as a 2 m raster by scanline, so a lookup costs nothing once its window is in.
_rings = {}
def _uv(raw, st):
    v = 0; s = 1
    while True:
        c = raw[st[0]]; st[0] += 1; v += (c & 127) * s; s *= 128
        if not c & 128: return v
def coast_rings(tx, ty):
    """the fine coast of tile (tx, ty) as [(class, int32 array (n, 2) in metres from the tile's corner)], None when the tile has no chart pack"""
    k = (tx, ty)
    if k in _rings: return _rings[k]
    p = PK.get(('chart', tx, ty)); out = None
    if p:
        b, idx = pack(p); e = idx.get('coast2:%d:%d' % (tx * B, ty * B))
        if e:
            raw = inflate(b[e[0]:e[0] + e[1]]); st = [0]; n = _uv(raw, st); out = []
            for _ in range(n):
                cls = _uv(raw, st); m = _uv(raw, st); x = y = 0; pts = np.empty((m, 2), np.int32)
                for j in range(m):
                    a = _uv(raw, st); x += -(a + 1) // 2 if a % 2 else a // 2
                    a = _uv(raw, st); y += -(a + 1) // 2 if a % 2 else a // 2
                    pts[j] = (x, y)
                if m >= 3: out.append((cls, pts))
        else: out = []
    _rings[k] = out; return out
WIN = 800; FRES = 2.0
_fwin = {}
def _fine_window(wx, wz):
    """land (bool, 400 x 400, row = z) of the 800 m window (wx, wz), or None where its tile has no chart pack"""
    k = (wx, wz)
    if k in _fwin: return _fwin[k]
    x0 = wx * WIN; z0 = wz * WIN; n = int(WIN / FRES); tx = int(x0 // (TILE * 1000)); ty = int(z0 // (TILE * 1000))
    if ('chart', tx, ty) not in PK or coast_rings(tx, ty) is None: _fwin[k] = None; return None
    wl = np.zeros((n, n), np.int16); wb = np.zeros((n, n), np.int16)
    cy = z0 + (np.arange(n) + 0.5) * FRES + 0.0137   # row centres, off the whole metres where the data's points are
    for dx in (-1, 0, 1):
        for dy in (-1, 0, 1):
            t2 = (tx + dx, ty + dy); R = coast_rings(*t2) if ('chart', t2[0], t2[1]) in PK else None
            if not R: continue
            ox = t2[0] * TILE * 1000; oz = t2[1] * TILE * 1000
            for cls, P in R:
                ax = P[:, 0] + ox; az = P[:, 1] + oz; bx = np.roll(ax, -1); bz = np.roll(az, -1)
                keep = (np.minimum(az, bz) <= cy[-1]) & (np.maximum(az, bz) >= cy[0]) & (az != bz)
                if not keep.any(): continue
                A = wb if cls >= 2 else wl
                for ex, ez, fx, fz in zip(ax[keep], az[keep], bx[keep], bz[keep]):
                    j0 = max(0, int(math.ceil((min(ez, fz) - 0.0137 - z0) / FRES - 0.5))); j1 = min(n - 1, int(math.floor((max(ez, fz) - 0.0137 - z0) / FRES - 0.5)))
                    if j1 < j0: continue
                    js = np.arange(j0, j1 + 1); xc = ex + (cy[js] - ez) * (fx - ex) / (fz - ez); sg = -1 if fz > ez else 1
                    ci = np.clip(np.ceil((xc - x0) / FRES - 0.5).astype(int), 0, n)   # the first cell whose centre lies right of the crossing
                    ok = ci < n
                    np.add.at(A, (js[ok], ci[ok]), sg)
    land = (np.cumsum(wl, axis=1) != 0) | (np.cumsum(wb, axis=1) != 0)
    _fwin[k] = land; return land
def land_fine(x, z):
    """land at x, z (m) as the game's isLand has it near the boats: the fine coast where the tile has one, else the 25 m mask"""
    wx = int(math.floor(x / WIN)); wz = int(math.floor(z / WIN)); W = _fine_window(wx, wz)
    if W is None: return land(x, z)
    n = W.shape[0]; return bool(W[min(n - 1, max(0, int((z - wz * WIN) / FRES))), min(n - 1, max(0, int((x - wx * WIN) / FRES)))])
def shore_spot(cx, cz, r0, r1, o, avoid, piers):
    def on_pier(x, z):
        for q in piers:
            if abs(q['x'] - x) > q['l'] + q['w'] + 10 or abs(q['z'] - z) > q['l'] + q['w'] + 10: continue
            ax, az = math.sin(q['ang']), math.cos(q['ang']); nx, nz = math.cos(q['ang']), -math.sin(q['ang']); dx = x - q['x']; dz = z - q['z']
            if abs(dx * ax + dz * az) <= q['l'] / 2 + 4 and abs(dx * nx + dz * nz) <= q['w'] / 2 + 4: return True
        return False
    best = None; r = r0
    while r <= r1:
        if best and o['pref'] is not None and r > o['pref'] and 0.015 * (r - o['pref']) >= best[0]: break
        nA = max(16, round(2 * math.pi * r / 18))
        for k in range(nA):
            a = k / nA * 2 * math.pi; px = cx + math.sin(a) * r; pz = cz - math.cos(a) * r
            wx = wz = 0; nl = 0
            for j in range(12):
                b = j * math.pi / 6; sx = math.sin(b); sz = -math.cos(b)
                if land(px + sx * 12, pz + sz * 12): nl += 1
                else: wx += sx; wz += sz
            if nl < 3 or nl > 9: continue
            wl = math.hypot(wx, wz)
            if wl < 1e-6: continue
            nx = wx / wl; nz = wz / wl; tx = -nz; tz = nx
            def shore_at(sx, sz):
                if not land(sx - nx * 30, sz - nz * 30): return None
                prev = True
                for v in range(-29, 41):
                    x = sx + nx * v; z = sz + nz * v; l = land(x, z)
                    if prev and not l: return (x, z, v)
                    prev = l
                return None
            c = shore_at(px, pz)
            if not c: continue
            A = shore_at(c[0] - tx * o['half'], c[1] - tz * o['half']); Bq = shore_at(c[0] + tx * o['half'], c[1] + tz * o['half'])
            if not A or not Bq: continue
            bend = abs((A[2] + Bq[2]) / 2)
            if bend > o['bend']: continue
            ux = Bq[0] - A[0]; uz = Bq[1] - A[1]; Ln = math.hypot(ux, uz) or 1; ux /= Ln; uz /= Ln
            Nx = -uz; Nz = ux
            if Nx * nx + Nz * nz < 0: ux, uz, Nx, Nz = -ux, -uz, -Nx, -Nz
            if any(land(c[0] + Nx * v, c[1] + Nz * v) for v in o['out']) or any(not land(c[0] - Nx * v, c[1] - Nz * v) for v in o['inl']): continue
            if any(on_pier(c[0] + ux * du + Nx * dn, c[1] + uz * du + Nz * dn) for du, dn in [(0, 0), (-o['half'], 0), (o['half'], 0), (0, 6), (0, -10)]): continue
            if avoid(c[0], c[1]): continue
            score = bend + abs(A[2] - Bq[2]) * 0.2 + abs(r - o['pref']) * 0.015
            if not best or score < best[0]: best = (score, (c[0], c[1]), (ux, uz), r)
        r += 15
    return best

class Site:   # rorbu or naust
    def __init__(s, id, name, kind, o, u, rect, berth):
        s.id = id; s.name = name; s.kind = kind; s.o = o; s.u = u; s.n = (-u[1], u[0]); s.rect = rect; s.berth = berth
    def w(s, lx, y): return (s.o[0] + s.u[0] * lx - s.n[0] * y, s.o[1] + s.u[1] * lx - s.n[1] * y)   # y inland
    def poly(s): r = s.rect; return Polygon([s.w(r[0], r[1]), s.w(r[2], r[1]), s.w(r[2], r[3]), s.w(r[0], r[3])])
    def berth_poly(s): r = s.berth; return Polygon([s.w(r[0], r[1]), s.w(r[2], r[1]), s.w(r[2], r[3]), s.w(r[0], r[3])])

# ---------------------------------------------------------------- measuring
class Env:
    """vec/legacy objects near a point, as shapely things"""
    def __init__(s, x, z, rad=400):
        s.bld = []; s.roads = []; s.bridges = []; s.piers = []; s.slabs = []; s.molos = []
        tx0 = int((x - rad) // (TILE * 1000)); tx1 = int((x + rad) // (TILE * 1000)); ty0 = int((z - rad) // (TILE * 1000)); ty1 = int((z + rad) // (TILE * 1000))
        bb = sbox(x - rad, z - rad, x + rad, z + rad)
        for ty in range(ty0, ty1 + 1):
            for tx in range(tx0, tx1 + 1):
                t = vec_tile(tx, ty)
                if not t: continue
                for b in t['bld']:
                    if abs(b[0] - x) < rad and abs(b[1] - z) < rad: s.bld.append(b)
                for c, xs, zs in t['roads']:
                    if max(xs) >= x - rad and min(xs) <= x + rad and max(zs) >= z - rad and min(zs) <= z + rad: s.roads.append((c, LineString(list(zip(xs, zs)))))
                for q in t['bridges']:
                    pts = [(q[i], q[i + 1]) for i in range(4, len(q) - 1, 2)]
                    if len(pts) > 1:
                        ls = LineString(pts)
                        if ls.intersects(bb): s.bridges.append((q[2] or '', q[1], ls))
                for q in t['piers']:
                    if abs(q['x'] - x) < rad + q['l'] and abs(q['z'] - z) < rad + q['l'] and not q['closed']: s.piers.append(q)
                    elif q['closed'] and abs(q['x'] - x) < rad + q['l'] and abs(q['z'] - z) < rad + q['l']: s.piers.append(q)   # kept for the box; slab drawn
                for i, pts in enumerate(t['slabs']):
                    if min(p[0] for p in pts) < x + rad and max(p[0] for p in pts) > x - rad and min(p[1] for p in pts) < z + rad and max(p[1] for p in pts) > z - rad: s.slabs.append((t, i, Polygon(pts).buffer(0)))
                for pts in t['molos']:
                    if min(p[0] for p in pts) < x + rad and max(p[0] for p in pts) > x - rad and min(p[1] for p in pts) < z + rad and max(p[1] for p in pts) > z - rad: s.molos.append(LineString(pts))
        if in_senja(x, z) or SENJA.distance(Point(x, z)) < rad:
            L = legacy()
            for c, xs, zs in L['roads']:
                if max(xs) >= x - rad and min(xs) <= x + rad and max(zs) >= z - rad and min(zs) <= z + rad: s.roads.append((c, LineString(list(zip(xs, zs)))))
            for q in L['bridges']:
                pts = [(q[i], q[i + 1]) for i in range(4, len(q) - 1, 2)]
                if len(pts) > 1 and LineString(pts).intersects(bb): s.bridges.append((q[2] or '', q[1], LineString(pts)))
            for q in L['piers']:
                if abs(q['x'] - x) < rad + q['l'] and abs(q['z'] - z) < rad + q['l']: s.piers.append(q)
            # legacy piers are removed under units by PIERBOX (inUnit); done in measure() through `legacy_pier`
        s.legacy = in_senja(x, z)

def bld_poly(b):
    x, z, L, Wd, a = b[:5]; ca, sa = math.cos(a), math.sin(a)
    return Polygon([(x + ca * u * L - sa * v * Wd, z + sa * u * L + ca * v * Wd) for u, v in [(-.5, -.5), (.5, -.5), (.5, .5), (-.5, .5)]])
def bld_hidden(b, hide):   # port of bldOnUnit: 3 m sample grid, any point inside the hide area
    x, z, L, Wd, a = b[:5]; ca, sa = math.cos(a), math.sin(a); nu = math.ceil(L / 3); nv = math.ceil(Wd / 3)
    for p in range(nu + 1):
        for q in range(nv + 1):
            u = p / nu - .5; v = q / nv - .5
            if hide.contains(Point(x + ca * u * L - sa * v * Wd, z + sa * u * L + ca * v * Wd)): return True
    return False

def measure(place, env):
    """returns dict class -> list of (what, value, dist)"""
    res = collections.defaultdict(list)
    if isinstance(place, Unit):
        land_p = place.poly_land(); basin = place.poly_basin(); hide = place.hide_poly(); full = land_p.union(basin)
        other_hide = None
    else:
        land_p = place.poly(); basin = place.berth_poly(); hide = land_p; full = land_p.union(basin)
    zone = full.buffer(0)
    # buildings
    nhid = 0
    for b in env.bld:
        poly = bld_poly(b)
        if not poly.intersects(full.buffer(3)): continue
        hid = bld_hidden(b, hide)
        if hid: nhid += 1; continue
        a = poly.intersection(full).area
        if a > 1: res['bygg'].append(('bygg type%d %.0fx%.0f m' % (b[5], b[2], b[3]), a, 0.0))
    res['_hidden'] = nhid
    # roads
    for c, ls in env.roads:
        inter = ls.intersection(land_p)
        if inter.length > 3: res['vei'].append(('vei kl%d' % c, inter.length, 0.0))
    # bridges
    for nm, ln, ls in env.bridges:
        d = ls.distance(full)
        if d < 5: res['bru'].append(('bru %s (%.0f m)' % (nm or '?', ln), ls.intersection(full.buffer(5)).length, d))
    # piers (vec: not hidden under units; legacy: PIERBOX removes those on a unit)
    def inunit_legacy(q):
        if not isinstance(place, Unit): return False
        ax, az = math.sin(q['ang']), math.cos(q['ang']); nx, nz = math.cos(q['ang']), -math.sin(q['ang'])
        s = -1
        while s <= 1:
            for t in (-1, 0, 1):
                px = q['x'] + ax * s * q['l'] / 2 + nx * t * q['w'] / 2; pz = q['z'] + az * s * q['l'] / 2 + nz * t * q['w'] / 2
                lx, lz = place.L(px, pz); g = place.g
                gl = min(math.hypot(max(0, abs(lx) - g['E']), max(0, -g['B'] - lz, lz)), 1e9)
                if gl <= 2 or (abs(lx) <= g['basinX'] and 0 <= lz <= g['basinZ']): return True
            s += 0.25
        return False
    # berth zones (quayFace: centre b0, half length b1/2; boats lie along it, 14 m out (yard 24 m))
    if isinstance(place, Unit):
        g = place.g; zl = 24 if place.y else 14
        bz = None
        for b0, b1 in ([(-20, 90), (30, 40)] if place.y else [(-5, 24), (16.5, 23)]):
            p_ = Polygon([place.w(b0 - b1 / 2, 0), place.w(b0 + b1 / 2, 0), place.w(b0 + b1 / 2, zl), place.w(b0 - b1 / 2, zl)]); bz = p_ if bz is None else bz.union(p_)
    else: bz = place.berth_poly()
    def add(kind, pg, obstacle):
        a_b = pg.intersection(basin).area; a_z = pg.intersection(bz).area; a_l = pg.intersection(land_p).area
        if a_b > 0.5: res['pir_basseng' if obstacle else 'dekk_basseng'].append((kind, a_b, 0.0))
        if a_z > 0.5: res['pir_liggeplass'].append((kind, a_z, 0.0)) if obstacle else res['dekk_liggeplass'].append((kind, a_z, 0.0))
        if a_b <= 0.5 and a_l > 20 and obstacle: res['pir_land'].append((kind, a_l, 0.0))
    for q in env.piers:
        if q['closed'] and not env.legacy: continue   # drawn as slab (shape), tested below; its box is still a boat obstacle (11b)
        if env.legacy and inunit_legacy(q): continue
        pg = box_poly(q)
        kind = 'molo' if q['bw'] else ('kaidekke' if q['made'] else 'brygge')
        add(kind, pg, not q['made'])
    for q in env.piers:   # closed piers: the slab is drawn, the bounding box is the obstacle
        if q['closed'] and not env.legacy: add('brygge-boks(flate)', box_poly(q), True)
    for t, i, pg in env.slabs: add('brygge-flate', pg, False)
    for ls in env.molos:   # moundInto skips cells on a unit (onUnit(...,1)); only note
        if ls.distance(full) < 2: res['molo_note'].append(('molo (skjules av enheten)', ls.intersection(full.buffer(2)).length, 0.0))
    return res

SEV = [('pir_liggeplass', 'fast hinder i liggeplassen'), ('pir_basseng', 'fast hinder i bassenget'), ('bru', 'bru'), ('bygg', 'synlig bygg'), ('vei', 'vei'), ('pir_land', 'brygge/molo i blokk')]

def main():
    t0 = time.time()
    places, lports = load_places()
    out = []   # (type, id, name, res, extra)
    ports_pts = [(q[1] * 1000, q[2] * 1000) for q in lports]
    for u in places: ports_pts.append(u.w(0, 15))
    unit_pts = [(u.o[0], u.o[1]) for u in places]
    legp = []
    import pickle
    cf = OUTD + '/units.pkl'
    if os.path.exists(cf): out = pickle.load(open(cf, 'rb'))
    else:
        for u in places:
            try: env = Env(u.o[0], u.o[1], 250)
            except Exception as e: print('ERR env', u.id, e); continue
            res = measure(u, env); out.append((u.kind, u.id, u.name, dict(res), (u.o[0], u.o[1])))
        pickle.dump(out, open(cf, 'wb'))
    print('enheter ferdig', len(out), '%.0fs' % (time.time() - t0), file=sys.stderr)
    # naust: Vangshamn (07c-naust.js naustFind)
    vg = [q for q in lports if q[0] == 'vangshamn'][0]
    legacy_piers = legacy()['piers']
    def avoid_naust(x, z): return any(math.hypot(px - x, pz - z) < 70 for px, pz in ports_pts) or any(abs(ux - x) < 110 and abs(uz - z) < 110 and math.hypot(ux - x, uz - z) < 110 for ux, uz in unit_pts)
    cx, cz = vg[1] * 1000, vg[2] * 1000
    sites = []
    sp = shore_spot(cx, cz, 60, 360, dict(half=15, bend=6, out=[8, 16, 30], inl=[6, 14, 25], pref=120), avoid_naust, legacy_piers) or shore_spot(cx, cz, 60, 360, dict(half=12, bend=9, out=[8, 16], inl=[6, 14], pref=120), avoid_naust, legacy_piers)
    naust = None
    if sp:
        N = (-sp[2][1], sp[2][0]); o = (sp[1][0] + N[0] * 4, sp[1][1] + N[1] * 4)
        naust = Site('naust', 'Fars naust (Vangshamn)', 'naust', o, sp[2], (-14, -1, 14, 16), (-9, -14, 9, -1))
        env = Env(o[0], o[1], 250); res = measure(naust, env); out.append(('naust', 'naust', naust.name, res, o))
    else: print('naust: ingen plass funnet', file=sys.stderr)
    # rorbuer
    RB = json.load(open(R + '/src/data/rorbuer.json'))['r']
    lim = int(sys.argv[sys.argv.index('--rorbu-limit') + 1]) if '--rorbu-limit' in sys.argv else len(RB)
    nosite = 0; missing = 0; rsites = []
    for i, r in enumerate(RB[:lim]):
        id = 'rb%d' % i; px, pz = r[0] * 1000, r[1] * 1000
        home = naust.o if naust else None
        def avoid(x, z): return any(math.hypot(qx - x, qz - z) < 70 for qx, qz in ports_pts) or any(abs(ux - x) < 110 and abs(uz - z) < 110 and math.hypot(ux - x, uz - z) < 110 for ux, uz in unit_pts) or (home and math.hypot(home[0] - x, home[1] - z) < 120)
        leg = legacy_piers if in_senja(px, pz) else []
        try:
            sp = shore_spot(px, pz, 15, 600, dict(half=14, bend=6, out=[8, 16, 30], inl=[6, 14, 25], pref=0), avoid, leg) or shore_spot(px, pz, 15, 600, dict(half=11, bend=9, out=[8, 16], inl=[6, 14], pref=0), avoid, leg)
        except Missing: missing += 1; continue
        if not sp: nosite += 1; continue
        N = (-sp[2][1], sp[2][0]); o = (sp[1][0] + N[0] * 4.4, sp[1][1] + N[1] * 4.4)
        S_ = Site(id, r[3] or 'Rorbua', 'rorbu', o, sp[2], (-15, -1, 15, 21), (-9, -14, 9, -1)); rsites.append(S_)
        env = Env(o[0], o[1], 250); res = measure(S_, env); out.append(('rorbu', id, '%s (kind %d)' % (S_.name, r[2]), res, o))
        if i % 50 == 49: print('rorbu', i + 1, '%.0fs' % (time.time() - t0), file=sys.stderr)
    # ---- report
    print('RORBUER: %d i data, %d uten funnet kystpunkt, %d uten kartblokk, %d malt' % (len(RB[:lim]), nosite, missing, len(rsites)))
    bytype = collections.defaultdict(list)
    for t, id, nm, res, xy in out: bytype[t].append((id, nm, res, xy))
    def has(res): return any(res.get(k) for k, _ in SEV)
    print('\nTYPE      antall  konflikt  | liggepl basseng bru bygg vei pir_land | kun dekk i basseng | skjulte bygg (sum)')
    for t in ['mottak', 'verft', 'butikk', 'rorbu', 'naust']:
        L = bytype.get(t, [])
        cnt = {k: sum(1 for _, _, r, _ in L if r.get(k)) for k, _ in SEV}
        print('%-9s %5d %8d  | %6d %7d %4d %4d %4d %6d | %5d | %d' % (t, len(L), sum(1 for _, _, r, _ in L if has(r)), cnt['pir_liggeplass'], cnt['pir_basseng'], cnt['bru'], cnt['bygg'], cnt['vei'], cnt['pir_land'], sum(1 for _, _, r, _ in L if r.get('dekk_basseng')), sum(r.get('_hidden', 0) for _, _, r, _ in L)))
    # worst
    scored = []
    wt = dict(pir_liggeplass=200, pir_basseng=100, bru=80, bygg=30, vei=20, pir_land=10)
    for t, id, nm, res, xy in out:
        sc = 0; items = []
        for k, lab in SEV:
            for what, val, d in res.get(k, []):
                sc += wt[k] + min(val, 2000) * 0.05; items.append('%s: %s %.0f %s dist %.1f m' % (lab, what, val, 'm2' if k in ('bygg', 'pir_basseng', 'pir_land', 'pir_liggeplass') else 'm', d))
        if sc: scored.append((sc, t, id, nm, xy, items))
    scored.sort(reverse=True)
    print('\nDe 15 verste:')
    for sc, t, id, nm, xy, items in scored[:15]:
        print('%-7s %-14s %-26s km(%.2f, %.2f) skjulte bygg=%d' % (t, id, nm, xy[0] / 1000, xy[1] / 1000, [r for tt, ii, n2, r, x2 in out if ii == id][0].get('_hidden', 0)))
        for it in items[:4]: print('     -', it)
    json.dump([(t, id, nm, {k: v for k, v in res.items()}, xy) for t, id, nm, res, xy in out], open(OUTD + '/konflikt.json', 'w'), default=str)
    # site-site distances
    pts = [(t, id, nm, xy) for t, id, nm, res, xy in out]
    close = []
    for i in range(len(pts)):
        for j in range(i + 1, len(pts)):
            d = math.hypot(pts[i][3][0] - pts[j][3][0], pts[i][3][1] - pts[j][3][1])
            if d < 1500: close.append((d, pts[i][:3], pts[j][:3]))
    close.sort()
    print('\nPar nærmere enn 1,5 km (alle typer):', len(close))
    for d, a, b in close[:8]: print('   %.0f m  %s %s  <->  %s %s' % (d, a[0], a[2], b[0], b[2]))

if __name__ == '__main__': main()
