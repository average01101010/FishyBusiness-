// ===== Drift: the standing operations plan, per vessel. Made anew 23.10.2026 (Jonas: «en fullstendig redesign av driftsplan-systemet …
// forenkles ytterligere og gjøres så intuitivt som mulig for brukerne samtidig som det innehar dem funksjonen det må ha»).
// The plan is the player's answers and nothing else (S.ops, a vessel's own field, VKEYS):
//   home    where the boat lies between the days and the crew sleep: a port (the naust, a rorbu, a plant, shop or yard quay). A big boat
//           (DRP.bigLen m and over) may lie at anchor near it (homeA); when the anchorage is too open for the night she lies at the quay
//   rig     what she fishes with, one rig at a time (juksa, line, garn, teiner), and jig: whether to jig as well
//   fields  where the gear stands: as many as the player likes, each {id, x, y, n units, soak hours}
//   jigs    where to jig, in the order given: the crew move on to the next when the catch falls (05-vessels.js fish, wp.jc)
//   wx      how rough a weather: 'safe', 'normal' or 'tough' (DRW)
//   rhythm  'day': out at `dep` o'clock, fish and land until the crew have had enough, then home to rest until they are rested
//           'watch': round the clock, 2 and 2 on watch (four hands and bunks), landing when the hold is full
//           'multi': trips of `days` days for a boat with bunks; the crew rest aboard (at anchor near the grounds on a big boat, else at the
//           plant's quay) and go home at the end of the trip
// The plant is always the nearest to the grounds (o.M, found when the plan is made). The engine makes each trip from the answers when the
// boat is free to go (drTrip): the gear that is due, the jig places in turn, the landing. The legs between the places are found along the
// fairways when the plan is made (driftMake) and kept (o.legs), so the plan runs on the world's clock while the game is closed: catchUp plays
// the minutes one after the other and never waits for a search.
// When you are aboard you are the skipper. When you are not, the crew's skipper and mate must both be aboard (c.sk, c.mate, 13-work.js);
// a boat with room for one hand only runs the plan with you aboard, and waits while you are ashore (Jonas 23.10.2026).
// a place being picked in the chart for the plan (ui/05c-drift.js): {vid, spot}
let DRIFTCTX = null;
const DRV = 3;
const DRW = {safe:{wind:10, hs:1.5}, normal:{wind:13, hs:2.5}, tough:{wind:16, hs:3.5}};
const DRP = {dayMax:14, tired:72, rested:25, late:8, tripMax:24, minTrip:1.5, landH:1, fieldsMax:8, jigsMax:6, days:[2, 7], bigLen:24,
  setH:{line:0.15, garn:0.1, teine:0.05}, haulH:{line:0.35, garn:0.25, teine:0.1},
  // the soak each gear should have, hours: [too short under, good from, good to, too long over] (the fish and the gear suffer outside it)
  soak:{line:[4, 6, 20, 30], garn:[8, 12, 36, 60], teine:[18, 24, 60, 96]}, soakDef:{line:8, garn:24, teine:48},
  failMax:3, repMax:120, legsMax:240};
const DRF_RIGS = {juksa:{mode:'tur'}, line:{mode:'sett', kind:'line'}, garn:{mode:'sett', kind:'garn'}, teiner:{mode:'sett', kind:'teine'}};
const PLAN_KIND = {line:'line', garn:'garn', teiner:'teine'};
const driftRigName = r => rigName(r);
const drKind = o => PLAN_KIND[o.rig] || null;
const drJig = o => !drKind(o) || !!o.jig;
const driftHod = H => { const g = gDate(H); return g.getUTCHours() + g.getUTCMinutes() / 60; };
const driftClock = h => { const x = ((h % 24) + 24) % 24, hh = Math.floor(x), mm = Math.round((x - hh) * 60); return String(mm === 60 ? (hh + 1) % 24 : hh).padStart(2, '0') + ':' + String(mm === 60 ? 0 : mm).padStart(2, '0'); };
const drBig = () => (BOAT.len || 0) >= DRP.bigLen;
let DRF_SID = 0;
const driftSid = () => Date.now().toString(36).slice(-4) + (DRF_SID++).toString(36);
function driftNew(over){
  const b = S.boat, here = b.status === 'port' ? b.port : null;
  return Object.assign({v:DRV, on:false, home:here, anchor:false, rig:RIGS[b.rig] ? b.rig : 'juksa', jig:true, fields:[], jigs:[], wx:'normal', rhythm:'day', dep:5, days:3,
    legs:{}, M:null, homeA:null, restA:null, made:null, err:null, day:null, cur:null, wait:null, stop:null, held:null, fails:0, hold:0, rep:[]}, over || {});
}
// an older plan (sessions and routes, before 23.10.2026) is switched off with a word (Jonas: «nytt system, nye planer»); the gear in the sea stays
function driftOps(){
  const o = S.ops; if (!o || o.v === DRV) return o;
  if (o.v === 4) return null;   // a Driftsplan 2 plan (06g-plan2.js) is the new engine's, not this one's
  S.ops = null;
  msg(gL('Driftsplan', 'Operations plan'), 'Driftsplanen er laget på nytt og er enklere å sette opp. Den gamle planen for «' + S.boatName + '» er slått av. Lag en ny under Driftsplan. Redskapet i sjøen står der det står.', 'The operations plan has been made anew and is simpler to set up. The old plan for «' + S.boatName + '» is switched off. Make a new one under Operations plan. The gear in the sea stays where it is.');
  return null;
}
const driftMeSk = o => !!o && meAboard();
function opsSkipper(){ return meAboard() ? null : crewSkipper(); }

// ---- what the plan maker reckons a place gives: only what the player knows (Jonas 09.10.2026: the plan shows no expected catch; where the
// fish stand is found by fishing). His own catch marks near the place (S.marks: the jig's kg an hour, the gear's kg a unit and its soak) from the
// last PLAN_MEMO days; a place he has not fished is reckoned at an ordinary rate (HEATG.fair), so the plan never tells where the fish are.
const PLAN_MEMO = 14 * 1440, PLAN_NEAR = 1.5;
function planMark(p, g){ let best = null, bd = PLAN_NEAR; for (const m of (S.marks || [])){ if ((m.g || null) !== (g || null) || S.t - m.t > PLAN_MEMO) continue; const d = dist(m, p); if (d < bd){ bd = d; best = m; } } return best; }
function planJigRate(p){ const m = planMark(p, null); return m && m.kgph > 0 ? m.kgph : HEATG.fair.jig * heatRigFactor(); }
function planGearKg(kind, p, soak){
  const m = planMark(p, kind), share = heatSoakShare(kind, soak);
  return m && m.kgu > 0 ? m.kgu * share / Math.max(0.05, heatSoakShare(kind, m.soak || 24)) : HEATG.fair[kind] * share;
}
// the units of a kind aboard (ready to set)
function planUnits(kind){
  const pg = S.pgear; if (!pg) return 0;
  if (kind === 'line') return (pg.lines.hyse.n || 0) + (pg.lines.bank.n || 0);
  if (kind === 'garn') return pg.nets.reduce((a, l) => a + l.n, 0);
  if (kind === 'teine') return pg.pots.big || 0;
  return 0;
}
// where the crew can sleep: a rorbu, the home naust, or aboard a boat with bunks
function planRestOk(pid){ const p = portById(pid); if (!p) return false; return isRorbu(pid) || pid === (S.home || HOME0) || (VESSELS[S.boat.type].berths || 0) > 0; }

