// ===== THE COAST AS THE TRUTH FOR LAND AND SEA (04.10.2026; the user: «Jeg vil ha bort det som er i magenta», the land is to follow
// the lines) =====
// Near the boats isLand reads the fine coast: the chart packs' coast2 (tools/map/chart.py), Overture's land joined and simplified to
// 3 m, with the breakwaters as rings of their own (class 2 outer, 3 hole). The 25 m mask is left to what looks farther and to the
// tiles without a chart pack. Each chart tile gets an index when its pack comes (coastEnsure, in a worker where one can start):
//   the tile in cells of CC m, each cell's winding numbers at its top-left corner (the land's rings and the breakwaters' counted apart,
//   the nonzero rule, so pieces that overlap stay land), and the edges that touch the cell.
// A cell without edges is wholly what its corner is. In a cell with edges a point is decided by counting the edges crossed on the
// way from the corner down the cell's left side and then across to the point, so the answer is exact to the data. The corners sit
// off the whole metres (COX, COY), where the data's points are. The index is part of the simulation's barrier (mapReadyAt), so
// nothing reads a tile's coast before it is built, and the answer never depends on what happens to be loaded.
const COAST = {CC:100, COX:0.371, COY:0.587, worker:null, id:0, wait:new Map(), ms:0, forceMain:false, last:null, built:0, soft:0};
// the index of a tile's coast2 bytes b (rings in metres from the tile's corner), for a tile of T m: self-contained, as it also runs
// in the worker. Crossing a ring's edge moving along d changes the winding by sign(e x d): moving right that is -sign(dy).
function coastBuild(b, T, CC, COX, COY){
  let at = 0; const u = () => { let v = 0, s = 1, c; do { c = b[at++]; v += (c & 127) * s; s *= 128; } while (c & 128); return v; }, zz = v => v % 2 ? -(v + 1) / 2 : v / 2;
  const n = b && b.length ? u() : 0, rings = []; let E = 0;
  for (let r = 0; r < n; r++){ const cls = u(), m = u(), p = new Int32Array(m * 2); let x = 0, y = 0; for (let j = 0; j < m; j++){ x += zz(u()); y += zz(u()); p[j * 2] = x; p[j * 2 + 1] = y; } if (m >= 3){ rings.push([cls, p]); E += m; } }
  const ed = new Int32Array(E * 4), K = new Uint8Array(E); let e = 0;
  for (const [cls, p] of rings){ const m = p.length / 2; for (let j = 0; j < m; j++){ const k = (j + 1) % m; ed[e * 4] = p[j * 2]; ed[e * 4 + 1] = p[j * 2 + 1]; ed[e * 4 + 2] = p[k * 2]; ed[e * 4 + 3] = p[k * 2 + 1]; K[e] = cls >= 2 ? 1 : 0; e++; } }
  const N = Math.round(T / CC) + 1, NN = N * N, cell = (v, o) => Math.floor((v - o) / CC) + 1;
  // the windings at the corners: per corner row, the edges that cross it, by x
  const rowX = Array.from({length:N}, () => []), wl = new Int8Array(NN), wb = new Int8Array(NN);
  for (let q = 0; q < E; q++){
    const ax = ed[q * 4], ay = ed[q * 4 + 1], bx = ed[q * 4 + 2], by = ed[q * 4 + 3]; if (ay === by) continue;
    const mn = Math.min(ay, by), mx = Math.max(ay, by), j0 = Math.max(0, Math.floor((mn - COY) / CC) + 2), j1 = Math.min(N - 1, Math.floor((mx - COY) / CC) + 1), s = by > ay ? -1 : 1;
    for (let j = j0; j <= j1; j++){ const y = COY + (j - 1) * CC; rowX[j].push(ax + (y - ay) * (bx - ax) / (by - ay), K[q] ? s * 2 : s); }
  }
  for (let j = 0; j < N; j++){
    const R = rowX[j], m = R.length / 2; if (!m) continue;
    const ord = Array.from({length:m}, (_, i) => i).sort((a, c) => R[a * 2] - R[c * 2]);
    let k = 0, l = 0, w = 0;
    for (let i = 0; i < N; i++){ const x = COX + (i - 1) * CC; while (k < m && R[ord[k] * 2] < x){ const s = R[ord[k] * 2 + 1]; if (s === 2 || s === -2) w += s / 2; else l += s; k++; } wl[j * N + i] = l; wb[j * N + i] = w; }
  }
  // the edges that touch each cell: an edge in pieces no longer than half a cell, each piece the cells of its box (a hair larger)
  const cnt = new Int32Array(NN + 1), pairs = [], last = new Int32Array(NN).fill(-1);
  for (let q = 0; q < E; q++){
    const ax = ed[q * 4], ay = ed[q * 4 + 1], bx = ed[q * 4 + 2], by = ed[q * 4 + 3], L = Math.hypot(bx - ax, by - ay), np = Math.max(1, Math.ceil(L / (CC / 2)));
    for (let t = 0; t < np; t++){
      const x0 = ax + (bx - ax) * t / np, y0 = ay + (by - ay) * t / np, x1 = ax + (bx - ax) * (t + 1) / np, y1 = ay + (by - ay) * (t + 1) / np;
      const i0 = Math.max(0, cell(Math.min(x0, x1) - 0.01, COX)), i1 = Math.min(N - 1, cell(Math.max(x0, x1) + 0.01, COX)), j0 = Math.max(0, cell(Math.min(y0, y1) - 0.01, COY)), j1 = Math.min(N - 1, cell(Math.max(y0, y1) + 0.01, COY));
      for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++){ const c = j * N + i; if (last[c] === q) continue; last[c] = q; cnt[c + 1]++; pairs.push(c, q); }
    }
  }
  for (let c = 0; c < NN; c++) cnt[c + 1] += cnt[c];
  const ce = new Int32Array(pairs.length / 2), fill = cnt.slice(0, NN);
  for (let k = 0; k < pairs.length; k += 2) ce[fill[pairs[k]]++] = pairs[k + 1];
  return {N, wl, wb, cs:cnt, ce, ed, K};
}
// land (1), breakwater (2) or sea (0) at x, y metres from the tile's corner, from its index I
function coastQuery(I, x, y){
  const N = I.N; if (!N) return 0;
  const CC = COAST.CC, i = Math.floor((x - COAST.COX) / CC) + 1, j = Math.floor((y - COAST.COY) / CC) + 1;
  if (i < 0 || j < 0 || i >= N || j >= N) return 0;
  const c = j * N + i, s0 = I.cs[c], s1 = I.cs[c + 1]; let wl = I.wl[c], wb = I.wb[c];
  if (s0 < s1){
    const x0 = COAST.COX + (i - 1) * CC, y0 = COAST.COY + (j - 1) * CC, ed = I.ed, K = I.K, ce = I.ce;
    for (let q = s0; q < s1; q++){
      const e = ce[q], o = e * 4, ax = ed[o], ay = ed[o + 1], bx = ed[o + 2], by = ed[o + 3]; let d = 0;
      if ((ax < x0) !== (bx < x0)){ const yc = ay + (x0 - ax) * (by - ay) / (bx - ax); if (yc >= y0 && yc < y) d += bx > ax ? 1 : -1; }   // down the left side
      if ((ay <= y) !== (by <= y)){ const xc = ax + (y - ay) * (bx - ax) / (by - ay); if (xc >= x0 && xc < x) d += by > ay ? -1 : 1; }   // then across
      if (d){ if (K[e]) wb += d; else wl += d; }
    }
  }
  return wl ? 1 : wb ? 2 : 0;
}
// the distance (m) from x, y to the nearest edge of the tile's coast within one cell round its own, capped at cap
function coastDistQ(I, x, y, cap){
  const N = I.N; if (!N) return cap;
  const CC = COAST.CC, i = Math.floor((x - COAST.COX) / CC) + 1, j = Math.floor((y - COAST.COY) / CC) + 1, ed = I.ed; let d2 = cap * cap;
  for (let b = Math.max(0, j - 1); b <= Math.min(N - 1, j + 1); b++) for (let a = Math.max(0, i - 1); a <= Math.min(N - 1, i + 1); a++){
    const c = b * N + a;
    for (let q = I.cs[c]; q < I.cs[c + 1]; q++){
      const o = I.ce[q] * 4, ax = ed[o], ay = ed[o + 1], dx = ed[o + 2] - ax, dy = ed[o + 3] - ay, L2 = dx * dx + dy * dy, t = L2 ? Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / L2)) : 0, ex = ax + t * dx - x, ey = ay + t * dy - y, dd = ex * ex + ey * ey;
      if (dd < d2) d2 = dd;
    }
  }
  return Math.sqrt(d2);
}
// the tile's index at p (km): null where the tile has no chart pack, or has one not indexed yet (its mask holds meanwhile, and the
// index is started: the screens draw routes over tiles nobody asked for; the simulation never gets here unindexed, as the barrier
// builds the index before the clock runs, and COAST.soft counts the times it happened)
function coastIndexAt(p, ask = true){
  const T = MAPD.man.tile, tx = Math.floor(p.x / T), ty = Math.floor(p.y / T), L = COAST.last;
  if (L && L.tx === tx && L.ty === ty) return L.I;
  const pk = MAPD.byTile.get('chart:' + tx + ':' + ty); if (!pk) return null;
  if (!pk.coast){ if (ask){ COAST.soft++; coastEnsure(pk).catch(e => console.error(e)); } return null; }
  COAST.last = {tx, ty, I:pk.coast, ox:tx * T * 1000, oy:ty * T * 1000}; return pk.coast;
}
// Whether the straight way from a to b (km) crosses the fine coast (a breakwater is 8-12 m wide, and the samples of the leg checks,
// 8-40 m apart, stepped over it): exact, edge by edge in the cells it passes, in pieces of 50 m; a crossing in a harbour pocket does
// not count (the pockets are water whatever the coast says), nor one on a tile without an index (its samples hold there)
function coastSegHit(a, b){
  const T = MAPD.man.tile, CC = COAST.CC, L = Math.hypot(b.x - a.x, b.y - a.y), np = Math.max(1, Math.ceil(L / 0.05)), seen = new Set();
  for (let t = 0; t < np; t++){
    const x0 = a.x + (b.x - a.x) * t / np, y0 = a.y + (b.y - a.y) * t / np, x1 = a.x + (b.x - a.x) * (t + 1) / np, y1 = a.y + (b.y - a.y) * (t + 1) / np;
    for (let ty = Math.floor(Math.min(y0, y1) / T); ty <= Math.floor(Math.max(y0, y1) / T); ty++) for (let tx = Math.floor(Math.min(x0, x1) / T); tx <= Math.floor(Math.max(x0, x1) / T); tx++){
      const I = coastIndexAt({x:(tx + 0.5) * T, y:(ty + 0.5) * T}); if (!I || !I.N) continue;
      const ox = tx * T * 1000, oy = ty * T * 1000, ax = x0 * 1000 - ox, ay = y0 * 1000 - oy, bx = x1 * 1000 - ox, by = y1 * 1000 - oy, N = I.N, ed = I.ed;
      const i0 = Math.max(0, Math.floor((Math.min(ax, bx) - 0.01 - COAST.COX) / CC) + 1), i1 = Math.min(N - 1, Math.floor((Math.max(ax, bx) + 0.01 - COAST.COX) / CC) + 1);
      const j0 = Math.max(0, Math.floor((Math.min(ay, by) - 0.01 - COAST.COY) / CC) + 1), j1 = Math.min(N - 1, Math.floor((Math.max(ay, by) + 0.01 - COAST.COY) / CC) + 1);
      for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++){
        const c = j * N + i;
        for (let q = I.cs[c]; q < I.cs[c + 1]; q++){
          const e = I.ce[q], key = tx * 1e9 + ty * 1e8 + e; if (seen.has(key)) continue; seen.add(key);
          const o = e * 4, px = ed[o], py = ed[o + 1], qx = ed[o + 2], qy = ed[o + 3];
          const d1 = (bx - ax) * (py - ay) - (by - ay) * (px - ax), d2 = (bx - ax) * (qy - ay) - (by - ay) * (qx - ax); if ((d1 > 0) === (d2 > 0) || d1 === d2) continue;
          const d3 = (qx - px) * (ay - py) - (qy - py) * (ax - px), d4 = (qx - px) * (by - py) - (qy - py) * (bx - px); if ((d3 > 0) === (d4 > 0)) continue;
          const s = d1 / (d1 - d2), hx = (px + (qx - px) * s + ox) / 1000, hy = (py + (qy - py) * s + oy) / 1000;
          if (!inHarbourPocket({x:hx, y:hy})) return true;
        }
      }
    }
  }
  return false;
}
// land 1, breakwater 2, sea 0 at p (km); -1 where the tile has no fine coast
function coastAt(p){ const I = coastIndexAt(p); if (!I) return -1; const L = COAST.last; return coastQuery(I, p.x * 1000 - L.ox, p.y * 1000 - L.oy); }
// the same where the tile's index is in, else -1 without asking for it (the 3D view's far ground reads 100 km round)
function coastAtIf(p){ const I = coastIndexAt(p, false); if (!I) return -1; const L = COAST.last; return coastQuery(I, p.x * 1000 - L.ox, p.y * 1000 - L.oy); }
// the signed distance (m, + on land) to the fine coast at p within cap, where the tile's index is in, else NaN without asking
function coastSdIf(p, cap){ const I = coastIndexAt(p, false); if (!I) return NaN; const L = COAST.last, x = p.x * 1000 - L.ox, y = p.y * 1000 - L.oy, d = coastDistQ(I, x, y, cap); return coastQuery(I, x, y) ? d : -d; }
// metres to the fine coast at p, capped at cap (100 m reaches; more is cap); -1 where the tile has no fine coast
function coastDistM(p, cap){ const I = coastIndexAt(p); if (!I) return -1; const L = COAST.last; return coastDistQ(I, p.x * 1000 - L.ox, p.y * 1000 - L.oy, cap || 100); }
// a chart pack loaded and its coast indexed (once); the promise is kept on the pack
function coastWorker(){
  if (COAST.worker !== null) return COAST.worker;
  try {
    const src = coastBuild.toString() + '\nonmessage = e => { const D = e.data; try { const r = coastBuild(D.b, D.T, D.CC, D.COX, D.COY); postMessage({id:D.id, r}, [r.wl.buffer, r.wb.buffer, r.cs.buffer, r.ce.buffer, r.ed.buffer, r.K.buffer]); } catch (err){ postMessage({id:D.id, err:String(err)}); } };';
    const w = new Worker(URL.createObjectURL(new Blob([src], {type:'text/javascript'})));
    w.onmessage = e => { const {id, r, err} = e.data, q = COAST.wait.get(id); COAST.wait.delete(id); if (!q) return; if (err){ console.error('coast: ' + err); q.res(coastBuildHere(q.pk)); return; } COAST.ms += performance.now() - q.t0; q.res(coastDone(q.pk, r)); };
    w.onerror = () => { COAST.worker = false; for (const [id, q] of COAST.wait){ COAST.wait.delete(id); q.res(coastBuildHere(q.pk)); } };
    return COAST.worker = w;
  } catch (e){ return COAST.worker = false; }
}
function coastDone(pk, r){ pk.coast = r; COAST.built++; COAST.last = null; marksAdd(pk); return pk; }   // and its sea marks (01e-marks.js)
function coastBuildHere(pk){ const t0 = performance.now(), v = mapVec(pk, 'coast2'); const r = coastBuild(v ? v.b : null, MAPD.man.tile * 1000, COAST.CC, COAST.COX, COAST.COY); COAST.ms += performance.now() - t0; return coastDone(pk, r); }
function coastEnsure(pk){
  if (pk.coast) return Promise.resolve(pk);
  if (!pk.coastQ) pk.coastQ = mapLoad(pk).then(() => {
    if (pk.coast) return pk;
    const v = mapVec(pk, 'coast2'), w = COAST.forceMain || !v ? false : coastWorker();
    if (!w) return coastBuildHere(pk);
    return new Promise(res => { const id = ++COAST.id; COAST.wait.set(id, {pk, res, t0:performance.now()}); const b = v.b.slice(); w.postMessage({id, b, T:MAPD.man.tile * 1000, CC:COAST.CC, COX:COAST.COX, COY:COAST.COY}, [b.buffer]); });
  }).catch(e => { pk.coastQ = null; throw e; });
  return pk.coastQ;
}
