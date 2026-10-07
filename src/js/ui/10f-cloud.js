// ===== THE CLOUD (04.10.2026; docs/lansering.md E and F) =====
// In the app on detstorebla.no, with src/data/cloud.json filled in and the page on one of its hosts: sign-in with WorkOS (AuthKit,
// required, the user's choice), the save kept in Supabase as well (cloudSync: never one game over another without the player's word), and the usage measurements the player has
// consented to (asked once; under 13 a yes does not count). Without the keys, or on another host (the artifact, the tests), all of it
// is off and the game starts as before. Supabase is reached by fetch on its REST API, only through the functions in
// supabase/migrations/ (security definer: each checks the player and the consent); the tables themselves are the admin's to read.
const CLOUD_CFG = (typeof window !== 'undefined' && window.DSB_CLOUD) || /*@include(data/cloud.json)*/null;
const CLOUD = {on:false, ak:null, user:null, consent:null, sid:null, q:[], active:0, sent:0, lastSave:0, neg:null, trip:null, errs:0, errSeen:{}, fps:[], owned:[], admin:false};
const CLOUD_SIGNED = 'dsb_signed';   // set after a sign-in, so the game can start offline on this device later
function cloudOn(){
  const c = CLOUD_CFG; if (!c || !c.supabaseUrl || !c.supabaseAnon || !c.workosClientId || typeof location === 'undefined') return false;
  return (c.hosts || []).includes(location.hostname) && !/nocloud/.test(location.hash);
}
// the game's Admin app (ui/05-phone.js) only on Jonas's account (05.10.2026, «admin-appen på telefonen skal kun være tilgjengelig på
// min konto»): on the cloud's hosts only for the account flagged in the database (players.game_admin, told by tm_hello; hidden there
// also with #nocloud and offline), never on the public copy on GitHub Pages; the artifact (his own, private) and local test builds
// keep it. The game runs in the browser, so this hides the tools from players; what must hold in a shared world is checked on the server.
function adminOk(){
  const h = typeof location !== 'undefined' ? location.hostname : '';
  return !(/\.github\.io$/i.test(h) || (CLOUD_CFG && (CLOUD_CFG.hosts || []).includes(h))) || CLOUD.admin === true;
}
function cloudS(){ try { return S; } catch (e){ return null; } }
const cloudL = (no, en) => { const s = cloudS(); return s && s.lang === 'en' ? en : no; };
// the device, for the frame rate and the errors (supabase/migrations/20261006160000_device_data.sql; Jonas 06.10.2026: «optimalisere
// spillet for så mange enheter som mulig»): the graphics chip, asked once of a small WebGL context that is let go at once (so it is known
// also where the 3D view failed), the cores and memory the browser tells, the screen, and the 3D level and view now. Never who.
let CLOUD_GPU = null;
function cloudGpu(){
  if (CLOUD_GPU !== null) return CLOUD_GPU; CLOUD_GPU = '';
  try { const c = document.createElement('canvas'), gl = c.getContext('webgl') || c.getContext('experimental-webgl');
    if (gl){ const d = gl.getExtension('WEBGL_debug_renderer_info'); CLOUD_GPU = String((d && gl.getParameter(d.UNMASKED_RENDERER_WEBGL)) || gl.getParameter(gl.RENDERER) || '').slice(0, 80);
      const l = gl.getExtension('WEBGL_lose_context'); if (l) l.loseContext(); } } catch (e){}
  return CLOUD_GPU;
}
function cloudDev(){
  const g = typeof G3 !== 'undefined' ? G3 : null, q = g && g.quality ? g.quality() : {}, s = window.screen || {};
  return {gpu:cloudGpu(), cores:navigator.hardwareConcurrency || null, mem:navigator.deviceMemory || null,
    scr:Math.round(s.width || innerWidth) + 'x' + Math.round(s.height || innerHeight) + '@' + Math.round((devicePixelRatio || 1) * 10) / 10,
    lvl:q.lvl == null ? null : q.lvl, view:g && g.isActive && g.isActive() ? '3d' : 'kart'};
}
function cloudMeta(){
  // at the gate the game is not loaded yet (S comes in bootGame)
  const S = cloudS() || {}, ua = navigator.userAgent, b = S.boat || {};
  const browser = /SamsungBrowser/.test(ua) ? 'samsung' : /Edg\//.test(ua) ? 'edge' : /Firefox\//.test(ua) ? 'firefox' : /Chrome\//.test(ua) ? 'chrome' : /Safari\//.test(ua) ? 'safari' : 'other';
  const platform = /Android/.test(ua) ? 'android' : /iPhone|iPad|iPod/.test(ua) ? 'ios' : /Windows/.test(ua) ? 'windows' : /Mac OS X/.test(ua) ? 'mac' : /Linux/.test(ua) ? 'linux' : 'other';
  const pwa = !!(window.matchMedia && (matchMedia('(display-mode: standalone)').matches || matchMedia('(display-mode: fullscreen)').matches));
  const fleet = S.fleet || [], VES = typeof VESSELS !== 'undefined' ? VESSELS : {};
  return {version:(document.querySelector('meta[name=dsb-version]') || {}).content || 'dev', browser, platform, pwa, lang:S.lang, tz:(Intl.DateTimeFormat().resolvedOptions() || {}).timeZone,
    quality:(S.settings && S.settings.q3d) || 'auto', boat:b.type, home:b.port || null, cash:Math.round(S.cash || 0), fleet:fleet.length || 1,
    fleetValue:(() => { try { return Math.round(fleet.length ? fleet.reduce((a, v) => a + (((VES[(vget(v, 'boat') || {}).type] || {}).price) || 0), 0) : ((VES[b.type] || {}).price || 0)); } catch (e){ return null; } })(),
    streak:(S.streak && S.streak.days) || 0, gameDays:Math.floor((S.t || 0) / 1440), sid:CLOUD.sid};
}

