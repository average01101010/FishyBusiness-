// ===== gear care: wear, mending, hooks, jig tackle, and the tackle shop's service and buy-back (Jonas 08.10.2026) =====
// What wears, and from what (all start values for play-testing; no source for the rates):
//  - line: the main line (cond, with a ceiling `max` that drops every time it is repaired), and the hooks (a share missing, a share bent). A new
//    line comes complete with line and hooks. Hooks are bought in packs of 100, 500 or 1000 at the tackle shop (pg.hooks) and changed by the
//    crew (or the shop), which takes time; fresh hooks fish 5 % better for the next three hauls (`sharp`). When the line itself is worn
//    out it pays to sell it back and buy a new one.
//  - nets: `cond` as before, and a ceiling `max` that drops each time they are mended.
//  - pots: one condition for the pots aboard (pg.potc), repaired by the crew or the shop, with a ceiling that drops.
//  - the jig: the mounted set of pilk and mark hooks («markkroker») or the halibut pilk (pg.jig), chosen under Inventory (S.target); a worn
//    set fishes worse, and spare sets are bought at the tackle shop.
// Wear comes from use: heavy catches, rough sea, long soaks and deep water (the same things that wear nets). The crew does the upkeep by
// itself in port when it has nothing else to do (S.settings.careAuto, default on); the shop does the same jobs in half the time for a fee.
// The shop buys gear back at a quarter of the new price times the condition, so it never pays to buy and sell.
const CARE = {
  hookKr:{100:300, 500:1300, 1000:2400},   // kr a pack
  hookRate:300,                            // hooks changed an hour by one hand
  jig:{mark:{no:'Markkroker og pilk', en:'Fly hooks and pilk', kr:350, wear:0.00009}, kveite:{no:'Kveitepilk', en:'Halibut pilk', kr:900, wear:0.00006}},
  ceil:{line:0.07, garn:0.04, pot:0.05}, ceilMin:0.2, sellF:0.25,
  shopTime:0.5,                            // the shop's share of the crew's time
  feeHook:1.0, feeLine:60, feePot:40, matLine:30, matPot:25   // kr: the shop's work per hook, per tub and per pot and 0.1; the crew's materials
};
function careInit(pg){
  if (!pg) return pg;
  for (const lk of ['hyse', 'bank']){ const L = pg.lines[lk]; if (L.cond == null) L.cond = 1; if (L.max == null) L.max = 1; if (L.bent == null) L.bent = 0; if (L.miss == null) L.miss = 0; if (L.sharp == null) L.sharp = 0; }
  if (pg.hooks == null) pg.hooks = 0;
  if (!pg.potc) pg.potc = {cond:1, max:1};
  if (!pg.jig) pg.jig = {mark:{n:0, c:1}, kveite:{n:0, c:1}};
  for (const l of pg.nets) if (l.max == null) l.max = 0.95;
  return pg;
}
const careG = () => careInit(S.pgear);
const careRound = v => Math.round(v * 1000) / 1000;
const careJobHours = (h, shop) => Math.max(0.2, Math.round(h * (shop ? CARE.shopTime : 1) * 10) / 10);
function careHands(g){ const hands = handsAboard(); return {hands, eff:hands ? hands * teamEff(crewAboard(), meAboard(), g) : 0}; }

// ---- the catch factors of worn gear
const lineQ = s => clamp(1 - (s.miss || 0) - 0.5 * (s.bent || 0), 0.1, 1) * (0.85 + 0.15 * (s.cond == null ? 1 : s.cond)) * (s.sharp ? 1.05 : 1);
const potQ = s => 0.6 + 0.4 * (s.cond == null ? 1 : s.cond);
function jigKind(){ return S.target === 'kveite' && S.boat.kgear ? 'kveite' : 'mark'; }
function jigQ(){ const pg = S.pgear; if (!pg || !pg.jig) return 1; return 0.65 + 0.35 * pg.jig[jigKind()].c; }
function jigWear(){ const pg = S.pgear; if (!pg || !pg.jig) return; const k = jigKind(), J = pg.jig[k]; J.c = Math.max(0, J.c - CARE.jig[k].wear); }   // (not rounded: the wear of a minute is smaller than the rounding)

