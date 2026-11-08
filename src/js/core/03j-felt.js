// The fish on the fishing grounds as the good spots stand in the sea (Ø14 F2 of docs/planer/fangstfelt.md, 08.11.2026). Jonas 07.11.2026:
// «vi må være forsiktig med å definere en fast boks eller sirkel der det står mer fisk bare fordi det er et fiskefelt. Ja det skal være
// mye fisk på feltene men vi må løse dette på en intuitiv måte.» So no fixed weight over an area: on a fishing ground of Fiskeridirektoratet
// (felt.json, k = f) that has the species in the month (V2 A: the species and months the fishermen gave; a ground without species: the
// jig's species all the year), the good spots (hotspot in 03-simulation.js, n towards 1) are lifted by the ground's pull for the period,
// a number between 0 and FELTW.max drawn anew every FELTW.T hours for each ground and faded over as the spots themselves are. The lift
// lies within the ground's own shape (feltShape, Ø14 F1), soft at the edge (FELTW.edge km either side of the outline), and only where the
// depth suits the species (depthFactor). The location keeps the fish it had: the density is divided by the mean of the expected lift over
// the location's sea (feltWl), so fkAvail and the calibration between the places stand and the fish only move within the location. The
// fleet follows the fish: trkCell (03g-trykk.js) lays both the pressure and the fish of a 2 km cell by the cell's mean lift (feltCellW),
// so the share taken is the same on and off the ground and the baseline is neutral. Senja's six grounds (GROUNDS) are as all the others
// (Jonas 08.11.2026: «Senja sine felt skal fungere akkurat likt som alle de andre fiskefeltene i landet og ikke være en fast sirkel»).
//
//  feltAt(p)               the grounds whose shape reaches p, with their masks there (0-1): {F:[ground], m:[mask]}, or null; once per
//                          point in denPlace (q.fl)
//  feltLiftP(sp, q, H, T)  Π (1 - pull × mask × season × depth) over the grounds at the point: hotspot's n becomes 1 - P (1 - n)
//  feltWl(c, sp, T)        the location's mean expected lift for the species at the hour (between the months), which density divides by
//  feltCellW(c, s, T)      a 2 km cell's mean lift against its location's (no depth: the fleet's tables know no depth), for trkCell
//  feltWlOf(l, sp, m)      the same mean for a location and month (0-11), for the tests
//
// Everything is a pure function of the shared clock and the data in the app (felt.json, felt-s.b64, the core's far layers), the same for
// every player whatever is loaded. The shapes come early in the boot (dataEarly in ui/11-boot.js); until they are in (or for good when
// they did not come, or for the 30 small grounds without a shape) a ground is the circle of its own area round its point.
const FELTW = {T:120, max:0.6, edge:0.5, st:0.25, nd:9,
  // hotspot's n over the coast (a1 = E[n], a2 = E[n²], measured over 200 000 points and hours, 08.11.2026) and the pull's second moment
  // over a period (two uniform draws faded by sstep: E[w²] = 0.3119 max²), for the expected lift in closed form
  a1:0.4998, a2:0.2958, w2:0.3119,
  jig:['torsk', 'sei', 'hyse', 'lyr'],   // a ground without species (V2 A): the species of the jig
  on:true, key:-1, gen:0, G:null, idx:null, sp:null, B:new Map(), L:new Map()};
