// Bruktmarkedet, del 2 (M4, core/09k-market.js): your own boat at the broker on commission, and delivery by a skipper from the yard.
export default function (t){
  const K = t.K, {newState, ensureFleet, newVesselObj, mktListOwn, mktOwn, mktOwnValue, mktHour, mktDeliver, mktDelKr, mktState, vesselValue, vget, portById, PORTS, portServices, dist, NM, MKT_COMM} = K;
  const S = newState(); K.set('S', S); ensureFleet(); S.me = S.me || S.cur; S.cash = 1e6; S.boat.status = 'port';
  const yard = PORTS.find(p => portServices(p).verft), home = portById(S.boat.port) || PORTS[0];
  t.ok(S.fleet && S.fleet.length >= 1, 'flåten har båten du er om bord i');
  t.eq(mktListOwn(S.me), 'aboard', 'båten du er om bord i, kan ikke legges ut');
  const v = newVesselObj('snekke', yard.id); vget(v, 'boat').status = 'port';
  const val = mktOwnValue(v);
  t.ok(val > vesselValue(v), 'megleren får mer enn verftet gir med en gang (' + val + ' mot ' + vesselValue(v) + ')');
  t.eq(mktListOwn(v.id), null, 'en båt i havn legges ut hos megleren');
  t.eq(mktListOwn(v.id), 'listed', 'og bare én gang');
  const o = mktOwn(v.id), H = S.t / 60, d = (o.H1 - H) / 24;
  t.ok(d >= 7 && d <= 22, 'hun selges innen 1–3 uker (' + Math.round(d) + ' dager)');
  mktHour(H + 1); t.ok(S.fleet.includes(v), 'hun står til salgs til dagen kommer');
  const cash = S.cash; mktHour(o.H1);
  t.ok(!S.fleet.includes(v), 'så er hun solgt');
  t.eq(Math.round(S.cash - cash), Math.round(o.kr * (1 - MKT_COMM)), 'og du får prisen minus 5 % til megleren');
  // taken to sea, the listing is withdrawn
  const w = newVesselObj('skiff', yard.id); vget(w, 'boat').status = 'port'; mktListOwn(w.id); vget(w, 'boat').status = 'idle'; mktHour(H + 2);
  t.ok(!mktOwn(w.id) && S.fleet.includes(w), 'en båt som går til sjøs, trekkes fra megleren');
  // delivery
  vget(w, 'boat').status = 'port'; const to = PORTS.find(p => p.id !== yard.id && dist(p.p, yard.p) / NM > 20 && dist(p.p, yard.p) / NM < 200);
  const nm = dist(vget(w, 'boat').pos, to.p) / NM, c0 = S.cash;
  t.eq(mktDeliver(w.id, to.id), null, 'en båt leveres til en annen havn');
  t.eq(Math.round(c0 - S.cash), mktDelKr(nm), 'for ' + mktDelKr(nm) + ' kr etter avstanden (' + Math.round(nm) + ' nm)');
  t.eq(mktDeliver(w.id, to.id), 'busy', 'én levering om gangen');
  const D = mktState().del[0]; mktHour(D.H1 - 1); t.eq(vget(w, 'boat').port, yard.id, 'hun er ikke framme før seilingstida er gått');
  mktHour(D.H1); t.eq(vget(w, 'boat').port, to.id, 'så ligger hun i ' + to.name);
}
