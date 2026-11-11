// The speed limits and the cardinal marks (Ø11.8, core/05e-sjovei.js fartAt, farvWrongSide; src/data/fart.json): the fixed limit round a
// harbour point (V4 A) with its edge in true metres, an area from a data set with its months and the lowest limit where two lie over
// each other, an area going before the harbour, and the quarter of a cardinal mark that is the wrong side.
export default function (t){
  const K = t.K; K.set('S', K.newState());
  const D = K.FART_D, hv = D.havn, H = 24 * 200;
  t.ok(D && hv && hv.kn > 0 && hv.r > 0, 'fart.json har havnas faste grense');
  t.eq(hv.kn, 5, 'den faste grensa i havnene er 5 knop (V4 A)');
  const reset = () => { K.FART.omr = null; K.FART.last = null; };

  // ---- the harbours: inside the radius, at its edge (true metres over the grid's scale), outside, and far from any harbour ----
  const pt = K.PORTS.find(q => q.id === 'husoy'), gs = K.gridScale(pt.p), r = hv.r * gs;
  let f = K.fartAt({x:pt.p.x, y:pt.p.y}, H);
  t.eq([f && f.kn, f && f.k, f && f.name], [5, 'havn', 'Husøy'], 'i havnepunktet: 5 knop, havna, navnet');
  f = K.fartAt({x:pt.p.x + r * 0.98, y:pt.p.y}, H); t.eq(f && f.kn, 5, 'rett innenfor radien');
  f = K.fartAt({x:pt.p.x + r * 1.02, y:pt.p.y}, H); t.eq(f, null, 'rett utenfor radien: ingen grense');
  t.eq(K.fartAt({x:pt.p.x, y:pt.p.y - 3}, H), null, 'tre kilometer til havs: ingen grense');
  t.eq(K.fartKn({x:pt.p.x, y:pt.p.y - 3}, H), 1e9, 'fartKn uten grense er 1e9 (så Math.min ikke binder)');
  t.eq(K.fartKn(pt.p, H), 5, 'fartKn i havna');
  // every harbour the game has gets the limit (the game is national: no list by hand)
  t.ok(K.PORTS.every(q => { const g = K.fartAt({x:q.p.x, y:q.p.y}, H); return g && g.kn === 5; }), 'alle havnepunktene i PORTS har grensa (' + K.PORTS.length + ')');
  // the nearest harbour names it where two reach the same water
  const two = K.PORTS.map(a => [a, K.PORTS.find(b => b !== a && K.dist(a.p, b.p) < 0.9 * hv.r)]).find(q => q[1]);
  if (two){ f = K.fartAt({x:two[0].p.x, y:two[0].p.y}, H); t.eq(f.name, two[0].name, 'to havner om samme vann: den nærmeste gir navnet'); }
  else t.note('ingen to havnepunkter nærmere hverandre enn ' + Math.round(0.9 * hv.r * 1000) + ' m');

  // ---- the months ----
  t.eq([K.fartInSeason(null, 7), K.fartInSeason([5, 8], 5), K.fartInSeason([5, 8], 8), K.fartInSeason([5, 8], 9), K.fartInSeason([5, 8], 4)], [true, true, true, false, false], 'måneder 5–8: mai og august inne, april og september ute');
  t.eq([K.fartInSeason([11, 2], 12), K.fartInSeason([11, 2], 1), K.fartInSeason([11, 2], 3), K.fartInSeason([11, 2], 10)], [true, true, false, false], 'måneder over nyttår (11–2)');
  const mo = K.fartMonth(H); t.ok(mo >= 1 && mo <= 12, 'fartMonth gir 1–12');

  // ---- areas (as a data set would give them): a square of 0.02 degrees in the open sea west of Senja, in lat/lon ----
  const sq = (la, lo, d) => [[la, lo], [la, lo + d * 2.5], [la + d, lo + d * 2.5], [la + d, lo], [la, lo]];
  D.omr = [{n:'Prøvesundet', kn:8, m:null, p:sq(69.60, 16.50, 0.02)}, {n:'Indre prøvesund', kn:5, m:null, p:sq(69.605, 16.51, 0.01)},
    {n:'Sommerbukta', kn:5, m:[mo === 12 ? 1 : mo + 1, mo === 12 ? 2 : mo + 1], p:sq(69.70, 16.50, 0.02)}, {n:'Nå-bukta', kn:3, m:[mo, mo], p:sq(69.80, 16.50, 0.02)}];
  reset();
  const A = K.fartAreas(); t.eq(A.length, 4, 'fire områder lest');
  f = K.fartAt(K.P(69.602, 16.505), H); t.eq([f && f.kn, f && f.k, f && f.name], [8, 'omr', 'Prøvesundet'], 'inne i området: 8 knop');
  f = K.fartAt(K.P(69.61, 16.52), H); t.eq([f && f.kn, f && f.name], [5, 'Indre prøvesund'], 'to områder over hverandre: den laveste grensa');
  t.eq(K.fartAt(K.P(69.59, 16.52), H), null, 'rett sør for området: ingen grense');
  t.eq(K.fartAt(K.P(69.63, 16.52), H), null, 'rett nord for området: ingen grense');
  t.eq(K.fartAt(K.P(69.71, 16.52), H), null, 'et område utenfor månedene sine gjelder ikke');
  f = K.fartAt(K.P(69.81, 16.52), H); t.eq(f && f.kn, 3, 'et område i måneden sin gjelder');
  // an area over a harbour goes before the harbour's fixed limit
  const ll = K.natLL(pt.p); D.omr = [{n:'Havnebassenget', kn:8, m:null, p:sq(ll.lat - 0.01, ll.lon - 0.025, 0.02)}]; reset();
  f = K.fartAt({x:pt.p.x, y:pt.p.y}, H); t.eq([f && f.kn, f && f.k], [8, 'omr'], 'området går foran havnas faste grense');
  D.omr = []; reset();
  f = K.fartAt({x:pt.p.x, y:pt.p.y}, H); t.eq([f && f.kn, f && f.k], [5, 'havn'], 'uten området: havnas grense igjen');

  // ---- the cardinal marks (IALA region A): the wrong side is the quarter opposite the mark's name ----
  const c = {x:pt.p.x, y:pt.p.y - 20}, R = Math.PI / 180, gd = K.gridGamma(c), g = gd * R, gsc = K.gridScale(c);
  t.ok(Math.abs(gd) > 0.5 && Math.abs(gd) < 20, 'gridGamma er i grader, og ikke null her (' + gd.toFixed(1) + '°): retningen må gjøres sann');
  // (true north from the mark by the projection itself: a point a little north in lat/lon lies on the bearing 0)
  { const ll0 = K.natLL(c), n1 = K.P(ll0.lat + 0.001, ll0.lon), o = (() => { const a = -g; return {x:c.x + Math.sin(a), y:c.y - Math.cos(a)}; })(); t.near(Math.atan2(n1.x - c.x, -(n1.y - c.y)) / R, Math.atan2(o.x - c.x, -(o.y - c.y)) / R, 0.2, 'sann nord fra merket, mot projeksjonen selv (grader i rutenettet)'); }
  // a point d metres from the mark on the true bearing brg (degrees)
  const off = (brg, d) => { const a = brg * R - g; return {x:c.x + Math.sin(a) * d / 1000 * gsc, y:c.y - Math.cos(a) * d / 1000 * gsc}; };
  const mk = cat => [[c.x, c.y, 'C', cat]];
  t.ok(K.farvWrongSide(off(180, 100), mk('north')), 'nordmerke: 100 m rett sør for det er feil side');
  t.eq(K.farvWrongSide(off(0, 100), mk('north')), null, 'nordmerke: nord for det er riktig side');
  t.eq(K.farvWrongSide(off(90, 100), mk('north')), null, 'nordmerke: øst for det er ikke feil side');
  t.ok(K.farvWrongSide(off(180 + 40, 100), mk('north')), 'nordmerke: 40° fra rett sør er fortsatt feil side');
  t.eq(K.farvWrongSide(off(180 + 50, 100), mk('north')), null, 'nordmerke: 50° fra rett sør er utenfor kvadranten');
  t.eq(K.farvWrongSide(off(180, 250), mk('north')), null, 'nordmerke: 250 m unna er utenfor rekkevidden (200 m)');
  t.ok(K.farvWrongSide(off(270, 100), mk('east')), 'østmerke: vest for det er feil side');
  t.ok(K.farvWrongSide(off(0, 100), mk('south')), 'sørmerke: nord for det er feil side');
  t.ok(K.farvWrongSide(off(90, 100), mk('west')), 'vestmerke: øst for det er feil side');
  t.eq(K.farvWrongSide(off(270, 100), mk('west')), null, 'vestmerke: vest for det er riktig side');
  t.ok(K.farvWrongSide(off(180, 100), [[c.x, c.y, 'S', 'north']]), 'en kardinalstake (S) dømmes som bøya');
  t.eq(K.farvWrongSide(off(180, 100), [[c.x, c.y, 'B', 'port'], [c.x, c.y, 'L', 'starb'], [c.x, c.y, 'D', '']]), null, 'lateralmerker og staker dømmes ikke');

  // ---- the words ----
  const S = K.get('S'); S.lang = 'no';
  t.eq(K.farvSay({k:'fart', kn:5, v:8.2}, 'tiny'), 'Fartsgrense 5 kn', 'stripa på telefonen');
  t.ok(/Fartsgrense 5 knop: du går 8[.,]2/.test(K.farvSay({k:'fart', kn:5, v:8.2}, 'strip')), 'stripa og boksen sier farten');
  t.eq(K.farvSay({k:'merke', cat:'north'}, 'tiny'), 'Feil side av merket', 'merket, kort');
  t.eq(K.farvSay({k:'merke', cat:'east'}, 'strip'), 'Du går på feil side av merket: hold øst for det', 'merket, langt');
  // the Sikkerhet card's rows
  S.mobs = [{t:10, k:'fart', kn:5, v:8.2, name:'Husøy', x:1, y:1, vid:0}, {t:20, k:'merke', cat:'south', x:1, y:1, vid:0}];
  const rows = K.mobSafeRows(10);
  t.eq(rows.map(q => q.k), ['merke', 'fart'], 'Sikkerhet-kortet har radene, nyeste først');
  t.eq(rows[1].what[0], 'Gikk 8,2 knop der fartsgrensa er 5 knop (Husøy).', 'raden for farten');
  t.eq(rows[0].what[0], 'Passerte et sørmerke på feil side.', 'raden for merket');
  t.ok(rows.every(q => q.learn && q.learn.length === 4 && q.learn[2]), 'begge har en setning og en kilde');
}
