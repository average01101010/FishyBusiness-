// ===== Kappløpet Lindesnes–Nordkapp, the core (KL1, steg 116a; docs/planer/kapplop.md, Jonas 12.11.2026) =====
// Jonas 12.11.2026: «La oss si spillere kan konkurrere om den kjappeste tiden mellom Lindesnes - Nordkapp feks, der man må utføre noen
// små oppdrag langs veien. Det skal ikke være lov med teleportering, men trim-boost er lovlig.» His answers the same day: a time trial
// (V1 A: each starts when she likes, the best finished attempt counts), one clock from casting off in Lindesnes to the line north of
// Nordkapp, also in harbour and asleep (V2 A: «den kjappeste tiden»), always open with a new board every real week (V3 B: an attempt
// counts in the real week it is finished, Monday 00:00 Norwegian time), classes by the type's own top speed without trim (V4 A).
// The race is measured on the world's clock (S.t follows it; catchUp plays the time the game was closed, and Autonav sails on), never
// on the device's. One race boat (vid) per company at a time; its class is the one she had at the start.
// The rules (startverdier, kapplop.md «Reglene i løpet»):
//   - no hop from the registration to the finish (Jonas: «Nei i løpet»; 06j-hopp.js hopWhy); a hop to the start and home after is allowed
//   - 15 game minutes added for each passing over a speed limit by hand (farvRec, 05e-sjovei.js) and each near miss where she had to
//     give way (S.nearMiss), with her as the race boat
//   - answering a call for help (sjøloven § 135 third paragraph, read on Lovdata 12.11.2026: S.sos, a man overboard from another boat, the tow after a PAN-PAN, another player's
//     call for a tow) takes the time from the answer until it is over, and the way back to where she answered at her own top speed, off
//     the clock: helping costs no place
//   - a tow (the rescue boat, b.status 'tow', or another player, 'ptow') and selling the boat end the attempt (dnf); the legs sailed
//     still count on the long badge (S.lop.legsN, KL4)
// The tasks on the way (KL1b, steg 116b, V5 B): one fixed task and one surprise per leg, below at lopTasks; the screen is KL2, the board and the server's checks KL3,
// the week's end with the prize KL4. Nothing here sells anything (docs/engasjement.md).
// S.lop = {run (the attempt now: null, or {id, vid, type, cls, name, reg, t0, legs:[{t, pid}], pen:[{t, k, min}], ded:[{t0, t1, min, k}],
//          sos (the help under way), lp (her place the minute before), st:'reg'|'run', tasks:[the legs' tasks, lopLegTasks], surp:[the
//          surprise drawn for each leg, as it is shown]}), hist:[finished or broken attempts, newest first],
//          best:{week id: the best finished time in game minutes}, legsN (legs sailed in all), seq}
const LOP = {
  id:'lnk',   // Lindesnes–Nordkapp (KL3 keeps the attempts under this id; another course is another entry, kapplop.md «Det planen ikke gjør»)
  name:['Lindesnes–Nordkapp', 'Lindesnes–Nordkapp'],
  // the start and the checkpoints: a quay in the harbour of the place (any port within r km of p, so each class finds a quay that takes
  // her; the plant or the yard named is the one the course was measured to, 12.11.2026). Each leg ends where the next begins
  start:{name:'Lindesnes', p:P(58.0387, 7.1503), r:4, port:'mVA2'},
  cps:[
    {name:'Bergen', p:P(60.3950, 5.3200), r:5, port:'sv217683_1316727'},
    {name:'Ålesund', p:P(62.4720, 6.1500), r:5, port:'mM317'},
    {name:'Rørvik', p:P(64.8620, 11.2400), r:5, port:'mNT169'},
    {name:'Bodø', p:P(67.2830, 14.3800), r:5, port:'mN905'},
    {name:'Tromsø', p:P(69.6500, 18.9600), r:6, port:'mT212'}],
  // the finish: a line due north in the chart's grid from the North Cape plateau (71° 10′ 7″ N, 25° 47′ 2″ E), 40 km out, crossed
  // either way. Magerøya lies south of the cliff, so the way through Magerøysundet to Honningsvåg does not cross it
  goal:{name:'Nordkapp', p:P(71.1685, 25.7838), north:40, home:'mTF23'},
  // the classes by the type's top speed without trim (V4 A): knots, below the first is slow, from the second fast; the ocean vessels
  // (cls 'hav') for themselves
  cls:{edge:[9, 14], keys:['sakte', 'middels', 'rask', 'hav'], no:['Sakte', 'Middels', 'Rask', 'Havfartøy'], en:['Slow', 'Middle', 'Fast', 'Ocean vessels']},
  pen:{fart:15, vik:15},   // game minutes added for each passing over a limit and each near miss with the duty to give way
  margin:0.9,   // the server's check (KL3): no leg faster than the shortest way at top speed with trim, with 10 % margin
  hist:20,      // the attempts kept
  // the tasks on the way (KL1b, V5 B, Jonas 12.11.2026: «oppgavene som kommer underveis i løpet kan være x-faktoren som gjør det mer
  // spennende og balanserer spillet»): per leg the fixed one (fix) and the list the surprise is drawn from (surp), at fixed places by the
  // way: the lights within 5 km of the havsjark's Autonav route and open water on it, read off 13.11.2026 (the route goes inside the
  // skerries, so Marstein, Myken and Fruholmen of the plan lie 12 km or more off it; kapplop.md «Oppgavene underveis»). Kinds: 'foto' a picture of the light fyr (in the
  // light lys), 'prove' the survey station (one game hour of fishing and the measuring board; a type without the jig in rigs, the ocean
  // vessels, runs the echo line at p instead), 'ekko' the echo line from p, 'slep' a boat with engine failure at p towed to the
  // harbour nearest her, 'frakt' kg of freight from the checkpoint the leg starts at to the next. nm: the leg's way, measured in KL1a
  legs:[
    {nm:194, fix:{k:'foto', fyr:'Obrestad'}, surp:[{k:'foto', fyr:'Lista', lys:'sol'}, {k:'prove', p:P(58.9955, 5.3527)}, {k:'slep', p:P(58.4275, 5.8232)}]},
    {nm:157, fix:{k:'frakt', kg:300}, surp:[{k:'foto', fyr:'Kråkenes'}, {k:'foto', fyr:'Svinøy', lys:'natt'}, {k:'ekko', p:P(61.3042, 4.5525)}]},
    {nm:210, fix:{k:'prove', p:P(63.7724, 9.3127)}, surp:[{k:'foto', fyr:'Kya', lys:'natt'}, {k:'foto', fyr:'Bjørnsund', lys:'sol'}, {k:'slep', p:P(63.1622, 7.6705)}]},
    {nm:175, fix:{k:'slep', p:P(66.3772, 12.9642)}, surp:[{k:'ekko', p:P(65.8689, 12.3801)}, {k:'prove', p:P(65.5849, 12.2385)}, {k:'foto', fyr:'Kalsholmen', lys:'sol'}]},
    {nm:192, fix:{k:'foto', fyr:'Tranøy'}, surp:[{k:'prove', p:P(68.1068, 15.1829)}, {k:'slep', p:P(68.7763, 16.8129)}, {k:'foto', fyr:'Landegode', lys:'sol'}]},
    {nm:181, fix:{k:'foto', fyr:'Skjervøya', lys:'natt'}, surp:[{k:'foto', fyr:'Vorterøy'}, {k:'ekko', p:P(70.4619, 22.3459)}, {k:'slep', p:P(70.7903, 23.7850)}]}],
  // game minutes: a surprise not done when the leg ends, or a task that failed (the boat drifted ashore before she came); the most the
  // measuring board takes off for an exact reading or adds for a bad one (kapplop.md); the light waited for within the leg's time at
  // the type's top speed times lysF, or the picture is taken in any light
  task:{miss:60, meas:30, lysF:2.5},
};
const lopL = (no, en) => S.lang === 'en' ? en : no;
function lopState(){ const L = S.lop || (S.lop = {run:null, hist:[], best:{}, legsN:0, seq:0}); L.hist = L.hist || []; L.best = L.best || {}; return L; }
// the class of a vessel type, from its fields alone (no type names, CLAUDE.md): the ocean vessels, then the top speed without trim
function lopCls(V){
  if (!V) return null; if (V.cls === 'hav') return 'hav';
  const v = +V.vmax || 0, e = LOP.cls.edge; return v < e[0] ? 'sakte' : v < e[1] ? 'middels' : 'rask';
}
const lopClsName = (k, en) => { const i = LOP.cls.keys.indexOf(k); return i < 0 ? '' : (en ? LOP.cls.en : LOP.cls.no)[i]; };
// the real time of a game minute on the world's clock (01-world.js: WORLD_T0, GAME_RATE game minutes a real minute)
const lopMs = t => WORLD_T0 + t * 60000 / GAME_RATE;
// Norway's offset from UTC at the real time ms: summer time (CEST, +2) from the last Sunday of March 01:00 UTC to the last Sunday of
// October 01:00 UTC, else CET (+1) (the EU rule, directive 2000/84/EC, which Norway follows: forskrift om sommertid, FOR-1980-02-15-2)
function lopLastSun(y, m){ const d = new Date(Date.UTC(y, m + 1, 0)); return Date.UTC(y, m, d.getUTCDate() - d.getUTCDay(), 1); }
function lopOslo(ms){ const y = new Date(ms).getUTCFullYear(); return ms >= lopLastSun(y, 2) && ms < lopLastSun(y, 9) ? 2 : 1; }
// the real week an attempt finished at ms counts in (V3 B): Monday 00:00 to Sunday 24:00 Norwegian time. id is the ISO week of that
// Monday ('2026-W47', the week's own name in the race's title), t0 and t1 its first and last real ms
function lopWeek(ms){
  const off = lopOslo(ms), L = new Date(ms + off * 3600000);   // the wall clock in Norway, read with the UTC getters
  const dow = (L.getUTCDay() + 6) % 7, mon = Date.UTC(L.getUTCFullYear(), L.getUTCMonth(), L.getUTCDate() - dow);   // that Monday 00:00, wall clock
  // the ISO week: the week with the year's first Thursday is week 1
  const th = new Date(mon + 3 * 86400000), y = th.getUTCFullYear(), jan4 = Date.UTC(y, 0, 4), w1 = jan4 - ((new Date(jan4).getUTCDay() + 6) % 7) * 86400000;
  const w = 1 + Math.round((mon - w1) / (7 * 86400000));
  const t0 = mon - lopOslo(mon - 3 * 3600000) * 3600000, nx = mon + 7 * 86400000, t1 = nx - lopOslo(nx - 3 * 3600000) * 3600000;
  return {id:y + '-W' + String(w).padStart(2, '0'), y, w, t0, t1};
}
// the least possible time for nm nautical miles at the top speed vmax (knots) with the trim factor trim (1 without), less the margin:
// game hours. vmax is the boat's own with her equipment (the 90 hp outboard gives the skiff 30 kn, applyVessel), not the type's: the
// class is the type's (V4 A), the speed the boat's. The server checks each leg against the same rule in KL3
function lopMinH(nm, vmax, trim){ const v = (+vmax || 0) * Math.max(1, +trim || 1); return v > 0 && nm > 0 ? nm / v * LOP.margin : 0; }
// the attempt's time in game minutes, at `now` if not finished: one clock from casting off (V2 A), with the penalties added and the help
// taken off (when the help is over); the split at each checkpoint is the time on the clock there (with what was added and taken off by then)
function lopTime(run, now){
  if (!run || run.t0 == null) return {min:0, raw:0, pen:0, ded:0, splits:[]};
  const end = run.t1 != null ? run.t1 : now != null ? now : run.t0, at = t => {
    const pen = (run.pen || []).filter(x => x.t <= t).reduce((a, x) => a + x.min, 0);
    const ded = (run.ded || []).filter(x => x.t1 <= t).reduce((a, x) => a + x.min, 0);   // (help is taken off when it is over: lopSosEnd)
    return {raw:t - run.t0, pen, ded, min:Math.max(0, t - run.t0 + pen - ded)}; };
  const r = at(end); r.splits = (run.legs || []).map(l => at(l.t).min); return r;
}
// the race boat now, registered or under way (vid: the vessel asked about, S.cur when left out)
function lopOn(vid){ const L = S.lop, r = L && L.run; return !!(r && (r.st === 'reg' || r.st === 'run') && r.vid === (vid === undefined ? S.cur : vid)); }
// the checkpoint a port is in (-1: none): the start is 0, the checkpoints 1..cps.length; any port within r true km (kmTrue: the grid's
// scale grows towards the north), so each class finds a quay that takes her
function lopCpOf(pid){ const pt = portById(pid); if (!pt) return -1;
  if (kmTrue(pt.p, LOP.start.p) <= LOP.start.r) return 0;
  for (let i = 0; i < LOP.cps.length; i++) if (kmTrue(pt.p, LOP.cps[i].p) <= LOP.cps[i].r) return i + 1;
  return -1; }
