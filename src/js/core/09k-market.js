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
function mktListings(H){ if (H == null) H = S.t / 60; const M = mktState(); return mktAll(H).filter(L => L.H0 <= H && H < L.H1 && !M.bought.includes(L.id)); }
// sold within the last 30 days (to a fisherman along the coast): an honest anchor for the prices; never who bought
function mktSold(H){ if (H == null) H = S.t / 60; const M = mktState(); return mktAll(H).filter(L => L.H1 <= H && H - L.H1 < 30 * 24 && !M.bought.includes(L.id)).sort((a, b) => b.H1 - a.H1); }
function mktById(id, H){ return mktAll(H == null ? S.t / 60 : H).find(L => L.id === id) || null; }
const mktDays = (L, H) => Math.max(0, Math.floor(((H == null ? S.t / 60 : H) - L.H0) / 24));
// the asking price now: down 2 % a week from the fourth week; an accepted bid holds for a week
function mktAsk(L, H){ const d = mktDays(L, H), cuts = d >= MKT.cutAfter ? 1 + Math.floor((d - MKT.cutAfter) / 7) : 0; return mktRound(L.price * Math.pow(1 - MKT.cutWeek, cuts)); }
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
  const V = VESSELS[L.type]; b.engH = L.engH; b.svcAt = Math.round(L.engH - V.svcH * (1 - L.motorT)); b.foul = Math.max(0, Math.min(1, (1 - L.cond.hull) * 0.8));
  for (const [q, n] of Object.entries(L.ex)) eq[q] = EQUIP[q] && EQUIP[q].multi ? Math.min(V.jukseMax || 0, Math.max(eq[q] || 0, n)) : true;
  mktState().bought.push(L.id); delete mktState().deals[L.id];
}
