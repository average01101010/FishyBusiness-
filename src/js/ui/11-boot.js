// ---------- boot ----------
// The map comes first (01b-mapdata.js): the manifest, the core layers, and the sim packs round every vessel and its plan. Then the
// saved game is read and the page built. The clock waits for SIMREADY (08-actions.js tick), and later for each vessel's waters.
let awayMs = 0, AWAY = 0, SIMREADY = false;
const BOOT_T = Date.now();
const g3Live = () => typeof G3 !== 'undefined' && G3.isActive();
// The start timed (02.11.2026, the error trap; ui/10f-cloud.js cloudErr): a player who waits 40 s for the game does not tell us, he
// goes. From the navigation (performance.now() counts from it, so the download of the page is in) to the game built, less the time
// at the sign-in gate (the player's own) and in the background (a tab loads slowly there). Over 30 s is sent as «Treg oppstart» with
// the time of each step; a start still not done after 90 s on the screen as «Oppstarten står fast», with the step it stands in, and
// at once (errStart: the game it waits for may never come). The times go as the event 'boot' too (cloudBegin), with the consent.
const BOOTW = {stage:'kart og data', steps:{}, gate:0, gateAt:0, hid:0, hidAt:document.hidden ? performance.now() : 0, done:false, stuck:false, res:null};
function bootStep(next){ const n = performance.now(); BOOTW.steps[BOOTW.stage] = Math.round(n - (BOOTW.last || 0)); BOOTW.last = n; BOOTW.stage = next; }
function bootAway(){ const n = performance.now(); return BOOTW.gate + (BOOTW.gateAt ? n - BOOTW.gateAt : 0) + BOOTW.hid + (BOOTW.hidAt ? n - BOOTW.hidAt : 0); }
function bootGate(on){ const n = performance.now(); if (on && !BOOTW.gateAt) BOOTW.gateAt = n; else if (!on && BOOTW.gateAt){ BOOTW.gate += n - BOOTW.gateAt; BOOTW.gateAt = 0; } }
document.addEventListener('visibilitychange', () => { if (BOOTW.done) return; const n = performance.now(); if (document.hidden){ if (!BOOTW.hidAt) BOOTW.hidAt = n; } else if (BOOTW.hidAt){ BOOTW.hid += n - BOOTW.hidAt; BOOTW.hidAt = 0; } });
function bootInfo(){ return {s:Math.round((performance.now() - bootAway()) / 100) / 10, stage:BOOTW.stage, steps:BOOTW.steps, gate_s:Math.round(BOOTW.gate / 1000), hid_s:Math.round(BOOTW.hid / 1000),
  net:(navigator.connection && navigator.connection.effectiveType) || null, mem:navigator.deviceMemory || null}; }
