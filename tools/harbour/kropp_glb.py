"""The file of the new people, src/data/folk2.b64 (FB5, steg 122): the writer (kropp_bygg.py) and a reader without Blender (the check
in kropp_bilder.py reads the file as the game will, FB6). The format is described in docs/systemer/folk-om-bord.md 5.33b.

A GLB (glTF 2.0) in the game's frame (x to the person's right, y up, z back: the person faces -z), in metres, the ground at y = 0:
  - the skeleton: one node per bone (K.BONES), each with its translation from its parent in the rest pose and no rotation, so a bone's
    matrix is T(joint posed) R T(-joint rest); one skin for the man and one for the woman (the same bones, other rest places),
    with inverse bind matrices.
  - skinned parts (the skin, the jackets, the sleeves, the trouser legs, the boots and shoes, the vests): POSITION float32 in the
    rest pose, NORMAL int8, COLOR_0 uint8 (rgb with the baked shade, a = gloss), _PAINT uint8 (zone, shade), JOINTS_0 uint8 x 4,
    WEIGHTS_0 uint8 x 4 normalised. The node carries 'skin'.
  - rigid parts (the hair, the beards, the hats): as in worker.b64 (POSITION int16 with the node's translation and scale,
    KHR_mesh_quantization), the node a child of the head's node. The nodes carry the man's rest pose: for the woman the skeleton
    is built from extras.rest.f, and the head parts are placed from rest.f.head (the two skulls differ by millimetres seen from
    their own joints: 3.5 mm in the median, 10.7 mm at most, measured by the control 13.11.2026).
  - a few parts are pieces of another part's vertices (the same accessors with a range of the indices): 'head' and 'handbare' of
    'body', 'headF' and 'handbareF' of 'bodyF'; the hands in their grips ('hR_<grip>', 'hL_<grip>', 'hand', 'hand_lo') of 'glove',
    'hRF' and 'hLF' of 'gloveF'. A grip is the same hand with its fingers turned (extras.grips), not another mesh.
scenes[0].extras: bones, parents, rest (per sex), parts (per part: skinned or the bone, the sex, the triangles; 'glove' and 'gloveF'
also 'sides': the index ranges of the right and the left glove), cover (the skin's index ranges per group, for hiding it under what
is worn), zones, grips, limits, twist, vest, vestHair, spread, source."""
import json, struct, base64, math
import numpy as np


def to_game(p): p = np.asarray(p, float); return np.stack([p[..., 0], p[..., 2], -p[..., 1]], -1)


