// ===== Driftsplan 2: the day is the plan (26.10.2026, docs/planer/driftsplan-2/02-design.md). Part 1: the model, the day and the check.
// A plan (S.ops v4, a vessel's own field) is the player's answers: home, rig, the places in the order they are worked (fields with units
// and soak, jig places), the weather limits, the departure hour, the rhythm and the landing rule. The DAY is reckoned from the answers and
// the gear in the sea by ONE function, planDay: the steps with their hours (out, set, jig, haul, land, home, baiting, rest, watches). The
// page shows that day, and the engine (part 2) follows it; there is no other sketch. Nothing here searches or waits: the legs are kept in
// o.legs when the plan is made (part 2), and a leg not known is reckoned straight with a fifth on.
// DRIFT2 is the switch: off, today's plan (06d-drift.js) runs as before and no save is touched; on (part 7), plan2Ops switches older plans
// off with a word (Jonas 26.10.2026, choice 5 C) and the new engine runs.
let DRIFT2 = true;   // on since 27.10.2026 (part 7): the old plan's code (06d-drift.js, ui/05c-drift.js) stays until part 8 and runs with the switch off (the old tests set it)
const DRV2 = 4;
const DRP2 = {
  dayMax:14, minDay:2, tired:72, rested:25, late:8, fatH:5, enH:100 / 24, enMin:15,     // the day's length: 14 h, the crew at 72 with 5 an hour, you at 15 % with 4.2 an hour
  dayFrom:6, watch:12,                                                                 // the skipper's day watch 06–18, the mate's night (Jonas 26.10.2026)
  work:{sett:{line:5 / 60, garn:1 / 60, teine:1 / 60}, trekk:{line:20 / 60, garn:4.3 / 60, teine:1 / 60}},   // hours a unit, the engine's own pace (measured 26.10.2026)
  landH:1, stockH:10 / 60, legF:1.25, full:0.8, freshLand:65, jigMin:0.5, placesMax:12, fcH:5, cutH:3,                     // the forecast she goes out on: the next 5 hours; a haul due within 3 hours is still done when the day is cut
  rest:{quay:8, night:12},                                                             // the crew's fatigue an hour of rest without bunks (04-crew.js crewTick); with bunks or a rorbu RORBU.rate (p2RestRate)
  egn:{selfH:1 / 3, coop:[0, 1, 2, 2.5, 3, 3.5, 4], shedH:3, shedPer:1 / 3},           // baiting: a third of an hour a tub by one hand, the shed 3 h plus 20 min a tub
  soak:{line:[4, 6, 20, 30], garn:[8, 12, 36, 60], teine:[18, 24, 60, 96]}, soakDef:{line:8, garn:24, teine:48},
  // the ocean vessel (H2c of docs/planer/havsteget-h2-autoline.md, 05.11.2026): the autoline's soak (3-8 h in the plan, a warning outside
  // 3 and 12), the hold she turns for the plant at, the trip's longest by default (6-7 weeks, HI report 2024-11), the day's horizon at sea,
  // and the weather she works the gear in (the presets; over BOAT's own lying-to limits, 05-vessels.js windLim/seaLim, she lies to)
  hav:{soak:[3, 3, 8, 12], soakDef:6, full:0.95, days:42, look:24, endD:1,
    wx:{safe:{wind:15, hs:4}, normal:{wind:18, hs:5}, tough:{wind:21, hs:6}}}};