// why she cannot register now (null: she can)
function lopWhyNot(){
  const b = S.boat, L = lopState();
  if (L.run && (L.run.st === 'reg' || L.run.st === 'run')) return L.run.vid === S.cur ? ['Båten er alt med i kappløpet.', 'The boat is in the race already.'] : ['En annen av båtene dine er med i kappløpet.', 'Another of your boats is in the race.'];
  if (b.status !== 'port' || lopCpOf(b.port) !== 0) return ['Påmeldingen er ved kaia i ' + LOP.start.name + '.', 'You register at the quay in ' + LOP.start.name + '.'];
  if (b.sale) return ['Båten ligger til salgs.', 'The boat is for sale.'];
  if (S.plan && (S.plan.ops || S.plan.p2)) return ['Driftsplanen styrer båten.', 'The operations plan runs the boat.'];
  return null;
}
// the registration in Lindesnes: the clock starts when she casts off (lopDepart)
function lopStart(){
  const why = lopWhyNot(); if (why) return {why};
  const L = lopState(), b = S.boat, V = VESSELS[b.type];
  L.run = {id:LOP.id + '-' + (++L.seq), vid:S.cur, type:b.type, cls:lopCls(V), name:S.boatName || '', reg:S.t, t0:null, t1:null, legs:[], pen:[], ded:[], sos:null, lp:null, st:'reg', tasks:[], surp:[]};
  b.lop = L.run.id;   // the boat herself carries the attempt: a boat bought later under the same vessel id does not
  log('Påmeldt til kappløpet ' + LOP.name[0] + ' i klassen ' + lopClsName(L.run.cls) + '. Klokka går når du kaster loss.', 'Registered for the race ' + LOP.name[1] + ' in the class ' + lopClsName(L.run.cls, true) + '. The clock starts when you cast off.', 'nav');
  if (typeof cloudEv === 'function') cloudEv('lop_start', {cls:L.run.cls, type:b.type});
  return L.run;
}
// the attempt ends: 'maal' (over the line), or broken ('slep', 'salg', 'bytte': another type on the vessel, 'avbrutt': given up by the player). A finished time goes to the
// week it was finished in; the legs sailed count either way
function lopEnd(how){
  const L = lopState(), r = L.run; if (!r) return null;
  // registered and never off: the registration is struck, nothing kept or counted
  if (r.t0 == null){ L.run = null; log('Påmeldingen til kappløpet er strøket.', 'The registration for the race is struck off.', 'nav'); return null; }
  if (r.sos) lopSosEnd(r, S.t, r.lp);
  // the race's freight still aboard goes ashore with the attempt (the tasks are the race's, KL1b)
  const ashore = () => { if (S.cargo) S.cargo = S.cargo.filter(c => !(typeof c.tur === 'string' && c.tur.indexOf(r.id + ':') === 0)); };
  if (r.vid === S.cur) ashore(); else { const v = vesselById(r.vid); if (v) onVessel(v, ashore); }
  r.t1 = S.t; r.st = how === 'maal' ? 'done' : 'dnf'; r.how = how;
  const T = lopTime(r), wk = lopWeek(lopMs(r.t1)).id;
  const e = {id:r.id, type:r.type, cls:r.cls, name:r.name, t0:r.t0, t1:r.t1, legs:r.legs.length, min:T.min, pen:T.pen, ded:T.ded, splits:T.splits, st:r.st, how, week:wk};
  L.hist.unshift(e); if (L.hist.length > LOP.hist) L.hist.length = LOP.hist;
  if (r.st === 'done' && !(L.best[wk] != null && L.best[wk] <= T.min)) L.best[wk] = T.min;
  L.run = null;
  const hm = lopHm(T.min);
  if (r.st === 'done') log('Over mållinja ved ' + LOP.goal.name + '! Tida er ' + hm[0] + '.', 'Over the finish line at ' + LOP.goal.name + '! The time is ' + hm[1] + '.', 'nav');
  else log('Kappløpet er brutt (' + lopHowWords(how)[0] + '). ' + r.legs.length + ' av ' + (LOP.cps.length + 1) + ' etapper er seilt.', 'The race is broken off (' + lopHowWords(how)[1] + '). ' + r.legs.length + ' of ' + (LOP.cps.length + 1) + ' legs sailed.', 'nav');
  if (typeof cloudEv === 'function') cloudEv(r.st === 'done' ? 'lop_done' : 'lop_dnf', {cls:r.cls, type:r.type, min:Math.round(T.min), legs:r.legs.length, how});
  return e;
}
const lopHowWords = how => how === 'slep' ? ['slep', 'a tow'] : how === 'salg' ? ['båten er solgt', 'the boat is sold'] : how === 'bytte' ? ['båten er byttet', 'the boat is traded'] : ['avbrutt', 'given up'];
// game minutes as «2 d 4 t 12 min» (the clock runs days on the long course)
function lopHm(min){ const m = Math.max(0, Math.round(min)), d = Math.floor(m / 1440), h = Math.floor(m % 1440 / 60), mm = m % 60;
  const no = (d ? d + ' d ' : '') + (d || h ? h + ' t ' : '') + mm + ' min', en = (d ? d + ' d ' : '') + (d || h ? h + ' h ' : '') + mm + ' min'; return [no, en]; }
