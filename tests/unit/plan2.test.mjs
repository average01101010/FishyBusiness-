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
}
