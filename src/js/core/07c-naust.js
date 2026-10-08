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
      if (o.avoid && o.avoid(c.x, c.z)) continue;
      const score = bend + Math.abs(A.v - B.v) * 0.2 + Math.abs(r - o.pref) * 0.015;
      if (!best || score < best.score) best = {score, o:[c.x, c.z], u:[ux, uz], r};
    } }
  return best;
}
// Father's naust: a stretch of shore 60-360 m from the home plant's quay (the harbour point where it has none), straight for 30 m, open
// water 8, 16 and 30 m out and land 6, 14 and 25 m in, no harbour point within 70 m; its pile quay's face 4 m out from the shoreline.
function naustFind(pid){
  const pt = portById(pid); if (!pt) return {port:pid};
  const f = quayFace(pid, 'main'), cx = f ? f.x : pt.p.x * 1000, cz = f ? f.z : pt.p.y * 1000;
  const avoid = (x, z) => PORTS.some(q => Math.hypot(q.p.x * 1000 - x, q.p.y * 1000 - z) < 70) || unitNear(x, z, 110);
  const sp = shoreSpot(cx, cz, 60, 360, {half:15, bend:6, out:[8, 16, 30], inl:[6, 14, 25], avoid, pref:120})
    || shoreSpot(cx, cz, 60, 360, {half:12, bend:9, out:[8, 16], inl:[6, 14], avoid, pref:120});
  if (!sp) return {port:pid};
  const N = [-sp.u[1], sp.u[0]], o = [sp.o[0] + N[0] * 4, sp.o[1] + N[1] * 4];
  return {port:pid, o:o.map(v => Math.round(v * 10) / 10), u:sp.u.map(v => Math.round(v * 1e4) / 1e4)};
}
// Father's naust at the home harbour: {o, u} or null where none was found (or its map is not in yet)
function naustSite(){
  const pid = S.home || HOME0;
  if (S.naust && S.naust.port === pid) return S.naust.o ? S.naust : null;
  const pt = portById(pid); if (!pt || !mapReadyAt(pt.p, 0.4)) return null;
  S.naust = naustFind(pid); return S.naust.o ? S.naust : null;
}
// Father's naust as a berth in the home harbour (Jonas 05.10.2026: «Nye spillere skal starte ved det nye naustet», and «fast
// liggeplass»): the face of its pile quay (naust.py QUAY: x -8.6 .. 7.6 along the face, the deck at QTOP), as quayFace gives the
// harbours' faces; null away from home or before the home's map is in. The water under it is the bank's, 2.6 m at mean sea level.
function naustFace(pid){
  if (pid !== (S.home || HOME0)) return null;
  const n = naustSite(); if (!n) return null;
  return {x:n.o[0] - n.u[0] * 0.5, z:n.o[1] - n.u[1] * 0.5, ux:n.u[0], uz:n.u[1], nx:-n.u[1], nz:n.u[0], hl:8.1, depth:3.4, naust:true};
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
  const pid = S.home || HOME0, bp = quayFace(pid, 'naust') && berthPose(pid, S.boat.type, 'naust'); if (!bp) return null;
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
  if (S.cash < U.kr) return ['Du har ikke nok penger.', 'Not enough money.'];
  return null;
}
function naustBuy(k){
  const why = naustWhy(k); if (why) return why;
  const U = NAUST_UP.find(x => x.k === k); S.cash -= U.kr; S.stats.costs += U.kr; (S.naustUp = S.naustUp || {})[k] = S.t;
  log('Naustet: ' + U.no.toLowerCase() + ' for ' + kr(U.kr) + '.', 'The boathouse: ' + U.en.toLowerCase() + ' for ' + kr(U.kr) + '.');
  return null;
}
