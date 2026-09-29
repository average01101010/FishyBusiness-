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
  if (b.status === 'port') return t('st_port', portById(b.port).name);
  if (b.status === 'sailing') return t(S.plan && S.plan.returning ? 'st_returning' : 'st_sailing', fmt(b.v, 0));
  return t('st_' + b.status);
}
function renderHud(){
  const b = S.boat, H = S.t / 60, W = windAt(H), hs = hsAt(b.pos, H), atSea = b.status !== 'port';
  const lvl = riskLevel(W, hs);
  const dot = b.status === 'adrift' || b.status === 'engine' ? 'bad' : (b.status === 'sailing' || b.status === 'fishing') ? 'go' : '';
  document.body.classList.toggle('sailing', b.status === 'sailing');
  requestAnimationFrame(() => { $('mapwrap').style.setProperty('--gpsTop', (hud.offsetTop + hud.offsetHeight + 6) + 'px'); });
  hud.innerHTML = '<div class="hd"><span>' + dayStr(S.t / 60) + ' ' + hm(S.t / 60) + '</span><b class="' + (S.cash < 0 ? 'r2' : '') + '">' + kr(S.cash) + '</b></div><div class="st"><i class="dot ' + dot + '"></i>' + statusText() + '</div>' +
    '<div class="row"><span>' + t('wind') + '</span><b>' + dirName(windDir(H)) + ' ' + fmt(W, 1) + ' m/s</b></div>' +
    '<div class="row"><span>' + t('waves') + '</span><b>' + fmt(hs, 1) + ' m' + (atSea ? ' <span class="r' + lvl + '">' + t('risk' + lvl) + '</span>' : '') + '</b></div>' +
    '<div class="row"><span>' + t('fuel') + '</span><b>' + fmt(b.fuel, 0) + ' / ' + BOAT.fuelCap + ' L</b></div>' +
    '<div class="row"><span>' + t('hold') + '</span><b>' + fmt(holdTotal(), 0) + ' / ' + capHold() + ' kg</b></div>' +
    ((S.tubs || hullClean()) ? '<div class="row"><span>' + (S.lang === 'no' ? 'Ekstra' : 'Extras') + '</span><b>' + [S.tubs ? '🧺 +' + S.tubs + ' kg' : '', hullClean() ? '🧽 −10 %' : ''].filter(Boolean).join(' · ') + '</b></div>' : '') +
    (() => { const cp = coldPen(S.t / 60); return cp > 0.03 ? '<div class="row"><span>' + (S.lang === 'no' ? 'Kulde' : 'Cold') + '</span><b class="cold">−' + Math.round(cp * 100) + ' % · ' + Math.round(effTemp(S.t / 60)) + ' °C</b></div>' : ''; })() +
    (S.haill && haillF() > 0 ? '<div class="row"><span>' + (S.lang === 'no' ? 'Haill' : 'Luck') + '</span><b class="haill">' + HAILL[S.haill.type][S.lang] + ' ' + Math.round(haillF() * 100) + ' %</b></div>' : '');
}
// position/heading between simulation steps, so instruments and 3D move smoothly
function liveFrac(){ return clamp(acc + (Date.now() - lastWall) / 1000 * GAME_RATE * S.mult / 60, 0, 0.999); }
function livePose(frac){
  if (frac === undefined) frac = liveFrac();
  const b = S.boat; let p = {x:b.pos.x, y:b.pos.y}, hd = b.heading;
  if (b.status === 'sailing' && S.plan){
    let left = sailV(S.t / 60) * NM / 60 * frac, idx = S.plan.idx;
    while (left > 1e-9 && idx < S.plan.wps.length){
      const w = S.plan.wps[idx], d = dist(p, w);
      if (d > 1e-6) hd = Math.atan2(w.x - p.x, -(w.y - p.y));
      if (d <= left){ p = {x:w.x, y:w.y}; left -= d; if (w.port || w.fish > 0) break; idx++; }
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
  const box = $('instr'), gps = $('gps'), cv = $('echo'), ctx = cv.getContext('2d'), dEl = $('echoDepth'), tEl = $('echoTemp'), sEl = $('echoScale');
  let raf = 0, last = 0, range = 0, W = 0, Hp = 0, dpr = 1, jig = 0;
  const targets = [], STEPS = [10, 20, 30, 50, 80, 120, 200, 300, 500, 800];
  const BAND = {torsk:d => d - 1 - Math.random() * Math.min(12, d * 0.3), hyse:d => d - 0.4 - Math.random() * Math.min(4, d * 0.1), sei:d => d * (0.25 + Math.random() * 0.5), lange:d => d - 0.4 - Math.random() * 2.5, brosme:d => d - 0.4 - Math.random() * 2.5, lyr:d => d * (0.6 + Math.random() * 0.35), uer:d => d - 0.6 - Math.random() * 3, kveite:d => d - 0.3 - Math.random() * 1.2};
  const on = () => true;
  function show(){ box.hidden = !on(); if (on() && !raf) raf = requestAnimationFrame(loop); renderGPS(); }
  function clear(){ ctx.fillStyle = '#021628'; ctx.fillRect(0, 0, W, Hp); }
  function setRange(r){ if (r === range) return; range = r; clear(); sEl.innerHTML = [0.25, 0.5, 0.75].map(f => '<span style="top:calc(' + f * 100 + '% - 5px)">' + Math.round(r * f) + '</span>').join('') + '<span style="bottom:1px">' + r + '</span>'; }
  function loop(ts){
    raf = 0; if (!on() || document.hidden) return; raf = requestAnimationFrame(loop);
    dpr = Math.min(2, window.devicePixelRatio || 1);
    const hid = !cv.clientWidth; if (hid) dpr = 1; const w = hid ? 200 : Math.round(cv.clientWidth * dpr), h = hid ? 290 : Math.round(cv.clientHeight * dpr); if (!w || !h) return;
    if (w !== W || h !== Hp){ W = cv.width = w; Hp = cv.height = h; range = 0; }
    if (ts - last < 100) return; last = ts; ping();
  }
  function ping(){
    const pose = livePose(), p = pose.p, H = (S.t + pose.frac) / 60, b = S.boat;
    let d = Math.max(1, depthF(p) + tideCD(H)); d = Math.max(0.8, d + microBottom(p, d));
    let want = STEPS.find(v => v >= d * 1.25) || 800; if (range && want < range && d * 1.25 > range * 0.55) want = range; setRange(want);
    const sx = Math.max(1, Math.round(dpr * 1.5)), x = W - sx, top = 2 * dpr, ppm = (Hp - top) / range;
    ctx.drawImage(cv, -sx, 0);
    ctx.fillStyle = '#021628'; ctx.fillRect(x, 0, sx, Hp);
    // surface clutter from waves and bubbles
    const cl = (0.5 + hsAt(p, H) * 1.3) * ppm;
    for (let y = top; y < top + cl; y += dpr * 1.5) if (Math.random() < 0.6){ ctx.fillStyle = Math.random() < 0.5 ? '#2f7fd0' : '#3fb48a'; ctx.fillRect(x, y, sx, dpr * 1.5); }
    // plankton and noise
    for (let k = 0; k < 3; k++) if (Math.random() < 0.3){ ctx.fillStyle = 'rgba(60,170,120,.55)'; ctx.fillRect(x, top + Math.random() * d * ppm, sx, dpr); }
    // fish echoes: arches from single fish, clusters from schools
    if (b.status !== 'port'){
      const dens = SP.map(sp => [sp, density(sp, p, H)]), tot = dens.reduce((a, q) => a + q[1], 0), moving = b.status === 'sailing' ? 1 : 0.55;
      if (Math.random() < Math.min(0.6, tot * 0.2 * moving * (S.equip.chirp ? 1.3 : 0.75))){
        let r = Math.random() * tot, sp = dens[0][0]; for (const [k, v] of dens){ if ((r -= v) <= 0){ sp = k; break; } }
        const n = sp === 'sei' && Math.random() < 0.5 ? 3 + Math.floor(Math.random() * 5) : 1, base = BAND[sp](d);
        for (let i = 0; i < n; i++) targets.push({d:Math.min(d - 0.4, base + (Math.random() - 0.5) * (n > 1 ? 4 : 0)), life:7 + Math.random() * 9, age:-i * 0.7, sz:(sp === 'sei' || sp === 'hyse' ? 1 : 1.5) + Math.random(), arch:0.6 + Math.random() * 1.4});
      }
    }
    for (let i = targets.length - 1; i >= 0; i--){
      const q = targets[i]; q.age++; if (q.age < 0) continue; if (q.age > q.life){ targets.splice(i, 1); continue; }
      const u = q.age / q.life * 2 - 1, st = 1 - u * u, y = top + (q.d + u * u * q.arch) * ppm, hgt = Math.max(dpr, q.sz * dpr * 1.6);
      ctx.fillStyle = st > 0.75 ? '#ff4030' : st > 0.4 ? '#ffb030' : '#d8e040'; ctx.fillRect(x, y - hgt / 2, sx, hgt);
    }
    // the jig when fishing
    if (b.status === 'fishing'){ jig += 0.35; const jd = d - 1.5 - (Math.sin(jig) * 0.5 + 0.5) * 3.5; ctx.fillStyle = '#ffe860'; ctx.fillRect(x, top + jd * ppm, sx, dpr); }
    // bottom echo: hard return on top, fading into the seabed, plus a faint double echo
    const yb = top + d * ppm, hard = 0.6 + vnoise2(p.x * 25, p.y * 25, 9) * 0.8;
    ctx.fillStyle = '#ff2e22'; ctx.fillRect(x, yb, sx, 2.2 * dpr * hard);
    ctx.fillStyle = '#ff8a24'; ctx.fillRect(x, yb + 2.2 * dpr * hard, sx, 2.5 * dpr);
    ctx.fillStyle = '#d8c236'; ctx.fillRect(x, yb + (2.2 * hard + 2.5) * dpr, sx, 2.2 * dpr);
    ctx.fillStyle = '#4a2c16'; ctx.fillRect(x, yb + (4.4 + 2.2 * hard) * dpr, sx, Hp);
    if (2 * d < range * 0.98){ ctx.fillStyle = 'rgba(200,60,40,.45)'; ctx.fillRect(x, top + 2 * d * ppm, sx, 1.5 * dpr); }
    dEl.innerHTML = fmt(d, d < 100 ? 1 : 0) + '<small>m</small>';
    tEl.textContent = fmt(seasonal(SST, H) + (vnoise2(p.x * 0.3, p.y * 0.3, 2) - 0.5) * 0.8, 1) + ' °C';
  }
  const deg3 = r => String(Math.round((((r * 180 / Math.PI) % 360) + 360) % 360) % 360).padStart(3, '0') + '°';
  function gpsLL(p){
    const {lat, lon} = LL(p), f = (v, w, hh) => { const a = Math.abs(v), dd = Math.floor(a); let m = ((a - dd) * 60).toFixed(3).padStart(6, '0'); if (S.lang === 'no') m = m.replace('.', ','); return String(dd).padStart(w, '0') + '°' + m + "'" + hh; };
    return [f(lat, 2, 'N'), f(lon, 3, S.lang === 'no' ? 'Ø' : 'E')];
  }
  function renderGPS(){
    if (!on()) return;
    const pose = livePose(), b = S.boat, H = (S.t + pose.frac) / 60, sog = b.status === 'sailing' ? b.v : 0, ll = gpsLL(pose.p);
    let wpt = 'WPT  --', xte = 'XTE  --', eta = 'ETA  --:--';
    if (S.plan && S.plan.idx < S.plan.wps.length){
      const wps = S.plan.wps.slice(S.plan.idx), w = wps[0], dw = dist(pose.p, w), brg = Math.atan2(w.x - pose.p.x, -(w.y - pose.p.y));
      let tot = 0, a = pose.p, fishH = 0; wps.forEach((q, i) => { tot += dist(a, q); a = q; if (i && q.fish > 0) fishH += q.fish; });
      const v = (sog || S.plan.speed || 10) * NM, tw = dw / v, td = tot / v + fishH;
      const dest = wps[wps.length - 1].port ? portById(wps[wps.length - 1].port).name.slice(0, 6) : 'END';
      wpt = 'WPT <b>' + (S.plan.idx + 1) + '</b> <b>' + fmt(dw / NM, 2) + '</b>nm <b>' + deg3(brg) + '</b>';
      xte = 'XTE <b>' + fmt(0, 2) + '</b>nm';
      const H0 = S.plan.depAt ? Math.max(H, S.plan.depAt / 60) : H;
      eta = 'ETA <b>' + hm(H0 + tw) + '</b> ' + dest + ' <b>' + hm(H0 + td) + '</b>';
    }
    if (document.body.classList.contains('vplot')){ $('ecHdg').textContent = deg3(pose.hd); $('ecCog').textContent = deg3(pose.hd); $('ecSog').textContent = fmt(sog, 1) + ' kn'; $('ecPos').innerHTML = ll[0] + '<br>' + ll[1]; $('ecDepL').textContent = S.lang === 'no' ? 'DYBDE' : 'DEPTH'; $('ecDep').textContent = b.status === 'port' ? '–' : fmt(depthF(pose.p) + tideCD(H), 1) + ' m';
      const th = tideH(H), up = tideH(H + 0.25) > th, nx = tideEvents(H, 14)[0], st = sunTimes(H);
      $('ecTideL').textContent = S.lang === 'no' ? 'TIDEVANN' : 'TIDE'; $('ecTide').textContent = (th >= 0 ? '+' : '') + fmt(th, 1) + ' m ' + (up ? '↑' : '↓') + (nx ? ' ' + (nx.kind === 'high' ? (S.lang === 'no' ? 'flo ' : 'HW ') : (S.lang === 'no' ? 'fjære ' : 'LW ')) + hm(nx.t) : '');
      $('ecSunL').textContent = S.lang === 'no' ? 'SOL' : 'SUN'; $('ecSun').textContent = st.always ? (S.lang === 'no' ? 'Midnattssol' : 'Midnight sun') : st.never ? (S.lang === 'no' ? 'Mørketid' : 'Polar night') : '↑' + (st.up ? hm(st.up) : '–') + ' ↓' + (st.dn ? hm(st.dn) : '–'); }
    gps.innerHTML = 'POS <b>' + ll[0] + '</b>\n    <b>' + ll[1] + '</b>\nSOG <b>' + fmt(sog, 1) + '</b>kn COG <b>' + deg3(pose.hd) + '</b>\nHDG <b>' + deg3(pose.hd) + '</b>\n' + wpt + '\n' + xte + '\n' + eta;
  }
  document.addEventListener('visibilitychange', () => { if (!document.hidden) show(); });
  return {show, renderGPS};
})();

