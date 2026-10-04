// ===== THE COAST'S VECTORS (part 4 of the coast-wide plan, 03.10.2026): buildings, roads, bridges, piers and quay faces =====
// One 'vec' pack per 50 km tile (tools/map/vectors.py, from the release kart-5), in metres in the national frame. Inside Senja's legacy
// square the embedded data stays as it was (01-world.js and view3d.js: #bld, GEO_ROADS, BRIDGES, PIERS, which the harbour units and
// the player's berths are fitted to), and a pack's items there are left out, so nothing is drawn twice. A tile is decoded when it is
// first asked for after its pack has come (vecTile), in a worker (a tile of a town is tens of milliseconds of work, which the frames
// must not wait for; on the main thread where a worker cannot start), and let go when the boat and the eye are far from it (vecPrune).
// VEC.came's hooks hear when a tile is in, VEC.drop's when it goes.
//   bld     as #bld: x, z (m), length, width, angle (of pi, clockwise from x), type and levels; cells per km (gridKey)
//   roads   {c, xs, zs, bb} as ROADS, each leg in the tile its middle is in, with the roads per km cell (rcell); the parts under a
//           bridge or in a tunnel are not there
//   bridges [class, length, name, type, x, z, ...] (m) as BRIDGES
//   piers   boxes as PIERBOX (pierBoxes), the quays' lines as decks on their land side; molos the breakwaters' outlines (or lines),
//           which the 3D view builds as rubble mounds; slabs the outlines of the piers mapped as areas, which it builds in their shape
//   quays   the faces a boat can lie at: middle x, z (m), along ux, uz, the normal to the water nx, nz, half length hl, depth (m, null
//           where the 50 m depth has no water off it) and kind (0 pier, 1 pier line, 2 quay, 3 coast); Senja's too (npcBerths)
//   npc     the NPC traffic (tools/map/npc.py): harbours {x, y (km), boats [{id, L, B, T, p, hd, name, liv}], grounds [{p, pts}]},
//           which 05-vessels.js sails by the clock within AIS range
const VEC = {tiles:new Map(), want:new Set(), wait:new Map(), came:[], drop:[], ver:0, worker:null, id:0, ms:0};
// Senja's legacy square as its corners in the national frame (metres): its edges bow by millimetres, so a point is tested against the
// quadrilateral (inSenja takes km)
const SENJAQ = [[0, 0], [LEGF.W, 0], [LEGF.W, LEGF.H], [0, LEGF.H]].map(([x, y]) => { const q = LG(x, y); return [q.x * 1000, q.y * 1000]; });
function inQuad(Q, x, z){ let ins = false; for (let i = 0, j = Q.length - 1; i < Q.length; j = i++){ const xi = Q[i][0], zi = Q[i][1], xj = Q[j][0], zj = Q[j][1]; if ((zi > z) !== (zj > z) && x < xi + (z - zi) * (xj - xi) / (zj - zi)) ins = !ins; } return ins; }
const inSenja = (x, y) => inQuad(SENJAQ, x * 1000, y * 1000);
// the boxes of a pier, a breakwater or a quay's line (kind 0, 1, 2) with n points X(k), Z(k) in metres: a closed pier its bounding box
// along its main axis, a line a box per leg, 4.2 m wide (a breakwater 9 m), and a quay's line a 6 m deck on its land side (the water is
// on the left, (-dz, dx)); src is kept on each box (the 3D view builds a breakwater whose boxes are left as a mound). The worker has it too.
function pierBoxes(out, kind, n, X, Z, src){
  const bw = kind === 1, closed = n > 3 && Math.hypot(X(0) - X(n - 1), Z(0) - Z(n - 1)) < 1;
  if (closed && kind === 0){
    let cx = 0, cz = 0; for (let k = 0; k < n - 1; k++){ cx += X(k); cz += Z(k); } cx /= n - 1; cz /= n - 1;
    let sxx = 0, szz = 0, sxz = 0; for (let k = 0; k < n - 1; k++){ const a = X(k) - cx, b = Z(k) - cz; sxx += a * a; szz += b * b; sxz += a * b; }
    const th = 0.5 * Math.atan2(2 * sxz, sxx - szz), ux = Math.cos(th), uz = Math.sin(th); let l0 = 1e9, l1 = -1e9, w0 = 1e9, w1 = -1e9;
    for (let k = 0; k < n - 1; k++){ const a = X(k) - cx, b = Z(k) - cz, pu = a * ux + b * uz, pv = -a * uz + b * ux; l0 = Math.min(l0, pu); l1 = Math.max(l1, pu); w0 = Math.min(w0, pv); w1 = Math.max(w1, pv); }
    out.push({x:cx + ux * (l0 + l1) / 2 - uz * (w0 + w1) / 2, z:cz + uz * (l0 + l1) / 2 + ux * (w0 + w1) / 2, w:Math.max(3, w1 - w0), l:Math.max(3, l1 - l0), ang:Math.atan2(ux, uz), bw:false, closed:true, src});
  } else for (let k = 0; k < n - 1; k++){
    const ax = X(k), az = Z(k), bx = X(k + 1), bz = Z(k + 1), L = Math.hypot(bx - ax, bz - az); if (L < 0.5) continue;
    if (kind === 2){ const nx = -(bz - az) / L, nz = (bx - ax) / L; out.push({x:(ax + bx) / 2 - nx * 3, z:(az + bz) / 2 - nz * 3, w:6, l:L + 1, ang:Math.atan2(bx - ax, bz - az), bw:false, closed:false, made:true, src}); continue; }
    out.push({x:(ax + bx) / 2, z:(az + bz) / 2, w:bw ? 9 : 4.2, l:L + (bw ? 4 : 1), ang:Math.atan2(bx - ax, bz - az), bw, closed:false, src});
  }
}
// A tile's inflated entries into plain arrays (in the worker, or here): D has tx, ty, T (the tile's size, m), Q (Senja's corners, m),
// and the entries bld, road, bridge, pier, quay (bytes) with their counts nb, nr, ng, np, nq. Self-contained: the worker gets its
// source. Buildings and roads come sorted by km cell (keys and starts), so the main thread makes its maps without going through them.
function vecDecode(D){
  const ox = D.tx * D.T, oz = D.ty * D.T, Q = D.Q, len = q => q <= 160 ? q * 0.5 : 80 + (q - 160) * 2;
  const gk = (ix, iy) => (iy + 524288) * 1048576 + (ix + 524288);
  const quad = (x, z) => { let ins = false; for (let i = 0, j = 3; i < 4; j = i++){ const xi = Q[i][0], zi = Q[i][1], xj = Q[j][0], zj = Q[j][1]; if ((zi > z) !== (zj > z) && x < xi + (z - zi) * (xj - xi) / (zj - zi)) ins = !ins; } return ins; };
  let qx0 = 1e18, qz0 = 1e18, qx1 = -1e18, qz1 = -1e18; for (const [x, z] of Q){ qx0 = Math.min(qx0, x); qz0 = Math.min(qz0, z); qx1 = Math.max(qx1, x); qz1 = Math.max(qz1, z); }
  const senja = (x, z) => x >= qx0 && x <= qx1 && z >= qz0 && z <= qz1 && quad(x, z);
  const lines = b => { let i = 0; const nx = () => { let v = 0, s = 0, x; do { x = b[i++]; v += (x & 127) * Math.pow(2, s); s += 7; } while (x & 128); return v; }, zz = v => (v % 2 ? -(v + 1) / 2 : v / 2), n = nx(), out = [];
    for (let k = 0; k < n; k++){ const c = nx(), m = nx(), xs = new Float64Array(m), zs = new Float64Array(m); let x = 0, z = 0; for (let j = 0; j < m; j++){ x += zz(nx()); z += zz(nx()); xs[j] = ox + x; zs[j] = oz + z; } out.push([c, xs, zs]); } return out; };
  const cellsOf = (keys) => { const order = Array.from(keys.keys()).sort((a, b) => keys[a] - keys[b]), ck = [], cs = []; for (let i = 0; i < order.length; i++) if (!i || keys[order[i]] !== keys[order[i - 1]]){ ck.push(keys[order[i]]); cs.push(i); } cs.push(order.length); return {order:Int32Array.from(order), ck:Float64Array.from(ck), cs:Int32Array.from(cs)}; };
  const r = {tx:D.tx, ty:D.ty, bld:null, roads:null, bridges:[], piers:[], molos:[], slabs:[], quays:[], npc:[]};
  // buildings
  if (D.bld && D.nb){
    const n = D.nb, b = D.bld, u16 = o => b[o] | b[o + 1] << 8, X = new Float64Array(n), Z = new Float64Array(n), Lq = new Float32Array(n), Wq = new Float32Array(n), A = new Float32Array(n), Ty = new Uint8Array(n), Lv = new Uint8Array(n), K = new Float64Array(n);
    let m = 0;
    for (let i = 0; i < n; i++){
      const x = ox + u16(2 * i), z = oz + u16(2 * n + 2 * i); if (senja(x, z)) continue;
      X[m] = x; Z[m] = z; Lq[m] = len(b[4 * n + i]); Wq[m] = Math.max(1.5, len(b[5 * n + i])); A[m] = b[6 * n + i] / 256 * Math.PI; Ty[m] = b[7 * n + i] & 15; Lv[m] = b[7 * n + i] >> 4; K[m] = gk(Math.floor(x / 1000), Math.floor(z / 1000)); m++;
    }
    r.bld = Object.assign({n:m, x:X.slice(0, m), z:Z.slice(0, m), l:Lq.slice(0, m), w:Wq.slice(0, m), a:A.slice(0, m), t:Ty.slice(0, m), lv:Lv.slice(0, m)}, cellsOf(K.subarray(0, m)));
  }
  // roads: each leg in the tile its middle is in (the packs' roads reach 500 m into the next tile), and out of Senja's square
  if (D.road && D.nr){
    const own = (x, z) => x >= ox && x < ox + D.T && z >= oz && z < oz + D.T && !senja(x, z), C = [], O = [0], BB = [], PX = [], PZ = [], RK = [], RI = [];
    let np = 0;
    const put = (c, xs, zs, i0, i1) => { if (i1 - i0 < 1) return; let x0 = 1e18, z0 = 1e18, x1 = -1e18, z1 = -1e18; for (let j = i0; j <= i1; j++){ PX.push(xs[j]); PZ.push(zs[j]); x0 = Math.min(x0, xs[j]); z0 = Math.min(z0, zs[j]); x1 = Math.max(x1, xs[j]); z1 = Math.max(z1, zs[j]); }
      np += i1 - i0 + 1; const ri = C.length; C.push(c); O.push(np); BB.push(x0, z0, x1, z1);
      for (let gz = Math.floor(z0 / 1000); gz <= Math.floor(z1 / 1000); gz++) for (let gx = Math.floor(x0 / 1000); gx <= Math.floor(x1 / 1000); gx++){ RK.push(gk(gx, gz)); RI.push(ri); } };
    for (const [c, xs, zs] of lines(D.road)){ let a = 0; for (let j = 1; j < xs.length; j++) if (!own((xs[j - 1] + xs[j]) / 2, (zs[j - 1] + zs[j]) / 2)){ put(c, xs, zs, a, j - 1); a = j; } put(c, xs, zs, a, xs.length - 1); }
    const cells = cellsOf(Float64Array.from(RK));
    r.roads = {n:C.length, c:Uint8Array.from(C), o:Int32Array.from(O), bb:Float64Array.from(BB), x:Float64Array.from(PX), z:Float64Array.from(PZ), ri:Int32Array.from(cells.order, i => RI[i]), ck:cells.ck, cs:cells.cs};
  }
  // bridges, kept by their middle point
  if (D.bridge && D.ng) for (const q of JSON.parse(new TextDecoder().decode(D.bridge))){
    for (let i = 4; i + 1 < q.length; i += 2){ q[i] += ox; q[i + 1] += oz; }
    const m = 4 + 2 * Math.floor((q.length - 4) / 4); if (!senja(q[m], q[m + 1])) r.bridges.push(q);
  }
  // piers, breakwaters and quays' lines, by their middle
  if (D.pier && D.np) for (const [c, xs, zs] of lines(D.pier)){
    let mx = 0, mz = 0; for (let j = 0; j < xs.length; j++){ mx += xs[j]; mz += zs[j]; } if (senja(mx / xs.length, mz / xs.length)) continue;
    pierBoxes(r.piers, c, xs.length, k => xs[k], k => zs[k], r.slabs.length);
    if (c === 1) r.molos.push(Array.from(xs, (x, j) => [x, zs[j]]));
    else if (c === 0 && xs.length > 3 && Math.hypot(xs[0] - xs[xs.length - 1], zs[0] - zs[xs.length - 1]) < 1) r.slabs.push(Array.from(xs, (x, j) => [x, zs[j]]));
  }
  // the quay faces, Senja's too: they are only where the NPC boats lie (npcBerths), and the packs know the water off them
  if (D.quay && D.nq){
    const n = D.nq, b = D.quay, u16 = o => b[o] | b[o + 1] << 8;
    for (let i = 0; i < n; i++){
      const x = ox + u16(2 * i), z = oz + u16(2 * n + 2 * i), a = u16(4 * n + 2 * i) / 65536 * 2 * Math.PI, nx = Math.cos(a), nz = Math.sin(a);
      r.quays.push({id:D.tx + ':' + D.ty + ':' + i, x, z, nx, nz, ux:-nz, uz:nx, hl:len(b[6 * n + i]) / 2, depth:b[7 * n + i] ? b[7 * n + i] / 4 : null, kind:b[8 * n + i]});
    }
  }
  // the NPC traffic (tools/map/npc.py): harbours with their boats (at their berths) and grounds with the routes there, in km
  if (D.npc && D.nn){
    const J = JSON.parse(new TextDecoder().decode(D.npc)), k = (x, z) => ({x:(ox + x) / 1000, y:(oz + z) / 1000});
    // a share of the boats only (D.keep, NPC_KEEP): kart-6 has about four times the 4 614 active fishing vessels of 2024 (Fiskeridirektoratet);
    // a harbour keeps one at least. The draw is by the boat's id (FNV-1a, self-contained: this runs in the worker too)
    const keep = D.keep == null ? 1 : D.keep, fnv = t => { let x = 2166136261; for (let q = 0; q < t.length; q++) x = Math.imul(x ^ t.charCodeAt(q), 16777619); x ^= x >>> 13; x = Math.imul(x, 0x5bd1e995); x ^= x >>> 15; return (x >>> 0) / 4294967296; };
    r.npcRaw = 0;
    J.h.forEach((h, hi) => { r.npcRaw += h.b.length; let boats = h.b.map((b, bi) => ({id:'c' + D.tx + ':' + D.ty + '.' + hi + '.' + bi, L:b[0], B:b[1], T:b[2], p:k(b[3], b[4]), hd:b[5], name:b[6], liv:(hi * 7 + bi) % 4}));
      if (keep < 1){ const w = boats.map(b => fnv(b.id)), kept = boats.filter((b, i) => w[i] < keep); boats = kept.length ? kept : [boats[w.indexOf(Math.min(...w))]]; }
      r.npc.push({x:(ox + h.x) / 1000, y:(oz + h.z) / 1000, boats,
        grounds:h.g.map(g => { const pts = []; for (let i = 0; i + 1 < g[2].length; i += 2) pts.push(k(g[2][i], g[2][i + 1])); return {p:k(g[0], g[1]), pts}; })}); });
  }
  return r;
}
// the decoded arrays into the tile the views read: the cells as maps of index lists, the roads as objects over the shared arrays
function vecFinish(r){
  const T = MAPD.man.tile * 1000, k = r.tx + ':' + r.ty, t = {k, tx:r.tx, ty:r.ty, x0:r.tx * T, z0:r.ty * T, bld:null, roads:[], rcell:new Map(), bridges:r.bridges, piers:r.piers, molos:r.molos, slabs:r.slabs, quays:r.quays, npc:r.npc, npcRaw:r.npcRaw || 0};
  if (r.bld){ const B = t.bld = Object.assign(r.bld, {cells:new Map(), seed:(r.tx * 131 + r.ty * 977) * 1000003 % 2147483647}); for (let i = 0; i < B.ck.length; i++) B.cells.set(B.ck[i], B.order.subarray(B.cs[i], B.cs[i + 1])); }
  if (r.roads){ const R = r.roads; for (let i = 0; i < R.n; i++) t.roads.push({c:R.c[i], xs:R.x.subarray(R.o[i], R.o[i + 1]), zs:R.z.subarray(R.o[i], R.o[i + 1]), bb:[R.bb[4 * i], R.bb[4 * i + 1], R.bb[4 * i + 2], R.bb[4 * i + 3]]}); for (let i = 0; i < R.ck.length; i++) t.rcell.set(R.ck[i], R.ri.subarray(R.cs[i], R.cs[i + 1])); }
  VEC.tiles.set(k, t); VEC.ver++; for (const f of VEC.came) f(t);
  return t;
}
// the worker, from the source of vecDecode and pierBoxes; null when it cannot start (it is tried once)
function vecWorker(){
  if (VEC.worker !== null) return VEC.worker || null;
  try {
    const src = pierBoxes.toString() + '\n' + vecDecode.toString() + '\n' +
      'const inflate = async b => new Uint8Array(await new Response(new Blob([b]).stream().pipeThrough(new DecompressionStream("deflate-raw"))).arrayBuffer());\n' +
      'onmessage = async e => { const D = e.data; try { for (const n of ["bld", "road", "bridge", "pier", "quay", "npc"]) if (D[n]) D[n] = await inflate(D[n]); const r = vecDecode(D), tr = []; for (const o of [r.bld, r.roads]) if (o) for (const v of Object.values(o)) if (ArrayBuffer.isView(v)) tr.push(v.buffer); postMessage({id:D.id, r}, tr); } catch (err){ postMessage({id:D.id, err:String(err)}); } };';
    const w = new Worker(URL.createObjectURL(new Blob([src], {type:'text/javascript'})));
    w.onmessage = e => { const {id, r, err} = e.data, q = VEC.wait.get(id); VEC.wait.delete(id); if (!q) return; if (err){ console.error('vec: ' + err); vecDecodeHere(q.pk); return; } VEC.ms += performance.now() - q.t0; q.pk.vecQ = false; vecFinish(r); };
    w.onerror = e => { console.error('vec worker', e.message || e); e.preventDefault && e.preventDefault(); VEC.worker = false; for (const q of VEC.wait.values()) vecDecodeHere(q.pk); VEC.wait.clear(); };
    VEC.worker = w;
  } catch (e){ VEC.worker = false; }
  return VEC.worker || null;
}
const VECN = {bld:'nb', road:'nr', bridge:'ng', pier:'np', quay:'nq', npc:'nn'};
// the share of the packs' NPC boats the game keeps (vecDecode; with one a harbour at least it comes to about a quarter of kart-6's
// 19 411): 1 when the packs have the right number themselves (kart-7)
const NPC_KEEP = 0.17;
function vecInput(pk, inflate){
  const D = {tx:pk.tile[0], ty:pk.tile[1], T:MAPD.man.tile * 1000, Q:SENJAQ, keep:NPC_KEEP}, B = MAPD.man.tile / MAPD.man.block;
  for (const n in VECN){
    const e = pk.idx.get(n + ':' + pk.tile[0] * B + ':' + pk.tile[1] * B); if (!e) continue;
    const z = pk.buf.subarray(e[0], e[0] + e[1]); D[n] = inflate ? fflate.inflateSync(z) : z.slice(); D[VECN[n]] = e[2] || 0;
  }
  return D;
}
function vecDecodeHere(pk){ pk.vecQ = false; const t0 = performance.now(), t = vecFinish(vecDecode(vecInput(pk, true))); VEC.ms += performance.now() - t0; return t; }
// a tile decoded, or null while its pack is not in, it is being decoded, or the build has none; asking starts the decoding
function vecTile(tx, ty){
  const k = tx + ':' + ty, t = VEC.tiles.get(k); if (t) return t;
  const pk = MAPD.man && MAPD.byTile.get('vec:' + k); if (!pk || !pk.buf || pk.vecQ) return null;
  const w = VEC.forceMain ? null : vecWorker(); if (!w) return vecDecodeHere(pk);
  const id = ++VEC.id, D = vecInput(pk, false); D.id = id; pk.vecQ = true; VEC.wait.set(id, {pk, t0:performance.now()});
  w.postMessage(D, Object.keys(VECN).filter(n => D[n]).map(n => D[n].buffer));
  return null;
}
// the decoded tiles over a box of metres (asking for the others)
function vecTilesIn(x0, z0, x1, z1){
  if (!MAPD.man) return []; const T = MAPD.man.tile * 1000, out = [];
  for (let ty = Math.floor(z0 / T); ty <= Math.floor(z1 / T); ty++) for (let tx = Math.floor(x0 / T); tx <= Math.floor(x1 / T); tx++){ const t = vecTile(tx, ty); if (t) out.push(t); }
  return out;
}
// whether a tile has a vec pack at all (a build without them, the artifact's, keeps Senja's embedded data alone)
const vecHas = (tx, ty) => !!(MAPD.man && MAPD.byTile.get('vec:' + tx + ':' + ty));
// the roads over a box of metres: Senja's (ROADS) and the packs'
function roadsIn(x0, z0, x1, z1){
  const out = [];
  if (ROADS && x1 > HOME.x0 * 1000 && x0 < HOME.x1 * 1000 && z1 > HOME.y0 * 1000 && z0 < HOME.y1 * 1000) for (const r of ROADS) if (r.bb[2] >= x0 && r.bb[0] <= x1 && r.bb[3] >= z0 && r.bb[1] <= z1) out.push(r);
  for (const t of vecTilesIn(x0, z0, x1, z1)){
    const seen = new Set();
    for (let gz = Math.floor(z0 / 1000); gz <= Math.floor(z1 / 1000); gz++) for (let gx = Math.floor(x0 / 1000); gx <= Math.floor(x1 / 1000); gx++){
      const l = t.rcell.get(gridKey(gx, gz)); if (!l) continue;
      for (const i of l){ if (seen.has(i)) continue; seen.add(i); const r = t.roads[i]; if (r.bb[2] >= x0 && r.bb[0] <= x1 && r.bb[3] >= z0 && r.bb[1] <= z1) out.push(r); }
    }
  }
  return out;
}
// the packs' bridges over a box of metres (Senja's are BRIDGES)
function bridgesIn(x0, z0, x1, z1){ const out = []; for (const t of vecTilesIn(x0, z0, x1, z1)) for (const q of t.bridges){ let a = 1e18, b = 1e18, c = -1e18, d = -1e18; for (let i = 4; i + 1 < q.length; i += 2){ a = Math.min(a, q[i]); b = Math.min(b, q[i + 1]); c = Math.max(c, q[i]); d = Math.max(d, q[i + 1]); } if (c >= x0 && a <= x1 && d >= z0 && b <= z1) out.push(q); } return out; }
// the vec packs over a box of km, each asked for once; then() when one comes
function vecWant(x0, y0, x1, y1, then){
  if (!MAPD.man) return;
  for (const pk of mapPacksIn('vec', x0, y0, x1, y1)){
    if (pk.buf || VEC.want.has(pk)) continue; VEC.want.add(pk);
    mapLoad(pk).then(() => { VEC.want.delete(pk); if (then) then(pk); }, e => { VEC.want.delete(pk); console.error(e); });
  }
}
// let the decoded tiles go that are more than R km from every point given (km); VEC.drop's hooks (the 3D view) free what they built
function vecPrune(pts, R = 60){
  const T = MAPD.man ? MAPD.man.tile : 50;
  for (const [k, t] of VEC.tiles){
    const far = pts.every(p => Math.max(Math.abs(p.x - (t.tx + 0.5) * T), Math.abs(p.y - (t.ty + 0.5) * T)) > R + T / 2);
    if (far){ VEC.tiles.delete(k); VEC.ver++; for (const f of VEC.drop) f(t); }
  }
}
