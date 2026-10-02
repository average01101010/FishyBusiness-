// The map's rasters in 10 km blocks, packed for dist/map/ (phase K3 of the coast plan). build.mjs calls writeMap(srcData, outDir).
// Today the data are Senja's, in the legacy frame (km from 69.72 N 16.55 E); the rasters are decoded here exactly as the game
// decoded them from the page, the distance to the shore is worked out here (it was worked out in the page at load), and each layer
// is cut into blocks of 10 km that are deflated one by one. A pack holds the blocks of one kind in one 50 km tile:
//   core  mask (land, 25 m), dc (distance to the shore, 100 m), expo (openness to the ocean, 500 m)   always loaded
//   sim   depth (half metres, 50 m)                                                                  loaded near the boats before the clock runs
//   view  hgt (ground height, 25 m), forest (50 m)                                for the 3D view, as it comes
// Pack: 'KMP1', u32 header length, the header (JSON: {kind, tile, blocks:[[layer, bx, by, offset, length], ...]}), the blocks.
// The file name carries the first 12 hex of the pack's SHA-256, so a browser can keep it by content (map/manifest.json lists them).
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import zlib from 'node:zlib';
import crypto from 'node:crypto';

const BLOCK = 10, TILE = 50;
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
export function readSenja(data){
  const MASK = rle(b64(join(data, 'geo-mask.b64')), 3140, 3296);
  const DC = coastDist(MASK, 3140, 3296);
  const EXPO = new Uint8Array(b64(join(data, 'geo-expo.b64')));
  const depthQ = pred16(zlib.inflateSync(b64(join(data, 'geo-depth.b64'))), 1570, 1648, Int32Array);
  const hgtH = pred16(zlib.inflateSync(b64(join(data, 'hgt.b64'))), 3140, 3296, Int16Array);
  const FOREST = rle(b64(join(data, 'geo-forest.b64')), 1570, 1648);
  const depth = Int16Array.from(depthQ, v => { if (v < -32768 || v > 32767) throw new Error('depth out of Int16'); return v; });
  return {
    mask:{c:0.025, nx:3140, ny:3296, type:'u8', kind:'core', arr:MASK},
    depth:{c:0.05, nx:1570, ny:1648, type:'i16', kind:'sim', dec:'half', arr:depth},
    dc:{c:0.1, nx:DC.nx, ny:DC.ny, type:'f32', kind:'core', arr:DC.d},
    expo:{c:0.5, nx:157, ny:165, type:'u8', kind:'core', arr:EXPO},
    hgt:{c:0.025, nx:3140, ny:3296, type:'i16', kind:'view', dec:'hgt', arr:hgtH},
    forest:{c:0.05, nx:1570, ny:1648, type:'u8', kind:'view', arr:FOREST}
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
function cut(L, bx, by){
  const n = Math.round(BLOCK / L.c), out = new ARR[L.type](n * n);
  for (let r = 0; r < n; r++){ const y = by * n + r; if (y >= L.ny) break; const x0 = bx * n, x1 = Math.min(L.nx, x0 + n); if (x1 > x0) out.set(L.arr.subarray(y * L.nx + x0, y * L.nx + x1), r * n); }
  return L.type === 'i16' ? med16(out, n) : Buffer.from(out.buffer);
}
export function writeMap(data, out){
  const layers = readSenja(data);
  if (existsSync(out)) rmSync(out, {recursive:true});
  mkdirSync(out, {recursive:true});
  const man = {v:1, frame:'legacy-senja', block:BLOCK, tile:TILE, layers:{}, packs:[]};
  const groups = new Map();
  for (const [name, L] of Object.entries(layers)){
    const n = Math.round(BLOCK / L.c), nbx = Math.ceil(L.nx / n), nby = Math.ceil(L.ny / n);
    man.layers[name] = {c:L.c, nx:L.nx, ny:L.ny, n, type:L.type, kind:L.kind, dec:L.dec || null};
    for (let by = 0; by < nby; by++) for (let bx = 0; bx < nbx; bx++){
      const tile = L.kind === 'core' ? [0, 0] : [Math.floor(bx * BLOCK / TILE), Math.floor(by * BLOCK / TILE)], key = L.kind + '-' + tile.join('-');
      if (!groups.has(key)) groups.set(key, {kind:L.kind, tile, blocks:[]});
      groups.get(key).blocks.push([name, bx, by, zlib.deflateRawSync(cut(L, bx, by), {level:9})]);
    }
  }
  let total = 0;
  for (const g of groups.values()){
    let off = 0; const head = {kind:g.kind, tile:g.tile, blocks:g.blocks.map(([l, bx, by, z]) => { const e = [l, bx, by, off, z.length]; off += z.length; return e; })};
    const hj = Buffer.from(JSON.stringify(head)), hl = Buffer.alloc(4); hl.writeUInt32LE(hj.length);
    const file = Buffer.concat([Buffer.from('KMP1'), hl, hj, ...g.blocks.map(b => b[3])]);
    const hash = crypto.createHash('sha256').update(file).digest('hex').slice(0, 12), name = g.kind + '-' + g.tile.join('-') + '-' + hash + '.wasm';
    writeFileSync(join(out, name), file); total += file.length;
    const box = g.kind === 'core' ? null : [g.tile[0] * TILE, g.tile[1] * TILE, (g.tile[0] + 1) * TILE, (g.tile[1] + 1) * TILE];
    man.packs.push({file:name, hash, kind:g.kind, tile:g.tile, box, bytes:file.length});
  }
  man.packs.sort((a, b) => a.file < b.file ? -1 : 1);
  writeFileSync(join(out, 'manifest.json'), JSON.stringify(man));
  return {packs:man.packs.length, bytes:total};
}
