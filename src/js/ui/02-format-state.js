// ---------- formatting ----------
// real calendar days on this device (local date), for the daily login bonus
function dayKey(d){ d = d || new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
function dayNum(k){ const [y, m, dd] = k.split('-').map(Number); return Math.round(Date.UTC(y, m - 1, dd) / 864e5); }
// the hold as the player reads it (H2b, V2 A, 05.11.2026): a freezer vessel's in tonnes of product, what fills the room, with the round
// weight the quota and the price go by beside it; the other boats in kg of round weight as before
function holdFmt(){
  const fz = typeof holdFreezes === 'function' && holdFreezes(), rd = holdTotal(), cap = capHold();
  if (!fz) return {fz, load:rd, round:rd, cap, txt:fmt(rd, 0) + ' / ' + cap + ' kg', short:fmt(rd, 0) + ' kg'};
  const ld = holdLoad(); return {fz, load:ld, round:rd, cap, txt:fmt(ld / 1000, 1) + ' / ' + fmt(cap / 1000, 0) + ' t', short:fmt(ld / 1000, 1) + ' t', rnd:fmt(rd / 1000, 1) + ' t'};
}
function fmt(n, d = 0){ return new Intl.NumberFormat(S.lang === 'no' ? 'nb-NO' : 'en-GB', {minimumFractionDigits:d, maximumFractionDigits:d}).format(n); }
function kr(n){ return S.lang === 'no' ? fmt(Math.round(n)) + ' kr' : 'NOK ' + fmt(Math.round(n)); }
// A landing note paid (ui/08-actions.js sell, Jonas 08.10.2026: «ka-ching», «+(inntekt)» in green, counted over to the account): the amount
// rises from the cash bar in green, the register rings (SND.cash), and the cash in the bar and in the HUD counts up from what it was to
// what it is (CASHFX.v, shown by cashShown()), with a tick on the way (SND.coin). Longer for more (1.1 to 2.6 s). A page the browser
// drives for a test shows the sum at once, unless CASHFX.force is set; a player who asks for less motion gets the sum and the ring.
const CASHFX = {on:false, v:0, from:0, to:0, t0:0, dur:0, blip:0, force:false, raf:0};
const cashShown = () => CASHFX.on ? CASHFX.v : S.cash;
function cashFx(delta){
  if (!(delta >= 1) || typeof document === 'undefined') return;
  if (typeof SND !== 'undefined' && SND.cash) SND.cash(delta);
  if (document.hidden || (navigator.webdriver && !CASHFX.force)) return;
  const el = $('cash'); if (!el) return;
  const to = S.cash, from = CASHFX.on ? CASHFX.v : to - delta, calm = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const f = document.createElement('div'); f.className = 'cashfx'; f.textContent = '+' + kr(delta).replace(/^NOK /, 'NOK ');
  const r = el.getBoundingClientRect(); f.style.left = Math.round(r.left + r.width / 2) + 'px'; f.style.top = Math.round(r.bottom + 2) + 'px';
  document.body.appendChild(f); setTimeout(() => f.remove(), 2400);
  if (calm){ return; }
  Object.assign(CASHFX, {on:true, from, to, v:from, t0:performance.now(), dur:Math.min(2600, Math.max(1100, 700 + Math.log10(delta + 10) * 330)), blip:0});
  el.classList.add('cashup'); cancelAnimationFrame(CASHFX.raf);
  const step = now => {
    const u = Math.min(1, (now - CASHFX.t0) / CASHFX.dur), e = 1 - Math.pow(1 - u, 3);
    CASHFX.v = CASHFX.from + (CASHFX.to - CASHFX.from) * e;
    if (u < 1 && now - CASHFX.blip > 55 + 60 * u){ CASHFX.blip = now; if (typeof SND !== 'undefined' && SND.coin) SND.coin(u); }
    if (u >= 1){ CASHFX.on = false; el.classList.remove('cashup'); }
    renderClock();
    if (u < 1) CASHFX.raf = requestAnimationFrame(step);
  };
  CASHFX.raf = requestAnimationFrame(step);
}
// real time for a stretch of game time: the clock runs GAME_RATE × S.mult game minutes per real minute
function realMin(gameMin){ return gameMin / simRate(); }
function realDur(gameMin){ const m = realMin(Math.max(0, gameMin)), no = S.lang === 'no';
  if (m < 1) return no ? 'under 1 min' : 'under a minute';
  if (m < 59.5) return Math.round(m) + ' min';
  const tm = Math.round(m), hh = Math.floor(tm / 60), mm = tm % 60;
  if (hh < 24) return hh + (no ? ' t' : ' h') + (mm ? ' ' + mm + ' min' : '');
  const d = Math.floor(hh / 24), h2 = hh % 24; return d + ' d' + (h2 ? ' ' + h2 + (no ? ' t' : ' h') : ''); }
// real time is always said to be real time (spilltest 3, U1; Jonas 05.11.2026, V1 A: the game clock first, the real time after)
const realW = () => S.lang === 'no' ? ' i ekte tid' : ' real time';
function inReal(gameMin){ return (S.lang === 'no' ? 'om ' : 'in ') + realDur(gameMin) + realW(); }
// a stretch of game time as the game clock counts it: «3 t», «4 t 20 min», «45 min»
function gameDur(gameMin){ const m = Math.max(0, Math.round(gameMin)), hh = Math.floor(m / 60), mm = m % 60, u = S.lang === 'no' ? ' t' : ' h';
  return hh ? hh + u + (mm ? ' ' + mm + ' min' : '') : mm + ' min'; }
// how long something takes: the game's own time first, the real time after (V1 A): «3 t (30 min i ekte tid)»
function durBoth(gameMin){ return gameDur(gameMin) + ' (' + realDur(gameMin) + realW() + ')'; }
// «ferdig 14:20 · om 12 min»: the game clock and how long that is to wait in real time
function whenTxt(T){ return hm(T / 60) + ' · ' + inReal(T - S.t); }
function dur(h){ const m = Math.max(0, Math.round(h * 60)), hh = Math.floor(m / 60), mm = m % 60; const u = S.lang === 'no' ? ' t' : ' h'; return (hh ? hh + u + ' ' : '') + mm + ' min'; }
const DAYS = {no:['søn','man','tir','ons','tor','fre','lør'], en:['Sun','Mon','Tue','Wed','Thu','Fri','Sat']};
const MONS = {no:['jan','feb','mar','apr','mai','jun','jul','aug','sep','okt','nov','des'], en:['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']};
const p2 = n => String(n).padStart(2, '0');
function hm(H){ const d = gDate(H); return p2(d.getUTCHours()) + ':' + p2(d.getUTCMinutes()); }
function dayStr(H){ const d = gDate(H); return S.lang === 'no' ? DAYS.no[d.getUTCDay()] + ' ' + d.getUTCDate() + '. ' + MONS.no[d.getUTCMonth()] : DAYS.en[d.getUTCDay()] + ' ' + d.getUTCDate() + ' ' + MONS.en[d.getUTCMonth()]; }
function clockStr(H){ return dayStr(H) + ' ' + gDate(H).getUTCFullYear() + ', ' + hm(H); }
function coordStr(p){
  const {lat, lon} = LL(p);
  const f = (v, w) => { const tm = Math.round(Math.abs(v) * 600), d = Math.floor(tm / 600); let m = ((tm % 600) / 10).toFixed(1).padStart(4, '0'); if (S.lang === 'no') m = m.replace('.', ','); return String(d).padStart(w, '0') + '°' + m + "'"; };
  return f(lat, 2) + 'N ' + f(lon, 3) + (lon < 0 ? (S.lang === 'no' ? 'V' : 'W') : (S.lang === 'no' ? 'Ø' : 'E'));   // (west of Greenwich at Jan Mayen and Iceland, H1b)
}
const DIRS = {no:['N','NØ','Ø','SØ','S','SV','V','NV'], en:['N','NE','E','SE','S','SW','W','NW']};
function dirName(deg){ return DIRS[S.lang][Math.round(deg / 45) % 8]; }
const spName = sp => SPECIES[sp][S.lang];

// ---------- persistence ----------
// v2 (phase K4 of the coast plan) is in the national frame and under its own key; a v1 game (the legacy frame) is read once from its
// old key, moved over (migrateV2) and saved as v2, and the v1 save is left as it was
const KEY = 'kystfiske_v2', KEY_V1 = 'kystfiske_proto_v1';
// set when a save code has been read in and the page is about to load it: nothing may save over it before the reload (pagehide saves)
let SAVE_OFF = false;
// One tab writes the game on a device (Adrian 13.10.2026: a tab left open on the iPhone since the morning woke up hours later and saved
// its morning over the game he had played since, on the device and, the device being the same, on the account). The page that reads the
// save marks itself the owner (KEY_OWN, with the time); a page that finds a later mark from another page has been passed by: it saves
// nothing more, plays no more and says so (tabLose), and loading it again makes it the owner with the game as it is now.
// (held: another device has the game, ui/10f-cloud.js cloudPassed; wait: a page that slept asks the account who has it before it plays)
const KEY_OWN = 'kystfiske_v2_own', TAB = {id:'t' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36), at:0, lost:false, held:false, wait:false};
function tabMark(){ TAB.at = Date.now(); try { localStorage.setItem(KEY_OWN, JSON.stringify({tab:TAB.id, at:TAB.at})); } catch (e){} }
function tabMine(){
  if (TAB.lost) return false; if (!TAB.at) return true;
  let o = null; try { o = JSON.parse(localStorage.getItem(KEY_OWN) || 'null'); } catch (e){}
  if (o && o.tab !== TAB.id && o.at >= TAB.at){ tabLose(); return false; }
  return true;
}
function tabLose(){
  if (TAB.lost) return; TAB.lost = true; SAVE_OFF = true;
  const L = (no, en) => typeof S !== 'undefined' && S && S.lang === 'en' ? en : no;
  try { if (typeof cloudEv === 'function') cloudEv('tab_lost', {}); } catch (e){}
  const g = typeof cloudGateShow === 'function' ? cloudGateShow('<p class="cg-lead">' + L('Spillet er åpnet et annet sted', 'The game is open somewhere else') + '</p><p class="cg-small">' +
    L('Spillet ditt er åpnet i en annen fane eller et annet vindu på denne enheten. Denne er satt på pause, så den ikke skriver et eldre spill over det nye.', 'Your game is open in another tab or window on this device. This one is paused, so it does not write an older game over the newer one.') +
    '</p><div class="cg-btns"><button id="tabHere" type="button" class="cg-btn pri">' + L('Spill her', 'Play here') + '</button></div>') : null;
  const b = document.getElementById('tabHere'); if (b) b.onclick = () => location.reload();
  if (!g) location.reload();
}
// the save watched (02.11.2026, the error trap, ui/10f-cloud.js cloudErr): JSON writes a number that is not a number (NaN, Infinity)
// as null without a word, so a fault in a sum wiped the value in the save and the player only saw money, fuel or a place gone. Once a
// minute the save is written through a replacer that notes where such numbers are (the path, indices as #), with the fuel and the ice
// that cannot be below zero; and a save that cannot be written (the storage full: QuotaExceededError) was dropped in silence. Each is
// sent once a session (cloudErr), with what was found and the size of the save.
const SAVECHK = {at:0};
function saveJson(o){
  if (typeof cloudErr !== 'function' || Date.now() - SAVECHK.at < 60000) return JSON.stringify(o);
  SAVECHK.at = Date.now();
  const bad = [], path = new Map();
  const j = JSON.stringify(o, function (k, v){
    const p = path.get(this), here = p ? p + '.' + k : k;
    if (typeof v === 'number' && !isFinite(v)){ if (bad.length < 12) bad.push([here, String(v)]); }
    else if (v && typeof v === 'object') path.set(v, here);
    return v;
  });
  try { for (const [nm, b] of [['boat', o.boat]].concat((o.fleet || []).map((v, i) => ['fleet.' + i + '.boat', v && v.boat])))
    if (b) for (const k of ['fuel', 'ice']) if (typeof b[k] === 'number' && b[k] < -0.01) bad.push([nm + '.' + k, String(Math.round(b[k] * 100) / 100)]); } catch (e){}
  if (bad.length){
    const keys = [...new Set(bad.map(q => q[0].replace(/\.\d+(?=\.|$)/g, '.#')))].slice(0, 6).join(', ');
    cloudErr('Lagringen har ugyldige tall: ' + keys, 'save', JSON.stringify({bad, t:o.t, seq:o.seq}), 'state');
  }
  return j;
}
function save(){ if (SAVE_OFF || !S || !tabMine()) return;   /* !S: the page went hidden while the map was still loading, before bootGame gave it a state; nothing to save yet */ let j = ''; try { S.lastReal = Date.now(); S.seq = (S.seq || 0) + 1; let o = S; if (S.fleet && S.fleet.length){ storeVessel(curVessel()); o = Object.assign({}, S); for (const k of VKEYS) delete o[k]; } j = saveJson(o); localStorage.setItem(KEY, j); }
  catch (e){ try { if (typeof cloudErr === 'function') cloudErr('Lagringen feilet: ' + (e && e.name || 'Error') + ': ' + String(e && e.message || e).slice(0, 120), 'save', JSON.stringify({kb:Math.round(j.length / 1024), store:saveStoreKb()}), 'state'); } catch (e2){} } }