function bootDone(){
  if (BOOTW.done) return; bootStep('ferdig'); BOOTW.done = true;
  const r = BOOTW.res = bootInfo(); delete r.stage;
  bootgArm();   // (BOOTG below: when the start has got through)
  if (r.s > 30 && typeof cloudErr === 'function') cloudErr('Treg oppstart: ' + (r.s < 60 ? '30–60' : r.s < 120 ? '60–120' : 'over 120') + ' s', 'boot', JSON.stringify(r), 'slow');
}
const BOOT_WATCH = setInterval(() => {
  if (BOOTW.done){ clearInterval(BOOT_WATCH); return; }
  if (BOOTW.stuck || BOOTW.gateAt || document.hidden || performance.now() - bootAway() < 90000) return;
  BOOTW.stuck = true;
  try { if (typeof cloudErr === 'function') cloudErr('Oppstarten står fast: ' + BOOTW.stage, 'boot', JSON.stringify(bootInfo()), 'slow'); if (typeof errStart === 'function') errStart(); } catch (e){}
}, 5000);
// A start that locks the page (06.11.2026; Adrian on the iPhone app: «Står bare å laste», eight starts in five hours after Autonav was
// set in Bodø and the app closed). A page caught in an endless loop, or ended by the phone while on the screen, says nothing: no
// error, no «står fast» (BOOT_WATCH is a timer on the same thread), and the errors wait for a game that never comes (errStart). And the
// next start reads the same save and locks the same way. So each start writes on the device how far it came (BOOTG_KEY): «in» when the
// game is built from the save (bootGame with the time away), «ok» once it has run 20 s after that with the loading screen gone for 10 s
// of them, or gone to the background or closed after it (bootgArm), and whether the page was on the screen. The next start reads it:
// a start that got into building the game, never got through and was on the screen locked; the locks in a row are counted (fails),
// and a start that got through counts them from nothing again.
//   1+  «Oppstarten står fast: siden låste seg …» goes to the error list at once, at the sign-in (bootgReport, before the game is built),
//       with what the save had going (the boats, the routes), and the admin gets the push (err_alert)
//   2   the account's copy of this device's game, when this device has played past it (ui/10f-cloud.js cloudSync: a minute or so
//       before; the newest is kept under Tidligere lagringer); with nothing older on the account, the safe start
//   3   the safe start (bootgSafe): every Autonav route stops where the boat is and goes back to the draft, and the time away is
//       played with the boats lying still
//   4+  the game is not built: «Spillet startet ikke» with try again, safe mode and the save before (bootFail), each of which starts
//       the count again
// A start that ends in bootFail (an error, not a lock) is not counted: the dialog is the way on.
const BOOTG_KEY = 'dsb_bootg';
const BOOTG = (() => {
  let p = null; try { p = JSON.parse(localStorage.getItem(BOOTG_KEY) || 'null'); } catch (e){}
  if (!p || typeof p !== 'object') p = null;
  const locked = !!(p && p.in && !p.ok && p.vis), fails = !p || p.ok ? 0 : (p.fails || 0) + (locked ? 1 : 0);
  // (took: the start before took the account's copy and loaded the page again, so this one tries that game as it is first;
  // safe: the dialog's «sikker modus» asked for the safe start)
  return {prev:p, fails, said:false, safe:false, save:null, rec:{fails, at:Date.now(), v:(document.querySelector('meta[name=dsb-version]') || {}).content || 'dev',
    in:false, ok:false, vis:!document.hidden, took:!!(p && p.took && !p.in && !p.ok), safe:!!(p && p.safeAsk && !p.in)}};
})();
function bootgWrite(){ if (BOOTG.off) return; try { localStorage.setItem(BOOTG_KEY, JSON.stringify(BOOTG.rec)); } catch (e){} }
bootgWrite();
function bootgOk(){ const r = BOOTG.rec; if (r.ok || !r.in) return; r.ok = true; r.fails = 0; bootgWrite(); }
// through: 20 s after the game was built, and the loading screen gone for 10 s of it (the first ticks, the time away left over and the
// first 3D picture come after bootDone, and a lock there leaves the loading screen standing too: «Står bare å laste»)
function bootgArm(){
  const t0 = performance.now(); let up = 0;
  const iv = setInterval(() => { const n = performance.now(); if (!up && !document.body.classList.contains('booting')) up = n;
    if (BOOTG.rec.ok){ clearInterval(iv); return; } if (n - t0 >= 20000 && up && n - up >= 10000){ clearInterval(iv); bootgOk(); } }, 1000);
}
document.addEventListener('visibilitychange', () => { const r = BOOTG.rec; if (r.ok) return; if (document.hidden && BOOTW.done && r.in){ bootgOk(); return; } r.vis = !document.hidden; bootgWrite(); });
// (a page closed or left the ordinary way did not lock, also where the browser sends no visibilitychange first)
addEventListener('pagehide', () => { const r = BOOTG.rec; if (r.ok) return; if (BOOTW.done && r.in){ bootgOk(); return; } r.vis = false; bootgWrite(); });
// what the save has going, for the report (bootMapLoad has it read): each boat's type, status, harbour, position and route
function bootgNote(s){
  try {
    const vs = !s ? [] : s.fleet && s.fleet.length ? s.fleet : [s], r3 = v => Math.round(v * 1000) / 1000, pt = w => w ? (w.port || [r3(w.x), r3(w.y)]) : null;
    BOOTG.save = {seq:s ? s.seq || 0 : null, t:s ? Math.round(s.t || 0) : null, n:vs.length, b:vs.slice(0, 4).map(v => { const b = v.boat || {}, pl = v.plan, W = pl && pl.wps || [];
      return {ty:b.type || null, st:b.status || null, port:b.port || null, p:b.pos ? [r3(b.pos.x), r3(b.pos.y)] : null, wps:W.length, idx:pl ? pl.idx : null, to:pt(W[W.length - 1]),
        next:pt(W[pl ? pl.idx : 0]), rp:!!(pl && pl.replan), ops:!!v.ops}; })};
  } catch (e){}
}
// the game is about to be built from the save: from here a lock counts
function bootgIn(){
  const g = BOOTG, r = g.rec;
  if (g.fails >= 4 && !r.safe){ bootgWrite(); const l = (navigator.language || 'no').toLowerCase(), en = !/^no|^nb|^nn/.test(l);   // (as bootFail says it)
    throw new Error(en ? 'The game has stopped while starting ' + g.fails + ' times in a row.' : 'Spillet har stoppet under oppstarten ' + g.fails + ' ganger på rad.'); }
  g.safe = r.safe || g.fails >= 3 || (g.fails === 2 && !r.took);
  r.in = true; r.vis = !document.hidden; r.at = Date.now(); r.act = g.safe ? 'safe' : r.took ? 'cloud' : null; r.save = g.save; r.safe = false; bootgWrite();
}
function bootgOut(){ const r = BOOTG.rec; r.in = false; bootgWrite(); }
// the dialog's buttons: the count from nothing (over: what the next start is to do); this page writes no more, so its own record does not
// come back over it as the page goes hidden on the way to the reload
function bootgClear(over){ BOOTG.off = true; try { if (over) localStorage.setItem(BOOTG_KEY, JSON.stringify(over)); else localStorage.removeItem(BOOTG_KEY); } catch (e){} }
// the start before locked: told at once, while the cloud is there (ui/10f-cloud.js cloudGate, after tm_hello), with what waited from it
function bootgReport(){
  const g = BOOTG; if (g.said || g.fails < 1 || typeof cloudRpc !== 'function') return; g.said = true;
  const p = g.prev || {}, meta = {}; try { Object.assign(meta, cloudMeta()); } catch (e){} try { Object.assign(meta, cloudDev()); } catch (e){}
  const info = {fails:g.fails, version:p.v || null, min_ago:p.at ? Math.round((Date.now() - p.at) / 60000) : null, act:p.act || null, save:p.save || null};
  cloudRpc('tm_error', {msg:'Oppstarten står fast: siden låste seg mens spillet ble bygd', src:'boot', stack:JSON.stringify(info).slice(0, 2000), meta}).catch(() => {});
  // (the crash note the locked page left, ui/10f-cloud.js aliveCheck, and the errors kept on the device go now too, not when the game is up)
  try { if (!ERR.ready && ERR.pend.length) for (const e of ERR.pend.splice(0)) cloudRpc('tm_error', e).catch(() => errKeep([e])); errFlush(); } catch (e){}
}
// the second lock: the account's copy of this device's game, when this device has played past it (ui/10f-cloud.js cloudSync)
function bootgRescue(){ const g = BOOTG, r = g.rec; if (g.fails < 2 || g.fails >= 4 || r.took) return false; r.took = true; r.act = 'cloud'; bootgWrite(); return true; }
// the safe start (bootGame): every route stops where her boat is and goes back to the draft, as «Pause» does (ui/03b-route.js)
function bootgSafe(){
  let n = 0;
  const stop = () => { const pl = S.plan, b = S.boat; if (!pl) return; n++;
    if (pl.wps && pl.idx < pl.wps.length){ S.draft = pl.wps.slice(pl.idx).map(w => ({...w})); if (pl.speed) S.draftSpeed = pl.speed; }
    S.plan = null; if (b && b.status === 'sailing'){ b.status = 'idle'; b.v = 0; } };
  try { if (S.fleet && S.fleet.length){ for (const v of S.fleet) withVessel(v, stop); storeVessel(curVessel()); } else stop(); } catch (e){ console.error(e); }
  const no = n ? 'Spillet stoppet under oppstarten. For å slippe deg inn igjen er Autonav stoppet der båten er, og ruta ligger som utkast i kartet.' : 'Spillet stoppet under oppstarten, og startes nå forsiktig.',
    en = n ? 'The game stopped while starting. To let you in again, Autonav was stopped where the boat is, and the route is kept as a draft on the chart.' : 'The game stopped while starting, and now starts carefully.';
  BOOTG.say = [no, en]; try { sessionStorage.setItem('dsb_note', S.lang === 'en' ? en : no); } catch (e){}
}
// (the log's line when the player is back, after the time away: bootGame)
function bootgSay(){ const s = BOOTG.say; if (!s) return; BOOTG.say = null; try { log(s[0], s[1], 'nav'); } catch (e){ console.error(e); } }
async function bootMap(){ await Promise.all([(async () => { await mapStart(); await bootMapLoad(); })(), bootData()]); }
// The data elements (the boat models, the pictures, Senja's buildings: src/data/*.b64) are out of the page from 29.10.2026 (build.mjs,
// Jonas: the page need not be one file when that is better for the players): each empty <script type="application/octet-stream"
// data-src="data/<id>-<hash>.bin"> gets its bytes fetched here beside the map and kept (DATAB below, bytes from 04.11.2026; the pictures as base64 in textContent), so the readers
// (vessel3d.js glbData, 08b-letter.js letterPic, view3d/06 bld) see what they always saw. The files are named by their hash, so the
// browser and the service worker keep them, and a build changes only what changed. A file that does not come in four tries stops the
// boot, like a pack. A one-file build (KYST_ONE=1) has no data-src and nothing to do here.
// Two parts from 04.11.2026 (Jonas: the first minutes decide whether a new player stays): the boot waits only for what the game needs
// before the 3D view (the pictures: the letter and the yard's side views; the worker for the wardrobe; the boat types of the saved
// fleet, or Father's wooden boat for a new game, for the paint shop), about 8 MB of the 66. The rest (the other boat types, the
// harbours, the pub, Senja's buildings) comes in the background behind the letter (bootDataLate, a few at a time, low priority, so
// the map's packs go first), and the 3D view waits for it (MODELS, view3d/25-controls.js show): every reader there sees the models
// as before, and none keeps a «no model» for good. A first start on 20 Mbit/s had the letter after 35 s; now it is the page and the map.
const MODELS = {done:false, wait:[], total:0, got:0, failed:[]};
// The 3D view's first picture timed (04.11.2026, the first start): the boot event above ends when the game is built, before the
// letter and the 3D view, so the wait after «Start» never reached the error list. ask: when the 3D view was first asked for (the letter
// and the start place are off the screen), shown: two frames after it came up (loaderGone). Sent once as the event 'first3d' with the seconds from
// the ask (wait_s, of it the models' part models_s), from the navigation less the gate and the background (total_s), and whether this
// device had the app's worker already (warm: false is a first visit or a browser without it). letter_s (Ø3a, 07.11.2026): from the
// navigation to Father's letter on the screen, less the gate and the background (the wait before the letter, the first start's own;
// null when no letter came: a saved game); read_s: from the letter to the ask, less the background (the player's own time with the letter
// and the start place)
const B3D = {ask:0, models:0, sent:false, res:null, warm:!!(navigator.serviceWorker && navigator.serviceWorker.controller), hid:0, hidAt:0, lt:0, lh:0, lhAt:0};
// (the time in the background between the ask and the picture is left out, as the boot's is: a player who put the tablet away on
// the start place gave «wait_s» 984 and «total_s» -968, 04.11.2026; BOOTW stops counting the background once the game is built)
function boot3dAsk(){ if (!B3D.ask){ B3D.ask = performance.now(); if (document.hidden) B3D.hidAt = B3D.ask; if (B3D.lhAt){ B3D.lh += B3D.ask - B3D.lhAt; B3D.lhAt = 0; } } }
document.addEventListener('visibilitychange', () => { const n = performance.now();
  // (read_s leaves out the time in the background between the letter and the ask, lh, as wait_s leaves out the time after the ask)
  if (B3D.ltAt && !B3D.ask){ if (document.hidden){ if (!B3D.lhAt) B3D.lhAt = n; } else if (B3D.lhAt){ B3D.lh += n - B3D.lhAt; B3D.lhAt = 0; } }
  if (!B3D.ask || B3D.res) return; if (document.hidden){ if (!B3D.hidAt) B3D.hidAt = n; } else if (B3D.hidAt){ B3D.hid += n - B3D.hidAt; B3D.hidAt = 0; } });
