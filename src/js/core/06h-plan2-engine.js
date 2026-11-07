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
  if (drCK(a, ap) === drCK(b, bp) || dist(a, b) < 0.005) return true;   // (no way to sail: home is the plant, H2c)
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
    try { await mapNeed(mid, 14); await mapNeed(home.p, 6); for (const q of P) await mapNeed(q, p2Sno(o) ? 6 + DRP2.sno.row * Math.ceil(q.n / DRP2.sno.cols) + DRP2.sno.cols * DRP2.sno.col / 2 : 2); } catch (e){}
    // (the snow crab's strings, H3c: their room checked again now the map round them is in)
    if (p2Sno(o)){ P2SNO_FIT.clear(); const C2 = plan2Check(o); if (!C2.ok) throw C2.errors[0]; }
    // the plant: the chosen one, or of the three nearest the grounds the one reached soonest from the nearest place
    const first = P.slice().sort((x, y) => dist(x, mid) - dist(y, mid))[0];
    if (o.land && o.land.mode === 'port' && p2PlantOk(portById(o.land.port))) o.M = o.land.port;
    else {
      const near = p2Plants().map(q => ({q, d:dist(q.p, mid)})).sort((x, y) => x.d - y.d).slice(0, 3).map(x => x.q);   // (an ocean vessel: the plants whose quay takes her, H2c)
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
    // (an ocean vessel has none: over her limits she lies to where she is, 05-vessels.js lieTo, H2c)
    for (const q of P) lyC[q.id] = BOAT.cls === 'hav' ? [] : PORTS.filter(p => !p.rorbu).map(p => ({p, d:dist(p.p, q)})).sort((x, y) => x.d - y.d).slice(0, 2).map(x => x.p);
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
// (who says it: the skipper you named, the ocean vessel's own skipper of the teams (H2c), or the plan)
const p2SkName = () => { if (meAboard()) return null; const sk = crewSkipper(); return sk ? sk.name : p2Lag() ? gL('Skipperen', 'The skipper') : null; };
const plan2Say = (o, no, en) => { msg(p2SkName() || gL('Driftsplan', 'Operations plan'), no, en); };
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
// Pause (U4, Jonas 05.11.2026: «Ja, pause stopper båten der den er»): the trip is cut where she is (a set or a haul in hand stops with what
// is over the side, as gopAbort does), and the gear in the sea stays; o.paused says so on the page until Start, which lays the day again
// from where she lies (plan2Start). At sea she anchors where the depth and the room to swing allow it (Jonas 05.11.2026: «Ankre der det
// går», anchorSpot: 4-40 m and clear of the land), else she drifts with the wind as before (lieDrift, held off the land when someone is
// awake aboard); o.paused.drift says why she could not anchor
function plan2Pause(o){
  const sea = !!(S.plan && S.plan.ops); plan2Abort(o);
  o.on = false; o.stop = null; o.held = null; o.hold = 0; o.fetch = null; if (o.run) o.run.wait = null;
  const b = S.boat, atSea = b.status !== 'port'; let drift = null;
  if (atSea && !b.anch){ const sp = anchorSpot(b.pos); if (sp.ok) dropAnchor(true); if (!b.anch) drift = sp.ok ? 'nomap' : sp.why; }
  o.paused = {t:S.t, sea:atSea, cut:sea, drift};
}
// Start: a plan paused at sea (or started there) lays the day from where she lies, after the rest if the day's work is spent (plan2Spent);
// an anchor Pause dropped comes up when she goes (depart weighs it), so she lies at anchor through that rest instead of drifting
function plan2Start(o){
  const sea = S.boat.status !== 'port' && !(o.homeA && dist(S.boat.pos, o.homeA) < 0.4);
  o.on = true; o.stop = null; o.held = null; o.hold = 0; o.paused = null; if (o.t0 == null) o.t0 = S.t;
  o.run = sea ? {day:null, i:0, trip:null, wait:null, replan:true, dayN:(o.run && o.run.dayN) || 0} : null;
}
function plan2Resume(o){ o.held = null; o.hold = 0; if (o.run){ o.run.wait = null; o.run.trip = null; o.run.replan = true; } }
// who sails her: null when she can go; {wait} when she waits; else what is missing. The watch asleep in the bunks counts as aboard
function plan2CrewWhy(o){
  if (meAboard() || p2Lag()) return null;   // (the ocean vessel's teams have a skipper and a mate on the bridge, a watch each, H2b)
  const V = VESSELS[S.boat.type];
  if ((V.crewMax || 0) < 2) return {wait:true, k:'one', no:'Båten har plass til bare én i mannskapet, så planen går bare når du er om bord. Mens du er i land, venter den.', en:'The boat has room for only one crew, so the plan runs only when you are aboard. While you are ashore, it waits.'};
  const sk = crewSkipper(), mt = crewMate();
  if (!sk || !mt || sk === mt) return {k:'roles', fix:'mannskap', no:'Når du ikke er om bord, må både en skipper og en styrmann være utnevnt. Gjør det på Mannskap-siden.', en:'When you are not aboard, both a skipper and a mate must be appointed. Do it on the Crew page.'};
  const on = crewAboard(null, true); if (!on.includes(sk) || !on.includes(mt)) return {wait:true, k:'off', no:(on.includes(sk) ? mt : sk).name.split(' ')[0] + ' har fri, så båten venter.', en:(on.includes(sk) ? mt : sk).name.split(' ')[0] + ' has time off, so the boat waits.'};
  return null;
}
// the weather the trip allows (05-vessels.js turns back over it), and the most wind and sea over the hours ahead at the trip's places
function plan2Wx(){ const o = plan2Ops(); if (!o) return null;
  // (an ocean vessel on the plan, at sea on a trip or waiting there: her own lying-to limits, 4.12j, not a shelter quay; the gear's
  // working limit is the plan's o.wx, kept by plan2Sea and plan2Go, H2c)
  if (BOAT.cls === 'hav' && o.on && !o.held && S.boat.status !== 'port' && (S.plan ? S.plan.ops : true)) return {wind:windLim(), hs:seaLim(), shelter:false, hav:true};
  if (!S.plan || !S.plan.ops) return null; return {wind:o.wx.wind, hs:Math.min(o.wx.hs, BOAT.risk[1] * 0.95), shelter:true}; }
function plan2WxAhead(o, H, dur, pts, L){
  const P = (pts || []).filter(Boolean);
  const seaAt = Hk => { if (!P.length) return hsOpen(Hk); let m = 0; for (const p of P){ let v; try { v = hsAt(p, Hk); } catch (e){ v = hsOpen(Hk); } m = Math.max(m, v); } return m; };
  const windOn = Hk => { if (!P.length) return windAt(Hk); let m = 0; for (const p of P) m = Math.max(m, windAt(Hk, p)); return m; };
  let w = 0, h = 0; for (let k = 0; k <= Math.ceil(dur); k++){ w = Math.max(w, windOn(H + k)); h = Math.max(h, seaAt(H + k)); }
  // (L: other limits than the plan's, as the ocean vessel's lying-to limits on the way out, H2c)
  const wind = L ? L.wind : o.wx.wind, lim = L ? L.hs : Math.min(o.wx.hs, BOAT.risk[1] * 0.95);
  return {w, h, lim, wind, boatLim:!L && BOAT.risk[1] * 0.95 < o.wx.hs, ok:w <= wind && h <= lim};
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
  S.plan = {wps, idx:0, speed:pl.speed, full:pl.full, returning:true, ops:true, opsK:'ly', unsafe:wps.map(() => false), p2:{from:pl.p2.from, to:pl.p2.to, ly:true, start:st}};
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
  for (const [i, f] of F.entries()){ const why = ruBlockMsg({p:f, len:BOAT.len, gear:o.rig === 'teiner' ? 'teiner' : kind, sp:kind === 'teine' ? potSp() : null, H}); if (why) return {k:'closed', fix:'places', no:'Felt ' + (i + 1) + ' er stengt: ' + why, en:'Field ' + (i + 1) + ' is closed: ' + why}; }
  if (p2Jig(o)) for (const [i, j] of J.entries()){ const why = ruBlockMsg({p:j, len:BOAT.len, gear:'juksa', sp:null, hand, H}); if (why) return {k:'closed', fix:'places', no:'Juksplass ' + (i + 1) + ' er stengt: ' + why, en:'Jig place ' + (i + 1) + ' is closed: ' + why}; }
  // (the cod quota is not the plan's business, Jonas 27.10.2026: a used-up quota stopped a halibut line plan. Cod over the bycatch share is confiscated at the landing, as the rules say, and the statistics show it)
  return null;
}
function plan2RulesOpenAt(o, H){ for (let k = 1; k <= 31; k++) if (!plan2RulesWhy(o, H + 24 * k, true)) return H + 24 * k; return null; }
// ---- the engine: each minute, on each vessel (06d-drift.js opsStep hands over with DRIFT2 on)
let P2_DEPTH = 0;
function plan2Step(H){
  const o = plan2Ops(), b = S.boat; if (!o || !o.on) return;
  if (!o.held && drTook()){ o.held = {t:S.t}; if (o.run) o.run.wait = null; log('Du har tatt over båten. Driftsplanen venter til du gir den tilbake.', 'You have taken the boat over. The plan waits until you give her back.'); }
  if (o.held) return;
  if (b.hove) return;   // lying to in the storm (05-vessels.js lieTo): the plan waits until it eases and she goes on (H2c)
  if (S.plan && S.plan.ops){ plan2Sea(o, H); return; }
  if (!['port', 'idle'].includes(b.status) || S.shelter || S.plan || b.land || b.shift || (b.status === 'port' && portBusy(b))) return;
  if (b.status === 'port' && b.landWait && b.port === b.landWait) return;
  plan2MeRest(o, H);
  if (o.hold && H < o.hold) return;
  if (!plan2Made(o)){ if (o.building) return; const C = plan2Check(o); if (!C.ok){ plan2Stop(o, 'check', C.errors[0], C.errors[0]); return; }
    plan2Wait(o, 'make', 'Lager planen på nytt …', 'Making the plan again …', H + 1 / 60); plan2Make(o, err => { if (err && o.on) plan2Stop(o, 'make', err, err); }); return; }
  // a trip that ended where it should (at anchor), or anywhere else (a stop at sea, a takeover): the day goes on from here
  if (o.run && o.run.trip){ const tr = o.run.trip; o.run.trip = null; plan2Caught(o, tr); if (tr.anchor && b.anch) o.run.i = tr.to + 1; else o.run.replan = true; }
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
      if (holdTotal() >= 0.5) o.landFail = S.t;   // (refused: the ocean vessel's day does not try again at once, planDayAuto)
      return next();
    case 'agn': if (!atM) return plan2Go(o, H, r.i); plan2Bait(o, s); return next();
    case 'behold': case 'vakt': case 'lagvakt': return next();
    case 'hjem': if (atH) return next(); return plan2Go(o, H, r.i);
    case 'egning': plan2Egn(o, s); return next();
    // (Skippertak: no rest, only the baiting when there is any, s.ready after s.t; at full speed she is home before the hour the day
    // reckoned with, and waiting for that hour was a rest of its own; Jonas 06.11.2026)
    case 'hvile': { const until = skipOn() ? (s.ready != null && s.ready > s.t + 1e-6 ? s.ready : H) : s.until == null ? H : s.until; if (H < until - 1 / 60 || !drRested()){ const at = Math.max(until, H); const me = meAboard(); plan2Wait(o, 'rest', (me ? 'Mannskapet og du hviler til kl. ' : 'Mannskapet hviler til kl. ') + driftClock(driftHod(at)) + '.', (me ? 'The crew and you rest until ' : 'The crew rest until ') + driftClock(driftHod(at)) + '.', H < until ? until : H + 0.5); return; } return next(); }
    case 'ut': r.i = r.day.steps.length; return plan2Boundary(o, H);
  }
  return next();
}
// you aboard and the plan lying a while where you can rest (the naust, a rorbu, the bunk at anchor): you go in by yourself, as Autonav
// does at a rorbu (dock), with the game open or closed (catchUp plays this minute by minute); the rorbu's night is paid as when you go in
// yourself (restStart, 15-energy.js), and without the money the departure waits and says so (plan2Go). The departure ends the rest.
// (U11, Jonas 05.11.2026: «så lenge mannskapet og brukeren får den søvnen de trenger»)
function plan2MeRest(o, H){
  if (!meAboard() || S.tut || S.energy == null || S.energy >= 98 || resting() || asleep() || energyOff()) return;
  const r = o.run, w = r && r.wait, b = S.boat, where = restWhere(b);
  if (!where || (where === 'koye' && (o.rhythm === 'watch' || !b.anch))) return;   // (round the clock the watches have the bunk, plan2WatchTick)
  if (!w || !(w.k === 'energy' || (w.until != null && w.until - H >= 1))) return;   // (not for a wait of minutes: a rorbu night for nothing)
  if (!restStart() && w.k === 'energy') o.hold = 0;   // (in: the departure reckons the hour again now, by the rest's rate)
}
// Skippertak given (15-energy.js giveSkip; Jonas 06.11.2026, «Døgnet rundt»): the plans of the whole fleet go on at once, without a reload:
// the holds and the waits for the rest, your energy and the hour are let go, and in port a day not yet begun (or one laid short for
// tired hands) is laid again, rested. A trip under way goes on, and the day is laid again where it ends, as always; a rest at the end
// of a day waits only for the baiting ('hvile', s.ready)
// (each vessel's own plan read where it lies, vget, without binding the vessel: a purchase must never fail on a vessel half made)
function plan2SkipGiven(){
  if (!DRIFT2) return;
  for (const v of S.fleet && S.fleet.length ? S.fleet : [{id:S.cur}]){
    const o = vget(v, 'ops'), pl = vget(v, 'plan'); if (!o || o.v !== DRV2 || !o.on) continue;
    o.hold = 0; const r = o.run; if (!r) continue;
    if (r.wait && ['rest', 'energy', 'dep'].includes(r.wait.k)) r.wait = null;
    const s = r.day && r.day.steps[r.i]; if (!(pl && pl.ops) && !r.trip && !(s && s.k === 'hvile')) r.replan = true;
  }
}
// when the day is done: its end (the rest included), or with Skippertak on only the baiting's, else now (a day laid before it was bought
// had the rest in its end, and at full speed she is home before the hour the day reckoned with)
function p2DayEnd(d){ if (!skipOn()) return d.end; const h = d.steps.find(s => s.k === 'hvile'); return h && h.ready != null && h.ready > h.t + 1e-6 ? Math.min(d.end, h.ready) : 0; }   // (0: nothing to wait for, she goes now)
// the day's end: the next day at the hour (or now, round the clock, or when the day must be made again from where she lies)
function plan2Boundary(o, H){
  const r = o.run;
  if (r && r.day && !r.replan && r.closed !== r.t0){ r.closed = r.t0; plan2CostDay(o, r); }
  if (r && !r.day && !r.replan && r.wait && r.wait.k === 'wx' && H < (r.wait.until || 0) - 1 / 60) return;
  // the gear fetched (o.fetch, the page): the plan is off when nothing stands in the sea, else another day of hauls, from now
  if (o.fetch){ if (!mySets().length && holdTotal() < 0.5){ o.on = false; o.fetch = null; o.run = null; plan2Say(o, 'Redskapet er hentet. Driftsplanen er av.', 'The gear is fetched. The plan is off.'); return; } return plan2NewDay(o, H); }
  if (o.rhythm === 'watch') return plan2NewDay(o, H);
  // a day made again from where she lies (a shelter, a takeover, a port that was not the step's): at once while the crew and you have
  // a day's work left, else after the rest and at the hour, like any day (GUI review F2: a day made again late at night went out again)
  const spent = r && r.replan ? plan2Spent(o, H) : 0;
  if (r && r.replan && !spent) return plan2NewDay(o, H);
  const from = spent ? H + spent : r && r.day ? p2DayEnd(r.day) : H, dep = plan2NextDep(o, H, from);
  // the rules at the next departure: a closed place waits for its date, a used-up quota stops the plan now, not tomorrow morning
  { const st = plan2RulesWhy(o, dep); if (st){ if (st.k === 'closed'){ const at = plan2RulesOpenAt(o, dep); if (at != null){ const d = gDate(at); plan2Wait(o, 'closed', st.no + ' Planen venter til ' + d.getUTCDate() + '.' + (d.getUTCMonth() + 1) + '.', st.en + ' The plan waits until ' + d.getUTCDate() + '.' + (d.getUTCMonth() + 1) + '.', Math.min(at, H + 24)); return; } } plan2Stop(o, st.k, st.no, st.en, st.fix); return; } }
  if (H < dep - 1 / 60){ plan2Wait(o, 'dep', (spent ? 'Mannskapet hviler. ' : '') + 'Neste tur går kl. ' + driftClock(driftHod(dep)) + (dep - H > 20 ? ' i morgen' : '') + '.', (spent ? 'The crew rest. ' : '') + 'The next trip goes at ' + driftClock(driftHod(dep)) + (dep - H > 20 ? ' tomorrow' : '') + '.', dep); if (spent) r.replan = true; return; }
  plan2NewDay(o, H);
}
// the rest a day made again needs first (day rhythm): 0 while the crew and you have DRP2.minDay of work left, else the hours until the
// crew are rested (DRP2.rested) where she lies; your own energy is the departure's (plan2Go)
function plan2Spent(o, H){
  if (o.rhythm === 'watch' || skipOn()) return 0;
  const st = plan2State(o), here = plan2Here(o);
  const left = Math.min(...st.crew.map(c => (DRP2.tired - c.fat) / Math.max(1, c.rate || DRP2.fatH)), st.me.aboard ? (st.me.energy - DRP2.enMin) / DRP2.enH : Infinity);
  if (!(left < DRP2.minDay)) return 0;
  const fat = st.crew.length ? Math.max(...st.crew.map(c => c.fat)) : 0, where = S.boat.anch ? 'anker' : here.port && plan2RestOk(here.port) ? 'bunks' : 'quay';
  const meH = st.me.aboard ? p2MeRestH(st.me.energy, S.boat.anch ? p2MeRate(null, true) : p2MeRate(here.port)) : 0;   // (and you, U11)
  return Math.max(0.5, (fat - DRP2.rested) / p2RestRate(where), meH);
}
function plan2NewDay(o, H){
  const st = plan2State(o), day = planDay(o, H, st), r0 = o.run;
  o.run = {day, i:0, t0:H, dayN:(r0 && r0.dayN || 0) + 1, cost0:S.stats.costs, trip:null, wait:day.auto && r0 && r0.wait && (r0.wait.k === 'wx' || (day.sno && r0.wait.k === 'idle')) ? r0.wait : null, closed:null};   // (the ocean vessel's wait for the weather is said once while it lasts, H2c; the snow crab's wait for the season, the quota or the soak too, H3c)
  if (o.t0 == null) o.t0 = S.t;
  // a day with nothing to sail waits for the next: the reasons are the day's own
  if (!day.steps.some(s => ['sett', 'trekk', 'juks', 'vent', 'lever', 'agn'].includes(s.k) || (s.k === 'hjem' && !plan2Here(o).port))){
    const why = day.skipped.map(x => x.no).join('; ') || day.why[0], whyEn = day.skipped.map(x => x.en).join('; ') || day.why[1];
    o.run.i = day.steps.length; plan2Wait(o, 'idle', 'Ikke noe å gjøre i dag: ' + why + '.', 'Nothing to do today: ' + whyEn + '.', day.idleUntil != null ? day.idleUntil : plan2NextDep(o, H + 0.5, H + 0.5)); return;   // (the snow crab's day says when, H3c)
  }
  o.hold = 0; plan2Decide(o, H);
}
// the day's costs (diesel, bait, baiting, the crew's shares are in the landing) go to its date
function plan2CostDay(o, r){ const d = gDate(r.t0).toISOString().slice(0, 10), D = plan2StatDay(o, d), c = Math.max(0, Math.round(S.stats.costs - (r.cost0 || S.stats.costs))); D.cost += c; const M = o.stats.sum; M.cost = (Number.isFinite(M.cost) ? M.cost : o.stats.days.reduce((a, x) => a + (x.cost || 0), 0) - c) + c; }   // (a sum started as {fuel, bait, egn} by plan2New: made again from the days kept)
// what a trip caught, landed or kept aboard: the statistics count the catch on the day she comes in, not only the landings (a plan
// that lands when the hold is full, shows the days fished before the first landing)
function plan2Caught(o, tr){ if (!tr || tr.kg0 == null) return; const kg = Math.round(holdTotal() - tr.kg0); if (kg <= 0) return; const D = plan2StatDay(o, gDate(S.t / 60).toISOString().slice(0, 10)); for (const X of [D, o.stats.sum]){ X.caught = (X.caught || 0) + kg; X.out = (X.out || 0) + 1; } }
function plan2StatDay(o, d){ let D = o.stats.days.find(x => x.d === d); if (!D){ D = {d, trips:0, kg:0, kr:0, lott:0, cost:0, conf:0, sp:{}, port:{}}; o.stats.days.push(D); while (o.stats.days.length > 60) o.stats.days.shift(); } return D; }
// ---- a trip: the steps from i0 to the next port call, as waypoints on the kept legs
function plan2Trip(o, D, i0){
  const here = plan2Here(o), kind = p2Kind(o), auto = !!D.auto, wps = [], need = [], pts = [here.p]; let prev = here.p, prevPort = here.port, h = 0, to = i0, kindK = 'fish', noJig = false, ended = false;
  // (a leg from a place at sea begins at the place itself: she has drifted off it while fishing, and the kept leg is safe from the place, not from wherever she lies)
  const leg = (p, port) => { let L = drLeg(o, prev, prevPort, p, port);
    // (from where she lies at sea with no kept leg (the ocean vessel's day is laid where her last string ended, kilometres off the place,
    // H2c): straight over open water to the nearest place with a kept leg on, rather than a search out there)
    if (!L && !prevPort && auto){ const via = o.places.map(q => ({q, d:dist(q, prev)})).sort((x, y) => x.d - y.d).find(x => { if (!drLeg(o, x.q, null, p, port)) return false; try { return !groundCheck(prev, x.q); } catch (e){ return false; } });
      if (via){ if (wps.length) wps.push({x:prev.x, y:prev.y, port:null, fish:0, leia:true}); const h0 = drH(dist(prev, via.q)); prev = {x:via.q.x, y:via.q.y}; prevPort = null; L = drLeg(o, prev, null, p, port);
        wps.push({x:prev.x, y:prev.y, port:null, fish:0, leia:true}); for (const q of L.w) wps.push({x:q[0], y:q[1], port:null, fish:0, leia:true}); prev = p; prevPort = port || null; return h0 + L.h; } }
    if (!L){ need.push({a:prev, ap:prevPort, b:p, bp:port || null}); prev = p; prevPort = port || null; return 0; } if (!prevPort && wps.length) wps.push({x:prev.x, y:prev.y, port:null, fish:0, leia:true}); for (const q of L.w) wps.push({x:q[0], y:q[1], port:null, fish:0, leia:true}); prev = p; prevPort = port || null; return L.h; };
  const P = id => o.places.find(q => q.id === id), jn = new Set(D.steps.slice(i0).filter(s => s.k === 'juks' && s.pid).map(s => s.pid)).size; let jc = 0;
  // (the snow crab vessel, H3c: the strings of a field lie a kilometre or so apart round its point, so she goes among them in straight
  // hops, to the field by its kept leg and away from it by its point again; fieldAt is the field she is among the strings of)
  const sno = !!D.sno, vv = Math.max(1, BOAT.vcruise || 7); let fieldAt = null;
  if (sno && !here.port){ const f = o.places.filter(q => q.k === 'felt').map(q => ({q, d:dist(q, prev)})).sort((a, c) => a.d - c.d)[0]; if (f && f.d < DRP2.sno.near) fieldAt = f.q; }
  const hop = (q, p) => { let hh = 0; if (!fieldAt || fieldAt.id !== q.id){ hh += leave(); hh += leg(q); fieldAt = q; } hh += kmTrue(prev, p) / (vv * NM); if (dist(prev, p) > 0.01) wps.push({x:prev.x, y:prev.y, port:null, fish:0, leia:true}); prev = {x:p.x, y:p.y}; prevPort = null; pts.push(p); return hh; };
  const leave = () => { if (!sno || !fieldAt) return 0; const c = {x:fieldAt.x, y:fieldAt.y}; let hh = 0; if (dist(prev, c) > 0.01){ wps.push({x:prev.x, y:prev.y, port:null, fish:0, leia:true}); hh = kmTrue(prev, c) / (vv * NM); prev = c; prevPort = null; } fieldAt = null; return hh; };
  const snoAt = s => { const x = s.fid ? mySets().find(z => z.fid === s.fid) : null; return x ? {x:x.a.x, y:x.a.y} : s.ln != null && P(s.pid) ? p2SnoLenke(P(s.pid), s.ln).a : null; };
  for (let i = i0; i < D.steps.length && !ended; i++){
    const s = D.steps[i]; to = i;
    if (sno && (s.k === 'sett' || s.k === 'trekk' || s.k === 'vent') && s.ln !== undefined){
      const q = P(s.pid) || o.places.find(z => z.k === 'felt'), pv = D.steps[i - 1];
      if (s.k === 'sett' && pv && pv.k === 'trekk' && pv.pid === s.pid && pv.ln === s.ln) continue;   // (set out again by the haul)
      const L = s.k === 'sett' && s.ln != null ? p2SnoLenke(q, s.ln) : null, p = L ? L.a : snoAt(s); if (!p || !q) continue;
      h += hop(q, p);
      if (s.k === 'sett'){ wps.push({x:p.x, y:p.y, port:null, fish:0, act:{op:'cycle', kind, n:s.n, fid:L.fid, final:true, only:'set', spec:null, hdg:L.hdg}}); h += s.h; }
      else if (s.k === 'trekk'){ wps.push({x:p.x, y:p.y, port:null, fish:0, act:{op:'cycle', kind, n:s.n, fid:s.fid, final:!s.reset, only:'haul', due:s.due != null ? s.due : s.t}}); h += s.h; }
      else { wps.push({x:p.x, y:p.y, port:null, fish:Math.max(0.1, Math.round((s.until - s.t) * 10) / 10)}); noJig = true; h += s.until - s.t; }
      continue;
    }
    if (sno && (s.k === 'lever' || s.k === 'agn' || s.k === 'hjem')) h += leave();
    if (s.k === 'sett'){ const q = P(s.pid), pv = D.steps[i - 1]; if (pv && pv.k === 'trekk' && pv.pid === s.pid && (kind !== 'line' || s.again)) continue;   // nets, pots and the autoline are set again by the haul
      h += leg(q); pts.push(q); wps.push({x:q.x, y:q.y, port:null, fish:0, act:{op:'cycle', kind, n:s.n, fid:s.pid, final:true, only:'set', spec:kind === 'line' ? {lk:s.lk || q.lk || 'hyse'} : null, hdg:q.hdg != null ? q.hdg : null}}); h += s.h; }
    else if (s.k === 'trekk'){ const q = P(s.pid); h += leg(q); pts.push(q);
      if (s.wait > 1 / 60){ wps.push({x:q.x, y:q.y, port:null, fish:Math.max(0.1, Math.round(s.wait * 10) / 10)}); if (!p2Jig(o)) noJig = true; h += s.wait; }   // she is there before the soak is up: jigs (or waits) by the gear until then
      wps.push({x:q.x, y:q.y, port:null, fish:0, act:{op:'cycle', kind, n:s.n, fid:s.pid, final:!(s.reset && (kind !== 'line' || s.lk === 'auto')), only:'haul', due:s.due != null ? s.due : s.t}}); h += s.h; }
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
  // (the ocean vessel's day ends at sea, by her gear: the next is laid from there, planDayAuto)
  if (!last.port && !last.anchor && !auto){ if (o.rhythm === 'watch'){ const M = plan2P(o, 'M'); h += leg(M, o.M); wps.push({x:M.x, y:M.y, port:o.M, fish:0}); } else { const Hp = plan2P(o, 'H'), hp = plan2Port(o, 'H'); h += leg(Hp, hp); wps.push(hp ? {x:Hp.x, y:Hp.y, port:hp, fish:0} : {x:Hp.x, y:Hp.y, port:null, fish:0, anchor:true}); } if (need.length) return {need}; }
  return {wps, h, pts, to, kind:kindK, noJig};
}
// she is free and the step is a trip: the crew, the yard, the rules, the rig, the way and the weather, then off
function plan2Go(o, H, i0){
  const r = o.run, D = r.day, b = S.boat;
  const cw = plan2CrewWhy(o); if (cw){ if (cw.wait) plan2Wait(o, cw.k, cw.no, cw.en, H + 1); else plan2Stop(o, cw.k, cw.no, cw.en, cw.fix); return; }
  if (S.jobs && S.jobs.length){ const until = Math.max(H + 5 / 60, (jobsDone() || S.t) / 60 + 1 / 60); plan2Wait(o, 'jobs', jobsCrewOnly() ? 'Mannskapet gjør ferdig arbeidet på kaia. Går kl. ' + driftClock(driftHod(until)) + '.' : 'Verkstedet jobber på båten, så den venter.', jobsCrewOnly() ? 'The crew finish the work at the quay. Leaving at ' + driftClock(driftHod(until)) + '.' : 'The yard is working on the boat, so she waits.', until); return; }
  if (!p2Sno(o)){ const st = plan2RulesWhy(o, H); if (st){   // (the snow crab's day keeps the season and the rules itself: a string held by the ice must still come in, H3c)
      if (st.k === 'closed'){ const at = plan2RulesOpenAt(o, H); if (at != null){ const d = gDate(at); plan2Wait(o, 'closed', st.no + ' Planen venter til ' + d.getUTCDate() + '.' + (d.getUTCMonth() + 1) + '.', st.en + ' The plan waits until ' + d.getUTCDate() + '.' + (d.getUTCMonth() + 1) + '.', Math.min(at, H + 24)); return; } }
      plan2Stop(o, st.k, st.no, st.en, st.fix); return; } }
  // the day was laid for an earlier departure (the weather, the quay): it is made again from now, so the soak and the hours are right
  if (i0 === 1 && D.t0 < H - 0.5 && !r.remade){ r.remade = true; return plan2NewDay(o, H); }
  // with you aboard the day needs your energy: 15 % left when she is home, at 4.2 % an hour (15-energy.js ENERGY.sea)
  if (i0 === 1 && meAboard() && S.energy != null){ const seaH = D.home != null ? D.home - D.t0 : DRP2.watch, need = Math.min(100, DRP2.enMin + DRP2.enH * seaH);   // (round the clock: your watch, you sleep in the bunk the other)
    if (S.energy < need - 0.5){ const here = plan2Here(o), rate = resting() ? restRate(b) * 60 : Math.max(restRate(b) * 60, b.anch ? p2MeRate(null, true) : p2MeRate(here.port)), hours = rate > 0 ? (need - S.energy) / rate : null;   // (you go in to rest by yourself, plan2MeRest)
      if (hours == null && here.port && isRorbu(here.port) && spendable() < RORBU.kr){ plan2Wait(o, 'energy', 'Du har ' + Math.round(S.energy) + ' % energi og trenger ' + Math.round(need) + ' % til dagen, men ikke ' + kr(RORBU.kr) + ' til en natt på rorbua. Planen venter til du har pengene.', 'You have ' + Math.round(S.energy) + ' % energy and need ' + Math.round(need) + ' % for the day, but not ' + kr(RORBU.kr) + ' for a night at the rorbu. The plan waits until you have the money.', H + 1); return; }
      if (hours == null){ plan2Wait(o, 'energy', 'Du har ' + Math.round(S.energy) + ' % energi og trenger ' + Math.round(need) + ' % til dagen. Hvil i naustet, på en rorbu eller i køya først.', 'You have ' + Math.round(S.energy) + ' % energy and need ' + Math.round(need) + ' % for the day. Rest in the boathouse, at a rorbu or in the bunk first.', H + 1); return; }
      const at = H + hours; plan2Wait(o, 'energy', 'Du må hvile til kl. ' + driftClock(driftHod(at)) + ' før dagen kan begynne (' + Math.round(S.energy) + ' % energi, dagen trenger ' + Math.round(need) + ' %).', 'You must rest until ' + driftClock(driftHod(at)) + ' before the day can begin (' + Math.round(S.energy) + ' % energy, the day needs ' + Math.round(need) + ' %).', at); return; } }
  if (rigOf() !== o.rig){ const why = rigSet(o.rig); if (why){ plan2Stop(o, 'rig', 'kan ikke rigge om til ' + rigName(o.rig).toLowerCase() + ': ' + why[0], 'cannot re-rig for ' + rigName(o.rig).toLowerCase() + ': ' + why[0], 'rig'); return; } }
  const T = plan2Trip(o, D, i0);
  if (!T){ r.i = D.steps.length; return plan2Boundary(o, H); }
  if (T.need){ plan2Wait(o, 'route', 'Finner veien …', 'Finding the way …', H + 10 / 60); drFetch(o, T.need); return; }
  // the ocean vessel (H2c): out of port in anything under her lying-to limits (the grounds are many hours off); at sea the gear is worked
  // only under the plan's working limits at the places of the coming hours, else she waits by the gear, hour by hour
  if (D.auto){ const h0 = plan2Here(o), atSea = !h0.port, wx = atSea ? plan2WxAhead(o, H, Math.min(Math.max(1, T.h), 3), T.pts) : plan2WxAhead(o, H, 2, [h0.p], {wind:windLim(), hs:seaLim()});
    if (!wx.ok){ plan2WorkWait(o, H, wx, atSea ? T.pts : [h0.p], !atSea); return; } }
  // (she goes out on the next hours' forecast, DRP2.fcH; a gale later in the day sends her to shelter when it comes, plan2Shelter)
  const wx = D.auto ? {ok:true} : plan2WxAhead(o, H, Math.min(Math.max(1, T.h), DRP2.fcH), T.pts);
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
  if (S.rest && S.rest.w === 'koye' && o.rhythm !== 'watch') restEnd();   // up from the bunk at anchor (ashore the departure ends the rest, depart)
  S.plan = {wps:T.wps, idx:0, speed:BOAT.vmax, full:true, returning:false, depAt:null, ops:true, opsK:T.kind, unsafe:[], noJig:!!T.noJig, p2:{from:i0, to:T.to, start:{x:here.p.x, y:here.p.y, port:here.port}}};
  r.trip = {from:i0, to:T.to, t0:S.t, kg0:holdTotal(), anchor:!!T.wps[T.wps.length - 1].anchor}; r.wait = null; o.hold = 0; o.stop = null;
  if (T.kind === 'home') log('Går hjem til ' + (portById(o.home) || {name:'?'}).name + (o.homeA && T.wps[T.wps.length - 1].anchor ? ' og legger seg til ankers' : '') + '.', 'Going home to ' + (portById(o.home) || {name:'?'}).name + (o.homeA && T.wps[T.wps.length - 1].anchor ? ' to lie at anchor' : '') + '.');
  else if (T.kind === 'land') log('Går til ' + (portById(o.M) || {name:'mottaket'}).name + ' for å levere.', 'Going to ' + (portById(o.M) || {name:'the plant'}).name + ' to land.');
  else if (T.kind === 'rest') log('Går for å hvile om bord.', 'Going to rest aboard.');
  else if (!(D.auto && !here.port)) log(meAboard() ? 'Gikk ut på driftsplanen med deg som skipper.' : (p2SkName() || '?') + ' gikk ut på driftsplanen.', meAboard() ? 'Went out on the plan with you as skipper.' : (p2SkName() || '?') + ' went out on the plan.');
  // (depart defers the departure itself while the quay is busy, S.plan.depAt; 05-vessels.js casts off then)
  if (!depart() && !(S.plan && S.plan.depAt)){ S.plan = null; r.trip = null; plan2Wait(o, 'cant', 'Båten kom ikke av sted. Prøver igjen om en halv time.', 'The boat could not leave. Trying again in half an hour.', H + 0.5); }
}
// out on a trip: the soak is kept (a haul never starts before its hour), and a hold that fills lands before the day is over
function plan2Sea(o, H){
  const b = S.boat, pl = S.plan; if (!pl || !pl.p2) return;
  if (pl.opsK === 'fish' && !pl.cut && !pl.returning && o.rhythm !== 'watch'){ if (meAboard() && S.energy != null && S.energy <= DRP2.enMin) plan2Cut(o, 'energy'); else if (drTired()) plan2Cut(o, 'tired'); }   // (round the clock: the watches rest, you in the bunk, plan2WatchTick)
  const nx = pl.wps[pl.idx];
  // (the jig before a haul ends when the soak is up, whether she came to the grounds early or late: the haul starts at its hour)
  if (nx && nx.act && nx.act.due && b.status === 'fishing' && b.fishUntil != null && !b.gop && !b.deckStop){ const legMin = kmTrue(b.pos, nx) / (Math.max(1, BOAT.vcruise || 7) * NM) * 60; const at = Math.max(S.t, Math.round(nx.act.due * 60 - legMin + 6)); if (Math.abs(b.fishUntil - at) > 2) b.fishUntil = at; }   // (six minutes to spare: she is never early)
  const auto = !!(o.run && o.run.day && o.run.day.auto);
  if (auto && !pl.returning){
    // the ocean vessel's gear in the weather (H2c): over the plan's working limit where she is, the haul or the set in hand stops with what
    // is over the side (the rest stands, gopAbort) and she waits by the gear; the way to the plant goes on (over her own limits she lies to)
    const W = windAt(H, b.pos), hs = hsAt(b.pos, H), over = W > o.wx.wind || hs > Math.min(o.wx.hs, seaLim());
    const work = !!b.gop || (nx && nx.act && dist(b.pos, nx) < 1) || (b.status === 'fishing' && pl.wps.slice(pl.idx).some(w => w.act));
    if (over && work){ plan2WorkStop(o, H, W, hs); return; }
    // (the snow crab vessel, H3c: the tanks of a live trip or the hold full between two hauls: the strings stand, and the day is laid
    // again from where she lies, which is the way to the plant, planDaySno)
    if (o.run.day.sno){ if (!b.gop && pl.wps.slice(pl.idx).some(w => w.act) && (holdLoad() >= DRP2.sno.full * capHold() || (snoLive() && tankCap() > 0 && tankLoad() >= DRP2.sno.tank * tankCap()))){
        const tr = o.run.trip; if (tr) plan2Caught(o, tr); plan2Abort(o); b.status = 'idle'; b.v = 0; o.run.replan = true;
        log(snoLive() && tankLoad() >= DRP2.sno.tank * tankCap() ? 'Tankene er fulle (' + fmt(tankLoad() / 1000, 1) + ' t levende krabbe). Lenkene står, og skipet går til mottaket.' : 'Lasten er full. Lenkene står, og skipet går til mottaket.', snoLive() && tankLoad() >= DRP2.sno.tank * tankCap() ? 'The tanks are full (' + (tankLoad() / 1000).toFixed(1) + ' t of live crab). The strings stand, and the ship goes to the plant.' : 'The hold is full. The strings stand, and the ship goes to the plant.'); }
      return; }
    // the hold at DRP2.hav.full: nothing more is set, the lenker standing are hauled home to the magazines, and the next day is the way to
    // the plant (planDayAuto). A haul in hand finishes without setting again
    if (!pl.full && holdLoad() >= DRP2.hav.full * capHold() && (b.gop || pl.wps.slice(pl.idx).some(w => w.act))){
      pl.full = true; if (b.gop && b.gop.op === 'haul') b.gop.reset = false;
      const rest = pl.wps.slice(pl.idx).filter(w => !(w.act && w.act.only === 'set')).map(w => w.act ? Object.assign({}, w, {act:Object.assign({}, w.act, {final:true})}) : w);
      pl.wps = pl.wps.slice(0, pl.idx).concat(rest); if (pl.unsafe) pl.unsafe = pl.unsafe.slice(0, pl.idx).concat(rest.map(() => false));
      log('Lasten er ' + Math.round(100 * holdLoad() / capHold()) + ' % full. Trekker det som står inn på magasinene, så går skipet til ' + (portById(o.M) || {name:'mottaket'}).name + '.', 'The hold is ' + Math.round(100 * holdLoad() / capHold()) + ' % full. Hauling what stands back to the magazines, then the ship goes to ' + (portById(o.M) || {name:'the plant'}).name + '.');
    }
    return;
  }
  // the hold over the limit on a trip that would not land: the rest of the trip is the way to the plant
  if (!pl.full && pl.opsK === 'fish' && o.land && o.land.when !== 'trip' && holdLoad() >= DRP2.full * capHold() && !pl.wps.slice(pl.idx).some(w => w.port === o.M)){
    const M = plan2P(o, 'M'); if (!M) return;
    let from = null, fp = null; for (let i = pl.idx - 1; i >= 0; i--){ const w = pl.wps[i]; if (w.act || w.fish > 0 || w.jc){ from = {x:w.x, y:w.y}; break; } }
    const L = from ? drLeg(o, from, null, M, o.M) : null; if (!L) return;
    pl.full = true; if (b.status === 'fishing' && !b.gop) b.fishUntil = S.t;
    pl.wps.splice(pl.idx); if (pl.unsafe) pl.unsafe.splice(pl.idx);
    if (dist(b.pos, from) > 0.05) pl.wps.push({x:from.x, y:from.y, port:null, fish:0, leia:true});
    for (const q of L.w) pl.wps.push({x:q[0], y:q[1], port:null, fish:0, leia:true});
    pl.wps.push({x:M.x, y:M.y, port:o.M, fish:0}); pl.opsK = 'fish';
    log('Lasten er ' + Math.round(100 * holdLoad() / capHold()) + ' % full. Går til ' + (portById(o.M) || {name:'mottaket'}).name + ' for å levere.', 'The hold is ' + Math.round(100 * holdLoad() / capHold()) + ' % full. Going to ' + (portById(o.M) || {name:'the plant'}).name + ' to land.');
  }
}
// the ocean vessel stops working the gear in the weather (H2c, plan2Sea): what the trip caught is counted, the haul or set in hand stops
// (gopAbort: the rest stands in the sea), the trip is cut where she is, and she waits by the gear for the weather (plan2WorkWait)
function plan2WorkStop(o, H, W, hs){
  const b = S.boat, tr = o.run && o.run.trip, g = b.gop; if (tr) plan2Caught(o, tr);
  const what = g ? (g.op === 'haul' ? ['Stopper draget, og resten av lenka står i sjøen', 'Stops the haul, and the rest of the string stands in the sea'] : ['Stopper settingen', 'Stops the set']) : ['Venter med redskapet', 'Holds off the gear'];
  plan2Abort(o); b.status = 'idle'; b.v = 0;
  const why = W > o.wx.wind ? ['Vinden er ' + fmt(W, 0) + ' m/s, over grensen for arbeidet (' + o.wx.wind + ' m/s)', 'The wind is ' + fmt(W, 0) + ' m/s, over the working limit (' + o.wx.wind + ' m/s)'] : ['Sjøen er ' + fmt(hs, 1) + ' m, over grensen for arbeidet (' + fmt(o.wx.hs, 1) + ' m)', 'The sea is ' + fmt(hs, 1) + ' m, over the working limit (' + fmt(o.wx.hs, 1) + ' m)'];
  log(why[0] + '. ' + what[0] + '.', why[1] + '. ' + what[1] + '.');
  plan2WorkWait(o, H, plan2WxAhead(o, H, 2, [{x:b.pos.x, y:b.pos.y}]), [{x:b.pos.x, y:b.pos.y}], false);
}
// the ocean vessel waits for the weather (H2c): at sea by her gear (lying to over her own limits, 05-vessels.js), or in port over those
// limits; tried again at the first hour within DRP2.hav.look the forecast allows, else in three hours. The day is laid anew then, from
// where she lies, so the soak and the hauls are right
function plan2WorkWait(o, H, wx, pts, port){
  const L = port ? {wind:windLim(), hs:seaLim()} : null; let at = null;
  for (let k = 1; k <= DRP2.hav.look; k++) if (plan2WxAhead(o, H + k, 2, pts, L).ok){ at = H + k; break; }
  const until = at != null ? at : H + 3, lim = port ? ['for å gå ut', 'for going out'] : ['for arbeidet', 'for the work'];
  const why = wx.w > wx.wind ? ['vinden er ' + fmt(wx.w, 0) + ' m/s, og grensen ' + lim[0] + ' er ' + fmt(wx.wind, 0) + ' m/s', 'the wind is ' + fmt(wx.w, 0) + ' m/s, and the limit ' + lim[1] + ' is ' + fmt(wx.wind, 0) + ' m/s']
    : ['sjøen er ' + fmt(wx.h, 1) + ' m, og grensen ' + lim[0] + ' er ' + fmt(wx.lim, 1) + ' m', 'the sea is ' + fmt(wx.h, 1) + ' m, and the limit ' + lim[1] + ' is ' + fmt(wx.lim, 1) + ' m'];
  const c = driftClock(driftHod(until)), more = until - H > 20 ? [' i morgen', ' tomorrow'] : ['', ''];
  plan2Wait(o, 'wx', (port ? 'Venter i havn på været: ' : 'Venter ved redskapet på været: ') + why[0] + '. ' + (at != null ? 'Går igjen kl. ' : 'Ser på det igjen kl. ') + c + more[0] + '.', (port ? 'Waiting in port for the weather: ' : 'Waiting by the gear for the weather: ') + why[1] + '. ' + (at != null ? 'Going again at ' : 'Looking again at ') + c + more[1] + '.', until);
  if (o.run) o.run.replan = true;
}
// she has come in (05-vessels.js dock, through opsLanded): the port call's own step runs next, and a port that is not the step's means the day is made again from here
function plan2Landed(pid, k){
  const o = plan2Ops(); if (!o || !o.run) return; const r = o.run, tr = r.trip; r.trip = null;
  if (tr) r.i = tr.to;
  plan2Caught(o, tr);
  const s = r.day && r.day.steps[r.i], want = s ? (s.k === 'lever' || s.k === 'agn' ? o.M : s.k === 'hjem' ? o.home : s.k === 'hvile' && s.where === 'kai' ? o.M : null) : null;
  if (!s || (want && want !== pid)) r.replan = true;
  o.hold = 0;
}
// the landing note is in (07-harbours.js finishLanding through opsReport): the statistics, the report, and the day steps on
function plan2Report(pid, kg, total, landed){
  const o = plan2Ops(); if (!o) return; const port = portById(pid), sale = (S.sales || [])[S.sales.length - 1], L = S.lastSale || {};
  autoRestock();
  const sk = p2SkName();
  if (landed){
    const d = gDate(S.t / 60).toISOString().slice(0, 10), D = plan2StatDay(o, d), M = o.stats.sum, lott = L.t === S.t ? (L.lott || 0) : 0, conf = L.t === S.t ? Math.round(L.confKg || 0) : 0;
    for (const X of [D, M]){ X.trips++; X.kg += Math.round(kg); X.kr += Math.round(total); X.lott += Math.round(lott); X.conf += conf; X.port[pid] = (X.port[pid] || 0) + Math.round(kg); if (sale && sale.t === S.t) for (const [sp, k] of sale.sp || []) X.sp[sp] = (X.sp[sp] || 0) + k; }
    msg(sk || gL('Driftsplan', 'Operations plan'), 'Driftsrapport: ' + fmt(kg, 0) + ' kg levert i ' + port.name + ', ' + kr(Math.round(total)) + ' etter lott' + (conf ? ', ' + conf + ' kg inndratt' : '') + '.', 'Operations report: ' + fmt(kg, 0) + ' kg landed at ' + port.name + ', ' + kr(Math.round(total)) + ' after shares' + (conf ? ', ' + conf + ' kg confiscated' : '') + '.');
  }
  const r = o.run; if (r && r.day && r.day.steps[r.i] && r.day.steps[r.i].k === 'lever'){ r.i++; r.wait = null; o.hold = 0; }
}
// bait at the plant: for the pots aboard, and for the tubs the crew bait at home (buyGear asks buyGate and the plant)
function plan2Bait(o, s){
  const pg = S.pgear, kind = p2Kind(o); if (!pg || !kind) return;
  // the autoline (H2c): the trip's bait, as the autoline fleet baits, half squid (akkar, blekksprut) and half saury (HI report 24-2013)
  // (the snow crab vessel, H3c: akkar, half a kilo a pot, by the tonne)
  if (p2Sno(o)){ const kg = Math.ceil((s && s.kg) || 0); if (kg < 1) return; const c0 = S.cash, why = buyGear('bait', 'blekksprut', kg);
    if (why) log('Fikk ikke kjøpt agn: ' + why[0], 'Could not buy bait: ' + (why[1] || why[0])); else log('Kjøpte ' + fmt(kg / 1000, 1) + ' t akkar til teinene for ' + kr(Math.round(c0 - S.cash)) + '.', 'Bought ' + (kg / 1000).toFixed(1) + ' t of squid for the pots for ' + kr(Math.round(c0 - S.cash)) + '.'); return; }
  if (p2Auto(o)){ const kg = Math.ceil((s && s.kg) || 0); if (kg < 1) return; const c0 = S.cash, half = Math.ceil(kg / 2), got = [];
    for (const [k, n] of [['blekksprut', half], ['saury', kg - half]]){ if (n < 1) continue; const why = buyGear('bait', k, n); if (why) log('Fikk ikke kjøpt agn: ' + why[0], 'Could not buy bait: ' + why[0]); else got.push(n + ' kg ' + BAITS[k].no.toLowerCase()); }
    if (got.length) log('Kjøpte agn for turen: ' + got.join(' og ') + ' for ' + kr(Math.round(c0 - S.cash)) + '.', 'Bought bait for the trip: ' + kg + ' kg for ' + kr(Math.round(c0 - S.cash)) + '.'); return; }
  const k = BAITS[pg.baitPref] ? pg.baitPref : 'makrell', have = baitOf(pg)[k] || 0;
  const potsSea = mySets().filter(x => x.kind === 'teine').reduce((a, x) => a + x.n, 0);
  const need = kind === 'teine' ? (potsAboard(pg) + potsSea) * potBaitKg(potK()) * 2 - have : kind === 'line' ? ((pg.lines.hyse.n - pg.lines.hyse.baited) * LINE_KINDS.hyse.baitKg + (pg.lines.bank.n - pg.lines.bank.baited) * LINE_KINDS.bank.baitKg) - have : 0;
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
  const o = plan2Ops(), me = meAboard(), on = !!o && o.on && o.rhythm === 'watch' && (S.crew.length + (me ? 1 : 0) >= 4 || p2Lag());   // (an ocean vessel's teams, H2c)
  if (!on){ for (const c of S.crew) if (c.sleepW) delete c.sleepW; return; }
  // you keep the day watch (06-18) and sleep in the bunk the night watch (Jonas 26.10.2026); the bunk is the game's own (15-energy.js restStart)
  if (me && S.boat.status !== 'port' && S.plan && S.plan.ops){ const mine = plan2Watch(H).w === 'A', r = o.run || (o.run = {});
    // out of energy on your own watch: six hours in the bunk, the mate has the deck (said once)
    if (mine && S.energy != null && S.energy <= DRP2.enMin && !resting() && restWhere(S.boat) === 'koye' && !S.sleep){ r.nap = H + 6; restStart(); plan2Say(o, 'Du er tom for energi midt i vakta og går i køya seks timer. Styrmannen har dekket.', 'You are out of energy in your watch and take six hours in the bunk. The mate has the deck.'); }
    else if (!mine && !resting() && restWhere(S.boat) === 'koye' && !S.sleep) restStart();
    else if (mine && resting() && S.rest && S.rest.w === 'koye' && !(r.nap && H < r.nap)){ r.nap = null; restEnd(); } }
  const sk = meAboard() ? null : crewSkipper(), m0 = crewMate(), mate = m0 && m0 !== sk ? m0 : S.crew.find(c => c !== sk) || null, deck = S.crew.filter(c => c !== sk && c !== mate);
  const A = [sk].filter(Boolean).concat(deck.filter((c, i) => i % 2 === 0)), B = [mate].filter(Boolean).concat(deck.filter((c, i) => i % 2 === 1)), off = plan2Watch(H).w === 'A' ? B : A;
  for (const c of S.crew){ if (off.includes(c)) c.sleepW = true; else delete c.sleepW; }
}