// ---- wear in one haul (what the string looks like when it comes back): used by finishHaul and a stopped haul
function wearOf(s, g){
  if (s.kind === 'garn') return {cond:wearNets(s, g)};
  const mid = setMid(s), hs = hsAt(mid, S.t / 60), kgu = (g.kg || 0) / Math.max(1, g.done || s.n), rnd = () => 0.7 + 0.6 * Math.random();
  const f = (1 + kgu / 60) * (hs > 2 ? 1.4 : 1) * ((g.soak || 0) > 48 ? 1.3 : 1) * ((s.depth || 0) > 300 ? 1.25 : 1);
  if (s.kind === 'line'){
    const miss = clamp((s.miss || 0) + 0.004 * f * rnd(), 0, 0.85), bent = clamp((s.bent || 0) + 0.006 * f * rnd(), 0, 0.9 - miss), cond = Math.max(0, careRound((s.cond == null ? 1 : s.cond) - 0.012 * f * rnd()));
    let tore = 0; if (cond < 0.35){ const p = 0.5 * (0.35 - cond) / 0.35; for (let i = 0; i < (g.done || s.n); i++) if (Math.random() < p) tore++; }
    return {cond, miss:careRound(miss), bent:careRound(bent), tore};
  }
  const cond = Math.max(0, careRound((s.cond == null ? 1 : s.cond) - 0.03 * f * rnd())); let tore = 0;
  if (cond < 0.3){ const p = 0.5 * (0.3 - cond) / 0.3; for (let i = 0; i < (g.done || s.n); i++) if (Math.random() < p) tore++; }
  return {cond, tore};
}
// the returned units join the ones aboard, the conditions averaged by how many there are
function careBack(s, n, W){
  const pg = careG(); if (n <= 0) return;
  if (s.kind === 'line'){ const L = pg.lines[s.lk], w = W || {cond:s.cond == null ? 1 : s.cond, miss:s.miss || 0, bent:s.bent || 0}, tot = L.n + n;
    L.cond = careRound((L.cond * L.n + w.cond * n) / tot); L.miss = careRound((L.miss * L.n + (w.miss || 0) * n) / tot); L.bent = careRound((L.bent * L.n + (w.bent || 0) * n) / tot);
    if (s.sharp) L.sharp = Math.max(0, (L.sharp || 0) - 1); L.n = tot; }
  else if (s.kind === 'teine'){ const c = pg.potc, w = W ? W.cond : (s.cond == null ? 1 : s.cond), tot = (pg.pots[s.pot] || 0) + n;
    c.cond = careRound((c.cond * (pg.pots[s.pot] || 0) + w * n) / tot); pg.pots[s.pot] = tot; }
}

// ---- buying (the tackle shop): hooks in packs and spare jig sets
function careBuy(what, spec, n){
  const pg = careG(), b = S.boat; n = Math.max(1, Math.round(n || 1));
  if (b.status !== 'port') return [gL('Redskap kjøpes i havn.', 'Gear is bought in port.')];
  const sv = portServices(portById(b.port), berthKind(b)); if (!sv.butikk) return [gL('Redskap kjøper du i utstyrsbutikken.', 'You buy gear in the tackle shop.')];
  let cost = 0;
  if (what === 'hooks'){ if (!CARE.hookKr[spec]) return [gL('Ukjent krokpakke.', 'Unknown hook pack.')]; cost = CARE.hookKr[spec] * n; }
  else if (what === 'jig'){ if (!CARE.jig[spec]) return [gL('Ukjent juksautstyr.', 'Unknown jig tackle.')]; cost = CARE.jig[spec].kr * n; }
  else return null;
  if (cost > S.cash) return [gL('Ikke nok penger.', 'Not enough money.')];
  S.cash -= cost; S.stats.costs += cost;
  if (what === 'hooks') pg.hooks += spec * n; else pg.jig[spec].n += n;
  return null;
}
// the buoy sets and anchors one can use: a string of one unit at the least, so no more sets than units of line, nets and pots (the sets in the sea count)
const kitMax = () => ownedUnits('line') + ownedUnits('garn') + ownedUnits('teine');
const kitRoomNow = () => Math.max(0, kitMax() - S.pgear.kits.n - mySets().length);

