// ===== Kystmegleren: boat sales between players (B1–B8 in docs/planer/etter-tonys-test.md; Jonas 07.11.2026, V4 A, V5 A, V6 A) =====
// Jonas: «Her må vi bygge salg mellom spillere, med en liten kommisjon til skipsmegleren … båtene som ligger til salgs hos skipsmegleren
// skal utelukkende være båter andre brukere selger … quicksell … EAFC/FIFA … Om en spiller ikke finner båten han ønsker hos skipsmegleren
// skal den alltids kunne kjøpes på verftet til fullpris.» So the broker lists only the boats players put out (the NPC listings of M4, the
// boats traded in and the partner broker's boats are gone from the list), and the yard sells every type new at full price (B6).
// The listings, the bids and the money bound in them live on the server (supabase/migrations/20261107140000_broker.sql: listing_put,
// listing_bid, listing_buy, listing_cancel, listings_get, and the ledger broker_pending/broker_done). This is the game's side of it, pure
// so the unit tests can run it: the limits (the same as the server's), what goes with a boat (mbPack) and the boat a buyer gets
// (mbUnpack), the lock while she is for sale (she lies at the nearest yard and cannot sail), the quick sale to the broker at 90 % (B4),
// and the ledger rows applied to the save (mbApply). The calls to the server and the pages are ui/10s-broker.js and ui/phone/13c-megler.js.
// S.mkt = {wish:{cls, max}|null, del:[{vid, from, to, H1, kr}], mb:{done:[ledger ids applied], held:{listing:{kr, name}}}}
// (an old save's M4 fields, bought, takst, bids, deals and ti, are left as they are; its commission listings, own, are withdrawn)
const MB = {comm:0.05, quick:0.9, step:0.02, startMin:0.4, capMax:1.6, deliver:0.02, max:3, hours:[1, 6, 24, 72]};
function mktState(){ const M = S.mkt || (S.mkt = {}); if (M.wish === undefined) M.wish = null; M.mb = M.mb || {}; M.mb.done = M.mb.done || []; M.mb.held = M.mb.held || {}; return M; }
const mktYards = (() => { let Y = null; return () => Y || (Y = PORTS.filter(p => portServices(p).verft)); })();
const mktRound = p => p >= 1e6 ? Math.round(p / 25000) * 25000 : p >= 2e5 ? Math.round(p / 5000) * 5000 : Math.round(p / 1000) * 1000;
const mktKr = n => typeof kr === 'function' ? kr(n) : Math.round(n) + ' kr';   // (kr is the UI's; the unit tests run the core alone)
// the place a yard is at, without «verft» (for the cards and the push: «ved verftet i Myre»)
const mbPlace = pt => String(pt ? pt.name : '').replace(/\s+(verft|båtverft|slipp|fiskemottak|mottak|fiskebruk)$/i, '');
// the yard nearest a position: where a boat put out for sale lies until the sale is over (B1)
function mbYardNear(pos){ let best = null, bd = Infinity; for (const p of mktYards()){ const d = dist(p.p, pos); if (d < bd){ bd = d; best = p; } } return best; }
// the limits (B2): the start price from 40 % and the buy-now price up to 160 % of the boat's value; buy-now over the start
function mbBounds(value){ return {min:Math.ceil(value * MB.startMin), max:Math.floor(value * MB.capMax)}; }
function mbPriceWhy(value, start, buynow){ const B = mbBounds(value);
  if (!(start >= B.min && start <= B.max)) return 'start'; if (buynow != null && !(buynow > start && buynow <= B.max)) return 'buynow'; return null; }