class Writer:
    def __init__(self):
        self.bin = bytearray(); self.views = []; self.accs = []; self.meshes = []; self.nodes = []; self.skins = []
    def view(self, data, stride=None, target=None):
        while len(self.bin) % 4: self.bin.append(0)
        off = len(self.bin); self.bin.extend(data); v = {'buffer': 0, 'byteOffset': off, 'byteLength': len(data)}
        if stride: v['byteStride'] = stride
        if target: v['target'] = target
        self.views.append(v); return len(self.views) - 1
    def acc(self, view, ctype, count, typ, normalized=False, mn=None, mx=None, offset=0):
        a = {'bufferView': view, 'componentType': ctype, 'count': count, 'type': typ}
        if offset: a['byteOffset'] = offset
        if normalized: a['normalized'] = True
        if mn is not None: a['min'] = mn; a['max'] = mx
        self.accs.append(a); return len(self.accs) - 1
    def common(self, A):
        n = len(A['pos'])
        qn = np.clip(np.round(np.array(A['nor'], float) * 127), -127, 127).astype(np.int8); qn = np.concatenate([qn, np.zeros((n, 1), np.int8)], 1)
        an = self.acc(self.view(qn.tobytes(), 4, 34962), 5120, n, 'VEC3', True)
        ac = self.acc(self.view(np.array(A['col'], np.uint8).tobytes(), 4, 34962), 5121, n, 'VEC4', True)
        aq = self.acc(self.view(np.array(A['pnt'], np.uint8).tobytes(), 4, 34962), 5121, n, 'VEC4')
        I = np.array(A['idx'], np.uint32); big = n > 65535
        vi = self.view(I.astype(np.uint32 if big else np.uint16).tobytes(), None, 34963); ai = self.acc(vi, 5125 if big else 5123, len(I), 'SCALAR')
        return {'NORMAL': an, 'COLOR_0': ac, '_PAINT': aq}, ai, vi, big
    def skinned(self, name, A, skin):
        """A: pos (game frame, rest pose), nor, col, pnt, idx, joints (N, 4), weights (N, 4 floats)"""
        P = np.array(A['pos'], np.float32); n = len(P); at, ai, vi, big = self.common(A)
        at['POSITION'] = self.acc(self.view(P.tobytes(), 12, 34962), 5126, n, 'VEC3', False, P.min(0).tolist(), P.max(0).tolist())
        W = np.array(A['weights'], float); W = W / W.sum(1, keepdims=True); q = np.floor(W * 255).astype(int)
        for i in range(n): q[i, np.argmax(W[i])] += 255 - q[i].sum()
        Jn = np.array(A['joints'], np.uint8); Jn[q == 0] = 0
        at['JOINTS_0'] = self.acc(self.view(Jn.tobytes(), 4, 34962), 5121, n, 'VEC4'); at['WEIGHTS_0'] = self.acc(self.view(q.astype(np.uint8).tobytes(), 4, 34962), 5121, n, 'VEC4', True)
        self.meshes.append({'name': name, 'primitives': [{'attributes': at, 'indices': ai, 'material': 0}]})
        self.nodes.append({'name': name, 'mesh': len(self.meshes) - 1, 'skin': skin}); return len(self.nodes) - 1, (at, vi, big)
    def rigid(self, name, A, rot=None):
        """A: pos in the bone's own frame (game axes, from the joint; a hand: its own frame), quantised as worker.b64"""
        P = np.array(A['pos'], float); n = len(P); at, ai, vi, big = self.common(A)
        lo, hi = P.min(0), P.max(0); c = (lo + hi) / 2; h = np.maximum(1e-6, (hi - lo) / 2)
        q = np.clip(np.round((P - c) / h * 32767), -32767, 32767).astype(np.int16); q = np.concatenate([q, np.zeros((n, 1), np.int16)], 1)
        at['POSITION'] = self.acc(self.view(q.tobytes(), 8, 34962), 5122, n, 'VEC3', True, [-32767] * 3, [32767] * 3)
        self.meshes.append({'name': name, 'primitives': [{'attributes': at, 'indices': ai, 'material': 0}]})
        nd = {'name': name, 'mesh': len(self.meshes) - 1, 'scale': h.tolist()}
        if rot is not None:
            R = np.array(rot, float); nd['rotation'] = quat(R); nd['translation'] = (R @ c).tolist()
        else: nd['translation'] = c.tolist()
        self.nodes.append(nd); return len(self.nodes) - 1, (at, vi, big)
    def alias(self, name, src, first, count, like):
        """a part that is a range of another part's triangles (the same vertices)"""
        at, vi, big = src; ai = self.acc(vi, 5125 if big else 5123, count, 'SCALAR', offset=first * (4 if big else 2))
        self.meshes.append({'name': name, 'primitives': [{'attributes': dict(at), 'indices': ai, 'material': 0}]})
        nd = {k: v for k, v in self.nodes[like].items() if k not in ('name', 'mesh', 'children')}; nd['name'] = name; nd['mesh'] = len(self.meshes) - 1
        self.nodes.append(nd); return len(self.nodes) - 1
    def done(self, path, roots, extras):
        while len(self.bin) % 4: self.bin.append(0)
        js = {'asset': {'version': '2.0', 'generator': 'Kystfiske tools/harbour/kropp_bygg.py'}, 'extensionsUsed': ['KHR_mesh_quantization'], 'extensionsRequired': ['KHR_mesh_quantization'],
              'scene': 0, 'scenes': [{'nodes': roots, 'extras': extras}], 'nodes': self.nodes, 'meshes': self.meshes, 'skins': self.skins,
              'materials': [{'name': 'paint', 'pbrMetallicRoughness': {'baseColorFactor': [1, 1, 1, 1], 'metallicFactor': 0, 'roughnessFactor': 0.6}}],
              'accessors': self.accs, 'bufferViews': self.views, 'buffers': [{'byteLength': len(self.bin)}]}
        j = json.dumps(js, separators=(',', ':')).encode()
        while len(j) % 4: j += b' '
        out = struct.pack('<III', 0x46546C67, 2, 12 + 8 + len(j) + 8 + len(self.bin)) + struct.pack('<II', len(j), 0x4E4F534A) + j + struct.pack('<II', len(self.bin), 0x004E4942) + bytes(self.bin)
        open(path, 'wb').write(out); return len(out)


