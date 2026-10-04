// ---------- Autonav (once «Følg leia»): a route along the fairway ----------
// A* over a grid of cells round the way (phase K9 of the coast plan: anywhere on the coast). A cell with any land in it is closed.
// A step costs its length, more within 200 m of the shore, and much more over water shallower than the safe depth + 1 m or within
// 50 m of a rock (harbours are dredged and buoyed, so none of that counts there). The way it finds keeps a seaman's distance from
// land, and is a little longer than a good hand-drawn route that follows the shore. A harbour is left and entered by its approach
// path (07-harbours.js).
// The grid is a window round the start and the end (LEIA.pad km, or LEIA.padK of the distance, whichever is more): 100 m cells
// where it reaches the tiles' detail (the 100 m distance to the shore, sim packs), else 200 m on the national core; when the window
// would have more than LEIA.maxCells cells, a coarse search first (cells a multiple of 200 m, open where clear of land round the
// middle), and then the search in a corridor LEIA.corr coarse cells either side of its way (100 m cells where the tiles' detail is in
// and the corridor's box is not too big, else 200 m), so narrow sounds stay open.
// The cell path is then straightened wherever a straight leg keeps its distance from land, clear of rocks and in deep enough water,
// to at most 12 waypoints, more on a long way (maxWp; the distance is relaxed step by step where the water is narrow). It runs in
// slices of about 8 ms so the screen does not stall, and works with the depth model until the real depths are loaded.
const LEIA = {shore:0.2, shoreK:2, shallowK:8, dryK:30, rockR:0.05, margins:[0.15, 0.1, 0.06, 0.03, 0], maxWp:12, slice:8, pad:5, padK:0.35, maxCells:600000, corr:3};
const LEIA_ST = {gen:0};
// the most waypoints for a way of km kilometres (cells): 12 up to 40 km, then one more every 8 km, at most 40
// a target, not a cap: the straightening stops at the first margin that meets it, else keeps the fewest points it found
const leiaMaxWp = km => km <= 80 ? LEIA.maxWp : Math.min(40, Math.round(LEIA.maxWp + (km - 80) / 2.5));
// a grid: cells of c km, numbered from the frame's origin from (ix0, iy0), nx by ny; mask (optional) the cells it may use
function leiaGrid(x0, y0, x1, y1, c, mask){
  const ix0 = Math.max(0, Math.floor(x0 / c)), iy0 = Math.max(0, Math.floor(y0 / c)), nx = Math.min(Math.floor(MAPB.x1 / c), Math.ceil(x1 / c)) - ix0, ny = Math.min(Math.floor(MAPB.y1 / c), Math.ceil(y1 / c)) - iy0, N = nx * ny;
  return {c, ix0, iy0, nx, ny, cost:new Float32Array(N).fill(-1), rock:null, mask:mask || null, fine:c < 0.15};
}
const leiaCell = (G, v) => ({x:(G.ix0 + v % G.nx + 0.5) * G.c, y:(G.iy0 + Math.floor(v / G.nx) + 0.5) * G.c});
const leiaIdx = (G, p) => { const i = Math.floor(p.x / G.c) - G.ix0, j = Math.floor(p.y / G.c) - G.iy0; return i >= 0 && j >= 0 && i < G.nx && j < G.ny ? j * G.nx + i : -1; };
// the rocks within 50 m of a cell (the 100 m grid only: the coarser ones keep off the shore anyway)
function leiaRocks(G){
  if (G.rock) return G.rock; const g = G.rock = new Uint8Array(G.nx * G.ny), R = LEIA.rockR; if (!G.fine) return g;
  for (const q of SEAMARKS.rocks){ if (inHarbour({x:q[0], y:q[1]})) continue;
    for (let r = Math.max(0, Math.floor((q[1] - R) / G.c) - G.iy0); r <= Math.min(G.ny - 1, Math.floor((q[1] + R) / G.c) - G.iy0); r++)
      for (let c = Math.max(0, Math.floor((q[0] - R) / G.c) - G.ix0); c <= Math.min(G.nx - 1, Math.floor((q[0] + R) / G.c) - G.ix0); c++) g[r * G.nx + c] = 1; }
  return g;
}
// km from the cell's middle to the shore, 0 or less where the cell is closed: the tiles' 100 m cells (0 with any land in them) on
// the fine grid in their detail, else the core's 200 m cells; a coarse cell must be clear of land a third of its size round its middle
function leiaShore(G, p){
  if (G.fine && mapSimAt(p)) return rcell(MAPD.L.dc, Math.floor(p.x / 0.1), Math.floor(p.y / 0.1));
  const d = rcell(MAPD.L.dc200, Math.floor(p.x / 0.2), Math.floor(p.y / 0.2)) * 0.1;
  return G.c > 0.25 ? d - G.c * 0.35 : d;
}
// what it costs to sail through a cell, per km (Infinity: closed); worked out once per cell
function leiaCost(G, v, sd){
  let k = G.cost[v]; if (k >= 0) return k;
  if (G.mask && !G.mask[v]) k = Infinity;
  else {
    const p = leiaCell(G, v), d = leiaShore(G, p);
    if (!(d > 0)) k = Infinity;
    else {
      const hb = inHarbour(p); k = 1;
      if (d < LEIA.shore) k += LEIA.shoreK * (LEIA.shore - d) / LEIA.shore;
      if (!hb){ if (leiaRocks(G)[v]) k += LEIA.dryK; const z = depthF(p); if (z < sd) k += LEIA.dryK; else if (z < sd + 1) k += LEIA.shallowK; }
    }
  }
  G.cost[v] = k; return k;
}
// the open cell nearest a point, within 1 km, that can be reached from the point in a straight line
function leiaNearCell(G, p, sd){
  const c0 = Math.floor(p.x / G.c) - G.ix0, r0 = Math.floor(p.y / G.c) - G.iy0, R = Math.max(2, Math.ceil(1 / G.c)); let best = -1, bd = 1e9;
  for (let r = Math.max(0, r0 - R); r <= Math.min(G.ny - 1, r0 + R); r++) for (let c = Math.max(0, c0 - R); c <= Math.min(G.nx - 1, c0 + R); c++){
    const v = r * G.nx + c; if (!isFinite(leiaCost(G, v, sd))) continue; const q = leiaCell(G, v), d = dist(p, q); if (d < bd && (G.c > 0.25 || clearLine(p, q))){ bd = d; best = v; } }
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
// a slice ends: the longest so far and where it was (search, pull, drop) go to st
function leiaSlice(st, t0, at){ const dt = performance.now() - t0; if (dt > st.maxSlice){ st.maxSlice = dt; st.at = at; } st.slices++; }
// A* between two open cells of a grid; returns the cells in order, or null. st collects how the slices went. The clock is read every
// 8 expansions: a new cell works out its cost (depth, harbour, rocks) the first time, and 256 of them could take 20 ms
async function leiaSearch(G, s, t, sd, st){
  const nx = G.nx, ny = G.ny, N = nx * ny, c = G.c;
  const Gv = new Float64Array(N), FROM = new Int32Array(N), SEEN = new Uint8Array(N), SHUT = new Uint8Array(N);
  const tx = t % nx, ty = Math.floor(t / nx), h = v => Math.hypot(v % nx - tx, Math.floor(v / nx) - ty) * c;
  const H = leiaHeap(); Gv[s] = 0; FROM[s] = -1; SEEN[s] = 1; H.push(s, h(s));
  leiaRocks(G);   // the rock grid is made before the slices are timed
  let t0 = performance.now(), n = 0;
  const NB = [[1, 0, c], [-1, 0, c], [0, 1, c], [0, -1, c], [1, 1, c * Math.SQRT2], [1, -1, c * Math.SQRT2], [-1, 1, c * Math.SQRT2], [-1, -1, c * Math.SQRT2]];
  while (H.size()){
    const u = H.pop(); if (SHUT[u]) continue; SHUT[u] = 1;
    if (u === t){ const out = []; for (let v = t; v !== -1; v = FROM[v]) out.push(v); st.expanded += n; return out.reverse(); }
    const ux = u % nx, uy = Math.floor(u / nx);
    for (const [dx, dy, len] of NB){
      const x = ux + dx, y = uy + dy; if (x < 0 || y < 0 || x >= nx || y >= ny) continue;
      const v = y * nx + x; if (SHUT[v]) continue;
      const k = leiaCost(G, v, sd); if (!isFinite(k)) continue;
      if (dx && dy && (!isFinite(leiaCost(G, uy * nx + x, sd)) || !isFinite(leiaCost(G, y * nx + ux, sd)))) continue;   // no cutting a corner of land
      const ng = Gv[u] + len * k;
      if (!SEEN[v] || ng < Gv[v]){ SEEN[v] = 1; Gv[v] = ng; FROM[v] = u; H.push(v, ng + h(v)); }
    }
    if ((++n & 7) === 0 && performance.now() - t0 > LEIA.slice){ leiaSlice(st, t0, 'search'); await leiaYield(); t0 = performance.now(); }
  }
  st.expanded += n; return null;
}
// the way between two points at sea as points: the window round them, coarse first when it is too big; null when there is none, or
// {why} when an end is too tight in. The tiles' detail under the window is loaded first (the legs are checked on it).
// the window grows when the way does not fit in it (round a headland or out of a deep fjord)
async function leiaFind(from, to, sd, st){
  const pad = Math.max(LEIA.pad, dist(from, to) * LEIA.padK);
  for (const f of [1, 2.5, 6]){ const r = await leiaFind1(from, to, sd, st, pad * f); if (r) return r; }
  return null;
}
async function leiaFind1(from, to, sd, st, pad){
  const x0 = Math.max(MAPB.x0, Math.min(from.x, to.x) - pad), y0 = Math.max(MAPB.y0, Math.min(from.y, to.y) - pad), x1 = Math.min(MAPB.x1, Math.max(from.x, to.x) + pad), y1 = Math.min(MAPB.y1, Math.max(from.y, to.y) + pad);
  await Promise.all(mapPacksIn('sim', x0, y0, x1, y1).map(mapLoad).concat(mapPacksIn('chart', x0, y0, x1, y1).map(coastEnsure)));
  const area = (x1 - x0) * (y1 - y0), sim = mapPacksIn('sim', x0, y0, x1, y1).length > 0;
  let c = sim && area / 0.01 <= LEIA.maxCells ? 0.1 : 0.2, mask = null, wx = [x0, y0, x1, y1];
  if (area / (c * c) > LEIA.maxCells || (sim && c > 0.1)){
    // coarse first, then the 200 m grid in a corridor round its way
    const cc = Math.ceil(Math.sqrt(area / LEIA.maxCells) / 0.2) * 0.2, CG = leiaGrid(x0, y0, x1, y1, cc), s = leiaNearCell(CG, from, sd), t = leiaNearCell(CG, to, sd);
    if (s < 0 || t < 0) return {why:true};
    const way = await leiaSearch(CG, s, t, sd, st); if (!way) return null;
    const pts = way.map(v => leiaCell(CG, v)).concat([from, to]), R = LEIA.corr * cc + 1;
    wx = [Math.min(...pts.map(q => q.x)) - R, Math.min(...pts.map(q => q.y)) - R, Math.max(...pts.map(q => q.x)) + R, Math.max(...pts.map(q => q.y)) + R];
    // the corridor at 100 m where the tiles' detail is in (else a 200 m grid misses the narrow sounds' land), if the box is not too big
    c = sim && (wx[2] - wx[0]) * (wx[3] - wx[1]) / 0.01 <= 2 * LEIA.maxCells ? 0.1 : 0.2;
    const F0 = leiaGrid(wx[0], wx[1], wx[2], wx[3], c); mask = new Uint8Array(F0.nx * F0.ny); const rc = Math.ceil(R / c);
    // along each step of the coarse way, not only at its cells, so the corridor has no gaps
    const pp = [pts[pts.length - 2]].concat(pts.slice(0, -2), [pts[pts.length - 1]]);
    for (let n = 1; n < pp.length; n++){ const a = pp[n - 1], q2 = pp[n], m = Math.max(1, Math.ceil(dist(a, q2) / (c * rc)));
      for (let u = 0; u <= m; u++){ const q = {x:a.x + (q2.x - a.x) * u / m, y:a.y + (q2.y - a.y) * u / m}, i0 = Math.floor(q.x / c) - F0.ix0, j0 = Math.floor(q.y / c) - F0.iy0;
        for (let j = Math.max(0, j0 - rc); j <= Math.min(F0.ny - 1, j0 + rc); j++) for (let i = Math.max(0, i0 - rc); i <= Math.min(F0.nx - 1, i0 + rc); i++) mask[j * F0.nx + i] = 1; } }
  }
  const G = leiaGrid(wx[0], wx[1], wx[2], wx[3], c, mask), s = leiaNearCell(G, from, sd), t = leiaNearCell(G, to, sd);
  if (s < 0 || t < 0) return {why:true};
  const cells = await leiaSearch(G, s, t, sd, st); st.cell = c;
  return cells ? cells.map(v => leiaCell(G, v)) : null;
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
  return !coastSegHit(p, q) && legHazardMemo(p, q, sd).rocks === 0;
}
// string-pulling: from each kept point, the furthest point along the path that a straight leg reaches (galloping, then halving)
async function leiaStraighten(P, sd, margin, st){
  const out = [P[0]]; let i = 0, t0 = performance.now();
  // the clock is read after every leg checked: one point's galloping can check many long legs
  const tick = async () => { if (performance.now() - t0 > LEIA.slice){ leiaSlice(st, t0, 'pull'); await leiaYield(); t0 = performance.now(); } };
  while (i < P.length - 1){
    let ok = i + 1, step = 1;
    while (ok + step < P.length && leiaLegOk(P[i], P[ok + step], sd, margin)){ ok += step; step *= 2; await tick(); }
    let lo = ok, hi = Math.min(P.length - 1, ok + step);
    while (hi - lo > 1){ const m = (lo + hi) >> 1; if (leiaLegOk(P[i], P[m], sd, margin)) lo = m; else hi = m; await tick(); }
    out.push(P[lo]); i = lo;
    await tick();
  }
  // then drop any point the legs either side of it can do without (the clock is read per point: a pass can take longer than a slice)
  for (let again = true; again;){ again = false;
    for (let k = 1; k < out.length - 1; k++){
      if (leiaLegOk(out[k - 1], out[k + 1], sd, margin)){ out.splice(k, 1); again = true; }
      if (performance.now() - t0 > LEIA.slice){ leiaSlice(st, t0, 'drop'); await leiaYield(); t0 = performance.now(); } } }
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
  if (dist(from, to) < 30 && clearLine(from, to) && leiaLegOk(from, to, sd, LEIA.margins[0])) mid = [from, to];
  else {
    const cells = await leiaFind(from, to, sd, st);
    if (cells && cells.why) return {why:['Fant ingen leia dit. Punktet ligger for trangt til.', 'Found no fairway there. The point is too tight in.'], st};
    if (!cells) return {why:['Fant ingen leia dit.', 'Found no fairway there.'], st};
    mid = [from].concat(cells, [to]);
  }
  const all = [a].concat(laneOut, mid.slice(laneOut.length ? 1 : 0, laneIn.length ? -1 : undefined), laneIn, [b]);
  // drop repeats (the lane's end is also the search's start)
  const P = all.filter((q, i) => i === 0 || dist(q, all[i - 1]) > 0.001);
  let best = null, km = 0; for (let i = 1; i < P.length; i++) km += dist(P[i - 1], P[i]); const maxWp = st.maxWp = leiaMaxWp(km);
  for (const m of LEIA.margins){ const s2 = await leiaStraighten(P, sd, m, st); if (!best || s2.length < best.length) best = s2; if (s2.length - 1 <= maxWp) break; }
  const wps = best.slice(1), nm = wps.reduce((acc, q, i) => acc + dist(i ? wps[i - 1] : a, q), 0) / NM;
  st.ms = performance.now() - T0;
  return {wps, nm, st};
}
