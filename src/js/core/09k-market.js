// ===== Bruktmarkedet (M4 in docs/planer/butikker-og-sponsorer.md, 3.3, 10.2, 10.2b; V3 A, V9 A, V10 A, V11 A; Jonas 30.10.2026) =====
// Used boats as listings, not types: each is one boat with a number, a name, a year, engine hours, a state, what comes with her, where
// she lies (a yard) and who sells her. One list, read by the Net app's broker page and the yard's «Båter til salgs her».
// The list is worked out from the shared clock alone (the week and the listing's number, never Math.random), so every player sees the
// same boats at the same time (V3 A: local and deterministic first; the server can later take a listing off when someone buys).
// A listing is put out on a day of its week and stays for 2–6 weeks; a cheap one in good state is sold to a fisherman along the coast
// sooner. After three weeks the asking price goes down 2 % a week. She is bought only where she lies, and only after the yard's quay
// has her: the purchase is the yard's (deal, finance), and the boat comes with her hours, her state and her gear.
// S.mkt = {bought:[ids], takst:{id:true}, freeTakst:bool, bids:{id:{day, kr}}, deals:{id:{kr, until}}, wish:{cls, max}|null}
const MKT = {perWeek:6, weeksBack:7, cutAfter:21, cutWeek:0.02, bidFloor:0.9, takstMin:3000, takstMax:8000,
  types:['skiff', 'trebat', 'snekke', 'plastsjark', 'sjark', 'hurtigsjark', 'breisjark', 'kyst15', 'kyst21'],
  // the types by how often they are for sale (the small open boats are the most common along the coast)
  weight:{skiff:3, trebat:3, snekke:4, plastsjark:4, sjark:4, hurtigsjark:2, breisjark:1, kyst15:2, kyst21:1},
  // what may come with a used boat (each with a chance; only what fits her)
  extras:[['vhf', 0.6], ['plotter', 0.45], ['ais', 0.3], ['chirp', 0.3], ['linehaler', 0.2], ['garnhaler', 0.2], ['teinehaler', 0.1], ['jukse', 0.35], ['radar', 0.15], ['krabbekar', 0.1], ['antigro', 0.2]],
  names:['Havbris', 'Polarlys', 'Senjaværing', 'Kvalbein', 'Måsøy', 'Nordstjerna', 'Fiskeheimen', 'Havørn', 'Torsken', 'Lofotgutt', 'Bølgen', 'Kystjenta', 'Solvik', 'Storegga', 'Vestfjordgutt', 'Svanhild',
    'Hilde Marie', 'Brødrene', 'Gamle Ola', 'Sjøblomst', 'Ragnhild', 'Malangen', 'Kvaløygutt', 'Breivik', 'Fugløy', 'Sørøy', 'Ingrid', 'Haugsund', 'Nordkapp', 'Morgenrød', 'Ternen', 'Skarven'],
  first:['Arvid', 'Ingolf', 'Halvard', 'Sverre', 'Jens', 'Torbjørn', 'Roald', 'Asbjørn', 'Einar', 'Petter', 'Karin', 'Solveig', 'Anne Lise', 'Gunn', 'Bodil', 'Herdis'],
  last:['Pedersen', 'Johansen', 'Nilsen', 'Hansen', 'Olsen', 'Karlsen', 'Jakobsen', 'Isaksen', 'Mikkelsen', 'Eriksen', 'Andreassen', 'Berg', 'Strand', 'Hagen']};