// ---- the places: H home (the anchorage of a big boat, or the port), Q the home quay, M the plant, A where a long trip rests, F:id a field, J:id a jig place
function drP(o, k){
  if (k === 'H') return o.homeA || (portById(o.home) || {}).p || null;
  if (k === 'Q') return (portById(o.home) || {}).p || null;
  if (k === 'M') return (portById(o.M) || {}).p || null;
  if (k === 'A') return o.restA || null;
  const f = (k[0] === 'F' ? o.fields : o.jigs).find(q => q.id === k.slice(2)); return f ? {x:f.x, y:f.y} : null;
}
const drPort = (o, k) => k === 'H' ? (o.homeA ? null : o.home) : k === 'Q' ? o.home : k === 'M' ? o.M : null;
// the fields in the order they are worked: the nearest first from home, then the nearest from there
function drOrder(o){
  const h = drP(o, 'H'), left = o.fields.slice(), out = []; let at = h;
  while (left.length){ let bi = 0; if (at) for (let i = 1; i < left.length; i++) if (dist(left[i], at) < dist(left[bi], at)) bi = i; at = left[bi]; out.push(left.splice(bi, 1)[0]); }
  return out;
}
// the middle of the grounds
function drMid(o){ const P = o.fields.concat(o.jigs); if (!P.length) return null; return {x:P.reduce((a, q) => a + q.x, 0) / P.length, y:P.reduce((a, q) => a + q.y, 0) / P.length}; }

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

// ---- making the plan: the plant, the anchorages and the legs. Async; cb(err) when done. The plan can be switched on once it is made.
const driftKey = o => JSON.stringify([o.home, !!o.anchor, o.rig, o.fields.map(f => [f.x, f.y].map(v => +v.toFixed(3))), o.jigs.map(j => [j.x, j.y].map(v => +v.toFixed(3))), o.rhythm, S.boat.type]);
const driftMade = o => !!(o && o.made && o.made.key === driftKey(o));
async function driftMake(o, cb){
  // (the key and the boat are read now, while this vessel is bound: after the first await another may be)
  const vid = S.cur, key = driftKey(o); o.building = true; o.err = null;
  try {
    const C = driftCheck(o); if (!C.ok) throw C.errors[0];
    const mid = drMid(o), home = portById(o.home), big = drBig();
    try { await mapNeed(mid, 14); await mapNeed(home.p, 6); for (const q of o.fields.concat(o.jigs)) await mapNeed(q, 2); } catch (e){}
    // the plant: of the three nearest the grounds, the one the boat reaches soonest from them
    const near = PORTS.filter(q => q.mottak).map(q => ({q, d:dist(q.p, mid)})).sort((x, y) => x.d - y.d).slice(0, 3).map(x => x.q);
    if (!near.length) throw gL('Fant ikke noe fiskemottak.', 'Found no fish plant.');
    const first = o.fields.concat(o.jigs).slice().sort((x, y) => dist(x, mid) - dist(y, mid))[0];
    let M = null, mh = 1e9;
    for (const q of near){ const key = drLK(first, null, q.p, q.id); if (!o.legs[key] || o.legs[key].none){ let r = null; try { r = await leiaRoute(first, q.p, null, q.id); } catch (e){} drLegPut(o, key, r, first, q.p); }
      const L = o.legs[key]; if (L && !L.none && L.d < mh){ mh = L.d; M = q; } }
    if (!M) throw gL('Fant ingen vei fra plassene til et fiskemottak.', 'Found no way from the places to a fish plant.');
    o.M = M.id;
    // a big boat lies at anchor near home, and rests at anchor near the grounds on a long trip
    o.homeA = null; o.restA = null;
    if (o.anchor && big){ const a = driftAnchorage(o.home); if (!a) throw gL('Fant ingen ankerplass nær ' + home.name + '.', 'Found no anchorage near ' + home.name + '.'); o.homeA = {x:a.x, y:a.y}; }
    if (o.rhythm === 'multi' && big){ const np = nearestPort(mid); try { await mapNeed(np.p, 14); } catch (e){} const a = driftAnchorage(np.id); if (a) o.restA = {x:a.x, y:a.y}; }
    // the legs: from home and the plant to each place and back, between the places where the water is not clean, and home from the plant
    const ks = o.fields.map(f => 'F:' + f.id).concat(o.jigs.map(j => 'J:' + j.id)), ends = ['H', 'M'].concat(o.homeA ? ['Q'] : [], o.restA ? ['A'] : []), pairs = [];
    const add = (x, y) => { const a = drP(o, x), b = drP(o, y), ap = drPort(o, x), bp = drPort(o, y); if (!a || !b) return; const L = drLeg(o, a, ap, b, bp), key = drLK(a, ap, b, bp);
      if (!L) pairs.push({a, ap, b, bp}); else if (!o.legs[key] && L.d > 0) o.legs[key] = {w:[], d:Math.round(L.d * 1000) / 1000, t:S.t}; };
    for (const k of ks){ for (const e of ends){ add(e, k); add(k, e); } for (const j of ks) if (j !== k) add(k, j); }
    add('M', 'H'); add('H', 'M'); if (o.homeA){ add('M', 'Q'); add('Q', 'M'); add('Q', 'H'); add('H', 'Q'); }
    drLegsStale(o); await drFetch(o, pairs, vid);
    // a fetch for this vessel may have been under way already: the rest now
    const left = pairs.filter(q => !o.legs[drLK(q.a, q.ap, q.b, q.bp)]); if (left.length) await drFetch(o, left, vid);
    const bad = pairs.find(q => { const L = o.legs[drLK(q.a, q.ap, q.b, q.bp)]; return !L || L.none; });
    if (bad){ const nm = q => q.ap ? (portById(q.ap) || {}).name : q.bp ? (portById(q.bp) || {}).name : null; throw gL('Fant ingen vei' + (nm(bad) ? ' til eller fra ' + nm(bad) : ' mellom to av plassene') + '. Flytt plassen litt.', 'Found no way' + (nm(bad) ? ' to or from ' + nm(bad) : ' between two of the places') + '. Move the place a little.'); }
    o.made = {key, t:S.t}; o.err = null; o.building = false; if (cb) cb(null);
  } catch (e){ o.err = typeof e === 'string' ? e : String(e && e.message || e); o.made = null; o.building = false; console.warn('driftMake', vid, o.err); if (cb) cb(o.err); }
}

