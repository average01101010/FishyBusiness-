// What spilltest 3 (docs/playtest/rapport-3-redskap.md, 05.11.2026) found and was put right in the core: the reason when no hauler fits
// the boat (F3, the same in the Rig tab and the shop), the part-timer ashore today (F7), one name for each kind of net (U9), the pots in
// the singular (F6) and the plant managers along the coast (F6).
export default function (t){
  const K = t.K, S = K.newState(); K.set('S', S);
  // F3: the start boat (7,0 m) cannot take the net hauler (7,5 m). Since OB1 (valg 21 B, Jonas 09.11.2026) she draws the nets by hand
  // instead, and the reason the shop and the Rig tab give in the same words is now the pots (no room for them, OB1)
  S.boat.type = 'trebat'; K.applyVessel();
  t.ok(!K.haulerNoFit('garn') && K.buyGate('net', '180') === null && K.gearRoom('garn') > 0 && K.rigBlock('garn') === null, 'trebåten: garn for hånd uten garnhaler (valg 21 B)');
  const nf = K.haulerNoFit('teine');
  t.ok(nf && /ikke plass til teiner/.test(nf[0]), 'trebåten: ingen plass til teiner: ' + (nf && nf[0]));
  t.eq((K.buyGate('pot') || [])[0], nf && nf[0], 'butikken sier det samme som Rigg-fanen om teiner på trebåten');
  t.eq(K.gearRoom('teine'), 0, 'ingen plass til teiner');
  t.eq((K.rigBlock('teiner') || [])[0], nf && nf[0], 'Rigg-fanen bruker samme grunn');
  t.ok(!K.haulerNoFit('line'), 'linehaleren passer trebåten');
  t.ok(/Elektronikk og haler/.test(K.rigBlock('line')[0]), 'uten linehaler viser Rigg-fanen til Butikk › Elektronikk og haler (F2)');
  S.boat.type = 'sjark'; K.applyVessel();
  t.ok(!K.haulerNoFit('garn') && /garnhaler/.test(K.buyGate('net', '180')[0]), 'sjarken: garnhaleren passer, men må kjøpes først');
  // F7: a part-timer on a day off is named, with the days
  const wd = (K.gDate(S.t / 60).getUTCDay() + 6) % 7, days = [0, 0, 0, 0, 0, 0, 0]; for (const i of [4, 5, 6]) days[i] = i === wd ? 0 : 1;
  S.crew = [{name:'Kari Strand', bi:true, biDays:days, attr:{erf:2, styrke:2}, gear:{juksa:1}, traits:[]}];
  const off = K.crewBiOff(); t.ok(days[wd] === 0 && /Kari Strand er bare med/.test(off) && /på land i dag/.test(off), 'biyrke på en fridag: ' + off);
  t.eq(K.biDaysTxt({biDays:[0, 0, 0, 0, 1, 1, 1]}), 'fredag–søndag', 'tre dager på rad blir «fredag–søndag»');
  t.eq(K.biDaysTxt({biDays:[1, 0, 1, 0, 0, 0, 0]}), 'mandag og onsdag', 'to dager blir «mandag og onsdag»');
  S.crew = [];
  t.eq(K.crewBiOff(), '', 'uten mannskap på biyrke sier meldingen ingenting mer');
  // U9 and F6: the names
  t.eq(K.netN({mesh:180}, 10)[0], '10 torskegarn 180 mm', 'torskegarnet heter det samme overalt');
  t.eq(K.netN({mesh:360, ty:'kveite'}, 10)[0], '10 blåkveitegarn 360 mm', 'blåkveitegarnet med antall');
  t.eq(K.netN({mesh:156, ty:'flyt'}, 1)[1], '1 floating net 156 mm', 'flytegarnet i entall på engelsk');
  t.eq(K.potsN(1), '1 krabbeteine', 'én krabbeteine i entall'); t.eq(K.potsN(18), '18 krabbeteiner', 'flere i flertall');
  const pl = K.PORTS.filter(p => p.mottak).sort((a, c) => c.xy[1] - a.xy[1]);
  let same = 0; for (let i = 1; i < pl.length; i++) if (K.folkPlantName(pl[i].id) === K.folkPlantName(pl[i - 1].id)) same++;
  t.eq(same, 0, 'nabomottakene langs kysten har ulike sjefer (' + pl.length + ' mottak)');
  // U2 (V2 B): the nearest of her own buoys, and the limits she lies by
  S.sets = [{id:'g1', vid:S.cur, kind:'garn', n:10, a:{x:10, y:10}, b:{x:10.3, y:10}}, {id:'g2', vid:S.cur, kind:'line', n:4, a:{x:20, y:20}, b:{x:21, y:20}}, {id:'g3', vid:S.cur, lost:true, kind:'garn', n:5, a:{x:10.5, y:10}, b:{x:10.6, y:10}}];
  const nb = K.gearBuoyNear({x:10.5, y:10.1});
  t.ok(nb && nb.s.id === 'g1' && Math.abs(nb.d - Math.hypot(0.2, 0.1)) < 1e-9, 'nærmeste blåse er enden av garnlenka, ikke den tapte: ' + (nb && nb.s.id));
  t.ok(K.GEARLIE.back < K.GEARLIE.r && K.GEARLIE.r < K.GEARLIE.alarm && Math.abs(K.GEARLIE.r - 0.5 * K.NM) < 1e-9 && Math.abs(K.GEARLIE.alarm - K.NM) < 1e-9, 'båten holdes innen 0,5 nm, kjøres opp til 0,25 nm, alarmen går ved 1 nm');
  S.sets = []; t.eq(K.gearBuoyNear({x:0, y:0}), null, 'uten redskap i sjøen er det ingen blåse');
}