// casting off (06-services.js depart, the bound vessel): from the start the clock begins; from a checkpoint it runs on (one clock)
function lopDepart(){
  const L = S.lop, r = L && L.run; if (!r || r.vid !== S.cur || r.st !== 'reg') return;
  const b = S.boat; if (b.status !== 'port' || lopCpOf(b.port) !== 0) return;
  r.t0 = S.t; r.st = 'run'; r.lp = {x:b.pos.x, y:b.pos.y};
  log('Kappløpet er i gang. Klokka går til mållinja ved ' + LOP.goal.name + '.', 'The race is on. The clock runs to the finish line at ' + LOP.goal.name + '.', 'nav');
  lopLegTasks(r, 0);   // leg 1's task and its surprise, shown at the start (KL1b)
}
// moored (05-vessels.js dock, the bound vessel): the next checkpoint in order is a leg done, when the leg's fixed task is (KL1b). The
// leg's freight is landed here first (the crew's work on the clock, cargoJob), and the next leg's tasks are shown
function lopDock(pid){
  const L = S.lop, r = L && L.run; if (!r || r.vid !== S.cur || r.st !== 'run') return;
  const k = lopCpOf(pid), next = r.legs.length + 1; if (k !== next || next > LOP.cps.length) return;
  for (const m of (r.tasks || []).slice()) if (m.st === 'go' && m.k === 'frakt' && m.leg === next - 1 && m.stage === 'go'){
    S.cargo = (S.cargo || []).filter(c => c.tur !== m.id); cargoJob(m.kg, 'Lossing av ' + m.what[0], 'Landing the ' + m.what[1], true); m.stage = 'landed';
    lopTaskEnd(m, true);   // (a fixed task done in port counts the leg from there)
    if (S.lop.run !== r || r.legs.length + 1 !== next) return; }
  if (!lopFixDone(r, next - 1)){ const m = r.tasks.find(x => x.leg === next - 1 && x.role === 'fix' && x.st === 'go'), w = lopTaskWhat(m);
    log('Sjekkpunkt ' + LOP.cps[k - 1].name + ' teller når etappens oppgave er gjort: ' + w[0] + '.', 'Checkpoint ' + LOP.cps[k - 1].name + ' counts when the leg\'s task is done: ' + w[1] + '.', 'nav'); return; }
  lopLegClose(r, next - 1);
  r.legs.push({t:S.t, pid}); L.legsN = (L.legsN || 0) + 1;
  const T = lopTime(r), hm = lopHm(T.min);
  log('Sjekkpunkt ' + LOP.cps[k - 1].name + ': etappe ' + next + ' av ' + (LOP.cps.length + 1) + '. Klokka står på ' + hm[0] + '.', 'Checkpoint ' + LOP.cps[k - 1].name + ': leg ' + next + ' of ' + (LOP.cps.length + 1) + '. The clock is at ' + hm[1] + '.', 'nav');
  if (typeof cloudEv === 'function') cloudEv('lop_leg', {cls:r.cls, leg:next, min:Math.round(T.min)});
  lopLegTasks(r, next);   // the next leg's task and its surprise
}
// the finish: the move from a to c crosses the line due north of the cape in the chart's grid (constant x; it parts from the true
// meridian by the grid's convergence, some 8° here, and is the line the chart will draw in KL2), either way. vmax: the boat's top
// speed now (BOAT.vmax: her equipment and the trim); a move longer than a minute at twice that speed (and 200 m) is a jump, not sailing («Sitter båten fast?» moves her up to 4 km), and never crosses
function lopCross(a, c, vmax){ const G = LOP.goal, X = G.p.x; if (!a || !c || (a.x - X) * (c.x - X) > 0 || a.x === c.x) return false;
  if (vmax && dist(a, c) > 0.2 + 2 * vmax * NM / 60 * gridScale(c)) return false;
  const y = a.y + (c.y - a.y) * (X - a.x) / (c.x - a.x); return y <= G.p.y + 0.3 && y >= G.p.y - G.north; }
