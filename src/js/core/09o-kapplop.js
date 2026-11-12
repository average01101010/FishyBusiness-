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
// The tasks on the way (the fixed one and the surprise per leg) are steg 116b; the screen is KL2, the board and the server's checks KL3,
// the week's end with the prize KL4. Nothing here sells anything (docs/engasjement.md).
// S.lop = {run (the attempt now: null, or {id, vid, type, cls, name, reg, t0, legs:[{t, pid}], pen:[{t, k, min}], ded:[{t0, t1, min, k}],
//          sos (the help under way), lp (her place the minute before), st:'reg'|'run'}), hist:[finished or broken attempts, newest first],
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
  L.run = {id:LOP.id + '-' + (++L.seq), vid:S.cur, type:b.type, cls:lopCls(V), name:S.boatName || '', reg:S.t, t0:null, t1:null, legs:[], pen:[], ded:[], sos:null, lp:null, st:'reg'};
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
}
// moored (05-vessels.js dock, the bound vessel): the next checkpoint in order is a leg done
function lopDock(pid){
  const L = S.lop, r = L && L.run; if (!r || r.vid !== S.cur || r.st !== 'run') return;
  const k = lopCpOf(pid), next = r.legs.length + 1; if (k !== next || next > LOP.cps.length) return;
  r.legs.push({t:S.t, pid}); L.legsN = (L.legsN || 0) + 1;
  const T = lopTime(r), hm = lopHm(T.min);
  log('Sjekkpunkt ' + LOP.cps[k - 1].name + ': etappe ' + next + ' av ' + (LOP.cps.length + 1) + '. Klokka står på ' + hm[0] + '.', 'Checkpoint ' + LOP.cps[k - 1].name + ': leg ' + next + ' of ' + (LOP.cps.length + 1) + '. The clock is at ' + hm[1] + '.', 'nav');
  if (typeof cloudEv === 'function') cloudEv('lop_leg', {cls:r.cls, leg:next, min:Math.round(T.min)});
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
  // the finish line, after the last checkpoint
  if (r.legs.length === LOP.cps.length && lopCross(r.lp, here, Math.max(BOAT.vmax || 0, (VESSELS[r.type] || {}).vmax || 0) || 30)){ r.legs.push({t:S.t, pid:null}); L.legsN = (L.legsN || 0) + 1; r.lp = here; lopEnd('maal'); return; }
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
