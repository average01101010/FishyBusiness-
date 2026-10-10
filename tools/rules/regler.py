# The rules' map data for the game (R1 of the rules plan, 04.10.2026): src/data/rules.json in the game's frame (UTM 33 in km,
# tools/map/frame.py), from the sources tools/rules/fetch.py keeps in tools/rules/cache/.
#  - bl, blin: the baseline along the mainland (Kartverket) and the area inside it, closed far inland through Sweden, Finland and
#    Russia, so a point in the sea is inside the baseline when it is in blin. The distance to the baseline from outside gives every
#    zone (1, 2, 4, 6, 10, 12, 24 nm); nm holds the lines to draw (the official ones, and 2 nm drawn here from the baseline).
#  - zones: the sea inside the closing lines across the fjords, from the game's own land (land200, 200 m): the lines are walls, the
#    sea is split where they cross it, and a part of the sea is inside a kind of line when the open sea cannot be reached without
#    crossing a line of that kind. Kinds: F the fjord lines for coastal cod (layer 2), O the outer limit of the Oslo fjord (38),
#    and B the parts inside the fjord lines on the outer side of a hook line in Finnmark (5), free of the hook limit in winter. Each zone: its kinds and the lines round it, its rings drawn through
#    the land halfway to the sea outside (the land does not count, only the sea), and the corners by the lines put on the lines.
#    (The lines for saithe seine, layer 4, are left out: the game has no seine.)
#  - L: the regulation layers that concern the game (KEEP below), with their texts. Areas that follow the shore in detail are drawn the same way
#    through the land (from the game's 25 m land, at 50 m), so they keep their edges across the sea and lose the shore's detail.
#  - hom, lok: the main statistics areas and the locations (from 2018), for the landing notes.
# Coordinates: in units of 10 m, every ring or line as [x0, y0, dx1, dy1, ...].
#   python3 tools/rules/regler.py [map dir]      (default tools/map/out/game, else the newest kart- release through game.py)
import os, re, sys, json, time, math, datetime, numpy as np, shapely, contourpy
from PIL import Image, ImageDraw
from shapely.geometry import shape, LineString, MultiLineString, Polygon, MultiPolygon, Point
from scipy import ndimage
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE)); CACHE = os.path.join(HERE, 'cache')
sys.path.insert(0, os.path.join(ROOT, 'tools', 'map')); import pack
OUT = os.environ.get('KYST_RULES') or os.path.join(ROOT, 'src', 'data', 'rules.json')
E0, N1, U = -250000.0, 8050000.0, 0.01     # the frame (frame.py) and the unit of the coordinates in km
NM = 1.852
def to_frame(g): return shapely.transform(g, lambda c: np.column_stack([(c[:, 0] - E0) / 1000, (N1 - c[:, 1]) / 1000]))
def enc(coords):
    q = np.round(np.asarray(coords)[:, :2] / U).astype(np.int64); d = np.vstack([q[:1], np.diff(q, axis=0)])
    keep = np.ones(len(d), bool); keep[1:] = np.any(d[1:] != 0, axis=1); return d[keep].ravel().tolist()
def rings(g):
    out = []
    for p in getattr(g, 'geoms', [g]):
        if p.is_empty or p.geom_type != 'Polygon': continue
        out.append([enc(p.exterior.coords)] + [enc(r.coords) for r in p.interiors])
    return out
