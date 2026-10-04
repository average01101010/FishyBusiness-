// ---------- map ----------
function followChart(){
  if (!chartCv.dataset.v) return; const [cx0, cy0, z0, w0, h0] = chartCv.dataset.v.split(',').map(Number), r = svg.getBoundingClientRect(); if (!r.width) return;
  const hh0 = MAP_H / z0, ww0 = hh0 * (w0 / h0), hh1 = MAP_H / view.z, ww1 = hh1 * (r.width / r.height), p1 = r.width / ww1, sc = p1 / (w0 / ww0);
  const tx = ((cx0 - ww0 / 2) - (view.cx - ww1 / 2)) * p1, ty = ((cy0 - hh0 / 2) - (view.cy - hh1 / 2)) * p1;
  chartCv.style.transformOrigin = '0 0'; chartCv.style.transform = 'translate(' + tx.toFixed(1) + 'px,' + ty.toFixed(1) + 'px) scale(' + sc.toFixed(4) + ')';
}
// the gear being drawn out on the chart before it is set (ui/03d-setmode.js), or null
let SETM = null;
let heatT = 0;
function applyView(){
  const r = svg.getBoundingClientRect(); if (!r.width || !r.height) return;
  const h = MAP_H / view.z, w = h * (r.width / r.height);
  view.cx = clamp(view.cx, MAPB.x0, MAPB.x1); view.cy = clamp(view.cy, MAPB.y0, MAPB.y1);
  svg.setAttribute('viewBox', (view.cx - w / 2) + ' ' + (view.cy - h / 2) + ' ' + w + ' ' + h);
  if (window.chartReady && document.body.classList.contains('vplot')){ if (!chartPan()) followChart(); clearTimeout(chartTimer); chartTimer = setTimeout(() => paintChart(1), 160); }
  view.px = r.height / h;
  // ui/03c-heat.js, loaded after this file: at most every 100 ms while the view moves (it was drawn with a blur at every move)
  if (window.heatReady && !heatT) heatT = setTimeout(() => { heatT = 0; heatPaint(); }, 100);
}
function toMap(cx, cy){ const pt = svg.createSVGPoint(); pt.x = cx; pt.y = cy; const q = pt.matrixTransform(svg.getScreenCTM().inverse()); return {x:q.x, y:q.y}; }
const ptsStr = poly => poly.map(p => p.x.toFixed(3) + ',' + p.y.toFixed(3)).join(' ');
function txt(p, s, cls, size, extra = ''){ return '<text x="' + p.x.toFixed(3) + '" y="' + p.y.toFixed(3) + '" class="' + cls + '" font-size="' + size.toFixed(3) + '" ' + extra + '>' + s + '</text>'; }

