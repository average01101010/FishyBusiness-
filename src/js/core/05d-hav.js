// ===== The ocean fleet as NPCs (H1 of docs/planer/bestand-og-flaate.md, 02.11.2026) =====
// The register's active vessels of 28 m and over (tools/npc/havflaate.py -> data/havflaate.json: 248 of 249 in 2024-25: trawlers,
// purse seiners, Danish seiners, autoliners, snow crab and net vessels), each the game's own model of her kind, sailed by the clock
// alone like the coast's boats, so every player sees the same ships. A ship lives in cycles of port days and a trip: in port at a quay
// face near her home plant that is long and deep enough for her (npcBerths, quayFit; a 60 m trawler needs a real quay of 60 m), else
// not shown in port; on a trip to a ground of her gear, drawn by the landings of 28 m and over that month (an area with little landed
// that month sends fewer ships out: a purse seiner lies at the quay out of season), along Kystverket's fairways (LNET, lnetPath) and
// straight off the last node to the ground; there she fishes as her gear does (trawl tows back and forth, the purse seine's sets,
// the autoline set and hauled, the pots and nets in lenker), and steams home to land. From H1b R6 (05.11.2026) every ground lies in the
// game's frame (Bjørnøya, Svalbard, the snow crab's banks, Shetland, Iceland, the Russian zone), and the sea ice (03h-is.js) shuts a
// ground for a trip that starts while it lies in the drift ice, and the way out goes round the ice (havIceWay). Only the ships within
// AIS_KM of the boat you follow are given out (havNear), and their lines, pots and nets go into NPCGEAR as the coast boats' do.
const HAV_T = /*@text(data/havflaate.json)*/null;
const HAV = {d:null, way:new Map(), k:'', v:[], gear:[]};
// per gear: the trip and the port stay (days), the steaming speed (kn), the fishing, and the radius it keeps within (km)
const HAVG = {tral:{trip:[5, 12], port:[1, 2.5], kn:12, fish:'tow', r:4}, not:{trip:[2, 5], port:[1, 3], kn:13, fish:'purse', r:1.5},
  snurrevad:{trip:[3, 6], port:[1, 2], kn:11, fish:'seine', r:1.2}, line:{trip:[14, 28], port:[2, 4], kn:11, fish:'line', r:5},
  teine:{trip:[14, 28], port:[2, 4], kn:11, fish:'pots', r:3, len:4}, garn:{trip:[4, 8], port:[1, 2], kn:10, fish:'pots', r:1.2, len:1.2}};
