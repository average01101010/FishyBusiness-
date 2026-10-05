// ===== WHAT A ROUTE MUST NOT SAIL THROUGH (Jonas 05.10.2026: «autoruter aldri skal gå gjennom 3d elementer eller landmasse», along
// the whole coast: «broer, staker, påler, lykter, kardinal og lateralmerker og det meste») =====
// The things the 3D view builds in the water, as the simulation sees them, in metres in the national frame:
//  - a road bridge (BRIDGES on Senja, the coast's vec packs elsewhere): its piers where view3d.js bridgeInto sets them (one in each
//    70 m along the deck), and the deck itself as a wall where its underside is lower than the boat (a bridge under 60 m lies low
//    over the water all along; a long one near its ends). The underside is reckoned with the ends at 1 m, which the 3D view's ends
//    are at or above, so where a route goes under, the drawn deck is at least as high
//  - the piers and breakwaters on piles (PIERBOX and the packs' piers; not the quay decks, which stand on the land behind a face)
//  - Father's naust's pile quay
//  - the sea marks the 3D view builds: beacons, stakes, lights and buoys (SEAMARKS.marks, Senja only for now)
// A harbour unit's block and fill are land already (isLand). Each thing is a circle, a box or a piece of deck, indexed per 250 m cell;
// the index is built again when the coast's packs change (VEC.ver), the naust moves or the boat changes.
// obsSegHit(a, b) gives the first thing a straight leg comes too near (or null); obsDetour(a, b) the points that take a leg round it:
// under a bridge between its piers, where the deck is high enough, and round a pier or a mark on the shorter side.
const HIND = {C:250, idx:null, key:'', list:[], stamp:0, ctx:null, br:new WeakMap()};
// how high the boat stands over the water (m; an estimate from her length: a 7 m snekke 2.5 m, a 15 m sjark 5 m, a 28 m ocean boat
// 10 m), and 1 m for the tide and the sea
const obsAir = () => Math.min(16, Math.max(2, (BOAT.len || 8) * 0.35)) + 1;
// how near a leg may pass (m): half the boat's beam and a margin
const obsClr = () => (BOAT.beam || 3) / 2 + 6;
const obsMarkR = {M:3, m:1, P:1, D:0.5, L:0.5, B:1, C:1, S:0.5, K:1.5};
// a bridge's piers and deck pieces (as bridgeInto builds them), worked out once per bridge
function obsBridge(br){
  let o = HIND.br.get(br); if (o) return o;
  const cls = br[0], L = br[1], n = (br.length - 4) / 2, X = k => br[4 + k * 2], Z = k => br[5 + k * 2];
  const cum = [0]; for (let k = 1; k < n; k++) cum.push(cum[k - 1] + Math.hypot(X(k) - X(k - 1), Z(k) - Z(k - 1)));
  const tot = cum[n - 1] || 1, clear = L < 60 ? 0 : clamp(tot * 0.036, 6, 42), wdt = [9, 8.5, 7.5, 7, 5][cls] || 7, hw = wdt / 2, gd = clamp(L / 450, 1.1, 2.6), gw = hw * 0.55;
  const under = s => 1 + clear * Math.pow(Math.sin(Math.PI * clamp(s / tot, 0, 1)), 0.55) - gd;
  o = {br, piers:[], deck:[], tot, hw, under};
  for (let k = 0; k < n - 1; k++){
    const ax = X(k), az = Z(k), bx = X(k + 1), bz = Z(k + 1), segL = Math.hypot(bx - ax, bz - az); if (segL < 0.01) continue;
    const ux = (bx - ax) / segL, uz = (bz - az) / segL;
    // the deck in pieces of 8 m or less, each with its lowest underside
    const st8 = Math.max(1, Math.ceil(segL / 8));
    for (let q = 0; q < st8; q++){ const u0 = q / st8, u1 = (q + 1) / st8, s0 = cum[k] + segL * u0, s1 = cum[k] + segL * u1;
      o.deck.push({t:2, ax:ax + (bx - ax) * u0, az:az + (bz - az) * u0, bx:ax + (bx - ax) * u1, bz:az + (bz - az) * u1, r:hw + 0.4, under:Math.min(under(s0), under(s1)), s0, s1, ux, uz, B:o}); }
    // the piers: in the 18 m step where the deck passes a multiple of 70 m (and the first), in its middle, 3 m along and pw across
    const st18 = Math.max(1, Math.ceil(segL / 18)), pw = Math.min(gw * 1.6, 5);
    for (let q = 0; q < st18; q++){ const u0 = q / st18, u1 = (q + 1) / st18, s0 = cum[k] + segL * u0, s1 = cum[k] + segL * u1;
      if (Math.floor(s0 / 70) !== Math.floor(s1 / 70) || (q === 0 && k === 0)) o.piers.push({t:0, x:ax + (bx - ax) * (u0 + u1) / 2, z:az + (bz - az) * (u0 + u1) / 2, r:Math.hypot(pw / 2, 1.5), s:(s0 + s1) / 2, ux, uz, B:o}); }
  }
  HIND.br.set(br, o); return o;
}
// everything there is now, in a grid of 250 m cells (each thing in every cell within 40 m of it)
function obsIndex(){
  const nk = S.naust && S.naust.o ? S.naust.o.join(',') : '', key = VEC.ver + '|' + nk;
  if (HIND.idx && HIND.key === key) return HIND.idx;
  const idx = new Map(), list = [], C = HIND.C, pad = 40;
  const put = o => { let x0, z0, x1, z1;
    if (o.t === 2){ x0 = Math.min(o.ax, o.bx) - o.r; x1 = Math.max(o.ax, o.bx) + o.r; z0 = Math.min(o.az, o.bz) - o.r; z1 = Math.max(o.az, o.bz) + o.r; }
    else { const e = o.t === 1 ? o.l + o.w : o.r; x0 = o.x - e; x1 = o.x + e; z0 = o.z - e; z1 = o.z + e; }
    o.id = list.length; o.st = 0; list.push(o);
    for (let j = Math.floor((z0 - pad) / C); j <= Math.floor((z1 + pad) / C); j++) for (let i = Math.floor((x0 - pad) / C); i <= Math.floor((x1 + pad) / C); i++){ const k = i * 1048576 + j; let a = idx.get(k); if (!a) idx.set(k, a = []); a.push(o); } };
  const bridges = BRIDGES.slice(); for (const t of VEC.tiles.values()) for (const q of t.bridges) bridges.push(q);
  for (const br of bridges){ const o = obsBridge(br); o.piers.forEach(put); o.deck.forEach(put); }
  const box = (q, why) => { if (q.made) return; put({t:1, x:q.x, z:q.z, l:q.l / 2, w:q.w / 2, ux:Math.sin(q.ang), uz:Math.cos(q.ang), why}); };
  for (const q of PIERBOX) box(q, 'pier');
  for (const t of VEC.tiles.values()) for (const q of t.piers) box(q, 'pier');
  if (S.naust && S.naust.o){ const n = S.naust, f = {x:n.o[0] - n.u[0] * 0.5, z:n.o[1] - n.u[1] * 0.5}, nx = -n.u[1], nz = n.u[0];
    put({t:1, x:f.x - nx * 1.7, z:f.z - nz * 1.7, l:8.1, w:1.7, ux:n.u[0], uz:n.u[1], why:'naust'}); }
  for (const mk of SEAMARKS.marks){ const r = obsMarkR[mk[2]]; if (r) put({t:0, x:mk[0] * 1000, z:mk[1] * 1000, r, why:'mark'}); }
  HIND.idx = idx; HIND.list = list; HIND.key = key; return idx;
}
// the distance (m) from the leg a-b (metres) to a thing, 0 inside it
function obsDist(o, ax, az, bx, bz){
  const ps = (px, pz, x0, z0, x1, z1) => { const dx = x1 - x0, dz = z1 - z0, L2 = dx * dx + dz * dz, u = L2 ? clamp(((px - x0) * dx + (pz - z0) * dz) / L2, 0, 1) : 0; return Math.hypot(px - x0 - dx * u, pz - z0 - dz * u); };
  const cross = (x0, z0, x1, z1, x2, z2, x3, z3) => { const d = (x1 - x0) * (z3 - z2) - (z1 - z0) * (x3 - x2); if (!d) return false; const s = ((x2 - x0) * (z3 - z2) - (z2 - z0) * (x3 - x2)) / d, t = ((x2 - x0) * (z1 - z0) - (z2 - z0) * (x1 - x0)) / d; return s >= 0 && s <= 1 && t >= 0 && t <= 1; };
  if (o.t === 0) return Math.max(0, ps(o.x, o.z, ax, az, bx, bz) - o.r);
  if (o.t === 2){ if (cross(ax, az, bx, bz, o.ax, o.az, o.bx, o.bz)) return 0;
    return Math.max(0, Math.min(ps(o.ax, o.az, ax, az, bx, bz), ps(o.bx, o.bz, ax, az, bx, bz), ps(ax, az, o.ax, o.az, o.bx, o.bz), ps(bx, bz, o.ax, o.az, o.bx, o.bz)) - o.r); }
  // a box: in its frame, the leg against the rectangle (a segment and a convex shape are nearest at an end or a corner, if they do not cross)
  const loc = (x, z) => [(x - o.x) * o.ux + (z - o.z) * o.uz, -(x - o.x) * o.uz + (z - o.z) * o.ux], [pa, qa] = loc(ax, az), [pb, qb] = loc(bx, bz), l = o.l, w = o.w;
  const inR = (p, q) => Math.abs(p) <= l && Math.abs(q) <= w; if (inR(pa, qa) || inR(pb, qb)) return 0;
  const K = [[-l, -w], [l, -w], [l, w], [-l, w]];
  for (let i = 0; i < 4; i++){ const c = K[i], d = K[(i + 1) % 4]; if (cross(pa, qa, pb, qb, c[0], c[1], d[0], d[1])) return 0; }
  const out = (p, q) => Math.hypot(Math.max(0, Math.abs(p) - l), Math.max(0, Math.abs(q) - w));
  return Math.min(out(pa, qa), out(pb, qb), ...K.map(c => ps(c[0], c[1], pa, qa, pb, qb)));
}
// the things that count for this leg: a bridge's deck only where it is lower than the boat; none within HIND.ctx.free m of the ends
// of the route being planned (a boat lying at a pier, a route that ends at the naust's quay)
function obsCounts(o, air){
  if (o.t === 2 && o.under >= air) return false;
  const c = HIND.ctx; if (c && c.free) for (const p of c.free) if (Math.hypot((o.t === 2 ? (o.ax + o.bx) / 2 : o.x) - p[0], (o.t === 2 ? (o.az + o.bz) / 2 : o.z) - p[1]) < c.freeR) return false;
  return true;
}
// the first thing (nearest a) that the leg a-b (km) passes within clr metres of, or null
function obsSegHit(a, b, clr){
  const idx = obsIndex(); if (!idx.size) return null;
  clr = clr === undefined ? obsClr() : clr; const air = obsAir(), C = HIND.C, ax = a.x * 1000, az = a.y * 1000, bx = b.x * 1000, bz = b.y * 1000, st = ++HIND.stamp;
  let best = null, bt = Infinity;
  // the cells the leg passes through (each thing is in every cell within 40 m of it, and clr is less)
  let i = Math.floor(ax / C), j = Math.floor(az / C); const i1 = Math.floor(bx / C), j1 = Math.floor(bz / C), dx = bx - ax, dz = bz - az;
  const si = dx > 0 ? 1 : -1, sj = dz > 0 ? 1 : -1, tdx = dx ? Math.abs(C / dx) : Infinity, tdz = dz ? Math.abs(C / dz) : Infinity;
  let tx = dx ? ((dx > 0 ? (i + 1) * C : i * C) - ax) / dx : Infinity, tz = dz ? ((dz > 0 ? (j + 1) * C : j * C) - az) / dz : Infinity;
  for (let guard = 0; guard < 100000; guard++){
    const L = idx.get(i * 1048576 + j);
    if (L) for (const o of L){ if (o.st === st) continue; o.st = st; if (!obsCounts(o, air)) continue;
      if (obsDist(o, ax, az, bx, bz) < clr){ const cx = o.t === 2 ? (o.ax + o.bx) / 2 : o.x, cz = o.t === 2 ? (o.az + o.bz) / 2 : o.z, u = (dx * (cx - ax) + dz * (cz - az)) / (dx * dx + dz * dz || 1); if (u < bt){ bt = u; best = o; } } }
    if (best && Math.min(tx, tz) > bt + 0.05) break;
    if ((i === i1 && j === j1) || Math.min(tx, tz) > 1) break;
    if (tx < tz){ i += si; tx += tdx; } else { j += sj; tz += tdz; }
  }
  return best;
}
const obsClear = (a, b, clr) => !obsSegHit(a, b, clr);
// a leg the boat can sail: no land, nothing too near
const obsLegOk = (a, b) => legClear(a, b) && obsClear(a, b);
// the ways round the thing o that a-b hits: lists of points (km), shortest first
function obsWays(o, a, b){
  const clr = obsClr(), ax = a.x * 1000, az = a.y * 1000, bx = b.x * 1000, bz = b.y * 1000, out = [], km = (x, z) => ({x:x / 1000, y:z / 1000});
  if (o.B){
    // under the bridge: in the middle of a gap between its piers where the deck is high enough, from a point off it on each side
    const B = o.B, air = obsAir(), need = clr + 4, D = Math.max(45, (BOAT.len || 8) * 1.5 + 20), gaps = [];
    let s0 = null; const cut = [];
    for (const d of B.deck){ if (d.under >= air){ if (s0 === null) s0 = d.s0; } else if (s0 !== null){ cut.push([s0, d.s0]); s0 = null; } }
    if (s0 !== null) cut.push([s0, B.tot]);
    for (const [c0, c1] of cut){ let p = c0; const ps = B.piers.filter(q => q.s > c0 && q.s < c1).map(q => q.s).sort((x, y) => x - y);
      for (const s of ps.concat([c1])){ const e0 = p + (p === c0 ? need : 1.5 + need), e1 = s - (s === c1 ? need : 1.5 + need); if (e1 > e0) gaps.push((e0 + e1) / 2); p = s; } }
    for (const s of gaps){
      const d = B.deck.find(q => s >= q.s0 && s <= q.s1); if (!d) continue;
      const u = (s - d.s0) / Math.max(0.01, d.s1 - d.s0), mx = d.ax + (d.bx - d.ax) * u, mz = d.az + (d.bz - d.az) * u, nx = -d.uz, nz = d.ux, sd = (ax - mx) * nx + (az - mz) * nz >= 0 ? 1 : -1;
      out.push([km(mx + nx * D * sd, mz + nz * D * sd), km(mx - nx * D * sd, mz - nz * D * sd)]);
    }
  } else if (o.t === 0){
    // round a mark or a pile: on either side of the leg, off it by its size and the margin
    const dx = bx - ax, dz = bz - az, L = Math.hypot(dx, dz) || 1, nx = -dz / L, nz = dx / L, R = o.r + clr + 8;
    for (const sd of [1, -1]) out.push([km(o.x + nx * R * sd, o.z + nz * R * sd)]);
  } else {
    // round a box: by its corners, a little out
    const e = clr + 8, K = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([p, q]) => [o.x + o.ux * p * (o.l + e) - o.uz * q * (o.w + e), o.z + o.uz * p * (o.l + e) + o.ux * q * (o.w + e)]);
    for (let i = 0; i < 4; i++){ out.push([km(K[i][0], K[i][1])]); out.push([km(K[i][0], K[i][1]), km(K[(i + 1) % 4][0], K[(i + 1) % 4][1])]); out.push([km(K[(i + 1) % 4][0], K[(i + 1) % 4][1]), km(K[i][0], K[i][1])]); }
  }
  const len = w => { let s = dist(a, w[0]); for (let i = 1; i < w.length; i++) s += dist(w[i - 1], w[i]); return s + dist(w[w.length - 1], b); };
  return out.filter(w => w.every(p => !isLand(p))).sort((x, y) => len(x) - len(y)).slice(0, 6);
}
// the points to put between a and b so every leg keeps clear of land and of the things (depth: how many things in a row it goes
// round); [] when a-b is clear already, null when no way was found
function obsDetour(a, b, depth = 3){
  if (!legClear(a, b)) return null;
  const o = obsSegHit(a, b); if (!o) return [];
  if (depth <= 0) return null;
  for (const w of obsWays(o, a, b)){
    let ok = true; for (let i = 1; i < w.length && ok; i++) ok = obsLegOk(w[i - 1], w[i]); if (!ok) continue;
    const left = obsDetour(a, w[0], depth - 1); if (!left) continue;
    const right = obsDetour(w[w.length - 1], b, depth - 1); if (!right) continue;
    return left.concat(w, right);
  }
  return null;
}
// a route's waypoints (after a) with the detours put in; a leg with no way round is left as it was
function obsRoute(a, wps){
  const out = []; let p = a;
  for (const q of wps){ const d = obsClear(p, q) ? [] : obsDetour(p, q); if (d) for (const x of d) out.push(Object.assign({}, x, {obs:true})); out.push(q); p = q; }
  return out;
}
// the coast's packs along a way (km points), and the tiles decoded: a route is checked against what is there, so the packs come
// first (at most ms milliseconds; a build without them, the artifact's, has Senja's embedded things only)
async function obsLoad(pts, ms = 4000){
  if (!MAPD.man || !pts.length) return;
  const T = MAPD.man.tile, want = new Set();
  for (let i = 0; i < pts.length; i++){ const p = pts[i], q = pts[Math.min(pts.length - 1, i + 1)], n = Math.max(1, Math.ceil(dist(p, q) / (T / 2)));
    for (let u = 0; u <= n; u++){ const x = p.x + (q.x - p.x) * u / n, y = p.y + (q.y - p.y) * u / n; want.add(Math.floor(x / T) + ':' + Math.floor(y / T)); } }
  const tiles = [...want].map(k => k.split(':').map(Number)).filter(([tx, ty]) => vecHas(tx, ty)); if (!tiles.length) return;
  for (const [tx, ty] of tiles) vecWant(tx * T, ty * T, (tx + 1) * T - 0.001, (ty + 1) * T - 0.001);
  const t0 = performance.now();
  while (performance.now() - t0 < ms){
    if (tiles.every(([tx, ty]) => vecTile(tx, ty))) return;
    await new Promise(r => setTimeout(r, 60));
  }
}
// while a boat sails: the leg she is on checked against the things there now (the packs near her come as she does), once per
// waypoint and change of the packs; a way round goes in before the next waypoint. Any route, drawn or found.
function obsSail(pl, b){
  if (pl.idx >= pl.wps.length) return;
  const key = () => pl.idx + '|' + pl.wps.length + '|' + VEC.ver + '|' + (S.naust && S.naust.o ? S.naust.o.join(',') : '') + '|' + (BOAT.len || 0);
  if (pl.obsK === key()) return; pl.obsK = key();
  const w = pl.wps[pl.idx], ctx = HIND.ctx; HIND.ctx = {free:[[b.pos.x * 1000, b.pos.y * 1000]].concat(w.port ? [[w.x * 1000, w.y * 1000]] : []), freeR:40};
  try {
    if (obsClear(b.pos, w)) return;
    const d = obsDetour(b.pos, w); if (!d || !d.length) return;
    pl.wps.splice(pl.idx, 0, ...d.map(p => ({x:p.x, y:p.y, port:null, fish:0, obs:true}))); pl.obsK = key();
  } finally { HIND.ctx = ctx; }
}
