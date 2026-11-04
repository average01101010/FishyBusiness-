// H1b R4 (04.11.2026): the zones off the coast and their rules (core/03e-rules.js ruSea, ruSeaRules; src/data/rules.json sea and shelf,
// from tools/rules/regler.py seas()). A point in each zone; each border crossed on a line between two zones' points, with a point 2 km
// on each side; points along the coast that must stay under the coast's rules (not a neighbour's zone); and the answers in each zone:
// the species and permits the regulations allow, the licences, Svalbard's closed areas and the snow crab.
export default function (t){
  const {rulesAt, ruSea, ruShelf, zoneLic, zoneLicApply, P, newState, EPOCH, PORTS} = t.K;
  t.K.set('S', newState());
  const S = () => t.K.get('S');
  const at = (lat, lon) => P(lat, lon);
  const H = (y, m, d) => (Date.UTC(y, m - 1, d) - EPOCH) / 36e5, jan = H(2027, 1, 15), sep = H(2027, 9, 1), oct = H(2027, 10, 20);
  const rq = (p, o) => rulesAt({p, H:jan, len:o.len || 45, gear:o.gear === undefined ? 'juksa' : o.gear, sp:o.sp === undefined ? null : o.sp, hav:o.hav === undefined ? null : o.hav, ...(o.H ? {H:o.H} : {})});
  const has = (r, k, v) => r.items.some(i => i.k === k && (!v || i.v === v));
  const keys = r => r.items.map(i => i.k + ':' + i.v + (i.block ? '!' : '')).join(' ');

  // a point in each zone
  const Z = {no:[70.5, 15], sv:[76, 20], svt:[78.2, 15.0], jm:[71, -5], jmt:[70.93, -8.25], smh:[73.9, 36.8], smt:[66.4, -3.3], int:[73.5, 3],
    ru:[70.5, 40], is:[67.2, -18], gl:[70, -19], fo:[63, -6], gb:[59.5, -0.5], dk:[57.25, 8.8], se:[58.4, 10.9], xx:[61.5, 19.5]};
  for (const [c, [la, lo]] of Object.entries(Z)) t.eq(ruSea(at(la, lo)), c, 'sonen ved ' + la + ' N ' + lo + ' Ø er ' + c);

  // the coast stays the coast's: harbours and fjords along the whole coast, the border fjords with Sweden and Russia too
  const coast = [['Vadsø', 70.07, 29.75], ['Kirkenes', 69.73, 30.05], ['Bøkfjorden', 69.80, 30.10], ['Varangerfjorden', 70.0, 30.8], ['Vardø', 70.37, 31.2],
    ['Hvaler', 59.05, 10.95], ['Svinesund', 59.10, 11.24], ['Tromsø', 69.65, 18.95], ['Bodø', 67.28, 14.37], ['Bergen', 60.40, 5.30], ['Hammerfest', 70.66, 23.68], ['Båtsfjord', 70.63, 29.72]];
  for (const [n, la, lo] of coast){ const c = ruSea(at(la, lo)); t.ok(c === '' || c === 'no', n + ': kystens regler gjelder (' + (c || 'innenfor 12 nm') + ')'); }
  // the four yards named «Verft verft» at Strømstad lie in Sweden (an old fault in steder.json, BACKLOG 10.1): Swedish waters is right
  const off = PORTS.filter(q => !['', 'no', 'sv', 'svt'].includes(ruSea(q.p)) && !(/^Verft verft/.test(q.name) && ruSea(q.p) === 'se')).map(q => q.name + ' ' + ruSea(q.p));
  t.ok(PORTS.length > 300 && !off.length, 'alle ' + PORTS.length + ' havnene ligger under kystens regler (eller ved Svalbard)' + (off.length ? ': ' + off.join(', ') : ''));

  // each border: walk from one zone's point to the other's, find the change, and look 2 km to each side
  const cross = (a, b) => {
    const A = at(...Z[a]), B = at(...Z[b]), n = 4000; let last = ruSea(A), hit = null, kinds = new Set([last]);
    for (let i = 1; i <= n; i++){ const f = i / n, p = {x:A.x + (B.x - A.x) * f, y:A.y + (B.y - A.y) * f}, c = ruSea(p); kinds.add(c); if (c !== last && !hit && last === a) hit = {f, c}; last = c; }
    if (!hit){ t.ok(false, a + ' → ' + b + ': fant ingen grense'); return; }
    const L = Math.hypot(B.x - A.x, B.y - A.y), d = 2 / L, p0 = {x:A.x + (B.x - A.x) * (hit.f - d), y:A.y + (B.y - A.y) * (hit.f - d)}, p1 = {x:A.x + (B.x - A.x) * (hit.f + d), y:A.y + (B.y - A.y) * (hit.f + d)};
    t.ok(ruSea(p0) === a && ruSea(p1) === hit.c, a + ' | ' + hit.c + ': 2 km på hver side av grensa (' + ruSea(p0) + ', ' + ruSea(p1) + ')');
  };
  for (const [a, b] of [['no', 'sv'], ['no', 'ru'], ['no', 'smh'], ['smh', 'ru'], ['sv', 'smh'], ['sv', 'ru'], ['no', 'jm'], ['jm', 'is'], ['jm', 'gl'], ['no', 'smt'],
    ['smt', 'fo'], ['smt', 'is'], ['no', 'gb'], ['fo', 'gb'], ['no', 'dk'], ['no', 'int'], ['int', 'gl'], ['sv', 'gl'], ['sv', 'svt'], ['jm', 'jmt'], ['dk', 'se']]) cross(a, b);

  // the size of the Loophole: about 67 000 km² (beyond 200 nm of Norway's and Russia's baselines); counted on a 5 km grid
  let n = 0; for (let x = 1300; x < 1700; x += 5) for (let y = -700; y < 0; y += 5) if (ruSea({x, y}) === 'smh') n++;
  t.ok(n * 25 > 55000 && n * 25 < 80000, 'Smutthullet er ' + Math.round(n * 25 / 1000) + ' 000 km² (rundt 67 000)');

  // the rules: Svalbard (J-248-2025, J-247-2025, J-161-2026 § 2, høstingsforskriften § 58, the vulnerable ecosystems)
  const sv = at(...Z.sv);
  t.ok(has(rq(sv, {sp:'torsk'}), 'sv1', 'ok') && rq(sv, {sp:'torsk'}).v !== 'no', 'fiskevernsonen: torsk på kvoten er lov');
  t.ok(has(rq(sv, {sp:'hyse'}), 'sv1', 'ok'), 'fiskevernsonen: hyse på kvoten er lov');
  t.ok(has(rq(sv, {sp:'sei'}), 'sv2', 'no'), 'fiskevernsonen: sei er stengt (seikvoten gjelder i NØS)');
  t.ok(has(rq(sv, {sp:'lange'}), 'sv3', 'no'), 'fiskevernsonen: lange er stengt (ikke funnet i kilden)');
  t.ok(has(rq(sv, {}), 'sv0', 'warn') && rq(sv, {}).v === 'warn', 'fiskevernsonen uten art: advarsel med det som er lov');
  const bj = at(74.3, 18.6), bjOut = at(73.7, 18.6);
  t.ok(has(rq(bj, {sp:'torsk'}), 'sv58', 'no'), 'Bjørnøya 20 nm: alt fiske er forbudt (§ 58) ' + keys(rq(bj, {sp:'torsk'})));
  t.ok(!has(rq(bjOut, {sp:'torsk'}), 'sv58'), 'utenfor 20 nm-sonen ved Bjørnøya: ingen § 58 ' + keys(rq(bjOut, {sp:'torsk'})));
  t.ok(has(rq(at(77.0, 14.3), {sp:'torsk', gear:'juksa'}), 'sv58', 'no'), 'vestsiden av Spitsbergen innenfor 15 nm: § 58');

  // Jan Mayen: cod and haddock banned, the survey fishery for the conventional ocean vessels by line (J-61-2026)
  const jm = at(...Z.jm);
  t.ok(has(rq(jm, {sp:'torsk'}), 'jm0', 'no'), 'Jan Mayen: torsk er forbudt for en kystbåt');
  t.ok(has(rq(jm, {sp:'torsk', hav:'konv', gear:'line'}), 'jm1', 'warn') && rq(jm, {sp:'torsk', hav:'konv', gear:'line'}).v === 'warn', 'Jan Mayen: kartleggingsfisket med line for konvensjonelt hav');
  t.ok(has(rq(jm, {sp:'torsk', hav:'konv', gear:'garn'}), 'jm0', 'no'), 'Jan Mayen: ikke med garn');
  t.ok(has(rq(jm, {sp:'hyse', hav:'konv'}), 'jm0', 'no'), 'Jan Mayen: hyse er forbudt');
  t.ok(has(rq(jm, {sp:'sei'}), 'jm3', 'no'), 'Jan Mayen: sei er stengt');

  // international waters: cod and haddock on the quota north of 62° N, other species closed
  for (const c of ['smh', 'smt', 'int']){ const p = at(...Z[c]);
    t.ok(has(rq(p, {sp:'torsk'}), 'int1', 'warn') && rq(p, {sp:'torsk'}).v === 'warn', c + ': torsk på kvoten, med advarsel');
    t.ok(has(rq(p, {sp:'lange'}), 'int2', 'no'), c + ': lange er stengt'); }

  // the Russian zone: the licence (applied for in the Papirer app, given at once; an ocean permit brings it)
  const ru = at(...Z.ru);
  t.ok(!zoneLic('ru') && has(rq(ru, {sp:'torsk'}), 'ru0', 'no'), 'russisk sone uten lisens: stengt');
  S().lic = {id:'konv', hav:true}; t.ok(zoneLic('ru'), 'havtillatelsen gir lisensen for russisk sone'); S().lic = null;
  t.ok(zoneLicApply('ru') && zoneLic('ru'), 'lisensen søkes og gis med en gang');
  t.ok(has(rq(ru, {sp:'torsk'}), 'ru1', 'warn') && rq(ru, {sp:'torsk'}).v === 'warn', 'russisk sone med lisens: torsk på kvoten');
  t.ok(has(rq(ru, {sp:'sei'}), 'ru2', 'no'), 'russisk sone: sei er stengt');

  // Iceland closed; Greenland, the Faroes and the British zone by licence, permit, species, area and date
  t.ok(has(rq(at(...Z.is), {sp:'torsk'}), 'is0', 'no'), 'islandsk sone: stengt (ingen adgang funnet for 2026)');
  const gl = at(...Z.gl), fo = at(...Z.fo), gb4 = at(...Z.gb), gb6 = at(59.3, -6.0), gb2 = at(62.6, -1.2);
  t.ok(has(rq(gl, {sp:'torsk', hav:'konv'}), 'gl0', 'no'), 'grønlandsk sone uten lisens: stengt');
  for (const c of ['gl', 'fo', 'gb']) zoneLicApply(c);
  t.ok(has(rq(gl, {sp:'torsk', hav:'konv'}), 'gl1', 'warn'), 'grønlandsk sone: torsk for konvensjonelt hav (360 t)');
  t.ok(has(rq(gl, {sp:'torsk', hav:'tral'}), 'gl2', 'no'), 'grønlandsk sone: ikke torsk for tråler');
  t.ok(has(rq(gl, {sp:'uer', hav:'tral'}), 'gl1', 'warn'), 'grønlandsk sone: uer for tråler (650 t)');
  t.ok(has(rq(gl, {sp:'torsk'}), 'gl2', 'no'), 'grønlandsk sone: kystbåten har ingen kvote');
  t.ok(has(rq(fo, {sp:'brosme', hav:'konv'}), 'fo3', 'warn'), 'færøysk sone: brosme for konvensjonelt hav');
  t.ok(has(rq(fo, {sp:'lange', hav:'konv', H:sep}), 'fo2', 'no'), 'færøysk sone: lange stoppet fra 25. august');
  t.ok(has(rq(fo, {sp:'lange', hav:'konv'}), 'fo3', 'warn'), 'færøysk sone: lange før 25. august');
  t.ok(has(rq(fo, {sp:'torsk', hav:'konv'}), 'fo4', 'no'), 'færøysk sone: torsk bare bifangst');
  t.ok(has(rq(fo, {sp:'lange'}), 'fo1', 'no'), 'færøysk sone: kystbåten kan ikke');
  t.eq(ruSea(gb6), 'gb', 'punktet vest for 4° V er britisk sone'); t.eq(ruSea(gb2), 'gb', 'punktet nord for 62° N er britisk sone');
  t.ok(has(rq(gb4, {sp:'torsk', len:12}), 'gb4', 'warn'), 'britisk sone i Nordsjøen: torsk på vilkårene for Nordsjøen');
  t.ok(has(rq(gb6, {sp:'brosme', gear:'line'}), 'gb6', 'warn'), 'britisk sone vest for 4° V: brosme med line');
  t.ok(has(rq(gb6, {sp:'brosme', gear:'line', H:oct}), 'gb6x', 'no'), 'britisk sone vest for 4° V: brosme stoppet fra 8. oktober');
  t.ok(has(rq(gb6, {sp:'lange', gear:'garn'}), 'gb6x', 'no'), 'britisk sone vest for 4° V: ikke garn');
  t.ok(has(rq(gb2, {sp:'blakveite'}), 'gb2', 'warn') && has(rq(gb2, {sp:'blakveite', H:sep}), 'gb2x', 'no'), 'britisk sone i 2.a: blåkveite til 1. juli');
  t.ok(has(rq(at(...Z.dk), {sp:'torsk'}), 'dk0', 'no') && has(rq(at(...Z.xx), {sp:'torsk'}), 'xx0', 'no'), 'dansk sone og utenfor spillets farvann: stengt');

  // the snow crab (J-237-2025): the permit, outside 12 nm, on Norway's shelf, closed 1.7-30.11
  const sk = (p, o = {}) => rq(p, {sp:'snokrabbe', gear:'teiner', hav:'krab', ...o}), cb = at(76, 33);
  t.ok(ruShelf(cb) && has(sk(cb), 'sk4', 'ok') && sk(cb).v !== 'no', 'snøkrabbe på norsk sokkel i januar: lov ' + keys(sk(cb)));
  t.ok(has(sk(cb, {hav:null}), 'sk0', 'no'), 'snøkrabbe uten tillatelse: stengt');
  t.ok(has(sk(cb, {H:sep}), 'sk3', 'no'), 'snøkrabbe 1.7–30.11: stengt');
  t.ok(!ruShelf(ru) && has(sk(ru), 'sk2', 'no'), 'snøkrabbe på russisk sokkel: forbudt');
  t.ok(has(sk(at(...Z.svt)), 'sk1', 'no'), 'snøkrabbe i territorialfarvannet ved Svalbard: forbudt');
  t.ok(has(sk(at(70.3, 19.5)), 'sk1', 'no'), 'snøkrabbe innenfor 12 nm av fastlandet: forbudt');
  // the coast is as before: the open sea west of Senja has no zone rule
  t.eq(keys(rulesAt({p:{x:780, y:330}, H:jan, len:10, gear:'juksa', sp:'torsk'})), '', 'vest for Senja: ingen merknader, som før');
}
