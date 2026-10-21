// ===== MANUAL HELM (the user's wish 03.10.2026) =====
// With «Manuell styring» on in the settings, a throttle (ahead, neutral, astern; it stays where it is left) and a joystick (the rudder;
// it springs back) on the screen steer the boat themselves (ui/10d-helm.js). Touching them at sea takes over from a route or Autonav.
// The clock is the game's own (one for every player, the user 03.10.2026, so the helm cannot slow it): the boat moves every tick
// (200 ms) by the game seconds that have passed, with what the throttle and the rudder ask, gathers way and loses it as she does
// under a route (BOAT.accel a game minute),
// turns on the vessel's turning radius when she has way on (a little on the screw's wash when she has not), burns fuel by fuelLph,
// and runs aground by groundCheck like the simulation. Slow near a harbour, «Fortøy» moors her; in port «Kast loss» lets go with the
// hand on the helm. S.helm = {on, thr (-1..1), rud (-1..1), v (kn, negative astern), yaw (rad a game second)}.
const HELM = {t:0, nm:0};   // the wall time of the last helm step (ms), so the pose between ticks follows on; the distance for the tattoos
function helmOn(){ const b = S.boat; return !!(S.settings && S.settings.manual && S.helm && S.helm.on && !S.plan && b.status === 'sailing'); }
// game minutes per real minute (the pace S.mult is the admin's, for tests)
function simRate(){ return GAME_RATE * (WCLOCK.on ? 1 : (S.mult || 1)); }   // (one clock for everyone: no pace of one's own, core/01-world.js)
function helmCan(){ const b = S.boat; return !!(S.settings && S.settings.manual) && ['sailing', 'idle'].includes(b.status) && !b.gop && !sleepAlone(); }
// the controls were touched: the hand takes the helm (from a route, Autonav or lying still), at the speed she has
function helmTake(){
  const b = S.boat; if (!helmCan()) return false;
  if (b.anch){ weighAnchor(); toast(gL('Hiver ankeret først.', 'Weighing the anchor first.')); return false; }   // (06e-anchor.js: the helm when it is up)
  if (S.plan){ S.plan = null; log('Du tok roret. Ruta er stoppet.', 'You took the helm. The route is stopped.'); }
  if (!S.helm) S.helm = {on:false, thr:0, rud:0, v:0, yaw:0};
  const h = S.helm;
  if (!h.on || b.status !== 'sailing'){ h.on = true; h.v = b.status === 'sailing' ? (b.v || 0) : 0; h.thr = clamp(h.v / Math.max(1, BOAT.vmax), 0, 1); h.rud = 0; h.yaw = 0; }
  b.status = 'sailing'; b.fishUntil = null; HELM.t = Date.now();
  return true;
}
function helmOff(){ if (S.helm){ S.helm.on = false; S.helm.thr = 0; S.helm.rud = 0; S.helm.v = 0; S.helm.yaw = 0; } }
// one step of dt real seconds (from the tick), dt x the rate in game seconds; the turn at most half a radian a real second, so the
// wheel does not spin her round on the screen's quick time
function helmStep(dt){
  // the manoeuvring model (16b-dyn.js) moves her with the throttle and the rudder, in game seconds
  const b = S.boat, h = S.helm; dt = Math.min(dt, 20) * simRate(); HELM.t = Date.now();
  if (b.fuel <= 0){ b.fuel = 0; b.status = 'adrift'; b.v = 0; h.v = 0; log('Tom for drivstoff. Båten driver.', 'Out of fuel. The boat is adrift.'); return; }
  DYN.on = true; const d = dynState(b); DYN.b = b; dynHelm(d, dt);
}
// where she is between ticks: on along her course at her speed, turning at her rate
function helmPose(frac){
  if (dynLive()) return dynLivePose(frac);
  const b = S.boat, h = S.helm, s = Math.min(0.5, (Date.now() - HELM.t) / 1000) * simRate(), hd = b.heading + h.yaw * s, d = h.v * NM / 3600 * s;
  return {p:{x:b.pos.x + Math.sin(hd) * d, y:b.pos.y - Math.cos(hd) * d}, hd, frac};
}
// the places to lie within r km of p, nearest first: a harbour (its berth or its harbour point), Father's naust or a rorbu's quay
// (07d-rorbu.js; Jonas 05.10.2026: «Det må også være mulig å fortøye i kaia, for å hvile»): [{id, name, x, y (where the way there
// ends), d, berth, kind}]. All of them, so the dock can offer the plant a few hundred metres off and not only the rorbu she just left
// (tilbakemelding #23)
function moorAll(p, r){
  const t = S.boat.type || 'skiff', out = [];
  const take = (id, name, at, d, berth, kind) => { if (d < r) out.push({id, name, x:at.x, y:at.y, d, berth, kind}); };
  for (const q of PORTS){ if (dist(p, q.p) > r + 0.5) continue; const bp = berthPose(q.id, t); take(q.id, q.name, q.p, bp ? Math.min(dist(p, bp), dist(p, q.p)) : dist(p, q.p), undefined, 'port'); }
  const nt = naustTarget(p, r); if (nt) take(nt.port, S.lang === 'en' ? 'the boathouse' : 'naustet', nt, dist(p, nt), 'naust', 'naust');
  for (const R of rorbuSites(p, r + 0.1)){ const bp = berthPose(R.id, t, 'main'); if (bp) take(R.id, (S.lang === 'en' ? 'the rorbu at ' : 'rorbua i ') + R.name, R.p, dist(p, bp), undefined, 'rorbu'); }
  return out.sort((a, b) => a.d - b.d);
}
const moorNear = (p, r) => moorAll(p, r)[0] || null;
// the place she can moor at under the hand: slow (under 3 knots), within 120 m
function helmMoorable(){
  if (!helmOn() || Math.abs(S.helm.v) > 3) return null;
  return moorNear(S.boat.pos, 0.12);
}
function helmMoor(){ const q = helmMoorable(); if (!q) return false; helmOff(); dock(q.id, q.berth); return true; }
// «Kast loss» with the hand on the helm: the lines come in, then she lies at the berth under your hand
function helmCast(){
  const b = S.boat; if (!(S.settings && S.settings.manual) || b.status !== 'port') return false;
  S.plan = null; if (!depart()) return false;
  S.helm = {on:true, thr:0, rud:0, v:0, yaw:0, berth:true}; return true;
}
// when the lines are in (vesselStep): she starts from where she lay, not from the harbour point
function helmCastDone(pid, kind){
  const h = S.helm; if (!h || !h.berth) return; h.berth = false;
  const b = S.boat, bp = berthPose(pid, b.type || 'skiff', kind) || berthPose(pid, b.type || 'skiff'); if (bp){ b.pos = {x:bp.x, y:bp.y}; b.heading = bp.hd; }
  HELM.t = Date.now();
}
