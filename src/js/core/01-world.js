const EPOCH = Date.UTC(2027, 2, 1, 6, 0, 0);
// game minutes per real minute: 6 makes a fishing trip one evening, the skrei season two real weeks and a year about two months
const GAME_RATE = 6;
const NM = 1.852;
// The game's frame is the national one (phase K4 of the coast plan): UTM zone 33 in km, x = (E + 250 km) / 1000 east and
// y = (8 050 km - N) / 1000 south (00-proj.js). Senja lies at x 810-892, y 311-397. Grid north is not true north: a true bearing is
// the grid bearing + gamma (gridGamma), 1.4 degrees at the west edge of Senja's map and 3.3 at the east.
const P = (lat, lon) => natP(lat, lon);
const LL = p => natLL(p);
// The Senja data in data/ and the hand-placed content (harbours, quays, grounds, routes) were made in the legacy frame: flat at
// 69.35 N, km east and south of 69.72 N 16.55 E (79 x 82 km). LG takes legacy km into the game's frame and LGI back; LGa and LGm
// do the same for [x, y] in km and [x, z] in metres, LGu turns a direction at a legacy point (metres), and LGrot is the angle
// (radians, clockwise on the map) the legacy frame turns by there, about -gamma. The rasters were moved into the national frame
// when the map packs were built (tools/mappack.mjs, which has the same legacy frame).
const LEGF = {KY:111.32, KX:111.32 * Math.cos(69.35 * Math.PI / 180), lat0:69.72, lon0:16.55, W:2 * 111.32 * Math.cos(69.35 * Math.PI / 180), H:0.74 * 111.32};
const LG = (x, y) => natP(LEGF.lat0 - y / LEGF.KY, LEGF.lon0 + x / LEGF.KX);
const LGI = p => { const l = natLL(p); return {x:(l.lon - LEGF.lon0) * LEGF.KX, y:(LEGF.lat0 - l.lat) * LEGF.KY}; };
const LGa = a => { const q = LG(a[0], a[1]); return [q.x, q.y]; };
const LGm = a => { const q = LG(a[0] / 1000, a[1] / 1000); return [q.x * 1000, q.y * 1000]; };
const LGu = (o, u) => { const a = LGm(o), b = LGm([o[0] + u[0] * 10, o[1] + u[1] * 10]), l = Math.hypot(b[0] - a[0], b[1] - a[1]); return [(b[0] - a[0]) / l, (b[1] - a[1]) / l]; };
const LGrot = (x, y) => { const a = LG(x, y), b = LG(x + 0.01, y); return Math.atan2(b.y - a.y, b.x - a.x); };
// the meridian convergence (degrees) at p, by the km cell: true bearing = grid bearing + gridGamma(p)
const GAMMA_C = new Map();
// a heading on the grid (radians, clockwise from grid north) as a true bearing in degrees, 0-360, for what the crew reads
const trueDeg = (r, p) => ((r * 180 / Math.PI + gridGamma(p)) % 360 + 360) % 360;
function gridGamma(p){ const k = gridKey(Math.floor(p.x), Math.floor(p.y)); let g = GAMMA_C.get(k); if (g === undefined){ const l = natLL({x:Math.floor(p.x) + 0.5, y:Math.floor(p.y) + 0.5}); g = utm33(l.lat, l.lon).gamma; GAMMA_C.set(k, g); } return g; }
// HOME is Senja's map, the box round the legacy square (km; its edges bow by millimetres): where the game starts, the 2D zoom's
// measure (MAP_W, MAP_H) and the 3D view's wide meshes. MAPB is the frame the map covers since phase K6 of the coast plan: the whole
// coast, coarse from the national core everywhere and in detail where the tiles have it (01b-mapdata.js).
const HOME = (() => { const b = {x0:1e9, y0:1e9, x1:-1e9, y1:-1e9}, W = LEGF.W, H = LEGF.H;
  for (let i = 0; i <= 32; i++) for (const [x, y] of [[W * i / 32, 0], [W * i / 32, H], [0, H * i / 32], [W, H * i / 32]]){ const q = LG(x, y); b.x0 = Math.min(b.x0, q.x); b.y0 = Math.min(b.y0, q.y); b.x1 = Math.max(b.x1, q.x); b.y1 = Math.max(b.y1, q.y); }
  return b; })();
