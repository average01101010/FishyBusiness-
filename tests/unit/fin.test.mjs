// The fine ground along the sea, the layer 'fin' (Ø13 K1, 11.11.2026; core/01b-mapdata.js finH): 12.5 m cells in half metres in a
// strip along the sea, 0 «no fine ground here», -1 the foreshore's sea. Checked here with a real pack (KMP1, the median predictor and
// raw deflate, as tools/map/fin.py writes it) put where a fetched one would be:
//   the layer's numbers are half metres kept as Int16 (not Float32: 1.28 MB a block, not 2.56)
//   finH gives the fine ground where it is and the 25 m ground (the h it is handed) elsewhere; a cell of 0 reads as «none»
//   a block the pack does not have, a tile without a pack and a pack that has not come are not errors and do not count in MAPD.miss
//   the edge of the strip is even: no step from the fine ground to the 25 m ground, inland or towards the sea
//   beside the sea the land keeps its own height to the cells' border (the sea's cells do not pull it down), and at sea it is the 25 m ground
import zlib from 'node:zlib';
export default function (t){
  const K = t.K, MAPD = K.MAPD;
  t.ok(typeof K.finH === 'function' && typeof K.mapLayerK === 'function', 'lasteren har finH og mapLayerK');
  if (typeof K.finH !== 'function' || typeof K.mapLayerK !== 'function') return;
  globalThis.fflate = {inflateSync:b => new Uint8Array(zlib.inflateRawSync(b))};
  const n = 800, def = {c:0.0125, ix0:64000, iy0:24800, nx:8000, ny:7200, n, type:'i16', kind:'fin', dec:'half'};
  const L = Object.assign({name:'fin', id:20, bx:NaN, by:NaN, ox:NaN, oy:NaN, b:null, k:K.mapLayerK(def)}, def);
  MAPD.man = {tile:50, block:10}; MAPD.L.fin = L;
  t.eq(L.k, 0.5, 'laget fin leses i halve meter (k)');
  // the median predictor and the zigzag, as tools/map/pack.py med16
  const med16 = q => { const N = n * n, out = new Uint8Array(2 * N);
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++){ const i = r * n + c, a = c ? q[i - 1] : 0, b = r ? q[i - n] : 0, cc = r && c ? q[i - n - 1] : 0, pr = cc >= Math.max(a, b) ? Math.min(a, b) : cc <= Math.min(a, b) ? Math.max(a, b) : a + b - cc, d = q[i] - pr, z = (d << 1) ^ (d >> 31); out[i] = z & 255; out[N + i] = (z >>> 8) & 255; }
    return out; };
  // block (85, 32) of tile (17, 6): columns 0-199 «none», 200-599 land (a slope, 3 m at column 200 and half a metre more a column;
  // 40 m flat from row 600 down), 600-601 the foreshore's sea (-1), 602- «none»
  const BX = 85, BY = 32, q = new Int16Array(n * n), land = (i, j) => j >= 600 ? 80 : 6 + (i - 200);
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) q[j * n + i] = i < 200 ? 0 : i < 600 ? land(i, j) : i < 602 ? -1 : 0;
  const z = zlib.deflateRawSync(med16(q)), pk = {file:'fin-17-6-test.wasm', hash:'test', kind:'fin', tile:[17, 6], bytes:z.length, buf:new Uint8Array(z), idx:new Map([['fin:' + BX + ':' + BY, [0, z.length]]]), vec:{}};
  MAPD.byTile.set('fin:17:6', pk); MAPD.miss = 0;
  const cm = 12.5, X = i => (BX * n + i + 0.5) * cm, Z = j => (BY * n + j + 0.5) * cm, H25 = 7.25;
  // the cells themselves: Int16, half metres
  const blk = K.mapBlock(L, BX, BY);
  t.ok(blk instanceof Int16Array && blk.byteLength === 2 * n * n, 'en blokk fin er Int16 (' + blk.constructor.name + ', ' + (blk.byteLength / 1e6).toFixed(2) + ' MB)');
  let bad = 0; for (let k = 0; k < q.length; k += 37) if (blk[k] !== q[k]) bad++;
  t.eq(bad, 0, 'pakken leses celle for celle som den ble skrevet');
  // fine where it is: in a cell's centre the cell's own height, between two centres the mean
  t.near(K.finH(X(300), Z(100), H25), (6 + 100) / 2, 1e-9, 'i en fin celle er bakken cellas høyde');
  t.near(K.finH(X(300) + cm / 2, Z(100), H25), (6 + 100.5) / 2, 1e-9, 'mellom to celler er den midt mellom dem');
  t.near(K.finH(X(300), Z(700), H25), 40, 1e-9, 'og 40 m på flata');
  // 25 m elsewhere: «none» cells, a block the pack lacks, a tile without a pack, a pack that has not come
  t.eq(K.finH(X(50), Z(100), H25), H25, 'en celle med 0 leses som «ingen»: 25 m-bakken');
  t.eq(K.finH(X(700), Z(100), -12), -12, 'utenfor fjæra er det 25 m-bakken (sjøbunnen)');
  t.eq(K.finH(X(n + 300), Z(100), H25), H25, 'en blokk pakken ikke har, gir 25 m-bakken');
  t.eq(K.finH(X(300) - 50000 * 3, Z(100), H25), H25, 'en flis uten fin-pakke gir 25 m-bakken');
  MAPD.byTile.set('fin:16:6', {file:'fin-16-6-x.wasm', kind:'fin', tile:[16, 6], buf:null, idx:null});
  t.eq(K.finH(X(300) - 50000, Z(100), H25), H25, 'en pakke som ikke er kommet, gir 25 m-bakken');
  let thrown = 0; for (let k = 0; k < 2000; k++){ try { K.finH(X(n + 5 + k), Z(k % 700), H25); K.finH(X(-3 - k), Z(900 + k), H25); } catch (e){ thrown++; } }
  t.ok(thrown === 0 && MAPD.miss === 0, 'ingen av dem er en feil, og ingen telles i MAPD.miss (' + thrown + ' kast, miss ' + MAPD.miss + ')');
  // a pack that comes later is read (the «not here» that was remembered is forgotten when the packs change: MAPD.gen)
  const pk2 = MAPD.byTile.get('fin:16:6'); t.eq(K.finH(X(300) - 50000, Z(100), H25), H25, 'før pakken kommer: 25 m');
  pk2.buf = pk.buf; pk2.idx = new Map([['fin:' + (BX - 5) + ':' + BY, [0, z.length]]]); MAPD.gen++;
  t.near(K.finH(X(300) - 50000, Z(100), H25), 53, 1e-9, 'når pakken er kommet, leses den');
  // the inland edge of the strip (columns 199 | 200): from the 25 m ground to the fine ground over one cell, no step
  const h25 = x => 2 + (x - X(190)) * 0.01;   // a 25 m ground that is not the fine one: 1 m lower at the edge
  let step = 0, prev = NaN; for (let x = X(196); x <= X(204); x += 0.05){ const h = K.finH(x, Z(100), h25(x)); if (prev === prev) step = Math.max(step, Math.abs(h - prev)); prev = h; }
  t.ok(step < 0.02, 'kanten inn mot land er jevn: største sprang ' + step.toFixed(4) + ' m per 5 cm over åtte celler');
  t.near(K.finH(X(199), Z(100), h25(X(199))), h25(X(199)), 1e-9, 'i den siste cella uten fin bakke er det 25 m-bakken');
  t.near(K.finH(X(200), Z(100), h25(X(200))), 3, 1e-9, 'og i den første med, den fine');
  // the same along a row where the fine ground changes too (the corner of the slope and the flat)
  step = 0; prev = NaN; for (let x = X(196); x <= X(204); x += 0.05){ const h = K.finH(x, Z(599) + 3, h25(x)); if (prev === prev) step = Math.max(step, Math.abs(h - prev)); prev = h; }
  t.ok(step < 0.2, 'også der den fine bakken selv knekker (' + step.toFixed(3) + ' m per 5 cm)');
  // beside the sea (columns 599 land | 600 sea): the land keeps its height to the cells' border, then goes evenly to the 25 m ground
  const top = (6 + 399) / 2;
  t.near(K.finH(X(599), Z(100), -4), top, 1e-9, 'den ytterste landcella har sin egen høyde');
  t.near(K.finH(X(599) + 6, Z(100), -4), top, 1e-9, 'og holder den ut til grensa mot sjøcella (sjøcellene drar ikke landet ned)');
  t.eq(K.finH(X(600), Z(100), -4), -4, 'i sjøcella er det 25 m-bakken');
  let down = true; step = 0; prev = NaN; for (let x = X(599); x <= X(601); x += 0.05){ const h = K.finH(x, Z(100), -4); if (prev === prev){ if (h > prev + 1e-9) down = false; step = Math.max(step, prev - h); } prev = h; }
  t.ok(down && step < 2, 'mellom dem faller bakken jevnt fra landet til 25 m-bakken, uten sprang (største ' + step.toFixed(2) + ' m per 5 cm av ' + (top + 4).toFixed(1) + ' m)');
  // exactly in a sea cell's centre with a land cell diagonally beside it: the land's weight is 0, and the answer is the 25 m ground, not NaN
  q[10 * n + 700] = -1; q[10 * n + 701] = -1; q[11 * n + 700] = -1; q[11 * n + 701] = 50; MAPD.blk.clear(); MAPD.bytes = 0; L.b = null; L.ox = L.oy = NaN;
  const z2 = zlib.deflateRawSync(med16(q)); pk.buf = new Uint8Array(z2); pk.idx = new Map([['fin:' + BX + ':' + BY, [0, z2.length]]]); MAPD.gen++;
  t.eq(K.finH(X(700), Z(10), -3), -3, 'midt i en sjøcelle med land på skrå ved siden av: 25 m-bakken, ikke NaN');
  t.eq(K.finH(X(700), Z(10) + 4, -3), -3, 'og rett sør for den, langs kanten der landet ikke har vekt');
  t.eq(MAPD.miss, 0, 'MAPD.miss er fortsatt 0');
}
