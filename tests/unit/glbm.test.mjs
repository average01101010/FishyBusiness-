// The read models in GLBM as typed arrays (Ø3d, steg 21c, 10.11.2026): glbParse gives each part as Float32Array (p, n, c), Uint8Array
// (zone) and Float64Array (ao) instead of plain arrays of 8 bytes a number. The models must be the same triangle for triangle, so this
// builds every type with a model at every level (0.3, 1, 2), bare, painted, with a design and as your own boat, from the core as it is
// and from a second core whose glbParse is the plain-array reader from before (REF below, as it stood on 09.11.2026), and compares a
// hash of what goes to the GPU (each number as float32: the positions, normals, colours, the glass and the depth cap), the hull's
// triangles for the physics (hullTris) and the paint zones (glbZones). A re-exported model changes both sides alike, so the check holds
// when the Blender models change. Where the code makes new corners out of the positions (the outboard, the tiller and the propeller moved
// to their places; a design's lines cutting the hull) the float32 positions give the same corners to within a float32's last digits, not
// bit for bit (measured 10.11.2026: at most 0.24 µm for the moved parts, 0.066 mm for the cuts): those must have the same number of
// corners and every number within TOL. KYST_GLBM_DUMP=<file> writes the hashes, to compare against an older build of the core.
import { writeFileSync } from 'node:fs';
export const scripts = ['js/vessel3d.js'];
export const data = true;

// glbParse as it stood before Ø3d (plain arrays, a corner per triangle), with its lazy parts: the reference
export function REF(glbBytes){
  return function glbParse(b64){
    const u8 = glbBytes(b64); let dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength); if (dv.getUint32(0, true) !== 0x46546C67) return null;
    const jl = dv.getUint32(12, true), J = JSON.parse(new TextDecoder().decode(u8.subarray(20, 20 + jl))), bo = 20 + jl + 8;
    const NC = {SCALAR:1, VEC2:2, VEC3:3, VEC4:4}, SZ = {5120:1, 5121:1, 5122:2, 5123:2, 5125:4, 5126:4};
    const acc = i => { const A = J.accessors[i], BV = J.bufferViews[A.bufferView], n = NC[A.type], ct = A.componentType, sz = SZ[ct], st = BV.byteStride || n * sz, off = bo + (BV.byteOffset || 0) + (A.byteOffset || 0), out = new Float32Array(A.count * n);
      for (let k = 0; k < A.count; k++) for (let c = 0; c < n; c++){ const o = off + k * st + c * sz;
        let v = ct === 5120 ? dv.getInt8(o) : ct === 5121 ? dv.getUint8(o) : ct === 5122 ? dv.getInt16(o, true) : ct === 5123 ? dv.getUint16(o, true) : ct === 5125 ? dv.getUint32(o, true) : dv.getFloat32(o, true);
        if (A.normalized) v = ct === 5120 ? Math.max(v / 127, -1) : ct === 5121 ? v / 255 : ct === 5122 ? Math.max(v / 32767, -1) : ct === 5123 ? v / 65535 : v;
        out[k * n + c] = v; }
      return out; };
    const read = nd => {
      const pr = J.meshes[nd.mesh].primitives[0], P = acc(pr.attributes.POSITION), N = acc(pr.attributes.NORMAL), Cc = acc(pr.attributes.COLOR_0), Q = pr.attributes._PAINT != null ? acc(pr.attributes._PAINT) : null, I = acc(pr.indices);
      const t = nd.translation || [0, 0, 0], s = nd.scale || [1, 1, 1], nI = I.length, o = {p:new Array(nI * 3), n:new Array(nI * 3), c:new Array(nI * 4), zone:Q ? new Array(nI) : [], ao:Q ? new Array(nI) : []};
      for (let k = 0; k < nI; k++){ const i = I[k], k3 = k * 3, k4 = k * 4, i3 = i * 3, i4 = i * 4;
        o.p[k3] = P[i3] * s[0] + t[0]; o.p[k3 + 1] = P[i3 + 1] * s[1] + t[1]; o.p[k3 + 2] = P[i3 + 2] * s[2] + t[2];
        o.n[k3] = N[i3]; o.n[k3 + 1] = N[i3 + 1]; o.n[k3 + 2] = N[i3 + 2];
        o.c[k4] = Cc[i4]; o.c[k4 + 1] = Cc[i4 + 1]; o.c[k4 + 2] = Cc[i4 + 2]; o.c[k4 + 3] = Cc[i4 + 3];
        if (Q){ o.zone[k] = Q[i4]; o.ao[k] = Q[i4 + 1] / 255; } }
      return o;
    };
    const parts = {}, node = new Map(), got = new Map();
    for (const nd of J.nodes) node.set(nd.name, nd);
    let left = node.size;
    const take = (nm, keep) => {
      if (got.has(nm)) return got.get(nm);
      let v = null; if (dv) try { v = read(node.get(nm)); } catch (e){ v = null; }
      if (keep){ got.set(nm, v); if (--left <= 0) dv = null; }
      return v; };
    for (const nm of node.keys()) Object.defineProperty(parts, nm, {enumerable:true, configurable:true, get:() => take(nm, true)});
    Object.defineProperty(parts, 'peek', {value:nm => node.has(nm) ? take(nm, false) : undefined});
    return {parts, ex:(J.scenes[0] && J.scenes[0].extras) || {}};
  };
}

