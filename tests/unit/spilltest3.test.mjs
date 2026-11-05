// What spilltest 3 (docs/playtest/rapport-3-redskap.md, 05.11.2026) found and was put right in the core: the reason when no hauler fits
// the boat (F3, the same in the Rig tab and the shop), the part-timer ashore today (F7), one name for each kind of net (U9), the pots in
// the singular (F6) and the plant managers along the coast (F6).
export default function (t){
  const K = t.K, S = K.newState(); K.set('S', S);
  // F3: the start boat (7,0 m) cannot take the net hauler (7,5 m): the shop's gate says the Rig tab's words, and there is no room for nets
  S.boat.type = 'trebat'; K.applyVessel();
  const nf = K.haulerNoFit('garn');
  t.ok(nf && /passer ikke om bord/.test(nf[0]) && /7,5 m/.test(nf[0]), 'trebåten: garnhaleren passer ikke, med lengden den krever: ' + (nf && nf[0]));
  t.eq(K.buyGate('net', '180')[0], nf[0], 'butikken sier det samme som Rigg-fanen om garn på trebåten');
  t.eq(K.gearRoom('garn'), 0, 'ingen plass til garn der ingen garnhaler passer');
  t.eq(K.rigBlock('garn')[0], nf[0], 'Rigg-fanen bruker samme grunn');
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
}
