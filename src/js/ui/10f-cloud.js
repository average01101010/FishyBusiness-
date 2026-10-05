// ===== THE CLOUD (04.10.2026; docs/lansering.md E and F) =====
// In the app on detstorebla.no, with src/data/cloud.json filled in and the page on one of its hosts: sign-in with WorkOS (AuthKit,
// required, the user's choice), the save kept in Supabase as well (the newest wins), and the usage measurements the player has
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
async function cloudToken(){ try { return CLOUD.ak ? await CLOUD.ak.getAccessToken() : null; } catch (e){ return null; } }
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
async function cloudGate(){
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
  try {
    const h = await cloudRpc('tm_hello', {meta:cloudMeta()}); CLOUD.consent = h ? h.consent : null; CLOUD.owned = (h && h.owned) || []; CLOUD.admin = !!(h && h.admin === true);
    // the save: the cloud's when it is newer than the one here (a new device, or played elsewhere since)
    const cs = await cloudRpc('save_get', {});
    const localRaw = localStorage.getItem(KEY), local = localRaw ? (JSON.parse(localRaw).lastReal || 0) : 0;
    // (once per save: the save's own time can be a little older than the cloud's stamp, and the page must not load it again and again)
    if (cs && cs.data && Date.parse(cs.saved_at) > local + 5000 && sessionStorage.getItem('dsb_pulled') !== cs.saved_at){
      cloudGateShow('<p>' + cloudL('Henter spillet ditt …', 'Fetching your game …') + '</p>');
      sessionStorage.setItem('dsb_pulled', cs.saved_at); await loadCode(cs.data); location.reload(); return new Promise(() => {});
    }
  } catch (e){ console.error(e); }
  cloudGateHide();
}

// ---------- after the start: hooks, measurements, the save ----------
function cloudStart(){
  if (!CLOUD.on) return;
  window.addEventListener('error', e => cloudErr(e.message, (e.filename || '') + ':' + (e.lineno || ''), e.error && e.error.stack));
  window.addEventListener('unhandledrejection', e => cloudErr(String(e.reason && e.reason.message || e.reason), 'promise', e.reason && e.reason.stack));
  // the question waits until the first-start dialog (company and boat names) is done and no other dialog is open
  if (CLOUD.consent == null){ const iv = setInterval(() => { const m = document.getElementById('modal'); if (S.intro && S.boatName && m && m.hidden){ clearInterval(iv); setTimeout(cloudAsk, 1500); } }, 2000); }
  else if (CLOUD.consent) cloudBegin();
  setInterval(cloudSaveSoon, 180000);
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
    if (CLOUD.fps.length >= 3){ const f = CLOUD.fps.splice(0); cloudRpc('tm_perf', {fps:f.reduce((a, v) => a + v, 0) / f.length, low:Math.min(...f), drops:f.filter(v => v < 20).length, meta:cloudMeta()}, {anon:true}).catch(() => {}); }
  } catch (e){ CLOUD.q = evs.concat(CLOUD.q).slice(0, 500); CLOUD.active += act; }
}
function cloudErr(msg, src, stack){
  if (!CLOUD.on || !msg || CLOUD.errs >= 20 || CLOUD.errSeen[msg]) return;
  CLOUD.errSeen[msg] = 1; CLOUD.errs++;
  cloudRpc('tm_error', {msg:String(msg).slice(0, 400), src:String(src || '').slice(0, 200), stack:String(stack || '').slice(0, 2000), meta:cloudMeta()}).catch(() => {});
}
// the save goes up when it has changed (every three minutes and when the page closes); an older one than the cloud's is refused,
// and then the player chooses
async function cloudSaveSoon(closing){
  if (!CLOUD.on || !CLOUD.user || !S.lastReal || S.lastReal === CLOUD.lastSave || CLOUD.saving) return;
  CLOUD.saving = true;
  try {
    const at = S.lastReal, data = await saveCode(); if (!data) return;
    const r = await cloudRpc('save_put', {data, saved_at:new Date(at).toISOString(), game_t:Math.round(S.t || 0), force:false}, {keep:closing && data.length < 60000});
    if (r && r.ok) CLOUD.lastSave = at;
    else if (r && r.cloud && !closing) cloudConflict(r.cloud);
  } catch (e){ console.error(e); } finally { CLOUD.saving = false; }
}
function cloudConflict(cl){
  const when = new Date(cl.saved_at).toLocaleString(S.lang === 'en' ? 'en-GB' : 'nb-NO');
  modal('<div class="ob"><h2>' + cloudL('Nyere lagring på kontoen', 'A newer save on your account') + '</h2><p>' +
    cloudL('Kontoen har et spill som er lagret senere (' + when + '), trolig fra en annen enhet. Hvilket vil du beholde?', 'Your account has a game saved later (' + when + '), probably from another device. Which do you keep?') + '</p>' +
    '<div class="btns"><button class="btn" id="cgKeep" data-close>' + cloudL('Dette her', 'This one') + '</button><button class="btn primary" id="cgTake" data-close>' + cloudL('Det på kontoen', 'The one on the account') + '</button></div></div>');
  document.getElementById('cgTake').addEventListener('click', async () => { const cs = await cloudRpc('save_get', {}); if (cs && cs.data){ await loadCode(cs.data); location.reload(); } });
  document.getElementById('cgKeep').addEventListener('click', async () => { const data = await saveCode(); await cloudRpc('save_put', {data, saved_at:new Date(S.lastReal).toISOString(), game_t:Math.round(S.t || 0), force:true}); CLOUD.lastSave = S.lastReal; });
}