let CONT_D = null;
// the chart's zoom: from the whole country (the frame is 1 720 km tall) to a harbour (half a kilometre)
const ZMIN = MAP_H / 1800, ZMAX = 160;
const PLOT_STOPS = [[0,[230,60,40]],[5,[245,140,40]],[15,[250,215,60]],[30,[120,210,80]],[60,[60,200,190]],[120,[40,140,230]],[250,[30,70,200]],[500,[60,30,150]],[1000,[30,10,70]]];
function plotCol(d){ for (let i = 1; i < PLOT_STOPS.length; i++){ const [b, cb] = PLOT_STOPS[i]; if (d < b){ const [a, ca] = PLOT_STOPS[i - 1], u = (d - a) / (b - a); return [ca[0] + (cb[0] - ca[0]) * u, ca[1] + (cb[1] - ca[1]) * u, ca[2] + (cb[2] - ca[2]) * u]; } } return PLOT_STOPS[PLOT_STOPS.length - 1][1]; }
function cssRGB(name){ const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim().replace('#', ''); return [parseInt(v.slice(0, 2), 16), parseInt(v.slice(2, 4), 16), parseInt(v.slice(4, 6), 16)]; }
// ---------- chart painted at screen resolution for the current view (crisp at any zoom, like a real chart plotter) ----------
const chartCv = document.createElement('canvas'); chartCv.id = 'chartcv'; svg.parentNode.insertBefore(chartCv, svg);
let chartTimer = 0; window.chartReady = true;
// The chart is painted in tiles of 256 x 256 raster pixels fixed to the map at the zoom (03.10.2026: the whole view was painted pixel
// by pixel at every move, seconds on the tablet, and it stayed dark until the packs had come). A tile is painted coarse at once (a
// quarter of the resolution, scaled up) and fine a few at a time between frames, the middle first; the tiles kept from before are
// drawn again as they are when the chart moves, also while it is dragged. What the packs do not cover yet is painted from the national
// core and painted again when they come. The raster is at most 1.5 pixels a CSS pixel (it is smooth; the coast over it is drawn at the
// screen's own resolution). The coast, the graticule and the fjord line are drawn over the tiles once per view (CT.vec).
const CT = {key:'', tiles:new Map(), job:[], raf:0, vec:null, vsh:[0, 0], v:null, want:new Set(), came:0, TS:256, whole:null};
function chartView(scale){
  const r = svg.getBoundingClientRect(), mr = svg.parentNode.getBoundingClientRect(); if (!r.width || !r.height) return null;
  const dpr = Math.min(2, window.devicePixelRatio || 1) * scale, W = Math.max(2, Math.round(r.width * dpr)), H = Math.max(2, Math.round(r.height * dpr));
  const hh = MAP_H / view.z, ww = hh * (r.width / r.height), x0 = view.cx - ww / 2, y0 = view.cy - hh / 2, k = hh / H, rd = Math.min(dpr, 1.5 * scale);
  return {r, mr, dpr, W, H, hh, ww, x0, y0, k, kr:k * dpr / rd, kx:ww / W, ky:k, lv:chartLevel(hh), fish:chartMode() === 'fish', sd:safeDepth()};
}
function paintChart(scale){
  if (!DEPTH || !document.body.classList.contains('vplot')) return;
  const V = chartView(scale); if (!V) return;
  const {r, mr, W, H, hh, ww, x0, y0, lv} = V;
  chartCv.style.left = (r.left - mr.left) + 'px'; chartCv.style.top = (r.top - mr.top) + 'px'; chartCv.style.width = r.width + 'px'; chartCv.style.height = r.height + 'px';
  if (chartCv.width !== W) chartCv.width = W; if (chartCv.height !== H) chartCv.height = H;
  CT.v = V;
  // the packs under the view and half a view round it are asked for, each once; the chart is painted again when they come
  if (lv) chartWant(x0 - ww / 2, y0 - hh / 2, x0 + ww * 1.5, y0 + hh * 1.5);
  if (!lv) chartWhole(V);
  else { const key = [V.kr.toPrecision(10), lv, V.fish, V.sd].join('|'); if (key !== CT.key){ CT.key = key; CT.tiles.clear(); CT.job = []; } }
  chartVectors(V);
  chartCompose(V, lv > 0, 40);
}
// dragged at the same zoom: the tiles kept are drawn where they now are, and the coast of the last paint shifted, until it is painted
function chartPan(){
  const V0 = CT.v; if (!V0 || !V0.lv || !document.body.classList.contains('vplot')) return false;
  const V = chartView(1); if (!V || V.k !== V0.k || V.W !== V0.W || V.H !== V0.H || V.lv !== V0.lv || V.fish !== V0.fish) return false;
  CT.vsh = [CT.vsh[0] + (V0.x0 - V.x0) / V.k, CT.vsh[1] + (V0.y0 - V.y0) / V.k]; CT.v = V; chartCompose(V, true, 6); return true;
}
// the whole country (level 0): coarse from the core, at most CHARTV.px samples, scaled up (no tiles: the view is quick)
function chartWhole(V){
  const {W, H, x0, y0, kx, ky} = V, f = Math.min(1, Math.sqrt(CHARTV.px / (W * H))), PW = Math.max(2, Math.round(W * f)), PH = Math.max(2, Math.round(H * f));
  const img = new ImageData(PW, PH); chartRaster(img.data, PW, PH, x0, y0, W * kx / PW, H * ky / PH, V, null);
  const oc = CT.whole || (CT.whole = document.createElement('canvas')); oc.width = PW; oc.height = PH; oc.getContext('2d').putImageData(img, 0, 0);
}
// the tiles over the view: those kept are drawn, those missing painted coarse now (within budget ms) and the rest queued, coarse first
function chartCompose(V, tiles, budget){
  const ctx = chartCv.getContext('2d'), {W, H, x0, y0, k, kr} = V;
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.imageSmoothingEnabled = true;
  if (!tiles) ctx.drawImage(CT.whole, 0, 0, W, H);
  else {
    ctx.fillStyle = V.fish ? '#05090d' : '#dde3e5'; ctx.fillRect(0, 0, W, H);
    const TS = CT.TS, tw = TS * kr, i0 = Math.floor(x0 / tw), j0 = Math.floor(y0 / tw), i1 = Math.floor((x0 + W * k) / tw), j1 = Math.floor((y0 + H * k) / tw);
    const until = performance.now() + (budget || 0), cx = (i0 + i1) / 2, cy = (j0 + j1) / 2, need = [], X = i => Math.round((i * tw - x0) / k), Y = j => Math.round((j * tw - y0) / k);
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++){
      const tk = i + ',' + j; let t = CT.tiles.get(tk);
      if (!t && performance.now() < until){ t = chartTile(V, i, j, 4); CT.tiles.set(tk, t); }
      const dd = Math.hypot(i - cx, j - cy);
      if (!t){ need.push([dd - 1e3, i, j]); continue; }
      if (t.q > 1) need.push([dd, i, j]);   // (a tile painted before its packs came is painted again when they come: chartCame)
      ctx.drawImage(t.cv, X(i), Y(j), X(i + 1) - X(i), Y(j + 1) - Y(j));
      CT.tiles.delete(tk); CT.tiles.set(tk, t);   // the least recently used goes first
    }
    const keep = Math.max(120, (i1 - i0 + 1) * (j1 - j0 + 1) * 2.5); while (CT.tiles.size > keep) CT.tiles.delete(CT.tiles.keys().next().value);
    need.sort((a, b) => a[0] - b[0]); CT.job = need.map(n => [n[1], n[2]]);
    if (CT.job.length && !CT.raf) CT.raf = requestAnimationFrame(chartWork);
  }
  if (CT.vec) ctx.drawImage(CT.vec, Math.round(CT.vsh[0]), Math.round(CT.vsh[1]));
  chartCv.style.transform = ''; chartCv.dataset.v = [view.cx, view.cy, view.z, V.r.width, V.r.height].join(',');
}
// the queued tiles, about 8 ms a frame (a missing one coarse, a coarse one fine); then the view is composed again
function chartWork(){
  CT.raf = 0; const V = CT.v; if (!V || !V.lv || !CT.job.length || !document.body.classList.contains('vplot')) return;
  const until = performance.now() + 8; let did = 0;
  while (CT.job.length && (performance.now() < until || !did)){
    const [i, j] = CT.job.shift(), tk = i + ',' + j, t = CT.tiles.get(tk); if (t && t.q === 1) continue;
    CT.tiles.set(tk, chartTile(V, i, j, t ? 1 : 4)); did++;
  }
  if (did) chartCompose(V, true, 0);
  if (CT.job.length && !CT.raf) CT.raf = requestAnimationFrame(chartWork);
}
// for the tests: every tile of the view fine at once
function chartFlush(){
  const V = CT.v; if (!V || !V.lv) return; let n = 0;
  while (CT.job.length && n++ < 1e4){ const [i, j] = CT.job.shift(); CT.tiles.set(i + ',' + j, chartTile(V, i, j, 1)); if (!CT.job.length) chartCompose(V, true, 0); }
  chartCompose(V, true, 0);
}
// one tile: its raster at 1/q of the resolution (q = 4 coarse, 1 fine) on its own canvas; prov when some of its packs had not come
function chartTile(V, i, j, q){
  const TS = CT.TS, n = TS / q, k = V.kr * q, img = new ImageData(n, n), st = {prov:false};
  chartRaster(img.data, n, n, i * TS * V.kr, j * TS * V.kr, k, k, V, st);
  const cv = document.createElement('canvas'); cv.width = cv.height = n; cv.getContext('2d').putImageData(img, 0, 0);
  return {cv, q, prov:st.prov};
}
// the packs a view needs, each asked for once; when they come the tiles painted without them go, and the chart is painted again
function chartWant(x0, y0, x1, y1){
  for (const kind of ['sim', 'chart']) for (const pk of mapPacksIn(kind, x0, y0, x1, y1)){
    if (pk.buf || CT.want.has(pk)) continue; CT.want.add(pk);
    mapLoad(pk).then(() => { CT.want.delete(pk); chartCame(); }, e => { CT.want.delete(pk); console.error(e); });
  }
}
function chartCame(){
  clearTimeout(CT.came);
  CT.came = setTimeout(() => { for (const [tk, t] of CT.tiles) if (t.prov) CT.tiles.delete(tk); if (document.body.classList.contains('vplot')){ paintChart(1); scheduleStatic(); } }, 120);
}
// the coast, the graticule and the fjord line for the view, on their own canvas
function chartVectors(V){
  const {W, H, x0, y0, kx, ky, dpr, fish} = V;
  const cv = CT.vec || (CT.vec = document.createElement('canvas')); if (cv.width !== W) cv.width = W; if (cv.height !== H) cv.height = H; CT.vsh = [0, 0];
  const ctx = cv.getContext('2d'); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, W, H);
  chartCoast(ctx, x0, y0, kx, ky, W, H, dpr, fish);
  chartGrid(ctx, x0, y0, kx, ky, W, H, dpr, fish);
  // fjord line for coastal cod: dashed violet, as regulation lines are drawn on official charts
  ctx.save(); ctx.strokeStyle = 'rgba(150,40,170,0.85)'; ctx.lineWidth = 1.6 * dpr; ctx.setLineDash([7 * dpr, 5 * dpr]); ctx.beginPath();
  FJORD.forEach((q, i) => { const X = (q.x - x0) / kx, Y = (q.y - y0) / ky; i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); }); ctx.stroke(); ctx.setLineDash([]);
  if (view.z > 1.6){ const a = FJORD[2], b2 = FJORD[3], X = ((a.x + b2.x) / 2 - x0) / kx, Y = ((a.y + b2.y) / 2 - y0) / ky; ctx.font = 'italic ' + Math.round(11 * dpr) + 'px sans-serif'; ctx.fillStyle = 'rgba(130,30,150,0.9)'; ctx.fillText(S.lang === 'no' ? 'Fjordlinje' : 'Fjord line', X + 6 * dpr, Y); }
  ctx.restore();
}
// The raster under the coast: PW x PH samples from (x0, y0) km, pkx/pky km apart, into d (RGBA). Off the tiles with detail (or before
// their pack has come: st.prov) the national core's land and the depth model; on them the depth (a B-spline where a sample is finer
// than its 50 m cells) and the land mask (25 m): at level 2 as foreshore where the coast leaves it out (what the route check takes as
// land), read between the cells so its edge is a smooth line a pixel wide rather than 25 m steps; at level 1 as land under the coast.
function chartRaster(d, PW, PH, x0, y0, pkx, pky, V, st){
  const {lv, fish, sd} = V, LD = MAPD.L.depth, c = LD.c, X0 = LD.ix0, Y0 = LD.iy0, X1 = LD.ix0 + LD.nx - 1, Y1 = LD.iy0 + LD.ny - 1, D = (ix, iy) => rcell(LD, ix, iy);
  const s2 = sd > 2.5 ? Math.min(2, sd / 2) : -1;
  const OFF = fish ? [5, 9, 13] : [221, 227, 229], WHITE = [249, 251, 252], U1 = [167, 203, 235], U2 = [134, 180, 223], SC = [59, 106, 165], FS = fish ? [46, 54, 40] : [204, 214, 172], LAND = fish ? [38, 43, 35] : [232, 215, 166];
  const prev = new Float32Array(PW).fill(NaN), sh = 1 / (Math.max(pkx, 0.0005) * 10), smooth = lv > 0 && pkx < LD.c;
  const LM = MAPD.L.mask, lc = LM.c, pocket = lv === 2 ? pocketsIn(x0, y0, x0 + PW * pkx, y0 + PH * pky) : null, T = MAPD.man.tile, aa = Math.max(0.04, 0.5 * pkx / lc);
  let ltx = NaN, lty = NaN, lsim = false;
  const simAt = (x, y) => { const tx = Math.floor(x / T), ty = Math.floor(y / T); if (tx !== ltx || ty !== lty){ ltx = tx; lty = ty; const pk = lv > 0 ? MAPD.byTile.get('sim:' + tx + ':' + ty) : null; lsim = !!(pk && pk.buf); if (pk && !pk.buf && st) st.prov = true; } return lsim; };
  const bw = (t, o) => { const t2 = t * t, t3 = t2 * t; o[0] = (1 - t) * (1 - t) * (1 - t) / 6; o[1] = (3 * t3 - 6 * t2 + 4) / 6; o[2] = (-3 * t3 + 3 * t2 + 3 * t + 1) / 6; o[3] = t3 / 6; };
  const CX = new Int32Array(PW * 4), CW = new Float32Array(PW * 4), tmp = [0, 0, 0, 0];
  if (smooth) for (let i = 0; i < PW; i++){ const x = x0 + (i + 0.5) * pkx, gx = x / c - 0.5, ix = Math.floor(gx); bw(gx - ix, tmp); for (let k = 0; k < 4; k++){ CX[i * 4 + k] = clamp(ix - 1 + k, X0, X1); CW[i * 4 + k] = tmp[k]; } }
  const RW = [0, 0, 0, 0], RO = [0, 0, 0, 0], col = [0, 0, 0], put = (o, k) => { d[o] = k[0]; d[o + 1] = k[1]; d[o + 2] = k[2]; d[o + 3] = 255; };
  // near in (a sample under an eighth of a cell) the B-spline every GS samples and between them bilinear: the depth is smooth there,
  // and the 16 cells a sample made the harbour's tiles slow; NaN where a corner is off the packs (the sample is then its own)
  const GS = 4, G = smooth && pkx < c / 8 ? new Float32Array((Math.ceil(PW / GS) + 1) * (Math.ceil(PH / GS) + 1)) : null, GW = Math.ceil(PW / GS) + 1;
  if (G){ const w = [0, 0, 0, 0], u = [0, 0, 0, 0];
    for (let gj = 0; gj * GS < PH + GS; gj++) for (let gi = 0; gi < GW; gi++){
      const x = x0 + (gi * GS + 0.5) * pkx, y = y0 + (gj * GS + 0.5) * pky; let v = NaN;
      if (simAt(x, y) && x >= X0 * c && y >= Y0 * c && x < (X1 + 1) * c && y < (Y1 + 1) * c) try {
        const gx = x / c - 0.5, ix = Math.floor(gx), gy = y / c - 0.5, iy = Math.floor(gy); bw(gx - ix, w); bw(gy - iy, u); v = 0;
        for (let a = 0; a < 4; a++){ const ro = clamp(iy - 1 + a, Y0, Y1); let r = 0; for (let b = 0; b < 4; b++) r += w[b] * D(clamp(ix - 1 + b, X0, X1), ro); v += u[a] * r; }
      } catch (e){ v = NaN; }
      G[gj * GW + gi] = v;
    }
    ltx = NaN; }
  for (let j = 0; j < PH; j++){
    const y = y0 + (j + 0.5) * pky, gy = clamp(y / c - 0.5, Y0, Y1 - 0.001), iy = Math.floor(gy), fy = gy - iy;
    if (smooth){ const gyr = y / c - 0.5, iyr = Math.floor(gyr); bw(gyr - iyr, RW); for (let k = 0; k < 4; k++) RO[k] = clamp(iyr - 1 + k, Y0, Y1); }
    let left = NaN;
    for (let i = 0; i < PW; i++){
      const x = x0 + (i + 0.5) * pkx, o = (j * PW + i) * 4;
      if (x < MAPB.x0 || y < MAPB.y0 || x >= MAPB.x1 || y >= MAPB.y1){ put(o, OFF); prev[i] = NaN; left = NaN; continue; }
      const gx = clamp(x / c - 0.5, X0, X1 - 0.001), ix = Math.floor(gx), fx = gx - ix;
      let v, land = 0;
      if (!simAt(x, y) || !(x >= X0 * c && y >= Y0 * c && x < (X1 + 1) * c && y < (Y1 + 1) * c)){
        const q = {x, y}; if (lv && isLandFar(q)){ put(o, [224, 206, 150]); prev[i] = NaN; left = NaN; continue; }
        v = lv ? depthModel(q) : 15 + 220 * Math.pow(exposure(q), 1.6); }
      else try {
        if (lv === 2){ const gxm = x / lc - 0.5, gym = y / lc - 0.5, mx = Math.floor(gxm), my = Math.floor(gym), ax = gxm - mx, ay = gym - my;
          const m = (rcell(LM, mx, my) * (1 - ax) + rcell(LM, mx + 1, my) * ax) * (1 - ay) + (rcell(LM, mx, my + 1) * (1 - ax) + rcell(LM, mx + 1, my + 1) * ax) * ay;
          land = m > 0.5 - aa && !(pocket && pocket(x, y)) ? clamp((m - 0.5 + aa) / (2 * aa), 0, 1) : 0; }
        else if (lv === 1 && rcell(LM, Math.floor(x / lc), Math.floor(y / lc)) === 1){ put(o, LAND); prev[i] = NaN; left = NaN; continue; }
        if (land >= 1){ put(o, FS); prev[i] = NaN; left = NaN; continue; }
        const gi = Math.floor(i / GS), gj = Math.floor(j / GS), go = gj * GW + gi;
        if (G && !isNaN(v = ((G[go] * (GS - i % GS) + G[go + 1] * (i % GS)) * (GS - j % GS) + (G[go + GW] * (GS - i % GS) + G[go + GW + 1] * (i % GS)) * (j % GS)) / (GS * GS))){ }
        else if (smooth){ const q = i * 4; v = 0; for (let a = 0; a < 4; a++){ const ro = RO[a]; v += RW[a] * (D(CX[q], ro) * CW[q] + D(CX[q + 1], ro) * CW[q + 1] + D(CX[q + 2], ro) * CW[q + 2] + D(CX[q + 3], ro) * CW[q + 3]); } }
        else v = (D(ix, iy) * (1 - fx) + D(ix + 1, iy) * fx) * (1 - fy) + (D(ix, iy + 1) * (1 - fx) + D(ix + 1, iy + 1) * fx) * fy;
      } catch (e){
        // a cell across the edge of a tile whose pack has not come (or has none): the depth model here, painted again when it comes
        if (st) st.prov = true; land = 0; const q = {x, y}; if (isLandFar(q)){ put(o, [224, 206, 150]); prev[i] = NaN; left = NaN; continue; } v = depthModel(q);
      }
      if (fish){
        const dxv = isNaN(left) ? 0 : v - left, dyv = isNaN(prev[i]) ? 0 : v - prev[i], hs = clamp(0.8 + (dxv + dyv) * sh * 0.004, 0.45, 1.25), pc = plotCol(Math.max(v, 0.5));
        col[0] = pc[0] * hs; col[1] = pc[1] * hs; col[2] = pc[2] * hs;
      } else {
        const edge = (v >= sd && ((left < sd) || (prev[i] < sd))) || (v < sd && ((left >= sd) || (prev[i] >= sd)));
        const k = edge ? SC : v < s2 ? U2 : v < sd ? U1 : WHITE; col[0] = k[0]; col[1] = k[1]; col[2] = k[2];
      }
      if (land > 0){ col[0] += (FS[0] - col[0]) * land; col[1] += (FS[1] - col[1]) * land; col[2] += (FS[2] - col[2]) * land; }
      put(o, col); prev[i] = v; left = v;
    }
  }
}
function scheduleChart(){ followChart(); clearTimeout(chartTimer); chartTimer = setTimeout(() => paintChart(1), 140); }
window.addEventListener('resize', () => { if (document.body.classList.contains('vplot')) scheduleChart(); });
function renderBase(){
  const plot = chartMode() === 'fish'; svg.classList.toggle('plot', plot); svg.classList.toggle('nav', !plot);
  if (!CONT_D && DEPTH) CONT_D = decodeContours(); scheduleChart();
  const g = [], ns = ' vector-effect="non-scaling-stroke"';
  g.push('<rect x="' + (MAPB.x0 - 400) + '" y="' + (MAPB.y0 - 400) + '" width="' + (MAPB.x1 - MAPB.x0 + 800) + '" height="' + (MAPB.y1 - MAPB.y0 + 800) + '" class="offmap"/>');
  g.push('<rect x="' + MAPB.x0 + '" y="' + MAPB.y0 + '" width="' + (MAPB.x1 - MAPB.x0) + '" height="' + (MAPB.y1 - MAPB.y0) + '" class="sea"/>');
  // the graticule, the coast and the names are the chart's (03a-chart.js): drawn for the view, by its level of detail
  if (CONT_D) CONT_D.forEach((d, i) => { const lv = CONTOUR_LEVELS[i]; if (!d || (!plot && lv > 50)) return; g.push('<path d="' + d + '" class="depc' + (lv >= 50 ? ' deep' : '') + '"' + ns + '/>'); });
  $('gBase').innerHTML = g.join('');
  const lg = $('legend'); lg.hidden = !plot || !document.body.classList.contains('vplot') || (typeof G3 !== 'undefined' && G3.isActive());
  if (plot && !lg.innerHTML){ const marks = [0, 10, 30, 60, 120, 250, 500]; lg.innerHTML = '<div class="bar" style="background:linear-gradient(90deg,' + marks.map((m, i) => { const c = plotCol(m); return 'rgb(' + c.map(Math.round).join(',') + ') ' + (i / (marks.length - 1) * 100).toFixed(0) + '%'; }).join(',') + ')"></div><div class="lab">' + marks.map(m => '<span>' + m + '</span>').join('') + '</div>'; }
  updateMapButtons();
}
function updateMapButtons(){
  const g3 = typeof G3 !== 'undefined' && G3.isActive();
  $('modeBtn').textContent = g3 ? (G3.isHelm() ? t('cam_follow') : t('cam_helm')) : (S.settings.plotter ? t('mode_chart') : t('mode_plot'));
  $('instrBtn').classList.toggle('on', S.settings.instr !== false);
  $('modeBtn').classList.toggle('locked', !g3 && !S.equip.plotter);
  $('ecRoute').textContent = S.lang === 'no' ? 'Rute' : 'Route'; $('ecSet').textContent = S.lang === 'no' ? 'Innstillinger' : 'Settings'; $('ecClose').textContent = S.lang === 'no' ? 'Lukk' : 'Close'; $('plotStyle').classList.toggle('locked', !S.equip.plotter);
  $('camBtn').classList.toggle('on', g3 && G3.isHelm()); $('camBtn').setAttribute('aria-label', g3 && G3.isHelm() ? t('cam_follow') : t('cam_helm'));
}
function renderStatic(){
  if (document.body.classList.contains('vplot')) scheduleChart();
  const u = 1 / view.px, g = [];
  // grounds
  for (const gr of GROUNDS){
    g.push('<circle cx="' + gr.p.x + '" cy="' + gr.p.y + '" r="' + (gr.r * 0.75) + '" class="ground" stroke-width="' + u + '" stroke-dasharray="' + (4 * u) + ' ' + (3 * u) + '"/>');
    if (view.z >= 0.5) g.push(txt({x:gr.p.x, y:gr.p.y + 3.6 * u}, gr.name[S.lang], 'lbl-ground', 11 * u, 'text-anchor="middle" stroke-width="' + (3 * u) + '"'));
  }
  // what is inside the view (with a margin)
  const vr = svg.getBoundingClientRect(), vhh = MAP_H / view.z / 2 + 0.5, vww = vhh * (vr.width / (vr.height || 1)) + 0.5, vx0 = view.cx - vww, vx1 = view.cx + vww, vy0 = view.cy - vhh, vy1 = view.cy + vhh, inV = (x, y) => x > vx0 && x < vx1 && y > vy0 && y < vy1;
  // roads and bridges: Senja's and those of the coast's packs (01c-vec.js), asked for when the view is near enough to show them
  if (view.z > 2.5){ vecWant(vx0, vy0, vx1, vy1, () => scheduleStatic()); vecPrune([{x:view.cx, y:view.cy}, S.boat.pos]); }
  if (view.z > 3){ const d = []; for (const r of roadsIn(vx0 * 1000, vy0 * 1000, vx1 * 1000, vy1 * 1000)){ if (r.c > 3 && view.z < 6) continue; d.push('M' + Array.from(r.xs, (x, j) => (x / 1000).toFixed(3) + ',' + (r.zs[j] / 1000).toFixed(3)).join('L')); } if (d.length) g.push('<path d="' + d.join('') + '" class="road" stroke-width="' + (1.1 * u) + '"/>'); }
  if (view.z > 2.5) for (const br of BRIDGES.concat(bridgesIn(vx0 * 1000, vy0 * 1000, vx1 * 1000, vy1 * 1000))){ const n = (br.length - 4) / 2; let d = ''; for (let k = 0; k < n; k++) d += (k ? 'L' : 'M') + (br[4 + k * 2] / 1000).toFixed(3) + ',' + (br[5 + k * 2] / 1000).toFixed(3); g.push('<path d="' + d + '" class="bridge" stroke-width="' + (2.6 * u) + '"/>'); }
  if (view.z > 5){ const pr = []; for (const q of rocksIn(vx0, vy0, vx1, vy1)) if (inV(q[0], q[1])) pr.push('M' + (q[0] - 2.2 * u).toFixed(3) + ',' + q[1].toFixed(3) + 'h' + (4.4 * u).toFixed(3) + 'M' + q[0].toFixed(3) + ',' + (q[1] - 2.2 * u).toFixed(3) + 'v' + (4.4 * u).toFixed(3)); if (pr.length) g.push('<path d="' + pr.join('') + '" class="rock" stroke-width="' + (1 * u) + '"/>'); }
  if (view.z > 3.5) for (const mk of SEAMARKS.marks){ if (!inV(mk[0], mk[1]) || mk[2] === 'M' || mk[2] === 'm') continue; const c = mk[2] === 'L' || mk[2] === 'B' ? (mk[3] === 'starb' ? '#1f8a3c' : '#c8231c') : mk[2] === 'C' || mk[2] === 'S' ? '#d6a800' : '#333'; g.push('<circle cx="' + mk[0] + '" cy="' + mk[1] + '" r="' + (2 * u) + '" fill="' + c + '" stroke="#fff" stroke-width="' + (0.6 * u) + '"/>'); }
  if (view.z > 2) for (const L of SEAMARKS.lights){ if (!inV(L[0], L[1])) continue; const s0 = (L[6] === 'M' ? 9 : 6.5) * u; g.push('<path d="M' + L[0] + ',' + L[1] + 'q' + (s0 * 0.35) + ',' + (-s0 * 0.5) + ' ' + (s0 * 0.12) + ',' + (-s0) + 'q' + (-s0 * 0.5) + ',' + (s0 * 0.3) + ' ' + (-s0 * 0.12) + ',' + s0 + 'z" class="lightsym"/><circle cx="' + L[0] + '" cy="' + L[1] + '" r="' + (1.3 * u) + '" class="lightdot" stroke-width="' + (0.8 * u) + '"/>'); }
  // own catch marks, coloured by kilos per hour
  for (const mk of S.marks){ const col = mk.kgph >= 40 ? '#d7301f' : mk.kgph >= 20 ? '#f08a24' : mk.kgph >= 8 ? '#e5c12b' : '#5b8db8';
    g.push('<circle cx="' + mk.x + '" cy="' + mk.y + '" r="' + (4.2 * u) + '" fill="' + col + '" stroke="#fff" stroke-width="' + (1.2 * u) + '"/>');
    if (view.z > 3.5) g.push(txt({x:mk.x + 6 * u, y:mk.y + 3.5 * u}, mk.kgph + ' kg/t', 'lbl-ground', 9.5 * u, 'stroke-width="' + (2.5 * u) + '"')); }
  // ports, their names when the view is closer than the whole region; the place names (03a-chart.js) keep clear of them
  const taken = [], pl = view.z >= 0.5;
  for (const p of PORTS){
    const s = (pl ? 5 : 3) * u; if (!inV(p.p.x, p.p.y)) continue;
    g.push('<rect x="' + (p.p.x - s) + '" y="' + (p.p.y - s) + '" width="' + (2 * s) + '" height="' + (2 * s) + '" class="port' + (p.home ? ' home' : '') + '" stroke-width="' + (1.5 * u) + '" transform="rotate(45 ' + p.p.x + ' ' + p.p.y + ')"/>');
    if (pl){ g.push(txt({x:p.p.x + 9 * u, y:p.p.y + 4 * u}, p.name, 'lbl-port', 13 * u, 'stroke-width="' + (3 * u) + '"')); taken.push([p.p.x - s, p.p.y - 9 * u, p.p.x + 9 * u + p.name.length * 7.5 * u, p.p.y + 6 * u]); }
  }
  g.push(chartNamesSvg(vx0, vy0, vx1, vy1, u, taken));
  gStatic.innerHTML = g.join('');
}
let staticQueued = false;
// a tile of the coast's packs decoded (01c-vec.js): its roads and bridges are drawn when the chart is near enough to show them
VEC.came.push(() => { if (view.z > 2.5) scheduleStatic(); });
function scheduleStatic(){ if (staticQueued) return; staticQueued = true; requestAnimationFrame(() => { staticQueued = false; renderStatic(); renderDyn(); }); }