// the help under way (sjøloven § 135): the distress call answered with this boat, the man from the other boat in the water, the tow
// after a PAN-PAN (a trip mission with sos), another player's call for a tow taken. The id of the one going on now, or null
function lopSosNow(){
  const vid = S.cur;
  if (S.mob && S.mob.other && S.mob.other.sos && S.mob.vid === vid) return 'm' + S.mob.other.sos;
  if (S.sos && S.sos.ans && S.sos.vid === vid) return 'm' + S.sos.id;
  const m = S.turer && (S.turer.act || []).find(x => x.sos && x.vid === vid); if (m) return 's' + m.sos;
  // (another player's call: only while the line is fast and she tows, not on the way there, and with you aboard the race boat:
  // S.ptowH is the company's, not a boat's)
  if (S.ptowH && S.ptowH.id && S.ptowH.st === 'tow' && S.me === vid) return 'p' + S.ptowH.id;   // (the boat you are aboard tows, 10o-ptow.js)
  return null;
}
// where the race boat is going now: the next checkpoint, or the cape after the last
const lopNext = r => r.legs.length < LOP.cps.length ? LOP.cps[r.legs.length].p : LOP.goal.p;
// the help over: the time it took, less the way it made towards the checkpoint she was bound for when she answered (she gets back the
// time she lost, never more). The way made forward is counted at the type's cruising speed, the slowest she would sail the race at,
// so a call answered and left while she sails on gives nothing (sailing slower than that costs her as much as it takes off); the way
// back at her top speed now, the fastest she could have come back (BOAT.vmax with her equipment and the trim, the type's when unbound)
function lopSosEnd(r, t, p){
  const s = r.sos; if (!s) return; r.sos = null;
  const V = VESSELS[r.type] || {}, to = s.to || lopNext(r), vc = Math.max(1, +V.vcruise || +V.vmax || 6), vm = Math.max(1, +V.vmax || 6, r.vid === S.cur ? +BOAT.vmax || 0 : 0);
  const made = p && s.p ? (kmTrue(s.p, to) - kmTrue(p, to)) / NM : 0, gain = made / (made >= 0 ? vc : vm) * 60, min = Math.max(0, Math.round(t - s.t - gain));
  if (!min) return;
  r.ded.push({t0:s.t, t1:t, k:s.id[0], min});
  const hm = lopHm(min);
  log('Kappløpet: ' + hm[0] + ' er trukket fra tida for hjelpen til sjøs.', 'The race: ' + hm[1] + ' taken off the time for the help at sea.', 'nav');
}
// one minute of the race, for the race boat (05-vessels.js step, the vessel bound): the finish, the penalties, the help, a tow
function lopMinute(){
  const L = S.lop, r = L && L.run; if (!r || r.vid !== S.cur) return;
  const b = S.boat, here = {x:b.pos.x, y:b.pos.y};
  // registered, and gone from the quay in Lindesnes some other way than by casting off: the registration is struck
  if (r.st === 'reg'){ if (!(b.status === 'port' && lopCpOf(b.port) === 0)) lopEnd('avbrutt'); return; }
  if (r.st !== 'run') return;
  // another type on the same vessel (traded at the yard): another boat, another class
  if (b.type !== r.type){ lopEnd('bytte'); return; }
  // a tow ends the attempt: help from outside, as in a real race
  if (b.status === 'tow' || b.status === 'ptow'){ lopEnd('slep'); return; }
  // the penalties: each passing written down with this boat since the start, once (marked lop on the record: the lists are cut at 20
  // and 40 from the front, so neither their length nor an index tells what is new)
  for (const x of S.farv || []) if (!x.lop && x.vid === r.vid && x.k === 'fart' && x.t >= r.t0){ x.lop = 1; r.pen.push({t:x.t, k:'fart', min:LOP.pen.fart}); }
  for (const x of S.nearMiss || []) if (!x.lop && x.vid === r.vid && (x.give === 'a' || x.give === 'both') && x.t >= r.t0){ x.lop = 1; r.pen.push({t:x.t, k:'vik', min:LOP.pen.vik}); }
  // the help: from the answer to its end, less the way made
  const sid = lopSosNow();
  if (sid && !r.sos) r.sos = {id:sid, t:S.t, p:r.lp || here, to:lopNext(r)};
  else if (r.sos && sid !== r.sos.id){ lopSosEnd(r, S.t, here); if (sid) r.sos = {id:sid, t:S.t, p:here, to:lopNext(r)}; }
  // a picture in a light that will not come before the leg's time is out (the season has turned since the leg began, or the time is
  // over): an ordinary picture of the light will do (lopLys), read once a game hour
  if (S.t % 60 === 0) for (const m of r.tasks || []) if (m.st === 'go' && m.k === 'foto' && m.lys && (S.t >= m.due || turLysNext(m, S.t / 60) == null)) lopLysDrop(m);
  // the race's freight: loaded at the checkpoint when there is room now, and a word once if she leaves it on the quay
  for (const m of r.tasks || []) if (m.st === 'go' && m.k === 'frakt' && m.stage === 'pick'){
    if (b.status === 'port' && cargoRoom() >= m.kg) lopLoad(m);
    else if (b.status !== 'port' && !m.warn){ m.warn = 1; const pt = portById(m.from); log('Kappløpet: lasta ligger igjen på kaia i ' + (pt ? pt.name : '') + '. Sjekkpunktet teller ikke uten den.', 'The race: the freight is left on the quay in ' + (pt ? pt.name : '') + '. The checkpoint does not count without it.', 'nav'); } }
  // the finish line, after the last checkpoint, when the last leg's task is done
  const over = r.legs.length === LOP.cps.length && lopCross(r.lp, here, Math.max(BOAT.vmax || 0, (VESSELS[r.type] || {}).vmax || 0) || 30);
  if (over && !lopFixDone(r, LOP.cps.length)){ if (!r.goalW){ r.goalW = 1; const m = r.tasks.find(x => x.leg === LOP.cps.length && x.role === 'fix' && x.st === 'go'), w = lopTaskWhat(m);
    log('Mållinja teller når etappens oppgave er gjort: ' + w[0] + '.', 'The finish line counts when the leg\'s task is done: ' + w[1] + '.', 'nav'); } }
  else if (over){ lopLegClose(r, LOP.cps.length); r.legs.push({t:S.t, pid:null}); L.legsN = (L.legsN || 0) + 1; r.lp = here; lopEnd('maal'); return; }
  r.lp = here;
}
// once a minute from step, outside the vessels: a race boat no longer in the fleet (sold) ends the attempt; else her minute
function lopTick(){
  const L = S.lop, r = L && L.run; if (!r) return;
  // (sold: gone from the fleet, or the vessel id taken by a boat bought since: ids are 'v' + the next number, so the boat herself carries
  // the attempt's id, b.lop; a renamed boat is the same boat)
  const v = vesselById(r.vid), bt = v && vget(v, 'boat'); if (!v || !bt || bt.lop !== r.id){ lopEnd('salg'); return; }
  if (r.vid !== S.cur) onVessel(v, lopMinute); else lopMinute();
}