// ---------- talking to Supabase ----------
async function cloudToken(){ try { return CLOUD.guest ? await guestToken() : CLOUD.ak ? await CLOUD.ak.getAccessToken() : null; } catch (e){ return null; } }
// ---------- guests (06.10.2026; Jonas: «nye brukere ikke trenger å logge inn til å starte med», the account after the third landing) ----------
// A new player starts at the envelope with no sign-in: a Supabase anonymous sign-in in the background (supabase/migrations/
// 20261006180000_guest.sql), so the guest is in the shared world like everyone else and the game is kept in the cloud too. Registering
// (WorkOS) takes it all along: guest_claim() gives a one-time code here, kept on the device over the sign-in, and guest_merge(code) moves
// everything to the account. A device that has been signed in before (CLOUD_SIGNED) meets the gate as before.
const GUEST_KEY = 'dsb_guest', GUEST_CODE = 'dsb_guest_code', REG_GIFT = 'dsb_reg_gift', GUEST_LANDS = 3;
function guestGet(){ try { return JSON.parse(localStorage.getItem(GUEST_KEY) || 'null'); } catch (e){ return null; } }
async function guestAuth(path, body){
  const c = CLOUD_CFG, r = await fetch(c.supabaseUrl.replace(/\/$/, '') + '/auth/v1/' + path, {method:'POST', headers:{'Content-Type':'application/json', apikey:c.supabaseAnon}, body:JSON.stringify(body)});
  if (!r.ok){ const e = new Error('guest ' + r.status); e.status = r.status; throw e; }
  const j = await r.json(), g = {at:j.access_token, rt:j.refresh_token, exp:j.expires_at || Math.round(Date.now() / 1000 + (j.expires_in || 3600)), id:(j.user || {}).id};
  if (!g.at || !g.id) throw new Error('guest token');
  try { localStorage.setItem(GUEST_KEY, JSON.stringify(g)); } catch (e){}
  return g;
}
async function guestToken(){
  let g = guestGet(); if (!g) return null;
  if (g.exp - Date.now() / 1000 < 90){
    try { g = await guestAuth('token?grant_type=refresh_token', {refresh_token:g.rt}); }
    catch (e){ if (e.status >= 400 && e.status < 500){ g = await guestAuth('signup', {data:{}}); CLOUD.user = {id:g.id, guest:true, email:''}; } else return g.at; }   // the refresh gone: a new guest (the game is on the device)
  }
  return g.at;
}
async function guestStart(){
  let g = guestGet();
  if (!g) g = await guestAuth('signup', {data:{}}); else { await guestToken(); g = guestGet(); }
  CLOUD.guest = true; CLOUD.user = {id:g.id, guest:true, email:''};
}
const isGuest = () => !!(CLOUD.on && CLOUD.guest);
async function cloudRpc(fn, args, opt){
  const c = CLOUD_CFG, tok = opt && opt.anon ? null : await cloudToken();
  // a publishable key (sb_publishable_…) is not a JWT and goes only as apikey; the old anon key (a JWT) also as the bearer
  const bearer = tok || (/^eyJ/.test(c.supabaseAnon) ? c.supabaseAnon : null);
  const r = await fetch(c.supabaseUrl.replace(/\/$/, '') + '/rest/v1/rpc/' + fn, {method:'POST', keepalive:!!(opt && opt.keep),
    headers:{'Content-Type':'application/json', apikey:c.supabaseAnon, ...(bearer ? {Authorization:'Bearer ' + bearer} : {})}, body:JSON.stringify(args || {})});
  if (!r.ok) throw new Error(fn + ' ' + r.status);
  const t = await r.text(); return t ? JSON.parse(t) : null;
}

