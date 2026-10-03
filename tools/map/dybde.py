# Kartverket's depth along the whole coast (the user's wish 03.10.2026): «Dybdedata – terrengmodeller 50 meters grid landsdekkende»,
# open data (CC BY 4.0) through Geonorge's WCS. Geonorge is closed to the cloud session, so .github/workflows/dybde.yml runs this.
#   python3 tools/map/dybde.py probe          what Geonorge's catalogue lists as WCS for the depth models, and their capabilities
#   python3 tools/map/dybde.py fetch [out]    every coastal tile's 50 m depth (UTM 33) as half metres, into out/depth/ and a .npz each
import os, re, sys, json, time, requests
HERE = os.path.dirname(os.path.abspath(__file__))
S = requests.Session(); S.headers['User-Agent'] = 'kystfiske-depth/1 (github.com/average01101010/FishyBusiness-)'
CFG = json.load(open(os.path.join(HERE, 'dybde.json')))

def get(url, **kw):
    for k in range(4):
        try:
            r = S.get(url, timeout=(20, 240), **kw); return r
        except Exception as e:
            if k == 3: raise
            time.sleep(5 * (k + 1))

def probe():
    # the catalogue's search for the depth models, and every WCS or WMS address it gives
    urls = set(CFG.get('candidates', []))
    for q in ('dybdedata terrengmodeller', 'dybdedata terrengmodell 50', 'bathymetry 50m'):
        try:
            r = get('https://kartkatalog.geonorge.no/api/search', params={'text': q, 'limit': 50})
            print('catalogue', q, r.status_code, flush=True)
            J = r.json()
            for res in J.get('Results', []):
                t = res.get('Title', ''); 
                if not re.search(r'dybde|bathy|havbunn', t, re.I): continue
                print('  ', t, '|', res.get('Uuid'), '|', res.get('DistributionProtocol'), '|', res.get('DistributionUrl') or res.get('GetCapabilitiesUrl') or res.get('ServiceUrl'), flush=True)
                for k in ('DistributionUrl', 'GetCapabilitiesUrl', 'ServiceUrl', 'ServiceDistributionUrlForDataset'):
                    v = res.get(k)
                    if v and 'http' in str(v): urls.add(str(v).split('?')[0])
        except Exception as e:
            print('catalogue failed', q, repr(e)[:200], flush=True)
    for u in sorted(urls):
        for svc in ('WCS', 'WMS'):
            try:
                r = get(u, params={'service': svc, 'request': 'GetCapabilities'})
                body = r.text
                ids = re.findall(r'<(?:wcs:)?CoverageId>([^<]+)<|<(?:wcs:)?Identifier>([^<]+)<|<Name>([^<]+)</Name>', body)
                names = sorted({a or b or c for a, b, c in ids})[:40]
                print('caps', svc, u, r.status_code, len(body), names, flush=True)
                if svc == 'WCS' and r.ok and 'Coverage' in body: print(body[:3000], flush=True)
            except Exception as e:
                print('caps failed', svc, u, repr(e)[:200], flush=True)

# the coverage's description: its axis labels, CRS, extent and cell size
def describe():
    r = get(CFG['wcs'], params={'service': 'WCS', 'version': '2.0.1', 'request': 'DescribeCoverage', 'coverageId': CFG['coverage']})
    t = r.text; print('describe', r.status_code, len(t), flush=True); print(t[:4000], flush=True)
    ax = re.search(r'axisLabels="([^"]+)"', t); srs = re.search(r'srsName="([^"]+)"', t)
    lo = re.search(r'<gml:lowerCorner>([^<]+)<', t); hi = re.search(r'<gml:upperCorner>([^<]+)<', t)
    return {'axes': ax.group(1).split() if ax else ['x', 'y'], 'srs': srs.group(1) if srs else '', 'lo': lo and lo.group(1), 'hi': hi and hi.group(1)}

