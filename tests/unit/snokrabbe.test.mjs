// The snow crab (H3a of docs/planer/havsteget-h3-snokrabbe.md, 06.11.2026; core/10d-snokrabbe.js): the crab as it comes up (sex, width,
// weight, soft shell) against HI, the sorting on deck (høstingsforskriften §§ 46, 47 and 51, J-237-2025 § 5), where it is (the landing
// notes by location and month, fiske.json snok, on Norway's shelf), the catch per pot against the notes and the profitability survey, the
// conical pot and the strings, the rules (§§ 18, 25, 27, 28), the quota by the year's rules (V4), the register of 30, the flat permit and
// its value (V6 B), the stock after 2027 and the vessel unlocked. The chart is not loaded here, so the sea is laid at 300 m (the banks'
// depth); tests/snokrabbetest.py measures the catch on the real banks.
export default function (t){
  const K = t.K, S = K.newState(); K.set('S', S);
  const isL = K.isLand, dF = K.depthF; K.set('isLand', () => false); K.set('depthF', () => 300);
  const {SPECIES, POTS, SNOC, VESSELS, HAVLIC, HREG, EPOCH} = K;
  const Hd = (y, m, d) => (Date.UTC(y, m - 1, d, 12) - EPOCH) / 36e5;
  const D = K.fkData(), RU = K.RU, I = new Map(RU.lok.map((h, i) => [h.c, i]));
  const ptIn = (c, k) => { const P = RU.lok[I.get(c)].P[0], b = P.bb; for (let j = 0; j < 200; j++){ const x = b[0] + (b[2] - b[0]) * K.h2(k, 9100 + j), y = b[1] + (b[3] - b[1]) * K.h2(k, 9300 + j); if (K.ruIn(RU.lok[I.get(c)].P, x, y) && K.ruShelf({x, y})) return {x, y}; } return null; };

  // the species: fished by the snow crab vessel with its permit, still last in ALLSP (no other species' seeds move), landed whole
  const sp = SPECIES.snokrabbe;
  t.ok(sp.lic === 'krab' && sp.npc && sp.whole && sp.stk === 'sstk' && K.get('ALLSP')[K.get('ALLSP').length - 1] === 'snokrabbe' && !K.get('PLAYSP').includes('snokrabbe'), 'snøkrabben fanges med snøkrabbetillatelsen, ligger sist i ALLSP og landes hel');

  // width-weight (HI 2023-61 fig. 8, hard shell medians 95-99 mm 380 g, 110-114 mm 600 g, 120-124 mm 780 g; new shell 10-15 % lighter)
  const w = (cw, soft) => K.snoW(cw, soft) * 1000;
  t.ok(Math.abs(w(97) - 380) < 30 && Math.abs(w(112) - 600) < 40 && Math.abs(w(122) - 780) < 50, `vekta etter skallbredden: 97 mm ${w(97).toFixed(0)} g, 112 mm ${w(112).toFixed(0)} g, 122 mm ${w(122).toFixed(0)} g (HI: 380, 600, 780)`);
  const lt = 1 - w(110, true) / w(110); t.ok(lt > 0.08 && lt < 0.17, `nyskallet krabbe er ${(lt * 100).toFixed(0)} % lettere (HI: 10–15 %)`);
  // the crabs in the pots: males with median about 104-105 mm and 11-27 % under 95 mm (HI), few females
  const N = 20000, cs = Array.from({length:N}, () => K.snoCrab(1)), males = cs.filter(c => !c.fem).map(c => c.cw).sort((a, b) => a - b);
  const under = males.filter(v => v < 95).length / males.length, med = males[males.length >> 1], fem = cs.filter(c => c.fem).length / N;
  t.ok(under > 0.11 && under < 0.27 && med > 102 && med < 108 && fem < 0.06, `i teina: ${(under * 100).toFixed(0)} % av hannene under 9,5 cm, median ${med.toFixed(0)} mm, ${(fem * 100).toFixed(1)} % hunner`);
  const legalW = cs.filter(c => c.cw >= 95 && !c.soft).reduce((a, c) => a + c.w, 0) / cs.filter(c => c.cw >= 95 && !c.soft).length;
  t.ok(legalW > 0.45 && legalW < 0.65, `en hann over minstemålet veier i snitt ${legalW.toFixed(2)} kg`);
  // soft crab by month: little in winter, more toward the summer's moult
  const soft = m => Array.from({length:8000}, () => K.snoCrab(m)).filter(c => c.soft).length / 8000;
  t.ok(soft(1) < 0.06 && soft(5) > 0.1 && soft(7) > 0.2, `bløtkrabbe: februar ${(soft(1) * 100).toFixed(0)} %, juni ${(soft(5) * 100).toFixed(0)} %, august ${(soft(7) * 100).toFixed(0)} %`);

  // the vessel: her conical pots, unlocked, the cap of § 28 as her room
  const B = K.BOAT; Object.assign(B, VESSELS.snokrabbe); S.boat.type = 'snokrabbe'; S.boat.rig = 'teiner';
  t.ok(!VESSELS.snokrabbe.lock && VESSELS.snokrabbe.pot === 'sno' && VESSELS.snokrabbe.gearMax.teine === SNOC.max && SNOC.max === 8000, 'snøkrabbefartøyet er låst opp, har koniske teiner og plass til 8 000');
  const P = POTS.sno; t.ok(P.cone && P.hole && P.mark && P.mesh === 135 && P.bait >= 0.4 && P.bait <= 1 && K.potK() === 'sno' && K.potSp() === 'snokrabbe', 'teina: konisk, 135 mm, rømmingshull og registreringsmerke, et halvt kilo akkar');
  const perDay = 1440 / P.haul; t.ok(perDay >= 1200 && perDay <= 2000, `haleren tar ${perDay.toFixed(0)} teiner i døgnet (1 200–1 800 i kildene)`);
  t.near(200 * K.GEAR.teine.km, 5, 0.01, 'en lenke på 200 teiner med 25 m mellom er 5 km');
  // buying: only with the permit
  S.boat.status = 'port';
  t.ok(K.buyGate('pot', 'sno') && /tillatelse/.test(K.buyGate('pot', 'sno')[0]), 'uten snøkrabbetillatelse selges ingen snøkrabbeteiner');
  S.lic = {id:'krab', hav:true, hl:HAVLIC.krab.no, kf:1}; K.set('S', S);
  t.ok(!K.buyGate('pot', 'sno') && K.buyGate('pot', 'big'), 'med tillatelsen: snøkrabbeteiner, ikke kongekrabbeteiner');

  // where: the notes' banks, none on another shelf or along the coast
  const Hf = Hd(2027, 2, 15), aBank = K.snoArea(K.P(76.5, 33), Hf), aSent = K.snoArea(K.P(74.6, 35.5), Hf), aRu = K.snoArea(K.P(74.5, 45), Hf), aCoast = K.snoArea(K.P(70.5, 30.5), Hf), aLof = K.snoArea(K.P(68.2, 13), Hf);
  t.ok(aBank > 0.5 && aSent > 0.5 && aRu === 0 && aCoast === 0 && aLof === 0, `snøkrabbe på Storbanken (${aBank.toFixed(2)}) og Sentralbanken (${aSent.toFixed(2)}), ikke på russisk sokkel, langs Finnmark eller i Lofoten`);
  K.set('depthF', () => 120); const shallow = K.snoArea(K.P(76.5, 33), Hf); K.set('depthF', () => 600); const deep = K.snoArea(K.P(76.5, 33), Hf); K.set('depthF', () => 300);
  t.ok(shallow === 0 && deep === 0, 'ingen snøkrabbe på 120 m eller 600 m (bankene på 220–380 m)');

  // the catch: a string of 200 soaked on the banks with landings, weighed by the notes' kilos per location and month, Dec-Jun
  const legal = m => { let kg = 0, n = 0; for (let i = 0; i < 20000; i++){ const c = K.snoCrab(m); n++; if (c.cw >= 95 || c.dead) kg += c.w; } return kg / n; };
  const soak = (p, H0, days) => { const s = {kind:'teine', pot:'sno', n:200, a:{x:p.x - 2.5, y:p.y}, b:{x:p.x + 2.5, y:p.y}, tSet:H0 * 60, acc:{}, bait:'blekksprut', cond:1, dry:true, dead:0};
    for (let h = 0; h < days * 24; h++){ S.t = (H0 + h) * 60; K.soakHour(s, H0 + h); } return s; };
  let W = 0, SUM = 0; const byM = {};
  for (const m of [12, 1, 2, 3, 4, 5, 6]){ const H0 = Hd(m === 12 ? 2026 : 2027, m, 10), lw = legal(m - 1); let wm = 0, sm = 0;
    for (const [c, ms] of D.snok.lok){ const kg = ms[m - 1]; if (kg < 20000) continue; const p = ptIn(c, c.charCodeAt(1) * 31 + c.charCodeAt(4)); if (!p) continue; const s = soak(p, H0, 7); sm += kg * s.acc.snokrabbe.n / 200 * lw; wm += kg; }
    byM[m] = (sm / wm).toFixed(1); SUM += sm; W += wm; }
  const kgPot = SUM / W; t.ok(kgPot >= 5 && kgPot <= 7, `${kgPot.toFixed(1)} kg rund vekt beholdt per teine etter 7 døgn, vektet etter sedlene (5–7 kg; per måned des–jun ${Object.values(byM).join(' / ')})`);
  // the soak: the bait's pull is mostly spent in a few days, so a longer soak gives a little more; the crab lives in the pot
  const p0 = K.P(76.5, 33), s3 = soak(p0, Hf, 3), s7 = soak(p0, Hf, 7), s21 = soak(p0, Hf, 21), n3 = s3.acc.snokrabbe.n, n7 = s7.acc.snokrabbe.n, n21 = s21.acc.snokrabbe.n;
  t.ok(n3 < n7 && n7 < n21 && n21 < 1.3 * n7 && n3 > 0.6 * n7 && !s21.dead, `ståtida: ${(n3 / 200).toFixed(1)} / ${(n7 / 200).toFixed(1)} / ${(n21 / 200).toFixed(1)} krabber per teine etter 3, 7 og 21 døgn, ingen død krabbe`);
  // a vessel day: pots hauled a day at the machine's pace times the catch: about 8 t (the notes and the survey: 8 t a day at sea, 100 t a trip)
  const day = perDay * 0.85 * kgPot / 1000; t.ok(day > 6 && day < 10.5, `${day.toFixed(1)} t i døgnet med ${(perDay * 0.85).toFixed(0)} teiner trukket (8 t), ${(day * 15).toFixed(0)} t på 15 fiskedøgn av en tur på 20 (om lag 100 t)`);

  // the sorting: males from 9.5 cm kept, the rest back alive, the dead kept, soft counted
  S.hold = []; S.t = Hf * 60; const g = {rel:0, kg:0}; K.landSno(g, 3000);
  const kept = S.hold.reduce((a, x) => a + x.n, 0), so = g.snoS, keptKg = S.hold.reduce((a, x) => a + x.kg, 0);
  t.ok(so.n === 3000 && kept === so.kept && so.kept + so.rel === 3000 && so.rel === g.rel && so.small > 300, `sortert: ${so.kept} beholdt (${so.soft} bløte, ${so.dead} døde), ${so.rel} satt ut levende (${so.small} under 9,5 cm, ${so.fem} hunner)`);
  t.ok(S.hold.every(x => x.sp === 'snokrabbe' && x.gut) && S.hold.some(x => x.cls === 2) && keptKg / kept > 0.45, `i lasten: ${keptKg.toFixed(0)} kg i klassene hard, bløt og død (${(keptKg / kept).toFixed(2)} kg per krabbe), hel og usløyd`);
  // over 20 % soft crab: the vessel changes field (J-237-2025 § 5)
  S.msgs = []; const g2 = {rel:0, kg:0, snoS:{n:500, kept:400, rel:100, fem:5, soft:100, dead:2, kg:200, small:95}}, sset = {a:K.P(76.5, 33), b:K.P(76.5, 33.1)};
  K.snoHaulDone(g2, sset); const r5 = K.rulesAt({p:K.P(76.5, 33.05), H:Hf, len:50, gear:'teiner', sp:'snokrabbe', hav:'krab'});
  t.ok(S.snoSoft && S.snoSoft.pct === 25 && r5.items.some(i => i.k === 'sk5' && i.v === 'warn'), 'over 20 % bløtkrabbe i trekket: meldt, og regelen sier skift felt der');
  S.t += 8 * 1440; t.ok(!K.rulesAt({p:K.P(76.5, 33.05), H:S.t / 60, len:50, gear:'teiner', sp:'snokrabbe', hav:'krab'}).items.some(i => i.k === 'sk5'), 'etter en uke er feltet åpent igjen');

  // the rules: § 28 the cap and «kun med teiner», § 27 for crab pots on vessels over 21.5 m, the closure and the shelf (soner.test.mjs)
  S.t = Hf * 60; const pg = S.pgear; pg.pots.sno = 400; pg.kits.n = 40; K.baitOf(pg).blekksprut = 400; S.boat.status = 'idle'; S.boat.pos = K.P(76.5, 33); S.boat.gop = null;
  S.sets = Array.from({length:39}, (_, i) => ({id:'s' + i, vid:S.cur, kind:'teine', pot:'sno', n:200, a:K.P(76 + i * 0.01, 32), b:K.P(76 + i * 0.01, 32.1), tSet:S.t, acc:{}}));
  t.ok(!K.gearRules('teine', {pot:'sno', n:200, bait:'blekksprut'}, S.boat.pos), 'lenke nummer 40 kan settes (8 000 teiner)');
  const r28 = K.gearRules('teine', {pot:'sno', n:201, bait:'blekksprut'}, S.boat.pos); t.ok(r28 && /§ 28/.test(r28[0]), `over 8 000 teiner stoppes: «${r28 && r28[0]}»`);
  S.sets = []; S.snoSoft = null;
  const rj = K.rulesAt({p:K.P(76.5, 33), H:Hf, len:50, gear:'juksa', sp:'snokrabbe', hav:'krab'}); t.ok(rj.items.some(i => i.k === 'sk7' && i.block), 'snøkrabbe kan bare fangstes med teiner (§ 28)');
  const r6 = K.rulesAt({p:K.P(76.5, 33), H:Hf, len:50, gear:'teiner', sp:'snokrabbe', hav:'krab'}); t.ok(r6.v === 'ok' && r6.items.some(i => i.k === 'sk6') && r6.items.some(i => i.k === 'sk4' && /433/.test(i.no)), 'på Storbanken i februar 2027: lov, med taket, røktingen, posisjonen og fartøykvoten 433 t');
  K.set('isLand', isL); K.set('depthF', dF);
  // § 27 (the coast: the baseline needs no chart): crab pots within 4 nm on a vessel over 21.5 m, within 6 nm in Finnmark 1.11-31.3 over 21.35 m
  const fm = K.P(70.45, 30.9), nmF = K.blNm(fm), q27 = (len, H) => K.rulesAt({p:fm, H, len, gear:'teiner', sp:'krabbe'}).items.map(i => i.k);
  t.ok(nmF < 4 && q27(22, Hd(2027, 6, 1)).includes('f27') && !q27(21, Hd(2027, 6, 1)).includes('f27') && !q27(21, Hd(2027, 6, 1)).includes('f27b'), `§ 27: krabbeteiner ${nmF.toFixed(1)} nm av grunnlinja i Finnmark er forbudt over 21,5 m, ikke for 21 m`);
  const f6 = (() => { for (let k = 0; k < 200; k++){ const p = K.P(70.45 + k * 0.004, 30.9 + k * 0.004); const n = K.blNm(p); if (n > 4.3 && n < 5.7) return p; } return null; })();
  t.ok(f6 && K.rulesAt({p:f6, H:Hd(2027, 12, 1), len:21.4, gear:'teiner', sp:'krabbe'}).items.some(i => i.k === 'f27b') && !K.rulesAt({p:f6, H:Hd(2027, 6, 1), len:21.4, gear:'teiner', sp:'krabbe'}).items.some(i => i.k === 'f27b'), '§ 27: 4–6 nm i Finnmark er forbudt over 21,35 m fra 1. november til 31. mars');
  K.set('isLand', () => false); K.set('depthF', () => 300);

  // the quota by the year's rules (V4): 2026 J-237-2025 §§ 3-4, 2027 the proposal, then the stock
  const y26 = K.snoYear(2026), y27 = K.snoYear(2027), y30 = K.snoYear(2030);
  t.ok(y26.vq === 351 && y26.tq === 82 && y27.vq === 433 && y27.tq === 110 && !y27.over && y27.flex === 0.1, `fartøykvoten 2026 ${y26.vq} + ${y26.tq} t (J-237-2025), 2027 ${y27.vq} + ${y27.tq} t (forslaget, sak 17/2026)`);
  const tacs = [2028, 2029, 2030, 2032, 2035].map(y => K.snoYear(y).tac);
  t.ok(!y30.known && tacs.every(v => v > 5000 && v < 40000) && new Set(tacs).size > 2 && K.STOCK.snokrabbe.idx, `etter 2027 følger totalkvoten spillets bestand: ${tacs.join(' / ')} t (2028, 2029, 2030, 2032, 2035)`);
  t.ok(K.havQ({id:'krab', kf:1.3}, Hd(2027, 3, 1)).snokrabbe === 433000 && K.havGroup('krab', 2027).snokrabbe === 16594, 'alle tillatelsene har samme kvote (ingen kvotefaktor), og gruppa er totalkvoten');
  // the flexibility: from 2027/2028, 10 % of the vessel quota carried over (unused credited, overfished charged)
  S.quota = {y:2027, torsk:0, hyse:0, sei:0, snokrabbe:400000}; S.t = Hd(2028, 1, 5) * 60; K.quotaState();
  t.ok(S.lic.flex && S.lic.flex.y === 2028 && S.lic.flex.kg === 33000 && K.snoQuota(S.t / 60).max === Math.round(K.snoYear(2028).vq * 1000) + Math.round(0.1 * Math.round(K.snoYear(2028).vq * 1000)) + 33000, `kvotefleksen: 33 t ubrukt i 2027 er godskrevet 2028 (${S.lic.flex && S.lic.flex.kg} kg)`);
  S.quota = {y:2028, torsk:0, hyse:0, sei:0, snokrabbe:5e6}; S.t = Hd(2029, 1, 5) * 60; K.quotaState(); const v28 = Math.round(K.snoYear(2028).vq * 1000);
  t.ok(S.lic.flex.kg === -Math.round(0.1 * v28), `overfiske belastes året etter med høyst 10 % (${S.lic.flex.kg} kg)`);
  S.lic.flex = null; S.quota = {y:2026, torsk:0, hyse:0, sei:0, snokrabbe:100000}; S.t = Hd(2027, 1, 5) * 60; K.quotaState(); t.ok(!S.lic.flex, 'ingen kvotefleks på fartøynivå fra 2026 til 2027');
  // the register: 30 permits, an old save with 34 is cut to 30
  S.npcReg = {...K.REGN, tral:36, konv:26, rnot:69, krab:34}; t.ok(HREG.krab === 30 && K.npcReg().krab === 30, '30 snøkrabbetillatelser i registeret (sak 17/2026), en gammel lagring med 34 får 30');
  K.WSH.reg = {krab:34}; t.ok(K.npcReg().krab === 30, 'serverens register med 34 (før migreringen) vises som 30'); K.WSH.reg = null;
  // the permit: no quota factor, priced by what the fishery bears (V6 B)
  const kfs = new Set([0, 1, 2, 3, 4, 5].map(wk => K.havOffer('krab', wk * 168).kf)), V = K.snoLicValue(2027);
  t.ok(kfs.size === 1 && kfs.has(1) && K.havValue({id:'krab', kf:1}, Hd(2027, 3, 1)) === V.v, 'ukas snøkrabbetillatelse har ingen kvotefaktor, og verdien er det driften bærer');
  t.ok(V.v > 0 && V.v < 150e6 && Math.abs(V.inc - 54) < 3, `tillatelsen 2027: inntekt ${V.inc.toFixed(1)} MNOK, kostnader ${V.cost.toFixed(1)}, driftsresultat før avskrivninger ${V.ebitda.toFixed(1)} MNOK i året, verdi ${(V.v / 1e6).toFixed(1)} MNOK`);
  // the landing: the vessel quota with the flexibility, the rest confiscated
  t.ok(K.snoRoom(Hd(2027, 3, 1)) >= 0, 'kvoterommet regnes');
}
