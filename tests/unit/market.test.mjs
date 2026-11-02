// Bruktmarkedet (M4, core/09k-market.js): the same listings for everyone from the clock alone, a fair price, the price cut, bids once a
// day from 90 %, the takst, the wish, and what comes over to the vessel when she is bought.
export default function (t){
  const K = t.K, {newState, mktListings, mktAll, mktSold, mktAsk, mktPrice, mktBid, mktTakstKr, mktTakeOver, mktState, mktWishHits, mktRnd, MKT, VESSELS, EQUIP, portServices, portById} = K;
  const S = newState(); K.set('S', S);
  const H = 24 * 7 * 60 + 13;   // ten weeks in
  S.t = H * 60;
  const A = mktListings(H), B = JSON.parse(JSON.stringify(mktAll(H)));
  t.ok(A.length >= 12 && A.length <= 45, 'markedet har ' + A.length + ' båter til salgs');
  t.eq(mktRnd('x|1'), mktRnd('x|1'), 'tallene kommer av nøkkelen, ikke av et kast');
  const S2 = newState(); K.set('S', S2); S2.t = H * 60; const C = mktAll(H);
  t.ok(JSON.stringify(C.map(L => [L.id, L.type, L.price, L.port])) === JSON.stringify(B.map(L => [L.id, L.type, L.price, L.port])), 'to spillere ser de samme oppføringene');
  K.set('S', S);
  t.eq(new Set(A.map(L => L.id)).size, A.length, 'hver oppføring har sitt eget nummer');
  t.ok(A.every(L => MKT.types.includes(L.type) && !VESSELS[L.type].lock && !VESSELS[L.type].isNew), 'bare brukte båter som kan kjøpes');
  t.ok(A.every(L => portServices(portById(L.port)).verft), 'alle ligger ved et verft');
  t.ok(A.every(L => Math.abs(L.price / L.fair - 1) <= 0.17), 'prisantydningen ligger innenfor 15 % av markedsverdien');
  t.ok(A.every(L => L.engH < 20000), 'motortimene er motorens, ikke skrogets (høyst ' + Math.max(...A.map(L => L.engH)) + ')');
  t.ok(A.every(L => Object.keys(L.ex).every(q => K.equipFits(q, L.type))), 'det som følger med, passer båten');
  { const lat = id => K.natLL(portById(id).p).lat, all = []; for (let w = 10; w < 30; w++) all.push(...mktAll(w * 168));
    const sor = all.filter(x => lat(x.port) < 62).length, midt = all.filter(x => lat(x.port) >= 62 && lat(x.port) < 67).length, nord = all.filter(x => lat(x.port) >= 67).length;
    t.ok(sor > 5 && midt > 5 && nord > 5, 'båtene ligger langs hele kysten (sør ' + sor + ', midt ' + midt + ', nord ' + nord + ')'); }
  t.ok(mktSold(H).length > 0, 'noen er solgt siste måned (' + mktSold(H).length + ')');
  // the price cut: none the first three weeks, 2 % a week after
  const L = A.find(x => x.H1 > H + 72) || A[0], at = d => L.H0 + d * 24;
  t.eq(mktAsk(L, at(20)), L.price, 'prisen står de tre første ukene');
  t.ok(mktAsk(L, at(21)) < L.price && mktAsk(L, at(21)) >= L.price * 0.97, 'så går den ned 2 % i uka');
  // bids
  const ask = mktAsk(L, H);
  t.eq(mktBid(L.id, ask * 0.5).err, 'low', 'et bud under 90 % tas ikke');
  const r = mktBid(L.id, Math.ceil(ask * 0.9));
  t.ok(r.ok === true || (r.ok === false && r.counter > Math.ceil(ask * 0.9) && r.counter < ask), 'et bud fra 90 % får ja eller et motbud midt imellom');
  t.eq(mktBid(L.id, Math.ceil(ask * 0.95)).err, 'today', 'ett bud om dagen');
  const r2 = (S.t += 24 * 60, mktBid(L.id, Math.ceil(mktAsk(L) * 0.995)));
  t.ok(r2.ok === true, 'et bud like under prisen tas neste dag');
  t.ok(mktPrice(L) < mktAsk(L), 'og budet er prisen i ei uke');
  // the takst
  t.ok(A.every(x => mktTakstKr(x) >= 3000 && mktTakstKr(x) <= 8000), 'taksten koster 3 000–8 000 kr');
  t.eq(mktState().freeTakst, true, 'den første taksten er gratis');
  // the wish
  mktState().wish = {cls:'open', max:1e9};
  t.ok(mktWishHits().length > 0 && mktWishHits().every(x => VESSELS[x.type].cls === 'open'), 'ønsket båt finner båtene i åpen gruppe');
  // taking her over
  const b = {}, eq = {}, Lx = mktListings().find(x => Object.keys(x.ex).length) || mktListings()[0];
  mktTakeOver(Lx, b, eq);
  t.eq(b.engH, Lx.engH, 'motortimene følger båten');
  t.ok(b.svcAt <= b.engH, 'og servicen etter motorens stand');
  t.ok(Object.keys(Lx.ex).every(q => eq[q]), 'utstyret som fulgte med, er om bord');
  t.ok(!mktListings().some(x => x.id === Lx.id), 'og hun er borte fra markedet');
}
