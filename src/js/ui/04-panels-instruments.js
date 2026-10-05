// ---------- estimates ----------
function estimate(){
  const b = S.boat, H = S.t / 60, W = windAt(H);
  let km = 0, fishH = 0, bad = -1, a = b.pos;
  S.draft.forEach((w, i) => { km += dist(a, w); if (bad < 0 && !legClear(a, w)) bad = i; fishH += w.fish || 0; a = w; });
  const v = Math.min(S.draftSpeed, speedCap(hsAt(b.pos, H)));
  const nm = km / NM, hours = nm / v, fuel = fuelLph(v, W) * hours;
  return {nm, hours, fishH, fuel, bad, v};
}

// ---------- panels ----------
const TABS = ['route', 'fish', 'hold', 'wx', 'port', 'log'];
function renderTabs(){
  $('tabs').innerHTML = TABS.map(k => '<button type="button" role="tab" data-tab="' + k + '" aria-selected="' + (k === tab) + '">' + t('tab_' + k) + '</button>').join('');
}
function setTab(k){ tab = k; renderTabs(); panelDirty = true; renderPanel(); panel.scrollTop = 0; }
$('tabs').addEventListener('click', e => { const bt = e.target.closest('[data-tab]'); if (bt) setTab(bt.dataset.tab); });

