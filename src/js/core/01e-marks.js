// ===== THE SEA MARKS ALONG THE WHOLE COAST (05.10.2026; Jonas: «Sjømerker må ordnes langs hele kysten. Alt senja har, må resten av
// norge ha også. Dette er ikke en senja-simulator») =====
// Lights with their sectors, beacons, stakes, buoys, cairns and rocks from OpenStreetMap's seamark tags (tools/map/sjomerker.py), in
// each tile's chart pack as its 'marks' entry (tools/map/game.py), in the format of SEAMARKS (01-world.js) and in the national frame
// already. A tile's marks are read when its chart pack's coast is built (coastDone, 01d-coast.js): round every boat and set (the
// simulation's barrier), over the chart plotter's window, along Autonav's way and round the 3D view. Inside Senja's legacy square the
// embedded SEAMARKS stay. A build without them (an older release) has Senja's alone.
//   marksNear(kind, x, y, R)  the lights, marks or rocks of SEAMARKS and of the tiles within R km of x, y (km)
//   rocksIn (01-world.js)     takes the tiles' rocks too, by 1 km cell
const MARKS = {tiles:new Map(), ver:0, rk:new Map(), n:0, near:new Map()};
function marksAdd(pk){
  const k = pk.tile[0] + ':' + pk.tile[1]; if (MARKS.tiles.has(k)) return;
  const v = mapVec(pk, 'marks'); MARKS.tiles.set(k, null); if (!v) return;
  let J; try { J = JSON.parse(new TextDecoder().decode(v.b)); } catch (e){ console.error('marks ' + k, e); return; }
  const keep = a => (a || []).filter(q => !inSenja(q[0], q[1]));
  const t = {k, tx:pk.tile[0], ty:pk.tile[1], lights:keep(J.lights), marks:keep(J.marks), rocks:keep(J.rocks)};
  for (const q of t.rocks){ q.o = ++MARKS.n; const g = gridKey(Math.floor(q[0]), Math.floor(q[1])); let a = MARKS.rk.get(g); if (!a) MARKS.rk.set(g, a = []); a.push(q); }
  MARKS.tiles.set(k, t); MARKS.ver++; MARKS.near.clear();
}
// the tiles' rocks in the 1 km cells over a box of km, in the order they came
function marksRocksIn(x0, y0, x1, y1){
  if (!MARKS.rk.size) return null; const out = [];
  for (let gy = Math.floor(y0); gy <= Math.floor(y1); gy++) for (let gx = Math.floor(x0); gx <= Math.floor(x1); gx++){ const a = MARKS.rk.get(gridKey(gx, gy)); if (a) for (const q of a) out.push(q); }
  return out.sort((a, b) => a.o - b.o);
}
function marksNear(kind, x, y, R){
  const T = MAPD.man ? MAPD.man.tile : 50, tx0 = Math.floor((x - R) / T), tx1 = Math.floor((x + R) / T), ty0 = Math.floor((y - R) / T), ty1 = Math.floor((y + R) / T);
  const key = kind + '|' + tx0 + ',' + ty0 + ',' + tx1 + ',' + ty1 + '|' + MARKS.ver; let a = MARKS.near.get(key); if (a) return a;
  a = SEAMARKS[kind].slice();
  for (let ty = ty0; ty <= ty1; ty++) for (let tx = tx0; tx <= tx1; tx++){ const t = MARKS.tiles.get(tx + ':' + ty); if (t) for (const q of t[kind]) a.push(q); }
  if (MARKS.near.size > 24) MARKS.near.clear(); MARKS.near.set(key, a); return a;
}

