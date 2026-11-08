// Man overboard (Ø11.6, core/14b-sikkerhet.js; sjøloven § 475 and skipssikkerhetsloven § 47, read on Lovdata 07.11.2026): the chance
// against the weather (nothing in calm water, up with the sea against the boat's own limits, the dark, the icing, the gear and the open
// boat), the time in the water by the sea's temperature, how far off she is seen, the rescue that comes, who is on deck, and the whole
// event in the core: the fall, the lifebuoy, the MOB mark, the Williamson turn, the ladder, the sling and the rescue boat, the time
// past the limit, the rescue and the sick leave (V8 A: nobody dies), the report, the badge, and only near misses with the game closed.
export default function (t){
  const K = t.K; K.set('S', K.newState());
  const S = K.get('S'), MOBK = K.MOBK, MOBF = K.MOBF;

  // ---- the chance against the weather ----
  t.eq(K.mobSeaF(0), 0, 'stille sjø: ingen sjanse'); t.eq(K.mobSeaF(0.3), 0, 'under 30 % av den røde grensa: ingen sjanse');
  t.near(K.mobSeaF(1), 1, 1e-9, 'ved den røde grensa: hele grunnsjansen');
  t.ok(K.mobSeaF(0.5) < K.mobSeaF(0.8) && K.mobSeaF(0.8) < K.mobSeaF(1) && K.mobSeaF(1) < K.mobSeaF(1.4), 'sjansen øker med sjøen', [0.5, 0.8, 1, 1.4].map(K.mobSeaF));
  const rk = [1.5, 2.5, 12.5, 16];   // the open wooden boat's limits (snekke): waves 1.5 / 2.5 m, wind 12.5 / 16 m/s
  t.near(K.mobSeaX(5, 2.5, rk), 1, 1e-9, 'bølgene ved båtens røde grense gir 1'); t.near(K.mobSeaX(16, 0.5, rk), 1, 1e-9, 'vinden ved båtens røde grense gir 1');
  t.ok(K.mobSeaX(4, 0.4, rk) < MOBK.x0, 'en stille dag (4 m/s, 0,4 m) er under terskelen', K.mobSeaX(4, 0.4, rk));
  const base = {x:1, dark:false, ice:false, gop:false, open:false};
  t.eq(K.mobRate(1, Object.assign({}, base, {x:0.25})), 0, 'stille vær: null fall i timen, uansett hvor mange som er på dekk');
  t.near(K.mobRate(1, base), MOBK.R0, 1e-12, 'én på dekk ved den røde grensa om dagen: grunnsjansen ' + (1 / MOBK.R0) + ' timer per fall');
  t.near(K.mobRate(2, base), 2 * MOBK.R0, 1e-12, 'to på dekk: dobbelt så mye');
  t.near(K.mobRate(1, Object.assign({}, base, {dark:true})) / MOBK.R0, 1.5, 1e-9, 'mørket: 1,5 ganger');
  t.near(K.mobRate(1, Object.assign({}, base, {ice:true})) / MOBK.R0, 2, 1e-9, 'isingen: 2 ganger');
  t.near(K.mobRate(1, Object.assign({}, base, {gop:true})) / MOBK.R0, 1.3, 1e-9, 'setting og draging: 1,3 ganger');
  t.near(K.mobRate(1, Object.assign({}, base, {open:true})) / MOBK.R0, 1.5, 1e-9, 'åpen båt: 1,5 ganger');
  t.ok(K.mobIcing(-5, 12, 4) && !K.mobIcing(0, 12, 4) && !K.mobIcing(-5, 6, 4) && !K.mobIcing(-5, 12, 9), 'ising: under -2 °C i 9 m/s og mer over kald sjø');
  // the rate measured, a game choice (kap. 5.10): per 100 hours of one person's work on deck
  const per100 = o => +(K.mobRate(1, Object.assign({}, base, o)) * 100).toFixed(3);
  const tab = {stille:per100({x:0.25}), 'halv grense':per100({x:0.5}), 'rød grense':per100({}), 'rød, mørkt, haling':per100({dark:true, gop:true}), 'rød, mørkt, ising, åpen båt':per100({dark:true, ice:true, open:true}), 'over grensa (1,4)':per100({x:1.4})};
  t.ok(tab.stille === 0 && tab['rød grense'] === 0.25 && tab['rød, mørkt, haling'] < 0.5, 'fall per 100 timer på dekk for én person', tab);

  // ---- the time in the water ----
  t.eq([K.mobLimMin(0), K.mobLimMin(4.5), K.mobLimMin(10), K.mobLimMin(15.5)], [15, 30, 60, 120], 'tiden i vannet med vest: 15, 30, 60 og 120 minutter ved 0, 4,5, 10 og 15,5 °C');
  t.eq(K.mobLimMin(7.25), 45, 'mellom punktene trukket rett: 45 minutter ved 7,25 °C'); t.eq(K.mobLimMin(-5), 12, 'kaldere enn tabellen: det kaldeste');
  t.ok([-1, 2, 5, 8, 12, 16, 20].every((T, i, A) => i === 0 || K.mobLimMin(T) > K.mobLimMin(A[i - 1])), 'varmere sjø: lenger tid');
  t.eq([K.mobAbleMin(2), K.mobAbleMin(10), K.mobAbleMin(20)], [8, 20, 40], 'klarer å klatre leideren den første tredjedelen, minst 8 og høyst 40 minutter (1-10-1)');

  // ---- how far off she is seen ----
  t.near(K.mobSightKm({hs:0}), 0.4, 1e-9, 'om dagen i stille sjø: hodet og vesten 400 m unna');
  t.ok(K.mobSightKm({hs:2}) < 0.13, 'i to meter sjø: mye kortere', K.mobSightKm({hs:2}));
  t.near(K.mobSightKm({dark:true}), 0.04, 1e-9, 'om natta uten lyskaster: 40 m'); t.near(K.mobSightKm({dark:true, lamp:true}), 0.2, 1e-9, 'om natta med lyskaster: 200 m');
  t.near(K.mobSightKm({dark:true, buoy:true, light:true}), 1.8, 1e-9, 'om natta med lyset på livbøya: rundt en nautisk mil');
  t.near(K.mobSightKm({hs:2, buoy:true, smoke:true}), 2, 1e-9, 'om dagen med røyken fra MOB-lyset: 2 km'); t.near(K.mobSightKm({hs:0, vis:0.25}), 0.25, 1e-9, 'aldri lenger enn sikten');

  // ---- a boat at sea with two hands ----
  const b = S.boat; b.type = 'sjark'; K.applyVessel(); S.boatName = 'Havbris'; S.home = 'finnsnes';
  const pt = K.portById('finnsnes'); b.pos = {x:pt.p.x + 2, y:pt.p.y + 1}; b.status = 'sailing'; b.heading = 0; b.v = 8; S.t = 10 * 24 * 60 + 12 * 60;
  const C = [K.genCrew(), K.genCrew()]; C[0].name = 'Stian Nilsen'; C[0].sex = 'm'; C[1].name = 'Kari Berg'; C[1].sex = 'f'; S.crew = C; S.me = S.cur;
  MOBF.live = true; MOBF.fol = S.cur;
  // who is on deck: the minute's own call keeps them; the skipper and the wheelhouse are not exposed
  const P = [{c:null, st:'ror'}, {c:C[0], st:'haling'}, {c:C[1], st:'pause', idle:'inside'}]; K.mobDeck(P);
  t.eq(K.mobOnDeck().map(q => [q.p.c.name, q.w]), [['Stian Nilsen', 1.6]], 'på dekk: den som haler, ikke skipperen og ikke den som er inne');
  t.eq(K.mobWeight({c:C[1], st:'pause', idle:'seasick'}), 1.5, 'sjøsyk over rekka er utsatt');
  t.eq(K.mobWeight({c:{id:'a', anon:true, role:'bro'}, st:'ror'}), 0, 'havbåtens bro: ikke på dekk');
  // the rescue from the nearest station, or the helicopter far out
  const Rn = K.mobRescue(b.pos), far = K.mobRescue({x:pt.p.x - 120, y:pt.p.y});
  t.ok(Rn.k === 'rs' && Rn.min >= MOBK.rs.muster && Rn.min < 40, 'nær land: redningsskøyta fra nærmeste stasjon', Rn);
  t.ok(far.k === 'heli' && far.min > MOBK.heli.muster, '120 km ut fra Senja: helikopteret er der først', far);

  // ---- the fall: the log, the lifebuoy thrown by the hand on deck, the MAYDAY with the rescue ----
  const on = [{p:{c:C[0], st:'haling'}, w:1.6}, {p:{c:C[1], st:'sloy'}, w:1}];
  let ev = []; K.hooks.onMob = (k, x) => ev.push(k);
  K.mobStart(on[0], on, {sst:6, dark:false}); const M = S.mob;
  t.ok(M && M.name === 'Stian Nilsen' && M.lim === K.mobLimMin(6) && M.able === K.mobAbleMin(6) && M.st === 'water', 'mann over bord: Stian i sjøen, tiden etter 6 °C', M && [M.lim, M.able]);
  t.ok(/Mann over bord! Stian Nilsen gikk over bord om (styr|ba)bord/.test(S.log.slice(-5).map(l => l.no).join(' ')), 'dagboka: «Mann over bord!»', S.log.slice(-5).map(l => l.no));
  t.ok(M.buoy && M.buoy.by === 'Kari Berg' && !M.buoy.smoke, 'Kari kastet livbøya (under 15 m uten røyk)', M.buoy);
  const vhf = (S.radio || []).filter(r => r.from === 'VHF 16').map(r => r.no);
  t.ok(/^MAYDAY, MAYDAY, MAYDAY\. Dette er «Havbris».*Mann over bord i posisjon \d+°/.test(vhf[0]) && /Kystradioen: «Havbris», mottatt.*om rundt \d+ minutter/.test(vhf[1]), 'VHF 16: MAYDAY med posisjonen, og svaret med redningen', vhf);
  t.eq(ev, ['start'], 'skjermen får beskjed');
  const P2 = [{c:null}, {c:C[0]}, {c:C[1]}]; K.mobDeck(P2, 'fishing'); t.eq(P2.length, 2, 'den i sjøen er ikke om bord (workAssign)');
  // the mark from where the boat is now, 120 m further on
  const pos = {x:b.pos.x, y:b.pos.y - 0.12}; b.pos = pos; K.mobMark(pos);
  t.ok(M.mark && Math.abs(M.mark.y - pos.y) < 1e-9 && /MOB-merket satt i plotteren kl\. \d\d:\d\d, 1\d\d m fra Stian Nilsen\./.test(S.log[S.log.length - 1].no), 'MOB-merket der båten er, med avstanden til personen', S.log[S.log.length - 1].no);
  // the Williamson turn: she runs away from him at 8 knots, so the way goes out to the side he fell, round and back on her track
  const R1 = K.mobRoute();
  if (R1 && R1.wps){ t.eq([R1.kind, R1.wps.length], ['williamson', 5], 'Autonav: MOB går Williamson-svingen og så inn til ham');
    const W1 = R1.wps[0], side = M.side; t.ok((W1.x - pos.x) * side > 0 && W1.y < pos.y, 'første punkt: forover og ut mot den siden han falt', [W1, side]);
    const Wl = R1.wps[R1.wps.length - 1], tg = K.mobTarget(); t.ok(K.kmTrue(Wl, tg) < 0.02, 'siste punkt: 15 m før målet', K.kmTrue(Wl, tg)); }
  else t.ok(R1 && R1.why, 'Williamson-svingen: kartet er ikke lastet i enhetstestene, og ruta sier hvorfor', R1);
  // too far off and too fast: neither the ladder nor the sling; alongside and stopped: both
  let O = K.mobLiftOpts(pos, 8); t.ok(O.length === 2 && O.every(o => o.why && /For langt unna/.test(o.why[0])), 'for langt unna: ingen opptak ennå', O);
  const me = K.mobAt(0), by = {x:me.x + 0.012, y:me.y}; b.pos = by; b.v = 3;
  O = K.mobLiftOpts(by, 3); t.ok(O.every(o => o.why && /Stopp båten først/.test(o.why[0])), '12 m unna i 3 knop: stopp båten først', O);
  b.v = 0.5; O = K.mobLiftOpts(by, 0.5); t.eq(O.map(o => [o.how, o.why]), [['ladder', null], ['sling', null]], '12 m unna og stille: leideren og løftestroppen');
  t.eq(K.mobLift('ladder', by, 0.5), null, 'opp med leideren'); t.ok(/Opp med leideren akter.*§ 63/.test(S.log[S.log.length - 1].no), 'dagboka: leideren akter (§ 63)');
  const fat = C[0].fatigue; let n = 0; while (S.mob && n++ < 5){ S.t++; b.pos = K.mobAt(0) ? {x:K.mobAt(0).x + 0.012, y:K.mobAt(0).y} : b.pos; K.mobRisk(5, 0.5); }
  const L1 = S.log.slice(-6).map(l => l.no).join(' | ');
  t.ok(!S.mob && /Stian Nilsen er oppe etter \d+ minutter i sjøen, med leideren akter\. Kald og våt, men i orden\./.test(L1), 'oppe med leideren i tide', L1);
  t.ok(/Melding sendt til Sjøfartsdirektoratet for deg \(sjøloven § 475 og skipssikkerhetsloven § 47\): mann over bord fra «Havbris» kl\. \d\d:\d\d, Stian Nilsen, \d+ minutter i sjøen, ingen skade\./.test(L1), 'meldingen etter § 475 og § 47', L1);
  t.ok(/Redningsskøyta fra \w+ snur|Redningshelikopteret fra \w+ snur/.test(L1), 'VHF: redningen snur', L1);
  t.ok(!C[0].off && C[0].fatigue >= 90 && fat <= C[0].fatigue, 'ingen sykmelding, men sliten og kald', [C[0].off, C[0].fatigue]);
  t.eq(K.achC('mob'), 1, 'merket: tatt opp i tide'); t.ok(ev[ev.length - 1] === 'end', 'skjermen får beskjed om slutten');
  const rec = S.mobs.find(r => r.k === 'mob'); t.ok(rec && rec.out === 'own' && rec.how === 'ladder' && rec.days === 0 && rec.mark && rec.buoy === 'Kari Berg', 'ført i S.mobs for Sikkerhet-kortet (Ø11.7)', rec);

  // ---- too late: past the limit he cannot climb, and the rescue takes him; off sick and back at a quay ----
  S.t += 2 * 24 * 60; const sea = {x:pt.p.x - 120, y:pt.p.y}; b.pos = {x:sea.x, y:sea.y}; b.v = 6; b.status = 'sailing';   // (120 km out: the rescue comes after the limit)
  K.mobStart({p:{c:C[1], st:'fiske'}, w:1.2}, [{p:{c:C[1]}, w:1.2}], {sst:3, dark:true}); const M2 = S.mob;
  t.ok(M2 && !M2.buoy && M2.lim === K.mobLimMin(3), 'alene på dekk: ingen kastet livbøya', M2 && M2.buoy);
  K.mobThrow(b.pos); t.ok(M2.buoy && M2.buoy.by === 'me', 'du kaster livbøya');
  for (let m = 0; m <= M2.able && S.mob; m++){ S.t++; K.mobRisk(10, 1); }
  b.pos = {x:K.mobAt(0).x + 0.01, y:K.mobAt(0).y}; b.v = 0;
  O = K.mobLiftOpts(b.pos, 0); t.ok(O[0].how === 'ladder' && /orker ikke å klatre/.test(O[0].why[0]) && !O[1].why, 'etter den første tredjedelen: ikke leideren, men løftestroppen', O);
  b.pos = {x:sea.x + 1, y:sea.y}; b.v = 6;
  t.ok(M2.resc.min > M2.lim, 'redningen er lenger unna enn grensa', [M2.resc, M2.lim]);
  let guard = 0; while (S.mob && guard++ < 400){ S.t++; K.mobRisk(10, 1); }
  const L2 = S.log.slice(-8).map(l => l.no).join(' | ');
  t.ok(/sterkt nedkjølt/.test(S.log.filter(l => l.t > M2.t0).map(l => l.no).join(' ')), 'forbi grensa: sterkt nedkjølt, vesten holder henne oppe');
  t.ok(!S.mob && /(Redningsskøyta|Redningshelikopteret|Kystvaktskipet).* tok Kari Berg opp etter \d+ minutter.*sykmeldt i [3-5] dager/.test(L2), 'redningen tar henne, og hun er sykmeldt i tre til fem dager (V8 A)', L2);
  t.ok(C[1].off && C[1].offUntil > S.t && C[1].mobOff, 'i land: ikke om bord', [C[1].off, C[1].offUntil - S.t]);
  t.eq(K.achC('mob'), 1, 'ikke noe nytt merke');
  // the days are up at sea: she comes back aboard only at a quay
  S.t = C[1].offUntil + 5; b.status = 'sailing'; K.mobCrewHour(); t.ok(C[1].off && C[1].offUntil > S.t, 'dagene er gått, men båten er på sjøen: kommer om bord i havn');
  b.status = 'port'; b.port = 'finnsnes'; S.t = C[1].offUntil + 1; K.mobCrewHour(); K.lifeOffTick(C[1]); K.mobCrewHour(); t.ok(!C[1].off && !C[1].mobOff, 'i havn: om bord igjen');

  // ---- the ocean vessel: the rescue boat from 45 m, swung out with the davit ----
  b.type = 'autoliner'; b.status = 'sailing'; K.applyVessel(); b.pos = {x:pt.p.x + 2, y:pt.p.y + 1}; b.v = 1; S.t += 24 * 60; S.mobs = [];
  const hand = {id:'lag-A-dekk3', anon:true, role:'dekk', name:'Dekk 3', sex:'m'};
  K.mobStart({p:{c:hand, st:'haling'}, w:1}, [{p:{c:hand}, w:1}], {sst:5, dark:false}); const M3 = S.mob;
  const at3 = {x:K.mobAt(0).x + 0.3, y:K.mobAt(0).y};
  O = K.mobLiftOpts(at3, 1); t.eq(O.map(o => [o.how, o.why]), [['boat', null]], 'fra 45 m: MOB-båten, 300 m unna med skipet nesten stille');
  K.mobLift('boat', at3, 1); const L3 = M3.lift;
  t.ok(L3.ph && L3.ph.swing === L3.t0 + 1 && L3.ph.low > L3.ph.swing && L3.ph.there > L3.ph.low && L3.tp > L3.ph.there && L3.t1 > L3.tp, 'MOB-båten: davitet ut, firt, ut til ham, opp i båten, tilbake og heist', L3);
  b.pos = at3; guard = 0; while (S.mob && guard++ < 60){ S.t++; K.mobRisk(4, 0.5); }
  t.ok(!S.mob && /Dekk 3 er oppe etter \d+ minutter i sjøen, med MOB-båten/.test(S.log.slice(-5).map(l => l.no).join(' ')), 'oppe med MOB-båten', S.log.slice(-5).map(l => l.no));

  // ---- the game closed: the crew do it themselves (principle 4), and only near misses happen ----
  b.type = 'sjark'; K.applyVessel(); b.status = 'sailing'; S.t += 24 * 60; C[1].off = false; delete C[1].offUntil;
  K.mobStart({p:{c:C[0], st:'haling'}, w:1.6}, on, {sst:8, dark:false}); MOBF.live = false; S.t++; K.mobRisk(10, 2);
  t.ok(!S.mob && /Mannskapet snudde båten og fikk Stian Nilsen opp/.test(S.log.slice(-4).map(l => l.no).join(' ')), 'spillet lukket under hendelsen: mannskapet tar ham opp selv', S.log.slice(-4).map(l => l.no));
  // the dice forced: with the game closed only a near miss; with it open a fall
  const rnd0 = K.mobRnd; K.set('mobRnd', () => 0); S.t += 3 * 60; S.mobs = [];
  K.mobDeck([{c:C[0], st:'haling'}, {c:C[1], st:'blogg'}]); K.set('mobSeaF', () => 1);
  K.mobRisk(14, 2.6); t.ok(!S.mob && S.mobs.length === 1 && S.mobs[0].k === 'near' && /^Nestenulykke: /.test(S.log[S.log.length - 1].no), 'spillet lukket: bare en nestenulykke i dagboka', S.log[S.log.length - 1].no);
  S.t += 1; K.mobDeck([{c:C[0], st:'haling'}, {c:C[1], st:'blogg'}]); K.mobRisk(14, 2.6); t.eq(S.mobs.length, 1, 'aldri to nestenulykker på to timer');
  MOBF.live = true; S.t += 1; K.mobDeck([{c:C[0], st:'haling'}, {c:C[1], st:'blogg'}]); K.mobRisk(14, 2.6); t.ok(S.mob && S.mob.vid === S.cur, 'spillet åpent, du om bord og våken: mann over bord');
  S.mob = null; S.t += 60; K.mobDeck([{c:C[0], st:'haling'}]); K.mobRisk(14, 2.6); t.ok(!S.mob, 'aldri to fall på ett døgn');
  S.mobs = []; S.t += 60; S.me = 'v9'; K.mobDeck([{c:C[0], st:'haling'}]); K.mobRisk(14, 2.6); t.ok(!S.mob && S.mobs[0] && S.mobs[0].k === 'near', 'du er ikke om bord: bare nestenulykke'); S.me = S.cur;
  S.mobs = []; S.t += 3 * 60; K.mobDeck([{c:null, st:'haling'}]); K.mobRisk(14, 2.6); t.ok(!S.mob && !S.mobs.length, 'alene om bord: ingenting (skipperen går ikke over bord)');
  S.mobs = []; S.t += 60; S.sleep = {until:S.t + 600}; K.mobDeck([{c:C[0], st:'haling'}]); K.mobRisk(14, 2.6); t.ok(!S.mob && S.mobs[0] && S.mobs[0].k === 'near', 'du sover: bare nestenulykke'); S.sleep = null;
  K.set('mobRnd', rnd0);
  // ---- found in the review (07.11.2026): the badge, the rescue boat's lift finished when the game goes away, the weather's turn-back held ----
  t.ok(K.ACHL.some(a => a.id === 'mob' && a.v() === K.achC('mob')), 'merket «Mann over bord: tatt opp i tide» står blant de lange merkene og leser telleren');
  b.type = 'autoliner'; K.applyVessel(); b.status = 'idle'; b.v = 0; S.t += 2 * 24 * 60; S.mobs = []; MOBF.live = true;
  const hand2 = {id:'lag-A-dekk4', anon:true, role:'dekk', name:'Dekk 4', sex:'f'}; ev = []; let endX = null; K.hooks.onMob = (k, x) => { ev.push(k); if (k === 'end') endX = x; };
  K.mobStart({p:{c:hand2, st:'haling'}, w:1}, [{p:{c:hand2}, w:1}], {sst:6, dark:false}); const M4 = S.mob; b.windArm = true; S.t++; K.mobRisk(4, 0.5);
  t.ok(b.windArm === false, 'mens personen er i sjøen, venter vendingen for været (b.windArm holdes nede)');
  const at4 = {x:K.mobAt(0).x + 0.2, y:K.mobAt(0).y}; b.pos = at4; K.mobLift('boat', at4, 0); const L4 = M4.lift; S.t = L4.tp; K.mobRisk(4, 0.5);
  t.eq(M4.st, 'up', 'MOB-båten har henne om bord og går tilbake');
  MOBF.live = false; S.t = M4.t0 + M4.lim + 5; K.mobRisk(4, 0.5);
  t.ok(!S.mob && endX && endX.out === 'own' && endX.how === 'boat' && endX.days === 0, 'spillet borte mens MOB-båten går tilbake: opptaket i tide står, ikke redningen', endX);
  t.eq(endX && endX.sex, 'f', 'slutten sender kjønnet med (skjermen sier «henne»)');
  MOBF.live = null; MOBF.fol = null; K.hooks.onMob = null;
}
