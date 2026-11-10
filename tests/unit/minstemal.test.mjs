// The minimum sizes (steg 59, 10.11.2026; Jonas 07.11.2026, valg 3 A: «etter § 47 med sonene»): SPECIES.minKg and minKgAt follow
// høstingsforskriften § 47 as read on Lovdata 10.11.2026 (last amended FOR-2026-10-02-1999): cod 44 cm north of 62° N outside 4 nm of the
// baselines, 55 cm within, 40 cm south; haddock 40/32; saithe 45/40 (not purse seine); redfish 30 cm outside 12 nm, 32 within; Greenland
// halibut 45 cm; halibut 84 cm and 7.2 kg; pollack, ling and tusk have none. The length is turned into weight with the model's own curve
// (lwKg; netLen in 10-gear.js is its inverse), so the fish the nets measure and the fish the rule lets go are the same fish. The coast
// guard's sample (09j-kystvakt.js) uses the same table and curve, and § 49 seventh paragraph (20 % cod with jig and line within 4 nm).
export default function (t){
  const K = t.K, {SPECIES, MIN47, min47Cm, minKgAt, lwKg, netLen, letGo, kvMinCm, kvCmKg, kvMix, blNm, P, F26} = K;
  K.set('S', K.newState());
  t.ok(typeof minKgAt === 'function' && MIN47, 'minKgAt og MIN47 finnes (02-species-gear.js)');
  if (typeof minKgAt !== 'function' || !MIN47) return;

  // the table, entry for entry against § 47
  t.ok(MIN47.torsk.n === 44 && MIN47.torsk.n4 === 55 && MIN47.torsk.s === 40, '§ 47 nr. 31: torsk 44 cm nord for 62° N utenfor 4 nm, 55 cm innenfor, 40 cm sør');
  t.ok(MIN47.hyse.n === 40 && MIN47.hyse.s === 32, '§ 47 nr. 7: hyse 40 cm nord for 62° N, 32 cm sør');
  t.ok(MIN47.sei.n === 45 && MIN47.sei.s === 40, '§ 47 nr. 20: sei 45 cm nord for 62° N, 40 cm sør (ikke not)');
  t.ok(MIN47.uer.n === 30 && MIN47.uer.s === 30 && MIN47.uer.i12 === 32, '§ 47 nr. 32: uer 30 cm utenfor 12 nm, 32 cm innenfor');
  t.ok(MIN47.blakveite.n === 45 && MIN47.blakveite.s === 45, '§ 47 nr. 1: blåkveite 45 cm');
  t.ok(MIN47.kveite.n === 84 && MIN47.kveite.kg === 7.2, '§ 47 nr. 9: kveite 84 cm og 7,2 kg');
  t.ok(!MIN47.lyr && !MIN47.lange && !MIN47.brosme, '§ 47: lyr, lange og brosme har ikke minstemål');
  t.ok(SPECIES.lyr.minKg === 0 && SPECIES.lange.minKg === 0 && SPECIES.brosme.minKg === 0, 'og SPECIES.minKg er 0 for dem (alt kommer om bord)');

  // the curve: W = 0.0068 L^3.1 g for all but the Greenland halibut (4.06e-6 L^3.245 kg), the inverse of netLen
  t.near(lwKg('torsk', 44), 0.845, 0.005, 'en torsk på 44 cm veier 0,85 kg'); t.near(lwKg('torsk', 55), 1.69, 0.01, 'en torsk på 55 cm veier 1,69 kg');
  t.near(lwKg('torsk', 40), 0.63, 0.005, 'en torsk på 40 cm veier 0,63 kg'); t.near(lwKg('sei', 45), 0.906, 0.005, 'en sei på 45 cm veier 0,91 kg');
  t.near(lwKg('blakveite', 45), 0.94, 0.01, 'en blåkveite på 45 cm veier 0,94 kg (kurven for blåkveite)');
  t.near(netLen(lwKg('hyse', 40)), 40, 1e-6, 'netLen er den omvendte av kurven');

  // the places: 2 nm and 20 nm off Troms (north of 62° N), the open coast off Bergen (south of it)
  const mid = f => ({lat:(f.l1[0][0] + f.l1[1][0] + f.l2[0][0] + f.l2[1][0]) / 4, lon:(f.l1[0][1] + f.l1[1][1] + f.l2[0][1] + f.l2[1][1]) / 4});
  const off = want => { const m = mid(F26[0]); let best = null; for (let k = -500; k <= 500; k++){ const p = P(m.lat + 0.002 * k, m.lon - 0.006 * k), nm = blNm(p); if (best === null || Math.abs(nm - want) < Math.abs(best.nm - want)) best = {p, nm}; } return best; };
  const p2 = off(2), p8 = off(8), p20 = off(20), s62 = P(60.4, 4.6), s62far = P(60.4, 3.0);
  t.ok(p2.nm < 4 && p8.nm > 4 && p8.nm < 12 && p20.nm > 12, `fant punkter ${p2.nm.toFixed(1)}, ${p8.nm.toFixed(1)} og ${p20.nm.toFixed(1)} nm fra grunnlinja utenfor Troms`);
  t.eq(min47Cm('torsk', p2.p), 55, 'torsk 2 nm av grunnlinja nord for 62° N: 55 cm'); t.eq(min47Cm('torsk', p20.p), 44, 'torsk 20 nm av: 44 cm');
  t.eq(min47Cm('torsk', s62), 40, 'torsk sør for 62° N: 40 cm'); t.eq(min47Cm('hyse', s62), 32, 'hyse sør for 62° N: 32 cm'); t.eq(min47Cm('sei', s62), 40, 'sei sør for 62° N: 40 cm');
  t.eq(min47Cm('hyse', p2.p), 40, 'hyse nord for 62° N innenfor 4 nm: 40 cm (bare torsken har 55)'); t.eq(min47Cm('sei', p2.p), 45, 'sei nord for 62° N: 45 cm');
  t.eq(min47Cm('uer', p8.p), 32, 'uer innenfor 12 nm: 32 cm'); t.eq(min47Cm('uer', p20.p), 30, 'uer utenfor 12 nm: 30 cm');
  t.ok(blNm(s62far) > 12 ? min47Cm('uer', s62far) === 30 : true, 'uer utenfor 12 nm sør for 62° N: 30 cm');
  t.eq(min47Cm('lange', p2.p), 0, 'lange: ikke minstemål');
  t.near(minKgAt('torsk', p2.p), 1.69, 0.01, 'minKgAt: torsk under 1,69 kg slippes innenfor 4 nm nord for 62° N');
  t.near(minKgAt('torsk', p20.p), 0.845, 0.005, 'og under 0,85 kg utenfor'); t.near(minKgAt('torsk', s62), 0.63, 0.005, 'og under 0,63 kg sør for 62° N');
  t.near(minKgAt('kveite', p2.p), 7.2, 1e-9, 'kveite: 7,2 kg (forskriften gir vekta selv)');
  t.near(minKgAt('blakveite', p20.p), 0.94, 0.01, 'blåkveite: 0,94 kg');
  t.near(SPECIES.torsk.minKg, minKgAt('torsk'), 1e-12, 'SPECIES.minKg er tallet nord for 62° N utenfor 4 nm (det Fiskeguiden viser uten posisjon)');
  t.near(SPECIES.sei.minKg, lwKg('sei', 45), 1e-12, 'SPECIES.sei.minKg er 45 cm (før 0,35 kg)'); t.near(SPECIES.hyse.minKg, lwKg('hyse', 40), 1e-12, 'SPECIES.hyse.minKg er 40 cm (før 0,5 kg)');

  // what goes over the side: under the minimum for the place, the halibut over 100 kg, and (the caller's H) the halibut's closed season
  const Hj = (Date.UTC(2027, 6, 15, 12) - K.EPOCH) / 36e5;
  t.ok(letGo('torsk', 1.2, p2.p, Hj) && !letGo('torsk', 1.2, p20.p, Hj) && !letGo('torsk', 1.2, s62, Hj), 'en torsk på 1,2 kg slippes 2 nm av Troms, ikke 20 nm av og ikke ved Bergen');
  t.ok(!letGo('lange', 0.4, p2.p, Hj) && letGo('kveite', 120, p20.p, Hj) && letGo('kveite', 6, p20.p, Hj) && !letGo('kveite', 30, p20.p, Hj), 'liten lange beholdes; kveite over 100 kg og under 7,2 kg slippes');

  // the coast guard asks the same table and curve
  t.ok(kvMinCm('torsk', p2.p) === 55 && kvMinCm('hyse', s62) === 32 && kvMinCm('uer', p8.p) === 32, 'Kystvaktas stikkprøve bruker samme tabell (kvMinCm = min47Cm)');
  t.near(kvCmKg('torsk', 55), lwKg('torsk', 55), 1e-12, 'og samme kurve (kvCmKg = lwKg)');
  // § 49 seventh paragraph: cod with jig and line within 4 nm north of 62° N, 20 % cod under the minimum size in number
  const m7 = kvMix({torsk:[100, 18]}, p2.p, 'juksa', 'torsk');
  t.ok(m7 && m7.lim === 0.20 && m7.led === 'sjuende' && !(m7.pct > m7.lim), '§ 49 sjuende ledd: 18 av 100 torsk under 55 cm med juksa innenfor 4 nm er innenfor 20 %');
  const m7l = kvMix({torsk:[100, 18]}, p2.p, 'line', 'torsk'); t.ok(m7l && m7l.lim === 0.20, 'det samme med line');
  const m4 = kvMix({torsk:[100, 18]}, p20.p, 'line', 'torsk'); t.ok(m4 && m4.lim === 0.15 && m4.pct > m4.lim, 'utenfor 4 nm gjelder fjerde ledd (15 %)');
  const mg = kvMix({torsk:[100, 18]}, p2.p, 'garn', 'torsk'); t.ok(mg && mg.lim === 0.15, 'garn innenfor 4 nm: fjerde ledd (sjuende er bare juksa og line)');
}
