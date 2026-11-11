// The cod rule in the Skagerrak (Ø10, 07.11.2026; core/03e-rules.js ruSkag and rulesAt, the area `skag` in src/data/rules.json from
// tools/rules/regler.py): forskrift 19. desember 2025 nr. 2805 om regulering av fisket etter torsk i Nordsjøen og Skagerrak i 2026 § 1 (no
// cod for Norwegian vessels in the Skagerrak outside the Norwegian baseline, west to the line Hanstholmen fyr – Lindesnes fyr), § 4 (vessels
// under 11 m with the owner on blad B: at most 3 tonnes with jig from 1 April to 30 June) and § 5 (5 % cod bycatch with other conventional
// gear). The points outside the baseline are found from the data (south from the plants until the baseline is passed), so a new
// rules.json moves them rather than breaking the test.
export default function (t){
  const brg0 = () => t.K.P(60.39, 4.6);
  const {rulesAt, ruBlockMsg, ruSea, insideBaseline, blNm, P, newState, EPOCH} = t.K;
  t.K.set('S', newState());
  const S = () => t.K.get('S');
  const jun = (Date.UTC(2026, 5, 1) - EPOCH) / 36e5, mar = (Date.UTC(2026, 2, 15) - EPOCH) / 36e5, jul = (Date.UTC(2026, 6, 1) - EPOCH) / 36e5;
  const apr1 = (Date.UTC(2026, 3, 1, 12) - EPOCH) / 36e5, jun30 = (Date.UTC(2026, 5, 30, 12) - EPOCH) / 36e5;
  const keys = r => r.items.map(i => i.k + ':' + i.v + (i.block ? '!' : ''));
  const blad = on => { S().fm = {...(S().fm || {}), b:on}; };
  const at = (p, o = {}) => rulesAt({p, H:o.H == null ? jun : o.H, len:o.len == null ? 10 : o.len, gear:o.gear === undefined ? 'juksa' : o.gear, sp:o.sp === undefined ? 'torsk' : o.sp, hand:true});
  t.ok(typeof t.K.ruSkag === 'function', 'regelmotoren har ruSkag (Skagerrak-flata fra rules.json)');
  const ruSkag = typeof t.K.ruSkag === 'function' ? t.K.ruSkag : () => false;
  // south from a plant until the first point outside the baseline that is 1–6 nm out (the sea where a small boat fishes)
  const out = (lat, lon) => { const a = P(lat, lon); for (let d = 0.2; d <= 40; d += 0.2){ const p = {x:a.x, y:a.y + d}; if (!insideBaseline(p) && blNm(p) > 1 && blNm(p) < 6) return p; } return null; };
  const krs = out(58.140, 7.996), are = out(58.462, 8.778), ege = out(58.438, 5.979);
  for (const [n, p] of [['Kristiansand', krs], ['Arendal', are], ['Egersund', ege]]) t.ok(!!p, 'fant et punkt 1–6 nm utenfor grunnlinja sør for ' + n + (p ? ' (' + p.x.toFixed(1) + ', ' + p.y.toFixed(1) + ', ' + blNm(p).toFixed(1) + ' nm)' : ''));
  if (!krs || !are || !ege) return;

  // the area: east of the line Lindesnes – Hanstholm outside the baseline, not west of it, not inside the baseline
  t.ok(ruSkag(krs) && ruSkag(are), 'utenfor grunnlinja ved Kristiansand og Arendal er Skagerrak');
  t.ok(!ruSkag(ege), 'utenfor grunnlinja ved Egersund (vest for Lindesnes) er ikke Skagerrak');
  const west = P(57.7, 7.3), east = P(57.7, 7.8);   // the line crosses 57.7° N at about 7.55° E
  t.ok(!ruSkag(west) && ruSkag(east), 'linja Lindesnes–Hanstholm: 57,7° N 7,3° Ø er Nordsjøen, 7,8° Ø er Skagerrak');
  const krsIn = P(58.140, 7.996);
  t.ok(insideBaseline(krsIn), 'mottaket i Kristiansand ligger innenfor grunnlinja');

  // § 1: closed to cod for every boat outside the exception, with the reason and the exception in the text, and it stops the fishing
  blad(false);
  const r = at(krs);
  t.eq(r.v, 'no', 'torsk med juksa utenfor grunnlinja ved Kristiansand, 10 m uten blad B: forbudt');
  const it = r.items.find(i => i.k === 'skag');
  t.ok(!!it && it.block, '… ved Skagerrak-regelen (skag), og den stopper fisket');
  t.ok(!!it && /Skagerrak/.test(it.no) && /Skagerrak/.test(it.en) && /11 m/.test(it.no) && /blad B/.test(it.no) && /3 tonn/.test(it.no) && /1\. april/.test(it.no), '… med grunnen og unntaket i teksten (juksa, under 11 m, blad B, 1. april–30. juni, 3 tonn)');
  t.ok(!!it && /2805/.test(it.ref) && /§ 1/.test(it.ref) && !!it.url, '… med forskriften, paragrafen og lenka');
  t.ok(/Skagerrak/.test(ruBlockMsg({p:krs, H:jun, len:10, gear:'juksa', sp:'torsk', hand:true}) || ''), 'ruBlockMsg gir Skagerrak-grunnen');
  t.eq(at(are).v, 'no', 'Arendal utenfor grunnlinja: forbudt på samme måte');
  // Ø10b (Jonas on valg 12, 08.11.2026): without a species the boat fishes, and the cod is a bycatch (§ 5), not a stop
  for (const g of ['juksa', 'line', 'garn']){ const k = keys(at(krs, {sp:null, gear:g}));
    t.ok(!k.includes('skag:no!') && k.includes('skag5:warn') && at(krs, {sp:null, gear:g}).v === 'warn', g + ' uten art stoppes ikke lenger: gult med bifangstgrensen på 5 % (skag5)'); }
  t.ok(!ruBlockMsg({p:krs, H:jun, len:10, gear:'juksa', sp:null, hand:true}) && !ruBlockMsg({p:are, H:jun, len:10, gear:'garn', sp:null}), 'ruBlockMsg uten art er tom ved Kristiansand og Arendal (ruta, «Kast loss» og Autonav stopper ikke)');
  t.ok(/inndratt/.test((at(krs, {sp:null}).items.find(i => i.k === 'skag5') || {}).no || '') && /§ 5/.test((at(krs, {sp:null}).items.find(i => i.k === 'skag5') || {}).ref || ''), '… og teksten sier at det som er over, blir inndratt, med § 5');
  t.ok(keys(at(krs, {gear:'garn'})).includes('skag:no!') && keys(at(krs, {gear:'line'})).includes('skag:no!'), 'garn og line etter torsk stoppes');
  t.ok(!keys(at(krsIn)).some(k => k.startsWith('skag')), 'innenfor grunnlinja ved Kristiansand: ingen Skagerrak-regel');
  t.ok(!keys(at(ege)).some(k => k.startsWith('skag')), 'utenfor grunnlinja ved Egersund: ingen Skagerrak-regel');

  // § 4: the exception, at most 3 tonnes with jig for vessels under 11 m with the owner on blad B, 1 April – 30 June
  blad(true);
  const ex = at(krs);
  t.ok(ex.v !== 'no' && keys(ex).includes('skag4:warn'), '10 m på blad B med juksa 1. juni: unntaket (advarsel, ikke stopp)');
  t.ok(/3 tonn/.test((ex.items.find(i => i.k === 'skag4') || {}).no || '') && /52 tonn/.test((ex.items.find(i => i.k === 'skag4') || {}).no || ''), '… med 3 tonn og den norske kvoten på 52 tonn i teksten');
  t.ok(!ruBlockMsg({p:krs, H:jun, len:10, gear:'juksa', sp:'torsk', hand:true}), '… og ruBlockMsg er tom');
  t.ok(keys(at(krs, {sp:null})).includes('skag4:warn') && !keys(at(krs, {sp:null})).includes('skag:no!'), 'juksa uten art under unntaket: lov, med advarselen');
  t.ok(keys(at(krs, {H:apr1})).includes('skag4:warn') && keys(at(krs, {H:jun30})).includes('skag4:warn'), 'unntaket gjelder fra og med 1. april til og med 30. juni');
  t.ok(keys(at(krs, {H:mar})).includes('skag:no!') && keys(at(krs, {H:jul})).includes('skag:no!'), 'i mars og 1. juli: forbudt');
  t.ok(keys(at(krs, {len:11})).includes('skag:no!') && keys(at(krs, {len:10.99})).includes('skag4:warn'), 'under 11 m: 10,99 m har unntaket, 11 m ikke');
  t.ok(keys(at(krs, {gear:'line'})).includes('skag:no!') && keys(at(krs, {gear:'garn'})).includes('skag:no!'), 'unntaket gjelder bare juksa: line og garn er forbudt');
  blad(false);
  t.ok(keys(at(krs)).includes('skag:no!'), 'uten blad B: forbudt');
  // the rule layer keeps its blocks by blad B too: the exception turns the red outside the baseline yellow the day she is put on it
  { const t0 = S().t, bx = Math.floor(krs.x / 10), by = Math.floor(krs.y / 10), land0 = t.K.isLandFar; S().t = Math.round(jun * 60); blad(false);
    t.K.set('isLandFar', p => insideBaseline(p));   // no map in the unit tests: the sea outside the baseline is what is asked about
    const red = () => { try { return t.K.ruLayerBlock(bx, by, {len:10, gear:'juksa', sp:null, hand:true}).reduce((n, x) => n + (x === 2 ? 1 : 0), 0); } catch (e){ return 'feil: ' + e.message; } };
    const r0 = red(); blad(true); const r1 = red(); S().t = t0; blad(false); t.K.set('isLandFar', land0);
    t.ok(typeof r0 === 'number' && r0 === 0 && r1 === 0, 'regellaget 1. juni ved Kristiansand: ikke rødt utenfor grunnlinja, verken uten eller med blad B (' + r0 + ' og ' + r1 + ' røde ruter av 1600)');
    blad(false); S().t = Math.round(jun * 60); t.K.set('isLandFar', p => insideBaseline(p)); let yel = 'feil'; try { yel = t.K.ruLayerBlock(bx, by, {len:10, gear:'juksa', sp:null, hand:true}).reduce((n, x) => n + (x === 1 ? 1 : 0), 0); } catch (e){} S().t = t0; t.K.set('isLandFar', land0);
    t.ok(yel > 100, '… men gult (bifangst): ' + yel + ' gule ruter'); }

  // § 5: other species with conventional gear, at most 5 % cod bycatch; not a stop
  const sei = at(krs, {sp:'sei'});
  t.ok(sei.v !== 'no' && keys(sei).includes('skag5:warn') && !keys(sei).includes('skag:no!'), 'sei med juksa utenfor grunnlinja ved Kristiansand: lov, med høyst 5 % torsk som bifangst');
  t.ok(!keys(at(krs, {sp:'krabbe', gear:'teiner'})).some(k => k.startsWith('skag')), 'teiner etter krabbe: ingen Skagerrak-regel');
  t.ok(!keys(at(krs, {sp:null, gear:'teiner'})).some(k => k.startsWith('skag')), 'teiner uten art (Kystvakta med tom last): ingen Skagerrak-regel');
  t.ok(!keys(at(krs, {sp:'krabbe', gear:null})).some(k => k.startsWith('skag')), 'krabbe uten redskap: ingen bifangstgrense for torsk');

  // Ø10b: where the catch counts as bycatch (ruByc), the count in the hold (bycAdd), and what the landing takes (bycConf, bycOver)
  { const {ruByc, bycAdd, bycConf, bycOver, RU_BYC} = t.K, q = (p, o = {}) => ruByc({p, H:o.H == null ? jun : o.H, len:o.len == null ? 10 : o.len, gear:o.gear || 'juksa'});
    t.ok(typeof ruByc === 'function' && typeof bycAdd === 'function' && typeof bycConf === 'function', 'ruByc, bycAdd og bycConf finnes');
    if (typeof ruByc === 'function' && typeof bycAdd === 'function'){
      blad(false);
      t.ok(q(krs) === 'skag' && q(are) === 'skag' && q(krs, {gear:'line'}) === 'skag' && q(krs, {gear:'garn'}) === 'skag', 'bifangstsonen: juksa, line og garn utenfor grunnlinja ved Kristiansand og Arendal');
      t.ok(!q(krsIn) && !q(ege) && !q(krs, {gear:'teiner'}) && !q(brg0()), 'ikke innenfor grunnlinja, ikke ved Egersund, ikke teiner, ikke ved Bergen');
      blad(true); t.ok(!q(krs) && q(krs, {gear:'line'}) === 'skag' && q(krs, {H:jul}) === 'skag' && q(krs, {len:11}) === 'skag', 'unntaket (§ 4, juksa under 11 m på blad B i juni): torsken er lovlig og telles ikke; line, juli og 11 m telles'); blad(false);
      t.eq(RU_BYC.skag.share, 0.05, 'andelen er 5 %');
      t.ok(Math.abs(bycOver('skag', {kg:1000, cod:200}) - 150) < 1e-9 && bycOver('skag', {kg:1000, cod:50}) === 0 && bycOver('skag', {kg:1000, cod:49}) === 0, '200 kg torsk av 1000: 150 over; 50 og 49 av 1000: ingenting');
      // the hold: 300 kg taken inside the baseline (60 cod), then 400 outside (100 cod)
      const b = S().boat, t0 = S().t, pos0 = {...b.pos}; S().t = Math.round(jun * 60); S().hold = []; delete b.byc;
      const put = (sp, kg) => { bycAdd(sp, kg, 'juksa'); S().hold.push({sp, kg, cls:0}); };
      b.pos = {x:krsIn.x, y:krsIn.y}; S().t += 20; put('torsk', 60); put('sei', 240);
      t.ok(!b.byc && bycConf().kg === 0, 'fangst innenfor grunnlinja telles ikke, og ingenting inndras');
      b.pos = {x:krs.x, y:krs.y}; S().t += 20; put('torsk', 100); put('sei', 300);
      t.ok(b.byc && b.byc.skag && Math.abs(b.byc.skag.kg - 400) < 1e-9 && Math.abs(b.byc.skag.cod - 100) < 1e-9, 'utenfor: 400 kg telt i Skagerrak, 100 av dem torsk');
      t.ok(Math.abs(bycConf().kg - 80) < 1e-9 && Math.abs(bycConf().by.skag - 80) < 1e-9, 'inndragningen: 100 − 5 % av 400 = 80 kg torsk (torsken innenfor grunnlinja røres ikke)');
      bycAdd('krabbe', 50, 'teine'); t.ok(Math.abs(b.byc.skag.kg - 400) < 1e-9, 'krabbe fra teiner teller ikke i fangsten');
      S().hold = S().hold.filter(x => x.sp !== 'torsk').concat([{sp:'torsk', kg:30, cls:0}]); t.ok(Math.abs(bycConf().kg - 30) < 1e-9, 'aldri mer enn torsken som er om bord');
      S().hold = []; S().t += 20; b.pos = {x:krsIn.x, y:krsIn.y}; put('sei', 10); t.ok(!b.byc, 'tom last (etter levering) begynner tellingen på nytt');
      S().hold = []; delete b.byc; S().t = t0; b.pos = pos0; } }

  // only in Norway's waters: the Danish and Swedish zones are closed in the game anyway (dk0), with their own reason
  const dk = P(57.6, 9.6);
  t.eq(ruSea(dk), 'dk', 'punktet 57,6° N 9,6° Ø ligger i dansk sone');
  t.ok(!keys(rulesAt({p:dk, H:jun, len:10, gear:'juksa', sp:'torsk'})).some(k => k.startsWith('skag')), 'i dansk sone: dansk sones regel, ikke Skagerrak-regelen');

  // Bergen (south of 62° N, far west of the line): nothing from the Skagerrak
  const brg = out(60.39, 5.0) || P(60.39, 4.6);
  t.ok(!ruSkag(brg) && !keys(at(brg)).some(k => k.startsWith('skag')), 'utenfor Bergen: ingen Skagerrak-regel');
}
