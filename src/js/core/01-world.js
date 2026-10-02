const EPOCH = Date.UTC(2027, 2, 1, 6, 0, 0);
// game minutes per real minute: 6 makes a fishing trip one evening, the skrei season two real weeks and a year about two months
const GAME_RATE = 6;
const B = {latMin:68.98, latMax:69.72, lonMin:16.55, lonMax:18.55};
const KY = 111.32, KX = 111.32 * Math.cos(69.35 * Math.PI / 180);
const MAP_W = (B.lonMax - B.lonMin) * KX, MAP_H = (B.latMax - B.latMin) * KY;
const NM = 1.852;
const P = (lat, lon) => ({x:(lon - B.lonMin) * KX, y:(B.latMax - lat) * KY});
const LL = p => ({lat:B.latMax - p.y / KY, lon:B.lonMin + p.x / KX});
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const gDate = H => new Date(EPOCH + H * 3600000);

// Real coastline for Senja from OpenStreetMap (ODbL), rasterised to a 25 m land mask
const GRID = {nx:3140, ny:3296, c:0.025}, HGRID = {nx:3140, ny:3296, c:0.025};
const GEO_MASK = '@include(data/geo-mask.b64)';
const GEO_COAST = '@include(data/geo-coast.b64)';
const GEO_EXPO = {nx:157, ny:165, c:0.5, b64:'@include(data/geo-expo.b64)'};
function b64bytes(s){ const bin = atob(s), a = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i); return a; }
function varints(b){ let i = 0; return () => { let v = 0, s = 0, x; do { x = b[i++]; v += (x & 127) * Math.pow(2, s); s += 7; } while (x & 128); return v; }; }
const MASK = (() => {
  const next = varints(b64bytes(GEO_MASK)), m = new Uint8Array(GRID.nx * GRID.ny);
  for (let r = 0; r < GRID.ny; r++){ const n = next(), off = r * GRID.nx; let c = 0, cur = 0; for (let k = 0; k < n; k++){ const len = next(); if (cur) m.fill(1, off + c, off + c + len); c += len; cur ^= 1; } }
  return m;
})();
// chart polygons (km)
const LAND = (() => {
  const next = varints(b64bytes(GEO_COAST)), zz = v => (v % 2 ? -(v + 1) / 2 : v / 2), n = next(), out = [];
  for (let k = 0; k < n; k++){ const len = next(); let x = 0, y = 0; const poly = []; for (let i = 0; i < len; i++){ x += zz(next()); y += zz(next()); poly.push({x:x / 100, y:y / 100}); } out.push(poly); }
  return out;
})();
const COAST_D = LAND.map(poly => 'M' + poly.map(q => q.x.toFixed(2) + ',' + q.y.toFixed(2)).join('L') + 'Z').join('');
const EXPO = b64bytes(GEO_EXPO.b64);
// roads (deflated), forest raster, piers/breakwaters and seamarks from OpenStreetMap (ODbL)
const GEO_ROADS = '@include(data/geo-roads.b64)';
// fine land polygons (smoothed 12.5 m trace of the OSM coastline, metres) and bridges from OSM
const GEO_FINE = '@include(data/geo-fine.b64)';
const BRIDGES = [[1,25,"Flakstadveien","yes",23456,52195,23432,52187],[1,41,"Tranøyveien","yes",33723,61648,33702,61684],[2,57,"Hofsøyveien","yes",19695,75432,19702,75488],[1,57,"Finnesveien","yes",24207,48272,24189,48218],[0,139,"Trongstraumen bru","suspension",29259,35257,29120,35253],[0,320,"Gryllefjordbrua","beam",22631,40195,22601,40287,22562,40405,22531,40499],[0,39,"Kjerkesteinen bru","yes",34476,27200,34467,27183,34458,27165],[0,27,"Krokelv bru","yes",33569,37066,33592,37080],[1,539,"Sommarøybrua","beam",58903,10946,58888,10941,58878,10938,58870,10935,58861,10932,58852,10928,58842,10924,58834,10920,58823,10914,58814,10908,58804,10901,58793,10892,58785,10884,58777,10877,58769,10868,58761,10857,58754,10848,58747,10837,58738,10823,58730,10809,58723,10797,58694,10745,58664,10692,58616,10609,58605,10592,58596,10578,58587,10566,58576,10552,58568,10544],[2,75,"Hillesøybrua","beam",56996,9329,56927,9299],[2,104,"Bukkemoveien","beam",49923,37418,49845,37350],[1,45,"Sultindvikveien","yes",69230,39692,69262,39724],[0,48,"Lysnesveien","yes",54813,33235,54838,33194],[0,26,"Synnøvjordvegen","yes",71705,10583,71687,10602],[0,32,"Fossmobrua","yes",77186,73049,77197,73079],[0,1141,"Gisundbrua","beam",55167,52904,55186,52911,55209,52921,55232,52932,55248,52940,55264,52949,55288,52963,55315,52982,55400,53043,55458,53084,55573,53166,55687,53248,55743,53288,56063,53516,56082,53530,56094,53539,56105,53549],[1,602,"Dyrøybrua","beam",41287,70193,41271,70195,41249,70196,41227,70196,41203,70195,41170,70193,40955,70177,40687,70156],[1,52,"Islandsbotnveien","yes",50936,54780,50916,54828],[0,39,"Krokbekkbrua","yes",78227,71999,78255,71973],[4,52,"Lasse Olsens vei","yes",77778,72252,77799,72256,77830,72261],[2,40,"Fagerlidal","yes",78006,71743,78014,71736,78022,71730,78028,71725,78038,71718],[0,30,"Fagerfjellveien","yes",63588,52213,63582,52204,63575,52195,63570,52190],[1,44,"Brygghaugveien","yes",41036,52325,41024,52282],[0,105,"Brandmo bru","truss",77316,79366,77366,79356,77419,79345],[1,90,"Dalembrua","yes",77019,73100,77012,73088,77008,73081,77004,73070,77001,73059,76999,73048,76998,73041,76997,73030,76998,73019,76998,73014],[0,70,"Sundliveien","yes",76058,78905,76022,78845],[0,28,"Bjørkebakkveien","yes",46500,73347,46515,73324],[0,32,"Lundeveien","yes",45468,71686,45462,71683,45456,71678,45448,71674,45441,71670],[0,33,"Skøelvdal bru","truss",56849,68787,56855,68755],[0,29,"Tangen bru","yes",54495,74605,54512,74581],[0,34,"Andselvbrua sør","yes",76809,73079,76842,73072],[0,30,"Andselv bru","yes",76259,73476,76264,73447],[0,27,"Andselvbrua nord","yes",76938,73052,76964,73047],[4,34,"","yes",78171,73424,78200,73442],[1,33,"Bjelma bru","yes",75344,54950,75337,54946,75321,54937,75315,54934],[0,38,"Nordstraumen bru","yes",62796,64120,62813,64087],[0,27,"Mortenelv bru","yes",75284,57385,75280,57378,75273,57361],[4,38,"","yes",50948,54797,50939,54834],[1,48,"Bjorelvnesveien","yes",60198,42292,60198,42268,60196,42244],[4,61,"","yes",57452,47900,57509,47878]];
const GEO_FOREST = '@include(data/geo-forest.b64)';
let ROADS = null, FINE = null;
async function loadFine(){
  if (typeof DecompressionStream === 'undefined') return [];
  const buf = new Uint8Array(await new Response(new Blob([b64bytes(GEO_FINE)]).stream().pipeThrough(new DecompressionStream('deflate'))).arrayBuffer());
  const next = varints(buf), zz = v => (v % 2 ? -(v + 1) / 2 : v / 2), n = next(), out = [];
  for (let k = 0; k < n; k++){ const len = next(), xs = new Float32Array(len), zs = new Float32Array(len); let x = 0, z = 0, a = 1e9, b = 1e9, e = -1e9, f = -1e9;
    for (let j = 0; j < len; j++){ x += zz(next()); z += zz(next()); xs[j] = x; zs[j] = z; if (x < a) a = x; if (z < b) b = z; if (x > e) e = x; if (z > f) f = z; } out.push({xs, zs, bb:[a, b, e, f]}); }
  return out;
}
async function loadRoads(){
  if (typeof DecompressionStream === 'undefined') return [];
  const buf = new Uint8Array(await new Response(new Blob([b64bytes(GEO_ROADS)]).stream().pipeThrough(new DecompressionStream('deflate'))).arrayBuffer());
  const next = varints(buf), zz = v => (v % 2 ? -(v + 1) / 2 : v / 2), n = next(), out = [];
  for (let k = 0; k < n; k++){
    const c = next(), len = next(), xs = new Float32Array(len), zs = new Float32Array(len); let x = 0, z = 0, a = 1e9, b = 1e9, e = -1e9, f = -1e9;
    for (let j = 0; j < len; j++){ x += zz(next()); z += zz(next()); xs[j] = x; zs[j] = z; if (x < a) a = x; if (z < b) b = z; if (x > e) e = x; if (z > f) f = z; }
    out.push({c, xs, zs, bb:[a, b, e, f]});
  }
  return out;
}
const FOREST = (() => { const next = varints(b64bytes(GEO_FOREST)), m = new Uint8Array(1570 * 1648); for (let r = 0; r < 1648; r++){ const n = next(), off = r * 1570; let c = 0, cur = 0; for (let k = 0; k < n; k++){ const len = next(); if (cur) m.fill(1, off + c, off + c + len); c += len; cur ^= 1; } } return m; })();
// rocks awash and underwater (skjær/båer): route warnings and chart symbols
// harbour areas are dredged and buoyed: no depth hazards there, so every vessel can land its catch
function inHarbour(p){ for (const pt of PORTS){ if (dist(p, pt.p) < 0.6) return true; if (pt.app && dist(p, pt.app) < 0.35) return true; } return false; }
const safeDepth = () => S.settings.safeDepth || Math.max(2, Math.ceil(BOAT.draft + 1.5));
function legHazard(a, c, sd){
  const L = dist(a, c), n = Math.max(1, Math.ceil(L / 0.03)); let minD = 1e9;
  for (let i = 0; i <= n; i++){ const p = {x:a.x + (c.x - a.x) * i / n, y:a.y + (c.y - a.y) * i / n}; if (inHarbour(p) || isLand(p)) continue; const d = depthF(p); if (d < minD) minD = d; }
  let rk = 0; if (!(inHarbour(a) && inHarbour(c))){ const x0 = Math.min(a.x, c.x) - 0.03, x1 = Math.max(a.x, c.x) + 0.03, y0 = Math.min(a.y, c.y) - 0.03, y1 = Math.max(a.y, c.y) + 0.03, dx = c.x - a.x, dy = c.y - a.y, L2 = dx * dx + dy * dy || 1e-9;
    for (const q of SEAMARKS.rocks){ if (q[0] < x0 || q[0] > x1 || q[1] < y0 || q[1] > y1 || inHarbour({x:q[0], y:q[1]})) continue; const u = clamp(((q[0] - a.x) * dx + (q[1] - a.y) * dy) / L2, 0, 1); if (Math.hypot(a.x + dx * u - q[0], a.y + dy * u - q[1]) < 0.025) rk++; } }
  return {minD, rocks:rk, unsafe:minD < sd || rk > 0};
}
let hzCache = {k:'', v:[]};
// each leg is remembered by its ends, so moving one point only works out the two legs it touches
const hzLegs = new Map();
function legHazardMemo(a, c, sd){
  const k = sd + '|' + a.x.toFixed(4) + ',' + a.y.toFixed(4) + '|' + c.x.toFixed(4) + ',' + c.y.toFixed(4); let h = hzLegs.get(k);
  if (!h){ h = legHazard(a, c, sd); if (hzLegs.size > 600) hzLegs.clear(); hzLegs.set(k, h); }
  return h;
}
function draftHazards(){
  const sd = safeDepth(), k = sd + '|' + S.boat.pos.x.toFixed(3) + ',' + S.boat.pos.y.toFixed(3) + '|' + S.draft.map(w => w.x.toFixed(3) + ',' + w.y.toFixed(3)).join(';');
  if (hzCache.k === k) return hzCache.v;
  let a = S.boat.pos; const v = S.draft.map(w => { const h = legHazardMemo(a, w, sd); a = w; return h; });
  hzCache = {k, v}; return v;
}
// running aground
function nearestPlace(p){
  let best = null; for (const q of PORTS.map(pt => ({n:pt.name, e:pt.name, p:pt.p})).concat(GROUNDS.map(g => ({n:g.name.no, e:g.name.en, p:g.p})))){ const d = dist(p, q.p); if (!best || d < best.d) best = {d, q}; }
  const nm = best.d / NM; return nm < 1.5 ? {no:'ved ' + best.q.n, en:'near ' + best.q.e} : {no:fmt(nm, 1) + ' nm fra ' + best.q.n, en:fmt(nm, 1) + ' nm from ' + best.q.e};
}
function groundCheck(a, c){
  const L = dist(a, c), n = Math.max(1, Math.ceil(L / 0.02));
  const tl = tideCD(S.t / 60);
  for (let i = 1; i <= n; i++){ const p = {x:a.x + (c.x - a.x) * i / n, y:a.y + (c.y - a.y) * i / n}; if (inHarbour(p)) continue; if (!isLand(p) && depthF(p) + tl < BOAT.draft) return p; }
  if (!inHarbour(c)){ const dx = c.x - a.x, dy = c.y - a.y, L2 = dx * dx + dy * dy || 1e-9; for (const q of SEAMARKS.rocks){ if (Math.abs(q[0] - c.x) > L + 0.02 || Math.abs(q[1] - c.y) > L + 0.02) continue; const u = clamp(((q[0] - a.x) * dx + (q[1] - a.y) * dy) / L2, 0, 1); if (Math.hypot(a.x + dx * u - q[0], a.y + dy * u - q[1]) < 0.012 && Math.random() < 0.5) return {x:q[0], y:q[1]}; } }
  return null;
}
function runAground(p){
  const b = S.boat, pl = nearestPlace(p); b.pos = {x:p.x, y:p.y}; b.status = 'aground'; b.v = 0; b.damage = 1; b.tripBad = true;
  log('Gikk på grunn ' + pl.no + '. Skroget er skadet.', 'Ran aground ' + pl.en + '. The hull is damaged.', 'nav');
  S.incidents = S.incidents || []; S.incidents.push({t:S.t, k:'aground', boat:S.boatName || 'Havbris', no:pl.no, en:pl.en}); if (S.incidents.length > 60) S.incidents.shift();
  if (hooks.onAground) hooks.onAground();
}
function rocksNear(a, b, r){ let n = 0; const x0 = Math.min(a.x, b.x) - r, x1 = Math.max(a.x, b.x) + r, y0 = Math.min(a.y, b.y) - r, y1 = Math.max(a.y, b.y) + r, dx = b.x - a.x, dy = b.y - a.y, L2 = dx * dx + dy * dy || 1e-9;
  for (const q of SEAMARKS.rocks){ if (q[0] < x0 || q[0] > x1 || q[1] < y0 || q[1] > y1) continue; const u = clamp(((q[0] - a.x) * dx + (q[1] - a.y) * dy) / L2, 0, 1); if (Math.hypot(a.x + dx * u - q[0], a.y + dy * u - q[1]) < r) n++; } return n; }
