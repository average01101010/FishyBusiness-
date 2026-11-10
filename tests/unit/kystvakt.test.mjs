// The coast guard (core/09j-kystvakt.js; docs/planer/oppdrag-2.md V1, 30.10.2026): the limits she asks about are the regulation's, and the
// sums of gear she counts inside the fjord lines are counted right. The visit itself (the roll, the ship, the word) is kystvakttest.py's.
// The check at sea aboard an ocean vessel (H2e, 06.11.2026): the minimum sizes of høstingsforskriften § 47 and the admixture of § 49 (read
// on Lovdata 06.11.2026), the position along the whole line against § 26, the vessel quota and the bycatch of J-187-2026 § 14 and J-128-2026.
export default function (t){
  const {KV, kvSums, newState} = t.K;
  t.K.set('S', newState());
  t.eq(KV.nets, 80, '§ 33a: høyst 80 garn i torskefisket innenfor fjordlinjene'); t.eq(KV.hooks, 5000, '§ 33: høyst 5 000 kroker per døgn innenfor fjordlinjene');
  t.eq(KV.gale, 13.9, 'kuling (13,9 m/s) stopper kontrollen'); t.ok(KV.pAfterOk < KV.p && KV.okFor === 14 * 1440, 'en ren kontroll halverer sjansen i to uker');
  t.ok(KV.minLand >= 3, 'aldri før tredje levering (Første uke er spillerens egen)');
  const sets = [{kind:'garn', n:50, in:true}, {kind:'garn', n:40, in:true}, {kind:'garn', n:30, in:false}, {kind:'line', hooks:3000, in:true}, {kind:'line', hooks:2400, in:true}, {kind:'line', hooks:9000, in:false}, {kind:'teine', n:20, in:true}];
  const s = kvSums(sets, x => x.in);
  t.eq(s.nets, 90, 'garna innenfor linjene telles (50 + 40), de utenfor ikke'); t.eq(s.hooks, 5400, 'krokene innenfor linjene telles (3 000 + 2 400), de utenfor ikke');
  t.eq(kvSums([], () => true).nets + kvSums(null, () => true).hooks, 0, 'ingen redskap gir null');
  hav(t);
}