// what the page has in localStorage, in kB (for a save that would not fit)
function saveStoreKb(){ try { let n = 0; for (let i = 0; i < localStorage.length; i++){ const k = localStorage.key(i); n += k.length + (localStorage.getItem(k) || '').length; } return Math.round(n / 1024); } catch (e){ return null; } }
// v1 to v2: every point {x, y} (km) anywhere in the save goes through LG; the stock's dense grids of the legacy frame (40 x 42 cells of
// 2 km) become the sparse cells of the national frame, the lowest value where two old cells land in one new; headings turn with the frame
function migrateV2(o){
  const walk = v => { if (!v || typeof v !== 'object') return;
    if (typeof v.x === 'number' && typeof v.y === 'number' && isFinite(v.x) && isFinite(v.y)){ const q = LG(v.x, v.y); v.x = q.x; v.y = q.y; }
    for (const k in v) if (k !== 'stock' && k !== 'cstk') walk(v[k]); };
  const turn = b => { if (b && typeof b.heading === "number" && b.pos){ const l = LGI(b.pos); b.heading += LGrot(l.x, l.y); } };
  walk(o);
  for (const v of [o].concat(o.fleet || [])) turn(v.boat);
  const grid = a => { if (!Array.isArray(a)) return a; const m = {}; a.forEach((v, i) => { if (!(v < 1)) return; const c = i % 40, r = Math.floor(i / 40), k = stockIdx(LG((c + 0.5) * 2, (r + 0.5) * 2)); stkSet(m, k, Math.min(stkGet(m, k), v)); }); return m; };
  if (o.stock) o.stock = grid(o.stock); if (o.cstk) o.cstk = grid(o.cstk);
  o.v = 2; o.frame = 'utm33'; o.migrated = Date.now();
  return o;
}
function load(){ try { let s = localStorage.getItem(KEY), o = s ? JSON.parse(s) : null;
  if (!o){ s = localStorage.getItem(KEY_V1); o = s ? JSON.parse(s) : null; o = o && o.v === 1 ? migrateV2(o) : null; }
  if (!o || o.v !== 2) return null;
  // the 29 ft fibreglass sjark of the kit left with the boats round (Jonas 17.10.2026, docs/batplan.md): a save that owned one gets the 31 ft
  // fibreglass sjark from Blender in her place, the difference waived, and keeps her 8 m right; no save in the cloud had her, local ones may
  for (const v of [o, ...(o.fleet || [])]){ if (v.boat && v.boat.type === 'jukesjark'){ v.boat.type = 'plastsjark'; if (Array.isArray(o.log)) o.log.push({t:o.t || 0, no:'Plastsjarken på 29 fot er byttet ut med plastsjarken på 31 fot, uten mellomlegg.', en:'The 29 ft fibreglass sjark has been replaced by the 31 ft fibreglass sjark, at no cost.'}); } }
  if (o.order && o.order.type === 'jukesjark') o.order.type = 'plastsjark';
  // a saved fleet: point the vessel fields at the vessel being followed before anything else reads them
  if (o.fleet && o.fleet.length){ const v = o.fleet.find(x => x.id === o.cur) || o.fleet[0]; for (const k of VKEYS) o[k] = v[k]; }
  // the catch's handling follows the work chains now (13-work.js catchGut): the old switches go, once
  if (o.settings && !o.settings.catchByWork){ delete o.settings.gut; delete o.settings.ice; o.settings.catchByWork = true; }
  // the radar left the boat models for the deck kit (20.10.2026: it is bought at the tackle shop, tools/deck/sikker.py): a boat that had one
  // in her model keeps it, the dome or the open array she had, once
  if (o.settings && !o.settings.radarKit){ o.settings.radarKit = true; const R = {plastsjark:'radar', sjark:'radar', hurtigsjark:'radar', sjarkny:'radar', breisjark:'radarA', kyst15:'radarA', kyst21:'radarA'};
    for (const v of [o, ...(o.fleet || [])]){ const k = v.boat && R[v.boat.type]; if (k){ v.equip = v.equip || {}; if (!v.equip.radar && !v.equip.radarA) v.equip[k] = true; } } }
  // Father's naust moved from Finnsnes to Vangshamn (Jonas 08.10.2026): the home goes there; a boat at the old naust lies at the quay
  if (o.intro && (!o.home || o.home === 'finnsnes') && !/notut/.test(location.hash)){ o.home = HOME0; o.naust = null;   // (not the tests' games, #notut)
    for (const v of [o, ...(o.fleet || [])]) if (v.boat && v.boat.port === 'finnsnes' && v.boat.berth === 'naust') delete v.boat.berth; }
  return o; } catch (e) { return null; } }