let AISNOW = [], AISSEL = null;
// where a vessel has been over the last 24 hours (the schedule is deterministic, so it can be replayed)
let trackCache = {k:'', v:[]};
function aisTrack(id, H){ const ck = id + '|' + Math.floor(H * 30); if (trackCache.k === ck) return trackCache.v; const out = []; trackCache = {k:ck, v:out}; const fi = id[0] === 'f' ? +id.slice(1) : -1;
  for (let k = 1440; k >= 0; k--){ const t = H - k / 60; let p; if (fi >= 0) p = fleetState(fi, t).p; else if (k % 2 === 0){ const q = npcStates(t, id)[0]; p = q && q.p; } if (p) out.push(p); }
  return out; }
function aisInfo(n){
  const L = (no, en) => S.lang === 'no' ? no : en, f = n.fleet ? FLEET[n.fi] : null;
  const st = n.st === 'port' || n.v === 0 ? L('Fortøyd', 'Moored') : n.st === 'fishing' ? (n.v > 2.5 ? L('Fisker, går opp for ny drift', 'Fishing, steaming back for a new drift') : L('Fisker, driver over grunnen', 'Fishing, drifting over the bank')) : n.st === 'out' ? L('På vei til feltet', 'Heading to the grounds') : n.st === 'in' ? L('På vei hjem', 'Heading home') : L('Underveis', 'Under way');
  const rows = f ? [[L('Kallesignal', 'Call sign'), f.cs], [L('Fiskerimerke', 'Registration'), f.reg], [L('Rederi', 'Owner'), f.own], [L('Størrelse', 'Size'), fmt(f.L, 2) + ' × ' + fmt(f.B, 1) + ' m'], [L('Dypgående', 'Draught'), fmt(f.T, 1) + ' m'], [L('Hjemmehavn', 'Home port'), f.homeName]]
    : n.coast ? [[L('Størrelse', 'Size'), fmt(n.L, 1) + ' × ' + fmt(n.B, 1) + ' m'], [L('Dypgående', 'Draught'), fmt(n.T, 1) + ' m']]
    : n.type === 'coastal' ? [[L('Kallesignal', 'Call sign'), 'LAKY'], [L('Rederi', 'Owner'), 'Kystruta AS'], [L('Størrelse', 'Size'), '121,8 × 21,0 m'], [L('Dypgående', 'Draught'), '4,9 m']] : [[L('Kallesignal', 'Call sign'), 'LMSB'], [L('Rederi', 'Owner'), 'Senja Ferjedrift AS'], [L('Størrelse', 'Size'), '49,9 × 12,4 m'], [L('Dypgående', 'Draught'), '3,1 m']];
  const dg = r => String(Math.round(((r * 180 / Math.PI) % 360 + 360) % 360) % 360).padStart(3, '0') + '°';
  rows.push([L('Status', 'Status'), st], [L('Fart (SOG)', 'Speed (SOG)'), fmt(n.v, 1) + ' kn'], [L('Kurs (COG)', 'Course (COG)'), n.v > 0.15 ? dg(n.cog !== undefined ? n.cog : n.hd) : '–'], [L('Styrekurs (HDG)', 'Heading (HDG)'), dg(n.hd)]);
  return '<div class="ai-h"><b>' + n.name + '</b><button type="button" id="aisX" aria-label="Lukk">✕</button></div><div class="ai-t">' + (n.fleet || n.coast ? L('Fiskefartøy', 'Fishing vessel') : n.type === 'coastal' ? L('Passasjerskip', 'Passenger ship') : L('Ferje', 'Ferry')) + '</div>' + rows.map(r => '<div class="ai-r"><span>' + r[0] + '</span><span>' + r[1] + '</span></div>').join('') + '<div class="ai-n">' + L('Stiplet linje: sporet siste 24 timer', 'Dashed line: track over the last 24 hours') + '</div>';
}
function renderAisCard(){ const el = $('aisCard'); if (!AISSEL){ el.hidden = true; return; } const n = AISNOW.find(q => q.id === AISSEL); if (!n){ el.hidden = true; return; } el.innerHTML = aisInfo(n); el.hidden = false; $('aisX').onclick = () => { AISSEL = null; renderAisCard(); renderDyn(); }; }
function renderDyn(){
  const u = 1 / view.px, b = S.boat, g = [];
  renderRouteTools();
  // trail
  if (b.status !== 'port' && S.trail.length){
    const pts = S.trail.concat([b.pos]);
    g.push('<polyline points="' + ptsStr(pts) + '" class="trail" stroke-width="' + (1.5 * u) + '" stroke-dasharray="' + (1 * u) + ' ' + (4 * u) + '"/>');
  }
  // active plan
  if (S.plan){
    const pts = [b.pos].concat(S.plan.wps.slice(S.plan.idx)), uz = S.plan.unsafe || [];
    for (let i = 1; i < pts.length; i++) g.push('<line x1="' + pts[i - 1].x + '" y1="' + pts[i - 1].y + '" x2="' + pts[i].x + '" y2="' + pts[i].y + '" class="route' + (uz[S.plan.idx + i - 1] ? ' unsafe' : '') + '" stroke-width="' + (2.5 * u) + '"/>');
    S.plan.wps.slice(S.plan.idx).forEach((w, k) => { if (!w.port) g.push('<circle cx="' + w.x + '" cy="' + w.y + '" r="' + ((w.auto ? 3.5 : 5) * u) + '" class="wp' + (w.fish > 0 ? ' fish' : '') + (w.auto ? ' auto' : '') + '" stroke-width="' + (2 * u) + '"/>'); if (view.z > 3) g.push(txt({x:w.x + 7 * u, y:w.y - 6 * u}, wpName(S.plan.idx + k + 1), 'wpn' + (w.auto ? ' auto' : ''), 10 * u, 'stroke-width="' + (3 * u) + '"')); });
  }
  // draft: the legs, the «+» handle on each long leg, the points named WP1 … and the start WP0
  if (S.draft.length){
    let a = b.pos;
    const hz = draftHazards();
    S.draft.forEach((w, i) => {
      const ok = legClear(a, w), un = hz[i] && hz[i].unsafe;
      g.push('<line x1="' + a.x + '" y1="' + a.y + '" x2="' + w.x + '" y2="' + w.y + '" class="route' + (ok ? (un ? ' unsafe' : '') : ' bad') + '" stroke-width="' + (2.5 * u) + '" stroke-dasharray="' + (7 * u) + ' ' + (5 * u) + '"/>');
      a = w;
    });
    if (!RDRAG) for (const hd of insHandles()) g.push('<g class="wpins"><circle cx="' + hd.p.x + '" cy="' + hd.p.y + '" r="' + (8 * u) + '" stroke-width="' + (1.5 * u) + '"/><path d="M' + (hd.p.x - 4 * u) + ',' + hd.p.y + 'h' + (8 * u) + 'M' + hd.p.x + ',' + (hd.p.y - 4 * u) + 'v' + (8 * u) + '" stroke-width="' + (1.8 * u) + '"/></g>');
    g.push(txt({x:b.pos.x + 9 * u, y:b.pos.y + 16 * u}, wpName(0), 'wpn wp0', 11 * u, 'stroke-width="' + (3 * u) + '"'));
    S.draft.forEach((w, i) => {
      const drg = RDRAG && RDRAG.i === i, cls = 'wp' + (w.fish > 0 ? ' fish' : '') + (w.auto ? ' auto' : '') + (drg ? ' drag' + (RDRAG.land ? ' landed' : '') : '');
      if (!w.port) g.push('<circle cx="' + w.x + '" cy="' + w.y + '" r="' + ((drg ? 9 : w.auto ? 4.5 : 6) * u) + '" class="' + cls + '" stroke-width="' + (2 * u) + '"/>');
      g.push(txt({x:w.x + 8 * u, y:w.y - 7 * u}, wpName(i + 1), 'wpn' + (w.auto ? ' auto' : ''), (w.auto ? 10 : 12) * u, 'stroke-width="' + (3 * u) + '"'));
    });
  }
  // passive gear in the sea
  g.push(gearSvg(u));
  // other vessels (AIS)
  const Hn = (S.t + liveFrac()) / 60;
  AISNOW = npcStates(Hn);
  if (AISSEL){ const tr = aisTrack(AISSEL, Hn); if (tr.length > 1) g.push('<polyline points="' + tr.map(q => q.x.toFixed(3) + ',' + q.y.toFixed(3)).join(' ') + '" class="aistrack" stroke-width="' + (1.6 * u) + '" stroke-dasharray="' + (4 * u) + ' ' + (3 * u) + '"/>'); }
  for (const n of AISNOW){
    const cls = n.fleet || n.coast ? 'ais fish' : 'ais pass', sel = AISSEL === n.id ? ' sel' : '', moored = n.st === 'port' || (!n.fleet && !n.coast && n.v === 0);
    const sw = (sel ? 2.4 : 1.1) * u;
    if (moored) g.push('<circle cx="' + n.p.x + '" cy="' + n.p.y + '" r="' + (3.2 * u) + '" class="' + cls + sel + ' moor" stroke-width="' + sw + '"/>');
    else { const k = (n.type === 'coastal' ? 10 : n.type === 'ferry' ? 8.5 : n.fleet || n.coast ? 5.2 + n.L * 0.13 : 6.5) * u, dg = (n.cog !== undefined ? n.cog : n.hd) * 180 / Math.PI;
      g.push('<g transform="translate(' + n.p.x + ' ' + n.p.y + ') rotate(' + dg.toFixed(1) + ')"><path d="M0,' + (-k * 1.25) + ' L' + (0.55 * k) + ',' + (k * 0.8) + ' L0,' + (k * 0.45) + ' L' + (-0.55 * k) + ',' + (k * 0.8) + ' Z" class="' + cls + sel + '" stroke-width="' + sw + '"/></g>'); }
    if (view.z > 5 || sel) g.push(txt({x:n.p.x + 8 * u, y:n.p.y - 6 * u}, n.name, 'lbl-ais', 10 * u, 'stroke-width="' + (3 * u) + '"'));
  }
  // gear being drawn out
  if (SETM) g.push(setSvg(u));
  // boat
  const s = 9 * u, deg = b.heading * 180 / Math.PI;
  if (b.status === 'port'){ g.push('<circle cx="' + b.pos.x + '" cy="' + b.pos.y + '" r="' + (11 * u) + '" class="fishring" stroke-width="' + (2.5 * u) + '"/>'); gDyn.innerHTML = g.join(''); return; }
  if (b.status === 'fishing') g.push('<circle cx="' + b.pos.x + '" cy="' + b.pos.y + '" r="' + (15 * u) + '" class="fishring" stroke-width="' + (1.5 * u) + '" stroke-dasharray="' + (3 * u) + ' ' + (3 * u) + '"/>');
  g.push('<g transform="translate(' + b.pos.x + ' ' + b.pos.y + ') rotate(' + deg.toFixed(1) + ')"><path d="M0,' + (-s) + ' L' + (0.62 * s) + ',' + s + ' L0,' + (0.5 * s) + ' L' + (-0.62 * s) + ',' + s + ' Z" class="boat" stroke-width="' + (1.5 * u) + '"/></g>');
  gDyn.innerHTML = g.join('');
}

