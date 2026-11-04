// The core for the wide frame (H1b R2 of the ocean step, docs/planer/havsteget-h1b-rammen.md, kart-og-terreng.md 4.9c): the manifest
// in src/data/map has the old layers as they were (land200, dc200, expo over 0-1450 x 0-1750 km, the same values: dc200 and expo now
// 'u8p', checked against the hash tools/map/ramme.py inject took of the old bytes), and the coarse layers (land1k, dc1k, expo2k) and
// the sea floor (deep) over the whole frame, with a block wherever the fine layers do not answer. coast0 is in its own pack.
import { readFileSync } from 'node:fs';
import { inflateRawSync } from 'node:zlib';
import { createHash } from 'node:crypto';
export default function (t){
  const K = t.K, MAPB = K.MAPB, mapDecode = K.mapDecode, D = new URL('../../src/data/map/', import.meta.url);
  const man = JSON.parse(readFileSync(new URL('manifest.json', D), 'utf8')), Ls = man.layers;
  const core = man.packs.filter(p => p.kind === 'core'); t.ok(core.length === 1, 'én kjernepakke');
  const buf = readFileSync(new URL(core[0].file, D)), hl = buf.readUInt32LE(4), head = JSON.parse(buf.subarray(8, 8 + hl).toString()), at = 8 + hl;
  const has = new Set(head.blocks.map(e => e[0] + ':' + e[1] + ':' + e[2]));
  // (the plan's goal of 3.5 MB is not met: 4.7 MB, most of it GEBCO's sea floor over the whole frame; the backlog has the levers. This
  // keeps it from growing further unnoticed)
  t.ok(buf.length <= 4.8e6, 'kjernen er ' + (buf.length / 1e6).toFixed(2) + ' MB, høyst 4,8 (målet 3,5 er ikke nådd, se BACKLOG)');
  // the old layers keep their cells
  for (const [nm, c] of [['land200', 0.2], ['dc200', 0.2], ['expo', 0.5]]){ const L = Ls[nm];
    t.ok(L && L.c === c && L.ix0 === 0 && L.iy0 === 0 && L.nx * c === 1450 && L.ny * c === 1750 && L.kind === 'core', nm + ' har den gamle utstrekningen (0–1 450 × 0–1 750 km)'); }
  // the old values: the hash ramme.py took of the u8 bytes before the predictor, against what the game decodes
  for (const nm of ['land200', 'dc200', 'expo']){
    const L = Object.assign({name:nm}, Ls[nm]), h = createHash('sha256');
    for (const e of head.blocks) if (e[0] === nm){ const raw = new Uint8Array(inflateRawSync(buf.subarray(at + e[3], at + e[3] + e[4]))); h.update(mapDecode(L, raw)); }
    t.ok(man.check && h.digest('hex').slice(0, 16) === man.check[nm], nm + ' har de samme verdiene som før (' + Ls[nm].type + ')');
  }
  // the coarse layers and deep cover the whole frame, with a block wherever the old frame's fine layers are not within 50 km
  for (const nm of ['land1k', 'dc1k', 'expo2k', 'deep']){
    const L = Ls[nm]; t.ok(!!L && L.kind === 'core', nm + ' er i kjernen'); if (!L) continue;
    t.ok(L.ix0 * L.c <= MAPB.x0 && L.iy0 * L.c <= MAPB.y0 && (L.ix0 + L.nx) * L.c >= MAPB.x1 && (L.iy0 + L.ny) * L.c >= MAPB.y1, nm + ' dekker hele rammen (' + [L.ix0 * L.c, L.iy0 * L.c, (L.ix0 + L.nx) * L.c, (L.iy0 + L.ny) * L.c].join(', ') + ' km)');
    let miss = 0, n = 0; const bk = L.n * L.c;
    for (let by = L.iy0 / L.n; by < (L.iy0 + L.ny) / L.n; by++) for (let bx = L.ix0 / L.n; bx < (L.ix0 + L.nx) / L.n; bx++){
      const x0 = bx * bk, y0 = by * bk, inner = x0 >= 50 && y0 >= 50 && x0 + bk <= 1400 && y0 + bk <= 1700; if (nm !== 'deep' && inner) continue; n++; if (!has.has(nm + ':' + bx + ':' + by)) miss++; }
    t.ok(miss === 0, nm + ': alle ' + n + ' blokkene utenfor den gamle rammens indre har data');
  }
  t.ok(!head.blocks.some(e => e[0] === 'coast0'), 'coast0 er ikke i kjernen lenger');
  const c0 = man.packs.filter(p => p.kind === 'chart0'); t.ok(c0.length === 1, 'coast0 har sin egen pakke (chart0)');
  // a few places read through the game's own decoder: the land and the sea floor where they are known
  const cell = (nm, x, y) => { const L = Object.assign({name:nm}, Ls[nm]), ix = Math.floor(x / L.c), iy = Math.floor(y / L.c), bx = Math.floor(ix / L.n), by = Math.floor(iy / L.n);
    const e = head.blocks.find(b => b[0] === nm && b[1] === bx && b[2] === by); if (!e) return null;
    return mapDecode(L, new Uint8Array(inflateRawSync(buf.subarray(at + e[3], at + e[3] + e[4]))))[(iy - by * L.n) * L.n + (ix - bx * L.n)]; };
  const P = K.natP;
  for (const [nm, la, lo, land] of [['Spitsbergen (Longyearbyen-dalen)', 78.2, 15.8, 1], ['Bjørnøya-havet', 74.0, 21.0, 0], ['Island (innlandet)', 64.9, -18.5, 1], ['Danmarkstredet', 66.5, -27.0, 0],
    ['Novaja Semlja', 74.0, 56.0, 1], ['Petsjorahavet', 69.5, 52.0, 0], ['Færøyane-havet', 62.6, -6.0, 0]]){
    const p = P(la, lo), v = cell('land1k', p.x, p.y); t.ok(v === land, nm + ' er ' + (land ? 'land' : 'sjø') + ' i land1k');
    if (!land){ const d = cell('deep', p.x, p.y) * 10; t.ok(d > 20, nm + ': dypet er ' + d + ' m'); }
  }
  { const p = P(74.0, 21.0), d = cell('deep', p.x, p.y) * 10; t.ok(d > 50 && d < 600, 'Bjørnøya-havet har bankdyp (' + d + ' m)'); }
  { const p = P(70.5, 0.0), d = cell('deep', p.x, p.y) * 10; t.ok(d > 1500, 'Norskehavet er djupt (' + d + ' m)'); }
}
