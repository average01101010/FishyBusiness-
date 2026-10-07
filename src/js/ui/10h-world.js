// ---------- the shared world V3: the other players' boats (05.10.2026; supabase/migrations/20261005220000_presence.sql) ----------
// Jonas: «fokuset nå må være å få koblet sammen spillerne i verden med felles tid … Dette er nesten et mmorpg spill». Every 15 s while
// the game is open, seen and signed in, where the boat you follow is goes up (her place, heading, speed, what she does, her name and
// type, and your sea time), and the other players' boats within about the AIS range come down into PEERS (core/05-vessels.js
// peerStates), which the chart's AIS and the 3D view show like the other boats on the water, with the owner's player name and sea time.
// There is no hiding the boat (Jonas 07.10.2026: «Det skal ikke være mulig å skjule båten sin posisjon for andre spillere, det er et
// krav»); a guest's boat is left out for the others by the server (supabase/migrations/20261007130000_seen.sql).
// Without the database function (before the migration) or offline, nothing goes, and the boats heard last go after a minute.
const WORLDP = {last:0, busy:false, err:0, off:false};
const WORLD_R = 25;   // km round the boat: about the AIS range
async function worldTick(){
  if (!CLOUD.on || !CLOUD.user || WORLDP.busy || WORLDP.off || (typeof document !== 'undefined' && document.hidden)) return;
  WORLDP.busy = true;
  try {
    const b = S.boat;
    // the paint (vessel3d.js livStr) and the sea time (core/09e-fartstid.js) go along; a server without them yet (404) gets the
    // position without the newest first, then without the paint
    const a = {x:+b.pos.x.toFixed(4), y:+b.pos.y.toFixed(4), hd:+(b.heading || 0).toFixed(3),
      v:+(b.status === 'sailing' ? b.v || 0 : 0).toFixed(1), st:String(b.status || ''), boat:S.boatName || '', vtype:b.type || ''}, lv = livStr(b);
    if (lv && !WORLDP.noLiv) a.liv = lv;
    if (!WORLDP.noFs && typeof fsState === 'function') a.fs = Math.round(fsState().p);
    for (;;){ try { await cloudRpc('pos_put', a); break; } catch (e){ if (!/ 404$/.test(e.message)) throw e;
      if ('fs' in a){ WORLDP.noFs = true; delete a.fs; } else if ('liv' in a){ WORLDP.noLiv = true; delete a.liv; } else throw e; } }
    const list = await cloudRpc('pos_near', {x:b.pos.x, y:b.pos.y, r:WORLD_R}) || [], now = Date.now();
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
      const list = await cloudRpc('gear_near', {x:b.pos.x, y:b.pos.y, r:GEAR_R}) || [];
      PEERGEAR.length = 0; for (const q of list) if (Array.isArray(q) && q.length === 5) PEERGEAR.push({k:q[0], a:{x:q[1], y:q[2]}, b:{x:q[3], y:q[4]}});
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
function worldStart(){
  if (!CLOUD.on) return;
  WSH.rec = true; setTimeout(worldShare, 20000); setInterval(worldShare, 600000);
  setTimeout(worldTick, 3000); setInterval(worldTick, 15000);
  if (typeof pressStart === 'function') pressStart();   // Kystposten's stories to and from the cloud (ui/05g-press.js)
  document.addEventListener('visibilitychange', () => { if (!document.hidden) worldTick(); });
  setInterval(() => { if (PEERS.length && Date.now() - WORLDP.last > 60000) PEERS.length = 0; }, 10000);   // gone quiet (offline)
}
