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
function simRate(){ return GAME_RATE * (S.mult || 1); }
function helmCan(){ const b = S.boat; return !!(S.settings && S.settings.manual) && ['sailing', 'idle'].includes(b.status) && !b.gop && !sleepAlone(); }
// the controls were touched: the hand takes the helm (from a route, Autonav or lying still), at the speed she has
function helmTake(){
  const b = S.boat; if (!helmCan()) return false;
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
  const b = S.boat, h = S.helm, H = S.t / 60, rate = simRate(); dt = Math.min(dt, 1) * rate; HELM.t = Date.now();
  if (b.fuel <= 0){ b.fuel = 0; b.status = 'adrift'; b.v = 0; h.v = 0; log('Tom for drivstoff. Båten driver.', 'Out of fuel. The boat is adrift.'); return; }
  const cap = speedCap(hsAt(b.pos, H)), tgt = h.thr >= 0 ? h.thr * cap : h.thr * cap * 0.35, a = (BOAT.accel || 3) / 60;
  h.v += clamp(tgt - h.v, -a * 1.5 * dt, a * dt);
  if (!h.thr && Math.abs(h.v) < 0.05) h.v = 0;
  // the rudder bites with way on; in gear at a standstill the screw's wash turns her a little (astern the other way)
  const vm = h.v * 0.5144, ws = h.thr ? Math.sign(h.thr) * Math.max(0, 1 - Math.abs(vm)) * 0.8 : 0;
  h.yaw = clamp(h.rud * (vm + ws) / Math.max(4, BOAT.turnR || 40), -0.5 / rate, 0.5 / rate);
  const hd = b.heading + h.yaw * dt, d = h.v * NM / 3600 * dt, to = {x:b.pos.x + Math.sin(hd) * d, y:b.pos.y - Math.cos(hd) * d};
  b.heading = ((hd % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  // land: the simulation's ground check leaves it to the routes (legClear keeps them off it), but by hand she can be driven at it:
  // over 3 knots she runs aground there, slower she comes to a stop against it
  if (d){ const n = Math.max(1, Math.ceil(Math.abs(d) / 0.01)); let last = b.pos;
    for (let i = 1; i <= n; i++){ const q = {x:b.pos.x + (to.x - b.pos.x) * i / n, y:b.pos.y + (to.y - b.pos.y) * i / n}; if (isLand(q)){ if (Math.abs(h.v) > 3){ runAground(last); helmOff(); } else { b.pos = last; h.v = 0; b.v = 0; } return; } last = q; }
    // a breakwater thinner than the 10 m steps (01d-coast.js)
    if (coastSegHit(b.pos, to)){ if (Math.abs(h.v) > 3){ runAground(b.pos); helmOff(); } else { h.v = 0; b.v = 0; } return; } }
  const gp = d ? groundCheck(b.pos, to) : null;
  if (gp){ runAground(gp); helmOff(); return; }
  HELM.nm += Math.abs(d) / NM; if (HELM.nm > 0.05 && meAboard()){ tatAdd('nm', HELM.nm); HELM.nm = 0; }
  b.pos = to; b.v = Math.abs(h.v);
  b.fuel = Math.max(0, b.fuel - fuelLph(Math.abs(h.v), windAt(H)) / 3600 * dt);
}
// where she is between ticks: on along her course at her speed, turning at her rate
function helmPose(frac){
  const b = S.boat, h = S.helm, s = Math.min(0.5, (Date.now() - HELM.t) / 1000) * simRate(), hd = b.heading + h.yaw * s, d = h.v * NM / 3600 * s;
  return {p:{x:b.pos.x + Math.sin(hd) * d, y:b.pos.y - Math.cos(hd) * d}, hd, frac};
}
// the harbour she can moor in: slow (under 3 knots), within 80 m of its berth or 120 m of its harbour point
function helmMoorable(){
  if (!helmOn() || Math.abs(S.helm.v) > 3) return null;
  const b = S.boat, q = nearestPort(b.pos); if (!q) return null;
  const bp = berthPose(q.id, b.type || 'skiff'), d = bp ? Math.min(dist(b.pos, bp), dist(b.pos, q.p)) : dist(b.pos, q.p);
  return d < (bp ? 0.08 : 0.12) || dist(b.pos, q.p) < 0.12 ? q : null;
}
function helmMoor(){ const q = helmMoorable(); if (!q) return false; helmOff(); dock(q.id); return true; }
// «Kast loss» with the hand on the helm: the lines come in, then she lies at the berth under your hand
function helmCast(){
  const b = S.boat; if (!(S.settings && S.settings.manual) || b.status !== 'port') return false;
  S.plan = null; if (!depart()) return false;
  S.helm = {on:true, thr:0, rud:0, v:0, yaw:0, berth:true}; return true;
}
// when the lines are in (vesselStep): she starts from where she lay, not from the harbour point
function helmCastDone(pid){
  const h = S.helm; if (!h || !h.berth) return; h.berth = false;
  const b = S.boat, bp = berthPose(pid, b.type || 'skiff'); if (bp){ b.pos = {x:bp.x, y:bp.y}; b.heading = bp.hd; }
  HELM.t = Date.now();
}
