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
const QUAY_DEPTH = 10;   // how far the quay deck reaches in from the face (m)
function quayFace(pid, kind){
  const q = QUAYS[pid] && QUAYS[pid][kind]; if (!q) return null;
  const dx = q.b[0] - q.a[0], dz = q.b[1] - q.a[1], L = Math.hypot(dx, dz), ux = dx / L, uz = dz / L, s = -uz * q.n[0] + ux * q.n[1] >= 0 ? 1 : -1;
  return {x:(q.a[0] + q.b[0]) / 2, z:(q.a[1] + q.b[1]) / 2, ux, uz, nx:-uz * s, nz:ux * s, hl:L / 2, depth:QUAY_DEPTH};
}
const PIERBOX = (() => {
  const out = [];
  for (const pr of PIERS){
    const bw = pr[0] === 1, n = (pr.length - 1) / 2, X = k => pr[1 + k * 2] * 1000, Z = k => pr[2 + k * 2] * 1000;
    const closed = n > 3 && Math.hypot(X(0) - X(n - 1), Z(0) - Z(n - 1)) < 1;
    if (closed && !bw){
      let cx = 0, cz = 0; for (let k = 0; k < n - 1; k++){ cx += X(k); cz += Z(k); } cx /= n - 1; cz /= n - 1;
      let sxx = 0, szz = 0, sxz = 0; for (let k = 0; k < n - 1; k++){ const a = X(k) - cx, b = Z(k) - cz; sxx += a * a; szz += b * b; sxz += a * b; }
      const th = 0.5 * Math.atan2(2 * sxz, sxx - szz), ux = Math.cos(th), uz = Math.sin(th); let l0 = 1e9, l1 = -1e9, w0 = 1e9, w1 = -1e9;
      for (let k = 0; k < n - 1; k++){ const a = X(k) - cx, b = Z(k) - cz, pu = a * ux + b * uz, pv = -a * uz + b * ux; l0 = Math.min(l0, pu); l1 = Math.max(l1, pu); w0 = Math.min(w0, pv); w1 = Math.max(w1, pv); }
      out.push({x:cx + ux * (l0 + l1) / 2 - uz * (w0 + w1) / 2, z:cz + uz * (l0 + l1) / 2 + ux * (w0 + w1) / 2, w:Math.max(3, w1 - w0), l:Math.max(3, l1 - l0), ang:Math.atan2(ux, uz), bw:false, closed:true});
    } else for (let k = 0; k < n - 1; k++){
      const ax = X(k), az = Z(k), bx = X(k + 1), bz = Z(k + 1), L = Math.hypot(bx - ax, bz - az); if (L < 0.5) continue;
      out.push({x:(ax + bx) / 2, z:(az + bz) / 2, w:bw ? 9 : 4.2, l:L + (bw ? 4 : 1), ang:Math.atan2(bx - ax, bz - az), bw, closed:false});
    }
  }
  // the quay decks behind the faces in QUAYS; the shoreline behind them is not always straight, so the deck fills the gap
  for (const pid in QUAYS) for (const kind in QUAYS[pid]){ const f = quayFace(pid, kind); out.push({x:f.x - f.nx * f.depth / 2, z:f.z - f.nz * f.depth / 2, w:f.depth, l:f.hl * 2, ang:Math.atan2(f.ux, f.uz), bw:false, closed:false, made:true, quay:pid + '|' + kind}); }
  for (const pt of PORTS){
    if (pt.pier || QUAYS[pt.id]) continue;
    const px = pt.p.x * 1000, pz = pt.p.y * 1000, dx = pt.coast.x * 1000 - px, dz = pt.coast.y * 1000 - pz, L = Math.hypot(dx, dz), ux = dx / L, uz = dz / L, ql = L + 20;
    out.push({x:px + ux * (ql / 2 + 8), z:pz + uz * (ql / 2 + 8), w:9, l:ql, ang:Math.atan2(ux, uz), bw:false, closed:false, made:true});
  }
  return out;
})();
// The way in: waypoints from open water to the harbour point, outermost first. Found breadth-first through the water cells of the
// chart (no cutting across the corner of a land cell), then straightened wherever the line is clear. A harbour behind a breakwater,
// like Husøy, needs more than one.
const APPROACH = {};
function clearLine(a, b){ const n = Math.max(1, Math.ceil(dist(a, b) / 0.008)); for (let i = 1; i < n; i++) if (isLand({x:a.x + (b.x - a.x) * i / n, y:a.y + (b.y - a.y) * i / n})) return false; return true; }
function approachPath(pt){
  if (APPROACH[pt.id]) return APPROACH[pt.id];
  const c = GRID.c, nx = GRID.nx, cell = k => { const x = k % nx; return {x:(x + 0.5) * c, y:((k - x) / nx + 0.5) * c}; }, s0 = Math.floor(pt.p.y / c) * nx + Math.floor(pt.p.x / c);
  const prev = new Map([[s0, -1]]), Q = [s0]; let end = -1;
  for (let h = 0; h < Q.length && h < 300000; h++){
    const k = Q[h], x = k % nx, y = (k - x) / nx, p = cell(k);
    if (dist(p, pt.p) > 0.4 && coastDist(p) > 0.25){ end = k; break; }
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]){
      const X = x + dx, Y = y + dy, kk = Y * nx + X; if (X < 0 || Y < 0 || X >= nx || Y >= GRID.ny || prev.has(kk) || MASK[kk]) continue;
      if (dx && dy && (MASK[y * nx + X] || MASK[Y * nx + x])) continue;
      prev.set(kk, k); Q.push(kk);
    }
  }
  if (end < 0) return APPROACH[pt.id] = [];
  const cells = []; for (let k = end; k !== -1; k = prev.get(k)) cells.push(cell(k));
  cells[cells.length - 1] = pt.p;
  const path = [cells[0]];
  for (let i = 0; i < cells.length - 1;){ let j = cells.length - 1; while (j > i + 1 && !clearLine(cells[i], cells[j])) j--; if (j === cells.length - 1) break; path.push(cells[j]); i = j; }
  APPROACH[pt.id] = path.map(q => ({x:Math.round(q.x * 1000) / 1000, y:Math.round(q.y * 1000) / 1000}));
  pt.app = APPROACH[pt.id][0];   // the harbour's safe zone reaches out to the start of the way in (inHarbour)
  return APPROACH[pt.id];
}
// the waypoints a route needs to get out of harbour towards `to`, and in to a harbour from `from` (the part of the way in that it
// cannot see past)
function exitWps(pt, to){ const r = approachPath(pt).slice().reverse(); const out = []; for (const q of r){ out.push(q); if (clearLine(q, to)) break; } return clearLine(pt.p, to) ? [] : out; }
function entryWps(pt, from){ if (clearLine(from, pt.p)) return []; const a = approachPath(pt); for (let i = a.length - 1; i >= 0; i--) if (clearLine(from, a[i])) return a.slice(i); return a; }
// beam (m) of the player's vessels, for lying alongside
const BEAM = {skiff:2.2, snekke:2.7, sjark:3.8, sjarkny:4.3};
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
  if (qf) best = {d:0, cx:qf.x + qf.nx * (Bb / 2 + 0.4), cz:qf.z + qf.nz * (Bb / 2 + 0.4), fx:qf.x, fz:qf.z, ux:qf.ux, uz:qf.uz, Nx:qf.nx, Nz:qf.nz, hl:qf.hl, a:0, depth:qf.depth};
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
  return BERTHPOSE[key] = {x:best.cx / 1000, y:best.cz / 1000, hd, fwd:f, face:{x:best.fx, z:best.fz, ux:best.ux, uz:best.uz, nx:best.Nx, nz:best.Nz, hl:best.hl, depth:best.depth}, a:best.a, Lb, Bb};
}

