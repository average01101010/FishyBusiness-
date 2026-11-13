// The trunk's profile measured on the mesh that is drawn (Folk 2, FB7, steg 125; figpose.js figProfile, figProfAt, figProfMax,
// figProfIn; vessel3d.js figProfOf). Jonas 13.11.2026: «Sørg for at objekter ikke kan clippe inn i menneskene»: what is held close is
// put outside this profile before the hands are solved, and the tests' measure of things in bodies (G3._debug.thingClip) reads it.
// Checked for both bodies: the belly and the chest are a person's, the life jacket adds to the chest, every corner of every trunk
// garment is inside the looked-up profile within 8 mm (what the cells' evening out takes off; LEMMER.GAP is more), a point well
// ahead, beside and over it is outside, and the old solver's fixed 13 cm before the spine (LEMMER.CHEST) is inside the belly.
// Seen red 13.11.2026 with the front measured the wrong way (a = z - z0 in figProfile).
export const scripts = ['js/figpose.js', 'js/vessel3d.js'];
export const data = true;
export default function (t){
  const K = t.K, G = K.glbLoad('folk2'), V = G.ex.vest;
  for (const sex of ['m', 'f']){
    const F = sex === 'f' ? 'F' : '', P = K.figProfOf(sex, 'parka' + F, null), PV = K.figProfOf(sex, 'parka' + F, 'vest_p' + F), PS = K.figProfOf(sex, 'sweater' + F, null), sk = K.figSkelOf(sex), LN = K.figLens(sk);
    const belly = K.figProfAt(P, 0.1, 0), chest = K.figProfAt(P, 0.38, 0), bellyB = K.figProfAt(P, 0.1, 0, true), hw = P.half[Math.floor((0.2 - P.lo) / P.dy)];
    t.ok(belly > 0.11 && belly < 0.2 && chest > 0.09 && chest < 0.2 && bellyB > 0.1 && bellyB < 0.2 && hw > 0.13 && hw < 0.24, sex + ': the trunk is a person\'s (the belly ' + (belly * 100).toFixed(1) + ' cm ahead of the hip joints and ' + (bellyB * 100).toFixed(1) + ' behind, the chest ' + (chest * 100).toFixed(1) + ', half as wide ' + (hw * 100).toFixed(1) + ' cm)');
    const vch = K.figProfMax(PV, 0.2, 0.45, 0.15), pch = K.figProfMax(P, 0.2, 0.45, 0.15), hip = K.figProfAt(P, 0, 0); t.ok(vch > pch + 0.01 && vch < pch + 0.12, sex + ': the life jacket adds to the chest (' + (vch * 100).toFixed(1) + ' cm against ' + (pch * 100).toFixed(1) + ')');
    t.ok(hip > 0.08 && hip < 0.19, sex + ': the trousers\' top is in it, under the jacket\'s hem (' + (hip * 100).toFixed(1) + ' cm ahead at the hip joints)');
    // every corner of the trunk's garments inside what is looked up
    let worst = 0, n = 0; const TB = new Set(['hips', 'spine1', 'spine2', 'spine3', 'neck', 'clav_R', 'clav_L'].map(b => sk.ix[b]));
    for (const g of ['parka' + F]){ const o = G.parts.peek(g);
      for (let i = 0; i < o.p.length / 3; i++){ let wt = 0; for (let k = 0; k < 4; k++) if (TB.has(o.j[i * 4 + k])) wt += o.w[i * 4 + k]; if (wt < 255) continue;
        const y = o.p[i * 3 + 1] - P.y0, r = o.p[i * 3], a = P.z0 - o.p[i * 3 + 2]; if (Math.abs(r) > 0.12 || y < P.lo + P.dy || y > 0.5) continue;   // (the middle of him: out by the sides the profile falls away evenly to nothing)
        n++; worst = Math.max(worst, a > 0 ? a - K.figProfAt(P, y, r) : -a - K.figProfAt(P, y, r, true)); } }
    t.ok(n > 500 && worst < 0.008, sex + ': ' + n + ' corners of the trunk\'s garments are inside the profile looked up, the worst ' + (worst * 1000).toFixed(1) + ' mm outside');
    t.ok(K.figProfIn(P, 0.13, 0.1, 0) > 0.005, sex + ': the old solver\'s 13 cm before the spine is inside the belly (' + (K.figProfIn(P, 0.13, 0.1, 0) * 100).toFixed(1) + ' cm in)');
    t.ok(K.figProfIn(P, 0.25, 0.1, 0) < 0 && K.figProfIn(P, 0, 0.1, 0.35) <= 0 && K.figProfIn(P, 0, 0.9, 0) <= 0 && K.figProfIn(P, 0, 0.1, 0) > 0.1, sex + ': a point ahead of, beside and over the trunk is outside, the middle of it inside');
    t.ok(K.figProfAt(PS, 0.25, 0) < K.figProfAt(P, 0.25, 0) - 0.01, sex + ': the sweater is thinner than the parka over the belly (' + (K.figProfAt(PS, 0.25, 0) * 100).toFixed(1) + ' cm against ' + (K.figProfAt(P, 0.25, 0) * 100).toFixed(1) + ')');
    // the head: the eyes and the mouth on the face, the nose foremost, a point at the mouth outside and one in the skull inside
    const H = K.figHeadOf(sex), hin = K.figProfIn(H.P, -H.c[2], H.c[1], 0), out = K.figProfIn(H.P, -H.mouth[2] + 0.03, H.mouth[1], 0), sock = K.figProfAt(H.P, H.eye[1], 0.032), brow = K.figProfAt(H.P, H.eye[1], 0);
    t.ok(H.eye[1] > 0.06 && H.eye[1] < 0.12 && H.eye[2] < -0.08 && H.eye[2] > -0.13 && H.mouth[1] < H.eye[1] - 0.05 && H.mouth[2] < -0.1 && H.nose <= H.mouth[2] && H.nose > -0.18 && H.r[0] > 0.07 && H.r[0] < 0.11 && hin > 0.07 && out <= 0 && sock < brow && Math.abs(sock + H.eye[2]) < 0.012,
      sex + ': the head is a head (the eyes ' + (H.eye[1] * 100).toFixed(1) + ' cm over its joint and ' + (-H.eye[2] * 100).toFixed(1) + ' ahead, the mouth ' + (H.mouth[1] * 100).toFixed(1) + ' over and ' + (-H.mouth[2] * 100).toFixed(1) + ' ahead, the nose ' + (-H.nose * 100).toFixed(1) + ' ahead; its own profile has the eyes ' + (sock * 100).toFixed(1) + ' cm ahead and the nose\'s root between them ' + (brow * 100).toFixed(1) + ')');
    const mx = K.figProfMax(P, 0, 0.3, 0.2); t.ok(mx >= belly && mx < 0.2, sex + ': the most of it over the belly, ' + (mx * 100).toFixed(1) + ' cm');
  }
}
