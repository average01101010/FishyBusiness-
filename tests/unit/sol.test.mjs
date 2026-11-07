// The sun, the polar night, the midnight sun and the aurora far north (H1b R5): sunAt and sunTimes at Longyearbyen (78.2° N) and at
// 80° N, against the almanac's dates (the sun's upper limb, with the refraction: in Longyearbyen the midnight sun from about 20 April to
// 23 August and the sun under the horizon all day from about 26 October to 15 February), and the aurora possible in the polar night.
export default function (t){
  const K = t.K, {sunAt, sunTimes, auroraAt, natP, newState, EPOCH} = K;
  K.set('S', newState());
  // the game's clock reads Norwegian winter time (UTC+1) in the UTC fields of gDate, as the core's jdays takes it
  const H = (y, m, d, h = 12) => (Date.UTC(y, m - 1, d) - EPOCH) / 3600000 + h;
  const lyr = natP(78.22, 15.63), n80 = natP(80.0, 20.0), kvit = natP(80.1, 32.0);
  // 80° N: the sun never sets at midsummer, never rises at midwinter
  t.ok(sunTimes(H(2027, 6, 21), n80).always, '80° N: midnattssol 21. juni');
  t.ok(sunTimes(H(2027, 12, 21), n80).never, '80° N: mørketid 21. desember');
  let mn = 99; for (let h = 0; h < 24; h += 0.5) mn = Math.min(mn, sunAt(H(2027, 6, 21, h), n80).el);
  t.ok(mn > 9 && mn < 15, '80° N: sola står ' + mn.toFixed(1) + '° over horisonten ved midnatt midtsommer (venter rundt 13,5°)');
  let mx = -99; for (let h = 0; h < 24; h += 0.5) mx = Math.max(mx, sunAt(H(2027, 12, 21, h), n80).el);
  t.ok(mx < -10, '80° N: sola når høyst ' + mx.toFixed(1) + '° midtvinters (venter rundt −13,4°)');
  // Longyearbyen: the polar night and the midnight sun begin and end where the almanac has them, within a few days
  const st = (m, d) => sunTimes(H(2027, m, d), lyr);
  t.ok(st(10, 21).up !== null, 'Longyearbyen 21. oktober: sola står opp');
  t.ok(st(10, 31).never, 'Longyearbyen 31. oktober: mørketid');
  t.ok(st(2, 10).never, 'Longyearbyen 10. februar: fortsatt mørketid');
  t.ok(st(2, 20).up !== null, 'Longyearbyen 20. februar: sola er tilbake');
  t.ok(!st(4, 14).always, 'Longyearbyen 14. april: sola går fortsatt ned');
  t.ok(st(4, 25).always, 'Longyearbyen 25. april: midnattssol');
  t.ok(st(8, 19).always, 'Longyearbyen 19. august: midnattssol');
  t.ok(!st(8, 29).always, 'Longyearbyen 29. august: sola går ned igjen');
  // the azimuth is true north's: at the local noon the sun stands in the south, also where γ is large (Kvitøya, γ 17°)
  for (const [nm, p, lon] of [['Longyearbyen', lyr, 15.63], ['Kvitøya', kvit, 32.0]]){
    // the local noon on the game's clock (UTC+1)
    const noon = 13 - lon / 15; let best = -99, az = 0; for (let h = noon - 1; h <= noon + 1; h += 1 / 60){ const s = sunAt(H(2027, 6, 21, h), p); if (s.el > best){ best = s.el; az = s.az * 180 / Math.PI; } }
    t.ok(Math.abs(az - 180) < 3, nm + ': sola står i sør (' + az.toFixed(1) + '° sann) når den står høyest');
  }
  // the aurora in the polar night at Longyearbyen: some clear nights of the winter; never in the midnight sun
  let n = 0, m = 0; for (let d = 0; d < 60; d++) for (const h of [20, 23, 2]){ m++; if (auroraAt(H(2027, 12, 1, h) + d * 24, lyr) > 0) n++; }
  t.ok(n > 0 && n < m, 'nordlys i mørketida i Longyearbyen noen av nettene (' + n + ' av ' + m + ' prøvetider)');
  let z = 0; for (let d = 0; d < 30; d++) z += auroraAt(H(2027, 6, 5, 0) + d * 24, lyr); t.eq(z, 0, 'ingen nordlys i midnattssola');
}