def lines(g): return [enc(l.coords) for l in getattr(g, 'geoms', [g]) if l.geom_type == 'LineString' and not l.is_empty]
# ---------- the game's land: land200 over everything, the 25 m mask where there are tiles ----------
class Land:
    def __init__(s, d):
        s.d = d; s.man = json.load(open(os.path.join(d, 'manifest.json'))); s.heads = {}
        s.L200, _ = pack.read_layer(d, 'land200'); s.L200 = s.L200 > 0
    def head(s, p):
        if p['file'] not in s.heads:
            data = open(os.path.join(s.d, p['file']), 'rb').read(); hl = int.from_bytes(data[4:8], 'little'); s.heads[p['file']] = (json.loads(data[8:8 + hl]), data, 8 + hl)
        return s.heads[p['file']]
    # water (True) over a box in km at cell c (0.2 from land200, 0.05 from the 25 m mask: water when any of the four is water)
    def water(s, x0, y0, x1, y1, c):
        if c >= 0.2:
            i0, j0, i1, j1 = int(x0 / 0.2), int(y0 / 0.2), int(math.ceil(x1 / 0.2)), int(math.ceil(y1 / 0.2))
            return ~s.L200[j0:j1, i0:i1], i0 * 0.2, j0 * 0.2
        L = s.man['layers']['mask']; n = L['n']; k = round(c / L['c'])
        i0, j0 = int(x0 / c) * k, int(y0 / c) * k; i1, j1 = int(math.ceil(x1 / c)) * k, int(math.ceil(y1 / c)) * k
        M = np.repeat(np.repeat(s.L200[j0 // 8:(j1 + 7) // 8, i0 // 8:(i1 + 7) // 8], 8, 0), 8, 1)
        M = M[j0 - (j0 // 8) * 8:, i0 - (i0 // 8) * 8:][:j1 - j0, :i1 - i0].astype(np.uint8).copy()   # land200 where no tile has the mask
        for p in s.man['packs']:
            if p['kind'] != 'sim' or not p['box']: continue
            bx = p['box']
            if bx[2] <= x0 or bx[0] >= x1 or bx[3] <= y0 or bx[1] >= y1: continue
            head, data, at = s.head(p)
            for l, bx_, by_, off, ln, *_ in head['blocks']:
                if l != 'mask': continue
                gi, gj = bx_ * n, by_ * n
                if gi + n <= i0 or gi >= i1 or gj + n <= j0 or gj >= j1: continue
                import zlib
                blk = np.frombuffer(zlib.decompress(data[at + off:at + off + ln], -15), np.uint8).reshape(n, n)
                a0, b0 = max(gi, i0), max(gj, j0); a1, b1 = min(gi + n, i1), min(gj + n, j1)
                M[b0 - j0:b1 - j0, a0 - i0:a1 - i0] = blk[b0 - gj:b1 - gj, a0 - gi:a1 - gi] > 0
        ny, nx = M.shape[0] // k, M.shape[1] // k
        W = (M[:ny * k, :nx * k].reshape(ny, k, nx, k) == 0).any(axis=(1, 3))
        return W, i0 // k * c, j0 // k * c
# a class per cell of the sea, the land given the class of the nearest sea, and the polygon of one class traced and simplified
def spread(W, cls):
    idx = ndimage.distance_transform_edt(~W, return_distances=False, return_indices=True)
    return cls[idx[0], idx[1]]
def trace(mask, ox, oy, c, tol):
    z = np.pad(mask.astype(np.float32), 1)
    gen = contourpy.contour_generator(z=z, fill_type=contourpy.FillType.OuterOffset, line_type=contourpy.LineType.Separate)
    pts, offs = gen.filled(0.5, 1.5); polys = []
    for P, O in zip(pts, offs):
        rr = [P[O[i]:O[i + 1]] for i in range(len(O) - 1)]
        rr = [np.column_stack([ox + (r[:, 0] - 0.5) * c, oy + (r[:, 1] - 0.5) * c]) for r in rr if len(r) >= 4]
        if rr: polys.append(Polygon(rr[0], rr[1:]))
    g = shapely.union_all([p.buffer(0) for p in polys]) if polys else Polygon()
    return g.simplify(tol, preserve_topology=True)
# the corners of g within d of the lines put on them, so the edges across the sea lie on the lines
def snap(g, ln, d):
    if ln is None or ln.is_empty: return g
    def f(c):
        P = shapely.points(c); dist = shapely.distance(P, ln); near = dist < d
        if near.any():
            q = shapely.get_point(shapely.shortest_line(P[near], ln), 1)
            c = c.copy(); c[near] = shapely.get_coordinates(q)
        return c
    return shapely.transform(g, f).buffer(0)
# ---------- the sources ----------
def gml(path):
    t = open(path, encoding='utf8').read(); out = []
    for m in re.finditer(r'<gml:featureMember>(.*?)</gml:featureMember>', t, re.S):
        b = m.group(1); ty = re.search(r'<app:(\w+) gml:id', b).group(1)
        land = re.search(r'<app:land>([^<]*)', b); zone = re.search(r'<app:soneNautisk>([^<]*)', b)
        parts = [np.array(p.split(), float).reshape(-1, 2) for p in re.findall(r'<gml:posList[^>]*>([^<]*)', b)]
        out.append(dict(type=ty, land=land and land.group(1), zone=zone and zone.group(1), parts=parts))
    return out
def mainland(parts):   # the mainland's lines (Svalbard, Jan Mayen and Bouvet lie outside 57-72 N in the frame's terms)
    return [p for p in parts if len(p) > 1 and 6400e3 < p[:, 1].mean() < 7990e3 and -150e3 < p[:, 0].mean() < 1200e3]
def baseline(G):
    pts = []
    for f in G:
        if f['type'] == 'Grunnlinje' and f['land'] == 'NO': pts += mainland(f['parts'])
    L = shapely.line_merge(MultiLineString([LineString(p) for p in pts])); return to_frame(L)
def official_nm(G):
    out = {}
    for f in G:
        k = {'Territorialgrense': '12', 'YttergrenseTilstøtendeSone': '24'}.get(f['type']) or (f['zone'] if f['type'] == 'LovVirkeområdeGrense' else None)
        if not k: continue
        ls = [LineString(p) for p in mainland(f['parts'])]
        if ls: out.setdefault(k, []).extend(ls)
    return {k: to_frame(shapely.line_merge(MultiLineString(v))) for k, v in out.items()}
def fd(lid, service='fiske'):
    d = json.load(open(os.path.join(CACHE, f'fd-{service}-{lid}.geojson')))
    return [(to_frame(shape(x['geometry'])), x['properties']) for x in d['features'] if x.get('geometry')]
# ---------- the attributes kept ----------
SKIP = re.compile(r'^(objectid.*|globalid|iid|id|uuid|shape.*|st_.*|geom.*|.*_count|symbol|areal.*|kystkontur_lengde|sjoareal|i_bruk_av.*|jmelding_id|esri_oid|'
                  r'gmlid|creator_uuid|last_modified_by|create_date|modify_date|end_date|keep_history.*|is_active.*|config|erstatt.*|vurderes.*|'
                  r'bounds_bbox|stengt|type|kat_omraade|kat_ordning|kat_arttype|fmelding_id|jmelding_erstat.*|paragrafantall|omraade_stengt|label)$', re.I)
# the WFS (fetch.py's fallback) names the same fields otherwise
REN = {'Navn': 'navn', 'Beskrivelse': 'beskrivelse', 'Type_': 'type_text', 'Ordning': 'kat_ordning_text', 'Fiskeart': 'kat_arttype_text',
       'J-melding_url': 'url', 'J-melding__gjelder_fra_': 'jmelding_fra_dato', 'J-melding__gjelder_til_': 'jmelding_til_dato', 'Område': 'kat_omraade_text',
       'Paragraf': 'paragraf', 'Stengt_dato': 'stengt_dato', 'Stengt_': 'stengt_text'}
def attrs(p):
    a = {}
    for k, v in p.items():
        k = REN.get(k, k)
        if v in ('None', 'null'): continue
        if isinstance(v, str) and re.fullmatch(r'\d\d\.\d\d\.\d{4}', v): v = f'{v[6:]}-{v[3:5]}-{v[:2]}'
        if v is None or v == '' or SKIP.match(k): continue
        if isinstance(v, str):
            m = re.search(r'href=\\?"([^"\\]+)', v)
            if m: v = m.group(1)
            v = re.sub(r'<[^>]+>', ' ', v).strip()
            if re.fullmatch(r'\d{12,13}', v): v = int(v)
        if isinstance(v, (int, float)) and re.search(r'dato|tid_start|tid_stopp|gjelder', k) and abs(v) > 1e11:
            v = datetime.datetime.fromtimestamp(v / 1000, datetime.timezone.utc).date().isoformat()
        if isinstance(v, str) and len(v) > 700: v = v[:700] + '…'
        a[k] = v
    return a
# ---------- the parts ----------
def inside_baseline(bl):
    c = list(bl.coords)
    if c[0][1] < c[-1][1]: c = c[::-1]   # from Sweden (south) to Russia (north)
    s, e = c[0], c[-1]
    ring = c + [(e[0] + 400, e[1]), (e[0] + 400, s[1] + 300), (s[0] + 150, s[1] + 300), (s[0] + 150, s[1])]
    return Polygon(ring).buffer(0)
def nm_lines(bl, blin, official):
    out = {k: lines(v) for k, v in official.items()}
    for k in (2,):
        b = shapely.union_all([blin, bl.buffer(k * NM, quad_segs=16)]).exterior
        keep = shapely.distance(shapely.points(np.array(b.coords)), bl) < k * NM + 0.05
        segs, cur = [], []
        for pt, kp in zip(b.coords, keep):
            if kp: cur.append(pt)
            elif len(cur) > 1: segs.append(LineString(cur)); cur = []
            else: cur = []
        if len(cur) > 1: segs.append(LineString(cur))
        out[str(k)] = lines(MultiLineString(segs).simplify(0.02))
    return out
KINDS = {'F': (2, 'fjordlinje'), 'K': (5, 'krok'), 'O': (38, 'Oslofjorden')}
# the lines as walls in the sea W (cells of c km from ox, oy); each wall cell knows its line. A line ends on a point of land that the
# 200 m land may not have (a holm, a narrow sound filled in or bridged): each end goes on in the line's direction until it reaches land,
# at least 0.2 km and at most 2.5 km
def walls(L, W, ox, oy, c):
    wall = np.full(W.shape, -1, np.int32); ny, nx = W.shape; geo = []; wk = np.zeros(W.shape, np.uint8); kb = {}
    # the big land (20 km² or more): a line that ends on a holm or a skerry (Akanes – Gisløy) goes on to the nearest big land, since the
    # regulation closes the fjord with the line and the coast, and the sounds through the skerries behind the holm are not the open sea
    ll, nl = ndimage.label(~W, structure=np.ones((3, 3))); sz = np.bincount(ll.ravel()) * c * c; sz[0] = 0
    big = sz[ll] >= 20; _, bidx = ndimage.distance_transform_edt(~big, return_indices=True)
    def to_big(e):
        j, i = cell(*e); r = max(1, int(0.6 / c))
        if big[max(0, j - r):j + r + 1, max(0, i - r):i + r + 1].any(): return None
        bj, bi = bidx[0][j, i], bidx[1][j, i]; q = np.array([ox + (bi + 0.5) * c, oy + (bj + 0.5) * c])
        return q if np.hypot(*(q - e)) < 8 else None
    cell = lambda x, y: (min(ny - 1, max(0, int((y - oy) / c))), min(nx - 1, max(0, int((x - ox) / c))))
    def reach(e, d):
        d = d / (np.hypot(*d) or 1)
        for t in np.arange(0.025, 2.5, 0.025):
            q = e + d * t
            if t >= 0.2 and not W[cell(*q)]: return q + d * 0.1
        return e + d * 2.5
    for n, (k, i, l, p) in enumerate(L):
        a = np.array(l.coords)
        a = np.vstack([reach(a[0], a[0] - a[1])[None], a, reach(a[-1], a[-1] - a[-2])[None]])
        segs = [(a[q], a[q + 1]) for q in range(len(a) - 1)]
        t = to_big(np.array(l.coords[0]))
        if t is not None: segs.append((t, np.array(l.coords[0])))   # oriented as the line runs, so its sides stay the line's sides
        t = to_big(np.array(l.coords[-1]))
        if t is not None: segs.append((np.array(l.coords[-1]), t))
        geo.append(segs)
        for A, B in segs:
            a = np.array([A, B]); q = 0
            s = max(2, int(np.hypot(*(a[q + 1] - a[q])) / (c * 0.25)))
            xs = np.linspace(a[q][0], a[q + 1][0], s); ys = np.linspace(a[q][1], a[q + 1][1], s)
            ii = ((xs - ox) / c).astype(int); jj = ((ys - oy) / c).astype(int)
            for di, dj in ((0, 0), (1, 0), (0, 1)):   # 4-connected sea cannot slip past
                wall[np.clip(jj + dj, 0, ny - 1), np.clip(ii + di, 0, nx - 1)] = n
                wk[np.clip(jj + dj, 0, ny - 1), np.clip(ii + di, 0, nx - 1)] |= kb.setdefault(k, 1 << len(kb))
    return wall, geo, wk, kb
def zones(land, groups):
    out, info = [], []
    for kinds in groups:
        L = []
        for k in kinds:
            for i, (g, p) in enumerate(fd(KINDS[k][0])):
                for l in getattr(g, 'geoms', [g]): L.append((k, i, l, p))
        x0, y0, x1, y1 = shapely.union_all([l for _, _, l, _ in L]).bounds; m = 40
        W, ox, oy = land.water(max(0, x0 - m), max(0, y0 - m), x1 + m, y1 + m, 0.2); c = 0.2
        wall, geo, wk, kb = walls(L, W, ox, oy, c)
        sea = W & (wall < 0)
        lab, nl = ndimage.label(sea)
        sizes = np.bincount(lab.ravel()); sizes[0] = 0; ocean = int(sizes.argmax())
        # the parts of the sea next to each wall, and on which side of its line each lies (by the nearest piece of the line). Small
        # pockets the wall cut off (under 3 km²) are one with the biggest part on the same side of the same line; parts meet across a
        # line where the same wall cell has them on its two sides
        # (only the cells right next to a wall, so no cell sees past another line where two lines cross; the cells where lines of two
        # kinds lie on each other are left out, and the 3 x 3 blocks of a wall pair the parts on its two sides)
        one = np.isin(wk, [1, 2, 4, 8])
        js, is_ = np.nonzero((wall >= 0) & one); wn = wall[js, is_]; widx = (js // 3) * 100000 + is_ // 3
        rows = []
        for dj, di in ((-1, 0), (1, 0), (0, -1), (0, 1), (-1, -1), (1, 1), (-1, 1), (1, -1)):
            qj, qi = np.clip(js + dj, 0, W.shape[0] - 1), np.clip(is_ + di, 0, W.shape[1] - 1); a = lab[qj, qi]; ok = a > 0
            for n in np.unique(wn[ok]):
                sel = ok & (wn == n); P0 = np.array([g[0] for g in geo[n]]); P1 = np.array([g[1] for g in geo[n]])
                Q = np.column_stack([ox + (qi[sel] + 0.5) * c, oy + (qj[sel] + 0.5) * c]); D = P1 - P0
                t = np.clip(((Q[:, None, :] - P0[None]) * D[None]).sum(2) / np.maximum((D * D).sum(1), 1e-12)[None], 0, 1)
                near = P0[None] + t[..., None] * D[None]; k = np.argmin(((Q[:, None, :] - near) ** 2).sum(2), axis=1)
                side = (D[k, 0] * (Q[:, 1] - P0[k, 1]) - D[k, 1] * (Q[:, 0] - P0[k, 0]) > 0).astype(np.int64)
                rows.append(np.column_stack([widx[sel], np.full(sel.sum(), n), a[sel], side]))
        R4 = np.unique(np.vstack(rows), axis=0) if rows else np.zeros((0, 4), np.int64)
        area = sizes * c * c
        par = list(range(nl + 1))
        def find(a, par=par):
            while par[a] != a: par[a] = par[par[a]]; a = par[a]
            return a
        by_line = {}
        for w_, n, x, sd in R4: by_line.setdefault(int(n), ([], []))[int(sd)].append(int(x))
        by_line = {n: (sorted(set(a)), sorted(set(b))) for n, (a, b) in by_line.items()}
        for n, grps in by_line.items():
            for g in grps:
                if not g: continue
                big = max(g, key=lambda x: area[x])
                for x in g:
                    if x != big and area[x] < 3: par[find(x)] = find(big)
        root = lambda x: find(x)
        cross = set()
        order = np.lexsort((R4[:, 1], R4[:, 0])); R4 = R4[order]
        cuts = np.flatnonzero(np.diff(R4[:, 0]) | np.diff(R4[:, 1])) + 1
        for grp in np.split(R4, cuts):
            if not len(grp): continue
            n = int(grp[0, 1]); A = {root(int(x)) for x, sd in grp[:, 2:] if sd == 0}; B = {root(int(x)) for x, sd in grp[:, 2:] if sd == 1}
            ks = kb[L[n][0]]
            for a in A:
                for b in B:
                    if a != b: cross.add((ks, min(a, b), max(a, b), n))
        cross = sorted(cross)
        touched = sorted({root(x) for sa, sb in by_line.values() for x in sa + sb} - {root(ocean)})
        # a part is inside the kind k when the open sea is out of reach without crossing a line of kind k (F and O; the hook lines K are
        # walls, and B marks the parts inside the fjord lines on the outer side of a hook line, which are free of the hook limit from
        # 1 November to 30 April: høstingsforskriften § 33 andre ledd. The outer side is the one nearer the baseline, since a hook line
        # need not close its fjord on its own: Porsangerfjorden's runs to Magerøya, and Magerøysundet stays open behind it)
        flags = {x: '' for x in touched}
        for k in [k for k in kinds if k != 'K']:
            pk = list(range(nl + 1))
            def fk(a):
                while pk[a] != a: pk[a] = pk[pk[a]]; a = pk[a]
                return a
            for ks, a, b, n in cross:
                if not ks & kb.get(k, 0): pk[fk(a)] = fk(b)
            for x in touched:
                if fk(x) != fk(root(ocean)): flags[x] += k
        if 'K' in kinds:
            blg = baseline(gml(os.path.join(CACHE, 'nmg-25833.gml')))
            for n, (sa, sb) in by_line.items():
                if L[n][0] != 'K': continue
                A = np.array(L[n][2].coords); mid = len(A) // 2; d = A[mid] - A[mid - 1]; d = d / (np.hypot(*d) or 1); m = (A[mid] + A[mid - 1]) / 2
                nrm = np.array([-d[1], d[0]]); pa, pb = m + nrm * 2, m - nrm * 2
                sgn = lambda q: int(d[0] * (q[1] - A[mid - 1][1]) - d[1] * (q[0] - A[mid - 1][0]) > 0)
                outer = sgn(pa) if shapely.distance(shapely.Point(*pa), blg) < shapely.distance(shapely.Point(*pb), blg) else sgn(pb)
                for x in (sa, sb)[outer]:
                    r = root(x)
                    if r in flags and 'F' in flags[r] and 'B' not in flags[r]: flags[r] += 'B'
        # the class of every cell: the part's root for parts inside something, 0 for the sea outside, and the land as its nearest sea
        R = np.array([find(x) for x in range(nl + 1)], np.int32); RL = R[lab]; RL[lab == 0] = 0
        keepn = {x for x in touched if flags[x]}
        cls = np.where(np.isin(RL, list(keepn)), RL, 0).astype(np.int32)
        known = sea & ((cls > 0) | (RL == root(ocean)) | ~np.isin(RL, touched))
        C = spread(known, cls)
        allL = shapely.union_all([l for _, _, l, _ in L])
        for x in sorted(keepn):
            js, is_ = np.nonzero(C == x)
            if not len(js): continue
            j0, j1, i0, i1 = max(0, js.min() - 2), js.max() + 3, max(0, is_.min() - 2), is_.max() + 3
            g = trace(C[j0:j1, i0:i1] == x, ox + i0 * c, oy + j0 * c, c, 0.12)
            g = snap(g, allL, 0.45)
            ln = sorted({n for n, (sa, sb) in by_line.items() if x in [root(y) for y in sa + sb]})
            refs = [f'{L[n][0]}{L[n][1]}' for n in ln]
            area = float(np.count_nonzero(RL == x)) * c * c
            out.append(dict(f=flags[x], l=refs, km2=round(area, 1), r=rings(g)))
            info.append((flags[x], refs, round(area), shapely.get_num_coordinates(g)))
    return out, info
# the areas that follow the shore: the sea inside (cell centres in the polygon) and the land given to the nearest sea's side
def raster(g, ox, oy, c, shape):
    im = Image.new('1', (shape[1], shape[0]), 0); d = ImageDraw.Draw(im)
    tf = lambda r: [((x - ox) / c - 0.5, (y - oy) / c - 0.5) for x, y in r.coords]
    for p in getattr(g, 'geoms', [g]):
        if p.geom_type != 'Polygon' or p.is_empty: continue
        d.polygon(tf(p.exterior), fill=1)
        for h in p.interiors: d.polygon(tf(h), fill=0)
    return np.array(im, bool)
def through_land(land, g, tol=0.04):
    x0, y0, x1, y1 = g.bounds; m = 3; c = 0.05 if (x1 - x0) * (y1 - y0) < 150 * 150 else 0.1
    W, ox, oy = land.water(max(0, x0 - m), max(0, y0 - m), x1 + m, y1 + m, c)
    inn = W & raster(g, ox, oy, c, W.shape)
    # the sea just outside the polygon along its shore is where the game's shore and the source's disagree: it counts as land
    near = ndimage.binary_dilation(inn, iterations=max(1, round(0.08 / c)))
    K = W & ~(near & ~inn)
    C = spread(K, inn.astype(np.int32)); h = trace(C == 1, ox, oy, c, tol); h = snap(h, g.boundary, 2 * c)
    # how well it holds: the sea cells that change side
    strip = near & ~inn & W
    bad = np.count_nonzero(((W & raster(h, ox, oy, c, W.shape)) != inn) & ~strip)
    return h, bad / max(1, np.count_nonzero(W & ~strip))
BIG = 400   # an area with more corners than this, near the coast, is drawn through the land
# the layers the game uses: only what concerns its species (cod, haddock, saithe, pollack, ling, tusk, redfish, halibut, brown crab)
# and its gear (jig, line, net, pot), and king crab, which is coming (Jonas 04.10.2026: «Kongekrabbe skal kunne fiskes i spillet»). Left
# out (Jonas 04.10.2026: no lobster, nothing for species the game does not have): lobster (9, 10), oysters (15), the fjord lines' points (3, the lines carry the names), wrasse (17), beaked redfish (20), plaice (40), wolffish (34), sea ranching (27), trawl and
# seine (4, 11, 13, 14, 32, 33, 35, 36), Svalbard (25, 26). Of 0 the closed fields for conventional gear, of 7 the halibut area (§ 40).
KEEP = {0, 1, 2, 5, 6, 7, 8, 12, 16, 18, 19, 24, 28, 29, 30, 31, 37, 38, 39}
def keep_feat(lid, a):
    if lid == 0: return re.search(r'line|garn|konvensjonell|alle', (a.get('type_text') or '') + ' ' + (a.get('kat_ordning_text') or ''), re.I) is not None
    if lid == 7: return 'kveite' in (a.get('navn') or '').lower()
    return True
def layers(land):
    meta = json.load(open(os.path.join(CACHE, 'fd-meta.json'))); out = {}; log = []
    for m in meta['layers']:
        if m['service'] != 'Fiskerireguleringer': continue
        lid = m['id']; feats = []
        if lid not in KEEP: continue
        for g, p in fd(lid):
            a = attrs(p)
            if not keep_feat(lid, a): continue
            poly = g.geom_type in ('Polygon', 'MultiPolygon')
            n0 = shapely.get_num_coordinates(g); how = ''
            far = g.bounds[1] < 0 or g.bounds[3] > 1800 or g.bounds[0] < 0 or g.bounds[2] > 1450   # Svalbard, Bouvet, the open sea
            coast = poly and not far and land.L200[int(max(0, g.bounds[1]) / 0.2):int(g.bounds[3] / 0.2) + 1, int(max(0, g.bounds[0]) / 0.2):int(g.bounds[2] / 0.2) + 1].any()
            if coast and n0 > BIG:
                g2, bad = through_land(land, g); how = f'gjennom land, {bad * 100:.2f} % av sjøcellene bytter side'
            else:
                g2 = g.simplify(0.2 if far else 0.05 if poly and not coast else 0.02, preserve_topology=True)
            f = {'a': a}
            if poly: f['r'] = rings(g2)
            elif g.geom_type in ('LineString', 'MultiLineString'): f['l'] = lines(g2)
            else: f['p'] = [enc(np.array([pt.coords[0] for pt in getattr(g2, 'geoms', [g2])]))]
            feats.append(f); log.append(f'{lid:>2} {n0:>7} -> {shapely.get_num_coordinates(g2):>6} {how}')
        out[str(lid)] = dict(n=m['name'], d=m['desc'][:400], f=feats)
    return out, log
def stats():
    hom = [dict(c=p.get('havomr'), r=rings(g.simplify(0.3, preserve_topology=True))) for g, p in fd(6, 'stati')]
    lok = []
    for g, p in fd(8, 'stati'):
        if g.bounds[2] < 0 or g.bounds[0] > 1450 or g.bounds[3] < 0 or g.bounds[1] > 1750: continue   # outside the game's frame
        lok.append(dict(c=p.get('lokref') or f"{p.get('havomr')}-{p.get('lokasjon')}", r=rings(g.simplify(0.4, preserve_topology=True))))
    return hom, lok
def main():
    t0 = time.time(); md = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, 'tools', 'map', 'out', 'game')
    land = Land(md); G = gml(os.path.join(CACHE, 'nmg-25833.gml'))
    bl = baseline(G); assert bl.geom_type == 'LineString', bl.geom_type
    blin = inside_baseline(bl); off = official_nm(G)
    # checks: the official lines lie at their distance from the baseline, and the inside agrees with Kartverket's land and inner waters
    chk = {}
    for k, v in off.items():
        d = shapely.distance(shapely.points(shapely.get_coordinates(v)), bl); chk[k + ' nm'] = [round(float(np.median(d)) / NM, 3), round(float(np.percentile(d, 99)) / NM, 3)]
    lif = [f for f in G if f['type'] == 'LandIndreFarvann' and f['land'] == 'NO']
    LIF = to_frame(shapely.union_all([Polygon(f['parts'][0], [p for p in f['parts'][1:] if len(p) > 3]).buffer(0) for f in lif]))
    rng = np.random.default_rng(1); X = rng.uniform(150, 1400, 20000); Y = rng.uniform(100, 1600, 20000)
    shapely.prepare(blin); shapely.prepare(LIF)
    sea = ~land.L200[np.clip((Y / 0.2).astype(int), 0, land.L200.shape[0] - 1), np.clip((X / 0.2).astype(int), 0, land.L200.shape[1] - 1)]
    near = shapely.distance(shapely.points(X, Y), bl) < 60
    agree = (shapely.contains_xy(blin, X, Y) == shapely.contains_xy(LIF, X, Y))[sea & near]
    chk['inside baseline vs Kartverket (sea within 60 km)'] = f'{agree.mean() * 100:.2f} % of {agree.size}'
    print(json.dumps(chk, ensure_ascii=False))
    Z, zinfo = zones(land, [('F', 'K'), ('O',)])
    for z in zinfo: print('zone', z)
    Lyr, llog = layers(land)
    for l in llog: print(l)
    hom, lok = stats()
    meta = json.load(open(os.path.join(CACHE, 'fd-meta.json')))
    R = dict(v=1, made=meta['fetched'], unit=U,
             src=dict(fd='Fiskeridirektoratet, Yggdrasil/Fiskerireguleringer og Statistikområder (NLOD), hentet ' + meta['fetched'],
                      nmg='Kartverket, Norges maritime grenser (CC BY 4.0, Geonorge)'),
             bl=enc(bl.coords), blin=rings(blin.simplify(0.05)), nm=nm_lines(bl, blin, off), zones=Z, L=Lyr, hom=hom, lok=lok)
    s = json.dumps(R, separators=(',', ':'), ensure_ascii=False)
    open(OUT, 'w').write(s)
    print(f'{OUT}: {len(s) / 1e6:.2f} MB, {time.time() - t0:.0f} s')
if __name__ == '__main__':
    main()