// ===== landing the catch =====
// The catch goes up with the quay crane: boxes of about 40 kg fish, nine to a pallet, from skiffs and snekker; tubs of about 300 kg
// from the sjarks. The forklift takes two loads at a time into the plant, and the landing note comes when the catch is weighed in.
// Game minutes; the 3D view plays the same timeline, so what you see is what the clock says. The times are guesses, to be tuned.
const LANDING = {prep:5, lift:2.5, note:5, boxKg:40, perLift:9, tubKg:300, hooked:0.86};
function landPlan(type, kg){
  const tub = type === 'sjark' || type === 'sjarkny', n = Math.max(1, Math.ceil(kg / (tub ? LANDING.tubKg : LANDING.boxKg))), lifts = tub ? n : Math.ceil(n / LANDING.perLift);
  return {kind:tub ? 'tub' : 'box', n, lifts, dur:LANDING.prep + lifts * LANDING.lift + LANDING.note};
}
// how far a landing has come at game minute t: loads up on the quay, units (boxes or tubs) landed, and the phase
function landState(L, t){
  const e = t - L.t0, up = clamp(Math.floor((e - LANDING.prep) / LANDING.lift - LANDING.hooked) + 1, 0, L.lifts);
  const units = L.kind === 'tub' ? up : Math.min(L.n, up * LANDING.perLift);
  return {e, up, units, phase:e < LANDING.prep ? 'prep' : e < LANDING.prep + L.lifts * LANDING.lift ? 'lift' : 'note'};
}
function startLanding(ops){
  const b = S.boat, pt = portById(b.port), kg = holdTotal();
  if (b.status !== 'port' || !pt || !pt.mottak || b.land || kg < 0.5) return false;
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