// ---- the check: errors keep the plan from being switched on, warnings only inform
function driftCheck(o){
  const E = [], W = [], V = VESSELS[S.boat.type], kind = drKind(o), no = gL;
  const hp = portById(o.home);
  if (!hp) E.push(no('Velg hvor båten skal ligge hjemme.', 'Choose where the boat lies at home.'));
  if (!RIGS[o.rig]) E.push(no('Velg hva båten skal fiske med.', 'Choose what the boat fishes with.'));
  else if (!rigHas(o.rig)) E.push(no('Båten mangler haleren til ' + rigName(o.rig).toLowerCase() + '. Monter den under Oppgrader på verftet.', 'The boat has no hauler for ' + rigName(o.rig).toLowerCase() + '. Fit one under Upgrade at the yard.'));
  if (kind && !o.fields.length) E.push(no('Legg ut minst ett felt for ' + rigName(o.rig).toLowerCase() + '.', 'Put out at least one field for the ' + rigName(o.rig).toLowerCase() + '.'));
  if (drJig(o) && !kind && !o.jigs.length) E.push(no('Velg minst én juksplass.', 'Choose at least one jig place.'));
  if (o.fields.length > DRP.fieldsMax) E.push(no('Høyst ' + DRP.fieldsMax + ' felt.', 'At most ' + DRP.fieldsMax + ' fields.'));
  if (o.jigs.length > DRP.jigsMax) E.push(no('Høyst ' + DRP.jigsMax + ' juksplasser.', 'At most ' + DRP.jigsMax + ' jig places.'));
  // the gear: as many units as the fields want, and soaks the gear can stand
  if (kind){
    const own = ownedUnits(kind), want = o.fields.reduce((a, f) => a + f.n, 0), sk = DRP.soak[kind];
    if (want > own) W.push(no('Feltene vil ha ' + want + ' ' + unitName(kind, want) + ', men båten eier ' + own + '. De første feltene får det som finnes.', 'The fields want ' + want + ' ' + unitName(kind, want) + ', but the boat owns ' + own + '. The first fields get what there is.'));
    for (const f of o.fields){ if (f.soak < sk[0]) W.push(no('Ståtiden ' + f.soak + ' t er kort for ' + GEAR[kind].no.toLowerCase() + '. Redskapet rekker å fange lite.', 'A soak of ' + f.soak + ' h is short for ' + GEAR[kind].en.toLowerCase() + '. The gear catches little.'));
      else if (f.soak > sk[3]) W.push(no('Ståtiden ' + f.soak + ' t er lang for ' + GEAR[kind].no.toLowerCase() + '. Fangsten forringes og redskapet kan gå tapt.', 'A soak of ' + f.soak + ' h is long for ' + GEAR[kind].en.toLowerCase() + '. The catch spoils and the gear can be lost.')); }
    if (kind === 'garn' && (V.crewMax || 0) < 1) E.push(no('Garn krever to om bord, og båten har ikke plass til flere.', 'Nets need two aboard, and the boat has no room for more.'));
  }
  // the places: closed to the boat or the gear (03e-rules.js)
  { const r = drRulesWhy(o, S.t / 60, true); if (r) E.push(gL(r.no, r.en)); }
  // no access to cod, haddock and saithe without you aboard (the open group: the owner aboard, J-30-2026 § 35; a second vessel: none):
  // what goes over 10 % bycatch is confiscated. With halibut gear, and halibut open, the plan fishes halibut instead (drGo)
  if (!S.lic && o.rig !== 'teiner' && (S.cur !== openVesselId() || !meAboard()) && !(S.boat.kgear && !kveiteClosed(S.t / 60)))
    W.push(S.cur !== openVesselId() ? no('Båten har ikke adgang til å fiske torsk, hyse og sei. De kan bare være bifangst, høyst 10 % av landingen, og resten blir inndratt. Med kveiteutstyr fisker planen kveite.', 'The boat has no access to fish cod, haddock and saithe. They can only be bycatch, at most 10% of the landing, and the rest is confiscated. With halibut gear the plan fishes halibut.')
      : no('I åpen gruppe må du være om bord for å fiske torsk, hyse og sei. Uten deg kan de bare være bifangst, høyst 10 % av landingen, og resten blir inndratt. Kjøp kveiteutstyr i butikken, så fisker planen kveite når du ikke er med.', 'In the open group you must be aboard to fish cod, haddock and saithe. Without you they can only be bycatch, at most 10% of the landing, and the rest is confiscated. Buy halibut gear at the shop, and the plan fishes halibut when you are not along.'));
  // the crew: you are the skipper aboard; without you the skipper and the mate must both be aboard
  const why = driftCrewWhy(o, true); if (why) (why.wait ? W : E).push(gL(why.no, why.en));
  // the rhythm
  if (o.rhythm === 'watch'){
    if (S.crew.length < driftNeedHands) E.push(no('Døgnet rundt 2+2 krever fire i mannskapet: skipper, styrmann og to på dekk. Båten har ' + S.crew.length + '.', 'Round the clock 2+2 needs four crew: a skipper, a mate and two on deck. The boat has ' + S.crew.length + '.'));
    if (!V.watch) E.push(no('Døgnet rundt 2+2 krever styrhus og køyer om bord.', 'Round the clock 2+2 needs a wheelhouse and bunks aboard.'));
    else if ((V.berths || 0) < Math.ceil(S.crew.length / 2)) E.push(no('Vakta som har fri, trenger køyer (' + Math.ceil(S.crew.length / 2) + '). Båten har ' + (V.berths || 0) + '.', 'The watch off needs bunks (' + Math.ceil(S.crew.length / 2) + '). The boat has ' + (V.berths || 0) + '.'));
  }
  if (o.rhythm === 'multi' && !(V.berths > 0)) E.push(no('Turer over flere døgn krever køyer om bord.', 'Trips of several days need bunks aboard.'));
  // home: where the crew can sleep (Jonas 23.10.2026: rest aboard only with bunks)
  if (hp && o.rhythm !== 'watch' && S.crew.length && !planRestOk(o.home)) W.push(no('Båten har ingen køyer, og ' + hp.name + ' er en vanlig kai. Mannskapet hviler dårlig der. En rorbu eller naustet er bedre.', 'The boat has no bunks, and ' + hp.name + ' is an ordinary quay. The crew rest poorly there. A rorbu or the naust is better.'));
  if (o.anchor && !drBig()) E.push(no('Bare båter fra ' + DRP.bigLen + ' m kan ligge til ankers hjemme.', 'Only boats from ' + DRP.bigLen + ' m can lie at anchor at home.'));
  // the weather against what the boat can take
  const w = DRW[o.wx] || DRW.normal; if (w.hs > BOAT.risk[1] * 0.95) W.push(no('Båten tåler ikke mer enn ' + fmt(BOAT.risk[1] * 0.95, 1) + ' m sjø, så den grensen gjelder.', 'The boat takes no more than ' + fmt(BOAT.risk[1] * 0.95, 1) + ' m of sea, so that limit holds.'));
  return {ok:!E.length, errors:E, warnings:W};
}
// who sails her: null when the plan can go; {wait} when it waits (a boat for one hand, you ashore), else what is missing
const driftNeedHands = 4;
function driftCrewWhy(o, quiet){
  if (meAboard()) return null;
  const V = VESSELS[S.boat.type];
  if ((V.crewMax || 0) < 2) return {wait:true, k:'one', no:'Båten har plass til bare én i mannskapet, så planen går bare når du er om bord. Mens du er i land, venter den.', en:'The boat has room for only one crew, so the plan runs only when you are aboard. While you are ashore, it waits.'};
  const sk = crewSkipper(), mt = crewMate();
  if (!sk || !mt || sk === mt) return {k:'roles', fix:'mannskap', no:'Når du ikke er om bord, må både en skipper og en styrmann være utnevnt. Gjør det på Mannskap-siden.', en:'When you are not aboard, both a skipper and a mate must be appointed. Do it on the Crew page.'};
  if (quiet) return null;
  const on = crewAboard(); if (!on.includes(sk) || !on.includes(mt)) return {wait:true, k:'off', no:(on.includes(sk) ? mt : sk).name.split(' ')[0] + ' har fri, så båten venter.', en:(on.includes(sk) ? mt : sk).name.split(' ')[0] + ' has time off, so the boat waits.'};
  return null;
}

