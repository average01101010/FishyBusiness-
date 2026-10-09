// ===== fleet: each vessel keeps its own state; the company holds the rest. The simulation steps through the vessels one at a
// time and binds S.boat, S.hold, S.crew and the others to the vessel it is working on, so the rest of the code is unchanged. =====
const VKEYS = ['meal', 'sayT', 'boat', 'plan', 'hold', 'crew', 'equip', 'jobs', 'cevt', 'ops', 'lic', 'quota', 'draft', 'draftSpeed', 'draftDep', 'marks', 'target', 'trail', 'fsess', 'facc', 'fnext', 'fishPlanH', 'workLog', 'clothes', 'tripBuff', 'prep', 'svcTold', 'boatName', 'lastSale', 'restWarn', 'kvRel', 'codWarn', 'lastIceWarn', 'navrows', 'tripOwner', 'pgear', 'cargo'];
function curVessel(){ return S.fleet.find(v => v.id === S.cur) || S.fleet[0]; }
function storeVessel(v){ for (const k of VKEYS) v[k] = S[k]; }
function bindVessel(v){ for (const k of VKEYS) S[k] = v[k]; S.cur = v.id; applyVessel(); }
function ensureFleet(){ if (!S.fleet || !S.fleet.length){ const v = {id:'v1'}; storeVessel(v); S.fleet = [v]; S.cur = 'v1'; } else bindVessel(curVessel()); if (!S.fleet.some(v => v.id === S.me)) S.me = S.cur; }
function withVessel(v, fn){ const c = curVessel(); if (v === c) return fn(); storeVessel(c); bindVessel(v); try { return fn(); } finally { storeVessel(v); bindVessel(c); } }
// log lines written while the fleet loop works on a vessel get its name, once the company has more than one
let VTAG = false;
function onVessel(v, fn){ const was = VTAG; VTAG = true; try { return withVessel(v, fn); } finally { VTAG = was; } }
function eachVessel(fn){ for (const v of S.fleet.slice()) onVessel(v, fn); }
// a vessel's own field; the bound vessel's live values are in S
function vget(v, k){ return v.id === S.cur ? S[k] : v[k]; }
function vesselById(id){ return S.fleet.find(v => v.id === id) || null; }
// ---- fleet rules (deltakerforskriften, J-30-2026): the company can have one vessel in the open group, and none there if it owns a
// vessel in the closed group. In the open group the owner must be aboard as skipper; S.me is the vessel you are aboard. ----
function openVesselId(){ if (S.fleet.some(v => vget(v, 'lic'))) return null; const v = S.fleet.find(x => (VESSELS[vget(x, 'boat').type] || {}).len < 11); return v ? v.id : null; }
// a waypoint where the boat stops: a port, fishing hours, or work with passive gear (set or haul)
function wpStop(w){ return !!(w.port || w.fish > 0 || w.act); }
function meAboard(){ return !S.me || S.me === S.cur; }
// what the bound vessel may land of cod, haddock and saithe: 'lukket' with a closed-group right, 'open' on the open-group vessel when
// the owner was aboard for the trip, otherwise 'none': bycatch only (J-30-2026 § 35)
function access(){ if (S.lic) return 'lukket'; return S.cur === openVesselId() && S.tripOwner !== false ? 'open' : 'none'; }
const BYCATCH = {share:0.1, cod:2000};
function vesselValue(v){ const b = vget(v, 'boat'), eq = vget(v, 'equip') || {}; return Math.round(VESSELS[b.type].price * 0.7 + (eq.motor90 ? EQUIP.motor90.price * 0.5 : 0) + licValue(vget(v, 'lic')) * 0.95); }
// a vessel added to the fleet: default state, in port with 40 % fuel; the bigger boats come with a plotter and VHF
const VNAMES = ['Kystværing', 'Nordlys', 'Vestfjord', 'Nordkyn', 'Havglimt', 'Skreien', 'Fjordbris', 'Straumen', 'Hekkingen', 'Kvitskjær'];
function newVesselObj(type, pid, lic){
  const d = newState(), V = VESSELS[type], p = portById(pid).p, n = Math.max(0, ...S.fleet.map(x => +String(x.id).slice(1) || 0)) + 1, v = {id:'v' + n};
  for (const k of VKEYS) v[k] = d[k];
  Object.assign(v.boat, {type, pos:{x:p.x, y:p.y}, port:pid, fuel:V.fuelCap * 0.4});
  v.trail = [{x:p.x, y:p.y, port:pid}]; v.lic = lic || null;
  for (const k of VESSELS[type].std || []) v.equip[k] = true;
  const used = S.fleet.map(x => vget(x, 'boatName'));
  v.boatName = VNAMES.find(nm => !used.includes(nm)) || 'Båt ' + n;
  S.fleet.push(v); if (!S.owned.includes(type)) S.owned.push(type);
  loreNewBoat(v.boatName);   // the yard lays a coin under the mast
  return v;
}
// ---- the yard's rebuilds, per boat (S.boat; the user's list 04.10.2026): a bigger hold in three steps, the last doubling it (more
// boxes, a longer hold: the weight shows in her stability and speed), priced on the boat's price
const HOLDUP = [{x:1.2, pc:0.03, h:8}, {x:1.4, pc:0.06, h:16}, {x:1.7, pc:0.10, h:32}];   // tuned down 08.10.2026 (was 1.25, 1.6, 2.0); not for the ocean vessels, whose tanks are fixed
const holdX = b => b && b.holdLv ? HOLDUP[b.holdLv - 1].x : 1;
const upPrice = pc => Math.max(5000, Math.round(VESSELS[S.boat.type || 'skiff'].price * pc / 1000) * 1000);
// the engine: a bigger one from the yard in two steps (+20 % and +40 % power; inboard engines, the outboard skiff has the 90 hp
// outboard instead), and the speed boosts sold in the Trim app (diesel engines; real money later, a test now). The power's gain in
// speed: a planing hull its square root, a displacement hull its cube root but held under +12 % by its hull speed. The effects of the
// boosts are our proposal (the user named them, not their effects): power +10 %, +8 % and +12 %, a tenth more acceleration each
// a bigger engine (Jonas 08.10.2026): +10 % and +20 % power, so a tenth or a fifth of the speed at most; it drinks more and the engine
// service costs more (svc), so it saves nothing the Trim boosts (+50 to +100 %) do. What it gives is a lasting, modest gain.
const ENGUP = [{p:0.1, pc:0.06, h:12, svc:1.2}, {p:0.2, pc:0.11, h:24, svc:1.5}];
const svcCostOf = b => { const V = VESSELS[b.type || 'skiff']; return Math.round(V.svcCost * (b.engLv && !V.outboard ? ENGUP[b.engLv - 1].svc : 1)); };
// the rest of the yard's upgrades, all about the boat itself (never the fishing gear), each in steps, priced as a share of the boat's
// price (upPrice) and fitted by what the boat has: cabins, galley and drying room only where there are bunks (berths), the hold and
// insulation not for the ocean vessels, a stabiliser from 9 m and the gyro from 25 m. b.upg = {key: step}. fx: what the step does.
const UPGS = {
  cabin:{no:'Lugarer', en:'Cabins', fit:V => V.berths > 0, d:['Bedre køyer, madrasser og skott. Mannskapet blir ikke så fort sliten på sjøen, og hviler bedre i pausene.', 'Better bunks, mattresses and bulkheads. The crew tire more slowly at sea and rest better in the breaks.'],
    steps:[{pc:0.03, h:8, no:'Bedre køyer', en:'Better bunks', fat:0.92}, {pc:0.06, h:16, no:'Lugarer med skott', en:'Cabins with bulkheads', fat:0.85}, {pc:0.10, h:24, no:'Egne lugarer', en:'Separate cabins', fat:0.78}]},
  galley:{no:'Messe og bysse', en:'Mess and galley', fit:V => V.berths > 0, d:['Større bysse og en ordentlig messe. Maten går fortere å lage, og mannskapet trives bedre om bord.', 'A larger galley and a proper mess. Meals are cooked faster and the crew are happier aboard.'],
    steps:[{pc:0.02, h:8, no:'Større bysse', en:'A larger galley', cook:24, mood:2}, {pc:0.04, h:16, no:'Messe', en:'A mess', cook:18, mood:4}, {pc:0.07, h:24, no:'Messe og kjøkken', en:'Mess and kitchen', cook:12, mood:6}]},
  dry:{no:'Tørkerom og bad', en:'Drying room and shower', fit:V => V.berths > 0, d:['Tørkerom for oljehyre og et bad. Mannskapet fryser mindre når det er kaldt og vått, og kommer varmere ut av vakten.', 'A drying room for oilskins and a shower. The crew feel the cold and wet less and come off watch warmer.'],
    steps:[{pc:0.02, h:8, no:'Tørkerom', en:'Drying room', cold:0.85}, {pc:0.04, h:16, no:'Tørkerom og bad', en:'Drying room and shower', cold:0.7}]},
  insul:{no:'Isolert lasterom', en:'Insulated hold', fit:V => V.cls !== 'hav' && V.iceCap > 0, d:['Isolasjon i lasterommet. Isen holder lenger, så du bruker mindre is per kilo fisk.', 'Insulation in the hold. The ice lasts longer, so you use less ice per kilo of fish.'],
    steps:[{pc:0.02, h:8, no:'Isolasjon', en:'Insulation', ice:0.85}, {pc:0.04, h:16, no:'Kjølt lasterom', en:'A chilled hold', ice:0.7}]},
  tank:{no:'Større drivstofftank', en:'A larger fuel tank', fit:V => !V.outboard && V.cls !== 'hav', d:['Ekstra tank. Lengre rekkevidde mellom bunkringene.', 'An extra tank. A longer range between refuellings.'],
    steps:[{pc:0.015, h:8, no:'Ekstra tank', en:'An extra tank', x:1.25}, {pc:0.03, h:16, no:'Stor tank', en:'A large tank', x:1.5}]},
  stab:{no:'Stabilisering', en:'Stabilisation', fit:V => V.len >= 9, d:['Slingrekjøl og, på de store båtene, gyrostabilisator. Båten mister mindre fart i sjø, og mannskapet har det bedre i dårlig vær.', 'Bilge keels and, on the big boats, a gyro stabiliser. The boat loses less speed in a sea and the crew cope better in bad weather.'],
    steps:[{pc:0.025, h:12, no:'Slingrekjøl', en:'Bilge keels', sea:0.9}, {pc:0.06, h:24, no:'Gyrostabilisator', en:'Gyro stabiliser', sea:0.78, minLen:25}]}
};
const upgLv = (b, k) => (b && b.upg && b.upg[k]) || 0;
const upgNext = (b, k) => { const U = UPGS[k], V = VESSELS[(b || S.boat).type || 'skiff'], st = U.steps[upgLv(b, k)]; return U.fit(V) && st && (!st.minLen || V.len >= st.minLen) ? st : null; };
// Trim (Jonas 05.10.2026): more speed for the boat for a while, sold for real money, the time in game hours. One at a time on a boat
// (a new one takes the place of the one on, b.trim {k, t0}), diesel engines only. x: top and cruising speed.
const BOOSTS = {pump:{x:1.5, h:24, nok:29, no:'Justert dieselpumpe', en:'Tuned injection pump'}, ic:{x:1.75, h:48, nok:39, no:'Ladeluftkjøling', en:'Charge air cooling'}, turbo:{x:2, h:72, nok:49, no:'Økt turbotrykk', en:'Higher boost pressure'}};
const canBoost = V => !!(V && V.diesel && !V.outboard);
const trimOn = b => { const T = b && b.trim && BOOSTS[b.trim.k]; return T && S.t < b.trim.t0 + T.h * 60 ? T : null; };
const trimLeft = b => trimOn(b) ? (b.trim.t0 + BOOSTS[b.trim.k].h * 60 - S.t) / 60 : 0;   // game hours
function powerX(b){ const V = VESSELS[b.type || 'skiff']; return 1 + (b.engLv && !V.outboard ? ENGUP[b.engLv - 1].p : 0); }
const speedOfPower = (P, planing) => planing ? Math.sqrt(P) : Math.min(1.12, Math.cbrt(P));
function applyVessel(){
  const b = S.boat; Object.assign(BOAT, VESSELS[b.type || 'skiff']);
  for (const k in EQUIP) if (EQUIP[k].boost && S.equip && S.equip[k] && equipFits(k, b.type || 'skiff')) Object.assign(BOAT, EQUIP[k].boost);
  const hx = holdX(b); BOAT.holdCap = Math.round(BOAT.holdCap * hx); BOAT.iceCap = Math.round(BOAT.iceCap * hx);
  // the yard's other upgrades (UPGS): what they change for the crew and the boat
  const fx = {}; for (const k in UPGS){ const lv = upgLv(b, k); if (lv && UPGS[k].fit(VESSELS[b.type || 'skiff'])) Object.assign(fx, UPGS[k].steps[lv - 1]); }
  BOAT.fx = fx; if (fx.x) BOAT.fuelCap = Math.round(BOAT.fuelCap * fx.x); if (fx.sea) BOAT.sea *= fx.sea; BOAT.svcCost = svcCostOf(b);
  const P = powerX(b); if (P > 1){ const sx = speedOfPower(P, BOAT.planing);
    BOAT.vmax *= sx; BOAT.vcruise *= sx; BOAT.fuelK *= 1 + 0.4 * (P - 1); BOAT.accel *= 1 + (b.engLv ? 0.3 * ENGUP[b.engLv - 1].p : 0); BOAT.hp = Math.round(BOAT.hp * P); }
  const T = canBoost(BOAT) && trimOn(b); if (T){ BOAT.vmax *= T.x; BOAT.vcruise *= T.x; BOAT.accel *= T.x; }
  b.fuel = Math.min(b.fuel, BOAT.fuelCap); b.ice = Math.min(b.ice, BOAT.iceCap);
}
// fishing effort per person: a hand jig (pilk and four fly hooks; there is no rod, and without a jig nobody fishes by hand); an
// electric jigging reel does about twice what a hand jig does, and one person tends up to three reels instead of jigging by hand.
// The hand jig and the reels are twice what they were (the user's test 04.10.2026: 350 kg in nine game hours was a long day for little money)
const JIG = {hand:2, machine:4.0, perPerson:3};
function effortOf(people, jk, hand){ return Math.max(0, people - Math.ceil(jk / JIG.perPerson)) * hand + jk * JIG.machine; }
function fishEffort(){
  // the people at the rail: those whose chain has them fishing (as if the boat were jigging where it lies)
  const hand = S.boat && S.boat.gear ? JIG.hand : 0, F = workTeam('fiske', 'juksa', 'fishing'), people = F.n, jk = Math.min(S.equip ? S.equip.jukse : 0, people * JIG.perPerson);
  if (S.plan && S.plan.ops && !meAboard()){ const sk = opsSkipper(); return effortOf(people, jk, hand) * (sk ? sk.skill : 0.8) * 0.9; }
  return effortOf(people, jk, hand) * F.eff;
}
// your own share of the effort when you jig by hand at the rail (the jig game takes it over, ui/10-rod-acts.js): 0 when you are not
// aboard, have no hand jig, or tend the reels
function jigMeShare(){
  const b = S.boat; if (!b || !b.gear || !meAboard()) return 0;
  const F = workTeam('fiske', 'juksa', 'fishing'), jk = Math.min(S.equip ? S.equip.jukse : 0, F.n * JIG.perPerson);
  if (F.n - Math.ceil(jk / JIG.perPerson) < 1) return 0;
  const tot = effortOf(F.n, jk, JIG.hand) * F.eff; return tot > 0 ? clamp(JIG.hand * meEff() / tot, 0, 1) : 0;
}
const GM = {E:1.05, A:1.0, B:0.85, X:0.6, V:0};

