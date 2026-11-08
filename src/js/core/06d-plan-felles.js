// ===== The plan's shared parts (Ø12 C, 08.11.2026). The old operations plan (core/06d-drift.js and ui/05c-drift.js, 23.10.2026) was
// taken out when Driftsplan 2 had replaced it (Jonas 05.11.2026: «Ja, rydd bort den gamle»). What Driftsplan 2 (06g-plan2.js,
// 06h-plan2-engine.js, ui/05d-plan2.js, ui/03g-planmap.js) and the rest of the game still use from it is kept here: the clock, the legs
// between the places found along the fairways, the crew's rest, the rules at the places, the player's own catch marks, and who sails her.
// A save with a plan of v3 or older is switched off with a word by plan2Ops (06g-plan2.js); the gear in the sea stays where it is.
// Hand-overs (one line each): the files that call them were held by other sessions on 08.11.2026 (05-vessels.js opsStep, opsLanded,
// driftWx; 03-simulation.js and 13-work.js opsSkipper; 10-gear.js and 06-services.js driftStock). They go when those calls are made
// straight to plan2Step, plan2Landed and plan2Wx.
const DRP = {tired:72, rested:25, bigLen:24, legsMax:240};
const PLAN_KIND = {line:'line', garn:'garn', teiner:'teine'};
const drKind = o => PLAN_KIND[o.rig] || null;
const drJig = o => !drKind(o) || !!o.jig;
const driftHod = H => { const g = gDate(H); return g.getUTCHours() + g.getUTCMinutes() / 60; };
const driftClock = h => { const x = ((h % 24) + 24) % 24, hh = Math.floor(x), mm = Math.round((x - hh) * 60); return String(mm === 60 ? (hh + 1) % 24 : hh).padStart(2, '0') + ':' + String(mm === 60 ? 0 : mm).padStart(2, '0'); };
// who sails her: you when you are aboard, else the crew's skipper (13-work.js)
function opsSkipper(){ return meAboard() ? null : crewSkipper(); }
// the hand-overs to Driftsplan 2 (06h-plan2-engine.js, 06g-plan2.js)
function opsStep(H){ plan2Step(H); }
function opsLanded(pid, k){ plan2Landed(pid, k); }
function driftWx(){ return plan2Wx(); }
// the bunker and ice at the plant: all of it (a plan has no stock choices since 23.10.2026)
function driftStock(){ return {ice:true, fuel:true, gear:true, bait:true}; }

// ---- what a place gives: only what the player knows (Jonas 09.10.2026: the plan shows no expected catch; where the fish stand is found by
// fishing). His own catch marks near the place (S.marks: the jig's kg an hour, the gear's kg a unit and its soak) from the last PLAN_MEMO
// days; a place he has not fished is reckoned at an ordinary rate (HEATG.fair), so the plan never tells where the fish are.
const PLAN_MEMO = 14 * 1440, PLAN_NEAR = 1.5;
function planMark(p, g){ let best = null, bd = PLAN_NEAR; for (const m of (S.marks || [])){ if ((m.g || null) !== (g || null) || S.t - m.t > PLAN_MEMO) continue; const d = dist(m, p); if (d < bd){ bd = d; best = m; } } return best; }
function planJigRate(p){ const m = planMark(p, null); return m && m.kgph > 0 ? m.kgph : HEATG.fair.jig * heatRigFactor(); }