// pointer: pan, pinch, tap
const ptrs = new Map(); let drag = null, pinch = null;
svg.addEventListener('pointerdown', e => {
  svg.setPointerCapture(e.pointerId); ptrs.set(e.pointerId, {x:e.clientX, y:e.clientY});
  if (ptrs.size === 1){ drag = {sx:e.clientX, sy:e.clientY, cx:view.cx, cy:view.cy, moved:false}; const mp = toMap(e.clientX, e.clientY); drag.set = setGrab(mp); drag.wp = drag.set ? null : routeGrab(mp); }
  else if (ptrs.size === 2){ const [a, c] = [...ptrs.values()]; pinch = {d:Math.hypot(a.x - c.x, a.y - c.y) || 1, z:view.z}; if (drag){ drag.moved = true; if (drag.wp){ routeDragCancel(drag.wp); drag.wp = null; drag.cx = view.cx; drag.cy = view.cy; } } }
});
svg.addEventListener('pointermove', e => {
  if (!ptrs.has(e.pointerId)) return;
  ptrs.set(e.pointerId, {x:e.clientX, y:e.clientY});
  if (ptrs.size === 2 && pinch){ const [a, c] = [...ptrs.values()]; view.z = clamp(pinch.z * Math.hypot(a.x - c.x, a.y - c.y) / pinch.d, ZMIN, ZMAX); applyView(); scheduleStatic(); }
  else if (drag && ptrs.size === 1){
    const dx = e.clientX - drag.sx, dy = e.clientY - drag.sy;
    if (drag.set){ drag.moved = true; setAim(toMap(e.clientX, e.clientY)); return; }
    if (drag.wp){ if (drag.wp.moved || Math.hypot(dx, dy) > 5) routeDragMove(drag.wp, toMap(e.clientX, e.clientY)); return; }
    if (Math.hypot(dx, dy) > 7) drag.moved = true;
    if (drag.moved){ view.cx = drag.cx - dx / view.px; view.cy = drag.cy - dy / view.px; applyView(); }
  }
});
function ptrUp(e){
  if (drag && drag.set){ ptrs.delete(e.pointerId); if (ptrs.size < 2) pinch = null; if (ptrs.size === 0) drag = null; return; }
  if (drag && drag.wp){ const g = drag.wp; drag.wp = null; ptrs.delete(e.pointerId); if (ptrs.size < 2) pinch = null; if (ptrs.size === 0) drag = null; if (e.type === 'pointerup') routeDragEnd(g); else routeDragCancel(g); return; }
  const tap = drag && !drag.moved && ptrs.size === 1 && e.type === 'pointerup';
  ptrs.delete(e.pointerId); if (ptrs.size < 2) pinch = null;
  if (tap && SETM){ setAim(toMap(e.clientX, e.clientY)); if (ptrs.size === 0) drag = null; return; }
  if (tap){ const mp = toMap(e.clientX, e.clientY), rr = 16 / view.px; const gh = gearHit(mp, rr * 0.8); if (gh){ gearTap(gh); renderDyn(); return; } let hit = null, bd = 1e9; for (const n of AISNOW){ const d = dist(n.p, mp); if (d < rr && d < bd){ bd = d; hit = n; } } if (hit && (hit.st === 'port' || hit.v === 0) && PORTS.some(q => dist(q.p, mp) < rr * 1.6)) hit = null; if (hit){ AISSEL = hit.id; renderDyn(); renderAisCard(); return; } addWaypoint(mp); }
  if (ptrs.size === 0) drag = null;
  else { const [p] = [...ptrs.values()]; drag = {sx:p.x, sy:p.y, cx:view.cx, cy:view.cy, moved:true}; }
}
svg.addEventListener('pointerup', ptrUp); svg.addEventListener('pointercancel', ptrUp);
svg.addEventListener('wheel', e => {
  e.preventDefault();
  const before = toMap(e.clientX, e.clientY);
  view.z = clamp(view.z * Math.exp(-e.deltaY * 0.0015), ZMIN, ZMAX); applyView();
  const after = toMap(e.clientX, e.clientY);
  view.cx += before.x - after.x; view.cy += before.y - after.y; applyView(); scheduleStatic();
}, {passive:false});
$('zin').onclick = () => { if (G3.isActive()) return G3.zoom(1 / 1.4); view.z = clamp(view.z * 1.4, ZMIN, ZMAX); applyView(); scheduleStatic(); };
$('zout').onclick = () => { if (G3.isActive()) return G3.zoom(1.4); view.z = clamp(view.z / 1.4, ZMIN, ZMAX); applyView(); scheduleStatic(); };
$('zboat').onclick = () => { if (G3.isActive()) return G3.reset(); view.cx = S.boat.pos.x; view.cy = S.boat.pos.y; applyView(); scheduleStatic(); };
window.addEventListener('resize', () => { applyView(); scheduleStatic(); });

