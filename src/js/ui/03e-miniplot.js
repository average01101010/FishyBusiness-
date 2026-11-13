// ---------- the little chart in 3D (the user's wish 02.10.2026) ----------
// Under the status box: the chart round the boat as far as the echo sounder reaches (its ring's diameter across; half a nautical
// mile either way without one), north up, with the fish the sounder sees (03c-heat.js heatDrawInto), the route and the boat. A tap
// opens the chart plotter (it replaces the GPS button and the dock's «Planlegg»). Painted once a second while the 3D view shows (as a GPS
// gives its fix), over a background kept until the boat has moved.
const MINIP = {el:$('miniPlot'), n:64, img:null, off:document.createElement('canvas'), bg:document.createElement('canvas'), bg2:document.createElement('canvas'), key:'', c:null, at:0, job:null, raf:0, ft:0, scr:{}, n2:0};   // bg2, job, scr: miniBg
// the GPS in the little chart's foot (Jonas 05.10.2026, on the phone: «kan gps-data legges inn i den lille kartplotteren for å spare
// plass?»): speed, course and position, and the next waypoint on a route; INSTR.render3d (04-panels-instruments.js) keeps them here.
// The GPS box under the chart is then only shown where the little chart is not (a phone on its side, styles.css).
let GPS3D = null;
function miniRadius(){ const tier = typeof heatTier === 'function' ? heatTier() : null; return tier ? HEAT.tiers[tier].r : 0.5 * NM; }
// the background (sea, land and coast) for twice the box round c: drawn again only when the boat has moved a fifth of the radius, the
// box or the radius has changed, or every 20 s (packs come in); painting the coast twice a second slowed a software GPU a lot.
// (05.11.2026, the lag of 04.11: a background took 70-185 ms at once on a PC, the longest stop left at sea.) Now it is painted a slice a
// frame (miniStep: chartRasterJob a row a step, then the coast and the soundings) on a canvas of its own, which takes the old one's place
// when it is done; the old one is drawn shifted after the boat till then (it is twice the box, so it covers the box till she is a
// radius off). Only the first one, one after a new box, radius or night, or one after a jump is painted at once, as before.
function miniBg(c, R, k, W, H, dpr){
  const night = chartNight(), now = performance.now(), key = [R, W, H, dpr, night].join('|'), C = MINIP.c;
  let J = MINIP.job; if (J && J.key !== key) MINIP.job = J = null;
  if (J){ if (dist(C, c) > R) miniStep(Infinity); return; }   // falling behind the boat (the old one no longer covers the box): done now
  if (key === MINIP.key && C && dist(C, c) < R / 5 && now - MINIP.at < 20000) return;
  const at = key !== MINIP.key || !C || dist(C, c) > R;   // nothing (or not enough) to show till it is done
  MINIP.at = now;
  const BW = W * 2, BH = H * 2, x0 = c.x - BW / 2 / k, y0 = c.y - BH / 2 / k;
  const dok = mapViewReady(x0, y0, x0 + BW / k, y0 + BH / k, () => { MINIP.at = 0; }, ['sim', 'chart']), sd = safeDepth();
  // the sea as the big chart paints it (03-map.js chartRaster: the depth in its colours and the depth lines; Jonas 09.10.2026: «Ser så tomt
  // ut når man ikke kan se bunnen i den»), at most 560 samples across and scaled up; before the packs have come, the coarse picture below
  if (dok){
    const PW = Math.min(BW, 560), PH = Math.max(2, Math.round(PW * BH / BW)), off = MINIP.off; if (off.width !== PW || off.height !== PH){ off.width = PW; off.height = PH; MINIP.img = null; }
    const img = MINIP.img || (MINIP.img = off.getContext('2d').createImageData(PW, PH)), V = {lv:Math.max(1, chartLevel(BH / k)), fish:false, night, sd};
    MINIP.job = {key, c:{x:c.x, y:c.y}, g:miniGen(img, PW, PH, BW, BH, x0, y0, k, dpr, night, V), t0:now};
    if (at) miniStep(Infinity); else if (!MINIP.raf) MINIP.raf = requestAnimationFrame(miniFrame);
    if (!at || MINIP.c !== C) return;   // (done; or it failed, and the coarse picture is drawn below)
  }
  MINIP.job = null; const bg = MINIP.bg; if (bg.width !== BW) bg.width = BW; if (bg.height !== BH) bg.height = BH;
  MINIP.key = key; MINIP.c = {x:c.x, y:c.y};
  const g = bg.getContext('2d'), n = MINIP.n, s2 = sd > 2.5 ? Math.min(2, sd / 2) : -1;
  const off = MINIP.off; if (off.width !== n || off.height !== n){ off.width = off.height = n; MINIP.img = off.getContext('2d').createImageData(n, n); }
  const d = MINIP.img.data, sx = BW / k / n, sy = BH / k / n;
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++){
    const q = {x:x0 + (i + 0.5) * sx, y:y0 + (j + 0.5) * sy}, o = (j * n + i) * 4; let cl;
    if (!inFrame(q)) cl = night ? [5, 9, 13] : [221, 227, 229];
    else if (dok ? isLand(q) : isLandFar(q)) cl = night ? [42, 38, 30] : [232, 215, 166];
    else { const v = dok ? depthF(q) : depthModel(q); cl = night ? (v < s2 ? [22, 52, 84] : v < sd ? [16, 38, 62] : [9, 20, 33]) : v < s2 ? [134, 180, 223] : v < sd ? [167, 203, 235] : [249, 251, 252]; }
    d[o] = cl[0]; d[o + 1] = cl[1]; d[o + 2] = cl[2]; d[o + 3] = 255;
  }
  off.getContext('2d').putImageData(MINIP.img, 0, 0);
  g.setTransform(1, 0, 0, 1, 0, 0); g.imageSmoothingEnabled = true; g.drawImage(off, 0, 0, BW, BH);
  chartCoast(g, x0, y0, 1 / k, 1 / k, BW, BH, dpr, night);
}
// one background: the raster a row at a time, then onto the spare canvas, the coast, the soundings; the spare and the shown one swap
function* miniGen(img, PW, PH, BW, BH, x0, y0, k, dpr, night, V){
  const step = chartRasterJob(img.data, PW, PH, x0, y0, BW / k / PW, BH / k / PH, V, null, MINIP.scr); while (step()) yield;
  const off = MINIP.off; off.getContext('2d').putImageData(img, 0, 0);
  const bg = MINIP.bg2; if (bg.width !== BW) bg.width = BW; if (bg.height !== BH) bg.height = BH;
  const g = bg.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.imageSmoothingEnabled = true; g.drawImage(off, 0, 0, BW, BH);
  yield;
  chartCoast(g, x0, y0, 1 / k, 1 / k, BW, BH, dpr, night);
  yield;
  miniSoundings(g, x0, y0, k, BW, BH, dpr, night);
}
// the job on its way, until the time is up; done, its canvas is the background (an error leaves the old one, tried again in 5 s)
function miniStep(until){
  const J = MINIP.job; if (!J) return;
  try { do { if (J.g.next().done){ MINIP.job = null; const b = MINIP.bg; MINIP.bg = MINIP.bg2; MINIP.bg2 = b; MINIP.key = J.key; MINIP.c = J.c; MINIP.n2++; return; } } while (performance.now() < until); }
  catch (e){ MINIP.job = null; MINIP.at = performance.now() - 15000; }
}
// a slice every frame while one is on its way: 15 % of the frame, 4-20 ms; one that has waited over 4 s (slow frames: a frame every few
// seconds in SwiftShader) up to 30 % of the frame and 60 ms, as the terrain's jobs (view3d meshSlice)
function miniFrame(t){
  MINIP.raf = 0; const J = MINIP.job, dt = MINIP.ft ? Math.min(400, t - MINIP.ft) : 16; MINIP.ft = t; if (!J){ MINIP.ft = 0; return; }
  const now = performance.now(), ms = Math.max(4, Math.min(20, 0.15 * dt)); miniStep(now + (now - J.t0 > 4000 ? Math.max(ms, Math.min(60, 0.3 * dt)) : ms));
  if (MINIP.job) MINIP.raf = requestAnimationFrame(miniFrame); else MINIP.ft = 0;
}
// the depth in whole metres at the points of a grid fixed to the map, about every 70 CSS px, as the big chart writes them (soundingsSvg)
function miniSoundings(g, x0, y0, k, BW, BH, dpr, night){
  const sp = 70 * dpr / k, i0 = Math.floor(x0 / sp), j0 = Math.floor(y0 / sp), i1 = Math.ceil((x0 + BW / k) / sp), j1 = Math.ceil((y0 + BH / k) / sp);
  if ((i1 - i0 + 1) * (j1 - j0 + 1) > 300) return;
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.font = 'italic ' + Math.round(9.5 * dpr) + 'px ' + (getComputedStyle(document.body).getPropertyValue('--sans') || 'sans-serif');
  g.textAlign = 'center'; g.lineJoin = 'round'; g.lineWidth = 2.4 * dpr; g.fillStyle = night ? '#a9cdea' : '#3b6f9c'; g.strokeStyle = night ? '#0b1a2a' : '#f9fbfc';
  for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++){
    const hsh = Math.sin(i * 127.1 + j * 311.7) * 43758.5453, fr = hsh - Math.floor(hsh), p = {x:(i + 0.5 + (j & 1 ? 0.25 : -0.25) + (fr - 0.5) * 0.3) * sp, y:(j + 0.5) * sp};
    let d; try { if (isLand(p) || coastDistFar(p) < 0.08) continue; d = depthF(p); } catch (e){ continue; }
    if (!(d >= 2)) continue;
    const t = d < 10 ? d.toFixed(1).replace('.', ',') : String(Math.round(d)), X = (p.x - x0) * k, Y = (p.y - y0) * k + 3 * dpr;
    g.strokeText(t, X, Y); g.fillText(t, X, Y);
  }
  g.restore();
}
function miniPaint(){
  const el = MINIP.el; if (!el || !window.chartReady || !document.body.classList.contains('v3d') || !el.clientWidth || !MAPD.core || !MAPD.core.buf) return;
  const dpr = Math.min(2, window.devicePixelRatio || 1), W = Math.round(el.clientWidth * dpr), H = Math.round(el.clientHeight * dpr);
  if (el.width !== W) el.width = W; if (el.height !== H) el.height = H;
  const ctx = el.getContext('2d'), pose = livePose(), p = pose.p, R = miniRadius(), k = Math.min(W, H) / (2 * R), x0 = p.x - W / 2 / k, y0 = p.y - H / 2 / k;
  miniBg(p, R, k, W, H, dpr);
  const C = MINIP.c; ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(MINIP.bg, Math.round((C.x - p.x) * k - W / 2), Math.round((C.y - p.y) * k - H / 2));
  if (typeof heatDrawInto === 'function') heatDrawInto(ctx, p, W / 2, H / 2, k, true);
  // the route still to sail, and the boat
  const X = x => (x - x0) * k, Y = y => (y - y0) * k;
  if (S.plan && S.plan.idx < S.plan.wps.length){
    ctx.strokeStyle = 'rgba(208,40,120,.9)'; ctx.lineWidth = 2 * dpr; ctx.setLineDash([6 * dpr, 4 * dpr]); ctx.beginPath(); ctx.moveTo(X(p.x), Y(p.y));
    for (const w of S.plan.wps.slice(Math.max(S.plan.idx, pose.idx || 0))) ctx.lineTo(X(w.x), Y(w.y)); ctx.stroke(); ctx.setLineDash([]);
  }
  miniSjv(ctx, X, Y, p, dpr);   // the rules of the road (Ø11.1)
  const s = 7 * dpr; ctx.save(); ctx.translate(W / 2, H / 2); ctx.rotate(pose.hd);
  ctx.beginPath(); ctx.moveTo(0, -s * 1.3); ctx.lineTo(s * 0.7, s); ctx.lineTo(0, s * 0.55); ctx.lineTo(-s * 0.7, s); ctx.closePath();
  ctx.fillStyle = '#d02878'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5 * dpr; ctx.fill(); ctx.stroke(); ctx.restore();
  // north
  ctx.fillStyle = chartNight() ? 'rgba(200,215,225,.85)' : 'rgba(20,40,55,.8)'; ctx.font = '600 ' + Math.round(10 * dpr) + 'px sans-serif'; ctx.textAlign = 'right'; ctx.fillText('N ↑', W - 6 * dpr, 13 * dpr);
  // what the fish colours mean (UI-redesign U4): the big chart's legend, small, under «N ↑», while the sounder paints fish here
  if (typeof heatTier === 'function' && heatTier() && typeof HEAT_STEPS !== 'undefined'){
    const n = HEAT_STEPS.length + 1, sw = Math.round(9 * dpr), sh = Math.round(6 * dpr), bx = W - 6 * dpr - n * sw, by = 18 * dpr;
    ctx.fillStyle = 'rgba(6,16,24,.55)'; ctx.fillRect(bx - 2 * dpr, by - 2 * dpr, n * sw + 4 * dpr, sh + 4 * dpr + 11 * dpr);
    for (let i = 0; i < n; i++){ const j = i ? heatIndex(HEAT_STEPS[i - 1], true) * 4 : -1; ctx.fillStyle = j < 0 ? '#ffffff' : 'rgb(' + HEATPAL[j] + ',' + HEATPAL[j + 1] + ',' + HEATPAL[j + 2] + ')'; ctx.fillRect(bx + i * sw, by, sw, sh); }
    ctx.fillStyle = '#eef4f7'; ctx.font = '600 ' + Math.round(8.5 * dpr) + 'px sans-serif'; ctx.textAlign = 'left'; ctx.fillText(S.lang === 'en' ? 'little' : 'lite', bx, by + sh + 9 * dpr);
    ctx.textAlign = 'right'; ctx.fillText(S.lang === 'en' ? 'much' : 'mye', bx + n * sw, by + sh + 9 * dpr);
  }
  // the GPS along the foot: speed and course with how far across, the position (on two lines when it is too wide), the next waypoint
  const G = GPS3D, fs = Math.round(10.5 * dpr), lh = Math.round(12.5 * dpr), pad = 5 * dpr, L = [];
  ctx.font = '600 ' + fs + 'px sans-serif';
  if (G){
    L.push([G.kn + '  ' + G.crs, fmt(2 * R / NM, 1) + ' nm']);
    const pos = G.ll[0] + ' ' + G.ll[1]; if (ctx.measureText(pos).width <= W - 2 * pad) L.push([pos]); else L.push([G.ll[0]], [G.ll[1]]);
    if (G.ukc != null) L.push([(S.lang === 'en' ? 'Under the keel ' : 'Under kjølen ') + fmt(G.ukc, 1) + ' m', '', G.ukc < 1]);   // (shallow water, Ø9 F5: the depth with the tide less her draught and squat)
    if (G.nv){ const a = 'WPT ' + G.nv.n + ' ' + G.nv.wpt, b = 'ETA ' + G.nv.eta; if (ctx.measureText(a + '  ' + b).width <= W - 2 * pad) L.push([a, b]); else L.push([a], [b]); }
    if (G.lop) L.push([(S.lang === 'en' ? 'Race ' : 'Kappløp ') + G.lop.t, G.lop.leg]);   // (the race clock while a leg is sailed, KL2)
  } else L.push(['', fmt(2 * R / NM, 1) + ' nm']);
  const h = L.length * lh + pad; ctx.fillStyle = 'rgba(6,16,24,.66)'; ctx.fillRect(0, H - h, W, h);
  ctx.fillStyle = '#eef4f7';
  L.forEach((r, i) => { const y = H - h + pad * 0.6 + (i + 0.78) * lh; ctx.textAlign = 'left'; if (r[2]) ctx.fillStyle = '#ff8a80'; ctx.fillText(r[0], pad, y); ctx.fillStyle = '#eef4f7'; if (r[1]){ ctx.textAlign = 'right'; ctx.fillStyle = 'rgba(230,240,245,.7)'; ctx.fillText(r[1], W - pad, y); ctx.fillStyle = '#eef4f7'; } });
}
// the warning of the rules of the road (Ø11.1, core/05e-sjovei.js), as the big chart has it (03-map.js sjvChartSvg): a ring round the other
// vessel, her vector and yours on to the CPA and the line between them there, red when you give way and yellow when you hold on; the ring
// stays on the edge when she is outside the little chart, and the CPA stands under it
function miniSjv(ctx, X, Y, p, dpr){
  const w = typeof sjvWarn === 'function' ? sjvWarn() : null; if (!w || !w.p) return;
  const A = sjvOwn(), m = clamp(w.tcpa, 0, SJV.TW) / 60, gs = gridScale(w.p), c = w.sev === 'r2' ? '#e5383b' : '#f0a202', W = ctx.canvas.width, H = ctx.canvas.height;
  const fwd = (q, cg, v) => ({x:q.x + Math.sin(cg) * v * NM * gs * m, y:q.y - Math.cos(cg) * v * NM * gs * m}), ta = fwd(p, A.cog, A.v), tb = fwd(w.p, w.cog, w.v);
  const line = (a, b, lw, dash) => { ctx.setLineDash(dash || []); ctx.lineWidth = lw * dpr; ctx.beginPath(); ctx.moveTo(X(a.x), Y(a.y)); ctx.lineTo(X(b.x), Y(b.y)); ctx.stroke(); };
  ctx.save(); ctx.strokeStyle = c; ctx.lineCap = 'round';
  line(p, ta, 1.6, [5 * dpr, 3 * dpr]); line(w.p, tb, 2.4); line(ta, tb, 1.1, [2 * dpr, 2 * dpr]); ctx.setLineDash([]);
  // (above the GPS along the foot, which is painted after: up to four lines)
  const r = 9 * dpr, cx = clamp(X(w.p.x), r + 2, W - r - 2), cy = clamp(Y(w.p.y), r + 2, H - 58 * dpr - r);
  ctx.lineWidth = 2.4 * dpr; ctx.beginPath(); ctx.arc(cx, cy, r, 0, 2 * Math.PI); ctx.stroke();
  ctx.font = '700 ' + Math.round(9.5 * dpr) + 'px sans-serif'; ctx.textAlign = cx > W / 2 ? 'right' : 'left'; ctx.lineJoin = 'round';
  const tx = cx + (cx > W / 2 ? -r - 3 * dpr : r + 3 * dpr), ty = cy > H - 70 * dpr ? cy - r - 3 * dpr : cy + 4 * dpr, label = 'CPA ' + w.cpa + ' m';
  ctx.lineWidth = 3 * dpr; ctx.strokeStyle = 'rgba(6,16,24,.75)'; ctx.strokeText(label, tx, ty); ctx.fillStyle = c; ctx.fillText(label, tx, ty);
  ctx.restore();
}
// four times a second while she moves, so her position on it keeps up (once a second when she lies still)
if (MINIP.el){ MINIP.el.addEventListener('click', () => openPlotter()); let last = 0;
  setInterval(() => { if (document.hidden || !S || !window.chartReady) return; const now = performance.now(), st = S.boat.status; if ((now - last < 950 && !(st === 'sailing' || st === 'tow' || helmOn()))) return; last = now; miniPaint(); }, 250); }
