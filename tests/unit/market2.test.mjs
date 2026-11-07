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
  // an old save's commission listing (M4) is withdrawn
  mktState().own = [{vid:w.id, H0:0, H1:1, kr:1}]; mktHour(S.t / 60); t.eq(mktState().own.length, 0, 'en gammel kommisjonsoppføring trekkes');
}
