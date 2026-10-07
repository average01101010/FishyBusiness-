// ===== Turoppdrag: missions from where the boat is (07.10.2026; docs/engasjement.md point 4) =====
// A board of missions made from where the boat is now: two short (up to half an hour's sailing in real time), one of middle length
// and one long (one and a half to three hours), and in season a week's move to where the fish are. Each is checked against the boat
// before it is offered (her range on a tank, how exposed an open boat may go, the forecast, the hold and the hands aboard), so what
// stands on the board can be done. The reward follows what the boat earns in an hour of fishing, times 1.1, 1.3 and 1.6 and 2 for the
// season, for the time it takes without trim; the deadline is at least two and a half times that and never moves (Friction for Flow:
// the distance is real, and trim only shortens it). Kinds:
//   best    an order from a plant farther off (an order of 03-simulation.js at its premium, with the trip's pay as the bonus)
//   frakt   freight along the coast: goods in the hold from one harbour to another (S.cargo, per vessel: it takes its room from
//           capHold and its weight in boatTons, and is no part of a landing)
//   garn    lost gear to find and haul: a string of nets or a line with fish in it; the fish is yours and the owner pays a finder's fee
//   sesong  the season's move: land so many kilos of a species at the plants near a place before the week is out
// The crew talks about the trip as it starts (turDepart): the time it takes, and now and then the engine (the trim app's words).
const TUR = {
  cls:{kort:{h:[0.4, 3], f:1.1}, mid:{h:[3, 7.5], f:1.3}, lang:{h:[7.5, 18], f:1.6}},   // travel in game hours (6 a real hour) and the pay factor
  seasonF:2, detour:1.25, rate0:9000, move:37, sesongR:30, tipGap:20 * 3600e3, mechGap:72 * 3600e3
};
const TUR_GOODS = [
  {kg:[20, 60], no:'medisiner til legekontoret', en:'medicine for the surgery'}, {kg:[30, 120], no:'post og pakker', en:'mail and parcels'},
  {kg:[40, 200], no:'reservedeler til et fiskebruk', en:'spare parts for a fish plant'}, {kg:[60, 300], no:'agn til linefiskerne', en:'bait for the line fishers'},
  {kg:[80, 400], no:'tomme fiskekasser', en:'empty fish boxes'}, {kg:[100, 600], no:'tauverk og blåser', en:'rope and buoys'},
  {kg:[150, 1500], no:'proviant til en butikk', en:'provisions for a shop'}, {kg:[300, 3000], no:'nye garn til et fiskarlag', en:'new nets for a fishermen\'s club'}
];
const TUR_OWNERS = ['Kåre Nilsen', 'Hallvard Olsen', 'Ragnhild Johansen', 'Per Arne Hansen', 'Sigrid Pedersen', 'Odd Karlsen', 'Bjørn Isaksen', 'Torill Mikkelsen'];
const turL = (no, en) => S.lang === 'en' ? en : no;
function turState(){ const T = S.turer || (S.turer = {board:[], act:[], done:[], seq:0, at:null, tip:{t:0, n:0, k:0, said:0}, mech:0}); T.tip = T.tip || {t:0, n:0, k:0, said:0}; return T; }
const cargoKg = () => (S.cargo || []).reduce((a, c) => a + c.kg, 0);
// the boat's own speed without trim, its range on a full tank (nm), and the sea miles between two places (straight with the detours a
// route takes along a coast)
function turV(){ const T = trimOn(S.boat); return Math.max(2, (BOAT.vcruise || 6) / (T ? T.x : 1)); }
function turRange(){ const v = turV(); return (BOAT.fuelCap || 60) * v / Math.max(0.2, fuelLph(v, 6)); }
const turNm = (a, b) => dist(a, b) * TUR.detour / NM;
const turHere = () => S.boat.status === 'port' && portById(S.boat.port) ? portById(S.boat.port).p : S.boat.pos;
// what the boat earns in an hour of fishing, in real time: from her hold, as the first players earned (9 000 kr an hour in the
// 23-foot boat, about one landing an hour; a bigger boat earns more, but not in step with her hold)
function turRate(){ return TUR.rate0 * Math.pow(Math.max(100, BOAT.holdCap) / 350, 0.6); }
const turPay = (hGame, f) => Math.max(500, Math.round(turRate() * hGame / GAME_RATE * f / 100) * 100);
function turClass(hGame){ for (const k in TUR.cls){ const c = TUR.cls[k].h; if (hGame >= c[0] && hGame < c[1]) return k; } return null; }
const turMinR = hGame => Math.round(hGame * 60 / GAME_RATE);
// whether the boat can make the trip: on her tank (out and home for gear at sea; the plants sell diesel), along a line an open boat may
// take (sheltered water), and with a forecast that stays below where her own sea limit warns for the hours of the trip (fc false: the
// week's move, where the days to go are the player's own)
function turCan(a, b, hGame, back, fc = true){
  const nm = turNm(a, b); if ((back ? 2 : 1) * nm > 0.75 * turRange()) return false;
  const V = VESSELS[S.boat.type] || {}, open = V.cls === 'open', H = S.t / 60, warn = (BOAT.risk || [1.5])[0] * (open ? 0.8 : 1);
  try {
    for (let i = 1; i <= 8; i++){ const f = i / 8, p = {x:a.x + (b.x - a.x) * f, y:a.y + (b.y - a.y) * f};
      if (open && !isLandFar(p) && exposure(p) > 0.7) return false;
      if (fc && i % 4 === 0) for (let k = 0; k <= Math.ceil(hGame / 3); k++) if (hsAtFc(p, H + k * 3, H) > warn) return false; }
  } catch (e){ return false; }
  return true;
}
// ---- the quotas: what is left to land of a species (kg; Infinity where nothing limits it) ----
// Without access (J-30-2026 § 35) cod, haddock and saithe are bycatch only, so no mission asks for them. Cod: what is left under the
// maximum quota while the open group's fishing is open and the guaranteed after the stop, or the vessel quota in the closed group
// (codRoom; the fresh-fish allowance on top is not counted). The closed group's haddock and saithe: their maximum quotas (licQ). King crab
// has a quota and gear of its own and is no mission.
const TUR_THS = ['torsk', 'hyse', 'sei'];
function turRoom(sp, H){
  if (sp === 'krabbe') return 0;
  const acc = access(); if (!TUR_THS.includes(sp)) return Infinity; if (acc === 'none') return 0;
  if (sp === 'torsk') return codRoom(H);
  if (acc === 'lukket'){ const LQ = licQ(S.lic, H); return Math.max(0, ((LQ[sp] || [0])[0] || 0) - (quotaState()[sp] || 0)); }
  return Infinity;
}
// ---- the offers ----
function turPlants(){ return PORTS.filter(q => q.mottak && q.pier !== false); }
// the player's own record (the save holds what the cloud does; Jonas 07.10.2026: the missions are weighed by it): the sea time in years,
// the species and the size of a usual landing in this boat, and the plants landed at before. A newcomer gets short and middle trips
// (until the first trip is done), then the long, from the second day the season's move; from ten years the long go all the way to three
// hours, the orders may ask for Extra quality at a higher premium, and the places are more often new ones
function turMe(){
  const y = fsOf((S.fs && S.fs.p) || 0).y, own = (S.sales || []).filter(s => s.v === S.cur).slice(-8), sp = {};
  for (const s of own) for (const [k, kg] of s.sp || []) sp[k] = (sp[k] || 0) + kg;
  return {y, sp, kg:own.length ? own.reduce((a, s) => a + s.kg, 0) / own.length : 0, seen:new Set((S.sales || []).map(s => s.port))};
}
// the order the candidates are tried in: at random, but the newcomer's known places first and the old hand's new places first
function turOrder(cand, me){ const r = cand.map(x => [x, Math.random() + (x.q && (me.seen.has(x.q.id) === (me.y >= 5)) ? -0.6 : 0)]); return r.sort((a, b) => a[1] - b[1]).map(x => x[0]); }
const turHi = (cls, me) => cls === 'lang' && me.y < 10 ? 12 : TUR.cls[cls].h[1];
function turBest(o, cls, used, me = turMe()){
  const H = S.t / 60, mon = gDate(H).getUTCMonth(), c = TUR.cls[cls], v = turV(), hi = turHi(cls, me);
  const cand = turPlants().filter(q => !used.has(q.id) && q.id !== S.boat.port).map(q => ({q, h:turNm(o, q.p) / v})).filter(x => x.h >= c.h[0] && x.h < hi);
  for (const {q, h} of turOrder(cand, me)){
    const cust = CUSTOMERS.find(z => z.port === q.id && z.big); if (!cust) continue;
    const sps = q.mk && q.mk.sp ? Object.entries(q.mk.sp).filter(([sp, r]) => SPECIES[sp] && (r.months & (1 << mon)) && spCatchable(sp, H) && turRoom(sp, H) >= 150).sort((a, b) => b[1].kg - a[1].kg).map(r => r[0])
      : cust.sp.filter(sp => spCatchable(sp, H) && turRoom(sp, H) >= 150);
    if (!sps.length || !turCan(o, q.p, h, false)) continue;
    // a species the player lands, if the plant takes it; about a usual landing, or part of the hold for one who has not landed yet
    const sp = sps.slice().sort((a, b) => (me.sp[b] || 0) - (me.sp[a] || 0))[0], base = me.kg > 30 ? me.kg * (0.8 + Math.random() * 0.5) : BOAT.holdCap * (0.4 + Math.random() * 0.4);
    const kg = Math.max(50, Math.round(Math.min(BOAT.holdCap, base, turRoom(sp, H) * 0.8) / 10) * 10), xq = me.y >= 10 && Math.random() < 0.4;
    // the plant pays a known skipper a little more (its reputation, 03-simulation.js repOf: 0.8 to 1.2)
    return {k:'best', cls, to:q.id, p:q.p, nm:Math.round(turNm(o, q.p)), h, sp, kg, q:xq ? 'E' : 'A', prem:xq ? 0.2 : 0.1, cust:cust.id, pay:Math.round(turPay(h, c.f) * (0.8 + repOf(cust.id) / 250) / 100) * 100, hTot:h * 2.5 + 30};
  }
  return null;
}
function turFrakt(o, cls, used, me = turMe()){
  const c = TUR.cls[cls], v = turV(), hi = turHi(cls, me), from = S.boat.status === 'port' ? portById(S.boat.port) : nearestPort(S.boat.pos); if (!from) return null;
  const pick = S.boat.status === 'port' ? 0 : turNm(o, from.p) / v;
  const cand = PORTS.filter(q => q.id !== from.id && !used.has(q.id) && q.pier).map(q => ({q, h:pick + turNm(from.p, q.p) / v})).filter(x => x.h >= c.h[0] && x.h < hi);
  for (const {q, h} of turOrder(cand, me)){
    if (!turCan(from.p, q.p, h - pick, false) || (pick && !turCan(o, from.p, pick, false))) continue;
    const room = capHold() - holdTotal(), fit = TUR_GOODS.filter(g => g.kg[0] <= room * 0.6); if (!fit.length) return null;
    const g = fit[Math.floor(Math.random() * fit.length)], kg = Math.round(Math.min(g.kg[1], room * 0.6, Math.max(g.kg[0], BOAT.holdCap * (0.2 + Math.random() * 0.3))) / 10) * 10;
    return {k:'frakt', cls, from:from.id, to:q.id, p:q.p, nm:Math.round((pick ? turNm(o, from.p) : 0) + turNm(from.p, q.p)), h, kg, what:[g.no, g.en], pay:turPay(h, c.f), hTot:h * 2.5 + 12};
  }
  return null;
}
// lost gear near the coast within a short trip: a string of nets if two can haul it, else a bank line one can
function turGarn(o){
  const c = TUR.cls.kort, v = turV(), nets = handsAboard() >= GEAR.garn.crewMin && !!(S.pgear && S.pgear.nets && S.pgear.nets.length);
  for (let tries = 0; tries < 24; tries++){
    const a = Math.random() * Math.PI * 2, nm = 1.5 + Math.random() * Math.max(0.5, Math.min(c.h[1] * v * 0.45, 10) - 1.5), d = nm * NM / TUR.detour;
    const p = {x:o.x + Math.sin(a) * d, y:o.y - Math.cos(a) * d};
    try { if (isLandFar(p)) continue; const cd = coastDistFar(p); if (cd < 0.9 || cd > 6) continue; } catch (e){ continue; }   // off the shore, so the whole string lies in open water
    const h = 2 * turNm(o, p) / v + 1.5; if (h >= c.h[1] * 1.6 || !turCan(o, p, h, true)) continue;
    const owner = TUR_OWNERS[Math.floor(Math.random() * TUR_OWNERS.length)], kind = nets ? 'garn' : 'line', n = nets ? 4 + Math.floor(Math.random() * 5) : 1 + Math.floor(Math.random() * 2);
    const kg = Math.round(Math.min(BOAT.holdCap * 0.5, (nets ? n * 18 : n * 70) * (0.6 + Math.random() * 0.8)));
    return {k:'garn', cls:'kort', p, nm:Math.round(turNm(o, p)), h, kind, n, kgFish:kg, owner, pay:Math.max(500, Math.round(turPay(h, c.f) * 0.5 / 100) * 100), hTot:h * 2.5 + 24};
  }
  return null;
}
// the season's move: where a species is landed most this month, 40 to 250 nm off, and it is in season and catchable
function turSesong(o){
  const H = S.t / 60, mon = gDate(H).getUTCMonth(), v = turV(), cand = [];
  for (const q of turPlants()){ if (!q.mk || !q.mk.sp) continue; const nm = turNm(o, q.p); if (nm < 40 || nm > 250) continue;
    for (const sp in q.mk.sp){ const r = q.mk.sp[sp]; if (!SPECIES[sp] || !(r.months & (1 << mon)) || !spCatchable(sp, H) || turRoom(sp, H) < 1000) continue;
      cand.push({q, sp, nm, w:r.kg}); } }
  // the place where most is landed that the boat can reach on a tank, an open boat through sheltered water
  const best = cand.sort((a, b) => b.w - a.w).slice(0, 12).find(c => turCan(o, c.q.p, 0, false, false));
  if (!best) return null;
  const h = best.nm / v;
  const kg = Math.round(Math.max(500, Math.min(BOAT.holdCap * 3 * (turMe().y >= 10 ? 1.5 : 1), turRoom(best.sp, H) * 0.8)) / 100) * 100;
  // to the end of the week (Sunday night), or the next if this one is too short for the trip and the fishing
  const d = gDate(H), left = ((7 - d.getUTCDay()) % 7) * 24 + 24 - d.getUTCHours();
  const hTot = left >= h * 2.5 + 48 ? left : left + 168;
  return {k:'sesong', cls:'sesong', to:best.q.id, p:best.q.p, nm:Math.round(best.nm), h, sp:best.sp, kg, got:0, pay:turPay(h, TUR.seasonF) + turPay(12, 1), hTot};
}
function turMake(){
  const T = turState(), o = turHere(), used = new Set(T.act.map(m => m.to).filter(Boolean)), B = [], me = turMe();
  const add = m => { if (m){ m.id = ++T.seq; m.until = S.t + 1440; B.push(m); if (m.to) used.add(m.to); } };
  try {
    const garn = !T.act.some(m => m.k === 'garn');
    add(Math.random() < 0.5 ? turBest(o, 'kort', used) || turFrakt(o, 'kort', used) : turFrakt(o, 'kort', used) || turBest(o, 'kort', used));
    add(garn ? turGarn(o) || turFrakt(o, 'kort', used) || turBest(o, 'kort', used) : turBest(o, 'kort', used) || turFrakt(o, 'kort', used));
    if (B.filter(m => m.cls === 'kort').length < 2) add(garn && !B.some(m => m.k === 'garn') ? turGarn(o) : turFrakt(o, 'kort', used));
    add(Math.random() < 0.6 ? turBest(o, 'mid', used) || turFrakt(o, 'mid', used) : turFrakt(o, 'mid', used) || turBest(o, 'mid', used));
    // the newcomer, until the first trip is done: one more short instead of the long; the season's move from the second day
    if (me.y < 1) add(turFrakt(o, 'kort', used) || turBest(o, 'kort', used));
    else add(Math.random() < 0.5 ? turBest(o, 'lang', used) || turFrakt(o, 'lang', used) : turFrakt(o, 'lang', used) || turBest(o, 'lang', used));
    if (me.y >= 3 && !T.act.some(m => m.k === 'sesong')) add(turSesong(o));
  } catch (e){ console.warn('turMake', e); }
  T.board = B; T.at = {t:S.t, x:o.x, y:o.y};
}
// a new board in the morning, when the boat has moved more than 20 nm from where it was made, or when it is empty
function turEnsure(force){
  const T = turState(), o = turHere(), H = S.t / 60;
  T.board = T.board.filter(m => m.until > S.t);
  const morning = T.at && Math.floor((T.at.t / 60 - 6) / 24) !== Math.floor((H - 6) / 24);
  if (force || !T.at || (!T.board.length && S.t - T.at.t > 60) || morning || dist(o, T.at) > TUR.move) turMake();
  return T;
}
// ---- taking, doing and finishing ----
function turTake(id){
  const T = turState(), m = T.board.find(x => x.id === id); if (!m) return turL('Oppdraget er ikke lenger på tavla.', 'The mission is no longer on the board.');
  if (T.act.length >= 3) return turL('Du har allerede tre oppdrag. Fullfør eller gi fra deg ett først.', 'You already have three missions. Finish or give one up first.');
  if (m.k === 'frakt' && capHold() - holdTotal() < m.kg) return turL('Det er ikke plass i lasterommet. Lever fangsten først.', 'There is no room in the hold. Land the catch first.');
  T.board.splice(T.board.indexOf(m), 1); m.t0 = S.t; m.due = S.t + Math.round(m.hTot * 60); m.vid = S.cur;
  if (m.k === 'best'){ const O = ordState(); O.active.push({id:++O.seq, cust:m.cust, port:m.to, sp:m.sp, kg:m.kg, left:m.kg, q:m.q, prem:m.prem || 0.1, bonus:m.pay, offerUntil:S.t, days:Math.ceil(m.hTot / 24), due:m.due, tur:m.id}); m.ord = O.seq; }
  if (m.k === 'frakt'){ m.stage = 'pick'; if (S.boat.status === 'port' && S.boat.port === m.from) turLoad(m); }
  if (m.k === 'garn') turSpawn(m);
  T.act.push(m);
  if (typeof cloudEv === 'function') cloudEv('tur_take', {k:m.k, cls:m.cls, nm:m.nm, min:turMinR(m.h)});
  log('Tok oppdraget: ' + turWhat(m)[0] + '.', 'Took the mission: ' + turWhat(m)[1] + '.');
  return null;
}
function turDrop(id){
  const T = turState(), m = T.act.find(x => x.id === id); if (!m) return;
  turEnd(m, false, turL('Gav fra deg oppdraget.', 'Gave up the mission.'));
}
function turLoad(m){
  if (capHold() - holdTotal() < m.kg){ log('Lasta til ' + portById(m.to).name + ' venter på kaia. Det er ikke plass i lasterommet.', 'The freight for ' + portById(m.to).name + ' waits on the quay. There is no room in the hold.'); return false; }
  S.cargo = (S.cargo || []).concat([{tur:m.id, kg:m.kg, no:m.what[0], en:m.what[1]}]); m.stage = 'go'; m.vid = S.cur;
  log('Lastet ' + fmt(m.kg, 0) + ' kg ' + m.what[0] + ' for ' + portById(m.to).name + '.', 'Loaded ' + fmt(m.kg, 0) + ' kg of ' + m.what[1] + ' for ' + portById(m.to).name + '.');
  return true;
}
// the lost gear goes into the sea as a set of the boat's own, marked as found: hauled, the fish is yours and the gear goes to its owner
function turSpawn(m){
  const H = S.t / 60, ang = Math.random() * Math.PI, half = m.kind === 'garn' ? m.n * GEAR.garn.km / 2 : m.n * LINE_KINDS.bank.hooks * GEAR.line.kmHook / 2;
  let a = {x:m.p.x - Math.sin(ang) * half, y:m.p.y + Math.cos(ang) * half}, b = {x:m.p.x + Math.sin(ang) * half, y:m.p.y - Math.cos(ang) * half};
  // both ends in open water, well off the shore (turned a quarter round if not, and shortened to the middle at worst)
  const wet = q => { try { return !isLandFar(q) && coastDistFar(q) >= 0.4; } catch (e){ return false; } };
  if (!wet(a) || !wet(b)){ const c = Math.cos(ang), s0 = Math.sin(ang); a = {x:m.p.x - c * half, y:m.p.y - s0 * half}; b = {x:m.p.x + c * half, y:m.p.y + s0 * half};
    if (!wet(a) || !wet(b)){ a = {x:m.p.x - 0.05, y:m.p.y}; b = {x:m.p.x + 0.05, y:m.p.y}; } }
  // what is in it: the usual catch of the gear, of the species the player may land (without access or quota, ling and tusk)
  const mix = (m.kind === 'garn' ? [['torsk', 0.6], ['sei', 0.25], ['hyse', 0.15]] : [['hyse', 0.5], ['torsk', 0.35], ['lange', 0.15]]).filter(([s, w]) => SPECIES[s] && turRoom(s, H) >= m.kgFish * w * 1.5);
  const use = mix.length ? mix : [['lange', 0.6], ['brosme', 0.4]].filter(([s]) => SPECIES[s]), wt = use.reduce((a, x) => a + x[1], 0), acc = {};
  for (const [s, w] of use){ const kg = m.kgFish * w / wt; acc[s] = {kg, n:Math.max(1, Math.round(kg / 3)), ts:kg * (H - 30)}; }
  let depth = 40; try { depth = Math.round(depthF(m.p)); } catch (e){}
  const s = m.kind === 'garn' ? {kind:'garn', mesh:180, lid:null, cond:0.55, n:m.n, heavy:false} : {kind:'line', lk:'bank', hooks:m.n * LINE_KINDS.bank.hooks, baitW:{makrell:m.n}, n:m.n, heavy:false};
  Object.assign(s, {id:gid('s'), vid:S.cur, a, b, tSet:S.t - 36 * 60, depth, acc, dead:0, lost:null, rep:false, warn:0, tur:m.id, owner:m.owner});
  S.sets = S.sets || []; S.sets.push(s); m.sid = s.id; m.vid = S.cur;
}
function turEnd(m, ok, why){
  const T = turState(); T.act = T.act.filter(x => x !== m);
  if (!ok){
    if (m.k === 'frakt') S.cargo = (S.cargo || []).filter(c => c.tur !== m.id);
    if (m.k === 'garn') S.sets = (S.sets || []).filter(s => s.tur !== m.id);
    if (m.k === 'best'){ const O = ordState(); O.active = O.active.filter(o => o.tur !== m.id); }
  }
  T.done.unshift({id:m.id, k:m.k, cls:m.cls, to:m.to || null, ok, pay:ok ? m.pay : 0, t:S.t, what:turWhat(m)}); T.done = T.done.slice(0, 20);
  if (why) log(why, why);
  if (typeof cloudEv === 'function') cloudEv(ok ? 'tur_done' : 'tur_fail', {k:m.k, cls:m.cls, nm:m.nm, trim:!!trimOn(S.boat), min:Math.round((S.t - m.t0) / GAME_RATE)});
}
function turPayOut(m, from, no, en){
  if (m.k !== 'best'){ S.cash += m.pay; S.stats.revenue += m.pay; }
  msg(from, no + ' ' + turL('Du får ', 'You get ') + kr(m.pay) + '.', en + ' You get ' + kr(m.pay) + '.');
  turEnd(m, true, turL('Oppdrag fullført: ', 'Mission done: ') + turWhat(m)[S.lang === 'en' ? 1 : 0] + ', ' + kr(m.pay) + '.');
}
// at the quay: freight picked up or delivered
function turDock(pid){
  const T = S.turer; if (!T || !T.act.length) return;
  for (const m of T.act.slice()){ if (m.k !== 'frakt' || m.vid !== S.cur) continue;
    if (m.stage === 'pick' && pid === m.from) turLoad(m);
    else if (m.stage === 'go' && pid === m.to){ S.cargo = (S.cargo || []).filter(c => c.tur !== m.id);
      turPayOut(m, portById(pid).name, 'Takk for at du kom med ' + m.what[0] + '.', 'Thank you for bringing the ' + m.what[1] + '.'); } }
}
// a landing: an order's fill is the orders' own (sell pays its bonus), and the season counts what is landed near its place
function turSale(pid, bySp){
  const T = S.turer; if (!T || !T.act.length) return;
  const q = portById(pid), O = ordState();
  for (const m of T.act.slice()){
    if (m.k === 'best' && !O.active.some(o => o.tur === m.id)){ const d = O.done.find(o => o.tur === m.id);
      if (d && d.ok){ turEnd(m, true, turL('Oppdrag fullført: ', 'Mission done: ') + turWhat(m)[S.lang === 'en' ? 1 : 0] + '.'); } }
    if (m.k === 'sesong' && q && dist(q.p, m.p) <= TUR.sesongR){ m.got = (m.got || 0) + (bySp[m.sp] || 0);
      if (m.got >= m.kg) turPayOut(m, 'Kystposten', 'Sesongen i ' + portById(m.to).name + ' er fisket: ' + fmt(m.got, 0) + ' kg ' + SPECIES[m.sp].no.toLowerCase() + ' levert.', 'The season at ' + portById(m.to).name + ' is fished: ' + fmt(m.got, 0) + ' kg of ' + SPECIES[m.sp].en.toLowerCase() + ' landed.'); }
  }
}
// the found gear is hauled: the fish is aboard, the gear goes back to its owner, who pays the finder's fee
function turHauled(s){
  const T = S.turer, m = T && T.act.find(x => x.id === s.tur); if (!m) return;
  turPayOut(m, m.owner, (m.kind === 'garn' ? 'Takk for at du fant garnlenka mi. Fisken er din.' : 'Takk for at du fant lina mi. Fisken er din.'), (m.kind === 'garn' ? 'Thank you for finding my string of nets. The fish is yours.' : 'Thank you for finding my line. The fish is yours.'));
}
function turHour(){
  const T = S.turer; if (!T) return;
  for (const m of T.act.slice()) if (m.due && S.t > m.due){
    // an order out of time is the orders' own to end and tell (ordersTick); once it has, the mission goes with it
    if (m.k === 'best'){ if (!ordState().active.some(o => o.tur === m.id)) turEnd(m, false, null); continue; }
    if (m.k === 'garn' && (S.sets || []).some(s => s.tur === m.id && s.hauling)) continue;   // the haul under way finishes
    msg(m.k === 'garn' ? m.owner : 'Oppdrag', 'Fristen gikk ut: ' + turWhat(m)[0] + '. Ta et nytt fra tavla når det passer.', 'The deadline passed: ' + turWhat(m)[1] + '. Take a new one from the board when it suits you.');
    turEnd(m, false, null);
  }
}
// the mission in a few words, and the time it takes in real time
function turWhat(m){
  const to = m.to && portById(m.to) ? portById(m.to).name : '';
  if (m.k === 'best') return [fmt(m.kg, 0) + ' kg ' + SPECIES[m.sp].no.toLowerCase() + ' til ' + to, fmt(m.kg, 0) + ' kg of ' + SPECIES[m.sp].en.toLowerCase() + ' to ' + to];
  if (m.k === 'frakt') return [fmt(m.kg, 0) + ' kg ' + m.what[0] + ' til ' + to, fmt(m.kg, 0) + ' kg of ' + m.what[1] + ' to ' + to];
  if (m.k === 'garn') return [(m.kind === 'garn' ? 'Tapt garnlenke' : 'Tapt line') + ' for ' + m.owner, (m.kind === 'garn' ? 'Lost string of nets' : 'Lost line') + ' for ' + m.owner];
  return ['Sesong: ' + fmt(m.kg, 0) + ' kg ' + SPECIES[m.sp].no.toLowerCase() + ' ved ' + to, 'Season: ' + fmt(m.kg, 0) + ' kg of ' + SPECIES[m.sp].en.toLowerCase() + ' at ' + to];
}
const turDur = hGame => { const m = turMinR(hGame); return m < 60 ? m + ' min' : Math.floor(m / 60) + ' t ' + String(m % 60).padStart(2, '0') + ' min'; };
// ---- the trip as it starts: when it will be there, and a word from the crew (or the memory of Father, alone aboard) ----
// Jonas 07.10.2026: many set a long route and put the phone away, so it is said as the trip starts. Mostly it is just talk about the
// trip; now and then, on a long trip with a diesel that can be tuned and is not, someone mentions the engine in the trim app's own
// words. Never to a guest, never in «Første tur», never after the engine was mentioned within 20 real hours, and not every long trip.
const TUR_TALK = [['Lang tur. Jeg setter på kaffe.', 'A long trip. I\'ll put the coffee on.'], ['Fyll termosen, det blir noen timer.', 'Fill the flask, this is a few hours.'],
  ['Vi får se om vi ser hval på veien.', 'Maybe we\'ll see whales on the way.'], ['Godt å komme seg ut. Det er litt av en tur dette.', 'Good to get out. This is quite a trip.']];