// ---- the crew: rested, and had enough
function drFat(){ const C = crewAboard(); return C.length ? Math.max(...C.map(c => c.fatigue || 0)) : null; }
function drRested(){ if (skipOn()) return true; const f = drFat(); return f == null || f <= DRP.rested; }
function drTired(){ if (skipOn()) return false; const f = drFat(); return f != null && f >= DRP.tired; }
// round the clock («døgndrift 2 og 2») needs four hands: a skipper, a mate and two on deck; the skipper and one deckhand stand one watch, the
// mate and the other the other, 6 hours each. The watch off is asleep in the bunks (not on deck, not in the lists; c.sleepW) and rests.
// A long trip with four hands or more keeps the same watches.
const DRWATCH = 6;
function driftRoles(o){
  const me = meAboard(), sk = me ? null : crewSkipper(), m0 = crewMate(), mate = m0 && m0 !== sk ? m0 : S.crew.find(c => c !== sk) || null, deck = S.crew.filter(c => c !== sk && c !== mate);
  const A = [sk, deck[0]].filter(Boolean).concat(deck.slice(2).filter((c, i) => i % 2 === 0)), Bw = [mate, deck[1]].filter(Boolean).concat(deck.slice(2).filter((c, i) => i % 2 === 1));
  return {sk, mate, deck, A, B:Bw};
}
const drWatchMode = o => !!o && (o.rhythm === 'watch' || o.rhythm === 'multi') && S.crew.length >= driftNeedHands;
const driftWatchActive = o => !!o && o.v === DRV && o.on && drWatchMode(o) && !!S.plan && !!S.plan.ops && S.boat.status !== 'port';
function driftWatch(H){
  const o = S.ops;
  if (!driftWatchActive(o)){ for (const c of S.crew) if (c.sleepW) delete c.sleepW; return; }
  const R = driftRoles(o), aOn = Math.floor(driftHod(H) / DRWATCH) % 2 === 0, off = aOn ? R.B : R.A;
  for (const c of S.crew){ if (off.includes(c)) c.sleepW = true; else delete c.sleepW; }
}

// ---- the weather the plan allows, while it runs (05-vessels.js turns back over it)
function driftWx(){ const o = S.ops; if (!o || o.v !== DRV || !S.plan || !S.plan.ops) return null; const w = DRW[o.wx] || DRW.normal; return {wind:w.wind, hs:Math.min(w.hs, BOAT.risk[1] * 0.95), shelter:true}; }
// the most wind and sea over the hours ahead at the places of the trip (hsAt: sheltered where the place is), the open sea where a map is not in
function driftWxAhead(o, H, dur, pts){
  const P = (pts || []).filter(Boolean), w0 = DRW[o.wx] || DRW.normal;
  const seaAt = Hk => { if (!P.length) return hsOpen(Hk); let m = 0; for (const p of P){ let v; try { v = hsAt(p, Hk); } catch (e){ v = hsOpen(Hk); } m = Math.max(m, v); } return m; };
  const windOn = Hk => { if (!P.length) return windAt(Hk); let m = 0; for (const p of P) m = Math.max(m, windAt(Hk, p)); return m; };
  let w = 0, h = 0; for (let k = 0; k <= Math.ceil(dur); k++){ w = Math.max(w, windOn(H + k)); h = Math.max(h, seaAt(H + k)); }
  const lim = Math.min(w0.hs, BOAT.risk[1] * 0.95);
  return {w, h, lim, wind:w0.wind, boatLim:BOAT.risk[1] * 0.95 < w0.hs, ok:w <= w0.wind && h <= lim};
}

