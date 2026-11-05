// The factory aboard the autoliner (H2b of docs/planer/havsteget-h2-autoline.md, 05.11.2026): the conversion factors (SPECIES uh, the
// official tables in the plan's chapter 2b), the hold in product weight (V2 A: what is frozen gutted and headed fills the room by its
// product weight, the quota and the price go by the round weight), the plate freezers' 15 t of product a day and the haul that slows when
// they cannot keep up, the generators' fuel at sea, the hook change aboard (about 5 % of the gear a day), the trip's limits, the frozen
// catch landed on pallets (V1 A, about 10 t an hour) and the share by § 6. A whole trip in the built game is in tests/autolinetest.py.
export default function (t){
  const K = t.K, {SPECIES, VESSELS, LINE_KINDS, OPPG} = K;
  const S = K.newState(); K.set('S', S);
  const B = K.BOAT; Object.assign(B, VESSELS.autoliner); S.boat.type = 'autoliner';

  // the conversion factors, round weight per kg gutted without head (Norwegian-Russian 2023; Norwegian with J-128-2018)
  const UH = {torsk:1.5, hyse:1.4, sei:1.35, lange:1.4, brosme:1.4, uer:1.7, kveite:1.35, blakveite:1.32};
  for (const sp in UH) t.near(SPECIES[sp].uh, UH[sp], 1e-9, `omregningsfaktoren for ${sp} (sløyd uten hode)`);

  // the hold in product weight: frozen gutted fish by its factor, the rest as it lies; the round weight is still what the hold says
  S.hold = [{sp:'torsk', kg:1500, n:500, cls:0, fresh:100, gut:true, iced:true, frozen:true}, {sp:'hyse', kg:700, n:400, cls:0, fresh:100, gut:true, iced:true, frozen:true},
    {sp:'torsk', kg:300, n:100, cls:0, fresh:100, gut:false, iced:false}, {sp:'brosme', kg:140, n:50, cls:0, fresh:100, gut:false, iced:true, frozen:true}];
  t.near(K.holdTotal(), 2640, 1e-6, 'rund vekt i lasten (kvoten og prisen)');
  t.near(K.holdLoad(), 1000 + 500 + 300 + 140, 1e-6, 'produktvekt i rommet: fryst sløyd uten hode delt på faktoren, resten som det ligger');
  // 400 t of room take about 590 t of round cod and haddock (the trip's catch in round weight a full hold holds)
  const mix = 0.64 * UH.torsk + 0.36 * UH.hyse; t.ok(K.capHold() === 400000 && 400 * mix > 570 && 400 * mix < 600, `400 t rom gir om lag ${Math.round(400 * mix)} t rund vekt torsk og hyse`);

  // the plate freezers: with hands enough at the table and the freezers (workTeam stubbed), no more than 15 t of product a day go in
  const wt = K.workTeam; K.set('workTeam', () => ({n:4, sum:4, eff:1, crew:[], me:false}));
  S.boat.fuel = 100000; S.boat.status = 'fishing';
  S.hold = [{sp:'torsk', kg:30000, n:10000, cls:0, fresh:100, gut:true, iced:false, hr:0, hook:true}];
  for (let m = 0; m < 1440; m++) K.deckMinute();
  const frozen = S.hold.filter(x => x.frozen).reduce((a, x) => a + K.prodKg(x), 0);
  t.near(frozen, VESSELS.autoliner.freezeT, 30, 'platefryserne tar 15 t produkt i døgnet');
  // with the tanks dry the freezers stop
  S.boat.fuel = 0; const f0 = frozen; for (let m = 0; m < 60; m++) K.deckMinute();
  t.near(S.hold.filter(x => x.frozen).reduce((a, x) => a + K.prodKg(x), 0), f0, 1e-6, 'uten drivstoff fryser ingenting');
  K.set('workTeam', wt); S.boat.fuel = 100000;
  // what waits in the bleeding tub slows the haul: from half the tub (2 t on the autoliner) to a fifth of the pace at a full one
  const tub = VESSELS.autoliner.tubCap, g = {op:'haul'};
  S.hold = [{sp:'torsk', kg:tub * 0.4, n:1, cls:0, fresh:100, gut:true, iced:false}]; const s1 = K.haulSlow(g);
  S.hold[0].kg = tub * 0.75; const s2 = K.haulSlow(g); S.hold[0].kg = tub; const s3 = K.haulSlow(g);
  t.ok(s1 === 1 && Math.abs(s2 - 0.6) < 1e-9 && Math.abs(s3 - 0.2) < 1e-9, `draget går saktere når fisken venter på fryseriet: ${s1}, ${s2.toFixed(2)}, ${s3.toFixed(2)}`);

  // the generators at sea: 95 l an hour lying still or fishing, nothing extra under way (the main engine's lph has them in)
  S.hold = []; S.boat.status = 'idle'; S.boat.fuel = 10000; for (let m = 0; m < 60; m++) K.plantFuel(S.boat);
  t.near(10000 - S.boat.fuel, 95, 1e-6, 'generatorene bruker 95 l i timen når båten ligger eller fisker');
  S.boat.status = 'sailing'; S.boat.fuel = 10000; for (let m = 0; m < 60; m++) K.plantFuel(S.boat);
  t.eq(S.boat.fuel, 10000, 'under fart er de med i hovedmotorens forbruk');
  // a fishing day (8 lenker set at about 8 knots and hauled at under 2, the generators all day) and a share of steaming land near 3,900 l
  // a day at sea (the profitability survey 2024: 1.08 million l a year, 277 days at sea)
  const setH = 8 * LINE_KINDS.auto.hooks * LINE_KINDS.auto.setH, haulH = 8 * LINE_KINDS.auto.hooks * LINE_KINDS.auto.haulH;
  const day = setH * K.fuelLph(7.6, 8) + haulH * K.fuelLph(1.75, 8) + 24 * VESSELS.autoliner.plantLph, steam = 24 * K.fuelLph(VESSELS.autoliner.vcruise, 8), avg = 0.9 * day + 0.1 * steam;
  t.ok(avg > 3300 && avg < 4500, `et snittdøgn på sjøen med 10 % gange bruker ${Math.round(avg)} l (lønnsomhetsundersøkelsen: om lag 3 900)`);

  // the hook change aboard: 5 % of the line's hooks a day from the store, the bad hooks first, then the worn line
  const pg = S.pgear, L = K.autoL(pg); K.careInit(pg); Object.assign(L, {miss:0.02, bent:0.02, cond:0.6, max:1}); pg.hooks = 10000;
  S.boat.status = 'fishing'; S.crew = [K.genCrew(), K.genCrew()];   // (hands aboard to do it)
  for (let h = 0; h < 24; h++) K.autoFixHour();
  t.near(10000 - pg.hooks, 0.05 * VESSELS.autoliner.autoHooks, 30, 'mannskapet bytter om lag 2 000 kroker i døgnet (5 %)');
  t.ok(L.miss < 0.001 && L.bent < 0.001 && L.cond > 0.6, `de manglende og bøyde krokene er byttet, og lina er bedre (${L.cond})`);
  // a day of wear (as wearOf has it on the mean: a lenke hauled once a day with 1,000 kg on it, on deep water) against a day of hook
  // change: the line holds up over six weeks
  Object.assign(L, {miss:0, bent:0, cond:1}); pg.hooks = 1e6; const fw = (1 + 1000 * 400 / LINE_KINDS.auto.hooks / 60) * 1.25;
  for (let d = 0; d < 42; d++){ L.cond = Math.max(0, L.cond - 0.012 * fw); L.miss += 0.004 * fw; L.bent += 0.006 * fw; for (let h = 0; h < 24; h++) K.autoFixHour(); }
  t.ok(L.cond > 0.5 && L.miss + L.bent < 0.02 && K.lineQ(L) > 0.9, `etter seks uker: lina ${L.cond.toFixed(2)}, kroker borte og bøyd ${((L.miss + L.bent) * 100).toFixed(1)} %, fangstfaktor ${K.lineQ(L).toFixed(2)}`);
  // no hooks in store: nothing changed
  pg.hooks = 0; Object.assign(L, {miss:0.05, bent:0.05}); K.autoFixHour(); t.ok(L.miss === 0.05 && L.bent === 0.05, 'uten kroker om bord byttes ingenting');

  // the trip's limits: the bait, the hooks and the room last so many days at the trip's pace (the vessel's own until half a day has gone)
  pg.hooks = 20000; K.baitOf(pg).saury = 6800; S.hold = []; S.boat.fuel = 200000; S.boat.trip = {t0:0, fuelL:0, iceKg:0, baitKr:0, seaM:0};
  const R = K.tripLeft(S.boat);
  t.near(R.bait, 10, 0.01, 'agnet: 6,8 t er 10 døgn med 8 lenker à 85 kg i døgnet');
  t.near(R.hooks, 10, 0.01, 'krokene: 20 000 er 10 døgn med krokbytte');
  t.ok(R.hold > 70 && R.hold < 75, `lasterommet: 400 t produkt er om lag ${R.hold.toFixed(0)} døgn med 5,5 t i døgnet`);
  t.ok(R.fuel > 50 && R.fuel < 70, `drivstoffet: 200 000 l er om lag ${R.fuel.toFixed(0)} døgn med fiske i havn`);
  S.boat.trip = {t0:0, fuelL:40000, iceKg:0, baitKr:0, seaM:10 * 1440}; S.hold = [{sp:'torsk', kg:75000, n:1, cls:0, fresh:100, gut:true, iced:true, frozen:true}];
  const R2 = K.tripLeft(S.boat); t.near(R2.hold, 350000 / 5000, 0.5, 'etter ti døgn regnes plassen etter fangsten så langt (50 t produkt)');
  t.near(R2.fuel, 200000 / 4000, 0.5, 'og drivstoffet etter forbruket så langt (4 000 l i døgnet)');

  // the landing: a freezer vessel's frozen catch on pallets of a tonne of product, a lift every 6 minutes, about 10 t an hour
  S.hold = [{sp:'torsk', kg:300000, n:1, cls:0, fresh:100, gut:true, iced:true, frozen:true}, {sp:'hyse', kg:140000, n:1, cls:0, fresh:100, gut:true, iced:true, frozen:true}];
  const lp = K.landPlan('autoliner', K.holdTotal());
  t.ok(lp.kind === 'pall' && lp.n === 300 && lp.lifts === 300 && lp.pk === 300000, `300 t produkt (${K.holdTotal() / 1000} t rund vekt) er ${lp.n} paller`);
  t.ok(lp.dur / 60 > 29 && lp.dur / 60 < 31.5, `lossingen tar ${(lp.dur / 60).toFixed(1)} timer (om lag 10 t i timen)`);
  t.ok(Math.abs(K.landLiftT(lp, 10) - K.landLiftT(lp, 9) - 6) < 1e-9, 'ett løft hvert sjette minutt');
  // the coast boats and the tubs are as before
  for (const k in B) delete B[k]; Object.assign(B, VESSELS.sjark); S.boat.type = 'sjark';
  S.hold = [{sp:'torsk', kg:2500, n:1, cls:0, fresh:100, gut:true, iced:true}];
  const lc = K.landPlan('sjark', 2500); t.ok(lc.kind === 'tub' && lc.n === 5 && lc.dur === 1 + 5 * 2.5 + 5 && !lc.lf, `en sjark med 2,5 t lander i ${lc.n} kar på ${lc.dur} min som før`);
  t.near(K.holdLoad(), 2500, 1e-9, 'på en kystbåt er lasten rund vekt som før');

  // the share by § 6 for 15 aboard a 45.4 m autoliner: 47.5 % (the survey: 27.8 of about 59 MNOK)
  t.near(K.oppgPct(OPPG.hav, 15, 45.4), 47.5, 1e-9, '§ 6: 15 mann på 44–49 m får 47,5 % av delingsfangsten');
  t.near(K.oppgPct(OPPG.hav, 30, 45.4), 51.5, 1e-9, '§ 6: tabellen for 22 mann og flere');
}