def quat(R):
    """a rotation matrix as glTF's [x, y, z, w]"""
    t = R[0, 0] + R[1, 1] + R[2, 2]
    if t > 0: s = math.sqrt(t + 1) * 2; q = [(R[2, 1] - R[1, 2]) / s, (R[0, 2] - R[2, 0]) / s, (R[1, 0] - R[0, 1]) / s, 0.25 * s]
    elif R[0, 0] > R[1, 1] and R[0, 0] > R[2, 2]: s = math.sqrt(1 + R[0, 0] - R[1, 1] - R[2, 2]) * 2; q = [0.25 * s, (R[0, 1] + R[1, 0]) / s, (R[0, 2] + R[2, 0]) / s, (R[2, 1] - R[1, 2]) / s]
    elif R[1, 1] > R[2, 2]: s = math.sqrt(1 + R[1, 1] - R[0, 0] - R[2, 2]) * 2; q = [(R[0, 1] + R[1, 0]) / s, 0.25 * s, (R[1, 2] + R[2, 1]) / s, (R[0, 2] - R[2, 0]) / s]
    else: s = math.sqrt(1 + R[2, 2] - R[0, 0] - R[1, 1]) * 2; q = [(R[0, 2] + R[2, 0]) / s, (R[1, 2] + R[2, 1]) / s, 0.25 * s, (R[1, 0] - R[0, 1]) / s]
    return [float(x) for x in q]


def qmat(q):
    x, y, z, w = q
    return np.array([[1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w)], [2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w)], [2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y)]])


class Reader:
    """the file read back: parts by name, each with its triangles in the rest pose (game frame) and how it moves"""
    def __init__(self, path):
        raw = open(path, 'rb').read()
        if path.endswith('.b64'): raw = base64.b64decode(raw)
        self.size = len(raw); jl = struct.unpack_from('<I', raw, 12)[0]; self.J = json.loads(raw[20:20 + jl]); self.raw = raw; self.bo = 20 + jl + 8
        self.ex = self.J['scenes'][0]['extras']; self.names = {n['name']: i for i, n in enumerate(self.J['nodes']) if 'mesh' in n}
        self.parent = {}
        for i, n in enumerate(self.J['nodes']):
            for c in n.get('children', []): self.parent[c] = i
    def _acc(self, i):
        A = self.J['accessors'][i]; BV = self.J['bufferViews'][A['bufferView']]; off = self.bo + BV.get('byteOffset', 0) + A.get('byteOffset', 0)
        dt = {5120: np.int8, 5121: np.uint8, 5122: np.int16, 5123: np.uint16, 5125: np.uint32, 5126: np.float32}[A['componentType']]; nc = {'SCALAR': 1, 'VEC3': 3, 'VEC4': 4, 'MAT4': 16}[A['type']]
        st = BV.get('byteStride') or np.dtype(dt).itemsize * nc
        buf = np.frombuffer(self.raw, np.uint8, st * (A['count'] - 1) + np.dtype(dt).itemsize * nc, off)
        if st == np.dtype(dt).itemsize * nc: a = np.frombuffer(buf.tobytes(), dt).reshape(A['count'], nc)
        else: a = np.stack([np.frombuffer(buf[k * st:k * st + np.dtype(dt).itemsize * nc].tobytes(), dt) for k in range(A['count'])])
        return a, A
    def part(self, name):
        """{'pos' (N, 3) in the rest pose, 'tri' (M, 3), 'joints', 'weights' (N, 4), 'col', 'pnt', 'nor', 'bone': rigid on this bone or None}"""
        ni = self.names[name]; nd = self.J['nodes'][ni]; pr = self.J['meshes'][nd['mesh']]['primitives'][0]; at = pr['attributes']
        P, A = self._acc(at['POSITION']); P = P.astype(float); out = {'bone': None}
        if A.get('normalized'):
            P = P / 32767 * np.array(nd.get('scale', [1, 1, 1])); R = qmat(nd['rotation']) if 'rotation' in nd else np.eye(3)
            if 'rotation' in nd: P = (P + np.linalg.inv(R) @ np.array(nd['translation'])) @ R.T
            else: P = P + np.array(nd.get('translation', [0, 0, 0]))
            b = self.J['nodes'][self.parent[ni]]['name']; out['bone'] = b; sex = self.ex['parts'][name].get('sex', 'm'); P = P + np.array(self.ex['rest']['f' if sex == 'f' else 'm'][b])
            n = len(P); bi = self.ex['bones'].index(b); out['joints'] = np.full((n, 4), bi); out['weights'] = np.tile([1.0, 0, 0, 0], (n, 1))
        else:
            out['joints'] = self._acc(at['JOINTS_0'])[0].astype(int); out['weights'] = self._acc(at['WEIGHTS_0'])[0].astype(float) / 255
        out['pos'] = P; out['tri'] = self._acc(pr['indices'])[0].astype(int).reshape(-1, 3)
        out['col'] = self._acc(at['COLOR_0'])[0]; out['pnt'] = self._acc(at['_PAINT'])[0]; out['nor'] = self._acc(at['NORMAL'])[0].astype(float) / 127
        return out
