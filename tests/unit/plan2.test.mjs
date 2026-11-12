// Driftsplan 2's words for when a soak is up (p2When, core/06g-plan2.js; GUI review F7 05.11.2026): by the clock and the date, not by
// 24 hours from the day's start. Before, a haul due the next morning was «i kveld etter dagen».
export default function (t){
  const K = t.K, {p2When, EPOCH} = K;
  // the game's hour at a date and time on the game's clock (the UTC fields of gDate)
  const H = (d, h, m = 0) => (Date.UTC(2027, 2, d) - EPOCH) / 3600000 + h + m / 60;
  const H0 = H(3, 5);   // a day out at 05:00 on 3 March
  t.ok(p2When(H(3, 21), H0)[0] === 'i kveld kl. 21:00', 'samme dag kl. 21: «i kveld» (' + p2When(H(3, 21), H0)[0] + ')');
  t.ok(p2When(H(3, 14), H0)[0] === 'i dag kl. 14:00', 'samme dag kl. 14: «i dag» (' + p2When(H(3, 14), H0)[0] + ')');
  t.ok(p2When(H(4, 1, 45), H0)[0] === 'i natt kl. 01:45', 'neste dato kl. 01:45: «i natt» (' + p2When(H(4, 1, 45), H0)[0] + ')');
  t.ok(p2When(H(4, 5, 51), H0)[0] === 'i morgen kl. 05:51', 'neste morgen kl. 05:51: «i morgen», ikke «i kveld» (' + p2When(H(4, 5, 51), H0)[0] + ')');
  t.ok(p2When(H(4, 4, 59), H(3, 23))[0] === 'i natt kl. 04:59', 'ut kl. 23, ute kl. 04:59: «i natt» (' + p2When(H(4, 4, 59), H(3, 23))[0] + ')');
  t.ok(p2When(H(6, 7), H0)[0] === 'om 3 døgn, kl. 07:00', 'tre datoer fram: «om 3 døgn» (' + p2When(H(6, 7), H0)[0] + ')');
  t.ok(p2When(H(4, 5, 51), H0)[1] === 'tomorrow at 05:51', 'engelsk: «tomorrow at 05:51» (' + p2When(H(4, 5, 51), H0)[1] + ')');
  // your own rest after a late day (U11, Jonas 05.11.2026): enough for a full day again, none where there is no rest to be had
  const {p2MeRestH, p2MeNeed, DRP2} = K, need = p2MeNeed();
  t.near(need, DRP2.enMin + DRP2.enH * DRP2.dayMax, 1e-9, 'en full dag trenger ' + Math.round(need) + ' % energi (15 % igjen etter 14 t)');
  t.near(p2MeRestH(20, 100 / 6), (need - 20) / (100 / 6), 1e-9, 'rorbua: fra 20 % til en full dag på rundt ' + Math.round((need - 20) / (100 / 6) * 10) / 10 + ' t');
  t.ok(p2MeRestH(-10, 100 / 6) === p2MeRestH(0, 100 / 6), 'energien under 0 etter et anslag regnes som 0');
  t.ok(p2MeRestH(90, 100 / 6) === 0, 'uthvilt nok: ingen hvile');
  t.ok(p2MeRestH(20, 0) === 0, 'ingen hvile å få (åpen båt ved kai uten køyer, eller ingen penger til rorbua): 0, avgangen sier fra');
  // the buoy sets the plan has (U9 A): those aboard and those on the gear standing in the sea, which come back aboard with the haul
  { const {newState, p2Kits} = K; K.set('S', newState()); const S = K.get('S');
    t.ok(p2Kits() === 0, 'ingen blåsesett om bord og ingenting i sjøen: 0 (Start låst med et felt)');
    S.pgear.kits.n = 2; t.ok(p2Kits() === 2, 'to om bord: 2');
    S.sets = [{vid:S.cur, kind:'line'}, {vid:S.cur, kind:'line', lost:true}, {vid:'annen', kind:'line'}];
    t.ok(p2Kits() === 3, 'to om bord og ett på lina i sjøen (en tapt lenke og en annen båts teller ikke): 3 (' + p2Kits() + ')'); }
  // a field closed by the rules (Ø12 07.11.2026): the plan looks again each day (until, and holds to it) but the field opens on its date
  // (open), and the push «Feltet er åpent igjen» goes then; before it went the next day the plan looked, while the field was still closed
  { const {newState, plan2Wait} = K; K.set('S', newState()); const o = {run:null, hold:0};
    plan2Wait(o, 'closed', 'Felt 1 er stengt. Planen venter til 1.6.', 'Field 1 is closed. The plan waits until 1.6.', 100, 196);
    t.ok(o.run.wait.until === 100 && o.run.wait.open === 196 && o.hold === 100, 'stengt felt: neste titt (until 100) holder planen, åpningsdagen (open 196) står i ventingen (' + JSON.stringify([o.run.wait.until, o.run.wait.open, o.hold]) + ')');
    plan2Wait(o, 'closed', 'Felt 1 er stengt. Planen venter til 1.6.', 'Field 1 is closed. The plan waits until 1.6.', 124, 196);
    t.ok(o.run.wait.until === 124 && o.run.wait.open === 196, 'samme venting dagen etter: ny titt, samme åpningsdag');
    plan2Wait(o, 'wx', 'Venter på været.', 'Waits for the weather.', 130);
    t.ok(o.run.wait.open === null && o.run.wait.until === 130, 'en annen venting (været) har ingen åpningsdag'); }
  // «Levering hvert N. døgn» (Jonas 08.11.2026: A): a day plan lands on the first day and every N after; a trip of several days as long as
  // N lands on its last day, before home, not on day 1 and 4; every trip lands on its last day, and every N days within it (valg 14 A)
  { const {p2LandsToday, p2TripLast} = K, days = (o, n) => [...Array(n).keys()].filter(d => p2LandsToday(o, d)).map(d => d + 1), trip = (T, N) => ({rhythm:'multi', days:T, land:{when:'days', days:N}});
    t.ok(JSON.stringify(days(trip(3, 3), 7)) === '[3,6]', 'flerdøgnstur på 3 døgn, levering hvert 3. døgn: dag 3 og 6 (' + JSON.stringify(days(trip(3, 3), 7)) + ')');
    t.ok(days(trip(3, 3), 9).every(d => p2TripLast(trip(3, 3), d - 1)) && days(trip(4, 4), 12).every(d => p2TripLast(trip(4, 4), d - 1)) && JSON.stringify(days(trip(4, 4), 9)) === '[4,8]', 'leveringen er turens siste dag, den samme dagen hjemturen regnes fra (3 og 4 døgn)');
    t.ok(JSON.stringify(days({rhythm:'day', land:{when:'days', days:3}}, 7)) === '[1,4,7]', 'dagdrift, levering hvert 3. døgn: dag 1, 4 og 7 som før');
    // (valg 14, Jonas 08.11.2026: «A»: always the trip's last day, and every N days from the trip's first day when N is shorter)
    t.ok(JSON.stringify(days(trip(3, 2), 6)) === '[2,3,5,6]', 'flerdøgnstur på 3 døgn, levering hvert 2. døgn: dag 2 og 3 (siste), så 5 og 6, aldri neste turs første dag (' + JSON.stringify(days(trip(3, 2), 6)) + ')');
    t.ok(JSON.stringify(days(trip(3, 5), 9)) === '[3,6,9]', 'flerdøgnstur på 3 døgn, levering hvert 5. døgn: turens siste dag, ikke hjem med fangsten om bord (' + JSON.stringify(days(trip(3, 5), 9)) + ')');
    t.ok(JSON.stringify(days(trip(7, 3), 14)) === '[3,6,7,10,13,14]', 'flerdøgnstur på 7 døgn, levering hvert 3. døgn: dag 3, 6 og 7, så 10, 13 og 14 (' + JSON.stringify(days(trip(7, 3), 14)) + ')');
    t.ok([trip(3, 2), trip(3, 5), trip(4, 3), trip(7, 3), trip(2, 1)].every(o => [...Array(21).keys()].every(d => !p2TripLast(o, d) || p2LandsToday(o, d))), 'hver tur leverer siste dag, uansett Levering-raden');
    t.ok(JSON.stringify(days({rhythm:'multi', land:{when:'days'}}, 4)) === '[2,4]', 'uten tall: turen 2 døgn og levering hvert 2. døgn, siste dag (2 og 4)'); }
  // round the clock (U2): the boat's own limits before the number aboard
  { const {plan2WatchWhy} = K, st = (house, bunks, crewMax) => ({house, bunks, crewMax});
    t.ok(String(plan2WatchWhy(st(false, 0, 2), 3, true)) === 'Båten har verken styrhus eller køyer', 'snekke (ingen styrhus, ingen køyer), tre om bord: båtens grense, ikke «dere er 3»');
    t.ok(plan2WatchWhy(st(true, 2, 2), 3, true).k === 'boat' && /plass til bare 3/.test(plan2WatchWhy(st(true, 2, 2), 3, true)), 'plass til to i mannskapet: «plass til bare 3 om bord»');
    t.ok(/bare 2 køyer/.test(plan2WatchWhy(st(true, 2, 4), 4, true)), 'plass til fem, men to køyer: «bare 2 køyer»');
    const c = plan2WatchWhy(st(true, 4, 3), 3); t.ok(c.k === 'crew' && /ansett 1 til/.test(c), 'båten kan, tre om bord: «ansett 1 til» (' + c + ')');
    t.ok(/køyer til alle/.test(plan2WatchWhy(st(true, 4, 4), 5)), 'fem om bord og fire køyer: køyer til alle');
    t.ok(plan2WatchWhy(st(true, 6, 5), 4) === null, 'fire om bord, seks køyer: døgndrift går'); }
  // the day's words (P4): «Dagen er 14 t.» without «Dagen:», and «i morgen kl.» on a time after midnight
  { const {planDayText} = K, o = {places:[], rig:'juksa'}, had = 'fmt' in globalThis; if (!had) globalThis.fmt = (x, d) => x.toFixed(d).replace('.', ',');   // (fmt is the UI's, ui/02-format-state.js)
    const day = {t0:H(3, 5), steps:[{t:H(3, 6), k:'juks', pid:null, until:H(3, 16), h:10}, {t:H(3, 16), k:'juks', pid:null, until:H(4, 16, 5), h:24}], skipped:[], why:['dagen er 14 t', 'the day is 14 h']};
    const T = planDayText(o, day);
    t.ok(/til kl\. 16:00 /.test(T[0][1]), 'samme dag: «til kl. 16:00» (' + T[0][1] + ')');
    t.ok(/til i morgen kl\. 16:05/.test(T[1][1]) && /until tomorrow at 16:05/.test(T[1][2]), 'etter midnatt: «til i morgen kl. 16:05» (' + T[1][1] + ')');
    t.ok(T[2][1] === 'Dagen er 14 t.' && T[2][2] === 'The day is 14 h.', 'siste linje: «Dagen er 14 t.» (' + T[2][1] + ')'); if (!had) delete globalThis.fmt; }
  // nets need two aboard (GEAR.garn.crewMin; found in geartest at Ø12 C 08.11.2026: a net plan with you alone went out and could not haul):
  // the plan waits before it leaves, with the reason, and a line or jig plan goes as before
  { const {newState, plan2CrewWhy, applyVessel, GEAR} = K; K.set('S', newState()); const S = K.get('S'); S.boat.type = 'sjark'; applyVessel(); S.crew = []; S.me = S.cur;
    const w = plan2CrewWhy({rig:'garn'});
    t.ok(w && w.wait && w.k === 'nets' && /to om bord/.test(w.no), 'garnplan, du alene om bord: planen venter med grunnen (' + (w && w.no) + ')');
    t.ok(plan2CrewWhy({rig:'garn'}, false) === null, 'garnplan, du alene, ingen garn igjen å sette eller trekke i dag (hjem, til mottaket): går som før');
    t.ok(plan2CrewWhy({rig:'line'}) === null && plan2CrewWhy({rig:'juksa'}) === null, 'lineplan og juksplan, du alene: går som før');
    t.ok(GEAR.garn.crewMin === 2, 'garn krever ' + GEAR.garn.crewMin + ' om bord'); }
}
