// The rules of the road (Ø11.1, core/05e-sjovei.js; sjøveisreglene FOR-1975-12-01-5, rules 3, 9, 13-18): the class of a vessel, the
// situation between two with who gives way, the CPA and the time to it, the boundaries of the sectors, the order of the rules, and the
// manoeuvre laid over the shared course (it is continuous in time and goes back to nothing).
export default function (t){
  const K = t.K; K.set('S', K.newState());
  const R = Math.PI / 180, NM = K.NM;
  // a vessel at (x, y) km heading hd degrees (grid, 0 north, y south) at v knots
  const V = (x, y, hd, v, o = {}) => Object.assign({p:{x, y}, hd:hd * R, cog:hd * R, v, cls:'pow', L:10}, o);
  // where she is after m minutes at v knots on hd, from (x, y): for meeting points
  const at = (x, y, hd, v, m) => ({x:x + Math.sin(hd * R) * v * NM * m / 60, y:y - Math.cos(hd * R) * v * NM * m / 60});

  // ---- rule 15: crossing. a north, b from her starboard going west, both reaching (0, 0) in 4 minutes at 10 knots ----
  const d4 = 10 * NM * 4 / 60;
  let s = K.colregSit(V(0, d4, 0, 10), V(d4, 0, 270, 10));
  t.eq([s.sit, s.give], ['15', 'a'], 'regel 15: den andre fra styrbord, du viker');
  t.near(s.tcpa, 4, 0.01, 'TCPA i spillminutter'); t.near(s.cpa, 0, 1, 'CPA 0 m når begge når samme punkt samtidig');
  t.near(s.rng, d4 * Math.SQRT2 * 1000, 1, 'avstanden i meter'); t.ok(s.risk, 'fare for sammenstøt (CPA under grensa, TCPA foran)');
  s = K.colregSit(V(0, d4, 0, 10), V(-d4, 0, 90, 10));
  t.eq([s.sit, s.give], ['15', 'b'], 'regel 15: den andre fra babord, hun viker og du holder kurs og fart');
  // the same from the other one's side
  s = K.colregSit(V(d4, 0, 270, 10), V(0, d4, 0, 10));
  t.eq([s.sit, s.give], ['15', 'b'], 'regel 15 sett fra den andre: den med deg om styrbord viker');

  // ---- rule 14: head-on, and the 12 degree sector (14 b «nesten forut», 14 c in doubt) ----
  s = K.colregSit(V(0, 1, 0, 10), V(0, 0, 180, 10));
  t.eq([s.sit, s.give], ['14', 'both'], 'regel 14: motsatte kurser, begge viker til styrbord'); t.near(s.tcpa, 60 / (20 * NM), 0.01, 'TCPA møtende');
  s = K.colregSit(V(0, 1, 0, 10), V(Math.tan(10 * R) * 1, 0, 180, 10));
  t.eq(s.sit, '14', 'regel 14: den andre 10° om styrbord for baugen, nesten forut');
  s = K.colregSit(V(0, 1, 0, 10), V(Math.tan(20 * R) * 1, 0, 190, 10));
  t.eq([s.sit, s.give], ['15', 'a'], 'utenfor 12°: kryssende fra styrbord, ikke møtende');

  // ---- rule 13: overtaking, more than 22.5 degrees abaft the beam, first of all (13 a) ----
  s = K.colregSit(V(0, 0.5, 0, 12), V(0, 0, 0, 6));
  t.eq([s.sit, s.give], ['13a', 'a'], 'regel 13: du innhenter rett aktenfra, du holder klar');
  s = K.colregSit(V(0, 0, 0, 6), V(0, 0.5, 0, 12));
  t.eq([s.sit, s.give], ['13b', 'b'], 'regel 13: du blir innhentet, den andre holder klar');
  // the boundary: 22.5 degrees abaft the beam is 112.5 degrees from the bow
  const ab = (deg, va, vb) => { const q = {x:Math.sin(deg * R) * 0.6, y:-Math.cos(deg * R) * 0.6}; return K.colregSit(V(q.x, q.y, 0, va), V(0, 0, 0, vb)); };
  t.eq(ab(-115, 14, 6).sit, '13a', 'regel 13 b: 115° fra baugen til den andre (mer enn 22,5° aktenfor tvers) er innhenting');
  t.ok(ab(-105, 14, 6).sit !== '13a', 'regel 13 b: 105° fra baugen (forenfor grensa) er ikke innhenting');
  // 13 a before the rank of 18: overtaking a vessel engaged in fishing, you keep clear; a fishing vessel overtaking you keeps clear too
  s = K.colregSit(V(0, 0, 0, 3, {cls:'fish'}), V(0, 0.4, 0, 9));
  t.eq([s.sit, s.give], ['13b', 'b'], 'regel 13 foran 18: den som innhenter et fiskefartøy, holder klar');
  s = K.colregSit(V(0, 0.4, 0, 9, {cls:'fish'}), V(0, 0, 0, 3));
  t.eq([s.sit, s.give], ['13a', 'a'], 'regel 13 foran 18: et fiskefartøy som innhenter, holder klar');
  // 13 d: once overtaking, the change of bearing does not make it crossing (prev kept by the caller)
  s = K.colregSit(V(0.3, 0.05, 0, 12), V(0, 0, 0, 6), {prev:'13a'});
  t.eq(s.sit, '13a', 'regel 13 d: senere peilingsendring gjør det ikke til kryssende');

  // ---- rule 18: the rank ----
  s = K.colregSit(V(0, d4, 0, 10), V(-d4, 0, 90, 4, {cls:'fish'}));
  t.eq([s.sit, s.give], ['18', 'a'], 'regel 18 a iii: maskindrevet viker for fartøy som fisker, også fra babord');
  s = K.colregSit(V(0, d4, 0, 4, {cls:'fish'}), V(d4, 0, 270, 10));
  t.eq([s.sit, s.give], ['18', 'b'], 'regel 18 a: du fisker, den maskindrevne viker selv om du har den om styrbord');
  s = K.colregSit(V(0, d4, 0, 4, {cls:'fish'}), V(-d4, 0, 90, 2, {cls:'nuc'}));
  t.eq([s.sit, s.give], ['18', 'a'], 'regel 18 c: den som fisker, viker for den som ikke er under kommando');
  s = K.colregSit(V(0, d4, 0, 3, {cls:'fish'}), V(d4, 0, 270, 3, {cls:'fish'}));
  t.eq([s.sit, s.give], ['18c', 'both'], 'to som fisker: begge holder klar så godt de kan');
  s = K.colregSit(V(0, d4, 0, 2, {cls:'nuc'}), V(d4, 0, 270, 2, {cls:'ram'}));
  t.eq(s.give, 'none', 'ikke under kommando mot begrenset manøvreringsevne: ingen kan vike');
  s = K.colregSit(V(0, d4, 0, 10), V(d4, 0, 270, 10, {cls:'cbd', L:120}));
  t.eq([s.sit, s.give], ['18d', 'a'], 'regel 18 d: unngå å hindre den som er hemmet av dypgående');
  s = K.colregSit(V(0, d4, 0, 2, {cls:'nuc'}), V(d4, 0, 270, 10, {cls:'cbd', L:120}));
  t.eq(s.give, 'b', 'regel 18 d gjelder ikke den som ikke er under kommando: den dyptgående viker');

  // ---- rule 9 b-c: the narrow channel ----
  s = K.colregSit(V(-d4, 0, 90, 8), V(0, -d4, 180, 15, {L:122}), {narrowB:true});
  t.eq([s.sit, s.give], ['9a', 'a'], 'regel 9 b: under 20 m skal ikke hindre den som bare kan gå i leia, selv om den kommer fra babord');
  s = K.colregSit(V(-d4, 0, 90, 8, {L:24}), V(0, -d4, 180, 15, {L:122}), {narrowB:true});
  t.eq([s.sit, s.give], ['15', 'b'], 'regel 9 b gjelder ikke fra 20 m: da er det regel 15');
  s = K.colregSit(V(-d4, 0, 90, 3, {L:24, cls:'fish'}), V(0, d4, 0, 15, {L:122}), {narrowB:true});
  t.eq([s.sit, s.give], ['9a', 'a'], 'regel 9 c: den som fisker, skal ikke hindre gjennomfarten i leia (foran 18)');
  s = K.colregSit(V(0, 0.5, 0, 14), V(0, 0, 0, 8, {L:122}), {narrowB:true});
  t.eq(s.sit, '13a', 'regel 13 foran 9: innhenting i leia er fortsatt innhenting');

  // ---- rule 2 b: one lying still or drifting under a knot ----
  s = K.colregSit(V(0, d4, 0, 10), V(d4 / 4, 0, 90, 0.5));
  t.eq([s.sit, s.give], ['2', 'a'], 'den som ligger stille (under 1 kn), kan ikke vike: den som går, holder klar');
  s = K.colregSit(V(0, 0, 0, 0.3), V(0.02, 0.02, 90, 0.4));
  t.ok(!s.risk && s.give === 'none', 'to som ligger stille: ingen fare og ingen varsler');

  // ---- the CPA and its limit ----
  s = K.colregSit(V(0, d4, 0, 10), V(d4, 0.3, 270, 10));
  t.near(s.cpa, 300 / Math.SQRT2, 2, 'CPA for kryssende kurser 300 m forskjøvet');
  t.ok(!s.risk, 'CPA 212 m over grensa på 120 m for to småbåter: ingen fare');
  s = K.colregSit(V(0, 1, 0, 10), V(0, -1, 0, 10));
  t.ok(s.tcpa === 0 && !s.risk, 'samme kurs og fart: ingen tilnærming (TCPA 0, ingen fare)');
  s = K.colregSit(V(0, 0, 0, 10), V(0, 1, 180, 10));
  t.ok(s.tcpa < 0 && !s.risk, 'etter passering: TCPA negativ og ingen fare');
  t.eq(K.colregLim(10, 10), 120, 'grensa for to småbåter er 120 m'); t.eq(K.colregLim(10, 122), 283, 'og for kystruteskipet 283 m'); t.eq(K.colregLim(10, 300), 400, 'høyst 400 m');

  // ---- the manoeuvre: the offset that opens the CPA, and the starboard side ----
  s = K.colregSit(V(0, d4, 0, 10), V(-d4, 0, 90, 10));   // b gives way (a is on her starboard side)
  const k = K.sjvNeed(s, 90 * R, 1, 180, 'b', 1);
  t.ok(k != null && k >= 0.15 && k <= 0.6, 'avviket som gir 180 m CPA ligger mellom 0,15 og 0,6 km: ' + k);
  const after = K.colregSit(V(0, d4, 0, 10), V(-d4 + Math.cos(90 * R) * k, Math.sin(90 * R) * k, 90, 10));
  t.ok(after.cpa >= 175, 'med avviket til styrbord er CPA minst 180 m: ' + Math.round(after.cpa));
  t.eq(K.sjvSide(s, 90 * R, 'b', 180, 1), 1, 'den vikepliktige i regel 15 svinger til styrbord');
  // the deviation over time: up, held, back, continuous
  const E = {slow:false, tgt:0.3, rate:4, t0:10, t1:null, side:1};
  t.near(K.sjvOffAt(E, 10), 0, 1e-9, 'avviket begynner på null'); t.near(K.sjvOffAt(E, 10.05), 0.2, 1e-9, 'og øker med svingens fart');
  t.eq(K.sjvPhase(E, 10.05), 1, 'svinger ut'); t.near(K.sjvOffAt(E, 10.2), 0.3, 1e-9, 'holder avviket'); t.eq(K.sjvPhase(E, 10.2), 0, 'og kursen parallelt');
  E.t1 = 10.3; t.near(K.sjvOffAt(E, 10.3), 0.3, 1e-9, 'tilbake: samme sted i det den snur (ingen hopp)');
  t.eq(K.sjvPhase(E, 10.31), -1, 'svinger tilbake'); t.near(K.sjvOffAt(E, 10.5), 0, 1e-9, 'og er på den felles banen igjen');
  const El = {slow:true, f:0.35, t0:10, t1:null};
  t.near(K.sjvLagAt(El, 10.1), 0.065, 1e-9, 'uten plass slakker hun av (8 e) og ligger etter'); El.t1 = 10.1;
  t.near(K.sjvLagAt(El, 10.1 + 0.065 / 0.3), 0, 1e-9, 'og tar det igjen etterpå');

  // ---- the classes (rule 3) and what the AIS says ----
  t.eq(K.colregCls({st:'fishing', coast:true}), 'pow', 'regel 3 d: jukse begrenser ikke manøvreringen');
  t.eq(K.colregCls({st:'fishing', coast:true, gear:true}), 'fish', 'regel 3 d: garn, line og teiner i sjøen gir «fartøy som holder på med å fiske»');
  t.eq(K.colregCls({st:'port'}), 'moor', 'fortøyd er ikke underveis (3 i)');
  t.eq(K.colregCls({type:'coastal', v:0}), 'moor', 'kystruteskipet ved kaia');
  t.eq(K.colregHav({g:'tral'}, {st:'fishing', trawl:true}), 'fish', 'tråleren som tråler, fisker');
  t.eq(K.colregHav({g:'not'}, {st:'fishing'}), 'pow', 'ringnotfartøyet som leter, har ingenting ute');
  t.eq(K.colregOwnCls({status:'engine'}), 'nuc', 'motorstopp: ikke under kommando (3 f)');
  t.eq(K.colregOwnCls({status:'fishing', gop:{op:'haul'}}), 'fish', 'du drar garn: du fisker');
  t.eq(K.colregOwnCls({status:'fishing'}), 'pow', 'du jukser: maskindrevet');
  t.eq(K.colregAisSt({st:'fishing', hav:'tral', cls:'fish'})[0], 'Driver fiske', 'AIS-status: driver fiske');
  t.eq(K.colregAisSt({st:'out', v:8, coast:true})[0], 'Underveis med motor', 'AIS-status: underveis med motor');
  t.eq(K.colregAisSt({st:'port', coast:true})[0], 'Fortøyd', 'AIS-status: fortøyd');

  // ---- the words ----
  const W = (o) => Object.assign({give:'a', sit:'15', cls:'pow', ownCls:'pow', name:'MS Kystpilen', auto:false, close:false}, o);
  t.eq(K.sjvSay(W({}), 'strip'), 'Kryssende fra styrbord: du viker', 'varselet i stripa');
  t.eq(K.sjvSay(W({}), 'tiny'), 'Fra styrbord: vik', 'og kort på telefonen');
  t.eq(K.sjvSay(W({auto:true}), 'strip'), 'Kryssende fra styrbord: Autonav viker', 'når Autonav viker for deg');
  t.eq(K.sjvSay(W({auto:true}), 'tiny'), 'Autonav viker', 'og kort i stripa');
  t.eq(K.sjvSay(W({give:'b'}), 'strip'), 'Kryssende fra babord: hold kurs og fart', 'når du skal holde kurs og fart');
  t.eq(K.sjvSay(W({give:'both', sit:'14'}), 'strip'), 'Møtende: begge viker til styrbord', 'møtende');
  t.eq(K.sjvSay(W({sit:'9a'}), 'strip'), 'Trang lei: gå av veien', 'trang lei');
  t.eq(K.sjvSay(W({sit:'18', cls:'fish'}), 'box'), 'Fiskefartøy: du viker · MS Kystpilen', 'i boksen med navnet');
  t.eq(K.sjvSay(W({give:'b', sit:'2', ownCls:'fish'}), 'strip'), 'Du fisker: den andre viker', 'du fisker og ligger stille');
  t.ok(K.sjvSay(W({}), 'tiny').length <= 22 && K.sjvSay(W({give:'b'}), 'tiny').length <= 22, 'de korte tekstene får plass i 47 vw');

  // ---- Ø11.2: the sight, rule 19, the lanterns and the sound signals ----
  // rule 22: the range a lantern must be seen at (nautical miles)
  t.eq([K.sjvLampNm('masthead', 10), K.sjvLampNm('masthead', 15), K.sjvLampNm('masthead', 21), K.sjvLampNm('masthead', 75)], [2, 3, 5, 6], 'regel 22: topplanterne 2, 3, 5 og 6 mil etter lengden');
  t.eq([K.sjvLampNm('side', 10), K.sjvLampNm('side', 15), K.sjvLampNm('side', 60)], [1, 2, 3], 'regel 22: sidelanterne 1, 2 og 3 mil');
  t.eq([K.sjvLampNm('stern', 10), K.sjvLampNm('allround', 30), K.sjvLampNm('fishR', 60), K.sjvLampNm('kv', 15)], [2, 2, 3, 2], 'regel 22: akter og rundtlysende 2 (3 fra 50 m); det blå lyset 2 mil (53 d)');
  // vedlegg I 8: at K 0.8 (about 13 miles' visibility) a lantern is seen as far as it is made for; in thick weather much shorter
  t.near(K.sjvLightNm(2, 13 * NM), 2, 0.06, 'vedlegg I 8: en lanterne for 2 mil ses 2 mil ved 13 mils sikt');
  t.near(K.sjvLightNm(5, 13 * NM), 5, 0.15, 'og en for 5 mil 5 mil');
  const l12 = K.sjvLightNm(2, 1.2), l37 = K.sjvLightNm(2, 3.7), l50 = K.sjvLightNm(2, 50);
  t.ok(l12 > 0.3 && l12 < 0.9 && l12 < l37 && l37 < 2 && l50 > 2, 'lanterna ses kortere i dårlig sikt, lenger i klart vær', [l12, l37, l50].map(x => +x.toFixed(2)));
  t.eq(K.sjvSeenKm(10, 1.2, false), 1.2, 'om dagen ses en båt så langt sikten er');
  t.near(K.sjvSeenKm(10, 1.2, true), l12 * NM, 1e-6, 'i mørket så langt lanternene hennes ses');
  // vedlegg III 1 c: how far the whistle is heard
  t.eq([K.sjvHearNm(10), K.sjvHearNm(49.9), K.sjvHearNm(121.8), K.sjvHearNm(250)], [0.5, 1, 1.5, 2], 'vedlegg III: hørevidde 0,5, 1, 1,5 og 2 mil etter lengden');
  // rule 35: the fog signals
  t.eq([K.sjvFogPat('pow', 8, 10), K.sjvFogPat('pow', 0, 10), K.sjvFogPat('fish', 0, 10), K.sjvFogPat('nuc', 2, 10), K.sjvFogPat('ram', 3, 20), K.sjvFogPat('anch', 0, 10), K.sjvFogPat('towed', 3, 10), K.sjvFogPat('moor', 0, 10)],
    ['L', 'LL', 'LSS', 'LSS', 'LSS', 'bell', 'LSSS', null], 'regel 35: ett langt med fart, to lange stoppet, langt og to korte (fisker, ikke under kommando, begrenset), klokke til ankers, langt og tre korte på slep, ingenting fortøyd');
  // rule 34 a: the manoeuvring signals
  t.eq([K.sjvManPat(1, false), K.sjvManPat(-1, false), K.sjvManPat(1, true)], ['S', 'SS', 'SSS'], 'regel 34 a: ett kort styrbord, to korte babord, tre korte akterover');
  // 19 d: the side in restricted visibility
  t.eq([K.sjvSide19(0.3, false), K.sjvSide19(-0.3, false), K.sjvSide19(-0.3, true), K.sjvSide19(2, false), K.sjvSide19(-2, false), K.sjvSide19(Math.PI / 2, false)], [1, 1, 0, -1, 1, -1],
    '19 d: forenom tvers til styrbord (fritt når du innhenter), tvers eller aktenfor bort fra den andre');
  // colregSit under rule 19: not in sight in restricted visibility both act; no overtaking (avsnitt II); one not under command leaves it
  s = K.colregSit(V(0, d4, 0, 10), V(d4, 0, 270, 10), {fog:true});
  t.eq([s.sit, s.give], ['19', 'both'], 'regel 19: kryssende i tåke uten sikt, begge tar forholdsregler');
  s = K.colregSit(V(0, 0.5, 0, 12), V(0, 0, 0, 6), {fog:true});
  t.eq([s.sit, s.give], ['19', 'both'], 'regel 19: innhenting i tåke er ikke regel 13 (avsnitt II gjelder i sikte)');
  t.eq(K.sjvSide(s, 0, 'a', 200, 1) !== 0, true, 'og den som innhenter, kan svinge til den siden som åpner mest');
  s = K.colregSit(V(0, d4, 0, 10, {cls:'nuc'}), V(d4, 0, 270, 10), {fog:true});
  t.eq([s.sit, s.give], ['19', 'b'], 'regel 19: du er ikke under kommando, den andre tar forholdsregler');
  s = K.colregSit(V(0, d4, 0, 0), V(d4, 0, 270, 10), {fog:true});
  t.eq(s.sit, '2', 'du ligger stille: den som går, holder klar også i tåke');
  s = K.colregSit(V(0, d4, 0, 10), V(d4, 0, 270, 10), {fog:true});
  t.eq(K.sjvSide(s, 270 * R, 'b', 200, 1), 1, '19 d i: den andre, som har deg forenom tvers om babord, svinger ikke til babord');
  // the lanterns by what she does (26 e: jigging is not fishing; 26 b trawl; the quay none; 53 d the coast guard)
  const LS = K.sjvLanternSt;
  t.ok(LS({cls:'fish', v:0}).fishing && !LS({cls:'pow', st:'fishing', v:0}).fishing, 'lanternene: garn, line og teiner i sjøen gir fiskelys, juksa gjør det ikke (26 e)');
  t.ok(LS({cls:'fish', trawl:true, v:3}).trawl && !LS({cls:'fish', v:3}).trawl, 'tråleren som sleper, viser grønt over hvitt (26 b)');
  t.ok(LS({cls:'moor'}).port && LS({cls:'anch'}).anch && LS({cls:'nuc', v:2}).nuc && LS({cls:'pow', kv:true, v:6}).kv && LS({cls:'pow', v:7.5}).v === 7.5, 'ved kaia ingen, til ankers ankerlys, ikke under kommando to røde, Kystvakta blått, og den virkelige farten');
  t.ok(K.sjvMinKn() >= 2 && K.sjvMinKn() <= 4, 'minste styrefart mellom 2 og 4 knop', K.sjvMinKn());
  // the words under rule 19
  const W19 = o => W(Object.assign({sit:'19', give:'both', R:{relA:0.3, relB:-0.5, closing:true}}, o));
  t.eq(K.sjvSay(W19({}), 'strip'), 'Nedsatt sikt: vik til styrbord', 'regel 19: forenom tvers, vik til styrbord');
  t.eq(K.sjvSay(W19({}), 'tiny'), 'Tåke: vik til SB', 'og kort i stripa');
  t.eq(K.sjvSay(W19({R:{relA:2, relB:-0.5, closing:true}}), 'strip'), 'Nedsatt sikt: vik til babord', '19 d ii: aktenfor tvers om styrbord, vik bort fra den');
  t.eq(K.sjvSay(W19({e19:true}), 'strip'), 'Tåkesignal forut: minste styrefart', '19 e: tåkesignal forut, minste styrefart');
  t.eq(K.sjvSay(W19({e19:true, pilot:true}), 'strip'), 'Tåkesignal forut: Autonav går sakte', '19 e med Autonav');
  t.eq(K.sjvSay(W19({auto:true}), 'box'), 'Nedsatt sikt: Autonav viker · MS Kystpilen', 'Autonav viker i tåke, i boksen med navnet');
  t.ok(['', 'e19', 'pilot', 'auto'].every(k => K.sjvSay(W19(k ? (k === 'pilot' ? {e19:true, pilot:true} : {[k]:true}) : {}), 'tiny').length <= 22), 'de korte tekstene i tåke får plass i 47 vw');

  // rule 35 over time (sjvFogSigs): each vessel within hearing sounds her signal on a beat of her own at least every two game minutes,
  // the boat you follow hers; out of hearing nothing; one heard forward of the beam and not in sight is kept for 19 e
  const SJ = K.SJV; SJ.sigLog.length = 0; SJ.sig.length = 0; SJ.fogT.clear(); SJ.heard.clear();
  const own = {p:{x:0, y:0}, hd:0, v:6, cls:'pow', L:10}, fl = [
    {id:'near', p:{x:0, y:-0.6}, cls:'pow', v:8, L:10},          // 600 m right ahead, a 10 m boat: heard (half a mile)
    {id:'far', p:{x:1.6, y:0}, cls:'pow', v:8, L:10},            // 1.6 km abeam, 10 m: not heard
    {id:'ship', p:{x:-2, y:0.5}, cls:'pow', v:15, L:121.8},      // the coastal ship 2.1 km off: heard (1.5 miles)
    {id:'anch', p:{x:0.3, y:0.3}, cls:'anch', v:0, L:15},        // at anchor: the bell
    {id:'quay', p:{x:0.2, y:0}, cls:'moor', v:0, L:20}];         // moored: nothing
  const run35 = (H) => { for (let k = 0; k < 130; k++) K.sjvFogSigs(H + k / 3600, fl, own, 1, 0.4, false); };
  K.sjvFogSigs(10, fl, own, 1, 0.4, false); const first = SJ.sigLog.length; run35(10 + 1 / 3600);
  const by = id => SJ.sigLog.filter(q => q.id === id).map(q => q.pat);
  t.eq(first, 0, 'regel 35: ingen signaler i det første øyeblikket (takten settes)');
  t.ok(by('near').length >= 1 && by('near').every(p => p === 'L') && by('ship').length >= 1 && by('_own').length >= 1 && by('_own').every(p => p === 'L'), 'regel 35: båten nær og kystruteskipet gir ett langt støt innen to minutter, og din egen båt også', {near:by('near'), ship:by('ship'), own:by('_own')});
  t.ok(by('far').length === 0 && by('quay').length === 0, 'utenfor hørevidden og ved kaia ingen signaler');
  t.ok(by('anch').length >= 2 && by('anch').every(p => p === 'bell'), 'til ankers klokka minst hvert minutt', by('anch'));
  t.ok(SJ.heard.has('near') && !SJ.heard.has('ship'), '19 e: tåkesignalet rett forut uten sikt huskes, skipet aktenfor tvers ikke');
}
