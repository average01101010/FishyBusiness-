// ===== The plan maker (Jonas 09.10.2026: «et system som gjør slik at spilleren overholder hviletiden og samtidig klarer å maksimere levert
// tonnasje per døgn … så intuitivt at enhver spiller klarer å forstå det»; «et lite skill-element … plassering av passivt fiskeredskap samt
// hvor man bruker juksa»). The player answers a few questions (where the boat rests, what she fishes with, whether to jig as well, where the
// gear stands and where to jig, how hard a weather, when the day begins), and this file makes the day out of it: the trips, the stations,
// the landings and the rest, as sessions of the standing plan (06d-drift.js), so the engine runs them as before.
//   - the rest: the day's work is held within PLANW.work hours, so the crew always get PLANW.rest hours in one stretch at the base, and the
//     first trip of a day waits until the rest is had (opsStep, o.restT0)
//   - the tonnage: the number of trips and the hours fishing on each are chosen to land the most in the day, from what the sea gives where
//     the player put the gear and the jig (the same density the echo sounder and the heat map read). The places are the skill.
// o.wiz = {base, gear ('juksa' | 'line' | 'garn' | 'teiner'), jig (bool), gp {x, y} where the gear stands, jp {x, y} | null where to jig
// (null: by the gear), jp2, jp3 {x, y} | null: the places the crew moves on to in turn when the catch falls (feedback #57), wx ('safe' | 'normal' | 'tough'), start (hour of day), est (what the day is expected to give, for the page)}
const PLANW = {work:14, rest:10, landH:1, maxTrips:4, minF:0.5,
  wx:{safe:{wind:10, hs:1.5}, normal:{wind:13, hs:2.5}, tough:{wind:16, hs:3.5}},
  // hours per unit to set and to haul (estimates for the day's sums; the engine does the real work)
  setH:{line:0.15, garn:0.1, teine:0.05}, haulH:{line:0.35, garn:0.25, teine:0.1}};