// deterministic noise
function hash(n){ n |= 0; n = Math.imul(n ^ (n >>> 16), 0x45d9f3b); n = Math.imul(n ^ (n >>> 16), 0x45d9f3b); n ^= n >>> 16; return (n >>> 0) / 4294967296; }
function h2(a, b){ return hash((Math.imul(a | 0, 374761393) ^ Math.imul((b | 0) + 1013, 668265263)) + (b | 0)); }
function vn(t, s){ const i = Math.floor(t), f = t - i, u = f * f * (3 - 2 * f); return h2(i, s) * (1 - u) + h2(i + 1, s) * u; }
function sstep(a, b, x){ const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); }
function seasonal(arr, H){
  const d = gDate(H), mf = d.getUTCMonth() + (d.getUTCDate() - 1) / 31 - 0.5;
  const i0 = Math.floor(mf), f = mf - i0, i = ((i0 % 12) + 12) % 12;
  return arr[i] * (1 - f) + arr[(i + 1) % 12] * f;
}

// weather: seasonal climate + low-pressure passages that travel up the coast (V4 of the weather plan; Jonas 09.10.2026: «vi må bygge
// ferdig værsystemene»). The lows come in from the sea in the south-west and go north-east along the coast, each on its own track
// and at its own speed, so a gale reaches Vestlandet first and Finnmark a day later, and one coast can be in a storm while another
// has calm. Where a place lies along the coast and off it (wxPlace) gives its own hour of every low and of the background weather.
// At Senja (WX_REF) the hours are as before; how strong each low is there varies with its track, and on average it is as before.
const WIND_MEAN = [9.2,9.0,8.4,7.0,6.0,5.4,5.0,5.4,6.8,7.8,8.6,9.0];
const STORM_P = [0.12,0.11,0.09,0.06,0.03,0.02,0.02,0.03,0.06,0.09,0.11,0.12];
// tests can hold the weather still: WX_FORCE = {w:11, d:180} (m/s, from degrees)
let WX_FORCE = null;
// the lows' road: a line off the coast from Lindesnes round Stad, past Helgeland, Lofoten and Troms to Nordkapp and Vardø. A place
// is measured along it (s, km from Lindesnes) and across it (c, km, + out to sea on the left of the way the lows go)
const WX_TRACK = [[57.9, 7.0], [59.3, 4.6], [62.2, 4.6], [65.2, 10.6], [67.6, 11.6], [69.4, 15.6], [70.6, 21.8], [71.3, 25.8], [70.6, 31.5]];
const WX_SYN = 45;   // km/h: how fast the background weather moves up the coast
let WXT = null;
function wxTrack(){
  if (WXT) return WXT;
  const pts = WX_TRACK.map(([a, b]) => P(a, b)), seg = []; let s0 = 0;
  for (let i = 0; i + 1 < pts.length; i++){ const a = pts[i], dx = pts[i + 1].x - a.x, dy = pts[i + 1].y - a.y, len = Math.hypot(dx, dy); seg.push({a, dx, dy, len, s0}); s0 += len; }
  WXT = {seg, tot:s0, ref:null};
  WXT.ref = wxMeasure(P(69.4, 17.5));
  // each low's strength at a place is its own (5-14 m/s) times how near its track and its deepest point are; scaled so the lows at
  // Senja are as strong as before on average
  let m = 0, n = 0; for (let k = 0; k < 4000; k++){ m += wxLowShape(k, WXT.ref); n++; } WXT.norm = n / m;
  return WXT;
}
function wxMeasure(p){
  const T = WXT; let best = null;
  for (const g of T.seg){ const t = clamp(((p.x - g.a.x) * g.dx + (p.y - g.a.y) * g.dy) / (g.len * g.len), 0, 1), qx = g.a.x + g.dx * t, qy = g.a.y + g.dy * t, d = Math.hypot(p.x - qx, p.y - qy);
    if (!best || d < best.d){ const z = g.dx * (p.y - g.a.y) - g.dy * (p.x - g.a.x); best = {d, s:g.s0 + t * g.len, c:z > 0 ? -d : d}; } }
  return {s:best.s, c:best.c};
}
let WXPQ = {k:'', v:null};
// where p lies for the weather (else the boat you follow; Senja before there is a game), kept for a 5 km cell
function wxPlace(p){
  const T = wxTrack(), q = p || herePos(); if (!q) return {s:T.ref.s, c:T.ref.c, dt:0, q:null};
  const k = Math.round(q.x / 5) + ':' + Math.round(q.y / 5); if (WXPQ.k === k) return WXPQ.v;
  const m = wxMeasure(q), v = {s:m.s, c:m.c, dt:(m.s - T.ref.s) / WX_SYN, q:{x:Math.round(q.x / 5) * 5, y:Math.round(q.y / 5) * 5}};
  WXPQ = {k, v}; return v;
}
// how much of low k reaches a place: more near its track (o, km out to sea, from 120 km inland to 400 km out) and near where along the
// coast it is deepest (a), and the side of the track the place is on
function wxLowShape(k, m){
  const T = WXT, o = -120 + h2(k, 106) * 520, a = (h2(k, 107) * 1.3 - 0.15) * T.tot;
  return (0.45 + 0.55 * Math.exp(-(((m.c - o) / 420) ** 2))) * (0.55 + 0.45 * Math.exp(-(((m.s - a) / 1400) ** 2)));
}
// the lows that pass a place near H: the hour they are deepest there (c), how strong (amp, m/s) and how long (w, hours), and whether
// the place is on the right of the track (the wind veers as it passes) or the left (it backs)
let STQ = {k0:NaN, q:null, v:null};
function stormsNear(H, p){
  const T = wxTrack(), q = wxPlace(p), k0 = Math.floor((H - q.dt) / 24);
  if (STQ.k0 === k0 && STQ.q === q) return STQ.v;   // the lows near a place depend only on the day and the place
  const out = [];
  for (let k = k0 - 3; k <= k0 + 3; k++){
    if (!(h2(k, 101) < STORM_P[gDate(k * 24).getUTCMonth()])) continue;
    const v = 38 + h2(k, 105) * 30, o = -120 + h2(k, 106) * 520;
    out.push({c:k * 24 + h2(k, 102) * 24 + (q.s - T.ref.s) / v, amp:(5 + h2(k, 103) * 9) * wxLowShape(k, q) * T.norm, w:5 + h2(k, 104) * 7, right:q.c < o ? 1 : -1, side:clamp((o - q.c) / 150, -1, 1)});
  }
  STQ = {k0, q, v:out}; return out;
}
// the windier and calmer stretches of the coast (the month's strongest wind in climate.json against Senja's, softened), Senja 1
function wxWindF(H, p){ return CLIM ? clamp(Math.pow(climRatio('wmax', H, p), 0.2), 0.92, 1.12) : 1; }
function windAt(H, p){
  if (WX_FORCE) return WX_FORCE.w;
  const q = wxPlace(p), Hl = H - q.dt, base = seasonal(WIND_MEAN, Hl);
  const n = 0.55 * vn(Hl / 30, 11) + 0.30 * vn(Hl / 9, 23) + 0.15 * vn(Hl / 3, 37);
  let storm = 0; for (const s of stormsNear(H, p)) storm += s.amp * Math.exp(-(((H - s.c) / s.w) ** 2));
  return Math.max(0.3, (base * (0.1 + 1.8 * n) + storm) * wxWindF(H, q.q));
}
// A low passing north-east along the coast: the wind backs to south ahead of it; on the right of its track it veers through
// south-west to north-west behind the cold front, on the left it backs through east to north (Buys Ballot's law). The turn follows
// the low's share of the wind
function windDir(H, p){
  if (WX_FORCE) return WX_FORCE.d;
  const q = wxPlace(p), Hl = H - q.dt, base = ((225 + 400 * (vn(Hl / 40, 55) - 0.5)) % 360 + 360) % 360;
  let sx = 0, sy = 0, sa = 0;
  for (const s of stormsNear(H, p)){ const u = (H - s.c) / s.w, a = s.amp * Math.exp(-u * u), r = 0.5 + 0.5 * s.side, t = Math.tanh(1.3 * u);
    const dR = (235 + 65 * t) * Math.PI / 180, dL = (85 - 65 * t) * Math.PI / 180;
    sx += a * (r * Math.sin(dR) + (1 - r) * Math.sin(dL)); sy += a * (r * Math.cos(dR) + (1 - r) * Math.cos(dL)); sa += a; }
  if (sa < 0.05) return base;
  const f = clamp(sa / windAt(H, p), 0, 1), b = base * Math.PI / 180, x = (1 - f) * Math.sin(b) + f * sx / sa, y = (1 - f) * Math.cos(b) + f * sy / sa;
  return ((Math.atan2(x, y) * 180 / Math.PI) % 360 + 360) % 360;
}
function exposure(p){ return 0.2 + 0.8 * rbil(MAPD.L.expo, p) / 255; }
// the waves (hsAt, hsOpen) are in 03b-sea.js
function fcErr(H, now, seed){ const ahead = Math.max(0, H - now), issue = Math.floor(now / 6); return (vn(H / 10, seed + issue) - 0.5) * 0.7 * Math.min(1, ahead / 48); }
function fcWind(H, now, p){ return windAt(H, p) * (1 + fcErr(H - wxPlace(p).dt, now - wxPlace(p).dt, 900)); }
const BF = [0.3,1.6,3.4,5.5,8.0,10.8,13.9,17.2,20.8,24.5,28.5,32.7];
function beaufort(W){ let b = 0; while (b < 12 && W >= BF[b]) b++; return b; }
const AIRT = [-2.5,-2.5,-1.5,1.5,5.5,9,12,11.5,8,3.5,0.5,-1.5];
// V1 of the weather plan (06.10.2026; Jonas: «Vi skal jo ikke ha ekte live-vær, men vi må kunne simulere været langs hele kysten på
// en god måte, med variasjoner fra sted til sted»). The climate at 19 points along the coast (src/data/climate.json from
// tools/climate/fetch.py: monthly means from ERA5 2006-2020 and Open-Meteo's marine API 2023-2025). The simulated weather keeps its own
// ups and downs and is moved by how the place differs from Senja, where the game was calibrated, so Senja itself is as before:
// the air by the difference in temperature, the sea by the difference in sea temperature, the rain and snow by the ratio of the
// precipitation, the cloud by the difference in cover. Between the points, the three nearest by distance (1/d²); p is where it is
// asked for, else the boat you follow.
const CLIM_D = /*@include(data/climate.json)*/null;
const CLIM = (() => { const D = CLIM_D && CLIM_D.pts; if (!D || !D.length) return null;
  const pts = D.filter(q => q.t && q.p).map(q => ({...q, at:P(q.lat, q.lon), sst:q.sst || null})), ref = pts.find(q => q.n === 'Senja') || pts[0];
  return {pts, ref}; })();
let CLIMQ = {k:'', w:null};
// the weights of the nearest points for p, kept for a 5 km cell
function climW(p){ if (!CLIM) return null; const q = p || herePos(); if (!q) return [[CLIM.ref, 1]];
  const k = Math.round(q.x / 5) + ':' + Math.round(q.y / 5); if (CLIMQ.k === k) return CLIMQ.w;
  const near = CLIM.pts.map(c => [c, Math.hypot(c.at.x - q.x, c.at.y - q.y)]).sort((a, b) => a[1] - b[1]).slice(0, 3);
  let w = near[0][1] < 1 ? [[near[0][0], 1]] : near.map(([c, d]) => [c, 1 / (d * d)]); const s = w.reduce((a, x) => a + x[1], 0); w = w.map(([c, x]) => [c, x / s]);
  CLIMQ = {k, w}; return w; }
