// The new people's skinning (Folk 2, FB6, steg 124): src/js/figpose.js against the numbers of tools/harbour/kropp.py, on
// src/data/folk2.b64 as the game's own reader gives it (vessel3d.js glbParse). The reference (figpose.fasit.json, written by
// tools/harbour/kropp_fasit.py from kropp.pose_mats and kropp_bilder.posed) has three poses for both bodies: standing, the deep squat
// with both hands in the grip «grip», and twisted with the pinch. Checked: the bones' matrices; that a point skinned as the shader
// does it (figSkin with the float32 matrices that go to the uniforms) stands within 1 mm of the same point from kropp_bilder.posed,
// for the skin, a jacket, the gloves (the fingers of a grip), a trouser leg, a shoe, and the parts that hang on the head (a hat, hair
// and a beard: for the woman from her own joint); the reader's skeleton against the extras; that a figure of a look draws only the
// head and the gloves (or the bare hands) of the skin; and that a figure shared between small palettes skins to the same points.
// Seen red 13.11.2026 with figPose turning a child before its parent (figMul3(L, Rp) for figMul3(Rp, L)): all 12 pose checks FEIL,
// the points up to 6.5 mm off standing and 292 mm in the squat.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
export const scripts = ['js/figpose.js', 'js/vessel3d.js'];
export const data = true;