const PIERS = /*@include(data/piers.json)*/null;
const SEAMARKS = /*@include(data/seamarks.json)*/null;
function gridBilinear(arr, nx, ny, c, p){
  const gx = clamp(p.x / c - 0.5, 0, nx - 1.001), gy = clamp(p.y / c - 0.5, 0, ny - 1.001), ix = Math.floor(gx), iy = Math.floor(gy), fx = gx - ix, fy = gy - iy, i = iy * nx + ix;
  return (arr[i] * (1 - fx) + arr[i + 1] * fx) * (1 - fy) + (arr[i + nx] * (1 - fx) + arr[i + nx + 1] * fx) * fy;
}
// distance from open water to the nearest shore on a 100 m grid (km)
const DC = (() => {
  const nx = GRID.nx >> 2, ny = GRID.ny >> 2, d = new Float32Array(nx * ny), D = Math.SQRT2;
  for (let r = 0; r < ny; r++) for (let c = 0; c < nx; c++){ let any = 0; for (let a = 0; a < 4 && !any; a++){ const i0 = (4 * r + a) * GRID.nx + 4 * c; any = MASK[i0] | MASK[i0 + 1] | MASK[i0 + 2] | MASK[i0 + 3]; } d[r * nx + c] = any ? 0 : 1e6; }
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
})();
function coastDist(p){ return gridBilinear(DC.d, DC.nx, DC.ny, 0.1, p); }
// Real depths: Kartverket 50 m depth model (open data), resampled to 100 m; gaps near land filled smoothly
const GEO_DEPTH = {nx:1570, ny:1648, c:0.05, b64:'@include(data/geo-depth.b64)'};
const GEO_CONTOURS = '@include(data/geo-contours.b64)', CONTOUR_LEVELS = [5,10,20,30,50,100,150,200,300,500,800];
let DEPTH = null;
async function loadDepth(){
  if (typeof DecompressionStream === 'undefined') return null;
  const bytes = b64bytes(GEO_DEPTH.b64), n = GEO_DEPTH.nx * GEO_DEPTH.ny;
  const buf = new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate'))).arrayBuffer());
  const d = new Float32Array(n);
  const q = new Int32Array(n), nx = GEO_DEPTH.nx;
  for (let r = 0; r < GEO_DEPTH.ny; r++) for (let c = 0; c < nx; c++){ const i = r * nx + c, z = buf[i] | (buf[n + i] << 8), a = c ? q[i - 1] : 0, b = r ? q[i - nx] : 0, cc = r && c ? q[i - nx - 1] : 0, pr = cc >= Math.max(a, b) ? Math.min(a, b) : cc <= Math.min(a, b) ? Math.max(a, b) : a + b - cc; q[i] = pr + ((z >>> 1) ^ -(z & 1)); d[i] = q[i] / 2; }
  return d;
}
function decodeContours(){
  const next = varints(b64bytes(GEO_CONTOURS)), zz = v => (v % 2 ? -(v + 1) / 2 : v / 2), n = next(), out = CONTOUR_LEVELS.map(() => []);
  for (let k = 0; k < n; k++){ const li = next(), len = next(); let x = 0, y = 0; const q = []; for (let i = 0; i < len; i++){ x += zz(next()); y += zz(next()); q.push((x / 100).toFixed(2) + ',' + (y / 100).toFixed(2)); } out[li].push('M' + q.join('L')); }
  return out.map(a => a.join(''));
}
function isLand(p){
  if (!(p.x >= 0 && p.y >= 0 && p.x < GRID.nx * GRID.c && p.y < GRID.ny * GRID.c)) return true;
  return MASK[Math.floor(p.y / GRID.c) * GRID.nx + Math.floor(p.x / GRID.c)] === 1;
}
function legClear(a, b){
  const d = dist(a, b), n = Math.max(1, Math.ceil(d / 0.04));
  for (let i = 1; i < n; i++){
    const t = i / n;
    if (isLand({x:a.x + (b.x - a.x) * t, y:a.y + (b.y - a.y) * t})) return false;
  }
  return true;
}