// a monthly series (key) at p and H, between the months as seasonal() does, and its difference from Senja
function climV(key, H, p){ const w = climW(p); if (!w) return null; let v = 0, s = 0; for (const [c, x] of w){ const a = c[key]; if (!a || a.some(x => x == null)) continue; v += seasonal(a, H) * x; s += x; } return s ? v / s : null; }
function climDiff(key, H, p){ if (!CLIM) return 0; const v = climV(key, H, p), r = CLIM.ref[key] ? seasonal(CLIM.ref[key], H) : null; return v == null || r == null ? 0 : v - r; }
function climRatio(key, H, p){ if (!CLIM) return 1; const v = climV(key, H, p), r = CLIM.ref[key] ? seasonal(CLIM.ref[key], H) : null; return v == null || !r ? 1 : clamp(v / r, 0.3, 3); }
function airTemp(H, p){ const d = gDate(H), hr = d.getUTCHours() + d.getUTCMinutes() / 60; return seasonal(AIRT, H) + climDiff('t', H, p) + (vn(H / 20, 81) - 0.5) * 6 + 1.5 * Math.sin((hr - 9) / 24 * 2 * Math.PI) - Math.max(0, windAt(H, p) - 10) * 0.15; }
// more precipitation a month makes the wet spells come oftener: the threshold of the noise moves with the ratio
function precipAt(H, p){ const r = climRatio('p', H, p); return clamp((vn(H / 8, 71) - 0.56 + 0.18 * Math.log(r)) * 2.6 + (windAt(H, p) - 10) / 14, 0, 1); }
function cloudAt(H, p){ return clamp(0.3 + precipAt(H, p) * 0.9 + (vn(H / 14, 91) - 0.5) * 1.4 + climDiff('cloud', H, p) / 100, 0, 1); }
function visibility(H, p){ const pr = precipAt(H, p), snow = airTemp(H, p) < 1; return clamp(45 - pr * (snow ? 42 : 28) - cloudAt(H, p) * 8, 1.2, 50); }
// the sea's temperature at the surface where p is (°C): Senja's year moved by the difference in the marine API's monthly means
function seaTemp(H, p){ return seasonal(SST, H) + climDiff('sst', H, p); }
// ---- snow and the seasons on land (V2 and V3 of the weather plan; Jonas 09.10.2026: «vi må bygge ferdig værsystemene og årstidene»).
// Reckoned day by day from the first of August, where the place is (a 20 km cell) and at every 100 m of height up to 1 500 m:
// - the snow (SWE, mm of water): the day's precipitation falls as snow below about 0.5 °C and as sleet up to 1.5 °C (mm from the
//   month's normal at the place, climate.json p, shared out by the game's own rain; 65 % of it stays, the rest blows off and
//   sublimates, set so the coast of Troms has about a metre of snow at the most); it melts with the warmth, 4 mm a degree-day, and
//   faster in rain. The air cools 0.65 °C per 100 m and it falls a little more higher up, so the snow lies longer up the hills
//   and comes back there first. On the ground it lies in patches when it is thin (view3d.js).
// - the birch and the grass: the leaves come out when the warmth since spring (degree-days over 5 °C) reaches about 60, the grass
//   greens with it (and keeps a little green through a mild winter without snow); the leaves turn yellow when the ten-day mean falls
//   under 9 °C after midsummer and are gone two weeks later.
const SNOW_Z = 16, SNOW_DZ = 100;
let SEAS_PI = 0, SEASQ = new Map();
function wxDay(d, p){
  // one day (d: whole days since EPOCH) at p: mean air at the sea and the precipitation in mm
  let T = 0, I = 0; for (const h of [3, 9, 15, 21]){ const H = d * 24 + h; T += airTemp(H, p) / 4; I += precipAt(H, p) / 4; }
  if (!SEAS_PI){ let m = 0; for (let k = 0; k < 730; k++) m += precipAt(k * 12 + 5, null); SEAS_PI = Math.max(0.05, m / 730); }
  const mm = (climV('p', d * 24 + 12, p) || 100) / 30.4 * I / SEAS_PI;
  return {T, mm};
}
function seasonAt(H, p){
  const q = p || herePos() || P(69.4, 17.5), k = Math.round(q.x / 20) + ':' + Math.round(q.y / 20), cell = {x:Math.round(q.x / 20) * 20, y:Math.round(q.y / 20) * 20};
  const day = Math.floor(H / 24), g = gDate(H), y0 = g.getUTCMonth() >= 7 ? g.getUTCFullYear() : g.getUTCFullYear() - 1, d0 = Math.floor((Date.UTC(y0, 7, 1) - EPOCH) / 864e5);
  // a new season starts on the first of August, in summer: birch in leaf, the grass green
  let st = SEASQ.get(k);
  if (!st || st.d0 !== d0 || st.day > day){ st = {d0, day:d0 - 1, swe:new Float32Array(SNOW_Z), gdd:999, t10:[], leaf:1, yel:0, fallD:-1, grass:1}; SEASQ.set(k, st); if (SEASQ.size > 64) SEASQ.delete(SEASQ.keys().next().value); }
  while (st.day < day){
    st.day++; const {T, mm} = wxDay(st.day, cell), mo = gDate(st.day * 24 + 12).getUTCMonth();
    for (let i = 0; i < SNOW_Z; i++){
      const z = i * SNOW_DZ, t = T - 0.0065 * z, P = mm * (1 + 0.0004 * z), fs = clamp((1.5 - t) / 1.0, 0, 1);
      let w = st.swe[i] + P * fs * 0.65; if (t > 0) w -= 4 * t + 0.0125 * P * (1 - fs) * t; st.swe[i] = Math.max(0, w);
    }
    // the growing season at the sea: degree-days from the new year's spring, the ten-day mean for the autumn
    st.t10.push(T); if (st.t10.length > 10) st.t10.shift(); const t10 = st.t10.reduce((a, b) => a + b, 0) / st.t10.length;
    if (mo >= 2 && mo <= 6) st.gdd += Math.max(0, T - 5);
    st.leaf = clamp((st.gdd - 40) / 40, 0, 1) * (st.swe[0] < 5 ? 1 : 0.3);
    if (mo >= 7 && st.t10.length >= 10 && t10 < 9 && st.fallD < 0) st.fallD = st.day;
    st.yel = st.fallD >= 0 ? clamp((st.day - st.fallD) / 10, 0, 1) : 0;
    if (st.fallD >= 0 && st.day - st.fallD > 16) st.leaf = Math.max(0, 1 - (st.day - st.fallD - 16) / 6);
    st.grass = Math.max(clamp((st.gdd - 20) / 80, 0, 1) * (st.fallD >= 0 ? clamp(1 - (st.day - st.fallD) / 30, 0, 1) : 1), clamp((t10 - 2) / 6, 0, 0.35)) * (st.swe[0] < 5 ? 1 : 0);
    // the new year: before spring the summer's leaves are gone (birch bare), the warmth since spring starts over
    if (mo < 2){ st.gdd = 0; st.leaf = 0; st.grass = 0; st.yel = 0; st.fallD = -1; }
  }
  return st;
}
// the snow line at p (m): the height where 20 mm of water lies as snow; under the sea when the shore is white (down to −120 m, so
// the patches on the low ground thin out last), 3000 when there is none
function snowLineAt(H, p){
  const st = seasonAt(H, p), w = st.swe, L = 20;
  if (w[0] >= L) return -Math.min(120, (w[0] - L) * 1.5);
  for (let i = 1; i < SNOW_Z; i++) if (w[i] >= L) return (i - 1 + (L - w[i - 1]) / Math.max(1e-6, w[i] - w[i - 1])) * SNOW_DZ;
  return 3000;
}
// the snow at height z (m) at p, mm of water
function snowAt(H, z, p){ const st = seasonAt(H, p), f = clamp(z / SNOW_DZ, 0, SNOW_Z - 1.001), i = Math.floor(f); return st.swe[i] + (st.swe[i + 1] - st.swe[i]) * (f - i); }
const RAD = Math.PI / 180, OBS = {lat:69.35 * RAD, lw:-17.6 * RAD}, OBL = 23.4397 * RAD;
const jdays = H => (gDate(H).getTime() - 3600000) / 86400000 + 2440587.5 - 2451545;   // days since J2000 (UTC)
// where the sky and the tide are reckoned (phase K10 of the coast plan): the place asked for, else the boat you follow; OBS (Senja)
// before there is a game
const herePos = () => (S && S.boat && S.boat.pos) || null;
let OBSQ = {k:'', o:OBS};
function obsAt(p){ if (!p) return OBS; const k = Math.round(p.x / 5) + ':' + Math.round(p.y / 5); if (OBSQ.k !== k){ const l = LL(p); OBSQ = {k, o:{lat:l.lat * RAD, lw:-l.lon * RAD}}; } return OBSQ.o; }
function eqToHor(ra, dec, d, ob){
  const O = ob || OBS, th = RAD * (280.16 + 360.9856235 * d) - O.lw, hA = th - ra;
  const alt = Math.asin(Math.sin(O.lat) * Math.sin(dec) + Math.cos(O.lat) * Math.cos(dec) * Math.cos(hA));
  const az = Math.atan2(Math.sin(hA), Math.cos(hA) * Math.sin(O.lat) - Math.tan(dec) * Math.cos(O.lat)) + Math.PI;   // from north, clockwise
  return {alt, az};
}
function sunEq(d){
  const M = RAD * (357.5291 + 0.98560028 * d), C = RAD * (1.9148 * Math.sin(M) + 0.02 * Math.sin(2 * M) + 0.0003 * Math.sin(3 * M)), L = M + C + RAD * 102.9372 + Math.PI;
  return {ra:Math.atan2(Math.sin(L) * Math.cos(OBL), Math.cos(L)), dec:Math.asin(Math.sin(OBL) * Math.sin(L)), dist:149598000};
}
function moonEq(d){
  const L = RAD * (218.316 + 13.176396 * d), M = RAD * (134.963 + 13.064993 * d), F = RAD * (93.272 + 13.229350 * d);
  const lon = L + RAD * 6.289 * Math.sin(M), lat = RAD * 5.128 * Math.sin(F);
  return {ra:Math.atan2(Math.sin(lon) * Math.cos(OBL) - Math.tan(lat) * Math.sin(OBL), Math.cos(lon)), dec:Math.asin(Math.sin(lat) * Math.cos(OBL) + Math.cos(lat) * Math.sin(OBL) * Math.sin(lon)), dist:385001 - 20905 * Math.cos(M)};
}
function sunAt(H, p){ const d = jdays(H), e = sunEq(d), h = eqToHor(e.ra, e.dec, d, obsAt(p || herePos())); return {el:h.alt / RAD + (h.alt > -0.02 ? 0.57 * Math.exp(-h.alt / RAD / 3) : 0), az:h.az}; }
function moonAt(H, p){
  const d = jdays(H), m = moonEq(d), sn = sunEq(d), h = eqToHor(m.ra, m.dec, d, obsAt(p || herePos()));
  const phi = Math.acos(clamp(Math.sin(sn.dec) * Math.sin(m.dec) + Math.cos(sn.dec) * Math.cos(m.dec) * Math.cos(sn.ra - m.ra), -1, 1));
  const inc = Math.atan2(sn.dist * Math.sin(phi), m.dist - sn.dist * Math.cos(phi));
  const ang = Math.atan2(Math.cos(sn.dec) * Math.sin(sn.ra - m.ra), Math.sin(sn.dec) * Math.cos(m.dec) - Math.cos(sn.dec) * Math.sin(m.dec) * Math.cos(sn.ra - m.ra));
  return {el:h.alt / RAD, az:h.az, illum:(1 + Math.cos(inc)) / 2, waxing:ang < 0};
}
function moonName(mo){ const f = mo.illum; return f < 0.04 ? {no:'Nymåne', en:'New moon'} : f > 0.96 ? {no:'Fullmåne', en:'Full moon'} : f < 0.5 ? (mo.waxing ? {no:'Voksende månesigd', en:'Waxing crescent'} : {no:'Minkende månesigd', en:'Waning crescent'}) : (mo.waxing ? {no:'Voksende måne', en:'Waxing gibbous'} : {no:'Minkende måne', en:'Waning gibbous'}); }
// sunrise and sunset for the day containing H (polar day / polar night when there are none)
function sunTimes(H, p){
  p = p || herePos(); const d0 = Math.floor((H + 6) / 24) * 24 - 6; let up = null, dn = null, prev = sunAt(d0, p).el, maxEl = prev, minEl = prev;
  for (let m = 5; m <= 24 * 60; m += 5){ const e = sunAt(d0 + m / 60, p).el; maxEl = Math.max(maxEl, e); minEl = Math.min(minEl, e); if (prev < -0.83 && e >= -0.83 && up === null) up = d0 + m / 60; if (prev >= -0.83 && e < -0.83 && dn === null) dn = d0 + m / 60; prev = e; }
  return {up, dn, always:minEl > -0.83, never:maxEl < -0.83};
}
// the ensign's hours (flaggforskriften, 1927: hoisted at 08 from March to October and at 09 from November to February, lowered at sunset
// and at 21 at the latest; in Nordland, Troms and Finnmark from 10 to 15 from November to February). The pennant has no hours: it flies
// day and night, the year round (Jonas 07.10.2026)
function flagUp(H, p){
  p = p || herePos(); const m = gDate(H).getUTCMonth(), h = hodOf(H), winter = m >= 10 || m <= 1;
  if (winter && LL(p).lat > 65) return h >= 10 && h < 15;
  return h >= (winter ? 9 : 8) && h < 21 && !(h >= 12 && sunAt(H, p).el < -0.83);
}
// ---------- tide: harmonic prediction per place (phase K10 of the coast plan) ----------
// tools/tide/fetch.py fits the constants to Kartverket's prediction for a year at a sea point of each coast tile (data/tide.json:
// x, y, the mean sea level above chart datum zc, and amplitude (m) and phase (degrees) of M2, S2, N2, K2, K1 and O1). At a place the
// three nearest points are blended by the inverse square of the distance, as complex numbers so the phases blend smoothly; from
// 0.3 m of range in the Skagerrak to 3 m in Nordland. Without the table, Senja's constants of before (TIDE_ZC, TIDE_C) everywhere.
const TIDE_ZC = 1.3, TIDE_N = ['M2', 'S2', 'N2', 'K2', 'K1', 'O1'];
const TIDE_C = [[0.86, 300], [0.31, 345], [0.17, 280], [0.09, 345], [0.08, 180], [0.04, 160]];
const TIDEP = (() => {
  const T = /*@include(data/tide.json)*/null; if (!T || !T.points || !T.points.length) return null;
  const c = T.cols, at = n => c.indexOf(n);
  return T.points.map(r => ({x:r[at('x')], y:r[at('y')], zc:r[at('zc')], re:TIDE_N.map(n => r[at(n + 'A')] * Math.cos(r[at(n + 'g')] * RAD)), im:TIDE_N.map(n => r[at(n + 'A')] * Math.sin(r[at(n + 'g')] * RAD))}));
})();
let TIDEQ = {k:'', v:{zc:TIDE_ZC, C:TIDE_C}};
function tidePlace(p){
  if (!TIDEP || !p) return TIDEQ.k === '' ? TIDEQ.v : {zc:TIDE_ZC, C:TIDE_C};
  const k = Math.round(p.x) + ':' + Math.round(p.y); if (TIDEQ.k === k) return TIDEQ.v;
  const near = TIDEP.map(q => [(q.x - p.x) ** 2 + (q.y - p.y) ** 2, q]).sort((a, b) => a[0] - b[0]).slice(0, 3);
  let W = 0, zc = 0; const re = TIDE_N.map(() => 0), im = TIDE_N.map(() => 0);
  for (const [d2, q] of near){ const w = 1 / Math.max(d2, 1); W += w; zc += w * q.zc; for (let i = 0; i < TIDE_N.length; i++){ re[i] += w * q.re[i]; im[i] += w * q.im[i]; } }
  TIDEQ = {k, v:{zc:zc / W, C:TIDE_N.map((n, i) => [Math.hypot(re[i], im[i]) / W, Math.atan2(im[i], re[i]) / RAD])}}; return TIDEQ.v;
}
// metres above mean sea level at hour H, at p (else the boat you follow)
function tideH(H, p){
  const d = jdays(H), Tc = d / 36525, sL = 218.3165 + 481267.8813 * Tc, hL = 280.4661 + 36000.7698 * Tc, pL = 83.3535 + 4069.0137 * Tc;
  const g = gDate(H), T0 = 15 * (g.getUTCHours() - 1 + g.getUTCMinutes() / 60 + g.getUTCSeconds() / 3600), tau = T0 + hL - sL;
  const V = [2 * tau, 2 * T0, 2 * tau - sL + pL, 2 * (T0 + hL), T0 + hL, T0 + hL - 2 * sL], C = tidePlace(p || herePos()).C;
  let z = 0; for (let i = 0; i < 6; i++) z += C[i][0] * Math.cos((V[i] - C[i][1]) * RAD); return z;
}
const tideZC = p => tidePlace(p || herePos()).zc;   // mean sea level above chart datum at p
const tideCD = (H, p) => tideH(H, p) + tideZC(p);   // water level above chart datum: add to charted depths
function tideEvents(H0, hours, p){
  const out = []; let a = tideH(H0 - 0.1, p), b = tideH(H0, p);
  for (let m = 6; m <= hours * 60; m += 6){ const H = H0 + m / 60, c = tideH(H, p); if ((b - a) * (c - b) <= 0 && b !== a) out.push({t:H - 0.1, h:b, kind:c < b ? 'high' : 'low'}); a = b; b = c; }
  return out;
}
// the aurora: dark enough (the sun 7° under), clear enough, and the activity (a slow noise that now and then rises to a storm). The
// auroral oval lies over Northern Norway on most active nights (about 67-71° N), so further south only the stronger nights reach
// the sky, weaker and low in the north (view3d.js draws the curtains further north the weaker it is); p is where it is seen
function auroraAt(H, p){ const q = p || herePos(); if (sunAt(H, q).el > -7) return 0;
  const act = clamp(vn(H / 5, 111) * 1.6 - 0.3, 0, 1), lat = obsAt(q).lat / RAD, need = clamp((67 - lat) / 7.5, 0, 1) * 0.9;
  return clamp((0.5 - cloudAt(H)) / 0.5, 0, 1) * (act > need ? (act - need) / (1 - need) : 0); }