function boot3dShown(){
  if (B3D.res || B3D.wait3 || !B3D.ask || !BOOTW.done) return; B3D.wait3 = true;
  // (two frames on: the 3D view's own first frame, the heavy one, has been drawn by then)
  requestAnimationFrame(() => requestAnimationFrame(() => {
  const n = performance.now(), away = B3D.hid + (B3D.hidAt ? n - B3D.hidAt : 0);
  B3D.res = {wait_s:Math.round((n - B3D.ask - away) / 100) / 10, models_s:Math.round(B3D.models / 100) / 10, total_s:Math.round((n - bootAway() - away) / 100) / 10, hid_s:Math.round(away / 1000), warm:B3D.warm,
    letter_s:B3D.lt ? Math.round(B3D.lt / 100) / 10 : null, read_s:B3D.lt ? Math.round((B3D.ask - B3D.ltAt - B3D.lh) / 100) / 10 : null,
    net:(navigator.connection && navigator.connection.effectiveType) || null, mem:navigator.deviceMemory || null};
  boot3dSend(); }));
}
function boot3dSend(){ if (!B3D.res || B3D.sent || typeof CLOUD === 'undefined' || !CLOUD.sid) return; B3D.sent = true; cloudEv('first3d', B3D.res); }
function modelsReady(){ boot3dAsk(); if (!MODELS.done){ bootDataLate(); const t = performance.now(); MODELS.wait.push(() => { B3D.models = performance.now() - t; }); } return MODELS.done ? Promise.resolve() : new Promise(r => { MODELS.wait.push(r); modelsLabel(); }); }
function dataEls(){ return [...document.querySelectorAll('script[type="application/octet-stream"][data-src]')]; }
function dataEarly(){
  const ty = new Set(['trebat']);
  try { const s = load(); for (const v of s && s.fleet && s.fleet.length ? s.fleet : s ? [s] : []) if (v.boat && v.boat.type) ty.add(v.boat.type); } catch (e){}
  // (and the fishing grounds' shapes, Ø14 F2: the fish on the grounds are the same from the first hour, 03j-felt.js)
  return el => /^pic-/.test(el.id) || el.id === 'glb-worker' || el.id === 'felt-s' || [...ty].some(t => el.id === 'glb-' + t);
}
// The models' bytes as they came (04.11.2026, the memory: two crashes on Android that day with 462 and 647 MB of JS heap): kept here as
// a Uint8Array per element id and read by glbData (vessel3d.js), the pub's and the naust's parse and the buildings' loader, instead of
// base64 in the element's text (88 MB of strings, each turned back to bytes when read). The pictures (pic-*) stay base64: the letter
// and the yard's cards put them in a data: URL.
const DATAB = new Map();
async function dataGet(el, opt){
  const src = el.dataset.src; let b;
  // the body is read inside the tries too (06.11.2026): Safari on iOS can drop the body after the headers came, and the blob then
  // threw «Load failed» once, without the retries, so the model was left out
  for (let t = 0; ; t++){
    try { const r = await fetch(src, Object.assign(t ? {cache:'reload'} : {}, opt)); if (!r.ok) throw new Error('HTTP ' + r.status); b = await r.blob(); break; }
    catch (e){ if (t >= 3) throw new Error('data ' + src + ': ' + (e && e.message || e)); await new Promise(res => setTimeout(res, 700 * (t + 1))); }
  }
  if (/^pic-/.test(el.id)){ const s = await new Promise((res, rej) => { const f = new FileReader(); f.onload = () => res(String(f.result)); f.onerror = () => rej(f.error); f.readAsDataURL(b); });
    el.textContent = s.slice(s.indexOf(',') + 1); }
  else DATAB.set(el.id, new Uint8Array(await b.arrayBuffer()));
  el.removeAttribute('data-src');
  return b.size;
}
async function bootData(){
  const early = dataEarly(), els = dataEls().filter(early);
  if (!dataEls().length){ MODELS.done = true; return; }   // (a one-file build: everything is in the page)
  await Promise.all(els.map(el => dataGet(el)));
}
// the rest, after the map's first packs: three at a time; a file that does not come in four tries is told to the error list and left
// out (its readers draw what they drew without it), so a bad connection never keeps the 3D view from coming
function bootDataLate(){
  if (MODELS.done || MODELS.started) return; MODELS.started = true;
  const els = dataEls(); let man = null;
  MODELS.total = els.reduce((a, el) => a + (+el.dataset.b || 1), 0);
  const next = async () => {
    for (let el; (el = els.shift()); ){
      const n = +el.dataset.b || 1;
      try { await dataGet(el, {priority:'low'}); }
      catch (e){ MODELS.failed.push(el.id); try { if (typeof cloudErr === 'function') cloudErr('data: ' + (e && e.message || e), 'boot', '', 'slow'); } catch (e2){} }
      MODELS.got += n; modelsLabel();
    }
  };
  Promise.all([next(), next(), next()]).then(() => { MODELS.done = true; modelsLabel(); for (const r of MODELS.wait.splice(0)) r(); });
}
// the loading screen says how far the models are once the 3D view waits for them (the letter and the start place are off it)
function modelsLabel(){
  const el = document.querySelector('#loader .ld-s'); if (!el || !MODELS.wait.length || MODELS.done) return;
  const p = MODELS.total ? Math.min(100, Math.round(100 * MODELS.got / MODELS.total)) : 0, no = typeof S === 'undefined' || !S || S.lang !== 'en';
  el.textContent = (no ? 'Laster båter og havner … ' : 'Loading boats and harbours … ') + p + ' %';
}
// The packs round everything the saved game holds. It runs again after the cloud gate (08.10.2026, a player on a new PC: the cloud save
// is put in place only then, and its boat may lie in a tile the first round never asked for: «mask block 105,20 is not loaded»).
async function bootMapLoad(){
  const saved = load(), pts = [], ways = []; bootgNote(saved);
  for (const v of saved && saved.fleet && saved.fleet.length ? saved.fleet : saved ? [saved] : []){
    const b = v.boat; if (b && b.pos) pts.push(b.pos); for (const w of [...((v.plan && v.plan.wps) || []), ...((v.ops && v.ops.wps) || []), ...(v.draft || [])]) pts.push(w);
    // and the way along the plan still ahead and the draft (07.11.2026): the start's check of the plan (legClear in bootGame) and the
    // chart's drawing of the draft (renderDyn) read the whole leg, and the packs round its ends left out the middle of a long one
    // (Adrian 05.11.2026: «mask block … is not loaded», and the page loaded again for it). The same pieces as the route finder and the
    // draft's hazards (lnetLoad, core/11c-leinett.js: 5 km of the leg at a time, half a kilometre round it)
    if (b && b.pos){ const i0 = v.plan ? v.plan.idx || 0 : 0;
      if (v.plan && v.plan.wps && v.plan.wps.length > i0) ways.push([b.pos].concat(v.plan.wps.slice(i0)));
      if (v.draft && v.draft.length) ways.push([b.pos].concat(v.draft)); } }
  for (const s of (saved && saved.sets) || []) if (s.a && s.b) pts.push(setMid(s));
  // Senja's harbours (a new game starts in Finnsnes before the player picks a place, ui/08c-start.js), the saved home and the grounds
  // (the talk on the quay weighs them all); not the coast's receivers, which would be the whole coast's packs
  for (const q of PORTS) if (!q.coastal) pts.push(q.p); for (const g of GROUNDS) pts.push(g.p);
  { const h = saved && saved.home && portById(saved.home); if (h) pts.push(h.p); }
  // a read that lands in a pack not in yet (the coast reader looks a little beyond the radius, 08.10.2026: «mask block 105,20 is not loaded»)
  // loads that pack and goes again; a pack that does not come is tried again by mapFetch before it gets here
  for (let t = 0; ; t++){
    // packs the last start found missing too late (the catch at the bottom remembers them for this tab and loads the page again)
    let late = []; try { const L = JSON.parse(sessionStorage.getItem('dsb_needpk') || '[]'); late = [...MAPD.byTile.values()].filter(pk => L.includes(pk.file)); } catch (e){}
    try { await Promise.all([mapLoad(MAPD.core), ...pts.map(p => mapNeed(p, MAPD.simR)), ...ways.map(P => lnetLoad(P)), ...late.map(mapLoad)]); break; }
    catch (e){ if (t >= 8) throw e; if (e && e.pk) await mapLoad(e.pk); else await new Promise(res => setTimeout(res, 1000)); }
  }
  DEPTH = true;
  // the chart's coast over the whole frame (H1b R2) comes after the start, so the start waits no longer for it
  if (MAPD.chart0) setTimeout(() => mapLoad(MAPD.chart0).catch(e => console.error(e)), 4000);
}
function bootGame(){
S = load(); tabMark();   // this page has the game now (an older page left open stops: tabMine, 02-format-state.js)
// the fish plants' morning price messages (gone 13.10.2026) leave the phone's message list too
if (S && S.msgs) S.msgs = S.msgs.filter(m => !/^God morgen! Vi betaler /.test(m.no || ''));
// the coast radio is no longer kept among the messages (21.10.2026): what it has sent moves to the deck log's list
if (S && S.msgs && S.msgs.some(m => m.from === 'Kystradio')){ S.radio = (S.radio || []).concat(S.msgs.filter(m => m.from === 'Kystradio').map(({t, from, no, en}) => ({t, from, no, en}))).slice(-40); S.msgs = S.msgs.filter(m => m.from !== 'Kystradio'); }
if (S){ awayMs = Date.now() - (S.lastReal || Date.now()); } else S = newState();
if (BOOTG.safe) bootgSafe();   // the starts before locked (BOOTG above): the routes stop before the time away is played
// the skiff is only bought at the yard (05.10.2026, Jonas: «Den båten der skal kun være tilgjengelig for kjøp i verftet … For alle
// brukere»): a save that still sails the free aluminium skiff it started with (the start boat until 04.10.2026: the first vessel, never
// traded, S.owned just ['skiff'] or not kept yet) gets Father's old wooden boat instead, and what does not fit her (the 90 hp outboard)
// is paid back at its price. A skiff bought at the yard stays: S.owned is only this migration's mark, ['trebat'] in every save begun
// after 04.10.2026 (newState), and nothing else reads it, so a purchase no longer adds to it (Ø7; the add in core/03-simulation.js
// addVessel goes when havsteget H2 is out). (A save migration about one old type by name, which the rule against branching on type
// names in game logic, vesseltest, does not cover.)
{ const v0 = S.fleet && S.fleet.length ? S.fleet[0] : null, on = fn => v0 ? withVessel(v0, fn) : fn(), OLD = 'skiff', isOld = t => !t || t === OLD;
  if ((!S.owned || (S.owned.length === 1 && isOld(S.owned[0]))) && on(() => isOld(S.boat.type))){
    let back = 0;
    on(() => { const b = S.boat; b.type = 'trebat'; b.fuel = Math.min(b.fuel || 0, VESSELS.trebat.fuelCap); b.engH = 0; b.svcAt = 0;
      for (const q of Object.keys(EQUIP)) if (S.equip && S.equip[q] && !equipFits(q, 'trebat')){ back += EQUIP[q].price * (EQUIP[q].multi ? S.equip[q] : 1); S.equip[q] = EQUIP[q].multi ? 0 : false; } });
    S.owned = ['trebat']; book('redskap', back, 'Utstyr tilbakebetalt', 'Equipment paid back');
    log('Aluminiumsskiffen kan nå bare kjøpes på verftet. Du har fått fars gamle trebåt i stedet' + (back ? ', og ' + kr(back) + ' tilbake for utstyr som ikke passer i henne' : '') + '.',
      'The aluminium skiff can now only be bought at the yard. You have Father’s old wooden boat instead' + (back ? ', and ' + kr(back) + ' back for gear that does not fit her' : '') + '.');
  } }
{ const fixW = w => { if (w && w.port){ const q = portById(w.port); if (q){ w.x = q.p.x; w.y = q.p.y; } } };
  if (S.boat.status === 'port'){ const q = portById(S.boat.port); S.boat.pos = {x:q.p.x, y:q.p.y}; S.trail = [{x:q.p.x, y:q.p.y, port:q.id}]; }
  (S.draft || []).forEach(fixW); if (S.plan) S.plan.wps.forEach(fixW); S.trail.forEach(fixW);
  // real coastline: anything that now sits on land is brought back to a harbour
  if ((S.draft || []).some(w => isLand(w))) S.draft = [];
  const bb = S.boat, onLand = bb.status !== 'port' && isLand(bb.pos), badPlan = S.plan && S.plan.wps.slice(S.plan.idx).some((w, i, a) => isLand(w) || !legClear(i ? a[i - 1] : bb.pos, w));
  if (onLand || badPlan){
    const q = PORTS.slice().sort((a, b) => dist(a.p, bb.pos) - dist(b.p, bb.pos))[0];
    S.plan = null; bb.status = 'port'; bb.port = q.id; bb.pos = {x:q.p.x, y:q.p.y}; bb.v = 0; S.trail = [{x:q.p.x, y:q.p.y, port:q.id}];
    log('Kartet har fått ekte kystlinje. Båten er flyttet til ' + q.name + '.', 'The chart now has the real coastline. The boat was moved to ' + q.name + '.');
  } }
{ const d = newState(); for (const k of ['equip', 'crew', 'loan', 'member', 'msgs', 'sales', 'order', 'owned', 'stock', 'marks', 'jobs', 'prep', 'tripBuff', 'draftDep', 'navrows', 'company', 'boatName', 'tut', 'incidents', 'lore', 'tattoos', 'tat', 'sets', 'gseq', 'ops', 'lic', 'qseed', 'haill', 'pubE', 'target', 'streak', 'clothes', 'orders', 'rep', 'bors', 'cevt', 'workLog']) if (S[k] === undefined || (k === 'stock' && !S[k])) S[k] = d[k];
  if (!S.fm) S.fm = fmInit();   // blad B from the landing notes kept, and at once for a company that already has a closed-group right
  if (!adminOk()){ S.mult = 1; if (S.adm) S.adm.noEnergy = false; }
  // one clock for everyone (core/01-world.js): no pace of one's own, and the world's seed for the quota years, stocks and sellers
  if (WCLOCK.on){ S.mult = 1; S.qseed = WORLD_SEED; }   // the Admin app's pace and energy are only Jonas's (cloud adminOk)
  if (!S.boat.type) S.boat.type = 'trebat'; if (S.boat.engH === undefined){ S.boat.engH = 0; S.boat.svcAt = 0; }
  delete S.settings.bleed;   // never used; the fish is always bled at the rail
  if (typeof S.tut === 'number') S.tut = 0;   // saves from before «Første tur» are not sent through it
  // 06.11.2026 (Ø11.5, V6 A, Jonas 28.10.2026): what the rules ask for follows the boat; a save from before gets what is missing, free
  // (applyVessel keeps it so from here on: core/02-species-gear.js reqFill)
  { const got = new Set(), fill = (eq, b) => { if (eq && b && b.type) for (const k of reqFill(eq, b.type)) got.add(k); };
    fill(S.equip, S.boat); for (const v of S.fleet || []) if (v.equip && v.boat) fill(v.equip, v.boat);
    if (got.size){ const nm = l => [...got].map(k => EQUIP[k].name[l]).join(', ');
      log('Påbudt utstyr følger nå båten, og det som manglet, er montert gratis: ' + nm('no') + '.', 'Required equipment now comes with the boat, and what was missing has been fitted free: ' + nm('en') + '.'); } }
  karRefund(); applyVessel(); if (!S.settings.chart) S.settings.chart = S.settings.plotter && S.equip.plotter ? 'fish' : 'nav'; if (S.settings.heatSp && !HEAT.sp.includes(S.settings.heatSp)) delete S.settings.heatSp;
  if (S.boat.status === 'port' && portById(S.boat.port)){ const pp = portById(S.boat.port).p; S.boat.pos = {x:pp.x, y:pp.y}; }
  if (S.fleet && S.fleet.length){ ensureFleet(); for (const v of S.fleet) withVessel(v, () => { if (S.boat.status === 'port' && portById(S.boat.port)){ const pp = portById(S.boat.port).p; S.boat.pos = {x:pp.x, y:pp.y}; } }); } else ensureFleet(); }
// every vessel gets its gear locker (saves from before passive gear have none, also on vessels that are not bound)
for (const v of S.fleet) withVessel(v, () => { if (!S.pgear) S.pgear = newPGear(); });
// 08.10.2026: one pot only, the big one («Krabbeteiner»); small pots aboard and in the sea become big ones
// 08.10.2026: gear care (core/10b-gearcare.js): the line's condition and hooks, the pots' condition, hooks in the store and the jig sets
for (const v of S.fleet) withVessel(v, () => { if (S.pgear) careInit(S.pgear); });
// 08.10.2026: the electric hauler is gone; whoever had one gets a line hauler and a pot hauler instead (the same jobs)
if (S.equip && S.equip.elhaler){ S.equip.linehaler = true; S.equip.teinehaler = true; }
if (S.equip) delete S.equip.elhaler;
// 08.10.2026: the yard's «Klargjøring til neste tur» jobs are gone; one still queued in an old save is dropped
for (const v of S.fleet) withVessel(v, () => { if (S.jobs) S.jobs = S.jobs.filter(j => j.kind !== 'prep'); S.prep = {}; S.tripBuff = null; });
for (const v of S.fleet) withVessel(v, () => { const p = S.pgear.pots; if (p.small){ p.big = (p.big || 0) + p.small; } delete p.small; if (!p.big) p.big = 0; });
for (const s of S.sets || []) if (s.kind === 'teine') s.pot = 'big';
// «Kaffe på kaia» was replaced by the daily login bonus on 01.10.2026: unused free pub rounds are paid out, borrowed deck tubs
// and the clean-hull bonus are gone, and the bonus starts at zero
if (S.daily){ const v = S.daily.pubV || 0; if (v > 0){ book('annet', v * PUB_COST, 'Ubrukte pubrunder', 'Unused pub rounds'); log('Kaffe på kaia er lagt ned. Du fikk ' + kr(v * PUB_COST) + ' for ' + v + (v > 1 ? ' ubrukte pubrunder.' : ' ubrukt pubrunde.'), '«Coffee on the quay» is gone. You got ' + kr(v * PUB_COST) + ' for ' + v + ' unused pub round' + (v > 1 ? 's.' : '.')); } delete S.daily; }
// trim was for good and free to try until 05.10.2026; now it is for a while and bought (core BOOSTS): the old fittings go
for (const v of S.fleet || []) if (v.boat) delete v.boat.boost; if (S.boat) delete S.boat.boost;
if (!S.haillInv) S.haillInv = {haill:0, luksus:0}; if (S.haill && !HAILL[S.haill.type]) S.haill.type = 'haill';   // the halibut luck is gone (04.10.2026)
// brown crab is out of the game (04.10.2026): what an old save has in its holds goes, and the key now means king crab
if (!S.kc){ S.kc = 1; let kg = 0;
  for (const v of S.fleet) withVessel(v, () => { kg += S.hold.reduce((a, x) => a + (x.sp === 'krabbe' ? x.kg : 0), 0); S.hold = S.hold.filter(x => x.sp !== 'krabbe'); });
  if (kg > 0.05) log('Taskekrabben er tatt ut av spillet. ' + fmt(kg, 1) + ' kg i lasten er fjernet. Teinene fisker nå kongekrabbe.', 'Brown crab is out of the game. ' + fmt(kg, 1) + ' kg in the hold has gone. The pots now fish king crab.'); }
delete S.tubs; delete S.clean; delete S.rodN; delete S.rodBest; for (const v of S.fleet || []){ delete v.tubs; delete v.clean; }
// before 01.10.2026 a hauler fitting had no length and never finished (until NaN, saved as null), which kept the boat in port
for (const v of S.fleet) withVessel(v, () => { for (const j of S.jobs || []) jobOk(j); if (S.plan && S.plan.depAt != null && !Number.isFinite(S.plan.depAt)) S.plan.depAt = S.t; });
// a way round shallow water that was being found when the game was closed is never answered: the next minute finds it again (#97)
for (const v of S.fleet) withVessel(v, () => { if (S.plan && S.plan.replan) S.plan.replan = null; });
// before 30.09.2026 a standing-plan trip with you aboard counted as the hired skipper's, and the landing lost its access
for (const v of S.fleet) withVessel(v, () => { const b = S.boat; if (S.plan && S.plan.ops && (b.status !== 'port' || b.land) && meAboard()) S.tripOwner = true; });
view.cx = HOME.x0 + MAP_W * 0.56; view.cy = HOME.y0 + MAP_H * 0.5;
{ const bp = S.boat.pos; if (bp.x < HOME.x0 || bp.x > HOME.x1 || bp.y < HOME.y0 || bp.y > HOME.y1){ view.cx = bp.x; view.cy = bp.y; } }   // a boat away from Senja: the chart round her
{ const r = svg.getBoundingClientRect(); const asp = (r.width / r.height) || 1; view.z = clamp(MAP_H * asp / MAP_W, 0.8, 1.6); }
refreshAll();
if (!S.intro) showIntro();
else if (!S.boatName) showIntro(true);
else { S.opens = (S.opens || 0) + 1; setTimeout(nameNudge, 8000); }   // the openings of a started game (registering, naming the boat: ui/10f-cloud.js)
// the badges: a game played before them is ticked for what it has done, and the gifts come once the screen is free (core/09f-merker.js)
achSeed(); setTimeout(() => achCheck(), 6000);
// the catch-up waits for the simulation's data (simReady below), so the time away is played with the real depths
AWAY = !S.intro || !S.boatName ? 0 : awayMs > 6000 ? awayMs : 0;
if (WCLOCK.on && S.intro && S.boatName && worldT() - S.t > 1) AWAY = Math.max(AWAY, 6001);   // behind the world's clock: catchUp plays the gap
lastWall = Date.now();
streakTouch();
refreshAll();
document.addEventListener('visibilitychange', () => { if (!document.hidden && streakTouch()){ save(); refreshAll(); } });
INSTR.show(); tab = 'route'; setBodyView(true);
// G3 comes from a later <script> (view3d.js): the clock starts when the whole page is read (it may be read already)
// the 3D view starts after Father's letter is put down: building it takes the main thread for seconds, and the letter's animation
// stood still meanwhile (ui/08b-letter.js)
// (the letter's time for first3d: when it is first seen here, within the 0.4 s of the look)
mapOnReady(() => { setInterval(tick, 200); const go3d = () => { const lt = document.getElementById('letter'); if (lt && !B3D.lt){ B3D.ltAt = performance.now(); B3D.lt = B3D.ltAt - bootAway(); if (document.hidden) B3D.lhAt = B3D.ltAt; }
  if (lt || document.getElementById('startPick')) setTimeout(go3d, 400); else G3.show(true, true); }; go3d(); });
// the simulation's data are in (bootMap), so the clock may run, and the time away is played
SIMREADY = true; CONT_D = null; renderBase(); panelDirty = true;
if (AWAY){ catchUp(AWAY + Date.now() - BOOT_T); AWAY = 0; refreshAll(); } lastWall = Date.now();
bootgSay();   // the safe start's line in the log (BOOTG above), at the time the player is back
loadRoads().then(r => { ROADS = r; scheduleStatic(); if (g3Live()) G3.roadsReady(); }).catch(e => console.error(e));
loadFine().then(f => { FINE = f; if (g3Live()) G3.fineReady(); }).catch(e => console.error(e));
}
bootMap().then(() => { bootDataLate(); bootStep('innlogging og skyen'); return cloudGate(); }).then(() => { bootStep('kartet rundt lagringen'); return bootMapLoad(); }).then(() => { bootStep('spillet bygges'); bootgIn(); bootGame(); bootDone(); cloudHooks(); cloudStart(); try { INSTALL.start(); } catch (e){} try { UPDATE.start(); } catch (e){} try { sessionStorage.removeItem('dsb_needpk'); } catch (e){} }).catch(e => { console.error(e);
  // a read in a pack that is not in: remember the pack and start again with it, a few times at most, before the player sees the error
  try { if (e && e.pk && e.pk.file){ const L = JSON.parse(sessionStorage.getItem('dsb_needpk') || '[]'); if (L.length < 8 && !L.includes(e.pk.file)){ L.push(e.pk.file); sessionStorage.setItem('dsb_needpk', JSON.stringify(L)); location.reload(); return; } } } catch (e2){} bootFail(e); });