function hav(t){
  const K = t.K, {KV47, kvCmKg, kvMinCm, kvMix, kvSampleFish, kvCheck, kvWhat, kvAlong, blNm, P, LL, F26, VESSELS, EPOCH, HAVBY, lbStop, quotaState, havQ} = K;
  const S = K.newState(); K.set('S', S);
  const B = K.BOAT, B0 = Object.assign({}, B); Object.assign(B, VESSELS.autoliner);
  const Hd = (y, m, d) => (Date.UTC(y, m - 1, d, 12) - EPOCH) / 36e5;

  // § 47: the minimum sizes north and south of 62° N, cod 55 cm within 4 nm north of 62° N; ling and tusk have none (KV47 is MIN47 in
  // 02-species-gear.js from steg 59, 10.11.2026; tests/unit/minstemal.test.mjs has the whole table)
  t.ok(KV47.torsk.n === 44 && KV47.torsk.s === 40 && KV47.torsk.n4 === 55 && KV47.hyse.n === 40 && KV47.hyse.s === 32 && KV47.sei.n === 45 && KV47.sei.s === 40 && KV47.blakveite.n === 45, '§ 47: torsk 44/40 (55 innenfor 4 nm), hyse 40/32, sei 45/40, blåkveite 45 cm');
  t.ok(!KV47.lange && !KV47.brosme, '§ 47: lange og brosme har ikke minstemål');
  t.near(kvCmKg('torsk', 44), 0.84, 0.02, 'en torsk på 44 cm veier om lag 0,84 kg (modellens kurve, som netLen)');
  t.near(kvCmKg('blakveite', 45), 0.94, 0.03, 'en blåkveite på 45 cm veier om lag 0,94 kg (modellens kurve for blåkveite)');
  // walk from the coast out across the middle of the Finnmark/Troms area of § 26 and find points 2, 6 and 20 nm off the baseline
  const mid = f => ({lat:(f.l1[0][0] + f.l1[1][0] + f.l2[0][0] + f.l2[1][0]) / 4, lon:(f.l1[0][1] + f.l1[1][1] + f.l2[0][1] + f.l2[1][1]) / 4});
  const off = want => { const m = mid(F26[0]); let best = null; for (let k = -500; k <= 500; k++){ const p = P(m.lat + 0.002 * k, m.lon - 0.006 * k), nm = blNm(p); if (best === null || Math.abs(nm - want) < Math.abs(best.nm - want)) best = {p, nm}; } return best; };
  const p2 = off(2), p5 = off(5.5), p20 = off(20), p3 = off(3);
  t.ok(Math.abs(p2.nm - 2) < 1 && Math.abs(p20.nm - 20) < 2, `fant punkter ${p2.nm.toFixed(1)} og ${p20.nm.toFixed(1)} nm fra grunnlinja utenfor Troms`);
  t.eq(kvMinCm('torsk', p2.p), 55, '§ 47: torsk innenfor 4 nm nord for 62° N er 55 cm'); t.eq(kvMinCm('torsk', p20.p), 44, 'og 44 cm utenfor');
  t.eq(kvMinCm('sei', P(59.5, 4.0)), 40, '§ 47: sei sør for 62° N er 40 cm'); t.eq(kvMinCm('hyse', P(59.5, 4.0)), 32, 'hyse sør for 62° N er 32 cm');

  // § 49: 15 % of cod, haddock and saithe together in number north of 62° N; 10 % of each species south of it; too few fish says nothing
  const n62 = p20.p, s62 = P(59.5, 3.5);
  const m1 = kvMix({torsk:[80, 10], hyse:[30, 6], sei:[10, 0]}, n62, 'line', 'torsk');
  t.ok(m1 && m1.sp === 'thsei' && m1.n === 120 && m1.u === 16 && Math.abs(m1.pct - 16 / 120) < 1e-9 && m1.lim === 0.15, '§ 49 fjerde ledd: 16 av 120 (13 %) torsk, hyse og sei regnes sammen mot 15 %');
  const m2 = kvMix({torsk:[80, 20], hyse:[30, 2]}, n62, 'line', 'torsk'); t.ok(m2.pct > m2.lim, '22 av 110 (20 %) er over 15 %');
  const m3 = kvMix({torsk:[80, 9], hyse:[30, 4]}, s62, 'line', 'torsk'); t.ok(m3.lim === 0.10 && m3.sp === 'hyse' && m3.pct > m3.lim, '§ 49 første ledd sør for 62° N: 10 % av hver art; hysa (4 av 30) er over, torsken (9 av 80) ikke');
  t.ok(kvMix({torsk:[10, 5]}, n62, 'line', 'torsk').few && kvMix({}, n62, 'line', 'torsk') === null, 'under 20 fisk er for få til en stikkprøve');
  // the sample as the fish come up: every fish counted, the minimum for the place worked out once
  const g = {}; for (const w of [0.6, 0.9, 1.5, 3.0]) kvSampleFish(g, 'torsk', w, p20.p); kvSampleFish(g, 'hyse', 0.55, p20.p);
  t.ok(g.ms.torsk[0] === 4 && g.ms.torsk[1] === 1 && g.ms.hyse[1] === 1, 'stikkprøven teller torsken (én av fire under 44 cm) og hysa (0,55 kg er under 40 cm)');

  // the check aboard: an autoliner with the ocean permit on the field 20 nm off Troms in June
  const H = Hd(2027, 6, 15); S.t = Math.round(H * 60); S.cur = S.cur || 'v1';
  S.lic = {id:'konv', hav:true, kf:1, hl:'Konvensjonell havfisketillatelse'};
  const b = S.boat; b.status = 'fishing'; b.pos = {...p20.p}; b.heading = 0; b.gop = null;
  const lenke = (a, c) => ({id:'s' + Math.random(), kind:'line', lk:'auto', n:1, hooks:5000, vid:S.cur, a:{...a}, b:{...c}, tSet:S.t - 300, depth:250, acc:{}, warn:0});
  // a 6.5 km lenke straight out: one end 2 nm off, the middle about 5.5 nm. Under § 26 that end is inside 4 nm; the middle alone says no
  let A0 = null, e = null, midNm = 0;
  for (const w of [3.6, 3.4, 3.2, 3.0, 2.8, 2.5]){ const a = off(w), dir = {x:p20.p.x - a.p.x, y:p20.p.y - a.p.y}, dl = Math.hypot(dir.x, dir.y), c = {x:a.p.x + dir.x / dl * 6.5, y:a.p.y + dir.y / dl * 6.5}, mn = blNm({x:(a.p.x + c.x) / 2, y:(a.p.y + c.y) / 2});
    if (a.nm < 4 && mn > 4.2){ A0 = a; e = c; midNm = mn; break; } }
  t.ok(A0, `fant en lenke med den ene enden innenfor 4 nm og midten utenfor (${A0 && A0.nm.toFixed(1)} og ${midNm.toFixed(1)} nm)`);
  if (!A0){ A0 = p2; e = {x:p2.p.x, y:p2.p.y + 6.5}; }
  S.sets = [lenke(A0.p, e)]; S.hold = [];
  const r1 = kvCheck(b), f26 = r1.items.find(i => i.k === 'f26');
  t.ok(f26 && /nm fra grunnlinja/.test(f26.no) && /§ 26/.test(f26.ref), `den lenka er en merknad etter § 26 med posisjonen, selv om midten (som kystsjekken ser på) er ${midNm.toFixed(1)} nm ute`);
  t.ok(r1.hav && r1.hav.pts >= 8 && kvAlong(A0.p, e).length === r1.hav.pts, `posisjonen sjekkes på ${r1.hav && r1.hav.pts} punkter langs lenka`);
  // a lenke 20 nm off is clean, with the marking counted: two pole buoys and three buoys between (6.5 km is 3.5 nm, a buoy every nautical mile)
  const far = {x:p20.p.x + 6.5, y:p20.p.y}; S.sets = [lenke(p20.p, far)];
  const r2 = kvCheck(b);
  t.ok(!r2.items.length && r2.hav.ends === 2 && r2.hav.mid === 3, `20 nm ute er lenka i orden, med ${r2.hav.ends} bøyestenger og ${r2.hav.mid} vak mellom (§ 68)`);
  t.ok(/§ 26 og § 32/.test(kvWhat(r2)[0]) && /merkingen/.test(kvWhat(r2)[0]) && /fartøykvoten/.test(kvWhat(r2)[0]), 'hun sier hva hun så på: posisjonen, merkingen og fangsten mot fartøykvoten');

  // the bycatch in what is aboard: ling 40 % (35 % is allowed), tusk 20 % before the stop (free) and after it (15 %), saithe 30 % (25 %)
  const hold = (o) => Object.entries(o).map(([sp, kg]) => ({sp, cls:0, kg, n:Math.round(kg / 3), frozen:true}));
  S.hold = hold({torsk:5000, lange:4000, brosme:1000}); let r = kvCheck(b);
  t.ok(r.items.some(i => i.k === 'lby' && /40 %/.test(i.no)) && !r.items.some(i => i.k === 'bby'), 'lange 40 % om bord er en merknad (35 %), brosme 10 % før stoppen ikke');
  const st = lbStop(2027); S.t = Math.round((st + 48) * 60); S.sets = [lenke(p20.p, far)]; S.hold = hold({torsk:6000, hyse:2000, brosme:2000}); r = kvCheck(b);
  t.ok(r.items.some(i => i.k === 'bby' && /20 %/.test(i.no)), 'brosme 20 % etter brosmestoppen er en merknad (15 %)');
  S.t = Math.round(H * 60); S.sets = [lenke(p20.p, far)]; S.hold = hold({torsk:7000, sei:3000}); r = kvCheck(b);
  t.ok(HAVBY.sei === 0.25 && r.items.some(i => i.k === 'seiby' && /30 %/.test(i.no) && /J-187-2026 § 14/.test(i.ref)), 'sei 30 % uten garnseitillatelse er en merknad etter § 14 (25 %)');
  // the last catch: 45 % ling in one haul is a remark even when the hold as a whole is within (in each catch)
  S.hold = hold({torsk:20000, lange:2000}); S.kvHaul = [{t:S.t - 60, vid:S.cur, x:far.x, y:far.y, kind:'line', lk:'auto', ms:{torsk:[60, 2]}, kg:{torsk:550, lange:450}}]; r = kvCheck(b);
  t.ok(r.items.some(i => i.k === 'lby' && /siste fangst/.test(i.no) && /45 %/.test(i.no)), 'lange 45 % i siste fangst er en merknad, selv om lasten har 9 %');
  // the sample of the last catch: 12 of 60 cod under 44 cm (20 %) is over § 49's 15 %; 6 of 60 is within
  S.hold = hold({torsk:9000}); S.kvHaul = [{t:S.t - 60, vid:S.cur, x:far.x, y:far.y, kind:'line', lk:'auto', ms:{torsk:[60, 12]}, kg:{torsk:900}}]; r = kvCheck(b);
  const f49 = r.items.find(i => i.k === 'f49');
  t.ok(f49 && /12 av 60/.test(f49.no) && /44/.test(f49.no) && /§ 50/.test(f49.no) && /§§ 47 og 49 fjerde ledd/.test(f49.ref), 'stikkprøven: 12 av 60 under minstemålet er over 15 % (§§ 47 og 49), med skift felt og § 50');
  S.kvHaul[0].ms = {torsk:[60, 6]}; r = kvCheck(b); t.ok(!r.items.some(i => i.k === 'f49') && Math.abs(r.hav.sample.pct - 0.1) < 1e-9, '6 av 60 (10 %) er innenfor');
  t.ok(/stikkprøve av siste fangst \(60 fisk målt, 10 %/.test(kvWhat(r)[0]), 'og stikkprøven står i det hun så på');
  // the vessel quota: haddock aboard beyond what is left of it (no bycatch beyond the vessel quota, § 14 third paragraph)
  const Q = havQ(S.lic, H), q = quotaState(); q.hyse = Q.hyse[0] - 1000; S.kvHaul = []; S.hold = hold({torsk:3000, hyse:3000}); r = kvCheck(b);
  t.ok(r.items.some(i => i.k === 'kvoteh' && /2 000 kg over|2000 kg over/.test(i.no.replace(/ /g, ' '))), 'hyse 2 000 kg over det som er igjen av fartøykvoten er en merknad');
  q.hyse = 0; q.torsk = Q.torsk - 2000; r = kvCheck(b);
  t.ok(r.items.some(i => i.k === 'kvote' && /fartøykvoten/.test(i.no) && /§ 14/.test(i.ref)), 'torsk over fartøykvoten er en merknad etter § 14');
  q.torsk = 0;

  for (const k in B) delete B[k]; Object.assign(B, B0); void LL;
}
