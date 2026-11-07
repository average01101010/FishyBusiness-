// ===== Driftsplan 2 for the snow crab vessel (H3c of docs/planer/havsteget-h3-snokrabbe.md, 06.11.2026) =====
// Jonas 06.11.2026: «Neste økt i havsteget: H3c, snøkrabbe i Driftsplan 2, isen og fredningen». A field of the plan is many strings
// (lenker) of 200 conical pots, each standing its soak in days; the ship goes from string to string, hauls the one that has stood longest
// and sets it out again at once (the portal's «Trekk og sett ut igjen», H3b), round the clock in the teams' watches, until the hold, the
// quota, the bait, the fuel, the provisions or the trip's days say stop; on a live trip (S.boat.snoMode, H3b) also when the tanks are
// full or the oldest crab has been in them long enough. Then she goes to the plant, and the strings stand in the sea while she lands
// (as the fleet does), tended at least every third week (høstingsforskriften § 18; a string that would pass DRP2.sno.tend days before she
// is back is hauled first) and their positions reported (§ 25, snoTend in 10d-snokrabbe.js). The close season (J-237-2025 § 5: no pots in
// the sea from 1 July to 30 November) takes them all ashore in June, and nothing is set before 1 December. The drift ice (V3 B): no string
// is set where the ice will come within its soak, a string the ice edge comes near is taken in, and one under the ice is not hauled
// (SNOI in 10d-snokrabbe.js); the ship goes in drift ice up to her ice class' limit (seaIceLim, 03h-is.js). The weather is the ocean
// vessel's (H2c): over the working limit she waits by the gear, over her own limits she lies to. Nothing here searches or waits, so the
// shared clock plays it closed as open (catchUp).
//
//  p2Sno(o)                the plan is the snow crab vessel's (her conical pots, VESSELS pot 'sno')
//  p2SnoLenke(q, k)        string k of field q: its start, end, heading and id (fid) in the field's pattern
//  p2SnoFit(q, k)          why string k of field q cannot stand there (land, shallow, the rules), or null
//  p2SnoSeason(H, nL)      the open season round H: open, the close (1 July), the last hour to have them in, and when it opens
//  p2SnoQLeft(H, live)     the round weight the vessel may still land this year (the vessel quota, the extra quota when live)
//  p2SnoEnd(o, st)         why the trip is over, and whether every string comes in (all), or null
//  planDaySno(o, H0, st)   the day: the landing, the bait, the sets and the hauls in the order they fall due, the way to the plant
//
// The figures (DRP2.sno): the soak 3-14 days in the plan, 7 by default (HI 2023-51: the test string 3-17 days in 2021 and 4-25 in 2022,
// about 7.6 and 11 on average); a frozen trip of about 20 days and a live one of 8-9 days between landings (the landing notes 2024-2026,
// kap. 2b); the strings side by side 2 km apart (about a nautical mile, so each has its own cells of the stock, STK.c), eight in a row,
// the rows 6.5 km apart (a string is 5 km; the pattern is an assumption, no source gives it);
// 1.2 t round weight a string is reckoned for the quota's budget (6 kg a pot after a week, H3a)
DRP2.sno = {soak:[72, 96, 264, 336], soakDef:168, step:24, days:20, liveDays:10, full:0.95, tank:0.95, age:6, look:24, endD:1, idle:12,
  col:2.0, row:6.5, cols:8, near:30, tend:18, margin:2, lenkeKg:1200, minDepth:120};