// ---- the crew's work in port (and the shop's, in half the time for a fee): hooks, line, pots, jig tackle, nets
function hooksNeed(lk){ const L = careG().lines[lk]; return Math.round((L.miss + L.bent) * L.n * LINE_KINDS[lk].hooks); }
// the crew's work at sea (Jonas 09.10.2026: «Agning av liner, reparering av kroker, bøting av garn og teiner og sånne ting skal kunne skje
// mens båten seiler om mannskapet er ledig»): under way or lying still, with a crew aboard (the skipper alone steers); the jobs pause
// while the crew is busy fishing, hauling or gutting (core/05-vessels.js), and go on when it is free again
function seaWork(){ const b = S.boat; return (b.status === 'sailing' || b.status === 'idle') && !b.gop && !b.tow && (S.crew || []).length > 0 && crewAboard().length > 0; }
const crewBusyAtSea = () => { const b = S.boat; return b.status === 'fishing' || !!b.gop || (typeof deckPending === 'function' && deckPending() > 0.5); };
const CREW_JOBS = ['egn', 'mend', 'hk', 'lr', 'pr', 'jg'];
const crewJob = j => CREW_JOBS.includes(j.kind) && !j.shop;
function careWhy(){ const b = S.boat; return b.status !== 'port' && !seaWork() ? [(S.crew || []).length ? gL('Mannskapet tar dette i havn, eller mens båten går eller ligger i ro.', 'The crew does this in port, or while the boat is under way or lying still.') : gL('Alene om bord gjøres dette i havn. Med mannskap kan det gjøres på sjøen.', 'Alone aboard this is done in port. With a crew it can be done at sea.')] : null; }
function careShopWhy(){ const b = S.boat, sv = portServices(portById(b.port), berthKind(b)); return !sv.butikk ? [gL('Butikken må ta det: gå til utstyrsbutikken.', 'The shop has to do it: go to the tackle shop.')] : null; }
// what a job would cost and take: {n, fee, h, mat} or null when there is nothing to do or nobody to do it. The shop does it in half the time
// for a fee; the crew uses its own hooks (pg.hooks) and a little material
function careQuote(what, key, shop){
  const pg = careG();
  if (what === 'hooks'){ const L = pg.lines[key], need = hooksNeed(key), n = shop ? need : Math.min(need, pg.hooks), ce = careHands('line'); if (n < 1 || !ce.hands) return null;
    return {n, need, tot:L.n * LINE_KINDS[key].hooks, fee:shop ? Math.round(n * (CARE.hookKr[100] / 100 + CARE.feeHook)) : 0, h:careJobHours(n / (CARE.hookRate * ce.eff), shop)}; }
  if (what === 'line'){ const L = pg.lines[key], ce = careHands('line'); if (!L.n || L.cond >= L.max - 0.05 || !ce.hands) return null; const d = L.max - L.cond;
    return {n:L.n, fee:shop ? Math.round(CARE.feeLine * L.n * d / 0.1) : Math.round(CARE.matLine * L.n * d / 0.1), h:careJobHours(L.n * d / 0.25 * 0.5 / ce.eff, shop)}; }
  if (what === 'pot'){ const c = pg.potc, n = pg.pots.big, ce = careHands('teiner'); if (!n || c.cond >= c.max - 0.05 || !ce.hands) return null; const d = c.max - c.cond;
    return {n, fee:shop ? Math.round(CARE.feePot * n * d / 0.1) : Math.round(CARE.matPot * n * d / 0.1), h:careJobHours(n * d / 0.25 * 0.3 / ce.eff, shop)}; }
  if (what === 'net'){ const l = pg.nets.find(x => x.id === key), ce = careHands('garn'); if (!l || l.cond >= nMax(l) - 0.05 || !ce.hands) return null; const d = nMax(l) - l.cond;
    return {n:l.n, fee:shop ? Math.round(GPRICE.bot * l.n * d / 0.1 * 0.8) : 0, h:careJobHours(l.n * d / 0.25 * 0.5 / ce.eff, shop)}; }
  return null;
}
const careNoHands = () => [gL('Ingen om bord kan gjøre jobben.', 'Nobody aboard can do the job.')];
function careGate(shop){ return careWhy() || (shop ? careShopWhy() : null); }
function careQueue(j, fee){ if (fee > S.cash) return [gL('Ikke nok penger.', 'Not enough money.')]; if (!queueJob(j)) return [gL('Verkstedkøen er full.', 'The work queue is full.')]; S.cash -= fee; S.stats.costs += fee; return null; }
function hooksJob(lk, shop){
  const pg = careG(), why = careGate(shop); if (why) return why;
  if (hooksNeed(lk) < 1) return [gL('Kroken sitter som den skal.', 'The hooks are in order.')];
  const q = careQuote('hooks', lk, shop); if (!q) return !shop && pg.hooks < 1 ? [gL('Du har ingen kroker å bytte med. Kjøp en pakke i utstyrsbutikken.', 'You have no hooks to change with. Buy a pack at the tackle shop.')] : careNoHands();
  const e = careQueue({kind:'hk', lk, n:q.n, need0:q.need, tot0:q.tot, h:q.h, shop:!!shop, fee:q.fee, no:(shop ? 'Butikken bytter ' : 'Bytte ') + q.n + ' kroker på ' + LINE_KINDS[lk].no.toLowerCase(), en:(shop ? 'The shop changes ' : 'Changing ') + q.n + ' hooks on ' + LINE_KINDS[lk].en.toLowerCase()}, q.fee); if (e) return e;
  if (!shop) pg.hooks -= q.n;
  log((shop ? 'Butikken bytter ' : 'Bytter ') + q.n + ' kroker, ca. ' + fmt(q.h, 1) + ' t.', (shop ? 'The shop changes ' : 'Changing ') + q.n + ' hooks, about ' + fmt(q.h, 1) + ' h.');
  return null;
}
// the line itself: back to its ceiling, which drops
function lineFix(lk, shop){
  const pg = careG(), L = pg.lines[lk], why = careGate(shop); if (why) return why;
  if (!L.n || L.cond >= L.max - 0.05) return [gL('Lina trenger ikke reparasjon.', 'The line needs no repair.')];
  const q = careQuote('line', lk, shop); if (!q) return careNoHands();
  const e = careQueue({kind:'lr', lk, h:q.h, shop:!!shop, fee:q.fee, no:(shop ? 'Butikken reparerer ' : 'Reparere ') + LINE_KINDS[lk].no.toLowerCase(), en:(shop ? 'The shop mends the ' : 'Mending the ') + LINE_KINDS[lk].en.toLowerCase()}, q.fee); if (e) return e;
  log((shop ? 'Butikken reparerer' : 'Reparerer') + ' lina, ca. ' + fmt(q.h, 1) + ' t.', (shop ? 'The shop mends' : 'Mending') + ' the line, about ' + fmt(q.h, 1) + ' h.');
  return null;
}
function potFix(shop){
  const pg = careG(), c = pg.potc, n = pg.pots.big, why = careGate(shop); if (why) return why;
  if (!n || c.cond >= c.max - 0.05) return [gL('Teinene trenger ikke reparasjon.', 'The pots need no repair.')];
  const q = careQuote('pot', 0, shop); if (!q) return careNoHands();
  const e = careQueue({kind:'pr', h:q.h, shop:!!shop, fee:q.fee, no:(shop ? 'Butikken reparerer ' : 'Reparere ') + n + ' teiner', en:(shop ? 'The shop mends ' : 'Mending ') + n + ' pots'}, q.fee); if (e) return e;
  log((shop ? 'Butikken reparerer ' : 'Reparerer ') + n + ' teiner, ca. ' + fmt(q.h, 1) + ' t.', (shop ? 'The shop mends ' : 'Mending ') + n + ' pots, about ' + fmt(q.h, 1) + ' h.');
  return null;
}
// nets at the shop: the same as mending ourselves in half the time, for a fee
function netShop(nid){
  const pg = careG(), l = pg.nets.find(x => x.id === nid), why = careGate(true); if (why) return why;
  if (!l || l.cond >= nMax(l) - 0.05) return [gL('Garna trenger ikke bøting.', 'The nets do not need mending.')];
  const q = careQuote('net', nid, true); if (!q) return careNoHands();
  const e = careQueue({kind:'mend', nid, h:q.h, shop:true, fee:q.fee, no:'Butikken bøter ' + l.n + ' garn', en:'The shop mends ' + l.n + ' nets'}, q.fee); if (e) return e;
  pg.nets.splice(pg.nets.indexOf(l), 1); pg.shore.push({kind:'mendself', lenke:l});
  log('Butikken bøter ' + l.n + ' garn, ca. ' + fmt(q.h, 1) + ' t.', 'The shop mends ' + l.n + ' nets, about ' + fmt(q.h, 1) + ' h.');
  return null;
}
// changing the jig tackle: a spare set goes on, the old one is thrown out
function jigJob(k){
  const pg = careG(), J = pg.jig[k], why = careWhy(); if (why) return why;
  if (J.n < 1) return [gL('Du har ingen reservesett. Kjøp i utstyrsbutikken.', 'You have no spare set. Buy one at the tackle shop.')];
  if (k === 'kveite' && !S.boat.kgear) return [gL('Du har ikke kveiteutstyr om bord.', 'You have no halibut gear aboard.')];
  const ce = careHands('juksa'); if (!ce.hands) return [gL('Ingen om bord kan bytte.', 'Nobody aboard can change.')];
  if (!queueJob({kind:'jg', k, h:careJobHours(0.3 / ce.eff), no:'Bytte til nytt sett: ' + CARE.jig[k].no.toLowerCase(), en:'Fitting a new set: ' + CARE.jig[k].en.toLowerCase()})) return [gL('Verkstedkøen er full.', 'The work queue is full.')];
  J.n--; log('Bytter ' + CARE.jig[k].no.toLowerCase() + '.', 'Changing the ' + CARE.jig[k].en.toLowerCase() + '.'); return null;
}
function jigChoose(k){ if (k === 'kveite' && !S.boat.kgear) return [gL('Du har ikke kveiteutstyr om bord.', 'You have no halibut gear aboard.')]; S.target = k === 'kveite' ? 'kveite' : 'mix'; return null; }
// when a care job is done (called from gearJob)
function careJobDone(j){
  const pg = careG();
  if (j.kind === 'hk'){ const L = pg.lines[j.lk], f = clamp(j.n / Math.max(1, j.need0), 0, 1); L.miss = careRound(L.miss * (1 - f)); L.bent = careRound(L.bent * (1 - f)); if (j.n >= 0.15 * Math.max(1, j.tot0)) L.sharp = 3;
    log(j.n + ' kroker er byttet.', j.n + ' hooks are changed.'); return true; }
  if (j.kind === 'lr'){ const L = pg.lines[j.lk]; L.cond = L.max; L.max = Math.max(CARE.ceilMin, careRound(L.max - CARE.ceil.line)); log('Lina er reparert.', 'The line is mended.'); return true; }
  if (j.kind === 'pr'){ const c = pg.potc; c.cond = c.max; c.max = Math.max(CARE.ceilMin, careRound(c.max - CARE.ceil.pot)); log('Teinene er reparert.', 'The pots are mended.'); return true; }
  if (j.kind === 'jg'){ pg.jig[j.k].c = 1; log('Nytt sett er montert.', 'A new set is fitted.'); return true; }
  return false;
}
function careJobCancel(j){
  const pg = S.pgear; if (!pg) return;
  if (j.kind === 'hk'){ if (j.shop) { S.cash += j.fee || 0; } else pg.hooks += j.n; }
  else if (j.kind === 'lr' || j.kind === 'pr'){ S.cash += j.fee || 0; }
  else if (j.kind === 'jg') pg.jig[j.k].n++;
  else if (j.kind === 'mend' && j.shop) S.cash += j.fee || 0;
}