// ---- the tasks on the way (KL1b, steg 116b; kapplop.md «Oppgavene underveis (x-faktoren)», V5 B) ----
// Each leg has its fixed task and one surprise, the same for everyone in the class that week (V3 B: a new board every real week): drawn
// from the race's id, the week the attempt started in and the class, and shown when the leg begins (at the start for leg 1, at the
// checkpoint before for the others). The tasks lie in S.lop.run.tasks, not on the board: they take no place there (T.slots), are not
// paid (turPay; turPayOut and turEnd hand them to lopTaskEnd) and do not count in the board's brake (turWeek reads T.done and T.act).
// They are done by the missions' own minute (turMinute: the station, the echo line, the tow drifting and made fast), the quay (turDock:
// the tow delivered), the camera (turFotoAt and turFotoTake) and the crew's loading (cargoJob). The tasks take their time on the one
// clock (V2 A). A leg counts at its checkpoint only when its fixed task is done; the surprise left undone then adds task.miss, and the
// measuring board adds or takes off up to task.meas by how close it was read (kapplop.md: «Nøyaktig måling gir opptil 30
// spillminutter fradrag, og en dårlig måling gir like mye tillegg»).
const lopSeed = str => hashStr(str) | 0;   // (FNV-1a, 05-vessels.js)
// the surprise of leg j for a class in a week: its index in LOP.legs[j].surp (the same for all in the class that week)
function lopSurp(j, cls, wk){ const L = LOP.legs[j]; return L && L.surp.length ? Math.floor(h2(lopSeed(LOP.id + '|' + wk + '|' + cls), j) * L.surp.length) % L.surp.length : -1; }
// a task as the type does it: the station needs the jig (rigs), so a type without it runs the echo line at the same place
function lopKind(spec, V){ if (spec.k === 'prove' && !((V && V.rigs) || []).includes('juksa')) return Object.assign({}, spec, {k:'ekko'}); return spec; }
// a seeded draw (the places the picture is taken from, the echo line's points, the towed boat): the same for every attempt
const lopRnd = seed => { let i = 0; return () => h2(seed, i++); };
// the light a picture asks for, from H (game hours) and within hTot game hours: when it does not come in time (midnight sun, the dark
// time of the year), the picture is taken in any light. Written here why: the race is always open (V3 B), so a light the season does not
// have would hold the boat at the light for days, and that is not the race Jonas chose («den kjappeste tiden»)
function lopLys(m, H, hTot){
  if (!m.lys) return true; m.hTot = hTot; m.due = Math.round((H + hTot) * 60);
  if (turLysNext(m, H) != null) return true;
  lopLysDrop(m, false); return false;
}
// the light given up: any light will do for the picture (said in the deck log when say)
function lopLysDrop(m, say = true){ m.lysAlt = m.lys; m.lys = null;
  if (say) log('Kappløpet: ' + TUR_LYS[m.lysAlt].no + ' kommer ikke ved ' + turFyrName(m) + ' innen etappens tid. Et vanlig bilde av fyret holder.', 'The race: ' + TUR_LYS[m.lysAlt].en + ' does not come at ' + turFyrName(m) + ' within the leg\'s time. An ordinary picture of the light will do.', 'nav'); }
