// The crew's flight to and from Svalbard (core/04-crew.js FLY, H1b R7 05.11.2026): which harbours are on Svalbard (flyPort, by latitude:
// Longyearbyen yes, Tromsø, Hammerfest and Bodø no), the ticket by the month (SAS's fares read for July, November and December, the rest
// drawn between them), and the journey's minutes.
export default function (t){
  const {flyPort, flyKr, FLY, P, EPOCH, newState} = t.K;
  t.K.set('S', newState());
  const pt = (lat, lon) => ({p:P(lat, lon)});
  t.ok(flyPort(pt(78.2378, 15.5477)), 'Longyearbyen verft er på Svalbard'); t.ok(flyPort(pt(78.9253, 11.9294)), 'Ny-Ålesund er på Svalbard');
  t.ok(!flyPort(pt(69.648, 18.962)), 'Tromsø er ikke på Svalbard'); t.ok(!flyPort(pt(70.663, 23.68)), 'Hammerfest er ikke på Svalbard'); t.ok(!flyPort(pt(67.284, 14.385)), 'Bodø er ikke på Svalbard');
  t.ok(!flyPort(null) && !flyPort({}), 'ingen havn er ikke en flyhavn');
  const H = (y, m, d) => (Date.UTC(y, m, d, 12) - EPOCH) / 3.6e6;
  t.eq(flyKr(H(2027, 6, 10)), 2392, 'juli: SAS 2 392 kr'); t.eq(flyKr(H(2027, 10, 10)), 950, 'november: SAS 950 kr'); t.eq(flyKr(H(2027, 11, 10)), 895, 'desember: SAS 895 kr');
  t.eq(FLY.kr.length, 12, 'en pris for hver måned'); t.ok(FLY.kr.every(k => k >= 895 && k <= 2392), 'prisene ligger mellom den laveste og den høyeste som er lest');
  t.eq(FLY.min, 205, 'reisetida er 3 t 25 min: flyet 1 t 55 min, en time på flyplassen og en halvtime til kaia');
}
