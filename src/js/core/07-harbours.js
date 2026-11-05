// ===== harbours: quays, berths and mooring =====
// Quays and piers from OpenStreetMap as the boxes the 3D view draws (metres): an open pier line is a 4.2 m wide quay along it,
// a closed quay outline is its oriented bounding box, a breakwater is lower and wider. Harbours without a mapped quay get one
// from the shore out to the berth. The 3D view and the berths both use this list, so a boat lies against what you see.
const QTOP = 2.4;   // quay deck above mean sea level (m); about 3.7 m above chart datum, usual for fishing quays in the north
// The quays where the fish plants and the bunker quays really are, from satellite pictures marked up by the designer (29.09.2026), laid
// onto the game's coastline and moved out past where it bulges: a and b are the ends of the quay face (metres), n points out to the
// water. 'main' is where you land the catch (in Finnsnes: the quay by the net loft and the gear and boat dealers), 'bunker' the fuel quay.
const QUAYS = {
  finnsnes:{main:{a:[56058, 53575], b:[56027, 53652], n:[-0.927, -0.376]}},
  botnhamn:{main:{a:[53266, 23498], b:[53309, 23503], n:[0.11, -0.994]}, bunker:{a:[53362, 23519], b:[53388, 23551], n:[0.774, -0.633]}},
  husoy:{main:{a:[43800, 19653], b:[43815, 19722], n:[0.978, -0.21]}, bunker:{a:[44033, 19647], b:[44021, 19693], n:[-0.968, -0.251]}},
  senjahopen:{main:{a:[36780, 25127], b:[36829, 25100], n:[0.474, 0.88]}, bunker:{a:[36849, 25064], b:[36881, 25036], n:[0.666, 0.746]}},
  gryllefjord:{main:{a:[20280, 39831], b:[20354, 39856], n:[0.316, -0.949]}, bunker:{a:[20029, 39773], b:[20074, 39788], n:[0.307, -0.952]}},
  torsken:{main:{a:[21824, 42565], b:[21892, 42580], n:[-0.215, 0.977]}, bunker:{a:[21914, 42574], b:[21959, 42572], n:[0.04, 0.999]}},
  frovag:{main:{a:[19636, 71906], b:[19631, 71932], n:[0.987, 0.163]}}
};
for (const pid in QUAYS) for (const kind in QUAYS[pid]){ const f = QUAYS[pid][kind]; f.a = LGm(f.a); f.b = LGm(f.b); }   // legacy metres into the game's frame
Object.assign(QUAYS, COASTQ);   // the receivers' quays along the coast (06b-coastports.js), in the game's metres already
const QUAY_DEPTH = 10;   // how far the quay deck reaches in from the face (m)
// The harbour unit (UNIT, UNITS in 01-world.js) is the quay in every harbour with a plant: its berths, its dredged basin.
// the depth below chart datum at p (km) where a unit stands: 0 on the quay itself and its fill, at least the dredged depth in the basin, rising
// 1 in 2 outside it; d elsewhere
// (H1b R6, 05.11.2026: the units by the 1 km square their box touches, so a depth read far from every harbour costs one lookup; before,
// every read looped over all of UNITA, and that was half the time of a long Autonav route over open sea. Rebuilt when UNITA grows.)
const UNITG = {n:-1, g:null, none:[]};
function unitsAt(x, z){
  if (UNITG.n !== UNITA.length){ const g = UNITG.g = new Map(); UNITG.n = UNITA.length;
    for (const U of UNITA){ const R = U.y ? 200 : 100; for (let i = Math.floor((U.o[0] - R) / 1000); i <= Math.floor((U.o[0] + R) / 1000); i++) for (let j = Math.floor((U.o[1] - R) / 1000); j <= Math.floor((U.o[1] + R) / 1000); j++){ const k = i * 65536 + j; let l = g.get(k); if (!l) g.set(k, l = []); l.push(U); } } }
  return UNITG.g.get(Math.floor(x / 1000) * 65536 + Math.floor(z / 1000)) || UNITG.none;
}
function unitDredge(p, d){
  const x = p.x * 1000, z = p.y * 1000;
  for (const U of unitsAt(x, z)){
    const R = U.y ? 200 : 100; if (Math.abs(x - U.o[0]) > R || Math.abs(z - U.o[1]) > R) continue;
    const [lx, lz] = unitL(U, x, z), g = ugeo(U);
    if (groundOut(U, lx, lz) === 0) return 0;
    if (lz > 0){ const dO = Math.hypot(Math.max(0, Math.abs(lx) - g.basinX), Math.max(0, lz - g.basinZ)); d = Math.max(d, g.dredge - tideZC(p) - 0.5 * dO); }
  }
  return d;
}
function quayFace(pid, kind){
  if (kind === 'naust') return naustFace(pid);   // Father's pile quay in the home harbour (07c-naust.js)
  if (RBID.has(pid)) return kind === 'main' ? rorbuFace(pid) : null;   // a rorbu's quay (07d-rorbu.js)
  if (isBerth(pid)) return kind === 'main' ? havnFace(pid) : null;   // a berth in a harbour (07e-havn.js)
  const U = UNITS[pid];
  if (U){ const g = ugeo(U), b = g.berth[kind]; if (!b) return null; const c = unitW(U, b[0], 0); return {x:c[0], z:c[1], ux:U.u[0], uz:U.u[1], nx:U.n[0], nz:U.n[1], hl:b[1] / 2, depth:g.B, unit:pid}; }
  const q = QUAYS[pid] && QUAYS[pid][kind]; if (!q) return null;
  const dx = q.b[0] - q.a[0], dz = q.b[1] - q.a[1], L = Math.hypot(dx, dz), ux = dx / L, uz = dz / L, s = -uz * q.n[0] + ux * q.n[1] >= 0 ? 1 : -1;
  return {x:(q.a[0] + q.b[0]) / 2, z:(q.a[1] + q.b[1]) / 2, ux, uz, nx:-uz * s, nz:ux * s, hl:L / 2, depth:QUAY_DEPTH};
}
const PIERBOX = (() => {
  const out = [];
  // OpenStreetMap's piers and breakwaters (01c-vec.js pierBoxes, as the coast's packs have them)
  PIERS.forEach((pr, i) => pierBoxes(out, pr[0], (pr.length - 1) / 2, k => pr[1 + k * 2] * 1000, k => pr[2 + k * 2] * 1000, i));
  // the quay decks behind the faces in QUAYS; the shoreline behind them is not always straight, so the deck fills the gap
  for (const pid in QUAYS) for (const kind in QUAYS[pid]){ if (UNITS[pid]) continue; const f = quayFace(pid, kind); out.push({x:f.x - f.nx * f.depth / 2, z:f.z - f.nz * f.depth / 2, w:f.depth, l:f.hl * 2, ang:Math.atan2(f.ux, f.uz), bw:false, closed:false, made:true, quay:pid + '|' + kind}); }
  // where a harbour unit stands, the mapped piers on its ground (the block and its fill) and in its basin go (the unit is its own quay)
  const inUnit = (x, z) => UNITA.some(U => { const [lx, lz] = unitL(U, x, z); const g = ugeo(U); return groundOut(U, lx, lz) <= 2 || (Math.abs(lx) <= g.basinX && lz >= 0 && lz <= g.basinZ); });
  for (let i = out.length - 1; i >= 0; i--){
    const q = out[i]; if (q.made) continue;
    const ax = Math.sin(q.ang), az = Math.cos(q.ang), nx = Math.cos(q.ang), nz = -Math.sin(q.ang); let hit = false;
    for (let s = -1; s <= 1 && !hit; s += 0.25) for (const t of [-1, 0, 1]){ if (inUnit(q.x + ax * s * q.l / 2 + nx * t * q.w / 2, q.z + az * s * q.l / 2 + nz * t * q.w / 2)){ hit = true; break; } }
    if (hit) out.splice(i, 1);
  }
  for (const pt of PORTS){
    if (pt.pier || QUAYS[pt.id]) continue;
    const px = pt.p.x * 1000, pz = pt.p.y * 1000, dx = pt.coast.x * 1000 - px, dz = pt.coast.y * 1000 - pz, L = Math.hypot(dx, dz), ux = dx / L, uz = dz / L, ql = L + 20;
    out.push({x:px + ux * (ql / 2 + 8), z:pz + uz * (ql / 2 + 8), w:9, l:ql, ang:Math.atan2(ux, uz), bw:false, closed:false, made:true});
  }
  return out;
})();
// ===== the NPC boats' berths at the quays of the map data (part 4 of the coast-wide plan; the user's wish 03.10.2026: the quays made
// from the map data are where the NPC boats lie, and a quay's size decides how big a boat can come in) =====
// The faces are the coast's packs' (01c-vec.js quays, Senja's too). A face takes a boat when 90 % of its length is her length and 2 m,
// and the water off it is her draught and half a metre; where the 50 m depth does not know the water off a face it counts as 3 m (a
// guess). The faces by a harbour point (where the player lies) and at a harbour unit are left to the player. A harbour's boats are
// given their places together, in their order, the nearest face that has room first, so a boat keeps her place while the same tiles
// are in; none (null) where no face near has room, and the boat lies as before (berthSlot).
const QUAY_DEPTH_UNKNOWN = 3;
const quayFit = (f, L, T) => f.hl * 2 * 0.9 >= L + 2 && (f.depth == null ? QUAY_DEPTH_UNKNOWN : f.depth) >= T + 0.5;
// ===== L1 (01.11.2026; Jonas: «Båtene skal benytte seg av de ekte kaiene vi har laget modeller av og som vi har plassert rundt om i
// verden», «Det er urealistisk at en stor sjark bare fortøyes rett i fjæra»): a boat lies only at a quay that stands in the 3D world =====
// quayReal(f): kind 0 (the edge of a pier mapped as an area: slabInto draws it), kind 2 (a quay line: pierBoxes gives it a 6 m deck
// and pierInto draws it), or kind 3 (straight coast) where a big industrial building (type 8 of 300 m² or more, as tools/map/vectors.py
// counts a fish plant) stands within 30 m of the face: there the chart shows a quay that is mapped as the coastline alone, and the game
// sets its own quay along the berth (f.mod: kai_betong, or kai_tre for a boat under 15 m, drawDocks). Kind 1 (a pier mapped as a
// line, the pontoons of a marina) and the open shore never: a boat that no such face takes is not shown in port (05-vessels.js).
const QUAY_BIG = 300;
function quayReal(f){
  if (f.real !== undefined) return f.real;
  if (f.kind === 0 || f.kind === 2) return f.real = true;
  f.real = false; if (f.kind !== 3 || !MAPD.man) return false;
  const T = MAPD.man.tile * 1000, t = vecTile(Math.floor(f.x / T), Math.floor(f.z / T)), B = t && t.bld; if (!B) return false;
  const R = f.hl + 130, x0 = Math.floor((f.x - R) / 1000), x1 = Math.floor((f.x + R) / 1000), z0 = Math.floor((f.z - R) / 1000), z1 = Math.floor((f.z + R) / 1000);
  for (let ix = x0; ix <= x1; ix++) for (let iz = z0; iz <= z1; iz++){ const c = B.cells.get(gridKey(ix, iz)); if (!c) continue;
    for (const i of c){ if (B.t[i] !== 8 || B.l[i] * B.w[i] < QUAY_BIG) continue;
      const dx = B.x[i] - f.x, dz = B.z[i] - f.z, a = clamp(dx * f.ux + dz * f.uz, -f.hl, f.hl), d = Math.hypot(dx - f.ux * a, dz - f.uz * a);
      if (d <= 30 + Math.hypot(B.l[i], B.w[i]) / 2){ f.mod = true; return f.real = true; } } }
  return false;
}
// the parts of a face the harbour's boats keep off, as intervals along it (m from its middle): within 35 m of a harbour point (where
// the player lies), and a harbour unit's block with its fill, its basin and its landing and bunker berths. The rest of a plant's, a
// yard's or a shop's quay is for the harbour's boats too (Jonas 01.11.2026, choice 3), as at a real fish plant.
function faceReserved(f){
  if (f.res !== undefined) return f.res;
  const blocked = (x, z) => {
    for (const pt of PORTS){ const px = pt.p.x * 1000, pz = pt.p.y * 1000; if (Math.abs(px - x) < 35 && Math.abs(pz - z) < 35 && Math.hypot(px - x, pz - z) < 35) return true; }
    for (const U of UNITA){ if (Math.abs(U.o[0] - x) > 220 || Math.abs(U.o[1] - z) > 220) continue; const [lx, lz] = unitL(U, x, z), g = ugeo(U);
      if (Math.abs(lx) <= g.basinX + 4 && lz >= -g.B - 4 && lz <= g.basinZ + 4) return true;
      for (const k in g.berth){ const b = g.berth[k]; if (Math.abs(lx - b[0]) <= b[1] / 2 + 3 && lz >= -4 && lz <= 30) return true; } }
    return false; };
  const out = []; let cur = null;
  for (let a = -f.hl; a <= f.hl + 1e-6; a += 2){ if (blocked(f.x + f.ux * a, f.z + f.uz * a)){ if (cur) cur[1] = a + 1; else cur = [a - 1, a + 1]; } else if (cur){ out.push(cur); cur = null; } }
  if (cur) out.push(cur);
  return f.res = out;
}
// a face with any part left for the harbour's boats (the reserved parts are kept off within it: npcBerths, moorHarbour, havnBerths)
function quayFree(f){ if (f.free !== undefined) return f.free; const r = faceReserved(f); return f.free = !(r.length === 1 && r[0][0] <= -f.hl + 1 && r[0][1] >= f.hl - 1); }
const resHit = (res, a, half) => res.some(([r0, r1]) => a + half > r0 && a - half < r1);
// the berth's face as the 3D view and the boat's state carry it: the point on the face by her middle, its directions, kind and whether
// the game sets a quay there (mod)
// out: how far out from the face the quay's front stands where she lies (quayOut; the 3D view builds the quay out to there, drawDocks)
const faceAt = (f, a, L, out) => ({id:f.id, x:f.x + f.ux * a, z:f.z + f.uz * a, ux:f.ux, uz:f.uz, nx:f.nx, nz:f.nz, hl:L / 2 + 2, kind:f.kind, mod:!!f.mod, out:Math.max(0, out || 0), depth:f.depth == null ? QUAY_DEPTH_UNKNOWN : f.depth});
// The quay built out over the shore (Jonas 03.11.2026: «NPC båtene langs hele kysten ligger ved utgravd landmasse, ikke ekte modellerte
// kaier som glir sømløst inn i miljøet»). The 3D shore (view3d terrRaw, COAST3) stands 2 m over the sea at the fine coast line and falls
// 1 in 3 (1 in 1.5 at a breakwater), and a face of the packs lies on that line or near it, so a boat laid at the face sat on the bank and
// the ground was dug out under her in a pit with walls over the water (npcPits). Now the bank is left as it is: quayOut gives how far
// out from the face (m) the quay's front must stand for the bank to be QOUT.clear under the sea along her whole side, she lies there,
// and the 3D view draws a concrete quay (or a timber pier) from the shore out to her (drawDocks quayMod). -1: more than QOUT.max out;
// NaN: the fine coast is not in there yet (taken as 0 where the berth is fixed again when it comes). The players' berths the same
// (Jonas 03.11.2026: «Jeg vil ikke ha noe graving i landmasse for hverken npcer eller brukere»): berthPose, havnBerths.
const QOUT = {top:2.0, g:3, gMole:1.5, clear:0.6, max:16};
function quayOut(f, a, L){
  if (typeof coastSdIf !== 'function') return 0;
  let g = 0, seen = false;
  for (let it = 0; it < 6; it++){
    let need = 0;
    for (const fa of [-0.5, -0.25, 0, 0.25, 0.5]){
      const s = a + fa * (L + 2), x = f.x + f.ux * s + f.nx * (g + 0.4), z = f.z + f.uz * s + f.nz * (g + 0.4);
      const sd = coastSdIf({x:x / 1000, y:z / 1000}, 30); if (sd !== sd) continue; seen = true;
      need = Math.max(need, sd + (QOUT.top + QOUT.clear) * (COAST.mole ? QOUT.gMole : QOUT.g));
    }
    if (!seen) return NaN;   // the fine coast is not in here yet
    if (need <= 0.05) return g;
    g += need + 0.2; if (g > QOUT.max) return -1;
  }
  return g;
}
const NPCB = new Map();
// boats [{key, L, B, T}] of a harbour (group) round p (km), within R km: {key: {p (km), hd, face}} for those that got a place at a face
// that stands in 3D (quayReal), off its reserved parts (faceReserved), the hull clear of land (15 points with a metre and half a
// metre to spare, as moorFree for the coast's boats, 4.16b)
function hullDry(p, hd, L, B){
  const s = Math.sin(hd), c = Math.cos(hd), hl = L / 2 + 1, hb = B / 2 + 0.5;
  for (const fa of [-1, -0.5, 0, 0.5, 1]) for (const ab of [-1, 0, 1]) if (isLand({x:p.x + (s * fa * hl + c * ab * hb) / 1000, y:p.y + (-c * fa * hl + s * ab * hb) / 1000})) return false;
  return true;
}
function npcBerths(group, p, boats, R = 0.6){
  // (again when new packs or coast indexes come: the hulls are held off land by the fine coast where it is in)
  const ver = VEC.ver * 1000 + COAST.built, c = NPCB.get(group); if (c && c.ver === ver) return c.v;
  const x = p.x * 1000, z = p.y * 1000, Rm = R * 1000, faces = [];
  for (const t of vecTilesIn(x - Rm, z - Rm, x + Rm, z + Rm)) for (const f of t.quays){
    const a = clamp((x - f.x) * f.ux + (z - f.z) * f.uz, -f.hl, f.hl), d = Math.hypot(f.x + f.ux * a - x, f.z + f.uz * a - z);
    if (d <= Rm && quayReal(f) && quayFree(f)) faces.push([d, f]);
  }
  faces.sort((a, b) => a[0] - b[0] || (a[1].id < b[1].id ? -1 : 1));
  const used = new Map(), v = {};
  for (const b of boats){
    for (const [, f] of faces){
      if (!quayFit(f, b.L, b.T)) continue;
      const u = used.get(f.id) || faceReserved(f).slice(), lim = f.hl - b.L / 2 - 1; let at = null;
      for (let s = 0; s <= lim * 2 && at === null; s += 2) for (const a of s ? [s / 2, -s / 2] : [0]){ if (Math.abs(a) > lim || resHit(u, a, b.L / 2 + 1)) continue; at = a; break; }
      if (at === null) continue;
      // off the face by her half beam and 0.4 m and as far as the quay must be built out over the shore (quayOut), or up to 8 m further
      // out where the face and the fine coast disagree; else the next face
      let g0 = quayOut(f, at, b.L); if (g0 < 0) continue; if (!(g0 >= 0)) g0 = 0;
      const hd0 = Math.atan2(f.ux, -f.uz); let q = null, gq = 0;
      for (let k = 0; k <= 8 && !q; k += 2){ const off = b.B / 2 + 0.4 + g0 + k, cp = {x:(f.x + f.ux * at + f.nx * off) / 1000, y:(f.z + f.uz * at + f.nz * off) / 1000}; if (hullDry(cp, hd0, b.L, b.B)){ q = cp; gq = g0 + k; } }
      if (!q) continue;
      u.push([at - b.L / 2 - 1, at + b.L / 2 + 1]); used.set(f.id, u);
      const flip = hash(hashStr(b.key)) < 0.5;
      v[b.key] = {p:q, hd:hd0 + (flip ? Math.PI : 0), face:faceAt(f, at, b.L, gq)};
      break;
    }
  }
  if (NPCB.size > 2000) NPCB.clear();   // (the ocean fleet's visitors make a group per set of ships at a plant, 05d-hav.js havBerth)
  NPCB.set(group, {ver, v}); return v;
}
// The way in: waypoints from open water to the harbour point, outermost first. Found through the water cells of the chart (no
// cutting across the corner of a land cell), keeping off the shore where there is room (04.11.2026), then straightened wherever the
// line is clear and no nearer the shore. A harbour behind a breakwater, like Husøy, needs more than one.
const APPROACH = {};
// how the way in keeps off the shore (approachPath): the cost of a step rises inside R km of the coast, up to 1 + K times at the line;
// a straightened leg keeps up to `keep` km off it, as the cells did; within `near` km of the harbour point the boat lies at the quay;
// a step over a sliver of land costs `cut` cells more
const APPR = {R:0.04, K:6, keep:0.025, near:0.06, cut:20};
// the distance to the coast (the chart's fine coast, 01d-coast.js) up to APPR.R, in km; APPR.R where no coast is indexed
function apprClr(q){ const d = coastDistM(q, APPR.R * 1000); return d < 0 ? APPR.R : d / 1000; }
function clearLine(a, b){ const n = Math.max(1, Math.ceil(dist(a, b) / 0.008)); for (let i = 1; i < n; i++) if (isLand({x:a.x + (b.x - a.x) * i / n, y:a.y + (b.y - a.y) * i / n})) return false; return !coastSegHit(a, b); }
// the land a sealed harbour's way out may cross (approachPath's pt.free): within pt.free km of its point
let QUAYF = null;
function quayLand(q){ if (!QUAYF) QUAYF = PORTS.filter(p => p.free); for (const p of QUAYF) if (dist(q, p.p) < p.free) return true; return false; }
function quayLandLine(a, b){ const n = Math.max(1, Math.ceil(dist(a, b) / 0.008)); for (let i = 1; i < n; i++){ const q = {x:a.x + (b.x - a.x) * i / n, y:a.y + (b.y - a.y) * i / n}; if (isLand(q) && !quayLand(q)) return false; } return true; }
function approachPath(pt){
  if (APPROACH[pt.id]) return APPROACH[pt.id];
  // over the mask's cells (k = y * nx + x, counted from the layer's corner), a cell land where isLand has its middle (the fine coast)
  const M = MAPD.L.mask, c = M.c, nx = M.nx, cell = k => { const x = k % nx; return {x:(M.ix0 + x + 0.5) * c, y:(M.iy0 + (k - x) / nx + 0.5) * c}; }, s0 = (Math.floor(pt.p.y / c) - M.iy0) * nx + Math.floor(pt.p.x / c) - M.ix0;
  // a harbour sealed in by its own quay and fill (6 of 359 along the coast, 08.10.2026: Ålesund, Fosnavåg, Laukvik, Vengsøy and
  // two shops; their boats could not get out at all): the land within free km of the harbour point is passable, 80 m, then 150, 250 and 400 m
  // (pt.free, quayLand: the routes may cross it; the simulation leaves the harbours to their way in anyway, groundCheck)
  // The way keeps off the shore where the water lets it (Jonas 04.11.2026, Tufjord: the way in ran along the beach 1 m from the line,
  // and in 3D the boat sailed on the foreshore): a shortest-path search where a step costs more the nearer its cell lies to the coast
  // (APPR.K, inside APPR.R), so the way goes down the middle of a basin or a sound, and hugs the shore only where the water is that
  // narrow. The same cells are open as before (land, the cut corners, the breakwaters), so every harbour that had a way in has one.
  // (not within APPR.near of the harbour point, where she goes alongside: there the way goes straight to it, and did not go round the
  // quay to come at it from its open side, Leknes verft)
  const pen = new Map(), cost = k => { let v = pen.get(k); if (v === undefined){ const q = cell(k), d = dist(q, pt.p) < APPR.near ? APPR.R : apprClr(q), u = Math.max(0, 1 - d / APPR.R); v = 1 + APPR.K * u * u; pen.set(k, v); } return v; };
  // a step between two wet cells' middles over a sliver of the fine coast's land costs APPR.cut more (kept where there is no other way,
  // as before; the straightening keeps such a step as it is); only asked by the shore, where the step's cell is within APPR.R of it)
  const sliver = (a, b) => { for (let i = 1; i < 6; i++) if (isLand({x:a.x + (b.x - a.x) * i / 6, y:a.y + (b.y - a.y) * i / 6})) return APPR.cut; return 0; };
  let prev, end = -1;
  for (const free of [0, 0.08, 0.15, 0.25, 0.4]){
    const LM = new Map(), mk = (x, y) => { const k = y * nx + x; let v = LM.get(k); if (v === undefined){ const q = cell(k); v = isLand(q) && !(free && dist(q, pt.p) < free); LM.set(k, v); } return v; };
    prev = new Map([[s0, -1]]); const G = new Map([[s0, 0]]), done = new Set(), H = leiaHeap(); H.push(s0, 0);
    for (let h = 0; H.size() && h < 300000;){
      const k = H.pop(); if (done.has(k)) continue; done.add(k); h++;
      const x = k % nx, y = (k - x) / nx, p = cell(k), g = G.get(k);
      if (dist(p, pt.p) > 0.4 && coastDist(p) > 0.25){ end = k; break; }
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]){
        const X = x + dx, Y = y + dy, kk = Y * nx + X; if (X < 0 || Y < 0 || X >= nx || Y >= M.ny || done.has(kk) || mk(X, Y)) continue;
        if (dx && dy && (mk(X, y) || mk(x, Y))) continue;
        if (!(free && dist(p, pt.p) < free) && coastSegHit(p, cell(kk))) continue;   // a breakwater thinner than a cell between them
        const ck = cost(kk), q = cell(kk), ng = g + (dx && dy ? Math.SQRT2 : 1) * ck + (ck > 1 || dist(q, pt.p) < APPR.near ? sliver(p, q) : 0), og = G.get(kk);
        if (og === undefined || ng < og){ G.set(kk, ng); prev.set(kk, k); H.push(kk, ng); }
      }
    }
    if (end >= 0){ if (free){ pt.free = free; QUAYF = null; } break; }
  }
  if (end < 0) return APPROACH[pt.id] = [];
  const cells = []; for (let k = end; k !== -1; k = prev.get(k)) cells.push(cell(k));
  cells[cells.length - 1] = pt.p;
  const path = [cells[0]];
  // (land every 2 m as the route check: clearLine's 8 m let thin islets through, and the way in then failed the mend, 08.10.2026; the
  // 8 m check first, as it turns most lines down cheaply)
  const fine = (a, b, quay) => { const n = Math.max(1, Math.ceil(dist(a, b) / 0.002)); for (let i = 1; i < n; i++){ const q = {x:a.x + (b.x - a.x) * i / n, y:a.y + (b.y - a.y) * i / n}; if (isLand(q) && !(quay && quayLand(q))) return false; } return !coastSegHit(a, b); };
  const clear = (a, b) => pt.free ? (clearLine(a, b) ? fine(a, b, false) || fine(a, b, true) : quayLandLine(a, b) && fine(a, b, true)) : clearLine(a, b) && fine(a, b, false);
  // and no nearer the coast than the cells it replaces (up to APPR.keep; 4 m for the line between the cells' middles), outside
  // APPR.near of the harbour point and the land a sealed harbour may cross: a straight leg along a beach is what the search kept off
  const exempt = q => dist(q, pt.p) < Math.max(APPR.near, pt.free || 0), dk = cells.map(q => exempt(q) ? Infinity : apprClr(q));
  const off = (i, j) => { let need = APPR.keep; for (let k = i; k <= j; k++) if (dk[k] < need) need = dk[k]; need -= 0.004; if (need <= 0) return true;
    const a = cells[i], b = cells[j], n = Math.max(1, Math.ceil(dist(a, b) / 0.004)); for (let k = 1; k < n; k++){ const q = {x:a.x + (b.x - a.x) * k / n, y:a.y + (b.y - a.y) * k / n}; if (!exempt(q) && apprClr(q) < need) return false; } return true; };
  for (let i = 0; i < cells.length - 1;){ let j = cells.length - 1; while (j > i + 1 && !(clear(cells[i], cells[j]) && off(i, j))) j--; if (j === cells.length - 1) break; path.push(cells[j]); i = j; }
  APPROACH[pt.id] = path.map(q => ({x:Math.round(q.x * 1000) / 1000, y:Math.round(q.y * 1000) / 1000}));
  pt.app = APPROACH[pt.id][0]; PCELL = null;   // the harbour's safe zone reaches out to the start of the way in (inHarbour)
  return APPROACH[pt.id];
}
// the waypoints a route needs to get out of harbour towards `to`, and in to a harbour from `from` (the part of the way in that it
// cannot see past)
// cannot see past). A point is only added when the way from it is clear: when no point on the way sees the target, none is added,
// and the leg the player drew is the one marked as crossing land (A12). The harbour point itself is never a waypoint.
function exitWps(pt, to){ if (clearLine(pt.p, to)) return []; const out = []; for (const q of approachPath(pt).slice().reverse()){ if (dist(q, pt.p) < 0.002) continue; out.push(q); if (clearLine(q, to)) return out; } return []; }
function entryWps(pt, from){ if (clearLine(from, pt.p)) return []; const a = approachPath(pt); for (let i = a.length - 1; i >= 0; i--) if (dist(a[i], pt.p) >= 0.002 && clearLine(from, a[i])) return a.slice(i).filter(q => dist(q, pt.p) >= 0.002); return []; }
// beam (m) of the player's vessels, for lying alongside
// beam by vessel type, for the berths and the 3D view (the ocean vessels get their berths at the ocean step)
const BEAM = Object.fromEntries(Object.entries(VESSELS).map(([k, V]) => [k, V.beam]));   // the ocean vessels too (08.10.2026): the yard's lift takes the biggest, and she lies a beam out from the quay
const CAST_MIN = 1;   // game minutes to take the lines in before the boat moves (quicker, tilbakemelding #22)
// Where a vessel lies in a harbour: alongside the quay in QUAYS (kind 'main' or 'bunker'), or else the quay face nearest the harbour's
// berth point; parallel to it with the quay to starboard (where the skipper stands), off the face by half the beam and the fenders.
// Returned in km like the rest of the chart, with the face (metres) for the bollards and fenders. null when there is no quay near:
// the boat then lies as before.
const BERTHPOSE = {};
function berthPose(pid, type, kind = 'main'){
  const key = pid + '|' + type + '|' + kind + (kind === 'naust' && S.naust && S.naust.o ? '|' + S.naust.o.join(',') : '') + (RBID.has(pid) && RBID.get(pid).site ? '|' + RBID.get(pid).site.o.join(',') : ''); if (key in BERTHPOSE) return BERTHPOSE[key];
  const pt = portById(pid), px = pt.p.x * 1000, pz = pt.p.y * 1000, Lb = VESSELS[type].len, Bb = BEAM[type] || 3, qf = quayFace(pid, kind);
  if ((kind === 'naust' || RBID.has(pid) || isBerth(pid)) && !qf) return null;   // not cached: the naust and a rorbu are found once their map is in
  let best = null, nocache = false;
  // (out: the quay built out over the 3D shore to her, quayOut; a harbour unit is its own quay with its basin. A face that does not
  // carry it, the naust's, a rorbu's, a berth held before 03.11.2026, gets it here, and is not kept until the coast is in)
  let qo = 0; if (qf && !qf.unit){ qo = qf.out; if (qo === undefined){ qo = quayOut(qf, 0, Lb); if (qo !== qo){ qo = 0; nocache = true; } else if (qo < 0) qo = QOUT.max; } }
  if (qf) best = {d:0, cx:qf.x + qf.nx * (Bb / 2 + 0.4 + qo), cz:qf.z + qf.nz * (Bb / 2 + 0.4 + qo), fx:qf.x, fz:qf.z, ux:qf.ux, uz:qf.uz, Nx:qf.nx, Nz:qf.nz, hl:qf.hl, a:0, depth:qf.depth, unit:qf.unit, out:qo, kind:qf.kind, tre:!!(qf.naust || qf.rorbu)};
  else if (kind !== 'main'){ BERTHPOSE[key] = null; return null; }
  if (!qf) for (const q of PIERBOX){
    if (q.bw || Math.hypot(q.x - px, q.z - pz) > (q.l + q.w) / 2 + 150) continue;
    const ax = Math.sin(q.ang), az = Math.cos(q.ang), nx = Math.cos(q.ang), nz = -Math.sin(q.ang);
    const faces = [[nx, nz, q.w / 2, ax, az, q.l / 2], [-nx, -nz, q.w / 2, ax, az, q.l / 2]];
    if (q.closed) faces.push([ax, az, q.l / 2, nx, nz, q.w / 2], [-ax, -az, q.l / 2, nx, nz, q.w / 2]);
    for (const [Nx, Nz, off, ux, uz, hl] of faces){
      const fx = q.x + Nx * off, fz = q.z + Nz * off, rx = px - fx, rz = pz - fz, along = rx * ux + rz * uz, out = rx * Nx + rz * Nz;
      if ((out < -1 && Math.abs(along) < hl) || hl * 2 < Lb + 2) continue;   // inside the quay, or a face too short to lie at
      const room = Math.max(0, hl - Lb / 2 - 1), a = clamp(along, -room, room), d = Math.hypot(along - a, out);
      const cx = fx + ux * a + Nx * (Bb / 2 + 0.4), cz = fz + uz * a + Nz * (Bb / 2 + 0.4);
      const ends = [[cx, cz], [cx + ux * Lb / 2, cz + uz * Lb / 2], [cx - ux * Lb / 2, cz - uz * Lb / 2]];
      if (ends.some(([x, z]) => isLand({x:x / 1000, y:z / 1000}))) continue;
      if (!best || d < best.d) best = {d, cx, cz, fx, fz, ux, uz, Nx, Nz, hl, a, depth:off * 2};
    }
  }
  if (!best || best.d > 150){ BERTHPOSE[key] = null; return null; }
  // starboard of a boat heading hd is (cos hd, sin hd); the quay must be on that side
  let hd = Math.atan2(best.ux, -best.uz); if (Math.cos(hd) * -best.Nx + Math.sin(hd) * -best.Nz < 0) hd += Math.PI;
  const f = {x:Math.sin(hd), z:-Math.cos(hd)};
  const R = {x:best.cx / 1000, y:best.cz / 1000, hd, fwd:f, face:{x:best.fx, z:best.fz, ux:best.ux, uz:best.uz, nx:best.Nx, nz:best.Nz, hl:best.hl, depth:best.depth, unit:best.unit || null, out:best.out || 0, kind:best.kind, tre:!!best.tre}, a:best.a, Lb, Bb};
  return nocache ? R : (BERTHPOSE[key] = R);
}
// ---- the way in to a berth and out of it (the user's list 04.10.2026: «legge til og fra kai uten å gå gjennom landmasse og
// bygninger»). A point is blocked when it is land on the 25 m mask, or within half the beam of a pier's box (PIERBOX) or of a harbour
// unit's quay block. The way: from where the boat is to a point one and a half boat lengths astern of the berth and a beam out from the
// quay, then along the quay to the berth; straight where that is clear, else a short search over the mask's cells (1.5 km round),
// straightened. In km; the 3D view sails it in and, backwards, out (view3d.js moorStep)
function berthBlocked(p, m = 2){
  if (isLand(p)) return true;
  const x = p.x * 1000, z = p.y * 1000;
  for (const q of PIERBOX){ if (Math.abs(q.x - x) > q.l + q.w + 30 || Math.abs(q.z - z) > q.l + q.w + 30) continue;
    const ax = Math.sin(q.ang), az = Math.cos(q.ang), nx = Math.cos(q.ang), nz = -Math.sin(q.ang), dx = x - q.x, dz = z - q.z;
    if (Math.abs(dx * ax + dz * az) <= q.l / 2 + m && Math.abs(dx * nx + dz * nz) <= q.w / 2 + m) return true; }
  for (const U of UNITA){ const [lx, lz] = unitL(U, x, z); const g = ugeo(U); if (Math.abs(lx) <= g.E + m && lz <= m && lz >= -g.B) return true; }
  return false;
}
function berthClear(a, b, m){ const n = Math.max(1, Math.ceil(dist(a, b) / 0.004)); for (let i = 1; i < n; i++) if (berthBlocked({x:a.x + (b.x - a.x) * i / n, y:a.y + (b.y - a.y) * i / n}, m)) return false; return !coastSegHit(a, b); }
function berthPath(from, bp){
  const L = (bp.Lb || 10) / 1000, B = (bp.Bb || 3) / 1000, m = (bp.Bb || 3) / 2, F = bp.face, P1 = {x:bp.x, y:bp.y}, fw = bp.fwd;
  // the point to come in from: astern of the berth and out from the quay; if that is blocked, straight out from the quay
  let PL = {x:P1.x - fw.x * 1.5 * L + F.nx * B, y:P1.y - fw.z * 1.5 * L + F.nz * B};
  if (berthBlocked(PL, m) || !berthClear(PL, P1, 0.5)) PL = {x:P1.x + F.nx * 3 * B, y:P1.y + F.nz * 3 * B};
  if (berthClear(from, PL, m)) return [from, PL, P1];
  // a search over the mask's cells round the way, then the line pulled tight
  const M = MAPD.L.mask, c = M.c, key = (i, j) => i + ',' + j, ci = q => [Math.floor(q.x / c), Math.floor(q.y / c)], ctr = (i, j) => ({x:(i + 0.5) * c, y:(j + 0.5) * c});
  const [i0, j0] = ci(from), [i1, j1] = ci(PL), R = Math.ceil(1.5 / c), prev = new Map([[key(i0, j0), null]]), Q = [[i0, j0]]; let found = false;
  for (let h = 0; h < Q.length && h < 40000; h++){
    const [i, j] = Q[h]; if (Math.abs(i - i1) <= 1 && Math.abs(j - j1) <= 1){ prev.set('end', key(i, j)); found = true; break; }
    for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]){
      const I = i + di, J = j + dj, k = key(I, J); if (prev.has(k) || Math.abs(I - i0) > R || Math.abs(J - j0) > R) continue;
      if (berthBlocked(ctr(I, J), m) || coastSegHit(ctr(i, j), ctr(I, J))){ prev.set(k, undefined); continue; }
      prev.set(k, key(i, j)); Q.push([I, J]);
    }
  }
  if (!found) return [from, PL, P1];   // nothing better to offer: as before
  const cells = []; for (let k = prev.get('end'); k; k = prev.get(k)){ const [i, j] = k.split(',').map(Number); cells.push(ctr(i, j)); }
  cells.reverse(); cells[0] = from; cells.push(PL);
  const out = [cells[0]];
  for (let i = 0; i < cells.length - 1;){ let j = cells.length - 1; while (j > i + 1 && !berthClear(cells[i], cells[j], m)) j--; out.push(cells[j]); i = j; }
  out.push(P1); return out;
}

