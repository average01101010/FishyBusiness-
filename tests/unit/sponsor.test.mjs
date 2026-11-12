// Sponsorer (M6, core/09l-sponsor.js): only what the list says, cleaned; an unsafe link is dropped; the link out is marked; a sponsored item
// has the same numbers as the generic one (the EQUIP item is not touched).
export default function (t){
  const K = t.K, {spSet, spOf, spSponsors, spUrl, SP_TEST, EQUIP, newState} = K;
  K.set('S', newState());
  t.eq(spOf('item', 'garnhaler'), null, 'uten avtale er det ingen sponsor');
  const price = EQUIP.garnhaler.price, eq0 = JSON.stringify(EQUIP.garnhaler);
  t.eq(spSet(SP_TEST), SP_TEST.length, 'testsponsoren gir alle plasseringene (' + SP_TEST.length + ')');
  t.eq(spOf('sign', 'all').sponsor.name, 'Nordlys Utstyr', 'skiltet gjelder alle butikkene');
  t.eq(spOf('item', 'garnhaler').sponsor.name, 'Nordlys Utstyr', 'garnhaleren har testsponsoren');
  t.eq(JSON.stringify(EQUIP.garnhaler), eq0, 'og utstyret er det samme (pris ' + price + ')');
  t.eq(spSponsors().length, 2, 'to sponsorer: utstyret og megleren');
  // the partner broker's boats (M8, F6) are no longer put among the players' at Kystmegleren (B5, Jonas 07.11.2026: «utelukkende være
  // båter andre brukere selger»); the placement is still read from the list, for the day a page of its own is wanted
  t.ok(K.SPN.list.some(r => r.kind === 'broker' && r.sponsor.name === 'Nordlys Båtmegling'), 'meglerens plassering står i lista, men blandes ikke med spillernes båter (B5)');
  t.eq(spSet([{id:1, kind:'item', target:'vhf', data:{}, sponsor:{id:1, name:'X', site:'javascript:alert(1)', logo:'http://x/y.png'}}, {id:2, kind:'reklame', target:'x', sponsor:{name:'Y'}}, {id:3, kind:'item', target:'ais', sponsor:{name:''}}]), 1, 'en ukjent plassering og en sponsor uten navn tas ikke med');
  t.eq(spOf('item', 'vhf').sponsor.site, null, 'en lenke som ikke er https, fjernes');
  t.eq(spOf('item', 'vhf').sponsor.logo, null, 'og en logo som ikke er https');
  t.eq(spUrl('https://example.org/side?a=1'), 'https://example.org/side?a=1&fra=detstorebla', 'lenken ut sier hvor den kom fra');
  t.eq(spUrl('http://example.org'), null, 'og bare til https');
  // a partner's paint design (steg 44): look on paint, worn as b.liv.sp over the boat's own paint, only the paint shop's own colours
  const {spPaints, spPaintOf, spPaintLiv, spWorn, spPaintIn, spPaintLogo} = K;
  spSet(SP_TEST);
  t.eq(spPaints().length, 1, 'testsponsoren har ett malingsdesign'); t.eq(spOf('look', 'top').data.tp, 'oilskin', 'og jakka i Garderoben er en annen plassering');
  t.eq(spWorn({hull:'rod', sp:-9}).id, -9, 'et design båten har på, finnes mens avtalen er aktiv'); t.eq(spWorn({hull:'rod'}), null, 'ingen uten sp'); t.eq(spWorn({sp:-5}), null, 'en annen plassering er ikke et malingsdesign');
  t.eq(spPaintOf(null), null, 'uten nummer: ingen'); t.eq(spPaintOf(''), null, 'tomt nummer: ingen'); t.eq(spPaintOf('-9').id, -9, 'nummeret som tekst (fra knappen)');
  t.eq(spPaintIn('h:rod;m:T.1.LK;x:-9').id, -9, 'de andres kode: x:-9'); t.eq(spPaintIn('h:rod;x:-99'), null, 'et ukjent nummer gir ingenting'); t.eq(spPaintIn('h:rod;xx:-9'), null, 'og bare nøkkelen x');
  t.eq(spPaintLogo(spPaintOf(-9)).kind, 'g', 'uten logo_url: det lagde merket');
  // (the colours themselves are checked against the paint shop's palette in tests/sponsor2test.py: the palette is vessel3d.js', not the core's)
  spSet([{id:6, kind:'look', target:'paint', data:{name:'X', hull:'#ff00ff'}, sponsor:{name:'X'}}]); t.eq(spPaints().length, 0, 'et design uten en eneste farge er ikke et design'); t.eq(spWorn({sp:6}), null, 'og kan ikke stå på en båt');
  t.eq(spSet([]), 0, 'avtalen slutter'); t.eq(spWorn({hull:'rod', sp:-9}), null, 'og designet er borte fra båten');
  t.eq(spSet(null), 0, 'en tom liste fjerner alt');
}
