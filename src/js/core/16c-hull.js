// ---- Fysikk 3: what the blows and the groundings do to the hull (Jonas 18.10.2026: «kollisjoner og grunnstøting skal få
// konsekvens, laget bra og intuitivt»; the plan of 18.10.2026, docs/OVERLEVERING.md 5.60) ----
// The measure is the blow: the speed into the face (and with it the energy, half the effective mass times its square, from the
// contact of Fysikk 2, 16b-dyn.js dynContact). Under a knot the fenders take it, always free. From one to three knots the paint is
// scraped (b.dmg.s, scratches you see on the hull in 3D and have polished out at the yard). From three knots the hull is damaged
// (b.dmg.h, 0 to 1), and the repair costs after the damage and the boat's worth; a hard blow opens her (b.dmg.A, the hole in cm²), the
// water comes in by the hole's area and its depth (Torricelli, Q = Cd A sqrt(2 g d), Cd 0.6), and the bilge pump takes it out up to
// its capacity. More water than the pump takes fills her (b.dmg.w, litres, weighing her down: slower, more fuel, lower in the water)
// until the engine room is full: then the engine stops, and the crew calls the rescue boat, which comes with pumps and tows her to
// the nearest yard. She never sinks. The hull's material decides how much a blow does (wood and fibreglass more, aluminium and steel
// less). Running aground tells sand from rock (a skerry, or a steep bottom: 8 m within 60 m is rock; a gentle one is sand and gravel):
// on sand she gets scratches and, fast, a damaged rudder and propeller; on rock the hull is damaged and opened by the speed.
// The repair is the yard's job (30 real minutes, 06-services.js), and the first is free (09f-merker.js freeFirst('rep')). The hull
// insurance (kasko, b.kasko, per vessel) is signed at the yard: a premium every 30 days of 2.5 % a year of the boat's price (a fishermen's
// mutual in Alaska charges 2.5 % of the vessel's value a year, with a fixed deductible; NOAA's study of fishing vessel insurance sets
// the hull premium as a share of the appraised value, by upkeep and the loss record), 25 % more for each claim the last 12 months; it
// pays the repair over the deductible (1.5 % of the price, at least 5 000 kr).
const HULL = {fend:1, scr:3, leak:5, mat:{tre:1.25, glassfiber:1, alu:0.8, 'stål':0.6}, rsPump:1500, quayPump:2000};
const KASKO = {rate:0.025, self:0.015, selfMin:5000, malus:0.25, month:30 * 24 * 60, year:365 * 24 * 60};
const hullMatF = type => HULL.mat[(VESSELS[type] || {}).hullMat] || 1;
function hullD(b = S.boat){ return b.dmg || (b.dmg = {s:0, h:0, A:0, w:0}); }
// a save from before (only the flag, from a grounding): a moderate damage to mend
function hullOld(b = S.boat){ if (b.damage && !(b.dmg && (b.dmg.h > 0.004 || b.dmg.A > 0 || b.dmg.flood))){ const d = hullD(b); d.h = Math.max(d.h || 0, 0.35); } }
// is there anything to mend (structural: the damage flag the rest of the game reads, b.damage)
const hullBad = (b = S.boat) => !!(b.dmg && (b.dmg.h > 0.004 || b.dmg.A > 0 || b.dmg.flood));
function hullSync(b = S.boat){ const d = b.dmg; b.damage = hullBad(b) ? 1 : 0; if (d && !(d.s > 0.004) && !hullBad(b) && !(d.w > 0)) b.dmg = null; }
// the water by the hole (litres a game minute), the bilge pump's capacity, and how much she holds before the engine room is full
function hullLeak(b = S.boat){ const d = b.dmg, V = VESSELS[b.type]; if (!d || !(d.A > 0)) return 0; return 0.6 * d.A * 1e-4 * Math.sqrt(2 * 9.81 * 0.6 * (V.draft || 1)) * 60000; }
const hullPump = (b = S.boat) => { const L = (VESSELS[b.type] || {}).len || 8; return 40 + 2.5 * L * L; };
const hullFlood = (b = S.boat) => { const V = VESSELS[b.type] || {}; return Math.round(0.06 * (V.len || 8) * (V.beam || 3) * (V.draft || 1) * 1000); };
const hullWaterKg = (b = S.boat) => (b.dmg && b.dmg.w || 0) * 1.025;
// a damaged hull is slower (a dent and a torn strake drag), up to 12 %
const hullSpeed = () => 1 - 0.12 * Math.min(1, (S.boat && S.boat.dmg && S.boat.dmg.h) || 0);
// a blow at kn knots into the face: what it did, {ds, dh, dA}
function hullHit(kn, E, what, b = S.boat){
  if (!(kn >= HULL.fend)) return null;
  const V = VESSELS[b.type] || {}, m = hullMatF(b.type), d = hullD(b), r = {ds:0, dh:0, dA:0, kn, what};
  r.ds = Math.min(1 - d.s, 0.1 + 0.08 * Math.min(kn, 6)); d.s += r.ds;
  if (kn >= HULL.scr){ r.dh = Math.min(1 - d.h, m * 0.08 * Math.pow(kn - 2, 1.4)); d.h += r.dh; }
  const thr = HULL.leak / m; if (kn >= thr){ r.dA = 3 * (V.len || 8) / 10 * (kn - thr + 1) ** 2; d.A += r.dA; }
  if (kn >= HULL.scr){ S.incidents = S.incidents || []; S.incidents.push({t:S.t, k:'hit', boat:S.boatName || 'Havbris', kn:+kn.toFixed(1), what, E:Math.round(E || 0)}); if (S.incidents.length > 60) S.incidents.shift(); }
  hullSync(b); return r;
}
// what a blow did, said after the blow itself (dynContact): {no, en}
function hullSay(r){
  if (!r) return null;
  if (r.dA > 0) return {no:' Skroget er slått inn, og det lekker.', en:' The hull is stove in, and she is leaking.'};
  if (r.dh > 0) return {no:' Skroget er skadet.', en:' The hull is damaged.'};
  return {no:' Skrammer i malingen.', en:' Scratches in the paint.'};
}
// the bottom where she ran aground: rock (a skerry, or a steep bottom) or sand and gravel (a gentle one)
function bedRock(p){
  try {
    const r = 0.04; if (rocksIn(p.x - r, p.y - r, p.x + r, p.y + r).some(q => Math.hypot(q[0] - p.x, q[1] - p.y) < r)) return true;
    let dmax = 0; for (let k = 0; k < 8; k++){ const a = k / 8 * 2 * Math.PI, q = {x:p.x + Math.sin(a) * 0.06, y:p.y - Math.cos(a) * 0.06}; if (!isLand(q)) dmax = Math.max(dmax, depthF(q)); }
    return dmax > 8;
  } catch (e){ return true; }
}
// running aground at kn knots: the damage by the bottom, {rock, ds, dh, dA}
function hullGround(p, kn, b = S.boat){
  const V = VESSELS[b.type] || {}, m = hullMatF(b.type), d = hullD(b), rock = bedRock(p), r = {rock, ds:0, dh:0, dA:0, kn};
  r.ds = Math.min(1 - d.s, rock ? 0.3 : 0.15 + 0.02 * kn); d.s += r.ds;
  if (rock){ r.dh = Math.min(1 - d.h, m * 0.1 * Math.pow(Math.max(0, kn - 0.5), 1.3)); const thr = 2 / Math.sqrt(m); if (kn >= thr) r.dA = 2.5 * (V.len || 8) / 10 * (kn - thr + 1) ** 2; }
  else if (kn >= 5) r.dh = Math.min(1 - d.h, 0.05 + 0.02 * (kn - 5));   // the rudder and the propeller in the sand
  d.h += r.dh; d.A += r.dA; hullSync(b); return r;
}
// one game minute of the hull: the water in by the hole, out by the bilge pump (and the rescue boat's pumps when she is fast, the
// yard's or the quay's in port); full to the engine room, the engine stops and the crew calls the rescue boat
function hullMinute(){
  const b = S.boat, d = b.dmg; if (!d || !(d.A > 0 || d.w > 0)) return;
  const Q = hullLeak(b), t = b.tow, P = hullPump(b) + (t && (t.ph === 'hook' || t.ph === 'tow') ? HULL.rsPump : 0) + (b.status === 'port' ? HULL.quayPump : 0);
  const w0 = d.w, lim = hullFlood(b); d.w = Math.max(0, Math.min(lim, d.w + Q - P));
  const vt = S.fleet && S.fleet.length > 1 ? '«' + S.boatName + '»: ' : '';
  if (Q > 0 && !d.told){ d.told = true; if (Q <= P){ log(vt + 'Lensepumpa går. Den holder unna lekkasjen (' + Math.round(Q) + ' liter i minuttet). Få skroget reparert på et verft.', vt + 'The bilge pump is running. It keeps up with the leak (' + Math.round(Q) + ' litres a minute). Have the hull mended at a yard.', 'nav'); if (hooks.onBilge) hooks.onBilge('pump', b); } }
  if (d.w > w0 && Q > P){
    const left = Math.max(0, Math.round((lim - d.w) / (Q - P)));
    if (!d.rise){ d.rise = true; log(vt + 'Vann i båten! Lensepumpa klarer ikke å holde unna (' + Math.round(Q) + ' liter i minuttet inn, ' + Math.round(P) + ' ut). Motorrommet er fullt om rundt ' + left + ' min. Gå til nærmeste verft eller ring etter redningsskøyta.', vt + 'Water in the boat! The bilge pump cannot keep up (' + Math.round(Q) + ' litres a minute in, ' + Math.round(P) + ' out). The engine room is full in about ' + left + ' min. Make for the nearest yard or call the rescue boat.', 'nav'); }
    if (hooks.onBilge && (S.t - (d.alarmT || -1e9)) >= 3) { d.alarmT = S.t; hooks.onBilge('rise', b, left); }
  } else if (d.rise && d.w < w0) d.rise = false;
  if (d.w >= lim && !d.flood){
    d.flood = true; hullSync(b);
    if (['sailing', 'fishing', 'idle', 'engine'].includes(b.status)){ if (S.plan) S.plan = null; log(vt + 'Motorrommet er fullt av vann, og motoren stoppet. Mannskapet ringte etter redningsskøyta.', vt + 'The engine room is full of water, and the engine stopped. The crew called the rescue boat.', 'nav'); if (hooks.onBilge) hooks.onBilge('flood', b); rescue(true); }
  }
}
// what the repair costs at the yard: the scratches polished and painted, the hull mended (with the hole), the engine after a flooding
function hullCost(b = S.boat, d = b.dmg || {}){
  const P = (VESSELS[b.type] || {}).price || 100000, r100 = x => Math.round(x / 100) * 100;
  const scr = d.s > 0.004 ? r100((1000 + P * 0.004) * Math.min(1, d.s)) : 0;
  const str = d.h > 0.004 || d.A > 0 ? r100(3000 + P * 0.08 * Math.min(1, d.h) + (d.A > 0 ? 2000 + P * 0.005 : 0)) : 0;
  const eng = d.flood ? r100(5000 + P * 0.03) : 0;
  return {scr, str, eng, tot:scr + str + eng};
}
// ---- the hull insurance (kasko) ----
const kaskoPrice = (b = S.boat) => (VESSELS[b.type] || {}).price || 100000;
const kaskoClaims = (b = S.boat) => ((b.kasko && b.kasko.claims) || []).filter(t => S.t - t < KASKO.year).length;
const kaskoPrem = (b = S.boat) => Math.round(kaskoPrice(b) * KASKO.rate / 12 * (1 + KASKO.malus * kaskoClaims(b)) / 10) * 10;
const kaskoSelf = (b = S.boat) => Math.max(KASKO.selfMin, Math.round(kaskoPrice(b) * KASKO.self / 1000) * 1000);
function kaskoSign(b = S.boat){
  if (b.kasko) return null; const p = kaskoPrem(b); if (S.cash < p) return ['no_cash'];
  book('forsikring', -p, 'Kasko, første premie', 'Hull insurance, first premium'); b.kasko = {t0:S.t, next:S.t + KASKO.month, claims:[]};
  log('Tegnet kasko for «' + S.boatName + '»: ' + kr(p) + ' i måneden, egenandel ' + kr(kaskoSelf(b)) + '.', 'Took out hull insurance for «' + S.boatName + '»: ' + kr(p) + ' a month, deductible ' + kr(kaskoSelf(b)) + '.');
  return null;
}
function kaskoEnd(b = S.boat){ if (!b.kasko) return; b.kasko = null; log('Sa opp kaskoen for «' + S.boatName + '».', 'Cancelled the hull insurance for «' + S.boatName + '».'); }
// the premium every 30 days, vessel by vessel (06-services.js hourly)
function kaskoHour(){
  const b = S.boat, k = b.kasko; if (!k || S.t < k.next) return;
  const p = kaskoPrem(b); book('forsikring', -p, 'Kaskopremie', 'Hull insurance premium'); k.next += KASKO.month;
  msg('Forsikringsselskapet', 'Kaskopremie for «' + S.boatName + '»: ' + kr(p) + ' trukket.', 'Hull insurance premium for «' + S.boatName + '»: ' + kr(p) + ' paid.');
}
// what is left to mend over what the repair jobs already queued take (a second blow while one is queued)
function hullLeft(b = S.boat){
  const d = b.dmg; if (!d) return null; const c = {s:0, h:0, A:0, flood:false};
  for (const j of S.jobs || []) if (j.kind === 'repair' && j.dmg){ c.s += j.dmg.s; c.h += j.dmg.h; c.A += j.dmg.A; c.flood = c.flood || j.dmg.flood; }
  const L = {s:Math.max(0, d.s - c.s), h:Math.max(0, d.h - c.h), A:Math.max(0, d.A - c.A), flood:!!d.flood && !c.flood};
  return L.s > 0.004 || L.h > 0.004 || L.A > 0 || L.flood ? L : null;
}
// what the yard's repair costs you now: {tot, ins (the insurance pays), you, free, self}
function hullBill(b = S.boat){
  const L = hullLeft(b) || {}, c = hullCost(b, L), self = kaskoSelf(b), free = (L.h > 0.004 || L.A > 0 || L.flood) && !(S.free && S.free.rep);
  const ins = !free && b.kasko && c.tot > self ? c.tot - self : 0;
  return {c, tot:c.tot, ins, you:free ? 0 : c.tot - ins, free, self};
}
// order the repair at the yard she lies at (auto: after a tow): paid at the order, the damage taken off when the job is done
function hullOrder(auto, b = S.boat){
  hullOld(b); const L = hullLeft(b); if (!L || !(hullCost(b, L).tot > 0)) return null;
  const B = hullBill(b); if (!auto && S.cash < B.you) return ['no_cash'];
  const j = {kind:'repair', h:YARD_H, no:'Reparasjon av skroget', en:'Hull repair', dmg:L, paid:B.you, ins:B.ins};
  if (!queueJob(j)) return ['full'];
  if (B.free) freeFirst('rep');
  book('verft', -B.you, 'Reparasjon av skroget', 'Hull repair');
  if (B.ins > 0){ b.kasko.claims = (b.kasko.claims || []).concat([S.t]); }
  const dur = realDur(YARD_H * 60);
  if (B.free) msg('Verkstedet', 'Skroget har fått skader. Den første reparasjonen tar vi gratis, den tar ' + dur + '. Neste gang koster en slik reparasjon ' + kr(B.tot) + '. Kasko på verftet dekker det som går over egenandelen.', 'The hull is damaged. The first repair is on us; it takes ' + dur + '. Next time a repair like this costs ' + kr(B.tot) + '. Hull insurance at the yard covers what goes over the deductible.');
  else if (B.ins > 0) msg('Verkstedet', 'Reparasjonen koster ' + kr(B.tot) + '. Kaskoen betaler ' + kr(B.ins) + ', og du betaler egenandelen, ' + kr(B.you) + '. Den tar ' + dur + '.', 'The repair costs ' + kr(B.tot) + '. The insurance pays ' + kr(B.ins) + ', and you pay the deductible, ' + kr(B.you) + '. It takes ' + dur + '.');
  else msg('Verkstedet', 'Reparasjonen av skroget koster ' + kr(B.you) + ' og tar ' + dur + '.', 'The hull repair costs ' + kr(B.you) + ' and takes ' + dur + '.');
  return null;
}
// the repair done (06-services.js finishJob): what was mended is taken off, the water pumped out on the slip
function hullMended(j, b = S.boat){
  const d = b.dmg, m = j.dmg; if (!d){ b.damage = 0; return; }
  if (m){ d.s = Math.max(0, d.s - m.s); d.h = Math.max(0, d.h - m.h); d.A = Math.max(0, d.A - m.A); if (m.flood) d.flood = false; }
  else { d.s = 0; d.h = 0; d.A = 0; d.flood = false; }
  d.w = 0; d.told = false; d.rise = false; hullSync(b);
}
