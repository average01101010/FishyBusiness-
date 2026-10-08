// ===== Anchor (Jonas 08.10.2026: «alle båter skal ha mulighet til å ligge på anker … kai skal være standard … risiko forbundet med å
// ligge til ankers på værutsatte plasser basert på båtens begrensninger») =====
// An anchored boat is an idle boat with `b.anch = {x, y, t0, depth, expo, drags}`: it keeps its place when nobody is awake (the drift of
// a boat asleep alone stops, 15-energy.js), the crew rests as at a quay, and the boat can jig or work gear from there. The risk is the
// anchor dragging, and it comes from the boat's own limits (BOAT.risk: the wind and sea at which she starts to ship water and to
// roll) and from where she lies:
//   load = the larger of wind / the boat's wind limit and sea / the boat's sea limit, the wind eased by the shelter of the land
//   (EXPO, the same map the sea state is made from); under 0.9 she holds; above it the anchor drags, more often the higher the load
//   and the deeper the water (a long scope in deep water holds worse)
// A drag with someone awake is noticed: the anchor is dropped again 150 m downwind (rest lost, the watch tired), and in a gale the
// boat weighs and goes to the nearest quay. Everyone asleep: she drifts toward the land until she is stopped or runs aground.
const ANCH = {maxDepth:40, minDepth:4, clear:0.15, hold:0.9, gale:1.4, rate:0.6, reset:0.15, plan:{ring:[0.4, 0.9, 1.6, 2.6, 4, 6, 9, 13], bearings:16}};
// how the place lies: depth and shelter, and what the boat's own limits make of the weather there. Level: 0 sheltered, 1 some, 2 exposed.
function anchorSpot(p, boatType){
  let depth = 0, expo = 1, cd = 0; try { if (isLand(p)) return {ok:false, why:'land'}; depth = depthF(p); expo = rbil(MAPD.L.expo, p) / 255; cd = coastDist(p); } catch (e){ return {ok:false, why:'nomap'}; }
  if (depth < ANCH.minDepth) return {ok:false, why:'shallow', depth};
  if (depth > ANCH.maxDepth) return {ok:false, why:'deep', depth};
  if (cd < ANCH.clear) return {ok:false, why:'near', depth};
  return {ok:true, depth, expo, cd, level:expo < 0.25 ? 0 : expo < 0.55 ? 1 : 2};
}
const anchorWhy = {land:['Det er land her.', 'That is land.'], shallow:['For grunt til å ankre.', 'Too shallow to anchor.'], deep:['For dypt til å ankre (over ' + ANCH.maxDepth + ' m).', 'Too deep to anchor (over ' + ANCH.maxDepth + ' m).'], near:['For nær land: ankeret trenger svingrom.', 'Too near the land: the anchor needs room to swing.'], nomap:['Kartet er ikke lastet her ennå.', 'The chart is not loaded here yet.']};
// the load on the ground tackle at a place with a given wind and sea (the boat's own limits)
function anchorLoad(W, hs, expo){ const r = BOAT.risk; return Math.max(W * (0.7 + 0.3 * (expo == null ? 1 : expo)) / r[2], hs / r[0]); }
// the weather the boat would get over the next hours at a place, as a load
function anchorForecast(p, H, hours, spot){
  const sp = spot || anchorSpot(p); let m = 0;
  for (let k = 0; k <= Math.ceil(hours); k++){ m = Math.max(m, anchorLoad(windAt(H + k), hsAt(p, H + k), sp.expo)); }
  return m;
}
// the anchor alarm: a drag sounds it (06e hooks.onAnchorAlarm: the siren, the flashing light in 3D, the toast); a player asleep aboard is
// woken by the same ring as the bridge watch alarm (15-energy.js: ACK to stop it)
function anchorAlarm(kind, n){
  if (typeof asleep === 'function' && asleep() && S.sleep && S.sleep.alarmAt == null) S.sleep.alarmAt = S.t;
  if (typeof hooks !== 'undefined' && hooks.onAnchorAlarm) hooks.onAnchorAlarm(kind, n);
}
function anchorAwake(){ return (meAboard() && !(typeof asleep === 'function' && asleep())) || crewAboard().some(c => !c.sleepW && !c.rest); }
function dropAnchor(auto){
  const b = S.boat; if (b.status === 'port' || b.anch) return false;
  const sp = anchorSpot(b.pos); if (!sp.ok){ const w = anchorWhy[sp.why] || anchorWhy.nomap; if (!auto) toast(gL(w[0], w[1])); return false; }
  if (b.gop) gopAbort('anchor');
  S.plan = null; b.status = 'idle'; b.v = 0; b.fishUntil = null;
  b.anch = {x:b.pos.x, y:b.pos.y, t0:S.t, depth:Math.round(sp.depth), expo:sp.expo, drags:0};
  log('Kastet anker på ' + Math.round(sp.depth) + ' m' + (sp.level === 0 ? ', godt skjermet.' : sp.level === 1 ? ', noe åpent.' : ', åpent og utsatt.'), 'Dropped anchor in ' + Math.round(sp.depth) + ' m' + (sp.level === 0 ? ', well sheltered.' : sp.level === 1 ? ', somewhat open.' : ', open and exposed.'));
  return true;
}
function weighAnchor(silent){ const b = S.boat; if (!b.anch) return false; b.anch = null; if (!silent) log('Hev anker.', 'Weighed anchor.'); return true; }
// a minute at anchor: the hourly risk, spread over the minutes (called from vesselStep)
function anchorTick(H, W, hs){
  const b = S.boat, a = b.anch; if (!a) return;
  if (!['idle', 'fishing'].includes(b.status) || S.plan){ b.anch = null; return; }
  const load = anchorLoad(W, hs, a.expo);
  if (load <= ANCH.hold) return;
  const deepF = 1 + Math.max(0, a.depth - 20) / 40, p = clamp((load - ANCH.hold) * ANCH.rate * deepF, 0, 0.95) / 60;
  if (Math.random() >= p) return;
  a.drags++; anchorAlarm(load > ANCH.gale ? 'gale' : 'drag', a.drags);
  const h = (windDir(H) - gridGamma(b.pos) + 180) * Math.PI / 180, d = ANCH.reset, to = {x:b.pos.x + Math.sin(h) * d, y:b.pos.y - Math.cos(h) * d};
  let blocked = true; try { blocked = isLand(to) || !!groundCheck(b.pos, to); } catch (e){}
  if (anchorAwake()){
    if (load > ANCH.gale){ b.anch = null; log('Ankeret slepper i kuling. Hiver og går til nærmeste kai.', 'The anchor is dragging in a gale. Weighing and heading for the nearest quay.'); if (typeof shelterReturn === 'function') shelterReturn(W, 0); return; }
    if (!blocked){ b.pos = to; a.x = to.x; a.y = to.y; }
    for (const c of crewAboard()) c.fatigue = Math.min(100, (c.fatigue || 0) + 6);
    if (meAboard() && typeof S.energy === 'number') S.energy = Math.max(0, S.energy - 3);
    log('Ankeret slepte. Kastet på nytt 150 m nedstrøms (' + a.drags + ').', 'The anchor dragged. Dropped again 150 m downwind (' + a.drags + ').');
    return;
  }
  // nobody awake: she drifts toward the land until it stops her
  if (blocked){ b.anch = null; if (typeof runAground === 'function' && b.status !== 'aground' && isFinite(to.x)) runAground(b.pos); return; }
  b.pos = to; a.x = to.x; a.y = to.y; log('Ankeret slepper, og ingen er våkne.', 'The anchor is dragging, and nobody is awake.');
}
// the best place to anchor near a port for the plan to rest at: sheltered, the right depth, room to swing, near the port
function driftAnchorage(pid){
  const pt = portById(pid); if (!pt) return null; let best = null;
  for (const r of ANCH.plan.ring) for (let k = 0; k < ANCH.plan.bearings; k++){
    const a = k / ANCH.plan.bearings * Math.PI * 2, p = {x:pt.p.x + Math.sin(a) * r, y:pt.p.y - Math.cos(a) * r}, sp = anchorSpot(p);
    if (!sp.ok) continue; const score = sp.expo * 3 + r * 0.08 + Math.abs(sp.depth - 12) * 0.01;
    if (!best || score < best.score) best = {x:p.x, y:p.y, depth:Math.round(sp.depth), expo:sp.expo, level:sp.level, d:r, score};
  }
  return best;
}
// the player picks «anker» for a rest: the place is found once the chart is in, and stays until he chooses again
async function driftPickAnchorage(sess, done){
  const pt = portById(sess.near); if (!pt) return null;
  try { await mapNeed(pt.p, 14); } catch (e){}
  const sp = driftAnchorage(sess.near); sess.pos = sp ? {x:sp.x, y:sp.y} : null; if (done) done(sp); return sp;
}