// ===== landing the catch =====
// The catch goes up with the quay crane in white tubs of TUB_KG (core/07f-kar.js; before 04.11.2026 the open boats landed in boxes of
// 40 kg on pallets and the sjarks in tubs of 300 kg): an open boat's own tubs from where they stand on deck, one a lift, and her empty
// tubs back washed after (K3), one a lift to its own place (a stack of empties in one sling would have the straps through the upper
// tubs); a boat with a hold fills the plant's tubs from the hold, one a lift. The forklift takes two at
// a time into the plant, and the landing note comes when the catch is weighed in.
// Game minutes; the 3D view plays the same timeline, so what you see is what the clock says. The times are guesses, to be tuned.
// prep: the crane swings straight over to the boat for the first load (Jonas 07.10.2026, tilbakemelding #22: no rigging first)
// wash: an open boat's full tubs go in with the forklift, are emptied and washed, and come out again on it before the crane takes them
// back aboard (game minutes between the last full lift and the first back)
const LANDING = {prep:1, lift:2.5, note:5, tubKg:TUB_KG, hooked:0.86, wash:6};
// A freezer vessel lands her frozen catch on pallets (H2b, V1 A of docs/planer/havsteget-h2-autoline.md, 05.11.2026): the landing gang
// stacks the cartons on pallets of about a tonne down in the hold, and the crane lifts them ashore one a lift. About 10 t an hour with
// the gang and the crane (FAO, «Handling sea-frozen fish»: 1-1.5 t a man-hour with mechanical gear and a practised crew, a gang of 8),
// so a lift every 6 game minutes and 300 t in about 30 hours. The pallets carry the product weight (05-vessels.js holdLoad). The coast
// boats and the tubs are as before.
const PALL = {kg:1000, lift:6};
const liftMin = L => L.lf || LANDING.lift;
// the product weight of a lot at the landing: frozen as it lies (prodKg), or as it will be once gutted (as the deck guts) and frozen at the quay
const landProd = x => x.frozen || (SPECIES[x.sp] || {}).live ? prodKg(x) : x.kg / ((x.gut || catchGut()) ? (SPECIES[x.sp] || {}).uh || 1 : 1);
// at the weighing: what was still unfrozen aboard a freezer vessel is frozen now, gutted as the deck guts it (landPlan gave the time)
function landFreeze(){
  if (!holdFreezes()) return 0; let kg = 0;
  for (const x of S.hold.slice()) if (!x.frozen && !(SPECIES[x.sp] || {}).live){ kg += x.kg; moveKg(x, x.kg, {gut:!!(x.gut || catchGut()), iced:true, frozen:true}); }
  return kg;
}
// own: the boat's own tubs (an open boat; the per-tub kilos in kgs, the empties come back), else the plant's tubs from the hold
function landPlan(type, kg, hold){
  const V = VESSELS[type] || {};
  // (what still lies unfrozen is frozen at the quay before the weighing, Jonas 05.11.2026: «Fryses ved kaia»: its product weight goes on
  // the pallets, and the freezers' time for it comes before the landing note when it is longer than the lifts after it: landFreeze)
  if (V.hold && V.hold.kind === 'frys'){ const H0 = hold || S.hold, pk = H0.reduce((a, x) => a + landProd(x), 0), n = Math.max(1, Math.ceil(pk / PALL.kg));
    const fz = Math.ceil(H0.reduce((a, x) => a + (x.frozen || (SPECIES[x.sp] || {}).live ? 0 : landProd(x)), 0) / Math.max(1, (V.freezeT || 15000) / 1440)), lifts = n * PALL.lift;
    return {kind:'pall', own:false, n, lifts:n, wash:0, lf:PALL.lift, pk:Math.round(pk), fz, dur:LANDING.prep + Math.max(lifts, fz) + LANDING.note}; }
  if (V.kar){ const nk = karN(type, S.boat && S.boat.type === type ? S.boat.holdLv : 0), T = tubLoads(hold || S.hold, nk), kgs = T.map(t => Math.round(t.kg)), n = clamp(Math.max(tubsFull(T), Math.ceil((kg || 0) / TUB_KG)), 1, nk);
    return {kind:'tub', own:true, n, kgs, lifts:2 * n, wash:LANDING.wash, dur:LANDING.prep + 2 * n * LANDING.lift + LANDING.wash + LANDING.note}; }
  const n = Math.max(1, Math.ceil(kg / LANDING.tubKg));
  return {kind:'tub', own:false, n, lifts:n, wash:0, dur:LANDING.prep + n * LANDING.lift + LANDING.note};
}
// when lift j of a landing starts (game minutes after L.t0): the lifts follow each other, the tubs back after the wash
const landLiftT = (L, j) => LANDING.prep + j * liftMin(L) + (L.own && j >= L.n ? (L.wash || 0) : 0);
// how far a landing has come at game minute t: loads up on the quay, units (boxes or tubs) landed, and the phase
function landState(L, t){
  const e = t - L.t0, lf = liftMin(L); let up = 0; for (let j = 0; j < L.lifts; j++) if (e >= landLiftT(L, j) + LANDING.hooked * lf) up = j + 1;
  const units = Math.min(L.n, L.kind === 'box' ? up * 9 : up);   // ('box': a landing saved before 04.11.2026, nine boxes a lift)
  return {e, up, units, phase:e < LANDING.prep ? 'prep' : e < landLiftT(L, L.lifts - 1) + lf ? 'lift' : 'note'};
}
// The plants' opening hours (the user's list 04.10.2026). The plants publish none (looked up 04.10.2026: the plant in Senjahopen gives
// a phone number, Råfisklaget lists the plants without hours), so these are typical ones: weekdays 06-18 and Saturday 08-14, closed
// on Sunday, and every day 05-22 in the skrei season (January to April), when the boats land late. The first trip never waits.
// (no opening hours: the plants take the catch at any hour, Jonas 11.10.2026)
function mottakOpen(H){ return true; }
// the next quarter hour the plants are open (within four days)
function mottakNext(H){ for (let k = 0; k < 4 * 24 * 4; k++){ const h = (Math.ceil(H * 4) + k) / 4; if (mottakOpen(h)) return h; } return H; }
// when it opens, in words: «i dag kl. 06:00», «i morgen kl. 06:00» or the weekday
function mottakWhen(H, no){
  const n = mottakNext(H), a = gDate(H), b = gDate(n), days = Math.round((Date.UTC(b.getUTCFullYear(), b.getUTCMonth(), b.getUTCDate()) - Date.UTC(a.getUTCFullYear(), a.getUTCMonth(), a.getUTCDate())) / 864e5);
  const t = String(b.getUTCHours()).padStart(2, '0') + ':' + String(b.getUTCMinutes()).padStart(2, '0'), wd = b.getUTCDay();
  const day = days <= 0 ? (no ? 'i dag' : 'today') : days === 1 ? (no ? 'i morgen' : 'tomorrow') : (no ? ['søndag', 'mandag', 'tirsdag', 'onsdag', 'torsdag', 'fredag', 'lørdag'] : ['on Sunday', 'on Monday', 'on Tuesday', 'on Wednesday', 'on Thursday', 'on Friday', 'on Saturday'])[wd];
  return day + (no ? ' kl. ' : ' at ') + t;
}
function startLanding(ops){
  const b = S.boat, pt = portById(b.port), kg = holdTotal();
  if (b.status !== 'port' || !pt || !pt.mottak || b.land || b.shift || kg < 0.5 || !mottakOpen(S.t / 60)) return false;
  if (berthKind(b) === 'naust'){ log(NAUST_SAIL[0], NAUST_SAIL[1]); return false; }
  if (berthKind(b) !== 'main') return startShift('main', ops ? 'landops' : 'land');   // the crane is at the plant's quay
  const lp = landPlan(b.type, kg), pall = lp.kind === 'pall', unit = pall ? ['paller', 'pallets'] : ['kar', 'tubs'];
  b.land = {pid:pt.id, t0:S.t, until:S.t + lp.dur, kind:lp.kind, n:lp.n, lifts:lp.lifts, kg:Math.round(kg), ops:!!ops, own:lp.own, kgs:lp.kgs, wash:lp.wash};
  if (pall){ b.land.lf = lp.lf; b.land.pk = lp.pk; }
  // (on pallets the weight is the product's, and the round weight the quota and the price go by beside it)
  const what = pall ? [fmt(lp.pk / 1000, 1) + ' t fryst (' + fmt(kg / 1000, 1) + ' t rund vekt)', fmt(lp.pk / 1000, 1) + ' t frozen (' + fmt(kg / 1000, 1) + ' t round weight)'] : [fmt(kg, 0) + ' kg', fmt(kg, 0) + ' kg'];
  const at = pall ? [mottakWhen(b.land.until / 60, true), mottakWhen(b.land.until / 60, false)] : ['ca. kl. ' + hm(b.land.until / 60), 'at about ' + hm(b.land.until / 60)];   // (a landing of a day or more: the day too)
  log('Losser ' + what[0] + ' i ' + pt.name + ', ' + lp.n + ' ' + unit[0] + '. Sluttseddelen kommer ' + at[0] + '.', 'Landing ' + what[1] + ' at ' + pt.name + ', ' + lp.n + ' ' + unit[1] + '. The landing note comes ' + at[1] + '.');
  return true;
}
// the catch is weighed in: the sale is settled on what is in the hold now, and a standing plan gets its report
function finishLanding(){
  const b = S.boat, L = b.land; b.land = null;
  if (b.status !== 'port' || b.port !== L.pid) return;
  const fz = landFreeze(); if (fz > 0.5) log(fmt(fz, 0) + ' kg som lå ufryst, er fryst ved kaia før innveiingen.', fmt(fz, 0) + ' kg that lay unfrozen was frozen at the quay before the weighing.');
  const c0 = S.cash; sell(); const total = S.cash - c0;
  if (L.ops) opsReport(L.pid, L.kg, total, true);
}
// ice from the silo runs down the chute at about 100 kg a minute; only the 3D view uses this
function iceChute(kg){ const b = S.boat; b.iceUntil = Math.max(b.iceUntil || 0, S.t) + Math.max(1, kg / 100); }

