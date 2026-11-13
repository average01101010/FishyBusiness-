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
