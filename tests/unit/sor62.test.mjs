// Ø10c (steg 68, 11.11.2026): the rules south of 62° N that the sources settle (core/03e-rules.js, core/03d-quota.js).
//  - J-229-2025 (forskrift 19.12.2025 om forbud mot fiske i gyteområder for torsk i Norges økonomiske sone sør for 62° i 2026) § 2: all
//    fishing banned in five areas in their periods (Stanhope ground 1.1–30.4, Coral edge 1.12–28.2, Egersundbanken 1.12–31.3, Vestbanken
//    1.1–15.3, Revet 1.1–15.3), § 3 only purse seine and pelagic trawl excepted. Layer 18 of rules.json.
//  - J-99-2026 (oppvekstområdene, 1.7–31.12.2026) § 2 three areas, § 3: not purse seine and pelagic trawl, not jig, not nets of 160 mm
//    and more. Layer 19.
//  - FOR-2025-12-19-2805 as J-160-2026 words it: § 1 a the North Sea (Norway's territorial waters and economic zone south of 62° N west
//    of the line Hanstholmen fyr – Lindesnes fyr), § 4 the open group at most 3 tonnes (2 guaranteed), the jig exception in the Skagerrak
//    at most 3 tonnes, § 5 15 % bycatch in the North Sea (also once the vessel's maximum quota is fished) and 5 % in the Skagerrak.
// The points are found from the data (inside the layers' rings, and outside the baseline from the plants), so a new rules.json moves them.
export default function (t){
  const {rulesAt, ruBlockMsg, ruSea, insideBaseline, blNm, P, LL, newState, EPOCH, RU} = t.K;
  t.K.set('S', newState());
  const S = () => t.K.get('S');
  const H = (m, d) => (Date.UTC(2026, m - 1, d, 12) - EPOCH) / 36e5;
  const keys = r => r.items.map(i => i.k + ':' + i.v + (i.block ? '!' : ''));
  const blad = on => { S().fm = {...(S().fm || {}), b:on}; };
  const at = (p, o = {}) => rulesAt({p, H:o.H == null ? H(6, 1) : o.H, len:o.len == null ? 10 : o.len, gear:o.gear === undefined ? 'juksa' : o.gear, sp:o.sp === undefined ? null : o.sp, hand:true});
  // a point inside a feature of a layer, in Norway's economic zone: the mean of the ring, or the first of a grid over its box that is
  const inF = (id, re) => { const f = (RU.L[id] || {f:[]}).f.find(f => re.test(f.a.navn || '')); if (!f) return null; const r = f.P[0].rings[0], b = f.bb;
    for (let i = 1; i < 20; i++) for (let j = 1; j < 20; j++){ const p = {x:b[0] + (b[2] - b[0]) * i / 20, y:b[1] + (b[3] - b[1]) * j / 20}; if (t.K.ruIn(f.P, p.x, p.y) && ruSea(p) === 'no') return p; }
    return null; };

  // ---- the spawning areas (layer 18)
  const G = {stan:inF(18, /^Stanhope/), coral:inF(18, /^Coral/), eger:inF(18, /^Egersundbanken/), vest:inF(18, /^Vestbanken/), revet:inF(18, /^Revet/)};
  for (const k in G) t.ok(!!G[k], 'fant et punkt i gyteområdet ' + k + ' i Norges økonomiske sone' + (G[k] ? ' (' + LL(G[k]).lat.toFixed(2) + '° N ' + LL(G[k]).lon.toFixed(2) + '° Ø)' : ''));
  if (Object.values(G).some(p => !p)) return;
  const gy = (p, m, d, o = {}) => keys(at(p, {H:H(m, d), ...o})).includes('gyte18:no!');
  t.ok(gy(G.eger, 12, 1) && gy(G.eger, 1, 15) && gy(G.eger, 3, 31) && !gy(G.eger, 4, 1) && !gy(G.eger, 11, 30) && !gy(G.eger, 7, 1), 'Egersundbanken: stengt 1. desember–31. mars, åpent 1. april, 30. november og i juli');
  t.ok(gy(G.stan, 1, 1) && gy(G.stan, 4, 30) && !gy(G.stan, 5, 1) && !gy(G.stan, 12, 31), 'Stanhope ground: stengt 1. januar–30. april');
  t.ok(gy(G.coral, 12, 1) && gy(G.coral, 2, 28) && !gy(G.coral, 3, 1) && !gy(G.coral, 11, 30), 'Coral edge: stengt 1. desember–28. februar');
  t.ok(gy(G.vest, 1, 1) && gy(G.vest, 3, 15) && !gy(G.vest, 3, 16) && !gy(G.vest, 12, 31), 'Vestbanken: stengt 1. januar–15. mars');
  t.ok(gy(G.revet, 1, 1) && gy(G.revet, 2, 1) && gy(G.revet, 3, 15) && !gy(G.revet, 3, 16), 'Revet: stengt 1. januar–15. mars');
  for (const g of ['juksa', 'line', 'garn', 'teiner']) t.ok(gy(G.eger, 1, 15, {gear:g}) && gy(G.eger, 1, 15, {gear:g, sp:'sei'}), 'alt fiske: ' + g + ' er stoppet i perioden, også etter andre arter');
  t.ok(gy(G.eger, 1, 15, {len:35}) && gy(G.eger, 1, 15, {len:6}), '… for alle fartøystørrelser');
  { const it = at(G.eger, {H:H(1, 15)}).items.find(i => i.k === 'gyte18');
    t.ok(!!it && /Egersundbanken/.test(it.no) && !/2025/.test(it.no) && /1\. desember/.test(it.no) && /31\. mars/.test(it.no), 'grunnen sier området (uten årstallet i dataene) og perioden: ' + (it ? it.no : ''));
    t.ok(!!it && /J-229-2025/.test(it.ref) && /§ 2/.test(it.ref) && /j-229-2025/.test(it.url || ''), '… med J-meldingen, paragrafen og lenka');
    t.ok(/Egersundbanken/.test(ruBlockMsg({p:G.eger, H:H(1, 15), len:10, gear:'juksa', sp:null, hand:true}) || ''), 'ruBlockMsg gir grunnen (ruta, «Kast loss», Autonav og driftsplanen stopper)'); }
  { const sth = P(56.97, 5.6); t.ok(t.K.ruAt(18, sth).length === 1 && gy(sth, 2, 1), 'Vestbanken helt sør (56,97° N 5,6° Ø, der sonedataene slutter): stengt som resten (sonen der: «' + ruSea(sth) + '»)'); }
  // only the part in Norway's economic zone (§ 2: «Denne forskriften gjelder området som ligger i Norges økonomiske sone»)
  { const f = RU.L[18].f.find(f => /^Revet/.test(f.a.navn)), b = f.bb; let dk = null;
    for (let i = 1; i < 30 && !dk; i++) for (let j = 1; j < 30 && !dk; j++){ const p = {x:b[0] + (b[2] - b[0]) * i / 30, y:b[1] + (b[3] - b[1]) * j / 30}; if (t.K.ruIn(f.P, p.x, p.y) && ruSea(p) === 'dk') dk = p; }
    if (dk) t.ok(!gy(dk, 2, 1), 'Revet i dansk sone: ikke denne regelen (dansk sone har sin egen)'); else t.ok(true, 'Revet har ingen del i dansk sone i dataene'); }

  // ---- the nursery areas (layer 19), 1 July – 31 December
  const O = {eger:inF(19, /^Egersundbanken/), midt:inF(19, /^Midtbanken/), lille:inF(19, /^Lille Fiskebank/)};
  for (const k in O) t.ok(!!O[k], 'fant et punkt i oppvekstområdet ' + k + ' i Norges økonomiske sone');
  if (Object.values(O).some(p => !p)) return;
  // a point of the nursery area that is not in the spawning area of the same name, so each rule is seen alone
  const op = (p, m, d, g) => keys(at(p, {H:H(m, d), gear:g}));
  for (const k in O){
    t.ok(op(O[k], 7, 1, 'line').includes('opp19:no!') && op(O[k], 12, 31, 'line').includes('opp19:no!') && op(O[k], 9, 1, 'teiner').includes('opp19:no!'), k + ': line og teiner er stoppet 1. juli–31. desember');
    t.ok(!op(O[k], 6, 30, 'line').some(x => x.startsWith('opp19')) && !op(O[k], 5, 1, 'teiner').some(x => x.startsWith('opp19')), k + ': ikke før 1. juli');
    t.ok(!op(O[k], 9, 1, 'juksa').some(x => x.startsWith('opp19:no')), k + ': juksa er unntatt (§ 3)');
    t.ok(op(O[k], 9, 1, 'garn').includes('opp19g:warn') && !op(O[k], 9, 1, 'garn').includes('opp19:no!'), k + ': garn stoppes ikke, men teksten sier 160 mm (§ 3)'); }
  { const it = at(O.midt, {H:H(9, 1), gear:'line'}).items.find(i => i.k === 'opp19');
    t.ok(!!it && /Midtbanken/.test(it.no) && /J-99-2026/.test(it.ref) && /§ 2/.test(it.ref) && /juksa/.test(it.no), 'grunnen sier området, unntaket for juksa og J-99-2026 § 2'); }

  // ---- the North Sea of the cod regulation (§ 1 a) and the caps (§ 4)
  const {ruNsjo, ruByc, sorConf, sorRoom, SORQ} = t.K;
  t.ok(typeof ruNsjo === 'function' && typeof sorConf === 'function' && typeof sorRoom === 'function' && !!SORQ, 'ruNsjo, sorConf, sorRoom og SORQ finnes');
  if (typeof ruNsjo !== 'function' || typeof sorConf !== 'function' || typeof sorRoom !== 'function' || !SORQ) return;
  const out = (lat, lon) => { const a = P(lat, lon); for (let d = 0.2; d <= 40; d += 0.2){ const p = {x:a.x, y:a.y + d}; if (!insideBaseline(p) && blNm(p) > 1 && blNm(p) < 6) return p; } return null; };
  const krs = out(58.140, 7.996), ege = out(58.438, 5.979), egeIn = P(58.45, 5.99), brg = P(60.39, 5.30), brgOut = P(60.39, 4.6), krsIn = P(58.140, 7.996), aal = P(62.47, 6.15), trs = P(69.65, 18.96);
  t.ok(ruNsjo(ege) && ruNsjo(egeIn) && ruNsjo(brg) && ruNsjo(brgOut), 'Nordsjøen: Egersund utenfor og innenfor grunnlinja, Bergen i havna og til havs (territorialfarvannet og NØS)');
  t.ok(!ruNsjo(krs) && !ruNsjo(krsIn) && !ruNsjo(aal) && !ruNsjo(trs), 'ikke Kristiansand (øst for linja), ikke Ålesund og Tromsø (nord for 62° N)');
  t.ok(ruNsjo(P(57.7, 7.3)) && !ruNsjo(P(57.7, 7.8)), 'linja Lindesnes–Hanstholm: 57,7° N 7,3° Ø er Nordsjøen, 7,8° Ø ikke');
  t.ok(ruSea(P(59, 1.2)) === 'gb' && !ruNsjo(P(59, 1.2)) && ruSea(P(57.5, 8.2)) === 'dk' && !ruNsjo(P(57.5, 8.2)), 'bare norsk farvann: ikke britisk sone (59° N 1,2° Ø), ikke dansk (57,5° N 8,2° Ø)');
  t.eq(SORQ.nsjo.max, 3000, 'åpen gruppe i Nordsjøen: maksimalkvote 3 tonn');
  t.eq(SORQ.nsjo.guar, 2000, '… garantert 2 tonn');
  t.eq(SORQ.nsjo.by, 0.15, '… og 15 % bifangst etter den (§ 5)');
  t.eq(SORQ.skag4.max, 3000, 'juksaunntaket i Skagerrak: 3 tonn');
  t.eq(SORQ.skag4.by, 0.05, '… og 5 % bifangst etter det');
  // the zone the catch is counted in
  const z = (p, o = {}) => ruByc({p, H:o.H == null ? H(6, 1) : o.H, len:o.len == null ? 10 : o.len, gear:o.gear || 'juksa'});
  blad(false); S().hold = []; delete S().boat.byc; S().quota = null;
  t.ok(z(ege) === 'nsjo' && z(brg) === 'nsjo' && z(ege, {gear:'line'}) === 'nsjo' && z(ege, {gear:'garn'}) === 'nsjo' && !z(ege, {gear:'teiner'}), 'fangsten i Nordsjøen telles (juksa, line og garn; ikke teiner)');
  t.ok(z(krs) === 'skag' && z(krsIn) === 'sorfri' && !z(aal), 'Skagerrak utenfor grunnlinja som før; innenfor grunnlinja ved Kristiansand telles torsken som fri (ingen kvote der); nord for 62° N telles ingenting');
  blad(true); t.ok(z(krs) === 'skag4' && z(krs, {H:H(7, 1)}) === 'skag' && z(krs, {len:11}) === 'skag' && z(krs, {gear:'line'}) === 'skag', 'under unntaket (juksa under 11 m på blad B, 1.4–30.6) telles torsken mot 3 tonn (skag4); ellers bifangst');
  blad(false); t.ok(!t.K.ruBycOnly({p:ege, H:H(6, 1), len:10, gear:'juksa'}) && !t.K.ruBycOnly({p:brg, H:H(6, 1), len:10, gear:'juksa'}) && t.K.ruBycOnly({p:krs, H:H(6, 1), len:10, gear:'juksa'}) === 'skag', 'første turs felt (ruBycOnly): Nordsjøen er ikke en bifangstsone, Skagerrak utenfor grunnlinja er'); blad(true);
  // the room and what the landing takes: pure, sorConf(byc, codHold, q, acc)
  t.eq(sorRoom('nsjo', {}, 'open'), 3000, 'ingenting landet: 3 000 kg igjen');
  t.eq(sorRoom('nsjo', {nsjo:2600}, 'open'), 400, '2 600 kg landet: 400 igjen');
  t.eq(sorRoom('nsjo', {nsjo:3500}, 'open'), 0, 'aldri under null');
  t.eq(sorRoom('nsjo', {}, 'none'), 0, 'en båt uten adgang har ingen kvote i Nordsjøen (bare bifangst)');
  t.eq(sorRoom('nsjo', {}, 'lukket'), 3000, 'hjemmelen nord for 62° N gir ingen lukket gruppe i Nordsjøen: åpen gruppe');
  t.eq(sorRoom('skag4', {skag4:1000}, 'none'), 2000, 'unntaket i Skagerrak krever ikke åpen gruppe');
  { const c = sorConf({nsjo:{kg:1000, cod:400}}, 400, {}, 'open'); t.ok(c.kg === 0 && c.cod === 400 && c.ok.nsjo === 400, 'under taket: ingenting inndras, 400 kg går på kvoten'); }
  { const c = sorConf({nsjo:{kg:1000, cod:400}}, 400, {nsjo:2900}, 'open');
    t.ok(Math.abs(c.ok.nsjo - 100) < 1e-9 && Math.abs(c.kg - 150) < 1e-9 && Math.abs(c.by.nsjo - 150) < 1e-9, '100 kg igjen av taket, 400 kg torsk av 1000: 100 på kvoten, 150 lovlig bifangst (15 %), 150 inndratt (' + c.kg + ')'); }
  { const c = sorConf({nsjo:{kg:1000, cod:400}}, 400, {nsjo:3000}, 'open'); t.ok(Math.abs(c.kg - 250) < 1e-9 && !c.ok.nsjo, 'taket fullt: 400 − 15 % av 1000 = 250 inndratt'); }
  { const c = sorConf({nsjo:{kg:1000, cod:100}}, 100, {nsjo:3000}, 'open'); t.ok(c.kg === 0, 'taket fullt, 10 % torsk: innenfor bifangsten, ingenting inndras'); }
  { const c = sorConf({nsjo:{kg:1000, cod:400}}, 400, {}, 'none'); t.ok(Math.abs(c.kg - 250) < 1e-9, 'uten adgang: bare 15 % bifangst, 250 inndratt'); }
  { const c = sorConf({skag4:{kg:800, cod:500}}, 500, {skag4:2800}, 'open'); t.ok(Math.abs(c.ok.skag4 - 200) < 1e-9 && Math.abs(c.kg - 260) < 1e-9, 'Skagerrak-unntaket: 200 igjen, 500 torsk av 800: 200 på taket, 40 bifangst (5 %), 260 inndratt (' + c.kg + ')'); }
  { const c = sorConf({nsjo:{kg:1000, cod:400}}, 200, {nsjo:3000}, 'open'); t.ok(Math.abs(c.cod - 200) < 1e-9 && Math.abs(c.kg - 125) < 1e-9, 'sløyd torsk (200 kg om bord av 400 rund): inndragningen følger vekta om bord (125), aldri mer enn torsken om bord'); }
  { const c = sorConf({nsjo:{kg:500, cod:200}, skag4:{kg:100, cod:100}}, 1000, {nsjo:3000, skag4:3000}, 'open'); t.ok(Math.abs(c.cod - 300) < 1e-9 && Math.abs(c.by.nsjo - 125) < 1e-9 && Math.abs(c.by.skag4 - 95) < 1e-9, 'to soner i samme last regnes hver for seg; torsk fra andre steder røres ikke'); }
  { const c = sorConf(null, 500, {}, 'open'); t.ok(c.kg === 0 && c.cod === 0, 'ingen telling: ingenting'); }
  // the count aboard takes of the room: the exception ends when the cod aboard fills it
  { const b = S().boat; blad(true); S().quota = null; S().hold = [{sp:'torsk', kg:2990, cls:0}]; b.byc = {skag4:{kg:3200, cod:2990}};
    t.eq(z(krs), 'skag4', '2 990 kg torsk om bord under unntaket: fortsatt på taket');
    b.byc.skag4.cod = 3000; t.eq(z(krs), 'skag', '3 000 kg om bord: taket er fullt, og torsken er bifangst igjen (5 %)');
    t.ok(keys(at(krs, {sp:'torsk'})).includes('skag:no!'), '… og fiske etter torsk er stoppet igjen (skag)');
    S().hold = []; delete b.byc; }
  // rulesAt says the cap and what is left
  { blad(false); S().quota = null; const it = at(ege, {sp:'torsk'}).items.find(i => i.k === 'nsjo');
    t.ok(!!it && it.v !== 'no' && !it.block && /3 tonn/.test(it.no) && /15 %/.test(it.no) && /2805/.test(it.ref) && /§§ 1, 4 og 5/.test(it.ref), 'Egersund: regelen sier 3 tonn og 15 % med §§ 1, 4 og 5, uten å stoppe: ' + (it ? it.no : ''));
    t.ok(at(ege).v === 'ok', '… og regellaget er ikke gult så lenge det er igjen på taket');
    t.ok(!at(krsIn).items.some(i => i.k === 'nsjo') && !at(aal).items.some(i => i.k === 'nsjo') && !at(ege, {gear:'teiner', sp:'krabbe'}).items.some(i => i.k === 'nsjo'), 'ikke ved Kristiansand, ikke nord for 62° N, ikke for teiner');
    const q = t.K.quotaState(); q.nsjo = 3000; const f = at(ege).items.find(i => i.k === 'nsjoby');
    t.ok(!!f && f.v === 'warn' && !f.block && /15 %/.test(f.no) && /§§ 1, 4 og 5/.test(f.ref) && at(ege).v === 'warn', 'taket fullt: gult, torsk bare som bifangst, høyst 15 % (§§ 4 og 5)');
    S().quota = null; }
  // ---- the follow-up (Jonas 11.11.2026: «Fiks alt som er svakt eller antatt»)
  // the nets' mesh in the nursery areas (J-99-2026 § 3: nets of 160 mm and more only; the game's cod nets are 156, 180 and 200 mm)
  { const g = (m, o = {}) => keys(rulesAt({p:O.midt, H:H(9, 1), len:10, gear:'garn', sp:null, mesh:m, ...o}));
    t.ok(g(156).includes('opp19:no!') && /156 mm/.test((rulesAt({p:O.midt, H:H(9, 1), len:10, gear:'garn', sp:null, mesh:156}).items.find(i => i.k === 'opp19') || {}).no || ''), 'garn på 156 mm er stoppet i oppvekstområdet, og grunnen sier maskevidden');
    t.ok(!g(180).some(k => /:no/.test(k)) && !g(200).some(k => /:no/.test(k)) && !g(160).some(k => /:no/.test(k)), 'garn på 160, 180 og 200 mm er lov');
    t.ok(!keys(rulesAt({p:O.midt, H:H(6, 1), len:10, gear:'garn', sp:null, mesh:156})).some(k => k.startsWith('opp19')), '… og 156 mm er lov før 1. juli');
    S().pgear.nets = [{id:'n1', mesh:180, ty:'bunn', n:10}, {id:'n2', mesh:156, ty:'bunn', n:5}];
    t.ok(keys(rulesAt({p:O.midt, H:H(9, 1), len:10, gear:'garn', sp:null})).includes('opp19:no!'), 'uten oppgitt maskevidde gjelder de minste garna om bord (156 mm): stoppet');
    S().pgear.nets = [{id:'n1', mesh:180, ty:'bunn', n:10}];
    t.ok(!keys(rulesAt({p:O.midt, H:H(9, 1), len:10, gear:'garn', sp:null})).some(k => /:no/.test(k)), '… og med bare 180 mm om bord: lov');
    S().pgear.nets = []; }
  // inside the baseline east of Lindesnes: neither the North Sea nor the Skagerrak of the regulation, so no quota: counted as free
  { const c = sorConf({sorfri:{kg:500, cod:400}}, 400, {nsjo:3000, skag4:3000}, 'none');
    t.ok(c.kg === 0 && Math.abs(c.cod - 400) < 1e-9, 'torsk tatt innenfor grunnlinja øst for Lindesnes: ingenting inndras, og den regnes ikke mot kvoten nord for 62° N');
    t.eq(z(P(59.3, 10.55)), null, 'Oslofjorden er ikke med (torsk er forbudt der, som før)');
    for (const [n, la, lo] of [['indre Oslofjord', 59.85, 10.65], ['Drøbak', 59.66, 10.62], ['Hvaler', 59.1, 10.9], ['Larvik', 58.98, 10.05], ['Kragerø', 58.85, 9.45]])
      t.ok(z(P(la, lo)) === null && !!ruBlockMsg({p:P(la, lo), H:H(6, 1), len:7, gear:'juksa', sp:null, hand:true}), n + ': ingen fri torsk, og juksa er stoppet (Oslofjorden fra Telemark til Sverige, og nullfiskeområdene)');
    t.ok(z(P(58.71, 9.25)) === 'sorfri' && z(P(58.45, 8.78)) === 'sorfri', 'Risør og Arendal innenfor grunnlinja (Agder): fri torsk'); }
  // who is in the open group in the North Sea (deltakerforskriften § 16 and § 6): the owner aboard, one vessel an owner
  { const {sorAcc} = t.K; t.ok(typeof sorAcc === 'function', 'sorAcc finnes');
    if (typeof sorAcc === 'function'){ const s0 = S(); s0.quota = null; const own0 = s0.tripOwner;
      s0.tripOwner = true; t.eq(sorAcc(), 'open', 'eieren om bord, ingen annen båt har fisket på kvoten: åpen gruppe');
      s0.tripOwner = false; t.eq(sorAcc(), 'none', 'eieren er ikke om bord: ikke åpen gruppe (§ 16 d), bare bifangst');
      s0.tripOwner = true; const y = t.K.yearH(s0.t / 60), other = {id:'vX', quota:{y, nsjo:120}}; s0.fleet = s0.fleet || []; s0.fleet.push(other);
      t.eq(sorAcc(), 'none', 'en annen av eierens båter har alt fisket på åpen gruppe i år: denne kan ikke (§ 6)');
      other.quota.y = y - 1; t.eq(sorAcc(), 'open', '… men fjorårets fiske teller ikke');
      s0.fleet.pop(); s0.tripOwner = own0; } }
  // the word in the catch: only where the cod is a bycatch now
  { const {ruBycWarn} = t.K; t.ok(typeof ruBycWarn === 'function', 'ruBycWarn finnes');
    if (typeof ruBycWarn === 'function'){ S().quota = null; S().hold = []; delete S().boat.byc; S().tripOwner = true;
      t.ok(!ruBycWarn('nsjo', 40), 'Nordsjøen med plass på taket: ikke noe varsel i fangsten');
      t.K.quotaState().nsjo = 3000; const w = ruBycWarn('nsjo', 40);
      t.ok(!!w && w.share === 0.15 && /40 %/.test(w.no) && /Nordsjøen/.test(w.no) && /15 %/.test(w.no) && /§ 5/.test(w.ref), 'taket fullt: varselet over 15 % sier Nordsjøen og prosenten, med § 5: ' + (w ? w.no : ''));
      const k = ruBycWarn('skag', 24); t.ok(!!k && k.share === 0.05 && /Skagerrak/.test(k.no) && /24 %/.test(k.no), 'Skagerrak som før: 5 %');
      t.ok(!ruBycWarn('skag4', 90) && !ruBycWarn('sorfri', 90) && !ruBycWarn(null, 90), 'unntaket med plass, fri torsk og ingen sone: ikke noe varsel');
      S().quota = null; } }
  // the cod aboard that is not on the quota north of 62° N
  { const {sorCodAboard} = t.K; t.ok(typeof sorCodAboard === 'function', 'sorCodAboard finnes');
    if (typeof sorCodAboard === 'function'){ const b = S().boat; S().hold = [{sp:'torsk', kg:300, cls:0}, {sp:'sei', kg:100, cls:0}]; b.byc = {nsjo:{kg:250, cod:200}, skag:{kg:50, cod:30}};
      t.eq(sorCodAboard(), 230, '200 kg fra Nordsjøen og 30 fra Skagerrak av 300 kg torsk om bord: 230 er ikke på kvoten i nord');
      b.byc.nsjo.cod = 900; t.eq(sorCodAboard(), 300, 'aldri mer enn torsken om bord'); S().hold = []; delete b.byc; } }
}
