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

if __name__ == '__main__':
    if sys.argv[1] == 'probe': probe()