function riskLevel(W, hs){ const r = BOAT.risk; if (hs >= r[1] || W >= r[3]) return 2; if (hs >= r[0] || W >= r[2]) return 1; return 0; }

// boat
// ---- weight (the user's list 04.10.2026: «mer last og vekt betyr mindre fart ... viktig at ikke dette blir urealistisk»): what she
// carries against what she is rated with (her own weight, half her fuel, a quarter of her hold and one person aboard). A displacement
// hull's resistance at a speed goes with the weight to the 2/3, so at the same power the speed goes with (D0/D)^(2/9), about ^0.22
// (+50 % weight: −9 %); a planing hull feels it more, ^0.5. The fuel at a speed goes with (D/D0)^(2/3)
const FUEL_KG = d => d ? 0.84 : 0.74;   // kg a litre, diesel and petrol
function boatTons(){ const b = S.boat, V = VESSELS[b.type] || VESSELS.skiff; return V.disp + (holdTotal() + (typeof cargoKg === 'function' ? cargoKg() : 0) + (b.ice || 0) + (b.fuel || 0) * FUEL_KG(V.diesel) + 90 * Math.max(1, handsAboard())) / 1000; }
function boatTons0(){ const V = VESSELS[S.boat.type] || VESSELS.skiff; return V.disp + (V.holdCap * 0.25 + V.fuelCap * 0.5 * FUEL_KG(V.diesel) + 90) / 1000; }
function loadF(){ return clamp(Math.pow(boatTons0() / Math.max(0.1, boatTons()), BOAT.planing ? 0.5 : 0.22), 0.55, 1.08); }
// ---- fouling: weed and barnacles on the hull (S.boat.foul, 0 to 1) slow her up to 15 % and cost up to 25 % more fuel; it grows in
// the sea about three times as fast in summer (June to September) as in winter (full after about three summer months), slowed to 30 %
// by an antifouling coat (EQUIP.antigro); «Skrogrens» on the slip (the yard's job 'hull') takes it off. The old «Rengjort bunn» (S.clean)
// was a different thing and is gone
function foulHour(H){ const b = S.boat, m = gDate(H).getUTCMonth(), r = (m >= 5 && m <= 8 ? 0.012 : 0.004) / 24 * (S.equip && S.equip.antigro ? 0.3 : 1); b.foul = Math.min(1, (b.foul || 0) + r); }
const foulSpeed = () => 1 - 0.15 * ((S.boat && S.boat.foul) || 0), foulFuel = () => 1 + 0.25 * ((S.boat && S.boat.foul) || 0);
function fuelLph(v, W){ const base = BOAT.planing ? 1.0 + 0.03 * v * v + 3 * Math.exp(-(((v - BOAT.vmax * 0.42) / 3) ** 2)) : 1 + 0.1 * v * v + (v > BOAT.vmax * 0.9 ? (v - BOAT.vmax * 0.9) * 6 : 0); return base * BOAT.fuelK * (1 + 0.015 * W) * Math.pow(boatTons() / boatTons0(), 2 / 3) * foulFuel() * ((typeof turTowing === 'function' && turTowing()) || (typeof ptowTowing === 'function' && ptowTowing()) ? 1.5 : 1); }
function speedCap(hs){ const v = BOAT.vmax * clamp(1 - (hs - 0.3) * BOAT.sea, 0.2, 1) * loadF() * foulSpeed(); return (typeof turTowing === 'function' && turTowing()) || (typeof ptowTowing === 'function' && ptowTowing()) ? Math.min(v, TUR_TOWV) : v; }   // with a boat in tow (09g-turer.js)

