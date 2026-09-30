// ---------- formatting ----------
// real calendar days on this device (local date), for the daily login bonus
function dayKey(d){ d = d || new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
function dayNum(k){ const [y, m, dd] = k.split('-').map(Number); return Math.round(Date.UTC(y, m - 1, dd) / 864e5); }
function fmt(n, d = 0){ return new Intl.NumberFormat(S.lang === 'no' ? 'nb-NO' : 'en-GB', {minimumFractionDigits:d, maximumFractionDigits:d}).format(n); }
function kr(n){ return S.lang === 'no' ? fmt(Math.round(n)) + ' kr' : 'NOK ' + fmt(Math.round(n)); }
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
const KEY = 'kystfiske_proto_v1';
function save(){ try { S.lastReal = Date.now(); let o = S; if (S.fleet && S.fleet.length){ storeVessel(curVessel()); o = Object.assign({}, S); for (const k of VKEYS) delete o[k]; } localStorage.setItem(KEY, JSON.stringify(o)); } catch (e) {} }
function load(){ try { const s = localStorage.getItem(KEY); if (!s) return null; const o = JSON.parse(s); if (!o || o.v !== 1) return null;
  // a saved fleet: point the vessel fields at the vessel being followed before anything else reads them
  if (o.fleet && o.fleet.length){ const v = o.fleet.find(x => x.id === o.cur) || o.fleet[0]; for (const k of VKEYS) o[k] = v[k]; }
  return o; } catch (e) { return null; } }

// ---------- UI state ----------
const $ = id => document.getElementById(id);
const svg = $('map'), gStatic = $('gStatic'), gDyn = $('gDyn'), hud = $('hud'), panel = $('panel');
let tab = 'route', panelDirty = true, pressHold = false;
const view = {cx:0, cy:0, z:1.35, px:10};
hooks.onLog = () => { panelDirty = true; };

function toast(msg){ const el = $('toast'); el.textContent = msg; el.classList.add('on'); clearTimeout(toast._t); toast._t = setTimeout(() => el.classList.remove('on'), 2600); }

