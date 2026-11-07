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
// minOver: water shallower than the draft plus this (m) is closed outright, not only dear (the boat would ground there; 08.10.2026)
// fineC: the 50 m grid (the 25 m mask decides what is land) tried on a short way whose 100 m grid found none, or one more than
// `detour` times the straight line plus 0.5 km, for boats up to fineLen m (12.10.2026: Havøysund to its rorbu went 7.5 nm round Havøya for 1.1 nm through the
// 175 m wide sound, which no 100 m cell is clear of land in). pullW, pullKm: how far ahead the final pull (leiaPull) looks. shoreMin:
// the least distance from the shore a leg the pull makes keeps (km), outside harbours; harbourMin: inside them, away from their points
// (leiaHarbourClr, against the fine coast). tideMargin: what is kept back of the lowest
// water over the trip before it counts as depth (leiaTideCredit)
const LEIA = {shore:0.2, shoreK:2, shallowK:8, dryK:30, minOver:0.5, rockR:0.05, margins:[0.15, 0.1, 0.06, 0.03, 0], maxWp:12, slice:8, pad:5, padK:0.35, maxCells:600000, corr:3, fineC:0.05, fineKm:25, fineLen:15, detour:1.45, pullW:64, pullKm:30, pullOpen:10, oceanC:1, shoreMin:0.1, harbourMin:0.02, tideMargin:0.3};
const LEIA_ST = {gen:0};
// The tide in the route (Jonas 12.10.2026: «ta høyde for fartøyets dypgående samt tidevann»). The charted depths (depthF) are below
// chart datum, near the lowest astronomical tide; the water stands tideCD(H, p) above it, from a little under 0 to about 3.5 m in
// Nordland and Finnmark. A route is checked against the LOWEST water of the trip: the water level over the next hours the trip can
// take (the straight line at cruising speed and a third more, 3 h on top, 36 h at most) at both ends, every quarter, less
// LEIA.tideMargin for surge and the model's error, between -0.5 and +1 m. That credit comes off the charted depth the boat needs
// (leiaLim: the draught plus LEIA.minOver), so a sound with 1.5 m on the chart is open to a 2 m boat at spring high water with hours
// to spare, and shut when the trip would meet low water; the sailing itself checks the water as it is (groundCheck, tideCD) and
// stops short of a shoal if the tide fell faster than the plan (sailReplan). 0 outside a route (the bake, the tests). The strict rule
// (the safe depth, leiaLegFail strict) stays the chart's, as the route list's warnings (legHazard) read it.
const LEIA_TIDE = {credit:0};
// the speed the tide's and the ice's windows along a route are reckoned at: 6 knots, slow on purpose, so the window is long and the water
// counted on is the lower (the safe side; it read BOAT.cruise, which no vessel has, and so was 6 always; with the boat's own cruising
// speed the window was shorter and a route under Gisundbrua went nearer the skerries, obstest, 07.11.2026)
const LEIA_KN = 6;
const leiaLim = () => BOAT.draft + LEIA.minOver - LEIA_TIDE.credit;
function leiaTideCredit(a, b){
  if (typeof tideCD !== 'function' || !S || S.t == null) return 0;
  const H0 = S.t / 60, kn = Math.min(S.draftSpeed || 99, LEIA_KN), hrs = Math.min(36, dist(a, b) * 1.3 / (kn * 1.852) + 4);
  let lo = Infinity;
  for (const p of [a, b]) for (let h = 0; h <= hrs; h += 0.25){ const z = tideCD(H0 + h, p); if (z < lo) lo = z; }
  return isFinite(lo) ? clamp(lo - LEIA.tideMargin, -0.5, 1) : 0;
}
// The sea ice in the route (H1b R5, 03h-is.js): water with SEA_ICE_LIM % ice or more is shut to a boat without an ice class, at the
// time the route is made and at the trip's end (the straight line at cruising speed and a third more, 4 h on top, 10 days at most;
// the edge moves a few km a day), and the water by the edge is a little dear (up to 2 more a km), so the way keeps off it. A boat
// that is in the ice already (it came over her at anchor or at the quay) may go through ice up to what she lies in, so she can get out;
// the sailing then lets her go only towards thinner ice (groundCheck). Set by leiaRoute; off outside a route (the bake, the tests).
const LEIA_ICE = {on:false, H0:0, H1:0, cap:0};
function leiaIceSet(a, b){
  if (typeof SEA_ICE === 'undefined' || !SEA_ICE || !S || S.t == null || BOAT.iceClass) return {on:false, H0:0, H1:0, cap:0};
  const H0 = S.t / 60, kn = Math.min(S.draftSpeed || 99, LEIA_KN), hrs = Math.min(240, dist(a, b) * 1.3 / (kn * 1.852) + 4), c = seaIceAt(a, H0);
  return {on:true, H0, H1:H0 + hrs, cap:c >= SEA_ICE_LIM ? c + 1 : 0};
}
const leiaIceC = p => LEIA_ICE.on ? Math.max(seaIceAt(p, LEIA_ICE.H0), seaIceAt(p, LEIA_ICE.H1)) : 0;
const leiaIce = p => { const c = leiaIceC(p); return c >= SEA_ICE_LIM && c > LEIA_ICE.cap; };
// the first point on a leg the ice shuts (every 250 m), or null
function leiaIceLeg(p, q){ if (!LEIA_ICE.on) return null; const n = Math.max(1, Math.ceil(dist(p, q) / 0.25)); for (let i = 1; i <= n; i++){ const pt = {x:p.x + (q.x - p.x) * i / n, y:p.y + (q.y - p.y) * i / n}; if (leiaIce(pt)) return pt; } return null; }
// The pieces of a leg that want the fine checks (H1b R6, 05.11.2026: a route of 80 km over open sea north of Finnmark took seconds, and
// 400 km and more far longer, because every check went along the whole leg every 2 to 30 m). Samples 100 m apart: one at least
// LEGOPEN.shore km from the shore by the layer isLand itself reads there (the tiles' 100 m distance in their detail, else the core's; on
// the wide frame's 1 km layer LEGOPEN.shore1k), out of harbours, and LEGOPEN.deep m deeper than z (the depth the check asks for), is
// open sea, and so is the water halfway to the next sample (no land, no shoal can lie 50 m from it). The rest, with LEGOPEN.pad km
// either side, comes back as [s0, s1] km from p, merged. A leg up to LEGOPEN.min km is one piece, so the checks near the coast are as
// before. Remembered per leg.
// (the distance layer does not know every islet: a skerry of 20 m off Sunnmøre, 62.396° N 5.830° E, read 0.5 km from the shore while
// it stood on the leg, and a route of the CI check of all plant pairs crossed it, 05.11.2026. So the stretch an open sample vouches for is
// also read with isLand every LEGOPEN.land km, which costs little (a lookup in the mask); land there makes the sample near. Only on the
// tiles' detail: off them the distance and the land are the same far layer)
const LEGOPEN = {min:1, step:0.1, shore:0.5, shore1k:1.5, deep:4, deepFar:30, far:1, pad:0.15, land:0.005}, LEGRUNS = new Map();
// land on the leg p→q (L km) between s0 and s1 km from p, by isLand every LEGOPEN.land km
function legLandIn(p, q, L, s0, s1){ for (let s = s0; s <= s1 + 1e-9; s += LEGOPEN.land){ const u = Math.min(L, s) / L; if (isLand({x:p.x + (q.x - p.x) * u, y:p.y + (q.y - p.y) * u})) return true; } return false; }
// (the step grows with the room: a sample d km from the shore, well over the depth, lets the next one be up to d less the limit away,
// at most LEGOPEN.far km, since the distance to the shore cannot fall faster than the way goes; so the open sea costs a sample a km)
// near: 0 open, else true; the next step in km for an open one
function legNearPt(pt, z){
  if (inHarbour(pt)) return 0;
  let d, lim;
  if (mapSimAt(pt)){ d = coastDist(pt); lim = LEGOPEN.shore; }
  else { const F = farL('dc', pt); if (!F) return 0; d = rbil(F, pt) * DCSTEP[F.name]; lim = F.name === 'dc1k' ? LEGOPEN.shore1k : LEGOPEN.shore; }
  if (d < lim) return 0;
  const zz = depthF(pt); if (zz < z + LEGOPEN.deep) return 0;
  return zz < z + LEGOPEN.deepFar ? LEGOPEN.step : Math.max(LEGOPEN.step, Math.min(LEGOPEN.far, d - lim));
}
// (z is raised to the safe depth + 1, the most any of the checks asks: so the checks of one leg share one set of pieces)
const legRunsKey = (p, q, z) => z.toFixed(2) + '|' + p.x.toFixed(4) + ',' + p.y.toFixed(4) + '|' + q.x.toFixed(4) + ',' + q.y.toFixed(4);
// the walk along the leg, up to ms milliseconds at a time (true when done): legRuns does it at once, legRunsAsync in slices
function legRunsWalk(W, ms){
  const {p, q, L, z, runs} = W, pad = LEGOPEN.pad, t0 = ms < Infinity ? performance.now() : 0; let n = 0;
  // a leg with no length to walk (a NaN or an endless end) is done at once: the walk below never reached W.s >= L then, and legRuns
  // (ms Infinity) held the page for good; the leg's own checks judge it (06.11.2026, the start that locked, ui/11-boot.js BOOTG)
  if (!Number.isFinite(L)) return true;
  for (;;){ let step = 0;
    if (W.s >= pad && L - W.s >= pad){ try { const pt = {x:p.x + (q.x - p.x) * W.s / L, y:p.y + (q.y - p.y) * W.s / L}; step = legNearPt(pt, z); if (step && mapSimAt(pt) && legLandIn(p, q, L, W.s, Math.min(L, W.s + step))) step = 0; } catch (e){ step = 0; } }
    if (!step){ const a = Math.max(0, W.s - pad), b = Math.min(L, W.s + pad), r = runs[runs.length - 1]; if (r && a <= r[1]) r[1] = b; else runs.push([a, b]); step = LEGOPEN.step; }
    if (W.s >= L) return true; W.s = Math.min(L, W.s + step);
    if ((++n & 63) === 0 && ms < Infinity && performance.now() - t0 > ms) return false; }
}
function legRunsW(p, q, z){ const L = dist(p, q); z = Math.max(z, safeDepth() + 1); return {p, q, L, z, s:0, runs:[], k:legRunsKey(p, q, z)}; }
const legRunsPut = W => { if (LEGRUNS.size > 2000) LEGRUNS.clear(); LEGRUNS.set(W.k, W.runs); return W.runs; };
function legRuns(p, q, z){
  const L = dist(p, q); if (L <= LEGOPEN.min) return [[0, L]];
  const W = legRunsW(p, q, z), r = LEGRUNS.get(W.k); if (r) return r;
  legRunsWalk(W, Infinity); return legRunsPut(W);
}
// the same in slices of LEIA.slice ms, so a long leg's walk does not hold the screen (the checks after it find it remembered)
async function legRunsAsync(p, q, z){
  if (dist(p, q) <= LEGOPEN.min) return; const W = legRunsW(p, q, z); if (LEGRUNS.has(W.k)) return;
  while (!legRunsWalk(W, LEIA.slice)) await leiaYield();
  legRunsPut(W);
}
// the sample indices 1..n-1 (or ..n with last) of a leg of L km in n steps that lie in its pieces (legRuns), in order
function legIdx(runs, L, n, last){ const out = []; let prev = 0; for (const [a, b] of runs){ for (let i = Math.max(prev + 1, Math.ceil(a / L * n)); i <= Math.min(last ? n : n - 1, Math.floor(b / L * n)); i++) out.push(i), prev = i; } return out; }
// the fine coast crossed by any of the leg's pieces (coastSegHit on each)
const legSegHit = (p, q, runs) => { const L = dist(p, q) || 1e-9; return runs.some(([a, b]) => coastSegHit({x:p.x + (q.x - p.x) * a / L, y:p.y + (q.y - p.y) * a / L}, {x:p.x + (q.x - p.x) * b / L, y:p.y + (q.y - p.y) * b / L})); };
const legNearKm = runs => runs.reduce((s, r) => s + r[1] - r[0], 0);
// points (km) whose cells are shut while the mend's local search runs (leiaCost): where a leg between two open cells fails
const LEIA_AVOID = [];
// the most waypoints for a way of km kilometres (cells): 12 up to 40 km, then one more every 8 km, at most 40
// a target, not a cap: the straightening stops at the first margin that meets it, else keeps the fewest points it found
const leiaMaxWp = km => km <= 80 ? LEIA.maxWp : Math.min(40, Math.round(LEIA.maxWp + (km - 80) / 2.5));
// a grid: cells of c km, numbered from the frame's origin from (ix0, iy0), nx by ny; mask (optional) the cells it may use
function leiaGrid(x0, y0, x1, y1, c, mask){
  const ix0 = Math.max(Math.floor(MAPB.x0 / c), Math.floor(x0 / c)), iy0 = Math.max(Math.floor(MAPB.y0 / c), Math.floor(y0 / c)), nx = Math.min(Math.floor(MAPB.x1 / c), Math.ceil(x1 / c)) - ix0, ny = Math.min(Math.floor(MAPB.y1 / c), Math.ceil(y1 / c)) - iy0, N = nx * ny;
  return {c, ix0, iy0, nx, ny, cost:new Float32Array(N).fill(-1), rock:null, mask:mask || null, fine:c < 0.15};
}
const leiaCell = (G, v) => ({x:(G.ix0 + v % G.nx + 0.5) * G.c, y:(G.iy0 + Math.floor(v / G.nx) + 0.5) * G.c});
const leiaIdx = (G, p) => { const i = Math.floor(p.x / G.c) - G.ix0, j = Math.floor(p.y / G.c) - G.iy0; return i >= 0 && j >= 0 && i < G.nx && j < G.ny ? j * G.nx + i : -1; };
// the rocks within 50 m of a cell (the 100 m grid only: the coarser ones keep off the shore anyway)
function leiaRocks(G){
  if (G.rock) return G.rock; const g = G.rock = new Uint8Array(G.nx * G.ny), R = LEIA.rockR; if (!G.fine) return g;
  for (const q of rocksIn(G.ix0 * G.c - R, G.iy0 * G.c - R, (G.ix0 + G.nx) * G.c + R, (G.iy0 + G.ny) * G.c + R)){ if (inHarbour({x:q[0], y:q[1]})) continue;
    for (let r = Math.max(0, Math.floor((q[1] - R) / G.c) - G.iy0); r <= Math.min(G.ny - 1, Math.floor((q[1] + R) / G.c) - G.iy0); r++)
      for (let c = Math.max(0, Math.floor((q[0] - R) / G.c) - G.ix0); c <= Math.min(G.nx - 1, Math.floor((q[0] + R) / G.c) - G.ix0); c++) g[r * G.nx + c] = 1; }
  return g;
}
// km from the cell's middle to the shore, 0 or less where the cell is closed: the tiles' 100 m cells (0 with any land in them) on
// the fine grid in their detail, else the core's 200 m cells; a coarse cell must be clear of land a third of its size round its middle
function leiaShore(G, p){
  // the 50 m grid (LEIA.fineC): a cell is open when none of its four quarters is land by the fine coast and the 25 m mask (isLand), and
  // its distance to the shore is the 100 m layer's at its middle (never 0 for an open cell: the cost counts it as near the shore)
  if (G.c < 0.075 && mapSimAt(p)){ const h = G.c / 4; try { for (const [dx, dy] of [[-h, -h], [h, -h], [-h, h], [h, h]]) if (isLand({x:p.x + dx, y:p.y + dy})) return 0; return Math.max(0.012, coastDist(p)); } catch (e){ return 0; } }
  // (a cell at a tile's seaward edge can lie in a block no pack covers: the core's word then)
  if (G.fine && mapSimAt(p)){ const L = MAPD.L.dc, ix = Math.floor(p.x / 0.1), iy = Math.floor(p.y / 0.1); if (mapBlockKnown(L, Math.floor(ix / L.n), Math.floor(iy / L.n))) return rcell(L, ix, iy); }
  const d = dcCellFar(p);
  return G.c > 0.25 ? d - G.c * 0.35 : d;
}
// what it costs to sail through a cell, per km (Infinity: closed); worked out once per cell
function leiaCost(G, v, sd){
  let k = G.cost[v]; if (k >= 0) return k;
  if (G.mask && !G.mask[v]) k = Infinity;
  else {
    const p = leiaCell(G, v), d = leiaShore(G, p);
    const ic = leiaIceC(p);
    if (!(d > 0) || (LEIA_AVOID.length && LEIA_AVOID.some(a => Math.abs(a.x - p.x) < 0.075 && Math.abs(a.y - p.y) < 0.075)) || ic >= SEA_ICE_LIM && ic > LEIA_ICE.cap) k = Infinity;
    else {
      const hb = inHarbour(p); k = 1 + 2 * Math.min(1, ic / SEA_ICE_LIM);
      if (d < LEIA.shore) k += LEIA.shoreK * (LEIA.shore - d) / LEIA.shore;
      // (a coarse cell of LEIA.oceanC km and more reads the core's sea floor, offDepth: no pack is wanted for that search, H1b R6)
      if (!hb){ if (leiaRocks(G)[v]) k += LEIA.dryK; const z = G.c >= LEIA.oceanC ? offDepth(p) : depthF(p); if (z < leiaLim()) k = Infinity; else if (z < sd) k += LEIA.dryK; else if (z < sd + 1) k += LEIA.shallowK; }
    }
  }
  G.cost[v] = k; return k;
}
// the open cell nearest a point, within km (1 by default), that can be reached from the point in a straight line (not asked for a
// coarse grid, nor with free: a junction between two pieces of a corridor, where the search itself joins up)
function leiaNearCell(G, p, sd, km = 1, free){
  const c0 = Math.floor(p.x / G.c) - G.ix0, r0 = Math.floor(p.y / G.c) - G.iy0, R = Math.max(2, Math.ceil(km / G.c)); let best = -1, bd = 1e9;
  for (let r = Math.max(0, r0 - R); r <= Math.min(G.ny - 1, r0 + R); r++) for (let c = Math.max(0, c0 - R); c <= Math.min(G.nx - 1, c0 + R); c++){
    const v = r * G.nx + c; if (!isFinite(leiaCost(G, v, sd))) continue; const q = leiaCell(G, v), d = dist(p, q); if (d < bd && (free || G.c > 0.25 || clearLine(p, q))){ bd = d; best = v; } }
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
  // (a coarse grid of 1 km cells and more, a long way over the sea: the estimate weighs 1.5, so the search heads for the goal round an
  // island instead of filling the sea behind it; the way is straightened and searched fine where it nears land anyway, H1b R6)
  const hw = c >= 1 ? 1.5 : 1, tx = t % nx, ty = Math.floor(t / nx), h = v => Math.hypot(v % nx - tx, Math.floor(v / nx) - ty) * c * hw;
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
// the length of a run of points (km)
const leiaLen = P => { let L = 0; for (let i = 1; i < P.length; i++) L += dist(P[i - 1], P[i]); return L; };
async function leiaFind(from, to, sd, st){
  const pad = Math.max(LEIA.pad, dist(from, to) * LEIA.padK), d = dist(from, to);
  let r = null; for (const f of [1, 2.5, 6]){ r = await leiaFind1(from, to, sd, st, pad * f); if (r) break; }
  // a short way (under LEIA.fineKm) the 100 m grid found no way for, or one far round (more than LEIA.detour times the straight line
  // and 0.5 km): the 50 m grid on the 25 m mask in a window round the straight line, where a sound the 100 m cells all touch land in
  // stays open (Havøysund, 12.10.2026); the shorter of the two is taken
  // (the smaller boats only, LEIA.fineLen: a 50 m cell is clear of land over 50 m, which is no sound for a 20 m boat)
  if (d < LEIA.fineKm && (BOAT.len || 8) <= LEIA.fineLen && (!r || r.why || leiaLen([from].concat(r, [to])) > LEIA.detour * d + 0.5) && mapSimAt(from) && mapSimAt(to)){
    const r2 = await leiaFind1(from, to, sd, st, Math.max(1.5, d * 0.3), LEIA.fineC);
    if (r2 && !r2.why && (!r || r.why || leiaLen([from].concat(r2, [to])) < leiaLen([from].concat(r, [to])))){ st.fine50 = (st.fine50 || 0) + 1; return r2; }
  }
  return r;
}
// c0: a cell size asked for (the 50 m grid); null when its window would be too big for it
async function leiaFind1(from, to, sd, st, pad, c0){
  const x0 = Math.max(MAPB.x0, Math.min(from.x, to.x) - pad), y0 = Math.max(MAPB.y0, Math.min(from.y, to.y) - pad), x1 = Math.min(MAPB.x1, Math.max(from.x, to.x) + pad), y1 = Math.min(MAPB.y1, Math.max(from.y, to.y) + pad);
  const area = (x1 - x0) * (y1 - y0), sim = mapPacksIn('sim', x0, y0, x1, y1).length > 0;
  let c = sim && area / 0.01 <= LEIA.maxCells ? 0.1 : 0.2, mask = null, wx = [x0, y0, x1, y1];
  // the packs under the window, but not for the coarse search (it reads the core alone; the corridor loads its own, H1b R6: a long way
  // loaded every pack within hundreds of km before)
  // (a way along the coast, coarse cells under LEIA.oceanC km, is searched as before: the window loaded and the tiles' depth read; only a
  // way over the sea, coarse cells of LEIA.oceanC km and more, reads the core alone and skips it)
  const coarse = !c0 && (area / (c * c) > LEIA.maxCells || (sim && c > 0.1)), ccOf = Math.ceil(Math.sqrt(area / LEIA.maxCells) / 0.2) * 0.2;
  if (!coarse || ccOf < LEIA.oceanC) await Promise.all(mapPacksIn('sim', x0, y0, x1, y1).map(mapLoad).concat(mapPacksIn('chart', x0, y0, x1, y1).map(coastEnsure)));
  if (c0){ if (!sim || area / (c0 * c0) > LEIA.maxCells) return null; c = c0; }
  else if (coarse){
    // coarse first, then the fine grid in a corridor round its way
    // (the coarse cells by an island harbour are all shut, open only a third of their size from land: its ends are sought 8 km out,
    // and the fine corridor joins the real ends to them)
    // (a long way, H1b R6: an end among the islands, Tromsø, can be more than 8 km from a coarse cell that is clear; then 25 km, and the
    // corridor finds the way out to it)
    const cc = Math.ceil(Math.sqrt(area / LEIA.maxCells) / 0.2) * 0.2, CG = leiaGrid(x0, y0, x1, y1, cc), near = q => { const v = leiaNearCell(CG, q, sd, 8); return v >= 0 || dist(from, to) < 100 ? v : leiaNearCell(CG, q, sd, 25); }, s = near(from), t = near(to);
    if (s < 0 || t < 0) return {why:true};
    const e0 = st.expanded, tc0 = performance.now(), way = await leiaSearch(CG, s, t, sd, st); (st.coarse = st.coarse || []).push({cc, n:CG.nx * CG.ny, exp:st.expanded - e0, ms:Math.round(performance.now() - tc0)}); if (!way) return null;
    // the corridor at 100 m where the tiles' detail is in (a 200 m grid misses the narrow sounds' land: its cells are open by their
    // middle, not land-free, and a step between two of them was never checked as a line), in pieces that fit; 200 m on the core alone
    const fc = sim ? 0.1 : 0.2; st.cell = fc;
    const pp = [from].concat(way.map(v => leiaCell(CG, v)), [to]);
    // (H1b R6) on a way over the sea (coarse cells of LEIA.oceanC km and more) a coarse step that is a clean straight leg already (most
    // are, legRuns) needs no corridor: the fine search runs only over the runs of steps that are not, one step either side, and the clean
    // steps are kept as they are; a way along the coast has the corridor all the way as before
    if (cc < LEIA.oceanC) return leiaCorridor(pp, LEIA.corr * cc + 1, fc, sd, st);
    await lnetLoad(pp);
    const okStep = []; let tq = performance.now();
    for (let i = 1; i < pp.length; i++){ let ok = false; try { ok = leiaLegOk(pp[i - 1], pp[i], sd, 0); } catch (e){} okStep.push(ok); if (performance.now() - tq > LEIA.slice){ leiaSlice(st, tq, 'steps'); await leiaYield(); tq = performance.now(); } }
    const out = [from]; let i = 0;
    while (i < pp.length - 1){
      if (okStep[i]){ out.push(pp[i + 1]); i++; continue; }
      let j = i; while (j < okStep.length && !okStep[j]) j++;
      const i0 = Math.max(0, i - 1), i1 = Math.min(pp.length - 1, j + 1), part = await leiaCorridor(pp.slice(i0, i1 + 1), LEIA.corr * cc + 1, fc, sd, st);
      if (!part || part.why) return part;
      while (out.length > 1 && i0 < i){ out.pop(); i--; }   // the step before is searched again in the corridor
      for (const q of part) if (dist(out[out.length - 1], q) > 1e-6) out.push(q);
      i = i1;
    }
    st.open = okStep.filter(Boolean).length + '/' + okStep.length;
    return out;
  }
  const G = leiaGrid(wx[0], wx[1], wx[2], wx[3], c, mask), s = leiaNearCell(G, from, sd), t = leiaNearCell(G, to, sd);
  if (s < 0 || t < 0) return {why:true};
  const cells = await leiaSearch(G, s, t, sd, st); st.cell = c;
  return cells ? cells.map(v => leiaCell(G, v)) : null;
}
// the fine search in a corridor R km either side of the coarse way pp (from, its cells, to), piece by piece: each piece is the
// longest run of the way whose box holds no more than LEIA.maxCells cells of c km (the grids are cut at the frame's origin, so
// a piece ends in the same cell the next one starts in). The points in order, null when a piece has no way, {why} when an end is
// too tight in (08.10.2026: a 200 km route in Finnmark went on 200 m cells, and a leg between two of them crossed land)
async function leiaCorridor(pp, R, c, sd, st){
  const cells = (b, q) => { const x0 = Math.min(b[0], q.x), y0 = Math.min(b[1], q.y), x1 = Math.max(b[2], q.x), y1 = Math.max(b[3], q.y); return {b:[x0, y0, x1, y1], n:(x1 - x0 + 2 * R) * (y1 - y0 + 2 * R) / (c * c)}; };
  const out = []; let i0 = 0;
  while (i0 < pp.length - 1){
    let i1 = i0 + 1, bb = cells([pp[i0].x, pp[i0].y, pp[i0].x, pp[i0].y], pp[i1]).b;
    while (i1 + 1 < pp.length){ const g = cells(bb, pp[i1 + 1]); if (g.n > LEIA.maxCells) break; bb = g.b; i1++; }
    // a piece with no way in its corridor gets a wider one, twice, before the whole gives up (the coarse way can pass a sound that
    // is shut at 100 m, with the way round outside the corridor)
    let r = null; for (let w = 1; w <= 4 && !(r && !r.why); w *= 2){ r = await leiaCorridor1(pp.slice(i0, i1 + 1), bb, R * w, c, sd, st, i0 === 0, i1 === pp.length - 1); if (r && r.why) break; }
    st.pieces = (st.pieces || 0) + 1;
    if (!r || r.why){ st.fail = {piece:st.pieces, why:!!(r && r.why)}; return r; }
    for (const q of r) if (!out.length || dist(out[out.length - 1], q) > 1e-6) out.push(q);
    i0 = i1;
  }
  return out;
}
async function leiaCorridor1(pp, bb, R, c, sd, st, first, last){
  const wx = [Math.max(MAPB.x0, bb[0] - R), Math.max(MAPB.y0, bb[1] - R), Math.min(MAPB.x1, bb[2] + R), Math.min(MAPB.y1, bb[3] + R)];
  // the packs under the corridor's box (the coarse search before it loads none, H1b R6)
  await Promise.all(mapPacksIn('sim', wx[0], wx[1], wx[2], wx[3]).map(mapLoad).concat(mapPacksIn('chart', wx[0], wx[1], wx[2], wx[3]).map(coastEnsure)));
  const F0 = leiaGrid(wx[0], wx[1], wx[2], wx[3], c), mask = new Uint8Array(F0.nx * F0.ny), rc = Math.ceil(R / c);
  // along each step of the coarse way, not only at its cells, so the corridor has no gaps
  for (let n = 1; n < pp.length; n++){ const a = pp[n - 1], q2 = pp[n], m = Math.max(1, Math.ceil(dist(a, q2) / (c * rc)));
    for (let u = 0; u <= m; u++){ const q = {x:a.x + (q2.x - a.x) * u / m, y:a.y + (q2.y - a.y) * u / m}, i0 = Math.floor(q.x / c) - F0.ix0, j0 = Math.floor(q.y / c) - F0.iy0;
      for (let j = Math.max(0, j0 - rc); j <= Math.min(F0.ny - 1, j0 + rc); j++) for (let i = Math.max(0, i0 - rc); i <= Math.min(F0.nx - 1, i0 + rc); i++) mask[j * F0.nx + i] = 1; } }
  // the ends: the route's own ends as ever; a junction between two pieces is the open cell nearest the coarse cell's middle (within
  // 2 km, no straight line asked: both pieces pick the same cell, and the searches join there)
  const G = leiaGrid(wx[0], wx[1], wx[2], wx[3], c, mask), s = first ? leiaNearCell(G, pp[0], sd) : leiaNearCell(G, pp[0], sd, 2, true), t = last ? leiaNearCell(G, pp[pp.length - 1], sd) : leiaNearCell(G, pp[pp.length - 1], sd, 2, true);
  if (s < 0 || t < 0) return (s < 0 && first) || (t < 0 && last) ? {why:true} : null;
  const cells = await leiaSearch(G, s, t, sd, st);
  return cells ? cells.map(v => leiaCell(G, v)) : null;
}
// Inside a harbour (600 m round its point, inHarbour) the shore's 100 m is not asked, but a straight leg keeps LEIA.harbourMin off the
// fine coast (coastDistM) away from the harbour points (`ports`, APPR.near + 20 m: the boat goes alongside there), as the harbour's own
// way in does (approachPath, 04.11.2026: at Tufjord the boat sailed on the foreshore in 3D); true where no coast is indexed
function leiaHarbourClr(pt, ports){
  if (!inHarbour(pt)) return true;
  for (const h of ports) if (dist(pt, h.p) < APPR.near + 0.02) return true;
  const d = coastDistM(pt, LEIA.harbourMin * 1000); return d < 0 || d >= LEIA.harbourMin * 1000;
}
// the harbours whose point lies within 100 m of the leg p–q
function leiaPortsBy(p, q){ const dx = q.x - p.x, dy = q.y - p.y, L2 = dx * dx + dy * dy || 1e-9; return PORTS.filter(h => { const u = clamp(((h.p.x - p.x) * dx + (h.p.y - p.y) * dy) / L2, 0, 1); return Math.hypot(p.x + dx * u - h.p.x, p.y + dy * u - h.p.y) < 0.1; }); }
// can a straight leg be sailed: no land, and away from harbours at least `margin` km from the shore, deep enough and clear of rocks
// (a generator that pauses every 512 samples, so the straightening can let the screen draw on a long leg near the shore; leiaLegOk runs it
// through at once, leiaLegOkL with the caller's tick)
function leiaLegOk(p, q, sd, margin){ const g = leiaLegOkG(p, q, sd, margin); let r; while (!(r = g.next()).done); return r.value; }
function* leiaLegOkG(p, q, sd, margin){
  // (land every 2 m like leiaLegFail, the rest every 24 m: a sliver of land between samples 8 m apart passed here and failed in the mend,
  // CI check of all plant pairs 08.10.2026)
  const L = dist(p, q), n = Math.max(1, Math.ceil(L / 0.002));
  // the depth is checked up to the ends too, unless an end itself lies in shallow water (a set's buoy, the naust's berth): there the
  // boat goes anyway, and the 50 m round it are hers (before 08.10.2026 the 50 m by every end went unchecked)
  if (leiaIceLeg(p, q)) return false;
  const sp = inHarbour(p) || depthF(p) < sd + 1, sq = inHarbour(q) || depthF(q) < sd + 1; let hp = null;
  // (only the leg's pieces near the shore or over shallow water, legRuns: the open sea between them is clear by its samples)
  const runs = legRuns(p, q, sd + 1); let k = 0;
  for (const i of legIdx(runs, L, n)){
    if ((++k & 511) === 0) yield;
    const u = i / n, pt = {x:p.x + (q.x - p.x) * u, y:p.y + (q.y - p.y) * u}; if (isLand(pt)) return false;
    // inside a harbour: LEIA.harbourMin off the fine coast every 6 m, away from the harbour points and the leg's own ends, at every
    // margin (the straightening keeps the way with the fewest points, the one at margin 0 too); not for opt.tight (LEIA.shoreK 0). The
    // straightening falls back on the points it has, so no way is lost (04.11.2026, Engenes: a leg out of the harbour ran 1 m from the beach)
    if (LEIA.shoreK > 0 && i % 3 === 0 && L * Math.min(u, 1 - u) >= 0.03 && inHarbour(pt) && !leiaHarbourClr(pt, hp || (hp = leiaPortsBy(p, q)))) return false;
    if (i % 12 || inHarbour(pt)) continue;
    if (margin > 0 && coastDist(pt) < margin && Math.min(dist(pt, p), dist(pt, q)) > margin) return false;
    if (depthF(pt) < sd + 1 && !((sp && dist(pt, p) <= 0.05) || (sq && dist(pt, q) <= 0.05))) return false;
  }
  return !legSegHit(p, q, runs) && legHazardMemo(p, q, sd).rocks === 0 && obsClear(p, q);   // and no bridge pier, pier or mark (11b-obstacles.js)
}
// the same, with the packs under the leg loaded when one is missing (H1b R6: the coarse search loads no window, so a straightened leg can
// cross a tile off the way's own packs)
const packMiss = e => /not loaded/.test(e && e.message || '');
async function leiaLegOkL(p, q, sd, margin, tick){
  try { await legRunsAsync(p, q, sd + 1); } catch (e){}
  const go = async () => { const g = leiaLegOkG(p, q, sd, margin); let r; while (!(r = g.next()).done) if (tick) await tick(); return r.value; };
  try { return await go(); } catch (e){ if (!packMiss(e)) throw e; await lnetLoad([p, q]); return go(); } }
// A leg as the boat will sail it (01-world.js groundCheck, without its chance on a rock): outside harbours no land (every 4 m: the
// fine coast has islets thinner than the 25 m mask) and nothing shallower than the draft plus LEIA.minOver, no breakwater and no
// rock within 12 m. The hard rule under leiaLegOk's comfort. The first point where it fails, or null; the clock is read on the way
// (a long leg has thousands of samples)
async function leiaLegFail(p, q, tick, endP, endQ, strict){
  // (land every 2 m: islets thinner than 4 m slipped between the samples, 08.10.2026; the depth every 4 m)
  // strict: the safe depth and 25 m from rocks, as the route list's warnings (legHazard), not only the draught's minimum
  const L = dist(p, q), n = Math.max(1, Math.ceil(L / 0.002)), lim = strict ? Math.max(safeDepth(), leiaLim()) : leiaLim();   // (the strict rule is the chart's, as the route list's warnings: no tide)
  // land anywhere, a harbour's quay too, except the 20 m by the route's own end when it lies in a harbour (a boat at her berth has
  // the quay's land cells beside her; endP, endQ); the depth only outside harbours, which are dredged
  const hp = endP && inHarbour(p) ? 0.02 : 0, hq = endQ && inHarbour(q) ? 0.02 : 0, ice = leiaIceLeg(p, q); if (ice) return ice;
  if (tick) await legRunsAsync(p, q, lim);
  const runs = legRuns(p, q, lim); let k = 0;
  for (const i of legIdx(runs, L, n, true)){ const pt = i === n ? q : {x:p.x + (q.x - p.x) * i / n, y:p.y + (q.y - p.y) * i / n}, s = L * i / n;
    if (isLand(pt) ? !(s < hp || L - s < hq || quayLand(pt)) : ((i & 1) === 0 && !inHarbour(pt) && depthF(pt) < lim)) return pt; if ((++k & 63) === 0 && tick) await tick(); }
  if (inHarbour(q)) return null;
  // a breakwater: the first 100 m of the leg that crosses it; a rock: the rock itself
  if (legSegHit(p, q, runs)){ const m = Math.max(1, Math.ceil(L / 0.1)); for (let i = 0; i < m; i++){ const a = {x:p.x + (q.x - p.x) * i / m, y:p.y + (q.y - p.y) * i / m}, b = {x:p.x + (q.x - p.x) * (i + 1) / m, y:p.y + (q.y - p.y) * (i + 1) / m}; if (coastSegHit(a, b)) return {x:(a.x + b.x) / 2, y:(a.y + b.y) / 2}; } return {x:(p.x + q.x) / 2, y:(p.y + q.y) / 2}; }
  const rk = rockOnLeg(p, q, strict ? 0.025 : 0.012); return rk ? {x:rk[0], y:rk[1]} : null;
}
// the first rock within r km of the leg (01-world.js rocksIn), or null
function rockOnLeg(a, b, r){
  const x0 = Math.min(a.x, b.x) - r, x1 = Math.max(a.x, b.x) + r, y0 = Math.min(a.y, b.y) - r, y1 = Math.max(a.y, b.y) + r, dx = b.x - a.x, dy = b.y - a.y, L2 = dx * dx + dy * dy || 1e-9;
  for (const q of rocksAlong(a, b, r)){ if (q[0] < x0 || q[0] > x1 || q[1] < y0 || q[1] > y1) continue; const u = clamp(((q[0] - a.x) * dx + (q[1] - a.y) * dy) / L2, 0, 1); if (Math.hypot(a.x + dx * u - q[0], a.y + dy * u - q[1]) < r) return q; }
  return null;
}
// Every leg of the way once more, as the boat will sail it: a step between two cells was never checked as a line (land between two
// 200 m cells, a skerry or a shoal between two 100 m ones), and the straightening kept such steps. A leg that fails goes round by a
// point to the side of where it fails (40–500 m off), else by a fine search between its ends; none found, no way (never one the
// boat grounds on, 08.10.2026). The points, or null.
async function leiaMend(P, sd, st, strict){
  const out = [P[0]]; let t0 = performance.now();
  const tick = async () => { if (performance.now() - t0 > LEIA.slice){ leiaSlice(st, t0, 'mend'); await leiaYield(); t0 = performance.now(); } };
  // (eA, eB: the leg's ends are the route's own start or end)
  const fail = async (a, b, eA, eB) => { try { return await leiaLegFail(a, b, tick, eA, eB, strict); } catch (e){ if (!packMiss(e)) throw e; await lnetLoad([a, b]); return leiaLegFail(a, b, tick, eA, eB, strict); } }, safe = async (a, b, eA, eB) => !(await fail(a, b, eA, eB));
  // the way in: the boat's own minimum depth outside harbours and no breakwater or rock, land inside the harbour skipped
  const safeIn = async (a, b) => { const L = dist(a, b), n = Math.max(1, Math.ceil(L / 0.004)), lim = leiaLim();
    for (let i = 1; i <= n; i++){ const pt = {x:a.x + (b.x - a.x) * i / n, y:a.y + (b.y - a.y) * i / n}; if (inHarbour(pt)) continue; if (isLand(pt) || depthF(pt) < lim) return false; if ((i & 63) === 0) await tick(); }
    return !coastSegHit(a, b) && !rockOnLeg(a, b, 0.012); };
  for (let i = 1; i < P.length; i++){
    const p = out[out.length - 1], q = P[i], first = out.length === 1, last = i === P.length - 1, f = await fail(p, q, first, last);
    if (!f){ out.push(q); continue; }
    // the harbour's own way in, between two of its points: kept as it is when the boat's own minimum holds on it (see leiaRoute0)
    if (st.trust){ const tp = st.trust.get(p.x.toFixed(4) + ',' + p.y.toFixed(4)), tq = st.trust.get(q.x.toFixed(4) + ',' + q.y.toFixed(4));
      if (tp && tp === tq && dist(p, q) < 3 && await safeIn(p, q)){ out.push(q); if (strict) st.soft = (st.soft || 0) + 1; st.trusted = (st.trusted || 0) + 1; continue; } }
    // a cell's middle by the shore (a 100 m cell can hold a sliver of land): the point is dropped when the leg to the next one is clean
    if (!last && !(await fail(p, P[i + 1], first, i + 1 === P.length - 1))){ st.dropped = (st.dropped || 0) + 1; continue; }
    // (what failed, for the tests and the console: land, the depth there, a rock or a breakwater)
    (st.mends = st.mends || []).push({x:+f.x.toFixed(3), y:+f.y.toFixed(3), land:isLand(f), z:+depthF(f).toFixed(1), rock:!!rockOnLeg(p, q, 0.012), wall:coastSegHit(p, q), km:+dist(p, q).toFixed(2)});
    let fix = null; const L = dist(p, q) || 1e-9, nx = -(q.y - p.y) / L, ny = (q.x - p.x) / L;
    for (const off of [0.04, -0.04, 0.08, -0.08, 0.12, -0.12, 0.2, -0.2, 0.3, -0.3, 0.5, -0.5]){ const v = {x:f.x + nx * off, y:f.y + ny * off};
      if (!isLand(v) && await safe(p, v, first, false) && await safe(v, q, false, last) && obsClear(p, v) && obsClear(v, q)){ fix = [v]; break; } }
    // a fine search between the ends with the failing spot's cells shut (two open cells can have a shoal, a rock or an islet between
    // them), again with the next failing spot shut too, in a wider window when the near one has no way
    if (!fix){ LEIA_AVOID.length = 0; let bad = f;
      for (let tries = 0; tries < 4 && !fix && bad; tries++){ LEIA_AVOID.push(bad); bad = null; let r = null;
        for (const pad of [1.5, 4]){ r = await leiaFind1(p, q, sd, st, pad); if (r && !r.why && r.length) break; }
        if (!r || r.why || !r.length) break;
        const s2 = await leiaStraighten([p].concat(r, [q]), sd, 0, st), mid = s2.slice(1, -1);
        for (let k = 0; k <= mid.length && !bad; k++) bad = await fail(k ? mid[k - 1] : p, k < mid.length ? mid[k] : q, first && k === 0, last && k === mid.length);
        if (!bad) fix = mid; }
      LEIA_AVOID.length = 0; }
    // strict and nothing round it: the leg stays when it keeps the boat's own minimum (st.soft counts them)
    if (!fix && strict && !(await leiaLegFail(p, q, tick, first, last))){ out.push(q); st.soft = (st.soft || 0) + 1; continue; }
    // nothing round it: a point on the way is dropped and the next leg takes it from here; the end itself has no way
    if (!fix){ if (!last){ st.dropped = (st.dropped || 0) + 1; continue; } st.mendFail = {p, q, f}; return null; }
    out.push(...fix, q); st.mended = (st.mended || 0) + 1; st.mendPts = (st.mendPts || 0) + fix.length;
  }
  return out;
}
// string-pulling: from each kept point, the furthest point along the path that a straight leg reaches (galloping, then halving)
async function leiaStraighten(P, sd, margin, st){
  const out = [P[0]]; let i = 0, t0 = performance.now();
  // the clock is read after every leg checked: one point's galloping can check many long legs
  const tick = async () => { if (performance.now() - t0 > LEIA.slice){ leiaSlice(st, t0, 'pull'); await leiaYield(); t0 = performance.now(); } };
  while (i < P.length - 1){
    let ok = i + 1, step = 1;
    while (ok + step < P.length && await leiaLegOkL(P[i], P[ok + step], sd, margin, tick)){ ok += step; step *= 2; await tick(); }
    let lo = ok, hi = Math.min(P.length - 1, ok + step);
    while (hi - lo > 1){ const m = (lo + hi) >> 1; if (await leiaLegOkL(P[i], P[m], sd, margin, tick)) lo = m; else hi = m; await tick(); }
    out.push(P[lo]); i = lo;
    await tick();
  }
  // then drop any point the legs either side of it can do without (the clock is read per point: a pass can take longer than a slice)
  const dtick = async () => { if (performance.now() - t0 > LEIA.slice){ leiaSlice(st, t0, 'drop'); await leiaYield(); t0 = performance.now(); } };
  for (let again = true; again;){ again = false;
    for (let k = 1; k < out.length - 1; k++){
      if (await leiaLegOkL(out[k - 1], out[k + 1], sd, margin, dtick)){ out.splice(k, 1); again = true; }
      if (performance.now() - t0 > LEIA.slice){ leiaSlice(st, t0, 'drop'); await leiaYield(); t0 = performance.now(); } } }
  return out;
}
// The whole way once more, pulled tight like a string (12.10.2026, Jonas: the routes took odd turns that made the way much longer):
// from each kept point, the farthest point ahead (within LEIA.pullW points and LEIA.pullKm km) a straight leg reaches under the
// sailing rule (leiaLegFail strict: the safe depth less the tide's credit, 25 m from rocks, land every 2 m, the harbour's own land by
// the route's ends skipped), at least LEIA.shoreMin from the shore outside harbours, and clear of the things in the water
// (11b-obstacles.js). The net's legs are pulled too (before, they were taken as they were, so a way onto the net by a harbour's
// node went into the harbour and out again: Honningsvåg, Kamøyvær, Myre), and the lanes' strings of 20 m legs. A leg that holds
// only the boat's own minimum (soft) stays as it is: no new leg is less safe than the one it replaces. Galloping, then halving, as
// leiaStraighten; a leg is first tried at 200 m and 8 m for land, so most of the far ones cost little.
async function leiaPull(P, sd, st){
  if (P.length < 3) return P;
  const out = [P[0]]; let i = 0, t0 = performance.now(), checks = 0, full = 0; const T0 = t0;
  const tick = async () => { if (performance.now() - t0 > LEIA.slice){ leiaSlice(st, t0, 'pull2'); await leiaYield(); t0 = performance.now(); } };
  const landAt = (a, b, step) => { const n = Math.max(1, Math.ceil(dist(a, b) / step)); if (step > 0.1 && leiaIceLeg(a, b)) return true; for (let k = 1; k < n; k++) if (isLand({x:a.x + (b.x - a.x) * k / n, y:a.y + (b.y - a.y) * k / n})) return true; return false; };
  // (inside a harbour the shore's 100 m is not asked, but a pulled leg keeps LEIA.harbourMin off the fine coast away from the harbour
  // points and the route's ends (leiaHarbourClr, 04.11.2026); where the way in itself runs nearer, its own points stay)
  const ends = [P[0], P[P.length - 1]].map(p => ({p}));
  const shoreOk = (a, b) => { const L = dist(a, b), n = Math.max(1, Math.ceil(L / 0.024)); for (const k of legIdx(legRuns(a, b, lim), L, n)){ const u = k / n, pt = {x:a.x + (b.x - a.x) * u, y:a.y + (b.y - a.y) * u}; if (L * Math.min(u, 1 - u) < 0.06 || inHarbour(pt)) continue; if (coastDist(pt) < LEIA.shoreMin) return false; }
    const m = Math.ceil(L / 0.006); let hp = null; for (let k = 1; k < m; k++){ const u = k / m, pt = {x:a.x + (b.x - a.x) * u, y:a.y + (b.y - a.y) * u}; if (L * Math.min(u, 1 - u) >= 0.03 && inHarbour(pt) && !leiaHarbourClr(pt, hp || (hp = ends.concat(leiaPortsBy(a, b))))) return false; }
    return true; };
  // (a long leg skips the 8 m quick look: the full check below looks only at its pieces near the shore, legRuns)
  const lim = Math.max(safeDepth(), leiaLim());
  const ok = async (a, b, eA, eB, again) => { checks++; try { await legRunsAsync(a, b, lim); if (landAt(a, b, 0.2) || (dist(a, b) <= LEGOPEN.min && landAt(a, b, 0.008)) || !shoreOk(a, b) || !obsClear(a, b)) return false; full++; return !(await leiaLegFail(a, b, tick, eA, eB, true)); } catch (e){ if (again || !packMiss(e)) return false; await lnetLoad([a, b]); return ok(a, b, eA, eB, true); } };
  const last = P.length - 1;
  // how far ahead a leg may reach: LEIA.pullKm, or any length over the open sea: its middle LEIA.pullOpen km or more from the shore and
  // no more than LEIA.pullKm of it near the shore (legRuns). A way along the coast keeps to the leads (Bergen to Florø inside the skerries)
  const reach = (a, b) => { if (dist(a, b) <= LEIA.pullKm) return true; let m = 0; try { m = coastDistFar({x:(a.x + b.x) / 2, y:(a.y + b.y) / 2}); } catch (e){} return m >= LEIA.pullOpen && legNearKm(legRuns(a, b, lim)) <= LEIA.pullKm; };
  while (i < last){
    const wn = Math.min(last, i + LEIA.pullW); let hi = i + 1, step = 1;
    while (hi + step <= wn && reach(P[i], P[hi + step]) && await ok(P[i], P[hi + step], i === 0, hi + step === last)){ hi += step; step *= 2; }
    let lo = hi, up = Math.min(wn, hi + step);
    while (up - lo > 1){ const m = (lo + up) >> 1; if (reach(P[i], P[m]) && await ok(P[i], P[m], i === 0, m === last)) lo = m; else up = m; }
    out.push(P[lo]); i = lo; await tick();
  }
  st.pull = {from:P.length, to:out.length, checks, full, ms:Math.round(performance.now() - T0)};
  return out;
}
// the way from a (the boat, a waypoint or a harbour id's point) to b (a point at sea or a harbour): the waypoints after a, ending at b.
// {wps, nm, st} or {why:[no, en]}
// opt.tight: no keeping off the shore at all, the shortest way a hand-drawn route could take (for comparison in the tests)
// the routes being worked out (two can be under way at once: the comparison in the chart plotter, the sailing's way round beside the
// player's, a return in a gale); `base` is what the things in the water and the tide's credit were before the first of them began
const LEIA_RUN = [];
async function leiaRoute(a, b, aPort, bPort, opt){
  const tight = opt && opt.tight, shoreK = LEIA.shoreK, margins = LEIA.margins; if (tight){ LEIA.shoreK = 0; LEIA.margins = [0]; }
  if (!LEIA_RUN.length) LEIA_RUN.base = {ctx:HIND.ctx, credit:LEIA_TIDE.credit, ice:Object.assign({}, LEIA_ICE)};
  // the things in the water (11b-obstacles.js) count everywhere but by the route's ends: a boat lying by a pier, a route to the naust
  // the lowest water of the trip counts as depth (leiaTideCredit); not when the chart and the tide are not to be trusted (opt.noTide)
  // (both are from the same boat at the same time, so the credits of two routes under way at once are all but the same. When one ends,
  // the newest one still under way has its own back, and when the last ends, what was there before the first: before 04.11.2026 each
  // put back what it found, so two that overlapped and ended in the order they began left the first one's credit behind for good, and
  // the chart plotter's moving of a tap off a shoal and the lanes went on counting it outside any route; autonavtest 9a. The ice goes
  // the same way)
  const credit = opt && opt.noTide ? 0 : leiaTideCredit(a, b), run = {ctx:{free:[a, b].map(p => [p.x * 1000, p.y * 1000]), freeR:40}, credit, ice:leiaIceSet(a, b)};
  LEIA_RUN.push(run); HIND.ctx = run.ctx; LEIA_TIDE.credit = credit; Object.assign(LEIA_ICE, run.ice);
  const back = () => { if (tight){ LEIA.shoreK = shoreK; LEIA.margins = margins; }
    LEIA_RUN.splice(LEIA_RUN.indexOf(run), 1); const top = LEIA_RUN.length ? LEIA_RUN[LEIA_RUN.length - 1] : LEIA_RUN.base; HIND.ctx = top.ctx; LEIA_TIDE.credit = top.credit; Object.assign(LEIA_ICE, top.ice); };
  // the end itself in the ice: said so, not searched for
  if (!bPort && leiaIce(b)){ back();
    return {why:['Målet ligger i drivisen (' + Math.round(seaIceAt(b) / 10) + '/10). Båten har ikke isklasse.', 'The goal lies in the drift ice (' + Math.round(seaIceAt(b) / 10) + '/10). The boat has no ice class.']}; }
  try { const r = await leiaRoute0(a, b, aPort, bPort, false, opt); if (r && r.st){ r.st.tide = +credit.toFixed(2); if (LEIA_ICE.on) r.st.ice = {cap:Math.round(LEIA_ICE.cap)}; } return r; } finally { back(); }
}
// Step 1 of the coast-wide Autonav (08.10.2026): the way from a point by the shore, in a narrow basin or among islets, out to
// water where the 100 m search can take over (or to where goal(q) says, within km), found on the 25 m mask (the fine coast decides what is land): breadth-first through
// water cells deep enough for the boat, no cutting a land corner, to the first cell whose 100 m cell is clear of land and at least
// 150 m from the shore, within LANE.km. The points from p outwards (straightened where the line is clean), or null.
const LANE = {km:2.5, max:250000, clear:0.15};
function leiaLane(p, goal, km){
  const M = MAPD.L.mask, c = M.c, nx = M.nx, ny = M.ny, lim = leiaLim();
  const cell = k => { const x = k % nx; return {x:(M.ix0 + x + 0.5) * c, y:(M.iy0 + (k - x) / nx + 0.5) * c}; };
  const X0 = Math.floor(p.x / c) - M.ix0, Y0 = Math.floor(p.y / c) - M.iy0; if (X0 < 0 || Y0 < 0 || X0 >= nx || Y0 >= ny) return null;
  const W = new Map(), wet = (x, y) => { const k = y * nx + x; let v = W.get(k); if (v === undefined){ const q = cell(k); try { v = !isLand(q) && !leiaIce(q) && (inHarbour(q) || depthF(q) >= lim && !rockOnLeg(q, q, 0.0135)); } catch (e){ v = false; } W.set(k, v); } return v; };
  const open = q => { try { if (!mapSimAt(q)) return coastDistFar(q) >= LANE.clear; const L = MAPD.L.dc; return rcell(L, Math.floor(q.x / 0.1), Math.floor(q.y / 0.1)) > 0 && coastDist(q) >= LANE.clear; } catch (e){ return false; } };
  const s0 = Y0 * nx + X0, prev = new Map([[s0, -1]]), Q = [s0]; let end = -1;
  for (let h = 0; h < Q.length && h < LANE.max; h++){
    const k = Q[h], x = k % nx, y = (k - x) / nx, q = cell(k);
    if (h && (goal ? goal(q) : open(q))){ end = k; break; }
    if (dist(q, p) > (km || LANE.km)) continue;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]){
      const X = x + dx, Y = y + dy, kk = Y * nx + X; if (X < 0 || Y < 0 || X >= nx || Y >= ny || prev.has(kk) || !wet(X, Y)) continue;
      if (dx && dy && (!wet(X, y) || !wet(x, Y))) continue;
      if (coastSegHit(q, cell(kk))) continue;   // a breakwater thinner than a cell between them (as approachPath)
      prev.set(kk, k); Q.push(kk);
    }
  }
  if (end < 0) return null;
  const pts = []; for (let k = end; k !== -1; k = prev.get(k)) pts.push(cell(k)); pts.reverse(); pts[0] = {x:p.x, y:p.y};
  // straightened: from each kept point the furthest one a clean straight line reaches (land at 4 m, the depth, no rock)
  const clean = (a, b) => { const n = Math.max(1, Math.ceil(dist(a, b) / 0.004)); for (let i = 1; i <= n; i++){ const q = {x:a.x + (b.x - a.x) * i / n, y:a.y + (b.y - a.y) * i / n}; if (isLand(q) || (!inHarbour(q) && depthF(q) < lim)) return false; } return !coastSegHit(a, b) && !rockOnLeg(a, b, 0.012); };
  const out = [pts[0]]; let i = 0;
  while (i < pts.length - 1){ let j = pts.length - 1; while (j > i + 1 && !clean(pts[i], pts[j])) j--; out.push(pts[j]); i = j; }
  return out;
}
// A pocket (CI check of all plant pairs, 08.10.2026: Fredvang, Sleneset and others): an end whose open 100 m cells make up a small
// closed piece (a basin among islets, all its ways out narrower than the 100 m cells see) cannot be searched from, though the fine
// mask has the way out. Its cells as a Set of keys when the piece is under LPOCK.cap cells and stays inside the window, else null.
const LPOCK = {cap:5000, win:8};
const pockKey = (x, y) => Math.floor(x / 0.1) * 131072 + Math.floor(y / 0.1);
function leiaPocket(p, sd){
  const G = leiaGrid(p.x - LPOCK.win, p.y - LPOCK.win, p.x + LPOCK.win, p.y + LPOCK.win, 0.1), s0 = leiaNearCell(G, p, sd, 1, true); if (s0 < 0) return null;
  const seen = new Set([s0]), Q = [s0], keys = new Set();
  for (let h = 0; h < Q.length; h++){
    if (Q.length > LPOCK.cap) return null;
    const u = Q[h], ux = u % G.nx, uy = Math.floor(u / G.nx); keys.add((G.ix0 + ux) * 131072 + G.iy0 + uy);
    if (ux === 0 || uy === 0 || ux === G.nx - 1 || uy === G.ny - 1) return null;   // reaches the window's edge: open sea
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]){
      const x = ux + dx, y = uy + dy, v = y * G.nx + x; if (seen.has(v) || !isFinite(leiaCost(G, v, sd))) continue;
      if (dx && dy && (!isFinite(leiaCost(G, uy * G.nx + x, sd)) || !isFinite(leiaCost(G, y * G.nx + ux, sd)))) continue;
      seen.add(v); Q.push(v);
    }
  }
  return keys;
}
// the fine lane out of a pocket: to the first wet 25 m cell whose 100 m cell lies outside it, is open and 150 m from the shore; and on
// from there while that is a pocket too (at most three), the points from e outwards or null
function leiaPocketOut(e, sd, st){
  let out = null, cur = e;
  for (let n = 0; n < 3; n++){
    const pk = leiaPocket(cur, sd); if (!pk) break;
    const L = leiaLane(cur, q => !pk.has(pockKey(q.x, q.y)) && coastDist(q) >= LANE.clear && (!mapSimAt(q) || rcell(MAPD.L.dc, Math.floor(q.x / 0.1), Math.floor(q.y / 0.1)) > 0), 6);
    if (!L || L.length < 2) break;
    out = out ? out.concat(L.slice(1)) : L; cur = L[L.length - 1]; st.pocket = (st.pocket || 0) + 1;
  }
  return out;
}
async function leiaRoute0(a, b, aPort, bPort, pocket, opt0){
  const sd = safeDepth(), st = {slices:0, maxSlice:0, expanded:0, ms:0}, T0 = performance.now();
  const A = aPort ? portById(aPort) : null, B = bPort ? portById(bPort) : null;
  // the water round both ends first: a harbour's way in is found over the tiles' mask (approachPath), and a far harbour's tiles are
  // not in before the boat gets there (a route there threw «mask block is not loaded», 08.10.2026)
  await Promise.all([a, b].concat(A ? [A.p] : [], B ? [B.p] : []).map(p => mapNeed(p, 1.5)));
  // leave a harbour by its approach path, and come in by it
  const lane = pt => { try { return approachPath(pt); } catch (e){ return null; } };
  let lo = A ? lane(A) : [], li = B ? lane(B) : [];
  if (!lo || !li){ await Promise.all([A, B].filter(Boolean).map(pt => mapNeed(pt.p, 4))); lo = lo || approachPath(A); li = li || approachPath(B); }
  const laneOut = A ? lo.slice().reverse().filter(q => dist(q, A.p) >= 0.002) : [], laneIn = B ? li.filter(q => dist(q, B.p) >= 0.002) : [];
  // the harbour's own way in (approachPath) is kept as it is when the mend checks it: it may cross the quay land inside the harbour
  // (the sailing skips harbours for land) and the harbour mouth may be under the safe depth (2 to 3 m) though deep enough for the boat
  // (CI check of all plant pairs, 08.10.2026: Flekkerøy, Flatanger and Tustna had no way in); such a leg counts as soft (st.soft)
  st.trust = new Map(); const trustAdd = (id, arr) => arr.forEach(q => st.trust.set(q.x.toFixed(4) + ',' + q.y.toFixed(4), id));
  if (A && lo) trustAdd(1, [A.p].concat(lo)); if (B && li) trustAdd(2, [B.p].concat(li));
  // step 1: an end still in tight water (a narrow basin, among islets: its 100 m cells shut) goes out by the fine lane first
  const tight = q => { try { if (!mapSimAt(q)) return false; return !(rcell(MAPD.L.dc, Math.floor(q.x / 0.1), Math.floor(q.y / 0.1)) > 0 && coastDist(q) >= LANE.clear); } catch (e){ return false; } };
  const e0 = laneOut.length ? laneOut[laneOut.length - 1] : a, e1 = laneIn.length ? laneIn[0] : b;
  if (tight(e0)){ const L = leiaLane(e0); if (L && L.length > 1){ laneOut.push(...L.slice(1)); st.laneOut = L.length - 1; } }
  if (tight(e1)){ const L = leiaLane(e1); if (L && L.length > 1){ laneIn.unshift(...L.slice(1).reverse()); st.laneIn = L.length - 1; } }
  // the second try (the first found no way): an end in a pocket goes out of it by the fine lane first, unless the other end lies in the
  // same pocket (then the search inside it will do)
  if (pocket){
    const q0 = laneOut.length ? laneOut[laneOut.length - 1] : a, q1 = laneIn.length ? laneIn[0] : b;
    let k0 = null, k1 = null; try { k0 = leiaPocket(q0, sd); k1 = leiaPocket(q1, sd); } catch (e){}
    const same = k0 && k0.has(pockKey(q1.x, q1.y));
    if (k0 && !same){ const L = leiaPocketOut(q0, sd, st); if (L && L.length > 1) laneOut.push(...L.slice(1)); }
    if (k1 && !same){ const L = leiaPocketOut(q1, sd, st); if (L && L.length > 1) laneIn.unshift(...L.slice(1).reverse()); }
  }
  const from = laneOut.length ? laneOut[laneOut.length - 1] : a, to = laneIn.length ? laneIn[0] : b;
  // the end itself in water too shallow for the boat (a tap by the shore): no route ends on a shoal (the chart plotter moves such a
  // tap out to deeper water first, ui/03b-route.js leiaTo)
  if (!B && !inHarbour(b)){ let z = null; try { z = depthF(b); } catch (e){} if (z != null && z < leiaLim()) return {why:['For grunt der for båten. Trykk litt lenger ut.', 'Too shallow there for the boat. Tap a little farther out.'], st}; }
  // the way between the lanes, straightened and every leg checked as the boat sails it (leiaMend): the points after a, or null
  const finish = async (mid, strict) => {
    const all = [a].concat(laneOut, mid.slice(laneOut.length ? 1 : 0, laneIn.length ? -1 : undefined), laneIn, [b]);
    // drop repeats (the lane's end is also the search's start)
    const P = all.filter((q, i) => i === 0 || dist(q, all[i - 1]) > 0.001);
    await obsLoad(P);   // the coast's packs along the way, with their bridges and piers
    let best = null, km = 0; for (let i = 1; i < P.length; i++) km += dist(P[i - 1], P[i]); const maxWp = st.maxWp = leiaMaxWp(km);
    for (const m of LEIA.margins){ const s2 = await leiaStraighten(P, sd, m, st); if (!best || s2.length < best.length) best = s2; if (s2.length - 1 <= maxWp) break; }
    return leiaMend(best, sd, st, strict);
  };
  let safe = null, why = null;
  if (dist(from, to) < 30 && clearLine(from, to) && leiaLegOk(from, to, sd, LEIA.margins[0])) safe = await finish([from, to]);
  // a long straight leg over open sea (H1b R6): its pieces near the shore loaded and checked (legRuns), the rest is clear by its samples
  else if (dist(from, to) >= 30){ await lnetLoad([from, to]); let ok = false; try { ok = !leiaIceLeg(from, to) && leiaLegOk(from, to, sd, LEIA.margins[0]); } catch (e){} if (ok){ safe = await finish([from, to]); if (safe) st.by = 'open'; } }
  // a long way: by the fairway network first (11c-leinett.js)
  // (along the net the strict rule first, the safe depth and 25 m from rocks, as the grid's search keeps to; the boat's own minimum
  // only where that finds no way)
  if (!safe){ const net = await lnetRoute(from, to, sd, st);
    if (net && net.net){
      // a baked net: the way onto it and off it straightened and checked, its own legs as they are (tools/leia/bake.py)
      // (a way onto the net that the fine lane found is kept as it is: the lane is made of wet 25 m cells, no cut land corner, no breakwater,
      // every straight piece checked for land, the boat's own depth and rocks; the straightening here would join its pieces into legs
      // that fail on a rock beside them, Helligvær 08.10.2026; it counts as soft)
      const part = async (Q, lane) => { await lnetLoad(Q); await obsLoad(Q); if (lane){ st.soft = (st.soft || 0) + 1; st.laneKept = (st.laneKept || 0) + 1; return Q; } let best = null; for (const m of LEIA.margins){ const s2 = await leiaStraighten(Q, sd, m, st); if (!best || s2.length < best.length) best = s2; } return leiaMend(best, sd, st, true); };
      st.soft = 0; const A0 = [a].concat(laneOut, net.pre.slice(laneOut.length ? 1 : 0)).filter((q, i, l) => i === 0 || dist(q, l[i - 1]) > 0.001);
      const B0 = net.post.slice(0, laneIn.length ? -1 : undefined).concat(laneIn, [b]).filter((q, i, l) => i === 0 || dist(q, l[i - 1]) > 0.001);
      const pa = await part(A0, net.preLane), pb = pa && await part(B0, net.postLane);
      if (pa && pb){ safe = pa.concat(net.net.slice(1, -1), pb.slice(0)).filter((q, i, l) => i === 0 || dist(q, l[i - 1]) > 0.001); st.by = 'net'; st.maxWp = safe.length; st.soft = (st.soft || 0) + net.soft;
        // the map under the net's legs too, though nothing here checks them: the route list's warnings (draftHazards) and the sailing
        // read the depth along every leg (only loading, no search: a few seconds on the longest ways)
        const tl = performance.now(); await lnetLoad(net.net); st.loadMs = Math.round(performance.now() - tl); }
      else st.by = 'net-failed';
    }
    else if (net){ st.soft = 0; safe = await finish(net, true); st.by = safe ? 'net' : 'net-failed'; } }
  // the grid's search: when the net gave no way, or legs only the boat's own minimum allows (st.soft: near a rock or under the safe
  // depth by the chart) on a way short enough for it, and then the way with fewer such legs
  if (!safe || (st.soft && dist(from, to) < 400)){
    const netSoft = safe ? st.soft : Infinity, cells = await leiaFind(from, to, sd, st);
    if (cells && !cells.why){ st.soft = 0; const g = await finish([from].concat(cells, [to]), true); if (g && st.soft < netSoft){ safe = g; st.by = 'grid'; } else st.soft = netSoft; }
    else if (!safe) why = cells && cells.why ? ['Fant ingen rute dit. Punktet ligger for trangt til.', 'Found no route there. The point is too tight in.'] : ['Fant ingen rute dit.', 'Found no route there.'];
    if (!safe && !why) why = ['Fant ingen trygg rute dit.', 'Found no safe route there.'];
  }
  if (!safe){ if (!pocket){ const r2 = await leiaRoute0(a, b, aPort, bPort, true, opt0); if (!r2.why) return r2; r2.st.firstWhy = why; return r2; } return {why, st}; }
  // the whole way pulled tight under the sailing rule (leiaPull), the net's legs and the lanes' too
  if (!(opt0 && opt0.noPull)) safe = await leiaPull(safe, sd, st);
  // a leg that still passes a bridge's pier, a pier or a mark (the search's cells are 100 m and more) goes round it: under a bridge
  // between its piers, round the rest on the shorter side
  const wps = obsRoute(a, safe.slice(1)), nm = wps.reduce((acc, q, i) => acc + dist(i ? wps[i - 1] : a, q), 0) / NM;
  st.ms = performance.now() - T0;
  return {wps, nm, st};
}
