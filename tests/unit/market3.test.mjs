// Kvotemarkedet, the settlement in the save (KM3, core/09k-market.js mbApply and mbKm): the ledger rows for rights and structure quotas
// (lk right or struct) looked at before the boats' logic. The buyer: the bid binds the money, the right is put on the boat he chose
// when he bid or structured onto it, a right that can no longer go there becomes a free right, a structure quota no boat can take
// is held (not marked done) until he chooses one that can. The seller: paid is the price less 5 % and the right leaves the boat, which
// stays in the fleet (a paid for a right never drops the boat with the same id), back takes the lock off. And the seller's keys.
export default function (t){
  const K = t.K, {newState, ensureFleet, newVesselObj, vget, HJ, STRUCT, licExtra, yearH, mbApply, mbSale, mktState, kmState, kmKey, kmSrcOf, kmFreeKey, kmPutWhy, kmLock, kmUnlock, kmPack, kmApply, kmFreeList,
    PORTS, portServices, depart, withVessel} = K, WORLD_SEED = K.get('WORLD_SEED');
  const S = newState(); S.qseed = WORLD_SEED; K.set('S', S); ensureFleet(); S.me = S.cur; S.cash = 5e7; S.boat.status = 'port'; S.fm = {n:0, last:-1, kr:0, b:true};
  const port = PORTS.find(p => portServices(p).verft).id, H = S.t / 60, y = yearH(H);
  const boat = (type, lic, name) => { const v = newVesselObj(type, port, lic || null); vget(v, 'boat').status = 'port'; if (name) v.boatName = name; return v; };
  const Lc = (id, extra) => { const l = Object.assign({id, hl:HJ[id].hl, since:y - 3, landY:y}, extra || {}); licExtra(l); return l; };
  const until = new Date(Date.now() + 6 * 3600e3).toISOString();

  // ---- the keys: the boat's id for her right; the boat, the quota length and the first year for a structure quota (never the index)
  const A = boat('kyst15', Lc('h14', {st:[{id:'h14', kf:4.7, from:y - 5, until:y + 15}, {id:'h14', kf:4.6, from:y - 2, until:y + 18}]}), 'Selgeren');
  t.eq(kmKey({v:A, kind:'right'}), A.id, 'nøkkelen for hjemmelen er båtens id');
  const k1 = kmKey({v:A, kind:'struct', i:1});
  t.ok(k1 === A.id + '/h14.' + (y - 2) && k1.length <= 16, 'nøkkelen for en strukturkvote er båten, hjemmelslengden og første år, høyst 16 tegn', k1);
  vget(A, 'lic').st.shift(); licExtra(vget(A, 'lic'));
  t.eq(kmSrcOf(k1).i, 0, 'og den peker på samme kvote etter at en annen har gått ut (indeksen flyttet seg)');
  t.ok(kmSrcOf(A.id).kind === 'right' && kmSrcOf('v999') === null && kmSrcOf(A.id + '/h14.1999') === null, 'en nøkkel uten vare gir ingenting');

  // ---- the seller: the lock, back, paid
  A.hold = [{sp:'torsk', kg:300}]; t.eq(kmPutWhy({v:A, kind:'right'}), 'hold', 'med fangst i rommet kan hjemmelen ikke legges ut (det som er landet på den, skal stå fast)'); A.hold = [];
  t.eq(kmPutWhy({v:A, kind:'right'}), null, 'med tomt rom, i havn og uten plan kan den legges ut');
  const c0 = S.cash, item = kmPack({v:A, kind:'right'});
  kmLock({v:A, kind:'right'}, {id:71, until}, {start:5e6, buynow:null, hours:6, value:9e6, item});
  t.ok(mbSale(A) && mbSale(A).km === 'right' && kmState().out[A.id].lid === 71, 'lagt ut: båten er låst (b.sale.km), og oppføringen huskes');
  t.eq(kmPutWhy({v:A, kind:'right'}), 'listed', 'det som ligger ute, kan ikke legges ut en gang til');
  t.eq(kmPutWhy({v:A, kind:'struct', i:0}), 'listed', 'heller ikke en strukturkvote på samme båt');
  t.eq(withVessel(A, () => { S.plan = {wps:[{x:0, y:0}], idx:0}; return depart(); }), false, 'og båten går ikke ut mens hjemmelen ligger ute');
  let ids = mbApply([{id:101, kind:'back', listing:71, kr:0, lk:'right', data:{vid:A.id, why:'unsold', name:'Hjemmel 14–14,9 m'}}]);
  t.ok(ids.join() === '101' && !mbSale(A) && !kmState().out[A.id] && vget(A, 'lic') && S.fleet.includes(A), 'usolgt: låsen er av, hjemmelen og båten er der', ids);
  kmLock({v:A, kind:'right'}, {id:72, until}, {start:5e6, buynow:null, hours:6, value:9e6, item});
  const n0 = S.fleet.length;
  ids = mbApply([{id:102, kind:'paid', listing:72, kr:5700000, lk:'right', data:{vid:A.id, price:6000000, comm:300000, name:'Hjemmel 14–14,9 m', item}}]);
  t.ok(S.fleet.length === n0 && S.fleet.includes(A), 'solgt hjemmel: båten med samme id blir i rederiet (aldri solgt som båt)');
  t.ok(!vget(A, 'lic') && !mbSale(A) && !kmState().out[A.id], 'hjemmelen er ute av båten, og låsen er av');
  t.eq(Math.round(S.cash - c0), 5700000, 'selgeren får prisen minus 5 %');
  mbApply([{id:102, kind:'paid', listing:72, kr:5700000, lk:'right', data:{vid:A.id, price:6000000, name:'Hjemmel 14–14,9 m', item}}]);
  t.eq(Math.round(S.cash - c0), 5700000, 'og en rad som kommer igjen, regnes ikke to ganger');
  // a paid for a boat (lk boat, or none from an old server) still sells the boat
  const Bt = boat('sjark', null, 'Havbris'); K.mbLock(Bt, {id:73, until}, {start:5e5, buynow:null, hours:6, value:8e5}, PORTS.find(p => p.id === port));
  mbApply([{id:103, kind:'paid', listing:73, kr:570000, lk:'boat', data:{vid:Bt.id, price:600000, name:'Havbris'}}]);
  t.ok(!S.fleet.includes(Bt), 'en båt solgt hos megleren går fortsatt ut av flåten');

  // ---- the buyer: the bid binds the money, the right goes to the boat chosen when he bid
  const B = boat('kyst15', null, 'Kjøperen'), c1 = S.cash, it14 = {kind:'right', id:'h14', hl:HJ.h14.hl, flen:14.99, st:[], landY:y, used:{torsk:12000, hyse:0, sei:0}, y};
  kmState().to[81] = {vid:B.id, how:'put', t:1};
  mbApply([{id:110, kind:'bid', listing:81, kr:-6000000, lk:'right', data:{name:'Hjemmel 14–14,9 m', bid:6000000, fee:0}}]);
  t.ok(Math.round(c1 - S.cash) === 6000000 && mktState().mb.held[81].km, 'budet binder pengene');
  ids = mbApply([{id:111, kind:'right', listing:81, kr:0, lk:'right', data:{item:it14, price:6000000, name:'Hjemmel 14–14,9 m'}}]);
  t.ok(ids.join() === '111' && vget(B, 'lic') && vget(B, 'lic').id === 'h14' && !mktState().mb.held[81] && !kmState().to[81], 'oppgjøret: hjemmelen er satt på båten kjøperen valgte', vget(B, 'lic'));
  t.eq(Math.round(vget(B, 'quota').torsk), 12000, 'og hun starter året med det selgeren fisket (§ 29)');
  t.ok(S.msgs.some(m => m.from === 'Fiskeridirektoratet' && /flyttet til «Kjøperen»/.test(m.no)), 'Fiskeridirektoratet sender melding');
  // structured onto a boat with a right in the same group: the factor less 10 % for 20 years
  kmState().to[82] = {vid:B.id, how:'struct', t:1};
  ids = mbApply([{id:112, kind:'right', listing:82, kr:0, lk:'right', data:{item:Object.assign({}, it14, {used:{torsk:0, hyse:0, sei:0}}), price:6000000, name:'Hjemmel 14–14,9 m'}}]);
  { const l = vget(B, 'lic'); t.ok(ids.join() === '112' && l.st.length === 1 && Math.abs(l.st[0].kf - HJ.h14.kf * (1 - STRUCT.cut)) < 1e-9 && l.st[0].until === y + STRUCT.years, 'strukturert: faktoren minus 10 % i 20 år', l.st); }
  // a structure quota as it is, its years running on
  kmState().to[83] = {vid:B.id, how:'struct', t:1};
  const sq = {kind:'struct', id:'h14', hl:HJ.h14.hl, kf:4.2, from:y - 8, until:y + 12, used:{torsk:0, hyse:0, sei:0}, y};
  ids = mbApply([{id:113, kind:'struct', listing:83, kr:0, lk:'struct', data:{item:sq, price:2000000, name:'Strukturkvote 14–14,9 m'}}]);
  { const l = vget(B, 'lic'); t.ok(ids.join() === '113' && l.st.length === 2 && l.st[1].kf === 4.2 && l.st[1].until === y + 12, 'en strukturkvote flyttes uten ny avkorting, med årene som før', l.st); }
  // a right that can no longer be put where it was to go (the boat has a right now) becomes a free right
  const C = boat('kyst15', Lc('h14'), 'Opptatt'); kmState().to[84] = {vid:C.id, how:'put', t:1};
  ids = mbApply([{id:114, kind:'right', listing:84, kr:0, lk:'right', data:{item:it14, price:6000000, name:'Hjemmel 14–14,9 m'}}]);
  t.ok(ids.join() === '114' && kmFreeList().length === 1 && kmFreeList()[0].id === 'h14' && !(vget(C, 'lic').st || []).length, 'en hjemmel som ikke kan settes der den skulle, blir en ledig hjemmel', kmFreeList());
  t.ok(S.msgs.some(m => /ledig hjemmel/.test(m.no)), 'med melding om det');
  // no choice kept at all (a save from another device): a free right too
  ids = mbApply([{id:115, kind:'right', listing:85, kr:0, lk:'right', data:{item:it14, price:6000000, name:'Hjemmel 14–14,9 m'}}]);
  t.ok(ids.join() === '115' && kmFreeList().length === 2, 'uten et husket valg blir hjemmelen også ledig');
  t.ok(kmKey({free:0}) !== kmKey({free:1}), 'to ledige hjemler med samme lengde fra samme time får hver sin nøkkel', [kmKey({free:0}), kmKey({free:1})]);
  // the free right's key, and its lock
  { const f = kmFreeList()[0], key = kmKey({free:0}); t.ok(key === kmFreeKey(f) && key[0] === 'f' && key.length <= 16 && kmSrcOf(key).free === 0, 'den ledige hjemmelen har en fast nøkkel som begynner med f', key);
    kmLock({free:0}, {id:90, until}, {start:5e6, buynow:null, hours:6, value:9e6, item:kmPack({free:0})});
    t.eq(kmPutWhy({free:0}), 'listed', 'og er låst mens den ligger ute');
    { const u0 = f.until, n = kmFreeList().length, r0 = K.npcReg().h14; f.until = H - 1; K.kmFree(H); t.ok(kmFreeList().length === n - 1 + 1 && kmFreeList().includes(f) && K.npcReg().h14 === r0, 'en ledig hjemmel som ligger ute, går ikke tilbake til registeret mens salget går, selv om fristen er ute'); f.until = u0; }
    kmUnlock(key, 90); t.eq(kmPutWhy({free:0}), null, 'til låsen tas av'); }
  // a structure quota no boat can take is held: not marked done, asked for again, and applied once a boat that can is chosen
  const D = boat('sjark', Lc('h10'), 'Liten'); kmState().to[86] = {vid:D.id, how:'struct', t:1};
  const row = {id:116, kind:'struct', listing:86, kr:0, lk:'struct', data:{item:sq, price:2000000, name:'Strukturkvote 14–14,9 m'}};
  ids = mbApply([row]);
  t.ok(ids.length === 0 && kmState().wait[116] && !mktState().mb.done.includes(116), 'en strukturkvote som ikke kan struktureres, holdes igjen (ikke gjort)', ids);
  const nm = S.msgs.length; mbApply([row]); t.eq(S.msgs.length, nm, 'og meldingen kommer bare én gang');
  kmState().to[86] = {vid:C.id, how:'struct', t:2}; ids = mbApply([row]);
  t.ok(ids.join() === '116' && !kmState().wait[116] && vget(C, 'lic').st.length === 1 && vget(C, 'lic').st[0].kf === 4.2, 'til kjøperen velger en båt som kan ta den', vget(C, 'lic').st);
  // without blad B a right won is kept as a free right
  S.fm.b = false; const E = boat('kyst15', null, 'UtenBladB'); kmState().to[87] = {vid:E.id, how:'put', t:1};
  mbApply([{id:117, kind:'right', listing:87, kr:0, lk:'right', data:{item:it14, price:6000000, name:'Hjemmel 14–14,9 m'}}]);
  t.ok(!vget(E, 'lic') && kmFreeList().length === 3, 'uten blad B settes ikke hjemmelen på båten; den står ledig');
}