// a number in [0, 1) from a key (the same everywhere: a hash of the key, not a random draw)
function mktRnd(key){ let h = 2166136261; const s = String(key); for (let i = 0; i < s.length; i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } h ^= h >>> 13; h = Math.imul(h, 2246822507); h ^= h >>> 16; return (h >>> 0) / 4294967296; }
function mktState(){ const M = S.mkt || (S.mkt = {}); M.bought = M.bought || []; M.takst = M.takst || {}; M.bids = M.bids || {}; M.deals = M.deals || {}; if (M.freeTakst === undefined) M.freeTakst = true; if (M.wish === undefined) M.wish = null; return M; }
const mktYards = (() => { let Y = null; return () => Y || (Y = PORTS.filter(p => portServices(p).verft)); })();
// the market value of a boat of type k built in year y in state c (0–1): the type's used price at its own year, 2.5 % a year off or on, and
// the state from 85 % to 110 %; the gear that comes with her at 60 % of the shop's price
function mktFair(k, y, c, ex){ const V = VESSELS[k]; let p = V.price * Math.max(0.35, 1 + 0.025 * (y - V.year)) * (0.85 + 0.25 * c);
  for (const [q, n] of Object.entries(ex || {})) p += (EQUIP[q] ? EQUIP[q].price : 0) * (n === true ? 1 : n) * 0.6; return p; }
const mktRound = p => p >= 1e6 ? Math.round(p / 25000) * 25000 : p >= 2e5 ? Math.round(p / 5000) * 5000 : Math.round(p / 1000) * 1000;
// one listing: put out in week w as the i-th of that week
function mktMake(w, i){
  const R = q => mktRnd('mkt|' + w + '|' + i + '|' + q), tot = MKT.types.reduce((a, k) => a + MKT.weight[k], 0);
  let r = R('type') * tot, k = MKT.types[0]; for (const t of MKT.types){ r -= MKT.weight[t]; if (r < 0){ k = t; break; } }
  const V = VESSELS[k], H0 = w * 168 + Math.floor(R('day') * 7) * 24 + 8 + Math.floor(R('hour') * 10), now = yearH(Math.max(0, H0));
  const year = Math.min(now - 1, V.year + Math.round((R('year') - 0.5) * 14)), age = Math.max(1, now - year);
  const hull = 0.5 + 0.48 * R('hull'), motor = 0.5 + 0.48 * R('motor'), elek = 0.5 + 0.48 * R('elek');
  // a third of them hide something the card does not say: the engine is worse than its hours (the takst finds it)
  const flaw = R('flaw') < 0.3 ? 0.15 + 0.2 * R('flawk') : 0, motorT = Math.max(0.3, motor - flaw);
  const ex = {}; for (const [q, pc] of MKT.extras){ if (!EQUIP[q] || !equipFits(q, k) || (V.std || []).includes(q)) continue; if (R('ex|' + q) < pc * (V.len >= 10 ? 1.3 : 0.8)) ex[q] = q === 'jukse' ? Math.max(1, Math.min(V.jukseMax || 0, 1 + Math.floor(R('nj') * 3))) : true; }
  if (ex.jukse === 0) delete ex.jukse;
  const c = (hull + motor + elek) / 3, fair = mktFair(k, year, c, ex), spread = 0.85 + 0.3 * R('price'), price = mktRound(fair * spread);
  const Y = mktYards(), pt = Y[Math.floor(R('yard') * Y.length)];
  // who sells: a skipper moving up or out, an estate, a company tidying its fleet, or a broker for an owner far away
  const kinds = ['skipper', 'skipper', 'skipper', 'dodsbo', 'rederi', 'megler'], kind = kinds[Math.floor(R('seller') * kinds.length)];
  const seller = {kind, name:MKT.first[Math.floor(R('fn') * MKT.first.length)] + ' ' + MKT.last[Math.floor(R('ln') * MKT.last.length)], home:String(pt.name).replace(/\s+(verft|båtverft|slipp|fiskemottak|mottak|fiskebruk)$/i, '')};
  // how long she stands: 2–6 weeks; a good, cheap one goes to a fisherman along the coast within one or two
  const good = spread < 0.95 && c > 0.7, life = good ? 1 + Math.floor(R('life') * 2) : 2 + Math.floor(R('life') * 5);
  const nr = String(1 + ((((w * MKT.perWeek + i) % 999) + 999) % 999)).padStart(3, '0');
  return {id:'DSB-' + now + '-' + nr, w, i, type:k, name:MKT.names[Math.floor(R('name') * MKT.names.length)], year, age, engH:Math.round(Math.min(age, 4 + Math.floor(R('eng') * 14)) * (180 + 520 * R('hours')) / 10) * 10,   // (an old hull has had a new engine: the hours are the engine's)
   
    cond:{hull, motor, elek}, motorT, flaw:flaw > 0, ex, price, fair:mktRound(fair), port:pt.id, seller, H0, H1:H0 + life * 168, look:3 + 6 * R('look'), acc:0.03 + 0.04 * R('acc'), txt:Math.floor(R('txt') * 3)};
}
// all listings that have been out in the last weeks, worked out once per week and kept
const MKTC = {w:null, all:null};
function mktAll(H){
  const w = Math.floor(Math.max(0, H) / 168); if (MKTC.w === w && MKTC.all) return MKTC.all;
  const all = []; for (let v = w - MKT.weeksBack; v <= w; v++) for (let i = 0; i < MKT.perWeek; i++) all.push(mktMake(v, i));
  MKTC.w = w; MKTC.all = all; return all;
}
// what is for sale now: put out, not yet sold, not bought by you
function mktListings(H){ if (H == null) H = S.t / 60; const M = mktState(); return mktEvery(H).filter(L => L.H0 <= H && H < L.H1 && !M.bought.includes(L.id)); }
// sold within the last 30 days (to a fisherman along the coast): an honest anchor for the prices; never who bought
function mktSold(H){ if (H == null) H = S.t / 60; const M = mktState(); return mktEvery(H).filter(L => L.H1 <= H && H - L.H1 < 30 * 24 && !M.bought.includes(L.id)).sort((a, b) => b.H1 - a.H1); }
function mktById(id, H){ return mktEvery(H == null ? S.t / 60 : H).find(L => L.id === id) || null; }
const mktDays = (L, H) => Math.max(0, Math.floor(((H == null ? S.t / 60 : H) - L.H0) / 24));
// the asking price now: down 2 % a week from the fourth week; an accepted bid holds for a week
function mktAsk(L, H){ if (L.broker) return L.price;   // (a broker's boat keeps the price the broker gives)
  const d = mktDays(L, H), cuts = d >= MKT.cutAfter ? 1 + Math.floor((d - MKT.cutAfter) / 7) : 0; return mktRound(L.price * Math.pow(1 - MKT.cutWeek, cuts)); }
