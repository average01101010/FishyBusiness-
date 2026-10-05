// ---------- the shared world V3: the other players' boats (05.10.2026; supabase/migrations/20261005220000_presence.sql) ----------
// Jonas: «fokuset nå må være å få koblet sammen spillerne i verden med felles tid … Dette er nesten et mmorpg spill». Every 15 s while
// the game is open, seen and signed in, where the boat you follow is goes up (her place, heading, speed, what she does, her name and
// type; not when «Vis båten min for andre spillere» is off on the account card), and the other players' boats within about the AIS range
// come down into PEERS (core/05-vessels.js peerStates), which the chart's AIS and the 3D view show like the other boats on the water.
// Without the database function (before the migration) or offline, nothing goes, and the boats heard last go after a minute.
const WORLDP = {last:0, busy:false, err:0, off:false};
const WORLD_R = 25;   // km round the boat: about the AIS range
async function worldTick(){
  if (!CLOUD.on || !CLOUD.user || WORLDP.busy || WORLDP.off || (typeof document !== 'undefined' && document.hidden)) return;
  WORLDP.busy = true;
  try {
    const b = S.boat;
    if (S.settings.showMe !== false) await cloudRpc('pos_put', {x:+b.pos.x.toFixed(4), y:+b.pos.y.toFixed(4), hd:+(b.heading || 0).toFixed(3),
      v:+(b.status === 'sailing' ? b.v || 0 : 0).toFixed(1), st:String(b.status || ''), boat:S.boatName || '', vtype:b.type || ''});
    const list = await cloudRpc('pos_near', {x:b.pos.x, y:b.pos.y, r:WORLD_R}) || [], now = Date.now();
    PEERS.length = 0; for (const q of list) PEERS.push({...q, at:now - (q.age || 0) * 1000});
    WORLDP.last = now; WORLDP.err = 0;
  } catch (e){ if (/ 404$/.test(e.message)) WORLDP.off = true; if (++WORLDP.err > 3 || WORLDP.off) PEERS.length = 0; }
  finally { WORLDP.busy = false; }
}
// ---- the shared world V2 (05.10.2026; core/03-simulation.js WSH): one sea, one quota and one market. Every ten minutes, and soon
// after a sale, this game's sales and the cells its boats took fish from go up (S.wq), and what the other players have done comes
// down: their open-group cod this year, what they delivered to each plant in the last day, and the fish they took since the last
// time (the cursor S.wcur, kept in the save with the sea it was taken from). A sale the database refuses (400) is dropped, so one bad row
// does not hold the rest; offline, it all waits in the save.
const WSH2 = {busy:false, off:false, last:0};
async function worldShare(){
  if (!CLOUD.on || !CLOUD.user || WSH2.busy || WSH2.off || !S) return;
  WSH2.busy = true;
  try {
    const Q = wq();
    while (Q.l.length){ try { await cloudRpc('land_put', Q.l[0]); } catch (e){ if (!/ 400$/.test(e.message)) throw e; } Q.l.shift(); }
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
  } catch (e){ if (/ 404$/.test(e.message)){ WSH2.off = true; WSH.rec = false; } }
  finally { WSH2.busy = false; }
}
function worldStart(){
  if (!CLOUD.on) return;
  WSH.rec = true; setTimeout(worldShare, 20000); setInterval(worldShare, 600000);
  setTimeout(worldTick, 3000); setInterval(worldTick, 15000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) worldTick(); });
  setInterval(() => { if (PEERS.length && Date.now() - WORLDP.last > 60000) PEERS.length = 0; }, 10000);   // gone quiet (offline)
}
// «Vis båten min for andre spillere» (the account card): off takes the boat away from the others at once
async function worldShowMe(on){ S.settings.showMe = !!on; save(); if (!on){ try { await cloudRpc('pos_off', {}); } catch (e){} } else worldTick(); }
