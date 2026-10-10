// ===== the rorbuer along the coast: a cheap bed ashore and a quay to lie at (05.10.2026) =====
// Jonas 05.10.2026: «Disse skal plasseres rundt om kring langs kysten slik at spillere kan hvile der, eller ligge til kai under uvær»,
// «Man skal ikke kunne hvile i en åpen båt, da må man enten seile hjem til naustet sitt eller ta inn på en rorbu. Rorbua må være billig.
// Energi skal kunne lade opp fra 0-100% på 6 timer in-game ved hvile på rorbuer» and «Ved hvile forsvinner skipperen fra båten».
// Where they are: src/data/rorbuer.json (tools/rorbu/rorbuer.py): one by each fishing harbour (kind 0, sheltered shore 1.5-4 km from the
// plant, never by its quay: Jonas 08.10.2026) and one on
// sheltered shore between them (kind 1, at least 14 km apart, Jonas: «Kan sikkert halveres» of 10 km). Each is a place of its own you
// lie at, like a harbour without services: portById knows it (RBID, 01-world.js) but it is not one of the PORTS, so nothing that goes
// through the harbours (the plants, the fuel, the shop, the NPC boats) sees it. Its stretch of shore is found the first time its map is
// in (shoreSpot, as Father's naust), the same for everyone as it comes from the map alone: as near the point as there is a straight shore. The quay's face stands RORBU.out m out from the shoreline, parallel to it;
// the house on its posts behind it. Three colours, picked by the id: r red, o ochre and w white (the 3D view paints the cladding, view3d.js siteModel).
// Resting there (restStart, 15-energy.js) costs RORBU.kr a night, the first night when you go in, the next ones as the days go.
const RORBU_D = /*@include(data/rorbuer.json)*/null;
// the quay (rorbu.py QUAY): 14 m of face, its shoreline 4.4 m behind it where the bank (BANK) crosses mean sea level
const RORBU = {kr:150, night:24 * 60, rate:100 / 6 / 60, out:4.4, hl:7, depth:3.4, look:'row'};
const RORBUER = ((RORBU_D && RORBU_D.r) || []).map((r, i) => {
  const id = 'rb' + i, p = {x:r[0], y:r[1]};
  const R = {id, name:r[3] || 'Rorbua', kind:r[2], cand:p, p:{x:p.x, y:p.y}, coast:{x:p.x, y:p.y}, xy:[p.x, p.y], shore:[p.x, p.y], rorbu:true, pier:true, fuel:false, ice:false, mottak:false, pf:1, v:RORBU.look[hashStr(id) % 3]};
  RBID.set(id, R); return R;
});
// the rorbuer in a box (km), by a 20 km grid
const RBGRID = new Map();
for (const R of RORBUER){ const k = Math.floor(R.cand.x / 20) * 1000 + Math.floor(R.cand.y / 20); if (!RBGRID.has(k)) RBGRID.set(k, []); RBGRID.get(k).push(R); }
function rorbuIn(x0, y0, x1, y1){
  const out = [];
  for (let gx = Math.floor(x0 / 20); gx <= Math.floor(x1 / 20); gx++) for (let gy = Math.floor(y0 / 20); gy <= Math.floor(y1 / 20); gy++)
    for (const R of RBGRID.get(gx * 1000 + gy) || []) if (R.cand.x >= x0 && R.cand.x <= x1 && R.cand.y >= y0 && R.cand.y <= y1) out.push(R);
  return out;
}
// the rorbuer within r km of p, nearest first: [{R, d}]
const rorbuNear = (p, r) => rorbuIn(p.x - r, p.y - r, p.x + r, p.y + r).map(R => ({R, d:dist(R.cand, p)})).filter(e => e.d <= r).sort((a, b) => a.d - b.d);
// its stretch of shore: {o (the face's middle, m), u (along the face, out to sea [-u[1], u[0]])}, or null (none there, or the map not in)
function rorbuSite(R){
  if (typeof R === 'string') R = RBID.get(R);
  if (!R) return null; if (R.site !== undefined) return R.site;
  if (!mapReadyAt(R.cand, 0.8)) return null;
  const cx = R.cand.x * 1000, cz = R.cand.y * 1000, home = S.naust && S.naust.o;
  const avoid = (x, z) => PORTS.some(q => Math.hypot(q.p.x * 1000 - x, q.p.y * 1000 - z) < 70) || unitNear(x, z, 110) || (home && Math.hypot(home[0] - x, home[1] - z) < 120);
  const [r0, r1, pref] = [15, 600, 0];   // near its point: the point is 1.5-4 km from the plant already (rorbuer.py, Jonas 08.10.2026)
  const sp = shoreSpot(cx, cz, r0, r1, {half:14, bend:6, out:[8, 16, 30], inl:[6, 14, 25], avoid, pref})
    || shoreSpot(cx, cz, r0, r1, {half:11, bend:9, out:[8, 16], inl:[6, 14], avoid, pref});
  if (!sp){ R.site = null; return null; }
  const N = [-sp.u[1], sp.u[0]], o = [sp.o[0] + N[0] * RORBU.out, sp.o[1] + N[1] * RORBU.out];
  R.site = {o:o.map(v => Math.round(v * 10) / 10), u:sp.u.map(v => Math.round(v * 1e4) / 1e4)};
  // the harbour point 15 m out from the face (where a route ends and the way in starts), the shore point 20 m in
  R.p = {x:Math.round(o[0] + N[0] * 15) / 1000, y:Math.round(o[1] + N[1] * 15) / 1000}; R.coast = {x:(sp.o[0] - N[0] * 20) / 1000, y:(sp.o[1] - N[1] * 20) / 1000};
  R.xy = [R.p.x, R.p.y]; RORBU.ver = (RORBU.ver || 0) + 1;
  // a boat moored here before the shore was found lay at the candidate point, by the plant's quay: the chart and the routes put her there
  // while the 3D view had her at the rorbu (tilbakemelding #34)
  if (S && S.fleet) for (const v of S.fleet){ const b = vget(v, 'boat'); if (b && b.status === 'port' && b.port === R.id){ b.pos = {x:R.p.x, y:R.p.y}; if (v.id === S.cur) S.trail = [{x:R.p.x, y:R.p.y, port:R.id}]; } }
  return R.site;
}
const isRorbu = pid => RBID.has(pid);
// its quay's face, as quayFace gives the harbours' (07-harbours.js)
function rorbuFace(pid){
  const s = rorbuSite(pid); if (!s) return null;
  return {x:s.o[0], z:s.o[1], ux:s.u[0], uz:s.u[1], nx:-s.u[1], nz:s.u[0], hl:RORBU.hl, depth:RORBU.depth, rorbu:true};
}
// a rorbu as where a route can end (the chart plotter and Autonav), as naustTarget: {x, y, port} when (x, y) is within r km of its
// berth and nearer than any harbour point
function rorbuTarget(pt, r){
  let best = null;
  for (const {R} of rorbuNear(pt, r + 1)){
    if (!rorbuSite(R)) continue; const bp = berthPose(R.id, S.boat.type, 'main'); if (!bp) continue;
    const d = dist(pt, bp); if (d < r && (!best || d < best.d)) best = {d, x:bp.x, y:bp.y, port:R.id};
  }
  if (!best || PORTS.some(q => dist(q.p, pt) < best.d)) return null;
  return {x:best.x, y:best.y, port:best.port};
}
// the found rorbuer within r km of p (the chart's taps)
const rorbuSites = (p, r) => rorbuNear(p, r).map(e => e.R).filter(R => rorbuSite(R));
// the same for the 3D view, a frame at a time: at most one stretch of shore is worked out per call; pend while some are left whose map
// is in ({l, pend})
function rorbuSoon(p, r){
  let n = 0, pend = false; const l = [];
  for (const {R} of rorbuNear(p, r)){
    if (R.site === undefined){ if (n || !mapReadyAt(R.cand, 0.8)){ pend = true; continue; } n++; rorbuSite(R); }
    if (R.site) l.push(R);
  }
  return {l, pend};
}