// ---- the shop buys gear back: a quarter of the new price times the condition (never above it)
function sellValue(what, key, n){
  const pg = careG();
  if (what === 'line'){ const L = pg.lines[key]; return Math.round(LINE_KINDS[key].price * CARE.sellF * (0.2 + 0.8 * L.cond) * n); }
  if (what === 'net'){ const l = pg.nets.find(x => x.id === key); return l ? Math.round(NETTY[netTy(l)].price * CARE.sellF * (0.2 + 0.8 * l.cond) * l.n) : 0; }
  if (what === 'pot') return Math.round(POTS.big.price * CARE.sellF * (0.2 + 0.8 * pg.potc.cond) * n);
  if (what === 'kit') return Math.round(GPRICE.kit * CARE.sellF * n);
  if (what === 'heavy') return Math.round(GPRICE.heavy * CARE.sellF * n);
  if (what === 'jig') return Math.round(CARE.jig[key].kr * CARE.sellF * n);
  if (what === 'hooks') return Math.round(CARE.hookKr[100] / 100 * 0.2 * n);
  return 0;
}
function sellGear(what, key, n){
  const pg = careG(), b = S.boat, why = careWhy() || careShopWhy(); if (why) return why;
  n = Math.max(1, Math.round(n || 1));
  if (what === 'line'){ const L = pg.lines[key], free = L.n - L.baited; if (!L || free < n) return [gL('Du har ikke så mange uegnede stamper om bord.', 'You do not have that many unbaited tubs aboard.')]; S.cash += sellValue('line', key, n); L.n -= n; }
  else if (what === 'net'){ const l = pg.nets.find(x => x.id === key); if (!l) return [gL('Finner ikke garna.', 'Cannot find the nets.')]; S.cash += sellValue('net', key, 1); pg.nets.splice(pg.nets.indexOf(l), 1); }
  else if (what === 'pot'){ if (pg.pots.big < n) return [gL('Du har ikke så mange teiner om bord.', 'You do not have that many pots aboard.')]; S.cash += sellValue('pot', key, n); pg.pots.big -= n; }
  else if (what === 'kit'){ if (pg.kits.n - pg.kits.heavy < n && pg.kits.n < n) return [gL('Du har ikke så mange blåsesett.', 'You do not have that many buoy sets.')]; S.cash += sellValue('kit', key, n); pg.kits.n -= n; pg.kits.heavy = Math.min(pg.kits.heavy, pg.kits.n); }
  else if (what === 'heavy'){ if (pg.kits.heavy < n) return [gL('Du har ikke så mange tunge dregger.', 'You do not have that many heavy anchors.')]; S.cash += sellValue('heavy', key, n); pg.kits.heavy -= n; }
  else if (what === 'jig'){ if (pg.jig[key].n < n) return [gL('Du har ikke så mange reservesett.', 'You do not have that many spare sets.')]; S.cash += sellValue('jig', key, n); pg.jig[key].n -= n; }
  else if (what === 'hooks'){ if (pg.hooks < n) return [gL('Du har ikke så mange kroker.', 'You do not have that many hooks.')]; S.cash += sellValue('hooks', key, n); pg.hooks -= n; }
  else return [gL('Ukjent vare.', 'Unknown item.')];
  log('Solgte tilbake til utstyrsbutikken.', 'Sold back to the tackle shop.'); void b; return null;
}

