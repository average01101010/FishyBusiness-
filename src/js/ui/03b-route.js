// ---------- the route editor: waypoint names, a timeline for the list, undo and redo, moving and inserting points ----------
// Waypoints are named for the route as it is sailed: WP0 is where it starts (the harbour or the boat), then WP1, WP2 … The points a
// harbour adds on the way out and in (w.auto 'out' or 'in') are shown dimmed and marked so.
const wpName = i => 'WP' + i;
const legName = i => wpName(i) + '→' + wpName(i + 1);   // the leg that ends at draft index i
function wpTag(w){ return w.auto === 'out' ? (S.lang === 'no' ? 'utseiling' : 'way out') : w.auto === 'in' ? (S.lang === 'no' ? 'innseiling' : 'way in') : ''; }
const courseDeg = (a, c) => trueDeg(Math.atan2(c.x - a.x, -(c.y - a.y)), a);   // the chart is grid north up: the true course is the grid's + gamma
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
let rtKey = '';
function renderRouteTools(){
  const u = $('rUndo'), r = $('rRedo'); if (!u) return;
  // the side panel shows (on a wide screen) only when there is a route: drawn, being found, or being sailed (the user's wish 02.10.2026)
  const routing = S.draft.length > 0 || !!S.plan || LEIA_BUSY;
  if (document.body.classList.contains('routing') !== routing){ document.body.classList.toggle('routing', routing); if (document.body.classList.contains('vplot')){ applyView(); scheduleStatic(); } }
  const h = rhist(), key = [S.cur, S.lang, canEditDraft(), S.draft.length, S.draft.length && S.draft[S.draft.length - 1].port, h.u.length, h.r.length, LEIA_ARM, LEIA_BUSY, document.body.classList.contains('v3d'), S.boat.status, !!S.plan].join('|');
  if (key === rtKey) return; rtKey = key;
  // play starts the route drawn; while the boat sails it, pause (the user's wish 02.10.2026)
  const pl = $('rPlay'), mode = routePlayMode(), L = (no, en) => S.lang === 'no' ? no : en;
  if (pl){ pl.hidden = !mode; pl.classList.toggle('pause', mode === 'pause'); pl.setAttribute('aria-label', mode === 'pause' ? L('Pause: stopp båten på ruta', 'Pause: stop the boat on the route') : L('Start ruta', 'Start the route')); }
  const on = canEditDraft() && (S.draft.length > 0 || h.u.length > 0 || h.r.length > 0), lb = $('rAuto');
  u.hidden = r.hidden = !on; u.disabled = !h.u.length; r.disabled = !h.r.length;
  if (lb){ lb.hidden = !canEditDraft() || document.body.classList.contains('v3d'); lb.disabled = LEIA_BUSY || !!(S.draft.length && S.draft[S.draft.length - 1].port); lb.classList.toggle('on', LEIA_ARM || LEIA_BUSY); lb.classList.toggle('busy', LEIA_BUSY); lb.setAttribute('aria-label', 'Autonav'); }
  u.setAttribute('aria-label', S.lang === 'no' ? 'Angre' : 'Undo'); r.setAttribute('aria-label', S.lang === 'no' ? 'Gjør om' : 'Redo');
}
// 'play' when a route is drawn and the boat lies still, 'pause' while it sails a route, else null
function routePlayMode(){
  const b = S.boat;
  if (S.plan && b.status === 'sailing' && !S.plan.ops) return 'pause';
  if (S.draft.length && canEditDraft() && ['port', 'idle'].includes(b.status) && !(S.plan && S.plan.depAt)) return 'play';
  return null;
}
// pause: the boat stops where it is, and what is left of the route goes back to the draft, so play goes on with it (and it can be
// changed first)
function routePause(){
  const b = S.boat; if (!S.plan || b.status !== 'sailing') return;
  S.draft = S.plan.wps.slice(S.plan.idx).map(w => ({...w})); S.draftSpeed = S.plan.speed || S.draftSpeed; draftForget();
  S.plan = null; b.status = 'idle'; b.v = 0;
  log('Pause på ruta. Trykk ▶ for å gå videre.', 'Paused on the route. Tap ▶ to go on.');
}
function routePlay(){
  const m = routePlayMode(); if (!m) return;
  if (m === 'pause') routePause(); else { const el = document.createElement('button'); el.dataset.act = 'start'; doAct(el); }
  routeChanged(); renderPanel(); renderActs(); save();
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
  const w = S.draft[g.i]; w.x = mp.x; w.y = mp.y; delete w.auto; delete w.leia; g.moved = true; g.land = isLandUI(mp); RDRAG = g;
  if (!rdragRaf) rdragRaf = requestAnimationFrame(() => { rdragRaf = 0; renderDyn(); });
}
function routeDragCancel(g){ S.draft = JSON.parse(g.before); RDRAG = null; routeChanged(); }
function routeDragEnd(g){
  RDRAG = null;
  if (!g.moved){
    if (g.kind === 'ins'){
      if (isLandUI(g.p)){ toast(t('on_land')); return; }
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

// --- «Autonav» (the button in the chart plotter, and the dock's Auto-nav): the next tap on the chart is where to go, and the route
// there follows the fairway (core/11-route.js). The skipper casts off himself with «Kast loss» (the user's wish 02.10.2026).
let LEIA_ARM = false, LEIA_BUSY = false;
function leiaArm(on){
  if (on && !tutAllow('waypoint')) return;
  if (on && S.draft.length && S.draft[S.draft.length - 1].port){ toast(t('ends_port')); return; }
  LEIA_ARM = on && canEditDraft(); if (LEIA_ARM) toast(S.lang === 'no' ? 'Autonav: trykk i kartet der du vil. Båten finner en trygg vei dit.' : 'Autonav: tap the chart where you want to go. The boat finds a safe way there.');
  panelDirty = true; renderPanel(); renderRouteTools();
}
async function leiaTo(pt){
  const b = S.boat; LEIA_ARM = false;
  if (!canEditDraft() || LEIA_BUSY) return;
  if (S.draft.length && S.draft[S.draft.length - 1].port){ toast(t('ends_port')); return; }
  const r = 22 / view.px; let near = null, bd = 1e9;
  for (const p of PORTS){ const d = dist(p.p, pt); if (d < r && d < bd){ bd = d; near = p; } }
  const start = S.draft.length ? S.draft[S.draft.length - 1] : b.pos, aPort = !S.draft.length && b.status === 'port' ? b.port : null;
  if (near && aPort === near.id){ toast(t('already_here')); return; }
  if (!near && isLandUI(pt)){ toast(t('on_land')); return; }
  const before = JSON.stringify(S.draft); LEIA_BUSY = true; panelDirty = true; renderPanel(); renderRouteTools();
  let res; try { res = await leiaRoute({x:start.x, y:start.y}, near ? near.p : pt, aPort, near ? near.id : null); } finally { LEIA_BUSY = false; }
  if (JSON.stringify(S.draft) !== before){ routeChanged(); return; }   // the route was changed while the way was being found
  if (res.why){ toast(S.lang === 'no' ? res.why[0] : res.why[1]); routeChanged(); return; }
  draftEdit(() => res.wps.forEach((q, i) => { const last = i === res.wps.length - 1; S.draft.push(last && near ? {x:near.p.x, y:near.p.y, port:near.id, fish:0} : {x:q.x, y:q.y, port:null, fish:0, leia:true}); }));
  if (near && window.innerWidth <= 700) document.body.classList.add('drawer');
  if (tab !== 'route') setTab('route');
  routeChanged(); save();
}
// how the drawn route compares with following the fairway through the same stops: worked out in the background, then shown
const LEIA_CMP = {key:'', res:null, busy:false, timer:0};
function leiaStops(){
  const b = S.boat, out = [{p:{x:b.pos.x, y:b.pos.y}, port:!S.draft.length || b.status !== 'port' ? null : b.port}];
  S.draft.forEach((w, i) => { if (w.port || wpStop(w) || i === S.draft.length - 1) out.push({p:{x:w.x, y:w.y}, port:w.port || null}); });
  return out;
}
function leiaCompare(){
  if (!S.draft.length || S.draft.every(w => w.leia || w.port || w.auto)) return null;
  const st = leiaStops(), key = safeDepth() + '|' + st.map(s => s.p.x.toFixed(3) + ',' + s.p.y.toFixed(3) + (s.port || '')).join(';');
  if (LEIA_CMP.key === key) return LEIA_CMP.res;
  clearTimeout(LEIA_CMP.timer);
  LEIA_CMP.timer = setTimeout(async () => {
    if (LEIA_CMP.busy) return; LEIA_CMP.busy = true;
    try {
      let nm = 0;
      for (let i = 1; i < st.length; i++){ const r = await leiaRoute(st[i - 1].p, st[i].p, st[i - 1].port, st[i].port); if (r.why){ nm = null; break; } nm += r.nm; }
      LEIA_CMP.key = key; LEIA_CMP.res = nm == null ? null : {nm};
    } finally { LEIA_CMP.busy = false; }
    panelDirty = true; renderPanel();
  }, 350);
  return null;
}