function statusText(){
  const b = S.boat;
  if (S.plan && S.plan.depAt) return t('st_waiting', hm(S.plan.depAt / 60));
  if (b.status === 'aground') return t('st_aground');
  if (b.status === 'port') return t(b.land ? 'st_landing' : b.shift ? 'st_shift' : b.fueling ? 'st_fueling' : 'st_port', portById(b.port).name);
  if (b.status === 'sailing') return t(S.plan && S.plan.returning ? 'st_returning' : 'st_sailing', fmt(b.v, 0));
  if (b.gop){ const g = gopText(); return GL(g[2], g[3]); }
  if (b.status === 'tow' && b.tow) return t('st_tow_' + b.tow.ph, fmt(b.v, 0));
  return t('st_' + b.status);
}
// the most imminent event for the boat you are looking at: what and when (game minutes)
function nextEvent(){
  const b = S.boat, T = S.t, ev = [], L = (no, en) => S.lang === 'no' ? no : en;
  const add = (t, txt) => { if (t != null && Number.isFinite(t) && t >= T) ev.push({t, txt}); };
  if (S.plan && S.plan.depAt && (b.status === 'port' || b.status === 'idle')) add(S.plan.depAt, L('Avgang', 'Departure'));
  if (b.land) add(b.land.until, L('Sluttseddelen', 'The landing note'));
  if (b.fueling) add(b.fueling.until, L('Bunkringen er ferdig', 'Fuelling done'));
  if (b.shift) add(b.shift.until, L('Forhalingen er ferdig', 'Shifting done'));
  if (b.status === 'fishing' && b.fishUntil != null) add(b.fishUntil, L('Fisket er ferdig', 'Fishing done'));
  if (b.status === 'port' && S.jobs && S.jobs.length && S.jobs[0].until) add(S.jobs[0].until, L('Verkstedet er ferdig', 'The yard is done'));
  if (b.status === 'sailing' && S.plan && S.plan.idx < S.plan.wps.length){
    const wps = S.plan.wps; let a = b.pos, km = 0, stop = null;
    for (let i = S.plan.idx; i < wps.length; i++){ km += dist(a, wps[i]); a = wps[i]; if (wpStop(wps[i]) || i === wps.length - 1){ stop = wps[i]; break; } }
    const kn = Math.max(4, b.v || S.plan.speed || 10);
    if (stop) add(T + km / (kn * NM) * 60, stop.port ? L('Fremme i ', 'Arriving at ') + portById(stop.port).name : stop.fish > 0 ? L('Fremme på feltet', 'On the grounds') : L('Fremme ved neste stopp', 'At the next stop'));
  }
  ev.sort((x, y) => x.t - y.t); return ev[0] || null;
}
// innerHTML only when the markup has changed (the tick writes the boxes five times a second); el.dataset.v counts the changes
function setHtml(el, h){ if (el._h === h) return false; el._h = h; el.innerHTML = h; el.dataset.v = (+el.dataset.v || 0) + 1; return true; }
let hudV = '', hudT = 0;
function renderHud(){
  const b = S.boat, H = S.t / 60, W = windAt(H), hs = hsAt(b.pos, H), atSea = b.status !== 'port';
  const lvl = riskLevel(W, hs);
  const dot = b.status === 'adrift' || b.status === 'engine' ? 'bad' : (b.status === 'sailing' || b.status === 'fishing') ? 'go' : '';
  document.body.classList.toggle('sailing', b.status === 'sailing');
  hudClasses();
  // minimised (Jonas 05.10.2026: «Spillere skal kunne trykke minimer på disse, som gjør slik at bare basisinformasjonen vises på en tynn
  // stripe»): the time, what the boat is doing and the money on one line, and only the warnings that matter (the sea, low energy)
  if (S.settings.hudMin){
    const e = S.energy == null ? 100 : S.energy, no = S.lang === 'no';
    const warn = (atSea && lvl >= 1 ? '<b class="r' + lvl + '">' + fmt(hs, 1) + ' m</b>' : '') + (!energyOff() && (asleep() || e < ENERGY.warn) ? '<b class="' + (asleep() || e < ENERGY.dim ? 'r2' : 'r1') + '">⚡' + Math.round(e) + ' %</b>' : '');
    setHtml(hud, '<div class="hstrip"><span class="ht">' + hm(S.t / 60) + '</span><i class="dot ' + dot + '"></i><span class="hs">' + statusText() + '</span>' + warn +
      '<b class="' + (S.cash < 0 ? 'r2' : '') + '">' + kr(S.cash) + '</b><button type="button" class="hmin" data-hmin="hud" aria-label="' + (no ? 'Vis alt' : 'Show all') + '">+</button></div>');
  } else {
  const nx = nextEvent();
  setHtml(hud, '<div class="hd"><span>' + dayStr(S.t / 60) + ' ' + hm(S.t / 60) + '</span><b class="' + (S.cash < 0 ? 'r2' : '') + '">' + kr(S.cash) + '</b><button type="button" class="hmin" data-hmin="hud" aria-label="' + (S.lang === 'no' ? 'Minimer' : 'Minimise') + '">–</button></div><div class="st"><i class="dot ' + dot + '"></i>' + statusText() + '</div>' + (nx ? '<div class="st nx">⏱ ' + nx.txt + ' ' + inReal(nx.t - S.t) + ' <small>(' + hm(nx.t / 60) + ')</small></div>' : '') +
    (S.fleet && S.fleet.length > 1 ? '<div class="row"><span>' + (S.lang === 'no' ? 'Båt' : 'Vessel') + '</span><b>' + S.boatName + (meAboard() ? ' ⚓' : '') + '</b></div>' : '') +
    '<div class="row"><span>' + t('wind') + '</span><b>' + dirName(windDir(H)) + ' ' + fmt(W, 1) + ' m/s</b></div>' +
    '<div class="row"><span>' + t('waves') + '</span><b>' + fmt(hs, 1) + ' m' + (atSea ? ' <span class="r' + lvl + '">' + t('risk' + lvl) + '</span>' : '') + '</b></div>' +
    (() => { if (!atSea) return ''; const z = motionHere(H, b).state; if (!z.lvl) return ''; const L = (no, en) => S.lang === 'no' ? no : en;
      return '<div class="row"><span>' + L('Stabilitet', 'Stability') + '</span><b class="r' + z.lvl + '">' + {gm:L('rank', 'tender'), res:L('synkronrulling', 'synchronous roll'), roll:L('kraftig rulling', 'heavy rolling')}[z.why] + '</b></div>'; })() +
    // the rules where you are (03e-rules.js ruNow): a tap opens the Regler app
    (() => { if (!atSea || !RU.ok) return ''; const r = ruNow(), it = r.items.find(i => i.v === r.v && i.v !== 'ok'); const L = (no, en) => S.lang === 'no' ? no : en;
      return '<div class="row rlink"><span>' + L('Regler', 'Rules') + '</span><b class="' + (r.v === 'no' ? 'r2' : r.v === 'warn' ? 'r1' : 'r0') + '">' + (r.v === 'no' ? '✕ ' : r.v === 'warn' ? '! ' : '✓ ') + (it ? ruShort(it) : L('Lov her', 'Allowed here')) + ' ›</b></div>'; })() +
    '<div class="row"><span>' + t('fuel') + '</span><b>' + fmt(b.fuel, 0) + ' / ' + BOAT.fuelCap + ' L</b></div>' +
    '<div class="row"><span>' + t('hold') + '</span><b>' + fmt(holdTotal(), 0) + ' / ' + capHold() + ' kg</b></div>' +
    (() => { const e = S.energy == null ? 100 : S.energy; return '<div class="row"><span>' + (S.lang === 'no' ? 'Energi' : 'Energy') + '</span><b class="' + (asleep() ? 'r2' : e < ENERGY.dim ? 'r2' : e < ENERGY.warn ? 'r1' : '') + '">' + (energyOff() ? (S.lang === 'no' ? 'av' : 'off') : asleep() ? (S.lang === 'no' ? 'sover' : 'asleep') : Math.round(e) + ' %') + '</b></div>'; })() +
    (streakPct() > 0 ? '<div class="row"><span>' + (S.lang === 'no' ? 'Bonus' : 'Bonus') + '</span><b>+' + fmt(streakPct(), 0) + ' %</b></div>' : '') +
    (() => { const cp = coldPen(S.t / 60); return cp > 0.03 ? '<div class="row"><span>' + (S.lang === 'no' ? 'Kulde' : 'Cold') + '</span><b class="cold">−' + Math.round(cp * 100) + ' % · ' + Math.round(effTemp(S.t / 60)) + ' °C</b></div>' : ''; })() +
    (haillStage() ? '<div class="row"><span>' + (S.lang === 'no' ? 'Haill' : 'Luck') + '</span><b class="haill">' + haillStage()[S.lang] + ' +' + Math.round(haillBoost() * 100) + ' %</b></div>' : ''));
  }
  // the boxes under the status box in 3D take their place and width from it: measured when its content has changed and every 2 s (setting
  // them on the chart's parent every tick restyled the whole chart)
  if (hud.dataset.v !== hudV || performance.now() - hudT > 2000){ hudV = hud.dataset.v; hudT = performance.now(); requestAnimationFrame(() => { const mw = $('mapwrap').style, hr = hud.getBoundingClientRect(), top = Math.round(hr.bottom - $('mapwrap').getBoundingClientRect().top + 6) + 'px', w = Math.round(hr.width) + 'px'; if (mw.getPropertyValue('--gpsTop') !== top) mw.setProperty('--gpsTop', top); if (mw.getPropertyValue('--hudW') !== w) mw.setProperty('--hudW', w); }); }
}
// position/heading between simulation steps, so instruments and 3D move smoothly
function liveFrac(){ return clamp(acc + (Date.now() - lastWall) / 1000 * simRate() / 60, 0, 0.999); }
function livePose(frac){
  if (frac === undefined) frac = liveFrac();
  const b = S.boat; let p = {x:b.pos.x, y:b.pos.y}, hd = b.heading;
  if (helmOn()) return helmPose(frac);
  if (b.status === 'tow'){ const q = towPose(frac); if (q && q.b) return {p:q.b.p, hd:q.b.hd, frac}; }
  if (b.status === 'sailing' && S.plan){
    let left = sailV(S.t / 60) * NM / 60 * frac, idx = S.plan.idx;
    while (left > 1e-9 && idx < S.plan.wps.length){
      const w = S.plan.wps[idx], d = dist(p, w);
      if (d > 1e-6) hd = Math.atan2(w.x - p.x, -(w.y - p.y));
      if (d <= left){ p = {x:w.x, y:w.y}; left -= d; if (wpStop(w)) break; idx++; }
      else { p = {x:p.x + (w.x - p.x) / d * left, y:p.y + (w.y - p.y) / d * left}; left = 0; }
    }
  }
  return {p, hd, frac};
}
function vnoise2(x, y, s){
  const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy, ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
  const h = (a, c) => hash(Math.imul(a, 374761393) ^ Math.imul(c + s * 7919, 668265263));
  return (h(ix, iy) * (1 - ux) + h(ix + 1, iy) * ux) * (1 - uy) + (h(ix, iy + 1) * (1 - ux) + h(ix + 1, iy + 1) * ux) * uy;
}
// small-scale bottom texture on top of the 50 m model (finer data is classified in Norway)
function microBottom(p, d){ return (vnoise2(p.x * 40, p.y * 40, 3) - 0.5) * Math.min(4, 0.06 * d) + (vnoise2(p.x * 140, p.y * 140, 5) - 0.5) * Math.min(1.2, 0.02 * d); }