function addWaypoint(pt){
  const b = S.boat;
  if (!tutAllow('waypoint')) return;
  if (LEIA_ARM){ leiaTo(pt); return; }
  if (!['port', 'idle'].includes(b.status)){ toast(t('cant_plan')); return; }
  if (S.draft.length && S.draft[S.draft.length - 1].port){ toast(t('ends_port')); return; }
  const r = 22 / view.px; let near = null, bd = 1e9;
  for (const p of PORTS){ const d = dist(p.p, pt); if (d < r && d < bd){ bd = d; near = p; } }
  if (near && b.status === 'port' && b.port === near.id && !S.draft.length){ toast(t('already_here')); return; }
  if (!near && isLandUI(pt)){ toast(t('on_land')); return; }
  draftEdit(() => {
    const wp = (q, auto) => S.draft.push({x:q.x, y:q.y, port:null, fish:0, auto});
    // out of the harbour first, the way the boats go, when the first leg would cut across a breakwater or a point
    if (!S.draft.length && b.status === 'port') exitWps(portById(b.port), near ? near.p : pt).forEach(q => wp(q, 'out'));
    if (near){
      const prev = S.draft.length ? S.draft[S.draft.length - 1] : b.pos;
      entryWps(near, prev).forEach(q => wp(q, 'in'));
      S.draft.push({x:near.p.x, y:near.p.y, port:near.id, fish:0});
      if (window.innerWidth <= 700) document.body.classList.add('drawer');
    } else S.draft.push({x:pt.x, y:pt.y, port:null, fish:0});
  });
  if (tab !== 'route') setTab('route'); else panelDirty = true;
  renderDyn(); renderRouteTools();
}
$('rUndo').onclick = () => routeUndoRedo(false);
$('rAuto').onclick = () => leiaArm(!LEIA_ARM);
$('rPlay').onclick = () => routePlay();
$('rRedo').onclick = () => routeUndoRedo(true);

