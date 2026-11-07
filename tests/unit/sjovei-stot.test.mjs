// Collisions (Ø11.3, core/05e-sjovei.js; sjøloven kap. 8, §§ 161-164, read on Lovdata 06.11.2026): the hulls and their contact, each
// hull's blow by the masses, the other's damage and what it costs, the fault in each situation of the rules read from the looks before
// the blow (as sjvEval keeps them, with the roles that stand), the payment with and without the hull insurance, § 164 on the VHF and in
// the log, another player's boat never damaged, the NPC standing by, and nothing at all while the time away is caught up.
export default function (t){
  const K = t.K; K.set('S', K.newState());
  const R = Math.PI / 180, NM = K.NM, KN_MS = K.KN_MS;

  // ---- the hulls and the contact ----
  const A0 = K.sjvHullPts(0, 0, 0, 10, 4);
  t.near(A0[0][1], -5, 1e-9, 'skroget: stevnen 5 m nord for midten når hun går nord (z mot sør)');
  t.near(A0[1][0], 2, 1e-9, 'skroget: skulderen om styrbord 2 m øst (halve bredden)');
  const E90 = K.sjvHullPts(0, 0, 90 * R, 10, 4); t.near(E90[0][0], 5, 1e-9, 'skroget: stevnen 5 m øst når hun går øst');
  let I = K.sjvSat(K.sjvHullPts(0, 0, 0, 10, 4), K.sjvHullPts(3, 0, 0, 10, 4));
  t.ok(I && Math.abs(I.d - 1) < 1e-6 && I.ox < -0.99, 'kontakt: to skrog side om side med 1 m overlapp, ut mot vest for den til venstre', I);
  t.eq(K.sjvSat(K.sjvHullPts(0, 0, 0, 10, 4), K.sjvHullPts(4.5, 0, 0, 10, 4)), null, 'kontakt: 0,5 m fra hverandre er ingen kontakt');
  I = K.sjvSat(K.sjvHullPts(0, 0, 0, 10, 4), K.sjvHullPts(0, -6.6, 90 * R, 10, 4));
  t.ok(I && I.oz > 0.9 && I.z < -4, 'kontakt: stevnen inn i siden på en som krysser forut: ut akterover, punktet ved stevnen', I);
  t.eq(K.sjvSatC(A0, 6, 0, 1), null, 'sjømerket 4 m utenfor siden: ingen kontakt');
  I = K.sjvSatC(A0, 2.5, 0, 1);
  t.ok(I && Math.abs(I.d - 0.5) < 1e-6 && I.ox < -0.99, 'sjømerket (1 m) 0,5 m inn i styrbord side: ut mot babord', I);
  // each hull's blow as a quay would give it
  let q = K.sjvKnEq(6, 12000, 12000); t.near(q[0], 6 / Math.SQRT2, 1e-9, 'to like båter: hver tar farten over roten av to');
  q = K.sjvKnEq(6, 12000, K.sjvMass({L:121.8, B:21, T:4.9}));
  t.ok(q[0] > 5.98 && q[1] < 0.3, 'sjarken mot kystruteskipet: sjarken tar hele støtet, skipet nesten ingenting', q);
  t.ok(K.sjvMass({L:15, B:5, T:2.2}) > 80000 && K.sjvMass({L:15, B:5, T:2.2}) < 90000, 'massen av en kystbåt på 15 m: rundt 85 tonn', K.sjvMass({L:15, B:5, T:2.2}));
  // the other's damage and what it costs
  const P10 = K.sjvValue(10), P121 = K.sjvValue(121.8);
  t.ok(K.sjvValue(6) < P10 && P10 < K.sjvValue(15) && K.sjvValue(15) < K.sjvValue(40) && K.sjvValue(40) < P121, 'verdien stiger med lengden', [K.sjvValue(6), P10, K.sjvValue(15), K.sjvValue(40), P121]);
  t.eq(K.sjvOtherCost(0.8, 10, 1, P10).kr, 0, 'under en knop: fendrene tar det, ingen skade på den andre');
  const c2 = K.sjvOtherCost(2, 10, 1, P10), c4 = K.sjvOtherCost(4, 10, 1, P10), c8 = K.sjvOtherCost(8, 10, 1, P10);
  t.ok(c2.kr > 0 && c2.dh === 0 && c4.dh > 0 && c4.dA === 0 && c8.dA > 0 && c2.kr < c4.kr && c4.kr < c8.kr, 'den andres skade: skrammer ved 2 knop, skadet skrog ved 4, slått inn ved 8, og dyrere for hvert', [c2, c4, c8]);
  t.ok(K.sjvOtherCost(4, 10, 0.6, P10).dh < c4.dh, 'stål tar mindre skade enn glassfiber');
  t.ok(K.sjvOtherCost(30, 10, 1, P10).kr <= P10 / 2, 'aldri mer enn halve verdien');
  t.ok(K.sjvOtherCost(q[1] < 1 ? 1.2 : q[1], 121.8, 0.6, P121).kr < 200000, 'kystruteskipet som får et lett støt: skrammer, ikke millioner', K.sjvOtherCost(1.2, 121.8, 0.6, P121));

  // ---- the fault, from looks made as sjvEval makes them (a tenth of a game minute apart, the roles kept once the risk is seen) ----
  // a vessel's way: from (x0, y0) km on heading hd0 at v knots, with turns and speed changes at given game minutes
  const way = (x0, y0, hd0, v0, ch = []) => tm => { let x = x0, y = y0, hd = hd0 * R, v = v0, tt = 0; const st = 0.02;
    for (; tt < tm - 1e-9; tt += st){ for (const c of ch) if (Math.abs(tt - c.at) < st / 2){ if (c.turn != null) hd += c.turn * R; if (c.v != null) v = c.v; }
      const dd = v * NM * Math.min(st, tm - tt) / 60; x += Math.sin(hd) * dd; y -= Math.cos(hd) * dd; }
    return {x, y, hd, v}; };
  const meet = (hd, v, T) => { const d = v * NM * T / 60; return [-Math.sin(hd * R) * d, Math.cos(hd * R) * d]; };   // where to start to be at (0, 0) at T
  function fault(sc){
    const T = sc.T || 6, trail = []; let prev = null;
    const V = (q, cls, L) => ({p:{x:q.x, y:q.y}, hd:q.hd, cog:q.hd, v:q.v, cls, L});
    for (let m = 0; m <= Math.round(T * 10); m++){
      const tm = m / 10, a = sc.a(tm), b = sc.b(tm), A = V(a, sc.clsA || 'pow', 10), B = V(b, sc.clsB || 'pow', sc.Lb || 10);
      const Rs = K.colregSit(A, B, {prev:prev && (prev.sit === '13a' || prev.sit === '13b') ? prev.sit : null, gs:1, fog:!!sc.fog});
      if (prev && prev.give){ Rs.sit = prev.sit; Rs.give = prev.give; }
      if (!prev && Rs.risk && Rs.rng < 3000) prev = {sit:Rs.sit, give:Rs.give};
      trail.push({H:tm / 60, sit:Rs.sit, give:Rs.give, risk:Rs.risk, tcpa:Rs.tcpa, cpa:Rs.cpa, rng:Rs.rng, lim:Rs.lim, fog:!!sc.fog, relA:Rs.relA, relB:Rs.relB, gs:1, safeA:sc.safeA || 0, seen:sc.seen || 50000,
        a:{x:a.x, y:a.y, hd:a.hd, cog:a.hd, v:a.v, cls:A.cls, L:10}, b:{x:b.x, y:b.y, hd:b.hd, hd0:sc.route ? b.hd : undefined, cog:b.hd, v:b.v, cls:B.cls, L:B.L}});
    }
    const a = sc.a(T), b = sc.b(T);
    return K.sjvFault(trail.filter(e => e.H < T / 60 - 1e-9), {H:T / 60, gs:1, fog:!!sc.fog, a:{x:a.x, y:a.y, hd:a.hd, cog:a.hd, v:a.v, cls:sc.clsA || 'pow', L:10}, b:{x:b.x, y:b.y, hd:b.hd, cog:b.hd, v:b.v, cls:sc.clsB || 'pow', L:sc.Lb || 10}});
  }
  const sh = F => [F.law, F.fa, F.fb];
  // rule 15, crossing: you north, she from your starboard going west (you give way), both at (0, 0) in 6 game minutes at 10 knots
  const yN = way(...meet(0, 10, 6), 0, 10), sW = way(...meet(270, 10, 6), 270, 10), sE = way(...meet(90, 10, 6), 90, 10);
  let F = fault({a:yN, b:sW});
  t.eq(sh(F), ['161', 1, 0], 'regel 15: du hadde vikeplikt og gjorde ingenting: du har hele skylda'); t.eq(F.why.a, ['gw:15'], 'grunnen: vikeplikt etter regel 15');
  F = fault({a:yN, b:sE});
  t.eq(sh(F), ['161', 0, 1], 'regel 15: hun hadde deg om styrbord og gjorde ingenting, du holdt kurs og fart: hun har hele skylda');
  // you gave way (35 degrees to starboard at minute 2), still met: too little or too late, and the one standing on kept her course
  F = fault({a:way(...meet(0, 10, 6), 0, 10, [{at:2, turn:35}]), b:sW});
  t.eq(sh(F), ['161', 1, 0], 'regel 15: du vek, men for lite eller for sent, og hun holdt kurs: fortsatt din skyld'); t.eq(F.why.a, ['sent'], 'grunnen: vek for sent eller for lite (8, 16)');
  // ... and she, who was to stand on, turned to port towards you early (17 a i, 17 c)
  F = fault({a:way(...meet(0, 10, 6), 0, 10, [{at:2, turn:35}]), b:way(...meet(270, 10, 6), 270, 10, [{at:2, turn:-30}])});
  t.eq(sh(F), ['161', 0.33, 0.67], 'regel 17 c: du vek, hun skulle holde kurs og svingte til babord mot deg tidlig: hun to tredeler', F.why);
  // you stood on, but altered to port early towards her (17 a i, 17 c), and she did not give way: shared equally
  F = fault({a:way(...meet(0, 10, 6), 0, 10, [{at:1.5, turn:-30}]), b:sE});
  t.eq(sh(F), ['161', 0.4, 0.6], 'regel 17 c: du skulle holde kurs og svingte til babord tidlig, hun vek ikke: 40 mot 60', F.why);
  // an NPC following the bend of her route on the shared clock (her course there turns with her: hd0) keeps her course: no 17 c, no fault
  F = fault({a:yN, b:way(...meet(270, 10, 6), 270, 10, [{at:1.5, turn:-30}]), route:true});
  t.eq([F.law, F.fa, F.why.b], ['161', 1, []], 'NPC-en som følger ruta si rundt en sving til babord, holder kursen: ingen 17 c for henne (stikkprøven i Tromsø)');
  // § 161 fifth ledd: you stood on and turned hard at the last moment (in the last half minute): no time to deliberate, no fault
  F = fault({a:way(...meet(0, 10, 6), 0, 10, [{at:5.7, turn:60}]), b:sE});
  t.eq(sh(F), ['161', 0, 1], 'sjøloven § 161 femte ledd: et kast i siste halve minutt teller ikke; hennes skyld');
  // 17 a ii: she stood on, saw you do nothing, and turned to starboard when there were under three game minutes to go: no fault for her
  F = fault({a:yN, b:way(...meet(270, 10, 6), 270, 10, [{at:4.4, turn:40}])});
  t.eq(sh(F), ['161', 1, 0], 'regel 17 a ii: hun svingte selv da det ble klart at du ikke vek: din skyld');
  // ... and you followed her turn towards her (steered at her): that is not giving way (hulltest 7a)
  F = fault({a:way(...meet(0, 10, 6), 0, 10, [{at:4.7, turn:-25}]), b:way(...meet(270, 10, 6), 270, 10, [{at:4.4, turn:40}])});
  t.eq([F.law, F.fa, F.why.a], ['161', 1, ['gw:15']], 'å følge etter hennes sving mot henne er ikke å vike: vikeplikt etter regel 15, din skyld');
  // rule 14, head-on: neither turned, both at fault equally; you turned to starboard and she did not: she three quarters
  const hS = way(...meet(180, 10, 6), 180, 10);
  F = fault({a:yN, b:hS}); t.eq(sh(F), ['161', 0.5, 0.5], 'regel 14: møtende, ingen svingte: likt');
  F = fault({a:way(...meet(0, 10, 6), 0, 10, [{at:2, turn:35}]), b:hS}); t.eq(sh(F), ['161', 0.25, 0.75], 'regel 14: du svingte til styrbord, hun ikke: hun tre firedeler', F.why);
  // rule 13: you overtake her at 14 knots from right astern
  F = fault({a:way(0, 14 * NM * 6 / 60 - 6 * NM * 6 / 60, 0, 14), b:way(0, 0, 0, 6)});
  t.eq(sh(F), ['161', 1, 0], 'regel 13: du innhenter og holder ikke klar: din skyld'); t.eq(F.why.a, ['gw:13a'], 'grunnen: innhenting');
  // rule 2 b: she lies still, you run into her
  F = fault({a:yN, b:way(0, 0, 90, 0)}); t.eq(sh(F), ['161', 1, 0], 'regel 2: hun lå stille: din skyld');
  // rule 18: she is fishing (3 knots), crossing from your port side; you are power-driven
  F = fault({a:yN, b:way(...meet(90, 3, 6), 90, 3), clsB:'fish'}); t.eq(sh(F), ['161', 1, 0], 'regel 18: du viker for den som fisker, også fra babord');
  // not under command (3 f): you drift with the engine stopped, she does not keep clear
  F = fault({a:way(...meet(0, 1.5, 6), 0, 1.5), b:sW, clsA:'nuc'}); t.eq(sh(F), ['161', 0, 1], 'regel 18 og 3 f: du har motorstopp, hun skulle holde klar: hennes skyld');
  F = fault({a:way(...meet(0, 1.5, 6), 0, 1.5), b:way(...meet(270, 1.5, 6), 270, 1.5), clsA:'nuc', clsB:'nuc'}); t.eq(F.law, '162', 'to som ikke er under kommando: sjøloven § 162, hver sin skade');
  F = fault({a:way(0, 0.01, 0, 0.6), b:way(0, 0, 90, 0.5)}); t.eq([F.law, F.sit], ['162', '2'], 'to som driver: sjøloven § 162');
  // at the quay
  F = fault({a:way(0, 0.1, 0, 3), b:way(0, 0, 90, 0), clsB:'moor'}); t.eq([F.law, F.fa, F.why.a[0]], ['161', 1, 'fast'], 'et fartøy ved kaia: den som går, har skylda');
  F = fault({a:way(0, 0.1, 0, 1.2), b:way(0, 0, 90, 0), clsA:'nuc', clsB:'moor'}); t.eq(F.law, '162', 'driver med motorstopp inn i en som ligger ved kaia: § 162');
  // rule 19, restricted visibility (not in sight): both at 10 knots, neither does anything, you too fast for the sight (safe 3 m/s)
  F = fault({a:yN, b:hS, fog:true, safeA:3, seen:500});
  t.eq(sh(F), ['161', 0.56, 0.44], 'regel 19: ingen gjorde noe, begge uten minste styrefart, og du over sikker fart: du litt mer', F.why);
  t.ok(F.why.a.includes('fart') && F.why.a.includes('19e') && F.why.b.includes('19e') && !F.why.b.includes('fart'), 'regel 19: din fart over sikker fart (6, 19 b), begge uten minste styrefart (19 e); hun ses lenger enn åtte lengder', F.why);
  // ... you turned to starboard and slowed to two knots at minute 3, she went on
  F = fault({a:way(...meet(0, 10, 6), 0, 10, [{at:3, turn:30, v:2}]), b:hS, fog:true, safeA:3, seen:500});
  t.eq(sh(F), ['161', 0.4, 0.6], 'regel 19: du vek og gikk ned i fart, men gikk for fort før; hun gikk på: 40 mot 60');
  // no risk seen in time: passing at 400 m, then you turn 60 degrees into her in the last game minute
  const pS = way(0.4, -10 * NM * 3 / 60, 180, 10);
  F = fault({a:way(0, 10 * NM * 3 / 60, 0, 10, [{at:2.4, turn:60}]), b:pS, T:3});
  t.eq([F.law, F.fa, F.why.a[0]], ['161', 1, 'sving'], 'ingen fare før du svingte rett mot henne siste minutt: din skyld', F.why);
  // the words
  const wNo = K.sjvFaultSay(fault({a:yN, b:sW}), 'Sjøsprøyt', 'no'), wEq = K.sjvFaultSay(fault({a:yN, b:hS}), 'Sjøsprøyt', 'no'), w162 = K.sjvFaultSay({law:'162', sit:'19', why:{a:[], b:[]}}, 'Sjøsprøyt', 'no');
  t.ok(/§ 161 er din: du hadde vikeplikt etter regel 15/.test(wNo), 'teksten: din skyld etter regel 15', wNo);
  t.ok(/deles likt/.test(wEq) && /«Sjøsprøyt»/.test(wEq), 'teksten: delt likt', wEq);
  t.ok(/§ 162/.test(w162) && /hver bærer sin skade/.test(w162), 'teksten: § 162', w162);
  t.ok(/Maritime Code § 161/.test(K.sjvFaultSay(fault({a:yN, b:sW}), 'Sjøsprøyt', 'en')), 'teksten på engelsk');

  // ---- the payment ----
  const S0 = K.get('S'), b = S0.boat; b.type = 'sjark'; K.applyVessel(); b.kasko = null; S0.cash = 1e6; S0.free = {rep:1};
  const F1 = {law:'161', fa:1, fb:0}, F25 = {law:'161', fa:0.25, fb:0.75}, c = {scr:2000, str:20000, eng:0, tot:22000};
  let c0 = S0.cash, M = K.sjvSettle(b, F1, c, 40000, 'Sjøsprøyt');
  t.eq([M.owe, M.you, M.ins, M.got, c0 - S0.cash], [40000, 40000, 0, 0, 40000], 'uten kasko: du betaler hele skaden på den andre');
  b.kasko = {t0:0, next:1e9, claims:[]}; c0 = S0.cash; M = K.sjvSettle(b, F1, c, 40000, 'Sjøsprøyt');
  t.eq([M.you, M.ins, c0 - S0.cash, K.kaskoClaims(b)], [K.kaskoSelf(b), 40000 - K.kaskoSelf(b), K.kaskoSelf(b), 1], 'med kasko: forsikringen tar det over egenandelen, og det er en skade på kaskoen (malus)');
  c0 = S0.cash; M = K.sjvSettle(b, F25, c, 40000, 'Sjøsprøyt');
  t.eq([M.owe, M.got, S0.cash - c0], [10000, Math.round(0.75 * Math.min(22000, K.kaskoSelf(b)) / 100) * 100, M.got - M.you], 'en firedel: du betaler en firedel av hennes, hun tre firedeler av det din skade koster deg (egenandelen med kasko)');
  b.kasko = null; S0.free = {}; t.eq(K.sjvOwnLoss(b, c), 0, 'den første reparasjonen av skroget er gratis: da koster skaden deg ingenting');
  S0.free = {rep:1}; t.eq(K.sjvOwnLoss(b, c), 22000, 'uten kasko og etter den første: hele reparasjonen');
  c0 = S0.cash; M = K.sjvSettle(b, {law:'162', fa:0, fb:0}, c, 40000, 'Sjøsprøyt'); t.eq([M.owe, M.got, S0.cash - c0], [0, 0, 0], '§ 162: ingen betaler den andre');

  // ---- the blow: the damage, the log, § 164 on the VHF, the NPC standing by, another player's boat ----
  K.set('S', K.newState()); const S1 = K.get('S'), b1 = S1.boat; b1.type = 'kyst15'; K.applyVessel(); S1.boatName = 'Havbris'; S1.home = 'finnsnes';
  const at = K.P(69.30, 17.55); b1.pos = {x:at.x, y:at.y}; b1.heading = 0; b1.status = 'sailing'; b1.v = 8; b1.port = null; S1.cash = 1e6; S1.free = {rep:1};
  S1.log.push({t:S1.t, no:'Kastet loss fra Husøy.', en:'Cast off from Husøy.'});
  const H1 = S1.t / 60, n = {id:'c99', name:'Sjøsprøyt', type:'sjark', p:{x:at.x, y:at.y - 0.008}, hd:90 * R, cog:90 * R, v:9, st:'out', coast:true, L:10.5, B:4, T:1.5, cls:'pow'};
  const pre = {p:{x:at.x, y:at.y}, hd:0, cog:0, v:8};
  const rec = K.sjvBlow(n, 6, 5e4, H1, pre), logs = S1.log.slice(-3).map(l => l.no).join(' | '), vhf = (S1.radio || []).filter(r => r.from === 'VHF 16');
  t.ok(rec && rec.kn === 6 && b1.dmg && b1.dmg.h > 0, 'støtet på 6 knop skader ditt skrog (hullHit)', rec && {kA:rec.kA, kB:rec.kB, dmg:b1.dmg});
  t.ok(rec.kA < rec.kB, 'den tyngre kystbåten (75 t) tar mindre av støtet enn sjarken (32 t): massene', [rec.kA, rec.kB]);
  t.ok(/Sammenstøt med «Sjøsprøyt», 6,0 knop/.test(logs) && /sjøloven § 16[12]/.test(logs), 'dagboka: sammenstøtet og skylda', logs);
  t.ok(vhf.length === 2 && /«Havbris», LK|«Havbris», L[FGHKM]\d{4}/.test(vhf[0].no) && /hjemsted Finnsnes/.test(vhf[0].no) && /fra Husøy/.test(vhf[0].no) && /Trenger dere hjelp/.test(vhf[0].no) && /Ingen er skadet/.test(vhf[1].no),
    '§ 164 på VHF: navnet, kjenningssignalet, hjemstedet, hvor du kommer fra, og om de trenger hjelp; svaret fra den andre', vhf.map(v => v.no));
  t.ok(K.SJV.E.has('c99') && K.SJV.E.get('c99').why === '164', 'NPC-en blir liggende (§ 164), lokalt på den felles banen');
  const stood = K.sjvPose(n, K.SJV.E.get('c99'), H1 + 0.02), later = K.sjvPose(n, K.SJV.E.get('c99'), H1 + K.SJV.STAND - 0.001);
  t.ok(stood.v === 0 && Math.abs(stood.p.x - n.p.x) < 1e-12 && later.v === 0, 'hun ligger der støtet var mens hun venter', [stood.p, later.v]);
  t.eq(S1.clashes.length, 1, 'sammenstøtet er lagret (for Sikkerhet-kortet i Ø11.7)');
  const cB = S1.cash; t.eq([K.sjvBlow(n, 6.2, 5e4, H1 + 0.001, pre), S1.clashes.length, S1.cash], [null, 1, cB], 'et nytt støt rett etter, ikke hardere: samme sammenstøt, ingen ny skade og ingen ny betaling');
  // another player's boat: no damage to her, no money, only the message (ui/10n-hail.js)
  let hooked = null; K.hooks.onClash = (q, r) => { hooked = r; };
  const c1 = S1.cash, pr = K.sjvBlow({id:'p42', name:'Nordlys', type:'sjark', p:{x:at.x + 0.01, y:at.y}, hd:0, cog:0, v:5, player:true, L:10.5, B:4}, 5, 4e4, H1 + 0.002, pre);
  t.ok(pr.peer && pr.oth === 0 && pr.owe === 0 && pr.got === 0 && S1.cash === c1 && !K.SJV.E.has('p42') && hooked && hooked.peer, 'en annen spillers båt: ingen skade, ingen betaling, hun blir ikke stoppet, og meldingen går ut', pr);
  t.ok(/en annen spillers båt og tar ikke skade/.test(S1.log.slice(-2).map(l => l.no).join(' ')), 'dagboka sier at den andre spillerens båt ikke tar skade');
  K.hooks.onClash = null;
  // nothing while the time away is caught up (prinsipp 4): the model's step does nothing with the manoeuvring model off
  K.DYN.on = false; const dmg0 = JSON.stringify(b1.dmg), d = {X:at.x * 1000, Y:(at.y - 0.002) * 1000, psi:0, u:4, v:0, r:0};
  t.eq(K.sjvTouch(b1, d, K.dynCalOf(b1).P), null, 'i catchUp (spillet lukket): ingen kontakt og ingen skade');
  t.eq(JSON.stringify(b1.dmg), dmg0, 'skroget er som før');
  // with the game running: a step into a vessel laid in the list near her gives the blow, the impulse and the stand-by
  K.DYN.on = true; K.SJV.vid = S1.cur; K.SJV.at = S1.t / 60; K.SJV.clash.clear(); K.SJV.E.clear(); K.SJV.tc.wall = 0;
  const Pm = K.dynCalOf(b1).P, Hn = S1.t / 60, m = {id:'c77', name:'Havørn', type:'sjark', p:{x:d.X / 1000, y:(d.Y - 8) / 1000}, hd:90 * R, cog:90 * R, v:0, st:'out', coast:true, L:10.5, B:4, T:1.5, cls:'pow'};
  K.SJV.tl = {vid:S1.cur, H:Hn, X:d.X, Z:d.Y, v:[{n:m, x:d.X, z:d.Y - 8, ve:0, vz:0, hd:90 * R, L:10.5, B:4, m:K.sjvMass(m)}], f:[], g:[]};
  const u0 = d.u, tr = K.sjvTouch(b1, d, Pm);
  t.ok(tr && tr.id === 'c77' && d.u < u0 && K.SJV.nClash >= 1, 'manøvreringsmodellens steg: stevnen inn i en som ligger stille gir støtet, og farten tas av (impulsen)', tr && {kn:tr.kn, u0, u:+d.u.toFixed(2), fa:tr.fa});
  t.eq([tr.law, tr.fa], ['161', 1], 'hun lå stille: din skyld');
  // one giving way off her course when it happens stands by with the offset she has, and goes back to her course at her turn's rate after
  K.SJV.E.clear(); const Eg = {id:'c66', side:1, nx:0.9, ny:0.1, tgt:0.3, rate:4, t0:Hn - 0.05, t1:null, why:'15', slow:false, f:0.35, v:9};
  K.SJV.E.set('c66', Eg); const offAt = K.sjvOffAt(Eg, Hn);
  K.sjvStandBy({id:'c66', name:'Ingrid', p:{x:1, y:2}, hd:0, v:9, coast:true, L:12}, Hn); const Es = K.SJV.E.get('c66');
  t.ok(Es.why === '164' && Math.abs(K.sjvOffAt(Es, Hn + 0.01) - offAt) < 1e-9 && K.sjvOffAt(Es, Es.t1 + 0.02) < offAt && K.sjvOffAt(Es, Es.t1 + 1) === 0,
    'hun som veik da det skjedde, blir liggende med avviket, og går tilbake til banen etter ventetiden', [offAt, K.sjvOffAt(Es, Es.t1 + 0.02)]);
  t.ok(Math.abs(K.sjvLagAt(Es, Es.t1) - K.SJV.STAND) < 1e-9, 'etter ventetiden ligger hun så langt etter sin kurs som hun ventet');
  // the look's sweep (lying still at sea, not in the manoeuvring model): a coast boat at 10 knots into your side between two looks
  K.SJV.E.clear(); K.SJV.clash.clear(); K.SJV.lp.clear(); K.SJV.trail.clear(); b1.status = 'idle'; b1.v = 0; b1.dmg = null; b1.damage = 0;
  const ax = b1.pos.x, ay = b1.pos.y, H2 = Hn + 0.01, dts = 6 / 3600, vk = 10 * NM / 3600;   // (km a game second)
  K.SJV.lp.set('c55', {H:H2 - dts, ax, ay, ahd:0, bx:ax + vk * 6 - 0.002, by:ay, bhd:270 * R});
  const wn = {id:'c55', name:'Sjøsprøyt', type:'sjark', p:{x:ax - 0.002, y:ay}, hd:270 * R, cog:270 * R, v:10, st:'out', coast:true, L:10.5, B:4, T:1.5, cls:'pow'};
  const sw = K.sjvSweep(wn, {p:{x:ax, y:ay}, hd:0, cog:0, v:0, cls:'pow', L:15, B:6.6}, H2, 1, true);
  t.ok(sw && sw.kn > 8 && sw.law === '161' && sw.fb === 1 && (b1.pos.x !== ax || b1.pos.y !== ay), 'sveipet mellom to blikk: hun gikk inn i siden på deg mens du lå stille; hennes skyld (regel 2), og du er skjøvet ut', sw && {kn:sw.kn, fb:sw.fb, sit:sw.sit});
  t.eq(K.sjvSweep(wn, {p:{x:ax, y:ay}, hd:0, v:0, cls:'pow', L:15, B:6.6}, H2 + dts, 1, false), null, 'uten at spillet går (on false): ingen sveip');
}