const MAP_W = HOME.x1 - HOME.x0, MAP_H = HOME.y1 - HOME.y0;
const MAPB = {x0:0, y0:0, x1:1450, y1:1720};
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const gDate = H => new Date(EPOCH + H * 3600000);

// Real coastline for Senja from OpenStreetMap (ODbL), rasterised to a 25 m land mask. The rasters (land, depth, distance to the
// shore, openness, heights, forest) come in blocks from map/ (01b-mapdata.js), in the national frame.
function b64bytes(s){ const bin = atob(s), a = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i); return a; }
function varints(b){ let i = 0; return () => { let v = 0, s = 0, x; do { x = b[i++]; v += (x & 127) * Math.pow(2, s); s += 7; } while (x & 128); return v; }; }
// the chart's coast and names come from the map packs (ui/03a-chart.js, phase K7 of the coast plan)
// roads (deflated), forest raster, piers/breakwaters and seamarks from OpenStreetMap (ODbL)
const GEO_ROADS = '@include(data/geo-roads.b64)';
// fine land polygons (smoothed 12.5 m trace of the OSM coastline, metres) and bridges from OSM
const GEO_FINE = '@include(data/geo-fine.b64)';
const BRIDGES = [[1,25,"Flakstadveien","yes",23456,52195,23432,52187],[1,41,"Tranøyveien","yes",33723,61648,33702,61684],[2,57,"Hofsøyveien","yes",19695,75432,19702,75488],[1,57,"Finnesveien","yes",24207,48272,24189,48218],[0,139,"Trongstraumen bru","suspension",29259,35257,29120,35253],[0,320,"Gryllefjordbrua","beam",22631,40195,22601,40287,22562,40405,22531,40499],[0,39,"Kjerkesteinen bru","yes",34476,27200,34467,27183,34458,27165],[0,27,"Krokelv bru","yes",33569,37066,33592,37080],[1,539,"Sommarøybrua","beam",58903,10946,58888,10941,58878,10938,58870,10935,58861,10932,58852,10928,58842,10924,58834,10920,58823,10914,58814,10908,58804,10901,58793,10892,58785,10884,58777,10877,58769,10868,58761,10857,58754,10848,58747,10837,58738,10823,58730,10809,58723,10797,58694,10745,58664,10692,58616,10609,58605,10592,58596,10578,58587,10566,58576,10552,58568,10544],[2,75,"Hillesøybrua","beam",56996,9329,56927,9299],[2,104,"Bukkemoveien","beam",49923,37418,49845,37350],[1,45,"Sultindvikveien","yes",69230,39692,69262,39724],[0,48,"Lysnesveien","yes",54813,33235,54838,33194],[0,26,"Synnøvjordvegen","yes",71705,10583,71687,10602],[0,32,"Fossmobrua","yes",77186,73049,77197,73079],[0,1141,"Gisundbrua","beam",55167,52904,55186,52911,55209,52921,55232,52932,55248,52940,55264,52949,55288,52963,55315,52982,55400,53043,55458,53084,55573,53166,55687,53248,55743,53288,56063,53516,56082,53530,56094,53539,56105,53549],[1,602,"Dyrøybrua","beam",41287,70193,41271,70195,41249,70196,41227,70196,41203,70195,41170,70193,40955,70177,40687,70156],[1,52,"Islandsbotnveien","yes",50936,54780,50916,54828],[0,39,"Krokbekkbrua","yes",78227,71999,78255,71973],[4,52,"Lasse Olsens vei","yes",77778,72252,77799,72256,77830,72261],[2,40,"Fagerlidal","yes",78006,71743,78014,71736,78022,71730,78028,71725,78038,71718],[0,30,"Fagerfjellveien","yes",63588,52213,63582,52204,63575,52195,63570,52190],[1,44,"Brygghaugveien","yes",41036,52325,41024,52282],[0,105,"Brandmo bru","truss",77316,79366,77366,79356,77419,79345],[1,90,"Dalembrua","yes",77019,73100,77012,73088,77008,73081,77004,73070,77001,73059,76999,73048,76998,73041,76997,73030,76998,73019,76998,73014],[0,70,"Sundliveien","yes",76058,78905,76022,78845],[0,28,"Bjørkebakkveien","yes",46500,73347,46515,73324],[0,32,"Lundeveien","yes",45468,71686,45462,71683,45456,71678,45448,71674,45441,71670],[0,33,"Skøelvdal bru","truss",56849,68787,56855,68755],[0,29,"Tangen bru","yes",54495,74605,54512,74581],[0,34,"Andselvbrua sør","yes",76809,73079,76842,73072],[0,30,"Andselv bru","yes",76259,73476,76264,73447],[0,27,"Andselvbrua nord","yes",76938,73052,76964,73047],[4,34,"","yes",78171,73424,78200,73442],[1,33,"Bjelma bru","yes",75344,54950,75337,54946,75321,54937,75315,54934],[0,38,"Nordstraumen bru","yes",62796,64120,62813,64087],[0,27,"Mortenelv bru","yes",75284,57385,75280,57378,75273,57361],[4,38,"","yes",50948,54797,50939,54834],[1,48,"Bjorelvnesveien","yes",60198,42292,60198,42268,60196,42244],[4,61,"","yes",57452,47900,57509,47878]];
let ROADS = null, FINE = null;
async function loadFine(){
  if (typeof DecompressionStream === 'undefined') return [];
  const buf = new Uint8Array(await new Response(new Blob([b64bytes(GEO_FINE)]).stream().pipeThrough(new DecompressionStream('deflate'))).arrayBuffer());
  const next = varints(buf), zz = v => (v % 2 ? -(v + 1) / 2 : v / 2), n = next(), out = [];
  for (let k = 0; k < n; k++){ const len = next(), xs = new Float64Array(len), zs = new Float64Array(len); let x = 0, z = 0, a = 1e9, b = 1e9, e = -1e9, f = -1e9;
    for (let j = 0; j < len; j++){ x += zz(next()); z += zz(next()); const q = LGm([x, z]); xs[j] = q[0]; zs[j] = q[1]; if (q[0] < a) a = q[0]; if (q[1] < b) b = q[1]; if (q[0] > e) e = q[0]; if (q[1] > f) f = q[1]; } out.push({xs, zs, bb:[a, b, e, f]}); }
  return out;
}
async function loadRoads(){
  if (typeof DecompressionStream === 'undefined') return [];
  const buf = new Uint8Array(await new Response(new Blob([b64bytes(GEO_ROADS)]).stream().pipeThrough(new DecompressionStream('deflate'))).arrayBuffer());
  const next = varints(buf), zz = v => (v % 2 ? -(v + 1) / 2 : v / 2), n = next(), out = [];
  for (let k = 0; k < n; k++){
    const c = next(), len = next(), xs = new Float64Array(len), zs = new Float64Array(len); let x = 0, z = 0, a = 1e9, b = 1e9, e = -1e9, f = -1e9;
    for (let j = 0; j < len; j++){ x += zz(next()); z += zz(next()); const q = LGm([x, z]); xs[j] = q[0]; zs[j] = q[1]; if (q[0] < a) a = q[0]; if (q[1] < b) b = q[1]; if (q[0] > e) e = q[0]; if (q[1] > f) f = q[1]; }
    out.push({c, xs, zs, bb:[a, b, e, f]});
  }
  return out;
}
// rocks awash and underwater (skjær/båer): route warnings and chart symbols
// harbour areas are dredged and buoyed: no depth hazards there, so every vessel can land its catch
function inHarbour(p){ for (const pt of PORTS){ if (dist(p, pt.p) < 0.6) return true; if (pt.app && dist(p, pt.app) < 0.35) return true; } return false; }
const safeDepth = () => S.settings.safeDepth || Math.max(2, Math.ceil(BOAT.draft + 1.5));
function legHazard(a, c, sd){
  const L = dist(a, c), n = Math.max(1, Math.ceil(L / 0.03)); let minD = 1e9;
  for (let i = 0; i <= n; i++){ const p = {x:a.x + (c.x - a.x) * i / n, y:a.y + (c.y - a.y) * i / n}; if (inHarbour(p) || isLand(p)) continue; const d = depthF(p); if (d < minD) minD = d; }
  let rk = 0; if (!(inHarbour(a) && inHarbour(c))){ const x0 = Math.min(a.x, c.x) - 0.03, x1 = Math.max(a.x, c.x) + 0.03, y0 = Math.min(a.y, c.y) - 0.03, y1 = Math.max(a.y, c.y) + 0.03, dx = c.x - a.x, dy = c.y - a.y, L2 = dx * dx + dy * dy || 1e-9;
    for (const q of rocksIn(x0, y0, x1, y1)){ if (q[0] < x0 || q[0] > x1 || q[1] < y0 || q[1] > y1 || inHarbour({x:q[0], y:q[1]})) continue; const u = clamp(((q[0] - a.x) * dx + (q[1] - a.y) * dy) / L2, 0, 1); if (Math.hypot(a.x + dx * u - q[0], a.y + dy * u - q[1]) < 0.025) rk++; } }
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
  if (!inHarbour(c)){ const dx = c.x - a.x, dy = c.y - a.y, L2 = dx * dx + dy * dy || 1e-9; for (const q of rocksIn(c.x - L - 0.02, c.y - L - 0.02, c.x + L + 0.02, c.y + L + 0.02)){ if (Math.abs(q[0] - c.x) > L + 0.02 || Math.abs(q[1] - c.y) > L + 0.02) continue; const u = clamp(((q[0] - a.x) * dx + (q[1] - a.y) * dy) / L2, 0, 1); if (Math.hypot(a.x + dx * u - q[0], a.y + dy * u - q[1]) < 0.012 && Math.random() < 0.5) return {x:q[0], y:q[1]}; } }
  return null;
}
function runAground(p){
  const b = S.boat, pl = nearestPlace(p); b.pos = {x:p.x, y:p.y}; b.status = 'aground'; b.v = 0; b.damage = 1; b.tripBad = true;
  log('Gikk på grunn ' + pl.no + '. Skroget er skadet.', 'Ran aground ' + pl.en + '. The hull is damaged.', 'nav');
  S.incidents = S.incidents || []; S.incidents.push({t:S.t, k:'aground', boat:S.boatName || 'Havbris', no:pl.no, en:pl.en}); if (S.incidents.length > 60) S.incidents.shift();
  if (hooks.onAground) hooks.onAground();
}
function rocksNear(a, b, r){ let n = 0; const x0 = Math.min(a.x, b.x) - r, x1 = Math.max(a.x, b.x) + r, y0 = Math.min(a.y, b.y) - r, y1 = Math.max(a.y, b.y) + r, dx = b.x - a.x, dy = b.y - a.y, L2 = dx * dx + dy * dy || 1e-9;
  for (const q of rocksIn(x0, y0, x1, y1)){ if (q[0] < x0 || q[0] > x1 || q[1] < y0 || q[1] > y1) continue; const u = clamp(((q[0] - a.x) * dx + (q[1] - a.y) * dy) / L2, 0, 1); if (Math.hypot(a.x + dx * u - q[0], a.y + dy * u - q[1]) < r) n++; } return n; }
