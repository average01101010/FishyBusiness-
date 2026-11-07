"""Add new parts to a GLB in src/data without touching the parts it already has (Ø11.4, 06.11.2026). The occlusion that the scripts bake
into the colours is not the same from one run to the next (Cycles' samples: two runs of the unchanged arbeider.py gave other shade on
44 of 63 parts), so a full export changes the look of every part a little. To put a new part (a vest, a marker) into a GLB the game
already uses, the scripts build everything as before and then keep the old GLB's parts byte for byte and append only the parts it does
not have yet. No Blender needed here.

    add_parts(old_b64, new_glb, out_b64)

old_b64: the GLB in src/data as it is (base64); new_glb: the full export of this run (bpyutil.write_glb); out_b64: where to write the
result (usually old_b64 again). The extras: the old ones are kept; a key that only the new run has is added, and in a key that is a dict
in both (the sizes), the sub-keys only the new run has are added. Returns the names of the parts that were added."""
import json, struct, base64


def _read(raw):
    if struct.unpack_from('<I', raw, 0)[0] != 0x46546C67: raise ValueError('not a GLB')
    jl = struct.unpack_from('<I', raw, 12)[0]; J = json.loads(raw[20:20 + jl].decode())
    bo = 20 + jl; bl = struct.unpack_from('<I', raw, bo)[0]
    return J, bytearray(raw[bo + 8: bo + 8 + bl])


def merge(old_raw, new_raw):
    JA, BA = _read(old_raw); JB, BB = _read(new_raw)
    have = {n['name'] for n in JA['nodes']}
    add = [i for i, n in enumerate(JB['nodes']) if n['name'] not in have]
    for i in add:
        nd = JB['nodes'][i]; ms = JB['meshes'][nd['mesh']]; pr = ms['primitives'][0]
        amap = {}
        for key, ai in list(pr['attributes'].items()) + [('_idx', pr['indices'])]:
            A = dict(JB['accessors'][ai]); BV = dict(JB['bufferViews'][A['bufferView']])
            while len(BA) % 4: BA.append(0)
            off = len(BA); BA.extend(BB[BV.get('byteOffset', 0): BV.get('byteOffset', 0) + BV['byteLength']])
            BV['byteOffset'] = off; JA['bufferViews'].append(BV); A['bufferView'] = len(JA['bufferViews']) - 1
            JA['accessors'].append(A); amap[key] = len(JA['accessors']) - 1
        npr = dict(pr); npr['attributes'] = {k: amap[k] for k in pr['attributes']}; npr['indices'] = amap['_idx']
        JA['meshes'].append({'name': ms['name'], 'primitives': [npr]})
        nn = dict(nd); nn['mesh'] = len(JA['meshes']) - 1; JA['nodes'].append(nn)
        JA['scenes'][0]['nodes'].append(len(JA['nodes']) - 1)
    while len(BA) % 4: BA.append(0)
    JA['buffers'][0]['byteLength'] = len(BA)
    EA = JA['scenes'][0].setdefault('extras', {}); EB = JB['scenes'][0].get('extras', {})
    for k, v in EB.items():
        if k not in EA: EA[k] = v
        elif isinstance(EA[k], dict) and isinstance(v, dict):
            for q, w in v.items():
                if q not in EA[k]: EA[k][q] = w
    j = json.dumps(JA, separators=(',', ':')).encode()
    while len(j) % 4: j += b' '
    out = struct.pack('<III', 0x46546C67, 2, 12 + 8 + len(j) + 8 + len(BA)) + struct.pack('<II', len(j), 0x4E4F534A) + j + struct.pack('<II', len(BA), 0x004E4942) + bytes(BA)
    return out, [JB['nodes'][i]['name'] for i in add]


def add_parts(old_b64, new_glb, out_b64):
    old = base64.b64decode(open(old_b64, 'rb').read()); new = open(new_glb, 'rb').read()
    out, added = merge(old, new)
    open(out_b64, 'w').write(base64.b64encode(out).decode())
    return added