// A start that fails never leaves the player stuck (Jonas 08.10.2026): what went wrong goes to the admin's error list, and the player can try
// again, start in safe mode (no 3D) or take back the game this device had before (the one now is kept as the one before, so it can be
// had again the same way)
function bootFail(e){
  const msg = String(e && e.message || e), en = !/^no/.test((navigator.language || 'no').toLowerCase()) && !/^nb|^nn/.test((navigator.language || '').toLowerCase()), L = (no, eng) => en ? eng : no;
  BOOTW.done = true;   // (not stuck: it stopped, and says so)
  bootgOut();   // (an error with the dialog, not a lock: BOOTG does not count it; each button below starts its count again)
  try { if (typeof cloudErr === 'function') cloudErr('boot: ' + msg, 'boot', e && e.stack); if (typeof errStart === 'function') errStart(); } catch (e2){}   // (the game is not coming: what waited for it goes now)
  const safe = /safe/.test(location.hash), prev = (() => { try { return !!localStorage.getItem(KEY_PREV); } catch (e2){ return false; } })();
  loaderGone();   // the loading screen lies over the dialog otherwise
  const m = document.getElementById('modal'); if (!m) return; m.hidden = false;
  m.innerHTML = '<div class="box"><h2>' + L('Spillet startet ikke', 'The game did not start') + '</h2><p class="note">' + msg.replace(/</g, '&lt;') + '</p>' +
    '<p>' + L('Feilen er sendt til oss. Lagringen din er trygg.', 'The error has been sent to us. Your save is safe.') + '</p><div class="btns">' +
    '<button id="bfRetry" class="btn">' + L('Prøv igjen', 'Try again') + '</button>' +
    (safe ? '' : '<button id="bfSafe" class="btn">' + L('Start i sikker modus (uten 3D)', 'Start in safe mode (no 3D)') + '</button>') +
    (prev ? '<button id="bfPrev" class="btn">' + L('Hent forrige lagring', 'Take back the save before') + '</button>' : '') + '</div></div>';
  const on = (id, f) => { const b = document.getElementById(id); if (b) b.onclick = f; };
  on('bfRetry', () => { bootgClear(); try { sessionStorage.removeItem('dsb_needpk'); } catch (e2){} location.reload(); });
  on('bfSafe', () => { bootgClear({fails:0, safeAsk:true}); location.hash = (location.hash ? location.hash + ',' : '#') + 'safe,no3d'; location.reload(); });
  on('bfPrev', () => { bootgClear(); try { const cur = localStorage.getItem(KEY), pv = localStorage.getItem(KEY_PREV); if (pv){ localStorage.setItem(KEY, pv); if (cur) localStorage.setItem(KEY_PREV, cur); tabMark(); sessionStorage.setItem('dsb_force', '1'); } } catch (e2){} location.reload(); });
}