const PLAN_KIND = {line:'line', garn:'garn', teiner:'teine'};
// where the crew can sleep: a rorbu, the home naust, or aboard a boat with bunks
function planRestOk(pid){ const p = portById(pid); if (!p) return false; return isRorbu(pid) || pid === (S.home || HOME0) || (VESSELS[S.boat.type].berths || 0) > 0; }
// the nearest fish plant to a point
function planMottak(p){ let best = null, bd = 1e9; for (const q of PORTS) if (q.mottak){ const d = dist(p, q.p); if (d < bd){ bd = d; best = q; } } return best; }
// the units of the gear the boat would set
function planUnits(kind){
  const pg = S.pgear; if (!pg) return 0;
  if (kind === 'line') return (pg.lines.hyse.n || 0) + (pg.lines.bank.n || 0);
  if (kind === 'garn') return pg.nets.reduce((a, l) => a + l.n, 0);
  if (kind === 'teine') return pg.pots.big || 0;
  return 0;
}
// what the plan maker reckons a place gives: only what the player knows (Jonas 09.10.2026: the plan shows no expected catch; where the fish
// stand is found by fishing). His own catch marks near the place (S.marks: the jig's kg an hour, the gear's kg a unit and its soak) from the
// last PLAN_MEMO days; a place he has not fished is reckoned at an ordinary rate (HEATG.fair), so the plan never tells where the fish are.
const PLAN_MEMO = 14 * 1440, PLAN_NEAR = 1.5;
function planMark(p, g){ let best = null, bd = PLAN_NEAR; for (const m of (S.marks || [])){ if ((m.g || null) !== (g || null) || S.t - m.t > PLAN_MEMO) continue; const d = dist(m, p); if (d < bd){ bd = d; best = m; } } return best; }
function planJigRate(p){ const m = planMark(p, null); return m && m.kgph > 0 ? m.kgph : HEATG.fair.jig * heatRigFactor(); }
function planGearKg(kind, p, soak){
  const m = planMark(p, kind), share = heatSoakShare(kind, soak);
  return m && m.kgu > 0 ? m.kgu * share / Math.max(0.05, heatSoakShare(kind, m.soak || 24)) : HEATG.fair[kind] * share;
}
// a leg of the way by the fairways (11-route.js leiaRoute): the waypoints before the end, and the hours it takes
async function planLeg(a, b, aPort, bPort, speed){
  const r = await leiaRoute(a, b, aPort, bPort);
  if (!r || r.why || !r.wps || !r.wps.length) return null;
  const wps = r.wps.slice(0, -1).map(q => ({x:q.x, y:q.y, port:null, fish:0, leia:true}));
  return {wps, h:driftLegHours(r.wps, speed, a)};
}
// ---- the day: candidates are laid out as trips of stops, sailed through on paper, and the one that lands the most within the work hours wins
// A stop: {at:'G' | 'J', act:'set' | 'haul' | 'cycle' | null, fish:true | false}. A trip goes from its home to its stops and lands at M.
function planCandidates(kind, jig){
  const C = [], J = jig ? 'J' : null;
  if (!kind){   // jigging only: one or more trips out to the jig place and in to land
    for (let k = 1; k <= PLANW.maxTrips; k++) C.push({name:k + 'j', trips:Array.from({length:k}, () => [{at:'J', fish:true}])});
    return C;
  }
  const extra = k => Array.from({length:k}, () => [{at:'J', fish:true}]);
  if (kind === 'line'){
    // set, (jig), haul and land on one trip; or set, (jig), land, then back to haul, (jig), land
    for (let k = 0; k <= (jig ? 2 : 0); k++){
      C.push({name:'L1+' + k, trips:[[{at:'G', act:'set', fish:!J, wait:!jig}, ...(J ? [{at:'J', fish:true}] : []), {at:'G', act:'haul'}], ...extra(k)]});
      if (jig) C.push({name:'L2+' + k, trips:[[{at:'G', act:'set'}, {at:'J', fish:true}], [{at:'G', act:'haul'}, {at:'J', fish:true}], ...extra(k)]});
    }
    return C;
  }
  // nets and pots stand a day: haul what stood and set again, once a day, then jig if wanted
  for (let k = 0; k <= (jig ? 3 : 0); k++) C.push({name:'C+' + k, trips:[[{at:'G', act:'cycle'}, ...(J ? [{at:'J', fish:true}] : [])], ...extra(k)]});
  return C;
}
// sail a candidate through: times, kilos, the timeline. L(from, to) gives a leg's hours; R the jig's kg an hour; gear(soak) a unit's kg.
function planSim(cand, ctx){
  const {L, R, units, gearKg, kind, cap, start} = ctx;
  // the fixed time: legs, gear work, landings; the rest of the work hours goes to fishing
  let fixed = 0, fishStops = 0, waitStops = 0;
  cand.trips.forEach((tr, ti) => { let at = ti === 0 ? 'B' : 'M';
    for (const s of tr){ fixed += L(at, s.at); at = s.at; if (s.at === 'J' && s.fish) fixed += ctx.jc || 0; if (s.act === 'set') fixed += units * PLANW.setH[kind]; if (s.act === 'haul') fixed += units * PLANW.haulH[kind]; if (s.act === 'cycle') fixed += units * (PLANW.setH[kind] + PLANW.haulH[kind]); if (s.fish) fishStops++; if (s.wait) waitStops++; }
    fixed += L(at, 'M') + PLANW.landH; });
  fixed += L('M', 'B');
  let budget = PLANW.work - fixed; if (budget < (fishStops + waitStops) * PLANW.minF - 1e-9 || budget < 0) return null;
  // the line without the jig waits by its gear: six to ten hours of soak, as the budget allows
  const waitH = waitStops ? clamp(budget, 4, 10) : 0; budget -= waitH;
  const tl = [], push = (t, no, en) => tl.push({t, no, en});
  push(start, 'Går fra ' + ctx.bname, 'Leaves ' + ctx.bname);
  let t = start, hold = 0, landed = 0, quay = null, quayFail = false, gearAt = null, gearIn = 0, fishLeft = fishStops, jigKg = 0, gearTot = 0;
  // the gear that stood since yesterday (nets and pots: a day's soak)
  cand.trips.forEach((tr, ti) => {
    let at = ti === 0 ? 'B' : 'M';
    for (let si = 0; si < tr.length; si++){
      const s = tr[si], leg = L(at, s.at); t += leg; at = s.at;
      if (s.act === 'set'){ push(t, 'Setter ' + units + ' ' + GEAR[kind].u[units === 1 ? 0 : 1], 'Sets ' + units + ' ' + GEAR[kind].u[units === 1 ? 2 : 3]); t += units * PLANW.setH[kind]; gearAt = t; }
      else if (s.act === 'haul'){ const soak = gearAt == null ? 0 : t - gearAt, kg = Math.min(cap - hold, units * gearKg(soak)); push(t, 'Trekker redskapet (' + Math.round(soak) + ' t ståtid)', 'Hauls the gear (' + Math.round(soak) + ' h soak)'); t += units * PLANW.haulH[kind]; hold += kg; gearTot += kg; gearAt = null; }
      else if (s.act === 'cycle'){ const kg = Math.min(cap - hold, units * gearKg(24)); push(t, 'Trekker det som har stått i et døgn og setter på nytt', 'Hauls what stood a day and sets again'); t += units * (PLANW.setH[kind] + PLANW.haulH[kind]); hold += kg; gearTot += kg; }
      if (s.wait){ push(t, 'Venter ved redskapet i ' + Math.round(waitH) + ' t', 'Waits by the gear for ' + Math.round(waitH) + ' h'); t += waitH; }
      if (s.fish){
        // the room the gear still to be hauled on this trip will want, before the landing
        const later = tr.slice(si + 1).some(x => x.act === 'haul'), keep = later ? units * gearKg(Math.max(1, (t - (gearAt || t)) + 4)) : 0;
        const share = budget / Math.max(1, fishLeft), room = Math.max(0, cap - hold - keep), fill = R > 0 ? room / R : share, F = Math.max(PLANW.minF, Math.min(share, fill));
        const kg = Math.min(room, R * F), jn = s.at === 'J' ? ctx.jn || 1 : 1;
        if (jn > 1) push(t, 'Jukser på ' + jn + ' plasser etter tur, flytter når fangsten faller (høyst ' + fmt(F, 1) + ' t)', 'Jigs at ' + jn + ' places in turn, moving on when the catch falls (at most ' + fmt(F, 1) + ' h)');
        else push(t, 'Jukser til lasten er full (høyst ' + fmt(F, 1) + ' t)', 'Jigs until the hold is full (at most ' + fmt(F, 1) + ' h)');
        t += F + (jn > 1 ? ctx.jc : 0); hold += kg; jigKg += kg; budget -= F; fishLeft--; s.F = F;
      }
    }
    t += L(at, 'M');
    const lastTrip = ti === cand.trips.length - 1;
    // the plant's opening hours (07-harbours.js mottakOpen): a landing between two trips must find it open; after the last trip the crew
    // rest at its quay and land when it opens, before the next day's first trip (the engine does the same, 06d-drift.js opsLanded)
    if (ctx.open && !ctx.open(t)){
      if (!lastTrip){ ctx.shut = true; quayFail = true; return; }
      const op = ctx.next(t);
      push(t, 'Mottaket i ' + ctx.mname + ' er stengt. Mannskapet hviler ved kaia og leverer kl. ' + driftClock(op) + ', før neste tur', 'The plant at ' + ctx.mname + ' is closed. The crew rest at the quay and land at ' + driftClock(op) + ', before the next trip');
      landed += hold; hold = 0; quay = op; return;
    }
    push(t, 'Leverer i ' + ctx.mname, 'Lands at ' + ctx.mname); t += PLANW.landH; landed += hold; hold = 0;
    if (!lastTrip) push(t, 'Går ut igjen fra ' + ctx.mname, 'Goes out again from ' + ctx.mname);
  });
  if (quayFail) return null;
  if (quay != null) return {kg:landed, work:t - start, end:t, tl, jigKg, gearKg:gearTot, waitH, trips:cand.trips.length, quay:true};
  t += L('M', 'B'); push(t, 'Hviler i ' + ctx.bname + ' til kl. ' + driftClock(start) + ' (' + fmt(Math.max(PLANW.rest, 24 - (t - start)), 0) + ' t)', 'Rests in ' + ctx.bname + ' until ' + driftClock(start) + ' (' + fmt(Math.max(PLANW.rest, 24 - (t - start)), 0) + ' h)');
  return {kg:landed, work:t - start, end:t, tl, jigKg, gearKg:gearTot, waitH, trips:cand.trips.length};
}
// ---- make the plan: async (the legs are found along the fairways). cb(err) when done; o.sess and o.wiz.est are set.
async function planBuild(o, cb){
  const w = o.wiz, kind = PLAN_KIND[w.gear] || null, base = portById(w.base);
  try {
    if (!base) throw [gL('Velg hvor båten skal hvile.', 'Choose where the boat rests.')];
    if (kind && !rigHas(w.gear)) throw [gL('Båten har ikke haleren for ' + driftRigName(w.gear).toLowerCase() + '.', 'The boat has no hauler for ' + driftRigName(w.gear).toLowerCase() + '.')];
    const G = kind ? w.gp : null, J = !kind || w.jig ? (w.jp || G) : null, first = G || J;
    if (!first) throw [gL('Velg hvor det skal fiskes.', 'Choose where to fish.')];
    // the jig places in turn (up to three): the crew comes to the first and leaves from the last (JN)
    const JS = J ? [J, w.jp2, w.jp3].filter(q => q).filter((q, i, l) => l.findIndex(r => dist(r, q) < 0.3) === i) : [], JN = JS[JS.length - 1] || null;
    // the plant: of the ones near the grounds and near the base, the one that makes the way grounds → plant → base the shortest
    const near = (p, n) => PORTS.filter(q => q.mottak).map(q => ({q, d:dist(q.p, p)})).sort((x, y) => x.d - y.d).slice(0, n).map(x => x.q);
    const cands = [...near(JN || G, 3), ...near(base.p, 2)].filter((q, i, l) => l.indexOf(q) === i), last = JN || G;
    if (!cands.length) throw [gL('Fant ikke noe fiskemottak.', 'Found no fish plant.')];
    let M = null, mBest = 1e9, mLegs = null;
    for (const q of cands){ const a1 = await planLeg(last, q.p, null, q.id, BOAT.vcruise); if (!a1) continue; const a2 = q.id === base.id ? {wps:[], h:0} : await planLeg(q.p, base.p, q.id, base.id, BOAT.vcruise); if (!a2) continue;
      if (a1.h + a2.h < mBest){ mBest = a1.h + a2.h; M = q; mLegs = {a1, a2}; } }
    if (!M) throw [gL('Fant ingen vei fra feltet til et fiskemottak.', 'Found no way from the grounds to a fish plant.')];
    try { await mapNeed(first, 14); for (const q of JS) if (q !== first) await mapNeed(q, 14); } catch (e){}
    // the rules at the places: gear, and the jig
    const rq = (p, gear) => ruBlockMsg({p, len:BOAT.len, gear, sp:null, hand:!(S.equip && S.equip.jukse > 0)});
    if (G){ const why = rq(G, w.gear); if (why) throw [gL('Redskapet kan ikke stå der: ', 'The gear cannot stand there: ') + why]; }
    for (const q of JS){ const why = rq(q, 'juksa'); if (why) throw [gL('Det kan ikke jukses der: ', 'You cannot jig there: ') + why]; }
    // the legs: B base, G gear, J jig, M plant. A leg to J goes to the first jig place, a leg from J leaves from the last (PF)
    const P = {B:base.p, G, J, M:M.p}, PF = {...P, J:JN}, port = {B:base.id, M:M.id}, speed = BOAT.vcruise, legs = {[(JN && JN !== G ? 'J' : G ? 'G' : 'J') + 'M']:mLegs.a1, MB:mLegs.a2};
    const need = [['M', 'B']];
    for (const x of ['G', 'J']) if (P[x]) need.push(['B', x], ['M', x], [x, 'M']);
    if (G && J) need.push(['G', 'J'], ['J', 'G']);
    for (const [a, b] of need){
      if (!PF[a] || !P[b] || legs[a + b]) continue;
      if (dist(PF[a], P[b]) < 0.01){ legs[a + b] = {wps:[], h:0}; continue; }
      const r = await planLeg(PF[a], P[b], port[a] || null, port[b] || null, speed);
      if (!r) throw [gL('Fant ingen vei fra ' + ({B:base.name, M:M.name}[a] || 'feltet') + ' til ' + ({B:base.name, M:M.name}[b] || 'feltet') + '.', 'Found no way from ' + ({B:base.name, M:M.name}[a] || 'the grounds') + ' to ' + ({B:base.name, M:M.name}[b] || 'the grounds') + '.')];
      legs[a + b] = r;
    }
    const L = (a, b) => a === b ? 0 : (legs[a + b] || {h:0}).h;
    // the way between the jig places, in turn
    const chain = []; for (let i = 1; i < JS.length; i++){ const r = await planLeg(JS[i - 1], JS[i], null, null, speed); if (!r) throw [gL('Fant ingen vei mellom juksplassene.', 'Found no way between the jig places.')]; chain.push(r); }
    const jc = chain.reduce((a, r) => a + r.h, 0);
    // the day the plan begins: the next day at the hour it starts, on a weekday when the plants keep their ordinary hours
    let H0 = Math.floor(S.t / 1440) * 24 + w.start; if (H0 < S.t / 60) H0 += 24;
    for (let k = 0; k < 7 && !mottakOpen(Math.floor(H0 / 24) * 24 + 12); k++) H0 += 24;
    const open = h => mottakOpen(H0 + h - w.start), next = h => mottakNext(H0 + h - w.start) - H0 + w.start;
    // what the sea gives, at the hour the day begins (tomorrow if it has passed)
    const R = JS.length ? JS.reduce((a, q) => a + planJigRate(q), 0) / JS.length : 0, units = kind ? Math.min(planUnits(kind), (BOAT.gearMax || {})[kind === 'line' ? 'stamp' : kind] || 99) : 0;
    if (kind && units < 1) throw [gL('Du har ikke noe ' + GEAR[kind].no.toLowerCase() + ' om bord.', 'You have no ' + GEAR[kind].en.toLowerCase() + ' aboard.')];
    const gearKg = soak => G ? planGearKg(kind, G, soak) : 0;
    const ctx = {L, R, units, gearKg, kind, cap:capHold(), start:w.start, mname:M.name, bname:base.name, jc, jn:JS.length, open, next};
    let best = null, bc = null;
    for (const c of planCandidates(kind, kind ? w.jig : true)){ const r = planSim(c, ctx); if (r && (!best || r.kg > best.kg + 1)){ best = r; bc = c; } }
    if (!best && ctx.shut) throw [gL('Mottaket i ' + M.name + ' er stengt når båten kommer inn mellom turene. Start dagen tidligere, eller velg et felt nærmere.', 'The plant at ' + M.name + ' is closed when the boat comes in between the trips. Start the day earlier, or choose grounds nearer.')];
    if (!best) throw [gL('Feltet ligger for langt unna til å rekke en tur og ' + PLANW.rest + ' timers hvile i døgnet. Velg et felt nærmere ' + base.name + '.', 'The grounds are too far away for one trip and ' + PLANW.rest + ' hours of rest a day. Choose grounds nearer ' + base.name + '.')];
    // the sessions: each trip from its home to the plant, the stops on the way; then the rest at the base
    const sess = []; let t = w.start;
    bc.trips.forEach((tr, ti) => {
      const home = ti === 0 ? base.id : M.id, wps = []; let at = ti === 0 ? 'B' : 'M';
      const stopPt = s => P[s.at === 'J' && !J ? 'G' : s.at] || P.G;
      for (const s of tr){
        const lk = legs[at + s.at];
        if (lk && !(at === s.at)) wps.push(...lk.wps.map(q => ({...q})));
        // the jig places in turn: the hours shared among them, the way between them; the engine moves on early when the catch falls and
        // sails past the rest once the hold is full (05-vessels.js, wp.jc)
        if (s.at === 'J' && s.fish && JS.length > 1){
          const f = Math.max(0.25, Math.round((s.F || 1) / JS.length * 10) / 10);
          JS.forEach((q, i) => { if (i) wps.push(...chain[i - 1].wps.map(r => ({...r, jc:i + 1}))); wps.push({x:q.x, y:q.y, port:null, fish:f, jc:i + 1, jn:JS.length}); });
          at = s.at; continue;
        }
        const p = stopPt(s), wp = {x:p.x, y:p.y, port:null, fish:s.fish ? Math.round((s.F || 1) * 10) / 10 : s.wait ? Math.round(best.waitH * 10) / 10 : 0};
        if (s.act) wp.act = {op:'cycle', kind, final:s.act === 'haul'};
        wps.push(wp); at = s.at;
      }
      const back = legs[at + 'M']; if (back) wps.push(...back.wps.map(q => ({...q})));
      wps.push({x:M.p.x, y:M.p.y, port:M.id, fish:0});
      const ss = {id:driftSid(), type:'tur', dep:Math.round(t * 4) / 4, asap:ti > 0, route:{wps, speed, home, end:M.id, hours:Math.round(driftLegHours(wps, speed, P[ti === 0 ? 'B' : 'M']) * 10) / 10}};
      sess.push(ss);
      // the next trip leaves as soon as this one has landed (asap); its clock is where the plan's check expects this one to be done
      t = Math.ceil((t + driftSessHours(o, ss)) * 4) / 4;
    });
    sess.push({id:driftSid(), type:'hvile', dep:Math.min(t, w.start + 23.5), asap:true, at:base.id});
    if (t > w.start + 24 - PLANW.rest + 0.5) throw [gL('Dagen blir for lang til ' + PLANW.rest + ' timers hvile. Velg et felt nærmere ' + base.name + '.', 'The day gets too long for ' + PLANW.rest + ' hours of rest. Choose grounds nearer ' + base.name + '.')];
    o.sess = sess; o.rig = w.gear; o.wx = Object.assign({}, PLANW.wx[w.wx] || PLANW.wx.normal, {shelter:true}); o.period = 24; o.days = [1, 1, 1, 1, 1, 1, 1];
    o.idx = 0; o.cn = 0; o.a0 = null; o.hold = 0; o.restT0 = null;
    w.est = {quay:!!best.quay, kg:Math.round(best.kg), work:Math.round(best.work * 10) / 10, rest:Math.round((24 - best.work) * 10) / 10, trips:best.trips, tl:best.tl, jig:Math.round(best.jigKg), gear:Math.round(best.gearKg), R:Math.round(R), units, mottak:M.id, t:S.t};
    w.err = null; if (cb) cb(null);
  } catch (e){ w.err = Array.isArray(e) ? e[0] : String(e && e.message || e); w.est = null; if (cb) cb(w.err); }
}
// a new plan from the questions, with sensible answers to begin with: rest where she lies if the crew can sleep there, else at the nearest rorbu
function planWizDefaults(){
  const b = S.boat, here = b.status === 'port' ? b.port : nearestPort(b.pos).id;
  let base = planRestOk(here) ? here : null;
  if (!base){ try { const r = rorbuSites(portById(here).p, 40)[0]; if (r) base = r.id; } catch (e){} }
  const rig = RIGS[b.rig] && RIGS[b.rig].kind && rigHas(b.rig) ? b.rig : 'juksa', s = mySets()[0];
  return {base:base || here, gear:rig, jig:true, gp:s ? {x:(s.a.x + s.b.x) / 2, y:(s.a.y + s.b.y) / 2} : null, jp:null, jp2:null, jp3:null, wx:'normal', start:5, est:null, err:null};
}
// the places worth fishing near the base, for the player to choose among: the best of his own catch marks, the gear in the sea
function planSpots(base){
  const p = portById(base), out = []; if (!p) return out;
  for (const m of (S.marks || []).slice().sort((a, c) => (c.kgph || 0) - (a.kgph || 0))){ if (dist(m, p.p) > 40) continue; if (out.some(q => dist(q, m) < 1)) continue; out.push({x:m.x, y:m.y, kind:'mark', kgph:m.kgph, d:dist(m, p.p)}); if (out.length >= 4) break; }
  for (const s of mySets()){ const m = {x:(s.a.x + s.b.x) / 2, y:(s.a.y + s.b.y) / 2}; if (!out.some(q => dist(q, m) < 1)) out.push({...m, kind:'set', d:dist(m, p.p)}); }
  const b = S.boat; if (b.status !== 'port' && !out.some(q => dist(q, b.pos) < 1)) out.push({x:b.pos.x, y:b.pos.y, kind:'here', d:dist(b.pos, p.p)});
    return out;
}
