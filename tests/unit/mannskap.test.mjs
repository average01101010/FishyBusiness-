// The crew's meals and the cook (Ø8b M2 and M3, Jonas 06.11.2026, docs/systemer/folk-om-bord.md 5.19b): the fixed hours on the game's
// clock (frokost 06:30, lunsj 12:30, middag 18:30, nattmat 00:30), the cook starting 30 minutes before, the best free cook also under 3
// (1 dry bread, 2 hot dogs), a meal nobody is awake for passed over without counting, dry bread when nobody is free within the hour,
// and the galley learnt three times as fast as the other skills.
export default function (t){
  const K = t.K; K.set('S', K.newState());
  const S = K.get('S'), MEAL = K.MEAL, D = 1440;
  // the game's clock starts at 06:00 (EPOCH), so S.t = 0 is 06:00 on day 0
  t.eq([K.dayMin(0), K.dayMin(30), K.dayMin(18 * 60), K.dayMin(D + 60)], [360, 390, 0, 420], 'minuttet på døgnet etter klokka i spillet (06:00, 06:30, 00:00, 07:00)');
  const hm = x => { const m = K.dayMin(x); return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); };
  t.eq([0, 30, 31, 6 * 60 + 29, 6 * 60 + 30, 12 * 60 + 29, 17 * 60 + 59, 18 * 60 + 30].map(x => hm(K.nextMealAt(x))), ['06:30', '12:30', '12:30', '12:30', '18:30', '18:30', '00:30', '06:30'],
    'neste måltid: frokost 06:30, lunsj 12:30, middag 18:30, nattmat 00:30');
  t.eq(K.nextMealAt(17 * 60 + 59), 18 * 60 + 30, 'nattmaten er neste døgn, 00:30');
  t.eq([30, 390, 750, 1110].map(x => K.mealName(x)[0]), ['frokost', 'lunsj', 'middag', 'nattmat'], 'måltidenes navn');

  // ---- a boat at sea with three hands, cooks of 1.2, 2.4 and 1.6 ----
  const b = S.boat; b.type = 'sjark'; K.applyVessel(); const pt = K.portById('finnsnes'); b.pos = {x:pt.p.x + 2, y:pt.p.y + 1};
  const C = [K.genCrew(), K.genCrew(), K.genCrew()]; C.forEach((c, i) => { c.name = ['Ola A', 'Kari B', 'Per C'][i]; c.attr.kokk = [1.2, 2.4, 1.6][i]; c.off = false; c.bi = false; c.sleepW = false; c.idle = null; });
  S.crew = C; S.me = S.cur;
  const run = (from, to, st) => { for (S.t = from; S.t < to; S.t++){ b.status = st(S.t); K.workMinute(); } };
  // fishing all day from 06:00: breakfast at 06:30 (the cook can make it), then lunch started at 12:00 by the best cook, served 12:30
  b.status = 'fishing'; S.t = 0; S.meal = null;
  run(0, 6 * 60, () => 'fishing');
  let M = S.meal; t.eq([M.last.nm[0], hm(M.last.t), hm(M.due), M.hist.length], ['frokost', '06:30', '12:30', 1], 'ut 06:00: frokost 06:30 (kokken rekker den), så lunsj 12:30');
  run(6 * 60, 6 * 60 + 30, () => 'fishing');
  t.ok(M.cook && M.cook.id === C[1].id, 'kokken begynner 30 minutter før: den beste av dem som er ledige (Kari, kokk 2,4), også under 3', M.cook);
  run(6 * 60 + 30, 6 * 60 + 31, () => 'fishing');
  t.eq([M.hist.slice(-1)[0], M.last.by, M.last.nm[0], hm(M.last.t), hm(M.due)], [2, C[1].id, 'lunsj', '12:30', '18:30'], 'lunsj 12:30: pølser i lompe (2) fra Kari, så middag 18:30');
  // dinner, then the night lying still with everyone at rest: the night meal is passed over and does not count; breakfast comes at 06:30
  run(6 * 60 + 31, 12 * 60 + 31, () => 'fishing');
  t.eq([M.hist.length, M.last.nm[0]], [3, 'middag'], 'middag 18:30');
  run(12 * 60 + 31, D + 31, x => x < 16 * 60 ? 'fishing' : x < D ? 'idle' : 'fishing');
  t.eq([M.hist.length, M.skip || 0, M.last.nm[0], hm(M.last.t)], [4, 1, 'frokost', '06:30'], 'nattmaten 00:30 med båten stille og alle i ro: hoppet over uten å telle; frokost 06:30');
  // at night with work going on, those on a break are awake: the night meal is cooked and eaten; with the crew asleep in the bunks and
  // you alone at the helm, it is passed over (the skipper does not cook)
  const night = (A, from) => { S.meal = {due:from + 30, cook:null, hist:[]}; for (S.t = from; S.t <= from + 30 + MEAL.wait; S.t++) K.mealMinute(A); return S.meal; };
  C.forEach(c => { c.idle = null; }); b.status = 'fishing';
  let N = night([{c:C[0], st:'haling'}, {c:C[1], st:'kokk'}, {c:C[2], st:'pause'}], 3 * D + 18 * 60);
  t.eq([N.last.nm[0], hm(N.last.t), N.last.by, N.skip || 0], ['nattmat', '00:30', C[1].id, 0], 'nattmat 00:30 med arbeid om natta: Kari lager den');
  C[1].idle = 'sleep'; C[2].idle = 'sleep'; b.status = 'sailing';
  N = night([{c:null, st:'ror'}, {c:C[1], st:'pause'}, {c:C[2], st:'pause'}], 4 * D + 18 * 60);
  t.eq([N.hist.length, N.skip, hm(N.due)], [0, 1, '06:30'], 'under seiling om natta med mannskapet i køya og deg ved roret: nattmaten hoppes over');
  t.ok(K.crewAsleep({c:C[1], st:'pause'}, []) && !K.crewAsleep({c:C[0], st:'pause'}, [{c:C[0], st:'pause'}, {c:C[1], st:'haling'}]), 'sover: i køya, eller på pause om natta når ingen arbeider');
  C.forEach(c => { c.idle = null; }); b.status = 'idle';
  N = night([{c:C[1], st:'kokk'}], 5 * D + 6 * 60);   // (the one aboard at the stove, at noon with the boat lying still: she is awake, the meal is made)
  t.eq([N.hist.length, N.last && N.last.by], [1, C[1].id], 'den eneste om bord står ved komfyren: hun er våken, og lunsjen blir laget');
  C.forEach(c => { c.idle = null; });
  // nobody free within the hour (all hauling) is dry bread; nobody at all who can be spared
  t.eq(K.cookPick([{c:C[0], st:'haling'}, {c:C[1], st:'haling'}, {c:null, st:'pause'}]), null, 'ingen ledig (alle haler, skipperen lager ikke mat): ingen kokk');
  t.eq(K.cookPick([{c:C[0], st:'pause'}, {c:C[2], st:'pause'}, {c:C[1], st:'haling'}]).c.name, 'Per C', 'den beste av dem som har pause (Per 1,6 foran Ola 1,2)');
  t.eq(K.cookPick([{c:C[0], st:'fiske'}, {c:C[1], st:'haling'}]).c.name, 'Ola A', 'ingen på pause: en som jukser, stopper for det');
  { const A = [{c:C[0], st:'haling'}, {c:C[1], st:'haling'}, {c:C[2], st:'blogg'}]; b.status = 'fishing'; S.meal = {due:2 * D + 30, cook:null, hist:[3]};
    for (S.t = 2 * D; S.t <= 2 * D + 30 + MEAL.wait; S.t++) K.mealMinute(A);
    const N = S.meal; t.eq([N.hist, N.last.by, hm(N.last.t), hm(N.due)], [[3, 1], null, '07:30', '12:30'], 'alle i arbeid en hel time etter frokosttida: tørre brødskiver fra ingen 07:30, så lunsj'); }
  // the cook taken from the stove (to the helm) before the meal is ready, and nobody else free: dry bread at the hour's end, not stuck
  { b.status = 'fishing'; S.meal = {due:6 * D + 390, cook:null, hist:[]}; const A1 = [{c:C[1], st:'kokk'}, {c:C[0], st:'haling'}], A2 = [{c:C[1], st:'ror'}, {c:C[0], st:'haling'}];
    for (S.t = 6 * D + 360; S.t <= 6 * D + 390 + MEAL.wait; S.t++) K.mealMinute(S.t < 6 * D + 375 ? A1 : A2);
    t.eq([S.meal.hist, S.meal.cook, hm(S.meal.due)], [[1], null, '18:30'], 'kokken tatt til roret halvveis: tørre brødskiver når timen er ute, så middag'); }
  // no galley aboard: nobody is taken to the stove, and the packed lunch comes at the hour
  { b.type = 'snekke'; K.applyVessel(); S.meal = {due:7 * D + 390, cook:null, hist:[]}; S.t = 7 * D + 365;
    t.ok(!K.mealDue(), 'uten bysse har kokken ingenting å gjøre: ingen tas fra fisket'); for (; S.t <= 7 * D + 390; S.t++) K.mealMinute([{c:C[0], st:'fiske'}]);
    t.eq([S.meal.hist, S.meal.last.nm[0]], [[2], 'lunsj'], 'uten bysse: matpakke og kaffe fra termosen (2) til lunsj'); b.type = 'sjark'; K.applyVessel(); }
  // ---- learning: the galley three times as fast ----
  const mk = () => { const c = K.genCrew(); c.age = 30; c.morale = 60; c.traits = []; c.attr.kokk = 2; c.gear.sloy = 2; return c; };
  const a = mk(), z = mk(); a.wk = {kokk:60}; z.wk = {sloy:60}; K.learnHour(a); K.learnHour(z);
  t.near((a.attr.kokk - 2) / (z.gear.sloy - 2), 3, 1e-9, 'en time ved komfyren lærer tre ganger så mye som en time ved sløyebordet', [a.attr.kokk, z.gear.sloy]);
  let c = mk(), h = 0; while (c.attr.kokk < 2.5 && h < 500){ c.wk = {kokk:60}; K.learnHour(c); h++; }
  t.ok(h >= 10 && h <= 25, 'fra 2 til 2,5 (fiskekaker) for en på 30: rundt 17 timer ved komfyren, fem uker med to timer om dagen', h);

  // ---- «Tom for is» (Ø8b M5 A, Jonas 06.11.2026): once when the ice runs out, then once a day while it stays out; it starts again
  // when the ice is filled. One hand on the icing (workTeam stubbed), a sjark with 3 kg of ice and 100 kg of gutted cod on deck ----
  { const wt = K.get('workTeam'), D = 1440;
    K.set('workTeam', st => st === 'is' ? {n:1, sum:1, eff:1, crew:[], me:true} : {n:0, sum:0, eff:1, crew:[], me:false});
    b.type = 'sjark'; K.applyVessel(); S.settings.ice = true; S.settings.gut = true; b.status = 'fishing'; b.trip = null;
    const cod = kg => ({sp:'torsk', kg, n:Math.round(kg / 3), fresh:1, gut:true});
    const lines = () => S.log.filter(l => l.no === 'Tom for is. Fangsten ises ikke.').map(l => l.t);
    const run = (from, to) => { for (S.t = from; S.t < to; S.t++) K.deckMinute(); };
    S.log = []; S.lastIceWarn = -1e9; b.ice = 3; S.hold = [cod(100)];
    run(10 * D, 10 * D + 1);
    t.eq([lines().length, S.hold.filter(x => x.iced).reduce((a, x) => a + x.kg, 0) > 9], [0, true], 'første minutt: de 3 kg isen ises ned (10 kg torsk), ingen linje ennå');
    run(10 * D + 1, 10 * D + 2);
    t.eq(lines(), [10 * D + 1], 'isen tar slutt: «Tom for is» én gang');
    run(10 * D + 2, 10 * D + 3 * 60);
    t.eq(lines().length, 1, 'ikke igjen etter to timer (før: hver andre time)');
    run(10 * D + 3 * 60, 13 * D);
    t.eq(lines(), [10 * D + 1, 11 * D + 1, 12 * D + 1], 'så én gang per døgn så lenge den er tom: 3 linjer på tre døgn (før 36)');
    // ice from the mottak (400 kg, 20 % of the ice room): the spell ends, and when it runs out again the line comes at once, not a day after
    b.ice = 400; S.hold.push(cod(2000)); run(13 * D, 13 * D + 1);
    t.eq([S.lastIceWarn, lines().length], [-1e9, 3], 'isen fylt (400 kg): tom-perioden er over');
    run(13 * D + 1, 13 * D + 3 * 60);
    const L = lines(); t.ok(L.length === 4 && L[3] > 13 * D + 60 && L[3] < 13 * D + 3 * 60, 'på nytt etter påfylling: linja kommer straks isen er brukt opp igjen, ikke et døgn etter', L);
    // a little ice (under 5 % of the ice room) is used up at once and does not end the spell
    b.ice = 50; run(13 * D + 3 * 60, 13 * D + 4 * 60);
    t.eq(lines().length, 4, 'litt is (50 kg, under 5 %) brukes opp og avslutter ikke tom-perioden: ingen ny linje');
    // an old game with only S.lastIceWarn, the line given an hour ago in the middle of a spell: the next one a day after it, not now
    S.log = []; b.ice = 0; S.lastIceWarn = 20 * D - 60; run(20 * D, 20 * D + 120);
    t.eq(lines().length, 0, 'gammelt spill med S.lastIceWarn for en time siden: ingen ny linje nå');
    run(20 * D + 120, 21 * D);
    t.eq(lines(), [21 * D - 60], 'den neste et døgn etter den gamle linja');
    // the freezer hold freezes with no ice: never «Tom for is»
    const fzType = Object.keys(K.VESSELS).find(k => K.VESSELS[k].hold && K.VESSELS[k].hold.kind === 'frys');
    if (fzType){ b.type = fzType; K.applyVessel(); S.log = []; S.lastIceWarn = -1e9; b.ice = 0; b.fuel = 1e6; S.hold = [cod(50000)]; run(22 * D, 22 * D + 600);
      t.eq(lines().length, 0, 'med fryserom (' + fzType + ') og ingen is: aldri «Tom for is»'); }
    K.set('workTeam', wt); b.type = 'sjark'; K.applyVessel(); S.hold = []; S.log = [];
  }
}