// the most a number may differ where corners are made from the positions (metres, or a normal's or a colour's part)
const TOL = 1e-4;
// FNV-1a over the float32 bits of the numbers (what the GPU is given), with the count first
const F = new Float32Array(1), U = new Uint32Array(F.buffer);
function hashNums(h, a){
  const n = a ? a.length : -1; h = Math.imul(h ^ (n >>> 0), 16777619) >>> 0;
  for (let i = 0; i < n; i++){ F[0] = a[i]; h = Math.imul(h ^ U[0], 16777619) >>> 0; }
  return h;
}
function hashModel(m){
  if (!m) return 'null';
  let h = 2166136261; for (const o of [m.o, m.glass]) for (const k of ['p', 'n', 'c']) h = hashNums(h, o && o[k]);
  h = hashNums(h, m.cap ? m.cap.flat(2) : null);
  return h.toString(16).padStart(8, '0') + ':' + (m.o.p.length / 3);
}

export default function (t){
  const K = t.K, R = t.fresh(); R.set('glbParse', REF(R.glbBytes));
  const {VESSELS, vesselSpec, glbHas} = K, types = Object.keys(VESSELS).filter(k => vesselSpec(k) && glbHas(k));
  t.ok(types.length >= 15, 'typene med Blender-modell: ' + types.length);
  // bare; painted (hull, house, deck: glbPaint); a design over the paint (the lines cut the triangles: glbDesign); the stripe
  const LIVS = [null, {hull:[0.7, 0.1, 0.1], house:[0.9, 0.9, 0.85], deck:[0.35, 0.35, 0.3]}, {hull:[0.1, 0.2, 0.5], ripe:[0.9, 0.9, 0.9], totone:[0.8, 0.2, 0.1], vann:[0.1, 0.1, 0.1], lakk:1}, {stripe:[0.9, 0.7, 0.1]}];
  const out = {}, ref = {}, bad = []; let exact = 0, near = 0, worst = 0;
  // the topsides' profile (the designs' lines follow it): the same at every station but the two ends, where a station falls on the hull's
  // own first or last corner and the old reader's last bits decided whether it caught that corner (the stern's tip) or took the station
  // next to it; with float32 positions the end station is the corner's own z and always catches it, as it did on 11 of the 15 types
  // before. The reference core is then given the new profiles, so what the designs are compared on below is the reader alone
  const tops = []; for (const k of types){ const A = K.topsides(k), B = R.topsides(k); if (!A || !B){ if (!A !== !B) bad.push('topsides ' + k); continue; }
    let d = 0; for (let i = 1; i < A.N; i++) d = Math.max(d, Math.abs(A.top[i] - B.top[i]), Math.abs(A.bot[i] - B.bot[i]));
    const e = [0, A.N].filter(i => Math.abs(A.top[i] - B.top[i]) + Math.abs(A.bot[i] - B.bot[i]) > 1e-4);
    if (d > TOL || A.N !== B.N || Math.abs(A.z0 - B.z0) > TOL || Math.abs(A.z1 - B.z1) > TOL) bad.push('topsides ' + k + ' ' + d.toExponential(2)); if (e.length) tops.push(k);
    R.TOPS[k] = A; }
  // the largest difference between two models' arrays, or Infinity when their lengths differ
  const diff = (a, b) => { let d = 0; for (const [x, y] of [[a.o, b.o], [a.glass, b.glass]]) for (const k of ['p', 'n', 'c']){ const A = x[k], B = y[k];
    if (A.length !== B.length) return Infinity; for (let i = 0; i < A.length; i++){ const e = Math.abs(Math.fround(A[i]) - Math.fround(B[i])); if (e > d) d = e; } } return d; };
  for (const k of types) for (const lod of [0.3, 1, 2]) for (let li = 0; li < LIVS.length; li++) for (const own of [false, true]){
    if (own && !(k in K.MOBCUT) && !K.KITADD[k]) continue;
    const key = `${k}|${lod}|${li}|${own ? 1 : 0}`, A = K.buildVesselModel(k, lod, LIVS[li], own), B = R.buildVesselModel(k, lod, LIVS[li], own), a = hashModel(A), b = hashModel(B);
    out[key] = a; ref[key] = b;
    if (a === b){ exact++; continue; }
    const d = A && B && a.split(':')[1] === b.split(':')[1] && hashNums(2166136261, A.cap ? A.cap.flat(2) : null) === hashNums(2166136261, B.cap ? B.cap.flat(2) : null) ? diff(A, B) : Infinity;
    if (d <= TOL){ near++; worst = Math.max(worst, d); } else bad.push(key + ' ' + a + ' mot ' + b + ' (' + d.toExponential(2) + ')');
  }
  const hz = (X, k) => { const T = X.hullTris(k); return hashNums(2166136261, T ? T.flat(2) : null).toString(16) + ':' + (T ? T.length : 0); };
  for (const k of types){ out['hullTris|' + k] = hz(K, k); ref['hullTris|' + k] = hz(R, k); if (out['hullTris|' + k] !== ref['hullTris|' + k]) bad.push('hullTris ' + k);
    const za = JSON.stringify(K.glbZones(k)), zb = JSON.stringify(R.glbZones(k)); out['zones|' + k] = za; ref['zones|' + k] = zb; if (za !== zb) bad.push('glbZones ' + k); }
  t.ok(!bad.length, `${exact + near} modeller like med typede tabeller og med de gamle: ${exact} float32 for float32, ${near} med nye hjørner regnet av posisjonene (motoren på plass, designlinjene) innen ${(worst * 1000).toFixed(4)} mm; skrogene for fysikken, malingssonene og profilen langs skroget like (endestasjonen akter skiller på ${tops.length}: ${tops.join(', ') || 'ingen'})`
    + (bad.length ? '; ulike: ' + bad.slice(0, 8).join('; ') + (bad.length > 8 ? ` … (${bad.length})` : '') : ''));
  // f32cat and f32moved as concat and push did (plain and typed in, a null left out), asF32 without a copy for a Float32Array
  const fa = new Float32Array([1.5, 2.25, 3]), cat = K.f32cat([0.1, 0.2], fa, null, [7]), mv = K.f32moved(fa, [[1, 2, 3, 4, 5, 6], [10, 20, 30]], null);
  t.ok(cat instanceof Float32Array && cat.join() === Array.from(new Float32Array([0.1, 0.2, 1.5, 2.25, 3, 7])).join() && mv.join() === '1.5,2.25,3,11,22,33,14,25,36' && K.asF32(fa) === fa && K.asF32([1, 2]) instanceof Float32Array,
    'f32cat og f32moved setter tabeller etter hverandre som concat og push, asF32 kopierer ikke en Float32Array');
  // the people (wkPart: painted by zone like a boat) and the harbour works' near meshes (the glass after the model, view3d/07-harbour-unit.js)
  const W = K.glbLoad('worker'), wn = W ? Object.keys(W.parts) : [], wbad = [];
  for (const kit of ['crew', 'skipper']) for (const nm of wn){ const a = K.wkPart(nm, kit), b = R.wkPart(nm, kit); if (!a !== !b){ wbad.push(nm); continue; } if (!a) continue;
    let h1 = 2166136261, h2 = 2166136261; for (const k of ['p', 'n', 'c']){ h1 = hashNums(h1, a[k]); h2 = hashNums(h2, b[k]); } if (h1 !== h2) wbad.push(kit + ':' + nm); }
  const hb = [], hn = []; for (const u of ['harbour', 'harbour-y', 'harbour-s', 'harbour-naust', 'harbour-shop', 'harbour-rorbu']){ const A = K.glbLoad(u), B = R.glbLoad(u); if (!A || !B || !A.parts.lod0) continue; hn.push(u);
    const ga = A.parts.glass || {p:[], n:[], c:[]}, gb = B.parts.glass || {p:[], n:[], c:[]};
    for (const k of ['p', 'n', 'c']) if (hashNums(2166136261, K.f32cat(A.parts.lod0[k], ga[k])) !== hashNums(2166136261, B.parts.lod0[k].concat(gb[k]))) hb.push(u + '.' + k); }
  t.ok(wn.length > 20 && !wbad.length && hn.length >= 1 && !hb.length, `folka (${wn.length} deler, to drakter) og havneanleggenes nære nett med glasset (${hn.join(', ')}) like float32 for float32` + (wbad.length || hb.length ? ': ulike ' + wbad.concat(hb).slice(0, 8).join(', ') : ''));
  // the parts are typed, and a part read twice is the same object (kept in GLBM)
  const P = K.glbPart(types[0], 'lod0');
  t.ok(P && P.p instanceof Float32Array && P.n instanceof Float32Array && P.c instanceof Float32Array && P.zone instanceof Uint8Array && P.ao instanceof Float64Array && K.glbPart(types[0], 'lod0') === P,
    `delene er typede tabeller (${types[0]} lod0: ${P && P.p.constructor.name}, ${P && P.zone.constructor.name}, ${P && P.ao.constructor.name})`);
  if (process.env.KYST_GLBM_DUMP){ writeFileSync(process.env.KYST_GLBM_DUMP, JSON.stringify(out)); writeFileSync(process.env.KYST_GLBM_DUMP.replace(/\.json$/, '') + '-ref.json', JSON.stringify(ref)); }
}
