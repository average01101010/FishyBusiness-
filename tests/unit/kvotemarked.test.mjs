// Kvotemarkedet, the core (KM1, core/03i-kvotemarked.js; docs/planer/kvotemarkedet.md): the takst, the price band, every reason in kmWhy and
// kmBuyWhy, the sum of the quota factors before and after a sale, the same tonnes for the same right in two saves with WORLD_SEED, the free
// right's two years, and the quota cap after kvoteforskriften § 12 (5 and 6 times).
export default function (t){
  const K = t.K, {newState, ensureFleet, newVesselObj, vget, HJ, STRUCT, KM, KPK, MB, licQ, licExtra, yearQuota, yearH, kmTakst, kmBounds, kmQuick, kmWhy, kmBuyWhy,
    kmPack, kmOut, kmApply, kmFree, kmFreeList, kmCod, kmKf, structRoom, structFits, structIn, npcReg, EPOCH, WORLD_SEED, PORTS, portServices} = K;
  const mk = qseed => { const S = newState(); S.qseed = qseed; K.set('S', S); ensureFleet(); S.me = S.cur; S.cash = 5e7; S.boat.status = 'port'; S.fm = {n:0, last:-1, kr:0, b:true}; return S; };
  let S = mk(WORLD_SEED);
  const port = PORTS.find(p => portServices(p).verft).id, H = S.t / 60, y = yearH(H), Y = yearQuota(y);
  const boat = (type, lic) => { const v = newVesselObj(type, port, lic || null); vget(v, 'boat').status = 'port'; return v; };
  const L = (id, extra) => { const l = Object.assign({id, hl:HJ[id].hl, since:y - 3, landY:y}, extra || {}); licExtra(l); return l; };
  const tot = () => S.fleet.reduce((a, v) => { const l = vget(v, 'lic'); return a + (l && HJ[l.id] ? HJ[l.id].kf + (l.extra || 0) : 0); }, 0) + (S.licFree || []).reduce((a, f) => a + HJ[f.id].kf + (f.st || []).reduce((b, s) => b + s.kf, 0), 0);

  // ---- the quota cap (§ 12): a specialist with only the whitefish sector, 5 times for 11–14.99 m and 6 for 15–27.99 m
  t.eq(STRUCT.cap.g11, 5, 'kvotetaket for 11–14,99 m er 5 ganger egen kvote (§ 12, spesialist)');
  t.eq(STRUCT.cap.g15, 6, 'og 6 ganger for 15–27,99 m');
  { const l = L('h14'), n = Math.floor((5 - 1) / (1 - STRUCT.cut)); let k = 0; while (structRoom(l, 'h14')){ structIn(l, 'h14', H); k++; }
    t.eq(k, n, 'en hjemmel 14–14,9 m tar ' + n + ' strukturkvoter fra samme gruppe før taket'); t.ok(HJ.h14.kf + l.extra <= 5 * HJ.h14.kf + 1e-9, 'og er under 5 ganger egen kvote'); }
  { const l = L('h20'); let k = 0; while (structRoom(l, 'h20')){ structIn(l, 'h20', H); k++; } t.eq(k, Math.floor(5 / 0.9), 'en hjemmel 20–20,9 m tar ' + Math.floor(5 / 0.9) + ' før taket på 6 ganger'); }
  t.ok(!structRoom(L('h9'), 'h9') && !structRoom(L('h14'), 'h20'), 'under 11 m og mellom gruppene: ingen strukturkvote');
  { const r0 = npcReg().h14; structIn(L('h14'), 'h14', H); t.eq(npcReg().h14, r0, 'structIn tar ingen eier ut av registeret selv (kjøpet gjør det én gang)'); }

  // ---- the takst: the year's cod quota at KPK; a structure quota the same for its factor, times the years left over 20
  const r14 = {kind:'right', id:'h14'};
  t.eq(kmTakst(r14, H), Math.round(HJ.h14.kf * Y.unit.g11 * 1000) * KPK, 'taksten for en hjemmel er årets torskekvote × KPK');
  t.eq(kmTakst(r14, H), Math.round(licQ({id:'h14'}, H).torsk * KPK), 'det samme som licQ gir (rundt ' + Math.round(kmTakst(r14, H) / 1e6) + ' MNOK)');
  const s20 = {kind:'struct', id:'h14', kf:HJ.h14.kf * 0.9, from:y, until:y + 20}, s5 = {...s20, until:y + 5};
  t.near(kmTakst(s20, H), kmTakst(r14, H) * 0.9 * (y + 20 - (y + K.doyH(H) / 365)) / 20, 20, 'en strukturkvote med 20 år: faktoren × år igjen / 20');
  t.ok(kmTakst(s5, H) < kmTakst(s20, H) / 3.5, 'med fem år igjen er den rundt en firedel så mye verdt');
  t.eq(kmTakst({kind:'right', id:'h14', st:[s5]}, H), kmTakst(r14, H) + kmTakst(s5, H), 'en hjemmel med strukturkvote: begge takstene');
  // ---- the band (B's MB): start from 40 %, buy-now up to 160 %, the next bid 2 % over; the quick sale to the register at 90 %
  const T = kmTakst(r14, H), B = kmBounds(T);
  t.ok(B.min === Math.ceil(T * MB.startMin) && B.max === Math.floor(T * MB.capMax), 'grensene er 40 og 160 % av taksten', B);
  t.eq(K.mbNext({top:1e6, start:5e5}), 1020000, 'neste bud er 2 % over');
  t.eq(kmQuick(r14, H), Math.round(T * 0.9), '«Selg nå» til registeret er 90 % av taksten');

  // ---- kmWhy, every reason
  const a = boat('sjark', L('h14')), b2 = boat('sjark', L('h9', {two:'h8'})), nolic = boat('sjark');
  t.eq(kmWhy({v:a, kind:'right'}, H), null, 'en hjemmel i havn med landing i år kan legges ut');
  t.eq(kmWhy(null, H), 'gone', 'ingenting: gone'); t.eq(kmWhy({v:nolic, kind:'right'}, H), 'none', 'en båt uten hjemmel: none');
  t.eq(kmWhy({v:b2, kind:'two'}, H), 'two', 'den andre kvoten fra den særlige ordningen faller bort (kap. 2 § 6): two');
  { const h = boat('sjark', {id:'tral', hav:true, kf:2}); t.eq(kmWhy({v:h, kind:'right'}, H), 'hav', 'en havtillatelse selges med fartøyet: hav'); }
  vget(a, 'boat').status = 'sea'; t.eq(kmWhy({v:a, kind:'right'}, H), 'sea', 'båten på sjøen: sea'); vget(a, 'boat').status = 'port';
  vget(a, 'boat').landQ = {}; t.eq(kmWhy({v:a, kind:'right'}, H), 'busy', 'båten losser: busy'); delete vget(a, 'boat').landQ;
  vget(a, 'boat').sale = {lid:1}; t.eq(kmWhy({v:a, kind:'right'}, H), 'listed', 'båten lagt ut hos megleren: listed'); delete vget(a, 'boat').sale;
  { const c = boat('sjark', L('h9', {coop:{y, id:'h8'}})); t.eq(kmWhy({v:c, kind:'right'}, H), 'coop', 'en hjemmel i kvotesamarbeid i år: coop'); }
  { const d = boat('sjark', L('h14', {landY:y - 3})); t.eq(kmWhy({v:d, kind:'right'}, H), null, 'driftskravet er av (tatt bort for kystflåten 11.09.2026)');
    KM.drift = true; t.eq(kmWhy({v:d, kind:'right'}, H), 'drift', 'med driftskravet på: ingen landing i år eller de to før: drift');
    vget(d, 'lic').landY = y - 2; t.eq(kmWhy({v:d, kind:'right'}, H), null, 'landing for to år siden holder'); KM.drift = false; }
  { const e = boat('sjark', L('h14', {st:[{id:'h14', kf:1, from:y - 19, until:y + 1}, {id:'h14', kf:1, from:y - 10, until:y + 10}]}));
    t.eq(kmWhy({v:e, kind:'struct', i:0}, H + 24), 'short', 'en strukturkvote med under ett år igjen: short');
    t.eq(kmWhy({v:e, kind:'struct', i:1}, H), null, 'med ti år igjen kan den legges ut'); t.eq(kmWhy({v:e, kind:'struct', i:5}, H), 'gone', 'en som ikke finnes: gone'); }

  // ---- kmBuyWhy, every reason
  const r9 = {kind:'right', id:'h9', flen:9.5}, empty = boat('sjark'), big = boat('sjark'), hb = boat('sjark', L('h14')), h20b = boat('sjark', L('h20'));
  t.eq(kmBuyWhy(r9, {v:empty, how:'put'}), null, 'en hjemmel 9–9,9 m på en sjark uten hjemmel');
  t.eq(kmBuyWhy(null, {v:empty, how:'put'}), 'gone', 'borte: gone'); t.eq(kmBuyWhy({...r9, mine:true}, {v:empty, how:'put'}), 'own', 'din egen: own');
  S.fm.b = false; t.eq(kmBuyWhy(r9, {v:empty, how:'put'}), 'bladb', 'uten blad B (deltakerloven § 6): bladb'); S.fm.b = true;
  t.eq(kmBuyWhy(r9, {v:empty, how:'free'}), 'how', 'en kjøper må sette hjemmelen på en båt: how');
  t.eq(kmBuyWhy(s20, {v:empty, how:'put'}), 'how', 'en strukturkvote settes ikke på en båt uten hjemmel: how');
  t.eq(kmBuyWhy(r9, {v:null, how:'put'}), 'boat', 'ingen båt: boat');
  { const hav = Object.keys(K.VESSELS).find(k => K.VESSELS[k].cls === 'hav'); t.eq(kmBuyWhy(r9, {v:boat(hav), how:'put'}), 'type', 'et havfartøy: type'); }
  vget(empty, 'boat').sale = {lid:2}; t.eq(kmBuyWhy(r9, {v:empty, how:'put'}), 'listed', 'båten er lagt ut: listed'); delete vget(empty, 'boat').sale;
  t.eq(kmBuyWhy(r9, {v:hb, how:'put'}), 'haslic', 'en båt som har hjemmel: haslic');
  { const lenOf = k => K.VESSELS[k].len, t11 = Object.keys(K.VESSELS).find(k => K.VESSELS[k].cls !== 'hav' && lenOf(k) >= 11 && lenOf(k) < 15), t15 = Object.keys(K.VESSELS).find(k => K.VESSELS[k].cls !== 'hav' && lenOf(k) >= 15);
    t.eq(kmBuyWhy(r9, {v:boat(t11), how:'put'}), 'len', 'lengderegelen (§ 6): en hjemmel under 11 m fra en båt under 11 m til ' + t11 + ' (' + lenOf(t11) + ' m): len');
    t.eq(kmBuyWhy({...r9, flen:12}, {v:boat(t11), how:'put'}), null, 'fra en båt på 12 m kan den flyttes til ' + lenOf(t11) + ' m');
    t.eq(kmBuyWhy({kind:'right', id:'h14', flen:14}, {v:boat(t15), how:'put'}), 'len', 'en hjemmel 14–14,9 m fra en båt under 15 m til ' + t15 + ' (' + lenOf(t15) + ' m): len');
    t.eq(kmBuyWhy({kind:'right', id:'h20', flen:20}, {v:boat(t15), how:'put'}), 'len', 'en hjemmel 20–20,9 m fra en båt under 21 m til ' + lenOf(t15) + ' m: len');
    t.eq(kmBuyWhy({kind:'right', id:'h20', flen:21}, {v:boat(t15), how:'put'}), null, 'fra en båt på 21 m til ' + lenOf(t15) + ' m: lov'); }
  t.eq(kmBuyWhy(r14, {v:empty, how:'struct'}), 'nolic', 'strukturering på en båt uten hjemmel: nolic');
  t.eq(kmBuyWhy(r9, {v:boat('sjark', L('h10')), how:'struct'}), 'group', 'strukturering under 11 m: group');
  t.eq(kmBuyWhy(r14, {v:h20b, how:'struct'}), 'group', 'strukturering mellom gruppene: group');
  t.eq(kmBuyWhy(r14, {v:hb, how:'struct'}), null, 'strukturering i samme gruppe, under taket');
  { const full = boat('sjark', L('h14', {st:[{id:'h14', kf:HJ.h14.kf * 3.8, from:y, until:y + 20}]})); t.eq(kmBuyWhy(r14, {v:full, how:'struct'}), 'cap', 'over kvotetaket: cap');
    t.eq(kmBuyWhy({...s20, kf:0.1}, {v:full, how:'struct'}), null, 'en liten strukturkvote får plass under taket'); }
  S.cash = 1000; t.eq(kmBuyWhy(r14, {v:hb, how:'struct'}, K.spendable() + 1), 'cash', 'for lite penger til budet: cash'); S.cash = 5e7;

  // ---- a sale: the sum of the quota factors in the two companies is the same before and after (put), and less exactly the 10 % cut (struct)
  { const sv = boat('sjark', L('h14', {st:[{id:'h14', kf:2, from:y - 2, until:y + 18}]})); sv.quota = {y, torsk:12000, hyse:3000, sei:1000};
    const t0 = tot(), item = kmPack({v:sv, kind:'right'}, H);
    t.ok(item && item.kind === 'right' && item.id === 'h14' && item.st.length === 1 && item.used.torsk === 12000 && item.flen > 0 && !('two' in item), 'kmPack: hjemmelen med strukturkvoten, årets fangst og lengden, ingenting om hvem', item);
    t.eq(kmTakst(item, H), kmTakst(r14, H) + kmTakst({...item.st[0], kind:'struct'}, H), 'taksten tar med strukturkvoten som følger');
    kmOut({v:sv, kind:'right'}, H); t.ok(!vget(sv, 'lic') && S.fleet.includes(sv), 'selgerens båt blir i rederiet uten hjemmelen');
    const buyer = boat('sjark'), k = kmApply(item, {v:buyer, how:'put'}, H), bl = vget(buyer, 'lic');
    t.near(tot(), t0, 1e-9, 'summen av kvotefaktorene er den samme før og etter salget (' + t0.toFixed(4) + ')');
    t.ok(bl && bl.id === 'h14' && bl.st.length === 1 && Math.abs(k - kmKf(item)) < 1e-9, 'kjøperens båt har hjemmelen og strukturkvoten', bl);
    t.eq(vget(buyer, 'quota').torsk, 12000, 'og starter året med det selgeren fisket på den (§ 29)');
    t.ok(/flyttet til/.test(S.msgs[S.msgs.length - 1].no), 'Fiskeridirektoratet sender melding');
    // structured: the right's own factor less 10 %, its structure quota as it is
    const t1 = tot(), item2 = kmPack({v:buyer, kind:'right'}, H), q0 = vget(hb, 'quota') ? vget(hb, 'quota').torsk || 0 : 0; kmOut({v:buyer, kind:'right'}, H);
    const k2 = kmApply(item2, {v:hb, how:'struct'}, H);
    t.near(tot(), t1 - HJ.h14.kf * STRUCT.cut, 1e-9, 'strukturert: summen går ned med nøyaktig 10 % av hjemmelens egen faktor (avkortingen går til gruppa)');
    t.near(k2, HJ.h14.kf * 0.9 + 2, 1e-9, 'båten får faktoren − 10 % og strukturkvoten som den var');
    t.eq(vget(hb, 'lic').st.slice(-1)[0].until, y + 18, 'strukturkvoten beholder årene sine');
    t.eq(K.withVessel(hb, () => K.quotaState().torsk) - q0, 12000, 'og fangsten på hjemmelen i år følger med');
    // a structure quota alone, from one boat to another in the same group: the sum stays
    const t2 = tot(), si = vget(hb, 'lic').st.length - 1, it3 = kmPack({v:hb, kind:'struct', i:si}, H); kmOut({v:hb, kind:'struct', i:si}, H);
    const other = boat('sjark', L('h14')); kmApply(it3, {v:other, how:'struct'}, H);
    t.near(tot(), t2 + HJ.h14.kf, 1e-9, 'en strukturkvote flyttet: summen står (pluss den nye båtens egen hjemmel)');
    t.eq(vget(other, 'lic').st[0].until, y + 18, 'uten ny avkorting og med årene som før'); }
  // the second quota falls away when the right is moved (kap. 2 § 6)
  { const t0 = tot(), it = kmPack({v:b2, kind:'right'}, H), out = kmOut({v:b2, kind:'right'}, H), e2 = boat('sjark'); kmApply(it, {v:e2, how:'put'}, H);
    t.ok(out.two === 'h8' && !vget(e2, 'lic').two, 'den andre kvoten fra den særlige ordningen følger ikke med');
    t.near(tot(), t0 - HJ.h8.kf, 1e-9, 'summen går ned med nøyaktig den andre kvotens faktor'); }

  // ---- the same right gives the same tonnes in two saves with WORLD_SEED (a year past 2026, where the stock model per save counts)
  { const H28 = (Date.UTC(2028, 4, 1) - EPOCH) / 36e5, sv = mk(WORLD_SEED); sv.t = H28 * 60; const it = {kind:'right', id:'h14', st:[{id:'h14', kf:1.3, from:2027, until:2047}]};
    const a1 = kmCod(it, H28), l1 = licQ(L('h14', {st:it.st}), H28).torsk;
    const sb = mk(WORLD_SEED); sb.t = H28 * 60; sb.cash = 1; const a2 = kmCod(it, H28), l2 = licQ(L('h14', {st:it.st}), H28).torsk;
    t.ok(a1 === a2 && a1 > 0, 'samme hjemmel gir samme tonn i to lagringer med WORLD_SEED (' + a1 + ' kg torsk i 2028)', {a1, a2});
    t.eq(l1, a1, 'og det er det båten får med licQ'); t.eq(l2, a2, 'også hos kjøperen');
    mk(12345); const a3 = kmCod(it, H28); t.ok(a3 !== a1, 'et annet frø gir en annen bestand (testen ser noe)', {a1, a3}); }

  // ---- the free right: kept two game years, then back to the register with word from the Directorate
  { S = mk(WORLD_SEED); const H0 = S.t / 60, it = {kind:'right', id:'h10', flen:10.5, st:[], landY:yearH(H0), used:{torsk:500, hyse:0, sei:0}, y:yearH(H0)}, r0 = npcReg().h10;
    t.eq(kmApply(it, {how:'free'}, H0), 0, 'en hjemmel kan bli i rederiet uten båt'); t.eq(kmFree(H0).length, 1, 'som ledig hjemmel');
    t.eq(kmWhy({free:0}, H0), null, 'den kan legges ut');
    const pk = kmPack({free:0}, H0); t.ok(pk.id === 'h10' && pk.flen === 10.5 && pk.used.torsk === 500, 'og pakkes med lengden og fangsten', pk);
    t.eq(kmFree(H0 + 2 * 8760 - 1).length, 1, 'den står til to spillår er gått');
    t.eq(kmFree(H0 + 2 * 8760).length, 0, 'så går den');
    t.eq(npcReg().h10, Math.min(K.REGN.h10, r0 + 1), 'tilbake til registeret');
    t.ok(/to år uten båt/.test(S.msgs[S.msgs.length - 1].no), 'med melding fra Fiskeridirektoratet');
    kmApply(it, {how:'free'}, H0); const e = boat('sjark'); t.eq(kmBuyWhy(kmPack({free:0}, H0), {v:e, how:'put'}), null, 'egen ledig hjemmel kan settes på egen båt');
    kmApply(kmPack({free:0}, H0), {v:e, how:'put'}, H0); kmOut({free:0}, H0); t.ok(vget(e, 'lic').id === 'h10' && kmFree(H0).length === 0, 'og er da ikke ledig lenger'); }
  // ---- from the review (08.11.2026): the same kilos never on two boats, the checks only read, a right from last year carries no catch, § 29 back
  { S = mk(WORLD_SEED); const H0 = S.t / 60, y0 = yearH(H0), sv = boat('kyst15', L('h14', {st:[{id:'h14', kf:HJ.h14.kf, from:y0, until:y0 + 15}]})); sv.quota = {y:y0, torsk:20000, hyse:0, sei:0};
    const it = kmPack({v:sv, kind:'struct', i:0}, H0); kmOut({v:sv, kind:'struct', i:0}, H0);
    t.eq(it.used.torsk + K.withVessel(sv, () => K.quotaState().torsk), 20000, 'en strukturkvote flyttet: fangsten dens går fra selgerens båt, så de samme kiloene ikke telles to ganger', {used:it.used, left:sv.quota});
    const F = kmFreeList(); F.push({id:'h9', flen:9, st:[], y:y0, H0:H0 - 20000, until:H0 - 1}, {id:'h10', flen:10, st:[], y:y0, H0, until:H0 + 9000});
    t.eq(kmWhy({free:0}, H0), 'gone', 'en ledig hjemmel som har gått ut, kan ikke legges ut'); t.eq(F.length, 2, 'og kontrollen endrer ikke lista (indeksen en side har, peker på samme hjemmel)');
    t.eq(kmPack({free:1}, H0).id, 'h10', 'pakken tar den hjemmelen indeksen peker på');
    const nx = kmPack({free:1}, H0 + 8760); t.eq(nx.used.torsk, 0, 'en ledig hjemmel fra i fjor har ingenting fisket i år');
    const e3 = boat('sjark'); kmApply({...nx, y:yearH(H0 + 8760)}, {v:e3, how:'put'}, H0 + 8760); t.eq(K.withVessel(e3, () => K.quotaState().torsk), 0, 'og kjøperen starter året på null, ikke med en oppdiktet selgerfangst');
    S = mk(WORLD_SEED); const ob = S.fleet[0]; S.openUsed = {y:yearH(H0), torsk:5000, hyse:0, sei:0};
    const it2 = {kind:'right', id:'h9', flen:9, y:yearH(H0), used:{torsk:100, hyse:0, sei:0}}; kmApply(it2, {v:ob, how:'put'}, H0); kmOut({v:ob, kind:'right'}, H0);
    t.eq({ov:K.openVesselId(), torsk:K.withVessel(ob, () => K.quotaState().torsk)}, {ov:ob.id, torsk:5000}, 'hjemmelen solgt fra båten: hun er i åpen gruppe igjen med eierens fangst der i år (§ 29)'); }
  // the messages with the page's number format (fmt is the UI's; the core falls back to its own without it)
  { const f0 = globalThis.fmt; globalThis.fmt = (v, d) => (+v).toFixed(d).replace('.', ','); let ok = true;
    try { const e = boat('sjark'); kmApply({kind:'right', id:'h9', flen:9, y, used:{torsk:1, hyse:0, sei:0}}, {v:e, how:'put'}, S.t / 60); } catch (err){ ok = String(err); }
    if (f0) globalThis.fmt = f0; else delete globalThis.fmt;
    t.ok(ok === true && /\d,\d\d tonn/.test(S.msgs[S.msgs.length - 1].no), 'meldingen bruker sidens tallformat (fmt) når den finnes', ok); }
}
