// ===== MAP DATA (phase K3 of the coast plan): the rasters in 10 km blocks, fetched in packs from map/ =====
// map/manifest.json lists the layers and the packs (tools/mappack.mjs writes them at build). A pack is fetched once and kept in
// IndexedDB by its hash, so a new publish (which moves every file to a new address) fetches only what changed. A block is unpacked
// (fflate, synchronous) the first time it is read and kept while there is room (MAPD.budget; the least recently used goes first).
//   core  land200, dc200, expo, deep   the national core, always loaded (3.6 MB for the whole coast, phase K6): land at 200 m, the
//                         distance to it, the openness, and the sea floor offshore on 1 km cells (tools/map/deep.py, 07.10.2026). What looks far (the fetch rays, the local fleet's drift and fishing, the
//                         depth model) reads only these, and so does everything off the tiles that have detail.
//   sim   mask, dc, depth the tiles' detail (land 25 m, distance 100 m, depth 50 m): loaded round the boats and the gear in the
//                         sea before the clock runs (mapReadyAt, simAreaReady), within
//                         MAPD.simR, which covers the instruments round a boat (sounder, sonar, plotter); reading a block whose pack
//                         is not in is an error, never a stand-in value. A view that reads farther (the chart, the 3D shore) asks
//                         first (mapViewReady) and draws without the depth until the pack comes.
//   view  hgt, forest     for the 3D view, as they come round the boat (view3d.js stream3d; mapViewIn first)
//   far   far             the ground at 200 m for the 3D view's far terrain, on the coast's 191 tiles with land (phase K8)
//   chart coast1, coast2, names   the chart's vectors per tile (tools/map/chart.py; the core has coast0 and names0 for the whole
//                         country): entries with a count as a sixth field, read with mapVec (ui/03a-chart.js draws them). Loaded
//                         round the boats too: coast2 is the truth for land and sea there (01d-coast.js), indexed as it comes
// The layers are in the national frame (phase K4): a layer's cell (ix, iy) of size c covers x in [ix c, (ix + 1) c) km, the cells are
// numbered from the frame's origin, and a layer has cells from (ix0, iy0) for nx by ny; blocks (bx, by) of n cells and tiles of
// 50 km line up with the frame, so the packs of the whole coast fit together.
const MAPD = {man:null, L:{}, packs:[], byTile:new Map(), core:null, blk:new Map(), bytes:0, budget:96e6, simR:4, base:'map/', db:undefined, miss:0, fetched:0, cached:0};
function mapOnReady(f){ if (typeof document === 'undefined' || document.readyState !== 'loading') f(); else document.addEventListener('DOMContentLoaded', f); }
// ---------- IndexedDB, by content ----------
function mapIdb(){
  if (MAPD.db !== undefined) return Promise.resolve(MAPD.db);
  return new Promise(res => { try { const q = indexedDB.open('kyst-map', 1); q.onupgradeneeded = () => q.result.createObjectStore('f'); q.onsuccess = () => res(MAPD.db = q.result); q.onerror = () => res(MAPD.db = null); } catch (e){ res(MAPD.db = null); } });
}
function idbDo(mode, f){ return mapIdb().then(db => db && new Promise(res => { try { const tx = db.transaction('f', mode), q = f(tx.objectStore('f')); tx.oncomplete = () => res(q && q.result); tx.onerror = tx.onabort = () => res(null); } catch (e){ res(null); } })); }
async function mapFetch(pk){
  const kept = await idbDo('readonly', s => s.get(pk.hash));
  if (kept && kept.byteLength === pk.bytes){ MAPD.cached++; return new Uint8Array(kept); }
  const r = await fetch(MAPD.base + pk.file); if (!r.ok) throw new Error('map: ' + pk.file + ' ' + r.status);
  const buf = await r.arrayBuffer(); MAPD.fetched++;
  idbDo('readwrite', s => s.put(buf, pk.hash));
  return new Uint8Array(buf);
}
// ---------- the manifest and the packs ----------
async function mapStart(base){
  if (base) MAPD.base = base;
  const man = MAPD.man = await (await fetch(MAPD.base + 'manifest.json', {cache:'no-cache'})).json();
  let id = 0;
  // k: what a cell's number is worth; the heights are kept as Int16 decimetres (phase K8), half the room of Float32
  for (const name in man.layers) MAPD.L[name] = Object.assign({name, id:id++, bx:NaN, by:NaN, b:null, k:man.layers[name].dec === 'hgt' ? 0.1 : man.layers[name].dec === 'x10' ? 10 : 1}, man.layers[name]);
  const dc = MAPD.L.dc; Object.assign(DC, {nx:dc.nx, ny:dc.ny, ix0:dc.ix0, iy0:dc.iy0});
  // a joined pack (tools/map/game.py: the far heights and the chart, several tiles a file) is filed under each of its tiles as a
  // pack of its own that loads through it
  for (const pk of man.packs){
    pk.buf = null; pk.idx = null; pk.load = null; MAPD.packs.push(pk);
    if (pk.kind === 'core'){ MAPD.core = pk; continue; }
    for (const t of pk.tiles || [pk.tile]) MAPD.byTile.set(pk.kind + ':' + t[0] + ':' + t[1], pk.tiles ? {file:pk.file, hash:pk.hash, kind:pk.kind, tile:t, bytes:pk.bytes, of:pk, buf:null, idx:null, load:null} : pk);
  }
  return man;
}
function mapLoad(pk){
  if (!pk || pk.buf) return Promise.resolve(pk);
  if (pk.of){ if (!pk.load) pk.load = mapLoad(pk.of).then(p => { pk.idx = p.idx; pk.vec = {}; pk.buf = p.buf; return pk; }, e => { pk.load = null; throw e; }); return pk.load; }
  if (!pk.load) pk.load = mapFetch(pk).then(b => {
    if (String.fromCharCode(b[0], b[1], b[2], b[3]) !== 'KMP1') throw new Error('map: ' + pk.file + ' is not a map pack');
    const hl = b[4] | b[5] << 8 | b[6] << 16 | b[7] << 24, head = JSON.parse(new TextDecoder().decode(b.subarray(8, 8 + hl))), at = 8 + hl;
    pk.idx = new Map(head.blocks.map(e => [e[0] + ':' + e[1] + ':' + e[2], [at + e[3], e[4], e[5]]])); pk.vec = {}; pk.buf = b; return pk;
  }).catch(e => { pk.load = null; throw e; });
  return pk.load;
}
// the pack that holds a layer's block, and the packs over a box of km (kinds: 'core', 'sim', 'view')
function mapPackOf(L, bx, by){ if (L.kind === 'core') return MAPD.core; const bk = Math.round(L.n * L.c), T = MAPD.man.tile; return MAPD.byTile.get(L.kind + ':' + Math.floor(bx * bk / T) + ':' + Math.floor(by * bk / T)) || null; }
function mapPacksIn(kind, x0, y0, x1, y1){
  if (kind === 'core') return MAPD.core ? [MAPD.core] : [];
  const T = MAPD.man.tile, out = [];
  for (let ty = Math.floor(y0 / T); ty <= Math.floor(y1 / T); ty++) for (let tx = Math.floor(x0 / T); tx <= Math.floor(x1 / T); tx++){ const pk = MAPD.byTile.get(kind + ':' + tx + ':' + ty); if (pk) out.push(pk); }
  return out;
}
// what the simulation needs at p (game km) within r km: core, sim, and the chart packs with their coast indexed (01d-coast.js: the
// fine coast is the truth for land and sea since 04.10.2026)
function mapSimPacks(p, r){ return mapPacksIn('core', 0, 0, 0, 0).concat(mapPacksIn('sim', p.x - r, p.y - r, p.x + r, p.y + r), mapPacksIn('chart', p.x - r, p.y - r, p.x + r, p.y + r)); }
function mapReadyAt(p, r){ for (const pk of mapSimPacks(p, r)) if (!pk.buf || (pk.kind === 'chart' && !pk.coast)) return false; return true; }
// whether p's tile has detail (a sim pack): if not, the readers take the national core there
function mapSimAt(p){ const T = MAPD.man.tile; return MAPD.byTile.has('sim:' + Math.floor(p.x / T) + ':' + Math.floor(p.y / T)); }
function mapViewAt(p){ const T = MAPD.man.tile; return MAPD.byTile.has('view:' + Math.floor(p.x / T) + ':' + Math.floor(p.y / T)); }
// whether p's tile has the view's ground (or the far heights) and it is in: the 3D view draws a stand-in until it is
let MVI = {k:'', v:false}, MFI = {k:'', v:false};
function mapKindIn(kind, p, memo){ const T = MAPD.man.tile, k = kind + ':' + Math.floor(p.x / T) + ':' + Math.floor(p.y / T); if (memo.k === k && memo.v) return true; const pk = MAPD.byTile.get(k); memo.k = k; memo.v = !!(pk && pk.buf); return memo.v; }
const mapViewIn = p => mapKindIn('view', p, MVI), mapFarIn = p => mapKindIn('far', p, MFI);
function mapNeed(p, r){ return Promise.all(mapSimPacks(p, r).map(pk => pk.kind === 'chart' ? coastEnsure(pk) : mapLoad(pk))); }
function mapLoadKind(kind){ return Promise.all(MAPD.packs.filter(pk => pk.kind === kind).map(mapLoad)); }
// ---------- blocks ----------
function med16(raw, n){
  const N = n * n, q = new Int32Array(N);
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++){ const i = r * n + c, z = raw[i] | (raw[N + i] << 8), a = c ? q[i - 1] : 0, b = r ? q[i - n] : 0, cc = r && c ? q[i - n - 1] : 0, pr = cc >= Math.max(a, b) ? Math.min(a, b) : cc <= Math.min(a, b) ? Math.max(a, b) : a + b - cc; q[i] = pr + ((z >>> 1) ^ -(z & 1)); }
  return q;
}
function mapDecode(L, raw){
  const n = L.n, N = n * n;
  if (L.type === 'u8') return raw;
  if (L.type === 'f32') return new Float32Array(raw.byteOffset % 4 ? raw.slice().buffer : raw.buffer, raw.byteOffset % 4 ? 0 : raw.byteOffset, N);
  const q = med16(raw, n);
  // depth in half metres; the ground's height in half metres to 10 m and then 2 m steps (the page's own packing of hgt), kept as
  // Int16 decimetres (L.k = 0.1)
  if (L.dec === 'half'){ const out = new Float32Array(N); for (let i = 0; i < N; i++) out[i] = q[i] / 2; return out; }
  const out = new Int16Array(N); for (let i = 0; i < N; i++){ const a = Math.abs(q[i]); out[i] = Math.sign(q[i]) * (a < 20 ? a * 5 : 100 + (a - 20) * 20); }
  return out;
}
function mapBlock(L, bx, by){
  const k = gridKey(bx, by) * 16 + L.id; let a = MAPD.blk.get(k);   // room for 16 layers (there are 10 with 'deep')
  if (a){ MAPD.blk.delete(k); MAPD.blk.set(k, a); return a; }
  const pk = mapPackOf(L, bx, by), e = pk && pk.idx && pk.idx.get(L.name + ':' + bx + ':' + by);
  if (!pk || !pk.buf || !e){ MAPD.miss++; throw new Error('map: ' + L.name + ' block ' + bx + ',' + by + (pk ? ' is not loaded (' + pk.file + ')' : ' has no pack')); }
  a = mapDecode(L, fflate.inflateSync(pk.buf.subarray(e[0], e[0] + e[1])));
  MAPD.blk.set(k, a); MAPD.bytes += a.byteLength;
  for (const [kk, v] of MAPD.blk){ if (MAPD.bytes <= MAPD.budget) break; if (kk === k) continue; MAPD.blk.delete(kk); MAPD.bytes -= v.byteLength; }
  return a;
}
// whether a cell is in the layer (the readers that pick cells themselves keep to it)
const mapIn = (L, ix, iy) => ix >= L.ix0 && iy >= L.iy0 && ix < L.ix0 + L.nx && iy < L.iy0 + L.ny;
function mapHasBlock(L, bx, by){ const pk = mapPackOf(L, bx, by); return !!(pk && pk.buf && pk.idx.has(L.name + ':' + bx + ':' + by)); }
// whether some pack has the block at all: a pack not loaded yet is taken to have it (its index is not in; rcell then says «not
// loaded», as it should), no pack at all is the open sea beyond the tiles (08.10.2026)
function mapBlockKnown(L, bx, by){ const pk = mapPackOf(L, bx, by); return !!pk && (!pk.buf || pk.idx.has(L.name + ':' + bx + ':' + by)); }
// one cell (cell numbers from the frame's origin); the last block of each layer is kept at hand
function rcell(L, ix, iy){
  const n = L.n, bx = Math.floor(ix / n), by = Math.floor(iy / n);
  if (bx !== L.bx || by !== L.by){ L.b = mapBlock(L, bx, by); L.bx = bx; L.by = by; }
  return L.b[(iy - by * n) * n + (ix - bx * n)];
}
// between the four nearest cell centres at p (km), clamped to the layer's edge
function rbil(L, p){
  const gx = clamp(p.x / L.c - 0.5, L.ix0, L.ix0 + L.nx - 1.001), gy = clamp(p.y / L.c - 0.5, L.iy0, L.iy0 + L.ny - 1.001), ix = Math.floor(gx), iy = Math.floor(gy), fx = gx - ix, fy = gy - iy;
  return ((rcell(L, ix, iy) * (1 - fx) + rcell(L, ix + 1, iy) * fx) * (1 - fy) + (rcell(L, ix, iy + 1) * (1 - fx) + rcell(L, ix + 1, iy + 1) * fx) * fy) * L.k;
}
// the same at x, z in metres, as the 3D view reads its grids
function rbilM(L, x, z){
  const cm = L.c * 1000, gx = clamp(x / cm - 0.5, L.ix0, L.ix0 + L.nx - 1.001), gz = clamp(z / cm - 0.5, L.iy0, L.iy0 + L.ny - 1.001), ix = Math.floor(gx), iz = Math.floor(gz), fx = gx - ix, fz = gz - iz;
  return ((rcell(L, ix, iz) * (1 - fx) + rcell(L, ix + 1, iz) * fx) * (1 - fz) + (rcell(L, ix, iz + 1) * (1 - fx) + rcell(L, ix + 1, iz + 1) * fx) * fz) * L.k;
}
// whether a view layer's blocks under a box of metres are in (the 3D draws a stand-in until they are)
function mapHasM(L, x0, z0, x1, z1){
  const bm = L.n * L.c * 1000;
  for (let by = Math.floor(z0 / bm); by <= Math.floor(z1 / bm); by++) for (let bx = Math.floor(x0 / bm); bx <= Math.floor(x1 / bm); bx++){
    if (bx * L.n < L.ix0 || by * L.n < L.iy0 || bx * L.n >= L.ix0 + L.nx || by * L.n >= L.iy0 + L.ny || !mapPackOf(L, bx, by)) continue; if (!mapHasBlock(L, bx, by)) return false; }
  return true;
}
// a vector entry of a loaded pack (at the tile's first block): its bytes, inflated once, and its count; null if the pack has none
function mapVec(pk, name){
  if (!pk || !pk.buf) return null; if (pk.vec[name] !== undefined) return pk.vec[name];
  const T = MAPD.man.tile / MAPD.man.block, e = pk.idx.get(name + ':' + pk.tile[0] * T + ':' + pk.tile[1] * T);
  return pk.vec[name] = e ? {b:fflate.inflateSync(pk.buf.subarray(e[0], e[0] + e[1])), n:e[2] || 0} : null;
}
// for the views: whether the packs (sim, or the kinds asked for) under a box of game km are in; the missing ones are asked for, and
// then() runs when they come
function mapViewReady(x0, y0, x1, y1, then, kinds){
  const pks = [].concat(...(kinds || ['sim']).map(k => mapPacksIn(k, x0, y0, x1, y1))).filter(pk => !pk.buf);
  if (!pks.length) return true;
  Promise.all(pks.map(mapLoad)).then(then, e => console.error(e)); return false;
}
// the simulation's barrier: every vessel you own has its waters (MAPD.simR round it) loaded, and so has each of your sets in the sea
// (1 km round its middle); what is missing is asked for
function simAreaReady(){
  let ok = true;
  const need = (p, r) => { if (!mapReadyAt(p, r)){ ok = false; mapNeed(p, r).catch(e => console.error(e)); } };
  for (const v of (S && S.fleet && S.fleet.length ? S.fleet : [null])){ const b = v ? vget(v, 'boat') : S.boat; if (b && b.pos) need(b.pos, MAPD.simR); }
  for (const s of (S && S.sets) || []) if (!s.lost) need(setMid(s), 1);
  return ok;
}
// for the tests (maptest.py): forget a pack, also in IndexedDB, as if it had never come; the decoded blocks go too
function mapDrop(pk){
  pk.buf = null; pk.idx = null; pk.vec = null; pk.load = null; pk.coast = null; pk.coastQ = null; COAST.last = null; MAPD.blk.clear(); MAPD.bytes = 0; MVI = {k:'', v:false}; MFI = {k:'', v:false};
  for (const n in MAPD.L){ const L = MAPD.L[n]; L.bx = L.by = NaN; L.b = null; }
  return idbDo('readwrite', s => s.delete(pk.hash));
}