# a tile's 50 m cells as a GeoTIFF (subset in UTM 33, scaled to 1000 x 1000 so the cells are the game's), as float32 rows north first
def tile_tif(tx, ty, D, verbose):
    import tifffile, io, numpy as np
    e0 = tx * 50000 - 250000; n1 = 8050000 - ty * 50000; e1, n0 = e0 + 50000, n1 - 50000
    a, b = D['axes'][:2]; crs = 'http://www.opengis.net/def/crs/EPSG/0/25833'
    q = [('service', 'WCS'), ('version', '2.0.1'), ('request', 'GetCoverage'), ('coverageId', CFG['coverage']), ('format', 'image/tiff'),
         ('subset', f'{a}({e0},{e1})'), ('subset', f'{b}({n0},{n1})'), ('scaleSize', f'{a}(1000),{b}(1000)')]
    if '25833' not in D['srs']: q += [('subsettingCrs', crs), ('outputCrs', crs)]
    r = get(CFG['wcs'], params=q)
    if verbose: print('  get', r.status_code, r.headers.get('content-type'), len(r.content), r.url[:300], flush=True)
    if not r.ok or b'II*' not in r.content[:4] and b'MM\x00*' not in r.content[:4]:
        print('  not a tiff', tx, ty, r.status_code, r.content[:600], flush=True); return None
    with tifffile.TiffFile(io.BytesIO(r.content)) as T:
        pg = T.pages[0]; A = pg.asarray().astype(np.float32)
        nod = pg.tags.get(42113); nod = float(nod.value) if nod is not None else None
        if verbose: print('  tiff', A.shape, pg.dtype, 'nodata', nod, {t.name: str(t.value)[:120] for t in pg.tags.values() if t.code in (33550, 33922, 34735)}, flush=True)
    if A.ndim == 3: A = A[..., 0]
    if nod is not None: A[A == nod] = np.nan
    A[np.abs(A) > 20000] = np.nan
    return A

# every coastal tile: the depth model's value (as the coverage gives it, metres, negative under the sea) in decimetres as int16, -32768
# where the coverage has no data; and depth/manifest.json with each tile's range and share of cells with data
def fetch(out):
    import numpy as np
    os.makedirs(out, exist_ok=True); D = describe(); print('coverage', D, flush=True)
    man = {'source': 'Kartverket, Dybdedata - terrengmodeller 50 meters grid (CC BY 4.0), ' + CFG['wcs'] + ' ' + CFG['coverage'],
           'cell': 50, 'unit': 'dm', 'nodata': -32768, 'tiles': {}}
    t0 = time.time()
    for k, (tx, ty) in enumerate(CFG['tiles']):
        try: A = tile_tif(tx, ty, D, k < 2)
        except Exception as e: print('  failed', tx, ty, repr(e)[:300], flush=True); A = None
        if A is None: continue
        ok = np.isfinite(A); Z = np.where(ok, np.clip(np.round(A * 10), -32000, 32000), -32768).astype(np.int16)
        np.savez_compressed(os.path.join(out, f'{tx}_{ty}.npz'), z=Z)
        st = {'n': int(ok.sum()), 'shape': list(A.shape)}
        if ok.any(): st.update(lo=round(float(np.nanmin(A)), 1), hi=round(float(np.nanmax(A)), 1), neg=int((A[ok] < 0).sum()))
        man['tiles'][f'{tx},{ty}'] = st
        print(f'{k + 1}/{len(CFG["tiles"])}', tx, ty, st, f'{time.time() - t0:.0f}s', flush=True)
    if man['tiles']: json.dump(man, open(os.path.join(out, 'manifest.json'), 'w'), indent=0)
    print('done', len(man['tiles']), 'tiles', flush=True)

if __name__ == '__main__':
    if sys.argv[1] == 'probe': probe()
    elif sys.argv[1] == 'fetch': fetch(sys.argv[2] if len(sys.argv) > 2 else os.path.join(HERE, 'out', 'depth'))
