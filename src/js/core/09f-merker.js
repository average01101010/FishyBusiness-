// ===== Merker: «Første uke på sjøen» and the long badges (Jonas 07.10.2026; docs/engasjement.md, arbeidslista 1.5 and 3) =====
// Three chapters of seven milestones, set from what the first real players did and when (OVERLEVERING 4.25): the first hours, the
// first days and the rest of the week. Each milestone teaches one part of the game and gives a small gift from someone in the world
// (a «drypp»), drawn in three tiers so one never quite knows what comes, and fitted to what the player has: bait to one with lines,
// mended nets to one with nets, ice, diesel, money, a cleaned hull, an engine service, now and then a piece of equipment. A chapter
// opens the next when five of its seven are taken (no one is stuck on the one they will not do), and gives its own reward when all
// seven are: a pennant others see, a luck, a hull colour. After the week the long badges go on (the landings up to a million, the
// tonnes, the sea time, the plants, the species, the miles), so the card never just ends. Nothing runs out and nothing is lost.
// Milestones reached in a chapter not yet open count from when it opens, already ticked. A game that has been played gets ticked for
// what it has done, with the gifts. The gifts wait during the first trip and come on the quay after it.
// Also here: the first tow and the first repair are free, with a word on how to avoid the next (Jonas 07.10.2026: «slik at spillerne
// lærer, men ikke får konsekvenser»).
const ACH_OPEN = 5;
const ACH_CH = [['Fars båt', 'Father\'s boat'], ['Egen skipper', 'Own skipper'], ['Kjent på kysten', 'Known on the coast']];
const achBest = () => Math.max((S.ach && S.ach.best) || 0, 0, ...(S.sales || []).map(s => s.total || 0));
const achPorts = () => { const s = new Set((S.sales || []).map(x => x.port).filter(Boolean)); for (const k in ((S.tat && S.tat.plant) || {})) s.add(k); return s.size; };
const achFleet = f => (S.fleet || []).some(v => { try { return f(v); } catch (e){ return false; } });
const achC = k => (S.ach && S.ach.c && S.ach.c[k]) || 0;
const achKg = () => (S.stats && S.stats.kg) || 0;
const ACH = [
  // the first hours
  {id:'took', ch:0, n:['Tok over båten', 'Took over the boat'], p:() => !!S.intro},
  {id:'fish', ch:0, n:['Første fisk over ripa', 'First fish over the rail'], p:() => achKg() > 0 || holdTotal() > 0.01},
  {id:'land', ch:0, n:['Første levering', 'First landing'], p:() => (S.landN || 0) >= 1 || (S.sales || []).length > 0},
  {id:'own', ch:0, n:['Første tur på egen hånd', 'First trip of your own'], p:() => (S.landN || 0) >= 2 || (S.sales || []).length >= 2},
  {id:'l10', ch:0, n:['Én levering over 10 000 kr', 'A landing over NOK 10,000'], p:() => [achBest(), 10000]},
  {id:'reg', ch:0, n:['Ført i fiskermanntallet, båten døpt', 'In the fishermen\'s register, the boat named'], p:() => !!S.intro && !S.unnamed && !(typeof isGuest === 'function' && isGuest())},
  {id:'sleep', ch:0, n:['Første natt i køya', 'First night in the bunk'], p:() => !!achC('sleep')},
  // the first days
  {id:'equip', ch:1, n:['Første utstyrskjøp', 'First equipment bought'], p:() => !!achC('equip') || achFleet(v => Object.values(vget(v, 'equip') || {}).some(Boolean))},
  {id:'l20', ch:1, n:['Én levering over 20 000 kr', 'A landing over NOK 20,000'], p:() => [achBest(), 20000]},
  {id:'t1', ch:1, n:['Ett tonn levert', 'A tonne landed'], p:() => [achKg(), 1000]},
  {id:'yard', ch:1, n:['Første oppgradering på verftet', 'First upgrade at the yard'], p:() => achFleet(v => ((vget(v, 'boat').holdLv || 0) + (vget(v, 'boat').engLv || 0) + Object.keys(vget(v, 'boat').upg || {}).length) > 0)},
  {id:'crew', ch:1, n:['Første mann hyret', 'First hand hired'], p:() => !!achC('crew') || achFleet(v => (vget(v, 'crew') || []).length > 0)},
  {id:'plant2', ch:1, n:['Levert til et nytt mottak', 'Landed at a new plant'], p:() => [achPorts(), 2]},
  {id:'storm', ch:1, hid:true, n:['Første uvær', 'First rough weather'], h:['Ute i kuling og hjem uten slep.', 'Out in a gale and home without a tow.'], p:() => !!achC('storm')},
  // the rest of the week
  {id:'l25', ch:2, n:['Én levering over 25 000 kr', 'A landing over NOK 25,000'], p:() => [achBest(), 25000]},
  {id:'gear', ch:2, n:['Garn eller line satt og trukket', 'Nets or lines set and hauled'], p:() => !!achC('haul')},
  {id:'boat', ch:2, n:['Første båtbytte', 'First new boat'], p:() => !!achC('boat') || achFleet(v => (VESSELS[vget(v, 'boat').type] || {}).price > 100000)},
  {id:'l50', ch:2, n:['Én levering over 50 000 kr', 'A landing over NOK 50,000'], p:() => [achBest(), 50000]},
  {id:'t5', ch:2, n:['Fem tonn levert', 'Five tonnes landed'], p:() => [achKg(), 5000]},
  {id:'fs5', ch:2, n:['5 år fartstid', '5 years at sea'], p:() => [fsOf(fsState().p).y, 5]},
  {id:'big', ch:2, hid:true, n:['Storfisken', 'The big one'], h:['En torsk over 9 kg, eller en fisk på trofeveggen.', 'A cod over 9 kg, or a fish on the trophy wall.'], p:() => !!achC('big') || (S.trophies || []).length > 0}
];
// the long badges: tiers, each with a gift (the first three landing sizes are in the week's card)
const ACHL = [
  {id:'lev', n:['Største levering', 'Biggest landing'], tiers:[100000, 250000, 500000, 1000000], unit:'kr', v:() => achBest()},
  {id:'tonn', n:['Levert i alt', 'Landed in all'], tiers:[10, 25, 50, 100, 250, 500, 1000], unit:'t', v:() => achKg() / 1000},
  {id:'fs', n:['Fartstid', 'Sea time'], tiers:[10, 20, 30, 40], unit:'år', v:() => fsOf(fsState().p).y},
  {id:'mottak', n:['Mottak langs kysten', 'Plants along the coast'], tiers:[3, 5, 10, 25, 50], unit:'', v:() => achPorts()},
  {id:'arter', n:['Arter levert', 'Species landed'], tiers:[3, 5, 8, 12], unit:'', v:() => Object.keys((S.ach && S.ach.sp) || {}).length},
  {id:'nm', n:['Nautiske mil om bord', 'Nautical miles aboard'], tiers:[250, 1000, 2500, 5000, 10000], unit:'nm', v:() => (S.tat && S.tat.nm) || 0},
  {id:'natt', n:['Nattfiske', 'Night fishing'], tiers:[1, 10, 50], unit:'', v:() => achC('night')},
  {id:'notat', n:['Fars merker funnet', 'Father\'s marks found'], tiers:[1, 3, 5], unit:'', v:() => Object.keys((S.notes && S.notes.found) || {}).length},
  {id:'peer', n:['Andre spillere møtt på sjøen', 'Other players met at sea'], tiers:[1, 10, 50], unit:'', v:() => Object.keys((S.ach && S.ach.peers) || {}).length},
  // the pub (ui/09c-pubsoc.js): the week's quiz with every answer right, and the weeks the fiskarlag reached its goal
  {id:'quiz', n:['Quizmester på puben', 'Pub quiz master'], tiers:[1, 5, 20], unit:'', v:() => achC('quiz')},
  {id:'lag', n:['Fiskarlagets ukemål', 'The fishing club\'s weekly goals'], tiers:[1, 5, 20], unit:'', v:() => achC('lag')}
];
const achOf = id => ACH.find(a => a.id === id);
function achState(){
  if (!S.ach) S.ach = {d:{}, g:{}, ch:{}, l:{}, c:{}, sp:{}, owe:[], seed:(Math.random() * 1e9) | 0, best:0};
  const A = S.ach; for (const k of ['d', 'g', 'ch', 'l', 'c', 'sp', 'peers']) A[k] = A[k] || {}; A.owe = A.owe || []; return A;
}
const achHave = a => { const r = a.p(); return Array.isArray(r) ? r[0] >= r[1] : !!r; };
const achProg = a => { const r = a.p(); return Array.isArray(r) ? clamp(r[0] / r[1], 0, 1) : r ? 1 : 0; };
const achDone = id => !!(S.ach && S.ach.d[id]);
const achInCh = ch => ACH.filter(a => a.ch === ch);
const achNDone = ch => achInCh(ch).filter(a => achDone(a.id)).length;
// a chapter is open from the start (the first), or when five of the one before are taken
const achOpen = ch => ch === 0 || achNDone(ch - 1) >= ACH_OPEN;
// the gifts are paid where the game is played (not in the automated tests, #notut, unless they ask)
const achLive = () => !(typeof NOTUT !== 'undefined' && NOTUT) || (typeof window !== 'undefined' && window.__achOn);
// a counter or a flag from the game (core/05-vessels.js, ui/05-phone.js, ui/08-actions.js)
function achAdd(k, n){ const A = achState(); A.c[k] = (A.c[k] || 0) + (n == null ? 1 : n); }
function achSale(total, sps){ const A = achState(); A.best = Math.max(A.best || 0, total || 0); for (const sp of sps || []) A.sp[sp] = 1; achCheck(); }
function achCatch(sp, cls){ if (sp === 'torsk' && cls === 0 && meAboard()) achAdd('big'); }
// each game minute: rough weather with you aboard (a gale, Beaufort 6 and up), night fishing, and another player's boat near
function achMinute(){
  if (S.t % 10 === 0) achCheck();
  const b = S.boat; if (!meAboard() || b.status === 'port') return;
  const A = achState(), H = S.t / 60;
  if (!A.stormT && beaufort(windAt(H)) >= 6) A.stormT = 1;
  const hr = ((H % 24) + 24) % 24; if (b.status === 'fishing' && (hr >= 23 || hr < 4) && A.nightD !== Math.floor((H + 1) / 24)){ A.nightD = Math.floor((H + 1) / 24); achAdd('night'); }
  if (typeof PEERS !== 'undefined') for (const q of PEERS) if (q && q.id && !A.peers[q.id] && dist(b.pos, {x:q.x, y:q.y}) < 3.7) A.peers[q.id] = Math.max(1, S.t);
}
// the end of a trip with you aboard: a gale weathered without a tow counts
function achTripEnd(bad){ const A = achState(); if (A.stormT && !bad) achAdd('storm'); A.stormT = 0; achCheck(); }

