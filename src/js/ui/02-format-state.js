// ---------- formatting ----------
// real calendar days on this device (local date), for the daily login bonus
function dayKey(d){ d = d || new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
function dayNum(k){ const [y, m, dd] = k.split('-').map(Number); return Math.round(Date.UTC(y, m - 1, dd) / 864e5); }
function fmt(n, d = 0){ return new Intl.NumberFormat(S.lang === 'no' ? 'nb-NO' : 'en-GB', {minimumFractionDigits:d, maximumFractionDigits:d}).format(n); }
function kr(n){ return S.lang === 'no' ? fmt(Math.round(n)) + ' kr' : 'NOK ' + fmt(Math.round(n)); }
// real time for a stretch of game time: the clock runs GAME_RATE × S.mult game minutes per real minute
function realMin(gameMin){ return gameMin / simRate(); }
function realDur(gameMin){ const m = realMin(Math.max(0, gameMin)), no = S.lang === 'no';
  if (m < 1) return no ? 'under 1 min' : 'under a minute';
  if (m < 59.5) return Math.round(m) + ' min';
  const tm = Math.round(m), hh = Math.floor(tm / 60), mm = tm % 60;
  if (hh < 24) return hh + (no ? ' t' : ' h') + (mm ? ' ' + mm + ' min' : '');
  const d = Math.floor(hh / 24), h2 = hh % 24; return d + ' d' + (h2 ? ' ' + h2 + (no ? ' t' : ' h') : ''); }
function inReal(gameMin){ return (S.lang === 'no' ? 'om ' : 'in ') + realDur(gameMin); }
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
  return f(lat, 2) + 'N ' + f(lon, 3) + (S.lang === 'no' ? 'Ø' : 'E');
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
function save(){ if (SAVE_OFF) return; try { S.lastReal = Date.now(); let o = S; if (S.fleet && S.fleet.length){ storeVessel(curVessel()); o = Object.assign({}, S); for (const k of VKEYS) delete o[k]; } localStorage.setItem(KEY, JSON.stringify(o)); } catch (e) {} }
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
  // a saved fleet: point the vessel fields at the vessel being followed before anything else reads them
  if (o.fleet && o.fleet.length){ const v = o.fleet.find(x => x.id === o.cur) || o.fleet[0]; for (const k of VKEYS) o[k] = v[k]; }
  // the catch's handling follows the work chains now (13-work.js catchGut): the old switches go, once
  if (o.settings && !o.settings.catchByWork){ delete o.settings.gut; delete o.settings.ice; o.settings.catchByWork = true; }
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

function toast(msg){ const el = $('toast'); el.textContent = msg; el.classList.add('on'); clearTimeout(toast._t); toast._t = setTimeout(() => el.classList.remove('on'), 2600); }


// The saved game as a code (P1 of the PWA plan, 03.10.2026): the artifact and the app on the home screen are two places, each with
// its own storage, so a game is carried across as text, the save gzipped in base64 after «KYST2:» (Innstillinger on the phone).
const b64of = u => { let s = ''; for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); return btoa(s); };
async function saveCode(){
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
  SAVE_OFF = true; try { localStorage.setItem(KEY, raw); } catch (e){ localStorage.removeItem(KEY_PREV); localStorage.setItem(KEY, raw); } return o;
}
