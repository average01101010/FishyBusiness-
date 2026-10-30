# list the Overture release's files for a theme/type (S3 ListObjectsV2 over HTTPS)
import requests, re, sys, json
BASE = 'https://overturemaps-us-west-2.s3.us-west-2.amazonaws.com'
def ls(prefix):
    out, tok = [], None
    while True:
        p = {'list-type': '2', 'prefix': prefix}
        if tok: p['continuation-token'] = tok
        x = requests.get(BASE + '/', params=p, timeout=60).text
        out += [(k, int(s)) for k, s in re.findall(r'<Key>([^<]+)</Key>.*?<Size>(\d+)</Size>', x)]
        m = re.search(r'<NextContinuationToken>([^<]+)</NextContinuationToken>', x)
        if not m: return out
        tok = m.group(1)
if __name__ == '__main__':
    R = '2026-09-23.1'; res = {}
    for t in ['base/land', 'base/water', 'base/land_cover', 'base/land_use', 'base/infrastructure', 'base/bathymetry', 'buildings/building', 'transportation/segment']:
        th, ty = t.split('/'); f = ls(f'release/{R}/theme={th}/type={ty}/'); res[t] = f
        print(t, len(f), 'files', round(sum(s for _, s in f) / 1e9, 1), 'GB')
    json.dump(res, open('files.json', 'w'))
