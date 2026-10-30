# The sources of the rules along the coast (R1 of the rules plan, 04.10.2026), fetched into tools/rules/cache/:
#  - Fiskeridirektoratet's map of the fishing regulations (Yggdrasil/Fiskerireguleringer, ArcGIS REST, 38 layers), as GeoJSON in
#    EPSG:25833, paged (maxRecordCount 2000). Layer 0 (closed fields by J-melding) and 30 (king crab closures) change from week to week.
#  - Fiskeridirektoratet's statistics areas (Yggdrasil/Statistikområder): main areas (layer 6) and locations (layer 8) from 2018.
#  - Kartverket's «Norges maritime grenser» (Geonorge, CC BY 4.0) as GML in EPSG:25833, ordered through Geonorge's download API
#    (the WFS answers 500): the baseline, the 1, 4, 6 and 10 nm lines, the territorial limit (12 nm), the contiguous zone (24 nm).
#   python3 tools/rules/fetch.py [--force]
import os, io, re, sys, json, time, zipfile, requests
HERE = os.path.dirname(os.path.abspath(__file__)); CACHE = os.path.join(HERE, 'cache')
FD = 'https://gis.fiskeridir.no/server/rest/services/Yggdrasil'
GEONORGE = 'https://nedlasting.geonorge.no/api'
NMG_UUID = 'e106adf4-c9d8-4fce-a9b5-7886a4126d23'   # Norges maritime grenser
def get(url, **kw):
    for i in range(5):
        try:
            r = requests.get(url, timeout=300, **kw); r.raise_for_status(); return r
        except requests.RequestException as e:
            if i == 4: raise
            print('  retry', url[:120], e); time.sleep(2 ** (i + 1))
def layers(service):
    return get(f'{FD}/{service}/MapServer', params={'f': 'json'}).json()['layers']
def query(service, lid):
    feats, off = [], 0
    while True:
        p = dict(where='1=1', outFields='*', outSR=25833, f='geojson', returnGeometry='true', resultOffset=off, resultRecordCount=1000)
        d = get(f'{FD}/{service}/MapServer/{lid}/query', params=p).json()
        if 'error' in d: raise RuntimeError(f'{service}/{lid}: {d["error"]}')
        fs = d.get('features', []); feats += fs; off += len(fs)
        if not fs or not (d.get('exceededTransferLimit') or d.get('properties', {}).get('exceededTransferLimit')): break
    return feats
# layers whose MapServer gives no geometry: the same objects through the WFS of FiskeridirWFS_fiskeri (it fails now and then)
WFS = 'https://gis.fiskeridir.no/server/services/FiskeridirWFS_fiskeri/MapServer/WFSServer'
WFS_TYPE = {0: 'jmelding_stengte_fiskefelt', 18: 'torsk_gyteomraader_forbudsomraader', 19: 'torsk_oppvekstomraader_forbudsomraader',
            40: 'roedspette_borgenfjorden_forbudsomraade'}
def wfs(t):
    for i in range(4):
        try:
            r = requests.get(WFS, timeout=300, params=dict(service='WFS', version='2.0.0', request='GetFeature', typeNames='FiskeridirWFS_fiskeri:' + t,
                                                           outputFormat='GEOJSON', srsName='EPSG:25833'))
            return r.json()['features']
        except (requests.RequestException, ValueError, KeyError) as e:
            print('  WFS retry', t, str(e)[:80]); time.sleep(3 * (i + 1))
    return None
def fd_all(force):
    meta = {'fetched': time.strftime('%Y-%m-%d'), 'layers': []}
    for service, ids in (('Fiskerireguleringer', None), ('Statistikområder', (6, 8))):
        for L in layers(service):
            if ids and L['id'] not in ids: continue
            f = os.path.join(CACHE, f'fd-{service[:5].lower()}-{L["id"]}.geojson')
            info = get(f'{FD}/{service}/MapServer/{L["id"]}', params={'f': 'json'}).json()
            if force or not os.path.exists(f) or service == 'Fiskerireguleringer' and (L['id'] in (0, 30) or L['id'] in WFS_TYPE and
                                                                         all(x.get('geometry') is None for x in json.load(open(f))['features'])):
                fs = query(service, L['id'])
                if fs and all(x.get('geometry') is None for x in fs) and service == 'Fiskerireguleringer' and L['id'] in WFS_TYPE:
                    fs = wfs(WFS_TYPE[L['id']]) or fs
                json.dump({'type': 'FeatureCollection', 'features': fs}, open(f, 'w'), ensure_ascii=False)
            fs = json.load(open(f))['features']; n = len(fs); ng = sum(x.get('geometry') is None for x in fs)
            meta['layers'].append(dict(service=service, id=L['id'], name=L['name'], geom=info.get('geometryType'), n=n, nogeom=ng,
                                       desc=re.sub(r'<[^>]+>', ' ', info.get('description') or '').strip()[:600], file=os.path.basename(f)))
            print(f'{service} {L["id"]:>2} {n:>5} {L["name"]}' + (f'  ({ng} uten geometri)' if ng else ''))
    json.dump(meta, open(os.path.join(CACHE, 'fd-meta.json'), 'w'), ensure_ascii=False, indent=1)
def nmg(force):
    f = os.path.join(CACHE, 'nmg-25833.gml')
    if os.path.exists(f) and not force: return
    order = {'email': '', 'downloadAsBundle': False, 'orderLines': [{'metadataUuid': NMG_UUID, 'areas': [{'code': '0000', 'type': 'landsdekkende', 'name': 'Hele landet'}],
             'projections': [{'code': '25833'}], 'formats': [{'name': 'GML'}]}]}
    r = requests.post(f'{GEONORGE}/order', json=order, timeout=120); r.raise_for_status(); o = r.json()
    for i in range(60):
        fl = o['files'][0]
        if fl.get('status') == 'ReadyForDownload' and fl.get('downloadUrl'): break
        time.sleep(10); o = get(f'{GEONORGE}/order/{o["referenceNumber"]}').json()
    z = zipfile.ZipFile(io.BytesIO(get(o['files'][0]['downloadUrl']).content))
    name = next(n for n in z.namelist() if n.endswith('.gml'))
    open(f, 'wb').write(z.read(name)); print('Norges maritime grenser', name, os.path.getsize(f))
if __name__ == '__main__':
    os.makedirs(CACHE, exist_ok=True); force = '--force' in sys.argv
    nmg(force); fd_all(force)
