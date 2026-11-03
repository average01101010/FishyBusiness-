// Ukas fangst (core/09n-ukas.js; docs/planer/oppdrag-2.md U1): the week in numbers from the sales, the best day and the biggest fish, the
// new dots on Kystkartet, and when the card is due (the game week's Sunday 18:00, the week before when it was never shown, never a week
// with nothing landed).
export default function (t){
  const {ukeSum, ukeDue, ukeAt, ukeBig, ukeState, ukeLast, weekOf, gDate, kkPlants, newState} = t.K;
  const S = newState(); t.K.set('S', S);
  const d = gDate(ukeAt(3));
  t.eq(d.getUTCDay(), 0, 'kortet kommer på en søndag (spilluka starter mandag 06:00)');
  t.eq(d.getUTCHours(), 18, 'klokka 18');
  t.eq(weekOf(ukeAt(3)), 3, 'søndag kveld er i samme spilluke');
  const pl = kkPlants(), w = 3, m0 = w * 168 * 60, day = 1440;
  S.sales = [{t:m0 - 10, kg:100, total:1000, port:pl[1].id, sp:[['torsk', 100]]},
    {t:m0 + 2 * day + 600, kg:300, total:6000, port:pl[1].id, sp:[['torsk', 250], ['hyse', 50]]},
    {t:m0 + 2 * day + 900, kg:200, total:3000, port:pl[2].id, sp:[['sei', 200]]},
    {t:m0 + 5 * day + 60, kg:400, total:7000, port:pl[3].id, sp:[['torsk', 400]]}];
  const s = ukeSum(w);
  t.eq(s.kg, 900, 'uka: 900 kg (ikke landingen uka før)'); t.eq(s.kr, 16000, '16 000 kr'); t.eq(s.n, 3, 'tre leveringer');
  t.eq(s.best, 2, 'beste dag er onsdag (300 + 200 kg)'); t.eq(s.bestKg, 500, 'med 500 kg');
  t.eq(s.sp[0][0], 'torsk', 'mest torsk'); t.eq(s.sp[0][1], 650, '650 kg torsk');
  t.eq(s.kk.mottak, 2, 'to nye mottak denne uka (det ene var levert til uka før)');
  // the biggest fish: only this week's
  S.t = m0 + 100; ukeBig('torsk', 7.26); ukeBig('sei', 5); ukeBig('torsk', 3);
  t.eq(ukeSum(w).big && ukeSum(w).big.kg, 7.3, 'ukas største fisk 7,3 kg');
  t.eq(ukeSum(w - 1).big, null, 'uka før har ingen største fisk');
  // when it is due
  S.t = (ukeAt(w) - 1) * 60; t.eq(ukeDue(), w - 1, 'før søndag kveld: kortet for uka før, som aldri ble vist');
  ukeState().seen = w - 1; t.eq(ukeDue(), null, 'før søndag kveld: ingen kort for denne uka');
  S.t = ukeAt(w) * 60; t.eq(ukeDue(), w, 'søndag 18:00: kortet for uka');
  ukeState().seen = w; t.eq(ukeDue(), null, 'vist én gang');
  S.t = (ukeAt(w + 1) + 5) * 60; ukeState().seen = w - 1; t.eq(ukeDue(), w, 'uka etter uten levering: kortet som ikke ble sett, kommer når spillet åpnes');
  t.eq(ukeLast(), w + 1, 'Sesong-appen viser den siste uka som har hatt søndag kveld');
  S.t = (ukeAt(w + 2) + 1) * 60; ukeState().seen = w; t.eq(ukeDue(), null, 'en uke uten noe levert får ikke kort, og bare den siste uka teller');
}
