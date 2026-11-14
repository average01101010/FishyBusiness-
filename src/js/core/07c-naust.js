// ===== Father's naust by the home harbour, and the shop on the Finnsnes quay: where the 3D view sets them (05.10.2026) =====
// The naust (tools/harbour/naust.py, Jonas 05.10.2026: «Dette skal være plassen hvor alle nye spillere starter spillet»): a stretch of
// shore 60-360 m from the home plant's quay (shoreSpot, in rings round it, so a winding real coast has one too) where the shore runs
// fairly straight for 30 m (within 6 m of a straight line), there is open water 8, 16 and 30 m out and land 6, 14 and 25 m in, no quay
// or pier on it and no harbour point within 70 m. Its pile quay's face stands 4 m out from the shoreline and parallel to it. It is the
// boat's berth in the home harbour (naustFace, 'naust' in 07-harbours.js), where new games start. Found once per home (S.naust) when the
// home harbour's map is in; the 3D view draws it there (view3d.js SITES), cuts the ground down under it and takes away the map's
// houses where it stands. The frame is the model's: o the face's middle (m), u along the face, out to sea [-u[1], u[0]].
// The shop (tools/harbour/butikk.py): behind the quay face in Finnsnes, with x = 0 at the face's middle.
// A straight stretch of shore near (cx, cz), from r0 to r1 m away, in rings: where land and water meet round a point, the way out to sea
// is from the land round it; the shoreline is found on that line, and again half m to each side of it (the shore within o.bend m of
// straight); there must be water o.out m out and land o.inl m in, nothing of o.avoid near, and no quay or pier (PIERBOX) on it.
// {o (the shoreline's point, m), u (along the shore, with out to sea [-u[1], u[0]]), r} or null. Nearest to o.pref m first.
// within r m of a harbour unit's middle (its block, fill and the ground it shapes round them reach about 100 m out: 01-world.js
// UNITS, view3d.js unitTerr); the naust and the shop stand clear of it, as the coast's plants have units too (06b-coastports.js)
const unitNear = (x, z, r) => UNITA.some(U => Math.abs(U.o[0] - x) < r && Math.abs(U.o[1] - z) < r && Math.hypot(U.o[0] - x, U.o[1] - z) < r);
function shoreSpot(cx, cz, r0, r1, o){
  const land = (x, z) => isLand({x:x / 1000, y:z / 1000});
  const onPier = (x, z) => PIERBOX.some(q => { if (Math.abs(q.x - x) > q.l + q.w + 10 || Math.abs(q.z - z) > q.l + q.w + 10) return false;
    const ax = Math.sin(q.ang), az = Math.cos(q.ang), nx = Math.cos(q.ang), nz = -Math.sin(q.ang), dx = x - q.x, dz = z - q.z;
    return Math.abs(dx * ax + dz * az) <= q.l / 2 + 4 && Math.abs(dx * nx + dz * nz) <= q.w / 2 + 4; });
  let best = null;
  for (let r = r0; r <= r1; r += 15){ const nA = Math.max(16, Math.round(2 * Math.PI * r / 18));
    for (let k = 0; k < nA; k++){
      const a = k / nA * 2 * Math.PI, px = cx + Math.sin(a) * r, pz = cz - Math.cos(a) * r;
      let wx = 0, wz = 0, nl = 0; for (let j = 0; j < 12; j++){ const b = j * Math.PI / 6, sx = Math.sin(b), sz = -Math.cos(b); if (land(px + sx * 12, pz + sz * 12)) nl++; else { wx += sx; wz += sz; } }
      if (nl < 3 || nl > 9) continue; const wl = Math.hypot(wx, wz); if (wl < 1e-6) continue; const nx = wx / wl, nz = wz / wl, tx = -nz, tz = nx;
      const shoreAt = (sx, sz) => { if (!land(sx - nx * 30, sz - nz * 30)) return null; let prev = true;
        for (let v = -29; v <= 40; v++){ const x = sx + nx * v, z = sz + nz * v, l = land(x, z); if (prev && !l) return {x, z, v}; prev = l; } return null; };
      const c = shoreAt(px, pz); if (!c) continue;
      const A = shoreAt(c.x - tx * o.half, c.z - tz * o.half), B = shoreAt(c.x + tx * o.half, c.z + tz * o.half); if (!A || !B) continue;
      const bend = Math.abs((A.v + B.v) / 2); if (bend > o.bend) continue;
      let ux = B.x - A.x, uz = B.z - A.z; const L = Math.hypot(ux, uz) || 1; ux /= L; uz /= L;
      let Nx = -uz, Nz = ux; if (Nx * nx + Nz * nz < 0){ ux = -ux; uz = -uz; Nx = -Nx; Nz = -Nz; }
      if (o.out.some(v => land(c.x + Nx * v, c.z + Nz * v)) || o.inl.some(v => !land(c.x - Nx * v, c.z - Nz * v))) continue;
      if ([[0, 0], [-o.half, 0], [o.half, 0], [0, 6], [0, -10]].some(([du, dn]) => onPier(c.x + ux * du + Nx * dn, c.z + uz * du + Nz * dn))) continue;
      if (o.avoid && o.avoid(c.x, c.z, ux, uz, Nx, Nz)) continue;
      const score = bend + Math.abs(A.v - B.v) * 0.2 + Math.abs(r - o.pref) * 0.015;
      // (o.ok: a dearer test, asked only of a stretch that would be the best so far; naustFind's way out by water, naustWay)
      if ((!best || score < best.score) && (!o.ok || o.ok(c.x, c.z, ux, uz, Nx, Nz))) best = {score, o:[c.x, c.z], u:[ux, uz], r};
    } }
  return best;
}
// Keeping clear (Jonas 09.10.2026, after boats lay through a naust in Tufjord: «Sørg for at det aldri er en konflikt mellom naustet og andre
// kaier eller moloer, bygninger eller andre ting»): the naust's ground and the water in front of it, from 17 m along the shore each way,
// 14 m in and 28 m out, holds no pier, breakwater or quay face of the vec packs (with 7-12 m to spare), no boat of the NPC harbours at her
// berth (her length and 6 m) and, as far as there is a choice, no mapped building (with 3 m). x, z is the shoreline's point, (ux, uz)
// along it and (nx, nz) out to sea. Returns what is in the way ('pier', 'molo', 'quay', 'boat', 'bld') or null; the packs of the tiles
// must be decoded (naustVecOk).
const NAUST_BOX = {a:[-17, -8.5, 0, 8.5, 17], d:[-14, -7, 0, 4, 10, 16, 22, 28]};
function naustClash(x, z, ux, uz, nx, nz, withBld){
  const pts = []; for (const a of NAUST_BOX.a) for (const d of NAUST_BOX.d) pts.push([x + ux * a + nx * d, z + uz * a + nz * d]);
  const tiles = vecTilesIn(x - 120, z - 120, x + 120, z + 120), segD = (px, pz, ax, az, bx, bz) => { const dx = bx - ax, dz = bz - az, L2 = dx * dx + dz * dz || 1, t = clamp(((px - ax) * dx + (pz - az) * dz) / L2, 0, 1); return Math.hypot(px - ax - dx * t, pz - az - dz * t); };
  for (const t of tiles){
    for (const q of t.piers){ if (Math.abs(q.x - x) > q.l + q.w + 60 || Math.abs(q.z - z) > q.l + q.w + 60) continue; const sa = Math.sin(q.ang), ca = Math.cos(q.ang);
      for (const [px, pz] of pts){ const dx = px - q.x, dz = pz - q.z; if (Math.abs(dx * sa + dz * ca) <= q.l / 2 + 7 && Math.abs(dx * ca - dz * sa) <= q.w / 2 + 7) return 'pier'; } }
    for (const m of t.molos) for (let i = 0; i + 1 < m.length; i++){ if (Math.abs(m[i][0] - x) > 200 || Math.abs(m[i][1] - z) > 200) continue; for (const [px, pz] of pts) if (segD(px, pz, m[i][0], m[i][1], m[i + 1][0], m[i + 1][1]) < 12) return 'molo'; }
    for (const q of t.quays){ if (q.kind > 2 || Math.abs(q.x - x) > q.hl + 80 || Math.abs(q.z - z) > q.hl + 80) continue; for (const [px, pz] of pts) if (segD(px, pz, q.x - q.ux * q.hl, q.z - q.uz * q.hl, q.x + q.ux * q.hl, q.z + q.uz * q.hl) < 9) return 'quay'; }
    for (const h of t.npc || []) for (const b of h.boats){ const bx = b.p.x * 1000, bz = b.p.y * 1000; if (Math.abs(bx - x) > 100 || Math.abs(bz - z) > 100) continue; const R = (b.L || 12) / 2 + 6; for (const [px, pz] of pts) if (Math.hypot(px - bx, pz - bz) < R) return 'boat'; }
    if (withBld && t.bld && t.bld.cells) for (let gz = Math.floor((z - 50) / 1000); gz <= Math.floor((z + 50) / 1000); gz++) for (let gx = Math.floor((x - 50) / 1000); gx <= Math.floor((x + 50) / 1000); gx++){
      const l = t.bld.cells.get(gridKey(gx, gz)); if (!l) continue;
      for (const i of l){ const bx = t.bld.x[i], bz = t.bld.z[i]; if (Math.abs(bx - x) > 60 || Math.abs(bz - z) > 60) continue; const R = Math.max(t.bld.l[i], t.bld.w[i]) / 2 + 3; for (const [px, pz] of pts) if (Math.hypot(px - bx, pz - bz) < R) return 'bld'; } }
  }
  return null;
}
// whether the vec packs round a point (the home plant's quay) are decoded, so naustClash sees what is there; a build without them is ready,
// and a pack that does not come in 25 s is not waited for
let NAUST_WAIT = {k:'', t:0};
function naustVecOk(cx, cz){
  if (!MAPD.man) return true; const T = MAPD.man.tile * 1000; vecWant((cx - 500) / 1000, (cz - 500) / 1000, (cx + 500) / 1000, (cz + 500) / 1000);
  let ok = true; for (let ty = Math.floor((cz - 500) / T); ty <= Math.floor((cz + 500) / T); ty++) for (let tx = Math.floor((cx - 500) / T); tx <= Math.floor((cx + 500) / T); tx++) if (vecHas(tx, ty) && !vecTile(tx, ty)) ok = false;
  if (ok) return true; const n = performance.now(), k = Math.round(cx) + ',' + Math.round(cz); if (NAUST_WAIT.k !== k) NAUST_WAIT = {k, t:n}; return n - NAUST_WAIT.t > 25000;
}
// The way out by water from Father's naust (08.11.2026; Jonas: «Noen spillere opplever å ikke kunne forlate kaien ved første oppdrag
// fordi Autonav ikke fungerer»). The naust was placed where the water in front of it is open 8-30 m out, never asking whether that water
// leads anywhere: at Averøy it lay in a bay shut off behind a spit and at Sleneset in a lagoon whose mouth is narrower than the 25 m
// mask, so Autonav found no way from the berth at any tide («Fant ingen trygg rute dit.») and the first trip could not leave the quay.
// A breadth-first search over the 25 m mask's cells, as berthPath's, from `from` (km) to the cells round the harbour point, its way in
// (approachPath) or open water (a 100 m cell clear of the shore by LANE.clear, as leiaLane's), within NAUST_WAY.km: no land, pier,
// quay or harbour unit (berthBlocked), no coastline between two cells (coastSegHit), no land corner cut, and outside the harbour
// (inHarbour, where the sailing does not look for ground) water as deep as the route finder's own minimum at chart datum
// (BOAT.draft + LEIA.minOver, so it holds at the lowest tide) and no rock (rockOnLeg, as leiaLane). The line is pulled tight the same
// way. The points from `from` on, with .to 'harbour' (by the harbour point), 'lane' (on its way in) or 'open', or null. Tried on all 162 start places 08.11.2026: none but those two
// lack it (Smøla nord reaches open water, not the harbour), about 20 ms median and 250 ms at most
const NAUST_WAY = {km:1.2, m:1.5, rock:0.0135, want:null};
// (lim: the water a cell needs, m at chart datum; for a naust or a rorbu the deepest draught of the boats they take, SITE_DRAFT, so a
// boat up to 15 m gets out from it whatever she draws, Jonas 13.11.2026)
// (site: the place's quay {o, u} when it is not yet the naust or a rorbu's: its pocket counts as dredged, siteDredge)
function naustWay(from, pid, lim = SITE_DRAFT + LEIA.minOver, site = null){
  const pt = portById(pid); if (!pt || !from || !(MAPD.L && MAPD.L.mask)) return null;
  const c = MAPD.L.mask.c, m = NAUST_WAY.m, K = (i, j) => i * 262144 + j, ctr = (i, j) => ({x:(i + 0.5) * c, y:(j + 0.5) * c});
  let ap = []; try { ap = approachPath(pt) || []; } catch (e){}
  const atH = q => dist(q, pt.p) < 0.045 ? 'harbour' : ap.some(a => dist(q, a) < 0.03) ? 'lane' : null;
  const open = q => { try { return mapSimAt(q) && rcell(MAPD.L.dc, Math.floor(q.x / 0.1), Math.floor(q.y / 0.1)) > 0 && coastDist(q) >= LANE.clear; } catch (e){ return false; } };
  const deep = (q, r) => { if (inHarbour(q) || (site && sitePockE(site, q.x * 1000, q.y * 1000) === 0)) return true; try { return depthF(q) >= lim && !rockOnLeg(q, q, r); } catch (e){ return false; } };
  const B = new Map(), blocked = (i, j) => { const k = K(i, j); let v = B.get(k); if (v === undefined){ const q = ctr(i, j); try { v = berthBlocked(q, m) || !deep(q, NAUST_WAY.rock); } catch (e){ v = true; } B.set(k, v); } return v; };
  const i0 = Math.floor(from.x / c), j0 = Math.floor(from.y / c), R = Math.ceil(NAUST_WAY.km / c), prev = new Map([[K(i0, j0), -1]]), Q = [[i0, j0]];
  let end = -1, to = null;
  for (let h = 0; h < Q.length; h++){
    const [i, j] = Q[h], q = h ? ctr(i, j) : from;   // (the first cell's middle may be ashore: the lines go from the point itself)
    if (h){ to = atH(q) || (open(q) ? 'open' : null); if (to){ end = K(i, j); break; } }
    for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]){
      const I = i + di, J = j + dj, k = K(I, J);
      if (prev.has(k) || Math.abs(I - i0) > R || Math.abs(J - j0) > R || blocked(I, J)) continue;
      if (di && dj && (blocked(I, j) || blocked(i, J))) continue;
      if (coastSegHit(q, ctr(I, J))) continue;
      prev.set(k, K(i, j)); Q.push([I, J]);
    }
  }
  if (end < 0) return null;
  const cells = []; for (let k = end; k !== -1; k = prev.get(k)){ const i = Math.floor(k / 262144); cells.push(ctr(i, k - i * 262144)); }
  cells.reverse(); cells[0] = {x:from.x, y:from.y};
  // pulled tight: from each kept point the furthest one a clean line reaches (clear of land, piers and units every 4 m, and deep enough
  // without a rock beside it outside the harbour)
  const clean = (a, b) => { if (!berthClear(a, b, m)) return false; const n = Math.max(1, Math.ceil(dist(a, b) / 0.01)); for (let i = 1; i <= n; i++) if (!deep({x:a.x + (b.x - a.x) * i / n, y:a.y + (b.y - a.y) * i / n}, 0)) return false; return inHarbour(b) || !rockOnLeg(a, b, 0.012); };
  const out = [cells[0]];
  for (let i = 0; i < cells.length - 1;){ let j = cells.length - 1; while (j > i + 1 && !clean(cells[i], cells[j])) j--; out.push(cells[j]); i = j; }
  out.to = to; return out;
}
// where a naust's boat sets off from for the test of the way out: 9 m out from the shoreline (its pile quay's face is at 4 m, the boat
// lies along it); x, z the shoreline's point (m), (nx, nz) out to sea
const naustWayFrom = (x, z, nx, nz) => ({x:(x + nx * 9) / 1000, y:(z + nz * 9) / 1000});
// Father's naust: a stretch of shore 60-360 m from the home plant's quay (the harbour point where it has none), straight for 30 m, open
// water 8, 16 and 30 m out and land 6, 14 and 25 m in, no harbour point within 70 m; its pile quay's face 4 m out from the shoreline.
// From 08.11.2026 (ver 3) the boat must also get out from it by water (naustWay); a harbour where no such stretch is found has no naust,
// and the boat lies at the plant's quay (berthKind gives 'main'), which is better than a naust she cannot leave
function naustFind(pid){
  const pt = portById(pid); if (!pt) return {port:pid};
  const f = quayFace(pid, 'main'), cx = f ? f.x : pt.p.x * 1000, cz = f ? f.z : pt.p.y * 1000;
  const base = (x, z) => PORTS.some(q => Math.hypot(q.p.x * 1000 - x, q.p.y * 1000 - z) < 70) || unitNear(x, z, 110);
  const strict = (x, z, ux, uz, nx, nz) => base(x, z) || !!naustClash(x, z, ux, uz, nx, nz, true), hard = (x, z, ux, uz, nx, nz) => base(x, z) || !!naustClash(x, z, ux, uz, nx, nz, false);
  const way = (x, z, ux, uz, nx, nz) => !!naustWay(naustWayFrom(x, z, nx, nz), pid, undefined, {o:[x + nx * 4, z + nz * 4], u:[ux, uz]});
  // clear of everything first; failing that, clear of quays, piers, breakwaters and boats and with a house or two to take away
  const sp = shoreSpot(cx, cz, 60, 360, {half:15, bend:6, out:[8, 16, 30], inl:[6, 14, 25], avoid:strict, ok:way, pref:120})
    || shoreSpot(cx, cz, 60, 360, {half:12, bend:9, out:[8, 16], inl:[6, 14], avoid:strict, ok:way, pref:120})
    || shoreSpot(cx, cz, 60, 360, {half:15, bend:6, out:[8, 16, 30], inl:[6, 14, 25], avoid:hard, ok:way, pref:120})
    || shoreSpot(cx, cz, 60, 360, {half:12, bend:9, out:[8, 16], inl:[6, 14], avoid:hard, ok:way, pref:120})
    || shoreSpot(cx, cz, 60, 500, {half:12, bend:10, out:[8, 16], inl:[6, 12], avoid:hard, ok:way, pref:150});
  if (!sp) return {port:pid, ver:3};
  const N = [-sp.u[1], sp.u[0]], o = [sp.o[0] + N[0] * 4, sp.o[1] + N[1] * 4];
  return {port:pid, ver:3, o:o.map(v => Math.round(v * 10) / 10), u:sp.u.map(v => Math.round(v * 1e4) / 1e4)};
}
// whether the boat gets out by water from a naust already found ({o, u}: the face's middle, 4 m out from the shoreline)
function naustWayOk(n, pid){ const N = [-n.u[1], n.u[0]]; return !!naustWay(naustWayFrom(n.o[0] - N[0] * 4, n.o[1] - N[1] * 4, N[0], N[1]), pid, undefined, n); }
// Father's naust at the home harbour: {o, u} or null where none was found (or its map is not in yet)
function naustSite(){
  const pid = S.home || HOME0;
  // a naust is asked again once when its harbour's quay is not the one it was found or last asked against (qk; tools/steder/lukkflytt.py
  // moved the plants in Ålesund, Fosnavåg, Laukvik and Vengsøy out of basins shut in by their own quay and fill, 13.11.2026, and at
  // Fosnavåg the boat no longer got out from the naust found by the old quay): as one from before the way out was asked for (ver 2,
  // below), kept where the boat gets out from it, else found again by the new quay. A save from before qk is asked once too.
  const pt0 = portById(pid), f0 = pt0 && quayFace(pid, 'main'), qk = pt0 ? Math.round(f0 ? f0.x : pt0.p.x * 1000) + ',' + Math.round(f0 ? f0.z : pt0.p.y * 1000) : '';
  if (S.naust && S.naust.port === pid && S.naust.ver === 3){
    const n = S.naust;
    if (!n.o || !pt0 || n.qk === qk) return n.o ? n : null;
    n.ver = 2; n.qk = qk;
  }
  const kept = () => S.naust && S.naust.port === pid && S.naust.o ? S.naust : null;
  // the water within NAUST_WAY.km must be in for the way out to be read (else a narrow mouth could look shut on the core's 200 m land)
  const pt = portById(pid); if (!pt || !mapReadyAt(pt.p, 0.4)) return kept();
  if (!mapReadyAt(pt.p, NAUST_WAY.km)){ if (NAUST_WAY.want !== pid){ NAUST_WAY.want = pid; mapNeed(pt.p, NAUST_WAY.km).catch(e => console.error(e)).then(() => { NAUST_WAY.want = null; }); } return kept(); }
  const f = quayFace(pid, 'main'), cx = f ? f.x : pt.p.x * 1000, cz = f ? f.z : pt.p.y * 1000;
  if (!naustVecOk(cx, cz)) return kept();
  // a naust found before the way out was asked for (ver 2) stays where it is when the boat gets out from it; one she cannot leave
  // (Averøy, Sleneset) is found again, and the boat lying there lies at the new one (berthPose reads the site)
  if (S.naust && S.naust.port === pid && S.naust.ver === 2 && S.naust.o && naustWayOk(S.naust, pid)){ S.naust.ver = 3; return S.naust; }
  S.naust = naustFind(pid); S.naust.qk = qk; return S.naust.o ? S.naust : null;
}
// Father's naust as a berth in the home harbour (Jonas 05.10.2026: «Nye spillere skal starte ved det nye naustet», and «fast
// liggeplass»): the face of its pile quay (naust.py QUAY: x -8.6 .. 7.6 along the face, the deck at QTOP), as quayFace gives the
// harbours' faces; null away from home or before the home's map is in. The water under it is the bank's, 2.6 m at mean sea level.
function naustFace(pid){
  if (pid !== (S.home || HOME0)) return null;
  const n = naustSite(); if (!n) return null;
  // (the quay out to her the same for every boat up to 15 m, siteOut, so she lies in the pocket dredged for the deepest of them; till the
  // fine coast is in, berthPose works it out for her and does not keep it)
  const F = {x:n.o[0] - n.u[0] * 0.5, z:n.o[1] - n.u[1] * 0.5, ux:n.u[0], uz:n.u[1], nx:-n.u[1], nz:n.u[0], hl:8.1, depth:3.4, naust:true}, out = siteOut(n);
  if (out === out) F.out = out; else F.nocache = true; return F;   // (till it is known, berthPose does not keep the berth it works out)
}
// The tackle shop by Father's naust where the home is not Finnsnes (Jonas 05.10.2026: «Utstyrbutikken må alltid være i nærheten av
// naustet slik at det går ganske fort å gå dit uansett hvor man er i landet»): a stretch of shore near the
// naust (shoreSpot round it, 45-130 m, or up to 160 m a little less straight) that runs fairly straight for 36 m, with land 10, 20 and 30 m in, water 6 m out, no harbour point within 40 m.
// Its frame is the Finnsnes shop's (butikk.py: x along the face, the face at y = 0, the yard 9.6-27.5 m in), with the face on the
// shoreline; the 3D view levels the yard at the ground's own height there. Found once per naust (S.shopN).
function shopNearFind(n){
  const avoid = (x, z) => Math.hypot(x - n.o[0], z - n.o[1]) < 42 || PORTS.some(q => Math.hypot(q.p.x * 1000 - x, q.p.y * 1000 - z) < 40) || unitNear(x, z, 110);
  const sp = shoreSpot(n.o[0], n.o[1], 45, 130, {half:18, bend:6, out:[6], inl:[10, 20, 30], avoid, pref:60})
    || shoreSpot(n.o[0], n.o[1], 45, 160, {half:14, bend:9, out:[4], inl:[10, 20], avoid, pref:60});
  return sp ? {o:sp.o.map(v => Math.round(v * 10) / 10), u:sp.u.map(v => Math.round(v * 1e4) / 1e4)} : null;
}
function shopNear(){
  return null;   // Father's naust is a home and nothing else (Jonas 07.10.2026, docs/handelssteder.md): no shop beside it
  const n = naustSite(); if (!n) return null; const key = n.o.join(',');
  if (!S.shopN || S.shopN.key !== key){ const f = shopNearFind(n); S.shopN = Object.assign({key}, f || {}); }
  return S.shopN.o ? S.shopN : null;
}
// Father's naust as where a route can end (the chart plotter and Autonav): the berth's point (km) when (x, y) is within r km of it
// and nearer than any harbour point; {x, y, port, berth:'naust'} or null. You sail there and back; nothing moves the boat for you.
function naustTarget(pt, r){
  const pid = S.home || HOME0; if (!siteFits(S.boat.type)) return null;   // (a boat over 15 m: the plant's quay, SITE_MAXLEN)
  const bp = quayFace(pid, 'naust') && berthPose(pid, S.boat.type, 'naust'); if (!bp) return null;
  const d = dist(pt, bp); if (d >= r || PORTS.some(q => dist(q.p, pt) < d)) return null;
  return {x:bp.x, y:bp.y, port:pid, berth:'naust'};
}
// the shop on the Finnsnes quay: the face's middle, along it, out to sea
function shopSite(){
  const f = quayFace('finnsnes', 'main'); if (!f) return null;
  return {o:[f.x, f.z], u:[f.nz, -f.nx]};
}
// ---------- the naust as a home (05.10.2026; Jonas chose it from the list, 4): set it to rights step by step ----------
// Each step is paid once and done by the carpenter while you are in the home harbour; what it gives (small, as the list said):
// - tak (the roof made tight, 6 000 kr): you rest 25 % faster in the home harbour (energyMinute)
// - ovn (a wood stove, 9 000 kr, after the roof): 25 % more
// - benk (Father's workbench put right, 7 500 kr): a hand jig or halibut gear bought in the home harbour costs a quarter less (shopBuy)
// - vegg (the trophy wall, 3 000 kr): the dream fish hang on the wall; the notebook shows it, and Edvard notices
const NAUST_UP = [
  {k:'tak', kr:6000, no:'Tett taket', en:'Make the roof tight', d:['Nye takstein der de mangler og ny takpapp. Du hviler 25 % raskere i hjemhavna.', 'New tiles where they are missing and new underlay. You rest 25 % faster in the home harbour.']},
  {k:'ovn', kr:9000, no:'Vedovn', en:'A wood stove', after:'tak', d:['En gammel vedovn og en kaffekjel. Du hviler 25 % raskere til i hjemhavna.', 'An old wood stove and a coffee pot. You rest another 25 % faster in the home harbour.']},
  {k:'benk', kr:7500, no:'Fars arbeidsbenk', en:'Father’s workbench', d:['Benken og verktøyet hans satt i stand. Håndjuksa og kveiteutstyr koster en firedel mindre i hjemhavna.', 'His bench and tools put right. Hand jigs and halibut gear cost a quarter less in the home harbour.']},
  {k:'vegg', kr:3000, no:'Trofévegg', en:'Trophy wall', d:['Storfisken din henger på veggen i naustet.', 'Your big fish hang on the wall in the boathouse.']}
];
const naustHas = k => !!(S.naustUp && S.naustUp[k]);
const atHome = b => !!(b && b.status === 'port' && b.port === (S.home || HOME0));
// how much faster you rest in the home harbour
function naustRest(b){ return atHome(b) ? 1 + (naustHas('tak') ? 0.25 : 0) + (naustHas('ovn') ? 0.25 : 0) : 1; }
// what a step costs and why it cannot be bought now ([no, en]) or null
function naustWhy(k){
  const U = NAUST_UP.find(x => x.k === k); if (!U) return ['Ukjent.', 'Unknown.'];
  if (naustHas(k)) return ['Det er gjort.', 'That is done.'];
  if (U.after && !naustHas(U.after)) return ['Taket må tettes først.', 'The roof must be made tight first.'];
  if (!atHome(S.boat)) return ['Snekkeren jobber når du er i hjemhavna.', 'The carpenter works while you are in the home harbour.'];
  if (spendable() < U.kr) return ['Du har ikke nok penger.', 'Not enough money.'];
  return null;
}
function naustBuy(k){
  const why = naustWhy(k); if (why) return why;
  const U = NAUST_UP.find(x => x.k === k); book('land', -U.kr, 'Naustet: ' + U.no, 'The boathouse: ' + U.en); (S.naustUp = S.naustUp || {})[k] = S.t;
  log('Naustet: ' + U.no.toLowerCase() + ' for ' + kr(U.kr) + '.', 'The boathouse: ' + U.en.toLowerCase() + ' for ' + kr(U.kr) + '.');
  return null;
}