// fish
function noise2(x, y, s){
  const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy, ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
  const h = (a, c) => hash(Math.imul(a, 374761393) ^ Math.imul(c + s * 7919, 668265263));
  return (h(ix, iy) * (1 - ux) + h(ix + 1, iy) * ux) * (1 - uy) + (h(ix, iy + 1) * (1 - ux) + h(ix + 1, iy + 1) * ux) * uy;
}
// steepness of the sea floor (metres per 100 m): fish gather along bank edges and slopes
function slopeAt(p){ const e = 0.1, a = depthF({x:p.x + e, y:p.y}), b = depthF({x:p.x - e, y:p.y}), c = depthF({x:p.x, y:p.y + e}), d = depthF({x:p.x, y:p.y - e}); return Math.hypot(a - b, c - d) / 2; }
// Good spots nobody talks about: patches of better fishing on a 3.5 km pattern that drift. Two fields overlap at any time, each
// sliding its own way at 0.7–1.7 km a day and fading in and out over 240 hours, so the fish move along instead of jumping every
// five days. The blend is scaled back to the spread of one field, so the mean stays where it was.
const HOT = {T:120, v:0.05, cell:3.5};   // hours, km an hour, km
function hotField(sp, p, H, k){
  const si = ALLSP.indexOf(sp), a = 2 * Math.PI * h2(k, 700 + si), v = HOT.v * (0.6 + 0.8 * h2(k, 720 + si)), tt = H - k * HOT.T;
  return noise2((p.x - Math.sin(a) * v * tt) / HOT.cell, (p.y + Math.cos(a) * v * tt) / HOT.cell, 20 + si + 97 * k);
}
function hotspot(sp, p, H){
  const f = H / HOT.T, k = Math.floor(f), u = sstep(0, 1, f - k), a = hotField(sp, p, H, k), b = hotField(sp, p, H, k + 1);
  const n = clamp(0.5 + ((a - 0.5) * (1 - u) + (b - 0.5) * u) / Math.hypot(1 - u, u), 0, 1); return 0.3 + 1.5 * n * n;
}
// Schools: a finer pattern (400 m) that swims 0.5–1 km an hour on each species' own heading. It averages 1, so it moves the bite
// about within half an hour without changing the catch over a day. The sonar shows it.
const SCHOOL = {cell:0.4, amp:0.3};
function school(sp, p, H){
  const si = ALLSP.indexOf(sp), a = 2 * Math.PI * h2(si, 740), v = 0.5 + 0.5 * h2(si, 741);
  return 1 - SCHOOL.amp / 2 + SCHOOL.amp * noise2((p.x - Math.sin(a) * v * H) / SCHOOL.cell, (p.y + Math.cos(a) * v * H) / SCHOOL.cell, 60 + si);
}
// where a species' schools are heading (radians, map north up), for the sonar
function schoolHeading(sp){ return 2 * Math.PI * h2(ALLSP.indexOf(sp), 740); }
// The fjord lines for coastal cod along the whole coast (insideFjord) and the other rules are in 03e-rules.js.
// Fiskeridirektoratet's statistical locations: the location's polygon from rules.json (03e-rules.js), or near Senja the nearest
// representative point when there are no rule data
const FIELDS = [['05-25', 6, 45], ['05-29', 14, 8], ['05-30', 44, 8], ['05-31', 72, 4], ['05-40', 58, 36], ['05-41', 42, 68], ['05-42', 12, 80]];
function fieldCode(p){ const c = RU.ok && ruLok(p); if (c) return c; const q = LGI(p); if (!insideFjord(p) && q.x < 16) return q.y < 30 ? '05-29' : '05-25'; let best = FIELDS[0], bd = 1e9; for (const f of FIELDS){ if (!insideFjord(p) && (f[0] === '05-40' || f[0] === '05-41')) continue; const d = Math.hypot(q.x - f[1], q.y - f[2]); if (d < bd){ bd = d; best = f; } } return best[0]; }
// where the spawning cod gathers: exposed banks 40–250 m outside the fjords, and the known grounds
function skreiSpot(p, d = depthF(p), E = exposure(p)){
  let v = sstep(0.15, 0.6, E) * sstep(30, 60, d) * (1 - sstep(220, 320, d));
  for (const g of GROUNDS.slice(0, 3)){ const dd = dist(p, g.p); v += 0.6 * Math.exp(-((dd / (g.r * 1.3)) ** 2)); }
  return clamp(v, 0, 1.2) * (insideFjord(p) ? 0.35 : 1);
}
function gauss(u1, u2){ return Math.sqrt(-2 * Math.log(Math.max(1e-9, u1))) * Math.cos(2 * Math.PI * u2); }
// one fish's round weight (kg): cod mixes resident coastal cod with larger spawning cod in the season
function sampleFish(sp, p, H){
  const s = SPECIES[sp]; let sz = s.size;
  if (sp === 'torsk'){ const k = seasonal(s.av, H), sk = seasonal(s.skrei, H) * skreiSpot(p); if (Math.random() < sk / (k + sk + 1e-9)) sz = s.skreiSize; }
  return Math.round(sz[0] * Math.exp(sz[1] * gauss(Math.random(), Math.random())) * 100) / 100;
}
function clsOf(sp, kg){ const c = SPECIES[sp].cls; for (let i = 0; i < c.length; i++) if (kg >= c[i][0]) return i; return c.length - 1; }
// directed fishing for redfish is only allowed with jigs in June–August for boats under 15 m; otherwise only as bycatch
// halibut is closed north of 62° N from 20 December to 20 April (høstingsforskriften § 39); live halibut must be released
function kveiteClosed(H){ const g = gDate(H), m = g.getUTCMonth(), d = g.getUTCDate(); return (m === 11 && d >= 20) || m < 3 || (m === 3 && d <= 20); }
// fishing for halibut: big pilk and heavy line; halibut takes it far more often, other fish rarely, and it bites best around slack tide
function targetF(sp, H){
  if (S.target !== 'kveite' || !S.boat.kgear || kveiteClosed(H)) return 1;
  if (sp !== 'kveite') return 0.2;
  const cur = Math.abs(tideH(H + 0.5) - tideH(H - 0.5)); return 9 * (1.4 - 0.8 * clamp(cur / 0.35, 0, 1));
}
function uerOpen(H){ const m = gDate(H).getUTCMonth(); return m >= 5 && m <= 7; }
// How much fish of a species there is at a point and hour: 30 × density × effort is kg an hour (one person with a hand jig is effort 2).
// It is split in three so the echo-sounder heat map can share the work between species: what the place gives (denPlace, once
// per point), what the hour gives (denTime, once per hour), and the species' own sum (denSp). density() gives the same numbers.
function denPlace(p){
  if (isLand(p)) return null;
  const d = depthF(p), E = exposure(p);
  return {p, d, E, edge:sstep(1.5, 12, slopeAt(p)), gd:GROUNDS.map(g => dist(p, g.p)), skr:-1};
}
const DENT = {H:NaN, T:null};
function denTime(H){
  if (DENT.H === H) return DENT.T;
  const T = {uerOpen:uerOpen(H)};
  // cod, haddock and saithe follow their spawning stock from year to year (stockF in 03d-quota.js; 1 in March 2027)
  for (const sp of ALLSP){ const s = SPECIES[sp], f = stockF(sp, H); T[sp] = {av:seasonal(s.av, H) * f, skrei:sp === 'torsk' ? seasonal(s.skrei, H) * f : 0}; }
  DENT.H = H; DENT.T = T; return T;
}
function denSp(sp, q, H, T){
  const s = SPECIES[sp], p = q.p;
  let v = s.base * (s.prod + (1 - s.prod) * q.E) * (0.6 + 0.4 * q.edge) * hotspot(sp, p, H) * 0.95;
  // the named grounds are known for a reason
  for (let i = 0; i < GROUNDS.length; i++){ const g = GROUNDS[i], dd = q.gd[i]; if (dd > g.r * 3) continue; v += (g.sp[sp] || 0) * Math.exp(-((dd / g.r) ** 2)) * 0.45; }
  const day = 0.75 + 0.5 * vn(H / 24 + p.x * 0.05, 300 + ALLSP.indexOf(sp));
  let av = T[sp].av;
  if (sp === 'torsk'){ if (q.skr < 0) q.skr = skreiSpot(p, q.d, q.E); av += T[sp].skrei * q.skr; }
  if (sp === 'uer' && !T.uerOpen) av *= 0.15;
  if (s.shell) v *= kingArea(p); else v *= school(sp, p, H);
  if (s.area) v *= AREAS[s.area](p, q.d, H, q.E);
  return 1.6 * s.k * v * day * av * depthFactor(sp, q.d) * stockAt(p, sp) + tutBonus(sp, p);   // k: calibration to 2025 catches per boat in Lofoten–Tromsø
}
function density(sp, p, H){ const q = denPlace(p); return q ? denSp(sp, q, H, denTime(H)) : 0; }
// Where the Greenland halibut is (07.10.2026, docs/plan-blakveite.md 1-2): the shelf edge between 300 and 1100 m (none shallower, none
// deeper, which depthFactor alone cannot do, as it never drops below 0.3), from the landing notes of 2025 by area: next to none south of
// 62° N, a little from Storegga to Helgeland and Træna, stray fish in Vestfjorden, the main grounds from Lofoten by Vesterålen, Andøya
// (Bleiksdjupet), Malangsdjupet and Fugløybanken to Tromsøflaket, and less along Finnmark (most in the east: Leira by Berlevåg, the
// Tana fjord, Vardø). In the deep fjord basins of Troms (Malangen, Ullsfjorden, Lyngen) a small, steady stock, which is poorly
// documented. In winter the spawning fish gather on the edge from 70 to 75° N, so the south thins and the north fills.
function eggaArea(p, d, H, E){
  const win = sstep(280, 400, d) * (1 - sstep(1000, 1150, d)); if (win <= 0) return 0;
  const ll = natLL(p), lat = ll.lat, lon = ll.lon; if (lat < 62) return 0;
  let a = 0.15 + 0.85 * sstep(67.6, 68.8, lat);
  if (lat > 70.3) a *= lon > 26.5 ? 0.6 : 0.4;
  if (lat > 67.4 && lat < 68.4 && lon > 13.6 && lon < 16.5) a *= 0.15;      // Vestfjorden, inside the Lofoten wall
  if (E < 0.4 && lat > 68.8) a *= 0.12;                                     // the sheltered fjord basins
  const w = seasonal([1, 0.8, 0.4, 0.1, 0, 0, 0, 0, 0.1, 0.4, 0.8, 1], H);
  a *= lat < 70 ? 1 - 0.45 * w : 1 + 0.3 * w;
  return a * win;
}
const AREAS = {egga:eggaArea};
// The first trip's guaranteed catch is a real patch of skrei on the guide's ground while the guarantee lasts, so the heat map and
// the echo sounder show what the boat gets. It comes on top of the stock and is not fished down; the species mix is the mix the
// guarantee tops up with. Full strength within half the ring's radius, a tenth at its edge.
const TUT_FIELD = 4;   // Gisundet nord
// the first trip's patch: where a start along the coast put it (S.tut.f, ui/08c-start.js), else Gisundet nord
const tutFieldAt = () => (typeof S !== 'undefined' && S && S.tut && S.tut.f) ? S.tut.f : GROUNDS[TUT_FIELD];
const TUTB = {peak:5.2, mix:{torsk:0.72, sei:0.18, hyse:0.1}};
function tutBonus(sp, p){
  const m = TUTB.mix[sp]; if (!m || !(S && S.tut && S.tut.catch)) return 0;
  const g = tutFieldAt(), d = dist(p, g.p), x = Math.max(0, d - g.r * 0.5) / (g.r * 0.33);
  return TUTB.peak * m * Math.exp(-x * x);
}
// local stock of fish in 2 x 2 km cells of the national frame (1 = untouched): fishing takes it down, it recovers over weeks. S.stock
// holds only the cells below 1, by gridKey, so it covers the whole coast. The value at a point is read between the four nearest
// cell centres, and a catch is taken from the same four cells by the same weights, so the stock has no hard 2 km edges and what
// the heat map shows is what is taken.
const STK = {c:2, K:2600};
const stkGet = (m, k) => { const v = m[k]; return v === undefined ? 1 : v; };
const stkSet = (m, k, v) => { if (v < 1) m[k] = v; else delete m[k]; };
function stockIdx(p){ return gridKey(Math.floor(p.x / STK.c), Math.floor(p.y / STK.c)); }
// the four cells around a point and their weights
function stockW(p){
  const gx = p.x / STK.c - 0.5, gy = p.y / STK.c - 0.5, ix = Math.floor(gx), iy = Math.floor(gy), fx = gx - ix, fy = gy - iy;
  return [[gridKey(ix, iy), (1 - fx) * (1 - fy)], [gridKey(ix + 1, iy), fx * (1 - fy)], [gridKey(ix, iy + 1), (1 - fx) * fy], [gridKey(ix + 1, iy + 1), fx * fy]];
}
// every cell over Senja's map at one value (for the tests)
function stockFill(v){ const m = {}; for (let iy = Math.floor(HOME.y0 / STK.c) - 1; iy <= Math.floor(HOME.y1 / STK.c) + 1; iy++) for (let ix = Math.floor(HOME.x0 / STK.c) - 1; ix <= Math.floor(HOME.x1 / STK.c) + 1; ix++) stkSet(m, gridKey(ix, iy), v); return m; }
// Shellfish have their own layer (S.cstk), made when the first pot is hauled. It stays one value per cell: pots stand still for
// days and work the cell as a patch, the heat map does not show crab, and the pot calibration rests on it.
function stockAt(p, sp){
  if (sp && SPECIES[sp].shell) return S && S.cstk ? stkGet(S.cstk, stockIdx(p)) : 1;
  if (sp && SPECIES[sp].stk) return S && S[SPECIES[sp].stk] ? stkGet(S[SPECIES[sp].stk], stockIdx(p)) : 1;   // the Greenland halibut's own
  if (!S || !S.stock) return 1; let v = 0; for (const [k, w] of stockW(p)) v += stkGet(S.stock, k) * w; return v;
}
// npc: the local fleet's take (stockHour), which every game works out for itself; what the player's own boats take is also kept for
// the other players (the shared world V2)
function takeStock(p, kg, sp, npc){
  if (sp && SPECIES[sp].shell){ if (!S.cstk) S.cstk = {}; const k = stockIdx(p); stkSet(S.cstk, k, Math.max(0.1, stkGet(S.cstk, k) - kg / (STK.K * 0.25))); return; }
  if (sp && SPECIES[sp].stk){ const n = SPECIES[sp].stk; if (!S[n]) S[n] = {}; const k = stockIdx(p); stkSet(S[n], k, Math.max(0.1, stkGet(S[n], k) - kg / (STK.K * 0.4))); return; }
  if (!S.stock) return; const q = !npc && WSH.rec ? wq().c : null;
  for (const [k, w] of stockW(p)) if (w > 0){ stkSet(S.stock, k, Math.max(0.12, stkGet(S.stock, k) - kg * w / STK.K)); if (q && (q[k] != null || Object.keys(q).length < 3000)) q[k] = (q[k] || 0) + kg * w; }
}
// ---- the shared world V2 (05.10.2026; ui/10h-world.js, supabase/migrations/20261006000000_world_v2.sql): one sea, one quota and one
// market. WSH holds what came down last of what the other players have done: their open-group cod this year (t, counted with the
// fleet's in 03d-quota.js) and how many boats, and what they delivered to each plant (kg at game hour mH, decaying 3 % an hour as
// S.market does). The fish they took comes down cell by cell and is taken from this game's sea at once (wshTake). S.wq holds what
// goes up: the cells this game's boats took fish from, and its sales. rec is on only with the cloud. ----
const WSH = {rec:false, y:0, open:0, boats:0, mkt:{}, mH:0};
function wq(){ return S.wq || (S.wq = {c:{}, l:[]}); }
function wshOpen(y){ return WSH.y === y ? WSH.open : 0; }
function wshSat(pid, sp, H){ const m = WSH.mkt[pid]; return m && m[sp] ? m[sp] * Math.pow(0.97, Math.max(0, H - WSH.mH)) : 0; }
function wshTake(k, kg){ if (S.stock && kg > 0) stkSet(S.stock, k, Math.max(0.12, stkGet(S.stock, k) - kg / STK.K)); }
// a sale for the others: kilos a species, and the cod counted on the open group's quota
function wshLand(port, H, acc, kgSp, codQ){ if (!WSH.rec) return; const Q = wq(); if (Q.l.length >= 200) return;
  const items = Object.entries(kgSp).filter(([, kg]) => kg > 0.01).slice(0, 24).map(([sp, kg]) => ({sp, kg:+kg.toFixed(1), kgq:sp === 'torsk' && acc === 'open' ? +codQ.toFixed(1) : 0}));
  // the boat's name goes with it for the open group's leaderboard (and the company's in the closed group, whose leaderboard shows it:
  // Jonas 05.10.2026); there is no hiding from the others (07.10.2026)
  if (items.length) Q.l.push({gh:+H.toFixed(2), y:yearH(H), port, acc, items, boat:String(S.boatName || '').slice(0, 24), company:acc !== 'lukket' ? '' : String(S.company || '').slice(0, 40)}); }
