// ---------- The fairway network (step 2 of the coast-wide Autonav, 08.10.2026) ----------
// Kystverket's main and secondary fairways (hovedled og biled) as a graph in the game's frame (tools/leia/leinett.py,
// data/leinett.json: nodes in metres, ways as runs of node indices). A long way (over LNET.min km) goes onto the net and along it:
// from the start to one of the nearest nodes it can reach (a clean straight leg, else a short search, 11-route.js leiaFind), the
// shortest way through the net (Dijkstra), and from a node near the end to the end. The ways follow the real fairways, and the
// search for a long route takes a few small windows instead of one huge one (a long crossing found no way before). Every leg is
// then checked and mended as the boat sails it (leiaMend), like the grid's; when the net gives no safe way, the grid search is
// tried as before.
const LNET = (() => {
  const D = /*@include(data/leinett.json)*/null;
  if (!D) return null;
  const n = D.n, X = new Float64Array(n), Y = new Float64Array(n), adj = Array.from({length:n}, () => []), grid = new Map();
  for (let i = 0; i < n; i++){ X[i] = D.nodes[2 * i] / 1000; Y[i] = D.nodes[2 * i + 1] / 1000; const k = Math.floor(X[i] / 5) * 65536 + Math.floor(Y[i] / 5); let g = grid.get(k); if (!g) grid.set(k, g = []); g.push(i); }
  // a baked net (tools/leia/bake.py): every leg already checked against the map, soft[w][k] 1 where it keeps only the boat's own
  // minimum (those cost three times their length, so the strict ones are taken first)
  const baked = !!D.baked;
  const soft = new Set();
  D.ways.forEach((w, wi) => { for (let k = 1; k < w.length; k++){ const a = w[k - 1], b = w[k], sf = baked && D.soft && D.soft[wi][k - 1], L = Math.hypot(X[a] - X[b], Y[a] - Y[b]) * (sf ? 3 : 1); adj[a].push(b, L); adj[b].push(a, L); if (sf){ soft.add(a * n + b); soft.add(b * n + a); } } });
  // ahead, aheadN: nodes up to `ahead` km away in the direction of the other end (within 50°), the nearest aheadN of them, tried as well
  // when a clean straight leg reaches them (12.10.2026: the nearest nodes all lay on the harbour's own side way, so the route went
  // out to its junction and back: Risøyhamn, Honningsvåg)
  return {n, X, Y, adj, grid, soft, src:D.src, baked, bakedSd:D.sd || 0, bakedDraft:D.draft || 0, min:10, near:12, tries:8, fine:6, ahead:25, aheadN:4, exitKm:40, exitTry:30};
})();
const lnetPt = i => ({x:LNET.X[i], y:LNET.Y[i]});
// the nodes within km of p, nearest first (at most max)
function lnetNear(p, km, max){
  const out = [], r = Math.ceil(km / 5), gx = Math.floor(p.x / 5), gy = Math.floor(p.y / 5);
  for (let dx = -r; dx <= r; dx++) for (let dy = -r; dy <= r; dy++){ const g = LNET.grid.get((gx + dx) * 65536 + gy + dy); if (g) for (const i of g){ const d = Math.hypot(LNET.X[i] - p.x, LNET.Y[i] - p.y); if (d <= km) out.push([i, d]); } }
  return out.sort((a, b) => a[1] - b[1]).slice(0, max);
}
// the nodes up to km away from p that lie within 50° of the way to q, nearest first (at most max), not among `skip`
function lnetAhead(p, q, km, max, skip){
  const ang = Math.atan2(q.y - p.y, q.x - p.x), out = [];
  for (const [i, d] of lnetNear(p, km, 400)){ if (d < 0.5 || skip.has(i)) continue; let da = Math.abs(Math.atan2(LNET.Y[i] - p.y, LNET.X[i] - p.x) - ang); if (da > Math.PI) da = 2 * Math.PI - da; if (da < Math.PI * 50 / 180) out.push([i, d]); }
  return out.slice(0, max);
}
// the shortest way through the net from any of srcs to any of dsts ([[node, cost to it]]): the nodes in order and the total, or null
function lnetPath(srcs, dsts){
  const n = LNET.n, D = new Float64Array(n).fill(Infinity), F = new Int32Array(n).fill(-1), done = new Uint8Array(n), H = leiaHeap(), end = new Map(dsts);
  for (const [i, c] of srcs) if (c < D[i]){ D[i] = c; H.push(i, c); }
  let best = null, bc = Infinity;
  while (H.size()){
    const u = H.pop(); if (done[u]) continue; done[u] = 1;
    if (D[u] >= bc) break;
    if (end.has(u)){ const c = D[u] + end.get(u); if (c < bc){ bc = c; best = u; } }
    const a = LNET.adj[u]; for (let k = 0; k < a.length; k += 2){ const v = a[k], nd = D[u] + a[k + 1]; if (nd < D[v]){ D[v] = nd; F[v] = u; H.push(v, nd); } }
  }
  if (best == null) return null;
  const out = []; for (let v = best; v !== -1; v = F[v]) out.push(v);
  return {nodes:out.reverse(), cost:bc};
}
// the sim and chart packs under a run of points (the legs are checked on them)
async function lnetLoad(P){
  const need = new Set(), jobs = [];
  // (along each leg in pieces of 5 km, not its whole box: a 1 000 km leg over open sea loaded every pack on the coast it lies across,
  // H1b R6 05.11.2026)
  for (let i = 1; i < P.length; i++){ const A = P[i - 1], B = P[i], m = Math.max(1, Math.ceil(dist(A, B) / 5));
    for (let u = 0; u < m; u++){ const a = {x:A.x + (B.x - A.x) * u / m, y:A.y + (B.y - A.y) * u / m}, b = {x:A.x + (B.x - A.x) * (u + 1) / m, y:A.y + (B.y - A.y) * (u + 1) / m}, x0 = Math.min(a.x, b.x) - 0.5, y0 = Math.min(a.y, b.y) - 0.5, x1 = Math.max(a.x, b.x) + 0.5, y1 = Math.max(a.y, b.y) + 0.5;
      for (const pk of mapPacksIn('sim', x0, y0, x1, y1)) if (!need.has(pk)){ need.add(pk); jobs.push(mapLoad(pk)); }
      for (const pk of mapPacksIn('chart', x0, y0, x1, y1)) if (!need.has(pk)){ need.add(pk); jobs.push(coastEnsure(pk)); } } }
  await Promise.all(jobs);
}
// from p to node i: a clean straight leg, else a short search, else the fine lane ([points from p to the node], length) or null
async function lnetAccess(p, i, sd, st, straight){
  const q = lnetPt(i); await lnetLoad([p, q]);
  if (!(await leiaLegFail(p, q))) return {pts:[p, q], L:dist(p, q)};
  if (straight) return null;   // (a node ahead: only by a clean straight leg)
  const r = await leiaFind1(p, q, sd, st, 2);
  let pts = r && !r.why && r.length ? [p].concat(r, [q]) : null;
  // a harbour among islets, its 100 m cells shut: the fine lane on the 25 m mask right up to the node (LNET.fine km at most)
  let lane = false;
  if (!pts){ const L0 = leiaLane(p, c => dist(c, q) < 0.04, LNET.fine); if (L0 && L0.length > 1){ pts = L0.concat([q]); lane = true; st.fineAccess = (st.fineAccess || 0) + 1; } }
  if (!pts) return null;
  let L = 0; for (let k = 1; k < pts.length; k++) L += dist(pts[k - 1], pts[k]);
  return {pts, L, lane};
}
// the way from `from` to `to` by the net: the points from from to to, or with a baked net {pre, net, post} (the way onto it, its
// nodes, the way off it), or null (too short a way, no net near, or no way through it)
// The way off the net to an end far out at sea (H1b R6, 05.11.2026: Tromsø to Svalbard, Båtsfjord to the Pechora Sea; the net is the
// mainland's, and the grid's coarse cells by a harbour among the islands are all shut): the net's distances from the nodes the near end
// reaches (Dijkstra over the whole net, lnetDists), and the node where the way along the net and then straight out to the far end is
// shortest, of those whose straight leg out is clean (leiaLegOk: its pieces near the shore checked fine, the open sea by its samples,
// 11-route.js legRuns). The best LNET.exitTry by that sum are tried, nearest first. {node, post:[node, end]} or null.
function lnetDists(srcs){
  const n = LNET.n, D = new Float64Array(n).fill(Infinity), F = new Int32Array(n).fill(-1), done = new Uint8Array(n), H = leiaHeap();
  for (const [i, c] of srcs) if (c < D[i]){ D[i] = c; H.push(i, c); }
  while (H.size()){ const u = H.pop(); if (done[u]) continue; done[u] = 1; const a = LNET.adj[u]; for (let k = 0; k < a.length; k += 2){ const v = a[k], nd = D[u] + a[k + 1]; if (nd < D[v]){ D[v] = nd; F[v] = u; H.push(v, nd); } } }
  return {D, F};
}
async function lnetExit(A, end, sd, st){
  const {D, F} = lnetDists([...A].map(([i, r]) => [i, r.L])), cand = [];
  for (let i = 0; i < LNET.n; i++) if (isFinite(D[i])) cand.push([i, D[i] + Math.hypot(LNET.X[i] - end.x, LNET.Y[i] - end.y)]);
  cand.sort((a, b) => a[1] - b[1]);
  let tries = 0;
  for (const [i] of cand){ if (++tries > LNET.exitTry) break; const q = lnetPt(i);
    // (land every 200 m first: most nodes in the fjords fail there at once)
    await lnetLoad([q, end]); let ok = false; try { const n = Math.ceil(dist(q, end) / 0.2); let land = false; for (let k = 1; k < n && !land; k++) land = isLand({x:q.x + (end.x - q.x) * k / n, y:q.y + (end.y - q.y) * k / n}); ok = !land && !leiaIceLeg(q, end) && leiaLegOk(q, end, sd, 0); } catch (e){}
    if (ok){ const nodes = []; for (let v = i; v !== -1; v = F[v]) nodes.push(v); nodes.reverse(); st.exit = {tries, km:+D[i].toFixed(1)}; return {nodes, cost:D[i], post:[q, end]}; } }
  // none clean all the way (the far end lies behind land: a fjord on Svalbard): of the same nodes, the best whose leg is clean for at
  // least a third of the way out of the coast, and from there the grid's search to the end (leiaFind: coarse, then the corridor only
  // where the coarse steps are not clean)
  tries = 0;
  for (const [i] of cand){ if (++tries > LNET.exitTry) break; const q = lnetPt(i), L = dist(q, end);
    let f = null; try { f = await leiaLegFail(q, end); } catch (e){ continue; } if (f && dist(q, f) < Math.min(60, L / 3)) continue;
    const cells = await leiaFind(q, end, sd, st); if (!cells || cells.why) continue;
    const nodes = []; for (let v = i; v !== -1; v = F[v]) nodes.push(v); nodes.reverse(); st.exit = {tries, km:+D[i].toFixed(1), grid:true}; return {nodes, cost:D[i], post:[q].concat(cells, [end])}; }
  st.exit = {tries, none:true}; return null;
}
async function lnetRoute(from, to, sd, st){
  if (!LNET || dist(from, to) < LNET.min) return null;
  const a = lnetNear(from, LNET.near, LNET.tries), b = lnetNear(to, LNET.near, LNET.tries);
  // one end far from the net and the way long (H1b R6): along the net from the other end and straight out (lnetExit)
  if ((!a.length || !b.length) && (a.length || b.length) && dist(from, to) >= LNET.exitKm){
    const fwd = a.length > 0, near = fwd ? from : to, far = fwd ? to : from, A = new Map();
    for (const [i] of fwd ? a : b){ const r = await lnetAccess(near, i, sd, st); if (r) A.set(i, r); }
    for (const [i] of lnetAhead(near, far, LNET.ahead, LNET.aheadN, A)){ const r = await lnetAccess(near, i, sd, st, true); if (r){ A.set(i, r); st.ahead = (st.ahead || 0) + 1; } }
    if (!A.size) return null;
    const ex = await lnetExit(A, far, sd, st); if (!ex) return null;
    const pre = A.get(ex.nodes[0]).pts, net = ex.nodes.map(lnetPt);
    st.net = {nodes:ex.nodes.length, km:+ex.cost.toFixed(1), baked:LNET.baked, exit:true};
    let sf = 0; for (let k = 1; k < ex.nodes.length; k++) if (LNET.soft.has(ex.nodes[k - 1] * LNET.n + ex.nodes[k])) sf++;
    const lane = !!A.get(ex.nodes[0]).lane, rev = P => P.slice().reverse();
    if (LNET.baked && BOAT.draft + LEIA.minOver <= LNET.bakedDraft + 1e-6 && sd <= LNET.bakedSd + 1e-6)
      return fwd ? {pre, net, post:ex.post, soft:sf, preLane:lane, postLane:false} : {pre:rev(ex.post), net:rev(net), post:rev(pre), soft:sf, preLane:false, postLane:lane};
    const pts = pre.slice(0, -1).concat(net, ex.post.slice(1)); await lnetLoad(pts); return fwd ? pts : rev(pts);
  }
  if (!a.length || !b.length) return null;
  const A = new Map(), B = new Map();
  for (const [i] of a){ const r = await lnetAccess(from, i, sd, st); if (r) A.set(i, r); }
  for (const [i] of b){ const r = await lnetAccess(to, i, sd, st); if (r) B.set(i, r); }
  // and the nodes ahead, in the direction of the other end, by a clean straight leg
  for (const [i] of lnetAhead(from, to, LNET.ahead, LNET.aheadN, A)){ const r = await lnetAccess(from, i, sd, st, true); if (r){ A.set(i, r); st.ahead = (st.ahead || 0) + 1; } }
  for (const [i] of lnetAhead(to, from, LNET.ahead, LNET.aheadN, B)){ const r = await lnetAccess(to, i, sd, st, true); if (r){ B.set(i, r); st.ahead = (st.ahead || 0) + 1; } }
  if (!A.size || !B.size) return null;
  const path = lnetPath([...A].map(([i, r]) => [i, r.L]), [...B].map(([i, r]) => [i, r.L])); if (!path) return null;
  const s = path.nodes[0], e = path.nodes[path.nodes.length - 1];
  const pre = A.get(s).pts, net = path.nodes.map(lnetPt), post = B.get(e).pts.slice().reverse();
  st.net = {nodes:path.nodes.length, km:+path.cost.toFixed(1), baked:LNET.baked};
  // a baked net's legs are taken as they are: only the ways onto and off it want the map under them
  // (only for a boat the bake's checks hold for: no deeper than its draught and safe depth; a deeper one has the legs checked here)
  // (its soft legs counted as the grid's search counts them, st.soft: on a way short enough the grid's own way is then compared)
  if (LNET.baked && BOAT.draft + LEIA.minOver <= LNET.bakedDraft + 1e-6 && sd <= LNET.bakedSd + 1e-6){ let sf = 0; for (let k = 1; k < path.nodes.length; k++) if (LNET.soft.has(path.nodes[k - 1] * LNET.n + path.nodes[k])) sf++; return {pre, net, post, soft:sf, preLane:!!A.get(s).lane, postLane:!!B.get(e).lane}; }
  const pts = pre.slice(0, -1).concat(net, post.slice(1));
  await lnetLoad(pts);
  return pts;
}
