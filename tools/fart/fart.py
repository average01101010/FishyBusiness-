# The speed limits at sea (Ø11.8, docs/systemer/sjofart-og-lover.md kap. 9) -> src/data/fart.json and src/data/fart-r.b64, read by
# core/05e-sjovei.js (fartAt).
#
#   havn  Jonas' choice V4 A (28.10.2026): «En fast grense i havnene hvis Kystverket ikke har et åpent datasett.» One fixed limit within a
#         radius of every harbour point the game has (PORTS, core/01-world.js); the game makes the zones itself. Since 12.11.2026 it holds
#         only where the state's areas below do not (Jonas: «enig med ditt forslag»: the regulation's areas where they are, the harbour's
#         5 knots where the regulation says nothing).
#   omr   The state's speed limits for commercial vessels: Kystverket's «For næringsfartøy - statlige fartsgrenser på sjøen etter HFL»
#         (FOR-2021-12-16-3622; Geonorge 27ff409b-29ad-49df-9d1c-f795c2e707b2, the WFS layer layer_723 on services.kystverket.no),
#         Norsk lisens for offentlige data (NLOD) 2.0: the source is named in the handbook and on the sources page. 74 areas, 2.5 million
#         points in UTM 33 (EPSG:32633, the game's own projection: x = E + 250 km, y = 8 050 km - N). Too many to ship as rings, so each
#         area is rasterised at R metres in the game's frame and kept as runs per row (the 50-200 m belts from land are 3-10 cells wide).
#
#   python3 tools/fart/fart.py                 fetch the layer from the WFS and write both files
#   python3 tools/fart/fart.py layer_723.gml   the same from a GML already fetched
#
# fart.json: {v, src, lic, havn:{kn, r}, R, omr:[{n, kn, s, b, x0, y0, W, H}], sb}: n the municipality (gjelderfor), kn the limit,
# s the period [from, to] as month * 100 + day (501 is 1 May) or null for the whole year, b the belt from land in metres (null when the
# area is lines between positions), x0, y0 the first cell (game metres / R) and W, H the cells across and down, sb the bytes in fart-r.
# fart-r.b64: base64 of unsigned LEB128 varints: the number of areas, then for each area and each of its H rows the number of runs and
# for each run the cells from the end of the last one (or the row's start) and its length.
import os, sys, json, math, base64, urllib.request, xml.etree.ElementTree as ET
from PIL import Image, ImageDraw
HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(HERE, '..', '..', 'src', 'data')
WFS = 'https://services.kystverket.no/wfs.ashx?service=WFS&version=1.1.0&request=GetFeature&typeName=layer_723'
HAVN = {'kn': 5, 'r': 0.5}   # knots, and km round the harbour point (the basin and the way in; inHarbour's own disk is 0.6)
R = 20                        # metres a cell
NS = {'gml': 'http://www.opengis.net/gml'}; MS = '{http://mapserver.gis.umn.edu/mapserver}'

def vu(n, out):
    while True:
        b = n & 127; n >>= 7
        if n: out.append(b | 128)
        else: out.append(b); return

def md(s):   # '01.05' -> 501
    d, m = s.split('.'); return int(m) * 100 + int(d)

