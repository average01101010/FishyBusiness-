// ===== Father's naust by the home harbour, and the shop on the Finnsnes quay: where the 3D view sets them (05.10.2026) =====
// The naust (tools/harbour/naust.py, Jonas 05.10.2026: «Dette skal være plassen hvor alle nye spillere starter spillet»): a stretch of
// shore 60-240 m to one side of the home harbour's quay face (either way along it) where the shore runs fairly straight for 30 m
// (the shoreline within 6 m of a straight line), there is open water 8, 16 and 30 m out and land 6, 14 and 25 m in, and no harbour
// point within 70 m. Its pile quay's face stands 4 m out from the shoreline and parallel to it. Found once per home (S.naust) when the
// home harbour's map is in; the 3D view draws it there (view3d.js SITES), cuts the ground down under it and takes away the map's
// houses where it stands. The frame is the model's: o the face's middle (m), u along the face, out to sea [-u[1], u[0]].
// The shop (tools/harbour/butikk.py): behind the quay face in Finnsnes, with x = 0 at the face's middle.
function naustFind(pid){
  const f = quayFace(pid, 'main'); if (!f) return null;
  const land = (x, z) => isLand({x:x / 1000, y:z / 1000});
  // the shoreline on the line across the face's direction through cx, cz: the first water going out from 60 m in
  const shoreAt = (cx, cz) => { if (!land(cx - f.nx * 60, cz - f.nz * 60)) return null; let prev = true;
    for (let v = -59; v <= 70; v++){ const x = cx + f.nx * v, z = cz + f.nz * v, l = land(x, z); if (prev && !l) return {x, z, v}; prev = l; } return null; };
  let best = null;
  for (const side of [1, -1]) for (let s = 60; s <= 240; s += 10){
    const cx = f.x + f.ux * s * side, cz = f.z + f.uz * s * side;
    const a = shoreAt(cx - f.ux * 15, cz - f.uz * 15), c = shoreAt(cx, cz), b = shoreAt(cx + f.ux * 15, cz + f.uz * 15);
    if (!a || !b || !c) continue;
    const bend = Math.abs(c.v - (a.v + b.v) / 2); if (bend > 6) continue;
    let ux = b.x - a.x, uz = b.z - a.z; const L = Math.hypot(ux, uz) || 1; ux /= L; uz /= L;
    let nx = -uz, nz = ux; if (nx * f.nx + nz * f.nz < 0){ ux = -ux; uz = -uz; nx = -nx; nz = -nz; }
    if ([8, 16, 30].some(v => land(c.x + nx * v, c.z + nz * v)) || [6, 14, 25].some(v => !land(c.x - nx * v, c.z - nz * v))) continue;
    const ox = c.x + nx * 4, oz = c.z + nz * 4;
    if (PORTS.some(q => Math.hypot(q.p.x * 1000 - ox, q.p.y * 1000 - oz) < 70)) continue;
    const score = bend + Math.abs(a.v - b.v) * 0.2 + s * 0.02;
    if (!best || score < best.score) best = {score, o:[ox, oz], u:[ux, uz]};
  }
  return best ? {port:pid, o:best.o.map(v => Math.round(v * 10) / 10), u:best.u.map(v => Math.round(v * 1e4) / 1e4)} : {port:pid};
}
// Father's naust at the home harbour: {o, u} or null where none was found (or its map is not in yet)
function naustSite(){
  const pid = S.home || 'finnsnes';
  if (S.naust && S.naust.port === pid) return S.naust.o ? S.naust : null;
  const pt = portById(pid); if (!pt || !mapReadyAt(pt.p, 0.4)) return null;
  S.naust = naustFind(pid); return S.naust.o ? S.naust : null;
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
const atHome = b => !!(b && b.status === 'port' && b.port === (S.home || 'finnsnes'));
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
