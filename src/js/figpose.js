// ===== the new people's skeleton (Folk 2, FB6, steg 124): bone matrices from local turns, without WebGL =====
// src/data/folk2.b64 (tools/harbour/kropp_bygg.py; the format in docs/systemer/folk-om-bord.md 5.33b) has one body for the man and one
// for the woman, each skinned to the same 58 bones. Every bone rests without rotation (the world's axes), so a bone's matrix is
// T(joint posed) · R · T(-joint rest), with R the turns of the bone and of all its parents. This file is the game's side of
// tools/harbour/kropp.py (pose_mats, skin, _arms, POSES) in the game's frame: x to the person's right, y up, z back (the person
// faces -z), metres, the ground at y = 0. Blender's (x, y, z) is the game's (x, z, -y); a turn about an axis keeps its angle.
// Pure functions: the wardrobe (ui/10g-wardrobe.js) and the 3D view hand the matrices to the shader (figGL), tests/unit/figpose.test.mjs
// checks them against numbers written by kropp.py (tools/harbour/kropp_fasit.py).
// A 3x3 is a plain array of 9, row by row; a bone matrix is 12 floats, three rows of [R | t], as the shader takes them (3 vec4 a bone).
const FIG_I3 = [1, 0, 0, 0, 1, 0, 0, 0, 1];
const figMul3 = (a, b) => [a[0] * b[0] + a[1] * b[3] + a[2] * b[6], a[0] * b[1] + a[1] * b[4] + a[2] * b[7], a[0] * b[2] + a[1] * b[5] + a[2] * b[8],
  a[3] * b[0] + a[4] * b[3] + a[5] * b[6], a[3] * b[1] + a[4] * b[4] + a[5] * b[7], a[3] * b[2] + a[4] * b[5] + a[5] * b[8],
  a[6] * b[0] + a[7] * b[3] + a[8] * b[6], a[6] * b[1] + a[7] * b[4] + a[8] * b[7], a[6] * b[2] + a[7] * b[5] + a[8] * b[8]];
