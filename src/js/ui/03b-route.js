// ---------- the route editor: waypoint names, a timeline for the list, undo and redo, moving and inserting points ----------
// Waypoints are named for the route as it is sailed: WP0 is where it starts (the harbour or the boat), then WP1, WP2 … The points a
// harbour adds on the way out and in (w.auto 'out' or 'in') are shown dimmed and marked so.
const wpName = i => 'WP' + i;
const legName = i => wpName(i) + '→' + wpName(i + 1);   // the leg that ends at draft index i
function wpTag(w){ return w.auto === 'out' ? (S.lang === 'no' ? 'utseiling' : 'way out') : w.auto === 'in' ? (S.lang === 'no' ? 'innseiling' : 'way in') : ''; }
const courseDeg = (a, c) => (Math.atan2(c.x - a.x, -(c.y - a.y)) * 180 / Math.PI + 360) % 360;   // the chart is north up, so this is true course
const deg3s = d => String(Math.round(d) % 360).padStart(3, '0') + '°';
// the draft leg by leg: course to steer, length, and when the boat gets to each point and leaves it (game minutes). Gear work at a
// point is not counted, the same as in the estimate.
function draftTimeline(){
  const b = S.boat, e = estimate(), v = Math.max(1, e.v), out = [];
  let a = b.pos, T = S.draftDep && S.draftDep > S.t ? S.draftDep : S.t;
  const T0 = T;
  S.draft.forEach(w => { const km = dist(a, w); T += km / (v * NM) * 60; const arrive = T; T += (w.fish || 0) * 60; out.push({nm:km / NM, crs:courseDeg(a, w), arrive, leave:T}); a = w; });
  return {dep:T0, legs:out, end:T};
}

// --- history: every change to the draft can be undone and redone, 100 steps per vessel; it is not saved
const RHIST = {};
const rhist = () => RHIST[S.cur] || (RHIST[S.cur] = {u:[], r:[]});
function draftEdit(fn){
  const before = JSON.stringify(S.draft), out = fn();
  if (JSON.stringify(S.draft) !== before){ const h = rhist(); h.u.push(before); if (h.u.length > 100) h.u.shift(); h.r.length = 0; }
  return out;
}
function draftUndo(){ const h = rhist(); if (!h.u.length) return false; h.r.push(JSON.stringify(S.draft)); S.draft = JSON.parse(h.u.pop()); return true; }
function draftRedo(){ const h = rhist(); if (!h.r.length) return false; h.u.push(JSON.stringify(S.draft)); S.draft = JSON.parse(h.r.pop()); return true; }
function draftForget(all){ if (all) for (const k in RHIST) delete RHIST[k]; else { const h = rhist(); h.u.length = 0; h.r.length = 0; } }
// the draft can be edited while the boat lies in port or still at sea, and no departure is waiting
const canEditDraft = () => ['port', 'idle'].includes(S.boat.status) && !(S.plan && S.plan.depAt) && !(S.plan && S.boat.status !== 'idle');
function routeChanged(){ hzCache.k = ''; panelDirty = true; renderDyn(); renderRouteTools(); }

// --- the floating undo and redo buttons over the zoom buttons on the chart
function renderRouteTools(){
  const u = $('rUndo'), r = $('rRedo'); if (!u) return;
  const h = rhist(), on = canEditDraft() && (S.draft.length > 0 || h.u.length > 0 || h.r.length > 0);
  u.hidden = r.hidden = !on; u.disabled = !h.u.length; r.disabled = !h.r.length;
  u.setAttribute('aria-label', S.lang === 'no' ? 'Angre' : 'Undo'); r.setAttribute('aria-label', S.lang === 'no' ? 'Gjør om' : 'Redo');
}
function routeUndoRedo(redo){ if (!canEditDraft()) return; if (redo ? draftRedo() : draftUndo()){ routeChanged(); save(); } }

// --- moving a point with a finger, and inserting one on a leg with its «+» handle
// A press within 22 px of a waypoint takes it (not the harbour at the end); a press on a leg's middle handle makes a new point there.
// The point follows the finger; if it ends on land it turns red and goes back. A second finger cancels, so the chart can be pinched.
let RDRAG = null;
const WP_HIT = 22, INS_HIT = 18, INS_MIN = 64;   // px
function legEnds(i){ return [i === 0 ? S.boat.pos : S.draft[i - 1], S.draft[i]]; }
// the legs long enough on screen to carry a «+» handle, with the handle's position
function insHandles(){
  const out = []; if (!canEditDraft()) return out;
  for (let i = 0; i < S.draft.length; i++){ const [a, c] = legEnds(i); if (dist(a, c) * view.px < INS_MIN) continue; out.push({i, p:{x:(a.x + c.x) / 2, y:(a.y + c.y) / 2}}); }
  return out;
}
function routeGrab(mp){
  if (!canEditDraft() || !S.draft.length) return null;
  let best = null, bd = WP_HIT / view.px;
  S.draft.forEach((w, i) => { if (w.port) return; const d = dist(w, mp); if (d < bd){ bd = d; best = {kind:'move', i}; } });
  if (!best){ let hd = INS_HIT / view.px; for (const hdl of insHandles()){ const d = dist(hdl.p, mp); if (d < hd){ hd = d; best = {kind:'ins', i:hdl.i, p:hdl.p}; } } }
  if (best){ best.before = JSON.stringify(S.draft); best.land = false; best.moved = false; }
  return best;
}
let rdragRaf = 0;
function routeDragMove(g, mp){
  if (g.kind === 'ins'){ S.draft.splice(g.i, 0, {x:mp.x, y:mp.y, port:null, fish:0}); g.kind = 'move'; g.inserted = true; }
  const w = S.draft[g.i]; w.x = mp.x; w.y = mp.y; delete w.auto; g.moved = true; g.land = isLand(mp); RDRAG = g;
  if (!rdragRaf) rdragRaf = requestAnimationFrame(() => { rdragRaf = 0; renderDyn(); });
}
function routeDragCancel(g){ S.draft = JSON.parse(g.before); RDRAG = null; routeChanged(); }
function routeDragEnd(g){
  RDRAG = null;
  if (!g.moved){
    if (g.kind === 'ins'){
      if (isLand(g.p)){ toast(t('on_land')); return; }
      draftEdit(() => S.draft.splice(g.i, 0, {x:g.p.x, y:g.p.y, port:null, fish:0}));
    } else { routeFocus(g.i); return; }
  } else if (g.land){ S.draft = JSON.parse(g.before); toast(S.lang === 'no' ? 'Punktet havnet på land og er flyttet tilbake.' : 'The point landed on land and has been moved back.'); }
  else { const now = S.draft; S.draft = JSON.parse(g.before); draftEdit(() => { S.draft = now; }); }
  routeChanged(); save();
}
// show a waypoint's card in the list
function routeFocus(i){
  if (tab !== 'route') setTab('route');
  if (window.innerWidth <= 700) document.body.classList.add('drawer');
  requestAnimationFrame(() => { const li = document.querySelector('#panel .wpc[data-i="' + i + '"]'); if (!li) return; li.scrollIntoView({block:'nearest', behavior:'smooth'}); li.classList.remove('flash'); void li.offsetWidth; li.classList.add('flash'); });
}
// a map point on the screen (for the tests and the first-trip guide)
function mapToClient(p){ const m = svg.getScreenCTM(); return {x:m.a * p.x + m.c * p.y + m.e, y:m.b * p.x + m.d * p.y + m.f}; }