// ---------- the gate: before the game starts ----------
function cloudGateShow(html){
  // the same picture and type as the loading screen (styles.css): the name over the sky, the text and the buttons in a card over the water
  let g = document.getElementById('cloudGate');
  if (!g){ g = document.createElement('div'); g.id = 'cloudGate'; g.className = 'dsb-bg'; document.body.appendChild(g); }
  g.innerHTML = '<div class="ld-top"><span class="ld-k">' + cloudL('Kystfiske langs norskekysten', 'Coastal fishing in Norway') + '</span><h1 class="ld-t">Det Store Blå</h1></div><div class="cg-card">' + html + '</div>';
  return g;
}
function cloudGateHide(){ const g = document.getElementById('cloudGate'); if (g) g.remove(); }
const cloudBtn = (id, label, primary) => '<button id="' + id + '" type="button" class="cg-btn' + (primary ? ' pri' : '') + '">' + label + '</button>';
// the world's clock from the page's own server (core/01-world.js): the Date of a fresh HEAD of the page, to the second, against the
// middle of the round trip, so a device with a wrong clock is on the same minute as everyone else; offline the device's own clock
async function worldSync(){
  if (!WCLOCK.on || typeof fetch === 'undefined' || !/^https?:/.test(location.protocol)) return;
  try { const t0 = Date.now(), r = await fetch(location.origin + location.pathname + '?clock=' + t0, {method:'HEAD', cache:'no-store'}), t1 = Date.now(), d = Date.parse(r.headers.get('Date') || '');
    if (d && t1 - t0 < 5000) WCLOCK.off = d + 500 - (t0 + t1) / 2; } catch (e){}
}
async function cloudGate(){
  await worldSync();
  if (!cloudOn()) return;
  CLOUD.on = true;
  const c = CLOUD_CFG;
  try {
    const AK = window.DSB_AUTHKIT || (typeof AuthKit !== 'undefined' ? AuthKit : null);   // DSB_AUTHKIT: a stand-in for tests
    if (!AK) throw new Error('AuthKit missing');
    CLOUD.ak = await AK.createClient(c.workosClientId, {redirectUri:location.origin + location.pathname, apiHostname:c.workosApiHostname || undefined,
      devMode:c.workosApiHostname ? false : c.workosDevMode !== false, onRedirectCallback:() => history.replaceState(null, '', location.pathname)});
    CLOUD.user = CLOUD.ak.getUser();
  } catch (e){
    console.error(e);
    // no network: a device that has signed in before plays on with its own save, and the cloud waits
    if (localStorage.getItem(CLOUD_SIGNED)){ CLOUD.on = false; return; }
    cloudGateShow('<p>' + cloudL('Innloggingen svarer ikke. Sjekk nettet og prøv igjen.', 'Sign-in is not answering. Check the network and try again.') + '</p><div class="cg-btns">' + cloudBtn('cgRetry', cloudL('Prøv igjen', 'Try again'), true) + '</div>');
    document.getElementById('cgRetry').onclick = () => location.reload();
    return new Promise(() => {});
  }
  // a new player: the envelope at once, as a guest (a device signed in before meets the gate below)
  if (!CLOUD.user && !localStorage.getItem(CLOUD_SIGNED)){
    try { await guestStart(); }
    catch (e){ console.error(e); CLOUD.on = false; return; }   // no anonymous sign-in to be had (no network): the game on the device alone
    try { const h = await cloudRpc('tm_hello', {meta:cloudMeta()}); CLOUD.consent = h ? h.consent : null; } catch (e){ console.error(e); }
    return;
  }
  if (!CLOUD.user){
    cloudGateShow('<p class="cg-lead">' + cloudL('Fars gamle naust venter. Båten ligger fortøyd.', 'Father’s old boathouse is waiting. The boat lies moored.') + '</p><p class="cg-small">' +
      cloudL('Logg inn med Google, Apple eller e-post for å spille. Spillet lagres på kontoen din, så du kan fortsette på en annen enhet.', 'Sign in with Google, Apple or e-mail to play. The game is saved to your account, so you can go on from another device.') + '</p>' +
      '<div class="cg-btns">' + cloudBtn('cgIn', cloudL('Logg inn', 'Sign in'), true) + cloudBtn('cgUp', cloudL('Lag konto', 'Create account')) + '</div>' +
      '<p class="cg-fine">' + cloudL('Når du lager konto, godtar du <a href="vilkar.html">vilkårene</a>. Les hvordan vi behandler opplysninger i <a href="personvern.html">personvernerklæringen</a>.',
        'By creating an account you accept the <a href="vilkar.html">terms</a>. Read how we handle your data in the <a href="personvern.html">privacy policy</a>.') + '</p>');
    document.getElementById('cgIn').onclick = () => CLOUD.ak.signIn();
    document.getElementById('cgUp').onclick = () => CLOUD.ak.signUp();
    return new Promise(() => {});
  }
  localStorage.setItem(CLOUD_SIGNED, '1');
  // back from registering as a guest: what the guest had moves to the account first, so the save below is the guest's game
  const gc = (() => { try { return JSON.parse(localStorage.getItem(GUEST_CODE) || 'null'); } catch (e){ return null; } })();
  if (gc && gc.code){
    try { const m = await cloudRpc('guest_merge', {code:gc.code});
      if (m && m.merged && m.save){ const gs = localStorage.getItem('dsb_sync_' + gc.gid); if (gs) localStorage.setItem(syncKey(), gs); } } catch (e){ console.error(e); }
    try { localStorage.setItem(REG_GIFT, '1'); localStorage.removeItem(GUEST_CODE); localStorage.removeItem(GUEST_KEY); if (gc.gid) localStorage.removeItem('dsb_sync_' + gc.gid); } catch (e){}
  }
  try {
    const h = await cloudRpc('tm_hello', {meta:cloudMeta()}); CLOUD.consent = h ? h.consent : null; CLOUD.owned = (h && h.owned) || []; CLOUD.admin = !!(h && h.admin === true);
    // the save: which of the game here and the account's goes on (cloudSync)
    if (sessionStorage.getItem('dsb_force')){ sessionStorage.removeItem('dsb_force'); CLOUD.forceNext = true; }   // a game taken back (cloudRestore)
    const cs = await cloudRpc('save_get', {});
    if (cs && cs.data) await cloudSync(cs);
  } catch (e){ console.error(e); }
  cloudGateHide();
}