const TUR_TUNE = {
  pump:{crew:['Pumpa på henne er satt forsiktig fra fabrikken. De som går langt, får den justert.', 'Her injection pump is set cautiously from the factory. Those who go far have it tuned.'],
    far:['Du husker hva far sa: pumpa var satt for forsiktig fra fabrikken. «Juster pumpa før du går langt.»', 'You remember what Father said: the pump was set too cautiously from the factory. «Tune the pump before you go far.»']},
  ic:{crew:['Kjenn hvor varm lufta er i innsuget. Kald luft er tettere luft. Med ladeluftkjøling drar hun bedre på lange strekk.', 'Feel how warm the air is at the intake. Cold air is denser air. With charge air cooling she pulls better on long runs.'],
    far:['Far snakket om ladeluftkjøling på de lange turene. «Kald luft i innsuget, så drar hun,» sa han.', 'Father talked about charge air cooling on the long trips. «Cold air at the intake, and she pulls,» he said.']},
  turbo:{crew:['Turboen er skrudd ned for å spare motoren. På et langt strekk som dette tåler hun mer trykk.', 'The turbo is turned down to spare the engine. On a long run like this she can take more boost.'],
    far:['Far skrudde opp turbotrykket før de lange turene. «Hun tåler mer enn folk tror,» sa han.', 'Father turned up the boost before the long trips. «She can take more than people think,» he said.']}
};
function turSay(who, no, en, k){
  log(who + ': «' + no + '»', who + ': «' + en + '»');
  if (typeof toast === 'function') toast(who + ': «' + turL(no, en) + '»');
  if (typeof cloudEv === 'function') cloudEv('crew_tip', {k});
}
function turDepart(){
  const b = S.boat, pl = S.plan; if (!pl || !pl.wps || !pl.wps.length || !meAboard()) return;
  let nm = 0, p = b.pos; for (let i = pl.idx || 0; i < pl.wps.length; i++){ nm += dist(p, pl.wps[i]) / NM; p = pl.wps[i]; }
  const T0 = trimOn(b), v = Math.max(2, pl.speed || BOAT.vcruise || 6), hGame = nm / v, min = turMinR(hGame);
  if (min < 20) return;
  log('Beregnet framme kl. ' + hm(S.t / 60 + hGame) + ', om ca. ' + turDur(hGame) + '.', 'Expected there at ' + hm(S.t / 60 + hGame) + ', in about ' + turDur(hGame) + '.');
  if (min < 60 || (typeof tutOn === 'function' && tutOn())) return;
  const T = turState(), on = crewAboard(), V = VESSELS[b.type] || {}, guest = typeof isGuest === 'function' && isGuest();
  const crew = on.length ? on[Math.floor(Math.random() * on.length)].name.split(' ')[0] : null, hard = windAt(S.t / 60) >= 12 || (b.fuel || 0) < (BOAT.fuelCap || 60) * 0.3;
  if (T0){ if (crew && Math.random() < 0.5 && Date.now() - (T.tip.said || 0) > TUR.tipGap){ T.tip.said = Date.now(); turSay(crew, 'Hør hvor fint hun går nå.', 'Listen to how nicely she runs now.', 'praise'); } return; }
  T.tip.n = (T.tip.n || 0) + 1;
  const tune = canBoost(V) && !guest && !hard && T.tip.n >= 2 && Date.now() - (T.tip.t || 0) > TUR.tipGap;
  if (tune){
    const ks = V.semi ? ['pump'] : ['pump', 'ic', 'turbo'], k = ks[(T.tip.k || 0) % ks.length], L0 = TUR_TUNE[k];
    T.tip.t = Date.now(); T.tip.k = (T.tip.k || 0) + 1; T.tip.n = 0;
    if (crew) turSay(crew, L0.crew[0], L0.crew[1], k);
    else { log(L0.far[0], L0.far[1]); if (typeof toast === 'function') toast(turL(L0.far[0], L0.far[1])); if (typeof cloudEv === 'function') cloudEv('crew_tip', {k, far:1}); }
  } else if (crew && Math.random() < 0.5){ const l = TUR_TALK[Math.floor(Math.random() * TUR_TALK.length)]; turSay(crew, l[0], l[1], 'talk'); }
}
// the yard's mechanic after an engine service: the pump is as it came from the factory (at most every three real days)
function turMechanic(){
  const T = turState(), V = VESSELS[S.boat.type] || {};
  if (!canBoost(V) || trimOn(S.boat) || (typeof isGuest === 'function' && isGuest()) || Date.now() - (T.mech || 0) < TUR.mechGap || Math.random() > 0.5) return;
  T.mech = Date.now();
  msg('Verkstedet', 'Servicen er gjort. Pumpa er fortsatt satt slik den kom fra fabrikken. Mange som går langt, får den justert.', 'The service is done. The pump is still set as it came from the factory. Many who go far have it tuned.');
}
