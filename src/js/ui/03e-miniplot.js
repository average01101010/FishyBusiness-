// ---------- the little chart in 3D (the user's wish 02.10.2026) ----------
// Under the status box: the chart round the boat as far as the echo sounder reaches (its ring's diameter across; half a nautical
// mile either way without one), north up, with the fish the sounder sees (03c-heat.js heatDrawInto), the route and the boat. A tap
// opens the chart plotter (it replaces the GPS button and the dock's «Planlegg»). Painted once a second while the 3D view shows (as a GPS
// gives its fix), over a background kept until the boat has moved.
const MINIP = {el:$('miniPlot'), n:64, img:null, off:document.createElement('canvas'), bg:document.createElement('canvas'), key:'', c:null, at:0};
// the GPS in the little chart's foot (Jonas 05.10.2026, on the phone: «kan gps-data legges inn i den lille kartplotteren for å spare
// plass?»): speed, course and position, and the next waypoint on a route; INSTR.render3d (04-panels-instruments.js) keeps them here.
// The GPS box under the chart is then only shown where the little chart is not (a phone on its side, styles.css).
let GPS3D = null;
function miniRadius(){ const tier = typeof heatTier === 'function' ? heatTier() : null; return tier ? HEAT.tiers[tier].r : 0.5 * NM; }
// the background (sea, land and coast) for twice the box round c: drawn again only when the boat has moved a fifth of the radius, the
// box or the radius has changed, or every 20 s (packs come in); painting the coast twice a second slowed a software GPU a lot
function miniBg(c, R, k, W, H, dpr){
  const night = chartNight(), now = performance.now(), key = [R, W, H, dpr, night].join('|'), C = MINIP.c;
  if (key === MINIP.key && C && dist(C, c) < R / 5 && now - MINIP.at < 20000) return;
  MINIP.key = key; MINIP.c = {x:c.x, y:c.y}; MINIP.at = now;
  const BW = W * 2, BH = H * 2, bg = MINIP.bg; if (bg.width !== BW) bg.width = BW; if (bg.height !== BH) bg.height = BH;
  const g = bg.getContext('2d'), x0 = c.x - BW / 2 / k, y0 = c.y - BH / 2 / k;
  const dok = mapViewReady(x0, y0, x0 + BW / k, y0 + BH / k, () => { MINIP.at = 0; }, ['sim', 'chart']), n = MINIP.n, sd = safeDepth(), s2 = sd > 2.5 ? Math.min(2, sd / 2) : -1;
  const off = MINIP.off; if (off.width !== n){ off.width = off.height = n; MINIP.img = off.getContext('2d').createImageData(n, n); }
  const d = MINIP.img.data, sx = BW / k / n, sy = BH / k / n;
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++){
    const q = {x:x0 + (i + 0.5) * sx, y:y0 + (j + 0.5) * sy}, o = (j * n + i) * 4; let cl;
    if (q.x < MAPB.x0 || q.y < MAPB.y0 || q.x >= MAPB.x1 || q.y >= MAPB.y1) cl = night ? [5, 9, 13] : [221, 227, 229];
    else if (dok ? isLand(q) : isLandFar(q)) cl = night ? [42, 38, 30] : [232, 215, 166];
    else { const v = dok ? depthF(q) : depthModel(q); cl = night ? (v < s2 ? [22, 52, 84] : v < sd ? [16, 38, 62] : [9, 20, 33]) : v < s2 ? [134, 180, 223] : v < sd ? [167, 203, 235] : [249, 251, 252]; }
    d[o] = cl[0]; d[o + 1] = cl[1]; d[o + 2] = cl[2]; d[o + 3] = 255;
  }
  off.getContext('2d').putImageData(MINIP.img, 0, 0);
  g.setTransform(1, 0, 0, 1, 0, 0); g.imageSmoothingEnabled = true; g.drawImage(off, 0, 0, BW, BH);
  chartCoast(g, x0, y0, 1 / k, 1 / k, BW, BH, dpr, night);
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
    for (const w of S.plan.wps.slice(S.plan.idx)) ctx.lineTo(X(w.x), Y(w.y)); ctx.stroke(); ctx.setLineDash([]);
  }
  const s = 7 * dpr; ctx.save(); ctx.translate(W / 2, H / 2); ctx.rotate(pose.hd);
  ctx.beginPath(); ctx.moveTo(0, -s * 1.3); ctx.lineTo(s * 0.7, s); ctx.lineTo(0, s * 0.55); ctx.lineTo(-s * 0.7, s); ctx.closePath();
  ctx.fillStyle = '#d02878'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5 * dpr; ctx.fill(); ctx.stroke(); ctx.restore();
  // north
  ctx.fillStyle = chartNight() ? 'rgba(200,215,225,.85)' : 'rgba(20,40,55,.8)'; ctx.font = '600 ' + Math.round(10 * dpr) + 'px sans-serif'; ctx.textAlign = 'right'; ctx.fillText('N ↑', W - 6 * dpr, 13 * dpr);
  // the GPS along the foot: speed and course with how far across, the position (on two lines when it is too wide), the next waypoint
  const G = GPS3D, fs = Math.round(10.5 * dpr), lh = Math.round(12.5 * dpr), pad = 5 * dpr, L = [];
  ctx.font = '600 ' + fs + 'px sans-serif';
  if (G){
    L.push([G.kn + '  ' + G.crs, fmt(2 * R / NM, 1) + ' nm']);
    const pos = G.ll[0] + ' ' + G.ll[1]; if (ctx.measureText(pos).width <= W - 2 * pad) L.push([pos]); else L.push([G.ll[0]], [G.ll[1]]);
    if (G.nv){ const a = 'WPT ' + G.nv.n + ' ' + G.nv.wpt, b = 'ETA ' + G.nv.eta; if (ctx.measureText(a + '  ' + b).width <= W - 2 * pad) L.push([a, b]); else L.push([a], [b]); }
  } else L.push(['', fmt(2 * R / NM, 1) + ' nm']);
  const h = L.length * lh + pad; ctx.fillStyle = 'rgba(6,16,24,.66)'; ctx.fillRect(0, H - h, W, h);
  ctx.fillStyle = '#eef4f7';
  L.forEach((r, i) => { const y = H - h + pad * 0.6 + (i + 0.78) * lh; ctx.textAlign = 'left'; ctx.fillText(r[0], pad, y); if (r[1]){ ctx.textAlign = 'right'; ctx.fillStyle = 'rgba(230,240,245,.7)'; ctx.fillText(r[1], W - pad, y); ctx.fillStyle = '#eef4f7'; } });
}
if (MINIP.el){ MINIP.el.addEventListener('click', () => openPlotter()); setInterval(() => { if (!document.hidden) miniPaint(); }, 1000); }