// ---------- UI state ----------
const $ = id => document.getElementById(id);
const svg = $('map'), gStatic = $('gStatic'), gDyn = $('gDyn'), hud = $('hud'), panel = $('panel');
let tab = 'route', panelDirty = true, pressHold = false;
const view = {cx:0, cy:0, z:1.35, px:10};
hooks.onLog = () => { panelDirty = true; };

// ms: how long it stays (a message from the phone, 10 s: Jonas 13.10.2026 «De forsvinner ganske fort nå»); a short note over a message
// that is still up gives the message back for the rest of its time
// Nothing pops up over the loading screen (Jonas 02.11.2026): while «Laster kysten …» is up (body.booting), the dialogs and overlays
// are hidden in styles.css and the toasts wait in a queue; loaderGone() takes the screen away and plays what waited, in order
function booting(){ return document.body.classList.contains('booting'); }
function loaderGone(){
  const ld = document.getElementById('loader'); if (ld) ld.classList.add('gone');
  if (typeof boot3dShown === 'function' && typeof G3 !== 'undefined' && G3.isActive()) boot3dShown();   // the first 3D picture timed (11-boot.js)
  if (!booting()) return; document.body.classList.remove('booting');
  const q = (toast._q || []).filter(([m]) => m !== t('loading3d')); toast._q = null;
  let at = 700;   // after the fade
  for (const [m, ms] of q){ setTimeout(() => toast(m, ms), at); at += Math.min(ms || 2600, 6000); }
}
// the toast stands over the dock's fan or card and the set line, never on top of them (spilltest 3, U4; Jonas 05.11.2026, V3 A)
function toastPlace(el){
  el.style.bottom = ''; if (el.classList.contains('up') || document.body.classList.contains('dk-open')) return;
  let top = Infinity; for (const id of ['dockFan', 'setBar']){ const e = document.getElementById(id); if (!e || e.hidden || !e.innerHTML.trim()) continue; const r = e.getBoundingClientRect(); if (r.height > 8 && getComputedStyle(e).visibility !== 'hidden') top = Math.min(top, r.top); }
  if (top < Infinity) el.style.bottom = Math.max(0, window.innerHeight - top + 8) + 'px';
}
// a toast that still stands when the player opens something new in the dock goes (an old «Du har ikke redskap i sjøen.» stayed over the card)
function toastClear(){ const el = document.getElementById('toast'); if (el){ clearTimeout(toast._t); toast._keep = null; el.classList.remove('on'); } }
function toast(msg, ms){
  if (booting()){ (toast._q = toast._q || []).push([msg, ms]); if (toast._q.length > 12) toast._q.shift(); return; }
  // a message breaks the calm (UI 2, U2-4, ui/10c-dock.js CALM): the buttons come back with it, so it can be acted on (the try: a toast
  // before the dock's file has run finds no DOCK yet)
  try { DOCK.wake('toast'); } catch (e){}
  const el = $('toast'); toast._at = Date.now(); if (ms) toast._keep = {msg, until:Date.now() + ms};
  el.textContent = msg; toastPlace(el); el.classList.add('on'); clearTimeout(toast._t);
  const back = () => { const k = toast._keep; if (k && k.msg !== msg && k.until > Date.now() + 500){ msg = k.msg; el.textContent = msg; toast._t = setTimeout(back, k.until - Date.now()); return; }
    toast._keep = null; el.classList.remove('on'); };
  toast._t = setTimeout(back, ms || 2600);
}


