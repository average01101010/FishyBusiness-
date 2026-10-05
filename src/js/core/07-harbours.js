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
function unitDredge(p, d){
  const x = p.x * 1000, z = p.y * 1000;
  for (const U of UNITA){
    if (Math.abs(x - U.o[0]) > 100 || Math.abs(z - U.o[1]) > 100) continue;
    const [lx, lz] = unitL(U, x, z);
    if (groundOut(U, lx, lz) === 0) return 0;
    if (lz > 0){ const dO = Math.hypot(Math.max(0, Math.abs(lx) - UNIT.basinX), Math.max(0, lz - UNIT.basinZ)); d = Math.max(d, UNIT.dredge - tideZC(p) - 0.5 * dO); }
  }
  return d;
}
function quayFace(pid, kind){
  const U = UNITS[pid];
  if (U){ const b = UNIT.berth[kind]; if (!b) return null; const c = unitW(U, b[0], 0); return {x:c[0], z:c[1], ux:U.u[0], uz:U.u[1], nx:U.n[0], nz:U.n[1], hl:b[1] / 2, depth:UNIT.B, unit:pid}; }
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
  const inUnit = (x, z) => UNITA.some(U => { const [lx, lz] = unitL(U, x, z); return groundOut(U, lx, lz) <= 2 || (Math.abs(lx) <= UNIT.basinX && lz >= 0 && lz <= UNIT.basinZ); });
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
function quayFree(f){
  if (f.free !== undefined) return f.free;
  for (const pt of PORTS){
    const px = pt.p.x * 1000, pz = pt.p.y * 1000; if (Math.abs(px - f.x) > f.hl + 60 || Math.abs(pz - f.z) > f.hl + 60) continue;
    const a = clamp((px - f.x) * f.ux + (pz - f.z) * f.uz, -f.hl, f.hl); if (Math.hypot(f.x + f.ux * a - px, f.z + f.uz * a - pz) < 35) return f.free = false;
  }
  for (const U of UNITA){ const [lx, lz] = unitL(U, f.x, f.z); if (Math.abs(lx) < UNIT.E + 40 && lz > -UNIT.B - 15 && lz < UNIT.basinZ + 25) return f.free = false; }
  return f.free = true;
}
const NPCB = new Map();
// boats [{key, L, B, T}] of a harbour (group) round p (km), within R km: {key: {p (km), hd, face}} for those that got a place
function npcBerths(group, p, boats, R = 0.6){
  const c = NPCB.get(group); if (c && c.ver === VEC.ver) return c.v;
  const x = p.x * 1000, z = p.y * 1000, Rm = R * 1000, faces = [];
  for (const t of vecTilesIn(x - Rm, z - Rm, x + Rm, z + Rm)) for (const f of t.quays){
    const a = clamp((x - f.x) * f.ux + (z - f.z) * f.uz, -f.hl, f.hl), d = Math.hypot(f.x + f.ux * a - x, f.z + f.uz * a - z);
    if (d <= Rm && quayFree(f)) faces.push([d, f]);
  }
  faces.sort((a, b) => a[0] - b[0] || (a[1].id < b[1].id ? -1 : 1));
  const used = new Map(), v = {};
  for (const b of boats){
    for (const [, f] of faces){
      if (!quayFit(f, b.L, b.T)) continue;
      const u = used.get(f.id) || [], lim = f.hl - b.L / 2 - 1; let at = null;
      for (let s = 0; s <= lim * 2 && at === null; s += 2) for (const a of s ? [s / 2, -s / 2] : [0]){ if (Math.abs(a) > lim || u.some(([a0, a1]) => a + b.L / 2 + 1 > a0 && a - b.L / 2 - 1 < a1)) continue; at = a; break; }
      if (at === null) continue;
      u.push([at - b.L / 2 - 1, at + b.L / 2 + 1]); used.set(f.id, u);
      const off = b.B / 2 + 0.4, cx = f.x + f.ux * at + f.nx * off, cz = f.z + f.uz * at + f.nz * off, flip = hash(hashStr(b.key)) < 0.5;
      v[b.key] = {p:{x:cx / 1000, y:cz / 1000}, hd:Math.atan2(f.ux, -f.uz) + (flip ? Math.PI : 0), face:f.id};
      break;
    }
  }
  NPCB.set(group, {ver:VEC.ver, v}); return v;
}
// The way in: waypoints from open water to the harbour point, outermost first. Found breadth-first through the water cells of the
// chart (no cutting across the corner of a land cell), then straightened wherever the line is clear. A harbour behind a breakwater,
// like Husøy, needs more than one.
const APPROACH = {};
function clearLine(a, b){ const n = Math.max(1, Math.ceil(dist(a, b) / 0.008)); for (let i = 1; i < n; i++) if (isLand({x:a.x + (b.x - a.x) * i / n, y:a.y + (b.y - a.y) * i / n})) return false; return !coastSegHit(a, b); }
function approachPath(pt){
  if (APPROACH[pt.id]) return APPROACH[pt.id];
  // over the mask's cells (k = y * nx + x, counted from the layer's corner), a cell land where isLand has its middle (the fine coast)
  const M = MAPD.L.mask, c = M.c, nx = M.nx, cell = k => { const x = k % nx; return {x:(M.ix0 + x + 0.5) * c, y:(M.iy0 + (k - x) / nx + 0.5) * c}; }, s0 = (Math.floor(pt.p.y / c) - M.iy0) * nx + Math.floor(pt.p.x / c) - M.ix0;
  const LM = new Map(), mk = (x, y) => { const k = y * nx + x; let v = LM.get(k); if (v === undefined){ v = isLand(cell(k)); LM.set(k, v); } return v; };
  const prev = new Map([[s0, -1]]), Q = [s0]; let end = -1;
  for (let h = 0; h < Q.length && h < 300000; h++){
    const k = Q[h], x = k % nx, y = (k - x) / nx, p = cell(k);
    if (dist(p, pt.p) > 0.4 && coastDist(p) > 0.25){ end = k; break; }
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]){
      const X = x + dx, Y = y + dy, kk = Y * nx + X; if (X < 0 || Y < 0 || X >= nx || Y >= M.ny || prev.has(kk) || mk(X, Y)) continue;
      if (dx && dy && (mk(X, y) || mk(x, Y))) continue;
      if (coastSegHit(p, cell(kk))) continue;   // a breakwater thinner than a cell between them
      prev.set(kk, k); Q.push(kk);
    }
  }
  if (end < 0) return APPROACH[pt.id] = [];
  const cells = []; for (let k = end; k !== -1; k = prev.get(k)) cells.push(cell(k));
  cells[cells.length - 1] = pt.p;
  const path = [cells[0]];
  for (let i = 0; i < cells.length - 1;){ let j = cells.length - 1; while (j > i + 1 && !clearLine(cells[i], cells[j])) j--; if (j === cells.length - 1) break; path.push(cells[j]); i = j; }
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
const BEAM = Object.fromEntries(Object.entries(VESSELS).filter(([k, V]) => V.cls !== 'hav').map(([k, V]) => [k, V.beam]));
const CAST_MIN = 2;   // game minutes to take the lines in before the boat moves
// Where a vessel lies in a harbour: alongside the quay in QUAYS (kind 'main' or 'bunker'), or else the quay face nearest the harbour's
// berth point; parallel to it with the quay to starboard (where the skipper stands), off the face by half the beam and the fenders.
// Returned in km like the rest of the chart, with the face (metres) for the bollards and fenders. null when there is no quay near:
// the boat then lies as before.
const BERTHPOSE = {};
function berthPose(pid, type, kind = 'main'){
  const key = pid + '|' + type + '|' + kind; if (key in BERTHPOSE) return BERTHPOSE[key];
  const pt = portById(pid), px = pt.p.x * 1000, pz = pt.p.y * 1000, Lb = VESSELS[type].len, Bb = BEAM[type] || 3, qf = quayFace(pid, kind);
  let best = null;
  if (qf) best = {d:0, cx:qf.x + qf.nx * (Bb / 2 + 0.4), cz:qf.z + qf.nz * (Bb / 2 + 0.4), fx:qf.x, fz:qf.z, ux:qf.ux, uz:qf.uz, Nx:qf.nx, Nz:qf.nz, hl:qf.hl, a:0, depth:qf.depth, unit:qf.unit};
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
  return BERTHPOSE[key] = {x:best.cx / 1000, y:best.cz / 1000, hd, fwd:f, face:{x:best.fx, z:best.fz, ux:best.ux, uz:best.uz, nx:best.Nx, nz:best.Nz, hl:best.hl, depth:best.depth, unit:best.unit || null}, a:best.a, Lb, Bb};
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
  for (const U of UNITA){ const [lx, lz] = unitL(U, x, z); if (Math.abs(lx) <= UNIT.E + m && lz <= m && lz >= -UNIT.B) return true; }
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
// The catch goes up with the quay crane: boxes of about 40 kg fish, nine to a pallet, from skiffs and snekker; tubs of about 300 kg
// from the sjarks. The forklift takes two loads at a time into the plant, and the landing note comes when the catch is weighed in.
// Game minutes; the 3D view plays the same timeline, so what you see is what the clock says. The times are guesses, to be tuned.
const LANDING = {prep:5, lift:2.5, note:5, boxKg:40, perLift:9, tubKg:300, hooked:0.86};
function landPlan(type, kg){
  const tub = (VESSELS[type] || {}).land === 'tub', n = Math.max(1, Math.ceil(kg / (tub ? LANDING.tubKg : LANDING.boxKg))), lifts = tub ? n : Math.ceil(n / LANDING.perLift);
  return {kind:tub ? 'tub' : 'box', n, lifts, dur:LANDING.prep + lifts * LANDING.lift + LANDING.note};
}
// how far a landing has come at game minute t: loads up on the quay, units (boxes or tubs) landed, and the phase
function landState(L, t){
  const e = t - L.t0, up = clamp(Math.floor((e - LANDING.prep) / LANDING.lift - LANDING.hooked) + 1, 0, L.lifts);
  const units = L.kind === 'tub' ? up : Math.min(L.n, up * LANDING.perLift);
  return {e, up, units, phase:e < LANDING.prep ? 'prep' : e < LANDING.prep + L.lifts * LANDING.lift ? 'lift' : 'note'};
}
// The plants' opening hours (the user's list 04.10.2026). The plants publish none (looked up 04.10.2026: Nergård in Senjahopen gives
// a phone number, Råfisklaget lists the plants without hours), so these are typical ones: weekdays 06-18 and Saturday 08-14, closed
// on Sunday, and every day 05-22 in the skrei season (January to April), when the boats land late. The first trip never waits.
function mottakOpen(H){
  if (typeof tutOn === 'function' && tutOn()) return true;
  const g = gDate(H), m = g.getUTCMonth(), wd = g.getUTCDay(), h = g.getUTCHours() + g.getUTCMinutes() / 60;
  if (m <= 3) return h >= 5 && h < 22;
  return wd >= 1 && wd <= 5 ? h >= 6 && h < 18 : wd === 6 ? h >= 8 && h < 14 : false;
}
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
  if (berthKind(b) !== 'main') return startShift('main', ops ? 'landops' : 'land');   // the crane is at the plant's quay
  const lp = landPlan(b.type, kg), unit = lp.kind === 'tub' ? ['kar', 'tubs'] : ['kasser', 'boxes'];
  b.land = {pid:pt.id, t0:S.t, until:S.t + lp.dur, kind:lp.kind, n:lp.n, lifts:lp.lifts, kg:Math.round(kg), ops:!!ops};
  log('Losser ' + fmt(kg, 0) + ' kg i ' + pt.name + ', ' + lp.n + ' ' + unit[0] + '. Sluttseddelen kommer ca. kl. ' + hm(b.land.until / 60) + '.', 'Landing ' + fmt(kg, 0) + ' kg at ' + pt.name + ', ' + lp.n + ' ' + unit[1] + '. The landing note comes at about ' + hm(b.land.until / 60) + '.');
  return true;
}
// the catch is weighed in: the sale is settled on what is in the hold now, and a standing plan gets its report
function finishLanding(){
  const b = S.boat, L = b.land; b.land = null;
  if (b.status !== 'port' || b.port !== L.pid) return;
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
const berthKind = b => b.berth || 'main';
const hasBunker = pid => !!quayFace(pid, 'bunker');
// busy at the quay: landing, moving or filling; a departure waits for it
function portBusy(b){ const u = Math.max(b.land ? b.land.until : 0, b.shift ? b.shift.until : 0, b.fueling ? b.fueling.until : 0); return u > 0 || b.after ? Math.max(u, S.t) : 0; }
function startShift(to, after){
  const b = S.boat, pt = portById(b.port), from = berthKind(b);
  if (b.status !== 'port' || !pt || b.shift || b.land || b.fueling || from === to || (to === 'bunker' && !hasBunker(pt.id))) return false;
  const A = berthPose(pt.id, b.type, from), B = berthPose(pt.id, b.type, to); if (!A || !B) return false;
  const move = Math.max(1.5, Math.hypot(A.x - B.x, A.y - B.y) * 1000 * 1.3 / SHIFT_MPM);
  b.shift = {from, to, t0:S.t, castUntil:S.t + CAST_MIN, arriveAt:S.t + CAST_MIN + move, until:S.t + CAST_MIN * 2 + move}; b.after = after || null;
  log(to === 'bunker' ? 'Kaster loss og går bort til bunkerskaia.' : 'Kaster loss og går tilbake til mottakskaia.', to === 'bunker' ? 'Casting off for the bunker quay.' : 'Casting off for the plant\'s quay.');
  return true;
}
function startFueling(ops){
  const b = S.boat, pt = portById(b.port);
  if (b.status !== 'port' || !pt || !pt.fuel || b.land || b.fueling || b.shift) return false;
  if (BOAT.fuelCap - b.fuel < 0.5) return false;
  if (hasBunker(pt.id) && berthKind(b) !== 'bunker') return startShift('bunker', ops ? 'fuelops' : 'fuel');
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
    if (S.t > f.pumpAt && f.done < f.liters){ const l = Math.min(f.lpm, f.liters - f.done), c = l * fuelPrice(); if (c > S.cash){ f.liters = f.done; f.until = S.t + PUMP.stow; } else { b.fuel = Math.min(BOAT.fuelCap, b.fuel + l); f.done += l; f.paid = (f.paid || 0) + c; S.cash -= c; S.stats.costs += c; if (f.done >= f.liters - 0.01) f.until = Math.min(f.until, S.t + PUMP.stow); } }
    if (S.t >= f.until){ b.fueling = null; log('Fylte ' + fmt(f.done, 0) + ' L for ' + kr(Math.round(f.paid || 0)) + '.', 'Filled ' + fmt(f.done, 0) + ' L for ' + kr(Math.round(f.paid || 0)) + '.'); }
  }
  const s = b.shift;
  if (s && S.t >= s.until){
    b.shift = null; b.berth = s.to; const pt = portById(b.port), a = b.after; b.after = null;
    log('Fortøyd ved ' + (s.to === 'bunker' ? 'bunkerskaia' : 'mottakskaia') + ' i ' + pt.name + '.', 'Made fast at the ' + (s.to === 'bunker' ? 'bunker quay' : 'plant\'s quay') + ' in ' + pt.name + '.');
    if (a === 'fuel' || a === 'fuelops') startFueling(a === 'fuelops');
    else if (a === 'land' || a === 'landops') startLanding(a === 'landops');
    else if (a === 'ice'){ buyIce(b.iceKg || 50, b.iceFree); b.iceKg = b.iceFree = null; }
  }
}
// ice comes down the plant's chute, so the boat has to lie at the plant's quay
function buyIce(kg, free){
  const b = S.boat, pt = portById(b.port); if (b.status !== 'port' || !pt || !pt.ice) return false;
  if (berthKind(b) !== 'main'){ b.iceKg = kg; b.iceFree = !!free; return startShift('main', 'ice'); }
  kg = Math.round(Math.min(kg, BOAT.iceCap - b.ice)); const c = free ? 0 : Math.round(kg * PRICE.ice); if (kg <= 0 || c > S.cash) return false;
  b.ice += kg; S.cash -= c; S.stats.costs += c; iceChute(kg);
  log('Kjøpte ' + kg + ' kg is fra isrenna for ' + kr(c) + '.', 'Bought ' + kg + ' kg of ice from the chute for ' + kr(c) + '.');
  return true;
}
// ---------- the tackle shop on the quay, in every harbour: hand jig, ice and halibut gear ----------
// Where there is no plant (Finnsnes) the shop sells bagged ice and carries it aboard; elsewhere the ice comes down the plant's chute.
// PRICE.iceBag is our assumption: dearer than chute ice, not checked against a price list.
const shopIceKr = () => { const pt = portById(S.boat.port); return pt && pt.ice ? PRICE.ice : PRICE.iceBag; };
const shopIceRoom = () => Math.max(0, Math.round(BOAT.iceCap - S.boat.ice));
// buys one thing; returns null, or why not as [no, en]. free: the first-trip tutorial hands it out
function shopBuy(k, kg, free){
  const b = S.boat, pt = portById(b.port), pay = c => { S.cash -= c; S.stats.costs += c; };
  if (b.status !== 'port' || !pt) return ['Butikken er på land. Handle når båten ligger i havn.', 'The shop is ashore. Buy when the boat is in port.'];
  if (k === 'jig' || k === 'kgear'){
    const have = k === 'jig' ? b.gear : b.kgear, c = free ? 0 : k === 'jig' ? PRICE.gear : PRICE.kgear;
    if (have) return ['Det har du allerede om bord.', 'You already have that aboard.'];
    if (c > S.cash) return ['Du har ikke nok penger.', 'Not enough money.'];
    if (k === 'jig'){ b.gear = true; pay(c); log('Kjøpte håndjuksa med pilk og markkroker for ' + kr(c) + '.', 'Bought a hand jig with pilk and fly hooks for ' + kr(c) + '.'); }
    else { b.kgear = true; pay(c); log('Kjøpte kveiteutstyr for ' + kr(c) + ': stor pilk, kraftig snøre og gaff.', 'Bought halibut gear for ' + kr(c) + ': big pilk, heavy line and gaff.'); }
    return null;
  }
  if (k === 'ice'){
    kg = Math.round(Math.min(kg, shopIceRoom())); if (kg < 1) return ['Iskassa er full.', 'The ice box is full.'];
    const c = free ? 0 : Math.round(kg * shopIceKr()); if (c > S.cash) return ['Du har ikke nok penger.', 'Not enough money.'];
    if (pt.ice){
      if (b.shift || b.land && berthKind(b) !== 'main') return ['Vent til båten ligger ved mottakskaia.', 'Wait until the boat lies at the plant\'s quay.'];
      return buyIce(kg, free) ? null : ['Isrenna er opptatt. Prøv igjen litt senere.', 'The ice chute is busy. Try again a little later.'];
    }
    b.ice += kg; pay(c);
    log('Kjøpte ' + kg + ' kg is i sekker for ' + kr(c) + '. Butikken bar den om bord.', 'Bought ' + kg + ' kg of bagged ice for ' + kr(c) + '. The shop carried it aboard.');
    return null;
  }
  return ['Ukjent vare.', 'Unknown item.'];
}