// an hour said from another: «i kveld kl. 21:00», «i natt kl. 01:45», «i morgen kl. 05:51», «om 3 døgn, kl. 07:00» (by the date, not by 24 hours)
function p2When(H, H0){
  const c = driftClock(driftHod(H)), h = driftHod(H), dd = Math.round((H - h - (H0 - driftHod(H0))) / 24);
  if (dd <= 0) return h >= 17 ? ['i kveld kl. ' + c, 'tonight at ' + c] : ['i dag kl. ' + c, 'today at ' + c];
  if (dd === 1) return h < 5 ? ['i natt kl. ' + c, 'in the night at ' + c] : ['i morgen kl. ' + c, 'tomorrow at ' + c];
  return ['om ' + dd + ' døgn, kl. ' + c, 'in ' + dd + ' days, at ' + c];
}
const p2RestRate = where => where === 'anker' ? RORBU.rate * 60 * 0.85 : where === 'bunks' ? RORBU.rate * 60 : DRP2.rest.quay;   // (RORBU is defined later in the build, so it is read when used)
// your own rest where the plan lies (U11, Jonas 05.11.2026: a day may run late «så lenge mannskapet og brukeren får den søvnen de trenger»):
// energy an hour for you at port pid (the engine takes you in by itself, plan2MeRest), or in the bunk at anchor; 0 where there is no
// rest for you (a quay without bunks, an open boat at anchor, no money for the rorbu's night)
function p2MeRate(pid, anchor){
  const V = VESSELS[S.boat.type] || {}, bk = (V.berths || 0) > 0;
  if (anchor) return bk ? ENERGY.quay * 60 * 0.85 : 0;
  if (!pid) return 0;
  if (isRorbu(pid)) return spendable() >= RORBU.kr || (S.rest && S.rest.port === pid) ? RORBU.rate * 60 : 0;
  if (pid === (S.home || HOME0)) return ENERGY.quay * 60 * (1 + (naustHas('tak') ? 0.25 : 0) + (naustHas('ovn') ? 0.25 : 0));
  return bk ? ENERGY.quay * 60 : 0;
}
// the hours you must rest after a day that leaves you at energy e, at rate (an hour), to have a full day's energy again (DRP2.dayMax
// hours with DRP2.enMin left); 0 when there is no rest to be had (the departure waits and says so, plan2Go)
const p2MeNeed = () => Math.min(100, DRP2.enMin + DRP2.enH * DRP2.dayMax);
function p2MeRestH(e, rate){ const need = p2MeNeed(), e0 = Math.max(0, e); return e0 >= need - 0.5 || !(rate > 0) ? 0 : (need - e0) / rate; }
const PLAN2_KIND = {line:'line', garn:'garn', teiner:'teine'};
const p2Kind = o => PLAN2_KIND[o.rig] || null;
// the units the boat owns of a kind (aboard, in the sea, ashore for baiting), for the line per kind (hyse or bank), and what is left for one
// field when the other fields of the same kind have theirs (the page and the chart clamp to it: a plan never asks for more than she owns)
function p2Units(kind, lk){
  if (kind === 'teine' && typeof snoVessel === 'function' && snoVessel()) return Math.floor(ownedUnits('teine') / SNOC.lenke);   // (H3c: the snow crab vessel's fields count strings of 200)
  if (kind !== 'line' || !lk) return ownedUnits(kind);
  const pg = S.pgear || newPGear(), sea = mySets().filter(x => x.kind === 'line' && (x.lk || 'hyse') === lk).reduce((a, x) => a + x.n, 0);
  const shore = (pg.shore || []).reduce((a, j) => a + ((j.kind === 'egn' || j.kind === 'egnself' || j.kind === 'stripself') && (j.lk || 'hyse') === lk ? j.n : 0), 0);
  return (pg.lines[lk] ? pg.lines[lk].n : 0) + sea + shore;
}
function p2Left(o, q){ const kind = p2Kind(o); if (!kind || !q || q.k !== 'felt') return 0; const own = p2Units(kind, kind === 'line' ? q.lk || 'hyse' : null); return own - o.places.filter(f => f !== q && f.k === 'felt' && (kind !== 'line' || (f.lk || 'hyse') === (q.lk || 'hyse'))).reduce((a, f) => a + f.n, 0); }
// the line's kind a new field gets: the one with the most tubs not yet on a field
function p2LineKind(o){ if (p2Auto(o)) return 'auto'; const k =['hyse', 'bank'].map(lk => [lk, p2Units('line', lk) - o.places.filter(f => f.k === 'felt' && (f.lk || 'hyse') === lk).reduce((a, f) => a + f.n, 0)]).sort((a, b) => b[1] - a[1]); return k[0][1] > 0 ? k[0][0] : (p2Units('line', 'hyse') >= p2Units('line', 'bank') ? 'hyse' : 'bank'); }
// the jig's gear, chosen under Beholdning (10b-gearcare.js jigKind): the plan fishes with it, and says so
const p2JigGear = () => (typeof jigKind === 'function' ? jigKind() : 'mark') === 'kveite' ? ['kveitepilk', 'halibut pilk'] : ['markkroker', 'mark hooks'];
const p2Jig = o => (!p2Kind(o) || !!o.jig) && (typeof vesselJigs !== 'function' || !S.boat || vesselJigs());   // (an ocean vessel does not jig)
// the ocean vessel in the plan (H2c): the autoline (the line on magazines, 10-gear.js autoL) and the teams that come with her (04-crew.js
// lagOf), the soak the page steps in and warns at, and the hours of a lenke's set and haul at the machine's pace (LINE_KINDS.auto)
const p2Auto = o => p2Kind(o) === 'line' && typeof autoL === 'function' && !!(BOAT && BOAT.autoHooks) && !!autoL();
const p2Lag = () => typeof lagOf === 'function' && !!lagOf();
const p2Soak = o => p2Sno(o) ? DRP2.sno.soak : p2Auto(o) ? DRP2.hav.soak : DRP2.soak[p2Kind(o)];   // (the snow crab's in days, H3c, 06i-plan2-sno.js)
const p2SoakDef = o => p2Sno(o) ? DRP2.sno.soakDef : p2Auto(o) ? DRP2.hav.soakDef : DRP2.soakDef[p2Kind(o)];
// the plants the plan can land at: a fish plant, and for an ocean vessel one whose quay and plant take her (06b-coastports.js portWhy)
const p2PlantOk = pt => !!pt && !!(pt.mottak || (pt.havOnly && BOAT.cls === 'hav')) && !(BOAT.cls === 'hav' && portWhy(pt, S.boat.type));
const p2Plants = () => PORTS.filter(p2PlantOk);
const p2AutoH = () => { const A = LINE_KINDS.auto; return {set:A.hooks * A.setH, haul:A.hooks * A.haulH, bait:A.baitKg}; };
let P2_SID = 0;
const plan2Sid = () => 'p' + Date.now().toString(36).slice(-4) + (P2_SID++).toString(36);
function plan2New(over){
  const b = S.boat, here = b.status === 'port' ? b.port : null, hav = p2Lag(), sno = typeof snoVessel === 'function' && snoVessel();   // (H3c: frozen trips of about 20 days)
  // (an ocean vessel with her teams works round the clock in their watches, does not jig, works the gear to the ocean presets, and a
  // trip lasts until the hold, the bait, the fuel or the provisions are spent, or DRP2.hav.days at the most when the player chooses it)
  return Object.assign({v:DRV2, on:false, home:here, anchor:false, rig:RIGS[b.rig] ? b.rig : 'juksa', jig:!hav, places:[],
    wx:hav ? Object.assign({}, DRP2.hav.wx.normal) : {wind:13, hs:2.5}, dep:5, rhythm:hav ? 'watch' : 'day', days:3, land:{mode:'near', port:null, when:sno ? 'days' : 'full', days:sno ? DRP2.sno.days : hav ? DRP2.hav.days : 2},
    legs:{}, M:null, homeA:null, restA:null, made:null, err:null, t0:null, run:null, held:null, stop:null, hold:0,
    stats:{days:[], sum:{trips:0, kg:0, kr:0, lott:0, cost:0, conf:0, sp:{}, port:{}}}}, over || {});
}
// the plan the new engine runs: with the switch off, none (today's plan is left alone); on, a v4, and an older plan is switched off with a word
function plan2Ops(){
  if (!DRIFT2) return null;
  const o = S.ops; if (!o) return null;
  if (o.v === DRV2){ if (o.rig === 'line' && o.places.some(q => q.k === 'felt' && !q.lk)){ for (const q of o.places) if (q.k === 'felt' && !q.lk){ q.lk = p2LineKind(o); q.n = Math.max(1, Math.min(q.n, p2Left(o, q))); } }   // (fields from before 27.10.2026: the line's kind and the tubs the boat owns)
    // (an ocean vessel, H2c: her teams' watches round the clock, no jig, and the fields of her autoline in lenker)
    if (p2Lag()){ if (o.rhythm !== 'watch') o.rhythm = 'watch'; if (o.jig && !p2Jig(o)) o.jig = false; if (o.land && o.land.when === 'trip') o.land.when = 'full';
      if (p2Auto(o)) for (const q of o.places) if (q.k === 'felt' && q.lk !== 'auto'){ q.lk = 'auto'; q.n = Math.max(1, Math.min(q.n, p2Left(o, q))); q.soak = clamp(q.soak, DRP2.hav.soak[0], DRP2.hav.soak[3]); }
      if (p2Sno(o)) for (const q of o.places) if (q.k === 'felt' && (q.soak < DRP2.sno.soak[0] || q.soak > DRP2.sno.soak[3])){ q.soak = clamp(Math.round(q.soak / 24) * 24, DRP2.sno.soak[0], DRP2.sno.soak[3]); q.n = Math.max(1, Math.min(q.n, p2Left(o, q))); } }   // (H3c: a field from before is strings of 200 and days)
    return o; }
  S.ops = null;
  msg(gL('Driftsplan', 'Operations plan'), 'Driftsplanen er laget på nytt. Den gamle planen for «' + S.boatName + '» er slått av. Lag en ny under Driftsplan. Redskapet i sjøen står der det står.', 'The operations plan has been made anew. The old plan for «' + S.boatName + '» is switched off. Make a new one under Operations plan. The gear in the sea stays where it is.');
  return null;
}
// ---- the places: a point, a port, or a key ('H' home, 'Q' the home quay, 'M' the plant, 'A' the rest anchorage)
function plan2P(o, k){
  if (k === 'H') return o.homeA || (portById(o.home) || {}).p || null;
  if (k === 'Q') return (portById(o.home) || {}).p || null;
  if (k === 'M') return (portById(o.M) || {}).p || null;
  if (k === 'A') return o.restA || null;
  const q = o.places.find(x => x.id === k); return q ? {x:q.x, y:q.y} : null;
}
const plan2Port = (o, k) => k === 'H' ? (o.homeA ? null : o.home) : k === 'Q' ? o.home : k === 'M' ? o.M : null;
// the hours of a leg: the kept leg (o.legs, 06d-drift.js drLK) at cruising speed, else straight with a fifth on
function plan2LegH(o, a, ap, b, bp, v){
  if (!a || !b) return 0; v = Math.max(1, v || BOAT.vcruise || 7);
  if (drCK(a, ap) === drCK(b, bp) || dist(a, b) < 0.005) return 0;
  const L = o.legs && o.legs[drLK(a, ap, b, bp)];
  if (L && !L.none && L.d != null) return L.d / gridScale({x:(a.x + b.x) / 2, y:(a.y + b.y) / 2}) / (v * NM);   // (the way's grid km as true ones, H1b)
  return kmTrue(a, b) * DRP2.legF / (v * NM);
}
// ---- the state the day is reckoned from: where she lies, the hold, the gear in the sea and aboard, the crew, you. Tests pass their own
function plan2State(o){
  const b = S.boat, pg = S.pgear || newPGear(), hold = holdLoad();   // (as it fills the room: product weight for frozen fish, H2b)
  const at = b.status === 'port' || b.status === 'unmooring' ? {p:{x:portById(b.port).p.x, y:portById(b.port).p.y}, port:b.port}
    : o.homeA && dist(b.pos, o.homeA) < 0.4 ? {p:o.homeA, port:null} : o.restA && dist(b.pos, o.restA) < 0.4 ? {p:o.restA, port:null} : {p:{x:b.pos.x, y:b.pos.y}, port:null};
  const V = VESSELS[b.type] || {};
  return {H:S.t / 60, at, hold, cap:capHold(), fresh:S.hold.length ? Math.min(...S.hold.map(x => x.fresh)) : 100,
    sets:mySets().map(s => ({fid:s.fid || null, kind:s.kind, n:s.n, tSet:s.tSet, x:setMid(s).x, y:setMid(s).y, a:{x:s.a.x, y:s.a.y}, b:{x:s.b.x, y:s.b.y}})),
    aboard:{line:{n:(pg.lines.hyse.n || 0) + (pg.lines.bank.n || 0), baited:(pg.lines.hyse.baited || 0) + (pg.lines.bank.baited || 0), kinds:{hyse:{n:pg.lines.hyse.n || 0, baited:pg.lines.hyse.baited || 0}, bank:{n:pg.lines.bank.n || 0, baited:pg.lines.bank.baited || 0}}}, garn:pg.nets.reduce((a, l) => a + l.n, 0), teine:potsAboard(pg), bait:Object.values(baitOf(pg)).reduce((a, v) => a + v, 0)},
    crew:crewAboard(null, true).map(c => ({name:c.name, fat:c.fatigue || 0, sk:!!c.sk, mate:!!c.mate, rate:6 * (1.4 - 0.16 * ((c.attr && c.attr.uth) || 2.5)) * ((BOAT.fx && BOAT.fx.fat) || 1) * (V.fac && V.fac.house === 'open' ? 1.1 : 1)})),   // fatigue an hour of fishing (04-crew.js crewTick)
    me:{aboard:meAboard(), energy:S.energy == null ? 100 : S.energy, homeRate:p2MeRate(o.home, !!o.homeA), anchRate:p2MeRate(null, true)}, bunks:V.berths || 0, house:!!V.watch, crewMax:V.crewMax || 0, v:BOAT.vcruise || 7,
    homeRest:plan2RestOk(o.home), homeShed:!!(portById(o.home) || {}).mottak, dayIndex:o.t0 == null ? 0 : Math.floor((S.t - o.t0) / 1440),
    lost:(S.gearLog || []).filter(e => e.lost && !e.tHaul && e.vid === S.cur).map(e => ({x:e.x, y:e.y, kind:e.kind, n:e.n, t:e.lost})),
    // the ocean vessel (H2c): her teams (a number, not S.crew), the autoline on the magazines and the bait in the freezer, and at sea what
    // the trip has left (04-crew.js tripLeft: days of fuel after the way to a plant, of provisions, of room) and its days so far
    lag:p2Lag() ? lagN() : 0, auto:p2Auto(o) ? {n:autoL(pg).n, bait:baitKg(pg)} : null,
    left:BOAT.cls === 'hav' && b.status !== 'port' && typeof tripLeft === 'function' ? tripLeft(b) : null, tripD:(b.trip && b.trip.seaM || 0) / 1440};   // (read only: tripOf makes a trip where none is, and the page reckons this too)
}
// the state with the snow crab trip's own (H3c, 06i-plan2-sno.js p2SnoState): the pots, the bait, the tanks, the quota and the season
function plan2StateOf(o){ const st = plan2State(o); if (p2Sno(o)) st.sno = p2SnoState(o, st); return st; }
function plan2RestOk(pid){ const p = portById(pid); if (!p) return false; return isRorbu(pid) || pid === (S.home || HOME0) || (VESSELS[S.boat.type].berths || 0) > 0; }
// the units ready to set, of the plan's kind
function plan2Ready(kind, st, lk){ return kind === 'line' ? (lk && st.aboard.line.kinds && st.aboard.line.kinds[lk] ? st.aboard.line.kinds[lk].baited : st.aboard.line.baited) : kind === 'garn' ? st.aboard.garn : kind === 'teine' ? Math.min(st.aboard.teine, Math.floor(st.aboard.bait / GPRICE.potBait + 1e-9)) : 0; }
// the game hour Skippertak lasts to (15-energy.js), 0 when it is not on: the hours before it the crew and you are rested and work on
const p2SkipH = () => skipOn() ? S.skip.until / 60 : 0;
// the next departure: today's hour if it has not passed by more than DRP2.late, else tomorrow's; never before `from`
function plan2NextDep(o, H, from){
  // Skippertak (Jonas 06.11.2026, «Døgnet rundt»): while it lasts the next trip goes as soon as the day is done, not at the hour
  { const t = Math.max(H, from == null ? H : from); if (p2SkipH() > t) return t; }
  const ds = H - driftHod(H); let dep = ds + o.dep;
  if (H > dep + DRP2.late) dep += 24;
  // not before `from` (the rest, the baiting): late the same day when it is within DRP2.late of the hour, else the next day's hour
  if (from != null && dep < from){ if (from <= dep + DRP2.late) dep = from; else { while (dep < from) dep += 24; } }
  return dep;
}
// the watch at an hour: 'A' the skipper's (06–18), 'B' the mate's (18–06), and when it changes
function plan2Watch(H){ const h = driftHod(H), a = h >= DRP2.dayFrom && h < DRP2.dayFrom + DRP2.watch; const next = a ? H - h + DRP2.dayFrom + DRP2.watch : (h < DRP2.dayFrom ? H - h + DRP2.dayFrom : H - h + 24 + DRP2.dayFrom); return {w:a ? 'A' : 'B', until:next}; }
function plan2Roles(st){
  const sk = st.me.aboard ? null : st.crew.find(c => c.sk) || null, mate = st.crew.find(c => c.mate && c !== sk) || st.crew.find(c => c !== sk) || null;
  const deck = st.crew.filter(c => c !== sk && c !== mate), A = (st.me.aboard ? ['deg'] : sk ? [sk.name] : []).concat(deck.filter((c, i) => i % 2 === 0).map(c => c.name)), B = (mate ? [mate.name] : []).concat(deck.filter((c, i) => i % 2 === 1).map(c => c.name));
  return {A, B};
}

