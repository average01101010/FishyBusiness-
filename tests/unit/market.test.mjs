// Kystmegleren, boat sales between players (B1–B8, core/09k-market.js): the limits on the prices (the same as the server's), the next
// bid, the fee for delivery and the commission, what goes with a boat and what the buyer gets, the lock, and the quick sale at 90 %.
export default function (t){
  const K = t.K, {newState, ensureFleet, newVesselObj, vget, vesselById, vesselValue, mbBounds, mbPriceWhy, mbNext, mbFee, mbNet, mbQuick, mbWhy, mbPack, mbUnpack, mbLock, mbSale,
    mbQuickSell, mbQuickWhy, mbBuyWhy, mbWishHits, mbYardNear, mbSellable, mbLicKr, mktState, MB, PORTS, portServices, portById, depart, EQUIP, LIC_OFFERS, licValue} = K;
  const S = newState(); K.set('S', S); ensureFleet(); S.me = S.cur; S.cash = 5e6; S.boat.status = 'port';
  // the limits, krone for krone
  t.eq(JSON.stringify(mbBounds(1000000)), JSON.stringify({min:400000, max:1600000}), 'startprisen fra 40 % og «Kjøp nå» opp til 160 % av verdien');
  t.eq(mbPriceWhy(1000000, 399999, null), 'start', 'en startpris under 40 % avvises');
  t.eq(mbPriceWhy(1000000, 400000, null), null, 'akkurat 40 % går');
  t.eq(mbPriceWhy(1000000, 1600001, null), 'start', 'en startpris over 160 % avvises');
  t.eq(mbPriceWhy(1000000, 500000, 1600000), null, '«Kjøp nå» på akkurat 160 % går');
  t.eq(mbPriceWhy(1000000, 500000, 1600001), 'buynow', '«Kjøp nå» over 160 % avvises');
  t.eq(mbPriceWhy(1000000, 500000, 500000), 'buynow', '«Kjøp nå» må være over startprisen');
  t.eq(mbNext({start:500000, top:null}), 500000, 'første bud er startprisen');
  t.eq(mbNext({start:500000, top:500000}), 510000, 'neste bud minst 2 % over det høyeste');
  t.eq(mbNext({start:100, top:333}), 340, 'og rundet opp til hel krone (333 · 1,02 = 339,66)');
  t.eq(mbFee(510000, 'p_far', 'p_yard'), 10200, 'levering til et annet verft koster 2 %');
  t.eq(mbFee(510000, 'p_yard', 'p_yard'), 0, 'hentet der hun ligger koster det ingenting');
  t.eq(mbNet(900000), 855000, 'selgeren får prisen minus 5 %');
  t.eq(MB.comm, 0.05, 'kommisjonen er 5 % (V4 A)'); t.eq(MB.quick, 0.9, 'hurtigsalget gir 90 % (V6 A)'); t.eq(JSON.stringify(MB.hours), '[1,6,24,72]', 'varighetene 1 t, 6 t, 1 døgn, 3 døgn');
  t.ok(mbSellable('sjark') && mbSellable('kyst15') && !mbSellable('autoliner') && !mbSellable('ringnot38'), 'åpen gruppe og kystflåten selges mellom spillere, havflåten ikke');
  // why a boat cannot be put out
  t.eq(mbWhy(K.curVessel()), 'aboard', 'båten du er om bord i, kan ikke legges ut');
  const yard = PORTS.find(p => portServices(p).verft), v = newVesselObj('sjark', S.boat.port); vget(v, 'boat').status = 'port';
  vget(v, 'boat').engH = 1234; vget(v, 'boat').svcAt = 1000; vget(v, 'boat').foul = 0.2; v.equip.vhf = true; v.equip.jukse = 2; v.boatName = 'Havbris';
  t.eq(mbWhy(v), null, 'en annen båt i havn kan legges ut');
  vget(v, 'boat').status = 'sailing'; t.eq(mbWhy(v), 'sea', 'ikke når hun er på sjøen'); vget(v, 'boat').status = 'port';
  v.hold = [{sp:'torsk', kg:50}]; t.eq(mbWhy(v), 'hold', 'ikke med fisk i lasten'); v.hold = [];
  S.sets = [{vid:v.id, kind:'garn'}]; t.eq(mbWhy(v), 'gear', 'ikke med redskap i sjøen'); S.sets = [];
  // what goes with her, and what the buyer gets
  const ny = mbYardNear(vget(v, 'boat').pos); t.ok(ny && portServices(ny).verft, 'det nærmeste verftet finnes (' + (ny && ny.name) + ')');
  const P = mbPack(v, ny);
  t.ok(P.type === 'sjark' && P.name === 'Havbris' && P.engH === 1234 && P.svcAt === 1000 && P.foul === 0.2 && P.equip.vhf === true && P.equip.jukse === 2 && P.lic === null && P.at, 'pakken har navnet, motortimene, servicen, groen, utstyret og verftet', P);
  const n0 = S.fleet.length, w = mbUnpack(JSON.parse(JSON.stringify(P)), yard.id), wb = vget(w, 'boat');
  t.ok(S.fleet.length === n0 + 1 && w.boatName === 'Havbris' && wb.type === 'sjark' && wb.port === yard.id && wb.engH === 1234 && wb.svcAt === 1000 && Math.abs(wb.foul - 0.2) < 1e-9 && w.equip.vhf && w.equip.jukse === 2,
    'kjøperen får båten med det som fulgte med, ved verftet');
  t.eq(mbUnpack({type:'nope'}, yard.id), null, 'en ukjent båttype gir ingen båt');
  const bad = mbUnpack({type:'skiff', name:'<b>X</b>', equip:{nope:true, radar:true, vhf:true}, engH:-5}, yard.id);
  t.ok(bad && bad.boatName === 'bX/b' && !bad.equip.nope && !bad.equip.radar && vget(bad, 'boat').engH === 0, 'navnet vaskes, ukjent og upassende utstyr faller bort', {n:bad && bad.boatName, eq:bad && bad.equip});
  // the knives and the gaff go as their tier (OPP4): tier 3 is tier 3 at the buyer and 2 is 2 (before, true went, read as tier 2); an old
  // pack's true is tier 2, too high a number the top, and an ocean vessel, which takes none, gets none
  const tv = newVesselObj('sjark', S.boat.port); tv.equip.kniv = 3; tv.equip.hott = 2;
  const TP = mbPack(tv, ny), tw = mbUnpack(JSON.parse(JSON.stringify(TP)), yard.id), old = mbUnpack({type:'sjark', equip:{kniv:true, hott:9}}, yard.id), hv = mbUnpack({type:'autoliner', equip:{kniv:3, hott:2}}, yard.id);
  t.ok(TP.equip.kniv === 3 && TP.equip.hott === 2 && tw.equip.kniv === 3 && tw.equip.hott === 2 && K.equipLv('kniv', tw.equip, 'sjark') === 3 && K.equipLv('hott', tw.equip, 'sjark') === 2,
    'kniv trinn 3 er trinn 3 hos kjøperen, og høtt trinn 2 er trinn 2', {pack:TP.equip, got:tw.equip});
  t.ok(old.equip.kniv === 2 && old.equip.hott === 3 && hv && hv.equip.kniv == null && hv.equip.hott == null, 'en gammel pakke med true er trinn 2, for høyt er trinn 3, og havbåten får ingen', {old:old.equip, hav:hv && hv.equip});
  // the propeller is the hull's (OPP3): its step goes with her to the buyer; a sale from before has none, too high is step 3, an outboard
  // and an ocean vessel get none
  { const pv = newVesselObj('hurtigsjark', S.boat.port); pv.boat.propLv = 3; pv.boat.engLv = 2;
    const PP = mbPack(pv, ny), pw = mbUnpack(JSON.parse(JSON.stringify(PP)), yard.id), p0 = mbUnpack({type:'sjark'}, yard.id), p9 = mbUnpack({type:'sjark', propLv:9}, yard.id),
      ps = mbUnpack({type:'skiff', propLv:2}, yard.id), ph = mbUnpack({type:'autoliner', propLv:2}, yard.id);
    t.ok(PP.propLv === 3 && pw.boat.propLv === 3 && pw.boat.engLv === 2, 'propell trinn 3 følger båten til kjøperen (som motoren)', {pack:PP.propLv, got:pw.boat.propLv});
    t.ok(p0.boat.propLv == null && p9.boat.propLv === 3 && ps.boat.propLv == null && ph && ph.boat.propLv == null, 'et salg fra før har ingen propell, for høyt er trinn 3, påhengsmotor og havbåt får ingen', {old:p0.boat.propLv, hi:p9.boat.propLv, skiff:ps.boat.propLv, hav:ph && ph.boat.propLv}); }
  for (const x of [tv, tw, old, hv]) if (x && S.fleet.includes(x)) S.fleet.splice(S.fleet.indexOf(x), 1);
  // with a right: it follows the boat, and so does the year's catch on it (B8)
  const O = LIC_OFFERS.find(o => o.id === 'h9'), lv = newVesselObj('sjark', S.boat.port, {id:O.id, hl:O.hl, kpk:O.kpk, coop:{id:'h9', y:2027}}); lv.quota = {y:2027, torsk:1200};
  const LP = mbPack(lv, ny); t.ok(LP.lic && LP.lic.id === 'h9' && !LP.lic.coop && LP.quota && LP.quota.torsk === 1200, 'hjemmelen og årets fangst på den følger med, kvotesamarbeidet ikke');
  t.eq(mbLicKr(lv), Math.round(licValue({id:O.id, hl:O.hl, kpk:O.kpk}) * 0.95), 'hjemmelens del av verdien er 95 % av den, uten partnerens kvote i kvotesamarbeidet (KM4)');
  t.eq(K.mbValue(lv), vesselValue(lv) - Math.round(licValue(lv.lic) * 0.95) + mbLicKr(lv), 'og båtens verdi ved salg er uten den også');
  // KM4: the second quota from the special scheme under 11 m falls away at a boat sale (kvoteforskriften kap. 2 § 6), with or without the right
  { const tv2 = newVesselObj('sjark', yard.id, {id:'h9', hl:'9–9,9 m', two:'h8', st:[], since:2025}); K.licExtra(tv2.lic); vget(tv2, 'boat').status = 'port';
    const full = licValue(tv2.lic), TP2 = mbPack(tv2, ny);
    t.ok(TP2.lic && TP2.lic.id === 'h9' && !('two' in TP2.lic) && Math.abs(TP2.lic.extra) < 1e-9, 'den andre kvoten fra den særlige ordningen følger ikke med ved båtsalg (kap. 2 § 6)', TP2.lic);
    t.ok(tv2.lic.two === 'h8' && tv2.lic.extra > 0, 'og selgeren har den til båten er solgt', tv2.lic);
    t.ok(mbLicKr(tv2) < Math.round(full * 0.95) && mbLicKr(tv2) === Math.round(licValue({id:'h9', hl:'9–9,9 m', st:[], extra:0}) * 0.95), 'hjemmelens del av verdien er uten den andre kvoten', {kr:mbLicKr(tv2), full});
    t.ok(K.mbValue(tv2) === vesselValue(tv2) - Math.round(full * 0.95) + mbLicKr(tv2) && mbQuick(tv2) === Math.round(K.mbValue(tv2) * 0.9), 'båtens verdi ved salg og «Selg nå» er uten den andre kvoten', {v:K.mbValue(tv2), full:vesselValue(tv2)});
    S.fleet.splice(S.fleet.indexOf(tv2), 1); }
  // the lock: moved to the yard, and she cannot go out
  vget(v, 'boat').port = 'finnsnes'; mbLock(v, {id:41, until:new Date(Date.now() + 3600e3).toISOString()}, {start:500000, buynow:900000, hours:1, value:vesselValue(v)}, ny);
  const sale = mbSale(v);
  t.ok(sale && sale.lid === 41 && vget(v, 'boat').port === ny.id && sale.until > Date.now(), 'lagt ut ligger hun ved verftet og er låst', sale);
  t.eq(mbWhy(v), 'listed', 'og legges ikke ut to ganger');
  // (with a hand aboard, so the sale is the only thing that holds her)
  const hand = K.crewUpgrade({id:'c9', name:'Ola Hansen', age:40, skill:{}, traits:[], morale:70, share:0.1});
  const went = K.withVessel(v, () => { S.crew = [hand]; S.plan = {wps:[{x:0, y:0}], idx:0}; const r = depart(); return {r, plan:S.plan, st:S.boat.status, crew:K.crewAboard().length}; });
  t.ok(went.r === false && went.plan === null && went.st === 'port' && went.crew === 1, 'en båt til salgs kan ikke gå ut, også med mannskap om bord', went);
  const free = newVesselObj('skiff', S.boat.port), wentFree = K.withVessel(free, () => { S.boat.status = 'port'; S.crew = [hand]; S.plan = {wps:[{x:0, y:0}], idx:0}; return depart(); });
  t.eq(wentFree, true, 'en båt som ikke er til salgs, går ut med samme mannskap');
  S.fleet.splice(S.fleet.indexOf(free), 1);
  t.eq(mbQuickWhy(v), 'listed', 'og selges ikke til megleren mens hun ligger ute');
  t.eq(K.mktDelWhy(v, 'finnsnes'), 'sale', 'og leveres ikke av verftets skipper');
  // the quick sale: 90 % of her value at once, the loans first
  const q = newVesselObj('snekke', S.boat.port); vget(q, 'boat').status = 'port'; const val = vesselValue(q), c0 = S.cash; S.loan = {bal:50000, rate:0.069, pay:1000, next:S.t};
  t.eq(mbQuick(q), Math.round(val * 0.9), 'megleren gir 90 % av verdien');
  t.eq(mbQuickSell(q.id), null, 'hurtigsalget går');
  t.ok(!vesselById(q.id) && Math.round(S.cash - c0) === Math.round(val * 0.9) - 50000 && !S.loan, 'båten er borte, lånet er innfridd, og resten er på konto', {got:S.cash - c0, val, loan:S.loan});
  // who may bid: a right needs blad B; without a right only one boat in the open group; the money
  const Lr = {type:'sjark', mine:false, vessel:{lic:{id:'h9'}}}, Lo = {type:'sjark', mine:false, vessel:{lic:null}};
  t.eq(mbBuyWhy({...Lo, mine:true}), 'own', 'ikke på din egen båt');
  S.fm = {b:false}; t.eq(mbBuyWhy(Lr), 'bladb', 'en båt med hjemmel krever blad B'); S.fm = {b:true}; t.eq(mbBuyWhy(Lr), null, 'med blad B går det');
  for (const x of S.fleet) x.lic = null; S.lic = null; t.eq(mbBuyWhy(Lo), 'open', 'uten hjemmel i rederiet: én båt i åpen gruppe');
  t.eq(mbBuyWhy({type:'kyst15', mine:false, vessel:{}}), null, 'en kystbåt over 11 m går');
  S.cash = 1000; t.eq(mbBuyWhy({type:'kyst15', mine:false, vessel:{}}, 9e8), 'cash', 'og budet må finnes på konto');
  // the wish
  mktState().wish = {cls:'open', max:600000};
  const hits = mbWishHits([{type:'sjark', start:500000, top:null, buynow:null}, {type:'sjark', start:500000, top:600000, buynow:null}, {type:'kyst15', start:100000, top:null}, {type:'sjark', start:900000, top:null, buynow:550000}, {type:'sjark', start:1, mine:true}]);
  t.eq(hits.length, 2, 'ønsket treffer en åpen båt under prisen (laveste bud eller «Kjøp nå»), ikke en kystbåt, ikke en over prisen, ikke din egen');
}
