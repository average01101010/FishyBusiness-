"""The numbers the game's skinning is checked against (FB6, steg 124): for three poses and both bodies, the bones' matrices from
kropp.pose_mats and a sample of posed points from kropp_bilder.posed (the file read by kropp_glb.Reader), in the game's frame.
Written to tests/unit/figpose.fasit.json, which tests/unit/figpose.test.mjs compares with src/js/figpose.js (figPose, figSkin) on
the file as the game's own reader (vessel3d.js glbParse) gives it. No Blender. Run again when folk2.b64 is built anew:

    python3 tools/harbour/kropp_fasit.py

A point is named by its part and its corner k (the k-th index of the part's triangles: glbParse gives a corner per index)."""
import os, sys, json
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))
sys.path.insert(0, HERE)
import numpy as np
import kropp as K, kropp_glb as GLB, kropp_bilder as KB

POSES = [('stå', None), ('dyp knebøy', 'grip'), ('vridd', 'pinch')]          # (pose, the grip of both hands)
PARTS = {'m': ['body', 'oilskin', 'glove', 'shin', 'boot', 'hat_bobble', 'hair_pony_h', 'b_full'], 'f': ['bodyF', 'parkaF', 'gloveF', 'shinF', 'sneakerF', 'hat_bobble', 'hair_pony_h']}
N = 40          # points a part


def to_game(p): p = np.asarray(p, float); return np.stack([p[..., 0], p[..., 2], -p[..., 1]], -1)


def main():
    R = GLB.Reader(os.path.join(ROOT, 'src', 'data', 'folk2.b64')); out = {'bones': [n for n, _ in K.BONES], 'poses': []}
    for pose, grip in POSES:
        for sex in 'mf':
            J = K.joints(sex); Lc, root = K.POSES(J)[pose]
            if grip: Lc = dict(Lc); Lc.update(K.grip_turns(sex, grip, J))
            M, Jp = K.pose_mats(J, Lc, root); M = M.copy(); M[:, 2, 3] += J['foot_R'][2] - Jp['foot_R'][2]
            # the matrices in the game's frame: G M G^-1 with G Blender -> game, three rows of [R | t] a bone
            G = np.array([[1, 0, 0, 0], [0, 0, 1, 0], [0, -1, 0, 0], [0, 0, 0, 1.0]]); Mg = np.einsum('ij,njk,kl->nil', G, M, G.T)
            row = {'pose': pose, 'grip': grip, 'sex': sex, 'M': [round(float(x), 7) for x in Mg[:, :3, :].reshape(-1)], 'points': {}}
            for name in PARTS[sex]:
                v, tri, P = KB.posed(R, name, sex, pose, grip); flat = tri.reshape(-1); ks = np.unique(np.linspace(0, len(flat) - 1, N).astype(int))
                row['points'][name] = [[int(k)] + [round(float(x), 6) for x in to_game(v[flat[k]])] for k in ks]
            out['poses'].append(row)
    p = os.path.join(ROOT, 'tests', 'unit', 'figpose.fasit.json'); json.dump(out, open(p, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
    print('skrev', os.path.relpath(p, ROOT), os.path.getsize(p), 'byte,', len(out['poses']), 'stillinger')


if __name__ == '__main__': main()
