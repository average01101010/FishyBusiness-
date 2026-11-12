// The speed limits and the cardinal marks (Ø11.8, core/05e-sjovei.js fartAt, farvWrongSide; src/data/fart.json and fart-r.b64): the
// fixed limit round a harbour point (V4 A) with its edge in true metres, Kystverket's areas read from their runs (real places: Vågen in
// Bergen, Stavanger's harbour, a summer belt), the period by date, the lowest where two lie over each other, an area going before the
// harbour, and the quarter of a cardinal mark that is the wrong side.
export const data = true;
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
  { const L = K.PORTS.map(q => K.fartAt({x:q.p.x, y:q.p.y}, H)), hi = L.filter(g => g && g.kn > 5).map(g => g.name + ' ' + g.kn);
    t.ok(L.every(g => g), 'alle havnepunktene i PORTS har en grense (' + K.PORTS.length + ')');
    t.ok(L.every(g => g.k === 'omr' || g.kn === 5), 'havnepunktene uten statlig område har havnas 5 knop');
    t.note(hi.length + ' havnepunkter ligger i et statlig område med høyere grense enn 5 (forskriften gjelder der): ' + [...new Set(hi)].join(', ')); }
  // the nearest harbour names it where two reach the same water
  const two = K.PORTS.map(a => [a, K.PORTS.find(b => b !== a && K.dist(a.p, b.p) < 0.9 * hv.r)]).find(q => q[1]);
  if (two){ f = K.fartAt({x:two[0].p.x, y:two[0].p.y}, H); t.eq(f.name, two[0].name, 'to havner om samme vann: den nærmeste gir navnet'); }
  else t.note('ingen to havnepunkter nærmere hverandre enn ' + Math.round(0.9 * hv.r * 1000) + ' m');

  // ---- the periods (month * 100 + day) ----
  t.eq([K.fartInSeason(null, 701), K.fartInSeason([501, 831], 501), K.fartInSeason([501, 831], 831), K.fartInSeason([501, 831], 901), K.fartInSeason([501, 831], 430)], [true, true, true, false, false], 'perioden 1.5–31.8: endene inne, 30.4 og 1.9 ute');
  t.eq([K.fartInSeason([1101, 215], 1224), K.fartInSeason([1101, 215], 110), K.fartInSeason([1101, 215], 301)], [true, true, false], 'en periode over nyttår');
  const Hjul = (Date.UTC(2027, 6, 10, 12) - K.EPOCH) / 3.6e6, Hnov = (Date.UTC(2027, 10, 10, 12) - K.EPOCH) / 3.6e6;
  t.eq([K.fartMd(Hjul), K.fartMd(Hnov)], [710, 1110], 'fartMd: 10. juli og 10. november');

  // ---- Kystverket's areas (fart-r.b64) ----
  const RR = K.fartRuns(); t.ok(RR && RR.length === D.omr.length && D.omr.length >= 70, 'rutene er lest for alle områdene (' + (RR ? RR.length : RR) + ')');
  // a cell well inside an area: the middle of its longest run (some areas are a few small parts far apart, so all rows), in grid km
  const inside = i => { const a = D.omr[i], T = RR[i]; let best = null;
    for (let y = 0; y < a.H; y++) for (let k = T.row[y]; k < T.row[y + 1]; k++){ const L = T.run[k * 2 + 1] - T.run[k * 2]; if (!best || L > best.L) best = {L, x:(a.x0 + (T.run[k * 2] + T.run[k * 2 + 1]) / 2) * D.R / 1000, y:(a.y0 + y + 0.5) * D.R / 1000}; }
    return best; };
  let bad = 0; for (let i = 0; i < D.omr.length; i++){ const q = inside(i), a = D.omr[i]; if (!q) { bad++; continue; } const H = a.s ? Hjul : Hnov, f = K.fartAt(q, H); if (!f || f.k !== 'omr' || f.kn > a.kn) bad++; }
  t.eq(bad, 0, 'et punkt inne i hvert område gir et område med den grensa eller lavere');
  // real places (the points are on the water in the game's chart; the limits from the regulation, 2.9 in sjofart-og-lover.md)
  const at = (la, lo, H) => K.fartAt(K.P(la, lo), H || Hnov);
  let f2 = at(60.3968, 5.3205); t.eq([f2 && f2.kn, f2 && f2.k, f2 && f2.name], [5, 'omr', 'Bergen'], 'Vågen i Bergen: 5 knop (§ 7-2)');
  f2 = at(58.9735, 5.7290); t.eq([f2 && f2.kn, f2 && f2.k], [8, 'omr'], 'havnebassenget i Stavanger: 8 knop (§ 8-6), høyere enn havnas 5');
  const tr = K.PORTS.find(q => /^Tromsø/.test(q.name)); f2 = K.fartAt({x:tr.p.x, y:tr.p.y}, Hnov); t.eq([f2 && f2.kn, f2 && f2.k], [5, 'havn'], 'Tromsø har ingen statlig grense: havnas 5 knop');
  // a summer belt: in July its limit, in November not
  const si = D.omr.findIndex(a => a.s && a.s[0] === 501 && a.n === 'Lindesnes'), sq = inside(si);
  const fj = K.fartAt(sq, Hjul), fn = K.fartAt(sq, Hnov);
  t.ok(fj && fj.k === 'omr' && fj.kn === 5 && (!fn || fn.k !== 'omr' || fn.id !== fj.id), 'sommerbeltet i Lindesnes gjelder 1.5–31.8 og ikke i november', [fj, fn]);
  // without the runs (not come yet): the harbours alone, and the answer is not kept from before
  const keep = K.FART.R; K.FART.R = false; K.FART.last = null;
  f2 = at(58.9735, 5.7290); t.ok(!f2 || f2.k === 'havn', 'uten rutene: bare havnene', f2); K.FART.R = keep; K.FART.last = null;
  t.eq(K.fartRunsFrom(new Uint8Array([1, 2, 3])), false, 'bytes som ikke passer fart.json, gir false');

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
  S.farv = [{t:10, k:'fart', kn:5, v:8.2, name:'Husøy', x:1, y:1, vid:0}, {t:20, k:'merke', cat:'south', x:1, y:1, vid:0}];
  const rows = K.mobSafeRows(10);
  t.eq(rows.map(q => q.k), ['merke', 'fart'], 'Sikkerhet-kortet har radene, nyeste først');
  t.eq(rows[1].what[0], 'Gikk 8,2 knop der fartsgrensa er 5 knop (Husøy).', 'raden for farten');
  t.eq(rows[0].what[0], 'Passerte et sørmerke på feil side.', 'raden for merket');
  t.ok(rows.every(q => q.learn && q.learn.length === 4 && q.learn[2]), 'begge har en setning og en kilde');
}