// The saved game as a code (P1 of the PWA plan, 03.10.2026): the artifact and the app on the home screen are two places, each with
// its own storage, so a game is carried across as text, the save gzipped in base64 after «KYST2:» (Innstillinger on the phone).
const b64of = u => { let s = ''; for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); return btoa(s); };
async function saveCode(){
  if (!tabMine()) return null;   // (a page passed by another sends nothing: the game here is the other page's now)
  save(); const raw = localStorage.getItem(KEY); if (!raw) return null;
  const z = new Uint8Array(await new Response(new Blob([raw]).stream().pipeThrough(new CompressionStream('gzip'))).arrayBuffer());
  return 'KYST2:' + b64of(z);
}
// a code read in: checked, then stored in place of the game here (the page is loaded again after it, ui/05-phone.js)
// a save code read without loading it: the game as JSON text and as an object
async function codeRead(code){
  const m = /^KYST2:([A-Za-z0-9+/=\s]+)$/.exec((code || '').trim()); if (!m) throw new Error('not a save code');
  const raw = await new Response(new Blob([b64bytes(m[1].replace(/\s/g, ''))]).stream().pipeThrough(new DecompressionStream('gzip'))).text();
  const o = JSON.parse(raw); if (!o || o.v !== 2 || !(o.boat || (o.fleet && o.fleet.length))) throw new Error('not a game of this version');
  return {raw, o};
}
// the game on this device before another was loaded over it (cloud pulls, a code, a game taken back), so it can be had again
const KEY_PREV = 'kystfiske_v2_prev';
async function loadCode(code){
  const {raw, o} = await codeRead(code);
  try { const cur = localStorage.getItem(KEY); if (cur && cur !== raw) localStorage.setItem(KEY_PREV, cur); } catch (e){}
  // (two games may not fit the browser's storage: the game being loaded goes first)
  SAVE_OFF = true; try { localStorage.setItem(KEY, raw); } catch (e){ localStorage.removeItem(KEY_PREV); localStorage.setItem(KEY, raw); } tabMark(); return o;
}
