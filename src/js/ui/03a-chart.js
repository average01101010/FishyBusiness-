// ===== THE CHART'S VECTORS (phase K7 of the coast plan): the coast by level of detail, the graticule and the place names =====
// The map packs carry them (tools/map/chart.py): the core has coast0 (the whole frame's land, simplified to 300 m) and names0 (the
// names that show from the whole country); a 'chart' pack per 50 km tile has coast1 (25 m), coast2 (3 m) and names (rank 0 to 3).
// paintChart (03-map.js) paints the depth and then draws the coast of the level that suits the view's height:
//   level 0  taller than CHARTV.far km: coast0 over a coarse depth (the national core only, no tile's packs are fetched)
//   level 1  down to CHARTV.near km: coast1 where the tile has a chart pack, coast0 elsewhere
//   level 2  nearer: coast2, and the land mask (25 m) shows as foreshore where it is land outside the coast, so the chart shows what
//            the route check (legClear) takes as land
// Paths are kept as Path2D in km (coast0 from the frame's origin, the tiles' from their corner, so the numbers stay small).
const CHARTV = {far:150, near:8, px:160000, p0:null, paths:new Map(), names:new Map(), off:null};
const chartLevel = hh => hh > CHARTV.far ? 0 : hh > CHARTV.near ? 1 : 2;
function vReader(b){
  let i = 0;
  const u = () => { let v = 0, s = 1, x; do { x = b[i++]; v += (x & 127) * s; s *= 128; } while (x & 128); return v; };
  return {u, z(){ const v = u(); return v % 2 ? -(v + 1) / 2 : v / 2; }, byte(){ return b[i++]; }, str(n){ const t = new TextDecoder().decode(b.subarray(i, i + n)); i += n; return t; }};
}
// the rings of a vector entry (vectors.py's lines: n, then per ring its class, point count and zigzag steps) as one Path2D, sc km per unit;
// with tol (units) for a view whose pixel is coarser than the data: a point nearer than tol to the last one kept is left out, and so is
// a ring smaller than tol (the vertices made the coast seconds to draw at the whole country and the region, 03.10.2026)
// keep (optional): a ring is taken only when keep(its box in units) says so
function vecPath(v, sc, tol, keep){
  const r = vReader(v.b), n = r.u(), p = new Path2D(), q = [];
  if (keep && !tol) tol = 1e-9;
  for (let k = 0; k < n; k++){
    r.u(); const m = r.u(); let x = 0, y = 0;
    if (!tol){ for (let j = 0; j < m; j++){ x += r.z(); y += r.z(); j ? p.lineTo(x * sc, y * sc) : p.moveTo(x * sc, y * sc); } p.closePath(); continue; }
    q.length = 0; let lx = 0, ly = 0, ax = Infinity, ay = Infinity, bx = -Infinity, by = -Infinity;
    for (let j = 0; j < m; j++){ x += r.z(); y += r.z(); if (x < ax) ax = x; if (x > bx) bx = x; if (y < ay) ay = y; if (y > by) by = y; if (!j || Math.abs(x - lx) + Math.abs(y - ly) >= tol){ q.push(x, y); lx = x; ly = y; } }
    if (bx - ax < tol && by - ay < tol || keep && !keep(ax, ay, bx, by)) continue;
    for (let j = 0; j < q.length; j += 2) j ? p.lineTo(q[j] * sc, q[j + 1] * sc) : p.moveTo(q[j] * sc, q[j + 1] * sc); p.closePath();
  }
  return p;
}
// the step (a power of two of the data's own, 0 for all of it) that suits a pixel of px km
const pathStep = (px, base) => Math.max(0, Math.floor(Math.log2(0.7 * px / base)));
// coast0 is in its own pack from H1b R2 (chart0, the whole frame), which comes after the start; until it is in, the chart has the land
// of the core and the tiles, and is painted again when it comes (an older build has it in the core). It is two paths: the rings that
// touch the old frame (the coast, 0-1450 x 0-1750 km) and the rest (Greenland, Iceland, Svalbard, Russia: as many rings again), which
// is drawn only when the view reaches past the old frame (charttest: the whole country's first picture in 0.6 s with the CPU slowed)
const C0IN = (ax, ay, bx, by) => bx >= 0 && by >= 0 && ax <= 145000 && ay <= 175000;
function chartPath0(px, out){ const b = pathStep(px || 0, 0.3), k = 'p0:' + b + (out ? 'o' : ''); if (!CHARTV.paths.has(k)){ const pk = MAPD.chart0 || MAPD.core;
  if (pk && !pk.buf){ if (!pk.load) mapLoad(pk).then(() => { if (typeof chartCame === 'function') chartCame(null); }, e => console.error(e)); return null; }
  const v = mapVec(pk, 'coast0'); if (!v) return null; CHARTV.paths.set(k, vecPath(v, 0.01, b ? 30 * 2 ** b : 0, out ? (ax, ay, bx, by) => !C0IN(ax, ay, bx, by) : C0IN)); } return CHARTV.paths.get(k); }
