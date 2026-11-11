// A bought boost given again to a save that went on without it (HS3, 11.11.2026, docs/planer/haill-saldo.md; core/03-simulation.js
// backT, boostBack, givenKeep; core/15-energy.js giveSkip with an end): the end is max(the end of the same kind on, delivered) + its
// hours, never longer than what was bought; another kind of trim takes the place of the one on; one whose end has passed gives
// nothing; and the ids the game has given are kept by age, as long as the server can list them.
export default function (t){
  const K = t.K, H = 60, near = (a, b) => Math.abs(a - b) < 1e-6;
  const T0 = K.get('WORLD_T0'), RATE = K.get('GAME_RATE');

  // ---- when it was delivered, in game minutes (backT) ----
  t.ok(near(K.backT(T0 + 3600e3, 0, 0, true), 60 * RATE), 'levert én time etter WORLD_T0 er spillminutt 60 × GAME_RATE på den felles klokka');
  t.ok(near(K.backT(T0 + 3600e3, T0 + 9e9, 123456, true), 60 * RATE), 'med den felles klokka teller verken enhetens klokke eller spillets minutt');
  t.ok(near(K.backT(1000e3, 1000e3 + 2 * 3600e3, 5000, false), 5000 - 120 * RATE), 'uten den felles klokka: tida siden levering trukket fra spillets minutt');

  // ---- the end (boostBack), trim: only the same kind adds ----
  const pump = at => ({k:'pump', h:24, at}), turbo = at => ({k:'turbo', h:72, at});
  t.eq(K.boostBack(null, [pump(1000)], false), {k:'pump', t0:1000, until:1000 + 24 * H}, 'ingen trim på: slutten er levert + timene');
  t.eq(K.boostBack(null, [], false), null, 'ingenting å gi: ingenting');
  t.eq(K.boostBack({k:'pump', t0:500, until:500 + 24 * H}, [pump(1000)], false), {k:'pump', t0:500, until:500 + 48 * H}, 'samme slag på: lagt til slutten på den som er på');
  t.eq(K.boostBack({k:'pump', t0:0, until:600}, [pump(1000)], false), {k:'pump', t0:1000, until:1000 + 24 * H}, 'samme slag på, men gått ut før leveringen: en ny fra leveringen, ikke fra den gamle slutten eller den gamle starten');
  t.eq(K.boostBack({k:'turbo', t0:500, until:500 + 72 * H}, [pump(1000)], false), {k:'pump', t0:1000, until:1000 + 24 * H}, 'annet slag på, levert etterpå: tar plassen, som da den ble kjøpt');
  t.eq(K.boostBack({k:'turbo', t0:2000, until:2000 + 72 * H}, [pump(1000)], false), {k:'turbo', t0:2000, until:2000 + 72 * H}, 'annet slag på som kom etter leveringen: den som er på, tok plassen, og ingenting gis');
  t.eq(K.boostBack(null, [pump(1000), pump(1300)], false), {k:'pump', t0:1000, until:1000 + 48 * H}, 'to av samme slag etter hverandre: samme slutt som da de ble kjøpt');
  t.eq(K.boostBack(null, [pump(1000), pump(1000 + 30 * H)], false), {k:'pump', t0:1000 + 30 * H, until:1000 + 54 * H}, 'to av samme slag med et hull mellom: den andre er en ny fra sin egen levering');
  t.eq(K.boostBack(null, [pump(1000), turbo(1300), pump(1400)], false), {k:'pump', t0:1400, until:1400 + 24 * H}, 'tre etter hverandre med et annet slag i midten: den siste står');
  t.eq(K.boostBack({k:'pump', t0:1300, until:1300 + 24 * H}, [pump(1000)], false), {k:'pump', t0:1000, until:1000 + 48 * H}, 'samme slag levert før den som er på: lagt inn foran, samme slutt som da de ble kjøpt');
  t.eq(K.boostBack({k:'pump', t0:1000 + 40 * H, until:1000 + 64 * H}, [pump(1000)], false), {k:'pump', t0:1000, until:1000 + 64 * H}, 'samme slag levert og gått ut før den som er på kom: slutten flyttes ikke');
  // the caller gives nothing when the end has passed: the end is the same whatever the minute is now
  { const c = K.boostBack(null, [pump(1000)], false); t.ok(c.until === 1000 + 24 * H && !(c.until > 1000 + 25 * H), 'gått ut: slutten er passert en time etter, og den som kaller, gir ingenting'); }
  t.eq(K.boostBack(null, [{k:'pump', h:0, at:5}, {k:'pump', h:24, at:NaN}, null], false), null, 'en grant uten timer eller uten tid tåles og gir ingenting');
  t.eq(K.boostBack({k:'pump', until:900}, [pump(1000)], false).until, 1000 + 24 * H, 'en trim i lagringen uten t0 tåles');

  // ---- Skippertak: every kind adds ----
  const sk = (k, h, at) => ({k, h, at});
  t.eq(K.boostBack(null, [sk('std', 48, 1000)], true), {k:'std', t0:1000, until:1000 + 48 * H}, 'Skippertak, ingen på: levert + timene');
  t.eq(K.boostBack({k:'light', t0:500, until:500 + 24 * H}, [sk('max', 96, 1000)], true), {k:'max', t0:500, until:500 + 120 * H}, 'Skippertak av et annet slag legges til det som er på');
  t.eq(K.boostBack(null, [sk('light', 24, 1000), sk('std', 48, 1200)], true).until, 1000 + 72 * H, 'to Skippertak etter hverandre: samme slutt som da de ble kjøpt');
  t.eq(K.boostBack({k:'max', t0:-90000, until:-80000}, [sk('std', 48, 1000)], true), {k:'std', t0:1000, until:1000 + 48 * H}, 'et Skippertak som gikk ut for lenge siden, ligger i lagringen: det nye starter fra sin egen levering (linja i appen)');

  // ---- giveSkip with an end ----
  { K.set('S', K.newState()); const S = K.get('S'); S.t = 5000; S.energy = 40; S.skip = null;
    t.eq(K.giveSkip('std', 4000), null, 'giveSkip med en slutt som er passert: ingenting'); t.ok(S.energy === 40 && !S.skip, 'og energien er urørt');
    t.ok(!!K.giveSkip('std', 5000 + 10 * H, 4500), 'giveSkip med en slutt fram i tid: gitt'); t.eq([S.skip.k, S.skip.t0, S.skip.until, S.energy], ['std', 4500, 5000 + 10 * H, 100], 'slutten er den som ble gitt, ikke nå + 48 timer, og energien er full');
    K.giveSkip('light'); t.eq(S.skip.until, 5000 + 34 * H, 'et vanlig kjøp etterpå legges til som før'); }

  // ---- the ids kept by age (givenKeep) ----
  const D = 864e5, now = 100 * D;
  { const at = {1:now - 9 * D, 2:now - 7.5 * D, 3:now - D}; t.eq(K.givenKeep([1, 2, 3], at, now, 8), [2, 3], 'en ID sist sett for over 8 døgn siden går ut, de andre står'); t.eq(Object.keys(at), ['2', '3'], 'og tida til den som gikk ut, ryddes'); }
  { const at = {}; t.eq(K.givenKeep([7, 8, 9], at, now, 8), [7, 8, 9], 'en lagring fra før med bare tall leses som før'); t.eq(at, {7:now, 8:now, 9:now}, 'og ID-ene får tida nå'); }
  { const ids = [], at = {}; for (let i = 1; i <= 500; i++){ ids.push(i); at[i] = now - D; } t.eq(K.givenKeep(ids, at, now, 8).length, 500, 'ikke lenger bare de siste 200: alle innenfor alderen står'); }
  { const at = {5:now + 3 * D}; K.givenKeep([5], at, now, 8); t.eq(at[5], now, 'en tid fram i tid (en klokke som gikk feil) settes til nå'); }
}
