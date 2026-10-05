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
function worldStart(){
  if (!CLOUD.on) return;
  setTimeout(worldTick, 3000); setInterval(worldTick, 15000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) worldTick(); });
  setInterval(() => { if (PEERS.length && Date.now() - WORLDP.last > 60000) PEERS.length = 0; }, 10000);   // gone quiet (offline)
}
// «Vis båten min for andre spillere» (the account card): off takes the boat away from the others at once
async function worldShowMe(on){ S.settings.showMe = !!on; save(); if (!on){ try { await cloudRpc('pos_off', {}); } catch (e){} } else worldTick(); }