function initStock(){
  const a = {};
  // the famous grounds are already worked by the local fleet when the game starts
  for (const g of GROUNDS.slice(0, 4)){ const R = g.r * 1.2;
    for (let iy = Math.floor((g.p.y - R) / STK.c); iy <= Math.floor((g.p.y + R) / STK.c); iy++) for (let ix = Math.floor((g.p.x - R) / STK.c); ix <= Math.floor((g.p.x + R) / STK.c); ix++){
      const d = Math.hypot((ix + 0.5) * STK.c - g.p.x, (iy + 0.5) * STK.c - g.p.y), k = gridKey(ix, iy); if (d < R) stkSet(a, k, Math.min(stkGet(a, k), 0.55 + 0.35 * d / R)); } }
  return a;
}
function stockHour(H){
  // the cells below 1 and their neighbours: each moves towards its neighbours' mean and grows back
  const s = S.stock, nx = {}, cells = new Set(), at = (x, y) => stkGet(s, gridKey(x, y));
  for (const k in s){ const K = +k, x = gridKeyX(K), y = gridKeyY(K); cells.add(K); cells.add(gridKey(x - 1, y)); cells.add(gridKey(x + 1, y)); cells.add(gridKey(x, y - 1)); cells.add(gridKey(x, y + 1)); }
  for (const K of cells){
    const x = gridKeyX(K), y = gridKeyY(K), v = stkGet(s, K), nb = (at(x - 1, y) + at(x + 1, y) + at(x, y - 1) + at(x, y + 1)) / 4;
    // regrowth has a smallest step, so a cell comes all the way back to 1 (rounding used to stop it at 0.876)
    const g = v < 1 ? Math.max((1 - v) * 0.004, 0.0001) : 0;
    stkSet(nx, K, Math.round(Math.min(1, v + g + (nb - v) * 0.01) * 1e4) / 1e4);
  }
  S.stock = nx;
  // crab comes back more slowly, and does not wander far
  if (S.cstk){ const c = {}; for (const k in S.cstk){ const v = S.cstk[k]; stkSet(c, k, Math.round(Math.min(1, v + Math.max((1 - v) * 0.0015, 0.0001)) * 1e4) / 1e4); } S.cstk = c; }
  // the Greenland halibut grows slowly and lives long (M 0.12-0.16): its cells come back slower still
  if (S.bstk){ const c = {}; for (const k in S.bstk){ const v = S.bstk[k]; stkSet(c, k, Math.round(Math.min(1, v + Math.max((1 - v) * 0.001, 0.0001)) * 1e4) / 1e4); } S.bstk = c; }
  // the local fleet works the known grounds on fishable days
  for (const q of npcStates(H)) if (q.fleet && q.st === 'fishing') takeStock(q.p, 18, null, true);
  const hr = gDate(H).getUTCHours();
  if (hr >= 6 && hr < 15 && windAt(H) < 12) for (const g of GROUNDS.slice(0, 3)) for (let k = 0; k < 5; k++){ const a = k * 1.26 + H * 0.07, q = {x:g.p.x + Math.cos(a) * g.r * 0.45 * (k ? 1 : 0), y:g.p.y + Math.sin(a) * g.r * 0.45 * (k ? 1 : 0)}; if (!isLandFar(q)) takeStock(q, 12, null, true); }
}
// preferred depth (m) and spread per species: cod and saithe on the banks, haddock deeper, ling and tusk deep
const DPREF = Object.fromEntries(ALLSP.map(sp => [sp, SPECIES[sp].dep]));
function depthFactor(sp, d){ const q = DPREF[sp]; return 0.3 + 0.7 * Math.exp(-((Math.log(Math.max(d, 2) / q[0]) / q[1]) ** 2)); }
const SST = [3.6,3.1,3.2,3.9,5.6,8.2,10.8,11.4,9.8,7.8,6.0,4.6];
// where a harbour unit stands (07-harbours.js) its quay is dry and its basin dredged
// the depth below chart datum (m): the tiles' depth where they have it, else the sea floor offshore from the core, else the model
// (openness and the distance to the shore)
function depthF(p){ return unitDredge(p, isLand(p) ? 0 : DEPTH && mapSimAt(p) && depthHas(p) ? Math.max(0.8, tileDepth(p, depthWater(p))) : offDepth(p)); }
// whether the four cells depthWater reads at p all lie in blocks some pack has: at a tile's seaward edge the next cell's block can be
// one no pack covers (open sea), and that is the model's water, not an error (Autonav over open sea threw «depth block has no
// pack», 08.10.2026). A block a pack has but is not loaded yet still throws, as it should.
// (asked for every depth read: the one block the four cells mostly share is remembered, so the usual read costs a few sums)
const DHC = {k:null, v:true};
function depthHas(p){
  const L = MAPD.L.depth, n = L.n, ix = Math.floor(clamp(p.x / L.c - 0.5, L.ix0, L.ix0 + L.nx - 1.001)), iy = Math.floor(clamp(p.y / L.c - 0.5, L.iy0, L.iy0 + L.ny - 1.001));
  const bx0 = Math.floor(ix / n), by0 = Math.floor(iy / n), bx1 = Math.floor((ix + 1) / n), by1 = Math.floor((iy + 1) / n);
  if (bx0 === bx1 && by0 === by1){ const k = bx0 * 65536 + by0; if (DHC.k !== k){ DHC.k = k; DHC.v = mapBlockKnown(L, bx0, by0); } return DHC.v; }
  return mapBlockKnown(L, bx0, by0) && mapBlockKnown(L, bx1, by0) && mapBlockKnown(L, bx0, by1) && mapBlockKnown(L, bx1, by1);
}
// the sea floor offshore (tools/map/deep.py, 07.10.2026, for the Greenland halibut on the shelf edge): Terrarium's on 1 km cells over the
// whole frame, 0 on land and where it has none. The coast's tiles end 40-65 km out, and the model beyond them is never deeper than
// about 260 m
function deepAt(p){
  const L = MAPD.L.deep; if (!L || !MAPD.core || !MAPD.core.buf) return 0;
  const gx = p.x / L.c - 0.5, gy = p.y / L.c - 0.5; if (gx < 0 || gy < 0 || gx > L.nx - 1 || gy > L.ny - 1) return 0;
  return rbil(L, p);
}
function offDepth(p){ const z = deepAt(p); return z > 5 ? z : depthModel(p); }
// a tile's depth where Kartverket has no data is the model (coast.py fills it in): there, deep enough to be off the banks, the offshore
// layer gives the real floor; Kartverket's own soundings are kept
function tileDepth(p, d){ if (d < 150) return d; const z = deepAt(p); return z > d && Math.abs(d - depthModel(p)) <= 8 ? z : d; }   // the cheap read first: the model only when the sea floor is deeper
// the tiles' depth between the four nearest cells that are water (the layer has 0 on the 25 m mask's land): the fine coast decides
// what is land (01d-coast.js), so next to it the water keeps the depth of its own cells rather than running out to 0 (which grounded
// boats in water the chart shows). Where all four are land, the water cells two round; where there are none, 2 m (a sound the mask closed).
function depthWater(p){
  const L = MAPD.L.depth, gx = clamp(p.x / L.c - 0.5, L.ix0, L.ix0 + L.nx - 1.001), gy = clamp(p.y / L.c - 0.5, L.iy0, L.iy0 + L.ny - 1.001), ix = Math.floor(gx), iy = Math.floor(gy), fx = gx - ix, fy = gy - iy;
  const a = rcell(L, ix, iy), b = rcell(L, ix + 1, iy), c = rcell(L, ix, iy + 1), d = rcell(L, ix + 1, iy + 1);
  if (a > 0 && b > 0 && c > 0 && d > 0) return ((a * (1 - fx) + b * fx) * (1 - fy) + (c * (1 - fx) + d * fx) * fy) * L.k;
  const wa = a > 0 ? (1 - fx) * (1 - fy) : 0, wb = b > 0 ? fx * (1 - fy) : 0, wc = c > 0 ? (1 - fx) * fy : 0, wd = d > 0 ? fx * fy : 0, w = wa + wb + wc + wd;
  if (w > 1e-6) return (a * wa + b * wb + c * wc + d * wd) / w * L.k;
  let s = 0, n = 0;
  for (let j = iy - 1; j <= iy + 2; j++) for (let i = ix - 1; i <= ix + 2; i++){ if (!mapIn(L, i, j)) continue; const v = rcell(L, i, j); if (v > 0){ s += v; n++; } }
  return n ? s / n * L.k : 2;
}
function depthAt(p){ return Math.round(depthF(p)); }
function depthModel(p){ return (2 + (13 + 220 * Math.pow(exposure(p), 1.6) + 25 * vn(p.x / 4 + p.y / 7, 5)) * Math.pow(sstep(0, 1.5, coastDistFar(p)), 0.6)); }
function grade(f){ return f >= 85 ? 'E' : f >= 65 ? 'A' : f >= 40 ? 'B' : f >= 15 ? 'X' : 'V'; }
// days with few boats out give slightly higher prices; 2025 showed almost no link between local volume and price, so the effect is small
function supplyFactor(H){
  const H0 = Math.floor(H / 24) * 24 + 1; let good = 0, n = 0;
  for (let k = 3; k <= 39; k += 3){ const Hk = H0 - k, hr = gDate(Hk).getUTCHours(); if (hr < 5 || hr > 20) continue; n++; if (windAt(Hk) < 11) good++; }
  return 1.03 - 0.06 * (n ? good / n : 1);
}
// weekly price movement per species (set each Monday), pulled back towards the seasonal level: dev = 0.7 × last week + noise
const WDC = {};
function weekOfH(H){ return Math.floor((H + 6) / 168); }
function weekDev(sp, H){
  const w = weekOfH(H), key = sp + w; if (WDC[key] != null) return WDC[key];
  const i = ALLSP.indexOf(sp), sg = SPECIES[sp].sig; let dv = 0;
  for (let k = w - 16; k <= w; k++) dv = 0.7 * dv + sg * gauss(h2(k * 13 + i * 7 + 5000, 811), h2(k * 17 + i * 3 + 5000, 812));
  return WDC[key] = clamp(dv, -0.25, 0.25);
}
function marketPrice(sp, H){ return seasonal(SPECIES[sp].pm, H) * (1 + weekDev(sp, H)); }
// price per kg round weight for one size class at one buyer; the minimum price (with the hook-caught premium) is the floor
function clsPrice(port, sp, c, H, hook){
  const s = SPECIES[sp], cl = s.cls[c], ref = s.cls[s.ref];
  const sat = ((S && S.market && S.market[port.id] && S.market[port.id][sp]) || 0) + wshSat(port.id, sp, H);   // the other players' too
  const mk = marketPrice(sp, H) * port.pf * folkPf(port.id) * supplyFactor(H) * (cl[1] / ref[1]) * Math.max(0.9, 1 - sat / 40000);
  return Math.round(Math.max(cl[1] * (hook !== false && cl[3] ? cl[3] : 1), mk) * 100) / 100;
}
function price(port, sp, H){ return clsPrice(port, sp, SPECIES[sp].ref, H, true); }
// the average over the ten plants nearest the boat (the whole coast's are too many, and too far to matter)
function avgPrice(sp, H, days){ let s = 0, n = 0; const near = plantsNear(S.boat.pos, 10); for (let d = 0; d < days; d++) for (const {pt:q} of near){ s += price(q, sp, H - d * 24); n++; } return n ? s / n : 0; }
// ---------- quotas north of 62° N: the regulation and the year's figures are in 03d-quota.js ----------
function doyH(H){ const g = gDate(H); return Math.floor((g - Date.UTC(g.getUTCFullYear(), 0, 1)) / 864e5); }
function yearH(H){ return gDate(H).getUTCFullYear(); }
function quotaState(){ const y = yearH(S.t / 60); if (!S.quota || S.quota.y !== y) S.quota = {y, torsk:0, hyse:0, sei:0, ffW:-1, ffTot:0, ffCod:0, conf:0, confKr:0, byCod:0}; return S.quota; }
// Vessels for sale with a closed-group right (deltakeradgang), by quota length (hjemmelslengde). The quotas are the year's (licQ in
// 03d-quota.js): cod as a fixed vessel quota, haddock and saithe as [maximum, guaranteed] kg for the boat's largest length. The price
// is the boat plus the cod quota at KPK kr a kg. KPK is an estimate: Hepsøfjord (10.98 m, two quota sets) sold for 17.5 million in
// 2025, about 270 kr/kg; no source publishes quota prices.
const KPK = 260;
const LIC_OFFERS = [
  {id:'u7', ves:'trebat', no:'Gammel tresnekke med hjemmel under 7 m', en:'Old wooden snekke with a right under 7 m'},
  {id:'h7', ves:'snekke', no:'Plastsnekke med hjemmel 7–7,9 m', en:'Fibreglass snekke with a right of 7–7.9 m'},
  {id:'h8', ves:'jukesjark', no:'Plastsjark med hjemmel 8–8,9 m', en:'Fibreglass sjark with a right of 8–8.9 m'},
  {id:'h9', ves:'sjark', no:'Havsjark 35 fot med hjemmel 9–9,9 m', en:'35 ft havsjark with a right of 9–9.9 m'},
  {id:'h10', ves:'hurtigsjark', no:'Hurtigsjark med hjemmel 10–10,9 m', en:'Speed sjark with a right of 10–10.9 m'},
  {id:'h14', ves:'kyst15', no:'Kystbåt 14,99 m med hjemmel 14–14,9 m', en:'14.99 m coastal vessel with a right of 14–14.9 m'},
  {id:'h20', ves:'kyst21', no:'Eldre kystbåt 21 m med hjemmel 20–20,9 m', en:'Older 21 m coastal vessel with a right of 20–20.9 m'}
];
function licValue(l){ return l ? Math.round(licQ(l).torsk * KPK) : 0; }
// blad B in the fishermen's register, simplified. Deltakerloven § 6 asks the buyer of a closed-group vessel to have fished commercially
// in at least three of the last five years, and blad B (fishing as the main occupation) is the usual proof. Here: 10 landing days with
// you aboard and 1 G of first-hand value (G from 1 May 2025, nav.no; to be updated for 2026)
const BLADB = {days:10, kr:130160};
// The sales organisation's deductions on the landing note (Norges Råfisklag, «Forklaring til trekk på fiskers avregning», rafisklaget.no,
// read 04.10.2026): the organisation's own levy on the gross value (fresh fish 0,43 % from 1.7.2026), and on the gross less it
// («trekkgrunnlag 1») the pension levy to Garantikassen for fiskere (0,4 % from 1.1.2023, every fisher), the product levy to NAV
// (1,6 % from 1.1.2026, folketrygdloven § 23-5; it pays the fishers' social security above 7,6 % and the employer's tax on crew wages),
// the fisheries research levy (1,35 %), the resource levy to the state (0,42 %) and the control levy (0,22 %, not yet taken from
// vessels under 15 m). The crew's share is reckoned on what is left (an assumption: the crew agreements reckon it after the common costs)
const TREKK = {lag:0.0043, pens:0.004, prod:0.016, forsk:0.0135, ress:0.0042, ktrl:0.0022};
// VAT on the first-hand sale through the sales organisation: 11,11 % (merverdiavgiftsloven § 5-8) of the gross less the public levies
// (the same page), only for a fisher in the VAT register, who settles it with the state himself; the game passes it straight on.
// A business must register when its sales pass 50 000 kr in twelve months (merverdiavgiftsloven § 2-1); a fisher's business is then a
// sole proprietorship (enkeltpersonforetak) in the Central Coordinating Register (Enhetsregisteret), which needs no company to fish.
const MVA = {rate:0.1111, limit:50000};
// Income tax (E4 of the economy plan, 04.10.2026). The year's profit is the revenue less the costs in S.stats (the levies, the shares,
// fuel, gear, interest ...; not the instalments, the boats bought or the tax itself) less the boats' depreciation (14 % a year of the
// hulls and engines, saldogruppe e; a quota right is not depreciated). As a sole proprietor (ENK) the profit is the owner's income:
// 22 % on it less the fisherman's deduction (30 % of it, at most 160 000 kr, when at least 130 days of the year were spent fishing) and
// the personal allowance, 7,6 % social security (fishers' rate; the product levy pays the rest) and the bracket tax. As a company (AS)
// it pays 22 %, and keeps its books for 30 000 kr a year (an estimate). The rates are 2026's (Stortingets skattevedtak and the vedtak on
// the folketrygd's levies for 2026, as regjeringen.no and others give them: found by search 04.10.2026, Lovdata and Skatteetaten were
// shut from here). The social security has its lower limit (99 650 kr) and is at most 25 % of the income above it. A loss is not
// carried forward. Paid every quarter on the year so far, settled at the new year.
const TAX = {alm:0.22, pfrad:114540, trygd:0.076, tlow:99650, trinn:[[226100, 0.017], [318300, 0.04], [725050, 0.137], [980100, 0.168], [1467200, 0.178]],
  fisk:{share:0.30, max:160000, days:130}, as:{rate:0.22, capital:30000, fee:5570, books:30000}, dep:0.14};
function taxOf(P, form, days){
  const R = {P:Math.round(P), fd:0, alm:0, tryg:0, trinn:0, sum:0}; if (P <= 0) return R;
  if (form === 'AS'){ R.alm = Math.round(P * TAX.as.rate); R.sum = R.alm; return R; }
  R.fd = days >= TAX.fisk.days ? Math.round(Math.min(P * TAX.fisk.share, TAX.fisk.max)) : 0;
  R.alm = Math.round(Math.max(0, P - R.fd - TAX.pfrad) * TAX.alm); R.tryg = P > TAX.tlow ? Math.round(Math.min(P * TAX.trygd, (P - TAX.tlow) * 0.25)) : 0;
  const B = TAX.trinn; for (let i = 0; i < B.length; i++){ const lo = B[i][0], hi = i + 1 < B.length ? B[i + 1][0] : Infinity; if (P > lo) R.trinn += (Math.min(P, hi) - lo) * B[i][1]; }
  R.trinn = Math.round(R.trinn); R.sum = R.alm + R.tryg + R.trinn; return R;
}
// the hulls' and engines' value for the depreciation (vesselValue less the quota right)
const depBase = () => S.fleet.reduce((a, v) => { const b = vget(v, 'boat'), eq = vget(v, 'equip') || {}; return a + VESSELS[b.type].price * 0.7 + (eq.motor90 ? EQUIP.motor90.price * 0.5 : 0); }, 0);
function txInit(H){ S.tx = {y:gDate(H).getUTCFullYear(), rev0:S.stats.revenue, cost0:S.stats.costs, paid:0, days:[]}; }
// the profit of the year so far, with the depreciation for the part of the year that has gone
function txProfit(H){ const T = S.tx, d = gDate(H), y0 = Date.UTC(T.y, 0, 1), frac = clamp((d.getTime() - y0) / (Date.UTC(T.y + 1, 0, 1) - y0), 0, 1);
  return (S.stats.revenue - T.rev0) - (S.stats.costs - T.cost0) - depBase() * TAX.dep * frac; }
