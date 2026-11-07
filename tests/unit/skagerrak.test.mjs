// The cod rule in the Skagerrak (Ø10, 07.11.2026; core/03e-rules.js ruSkag and rulesAt, the area `skag` in src/data/rules.json from
// tools/rules/regler.py): forskrift 19. desember 2025 nr. 2805 om regulering av fisket etter torsk i Nordsjøen og Skagerrak i 2026 § 1 (no
// cod for Norwegian vessels in the Skagerrak outside the Norwegian baseline, west to the line Hanstholmen fyr – Lindesnes fyr), § 4 (vessels
// under 11 m with the owner on blad B: at most 3 tonnes with jig from 1 April to 30 June) and § 5 (5 % cod bycatch with other conventional
// gear). The points outside the baseline are found from the data (south from the plants until the baseline is passed), so a new
// rules.json moves them rather than breaking the test.
export default function (t){
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
  t.ok(keys(at(krs, {sp:null})).includes('skag:no!'), 'juksa uten art (alt fisket med juksa) stoppes, fordi torsken er med i fangsten');
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

  // § 5: other species with conventional gear, at most 5 % cod bycatch; not a stop
  const sei = at(krs, {sp:'sei'});
  t.ok(sei.v !== 'no' && keys(sei).includes('skag5:warn') && !keys(sei).includes('skag:no!'), 'sei med juksa utenfor grunnlinja ved Kristiansand: lov, med høyst 5 % torsk som bifangst');
  t.ok(!keys(at(krs, {sp:'krabbe', gear:'teiner'})).some(k => k.startsWith('skag')), 'teiner etter krabbe: ingen Skagerrak-regel');

  // only in Norway's waters: the Danish and Swedish zones are closed in the game anyway (dk0), with their own reason
  const dk = P(57.6, 9.6);
  t.eq(ruSea(dk), 'dk', 'punktet 57,6° N 9,6° Ø ligger i dansk sone');
  t.ok(!keys(rulesAt({p:dk, H:jun, len:10, gear:'juksa', sp:'torsk'})).some(k => k.startsWith('skag')), 'i dansk sone: dansk sones regel, ikke Skagerrak-regelen');

  // Bergen (south of 62° N, far west of the line): nothing from the Skagerrak
  const brg = out(60.39, 5.0) || P(60.39, 4.6);
  t.ok(!ruSkag(brg) && !keys(at(brg)).some(k => k.startsWith('skag')), 'utenfor Bergen: ingen Skagerrak-regel');
}