// ---- the trip: from where the boat is, the gear that is due, the jig places in turn, and the landing at the plant.
// budget: the hours the trip may take. Returns {wps, h, fishH, pts, noJig} or {need:[legs]} when a leg is not found yet, or null when there is
// nothing to fish. dry: a sketch for the page (a missing leg is reckoned straight), nothing is changed.
function drSetOf(o, f){ const kind = drKind(o); return mySets().find(s => s.fid === f.id) || mySets().find(s => s.kind === kind && !s.fid && segDist(f, s.a, s.b) < 0.5) || null; }
function drTrip(o, H, budget, dry){
  const b = S.boat, kind = drKind(o), here = drHere(o), M = drP(o, 'M');
  if (!M) return null;
  const stops = [], late = [], v = Math.max(1, BOAT.vcruise || 7), roughH = (a, c) => dist(a, c) * 1.25 / (v * NM);
  // the gear: what stands and is due is hauled (and set again), what is not in the sea is set; a soak that fits in the trip is set first and hauled last
  if (kind){
    const baited = () => S.pgear ? (S.pgear.lines.hyse.baited || 0) + (S.pgear.lines.bank.baited || 0) : 0;
    // a late visit leaves nets and pots set again when the next trip comes soon (round the clock, a long trip) or the soak is longer than the
    // trip; on a day trip a soak that fits in the trip is taken home. The line is never set again where it came up: it goes to be baited.
    let t = H, at = here.p;
    for (const f of drOrder(o)){
      const s = drSetOf(o, f), slack = Math.max(2, 0.15 * f.soak), arr = t + roughH(at, f), same = f.soak + 1 <= budget * 0.85;
      const lateV = kind === 'line' ? {f, only:'haul'} : {f, only:'haul', reset:o.rhythm !== 'day' || !same};
      if (s){
        const age = arr - s.tSet / 60;
        if (age >= f.soak - slack){
          if (kind === 'line'){ stops.push({f, only:'haul'}); if (baited() > 0){ stops.push({f, only:'set'}); if (same) late.push(lateV); } }
          else { stops.push({f, only:'haul', reset:true}); if (same) late.push(lateV); }
        } else if (age + budget * 0.8 >= f.soak - slack) late.push(lateV);
      } else { stops.push({f, only:'set'}); if (same) late.push(lateV); }
      t = arr + f.n * (DRP.setH[kind] + DRP.haulH[kind]); at = f;
    }
  }
  // the fixed hours: the gear work and the way; what is left goes to the jig
  const gearH = st => kind ? st.f.n * (st.only === 'set' ? DRP.setH[kind] : DRP.haulH[kind] + (st.reset ? DRP.setH[kind] : 0)) : 0;
  const J = drJig(o) ? (o.jigs.length ? o.jigs : stops.length ? [stops[stops.length - 1].f] : []) : [];
  let seq = stops.map(s => ({p:s.f, s})).concat(J.map((j, i) => ({p:j, j:i}))).concat(late.map(s => ({p:s.f, s})));
  if (!seq.length) return null;
  // (the legs as the boat will sail them where they are known, else straight with a fifth on; a day trip keeps the way home in the day)
  const legH = (a, ap, c, cp) => { const L = drLeg(o, a, ap, c, cp); return L ? L.h : roughH(a, c); };
  let fixed = 0, at = here.p, atP = here.port; for (const q of seq){ fixed += legH(at, atP, q.p, null); if (q.s) fixed += gearH(q.s); at = q.p; atP = null; } fixed += legH(at, null, M, o.M) + DRP.landH;
  if (o.rhythm === 'day') fixed += legH(M, o.M, drP(o, 'H'), drPort(o, 'H'));
  let fishH = Math.max(0, budget - fixed);
  // the soak that fits in the trip with no jigging: the boat waits by the gear
  const noJig = !!kind && !drJig(o);
  if (!J.length && !late.length && !stops.length) return null;
  if (J.length && fishH < 0.5 && !stops.length && !late.length) return null;
  // the hours for each jig place, weighed by what the player got there (his own marks; an ordinary rate where he has not fished)
  // (gear set on this trip is hauled when its soak is up: the jig gets the hours till then, and what is left of the day by the gear after the haul)
  const minLate = late.length ? Math.min(...late.map(s => s.f.soak)) : Infinity; let before = fishH, after = 0;
  if (late.length && J.length && fishH > minLate){ before = Math.max(0.5, minLate - 0.5); after = Math.round((fishH - before) * 10) / 10; if (after >= 0.5) seq.push({p:late[late.length - 1].f, j:-1}); else after = 0; }
  const R = J.map(j => Math.max(1, planJigRate(j))), Rs = R.reduce((a, r) => a + r, 0), jh = J.map((j, i) => Math.max(0.25, Math.round(before * (0.5 / J.length + 0.5 * R[i] / Rs) * 10) / 10));
  const wait = noJig && late.length ? Math.round(Math.min(Math.max(...late.map(s => s.f.soak)), Math.max(0.5, fishH)) * 10) / 10 : 0;
  // the waypoints
  const wps = [], need = [], pts = [here.p];
  let prev = here.p, prevPort = here.port;
  const leg = (p, port) => { const L = drLeg(o, prev, prevPort, p, port); if (!L){ if (dry){ prev = p; prevPort = port; return roughH(prev, p); } need.push({a:prev, ap:prevPort, b:p, bp:port}); prev = p; prevPort = port; return 0; }
    for (const q of L.w) wps.push({x:q[0], y:q[1], port:null, fish:0, leia:true}); prev = p; prevPort = port; return L.h; };
  let h = 0;
  seq.forEach((q, i) => {
    h += leg(q.p, null); pts.push(q.p);
    if (q.s){ const s = q.s, w = {x:q.p.x, y:q.p.y, port:null, fish:0, act:{op:'cycle', kind, n:s.f.n, fid:s.f.id, final:!s.reset, only:s.only}};
      // the soak that fits with nothing else to do: wait by it after setting
      if (noJig && s.only === 'set' && late.some(x => x.f === s.f) && !seq.slice(i + 1).some(x => x.s && x.s.only === 'set')) w.fish = wait;
      wps.push(w); h += gearH(s) + w.fish; }
    else if (q.j < 0){ wps.push({x:q.p.x, y:q.p.y, port:null, fish:after}); h += after; }
    else { const w = {x:q.p.x, y:q.p.y, port:null, fish:jh[q.j]}; if (J.length > 1){ w.jc = q.j + 1; w.jn = J.length; } wps.push(w); h += jh[q.j]; }
  });
  h += leg(M, o.M); wps.push({x:M.x, y:M.y, port:o.M, fish:0}); pts.push(M);
  if (need.length) return {need};
  return {wps, h:h + DRP.landH, fishH, pts, noJig, n:{set:stops.length, late:late.length, jig:J.length}};
}
// where the boat is, as a place of the plan
function drHere(o){
  const b = S.boat;
  if (b.status === 'port' || b.status === 'unmooring'){ const pt = portById(b.port); return {p:{x:pt.p.x, y:pt.p.y}, port:b.port}; }
  if (o.homeA && dist(b.pos, o.homeA) < 0.4) return {p:o.homeA, port:null};
  if (o.restA && dist(b.pos, o.restA) < 0.4) return {p:o.restA, port:null};
  return {p:{x:b.pos.x, y:b.pos.y}, port:null};
}
// a way to one of the plan's places with nothing on it: home (H, or Q when the anchorage is too open), the plant (M), the rest anchorage (A)
function drGoWps(o, k){
  const here = drHere(o), p = drP(o, k), port = drPort(o, k); if (!p) return null;
  const L = drLeg(o, here.p, here.port, p, port); if (!L) return {need:[{a:here.p, ap:here.port, b:p, bp:port}]};
  const wps = L.w.map(q => ({x:q[0], y:q[1], port:null, fish:0, leia:true}));
  wps.push(port ? {x:p.x, y:p.y, port, fish:0} : {x:p.x, y:p.y, port:null, fish:0, anchor:true});
  return {wps, h:L.h, pts:[here.p, p]};
}

