// Kappløpet Lindesnes–Nordkapp, the core (KL1, steg 116a; docs/planer/kapplop.md, Jonas 12.11.2026): the class from the type's own fields
// (V4 A, no type names), the real week an attempt counts in over the changes to summer and winter time (V3 B), one clock with the
// penalties and the help taken off (V2 A), the least possible time the server checks against (KL3), the hop refused in the race and
// allowed before the start and after the finish (Jonas: «Nei i løpet»), and a leg from the registration to the finish line.
// The tasks on the way (KL1b, steg 116b, V5 B): one fixed task and one surprise per leg, the surprise the same for the class that week,
// the station swapped for the echo line on a type without the jig, the light's alternative, the measuring board's ±30 minutes, the
// surprise left undone, a checkpoint that waits for its task, and no pay and no place on the board.
export default function (t){
  const K = t.K, {VESSELS, LOP, lopCls, lopWeek, lopTime, lopMinH, lopCross, lopCpOf, hopWhy, newState} = K;
  // 1. the class from vmax and cls, for every type in VESSELS
  const want = V => V.cls === 'hav' ? 'hav' : V.vmax < 9 ? 'sakte' : V.vmax < 14 ? 'middels' : 'rask';
  for (const k in VESSELS) t.eq(lopCls(VESSELS[k]), want(VESSELS[k]), k + ' (' + VESSELS[k].vmax + ' kn, ' + VESSELS[k].cls + '): ' + want(VESSELS[k]));
  t.eq(lopCls({vmax:8.99, cls:'open'}), 'sakte', '8,99 kn: sakte'); t.eq(lopCls({vmax:9, cls:'open'}), 'middels', '9 kn: middels');
  t.eq(lopCls({vmax:14, cls:'kyst'}), 'rask', '14 kn: rask'); t.eq(lopCls({vmax:25, cls:'hav'}), 'hav', 'et havfartøy er havfartøy uansett farten');
  t.ok(['sakte', 'middels', 'rask', 'hav'].every(c => Object.values(VESSELS).some(V => lopCls(V) === c)), 'hver klasse har minst én båttype');

  // 2. the real week, Monday 00:00 Norwegian time (CET +1, CEST +2 from the last Sunday of March to the last Sunday of October, 01:00 UTC)
  const U = (y, m, d, h, mi = 0) => Date.UTC(y, m - 1, d, h, mi);
  t.eq(lopWeek(U(2026, 11, 16, 12)).id, '2026-W47', 'mandag 16.11.2026: uke 47');
  t.eq(lopWeek(U(2026, 11, 15, 22, 59)).id, '2026-W46', 'søndag 15.11.2026 23:59 norsk tid (22:59 UTC): uke 46');
  t.eq(lopWeek(U(2026, 11, 15, 23, 0)).id, '2026-W47', 'mandag 16.11.2026 00:00 norsk tid (23:00 UTC søndag): uke 47');
  t.eq(lopWeek(U(2026, 11, 16, 12)).t0, U(2026, 11, 15, 23), 'uke 47 begynner 15.11.2026 23:00 UTC');
  // summer: Monday 00:00 is 22:00 UTC on Sunday
  t.eq(lopWeek(U(2026, 6, 14, 21, 59)).id, '2026-W24', 'søndag 14.6.2026 23:59 sommertid (21:59 UTC): uke 24');
  t.eq(lopWeek(U(2026, 6, 14, 22, 0)).id, '2026-W25', 'mandag 15.6.2026 00:00 sommertid (22:00 UTC søndag): uke 25');
  // the change to summer time 29.3.2026 (01:00 UTC): the week before ends Sunday 22:00 UTC by summer time
  t.eq(lopWeek(U(2026, 3, 29, 21, 59)).id, '2026-W13', 'søndag 29.3.2026, sommertid fra 01:00 UTC samme dag, 23:59 norsk tid: uke 13');
  t.eq(lopWeek(U(2026, 3, 29, 22, 0)).id, '2026-W14', 'mandag 30.3.2026 00:00 norsk tid: uke 14');
  const w13 = lopWeek(U(2026, 3, 25, 12)); t.eq((w13.t1 - w13.t0) / 3600000, 167, 'uka med skiftet til sommertid er 167 timer');
  // the change to winter time 25.10.2026 (01:00 UTC)
  t.eq(lopWeek(U(2026, 10, 25, 22, 59)).id, '2026-W43', 'søndag 25.10.2026 23:59 vintertid (22:59 UTC): uke 43');
  t.eq(lopWeek(U(2026, 10, 25, 23, 0)).id, '2026-W44', 'mandag 26.10.2026 00:00 vintertid: uke 44');
  const w43 = lopWeek(U(2026, 10, 21, 12)); t.eq((w43.t1 - w43.t0) / 3600000, 169, 'uka med skiftet til vintertid er 169 timer');
  // the ISO week over the new year: 31.12.2026 is a Thursday (week 53), 4.1.2027 a Monday (week 1)
  t.eq(lopWeek(U(2026, 12, 31, 12)).id, '2026-W53', '31.12.2026: uke 53 i 2026');
  t.eq(lopWeek(U(2027, 1, 3, 12)).id, '2026-W53', 'søndag 3.1.2027: fortsatt uke 53 i 2026');
  t.eq(lopWeek(U(2027, 1, 4, 12)).id, '2027-W01', 'mandag 4.1.2027: uke 1 i 2027');

  // 3. one clock (V2 A): from casting off, also in harbour; penalties added, the help taken off; the split at each checkpoint
  const run = {t0:1000, t1:null, legs:[{t:1300, pid:'a'}, {t:2000, pid:'b'}], pen:[{t:1100, k:'fart', min:15}, {t:1900, k:'vik', min:15}], ded:[{t0:1500, t1:1600, k:'m', min:130}]};
  const T = lopTime(run, 2500);
  t.eq(T.raw, 1500, 'klokka går fra start til nå, også i havn (1 500 spillminutter)');
  t.eq(T.pen, 30, 'to tillegg på 15 minutter'); t.eq(T.ded, 130, 'hjelpen til sjøs trukket fra (100 min og veien tilbake, 30)');
  t.eq(T.min, 1500 + 30 - 130, 'tida med tillegg og fradrag');
  t.eq(T.splits, [300 + 15, 1000 + 30 - 130], 'mellomtidene ved sjekkpunktene, med det som var lagt til og trukket fra da');
  t.eq(lopTime(run, 1550).ded, 0, 'hjelpen trekkes fra når den er over, ikke før');
  t.eq(lopTime({t0:0, t1:500, legs:[], pen:[], ded:[]}, 9999).min, 500, 'et fullført forsøk har tida ved mål, uansett når det leses');
  t.eq(lopTime({t0:null}).min, 0, 'påmeldt, men ikke kastet loss: klokka står på null');

  // 4. the least possible time: the shortest way at the type's top speed with trim, less 10 %
  t.near(lopMinH(200, 10, 1), 18, 1e-9, '200 nm på 10 kn uten trim: 18 spilltimer (20 og 10 % margin)');
  t.near(lopMinH(200, 10, 2), 9, 1e-9, 'med turbo (×2): 9 spilltimer');
  t.eq(lopMinH(200, 0, 1), 0, 'uten fart: 0');

  // 5. the finish line: the meridian of the cape, from the cliff and north, crossed either way; not south of the cliff (Magerøysundet)
  const G = LOP.goal.p;
  t.ok(lopCross({x:G.x - 0.2, y:G.y - 3}, {x:G.x + 0.2, y:G.y - 3}), 'over linja 3 km nord for platået, østover');
  t.ok(lopCross({x:G.x + 0.2, y:G.y - 10}, {x:G.x - 0.2, y:G.y - 10}), 'vestover teller også');
  t.ok(!lopCross({x:G.x - 0.2, y:G.y + 16}, {x:G.x + 0.2, y:G.y + 16}), 'sør for Magerøya (Magerøysundet): ikke over linja');
  t.ok(!lopCross({x:G.x - 0.4, y:G.y - 3}, {x:G.x - 0.2, y:G.y - 3}), 'vest for linja: ikke over');
  t.ok(!lopCross({x:G.x - 0.2, y:G.y - 60}, {x:G.x + 0.2, y:G.y - 60}), '60 km nord: utenfor linja');
  t.ok(lopCross({x:G.x - 0.2, y:G.y - 3}, {x:G.x + 0.2, y:G.y - 3}, 10), 'seilt over linja på 10 kn: teller');
  t.ok(!lopCross({x:G.x - 2, y:G.y - 3}, {x:G.x + 2, y:G.y - 3}, 10), 'flyttet 4 km på ett minutt («Sitter båten fast?»): et hopp, teller ikke');

  // the help at sea (sjøloven § 135 third paragraph): the time it took, less the way made towards the next checkpoint at top speed
  { const {lopSosEnd} = K, S0 = newState(); K.set('S', S0);
    const A = LOP.start.p, B = LOP.cps[0].p, kmT = K.kmTrue(A, B), along = nm => ({x:A.x + (B.x - A.x) * nm * K.NM / kmT, y:A.y + (B.y - A.y) * nm * K.NM / kmT});
    const r = () => ({vid:'en-annen', type:'sjark', legs:[], ded:[], sos:{id:'m1', t:100, p:{x:A.x, y:A.y}}});   // the havsjark (10 kn, 8,5 marsj), not the boat bound
    const r1 = r(); lopSosEnd(r1, 220, {x:A.x, y:A.y}); t.eq(r1.ded.map(x => x.min), [120], 'to timer med hjelp, tilbake der hun svarte: 120 min trukket fra');
    const r2 = r(); lopSosEnd(r2, 160, along(10)); t.eq(r2.ded.length, 0, 'svarte og seilte videre 10 nm på en time: ingenting trukket fra (anropet gir ingen gratis tid)');
    const r3 = r(); lopSosEnd(r3, 220, along(-5)); t.near(r3.ded[0].min, 150, 1, 'to timer og 5 nm bakover: 120 og veien tilbake (30 min på 10 kn)');
    t.ok(!r1.sos && !r3.sos, 'hjelpen er avsluttet'); }

  // 6. the hop (Jonas 12.11.2026: «Nei i løpet»), and the registration, a leg and the finish in the state
  const S = newState(); K.set('S', S); S.cur = S.cur || 'v1'; S.fleet = [{id:S.cur}];
  const w = o => Object.assign({x:0, y:0, port:null, fish:0}, o);
  const sailing = () => { S.boat.status = 'sailing'; S.boat.port = null; S.plan = {idx:0, wps:[w({x:1, y:1}), w({x:2, y:2, port:'p1'})], speed:8}; };
  sailing(); t.eq(hopWhy(), null, 'til startstreken (ikke påmeldt): hoppet er lov');
  S.lop = {run:{id:'lnk-1', vid:S.cur, type:S.boat.type, cls:'sakte', reg:0, t0:null, legs:[], pen:[], ded:[], st:'reg'}, hist:[], best:{}, legsN:0, seq:1};
  sailing(); t.eq((hopWhy() || [''])[0], 'Ikke i kappløpet.', 'påmeldt: hoppet er nektet');
  S.lop.run.st = 'run'; S.lop.run.t0 = 0; sailing(); t.eq((hopWhy() || [''])[0], 'Ikke i kappløpet.', 'i løpet: hoppet er nektet');
  S.lop.run.vid = 'en-annen'; sailing(); t.eq(hopWhy(), null, 'en annen båt i flåten er med i løpet: denne kan hoppe');
  S.lop.run = null; sailing(); t.eq(hopWhy(), null, 'etter mål (ingen løp): hoppet hjem er lov');
  // the race boat sold (no longer in the fleet): the attempt is broken, and the legs sailed are kept on the count
  { const {lopTick, lopMinute} = K; S.lop = {run:{id:'lnk-2', vid:'solgt', type:'sjark', cls:'middels', reg:0, t0:10, legs:[{t:50, pid:'x'}], pen:[], ded:[], st:'run'}, hist:[], best:{}, legsN:1, seq:2};
    S.t = 100; lopTick(); const h = S.lop.hist[0] || {};
    t.ok(!S.lop.run && h.st === 'dnf' && h.how === 'salg' && h.legs === 1 && S.lop.legsN === 1, 'båten solgt i løpet: forsøket er brutt, etappen teller', h);
    t.eq(Object.keys(S.lop.best).length, 0, 'et brutt forsøk gir ingen beste tid');
    // a boat bought since under the same vessel id: not the race boat (she carries the attempt's id, b.lop)
    S.lop.run = {id:'lnk-3', vid:S.cur, type:S.boat.type, cls:'x', reg:0, t0:10, legs:[], pen:[], ded:[], st:'run'}; S.boat.lop = 'lnk-1'; S.fleet = [{id:S.cur}];
    lopTick(); t.ok(!S.lop.run && S.lop.hist[0].how === 'salg', 'en annen båt under samme id: forsøket er brutt');
    // the same boat, another type (traded at the yard)
    S.lop.run = {id:'lnk-4', vid:S.cur, type:'en-annen-type', cls:'x', reg:0, t0:10, legs:[], pen:[], ded:[], st:'run'}; S.boat.lop = 'lnk-4'; S.boat.status = 'sailing';
    lopTick(); t.ok(!S.lop.run && S.lop.hist[0].how === 'bytte', 'en annen type på samme båt: forsøket er brutt');
    // the penalties, each once: a passing over a limit and a near miss where she had to give way, not one where the other did
    S.lop.run = {id:'lnk-6', vid:S.cur, type:S.boat.type, cls:'x', reg:0, t0:10, legs:[], pen:[], ded:[], st:'run', lp:null}; S.boat.lop = 'lnk-6'; S.boat.status = 'sailing';
    S.farv = [{t:5, vid:S.cur, k:'fart'}, {t:20, vid:S.cur, k:'fart'}, {t:21, vid:S.cur, k:'merke'}, {t:22, vid:'v9', k:'fart'}];
    S.nearMiss = [{t:23, vid:S.cur, give:'a'}, {t:24, vid:S.cur, give:'b'}, {t:25, vid:S.cur, give:'both'}];
    lopTick(); lopTick(); t.eq(S.lop.run.pen.map(x => x.k + x.min), ['fart15', 'vik15', 'vik15'], 'tilleggene: fartsgrensa etter start og to med vikeplikt, hver én gang (ikke før start, ikke merket, ikke en annen båt, ikke når den andre hadde vikeplikten)');
    S.lop.run = null;
    // registered, then gone from the quay without casting off: the registration is struck, nothing kept
    const n = S.lop.hist.length; S.lop.run = {id:'lnk-5', vid:S.cur, type:S.boat.type, cls:'x', reg:0, t0:null, legs:[], pen:[], ded:[], st:'reg'}; S.boat.lop = 'lnk-5'; S.boat.status = 'idle';
    lopTick(); t.ok(!S.lop.run && S.lop.hist.length === n, 'påmeldt og borte fra kaia uten å kaste loss: påmeldingen er strøket, ingenting i historikken'); }

  // the course: the start and each checkpoint has a port of its own in the game (a block of the map not in is an error, so only the
  // places are checked here: the start and the checkpoints lie in order from south to north, the finish north of them all)
  const ys = [LOP.start.p.y].concat(LOP.cps.map(c => c.p.y), [LOP.goal.p.y]);
  t.ok(ys.every((y, i) => !i || y < ys[i - 1]), 'start, sjekkpunktene og målet ligger fra sør mot nord');
  t.ok(typeof lopCpOf === 'function', 'lopCpOf finnes');

  // 7. the tasks on the way (KL1b): one fixed task and a list for the surprise per leg, at places and lights that exist
  { const {lopSurp, lopKind, lopLys, lopTaskEnd, lopFixDone, lopLegClose, FYR, TUR_LYS, EPOCH} = K;
    t.eq(LOP.legs.length, LOP.cps.length + 1, 'én rad oppgaver for hver av de seks etappene');
    const kinds = ['foto', 'prove', 'ekko', 'slep', 'frakt'], fyrOk = x => x.k !== 'foto' || FYR.some(f => f[3] === x.fyr), lysOk = x => !x.lys || !!TUR_LYS[x.lys], pOk = x => !['prove', 'ekko', 'slep'].includes(x.k) || (x.p && isFinite(x.p.x) && isFinite(x.p.y));
    LOP.legs.forEach((L, j) => { t.ok(L.fix && kinds.includes(L.fix.k) && fyrOk(L.fix) && lysOk(L.fix) && pOk(L.fix), 'etappe ' + (j + 1) + ': én fast oppgave (' + (L.fix && L.fix.k) + ')');
      t.ok(L.surp.length >= 2 && L.surp.every(x => kinds.includes(x.k) && x.k !== 'frakt' && fyrOk(x) && lysOk(x) && pOk(x)), 'etappe ' + (j + 1) + ': overraskelsen trekkes blant ' + L.surp.length + ' (' + L.surp.map(x => x.k).join(', ') + ')');
      t.ok(L.nm > 100, 'etappe ' + (j + 1) + ': lengden fra KL1a (' + L.nm + ' nm)'); });
    t.ok(LOP.legs[0].fix.k !== 'frakt', 'etappe 1 har ingen frakt (lasting før start ville gått utenfor klokka)');
    // the surprise: the same for two attempts in the class that week, drawn again another week
    for (let j = 0; j < 6; j++) t.eq(lopSurp(j, 'middels', '2026-W47'), lopSurp(j, 'middels', '2026-W47'), 'etappe ' + (j + 1) + ': samme overraskelse for to forsøk i samme klasse og uke');
    const wks = Array.from({length:12}, (_, i) => '2026-W' + String(40 + i).padStart(2, '0')), seen = new Set(wks.map(w => lopSurp(0, 'middels', w)));
    t.ok(seen.size > 1 && [...seen].every(i => i >= 0 && i < LOP.legs[0].surp.length), 'etappe 1 over tolv uker: ' + seen.size + ' ulike overraskelser, alle i lista');
    const other = wks.find(w => lopSurp(0, 'middels', w) !== lopSurp(0, 'middels', '2026-W47'));
    t.ok(!!other, 'en annen uke gir en annen overraskelse (' + other + ')');
    t.ok(LOP.legs.some((L, j) => ['sakte', 'rask', 'hav'].some(c => lopSurp(j, c, '2026-W47') !== lopSurp(j, 'middels', '2026-W47'))), 'klassene trekker hver for seg samme uke');
    // the station needs the jig: a type without it in rigs (the ocean vessels) gets the echo line at the same place
    const st = LOP.legs.map(L => L.fix).find(x => x.k === 'prove');
    t.ok(!!st, 'én etappe har prøvestasjonen som fast oppgave');
    for (const k in VESSELS){ const V = VESSELS[k], jig = (V.rigs || []).includes('juksa'), got = lopKind(st, V);
      t.eq(got.k, jig ? 'prove' : 'ekko', k + (lopCls(V) === 'hav' ? ' (havfartøy)' : '') + ': ' + (jig ? 'prøvestasjonen' : 'ekkoloddlinja, rigs uten juksa'));
      if (lopCls(V) === 'hav') t.ok(!jig, k + ': havfartøyet har ikke juksa og får ekkoloddlinja'); }
    t.ok(lopKind(st, VESSELS.sjark) === st || lopKind(st, VESSELS.sjark).p === st.p, 'stedet er det samme');
    // the light's alternative: «mens fyret lyser» at Fruholmen (71° N) in the midnight sun does not come, and the picture is ordinary
    const fr = FYR.find(f => f[3] === 'Fruholmen'), mk = () => ({k:'foto', fyr:{x:fr[0], y:fr[1], name:fr[3]}, lys:'natt'}), Hof = ms => (ms - EPOCH) / 3600000;
    const mJun = mk(), okJun = lopLys(mJun, Hof(Date.UTC(2027, 5, 21, 12)), 181 / 10 * 2.5);
    t.ok(!okJun && mJun.lys === null && mJun.lysAlt === 'natt', 'Fruholmen 21. juni: midnattssol, lyset kommer ikke innen etappens tid (45 t): et vanlig fyrbilde', mJun);
    const mDec = mk(), okDec = lopLys(mDec, Hof(Date.UTC(2027, 11, 15, 12)), 181 / 10 * 2.5);
    t.ok(okDec && mDec.lys === 'natt', 'Fruholmen 15. desember: fyret lyser innen etappens tid, oppgaven står', mDec);
    const mNo = {k:'foto', fyr:{x:fr[0], y:fr[1]}, lys:null}; t.ok(lopLys(mNo, 0, 10) && mNo.lys === null && !mNo.lysAlt, 'et bilde uten bestemt lys er urørt');
    // the end of a task: the measuring board ±30 minutes by how close it was read, a failed task task.miss, once
    const S7 = newState(); K.set('S', S7); S7.cur = 'v1';
    const run = {id:'lnk-9', vid:'v1', type:'sjark', cls:'middels', t0:0, legs:[], pen:[], ded:[], st:'run', tasks:[]};
    S7.lop = {run, hist:[], best:{}, legsN:0, seq:9}; S7.boat.status = 'sailing';
    const task = o => Object.assign({lop:'lnk-9', vid:'v1', st:'go', t0:0, leg:2, role:'fix'}, o);
    const a1 = task({k:'prove', kind:'stasjon', p:{x:500, y:900}, err:0.4}); run.tasks.push(a1); lopTaskEnd(a1, true); t.eq(a1.adj, -LOP.task.meas, 'målebrettet innen en halv centimeter: 30 minutter trukket fra');
    const a2 = task({k:'prove', kind:'stasjon', p:{x:500, y:900}, err:3.2}); run.tasks.push(a2); lopTaskEnd(a2, true); t.eq(a2.adj, LOP.task.meas, 'målebrettet 3 cm feil i snitt: 30 minutter lagt til');
    const a3 = task({k:'prove', kind:'stasjon', p:{x:500, y:900}, err:1.75}); run.tasks.push(a3); lopTaskEnd(a3, true); t.eq(a3.adj, 0, 'midt imellom (1,75 cm): verken eller');
    const a4 = task({k:'slep', boat:'Måsen', to:null, p:{x:500, y:900}}); run.tasks.push(a4); lopTaskEnd(a4, false, 'ashore'); t.eq([a4.st, a4.adj], ['fail', LOP.task.miss], 'båten drev på land før hun kom: oppgaven gikk ikke, 60 minutter lagt til');
    lopTaskEnd(a4, true); t.eq(a4.st, 'fail', 'en oppgave som er over, endres ikke');
    t.eq(run.pen.map(x => x.min), [-30, 30, 60], 'tilleggene og fradraget står på klokka (lopTime)');
    t.eq(lopTime(run, 100).pen, 60, 'lopTime summerer dem');
    // a checkpoint waits for its fixed task; the surprise left undone adds 60 minutes when the leg is over
    run.tasks = [task({k:'foto', leg:0, role:'fix', fyr:{x:0, y:0, name:'Marstein'}}), task({k:'foto', leg:0, role:'surp', fyr:{x:0, y:0, name:'Lista'}})]; run.pen = [];
    t.ok(!lopFixDone(run, 0), 'den faste oppgaven er ikke gjort: sjekkpunktet teller ikke');
    run.tasks[0].st = 'done'; t.ok(lopFixDone(run, 0), 'den faste oppgaven er gjort: sjekkpunktet teller');
    lopLegClose(run, 0); t.eq([run.tasks[1].st, run.pen.map(x => x.min)], ['miss', [60]], 'overraskelsen ble ikke gjort: 60 minutter lagt til når etappen er over');
    lopLegClose(run, 0); t.eq(run.pen.length, 1, 'bare én gang');
    // no pay, no record on the board, no place: turPayOut and turEnd hand a task to lopTaskEnd
    const {turPayOut, turEnd, turState} = K, T7 = turState(), cash0 = S7.cash, led0 = (S7.ledger || []).length;
    const a5 = task({k:'foto', leg:1, role:'surp', fyr:{x:0, y:0, name:'Kråkenes'}, pay:0}); run.tasks.push(a5);
    turPayOut(a5, 'Kystposten', 'Takk for bildet.', 'Thank you for the picture.');
    t.ok(a5.st === 'done' && S7.cash === cash0 && (S7.ledger || []).length === led0 && !T7.done.length && !T7.act.length && T7.slots === K.TUR.boardMax, 'fyrbildet i løpet: gjort, ingen betaling, ingenting i tavlas historikk, ingen plass brukt', {st:a5.st, done:T7.done.length, slots:T7.slots, cash:S7.cash - cash0});
    const a6 = task({k:'slep', leg:1, role:'surp', boat:'Terna', p:{x:0, y:0}}); run.tasks.push(a6); turEnd(a6, false, null, 'ashore');
    t.ok(a6.st === 'fail' && !T7.done.length, 'slepet i løpet som gikk galt: til løpet, ikke til tavla'); 
    // the finish line does not count before the last leg's task is done
    { const {lopMinute} = K, G = LOP.goal.p; S7.fleet = [{id:'v1'}]; S7.boat.type = 'sjark'; S7.boat.lop = 'lnk-9'; S7.boat.status = 'sailing';
      run.legs = LOP.cps.map(c => ({t:1, pid:c.port})); run.pen = []; run.st = 'run'; run.lp = {x:G.x - 0.1, y:G.y - 3}; S7.lop.run = run;
      run.tasks = [task({k:'foto', leg:5, role:'fix', fyr:{x:0, y:0, name:'Fruholmen'}})];
      S7.boat.pos = {x:G.x + 0.1, y:G.y - 3}; lopMinute();
      t.ok(S7.lop.run === run && run.legs.length === LOP.cps.length && run.goalW === 1, 'over mållinja før bildet av Fruholmen: teller ikke');
      run.tasks[0].st = 'done'; run.lp = {x:G.x - 0.1, y:G.y - 3}; lopMinute();
      t.ok(!S7.lop.run && S7.lop.hist[0].st === 'done' && S7.lop.hist[0].legs === LOP.cps.length + 1, 'med bildet tatt: over mållinja, fullført', S7.lop.hist[0]); } }

  // 8. after the independent check (13.11.2026): the measuring board for a race task (its id is text) draws ten fish, not one length ten
  // times; a light that will not come before the leg's time is out is dropped while she sails; the surprise is shown only when the leg
  // begins, and is the same for two attempts in the class that week
  { const {turProveFish, lopMinute, lopDepart, lopSurp, FYR} = K, S8 = newState(); K.set('S', S8);
    const f1 = turProveFish({id:'lnk-1:2f', got:{torsk:40, hyse:20}}), f2 = turProveFish({id:'lnk-2:2f', got:{torsk:40, hyse:20}});
    t.ok(new Set(f1.map(f => f.cm)).size > 3, 'målebrettet i løpet: ti fisk med ulike lengder (' + f1.map(f => f.cm).join(', ') + ')');
    t.ok(f1.map(f => f.cm).join() !== f2.map(f => f.cm).join(), 'to forsøk får hver sine fisk');
    t.eq(turProveFish({id:7, got:{torsk:40}}).map(f => f.cm).join(), turProveFish({id:7, got:{torsk:40}}).map(f => f.cm).join(), 'tavlas stasjon (tall-id) som før: de samme fiskene hver gang');
    // the light: «mens fyret lyser» at Skjervøy, the leg's time over: an ordinary picture, read on the hour
    S8.cur = 'v1'; S8.fleet = [{id:'v1'}]; S8.boat.type = 'sjark'; S8.boat.status = 'sailing'; S8.boat.lop = 'lnk-8'; S8.boat.pos = {x:900, y:300};
    const sk = FYR.find(f => f[3] === 'Skjervøya'), mf = {id:'lnk-8:5f', lop:'lnk-8', vid:'v1', st:'go', leg:5, role:'fix', k:'foto', fyr:{x:sk[0], y:sk[1], name:sk[3]}, lys:'natt', due:120, t0:0};
    S8.lop = {run:{id:'lnk-8', vid:'v1', type:'sjark', cls:'middels', t0:0, legs:LOP.cps.map(c => ({t:1, pid:c.port})), pen:[], ded:[], st:'run', tasks:[mf], lp:{x:900, y:300}}, hist:[], best:{}, legsN:0, seq:8};
    S8.t = 150; lopMinute(); t.eq(mf.lys, 'natt', 'ikke på timen: lyset står');
    S8.t = 180; lopMinute(); t.ok(mf.lys === null && mf.lysAlt === 'natt', 'etappens tid er ute og lyset er ikke kommet: et vanlig bilde av fyret holder', mf);
    // the surprise is shown when the leg begins (cast off in Lindesnes), not at the registration, and the same for two attempts
    const start = K.PORTS.find(q => K.lopCpOf(q.id) === 0);
    t.ok(!!start, 'en havn i Lindesnes (' + (start && start.id) + ')');
    const surp = id => { S8.boat.status = 'port'; S8.boat.port = start.id; S8.boat.pos = {x:start.p.x, y:start.p.y}; S8.boat.lop = id; S8.t = 1000;
      const r = {id, vid:'v1', type:'sjark', cls:'middels', reg:S8.t, t0:null, t1:null, legs:[], pen:[], ded:[], sos:null, lp:null, st:'reg', tasks:[], surp:[]};
      S8.lop = {run:r, hist:[], best:{}, legsN:0, seq:0}; const before = r.surp.slice(); lopDepart(); return {before, after:r.surp.slice(), st:r.st}; };
    const A = surp('lnk-20'), B = surp('lnk-21');
    t.ok(A.before.length === 0 && A.st === 'run' && A.after.length === 1, 'påmeldt: ingen overraskelse vist; kastet loss: etappe 1s vises, ikke de andre', A);
    t.eq(A.after[0], B.after[0], 'to forsøk i samme klasse og uke får samme overraskelse på etappe 1');
    t.eq(A.after[0], lopSurp(0, 'middels', K.lopWeek(K.lopMs(1000)).id), 'den som trekkes for uka forsøket startet i'); }

  // 9. after the review (13.11.2026): a surprise under way when the leg ends (the boat on the line) goes on, and is struck only at the
  // next leg's end if still not done; the race's freight never larger than the room it is made for
  { const {lopLegClose} = K, r = {id:'lnk-30', pen:[], tasks:[{leg:0, role:'surp', st:'go', k:'slep', stage:'tow', boat:'Terna', p:{x:0, y:0}}, {leg:0, role:'surp', st:'go', k:'foto', fyr:{x:0, y:0, name:'Lista'}}]};
    lopLegClose(r, 0); t.eq([r.tasks[0].st, r.tasks[0].carry, r.tasks[1].st, r.pen.length], ['go', 1, 'miss', 1], 'etappen over med båten på slep: slepet går videre, bildet som ikke ble tatt, gir 60 minutter');
    lopLegClose(r, 0); t.eq(r.pen.length, 1, 'samme etappe lukket igjen: ingenting nytt');
    lopLegClose(r, 1); t.eq([r.tasks[0].st, r.pen.length], ['miss', 2], 'slepet ikke levert innen neste etappe er over: 60 minutter');
    const r2 = {id:'lnk-31', pen:[], tasks:[{leg:0, role:'surp', st:'go', k:'slep', stage:'tow'}]}; lopLegClose(r2, 0); r2.tasks[0].st = 'done';
    lopLegClose(r2, 1); t.eq(r2.pen.length, 0, 'slepet levert på neste etappe: ingen tillegg'); }

  // 10. KL3 (steg 118): what the server gets. The highest top speed of each type without trim is at least what the boat reaches with
  // the yard's last propeller and engine step and the fastest engine her gear takes (applyVessel), so the server never flags an honest
  // boat for the speed; the track has one point a game hour; a leg as lop_leg takes it; a finished attempt waits in out for the cloud
  { const {lopVcap, applyVessel, BOAT, EQUIP, equipFits, PROPUP, ENGUP, lopLegPut, lopMinute, lopEnd} = K, S9 = newState(); K.set('S', S9);
    const over = [];
    for (const k in VESSELS){ S9.boat.type = k; S9.boat.propLv = PROPUP.length; S9.boat.engLv = ENGUP.length; delete S9.boat.trim;
      S9.equip = Object.fromEntries(Object.keys(EQUIP).filter(e => EQUIP[e].boost && equipFits(e, k)).map(e => [e, 1]));
      applyVessel(); if (!(BOAT.vmax <= lopVcap(k) + 1e-9 && BOAT.vmax >= lopVcap(k) - 0.1)) over.push(k + ' ' + BOAT.vmax + '/' + lopVcap(k)); }
    t.eq(over, [], 'lopVcap er toppfarten med verftets siste propell- og motortrinn og den raskeste motoren utstyret tar, rundet opp til en tidel, for hver type');
    t.eq(lopVcap('skiff'), 30, 'aluminiumsbåten med 90-hesteren: 30 knop'); t.eq(lopVcap('ukjent'), 0, 'en ukjent type: 0');
    S9.boat.type = 'sjark'; S9.boat.propLv = 0; S9.boat.engLv = 0; S9.equip = {}; applyVessel(); S9.cur = S9.cur || 'v1'; S9.fleet = [{id:S9.cur}];
    const run = {id:'lnk-40', vid:S9.cur, type:'sjark', cls:'middels', t0:30, legs:[], pen:[], ded:[], st:'run', tasks:[], trk:[[30, 1, 1]], tr:0};
    S9.lop = {run, hist:[], best:{}, legsN:0, seq:40}; S9.boat.lop = 'lnk-40'; S9.boat.status = 'sailing'; S9.boat.pos = {x:5, y:6};
    for (const m of [59, 60, 61, 119, 120, 120]){ S9.t = m; lopMinute(); }
    t.eq(run.trk, [[30, 1, 1], [60, 5, 6], [120, 5, 6]], 'sporet: punktet ved avgangen og ett hver hele spilltime, aldri to på samme minutt');
    S9.boat.trim = {k:'turbo', until:1e9}; S9.t = 121; lopMinute(); t.eq(run.tr, 1, 'trim på i etappen: merket for admin');
    run.legs = [{t:130, pid:'a', p:[5, 6], tr:1}];
    run.pen = [{t:40, k:'fart', min:15}, {t:200, k:'vik', min:15}]; run.ded = [{t0:50, t1:100, k:'m', min:20}];
    run.tasks = [{leg:0, role:'fix', k:'foto', st:'done', adj:0}, {leg:0, role:'surp', k:'slep', st:'miss', adj:60}, {leg:1, role:'fix', k:'frakt', st:'go'}];
    const p0 = lopLegPut(run, 0);
    t.eq([p0.rid, p0.leg, p0.t0, p0.t1, p0.p, p0.pts, p0.d], ['lnk-40-30', 0, 30, 130, [5, 6], [[30, 1, 1], [60, 5, 6], [120, 5, 6]],
      {tr:1, pen:15, ded:20, opp:[['fix', 'foto', 'done', 0], ['surp', 'slep', 'miss', 60]]}], 'etappe 1 som serveren tar den: tidene, stedet, sporet fra avgangen, trim, tillegg, fradrag og oppgavene');
    run.trk.push([180, 7, 8]); run.legs.push({t:200, pid:null, p:[9, 9], tr:0});
    const p1 = lopLegPut(run, 1); t.eq([p1.t0, p1.t1, p1.pts, p1.d.pen], [130, 200, [[180, 7, 8]], 15], 'etappe 2: fra sjekkpunktet, punktene etter det');
    t.eq(lopLegPut(run, 2), null, 'en etappe som ikke er over: ingenting');
    // (after the independent check, 13.11.2026) a leg over 400 game hours (days in harbour) is thinned to at most 400 points, the first
    // and the last kept; the id in the cloud carries the minute she cast off, so a save taken back never repeats one
    const long = {id:'lnk-1', t0:0, legs:[{t:60 * 1000, p:[1, 1]}], trk:[[0, 0, 0]].concat(Array.from({length:1000}, (_, i) => [(i + 1) * 60, 0, 0])), pen:[], ded:[], tasks:[]};
    const pl = lopLegPut(long, 0).pts; t.ok(pl.length <= 400 && pl[0][0] === 0 && pl[pl.length - 1][0] === 60000 && pl.every((q, i) => !i || q[0] > pl[i - 1][0]), 'tusen spilltimer i én etappe: høyst 400 punkter, det første og det siste med', pl.length);
    t.ok(K.lopRid({id:'lnk-1', t0:30}) !== K.lopRid({id:'lnk-1', t0:9000}), 'samme id i en lagring tatt tilbake, en annen avgang: en annen id i skyen');
    run.cs = {s:1, n:1, e:0}; S9.t = 200; const e = lopEnd('maal'), o = S9.lop.out || [];
    t.ok(e && o.length === 1 && o[0].id === 'lnk-40' && o[0].vid === S9.cur && run.min === e.min && o[0].trk.length === 4 && o[0].legs.length === 2 && o[0].st === 'done' && o[0].cs.n === 1 && o[0].min === e.min,
      'over mål: forsøket med etappene, sporet og hvor langt skyen har det, venter i out', o[0]);
    for (let i = 0; i < 4; i++){ S9.lop.run = {id:'lnk-5' + i, vid:S9.cur, type:'sjark', cls:'middels', t0:0, legs:[], pen:[], ded:[], st:'run', tasks:[], trk:[[0, 1, 1]]}; lopEnd('avbrutt'); }
    t.eq(S9.lop.out.map(x => x.id), ['lnk-51', 'lnk-52', 'lnk-53'], 'out holder de tre siste');
    S9.lop.run = {id:'lnk-60', vid:S9.cur, type:'sjark', cls:'middels', t0:0, legs:[], pen:[], ded:[], st:'run', tasks:[]}; lopEnd('avbrutt');
    t.eq(S9.lop.out.map(x => x.id).includes('lnk-60'), false, 'et forsøk uten spor (startet før KL3) går ikke til skyen'); }
}

