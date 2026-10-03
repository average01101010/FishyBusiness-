// The map's rasters in 10 km blocks, packed for dist/map/ (phases K3 and K4 of the coast plan). build.mjs calls writeMap(srcData, outDir).
// Today the data are Senja's, made in the legacy frame (flat at 69.35 N, km east and south of 69.72 N 16.55 E). They are decoded
// here as the game decoded them from the page and resampled into the national frame (UTM 33, km: x = (E + 250 km) / 1000,
// y = (8 050 km - N) / 1000; src/js/core/00-proj.js): every layer is a grid of cells numbered from the frame's origin, so a cell
// (ix, iy) of size c covers x in [ix c, (ix + 1) c), and the blocks of 10 km and tiles of 50 km line up with the frame everywhere.
// The land mask is drawn anew from the fine coast polygons (geo-fine.b64) in the national frame, with the islets the polygons
// leave out taken from the old mask; the depth, the heights and the openness are read bilinearly, the forest by the nearest cell,
// and the distance to the shore is worked out from the new mask. Each layer is cut into blocks of 10 km that are deflated one by
// one. A pack holds the blocks of one kind in one 50 km tile:
//   core  mask (land, 25 m), dc (distance to the shore, 100 m), expo (openness to the ocean, 500 m)   always loaded
//   sim   depth (half metres, 50 m)                                                                  loaded near the boats before the clock runs
//   view  hgt (ground height, 25 m), forest (50 m)                                for the 3D view, as it comes
// Pack: 'KMP1', u32 header length, the header (JSON: {kind, tile, blocks:[[layer, bx, by, offset, length], ...]}), the blocks.
// The file name carries the first 12 hex of the pack's SHA-256, so a browser can keep it by content (map/manifest.json lists them).
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import zlib from 'node:zlib';
import crypto from 'node:crypto';