const txForm = () => S.form === 'AS' ? 'AS' : 'ENK';
// at midnight: the days at sea with you aboard, the company's books every month, the advance every quarter, the settlement at the new year
function taxTick(H){
  if (!S.tx) txInit(H);
  const T = S.tx, d = gDate(H), mv = vesselById(S.me), mb = mv ? vget(mv, 'boat') : null, day = Math.floor(H / 24);
  if (mb && ['sailing', 'fishing'].includes(mb.status) && T.days[T.days.length - 1] !== day) T.days.push(day);
  if (d.getUTCDate() !== 1) return;
  if (S.form === 'AS'){ const c = Math.round(TAX.as.books / 12); S.cash -= c; S.stats.costs += c; }
  const m = d.getUTCMonth(); if (m % 3) return;
  const L2 = (no, en) => S.lang === 'no' ? no : en;
  if (m === 0 && d.getUTCFullYear() > T.y){
    // the settlement for the year that has ended
    const R = taxOf(txProfit(H), txForm(), T.days.length), rest = R.sum - T.paid; S.cash -= rest; S.stats.tax = (S.stats.tax || 0) + rest;
    S.taxLast = {y:T.y, form:txForm(), days:T.days.length, R, paid:T.paid, rest};
    msg('Skatteetaten', 'Skatteoppgjøret for ' + T.y + ' (' + (txForm() === 'AS' ? 'aksjeselskap' : 'enkeltpersonforetak') + '): overskudd ' + kr(R.P) + ', skatt ' + kr(R.sum) + (R.fd ? ', fiskerfradrag ' + kr(R.fd) : '') + '. Forskudd betalt ' + kr(T.paid) + '. ' + (rest >= 0 ? 'Restskatt ' + kr(rest) + ' er trukket.' : 'Du får ' + kr(-rest) + ' tilbake.'),
      'The tax settlement for ' + T.y + ': profit NOK ' + R.P + ', tax NOK ' + R.sum + '. Paid in advance NOK ' + T.paid + '. ' + (rest >= 0 ? 'NOK ' + rest + ' still owed has been taken.' : 'NOK ' + (-rest) + ' comes back to you.'));
    txInit(H); return;
  }
  // the advance on the year so far (nothing comes back until the settlement)
  const due = taxOf(txProfit(H), txForm(), T.days.length).sum - T.paid;
  if (due > 0){ S.cash -= due; T.paid += due; S.stats.tax = (S.stats.tax || 0) + due;
    msg('Skatteetaten', 'Forskuddsskatt for ' + T.y + ': ' + kr(due) + ' er trukket. Betalt i år: ' + kr(T.paid) + '.', 'Advance tax for ' + T.y + ': NOK ' + due + ' taken. Paid this year: NOK ' + T.paid + '.'); }
}
// founding the company: the share capital stays the company's money, the registration fee goes
function foundAS(){
  if (S.form === 'AS' || S.cash < TAX.as.capital + TAX.as.fee) return false;
  S.cash -= TAX.as.fee; S.stats.costs += TAX.as.fee; S.form = 'AS'; S.formT = S.t; if (!S.company) S.company = (S.boatName || 'Havbris') + ' Fiskeri'; if (!/ AS$/.test(S.company)) S.company += ' AS'; pressPut('as', {type:S.boat.type});
  msg('Brønnøysundregistrene', S.company + ' er registrert i Foretaksregisteret med ' + kr(TAX.as.capital) + ' i aksjekapital. Fra nå skattlegges overskuddet med 22 % i selskapet, uten fiskerfradrag, og selskapet fører regnskap. Rederi-appen ligger nå på telefonen.', S.company + ' is registered with NOK ' + TAX.as.capital + ' in share capital. From now the profit is taxed at 22 % in the company, without the fisherman\'s deduction, and the company keeps books. The Company app is now on the phone.');
  return true;
}
const mvaOf = (total, tk) => Math.round((total - tk.pens - tk.prod - tk.forsk - tk.ress - tk.ktrl) * MVA.rate);
// the sales of the last twelve months (kroner, gross) and the registration when they pass the limit
function mvaCheck(total){
  if (S.mva) return false;
  const yr = (S.sales || []).filter(s => s.t > S.t - 365 * 1440).reduce((a, s) => a + (s.total || 0), 0) + total;
  if (yr < MVA.limit) return false;
  S.mva = {t:S.t, org:900000000 + Math.floor(h2(S.t % 100000, 77) * 99999999)};
  msg('Brønnøysundregistrene', 'Salget ditt har passert 50 000 kr på tolv måneder. Fisket ditt er registrert som enkeltpersonforetak i Enhetsregisteret, og foretaket er ført i Merverdiavgiftsregisteret. Fra nå legger Råfisklaget 11,11 % MVA på oppgjøret, og du betaler den videre til staten. Se Papirer under Sjømann.',
    'Your sales have passed NOK 50,000 in twelve months. Your fishing is registered as a sole proprietorship in the Central Coordinating Register and in the VAT register. From now the sales organisation adds 11.11 % VAT to the settlement, which you pass on to the state. See Papers under Seaman.');
  return true;
}
function trekkOf(total, len){
  const lag = Math.round(total * TREKK.lag), g = total - lag, r = k => Math.round(g * TREKK[k]);
  const t = {lag, pens:r('pens'), prod:r('prod'), forsk:r('forsk'), ress:r('ress'), ktrl:len >= 15 ? r('ktrl') : 0};
  t.sum = t.lag + t.pens + t.prod + t.forsk + t.ress + t.ktrl; return t;
}
function fmInit(){ const F = {n:0, last:-1, kr:0, b:false}; for (const s of S.sales || []){ const d = Math.floor(s.t / 1440); if (d !== F.last){ F.n++; F.last = d; } F.kr += s.total || 0; }
  F.b = !!(S.lic || (S.fleet || []).some(v => v.lic)) || (F.n >= BLADB.days && F.kr >= BLADB.kr); return F; }
function fmLand(total){ const F = S.fm || (S.fm = fmInit()), d = Math.floor(S.t / 1440); if (d !== F.last){ F.n++; F.last = d; } F.kr += total;
  if (!F.b && F.n >= BLADB.days && F.kr >= BLADB.kr){ F.b = true;
    msg('Fiskeridirektoratet', 'Du er ført på blad B i fiskermanntallet: fiske er hovedyrket ditt. Nå kan du kjøpe en båt med deltakeradgang i lukket gruppe, og Innovasjon Norge kan toppfinansiere det første kjøpet. Se Båthandel under Verft.', 'You are on blad B of the fishermen\'s register: fishing is your main occupation. You can now buy a boat with a closed-group right, and Innovasjon Norge can top up the financing of the first one. See the boat market in the yard.'); } }
const bladB = () => !!(S.fm && S.fm.b);
// loans: Kystbanken lends against the fleet; Innovasjon Norge tops up the first closed-group purchase with a risk loan at a higher rate
// (the share and the rate are estimates, not checked against their terms)
const LOANS = {loan:{who:'Kystbanken', rate:0.069}, loanIN:{who:'Innovasjon Norge', rate:0.089}};
const debt = () => (S.loan ? S.loan.bal : 0) + (S.loanIN ? S.loanIN.bal : 0);
const innOK = () => bladB() && !S.inUsed && !S.fleet.some(v => vget(v, 'lic'));
function takeLoan(amount, months, k){ k = k || 'loan'; const C = LOANS[k], r = C.rate / 12, n = months || 120, O = S[k], bal = (O ? O.bal : 0) + amount;
  S[k] = {bal, rate:C.rate, pay:Math.round(bal * r / (1 - Math.pow(1 + r, -n))), next:O ? O.next : S.t + 30 * 24 * 60}; S.cash += amount;
  msg(C.who, (k === 'loanIN' ? 'Toppfinansieringen er innvilget: risikolån på ' : 'Lånet på ') + Math.round(amount) + ' kr er utbetalt, over ' + Math.round(n / 12) + ' år. Terminbeløp ' + S[k].pay + ' kr.', (k === 'loanIN' ? 'The top-up is granted: a risk loan of NOK ' : 'The loan of NOK ') + Math.round(amount) + ' has been paid out, over ' + Math.round(n / 12) + ' years. Monthly payment NOK ' + S[k].pay + '.'); }
// a sold or traded-in vessel pays off the loans first (Kystbanken's, then Innovasjon Norge's); returns what went to the lenders
function payDown(x){ let left = x; for (const k of ['loan', 'loanIN']){ const L = S[k]; if (!L || left <= 0) continue; const p = Math.min(L.bal, left); L.bal -= p; left -= p; if (L.bal < 1) S[k] = null; } return x - left; }
// what a purchase costs: the trade-in pays off the loans, and only the rest counts as equity. The bank lends up to 80 % of the price
// (Innovasjon Norge 15 % more on the first closed-group boat, so the buyer brings 5 %; set by tests/progweek.py so the entry comes
// with blad B, after about 14 trips), and all loans together stay within 80 % of the fleet with the new boat (plus the top-up).
// why: null, 'notes' (three landing notes first), 'eq' (too little equity) or 'cap' (the fleet carries no more debt)
const INN = 0.15;
function deal(price, ti, inn){
  const D = debt(), payoff = Math.min(ti, D), tiNet = ti - payoff, cost = price - tiNet, eqNeed = Math.max(0, price * (inn ? 0.2 - INN : 0.2) - tiNet);
  const loanNeed = S.cash >= cost ? 0 : cost - Math.max(0, S.cash - 5000), bankL = Math.min(loanNeed, price * 0.8), inL = loanNeed - bankL;
  const cap = (S.fleet.reduce((a, v) => a + vesselValue(v), 0) - ti + price) * 0.8 + (inn ? price * INN : 0) - (D - payoff);
  const why = !loanNeed ? null : S.sales.length < 3 ? 'notes' : S.cash < eqNeed ? 'eq' : inL > (inn ? price * INN : 0) + 1 || loanNeed > cap + 1 ? 'cap' : null;
  return {cost, eqNeed, loanNeed, bankL, inL, payoff, tiNet, ok:!why, why};
}
function finance(x, months){ if (x.payoff) payDown(x.payoff); if (x.bankL > 0) takeLoan(x.bankL, months); if (x.inL > 0) takeLoan(x.inL, 120, 'loanIN'); S.cash -= x.cost; }
function lenGroup(){ const L = BOAT.len || 5.8; return L < 8 ? 0 : L < 10 ? 1 : 2; }
function codLimits(H){ if (H == null) H = S.t / 60; if (S.lic){ const c = licQ(S.lic, H).torsk; return {max:c, guar:c}; } const O = yearQuota(yearH(H)).open, g = lenGroup(); return {max:(O.max[g] + openMaxAdd(H)) * 1000, guar:O.guar[g] * 1000}; }
// the open group's maximum-quota fishing is stopped when the group quota is estimated fished (the stop and the raises are worked out in
// 03d-quota.js); after the stop only the guaranteed quota is left. A closed-group vessel quota is never stopped.
function codOpen(H){ if (S.lic) return true; const sd = codStopDoy(yearH(H)); return sd == null || doyH(H) < sd; }
function codLimitNow(H){ const l = codLimits(H); return codOpen(H) ? l.max : l.guar; }
// ---- haill: luck from the quay. Fresh goods: full effect for two days, fading to nothing on day seven. Sold for real money only (test mode now) or won at the pub. ----
// Two kinds (the user's list 04.10.2026), bought (for real money; a test now) or won at the pub, and kept in a store until you switch one
// on yourself: never by itself. Haill is fresh the first 24 hours (+100 % luck on every species), then «mellomhaill» to 48 hours
// (+50 %) and «gammelhaill» to 72 hours (+25 %), gone after that. Luksushaill puts 24 hours at +200 % in front (gone after 96 hours).
// Game hours (Jonas 05.10.2026).
// The luck multiplies what every gear catches (the jig, line, nets and pots). The halibut luck is gone.
const HAILL = {
  haill:{no:'Haill', en:'Luck', nok:29, steps:[[24, 1], [48, 0.5], [72, 0.25]], d:{no:'Dobbel fiskelykke et helt døgn! Fersk haill gir +100 % fiskelykke på alle arter i 24 timer, så alt redskapet ditt fanger dobbelt så mye. Etterpå holder den seg som mellomhaill (+50 %) i 24 timer og gammelhaill (+25 %) i 24 timer til: tre døgn med ekstra fangst.', en:'Double luck for a whole day! Fresh luck gives +100% luck on every species for 24 hours, so all your gear catches twice as much. After that it lasts as middle luck (+50%) for 24 hours and old luck (+25%) for 24 more: three days of extra catch.'}},
  luksus:{no:'Luksushaill', en:'Luxury luck', nok:59, steps:[[24, 2], [48, 1], [72, 0.5], [96, 0.25]], d:{no:'Tredobbel fiskelykke det første døgnet! Luksushaill gir +200 % fiskelykke i 24 timer. Så følger fersk haill (+100 %), mellomhaill (+50 %) og gammelhaill (+25 %) i 24 timer hver: fire døgn med ekstra fangst, og mest av alt når du trenger det.', en:'Triple luck the first day! Luxury luck gives +200% luck for 24 hours. Then come fresh luck (+100%), middle luck (+50%) and old luck (+25%) for 24 hours each: four days of extra catch, the most when you need it.'}}
};
// the thank-you for feedback that helped the game (Jonas 06.10.2026: «12 spilltimer med 100% "haill" i belønning om tilbakemeldingen er
// av verdi for utviklingen av spillet. Haillet skal ikke gradvis miste effekt …, det skal vare 12timer, så ferdig»): +100 % for 12 game
// hours and then gone, with no weaker stages. Never sold: only the server gives it (supabase/migrations/20261006140000_feedback_reward.sql,
// ui/10i-shop.js shopClaim), into the store like the others.
HAILL.takk = {no:'Takk-haill', en:'Thank-you luck', nok:0, reward:true, steps:[[12, 1]], stage:['Takk-haill', 'Thank-you luck'],
  d:{no:'Takk for tilbakemeldingen! Takk-haill gir +100 % fiskelykke på alle arter i 12 timer, hele tida like sterk, og så er den borte.', en:'Thank you for your feedback! Thank-you luck gives +100 % luck on every species for 12 hours, as strong all the time, and then it is gone.'}};