// ---------- after the start: hooks, measurements, the save ----------
function cloudStart(){
  if (!CLOUD.on) return;
  window.addEventListener('error', e => { cloudErr(e.message, (e.filename || '') + ':' + (e.lineno || ''), e.error && e.error.stack);
    if (e.error && typeof FEEDBACK !== 'undefined') setTimeout(() => FEEDBACK.nudge('err'), 2000); });   // what the player saw helps (06e-feedback.js)
  window.addEventListener('unhandledrejection', e => cloudErr(String(e.reason && e.reason.message || e.reason), 'promise', e.reason && e.reason.stack));
  // the question waits until the first-start dialog (company and boat names) is done and no other dialog is open
  if (CLOUD.consent == null){ const iv = setInterval(() => { const m = document.getElementById('modal'); if (S.intro && S.boatName && m && m.hidden){ clearInterval(iv); setTimeout(cloudAsk, 1500); } }, 2000); }
  else if (CLOUD.consent) cloudBegin();
  setTimeout(() => { if (typeof logoCheck === 'function') logoCheck(); }, 5000);   // a logo the admin took away (ui/10j-paint.js)
  // each minute when the game has changed (Jonas 05.10.2026: «Kan progresjon lastes opp oftere til database?»; was three), and when the app
  // goes to the background: Android often ends a page in the background without a pagehide
  setInterval(cloudSaveSoon, 60000);
  document.addEventListener('visibilitychange', () => { if (document.hidden) cloudSaveSoon(true); });
  pushStart(); worldStart(); shopStart(); guestGift();
  window.addEventListener('pagehide', () => { cloudSaveSoon(true); if (CLOUD.sid) cloudFlush(true); });
}
function cloudAsk(){
  const y = new Date().getFullYear();
  modal('<div class="ob"><h2>' + cloudL('Bruksstatistikk', 'Usage statistics') + '</h2><p>' +
    cloudL('Vil du dele hvordan du spiller, for å gjøre spillet bedre? Det gjelder spilletid, hvilke deler av spillet du bruker, feil og bildetakt. Vi lagrer ikke IP-adressen din eller hvor du er, og du kan ombestemme deg i Innstillinger.', 'Will you share how you play, to make the game better? That is play time, which parts of the game you use, errors and frame rate. We do not store your IP address or where you are, and you can change your mind in Settings.') +
    '</p><label for="cgYear">' + cloudL('Fødselsår', 'Year of birth') + '</label><input id="cgYear" type="number" inputmode="numeric" min="' + (y - 100) + '" max="' + y + '" placeholder="' + (y - 30) + '">' +
    '<p class="note">' + cloudL('Under 13 år kan du ikke samtykke selv (personopplysningsloven § 5), og da deles ingenting.', 'Under 13 you cannot consent yourself, and then nothing is shared.') + ' <a href="personvern.html" target="_blank">' + cloudL('Personvern', 'Privacy') + '</a></p>' +
    '<div class="btns"><button class="btn" id="cgNo" data-close>' + cloudL('Nei takk', 'No thanks') + '</button><button class="btn primary" id="cgYes" data-close>' + cloudL('Ja, del', 'Yes, share') + '</button></div></div>');
  const ans = yes => { const by = +(document.getElementById('cgYear') || {}).value || null; cloudConsent(yes, by); };
  document.getElementById('cgYes').addEventListener('click', () => ans(true)); document.getElementById('cgNo').addEventListener('click', () => ans(false));
}
async function cloudConsent(yes, by){
  try { await cloudRpc('tm_consent', {yes, birth_year:by}); } catch (e){ console.error(e); return; }
  const kid = by && by > new Date().getFullYear() - 13;
  CLOUD.consent = yes && !kid;
  if (CLOUD.consent) cloudBegin(); else { CLOUD.sid = null; CLOUD.q = []; }
}
function cloudBegin(){
  if (CLOUD.sid) return;
  CLOUD.sid = (crypto.randomUUID && crypto.randomUUID()) || ('10000000-1000-4000-8000-100000000000').replace(/[018]/g, c => (c ^ Math.random() * 16 >> c / 4).toString(16));
  CLOUD.sent = Date.now();
  setInterval(() => { if (!document.hidden) CLOUD.active += 5; if (typeof G3 !== 'undefined' && G3._debug && !document.hidden){ const f = G3._debug.fps; if (f > 0) CLOUD.fps.push(f); } }, 5000);
  setInterval(() => cloudFlush(false), 60000);
  cloudEv('start', {});
}
function cloudEv(k, d){ if (!CLOUD.sid) return; if (CLOUD.q.length < 500) CLOUD.q.push({k, t:Date.now(), d:d || {}}); }
async function cloudFlush(end){
  if (!CLOUD.sid) return;
  let reason = null;
  if (end){ reason = CLOUD.neg && Date.now() - CLOUD.neg.t < 60000 ? 'rage' : 'close'; if (reason === 'rage') cloudEv('rage', {after:CLOUD.neg.k, x:CLOUD.neg.x, y:CLOUD.neg.y}); }
  const evs = CLOUD.q.splice(0, 400), act = CLOUD.active; CLOUD.active = 0;
  try { await cloudRpc('tm_batch', {sid:CLOUD.sid, meta:cloudMeta(), active_s:act, evs, ended:!!end, reason}, {keep:end});
    if (CLOUD.fps.length >= 3){ const f = CLOUD.fps.splice(0); cloudRpc('tm_perf', {fps:f.reduce((a, v) => a + v, 0) / f.length, low:Math.min(...f), drops:f.filter(v => v < 20).length, meta:{...cloudMeta(), ...cloudDev()}}, {anon:true}).catch(() => {}); }
  } catch (e){ CLOUD.q = evs.concat(CLOUD.q).slice(0, 500); CLOUD.active += act; }
}
function cloudErr(msg, src, stack){
  if (!CLOUD.on || !msg || CLOUD.errs >= 20 || CLOUD.errSeen[msg]) return;
  CLOUD.errSeen[msg] = 1; CLOUD.errs++;
  cloudRpc('tm_error', {msg:String(msg).slice(0, 400), src:String(src || '').slice(0, 200), stack:String(stack || '').slice(0, 2000), meta:{...cloudMeta(), ...cloudDev()}}).catch(() => {});
}
// the save goes up when it has changed (every three minutes and when the page closes); an older one than the cloud's is refused,
// and then the player chooses
// ---------- the save between devices (05.10.2026; supabase/migrations/20261005200000_save_sync.sql) ----------
// Jonas lost a game: a phone left open with an old one saved it every three minutes, always «newest» by the clock, and the tablet pulled
// it over his. Now each device keeps which cloud save its game comes from (dsb_sync_<user>: the cloud's saved_at, and the time of the
// local save then). The cloud refuses a save from a device that has not met its newest one, and nothing is pulled over a game that has
// been played since it was last in step: then the player chooses, seeing what each game is (day, money, boat). Whatever is replaced is
// kept: on this device (KEY_PREV) and in the cloud's history, and both can be taken back under Settings («Tidligere lagringer»).
const syncKey = () => 'dsb_sync_' + ((CLOUD.user && CLOUD.user.id) || '');
function syncGet(){ try { return JSON.parse(localStorage.getItem(syncKey()) || 'null'); } catch (e){ return null; } }
function syncSet(rev, at){ try { localStorage.setItem(syncKey(), JSON.stringify({rev, at})); } catch (e){} }
// what a game is: its day, money and boat (sent with every save, shown when two games meet)
function saveSum(o){
  if (!o) return null; const b = o.boat || (((o.fleet || [])[0] || {}).boat) || {};
  return {day:Math.floor((o.t || 0) / 1440) + 1, cash:Math.round(o.cash || 0), boat:o.boatName || '', type:b.type || '', tut:!!(o.tut && o.tut.v), fleet:(o.fleet || []).length || 1};
}
function sumText(m){
  if (!m) return cloudL('ukjent', 'unknown');
  const V = typeof VESSELS !== 'undefined' && VESSELS[m.type], vn = V ? String(cloudL(V.name.no, V.name.en)).split(' (')[0] : '';
  const n = Math.round(m.cash || 0), cash = (n < 0 ? '−' : '') + String(Math.abs(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return cloudL('Dag ', 'Day ') + m.day + ' · ' + cloudL(cash + ' kr', 'NOK ' + cash) + (m.boat ? ' · «' + String(m.boat).replace(/</g, '&lt;') + '»' : '') + (vn ? ' (' + vn + ')' : '') + (m.fleet > 1 ? ' · ' + m.fleet + cloudL(' båter', ' boats') : '') + (m.tut ? cloudL(' · i første tur', ' · on the first trip') : '');
}
// two games, and the player picks one: in the gate before the game starts (box) or as a dialog while playing; resolves 'here' or 'cloud'
function cloudChoose(here, cloud, when, box){
  const t = new Date(when).toLocaleString(cloudL('nb-NO', 'en-GB'), {day:'numeric', month:'short', hour:'2-digit', minute:'2-digit'});
  const html = '<h2>' + cloudL('To spill på kontoen din', 'Two games on your account') + '</h2><p>' +
    cloudL('Spillet her og spillet på kontoen er spilt hver for seg, trolig på to enheter. Hvilket vil du fortsette med? Det andre blir tatt vare på under Innstillinger, «Tidligere lagringer».', 'The game here and the game on the account have been played apart, probably on two devices. Which do you go on with? The other is kept under Settings, «Earlier saves».') + '</p>' +
    '<button class="cg-btn pick" id="cgHere"><b>' + cloudL('Spillet på denne enheten', 'The game on this device') + '</b><span>' + sumText(here) + '</span></button>' +
    '<button class="cg-btn pick" id="cgCloud"><b>' + cloudL('Spillet på kontoen', 'The game on the account') + '</b><span>' + sumText(cloud) + ' · ' + cloudL('lagret ', 'saved ') + t + '</span></button>';
  if (box) cloudGateShow(html); else modal('<div class="ob">' + html + '</div>');
  const done = (k, res) => () => { if (!box){ const m = document.getElementById('modal'); m.hidden = true; m.innerHTML = ''; } res(k); };
  return new Promise(res => { document.getElementById('cgHere').onclick = done('here', res); document.getElementById('cgCloud').onclick = done('cloud', res); });
}
// the choice is open (or its summary on the way): no save goes to the account meanwhile; another dialog over it lets the next try ask again
const cloudChoosing = () => CLOUD.choosing || !!document.getElementById('cgHere');
// the account's game onto this device (the one here kept), and start again with it
async function cloudTake(cs){
  const o = await loadCode(cs.data); syncSet(cs.saved_at, o.lastReal || Date.parse(cs.saved_at)); sessionStorage.setItem('dsb_pulled', cs.saved_at);
  location.reload(); return new Promise(() => {});
}
// at the start: the account has a game; which goes on
async function cloudSync(cs){
  const rev = cs.saved_at, localRaw = localStorage.getItem(KEY), lo = localRaw ? JSON.parse(localRaw) : null, local = lo ? (lo.lastReal || 0) : 0, sync = syncGet();
  if (sessionStorage.getItem('dsb_pulled') === rev) return;                                        // just loaded it (never in a loop)
  if (!lo || (lo.t || 0) < 1 && !lo.boatName){ cloudGateShow('<p>' + cloudL('Henter spillet ditt …', 'Fetching your game …') + '</p>'); return cloudTake(cs); }   // nothing here yet
  if (sync && Date.parse(sync.rev) === Date.parse(rev)) return;                                                             // the account has this device's game: on with it
  // (not played here since it was last in step, but for the last minute that may not have reached the account as the page closed)
  if (sync && local <= sync.at + 150000){ cloudGateShow('<p>' + cloudL('Henter spillet ditt …', 'Fetching your game …') + '</p>'); return cloudTake(cs); }   // not played here since: the newer one from elsewhere
  if (!sync && Math.abs(local - Date.parse(rev)) < 3000){ syncSet(rev, local); return; }            // the same save, from before devices kept count
  // both have been played since they were last in step: the player chooses
  let cloud = cs.summary; if (!cloud){ try { cloud = saveSum((await codeRead(cs.data)).o); } catch (e){} }
  const pick = await cloudChoose(saveSum(lo), cloud, rev, true);
  if (pick === 'cloud'){ cloudGateShow('<p>' + cloudL('Henter spillet ditt …', 'Fetching your game …') + '</p>'); return cloudTake(cs); }
  CLOUD.forceNext = true; syncSet(rev, 0);   // the game here goes on; its first save replaces the account's (kept in the history)
}
async function cloudSaveSoon(closing){
  if (!CLOUD.on || !CLOUD.user || !S.lastReal || S.lastReal === CLOUD.lastSave || CLOUD.saving || cloudChoosing()) return;
  CLOUD.saving = true;
  try {
    const at = S.lastReal, data = await saveCode(); if (!data) return; const sync = syncGet(), iso = new Date(at).toISOString(), keep = {keep:closing && data.length < 60000};
    let r;
    // (a database without the migration yet: the old put, the newest by the clock)
    if (!CLOUD.oldPut){ try { r = await cloudRpc('save_put2', {data, saved_at:iso, game_t:Math.round(S.t || 0), base:sync ? sync.rev : null, force:!!CLOUD.forceNext, summary:saveSum(S)}, keep); } catch (e){ if (!/ 404$/.test(e.message)) throw e; CLOUD.oldPut = true; } }
    if (CLOUD.oldPut) r = await cloudRpc('save_put', {data, saved_at:iso, game_t:Math.round(S.t || 0), force:!!CLOUD.forceNext}, keep);
    if (r && r.ok){ CLOUD.lastSave = at; CLOUD.forceNext = false; syncSet(r.saved_at || iso, at); }
    else if (r && r.cloud && !closing) cloudConflict(r.cloud);
  } catch (e){ console.error(e); } finally { CLOUD.saving = false; }
}
// while playing, the account has moved on (another device saved): the player chooses, nothing is written over meanwhile
async function cloudConflict(cl){
  if (cloudChoosing()) return; CLOUD.choosing = true;
  let sum = cl.summary, cs = null;
  try { if (!sum){ cs = await cloudRpc('save_get', {}); sum = cs && cs.data ? saveSum((await codeRead(cs.data)).o) : null; } } catch (e){ console.error(e); }
  CLOUD.choosing = false;
  const pick = await cloudChoose(saveSum(S), sum, cl.saved_at, false);
  if (pick === 'cloud'){ cs = cs || await cloudRpc('save_get', {}); if (cs && cs.data){ save(); await cloudTake(cs); } }
  else { CLOUD.forceNext = true; CLOUD.lastSave = 0; await cloudSaveSoon(); }
}
// «Tidligere lagringer» in Settings: the cloud's last ten and the one this device had before, each can be taken back
async function cloudHist(){
  let list = []; try { list = await cloudRpc('save_hist_list', {}) || []; } catch (e){ if (!/ 404$/.test(e.message)) console.error(e); }
  let prev = null; try { const r = localStorage.getItem(KEY_PREV); if (r){ const o = JSON.parse(r); prev = {at:o.lastReal || 0, summary:saveSum(o)}; } } catch (e){}
  CLOUD.hist = {list, prev}; if (PHONE.isOpen()) PHONE.render();
}
async function cloudRestore(id){
  let raw = null;
  if (id === 'local') raw = localStorage.getItem(KEY_PREV);
  else { const h = await cloudRpc('save_hist_get', {hid:+id}); if (h && h.data) raw = (await codeRead(h.data)).raw; }
  if (!raw) return toast(cloudL('Fant ikke lagringen.', 'Could not find the save.'));
  if (!confirm(cloudL('Hente dette spillet? Spillet du har nå, blir tatt vare på og kan hentes igjen.', 'Take this game back? The game you have now is kept and can be had again.'))) return;
  save(); const cur = localStorage.getItem(KEY); SAVE_OFF = true;
  try { localStorage.setItem(KEY_PREV, cur); } catch (e){} localStorage.setItem(KEY, raw);
  sessionStorage.setItem('dsb_force', '1'); location.reload();
}

// ---------- what is measured: the game's own functions, wrapped once they are all defined ----------
function cloudHooks(){
  if (!CLOUD.on) return;
  const wrap = (name, after) => { const f = window[name]; if (typeof f !== 'function') return; window[name] = function(){ const r = f.apply(this, arguments); try { after.call(this, r, arguments); } catch (e){} return r; }; };
  wrap('depart', () => { CLOUD.trip = S.t; cloudEv('depart', {port:(S.boat || {}).port || null}); });
  // a guest after the third landing: casting off waits for registering (the letter, at most every half minute; offline nothing waits)
  { const f = window.depart; if (typeof f === 'function') window.depart = function(){
    if (guestDue() && navigator.onLine !== false){ const m = document.getElementById('modal'); if ((!m || m.hidden) && Date.now() - (CLOUD.regT || 0) > 30000){ CLOUD.regT = Date.now(); guestAsk('cast'); } return false; }
    return f.apply(this, arguments); }; }
  wrap('tutFinish', () => guestNudge(1));
  wrap('sell', () => { const s = S.lastSale; if (!s || s.t !== S.t || !isGuest()) return; const n = S.landN || 0; if (n >= GUEST_LANDS) guestNudge(3); else if (n === GUEST_LANDS - 1) guestNudge(2); });
  wrap('sell', () => { const s = S.lastSale; if (!s || s.t !== S.t) return; const kg = (s.lines || []).reduce((a, r) => a + (r.kg || 0), 0);
    cloudEv('sale', {kr:Math.round(s.total || 0), kg:Math.round(kg), port:s.port, field:s.field || null, tripMin:CLOUD.trip != null ? Math.round(S.t - CLOUD.trip) : null, acc:s.acc});
    if ((s.confKg || 0) > 0.5 || (s.crabDead || 0) > 0.05) CLOUD.neg = {t:Date.now(), k:'sale', x:(S.boat.pos || {}).x, y:(S.boat.pos || {}).y}; CLOUD.trip = null; });
  wrap('runAground', (r, a) => { const p = a[0] || S.boat.pos || {}; cloudEv('aground', {x:+(p.x || 0).toFixed(3), y:+(p.y || 0).toFixed(3), boat:S.boat.type, v:+(S.boat.v || 0).toFixed(1)}); CLOUD.neg = {t:Date.now(), k:'aground', x:p.x, y:p.y}; });
  wrap('startSet', (r, a) => { if (!r) cloudEv('gear', {gear:a[0], op:'set'}); });
  wrap('startHaul', (r) => { const g = S.boat.gop; if (!r && g) cloudEv('gear', {gear:g.kind, op:'haul'}); });
  if (typeof PHONE !== 'undefined' && PHONE.open){ const o = PHONE.open; PHONE.open = function(app){ cloudEv('app', {app:String(app || '')}); return o.apply(this, arguments); }; }
  // every button with an action in the phone and the drawer, by name only
  document.addEventListener('click', e => { const el = e.target && e.target.closest && e.target.closest('[data-pa],[data-act]'); if (el) cloudEv('action', {app:'pa:' + (el.dataset.pa || el.dataset.act)}); }, true);
}

// ---------- the account card in Settings ----------
function cloudCard(){
  if (!CLOUD.on || !CLOUD.user) return '';
  const u = CLOUD.user, L2 = cloudL;
  if (CLOUD.guest) return '<div class="ph-card"><h4>' + L2('Konto', 'Account') + '</h4><p class="ph-note">' + L2('Du spiller som gjest. Spillet ligger bare i denne nettleseren til du registrerer deg.', 'You play as a guest. The game lives only in this browser until you register.') + '</p>' +
    '<button class="ph-btn p" data-pa="cloudReg">' + L2('Registrer meg', 'Register') + '</button>' +
    '<label><span>' + L2('Del bruksstatistikk', 'Share usage statistics') + '</span><input type="checkbox" data-pa="cloudStat"' + (CLOUD.consent ? ' checked' : '') + '></label>' +
    '<label><span>' + L2('Vis båten min for andre spillere', 'Show my boat to other players') + '</span><input type="checkbox" data-pa="cloudShowMe"' + (S.settings.showMe !== false ? ' checked' : '') + '></label>' +
    '<p class="ph-note">' + [['vilkar', 'Vilkår', 'Terms'], ['personvern', 'Personvern', 'Privacy'], ['kilder', 'Kilder', 'Sources'], ['kontakt', 'Kontakt', 'Contact']]
      .map(([f, no, en]) => '<a href="' + f + '.html" target="_blank" rel="noopener">' + L2(no, en) + '</a>').join(' · ') + '</p></div>';
  return '<div class="ph-card"><h4>' + L2('Konto', 'Account') + '</h4><p class="ph-note">' + L2('Logget inn som ', 'Signed in as ') + (u.email || '').replace(/</g, '&lt;') + '. ' +
    L2('Spillet lagres også på kontoen.', 'The game is also saved to the account.') + '</p>' + histRows() +
    '<label><span>' + L2('Del bruksstatistikk', 'Share usage statistics') + '</span><input type="checkbox" data-pa="cloudStat"' + (CLOUD.consent ? ' checked' : '') + '></label>' + pushCardRow() +
    '<label><span>' + L2('Vis båten min for andre spillere', 'Show my boat to other players') + '</span><input type="checkbox" data-pa="cloudShowMe"' + (S.settings.showMe !== false ? ' checked' : '') + '></label>' +
    '<button class="ph-btn alt" data-pa="cloudOut">' + L2('Logg ut', 'Sign out') + '</button><button class="ph-btn alt" data-pa="cloudDel">' + L2('Slett kontoen', 'Delete the account') + '</button>' +
    // the pages beside the game (src/legal/), in a tab of their own so the game stays where it is
    '<p class="ph-note">' + [['vilkar', 'Vilkår', 'Terms'], ['personvern', 'Personvern', 'Privacy'], ['kilder', 'Kilder', 'Sources'], ['kontakt', 'Kontakt', 'Contact']]
      .map(([f, no, en]) => '<a href="' + f + '.html" target="_blank" rel="noopener">' + L2(no, en) + '</a>').join(' · ') + '</p></div>';
}
// the earlier saves, once asked for: the one this device had before, and the account's last ten
function histRows(){
  const L2 = cloudL, H = CLOUD.hist;
  if (!H) return '<button class="ph-btn alt" data-pa="cloudHist">' + L2('Tidligere lagringer', 'Earlier saves') + '</button>';
  const fmtT = t => new Date(t).toLocaleString(L2('nb-NO', 'en-GB'), {day:'numeric', month:'short', hour:'2-digit', minute:'2-digit'});
  const row = (id, t, sum, src) => '<div class="ph-kv hrow"><span>' + fmtT(t) + ' · ' + src + '<br><small>' + sumText(sum) + '</small></span><button class="ph-btn alt" data-pa="cloudRestore" data-id="' + id + '">' + L2('Hent', 'Restore') + '</button></div>';
  const rows = (H.prev ? [row('local', H.prev.at, H.prev.summary, L2('denne enheten', 'this device'))] : []).concat(H.list.map(h => row(h.id, h.saved_at, h.summary, L2('kontoen', 'account'))));
  return '<h4>' + L2('Tidligere lagringer', 'Earlier saves') + '</h4>' + (rows.length ? rows.join('') : '<p class="ph-note">' + L2('Ingen ennå.', 'None yet.') + '</p>');
}
// the player's own feedback videos out of the Storage bucket (supabase/migrations/20261006010000_feedback_media.sql); quietly nothing
// where the database does not have the list yet
async function cloudMediaDel(){
  try { const l = await cloudRpc('fb_media_list', {}); if (!l || !l.length) return;
    const tok = await cloudToken(), c = CLOUD_CFG;
    await fetch(c.supabaseUrl.replace(/\/$/, '') + '/storage/v1/object/feedback-media', {method:'DELETE', headers:{'Content-Type':'application/json', apikey:c.supabaseAnon, ...(tok ? {Authorization:'Bearer ' + tok} : {})}, body:JSON.stringify({prefixes:l})});
  } catch (e){ console.warn('feedback media', e); }
}
function cloudAct(a, d){
  if (a === 'cloudReg'){ guestAsk(guestDue() ? 'due' : 'soft'); return true; }
  if (a === 'cloudHist'){ cloudHist(); return true; }
  if (a === 'cloudRestore'){ cloudRestore(d && d.id); return true; }
  if (a === 'cloudStat'){ cloudConsent(!CLOUD.consent, null); return true; }
  if (a === 'cloudShowMe'){ worldShowMe(S.settings.showMe === false); return true; }
  if (a === 'cloudPush'){ pushToggle(); return true; }
  if (a === 'cloudPushCat'){ pushCatToggle(d && d.k); return true; }
  if (a === 'cloudOut'){ cloudSaveSoon(); localStorage.removeItem(CLOUD_SIGNED); CLOUD.ak.signOut({returnTo:location.origin + location.pathname}); return true; }
  if (a === 'cloudDel'){
    // the game on this device goes too (Jonas 05.10.2026: deleting the account to begin again kept the old game here, and the new
    // account went on with it, without Father's letter or the boathouse); the next sign-in starts a new game with the letter
    if (!confirm(cloudL('Slette kontoen? Spillet på kontoen og på denne enheten, statistikken og innloggingen slettes. Kjøp beholdes uten navn i regnskapet. Neste gang begynner du på nytt.', 'Delete the account? The game on the account and on this device, the statistics and the sign-in are deleted. Purchases are kept without a name for the books. Next time you begin again.'))) return true;
    // the videos sent with feedback go first, through Storage (which does not take deletes made in the database)
    cloudMediaDel().then(() => cloudRpc('delete_me', {})).then(() => {
      SAVE_OFF = true;   // nothing saved again on the way out
      for (const k of [KEY, KEY_V1, KEY_PREV, CLOUD_SIGNED, syncKey()]) try { localStorage.removeItem(k); } catch (e){}
      try { sessionStorage.removeItem('dsb_pulled'); sessionStorage.removeItem('dsb_force'); } catch (e){}
      toast(cloudL('Kontoen er slettet.', 'The account is deleted.')); CLOUD.ak.signOut({returnTo:location.origin + location.pathname}); })
      .catch(e => toast(cloudL('Kunne ikke slette kontoen nå. Prøv igjen.', 'Could not delete the account now. Try again.')));
    return true;
  }
  return false;
}

// ---------- registering, for a guest: in the game's own words, never a wall before the third landing ----------
// Jonas 06.10.2026: «krev innlogging etter 3 landing … vær svært bevist i måten det gjøres på slik at spilleren ikke bare lukker spillet».
// So: the first trip and two more landings are on Father's papers. After the first trip a quiet card, after the second landing
// one that says a landing is left, and after the third a letter from Fiskeridirektoratet: to sell fish in your own name you must be in
// fiskermanntallet. It shows what is the player's now (the boat, the money, the fish), says honestly that a guest's game lives only in
// this browser, and gives a luxury luck for registering. «Ikke nå» always closes it: the player can look round, rest and sell what is
// aboard; only casting off waits (and offline nothing waits). Registering takes about ten seconds, and the game comes along.
const gEsc = v => String(v == null ? '' : v).replace(/[&<>"]/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;'})[c]);
const guestDue = () => isGuest() && (S.landN || 0) >= GUEST_LANDS;
function guestHave(){
  const n = x => String(Math.round(x || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return '<div class="reg-have"><div><b>«' + gEsc(S.boatName || 'Havbris') + '»</b><span>' + cloudL('båten din', 'your boat') + '</span></div>' +
    '<div><b>' + n(S.cash) + ' kr</b><span>' + cloudL('på konto', 'in the bank') + '</span></div>' +
    '<div><b>' + n((S.stats && S.stats.kg) || 0) + ' kg</b><span>' + cloudL('fisk levert', 'fish landed') + '</span></div></div>';
}
function guestAsk(why){
  if (!isGuest()) return false;
  const due = why === 'due' || why === 'cast', left = Math.max(0, GUEST_LANDS - (S.landN || 0));
  const head = due ? cloudL('Fiskermanntallet', 'The fishermen’s register') : why === 'shop' ? cloudL('Kjøp krever registrering', 'Buying needs registering') : cloudL('Ta vare på «' + gEsc(S.boatName || 'Havbris') + '»', 'Keep «' + gEsc(S.boatName || 'Havbris') + '» safe');
  const lead = due ? cloudL('Du har levert ' + (S.landN || 0) + ' ganger på fars papirer. For å selge fisk i eget navn må du føres i fiskermanntallet. Det tar ti sekunder.', 'You have landed ' + (S.landN || 0) + ' times on Father’s papers. To sell fish in your own name you must be in the fishermen’s register. It takes ten seconds.')
    : why === 'shop' ? cloudL('Et kjøp må knyttes til en konto, så du har kvitteringen og får det du kjøper på alle enhetene dine.', 'A purchase must be tied to an account, so you have the receipt and get what you buy on all your devices.')
    : left === 1 ? cloudL('Én landing til på fars papirer. Etter den må du føres i fiskermanntallet for å selge fisk i eget navn.', 'One more landing on Father’s papers. After it you must be in the fishermen’s register to sell fish in your own name.')
    : cloudL('Godt levert! Nå har du noe å ta vare på.', 'Well landed! Now you have something to keep.');
  modal('<div class="ob reg"><p class="reg-from">' + (due ? cloudL('Fiskeridirektoratet', 'The Directorate of Fisheries') : 'Det Store Blå') + '</p><h2>' + head + '</h2><p>' + lead + '</p>' + guestHave() +
    '<p class="reg-warn">' + cloudL('Nå ligger alt dette bare i denne nettleseren. Nettlesere sletter slikt, på iPhone etter en uke uten besøk, og da er det borte for godt.', 'Right now all this lives only in this browser. Browsers clear such things, an iPhone after a week without a visit, and then it is gone for good.') + '</p>' +
    '<ul class="reg-get"><li>' + cloudL('Båten, pengene og fangsten blir med deg', 'The boat, the money and the catch come with you') + '</li><li>' + cloudL('Spill videre på mobil, nettbrett og PC', 'Play on from phone, tablet and PC') + '</li><li>' + cloudL('<b>Luksushaill</b> om bord som velkomstgave', 'A <b>luxury luck</b> aboard as a welcome gift') + '</li></ul>' +
    '<div class="btns"><button class="btn" id="regLater" data-close>' + (due ? cloudL('Ikke nå', 'Not now') : cloudL('Senere', 'Later')) + '</button><button class="btn primary" id="regGo">' + cloudL('Registrer meg', 'Register') + '</button></div>' +
    '<p class="note">' + cloudL('Med Google, Apple eller e-post. ', 'With Google, Apple or e-mail. ') + '<a href="#" id="regIn">' + cloudL('Har du konto? Logg inn', 'Have an account? Sign in') + '</a>' +
    (due ? '<br>' + cloudL('Til da kan du se deg rundt, hvile og levere det som er om bord, men båten går ikke ut.', 'Until then you can look round, rest and land what is aboard, but the boat does not go out.') : '') +
    ' · <a href="personvern.html" target="_blank" rel="noopener">' + cloudL('Personvern', 'Privacy') + '</a></p></div>');
  document.getElementById('regGo').onclick = () => guestRegister(false);
  document.getElementById('regIn').onclick = e => { e.preventDefault(); guestRegister(true); };
  cloudEv('reg_ask', {why, lands:S.landN || 0});
  return true;
}
// a card waits for the screen to be free (no dialog, the tutorial over) and is shown once per step
function guestNudge(step){
  if (!isGuest() || tutOn() || (S.regAsk || 0) >= step) return;
  const go = () => { const m = document.getElementById('modal'); if (m && !m.hidden){ setTimeout(go, 4000); return; } if ((S.regAsk || 0) >= step) return; S.regAsk = step; save(); guestAsk(step >= 3 ? 'due' : 'soft'); };
  setTimeout(go, step === 1 ? 8000 : 2500);   // after the first trip the push question comes first (tutFinish)
}
async function guestRegister(signIn){
  toast(cloudL('Åpner registreringen …', 'Opening the registration …'));
  try {
    save(); await cloudSaveSoon(true);   // the guest's game up first, so it is on the account at once after
    const code = await cloudRpc('guest_claim', {});
    localStorage.setItem(GUEST_CODE, JSON.stringify({code, gid:CLOUD.user && CLOUD.user.id}));
    cloudEv('reg_go', {lands:S.landN || 0}); if (CLOUD.sid) await cloudFlush(true);
    if (signIn) CLOUD.ak.signIn(); else CLOUD.ak.signUp();
  } catch (e){ console.error(e); toast(cloudL('Kunne ikke åpne registreringen nå. Sjekk nettet og prøv igjen.', 'Could not open the registration now. Check the network and try again.')); }
}
// once back from registering: the welcome gift
function guestGift(){
  if (!CLOUD.on || CLOUD.guest || !localStorage.getItem(REG_GIFT)) return;
  try { localStorage.removeItem(REG_GIFT); } catch (e){}
  giveHaill('luksus', 'gift'); save();
  msg('Fiskeridirektoratet', 'Du er ført i fiskermanntallet i eget navn. Spillet ditt er lagret på kontoen, og en luksushaill ligger om bord som velkomstgave. God tur!', 'You are in the fishermen’s register in your own name. Your game is saved to the account, and a luxury luck is aboard as a welcome gift. Good fishing!');
  toast(cloudL('Registrert! Luksushaill om bord.', 'Registered! A luxury luck aboard.'));
}
