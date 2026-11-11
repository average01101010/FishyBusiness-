// ===== THE WATCHDOG (L1d, 10.11.2026, docs/planer/lansering-plan.md; Jonas, valg 16 V4 B: a push when the game is down or hangs) =====
// A page whose main thread stands still cannot say so itself: hangWatch (10f-cloud.js) tells of a hang only when the page is back, and
// «Oppstarten står fast» of a locked start only at the next start (11-boot.js). So a small Web Worker, made from a blob: as the game's
// other workers, gets a sign of life from the page every second. When the page was on the screen and the signs stop for WD_LIMIT
// seconds, the worker itself sends «Spillet hang i N s · where» to tm_error with fetch (the worker does not hang), with the version,
// the channel and where in the start or the game it was; when the page answers again it sends «Spillet hang i N s, kom tilbake».
// err_alert pushes the first to the admin (supabase/migrations/20261110190000_err_kanal_uptime.sql).
// Never a hang: the page in the background or the screen off (the page says so first, and the signs then mean nothing), the device
// asleep or the page frozen (the worker's own timer comes late then too, and that time is taken out), another device having the game
// (TAB.lost, TAB.held), and the browser's own confirm/prompt/alert, which hold the main thread until the player answers. Nothing here
// stops the game's time or its work: the watchdog only listens. At most one message for each hang (and the one when it came back),
// and WD_MAX hangs a page. The cost on the main thread is one postMessage a second. Only where the cloud is (not the tests without
// it, not the artifact); #nowd turns it off.
const WD = {w:null, quiet:false, metaAt:0, tokAt:0};
const WD_LIMIT = 15, WD_MAX = 5;
const WD_SRC = `
let cfg = null, meta = {}, tok = null, where = '?', on = false, last = Date.now(), tick = Date.now(), hang = null, sent = 0;
function send(msg, extra){
  if (!cfg) return;
  const body = {msg:msg, src:'watchdog', stack:JSON.stringify(extra), meta:meta};
  const go = t => fetch(cfg.url + '/rest/v1/rpc/tm_error', {method:'POST',
    headers:Object.assign({'Content-Type':'application/json', apikey:cfg.key}, t ? {Authorization:'Bearer ' + t} : {}), body:JSON.stringify(body)});
  // (a token that has run out while the page stood still: once more without it; what cannot be sent goes back to the page to keep)
  go(tok || cfg.bearer).then(r => r.ok || !tok || (r.status !== 401 && r.status !== 403) ? r : go(cfg.bearer)).then(r => { if (!r.ok) throw 0; }).catch(() => postMessage({keep:body}));
}
const info = s => ({s:s, where:hang.where, version:meta.version || '', ch:meta.ch || ''});
onmessage = e => {
  const d = e.data || {}, n = Date.now();
  if (d.cfg) cfg = d.cfg;
  if (d.meta) meta = d.meta;
  if ('tok' in d) tok = d.tok;
  if (!('on' in d)) return;
  if (hang){ const s = Math.round((n - hang.t0) / 1000); send('Spillet hang i ' + s + ' s, kom tilbake · ' + hang.where, info(s)); hang = null; }
  last = n; on = !!d.on; if (d.w) where = d.w;
};
setInterval(() => {
  const n = Date.now(), gap = n - tick; tick = n;
  if (gap > 5000){ last += gap; if (hang) hang.t0 += gap; }   // the worker stood still too (the device slept, the page was frozen): not the page's hang
  if (!cfg || !on || hang || sent >= cfg.max || n - last < cfg.limit * 1000) return;
  hang = {t0:last, where:where}; sent++;
  const s = Math.round((n - last) / 1000);
  send('Spillet hang i ' + s + ' s · ' + where, info(s));
}, 1000);`;
function wdWhere(){
  try {
    if (typeof BOOTW !== 'undefined' && !BOOTW.done) return 'oppstart: ' + BOOTW.stage;
    const g = typeof G3 !== 'undefined' ? G3 : null, s = cloudS();
    return (g && g.isActive && g.isActive() ? '3d' : 'kart') + (s && s.boat && s.boat.status ? ' · ' + s.boat.status : '');
  } catch (e){ return '?'; }
}
function wdBeat(off){
  const w = WD.w; if (!w) return;
  try {
    const now = Date.now(), m = {on:!off && !WD.quiet && !document.hidden && !(typeof TAB !== 'undefined' && (TAB.lost || TAB.held)), w:wdWhere()};
    if (now - WD.metaAt > 30000){
      WD.metaAt = now;
      // (the device only when it has been asked for already: asking makes a WebGL context, and the start is not the time for that)
      const meta = {}; try { Object.assign(meta, cloudMeta()); } catch (e){} try { if (CLOUD_GPU !== null) Object.assign(meta, cloudDev()); } catch (e){}
      m.meta = meta;
    }
    if (now - WD.tokAt > 240000 && CLOUD.on){ WD.tokAt = now; cloudToken().then(t => { try { w.postMessage({tok:t || null}); } catch (e){} }); }
    w.postMessage(m);
  } catch (e){}
}
(function wdStart(){
  if (typeof Worker === 'undefined' || typeof document === 'undefined' || !cloudOn() || /nowd/.test(location.hash)) return;
  try {
    const c = CLOUD_CFG, w = new Worker(URL.createObjectURL(new Blob([WD_SRC], {type:'text/javascript'})));
    // no network: kept and sent later (errFlush), marked so that an old hang is not told as one that happens now (err_alert)
    w.onmessage = e => { const d = e.data; if (d && d.keep) errKeep([{...d.keep, msg:'Sendt sent · ' + d.keep.msg}]); };
    w.onerror = () => { WD.w = null; };
    w.postMessage({cfg:{url:c.supabaseUrl.replace(/\/$/, ''), key:c.supabaseAnon, bearer:/^eyJ/.test(c.supabaseAnon) ? c.supabaseAnon : null, limit:WD_LIMIT, max:WD_MAX}});
    WD.w = w;
  } catch (e){ return; }
  wdBeat(); setInterval(wdBeat, 1000);
  // (on the window in the capture phase: before the game's own listeners, which play the time away when the page is back and are
  // where a hang is most likely)
  addEventListener('visibilitychange', () => wdBeat(), true);
  addEventListener('pagehide', () => wdBeat(true));
  addEventListener('pageshow', () => wdBeat());
  document.addEventListener('freeze', () => wdBeat(true));
  document.addEventListener('resume', () => wdBeat());
  // the browser's own dialogs hold the main thread until the player answers: the watchdog is told before, and again after
  for (const k of ['confirm', 'prompt', 'alert']){
    const f = window[k]; if (typeof f !== 'function') continue;
    window[k] = function(){ WD.quiet = true; wdBeat(); try { return f.apply(window, arguments); } finally { WD.quiet = false; wdBeat(); } };
  }
})();