// the permit behind each gear of the NPC ocean fleet (HAVLIC in 03d-quota.js)
const HAVGEAR = {tral:'tral', not:'rnot', snurrevad:'konv', line:'konv', garn:'konv', teine:'krab'};
// whether a ship's place is held by a player: the register has n fewer NPC owners of her permit than it started with, and she is among
// the first n of them (Jonas 01.11.2026: «Når en ny bruker registrerer seg i spillet skal 1 NPC-båt forsvinne», for the ocean permits in H1)
function havHeld(s){ if (typeof HREG === 'undefined' || !s.lid) return false; const n = Math.max(0, (HREG[s.lid] || 0) - (npcReg()[s.lid] || 0)); return n > 0 && s.lr <= n; }
function havData(){
  if (HAV.d !== null) return HAV.d;
  try { HAV.d = typeof HAV_T === 'string' ? JSON.parse(HAV_T) : false; } catch (e){ HAV.d = false; }
  const D = HAV.d; if (!D) return D;
  // the month's weight of each gear (its heaviest month 1), and the ships by plant (for their berths)
  D.mw = {}; for (const g in D.g){ const m = new Array(12).fill(0); for (const e of D.g[g]) for (let k = 0; k < 12; k++) m[k] += e[3][k]; const mx = Math.max(1, ...m); D.mw[g] = m.map(v => v / mx); }
  D.ships = D.v.map(([g, pi, name], i) => { const V = VESSELS[D.kind[g]] || VESSELS.bunntral, s = hash(i * 977 + 13), G = HAVG[g] || HAVG.tral;
    const port = G.port[0] + (G.port[1] - G.port[0]) * hash(i * 31 + 5), trip = G.trip[0] + (G.trip[1] - G.trip[0]) * hash(i * 37 + 7);
    return {i, id:'v' + i, g, pi, name, vtype:D.kind[g], L:V.len, B:V.beam, T:V.draft || 6, port, trip, C:port + trip, ph:s * (port + trip), kn:G.kn * (0.92 + 0.16 * hash(i * 41 + 3))}; });
  D.byPlant = new Map(); for (const s of D.ships){ let a = D.byPlant.get(s.pi); if (!a) D.byPlant.set(s.pi, a = []); a.push(s); s.land = 4 + 4 * hash(s.i * 43 + 9); }
  // the ships that may land at a plant other than their home (a ground of their gear lands there)
  // the rank of each ship among those of her permit (H1 of the ocean step: the first n of a kind leave the sea when players hold n permits)
  const rk = {}; D.ships.map(s => [hash(s.i * 59 + 21), s]).sort((x, y) => x[0] - y[0]).forEach(([, s]) => { const id = HAVGEAR[s.g] || 'tral'; s.lid = id; s.lr = rk[id] = (rk[id] || 0) + 1; });
  D.visit = new Map(); for (const s of D.ships){ const seen = new Set(); for (const e of D.g[s.g] || []){ const dp = e[5]; if (dp == null || dp === s.pi || seen.has(dp)) continue; seen.add(dp); let a = D.visit.get(dp); if (!a) D.visit.set(dp, a = []); a.push(s); } }
  return D;
}
// the trip k of a ship: whether she goes (the month's weight), the ground (by the month's landings of her gear), and its row
// (H1b R6) a ground in the drift ice the day the trip starts is shut for it (havOpen), and the draw is among the open ones; all shut, she
// stays in port. H0: the hour the trip starts, which the way round the ice is made for (havWay)
function havTrip(s, k){
  const D = havData(), d0 = k * s.C - s.ph + s.port, m = gDate(d0 * 24).getUTCMonth(), w = D.mw[s.g] ? D.mw[s.g][m] : 0;
  if (hash(k * 131 + s.i * 7 + 1) > Math.min(1, w / 0.35)) return null;   // out of season: she stays in port
  const G = D.g[s.g] || [], op = havOpen(s.g, Math.floor(d0)); let tot = 0; for (let j = 0; j < G.length; j++) if (op[j]) tot += G[j][3][m]; if (tot <= 0) return null;
  let r = hash(k * 151 + s.i * 11 + 2) * tot, last = -1; for (let j = 0; j < G.length; j++){ if (!op[j]) continue; last = j; r -= G[j][3][m]; if (r <= 0) return {gi:j, e:G[j], H0:d0 * 24}; }
  return {gi:last, e:G[last], H0:d0 * 24};
}
// which grounds of a gear are clear of the drift ice at noon on day d (days from the epoch), kept per gear and day
const HAVOPEN = new Map();
function havOpen(g, d){
  const key = g + '|' + d; let o = HAVOPEN.get(key); if (o) return o;
  const G = havData().g[g] || [], H = d * 24 + 12; o = G.map(e => e[1] == null || typeof SEA_ICE === 'undefined' || !SEA_ICE || seaIceAt({x:e[1], y:e[2]}, H) < SEA_ICE_LIM);
  if (HAVOPEN.size > 400) HAVOPEN.clear(); HAVOPEN.set(key, o); return o;
}
// The way round the ice (H1b R6, Jonas: the ice shuts grounds and makes the NPCs go round too): from a (the last fairway node) to b (the
// ground) at hour H, when the straight leg meets ice of SEA_ICE_LIM % or more. A* on cells of HAVICE.c km in a box HAVICE.pad km round
// the leg, open where the ice is under the limit less HAVICE.margin and the core says sea (isLandFar), then pulled straight where a leg
// keeps out of the ice and off the land (every 2 km). The points between a and b, or null when the straight leg is clear or there is
// no way round (then she goes straight, an approximation, BACKLOG). A function of the hour alone, so every player sees the same.
const HAVICE = {c:20, pad:400, margin:5, step:2};
// (the core's land; none before the core is in, as in the tests of the core without the map)
const havLandF = p => typeof MAPD !== 'undefined' && MAPD.core && MAPD.core.buf ? isLandFar(p) : false;
function havIceClear(a, b, H){ const n = Math.max(1, Math.ceil(dist(a, b) / HAVICE.step)); for (let i = 1; i < n; i++){ const p = {x:a.x + (b.x - a.x) * i / n, y:a.y + (b.y - a.y) * i / n}; if (seaIceAt(p, H) >= SEA_ICE_LIM || havLandF(p)) return false; } return true; }
function havIceWay(a, b, H){
  if (typeof SEA_ICE === 'undefined' || !SEA_ICE || !seaIceOnLeg(a, b, H, {})) return null;
  const c = HAVICE.c, x0 = Math.min(a.x, b.x) - HAVICE.pad, y0 = Math.min(a.y, b.y) - HAVICE.pad, nx = Math.ceil((Math.max(a.x, b.x) + HAVICE.pad - x0) / c), ny = Math.ceil((Math.max(a.y, b.y) + HAVICE.pad - y0) / c), N = nx * ny;
  const ctr = v => ({x:x0 + (v % nx + 0.5) * c, y:y0 + (Math.floor(v / nx) + 0.5) * c}), OPEN = new Int8Array(N).fill(-1);
  const open = v => { if (OPEN[v] < 0){ const p = ctr(v); OPEN[v] = seaIceAt(p, H) < SEA_ICE_LIM - HAVICE.margin && !havLandF(p) ? 1 : 0; } return OPEN[v] === 1; };
  const at = p => Math.floor((p.y - y0) / c) * nx + Math.floor((p.x - x0) / c);
  const near = p => { const v0 = at(p); if (open(v0)) return v0; const i0 = v0 % nx, j0 = Math.floor(v0 / nx); let best = -1, bd = 1e9;
    for (let j = Math.max(0, j0 - 3); j <= Math.min(ny - 1, j0 + 3); j++) for (let i = Math.max(0, i0 - 3); i <= Math.min(nx - 1, i0 + 3); i++){ const v = j * nx + i; if (!open(v)) continue; const d = dist(ctr(v), p); if (d < bd){ bd = d; best = v; } } return best; };
  const s0 = near(a), t0 = near(b); if (s0 < 0 || t0 < 0) return null;
  const G = new Float64Array(N).fill(Infinity), F = new Int32Array(N).fill(-1), H2 = leiaHeap(), tx = t0 % nx, ty = Math.floor(t0 / nx);
  G[s0] = 0; H2.push(s0, 0); let found = false;
  while (H2.size()){ const u = H2.pop(); if (u === t0){ found = true; break; } const ux = u % nx, uy = Math.floor(u / nx);
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++){ if (!dx && !dy) continue; const x = ux + dx, y = uy + dy; if (x < 0 || y < 0 || x >= nx || y >= ny) continue; const v = y * nx + x; if (!open(v)) continue;
      const g = G[u] + Math.hypot(dx, dy) * c; if (g < G[v]){ G[v] = g; F[v] = u; H2.push(v, g + Math.hypot(x - tx, y - ty) * c); } } }
  if (!found) return null;
  const cells = []; for (let v = t0; v !== -1; v = F[v]) cells.push(ctr(v)); cells.reverse();
  const P = [a].concat(cells, [b]), out = []; let i = 0;
  while (i < P.length - 1){ let j = P.length - 1; while (j > i + 1 && !havIceClear(P[i], P[j], H)) j--; if (j < P.length - 1) out.push(P[j]); i = j; }
  return out;
}
// the way from a plant to a ground: the plant, its fairway nodes to the ground's, the ground (kept per plant and ground)
function havWay(s, gi, pi, H0){
  const D = havData(); if (pi == null) pi = s.pi; const key = pi + ':' + s.g + ':' + gi; let W = HAV.way.get(key);
  if (W === undefined) W = havWay0(s, gi, pi, key);
  // (H1b R6) the leg off the last node to the ground round the ice the day the trip starts, when the ice can reach it at all (iceMay:
  // a cell along it has the limit some month); kept per day
  if (H0 == null || !W.iceMay) return W;
  const day = Math.floor(H0 / 24), ki = key + '|i' + day; let Wi = HAV.way.get(ki); if (Wi !== undefined) return Wi;
  const pts = W.pts, a = {x:pts[pts.length - 2][0], y:pts[pts.length - 2][1]}, b = W.to, round = havIceWay(a, b, day * 24 + 12);
  if (!round){ Wi = W; }
  else { const q = pts.slice(0, -1).concat(round.map(p => [p.x, p.y]), [pts[pts.length - 1]]); Wi = {R:prepRoute(q), RR:prepRoute(q.slice().reverse()), to:b, pts:q, ice:round.length}; }
  if (HAV.way.size > 600) HAV.way.clear(); HAV.way.set(ki, Wi); return Wi;
}
function havWay0(s, gi, pi, key){
  const D = havData(); let W;
  const pl = D.p[pi], e = D.g[s.g][gi], from = {x:pl[1], y:pl[2]}, to = {x:e[1], y:e[2]}, pts = [[from.x, from.y]];
  const pa = D.pa[pi] || [], ga = e[4] || [];
  const P = typeof LNET !== 'undefined' && LNET && pa.length && ga.length ? lnetPath(pa.map(q => [q[0], q[1]]), ga) : null;
  // (out of the plant through the water to the fairway: the way's bends the tool found for the node the net starts at)
  if (P){ const o = pa.find(q => q[0] === P.nodes[0]); if (o) for (let i = 2; i + 1 < o.length; i += 2) pts.push([o[i], o[i + 1]]); for (const v of P.nodes) pts.push([LNET.X[v], LNET.Y[v]]); }
  pts.push([to.x, to.y]);
  // whether the ice can reach the last leg in any month (the most any month has, along it every 10 km)
  let iceMay = false; if (typeof SEA_ICE !== 'undefined' && SEA_ICE && pts.length >= 2){ const a = {x:pts[pts.length - 2][0], y:pts[pts.length - 2][1]}, n = Math.max(1, Math.ceil(dist(a, to) / 10)), I = SEA_ICE;
    for (let i = 0; i <= n && !iceMay; i++){ const p = {x:a.x + (to.x - a.x) * i / n, y:a.y + (to.y - a.y) * i / n}, u = Math.round(p.x / I.c - I.ix0 - 0.5), v = Math.round(p.y / I.c - I.iy0 - 0.5);
      for (let dv = -1; dv <= 1 && !iceMay; dv++) for (let du = -1; du <= 1; du++){ const uu = u + du, vv = v + dv; if (uu >= 0 && vv >= 0 && uu < I.nx && vv < I.ny && I.any[vv * I.nx + uu] >= SEA_ICE_LIM){ iceMay = true; break; } } } }
  W = {R:prepRoute(pts), RR:prepRoute(pts.slice().reverse()), to, pts, iceMay};
  if (HAV.way.size > 600) HAV.way.clear(); HAV.way.set(key, W); return W;
}
// the way from one plant to another along the fairways (from the plant she landed at, home): null when the net has none
function havLeg(a, b){
  const D = havData(), key = 'L' + a + ':' + b; let W = HAV.way.get(key); if (W !== undefined) return W;
  const A = D.pa[a] || [], B = D.pa[b] || [], pa = D.p[a], pb = D.p[b];
  const P = typeof LNET !== 'undefined' && LNET && A.length && B.length ? lnetPath(A.map(q => [q[0], q[1]]), B.map(q => [q[0], q[1]])) : null;
  if (!P) W = null;
  else { const pts = [[pa[1], pa[2]]], bend = (o, out) => { const q = []; for (let i = 2; i + 1 < o.length; i += 2) q.push([o[i], o[i + 1]]); return out ? q : q.reverse(); };
    const oa = A.find(q => q[0] === P.nodes[0]), ob = B.find(q => q[0] === P.nodes[P.nodes.length - 1]);
    if (oa) pts.push(...bend(oa, true)); for (const v of P.nodes) pts.push([LNET.X[v], LNET.Y[v]]); if (ob) pts.push(...bend(ob, false)); pts.push([pb[1], pb[2]]);
    W = {R:prepRoute(pts)}; }
  if (HAV.way.size > 600) HAV.way.clear(); HAV.way.set(key, W); return W;
}
// the berths of a plant's ships (npcBerths: a face that stands in 3D and fits, off the plant's own berths): at home her plant's own
// ships; at a plant she lands at (H, the hour), its own ships first and then the visitors lying there now, in the order they came, so
// a ship keeps her berth while she lies there unless one who came before her leaves
function havBerth(s, pi, H){
  const D = havData(); if (pi == null) pi = s.pi; const pl = D.p[pi]; let grp = 'hav:' + pl[0], ships = D.byPlant.get(pi) || [];
  if (pi !== s.pi){ const v = havVisitors(pi, H); ships = ships.concat(v); grp += ':' + v.map(q => q.id).join(','); }
  const mates = ships.map(q => ({key:q.id, L:q.L, B:q.B, T:q.T}));
  // (the land round the quays not loaded yet, a moment after a jump: no berth this time, she is not shown until it is)
  try { return npcBerths(grp, {x:pl[1], y:pl[2]}, mates, 1.5)[s.id] || null; } catch (e){ if (/not loaded/.test(e.message)) return null; throw e; }
}
// her speed on the grid (km/h) on a trip: true knots times the grid's scale (gridScale, H1b), the mean of home's and the ground's
// (k is 1.00-1.04 between them; the trip's hours are a function of the clock, so one number per trip)
function havV(s, tr){ const h = havData().p[s.pi], g = tr && tr.e && tr.e[1] != null ? {x:tr.e[1], y:tr.e[2]} : null;
  return s.kn * NM * (g ? (gridScale({x:h[1], y:h[2]}) + gridScale(g)) / 2 : gridScale({x:h[1], y:h[2]})); }