const mktCut = (L, H) => mktAsk(L, H) < L.price;
function mktPrice(L, H){ if (H == null) H = S.t / 60; const D = mktState().deals[L.id]; return D && H < D.until ? Math.min(D.kr, mktAsk(L, H)) : mktAsk(L, H); }
// seen by how many skippers (an estimate from the days out; V3 B will count for real)
const mktSeen = (L, H) => Math.round(mktDays(L, H) * L.look + 2 + L.look);
// the takst: 3 000–8 000 kr by her length; the first one is free
const mktTakstKr = L => Math.max(MKT.takstMin, Math.min(MKT.takstMax, Math.round((2000 + VESSELS[L.type].len * 350) / 500) * 500));
// one bid a day, from 90 % of the asking price; the seller takes it when it is within what he will give (more the longer she has stood),
// else says what he would take (halfway); null and a reason when no bid can be made
function mktBid(id, kr){
  const L = mktById(id), M = mktState(), H = S.t / 60, day = Math.floor(H / 24); if (!L || H < L.H0 || H >= L.H1 || M.bought.includes(id)) return {err:'gone'};
  const ask = mktAsk(L, H); kr = Math.round(+kr || 0);
  if (M.bids[id] && M.bids[id].day === day) return {err:'today'};
  if (kr < Math.ceil(ask * MKT.bidFloor)) return {err:'low', min:Math.ceil(ask * MKT.bidFloor)};
  if (kr >= ask) return {err:'full'};
  M.bids[id] = {day, kr};
  const give = Math.min(0.1, L.acc + 0.01 * Math.floor(mktDays(L, H) / 7)), take = ask * (1 - give);
  if (kr >= take){ M.deals[id] = {kr, until:H + 7 * 24}; return {ok:true, kr}; }
  return {ok:false, counter:mktRound((kr + ask) / 2)};
}
// what the takst says: the true state of the engine, and whether it is worse than the card
function mktTakstSays(L){ return {motor:L.motorT, worse:L.flaw}; }
// the wish (V10 A): a group and a top price; the listings that match, newest first
function mktWishHits(H){ const W = mktState().wish; if (!W) return []; return mktListings(H).filter(L => (!W.cls || VESSELS[L.type].cls === W.cls) && (!W.type || L.type === W.type) && mktPrice(L, H) <= W.max).sort((a, b) => b.H0 - a.H0); }
// the boat bought: her hours, her state and her gear go into the vessel state (b: the boat, eq: its equipment); the engine's true state sets
// how soon the next service is due, the hull's how much weed she carries
function mktTakeOver(L, b, eq){
  const V = VESSELS[L.type]; b.built = L.year; b.engH = L.engH; b.svcAt = Math.round(L.engH - V.svcH * (1 - L.motorT)); b.foul = Math.max(0, Math.min(1, (1 - L.cond.hull) * 0.8));
  for (const [q, n] of Object.entries(L.ex)) eq[q] = EQUIP[q] && EQUIP[q].multi ? Math.min(V.jukseMax || 0, Math.max(eq[q] || 0, n)) : true;
  mktState().bought.push(L.id); delete mktState().deals[L.id];
}
// ---- your own boat at the broker (commission, 3.3 «Legg ut til salgs»): listed from anywhere at her market value; she must lie in port
// until she is sold, within 1–3 weeks, and the broker keeps 5 %. Taken out to sea, the listing is withdrawn. S.mkt.own = [{vid, H0, H1, kr}]
const MKT_COMM = 0.05;
const mktKr = n => typeof kr === 'function' ? kr(n) : Math.round(n) + ' kr';   // (kr is the UI's; the unit tests run the core alone)
// what she fetches on the market: the type's used price by her state (the hours since service and the weed on her), and her gear at 60 %
function mktOwnValue(v){
  const b = vget(v, 'boat'), V = VESSELS[b.type], eq = vget(v, 'equip') || {}, svc = clamp(((b.engH || 0) - (b.svcAt || 0)) / Math.max(1, V.svcH), 0, 1.5), c = clamp(1 - 0.25 * svc - 0.3 * (b.foul || 0), 0.3, 1);
  let p = V.price * (0.85 + 0.25 * c); for (const q of Object.keys(eq)) if (EQUIP[q] && eq[q] && !(V.std || []).includes(q)) p += EQUIP[q].price * (EQUIP[q].multi ? eq[q] : 1) * 0.6;
  return mktRound(p + licValue(vget(v, 'lic')) * 0.95);
}
function mktOwn(vid){ return (mktState().own || []).find(o => o.vid === vid) || null; }
// why she cannot be listed (a string), or null
function mktOwnWhy(v){ if (!v) return 'gone'; if (v.id === S.me) return 'aboard'; if (S.fleet.length < 2) return 'only'; if (vget(v, 'boat').status !== 'port') return 'sea'; if (mktOwn(v.id)) return 'listed'; return null; }
function mktListOwn(vid){
  const v = vesselById(vid), why = mktOwnWhy(v); if (why) return why; const M = mktState(), H = S.t / 60;
  M.own = M.own || []; M.own.push({vid, H0:H, H1:H + (7 + Math.floor(mktRnd('own|' + vid + '|' + Math.floor(H)) * 15)) * 24, kr:mktOwnValue(v)}); return null;
}
function mktUnlist(vid){ const M = mktState(); M.own = (M.own || []).filter(o => o.vid !== vid); }
// ---- delivery (10.2b «Få henne levert»): a skipper from the yard sails a boat of yours that nobody is aboard to the port you choose, for
// game money by the distance; she is away while he sails her (8 knots, two hours to make ready). S.mkt.del = [{vid, from, to, H1, kr}]
const mktDelKr = nm => Math.round((2000 + 80 * nm) / 100) * 100;
function mktDelWhy(v, to){ if (!v) return 'gone'; if (v.id === S.me) return 'aboard'; const b = vget(v, 'boat'); if (b.status !== 'port') return 'sea'; if (b.port === to) return 'there'; if ((mktState().del || []).some(d => d.vid === v.id)) return 'busy'; if (!portById(to)) return 'port'; return null; }
function mktDeliver(vid, to){
  const v = vesselById(vid), why = mktDelWhy(v, to); if (why) return why; const b = vget(v, 'boat'), nm = dist(b.pos, portById(to).p) / NM, kr = mktDelKr(nm);
  if (spendable() < kr) return 'cash'; book('baat', -kr, 'Levering av «' + vget(v, 'boatName') + '»', 'Delivery of «' + vget(v, 'boatName') + '»');
  const M = mktState(); M.del = M.del || []; M.del.push({vid, from:b.port, to, H1:S.t / 60 + 2 + nm / 8, kr}); mktUnlist(vid); return null;
}
// once an hour (05-vessels.js): the deliveries that are there, and your boats the broker has sold
function mktHour(H){
  const M = mktState();
  for (const d of (M.del || []).slice()){ const v = vesselById(d.vid); if (!v){ M.del.splice(M.del.indexOf(d), 1); continue; }
    // you went aboard her, or her plan took her out: the delivery is off, and the yard pays back
    if (v.id === S.me || vget(v, 'boat').status !== 'port' || vget(v, 'boat').port !== d.from){ M.del.splice(M.del.indexOf(d), 1); book('baat', d.kr, 'Levering avlyst', 'Delivery called off'); log('Leveringen av «' + vget(v, 'boatName') + '» ble avlyst, og verftet betalte tilbake ' + mktKr(d.kr) + '.', 'The delivery of «' + vget(v, 'boatName') + '» was called off, and the yard paid back ' + mktKr(d.kr) + '.'); continue; }
    if (H >= d.H1){ const b = vget(v, 'boat'), q = portById(d.to); b.port = d.to; b.pos = {x:q.p.x, y:q.p.y}; b.status = 'port'; const tr = vget(v, 'trail'); if (Array.isArray(tr)) tr.push({x:q.p.x, y:q.p.y, port:d.to});
      M.del.splice(M.del.indexOf(d), 1); log('«' + vget(v, 'boatName') + '» er levert i ' + q.name + '.', '«' + vget(v, 'boatName') + '» has been delivered at ' + q.name + '.'); } }
  for (const o of (M.own || []).slice()){ const v = vesselById(o.vid); if (!v){ mktUnlist(o.vid); continue; }
    if (vget(v, 'boat').status !== 'port' || v.id === S.me){ mktUnlist(o.vid); log('«' + vget(v, 'boatName') + '» er trukket fra Kystmegleren: hun må ligge i havn til hun er solgt.', '«' + vget(v, 'boatName') + '» is withdrawn from Kystmegleren: she must lie in port until she is sold.'); continue; }
    if (H < o.H1) continue;
    const nm = vget(v, 'boatName'), net = Math.round(o.kr * (1 - MKT_COMM));
    if (v.id === S.cur){ bindVessel(vesselById(S.me)); if (typeof G3 !== 'undefined' && G3.vesselChanged) G3.vesselChanged(); }
    if (v.id === openVesselId()) openUsedSave(vget(v, 'quota'));
    mktUnlist(o.vid); const paid = payDown(net); S.fleet.splice(S.fleet.indexOf(v), 1); book('baat', net - paid, 'Båt solgt gjennom megler', 'Vessel sold through the broker');
    log('Kystmegleren solgte «' + nm + '» for ' + mktKr(o.kr) + '. Du fikk ' + mktKr(net) + ' etter megleren.' + (paid ? ' ' + mktKr(paid) + ' gikk til å innfri lån.' : ''), 'Kystmegleren sold the «' + nm + '» for ' + mktKr(o.kr) + '. You got ' + mktKr(net) + ' after the broker.' + (paid ? ' ' + mktKr(paid) + ' went to pay off loans.' : '')); }
}
// ---- the boat you traded in (M5, B2): she lies at the yard and is bought by a fisherman, who puts her out again a week or two later at
// the same yard under a new name (your own market only: V3 A). S.mkt.ti = [{type, engH, port, H, old, n}]
function mktTradeIn(type, engH, port, old){ const M = mktState(); if (!VESSELS[type] || !portById(port)) return; M.ti = M.ti || []; M.ti.push({type, engH:Math.round(engH || 0), port, H:S.t / 60, old:old || '', n:M.ti.length}); if (M.ti.length > 12) M.ti.shift(); }
function mktTiListing(r){
  const V = VESSELS[r.type], R = q => mktRnd('ti|' + r.H + '|' + r.n + '|' + q), H0 = Math.floor(r.H / 24 + 7 + R('d') * 7) * 24 + 9, now = yearH(Math.max(0, H0));
  const names = MKT.names.filter(n => n !== r.old), year = Math.min(now - 1, V.year), hull = 0.6 + 0.3 * R('hull'), motor = 0.6 + 0.3 * R('motor'), elek = 0.55 + 0.3 * R('elek'), c = (hull + motor + elek) / 3;
  const fair = mktFair(r.type, year, c, {}), pt = portById(r.port);
  return {id:'DSB-' + now + '-B' + String(r.n + 1).padStart(2, '0'), w:-1, i:r.n, type:r.type, name:names[Math.floor(R('name') * names.length)], year, age:Math.max(1, now - year), engH:r.engH + Math.round(R('h') * 40) * 10,
    cond:{hull, motor, elek}, motorT:motor, flaw:false, ex:{}, price:mktRound(fair * (0.98 + 0.12 * R('p'))), fair:mktRound(fair), port:r.port,
    seller:{kind:'skipper', name:MKT.first[Math.floor(R('fn') * MKT.first.length)] + ' ' + MKT.last[Math.floor(R('ln') * MKT.last.length)], home:String(pt.name).replace(/\s+(verft|båtverft|slipp|fiskemottak|mottak|fiskebruk)$/i, '')},
    H0, H1:H0 + 21 * 24, look:4, acc:0.05, txt:2, ti:true};
}
// the coast's listings and the boats you traded in, as one list
// a broker's own boats (M8, F6): a partner with a written agreement lists real boats for sale (kind 'broker', data {type, year, price,
// port, name, hours, line, featured, url}); each is the game's nearest type (VESSELS), at a yard, marked «Formidlet av X», with a link
// to the real boat. The price is in the game's scale (the broker's own price stays on the broker's page)
function mktBrokerListings(H){
  if (typeof SPN === 'undefined') return []; const out = [];
  for (const r of SPN.list) if (r.kind === 'broker'){ const D = r.data || {}, V = VESSELS[D.type], p0 = portById(D.port);
    // (at the yard nearest the place the broker gives, if that is not a yard itself)
    const pt = p0 && (portServices(p0).verft ? p0 : mktYards().slice().sort((a, b) => dist(a.p, p0.p) - dist(b.p, p0.p))[0]);
    if (!V || V.lock || !pt) continue; const year = Math.max(1950, Math.min(yearH(H) - 1, Math.round(+D.year || V.year))), c = 0.8;
    const fair = mktFair(D.type, year, c, {}), price = mktRound(+D.price > 0 ? +D.price : fair);
    out.push({id:'DSB-M' + r.id, w:-2, i:r.id, type:D.type, name:String(D.name || V.name.no).slice(0, 28), year, age:Math.max(1, yearH(H) - year), engH:Math.max(0, Math.round(+D.hours || 0)),
      cond:{hull:c, motor:c, elek:c}, motorT:c, flaw:false, ex:{}, price, fair:mktRound(fair), port:pt.id,
      seller:{kind:'megler', name:r.sponsor.name, home:String(pt.name).replace(/\s+(verft|båtverft|slipp|fiskemottak|mottak|fiskebruk)$/i, '')},
      H0:Math.floor(H / 168) * 168, H1:1e9, look:5, acc:0.04, txt:0, broker:{name:r.sponsor.name, url:spUrl(D.url || r.sponsor.site), pl:r.id, line:String(D.line || '').slice(0, 300), featured:!!D.featured}});
  }
  return out;
}
function mktEvery(H){ const M = mktState(), T = (M.ti || []).map(mktTiListing).concat(mktBrokerListings(H == null ? S.t / 60 : H)); return T.length ? mktAll(H).concat(T) : mktAll(H); }