// ---- the gifts: what fits the player now, in three tiers (seven in ten common, two good, one rare), bigger in later chapters ----
const achRnd = (key, k) => (hashStr(String(achState().seed) + '|' + key + '|' + k) % 100000) / 100000;
function achPool(scale){
  const b = S.boat, pg = S.pgear || {}, out = [], L = (no, en) => [no, en];
  const add = (tier, w, f) => out.push({tier, w, f}), sc = v => Math.round(v * scale);
  const lines = pg.lines ? (pg.lines.hyse ? pg.lines.hyse.n : 0) + (pg.lines.bank ? pg.lines.bank.n : 0) : 0, pots = pg.pots ? (pg.pots.big || 0) : 0;
  const nets = pg.nets || [], iceRoom = (BOAT.iceCap || 0) - (b.ice || 0), fuelRoom = (BOAT.fuelCap || 0) - (b.fuel || 0);
  const money = (lo, hi, who) => r => { const v = Math.round((lo + (hi - lo) * r) * scale / 100) * 100;
    return {apply:() => { S.cash += v; }, t:L(who[0] + ' ' + kr(v) + '.', who[1] + ' ' + kr(v) + '.')}; };
  if (lines + pots > 0) add(0, 3, () => { const kg = sc(15); return {apply:() => { const B = baitOf(pg); B.makrell = (B.makrell || 0) + kg; }, t:L('Butikken gir deg ' + kg + ' kg makrell til agn.', 'The shop gives you ' + kg + ' kg of mackerel for bait.')}; });
  if (iceRoom > 20) add(0, 2, () => { const kg = Math.round(Math.min(iceRoom, sc(120))); return {apply:() => { b.ice = (b.ice || 0) + kg; }, t:L('Mottaket gir deg ' + kg + ' kg is.', 'The plant gives you ' + kg + ' kg of ice.')}; });
  if (fuelRoom > 5) add(0, 2, () => { const l = Math.round(Math.min(fuelRoom, Math.max(10, sc(BOAT.fuelCap * 0.25)))); return {apply:() => { b.fuel = (b.fuel || 0) + l; }, t:L('Bunkerskaia fyller ' + l + ' liter på tanken.', 'The bunker quay puts ' + l + ' litres in the tank.')}; });
  add(0, 2, money(1000, 3000, ['Salgslaget sender en premie for leveringene:', 'The sales organisation sends a prize for your landings:']));
  if (fuelRoom > 10) add(1, 2, () => { const l = Math.round(fuelRoom); return {apply:() => { b.fuel = BOAT.fuelCap; }, t:L('Full tank fra bunkerskaia, ' + l + ' liter.', 'A full tank from the bunker quay, ' + l + ' litres.')}; });
  if (nets.some(n => (n.cond == null ? 1 : n.cond) < 0.95)) add(1, 3, () => ({apply:() => { for (const n of nets) n.cond = 1; }, t:L('Bøteriet bøter garna dine gratis.', 'The net loft mends your nets for free.')}));
  if ((b.foul || 0) > 0.1) add(1, 2, () => ({apply:() => { b.foul = 0; }, t:L('Dykkeren renser skroget gratis.', 'The diver cleans the hull for free.')}));
  if ((b.engH || 0) - (b.svcAt || 0) > (BOAT.svcH || 200) * 0.3) add(1, 2, () => ({apply:() => { b.svcAt = b.engH || 0; }, t:L('Mekanikeren går over motoren gratis.', 'The mechanic services the engine for free.')}));
  add(1, 2, money(5000, 10000, ['Salgslaget sender en premie:', 'The sales organisation sends a prize:']));
  const eq = Object.keys(EQUIP).filter(q => !EQUIP[q].multi && !(S.equip || {})[q] && equipFits(q, b.type) && EQUIP[q].price <= 25000 * scale && !(S.jobs || []).some(j => j.k === q));
  if (eq.length) add(2, 2, r => { const q = eq[Math.floor(r * eq.length) % eq.length], E = EQUIP[q];
    return {apply:() => { if (!queueJob({kind:'fit', k:q, h:fitHours(q), no:'Montering av ' + E.name.no.toLowerCase() + ' (gave)', en:'Fitting the ' + E.name.en + ' (a gift)'})) S.cash += E.price; },
      t:L('Verkstedet gir deg ' + E.name.no.toLowerCase() + ' og monterer det gratis neste gang du er i havn.', 'The yard gives you the ' + E.name.en + ' and fits it free the next time you are in port.')}; });
  add(2, 1, money(15000, 25000, ['En gammel kar på kaia har lagt igjen en konvolutt til deg:', 'An old man on the quay has left an envelope for you:']));
  return out;
}
function achDraw(key, scale){
  const pool = achPool(scale), r1 = achRnd(key, 1), tier = r1 < 0.7 ? 0 : r1 < 0.9 ? 1 : 2;
  for (let t = tier; t >= 0; t--){ const c = pool.filter(x => x.tier === t); if (!c.length) continue;
    const sum = c.reduce((a, x) => a + x.w, 0); let r = achRnd(key, 2) * sum, pick = c[c.length - 1]; for (const x of c){ r -= x.w; if (r <= 0){ pick = x; break; } }
    const g = pick.f(achRnd(key, 3)); g.tier = t; return g; }
  return null;
}
// a gift: given now, or kept for the quay while the first trip is on
function achGive(key, scale, title){
  const A = achState();
  if (typeof tutOn === 'function' && tutOn()){ A.owe.push([key, scale, title]); return null; }
  const g = achDraw(key, scale); if (!g) return null;
  g.apply(); A.g[key] = [g.t[0], g.t[1], g.tier];
  log('Gave for «' + title[0] + '»: ' + g.t[0], 'Gift for «' + title[1] + '»: ' + g.t[1]);
  return g;
}

