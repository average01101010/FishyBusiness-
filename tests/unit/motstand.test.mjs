// Ø9 F5 (docs/planer/fysikk-4-sjo-og-skrog.md): the wave hump in the resistance, squat after Barrass, the shallow water's cap
// (Schlichting/Lackenby) and the bank effect, on the manoeuvring model (core/16b-dyn.js) in calm water
export default function (t){
  const K = t.K, KN = K.NM * 1000 / 3600, need = ['dynHumpG', 'dynRes', 'dynUeq', 'dynSquat', 'dynShallowF', 'dynBankF'];
  const miss = need.filter(n => typeof K[n] !== 'function'); t.ok(!miss.length, 'funksjonene for F5 finnes (' + (miss.join(', ') || 'alle') + ')'); if (miss.length) return;
  const COAST = ['skiff', 'trebat', 'snekke', 'plastsjark', 'sjark', 'hurtigsjark', 'sjarkny', 'breisjark', 'kyst15', 'kyst21'];
  // ---- the hump's shape: Fr^4 below, a top of 1 at Fr 0.45, falling off above ----
  t.near(K.dynHumpG(0.45), 1, 1e-9, 'kneika er på topp ved Fr 0,45');
  t.near(K.dynHumpG(0.2) / K.dynHumpG(0.1), 16, 0.2, 'under kneika vokser bølgemotstanden som Fr⁴');
  t.ok(K.dynHumpG(0.9) < 0.15 && K.dynHumpG(0.6) < K.dynHumpG(0.45), 'over kneika faller den (Fr 0,9: ' + K.dynHumpG(0.9).toFixed(3) + ')');
  for (const type of COAST){
    const c = K.dynCal(type), P = c.P, V = K.VESSELS[type], ueq = K.dynUeq(P) / KN;
    // full ahead still holds the top speed
    t.near(ueq / V.vmax, 1, 0.03, type + ': full fart holder toppfarten (' + ueq.toFixed(2) + ' av ' + V.vmax + ' kn)');
    // the resistance per (m/s)^2: up to the hump it grows, over it it falls (a planing hull is over it at top speed)
    const r2 = u => K.dynRes(P, u) / (u * u), uh = 0.45 * P.sgL;
    if (V.planing){
      t.ok(r2(uh) > 1.3 * r2(2 * uh), type + ': planende, motstanden per fart² er størst i kneika og faller over den (' + (r2(uh) / r2(2 * uh)).toFixed(2) + '×)');
      let stuck = null; for (let u = 0.2; u < 0.97 * P.umax; u += 0.1) if (P.Tmax * (1 - 0.35 * u / P.umax) <= K.dynRes(P, u)){ stuck = u / KN; break; }
      t.ok(stuck === null, type + ': full gass tar henne over kneika' + (stuck ? ' (står fast ved ' + stuck.toFixed(1) + ' kn)' : ''));
    } else {
      t.ok(r2(P.umax) > 1.4 * r2(0.5 * P.umax), type + ': deplasement, motstanden per fart² stiger mot skrogfarten (' + (r2(P.umax) / r2(0.5 * P.umax)).toFixed(2) + '×)');
    }
  }
  // ---- squat after Barrass: Cb V^2 / 100 (V in knots), twice that in a narrow sound; a planing hull rises out of it ----
  { const P = K.dynCal('sjark').P, o = K.dynSquat(P, 8 * KN, false), n = K.dynSquat(P, 8 * KN, true), T = K.VESSELS.sjark.draft;
    t.near(o, P.Cb * 0.64, 1e-9, 'sjarken i 8 knop synker Cb·V²/100 = ' + o.toFixed(2) + ' m i åpent farvann');
    t.near(n, 2 * o, 1e-9, 'og dobbelt så mye i et trangt sund (' + n.toFixed(2) + ' m)');
    t.ok(T + n > 1.9 && T + n < 2.3, 'i et sund i 8 knop tar hun bunnen over 1,9 m og ikke over 2,3 m (dypgang ' + (T + n).toFixed(2) + ' m)');
    t.ok(T + o > 1.75 && T + o < 1.9, 'i åpent farvann i 8 knop tar hun bunnen over 1,75 m og ikke over 1,9 m (dypgang ' + (T + o).toFixed(2) + ' m)');
    t.eq(K.dynSquat(P, 0, true), 0, 'i ro ingen squat'); }
  { const P = K.dynCal('skiff').P; t.ok(K.dynSquat(P, 23 * KN, false) < 0.01, 'skiffen på plan i 23 knop synker ikke (' + K.dynSquat(P, 23 * KN, false).toFixed(3) + ' m)'); }
  // ---- the shallow water's cap (Lackenby's form of Schlichting): nothing at two draughts and over, more the shallower ----
  { const P = K.dynCal('sjark').P, v = 8 * KN, f = h => K.dynShallowF(P, h, v);
    t.eq(f(2 * P.T), 1, 'to dypganger under: ingen gruntvannsmotstand'); t.eq(f(50), 1, 'dypt vann: ingen');
    t.ok(f(1.3 * P.T) < f(1.6 * P.T) && f(1.6 * P.T) < 1 && f(1.15 * P.T) > 0.4, 'grunnere vann, saktere (' + [1.15, 1.3, 1.6].map(k => f(k * P.T).toFixed(2)).join(', ') + ' av farten ved 1,15, 1,3 og 1,6 dypganger)'); }
  // ---- the bank: the stern is drawn in to the wall, the bow pushed off it ----
  { const P = K.dynCal('sjark').P, F = K.dynBankF(P, P.B / 2 + 2, 1, 5);
    t.ok(F.Y > 0 && F.N < 0, 'kaimur om styrbord: kraften inn mot muren, baugen ut (Y ' + F.Y.toFixed(0) + ', N ' + F.N.toFixed(0) + ')');
    t.eq(K.dynBankF(P, P.B / 2 + 3.1 * P.B, 1, 5).Y, 0, 'mer enn tre bredder unna: ingen bankeffekt');
    t.ok(K.dynBankF(P, P.B / 2 + 2, 1, 2).Y > 2 * F.Y, 'grunnere vann, sterkere bankeffekt');
    // along a quay wall 2 m off, 6 knots, the wheel amidships, three lengths: she sheers off 3-8 degrees
    const E = {kT:1, kR:1, fe:0, fn:0, dq:0, wE:0, wN:0, bY:F.Y, bN:F.N, side:1}, s = K.dynZero(); s.u = 6 * KN; const thr = K.dynThrEq(P, s.u, 1);
    for (let tt = 0; s.Y > -3 * P.L && tt < 60; tt += 0.1){ K.dynInt(P, s, thr, 0, 0.1, 1, E); K.dynMove(s, 0.1); }
    const deg = -s.psi * 180 / Math.PI; t.ok(deg >= 3 && deg <= 8, 'langs kaimuren i 6 knop med roret midtskips gir hun ' + deg.toFixed(1) + '° ut fra muren på tre lengder'); }
}