def areas(path):
    out, B = [], bytearray()
    for ev, el in ET.iterparse(path):
        if el.tag != MS + 'layer_723': continue
        g = lambda k: ((el.find(MS + k).text or '').strip() if el.find(MS + k) is not None else '')
        if g('gjelderforfartoytype') != 'næringsfartøy': el.clear(); continue
        fra, til = g('periodegyldigfra'), g('periodegyldigtil')
        s = None if (fra, til) == ('01.01', '31.12') else [md(fra), md(til)]
        b = g('buffersone_meter'); b = int(b) if b.isdigit() else None
        polys = []
        for p in el.findall('.//gml:Polygon', NS):
            rings = []
            for k, pl in enumerate(p.findall('.//gml:posList', NS)):
                v = [float(a) for a in pl.text.split()]
                rings.append([((v[i] + 250000) / R, (8050000 - v[i + 1]) / R) for i in range(0, len(v), 2)])   # (the game's frame, cells)
            polys.append(rings)
        xs = [q[0] for P in polys for q in P[0]]; ys = [q[1] for P in polys for q in P[0]]
        x0, y0 = math.floor(min(xs)), math.floor(min(ys)); W, H = math.ceil(max(xs)) - x0 + 1, math.ceil(max(ys)) - y0 + 1
        im = Image.new('1', (W, H), 0); dr = ImageDraw.Draw(im)
        for P in polys:   # the outer ring filled, its holes (islands, mostly) cleared
            dr.polygon([(x - x0, y - y0) for x, y in P[0]], fill=1)
            for h in P[1:]: dr.polygon([(x - x0, y - y0) for x, y in h], fill=0)
        px = im.load(); cells = 0
        for y in range(H):
            runs, x = [], 0
            while x < W:
                if px[x, y]:
                    e = x
                    while e < W and px[e, y]: e += 1
                    runs.append((x, e)); x = e
                else: x += 1
            vu(len(runs), B); last = 0
            for a, e in runs: vu(a - last, B); vu(e - a, B); last = e; cells += e - a
        out.append({'n': g('gjelderfor').replace(',', ', ').replace(',  ', ', '), 'kn': int(g('hastighet')), 's': s, 'b': b, 'x0': x0, 'y0': y0, 'W': W, 'H': H, '_cells': cells})
        el.clear()
    return out, B

if __name__ == '__main__':
    src = sys.argv[1] if len(sys.argv) > 1 else None
    if not src:
        src = os.path.join(HERE, 'out', 'layer_723.gml'); os.makedirs(os.path.dirname(src), exist_ok=True)
        print('fetching', WFS); urllib.request.urlretrieve(WFS, src)
    omr, B0 = areas(src)
    # the areas in a fixed order (by name, limit and place), and the runs written again in that order
    order = sorted(range(len(omr)), key=lambda i: (omr[i]['n'], omr[i]['kn'], omr[i]['y0'], omr[i]['x0']))
    # (re-read the runs per area: they were written in the order they came)
    chunks, o = [], 0
    def rd():
        global o
        v = m = 0
        while True:
            c = B0[o]; o += 1; v |= (c & 127) << m; m += 7
            if not c & 128: return v
    for a in omr:
        st = o
        for y in range(a['H']):
            n = rd()
            for _ in range(n): rd(); rd()
        chunks.append(bytes(B0[st:o]))
    B = bytearray(); vu(len(omr), B)
    for i in order: B += chunks[i]
    omr = [omr[i] for i in order]
    for a in omr: print(f"  {a['n']:24s} {a['kn']:>3} kn  {str(a['s'] or 'hele året'):12s} belte {str(a['b'] or '-'):>4} m  {a['W'] * R / 1000:5.1f} x {a['H'] * R / 1000:5.1f} km  {a['_cells'] * R * R / 1e6:7.2f} km²"); a.pop('_cells')
    J = {'v': 2, 'src': "Kystverket, «For næringsfartøy - statlige fartsgrenser på sjøen etter HFL» (FOR-2021-12-16-3622), WFS layer_723; V4 A for the harbours",
         'lic': 'NLOD 2.0', 'havn': HAVN, 'R': R, 'omr': omr, 'sb': len(B)}
    with open(os.path.join(DATA, 'fart.json'), 'w', encoding='utf-8') as f: json.dump(J, f, ensure_ascii=False, separators=(',', ':')); f.write('\n')
    with open(os.path.join(DATA, 'fart-r.b64'), 'w') as f: f.write(base64.b64encode(bytes(B)).decode() + '\n')
    print(f'{len(omr)} areas, {len(B) / 1000:.0f} kB runs ({os.path.getsize(os.path.join(DATA, "fart-r.b64")) / 1000:.0f} kB base64)')
