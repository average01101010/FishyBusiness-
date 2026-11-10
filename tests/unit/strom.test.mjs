// Fysikk 4 F8a (docs/planer/fysikk-4-sjo-og-skrog.md F8, steg 41): the stream through the sounds (src/data/strom.json, tools/strom/strom.py)
// and curAt (core/06e-anchor.js). The unit tests have no map, so the tide's stream along the coast and the coastal current are only
// checked for their cap here; tests/tidetest.py checks them on the whole coast.
export default function (t){
  const K = t.K, KN = 1852 / 3600;
  t.ok(typeof K.curAt === 'function' && K.STROM && K.STROM.s && K.STROM.s.length > 200, 'strømfeltet er inne (' + (K.STROM && K.STROM.s ? K.STROM.s.length : 0) + ' sund langs hele kysten)');
  if (!(K.STROM && K.STROM.s && K.STROM.s.length)) return;
  const near = (lat, lon) => { const c = K.P(lat, lon); let b = null, bd = 1e9; for (const q of K.STROM.s){ const d = Math.hypot(q.x - c.x, q.y - c.y); if (d < bd){ bd = d; b = q; } } return {q:b, d:bd}; };
  // the sounds of the whole coast, not Senja's alone: from the Skagerrak to Finnmark
  { const ys = K.STROM.s.map(q => q.y); t.ok(Math.min(...ys) < 300 && Math.max(...ys) > 1500, 'sundene ligger langs hele kysten (y ' + Math.round(Math.min(...ys)) + '–' + Math.round(Math.max(...ys)) + ' km)'); }
  const H0 = Math.round((Date.UTC(2027, 2, 1, 0) - K.EPOCH) / 6e4) / 60;
  // ---- Saltstraumen: found, measured as the sources have it, and held under the cap ----
  const ss = near(67.2335, 14.623), q = ss.q, at = {x:q.x, y:q.y};
  t.ok(ss.d < 1.5, 'Saltstraumen er funnet (' + ss.d.toFixed(2) + ' km fra brua)');
  t.ok(q.w > 100 && q.w < 300 && q.d > 15 && q.d < 40 && q.A0 > 150, 'Saltstraumen: ' + q.w + ' m bred, ' + q.d + ' m dyp, ' + q.A0 + ' km² basseng (Statsforvalteren: 255 m i overflaten, terskel 26 m)');
  let mx = 0, agree = 0, against = 0;
  for (let h = 0; h < 15 * 24; h += 0.25){ const c = K.curAt(at, H0 + h); mx = Math.max(mx, Math.abs(c.snd));
    if (Math.abs(c.dh) > 0.1){ if ((c.nx * q.ax + c.ny * q.ay) * c.dh > 0) agree++; else against++; } }
  t.ok(mx <= K.CUR.max + 1e-9 && mx > 0.9 * K.CUR.max, 'Saltstraumen når taket på 8 knop og aldri over (' + (mx / KN).toFixed(1) + ' kn)');
  t.ok(agree > 100 && against === 0, 'strømmen går inn når det flør og ut når det fjærer (' + agree + ' med, ' + against + ' mot)');
  // the stream along the axis: + into the basin, so on the flood it runs the way the axis points
  { let H = H0; while (K.curAt(at, H).dh < 0.3) H += 0.1; const c = K.curAt(at, H); t.ok(c.sx * q.ax + c.sy * q.ay > 0.5 * Math.hypot(c.sx, c.sy), 'på flo går strømmen langs aksen inn mot bassenget'); }
  // slack at high and low water: the turning found to the minute, the stream there under a fifth of a knot
  { const ev = K.tideEvents(H0, 48, at); let worst = 0;
    for (const e of ev){ let a = e.t - 0.2, b = e.t + 0.2; const sg = e.kind === 'high' ? 1 : -1;
      for (let k = 0; k < 40; k++){ const m1 = a + (b - a) / 3, m2 = b - (b - a) / 3; if (sg * K.tideH(m1, at) > sg * K.tideH(m2, at)) b = m2; else a = m1; }
      worst = Math.max(worst, Math.abs(K.curAt(at, (a + b) / 2).snd)); }
    t.ok(ev.length >= 6 && worst < 0.1, 'stille vann ved høy- og lavvann (' + ev.length + ' vendinger, høyst ' + (worst / KN).toFixed(2) + ' kn)'); }
  // it slows away from the narrows and is spent past its reach
  { let H = H0; while (Math.abs(K.curAt(at, H).dh) < 0.3) H += 0.1;
    const u0 = Math.abs(K.curAt(at, H).snd), far = {x:q.x - q.ax * (2 * q.ro + 0.5), y:q.y - q.ay * (2 * q.ro + 0.5)}, half = {x:q.x - q.ax * q.ro, y:q.y - q.ay * q.ro};
    t.ok(Math.abs(K.curAt(half, H).snd) < u0 && K.stromAt(q, far, K.curAt(far, H).dh) === 0, 'strømmen avtar ut fra det trangeste og er borte utenfor rekkevidden'); }
  // two sounds whose reaches meet never carry more than the cap together
  { const twin = Object.assign({}, q, {x:q.x + 0.05}); let worst = 0; const keep = K.STROM.idx; const key = Math.floor(q.x / K.CUR.cell) * 100000 + Math.floor(q.y / K.CUR.cell), list = keep.get(key); list.push(twin);
    try { for (let h = 0; h < 15 * 24; h += 0.25){ const c = K.curAt(at, H0 + h); worst = Math.max(worst, Math.hypot(c.nx, c.ny)); } } finally { list.pop(); }
    t.ok(worst <= K.CUR.max + 1e-9, 'to sund som når hverandre, går aldri over taket sammen (' + (worst / KN).toFixed(1) + ' kn)'); }
  // ---- the cap of what the narrows can carry (tools/strom/strom.py): U at the springs never over sqrt(2 g x the range) or, where the
  // depth is unknown, 4 knots; the basin the game reckons with never more than the whole one behind
  { let bad = 0; for (const r of K.STROM.s) if (!(r.A <= r.A0 + 1e-6)) bad++; t.ok(bad === 0 && K.STROM.s.every(r => r.A0 > 0), 'bassenget spillet regner med, er aldri større enn hele bassenget bak (' + bad + ' feil)'); }
  // ---- Rystraumen (Tromsø): found, and within the 5–6 knots the plan names as a cap ----
  { const r = near(69.545, 18.72); let m2 = 0; for (let h = 0; h < 15 * 24; h += 0.25) m2 = Math.max(m2, Math.abs(K.stromAt(r.q, {x:r.q.x, y:r.q.y}, K.curAt({x:r.q.x, y:r.q.y}, H0 + h).dh)));
    t.ok(r.d < 3 && m2 / KN > 1 && m2 / KN <= 6.5, 'Rystraumen: ' + (m2 / KN).toFixed(1) + ' kn ved springflo (' + r.d.toFixed(1) + ' km unna; planen: 5–6, en seiler: 6,5–7)'); }
  // ---- where there is no sound: the stream that turns with the tide is under 0.2 knots ----
  { let worst = 0; const pts = [K.P(66.5, 9.0), K.P(62.0, 4.0), K.P(71.5, 25.0), K.P(58.5, 7.5)];
    for (const p of pts){ t.ok(K.stromNear(p).length === 0, 'ingen sund ved ' + p.x.toFixed(0) + ',' + p.y.toFixed(0)); for (let h = 0; h < 15 * 24; h += 0.5){ const c = K.curAt(p, H0 + h); worst = Math.max(worst, Math.abs(c.tide)); } }
    t.ok(worst < 0.2 * KN, 'utenfor sundene er tidevannets strøm under 0,2 knop (høyst ' + (worst / KN).toFixed(2) + ' kn)'); }
}