// ---- the engine: each minute, on each vessel (05-vessels.js vesselStep)
const drSay = (o, no, en) => { const sk = meAboard() ? null : crewSkipper(); msg(sk ? sk.name : gL('Driftsplan', 'Operations plan'), no, en); };
// what the plan waits for, for the page's «Nå» line; said once when it begins
function drWait(o, k, no, en, hold){
  const W = o.wait; if (!W || W.k !== k){ o.wait = {k, t:S.t, no, en}; if (k !== 'rest' && k !== 'dep' && k !== 'route' && k !== 'make') drSay(o, no, en); }
  else { W.no = no; W.en = en; }
  if (hold) o.hold = S.t / 60 + hold;
}
// the plan stops: switched off with the reason and what fixes it (the page shows it; a push says it, ui/10g-push.js)
function drStop(o, k, no, en, fix){
  o.on = false; o.stop = {t:S.t, k, no, en, fix:fix || null}; o.wait = null; o.day = null;
  msg(gL('Driftsplan', 'Operations plan'), 'Driftsplanen for «' + S.boatName + '» har stoppet: ' + no, 'The plan for «' + S.boatName + '» has stopped: ' + en);
  if (hooks.onOpsStop) hooks.onOpsStop(S.cur, k, no, en);
}
function driftFail(o, no, en){
  o.fails++; o.hold = S.t / 60 + 1; drSay(o, no, en);
  if (o.fails >= DRP.failMax) drStop(o, 'fail', no, en);
}
// you took the boat over: your own route, Autonav, «Stopp» or the wheel by hand. The plan waits until you give her back («Fortsett planen»)
const drTook = () => !!(S.plan && !S.plan.ops) || (typeof helmOn === 'function' && helmOn());
function driftResume(o){ o.held = null; o.hold = 0; o.wait = null; o.fails = 0; }
function opsStep(H){
  const o = driftOps(), b = S.boat; if (!o || !o.on) return;
  if (!o.held && drTook()){ o.held = {t:S.t}; o.wait = null; log('Du har tatt over båten. Driftsplanen venter til du gir den tilbake.', 'You have taken the boat over. The plan waits until you give her back.'); }
  if (o.held) return;
  if (S.plan && S.plan.ops){ drSea(o, H); return; }
  if (!['port', 'idle'].includes(b.status) || S.shelter || S.plan || b.land || b.shift || (b.status === 'port' && portBusy(b))) return;
  if (b.status === 'port' && b.landWait && b.port === b.landWait) return;
  if (o.hold && H < o.hold) return;
  // the answers changed (or the boat): the plan is made again first; what cannot be made stops it
  if (!driftMade(o)){ if (o.building) return; const C = driftCheck(o); if (!C.ok){ drStop(o, 'check', C.errors[0], C.errors[0]); return; }
    drWait(o, 'make', 'Lager planen på nytt …', 'Making the plan again …'); driftMake(o, err => { if (err && o.on) drStop(o, 'make', err, err); }); return; }
  driftDecide(o, H);
}
// out on a trip: the crew stop jigging when they have had enough, or the day or the trip is over; the gear still to be hauled is hauled
function drSea(o, H){
  const b = S.boat, pl = S.plan; if (pl.opsK !== 'fish') return;
  const d = o.day, over = !drWatchMode(o) && drTired() ? 'tired' : d && o.rhythm === 'day' && H - d.t0 / 60 >= DRP.dayMax ? 'day' : d && o.rhythm === 'multi' && H >= d.t0 / 60 + o.days * 24 ? 'trip' : null;
  if (!over || pl.cut) return;
  pl.cut = over; if (d && over === 'tired') d.tired = true;
  for (let i = pl.idx; i < pl.wps.length; i++){ const w = pl.wps[i]; if (!w.act && w.fish > 0) w.fish = 0; }
  if (b.status === 'fishing' && !b.gop && b.fishUntil != null) b.fishUntil = S.t;
  log(over === 'tired' ? 'Mannskapet er slitne. Avslutter juksinga, trekker det som skal trekkes og går inn.' : 'Dagen er over. Avslutter juksinga og går inn.', over === 'tired' ? 'The crew are tired. Stopping the jigging, hauling what is to be hauled and going in.' : 'The day is over. Stopping the jigging and going in.');
}
// the boat is free: what next
function driftDecide(o, H){
  const b = S.boat, kg = holdTotal(), here = drHere(o), atM = here.port === o.M;
  // a big boat's anchorage at home holds over the night ahead
  const anchOk = () => { const sp = anchorSpot(o.homeA); return sp.ok && anchorForecast(o.homeA, H, 12, sp) <= ANCH.hold; };
  // who sails her
  const cw = driftCrewWhy(o); if (cw){ if (cw.wait){ drWait(o, cw.k, cw.no, cw.en); return; } drStop(o, cw.k, cw.no, cw.en, cw.fix); return; }
  if (S.jobs && S.jobs.length){ drWait(o, 'jobs', jobsCrewOnly() ? 'Mannskapet er ikke ferdig med utstyret, så båten venter.' : 'Verkstedet jobber på båten, så den venter.', jobsCrewOnly() ? 'The crew are not done with the gear, so the boat waits.' : 'The yard is working on the boat, so she waits.', 1); return; }
  // the catch aboard is landed first
  if (kg >= 0.5 && atM && b.status === 'port'){ if (startLanding(true)) return; }
  const dayStart = H - driftHod(H);
  if (o.rhythm === 'watch'){ if (!o.day) o.day = {t0:S.t, n:0}; drGo(o, H, DRP.tripMax); return; }
  if (o.day && o.rhythm === 'multi' && !o.day.done && H < o.day.t0 / 60 + o.days * 24 - DRP.minTrip){
    // a long trip: the crew rest aboard when they have had enough (with four hands the watches rest them)
    if (!drWatchMode(o) && (drTired() || o.day.resting && !drRested())){
      o.day.resting = true;
      // (at anchor near the grounds on a big boat; the plant's quay when the ground there would not take the anchor)
      if (o.restA && !b.anch && b.status === 'idle' && dist(b.pos, o.restA) < 0.4) o.day.restM = true;
      const restK = o.restA && !o.day.restM ? 'A' : 'M', there = restK === 'A' ? !!b.anch && dist(b.pos, o.restA) < 0.4 : atM;
      if (there){ drWait(o, 'rest', 'Mannskapet hviler om bord.', 'The crew rest aboard.'); return; }
      if (kg >= 0.5 && !atM){ drGoTo(o, H, 'M', 'land'); return; }
      drGoTo(o, H, restK, 'rest'); return;
    }
    o.day.resting = false;
    drGo(o, H, Math.min(DRP.tripMax, o.day.t0 / 60 + o.days * 24 - H)); return;
  }
  if (o.day && o.rhythm === 'day' && !o.day.tired && !o.day.done && H - o.day.t0 / 60 < DRP.dayMax - DRP.minTrip && !drTired()){ drGo(o, H, DRP.dayMax - (H - o.day.t0 / 60)); return; }
  // the day or the trip is over: land what is aboard, go home, rest until rested, and begin again at the hour. Home is chosen when the day
  // ends (o.goHome): a big boat goes to her anchorage, or lies at the home quay when the night is too hard for it or the ground would not
  // take the anchor; where she then lies she stays until the next trip
  if (o.day){ o.last = o.day.t0; o.day = null; o.goHome = true; }
  if (kg >= 0.5 && !atM){ drGoTo(o, H, 'M', 'land'); return; }
  if (o.goHome){
    const nearA = !!(o.homeA && dist(b.pos, o.homeA) < 0.4), k = o.homeA && (!anchOk() || (nearA && !b.anch && b.status === 'idle')) ? 'Q' : 'H';
    const there = k === 'H' && o.homeA ? nearA && !!b.anch : here.port === o.home;
    if (there) o.goHome = false;
    else {
      const go = drGoWps(o, k), wx = go && go.wps ? driftWxAhead(o, H, Math.max(1, go.h), go.pts) : null;
      // the weather keeps her where she lies: the crew rest here instead, and the next day begins from here
      if (wx && !wx.ok){ o.goHome = false; drWait(o, 'rest', 'Mannskapet hviler der båten ligger. Været er for dårlig til å gå hjem.', 'The crew rest where the boat lies. The weather is too bad to go home.'); return; }
      drGoTo(o, H, k, 'home'); return;
    }
  }
  if (!drRested()){ drWait(o, 'rest', 'Mannskapet hviler til de er uthvilt.', 'The crew rest until they are rested.'); return; }
  // the hour the day begins: today's if it has not begun and is not long past, else tomorrow's
  let dep = dayStart + o.dep; if (o.last != null && o.last / 60 >= dep - 0.01) dep += 24; if (H > dep + DRP.late) dep += 24;
  if (H < dep){ drWait(o, 'dep', 'Neste tur går kl. ' + driftClock(o.dep) + (dep - dayStart >= 24 ? ' i morgen' : '') + '.', 'The next trip goes at ' + driftClock(o.dep) + (dep - dayStart >= 24 ? ' tomorrow' : '') + '.'); return; }
  o.day = {t0:S.t, n:0}; o.today = null;
  drGo(o, H, o.rhythm === 'multi' ? Math.min(DRP.tripMax, o.days * 24) : DRP.dayMax);
}
// a trip with nothing to fish: home, the plant or the rest anchorage
function drGoTo(o, H, k, kind){
  const go = drGoWps(o, k); if (!go) return;
  if (go.need){ drNeed(o, go.need); return; }
  const wx = driftWxAhead(o, H, Math.max(1, go.h), go.pts);
  if (!wx.ok){ drWxWait(o, wx); return; }
  drDepart(o, go.wps, kind);
}
function drWxWait(o, wx){
  const why = wx.w > wx.wind ? ['vinden blir ' + fmt(wx.w, 0) + ' m/s, og grensen er ' + wx.wind + ' m/s', 'the wind gets to ' + fmt(wx.w, 0) + ' m/s, and the limit is ' + wx.wind + ' m/s']
    : wx.boatLim ? ['sjøen blir ' + fmt(wx.h, 1) + ' m, og båten tåler ' + fmt(wx.lim, 1) + ' m', 'the sea gets to ' + fmt(wx.h, 1) + ' m, and the boat takes ' + fmt(wx.lim, 1) + ' m'] : ['sjøen blir ' + fmt(wx.h, 1) + ' m, og grensen er ' + fmt(wx.lim, 1) + ' m', 'the sea gets to ' + fmt(wx.h, 1) + ' m, and the limit is ' + fmt(wx.lim, 1) + ' m'];
  drWait(o, 'wx', 'Venter på været: ' + why[0] + '.', 'Waiting for the weather: ' + why[1] + '.', 1);
}
// a leg not found yet is looked for in the background; one looked for in vain within the hour is a failed try
function drNeed(o, need){
  const fresh = need.filter(q => { const L = o.legs[drLK(q.a, q.ap, q.b, q.bp)]; return !(L && L.none && S.t - (L.t || 0) < 60); });
  if (!fresh.length){ driftFail(o, 'Fant ingen vei dit planen skal. Flytt plassen eller velg et annet hjem.', 'Found no way to where the plan goes. Move the place or choose another home.'); return; }
  drWait(o, 'route', 'Finner veien …', 'Finding the way …'); drFetch(o, fresh);
}
// a fishing trip from where she is
function drGo(o, H, budget){
  const b = S.boat, kind = drKind(o);
  // the rules and the quota stop the plan
  const st = drRulesWhy(o, H); if (st){ drStop(o, st.k, st.no, st.en, st.fix); return; }
  // the rig the plan fishes with, and what it needs
  if (rigOf() !== o.rig){ const why = rigSet(o.rig); if (why){ drStop(o, 'rig', 'kan ikke rigge om til ' + rigName(o.rig).toLowerCase() + ': ' + why[0], 'cannot re-rig for ' + rigName(o.rig).toLowerCase() + ': ' + why[0], 'rig'); return; } }
  const T = drTrip(o, H, budget);
  if (!T){ if (o.day) o.day.done = true; if (o.rhythm === 'watch'){ drWait(o, 'idle', 'Ikke noe redskap å trekke ennå. Venter.', 'No gear to haul yet. Waiting.', 1); return; } driftDecide(o, H); return; }
  if (T.need){ drNeed(o, T.need); return; }
  if (kind){ const miss = opsGearNeeds({wps:T.wps}); if (miss){ driftFail(o, 'Går ikke ut: ' + miss.join(', ') + '.', 'Not going out: ' + miss.join(', ') + '.'); return; } }
  const wx = driftWxAhead(o, H, Math.max(1, T.h), T.pts); if (!wx.ok){ drWxWait(o, wx); return; }
  autoRestock();
  if (!meAboard() && !S.lic && b.kgear && !kveiteClosed(H)) S.target = 'kveite';
  if (o.day) o.day.n++;
  drDepart(o, T.wps, 'fish', T.noJig);
}
function drDepart(o, wps, kind, noJig){
  S.plan = {wps, idx:0, speed:BOAT.vcruise, returning:false, depAt:null, ops:true, opsK:kind, unsafe:[], noJig:!!noJig};
  o.cur = {t0:S.t, k:kind}; o.wait = null; o.fails = 0; o.stop = null;
  if (kind === 'home') log('Går hjem til ' + (portById(o.home) || {name:'?'}).name + (o.homeA && wps[wps.length - 1].anchor ? ' og legger seg til ankers' : '') + '.', 'Going home to ' + (portById(o.home) || {name:'?'}).name + (o.homeA && wps[wps.length - 1].anchor ? ' to lie at anchor' : '') + '.');
  else if (kind === 'land') log('Går til ' + (portById(o.M) || {name:'mottaket'}).name + ' for å levere.', 'Going to ' + (portById(o.M) || {name:'the plant'}).name + ' to land.');
  else if (kind === 'rest') log('Går for å hvile om bord.', 'Going to rest aboard.');
  else log((meAboard() ? 'Gikk ut på driftsplanen med deg som skipper.' : crewSkipper().name + ' gikk ut på driftsplanen.'), (meAboard() ? 'Went out on the plan with you as skipper.' : crewSkipper().name + ' went out on the plan.'));
  depart();
}
// a closed place, or the cod quota used up: the plan stops (Jonas 23.10.2026)
function drRulesWhy(o, H, placesOnly){
  const kind = drKind(o), hand = !(S.equip && S.equip.jukse > 0);
  for (const [i, f] of o.fields.entries()){ const why = ruBlockMsg({p:f, len:BOAT.len, gear:o.rig === 'teiner' ? 'teiner' : kind, sp:kind === 'teine' ? 'krabbe' : null}); if (why) return {k:'closed', fix:'places', no:'Felt ' + (i + 1) + ' er stengt: ' + why, en:'Field ' + (i + 1) + ' is closed: ' + why}; }
  if (drJig(o)) for (const [i, j] of o.jigs.entries()){ const why = ruBlockMsg({p:j, len:BOAT.len, gear:'juksa', sp:null, hand}); if (why) return {k:'closed', fix:'places', no:'Juksplass ' + (i + 1) + ' er stengt: ' + why, en:'Jig place ' + (i + 1) + ' is closed: ' + why}; }
  if (!placesOnly && o.rig !== 'teiner' && access() !== 'none'){ const q = quotaState(); if (q.torsk >= codLimitNow(H) - 1) return {k:'quota', fix:'quota', no:'Torskekvoten er brukt opp.', en:'The cod quota is used up.'}; }
  return null;
}
// the boat has come in on the plan (05-vessels.js dock): a fishing trip or a trip to land unloads at the plant
function opsLanded(pid, k){
  const o = driftOps(); if (!o) return;
  if (k === 'home' || k === 'rest'){ o.cur = null; if (k === 'rest' || holdTotal() < 0.5) return; }
  const pt = portById(pid); if (pt && pt.mottak && holdTotal() >= 0.5 && !mottakOpen(S.t / 60)){ S.boat.landWait = pid; return; }
  S.boat.landWait = null;
  opsGearAfter();
  // the catch goes up with the crane; the report comes with the landing note
  if (startLanding(true)) return;
  if (k === 'fish') opsReport(pid, holdTotal(), 0, false);
}
// the bunker and ice at the plant: all of it (the plan has no stock choices since 23.10.2026)
function driftStock(){ return {ice:true, fuel:true, gear:true, bait:true}; }
function opsReport(pid, kg, total, landed){
  const o = driftOps(), sk = meAboard() ? null : crewSkipper(), port = portById(pid);
  autoRestock();
  const extra = S.tripOwner ? 0 : Math.round(Math.max(0, total) * 0.05); if (extra > 0){ S.cash -= extra; S.stats.costs += extra; }
  const what = landed ? [fmt(kg, 0) + ' kg levert i ' + port.name + ', ' + kr(Math.round(total)) + ' etter lott' + (extra ? ', skippertillegg ' + kr(extra) : '') + '.', fmt(kg, 0) + ' kg landed at ' + port.name + ', ' + kr(Math.round(total)) + ' after shares' + (extra ? ', skipper bonus ' + kr(extra) : '') + '.']
    : kg > 0.5 ? [fmt(kg, 0) + ' kg om bord. ' + port.name + ' har ikke fiskemottak.', fmt(kg, 0) + ' kg aboard. ' + port.name + ' has no fish plant.'] : ['ingen fangst å levere.', 'no catch to land.'];
  if (o){ const c = o.cur || {}; o.rep.push({t:S.t, port:pid, kg:Math.round(kg), kr:Math.round(total), h:c.t0 ? Math.round((S.t - c.t0) / 6) / 10 : null, landed:!!landed}); while (o.rep.length > DRP.repMax) o.rep.shift(); o.cur = null; }
  msg(sk ? sk.name : gL('Driftsplan', 'Operations plan'), 'Driftsrapport: ' + what[0], 'Operations report: ' + what[1]);
}

