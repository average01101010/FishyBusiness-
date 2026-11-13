// ---------- the shared world V3: the other players' boats (05.10.2026; supabase/migrations/20261005220000_presence.sql) ----------
// Jonas: «fokuset nå må være å få koblet sammen spillerne i verden med felles tid … Dette er nesten et mmorpg spill». Every 15 s while
// the game is open, seen and signed in, where the boat you follow is goes up (her place, heading, speed, what she does, her name and
// type, and your sea time), and the other players' boats, all of them whatever the distance (08.10.2026), come down into PEERS (core/05-vessels.js
// peerStates), which the chart's AIS and the 3D view show like the other boats on the water, with the owner's player name and sea time.
// There is no hiding the boat (Jonas 07.10.2026: «Det skal ikke være mulig å skjule båten sin posisjon for andre spillere, det er et
// krav»); a guest's boat is left out for the others by the server (supabase/migrations/20261007130000_seen.sql).
// Without the database function (before the migration) or offline, nothing goes, and the boats heard last go after a minute.
const WORLDP = {last:0, busy:false, err:0, off:false};
const WORLD_R = 25;   // km round the boat: about the AIS range
// what the others' prediction of this boat rests on: her state, her route and the leg she is on, rounded speed. When it changes (she sets
// off, stops, gets a new route, changes speed), the position goes up at once instead of at the next 15 s tick (at most every 3 s), so
// the others' games are told of a turn or a stop as soon as it is made, not up to 15 s later (worldStart checks it every second)
function worldSig(){ const b = S && S.boat; if (!b) return ''; const pl = S.plan; return [b.status, Math.round((b.v || 0) * 2), pl ? pl.wps.length + ':' + pl.idx : '-', b.anch ? 'a' : ''].join('|'); }
async function worldTick(){
  if (!CLOUD.on || !CLOUD.user || WORLDP.busy || WORLDP.off || TAB.held || TAB.lost || TAB.wait || (typeof document !== 'undefined' && document.hidden)) return;   // (only the page that has the game shows the boat)
  WORLDP.busy = true;
  try {
    const b = S.boat;
    // the paint (vessel3d.js livStr) and the sea time (core/09e-fartstid.js) go along; a server without them yet (404) gets the
    // position without the newest first, then without the paint
    // where she is now, between the simulation's minutes (ui/04-panels-instruments.js livePose, the manoeuvring model's pose when it
    // has her): b.pos is the minute's place, up to a game minute (10 real seconds, some 250 m under way) behind, which the others saw as
    // a jump at every report
    let L = null; try { L = typeof livePose === 'function' ? livePose() : null; } catch (e){ L = null; }
    const lp = L && L.p && isFinite(L.p.x) && isFinite(L.p.y) && dist(L.p, b.pos) < 2 ? L.p : b.pos, lh = L && isFinite(L.hd) ? L.hd : b.heading || 0;
    const a = {x:+lp.x.toFixed(4), y:+lp.y.toFixed(4), hd:+(((lh % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)).toFixed(3),
      v:+(b.status === 'sailing' ? b.v || 0 : 0).toFixed(1), st:String(b.status || ''), boat:S.boatName || '', vtype:b.type || ''}, lv = livStr(b);
    if (lv && !WORLDP.noLiv) a.liv = lv;
    // the figures: the skipper's look and the first four hands' (core/09i-look.js; supabase/migrations/20261010140000_look.sql)
    if (!WORLDP.noLk && typeof lookKey === 'function'){ a.lk = lookKey(lookMe()); a.ck = crewAboard().slice(0, 4).map(c => lookKey(lookOf(c))).join(';'); }
    if (!WORLDP.noFs && typeof fsState === 'function') a.fs = Math.round(fsState().p);
    // the route ahead of her on the chart plotter, up to the first stop (core/05-vessels.js peerRouteStr), so the others work out where
    // she is from it (supabase/migrations/20261103120000_route.sql; a database without it, 404, gets the rest as before)
    if (!WORLDP.noRt) a.rt = b.status === 'sailing' && S.plan && a.v > 0.2 ? peerRouteStr(lp, S.plan.wps, L && L.idx != null ? L.idx : S.plan.idx) : '';
    WORLDP.sig = worldSig();
    for (;;){ try { await cloudRpc('pos_put', a); WORLDP.put = Date.now(); break; } catch (e){ if (!/ 404$/.test(e.message)) throw e;
      if ('rt' in a){ WORLDP.noRt = true; delete a.rt; } else if ('lk' in a){ WORLDP.noLk = true; delete a.lk; delete a.ck; } else if ('fs' in a){ WORLDP.noFs = true; delete a.fs; } else if ('liv' in a){ WORLDP.noLiv = true; delete a.liv; } else throw e; } }
    // every active player, whatever the distance (pos_world, supabase/migrations/20261008120000_pos_world.sql); the boats within WORLD_R
    // come with their paint. A database without it (404) gives the boats near by, as before.
    let list; if (!WORLDP.noAll){ try { list = await cloudRpc('pos_world', {x:b.pos.x, y:b.pos.y, r:WORLD_R}); } catch (e){ if (!/ 404$/.test(e.message)) throw e; WORLDP.noAll = true; } }
    if (!list && WORLDP.noAll) list = await cloudRpc('pos_near', {x:b.pos.x, y:b.pos.y, r:WORLD_R});
    list = list || []; const now = Date.now();
    PEERS.length = 0; for (const q of list) PEERS.push({...q, at:now - (q.age || 0) * 1000});
    WORLDP.last = now; WORLDP.err = 0;
    await gearSync(now);
  } catch (e){ if (/ 404$/.test(e.message)) WORLDP.off = true; if (++WORLDP.err > 3 || WORLDP.off) PEERS.length = 0; }
  finally { WORLDP.busy = false; }
}
// the sets standing in the sea (tilbakemelding #35: «slik at man ikke setter på tvers av hverandre»): this company's go up when they
// change and every five minutes (supabase/migrations/20261007200000_gear.sql: the kind and the two buoys, no name), and the other
// players' near the boat come down once a minute, or when the boat has gone 5 km. A database without it (404) is left alone.
const GEARP = {sig:'', put:0, got:0, at:null, off:false};
const GEAR_R = 30;
async function gearSync(now){
  if (GEARP.off || !S) return;
  try {
    const mine = (S.sets || []).filter(s => !s.lost && s.a && s.b).slice(0, 60).map(s => [String(s.id), s.kind, +s.a.x.toFixed(4), +s.a.y.toFixed(4), +s.b.x.toFixed(4), +s.b.y.toFixed(4)]), sig = JSON.stringify(mine);
    if (sig !== GEARP.sig || now - GEARP.put > 300000){ await cloudRpc('gear_put', {sets:mine}); GEARP.sig = sig; GEARP.put = now; }
    const b = S.boat;
    if (now - GEARP.got > 60000 || !GEARP.at || dist(GEARP.at, b.pos) > 5){
      // (gear_near2 with the owner's player name and boat, 20261102130000_gear_owner.sql; gear_near where that is not run yet)
      let list = null; if (!GEARP.old){ try { list = await cloudRpc('gear_near2', {x:b.pos.x, y:b.pos.y, r:GEAR_R}); } catch (e){ if (/ 404$/.test(e.message)) GEARP.old = true; else throw e; } }
      if (GEARP.old) list = await cloudRpc('gear_near', {x:b.pos.x, y:b.pos.y, r:GEAR_R});
      PEERGEAR.length = 0; for (const q of list || []) if (Array.isArray(q) && q.length >= 5) PEERGEAR.push({k:q[0], a:{x:q[1], y:q[2]}, b:{x:q[3], y:q[4]}, user:q[5] || '', boat:q[6] || ''});
      GEARP.got = now; GEARP.at = {x:b.pos.x, y:b.pos.y};
    }
  } catch (e){ if (/ 404$/.test(e.message)){ GEARP.off = true; PEERGEAR.length = 0; } }
}
// another player's uploaded logo (supabase/migrations/20261007110000_logos.sql logo_get): fetched once per player and version as she comes
// near, kept for the session (at most 40); one the admin has taken away comes back empty, and her boat goes without
const PLOGO = new Map();
function peerLogo(hid, ver){
  if (!hid || !ver || !CLOUD.on || !CLOUD.user) return null; let e = PLOGO.get(hid);
  if (e && e.ver === ver) return e.img;
  if (e && e.busy) return e.img;
  if (PLOGO.size >= 40) PLOGO.delete(PLOGO.keys().next().value);
  e = {ver, img:e ? e.img : null, busy:true}; PLOGO.set(hid, e);
  cloudRpc('logo_get', {hid}).then(r => { e.busy = false; e.ver = ver;
    if (r && /^data:image\//.test(r.img || '')){ const im = new Image(); im.src = r.img; e.img = im; } else e.img = null; }).catch(() => { e.busy = false; e.ver = ver; });
  return e.img;
}
// ---- the shared world V2 (05.10.2026; core/03-simulation.js WSH): one sea, one quota and one market. Every ten minutes, and soon
// after a sale, this game's sales and the cells its boats took fish from go up (S.wq), and what the other players have done comes
// down: their open-group cod this year, what they delivered to each plant in the last day, and the fish they took since the last
// time (the cursor S.wcur, kept in the save with the sea it was taken from). A sale the database refuses (400) is dropped, so one bad row
// does not hold the rest; offline, it all waits in the save.
// A function the database does not have (404: before a migration, or while a new game and an old database meet) only pauses the
// sharing for ten minutes: the sales and catches wait in the save and go when it is there (05.10.2026: a friend's sales stopped for the
// rest of his session while the leaderboard's migration was on its way)
const WSH2 = {busy:false, off:0, last:0};
async function worldShare(){
  if (!CLOUD.on || !CLOUD.user || WSH2.busy || Date.now() < WSH2.off || !S) return;
  WSH2.busy = true;
  try {
    const Q = wq();
    const sold = Q.l.length;
    while (Q.l.length){ try { await cloudRpc('land_put', Q.l[0]); } catch (e){ if (!/ 400$/.test(e.message)) throw e; } Q.l.shift(); }
    if (sold) for (const k in WTOP) WTOP[k].at = 0;   // the leaderboard is fetched again with them
    // the cells are taken out of the queue while they go, so fish taken meanwhile waits for the next time, and what did not go goes back
    const C = Q.c, cells = Object.entries(C).filter(([, kg]) => kg >= 0.05), gh = +(S.t / 60).toFixed(2); Q.c = {};
    try { for (let i = 0; i < cells.length; i += 500){ const part = cells.slice(i, i + 500);
        try { await cloudRpc('catch_put', {gh, cells:part.map(([k, kg]) => [+k, +kg.toFixed(2)])}); } catch (e){ if (!/ 400$/.test(e.message)) throw e; }
        for (const [k] of part) delete C[k]; } }
    finally { for (const k in C) if (C[k] >= 0.05) Q.c[k] = (Q.c[k] || 0) + C[k]; }
    const H = S.t / 60, y = yearH(H), r = await cloudRpc('world_get', {since:S.wcur || 0, y, gh:+H.toFixed(2)});
    if (r){ WSH.y = y; WSH.open = (r.open || 0) / 1000; WSH.boats = r.boats || 0; WSH.mH = H; WSH.mkt = {};
      // B4: the register, the open group's active players, the others' catch per group (kg) and the server's stock when it is on
      if (r.reg) WSH.reg = r.reg; WSH.openBoats = r.open_boats || 0; WSH.grp = r.grp || {}; TRKM.clear(); LOKC.forEach(c => { c.tH = -1; });   // the fleet's pressure gives way to the new catch at once
      const st = r.stock || null; if (JSON.stringify(st) !== JSON.stringify(WSH.stock || null)){ WSH.stock = st; for (const k in STKY) delete STKY[k]; for (const k in YQC) delete YQC[k]; TRK.ys = {}; DENT.H = NaN; }
      for (const [pid, sp, kg] of r.mkt || []) (WSH.mkt[pid] = WSH.mkt[pid] || {})[sp] = kg;
      for (const [k, kg] of r.cells || []) wshTake(k, kg);
      S.wcur = r.cur || S.wcur || 0; WSH2.last = Date.now(); }
  } catch (e){ if (/ 404$/.test(e.message)) WSH2.off = Date.now() + 600000; }
  finally { WSH2.busy = false; }
}
// ---- the leaderboards (05.10.2026; Salgslaget → Toppliste; supabase/migrations/20261006020000_toplist.sql): the players of the whole
// coast ranked by what they landed in the open or the closed group (grp) in a game week, under their boats' names, and in the closed
// group their companies'. Fetched when a list is shown, at most once a minute a list, and again after this game's sales have gone up;
// null without the cloud (the phone then shows the Senja fleet). ----
const WTOP = {};
function worldTop(w, grp){
  if (typeof CLOUD === 'undefined' || !CLOUD.on || !CLOUD.user) return null;
  grp = grp === 'lukket' ? 'lukket' : 'open';
  const key = w + '|' + grp, e = WTOP[key] || (WTOP[key] = {at:0, data:null, busy:false, err:false});
  if (!e.busy && Date.now() - e.at > 60000){
    e.busy = true;
    cloudRpc('world_top', {w, grp}).then(d => { e.data = d; e.err = false; }).catch(() => { e.err = true; })
      .finally(() => { e.busy = false; e.at = Date.now(); if (PHONE.isOpen() && (PHONE.app === 'salg' || PHONE.app === 'post')) PHONE.render(); });
  }
  return e;
}
// the village contest's board (bygde_top, 20261030170000_bygde.sql): the plants of each part of the coast ranked by what was landed in
// a game week, and the caller's own plant's place; fetched at most once a minute, the Sesong app and Kystposten drawn again when it comes
const BYTOP = {};
function bygdeTop(w){
  if (typeof CLOUD === 'undefined' || !CLOUD.on || !CLOUD.user || BYTOP.off) return null;
  const e = BYTOP[w] || (BYTOP[w] = {at:0, data:null, busy:false, err:false});
  if (!e.busy && Date.now() - e.at > 60000){
    e.busy = true;
    cloudRpc('bygde_top', {w}).then(d => { e.data = d; e.err = false; }).catch(x => { e.err = true; if (/ 404$/.test(x.message)) BYTOP.off = true; })
      .finally(() => { e.busy = false; e.at = Date.now(); if (PHONE.isOpen() && (PHONE.app === 'sesong' || PHONE.app === 'post')) PHONE.render(); });
  }
  return e;
}
// the shared event's board (ev_top, 20261030130000_season_ev.sql), fetched at most once a minute, the Sesong app drawn again when it comes;
// a server without it (404) is remembered and asked no more this session
const EVTOP = {};
function evTop(ev, y){
  if (typeof CLOUD === 'undefined' || !CLOUD.on || !CLOUD.user || EVTOP.off) return null;
  const key = ev + '|' + y, e = EVTOP[key] || (EVTOP[key] = {at:0, data:null, busy:false, err:false});
  if (!e.busy && Date.now() - e.at > 60000){
    e.busy = true;
    cloudRpc('ev_top', {ev, y}).then(d => { e.data = d; e.err = false; }).catch(x => { e.err = true; if (/ 404$/.test(x.message)) EVTOP.off = true; })
      .finally(() => { e.busy = false; e.at = Date.now(); if (PHONE.isOpen() && PHONE.app === 'sesong') PHONE.render(); });
  }
  return e;
}
// an event that has ended closes once its board has come (core/09c-seasons.js evClose); without the cloud, with no board
function evCloseTick(){
  const P = S.evPending; if (!P || !P.length || typeof evClose !== 'function') return;
  for (const q of P.slice()){ const e = EVENTS.find(x => x.id === q.id); if (!e){ S.evPending = P.filter(x => x !== q); continue; }
    const t = evTop(e.id, q.y); if (t && t.busy) continue;
    if (!t || t.err || t.data){ evClose(e, q.y, t && t.data ? t.data : null); S.evPending = S.evPending.filter(x => x !== q); } }
}
// ---- the race Lindesnes–Nordkapp in the cloud (KL3, steg 118; supabase/migrations/20261113200000_kapplop.sql, core/09o-kapplop.js) ----
// lopSync: the attempt under way and the ones finished or broken (S.lop.out) go up as they come: the cast-off (lop_start), each leg
// with its track in order (lop_leg, lopLegPut), and the end (lop_end). How far each has come is kept on it (cs: {s, n, e}), so a race
// sailed with the game closed or offline goes up in order the next time; the server checks each leg (the time, the track, a hop) and
// keeps a time that cannot have been sailed off the board without a word. An attempt from before the track (no trk) does not go. A
// server without the functions (404) is left alone for ten minutes, another error waits a minute, then longer.
const LOPS = {busy:false, off:0, next:0};
async function lopSync(){
  if (typeof CLOUD === 'undefined' || !CLOUD.on || !CLOUD.user || LOPS.busy || Date.now() < LOPS.off || Date.now() < LOPS.next || !S || !S.lop) return;
  if (TAB.held || TAB.lost || TAB.wait) return;   // (only the page that has the game sends)
  const L = S.lop, items = (L.out || []).slice(); if (L.run && L.run.t0 != null && L.run.trk) items.push(L.run);
  if (!items.length) return;
  LOPS.busy = true; let wait = 0;
  try {
    for (const R of items){
      // (over: ended, read off the attempt itself; it may end while this waits for the network, and then the copy in out shares cs)
      const cs = R.cs || (R.cs = {s:0, n:0, e:0}), over = R.st === 'done' || R.st === 'dnf';
      if (cs.at && Date.now() < cs.at) continue;
      try {
        if (!cs.s){ await cloudRpc('lop_start', {rid:lopRid(R), vtype:R.type, boat:R.name || '', t0:R.t0, vid:R.vid || ''}); cs.s = 1; }
        while (cs.n < (R.legs || []).length){ const a = lopLegPut(R, cs.n); if (!a) break; await cloudRpc('lop_leg', a); cs.n++; }
        if (over && !cs.e && cs.n >= (R.legs || []).length){
          await cloudRpc('lop_end', {rid:lopRid(R), st:R.st, how:R.how || '', t1:R.t1, min:+(+R.min || 0).toFixed(1)}); cs.e = 1;
          L.out = (L.out || []).filter(x => x.id !== R.id); for (const k in LTOP) if (LTOP[k] && typeof LTOP[k] === 'object') LTOP[k].at = 0; }
        cs.f = 0; delete cs.at;
      } catch (e){
        if (/ 404$/.test(e.message)){ LOPS.off = Date.now() + 600000; return; }
        if (!/ 400$/.test(e.message)){ wait = 60000; break; }   // (offline, the server busy: all of it again in a minute)
        // refused (400): the server may not have the attempt any more (a guest taken over by an account, a database restored), so it
        // goes from the start, a minute, then longer, later (the server takes a repeat with ok); a finished one it refuses five times
        // is let go, the one under way is kept
        cs.f = (cs.f || 0) + 1; cs.s = 0; cs.n = 0; cs.e = 0; cs.at = Date.now() + 60000 * Math.min(10, Math.pow(2, cs.f - 1));
        if (over && cs.f >= 5) L.out = (L.out || []).filter(x => x.id !== R.id);
      }
    }
  } finally { LOPS.busy = false; if (wait) LOPS.next = Date.now() + wait; }
}
// the week's board (lop_top): per class the top 20, how many and your place; fetched at most once a minute while it is shown, the
// Oppdrag app (the race's tab) and the Sesong app drawn again when it comes. null without the cloud; a server without it (404) is
// remembered and asked no more this session, and the tab shows your own time as before
const LTOP = {};
function lopTop(wk){
  if (typeof CLOUD === 'undefined' || !CLOUD.on || !CLOUD.user || LTOP.off) return null;
  const e = LTOP[wk] || (LTOP[wk] = {at:0, data:null, busy:false, err:false});
  if (!e.busy && Date.now() - e.at > 60000){
    e.busy = true;
    cloudRpc('lop_top', {wk}).then(d => { e.data = d; e.err = false; }).catch(x => { e.err = true; if (/ 404$/.test(x.message)) LTOP.off = true; })
      .finally(() => { e.busy = false; e.at = Date.now(); if (PHONE.isOpen() && (PHONE.app === 'ordl' || PHONE.app === 'sesong')) PHONE.render(); });
  }
  return e;
}
// ---- the real-time relay (Ø16, S2 in docs/planer/sanntid-posisjoner.md, 05.11.2026; Jonas «kjør på» 03.11.2026: «like smooth som når
// man spiller call of duty»). While the game is open, seen and signed in on detstorebla.no, a WebSocket to the relay on the same server
// (tools/server/rt/server.mjs behind Caddy, wss://detstorebla.no/rt) carries this boat's position up 5 times a second under way and once
// a second lying still (rtSend), and brings the other players' boats in the 10 km squares round her down as they come (rtRecv). They are
// drawn half a second behind the newest report, between two known reports (snapshot interpolation, RT_DELAY, rtPose), so they move as
// they moved, with no guessing. The way in is a ticket from the database (rt_ticket, supabase/migrations/20261105160000_rt_ticket.sql):
// 60 s, once, signed with a secret only the database and the relay know; a guest sees the others, but a guest's boat goes to no one, as
// in pos_world. Up goes the place, heading, speed, the boat's state and the time, 18 bytes: nothing of the player, never haill or money.
// Without the relay (no ticket, the server down, the page hidden, GitHub Pages, a test) everything is as before: pos_put and pos_world
// every 15 s and the track (PTRK in core/05-vessels.js) carry the boats, and a boat going from one to the other glides (RT_GLIDE).
const RT = {ws:null, st:'off', tries:0, next:0, off:null, offAt:0, sent:0, last:null, peers:new Map(), noFn:false, unknown:false, up:0, down:0};
const RT_DELAY = 500;    // ms: the others are drawn this far behind the newest report
const RT_STALE = 1500;   // ms past the newest report (at the drawn time) before her track goes back to the 15 s reports
const RT_MOVE = 200, RT_STILL = 1000;   // ms between reports under way and lying still
const RT_GLIDE = 2000;   // ms to glide from the 15 s track onto the relay's (half a second behind it: she slows by a quarter for a moment)
// the boat's state as one byte (tools/server/rt/server.mjs keeps 0–15)
const RT_ST = ['', 'sailing', 'fishing', 'port', 'idle', 'adrift', 'tow', 'ptow', 'aground', 'engine', 'unmooring'];
function rtUrl(){
  if (typeof location === 'undefined' || typeof WebSocket === 'undefined') return null;
  // a stand-in relay for the tests (tests/rttest.py), only on a local test server (as the seed, Ø6 funn 14)
  if (typeof window !== 'undefined' && window.DSB_RT && /^(127\.0\.0\.1|localhost|\[::1\])$/.test(location.hostname)) return String(window.DSB_RT);
  return location.protocol === 'https:' && CLOUD_CFG && (CLOUD_CFG.hosts || []).includes(location.hostname) ? 'wss://' + location.host + '/rt' : null;
}
// only the page that has the game, seen and signed in, talks to the relay (as worldTick)
function rtWant(){ return CLOUD.on && !!CLOUD.user && !RT.noFn && !WORLDP.off && !TAB.held && !TAB.lost && !TAB.wait && !(typeof document !== 'undefined' && document.hidden) && !!S && !!S.boat && !!rtUrl(); }
function rtTick(){
  const now = Date.now();
  if (RT.peers.size){ const p = performance.now(); for (const [id, R] of RT.peers) if (p - R.seen > 10000) RT.peers.delete(id); }
  if (!rtWant()){ if (RT.ws) rtClose(1000, 1000); return; }
  if (!RT.ws){ if (RT.st === 'off' && now >= RT.next) rtOpen(); return; }
  if (RT.st === 'open') rtSend(now);
}
// after a failure: 1, 2, 4 … 64 s (a half to one and a half of it, so the games do not all come back at once after a restart)
function rtRetry(ms){ RT.ws = null; RT.st = 'off'; RT.next = Date.now() + (ms || 1000 * Math.pow(2, Math.min(RT.tries++, 6)) * (0.5 + Math.random())); }
function rtClose(code, ms){ const ws = RT.ws; rtRetry(ms); try { if (ws) ws.close(code); } catch (e){} }
async function rtOpen(){
  RT.st = 'ticket';
  let t = null;
  // a database without rt_ticket (404) is not asked again this session; without the secret (400, 'rt off') again in ten minutes
  try { t = await cloudRpc('rt_ticket', {}); }
  catch (e){ if (/ 404$/.test(e.message)){ RT.noFn = true; rtRetry(); } else rtRetry(/ 4\d\d$/.test(e.message) ? 600000 : 0); return; }
  if (typeof t !== 'string' || !rtWant()){ rtRetry(); return; }
  let ws; try { ws = new WebSocket(rtUrl() + '?t=' + encodeURIComponent(t)); } catch (e){ rtRetry(); return; }
  ws.binaryType = 'arraybuffer'; RT.ws = ws; RT.st = 'connecting';
  ws.onopen = () => { if (RT.ws !== ws) return; RT.st = 'open'; RT.tries = 0; RT.last = null; RT.sent = 0; rtSend(Date.now()); };
  ws.onmessage = ev => { if (RT.ws === ws) rtRecv(ev.data); };
  // 4001: the same player opened the game on another page, which has it now; 4002: time for a new ticket; 1012: the relay restarts (a
  // new version), and the games come back spread over ten seconds, so the database is not asked for every ticket in the same second
  ws.onclose = ev => { if (RT.ws === ws) rtRetry(ev.code === 4001 ? 60000 : ev.code === 4002 ? 500 : ev.code === 1012 ? 1000 + Math.random() * 9000 : 0); };
  ws.onerror = () => {};
}
// this boat's report: where she is now (livePose, as worldTick sends), 5 times a second under way, once a second lying still
function rtSend(now){
  const ws = RT.ws, b = S.boat; if (!ws || ws.readyState !== 1 || !b || now - RT.sent < RT_MOVE - 30) return;
  let L = null; try { L = typeof livePose === 'function' ? livePose() : null; } catch (e){ L = null; }
  const p = L && L.p && isFinite(L.p.x) && isFinite(L.p.y) && dist(L.p, b.pos) < 2 ? L.p : b.pos, hd = ptAng(0, L && isFinite(L.hd) ? L.hd : b.heading || 0);
  const st = Math.max(0, RT_ST.indexOf(String(b.status || ''))), v = b.status === 'sailing' ? Math.max(0, Math.min(60, b.v || 0)) : 0;
  const o = RT.last, moved = !o || o.st !== st || Math.hypot(p.x - o.x, p.y - o.y) > 0.001;
  if (!(v > 0.2) && !moved && now - RT.sent < RT_STILL) return;
  const buf = new ArrayBuffer(18), d = new DataView(buf);
  d.setUint8(0, 1); d.setUint8(1, st); d.setUint16(2, Math.round(v * 100), true);
  d.setInt32(4, Math.round(p.x * 1e4), true); d.setInt32(8, Math.round(p.y * 1e4), true); d.setInt16(12, Math.round(hd * 1e4), true);
  d.setUint32(14, Math.floor(performance.now()) >>> 0, true);
  ws.send(buf); RT.sent = now; RT.last = {x:p.x, y:p.y, st}; RT.up++;
}
// the relay's clock against this page's steady clock: the largest offset seen is the report that came quickest, sinking 2 ms a second
function rtClock(T, p){ const o = T - p; RT.off = RT.off == null || o > RT.off || o < RT.off - 5000 ? o : Math.max(o, RT.off - (p - RT.offAt) * 0.002); RT.offAt = p; }
function rtRecv(data){
  if (!(data instanceof ArrayBuffer) || data.byteLength < 3) return;
  const d = new DataView(data), ty = d.getUint8(0), n = d.getUint16(1, true), p = performance.now();
  const hid = o => { let s = ''; for (let k = 0; k < 5; k++) s += d.getUint8(o + k).toString(16).padStart(2, '0'); return s; };
  if (ty === 0 && data.byteLength >= 12){ RT.off = null; rtClock(d.getFloat64(4, true), p); return; }   // (a new connection: the clock afresh)
  if (ty === 3 && data.byteLength >= 3 + 5 * n){ for (let i = 0; i < n; i++){ const R = RT.peers.get(hid(3 + 5 * i)); if (R) R.gone = true; } return; }
  if (ty !== 2 || data.byteLength < 11 + 20 * n) return;
  const T = d.getFloat64(3, true); rtClock(T, p);
  for (let i = 0; i < n; i++){
    const o = 11 + 20 * i, id = hid(o);
    const s = {t:T - d.getUint16(o + 5, true), st:RT_ST[d.getUint8(o + 7)] || '', v:d.getUint16(o + 8, true) / 100, x:d.getInt32(o + 10, true) / 1e4, y:d.getInt32(o + 14, true) / 1e4, hd:d.getInt16(o + 18, true) / 1e4};
    let R = RT.peers.get(id); if (!R) RT.peers.set(id, R = {buf:[], gone:false, seen:p});
    const B = R.buf; if (B.length && s.t <= B[B.length - 1].t) continue;   // (late, or the same again)
    B.push(s); while (B.length > 2 && B[0].t < s.t - 3000) B.shift(); if (B.length > 40) B.shift();
    R.gone = false; R.seen = p; RT.down++;
    // what she does and her speed on the AIS card at once; a boat the 15 s list does not have yet is fetched with it (name, type, paint)
    const q = PEERS.find(e => e.id === id); if (q){ if (s.st) q.st = s.st; q.v = s.v; } else RT.unknown = true;
  }
  if (RT.unknown && !WORLDP.busy && Date.now() - WORLDP.last > 5000){ RT.unknown = false; worldTick(); }
}
// her motion at report i (km per ms): from the reports either side, or from the one before at the newest; none across a jump or a gap
function rtVel(B, i){
  const a = B[i - 1] || B[i], c = B[i + 1] || B[i], dt = c.t - a.t, dx = c.x - a.x, dy = c.y - a.y;
  return dt > 0 && dt <= 2500 && Math.hypot(dx, dy) < PT_SNAP ? {x:dx / dt, y:dy / dt} : {x:0, y:0};
}
// where the relay's reports put her at the drawn time, half a second back: between the two reports either side (Hermite, so the
// curve is round), on along her motion for a moment when the next is late; null when the relay has not had her for RT_STALE
function rtPose(id){
  const R = RT.peers.get(id); if (!R || R.gone || RT.off == null || !R.buf.length) return null;
  const B = R.buf, n = B.length, L = B[n - 1], t = performance.now() + RT.off - RT_DELAY;
  if (t - L.t > RT_STALE) return null;
  if (t >= L.t){ const V = rtVel(B, n - 1), u = t - L.t; return {x:L.x + V.x * u, y:L.y + V.y * u, hd:L.hd}; }
  if (t <= B[0].t) return {x:B[0].x, y:B[0].y, hd:B[0].hd};
  let i = n - 2; while (i > 0 && B[i].t > t) i--;
  const a = B[i], b = B[i + 1], h = b.t - a.t, u = (t - a.t) / h;
  if (Math.hypot(b.x - a.x, b.y - a.y) >= PT_SNAP) return {x:a.x, y:a.y, hd:a.hd};   // a jump (towed home, a new start) is not drawn across
  const ma = rtVel(B, i), mb = rtVel(B, i + 1), u2 = u * u, u3 = u2 * u, h00 = 2 * u3 - 3 * u2 + 1, h10 = u3 - 2 * u2 + u, h01 = 3 * u2 - 2 * u3, h11 = u3 - u2;
  return {x:h00 * a.x + h10 * h * ma.x + h01 * b.x + h11 * h * mb.x, y:h00 * a.y + h10 * h * ma.y + h01 * b.y + h11 * h * mb.y, hd:a.hd + ptAng(a.hd, b.hd) * u};
}
// her turn rate from the relay's reports a second or more apart (for the track when the relay goes quiet)
function rtTurn(B){
  const L = B[B.length - 1]; if (!L || L.st !== 'sailing') return 0;
  for (let i = B.length - 2; i >= 0; i--) if (L.t - B[i].t >= 1000) return B[i].st === 'sailing' ? clamp(ptAng(B[i].hd, L.hd) / ((L.t - B[i].t) / 1000), -0.25, 0.25) : 0;
  return 0;
}
// The relay's boats in the track (core/05-vessels.js peerStates → ptTake, ptPose; the chart, the AIS and the 3D view all read it). While
// the relay has her, her pose is the relay's, glided onto from where the 15 s track showed her; a 15 s report older than the relay's
// newest does not move her. When the relay goes quiet, her track goes on from the relay's newest report (place, heading, speed, turn)
// and glides from where she was shown, as it does onto a new 15 s report. Without the relay this changes nothing.
const ptPoseBase = ptPose, ptTakeBase = ptTake;
ptPose = function(T, now){
  const P = RT.peers.size ? rtPose(T.q.id) : null;
  if (P){
    if (!T.rt){ const S0 = ptPoseBase(T, now), gx = S0.x - P.x, gy = S0.y - P.y; T.rt = {off:Math.hypot(gx, gy) < PT_SNAP ? {x:gx, y:gy, hd:ptAng(P.hd, S0.hd), t0:now} : null}; }
    const O = T.rt.off;
    if (O){ const u = (now - O.t0) / RT_GLIDE; if (u >= 1) T.rt.off = null; else { const k = 1 - u * u * (3 - 2 * u); P.x += O.x * k; P.y += O.y * k; P.hd += O.hd * k; } }
    T.rt.shown = {x:P.x, y:P.y, hd:P.hd}; T.rtAt = now;
    return P;
  }
  if (T.rt){
    const R = RT.peers.get(T.q.id), B = R ? R.buf : [], L = B[B.length - 1], sh = T.rt.shown; T.rt = null;
    if (L && RT.off != null){ const at = Date.now() - performance.now() + L.t - RT.off;   // the report's time on this device's clock, as PEERS' at
      T.q = Object.assign({}, T.q, {x:L.x, y:L.y, hd:L.hd, v:L.v, st:L.st || T.q.st, rt:'', R:null, at}); T.w = rtTurn(B); T.rtAt = at; }
    T.off = null;
    if (sh){ const P0 = ptPoseBase(T, now), gx = sh.x - P0.x, gy = sh.y - P0.y, gd = Math.hypot(gx, gy);
      if (gd < PT_SNAP) T.off = {x:gx, y:gy, hd:ptAng(P0.hd, sh.hd), t0:now, dur:1000 * clamp(1 + gd * 1000 / 70, 2.5, 6)}; }   // (she catches up the half second over 2.5 s or more)
  }
  return ptPoseBase(T, now);
};
ptTake = function(q, now){
  const T = PTRK.get(q.id);
  if (T && (T.rt || (T.rtAt && q.at <= T.rtAt))) return T;   // the relay has her, or has had her since this report
  return ptTakeBase(q, now);
};
function worldStart(){
  if (!CLOUD.on) return;
  WSH.rec = true; setTimeout(worldShare, 20000); setInterval(worldShare, 600000);
  setTimeout(worldTick, 3000); setInterval(worldTick, 15000);
  setInterval(() => { if (WORLDP.put && !WORLDP.busy && Date.now() - WORLDP.put > 3000 && worldSig() !== WORLDP.sig) worldTick(); }, 1000);
  setInterval(() => { try { evCloseTick(); } catch (e){ console.warn('evClose', e); } }, 20000);
  setTimeout(lopSync, 25000); setInterval(lopSync, 30000);   // the race's attempts to the cloud (KL3)
  if (typeof pressStart === 'function') pressStart();   // Kystposten's stories to and from the cloud (ui/05g-press.js)
  document.addEventListener('visibilitychange', () => { if (!document.hidden) worldTick(); });
  setInterval(() => { if (PEERS.length && Date.now() - WORLDP.last > 60000) PEERS.length = 0; }, 10000);   // gone quiet (offline)
  // the relay (S2): opened, fed and closed from here, five times a second; a hidden page lets go at once
  setInterval(() => { try { rtTick(); } catch (e){ console.warn('rt', e); } }, RT_MOVE);
  document.addEventListener('visibilitychange', () => { if (document.hidden && RT.ws) rtClose(1000, 1000); });
}
