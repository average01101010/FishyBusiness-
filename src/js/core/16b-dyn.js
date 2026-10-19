// ===== HOW THE BOAT MOVES: a manoeuvring model (Fysikk 1; Jonas 18.10.2026) =====
// The player's own boat under way (a route, Autonav, or the hand on the helm) moves by a manoeuvring model with three degrees of
// freedom, surge u, sway v and yaw r in the hull's own frame (Fossen 2011, ch. 7): the hull's linear derivatives after Clarke, Gedling
// and Hine (1983) from the length, beam, draught and block coefficient; the rudder a lifting surface in the screw's race (so she steers
// a little in gear at a standstill, and the other way astern); the engine a thrust from the horsepower that falls off with speed, and
// a resistance that grows with the square of the speed, set so full throttle holds the vessel's top speed, and the sea's cap on it
// (speedCap). Every vessel is calibrated once from its own numbers (dynCal): the time to speed, the turning circle at full rudder (the
// rudder sized so the steady radius is the vessel's turnR, held between 1.2 and 2 lengths, where fishing boats lie), the way she
// needs to stop from every speed, and the Nomoto constants K and T the autopilot's gains come from.
// The autopilot (dynAuto) steers along the line the chart plotter draws: line of sight with a look-ahead point on the line, the rudder
// by the error in the course and the yaw rate, slower before sharp corners, braking for every stop so she stands exactly on it,
// astern out from the quay on the line (fenders and a hand on the quay do that, which the model has not got yet) and in to the harbour
// point, where the quay's lines take her alongside (3D moorStep). By hand (16-helm.js) the throttle and the rudder go straight into the
// same model.
// It runs in game time on every tick while the game is open (dynTick): what the player sees is the physics, GAME_RATE times faster than
// life, as the rest of the world is. Time caught up (the game was closed, a tab slept, an admin pace) and the company's other vessels
// keep the kinematic minute step (sail), which is what the model does on average. The state lives in S.boat.dyn (metres, radians, m/s)
// and is written back to b.pos, b.heading and b.v every tick, which is what the rest of the game reads.
const DYN = {on:false, b:null, cal:{}, line:null, dep:null, nm:0, hold:false, holdAt:0, debt:0, dbg:null};   // hold: the map round her is not in, she waits (as the minute step does) from holdAt; debt: the real seconds she waited, made up at double pace once it is in
const DYN_RUD = 35 * Math.PI / 180, DYN_H = 0.2, KN_MS = NM * 1000 / 3600;   // hard over; the integration step (game s); m/s a knot
const dynAng = (from, to) => { let d = (to - from) % (2 * Math.PI); if (d > Math.PI) d -= 2 * Math.PI; if (d < -Math.PI) d += 2 * Math.PI; return d; };
// the hull's numbers, from the vessel's own (02-species-gear.js)
function dynPar(V){
  const L = V.len, B = V.beam, T = V.draft, m = Math.max(300, (V.disp || 1) * 1000), rho = 1025;
  const Cb = clamp(m / (rho * L * B * T), 0.35, 0.75), k = Math.PI * (T / L) ** 2, BL = B / L, BT = B / T, TL = T / L;
  const q2 = 0.5 * rho * L * L, q3 = q2 * L, q4 = q3 * L, q5 = q4 * L;
  // Clarke's regressions (per unit of speed through the water: multiplied by U when used)
  const Yv = -k * (1 + 0.40 * Cb * BT) * q2, Yr = -k * (-0.5 + 2.2 * BL - 0.080 * BT) * q3;
  const Nv = -k * (0.5 + 2.4 * TL) * q3, Nr = -k * (0.25 + 0.039 * BT - 0.56 * BL) * q4;
  const Yvd = -k * (1 + 0.16 * Cb * BT - 5.1 * BL * BL) * q3, Nrd = -k * (1 / 12 + 0.017 * Cb * BT - 0.33 * BL) * q5;
  const mx = m * 1.05, my = m + Math.max(0, -Yvd), Iz = m * (0.25 * L) ** 2 + Math.max(0, -Nrd);
  // course stability: the regressions are for ships' hulls, and on a small boat with a keel they leave the sway-yaw coupling nearly
  // as big as the damping, so the rudder would spin her. The yaw damping is raised until the stability margin is half the damping
  // product (a fishing hull is steady on her course, if only just)
  const prod = Yv * Nr, X = Nv * (Yr - mx), kNr = Math.max(1, X / (0.5 * prod)), NrS = Nr * kNr;
  // the engine: thrust from the power at top speed, falling with speed; resistance quadratic with a little linear
  const umax = Math.max(1, V.vmax * KN_MS), Tmax = 0.55 * V.hp * 745.7 / umax, k2 = 0.65 * Tmax / (umax * umax), k1 = 0.03 * k2 * umax;
  // the rudder: area 2.5 % of L x T (fishing boats carry big rudders), lift slope of a low aspect ratio, 0.45 L abaft the pivot;
  // rs is the calibration's scale on it. Hard over at 35 degrees in 1.2 s + L/8 (a tiller flicks, a steering gear takes its time)
  const AR = 0.025 * L * T, Ydc = 0.5 * rho * AR * 1.8, xR = -0.45 * L, drate = DYN_RUD / (1.2 + L / 8);   // (lift slope 1.8 a radian: 1.1 at hard over, where a low rudder stalls)
  // a little nonlinear yaw damping, and the lateral acceleration a hull can take in a turn (planing boats more)
  const Nrr = -0.003 * q5, alat = (V.planing ? 0.45 : 0.25) * 9.81;
  return {L, B, T, m, mx, my, Iz, Yv, Yr, Nv, Nr:NrS, kNr, Nrr, umax, Tmax, k2, k1, Ydc, xR, drate, rs:1, alat};
}
// one step of h game seconds of the hull's own motion (u, v, r, the rudder dl), with the commands thr (-1..1) and rud (-1..1);
// capF scales the resistance up when the sea caps the speed. The damping terms are implicit, so the step is stable at any size.
function dynInt(P, s, thr, rud, h, capF){
  s.dl += clamp(clamp(rud, -1, 1) * DYN_RUD - s.dl, -P.drate * h, P.drate * h);
  thr = clamp(thr, -1, 1);
  const u = s.u, U = Math.max(Math.abs(u), 0.12 * P.umax);
  const Tx = thr >= 0 ? P.Tmax * thr * (1 - 0.35 * Math.max(0, u) / P.umax) : 0.6 * P.Tmax * thr * (1 - 0.35 * Math.max(0, -u) / P.umax);
  const R = P.k1 * u + P.k2 * capF * u * Math.abs(u);
  // the water over the rudder: the way she has and the screw's race (sign with the direction)
  const uR2 = u * Math.abs(u) + 0.35 * thr * P.umax * P.umax * (thr > 0 ? 1 : 0.5);
  const Yd = -P.Ydc * P.rs * s.dl * uR2, Nd = P.xR * Yd;   // the lift on a rudder put to starboard is to port: the stern goes to port, the bow to starboard
  s.u += h * (Tx - R + P.my * s.v * s.r) / P.mx;
  const vd = (P.Yr * U * s.r + Yd - P.mx * s.u * s.r) / P.my, va = -P.Yv * U / P.my;
  s.v = (s.v + h * vd) / (1 + h * va);
  const rd = (P.Nv * U * s.v + Nd) / P.Iz, ra = (-P.Nr * U + Math.abs(P.Nrr * s.r)) / P.Iz;
  s.r = (s.r + h * rd) / (1 + h * ra);
  const rcap = P.alat / Math.max(0.5, Math.abs(s.u)); s.r = clamp(s.r, -rcap, rcap);
}
// ... and where that takes her: X east, Y south (metres), psi the heading (grid, clockwise from north)
function dynMove(s, h){
  const c = Math.cos(s.psi), sn = Math.sin(s.psi);
  s.X += (s.u * sn + s.v * c) * h; s.Y -= (s.u * c - s.v * sn) * h; s.psi += s.r * h;
}
const dynZero = () => ({u:0, v:0, r:0, dl:0, psi:0, X:0, Y:0});
// the throttle that holds the speed u
function dynThrEq(P, u, capF){ return u <= 0 ? 0 : clamp((P.k1 * u + P.k2 * capF * u * u) / (P.Tmax * (1 - 0.35 * u / P.umax)), 0, 1); }
// ---- the calibration: measured on the model itself, once a vessel ----
function dynTurn(P, V){
  const s = dynZero(); s.u = V.vcruise * KN_MS; const thr = dynThrEq(P, s.u, 1), h = 0.1, rs = [];
  let t = 0, adv = null, tr = null, td = null;
  while (t < 1200 && s.psi < 3 * Math.PI){
    dynInt(P, s, thr, 1, h, 1); dynMove(s, h); t += h; rs.push(s.r);
    if (adv === null && s.psi >= Math.PI / 2){ adv = -s.Y; tr = s.X; }
    if (td === null && s.psi >= Math.PI) td = s.X;
  }
  const rss = s.r, uss = s.u, i63 = rs.findIndex(r => r >= 0.63 * rss), T = Math.max(0.3, (i63 < 0 ? rs.length : i63) * h);
  return {R:uss / Math.max(1e-6, rss), adv, tr, td, rss, uss, T, K:rss / DYN_RUD, Uc:V.vcruise * KN_MS, t};
}
function dynAccel(P){
  const b = P.k1 + 0.35 * P.Tmax / P.umax, ueq = (-b + Math.sqrt(b * b + 4 * P.k2 * P.Tmax)) / (2 * P.k2), s = dynZero(); let t = 0;
  while (s.u < 0.9 * ueq && t < 900){ dynInt(P, s, 1, 0, 0.1, 1); t += 0.1; }
  return {t90:t, ueq};
}
// how far she goes before she stands still from every speed, braking gently (a third astern), in steps of a quarter m/s
function dynStops(P){
  const out = [0]; for (let v = 0.25; v <= P.umax + 0.25; v += 0.25){ const s = dynZero(); s.u = v; let d = 0, t = 0; while (s.u > 0.05 && t < 600){ d += s.u * 0.1; dynInt(P, s, -0.3, 0, 0.1, 1); t += 0.1; } out.push(d); }
  return out;
}
function dynCal(key){
  if (DYN.cal[key]) return DYN.cal[key];
  const V = VESSELS[key] || VESSELS.skiff, P = dynPar(V), want = clamp(V.turnR || 2 * V.len, 1.2 * V.len, 2 * V.len);
  let lo = 0.02, hi = 20; for (let i = 0; i < 16; i++){ P.rs = Math.sqrt(lo * hi); if (dynTurn(P, V).R > want) lo = P.rs; else hi = P.rs; } P.rs = Math.sqrt(lo * hi);
  const turn = dynTurn(P, V), acc = dynAccel(P), stop = dynStops(P);
  // the autopilot's rudder: a second-order loop on Nomoto's K and T (at cruising speed; K grows and T shrinks with speed), not faster
  // than 0.6 rad/s so she does not flap the rudder, critically damped
  const wn = Math.min(1.2 / turn.T, 0.6), Kp = wn * wn * turn.T / turn.K, Kd0 = Math.max(0, (2 * wn * turn.T - 1) / turn.K);
  // the deceleration a skipper eases her down with before a corner or a stop: 60 % of what a third astern gives on average from
  // cruising speed, at most 0.08 m/s2 (0.25 for a planing hull, which comes off the plane quickly; at 6x on the screen the hard stop
  // looked like a jolt)
  const uc = V.vcruise * KN_MS, aC = clamp(0.6 * uc * uc / (2 * Math.max(1, dynStopDist({stop}, uc))), 0.02, V.planing ? 0.25 : 0.08);
  return DYN.cal[key] = {key, V, P, turn, acc, stop, Kp, Kd0, aC};
}
// the way to stop from the speed v, and the speed she can have with d metres to stop in
function dynStopDist(cal, v){ const S = cal.stop, i = Math.min(S.length - 2, Math.floor(Math.abs(v) / 0.25)), f = Math.abs(v) / 0.25 - i; return S[i] + (S[i + 1] - S[i]) * f; }
// easing down: the speed she may have with d metres to come down to vT, and the way she needs to ease down from v
const dynVEase = (cal, d, vT = 0) => Math.sqrt(vT * vT + 1.4 * cal.aC * Math.max(0, d));   // (planned at 70 % of aC: the margin the lever needs to follow it)
const dynEaseDist = (cal, v) => v * v / (1.4 * cal.aC);
function dynVStop(cal, d){ const S = cal.stop; if (d <= 0) return 0; let i = 1; while (i < S.length && S[i] <= d) i++; if (i >= S.length) return (S.length - 1) * 0.25; return ((i - 1) + (d - S[i - 1]) / Math.max(1e-6, S[i] - S[i - 1])) * 0.25; }
// ---- the state, in step with the boat the rest of the game reads ----
function dynState(b){
  let d = b.dyn; const fresh = !d;
  if (fresh) d = b.dyn = {u:0, v:0, r:0, dl:0, psi:0, X:0, Y:0, wall:0, key:null};
  // someone else moved her (a minute step while the model was not running, a tow, «Sitter båten fast?», a new vessel): start from there
  if (fresh || d.key !== b.type || Math.hypot(d.X - b.pos.x * 1000, d.Y - b.pos.y * 1000) > 4 || Math.abs(dynAng(d.psi, b.heading || 0)) > 0.3){
    d.X = b.pos.x * 1000; d.Y = b.pos.y * 1000; d.psi = b.heading || 0; d.u = (b.v || 0) * KN_MS; d.v = 0; d.r = 0; d.dl = 0; d.thr = null; d.key = b.type;
    // the line she followed stays when it is the same plan and she is still on it (a stall of slow frames, not a move)
    const T = DYN.line; if (!(T && T.plan === S.plan && T.n === (S.plan ? S.plan.wps.length : -1) && (() => { T.s = dynLineProj(T, d.X, d.Y, 0, 1e9); const q = dynLineAt(T, T.s); return Math.hypot(q[0] - d.X, q[1] - d.Y) < 30; })())) DYN.line = null;
  }
  return d;
}
function dynWrite(b, d){
  d.psi = ((d.psi % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  b.pos = {x:d.X / 1000, y:d.Y / 1000}; b.heading = d.psi; b.v = Math.abs(d.u) / KN_MS; d.wall = Date.now();
}
// the model has the boat: the tick runs it, the minute step leaves her be (sail), the chart and the 3D view draw its pose
function dynCan(){
  const b = S.boat; if (!DYN.on || typeof SIMREADY === 'undefined' || !SIMREADY || simRate() > 12 || b.status !== 'sailing') return false;
  if (helmOn()) return !sleepAlone();
  return !!(S.plan && S.plan.wps.length > S.plan.idx);
}
function dynLive(){ const b = S.boat; return DYN.on && b === DYN.b && !!b.dyn && b.status === 'sailing'; }
// (time caught up, more than ten minutes behind the world's clock after a freeze or a long wait for the map, plays the kinematic
// minute step with the model off (tick): she keeps the world's clock, and the model starts again from where that put her)
// where she is now, a little on from the last tick (km, radians, m/s): for the chart plotter and the 3D view
// (waiting for the map, she stands where the last frame had her: the way on from the tick is frozen at the hold, never taken back)
function dynPose(){
  const d = S.boat.dyn, s = clamp(((DYN.hold ? DYN.holdAt : Date.now()) - d.wall) / 1000, 0, 0.5) * simRate(), c = Math.cos(d.psi), sn = Math.sin(d.psi);
  const X = d.X + (d.u * sn + d.v * c) * s, Y = d.Y - (d.u * c - d.v * sn) * s, psi = d.psi + d.r * s;
  return {x:X / 1000, y:Y / 1000, hd:psi, cog:Math.abs(d.u) > 0.3 ? psi + Math.atan2(d.v, Math.abs(d.u)) : psi, u:d.u, v:d.v, r:d.r, spd:Math.abs(d.u)};
}
// the model has just stopped her and nothing else has moved her since (not a minute step caught up, not «Sitter båten fast?»): the 3D
// view stands where the model left her for the moment before it takes the simulation's spot (view3d updateBoat)
function dynRest(){ const b = S.boat, d = b.dyn; return !!d && Date.now() - d.wall < 4000 && Math.hypot(d.X - b.pos.x * 1000, d.Y - b.pos.y * 1000) < 5; }
function dynLivePose(frac){ const q = dynPose(); return {p:{x:q.x, y:q.y}, hd:q.hd, frac, idx:S.plan ? S.plan.idx : 0}; }
// «Stopp»: how far ahead (km) she needs to come to a gentle stop from the way she has
function dynHaltNeed(){ const b = S.boat; if (!dynLive()) return 0; return (dynEaseDist(dynCal(b.type), Math.max(0, b.dyn.u)) + 5) / 1000; }
// ---- the tick ----
function dynTick(dt){
  const b = S.boat; DYN.on = true;
  if (!dynCan()){ DYN.b = null; DYN.hold = false; return; }
  const d = dynState(b); DYN.b = b;
  // the map round her is not in yet: she waits where she is, as the minute step does (the 3D view keeps her, no follower takes over)
  // (the time she waited, up to twenty seconds, is made up at double pace once the map is in: no jump, and she keeps the world's clock
  // as nearly as the minute step does)
  if (typeof simAreaReady === 'function' && !simAreaReady()){ if (!DYN.hold){ DYN.hold = true; DYN.holdAt = Date.now(); } DYN.debt = Math.min(DYN.debt + dt, 20); return; }
  DYN.hold = false;
  const dtR = Math.min(dt, 20), pay = Math.min(DYN.debt, dtR), dtG = (dtR + pay) * simRate(); DYN.debt -= pay;   // a stall longer than twenty seconds is lost (the minute steps go on without moving her)
  if (helmOn()) dynHelm(d, dtG); else dynAuto(d, dtG);
}
// the minute step while the model has her: the fuel, the detours round obstacles, the distance for the tattoos; nothing moves her
function dynMinute(H, W){
  const b = S.boat, pl = S.plan;
  if (b.fuel <= 0){ b.fuel = 0; b.status = 'adrift'; b.v = 0; log('Tom for drivstoff. Båten driver.', 'Out of fuel. The boat is adrift.'); return; }
  if (!DYN.hold) b.fuel = Math.max(0, b.fuel - fuelLph(b.v || 0, W) / 60);   // (held for the map, or a minute caught up without moving her: no fuel)
  if (pl) obsSail(pl, b);
  if (meAboard() && DYN.nm){ tatAdd('nm', DYN.nm); DYN.nm = 0; }
}
// ---- by hand (16-helm.js): the throttle and the rudder into the model ----
function dynHelm(d, dtG){
  const b = S.boat, h = S.helm, cal = dynCal(b.type), P = cal.P, H = S.t / 60;
  if (Math.abs(h.v * KN_MS - d.u) > 0.6) d.u = h.v * KN_MS;   // set from outside (a test, «Fortøy» undone): the model takes it
  const cap = speedCap(hsAt(b.pos, H)) * KN_MS, capF = Math.max(1, (P.umax / Math.max(0.3, cap)) ** 2), X0 = d.X, Y0 = d.Y;
  for (let left = dtG; left > 1e-6;){ const s = Math.min(DYN_H, left); left -= s; dynInt(P, d, h.thr, h.rud, s, capF); dynMove(d, s); }
  if (!h.thr && Math.abs(d.u) < 0.04){ d.u = 0; }
  // land: over 3 knots she runs aground on it, slower she comes to a stop against it (every 10 m, then the thin breakwaters, then
  // the depth under her)
  const a = {x:X0 / 1000, y:Y0 / 1000}, to = {x:d.X / 1000, y:d.Y / 1000}, dd = Math.hypot(d.X - X0, d.Y - Y0) / 1000;
  if (dd){ const n = Math.max(1, Math.ceil(dd / 0.01)); let last = a;
    for (let i = 1; i <= n; i++){ const q = {x:a.x + (to.x - a.x) * i / n, y:a.y + (to.y - a.y) * i / n};
      if (isLand(q)){ if (Math.abs(d.u) > 3 * KN_MS){ dynWrite(b, d); runAground(last); helmOff(); } else { d.X = last.x * 1000; d.Y = last.y * 1000; d.u = 0; d.v = 0; dynWrite(b, d); h.v = 0; } return; } last = q; }
    if (coastSegHit(a, to)){ if (Math.abs(d.u) > 3 * KN_MS){ dynWrite(b, d); runAground(a); helmOff(); } else { d.X = X0; d.Y = Y0; d.u = 0; d.v = 0; dynWrite(b, d); h.v = 0; } return; }
    const gp = groundCheck(a, to); if (gp){ dynWrite(b, d); runAground(gp); helmOff(); return; } }
  dynWrite(b, d); h.v = d.u / KN_MS; h.yaw = d.r;
  b.fuel = Math.max(0, b.fuel - fuelLph(Math.abs(h.v), windAt(H)) / 3600 * dtG);
  HELM.nm += dd / NM; if (HELM.nm > 0.05 && meAboard()){ tatAdd('nm', HELM.nm); HELM.nm = 0; }
}
// ---- the line she follows: out from the quay, the route's waypoints as the chart plotter draws them, to the harbour she ends in ----
const dynSig = pl => pl.wps.length + ':' + pl.wps.map(w => w.x.toFixed(5) + ',' + w.y.toFixed(5) + (w.port || '')).join(';');
function dynLineBuild(pl, dep){
  const b = S.boat, P = [], wpAt = [];
  const add = (x, z) => { const q = P[P.length - 1]; if (!q || Math.hypot(q[0] - x, q[1] - z) > 0.3) P.push([x, z]); };
  let back = 0, hd0 = null, iOut = 0;
  // (from Father's naust straight out to the route's first point: the harbour point is the plant's, tilbakemelding #20)
  if (dep){ const pt = portById(dep.pid), w0 = pl.wps[pl.idx], from = dep.naust && w0 ? w0 : pt && pt.p; let W = from ? berthPath(from, dep.bp).reverse() : [dep.bp];
    // from the last turn out from the quay straight on to the route when that is clear (Senjahopen: the harbour point lies by the berth)
    const w1 = pl.wps[pl.idx]; if (W.length > 2 && w1 && berthClear(W[W.length - 2], w1, (dep.bp.Bb || 3) / 2)) W = W.slice(0, -1);
    for (const q of W) add(q.x * 1000, q.y * 1000); hd0 = dep.bp.hd; iOut = P.length - 1;
    if (P.length > 1) back = Math.hypot(P[1][0] - P[0][0], P[1][1] - P[0][1]); }
  else add(b.pos.x * 1000, b.pos.y * 1000);
  // up to the first harbour on it: she docks there and the route is over (arrive)
  let iEnd = pl.wps.length - 1; for (let i = pl.idx; i < pl.wps.length; i++) if (pl.wps[i].port){ iEnd = i; break; }
  for (let i = pl.idx; i <= iEnd; i++){ const w = pl.wps[i]; add(w.x * 1000, w.y * 1000); wpAt[i] = P.length - 1; }
  const L = [0]; for (let i = 1; i < P.length; i++) L.push(L[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]));
  const stops = []; for (let i = pl.idx; i <= iEnd; i++) if (wpStop(pl.wps[i]) && wpAt[i] != null) stops.push({i, s:L[wpAt[i]]});
  // the corners: where the line turns, by how much
  const corners = []; for (let i = 1; i < P.length - 1; i++){ const a = Math.atan2(P[i][0] - P[i - 1][0], -(P[i][1] - P[i - 1][1])), c = Math.atan2(P[i + 1][0] - P[i][0], -(P[i + 1][1] - P[i][1])), th = Math.abs(dynAng(a, c)); if (th > 0.2) corners.push({s:L[i], th}); }
  return {plan:pl, n:pl.wps.length, sig:dynSig(pl), chk:0, P, L, end:L[L.length - 1], wpAt, stops, corners, iEnd, back, turnL:Math.max(10, ((dep && dep.bp.Lb) || 8) * 1.5), hd0, sOut:L[iOut], s:0, gchk:0, ghit:null};
}
function dynLineAt(T, s){
  const L = T.L, n = L.length; if (n < 2) return T.P[0]; s = clamp(s, 0, T.end);
  let lo = 1, hi = n - 1; while (lo < hi){ const m = (lo + hi) >> 1; if (L[m] < s) lo = m + 1; else hi = m; }
  const a = T.P[lo - 1], c = T.P[lo], f = (s - L[lo - 1]) / Math.max(1e-6, L[lo] - L[lo - 1]); return [a[0] + (c[0] - a[0]) * f, a[1] + (c[1] - a[1]) * f];
}
// the leg (1..n-1) that s lies on, and a leg's heading
function dynSeg(T, s){ const L = T.L; let i = 1; while (i < L.length - 1 && L[i] < s) i++; return i; }
function dynSegHd(T, i){ const a = T.P[i - 1], c = T.P[i]; return Math.atan2(c[0] - a[0], -(c[1] - a[1])); }
function dynLineProj(T, x, z, s0, back = 30){
  let best = s0, bd = 1e18;
  for (let i = 1; i < T.P.length; i++){
    if (T.L[i] < s0 - back) continue; if (T.L[i - 1] > s0 + 4000) break;
    const a = T.P[i - 1], c = T.P[i], vx = c[0] - a[0], vz = c[1] - a[1], l2 = vx * vx + vz * vz || 1, u = clamp(((x - a[0]) * vx + (z - a[1]) * vz) / l2, 0, 1);
    const d = (x - a[0] - u * vx) ** 2 + (z - a[1] - u * vz) ** 2; if (d < bd){ bd = d; best = T.L[i - 1] + u * Math.sqrt(l2); }
  }
  return best;
}
// the heading along the line at s, the corners rounded a little (and out from the quay: astern first, turning over to the way out)
function dynLineHd(T, s, r0){
  const r = Math.max(2, r0), A = dynLineAt(T, s - r), C = dynLineAt(T, s + r);
  let hd = Math.hypot(C[0] - A[0], C[1] - A[1]) > 0.1 ? Math.atan2(C[0] - A[0], -(C[1] - A[1])) : null;
  if (hd !== null && T.back > 0 && T.hd0 != null) hd = T.hd0 + dynAng(T.hd0, hd) * clamp((s - T.back) / T.turnL, 0, 1) ** 2 * (3 - 2 * clamp((s - T.back) / T.turnL, 0, 1));
  return hd;
}
// ground on the line ahead, within the way she needs to stop and a little more: looked for once a second
function dynGroundAhead(T, s, look){
  const n = T.P.length; let a = dynLineAt(T, s), sa = s, i = 1; while (i < n && T.L[i] <= s) i++;
  for (; i < n && sa < s + look; i++){
    const c = sa + (T.L[i] - sa) > s + look ? dynLineAt(T, s + look) : T.P[i], gp = groundCheck({x:a[0] / 1000, y:a[1] / 1000}, {x:c[0] / 1000, y:c[1] / 1000});
    if (gp) return {gp, s:sa + Math.hypot(gp.x * 1000 - a[0], gp.y * 1000 - a[1])};
    a = c; sa = Math.min(T.L[i], s + look);
  }
  return null;
}
// ---- the autopilot ----
function dynAuto(d, dtG){
  const b = S.boat, pl = S.plan, cal = dynCal(b.type), P = cal.P, L = P.L, H = S.t / 60;
  let T = DYN.line;
  if (!T || T.plan !== pl || T.n !== pl.wps.length || ((T.chk = (T.chk + 1) % 30) === 0 && dynSig(pl) !== T.sig)){
    const dep = !T && DYN.dep && Math.hypot(DYN.dep.bp.x * 1000 - d.X, DYN.dep.bp.y * 1000 - d.Y) < 60 ? DYN.dep : null; DYN.dep = null;
    T = DYN.line = dynLineBuild(pl, dep); T.s = dep ? 0 : dynLineProj(T, d.X, d.Y, 0, 1e9);
  }
  const cap = speedCap(hsAt(b.pos, H)) * KN_MS, capF = Math.max(1, (P.umax / Math.max(0.3, cap)) ** 2);
  let vc = Math.min((pl.speed || BOAT.vcruise) * KN_MS, cap), near = 1e9; for (const q of PORTS){ const dq = dist(q.p, b.pos); if (dq < near) near = dq; }
  if (near < 0.25) vc = Math.min(vc, 5 * KN_MS);
  const X0 = d.X, Y0 = d.Y;
  for (let left = dtG; left > 1e-6;){
    const h = Math.min(DYN_H, left); left -= h;
    T.s = dynLineProj(T, d.X, d.Y, T.s);
    // waypoints passed on the way (not the stops: she must stand on those first)
    while (pl.idx < T.iEnd && T.wpAt[pl.idx] != null && !wpStop(pl.wps[pl.idx]) && T.s >= T.L[T.wpAt[pl.idx]] - 0.5){ const w = pl.wps[pl.idx]; if (arrive(w) || S.plan !== pl){ dynWrite(b, d); return; } }
    if (pl.idx >= pl.wps.length){ dynWrite(b, d); return; }
    // the next stop on the line, and what stands in the way before it
    const st = T.stops.find(q => q.i >= pl.idx); let sStop = st ? st.s : T.end, stopW = st ? pl.wps[st.i] : null;
    if (T.gchk-- <= 0){ T.gchk = Math.round(1 / h); try { T.ghit = T.s >= Math.max(T.back + T.turnL, T.sOut + T.turnL) ? dynGroundAhead(T, T.s, dynEaseDist(cal, Math.max(0, d.u)) + 40) : null; } catch (e){ T.ghit = null; } }
    const unsafe = pl.unsafe && pl.unsafe[pl.idx];
    // (the stop is 25 m short of it, also when that is behind her already: she then stops where she is and the replan runs; with a
    // floor a metre ahead of her she crept on at a tenth of a metre a second and never reached the stop, a route drawn straight into
    // land from a rorbu's berth left her lying «under way» for good, 19.10.2026)
    if (T.ghit && !unsafe && T.ghit.s - 25 < sStop){ sStop = T.ghit.s - 25; stopW = null; }
    const ds = sStop - T.s;
    // out from the quay: astern on the line, turning over to the way out, and on along it to the harbour point and round on to the
    // route, at a knot and a half, then three (not the model's: the fenders and a hand on the quay do that, and she has neither
    // yet; the turn at the harbour point is often a hairpin, which the old follower pivoted through too)
    const sScr = Math.max(T.back + T.turnL, T.sOut + T.turnL);
    if (T.back > 0 && T.s < sScr){
      const vS = T.s < T.back + T.turnL ? 0.8 : Math.min(1.5, 0.8 + (T.s - T.back - T.turnL) * 0.05), psi0 = d.psi; T.s = Math.min(T.s + vS * h, sScr + 0.01); const q = dynLineAt(T, T.s), hd = dynLineHd(T, T.s, 3);
      d.X = q[0]; d.Y = q[1]; if (hd !== null) d.psi = hd; d.u = T.s < T.back ? -vS : vS; d.v = 0; d.r = dynAng(psi0, d.psi) / h; d.dl = 0; continue;
    }
    // arrived at a harbour: within two lengths of its point and slow, the quay's lines take her the rest of the way (3D moorStep)
    if (stopW && stopW.port && ds < Math.max(2 * L, 10) && Math.abs(d.u) < 2.5){ dynWrite(b, d); if (arrive(stopW) || S.plan !== pl) return; continue; }
    // standing on a stop: exactly on it
    if (ds < 0.5 && (Math.abs(d.u) < 0.08 || ds < 0.05)){
      if (stopW){ d.X = stopW.x * 1000; d.Y = stopW.y * 1000; } d.u = d.v = d.r = 0; dynWrite(b, d);
      if (stopW){ if (arrive(stopW) || S.plan !== pl) return; T.s = dynLineProj(T, d.X, d.Y, T.s); continue; }
      if (T.ghit){ const gp = T.ghit.gp; T.ghit = null; if (!sailReplan(pl, b, gp)) runAground(gp); return; }
      if (T.s >= T.end - 1){ const w = pl.wps[pl.wps.length - 1];   // the end of the route (or «Stopp»): exactly on the point; arrive says so and clears the plan
        if (Math.hypot(w.x * 1000 - d.X, w.y * 1000 - d.Y) < 2){ d.X = w.x * 1000; d.Y = w.y * 1000; dynWrite(b, d); }
        if (arrive(w) || S.plan !== pl) return; }
    }
    // the speed: the route's, the sea's cap, slow near harbours, slower into sharp corners, and never more than she can stop from
    let vCmd = pl.replan ? 0 : vc;
    if (T.back > 0 && T.s < T.sOut + T.turnL + 20) vCmd = Math.min(vCmd, 3 * KN_MS);   // (just out from a quay: manoeuvring speed)
    const vBase = vCmd;
    for (const c of T.corners){ if (c.s <= T.s - 2 * L) continue; if (c.s > T.s + 600) break; const vTurn = Math.max(1.5 * KN_MS, vc * (1 - c.th / Math.PI)); if (c.s - T.s > -L) vCmd = Math.min(vCmd, dynVEase(cal, c.s - T.s - L, vTurn)); else vCmd = Math.min(vCmd, vTurn); }
    vCmd = Math.min(vCmd, dynVEase(cal, ds - 0.3));
    if (ds < 4) vCmd = Math.min(vCmd, Math.sqrt(2 * 0.12 * Math.max(0, ds - 0.25)) + 0.04);
    // (the lever goes over gradually, a quarter of its travel a game second, as a hand moves it)
    // the throttle for the acceleration that brings her to the commanded speed in three game seconds, and along the easing curve
    // when she is slackening off (the resistance she has at this speed counted in, so she follows the curve and does not lag it)
    const aDes = (vCmd - d.u) / 3 + (vCmd < vBase - 0.05 && d.u > 0.1 ? -0.7 * cal.aC : 0), F = P.mx * aDes + P.k1 * d.u + P.k2 * capF * d.u * Math.abs(d.u);
    const thrT = vCmd < 0.05 && d.u < 0.3 ? (d.u > 0.02 ? -0.15 : 0) : F >= 0 ? clamp(F / (P.Tmax * (1 - 0.35 * Math.max(0, d.u) / P.umax)), 0, 1) : clamp(F / (0.6 * P.Tmax), -0.6, 0);
    const thr = d.thr = d.thr == null ? thrT : d.thr + clamp(thrT - d.thr, -0.25 * h, 0.25 * h);
    // the rudder: line of sight on the leg she is on, or on the next one from where a turn on her own radius must begin to meet it
    // (so she cuts the corner by R(1/cos(th/2) - 1) and never swings outside); the course wanted is the leg's, bent towards it by
    // the cross-track error over a look-ahead of a radius and a half (stable: the heading loop is much faster than that)
    const Rt = Math.max(cal.turn.R, d.u * d.u / P.alat), n = T.P.length; let seg = dynSeg(T, T.s);
    // (the wheel goes over a response time before the arc must begin: Nomoto's T and half the rudder's travel, at the way she has)
    if (seg + 1 <= n - 1){ const th = Math.abs(dynAng(dynSegHd(T, seg), dynSegHd(T, seg + 1))), lead = Math.min(Rt * Math.tan(Math.min(th, 2.6) / 2) + Math.abs(d.u) * (cal.turn.T + 0.5 * DYN_RUD / P.drate), 0.5 * (T.L[seg] - T.L[seg - 1])); if (T.L[seg] - T.s < lead) seg++; }
    const sa = T.P[seg - 1], hdP = dynSegHd(T, seg), ye = (d.X - sa[0]) * Math.cos(hdP) + (d.Y - sa[1]) * Math.sin(hdP);
    const chi = Math.abs(d.u) > 0.3 ? d.psi + Math.atan2(d.v, d.u) : d.psi, chiD = hdP - Math.atan(ye / Math.max(1.5 * Rt, L));
    const Kd = cal.Kd0 * cal.turn.Uc / Math.max(0.25 * cal.turn.Uc, Math.abs(d.u)), rud = clamp((cal.Kp * dynAng(chi, chiD) - Kd * d.r) / DYN_RUD, -1, 1);
    dynInt(P, d, thr, rud, h, capF); dynMove(d, h);
    // the last creep on to a stop is the model's, held so she never runs past it
    if (ds < 4 && d.u > vCmd + 0.02) d.u = Math.max(vCmd + 0.02, d.u - cal.aC * h);
  }
  // what the model could not see: the last bit of land under her (a route the player drew through it, or a corner cut too fine)
  const a = {x:X0 / 1000, y:Y0 / 1000}, to = {x:d.X / 1000, y:d.Y / 1000}; let gp = null; try { gp = Math.hypot(d.X - X0, d.Y - Y0) > 0.01 ? groundCheck(a, to) : null; } catch (e){}
  if (gp){ if ((pl.unsafe && pl.unsafe[pl.idx]) || Math.abs(d.u) > 1.5){ dynWrite(b, d); runAground(gp); return; } d.X = X0; d.Y = Y0; d.u = 0; d.v = 0; }
  DYN.nm += Math.hypot(d.X - X0, d.Y - Y0) / 1000 / NM;
  dynWrite(b, d);
}
// for the 3D view's tests: the line and where she is on it, in the shape the old follower had (trackfollow.py)
function dynTrackView(){ const T = DYN.line; if (!T || !dynLive()) return null; const d = S.boat.dyn; return {s:T.s, v:Math.abs(d.u) * simRate(), end:T.end, done:false, n:T.P.length, P:T.P, back:T.back, sOut:T.sOut}; }