const PIERS = /*@include(data/piers.json)*/null;
const SEAMARKS = /*@include(data/seamarks.json)*/null;
// into the game's frame: piers are [type, x, y, x, y, ...], lights, marks and rocks start with x, y (km); bridges are [class, length, name, type, x, z, x, z, ...] (m)
for (const q of PIERS) for (let i = 1; i + 1 < q.length; i += 2){ const g = LG(q[i], q[i + 1]); q[i] = g.x; q[i + 1] = g.y; }
for (const k of ['lights', 'marks', 'rocks']) for (const q of SEAMARKS[k]){ const g = LG(q[0], q[1]); q[0] = g.x; q[1] = g.y; }
// the rocks by 1 km cell, so a search looks only at the cells its box touches (and in the order of SEAMARKS.rocks, as before)
const ROCKIDX = new Map();
SEAMARKS.rocks.forEach((q, i) => { const k = gridKey(Math.floor(q[0]), Math.floor(q[1])); let a = ROCKIDX.get(k); if (!a) ROCKIDX.set(k, a = []); a.push(i); });
function rocksIn(x0, y0, x1, y1){
  const out = [];
  for (let gy = Math.floor(y0); gy <= Math.floor(y1); gy++) for (let gx = Math.floor(x0); gx <= Math.floor(x1); gx++){ const a = ROCKIDX.get(gridKey(gx, gy)); if (a) for (const i of a) out.push(i); }
  out.sort((a, b) => a - b); return out.map(i => SEAMARKS.rocks[i]);
}
for (const q of BRIDGES) for (let i = 4; i + 1 < q.length; i += 2){ const g = LGm([q[i], q[i + 1]]); q[i] = g[0]; q[i + 1] = g[1]; }
// distance from open water to the nearest shore (km): on the tiles' 100 m grid near the boats, else the national core's 200 m grid
// (100 m steps to 25.5 km); coastDistFar is the core's alone, for what looks far. DC is the 100 m layer's extent (cells numbered from
// the frame's origin; mapStart fills it in), which the route's grid (11-route.js) covers: its cell v is (ix0 + v % nx, iy0 + floor(v / nx))
const DC = {nx:0, ny:0, ix0:0, iy0:0};
function coastDist(p){ return mapSimAt(p) ? rbil(MAPD.L.dc, p) : coastDistFar(p); }
function coastDistFar(p){ return rbil(MAPD.L.dc200, p) * 0.1; }
const dcCell = v => rcell(MAPD.L.dc, DC.ix0 + v % DC.nx, DC.iy0 + Math.floor(v / DC.nx));
// Real depths: Kartverket 50 m depth model (open data), resampled to 100 m; gaps near land filled smoothly
const GEO_CONTOURS = '@include(data/geo-contours.b64)', CONTOUR_LEVELS = [5,10,20,30,50,100,150,200,300,500,800];
// true once the depth blocks are in (they are before the clock runs)
let DEPTH = null;
function decodeContours(){
  const next = varints(b64bytes(GEO_CONTOURS)), zz = v => (v % 2 ? -(v + 1) / 2 : v / 2), n = next(), out = CONTOUR_LEVELS.map(() => []);
  for (let k = 0; k < n; k++){ const li = next(), len = next(); let x = 0, y = 0; const q = []; for (let i = 0; i < len; i++){ x += zz(next()); y += zz(next()); const g = LG(x / 100, y / 100); q.push(g.x.toFixed(2) + ',' + g.y.toFixed(2)); } out[li].push('M' + q.join('L')); }
  return out.map(a => a.join(''));
}
// Land or water at p, for what is near the boats: the 25 m mask where a tile has it (its sim pack must be in, as it is round every
// boat and set: simAreaReady), and a harbour unit's block and fill; else the national core's 200 m. Off the frame is land, so nothing
// sails off it.
function isLand(p){
  if (!(p.x >= MAPB.x0 && p.y >= MAPB.y0 && p.x < MAPB.x1 && p.y < MAPB.y1)) return true;
  if (!mapSimAt(p)) return isLandFar(p);
  const L = MAPD.L.mask; return (rcell(L, Math.floor(p.x / L.c), Math.floor(p.y / L.c)) === 1 || onUnitGround(p)) && !inHarbourPocket(p);
}
// for what looks far (the fetch rays, the local fleet, the grounds' stock): the national core only, land at 200 m
function isLandFar(p){
  if (!(p.x >= MAPB.x0 && p.y >= MAPB.y0 && p.x < MAPB.x1 && p.y < MAPB.y1)) return true;
  const L = MAPD.L.land200; return rcell(L, Math.floor(p.x / L.c), Math.floor(p.y / L.c)) === 1;
}
// for the screens (a tap on the chart, the route editor): the 25 m mask if its pack is in, else the core's 200 m and the pack is
// asked for; never part of the simulation
function isLandUI(p){ if (mapSimAt(p) && !mapReadyAt(p, 0)){ mapNeed(p, 0).catch(e => console.error(e)); return isLandFar(p); } return isLand(p); }
// The water in front of a quay is water, whatever the 25 m mask makes of it: a harbour unit's dredged basin, and 50 m out from a
// designer's quay face (QUAYS, 07-harbours.js), which the coastline of the map data may have moved (Finnsnes: OpenStreetMap's
// coast of 2026 lies 30-45 m out from the face drawn from the pictures, phase K5 of the coast plan)
const POCKET = 50;
let QPOCK = null;
function inHarbourPocket(p){ const x = p.x * 1000, z = p.y * 1000; return harbourNear(x, z) && pocketHit(UNITA, qPockets(), x, z); }
// whether x, z (m) lies within 200 m of a harbour unit or a quay pocket: a set of 200 m cells, so the ground and the sea far from the
// harbours skip the loops over them (the 3D view asks for every point of its meshes and every step of the shadows)
let HNEAR = null;
function harbourNear(x, z){
  if (!HNEAR){ HNEAR = new Set(); const add = (cx, cz) => { for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) HNEAR.add((Math.floor(cx / 200) + a) * 65536 + Math.floor(cz / 200) + b); };
    for (const U of UNITA) add(U.o[0], U.o[1]); for (const f of qPockets()) add(f.x, f.z); }
  return HNEAR.has(Math.floor(x / 200) * 65536 + Math.floor(z / 200));
}
function qPockets(){ if (!QPOCK){ QPOCK = []; for (const pid in QUAYS) for (const kind in QUAYS[pid]) if (!UNITS[pid]) QPOCK.push(quayFace(pid, kind)); } return QPOCK; }
function pocketHit(US, QS, x, z){
  for (const U of US){ if (Math.abs(x - U.o[0]) > 60 || Math.abs(z - U.o[1]) > 60) continue; const [lx, lz] = unitL(U, x, z); if (lz > 0 && lz <= UNIT.basinZ && Math.abs(lx) <= UNIT.basinX) return true; }
  for (const f of QS){ const dx = x - f.x, dz = z - f.z, s = dx * f.ux + dz * f.uz, t = dx * f.nx + dz * f.nz; if (t > 0 && t <= POCKET && Math.abs(s) <= f.hl + 4) return true; }
  return false;
}
// the same for the pockets near a box of km only (the chart asks for every pixel): null when there are none, else 1 in a pocket, 2 on
// a unit's block or fill (land on the chart), 0 elsewhere
function pocketsIn(x0, y0, x1, y1){
  const m = 0.2, near = (x, z) => x / 1000 > x0 - m && x / 1000 < x1 + m && z / 1000 > y0 - m && z / 1000 < y1 + m;
  const US = UNITA.filter(U => near(U.o[0], U.o[1])), QS = qPockets().filter(f => near(f.x, f.z));
  return US.length || QS.length ? (x, y) => { const X = x * 1000, Z = y * 1000; if (pocketHit(US, QS, X, Z)) return 1;
    for (const U of US){ if (Math.abs(X - U.o[0]) > 120 || Math.abs(Z - U.o[1]) > 120) continue; const [lx, lz] = unitL(U, X, Z); if (groundOut(U, lx, lz) === 0) return 2; } return 0; } : null;
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
  {id:'husoy', name:'Husøy', xy:[43.803,19.676], shore:[43.783,19.692], pier:true, fuel:true, ice:true, mottak:true, pf:1.03},
  {id:'senjahopen', name:'Senjahopen', xy:[36.807,25.119], shore:[36.791,25.09], pier:true, fuel:true, ice:true, mottak:true, pf:1.02},
  {id:'gryllefjord', name:'Gryllefjord', xy:[20.319,39.836], shore:[20.309,39.867], pier:true, fuel:true, ice:true, mottak:true, pf:0.97},
  // Sommarøy and Brensholmen: the berth is on the water side of the OpenStreetMap quay nearest the largest industrial building (not checked against pictures)
  {id:'sommaroy', name:'Sommarøy', xy:[56.761,9.545], shore:[56.736,9.511], pier:true, fuel:true, ice:true, mottak:true, pf:1.0},
  {id:'brensholmen', name:'Brensholmen', xy:[58.589,12.628], shore:[58.626,12.649], pier:true, fuel:true, ice:true, mottak:true, pf:0.99},
  {id:'torsken', name:'Torsken', xy:[21.856,42.58], shore:[21.863,42.548], pier:true, fuel:true, ice:true, mottak:true, pf:0.99},
  {id:'frovag', name:'Frovåg', xy:[19.651,71.922], shore:[19.607,71.915], pier:true, fuel:true, ice:true, mottak:true, pf:0.98}
].map((p, i) => ({...p, i, xy:LGa(p.xy), shore:LGa(p.shore), p:LG(p.xy[0], p.xy[1]), coast:LG(p.shore[0], p.shore[1])}));
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
// most land under the block and clear water in front. The landing berth stays within 25 m of the harbour point. Husøy (the user's
// wish 03.10.2026): the face on the line of the plant's sea walls in OpenStreetMap and parallel to its buildings, so the block stands
// on the shore, not out in the water.
// The fill behind the block (Jonas 04.10.2026: «det er viktig at fiskemottaket ser ut som det hører hjemme med omgivelsene»): where
// the shore lies back from the block, the ground goes on at the deck's height in to the land, so there is no water behind the quay.
// f is its outline in the unit's frame (lx, lz pairs, m): from the block's back to 3 m into the 3D ground's solid land (0.5 m and up
// for 10 m on), measured along every metre of the back from the view's packs (04.10.2026) where that land is within 70 m, at least
// 4 m deep all along the back (where the shore turns away at a corner, the block's back wall stands on that apron), simplified to 1 m.
// Its sides slope down to the seabed (view3d.js unitTerr); in the simulation it is land, as the block is.
const UNIT = {E:27.4, B:24.4, bot:-9, basinX:33.4, basinZ:26, dredge:6.6, berth:{main:[-5, 24], bunker:[16.5, 23]}};
const UNITS = {
  botnhamn:{o:[53282.5, 23499.9], u:[-0.993, -0.116], f:[27.4,-24.4, 27.4,-70.9, 12,-65.9, 9,-61.4, 7,-28.4, -27.4,-28.4, -27.4,-24.4]}, husoy:{o:[43788.5, 19672.7], u:[-0.12, -0.993], f:[27.4,-24.4, 27.4,-28.4, -27.4,-28.4, -27.4,-24.4]}, senjahopen:{o:[36807.1, 25112.1], u:[0.876, -0.483], f:[27.4,-24.4, 27.4,-35.9, 9,-46.4, -2,-28.4, -9,-28.4, -27.4,-39.4, -27.4,-24.4]},
  gryllefjord:{o:[20312.3, 39841.9], u:[-0.947, -0.32], f:[27.4,-24.4, 27.4,-28.4, -27.4,-28.4, -27.4,-24.4]}, sommaroy:{o:[56736.6, 9544.3], u:[-0.707, -0.707], f:[27.4,-24.4, 27.4,-28.4, -27.4,-28.4, -27.4,-24.4]}, brensholmen:{o:[58576.6, 12633.9], u:[-0.766, -0.643], f:[27.4,-24.4, 27.4,-80.4, 12,-59.4, 8,-47.9, 7,-38.9, -7,-28.4, -27.4,-28.4, -27.4,-24.4]},
  torsken:{o:[21862.9, 42573.6], u:[0.977, 0.215], f:[27.4,-24.4, 27.4,-32.9, 4,-28.4, -27.4,-28.4, -27.4,-24.4]}, frovag:{o:[19637.0, 71900.4], u:[0.189, -0.982], f:[27.4,-24.4, 27.4,-47.9, 13,-47.4, -10,-43.4, -21,-65.4, -24,-69.9, -27.4,-71.9, -27.4,-24.4]}
};
for (const k in UNITS){ const U = UNITS[k], l = Math.hypot(U.u[0], U.u[1]); U.id = k; U.u = LGu(U.o, [U.u[0] / l, U.u[1] / l]); U.o = LGm(U.o); U.n = [-U.u[1], U.u[0]]; }
const UNITA = Object.values(UNITS);
// the unit's frame and the world (metres)
const unitW = (U, lx, lz) => [U.o[0] + U.u[0] * lx + U.n[0] * lz, U.o[1] + U.u[1] * lx + U.n[1] * lz];
const unitL = (U, x, z) => { const dx = x - U.o[0], dz = z - U.o[1]; return [dx * U.u[0] + dz * U.u[1], dx * U.n[0] + dz * U.n[1]]; };
// how far (m) lx, lz in a unit's frame lie outside its block, outside its fill (Infinity without one) and outside both: 0 on it
const blockOut = (lx, lz) => Math.hypot(Math.max(0, Math.abs(lx) - UNIT.E), Math.max(0, -UNIT.B - lz, lz));
function fillOut(U, lx, lz){
  const f = U.f; if (!f) return Infinity;
  let inside = false, d2 = Infinity;
  for (let i = 0, j = f.length - 2; i < f.length; j = i, i += 2){
    const ax = f[j], az = f[j + 1], ex = f[i] - ax, ez = f[i + 1] - az;
    if ((az > lz) !== (f[i + 1] > lz) && lx < ax + (lz - az) * ex / ez) inside = !inside;
    const t = clamp(((lx - ax) * ex + (lz - az) * ez) / (ex * ex + ez * ez || 1), 0, 1), dx = lx - ax - ex * t, dz = lz - az - ez * t;
    d2 = Math.min(d2, dx * dx + dz * dz);
  }
  return inside ? 0 : Math.sqrt(d2);
}
const groundOut = (U, lx, lz) => Math.min(blockOut(lx, lz), fillOut(U, lx, lz));
// whether p (km) is on a unit's block or fill
function onUnitGround(p){
  const x = p.x * 1000, z = p.y * 1000; if (!harbourNear(x, z)) return false;
  for (const U of UNITA){ if (Math.abs(x - U.o[0]) > 120 || Math.abs(z - U.o[1]) > 120) continue; const [lx, lz] = unitL(U, x, z); if (groundOut(U, lx, lz) === 0) return true; }
  return false;
}
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
].map((g, i) => ({...g, i, xy:LGa(g.xy), p:LG(g.xy[0], g.xy[1])}));
[[0.15,0.12,0.1],[0.2,0.1,0.08],[0.15,0.15,0.12],[0.25,0,0.05],[0.2,0,0],[0.2,0,0.02]].forEach((v, i) => Object.assign(GROUNDS[i].sp, {lyr:v[0], uer:v[1], kveite:v[2]}));