const HAILL_STAGE = [[2, 'Luksushaill', 'Luxury luck'], [1, 'Fersk haill', 'Fresh luck'], [0.5, 'Mellomhaill', 'Middle luck'], [0.25, 'Gammelhaill', 'Old luck']];
const haillAge = () => S.haill ? (S.t - S.haill.t0) / 60 : 1e9;   // hours since it was switched on
function haillBoost(){ const h = S.haill, X = h && HAILL[h.type]; if (!X) return 0; const a = haillAge(); for (const [t, v] of X.steps) if (a < t) return v; return 0; }
function haillLeft(){ const h = S.haill, X = h && HAILL[h.type]; return X ? Math.max(0, X.steps[X.steps.length - 1][0] - haillAge()) : 0; }   // hours till it is gone
function haillStage(){ const v = haillBoost(), X = S.haill && HAILL[S.haill.type]; if (v > 0 && X && X.stage) return {v, no:X.stage[0], en:X.stage[1]};
  const s = HAILL_STAGE.find(x => x[0] === v); return s ? {v, no:s[1], en:s[2]} : null; }
function haillF(){ return haillBoost() > 0 ? 1 : 0; }   // luck aboard or not
function luck(sp){ return 1 + haillBoost(); }
// a purchase or a pub prize goes into the store; switching one on takes it from there (and replaces the one aboard)
function giveHaill(type, how){ const inv = S.haillInv || (S.haillInv = {haill:0, luksus:0}); inv[type] = (inv[type] || 0) + 1; log('Ny ' + HAILL[type].no.toLowerCase() + ' i beholdningen. Aktiver den i Haill-appen når du vil.', 'New ' + HAILL[type].en.toLowerCase() + ' in store. Switch it on in the Luck app when you like.'); }
function useHaill(type){ const inv = S.haillInv || {}; if (!(inv[type] > 0)) return false; inv[type]--; S.haill = {type, t0:S.t, how:'inv'}; log(HAILL[type].no + ' er aktivert.', HAILL[type].en + ' is switched on.'); return true; }
// the pub: one round per evening between 15:00 and 03:00, NOK 1000
const PUB_COST = 1000;
const PUB_WHEEL = [['tom', 20], ['haill', 6], ['tom', 20], ['rykte', 25], ['haill', 6], ['tom', 20], ['luksus', 3]];   // the halibut luck is gone (04.10.2026)
// game hour 0 is 06:00 on the clock (EPOCH), so an evening that opens at 15:00 starts at game hour 9 + 24·n
const EPOCH_HR = new Date(EPOCH).getUTCHours();
function pubEvening(H){ return Math.floor((H + EPOCH_HR - 15) / 24); }
function pubOpen(H){ const hr = gDate(H).getUTCHours(); return hr >= 15 || hr < 3; }
// the hold (borrowed deck tubs from «Kaffe på kaia» are gone since 01.10.2026)
function capHold(){ return Math.max(0, BOAT.holdCap - (typeof cargoKg === 'function' ? cargoKg() : 0)); }   // the room for fish: freight for a mission takes its part (09g-turer.js)
// ---- the daily login bonus: each real calendar day you open the game adds a point to a bonus on the fish price; each day
// you stay away takes three off, never below zero. No ceiling for now (decided 30.09.2026); change STREAK to add one. ----
const STREAK = {step:1, decay:3, max:Infinity};
function streakState(){ return S.streak || (S.streak = {last:null, pct:0, days:0, best:0}); }
function streakPct(){ return streakState().pct; }
function streakTouch(){
  const st = streakState(), today = dayKey(); if (st.last === today) return null;
  const gap = st.last ? dayNum(today) - dayNum(st.last) : 1; if (gap <= 0) return null;   // the clock went back: nothing happens
  const before = st.pct, lost = Math.min(before, STREAK.decay * (gap - 1));
  st.pct = Math.min(STREAK.max, before - lost + STREAK.step); st.days++; st.best = Math.max(st.best, st.pct); st.last = today;
  const r = {before, lost, pct:st.pct, missed:gap - 1};
  if (r.missed > 0 && lost > 0) log('Innloggingsbonus: du var borte ' + r.missed + (r.missed > 1 ? ' dager' : ' dag') + ', og bonusen falt ' + lost + ' %. Dagens innlogging gir 1 %, så nå er den ' + st.pct + ' %.',
    'Login bonus: you were away ' + r.missed + ' day' + (r.missed > 1 ? 's' : '') + ' and the bonus fell ' + lost + ' %. Today\'s login adds 1 %, so it is now ' + st.pct + ' %.');
  else log('Innloggingsbonus: ' + st.pct + ' % ekstra på fiskeprisen.', 'Login bonus: ' + st.pct + ' % extra on the fish price.');
  return r;
}
// ---- cold: effective temperature from air temperature and wind, plus wet from rain, snow and spray. Cold, wet hands fish worse;
// oilskins keep you dry, a thermal suit keeps you warm, and everyone aboard needs their own ----
const CLOTHES = {olje:{no:'Oljehyre', en:'Oilskins', price:1290, d:{no:'Jakke og bukse som holder deg tørr i regn og sjøsprøyt.', en:'Jacket and trousers that keep you dry in rain and spray.'}},
                 varme:{no:'Varmedress', en:'Thermal suit', price:3490, d:{no:'Flytedress som holder deg varm i kulde og vind.', en:'Flotation suit that keeps you warm in cold and wind.'}}};
function effTemp(H){ const T = airTemp(H), v = windAt(H) * 3.6; return (T > 10 || v < 4.8) ? T : 13.12 + 0.6215 * T - 11.37 * Math.pow(v, 0.16) + 0.3965 * T * Math.pow(v, 0.16); }
function coldPen(H, hs){
  const cold = clamp((5 - effTemp(H)) / 25, 0, 1), wet = Math.max(precipAt(H), sstep(0.6, 1.8, hs == null ? hsAt(S.boat.pos, H) : hs));
  const people = 1 + (S.crew ? S.crew.length : 0), c = S.clothes || {}, o = Math.min(1, (c.olje || 0) / people), w = Math.min(1, (c.varme || 0) / people);
  const pen = (kc, kw) => Math.min(0.5, 0.35 * cold * kc + 0.15 * wet * kw);
  return pen(1, 1) * (1 - o) * (1 - w) + pen(0.85, 0.2) * o * (1 - w) + pen(0.3, 0.6) * w * (1 - o) + pen(0.25, 0.15) * o * w;
}
// ---- orders from buyers and customers: species, amount, quality, deadline and a price premium; reputation builds with each buyer ----
const CUSTOMERS = [
  {id:'mh', no:'Mottaket på Husøy', port:'husoy', sp:['torsk', 'sei', 'hyse'], big:true, q:'A'},
  {id:'ms', no:'Mottaket i Senjahopen', port:'senjahopen', sp:['sei', 'torsk', 'hyse'], big:true, q:'A'},
  {id:'mg', no:'Mottaket i Gryllefjord', port:'gryllefjord', sp:['torsk', 'sei', 'lange', 'brosme'], big:true, q:'B'},
  {id:'mb', no:'Mottaket i Botnhamn', port:'botnhamn', sp:['torsk', 'hyse', 'sei'], big:true, q:'A'},
  {id:'fb', no:'Fiskebutikken på Finnsnes', port:'botnhamn', sp:['hyse', 'torsk', 'lyr'], big:false, q:'E'},
  {id:'ht', no:'Hotellet på Finnsnes', port:'botnhamn', sp:['lyr', 'kveite', 'torsk'], big:false, q:'E'},
  {id:'rs', no:'Restauranten i Senjahopen', port:'senjahopen', sp:['kveite', 'lyr', 'uer'], big:false, q:'E'},
  {id:'mso', no:'Mottaket på Sommarøy', port:'sommaroy', sp:['torsk', 'sei', 'hyse'], big:true, q:'A'},
  {id:'mbr', no:'Mottaket i Brensholmen', port:'brensholmen', sp:['torsk', 'hyse', 'sei'], big:true, q:'A'},
  {id:'mto', no:'Mottaket i Torsken', port:'torsken', sp:['torsk', 'sei', 'lange', 'brosme'], big:true, q:'B'},
  {id:'mfr', no:'Mottaket i Frovåg', port:'frovag', sp:['torsk', 'hyse', 'sei'], big:true, q:'A'}
];
const QN = {E:{no:'Ekstra', en:'Extra'}, A:{no:'A eller bedre', en:'A or better'}, B:{no:'B eller bedre', en:'B or better'}};
function gradeOk(g, q){ return q === 'E' ? g === 'E' : q === 'A' ? (g === 'E' || g === 'A') : (g === 'E' || g === 'A' || g === 'B'); }
function ordState(){ return S.orders || (S.orders = {offers:[], active:[], done:[], seq:0}); }
// the customers that post orders to you: those within 60 km of the home harbour or 40 km of the boat (a start along the coast,
// 05.10.2026: the coast's plants are customers too, 06b-coastports.js); from Senja, all of Senja's own as before
function custNear(c){
  const q = portById(c.port), home = portById(S.home || HOME0); if (!q) return false;
  if (!c.coastal && !(home && home.coastal)) return true;
  return (home && dist(q.p, home.p) < 60) || dist(q.p, S.boat.pos) < 40;
}
function repOf(id){ return (S.rep && S.rep[id] != null) ? S.rep[id] : 50; }
// Greenland halibut is ordered in the direct fishery, until the stop is announced, by a boat that may fish it and has line or nets
function bkOrderable(H){ const s = bkSeason(yearH(H)), g = S.pgear; return H >= s.open && H < s.notice && bladB() && BOAT.len < 28 && !!g && (!!(g.nets && g.nets.length) || ['bank', 'hyse'].some(k => g.lines && g.lines[k] && g.lines[k].n > 0)); }
// every plant north of 62° N orders it (Jonas 07.10.2026: «Alle mottak skal kunne ta i mot blåkveite»)
function bkPlant(id){ const q = portById(id); return !!(q && q.mottak !== false && natLL(q.p).lat >= 62); }
function custSp(c){ return c.big && bkPlant(c.port) && !c.sp.includes('blakveite') ? c.sp.concat('blakveite') : c.sp; }
function spCatchable(sp, H){ if (sp === 'blakveite') return bkOrderable(H); if (sp === 'kveite' && kveiteClosed(H)) return false; if (sp === 'uer' && !uerOpen(H)) return false; if (sp === 'kveite' && !S.boat.kgear) return false;
  const s = SPECIES[sp]; let a = seasonal(s.av, H); if (sp === 'torsk') a += seasonal(s.skrei, H); return a >= 0.6; }
function ordersTick(H){
  const O = ordState();
  // deadlines: offers you did not take, and orders you did not deliver
  O.offers = O.offers.filter(o => o.offerUntil > S.t);
  for (const o of O.active.slice()) if (o.due <= S.t){ O.active.splice(O.active.indexOf(o), 1); const c = CUSTOMERS.find(x => x.id === o.cust);
    O.done.unshift({...o, t:S.t, ok:false}); O.done = O.done.slice(0, 20);
    log('Oppdraget for ' + c.no + ' ble ikke levert i tide: ' + fmt(o.left, 0) + ' av ' + fmt(o.kg, 0) + ' kg ' + SPECIES[o.sp].no.toLowerCase() + ' mangler.', 'The order for ' + c.no + ' was not delivered in time: ' + fmt(o.left, 0) + ' of ' + fmt(o.kg, 0) + ' kg of ' + SPECIES[o.sp].en.toLowerCase() + ' missing.');
    S.rep[o.cust] = clamp(repOf(o.cust) - 10, 0, 100); msg(c.no, 'Bestillingen på ' + fmt(o.kg, 0) + ' kg ' + SPECIES[o.sp].no.toLowerCase() + ' kom ikke i tide. Vi får ta det neste gang.', 'The order for ' + fmt(o.kg, 0) + ' kg of ' + SPECIES[o.sp].en.toLowerCase() + ' did not arrive in time. Maybe next time.'); }
  // new offers in the morning: one or two a day, at most three open
  if (gDate(H).getUTCHours() !== 6 || O.offers.length >= 3) return;
  const n = 1 + (h2(Math.floor(H / 24), 1301) < 0.4 ? 1 : 0);
  for (let k = 0; k < n && O.offers.length < 3; k++){
    const pool = CUSTOMERS.filter(custNear).map(c => ({c, w:(0.5 + repOf(c.id) / 100) * (custSp(c).some(sp => spCatchable(sp, H)) ? 1 : 0)})).filter(x => x.w > 0); if (!pool.length) return;
    let r = Math.random() * pool.reduce((a, x) => a + x.w, 0), c = pool[0].c; for (const x of pool){ r -= x.w; if (r <= 0){ c = x.c; break; } }
    const sps = custSp(c).filter(sp => spCatchable(sp, H) && turRoom(sp, H) > 150); if (!sps.length) continue;   // within the access and the quotas (09g-turer.js)
    const sp = sps[Math.floor(Math.random() * sps.length)], cap = capHold();
    let kg = c.big ? Math.round(clamp(cap * (0.4 + Math.random() * 0.5), 100, 800) / 10) * 10 : Math.round((20 + Math.random() * 60) / 5) * 5;
    if (sp === 'kveite') kg = 20 + Math.round(Math.random() * 3) * 10;
    if (sp === 'blakveite') kg = Math.round(clamp(cap * (0.6 + Math.random() * 0.6), 300, 3000) / 50) * 50;   // a set or two on the edge
    kg = Math.max(10, Math.min(kg, Math.round(turRoom(sp, H) * 0.8 / 10) * 10));
    const rf = 0.8 + repOf(c.id) / 250, prem = Math.round((c.big ? 0.1 + Math.random() * 0.1 : 0.2 + Math.random() * 0.2) * rf * 100) / 100;
    O.offers.push({id:++O.seq, cust:c.id, port:c.port, sp, kg, left:kg, q:c.q, prem, bonus:Math.round((c.big ? 1500 + Math.random() * 1500 : 1000 + Math.random() * 1000) * rf / 100) * 100, offerUntil:S.t + 1440, days:sp === 'blakveite' ? 4 : c.big ? 3 : 2});
  }
}