// coast0 whole (b = 0) for a small view: only what reaches into the box [x0, y0, x1, y1] (km; the view and a margin round it). The
// full path was built for the whole frame, and drawn, whenever a view as small as the little chart in 3D lay where the tiles' chart
// packs had not come: 1.8 s with the CPU slowed at the first start (Ø3a, 07.11.2026). The rings are read once (C0R: their points as
// vecPath keeps them with the keep test, a point the same as the last left out, and their boxes: vecPath's own loop with the tol of
// 1e-9 that keep gives it, so a change there is one here too); the path is kept for the last box.
// A ring whose box misses the box is left out. In a ring that reaches in, every side that may cross the box is kept as it was, end
// points and all, so the coast in the view is drawn from the same lines as before (the same pixels); a run of sides that lie wholly
// on one side of the box (both ends beyond the same edge) goes instead along a box a margin larger (each point clamped to it, points
// in a row on one of its edges as the first and the last): the run stays beyond the box and goes round it the same way, so the land
// inside is the same (the winding is kept), and what is drawn of it lies outside the view.
const C0R = {v:null, rings:null};
function chartRings0(v){
  if (C0R.v === v) return C0R.rings;
  const r = vReader(v.b), n = r.u(), q = [], rings = [];
  for (let k = 0; k < n; k++){
    r.u(); const m = r.u(); let x = 0, y = 0, lx = 0, ly = 0, ax = Infinity, ay = Infinity, bx = -Infinity, by = -Infinity; q.length = 0;
    for (let j = 0; j < m; j++){ x += r.z(); y += r.z(); if (x < ax) ax = x; if (x > bx) bx = x; if (y < ay) ay = y; if (y > by) by = y; if (!j || Math.abs(x - lx) + Math.abs(y - ly) >= 1e-9){ q.push(x, y); lx = x; ly = y; } }
    if (bx - ax < 1e-9 && by - ay < 1e-9) continue;
    rings.push({p:Int32Array.from(q), ax, ay, bx, by, inOld:C0IN(ax, ay, bx, by)});
  }
  C0R.v = v; C0R.rings = rings; return rings;
}
function chartPath0In(out, box){
  const pk = MAPD.chart0 || MAPD.core; if (!pk || !pk.buf) return chartPath0(0, out);
  const v = mapVec(pk, 'coast0'); if (!v) return null;
  const o = out ? 'o' : 'i', key = box.join(','); if (C0R[o] && C0R[o].key === key && C0R[o].v === v) return C0R[o].path;   // (the coast it was made from too: chart0 after the core's, or a pack read again)
  const X0 = box[0] * 100, Y0 = box[1] * 100, X1 = box[2] * 100, Y1 = box[3] * 100, p = new Path2D();   // (the rings are in 10 m units)
  const m = Math.max(X1 - X0, Y1 - Y0) * 0.05 + 1, Q0 = X0 - m, R0 = Y0 - m, Q1 = X1 + m, R1 = Y1 + m;   // the larger box the runs go along
  const code = (x, y) => (x < X0 ? 1 : x > X1 ? 2 : 0) | (y < Y0 ? 4 : y > Y1 ? 8 : 0);
  const E = [];   // the ring as drawn: x, y pairs
  // a clamped point of a run (from E[r0] on): left out when it is the last point again, and in place of the last when the two before it and
  // it lie on the same edge of the larger box (the run goes along that edge from the first to the last)
  const on = (a, b, c) => (a === b && b === c);
  const add = (x, y, r0) => { const n = E.length;
    if (n >= 2 && E[n - 2] === x && E[n - 1] === y) return;
    if (n >= r0 + 4){ const ax = E[n - 4], ay = E[n - 3], bx = E[n - 2], by = E[n - 1];
      if ((on(ax, bx, x) && (x === Q0 || x === Q1)) || (on(ay, by, y) && (y === R0 || y === R1))){ E[n - 2] = x; E[n - 1] = y; return; } }
    E.push(x, y); };
  const clampAdd = (x, y, r0) => add(x < Q0 ? Q0 : x > Q1 ? Q1 : x, y < R0 ? R0 : y > R1 ? R1 : y, r0);
  for (const R of chartRings0(v)){
    if (R.inOld === !!out || R.bx < X0 || R.ax > X1 || R.by < Y0 || R.ay > Y1) continue;
    const P = R.p, n = P.length / 2;
    if (R.ax >= X0 && R.bx <= X1 && R.ay >= Y0 && R.by <= Y1){ for (let j = 0; j < P.length; j += 2) j ? p.lineTo(P[j] * 0.01, P[j + 1] * 0.01) : p.moveTo(P[j] * 0.01, P[j + 1] * 0.01); p.closePath(); continue; }
    // the first side that may cross the box (its two ends not beyond the same edge); none: the ring goes round outside it, as one run
    let s = -1, c0 = code(P[0], P[1]);
    for (let i = 0, ci = c0; i < n; i++){ const k = (i + 1) % n, ck = code(P[k * 2], P[k * 2 + 1]); if (!(ci & ck)){ s = i; break; } ci = ck; }
    E.length = 0;
    if (s < 0){ for (let i = 0; i < n; i++) clampAdd(P[i * 2], P[i * 2 + 1], 0); }
    else {
      E.push(P[s * 2], P[s * 2 + 1]); let r0 = -1, cp = code(P[s * 2], P[s * 2 + 1]);
      for (let t = 1; t <= n; t++){ const k = (s + t) % n, x = P[k * 2], y = P[k * 2 + 1], ck = code(x, y);
        if (cp & ck){ if (r0 < 0){ r0 = E.length; const a = (s + t - 1) % n; clampAdd(P[a * 2], P[a * 2 + 1], r0); } clampAdd(x, y, r0); }   // a side wholly beyond one edge
        else { if (r0 >= 0){ const a = (s + t - 1) % n; if (E[E.length - 2] !== P[a * 2] || E[E.length - 1] !== P[a * 2 + 1]) E.push(P[a * 2], P[a * 2 + 1]); r0 = -1; }
          if (t < n) E.push(x, y); }   // a side that may cross: as it was (its end; the ring's first point closes it)
        cp = ck; }
      if (r0 >= 0 && (E[E.length - 2] !== P[s * 2] || E[E.length - 1] !== P[s * 2 + 1])) E.push(P[s * 2], P[s * 2 + 1]);
      if (E.length >= 4 && E[E.length - 2] === E[0] && E[E.length - 1] === E[1]) E.length -= 2;   // (the first point again: closePath draws that side)
    }
    if (E.length < 4) continue;
    for (let j = 0; j < E.length; j += 2) j ? p.lineTo(E[j] * 0.01, E[j + 1] * 0.01) : p.moveTo(E[j] * 0.01, E[j + 1] * 0.01); p.closePath();
  }
  C0R[o] = {key, v, path:p}; return p;
}
// the rings that touch the rectangle r [x0, y0, x1, y1] (m from the tile's corner), as paths in km: land (class 0 and 1), mole (the
// breakwaters, 2 and 3) and all, each null when none. The shore in 3D (view3d buildLandMask) strokes the land's and the breakwaters' rings
// with their own slopes and fills all of them, over its own window alone: a tile's whole coast ran to 184 000 points (Frøya). A ring
// kept whole keeps the nonzero fill right inside the window; a hole whose outer ring is outside it lies outside it too.
function vecPathsIn(v, sc, r){
  const rd = vReader(v.b), n = rd.u(), P = {land:null, mole:null, all:null}, pts = []; let nl = 0, nm = 0;
  for (let k = 0; k < n; k++){
    const c = rd.u(), m = rd.u(); let x = 0, y = 0, ax = Infinity, ay = Infinity, bx = -Infinity, by = -Infinity; pts.length = 0;
    for (let j = 0; j < m; j++){ x += rd.z(); y += rd.z(); pts.push(x, y); if (x < ax) ax = x; if (y < ay) ay = y; if (x > bx) bx = x; if (y > by) by = y; }
    if (m < 3 || bx < r[0] || ax > r[2] || by < r[1] || ay > r[3]) continue;
    const key = c >= 2 ? 'mole' : 'land', p = P[key] || (P[key] = new Path2D()), a = P.all || (P.all = new Path2D());
    for (let j = 0; j < pts.length; j += 2){ const X = pts[j] * sc, Y = pts[j + 1] * sc; if (j){ p.lineTo(X, Y); a.lineTo(X, Y); } else { p.moveTo(X, Y); a.moveTo(X, Y); } }
    p.closePath(); a.closePath(); if (c >= 2) nm++; else nl++;
  }
  P.n = nl + nm; return P;
}
function chartPathsIn(pk, r){ const v = mapVec(pk, 'coast2'); return v ? vecPathsIn(v, 0.001, r) : null; }
function chartPath(pk, lv, px){ const base = lv === 2 ? 0.003 : 0.025, b = pathStep(px || 0, base), k = pk.file + ':' + pk.tile + ':' + lv + ':' + b; if (!CHARTV.paths.has(k)){ const v = mapVec(pk, lv === 2 ? 'coast2' : 'coast1'); CHARTV.paths.set(k, v ? vecPath(v, 0.001, b ? base * 1000 * 2 ** b : 0) : null); } return CHARTV.paths.get(k); }
// the coast over the painted depth: the rings stroked and then filled (nonzero: the holes turn the other way), so the seams between
// Overture's land pieces are covered and only the shore keeps its line, on the sea's side
function chartCoast(ctx, x0, y0, kx, ky, W, H, dpr, fish){
  const hh = H * ky, lv = chartLevel(hh), T = MAPD.man.tile;
  const tiles = lv ? mapPacksIn('chart', x0, y0, x0 + W * kx, y0 + hh).filter(pk => pk.buf && chartPath(pk, lv, kx)) : [];
  ctx.save(); ctx.fillStyle = fish ? '#262b23' : '#e8d7a6'; ctx.strokeStyle = fish ? '#6b755c' : '#8f7d52';
  // the line: three hairlines (a pixel wide, which the canvas draws without building a stroke's outline: a 1.8 px line round the
  // whole country took 0.7 s with the CPU slowed four times, 03.10.2026) moved most of a pixel round the coast, under the fill
  const draw = (p, ox, oy) => {
    ctx.lineWidth = ky;
    for (const [dx, dy] of [[0, -0.9], [0.78, 0.45], [-0.78, 0.45]]){ ctx.setTransform(1 / kx, 0, 0, 1 / ky, (ox - x0) / kx + dx * dpr, (oy - y0) / ky + dy * dpr); ctx.stroke(p); }
    ctx.setTransform(1 / kx, 0, 0, 1 / ky, (ox - x0) / kx, (oy - y0) / ky); ctx.fill(p);
  };
  // the national coast only where a tile in the view has no chart pack of its own (it was stroked over the whole country each time)
  const nT = (Math.floor((x0 + W * kx) / T) - Math.floor(x0 / T) + 1) * (Math.floor((y0 + hh) / T) - Math.floor(y0 / T) + 1);
  const x1 = x0 + W * kx, y1 = y0 + hh, inOld = x1 > 0 && y1 > 0 && x0 < 1450 && y0 < 1750, past = x0 < 0 || y0 < 0 || x1 > 1450 || y1 > 1750;
  // coast0 whole (b = 0) only round the view (chartPath0In), in a view up to CHARTV.far km tall whose whole path is not made already: the
  // box is the view and half its size or more round it, on a grid of half the view, so it is made again only when the view has moved
  // that far (a new box for every pan cost 13 ms at 100 km and 65 ms at 300 km with the CPU slowed, the path drawn whole under 1 ms)
  const vs = Math.max(W * kx, hh), g = vs / 2, sn = (v, f) => f(v / g) * g, b0 = !pathStep(kx, 0.3) && hh <= CHARTV.far;
  const box = b0 ? [sn(x0 - g, Math.floor), sn(y0 - g, Math.floor), sn(x1 + g, Math.ceil), sn(y1 + g, Math.ceil)] : null;
  const c0 = o => box && !CHARTV.paths.has('p0:0' + (o ? 'o' : '')) ? chartPath0In(o, box) : chartPath0(kx, o);
  const p0 = tiles.length < nT && inOld ? c0(false) : null, p0o = tiles.length < nT && past ? c0(true) : null;
  if (p0 || p0o){
    ctx.save();
    if (tiles.length){ ctx.beginPath(); ctx.rect(0, 0, W, H); for (const pk of tiles) ctx.rect((pk.tile[0] * T - x0) / kx, (pk.tile[1] * T - y0) / ky, T / kx, T / ky); ctx.clip('evenodd'); }
    if (p0) draw(p0, 0, 0); if (p0o) draw(p0o, 0, 0); ctx.restore();
  }
  for (const pk of tiles){
    const ox = pk.tile[0] * T, oy = pk.tile[1] * T;
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.beginPath(); ctx.rect((ox - x0) / kx, (oy - y0) / ky, T / kx, T / ky); ctx.clip();
    draw(chartPath(pk, lv, kx), ox, oy); ctx.restore();
  }
  ctx.restore();
}
// the graticule: a step that gives three or more parallels across the view, and meridians about as far apart on the ground
const GRAT = [10, 5, 2, 1, 0.5, 0.25, 1 / 6, 1 / 12, 1 / 30, 1 / 60, 0.5 / 60, 0.25 / 60];
function fmtDM(v, pos, neg){
  const a = Math.abs(v); let d = Math.floor(a + 1e-9), m = Math.round((a - d) * 240) / 4; if (m >= 60){ d++; m = 0; }
  return d + '°' + (m ? String(m).replace('.', ',') + "'" : '') + (v < 0 ? neg : pos);
}
function chartGrid(ctx, x0, y0, kx, ky, W, H, dpr, fish){
  const ww = W * kx, hh = H * ky, ll = [[0, 0], [1, 0], [0, 1], [1, 1], [0.5, 0], [0.5, 1], [0, 0.5], [1, 0.5], [0.5, 0.5]].map(([a, b]) => natLL({x:x0 + a * ww, y:y0 + b * hh}));
  const la0 = Math.min(...ll.map(q => q.lat)), la1 = Math.max(...ll.map(q => q.lat)), lo0 = Math.min(...ll.map(q => q.lon)), lo1 = Math.max(...ll.map(q => q.lon));
  const sLa = GRAT.find(s => hh / 111.2 / s >= 3) || GRAT[GRAT.length - 1], cs = Math.cos(ll[8].lat * Math.PI / 180), sLo = GRAT.find(s => s <= sLa / cs * 1.3) || GRAT[GRAT.length - 1];
  const px = q => [(q.x - x0) / kx, (q.y - y0) / ky], no = S.lang === 'no';
  ctx.save(); ctx.strokeStyle = fish ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.1)'; ctx.lineWidth = dpr; ctx.fillStyle = fish ? 'rgba(220,235,240,0.6)' : 'rgba(40,55,65,0.65)'; ctx.font = Math.round(10 * dpr) + 'px sans-serif';
  const lab = [];
  for (let k = Math.ceil(la0 / sLa), n = 0; k * sLa <= la1 && n < 60; k++, n++){
    const lat = k * sLa, pts = []; for (let j = 0; j <= 32; j++) pts.push(px(P(lat, lo0 + (lo1 - lo0) * j / 32)));
    ctx.beginPath(); pts.forEach(([X, Y], j) => j ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y)); ctx.stroke();
    const e = pts.find(([X, Y]) => X >= 0 && Y > 12 * dpr && Y < H - 14 * dpr); if (e) lab.push([fmtDM(lat, 'N', 'S'), Math.max(e[0], 0) + 3 * dpr, e[1] - 3 * dpr]);
  }
  for (let k = Math.ceil(lo0 / sLo), n = 0; k * sLo <= lo1 && n < 60; k++, n++){
    const lon = k * sLo, pts = []; for (let j = 0; j <= 32; j++) pts.push(px(P(la0 + (la1 - la0) * j / 32, lon)));
    ctx.beginPath(); pts.forEach(([X, Y], j) => j ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y)); ctx.stroke();
    const e = pts.find(([X, Y]) => Y <= H && X > 40 * dpr && X < W - 40 * dpr); if (e) lab.push([fmtDM(lon, no ? 'Ø' : 'E', no ? 'V' : 'W'), e[0] + 3 * dpr, Math.min(e[1], H) - 4 * dpr]);
  }
  for (const [s, X, Y] of lab) ctx.fillText(s, X, Y);
  CHARTV.grid = [sLa, sLo, lab.length];
  ctx.restore();
}
// ---------- the place names ----------
// the names of a pack's entry, in km: [x, y, kind, rank, name, angle (degrees, a fjord's name along it)]; kinds 0 town,
// 1 sea/fjord/sound/bay, 2 island, 3 peak/cape
function chartNamesOf(pk, entry, sc, ox, oy){
  const k = pk.file + ':' + pk.tile + ':' + entry; if (CHARTV.names.has(k)) return CHARTV.names.get(k);
  const v = mapVec(pk, entry), out = [];
  if (v){ const r = vReader(v.b), n = r.u(); for (let i = 0; i < n; i++){ const x = r.u(), y = r.u(), kind = r.byte(), rank = r.byte(), ang = r.byte() - 90, L = r.u(); out.push([ox + x * sc, oy + y * sc, kind, rank, r.str(L), ang]); } }
  CHARTV.names.set(k, out); return out;
}
// the view height (km) up to which a rank shows, and the type size per kind and rank (px)
const NAME_H = [Infinity, 140, 30, 9], NAME_PX = [[14, 12.5, 11, 10], [15, 13, 11.5, 10], [18, 14, 12, 10.5], [10, 10, 10, 9.5]];
// the names in the view, the most important first (the packs keep them in that order within a rank), each kept only where it does
// not cover one placed before (or a port's label); names0 gives the rank-0 names everywhere, the tiles the rest. Returns SVG for gStatic.
// Rank 0 (the big towns, fjords and islands of names0) is always shown (kartplotter.md): renderStatic places it first, with part 'first',
// before the harbours' labels, which keep clear of it; 'rest' is everything after them. Before, a harbour's long label (Kaldfarnes
// fiskebruk, 18 km wide at 100 km) stood first and took the island's name «Senja» off the region's chart (E4, 26.10.2026).
function chartNamesSvg(vx0, vy0, vx1, vy1, u, taken, part){
  const hh = vy1 - vy0, lv = chartLevel(hh), T = MAPD.man.tile, cand = [];
  const tiles = lv && part !== 'first' ? mapPacksIn('chart', vx0, vy0, vx1, vy1).filter(pk => pk.buf && mapVec(pk, 'names')) : [];
  const inV = (x, y) => x > vx0 && x < vx1 && y > vy0 && y < vy1, n0 = MAPD.core ? chartNamesOf(MAPD.core, 'names0', 0.01, 0, 0) : [];
  for (const q of n0) if (inV(q[0], q[1]) && (part === 'first' ? q[3] === 0 : part !== 'rest' || q[3] !== 0)) cand.push(q);
  for (const pk of tiles) for (const q of chartNamesOf(pk, 'names', 0.001, pk.tile[0] * T, pk.tile[1] * T))
    if (q[3] > 0 && q[3] < 4 && hh <= NAME_H[q[3]] && inV(q[0], q[1]) && !n0.some(o => o[4] === q[4] && Math.abs(o[0] - q[0]) + Math.abs(o[1] - q[1]) < 60)) cand.push(q);
  cand.sort((a, b) => a[3] - b[3]);
  const g = [], hit = (b) => taken.some(t => b[0] < t[2] && b[2] > t[0] && b[1] < t[3] && b[3] > t[1]);
  for (const [x, y, k, r, n, ang] of cand){
    // a town with a harbour of its name: the harbour's label stands for it, but only as close in as the harbours have labels (PLACE_Z,
    // 03-map.js); further out, with the coast's receivers named after their towns, Oslo, Bergen and Tromsø would be gone
    if (k === 0 && view.z >= PLACE_Z && PORTS.some(p => dist(p.p, {x, y}) < 3 && (p.name.startsWith(n) || n.startsWith(p.name)))) continue;
    const sz = NAME_PX[k][r] * u, w = n.length * sz * (k === 2 ? 0.72 : 0.58), town = k === 0, a = (ang || 0) * Math.PI / 180;
    // a turned name takes the box round its turned rectangle
    const hw = (Math.abs(w * Math.cos(a)) + Math.abs(sz * Math.sin(a))) / 2, hh2 = (Math.abs(w * Math.sin(a)) + Math.abs(sz * Math.cos(a))) / 2;
    const bx = town ? [x + 4 * u, y - sz * 0.8, x + 4 * u + w, y + sz * 0.25] : [x - hw, y - hh2, x + hw, y + hh2];
    if (hit(bx)) continue; taken.push(bx);
    if (town){ g.push('<circle cx="' + x.toFixed(3) + '" cy="' + y.toFixed(3) + '" r="' + (2 * u) + '" class="townpt"/>'); g.push(txt({x:x + 4.5 * u, y:y + sz * 0.3}, n, 'lbl-town' + (r < 2 ? ' big' : ''), sz, 'stroke-width="' + (2.6 * u) + '"')); }
    else g.push(txt({x, y:y + sz * 0.3}, n, k === 1 ? 'lbl-water' : k === 2 ? 'lbl-land' : 'lbl-peak', sz, 'text-anchor="middle"' + (k === 3 ? ' stroke-width="' + (2.4 * u) + '"' : '') + (ang ? ' transform="rotate(' + ang + ' ' + x.toFixed(3) + ' ' + y.toFixed(3) + ')"' : '')));
  }
  return g.join('');
}
