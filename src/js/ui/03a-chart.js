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
// the rings of a vector entry (vectors.py's lines: n, then per ring its class, point count and zigzag steps) as one Path2D, sc km per unit
function vecPath(v, sc){
  const r = vReader(v.b), n = r.u(), p = new Path2D();
  for (let k = 0; k < n; k++){ r.u(); const m = r.u(); let x = 0, y = 0; for (let j = 0; j < m; j++){ x += r.z(); y += r.z(); j ? p.lineTo(x * sc, y * sc) : p.moveTo(x * sc, y * sc); } p.closePath(); }
  return p;
}
function chartPath0(){ if (!CHARTV.p0){ const v = mapVec(MAPD.core, 'coast0'); if (v) CHARTV.p0 = vecPath(v, 0.01); } return CHARTV.p0; }
function chartPath(pk, lv){ const k = pk.file + ':' + pk.tile + ':' + lv; if (!CHARTV.paths.has(k)){ const v = mapVec(pk, lv === 2 ? 'coast2' : 'coast1'); CHARTV.paths.set(k, v ? vecPath(v, 0.001) : null); } return CHARTV.paths.get(k); }
// the coast over the painted depth: the rings stroked twice as wide and then filled (nonzero: the holes turn the other way), so the
// seams between Overture's land pieces are covered and only the shore keeps half its line, on the sea's side
function chartCoast(ctx, x0, y0, kx, ky, W, H, dpr, fish){
  const hh = H * ky, lv = chartLevel(hh), T = MAPD.man.tile, lw = 0.9 * dpr;
  const tiles = lv ? mapPacksIn('chart', x0, y0, x0 + W * kx, y0 + hh).filter(pk => pk.buf && chartPath(pk, lv)) : [];
  ctx.save(); ctx.fillStyle = fish ? '#262b23' : '#e8d7a6'; ctx.strokeStyle = fish ? '#6b755c' : '#8f7d52'; ctx.lineJoin = 'round';
  const p0 = chartPath0();
  if (p0){
    ctx.save();
    if (tiles.length){ ctx.beginPath(); ctx.rect(0, 0, W, H); for (const pk of tiles) ctx.rect((pk.tile[0] * T - x0) / kx, (pk.tile[1] * T - y0) / ky, T / kx, T / ky); ctx.clip('evenodd'); }
    ctx.setTransform(1 / kx, 0, 0, 1 / ky, -x0 / kx, -y0 / ky); ctx.lineWidth = 2 * lw * ky; ctx.stroke(p0); ctx.fill(p0); ctx.restore();
  }
  for (const pk of tiles){
    const ox = pk.tile[0] * T, oy = pk.tile[1] * T, p = chartPath(pk, lv);
    ctx.save(); ctx.beginPath(); ctx.rect((ox - x0) / kx, (oy - y0) / ky, T / kx, T / ky); ctx.clip();
    ctx.setTransform(1 / kx, 0, 0, 1 / ky, (ox - x0) / kx, (oy - y0) / ky); ctx.lineWidth = 2 * lw * ky; ctx.stroke(p); ctx.fill(p); ctx.restore();
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
// not cover one placed before (or a port's label); names0 gives the rank-0 names everywhere, the tiles the rest. Returns SVG for gStatic
function chartNamesSvg(vx0, vy0, vx1, vy1, u, taken){
  const hh = vy1 - vy0, lv = chartLevel(hh), T = MAPD.man.tile, cand = [];
  const tiles = lv ? mapPacksIn('chart', vx0, vy0, vx1, vy1).filter(pk => pk.buf && mapVec(pk, 'names')) : [];
  const inV = (x, y) => x > vx0 && x < vx1 && y > vy0 && y < vy1, n0 = MAPD.core ? chartNamesOf(MAPD.core, 'names0', 0.01, 0, 0) : [];
  for (const q of n0) if (inV(q[0], q[1])) cand.push(q);
  for (const pk of tiles) for (const q of chartNamesOf(pk, 'names', 0.001, pk.tile[0] * T, pk.tile[1] * T))
    if (q[3] > 0 && q[3] < 4 && hh <= NAME_H[q[3]] && inV(q[0], q[1]) && !n0.some(o => o[4] === q[4] && Math.abs(o[0] - q[0]) + Math.abs(o[1] - q[1]) < 60)) cand.push(q);
  cand.sort((a, b) => a[3] - b[3]);
  const g = [], hit = (b) => taken.some(t => b[0] < t[2] && b[2] > t[0] && b[1] < t[3] && b[3] > t[1]);
  for (const [x, y, k, r, n, ang] of cand){
    if (k === 0 && PORTS.some(p => dist(p.p, {x, y}) < 3 && (p.name.startsWith(n) || n.startsWith(p.name)))) continue;
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