// ---- what the plan is doing, in a few words: the page's «Nå» and the company's fleet list ([no, en])
function driftNow(o){
  if (!o) return ['Ingen driftsplan', 'No operations plan'];
  if (!o.on) return o.stop ? ['Stoppet: ' + o.stop.no, 'Stopped: ' + o.stop.en] : ['Av', 'Off'];
  if (o.held) return ['Venter: du har tatt over båten', 'Waiting: you have taken the boat over'];
  const b = S.boat, pl = S.plan, M = (portById(o.M) || {name:'mottaket'}).name, Hm = (portById(o.home) || {name:'hjem'}).name;
  if (b.land) return ['Leverer i ' + (portById(b.land.pid) || {name:M}).name, 'Landing at ' + (portById(b.land.pid) || {name:M}).name];
  if (b.status === 'port' && (b.shift || b.fueling || portBusy(b))) return ['Gjør båten klar: is, drivstoff og agn', 'Getting the boat ready: ice, fuel and bait'];
  if (b.status === 'unmooring') return ['Kaster loss', 'Casting off'];
  if (pl && pl.ops){
    if (pl.opsK === 'home') return ['På vei hjem til ' + Hm, 'On the way home to ' + Hm];
    if (pl.opsK === 'land') return ['På vei til ' + M + ' for å levere', 'On the way to ' + M + ' to land'];
    if (pl.opsK === 'rest') return ['På vei for å hvile om bord', 'On the way to rest aboard'];
    if (b.gop) return [(b.gop.op === 'set' ? 'Setter ' : 'Trekker ') + GEAR[b.gop.kind].no.toLowerCase(), (b.gop.op === 'set' ? 'Setting ' : 'Hauling ') + GEAR[b.gop.kind].en.toLowerCase()];
    if (b.status === 'fishing'){ const w = pl.wps[pl.idx - 1], i = w && w.jc ? w.jc : null; return pl.noJig ? ['Venter ved redskapet', 'Waiting by the gear'] : ['Jukser' + (i ? ' på plass ' + i : ''), 'Jigging' + (i ? ' at place ' + i : '')]; }
    const left = pl.wps.slice(pl.idx).some(w => w.act || w.fish > 0); return left ? ['På vei ut', 'On the way out'] : ['På vei til ' + M + ' for å levere', 'On the way to ' + M + ' to land'];
  }
  if (o.wait) return [o.wait.no, o.wait.en];
  return ['Klar', 'Ready'];
}
// ---- the trip as a timeline for the page: the one under way from where she is now, or the next one from where it starts.
// [{t (hours), no, en, now, k}]; the times are reckoned at cruising speed with the jig's hours at most (a full hold lands sooner)
function driftSketch(o){
  const b = S.boat, H = S.t / 60, pl = S.plan && S.plan.ops ? S.plan : null, v = Math.max(1, BOAT.vcruise || 7), out = [], kind = drKind(o), nmP = id => (portById(id) || {name:'?'}).name;
  let wps, t, a;
  if (pl && o.cur){ const n = driftNow(o); wps = pl.wps.slice(pl.idx); t = H; a = {x:b.pos.x, y:b.pos.y}; out.push({t, no:n[0], en:n[1], now:true}); }
  else {
    if (!driftMade(o)) return null;
    let t0 = H; if (o.rhythm !== 'watch' && !o.day){ const ds = H - driftHod(H); t0 = ds + o.dep; if ((o.last != null && o.last / 60 >= t0 - 0.01) || t0 < H - DRP.late) t0 += 24; if (t0 < H) t0 = H; }
    const T = drTrip(o, t0, o.rhythm === 'day' ? DRP.dayMax : DRP.tripMax, true); if (!T || T.need) return null;
    const here = drHere(o); wps = T.wps; t = t0; a = here.p; out.push({t, no:'Går fra ' + (here.port ? nmP(here.port) : 'der båten ligger'), en:'Leaves ' + (here.port ? nmP(here.port) : 'where the boat lies')});
  }
  for (const w of wps){
    t += dist(a, w) / (v * NM); a = w;
    if (w.act){ const i = o.fields.findIndex(f => f.id === w.act.fid), fn = i >= 0 ? 'felt ' + (i + 1) : 'feltet', fe = i >= 0 ? 'field ' + (i + 1) : 'the field', n = w.act.n, set = w.act.only === 'set', reset = !set && !w.act.final;
      out.push(set ? {t, no:'Setter ' + n + ' ' + GEAR[kind].u[n === 1 ? 0 : 1] + ' på ' + fn, en:'Sets ' + n + ' ' + GEAR[kind].u[n === 1 ? 2 : 3] + ' at ' + fe, k:'st'} : {t, no:(reset ? 'Trekker og setter på nytt på ' : 'Trekker ') + fn, en:(reset ? 'Hauls and sets again at ' : 'Hauls ') + fe, k:'st'});
      t += n * (set ? DRP.setH[kind] : DRP.haulH[kind] + (reset ? DRP.setH[kind] : 0));
      if (w.fish > 0){ out.push({t, no:'Venter ved redskapet (' + fmt(w.fish, 1) + ' t)', en:'Waits by the gear (' + fmt(w.fish, 1) + ' h)'}); t += w.fish; } }
    else if (w.fish > 0){ const i = o.jigs.findIndex(j => dist(j, w) < 0.01); out.push({t, no:(i >= 0 ? 'Jukser på plass ' + (i + 1) : 'Jukser ved redskapet') + ' (høyst ' + fmt(w.fish, 1) + ' t)', en:(i >= 0 ? 'Jigs at place ' + (i + 1) : 'Jigs by the gear') + ' (at most ' + fmt(w.fish, 1) + ' h)'}); t += w.fish; }
    else if (w.port){ const home = pl && pl.opsK === 'home', rest = pl && pl.opsK === 'rest'; out.push(home ? {t, no:'Hjemme i ' + nmP(w.port), en:'Home in ' + nmP(w.port), k:'rest'} : rest ? {t, no:'Hviler om bord i ' + nmP(w.port), en:'Rests aboard in ' + nmP(w.port), k:'rest'} : {t, no:'Leverer i ' + nmP(w.port), en:'Lands at ' + nmP(w.port), k:'land'}); t += home || rest ? 0 : DRP.landH; }
    else if (w.anchor) out.push({t, no:'Ankrer og hviler', en:'Anchors and rests', k:'rest'});
  }
  // a day trip ends at home, where the crew rest until they are rested
  if (o.rhythm === 'day' && (!pl || !o.cur || pl.opsK === 'fish')){ const L = drLeg(o, drP(o, 'M'), o.M, drP(o, 'H'), drPort(o, 'H')); if (L){ t += L.h; out.push({t, no:'Hjem til ' + nmP(o.home) + ' og hvile', en:'Home to ' + nmP(o.home) + ' to rest', k:'rest'}); } }
  return out;
}
// ---- the plan to another vessel of the company: the answers, made again there
function driftCopy(vid){
  const o = driftOps(), v = vesselById(vid); if (!o || !v || v.id === S.cur) return false;
  const copy = {home:o.home, anchor:o.anchor, rig:o.rig, jig:o.jig, fields:o.fields.map(f => ({...f, id:driftSid()})), jigs:o.jigs.map(j => ({...j, id:driftSid()})), wx:o.wx, rhythm:o.rhythm, dep:o.dep, days:o.days};
  onVessel(v, () => { const n = driftNew(copy); n.on = false; S.ops = n; });
  return true;
}
