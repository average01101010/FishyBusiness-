// ---------- «Følg leia»: a route along the fairway ----------
// A* over the 100 m grid of distance to the shore (DC): a cell with any land in it is closed. A step costs its length, more within
// 200 m of the shore, and much more over water shallower than the safe depth + 1 m or within 50 m of a rock (harbours are dredged
// and buoyed, so none of that counts there). The way it finds keeps a seaman's distance from land, and is a little longer than a
// good hand-drawn route that follows the shore. A harbour is left and entered by its approach path (07-harbours.js).
// The cell path is then straightened wherever a straight leg keeps its distance from land, clear of rocks and in deep enough water,
// to at most 12 waypoints (the distance is relaxed step by step where the water is narrow). It runs in slices of about 8 ms so the
// screen does not stall, and works with the depth model until the real depths are loaded.
const LEIA = {shore:0.2, shoreK:2, shallowK:8, dryK:30, rockR:0.05, margins:[0.15, 0.1, 0.06, 0.03, 0], maxWp:12, slice:8};
const LEIA_ST = {g:null, from:null, seen:null, shut:null, gen:0, cost:null, costKey:'', rock:null};
function leiaRocks(){
  if (LEIA_ST.rock) return LEIA_ST.rock;
  const nx = DC.nx, ny = DC.ny, g = new Uint8Array(nx * ny), R = LEIA.rockR;
  for (const q of SEAMARKS.rocks){ if (inHarbour({x:q[0], y:q[1]})) continue;
    for (let r = Math.max(0, Math.floor((q[1] - FR.oy - R) / 0.1)); r <= Math.min(ny - 1, Math.floor((q[1] - FR.oy + R) / 0.1)); r++)
      for (let c = Math.max(0, Math.floor((q[0] - FR.ox - R) / 0.1)); c <= Math.min(nx - 1, Math.floor((q[0] - FR.ox + R) / 0.1)); c++) g[r * nx + c] = 1; }
  return LEIA_ST.rock = g;
}
const leiaCell = v => ({x:(v % DC.nx + 0.5) * 0.1 + FR.ox, y:(Math.floor(v / DC.nx) + 0.5) * 0.1 + FR.oy});
// what it costs to sail through a cell, per km (Infinity: closed); worked out once per cell and safe depth
function leiaCost(v, sd){
  const key = sd + '|' + (DEPTH ? 1 : 0) + '|' + LEIA.shoreK;
  if (LEIA_ST.costKey !== key || !LEIA_ST.cost){ LEIA_ST.cost = new Float32Array(DC.nx * DC.ny).fill(-1); LEIA_ST.costKey = key; }
  let k = LEIA_ST.cost[v]; if (k >= 0) return k;
  const d = dcCell(v);
  if (!(d > 0)) k = Infinity;
  else {
    const p = leiaCell(v), hb = inHarbour(p);
    k = 1;
    if (d < LEIA.shore) k += LEIA.shoreK * (LEIA.shore - d) / LEIA.shore;
    if (!hb){ if (leiaRocks()[v]) k += LEIA.dryK; const z = depthF(p); if (z < sd) k += LEIA.dryK; else if (z < sd + 1) k += LEIA.shallowK; }
  }
  LEIA_ST.cost[v] = k; return k;
}
// the open cell nearest a point, within 1 km, that can be reached from the point in a straight line
function leiaNearCell(p, sd){
  const nx = DC.nx, ny = DC.ny, c0 = Math.floor((p.x - FR.ox) / 0.1), r0 = Math.floor((p.y - FR.oy) / 0.1); let best = -1, bd = 1e9;
  for (let r = Math.max(0, r0 - 10); r <= Math.min(ny - 1, r0 + 10); r++) for (let c = Math.max(0, c0 - 10); c <= Math.min(nx - 1, c0 + 10); c++){
    const v = r * nx + c; if (!isFinite(leiaCost(v, sd))) continue; const q = leiaCell(v), d = dist(p, q); if (d < bd && clearLine(p, q)){ bd = d; best = v; } }
  return best;
}
// a binary heap of cells by their estimated total cost
function leiaHeap(){
  const k = [], f = [];
  return {size:() => k.length,
    push(v, fv){ k.push(v); f.push(fv); let i = k.length - 1; while (i > 0){ const pi = (i - 1) >> 1; if (f[pi] <= f[i]) break; [k[pi], k[i]] = [k[i], k[pi]]; [f[pi], f[i]] = [f[i], f[pi]]; i = pi; } },
    pop(){ const top = k[0], lk = k.pop(), lf = f.pop(); if (k.length){ k[0] = lk; f[0] = lf; let i = 0; for (;;){ const l = 2 * i + 1, r = l + 1; let m = i; if (l < k.length && f[l] < f[m]) m = l; if (r < k.length && f[r] < f[m]) m = r; if (m === i) break; [k[m], k[i]] = [k[i], k[m]]; [f[m], f[i]] = [f[i], f[m]]; i = m; } } return top; }};
}
const leiaYield = () => new Promise(r => setTimeout(r, 0));
// A* between two open cells; returns the cells in order, or null. st collects how the slices went.
async function leiaSearch(s, t, sd, st){
  const nx = DC.nx, ny = DC.ny, N = nx * ny;
  if (!LEIA_ST.g){ LEIA_ST.g = new Float64Array(N); LEIA_ST.from = new Int32Array(N); LEIA_ST.seen = new Uint32Array(N); LEIA_ST.shut = new Uint32Array(N); }
  const G = LEIA_ST.g, FROM = LEIA_ST.from, SEEN = LEIA_ST.seen, SHUT = LEIA_ST.shut, gen = ++LEIA_ST.gen;
  const tx = t % nx, ty = Math.floor(t / nx), h = v => Math.hypot(v % nx - tx, Math.floor(v / nx) - ty) * 0.1;
  const H = leiaHeap(); G[s] = 0; FROM[s] = -1; SEEN[s] = gen; H.push(s, h(s));
  let t0 = performance.now(), n = 0;
  const NB = [[1, 0, 0.1], [-1, 0, 0.1], [0, 1, 0.1], [0, -1, 0.1], [1, 1, 0.1414], [1, -1, 0.1414], [-1, 1, 0.1414], [-1, -1, 0.1414]];
  while (H.size()){
    const u = H.pop(); if (SHUT[u] === gen) continue; SHUT[u] = gen;
    if (u === t){ const out = []; for (let v = t; v !== -1; v = FROM[v]) out.push(v); st.expanded = n; return out.reverse(); }
    const ux = u % nx, uy = Math.floor(u / nx);
    for (const [dx, dy, len] of NB){
      const x = ux + dx, y = uy + dy; if (x < 0 || y < 0 || x >= nx || y >= ny) continue;
      const v = y * nx + x; if (SHUT[v] === gen) continue;
      const c = leiaCost(v, sd); if (!isFinite(c)) continue;
      if (dx && dy && (!isFinite(leiaCost(uy * nx + x, sd)) || !isFinite(leiaCost(y * nx + ux, sd)))) continue;   // no cutting a corner of land
      const ng = G[u] + len * c;
      if (SEEN[v] !== gen || ng < G[v]){ SEEN[v] = gen; G[v] = ng; FROM[v] = u; H.push(v, ng + h(v)); }
    }
    if ((++n & 255) === 0 && performance.now() - t0 > LEIA.slice){ st.maxSlice = Math.max(st.maxSlice, performance.now() - t0); st.slices++; await leiaYield(); t0 = performance.now(); }
  }
  st.expanded = n; return null;
}
// can a straight leg be sailed: no land, and away from harbours at least `margin` km from the shore, deep enough and clear of rocks
function leiaLegOk(p, q, sd, margin){
  const L = dist(p, q), n = Math.max(1, Math.ceil(L / 0.008));
  for (let i = 1; i < n; i++){
    const u = i / n, pt = {x:p.x + (q.x - p.x) * u, y:p.y + (q.y - p.y) * u}; if (isLand(pt)) return false;
    if (i % 3 || inHarbour(pt)) continue;
    if (margin > 0 && coastDist(pt) < margin && Math.min(dist(pt, p), dist(pt, q)) > margin) return false;
    if (depthF(pt) < sd + 1 && Math.min(dist(pt, p), dist(pt, q)) > 0.05) return false;
  }
  return legHazardMemo(p, q, sd).rocks === 0;
}
// string-pulling: from each kept point, the furthest point along the path that a straight leg reaches (galloping, then halving)
async function leiaStraighten(P, sd, margin, st){
  const out = [P[0]]; let i = 0, t0 = performance.now();
  while (i < P.length - 1){
    let ok = i + 1, step = 1;
    while (ok + step < P.length && leiaLegOk(P[i], P[ok + step], sd, margin)){ ok += step; step *= 2; }
    let lo = ok, hi = Math.min(P.length - 1, ok + step);
    while (hi - lo > 1){ const m = (lo + hi) >> 1; if (leiaLegOk(P[i], P[m], sd, margin)) lo = m; else hi = m; }
    out.push(P[lo]); i = lo;
    if (performance.now() - t0 > LEIA.slice){ st.maxSlice = Math.max(st.maxSlice, performance.now() - t0); st.slices++; await leiaYield(); t0 = performance.now(); }
  }
  // then drop any point the legs either side of it can do without
  for (let again = true; again;){ again = false;
    for (let k = 1; k < out.length - 1; k++) if (leiaLegOk(out[k - 1], out[k + 1], sd, margin)){ out.splice(k, 1); again = true; }
    if (performance.now() - t0 > LEIA.slice){ st.maxSlice = Math.max(st.maxSlice, performance.now() - t0); st.slices++; await leiaYield(); t0 = performance.now(); } }
  return out;
}
// the way from a (the boat, a waypoint or a harbour id's point) to b (a point at sea or a harbour): the waypoints after a, ending at b.
// {wps, nm, st} or {why:[no, en]}
// opt.tight: no keeping off the shore at all, the shortest way a hand-drawn route could take (for comparison in the tests)
async function leiaRoute(a, b, aPort, bPort, opt){
  const tight = opt && opt.tight, shoreK = LEIA.shoreK, margins = LEIA.margins; if (tight){ LEIA.shoreK = 0; LEIA.margins = [0]; }
  try { return await leiaRoute0(a, b, aPort, bPort); } finally { LEIA.shoreK = shoreK; LEIA.margins = margins; }
}
async function leiaRoute0(a, b, aPort, bPort){
  const sd = safeDepth(), st = {slices:0, maxSlice:0, expanded:0, ms:0}, T0 = performance.now();
  const A = aPort ? portById(aPort) : null, B = bPort ? portById(bPort) : null;
  // leave a harbour by its approach path, and come in by it
  const laneOut = A ? approachPath(A).slice().reverse().filter(q => dist(q, A.p) >= 0.002) : [], laneIn = B ? approachPath(B).filter(q => dist(q, B.p) >= 0.002) : [];
  const from = laneOut.length ? laneOut[laneOut.length - 1] : a, to = laneIn.length ? laneIn[0] : b;
  let mid;
  if (clearLine(from, to) && leiaLegOk(from, to, sd, LEIA.margins[0])) mid = [from, to];
  else {
    const s = leiaNearCell(from, sd), t = leiaNearCell(to, sd);
    if (s < 0 || t < 0) return {why:['Fant ingen leia dit. Punktet ligger for trangt til.', 'Found no fairway there. The point is too tight in.'], st};
    const cells = await leiaSearch(s, t, sd, st);
    if (!cells) return {why:['Fant ingen leia dit.', 'Found no fairway there.'], st};
    mid = [from].concat(cells.map(leiaCell), [to]);
  }
  const all = [a].concat(laneOut, mid.slice(laneOut.length ? 1 : 0, laneIn.length ? -1 : undefined), laneIn, [b]);
  // drop repeats (the lane's end is also the search's start)
  const P = all.filter((q, i) => i === 0 || dist(q, all[i - 1]) > 0.001);
  let best = null;
  for (const m of LEIA.margins){ const s2 = await leiaStraighten(P, sd, m, st); if (!best || s2.length < best.length) best = s2; if (s2.length - 1 <= LEIA.maxWp) break; }
  const wps = best.slice(1), nm = wps.reduce((acc, q, i) => acc + dist(i ? wps[i - 1] : a, q), 0) / NM;
  st.ms = performance.now() - T0;
  return {wps, nm, st};
}