const p2Sno = o => p2Kind(o) === 'teine' && typeof snoVessel === 'function' && snoVessel();
const p2SnoKm = () => SNOC.lenke * GEAR.teine.km;
const p2SnoH = () => { const P = POTS.sno; return {set:SNOC.lenke * P.set / 60, haul:SNOC.lenke * P.haul / 60, bait:SNOC.lenke * P.bait}; };
function p2SnoLenke(q, k){
  const D = DRP2.sno, W = Math.max(1, Math.min(q.n, D.cols)), r = Math.floor(k / W), c = k % W, h = q.hdg != null ? q.hdg : 0, km = p2SnoKm();
  const ux = Math.sin(h), uy = -Math.cos(h), vx = Math.cos(h), vy = Math.sin(h), off = (c - (W - 1) / 2) * D.col, al = r * D.row;
  const a = {x:q.x + vx * off + ux * al, y:q.y + vy * off + uy * al};
  return {k, a, b:{x:a.x + ux * km, y:a.y + uy * km}, hdg:h, fid:q.id + '#' + k};
}
// (cached by the field's place, size and heading; a pack not in yet says nothing and is not kept)
const P2SNO_FIT = new Map();
function p2SnoFit(q, k){
  const key = [q.x.toFixed(3), q.y.toFixed(3), q.n, q.hdg, k].join('|'); if (P2SNO_FIT.has(key)) return P2SNO_FIT.get(key);
  const L = p2SnoLenke(q, k), H = p2SnoSeason(S.t / 60, 0).openAt; let why = null;
  try {
    if (isLand(L.a) || isLand(L.b) || !legClear(q, L.a) || !setGeomExact(L.a, L.hdg, p2SnoKm())) why = ['land eller grunt på veien', 'land or shallows in the way'];
    else if (Math.min(depthF(L.a), depthF(L.b)) < DRP2.sno.minDepth) why = ['for grunt (' + Math.round(Math.min(depthF(L.a), depthF(L.b))) + ' m)', 'too shallow (' + Math.round(Math.min(depthF(L.a), depthF(L.b))) + ' m)'];
    else { const r = ruBlockMsg({p:L.a, len:BOAT.len, gear:'teiner', sp:'snokrabbe', H}) || ruBlockMsg({p:L.b, len:BOAT.len, gear:'teiner', sp:'snokrabbe', H}); if (r) why = [r, r]; }
  } catch (e){ return null; }
  if (P2SNO_FIT.size > 4000) P2SNO_FIT.clear(); P2SNO_FIT.set(key, why); return why;
}
// the season round H (J-237-2025 § 5: closed from 1 July to 30 November): open, the close (1 July 00:00), inBy (the hour the last of nL
// strings must be coming in: the hauls one after the other, the way to the plant and DRP2.sno.margin days for the weather), openAt
const p2SnoUTC = (y, m, d) => (Date.UTC(y, m, d) - EPOCH) / 36e5;
function p2SnoSeason(H, nL){
  const g = gDate(H), y = g.getUTCFullYear(), m = g.getUTCMonth(), open = m >= 11 || m < 6, close = p2SnoUTC(m >= 11 ? y + 1 : y, 6, 1);
  const A = p2SnoH(), need = DRP2.sno.margin + (nL || 0) * (A.haul + 0.3) / 24;
  return {open, close, inBy:close - need * 24, openAt:open ? H : p2SnoUTC(y, 11, 1)};
}
// the round weight still to be landed this year: the vessel quota with the flexibility, and the extra quota when the crab goes live
// (J-237-2025 §§ 3 and 4; snoQuota, snoRoom in 03d-quota.js), less the crab aboard
function p2SnoQLeft(H, live){
  const Q = typeof snoQuota === 'function' ? snoQuota(H) : null; if (!Q) return Infinity;
  const q = quotaState(), aboard = S.hold.reduce((a, x) => a + (x.sp === 'snokrabbe' ? x.kg : 0), 0);
  return snoRoom(H) + (live ? Math.max(0, Q.extra - (q.snoTq || 0)) : 0) - aboard;
}
// the state of the snow crab trip for the day (plan2State): the pots and the bait aboard, live or frozen, the tanks, the oldest crab, the
// quota left and the season
function p2SnoState(o, st){
  const pg = S.pgear, F = o.places.filter(q => q.k === 'felt'), nL = F.reduce((a, q) => a + q.n, 0), live = snoLive(), H = st.H;
  const old = S.hold.filter(x => x.tank && x.kg > 0.5).reduce((a, x) => Math.min(a, x.hr), Infinity), Q = typeof snoQuota === 'function' ? snoQuota(H) : null;
  return {pots:potsAboard(pg), bait:pg ? baitKg(pg) : 0, live, tank:tankLoad(), tankCap:tankCap(), age:isFinite(old) ? (H - old) / 24 : null,
    q:p2SnoQLeft(H, live), extraLeft:Q ? Math.max(0, Q.extra - (quotaState().snoTq || 0)) : 0, season:p2SnoSeason(H, nL), nL};
}
// why the trip is over: {why:[no, en], all} with all when every string comes in (the gear fetched, the close season, the year's quota)
function p2SnoEnd(o, st){
  const D = DRP2.sno, Z = st.sno, L = st.left, E = D.endD, H = st.H, A = p2SnoH(), y = yearH(H);
  if (o.fetch) return {all:true, why:['redskapet hentes', 'the gear is fetched']};
  if (!Z.season.open || H >= Z.season.inBy) return {all:true, why:['fredningen begynner 1. juli, og alle teinene skal være på land (J-237-2025 § 5)', 'the close season begins on 1 July, and all the pots must be ashore (J-237-2025 § 5)']};
  if (Z.q <= D.lenkeKg * 0.5) return {all:true, why:['kvoten for ' + y + ' er tatt' + (!Z.live && Z.extraLeft > D.lenkeKg ? '; tilleggskvoten (' + fmt(Z.extraLeft / 1000, 0) + ' t) kan bare tas med levende krabbe' : ''), 'the quota for ' + y + ' is taken' + (!Z.live && Z.extraLeft > D.lenkeKg ? '; the extra quota (' + fmt(Z.extraLeft / 1000, 0) + ' t) can only be taken with live crab' : '')]};
  if (st.hold >= D.full * st.cap) return {why:['lasten er ' + Math.round(100 * st.hold / st.cap) + ' % full', 'the hold is ' + Math.round(100 * st.hold / st.cap) + ' % full']};
  if (Z.live && Z.tankCap > 0 && Z.tank >= D.tank * Z.tankCap) return {why:['tankene er fulle (' + fmt(Z.tank / 1000, 1) + ' t levende krabbe)', 'the tanks are full (' + fmt(Z.tank / 1000, 1) + ' t of live crab)']};
  if (Z.live && Z.age != null && Z.age >= D.age) return {why:['den eldste krabben har vært i tankene i ' + fmt(Z.age, 1) + ' døgn', 'the oldest crab has been in the tanks for ' + fmt(Z.age, 1) + ' days']};
  if (st.at.port == null && Z.bait < A.bait - 1e-6) return {why:['agnet er brukt opp (' + fmt(Z.bait, 0) + ' kg)', 'the bait is spent (' + fmt(Z.bait, 0) + ' kg)']};
  if (L && L.fuel < E) return {why:['drivstoffet rekker ' + (L.fuel < 0.5 ? 'under et halvt døgn' : 'om lag ' + fmt(L.fuel, 1) + ' døgn') + ' til før det trengs for å gå inn', 'the fuel lasts ' + (L.fuel < 0.5 ? 'under half a day' : 'about ' + fmt(L.fuel, 1) + ' days') + ' more before it is needed to go in']};
  if (L && L.prov != null && L.prov < (L.home ? L.home.days : 0) + E) return {why:['provianten rekker ' + fmt(L.prov, 1) + ' døgn til', 'the provisions last ' + fmt(L.prov, 1) + ' days more']};
  const days = Z.live ? Math.min(D.liveDays, (o.land || {}).when === 'days' ? o.land.days : D.liveDays) : (o.land || {}).when === 'days' ? o.land.days || D.days : Infinity;
  if (st.at.port == null && st.tripD >= days) return {why:['turen har vart ' + Math.floor(st.tripD) + ' døgn', 'the trip has lasted ' + Math.floor(st.tripD) + ' days']};
  return null;
}
// the day. Steps as planDayAuto's, with ln (the string's number in its field) on sett and trekk
function planDaySno(o, H0, st){
  const D = DRP2.sno, A = p2SnoH(), Z = st.sno, v = st.v, steps = [], skip = {}, F = o.places.filter(q => q.k === 'felt'), M = plan2P(o, 'M');
  const hp = PALL.lift / 60 / (PALL.kg / 1000), kp = KARLV.lift / 60 / (KARLV.kg / 1000);   // hours a tonne: the clusters on pallets, the live crab in tubs
  let t = H0, at = st.at.p, atPort = st.at.port, pots = Z.pots, bait = Z.bait;
  const go = (q, port) => { t += plan2LegH(o, at, atPort, q, port, v); at = q; atPort = port || null; };
  const R = {t0:H0, steps, skipped:[], end:H0, home:null, dayMax:24, auto:true, sno:true};
  // (what is not done, a line per field and reason: «Felt 1: 4 lenker står til ståtida er ute …»)
  const done = why => { R.end = t; R.why = why; for (const key in skip){ const x = skip[key]; R.skipped.push({id:x.id, no:x.n + ' ' + (x.n === 1 ? 'lenke' : 'lenker') + ' ' + x.no, en:x.n + ' ' + (x.n === 1 ? 'string' : 'strings') + ' ' + x.en}); } return R; };
  const skipAdd = (q, no, en) => { const key = q.id + '|' + no.slice(0, 24), x = skip[key] || (skip[key] = {id:q.id, n:0, no, en}); x.n++; };
  const soakAvg = F.length ? F.reduce((a, q) => a + q.soak * q.n, 0) / Math.max(1, Z.nL) : D.soakDef;
  const tripD = Z.live ? Math.min(D.liveDays, (o.land || {}).when === 'days' ? o.land.days : D.liveDays) : (o.land || {}).when === 'days' ? o.land.days || D.days : D.days;
  const tripBait = () => Math.ceil(Z.nL * A.bait * (1 + tripD * 24 / Math.max(24, soakAvg)));
  const landH = Math.max(DRP2.landH, st.hold / 1000 * hp + Z.tank / 1000 * kp);
  // 1) at the plant with crab aboard: the landing, the bait for the next trip, and out again (or home when the gear is fetched)
  if (atPort && atPort === o.M && (st.hold > 0.5 || Z.tank > 0.5) && !(o.landFail && S.t - o.landFail < 360)){
    steps.push({t, k:'lever', port:o.M, h:landH, sno:true}); t += landH;
    const go2 = !o.fetch && Z.season.open && t + soakAvg < Z.season.inBy && Z.q + holdTotal() > D.lenkeKg;
    if (go2 && bait < tripBait()){ steps.push({t, k:'agn', port:o.M, kg:Math.ceil(tripBait() - bait), sno:true}); t += DRP2.stockH; }
    if (o.fetch && o.home !== o.M){ go(plan2P(o, 'H'), plan2Port(o, 'H')); steps.push({t, k:'hjem', port:o.home, anchor:!!o.homeA}); }
    else steps.push({t, k:'ut'});
    return done(['leverer og gjør klar til neste tur', 'lands and makes ready for the next trip']);
  }
  const end = p2SnoEnd(o, st), all = !!(end && end.all), sets = st.sets.filter(s => s.kind === 'teine');
  const why = end ? ['turen er over: ' + end.why[0], 'the trip is over: ' + end.why[1]] : ['døgndrift med lagene: lenkene trekkes når ståtida er ute og settes ut igjen med én gang, til lasten, kvoten, agnet, drivstoffet, provianten eller turens døgn sier stopp', 'round the clock with the teams: the strings are hauled when the soak is up and set out again at once, until the hold, the quota, the bait, the fuel, the provisions or the trip\'s days say stop'];
  // nothing in the sea and nothing aboard, and the season, the quota or the fetch says stop: she lies where she is (home from the sea),
  // and the plan waits until the season opens (with the way out before it), the new year's quota, or the next look
  if (all && !sets.length && st.hold < 0.5 && Z.tank < 0.5){
    if (!atPort){ steps.push({t, k:'avgang', from:null}); go(plan2P(o, 'H'), plan2Port(o, 'H')); steps.push({t, k:'hjem', port:o.home, anchor:!!o.homeA}); return done(end.why); }
    const q0 = F[0], way = q0 ? plan2LegH(o, at, atPort, q0, null, v) : 0, y = yearH(H0);
    R.idleUntil = !Z.season.open || H0 >= Z.season.inBy ? Math.max(H0 + 0.5, Math.min(H0 + 24, Z.season.openAt - way - 1 + (Z.season.open ? 24 * 160 : 0))) : o.fetch ? null : Math.min(H0 + 24, p2SnoUTC(y + 1, 0, 1));
    return done(end.why);
  }
  // in port: the trip's bait (akkar), bought at the plant before she goes; from another port only when not a round of the strings is aboard
  if (!end && atPort && M && (atPort === o.M ? bait < tripBait() * 0.9 : bait < A.bait * Math.max(1, Z.nL))){ if (atPort !== o.M){ steps.push({t, k:'avgang', from:atPort}); go(M, o.M); } steps.push({t, k:'agn', port:o.M, kg:Math.ceil(tripBait() - bait), sno:true}); t += DRP2.stockH; bait = Math.max(bait, tripBait()); }
  if (!steps.length || steps[steps.length - 1].k !== 'avgang') steps.push({t, k:'avgang', from:atPort});
  if (st.lag) steps.push({t, k:'lagvakt', me:!!st.me.aboard});
  // the quota's budget: what may still be landed less a string's catch for each standing (a new set, or a string set out again, takes one)
  let budget = Z.q - sets.length * D.lenkeKg;
  const iceAt = (a, b, H) => snoIceOf(a, b, H), iceComes = (a, b, Ha, Hb, lim) => { for (let h = Ha; h <= Hb + 1e-9; h += 12) if (iceAt(a, b, h) >= lim) return h; return null; };
  const dd = H => { const d = gDate(H); return d.getUTCDate() + '.' + (d.getUTCMonth() + 1) + '.'; };
  // why a string cannot be set at hour tt (again: the one just hauled, its pots back aboard and its share of the quota already kept)
  const setWhy = (q, L, tt, again) => {
    const se = p2SnoSeason(tt, Z.nL);
    if (!se.open || tt + q.soak > se.inBy) return ['settes ikke: fredningen begynner 1. juli', 'not set: the close season begins on 1 July'];
    if (!again && pots < SNOC.lenke) return ['står om bord: ingen teiner igjen', 'stay aboard: no pots left'];
    if (bait < A.bait - 1e-6) return ['settes ikke: agnet er brukt opp', 'not set: the bait is spent'];
    if (budget < D.lenkeKg) return ['settes ikke: kvoten rekker ikke en lenke til', 'not set: the quota is short of another string'];
    const ih = iceComes(L.a, L.b, tt, tt + q.soak + 48, SNOI.set); if (ih != null) return ['settes ikke: drivisen kommer dit ' + dd(ih), 'not set: the drift ice comes there on ' + dd(ih)];
    const f = p2SnoFit(q, L.k); if (f) return ['får ikke plass: ' + f[0], 'have no room: ' + f[1]];
    return null;
  };
  // pass 1: the fields in the player's order, each string in its turn: one that stands is hauled when due (pass 2; sooner when the ice
  // edge comes, and then not set again there), an empty one is set when pots, bait, the quota, the season and the ice allow it
  const cyc = [], seen = new Set(), until = H0 + D.look;
  for (const q of F){
    for (let k = 0; k < q.n; k++){
      const L = p2SnoLenke(q, k), s = sets.find(x => x.fid === L.fid); seen.add(L.fid);
      if (s){ let due = s.tSet / 60 + q.soak; const ih = iceComes(s.a, s.b, Math.max(t, s.tSet / 60), due + 24, SNOI.near); if (ih != null) due = Math.max(s.tSet / 60 + 24, Math.min(due, ih - 24));
        cyc.push({q, L, s, at:s.a, due, set:s.tSet / 60, ice:ih != null, n:s.n}); continue; }
      if (end) continue;
      const w = setWhy(q, L, t + plan2LegH(o, at, atPort, L.a, null, v), false); if (w){ skipAdd(q, w[0], w[1]); continue; }
      go(L.a); steps.push({t, k:'sett', pid:q.id, ln:k, n:SNOC.lenke, kind:'teine', h:A.set}); t += A.set; pots -= SNOC.lenke; bait -= A.bait; budget -= D.lenkeKg;
      cyc.push({q, L, s:null, at:L.a, due:t + q.soak, set:t, ice:false, n:SNOC.lenke});
    }
  }
  // strings in the sea that are no longer the plan's (a field made smaller or taken away): hauled in when their soak is up
  for (const s of sets) if (!seen.has(s.fid)){ const q = F.slice().sort((a, c) => dist(a, s.a) - dist(c, s.a))[0] || {id:null, soak:D.soakDef, x:s.a.x, y:s.a.y}; cyc.push({q, L:{k:null, a:s.a, b:s.b, fid:s.fid}, s, at:s.a, due:s.tSet / 60 + (q.soak || D.soakDef), set:s.tSet / 60, ice:true, n:s.n, orphan:true}); }
  // (now: a haul before the soak is up, the ice coming, the ship idle, § 18 before she goes in, everything in for the season: the engine
  // starts it on arrival, as no other haul starts before its soak is up)
  const haul = (p, reset, now) => {
    steps.push({t, k:'trekk', pid:p.q.id, ln:p.L.k, fid:p.L.fid, n:p.n, kind:'teine', h:A.haul, soakH:t - p.set, reset, wait:0, due:now || t < p.due - 1e-6 ? null : p.due, now:!!(now || t < p.due - 1e-6)}); t += A.haul;
    if (reset){ steps.push({t, k:'sett', pid:p.q.id, ln:p.L.k, n:p.n, kind:'teine', h:A.set, again:true}); t += A.set; bait -= A.bait; budget -= D.lenkeKg; p.set = t; p.due = t + p.q.soak; return false; }
    pots += p.n; return true; };
  // the strings under the ice cannot be hauled now: they wait for it (said on the day)
  const under = p => { const c = iceAt(p.at, p.s ? p.s.b : p.L.b, t); if (c < SNOI.haul) return false; skipAdd(p.q, 'under drivisen (' + Math.round(c / 10) + '/10): trekkes når isen går', 'under the drift ice (' + Math.round(c / 10) + '/10): hauled when the ice goes'); return true; };
  if (all){
    // every string comes in now, the nearest first, whatever its soak; then to the plant
    while (cyc.length){ cyc.sort((a, c) => dist(at, a.at) - dist(at, c.at)); const p = cyc.shift(); if (under(p)) continue; go(p.at); haul(p, false, true); }
  } else if (end){
    // the trip is over: the strings stand while she lands, but one that would pass DRP2.sno.tend days before she is back is tended first (§ 18)
    const away = M ? 2 * plan2LegH(o, at, null, M, o.M, v) + landH + 12 : 48;
    for (const p of cyc.slice().sort((a, c) => a.set - c.set)){ if ((t + away - p.set) / 24 < D.tend || under(p)) continue; go(p.at); haul(p, !p.ice && !p.orphan && !setWhy(p.q, p.L, t + A.haul, true), true); }
  } else {
    // pass 2: the hauls in the order they fall due, never before the soak is up, over the hours ahead; each set out again at once while
    // the trip goes on (setWhy), else hauled in with its pots aboard
    // (she does not lie idle for long: when the next string is more than DRP2.sno.idle hours off, the one that has stood longest is hauled
    // now, if it has stood the shortest soak, DRP2.sno.soak[0], 3 days; HI 2023-51: 3-25 days. So the season's first trip, the strings
    // all set at once, and the way back from the plant do not cost days of waiting; with enough strings for the soak she never waits)
    const arr = x => t + plan2LegH(o, at, atPort, x.at, null, v);
    for (let k = 0; k < 400 && cyc.length; k++){
      cyc.sort((a, c) => a.due - c.due); let p = cyc[0], now = false;
      if (p.due > arr(p) + D.idle){ const e = t < until ? cyc.filter(x => !x.orphan && !x.ice && arr(x) - x.set >= D.soak[0]).sort((a, c) => a.set - c.set)[0] : null; if (e){ p = e; now = true; } }
      if (!now && p.due > until) break;
      if (under(p)){ cyc.splice(cyc.indexOf(p), 1); continue; }
      go(p.at); const tArr = t; if (!now) t = Math.max(t, p.due);
      if (t - tArr > 1 / 60) steps.push({t:tArr, k:'vent', pid:p.q.id, ln:p.L.k, fid:p.L.fid, until:t});
      if (haul(p, !p.ice && !p.orphan && !setWhy(p.q, p.L, t + A.haul, true), now)) cyc.splice(cyc.indexOf(p), 1);
    }
    const left = cyc.filter(p => p.due > until).sort((a, c) => a.due - c.due);
    for (const p of left){ const w = p2When(p.due, H0); skipAdd(p.q, 'står til ståtida er ute (den første ' + w[0] + ')', 'stand until the soak is up (the first ' + w[1] + ')'); }
    // nothing to haul in the coming hours: she waits for the first that falls due (in port she goes out in time for it)
    if (!steps.some(s => s.k === 'sett' || s.k === 'trekk') && left.length){ const way = plan2LegH(o, at, atPort, left[0].at, null, v); R.idleUntil = Math.max(H0 + 0.5, Math.min(left[0].due - way - 0.5, H0 + 2 * D.look)); }
  }
  // the trip is over: to the plant to land
  if (end && M){ go(M, o.M); steps.push({t, k:'lever', port:o.M, h:landH, sno:true}); }
  return done(why);
}
// the steps as text (planDayText asks for the snow crab day's own): null for a step that is not the snow crab's own
function p2SnoText(o, s, pl, kl, at){
  const lk = n => n == null ? ['en lenke', 'a string'] : ['lenke ' + (n + 1), 'string ' + (n + 1)];
  if (s.k === 'sett' && s.ln !== undefined) return s.again ? ['Setter ' + lk(s.ln)[0] + ' ut igjen på ' + pl(s.pid)[0] + ' (agnet med akkar)', 'Sets ' + lk(s.ln)[1] + ' out again at ' + pl(s.pid)[1] + ' (baited with squid)'] : ['Setter ' + lk(s.ln)[0] + ' på ' + pl(s.pid)[0] + ' (' + s.n + ' teiner)', 'Sets ' + lk(s.ln)[1] + ' at ' + pl(s.pid)[1] + ' (' + s.n + ' pots)'];
  if (s.k === 'trekk' && s.ln !== undefined) return ['Trekker ' + lk(s.ln)[0] + ' på ' + (s.pid ? pl(s.pid)[0] : 'feltet') + ' (sto ' + fmt(s.soakH / 24, 1) + ' døgn)' + (s.reset ? '' : ', teinene om bord'), 'Hauls ' + lk(s.ln)[1] + ' at ' + (s.pid ? pl(s.pid)[1] : 'the field') + ' (stood ' + fmt(s.soakH / 24, 1) + ' days)' + (s.reset ? '' : ', the pots aboard')];
  if (s.k === 'vent' && s.ln !== undefined) return ['Venter ved ' + lk(s.ln)[0] + ' på ' + pl(s.pid)[0] + ' til ståtida er ute ' + kl(s.until), 'Waits by ' + lk(s.ln)[1] + ' at ' + pl(s.pid)[1] + ' until the soak is up at ' + at(s.until)];
  if (s.k === 'lever' && s.sno) return ['Leverer i ' + (portById(s.port) || {name:'?'}).name + ' (klør på paller og levende krabbe i kar, om lag ' + fmt(s.h, 0) + ' t)', 'Lands at ' + (portById(s.port) || {name:'?'}).name + ' (clusters on pallets and live crab in tubs, about ' + fmt(s.h, 0) + ' h)'];
  if (s.k === 'agn' && s.sno){ const w = s.kg >= 1000 ? fmt(s.kg / 1000, 1) + ' t' : s.kg + ' kg'; return ['Kjøper ' + w + ' agn for turen i ' + (portById(s.port) || {name:'?'}).name + ' (akkar, et halvt kilo per teine)', 'Buys ' + w + ' of bait for the trip at ' + (portById(s.port) || {name:'?'}).name + ' (squid, half a kilo a pot)']; }
  if (s.k === 'lagvakt'){ const G = typeof lagOf === 'function' ? lagOf() : null, sh = G ? lagShName(G.on) : 'A'; return ['Lagene går seks og seks: 1. vakt 00–06 og 12–18, 2. vakt 06–12 og 18–24 (skift ' + sh + ' om bord, ' + lagN() + ' mann' + (s.me ? ', og du' : '') + ')', 'The teams go six and six: 1st watch 00–06 and 12–18, 2nd watch 06–12 and 18–24 (crew ' + sh + ' aboard, ' + lagN() + ' men' + (s.me ? ', and you' : '') + ')']; }
  return null;
}
// the check's own for the snow crab vessel (plan2Check): the strings each field asks for against the pots she owns and § 28, a string
// that has no room, the buoy sets (one a string), the soak against § 18, the close season and the year's quota
function p2SnoCheck(o, st, ER, Wn){
  const F = o.places.filter(q => q.k === 'felt'), want = F.reduce((a, q) => a + q.n, 0), own = p2Units('teine'), no = gL, D = DRP2.sno;
  const k = p2Kits(); if (F.length && k < 1) ER(no('Hver lenke i sjøen trenger et blåsesett og en dregg i hver ende, og båten har ingen. Blåsesett kjøpes i utstyrsbutikken.', 'Every string in the sea needs a buoy set and an anchor at each end, and the boat has none. Buoy sets are bought at the tackle shop.'), 'butikk');
  else if (want > k) Wn.push(no('Feltene vil ha ' + want + ' lenker, og båten har blåsesett til ' + k + '. Kjøp flere i utstyrsbutikken.', 'The fields want ' + want + ' strings, and the boat has buoy sets for ' + k + '. Buy more at the tackle shop.'));
  if (want > own) Wn.push(no('Feltene vil ha ' + want + ' lenker, men båten har teiner til ' + own + ' (' + fmtC(own * SNOC.lenke) + ' teiner). De første feltene får det som finnes.', 'The fields want ' + want + ' strings, but the boat has pots for ' + own + ' (' + fmtC(own * SNOC.lenke) + ' pots). The first fields get what there is.'));
  if (want * SNOC.lenke > SNOC.max) Wn.push(no('Høyst ' + fmtC(SNOC.max) + ' teiner per fartøy (høstingsforskriften § 28), altså ' + SNOC.max / SNOC.lenke + ' lenker.', 'At most ' + fmtC(SNOC.max) + ' pots a vessel (høstingsforskriften § 28), so ' + SNOC.max / SNOC.lenke + ' strings.'));
  for (const [i, q] of F.entries()){ let bad = 0, why = null; for (let j = 0; j < q.n; j++){ const f = p2SnoFit(q, j); if (f){ bad++; why = why || f; } }
    if (bad === q.n && q.n) ER(no('Ingen av lenkene på felt ' + (i + 1) + ' får plass: ' + why[0] + '. Flytt feltet.', 'None of the strings at field ' + (i + 1) + ' has room: ' + why[1] + '. Move the field.'), 'places');
    else if (bad) Wn.push(no(bad + ' av ' + q.n + ' lenker på felt ' + (i + 1) + ' får ikke plass (' + why[0] + ') og settes ikke.', bad + ' of ' + q.n + ' strings at field ' + (i + 1) + ' have no room (' + why[1] + ') and are not set.'));
    if (q.soak > D.soak[2]) Wn.push(no('Ståtida på felt ' + (i + 1) + ' er ' + Math.round(q.soak / 24) + ' døgn. Teinene skal røktes minst hver tredje uke (høstingsforskriften § 18), og turen til mottaket kommer i tillegg.', 'The soak at field ' + (i + 1) + ' is ' + Math.round(q.soak / 24) + ' days. The pots must be tended at least every third week (høstingsforskriften § 18), and the trip to the plant comes on top.')); }
  const se = p2SnoSeason(st.H, want);
  if (!se.open || st.H >= se.inBy){ const d = gDate(se.openAt); Wn.push(no('Snøkrabben er fredet fra 1. juli til 30. november (J-237-2025 § 5). Planen tar teinene på land før 1. juli og setter ingenting før ' + (se.open ? '1. desember' : d.getUTCDate() + '.' + (d.getUTCMonth() + 1) + '.') + '.', 'The snow crab is closed from 1 July to 30 November (J-237-2025 § 5). The plan takes the pots ashore before 1 July and sets nothing before ' + (se.open ? '1 December' : d.getUTCDate() + '.' + (d.getUTCMonth() + 1) + '.') + '.')); }
  const qL = p2SnoQLeft(st.H, snoLive()); if (qL <= D.lenkeKg) Wn.push(no('Kvoten for ' + yearH(st.H) + ' er tatt. Planen venter til nyttår' + (!snoLive() && st.sno && st.sno.extraLeft > D.lenkeKg ? ', eller ta tilleggskvoten med levende krabbe under Levering' : '') + '.', 'The quota for ' + yearH(st.H) + ' is taken. The plan waits until the new year' + (!snoLive() && st.sno && st.sno.extraLeft > D.lenkeKg ? ', or take the extra quota with live crab under Landing' : '') + '.'));
}