// ---- checking: each milestone in an open chapter, the chapters' own rewards, and the long badges ----
let ACH_BUSY = false;
function achCheck(quiet){
  if (!S || ACH_BUSY) return; ACH_BUSY = true;
  try {
    const A = achState(), fresh = [];
    const now = Math.max(1, S.t);   // when (a game's first minute is 0)
    for (const a of ACH){ if (A.d[a.id] || !achHave(a)) continue; A.d[a.id] = now; }
    for (let ch = 0; ch < ACH_CH.length; ch++){
      if (!achOpen(ch)) continue;
      for (const a of achInCh(ch)) if (A.d[a.id] && !A.g[a.id] && !A.owe.some(o => o[0] === a.id)){
        if (!achLive()){ A.g[a.id] = ['', '', -1]; continue; }
        const g = achGive(a.id, [1, 1.5, 2.5][ch], a.n); fresh.push({a, g});
        if (typeof cloudEv === 'function') cloudEv('ach', {id:a.id, ch, n:Object.keys(A.d).length});
      }
      if (!A.ch[ch] && achNDone(ch) === achInCh(ch).length && achLive() && !(typeof tutOn === 'function' && tutOn())){ A.ch[ch] = now; achChapter(ch); fresh.push({ch}); if (typeof cloudEv === 'function') cloudEv('ach_ch', {ch}); }
    }
    // the gifts kept from the first trip
    if (A.owe.length && !(typeof tutOn === 'function' && tutOn())){ const owe = A.owe; A.owe = []; for (const [key, scale, title] of owe){ const g = achGive(key, scale, title); const a = achOf(key); if (a) fresh.push({a, g}); } }
    for (const L0 of ACHL){ const v = L0.v(), got = A.l[L0.id] || 0; let k = got;
      while (k < L0.tiers.length && v >= L0.tiers[k]) k++;
      if (k > got){ A.l[L0.id] = k; if (!achLive() || A.seeding) continue;
        for (let i = got; i < k; i++){ const g = achGive(L0.id + i, 3, L0.n); fresh.push({long:L0, tier:i, g}); } } }
    if (fresh.length && !quiet && typeof achShow === 'function') achShow(fresh);
  } finally { ACH_BUSY = false; }
}
// a chapter's own reward: a pennant on the boat that others see (b.liv pennant level, vessel3d.js), a luck after the second, a hull
// colour after the third
function achChapter(ch){
  const A = achState(); A.pen = Math.max(A.pen || 0, ch + 1);
  if (ch === 1 && typeof giveHaill === 'function') giveHaill('haill', 'gift');
  if (ch === 2){ A.colour = 1; }
  const what = ['Vimpelen er din: den henger i masta på båter med mast, og andre ser den.', 'Vimpelen blir lengre, og en haill ligger om bord.', 'Vimpelen blir enda lengre, og skrogfargen «Kystfisker» er din i Malerverkstedet.'][ch],
    whatEn = ['The pennant is yours: it flies from the mast of a boat with a mast, and others see it.', 'The pennant grows longer, and a luck is aboard.', 'The pennant grows longer still, and the hull colour «Kystfisker» is yours in the paint shop.'][ch];
  msg('Kystposten', 'Kapittel «' + ACH_CH[ch][0] + '» er fullført. ' + what, 'Chapter «' + ACH_CH[ch][1] + '» is complete. ' + whatEn);
  pressPut('ach', {ch});   // in the paper for the others (09h-press.js)
}
// a game played before the badges came: ticked for what it has done, quietly, the gifts with them (shown together once)
function achSeed(){
  if (S.ach) return;
  const A = achState(); A.seeding = true;
  A.best = achBest();
  for (const s of S.sales || []) for (const r of (s.det && s.det.ln) || []) A.sp[r[0]] = 1;
  if ((S.log || []).some(l => /våknet|hviler|Hvilte|sov /.test(l.no || ''))) A.c.sleep = 1;
  if ((S.gearLog || []).length) A.c.haul = 1;
  for (const L0 of ACHL){ const v = L0.v(); let k = 0; while (k < L0.tiers.length && v >= L0.tiers[k]) k++; A.l[L0.id] = k; }
  delete A.seeding;
}

// ---- the first tow and the first repair are free (core/05-vessels.js rescue, hullRepair) ----
function freeFirst(k){ S.free = S.free || {}; if (S.free[k]) return false; S.free[k] = Math.max(1, S.t); return true; }
