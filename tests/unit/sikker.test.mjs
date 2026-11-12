// Ø11.5 (06.11.2026): the gear and the marking on the boats, docs/planer/lover-regler-sikkerhet.md. The life-saving gear by the rules
// (lsaOf: FOR-2013-11-22-1404 § 43 under 15 m, FOR-2000-06-13-660 §§ 7-5 and 7-10 from 15 m), the electronics that follow the boat
// (reqOf, reqFill: §§ 64, 68 and 77, §§ 9-6, 10-4a and 10-7; V6 A), the call sign (callOf: FOR-2002-06-27-754 §§ 5 and 9, never a
// real one), and in the models (vessel3d.js): the old rescue boats left out of your own hull from 45 m (MOBCUT) without the deck going
// with them, the places from the code (KITADD), the ladder aft on every boat under 15 m (§ 63) and the life jacket's parts on the people.
export const scripts = ['js/vessel3d.js'];
export const data = true;

export default function (t){
  const K = t.K, {VESSELS, lsaOf, reqOf, reqFill, callOf, REGM, glbModel, glbPart, glbHas, glbLoad, MOBCUT, KITADD, mobCut, vestKit, lookKit, lookDefault, wkKitOf, wkPart} = K;
  const S = K.newState(); K.set('S', S);

  // ---- the life-saving gear ----
  const L = k => VESSELS[k].lsa;
  t.ok(L('kyst21').buoys === 3 && L('kyst21').smoke === 1 && L('kyst21').lights >= 1 && L('kyst21').mob === 0, '§ 7-10: kyst21 (21 m) har 3 livbøyer, én med MOB-lys og røyk, ingen MOB-båt', L('kyst21'));
  t.ok(L('pelagisk').buoys === 8 && L('pelagisk').smoke === 2 && L('pelagisk').mob === 1, '§ 7-10: pelagisk (75 m) har 8 livbøyer, røyk på to, MOB-båt (§ 7-5)', L('pelagisk'));
  t.ok(['autoliner', 'snokrabbe', 'bunntral'].every(k => L(k).buoys === 6 && L(k).smoke === 2 && L(k).mob === 1), '§ 7-10: 45–75 m har 6 livbøyer, røyk på to og MOB-båt (autolineren, snøkrabbebåten, tråleren)');
  t.ok(L('ringnot38').buoys === 4 && L('ringnot38').smoke === 2 && L('ringnot38').mob === 0, '24–45 m: 4 livbøyer, røyk på to, ingen MOB-båt (ringnot38, 38,55 m)', L('ringnot38'));
  // (Jonas 09.11.2026, OB6: «bare båter med kapasitet for 4 mann eller mer skal ha slikt utstyr»: under four aboard no raft and no buoy)
  const few = Object.keys(VESSELS).filter(k => 1 + VESSELS[k].crewMax < 4);
  t.ok(few.includes('snekke') && few.includes('skiff') && few.every(k => L(k).rafts === 0 && L(k).buoys === 0 && L(k).lights === 0 && L(k).lines === 0),
    'under fire om bord: ingen redningsflåte og ingen livbøye (Jonas 09.11.2026)', few.map(k => k + ':' + L(k).rafts + '/' + L(k).buoys));
  t.ok(Object.keys(VESSELS).filter(k => 1 + VESSELS[k].crewMax === 4).every(k => L(k).buoys >= 1) && VESSELS.snekke.crewMax === 1 && VESSELS.snekke.jukseMax === 2,
    'fire om bord har livbøye; snekka har deg og én til og to juksamaskiner (Jonas 09.11.2026)');
  const small = Object.keys(VESSELS).filter(k => VESSELS[k].len < 15 && !VESSELS[k].bare && !few.includes(k));
  // a bare boat (Father's old wooden boat, Jonas 09.11.2026) carries no lifebuoy and no ladder, and her lanterns no fishing lights
  const bare = Object.keys(VESSELS).filter(k => VESSELS[k].bare);
  t.ok(bare.includes('trebat') && bare.every(k => L(k).buoys === 0 && L(k).lights === 0 && L(k).lines === 0 && L(k).ladder === false && !(KITADD[k] || {}).ladder),
    'trebåten (bare) har ingen livbøye og ingen leider', bare.map(k => [k, L(k)]));
  t.ok(L('sjark').ladder === true && L('kyst21').ladder === false, 'leideren akter: under 15 m ellers (§ 63)');
  { const G = {lights:[[[-0.9, 0.9, -1.5], [1, 0.12, 0.1], 'port'], [[0.9, 0.9, -1.5], [0.1, 1, 0.35], 'stbd'], [[0, 2.2, 2.4], [1, 0.95, 0.85], 'allround']]};
    const kinds = (V, st) => K.lanterns(G, V, st).map(l => l[2]).join(' ');
    t.eq([kinds(VESSELS.trebat, {fishing:true, v:0}), kinds(VESSELS.trebat, {fishing:true, v:3}), kinds(VESSELS.trebat, {nuc:true, v:0}), kinds(VESSELS.trebat, {v:5})],
      ['allround side side', 'allround side side', 'allround side side', 'allround side side'], 'trebåten: ingen fiskelanterner og ikke to røde (27 g), bare den hvite rundtlysende og sidelysene');
    t.eq(kinds(VESSELS.snekke, {fishing:true, v:0}), 'fishW fishR', 'plastsnekka viser fortsatt rødt over hvitt når hun fisker'); }
  // not under command and aground: the two reds hang on the mast where the model has its all-round lamps one over the other (fishR over
  // fishW), not 1 and 2 m over the top of the mast in the air (OB10 round 3, 12.11.2026: the new speed sjark adrift without fuel showed
  // them floating over her masthead)
  { const G = {lights:[[[-0.9, 3.0, -1.5], [1, 0.12, 0.1], 'port'], [[0.9, 3.0, -1.5], [0.1, 1, 0.35], 'stbd'], [[0, 7.7, 0.5], [1, 0.97, 0.88], 'allround'],
      [[0, 6.6, 0.5], [1, 0.12, 0.1], 'fishR'], [[0, 5.55, 0.5], [1, 0.97, 0.88], 'fishW'], [[0, 3.0, 5.0], [1, 0.97, 0.88], 'stern']]};
    const top = Math.max(...G.lights.map(l => l[0][1])), nuc = st => K.lanterns(G, Object.assign({}, VESSELS.sjarkny, st.len ? {len:st.len} : {}), st).filter(l => l[2] === 'nuc');
    const N = nuc({nuc:true, v:0}), A = nuc({aground:true, len:14});
    t.ok(N.length === 2 && N.every(l => l[0][1] <= top + 1e-9) && Math.abs(N[0][0][1] - N[1][0][1]) >= 1.0 && N.every(l => l[0][0] === 0 && l[0][2] === 0.5),
      'ikke under kommando: de to røde på masta der fiskelanternene står (1,05 m imellom), ikke i lufta over det øverste lyset', N.map(l => l[0]));
    t.ok(A.length === 2 && A.every(l => l[0][1] <= top + 1e-9), 'på grunn (fra 12 m): de to røde på masta, ikke over den', A.map(l => l[0]));
    const G0 = {lights:G.lights.filter(l => !/^fish/.test(l[2]))}, N0 = K.lanterns(G0, VESSELS.sjarkny, {nuc:true, v:0}).filter(l => l[2] === 'nuc');
    t.ok(N0.length === 2 && Math.abs(N0[1][0][1] - N0[0][0][1] - 1.0) < 1e-9, 'en modell uten fiskelanterner: de to røde én meter imellom over masttoppen som før', N0.map(l => l[0])); }
  t.ok(small.every(k => L(k).smoke === 0 && L(k).mob === 0 && L(k).buoys >= Math.ceil(L(k).persons / 3) && L(k).buoys >= (VESSELS[k].len >= 10.67 ? 2 : 1) && L(k).lights >= L(k).buoys / 2),
    '§ 43 under 15 m: én bøye per tre om bord, to fra 10,67 m, halvparten med lys, ingen røyk og ingen MOB-båt', small.map(k => k + ':' + L(k).buoys));
  t.ok(Object.keys(VESSELS).every(k => L(k).smoke <= L(k).lights && L(k).lights <= L(k).buoys && L(k).lines <= L(k).buoys), 'røyk ≤ lys ≤ bøyer, og linene på bøyer som finnes, for alle typene');
  // the edges: 15 m and 24 m, 45 m and 75 m
  const at = len => lsaOf(Object.assign({}, VESSELS.kyst21, {len}));
  t.ok(at(14.99).smoke === 0 && at(15).buoys === 3 && at(15).smoke === 1 && at(23.99).buoys === 3 && at(24).buoys === 4 && at(24).smoke === 2 && at(44.99).mob === 0 && at(45).mob === 1 && at(45).buoys === 6 && at(74.99).buoys === 6 && at(75).buoys === 8,
    'grensene 15, 24, 45 og 75 m i § 7-10 og § 7-5');

  // ---- what follows the boat (V6 A) ----
  const R = k => VESSELS[k].req;
  t.ok(!R('skiff').length && !R('trebat').length, 'de åpne båtene uten styrhus har ikke påbudt radio (§ 64)', [R('skiff'), R('trebat')]);
  t.ok(['snekke', 'plastsjark', 'sjark'].every(k => R(k).join() === 'vhf'), 'VHF på dekkede båter og åpne med styrhus under 10,67 m (§§ 64, 68)', ['snekke', 'plastsjark', 'sjark'].map(R));
  t.ok(['hurtigsjark', 'sjarkny', 'breisjark', 'kyst15'].every(k => R(k).join() === 'vhf,brovakt'), 'brovaktalarm fra 10,67 m (§ 77), ingen AIS under 15 m', ['hurtigsjark', 'kyst15'].map(R));
  t.ok(['kyst21', 'autoliner', 'pelagisk', 'ringnot38'].every(k => R(k).join() === 'vhf,ais,brovakt'), 'fra 15 m VHF, AIS og brovaktalarm (§§ 9-6, 10-4a, 10-7)', R('kyst21'));
  t.ok(Object.keys(VESSELS).every(k => R(k).every(q => VESSELS[k].std.includes(q))), 'det påbudte er med i std (følger båten fra verftet)');
  const eq = {plotter:true}, add = reqFill(eq, 'kyst21');
  t.ok(add.join() === 'vhf,ais,brovakt' && eq.vhf && eq.ais && eq.brovakt && eq.plotter, 'en gammel lagring på kyst21 uten radio får VHF, AIS og brovaktalarm gratis, og beholder resten', add);
  t.ok(reqFill(eq, 'kyst21').length === 0 && reqFill({}, 'skiff').length === 0, 'reqFill legger ingenting til to ganger, og ingenting på skiffen');
  S.boat.type = 'kyst15'; S.equip = {}; K.applyVessel();
  t.ok(S.equip.vhf && S.equip.brovakt && !S.equip.ais, 'applyVessel gir båten det påbudte når den bindes (kyst15: VHF og brovaktalarm)', S.equip);

  // ---- the call sign ----
  t.ok(REGM && REGM.c && Object.values(REGM.c).reduce((a, v) => a + v.length, 0) > 3000, 'kallesignalene i sluttsedlene er med (REGM.c)', REGM && REGM.c && Object.keys(REGM.c).length);
  const seen = new Set(); let bad = 0, real = 0, shape = 0;
  for (let i = 0; i < 400; i++){ S.boatName = 'Båt ' + i; S.cur = 'v' + i; const b = {type:i % 2 ? 'sjarkny' : 'kyst21'}; const c = callOf(b);
    if (!/^L[FGHKM]\d{4}$/.test(c || '')) shape++; else if ((REGM.c[c.slice(0, 2)] || []).includes(+c.slice(2))) real++; seen.add(c); if (b.call !== c) bad++; }
  t.ok(!shape && !real && !bad && seen.size > 350, `kjenningssignalet er to bokstaver og fire siffer, aldri et ekte, og lagres på båten (${seen.size} ulike av 400)`, {shape, real, bad});
  t.ok(callOf({type:'sjark'}) === null && callOf({type:'skiff'}) === null && /^L/.test(callOf({type:'hurtigsjark'}) || ''), 'kjenningssignal fra 10,67 m (§ 5), ikke på havsjarken (10,57 m) og skiffen');
  const real0 = REGM.c.LK[0], b0 = {type:'kyst15', call:'LK' + real0};
  t.ok(callOf(b0) !== 'LK' + real0, 'et lagret signal som er ekte, byttes', [real0, b0.call]);

  // ---- the models: the old rescue boats out of your own hull, the places from the code ----
  // (the snow crab vessel has her own places since H3d1, 07.11.2026: no old rescue boat in her hull, nothing from KITADD)
  { const k = 'snokrabbe', g = glbHas(k) ? glbModel(k, 2, null, true).geo.kit || {} : {};
    t.ok(!MOBCUT[k] && !KITADD[k] && g.mob && g.mob.length >= 5 && g.buoys && g.buoys.length >= VESSELS[k].lsa.buoys && g.raft && g.raft.length >= VESSELS[k].lsa.rafts,
      `${k}: MOB-båten, ${VESSELS[k].lsa.buoys} bøyeholdere og flåtene på modellens egne plasser (krabbe50.py kit), ingenting fra KITADD eller MOBCUT`, {mob:g.mob, buoys:g.buoys && g.buoys.length, raft:g.raft && g.raft.length}); }
  for (const k of ['autoliner', 'bunntral', 'pelagisk']){
    if (!glbHas(k) || !glbHas('deck-mob')) { t.ok(false, k + ': modellen eller deck-mob mangler'); continue; }
    const P = glbPart(k, 'lod0'), own = glbModel(k, 2, null, true), other = glbModel(k, 2, null, false), cut = (P.p.length - own.o.p.length) / 9;
    // what went: none of it the deck (a big flat triangle facing up) or the hull's paint (zone 1)
    const G = glbLoad(k), Z = G.parts.lod0.zone, kept = new Set(); let deck = 0, hull = 0;
    { const o = mobCut(P, MOBCUT[k]); t.ok(o.p.length === own.o.p.length, k + ': mobCut gir det samme som modellen for egen båt'); }
    for (let v = 0; v * 3 + 9 <= P.p.length; v += 3){ const q = v * 3, inB = (i, B) => P.p[i] >= B[0] && P.p[i] <= B[1] && P.p[i + 1] >= B[2] && P.p[i + 1] <= B[3] && P.p[i + 2] >= B[4] && P.p[i + 2] <= B[5];
      if (!MOBCUT[k].some(B => inB(q, B) && inB(q + 3, B) && inB(q + 6, B))) continue;
      const ny = (P.n[q + 1] + P.n[q + 4] + P.n[q + 7]) / 3, ex = Math.max(P.p[q], P.p[q + 3], P.p[q + 6]) - Math.min(P.p[q], P.p[q + 3], P.p[q + 6]), ez = Math.max(P.p[q + 2], P.p[q + 5], P.p[q + 8]) - Math.min(P.p[q + 2], P.p[q + 5], P.p[q + 8]);
      // (a deck: facing up at the box's floor, the deck's height; the old boat's lid faces up too, higher)
      const B0 = MOBCUT[k].find(B => inB(q, B)), low = Math.max(P.p[q + 1], P.p[q + 4], P.p[q + 7]) < B0[2] + 0.05;
      if (ny > 0.9 && low && ex * ez > 0.05) deck++; if (Z && Z[v] === 1) hull++; }
    t.ok(cut >= 20 && cut < 400 && !deck && !hull && other.o.p.length === P.p.length, `${k}: den gamle MOB-båten (${cut} trekanter) er tatt ut av egen båt, ikke dekket (${deck}) eller skroget (${hull}), og andres båter har den (${other.o.p.length === P.p.length})`);
    const g = own.geo.kit || {};
    t.ok(g.mob && g.mob.length >= 5 && g.buoys && g.buoys.length >= VESSELS[k].lsa.buoys, `${k}: plassen til MOB-båten og ${VESSELS[k].lsa.buoys} bøyeholdere fra koden (KITADD)`, g.buoys && g.buoys.length);
  }
  // the ladder aft (§ 63) on every boat under 15 m: from the model where it meets it (snekke), else from the code, with a rung at least
  // 0.30 m under the waterline and the stiles up over the place where one comes aboard
  for (const k of small){   // (not the bare boats: above)
    const lad = (KITADD[k] || {}).ladder;
    if (!lad){ t.ok(k === 'snekke', k + ': leideren i modellen holder § 63 (plastsnekka: nederste trinn 0,32 m under vannlinja)'); continue; }
    const low = Math.min(...lad.flatMap(q => q.r || [])), top = Math.max(...lad.flatMap(q => q.c.map(p => p[1])));
    // (an extension under the model's own ladder, ext: the model has the stiles up over the transom's top already)
    t.ok(low <= -0.3 && (top > 0.5 || lad.every(q => q.ext)), `${k}: leideren akter når ${(-low).toFixed(2)} m under vannlinja (§ 63: minst 0,30), med håndrekke ${lad.every(q => q.ext) ? 'i modellen' : 'til ' + top.toFixed(2) + ' m'}`);
  }

  // ---- the life jacket on the people (Ø11.4's parts in worker.b64) ----
  if (glbHas('worker')){
    const X = glbLoad('worker').ex || {}, tops = ['jacket', 'sweater', 'oilskin', 'parka', 'fleece'], miss = [];
    for (const b of ['m', 'f']) for (const tp of tops){ const l = Object.assign(lookDefault(), {b, tp, ht:'none', hs:'long'}), V = wkKitOf(Object.assign({}, l, {v:1})), N = lookKit(l);
      if (!V.vest || !wkPart(V.vest, V) || V.key === N.key || V.hairP !== 'hair_bun') miss.push(b + ':' + tp + ':' + V.vest + ':' + V.hairP); }
    t.ok(!miss.length && X.vest && X.vestHair, 'vesten finnes til hver jakke på begge kroppene, langt hår settes opp i knute under den, og utseendet med vest er et eget sett', miss);
    const sw = wkKitOf(Object.assign(lookDefault(), {hs:'pony', ht:'bucket', v:1}));
    t.ok(sw.hairP === 'hair_mid_h', 'under sydvest blir knuten midlang som før', sw.hairP);
  } else t.ok(false, 'worker.b64 mangler');
}
