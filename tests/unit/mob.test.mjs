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

  // ===== Ø11.7 (08.11.2026): the emergency stop on the hauler, the near misses on the Sikkerhet card, the trips without harm, and distress
  // near by after sjøloven § 135 (the MAYDAY with a man overboard from another boat, the PAN-PAN with engine failure as a tow) =====
  b.type = 'sjark'; K.applyVessel(); b.status = 'fishing'; b.v = 0.3; S.t += 3 * 24 * 60; S.mobs = []; S.mob = null; S.sos = null; MOBF.live = true; MOBF.fol = S.cur; S.me = S.cur;
  C[0].off = false; C[1].off = false; delete C[0].offUntil; delete C[1].offUntil; S.equip = S.equip || {};
  const hk = K.GEAR.line.haulers[0]; S.equip[hk] = true;
  // ---- SK4 the emergency stop (V9 B): a hand caught at the hauler, the crew stop it themselves; a near miss in the log, never an injury ----
  const g = {op:'haul', kind:'line'};
  K.mobDeck([{c:null, st:'ror'}, {c:C[0], st:'haling'}, {c:C[1], st:'sloy'}]);
  t.ok(K.MOBSTOP.R * 60 * 30 > 0.99 && K.MOBSTOP.R * 60 * 30 < 1.01, 'nødstoppen: én gang i rundt 30 timers draging for én ved haleren i stille vær (spillvalg)', 1 / K.MOBSTOP.R / 60);
  const rnd1 = K.mobRnd; K.set('mobRnd', k => k === 'stop' ? 0.999 : 0.1); t.eq(K.mobStop(g), false, 'terningen sier nei: haleren går');
  K.set('mobRnd', () => 0); const nL = S.log.length;
  t.eq(K.mobStop(g), true, 'terningen sier ja: haleren stoppes');
  const lst = S.log[S.log.length - 1];
  t.ok(S.log.length === nL + 1 && /^Nestenulykke: Stian Nilsen fikk en krok i hansken og ble dratt mot haleren\. Kari Berg slo av haleren med nødstoppen\. Ingen ble skadet\.$/.test(lst.no) && lst.k === 'nav', 'dagboka: nestenulykke, Kari stoppet haleren, ingen skadet', lst.no);
  t.ok(!/skade[dt]? i|sykmeldt|Mann over bord/.test(lst.no) && !C[0].off && !S.mob, 'aldri skade, sykmelding eller mann over bord');
  const st0 = S.mobs[S.mobs.length - 1]; t.ok(st0 && st0.k === 'stop' && st0.name === 'Stian Nilsen' && st0.by === 'Kari Berg' && st0.gear === 'line', 'ført i S.mobs for Sikkerhet-kortet', st0);
  S.t++; t.eq(K.mobStop(g), true, 'haleren står mens de får ham løs (to minutter)');
  S.t += 2; K.mobDeck([{c:C[0], st:'haling'}, {c:C[1], st:'sloy'}]); t.eq(K.mobStop(g), false, 'så går den igjen, og aldri to nødstopp på tolv timer');
  S.t += 12 * 60; S.equip[K.GEAR.garn.haulers[0]] = true; K.mobDeck([{c:C[0], st:'haling'}]); t.eq(K.mobStop({op:'haul', kind:'garn'}), true, 'garnet, alene ved haleren');
  t.ok(/fikk ermet fast i garnet ved haleren\. Han rakk nødstoppen selv\./.test(S.log[S.log.length - 1].no), 'alene: han rakk nødstoppen selv', S.log[S.log.length - 1].no);
  S.t += 12 * 60; K.mobDeck([{c:null, st:'haling'}]); t.eq(K.mobStop({op:'haul', kind:'line'}), false, 'skipperen alene ved haleren: ingenting');
  S.t += 12 * 60; K.mobDeck([{c:C[0], st:'haling'}]); const hOn = K.GEAR.teine.haulers.map(k => [k, S.equip[k]]); for (const [k] of hOn) S.equip[k] = false; t.eq(K.hasHauler('teine') || K.mobStop({op:'haul', kind:'teine'}), false, 'for hånd uten haler: ingen nødstopp'); for (const [k, v] of hOn) S.equip[k] = v;
  t.eq(K.mobStop({op:'set', kind:'line'}), false, 'bare under draget');
  K.set('mobRnd', rnd1);

  // ---- SK6 the near misses the log tells of: shallow water ahead and seas over the rail, read once, never twice ----
  S.mobScan = {}; K.mobScan(); S.t++;
  K.log('Grunt vann forut. Autonav stopper og finner en vei rundt.', 'Shallow water ahead. Autonav stops and finds a way round.', 'nav'); K.log('Tok inn sjø over ripa. Mistet 20 kg fisk.', 'Shipped water over the gunwale. Lost 20 kg of fish.');
  S.t++; K.mobScan(); S.t++; K.mobScan();
  t.eq(S.mobs.filter(r => r.k === 'ground' || r.k === 'sea').map(r => r.k).sort(), ['ground', 'sea'], 'nesten grunnstøting og sjø over ripa fra dagboka, hver én gang');
  // the passing under the limit (Ø11.1, S.nearMiss) and a near miss on deck
  S.nearMiss = [{t:S.t - 5, x:b.pos.x, y:b.pos.y, vid:S.cur, name:'Nordkyn', m:31, sit:'15', give:'a'}];
  S.mobs.push({t:S.t - 4, vid:S.cur, x:b.pos.x, y:b.pos.y, k:'near', name:'Kari Berg', why:'dark'});
  S.mobs.push({t:S.t - 3, vid:S.cur, x:b.pos.x, y:b.pos.y, k:'mob', name:'Stian Nilsen', out:'own', how:'ladder', min:9, days:0});
  const rows = K.mobSafeRows();
  t.ok(rows.length >= 6 && rows.every((r, i) => i === 0 || r.t <= rows[i - 1].t), 'kortet: alle nestenulykkene, nyeste først', rows.map(r => r.k));
  t.ok(rows.every(r => r.what[0] && r.what[1] && r.learn[0] && r.learn[2] && r.learn[3] && isFinite(r.x) && isFinite(r.t)), 'hver med tid, sted, hva som skjedde, hva den lærer og kilden, på norsk og engelsk');
  const byK = k => rows.find(r => r.k === k);
  t.ok(/Passerte «Nordkyn» bare 31 m unna/.test(byK('pass').what[0]) && byK('pass').learn[2] === 'Sjøveisreglene regel 16', 'passeringen under grensa: du hadde vikeplikt, regel 16', byK('pass'));
  t.ok(/Autonav stoppet før grunt vann/.test(byK('ground').what[0]) && /regel 6 a vi/.test(byK('ground').learn[2]), 'grunt vann forut: regel 6 a vi (dypgangen mot dybden)');
  t.ok(/Tok inn sjø over ripa/.test(byK('sea').what[0]) && /regel 6 a v$/.test(byK('sea').learn[2]), 'sjø over ripa: regel 6 a v');
  const stops = rows.filter(r => r.k === 'stop'); t.ok(stops.some(r => /Stian hang seg fast i lina, og haleren ble stoppet med nødstoppen i tide/.test(r.what[0])) && stops.some(r => /i garnet/.test(r.what[0])) && stops.every(r => /God praksis/.test(r.learn[2])), 'nødstoppen i tide: god praksis, ingen forskrift', stops.map(r => r.what[0]));
  t.ok(/Kari Berg holdt på å gå over bord i mørket/.test(byK('near').what[0]) && /Sjøfartsdirektoratet/.test(byK('near').learn[2]), 'nestenulykken på dekk', byK('near').what[0]);
  t.ok(/Stian Nilsen gikk over bord, oppe etter 9 min\./.test(byK('mob').what[0]) && /§§ 43 og 63/.test(byK('mob').learn[2]), 'mann over bord som endte godt: §§ 43 og 63', byK('mob').what[0]);
  t.eq(K.mobSafeRows(3).length, 3, 'kortet viser de nyeste');

  // ---- the trips without harm (the badge): a count that only grows; harm on the trip keeps it from counting ----
  const A0 = K.achC('safe'), t0 = S.t; S.t += 60;
  t.eq(K.mobSafeTrip(t0), true, 'en tur uten skade');
  S.incidents = (S.incidents || []).concat([{t:S.t, k:'aground', boat:S.boatName}]); t.eq(K.mobSafeTrip(t0), false, 'gikk på grunn: ikke uten skade');
  t.eq(K.mobSafeTrip(S.t + 1), true, 'neste tur teller igjen');
  S.mobs.push({t:S.t + 5, vid:S.cur, k:'mob', name:'Kari Berg', out:'rescue', days:2}); S.t += 10; t.eq(K.mobSafeTrip(S.t - 8), false, 'en sykmeldt etter fall: ikke uten skade');
  const achCk = K.achCheck; K.set('achCheck', () => {}); const A = K.achState(); A.safeT = S.t; S.t += 30; K.achTripEnd(false); t.eq(K.achC('safe'), A0 + 1, 'turen endte uten skade: merket teller én til');
  S.t += 24 * 60 * 30; K.achTripEnd(false); t.eq(K.achC('safe'), A0 + 2, 'en måned borte: ingenting nulles, neste tur teller videre');
  K.set('achCheck', achCk);
  t.ok(K.ACHL.some(a => a.id === 'safe') && K.ACHL.some(a => a.id === 'sos' && a.nogift), 'merkene «Turer uten skade» og «Hjelp i havsnød» (heder, ingen gave)');

  // ---- L8 distress near by (§ 135): only with the game open, the player aboard, awake and with the VHF ----
  S.fleet = S.fleet || [];   // (the game always has the fleet: Kystposten asks it for the group)
  S.equip.vhf = true; b.status = 'sailing'; b.v = 7; b.heading = 0; S.sos = null; S.sosT = null; S.mob = null;
  t.ok(K.sosCan(), 'spillet åpent, om bord, våken, VHF: anropet kan komme');
  MOBF.live = false; t.ok(!K.sosCan(), 'spillet lukket: aldri'); MOBF.live = true;
  S.equip.vhf = false; t.ok(!K.sosCan(), 'uten VHF hører du ikke kanal 16'); S.equip.vhf = true;
  S.sleep = {until:S.t + 600}; t.ok(!K.sosCan(), 'du sover: aldri'); S.sleep = null;
  t.ok(K.mobSeaX(5, 1, K.SOSK.lim) < K.SOSK.x && K.mobSeaX(11, 1.6, K.SOSK.lim) >= K.SOSK.x, 'bare i grov sjø for en liten båt (fra 1,5 m eller 9,6 m/s)');
  t.ok(K.SOSK.R * 6 > 0.16 && K.SOSK.R * 6 < 0.17 && K.SOSK.gap === 72 * 60, 'sjelden: rundt ett anrop per seks timers spill i grov sjø, høyst ett i tre spilldøgn', [1 / K.SOSK.R, K.SOSK.gap]);
  // the MAYDAY from a boat 2 km off: the call, the coast radio, the boat drawn where she lies
  const sp = {x:b.pos.x + 1.5, y:b.pos.y - 1.2}; let sev = []; K.hooks.onSos = (k, q) => sev.push(k); ev = []; K.hooks.onMob = (k, x) => { ev.push(k); if (k === 'end') endX = x; };
  const Q = K.sosCall('mob', sp);
  t.ok(Q && S.sos === Q && Q.k === 'mob' && Q.boat !== S.boatName && Q.until === S.t + K.SOSK.wait, 'MAYDAY fra en båt i nærheten', Q && [Q.boat, Q.who]);
  const V1 = (S.radio || []).slice(-2).map(r => r.no);
  t.ok(new RegExp('^MAYDAY, MAYDAY, MAYDAY\\. Dette er «' + Q.boat + '»\\. Mann over bord i posisjon \\d+°.*' + Q.who + ' er i sjøen med redningsvest').test(V1[0]), 'VHF 16: MAYDAY med posisjonen og personen', V1[0]);
  t.ok(/^Kystradioen: Alle stasjoner, alle stasjoner\..*Fartøy i nærheten bes melde seg på kanal 16\..*framme om rundt \d+ minutter\./.test(V1[1]), 'kystradioen ber fartøy i nærheten melde seg', V1[1]);
  t.eq(sev, ['call'], 'skjermen får beskjed');
  const npc = K.turNpcs().find(n => n.name === Q.boat); t.ok(npc && npc.id[0] === 't' && npc.v === 0 && Math.abs(npc.p.x - sp.x) < 1e-9, 'båten i nød tegnes der hun ligger (turNpcs, npcStates)', npc);
  // answered: the person from the other boat in the water, the mark where she reported, her crew's lifebuoy, no Williamson turn
  const M5 = K.sosAnswer();
  t.ok(M5 && S.mob === M5 && M5.other && M5.other.boat === Q.boat && M5.name === Q.who && M5.anon && M5.mark && M5.buoy && M5.buoy.held && M5.buoy.by === Q.boat, 'svaret: personen fra den andre båten i sjøen, merket der hun meldte, livbøya hennes', M5 && M5.other);
  t.ok(/til «/.test(S.radio[S.radio.length - 1].no) && /Vi har dere [\d,]+ nautiske mil unna og kommer/.test(S.radio[S.radio.length - 1].no), 'VHF 16: «vi kommer»', S.radio[S.radio.length - 1].no);
  t.ok(M5.resc.eta >= Q.resc.eta, 'redningen kommer fortsatt, men står bi for den som svarte');
  t.eq(ev, ['start'], 'panelet for mann over bord tar over');
  const R5 = K.mobRoute(); t.ok(!R5 || !R5.kind || R5.kind !== 'williamson', 'ingen Williamson-sving for en person fra en annen båt', R5 && R5.kind);
  const nCrew = C.map(c => !!c.off).join();
  const at5 = {x:K.mobAt(0).x + 0.01, y:K.mobAt(0).y}; b.pos = at5; b.v = 0.4; b.status = 'idle';
  t.eq(K.mobLift('ladder', at5, 0.4), null, 'opp med leideren akter');
  const sos0 = K.achC('sos'); guard = 0; while (S.mob && guard++ < 10){ S.t++; b.pos = K.mobAt(0) ? {x:K.mobAt(0).x + 0.01, y:K.mobAt(0).y} : b.pos; K.mobRisk(12, 1.8); }
  const L5 = S.log.slice(-8).map(l => l.no).join(' | ');
  t.ok(!S.mob && !S.sos && new RegExp(Q.who + ' er oppe etter \\d+ minutter i sjøen, med leideren akter\\. Kald og våt, men i orden\\. «' + Q.boat + '» kommer inntil').test(L5), 'oppe i tide, og båten hennes tar personen om bord igjen', L5);
  t.ok(/Tusen takk\. Det glemmer vi aldri\./.test(L5) && /ingen bergelønn/.test(L5), 'takken på VHF, og ingen bergelønn for å redde folk', L5);
  t.ok(!/Sjøfartsdirektoratet for deg/.test(L5), 'ingen melding etter § 475 fra deg: kystradioen har den');
  t.eq(K.achC('sos'), sos0 + 1, 'heder: merket «Hjelp i havsnød»');
  const pz = (S.press && S.press.own || []).filter(x => x.kind === 'sos').pop();
  t.ok(pz && pz.d.k === 'mob' && K.TUR_BOATS[pz.d.b] === Q.boat && pz.d.min > 0 && !('name' in pz.d), 'Kystposten: saken (uten personens navn)', pz && pz.d);
  // (the story's words need the screen's fmt: mobtest reads them in the paper)
  t.eq(C.map(c => !!c.off).join(), nCrew, 'ingen av ditt eget mannskap sykmeldt');
  t.ok(endX && endX.other === Q.boat && endX.out === 'own', 'skjermen får slutten med båtens navn', endX);
  const sr = K.mobSafeRows().find(r => r.k === 'sos'); t.ok(sr && /Svarte på MAYDAY fra «/.test(sr.what[0]) && sr.learn[2] === 'Sjøloven § 135', 'Sikkerhet-kortet: hjelpen etter § 135', sr && sr.what[0]);
  // left be: another boat or the rescue takes it after ten minutes, and nothing follows (V1 A)
  S.sosT = null; S.t += 10; const Q2 = K.sosCall('eng', {x:b.pos.x - 1, y:b.pos.y + 1.5}); const ach2 = K.achC('sos'), act0 = ((S.turer || {}).act || []).length;
  t.ok(Q2 && /^PAN-PAN, PAN-PAN, PAN-PAN\. Alle stasjoner, dette er «.*Motorstopp i posisjon .*Vi driver mot land i grov sjø og trenger slep\./.test(S.radio[S.radio.length - 2].no), 'PAN-PAN: motorstopp, driver mot land', S.radio[S.radio.length - 2].no);
  S.t += K.SOSK.wait; K.sosMinute(12, 1.8);
  t.ok(!S.sos && /like ved og går til dere|tar «/.test(S.radio[S.radio.length - 1].no) && K.achC('sos') === ach2 && ((S.turer || {}).act || []).length === act0, 'ingen svarte: en annen båt eller redningen tar det, uten følger', S.radio[S.radio.length - 1].no);
  S.t += 10; K.sosCall('mob', sp); MOBF.live = false; S.t++; K.sosMinute(5, 0.5); t.ok(!S.sos && !S.mob, 'spillet lukket mens anropet står: en annen tar det'); MOBF.live = true;
  S.t += 10; K.sosCall('mob', sp); K.sosDecline(); t.ok(!S.sos && !S.mob, '«La være»: en annen tar det med én gang');
  // the PAN-PAN answered: a tow as the turoppdrag's, outside the board, salvage for the ship, honour in the harbour
  S.t += 10; const Q3 = K.sosCall('eng', {x:b.pos.x - 1, y:b.pos.y + 1.5}); const m3 = K.sosAnswer();
  t.ok(m3 && m3.k === 'slep' && m3.sos === Q3.id && m3.boat === Q3.boat && m3.stage === 'reach' && m3.vid === S.cur && !S.sos && K.turState().act.includes(m3), 'svaret på PAN-PAN: slepet tatt med én gang', m3 && [m3.k, m3.cls, m3.to]);
  t.ok(m3.pay > 0 && m3.pay <= m3.value && m3.payHi <= m3.value, 'bergelønnen for skip og last etter verdien, aldri over den (som turSlep)', [m3.pay, m3.value]);
  // (the harbour's pay, the honour and the paper on arrival, turDock, need the screen's kr: mobtest plays them in the game)
  t.ok(K.PRESS_KINDS.includes('sos'), 'Kystposten kjenner saken');
  // ---- found in the review (08.11.2026): a call left open in port, on another vessel, or over your own man overboard ----
  S.t += 10; b.status = 'sailing'; K.sosCall('mob', sp); b.status = 'port'; K.mobCrewHour(); t.ok(!S.sos, 'båten kom i havn mens anropet sto: det tas av en annen innen timen (sosSweep)');
  b.status = 'sailing'; S.t += 10; const Q6 = K.sosCall('mob', sp); Q6.vid = 'v-annen'; S.t = Q6.until; K.sosMinute(5, 0.5); t.ok(!S.sos, 'et anrop på en annen båt i flåten går ut der også, og stenger ikke for nye');
  S.t += 10; K.sosCall('mob', sp); K.mobStart({p:{c:C[0], st:'haling'}, w:1.6}, [{p:{c:C[0]}, w:1.6}], {sst:8, dark:false}); const own = S.mob;
  t.eq(K.sosAnswer(), null, 'svaret overskriver aldri din egen mann over bord'); t.ok(S.mob === own && !own.other, 'din egen hendelse står');
  S.t++; K.mobRisk(5, 0.5); t.ok(!S.sos, 'med din egen mann over bord tar en annen anropet');
  S.mob = null; S.mobs = S.mobs.filter(r => r.k !== 'mob' || r.out);
  K.hooks.onSos = null; K.hooks.onMob = null; MOBF.live = null; MOBF.fol = null; b.status = 'sailing';
}
