// The quota chain (core/03d-quota.js) against J-161-2026: § 5 (the groups), § 16 (cod per quota factor), §§ 18–19 (haddock and
// saithe by largest length) and the length bands the closed group's figures turn on (11 m and 15 m). The code is written to give § 5
// exactly for 2026, so the tolerances are tonnes, not per cent.
export default function (t){
  const {REG26, HJ, norQuota, codChain, yearQuota, licQ, newState, EPOCH} = t.K;
  t.K.set('S', newState());
  const H26 = (Date.UTC(2026, 10, 15) - EPOCH) / 36e5;   // 15 November 2026, in game hours (before EPOCH, so negative)

  // Norway's share of the agreed total quota (§ 2), the 2019–2025 formula
  t.near(norQuota('torsk', REG26.tac.torsk), REG26.nor.torsk, 1, 'norsk torskekvote 2026 fra totalkvoten (§ 2)');
  t.near(norQuota('hyse', REG26.tac.hyse), REG26.nor.hyse, 1, 'norsk hysekvote 2026');
  t.near(norQuota('sei', REG26.tac.sei), REG26.nor.sei, 1, 'norsk seikvote 2026');

  // the chain from Norway's cod quota to the groups (§ 5)
  const ch = codChain(REG26.nor.torsk);
  t.near(ch.open, REG26.open.torsk, 1, 'åpen gruppe torsk (§ 5)');
  t.near(ch.openFF, REG26.open.ff, 1, 'ferskfiskordningen i åpen gruppe (§ 5)');
  t.near(ch.lukket, REG26.lukket.torsk, 1, 'lukket gruppe torsk (§ 5)');
  t.near(ch.ff, REG26.lukket.ff, 1, 'ferskfiskordningen i lukket gruppe (§ 5)');
  for (const g of ['u11', 'g11', 'g15', 'g21']) t.near(ch.grp[g], REG26.grp[g], 1, 'gruppekvote ' + g + ' (§ 5, Finnmarksmodellen)');
  // the trawl ladder: 28 % of what is left under 130 000 t, 33 % over 330 000 t, straight between. The trawl share is read back
  // from the closed group's quota: lukket = R × (1 − tr) × 0.8719, with R what is left after the top set-asides and the open group
  const tr = N => { const c = codChain(N), top = 880 + 7000 + Math.max(3000, 0.009 * N) + 500 + 2543 + 450, R = N - top - c.open; return 1 - c.lukket / (R * 0.8719); };
  t.near(tr(100000), 0.28, 1e-9, 'trålstigen under 130 000 t: 28 %');
  t.near(tr(600000), 0.33, 1e-9, 'trålstigen over 330 000 t: 33 %');
  t.ok(tr(200000) > 0.28 && tr(200000) < tr(300000) && tr(300000) < 0.33, 'trålstigen stiger jevnt mellom');

  // the year 2026 as it was: the units of § 16, the open group's maximum and guaranteed quotas of §§ 21, 26, 27
  const Y = yearQuota(2026);
  t.eq(Y.y, 2026, 'yearQuota(2026).y');
  for (const g in REG26.unit) t.near(Y.unit[g], REG26.unit[g], 0.001, 'kvoteenhet ' + g + ' 2026 (§ 16)');
  t.eq(Y.open.max, REG26.openMax, 'åpen gruppe maksimalkvoter 2026');
  t.eq(Y.open.guar, REG26.openGuar, 'åpen gruppe garanterte kvoter 2026');
  t.eq(Y.open.hyseG, REG26.hyseG, 'åpen gruppe hyse 2026');
  t.eq(Y.open.seiG, REG26.seiG, 'åpen gruppe sei 2026');
  t.eq(Y.open.ov, 1, '2026 har ingen overregulering (ov = 1)');
  // the year after comes from the stock model and is still a sane chain
  const Y27 = yearQuota(2027);
  t.ok(Y27.tac.torsk > 100000 && Y27.tac.torsk < 600000, '2027 totalkvote torsk fra bestandsmodellen er rimelig');
  t.ok(Y27.open.ov >= 0.85 && Y27.open.ov <= 1.15, '2027 overregulering innenfor OPENF.ov');
  t.ok(Y27.open.max.every((m, i) => m >= Y27.open.guar[i]), '2027 maksimalkvote ≥ garantert kvote per lengdegruppe');
  t.ok(yearQuota(2027) === Y27, 'yearQuota er bufret per år og qseed');

  // a right's quotas in kg (§§ 16, 18, 19) on boats either side of the 11 m and 15 m bands
  const h10 = licQ({id:'h10'}, H26, 10.5);
  t.eq(h10.torsk, Math.round(HJ.h10.kf * REG26.unit.u11 * 1000), 'h10 torsk 2026 = kvotefaktor × enhet (§ 16)');
  t.eq(h10.hyse, [Infinity, 9915], 'h10 hyse under 11 m: intet maksimum, garantert 9 915 kg');
  t.eq(h10.sei, [334990, 10810], 'h10 sei under 11 m: maks 334,99 t, garantert 10,81 t');
  t.eq(licQ({id:'h10'}, H26, 10.99).sei[0], 334990, 'h10 sei på 10,99 m er under 11-metersgrensen');
  t.eq(licQ({id:'h10'}, H26, 11.00).sei[0], 172900, 'h10 sei på 11,00 m går til båndet 11–14,99 m');
  t.eq(licQ({id:'h10'}, H26, 15.00).sei[0], 91850, 'h10 sei på 15,00 m går til båndet 15 m og over');
  t.eq(licQ({id:'h14'}, H26, 10.99).hyse[0], 308849, 'h14 hyse under 11 m: maks 308,849 t');
  t.eq(licQ({id:'h14'}, H26, 11.00).hyse[0], 164720, 'h14 hyse fra 11 m: maks 164,72 t');
  t.eq(licQ({id:'h14'}, H26, 14.99).sei[0], 67140, 'h14 sei under 15 m');
  t.eq(licQ({id:'h14'}, H26, 15.00).sei[0], 44760, 'h14 sei fra 15 m');
  t.eq(licQ({id:'h20'}, H26, 20.9).sei[0], 91150, 'h20 sei under 21 m');
  t.eq(licQ({id:'h20'}, H26, 21.0).sei[0], 68360, 'h20 sei fra 21 m');
  // the quota follows the quota length, whatever the boat: cod does not change with the largest length
  t.eq(licQ({id:'h10'}, H26, 20).torsk, h10.torsk, 'torskekvoten følger hjemmelslengden, ikke båten');
  // structure quotas and a cooperation add quota factors, in proportion for haddock and saithe
  const st = licQ({id:'h10', extra:HJ.h9.kf * 0.9}, H26, 10.5);
  t.near(st.torsk / h10.torsk, (HJ.h10.kf + HJ.h9.kf * 0.9) / HJ.h10.kf, 0.001, 'strukturkvote legger kvotefaktoren til torsken');
  t.near(st.sei[1] / h10.sei[1], st.torsk / h10.torsk, 0.002, 'strukturkvoten skalerer garantert sei i samme forhold');
  const co = licQ({id:'h10', coop:{id:'h9', y:2026}}, H26, 10.5);
  t.near(co.torsk, Math.round((HJ.h10.kf + HJ.h9.kf) * REG26.unit.u11 * 1000), 1, 'samfiske for 2026 legger partnerens faktor til');
  t.eq(licQ({id:'h10', coop:{id:'h9', y:2025}}, H26, 10.5).torsk, h10.torsk, 'samfiske for et annet år teller ikke');
  // old saves and no right
  t.eq(licQ(null, H26, 10), {torsk:0, hyse:[0, 0], sei:[0, 0]}, 'uten rettighet: null kvote');
  t.eq(licQ({cod:5000}, H26, 10).torsk, 5000, 'gammel lagring med fast torskekvote beholder den');
  t.eq(licQ({id:'h10'}, H26).torsk, h10.torsk, 'uten lengde brukes BOAT.len');
}
