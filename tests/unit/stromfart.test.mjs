// Fysikk 4 F8b (docs/planer/fysikk-4-sjo-og-skrog.md F8, steg 42): the stream in the manoeuvring model (core/16b-dyn.js): the speed over
// the ground, the drift with no way on, the time a leg takes, the sea that runs on to a stream (curWave, core/03b-sea.js), and that
// nothing changes where there is no stream. The unit tests have no map, so the stream is Saltstraumen's own (the sounds need none).
export default function (t){
  const K = t.K, KN = 1852 / 3600, need = ['curWave', 'curEff', 'curAlong', 'curBoat', 'curSogF', 'curLegH', 'dynSog'];
  const miss = need.filter(n => typeof K[n] !== 'function'); t.ok(!miss.length, 'funksjonene for F8b finnes (' + (miss.join(', ') || 'alle') + ')'); if (miss.length) return;
  // ---- waves on a current: (om - k U)^2 = g k and the wave action ----
  { const om = 2 * Math.PI / 4, c0 = 9.81 / om, z = K.curWave(om, 0);
    t.ok(z.kf === 1 && z.af === 1, 'uten strøm er bølgen som før');
    for (const U of [-1.5, -1, -0.5, 0.5, 1, 3]){ const w = K.curWave(om, U), k = om * om / 9.81 * w.kf; t.near((om - k * U) ** 2, 9.81 * k, 1e-9, 'bølgetallet løser (ω − k·U)² = g·k ved U = ' + U + ' m/s (k/k₀ ' + w.kf.toFixed(2) + ', H/H₀ ' + w.af.toFixed(2) + ')'); }
    const mot = K.curWave(om, -1), med = K.curWave(om, 1);
    t.ok(mot.kf > 1.2 && mot.af > 1.2 && med.kf < 0.9 && med.af < 0.9, 'motstrøm gir kortere og høyere sjø, medstrøm lengre og lavere');
    t.near(K.curWave(om, c0).af, 1 / Math.sqrt(1.6180339887 * 3.6180339887), 1e-6, 'høyden følger bølgeaksjonen (U = c₀: H/H₀ = 0,413)');
    const bl = K.curWave(om, -c0 / 4), over = K.curWave(om, -c0);
    t.ok(bl.af === K.CURW.max && over.af === K.CURW.max && over.blocked && K.curWave(om, -c0 / 4.2).af <= K.CURW.max, 'blokkert ved U = −c₀/4: klemt til faktor ' + K.CURW.max); }
  // ---- the dead band: under 0.2 knots nothing, all of it from 0.3 ----
  { const e = kn => K.curEff({sx:kn * KN, sy:0}).m / KN;
    t.ok(e(0.19) === 0 && e(0.1) === 0, 'under 0,2 knop kjenner båten ingen strøm');
    t.near(e(0.35), 0.35, 1e-9, 'fra 0,3 knop kjenner hun hele (0,35 kn)'); t.near(e(5), 5, 1e-9, '5 knop er 5 knop'); }
  // ---- Saltstraumen at the springs ----
  if (!(K.STROM && K.STROM.s && K.STROM.s.length)){ t.ok(false, 'strømfeltet mangler'); return; }
  const c0 = K.P(67.2335, 14.623); let q = null, bd = 1e9; for (const r of K.STROM.s){ const d = Math.hypot(r.x - c0.x, r.y - c0.y); if (d < bd){ bd = d; q = r; } }
  const at = {x:q.x, y:q.y}, H0 = Math.round((Date.UTC(2027, 2, 1, 0) - K.EPOCH) / 6e4) / 60;
  let Hf = H0, best = 0; for (let h = 0; h < 15 * 24; h += 0.25){ const c = K.curAt(at, H0 + h); if (c.snd > best){ best = c.snd; Hf = H0 + h; } }
  const C = K.curEff(K.curAt(at, Hf)), cd = Math.atan2(C.x, -C.y), gs = K.gridScale(at);
  t.ok(C.m > 6 * KN, 'Saltstraumen ved springflo: ' + (C.m / KN).toFixed(1) + ' kn i det trangeste');
  const E = {cm:C.m, cx:C.x, cy:C.y};
  // a boat with no way on is carried with the stream
  { const s = K.dynZero(); s.X = at.x * 1000; s.Y = at.y * 1000; for (let i = 0; i < 50; i++) K.dynMove(s, 0.2, E);
    const dx = s.X - at.x * 1000, dy = s.Y - at.y * 1000;
    t.near(Math.hypot(dx, dy), C.m * 10 * gs, 0.01, 'en båt i ro driver med strømmen (' + Math.hypot(dx, dy).toFixed(1) + ' m på 10 s)');
    t.ok(dx * C.x + dy * C.y > 0.999 * Math.hypot(dx, dy) * C.m, 'driften går den veien strømmen går'); }
  // under engine against it she is slower over the ground, with it faster, by the stream
  { const u = 7 * KN, run = (hd, EE) => { const s = K.dynZero(); s.X = at.x * 1000; s.Y = at.y * 1000; s.psi = hd; s.u = u; for (let i = 0; i < 50; i++) K.dynMove(s, 0.2, EE); return Math.hypot(s.X - at.x * 1000, s.Y - at.y * 1000) / 10 / gs; };
    const mot = run(cd + Math.PI, E), med = run(cd, E), uten = run(cd, null), null0 = run(cd, {cm:0, cx:5, cy:5});
    t.near(mot, Math.abs(u - C.m), 1e-6, 'for motor mot strømmen går hun saktere over grunn (' + (mot / KN).toFixed(1) + ' kn av 7,0)');
    t.near(med, u + C.m, 1e-6, 'med strømmen går hun fortere (' + (med / KN).toFixed(1) + ' kn)');
    t.ok(uten === null0 && Math.abs(uten - u) < 1e-9, 'uten strøm endres ingenting (7,0 kn over grunn)');
    t.near(K.curSogF(C, cd, u), (u + C.m) / u, 1e-9, 'minuttsteget får samme fart med strømmen');
    t.near(K.curSogF(C, cd + Math.PI, 10 * KN), (10 * KN - C.m) / (10 * KN), 1e-9, 'og mot den (10 kn gjennom vannet)');
    t.ok(K.curSogF(C, cd + Math.PI, 3 * KN) === 0, 'en båt som ikke klarer strømmen, blir stående (0)');
    { const e = K.curEff({sx:0.18, sy:0, tx:0.02, ty:0}); t.ok(e.m > 0.17 && e.tx === 0 && e.ty === 0, 'kyststrømmen bærer henne under fart, men ikke når hun ligger stille (bare det som snur med tidevannet)'); const s2 = K.curEff(K.curAt(at, Hf)); t.ok(Math.hypot(s2.tx, s2.ty) > 6 * KN, 'i Saltstraumen driver en båt i ro med hele straumen'); }
    t.ok(K.curSogF({x:0, y:0, m:0}, 1, u) === 1 && K.curSogF(null, 1, u) === 1, 'ingen strøm: farten over grunn er farten gjennom vannet');
    // across the course she heads up: v^2 - cross^2 is left
    t.near(K.curSogF({x:C.m, y:0, m:C.m}, 0, 10 * KN), Math.sqrt(100 * KN * KN - C.m * C.m) / (10 * KN), 1e-9, 'strøm tvers på kursen: hun holder opp og mister fart'); }
  // dynEnv: the stream is in it where there is one, and nothing where there is none
  { const cal = K.dynCal('sjark'), b = {type:'sjark', pos:{x:at.x, y:at.y}, heading:0, status:'sailing'}, d = K.dynZero(); d.X = at.x * 1000; d.Y = at.y * 1000;
    const Es = K.dynEnv(b, d, cal, Hf);
    t.ok(Math.abs(Es.cm - C.m) < 1e-9 && Math.abs(Es.cx - C.x) < 1e-9, 'dynEnv har strømmen der båten er (' + (Es.cm / KN).toFixed(1) + ' kn)');
    const p0 = K.P(66.5, 9.0), b0 = {type:'sjark', pos:p0, heading:0, status:'sailing'}, d0 = K.dynZero(), E0 = K.dynEnv(b0, d0, cal, Hf);
    const U = K.windAt(Hf, p0), a = (K.windDir(Hf, p0) - K.gridGamma(p0) + 180) * Math.PI / 180;
    t.ok(E0.cm === 0 && E0.cx === 0 && E0.cy === 0 && E0.wE === U * Math.sin(a) && E0.wN === U * Math.cos(a), 'der det ikke går strøm, er alt som før (ingen strøm, vinden uendret)'); }
  // the time through: with the stream, in still water, against it (the sjark at 7 knots, 2 km either side of the narrows)
  { const A = {x:q.x - q.ax * 2, y:q.y - q.ay * 2}, B = {x:q.x + q.ax * 2, y:q.y + q.ay * 2}, still = K.kmTrue(A, B) / K.NM / 7;
    const inn = K.curLegH(A, B, 7, Hf - 4 / 60), ut = K.curLegH(B, A, 7, Hf - 4 / 60), sgn = C.x * q.ax + C.y * q.ay > 0;
    const med = sgn ? inn : ut, mot = sgn ? ut : inn;
    t.ok(med < still && still < mot, 'gjennom Saltstraumen (4 km, sjarken i 7 kn ved springflo): ' + (med * 60).toFixed(1) + ' min med strømmen, ' + (still * 60).toFixed(1) + ' i stille vann, ' + (mot * 60).toFixed(1) + ' mot');
    t.ok(mot > 1.3 * still, 'mot strømmen tar turen merkbart lengre tid (' + (mot / still).toFixed(2) + '×)');
    const F = K.P(66.5, 9.0), G = {x:F.x + 12, y:F.y - 9}, far = K.curLegH(F, G, 7, Hf);
    t.near(far, K.kmTrue(F, G) / K.NM / 7, 1e-9, 'en etappe uten strøm tar samme tid som før'); }
  // the GPS: a boat lying still shows her drift over the ground
  { const S0 = K.get('S'), b = {type:'sjark', pos:{x:at.x, y:at.y}, heading:0, status:'idle', port:null, drv:null}, S = {t:100, boat:b, plan:null}; K.set('S', S);
    try {
      b.drv = {x:C.x * 0.06, y:C.y * 0.06, t:S.t, st:'idle'};
      const g = K.dynSog(b); t.near(g.kn, C.m / KN / K.gridScale(b.pos), 0.02, 'GPS-en viser driften som fart over grunn (' + g.kn.toFixed(1) + ' kn)');
      t.near(Math.cos(g.cog - cd), 1, 1e-6, 'og kursen over grunn er den veien strømmen går');
      b.drv = null; t.ok(K.dynSog(b).kn === 0, 'ligger hun stille, er farten over grunn null');
    } finally { K.set('S', S0); } }
}
