# Kystverket's «Referanseruter for navigasjon» (Geonorge 25b83fc1-f2bd-4052-bd2d-bd949ac0f402, NLOD 2.0), fetched from Actions because
# the hosts are closed to the cloud sessions (steg 107, 12.11.2026): the API's swagger, every path in it that needs no parameter, the
# WMS capabilities and the WFS on a3cloudmap (the Geonorge coverage link). Only to read what the data holds (does a route give the
# direction of buoyage at the lateral marks?); nothing here goes into the game.
#   python3 tools/ci/referanseruter.py out/rr      then tar it into the release sjomerker-kilde (.github/workflows/referanseruter.yml)
import json, os, re, sys, urllib.parse, urllib.request

OUT = sys.argv[1] if len(sys.argv) > 1 else 'out/rr'
os.makedirs(OUT, exist_ok=True)
BASE = 'https://kystverket.avadaptive.no'
log = []


def get(url, name):
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'kystfiske-ci', 'Accept': 'application/json, application/geo+json, */*'})
        with urllib.request.urlopen(req, timeout=90) as r:
            b = r.read()
        with open(os.path.join(OUT, name), 'wb') as f:
            f.write(b)
        log.append('%s %d %s' % (name, len(b), url))
        return b
    except Exception as e:
        log.append('%s FAIL %s %s' % (name, url, e))
        return None


safe = lambda s: re.sub(r'[^A-Za-z0-9._-]+', '_', s)[:120]
get(BASE + '/api/kyv/routeinfo/swagger/index.html', 'swagger_index.html')
spec = None
for u in ['/api/kyv/routeinfo/swagger/v1/swagger.json', '/api/kyv/routeinfo/swagger/swagger.json', '/api/kyv/routeinfo/swagger.json',
          '/api/kyv/routeinfo/swagger/v1.0/swagger.json', '/api/kyv/routeinfo/swagger/v2/swagger.json']:
    b = get(BASE + u, 'spec_' + safe(u))
    if b:
        try:
            spec = json.loads(b); break
        except Exception:
            pass
if spec:
    srv = (spec.get('servers') or [{}])[0].get('url', '') or spec.get('basePath', '')
    pre = srv if srv.startswith('http') else BASE + srv
    for p, ops in (spec.get('paths') or {}).items():
        if 'get' not in ops:
            continue
        need = [q for q in ops['get'].get('parameters', []) if q.get('required')]
        if '{' in p or need:
            log.append('SKIP %s (parameters %s)' % (p, [q.get('name') for q in need]))
            continue
        b = get(pre + p, 'p_' + safe(p) + '.json')
        if b and b'"limit"' not in b and 'collections/' in p:
            get(pre + p + ('&' if '?' in p else '?') + 'limit=10000', 'p_' + safe(p) + '_all.json')
# an OGC API Features root, wherever it is
for u in ['/api/kyv/routeinfo', '/api/kyv/routeinfo/collections', '/api/kyv/routeinfo/ogc/collections', '/api/kyv/routeinfo/v1/collections']:
    b = get(BASE + u + ('?f=json' if 'collections' in u else ''), 'ogc_' + safe(u) + '.json')
    if b and 'collections' in u:
        try:
            for c in json.loads(b).get('collections', []):
                cid = c.get('id')
                if cid:
                    get(BASE + u + '/' + urllib.parse.quote(cid) + '/items?f=json&limit=10000', 'items_' + safe(cid) + '.json')
        except Exception as e:
            log.append('collections parse %s' % e)
get(BASE + '/api/mapserver/v1/wms/routeinfo-wms?service=WMS&version=1.3.0&request=GetCapabilities', 'wms_caps.xml')
W = 'https://a3cloudmap.kystverket.no/wfs.ashx'
caps = get(W + '?service=WFS&request=GetCapabilities', 'wfs_caps.xml')
if caps:
    for t in sorted(set(re.findall(rb'<(?:wfs:)?Name>([^<]*)</(?:wfs:)?Name>', caps))):
        t = t.decode()
        if 'route' not in t.lower() and 'rute' not in t.lower():
            continue
        q = urllib.parse.urlencode({'service': 'WFS', 'version': '1.1.0', 'request': 'GetFeature', 'typeName': t, 'srsName': 'EPSG:4326'})
        get(W + '?' + q, 'wfs_' + safe(t) + '.xml')
        q = urllib.parse.urlencode({'service': 'WFS', 'version': '2.0.0', 'request': 'DescribeFeatureType', 'typeNames': t})
        get(W + '?' + q, 'wfsdesc_' + safe(t) + '.xml')
open(os.path.join(OUT, 'log.txt'), 'w').write('\n'.join(log) + '\n')
print('\n'.join(log))
