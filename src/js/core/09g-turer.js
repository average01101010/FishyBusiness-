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
//   slep    a smaller boat with engine trouble drifting toward land: go to her and lie still, take her in tow and bring her to the
//           harbour nearest her (she is one of the boats the 3D view and the chart draw, turNpcs; on the line she follows astern).
//           Salvage (sjøloven ch. 16, Jonas 07.10.2026): no agreement beforehand, so the pay is a salvage reward set by the value saved,
//           the danger and the time and costs, never above the boat's value (§ 446), and nothing if she drifts ashore first (no cure,
//           no pay). The owner's insurer pays
//   sesong  the season's move: land so many kilos of a species at the plants near a place before the week is out
//   prove   survey fishing for Havforskningsinstituttet, after its coastal reference fleet (Kystreferanseflåten, since 2005: 20-25
//           coastal boats along the whole coast, paid by the institute to log their catches and to take samples; the whole catch is
//           measured for length, hi.no): fish a while at a station and measure ten fish on the board (a small game in the Oppdrag
//           app), or run an echo sounder line through three points at no more than 8 knots. The institute pays for the time; the
//           catch is the player's
//   foto    a picture of a lighthouse for Kystposten (src/data/fyr.json, tools/map/fyr.py), now and then in a light it asks for:
//           low sun, the light lit, the northern lights or heavy weather, offered only when that light comes within the deadline.
//           Within 3 km, the lighthouse in the 3D view's picture and nothing in front of it (G3.seen), the shutter takes it (G3.snap)
//           and the paper prints it (T.press, newsForDay)
// The crew talks about the trip as it starts (turDepart): the time it takes, and now and then the engine (the trim app's words).
const TUR = {
  cls:{kort:{h:[0.4, 3], f:1.1}, mid:{h:[3, 7.5], f:1.3}, lang:{h:[7.5, 18], f:1.6}},   // travel in game hours (6 a real hour) and the pay factor
  seasonF:2, detour:1.25, rate0:9000, move:37, sesongR:30, tipGap:20 * 3600e3, mechGap:72 * 3600e3,
  stasjonR:1, ekkoV:7, ekkoMax:8, fotoR:3, fotoNo3d:1.5
};
const TUR_GOODS = [
  {kg:[20, 60], no:'medisiner til legekontoret', en:'medicine for the surgery'}, {kg:[30, 120], no:'post og pakker', en:'mail and parcels'},
  {kg:[40, 200], no:'reservedeler til et fiskebruk', en:'spare parts for a fish plant'}, {kg:[60, 300], no:'agn til linefiskerne', en:'bait for the line fishers'},
  {kg:[80, 400], no:'tomme fiskekasser', en:'empty fish boxes'}, {kg:[100, 600], no:'tauverk og blåser', en:'rope and buoys'},
  {kg:[150, 1500], no:'proviant til en butikk', en:'provisions for a shop'}, {kg:[300, 3000], no:'nye garn til et fiskarlag', en:'new nets for a fishermen\'s club'}
];
const TUR_BOATS = ['Måsen', 'Terna', 'Lille Viking', 'Havbris', 'Skarven', 'Fiskeørn', 'Polarlys', 'Sølvblank', 'Kvitøy', 'Brisen'];
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
// a boat with engine trouble: lying off the coast within a short or middle trip, smaller than yours, to the harbour nearest her. On the
// tow line she makes at most 5.5 knots (speedCap) and the engine burns half again as much (fuelLph)
const TUR_TOWV = 5.5;
// the value of a used boat of a length (the boat dealer's new prices for the small boats, about 60 % of them for one in use)
const TUR_VAL = [[5.5, 80000], [5.9, 95000], [7.9, 245000], [8.9, 750000], [10.6, 1150000], [12, 1500000]];
function turValue(L){ let i = 1; while (i < TUR_VAL.length - 1 && L > TUR_VAL[i][0]) i++; const [a, b] = [TUR_VAL[i - 1], TUR_VAL[i]], f = clamp((L - a[0]) / (b[0] - a[0]), 0, 1); return Math.round((a[1] + (b[1] - a[1]) * f) * 0.6 / 1000) * 1000; }
// the salvage reward: the time and costs (as the board pays for time) and a share of the value by the danger (0 out in open water,
// 1 within a few hundred metres of land), never more than the value
const turSalvage = (m, danger) => Math.min(m.value, Math.round((turPay(m.h, TUR.cls[m.cls].f) + m.value * (0.03 + 0.12 * clamp(danger, 0, 1))) / 100) * 100);
const turDanger = p => { try { return clamp(1 - (coastDistFar(p) - 0.2) / 2, 0, 1); } catch (e){ return 0.5; } };
function turSlep(o, cls){
  const c = TUR.cls[cls], v = turV(), tv = Math.min(TUR_TOWV, v * 0.75);
  for (let tries = 0; tries < 24; tries++){
    const a = Math.random() * Math.PI * 2, nm = 1.5 + Math.random() * Math.max(0.5, Math.min(c.h[1] * v * 0.5, 14) - 1.5), d = nm * NM / TUR.detour;
    const p = {x:o.x + Math.sin(a) * d, y:o.y - Math.cos(a) * d};
    try { if (isLandFar(p)) continue; const cd = coastDistFar(p); if (cd < 0.5 || cd > 8) continue; } catch (e){ continue; }
    const port = nearestPort(p); if (!port || !port.pier) continue;
    const h = turNm(o, p) / v + turNm(p, port.p) / tv + 0.5; if (h < c.h[0] || h >= c.h[1] || !turCan(o, p, h, false) || !turCan(p, port.p, h, false)) continue;
    const L = Math.round(clamp((BOAT.len || 7) * (0.75 + Math.random() * 0.2), 5.5, 12) * 10) / 10;
    const m = {k:'slep', cls, to:port.id, p, nm:Math.round(turNm(o, p) + turNm(p, port.p)), h, reach:turNm(o, p) / v, boat:TUR_BOATS[Math.floor(Math.random() * TUR_BOATS.length)],
      owner:TUR_OWNERS[Math.floor(Math.random() * TUR_OWNERS.length)], L, B:Math.round(L * 0.34 * 10) / 10, T:Math.round(L * 0.13 * 10) / 10, hd:Math.random() * Math.PI * 2, liv:Math.floor(Math.random() * 4),
      value:turValue(L), hTot:h * 2.5 + 12};
    m.payLo = turSalvage(m, 0); m.payHi = turSalvage(m, 1); m.pay = turSalvage(m, turDanger(p));
    return m;
  }
  return null;
}
const turTowM = () => { const T = S.turer; return T && T.act.find(m => m.k === 'slep' && m.stage === 'tow' && m.vid === S.cur) || null; };
const turTowing = () => !!turTowM();
// the boats in missions for npcStates (05-vessels.js): lying still where she broke down, then on the line astern of the boat towing her
function turNpcs(){
  const T = S.turer; if (!T || !T.act.length) return [];
  const out = [];
  for (const m of T.act){ if (m.k !== 'slep') continue;
    let p = m.p, hd = m.hd || 0, v = 0, st = 'idle';
    if (m.stage === 'tow'){ const bt = m.vid === S.cur ? S.boat : ((S.fleet || []).find(x => x.id === m.vid) || {}).boat;
      if (bt && bt.pos){ hd = bt.heading || 0; const back = 0.035 + (m.L || 8) / 2000 + (BOAT.len || 7) / 2000; p = {x:bt.pos.x - Math.sin(hd) * back, y:bt.pos.y + Math.cos(hd) * back}; v = bt.status === 'sailing' ? bt.v || 0 : 0; st = 'tow'; m.p = p; m.hd = hd; } }
    out.push({id:'t' + m.id, name:m.boat, type:'sjark', p, hd, cog:hd, v:Math.round(v * 10) / 10, st, coast:true, tur:true, L:m.L, B:m.B, T:m.T, liv:m.liv});
  }
  return out;
}
// every minute while a tow is to be made: lying still within 150 m of her, the line goes over, and the way to the harbour is found
function turMinute(){
  const T = S.turer; if (!T || !T.act.length) return;
  const b = S.boat;
  for (const m of T.act.slice()){ if (m.k === 'prove' && m.vid === S.cur) turProveMinute(m, b); if (m.k !== 'slep') continue;
    // she drifts with the wind, about 3 % of it, toward the side it blows to; never so fast that she reaches land before three times
    // the time it takes to get to her (so it is always done without trim), and on land she is lost and there is no salvage
    if (m.stage === 'reach'){ const H = S.t / 60, W = windAt(H), from = windDir(H) + 180 - gridGamma(m.p), a = from * Math.PI / 180;
      if (m.cap == null){ let cd = 1; try { cd = coastDistFar(m.p); } catch (e){} m.cap = 0.8 * cd / Math.max(0.5, 3 * (m.reach || 1)) / 60; }
      const d = Math.min(W * 0.03 * 60 / 1000, m.cap); m.p = {x:m.p.x + Math.sin(a) * d, y:m.p.y - Math.cos(a) * d};
      let ashore = false; try { ashore = isLandFar(m.p) || coastDistFar(m.p) < 0.03; } catch (e){}
      if (ashore){ msg(m.owner, '«' + m.boat + '» drev på land før hjelpen kom fram. Redningsselskapet tar henne av.', 'The «' + m.boat + '» drifted ashore before help came. The rescue service takes her off.');
        turEnd(m, false, turL('«' + m.boat + '» drev på land. Ingen bergelønn.', 'The «' + m.boat + '» drifted ashore. No salvage reward.')); continue; } }
    if (m.vid !== S.cur) continue;
    if (m.stage === 'reach' && ['idle', 'fishing'].includes(b.status) && (b.v || 0) < 1.5 && dist(b.pos, m.p) < 0.15){
      m.stage = 'tow'; m.danger = turDanger(m.p); b.status = 'idle'; b.v = 0; S.plan = null;
      log('Slepet er festet til «' + m.boat + '». Vi tar henne inn til ' + portById(m.to).name + '.', 'The tow line is fast to the «' + m.boat + '». We take her in to ' + portById(m.to).name + '.');
      if (typeof toast === 'function') toast(turL('Slepet er festet. Går mot ' + portById(m.to).name + '.', 'The tow is fast. Heading for ' + portById(m.to).name + '.'));
      if (typeof turGo === 'function') setTimeout(() => turGo(m.id), 0);
    }
    // the boat itself in tow (the rescue service, 05-vessels.js rescue): the line is let go and the other boat waits for help
    if (m.stage === 'tow' && b.status === 'tow'){ msg(m.owner, 'Vi får vente på Redningsselskapet. Takk for forsøket.', 'We will wait for the rescue service. Thank you for trying.'); turEnd(m, false, null); }
  }
}
// the survey's minute: fishing at the station counts its time (and what came up from then); the echo line counts its points, passed in
// order at no more than 8 knots (she slows to 7 as she comes to the line)
function turProveMinute(m, b){
  if (m.kind === 'stasjon' && m.stage === 'fish' && b.status === 'fishing' && dist(b.pos, m.p) < TUR.stasjonR){
    const now = turHoldSp(); if (!m.h0) m.h0 = now; m.min = (m.min || 0) + 1;
    if (m.min < m.need) return;
    m.got = {}; for (const sp in now){ const d = now[sp] - (m.h0[sp] || 0); if (d > 0.5) m.got[sp] = Math.round(d); }
    if (!Object.keys(m.got).length){ m.bonusMax = 0; turPayOut(m, 'Havforskningsinstituttet', 'Stasjonen ga ingen fisk denne gangen. En tom stasjon er også en prøve.', 'The station gave no fish this time. An empty station is a sample too.'); return; }
    m.stage = 'measure';
    msg('Havforskningsinstituttet', 'Fint. Mål ti fisk på målebrettet og send oss lengdene. Målebrettet ligger på oppdraget i Oppdrag-appen.', 'Good. Measure ten fish on the board and send us the lengths. The board is on the mission in the Oppdrag app.');
    if (typeof toast === 'function') toast(turL('Stasjonen er fisket. Mål ti fisk i Oppdrag-appen.', 'The station is fished. Measure ten fish in the Oppdrag app.'));
  }
  if (m.kind === 'ekko' && m.stage === 'line'){ const q = m.pts[m.at]; if (!q) return; const d = dist(b.pos, q);
    if (d < 1 && S.plan && (S.plan.speed || 0) > TUR.ekkoV && b.status === 'sailing'){ S.plan.speed = TUR.ekkoV; log('Slakker av til ' + TUR.ekkoV + ' knop for ekkoloddlinja.', 'Slowing to ' + TUR.ekkoV + ' knots for the echo line.'); }
    if (d >= 0.2) return;
    if ((b.v || 0) > TUR.ekkoMax + 0.5){ if (m.fast !== m.at){ m.fast = m.at; if (typeof toast === 'function') toast(turL('For fort for et godt ekkoloddbilde. Hold høyst 8 knop.', 'Too fast for a good echo picture. Keep to 8 knots at most.')); } return; }
    m.at++;
    if (m.at < m.pts.length){ log('Punkt ' + m.at + ' av 3 på ekkoloddlinja.', 'Point ' + m.at + ' of 3 on the echo line.'); return; }
    const saw = turEkkoSaw(m);
    turPayOut(m, 'Havforskningsinstituttet', 'Ekkoloddlinja er kommet inn. ' + saw[0], 'The echo line has come in. ' + saw[1]);
  }
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
// ---- survey fishing for Havforskningsinstituttet ----
// the lengths the board sees (cm, total length) of each species, a catch's usual span
const TUR_LEN = {torsk:[45, 95], hyse:[38, 62], sei:[45, 85], lange:[60, 120], brosme:[40, 70], kveite:[70, 140], steinbit:[45, 85], uer:[28, 45], breiflabb:[50, 100], lysing:[40, 80], makrell:[30, 40], sild:[25, 35], blakveite:[50, 90], rognkjeks:[30, 45], flyndre:[25, 40]};
const turGearOk = () => !!(S.boat.gear || (S.equip && S.equip.jukse > 0));
const turHoldSp = () => (S.hold || []).reduce((a, x) => (a[x.sp] = (a[x.sp] || 0) + x.kg, a), {});
function turProve(o, cls){
  const c = TUR.cls[cls], v = turV(), ekko = !turGearOk() || Math.random() < 0.4;
  for (let tries = 0; tries < 40; tries++){
    const a = Math.random() * Math.PI * 2, nm = 1 + Math.random() * Math.max(0.5, Math.min(c.h[1] * v * 0.6, 40) - 1), d = nm * NM / TUR.detour;
    const p = {x:o.x + Math.sin(a) * d, y:o.y - Math.cos(a) * d};
    try { if (isLandFar(p)) continue; const cd = coastDistFar(p); if (cd < 0.6 || cd > 15) continue; } catch (e){ continue; }
    if (ekko){
      // three points on, each 0.8-1.6 km from the last, in open water all the way
      const pts = [p]; let ok = true, ang = Math.random() * Math.PI * 2;
      for (let k = 1; k < 3 && ok; k++){ ang += (Math.random() - 0.5) * 1.2; const L = 0.8 + Math.random() * 0.8, q0 = pts[k - 1], q = {x:q0.x + Math.sin(ang) * L, y:q0.y - Math.cos(ang) * L};
        try { ok = !isLandFar(q) && !isLandFar({x:(q.x + q0.x) / 2, y:(q.y + q0.y) / 2}) && coastDistFar(q) >= 0.4; } catch (e){ ok = false; } pts.push(q); }
      if (!ok) continue;
      const len = (dist(pts[0], pts[1]) + dist(pts[1], pts[2])) / NM, h = turNm(o, p) / v + len / Math.min(v, TUR.ekkoV);
      // out, along the line and home again on her tank (it ends at sea, as the lost gear does)
      if (h < c.h[0] || h >= c.h[1] || 2 * (turNm(o, p) + len) > 0.75 * turRange() || !turCan(o, p, h, true)) continue;
      return {k:'prove', kind:'ekko', cls, p, pts, at:0, nm:Math.round(turNm(o, p) + len), h, pay:turPay(h, c.f), hTot:h * 2.5 + 12};
    }
    // a station: fish there an hour (two on a middle trip), where fishing with the jig is allowed
    const need = cls === 'kort' ? 60 : 120, h = turNm(o, p) / v + need / 60;
    if (h < c.h[0] || h >= c.h[1] || !turCan(o, p, h, true)) continue;
    try { if (typeof ruBlockMsg === 'function' && ruBlockMsg({p, len:BOAT.len, gear:'juksa', sp:null, hand:!(S.equip && S.equip.jukse > 0)})) continue; } catch (e){}
    const pay = turPay(h, c.f);
    return {k:'prove', kind:'stasjon', cls, p, need, min:0, nm:Math.round(turNm(o, p)), h, pay, bonusMax:Math.round(pay * 0.2 / 100) * 100, hTot:h * 2.5 + 12};
  }
  return null;
}
// the ten fish on the board: of the species caught at the station, by weight, at lengths of their span (the same each time it is opened)
function turProveFish(m){
  if (m.fish) return m.fish;
  const got = Object.entries(m.got || {}).filter(([sp]) => SPECIES[sp]), tot = got.reduce((a, x) => a + x[1], 0) || 1, out = [];
  for (let i = 0; i < 10; i++){
    let r = h2(m.id * 31 + i, 517) * tot, sp = got.length ? got[0][0] : 'torsk'; for (const [k, kg] of got){ if (r < kg){ sp = k; break; } r -= kg; }
    const R = TUR_LEN[sp] || [30, 70], cm = Math.round((R[0] + (R[1] - R[0]) * Math.pow(h2(m.id * 31 + i, 733), 0.8)) * 10) / 10;
    out.push({sp, cm, c0:Math.floor(cm - 24 * (0.3 + 0.45 * h2(m.id * 31 + i, 911)))});
  }
  m.meas = m.meas || []; return m.fish = out;
}
// the measurements sent: the institute pays the time, and up to a fifth more the closer the board was read (within half a centimetre all)
function turProveDone(m){
  if (!m.fish || (m.meas || []).length < m.fish.length) return;
  const err = m.fish.reduce((a, f, i) => a + Math.abs(m.meas[i] - f.cm), 0) / m.fish.length, bonus = Math.round((m.bonusMax || 0) * clamp(1 - (err - 0.5) / 2.5, 0, 1) / 100) * 100;
  m.err = Math.round(err * 10) / 10; m.pay += bonus;
  turPayOut(m, 'Havforskningsinstituttet', 'Takk for prøvene fra stasjonen ved ' + coordStr(m.p) + '. Ti fisk målt, i snitt ' + fmt(err, 1) + ' cm fra riktig lengde.', 'Thank you for the samples from the station at ' + coordStr(m.p) + '. Ten fish measured, on average ' + fmt(err, 1) + ' cm from the right length.');
}
// what the echo sounder saw along the line: where the fish stood thickest, by the fish model's own density (12-heat.js heatSample)
function turEkkoSaw(m){
  try { let best = null; const H = S.t / 60, nm = ['torsk', 'hyse', 'sei'];
    for (let k = 0; k < 2; k++) for (let i = 0; i <= 6; i++){ const f = i / 6, a = m.pts[k], b = m.pts[k + 1], v = heatSample({x:a.x + (b.x - a.x) * f, y:a.y + (b.y - a.y) * f}, H);
      for (let j = 0; j < 3; j++) if (!best || v[j] > best.v) best = {v:v[j], sp:nm[j], leg:k}; }
    if (!best || best.v < 0.5) return ['Linja viste lite fisk i dag, og det er også et svar.', 'The line showed little fish today, and that is an answer too.'];
    return ['Ekkoloddet viste mest ' + SPECIES[best.sp].no.toLowerCase() + ' mellom punkt ' + (best.leg + 1) + ' og ' + (best.leg + 2) + '.', 'The echo sounder showed most ' + SPECIES[best.sp].en.toLowerCase() + ' between points ' + (best.leg + 1) + ' and ' + (best.leg + 2) + '.'];
  } catch (e){ return ['', '']; }
}
// ---- a picture of a lighthouse for Kystposten ----
const FYR = /*@include(data/fyr.json)*/null;
const TUR_LYS = {
  sol:{no:'i lav sol', en:'in low sun', ok:(H, p) => { const e = sunAt(H, p).el; return e > -1 && e < 6; }},
  natt:{no:'mens fyret lyser', en:'with the light lit', ok:(H, p) => sunAt(H, p).el < -4},
  nordlys:{no:'under nordlyset', en:'under the northern lights', ok:(H, p) => auroraAt(H, p) >= 0.3},
  uvaer:{no:'i uvær', en:'in heavy weather', ok:H => windAt(H) >= 10.8}
};
const turFyrName = m => /fyr/i.test(m.fyr.name) ? m.fyr.name : m.fyr.name + ' fyr';
// the next time the light it asks for comes, within the deadline (game hours), or null
function turLysNext(m, from){ if (!m.lys) return from; const end = (m.due || S.t + m.hTot * 60) / 60; for (let t = from; t <= end; t += 0.25) if (TUR_LYS[m.lys].ok(t, m.fyr)) return t; return null; }
function turFoto(o, cls){
  if (!FYR || !FYR.length) return null;
  const c = TUR.cls[cls], v = turV(), H = S.t / 60, open = (VESSELS[S.boat.type] || {}).cls === 'open', warn = (BOAT.risk || [1.5])[0];
  const cand = FYR.map(f => ({f, h:turNm(o, {x:f[0], y:f[1]}) / v + 0.3})).filter(x => x.h >= c.h[0] && x.h < c.h[1]);
  for (let n = 0; n < 12 && cand.length; n++){
    const {f, h} = cand.splice(Math.floor(Math.random() * cand.length), 1)[0], L = {x:f[0], y:f[1]};
    // where to take it from: open water half a kilometre to a kilometre and a bit off the light
    let ap = null;
    for (let k = 0; k < 12 && !ap; k++){ const a = k * Math.PI / 6 + Math.random() * 0.4, r = 0.5 + Math.random() * 0.7, q = {x:L.x + Math.sin(a) * r, y:L.y - Math.cos(a) * r};
      try { if (!isLandFar(q) && coastDistFar(q) >= 0.15) ap = q; } catch (e){} }
    if (!ap || !turCan(o, ap, h, true)) continue;   // out and home again
    // a light it asks for only when it comes (an hour of it at least) between arriving and the deadline; heavy weather not for an open
    // boat, nor more sea than she is rated for
    const hTot = h * 2.5 + 12, can = k => { if (k === 'uvaer' && open) return false; let n2 = 0;
      for (let t = H + h; t <= H + hTot - 0.5; t += 0.5) if (TUR_LYS[k].ok(t, L) && (k !== 'uvaer' || hsAtFc(ap, t, H) <= warn)) n2++; return n2 >= 2; };
    const want = Math.random() < 0.55 ? ['nordlys', 'sol', 'natt', 'uvaer'].filter(can) : [], lys = want.length ? want[Math.floor(Math.random() * want.length)] : null;
    return {k:'foto', cls, p:ap, fyr:{x:L.x, y:L.y, h:f[2], name:f[3]}, lys, nm:Math.round(turNm(o, ap)), h, pay:Math.round(turPay(h, c.f) * (lys ? 1.25 : 1) / 100) * 100, hTot};
  }
  return null;
}
// the lighthouse mission the boat is near enough to take its picture
function turFotoAt(){ const T = S.turer; return T && T.act.find(m => m.k === 'foto' && m.vid === S.cur && dist(S.boat.pos, m.fyr) <= TUR.fotoR) || null; }
// the picture: seen is the 3D view's word on it (G3.seen: in front and nothing in the way), null without the 3D view (then 1.5 km is
// near enough); img the picture itself (kept on this device only, for the paper). A reason it is not taken, or null when it is
function turFotoTake(m, seen, img){
  const H = S.t / 60, d = dist(S.boat.pos, m.fyr);
  if (d > TUR.fotoR) return turL('Gå nærmere fyret, innen 3 km.', 'Go closer to the lighthouse, within 3 km.');
  if (seen){ if (!seen.front) return turL('Fyret er ikke i bildet. Snu kameraet mot det.', 'The lighthouse is not in the picture. Turn the camera toward it.');
    if (!seen.clear) return turL('Noe står i veien for fyret. Finn et sted der du ser det.', 'Something stands in front of the lighthouse. Find a place where you see it.'); }
  else if (d > TUR.fotoNo3d) return turL('Gå nærmere fyret, innen 1,5 km.', 'Go closer to the lighthouse, within 1.5 km.');
  if (m.lys && !TUR_LYS[m.lys].ok(H, m.fyr)){ const t = turLysNext(m, H);
    return turL('Kystposten vil ha bildet ' + TUR_LYS[m.lys].no + '.' + (t != null ? ' Det kommer ca. kl. ' + hm(t) + (Math.floor(t / 24) !== Math.floor(H / 24) ? ' ' + dayStr(t) : '') + '.' : ''), 'The paper wants the picture ' + TUR_LYS[m.lys].en + '.' + (t != null ? ' It comes at about ' + hm(t) + (Math.floor(t / 24) !== Math.floor(H / 24) ? ' ' + dayStr(t) : '') + '.' : '')); }
  const name = turFyrName(m), how = m.lys ? [' ' + TUR_LYS[m.lys].no, ' ' + TUR_LYS[m.lys].en] : ['', ''];
  if (img && typeof turFotoKeep === 'function') turFotoKeep(m.id, img);
  // in the paper (09h-press.js): the others read of it, the picture is only in one's own
  const fi = FYR.findIndex(f => f[3] === m.fyr.name && Math.abs(f[0] - m.fyr.x) < 0.01 && Math.abs(f[1] - m.fyr.y) < 0.01);
  pressPut('foto', m.lys ? {fyr:fi, lys:m.lys} : {fyr:fi}, img ? {img:m.id} : null);
  turPayOut(m, 'Kystposten', 'Takk for bildet av ' + name + how[0] + '. Det står i avisa i dag.', 'Thank you for the picture of ' + name + how[1] + '. It is in the paper today.');
  return null;
}
function turMake(){
  const T = turState(), o = turHere(), used = new Set(T.act.map(m => m.to).filter(Boolean)), B = [], me = turMe();
  const add = m => { if (m){ m.id = ++T.seq; m.until = S.t + 1440; B.push(m); if (m.to) used.add(m.to); } };
  // the first of a weighted draw that the boat can do (a weight's key Math.random() ** (1 / w): the heavier, the likelier first)
  const has = k => T.act.some(m => m.k === k) || B.some(m => m.k === k);
  const draw = list => { for (const [, f] of list.filter(x => x[0] > 0).map(x => [Math.pow(Math.random(), 1 / x[0]), x[1]]).sort((a, b) => b[0] - a[0])){ const m = f(); if (m) return m; } return null; };
  const prove = cls => () => has('prove') ? null : turProve(o, cls), foto = cls => () => has('foto') ? null : turFoto(o, cls);
  try {
    const garn = !T.act.some(m => m.k === 'garn');
    add(draw([[1, () => turBest(o, 'kort', used)], [1, () => turFrakt(o, 'kort', used)], [0.6, prove('kort')], [0.5, foto('kort')]]));
    // help at sea: lost gear or a boat with engine trouble, one of each at most
    const slep = !T.act.some(m => m.k === 'slep'), help = () => (Math.random() < 0.5 ? (garn && turGarn(o)) || (slep && turSlep(o, 'kort')) : (slep && turSlep(o, 'kort')) || (garn && turGarn(o))) || null;
    add(help() || turFrakt(o, 'kort', used) || turBest(o, 'kort', used));
    if (B.filter(m => m.cls === 'kort').length < 2) add(draw([[1, () => turFrakt(o, 'kort', used)], [0.6, prove('kort')], [0.6, foto('kort')], [0.5, () => slep && !has('slep') ? turSlep(o, 'kort') : null]]));
    add(draw([[1, () => turBest(o, 'mid', used)], [1, () => turFrakt(o, 'mid', used)], [0.4, () => slep && !has('slep') ? turSlep(o, 'mid') : null], [0.6, prove('mid')], [0.6, foto('mid')]]));
    // the newcomer, until the first trip is done: one more short instead of the long; the season's move from the second day
    if (me.y < 1) add(turFrakt(o, 'kort', used) || turBest(o, 'kort', used));
    else add(draw([[1, () => turBest(o, 'lang', used)], [1, () => turFrakt(o, 'lang', used)], [0.8, foto('lang')]]));
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
  if (m.k === 'prove'){ m.stage = m.kind === 'ekko' ? 'line' : 'fish';
    msg('Havforskningsinstituttet', m.kind === 'ekko' ? 'Takk! Kjør linja gjennom de tre punktene i rekkefølge, høyst 8 knop, så ekkoloddet får et godt bilde.' : 'Takk! Fisk ved stasjonen ' + coordStr(m.p) + ' i ' + turMinR(m.need / 60) + ' minutter, og mål ti fisk etterpå.',
      m.kind === 'ekko' ? 'Thank you! Run the line through the three points in order, at 8 knots at most, so the echo sounder gets a good picture.' : 'Thank you! Fish at the station ' + coordStr(m.p) + ' for ' + turMinR(m.need / 60) + ' minutes, and measure ten fish after.'); }
  if (m.k === 'foto') msg('Kystposten', 'Fint at du tar den. Vi vil ha et bilde av ' + turFyrName(m) + (m.lys ? ' ' + TUR_LYS[m.lys].no : '') + '. Snu kameraet mot fyret og trykk på utløseren når du er innen 3 km.', 'Good that you take it. We want a picture of ' + turFyrName(m) + (m.lys ? ' ' + TUR_LYS[m.lys].en : '') + '. Turn the camera to the lighthouse and press the shutter when you are within 3 km.');
  if (m.k === 'slep'){ m.stage = 'reach'; msg(m.owner, 'Takk for at du kommer! «' + m.boat + '» har motorstopp og ligger og driver ved ' + coordStr(m.p) + '.', 'Thank you for coming! The «' + m.boat + '» has engine trouble and is drifting at ' + coordStr(m.p) + '.'); }
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
  for (const m of T.act.slice()) if (m.k === 'slep' && m.vid === S.cur && m.stage === 'tow' && pid === m.to){
    m.pay = turSalvage(m, m.danger || 0);
    pressPut('salv', {towed:TUR_BOATS.indexOf(m.boat), port:pid, pay:m.pay, val:m.value});   // Kystposten (09h-press.js)
    msg(m.owner, '«' + m.boat + '» ligger trygt ved kai i ' + portById(pid).name + '. Tusen takk for hjelpen.', 'The «' + m.boat + '» lies safe at the quay in ' + portById(pid).name + '. Thank you so much for the help.');
    turPayOut(m, 'Forsikringsselskapet', 'Bergelønn for «' + m.boat + '» etter sjøloven, avtalt med eierens forsikring: båtens verdi ' + kr(m.value) + ', faren og tiden du brukte.', 'Salvage reward for the «' + m.boat + '» under the Maritime Code, agreed with the owner\'s insurer: the boat\'s value ' + kr(m.value) + ', the danger and the time you spent.'); }
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
    if (m.k === 'slep' && m.stage === 'tow') continue;   // and the tow under way
    if (m.k === 'prove' && m.stage === 'measure') continue;   // the fish are caught; the board waits
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
  if (m.k === 'slep') return ['Slep «' + m.boat + '» til ' + to, 'Tow the «' + m.boat + '» to ' + to];
  if (m.k === 'prove') return m.kind === 'ekko' ? ['Ekkoloddlinje for Havforskningsinstituttet', 'Echo line for the Institute of Marine Research'] : ['Prøvefiske for Havforskningsinstituttet', 'Survey fishing for the Institute of Marine Research'];
  if (m.k === 'foto') return ['Bilde av ' + turFyrName(m) + ' for Kystposten', 'A picture of ' + turFyrName(m) + ' for Kystposten'];
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
  const T0 = trimOn(b), v = Math.max(2, Math.min(pl.speed || BOAT.vcruise || 6, turTowing() ? TUR_TOWV : 99)), hGame = nm / v, min = turMinR(hGame);
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