const PORTS = [
  // the fish plants are where Råfisklaget lists landings on Senja and at Sommarøy and Brensholmen, each with the harbour unit and its bunker station (07-harbours.js); Finnsnes has a net loft and gear dealers but no plant and no ice chute (the tackle shop sells bagged ice).
  // The harbour point lies just off the plant's quay (Finnsnes: the quay by the net loft, south of the bridge); the quays themselves are QUAYS in 07-harbours.js.
  {id:'finnsnes', name:'Finnsnes', xy:[56.035,53.611], shore:[56.066,53.623], pier:false, fuel:true, ice:false, mottak:false, pf:1, home:true},
  {id:'botnhamn', name:'Botnhamn', xy:[53.288,23.495], shore:[53.285,23.527], pier:true, fuel:true, ice:true, mottak:true, pf:1.0},
  {id:'husoy', name:'Husøy', xy:[43.815,19.685], shore:[43.783,19.692], pier:true, fuel:true, ice:true, mottak:true, pf:1.03},
  {id:'senjahopen', name:'Senjahopen', xy:[36.807,25.119], shore:[36.791,25.09], pier:true, fuel:true, ice:true, mottak:true, pf:1.02},
  {id:'gryllefjord', name:'Gryllefjord', xy:[20.319,39.836], shore:[20.309,39.867], pier:true, fuel:true, ice:true, mottak:true, pf:0.97},
  // Sommarøy and Brensholmen: the berth is on the water side of the OpenStreetMap quay nearest the largest industrial building (not checked against pictures)
  {id:'sommaroy', name:'Sommarøy', xy:[56.761,9.545], shore:[56.736,9.511], pier:true, fuel:true, ice:true, mottak:true, pf:1.0},
  {id:'brensholmen', name:'Brensholmen', xy:[58.589,12.628], shore:[58.626,12.649], pier:true, fuel:true, ice:true, mottak:true, pf:0.99},
  {id:'torsken', name:'Torsken', xy:[21.856,42.58], shore:[21.863,42.548], pier:true, fuel:true, ice:true, mottak:true, pf:0.99},
  {id:'frovag', name:'Frovåg', xy:[19.651,71.922], shore:[19.607,71.915], pier:true, fuel:true, ice:true, mottak:true, pf:0.98}
].map((p, i) => ({...p, i, p:{x:p.xy[0], y:p.xy[1]}, coast:{x:p.shore[0], y:p.shore[1]}}));
const portById = id => PORTS.find(p => p.id === id);
// ===== the harbour unit (02.10.2026) =====
// One quay with the fish plant, the crane, the forklift, the ice silo and the bunker station, built in Blender
// (tools/harbour/kaimottak.py, data/harbour-unit.b64) and set down in every harbour with a plant; Finnsnes keeps its quay. Its frame:
// x along the face, y up from mean sea level, z out to the water. o is the middle of the face (metres), u the way along it, and the
// water is on n = (-u.z, u.x). The quay is a block of 54.8 x 24.4 m with straight walls down to 9 m below mean sea level; the basin
// in front is dredged to 6.6 m, which is 5 m at the lowest tide (TIDE_C adds up to 1.55 m), so the deepest coastal boat (kyst21,
// 3.4 m) lies afloat. The landing berth is round x = -5, where the crane and the ice chute reach, the bunker berth round x = 16.5 by
// the pump. The face lies on the plant's quay in QUAYS (the designer's), slid along it to stand on the most land with clear water in
// front (Husøy 12 m, Frovåg 14 m); Sommarøy and Brensholmen, which have no marked quay, by a search near the harbour point for the
// most land under the block and clear water in front. The landing berth stays within 25 m of the harbour point.
const UNIT = {E:27.4, B:24.4, bot:-9, basinX:33.4, basinZ:26, dredge:6.6, berth:{main:[-5, 24], bunker:[16.5, 23]}};
const UNITS = {
  botnhamn:{o:[53282.5, 23499.9], u:[-0.993, -0.116]}, husoy:{o:[43803.9, 19670.9], u:[-0.212, -0.977]}, senjahopen:{o:[36807.1, 25112.1], u:[0.876, -0.483]},
  gryllefjord:{o:[20312.3, 39841.9], u:[-0.947, -0.32]}, sommaroy:{o:[56736.6, 9544.3], u:[-0.707, -0.707]}, brensholmen:{o:[58576.6, 12633.9], u:[-0.766, -0.643]},
  torsken:{o:[21862.9, 42573.6], u:[0.977, 0.215]}, frovag:{o:[19637.0, 71900.4], u:[0.189, -0.982]}
};
for (const k in UNITS){ const U = UNITS[k], l = Math.hypot(U.u[0], U.u[1]); U.id = k; U.u = [U.u[0] / l, U.u[1] / l]; U.n = [-U.u[1], U.u[0]]; }
const UNITA = Object.values(UNITS);
// the unit's frame and the world (metres)
const unitW = (U, lx, lz) => [U.o[0] + U.u[0] * lx + U.n[0] * lz, U.o[1] + U.u[1] * lx + U.n[1] * lz];
const unitL = (U, x, z) => { const dx = x - U.o[0], dz = z - U.o[1]; return [dx * U.u[0] + dz * U.u[1], dx * U.n[0] + dz * U.n[1]]; };
function portApproach(pt){
  let best = null;
  for (let r = 0.15; r <= 0.7; r += 0.05) for (let a = 0; a < 360; a += 7.5){
    const q = {x:pt.p.x + Math.sin(a * Math.PI / 180) * r, y:pt.p.y - Math.cos(a * Math.PI / 180) * r};
    if (isLand(q) || !legClear(q, pt.p)) continue;
    const sc = coastDist(q) - r * 0.6; if (!best || sc > best.sc) best = {x:q.x, y:q.y, sc};
  }
  return best ? {x:Math.round(best.x * 1000) / 1000, y:Math.round(best.y * 1000) / 1000} : null;
}

