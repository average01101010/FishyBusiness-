"""Compare two GLBs written by bpyutil.write_glb part by part (no Blender needed): for each part, whether its positions, normals,
colours, paint and indices are the same bytes, and if not how far they are apart (positions in metres after the node's scale, colours
and the baked shade in steps of 1/255). Parts only in one of them are listed. The extras are compared key by key.

    python3 tools/boats/qa/glbdiff.py A.glb|A.b64 B.glb|B.b64 [--all]

(Ø11.4, 06.11.2026: to show that a new part in a GLB leaves the old ones as they were.)"""
import sys, json, struct, base64

def load(path):
    raw = open(path, 'rb').read()
    if path.endswith('.b64'): raw = base64.b64decode(raw)
    jl = struct.unpack_from('<I', raw, 12)[0]; J = json.loads(raw[20:20 + jl]); bo = 20 + jl + 8
    return J, raw, bo

def view_bytes(J, raw, bo, ai):
    A = J['accessors'][ai]; BV = J['bufferViews'][A['bufferView']]
    return raw[bo + BV.get('byteOffset', 0): bo + BV.get('byteOffset', 0) + BV['byteLength']], A, BV

def parts(J, raw, bo):
    out = {}
    for nd in J['nodes']:
        pr = J['meshes'][nd['mesh']]['primitives'][0]; at = pr['attributes']
        d = {k: view_bytes(J, raw, bo, at[a]) for k, a in (('pos', 'POSITION'), ('nor', 'NORMAL'), ('col', 'COLOR_0'), ('pnt', '_PAINT'))}
        d['idx'] = view_bytes(J, raw, bo, pr['indices']); d['t'] = nd.get('translation', [0, 0, 0]); d['s'] = nd.get('scale', [1, 1, 1])
        out[nd['name']] = d
    return out

def positions(d):
    b = d['pos'][0]; n = d['pos'][1]['count']; t, s = d['t'], d['s']
    return [tuple(t[k] + s[k] * struct.unpack_from('<hhhh', b, 8 * i)[k] / 32767 for k in range(3)) for i in range(n)]

def main():
    a, b = sys.argv[1], sys.argv[2]; show_all = '--all' in sys.argv
    JA, RA, BA = load(a); JB, RB, BB = load(b); PA, PB = parts(JA, RA, BA), parts(JB, RB, BB)
    same = 0
    for nm in PA:
        if nm not in PB: print('  only in A: %s' % nm); continue
        x, y = PA[nm], PB[nm]; diff = [k for k in ('pos', 'nor', 'col', 'pnt', 'idx') if x[k][0] != y[k][0]] + (['node'] if x['t'] != y['t'] or x['s'] != y['s'] else [])
        if not diff:
            same += 1
            if show_all: print('  %-14s same' % nm)
            continue
        msg = []
        if x['pos'][1]['count'] != y['pos'][1]['count']: msg.append('vertices %d -> %d' % (x['pos'][1]['count'], y['pos'][1]['count']))
        else:
            if 'pos' in diff or 'node' in diff:
                pa, pb = positions(x), positions(y); msg.append('positions max %.5f m' % max(max(abs(p[k] - q[k]) for k in range(3)) for p, q in zip(pa, pb)))
            for k in ('col', 'pnt'):
                if k in diff:
                    ca, cb = x[k][0], y[k][0]; dd = [abs(ca[i] - cb[i]) for i in range(len(ca))]
                    msg.append('%s max %d/255, %d of %d bytes differ' % (k, max(dd), sum(1 for v in dd if v), len(dd)))
            if 'nor' in diff:
                na, nb = x['nor'][0], y['nor'][0]; dd = [abs(struct.unpack_from('b', na, i)[0] - struct.unpack_from('b', nb, i)[0]) for i in range(len(na))]
                msg.append('normals max %d/127' % max(dd))
            if 'idx' in diff: msg.append('indices differ')
        print('  %-14s %s' % (nm, '; '.join(msg)))
    for nm in PB:
        if nm not in PA: print('  only in B: %s' % nm)
    print('same: %d of %d parts in A' % (same, len(PA)))
    EA = JA['scenes'][0].get('extras', {}); EB = JB['scenes'][0].get('extras', {})
    for k in sorted(set(EA) | set(EB)):
        if k not in EB: print('  extras only in A: %s' % k)
        elif k not in EA: print('  extras only in B: %s' % k)
        elif EA[k] != EB[k]:
            if isinstance(EA[k], dict) and isinstance(EB[k], dict):
                ch = [q for q in set(EA[k]) | set(EB[k]) if EA[k].get(q) != EB[k].get(q)]
                print('  extras %s: keys changed %s' % (k, sorted(ch)))
            else: print('  extras %s changed' % k)

if __name__ == '__main__':
    main()
