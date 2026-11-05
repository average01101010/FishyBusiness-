// The autoline (H2a of docs/planer/havsteget-h2-autoline.md, 05.11.2026): høstingsforskriften § 26 (no line set by a vessel over 21.35 m
// with a baiting machine within 4 nm of the mainland's baseline, and within 10 nm in three areas in their periods; the corners read on
// Lovdata), the ling and tusk rules for 28 m and over (J-128-2026 and the proposal for 2027), the autoline aboard (made from the vessel's
// autoHooks, with a marker set per lenke) and its pace. The catch per 1,000 hooks needs the chart and is checked in tests/autolinetest.py.
export default function (t){
  const K = t.K, {rulesAt, blNm, P, LL, F26, f26In, lbShare, lbStop, LINE_KINDS, VESSELS, EPOCH} = K;
  const S = K.newState(); K.set('S', S);
  const Hd = (y, m, d) => (Date.UTC(y, m - 1, d, 12) - EPOCH) / 36e5;
  const at = (p, H, len = 45.4, egn = true) => rulesAt({p, H, len, gear:'line', sp:'torsk', egn});
  const has = (r, k) => r.items.some(i => i.k === k && i.v === 'no' && i.block);

  // the areas' end lines: a point in the middle of each is inside, one well past either end is not
  const mid = f => ({lat:(f.l1[0][0] + f.l1[1][0] + f.l2[0][0] + f.l2[1][0]) / 4, lon:(f.l1[0][1] + f.l1[1][1] + f.l2[0][1] + f.l2[1][1]) / 4});
  for (const f of F26){ const m = mid(f); t.ok(f26In(f, m), `§ 26 ${f.no}: midt i feltet (${m.lat.toFixed(2)}° N ${m.lon.toFixed(2)}° Ø) er innenfor endelinjene`); }
  t.ok(!f26In(F26[0], {lat:70.6, lon:22.5}) && !f26In(F26[0], {lat:70.4, lon:19.2}), '§ 26 Finnmark/Troms: øst for 21° 30′ og vest for 20° Ø er utenfor');
  t.ok(!f26In(F26[2], {lat:69.6, lon:16.0}) && !f26In(F26[2], {lat:67.2, lon:11.5}), '§ 26 Nordland: nord for 69° 20′ og sør for 67° 30′ er utenfor');

  // walk out from the coast across the middle of each area and find a point 2 nm, 6 nm and 14 nm off the baseline
  const off = (f, want) => { const m = mid(f); let best = null; for (let k = -400; k <= 400; k++){ const ll = {lat:m.lat + (f === F26[2] ? 0 : 0.002 * k), lon:m.lon - (f === F26[2] ? 0.01 * k : 0.006 * k)}, p = P(ll.lat, ll.lon), nm = blNm(p);
    if (best === null || Math.abs(nm - want) < Math.abs(best.nm - want)) best = {p, nm, ll}; } return best; };
  const sep = Hd(2027, 9, 15), jun = Hd(2027, 6, 15), feb = Hd(2027, 2, 15);
  for (const [i, f] of F26.entries()){
    const a = off(f, 2), b = off(f, 6), c = off(f, 14);
    t.ok(Math.abs(a.nm - 2) < 1 && Math.abs(b.nm - 6) < 1 && Math.abs(c.nm - 14) < 1.5, `${f.no}: fant punkter ${a.nm.toFixed(1)}, ${b.nm.toFixed(1)} og ${c.nm.toFixed(1)} nm fra grunnlinja`);
    t.ok(has(at(a.p, jun), 'f26') && has(at(a.p, sep), 'f26'), `${f.no}: innenfor 4 nm er autoline forbudt hele året`);
    t.ok(has(at(b.p, sep), 'f26b'), `${f.no}: 6 nm i september er innenfor 10 nm-feltet (${f.when})`);
    t.ok(!has(at(b.p, jun), 'f26b') && !has(at(b.p, jun), 'f26'), `${f.no}: 6 nm i juni er lov`);
    if (i === 2) t.ok(has(at(b.p, feb), 'f26b'), 'Nordland: 6 nm i februar er innenfor perioden 1.9–30.4');
    else t.ok(!has(at(b.p, feb), 'f26b'), `${f.no}: 6 nm i februar er lov (perioden er 1.9–31.12)`);
    t.ok(!has(at(c.p, sep), 'f26') && !has(at(c.p, sep), 'f26b'), `${f.no}: 14 nm er lov`);
    t.ok(!has(at(a.p, sep, 45.4, false), 'f26') && !has(at(a.p, sep, 21, true), 'f26'), `${f.no}: § 26 gjelder ikke uten egnemaskin eller på 21,35 m og under`);
  }
  // not along Svalbard or Jan Mayen (the regulation: «langs norskekysten fra grensen mot Sverige til grensen mot Russland»)
  t.ok(!has(at(P(78.2, 15.0), sep), 'f26'), '§ 26 gjelder ikke ved Svalbard');

  // ling and tusk for 28 m and over: ling 35 % all year, tusk free until the stop (between 6 August and 11 September), then 15 %
  for (const y of [2027, 2028, 2030]){ const st = lbStop(y), d = new Date(EPOCH + st * 36e5);
    t.ok(st >= Hd(y, 8, 6) - 12 && st <= Hd(y, 9, 11) + 12, `brosmestoppen ${y}: ${d.getUTCDate()}.${d.getUTCMonth() + 1}. (mellom 6.8. og 11.9.)`);
    t.ok(lbShare('brosme', st - 24) === 1 && lbShare('brosme', st + 24) === 0.15 && lbShare('lange', Hd(y, 3, 1)) === 0.35, `${y}: brosme fritt før stoppen og 15 % etter, lange 35 % hele året`); }

  // the autoline aboard: an autoliner gets 8 lenker of 5,000 hooks (her autoHooks) on the magazines, always ready, and a marker set for each
  const B = K.BOAT, B0 = Object.assign({}, B); Object.assign(B, VESSELS.autoliner);
  const pg = S.pgear, L = K.autoL(pg);
  t.ok(L && L.n === 8 && L.baited === 8 && L.n * LINE_KINDS.auto.hooks === VESSELS.autoliner.autoHooks, `autolineren har ${L && L.n} lenker à ${LINE_KINDS.auto.hooks} krok = autoHooks`);
  t.ok(pg.kits.n === 8 && pg.kits.heavy === 8, 'en bøyestang med dregg for hver lenke');
  t.ok(K.hasHauler('line') && !VESSELS.autoliner.lock, 'autolinesystemet er haleren, og autolineren kan kjøpes');
  // the pace: a lenke set in under half an hour, hauled in about two hours (Mustad: 3 hooks a second out, the hauler about 2,500 an hour)
  const setMin = LINE_KINDS.auto.hooks * LINE_KINDS.auto.setH * 60, haulMin = LINE_KINDS.auto.hooks * LINE_KINDS.auto.haulH * 60;
  t.ok(setMin > 20 && setMin < 35 && haulMin > 100 && haulMin < 140, `en lenke settes på ${setMin.toFixed(0)} min og dras på ${haulMin.toFixed(0)} min`);
  t.near(K.lineKm('auto', LINE_KINDS.auto.hooks), 6.5, 0.01, 'en lenke er 6,5 km (1,3 m mellom krokene)');
  // 40,000 hooks a day fit the clock: setting and hauling the whole line takes under 20 hours
  t.ok(8 * (setMin + haulMin) / 60 < 20, `hele lina (8 lenker) settes og dras på ${(8 * (setMin + haulMin) / 60).toFixed(1)} timer`);
  // a coast boat has none
  for (const k in B) delete B[k]; Object.assign(B, B0, VESSELS.sjark); const S2 = K.newState(); K.set('S', S2);
  t.ok(K.autoL(S2.pgear) === null && !K.hasHauler('line'), 'en sjark har ingen autoline og ingen haler uten å kjøpe den');
}