// ---------- instruments: GPS and echo sounder ----------
const INSTR = (() => {
  // the GPS's readings in the chart plotter's top bar (#ecdisTop); the GPS box and the little echogram box beside it went on
  // 02.10.2026 (the user's wishes: the box's lines are in the bar, the echo sounder's fish shows on the chart with its scale in the
  // bar). WPT, XTE and ETA show while a route is sailed (body.navon). echoOn: the echo sounder's setting, which the heat map and
  // the skiff's console follow
  const echoOn = () => !S.settings || S.settings.echo !== false;
  function show(){ renderGPS(); }
  // a grid heading (radians) as the true bearing the instruments show
  const deg3 = (r, p) => String(Math.round(trueDeg(r, p || S.boat.pos)) % 360).padStart(3, '0') + '°';
  function gpsLL(p){
    const {lat, lon} = LL(p), f = (v, w, hh) => { const a = Math.abs(v), dd = Math.floor(a); let m = ((a - dd) * 60).toFixed(3).padStart(6, '0'); if (S.lang === 'no') m = m.replace('.', ','); return String(dd).padStart(w, '0') + '°' + m + "'" + hh; };
    return [f(lat, 2, 'N'), f(lon, 3, S.lang === 'no' ? 'Ø' : 'E')];
  }
  // the route's numbers: the next point (number, distance, bearing, time), the cross-track error and the time at the end
  function navOf(pose, H, sog){
    const b = S.boat; if (!(S.plan && S.plan.idx < S.plan.wps.length && b.status !== 'port')) return null;
    const wps = S.plan.wps.slice(S.plan.idx), w = wps[0], dw = dist(pose.p, w), brg = Math.atan2(w.x - pose.p.x, -(w.y - pose.p.y));
    let tot = 0, a = pose.p, fishH = 0; wps.forEach((q, i) => { tot += dist(a, q); a = q; if (i && q.fish > 0) fishH += q.fish; });
    const v = (sog || S.plan.speed || 10) * NM, last = wps[wps.length - 1], H0 = S.plan.depAt ? Math.max(H, S.plan.depAt / 60) : H;
    // off the leg from the last point to the next, to starboard (R) or port (L)
    const p0 = S.plan.idx > 0 ? S.plan.wps[S.plan.idx - 1] : null, lx = p0 ? w.x - p0.x : 0, ly = p0 ? w.y - p0.y : 0, ll2 = Math.hypot(lx, ly);
    const xt = ll2 > 1e-6 ? (lx * (pose.p.y - p0.y) - ly * (pose.p.x - p0.x)) / ll2 : 0;
    return {n:S.plan.idx + 1, wpt:fmt(dw / NM, 2) + ' nm ' + deg3(brg), at:hm(H0 + dw / v), xte:fmt(Math.abs(xt) / NM, 2) + ' nm' + (Math.abs(xt) < 0.005 ? '' : xt > 0 ? ' R' : ' L'),
      dest:last.port ? portById(last.port).name : 'WPT ' + S.plan.wps.length, eta:hm(H0 + tot / v + fishH)};
  }
  // the box under the little chart in 3D (the user's wish 02.10.2026): the same width and look as the status box over it
  function render3d(pose, H, sog, ll, nv){
    const el = $('gps3d'), no = S.lang === 'no', on = S.boat.status !== 'port';
    GPS3D = {kn:fmt(sog, 1) + ' kn', crs:deg3(pose.hd), ll, nv};   // the little chart's foot (03e-miniplot.js)
    if (!el) return;
    if (S.settings.plotMin){ if (el.hidden) el.hidden = false; const pm = $('plotMin'); if (pm.textContent !== '+'){ pm.textContent = '+'; pm.setAttribute('aria-label', no ? 'Vis kartplotteren' : 'Show the chart plotter'); }
      setHtml(el, '<div class="gstrip"><b>' + fmt(sog, 1) + ' kn</b><b>' + deg3(pose.hd) + '</b><span>' + ll[0] + ' ' + ll[1] + '</span></div>'); return; }
    { const pm = $('plotMin'); if (pm.textContent !== '–'){ pm.textContent = '–'; pm.setAttribute('aria-label', no ? 'Minimer kartplotteren' : 'Minimise the chart plotter'); } }
    if (el.hidden === on) el.hidden = !on; if (!on) return;
    const row = (k, v) => '<div class="row"><span>' + k + '</span><b>' + v + '</b></div>';
    setHtml(el, row(no ? 'Fart' : 'Speed', fmt(sog, 1) + ' kn') + row(no ? 'Kurs' : 'Course', deg3(pose.hd)) + row('POS', ll[0]) + row('', ll[1]) +
      (nv ? row('WPT ' + nv.n, nv.wpt) + row('XTE', nv.xte) + row(no ? 'Neste' : 'Next', nv.at) + row('ETA ' + nv.dest, nv.eta) : ''));
  }
  const GPSC = {k:'', nx:null, st:null};
  function renderGPS(){
    const v3 = document.body.classList.contains('v3d'); if (!v3 && !document.body.classList.contains('vplot')) return;
    const pose = livePose(), b = S.boat, H = (S.t + pose.frac) / 60, sog = b.status === 'sailing' || (b.status === 'tow' && b.tow && b.tow.ph === 'tow') ? b.v : 0, ll = gpsLL(pose.p), no = S.lang === 'no', nv = navOf(pose, H, sog);
    if (v3){ render3d(pose, H, sog, ll, nv); return; }
    const nav = !!nv;
    if (document.body.classList.contains('navon') !== nav) document.body.classList.toggle('navon', nav);
    if (nav){
      $('ecWptL').textContent = 'WPT ' + nv.n + ' · ' + nv.at; $('ecWpt').textContent = nv.wpt; $('ecXte').textContent = nv.xte;
      $('ecEtaL').textContent = 'ETA · ' + nv.dest.toUpperCase(); $('ecEta').textContent = nv.eta;
    }
    $('ecHdg').textContent = deg3(pose.hd); $('ecCog').textContent = deg3(pose.hd); $('ecSog').textContent = fmt(sog, 1) + ' kn'; $('ecPos').innerHTML = ll[0] + '<br>' + ll[1]; $('ecDepL').textContent = no ? 'DYBDE' : 'DEPTH'; $('ecDep').textContent = b.status === 'port' ? '–' : fmt(depthF(pose.p) + tideCD(H), 1) + ' m';
    // the next tide and the sun's day change slowly: worked out again every 10 game minutes or km
    const tk = Math.floor(S.t / 10) + ':' + Math.round(pose.p.x) + ':' + Math.round(pose.p.y);
    if (GPSC.k !== tk){ GPSC.k = tk; GPSC.nx = tideEvents(H, 14)[0]; GPSC.st = sunTimes(H); }
    const th = tideH(H), up = tideH(H + 0.25) > th, nx = GPSC.nx && GPSC.nx.t > H ? GPSC.nx : (GPSC.nx = tideEvents(H, 14)[0]), st = GPSC.st;
    $('ecTideL').textContent = no ? 'TIDEVANN' : 'TIDE'; $('ecTide').textContent = (th >= 0 ? '+' : '') + fmt(th, 1) + ' m ' + (up ? '↑' : '↓') + (nx ? ' ' + (nx.kind === 'high' ? (no ? 'flo ' : 'HW ') : (no ? 'fjære ' : 'LW ')) + hm(nx.t) : '');
    $('ecSunL').textContent = no ? 'SOL' : 'SUN'; $('ecSun').textContent = st.always ? (no ? 'Midnattssol' : 'Midnight sun') : st.never ? (no ? 'Mørketid' : 'Polar night') : '↑' + (st.up ? hm(st.up) : '–') + ' ↓' + (st.dn ? hm(st.dn) : '–');
  }
  document.addEventListener('visibilitychange', () => { if (!document.hidden) show(); });
  return {show, renderGPS, echoOn};
})();
// a tap on the rules line in the status box opens the Regler app
hud.addEventListener('click', e => { const m = e.target.closest('[data-hmin]'); if (m){ e.stopPropagation(); hudFold('hud'); return; } if (e.target.closest('.rlink')) PHONE.open('regler'); });
// the status box and the little chart each fold to a strip (S.settings.hudMin, plotMin), and «Vis HUD» in the settings takes them all
// away (hudOff): the status box, the little chart, its GPS strip and the compass
function hudClasses(){
  const st = S.settings || {}, c = document.body.classList;
  if (c.contains('hudmin') !== !!st.hudMin) c.toggle('hudmin', !!st.hudMin);
  if (c.contains('plotmin') !== !!st.plotMin) c.toggle('plotmin', !!st.plotMin);
  if (c.contains('hudoff') !== !!st.hudOff) c.toggle('hudoff', !!st.hudOff);
}
function hudFold(which){
  if (which === 'hud') S.settings.hudMin = !S.settings.hudMin; else S.settings.plotMin = !S.settings.plotMin;
  save(); renderHud(); if (typeof renderGPS === 'function') renderGPS();
}
$('plotMin').addEventListener('click', e => { e.stopPropagation(); hudFold('plot'); });
