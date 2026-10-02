# Overture Maps, read straight from its S3 bucket over HTTPS (DuckDB cannot fetch its extensions here): the release's file list,
# an index of the row groups that touch Norway (from the parquet footers' bbox statistics), and the features of a type inside a
# lon/lat box, fetching only those row groups' column chunks with HTTP ranges. Everything is kept in cache/ (not in git).
#   python3 tools/map/ov.py index            lists the release and builds the index for the types the pipeline uses
import io, os, re, sys, json, struct, requests, concurrent.futures as cf
import pyarrow as pa, pyarrow.parquet as pq, pyarrow.compute as pc

RELEASE = '2026-09-23.1'
BASE = 'https://overturemaps-us-west-2.s3.us-west-2.amazonaws.com/'
NOR = (4.0, 57.7, 32.0, 71.5)   # lon/lat box round Norway with Jutland and Kola
TYPES = ['base/land', 'base/water', 'base/land_cover', 'base/infrastructure', 'base/bathymetry', 'buildings/building', 'transportation/segment', 'divisions/division_area']
CACHE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'cache')
os.makedirs(CACHE, exist_ok=True)
S = requests.Session()

def rng(key, a, b):
    for k in range(5):
        try:
            r = S.get(BASE + key, headers={'Range': f'bytes={a}-{b}'}, timeout=300); r.raise_for_status(); return r.content
        except Exception:
            if k == 4: raise

def ls(prefix):
    out, tok = [], None
    while True:
        p = {'list-type': '2', 'prefix': prefix}
        if tok: p['continuation-token'] = tok
        x = S.get(BASE, params=p, timeout=60).text
        out += [(k, int(s)) for k, s in re.findall(r'<Key>([^<]+)</Key>.*?<Size>(\d+)</Size>', x)]
        m = re.search(r'<NextContinuationToken>([^<]+)</NextContinuationToken>', x)
        if not m: return out
        tok = m.group(1)

# a file of which only some byte ranges are fetched; pyarrow reads the footer and the row groups' columns from it
class Sparse(io.RawIOBase):
    def __init__(s, size): s.size, s.pos, s.seg = size, 0, []
    def add(s, a, d): s.seg.append((a, d)); s.seg.sort(key=lambda x: x[0])
    def seekable(s): return True
    def readable(s): return True
    def seek(s, o, w=0): s.pos = o if w == 0 else (s.pos + o if w == 1 else s.size + o); return s.pos
    def tell(s): return s.pos
    def readinto(s, b):
        n = min(len(b), s.size - s.pos)
        for a, d in s.seg:
            if a <= s.pos and s.pos + n <= a + len(d):
                b[:n] = d[s.pos - a:s.pos - a + n]; s.pos += n; return n
        if s.pos < 4: b[:n] = (b'PAR1' + b'\0' * n)[s.pos:s.pos + n]; s.pos += n; return n
        raise IOError(f'read outside fetched ranges at {s.pos}+{n}')

def footer(key, size):
    tail = rng(key, size - 8, size - 1); n = struct.unpack('<I', tail[:4])[0]
    a = max(0, size - max(8 + n, 1 << 17)); sp = Sparse(size); sp.add(a, rng(key, a, size - 1))   # pyarrow reads the last 64 kB at once
    return sp, pq.read_metadata(pa.PythonFile(sp, mode='r'))

def files():
    f = os.path.join(CACHE, f'files-{RELEASE}.json')
    if not os.path.exists(f):
        res = {}
        for t in TYPES:
            th, ty = t.split('/'); res[t] = ls(f'release/{RELEASE}/theme={th}/type={ty}/')
        json.dump(res, open(f, 'w'))
    return json.load(open(f))

def index():
    f = os.path.join(CACHE, f'index-{RELEASE}.json')
    if os.path.exists(f): return json.load(open(f))
    idx = {}
    def rgs(key, size):
        _, md = footer(key, size)
        names = [md.schema.column(i).path for i in range(md.num_columns)]
        ix = {k: names.index('bbox.' + k) for k in ['xmin', 'xmax', 'ymin', 'ymax']}
        out = []
        for g in range(md.num_row_groups):
            rg = md.row_group(g); st = {k: rg.column(i).statistics for k, i in ix.items()}
            bb = (st['xmin'].min, st['ymin'].min, st['xmax'].max, st['ymax'].max)
            if bb[2] >= NOR[0] and bb[0] <= NOR[2] and bb[3] >= NOR[1] and bb[1] <= NOR[3]: out.append([g, rg.num_rows, rg.total_byte_size, *[round(v, 4) for v in bb]])
        return out
    for t, fl in files().items():
        with cf.ThreadPoolExecutor(16) as ex: res = list(ex.map(lambda x: (x[0], x[1], rgs(*x)), fl))
        idx[t] = {k: [size, v] for k, size, v in res if v}
        print(t, len(idx[t]), 'files,', sum(len(v[1]) for v in idx[t].values()), 'row groups', file=sys.stderr)
    json.dump(idx, open(f, 'w'))
    return idx

def fetch_rg(key, size, g, cols):
    cf_ = os.path.join(CACHE, 'rg', re.sub(r'[^A-Za-z0-9]+', '_', key)[-120:] + f'_{g}_' + '-'.join(sorted(cols)) + '.parquet')
    if os.path.exists(cf_): return pq.read_table(cf_)
    sp, md = footer(key, size); rg = md.row_group(g)
    sel = [i for i in range(rg.num_columns) if rg.column(i).path_in_schema.split('.')[0] in cols]
    a = min(rg.column(i).dictionary_page_offset or rg.column(i).data_page_offset for i in sel)
    b = max((rg.column(i).dictionary_page_offset or rg.column(i).data_page_offset) + rg.column(i).total_compressed_size for i in sel)
    sp.add(a, rng(key, a, b - 1)); sp.pos = 0
    t = pq.ParquetFile(pa.PythonFile(sp, mode='r'), pre_buffer=False).read_row_group(g, columns=cols)
    os.makedirs(os.path.dirname(cf_), exist_ok=True); pq.write_table(t, cf_)
    return t

# the features of a type whose bbox touches a lon/lat box (the row groups are cached, so a second region costs nothing)
def features(typ, box, cols, workers=8):
    idx = index()[typ]
    jobs = [(k, size, r[0]) for k, (size, rs) in idx.items() for r in rs if r[5] >= box[0] and r[3] <= box[2] and r[6] >= box[1] and r[4] <= box[3]]
    cols = list(dict.fromkeys(cols + ['bbox']))
    with cf.ThreadPoolExecutor(workers) as ex: tabs = list(ex.map(lambda j: fetch_rg(j[0], j[1], j[2], cols), jobs))
    out = []
    for t in tabs:
        bb = t.column('bbox')
        m = pc.and_(pc.and_(pc.greater_equal(pc.struct_field(bb, 'xmax'), box[0]), pc.less_equal(pc.struct_field(bb, 'xmin'), box[2])),
                    pc.and_(pc.greater_equal(pc.struct_field(bb, 'ymax'), box[1]), pc.less_equal(pc.struct_field(bb, 'ymin'), box[3])))
        out.append(t.filter(m).select(cols))   # the cache keeps the columns in another order
    return pa.concat_tables(out) if out else None

if __name__ == '__main__' and sys.argv[1:2] == ['index']:
    idx = index(); print(json.dumps({t: [len(v), sum(len(x[1]) for x in v.values())] for t, v in idx.items()}))
