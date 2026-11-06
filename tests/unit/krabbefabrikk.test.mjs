// The snow crab aboard (H3b of docs/planer/havsteget-h3-snokrabbe.md, 06.11.2026): the factor from clusters to round weight by year
// (1.61 to 2025, 1.49 from 2026), the hold in the clusters' weight and the tanks beside it, the factory's 12 t of product a day, the live
// crab by the notes' size groups into the tanks and the overflow to the factory, the dying in the tanks against the notes for 2026 (2.9 %
// dead on the live landings), the prices of the clusters, the live crab and the dead crab, the extra quota for the live crab only, the
// landing on pallets and in tubs, the crew of 22 in two crews that go five weeks on, the share by § 20 and the trip's limits. Two days
// in the built game with the teams and the landings at a plant are in tests/krabbefabrikktest.py.
export default function (t){
  const K = t.K, {SPECIES, VESSELS, SNOT, SNOP, KARLV, PALL} = K;
  const S = K.newState(); K.set('S', S);
  const B = K.BOAT; for (const k in B) delete B[k]; Object.assign(B, VESSELS.snokrabbe); S.boat.type = 'snokrabbe';
  S.lic = {id:'krab', hav:true, kf:1, hl:'Snøkrabbetillatelse'}; S.crew = []; S.lag = null;
  const Hy = (y, m, d, h = 6) => (Date.UTC(y, m, d, h) - K.EPOCH) / 36e5, sp = SPECIES.snokrabbe;

  // the factor from clusters to round weight by the year (the notes: 1.61 in 2024 and 2025, 1.49 from 2026)
  t.ok(K.snoUh(Hy(2025, 2, 1)) === 1.61 && K.snoUh(Hy(2026, 2, 1)) === 1.49 && K.snoUh(Hy(2030, 2, 1)) === 1.49 && K.snoUh(Hy(2020, 2, 1)) === 1.61, 'omregningsfaktoren for klør: 1,61 til 2025, 1,49 fra 2026');
  S.t = Hy(2027, 1, 10) * 60; t.near(sp.uh, 1.49, 1e-9, 'SPECIES.snokrabbe.uh er årets faktor');
  // the hold: the clusters by their weight, the dead crab round, the live crab in the tanks and not in the hold's room
  S.hold = [{sp:'snokrabbe', cls:0, kg:14900, n:27000, gut:true, iced:true, frozen:true}, {sp:'snokrabbe', cls:2, kg:300, n:500, gut:true, iced:true, frozen:true, rund:true},
    {sp:'snokrabbe', cls:4, kg:20000, n:33000, tank:true, hr:0}];
  t.near(K.holdLoad(), 10000 + 300, 1e-6, 'lasterommet: klørne i produktvekt (14,9 t rund vekt er 10 t klør) og den døde krabben rund');
  t.near(K.tankLoad(), 20000, 1e-9, 'tankene: 20 t levende krabbe, utenfor lasterommet'); t.near(K.holdTotal(), 35200, 1e-6, 'rund vekt i alt (kvoten og prisen)');
  t.ok(K.tankCap() === 40000 && VESSELS.snokrabbe.tank.m3 === 400, 'tankene tar 40 t levende krabbe (400 m³, 100 kg/m³)');

  // the factory: with hands at the table and the freezers, a day splits, cooks and freezes no more than 12 t of clusters
  const wt = K.workTeam; K.set('workTeam', () => ({n:4, sum:4, eff:1, crew:[], me:false}));
  S.boat.fuel = 100000; S.boat.status = 'fishing'; S.hold = [{sp:'snokrabbe', cls:0, kg:30000, n:54000, gut:false, iced:false, hr:0, hook:false, fresh:100, bled:true}];
  t.ok(K.catchGut() && K.snoVessel(), 'fabrikken deler alltid snøkrabben, uansett innstillingen for fisken');
  for (let m = 0; m < 1440; m++) K.deckMinute();
  const fz = S.hold.filter(x => x.frozen).reduce((a, x) => a + K.prodKg(x), 0), fzR = S.hold.filter(x => x.frozen).reduce((a, x) => a + x.kg, 0);
  t.near(fz, VESSELS.snokrabbe.freezeT, 30, `fabrikken koker og fryser ${(fz / 1000).toFixed(1)} t klør i døgnet (${(fzR / 1000).toFixed(1)} t rund vekt)`);
  t.ok(S.hold.filter(x => x.frozen).every(x => x.gut) && S.hold.some(x => !x.frozen && x.gut), 'krabben er delt før den kokes og fryses, og det som venter er delt');
  // the dead crab is frozen round, not split
  S.hold = [{sp:'snokrabbe', cls:2, kg:200, n:350, gut:true, iced:false, hr:0, hook:false, fresh:100, bled:true, rund:true}];
  for (let m = 0; m < 60; m++) K.deckMinute();
  t.ok(S.hold.length === 1 && S.hold[0].frozen && S.hold[0].rund && Math.abs(K.holdLoad() - 200) < 1e-6, 'den døde krabben fryses rund (til oppmaling), 200 kg i rommet');
  K.set('workTeam', wt);

  // live or frozen for the trip; on a live trip the hard and soft males go into the tanks by the notes' size groups
  S.hold = []; S.boat.snoMode = null; t.ok(!K.snoLive() && K.snoSetMode('lev') && K.snoLive() && !K.snoSetMode('lev'), 'valget per tur: fryst som standard, levende når spilleren velger det');
  const g = {rel:0, kg:0}; K.landSno(g, 4000);
  const tank = S.hold.filter(x => x.tank), cl = new Set(tank.map(x => x.cls)), deadL = S.hold.filter(x => x.rund), fab = S.hold.filter(x => !x.tank && !x.rund);
  t.ok(tank.length && [...cl].every(c => c >= 3 && c <= 6) && cl.has(4) && deadL.length && !fab.length && g.snoS.live === tank.reduce((a, x) => a + x.n, 0), `de levende i tankene etter størrelse (klassene ${[...cl].sort().join(', ')}), de døde runde, ingen til fabrikken: ${g.snoS.live} krabber, ${(K.tankLoad() / 1000).toFixed(2)} t`);
  t.ok(tank.some(x => x.sk > 0) && tank.reduce((a, x) => a + (x.sk || 0), 0) < 0.1 * K.tankLoad(), 'de bløte telles i tankene (de dør lettere)');
  const sz = {}; for (const x of tank) sz[x.cls] = (sz[x.cls] || 0) + x.kg; const szT = Object.values(sz).reduce((a, v) => a + v, 0);
  t.ok((sz[4] || 0) / szT > 0.45 && (sz[3] || 0) / szT < 0.25, `størrelsene: ${Object.keys(sz).sort().map(c => sp.cls[c][2].replace('Levende, ', '') + ' ' + Math.round(100 * sz[c] / szT) + ' %').join(', ')} (sedlene 2025: 800 g og over 21 %, 500–800 g 43 %, 350–500 g 33 %)`);
  // the tanks full: the rest to the factory, said once
  S.hold = [{sp:'snokrabbe', cls:4, kg:39990, n:66000, tank:true, hr:0}]; S.log = []; S.boat.tankFull = null; const g2 = {rel:0, kg:0}; K.landSno(g2, 500);
  t.ok(K.tankLoad() < 40000 + 1 && S.hold.some(x => !x.tank && !x.rund && x.kg > 50) && S.log.filter(l => /Tankene er fulle/.test(l.no)).length === 1, 'tankene fulle: resten til fabrikken som klør, sagt én gang');
  K.snoSetMode('frys'); t.ok(!K.snoLive() && S.hold.some(x => x.tank), 'tilbake til fryst: krabben i tankene blir der til levering');

  // the dying in the tanks. A live trip of nine days in February: out from Båtsfjord, fishing on Sentralbanken day 1.5 to 6.5 with the
  // tanks filling to 32 t, two and a half days to the landing; the notes for 2026: 2.9 % dead by weight (0.3-4.9 % in January-May)
  function liveTrip(m, opts = {}){
    S.hold = []; S.boat.fuel = opts.dry ? 0 : 100000; const H0 = Hy(2027, m, 5, 0), bank = K.P(74.8, 34), port = K.P(70.63, 29.72), kg = opts.kg || 32000, soft = opts.soft || 0.03;
    let dead = 0;
    for (let h = 0; h < 9 * 24; h++){ const H = H0 + h; S.t = H * 60; S.boat.pos = h < 36 || h >= 6.5 * 24 ? port : bank;
      if (h >= 36 && h < 6.5 * 24){ const k = kg / (5 * 24), x = K.addCatch('snokrabbe', k, 4, false, {fresh:100, how:'teine', tank:true}); x.sk = (x.sk || 0) + k * soft; }
      dead += K.snoTankHour(H); }
    const live = K.tankLoad(); return {dead, live, sh:dead / (dead + live)};
  }
  const feb = liveTrip(1), jun = liveTrip(5, {soft:0.15}), dry = liveTrip(1, {dry:true});
  t.ok(feb.sh > 0.022 && feb.sh < 0.036, `en levendetur på ni døgn i februar: ${(feb.sh * 100).toFixed(1)} % død krabbe ved levering (sedlene 2026: 2,9 %)`);
  t.ok(jun.sh > feb.sh * 1.15, `i juni med mer bløtkrabbe og varmere vann i havn: ${(jun.sh * 100).toFixed(1)} % (sedlene: 3,7 % i mai og 8,3 % i juni)`);
  t.ok(dry.sh > 0.3, `uten drivstoff stopper pumpene: ${(dry.sh * 100).toFixed(0)} % død`);
  const lo = liveTrip(1, {kg:12000}); t.ok(lo.sh < feb.sh * 0.6, `glisne tanker (12 t) dør mindre: ${(lo.sh * 100).toFixed(1)} % (Nofima: tettheten)`);
  t.ok(S.hold.some(x => x.rund && x.cls === 2 && !x.tank), 'den døde krabben går til fryseren som rund');

  // the prices: the clusters and the live crab by month (the mean of 2024-2026), the live crab by its size, the dead for meal
  const pt = {id:'x', pf:1}, mean = a => a.reduce((x, v) => x + v, 0) / a.length, open = [11, 0, 1, 2, 3, 4, 5];
  const Hm = (m, d = 15) => Hy(2027, m, d, 12), clu = m => K.snoPrice(pt, {sp:'snokrabbe', cls:0}, Hm(m)), lv = (m, c = 4) => K.snoPrice(pt, {sp:'snokrabbe', cls:c, tank:true}, Hm(m));
  const mC = mean([1, 2, 3].map(clu)), mL = mean([1, 2, 3].map(m => lv(m)));
  t.ok(mC > 95 && mC < 125 && mL > 65 && mL < 90, `klør i februar–april ${mC.toFixed(1)} kr/kg rund vekt, levende 500–800 g ${mL.toFixed(1)} (snittet 2024–2026: 106,5 og 72,4)`);
  t.near(mean(open.map(m => sp.pm[m])), 95.2, 6, `klørne over sesongen etter sedlene per måned: ${mean(open.map(m => sp.pm[m])).toFixed(1)} kr/kg (vektet med fangsten nær 106,5)`);
  t.ok(lv(2, 3) > lv(2, 4) && lv(2, 4) > lv(2, 5) && lv(2, 6) >= sp.cls[6][1], `levende etter størrelse i mars: ${[3, 4, 5, 6].map(c => lv(2, c).toFixed(1)).join(' / ')} kr/kg (800 g+, 500–800, 350–500, under 350)`);
  t.eq(K.snoPrice(pt, {sp:'snokrabbe', cls:2, rund:true}, Hm(2)), SNOP.dead, 'død krabbe til oppmaling: 1 kr/kg (sedlene 2025)');
  t.ok(clu(2) * 1.49 > 80, `klørne over minsteprisen: ${(clu(2) * 1.49).toFixed(0)} kr/kg produkt (Råfisklaget: 80)`);
  t.ok(mC > mL * 1.3, 'fryste klør gir mer per kilo rund vekt enn levende krabbe');

  // the extra quota (J-237-2025 § 4) for live crab only, first; then the ordinary vessel quota; the rest confiscated
  const H27 = Hy(2027, 2, 1), q = K.quotaState(); q.snokrabbe = 0; q.snoTq = 0;
  S.hold = [{sp:'snokrabbe', cls:4, kg:30000, tank:true, hr:0}, {sp:'snokrabbe', cls:0, kg:50000, gut:true, frozen:true}];
  let Z = K.snoLandQ(H27, q); t.ok(Math.abs(Z.tq - 30000) < 1 && Math.abs(Z.ord - 50000) < 1 && Z.conf < 1, `30 t levende på tilleggskvoten, 50 t klør på den ordinære (2027: ${K.snoYear(2027).tq} t og ${K.snoYear(2027).vq} t)`);
  q.snoTq = 100000; Z = K.snoLandQ(H27, q); t.ok(Math.abs(Z.tq - 10000) < 1 && Math.abs(Z.ord - 70000) < 1, 'med 100 t brukt: 10 t på tilleggskvoten, resten av den levende på den ordinære');
  q.snoTq = 110000; q.snokrabbe = 440000; Z = K.snoLandQ(H27, q); t.ok(Z.tq === 0 && Math.abs(Z.ord - 36300) < 50 && Math.abs(Z.conf - 43700) < 50, `alt brukt: ${(Z.ord / 1000).toFixed(1)} t til fleksen på 10 %, ${(Z.conf / 1000).toFixed(1)} t inndras`);
  S.hold = [{sp:'snokrabbe', cls:0, kg:50000, gut:true, frozen:true}]; q.snoTq = 0; q.snokrabbe = 0; Z = K.snoLandQ(H27, q); t.ok(Z.tq === 0 && Z.ord === 50000, 'fryste klør går aldri på tilleggskvoten');

  // the landing: the clusters on pallets of a tonne (6 min a lift), the live crab pumped into tubs of 400 kg and lifted (5 min)
  S.t = H27 * 60; S.hold = [{sp:'snokrabbe', cls:0, kg:67050, n:1, gut:true, iced:true, frozen:true}, {sp:'snokrabbe', cls:4, kg:32000, n:1, tank:true, hr:0}];
  const lp = K.landPlan('snokrabbe', K.holdTotal());
  t.ok(lp.kind === 'pall' && lp.np === 45 && lp.kar === 80 && lp.n === 125 && lp.lv === 32000 && lp.pk === 45000, `45 t klør på ${lp.np} paller og 32 t levende i ${lp.kar} kar`);
  t.ok(Math.abs(lp.dur - (1 + 45 * PALL.lift + 80 * KARLV.lift + 5)) < 1e-6, `lossingen tar ${(lp.dur / 60).toFixed(1)} timer`);
  S.hold = [{sp:'snokrabbe', cls:4, kg:32000, n:1, tank:true, hr:0}]; const lt = K.landPlan('snokrabbe', 32000);
  t.ok(lt.kind === 'tub' && lt.n === 80 && Math.abs(lt.dur - (1 + 80 * KARLV.lift + 5)) < 1e-6, `bare levende: ${lt.n} kar på ${(lt.dur / 60).toFixed(1)} timer`);
  S.hold = [{sp:'snokrabbe', cls:4, kg:32000, n:1, tank:true, hr:0}, {sp:'snokrabbe', cls:0, kg:1490, n:1, gut:true, iced:false, frozen:false}];
  const lf = K.landFreeze(); t.ok(lf === 1490 && S.hold.some(x => x.tank && !x.frozen) && S.hold.some(x => x.frozen && x.gut && !x.tank), 'ved innveiingen fryses det som ventet i fabrikken, ikke den levende krabben');

  // the crew: the six key people, a deck and a factory team of 8 each, 22 aboard (the notes: 21-29 on 50-53 m freezing vessels)
  S.lag = null; S.boat.status = 'fishing'; const G = K.lagOf();
  t.ok(G && G.sh.length === 2 && K.lagN() === 22 && VESSELS.snokrabbe.berths >= 23, `to skift à ${K.lagN()} følger båten, ${VESSELS.snokrabbe.berths} køyer`);
  const w0 = K.lagOnDeck(H27 + 3, false), w1 = K.lagOnDeck(H27 + 9, false);
  t.ok(w0.filter(c => c.role === 'dekk').length === 4 && w0.filter(c => c.role === 'fabrikk').length === 4 && w1.filter(c => c.role === 'fabrikk').length === 4 && !w0.some(c => w1.includes(c)), 'fire på dekk og fire i fabrikken på hver vakt, seks og seks');
  // the share by § 20: 35 % of the shared catch, 22 shares to the crew and one to you
  S.boat.tripGear = {teine:S.t}; const Q = K.lottSplit(1e6);
  t.ok(Q.f === 'snokrabbe' && Math.abs(Q.M - 0.35) < 1e-9 && Q.n === 23 && Q.per[0].lots === 22 && Math.abs(Q.per[0].kr - 1e6 * 0.35 * 22 / 23) < 1, `§ 20: ${Q.n} mann, ${(Q.M * 100).toFixed(0)} %, skiftet får ${Q.per[0].kr} kr av 1 MNOK`);
  // five weeks on: a landing after 20 days keeps the crew aboard, one after 36 days changes it
  G.since = S.t - 20 * 1440; K.lagLanded(100000); t.ok(G.on === 0 && G.sh[0].trips === 1, 'etter 20 døgn blir skift A om bord (fem uker på)');
  G.since = S.t - 36 * 1440; K.lagLanded(100000); t.ok(G.on === 1 && G.since === S.t && G.sh[0].trips === 2, 'etter 36 døgn går skift A i land og skift B mønstrer på');

  // the trip: provisions for 30 days for 23, the bait for the pots, the room in the tanks on a live trip
  S.boat.status = 'port'; S.boat.prov = 0; const pk = K.provFill(); t.ok(S.boat.prov === 30 * 23 && pk === 30 * 23 * 250, `proviant for 30 døgn til 23 mann: ${pk} kr`);
  S.boat.status = 'fishing'; S.hold = []; S.boat.trip = {t0:0, fuelL:0, iceKg:0, baitKr:0, seaM:0}; S.pgear = K.newPGear(); K.baitOf(S.pgear).blekksprut = 8640; K.snoSetMode('lev');
  const R = K.tripLeft(S.boat);
  t.ok(Math.abs(R.bait - 10) < 0.01 && Math.abs(R.tank - 8) < 0.01 && Math.abs(R.prov - 30) < 0.1, `turen rekker: agnet ${R.bait.toFixed(1)} døgn (8,6 t, et halvt kilo til 1 728 teiner i døgnet), tankene ${R.tank.toFixed(1)} døgn, provianten ${R.prov.toFixed(1)} døgn`);
  K.snoSetMode('frys'); t.ok(K.tripLeft(S.boat).tank == null, 'på en frysetur er tankene ingen grense');

  // the fuel: a fishing day (the portal's pots hauled at about 1 knot and set at about 6, the generators all day) and a share of steaming
  // (a fifth of the trip, 2 × 330 nm of a 20 days' trip) near 6,500 l a day at sea (an assumption: the survey 2024 has 4.9 MNOK of fuel
  // and 79 days at sea for group 014, no litres; Fiskeridirektoratet's sak 29a/2024: 0.9-3.0 l a kg of catch 2015-2022)
  S.hold = []; S.boat.fuel = VESSELS.snokrabbe.fuelCap; const P = K.POTS.sno, hH = 1728 * P.haul / 60, sH = 1728 * P.set / 60;
  const day = hH * K.fuelLph(25 / (P.haul * 60) * 3600 / 1852, 8) + sH * K.fuelLph(25 / (P.set * 60) * 3600 / 1852, 8) + 24 * VESSELS.snokrabbe.plantLph, steam = 24 * K.fuelLph(VESSELS.snokrabbe.vcruise, 8), avg = 0.8 * day + 0.2 * steam;
  t.ok(avg > 5500 && avg < 7500, `et døgn på sjøen med en femdel gange bruker ${Math.round(avg)} l (fiskedøgn ${Math.round(day)} l, gange ${Math.round(steam)} l)`);
}