// ===== THE NAMES OF THE FISHING GROUNDS ALONG THE WHOLE COAST (B2 of docs/planer/bestand-og-flaate.md, 01.11.2026) =====
// Fiskeridirektoratet's «Fiskeplasser – redskap» (the grounds for active and passive gear, from interviews with the fishermen, NLOD),
// made by tools/npc/felt.py into src/data/felt.json: a label point, a name, a size and the kind of gear for 4 683 grounds. The chart
// plotter writes them as names without a circle (ui/03-map.js). Where a stretch has no mapped grounds, there are no names, and the NPC
// boats keep the slope rule for theirs (tools/map/npc.py). The file is a string in the page and is read the first time it is asked for.
// Ø14 F1 (docs/planer/fangstfelt.md, 08.11.2026): each ground also has its kind (k: 'f' a fishing ground, 'g' a spawning ground, 'o' a
// nursery and feeding ground, the last two from the same interviews and only names, V3), the species the game knows with the gear and
// the months the fishermen gave (l, V2 A), the washed name (n for the chart, nf whole), and its shape (feltShape, from a file of its
// own). Senja's grounds are as all the others (Jonas 08.11.2026: «Senja sine felt skal fungere akkurat likt som alle de andre
// fiskefeltene i landet og ikke være en fast sirkel»), so the grounds within 1.5 km of GROUNDS are no longer left out.
//   feltData()              all the grounds: {i, x, y, n (name for the chart; '' when the source had only a position), nf (whole name),
//                           r (size, km), g ('a' active, 'p' passive, 'b' both, '-' none), k ('f', 'g', 'o'),
//                           l ([[species, gear bits after FELT.gear (meta.gear: GEAR of tools/npc/fiske.py), month bits with 1 << 0 for January], ...]; [] when none the game knows)}
//   feltIn(x0, y0, x1, y1)  the named fishing grounds (k = f) in a box (km), the largest first; the spawning and nursery grounds come to
//                           the chart with F4
//   feltShape(f)            the ground's rings in km ([Float64Array [x, y, x, y, ...], ...]; [] for g and o), null while the file has not
//                           come, false for good when it did not come or does not match felt.json (the ground's point and r then)
const FELT_T = /*@text(data/felt.json)*/null;
const FELT = {d:null, cell:10, grid:null, sp:[], gear:[], n:0, sb:0, S:null};
function feltData(){
  if (FELT.d !== null) return FELT.d;
  let D = null; try { D = typeof FELT_T === 'string' ? JSON.parse(FELT_T) : FELT_T; } catch (e){ D = null; }
  if (!D || !D.p){ FELT.d = false; return false; }
  const u = D.meta.unit, out = [], grid = new Map(), sp = FELT.sp = D.meta.sp || [], nf = new Map(D.nf || []); let x = 0, y = 0;
  FELT.gear = D.meta.gear || []; FELT.n = D.n.length; FELT.sb = D.meta.sb || 0; FELT.unit = u;
  for (let i = 0; i < D.n.length; i++){
    x += D.p[i * 2]; y += D.p[i * 2 + 1];
    const f = {i, x:x * u, y:y * u, n:D.n[i], nf:nf.get(i) || D.n[i], r:D.r[i] / 10, g:D.g[i], k:D.k ? D.k[i] : 'f',
      l:D.l ? D.l[i].map(q => [sp[q[0]], q[1], q[2]]) : []};
    out.push(f); const k = gridKey(Math.floor(f.x / FELT.cell), Math.floor(f.y / FELT.cell)); let a = grid.get(k); if (!a) grid.set(k, a = []); a.push(f);
  }
  FELT.grid = grid; FELT.d = out; return out;
}
function feltIn(x0, y0, x1, y1){
  if (!feltData()) return []; const out = [], c = FELT.cell;
  for (let gy = Math.floor(y0 / c); gy <= Math.floor(y1 / c); gy++) for (let gx = Math.floor(x0 / c); gx <= Math.floor(x1 / c); gx++){
    const a = FELT.grid.get(gridKey(gx, gy)); if (a) for (const f of a) if (f.k === 'f' && f.n && f.x >= x0 && f.x <= x1 && f.y >= y0 && f.y <= y1) out.push(f); }
  return out.sort((a, b) => b.r - a.r);
}
// the shapes (felt-s.b64, tools/npc/felt.py: varints, zigzag for the signed): a data element the build takes out of the page as
// data/felt-s-<hash>.bin, fetched at boot as the models (ui/11-boot.js, DATAB), base64 in the element in a one-file build. Decoded the
// first time a shape is asked for; a file that does not match felt.json (its length or its count) gives no shapes (false), never wrong ones.
function feltShapesFrom(bytes){
  if (!feltData() || !bytes || (FELT.sb && bytes.length !== FELT.sb)) return false;
  let o = 0; const rd = () => { let v = 0, m = 1, b; do { b = bytes[o++]; v += (b & 127) * m; m *= 128; } while (b & 128); return v; }, zs = v => (v % 2 ? -(v + 1) / 2 : v / 2);
  if (rd() !== FELT.n) return false;
  const u = FELT.unit, out = new Array(FELT.n);
  for (let i = 0; i < FELT.n; i++){
    const f = FELT.d[i], nr = rd(), R = []; let px = Math.round(f.x / u), py = Math.round(f.y / u);
    for (let j = 0; j < nr; j++){ const np = rd(), r = new Float64Array(np * 2); let x = px, y = py;
      for (let q = 0; q < np; q++){ x += zs(rd()); y += zs(rd()); r[q * 2] = x * u; r[q * 2 + 1] = y * u; } R.push(r); }
    out[i] = R;
  }
  return o === bytes.length ? out : false;
}
function feltShape(f){
  if (FELT.S === null){
    let b = null;
    if (typeof DATAB !== 'undefined' && DATAB.has('felt-s')) b = DATAB.get('felt-s');
    else if (typeof document !== 'undefined'){ const el = document.getElementById('felt-s'); if (el && !el.dataset.src && el.textContent.trim()) b = b64bytes(el.textContent.trim()); }
    if (!b){                                // not come yet (null: asked again next time), or never (the fetch failed in four tries: false)
      if (typeof MODELS !== 'undefined' && MODELS.failed && MODELS.failed.includes('felt-s')) FELT.S = false;
      return FELT.S === false ? false : null; }
    FELT.S = feltShapesFrom(b) || false; if (typeof DATAB !== 'undefined') DATAB.delete('felt-s');
  }
  return FELT.S ? FELT.S[f.i] || [] : false;
}