const BLOCK = 10, TILE = 50;
const HERE = dirname(fileURLToPath(import.meta.url)), PROJ_SRC = join(HERE, '..', 'src', 'js', 'core', '00-proj.js');
// the page's own projection (00-proj.js), so the build and the game agree to the last digit
const PJ = new Function(readFileSync(PROJ_SRC, 'utf8') + '\nreturn {utm33, utm33inv, natP, natLL};')();
// the legacy frame, as 01-world.js has it
const KY = 111.32, KX = 111.32 * Math.cos(69.35 * Math.PI / 180), LAT0 = 69.72, LON0 = 16.55;
export const leg2nat = (x, y) => PJ.natP(LAT0 - y / KY, LON0 + x / KX);
const nat2leg = (x, y) => { const l = PJ.natLL({x, y}); return {x:(l.lon - LON0) * KX, y:(LAT0 - l.lat) * KY}; };
const b64 = f => Buffer.from(readFileSync(f, 'utf8').trim(), 'base64');
function varints(b){ let i = 0; return () => { let v = 0, s = 0, x; do { x = b[i++]; v += (x & 127) * Math.pow(2, s); s += 7; } while (x & 128); return v; }; }
function rle(bytes, nx, ny){
  const next = varints(bytes), m = new Uint8Array(nx * ny);
  for (let r = 0; r < ny; r++){ const n = next(), off = r * nx; let c = 0, cur = 0; for (let k = 0; k < n; k++){ const len = next(); if (cur) m.fill(1, off + c, off + c + len); c += len; cur ^= 1; } }
  return m;
}
// the two-plane, median-predicted 16-bit grids (depth and heights), as loadDepth and loadHeights read them
function pred16(buf, nx, ny, Arr){
  const n = nx * ny, q = new Arr(n);
  for (let r = 0; r < ny; r++) for (let c = 0; c < nx; c++){
    const i = r * nx + c, z = buf[i] | (buf[n + i] << 8), a = c ? q[i - 1] : 0, b = r ? q[i - nx] : 0, cc = r && c ? q[i - nx - 1] : 0;
    const pr = cc >= Math.max(a, b) ? Math.min(a, b) : cc <= Math.min(a, b) ? Math.max(a, b) : a + b - cc; q[i] = pr + ((z >>> 1) ^ -(z & 1));
  }
  return q;
}
// distance from open water to the shore on the 100 m grid (km), the same arithmetic in Float32 as the page did it
function coastDist(MASK, NX, NY){
  const nx = NX >> 2, ny = NY >> 2, d = new Float32Array(nx * ny), D = Math.SQRT2;
  for (let r = 0; r < ny; r++) for (let c = 0; c < nx; c++){ let any = 0; for (let a = 0; a < 4 && !any; a++){ const i0 = (4 * r + a) * NX + 4 * c; any = MASK[i0] | MASK[i0 + 1] | MASK[i0 + 2] | MASK[i0 + 3]; } d[r * nx + c] = any ? 0 : 1e6; }
  for (let r = 0; r < ny; r++){ const ro = r * nx; for (let c = 0; c < nx; c++){ const i = ro + c; let v = d[i]; if (v === 0) continue; let w;
    if (c > 0){ w = d[i - 1] + 1; if (w < v) v = w; }
    if (r > 0){ w = d[i - nx] + 1; if (w < v) v = w; if (c > 0){ w = d[i - nx - 1] + D; if (w < v) v = w; } if (c < nx - 1){ w = d[i - nx + 1] + D; if (w < v) v = w; } }
    d[i] = v; } }
  for (let r = ny - 1; r >= 0; r--){ const ro = r * nx; for (let c = nx - 1; c >= 0; c--){ const i = ro + c; let v = d[i]; if (v === 0) continue; let w;
    if (c < nx - 1){ w = d[i + 1] + 1; if (w < v) v = w; }
    if (r < ny - 1){ w = d[i + nx] + 1; if (w < v) v = w; if (c < nx - 1){ w = d[i + nx + 1] + D; if (w < v) v = w; } if (c > 0){ w = d[i + nx - 1] + D; if (w < v) v = w; } }
    d[i] = v; } }
  for (let i = 0; i < d.length; i++) d[i] *= 0.1;
  return {nx, ny, d};
}
// the fine land polygons (metres, legacy frame), as loadFine in 01-world.js reads them
function readFine(f){
  const next = varints(zlib.inflateSync(b64(f))), zz = v => (v % 2 ? -(v + 1) / 2 : v / 2), n = next(), out = [];
  for (let k = 0; k < n; k++){ const len = next(), xs = new Float64Array(len), zs = new Float64Array(len); let x = 0, z = 0; for (let j = 0; j < len; j++){ x += zz(next()); z += zz(next()); xs[j] = x; zs[j] = z; } out.push({xs, zs}); }
  return out;
}
// even-odd fill of polygons (metres) on a grid of cells of c metres starting at (x0, z0): a cell is in when its centre is
function fillPolys(polys, x0, z0, c, nx, ny){
  const R = new Uint8Array(nx * ny), rows = Array.from({length:ny}, () => []);
  for (const p of polys){ const m = p.xs.length; for (let j = 0; j < m; j++){
    const xa = p.xs[j], za = p.zs[j], xb = p.xs[(j + 1) % m], zb = p.zs[(j + 1) % m]; if (za === zb) continue;
    const lo = Math.min(za, zb), hi = Math.max(za, zb);
    for (let r = Math.max(0, Math.ceil((lo - z0) / c - 0.5)); r < ny; r++){ const zc = z0 + (r + 0.5) * c; if (zc >= hi) break; if (zc < lo) continue; rows[r].push(xa + (zc - za) * (xb - xa) / (zb - za)); } } }
  for (let r = 0; r < ny; r++){ const a = rows[r].sort((p, q) => p - q); for (let k = 0; k + 1 < a.length; k += 2){ const c0 = Math.max(0, Math.ceil((a[k] - x0) / c - 0.5)), c1 = Math.min(nx - 1, Math.floor((a[k + 1] - x0) / c - 0.5)); for (let cc = c0; cc <= c1; cc++) R[r * nx + cc] ^= 1; } }
  return R;
}
export function readSenja(data){
  const MASK = rle(b64(join(data, 'geo-mask.b64')), 3140, 3296);
  const DC = coastDist(MASK, 3140, 3296);
  const EXPO = new Uint8Array(b64(join(data, 'geo-expo.b64')));
  const depthQ = pred16(zlib.inflateSync(b64(join(data, 'geo-depth.b64'))), 1570, 1648, Int32Array);
  const hgtH = pred16(zlib.inflateSync(b64(join(data, 'hgt.b64'))), 3140, 3296, Int16Array);
  const FOREST = rle(b64(join(data, 'geo-forest.b64')), 1570, 1648);
  const fine = readFine(join(data, 'geo-fine.b64'));
  const depth = Int16Array.from(depthQ, v => { if (v < -32768 || v > 32767) throw new Error('depth out of Int16'); return v; });
  return {
    mask:{c:0.025, nx:3140, ny:3296, type:'u8', kind:'core', arr:MASK},
    depth:{c:0.05, nx:1570, ny:1648, type:'i16', kind:'sim', dec:'half', arr:depth},
    dc:{c:0.1, nx:DC.nx, ny:DC.ny, type:'f32', kind:'core', arr:DC.d},
    expo:{c:0.5, nx:157, ny:165, type:'u8', kind:'core', arr:EXPO},
    hgt:{c:0.025, nx:3140, ny:3296, type:'i16', kind:'view', dec:'hgt', arr:hgtH},
    forest:{c:0.05, nx:1570, ny:1648, type:'u8', kind:'view', arr:FOREST},
    fine
  };
}
const ARR = {u8:Uint8Array, i16:Int16Array, f32:Float32Array};
// 16-bit blocks go as the residual of the median predictor (left, up, up-left), zigzagged, low bytes then high bytes, as the page's
// own grids were packed; the page undoes it in mapBlock (01b-mapdata.js)
function med16(q, n){
  const out = Buffer.alloc(n * n * 2), N = n * n;
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++){
    const i = r * n + c, a = c ? q[i - 1] : 0, b = r ? q[i - n] : 0, cc = r && c ? q[i - n - 1] : 0;
    const pr = cc >= Math.max(a, b) ? Math.min(a, b) : cc <= Math.min(a, b) ? Math.max(a, b) : a + b - cc, d = q[i] - pr, z = ((d << 1) ^ (d >> 31)) & 0xffff;
    out[i] = z & 255; out[N + i] = z >> 8;
  }
  return out;
}
// ---------- into the national frame ----------
// the legacy square's place in the national frame: the box round it (km), sampled along its edges (they bow by millimetres)
export function legacyBox(){
  const W = 2 * KX, H = 0.74 * KY, b = [1e9, 1e9, -1e9, -1e9];
  for (let i = 0; i <= 32; i++) for (const [x, y] of [[W * i / 32, 0], [W * i / 32, H], [0, H * i / 32], [W, H * i / 32]]){ const q = leg2nat(x, y); b[0] = Math.min(b[0], q.x); b[1] = Math.min(b[1], q.y); b[2] = Math.max(b[2], q.x); b[3] = Math.max(b[3], q.y); }
  return {x0:b[0], y0:b[1], x1:b[2], y1:b[3], W, H};
}
// national to legacy km by a polynomial of degree 5 fitted to the exact inverse over the box: about 0.1 mm, and fast enough for
// the ten million cells of the 25 m layers
function fitInverse(B){
  const D = 5, terms = []; for (let i = 0; i <= D; i++) for (let j = 0; j <= D - i; j++) terms.push([i, j]);
  const cx = (B.x0 + B.x1) / 2, sx = (B.x1 - B.x0) / 2 + 12, cy = (B.y0 + B.y1) / 2, sy = (B.y1 - B.y0) / 2 + 12, n = terms.length;
  const basis = (u, v, o) => { for (let k = 0; k < n; k++) o[k] = u ** terms[k][0] * v ** terms[k][1]; return o; };
  const A = Array.from({length:n}, () => new Float64Array(n)), bx = new Float64Array(n), by = new Float64Array(n), o = new Float64Array(n), G = 40;
  for (let a = 0; a <= G; a++) for (let c = 0; c <= G; c++){
    const u = -1 + 2 * a / G, v = -1 + 2 * c / G, q = nat2leg(cx + u * sx, cy + v * sy); basis(u, v, o);
    for (let i = 0; i < n; i++){ bx[i] += o[i] * q.x; by[i] += o[i] * q.y; for (let k = 0; k < n; k++) A[i][k] += o[i] * o[k]; } }
  const solve = (M, b) => { M = M.map(r => Float64Array.from(r)); b = Float64Array.from(b);
    for (let i = 0; i < n; i++){ let p = i; for (let r = i + 1; r < n; r++) if (Math.abs(M[r][i]) > Math.abs(M[p][i])) p = r; [M[i], M[p]] = [M[p], M[i]]; [b[i], b[p]] = [b[p], b[i]];
      for (let r = i + 1; r < n; r++){ const f = M[r][i] / M[i][i]; for (let k = i; k < n; k++) M[r][k] -= f * M[i][k]; b[r] -= f * b[i]; } }
    const x = new Float64Array(n); for (let i = n - 1; i >= 0; i--){ let v = b[i]; for (let k = i + 1; k < n; k++) v -= M[i][k] * x[k]; x[i] = v / M[i][i]; } return x; };
  const kx = solve(A, bx), ky = solve(A, by);
  const f = (x, y, out) => { const u = (x - cx) / sx, v = (y - cy) / sy; basis(u, v, o); let X = 0, Y = 0; for (let k = 0; k < n; k++){ X += kx[k] * o[k]; Y += ky[k] * o[k]; } out[0] = X; out[1] = Y; return out; };
  // along a row (y fixed) it is a polynomial in u alone: f.row(y) gives (x, out) => out, by Horner
  f.row = y => { const v = (y - cy) / sy, ax = new Float64Array(D + 1), ay = new Float64Array(D + 1);
    for (let k = 0; k < n; k++){ const w = v ** terms[k][1]; ax[terms[k][0]] += kx[k] * w; ay[terms[k][0]] += ky[k] * w; }
    return (x, out) => { const u = (x - cx) / sx; let X = ax[D], Y = ay[D]; for (let i = D - 1; i >= 0; i--){ X = X * u + ax[i]; Y = Y * u + ay[i]; } out[0] = X; out[1] = Y; return out; }; };
  let err = 0; const t = [0, 0];
  for (let i = 0; i < 400; i++){ const x = B.x0 + (B.x1 - B.x0) * Math.random(), y = B.y0 + (B.y1 - B.y0) * Math.random(), q = nat2leg(x, y); f(x, y, t); err = Math.max(err, Math.hypot(t[0] - q.x, t[1] - q.y)); }
  if (err > 1e-5) throw new Error('mappack: the inverse fit is off by ' + (err * 1e6).toFixed(2) + ' mm');
  return f;
}
// hgt holds the ground in half metres to 10 m and then 2 m steps: to metres and back
const hgtDec = q => { const a = Math.abs(q); return Math.sign(q) * (a < 20 ? a / 2 : 10 + (a - 20) * 2); };
const hgtEnc = v => { const a = Math.abs(v); return Math.sign(v) * (a < 9.75 ? Math.round(a * 2) : 20 + Math.round((a - 10) / 2)); };
// one legacy layer onto the national cells of the blocks bx0..bx1, by0..by1 (absolute 10 km blocks)
function resample(L, NB, inv, how){
  const n = Math.round(BLOCK / L.c), ix0 = NB.bx0 * n, iy0 = NB.by0 * n, nx = (NB.bx1 - NB.bx0) * n, ny = (NB.by1 - NB.by0) * n, out = new ARR[L.type](nx * ny), q = [0, 0];
  const get = how === 'hgt' ? i => hgtDec(L.arr[i]) : i => L.arr[i];
  for (let r = 0; r < ny; r++){ const row = inv.row((iy0 + r + 0.5) * L.c); for (let k = 0; k < nx; k++){
    row((ix0 + k + 0.5) * L.c, q);
    let v;
    if (how === 'nearest') v = L.arr[clampI(Math.floor(q[1] / L.c), L.ny) * L.nx + clampI(Math.floor(q[0] / L.c), L.nx)];
    else {
      const gx = Math.min(Math.max(q[0] / L.c - 0.5, 0), L.nx - 1.001), gy = Math.min(Math.max(q[1] / L.c - 0.5, 0), L.ny - 1.001), ix = Math.floor(gx), iy = Math.floor(gy), fx = gx - ix, fy = gy - iy, i = iy * L.nx + ix;
      v = (get(i) * (1 - fx) + get(i + 1) * fx) * (1 - fy) + (get(i + L.nx) * (1 - fx) + get(i + L.nx + 1) * fx) * fy;
      v = how === 'hgt' ? hgtEnc(v) : L.type === 'f32' ? v : Math.round(v);
    }
    out[r * nx + k] = v;
  } }
  return {c:L.c, ix0, iy0, nx, ny, n, type:L.type, kind:L.kind, dec:L.dec || null, arr:out};
}
const clampI = (i, n) => i < 0 ? 0 : i >= n ? n - 1 : i;
// the land mask: the fine polygons filled in the national frame; where the old mask and the polygons disagree (the islets and rocks
// the polygons leave out, a few quay ends), the old mask; outside the legacy square, the old mask's nearest edge cell
function nationalMask(M, fine, NB, inv, B){
  const c = M.c, n = Math.round(BLOCK / c), ix0 = NB.bx0 * n, iy0 = NB.by0 * n, nx = (NB.bx1 - NB.bx0) * n, ny = (NB.by1 - NB.by0) * n;
  const Rl = fillPolys(fine, 0, 0, c * 1000, M.nx, M.ny);
  const nfine = fine.map(p => { const xs = new Float64Array(p.xs.length), zs = new Float64Array(p.xs.length); for (let j = 0; j < xs.length; j++){ const g = leg2nat(p.xs[j] / 1000, p.zs[j] / 1000); xs[j] = g.x * 1000; zs[j] = g.y * 1000; } return {xs, zs}; });
  const Rn = fillPolys(nfine, ix0 * c * 1000, iy0 * c * 1000, c * 1000, nx, ny), out = new Uint8Array(nx * ny), q = [0, 0];
  let fixed = 0;
  for (let r = 0; r < ny; r++){ const row = inv.row((iy0 + r + 0.5) * c); for (let k = 0; k < nx; k++){
    row((ix0 + k + 0.5) * c, q);
    const lx = Math.floor(q[0] / c), ly = Math.floor(q[1] / c), o = r * nx + k;
    if (lx < 0 || ly < 0 || lx >= M.nx || ly >= M.ny){ out[o] = M.arr[clampI(ly, M.ny) * M.nx + clampI(lx, M.nx)]; continue; }
    const li = ly * M.nx + lx;
    if (M.arr[li] !== Rl[li]){ out[o] = M.arr[li]; fixed++; } else out[o] = Rn[o];
  } }
  return {c, ix0, iy0, nx, ny, n, type:'u8', kind:M.kind, dec:null, arr:out, fixed};
}
function cut(L, bx, by){
  const n = L.n, out = new ARR[L.type](n * n), lx = (bx * n - L.ix0), ly = (by * n - L.iy0);
  for (let r = 0; r < n; r++) out.set(L.arr.subarray((ly + r) * L.nx + lx, (ly + r) * L.nx + lx + n), r * n);
  return L.type === 'i16' ? med16(out, n) : Buffer.from(out.buffer);
}
// the layers in the national frame (exported for the checks in tests/maptest.py's helper and tools/)
export function nationalLayers(data){
  const leg = readSenja(data), B = legacyBox(), inv = fitInverse(B);
  const NB = {bx0:Math.floor(B.x0 / BLOCK), by0:Math.floor(B.y0 / BLOCK), bx1:Math.ceil(B.x1 / BLOCK), by1:Math.ceil(B.y1 / BLOCK)};
  const mask = nationalMask(leg.mask, leg.fine, NB, inv, B);
  const dc = coastDist(mask.arr, mask.nx, mask.ny);
  return {box:B, NB, layers:{
    mask,
    depth:resample(leg.depth, NB, inv, 'bilinear'),
    dc:{c:0.1, ix0:mask.ix0 / 4, iy0:mask.iy0 / 4, nx:dc.nx, ny:dc.ny, n:100, type:'f32', kind:'core', dec:null, arr:dc.d},
    expo:resample(leg.expo, NB, inv, 'bilinear'),
    hgt:resample(leg.hgt, NB, inv, 'hgt'),
    forest:resample(leg.forest, NB, inv, 'nearest')
  }};
}
// the packs are made again only when their sources change (the data, this file, the projection)
function sourceKey(data){
  const h = crypto.createHash('sha256');
  for (const f of ['geo-mask.b64', 'geo-depth.b64', 'geo-expo.b64', 'hgt.b64', 'geo-forest.b64', 'geo-fine.b64']) h.update(readFileSync(join(data, f)));
  h.update(readFileSync(fileURLToPath(import.meta.url))); h.update(readFileSync(PROJ_SRC));
  return h.digest('hex').slice(0, 16);
}
export function writeMap(data, out){
  const key = sourceKey(data);
  try { const old = JSON.parse(readFileSync(join(out, 'manifest.json'), 'utf8')); if (old.src === key && old.packs.every(p => existsSync(join(out, p.file)))) return {packs:old.packs.length, bytes:old.packs.reduce((a, p) => a + p.bytes, 0), kept:true}; } catch (e){}
  const {box, NB, layers} = nationalLayers(data);
  if (existsSync(out)) rmSync(out, {recursive:true});
  mkdirSync(out, {recursive:true});
  const man = {v:2, frame:'utm33', block:BLOCK, tile:TILE, src:key, box:[box.x0, box.y0, box.x1, box.y1].map(v => +v.toFixed(6)), layers:{}, packs:[]};
  const groups = new Map(), T = TILE / BLOCK;
  for (const [name, L] of Object.entries(layers)){
    man.layers[name] = {c:L.c, ix0:L.ix0, iy0:L.iy0, nx:L.nx, ny:L.ny, n:L.n, type:L.type, kind:L.kind, dec:L.dec};
    for (let by = NB.by0; by < NB.by1; by++) for (let bx = NB.bx0; bx < NB.bx1; bx++){
      const tile = L.kind === 'core' ? [0, 0] : [Math.floor(bx / T), Math.floor(by / T)], k = L.kind + '-' + tile.join('-');
      if (!groups.has(k)) groups.set(k, {kind:L.kind, tile, blocks:[]});
      groups.get(k).blocks.push([name, bx, by, zlib.deflateRawSync(cut(L, bx, by), {level:9})]);
    }
  }
  let total = 0;
  for (const g of groups.values()){
    let off = 0; const head = {kind:g.kind, tile:g.tile, blocks:g.blocks.map(([l, bx, by, z]) => { const e = [l, bx, by, off, z.length]; off += z.length; return e; })};
    const hj = Buffer.from(JSON.stringify(head)), hl = Buffer.alloc(4); hl.writeUInt32LE(hj.length);
    const file = Buffer.concat([Buffer.from('KMP1'), hl, hj, ...g.blocks.map(b => b[3])]);
    const hash = crypto.createHash('sha256').update(file).digest('hex').slice(0, 12), name = g.kind + '-' + g.tile.join('-') + '-' + hash + '.wasm';
    writeFileSync(join(out, name), file); total += file.length;
    const pbox = g.kind === 'core' ? null : [g.tile[0] * TILE, g.tile[1] * TILE, (g.tile[0] + 1) * TILE, (g.tile[1] + 1) * TILE];
    man.packs.push({file:name, hash, kind:g.kind, tile:g.tile, box:pbox, bytes:file.length});
  }
  man.packs.sort((a, b) => a.file < b.file ? -1 : 1);
  writeFileSync(join(out, 'manifest.json'), JSON.stringify(man));
  return {packs:man.packs.length, bytes:total, fixed:layers.mask.fixed};
}
