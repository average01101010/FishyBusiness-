# Features of an Overture type inside a lon/lat box: only the row groups whose bbox stats touch the box are downloaded (HTTP ranges).
import json, io, struct, requests, bisect, os, sys, concurrent.futures as cf
import pyarrow.parquet as pq, pyarrow as pa, pyarrow.compute as pc
BASE = 'https://overturemaps-us-west-2.s3.us-west-2.amazonaws.com/'
S = requests.Session()
def rng(key, a, b):
    for k in range(4):
        try:
            r = S.get(BASE + key, headers={'Range': f'bytes={a}-{b}'}, timeout=300); r.raise_for_status(); return r.content
        except Exception as e:
            if k == 3: raise
class Sparse(io.RawIOBase):
    def __init__(s, size): s.size, s.pos, s.seg = size, 0, []
    def add(s, a, d): s.seg.append((a, d)); s.seg.sort(key=lambda x: x[0])
    def seekable(s): return True
    def readable(s): return True
    def seek(s, o, w=0): s.pos = o if w == 0 else (s.pos + o if w == 1 else s.size + o); return s.pos
    def tell(s): return s.pos
    def read(s, n=-1):
        if n is None or n < 0: n = s.size - s.pos
        n = min(n, s.size - s.pos)
        for a, d in s.seg:
            if a <= s.pos and s.pos + n <= a + len(d):
                r = d[s.pos - a:s.pos - a + n]; s.pos += n; return r
        if s.pos < 4: r = (b'PAR1' + b'\0' * n)[s.pos:s.pos + n]; s.pos += n; return r
        raise IOError(f'read outside fetched ranges at {s.pos}+{n}')
    def readinto(s, b):
        n = min(len(b), s.size - s.pos)
        for a, d in s.seg:
            if a <= s.pos and s.pos + n <= a + len(d):
                b[:n] = d[s.pos - a:s.pos - a + n]; s.pos += n; return n
        if s.pos < 4: b[:n] = (b'PAR1' + b'\0' * n)[s.pos:s.pos + n]; s.pos += n; return n
        raise IOError(f'read outside fetched ranges at {s.pos}+{n}')
SIZES = {}
def sizes():
    if not SIZES:
        for t, fl in json.load(open(os.path.join(os.path.dirname(__file__), 'files.json'))).items():
            for k, n in fl: SIZES[k] = n
    return SIZES
def fetch_rg(key, g, cols):
    size = sizes()[key]
    tail = rng(key, size - 8, size - 1); n = struct.unpack('<I', tail[:4])[0]
    sp = Sparse(size); sp.add(size - 8 - n, rng(key, size - 8 - n, size - 1))
    md = pq.read_metadata(pa.PythonFile(sp, mode='r')); rg = md.row_group(g)
    a = min(rg.column(i).dictionary_page_offset or rg.column(i).data_page_offset for i in range(rg.num_columns) if rg.column(i).path_in_schema.split('.')[0] in cols)
    b = max((rg.column(i).dictionary_page_offset or rg.column(i).data_page_offset) + rg.column(i).total_compressed_size for i in range(rg.num_columns) if rg.column(i).path_in_schema.split('.')[0] in cols)
    sp.add(a, rng(key, a, b - 1)); sp.pos = 0
    return pq.ParquetFile(pa.PythonFile(sp, mode='r'), pre_buffer=False).read_row_group(g, columns=cols)
def features(typ, box, cols, workers=8):
    idx = json.load(open(os.path.join(os.path.dirname(__file__), 'index.json')))[typ]
    jobs = [(k, r[0]) for k, rs in idx.items() for r in rs if r[5] >= box[0] and r[3] <= box[2] and r[6] >= box[1] and r[4] <= box[3]]
    print(typ, len(jobs), 'row groups', file=sys.stderr)
    cols = list(dict.fromkeys(cols + ['bbox']))
    with cf.ThreadPoolExecutor(workers) as ex: tabs = list(ex.map(lambda j: fetch_rg(j[0], j[1], cols), jobs))
    out = []
    for t in tabs:
        bb = t.column('bbox')
        m = pc.and_(pc.and_(pc.greater_equal(pc.struct_field(bb, 'xmax'), box[0]), pc.less_equal(pc.struct_field(bb, 'xmin'), box[2])),
                    pc.and_(pc.greater_equal(pc.struct_field(bb, 'ymax'), box[1]), pc.less_equal(pc.struct_field(bb, 'ymin'), box[3])))
        out.append(t.filter(m))
    return pa.concat_tables(out) if out else None