// the words for a task
function lopTaskWhat(m){
  const P0 = id => portById(id) ? portById(id).name : '';
  if (m.k === 'foto'){ const nm = turFyrName(m), ly = m.lys ? TUR_LYS[m.lys] : null; return ['bilde av ' + nm + (ly ? ' ' + ly.no : ''), 'a picture of ' + nm + (ly ? ' ' + ly.en : '')]; }
  if (m.k === 'prove' && m.kind === 'ekko') return ['ekkoloddlinja ved ' + mobLL(m.p), 'the echo line at ' + mobLLen(m.p)];
  if (m.k === 'prove') return ['prøvestasjonen ved ' + mobLL(m.p), 'the survey station at ' + mobLLen(m.p)];
  if (m.k === 'slep') return ['slep av «' + m.boat + '» til ' + P0(m.to), 'tow the «' + m.boat + '» to ' + P0(m.to)];
  if (m.k === 'frakt') return [Math.round(m.kg) + ' kg ' + m.what[0] + ' til ' + LOP.cps[m.leg].name, Math.round(m.kg) + ' kg of ' + m.what[1] + ' to ' + LOP.cps[m.leg].name];
  return ['', ''];
}
// the tasks under way for the race boat bound now (turActs reads them; the minute is the bound vessel's)
function lopTasks(){ const L = S.lop, r = L && L.run; if (!r || r.st !== 'run' || r.vid !== S.cur || !r.tasks) return []; return r.tasks.filter(m => m.st === 'go'); }
// one task of leg j made at its place (null when the place is not one the generator takes: the tests make sure each is)
function lopMake(run, j, role, spec){
  const V = VESSELS[run.type] || {}, sp = lopKind(spec, V), o = turHere(), rnd = lopRnd(lopSeed(LOP.id + '|' + j + '|' + role + '|' + sp.k));
  let m = null;
  if (sp.k === 'foto') m = turFoto(o, 'lop', null, {fyr:sp.fyr, lys:sp.lys || null, rnd});
  else if (sp.k === 'prove' || sp.k === 'ekko'){ m = turProve(o, 'lop', {p:sp.p, kind:sp.k === 'ekko' ? 'ekko' : 'stasjon', rnd});
    // the station where the rules do not let this boat fish with the jig (ruBlockMsg: a boat of 21 to 27.99 m may not fish cod inside
    // the baseline, J-forskriften), is the echo line at the same place, as for a type without the jig
    // (asked for cod too: the jig takes mostly cod, and the board's own question, any species, lets the 21 m boat through)
    let no = !m; if (m && m.kind === 'stasjon') try { no = !!ruBlockMsg({p:m.p, len:BOAT.len, gear:'juksa', sp:'torsk', hand:!(S.equip && S.equip.jukse > 0)}); } catch (e){}
    if (no && sp.k === 'prove') m = turProve(o, 'lop', {p:sp.p, kind:'ekko', rnd}); }
  else if (sp.k === 'slep') m = turSlep(o, 'lop', {p:sp.p, rnd});
  else if (sp.k === 'frakt'){ const b = S.boat, from = b.status === 'port' ? b.port : null, cp = LOP.cps[j];
    if (from && cp) m = turFrakt(o, 'lop', new Set(), turMe(), null, {from, to:cp.port, kg:sp.kg, rnd}); }
  if (!m) return null;
  Object.assign(m, {id:run.id + ':' + j + role[0], lop:run.id, leg:j, role, vid:run.vid, st:'go', t0:S.t, pay:0, base:0});
  if (m.k === 'prove') m.stage = m.kind === 'ekko' ? 'line' : 'fish';
  if (m.k === 'slep') m.stage = 'reach';
  if (m.k === 'frakt') m.stage = 'pick';
  if (m.k === 'foto' && m.lys){ const vm = Math.max(1, +V.vmax || 6), hTot = LOP.legs[j].nm / vm * LOP.task.lysF;
    if (!lopLys(m, S.t / 60, hTot)) lopLysDrop(m); }
  return m;
}
// the tasks of leg j (0 to 5), when the leg begins: the fixed one and the surprise, shown now
function lopLegTasks(run, j){
  const Lg = LOP.legs[j]; if (!Lg) return;
  run.tasks = (run.tasks || []).filter(m => m.leg !== j); run.surp = run.surp || [];
  const wk = lopWeek(lopMs(run.t0)).id, si = lopSurp(j, run.cls, wk); run.surp[j] = si;
  for (const [role, spec] of [['fix', Lg.fix], ['surp', Lg.surp[si]]]){
    const m = spec && lopMake(run, j, role, spec);
    if (!m){ if (spec) console.warn('lop: no task at', j, role, spec); continue; }
    run.tasks.push(m);
    const w = lopTaskWhat(m);
    log((role === 'fix' ? 'Etappe ' + (j + 1) + ', oppgaven: ' : 'Etappe ' + (j + 1) + ', overraskelsen: ') + w[0] + '.', (role === 'fix' ? 'Leg ' + (j + 1) + ', the task: ' : 'Leg ' + (j + 1) + ', the surprise: ') + w[1] + '.', 'nav');
    if (m.k === 'frakt' && S.boat.status === 'port') lopLoad(m);
  }
}
// the freight aboard at the checkpoint the leg starts at (turLoad: the crew's work, cargoJob; waits on the quay when there is no room)
function lopLoad(m){ if (m.stage !== 'pick' || S.boat.status !== 'port' || lopCpOf(S.boat.port) !== m.leg) return false; return turLoad(m); }
// a task over: done, or failed (ok false: the boat drifted ashore before she came, and the task counts as done with task.miss added)
function lopTaskEnd(m, ok, how){
  const L = S.lop, r = L && L.run; if (m.st !== 'go') return; m.st = ok ? 'done' : 'fail'; m.t1 = S.t;
  let adj = 0;
  if (!ok) adj = LOP.task.miss;
  else if (m.k === 'prove' && m.kind === 'stasjon' && m.err != null){ const f = clamp(1 - (m.err - 0.5) / 2.5, 0, 1); adj = Math.round(LOP.task.meas * (1 - 2 * f)); }
  m.adj = adj;
  if (r && r.id === m.lop && adj) r.pen.push({t:S.t, k:'opp', min:adj, leg:m.leg});
  const w = lopTaskWhat(m), hm = lopHm(Math.abs(adj));
  log('Kappløpet: ' + w[0] + (ok ? ' er gjort' : ' gikk ikke') + (adj ? (adj > 0 ? ', ' + hm[0] + ' lagt til' : ', ' + hm[0] + ' trukket fra') : '') + '.',
    'The race: ' + w[1] + (ok ? ' is done' : ' failed') + (adj ? (adj > 0 ? ', ' + hm[1] + ' added' : ', ' + hm[1] + ' taken off') : '') + '.', 'nav');
  if (typeof cloudEv === 'function') cloudEv('lop_task', {leg:m.leg + 1, role:m.role, k:m.k === 'prove' ? m.kind : m.k, ok:!!ok, adj, min:Math.round(S.t - m.t0), cls:r ? r.cls : null});
  // done at the checkpoint the leg ends at (the freight landed there): the leg counts now
  if (r && m.role === 'fix' && S.boat.status === 'port' && r.vid === S.cur) lopDock(S.boat.port);
}
// the leg j's fixed task done (or failed, or none could be made): the checkpoint counts
const lopFixDone = (r, j) => !(r.tasks || []).some(m => m.leg === j && m.role === 'fix' && m.st === 'go');
// the leg j is over: the surprise left undone adds task.miss (a tow left drifting, a picture not taken), and is struck. One under way
// (the boat on the line, the station fished and waiting for the board, the echo line begun) goes on to the next leg's end, so she is
// never struck in the middle of doing it
const lopUnderway = m => (m.k === 'slep' && m.stage === 'tow') || (m.k === 'prove' && (m.stage === 'measure' || (m.min || 0) > 0 || (m.at || 0) > 0));
function lopLegClose(r, j){
  for (const m of r.tasks || []) if (m.role === 'surp' && m.st === 'go' && (m.leg === j || (m.leg < j && m.carry))){
    if (m.leg === j && lopUnderway(m)){ m.carry = 1; continue; }
    m.st = 'miss'; m.adj = LOP.task.miss; r.pen.push({t:S.t, k:'opp', min:LOP.task.miss, leg:j});
    const w = lopTaskWhat(m), hm = lopHm(LOP.task.miss); log('Kappløpet: overraskelsen (' + w[0] + ') ble ikke gjort, ' + hm[0] + ' lagt til.', 'The race: the surprise (' + w[1] + ') was not done, ' + hm[1] + ' added.', 'nav'); }
}
