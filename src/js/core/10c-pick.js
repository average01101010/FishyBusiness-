// ===== Bestilt til henting (M2 in docs/planer/butikker-og-sponsorer.md, 10.2b, V12 A; Jonas 30.10.2026) =====
// The Net app's web shop shows the whole range anywhere, and reserves at a tackle shop the player picks. Nothing is paid or given at the
// reservation: the thing is fetched, paid and fitted at that shop's quay, through the same purchase as over the counter (buyGear,
// shopBuy, the fitting job, the clothes), so the one rule for what can be bought (buyGate, equipFits) and the three places of trade stand.
// S.pick = [{id, port, w, k, s, n, t}] for the whole company; at most PICK.max at a time; a reservation for the same thing at the same
// shop is joined (gear by the number, the rest once).
// w: 'shop' (k: 'jig' the hand jig, 'kgear' the halibut gear), 'equip' (k: an EQUIP key), 'cloth' (k: a CLOTHES key), or a buyGear kind
// ('net', 'stamp', 'pot', 'kit', 'heavy', 'hooks', 'jig' with s its spec and n how many)
const PICK = {max:10};
const PICK_GEAR = ['net', 'stamp', 'pot', 'kit', 'heavy', 'hooks', 'jig'];
function pickState(){ if (!Array.isArray(S.pick)) S.pick = []; return S.pick; }
// what one reservation costs when it is fetched (the price on the day it is fetched is the same: the shop's prices are fixed)
function pickKr(o){
  const n = o.n || 1;
  if (o.w === 'shop') return o.k === 'jig' ? PRICE.gear : PRICE.kgear;
  if (o.w === 'equip') return EQUIP[o.k] ? EQUIP[o.k].price : 0;
  if (o.w === 'cloth') return CLOTHES[o.k] ? CLOTHES[o.k].price : 0;
  if (o.w === 'net'){ const x = NETOPT.find(q => netKey(q[0], q[1]) === String(o.s)); return x ? n * NETTY[x[0]].price : 0; }
  if (o.w === 'stamp') return LINE_KINDS[o.s] ? n * LINE_KINDS[o.s].price : 0;
  if (o.w === 'pot') return POTS[o.s] ? n * POTS[o.s].price : 0;
  if (o.w === 'kit') return n * GPRICE.kit;
  if (o.w === 'heavy') return n * GPRICE.heavy;
  if (o.w === 'hooks') return CARE.hookKr[o.s] || 0;
  if (o.w === 'jig') return CARE.jig[o.s] ? CARE.jig[o.s].kr : 0;
  return 0;
}
// its name, [no, en]
function pickName(o){
  const n = o.n || 1;
  if (o.w === 'shop') return o.k === 'jig' ? ['Håndjuksa', 'Hand jig'] : ['Kveiteutstyr', 'Halibut gear'];
  if (o.w === 'equip') return EQUIP[o.k] ? [EQUIP[o.k].name.no, EQUIP[o.k].name.en] : [o.k, o.k];
  if (o.w === 'cloth') return CLOTHES[o.k] ? [CLOTHES[o.k].no, CLOTHES[o.k].en] : [o.k, o.k];
  if (o.w === 'net'){ const x = NETOPT.find(q => netKey(q[0], q[1]) === String(o.s)) || ['bunn', o.s]; return [n + ' ' + NETTY[x[0]].no.toLowerCase() + ' ' + x[1] + ' mm', n + ' ' + NETTY[x[0]].en.toLowerCase() + 's ' + x[1] + ' mm']; }
  if (o.w === 'stamp') return [n + ' ' + (n === 1 ? 'stamp ' : 'stamper ') + LINE_KINDS[o.s].no.toLowerCase(), n + ' ' + (n === 1 ? 'tub of ' : 'tubs of ') + LINE_KINDS[o.s].en.toLowerCase()];
  if (o.w === 'pot') return [n + ' ' + POTS[o.s].no.toLowerCase(), n + ' ' + POTS[o.s].en.toLowerCase()];
  if (o.w === 'kit') return [n === 1 ? 'Blåsesett' : n + ' blåsesett', n === 1 ? 'Buoy set' : n + ' buoy sets'];
  if (o.w === 'heavy') return [n === 1 ? 'Tung dregg' : n + ' tunge dregger', n === 1 ? 'Heavy anchor' : n + ' heavy anchors'];
  if (o.w === 'hooks') return [o.s + ' kroker', o.s + ' hooks'];
  if (o.w === 'jig') return CARE.jig[o.s] ? [CARE.jig[o.s].no + ' (sett)', CARE.jig[o.s].en + ' (set)'] : [o.s, o.s];
  return [o.k || o.w, o.k || o.w];
}
// a tackle shop the player can reserve at (core/06c-steder.js portServices)
const pickShopOk = id => { const pt = portById(id); return !!(pt && portServices(pt).butikk); };
// reserve; null when it is done, else why not ([no, en])
function pickAdd(port, w, k, s, n){
  const P = pickState(); n = Math.max(1, Math.round(n || 1));
  if (!pickShopOk(port)) return ['Det er ingen utstyrsbutikk der.', 'There is no tackle shop there.'];
  if (!(w === 'shop' || w === 'equip' || w === 'cloth' || PICK_GEAR.includes(w))) return ['Det kan ikke bestilles.', 'That cannot be ordered.'];
  const same = P.find(o => o.port === port && o.w === w && (o.k || null) === (k || null) && String(o.s == null ? '' : o.s) === String(s == null ? '' : s));
  if (same){
    if (!PICK_GEAR.includes(w) || w === 'hooks' || w === 'jig') return ['Det ligger alt bestilt der.', 'That is already on order there.'];
    same.n += n; return null;
  }
  if (P.length >= PICK.max) return ['Du kan ha ' + PICK.max + ' bestillinger om gangen.', 'You can have ' + PICK.max + ' orders at a time.'];
  P.push({id:'p' + (S.pickSeq = (S.pickSeq || 0) + 1), port, w, k:k || null, s:s == null ? null : s, n, t:S.t});
  return null;
}
function pickDrop(id){ const P = pickState(), i = P.findIndex(o => o.id === id); if (i < 0) return false; P.splice(i, 1); return true; }
const pickAt = port => pickState().filter(o => o.port === port);
const pickById = id => pickState().find(o => o.id === id);
