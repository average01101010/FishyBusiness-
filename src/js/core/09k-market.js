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
const mbQuick = v => Math.round(mbValue(v) * MB.quick);
// what can be sold between players: the open group and the coastal fleet (the ocean vessels and the locked types at the yard only)
const mbSellable = type => { const V = VESSELS[type]; return !!V && !V.lock && (V.cls === 'open' || V.cls === 'kyst'); };
const mbSale = v => { const b = v && vget(v, 'boat'); return (b && b.sale) || null; };
// the right as it leaves with a boat sold (KM4): without the quota cooperation (the seller's agreement with a partner) and without the
// second quota from the special scheme under 11 m, which falls away when the vessel is sold for continued fishing, replaced or the right
// moved (kvoteforskriften kap. 2 § 6: «faller kvote for deltakeradgang som er oppgitt etter § 4 annet ledd bokstav c bort»)
function mbLicSold(lic){ if (!lic) return null; const L0 = Object.assign({}, lic); delete L0.coop; if (L0.two){ delete L0.two; if (HJ[L0.id]) licExtra(L0); } return L0; }
// the right's part of her value (vesselValue's 95 % of licValue), told to the server with the value; without the second quota
const mbLicKr = v => Math.round(licValue(mbLicSold(vget(v, 'lic'))) * 0.95);
// her value at a sale (the broker's listing, the quick sale, the yard's trade-in): vesselValue, less the part of it that is the second
// quota or the partner's quota in a cooperation this year, neither of which the buyer gets
function mbValue(v){ const l = vget(v, 'lic'); return l && (l.two || l.coop) ? vesselValue(v) - Math.round(licValue(l) * 0.95) + mbLicKr(v) : vesselValue(v); }
function mbOpsOn(v){ try { return withVessel(v, () => { const o = plan2Ops(); return !!(o && o.on); }); } catch (e){ return false; } }
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
  const L0 = mbLicSold(lic);   // (no quota cooperation and no second quota from the special scheme; a boat sold «uten hjemmel» has none: mbMove first, KM4)
  return {type:b.type, name:String(vget(v, 'boatName') || V.name.no).replace(/[<>&"]/g, '').slice(0, 30), built:b.built || null, engH:Math.round(b.engH || 0), svcAt:Math.round(b.svcAt || 0),
    foul:r3(b.foul), damage:r3(b.damage), engLv:b.engLv || 0, propLv:propLvOf(b), holdLv:b.holdLv || 0, upg:b.upg || null, gear:!!b.gear, kgear:!!b.kgear, equip:E, lic:L0,
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
  b.engLv = clamp(Math.round(+P.engLv || 0), 0, ENGUP.length); const pl = propFits(V) ? clamp(Math.round(+P.propLv || 0), 0, PROPUP.length) : 0; if (pl) b.propLv = pl;   // (the propeller is the hull's, OPP3; a sale from before has none)
  b.holdLv = V.cls === 'hav' ? 0 : clamp(Math.round(+P.holdLv || 0), 0, HOLDUP.length);
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
  if (o.kept) b.sale.kept = o.kept;   // (KM4: put out without her right, which stayed in the company: {vid} the boat it went to, or {free:true})
}
// ---- KM4 (docs/planer/kvotemarkedet.md kap. 4.4; Jonas 07.11.2026, V2 A: the seller chooses whether the right follows the boat, taking
// over for continued fishing, or stays in the company, replacement or a free right for at most two game years). The right with its
// structure quotas and the year's catch on it moves from a boat of yours to another (the length rule kmLenWhy decides which can take it)
// or becomes a free right (kmFreeAdd), and a free right moves to a boat. It is the quota market's own goods and steps (kmPack, kmOut,
// kmApply in 03i-kvotemarked.js) with nobody else in it, so the register is not touched and nothing is paid. The second quota from the
// special scheme falls away here too (kap. 2 § 6: «ved utskifting av fartøy»); the quota cooperation holds the right where it is.
// src = {v} a boat's right or {free:i}; to = {v} or {free:true}. Why not (a word), or null:
//   gone, none, hav, listed (she or the free right is for sale), sea, busy, coop, order (being traded in), same, boat, type (an ocean
//   vessel), tolisted (the boat it would go to is for sale), haslic, len (the length rule; mbMoveLen gives the limit)
const mbSrc = src => src.free != null ? {free:src.free} : {v:src.v, kind:'right'};
function mbMoveWhy(src, to, H){
  H = H == null ? S.t / 60 : H; if (!src || !to) return 'gone';
  const s = mbSrc(src), w = kmWhy(s, H); if (w) return w;
  if (s.free != null && kmState().out[kmKey(s)]) return 'listed';
  if (s.v && S.order && S.order.vid !== null && (S.order.vid || S.cur) === s.v.id) return 'order';
  // (as when it is put out in the quota market, kmPutWhy: what lies in her hold was caught on the right and must be landed on it, and a
  // plan that is on would take her out without it)
  if (s.v && (vget(s.v, 'hold') || []).some(x => x.kg > 0.5)) return 'hold';
  if (s.v && mbOpsOn(s.v)) return 'ops';
  if (to.free) return s.free != null ? 'same' : null;
  const v = to.v; if (!v || !S.fleet.includes(v)) return 'boat'; if (v === s.v) return 'same';
  const b = vget(v, 'boat'), V = VESSELS[b.type]; if (!V || V.cls === 'hav') return 'type'; if (b.sale) return 'tolisted'; if (vget(v, 'lic')) return 'haslic';
  if (kmLenWhy(kmPack(s, H), V.len)) return 'len';
  return null;
}
// the limit of the length rule that stops a move (11, 15 or 21 m), or 0
function mbMoveLen(src, to, H){ const it = kmPack(mbSrc(src), H == null ? S.t / 60 : H), V = to && to.v && VESSELS[vget(to.v, 'boat').type]; return it && V ? kmLenWhy(it, V.len) : 0; }
// what is fished on a boat's quota this year, for the promise below
const mbFished = v => { const q = vget(v, 'quota'); return q ? {y:q.y, n:(q.torsk || 0) + (q.hyse || 0) + (q.sei || 0)} : {y:0, n:0}; };
// the move. Returns {ok, two (the second quota that fell away, or null), item, undo}. undo (a boat's right only) takes the move back when
// the listing it was made for was refused (10s-broker.js put): it reverses just what the move did, so what happened meanwhile stands.
//  - The owner's catch follows the owner (§ 29): when the right leaves the last boat that had one, the company's open-group boat (she
//    or another) starts the open group with what was fished on the right this year, so the same year is not fished twice by taking the
//    right off and putting it back.
//  - The promise is two years once (§ 7): a free right put on a boat and taken off again before anything is landed on it keeps its old
//    date (lic.fu = {until, y, n}); fished on, it is a right in use, and the next promise is a new one.
function mbMove(src, to, H){
  H = H == null ? S.t / 60 : H; const w = mbMoveWhy(src, to, H); if (w) return {err:w};
  const s = mbSrc(src), cp = x => x == null ? x : JSON.parse(JSON.stringify(x));
  const f0 = s.free != null ? kmFreeList()[s.free] : null, old = f0 || vget(s.v, 'lic'), keep = {since:old.since, from:old.from, kpk:old.kpk}, nm = s.v ? vget(s.v, 'boatName') : null;
  let fu = f0 ? {until:f0.until} : old.fu || null;
  if (s.v && fu){ const g = mbFished(s.v); if (g.y > fu.y ? g.n > 0 : g.n > fu.n) fu = null; }   // (landed on since it came from a free right: the promise is spent)
  const q0 = s.v ? cp(vget(s.v, 'quota')) : null, qt0 = to.v ? cp(vget(to.v, 'quota')) : null, O0 = cp(S.openUsed), M0 = new Set(S.msgs);
  const item = kmPack(s, H), out = item && kmOut(s, H); if (!out) return {err:'gone'};
  // (the company has no right on a boat now: the boat that is its open-group boat, she or another, starts from what was fished on the right)
  { const ov = s.v ? openVesselId() : null, y = yearH(H), u = item.used || {};
    if (ov){ const O = S.openUsed && S.openUsed.y === y ? S.openUsed : (S.openUsed = {y, torsk:0, hyse:0, sei:0}); for (const sp of ['torsk', 'hyse', 'sei']) O[sp] = Math.max(O[sp] || 0, u[sp] || 0); withVessel(vesselById(ov), () => openUsedLoad()); } }
  const R = HJ[item.id], two = out.two && HJ[out.two] ? out.two : null;
  const twoNo = two ? ' Den andre kvoten fra den særlige ordningen (' + HJ[two].hl + ') falt bort, slik den gjør når hjemmelen flyttes (kvoteforskriften kap. 2 § 6).' : '';
  const twoEn = two ? ' The second quota from the special scheme (' + HJ[two].hl + ') fell away, as it does when the right is moved (kvoteforskriften kap. 2 § 6).' : '';
  let f = null;
  if (to.free){ f = kmFreeAdd(item, H); for (const k of Object.keys(keep)) if (keep[k] != null) f[k] = keep[k]; if (fu) f.until = Math.min(f.until, fu.until);
    msg('Fiskeridirektoratet', 'Hjemmelen ' + R.hl + ' er tatt av «' + nm + '» og står uten båt i rederiet' + ((item.st || []).length ? ', med strukturkvotene sine' : '') + '. Tilsagnet gjelder ' + (fu ? 'til ' + mbDay(f.until) : 'i to år') + ': sett den på en båt, legg den ut i Kvotemarkedet eller selg den til registeret før det.' + twoNo,
      'The ' + R.hl + ' quota length right has been taken off the «' + nm + '» and stands without a boat in the company' + ((item.st || []).length ? ', with its structure quotas' : '') + '. The promise holds ' + (fu ? 'until ' + mbDay(f.until) : 'for two years') + ': put it on a boat, put it out in the quota market or sell it to the register before then.' + twoEn); }
  else { kmApply(item, {v:to.v, how:'put'}, H); const l = vget(to.v, 'lic'); if (l){ for (const k of Object.keys(keep)) if (keep[k] != null) l[k] = keep[k]; if (fu){ const g = mbFished(to.v); l.fu = {until:fu.until, y:g.y, n:g.n}; } }
    if (two) msg('Fiskeridirektoratet', twoNo.trim(), twoEn.trim()); }
  const added = S.msgs.filter(m => !M0.has(m)), u0 = item.used || {};
  const undo = !s.v ? null : () => {
    // what was landed on the right where it went, while the listing was asked for (the target of a move can be at sea), stays on the right
    const d = {torsk:0, hyse:0, sei:0};
    if (f){ const F = kmFreeList(), i = F.indexOf(f); if (i >= 0) F.splice(i, 1); }
    else withVessel(to.v, () => { const q = S.quota; if (q && S.lic) for (const sp of Object.keys(d)) d[sp] = Math.max(0, (q[sp] || 0) - (u0[sp] || 0)); S.lic = null; S.quota = qt0; });
    withVessel(s.v, () => { S.lic = old; S.quota = q0; if (q0) for (const sp of Object.keys(d)) q0[sp] = (q0[sp] || 0) + d[sp]; });
    S.openUsed = O0; S.msgs = S.msgs.filter(m => !added.includes(m)); };
  return {ok:true, two, item, undo};
}
// a date for a message (the core has no month names; the pages write the date in words)
const mbDay = H => { const d = gDate(H); return d.getUTCDate() + '.' + (d.getUTCMonth() + 1) + '.' + d.getUTCFullYear(); };
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
// ---- the quota market in the save (KM3 of docs/planer/kvotemarkedet.md; the goods and the rules are core/03i-kvotemarked.js, the server
// supabase/migrations/20261108230000_kvotemarked.sql, the calls ui/10t-kvotemarked.js, the pages ui/phone/04b-kvotemarked.js) ----
// S.mkt.km = {to:{listing:{vid, how, t}} the boat the buyer chose when he bid, out:{key:{lid, until, kind, id, start, buynow, hours, value}}
//   what this company has out, wait:{row:{listing, item, price}} a structure quota won that no boat can take yet, wish, told}
function kmState(){ const K = mktState().km || (mktState().km = {}); K.to = K.to || {}; K.out = K.out || {}; K.wait = K.wait || {}; return K; }
// the seller's key for a good (km_put's vid, at most 16 characters, the same for as long as the good lies out): the boat's id for her
// right, the boat's id, «/» and the structure quota's quota length and first year (never its index in l.st, which moves when one runs
// out), and «f», the quota length and the hour it became free for a right without a boat
const kmFreeKey = f => 'f' + f.id + '.' + Math.round(f.H0 || 0).toString(36);
function kmKey(src){
  if (!src) return null; if (src.free != null){ const f = kmFreeList()[src.free]; return f ? kmFreeKey(f) : null; }
  const v = src.v, l = v && vget(v, 'lic'); if (!l) return null; if (src.kind === 'right') return v.id;
  const s = src.kind === 'struct' && (l.st || [])[src.i]; return s ? v.id + '/' + s.id + '.' + s.from : null;
}
// the good behind a key (item: what the server holds, to tell two structure quotas of the same length and year apart), or null
function kmSrcOf(key, item){
  key = String(key || ''); if (!key) return null;
  if (key[0] === 'f'){ const i = kmFreeList().findIndex(f => kmFreeKey(f) === key); return i < 0 ? null : {free:i}; }
  const [vid, sk] = key.split('/'), v = vesselById(vid), l = v && vget(v, 'lic'); if (!l || !HJ[l.id]) return null;
  if (sk == null) return {v, kind:'right'};
  const st = l.st || [], hit = (s, exact) => s.id + '.' + s.from === sk && (!exact || !item || (Math.abs(s.kf - item.kf) < 1e-6 && s.until === item.until));
  let i = st.findIndex(s => hit(s, true)); if (i < 0) i = st.findIndex(s => hit(s, false)); return i < 0 ? null : {v, kind:'struct', i};
}
// why it cannot be put out: what lies out already is locked, then kmWhy's reasons, a catch in the hold (it must be landed first, so what
// is landed on the right stands when it is packed), and a boat with her plan running, which would only try to leave
function kmPutWhy(src, H){
  const key = kmKey(src); if (key && kmState().out[key]) return 'listed';
  const w = kmWhy(src, H); if (w) return w;
  // (nothing may be landed on it after it is packed: the hold empty before, and she cannot leave port while it is out)
  if (src.v && (vget(src.v, 'hold') || []).some(x => x.kg > 0.5)) return 'hold';
  if (src.v && mbOpsOn(src.v)) return 'ops';
  if (S.fleet.filter(mbSale).length + Object.keys(kmState().out).filter(k => k[0] === 'f').length >= MB.max) return 'many';
  return null;
}
// the lock while a good lies out (r = {id, until}; id null until the server has said yes): the boat lies in port with b.sale, as a boat at
// Kystmegleren does (kmWhy, depart and the yard read it), and her hold was empty (kmPutWhy), so nothing more is landed on the right
// after it was packed; a free right is locked by its key alone. key: the one the server holds, when the good was found by it
function kmLock(src, r, o, key){
  const K = kmState(); key = key || kmKey(src); if (!key) return null;
  const until = Date.parse(r.until) || Date.now() + o.hours * 3600e3, it = o.item || {};
  K.out[key] = {lid:r.id, until, kind:it.kind, id:it.id, start:o.start, buynow:o.buynow || null, hours:o.hours, value:o.value};
  if (src.v){ const b = vget(src.v, 'boat'); b.sale = {lid:r.id, until, start:o.start, buynow:o.buynow || null, hours:o.hours, port:b.port, value:o.value, km:it.kind, key}; }
  return key;
}
function kmUnlock(key, lid){
  const K = kmState(); key = String(key || ''); if (K.out[key] && (lid == null || K.out[key].lid === lid || K.out[key].lid == null)) delete K.out[key];
  const v = key[0] === 'f' ? null : vesselById(key.split('/')[0]), b = v && vget(v, 'boat');
  if (b && b.sale && b.sale.km && (b.sale.key === key || !b.sale.key) && (lid == null || b.sale.lid === lid || b.sale.lid == null)) delete b.sale;
}
// a quota row of the ledger (lk right or struct). The buyer: bid and buy bind the money, release gives it back; the good itself (kind right
// or struct, kr 0) goes to kmApply with the boat he chose when he bid. A right that can no longer be put where it was to go becomes a
// free right in the company (two years); a structure quota no boat can take is held, not marked done, until he chooses one that can
// ('wait'). The seller: paid is the price less 5 % and the good leaves (kmOut), back unlocks it. The game calls neither regTake nor
// regFree: the server moves the place in the register (broker_reg_move). The loans are not paid down: the boat is still the company's
function mbKm(r, d, k, M){
  const K = kmState(), nm = String(d.name || '').replace(/[<>&"]/g, '').slice(0, 40), item = d.item && HJ[d.item.id] ? d.item : null;
  if (r.kind === 'bid'){ book('baat', k, 'Bud i Kvotemarkedet: ' + nm, 'Bid in the quota market: ' + nm); M.mb.held[r.listing] = {kr:-k, name:d.name || '', km:1}; }
  else if (r.kind === 'buy') book('baat', k, 'Kjøpt i Kvotemarkedet: ' + nm, 'Bought in the quota market: ' + nm);
  else if (r.kind === 'release'){
    book('baat', k, 'Bud tilbake fra Kvotemarkedet: ' + nm, 'Bid back from the quota market: ' + nm); delete M.mb.held[r.listing];
    if (d.why === 'outbid') msg('Kvotemarkedet', 'Du er overbydd på ' + nm + ' med ' + mktKr(d.by) + '. Budet ditt på ' + mktKr(k) + ' er tilbake på konto.', 'You have been outbid on ' + nm + ' with ' + mktKr(d.by) + '. Your bid of ' + mktKr(k) + ' is back in your account.');
    else if (d.why === 'bought') msg('Kvotemarkedet', nm + ' ble kjøpt for «Kjøp nå». Budet ditt på ' + mktKr(k) + ' er tilbake på konto.', nm + ' was bought at the buy-now price. Your bid of ' + mktKr(k) + ' is back in your account.');
    else msg('Kvotemarkedet', 'Salget av ' + nm + ' er avlyst. Budet ditt på ' + mktKr(k) + ' er tilbake på konto.', 'The sale of ' + nm + ' is called off. Your bid of ' + mktKr(k) + ' is back in your account.');
  }
  else if (r.kind === 'right' || r.kind === 'struct'){
    delete M.mb.held[r.listing]; if (!item) return null;
    const to = K.to[r.listing], v = to && vesselById(to.vid), fits = !!v && !kmBuyWhy(item, {v, how:to.how}, null);
    let got = fits ? kmApply(item, {v, how:to.how}) : null, how = fits && got != null ? to.how : null;
    if (got == null && item.kind === 'right'){
      got = kmApply(item, {how:'free'}); how = 'free';
      msg('Fiskeridirektoratet', 'Hjemmelen ' + HJ[item.id].hl + ' kunne ikke settes på båten du valgte. Den står som ledig hjemmel i rederiet i to år: sett den på en båt, legg den ut eller selg den til registeret, i Kvote → Marked → Dine.',
        'The ' + HJ[item.id].hl + ' quota length right could not be put on the boat you chose. It stands as a free right in the company for two years: put it on a boat, put it out or sell it to the register, in Quota → Market → Yours.');
    }
    if (got == null){
      if (!K.wait[r.id]) msg('Kvotemarkedet', 'Du kjøpte ' + nm + ' for ' + mktKr(d.price) + ', men båten du valgte, kan ikke ta strukturkvoten nå. Velg en båt i samme gruppe med plass under kvotetaket, i Kvote → Marked → Dine.',
        'You bought ' + nm + ' for ' + mktKr(d.price) + ', but the boat you chose cannot take the structure quota now. Choose a boat in the same group with room under the quota cap, in Quota → Market → Yours.');
      K.wait[r.id] = {listing:r.listing, item, price:d.price || 0}; return 'wait';
    }
    delete K.to[r.listing]; delete K.wait[r.id];
    const nb = how === 'free' ? '' : '«' + vget(v, 'boatName') + '»';
    log('Kjøpte ' + nm + ' i Kvotemarkedet for ' + mktKr(d.price) + (how === 'put' ? ', satt på ' + nb + '.' : how === 'struct' ? ', strukturert inn på ' + nb + '.' : ', ledig hjemmel i rederiet.'),
      'Bought ' + nm + ' in the quota market for ' + mktKr(d.price) + (how === 'put' ? ', put on the ' + nb + '.' : how === 'struct' ? ', structured onto the ' + nb + '.' : ', a free right in the company.'));
  }
  else if (r.kind === 'paid'){
    const src = kmSrcOf(d.vid, item), o = src ? kmOut(src) : null; kmUnlock(d.vid, r.listing);
    book('baat', k, 'Solgt i Kvotemarkedet: ' + nm, 'Sold in the quota market: ' + nm);
    msg('Kvotemarkedet', nm + ' er solgt for ' + mktKr(d.price) + '. Du fikk ' + mktKr(k) + ' etter 5 % til markedet. Fiskeridirektoratet har godkjent overføringen.' + (o && o.two ? ' Den andre kvoten fra den særlige ordningen falt bort.' : ''),
      nm + ' is sold for ' + mktKr(d.price) + '. You got ' + mktKr(k) + ' after 5 % to the market. The Directorate of Fisheries has approved the transfer.' + (o && o.two ? ' The second quota from the special scheme fell away.' : ''));
    log('Solgte ' + nm + ' i Kvotemarkedet for ' + mktKr(d.price) + '.' + (o ? '' : ' Varen fantes ikke i denne lagringen.'), 'Sold ' + nm + ' in the quota market for ' + mktKr(d.price) + '.' + (o ? '' : ' The good was not in this save.'));
  }
  else if (r.kind === 'back'){
    kmUnlock(d.vid, r.listing);
    if (d.why !== 'cancelled') msg('Kvotemarkedet', nm + ' ble ikke solgt, og er din igjen.', nm + ' was not sold, and is yours again.');
  }
  // (the choices of boat for sales long over are forgotten)
  const T = Object.keys(K.to); if (T.length > 40) for (const q of T.slice(0, T.length - 40)) delete K.to[q];
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
    // the quota market's rows (KM3): looked at before the boats' logic, so a paid or a back for a right never touches the boat with the same id
    if (r.lk === 'right' || r.lk === 'struct'){ if (mbKm(r, d, k, M) === 'wait') continue; D.push(r.id); out.push(r.id); continue; }
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
      const v = vesselById(d.vid); let kept = false; if (v){ const b = vget(v, 'boat'); if (b.sale && (b.sale.lid === r.listing || !b.sale.lid)){ kept = !!b.sale.kept && !vget(v, 'lic'); delete b.sale; } }
      // (KM4: she was out without her right, which stayed in the company; it can be put back on her)
      if (d.why !== 'cancelled') msg('Kystmegleren', nm + ' ble ikke solgt, og er din igjen. Hun ligger ved verftet.' + (kept ? ' Hjemmelen ble i rederiet: sett den tilbake med «Flytt hjemmelen til …» i Rederi om du vil.' : ''), nm + ' was not sold, and is yours again. She lies at the yard.' + (kept ? ' The right stayed in the company: put it back with «Move the right to …» in the Company app if you like.' : ''));
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
