// Kappløpet Lindesnes–Nordkapp, the core (KL1, steg 116a; docs/planer/kapplop.md, Jonas 12.11.2026): the class from the type's own fields
// (V4 A, no type names), the real week an attempt counts in over the changes to summer and winter time (V3 B), one clock with the
// penalties and the help taken off (V2 A), the least possible time the server checks against (KL3), the hop refused in the race and
// allowed before the start and after the finish (Jonas: «Nei i løpet»), and a leg from the registration to the finish line.
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
  // help still going on: the time from the answer so far
  const T2 = lopTime({t0:0, legs:[], pen:[], ded:[{t0:100, t1:null, min:300}]}, 160); t.eq(T2.ded, 60, 'hjelp som pågår: tida fra svaret til nå');
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
  { const {lopTick} = K; S.lop = {run:{id:'lnk-2', vid:'solgt', type:'sjark', cls:'middels', reg:0, t0:10, legs:[{t:50, pid:'x'}], pen:[], ded:[], st:'run'}, hist:[], best:{}, legsN:1, seq:2};
    S.t = 100; lopTick(); const h = S.lop.hist[0] || {};
    t.ok(!S.lop.run && h.st === 'dnf' && h.how === 'salg' && h.legs === 1 && S.lop.legsN === 1, 'båten solgt i løpet: forsøket er brutt, etappen teller', h);
    t.eq(Object.keys(S.lop.best).length, 0, 'et brutt forsøk gir ingen beste tid'); }

  // the course: the start and each checkpoint has a port of its own in the game (a block of the map not in is an error, so only the
  // places are checked here: the start and the checkpoints lie in order from south to north, the finish north of them all)
  const ys = [LOP.start.p.y].concat(LOP.cps.map(c => c.p.y), [LOP.goal.p.y]);
  t.ok(ys.every((y, i) => !i || y < ys[i - 1]), 'start, sjekkpunktene og målet ligger fra sør mot nord');
  t.ok(typeof lopCpOf === 'function', 'lopCpOf finnes');
}