// ---- the legs between the places, found along the fairways (11-route.js leiaRoute) and kept in o.legs: {w [[x, y] …] the points before
// the end, d km}; the hours are reckoned at the boat's cruising speed when the leg is used. A leg between two places at sea with clean
// water between them is straight and needs no search.
const drCK = (p, port) => port ? 'p:' + port : p.x.toFixed(3) + ',' + p.y.toFixed(3);
const drLK = (a, ap, b, bp) => drCK(a, ap) + '>' + drCK(b, bp);
const drLegD = (pts, from) => { let d = 0, a = from; for (const p of pts){ if (a) d += dist(a, p); a = p; } return d; };
const drH = d => d / (Math.max(1, BOAT.vcruise || 7) * NM);
function drLeg(o, a, ap, b, bp){
  if (!a || !b) return null;
  const key = drLK(a, ap, b, bp); if (drCK(a, ap) === drCK(b, bp) || dist(a, b) < 0.005) return {w:[], h:0};
  const L = o.legs[key]; if (L) return L.none ? null : {w:L.w, h:drH(L.d != null ? L.d : drLegD(L.w.map(q => ({x:q[0], y:q[1]})).concat([b]), a)), d:L.d};
  if (!ap && !bp){ let clean = false; try { clean = !groundCheck(a, b); } catch (e){} if (clean){ const d = dist(a, b); return {w:[], h:drH(d), d}; } }
  return null;
}
function drLegPut(o, key, r, a, b){
  o.legs[key] = r && r.wps && !r.why && r.wps.length ? {w:r.wps.slice(0, -1).map(q => [+q.x.toFixed(4), +q.y.toFixed(4)]), d:Math.round(drLegD(r.wps, a) * 1000) / 1000, t:S.t} : {none:true, t:S.t};
  const ks = Object.keys(o.legs); if (ks.length > DRP.legsMax){ ks.sort((x, y) => (o.legs[x].t || 0) - (o.legs[y].t || 0)); for (const k of ks.slice(0, ks.length - DRP.legsMax)) delete o.legs[k]; }
}
// the legs still missing are found in the background, one vessel at a time (the plan waits for them meanwhile)
const DRBUSY = new Map();
function drFetch(o, pairs, vid){
  vid = vid || S.cur; if (DRBUSY.has(vid) || !pairs.length) return DRBUSY.get(vid) || Promise.resolve();
  const job = (async () => {
    for (const q of pairs){ const key = drLK(q.a, q.ap, q.b, q.bp), L0 = o.legs[key]; if (L0 && (!L0.none || S.t - (L0.t || 0) < 60)) continue;
      let r = null; try { r = await leiaRoute(q.a, q.b, q.ap || null, q.bp || null); } catch (e){ console.error(e); }
      drLegPut(o, key, r, q.a, q.b); }
  })().finally(() => DRBUSY.delete(vid));
  DRBUSY.set(vid, job); return job;
}
// a leg that was not found is tried again after an hour
function drLegsStale(o){ for (const k in o.legs) if (o.legs[k].none && S.t - (o.legs[k].t || 0) > 60) delete o.legs[k]; }

// ---- the crew: rested, and had enough
function drFat(){ const C = crewAboard(); return C.length ? Math.max(...C.map(c => c.fatigue || 0)) : null; }
function drRested(){ if (skipOn()) return true; const f = drFat(); return f == null || f <= DRP.rested; }
function drTired(){ if (skipOn()) return false; const f = drFat(); return f != null && f >= DRP.tired; }
// you took the boat over: your own route, Autonav, «Stopp» or the wheel by hand. The plan waits until you give her back («Fortsett planen»)
const drTook = () => !!(S.plan && !S.plan.ops) || (typeof helmOn === 'function' && helmOn());

// ---- a closed place, or the cod quota used up, at the hour H (Jonas 23.10.2026); o: {fields, jigs, rig, jig}
function drRulesWhy(o, H, placesOnly){
  const kind = drKind(o), hand = !(S.equip && S.equip.jukse > 0);
  // (the pots' own species, potSp: the snow crab vessel's conical pots take snow crab, H3c; the hour H the plan asks for)
  for (const [i, f] of o.fields.entries()){ const why = ruBlockMsg({p:f, len:BOAT.len, gear:o.rig === 'teiner' ? 'teiner' : kind, sp:kind === 'teine' ? potSp() : null, H}); if (why) return {k:'closed', fix:'places', no:'Felt ' + (i + 1) + ' er stengt: ' + why, en:'Field ' + (i + 1) + ' is closed: ' + why}; }
  if (drJig(o)) for (const [i, j] of o.jigs.entries()){ const why = ruBlockMsg({p:j, len:BOAT.len, gear:'juksa', sp:null, hand}); if (why) return {k:'closed', fix:'places', no:'Juksplass ' + (i + 1) + ' er stengt: ' + why, en:'Jig place ' + (i + 1) + ' is closed: ' + why}; }
  if (!placesOnly && o.rig !== 'teiner' && access() !== 'none'){ const q = quotaState(); if (q.torsk >= codLimitNow(H) - 1) return {k:'quota', fix:'quota', no:'Torskekvoten er brukt opp.', en:'The cod quota is used up.'}; }
  return null;
}