// ---- the ocean vessel's day (H2c of docs/planer/havsteget-h2-autoline.md, 05.11.2026): the autoline in a loop on the fields, round the
// clock in the teams' watches. Each field's lenker are set, stand their soak, are hauled through the hauling port and set again at once
// (the machine baits them as they go out, with bait from the freezer), over the hours ahead (DRP2.hav.look). The trip ends when the hold,
// the bait, the fuel or the provisions are spent, after the days the player chose, or when the gear is fetched (p2AutoEnd): then the last
// hauls are final, nothing is set, and she goes to the plant. A day that ends at sea is laid again from where she lies (06h-plan2-engine.js
// plan2Boundary); at the plant with fish aboard, the day is the landing and the bait for the next trip, and the next day goes out from there.
// Steps as planDay's, and lagvakt {} (the teams' watches, said once) and lever {port, h} with the landing's hours (pallets, 07-harbours.js PALL).
// The reason the trip ends, or null: [no, en]
function p2AutoEnd(o, st){
  const A = p2AutoH(), F = o.places.filter(q => q.k === 'felt'), round = F.reduce((a, q) => a + q.n, 0) * A.bait, L = st.left, E = DRP2.hav.endD;
  if (o.fetch) return ['redskapet hentes', 'the gear is fetched'];
  if (st.hold >= DRP2.hav.full * st.cap) return ['lasten er ' + Math.round(100 * st.hold / st.cap) + ' % full', 'the hold is ' + Math.round(100 * st.hold / st.cap) + ' % full'];
  if (st.auto && round > 0 && st.auto.bait < round - 1e-6 && st.at.port == null) return ['agnet i frysen rekker ikke en runde til (' + fmt(st.auto.bait, 0) + ' kg)', 'the bait in the freezer is short of another round (' + fmt(st.auto.bait, 0) + ' kg)'];
  if (L && L.fuel < E) return ['drivstoffet rekker ' + (L.fuel < 0.5 ? 'under et halvt døgn' : 'om lag ' + fmt(L.fuel, 1) + ' døgn') + ' til før det trengs for å gå inn', 'the fuel lasts ' + (L.fuel < 0.5 ? 'under half a day' : 'about ' + fmt(L.fuel, 1) + ' days') + ' more before it is needed to go in'];
  if (L && L.prov != null && L.prov < (L.home ? L.home.days : 0) + E) return ['provianten rekker ' + fmt(L.prov, 1) + ' døgn til', 'the provisions last ' + fmt(L.prov, 1) + ' days more'];
  if ((o.land || {}).when === 'days' && st.tripD >= (o.land.days || DRP2.hav.days)) return ['turen har vart ' + Math.floor(st.tripD) + ' døgn', 'the trip has lasted ' + Math.floor(st.tripD) + ' days'];
  return null;
}
function planDayAuto(o, H0, st){
  const A = p2AutoH(), v = st.v, steps = [], skipped = [], F = o.places.filter(q => q.k === 'felt'), M = plan2P(o, 'M'), hp = PALL.kg / 1000 * PALL.lift / 60;
  let t = H0, at = st.at.p, atPort = st.at.port, n0 = st.auto ? st.auto.n : 0, bait = st.auto ? st.auto.bait : 0;
  const go = (q, port) => { t += plan2LegH(o, at, atPort, q, port, v); at = q; atPort = port || null; };
  const watches = () => { if (st.lag) steps.push({t, k:'lagvakt', me:!!st.me.aboard}); };
  // (the bait for a trip: the rounds a day the lenker allow, set and hauled one after the other (about 1.2 with eight), for the trip's days)
  const nF = F.reduce((a, q) => a + q.n, 0), round = nF * A.bait, perDay = round * Math.max(1, 24 / Math.max(1, nF * (A.haul + A.set)));
  const tripBait = () => Math.ceil(perDay * Math.max(7, ((o.land || {}).when === 'days' ? o.land.days : DRP2.hav.days)));
  // at the plant with fish aboard: the landing, the bait for the next trip, and the day ends at the quay (the next goes out empty)
  if (atPort && atPort === o.M && st.hold > 0.5 && !(o.landFail && S.t - o.landFail < 360)){   // (a landing the plant refused is not tried again for 6 hours)
    const h = Math.max(DRP2.landH, st.hold / 1000 * hp); steps.push({t, k:'lever', port:o.M, h}); t += h;
    if (!o.fetch && bait < tripBait()){ steps.push({t, k:'agn', port:o.M, kg:Math.ceil(tripBait() - bait)}); t += DRP2.stockH; }
    if (o.fetch && o.home !== o.M){ go(plan2P(o, 'H'), plan2Port(o, 'H')); steps.push({t, k:'hjem', port:o.home, anchor:!!o.homeA}); }
    else steps.push({t, k:'ut'});
    return {t0:H0, steps, end:t, home:null, why:['leverer og gjør klar til neste tur', 'lands and makes ready for the next trip'], skipped, dayMax:24, auto:true};
  }
  const end = p2AutoEnd(o, st);
  // in port: the trip's bait, bought at the plant (by the tonne, 10b-gearcare.js) before she goes; from another port only when there is
  // not a round aboard (the way by the plant is then worth it)
  if (!end && atPort && M && (atPort === o.M ? bait < tripBait() * 0.9 : bait < round - 1e-6)){ if (atPort !== o.M){ steps.push({t, k:'avgang', from:atPort}); go(M, o.M); } steps.push({t, k:'agn', port:o.M, kg:Math.ceil(tripBait() - bait)}); t += DRP2.stockH; bait = Math.max(bait, tripBait()); }
  else if (!(end && atPort)) steps.push({t, k:'avgang', from:atPort});
  watches();
  // in port and the trip is over before it began (the gear fetched, nothing in the sea, the hold empty): home
  if (end && atPort && !st.sets.length){ if (atPort !== o.home && o.home){ go(plan2P(o, 'H'), plan2Port(o, 'H')); steps.push({t, k:'hjem', port:o.home, anchor:!!o.homeA}); }
    return {t0:H0, steps, end:t, home:null, why:end, skipped, dayMax:24, auto:true}; }
  const readyN = () => Math.min(n0, Math.floor(bait / A.bait + 1e-9)), cyc = [], until = H0 + DRP2.hav.look;
  // pass 1: the fields in the player's order: what stands is hauled when due (pass 2); an empty field gets its lenker, if any are ready
  for (const q of F){
    const s = st.sets.find(x => x.fid === q.id);
    if (s){ cyc.push({q, due:s.tSet / 60 + q.soak, n:s.n, set:s.tSet / 60}); continue; }
    if (end) continue;
    const n = Math.min(q.n, readyN());
    if (n < 1){ skipped.push({id:q.id, no:bait < A.bait ? 'ikke agn i frysen' : 'ingen lenker igjen på magasinene', en:bait < A.bait ? 'no bait in the freezer' : 'no lenker left on the magazines'}); continue; }
    go(q); steps.push({t, k:'sett', pid:q.id, n, kind:'line', lk:'auto', h:n * A.set}); t += n * A.set; n0 -= n; bait -= n * A.bait; cyc.push({q, due:t + q.soak, n, set:t});
  }
  // pass 2: the hauls in the order they fall due, never before the soak is up, over the hours ahead; each set again at once from the
  // hauling port while the trip goes on and there is bait for it (finishHaul with reset), else hauled home to the magazines
  for (let k = 0; k < 40 && cyc.length; k++){
    cyc.sort((a, c) => a.due - c.due); const p = cyc[0]; if (p.due > until && !end) break;
    go(p.q); const tArr = t; t = Math.max(t, p.due);
    if (t - tArr > 1 / 60) steps.push({t:tArr, k:'vent', pid:p.q.id, until:t});
    const reset = !end && bait >= p.n * A.bait - 1e-6;
    steps.push({t, k:'trekk', pid:p.q.id, n:p.n, kind:'line', lk:'auto', h:p.n * A.haul, soakH:t - p.set, reset, wait:0, due:p.due});
    t += p.n * A.haul;
    if (reset){ steps.push({t, k:'sett', pid:p.q.id, n:p.n, kind:'line', lk:'auto', h:p.n * A.set, again:true}); t += p.n * A.set; bait -= p.n * A.bait; p.set = t; p.due = t + p.q.soak; }
    else { cyc.shift(); n0 += p.n; }
  }
  for (const p of cyc) if (p.due > until){ const w = p2When(p.due, H0); skipped.push({id:p.q.id, no:'står til ståtida er ute ' + w[0], en:'stays until the soak is up ' + w[1]}); }
  // the trip is over: to the plant to land (the next day there is the landing, above)
  if (end && M){ go(M, o.M); steps.push({t, k:'lever', port:o.M, h:Math.max(DRP2.landH, st.hold / 1000 * hp)}); }
  return {t0:H0, steps, end:t, home:null, why:end ? ['turen er over: ' + end[0], 'the trip is over: ' + end[1]] : ['døgndrift med lagene; turen går til lasten, agnet, drivstoffet eller provianten sier stopp', 'round the clock with the teams; the trip goes on until the hold, the bait, the fuel or the provisions say stop'], skipped, dayMax:24, auto:true};
}
// ---- the day. H0: the hour the day begins (the departure). Returns {t0, steps:[{t, k, …}], end, why:[no, en], skipped:[{id, no, en}]}.
// Steps: avgang {from}, sett {pid, n, kind, h}, trekk {pid, n, kind, h, reset, soakH}, juks {pid, h, until}, vent {pid, until},
// lever {port, h} or behold {kg}, agn {port, kg}, hjem {port, anchor}, egning {where, n, ready}, hvile {until, where}, vakt {w, who, until}, ut {}
function planDay(o, H0, st){
  st = st || plan2StateOf(o);
  if (p2Sno(o)){ const s2 = Object.assign({}, st, {H:H0}); if (!s2.sno || Math.abs(st.H - H0) > 1) s2.sno = p2SnoState(o, s2); return planDaySno(o, H0, s2); }   // (the snow crab vessel's strings, H3c)
  if (p2Auto(o)) return planDayAuto(o, H0, st);   // (the ocean vessel's autoline, H2c)
  // o.fetch (the page's «Hent redskapet», choice 2 A): a day of hauls only, whatever the soak, nothing set again, no jig; the engine switches the plan off when nothing stands in the sea
  const fetch = !!o.fetch, kind = p2Kind(o), jig = p2Jig(o) && !fetch, v = st.v, W = DRP2.work, steps = [], skipped = [], nm = id => (portById(id) || {name:'?'}).name;
  const fat0 = st.crew.length ? Math.max(...st.crew.map(c => c.fat)) : 0, watch = o.rhythm === 'watch';
  // the day's length: 14 h, or shorter so nobody passes 72 and you keep 15 % (dagdrift; the watches take care of it round the clock)
  let dayMax = DRP2.dayMax, why = ['dagen er ' + DRP2.dayMax + ' t', 'the day is ' + DRP2.dayMax + ' h'];
  if (!watch){
    // (each hand tires at their own rate, by their stamina: the one who reaches 72 first sets the day)
    // (Skippertak: nobody tires before it runs out, so the hours it covers come first, sk; Jonas 06.11.2026, «Døgnet rundt»)
    const sk = Math.max(0, p2SkipH() - H0), cF = st.crew.map(c => ({c, h:sk + (DRP2.tired - c.fat) / Math.max(1, c.rate || DRP2.fatH)})).sort((a, b) => a.h - b.h)[0], bF = cF ? cF.h : Infinity, bE = st.me.aboard ? sk + (st.me.energy - DRP2.enMin) / DRP2.enH : Infinity;
    // (already past the limit: said as it is, never as negative hours; the engine rests first, plan2Spent, GUI review F7)
    if (bF < dayMax){ dayMax = bF; const c = cF.c, n = c.name.split(' ')[0]; why = bF > 0.05 ? [n + ' blir sliten (' + DRP2.tired + ') etter ' + fmt(bF, 1) + ' t', n + ' is tired (' + DRP2.tired + ') after ' + fmt(bF, 1) + ' h'] : [n + ' er sliten nå (' + Math.round(c.fat) + ') og må hvile først', n + ' is tired now (' + Math.round(c.fat) + ') and must rest first']; }
    if (bE < dayMax){ dayMax = bE; why = bE > 0.05 ? ['energien din holder ' + fmt(bE, 1) + ' t', 'your energy lasts ' + fmt(bE, 1) + ' h'] : ['energien din er nesten brukt opp (' + Math.round(st.me.energy) + ' %): du må hvile først', 'your energy is nearly spent (' + Math.round(st.me.energy) + ' %): you must rest first']; }
    dayMax = Math.max(DRP2.minDay, dayMax);
  }
  if (fetch) why = ['henter redskapet, så er planen av', 'fetches the gear, then the plan is off'];
  const endBy = H0 + dayMax, legH = (a, ap, b, bp) => plan2LegH(o, a, ap, b, bp, v);
  let t = H0, at = st.at.p, atPort = st.at.port, ready = kind ? plan2Ready(kind, st) : 0, setToday = 0, hauledLine = 0;
  steps.push({t, k:'avgang', from:atPort});
  if (watch){ const w = plan2Watch(t), R = plan2Roles(st); steps.push({t, k:'vakt', w:w.w, who:w.w === 'A' ? R.A : R.B, until:w.until}); }
  const go = (q, port) => { const h = legH(at, atPort, q, port); t += h; at = q; atPort = port || null; return h; };
  // bait for the pots (two rounds, for those aboard and in the sea); short for a re-set today, she goes to the plant first
  const potsSea = kind === 'teine' ? st.sets.filter(x => x.kind === 'teine').reduce((a, x) => a + x.n, 0) : 0, baitRound = kind === 'teine' ? (st.aboard.teine + potsSea) * GPRICE.potBait : 0;
  const dueSoon = kind === 'teine' ? st.sets.filter(x => x.kind === 'teine' && (() => { const q = o.places.find(y => y.id === x.fid); return q && x.tSet / 60 + q.soak <= H0 + dayMax; })()).reduce((a, x) => a + x.n, 0) : 0;
  if (kind === 'teine' && dueSoon > 0 && st.aboard.bait < dueSoon * GPRICE.potBait - 1e-6 && plan2P(o, 'M') && !watch){ go(plan2P(o, 'M'), o.M); steps.push({t, k:'agn', port:o.M, kg:Math.ceil(baitRound * 2 - st.aboard.bait)}); t += DRP2.stockH; st = Object.assign({}, st, {aboard:Object.assign({}, st.aboard, {bait:baitRound * 2})}); }
  // pass 1: the places in the player's order (Jonas 27.10.2026: the order is the player's). A field: haul what is due by arrival (and
  // set again), set what is empty if gear of its kind is ready, remember what is not yet due. The jig places before the first field get
  // the day's free hours first (jig most of the day, set the line before going home); those after the fields get the hours until the
  // first haul is due and the rest of the day, as before. A line field names its kind (lk, hyse or bank): its tubs, not the other's
  const pending = [], jigs = [], preJigs = []; { let seen = false; for (const q of o.places){ if (q.k === 'juks'){ if (!seen && kind) preJigs.push(q); } else seen = true; } }
  const setTodayK = {}, readyOf = q => kind === 'line' ? plan2Ready(kind, st, q.lk) - (setTodayK[q.lk || 'hyse'] || 0) : ready - setToday;
  const jigAt = (list, until) => { const hours = until - (t + legH(at, atPort, list[0], null)); if (hours < DRP2.jigMin) return false;
    const R = list.map(j => Math.max(1, planJigRate(j))), Rs = R.reduce((a, r) => a + r, 0);
    list.forEach((j, i) => { const share = hours * (0.5 / list.length + 0.5 * R[i] / Rs); go(j); const h = Math.max(DRP2.jigMin / 2, Math.min(share, until - t)); steps.push({t, k:'juks', pid:j.id, h, until:t + h}); t += h; });
    return true; };
  // the jig places before the fields: the day less the fields' work (legs, sets, hauls), the landing and the way home, estimated in list order
  if (jig && preJigs.length){ const fixed = (() => { let h = 0, a = at, ap = atPort; for (const q of o.places){ if (q.k !== 'felt') continue; const s = st.sets.find(x => x.fid === q.id); h += legH(a, ap, q, null) + Math.max(1, q.n) * (s ? W.trekk[kind] + (kind !== 'line' ? W.sett[kind] : 0) : W.sett[kind]); a = q; ap = null; }
      const M = plan2P(o, 'M'); if (M && (o.land || {}).when === 'trip'){ h += legH(a, ap, M, o.M) + DRP2.landH; a = M; ap = o.M; } return h + (watch ? 0 : legH(a, ap, plan2P(o, 'H'), plan2Port(o, 'H'))); })();
    if (!jigAt(preJigs, t + Math.max(0, endBy - t - fixed))) for (const j of preJigs) skipped.push({id:j.id, no:'ingen tid til juksa før redskapet i dag', en:'no time for the jig before the gear today'}); }
  for (const q of o.places){
    if (q.k === 'juks'){ if (!preJigs.includes(q)) jigs.push(q); continue; }
    if (!kind){ skipped.push({id:q.id, no:'båten fisker bare med juksa', en:'the boat fishes with the jig only'}); continue; }
    const s = st.sets.find(x => x.fid === q.id);
    if (s){
      const due = s.tSet / 60 + q.soak, hArr = legH(at, atPort, q, null);
      if (fetch || due <= t + hArr){ go(q); const soakH = t - s.tSet / 60; steps.push({t, k:'trekk', pid:q.id, n:s.n, kind, h:s.n * W.trekk[kind], soakH, reset:false, due:fetch ? t : due}); t += s.n * W.trekk[kind]; if (kind === 'line') hauledLine += s.n;
        pending.push({q, due:null, hauled:true}); }
      else pending.push({q, due, s});
    } else if (fetch) skipped.push({id:q.id, no:'ingenting står her', en:'nothing stands here'});
    else {
      const n = Math.min(q.n, readyOf(q));
      if (n >= 1){ go(q); steps.push({t, k:'sett', pid:q.id, n, kind, lk:q.lk || null, h:n * W.sett[kind]}); t += n * W.sett[kind]; setToday += n; if (kind === 'line') setTodayK[q.lk || 'hyse'] = (setTodayK[q.lk || 'hyse'] || 0) + n; pending.push({q, due:t + q.soak, setToday:true, n}); }
      else { const lost = (st.lost || []).find(e => e.kind === kind && dist(e, q) < 0.5); skipped.push(lost ? {id:q.id, no:'redskapet gikk tapt i været (' + lost.n + ' ' + unitName(kind, lost.n) + '). Meld det til Kystvakten under Beholdning', en:'the gear was lost in the weather (' + lost.n + ' ' + unitName(kind, lost.n) + '). Report it to the Coast Guard under Inventory'} : {id:q.id, no:kind === 'line' ? 'lina er ikke egnet' : kind === 'teine' ? (st.aboard.teine < 1 ? 'ingen teiner om bord' : 'ikke nok agn til teinene') : 'ingen garn om bord', en:kind === 'line' ? 'the line is not baited' : kind === 'teine' ? (st.aboard.teine < 1 ? 'no pots aboard' : 'not enough bait for the pots') : 'no nets aboard'}); }
    }
  }
  // what the day must still hold after the fishing: the hauls due today, the landing (decided now, from the rule and the hold) and the way home
  const dueToday = pending.filter(p => p.due != null && p.due <= endBy).sort((a, b) => a.due - b.due);
  const mustFresh = st.hold > 0.5 && keepF(keepDay(st.fresh) + 1) < DRP2.freshLand, L = o.land || {when:'full'};
  const willFish = (jig && (jigs.length || preJigs.length || dueToday.length)) || dueToday.length > 0;
  const land = watch ? false : fetch ? (st.sets.length > 0 || st.hold > 0.5) : L.when === 'trip' ? (willFish || st.hold > 0.5) : L.when === 'days' ? ((st.dayIndex % Math.max(1, L.days || 2)) === 0 && (willFish || st.hold > 0.5)) || st.hold >= DRP2.full * st.cap || mustFresh : st.hold >= DRP2.full * st.cap || mustFresh;
  const lineUn = kind === 'line' ? st.aboard.line.n - st.aboard.line.baited + dueToday.reduce((a, p) => a + (p.s ? p.s.n : 0), 0) : 0;
  const needBait = (kind === 'teine' && (st.aboard.teine + potsSea) >= 1 && st.aboard.bait < baitRound - 1e-6) || (kind === 'line' && lineUn >= 1 && st.aboard.bait < lineUn * LINE_KINDS.hyse.baitKg - 1e-6), toM = (land || needBait) && !!plan2P(o, 'M');
  const tailH = () => { let h = 0, a = at, ap = atPort; for (const p of dueToday){ if (p.done) continue; h += legH(a, ap, p.q, null) + p.q.n * (W.trekk[kind] + W.sett[kind]); a = p.q; ap = null; }
    if (toM){ h += legH(a, ap, plan2P(o, 'M'), o.M) + (land ? DRP2.landH : 0) + (needBait ? DRP2.stockH : 0); a = plan2P(o, 'M'); ap = o.M; }
    return h + (watch ? 0 : legH(a, ap, plan2P(o, 'H'), plan2Port(o, 'H'))); };
  // the jig: until the first haul is due, or the day's end less what remains; the hours shared by the player's own numbers (06d-drift.js planJigRate)
  // (the hours until the first haul is due are free whatever the day's length: the haul cannot come sooner, so the jig has them)
  const jigTo = dueToday.length ? dueToday[0].due : watch ? H0 + 24 : endBy - tailH();
  if (jig && jigs.length) jigAt(jigs, jigTo);
  else if (jig && dueToday.length && jigTo - t >= DRP2.jigMin){ steps.push({t, k:'juks', pid:null, h:jigTo - t, until:jigTo}); t = jigTo; }
  else if (!jig && dueToday.length && dueToday[0].due > t){ go(dueToday[0].q); steps.push({t, k:'vent', pid:dueToday[0].q.id, until:dueToday[0].due}); t = Math.max(t, dueToday[0].due); }
  // pass 2: the hauls in the order they fall due, never before the soak is up; nets and pots are set again, the line only when baited
  // tubs are left and the soak fits before the day ends
  for (const p of dueToday){
    go(p.q); const tArr = t; t = Math.max(t, p.due);
    const n = p.s ? p.s.n : p.setToday ? p.n : Math.min(p.q.n, kind === 'line' ? readyOf(p.q) : ready); const soakH = p.s ? t - p.s.tSet / 60 : p.q.soak, wait = t - tArr;   // (a string set today is hauled whole: its units, not the tubs left aboard)
    let reset = kind !== 'line'; if (kind === 'line'){ const left = readyOf(p.q); reset = left >= 1 && t + n * W.trekk.line + p.q.soak + n * W.trekk.line + DRP2.landH + 2 <= endBy; }
    steps.push({t, k:'trekk', pid:p.q.id, n, kind, h:n * W.trekk[kind], soakH, reset, wait, due:p.due}); t += n * W.trekk[kind]; if (kind === 'line') hauledLine += n;
    if (reset){ steps.push({t, k:'sett', pid:p.q.id, n, kind, lk:p.q.lk || null, h:n * W.sett[kind]}); t += n * W.sett[kind]; if (kind === 'line'){ setToday += n; setTodayK[p.q.lk || 'hyse'] = (setTodayK[p.q.lk || 'hyse'] || 0) + n; } }
    p.done = true;
  }
  // (when the soak is up, by the clock and the date: «i kveld», «i natt», «i morgen»; before, a haul the next morning was «i kveld», F7)
  for (const p of pending) if (p.due != null && p.due > endBy){ const w = p2When(p.due, H0); skipped.push({id:p.q.id, no:'står til ståtida er ute ' + w[0], en:'stays until the soak is up ' + w[1]}); }
  // the rest of the day by the gear, with the jig
  if (!watch && jig && dueToday.length){ const left = endBy - tailH() - t; if (left >= DRP2.jigMin){ const j = jigs.length ? jigs[jigs.length - 1] : null; if (j) go(j); steps.push({t, k:'juks', pid:j ? j.id : null, h:left, until:t + left}); t += left; } }
  // the landing: every trip, when the hold is full or the fish must go, or every N days (the engine lands sooner when the hold fills)
  if (watch){ steps.push({t:null, k:'lever', port:o.M, full:true}); steps.push({t:null, k:'ut'}); }
  else if (toM){ const M = plan2P(o, 'M'); { go(M, o.M); if (land){ steps.push({t, k:'lever', port:o.M, h:DRP2.landH}); t += DRP2.landH; } if (needBait){ steps.push({t, k:'agn', port:o.M, kg:Math.ceil((kind === 'teine' ? baitRound * 2 : lineUn * LINE_KINDS.hyse.baitKg) - st.aboard.bait)}); t += DRP2.stockH; } } }
  else if (st.hold > 0.5) steps.push({t, k:'behold', kg:Math.round(st.hold)});
  // home (or the night aboard on a long trip), the baiting, the rest
  if (!watch){
    const multi = o.rhythm === 'multi', last = multi && st.dayIndex % Math.max(2, o.days || 2) === Math.max(2, o.days || 2) - 1;
    if (multi && !last){ const A = plan2P(o, 'A'), M = plan2P(o, 'M'); if (A){ go(A); steps.push({t, k:'hvile', where:'anker', until:null}); } else if (M){ go(M, o.M); steps.push({t, k:'hvile', where:'kai', until:null}); } }
    else { const H = plan2P(o, 'H'), hp = plan2Port(o, 'H'); go(H, hp); steps.push({t, k:'hjem', port:o.home, anchor:!!o.homeA}); }
    const home = t;
    let ready2 = home;
    if (kind === 'line'){ const un = Math.max(0, st.aboard.line.n - st.aboard.line.baited + hauledLine); if (un >= 1){ const hands = Math.max(1, st.crew.length + (st.me.aboard ? 1 : 0)), coop = DRP2.egn.coop[Math.min(hands, DRP2.egn.coop.length - 1)];
      const where = st.homeShed && !(multi && !last) ? 'egnebu' : 'mannskapet', h = where === 'egnebu' ? DRP2.egn.shedH + un * DRP2.egn.shedPer : un * DRP2.egn.selfH / coop; ready2 = home + h; steps.push({t:home, k:'egning', where, n:un, ready:ready2}); } }
    // (Skippertak: tired only by the hours after it runs out, from rested; skH the hour it ends)
    const skH = p2SkipH(), seaH = home - H0, awakeH = skH > H0 ? Math.max(0, home - skH) : seaH, fatEnd = (skH > H0 ? 0 : fat0) + awakeH * (st.crew.length ? Math.max(...st.crew.map(c => c.rate || DRP2.fatH)) : DRP2.fatH), rate = multi && !last ? p2RestRate('anker') : st.homeRest ? p2RestRate('bunks') : p2RestRate('quay');
    // (you too: the night must give you a full day's energy again, at the home's or the anchorage's rest, U11)
    const meH = st.me.aboard ? p2MeRestH((skH > H0 ? 100 : st.me.energy) - DRP2.enH * awakeH, multi && !last ? st.me.anchRate : st.me.homeRate) : 0;
    const restH = Math.max(0, (fatEnd - DRP2.rested) / rate), until = Math.max(home + restH, home + meH, ready2);
    if (seaH > dayMax + 0.1) why = ['dagen blir ' + fmt(seaH, 1) + ' t: ståtida' + (land ? ', leveringen' : '') + ' og veien hjem gir ikke kortere dag', 'the day comes to ' + fmt(seaH, 1) + ' h: the soak' + (land ? ', the landing' : '') + ' and the way home allow no shorter day'];
    steps.push({t:home, k:'hvile', where:multi && !last ? 'anker' : 'hjem', until, fat:Math.round(fatEnd), ready:ready2});
    for (const s of steps) if (s.k === 'hvile' && s.until == null) s.until = until;
    return {t0:H0, steps, end:until, home, why, skipped, dayMax};
  }
  // round the clock: the watches of the coming 24 hours
  { let w = plan2Watch(H0); const R = plan2Roles(st); for (let k = 0; k < 2; k++){ const nw = plan2Watch(w.until + 0.01); steps.push({t:w.until, k:'vakt', w:nw.w, who:nw.w === 'A' ? R.A : R.B, until:nw.until}); w = nw; } }
  steps.sort((a, b) => (a.t == null ? 1e9 : a.t) - (b.t == null ? 1e9 : b.t));
  return {t0:H0, steps, end:H0 + 24, home:null, why:['døgndrift: to vakter à ' + DRP2.watch + ' t', 'round the clock: two watches of ' + DRP2.watch + ' h'], skipped, dayMax:24};
}
// ---- the day as text: [[clock, no, en], …], one line a step, the skipped places and the reason last
function planDayText(o, day){
  const nm = id => (portById(id) || {name:'?'}).name, pl = id => { const q = o.places.find(x => x.id === id), i = q ? o.places.filter(x => x.k === q.k).indexOf(q) + 1 : '?'; return q && q.k === 'juks' ? ['juksplass ' + i, 'jig place ' + i] : ['felt ' + i, 'field ' + i]; };
  const kind = p2Kind(o), U = kind ? GEAR[kind].u : ['', '', '', ''], un = (n, lang) => U[lang === 'no' ? (n === 1 ? 0 : 1) : (n === 1 ? 2 : 3)];
  const ck = t => t == null ? '–' : driftClock(driftHod(t)), out = [];
  // a time in the text with its day (GUI review P4): «kl. 16:05» the day she went, «i morgen kl. 16:05» after midnight, «om 2 døgn, kl. …» later
  const dd = t => Math.round(((t - driftHod(t)) - (day.t0 - driftHod(day.t0))) / 24);
  const kl = t => { const d = t == null ? 0 : dd(t); return d <= 0 ? 'kl. ' + ck(t) : d === 1 ? 'i morgen kl. ' + ck(t) : 'om ' + d + ' døgn, kl. ' + ck(t); };
  const at = t => { const d = t == null ? 0 : dd(t); return d <= 0 ? ck(t) : d === 1 ? 'tomorrow at ' + ck(t) : 'in ' + d + ' days, at ' + ck(t); };
  for (const s of day.steps){
    const c = ck(s.t); let no = '', en = '';
    const sn = day.sno ? p2SnoText(o, s, pl, kl, at) : null;   // (the snow crab vessel's strings, H3c)
    if (sn){ no = sn[0]; en = sn[1]; }
    else if (s.k === 'avgang'){ no = 'Går fra ' + (s.from ? nm(s.from) : 'der båten ligger'); en = 'Leaves ' + (s.from ? nm(s.from) : 'where the boat lies'); }
    else if (s.k === 'sett' && s.lk === 'auto'){ const u = unitName('line', s.n, 'auto'); no = s.again ? 'Setter ' + (s.n === 1 ? 'lenka' : 'de ' + s.n + ' lenkene') + ' ut igjen på ' + pl(s.pid)[0] + ' (egnemaskinen)' : 'Setter ' + s.n + ' ' + u + ' autoline på ' + pl(s.pid)[0]; en = s.again ? 'Sets ' + (s.n === 1 ? 'the lenke' : 'the ' + s.n + ' lenker') + ' out again at ' + pl(s.pid)[1] + ' (the baiting machine)' : 'Sets ' + s.n + ' ' + u + ' of autoline at ' + pl(s.pid)[1]; }
    else if (s.k === 'sett'){ const lk = s.lk && LINE_KINDS[s.lk] ? ' ' + LINE_KINDS[s.lk].no.toLowerCase() : '', lke = s.lk && LINE_KINDS[s.lk] ? ' ' + LINE_KINDS[s.lk].en.toLowerCase() : ''; no = 'Setter ' + s.n + ' ' + un(s.n, 'no') + lk + ' på ' + pl(s.pid)[0]; en = 'Sets ' + s.n + ' ' + un(s.n, 'en') + lke + ' at ' + pl(s.pid)[1]; }
    else if (s.k === 'trekk'){ const rs = s.reset && s.lk !== 'auto'; no = 'Trekker ' + pl(s.pid)[0] + ' (sto ' + fmt(s.soakH, 1) + ' t)' + (rs ? ', setter på nytt' : s.lk === 'auto' && !s.reset ? ', inn på magasinene' : ''); en = 'Hauls ' + pl(s.pid)[1] + ' (stood ' + fmt(s.soakH, 1) + ' h)' + (rs ? ', sets again' : s.lk === 'auto' && !s.reset ? ', back to the magazines' : ''); }
    else if (s.k === 'lagvakt'){ const G = typeof lagOf === 'function' ? lagOf() : null, sh = G ? lagShName(G.on) : 'A'; no = 'Lagene går seks og seks: 1. vakt 00–06 og 12–18, 2. vakt 06–12 og 18–24 (skift ' + sh + ' om bord, ' + lagN() + ' mann' + (s.me ? ', og du' : '') + ')'; en = 'The teams go six and six: 1st watch 00–06 and 12–18, 2nd watch 06–12 and 18–24 (crew ' + sh + ' aboard, ' + lagN() + ' men' + (s.me ? ', and you' : '') + ')'; }
    else if (s.k === 'juks'){ no = 'Jukser ' + (s.pid ? 'på ' + pl(s.pid)[0] : 'ved redskapet') + ' til ' + kl(s.until) + ' (' + fmt(s.h, 1) + ' t)'; en = 'Jigs ' + (s.pid ? 'at ' + pl(s.pid)[1] : 'by the gear') + ' until ' + at(s.until) + ' (' + fmt(s.h, 1) + ' h)'; }
    else if (s.k === 'vent'){ no = 'Venter ved ' + pl(s.pid)[0] + ' til ståtida er ute ' + kl(s.until); en = 'Waits by ' + pl(s.pid)[1] + ' until the soak is up at ' + at(s.until).replace(/^tomorrow at /, 'tomorrow, '); }
    else if (s.k === 'lever'){ const ph = day.auto && s.h ? ' (paller, om lag ' + fmt(s.h, 0) + ' t)' : '', phe = day.auto && s.h ? ' (pallets, about ' + fmt(s.h, 0) + ' h)' : ''; no = s.full ? 'Leverer i ' + nm(s.port) + ' når lasten er full' : 'Leverer i ' + nm(s.port) + ph; en = s.full ? 'Lands at ' + nm(s.port) + ' when the hold is full' : 'Lands at ' + nm(s.port) + phe; }
    else if (s.k === 'behold'){ no = 'Beholder ' + s.kg + ' kg om bord til i morgen'; en = 'Keeps ' + s.kg + ' kg aboard until tomorrow'; }
    else if (s.k === 'agn'){ const w = s.kg >= 1000 ? fmt(s.kg / 1000, 1) + ' t' : s.kg + ' kg', we = s.kg >= 1000 ? (s.kg / 1000).toFixed(1) + ' t' : s.kg + ' kg'; no = day.auto ? 'Kjøper ' + w + ' agn for turen i ' + nm(s.port) + ' (blekksprut og saury)' : 'Kjøper ' + s.kg + ' kg agn i ' + nm(s.port); en = day.auto ? 'Buys ' + we + ' of bait for the trip at ' + nm(s.port) + ' (squid and saury)' : 'Buys ' + s.kg + ' kg of bait at ' + nm(s.port); }
    else if (s.k === 'hjem'){ no = 'Hjem til ' + nm(s.port) + (s.anchor ? ', til ankers' : ''); en = 'Home to ' + nm(s.port) + (s.anchor ? ', at anchor' : ''); }
    else if (s.k === 'egning'){ no = (s.where === 'egnebu' ? 'Egnebua egner ' + s.n + ' stamper, klar ' + kl(s.ready) : 'Mannskapet egner ' + s.n + ' stamper underveis eller ved kai, klar senest ' + kl(s.ready)); en = (s.where === 'egnebu' ? 'The shed baits ' + s.n + ' tubs, ready at ' + at(s.ready) : 'The crew bait ' + s.n + ' tubs under way or at the quay, ready by ' + at(s.ready)); }
    else if (s.k === 'hvile'){ no = (s.where === 'anker' ? 'Hviler om bord' : s.where === 'kai' ? 'Hviler ved kaia' : 'Hviler') + ' til ' + kl(s.until); en = (s.where === 'anker' ? 'Rests aboard' : s.where === 'kai' ? 'Rests at the quay' : 'Rests') + ' until ' + at(s.until); }
    else if (s.k === 'vakt'){ no = 'Vakt ' + s.w + ' til ' + kl(s.until) + ': ' + s.who.join(', '); en = 'Watch ' + s.w + ' until ' + at(s.until) + ': ' + s.who.join(', '); }
    else if (s.k === 'ut'){ no = 'Ut igjen'; en = 'Out again'; }
    out.push([c, no, en]);
  }
  const cap = x => x.charAt(0).toUpperCase() + x.slice(1);   // («Field 1: …», not «field 1: …», GUI review P6)
  for (const x of day.skipped) out.push(['', cap(pl(x.id)[0]) + ': ' + x.no, cap(pl(x.id)[1]) + ': ' + x.en]);
  out.push(['', cap(day.why[0]) + '.', cap(day.why[1]) + '.']);   // («Dagen er 14 t.», not «Dagen: dagen er 14 t.», P4)
  return out;
}
// ---- the check: errors keep the plan from being switched on, warnings only inform (as driftCheck; the rhythm's rules from Jonas 26.10.2026)
// why round the clock cannot be (GUI review U2): the boat's own limits first (no bunks or wheelhouse, too few places or bunks for four), so a
// boat that can never do it says so; then what is missing aboard (four hands, you included; a bunk each). short: the button's words.
// A String with .k ('boat' or 'crew'), or null
function plan2WatchWhy(st, aboard, short){
  const no = gL, cap = (st.crewMax || 0) + 1, w = (k, a, b) => Object.assign(new String(no(a, b)), {k});
  if (!st.house || !(st.bunks > 0)) return w('boat', short ? (st.house ? 'Båten har ingen køyer' : 'Båten har verken styrhus eller køyer') : 'Døgndrift krever styrhus og køyer om bord, og båten har ' + (st.house ? 'ingen køyer.' : 'verken styrhus eller køyer.'), short ? (st.house ? 'The boat has no bunks' : 'The boat has neither a wheelhouse nor bunks') : 'Round the clock needs a wheelhouse and bunks aboard, and the boat has ' + (st.house ? 'no bunks.' : 'neither.'));
  if (cap < 4) return w('boat', short ? 'Båten har plass til bare ' + cap + ' om bord' : 'Døgndrift krever fire om bord, og båten har plass til bare ' + cap + ', deg medregnet.', short ? 'The boat has room for only ' + cap + ' aboard' : 'Round the clock needs four aboard, and the boat has room for only ' + cap + ', you included.');
  if (st.bunks < 4) return w('boat', short ? 'Båten har bare ' + st.bunks + ' køyer' : 'Døgndrift krever fire om bord med hver sin køye, og båten har bare ' + st.bunks + '.', short ? 'The boat has only ' + st.bunks + ' bunks' : 'Round the clock needs four aboard with a bunk each, and the boat has only ' + st.bunks + '.');
  if (aboard < 4) return w('crew', short ? 'Krever fire om bord, deg medregnet (dere er ' + aboard + '): ansett ' + (4 - aboard) + ' til' : 'Døgndrift krever fire om bord, deg medregnet: skipper, styrmann og to på dekk. Dere er ' + aboard + '; ansett ' + (4 - aboard) + ' til på Mannskap-siden.', short ? 'Needs four aboard, you included (you are ' + aboard + '): hire ' + (4 - aboard) + ' more' : 'Round the clock needs four aboard, you included: a skipper, a mate and two on deck. You are ' + aboard + '; hire ' + (4 - aboard) + ' more on the Crew page.');
  if (st.bunks < aboard) return w('boat', short ? 'Krever køyer til alle om bord (' + st.bunks + ' av ' + aboard + ')' : 'Døgndrift krever køyer til alle om bord: båten har ' + st.bunks + ', dere er ' + aboard + '.', short ? 'Needs bunks for everyone aboard (' + st.bunks + ' of ' + aboard + ')' : 'Round the clock needs bunks for everyone aboard: the boat has ' + st.bunks + ', you are ' + aboard + '.');
  return null;
}
// the buoy sets the plan has: those aboard and those on the gear in the sea (they come back aboard with the haul)
function p2Kits(){ const pg = S.pgear; return ((pg && pg.kits ? pg.kits.n : 0) || 0) + (typeof mySets === 'function' ? mySets().length : 0); }
function plan2Check(o, st){
  st = st || plan2StateOf(o); const E = [], Wn = [], G = [], kind = p2Kind(o), no = gL, hp = portById(o.home), sno = p2Sno(o);
  // each reason has the place that mends it (GUI review U13): a row of the page, the Crew page, the quota, or the way to the shop or the yard
  const ER = (m, go) => { E.push(m); G.push(go || null); };
  if (!hp) ER(no('Velg hvor båten skal ligge hjemme.', 'Choose where the boat lies at home.'), 'home');
  if (!RIGS[o.rig]) ER(no('Velg hva båten skal fiske med.', 'Choose what the boat fishes with.'), 'rig');
  else if (!rigHas(o.rig)) ER(no('Båten mangler haleren til ' + rigName(o.rig).toLowerCase() + '. Den kjøpes og monteres i Butikk › Elektronikk og haler.', 'The boat has no hauler for ' + rigName(o.rig).toLowerCase() + '. Buy and fit one at Shop › Electronics and haulers.'), 'verft');
  const F = o.places.filter(q => q.k === 'felt'), J = o.places.filter(q => q.k === 'juks');
  if (kind && !F.length) ER(no('Legg ut minst ett felt for ' + rigName(o.rig).toLowerCase() + '.', 'Put out at least one field for the ' + rigName(o.rig).toLowerCase() + '.'), 'places');
  if (!kind && !J.length) ER(no('Velg minst én juksplass.', 'Choose at least one jig place.'), 'places');
  if (o.places.length > DRP2.placesMax) ER(no('Høyst ' + DRP2.placesMax + ' plasser.', 'At most ' + DRP2.placesMax + ' places.'), 'places');
  if (sno) p2SnoCheck(o, st, ER, Wn);   // (the snow crab vessel's strings, the season and the quota, H3c)
  else if (kind){ const own = ownedUnits(kind), want = F.reduce((a, f) => a + f.n, 0), sk = p2Soak(o);
    // the buoy sets: none for a field is an error (the line would stay aboard, GUI review U9 A); fewer than the fields, a warning.
    // (the sets of the gear standing in the sea come back aboard when it is hauled, and the plan hauls before it sets)
    { const k = p2Kits(); if (F.length && k < 1){ ER(no('Hver lenke i sjøen trenger et blåsesett, og båten har ingen. Blåsesett kjøpes i utstyrsbutikken.', 'Every string in the sea needs a buoy set, and the boat has none. Buoy sets are bought at the tackle shop.'), 'butikk'); }
      else if (F.length > k) Wn.push(no('Hver lenke i sjøen trenger et blåsesett, og båten har ' + k + ' til ' + F.length + ' felt. Kjøp i utstyrsbutikken.', 'Every string in the sea needs a buoy set, and the boat has ' + k + ' for ' + F.length + ' fields. Buy them at the gear shop.')); }
    if (want > own) Wn.push(no('Feltene vil ha ' + want + ' ' + unitName(kind, want) + ', men båten eier ' + own + '. De første feltene får det som finnes.', 'The fields want ' + want + ' ' + unitName(kind, want) + ', but the boat owns ' + own + '. The first fields get what there is.'));
    for (const [i, f] of F.entries()){ const km = kind === 'line' ? lineKm(f.lk || 'hyse', f.n * LINE_KINDS[f.lk || 'hyse'].hooks) : f.n * GEAR[kind].km; let room = true; try { room = !!(f.hdg != null ? setGeomExact(f, f.hdg, km) : setGeom(f, 0, km)); } catch (e){}
      if (!room) Wn.push(no('Lenka på felt ' + (i + 1) + ' er ' + fmt(km, 1) + ' km og får ikke plass der' + (f.hdg != null ? ' i den retningen' : ' i noen retning') + '. Flytt feltet lenger ut, gi lenka en annen retning i kartet, eller del stampene på flere felt.', 'The string at field ' + (i + 1) + ' is ' + fmt(km, 1) + ' km and has no room there' + (f.hdg != null ? ' on that heading' : ' in any direction') + '. Move the field further out, give the string another heading in the chart, or split the tubs over more fields.')); }
    if (kind === 'line') for (const lk of p2Auto(o) ? ['auto'] : ['hyse', 'bank']){ const w = F.filter(f => (f.lk || 'hyse') === lk).reduce((a, f) => a + f.n, 0), ow = p2Units('line', lk); if (w > ow) Wn.push(no('Feltene vil ha ' + w + ' stamper ' + LINE_KINDS[lk].no.toLowerCase() + ', men båten eier ' + ow + '.', 'The fields want ' + w + ' tubs of ' + LINE_KINDS[lk].en.toLowerCase() + ', but the boat owns ' + ow + '.')); }
    for (const f of F){ if (f.soak < sk[0]) Wn.push(no('Ståtiden ' + f.soak + ' t er kort for ' + GEAR[kind].no.toLowerCase() + '.', 'A soak of ' + f.soak + ' h is short for ' + GEAR[kind].en.toLowerCase() + '.')); else if (f.soak > sk[3]) Wn.push(no('Ståtiden ' + f.soak + ' t er lang for ' + GEAR[kind].no.toLowerCase() + '. Fangsten forringes og redskapet kan gå tapt.', 'A soak of ' + f.soak + ' h is long for ' + GEAR[kind].en.toLowerCase() + '. The catch spoils and the gear can be lost.')); }
    if (kind === 'garn' && st.crewMax < 1) ER(no('Garn krever to om bord, og båten har ikke plass til flere.', 'Nets need two aboard, and the boat has no room for more.'), 'rig'); }
  // (the snow crab's fields are checked at the season's next open hour: the close season is the plan's to wait out, H3c)
  { const r = drRulesWhy({fields:F, jigs:J, rig:o.rig, jig:o.jig}, sno ? p2SnoSeason(S.t / 60, 0).openAt : S.t / 60, true); if (r) ER(gL(r.no, r.en), r.fix === 'quota' ? 'quota' : 'places'); }
  // no access to cod, haddock and saithe without you aboard (the open group, J-30-2026 § 35; a second vessel: none): bycatch at most, and with halibut gear the plan fishes halibut
  if (!S.lic && o.rig !== 'teiner' && (S.cur !== openVesselId() || !st.me.aboard) && !(S.boat.kgear && !kveiteClosed(S.t / 60)))
    Wn.push(S.cur !== openVesselId() ? no('Båten har ikke adgang til å fiske torsk, hyse og sei. De kan bare være bifangst, høyst 10 % av landingen, og resten blir inndratt. Med kveiteutstyr fisker planen kveite.', 'The boat has no access to fish cod, haddock and saithe. They can only be bycatch, at most 10% of the landing, and the rest is confiscated. With halibut gear the plan fishes halibut.')
      : no('I åpen gruppe må du være om bord for å fiske torsk, hyse og sei. Uten deg kan de bare være bifangst, høyst 10 % av landingen, og resten blir inndratt. Kjøp kveiteutstyr i butikken, så fisker planen kveite når du ikke er med.', 'In the open group you must be aboard to fish cod, haddock and saithe. Without you they can only be bycatch, at most 10% of the landing, and the rest is confiscated. Buy halibut gear at the shop, and the plan fishes halibut when you are not along.'));
  if (!st.me.aboard && !st.lag){ if (st.crewMax < 2) Wn.push(no('Båten har plass til bare én i mannskapet, så planen går bare når du er om bord.', 'The boat has room for only one crew, so the plan runs only when you are aboard.'));
    else if (!st.crew.some(c => c.sk) || !st.crew.some(c => c.mate && !c.sk)) ER(no('Når du ikke er om bord, må både en skipper og en styrmann være utnevnt. Gjør det på Mannskap-siden.', 'When you are not aboard, both a skipper and a mate must be appointed. Do it on the Crew page.'), 'mannskap'); }
  const aboard = st.crew.length + st.lag + (st.me.aboard ? 1 : 0);
  if (o.rhythm === 'watch'){ const w = plan2WatchWhy(st, aboard); if (w) ER(String(w), w.k === 'crew' ? 'mannskap' : 'rhythm'); }
  if (o.rhythm === 'multi' && !(st.bunks > 0)) ER(no('Turer over flere døgn krever køyer om bord.', 'Trips of several days need bunks aboard.'), 'rhythm');
  if (hp && o.rhythm !== 'watch' && st.crew.length && !st.homeRest) Wn.push(no('Båten har ingen køyer, og ' + hp.name + ' er en vanlig kai. Mannskapet hviler dårlig der.', 'The boat has no bunks, and ' + hp.name + ' is an ordinary quay. The crew rest poorly there.'));
  if (o.anchor && (BOAT.len || 0) < DRP.bigLen) ER(no('Bare båter fra ' + DRP.bigLen + ' m kan ligge til ankers hjemme.', 'Only boats from ' + DRP.bigLen + ' m can lie at anchor at home.'), 'home');
  if (o.land && o.land.mode === 'port' && !p2PlantOk(portById(o.land.port))) ER(no('Velg et fiskemottak å levere på' + (BOAT.cls === 'hav' ? ' som tar imot fra havbåten.' : '.'), 'Choose a fish plant to land at' + (BOAT.cls === 'hav' ? ' that takes the ocean vessel.' : '.')), 'land');
  // (the ocean vessel, H2c: the bait for a round of the fields is bought at the plant before she goes, so none aboard is no error)
  if (p2Auto(o) && st.auto && F.length && st.auto.bait < F.reduce((a, f) => a + f.n, 0) * p2AutoH().bait) Wn.push(no('Agnet i frysen (' + fmt(st.auto.bait, 0) + ' kg) rekker ikke en runde på feltene. Planen kjøper agn for turen på mottaket før den går ut.', 'The bait in the freezer (' + fmt(st.auto.bait, 0) + ' kg) is short of a round on the fields. The plan buys bait for the trip at the plant before she goes out.'));
  if (!E.length && o.rhythm !== 'watch' && o.places.length){ try { const d = planDay(o, plan2NextDep(o, S.t / 60), st), seaH = d.home - d.t0; if (seaH > d.dayMax + 1) Wn.push(no('Dagen blir ' + fmt(seaH, 1) + ' t med disse plassene og mottaket ' + (o.M ? fmt(dist(plan2P(o, 'M'), plan2P(o, 'H')) / NM, 0) + ' nm unna' : 'så langt unna') + '. Mannskapet blir slitne.', 'The day comes to ' + fmt(seaH, 1) + ' h with these places and the plant ' + (o.M ? fmt(dist(plan2P(o, 'M'), plan2P(o, 'H')) / NM, 0) + ' nm away' : 'so far away') + '. The crew get tired.')); } catch (e){} }
  if (BOAT.cls === 'hav'){ if (o.wx.wind > windLim() || o.wx.hs > seaLim()) Wn.push(no('Over ' + fmt(windLim(), 0) + ' m/s eller ' + fmt(seaLim(), 1) + ' m sjø ligger skipet bi, så den grensen gjelder.', 'Over ' + fmt(windLim(), 0) + ' m/s or ' + fmt(seaLim(), 1) + ' m of sea the ship lies to, so that limit holds.')); }
  else if (o.wx.hs > BOAT.risk[1] * 0.95) Wn.push(no('Båten tåler ikke mer enn ' + fmt(BOAT.risk[1] * 0.95, 1) + ' m sjø, så den grensen gjelder.', 'The boat takes no more than ' + fmt(BOAT.risk[1] * 0.95, 1) + ' m of sea, so that limit holds.'));
  return {ok:!E.length, errors:E, warnings:Wn, go:G};
}