// ---- upkeep by the crew when the boat lies in port with nothing else to do: once an hour, one job at a time, from what is in the store
let CARE_LAST = -1;
function careTick(){
  const b = S.boat, pg = S.pgear; if (!pg || (b.status !== 'port' && !seaWork()) || S.settings.careAuto === false) return;
  const H = Math.floor(S.t / 60); if (H === CARE_LAST) return; CARE_LAST = H;
  careInit(pg);
  if ((S.crew || []).length) gearTalk();   // now and then a word on the state of the gear, the hooks and the bait
  if ((S.jobs || []).length || b.gop || b.land || !handsAboard()) return;
  if (!(S.crew || []).length) return;   // only a crew does this by itself; alone, it is yours to order
  // at sea the crew works while it is free, also on a standing plan (06d-drift.js; Jonas 10.10.2026). Baiting, hooks, line and pot repairs
  // take nothing out of what the next set uses (an unbaited tub is not set anyway), so they go on. Mending takes a string of nets off the
  // boat until it is done, and the plan's next set may name that string: on a net plan the nets are mended in port
  const planOn = !!(S.plan && S.plan.ops) || ((o => !!(o && o.on))(typeof driftOps === 'function' ? driftOps() : null)), netPlan = planOn && rigOf() === 'garn';
  if (b.status !== 'port'){ if (crewBusyAtSea()) return;
    // at sea the crew also baits the tubs that are ready for it, with the bait aboard
    for (const lk of ['hyse', 'bank']){ const L = pg.lines[lk], free = L.n - L.baited; const bk = free > 0 && baitPick(pg, LINE_KINDS[lk].baitKg); if (bk){ const n = Math.max(1, Math.min(free, Math.floor((baitOf(pg)[bk] || 0) / LINE_KINDS[lk].baitKg))); if (!egnSelf(lk, n)) return; } } }
  const mendable = !(b.status !== 'port' && netPlan) && pg.nets.find(l => l.cond < Math.min(0.6, l.max - 0.1)); if (mendable && !mendSelf(mendable.id)) return;
  for (const lk of ['hyse', 'bank']){ const L = pg.lines[lk]; if (!L.n) continue;
    if (hooksNeed(lk) >= Math.max(5, 0.06 * L.n * LINE_KINDS[lk].hooks) && pg.hooks > 0 && !hooksJob(lk, false)) return;
    if (L.cond < Math.min(0.6, L.max - 0.1) && !lineFix(lk, false)) return; }
  if (pg.pots.big && pg.potc.cond < Math.min(0.6, pg.potc.max - 0.1) && !potFix(false)) return;
  const k = jigKind(); if (pg.jig[k].c < 0.3 && pg.jig[k].n > 0 && !jigJob(k)) return;
}