// the lowest bid now: the start price, or 2 % over the highest (rounded up to the krone, as the server does)
const mbNext = L => L.top == null ? L.start : Math.ceil(L.top * (1 + MB.step) - 1e-9);
// delivery to a yard near the buyer (B3): 2 % of the price, nothing when she is fetched where she lies
const mbFee = (kr0, to, port) => to && to !== port ? Math.round(kr0 * MB.deliver) : 0;
const mbNet = kr0 => Math.round(kr0 * (1 - MB.comm));
// the quick sale (B4, V6 A): the broker buys her at once for 90 % of her value, and she is gone (not put out again)
const mbQuick = v => Math.round(vesselValue(v) * MB.quick);
// what can be sold between players: the open group and the coastal fleet (the ocean vessels and the locked types at the yard only)
const mbSellable = type => { const V = VESSELS[type]; return !!V && !V.lock && (V.cls === 'open' || V.cls === 'kyst'); };
const mbSale = v => { const b = v && vget(v, 'boat'); return (b && b.sale) || null; };
// the right's part of her value (vesselValue's 95 % of licValue), told to the server with the value
const mbLicKr = v => Math.round(licValue(vget(v, 'lic')) * 0.95);
function mbOpsOn(v){ try { return withVessel(v, () => { const o = typeof DRIFT2 !== 'undefined' && DRIFT2 && typeof plan2Ops === 'function' ? plan2Ops() : S.ops; return !!(o && o.on); }); } catch (e){ return false; } }
// why she cannot be put out for sale (a word), or null: she must lie in port with nobody aboard, an empty hold and no gear in the sea,
// the plan off, nothing under way at the yard or with a delivery skipper, and the company must keep another boat
function mbWhy(v){
  if (!v) return 'gone'; const b = vget(v, 'boat');
  if (b.sale) return 'listed'; if (v.id === S.me) return 'aboard'; if (S.fleet.length < 2) return 'only'; if (!mbSellable(b.type)) return 'type';
  if (b.status !== 'port') return 'sea'; if (b.land || b.landQ) return 'busy';
  if ((vget(v, 'hold') || []).some(x => x.kg > 0.5)) return 'hold';
  if ((S.sets || []).some(s => s.vid === v.id && !s.lost)) return 'gear';
  if ((mktState().del || []).some(d => d.vid === v.id)) return 'del';
  if (S.order && S.order.vid !== null && (S.order.vid || S.cur) === v.id) return 'order';
  if (mbOpsOn(v)) return 'ops';
  if (S.fleet.filter(x => x !== v && mbSale(x)).length >= MB.max) return 'many';
  return null;
}
// what goes with her (B1, B8): her name, year, engine hours and service, the weed, the damage, the yard's rebuilds, the equipment, the
// gear aboard, and the right with its year's catch (the vessel quota follows the boat; the open group's catch stays with the owner, § 29)
function mbPack(v, yard){
  const b = vget(v, 'boat'), V = VESSELS[b.type], eq = vget(v, 'equip') || {}, lic = vget(v, 'lic'), E = {}, r3 = x => Math.round((+x || 0) * 1000) / 1000;
  // (a tiered item, the knives and the gaff of OPP1, goes as its tier: true would be read as tier 2, and tier 3 came to the buyer as 2; OPP4)
  for (const [k, n] of Object.entries(eq)) if (EQUIP[k] && n) E[k] = EQUIP[k].multi ? Math.max(0, Math.min(99, Math.round(+n || 0))) : EQUIP[k].tiers ? equipLv(k, eq, b.type) : true;
  const L0 = lic ? Object.assign({}, lic) : null; if (L0) delete L0.coop;   // (a quota cooperation is the seller's agreement with a partner)
  return {type:b.type, name:String(vget(v, 'boatName') || V.name.no).replace(/[<>&"]/g, '').slice(0, 30), built:b.built || null, engH:Math.round(b.engH || 0), svcAt:Math.round(b.svcAt || 0),
    foul:r3(b.foul), damage:r3(b.damage), engLv:b.engLv || 0, holdLv:b.holdLv || 0, upg:b.upg || null, gear:!!b.gear, kgear:!!b.kgear, equip:E, lic:L0,
    quota:L0 ? vget(v, 'quota') || null : null, pgear:vget(v, 'pgear') || null, at:yard ? mbPlace(yard) : ''};
}
// her state in a few numbers for the card (as M4's Tilstand): the hull by the weed and the damage, the engine by the hours since service
function mbCond(P){ const V = VESSELS[P.type] || {svcH:500}, svc = clamp(((P.engH || 0) - (P.svcAt || 0)) / Math.max(1, V.svcH || 500), 0, 1.5);
  return {hull:clamp(1 - 0.6 * (P.foul || 0) - (P.damage || 0), 0.05, 1), motor:clamp(1 - 0.4 * svc, 0.3, 1)}; }
// the boat the buyer gets: a vessel of her type in his fleet at the port, with what came with her
function mbUnpack(P, port){
  if (!P || !VESSELS[P.type] || !portById(port)) return null;
  const V = VESSELS[P.type], lic = P.lic && typeof P.lic === 'object' && P.lic.id ? Object.assign({}, P.lic) : null, v = newVesselObj(P.type, port, lic), b = v.boat;
  v.boatName = String(P.name || '').replace(/[<>&"]/g, '').slice(0, 30) || v.boatName;
  if (P.built) b.built = Math.round(+P.built) || undefined;
  b.engH = Math.max(0, Math.round(+P.engH || 0)); b.svcAt = Math.max(0, Math.round(+P.svcAt || 0)); b.foul = clamp(+P.foul || 0, 0, 1); if (+P.damage > 0) b.damage = clamp(+P.damage, 0, 1);
  b.engLv = clamp(Math.round(+P.engLv || 0), 0, ENGUP.length); b.holdLv = V.cls === 'hav' ? 0 : clamp(Math.round(+P.holdLv || 0), 0, HOLDUP.length);
  if (P.upg && typeof P.upg === 'object'){ const u = {}; for (const [k, n] of Object.entries(P.upg)) if (UPGS[k]) u[k] = clamp(Math.round(+n || 0), 0, UPGS[k].steps.length); b.upg = u; }
  b.gear = !!P.gear; if (P.kgear) b.kgear = true;
  for (const [k, x] of Object.entries(P.equip || {})) if (EQUIP[k] && x && equipFits(k, P.type)){
    if (EQUIP[k].tiers){ const lv = equipLv(k, {[k]:x}, P.type); if (lv > 1) v.equip[k] = lv; continue; }   // (the tier as it was, 2 or 3; tier 1 is no field)
    v.equip[k] = EQUIP[k].multi ? Math.min(V.jukseMax || 0, Math.max(0, Math.round(+x || 0))) : true; }
  if (lic && P.quota && typeof P.quota === 'object') v.quota = Object.assign({}, P.quota);
  if (P.pgear && typeof P.pgear === 'object') v.pgear = JSON.parse(JSON.stringify(P.pgear));
  return v;
}
// she is put out (the server said yes, r = {id, until}): moved to the yard and locked there until the sale is over
function mbLock(v, r, o, yard){
  const b = vget(v, 'boat');
  if (yard && b.port !== yard.id){ b.port = yard.id; b.pos = {x:yard.p.x, y:yard.p.y}; const tr = vget(v, 'trail'); if (Array.isArray(tr)) tr.push({x:yard.p.x, y:yard.p.y, port:yard.id}); }
  b.status = 'port'; b.sale = {lid:r.id, until:Date.parse(r.until) || Date.now() + o.hours * 3600e3, start:o.start, buynow:o.buynow || null, hours:o.hours, port:b.port, value:o.value};
}
// why you cannot bid on or buy a listing L (from listings_get), or null: not your own; a right needs blad B (deltakerloven § 6, as at the
// yard); a company with no right can have one boat in the open group only (as the yard); and the money (kr: what the bid binds)
function mbBuyWhy(L, kr0){
  if (!L) return 'gone'; if (L.mine) return 'own'; const V = VESSELS[L.type]; if (!V) return 'gone';
  const lic = L.vessel && L.vessel.lic && L.vessel.lic.id;
  if (lic && !bladB()) return 'bladb';
  if (!lic && V.len < 11 && !S.fleet.some(v => vget(v, 'lic'))) return 'open';
  if (kr0 != null && spendable() < kr0) return 'cash';
  return null;
}
// the wish (B5): the listings that suit it (the group, and the lowest bid or buy-now within the top price), not your own
function mbWishHits(list){ const W = mktState().wish; if (!W) return [];
  return (list || []).filter(L => !L.mine && VESSELS[L.type] && (!W.cls || VESSELS[L.type].cls === W.cls) && Math.min(mbNext(L), L.buynow || Infinity) <= W.max); }
// ---- the quick sale (B4): to the broker for 90 % of her value, at once, from anywhere she lies in port; the loans are paid first
function mbQuickWhy(v){ if (!v) return 'gone'; const b = vget(v, 'boat'); if (b.sale) return 'listed'; if (v.id === S.me) return 'aboard'; if (S.fleet.length < 2) return 'only';
  if (b.status !== 'port') return 'sea'; if (S.order && S.order.vid !== null && (S.order.vid || S.cur) === v.id) return 'order'; return null; }
// a boat leaving the fleet (sold): followed, she gives way to the boat you are aboard; the open group's catch follows the owner (§ 29);
// a delivery of her is off
function mbDrop(v){
  if (v.id === S.me){ const o = S.fleet.find(x => x !== v); if (!o) return false; S.me = o.id; }
  if (v.id === S.cur){ bindVessel(vesselById(S.me)); if (typeof G3 !== 'undefined' && G3.vesselChanged) G3.vesselChanged(); }
  if (v.id === openVesselId()) openUsedSave(vget(v, 'quota'));
  const M = mktState(); if (M.del) M.del = M.del.filter(d => d.vid !== v.id);
  S.fleet.splice(S.fleet.indexOf(v), 1); return true;
}
function mbQuickSell(vid){
  const v = vesselById(vid), why = mbQuickWhy(v); if (why) return why;
  const val = mbQuick(v), nm = vget(v, 'boatName'), hands = (vget(v, 'crew') || []).length, lic = vget(v, 'lic');
  if (!mbDrop(v)) return 'only';
  if (lic && typeof regFree === 'function') regFree(lic.id);   // the broker keeps her: the right goes back to the owners ashore
  const paid = payDown(val); book('baat', val - paid, 'Båt solgt til Kystmegleren', 'Vessel sold to Kystmegleren');
  log('Solgte «' + nm + '» til Kystmegleren for ' + mktKr(val) + '.' + (paid ? ' ' + mktKr(paid) + ' gikk til å innfri lån.' : '') + (hands ? ' Mannskapet hennes gikk i land.' : ''),
    'Sold the «' + nm + '» to Kystmegleren for ' + mktKr(val) + '.' + (paid ? ' ' + mktKr(paid) + ' went to pay off loans.' : '') + (hands ? ' Her crew went ashore.' : ''));
  return null;
}
// ---- the ledger (broker_pending): every krone bound, given back or paid, every boat handed over, applied once (S.mkt.mb.done keeps
// the ids also when broker_done did not reach the server). Returns the ids applied. Rows: bid and buy (kr < 0, money bound), release
// (a bid back: outbid, bought by another, or the sale called off), boat (the boat won, at the yard where she lay, or sailed to the yard
// chosen for 2 %), paid (yours is sold: the price less 5 %, the loans paid first), back (yours was not sold, or you took her back)
function mbApply(rows){
  const M = mktState(), D = M.mb.done, out = [], now = S.t / 60;
  for (const r of rows || []){
    if (!r || r.id == null) continue;
    if (D.includes(r.id)){ out.push(r.id); continue; }
    const d = r.data || {}, nm = '«' + String(d.name || '').replace(/[<>&"]/g, '').slice(0, 30) + '»', k = Math.round(+r.kr || 0);
    if (r.kind === 'bid'){ book('baat', k, 'Bud hos Kystmegleren på ' + nm, 'Bid at Kystmegleren on ' + nm); M.mb.held[r.listing] = {kr:-k, name:d.name || ''}; }
    else if (r.kind === 'buy') book('baat', k, 'Kjøpt hos Kystmegleren: ' + nm, 'Bought at Kystmegleren: ' + nm);
    else if (r.kind === 'release'){
      book('baat', k, 'Bud tilbake fra Kystmegleren: ' + nm, 'Bid back from Kystmegleren: ' + nm); delete M.mb.held[r.listing];
      if (d.why === 'outbid') msg('Kystmegleren', 'Du er overbydd på ' + nm + ' med ' + mktKr(d.by) + '. Budet ditt på ' + mktKr(k) + ' er tilbake på konto.', 'You have been outbid on ' + nm + ' with ' + mktKr(d.by) + '. Your bid of ' + mktKr(k) + ' is back in your account.');
      else if (d.why === 'bought') msg('Kystmegleren', nm + ' ble kjøpt for «Kjøp nå». Budet ditt på ' + mktKr(k) + ' er tilbake på konto.', nm + ' was bought at the buy-now price. Your bid of ' + mktKr(k) + ' is back in your account.');
      else msg('Kystmegleren', 'Salget av ' + nm + ' er avlyst. Budet ditt på ' + mktKr(k) + ' er tilbake på konto.', 'The sale of ' + nm + ' is called off. Your bid of ' + mktKr(k) + ' is back in your account.');
    }
    else if (r.kind === 'boat'){
      delete M.mb.held[r.listing];
      const from = portById(d.from) ? d.from : portById(d.port) ? d.port : null, to = portById(d.port) ? d.port : from, v = from && mbUnpack(d.vessel, from);
      if (!v){ out.push(r.id); D.push(r.id); continue; }
      const ov = v.lic ? openVesselId() : null;   // (a right in the company: the open-group boat's catch follows the owner, § 29, as at the yard)
      if (ov && ov !== v.id){ const o = vesselById(ov); if (o) openUsedSave(vget(o, 'quota')); }
      let where = ['Hun ligger ved verftet i ' + mbPlace(portById(from)) + '.', 'She lies at the yard in ' + mbPlace(portById(from)) + '.'];
      if (to !== from){ const nmi = dist(portById(from).p, portById(to).p) / NM, H1 = now + 2 + nmi / 8; M.del = M.del || []; M.del.push({vid:v.id, from, to, H1, kr:0});
        where = ['En skipper fra megleren seiler henne til verftet i ' + mbPlace(portById(to)) + ', framme om ' + Math.max(1, Math.round(H1 - now)) + ' timer.', 'A skipper from the broker sails her to the yard in ' + mbPlace(portById(to)) + ', there in ' + Math.max(1, Math.round(H1 - now)) + ' hours.']; }
      msg('Kystmegleren', 'Du kjøpte ' + nm + ' for ' + mktKr(d.price) + '. ' + where[0], 'You bought ' + nm + ' for ' + mktKr(d.price) + '. ' + where[1]);
      log('Kjøpte «' + v.boatName + '» hos Kystmegleren for ' + mktKr(d.price) + '.', 'Bought the «' + v.boatName + '» at Kystmegleren for ' + mktKr(d.price) + '.');
      if (typeof achAdd === 'function') achAdd('boat');
      M.mb.got = {vid:v.id, t:S.t};
    }
    else if (r.kind === 'paid'){
      const v = vesselById(d.vid), sale = mbSale(v), mine = v && ((sale && sale.lid === r.listing) || vget(v, 'boatName') === d.name);
      const gone = mine && mbDrop(v), paid = payDown(k);
      book('baat', k - paid, 'Båt solgt hos Kystmegleren: ' + nm, 'Vessel sold at Kystmegleren: ' + nm);
      msg('Kystmegleren', nm + ' er solgt for ' + mktKr(d.price) + '. Du fikk ' + mktKr(k) + ' etter megleren (5 %).' + (paid ? ' ' + mktKr(paid) + ' gikk til å innfri lån.' : ''),
        nm + ' is sold for ' + mktKr(d.price) + '. You got ' + mktKr(k) + ' after the broker (5 %).' + (paid ? ' ' + mktKr(paid) + ' went to pay off loans.' : ''));
      log('Kystmegleren solgte ' + nm + ' for ' + mktKr(d.price) + '.' + (gone ? '' : ' Båten fantes ikke i denne lagringen.'), 'Kystmegleren sold ' + nm + ' for ' + mktKr(d.price) + '.' + (gone ? '' : ' The boat was not in this save.'));
    }
    else if (r.kind === 'back'){
      const v = vesselById(d.vid); if (v){ const b = vget(v, 'boat'); if (b.sale && (b.sale.lid === r.listing || !b.sale.lid)) delete b.sale; }
      if (d.why !== 'cancelled') msg('Kystmegleren', nm + ' ble ikke solgt, og er din igjen. Hun ligger ved verftet.', nm + ' was not sold, and is yours again. She lies at the yard.');
    }
    D.push(r.id); out.push(r.id);
  }
  if (D.length > 300) D.splice(0, D.length - 300);
  return out;
}
// ---- delivery (10.2b «Få henne levert»): a skipper from the yard sails a boat of yours that nobody is aboard to the port you choose, for
// game money by the distance; she is away while he sails her (8 knots, two hours to make ready). S.mkt.del = [{vid, from, to, H1, kr}]
// (the broker's delivery of a boat bought, B3, is the same sailing, paid as 2 % with the bid: kr 0 here)
const mktDelKr = nm => Math.round((2000 + 80 * nm) / 100) * 100;
function mktDelWhy(v, to){ if (!v) return 'gone'; if (v.id === S.me) return 'aboard'; const b = vget(v, 'boat'); if (b.sale) return 'sale'; if (b.status !== 'port') return 'sea'; if (b.port === to) return 'there'; if ((mktState().del || []).some(d => d.vid === v.id)) return 'busy'; if (!portById(to)) return 'port'; return null; }
function mktDeliver(vid, to){
  const v = vesselById(vid), why = mktDelWhy(v, to); if (why) return why; const b = vget(v, 'boat'), nm = dist(b.pos, portById(to).p) / NM, kr0 = mktDelKr(nm);
  if (spendable() < kr0) return 'cash'; book('baat', -kr0, 'Levering av «' + vget(v, 'boatName') + '»', 'Delivery of «' + vget(v, 'boatName') + '»');
  const M = mktState(); M.del = M.del || []; M.del.push({vid, from:b.port, to, H1:S.t / 60 + 2 + nm / 8, kr:kr0}); return null;
}
// once an hour (05-vessels.js): the deliveries that are there; and an old save's commission listings (M4, sold to NPC fishermen) withdrawn
function mktHour(H){
  const M = mktState();
  for (const d of (M.del || []).slice()){ const v = vesselById(d.vid); if (!v){ M.del.splice(M.del.indexOf(d), 1); continue; }
    // you went aboard her, or her plan took her out: the delivery is off, and the yard pays back
    if (v.id === S.me || vget(v, 'boat').status !== 'port' || vget(v, 'boat').port !== d.from){ M.del.splice(M.del.indexOf(d), 1); if (d.kr) book('baat', d.kr, 'Levering avlyst', 'Delivery called off'); log('Leveringen av «' + vget(v, 'boatName') + '» ble avlyst' + (d.kr ? ', og verftet betalte tilbake ' + mktKr(d.kr) : '') + '.', 'The delivery of «' + vget(v, 'boatName') + '» was called off' + (d.kr ? ', and the yard paid back ' + mktKr(d.kr) : '') + '.'); continue; }
    if (H >= d.H1){ const b = vget(v, 'boat'), q = portById(d.to); b.port = d.to; b.pos = {x:q.p.x, y:q.p.y}; b.status = 'port'; const tr = vget(v, 'trail'); if (Array.isArray(tr)) tr.push({x:q.p.x, y:q.p.y, port:d.to});
      M.del.splice(M.del.indexOf(d), 1); log('«' + vget(v, 'boatName') + '» er levert i ' + q.name + '.', '«' + vget(v, 'boatName') + '» has been delivered at ' + q.name + '.'); } }
  if (M.own && M.own.length){ for (const o of M.own){ const v = vesselById(o.vid); if (v) log('Kystmegleren selger nå bare båter mellom spillere: «' + vget(v, 'boatName') + '» er trukket fra salg. Legg henne ut igjen i Rederi-appen.', 'Kystmegleren now sells only boats between players: the «' + vget(v, 'boatName') + '» is withdrawn. Put her out again in the Company app.'); } M.own = []; }
}
