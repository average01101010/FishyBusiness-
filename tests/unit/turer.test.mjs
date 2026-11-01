// The missions' balance (core/09g-turer.js, 09c-seasons.js; docs/systemer/oppdrag-og-kystposten.md «Balansen», 30.10.2026): one rule
// holds every mission to the boat's own fishing hour (turCap), and this locks the numbers that rule is made of, so a change in one of
// them is a change in the balance and not a slip. Also the shared events: their days, Fiskeridirektoratet's areas and the badge's kilos.
export default function (t){
  const {TUR, TUR_ASK, TUR_EV, TUR_FIRST, TUR_LETE, EV_PRIZE, EV_BADGE, EVENTS, FEST_PRIZE, SPECIES, NM, turStages, turPay, turFinal, turCap, turLeteQs, evDays, evIn, evBadgeNeed, natP, newState} = t.K;
  t.K.set('S', newState());
  // the rule: an hour on a mission pays the fishing hour times at most 1.25 (long), the fish's own missions half of it on top of the fish;
  // the manager's own order times 1.2 on that, so never over 1.5 fishing hours; the first mission is a short one, times 1.0
  t.eq(TUR.cls.kort.f, 1.0, 'kort oppdrag: 1,0 fisketimer per time'); t.eq(TUR.cls.mid.f, 1.1, 'middels: 1,1'); t.eq(TUR.cls.lang.f, 1.25, 'lang: 1,25');
  t.eq(TUR.keepF, 0.5, 'der fisken er spillerens: 0,5 i tillegg til fisken');
  t.ok(TUR.cls.lang.f * 1.2 <= 1.5, 'bestyrerens egen bestilling (×1,2) er aldri over 1,5 fisketimer per time');
  t.eq(TUR_ASK.prem, 0.2, 'bestyrerens egen bestilling: 20 % over markedsprisen, som en kvalitetsbestilling'); t.eq(TUR_ASK.n, 3, '… fra tredje bestilling levert der'); t.eq(TUR_ASK.gapD, 7, '… høyst én per spilluke per mottak');
  t.ok(TUR.share === 0.3 && TUR.boardMax === 4 && TUR.maxAct === 2 && TUR.refillH === 18, 'tilbudsbremsen: 30 % av uka, fire på tavla, to tatt, én ny per 18 spilltimer');
  // the pay itself: the boat's curve in hundreds, never under 500, the same before and after it is taken
  const cap = turCap(); t.ok(cap > 0, 'turCap er positiv for båten i starttilstanden');
  for (const h of [0.5, 3, 12]) t.near(turPay(h, 1.25), Math.max(500, Math.round(cap * h / 6 * 1.25 / 100) * 100), 0.5, 'turPay(' + h + ' t, lang) følger kurven i hele hundre');
  t.eq(turFinal({base:12345}), 12300, 'turFinal runder til hundre'); t.eq(turFinal({base:120}), 500, 'turFinal aldri under 500');
  // the season's three stages: thirds in hundreds, the last takes the rest; thirds of the pay, the sum is the pay
  for (const [kg, pay] of [[3300, 147300], [4400, 197900], [1000, 5000], [700, 500]]){ const st = turStages({kg, pay});
    t.eq(st.n, 3, 'tre etapper for ' + kg + ' kg'); t.eq(st.at[2], kg, 'siste etappe ender på alle kiloene'); t.ok(st.at[0] < st.at[1] && st.at[1] <= st.at[2], 'etappene stiger');
    t.eq(st.part.reduce((a, b) => a + b, 0), pay, 'etappenes betaling summerer til belønningen (' + pay + ')'); t.ok(st.part.every(p => p >= 0), 'ingen etappe betaler negativt'); }
  // the first mission: a little mail, a short mission's pay, a game week
  t.ok(TUR_FIRST.kg[0] === 20 && TUR_FIRST.kg[1] === 40 && TUR_FIRST.hTot === 168, 'første oppdrag: 20–40 kg post, ei spilluke');
  t.ok(TUR_FIRST.nm[1] <= TUR_FIRST.nmFar && TUR_FIRST.nmFar <= 35, 'første oppdrag: nærmeste havn, aldri over 35 nm');
  // something under way: the extra kilos never more than the room and 40 % of the order, at 30 % over the price; fires inside the trip
  t.ok(TUR_EV.more.prem === 0.3 && TUR_EV.more.kg[0] === 60 && TUR_EV.more.kg[1] === 150, 'mottaket ringer: 60–150 kg til, 30 % over prisen');
  t.ok(TUR_EV.at[0] >= 0.2 && TUR_EV.at[1] <= 0.8 && TUR_EV.mid === 0.5, 'hendelsen kommer 30–70 % inn i turen, halvparten av de middels');
  // the shared events: the days, Fiskeridirektoratet's areas, the badge by the hold, the festival's prizes
  const by = id => EVENTS.find(e => e.id === id);
  t.eq(evDays(by('lofot'), 2027).days, 81, 'Lofotfisket 2027: 81 dager'); t.eq(evDays(by('lofot'), 2028).days, 82, 'Lofotfisket 2028: 82 dager (skuddår)');
  t.eq(evDays(by('finnmark'), 2027).days, 52, 'Finnmarksfisket: 52 dager'); t.eq(evDays(by('sei'), 2027).days, 83, 'Seisommeren: 83 dager'); t.eq(evDays(by('krabbe'), 2027).days, 91, 'Krabbehøsten: 91 dager');
  t.ok(evIn(by('lofot'), natP(68.23, 14.57)), 'Svolvær ligger i Vestfjorden (statistikkområde 00)');
  t.ok(evIn(by('lofot'), natP(67.28, 14.40)), 'Bodø ligger i statistikkområde 00');
  t.ok(!evIn(by('lofot'), natP(69.23, 17.98)), 'Finnsnes ligger ikke i 00');
  t.ok(evIn(by('finnmark'), natP(70.66, 23.68)) && evIn(by('finnmark'), natP(70.37, 31.11)), 'Hammerfest og Vardø ligger i Finnmark (03/04)');
  t.ok(!evIn(by('finnmark'), natP(69.65, 18.95)), 'Tromsø ligger ikke i Finnmark');
  t.ok(evIn(by('sei'), natP(60.39, 5.32)) && evIn(by('sei'), natP(70.37, 31.11)), 'Seisommeren gjelder Bergen og Vardø');
  t.ok(evIn(by('krabbe'), natP(70.37, 31.11)) && !evIn(by('krabbe'), natP(70.66, 23.68)), 'kvoteområdet for kongekrabbe: Vardø ja, Hammerfest nei');
  t.ok(EV_BADGE.holds === 3 && EV_BADGE.min === 1000 && EV_BADGE.max === 30000, 'merket: tre lastrom, minst 1 000 kg, høyst 30 t');
  t.eq(evBadgeNeed(350), 1050, 'trebåten: 1 050 kg'); t.eq(evBadgeNeed(5000), 15000, '5 t lasterom: 15 t'); t.eq(evBadgeNeed(400000), 30000, 'den store: taket 30 t'); t.eq(evBadgeNeed(0), 1000, 'uten lasterom: golvet');
  t.eq(EV_PRIZE.join(','), FEST_PRIZE.join(','), 'hendelsenes premier er festivalens (Jonas 05.10.2026)');
  // the search (L1): questions only where the model's densities differ; the time paid as the station, up to 20 % for right answers
  t.ok(TUR_LETE.spots === 3 && TUR_LETE.need === 60 && TUR_LETE.bonus === 0.2 && TUR_LETE.R === 5, 'leteoppdrag: tre plasser à en spilltime, 5 nm, inntil 20 % for riktige svar');
  const c = {x:0, y:0}, R = TUR_LETE.R * NM, mk = (a, r, v, d, E) => ({p:{x:Math.sin(a) * R * r, y:-Math.cos(a) * R * r}, v, d, E});
  const north = [], flat = [];
  for (let i = 0; i < 12; i++) for (const r of [0.35, 0.7, 1]){ const a = i * Math.PI / 6, isN = Math.cos(a) > 0.5;
    north.push(mk(a, r, isN ? 6 : 1, isN ? 160 : 60, isN ? 0.9 : 0.4)); flat.push(mk(a, r, 3, 70, 0.6)); }
  const qn = turLeteQs(c, 'hyse', north), kinds = qn.map(q => q.k);
  t.ok(kinds.includes('side') && qn.find(q => q.k === 'side').ans === 'N', 'hysa tettest i nord: spørsmålet om side, svaret N');
  t.ok(kinds.includes('dyp') && qn.find(q => q.k === 'dyp').ans === 'dyp' && qn.find(q => q.k === 'dyp').m === SPECIES.hyse.dep[0], 'dypere i nord enn hysas vanlige ' + SPECIES.hyse.dep[0] + ' m: spørsmålet om dyp, svaret dyp');
  t.ok(kinds.includes('ly') && qn.find(q => q.k === 'ly').ans === 'ut', 'mer eksponert i nord: spørsmålet om ly, svaret ut');
  t.ok(qn.every(q => q.opts.includes(q.ans)), 'svaret er alltid et av valgene');
  t.eq(turLeteQs(c, 'hyse', flat).length, 0, 'står den likt overalt, stilles ingen spørsmål (ingenting å finne)');
  t.eq(turLeteQs(c, 'hyse', north.slice(0, 4)).length, 0, 'for få punkter i åpent vann: ingen spørsmål');
}
