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
const ANCH = {maxDepth:40, minDepth:4, clear:0.15, hold:0.9, gale:1.4, rate:0.6, reset:0.15, fall:90, pay:30, plan:{ring:[0.4, 0.9, 1.6, 2.6, 4, 6, 9, 13], bearings:16}};
// how the place lies: depth and shelter, and what the boat's own limits make of the weather there. Level: 0 sheltered, 1 some, 2 exposed.
function anchorSpot(p, boatType){
  let depth = 0, expo = 1, cd = 0; try { if (isLand(p)) return {ok:false, why:'land'}; depth = depthF(p); expo = expoFar(p) / 255; cd = coastDist(p); } catch (e){ return {ok:false, why:'nomap'}; }
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
  for (let k = 0; k <= Math.ceil(hours); k++){ m = Math.max(m, anchorLoad(windAt(H + k, p), hsAt(p, H + k), sp.expo)); }
  return m;
}
// the anchor alarm: a drag sounds it (06e hooks.onAnchorAlarm: the siren, the flashing light in 3D, the toast); a player asleep aboard is
// woken by the same ring as the bridge watch alarm (15-energy.js: ACK to stop it)
function anchorAlarm(kind, n){
  if (typeof asleep === 'function' && asleep() && S.sleep && S.sleep.alarmAt == null) S.sleep.alarmAt = S.t;
  if (typeof hooks !== 'undefined' && hooks.onAnchorAlarm) hooks.onAnchorAlarm(kind, n);
}
function anchorAwake(){ return (meAboard() && !(typeof asleep === 'function' && asleep())) || crewAboard().some(c => !c.sleepW && !c.rest); }
// ---- the current (Fysikk 4 F8a, 10.11.2026; docs/planer/fysikk-4-sjo-og-skrog.md F8): the stream through the sounds, the tide's own
// stream along the coast, the coastal current and the wind's drift. So far only the anchored boat and the foam feel it (F8b, steg 42,
// gives it to the boat under way and adrift, and to the waves). m/s in the grid, x east and y south; made of the game's own map and
// tide, no measurements (Kartverket's current tables are not open).
//   The sounds (src/data/strom.json, tools/strom/strom.py): a sound with a basin inside it fills and empties through its narrowest
//   section, so the stream there is the basin's surface times the rate the tide rises or falls over the section, U = A dH/dt / (w d),
//   along its axis, in on the flood and out on the ebb, slack at high and low water. It slows as the channel widens away from the
//   narrowest point (the same water through a wider section) and is spent where the channel is three times as wide (ro out to sea, ri
//   in to the basin), and it is held under CUR.max (8 knots; Saltstraumen reaches 20, which the game does not take: the plan's own cap).
//   The tide's stream along the coast: small (under 0.2 knots), north along the coast and in toward where the land shelters on the
//   flood (the tide comes up the coast from the south), south and out on the ebb, along the shore near land.
//   The coastal current (Den norske kyststrømmen): 0.35 knots along the coast (the shore's own line, read 2 km round), the way the
//   current runs on the large scale: west along the south coast (south of 58.5° N), east along Finnmark (north of 70.3° N, east of
//   24° E), north up the rest (so it does not circle an island or turn about on a sound's midline); from a kilometre off the shore,
//   where the sea is open, out to about 20 km.
//   The wind drifts the top of the sea at 2 % of the wind, 20 degrees to the right of downwind (Ekman).
// Only the national core is read (the openness and the distance to land of what looks far), never the tiles' detail, so the current is
// the same whatever is loaded, and the chart can draw it far from the boat.
const CUR = {k:0.09, ref:0.76, wind:0.02, ekman:20, d:0.4, dc:2, shore:0.6, max:8 * 1852 / 3600, coast:0.18, spread:0.3, cell:10};
const STROM = (() => {
  const D = /*@include(data/strom.json)*/null, idx = new Map(); if (!D || !D.s) return {s:[], idx};   // (A: the basin the narrows fill)
  const c = D.cols, at = n => c.indexOf(n), s = D.s.map(r => ({x:r[at('x')], y:r[at('y')], ax:r[at('ax')], ay:r[at('ay')], w:r[at('w')], d:r[at('d')], A:r[at('A')], ro:r[at('ro')], ri:r[at('ri')], A0:at('A0') >= 0 ? r[at('A0')] : r[at('A')]}));
  // a grid of CUR.cell km: each sound in every cell its reach touches
  for (const q of s){ const R = 1.5 * Math.max(q.ro, q.ri) + 0.2 + q.w / 1000, k = CUR.cell;
    for (let i = Math.floor((q.x - R) / k); i <= Math.floor((q.x + R) / k); i++) for (let j = Math.floor((q.y - R) / k); j <= Math.floor((q.y + R) / k); j++){ const key = i * 100000 + j; if (!idx.has(key)) idx.set(key, []); idx.get(key).push(q); } }
  return {s, idx};
})();
// the sounds whose reach may touch p
function stromNear(p){ return STROM.idx.get(Math.floor(p.x / CUR.cell) * 100000 + Math.floor(p.y / CUR.cell)) || []; }
// the stream of one sound at p with the tide rising dh m an hour: m/s along its axis (+ into the basin), 0 outside its reach
function stromAt(q, p, dh){
  const dx = p.x - q.x, dy = p.y - q.y, s = dx * q.ax + dy * q.ay, n = -dx * q.ay + dy * q.ax, r = s >= 0 ? q.ri : q.ro, as = Math.abs(s);
  if (as > 1.5 * r + 0.2) return 0;
  const hw = q.w / 2000 + CUR.spread * as, g = 1 - sstep(0.8 * hw, 1.2 * hw + 0.03, Math.abs(n)); if (g <= 0) return 0;
  const U0 = q.A * 1e6 * dh / 3600 / (q.w * q.d), U = CUR.max * Math.tanh(U0 / CUR.max);
  return U * (q.w / 2000) / hw * (1 - sstep(r, 1.5 * r + 0.2, as)) * g;
}
// the way the coastal current runs on the large scale (true degrees): west along the south coast, east along Finnmark, else north
function curCoastWay(p){ const q = LL(p); return q.lat < 58.5 ? 270 : q.lat > 70.3 && q.lon > 24 ? 90 : 0; }
// the stream of the sounds at p with the tide rising dh m an hour (m/s, the grid's x and y): the sum, held under CUR.max (two sounds
// whose reaches meet carry their own water, but never more than the cap together)
function stromSum(p, dh){
  let x = 0, y = 0; for (const q of stromNear(p)){ const v = stromAt(q, p, dh); if (v){ x += v * q.ax; y += v * q.ay; } }
  const m = Math.hypot(x, y); if (m > CUR.max){ x *= CUR.max / m; y *= CUR.max / m; }
  return {x, y};
}
function curAt(p, H){
  const dh = (tideH(H + 0.25, p) - tideH(H - 0.25, p)) / 0.5, g = gridGamma(p) * RAD, d = CUR.d;
  // the way the flood runs: true north, turned in toward the shelter where the land gives it, along the shore near land
  let fx = Math.sin(-g), fy = -Math.cos(-g);
  const e = q => expoFar(q) / 255, ex = (e({x:p.x + d, y:p.y}) - e({x:p.x - d, y:p.y})) / (2 * d), ey = (e({x:p.x, y:p.y + d}) - e({x:p.x, y:p.y - d})) / (2 * d), eg = Math.hypot(ex, ey);
  if (eg > 1e-3){ const w = Math.min(2, eg / 0.2) / eg; fx -= ex * w; fy -= ey * w; }
  let n = Math.hypot(fx, fy) || 1; fx /= n; fy /= n;
  const cd = coastDistFar(p), cx = (coastDistFar({x:p.x + d, y:p.y}) - coastDistFar({x:p.x - d, y:p.y})) / (2 * d), cy = (coastDistFar({x:p.x, y:p.y + d}) - coastDistFar({x:p.x, y:p.y - d})) / (2 * d), cg = Math.hypot(cx, cy);
  if (cg > 1e-3){ let tx = -cy / cg, ty = cx / cg; if (tx * fx + ty * fy < 0){ tx = -tx; ty = -ty; } const w = clamp(1 - cd / CUR.shore, 0, 1); fx = fx * (1 - w) + tx * w; fy = fy * (1 - w) + ty * w; n = Math.hypot(fx, fy) || 1; fx /= n; fy /= n; }
  const u = Math.min(CUR.k, CUR.k * Math.abs(dh) / CUR.ref) * Math.sign(dh);
  // the coastal current: along the shore's line read 2 km round, the large scale's way
  let kx = 0, ky = 0, uk = 0;
  const lk = CUR.coast * sstep(0.5, 1.5, cd) * (1 - sstep(15, 22, cd)) * sstep(0.25, 0.6, expoFar(p) / 255);
  if (lk > 0){ const D2 = CUR.dc, ax = coastDistFar({x:p.x + D2, y:p.y}) - coastDistFar({x:p.x - D2, y:p.y}), ay = coastDistFar({x:p.x, y:p.y + D2}) - coastDistFar({x:p.x, y:p.y - D2}), ag = Math.hypot(ax, ay);
    if (ag > 1e-3){ const wb = (curCoastWay(p) - gridGamma(p)) * RAD, wx = Math.sin(wb), wy = -Math.cos(wb); kx = -ay / ag; ky = ax / ag; const dot = kx * wx + ky * wy;
      if (dot < 0){ kx = -kx; ky = -ky; } uk = lk * clamp(Math.abs(dot) / 0.3, 0, 1); } }
  // the sounds
  const sn = stromSum(p, dh);
  const U = windAt(H, p), a = (windDir(H, p) - gridGamma(p) + 180 + CUR.ekman) * RAD, uw = CUR.wind * U;
  const tx = u * fx + sn.x, ty = u * fy + sn.y, X = tx + uk * kx, Y = ty + uk * ky;
  // tide: what turns with the tide (the tide's own stream and the sounds'), its speed with the sign of the rise; snd the sounds' alone
  return {x:X + uw * Math.sin(a), y:Y - uw * Math.cos(a), sx:X, sy:Y, nx:sn.x, ny:sn.y, tide:Math.hypot(tx, ty) * (Math.sign(dh) || 1), snd:Math.hypot(sn.x, sn.y) * (Math.sign(dh) || 1), coast:uk, dh};
}
// ---- the ground tackle and how she lies to it ----
// Chain from 10 m (its size about 2.6 + 0.6 mm a metre of length, 0.022 d^2 kg a metre), on the smaller boats a rope with a few metres of
// chain; the scope 3.5 times the depth on chain and 5 on rope, at most what she carries (8 m a metre of length + 30 m) and never more than
// the room to swing (the land is at least ANCH.clear away, anchorSpot). Paid out as she falls back (30 m a minute after the anchor's fall),
// hauled by the windlass at 20 m a minute (by hand 10 on the small boats). The fairlead (the roller or the hawse) a third of her length
// forward of the point the game places her by, and a little over the water.
function anchorGear(type){
  const V = VESSELS[type] || VESSELS.skiff, L = V.len, chain = L >= 10, d = Math.round(clamp(2.6 + 0.6 * L, 6, 48)), kg = 0.022 * d * d;
  return {chain, d, w:(chain ? kg : 0.15 * kg) * 9.81 * 0.87, max:Math.round(clamp(8 * L + 30, 50, 330)), haul:L >= 9 ? 20 : 10, scope:chain ? 3.5 : 5, fair:L / 3, hf:0.6 + 0.07 * L, L};
}
// the horizontal reach of the rode from the anchor to the fairlead: out metres paid out, h from the bottom to the fairlead, a = the pull
// over the rode's weight a metre (the catenary's parameter): what lies on the bottom, and the hanging part's span; taut when it all hangs
function anchorReach(out, h, a){
  if (out <= h) return 0;
  if (!(a > 1e-3)) return out - h;
  const s = Math.sqrt(h * h + 2 * h * a);
  return s >= out ? Math.sqrt(out * out - h * h) : (out - s) + a * Math.asinh(s / a);
}
// the push on her lying head to it (N, the grid's x east and y south): the wind on her front, the current on her front under the water,
// the waves' drift over her breadth
function anchorForce(type, p, H){
  const cal = dynCal(type), P = cal.P, V = cal.V, g = gridGamma(p), U = windAt(H, p), aw = (windDir(H, p) - g + 180) * RAD;
  const Fw = 0.5 * DYN_AIR * 0.9 * P.AF * U * U, c = curAt(p, H), uc = Math.hypot(c.x, c.y), Fc = 0.5 * 1025 * 0.6 * V.beam * (P.Tm || 0.6 * V.draft) * uc * uc;
  let x = Fw * Math.sin(aw) + (uc > 1e-6 ? Fc * c.x / uc : 0), y = -Fw * Math.cos(aw) + (uc > 1e-6 ? Fc * c.y / uc : 0), Fs = 0, q = null;
  try { q = seaPartsNear(p, H); } catch (e){}
  if (q) for (const [h0, tp, from] of [[q.w, q.tp, q.dir], [q.sw, q.swTp, q.swDir]]){ if (!(h0 > 0.02) || !(tp > 0.3)) continue;
    const k = (2 * Math.PI / tp) ** 2 / 9.81, F = 0.5 * 1025 * 9.81 * (h0 * h0 / 16) * V.beam * Math.tanh(1.3 * k * P.T) ** 2, w = (from - g + 180) * RAD;
    x += F * Math.sin(w); y -= F * Math.cos(w); Fs += F; }
  return {x, y, Fw, Fc, Fs, U, cur:c};
}
function dropAnchor(auto){
  const b = S.boat; if (b.status === 'port' || b.anch) return false;
  const sp = anchorSpot(b.pos); if (!sp.ok){ const w = anchorWhy[sp.why] || anchorWhy.nomap; if (!auto) toast(gL(w[0], w[1])); return false; }
  if (b.gop) gopAbort('anchor');
  S.plan = null; b.status = 'idle'; b.v = 0; b.fishUntil = null; b.drv = null;
  // she lets it go from the bow, and the scope is what the depth asks, what she carries and the room she has to swing in
  const g = anchorGear(b.type), hd = b.heading || 0, at = {x:b.pos.x + Math.sin(hd) * g.fair / 1000, y:b.pos.y - Math.cos(hd) * g.fair / 1000};
  const depth = Math.round(sp.depth), h = depth + g.hf, room = Math.max(10, (sp.cd || ANCH.clear) * 1000 - 30 - g.L);
  const rode = Math.round(Math.max(h + 5, Math.min(g.max, Math.max(g.scope * depth, depth + 15), Math.sqrt(room * room + h * h))));
  b.anch = {x:at.x, y:at.y, t0:S.t, depth, expo:sp.expo, drags:0, rode, out:0, up:null, mv:null};
  log('Kastet anker på ' + depth + ' m, ' + rode + ' m ' + (g.chain ? 'kjetting' : 'tau') + (sp.level === 0 ? ', godt skjermet.' : sp.level === 1 ? ', noe åpent.' : ', åpent og utsatt.'), 'Dropped anchor in ' + depth + ' m, ' + rode + ' m of ' + (g.chain ? 'chain' : 'rope') + (sp.level === 0 ? ', well sheltered.' : sp.level === 1 ? ', somewhat open.' : ', open and exposed.'));
  return true;
}
// weighing takes the time the windlass (or the hands) need for the rode: she is held at anchor until it is up, and a route or the helm
// waits for it (anchorSwing ends it)
function weighAnchor(silent){
  const b = S.boat, a = b.anch; if (!a) return false; if (a.up != null) return true;
  a.up = S.t; if (a.out == null) a.out = a.rode || 0;
  if (!silent) log('Hiver anker.', 'Weighing anchor.');
  return true;
}
// the anchor's minutes to come up (for the buttons)
function anchorUpIn(){ const b = S.boat, a = b.anch; if (!a) return 0; return Math.ceil((a.out || 0) / anchorGear(b.type).haul); }
// a minute at anchor: the rode runs out after the drop and comes in when weighing; she lies where the push on her and the rode's
// catenary put her, head to it, and swings round the anchor as the wind and the current turn (the tide every six hours). She sheers a
// little to and fro in a wind, as boats at anchor do. The minute's move is b.anch.mv (the chart and the 3D view draw her along it),
// done at the start of the next, so she lies the same with the game closed
function anchorSwing(H){
  const b = S.boat, a = b.anch; if (!a) return;
  const m = a.mv; a.mv = null;
  if (m && m.t === S.t - 1){ b.pos = {x:b.pos.x + m.x, y:b.pos.y + m.y}; b.heading = m.hd; }
  const g = anchorGear(b.type), h = (a.depth || 10) + g.hf;
  // moved off it by something else (a tow, «Sitter båten fast?»): the anchor is not where she lies any more
  if (dist(b.pos, a) * 1000 > (a.rode || 4 * h) + g.L + 100){ b.anch = null; return; } if (a.rode == null){ a.rode = Math.round(Math.max(h + 5, Math.min(g.max, g.scope * (a.depth || 10)))); a.out = a.rode; }
  // (out0 is what was out at the minute's start, so the 3D view runs the rode in or out over the minute; up the minute after it is in)
  if (a.up != null){
    if ((a.out || 0) <= 0){ b.anch = null; log('Ankeret er oppe.', 'The anchor is up.'); return; }
    a.out0 = a.out; a.out = Math.max(0, a.out - g.haul);
  } else { a.out0 = a.out; if (a.out < a.rode) a.out = Math.min(a.rode, a.out < h ? Math.min(h, a.out + ANCH.fall) : a.out + ANCH.pay); }
  let F; try { F = anchorForce(b.type, b.pos, H); } catch (e){ return; }
  const T = Math.hypot(F.x, F.y), hd0 = b.heading || 0;
  // the way the push goes (with none she stays as she lies: the rode out astern of her bow)
  const dx = T > 1 ? F.x / T : -Math.sin(hd0), dy = T > 1 ? F.y / T : Math.cos(hd0);
  const X = anchorReach(a.out, h, T / g.w) / 1000, wsh = F.Fw / (F.Fw + F.Fc + F.Fs + 1);
  const per = 3 + g.L / 8, amp = (3 + 12 * wsh * sstep(2, 10, F.U)) * RAD, ph = amp * Math.sin(2 * Math.PI * S.t / per);
  const c = Math.cos(ph), s = Math.sin(ph), ux = dx * c - dy * s, uy = dx * s + dy * c;
  const tx = a.x + ux * (X + g.fair / 1000), ty = a.y + uy * (X + g.fair / 1000), th = Math.atan2(-ux, uy) + 0.4 * ph;
  const k = 1 - Math.exp(-1 / (1 + g.L / 20)), nx = b.pos.x + (tx - b.pos.x) * k, ny = b.pos.y + (ty - b.pos.y) * k;
  a.mv = {x:nx - b.pos.x, y:ny - b.pos.y, hd:((hd0 + dynAng(hd0, th) * k) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI), t:S.t};
}
// a minute at anchor: the hourly risk, spread over the minutes (called from vesselStep)
function anchorTick(H, W, hs){
  const b = S.boat, a = b.anch; if (!a) return;
  // a route, the helm or a trip: the anchor comes up first (anchorSwing), and she is held till then (vesselStep); adrift, aground or
  // with the engine stopped the anchor is let go of as before
  if (b.status === 'sailing' || (S.plan && ['idle', 'fishing'].includes(b.status))){ weighAnchor(true); return; }
  if (!['idle', 'fishing'].includes(b.status)){ b.anch = null; return; }
  if (a.up != null) return;
  const load = anchorLoad(W, hs, a.expo);
  if (load <= ANCH.hold) return;
  // a short scope (little room or deep water) holds worse
  const deepF = 1 + Math.max(0, a.depth - 20) / 40, scopeF = clamp(4 / Math.max(1, (a.rode || 4 * a.depth) / Math.max(1, a.depth)), 0.8, 1.5), p = clamp((load - ANCH.hold) * ANCH.rate * deepF * scopeF, 0, 0.95) / 60;
  if (Math.random() >= p) return;
  a.drags++; anchorAlarm(load > ANCH.gale ? 'gale' : 'drag', a.drags);
  const h = (windDir(H) - gridGamma(b.pos) + 180) * Math.PI / 180, d = ANCH.reset, to = {x:b.pos.x + Math.sin(h) * d, y:b.pos.y - Math.cos(h) * d};
  let blocked = true; try { blocked = isLand(to) || !!groundCheck(b.pos, to); } catch (e){}
  const move = () => { a.x += to.x - b.pos.x; a.y += to.y - b.pos.y; b.pos = to; a.mv = null; };
  if (anchorAwake()){
    if (load > ANCH.gale){ b.anch = null; log('Ankeret slepper i kuling. Hiver og går til nærmeste kai.', 'The anchor is dragging in a gale. Weighing and heading for the nearest quay.'); if (typeof shelterReturn === 'function') shelterReturn(W, 0); return; }
    if (!blocked) move();
    for (const c of crewAboard()) c.fatigue = Math.min(100, (c.fatigue || 0) + 6);
    if (meAboard() && typeof S.energy === 'number') S.energy = Math.max(0, S.energy - 3);
    log('Ankeret slepte. Kastet på nytt 150 m nedstrøms (' + a.drags + ').', 'The anchor dragged. Dropped again 150 m downwind (' + a.drags + ').');
    return;
  }
  // nobody awake: she drifts toward the land until it stops her
  if (blocked){ b.anch = null; if (typeof runAground === 'function' && b.status !== 'aground' && isFinite(to.x)) runAground(b.pos); return; }
  move(); log('Ankeret slepper, og ingen er våkne.', 'The anchor is dragging, and nobody is awake.');
}
// the best place to anchor near a port for the plan's big boats to rest at (06h-plan2-engine.js): sheltered, the right depth, room to swing, near the port
function driftAnchorage(pid){
  const pt = portById(pid); if (!pt) return null; let best = null;
  for (const r of ANCH.plan.ring) for (let k = 0; k < ANCH.plan.bearings; k++){
    const a = k / ANCH.plan.bearings * Math.PI * 2, p = {x:pt.p.x + Math.sin(a) * r, y:pt.p.y - Math.cos(a) * r}, sp = anchorSpot(p);
    if (!sp.ok) continue; const score = sp.expo * 3 + r * 0.08 + Math.abs(sp.depth - 12) * 0.01;
    if (!best || score < best.score) best = {x:p.x, y:p.y, depth:Math.round(sp.depth), expo:sp.expo, level:sp.level, d:r, score};
  }
  return best;
}
