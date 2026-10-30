// Bestilt til henting (M2, core/10c-pick.js): reserving at a tackle shop, joining the same thing, the limit, the price and the name
// of each kind, and that nothing is paid or given when a thing is reserved.
export default function (t){
  const {newState, pickAdd, pickDrop, pickAt, pickKr, pickName, pickState, PICK, PORTS, portServices, EQUIP, PRICE, NETTY, LINE_KINDS, GPRICE, CARE} = t.K;
  const S = newState(); t.K.set('S', S);
  const shop = PORTS.find(p => portServices(p).butikk), plant = PORTS.find(p => portServices(p).mottak && !portServices(p).butikk);
  t.ok(shop && plant, 'det finnes en utstyrsbutikk (' + (shop && shop.id) + ') og et mottak uten butikk (' + (plant && plant.id) + ')');
  const cash = S.cash;
  t.eq(pickAdd(shop.id, 'equip', 'linehaler'), null, 'en linehaler reserveres i butikken');
  t.eq(S.cash, cash, 'ingenting er betalt ved reservasjonen');
  t.ok(!S.equip || !S.equip.linehaler, 'og ingenting er gitt');
  t.ok(Array.isArray(pickAdd(shop.id, 'equip', 'linehaler')), 'samme utstyr kan ikke reserveres to ganger i samme butikk');
  t.ok(Array.isArray(pickAdd(plant.id, 'equip', 'vhf')), 'et mottak uten butikk tar ingen reservasjon');
  t.eq(pickAdd(shop.id, 'net', null, '180', 10), null, '10 garn på 180 mm reserveres');
  t.eq(pickAdd(shop.id, 'net', null, '180', 5), null, 'og 5 til');
  const net = pickAt(shop.id).find(o => o.w === 'net');
  t.eq(net.n, 15, 'samme garn i samme butikk slås sammen til 15');
  t.eq(pickKr(net), 15 * NETTY.bunn.price, 'prisen er 15 torskegarn');
  t.eq(pickName(net)[0], '15 torskegarn 180 mm', 'navnet sier antall, slag og maskevidde');
  t.eq(pickKr({w:'equip', k:'linehaler'}), EQUIP.linehaler.price, 'linehaleren koster som i butikken');
  t.eq(pickKr({w:'shop', k:'jig'}), PRICE.gear, 'håndjuksa koster som i butikken');
  t.eq(pickKr({w:'stamp', s:'bank', n:4}), 4 * LINE_KINDS.bank.price, '4 stamper bankline');
  t.eq(pickKr({w:'kit', n:2}), 2 * GPRICE.kit, '2 blåsesett');
  t.eq(pickKr({w:'hooks', s:500}), CARE.hookKr[500], '500 kroker');
  t.eq(pickKr({w:'cloth', k:'varme'}) > 0, true, 'varmedressen har en pris');
  t.eq(pickName({w:'stamp', s:'hyse', n:1})[0], '1 stamp hyseline', 'én stamp i entall');
  for (let i = pickState().length; i < PICK.max; i++) pickAdd(shop.id, 'cloth', ['olje', 'varme'][i % 2] + i);
  t.eq(pickState().length, PICK.max, 'lista er full ved ' + PICK.max);
  t.ok(Array.isArray(pickAdd(shop.id, 'equip', 'vhf')), 'den ' + (PICK.max + 1) + '. reservasjonen avvises');
  const id = pickState()[0].id;
  t.ok(pickDrop(id), 'en reservasjon kan avbestilles');
  t.ok(!pickDrop(id), 'og bare én gang');
  t.eq(pickState().length, PICK.max - 1, 'så er det plass til én til');
}