export default function (t){
  const K = t.K, F = JSON.parse(readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'figpose.fasit.json'), 'utf8'));
  const G = K.glbLoad('folk2');
  t.ok(G && G.sk && G.sk.bones.length === 58 && G.sk.skins.length === 2, 'the reader gives the file\'s skeleton: 58 bones and two skins');
  t.eq(G.sk.bones, F.bones, 'the bones in kropp.py\'s order');
  t.eq(G.sk.bones, G.ex.bones, 'the skin\'s joints are the extras\' bones');
  // the node hierarchy against the extras: the same parents, and the nodes' translations add up to the man's rest places
  const skm = K.figSkel(G.ex, 'm'), skf = K.figSkel(G.ex, 'f');
  t.eq(G.sk.parent, skm.parent, 'the nodes\' parents are the extras\' parents');
  let dn = 0; for (let b = 0; b < 58; b++) for (let c = 0; c < 3; c++) dn = Math.max(dn, Math.abs(G.sk.rest[b][c] - skm.rest[b][c]));
  t.near(dn, 0, 1e-6, 'the nodes hold the man\'s rest places (largest difference, m)');
  // each skin's inverse bind matrices are T(-rest) of its own sex (so the woman's skeleton is the extras' rest.f)
  for (const [si, sk] of [[0, skm], [1, skf]]){ const ibm = G.sk.skins[si].ibm; let d = 0;
    for (let b = 0; b < 58; b++) for (let c = 0; c < 3; c++) d = Math.max(d, Math.abs(ibm[b * 16 + 12 + c] + sk.rest[b][c]));
    t.near(d, 0, 1e-6, 'skin ' + G.sk.skins[si].name + ': the inverse bind matrices are minus the rest places of ' + sk.sex); }
  let dh = 0; for (let c = 0; c < 3; c++) dh = Math.max(dh, Math.abs(skm.rest[skm.ix.head][c] - skf.rest[skf.ix.head][c]));
  t.ok(dh > 0.005, 'the two bodies\' head joints differ (so a hat placed from the node would sit wrong on her)');
  t.eq(G.sk.on.hat_bobble, 'head', 'a hat hangs on the head\'s node');

  // the poses
  let worstM = 0, worstP = 0, nP = 0, bad = 0;
  for (const row of F.poses){
    const sk = row.sex === 'f' ? skf : skm, P = K.figPoses(sk)[row.pose], L = Object.assign({}, P.local);
    if (row.grip) K.figGrip(G.ex, row.sex, row.grip, L);
    const M = K.figPose(sk, L, P.root, {ground:true}).M; let dm = 0;
    for (let i = 0; i < M.length; i++) dm = Math.max(dm, Math.abs(M[i] - row.M[i]));
    worstM = Math.max(worstM, dm);
    t.near(dm, 0, 2e-4, row.pose + (row.grip ? ' + ' + row.grip : '') + ' ' + row.sex + ': the 58 bone matrices as kropp.pose_mats (largest difference)');
    let dp = 0;
    for (const name in row.points){
      const o = K.figPart(name, 'crew', row.sex); if (!o){ t.ok(false, 'the part ' + name + ' is read'); continue; }
      for (const [k, x, y, z] of row.points[name]){
        const s = K.figSkin(o.p.subarray(k * 3, k * 3 + 3), null, o.j.subarray(k * 4, k * 4 + 4), o.w.subarray(k * 4, k * 4 + 4), M).p, d = Math.hypot(s[0] - x, s[1] - y, s[2] - z);
        dp = Math.max(dp, d); nP++; if (d > 0.001) bad++; }
    }
    worstP = Math.max(worstP, dp);
    t.near(dp * 1000, 0, 1, row.pose + (row.grip ? ' + ' + row.grip : '') + ' ' + row.sex + ': ' + Object.keys(row.points).length + ' parts\' points within 1 mm of kropp_bilder.posed (largest, mm)');
  }
  t.note(nP + ' points in ' + F.poses.length + ' poses: ' + bad + ' over 1 mm, the worst ' + (worstP * 1000).toFixed(3) + ' mm; the matrices differ by ' + worstM.toExponential(1) + ' at most');

  // a look's figure: under the clothes only the head and the gloves, or the bare hands, of the skin
  const look = Object.assign(K.lookDefault(), {b:'f', hs:'pony', ht:'bobble', tp:'parka'}), M0 = K.figMesh(look), Mb = K.figMesh(look, {bare:true}), cov = G.ex.cover.bodyF;
  const cnt = (M, n) => M.parts.filter(p => p[0] === n).reduce((a, p) => a + p[2], 0);
  t.eq(M0.miss, [], 'every part of the look is in the file');
  t.eq([cnt(M0, 'bodyF'), cnt(M0, 'gloveF')], [cov.head[1], G.parts.gloveF.p.length / 3], 'with gloves: of the skin only the head and the neck (extras.cover.head), and the gloves');
  t.eq([cnt(Mb, 'bodyF'), cnt(Mb, 'gloveF')], [cov.head[1] + cov.hands[1], 0], 'without gloves: the head and the hands of the skin (extras.cover), no gloves');
  t.ok(M0.cnt * 3 === M0.p.length && M0.cnt * 4 === M0.j.length && M0.cnt / 3 < 7400, 'the figure is one mesh of ' + (M0.cnt / 3) + ' triangles');
  const total = Object.values(cov).reduce((a, r) => a + r[1], 0);
  t.eq(total, G.parts.bodyF.p.length / 3, 'the cover\'s groups are the whole skin');
  // the man's default look and the three old kits build too
  for (const kit of [K.lookDefault(), 'hw', 'skipper', 'crew', Object.assign(K.lookDefault(), {v:1})]){ const m = K.figMesh(kit); t.ok(m && !m.miss.length && m.cnt > 9000, 'a figure for ' + (typeof kit === 'string' ? kit : kit.v ? 'the default look with the vest' : 'the default look') + ': ' + (m && m.cnt / 3) + ' triangles' + (m && m.miss.length ? ', missing ' + m.miss : '')); }
  t.ok(K.figMesh(Object.assign(K.lookDefault(), {v:1})).parts.some(p => p[0] === 'vest'), 'the vest that goes with the jacket is on a look with v');

  // small palettes (a device with 128 vertex uniform vectors holds 37 bones): the same points from every draw call
  t.eq([K.figPalette(128, 16), K.figPalette(256, 16), K.figPalette(1024, 16), K.figPalette(64, 16)], [37, 58, 58, 16], 'the palette by the device\'s vertex uniform vectors');
  const P = K.figPoses(skf)['dyp knebøy'], L = K.figGrip(G.ex, 'f', 'grip', Object.assign({}, P.local)), M = K.figPose(skf, L, P.root, {ground:true}).M, ref = K.figSkin(M0.p, M0.n, M0.j, M0.w, M);
  t.eq(K.figDraws(M0, 58).length, 1, '58 bones: the figure is one draw call');
  for (const maxB of [37, 24, 16]){
    const D = K.figDraws(M0, maxB); let n = 0, d = 0, over = 0; const seen = new Map();
    const key = (p, i) => Math.round(p[i * 3] * 1e5) + ',' + Math.round(p[i * 3 + 1] * 1e5) + ',' + Math.round(p[i * 3 + 2] * 1e5);
    for (let i = 0; i < M0.cnt; i++){ const k = key(M0.p, i); if (!seen.has(k)) seen.set(k, [ref.p[i * 3], ref.p[i * 3 + 1], ref.p[i * 3 + 2]]); }
    for (const g of D){ n += g.cnt; if (g.bones.length > maxB) over++; const s = K.figSkin(g.p, null, g.j, g.w, K.figPal(M, g.bones)).p;
      for (let i = 0; i < g.cnt; i++){ const r = seen.get(key(g.p, i)); d = Math.max(d, r ? Math.hypot(s[i * 3] - r[0], s[i * 3 + 1] - r[1], s[i * 3 + 2] - r[2]) : 9); } }
    t.ok(n === M0.cnt && !over && d < 1e-4 && D.length > 1 && D.length <= 6, 'a palette of ' + maxB + ' bones: ' + D.length + ' draw calls, every corner kept, the same points (largest difference ' + (d * 1000).toFixed(4) + ' mm)');
  }
}