// the ships lying at plant pi at hour H to land their catch, the first come first (kept per plant and minute)
const HAVVIS = new Map();
function havVisitors(pi, H){
  const D = havData(), key = pi + '|' + Math.floor(H * 60); let out = HAVVIS.get(key); if (out) return out; out = [];
  for (const s of D.visit.get(pi) || []){
    const t = H / 24 + s.ph, k = Math.floor(t / s.C), e = t - k * s.C; if (e < s.port) continue;
    const tr = havTrip(s, k); if (!tr || tr.e[1] == null || tr.e[5] !== pi) continue; const Ld = havLand(s, tr); if (!Ld) continue;
    const v = havV(s, tr), steam = havWay(s, tr.gi, null, tr.H0).R.len / v, F = s.trip * 24 - steam - Ld.back - s.land - Ld.home, arr = (e - s.port) * 24 - steam - F - Ld.back;
    if (arr >= 0 && arr < s.land) out.push([arr, s]); }
  out = out.sort((a, b) => b[0] - a[0] || a[1].i - b[1].i).map(q => q[1]);   // (longest there first)
  if (HAVVIS.size > 200) HAVVIS.clear(); HAVVIS.set(key, out); return out;
}
// the landing of a trip (task 2, 03.11.2026): the plant the ground's catch goes to (havflaate.py: the nearest along the fairways that
// takes the gear and has a quay for her), the ways there and home, and the hours at the quay; null when she lands at home, or when the
// detour would leave less than a quarter of the trip to fish
function havLand(s, tr){
  const D = havData(), dp = tr.e[5]; if (dp == null || dp === s.pi) return null;
  const a = D.p[dp], h = D.p[s.pi]; if (Math.hypot(a[1] - h[1], a[2] - h[2]) < 5) return null;   // (the same harbour: she lands at home)
  const v = havV(s, tr), W = havWay(s, tr.gi, null, tr.H0), Wd = havWay(s, tr.gi, dp, tr.H0), Wh = havLeg(dp, s.pi); if (!Wh) return null;
  const out = W.R.len / v, back = Wd.R.len / v, home = Wh.R.len / v, Th = s.trip * 24;
  return out + back + s.land + home > Th * 0.75 ? null : {pi:dp, Wd, Wh, back, home};
}
const havRot = (a, dx, dy) => ({x:Math.cos(a) * dx - Math.sin(a) * dy, y:Math.sin(a) * dx + Math.cos(a) * dy});
// on the ground: where she is at hour u of her fishing, the gear in the sea ({k, a, b}) and whether the trawl is out
function havFish(s, k, u, g){
  const G = HAVG[s.g] || HAVG.tral, a0 = hash(k * 173 + s.i * 13) * Math.PI, at = (dx, dy) => { const q = havRot(a0, dx, dy); return {x:g.x + q.x, y:g.y + q.y}; }, out = {set:[]};
  if (G.fish === 'tow'){
    // tows of 5 h at 4 kn back and forth along a line through the ground (8 km), half an hour between them to haul and shoot again
    const C = 5.5, j = Math.floor(u / C), v = u - j * C, off = (hash(k * 7 + j * 3 + s.i) - 0.5) * 2;
    if (v < 5){ const L = G.r * 2, x = (v * 4 * NM) % (2 * L), d = x < L ? x - G.r : 3 * G.r - x, dir = x < L ? 0 : Math.PI; return Object.assign(out, {p:at(d, off), hd:a0 + Math.PI / 2 + dir, trawl:true}); }
    return Object.assign(out, {p:at(((5 * 4 * NM) % (4 * G.r) < 2 * G.r ? 1 : -1) * G.r * 0.9, off), hd:a0, trawl:false});
  }
  if (G.fish === 'purse' || G.fish === 'seine'){
    // purse seine: search for 3 h, the set round the school in 20 min, pursing and pumping 2.7 h; Danish seine: 3 h a haul
    const C = G.fish === 'purse' ? 6 : 3, j = Math.floor(u / C), v = u - j * C, c = at((hash(k * 11 + j * 5 + s.i) - 0.5) * 2 * G.r * 0.7, (hash(k * 13 + j * 7 + s.i) - 0.5) * 2 * G.r * 0.7);
    const rad = G.fish === 'purse' ? 0.12 : 0.5, srch = G.fish === 'purse' ? 3 : 0.4, setT = G.fish === 'purse' ? 0.33 : 0.5;
    if (v < srch){ const prev = at((hash(k * 11 + (j - 1) * 5 + s.i) - 0.5) * 2 * G.r * 0.7, (hash(k * 13 + (j - 1) * 7 + s.i) - 0.5) * 2 * G.r * 0.7), q = v / srch;
      return Object.assign(out, {p:{x:prev.x + (c.x - prev.x) * q, y:prev.y + (c.y - prev.y) * q}, hd:Math.atan2(c.x - prev.x, -(c.y - prev.y))}); }
    // (the seine in 3D, view3d drawSeine: the stage and how far through it, and the ring's radius in metres, its centre to starboard
    // abeam as the ship circles the school; a purse seine is pursed, hauled and pumped, a Danish seine's warps hauled in)
    const R = rad * 1000;
    if (v < srch + setT){ const an = (v - srch) / setT * 2 * Math.PI; return Object.assign(out, {p:{x:c.x + Math.sin(an) * rad, y:c.y - Math.cos(an) * rad}, hd:an + Math.PI / 2, seine:{m:'shoot', k:(v - srch) / setT, R, purse:G.fish === 'purse'}}); }
    const w = v - srch - setT, ST = G.fish === 'purse' ? [['purse', 0.6], ['haul', 1.4], ['pump', 0.67]] : [['haul', C - srch - setT]];
    let m = ST[ST.length - 1][0], kk = 1, w0 = 0; for (const [nm, d] of ST){ if (w < w0 + d){ m = nm; kk = (w - w0) / d; break; } w0 += d; }
    return Object.assign(out, {p:{x:c.x, y:c.y - rad}, hd:Math.PI / 2, seine:{m, k:Math.min(1, kk), R, purse:G.fish === 'purse'}});
  }
  if (G.fish === 'line'){
    // the autoline: a line of 10 km set in 1.2 h, the one set before hauled in 10.8 h; the lines side by side 2 km apart, turn about
    const C = 12, j = Math.floor(u / C), v = u - j * C, line = n => { const o = ((n % 5) - 2) * 1.0, dir = n % 2 ? -1 : 1; return {a:at(-dir * G.r, o), b:at(dir * G.r, o)}; };
    const cur = line(j), prev = j > 0 ? line(j - 1) : null;
    if (v < 1.2){ const q = v / 1.2, p = {x:cur.a.x + (cur.b.x - cur.a.x) * q, y:cur.a.y + (cur.b.y - cur.a.y) * q}; out.set.push({k:'line', a:cur.a, b:p}); if (prev) out.set.push({k:'line', a:prev.a, b:prev.b});
      return Object.assign(out, {p, hd:Math.atan2(cur.b.x - cur.a.x, -(cur.b.y - cur.a.y))}); }
    out.set.push({k:'line', a:cur.a, b:cur.b});
    if (!prev) return Object.assign(out, {p:cur.b, hd:0});
    const q = (v - 1.2) / 10.8, p = {x:prev.b.x + (prev.a.x - prev.b.x) * q, y:prev.b.y + (prev.a.y - prev.b.y) * q}; out.set.push({k:'line', a:prev.a, b:p});
    return Object.assign(out, {p, hd:Math.atan2(prev.a.x - prev.b.x, -(prev.a.y - prev.b.y))});
  }
  // pots and nets: six lenker side by side, each hauled and set again in turn (3 h), the others soaking
  const N = 6, L = G.len || 2, C = 3, j = Math.floor(u / C), v = u - j * C, kind = s.g === 'garn' ? 'garn' : 'teine', len = n => { const o = (n - (N - 1) / 2) * (G.r * 2 / N); return {a:at(-L / 2, o), b:at(L / 2, o)}; };
  for (let n = 0; n < N; n++) if (n !== j % N) { const l = len(n); out.set.push({k:kind, a:l.a, b:l.b}); }
  const l = len(j % N), q = Math.min(1, v / 2.6), p = {x:l.a.x + (l.b.x - l.a.x) * q, y:l.a.y + (l.b.y - l.a.y) * q}; out.set.push({k:kind, a:p, b:l.b});
  return Object.assign(out, {p, hd:Math.atan2(l.b.x - l.a.x, -(l.b.y - l.a.y))});
}
// where a ship is at hour H: {p, hd, st, set, trawl, seine, lev, at} or {hidden} (lev: 'go' on her way to land at the plant at, 'land' there;
// near: the place asked from, so a far plant's berth is not looked for where its map is not loaded)
function havState(s, H, near){
  const t = H / 24 + s.ph, k = Math.floor(t / s.C), e = t - k * s.C;
  const port = () => { const m = havBerth(s); return m ? {p:m.p, hd:m.hd, st:'port', face:m.face} : {hidden:true, st:'port'}; };
  if (e < s.port) return port();
  const tr = havTrip(s, k); if (!tr) return port();
  if (tr.e[1] == null) return {hidden:true, st:'away'};
  const W = havWay(s, tr.gi, null, tr.H0), v = havV(s, tr), steam = W.R.len / v, h = (e - s.port) * 24, Th = s.trip * 24, Ld = havLand(s, tr);
  if (Ld){
    // to the ground, fish, to the plant that takes the catch, lie there some hours, and home along the fairways
    const F = Th - steam - Ld.back - s.land - Ld.home;
    if (h < steam){ const a = atRoute(W.R, h * v); return {p:a.p, hd:a.hd, st:'out'}; }
    if (h < steam + F){ const f = havFish(s, k, h - steam, W.to); return {p:f.p, hd:f.hd, st:'fishing', set:f.set, trawl:f.trawl, seine:f.seine}; }
    const b = h - steam - F; if (b < Ld.back){ const a = atRoute(Ld.Wd.RR, b * v); return {p:a.p, hd:a.hd, st:'in', lev:'go', at:Ld.pi}; }
    if (b < Ld.back + s.land){ const pl = havData().p[Ld.pi];
      // (her berth only when the plant is within reach of the one asking: its quays and land are loaded only there)
      if (near && Math.hypot(pl[1] - near.x, pl[2] - near.y) > AIS_KM + 2) return {hidden:true, st:'port', lev:'land', at:Ld.pi};
      const m = havBerth(s, Ld.pi, H); return m ? {p:m.p, hd:m.hd, st:'port', face:m.face, lev:'land', at:Ld.pi} : {hidden:true, st:'port', lev:'land', at:Ld.pi}; }
    const a = atRoute(Ld.Wh.R, Math.min(Ld.Wh.R.len, (b - Ld.back - s.land) * v)); return {p:a.p, hd:a.hd, st:'in'};
  }
  const F = Math.max(0, Th - 2 * steam);
  if (h < Math.min(steam, Th / 2)){ const a = atRoute(W.R, h * v); return {p:a.p, hd:a.hd, st:'out'}; }
  if (h < steam + F){ const f = havFish(s, k, h - steam, W.to); return {p:f.p, hd:f.hd, st:'fishing', set:f.set, trawl:f.trawl, seine:f.seine}; }
  const b = Math.max(0, h - steam - F), a = atRoute(W.RR, Math.min(W.RR.len, (F > 0 ? b : h - Th / 2) * v)); return {p:a.p, hd:a.hd, st:'in'};
}
// the ships within AIS_KM of the boat you follow, as npcStates gives them out (kept per hour and place, as coastNear)
function havNear(H, only){
  const D = havData(), b = S && S.boat; if (!D || !b || !b.pos) return [];
  const k = H + '|' + b.pos.x.toFixed(2) + ',' + b.pos.y.toFixed(2) + '|' + VEC.ver; if (!only && HAV.k === k) return HAV.v;
  const out = [], gear = [], R = AIS_KM;
  for (const s of D.ships){
    if (only && only !== s.id) continue;
    if (havHeld(s)) continue;   // a player holds her permit: she is off the sea
    // (a ship cannot be near when she is in port far off, away, or on a trip whose plant and ground both lie far off the line between
    // them: her way runs along the coast between the two, at most some 200 km off that line)
    if (!only){ const pl = D.p[s.pi], t = H / 24 + s.ph, kk = Math.floor(t / s.C), e = t - kk * s.C, near = (a, c, m) => segDist(b.pos, a, c) <= m;
      const tr = e < s.port ? null : havTrip(s, kk), P0 = {x:pl[1], y:pl[2]};
      if (!tr){ if (dist(P0, b.pos) > R + 2) continue; }
      else if (tr.e[1] == null) continue;
      else { const G0 = {x:tr.e[1], y:tr.e[2]}, dp = tr.e[5], Q = dp != null && dp !== s.pi ? {x:D.p[dp][1], y:D.p[dp][2]} : null;
        // (a ground in the north or west, where the way may go round the ice, H1b R6: 400 km more)
        const m = R + 200 + (G0.y < 300 || G0.x < 0 ? 400 : 0);
        if (!near(P0, G0, m) && !(Q && (near(G0, Q, m) || near(Q, P0, m)))) continue; } }
    const A = havState(s, H, b.pos); if (A.hidden) continue;
    if (A.set) for (const q of A.set) if (q.a !== q.b && Math.min(dist(q.a, b.pos), dist(q.b, b.pos)) <= R) gear.push({k:q.k, a:q.a, b:q.b, id:s.id, name:s.name});
    if (dist(A.p, b.pos) > R) continue;
    // (a minute ago she may have been hidden, in a port whose berth is not known: then she has just come out and no speed is read,
    // where P.p was read before P.hidden was asked and threw in npcStates, UI review 04.11.2026)
    const P0 = A.st === 'port' ? A : havState(s, H - 1 / 60, b.pos), P = P0.hidden ? A : P0, dx = A.p.x - P.p.x, dy = A.p.y - P.p.y, sog = Math.hypot(dx, dy) / gridScale(A.p) / NM * 60;
    out.push({id:s.id, name:s.name, type:'kyst', hav:s.g, vtype:s.vtype, p:A.p, hd:A.hd, cog:sog > 0.15 ? Math.atan2(dx, -dy) : A.hd, v:Math.round(sog * 10) / 10, st:A.st, L:s.L, B:s.B, T:s.T, liv:s.i % 4, trawl:!!A.trawl, seine:A.seine || null, lev:A.lev || null});
  }
  if (!only){ HAV.k = k; HAV.v = out; HAV.gear = gear; }
  return out;
}
