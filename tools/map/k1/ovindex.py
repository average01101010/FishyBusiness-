# Row-group index of Overture files: which row groups intersect Norway (bbox stats), so only those are fetched.
import json, sys, io, struct, requests, concurrent.futures as cf
import pyarrow.parquet as pq
BASE = 'https://overturemaps-us-west-2.s3.us-west-2.amazonaws.com/'
NOR = (4.0, 57.7, 32.0, 71.5)
S = requests.Session()
def rng(key, a, b):
    r = S.get(BASE + key, headers={'Range': f'bytes={a}-{b}'}, timeout=120); r.raise_for_status(); return r.content
def meta(key, size):
    tail = rng(key, size - 8, size - 1); n = struct.unpack('<I', tail[:4])[0]
    foot = rng(key, size - 8 - n, size - 1)
    return pq.read_metadata(io.BytesIO(b'\0' * 0 + foot_pad(foot, size, n)))
class Tail(io.RawIOBase):
    def __init__(s, data, size): s.d, s.size, s.pos = data, size, 0
    def seekable(s): return True
    def readable(s): return True
    def seek(s, o, w=0): s.pos = o if w == 0 else (s.pos + o if w == 1 else s.size + o); return s.pos
    def tell(s): return s.pos
    def readinto(s, b):
        n = min(len(b), s.size - s.pos); off0 = s.pos - (s.size - len(s.d))
        if off0 >= 0:
            b[:n] = s.d[off0:off0 + n]; s.pos += n; return n
        for i in range(n):
            p = s.pos + i; off = p - (s.size - len(s.d))
            b[i] = s.d[off] if off >= 0 else (b'PAR1'[p] if p < 4 else 0)
        s.pos += n; return n
def rgs(key, size):
    tail = rng(key, size - 8, size - 1); n = struct.unpack('<I', tail[:4])[0]
    foot = rng(key, size - 8 - n, size - 1)
    md = pq.read_metadata(io.BufferedReader(Tail(foot, size)))
    names = [md.schema.column(i).path for i in range(md.num_columns)]
    ix = {k: names.index('bbox.' + k) for k in ['xmin', 'xmax', 'ymin', 'ymax']}
    out = []
    for g in range(md.num_row_groups):
        rg = md.row_group(g); st = {k: rg.column(i).statistics for k, i in ix.items()}
        bb = (st['xmin'].min, st['ymin'].min, st['xmax'].max, st['ymax'].max)
        if bb[2] >= NOR[0] and bb[0] <= NOR[2] and bb[3] >= NOR[1] and bb[1] <= NOR[3]:
            out.append([g, rg.num_rows, rg.total_byte_size, *[round(v, 4) for v in bb]])
    return out
if __name__ == '__main__':
    files = json.load(open('files.json')); want = sys.argv[1:]
    idx = json.load(open('index.json')) if __import__('os').path.exists('index.json') else {}
    for t in want:
        with cf.ThreadPoolExecutor(16) as ex:
            res = list(ex.map(lambda f: (f[0], rgs(*f)), files[t]))
        idx[t] = {k: v for k, v in res if v}
        n = sum(len(v) for v in idx[t].values()); b = sum(r[2] for v in idx[t].values() for r in v)
        print(t, len(idx[t]), 'files with Norway,', n, 'row groups,', round(b / 1e9, 2), 'GB uncompressed')
        json.dump(idx, open('index.json', 'w'))