// ---- what the crew says about the gear (Jonas 09.10.2026: «Tidvis kan mannskapet komme med kommentarer tilknyttet dette som feks å kommentere
// status på utstyret, mangel eller tomt for kroker, mangel eller tomt for agn»): once an hour at most a look at the store, and each
// thing said at most once a game day (S.gsay), through the crew's own voice (core/14-crewlife.js crewSay: the log, over the head in 3D)
function gearTalk(){
  const pg = S.pgear; if (!pg || !crewAboard().length) return;
  const said = S.gsay || (S.gsay = {}), fresh = k => S.t - (said[k] || -1e9) > 24 * 60, say = k => { if (fresh(k) && crewSay(null, k)){ said[k] = S.t; return true; } return false; };
  const lineHooks = ['hyse', 'bank'].reduce((a, lk) => a + (pg.lines[lk].n ? hooksNeed(lk) : 0), 0), lines = pg.lines.hyse.n + pg.lines.bank.n;
  const tubs = ['hyse', 'bank'].reduce((a, lk) => a + Math.max(0, pg.lines[lk].n - pg.lines[lk].baited), 0), tubKg = ['hyse', 'bank'].reduce((a, lk) => a + (pg.lines[lk].n > pg.lines[lk].baited ? LINE_KINDS[lk].baitKg : 0), 0);
  if (lines && lineHooks >= 20 && pg.hooks <= 0 && say('hooksOut')) return;
  if (lines && pg.hooks > 0 && pg.hooks < lineHooks && say('hooksLow')) return;
  if (tubs && baitKg(pg) < 0.5 && say('baitOut')) return;
  if (tubs && baitKg(pg) >= 0.5 && baitKg(pg) < tubKg * Math.min(tubs, 3) && say('baitLow')) return;
  if ((pg.nets.some(l => l.cond < 0.4) || ['hyse', 'bank'].some(lk => pg.lines[lk].n && pg.lines[lk].cond < 0.4) || (pg.pots.big && pg.potc.cond < 0.4)) && say('gearWorn')) return;
  if (pg.jig && pg.jig[jigKind()].c < 0.3 && say('jigWorn')) return;
}