// ---------- what is measured: the game's own functions, wrapped once they are all defined ----------
function cloudHooks(){
  if (!CLOUD.on) return;
  const wrap = (name, after) => { const f = window[name]; if (typeof f !== 'function') return; window[name] = function(){ const r = f.apply(this, arguments); try { after.call(this, r, arguments); } catch (e){} return r; }; };
  wrap('depart', () => { CLOUD.trip = S.t; cloudEv('depart', {port:(S.boat || {}).port || null}); });
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
  return '<div class="ph-card"><h4>' + L2('Konto', 'Account') + '</h4><p class="ph-note">' + L2('Logget inn som ', 'Signed in as ') + (u.email || '').replace(/</g, '&lt;') + '. ' +
    L2('Spillet lagres også på kontoen.', 'The game is also saved to the account.') + '</p>' +
    '<label><span>' + L2('Del bruksstatistikk', 'Share usage statistics') + '</span><input type="checkbox" data-pa="cloudStat"' + (CLOUD.consent ? ' checked' : '') + '></label>' +
    '<button class="ph-btn alt" data-pa="cloudOut">' + L2('Logg ut', 'Sign out') + '</button><button class="ph-btn alt" data-pa="cloudDel">' + L2('Slett kontoen', 'Delete the account') + '</button></div>';
}
function cloudAct(a){
  if (a === 'cloudStat'){ cloudConsent(!CLOUD.consent, null); return true; }
  if (a === 'cloudOut'){ cloudSaveSoon(); localStorage.removeItem(CLOUD_SIGNED); CLOUD.ak.signOut({returnTo:location.origin + location.pathname}); return true; }
  if (a === 'cloudDel'){
    if (!confirm(cloudL('Slette kontoen? Spillet på kontoen, statistikken og innloggingen slettes. Kjøp beholdes uten navn i regnskapet. Spillet på denne enheten blir liggende.', 'Delete the account? The game on the account, the statistics and the sign-in are deleted. Purchases are kept without a name for the books. The game on this device stays.'))) return true;
    cloudRpc('delete_me', {}).then(() => { localStorage.removeItem(CLOUD_SIGNED); toast(cloudL('Kontoen er slettet.', 'The account is deleted.')); CLOUD.ak.signOut({returnTo:location.origin + location.pathname}); })
      .catch(e => toast(cloudL('Kunne ikke slette kontoen nå. Prøv igjen.', 'Could not delete the account now. Try again.')));
    return true;
  }
  return false;
}
