// ===== Driftsplan 2, part 2: the engine (26.10.2026, docs/planer/driftsplan-2/02-design.md chapter 2). It follows the day that planDay
// (06g-plan2.js) reckoned: one step at a time (o.run = {day, i, trip, wait}), and when a step cannot go, it WAITS with a reason and an
// hour to try again, never «three failures and stop». A trip is the steps from where she lies to the next port call, sailed on the legs
// kept when the plan was made (plan2Make: the plant, the anchorages, every leg between home, the plant, the places and each place's
// shelter port, found with leiaRoute and checked with the sailing's own groundCheck). Nothing here searches while the plan runs, so the
// day plays the same with the game closed (catchUp) as open. Runs only with DRIFT2 on; the gates are in 06d-drift.js.
const P2_PORTCALL = {lever:1, agn:1, hjem:1, hvile:1};
function plan2Key(o){ return JSON.stringify([o.home, !!o.anchor, o.rig, o.places.map(q => [q.k, +q.x.toFixed(3), +q.y.toFixed(3)]), o.rhythm, o.land ? [o.land.mode, o.land.port] : null, S.boat.type]); }
const plan2Made = o => !!(o && o.made && o.made.key === plan2Key(o));
// where she lies, as a place of the plan
function plan2Here(o){
  const b = S.boat;
  if (b.status === 'port' || b.status === 'unmooring'){ const pt = portById(b.port); return {p:{x:pt.p.x, y:pt.p.y}, port:b.port}; }
  if (o.homeA && dist(b.pos, o.homeA) < 0.4) return {p:o.homeA, port:null};
  if (o.restA && dist(b.pos, o.restA) < 0.4) return {p:o.restA, port:null};
  return {p:{x:b.pos.x, y:b.pos.y}, port:null};
}
// a kept leg, checked point by point with the check the boat sails by (groundCheck): true when she can sail it without a way round
// (as groundCheck, 01-world.js, but at the lowest water of the coming fortnight, so a leg that is safe when the plan is made is safe at low tide too)
let P2_TLMIN = {t:-1e9, v:0};
function plan2TideMin(){ if (S.t - P2_TLMIN.t < 1440) return P2_TLMIN.v; let v = Infinity; for (let k = 0; k < 15 * 24; k++) v = Math.min(v, tideCD(S.t / 60 + k)); P2_TLMIN = {t:S.t, v}; return v; }
function plan2LegOk(o, a, ap, b, bp){
  const L = o.legs[drLK(a, ap, b, bp)]; if (!L || L.none) return false;
  const pts = [a].concat((L.w || []).map(q => ({x:q[0], y:q[1]})), [b]), tl = plan2TideMin();
  for (let i = 1; i < pts.length; i++){ const p0 = pts[i - 1], p1 = pts[i], d = dist(p0, p1), n = Math.max(1, Math.ceil(d / 0.005));
    for (let j = 1; j <= n; j++){ const p = {x:p0.x + (p1.x - p0.x) * j / n, y:p0.y + (p1.y - p0.y) * j / n}; try { if (inHarbour(p)) continue; if (isLand(p) || ((j & 3) === 0 || j === n) && depthF(p) + tl < BOAT.draft) return false; } catch (e){ return false; } } }
  return true;
}
// ---- making the plan: the plant, the anchorages, the legs and the shelter ports. Async; cb(err) when done
async function plan2Make(o, cb){
  const vid = S.cur, key = plan2Key(o); o.building = true; o.err = null;
  try {
    const C = plan2Check(o); if (!C.ok) throw C.errors[0];
    const P = o.places, mid = {x:P.reduce((a, q) => a + q.x, 0) / P.length, y:P.reduce((a, q) => a + q.y, 0) / P.length}, home = portById(o.home), big = (BOAT.len || 0) >= DRP.bigLen;
    try { await mapNeed(mid, 14); await mapNeed(home.p, 6); for (const q of P) await mapNeed(q, 2); } catch (e){}
    // the plant: the chosen one, or of the three nearest the grounds the one reached soonest from the nearest place
    const first = P.slice().sort((x, y) => dist(x, mid) - dist(y, mid))[0];
    if (o.land && o.land.mode === 'port' && (portById(o.land.port) || {}).mottak) o.M = o.land.port;
    else {
      const near = PORTS.filter(q => q.mottak).map(q => ({q, d:dist(q.p, mid)})).sort((x, y) => x.d - y.d).slice(0, 3).map(x => x.q);
      if (!near.length) throw gL('Fant ikke noe fiskemottak.', 'Found no fish plant.');
      let M = null, mh = 1e9;
      for (const q of near){ const k = drLK(first, null, q.p, q.id); if (!o.legs[k] || o.legs[k].none){ let r = null; try { r = await leiaRoute(first, q.p, null, q.id); } catch (e){} drLegPut(o, k, r, first, q.p); }
        const L = o.legs[k]; if (L && !L.none && L.d < mh){ mh = L.d; M = q; } }
      if (!M) throw gL('Fant ingen vei fra plassene til et fiskemottak.', 'Found no way from the places to a fish plant.');
      o.M = M.id;
    }
    o.homeA = null; o.restA = null;
    if (o.anchor && big){ const a = driftAnchorage(o.home); if (!a) throw gL('Fant ingen ankerplass nær ' + home.name + '.', 'Found no anchorage near ' + home.name + '.'); o.homeA = {x:a.x, y:a.y}; }
    if (o.rhythm === 'multi' && big){ const np = nearestPort(mid); try { await mapNeed(np.p, 14); } catch (e){} const a = driftAnchorage(np.id); if (a) o.restA = {x:a.x, y:a.y}; }
    // the shelter port of each place: the nearest quays that are not rorbuer (the first with a way to it is kept in o.ly)
    o.ly = {}; const lyC = {};
    for (const q of P) lyC[q.id] = PORTS.filter(p => !p.rorbu).map(p => ({p, d:dist(p.p, q)})).sort((x, y) => x.d - y.d).slice(0, 2).map(x => x.p);
    // the legs: from home and the plant to each place and back, between the places, home from the plant, and each place to its shelter
    const ks = P.map(q => q.id), ends = ['H', 'M'].concat(o.homeA ? ['Q'] : [], o.restA ? ['A'] : []), pairs = [];
    const add = (x, y) => { const a = plan2P(o, x), b = plan2P(o, y), ap = plan2Port(o, x), bp = plan2Port(o, y); if (!a || !b) return; const L = drLeg(o, a, ap, b, bp), k = drLK(a, ap, b, bp);
      if (!L) pairs.push({a, ap, b, bp}); else if (!o.legs[k] && L.d > 0) o.legs[k] = {w:[], d:Math.round(L.d * 1000) / 1000, t:S.t}; };
    for (const k of ks){ for (const e of ends){ add(e, k); add(k, e); } for (const j of ks) if (j !== k) add(k, j); for (const p of lyC[k]){ const a = plan2P(o, k); const L = drLeg(o, a, null, p.p, p.id), kk = drLK(a, null, p.p, p.id); if (!L) pairs.push({a, ap:null, b:p.p, bp:p.id}); else if (!o.legs[kk]) o.legs[kk] = {w:[], d:Math.round(L.d * 1000) / 1000, t:S.t}; } }
    add('M', 'H'); add('H', 'M'); if (o.homeA){ add('M', 'Q'); add('Q', 'M'); add('Q', 'H'); add('H', 'Q'); }
    drLegsStale(o); await drFetch(o, pairs, vid);
    const left = pairs.filter(q => !o.legs[drLK(q.a, q.ap, q.b, q.bp)]); if (left.length) await drFetch(o, left, vid);
    for (const q of P){ const a = plan2P(o, q.id); o.ly[q.id] = (lyC[q.id].find(p => plan2LegOk(o, a, null, p.p, p.id)) || {id:null}).id; }
    // every leg the day can use must be there and sailable: a place without one is refused now, not out at sea
    const nmOf = k => k === 'H' || k === 'Q' ? home.name : k === 'M' ? (portById(o.M) || {}).name : k === 'A' ? gL('ankerplassen', 'the anchorage') : (() => { const i = P.findIndex(q => q.id === k), q = P[i]; return (q && q.k === 'juks' ? gL('juksplass ', 'jig place ') : gL('felt ', 'field ')) + (q ? P.filter(x => x.k === q.k).indexOf(q) + 1 : '?'); })();
    const bad = (x, y) => { const a = plan2P(o, x), b = plan2P(o, y); if (!a || !b) return null; const L = drLeg(o, a, plan2Port(o, x), b, plan2Port(o, y)); if (!L) return gL('Fant ingen vei mellom ' + nmOf(x) + ' og ' + nmOf(y) + '. Flytt plassen litt.', 'Found no way between ' + nmOf(x) + ' and ' + nmOf(y) + '. Move the place a little.'); if (!plan2LegOk(o, a, plan2Port(o, x), b, plan2Port(o, y))) return gL('Leia mellom ' + nmOf(x) + ' og ' + nmOf(y) + ' går over grunt vann. Flytt plassen litt.', 'The way between ' + nmOf(x) + ' and ' + nmOf(y) + ' crosses shallow water. Move the place a little.'); return null; };
    for (const k of ks){ for (const e of ends){ const w = bad(e, k) || bad(k, e); if (w) throw w; } for (const j of ks) if (j !== k){ const w = bad(k, j); if (w) throw w; } }
    { const w = bad('M', 'H') || bad('H', 'M'); if (w) throw w; }
    o.made = {key, t:S.t}; o.err = null; o.building = false; if (cb) cb(null);
  } catch (e){ o.err = typeof e === 'string' ? e : String(e && e.message || e); o.made = null; o.building = false; console.warn('plan2Make', vid, o.err); if (cb) cb(o.err); }
}
// ---- what the plan says, waits for and stops at
const plan2Say = (o, no, en) => { const sk = meAboard() ? null : crewSkipper(); msg(sk ? sk.name : gL('Driftsplan', 'Operations plan'), no, en); };
// a set or haul the boat could not do at the place (05-vessels.js, the waypoint's act refused: no buoy set, no bait, a hauler missing): said once, kept for the page, and the day goes on
function plan2ActWhy(w, why){ const o = plan2Ops(); if (!o || !o.run) return; const what = w.act && w.act.only === 'set' ? ['sette', 'set'] : ['trekke', 'haul']; if (o.run.fail && o.run.fail.no === why[0]) return; o.run.fail = {t:S.t, no:why[0], en:why[1] || why[0]}; plan2Say(o, 'Kunne ikke ' + what[0] + ' redskapet: ' + why[0], 'Could not ' + what[1] + ' the gear: ' + (why[1] || why[0])); }
// the trip she is on cut short where she is (the page's «Hent redskapet» at sea): the boat stops, and the engine lays the day again from here
function plan2Abort(o){ const b = S.boat; if (!S.plan || !S.plan.ops) return; if (b.gop) gopAbort('return'); if (b.status === 'fishing') endFishing('move'); S.plan = null; if (b.status !== 'port'){ b.status = 'idle'; b.v = 0; } if (o && o.run) o.run.trip = null; }
function plan2Wait(o, k, no, en, until){
  const r = o.run || (o.run = {day:null, i:0, trip:null, wait:null});
  if (!r.wait || r.wait.k !== k){ r.wait = {k, t:S.t, no, en, until}; if (!['dep', 'rest', 'make', 'route', 'jobs', 'open'].includes(k)) plan2Say(o, no, en); }
  else { r.wait.no = no; r.wait.en = en; r.wait.until = until; }
  o.hold = until == null ? 0 : until;
}
function plan2Stop(o, k, no, en, fix){
  o.on = false; o.stop = {t:S.t, k, no, en, fix:fix || null}; if (o.run) o.run.wait = null;
  msg(gL('Driftsplan', 'Operations plan'), 'Driftsplanen for «' + S.boatName + '» har stoppet: ' + no, 'The plan for «' + S.boatName + '» has stopped: ' + en);
  if (hooks.onOpsStop) hooks.onOpsStop(S.cur, k, no, en);
}
function plan2Resume(o){ o.held = null; o.hold = 0; if (o.run){ o.run.wait = null; o.run.trip = null; o.run.replan = true; } }
// who sails her: null when she can go; {wait} when she waits; else what is missing. The watch asleep in the bunks counts as aboard
function plan2CrewWhy(o){
  if (meAboard()) return null;
  const V = VESSELS[S.boat.type];
  if ((V.crewMax || 0) < 2) return {wait:true, k:'one', no:'Båten har plass til bare én i mannskapet, så planen går bare når du er om bord. Mens du er i land, venter den.', en:'The boat has room for only one crew, so the plan runs only when you are aboard. While you are ashore, it waits.'};
  const sk = crewSkipper(), mt = crewMate();
  if (!sk || !mt || sk === mt) return {k:'roles', fix:'mannskap', no:'Når du ikke er om bord, må både en skipper og en styrmann være utnevnt. Gjør det på Mannskap-siden.', en:'When you are not aboard, both a skipper and a mate must be appointed. Do it on the Crew page.'};
  const on = crewAboard(null, true); if (!on.includes(sk) || !on.includes(mt)) return {wait:true, k:'off', no:(on.includes(sk) ? mt : sk).name.split(' ')[0] + ' har fri, så båten venter.', en:(on.includes(sk) ? mt : sk).name.split(' ')[0] + ' has time off, so the boat waits.'};
  return null;
}
// the weather the trip allows (05-vessels.js turns back over it), and the most wind and sea over the hours ahead at the trip's places
function plan2Wx(){ const o = plan2Ops(); if (!o || !S.plan || !S.plan.ops) return null; return {wind:o.wx.wind, hs:Math.min(o.wx.hs, BOAT.risk[1] * 0.95), shelter:true}; }
function plan2WxAhead(o, H, dur, pts){
  const P = (pts || []).filter(Boolean);
  const seaAt = Hk => { if (!P.length) return hsOpen(Hk); let m = 0; for (const p of P){ let v; try { v = hsAt(p, Hk); } catch (e){ v = hsOpen(Hk); } m = Math.max(m, v); } return m; };
  const windOn = Hk => { if (!P.length) return windAt(Hk); let m = 0; for (const p of P) m = Math.max(m, windAt(Hk, p)); return m; };
  let w = 0, h = 0; for (let k = 0; k <= Math.ceil(dur); k++){ w = Math.max(w, windOn(H + k)); h = Math.max(h, seaAt(H + k)); }
  const lim = Math.min(o.wx.hs, BOAT.risk[1] * 0.95);
  return {w, h, lim, wind:o.wx.wind, boatLim:BOAT.risk[1] * 0.95 < o.wx.hs, ok:w <= o.wx.wind && h <= lim};
}
function plan2WxWait(o, wx, H){
  const why = wx.w > wx.wind ? ['vinden blir ' + fmt(wx.w, 0) + ' m/s, og grensen er ' + wx.wind + ' m/s', 'the wind gets to ' + fmt(wx.w, 0) + ' m/s, and the limit is ' + wx.wind + ' m/s']
    : wx.boatLim ? ['sjøen blir ' + fmt(wx.h, 1) + ' m, og båten tåler ' + fmt(wx.lim, 1) + ' m', 'the sea gets to ' + fmt(wx.h, 1) + ' m, and the boat takes ' + fmt(wx.lim, 1) + ' m'] : ['sjøen blir ' + fmt(wx.h, 1) + ' m, og grensen er ' + fmt(wx.lim, 1) + ' m', 'the sea gets to ' + fmt(wx.h, 1) + ' m, and the limit is ' + fmt(wx.lim, 1) + ' m'];
  const until = H + 1;
  plan2Wait(o, 'wx', 'Venter på været: ' + why[0] + '. Prøver igjen kl. ' + driftClock(driftHod(until)) + '.', 'Waiting for the weather: ' + why[1] + '. Trying again at ' + driftClock(driftHod(until)) + '.', until);
}
// the first hour within DRP2.late the forecast lets the trip go, or null when the day is lost (windAt and hsAt are deterministic, so this is a look-up, not a wait-and-see)
function plan2WxFirstOk(o, H, dur, pts){ for (let k = 1; k <= DRP2.late; k++) if (plan2WxAhead(o, H + k, Math.min(dur, DRP2.fcH), pts).ok) return H + k; return null; }
// ---- shelter without a search (part 3): back the way she came to the last place or port she passed, and from a place the kept leg to its
// shelter quay (o.ly). Called from startReturn (06-services.js) when the weather turns over the plan's limits. False when nothing is known
// (she is on a leg the plan did not lay): then today's shelterReturn looks for a quay
function plan2Shelter(W, hsOver){
  const o = plan2Ops(), b = S.boat, pl = S.plan; if (!o || !pl || !pl.p2 || pl.returning) return false;
  let pi = -1; for (let i = pl.idx - 1; i >= 0; i--){ const w = pl.wps[i]; if (w.act || w.fish > 0 || w.jc || w.port || w.anchor){ pi = i; break; } }
  const back = []; for (let i = pl.idx - 1; i > pi; i--) back.push(pl.wps[i]);
  const place = pi >= 0 ? pl.wps[pi] : null, st = pl.p2.start;
  const wps = back.map(w => ({x:w.x, y:w.y, port:null, fish:0, leia:true})); let to = null;
  if (place && place.port){ wps.push({x:place.x, y:place.y, port:place.port, fish:0}); to = place.port; }
  else if (place){
    const q = o.places.find(z => dist(z, place) < 0.05), lyId = q ? o.ly[q.id] : null, ly = lyId ? portById(lyId) : null; if (!ly) return false;
    const L = drLeg(o, {x:place.x, y:place.y}, null, ly.p, ly.id); if (!L) return false;
    if (dist(b.pos, place) > 0.03) wps.push({x:place.x, y:place.y, port:null, fish:0, leia:true});
    for (const z of L.w) wps.push({x:z[0], y:z[1], port:null, fish:0, leia:true}); wps.push({x:ly.p.x, y:ly.p.y, port:ly.id, fish:0}); to = ly.id;
  }
  else if (st && st.port){ wps.push({x:st.x, y:st.y, port:st.port, fish:0}); to = st.port; }
  else return false;
  if (b.gop) gopAbort('return');
  const why = hsOver ? ['Sjøen økte til ' + hsOver.toFixed(1).replace('.', ',') + ' m', 'The sea rose to ' + hsOver.toFixed(1) + ' m'] : ['Vinden økte til ' + W.toFixed(1).replace('.', ',') + ' m/s', 'Wind rose to ' + W.toFixed(1) + ' m/s'];
  S.plan = {wps, idx:0, speed:pl.speed, returning:true, ops:true, opsK:'ly', unsafe:wps.map(() => false), p2:{from:pl.p2.from, to:pl.p2.to, ly:true, start:st}};
  b.status = 'sailing'; b.fishUntil = null; b.v = 0;
  log(why[0] + '. Går i ly til ' + (portById(to) || {name:'?'}).name + (back.length ? ' samme vei tilbake' : '') + '.', why[1] + '. Going to shelter at ' + (portById(to) || {name:'?'}).name + (back.length ? ', back the same way' : '') + '.');
  return true;
}
// the day is cut short (you are out of energy, the crew are tired): no more jigging, the hauls that are due are still done, the rest stands
function plan2Cut(o, why){
  const b = S.boat, pl = S.plan, H = S.t / 60; if (!pl || pl.cut) return; pl.cut = why;
  // (a haul due within three hours is still done: she waits by the gear for it, without the jig; the rest stands until tomorrow)
  const rest = pl.wps.slice(pl.idx), keep = rest.filter(w => w.leia || w.anchor || (w.port && (w.port !== o.M || holdTotal() >= 0.5 || w.port === o.home)) || (w.act && w.act.only === 'haul' && (!w.act.due || w.act.due <= H + DRP2.cutH)));
  for (let i = 0; i < keep.length; i++){ const w = keep[i]; if (w.act || w.port || w.anchor) continue; const nx = keep[i + 1]; w.fish = nx && nx.act && nx.act.due && nx.act.due > H ? Math.round((nx.act.due - H) * 10) / 10 : 0; }
  if (keep.some(w => w.fish > 0)) pl.noJig = true;
  pl.wps = pl.wps.slice(0, pl.idx).concat(keep); if (pl.unsafe) pl.unsafe = pl.unsafe.slice(0, pl.idx).concat(keep.map(() => false));
  if (b.status === 'fishing' && !b.gop && b.fishUntil != null) b.fishUntil = S.t;
  const last = pl.wps[pl.wps.length - 1]; if (!last || (!last.port && !last.anchor)){ const Hp = plan2P(o, 'H'), hp = plan2Port(o, 'H'); const from = last ? {x:last.x, y:last.y} : {x:b.pos.x, y:b.pos.y}; const L = drLeg(o, from, null, Hp, hp); if (L) for (const z of L.w) pl.wps.push({x:z[0], y:z[1], port:null, fish:0, leia:true}); pl.wps.push(hp ? {x:Hp.x, y:Hp.y, port:hp, fish:0} : {x:Hp.x, y:Hp.y, port:null, fish:0, anchor:true}); }
  log(why === 'energy' ? 'Du er tom for energi. Avslutter fisket, trekker det som skal trekkes og går inn.' : 'Mannskapet er slitne. Avslutter juksinga, trekker det som skal trekkes og går inn.', why === 'energy' ? 'You are out of energy. Stopping the fishing, hauling what is due and going in.' : 'The crew are tired. Stopping the jigging, hauling what is due and going in.');
}
// the rules at an hour: a closed place, or the cod quota used up (drRulesWhy with the hour), and the first day within a month a closed place opens
function plan2RulesWhy(o, H, placesOnly){
  const kind = p2Kind(o), hand = !(S.equip && S.equip.jukse > 0), F = o.places.filter(q => q.k === 'felt'), J = o.places.filter(q => q.k === 'juks');
  for (const [i, f] of F.entries()){ const why = ruBlockMsg({p:f, len:BOAT.len, gear:o.rig === 'teiner' ? 'teiner' : kind, sp:kind === 'teine' ? 'krabbe' : null, H}); if (why) return {k:'closed', fix:'places', no:'Felt ' + (i + 1) + ' er stengt: ' + why, en:'Field ' + (i + 1) + ' is closed: ' + why}; }
  if (p2Jig(o)) for (const [i, j] of J.entries()){ const why = ruBlockMsg({p:j, len:BOAT.len, gear:'juksa', sp:null, hand, H}); if (why) return {k:'closed', fix:'places', no:'Juksplass ' + (i + 1) + ' er stengt: ' + why, en:'Jig place ' + (i + 1) + ' is closed: ' + why}; }
  if (!placesOnly && o.rig !== 'teiner' && access() !== 'none'){ const q = quotaState(); if (q.torsk >= codLimitNow(H) - 1) return {k:'quota', fix:'quota', no:'Torskekvoten er brukt opp.', en:'The cod quota is used up.'}; }
  return null;
}
function plan2RulesOpenAt(o, H){ for (let k = 1; k <= 31; k++) if (!plan2RulesWhy(o, H + 24 * k, true)) return H + 24 * k; return null; }
// ---- the engine: each minute, on each vessel (06d-drift.js opsStep hands over with DRIFT2 on)
let P2_DEPTH = 0;
function plan2Step(H){
  const o = plan2Ops(), b = S.boat; if (!o || !o.on) return;
  if (!o.held && drTook()){ o.held = {t:S.t}; if (o.run) o.run.wait = null; log('Du har tatt over båten. Driftsplanen venter til du gir den tilbake.', 'You have taken the boat over. The plan waits until you give her back.'); }
  if (o.held) return;
  if (S.plan && S.plan.ops){ plan2Sea(o, H); return; }
  if (!['port', 'idle'].includes(b.status) || S.shelter || S.plan || b.land || b.shift || (b.status === 'port' && portBusy(b))) return;
  if (b.status === 'port' && b.landWait && b.port === b.landWait) return;
  if (o.hold && H < o.hold) return;
  if (!plan2Made(o)){ if (o.building) return; const C = plan2Check(o); if (!C.ok){ plan2Stop(o, 'check', C.errors[0], C.errors[0]); return; }
    plan2Wait(o, 'make', 'Lager planen på nytt …', 'Making the plan again …', H + 1 / 60); plan2Make(o, err => { if (err && o.on) plan2Stop(o, 'make', err, err); }); return; }
  // a trip that ended where it should (at anchor), or anywhere else (a stop at sea, a takeover): the day goes on from here
  if (o.run && o.run.trip){ const tr = o.run.trip; o.run.trip = null; if (tr.anchor && b.anch) o.run.i = tr.to + 1; else o.run.replan = true; }
  P2_DEPTH = 0; plan2Decide(o, H);
}
function plan2Decide(o, H){
  if (++P2_DEPTH > 40) return;
  const b = S.boat, r = o.run;
  if (!r || !r.day || r.replan || r.i >= r.day.steps.length) return plan2Boundary(o, H);
  const s = r.day.steps[r.i], here = plan2Here(o), atM = !!here.port && here.port === o.M, atH = here.port === o.home || (!!o.homeA && !here.port && dist(b.pos, o.homeA) < 0.4);
  const next = () => { r.i++; r.wait = null; o.hold = 0; plan2Decide(o, H); };
  switch (s.k){
    case 'avgang': return plan2Go(o, H, r.i + 1);
    case 'sett': case 'trekk': case 'juks': case 'vent': return plan2Go(o, H, r.i);
    case 'lever':
      if (!atM) return plan2Go(o, H, r.i);
      if (holdTotal() < 0.5) return next();
      if (!mottakOpen(H)){ plan2Wait(o, 'open', 'Venter på at mottaket åpner.', 'Waiting for the plant to open.', H + 1); return; }
      if (startLanding(true)) return;   // the landing note comes with plan2Report, which steps on
      return next();
    case 'agn': if (!atM) return plan2Go(o, H, r.i); plan2Bait(o); return next();
    case 'behold': case 'vakt': return next();
    case 'hjem': if (atH) return next(); return plan2Go(o, H, r.i);
    case 'egning': plan2Egn(o, s); return next();
    case 'hvile': { const until = s.until == null ? H : s.until; if (H < until - 1 / 60 || !drRested()){ const at = Math.max(until, H); plan2Wait(o, 'rest', 'Mannskapet hviler til kl. ' + driftClock(driftHod(at)) + '.', 'The crew rest until ' + driftClock(driftHod(at)) + '.', H < until ? until : H + 0.5); return; } return next(); }
    case 'ut': r.i = r.day.steps.length; return plan2Boundary(o, H);
  }
  return next();
}
// the day's end: the next day at the hour (or now, round the clock, or when the day must be made again from where she lies)
function plan2Boundary(o, H){
  const r = o.run;
  if (r && r.day && !r.replan && r.closed !== r.t0){ r.closed = r.t0; plan2CostDay(o, r); }
  if (r && !r.day && !r.replan && r.wait && r.wait.k === 'wx' && H < (r.wait.until || 0) - 1 / 60) return;
  // the gear fetched (o.fetch, the page): the plan is off when nothing stands in the sea, else another day of hauls, from now
  if (o.fetch){ if (!mySets().length && holdTotal() < 0.5){ o.on = false; o.fetch = null; o.run = null; plan2Say(o, 'Redskapet er hentet. Driftsplanen er av.', 'The gear is fetched. The plan is off.'); return; } return plan2NewDay(o, H); }
  if (o.rhythm === 'watch' || (r && r.replan)) return plan2NewDay(o, H);
  const from = r && r.day ? r.day.end : H, dep = plan2NextDep(o, H, from);
  // the rules at the next departure: a closed place waits for its date, a used-up quota stops the plan now, not tomorrow morning
  { const st = plan2RulesWhy(o, dep); if (st){ if (st.k === 'closed'){ const at = plan2RulesOpenAt(o, dep); if (at != null){ const d = gDate(at); plan2Wait(o, 'closed', st.no + ' Planen venter til ' + d.getUTCDate() + '.' + (d.getUTCMonth() + 1) + '.', st.en + ' The plan waits until ' + d.getUTCDate() + '.' + (d.getUTCMonth() + 1) + '.', Math.min(at, H + 24)); return; } } plan2Stop(o, st.k, st.no, st.en, st.fix); return; } }
  if (H < dep - 1 / 60){ plan2Wait(o, 'dep', 'Neste tur går kl. ' + driftClock(driftHod(dep)) + (dep - H > 20 ? ' i morgen' : '') + '.', 'The next trip goes at ' + driftClock(driftHod(dep)) + (dep - H > 20 ? ' tomorrow' : '') + '.', dep); return; }
  plan2NewDay(o, H);
}
function plan2NewDay(o, H){
  const st = plan2State(o), day = planDay(o, H, st), r0 = o.run;
  o.run = {day, i:0, t0:H, dayN:(r0 && r0.dayN || 0) + 1, cost0:S.stats.costs, trip:null, wait:null, closed:null};
  if (o.t0 == null) o.t0 = S.t;
  // a day with nothing to sail waits for the next: the reasons are the day's own
  if (!day.steps.some(s => ['sett', 'trekk', 'juks', 'vent', 'lever', 'agn'].includes(s.k) || (s.k === 'hjem' && !plan2Here(o).port))){
    const why = day.skipped.map(x => x.no).join('; ') || day.why[0], whyEn = day.skipped.map(x => x.en).join('; ') || day.why[1];
    o.run.i = day.steps.length; plan2Wait(o, 'idle', 'Ikke noe å gjøre i dag: ' + why + '.', 'Nothing to do today: ' + whyEn + '.', plan2NextDep(o, H + 0.5, H + 0.5)); return;
  }
  o.hold = 0; plan2Decide(o, H);
}
// the day's costs (diesel, bait, baiting, the crew's shares are in the landing) go to its date
function plan2CostDay(o, r){ const d = gDate(r.t0).toISOString().slice(0, 10), D = plan2StatDay(o, d), c = Math.max(0, Math.round(S.stats.costs - (r.cost0 || S.stats.costs))); D.cost += c; o.stats.sum.cost = (o.stats.sum.cost || 0) + c; }
function plan2StatDay(o, d){ let D = o.stats.days.find(x => x.d === d); if (!D){ D = {d, trips:0, kg:0, kr:0, lott:0, cost:0, conf:0, sp:{}, port:{}}; o.stats.days.push(D); while (o.stats.days.length > 60) o.stats.days.shift(); } return D; }
// ---- a trip: the steps from i0 to the next port call, as waypoints on the kept legs
function plan2Trip(o, D, i0){
  const here = plan2Here(o), kind = p2Kind(o), wps = [], need = [], pts = [here.p]; let prev = here.p, prevPort = here.port, h = 0, to = i0, kindK = 'fish', noJig = false, ended = false;
  // (a leg from a place at sea begins at the place itself: she has drifted off it while fishing, and the kept leg is safe from the place, not from wherever she lies)
  const leg = (p, port) => { const L = drLeg(o, prev, prevPort, p, port); if (!L){ need.push({a:prev, ap:prevPort, b:p, bp:port || null}); prev = p; prevPort = port || null; return 0; } if (!prevPort && wps.length) wps.push({x:prev.x, y:prev.y, port:null, fish:0, leia:true}); for (const q of L.w) wps.push({x:q[0], y:q[1], port:null, fish:0, leia:true}); prev = p; prevPort = port || null; return L.h; };
  const P = id => o.places.find(q => q.id === id), jn = new Set(D.steps.slice(i0).filter(s => s.k === 'juks' && s.pid).map(s => s.pid)).size; let jc = 0;
  for (let i = i0; i < D.steps.length && !ended; i++){
    const s = D.steps[i]; to = i;
    if (s.k === 'sett'){ const q = P(s.pid), pv = D.steps[i - 1]; if (pv && pv.k === 'trekk' && pv.pid === s.pid && kind !== 'line') continue;   // nets and pots are set again by the haul
      h += leg(q); pts.push(q); wps.push({x:q.x, y:q.y, port:null, fish:0, act:{op:'cycle', kind, n:s.n, fid:s.pid, final:true, only:'set'}}); h += s.h; }
    else if (s.k === 'trekk'){ const q = P(s.pid); h += leg(q); pts.push(q);
      if (s.wait > 1 / 60){ wps.push({x:q.x, y:q.y, port:null, fish:Math.max(0.1, Math.round(s.wait * 10) / 10)}); if (!p2Jig(o)) noJig = true; h += s.wait; }   // she is there before the soak is up: jigs (or waits) by the gear until then
      wps.push({x:q.x, y:q.y, port:null, fish:0, act:{op:'cycle', kind, n:s.n, fid:s.pid, final:!(s.reset && kind !== 'line'), only:'haul', due:s.due != null ? s.due : s.t}}); h += s.h; }
    else if (s.k === 'juks'){ const q = s.pid ? P(s.pid) : null; if (q){ h += leg(q); pts.push(q); } const w = {x:prev.x, y:prev.y, port:null, fish:Math.max(0.1, Math.round(s.h * 10) / 10)}; if (jn > 1 && q){ w.jc = ++jc; w.jn = jn; } wps.push(w); h += s.h; }
    else if (s.k === 'vent'){ const q = P(s.pid); h += leg(q); pts.push(q); wps.push({x:q.x, y:q.y, port:null, fish:Math.max(0.1, Math.round((s.until - s.t) * 10) / 10)}); noJig = true; h += s.until - s.t; }
    else if (s.k === 'lever' || s.k === 'agn'){ const M = plan2P(o, 'M'); if (!M) continue; h += leg(M, o.M); pts.push(M); wps.push({x:M.x, y:M.y, port:o.M, fish:0}); kindK = wps.some(w => w.act || w.fish > 0) ? 'fish' : 'land'; ended = true; }
    else if (s.k === 'hjem'){ const Hp = plan2P(o, 'H'), hp = plan2Port(o, 'H'); h += leg(Hp, hp); pts.push(Hp); wps.push(hp ? {x:Hp.x, y:Hp.y, port:hp, fish:0} : {x:Hp.x, y:Hp.y, port:null, fish:0, anchor:true}); kindK = wps.some(w => w.act || w.fish > 0) ? 'fish' : 'home'; ended = true; }
    else if (s.k === 'hvile' && s.where === 'anker'){ const A = plan2P(o, 'A'); if (A){ h += leg(A); pts.push(A); wps.push({x:A.x, y:A.y, port:null, fish:0, anchor:true}); } kindK = wps.some(w => w.act || w.fish > 0) ? 'fish' : 'rest'; ended = true; }
    else if (s.k === 'hvile' && s.where === 'kai'){ const M = plan2P(o, 'M'); if (M){ h += leg(M, o.M); pts.push(M); wps.push({x:M.x, y:M.y, port:o.M, fish:0}); } kindK = wps.some(w => w.act || w.fish > 0) ? 'fish' : 'rest'; ended = true; }
    else if (s.k === 'ut'){ ended = true; to = i - 1; }
  }
  if (!wps.some(w => w.act || w.fish > 0 || w.port || w.anchor)) return null;
  if (need.length) return {need};
  // a trip with no port call after the fishing (the day ends at sea): home, or the plant round the clock
  const last = wps[wps.length - 1];
  if (!last.port && !last.anchor){ if (o.rhythm === 'watch'){ const M = plan2P(o, 'M'); h += leg(M, o.M); wps.push({x:M.x, y:M.y, port:o.M, fish:0}); } else { const Hp = plan2P(o, 'H'), hp = plan2Port(o, 'H'); h += leg(Hp, hp); wps.push(hp ? {x:Hp.x, y:Hp.y, port:hp, fish:0} : {x:Hp.x, y:Hp.y, port:null, fish:0, anchor:true}); } if (need.length) return {need}; }
  return {wps, h, pts, to, kind:kindK, noJig};
}
// she is free and the step is a trip: the crew, the yard, the rules, the rig, the way and the weather, then off
function plan2Go(o, H, i0){
  const r = o.run, D = r.day, b = S.boat;
  const cw = plan2CrewWhy(o); if (cw){ if (cw.wait) plan2Wait(o, cw.k, cw.no, cw.en, H + 1); else plan2Stop(o, cw.k, cw.no, cw.en, cw.fix); return; }
  if (S.jobs && S.jobs.length){ const until = Math.max(H + 5 / 60, (jobsDone() || S.t) / 60 + 1 / 60); plan2Wait(o, 'jobs', jobsCrewOnly() ? 'Mannskapet gjør ferdig arbeidet på kaia. Går kl. ' + driftClock(driftHod(until)) + '.' : 'Verkstedet jobber på båten, så den venter.', jobsCrewOnly() ? 'The crew finish the work at the quay. Leaving at ' + driftClock(driftHod(until)) + '.' : 'The yard is working on the boat, so she waits.', until); return; }
  { const st = plan2RulesWhy(o, H); if (st){
      if (st.k === 'closed'){ const at = plan2RulesOpenAt(o, H); if (at != null){ const d = gDate(at); plan2Wait(o, 'closed', st.no + ' Planen venter til ' + d.getUTCDate() + '.' + (d.getUTCMonth() + 1) + '.', st.en + ' The plan waits until ' + d.getUTCDate() + '.' + (d.getUTCMonth() + 1) + '.', Math.min(at, H + 24)); return; } }
      plan2Stop(o, st.k, st.no, st.en, st.fix); return; } }
  // the day was laid for an earlier departure (the weather, the quay): it is made again from now, so the soak and the hours are right
  if (i0 === 1 && D.t0 < H - 0.5 && !r.remade){ r.remade = true; return plan2NewDay(o, H); }
  // with you aboard the day needs your energy: 15 % left when she is home, at 4.2 % an hour (15-energy.js ENERGY.sea)
  if (i0 === 1 && meAboard() && S.energy != null){ const seaH = D.home != null ? D.home - D.t0 : DRP2.dayMax, need = Math.min(100, DRP2.enMin + DRP2.enH * seaH);
    if (S.energy < need - 0.5){ const rate = (typeof restRate === 'function' ? restRate(b) : 0) * 60, hours = rate > 0 ? (need - S.energy) / rate : null;
      if (hours == null){ plan2Wait(o, 'energy', 'Du har ' + Math.round(S.energy) + ' % energi og trenger ' + Math.round(need) + ' % til dagen. Hvil i naustet, på en rorbu eller i køya først.', 'You have ' + Math.round(S.energy) + ' % energy and need ' + Math.round(need) + ' % for the day. Rest in the boathouse, at a rorbu or in the bunk first.', H + 1); return; }
      const at = H + hours; plan2Wait(o, 'energy', 'Du må hvile til kl. ' + driftClock(driftHod(at)) + ' før dagen kan begynne (' + Math.round(S.energy) + ' % energi, dagen trenger ' + Math.round(need) + ' %).', 'You must rest until ' + driftClock(driftHod(at)) + ' before the day can begin (' + Math.round(S.energy) + ' % energy, the day needs ' + Math.round(need) + ' %).', at); return; } }
  if (rigOf() !== o.rig){ const why = rigSet(o.rig); if (why){ plan2Stop(o, 'rig', 'kan ikke rigge om til ' + rigName(o.rig).toLowerCase() + ': ' + why[0], 'cannot re-rig for ' + rigName(o.rig).toLowerCase() + ': ' + why[0], 'rig'); return; } }
  const T = plan2Trip(o, D, i0);
  if (!T){ r.i = D.steps.length; return plan2Boundary(o, H); }
  if (T.need){ plan2Wait(o, 'route', 'Finner veien …', 'Finding the way …', H + 10 / 60); drFetch(o, T.need); return; }
  // (she goes out on the next hours' forecast, DRP2.fcH; a gale later in the day sends her to shelter when it comes, plan2Shelter)
  const wx = plan2WxAhead(o, H, Math.min(Math.max(1, T.h), DRP2.fcH), T.pts);
  if (!wx.ok){
    const at = plan2WxFirstOk(o, H, Math.max(1, T.h), T.pts), why = wx.w > wx.wind ? ['vinden blir ' + fmt(wx.w, 0) + ' m/s, og grensen er ' + wx.wind + ' m/s', 'the wind gets to ' + fmt(wx.w, 0) + ' m/s, and the limit is ' + wx.wind + ' m/s'] : ['sjøen blir ' + fmt(wx.h, 1) + ' m, og grensen er ' + fmt(wx.lim, 1) + ' m', 'the sea gets to ' + fmt(wx.h, 1) + ' m, and the limit is ' + fmt(wx.lim, 1) + ' m'];
    if (at != null){ plan2Wait(o, 'wx', 'Venter på været: ' + why[0] + '. Går kl. ' + driftClock(driftHod(at)) + '.', 'Waiting for the weather: ' + why[1] + '. Leaving at ' + driftClock(driftHod(at)) + '.', at); return; }
    // the day is lost to the weather: the next one at the hour
    const dep = plan2NextDep(o, H + DRP2.late + 0.01, H + 1); r.i = D.steps.length; r.day = null;
    plan2Wait(o, 'wx', 'Dagen går ut: ' + why[0] + '. Neste tur går kl. ' + driftClock(driftHod(dep)) + (dep - H > 20 ? ' i morgen' : '') + '.', 'The day is lost: ' + why[1] + '. The next trip goes at ' + driftClock(driftHod(dep)) + (dep - H > 20 ? ' tomorrow' : '') + '.', dep); return;
  }
  autoRestock();
  if (!meAboard() && !S.lic && b.kgear && !kveiteClosed(H)) S.target = 'kveite';
  const here = plan2Here(o);
  S.plan = {wps:T.wps, idx:0, speed:BOAT.vcruise, returning:false, depAt:null, ops:true, opsK:T.kind, unsafe:[], noJig:!!T.noJig, p2:{from:i0, to:T.to, start:{x:here.p.x, y:here.p.y, port:here.port}}};
  r.trip = {from:i0, to:T.to, t0:S.t, anchor:!!T.wps[T.wps.length - 1].anchor}; r.wait = null; o.hold = 0; o.stop = null;
  if (T.kind === 'home') log('Går hjem til ' + (portById(o.home) || {name:'?'}).name + (o.homeA && T.wps[T.wps.length - 1].anchor ? ' og legger seg til ankers' : '') + '.', 'Going home to ' + (portById(o.home) || {name:'?'}).name + (o.homeA && T.wps[T.wps.length - 1].anchor ? ' to lie at anchor' : '') + '.');
  else if (T.kind === 'land') log('Går til ' + (portById(o.M) || {name:'mottaket'}).name + ' for å levere.', 'Going to ' + (portById(o.M) || {name:'the plant'}).name + ' to land.');
  else if (T.kind === 'rest') log('Går for å hvile om bord.', 'Going to rest aboard.');
  else log(meAboard() ? 'Gikk ut på driftsplanen med deg som skipper.' : crewSkipper().name + ' gikk ut på driftsplanen.', meAboard() ? 'Went out on the plan with you as skipper.' : crewSkipper().name + ' went out on the plan.');
  // (depart defers the departure itself while the quay is busy, S.plan.depAt; 05-vessels.js casts off then)
  if (!depart() && !(S.plan && S.plan.depAt)){ S.plan = null; r.trip = null; plan2Wait(o, 'cant', 'Båten kom ikke av sted. Prøver igjen om en halv time.', 'The boat could not leave. Trying again in half an hour.', H + 0.5); }
}
// out on a trip: the soak is kept (a haul never starts before its hour), and a hold that fills lands before the day is over
function plan2Sea(o, H){
  const b = S.boat, pl = S.plan; if (!pl || !pl.p2) return;
  if (pl.opsK === 'fish' && !pl.cut && !pl.returning){ if (meAboard() && S.energy != null && S.energy <= DRP2.enMin) plan2Cut(o, 'energy'); else if (o.rhythm !== 'watch' && drTired()) plan2Cut(o, 'tired'); }
  const nx = pl.wps[pl.idx];
  // (the jig before a haul ends when the soak is up, whether she came to the grounds early or late: the haul starts at its hour)
  if (nx && nx.act && nx.act.due && b.status === 'fishing' && b.fishUntil != null && !b.gop && !b.deckStop){ const legMin = dist(b.pos, nx) / (Math.max(1, BOAT.vcruise || 7) * NM) * 60; const at = Math.max(S.t, Math.round(nx.act.due * 60 - legMin + 6)); if (Math.abs(b.fishUntil - at) > 2) b.fishUntil = at; }   // (six minutes to spare: she is never early)
  // the hold over the limit on a trip that would not land: the rest of the trip is the way to the plant
  if (!pl.full && pl.opsK === 'fish' && o.land && o.land.when !== 'trip' && holdTotal() >= DRP2.full * capHold() && !pl.wps.slice(pl.idx).some(w => w.port === o.M)){
    const M = plan2P(o, 'M'); if (!M) return;
    let from = null, fp = null; for (let i = pl.idx - 1; i >= 0; i--){ const w = pl.wps[i]; if (w.act || w.fish > 0 || w.jc){ from = {x:w.x, y:w.y}; break; } }
    const L = from ? drLeg(o, from, null, M, o.M) : null; if (!L) return;
    pl.full = true; if (b.status === 'fishing' && !b.gop) b.fishUntil = S.t;
    pl.wps.splice(pl.idx); if (pl.unsafe) pl.unsafe.splice(pl.idx);
    if (dist(b.pos, from) > 0.05) pl.wps.push({x:from.x, y:from.y, port:null, fish:0, leia:true});
    for (const q of L.w) pl.wps.push({x:q[0], y:q[1], port:null, fish:0, leia:true});
    pl.wps.push({x:M.x, y:M.y, port:o.M, fish:0}); pl.opsK = 'fish';
    log('Lasten er ' + Math.round(100 * holdTotal() / capHold()) + ' % full. Går til ' + (portById(o.M) || {name:'mottaket'}).name + ' for å levere.', 'The hold is ' + Math.round(100 * holdTotal() / capHold()) + ' % full. Going to ' + (portById(o.M) || {name:'the plant'}).name + ' to land.');
  }
}
// she has come in (05-vessels.js dock, through opsLanded): the port call's own step runs next, and a port that is not the step's means the day is made again from here
function plan2Landed(pid, k){
  const o = plan2Ops(); if (!o || !o.run) return; const r = o.run, tr = r.trip; r.trip = null;
  if (tr) r.i = tr.to;
  const s = r.day && r.day.steps[r.i], want = s ? (s.k === 'lever' || s.k === 'agn' ? o.M : s.k === 'hjem' ? o.home : s.k === 'hvile' && s.where === 'kai' ? o.M : null) : null;
  if (!s || (want && want !== pid)) r.replan = true;
  o.hold = 0;
}
// the landing note is in (07-harbours.js finishLanding through opsReport): the statistics, the report, and the day steps on
function plan2Report(pid, kg, total, landed){
  const o = plan2Ops(); if (!o) return; const port = portById(pid), sale = (S.sales || [])[S.sales.length - 1], L = S.lastSale || {};
  autoRestock();
  const sk = meAboard() ? null : crewSkipper();
  if (landed){
    const d = gDate(S.t / 60).toISOString().slice(0, 10), D = plan2StatDay(o, d), M = o.stats.sum, lott = L.t === S.t ? (L.lott || 0) : 0, conf = L.t === S.t ? Math.round(L.confKg || 0) : 0;
    for (const X of [D, M]){ X.trips++; X.kg += Math.round(kg); X.kr += Math.round(total); X.lott += Math.round(lott); X.conf += conf; X.port[pid] = (X.port[pid] || 0) + Math.round(kg); if (sale && sale.t === S.t) for (const [sp, k] of sale.sp || []) X.sp[sp] = (X.sp[sp] || 0) + k; }
    msg(sk ? sk.name : gL('Driftsplan', 'Operations plan'), 'Driftsrapport: ' + fmt(kg, 0) + ' kg levert i ' + port.name + ', ' + kr(Math.round(total)) + ' etter lott' + (conf ? ', ' + conf + ' kg inndratt' : '') + '.', 'Operations report: ' + fmt(kg, 0) + ' kg landed at ' + port.name + ', ' + kr(Math.round(total)) + ' after shares' + (conf ? ', ' + conf + ' kg confiscated' : '') + '.');
  }
  const r = o.run; if (r && r.day && r.day.steps[r.i] && r.day.steps[r.i].k === 'lever'){ r.i++; r.wait = null; o.hold = 0; }
}
// bait at the plant: for the pots aboard, and for the tubs the crew bait at home (buyGear asks buyGate and the plant)
function plan2Bait(o){
  const pg = S.pgear, kind = p2Kind(o); if (!pg || !kind) return;
  const k = BAITS[pg.baitPref] ? pg.baitPref : 'makrell', have = baitOf(pg)[k] || 0;
  const potsSea = mySets().filter(x => x.kind === 'teine').reduce((a, x) => a + x.n, 0);
  const need = kind === 'teine' ? (pg.pots.big + potsSea) * GPRICE.potBait * 2 - have : kind === 'line' ? ((pg.lines.hyse.n - pg.lines.hyse.baited) * LINE_KINDS.hyse.baitKg + (pg.lines.bank.n - pg.lines.bank.baited) * LINE_KINDS.bank.baitKg) - have : 0;
  if (need <= 0.01) return;
  const c0 = S.cash, why = buyGear('bait', k, Math.ceil(need));
  if (why) log('Fikk ikke kjøpt agn: ' + why[0], 'Could not buy bait: ' + why[0]);
  else { const kr0 = Math.round(c0 - S.cash); log('Kjøpte ' + Math.ceil(need) + ' kg ' + BAITS[k].no.toLowerCase() + ' for ' + kr(kr0) + '.', 'Bought ' + Math.ceil(need) + ' kg of ' + BAITS[k].en.toLowerCase() + ' for ' + kr(kr0) + '.'); }
}
// the baiting where she lies for the night: the shed when there is one, else the crew (10-gear.js egnSelf, a job that takes its hours)
function plan2Egn(o, s){
  const pg = S.pgear, p = portById(S.boat.port); if (!pg || S.boat.status !== 'port') return;
  for (const lk of ['hyse', 'bank']){ const un = pg.lines[lk].n - pg.lines[lk].baited; if (un < 1) continue;
    const why = s.where === 'egnebu' && egnPort(p) ? egnOrder(lk, un) : egnSelf(lk, un);
    if (why) log('Lina ble ikke egnet: ' + why[0], 'The line was not baited: ' + why[0]); }
}
// round the clock: who sleeps this hour (04-crew.js crewTick through driftWatch): the watch off sleeps in the bunks
function plan2WatchTick(H){
  const o = plan2Ops(), on = !!o && o.on && o.rhythm === 'watch' && S.crew.length >= 4;
  if (!on){ for (const c of S.crew) if (c.sleepW) delete c.sleepW; return; }
  const sk = meAboard() ? null : crewSkipper(), m0 = crewMate(), mate = m0 && m0 !== sk ? m0 : S.crew.find(c => c !== sk) || null, deck = S.crew.filter(c => c !== sk && c !== mate);
  const A = [sk].filter(Boolean).concat(deck.filter((c, i) => i % 2 === 0)), B = [mate].filter(Boolean).concat(deck.filter((c, i) => i % 2 === 1)), off = plan2Watch(H).w === 'A' ? B : A;
  for (const c of S.crew){ if (off.includes(c)) c.sleepW = true; else delete c.sleepW; }
}