const figT3 = a => [a[0], a[3], a[6], a[1], a[4], a[7], a[2], a[5], a[8]];
const figV3 = (a, v) => [a[0] * v[0] + a[1] * v[1] + a[2] * v[2], a[3] * v[0] + a[4] * v[1] + a[5] * v[2], a[6] * v[0] + a[7] * v[1] + a[8] * v[2]];
// a turn about an axis by degrees (the right-hand rule, as kropp.rot)
function figRot(axis, deg){
  const l = Math.hypot(axis[0], axis[1], axis[2]) || 1, x = axis[0] / l, y = axis[1] / l, z = axis[2] / l, t = deg * Math.PI / 180, c = Math.cos(t), s = Math.sin(t), k = 1 - c;
  return [c + x * x * k, x * y * k - z * s, x * z * k + y * s, y * x * k + z * s, c + y * y * k, y * z * k - x * s, z * x * k - y * s, z * y * k + x * s, c + z * z * k];
}
// glTF's quaternion [x, y, z, w] as a 3x3 (the grips' finger turns in the file's extras)
function figQuat(q){
  const x = q[0], y = q[1], z = q[2], w = q[3];
  return [1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w), 2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w), 2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y)];
}
// the turn that takes direction a to direction b the short way
function figBetween(a, b){
  const la = Math.hypot(a[0], a[1], a[2]) || 1, lb = Math.hypot(b[0], b[1], b[2]) || 1, u = [a[0] / la, a[1] / la, a[2] / la], v = [b[0] / lb, b[1] / lb, b[2] / lb];
  const ax = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]], n = Math.hypot(ax[0], ax[1], ax[2]);
  if (n < 1e-9) return FIG_I3.slice();
  return figRot(ax, Math.acos(Math.max(-1, Math.min(1, u[0] * v[0] + u[1] * v[1] + u[2] * v[2]))) * 180 / Math.PI);
}
// the skeleton of one sex from the file's extras: the bones' names, each bone's parent (an index, -1 for the hips; a parent always
// comes before its children) and where each joint rests. The file's nodes hold the man's places: the woman's come from rest.f here.
function figSkel(ex, sex){
  const names = ex.bones, ix = {}; names.forEach((n, i) => { ix[n] = i; });
  const R = ex.rest[sex === 'f' ? 'f' : 'm'], parent = ex.parents.map(p => p == null ? -1 : ix[p]), rest = names.map(n => R[n].slice());
  parent.forEach((p, i) => { if (p >= i) throw new Error('figSkel: ' + names[i] + ' comes before its parent'); });
  return {names, ix, parent, rest, sex:sex === 'f' ? 'f' : 'm', n:names.length};
}
// The bones' matrices for a pose: local = {bone name: 3x3, the bone's turn in its parent's frame about its own joint}, root moves the
// hips. opt.ground: the whole figure is lifted or lowered so the right foot's joint stays at its rest height (a squat stands on the
// ground: kropp_bilder.posed). Returns {M: Float32Array(n * 12), J: the posed joints (n * 3), R: each bone's whole turn (array of 3x3)}.
function figPose(sk, local, root, opt){
  const n = sk.n, M = new Float32Array(n * 12), J = new Float64Array(n * 3), G = new Array(n); local = local || {}; root = root || [0, 0, 0];
  for (let i = 0; i < n; i++){
    const L = local[sk.names[i]] || FIG_I3, j = sk.rest[i], p = sk.parent[i]; let Rg, pj;
    if (p < 0){ Rg = L; pj = [j[0] + root[0], j[1] + root[1], j[2] + root[2]]; }
    else { const Rp = G[p], pr = sk.rest[p], d = figV3(Rp, [j[0] - pr[0], j[1] - pr[1], j[2] - pr[2]]); Rg = figMul3(Rp, L); pj = [J[p * 3] + d[0], J[p * 3 + 1] + d[1], J[p * 3 + 2] + d[2]]; }
    G[i] = Rg; J[i * 3] = pj[0]; J[i * 3 + 1] = pj[1]; J[i * 3 + 2] = pj[2];
  }
  const fr = sk.ix.foot_R, dy = opt && opt.ground && fr != null ? sk.rest[fr][1] - J[fr * 3 + 1] : 0;
  for (let i = 0; i < n; i++){
    const Rg = G[i], j = sk.rest[i], t = figV3(Rg, j); J[i * 3 + 1] += dy;
    for (let r = 0; r < 3; r++){ M[i * 12 + r * 4] = Rg[r * 3]; M[i * 12 + r * 4 + 1] = Rg[r * 3 + 1]; M[i * 12 + r * 4 + 2] = Rg[r * 3 + 2]; M[i * 12 + r * 4 + 3] = J[i * 3 + r] - t[r]; }
  }
  return {M, J, R:G};
}
// both arms into the local turns L, as seen from the chest whatever the back does and whatever the rest pose holds them at: out (deg,
// how far out from hanging straight down), fwd (swung forward), el (the elbow's bend, forward). The arms are set from the chest and
// not from the world: an arm set from the world is left behind when the chest turns and goes through the jacket's side (5.33b), and
// the jackets' sides are cut to clear arms at least 13 degrees out.
function figArms(sk, L, out, fwd, el){
  out = out == null ? 20 : out; fwd = fwd || 0; el = el == null ? 15 : el;
  let Rb = FIG_I3; for (const n of ['hips', 'spine1', 'spine2', 'spine3']) Rb = figMul3(Rb, L[n] || FIG_I3);
  for (const [sd, sg] of [['R', 1], ['L', -1]]){
    const sh = sk.rest[sk.ix['uarm_' + sd]], e = sk.rest[sk.ix['farm_' + sd]], w = sk.rest[sk.ix['hand_' + sd]], d1 = [e[0] - sh[0], e[1] - sh[1], e[2] - sh[2]], d2 = [w[0] - e[0], w[1] - e[1], w[2] - e[2]];
    const o = out * Math.PI / 180, down = [sg * Math.sin(o), -Math.cos(o), 0], t1 = figV3(figRot([1, 0, 0], fwd), down), t2 = figV3(figRot([1, 0, 0], fwd + el), down);
    const Rp = figMul3(Rb, L['clav_' + sd] || FIG_I3), R1 = figBetween(d1, figV3(figT3(Rp), t1)); L['uarm_' + sd] = R1;
    L['farm_' + sd] = figBetween(d2, figV3(figT3(figMul3(Rp, R1)), t2));
  }
  return L;
}
// ---- from the joints the work asks for to the bones' turns (FB7, steg 125) ----
// The 3D view reckons where a worker's hips, chest, head, elbows, wrists, knees and ankles are (drawWorker; the solver of FB2 in
// deckcrew.js). figFromJoints turns them into the local turns figPose takes. The skeleton keeps its own lengths: a limb is solved
// again here from where its root really is on this skeleton (the shoulder after the back's bend, the hip joint under the pelvis),
// with the asked elbow or knee as the side its joint is on, so the wrist and the ankle stand where they were asked for whenever the
// limb reaches, and point at them when it does not. Everything in the figure's frame (x right, y up, z back, metres).
const figSub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], figAdd = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], figScl = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
const figDot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], figCrs = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const figNrm = v => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };
// a 3x3 from its three columns
const figCols = (x, y, z) => [x[0], y[0], z[0], x[1], y[1], z[1], x[2], y[2], z[2]];
// the turn from a to b the short way, also when they are opposite (figBetween gives none then)
function figTo(a, b){
  const u = figNrm(a), v = figNrm(b), c = figDot(u, v);
  if (c < -0.999999){ const p = Math.abs(u[1]) < 0.9 ? figCrs(u, [0, 1, 0]) : figCrs(u, [1, 0, 0]); return figRot(p, 180); }
  return figBetween(u, v);
}
// a turn's axis and angle (deg), and a share k of it
function figAxis(R){
  const c = Math.max(-1, Math.min(1, (R[0] + R[4] + R[8] - 1) / 2)), ax = [R[7] - R[5], R[2] - R[6], R[3] - R[1]], l = Math.hypot(ax[0], ax[1], ax[2]);
  return l < 1e-9 ? {ax:[0, 1, 0], deg:0} : {ax:[ax[0] / l, ax[1] / l, ax[2] / l], deg:Math.acos(c) * 180 / Math.PI};
}
function figFrac(R, k){ const a = figAxis(R); return figRot(a.ax, a.deg * k); }
// how far a turn turns about the axis a (deg, -180 to 180): R = swing · twist, the twist about a
function figTwist(R, a){
  const w = Math.sqrt(Math.max(0, 1 + R[0] + R[4] + R[8])) / 2; if (w < 1e-6) return 0;
  const v = [(R[7] - R[5]) / (4 * w), (R[2] - R[6]) / (4 * w), (R[3] - R[1]) / (4 * w)];
  return 2 * Math.atan2(figDot(v, figNrm(a)), w) * 180 / Math.PI;
}
// a limb of two parts from its root S to the target T, the joint on the side of the point pole: [joint, end, m short of the target]
function figIk(S, T, l1, l2, pole){
  let u = figSub(T, S); const D = Math.hypot(u[0], u[1], u[2]); u = D < 1e-6 ? [0, -1, 0] : figScl(u, 1 / D);
  const d = Math.min(Math.max(D, Math.abs(l1 - l2) + 1e-4), (l1 + l2) * 0.9995), a = (d * d + l1 * l1 - l2 * l2) / (2 * d), h = Math.sqrt(Math.max(0, l1 * l1 - a * a));
  let p = figSub(pole, S); p = figSub(p, figScl(u, figDot(p, u)));
  if (Math.hypot(p[0], p[1], p[2]) < 1e-6) p = Math.abs(u[1]) < 0.9 ? figCrs(u, [1, 0, 0]) : [0, 0, -1];
  p = figNrm(p);
  return [figAdd(figAdd(S, figScl(u, a)), figScl(p, h)), figAdd(S, figScl(u, d)), Math.max(0, D - d)];
}
// the skeleton's own measures (m): the upper arm, the forearm (to the wrist), the thigh and the shin (to the ankle), the shoulder
// joint over the hip joints and out from the spine, the hip joints' height standing and half their width, the ankle's height
function figLens(sk){
  const r = n => sk.rest[sk.ix[n]], d = (a, b) => { const p = r(a), q = r(b); return Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]); };
  return {ua:d('uarm_R', 'farm_R'), fa:d('farm_R', 'hand_R'), th:d('thigh_R', 'shin_R'), sn:d('shin_R', 'foot_R'),
    sh:[r('uarm_R')[1] - r('thigh_R')[1], r('uarm_R')[0]], shA:r('thigh_R')[2] - r('uarm_R')[2], hip:r('thigh_R')[1], hipX:r('thigh_R')[0], ankle:r('foot_R')[1]};
}
// a hand's own frame at rest, from the file's grips: the columns are where the fingers' frame of the 3D view (handFrame: the fingers
// along z, the palm toward y, x = y × z, the thumb at -x on the right hand and +x on the left) lies on this hand. The fist's handle
// (grips.grip.ax) is its x, the flat hand's fingers (grips.flat.ax) its z.
function figHandRest(ex, sex, side){
  const G = (ex.grips || {})[sex === 'f' ? 'f' : 'm'] || {}, sd = side === 'L' ? 'L' : 'R'; if (!G.grip || !G.flat) return FIG_I3.slice();
  const z = figNrm(G.flat[sd].ax); let x = G.grip[sd].ax; x = figNrm(figSub(x, figScl(z, figDot(x, z))));
  if ((sd === 'R') !== (x[2] > 0)) x = figScl(x, -1);
  return figCols(x, figCrs(z, x), z);
}
// where a grip holds, in that frame (m from the wrist): what the 3D view's hand specs take (the old file's extras.hands)
function figGripAt(ex, sex, grip, side){
  const G = ((ex.grips || {})[sex === 'f' ? 'f' : 'm'] || {}), g = G[grip] || G.relax, sd = side === 'L' ? 'L' : 'R', H = figT3(figHandRest(ex, sex, sd));
  return {at:figV3(H, g[sd].at), ax:figV3(H, g[sd].ax)};
}
// the least an upper arm is out from the body when it hangs (deg from straight down along the chest, to its own side): the jackets'
// sides are cut to clear arms 13 degrees out (5.33b). The elbow is turned about the line from the shoulder to the wrist, the least
// that brings it there (or as far out as it goes); the wrist stays.
const FIG_ARM_OUT = 13;
function figArmOut(S, E, W, Rc, sg){
  const cx = [Rc[0], Rc[3], Rc[6]], cy = [Rc[1], Rc[4], Rc[7]], lim = Math.sin(FIG_ARM_OUT * Math.PI / 180);
  const lack = e => { const u = figNrm(figSub(e, S)), dn = Math.max(0, -figDot(u, cy)); return lim * dn - sg * figDot(u, cx); };
  if (lack(E) <= 0) return E;
  const ax = figNrm(figSub(W, S)); let best = E, bl = lack(E);
  for (let a = 5; a <= 120; a += 5) for (const s of [1, -1]){ const R = figRot(ax, a * s), e = figAdd(S, figV3(R, figSub(E, S))), l = lack(e); if (l <= 0) return e; if (l < bl){ bl = l; best = e; } }
  return best;
}
// The local turns and the root for figPose from the joints of a pose. J:
//   pelvis   the middle between the two hip joints
//   hipsR    the pelvis' turn (3x3; the sea's lean), chestR the chest's (the back bent and turned), headR the head's; none: upright
//   arms     {R:{el, wr, hand, sh}, L:…}: the elbow's side and the wrist, sh where the shoulder was reckoned (or nothing), hand the hand's turn (3x3, from figHandTurn) or nothing (along the forearm)
//   legs     {R:{knee, foot, footR}, L:…}: the knee's side and the ankle, footR the foot's turn or nothing (flat, facing ahead)
// The back's bend is shared between the pelvis (FIG_HIPBEND of what is ahead or to a side: he bends at the hips, as the 3D view's
// solver reckons the shoulders, about the hips) and the three bones of the spine, its turn about the spine between those three; the neck and the head share the head's turn from the chest (at most 70 degrees round and 45 over).
// A limb's roll is found from the plane its three joints are in, so the elbow and the knee bend as hinges, and half of it is on the
// twist bone (utw, ttw; the forearm's roll to the hand on ftw). Returns {local, root, out:{sh, el, wr, hip, knee, foot}} with the
// joints as the skeleton has them.
const FIG_HIPBEND = 0.8, FIG_CLAV = 25;
function figFromJoints(sk, J){
  const L = {}, ix = sk.ix, r = n => sk.rest[ix[n]], Y = [0, 1, 0], Rh0 = J.hipsR || FIG_I3, Rc = J.chestR || Rh0, mul = figMul3;
  // the back: rel = swing · twist
  const rel = mul(figT3(Rh0), Rc), tw = figTwist(rel, Y), sw = mul(rel, figRot(Y, -tw));
  const Gh = mul(Rh0, figFrac(sw, FIG_HIPBEND)); L.hips = Gh;
  L.spine1 = mul(figFrac(sw, (1 - FIG_HIPBEND) * 0.4), figRot(Y, tw * 0.22)); L.spine2 = mul(figFrac(sw, (1 - FIG_HIPBEND) * 0.35), figRot(Y, tw * 0.33));
  const G1 = mul(Gh, L.spine1), G2 = mul(G1, L.spine2); L.spine3 = mul(figT3(G2), Rc);
  // the head from the chest
  if (J.headR){ const rh = mul(figT3(Rc), J.headR), yw = Math.max(-70, Math.min(70, figTwist(rh, Y))), s0 = figAxis(mul(rh, figRot(Y, -figTwist(rh, Y)))), s1 = figRot(s0.ax, Math.min(45, s0.deg)), all = mul(s1, figRot(Y, yw));
    L.neck = mul(figFrac(s1, 0.5), figRot(Y, yw * 0.45)); L.head = mul(figT3(L.neck), all); }
  // where the joints are
  const tm = figScl(figAdd(r('thigh_R'), r('thigh_L')), 0.5), hj = figSub(J.pelvis || tm, figV3(Gh, figSub(tm, r('hips')))), root = figSub(hj, r('hips'));
  const s1j = figAdd(hj, figV3(Gh, figSub(r('spine1'), r('hips')))), s2j = figAdd(s1j, figV3(G1, figSub(r('spine2'), r('spine1')))), s3j = figAdd(s2j, figV3(G2, figSub(r('spine3'), r('spine2'))));
  const out = {sh:{}, el:{}, wr:{}, hip:{}, knee:{}, foot:{}, over:{}};
  // a limb: the root's turn R0 and joint S, its three bones a (with its twist bone t) and b, the end bone c; hinge the axis the joint bends
  // about at rest (none: the plane the limb rests in. The arm rests with the elbow bent 24 degrees, so its own plane is the elbow's;
  // the leg rests straight, and the knee's axis is given)
  const limb = (R0, S, a, t, b, c, E, W, hinge) => {
    const d1 = figSub(r(b), r(a)), d2 = figSub(r(c), r(b)), u = figNrm(figSub(E, S)), R1 = mul(figTo(figV3(R0, d1), u), R0);
    const d1n = figNrm(d1), hg = hinge || figCrs(d1, d2), h0 = figNrm(figSub(hg, figScl(d1n, figDot(hg, d1n)))), n = figCrs(figSub(E, S), figSub(W, E)), sb = Math.hypot(n[0], n[1], n[2]) / (Math.hypot(d1[0], d1[1], d1[2]) * Math.hypot(d2[0], d2[1], d2[2]));
    let ang = 0;
    if (sb > 0.03){ const a0 = figV3(R1, h0), nn = figNrm(n), k = Math.min(1, (sb - 0.03) / 0.22); ang = Math.atan2(figDot(figCrs(a0, nn), u), figDot(a0, nn)) * 180 / Math.PI * k * k * (3 - 2 * k); }
    const Ga = mul(figRot(u, ang * 0.5), R1), Gt = mul(figRot(u, ang), R1), Gb = mul(figTo(figV3(Gt, d2), figSub(W, E)), Gt);
    L[a] = mul(figT3(R0), Ga); L[t] = mul(figT3(Ga), Gt); L[b] = mul(figT3(Gt), Gb); return Gb;
  };
  for (const sd of ['R', 'L']){
    const A = (J.arms || {})[sd], sg = sd === 'R' ? 1 : -1; if (!A) continue;
    // (the collarbone takes the shoulder to where the solver reckoned it, A.sh, when it is given: at most FIG_CLAV degrees, the
    // shoulder pushed ahead or lifted as he reaches)
    const cl = figAdd(s3j, figV3(Rc, figSub(r('clav_' + sd), r('spine3')))), dc = figV3(Rc, figSub(r('uarm_' + sd), r('clav_' + sd))); let Gc = Rc;
    if (A.sh){ const q = figAxis(figTo(dc, figSub(A.sh, cl))); Gc = mul(figRot(q.ax, Math.min(FIG_CLAV, q.deg)), Rc); L['clav_' + sd] = mul(figT3(Rc), Gc); }
    const S = figAdd(cl, figV3(Gc, figSub(r('uarm_' + sd), r('clav_' + sd))));
    const l1 = Math.hypot(...figSub(r('farm_' + sd), r('uarm_' + sd))), l2 = Math.hypot(...figSub(r('hand_' + sd), r('farm_' + sd)));
    const k = figIk(S, A.wr, l1, l2, A.el), E = figArmOut(S, k[0], k[1], Rc, sg), W = k[1];
    const Gf = limb(Gc, S, 'uarm_' + sd, 'utw_' + sd, 'farm_' + sd, 'hand_' + sd, E, W, null);
    if (A.hand){ const Q = mul(figT3(Gf), A.hand), ax = figNrm(figSub(r('hand_' + sd), r('farm_' + sd))), t = Math.max(-80, Math.min(80, figTwist(Q, ax)));
      L['ftw_' + sd] = figRot(ax, t); L['hand_' + sd] = mul(figT3(L['ftw_' + sd]), Q); }
    out.sh[sd] = S; out.el[sd] = E; out.wr[sd] = W; out.over[sd] = k[2];
  }
  for (const sd of ['R', 'L']){
    const A = (J.legs || {})[sd]; if (!A) continue;
    const S = figAdd(hj, figV3(Gh, figSub(r('thigh_' + sd), r('hips')))), l1 = Math.hypot(...figSub(r('shin_' + sd), r('thigh_' + sd))), l2 = Math.hypot(...figSub(r('foot_' + sd), r('shin_' + sd)));
    const k = figIk(S, A.foot, l1, l2, A.knee), Gs = limb(Gh, S, 'thigh_' + sd, 'ttw_' + sd, 'shin_' + sd, 'foot_' + sd, k[0], k[1], [-1, 0, 0]);
    L['foot_' + sd] = mul(figT3(Gs), A.footR || FIG_I3);
    out.hip[sd] = S; out.knee[sd] = k[0]; out.foot[sd] = k[1];
  }
  return {local:L, root, out};
}
// The joints of a figure standing or seated where it was built into a boat (the skiff's skipper and crew, the people on boats seen
// from outside; vessel3d.js figBake), for figFromJoints: hands [left, right] as wrists in the figure's frame, or nothing (down by
// the sides; on the knees seated). S is the scale the figure is drawn at: a seat's height is the boat's, not the figure's.
function figStand(sk, seated, hands, S){
  const LN = figLens(sk), hipY = seated ? 0.46 / S : LN.hip - 0.004, J = {pelvis:[0, hipY, 0], arms:{}, legs:{}};
  for (const [sd, sg] of [['R', 1], ['L', -1]]){
    J.legs[sd] = seated ? {knee:[sg * 0.11, hipY + 0.02, -0.42], foot:[sg * 0.12, LN.ankle, -0.46]} : {knee:[sg * LN.hipX, 0.5, -0.4], foot:[sg * (LN.hipX + 0.01), LN.ankle, 0]};
    const h = hands ? hands[sg < 0 ? 0 : 1] : seated ? [sg * 0.16 / S, hipY + 0.1 / S, -0.36 / S] : [sg * 0.25, 0.9, 0.01];
    J.arms[sd] = {wr:h, el:[sg * 0.4, (LN.hip + LN.sh[0] + h[1]) / 2 - 0.1, 0.25]};
  }
  return J;
}
// the turn of a hand's bone for the 3D view's hand frame [x, y, z] (given in the figure's frame) on the hand whose rest frame is H0
function figHandTurn(H0, x, y, z){ return figMul3(figCols(x, y, z), figT3(H0)); }
// the poses of the check (kropp.POSES, the same numbers): each {local, root}. 'hvile' is the model's own rest pose, 'stå' the standing
// pose the game holds (the arms 13 degrees out from the body, the elbows a little bent).
function figPoses(sk){
  const X = [-1, 0, 0], Y = [0, 1, 0], P = {}, r = figRot;          // (a turn about X by a positive angle bends forward; about Y it turns to the left)
  P['hvile'] = {local:{}, root:[0, 0, 0]};
  P['stå'] = {local:figArms(sk, {}, 13, 0, 14), root:[0, 0, 0]};
  P['armene opp'] = {local:figArms(sk, {clav_R:r([0, 0, -1], -18), clav_L:r([0, 0, -1], 18)}, 140, 14, 10), root:[0, 0, 0]};
  const d = {hips:r(X, 28), spine1:r(X, 8), spine2:r(X, 6)};
  for (const sd of 'RL'){ d['thigh_' + sd] = r(X, -128); d['shin_' + sd] = r(X, 128); d['foot_' + sd] = r(X, -28); }
  P['dyp knebøy'] = {local:figArms(sk, d, 14, 62, 35), root:[0, -0.47, 0.20]};
  const s = {hips:r(X, 6), spine1:r(X, 4)};
  for (const sd of 'RL'){ s['thigh_' + sd] = r(X, -92); s['shin_' + sd] = r(X, 88); }
  P['sittende'] = {local:figArms(sk, s, 12, 38, 62), root:[0, -0.40, 0.28]};
  const b = {hips:r(X, 34), spine1:r(X, 16), spine2:r(X, 12), spine3:r(X, 8), neck:r(X, -12), head:r(X, -10)};
  for (const sd of 'RL'){ b['thigh_' + sd] = r(X, -38); b['shin_' + sd] = r(X, 8); }
  P['bøyd over rekka'] = {local:figArms(sk, b, 10, 58, 20), root:[0, -0.02, 0.06]};
  const va = figArms(sk, {}, 16, 20, 40); Object.assign(va, {spine1:r(Y, 14), spine2:r(Y, 16), spine3:r(Y, 16), neck:r(Y, 14), head:r(Y, 16)});
  P['vridd'] = {local:va, root:[0, 0, 0]};
  P['gange'] = {local:figArms(sk, {thigh_R:r(X, -32), shin_R:r(X, 12), thigh_L:r(X, 22), shin_L:r(X, 30)}, 13, 0, 14), root:[0, -0.04, 0]};
  P['hodevri'] = {local:figArms(sk, {neck:r(Y, 35), head:r(Y, 40)}, 13, 0, 14), root:[0, 0, 0]};
  P['arm frem'] = {local:figArms(sk, {}, 6, 90, 4), root:[0, 0, 0]};
  return P;
}
// a grip's finger turns into the local turns L, from the file's extras (grips[sex][grip].turn: quaternions in the bones' rest frame,
// which is the world's axes). side: 'R', 'L' or nothing for both hands. A grip is the same hand with its fingers turned, not a mesh.
function figGrip(ex, sex, grip, L, side){
  const G = ((ex.grips || {})[sex === 'f' ? 'f' : 'm'] || {})[grip]; L = L || {}; if (!G || !G.turn) return L;
  for (const b in G.turn) if (!side || b.slice(-2) === '_' + side) L[b] = figQuat(G.turn[b]);
  return L;
}
// skinned points on the processor (what the shader does): p (n * 3) and n (n * 3, or null) in the rest pose, j (n * 4 bone indices),
// w (n * 4 weights as bytes, 255 = all), M from figPose. Returns {p, n} as Float32Array. For the figures built once into a boat's
// mesh (FB7) and for the tests.
function figSkin(p, nor, j, w, M){
  const n = p.length / 3, P = new Float32Array(n * 3), N = nor ? new Float32Array(n * 3) : null;
  for (let i = 0; i < n; i++){
    const x = p[i * 3], y = p[i * 3 + 1], z = p[i * 3 + 2]; let ox = 0, oy = 0, oz = 0, nx = 0, ny = 0, nz = 0;
    for (let k = 0; k < 4; k++){
      const wk = w[i * 4 + k] / 255; if (!wk) continue; const m = j[i * 4 + k] * 12;
      ox += wk * (M[m] * x + M[m + 1] * y + M[m + 2] * z + M[m + 3]); oy += wk * (M[m + 4] * x + M[m + 5] * y + M[m + 6] * z + M[m + 7]); oz += wk * (M[m + 8] * x + M[m + 9] * y + M[m + 10] * z + M[m + 11]);
      if (N){ const a = nor[i * 3], b = nor[i * 3 + 1], c = nor[i * 3 + 2]; nx += wk * (M[m] * a + M[m + 1] * b + M[m + 2] * c); ny += wk * (M[m + 4] * a + M[m + 5] * b + M[m + 6] * c); nz += wk * (M[m + 8] * a + M[m + 9] * b + M[m + 10] * c); }
    }
    P[i * 3] = ox; P[i * 3 + 1] = oy; P[i * 3 + 2] = oz;
    if (N){ const l = Math.hypot(nx, ny, nz) || 1; N[i * 3] = nx / l; N[i * 3 + 1] = ny / l; N[i * 3 + 2] = nz / l; }
  }
  return {p:P, n:N};
}
// How many bones a draw call may carry. A bone is three vec4 uniforms, so all 58 are 174 vectors; WebGL 1 promises only 128 in a vertex
// shader (MAX_VERTEX_UNIFORM_VECTORS; WebGL 2 at least 256). other: the vectors the shader's other uniforms take (two mat4 are 8).
// With 58 or more the whole figure is one draw call; with fewer figSplit shares the triangles between palettes.
const FIG_BONES = 58;
function figPalette(maxVectors, other){ return Math.max(12, Math.min(FIG_BONES, Math.floor(((maxVectors || 128) - (other == null ? 16 : other)) / 3))); }
// A figure's triangles (a corner per index: j and w hold 4 per corner) shared between draw calls of at most maxB bones each. A
// triangle goes where its bones already are, else where they fit, else into a new group. Returns [{bones: the group's palette (bone
// indices), tris: its triangles (indices)}]; one group with every bone when maxB holds them all.
function figSplit(j, w, maxB, nBones){
  const nT = j.length / 12; nBones = nBones || FIG_BONES;
  if (maxB >= nBones) return [{bones:Array.from({length:nBones}, (_, i) => i), tris:null}];
  const G = [];
  for (let t = 0; t < nT; t++){
    const need = []; for (let k = t * 12; k < t * 12 + 12; k++) if (w[k] > 0 && need.indexOf(j[k]) < 0) need.push(j[k]);
    if (need.length > maxB) throw new Error('figSplit: a triangle with ' + need.length + ' bones, the palette holds ' + maxB);
    let best = null, add = 1e9;
    for (const g of G){ let a = 0; for (const b of need) if (!g.has[b]) a++; if (g.bones.length + a <= maxB && a < add){ add = a; best = g; if (!a) break; } }
    if (!best){ best = {bones:[], has:{}, tris:[]}; G.push(best); }
    for (const b of need) if (!best.has[b]){ best.has[b] = 1; best.bones.push(b); }
    best.tris.push(t);
  }
  return G.map(g => ({bones:g.bones, tris:g.tris}));
}
// The skinning in GLSL ES 1.00 (WebGL 1, and turned into 3.00 word for word on WebGL 2 by view3d's glsl3): figP bends a point and
// figN a normal by the bones in aJ with the weights in aW. uB holds nb bones, three rows of [R | t] each (figPose's M, or a palette's
// part of it). A uniform array indexed by an attribute is allowed in a vertex shader in both versions.
function figGL(nb){
  return 'attribute vec4 aJ;attribute vec4 aW;uniform vec4 uB[' + (nb * 3) + '];' +
    'vec3 figB(vec4 v,float j){int i=int(j+0.5)*3;return vec3(dot(uB[i],v),dot(uB[i+1],v),dot(uB[i+2],v));}' +
    'vec3 figP(vec3 p){vec4 v=vec4(p,1.0);return figB(v,aJ.x)*aW.x+figB(v,aJ.y)*aW.y+figB(v,aJ.z)*aW.z+figB(v,aJ.w)*aW.w;}' +
    'vec3 figN(vec3 n){vec4 v=vec4(n,0.0);return figB(v,aJ.x)*aW.x+figB(v,aJ.y)*aW.y+figB(v,aJ.z)*aW.z+figB(v,aJ.w)*aW.w;}';
}
