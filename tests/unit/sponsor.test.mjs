// Sponsorer (M6, core/09l-sponsor.js): only what the list says, cleaned; an unsafe link is dropped; the link out is marked; a sponsored item
// has the same numbers as the generic one (the EQUIP item is not touched).
export default function (t){
  const K = t.K, {spSet, spOf, spSponsors, spUrl, SP_TEST, EQUIP, newState, mktBrokerListings, mktListings, portById, portServices, VESSELS} = K;
  K.set('S', newState());
  t.eq(spOf('item', 'garnhaler'), null, 'uten avtale er det ingen sponsor');
  const price = EQUIP.garnhaler.price, eq0 = JSON.stringify(EQUIP.garnhaler);
  t.eq(spSet(SP_TEST), SP_TEST.length, 'testsponsoren gir alle plasseringene (' + SP_TEST.length + ')');
  t.eq(spOf('sign', 'all').sponsor.name, 'Nordlys Utstyr', 'skiltet gjelder alle butikkene');
  t.eq(spOf('item', 'garnhaler').sponsor.name, 'Nordlys Utstyr', 'garnhaleren har testsponsoren');
  t.eq(JSON.stringify(EQUIP.garnhaler), eq0, 'og utstyret er det samme (pris ' + price + ')');
  t.eq(spSponsors().length, 2, 'to sponsorer: utstyret og megleren');
  { const B = mktBrokerListings(100); t.eq(B.length, 1, 'meglerens båt kommer i markedet');
    t.ok(B[0].broker.name === 'Nordlys Båtmegling' && B[0].type === 'sjark' && portServices(portById(B[0].port)).verft, 'som nærmeste båttype, ved et verft, merket med megleren');
    t.ok(/fra=detstorebla/.test(B[0].broker.url), 'med lenken til den ekte båten, merket');
    t.ok(mktListings(100).some(x => x.id === B[0].id), 'og står i lista sammen med de andre'); }
  t.eq(spSet([{id:1, kind:'item', target:'vhf', data:{}, sponsor:{id:1, name:'X', site:'javascript:alert(1)', logo:'http://x/y.png'}}, {id:2, kind:'reklame', target:'x', sponsor:{name:'Y'}}, {id:3, kind:'item', target:'ais', sponsor:{name:''}}]), 1, 'en ukjent plassering og en sponsor uten navn tas ikke med');
  t.eq(spOf('item', 'vhf').sponsor.site, null, 'en lenke som ikke er https, fjernes');
  t.eq(spOf('item', 'vhf').sponsor.logo, null, 'og en logo som ikke er https');
  t.eq(spUrl('https://example.org/side?a=1'), 'https://example.org/side?a=1&fra=detstorebla', 'lenken ut sier hvor den kom fra');
  t.eq(spUrl('http://example.org'), null, 'og bare til https');
  t.eq(spSet(null), 0, 'en tom liste fjerner alt');
}
