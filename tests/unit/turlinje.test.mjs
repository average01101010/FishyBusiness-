// The trip's line on the landing note and in the deck log (Ø8b S2, V2 A and V4 A in docs/planer/spillbarhet-fangst.md): core/04-crew.js
// tripSum makes the trip's sums (fish() in 05-vessels.js, finishHaul in 10-gear.js) into shares that add up, and tripWhy says only what
// took or gave at least 10 %, in both languages.
export default function (t){
  const {newState, tripSum, tripWhy, tripOf, stockDev, HEATG} = t.K;
  t.K.set('S', newState()); const S = t.K.get('S');
  // a trip of two hours' jigging with a hand jig (effort 2, fe 1 a minute): the fish stood to 100 kg in all (50 an hour); the fishing
  // down took 4, the sea 20, the cold 6, the wear 2, and no luck: 68 kg is what the model gave, and 76 came aboard
  const J = {m:120, kg:76, top:0, fe:120, mk:0, hs:120 * 1.4, w:120 * 6, p0:100, pS:96, pW:76, pC:70, pJ:68, pL:68};
  const W = tripSum({j:J});
  t.near(W.j.kgph, 38, 1e-9, 'kilo i timen: 76 kg på to timer');
  t.near(W.j.pot, 50, 1e-9, 'det fisken sto til: 100 kg på to timer');
  t.near(W.j.fair, HEATG.fair.jig, 1e-9, 'et vanlig trekk for håndjuksa er HEATG.fair.jig');
  const sum = W.j.sh.stock + W.j.sh.sea + W.j.sh.cold + W.j.sh.pilk;
  t.near(sum, W.j.pen, 1e-12, 'trinnenes andeler summerer til hele tapet (1 − pJ/p0)');
  t.near(W.j.pen, 0.32, 1e-12, '… som er 32 %');
  t.near(W.j.sh.sea, 0.2, 1e-12, 'sjøen tok 20 % av det fisken sto til');
  t.near(W.j.luck, 0, 1e-12, 'uten haill gir lykken ingenting');
  const [no, en] = tripWhy(W);
  t.eq(no, 'Turen ga 38 kg i timen med håndjuksa. Fisken sto til rundt 50: sjøen (1,4 m) tok 20 %.', 'linja på norsk, bare sjøen er over 10 %, og 50 mot vanlig 20 er ikke «tett»');
  t.eq(en, 'The trip gave 38 kg an hour with a hand jig. The fish stood for about 50: the sea (1.4 m) took 20 %.', '… og på engelsk');
  // more steps over 10 %, sorted by size, the wind named when it blew, and the luck
  const J2 = {m:60, kg:90, top:0, fe:60 * 2, mk:2, hs:60 * 2.1, w:60 * 12, p0:200, pS:170, pW:110, pC:80, pJ:78, pL:156};
  const W2 = tripSum({j:J2}), [no2, en2] = tripWhy(W2);
  t.near(W2.j.sh.stock + W2.j.sh.sea + W2.j.sh.cold + W2.j.sh.pilk, W2.j.pen, 1e-12, 'andelene summerer også med vind og haill');
  t.near(W2.j.luck, 1, 1e-12, 'haillen doblet det som var igjen');
  t.eq(no2, 'Turen ga 90 kg i timen med juksamaskiner. Fisken sto tett, til rundt 200: sjøen og vinden (2,1 m, 12 m/s) tok 30 %, kulda 15 %, nedfisket felt 15 %. Haillen ga det dobbelte.', 'flere trinn, størst først (likt i fast rekkefølge), tett fisk (over 3 × vanlig) og haillen');
  t.ok(/^The trip gave 90 kg an hour with jigging machines\. The fish stood dense, for about 200: the sea and the wind \(2\.1 m, 12 m\/s\) took 30 %, the cold 15 %, fished-down grounds 15 %\. The luck gave double\.$/.test(en2), 'og på engelsk: ' + en2);
  // nothing over 10 %: only the two numbers
  const W3 = tripSum({j:{m:60, kg:5, top:0, fe:60, mk:0, hs:30, w:120, p0:6, pS:5.9, pW:5.7, pC:5.5, pJ:5.45, pL:5.45}});
  t.eq(tripWhy(W3)[0], 'Turen ga 5 kg i timen med håndjuksa. Fisken sto tynt, til rundt 6.', 'ingen trinn over 10 %, og tynt med fisk (under 0,4 × vanlig)');
  // the first trip has its own line (tutNormKg), and a short stop says nothing
  t.eq(tripSum({j:J, tut:1}), null, 'første tur: ingen turlinje');
  t.eq(tripSum({j:{...J, m:10}}), null, 'under et kvarter med jukse: ingen linje');
  t.eq(tripWhy(null), null, 'ingen sum, ingen linje');
  // the hauls: kilos against fair hauls for the soak, the fishing down and the luck while they stood
  const G = {n:3, kg:640, fair:900, r:600, rL:400, r0:500, k:{garn:1}};
  const W4 = tripSum({g:G});
  t.near(W4.g.stock, 0.2, 1e-12, 'trekkene: nedfisket felt tok 20 %');
  t.near(W4.g.luck, 0.5, 1e-12, 'trekkene: haillen ga 50 % mer');
  t.eq(tripWhy(W4)[0], 'De 3 trekkene ga 640 kg, mot rundt 900 i vanlige trekk med samme ståtid; nedfisket felt tok 20 %. Haillen ga 50 % mer.', 'linja for trekkene');
  t.eq(tripWhy({j:null, g:{n:1, kg:10, fair:10, stock:0, luck:2}})[0], 'Trekket ga 10 kg, mot rundt 10 i et vanlig trekk med samme ståtid. Haillen ga det tredobbelte.', 'luksushaillen (+200 %): det tredobbelte');
  t.eq(tripWhy(tripSum({g:{n:1, kg:31, fair:38, r:1, rL:1, r0:1.02, k:{line:1}}}))[1], 'The haul gave 31 kg, against about 40 in an ordinary haul with the same soak.', 'ett trekk, på engelsk');
  // the stock's share where the boat stands: S.stock, not the fleet's baseline
  const p = {x:300, y:400};
  S.stock = {}; t.near(stockDev(p, 'torsk'), 1, 1e-12, 'urørt bestand: 1');
  S.stock = {}; for (let dx = -2; dx <= 2; dx++) for (let dy = -2; dy <= 2; dy++) S.stock[t.K.gridKey(Math.floor(p.x / 2) + dx, Math.floor(p.y / 2) + dy)] = 0.6;
  t.near(stockDev(p, 'torsk'), 0.6, 1e-12, 'nedfisket til 0,6 rundt båten');
  // the trip's sums start with the trip and go with the landing (sell sets b.trip to null)
  S.boat.trip = null; const T = tripOf(S.boat); t.ok(!T.j && !T.g, 'en ny tur har ingen sum ennå');
}
