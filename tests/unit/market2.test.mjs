// Kystmegleren, the settlement in the save (B2, B3, core/09k-market.js mbApply): the ledger rows from the server applied once (money
// bound for a bid and given back, the boat won with delivery, the seller paid the price less 5 % with the loans first, an unsold boat
// back), and the yard's delivery skipper as before.
export default function (t){
  const K = t.K, {newState, ensureFleet, newVesselObj, vget, vesselById, mbApply, mbLock, mbSale, mbPack, mktState, mktHour, mktDeliver, mktDelKr, PORTS, portServices, dist, NM, depart} = K;
  const S = newState(); K.set('S', S); ensureFleet(); S.me = S.cur; S.cash = 1e6; S.boat.status = 'port';
  const yards = PORTS.filter(p => portServices(p).verft), y1 = yards[0], y2 = yards.find(p => dist(p.p, y1.p) / NM > 30 && dist(p.p, y1.p) / NM < 200);
  // a bid binds the money, an outbid gives it back, once each even when the same rows come again
  const c0 = S.cash;
  mbApply([{id:1, kind:'bid', listing:7, kr:-510200, data:{name:'Polarlys', bid:500000, fee:10200}}]);
  t.eq(Math.round(c0 - S.cash), 510200, 'et bud binder pengene (budet og 2 % for levering)');
  t.ok(mktState().mb.held[7] && mktState().mb.held[7].kr === 510200, 'og budet huskes som bundet');
  const ids = mbApply([{id:1, kind:'bid', listing:7, kr:-510200, data:{}}, {id:2, kind:'release', listing:7, kr:510200, data:{name:'Polarlys', why:'outbid', by:520000}}]);
  t.ok(Math.round(S.cash) === Math.round(c0) && ids.join() === '1,2' && !mktState().mb.held[7], 'overbydd: pengene er tilbake, og en rad som kommer igjen, regnes ikke to ganger', {cash:S.cash, ids});
  t.ok(/overbydd/.test(S.msgs[S.msgs.length - 1].no), 'og en melding sier at du er overbydd');
  // the boat won: at the yard where she lay, or sailed to the yard chosen for 2 %
  const P = {type:'sjark', name:'Polarlys', engH:900, svcAt:800, equip:{vhf:true}, lic:null}, n0 = S.fleet.length;
  mbApply([{id:3, kind:'buy', listing:8, kr:-700000, data:{name:'Polarlys', price:700000}}, {id:4, kind:'boat', listing:8, kr:0, data:{vessel:P, from:y1.id, port:y1.id, price:700000, name:'Polarlys'}}]);
  const got = S.fleet[S.fleet.length - 1];
  t.ok(S.fleet.length === n0 + 1 && got.boatName === 'Polarlys' && vget(got, 'boat').port === y1.id && vget(got, 'boat').engH === 900 && got.equip.vhf, 'vinneren får båten ved verftet der hun lå');
  t.eq(Math.round(c0 - S.cash), 700000, 'og «Kjøp nå» trakk prisen');
  const P2 = {type:'snekke', name:'Ternen', engH:100, equip:{}, lic:null};
  mbApply([{id:5, kind:'boat', listing:9, kr:0, data:{vessel:P2, from:y1.id, port:y2.id, price:300000, name:'Ternen'}}]);
  const g2 = S.fleet[S.fleet.length - 1], D = (mktState().del || []).find(d => d.vid === g2.id);
  t.ok(g2.boatName === 'Ternen' && D && D.from === y1.id && D.to === y2.id && D.kr === 0, 'med levering seiler en skipper henne til verftet nær kjøperen (betalt med budet)', D);
  mktHour(D.H1 - 0.5); t.eq(vget(g2, 'boat').port, y1.id, 'hun er ikke framme før seilingstida er gått');
  mktHour(D.H1); t.eq(vget(g2, 'boat').port, y2.id, 'så ligger hun ved verftet i ' + y2.name);
  // your own boat sold: the price less 5 %, the loans first, and she leaves the fleet; followed, the view goes to the boat you are aboard
  const s = newVesselObj('sjark', y1.id); vget(s, 'boat').status = 'port'; s.boatName = 'Havbris';
  mbLock(s, {id:11, until:new Date(Date.now() + 6 * 3600e3).toISOString()}, {start:500000, buynow:null, hours:6, value:800000}, y1);
  K.storeVessel(K.curVessel()); K.bindVessel(s);   // (following her)
  S.loan = {bal:100000, rate:0.069, pay:1000, next:S.t}; const c1 = S.cash;
  mbApply([{id:12, kind:'paid', listing:11, kr:855000, data:{vid:s.id, price:900000, comm:45000, name:'Havbris'}}]);
  t.ok(!vesselById(s.id) && S.cur === S.me && Math.round(S.cash - c1) === 755000 && !S.loan, 'solgt: båten er borte, lånet innfridd først, og resten (855 000 − 100 000) på konto', {cash:S.cash - c1, cur:S.cur, me:S.me});
  t.ok(/solgt for/.test(S.msgs[S.msgs.length - 1].no), 'og megleren sier fra');
  // unsold: she is yours again and can sail
  const u = newVesselObj('skiff', y1.id); vget(u, 'boat').status = 'port'; u.boatName = 'Skarven';
  mbLock(u, {id:13, until:new Date(Date.now() + 3600e3).toISOString()}, {start:40000, hours:1, value:60000}, y1);
  mbApply([{id:14, kind:'back', listing:13, kr:0, data:{vid:u.id, name:'Skarven', why:'unsold'}}]);
  t.ok(!mbSale(u) && vesselById(u.id), 'usolgt: hun er din igjen og låst opp');
  // the yard's delivery skipper, as before (10.2b)
  const w = newVesselObj('skiff', y1.id); vget(w, 'boat').status = 'port';
  const nm = dist(vget(w, 'boat').pos, y2.p) / NM, c2 = S.cash;
  t.eq(mktDeliver(w.id, y2.id), null, 'en båt leveres til en annen havn');
  t.eq(Math.round(c2 - S.cash), mktDelKr(nm), 'for ' + mktDelKr(nm) + ' kr etter avstanden (' + Math.round(nm) + ' nm)');
  t.eq(mktDeliver(w.id, y2.id), 'busy', 'én levering om gangen');
  // ---- KM4: the boat with or without her right (V2 A). The right moves between your own boats by the length rule, or becomes a free
  // right for two game years, and the boat is then packed without it ----
  { const {mbMove, mbMoveWhy, mbMoveLen, mbValue, mbLicKr, vesselValue, licValue, licExtra, kmFreeList, kmFree, kmKey, kmState, VESSELS, HJ, KM, yearH} = K, H = S.t / 60, y = yearH(H);
    for (const x of S.fleet) if (x.id !== S.cur) x.lic = null; S.lic = null; S.licFree = [];
    const mk = (type, lic) => { const x = newVesselObj(type, y1.id, lic || null); vget(x, 'boat').status = 'port'; return x; };
    const lic = (id, o) => { const l = Object.assign({id, hl:HJ[id].hl, kpk:260, since:y - 3, from:'Ola, Husøy', st:[]}, o || {}); licExtra(l); return l; };
    // from a boat to another of yours: the right, its structure quota, the year's catch and the year it was bought go along
    const a = mk('sjark', lic('h10', {st:[{id:'h10', kf:0.5, from:y - 1, until:y + 19}]})), b = mk('sjark'); a.quota = {y, torsk:4321, hyse:100, sei:50};
    t.eq(mbMoveWhy({v:a}, {v:b}, H), null, 'hjemmelen kan flyttes til en annen egen båt uten hjemmel');
    t.eq(mbMoveWhy({v:a}, {v:a}, H), 'same', 'ikke til samme båt');
    const r1 = mbMove({v:a}, {v:b}, H), lb = vget(b, 'lic');
    t.ok(r1.ok && !vget(a, 'lic') && lb && lb.id === 'h10' && lb.st.length === 1 && Math.abs(lb.extra - 0.5) < 1e-9 && lb.since === y - 3 && lb.from === 'Ola, Husøy', 'flyttet: hjemmelen, strukturkvoten og kjøpsåret er på den andre båten', lb);
    t.ok(vget(b, 'quota').torsk === 4321 && !(vget(a, 'quota') && vget(a, 'quota').torsk === 4321 && vget(a, 'lic')), 'og årets fangst på hjemmelen fulgte med (§ 29)', vget(b, 'quota'));
    t.ok(/flyttet til/.test(S.msgs[S.msgs.length - 1].no), 'Fiskeridirektoratet sier fra');
    // the boat left behind is packed without a right, and her value is the hull's
    const Pa = mbPack(a, y1);
    t.ok(Pa.lic === null && Pa.quota === null && mbLicKr(a) === 0 && mbValue(a) === vesselValue(a), 'båten som er igjen, pakkes uten hjemmel og uten fangst på den, og verdien er skroget', {lic:Pa.lic, kr:mbLicKr(a)});
    t.eq(mbMoveWhy({v:a}, {v:b}, H), 'none', 'en båt uten hjemmel har ingenting å flytte');
    t.eq(mbMoveWhy({v:b}, {v:mk('sjark', lic('h9'))}, H), 'haslic', 'ikke til en båt som alt har hjemmel');
    // the length rule (§ 6): a right under 11 m on a boat under 11 m cannot go to a boat of 11 m or more; one under 15 not to 15 or more
    const big = Object.keys(VESSELS).find(k => VESSELS[k].cls === 'kyst' && VESSELS[k].len >= 11 && VESSELS[k].len < 15 && !VESSELS[k].lock), huge = Object.keys(VESSELS).find(k => VESSELS[k].cls === 'kyst' && VESSELS[k].len >= 21 && !VESSELS[k].lock);
    const small = Object.keys(VESSELS).find(k => VESSELS[k].len < 11 && VESSELS[k].len >= 9 && !VESSELS[k].lock);
    t.ok(big && huge && small, 'spillet har en båt under 11 m, en på 11–14,99 m og en på 21 m eller mer', {small, big, huge});
    const s9 = mk(small, lic('h9')), b11 = mk(big), b21 = mk(huge), s2 = mk(small);
    t.ok(mbMoveWhy({v:s9}, {v:b11}, H) === 'len' && mbMoveLen({v:s9}, {v:b11}, H) === 11, 'hjemmel under 11 m fra en båt under 11 m: ikke til en båt på 11 m eller mer (lengderegelen)', mbMoveWhy({v:s9}, {v:b11}, H));
    t.eq(mbMoveWhy({v:s9}, {v:s2}, H), null, 'men til en annen båt under 11 m går det');
    const b14 = mk(big, lic('h14'));
    t.ok(mbMoveWhy({v:b14}, {v:b21}, H) === 'len' && mbMoveLen({v:b14}, {v:b21}, H) === 15, 'hjemmel 14–14,9 m fra en båt under 15 m: ikke til en båt på 21 m (grensa på 15 m)');
    t.eq(mbMoveWhy({v:b14}, {v:mk(big)}, H), null, 'men til en annen båt i samme lengdegruppe går det');
    const b20 = mk(huge, lic('h20'));
    t.eq(mbMoveWhy({v:b20}, {v:b21}, H), null, 'en hjemmel 20–20,9 m på en båt på 21 m eller mer kan flyttes til en annen slik');
    t.eq(mbMoveWhy({v:b20}, {v:mk('autoliner')}, H), 'type', 'aldri til en havbåt');
    // locked: for sale, at sea, in a quota cooperation
    mbLock(s2, {id:71, until:new Date(Date.now() + 3600e3).toISOString()}, {start:1, hours:1, value:1}, y1);
    t.eq(mbMoveWhy({v:s9}, {v:s2}, H), 'tolisted', 'ikke til en båt som ligger til salgs');
    delete vget(s2, 'boat').sale; vget(s9, 'boat').status = 'sea'; t.eq(mbMoveWhy({v:s9}, {free:true}, H), 'sea', 'båten må ligge i havn'); vget(s9, 'boat').status = 'port';
    vget(s9, 'lic').coop = {y, id:'h9'}; t.eq(mbMoveWhy({v:s9}, {free:true}, H), 'coop', 'ikke mens hjemmelen er i kvotesamarbeid i år'); delete vget(s9, 'lic').coop;
    // a free right: two game years, the second quota from the special scheme gone, and back on a boat without loss
    vget(s9, 'lic').two = 'h8'; licExtra(vget(s9, 'lic')); s9.quota = {y, torsk:777, hyse:0, sei:0}; const n0 = kmFreeList().length, m0 = S.msgs.length;
    const r2 = mbMove({v:s9}, {free:true}, H), f = kmFreeList()[kmFreeList().length - 1];
    t.ok(r2.ok && r2.two === 'h8' && kmFreeList().length === n0 + 1 && !vget(s9, 'lic') && f.id === 'h9' && !('two' in f) && f.used.torsk === 777 && f.since === y - 3, 'ledig hjemmel: uten båt i rederiet, med årets fangst, og den andre kvoten fra den særlige ordningen falt bort', {r:r2.two, f});
    t.ok(Math.abs(f.until - (H + KM.freeY * 8760)) < 1e-6 && /falt bort/.test(S.msgs[S.msgs.length - 1].no) && /to år/.test(S.msgs[S.msgs.length - 1].no), 'tilsagnet gjelder i to spillår, og meldingen sier det og at den andre kvoten falt bort', S.msgs[S.msgs.length - 1].no);
    kmFree(f.until - 1); t.eq(kmFreeList().includes(f), true, 'en time før fristen står den');
    // undo (the listing it was moved for did not come through): everything as before, the second quota too
    r2.undo(); const l9 = vget(s9, 'lic');
    t.ok(l9 && l9.id === 'h9' && l9.two === 'h8' && l9.extra > 0 && vget(s9, 'quota').torsk === 777 && kmFreeList().length === n0 && S.msgs.length === m0, 'angret: hjemmelen, den andre kvoten, fangsten og meldingene er som før', {l9, n:kmFreeList().length, m:S.msgs.length - m0});
    // and from a free right to a boat
    const r3 = mbMove({v:s9}, {free:true}, H), i = kmFreeList().length - 1;
    t.eq(mbMoveWhy({free:i}, {free:true}, H), 'same', 'en ledig hjemmel er alt ledig');
    t.eq(mbMoveWhy({free:i}, {v:b11}, H), 'len', 'lengderegelen gjelder en ledig hjemmel også (båten den kom fra)');
    kmState().out[kmKey({free:i})] = {lid:5}; t.eq(mbMoveWhy({free:i}, {v:s2}, H), 'listed', 'ikke mens den ligger ute i Kvotemarkedet'); delete kmState().out[kmKey({free:i})];
    const r4 = mbMove({free:i}, {v:s2}, H), l2 = vget(s2, 'lic');
    t.ok(r3.ok && r4.ok && kmFreeList().length === n0 && l2 && l2.id === 'h9' && !l2.two && Math.abs(l2.extra) < 1e-9 && l2.since === y - 3 && vget(s2, 'quota').torsk === 777, 'fra ledig hjemmel til en båt: hjemmelen og fangsten er der, den andre kvoten ikke', l2);
    kmFree(H + KM.freeY * 8760 + 1); t.eq(kmFreeList().length, n0, 'og ingenting går tilbake til registeret når den er satt på en båt');
    // a free right left alone goes back to the register after two game years
    const r5 = mbMove({v:b14}, {free:true}, H); kmFree(H + KM.freeY * 8760 - 1); const before = kmFreeList().length; kmFree(H + KM.freeY * 8760);
    t.ok(r5.ok && before === n0 + 1 && kmFreeList().length === n0, 'en ledig hjemmel som blir stående, går tilbake til registeret etter to spillår');
    // the boat put out without her right says so on her sale, and an unsold one tells where the right is
    mbLock(b14, {id:72, until:new Date(Date.now() + 3600e3).toISOString()}, {start:1, hours:1, value:1, kept:{free:true}}, y1);
    t.ok(mbSale(b14).kept && mbSale(b14).kept.free, 'låsen husker at hjemmelen ble i rederiet');
    b14.boatName = 'Uten'; mbApply([{id:73, kind:'back', listing:72, kr:0, data:{vid:b14.id, name:'Uten', why:'unsold'}}]);
    t.ok(!mbSale(b14) && /Flytt hjemmelen til/.test(S.msgs[S.msgs.length - 1].no), 'usolgt uten hjemmel: meldingen sier at hjemmelen kan settes tilbake', S.msgs[S.msgs.length - 1].no);
    for (const x of [a, b, s9, b11, b21, s2, b14, b20]) if (S.fleet.includes(x)) S.fleet.splice(S.fleet.indexOf(x), 1);
    for (const x of S.fleet.slice()) if (x.id !== S.cur && x.id !== S.me && x.lic) S.fleet.splice(S.fleet.indexOf(x), 1); }
  // an old save's commission listing (M4) is withdrawn
  mktState().own = [{vid:w.id, H0:0, H1:1, kr:1}]; mktHour(S.t / 60); t.eq(mktState().own.length, 0, 'en gammel kommisjonsoppføring trekkes');
}