// the grounds' geometry: the bounding box, the rings (or the circle of the ground's area), and the months per species
function feltGeo(){
  const D = typeof feltData === 'function' && feltData(); if (!D) return null;
  // (the shapes are decoded the first time one is asked for: until then, and for good when they did not come, the circles)
  if (FELT.S === null && D.length) feltShape(D[0]);
  const key = FELT.S === null ? 0 : FELT.S === false ? 1 : 2;
  if (FELTW.G && FELTW.key === key) return FELTW.G;
  FELTW.key = key; FELTW.B.clear(); FELTW.L.clear(); FELTW.gen++;
  const G = [], idx = new Map(), e = FELTW.edge, spAll = new Set(FELTW.jig);
  for (const f of D){ if (f.k !== 'f') continue;
    const R = key === 2 ? feltShape(f) : null, g = {f, R:R && R.length ? R : null, cx:f.x, cy:f.y, rad:Math.max(0.2, f.r / Math.sqrt(Math.PI)), sm:{}, ph:h2(f.i, 5199)};
    if (g.R){ let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const r of g.R) for (let i = 0; i < r.length; i += 2){ x0 = Math.min(x0, r[i]); x1 = Math.max(x1, r[i]); y0 = Math.min(y0, r[i + 1]); y1 = Math.max(y1, r[i + 1]); } g.b = [x0, y0, x1, y1]; }
    else g.b = [f.x - g.rad, f.y - g.rad, f.x + g.rad, f.y + g.rad];
    if (f.l.length){ for (const q of f.l) if (SPECIES[q[0]]){ g.sm[q[0]] = (g.sm[q[0]] || 0) | q[2]; spAll.add(q[0]); } }
    else for (const sp of FELTW.jig) g.sm[sp] = 4095;
    G.push(g);
    for (let gy = Math.floor((g.b[1] - e) / 10); gy <= Math.floor((g.b[3] + e) / 10); gy++) for (let gx = Math.floor((g.b[0] - e) / 10); gx <= Math.floor((g.b[2] + e) / 10); gx++){
      const k = gridKey(gx, gy); let a = idx.get(k); if (!a) idx.set(k, a = []); a.push(g); }
  }
  FELTW.idx = idx; FELTW.sp = ALLSP.filter(sp => spAll.has(sp)); FELTW.si = Object.fromEntries(FELTW.sp.map((sp, i) => [sp, i]));
  // per ground its species as indices into FELTW.sp with the month bits, for the location's means
  for (const g of G) g.sl = FELTW.sp.map((sp, s) => [s, g.sm[sp] || 0]).filter(q => q[1]);
  return FELTW.G = G;
}
// signed distance (km) from the ground's outline: positive inside (the rings by the even-odd rule), negative outside
function feltSd(g, x, y){
  if (!g.R) return g.rad - Math.hypot(x - g.cx, y - g.cy);
  let ins = false, d2 = Infinity;
  for (const r of g.R) for (let i = 0, j = r.length - 2; i < r.length; j = i, i += 2){
    const xi = r[i], yi = r[i + 1], xj = r[j], yj = r[j + 1];
    if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) ins = !ins;
    const dx = xj - xi, dy = yj - yi, L = dx * dx + dy * dy, t = L > 0 ? clamp(((x - xi) * dx + (y - yi) * dy) / L, 0, 1) : 0, ex = xi + t * dx - x, ey = yi + t * dy - y, q = ex * ex + ey * ey;
    if (q < d2) d2 = q;
  }
  const d = Math.sqrt(d2); return ins ? d : -d;
}
// the masks on a 2 km block (the stock's cells), on nodes FELTW.st apart: per ground that reaches it, nd × nd values (null: 1 all over)
const FELT_NONE = {F:[], M:[], mean:[]};
function feltBlock(ix, iy){
  const k = gridKey(ix, iy); let b = FELTW.B.get(k); if (b) return b;
  if (!feltGeo()){ return FELT_NONE; }
  const e = FELTW.edge, x0 = ix * 2, y0 = iy * 2, nd = FELTW.nd, st = FELTW.st, a = FELTW.idx.get(gridKey(Math.floor(x0 / 10), Math.floor(y0 / 10)));
  const F = [], M = [], mean = [];
  if (a) for (const g of a){
    if (g.b[0] > x0 + 2 + e || g.b[2] < x0 - e || g.b[1] > y0 + 2 + e || g.b[3] < y0 - e) continue;
    const sc = feltSd(g, x0 + 1, y0 + 1);
    if (sc >= e + 1.42){ F.push(g); M.push(null); mean.push(1); continue; }
    if (sc <= -(e + 1.42)) continue;
    const m = new Float32Array(nd * nd); let s = 0;
    if (!g.R){ for (let j = 0; j < nd; j++) for (let i = 0; i < nd; i++){ const v = sstep(-e, e, feltSd(g, x0 + i * st, y0 + j * st)); m[j * nd + i] = v; s += v; } }
    else {
      // the segments that can lie within the soft edge of a node (within e + 1.42 km of the block's middle), for the distances; the
      // inside test still goes over the whole outline (a cheap crossing test)
      const cx = x0 + 1, cy = y0 + 1, R2 = (e + 1.45) ** 2, near = [];
      for (const r of g.R) for (let i = 0, j = r.length - 2; i < r.length; j = i, i += 2){ const xi = r[i], yi = r[i + 1], xj = r[j], yj = r[j + 1], dx = xj - xi, dy = yj - yi, L = dx * dx + dy * dy;
        const t = L > 0 ? clamp(((cx - xi) * dx + (cy - yi) * dy) / L, 0, 1) : 0, ex = xi + t * dx - cx, ey = yi + t * dy - cy; if (ex * ex + ey * ey <= R2) near.push(xi, yi, xj, yj); }
      for (let jj = 0; jj < nd; jj++) for (let ii = 0; ii < nd; ii++){ const x = x0 + ii * st, y = y0 + jj * st; let ins = false, d2 = e * e;
        for (const r of g.R) for (let i = 0, j = r.length - 2; i < r.length; j = i, i += 2){ const yi = r[i + 1], yj = r[j + 1]; if ((yi > y) !== (yj > y) && x < (r[j] - r[i]) * (y - yi) / (yj - yi) + r[i]) ins = !ins; }
        for (let k = 0; k < near.length; k += 4){ const xi = near[k], yi = near[k + 1], dx = near[k + 2] - xi, dy = near[k + 3] - yi, L = dx * dx + dy * dy, t = L > 0 ? clamp(((x - xi) * dx + (y - yi) * dy) / L, 0, 1) : 0, ex = xi + t * dx - x, ey = yi + t * dy - y, q = ex * ex + ey * ey; if (q < d2) d2 = q; }
        const d = Math.sqrt(d2), v = sstep(-e, e, ins ? d : -d); m[jj * nd + ii] = v; s += v; } }
    if (s <= 0) continue; F.push(g); M.push(m); mean.push(s / (nd * nd));
  }
  b = F.length ? {F, M, mean} : FELT_NONE;
  if (FELTW.B.size > 60000) FELTW.B.clear();
  FELTW.B.set(k, b); return b;
}
// the grounds at a point and their masks (bilinear between the block's nodes), or null where there are none
function feltAt(p){
  if (!FELTW.on) return null;
  // (until the shapes are in, or known not to come, ask each time, so the circles give way to them at once and not at a block's miss)
  if (FELTW.key < 1) feltGeo();
  const ix = Math.floor(p.x / 2), iy = Math.floor(p.y / 2), b = feltBlock(ix, iy); if (!b.F.length) return null;
  const nd = FELTW.nd, gx = (p.x - ix * 2) / FELTW.st, gy = (p.y - iy * 2) / FELTW.st, i = Math.min(nd - 2, Math.floor(gx)), j = Math.min(nd - 2, Math.floor(gy)), fx = gx - i, fy = gy - j;
  const F = [], m = [];
  for (let n = 0; n < b.F.length; n++){ const M = b.M[n]; let v = 1;
    if (M){ const o = j * nd + i; v = (M[o] * (1 - fx) + M[o + 1] * fx) * (1 - fy) + (M[o + nd] * (1 - fx) + M[o + nd + 1] * fx) * fy; }
    if (v > 0){ F.push(b.F[n]); m.push(v); } }
  return F.length ? {F, m} : null;
}
// the ground's pull at an hour: a fresh draw every FELTW.T hours (from the ground's own phase), faded over the period as hotspot fades
function feltPull(g, H){
  const t = H / FELTW.T + g.ph, k = Math.floor(t), u = sstep(0, 1, t - k);
  return FELTW.max * (h2(g.f.i, 5200 + k) * (1 - u) + h2(g.f.i, 5201 + k) * u);
}
// how much of the species' month the ground has (between the mid-months, as the season tables are read)
const feltSeason = (g, sp, fk) => { const b = g.sm[sp]; return b ? ((b >> fk.i0) & 1) * (1 - fk.f) + ((b >> fk.i1) & 1) * fk.f : 0; };
// how well the depth suits the species (0-1): depthFactor without its floor
const feltDepth = (sp, d) => (depthFactor(sp, d) - 0.3) / 0.7;
function feltLiftP(sp, q, H, T){
  const fl = q.fl; if (!fl || q.c.l < 0) return 1;
  let P = 1, dp = -1;
  for (let i = 0; i < fl.F.length; i++){ const g = fl.F[i], s = feltSeason(g, sp, T.fk); if (s <= 0) continue;
    if (dp < 0) dp = feltDepth(sp, q.d); P *= 1 - feltPull(g, H) * fl.m[i] * s * dp; }
  return P;
}
// the expected lift where the grounds give c = mask × season × depth each: E[hotspot with n' = 1 - P (1 - n)] / E[hotspot], with P the
// product over the grounds of (1 - pull × c) and the pulls independent of each other and of n (EP = E[P], EP2 = E[P²])
function feltG(EP, EP2){ const a1 = FELTW.a1, a2 = FELTW.a2; return (0.3 + 1.5 * (1 - 2 * EP * (1 - a1) + EP2 * (1 - 2 * a1 + a2))) / (0.3 + 1.5 * a2); }
// The location's means, once per location (lazily, a few ms): over its 2 km cells (those lokOfCell puts in it), on 1 km points, and
// on 0.5 km points in the cells a ground reaches, from the core's far layers only (isLandFar, offDepth, expoFar: always loaded, so the
// same for everyone): w, the mean of the expected lift weighted by what the place gives the species (exposure, the slope and the depth, as
// denSp), and
// wc, the cells' plain mean of the lift without depth, for the fleet's tables. Per species × month; {} where no ground reaches.
function feltLoc(l){
  let r = FELTW.L.get(l); if (r) return r;
  r = {w:{}, wc:{}, cw:new Map(), wt:[], ot:[]};
  const G = feltGeo(); if (!G || l < 0 || !RU.ok){ FELTW.L.set(l, r); return r; }
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (const P of RU.lok[l].P) for (const rg of P.rings) for (let i = 0; i < rg.length; i += 2){ x0 = Math.min(x0, rg[i]); x1 = Math.max(x1, rg[i]); y0 = Math.min(y0, rg[i + 1]); y1 = Math.max(y1, rg[i + 1]); }
  let near = false; for (let gy = Math.floor((y0 - 1) / 10); gy <= Math.floor((y1 + 1) / 10) && !near; gy++) for (let gx = Math.floor((x0 - 1) / 10); gx <= Math.floor((x1 + 1) / 10); gx++) if (FELTW.idx.has(gridKey(gx, gy))){ near = true; break; }
  if (!near){ FELTW.L.set(l, r); return r; }
  const SP = FELTW.sp, NS = SP.length, mu1 = FELTW.max / 2, mu2 = FELTW.w2 * FELTW.max * FELTW.max;
  const SB = new Float64Array(NS * 12), SG = new Float64Array(NS * 12), CG = new Float64Array(NS * 12); let nc = 0;
  // the cod's weight follows the skrei spots in the skrei months (fkAvail is affine in q.skr): av = A + B × skreiSpot, probed per month at
  // mid-month in the location's middle cell, so the mean is taken where the cod stands then, not where it stands in summer
  const kS = SP.indexOf('torsk'), A = new Float64Array(12).fill(1), Bk = new Float64Array(12);
  if (kS >= 0){ let cm = null, bd = 1e9; const mx = (x0 + x1) / 2, my = (y0 + y1) / 2;
    for (let iy = Math.floor(y0 / 2); iy <= Math.floor(y1 / 2); iy++) for (let ix = Math.floor(x0 / 2); ix <= Math.floor(x1 / 2); ix++){ const dd = Math.hypot(ix * 2 + 1 - mx, iy * 2 + 1 - my); if (dd < bd){ const c = lokOfCell({x:ix * 2 + 1, y:iy * 2 + 1}); if (c.l === l){ bd = dd; cm = c; } } }
    if (cm) for (let m = 0; m < 12; m++){ const H = (Date.UTC(2027, m, 15, 12) - EPOCH) / 3.6e6, T = {H, fk:fkMonth(H), skf:{}}; T.torsk = {av:seasonal(SPECIES.torsk.av, H), sf:1};
      const q = {p:{x:cm.cx, y:cm.cy}, d:100, E:0.6, c:cm}; let a0 = 1, a1 = 1;
      try { q.skr = 0; a0 = fkAvail('torsk', q, T); q.skr = 1; a1 = fkAvail('torsk', q, T); } catch (e){}
      if (a0 > 0 || a1 > 0){ A[m] = a0; Bk[m] = a1 - a0; } } }
  const EP = new Float64Array(NS * 12), EP2 = new Float64Array(NS * 12), cB = new Float64Array(NS), dps = new Float64Array(NS);
  const pt = {x:0, y:0};
  for (let iy = Math.floor(y0 / 2); iy <= Math.floor(y1 / 2); iy++) for (let ix = Math.floor(x0 / 2); ix <= Math.floor(x1 / 2); ix++){
    const c = lokOfCell({x:ix * 2 + 1, y:iy * 2 + 1}); if (c.l !== l) continue;
    nc++; const b = feltBlock(ix, iy), has = b.F.length > 0;
    // the cell's own lift without depth (feltCellW)
    if (has){ EP.fill(1); EP2.fill(1);
      for (let n = 0; n < b.F.length; n++){ const g = b.F[n], cc = b.mean[n], e1 = 1 - cc * mu1, e2 = 1 - 2 * cc * mu1 + cc * cc * mu2;
        for (const [s, bits] of g.sl) for (let m = 0; m < 12; m++) if ((bits >> m) & 1){ const o = s * 12 + m; EP[o] *= e1; EP2[o] *= e2; } }
      const cw = new Float32Array(NS * 12); for (let o = 0; o < NS * 12; o++){ cw[o] = feltG(EP[o], EP2[o]); CG[o] += cw[o] - 1; } r.cw.set(gridKey(ix, iy), cw); }
    // the points
    const k = has ? 4 : 2, st = 2 / k, a = st * st, fj = kS >= 0 ? (insideFjord({x:ix * 2 + 1, y:iy * 2 + 1}) ? 0.35 : 1) : 1;
    for (let j = 0; j < k; j++) for (let i = 0; i < k; i++){
      pt.x = ix * 2 + (i + 0.5) * st; pt.y = iy * 2 + (j + 0.5) * st;
      if (isLandFar(pt)) continue;
      const d = offDepth(pt), E = 0.2 + 0.8 * expoFar(pt) / 255, ed = 0.6 + 0.4 * sstep(1.5, 12, Math.hypot(offDepth({x:pt.x + 0.1, y:pt.y}) - offDepth({x:pt.x - 0.1, y:pt.y}), offDepth({x:pt.x, y:pt.y + 0.1}) - offDepth({x:pt.x, y:pt.y - 0.1})) / 2);
      for (let s = 0; s < NS; s++){ const S_ = SPECIES[SP[s]]; cB[s] = a * (S_.prod + (1 - S_.prod) * E) * ed * depthFactor(SP[s], d); }
      const skr = kS >= 0 ? sstep(0.15, 0.6, E) * sstep(30, 60, d) * (1 - sstep(220, 320, d)) * fj : 0;   // skreiSpot, with the fjord read once per cell
      // (SB and SG get the plain weight here, and SG the lift's excess where a ground is)
      for (let s = 0; s < NS; s++){ const o = s * 12; for (let m = 0; m < 12; m++){ const v = s === kS ? cB[s] * (A[m] + Bk[m] * skr) : cB[s]; SB[o + m] += v; SG[o + m] += v; } }
      const fl = has ? feltAt(pt) : null; if (!fl) continue;
      for (let s = 0; s < NS; s++) dps[s] = -1;
      let touched = 0; EP.fill(1); EP2.fill(1);
      for (let n = 0; n < fl.F.length; n++){ const g = fl.F[n], mk = fl.m[n];
        for (const [s, bits] of g.sl){ if (dps[s] < 0) dps[s] = feltDepth(SP[s], d); const cc = mk * dps[s]; if (cc <= 0) continue; touched |= 1 << s;
          const e1 = 1 - cc * mu1, e2 = 1 - 2 * cc * mu1 + cc * cc * mu2; for (let m = 0; m < 12; m++) if ((bits >> m) & 1){ const o = s * 12 + m; EP[o] *= e1; EP2[o] *= e2; } } }
      for (let s = 0; s < NS; s++) if ((touched >> s) & 1) for (let m = 0; m < 12; m++){ const o = s * 12 + m; if (EP[o] < 1) SG[o] += (s === kS ? cB[s] * (A[m] + Bk[m] * skr) : cB[s]) * (feltG(EP[o], EP2[o]) - 1); }
    }
  }
  for (let s = 0; s < NS; s++){ const w = new Float64Array(12), wc = new Float64Array(12); let any = false;
    for (let m = 0; m < 12; m++){ const o = s * 12 + m; w[m] = SB[o] > 0 ? SG[o] / SB[o] : 1; wc[m] = nc ? 1 + CG[o] / nc : 1; if (w[m] !== 1 || wc[m] !== 1) any = true; }
    if (any){ r.w[SP[s]] = w; r.wc[SP[s]] = wc; } }
  r.nc = nc;
  r.wt = TRK_SP.map(sp => r.wc[sp] || null); r.ot = TRK_SP.map(sp => (FELTW.si[sp] === undefined ? 0 : FELTW.si[sp]) * 12);
  if (FELTW.L.size > 2000) FELTW.L.clear();
  FELTW.L.set(l, r); return r;
}
function feltWlOf(l, sp, m){ const w = feltLoc(l).w[sp]; return w ? w[m] : 1; }
function feltWl(c, sp, T){
  if (!FELTW.on || c.l < 0) return 1;
  if (c.fwG !== FELTW.gen || !c.fw){ if (!feltGeo()) return 1; feltCellOf(c); }
  const w = c.fw.w[sp]; if (!w) return 1; const fk = T.fk; return w[fk.i0] * (1 - fk.f) + w[fk.i1] * fk.f;
}
// (the location's record and the cell's own lift kept on the cell object of lokOfCell)
function feltCellOf(c){ c.fw = feltLoc(c.l); c.fwG = FELTW.gen; c.fcw = c.fw.cw.get(gridKey(Math.floor(c.cx / 2), Math.floor(c.cy / 2))) || null; }
// a 2 km cell's lift against its location's mean for trkCell (s: the index in TRK_SP, M: trkMonth's month weights); 1 off the grounds' locations
function feltCellW(c, s, M){
  if (!FELTW.on || c.l < 0) return 1;
  if (c.fwG !== FELTW.gen || !c.fw){ if (!feltGeo()) return 1; feltCellOf(c); }
  const wc = c.fw.wt[s]; if (!wc) return 1;
  const cw = c.fcw, o = c.fw.ot[s], g0 = cw ? cw[o + M.i0] : 1, g1 = cw ? cw[o + M.i1] : 1;
  return (g0 * (1 - M.f) + g1 * M.f) / (wc[M.i0] * (1 - M.f) + wc[M.i1] * M.f);
}