// ===== the bunker quay: moving along the harbour and filling fuel =====
// Where a harbour has its own bunker quay, filling fuel means casting off from the plant's quay, going over and making fast there;
// landing the catch from the bunker quay means going back first. Finnsnes fills where you lie. The boat pumps its own fuel,
// about 45 litres a minute of petrol and 90 of diesel (guesses from small-boat bunker pumps), and pays as it runs.
const SHIFT_MPM = 3 * 1852 / 60;   // metres a minute at 3 knots in the harbour
const PUMP = {petrol:45, diesel:90, hose:1.5, stow:1};   // litres a minute; minutes to get the hose out and the nozzle in, and to stow it
// where she lies: 'main' (the plant's quay), 'bunker' or 'naust' (Father's pile quay in the home harbour; 'main' until it is found)
const berthKind = b => b.berth === 'naust' && !quayFace(b.port, 'naust') ? 'main' : (b.berth || 'main');
// where the boat lies: at Father's naust its berth, not the harbour point the simulation keeps her at (tilbakemelding #20: Autonav
// and the chart plotter started the route at the plant); else her position
function quayPos(b){
  if ((b.status === 'port' || b.status === 'unmooring') && b.port && berthKind(b) === 'naust'){ const bp = berthPose(b.port, b.type || 'skiff', 'naust'); if (bp) return {x:bp.x, y:bp.y}; }
  return b.pos;
}
const NAUST_NOSHOP = ['Naustet er et hjem, ikke en butikk. Seil til mottaket for is og agn, til utstyrsbutikken for utstyr og til verftet for båt og vedlikehold.', 'The boathouse is a home, not a shop. Sail to the plant for ice and bait, to the tackle shop for gear and to the yard for boats and upkeep.'];
const NAUST_SAIL = ['Båten ligger ved naustet. Seil bort til mottakskaia først: trykk på havna i kartplotteren og kast loss.', 'The boat lies at the boathouse. Sail over to the plant\'s quay first: tap the harbour on the chart plotter and cast off.'];
const BERTHN = {main:['mottakskaia', 'the plant\'s quay'], bunker:['bunkerskaia', 'the bunker quay'], naust:['naustet', 'the boathouse']};
const hasBunker = pid => !!quayFace(pid, 'bunker');
// busy at the quay: landing, moving or filling; a departure waits for it
function portBusy(b){ const u = Math.max(b.land ? b.land.until : 0, b.shift ? b.shift.until : 0, b.fueling ? b.fueling.until : 0); return u > 0 || b.after ? Math.max(u, S.t) : 0; }
function startShift(to, after){
  const b = S.boat, pt = portById(b.port), from = berthKind(b);
  // (never to or from Father's naust: you sail there and back by a route, Jonas 05.10.2026: «Fast travel er ikke mulig i spillet, punktum»)
  if (b.status !== 'port' || !pt || b.shift || b.land || b.fueling || from === to || from === 'naust' || to === 'naust' || (to === 'bunker' && !hasBunker(pt.id))) return false;
  const A = berthPose(pt.id, b.type, from), B = berthPose(pt.id, b.type, to); if (!A || !B) return false;
  const move = Math.max(1.5, Math.hypot(A.x - B.x, A.y - B.y) * 1000 * 1.3 / SHIFT_MPM);
  b.shift = {from, to, t0:S.t, castUntil:S.t + CAST_MIN, arriveAt:S.t + CAST_MIN + move, until:S.t + CAST_MIN * 2 + move}; b.after = after || null;
  log('Kaster loss og går ' + (to === 'main' ? 'tilbake ' : 'bort ') + 'til ' + BERTHN[to][0] + '.', 'Casting off for ' + BERTHN[to][1] + '.');
  return true;
}
function startFueling(ops){
  const b = S.boat, pt = portById(b.port);
  if (b.status !== 'port' || !pt || !pt.fuel || b.land || b.fueling || b.shift) return false;
  if (BOAT.fuelCap - b.fuel < 0.5) return false;
  if (hasBunker(pt.id) && berthKind(b) !== 'bunker') return startShift('bunker', ops ? 'fuelops' : 'fuel');
  if (berthKind(b) === 'naust'){ log(NAUST_SAIL[0], NAUST_SAIL[1]); return false; }   // no pump at the naust: sail over first
  const lpm = BOAT.diesel ? PUMP.diesel : PUMP.petrol, l = Math.min(BOAT.fuelCap - b.fuel, Math.max(0, S.cash) / fuelPrice());
  if (l < 0.5){ log('Har ikke penger til drivstoff.', 'No money for fuel.'); return false; }
  b.fueling = {t0:S.t, pumpAt:S.t + PUMP.hose, until:S.t + PUMP.hose + l / lpm + PUMP.stow, liters:l, lpm, done:0, ops:!!ops};
  log('Fyller ' + fmt(l, 0) + ' L ' + (BOAT.diesel ? 'diesel' : 'bensin') + ', ferdig ca. kl. ' + hm(b.fueling.until / 60) + '.', 'Filling ' + fmt(l, 0) + ' L of ' + (BOAT.diesel ? 'diesel' : 'petrol') + ', done at about ' + hm(b.fueling.until / 60) + '.');
  return true;
}
// a minute at the quay: the pump runs, the boat moves along, and what was waiting for it starts
function quayMinute(){
  const b = S.boat, f = b.fueling;
  if (f){
    if (S.t > f.pumpAt && f.done < f.liters){ const l = Math.min(f.lpm, f.liters - f.done), c = l * fuelPrice(); if (c > spendable()){ f.liters = f.done; f.until = S.t + PUMP.stow; } else { fuelAdd(b, Math.min(BOAT.fuelCap, b.fuel + l) - b.fuel, c); f.done += l; f.paid = (f.paid || 0) + c; book('diesel', -c, 'Bunkring', 'Bunkering'); if (f.done >= f.liters - 0.01) f.until = Math.min(f.until, S.t + PUMP.stow); } }
    if (S.t >= f.until){ b.fueling = null; log('Fylte ' + fmt(f.done, 0) + ' L for ' + kr(Math.round(f.paid || 0)) + '.', 'Filled ' + fmt(f.done, 0) + ' L for ' + kr(Math.round(f.paid || 0)) + '.'); }
  }
  const s = b.shift;
  if (s && S.t >= s.until){
    b.shift = null; b.berth = s.to; const pt = portById(b.port), a = b.after; b.after = null;
    log('Fortøyd ved ' + BERTHN[s.to][0] + ' i ' + pt.name + '.', 'Made fast at ' + BERTHN[s.to][1] + ' in ' + pt.name + '.');
    if (a === 'fuel' || a === 'fuelops') startFueling(a === 'fuelops');
    else if (a === 'land' || a === 'landops') startLanding(a === 'landops');
    else if (a === 'ice'){ buyIce(b.iceKg || 50, b.iceFree); b.iceKg = b.iceFree = null; }
  }
}
// ice comes down the plant's chute, so the boat has to lie at the plant's quay
function buyIce(kg, free){
  const b = S.boat, pt = portById(b.port); if (b.status !== 'port' || !pt || !pt.ice) return false;
  if (berthKind(b) !== 'main'){ b.iceKg = kg; b.iceFree = !!free; return startShift('main', 'ice'); }
  kg = Math.round(Math.min(kg, BOAT.iceCap - b.ice)); const c = free ? 0 : Math.round(kg * PRICE.ice); if (kg <= 0 || c > spendable()) return false;
  b.ice += kg; book('is', -c, 'Is fra isrenna', 'Ice from the chute'); iceChute(kg);
  log('Kjøpte ' + kg + ' kg is fra isrenna for ' + kr(c) + '.', 'Bought ' + kg + ' kg of ice from the chute for ' + kr(c) + '.');
  // the first fill is on the plant (Jonas 07.10.2026): a new customer, and they know the old boat
  if (free) msg(FOLK_NAMES.plant[0] + ' på mottaket', 'Så det er du som har tatt over naustet! Faren din var innom her i fjor høst og snakket om deg. Første fylling is er på huset: vi kjenner igjen den gamle båten.', 'So you’re the one who has taken over the boathouse! Your father dropped in last autumn and talked about you. The first fill of ice is on the house: we know the old boat.');
  return true;
}
// ---------- the tackle shop on the quay, in every harbour: hand jig, ice and halibut gear ----------
// Where there is no plant (Finnsnes) the shop sells bagged ice and carries it aboard; elsewhere the ice comes down the plant's chute.
// PRICE.iceBag is our assumption: dearer than chute ice, not checked against a price list.
const shopIceKr = () => { const pt = portById(S.boat.port); return pt && pt.ice && berthKind(S.boat) !== 'naust' ? PRICE.ice : PRICE.iceBag * folkIce(); };
const shopIceRoom = () => Math.max(0, Math.round(BOAT.iceCap - S.boat.ice));
// buys one thing; returns null, or why not as [no, en]. free: the first-trip tutorial hands it out
function shopBuy(k, kg, free){
  const b = S.boat, pt = portById(b.port), pay = (c, k, no, en, felles) => { book(k, -c, no, en); if (felles) tripAdd(b, 'jigKr', c); };
  if (b.status !== 'port' || !pt) return ['Butikken er på land. Handle når båten ligger i havn.', 'The shop is ashore. Buy when the boat is in port.'];
  if (pt.rorbu) return ['Det er ingen butikk ved rorbua. Handle i en havn.', 'There is no shop at the rorbu. Buy in a harbour.'];   // 07d-rorbu.js
  if (berthKind(b) === 'naust') return NAUST_NOSHOP;   // Father's naust is a home: nothing is sold there (Jonas 07.10.2026)
  if (k === 'jig' || k === 'kgear'){
    if (!portServices(pt, berthKind(b)).butikk) return ['Fiskeutstyr kjøper du i utstyrsbutikken.', 'You buy fishing gear at the tackle shop.'];
    const have = k === 'jig' ? b.gear : b.kgear, c = free ? 0 : Math.round((k === 'jig' ? PRICE.gear : PRICE.kgear) * (naustHas('benk') && atHome(b) ? 0.75 : 1));   // Father's workbench (07c-naust.js)
    if (have) return ['Det har du allerede om bord.', 'You already have that aboard.'];
    if (c > spendable()) return ['Du har ikke nok penger.', 'Not enough money.'];
    if (k === 'jig'){ b.gear = true; pay(c, 'redskap', 'Håndjuksa', 'Hand jig', true); log('Kjøpte håndjuksa med pilk og markkroker for ' + kr(c) + '.', 'Bought a hand jig with pilk and fly hooks for ' + kr(c) + '.');
      // the first trip's jig and ice are Father's: he paid for them before he went (the letter leaves nothing else)
      if (free) msg(FOLK_NAMES.shop + ' i butikken', 'Så det er du som har tatt over naustet. Faren din var innom her i fjor høst og betalte for ei ny juksa og is til den første turen. «Til den som tar over», sa han. Den har ligget her og venta på deg. Gutten bærer issekkene ned til båten.',
        'So you’re the one who has taken over the boathouse. Your father came in here last autumn and paid for a new jig and ice for the first trip. «For whoever takes over», he said. It has been lying here waiting for you. The boy will carry the ice down to the boat.'); }
    else { b.kgear = true; pay(c, 'redskap', 'Kveiteutstyr', 'Halibut gear', true); log('Kjøpte kveiteutstyr for ' + kr(c) + ': stor pilk, kraftig snøre og gaff.', 'Bought halibut gear for ' + kr(c) + ': big pilk, heavy line and gaff.'); }
    if (c > 0) folkShop(); return null;
  }
  if (k === 'ice'){
    if (!pt.mottak) return ['Is og agn selges på fiskemottaket.', 'Ice and bait are sold at the fish plant.'];
    kg = Math.round(Math.min(kg, shopIceRoom())); if (kg < 1) return ['Iskassa er full.', 'The ice box is full.'];
    const c = free ? 0 : Math.round(kg * shopIceKr()); if (c > spendable()) return ['Du har ikke nok penger.', 'Not enough money.'];
    if (pt.ice && berthKind(b) !== 'naust'){
      if (b.shift || b.land && berthKind(b) !== 'main') return ['Vent til båten ligger ved mottakskaia.', 'Wait until the boat lies at the plant\'s quay.'];
      return buyIce(kg, free) ? null : ['Isrenna er opptatt. Prøv igjen litt senere.', 'The ice chute is busy. Try again a little later.'];
    }
    b.ice += kg; pay(c, 'is', 'Is i sekker', 'Bagged ice');
    log('Kjøpte ' + kg + ' kg is i sekker for ' + kr(c) + '. Mottaket bar den om bord.', 'Bought ' + kg + ' kg of bagged ice for ' + kr(c) + '. The plant carried it aboard.');
    if (c > 0) folkShop(); return null;
  }
  return ['Ukjent vare.', 'Unknown item.'];
}
