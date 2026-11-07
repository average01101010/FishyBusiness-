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
// made by tools/npc/felt.py into src/data/felt.json: a label point, a name, a size and the kind of gear for 4 684 grounds. The chart
// plotter writes them as names without a circle, as Senja's grounds (ui/03-map.js); Senja's own names (GROUNDS) win within 1.5 km.
// Where a stretch has no mapped grounds, there are no names, and the NPC boats keep the slope rule for theirs (tools/map/npc.py).
// The file is a string in the page and is read the first time the chart asks (128 kB).
//   feltIn(x0, y0, x1, y1)  the grounds in a box (km), the largest first: {x, y, n (name), r (size, km), g ('a' active, 'p' passive, 'b' both)}
const FELT_T = /*@text(data/felt.json)*/null;
const FELT = {d:null, cell:10, grid:null};
function feltData(){
  if (FELT.d !== null) return FELT.d;
  let D = null; try { D = typeof FELT_T === 'string' ? JSON.parse(FELT_T) : FELT_T; } catch (e){ D = null; }
  if (!D || !D.p){ FELT.d = false; return false; }
  const u = D.meta.unit, out = [], grid = new Map(); let x = 0, y = 0;
  for (let i = 0; i < D.n.length; i++){
    x += D.p[i * 2]; y += D.p[i * 2 + 1];
    const f = {x:x * u, y:y * u, n:D.n[i], r:D.r[i] / 10, g:D.g[i]};
    if (GROUNDS.some(g => Math.hypot(g.p.x - f.x, g.p.y - f.y) < 1.5)) continue;
    out.push(f); const k = gridKey(Math.floor(f.x / FELT.cell), Math.floor(f.y / FELT.cell)); let a = grid.get(k); if (!a) grid.set(k, a = []); a.push(f);
  }
  FELT.grid = grid; FELT.d = out; return out;
}
function feltIn(x0, y0, x1, y1){
  if (!feltData()) return []; const out = [], c = FELT.cell;
  for (let gy = Math.floor(y0 / c); gy <= Math.floor(y1 / c); gy++) for (let gx = Math.floor(x0 / c); gx <= Math.floor(x1 / c); gx++){
    const a = FELT.grid.get(gridKey(gx, gy)); if (a) for (const f of a) if (f.x >= x0 && f.x <= x1 && f.y >= y0 && f.y <= y1) out.push(f); }
  return out.sort((a, b) => b.r - a.r);
}
