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
//   fin   fin             the fine ground along the sea for the 3D view (Ø13 K1, 11.11.2026; tools/map/fin.py): the land within 1 km of
//                         the sea on 12.5 m cells, half metres, where hgt has 25 m cells and 2 m steps over 10 m. Read only through
//                         finH, below; only the 3D view's High and Ultra ask for the packs (view3d finStream), a tile need not have one
//                         and a pack has only the blocks with a strip in them, so a block that is missing is never an error here
//   far   far             the ground at 200 m for the 3D view's far terrain, on the coast's 191 tiles with land (phase K8)
//   chart coast1, coast2, names   the chart's vectors per tile (tools/map/chart.py; the core has coast0 and names0 for the whole
//                         country): entries with a count as a sixth field, read with mapVec (ui/03a-chart.js draws them). Loaded
//                         round the boats too: coast2 is the truth for land and sea there (01d-coast.js), indexed as it comes
// The layers are in the national frame (phase K4): a layer's cell (ix, iy) of size c covers x in [ix c, (ix + 1) c) km, the cells are
// numbered from the frame's origin, and a layer has cells from (ix0, iy0) for nx by ny; blocks (bx, by) of n cells and tiles of
// 50 km line up with the frame, so the packs of the whole coast fit together.
const MAPD = {man:null, L:{}, packs:[], byTile:new Map(), core:null, chart0:null, blk:new Map(), bytes:0, budget:96e6, simR:4, base:'map/', db:undefined, miss:0, fetched:0, cached:0, gen:0};
function mapOnReady(f){ if (typeof document === 'undefined' || document.readyState !== 'loading') f(); else document.addEventListener('DOMContentLoaded', f); }
// ---------- IndexedDB, by content ----------
function mapIdb(){
  if (MAPD.db !== undefined) return Promise.resolve(MAPD.db);
  return new Promise(res => { try { const q = indexedDB.open('kyst-map', 1); q.onupgradeneeded = () => q.result.createObjectStore('f'); q.onsuccess = () => res(MAPD.db = q.result); q.onerror = () => res(MAPD.db = null); } catch (e){ res(MAPD.db = null); } });
}
function idbDo(mode, f){ return mapIdb().then(db => db && new Promise(res => { try { const tx = db.transaction('f', mode), q = f(tx.objectStore('f')); tx.oncomplete = () => res(q && q.result); tx.onerror = tx.onabort = () => res(null); } catch (e){ res(null); } })); }
async function mapFetch(pk){
  // the copy kept in IndexedDB, unless the store is slow to answer: a read waits behind the writes before it, and after a long jump
  // (a teleport, a new place on the map) tens of packs are being written, so a read could wait half a minute and the view's packs not
  // come at all (Tromsø 29.10.2026, the larger view packs of G3 and G4); after 1.5 s the network is asked instead
  const kept = await Promise.race([idbDo('readonly', s => s.get(pk.hash)), new Promise(res => setTimeout(() => res(null), 1500))]);
  if (kept && kept.byteLength === pk.bytes){ MAPD.cached++; return new Uint8Array(kept); }
  // a pack that does not come (a slow or dropped connection, a proxy that cuts a large file, a hiccup on the server) is asked for again
  // up to three times, 0.7 s, 1.4 s and 2.1 s apart, before the player sees an error (08.10.2026: players stuck at «Kartet lastet ikke»)
  let buf = null, err = null;
  for (let t = 0; t < 5 && !buf; t++){
    if (t) await new Promise(res => setTimeout(res, 700 * t));
    try { const r = await fetch(MAPD.base + pk.file, t ? {cache:'reload'} : undefined); if (!r.ok) throw new Error('map: ' + pk.file + ' ' + r.status); const b = await r.arrayBuffer(); if (pk.bytes && b.byteLength !== pk.bytes) throw new Error('map: ' + pk.file + ' came as ' + b.byteLength + ' bytes, not ' + pk.bytes); buf = b; } catch (e){ err = e; }
  }
  if (!buf) throw err;
  MAPD.fetched++;
  idbDo('readwrite', s => s.put(buf, pk.hash));
  return new Uint8Array(buf);
}
// ---------- the manifest and the packs ----------
// what a cell's number is worth: the heights are kept as Int16 decimetres (phase K8), half the room of Float32, and the fine ground as
// the Int16 half metres it is packed in (Ø13 K1)
const mapLayerK = l => l.dec === 'hgt' ? 0.1 : l.dec === 'x10' ? 10 : l.kind === 'fin' ? 0.5 : 1;
async function mapStart(base){
  if (base) MAPD.base = base;
  const man = MAPD.man = await (await fetch(MAPD.base + 'manifest.json', {cache:'no-cache'})).json();
  let id = 0;
  for (const name in man.layers) MAPD.L[name] = Object.assign({name, id:id++, bx:NaN, by:NaN, ox:NaN, oy:NaN, b:null, k:mapLayerK(man.layers[name])}, man.layers[name]);
  const dc = MAPD.L.dc; Object.assign(DC, {nx:dc.nx, ny:dc.ny, ix0:dc.ix0, iy0:dc.iy0});
  // a joined pack (tools/map/game.py: the far heights and the chart, several tiles a file) is filed under each of its tiles as a
  // pack of its own that loads through it
  for (const pk of man.packs){
    pk.buf = null; pk.idx = null; pk.load = null; MAPD.packs.push(pk);
    if (pk.kind === 'core'){ MAPD.core = pk; continue; }
    if (pk.kind === 'chart0'){ MAPD.chart0 = pk; continue; }   // coast0 for the whole frame (H1b R2): loaded after the start
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
    pk.idx = new Map(head.blocks.map(e => [e[0] + ':' + e[1] + ':' + e[2], [at + e[3], e[4], e[5]]])); pk.vec = {}; pk.buf = b; MAPD.gen++; return pk;
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
// Everything round some places, before a new player is let in (Jonas 10.10.2026: «Alt burde være ferdig innlastet så snart den nye
// spilleren har kommet forbi innlastingsskjermen», after a chart that came only when it was zoomed out and in again): the packs of the kinds
// under a box of R km round each point, a few at a time, each tried again before it counts as lost; the chart packs get their coast indexed
// (as mapNeed does). pts [{x, y}], kinds [[kind, R km]], onProgress(done, of) for the line on the start screen; throws an Error naming what
// did not come, so the start can say so and offer another try instead of going on without a map.
async function mapPreload(pts, kinds, onProgress){
  const want = new Map();
  for (const p of pts) for (const [kind, R] of kinds) for (const pk of mapPacksIn(kind, p.x - R, p.y - R, p.x + R, p.y + R)) want.set(pk, kind);
  const list = [...want.keys()], files = new Set(list.map(pk => pk.file)); let done = 0, total = files.size; const seen = new Set(), lost = [];
  const tick = pk => { if (!seen.has(pk.file)){ seen.add(pk.file); done++; } if (onProgress) onProgress(Math.min(done, total), total); };
  const one = async pk => {
    for (let t = 0; t < 3; t++){
      try { if (pk.kind === 'chart') await coastEnsure(pk); else await mapLoad(pk); tick(pk); return; }
      catch (e){ if (t === 2){ lost.push(pk.file); console.error(e); } else await new Promise(r => setTimeout(r, 900 * (t + 1))); }
    }
  };
  if (onProgress) onProgress(0, total);
  const q = list.slice(); const workers = Array.from({length:4}, async () => { for (let pk = q.shift(); pk; pk = q.shift()) await one(pk); });
  await Promise.all(workers);
  if (lost.length) throw new Error('map: ' + lost.length + ' packs did not come (' + lost.slice(0, 3).join(', ') + ')');
  return total;
}
function mapLoadKind(kind){ return Promise.all(MAPD.packs.filter(pk => pk.kind === kind).map(mapLoad)); }
// ---------- blocks ----------
function med16(raw, n){
  const N = n * n, q = new Int32Array(N);
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++){ const i = r * n + c, z = raw[i] | (raw[N + i] << 8), a = c ? q[i - 1] : 0, b = r ? q[i - n] : 0, cc = r && c ? q[i - n - 1] : 0, pr = cc >= Math.max(a, b) ? Math.min(a, b) : cc <= Math.min(a, b) ? Math.max(a, b) : a + b - cc; q[i] = pr + ((z >>> 1) ^ -(z & 1)); }
  return q;
}
// 'u8p' (H1b R2): u8 through the median predictor, the residual modulo 256 in one byte (tools/map/pack.py med8)
function med8(raw, n){
  const q = new Uint8Array(n * n);
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++){ const i = r * n + c, a = c ? q[i - 1] : 0, b = r ? q[i - n] : 0, cc = r && c ? q[i - n - 1] : 0, pr = cc >= Math.max(a, b) ? Math.min(a, b) : cc <= Math.min(a, b) ? Math.max(a, b) : a + b - cc; q[i] = pr + raw[i]; }
  return q;
}
function mapDecode(L, raw){
  const n = L.n, N = n * n;
  if (L.type === 'u8') return raw;
  if (L.type === 'u8p') return med8(raw, n);
  if (L.type === 'f32') return new Float32Array(raw.byteOffset % 4 ? raw.slice().buffer : raw.buffer, raw.byteOffset % 4 ? 0 : raw.byteOffset, N);
  const q = med16(raw, n);
  if (L.kind === 'fin') return new Int16Array(q);   // the fine ground: half metres as they are (L.k = 0.5), 1.28 MB a block where Float32 is 2.56
  // depth in half metres; the ground's height in half metres to 10 m and then 2 m steps (the page's own packing of hgt), kept as
  // Int16 decimetres (L.k = 0.1)
  if (L.dec === 'half'){ const out = new Float32Array(N); for (let i = 0; i < N; i++) out[i] = q[i] / 2; return out; }
  if (L.dec === 'raw') return Int16Array.from(q);   // (the satellites' colour, G3: the values as they are)
  const out = new Int16Array(N); for (let i = 0; i < N; i++){ const a = Math.abs(q[i]); out[i] = Math.sign(q[i]) * (a < 20 ? a * 5 : 100 + (a - 20) * 20); }
  return out;
}
function mapBlock(L, bx, by){
  const k = gridKey(bx, by) * 64 + L.id; let a = MAPD.blk.get(k);   // room for 64 layers (there are 14 with the satellites' three)
  if (a){ MAPD.blk.delete(k); MAPD.blk.set(k, a); return a; }
  const pk = mapPackOf(L, bx, by), e = pk && pk.idx && pk.idx.get(L.name + ':' + bx + ':' + by);
  if (!pk || !pk.buf || !e){ MAPD.miss++; const er = new Error('map: ' + L.name + ' block ' + bx + ',' + by + (pk ? (pk.buf ? ' is not in ' : ' is not loaded (') + pk.file + (pk.buf ? '' : ')') : ' has no pack')); if (pk && !pk.buf) er.pk = pk; throw er; }
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
// one cell (cell numbers from the frame's origin); the last block of each layer is kept at hand, with its first cell (ox, oy), so a
// cell in it is read without the divisions (Ø3a, 07.11.2026: rcell is in every reader of the rasters, the chart's by the million)
function rcell(L, ix, iy){
  const n = L.n, i = ix - L.ox, j = iy - L.oy;
  if (i >= 0 && i < n && j >= 0 && j < n) return L.b[j * n + i];
  const bx = Math.floor(ix / n), by = Math.floor(iy / n);
  if (bx !== L.bx || by !== L.by){ L.b = mapBlock(L, bx, by); L.bx = bx; L.by = by; L.ox = bx * n; L.oy = by * n; }
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
// ---------- the fine ground along the sea (Ø13 K1, 11.11.2026) ----------
// The layer 'fin' (tools/map/fin.py): the land within 1 km of the sea on 12.5 m cells (800 x 800 a block), Int16 half metres. A cell is
// > 0 land (its height, at least half a metre), 0 «no fine ground here, read the 25 m layer», or -1 the sea within 25 m of the strip
// (the foreshore: only the sign). A block with no cell of the strip is not in the pack, and a tile with none of it has no pack.
// finCell: a cell of it, or 0 where there is none: no pack for the tile, the pack not in (yet, or never on Low and Middle, which do not
// ask for it), or the block not in the pack. None of those is an error and none counts in MAPD.miss. The «not here» of the last block
// asked is remembered until the packs change (MAPD.gen), so the readers off the strip do not look the pack up cell by cell.
const FINB = {bx:NaN, by:NaN, gen:-1};
function finBlock(L, bx, by){
  if (bx === FINB.bx && by === FINB.by && FINB.gen === MAPD.gen) return null;
  const pk = mapPackOf(L, bx, by);
  if (!pk || !pk.buf || !pk.idx.has(L.name + ':' + bx + ':' + by)){ FINB.bx = bx; FINB.by = by; FINB.gen = MAPD.gen; return null; }
  return mapBlock(L, bx, by);
}
function finCell(L, ix, iy){
  const n = L.n, i = ix - L.ox, j = iy - L.oy;
  if (i >= 0 && i < n && j >= 0 && j < n) return L.b[j * n + i];
  const bx = Math.floor(ix / n), by = Math.floor(iy / n), b = finBlock(L, bx, by); if (!b) return 0;
  L.b = b; L.bx = bx; L.by = by; L.ox = bx * n; L.oy = by * n;
  return b[(iy - by * n) * n + (ix - bx * n)];
}
// THE ground at x, z (m) for the 3D view: the fine ground where there is some, else h, the 25 m ground the caller has read there
// (view3d terrRaw is the one caller, and everything in 3D reads the ground through it). Between the four nearest cell centres:
//   a land cell counts with its height;
//   a cell without fine ground counts with h, so the fine ground goes over to the 25 m ground across the strip's outermost cell with
//   no step and no crack (the two differ by half a metre rms, K0), and off the strip the answer is h itself;
//   a sea cell (-1) does not pull the land beside it down: the land cells' own heights hold out to the border between the cells
//   (where the land has at least half the weight), and over the half cell beyond it the ground goes evenly to h, the 25 m layer's
//   sea bed. terrRaw's shore profile (COAST3) then cuts the waterline at the chart's coast line as before; what is new is that the
//   land right behind the line has its own height, where the 25 m cells were pulled flat by the sea cell beside them.
function finH(x, z, h){
  const L = MAPD.L.fin; if (!L) return h;
  const cm = L.c * 1000, gx = x / cm - 0.5, gz = z / cm - 0.5, ix = Math.floor(gx), iz = Math.floor(gz);
  const a = finCell(L, ix, iz), b = finCell(L, ix + 1, iz), c = finCell(L, ix, iz + 1), d = finCell(L, ix + 1, iz + 1);
  if (a <= 0 && b <= 0 && c <= 0 && d <= 0) return h;
  const fx = gx - ix, fz = gz - iz, wa = (1 - fx) * (1 - fz), wb = fx * (1 - fz), wc = (1 - fx) * fz, wd = fx * fz, k = L.k;
  let A = 0, s = 0;   // the weight that is not sea, and its heights
  if (a >= 0){ A += wa; s += wa * (a ? a * k : h); } if (b >= 0){ A += wb; s += wb * (b ? b * k : h); }
  if (c >= 0){ A += wc; s += wc * (c ? c * k : h); } if (d >= 0){ A += wd; s += wd * (d ? d * k : h); }
  if (!(A > 0)) return h;   // (a land cell with no weight, the point on the line between two sea cells: s / A is 0 / 0)
  return A >= 0.5 ? s / A : h + 2 * A * (s / A - h);
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
  // (the end of the string the boat is working towards too: an autoline of two lenker is 13 km, H2a 05.11.2026)
  for (const v of (S && S.fleet && S.fleet.length ? S.fleet : [null])){ const b = v ? vget(v, 'boat') : S.boat; if (b && b.pos) need(b.pos, MAPD.simR); if (b && b.gop && b.gop.b) need(b.gop.b, 1); }
  // both ends of a long string as well as its middle (an autoline lenke is 6.5 km; the coast's strings are within the middle's tiles)
  for (const s of (S && S.sets) || []) if (!s.lost){ need(setMid(s), 1); if (s.a && s.b && dist(s.a, s.b) > 2){ need(s.a, 1); need(s.b, 1); } }
  return ok;
}
// for the tests (maptest.py): forget a pack, also in IndexedDB, as if it had never come; the decoded blocks go too
function mapDrop(pk){
  pk.buf = null; pk.idx = null; pk.vec = null; pk.load = null; pk.coast = null; pk.coastQ = null; COAST.last = null; MAPD.blk.clear(); MAPD.bytes = 0; MVI = {k:'', v:false}; MFI = {k:'', v:false}; MAPD.gen++;
  for (const n in MAPD.L){ const L = MAPD.L[n]; L.bx = L.by = L.ox = L.oy = NaN; L.b = null; }
  return idbDo('readwrite', s => s.delete(pk.hash));
}
