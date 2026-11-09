// The trip's line on the landing note and in the deck log (Ø8b S2, V2 A and V4 A in docs/planer/spillbarhet-fangst.md): core/04-crew.js
// tripSum makes the trip's sums (fish() in 05-vessels.js, finishHaul in 10-gear.js) into shares that add up, and tripWhy says in plain
// words, in both languages, what took the most (at least 10 %), with the kilos an hour as the only number (Jonas 09.11.2026).
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
  // the words (Jonas 09.11.2026): the kilos an hour are the only number, then at most two of the things that took the most, in plain
  // words; never what the place could have given, never a share
  const rest = x => x.replace(/^Turen ga [^.]*\.|^The trip gave [^.]*\./, '');
  const plain = (L, what) => { t.ok(!/\d|%/.test(rest(L[0])) && !/\d|%/.test(rest(L[1])), 'ingen tall utover kiloene: ' + what + ' («' + L[0] + '»)'); };
  const [no, en] = tripWhy(W);
  t.eq(no, 'Turen ga 38 kg i timen med håndjuksa. Det var litt mye sjø.', 'litt sjø (20 %), og 50 mot vanlig 20 er ikke «godt med fisk»');
  t.eq(en, 'The trip gave 38 kg an hour with a hand jig. There was a bit too much sea.', '… og på engelsk');
  plain([no, en], 'litt sjø');
  // more steps over 10 %: the two biggest (equal in a fixed order), the wind named when it blew, plenty of fish, and the luck
  const J2 = {m:60, kg:90, top:0, fe:60 * 2, mk:2, hs:60 * 2.1, w:60 * 12, p0:200, pS:170, pW:110, pC:80, pJ:78, pL:156};
  const W2 = tripSum({j:J2}), L2 = tripWhy(W2);
  t.near(W2.j.sh.stock + W2.j.sh.sea + W2.j.sh.cold + W2.j.sh.pilk, W2.j.pen, 1e-12, 'andelene summerer også med vind og haill');
  t.near(W2.j.luck, 1, 1e-12, 'haillen doblet det som var igjen');
  t.eq(L2[0], 'Turen ga 90 kg i timen med juksamaskiner. Det sto godt med fisk, men det blåste en del, og det var kaldt på fingrene. Haillen hjalp godt.', 'de to største, godt med fisk (over 3 × vanlig), og haillen');
  t.eq(L2[1], 'The trip gave 90 kg an hour with jigging machines. There was plenty of fish, but it blew a fair bit, and it was cold on the fingers. The luck helped a good deal.', '… og på engelsk');
  plain(L2, 'vind, kulde og haill');
  // the rough trip from turlinjetest: the strong words
  const W5 = {j:{...W2.j, mk:0, w:13, luck:0, sh:{sea:0.68, cold:0.11, stock:0.03, pilk:0}}};
  t.eq(tripWhy(W5)[0], 'Turen ga 90 kg i timen med håndjuksa. Det sto godt med fisk, men vinden og sjøen gjorde det for tungt å fiske skikkelig, og det var kaldt på fingrene.', 'grov sjø og kuling: de sterke ordene');
  t.eq(tripWhy({j:{...W5.j, w:5, sh:{sea:0.5, cold:0.25, stock:0.45, pilk:0.12}}})[0], 'Turen ga 90 kg i timen med håndjuksa. Sjøen var for grov til å fiske skikkelig, og feltet var hardt fisket den siste tida.', 'høyst to ting, de største: kulda og pilken faller bort; og «godt med fisk» står ikke ved et hardt fisket felt');
  t.eq(tripWhy({j:{...W5.j, sh:{sea:0, cold:0, stock:0.8, pilk:0}}})[0], 'Turen ga 90 kg i timen med håndjuksa. Feltet var hardt fisket den siste tida.', 'et hardt fisket felt har ikke «godt med fisk», selv om det hadde det før');
  t.ok(/kulda gjorde fingrene stive/.test(tripWhy({j:{...W5.j, sh:{sea:0, cold:0.25, stock:0, pilk:0.11}}})[0]), 'mye kulde: «kulda gjorde fingrene stive»');
  t.ok(/pilken og krokene var slitt/.test(tripWhy({j:{...W5.j, sh:{sea:0, cold:0, stock:0, pilk:0.11}}})[0]), 'slitt pilk');
  // nothing over 10 %: fine weather, or steady fishing; little fish
  t.eq(tripWhy({j:{...W.j, sh:{sea:0, cold:0.02, stock:0.04, pilk:0}}})[0], 'Turen ga 38 kg i timen med håndjuksa. Fint vær og jevnt fiske.', 'ingenting tok noe: fint vær og jevnt fiske');
  t.eq(tripWhy({j:{...W.j, sh:{sea:0.06, cold:0.07, stock:0, pilk:0}}})[0], 'Turen ga 38 kg i timen med håndjuksa. Jevnt fiske.', 'litt av alt, ingenting over 10 %: jevnt fiske');
  const W3 = tripSum({j:{m:60, kg:5, top:0, fe:60, mk:0, hs:30, w:120, p0:6, pS:5.9, pW:5.7, pC:5.5, pJ:5.45, pL:5.45}});
  t.eq(tripWhy(W3)[0], 'Turen ga 5 kg i timen med håndjuksa. Det var lite fisk å finne.', 'lite fisk (under 0,4 × vanlig)');
  t.eq(tripWhy({j:{...W3.j, sh:{sea:0.3, cold:0.2, stock:0, pilk:0}}})[0], 'Turen ga 5 kg i timen med håndjuksa. Det var lite fisk å finne, og det var litt mye sjø.', 'lite fisk og én ting til');
  t.eq(tripWhy({j:{...W3.j, kgph:0.4, pot:0.4}})[0], 'Turen ga under 1 kg i timen med håndjuksa. Det var lite fisk å finne.', 'et nesten tomt felt: «under 1», aldri «0»');
  // the first trip has its own line (tutNormKg), and a short stop says nothing
  t.eq(tripSum({j:J, tut:1}), null, 'første tur: ingen turlinje');
  t.eq(tripSum({j:{...J, m:10}}), null, 'under et kvarter med jukse: ingen linje');
  t.eq(tripWhy(null), null, 'ingen sum, ingen linje');
  // the hauls: against usual ones for the soak, in words; the fishing down and the luck while they stood
  const G = {n:3, kg:640, fair:900, r:600, rL:400, r0:500, k:{garn:1}};
  const W4 = tripSum({g:G});
  t.near(W4.g.stock, 0.2, 1e-12, 'trekkene: nedfisket felt tok 20 %');
  t.near(W4.g.luck, 0.5, 1e-12, 'trekkene: haillen ga 50 % mer');
  t.eq(tripWhy(W4)[0], 'Garna fisket omtrent som vanlig. Haillen hjalp godt.', 'garna omtrent som vanlig, med haill');
  t.eq(tripWhy({g:{n:1, kg:10, fair:38, stock:0.5, luck:0, kinds:['line']}})[0], 'Lina ga lite denne gangen: feltet var hardt fisket.', 'lina ga lite, og hvorfor');
  t.eq(tripWhy({g:{n:2, kg:100, fair:50, stock:0, luck:0, kinds:['garn', 'teine']}})[1], 'The gear fished better than usual.', 'flere slags redskap, på engelsk');
  plain(tripWhy(W4), 'trekkene');
  // the luck said once, whichever part had it
  t.eq(tripWhy({j:{...W2.j}, g:{n:1, kg:30, fair:38, stock:0, luck:0, kinds:['garn']}})[0].match(/[Hh]aillen/g).length, 1, 'haillen nevnes bare én gang');
  // the halibut gear by hand: named as such, whatever machines are aboard
  t.ok(tripWhy({j:{...W.j, kv:true, mk:2}})[0].startsWith('Turen ga 38 kg i timen med kveiteutstyr.'), 'kveiteutstyret heter kveiteutstyr, ikke juksamaskiner');
  // the stock's share where the boat stands: S.stock, not the fleet's baseline
  const p = {x:300, y:400};
  S.stock = {}; t.near(stockDev(p, 'torsk'), 1, 1e-12, 'urørt bestand: 1');
  S.stock = {}; for (let dx = -2; dx <= 2; dx++) for (let dy = -2; dy <= 2; dy++) S.stock[t.K.gridKey(Math.floor(p.x / 2) + dx, Math.floor(p.y / 2) + dy)] = 0.6;
  t.near(stockDev(p, 'torsk'), 0.6, 1e-12, 'nedfisket til 0,6 rundt båten');
  // the trip's sums start with the trip and go with the landing (sell sets b.trip to null)
  S.boat.trip = null; const T = tripOf(S.boat); t.ok(!T.j && !T.g, 'en ny tur har ingen sum ennå');
}