const GROUNDS = [
  {name:{no:'Havet nord for Husøy', en:'Offshore north of Husøy'}, xy:[44.05,8.35], r:6, sp:{torsk:1.0, sei:0.7, hyse:0.6, lange:0.25, brosme:0.2}},
  {name:{no:'Utenfor Mefjorden', en:'Off Mefjorden'}, xy:[32.35,18.65], r:5.5, sp:{torsk:0.9, sei:0.8, hyse:0.45, lange:0.4, brosme:0.3}},
  {name:{no:'Vest av Gryllefjord', en:'West of Gryllefjord'}, xy:[9.15,39.15], r:6.5, sp:{torsk:1.0, sei:0.6, hyse:0.5, lange:0.5, brosme:0.5}},
  {name:{no:'Malangsgapet', en:'Malangen mouth'}, xy:[59.65,19.35], r:4, sp:{torsk:0.55, sei:0.9, hyse:0.45, lange:0, brosme:0.1}},
  {name:{no:'Gisundet nord', en:'North Gisundet'}, xy:[57.25,44.35], r:1.6, sp:{torsk:0.25, sei:0.5, hyse:0.15, lange:0, brosme:0}},
  {name:{no:'Solbergfjorden', en:'Solbergfjorden'}, xy:[47.45,66.05], r:2.5, sp:{torsk:0.35, sei:0.35, hyse:0.3, lange:0, brosme:0}}
].map((g, i) => ({...g, i, p:{x:g.xy[0], y:g.xy[1]}}));
[[0.15,0.12,0.1],[0.2,0.1,0.08],[0.15,0.15,0.12],[0.25,0,0.05],[0.2,0,0],[0.2,0,0.02]].forEach((v, i) => Object.assign(GROUNDS[i].sp, {lyr:v[0], uer:v[1], kveite:v[2]}));

