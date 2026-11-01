// The rule engine (core/03e-rules.js, src/data/rules.json): the fjord lines (§ 31), the baseline rules for 21–27,99 m and 28 m and over
// (J-161-2026 § 32), nets and hooks inside the fjord lines (§ 33, § 33a), halibut (§ 39) and the minimum sizes (§ 47), at points around
// Senja where the chart data is known. The points inside the baseline are found from the data itself, so a new rules.json moves them
// rather than breaking the test.
export default function (t){
  const {rulesAt, ruBlockMsg, ruMinSize, insideFjord, insideBaseline, blNm, PORTS, newState, EPOCH} = t.K;
  t.K.set('S', newState());
  const H = t.K.get('S').t / 60;
  const at = (p, len, gear = 'juksa', sp = 'torsk') => rulesAt({p, H, len, gear, sp});
  const keys = r => r.items.map(i => i.k + ':' + i.v + (i.block ? '!' : ''));
  const finnsnes = PORTS.find(p => p.id === 'finnsnes').p;

  // the fjord lines (§ 31): no vessel of 15 m and over inside them
  t.ok(insideFjord(finnsnes) && insideBaseline(finnsnes), 'Finnsnes ligger innenfor fjordlinjene og grunnlinja');
  const r16 = at(finnsnes, 16);
  t.eq(r16.v, 'no', '16 m innenfor fjordlinjene er forbudt');
  t.ok(r16.items.some(i => i.k === 'f31' && i.v === 'no' && i.block), '… ved § 31, og den stopper fisket (block)');
  t.ok(!!ruBlockMsg({p:finnsnes, H, len:16, gear:'juksa', sp:'torsk'}), 'ruBlockMsg gir melding for 16 m i fjorden');
  t.eq(at(finnsnes, 14.99).v, 'ok', '14,99 m innenfor fjordlinjene er lov');
  t.eq(at(finnsnes, 10).v, 'ok', '10 m med juksa i fjorden: ingen merknad');
  t.ok(!ruBlockMsg({p:finnsnes, H, len:10, gear:'juksa', sp:'torsk'}), 'ruBlockMsg er tom for 10 m i fjorden');
  // nets and lines inside the fjord lines warn about the gear limits (§ 33, § 33a), they do not stop the fishing
  const garn = at(finnsnes, 10, 'garn');
  t.ok(garn.v === 'warn' && garn.items.some(i => i.k === 'f33a' && !i.block), 'garn i fjorden: advarsel etter § 33a, ikke stopp');
  t.ok(garn.items.every(i => i.ref && i.no && i.en), 'hver merknad har kilde og tekst på norsk og engelsk');
  // halibut is closed (§ 39) and marked, the season itself is enforced by the simulation
  t.ok(at(finnsnes, 10, 'juksa', 'kveite').items.some(i => i.k === 'kv39' && i.v === 'no'), 'kveite i fjorden merkes med § 39');

  // the open sea west of Senja: outside the baseline and the fjord lines, nothing applies to any length
  const sea = {x:780, y:330};
  t.ok(!insideFjord(sea) && !insideBaseline(sea) && blNm(sea) > 10, 'punktet vest for Senja er åpent hav, over 10 nm utenfor grunnlinja');
  for (const len of [10, 16, 25, 30]) t.eq(keys(at(sea, len)), [], len + ' m på åpent hav: ingen merknader');

  // inside the baseline but outside the fjord lines (§ 32): 21–27,99 m is out, 28 m and over is out
  let inner = null;
  for (let y = 280; y <= 300 && !inner; y += 0.5) for (let x = 860; x <= 880; x += 0.5){ const p = {x, y}; if (insideBaseline(p) && !insideFjord(p)){ inner = p; break; } }
  t.ok(!!inner, 'fant et punkt innenfor grunnlinja utenfor fjordlinjene' + (inner ? ' (' + inner.x + ', ' + inner.y + ')' : ''));
  if (inner){
    t.eq(at(inner, 16).v, 'ok', '16 m innenfor grunnlinja, utenfor fjordlinjene: lov');
    t.ok(keys(at(inner, 25)).includes('j32b:no!'), '25 m innenfor grunnlinja: § 32 stopper');
    t.ok(keys(at(inner, 30)).includes('j32c:no!'), '30 m innenfor grunnlinja: § 32 stopper');
    t.eq(at(inner, 20.99).v, 'ok', '20,99 m innenfor grunnlinja: lov');
  }
  // the 4-nm belt outside the baseline (§ 32 third paragraph): 28 m and over is out, 21–27,99 m is in. Senja is in statistical area
  // 05, where § 32 lets the big boats fish outside the baseline from 1 January to 30 June (the game starts 1 March), so the belt is
  // checked in September and the exception in March
  const sep = (Date.UTC(2027, 8, 1) - EPOCH) / 36e5, mar = (Date.UTC(2027, 2, 15) - EPOCH) / 36e5;
  let belt = null;
  for (let d = 0.5; d <= 20 && !belt; d += 0.5){ const p = {x:850 + (870 - 850) * (1 - d / 20), y:300 + (290 - 300) * (1 - d / 20)}; const nm = blNm(p); if (!insideBaseline(p) && nm > 0.3 && nm < 3.7) belt = p; }
  t.ok(!!belt, 'fant et punkt 0,3–3,7 nm utenfor grunnlinja' + (belt ? ' (' + belt.x.toFixed(1) + ', ' + belt.y.toFixed(1) + ', ' + blNm(belt).toFixed(2) + ' nm)' : ''));
  if (belt){
    t.ok(keys(rulesAt({p:belt, H:sep, len:30, gear:'juksa', sp:'torsk'})).includes('j32c:no!'), '30 m innenfor 4 nm i september: § 32 stopper');
    t.eq(rulesAt({p:belt, H:sep, len:25, gear:'juksa', sp:'torsk'}).v, 'ok', '25 m innenfor 4 nm, utenfor grunnlinja: lov');
    t.eq(rulesAt({p:belt, H:mar, len:30, gear:'juksa', sp:'torsk'}).v, 'ok', '30 m innenfor 4 nm i mars: unntaket for område 05 januar–juni');
  }
  const far = {x:850, y:300};
  t.ok(blNm(far) > 4 && blNm(far) < 6, 'kontrollpunktet 4–6 nm utenfor grunnlinja');
  t.eq(rulesAt({p:far, H:sep, len:30, gear:'juksa', sp:'torsk'}).v, 'ok', '30 m utenfor 4 nm i september: lov');

  // minimum sizes (§ 47) north of 62° N: positive, haddock 40 cm, halibut the largest
  const ms = sp => ruMinSize(sp, finnsnes);
  t.eq(ms('hyse'), 40, 'minstemål hyse nord for 62° N er 40 cm');
  t.ok(ms('torsk') > ms('hyse') && ms('kveite') > ms('torsk'), 'minstemål: kveite > torsk > hyse');
  t.ok(ms('torsk') > 0 && ms('sei') > 0, 'minstemål for torsk og sei finnes');
}
