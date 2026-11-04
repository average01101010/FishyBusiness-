// The sea ice by month (H1b R5, V3 A, core/03h-is.js, data/is.json from tools/is/is.py): shut in March at Kong Karls land, open in
// September, the edge moving day by day with no jump at the turn of a month, the coast of the mainland open the year round, the ice
// class, and the ice in the sailing (groundCheck) and in Autonav's checks (leiaIce, leiaIceLeg), and the phone's bars out there.
export default function (t){
  const K = t.K, {SEA_ICE, SEA_ICE_LIM, seaIceAt, seaIceShut, seaIceMonth, natP, newState, EPOCH, PORTS, coverage} = K;
  K.set('S', newState());
  const H = (y, m, d, h = 12) => (Date.UTC(y, m - 1, d) - EPOCH) / 3600000 + h;
  t.ok(!!SEA_ICE, 'isdataene er lastet (data/is.json)');
  if (!SEA_ICE) return;
  t.ok(!SEA_ICE.synthetic, 'isdataene er de ekte fra OSI SAF, ikke de syntetiske prøvedataene (' + SEA_ICE.src.slice(0, 60) + ' …)');
  t.ok(/EUMETSAT/.test(SEA_ICE.license) && /free of charge/.test(SEA_ICE.license), 'lisensen står i dataene, slik filene selv gir den (EUMETSAT, gratis, «Copyright EUMETSAT» under det som vises)');
  // the month: the middle of January is 0, the middle of December 11, and it is continuous
  t.near(seaIceMonth(H(2027, 1, 16, 12)), 0, 0.02, 'midt i januar er måned 0');
  t.near(seaIceMonth(H(2027, 3, 1, 0)), 1.5, 1e-9, 'skiftet fra februar til mars er 1,5');
  t.near(seaIceMonth(H(2027, 2, 28, 23 + 59.9 / 60)), 1.5, 1e-4, 'og det er ikke noe hopp ved skiftet');
  // shut in March at Kong Karls land, open in September
  const kkl = natP(78.8, 28.0);
  t.ok(seaIceShut(kkl, H(2027, 3, 15)), 'Kong Karls land er stengt i mars (' + seaIceAt(kkl, H(2027, 3, 15)).toFixed(0) + ' % is)');
  t.ok(!seaIceShut(kkl, H(2027, 9, 15)), 'Kong Karls land er åpent i september (' + seaIceAt(kkl, H(2027, 9, 15)).toFixed(0) + ' % is)');
  const dk = natP(67.0, -26.0), bj = natP(74.0, 19.0);
  t.ok(seaIceAt(dk, H(2027, 3, 15)) > seaIceAt(dk, H(2027, 9, 15)), 'Danmarkstredet har mer is i mars enn i september (' + seaIceAt(dk, H(2027, 3, 15)).toFixed(0) + ' mot ' + seaIceAt(dk, H(2027, 9, 15)).toFixed(0) + ' %)');
  t.ok(!seaIceShut(bj, H(2027, 8, 15)), 'Bjørnøya er åpen i august (' + seaIceAt(bj, H(2027, 8, 15)).toFixed(0) + ' %)');
  // no jump between the days: over a year, every day at points over the ice seas, and the shut area from day to day
  const pts = []; for (let la = 66; la <= 81; la += 0.75) for (let lo = -30; lo <= 55; lo += 2.5){ const p = natP(la, lo); if (seaIceAt(p, H(2027, 3, 15)) > 0 || seaIceAt(p, H(2027, 9, 15)) > 0) pts.push(p); }
  let dmax = 0, dmaxTurn = 0, amax = 0, prev = null, prevA = null, maxA = 0, h0 = H(2027, 1, 1);
  for (let d = 0; d <= 365; d++){
    const Hd = h0 + d * 24, v = pts.map(p => seaIceAt(p, Hd)), A = v.filter(x => x >= SEA_ICE_LIM).length; maxA = Math.max(maxA, A);
    if (prev){ const dd = Math.max(...v.map((x, i) => Math.abs(x - prev[i]))); dmax = Math.max(dmax, dd); if (new Date(EPOCH + Hd * 3600000).getUTCDate() === 1) dmaxTurn = Math.max(dmaxTurn, dd); amax = Math.max(amax, Math.abs(A - prevA)); }
    prev = v; prevA = A;
  }
  t.ok(pts.length > 100, 'prøvepunktene ligger over isen (' + pts.length + ')');
  t.ok(dmax < 4, 'ingen hopp: konsentrasjonen endrer seg høyst ' + dmax.toFixed(2) + ' prosentpoeng fra dag til dag');
  t.ok(dmaxTurn <= dmax + 1e-9 && dmaxTurn < 4, 'heller ikke ved månedsskiftet (' + dmaxTurn.toFixed(2) + ')');
  t.ok(amax <= Math.max(3, maxA * 0.05), 'det stengte havet endrer seg litt om gangen: høyst ' + amax + ' av ' + maxA + ' punkter fra en dag til den neste');
  // the edge in space: bilinear, no 25 km steps (two points 1 km apart differ by at most 5 %)
  let sm = 0; for (const p of pts.slice(0, 200)){ const q = {x:p.x + 1, y:p.y}; sm = Math.max(sm, Math.abs(seaIceAt(p, H(2027, 3, 15)) - seaIceAt(q, H(2027, 3, 15)))); }
  t.ok(sm <= 5, 'kanten er jevn i rommet: høyst ' + sm.toFixed(1) + ' % forskjell over 1 km');
  // the coast of the mainland and every harbour of the game are open all the year round
  let shutPorts = []; for (const pt of PORTS) for (let m = 1; m <= 12; m++) if (seaIceShut(pt.p, H(2027, m, 15))){ shutPorts.push(pt.name + ' ' + m); break; }
  t.ok(shutPorts.length === 0, 'ingen av spillets ' + PORTS.length + ' havner er stengt av isen noen måned' + (shutPorts.length ? ': ' + shutPorts.slice(0, 5).join(', ') : ''));
  for (const [nm, la, lo] of [['Hammerfest', 70.7, 23.4], ['Vardø', 70.4, 31.3], ['Båtsfjord', 70.75, 29.75], ['Bergen', 60.4, 5.0]]){
    const p = natP(la, lo); let mx = 0; for (let m = 1; m <= 12; m++) mx = Math.max(mx, seaIceAt(p, H(2027, m, 15))); t.ok(mx < 5, nm + ': ingen is noen måned (' + mx.toFixed(1) + ' %)'); }
  // the ice class
  t.ok(!seaIceShut(kkl, H(2027, 3, 15), {iceClass:'1C'}), 'en båt med isklasse kan gå inn i isen');
  // the sailing: a leg from open water into the ice stops at the ice, marked ice; out of the ice towards thinner ice is let go
  const S = K.get('S'); S.t = H(2027, 3, 15) * 60;
  // (no map in the unit tests: the land, the depth, the harbours, the breakwaters and the rocks are stood in for by open deep sea, so
  // only the ice decides)
  const keep = {}; for (const [n, f] of [['isLand', () => false], ['depthF', () => 300], ['inHarbour', () => false], ['coastSegHit', () => false], ['rocksIn', () => []]]){ keep[n] = K.get(n); K.set(n, f); }
  // along 30° E in March: open water south of the edge (the first point from the north with under 5 % ice), then north into the ice
  let la0 = 80; while (la0 > 70 && seaIceAt(natP(la0, 30.0)) >= 5) la0 -= 0.05;
  const a = natP(la0 - 0.3, 30.0); let b = null, e = null; for (let la = la0 - 0.3; la < 82; la += 0.01){ const q = natP(la, 30.0); if (seaIceShut(q)){ e = la; b = natP(la + 0.4, 30.0); break; } }
  t.ok(!!b, 'nordover fra åpent vann ved ' + la0.toFixed(1) + '° N 30° Ø kommer isen i mars' + (e ? ' (kanten ved ' + e.toFixed(2) + '° N)' : ''));
  if (b){
    let g = null, c = a; const step = 3, L = Math.hypot(b.x - a.x, b.y - a.y);   // the boat's minutes, a few km at a time, to the edge
    for (let s = 0; s < L && !g; s += step){ const q = {x:a.x + (b.x - a.x) * Math.min(1, (s + step) / L), y:a.y + (b.y - a.y) * Math.min(1, (s + step) / L)}; g = K.groundCheck(c, q); if (!g) c = q; }
    t.ok(g && g.ice, 'seilasen stopper ved iskanten, merket som is (' + (g ? (g.ice ? 'is' : 'grunt eller land') : 'ingenting') + ')');
    if (g && g.ice) t.ok(seaIceAt(g) >= SEA_ICE_LIM && seaIceAt(g) < SEA_ICE_LIM + 10, 'der den stopper, er isen så vidt over grensen (' + seaIceAt(g).toFixed(1) + ' %)');
    // a point a little inside the edge and one further in, where the ice is thicker
    const out = natP(e + 0.05, 30.0), inIce = natP(e + 0.25, 30.0);
    const gOut = K.groundCheck(inIce, out), gIn = K.groundCheck(out, inIce);
    t.ok(!(gOut && gOut.ice), 'en båt som står i isen, får gå ut mot tynnere is');
    t.ok(seaIceAt(out) < seaIceAt(inIce) && gIn && gIn.ice, 'men ikke lenger inn (' + seaIceAt(out).toFixed(0) + ' → ' + seaIceAt(inIce).toFixed(0) + ' %)');
    // Autonav's checks: shut at the time of the route, a leg through the ice fails
    const LI = K.get('LEIA_ICE'); Object.assign(LI, K.leiaIceSet(a, b));
    t.ok(LI.on && LI.cap === 0, 'Autonav regner med isen fra åpent vann (cap ' + LI.cap + ')');
    t.ok(K.leiaIce(inIce) && !K.leiaIce(a), 'Autonav stenger cellene i isen og ikke de i åpent vann');
    t.ok(!!K.leiaIceLeg(a, b), 'et bein inn i isen er stengt for Autonav');
    Object.assign(LI, K.leiaIceSet(inIce, a));
    t.ok(LI.cap > SEA_ICE_LIM && !K.leiaIceLeg(inIce, out), 'fra en båt i isen er veien ut åpen (cap ' + LI.cap.toFixed(0) + ' %)');
    Object.assign(LI, {on:false, H0:0, H1:0, cap:0});
  }
  for (const n in keep) K.set(n, keep[n]);
  // the phone's bars far out at sea and at Svalbard
  t.eq(coverage(natP(75.0, 30.0)), 0, 'ingen dekning ute i Barentshavet');
  t.eq(coverage(natP(78.23, 15.6)), 4, 'full dekning i Longyearbyen');
  t.eq(coverage(natP(79.9, 22.0)), 0, 'ingen dekning på Nordaustlandet (ingen bosetning)');
  const cdf = K.get('coastDistFar'); K.set('coastDistFar', () => 25); t.eq(coverage(natP(68.0, 9.0)), 0, 'langs fastlandet som før: ingen dekning 20 km eller mer fra land');
  K.set('coastDistFar', () => 2); t.eq(coverage(natP(69.65, 18.95)), 4, 'og full dekning nær land'); K.set('coastDistFar', cdf);
}
