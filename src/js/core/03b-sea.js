// ===== SEA: fetch, wind sea, swell =====
// Fetch: how far the wind has blown over open water before it reaches p (km). 'from' is the direction the wind comes from on the
// grid (the rays run on the map): the true direction - gridGamma(p).
// Seven rays at -45..+45 degrees, effective fetch after Saville (Shore Protection Manual 1984): sum(F cos^2 a) / sum(cos a).
// The rays run on the national core (phase K6 of the coast plan), the same for every place on the coast: they march by the distance
// to the shore (dc200: 200 m grid, 100 m steps) and stop on the 200 m land. Off the frame (the open Norwegian Sea, the Barents Sea,
// the North Sea) the open sea's fetch is added.
const FETCH = {open:600, cell:0.2, sec:10, max:80000, near:1, fine:1.5};
const FETCH_A = [-45, -30, -15, 0, 15, 30, 45].map(a => ({a:a * Math.PI / 180, c:Math.cos(a * Math.PI / 180)}));
const FETCH_C = new Map();
function fetchRay(x, y, dx, dy){
  let s = 0; const q = {x, y};   // (one point along the ray: an object a step was the most garbage the sea state left, 05.11.2026)
  // the far layers looked up once a ray, and a step's land layer used again for its land (Ø3a, 07.11.2026): what farL, coastDistFar
  // and isLandFar pick for the point, the same layer and the same numbers (fetchRayRef in tests/unit/fetchray.test.mjs is the old way,
  // on the live farL, coastDistFar and isLandFar, so a change in their rule shows there)
  const LA = MAPD.L[FARL.land[0]], LB = MAPD.L[FARL.land[1]], DA = MAPD.L[FARL.dc[0]], DB = MAPD.L[FARL.dc[1]];
  for (let i = 0; i < 3000; i++){
    q.x = x; q.y = y;
    if (x < MAPB.x0 || y < MAPB.y0 || x >= MAPB.x1 || y >= MAPB.y1) return s + FETCH.open;
    const LL = LA && mapCellIn(LA, q) ? LA : LB && mapCellIn(LB, q) ? LB : null; if (!LL) return s + FETCH.open;   // (farL('land'))
    if (s >= FETCH.open) return s;
    const DL = DA && mapCellIn(DA, q) ? DA : DB && mapCellIn(DB, q) ? DB : null, d = DL ? rbil(DL, q) * DCSTEP[DL.name] : 0;   // (coastDistFar)
    let st = 0.1;
    if (d < 0.2){ if (rcell(LL, Math.floor(x / LL.c), Math.floor(y / LL.c)) === 1) return s; } else st = Math.max(0.1, 0.92 * d - 0.15);   // (isLandFar)
    x += dx * st; y += dy * st; s += st;
  }
  return s;
}
// x east, y south (km); a wind from bearing b comes from the direction (sin b, -cos b)
function fetchAt(p, from){
  if (isLandFar(p)) return 0;
  const b = from * Math.PI / 180; let num = 0, den = 0;
  for (const r of FETCH_A){ const a = b + r.a, F = fetchRay(p.x, p.y, Math.sin(a), -Math.cos(a)); num += F * r.c * r.c; den += r.c; }
  return num / den;
}
// cached at 200 m cells and 10 degree sectors as the root of the fetch (the wind sea goes as the root); a cell whose centre is on land is -1
function fetchCell(ix, iy, k){
  const key = gridKey(ix, iy) * 36 + k; let v = FETCH_C.get(key);
  if (v === undefined){
    const p = {x:(ix + 0.5) * FETCH.cell, y:(iy + 0.5) * FETCH.cell};
    v = isLandFar(p) ? -1 : Math.sqrt(fetchAt(p, k * FETCH.sec));
    if (FETCH_C.size >= FETCH.max) FETCH_C.clear();
    FETCH_C.set(key, v);
  }
  return v;
}
// bilinear between the four cell centres (land centres left out), and linear between the two neighbouring sectors, so it never jumps
function fetchSector(p, k){
  const gx = p.x / FETCH.cell - 0.5, gy = p.y / FETCH.cell - 0.5, ix = Math.floor(gx), iy = Math.floor(gy), fx = gx - ix, fy = gy - iy;
  let num = 0, den = 0;
  for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++){
    const v = fetchCell(ix + i, iy + j, k); if (v < 0) continue;
    const w = (i ? fx : 1 - fx) * (j ? fy : 1 - fy) + 1e-6; num += v * w; den += w;
  }
  return den > 0 ? num / den : Math.sqrt(fetchAt(p, k * FETCH.sec));
}
// Near the shore the 200 m core cannot see a harbour's breakwater or a narrow sound (Husøy's harbour lies in a 200 m land cell, and
// the field took the open sea outside for it). Within FETCH.near km of the core's land, where the tile's detail is in, the rays' first
// FETCH.fine km run on the 25 m mask (isLand, the harbour pockets too) and the core's rays go on from there. The detail is always in
// round the boats and the gear in the sea (the simulation's barrier, 01b-mapdata.js), where the simulation asks for the sea, so the
// simulation is the same whatever else is loaded; elsewhere (a view) it takes the field until the pack comes.
function fetchFine(p, from){
  const b = from * Math.PI / 180; let num = 0, den = 0;
  for (const r of FETCH_A){
    const a = b + r.a, dx = Math.sin(a), dy = -Math.cos(a); let x = p.x, y = p.y, s = 0, F = -1;
    while (s < FETCH.fine){ const q = {x, y}; if (isLand(q)){ F = s; break; } const st = Math.max(0.02, 0.9 * coastDist(q) - 0.05); x += dx * st; y += dy * st; s += st; }
    if (F < 0) F = s + fetchRay(x, y, dx, dy);
    num += F * r.c * r.c; den += r.c;
  }
  return num / den;
}
function fetchHere(p, from){ return coastDistFar(p) < FETCH.near && mapSimAt(p) && mapReadyAt(p, 0) ? fetchFine(p, from) : fetchField(p, from); }
function fetchField(p, from){
  const f = ((from % 360) + 360) % 360 / FETCH.sec, k0 = Math.floor(f), u = f - k0;
  const r = fetchSector(p, k0 % 36) * (1 - u) + (u > 1e-3 ? fetchSector(p, (k0 + 1) % 36) * u : 0); return r * r;
}

// Wind sea limited by fetch (JONSWAP, Hasselmann et al. 1973), U at 10 m (m/s), F in km:
//   Hs = 0.0016 U sqrt(F/g),  Tp = 0.286 (U/g) (gF/U^2)^(1/3)
// It never grows past the probable height WMO gives for the open sea at each Beaufort force (the WMO Beaufort table, as NOAA and
// the Hong Kong Observatory print it), interpolated between the middle speeds of the forces.
const WMO = {u:[0.1, 0.9, 2.45, 4.4, 6.7, 9.35, 12.3, 15.5, 18.95, 22.6, 26.45, 30.55, 34.5], hs:[0, 0.1, 0.2, 0.6, 1, 2, 3, 4, 5.5, 7, 9, 11.5, 14]};
function hsWMO(U){
  const u = WMO.u, h = WMO.hs; if (U <= u[0]) return 0;
  for (let i = 1; i < u.length; i++) if (U < u[i]) return h[i - 1] + (h[i] - h[i - 1]) * (U - u[i - 1]) / (u[i] - u[i - 1]);
  return h[12] + (U - u[12]) * 0.6;
}
function hsWind(U, F){ return Math.min(hsWMO(U), 0.0016 * U * Math.sqrt(F * 1000 / 9.81)); }
// the fetch (km) at which the wind sea reaches the open-sea height, and the peak period it has there
function fetchCap(U){ return U > 0.3 ? (hsWMO(U) / (0.0016 * U)) ** 2 * 9.81 / 1000 : 0; }
function tpWind(U, F){ const f = Math.min(F, fetchCap(U)) * 1000; return f > 0 ? 0.286 * (U / 9.81) * Math.cbrt(9.81 * f / (U * U)) : 0; }
// the wind the sea has had time to answer: most of now, some of three hours ago
// (kept per hour and 5 km cell: the weather moves along the coast, V4)
let WE_MEMO = {H:NaN, k:null, v:0}, WD_MEMO = {H:NaN, k:null, v:0};
function wdAt(H, p){ const k = wxPlace(p); if (H === WD_MEMO.H && k === WD_MEMO.k && !WX_FORCE) return WD_MEMO.v; const v = windDir(H, p); WD_MEMO = {H, k, v}; return v; }
function weAt(H, p){ const k = wxPlace(p); if (H === WE_MEMO.H && k === WE_MEMO.k && !WX_FORCE) return WE_MEMO.v; const v = 0.6 * windAt(H, p) + 0.4 * windAt(H - 3, p); WE_MEMO = {H, k, v}; return v; }

// Swell from the Norwegian Sea, from the west-north-west: a seasonal ground swell, and what the lows leave behind, which dies away
// over a day (only the sea a wind from the west half raised runs in towards the coast). It fades into the fjords and sounds with the
// openness to the ocean (EXPO, the same map exposure() is made from). The ground swell is set so the outer grounds keep the year's mean
// wave height they had before the fetch (Jonas' choice 02.10.2026).
const SWELL = [1.25,1.25,1.1,0.85,0.65,0.5,0.45,0.5,0.75,0.95,1.1,1.25];
const SWELL_K = [6, 12, 18, 24, 36];
let SW_MEMO = {H:NaN, k:null, v:null};
function swellOpen(H, p){
  const K = wxPlace(p), Hl = H - K.dt; if (H === SW_MEMO.H && K === SW_MEMO.k && !WX_FORCE) return SW_MEMO.v;
  const base = seasonal(SWELL, Hl) * (0.1 + 1.8 * vn(Hl / 50, 77));
  let rem = 0;
  for (const k of SWELL_K){ const d = windDir(H - k, p) * Math.PI / 180, west = Math.max(0, -Math.sin(d)); rem = Math.max(rem, hsWMO(weAt(H - k, p)) * Math.exp(-k / 24) * west); }
  const hs = Math.hypot(base, rem);
  const v = {hs, dir:300 + 50 * (vn(Hl / 60, 313) - 0.5), tp:clamp(8.5 + 1.1 * hs, 9, 14)};
  SW_MEMO = {H, k:K, v}; return v;
}
function swellFactor(p){ return Math.pow(expoFar(p) / 255, 1.5); }
// the sea at p: wind sea w and swell sw (significant heights, m), the wind sea's peak period and fetch, and where each comes from
function hsParts(p, H){
  const U = weAt(H, p), d = wdAt(H, p), F = fetchHere(p, d - gridGamma(p)), S = swellOpen(H, p);
  return {w:hsWind(U, F), sw:S.hs * swellFactor(p), tp:tpWind(U, F), F, U, dir:d, swDir:S.dir, swTp:S.tp};
}
let HS_MEMO = {x:NaN, y:NaN, H:NaN, v:0};
function hsAt(p, H){
  if (p.x === HS_MEMO.x && p.y === HS_MEMO.y && H === HS_MEMO.H && !WX_FORCE) return HS_MEMO.v;
  const q = hsParts(p, H), v = Math.max(0.05, Math.hypot(q.w, q.sw));
  HS_MEMO = {x:p.x, y:p.y, H, v}; return v;
}
function hsOpen(H, p){ return Math.max(0.05, Math.hypot(hsWMO(weAt(H, p)), swellOpen(H, p).hs)); }
// forecasts: the forecast wind (with its error) through the same sea; the swell forecast has its own error
function fcHsOpen(H, now, p){ return hsOpen(H, p) * (1 + fcErr(H, now, 5900)); }
function hsAtFc(p, H, now){
  const U = 0.6 * fcWind(H, now, p) + 0.4 * fcWind(H - 3, now, p), F = fetchHere(p, windDir(H, p) - gridGamma(p));
  return Math.max(0.05, Math.hypot(hsWind(U, F), swellOpen(H, p).hs * (1 + fcErr(H, now, 5900)) * swellFactor(p)));
}
// the sea state number by the significant wave height (the Douglas scale, WMO code 3700: 0 glassy ... 9 phenomenal)
const SEA_CODE = [0.05, 0.1, 0.5, 1.25, 2.5, 4, 6, 9, 14];
function seaState(hs){ let c = 0; while (c < 9 && hs >= SEA_CODE[c]) c++; return c; }
// the sea where you are, for the weather texts: wind sea and swell with where they come from, the state, and whether the wind sea is
// krapp (short and steep, as a young sea in a fjord: its height over its peak wavelength above 1/25)
function seaHere(p, H){
  const q = hsParts(p, H), hs = Math.max(0.05, Math.hypot(q.w, q.sw)), Lp = 1.56 * q.tp * q.tp;
  let cur = null; try { cur = seaCur(p, H, q); } catch (e){}   // (the wind sea against the stream, F8b)
  return {hs, w:q.w, sw:q.sw, dir:q.dir, swDir:q.swDir, swTp:q.swTp, code:seaState(hs), krapp:q.w >= 0.4 && q.w >= q.sw && Lp > 0 && q.w / Lp > 0.04, cur};
}
// ---- waves on a current (Ø9 F8b, docs/planer/fysikk-4-sjo-og-skrog.md F8) ----
// A wave that runs on to a current keeps its frequency as the ground sees it, om, and its wavenumber follows (om - k U)^2 = g k (deep
// water; U the current along the way the wave travels, negative against it). The phase speed through the water is then
// c = c0 (1 + sqrt(1 + 4 U / c0)) / 2 (c0 = g / om) and k = g / c^2: shorter against the stream, longer with it. The height follows the
// wave action (Longuet-Higgins and Stewart 1961): H / H0 = sqrt(c0 cg0 / (c (cg + U))) = c0 / sqrt(c (c + 2 U)), so a sea against the
// stream is shorter and higher (steep, breaking), with it longer and lower. At U = -c0 / 4 the wave is blocked (its energy cannot get
// up against the stream) and the formula goes to infinity: held at CURW.max (2.5, the plan's cap), where the sea breaks instead.
// The boat feels the stream without the wind's drift (curAt's sx, sy), and none of it under 0.2 knots (all of it from 0.3): the tide's
// own stream along the open coast is under that, so nothing changes there (curEff).
const CURW = {max:2.5, dead:0.2 * 1852 / 3600, full:0.3 * 1852 / 3600, krapp:1852 / 3600, w:0.2};
function curWave(om, U){
  const c0 = 9.81 / om; if (!(om > 0) || !(Math.abs(U) > 1e-3)) return {kf:1, af:1, c:c0, blocked:false};
  const x = 1 + 4 * U / c0; if (x <= 0) return {kf:4, af:CURW.max, c:c0 / 2, blocked:true};
  const c = c0 * 0.5 * (1 + Math.sqrt(x)); return {kf:(c0 / c) ** 2, af:Math.min(CURW.max, c0 / Math.sqrt(c * (c + 2 * U))), c, blocked:false};
}
// the stream a vessel and the waves feel, of what curAt gives: m/s east and south on the grid, and its speed (CURW.off: none, for the
// tests' comparison with still water; the game never sets it)
// (tx, ty: the part that turns with the tide, the sounds' stream and the tide's own, with the same dead band of its own: what carries a
// boat lying still, lieDrift. The coastal current runs one way, and a boat left lying a week would be 100 km down the coast.)
function curEff(c){
  const band = m => CURW.off ? 0 : m > CURW.dead ? clamp((m - CURW.dead) / (CURW.full - CURW.dead), 0, 1) : 0;
  const m = Math.hypot(c.sx, c.sy), f = band(m), tx0 = c.tx == null ? c.sx : c.tx, ty0 = c.ty == null ? c.sy : c.ty, ft = band(Math.hypot(tx0, ty0));
  return {x:c.sx * f, y:c.sy * f, m:m * f, tx:tx0 * ft, ty:ty0 * ft};
}
// the stream along the way a sea travels that comes from the true bearing from (degrees) where the grid is turned g: + with it
function curAlong(C, from, g){ const a = (from - g + 180) * Math.PI / 180; return C.x * Math.sin(a) - C.y * Math.cos(a); }
// the stream at p for the weather's words: its speed (knots), where it sets (true degrees), how much higher the wind sea stands in
// it, and krapp: the wind sea (at least CURW.w m of it) runs against a stream of over a knot
function seaCur(p, H, q){
  if (typeof curAt !== 'function') return null; const C = curEff(curAt(p, H)); if (!(C.m > 0)) return {kn:0, to:0, af:1, krapp:false};
  const g = gridGamma(p), U = curAlong(C, q.dir, g), cw = q.tp > 0.3 ? curWave(2 * Math.PI / q.tp, U) : {af:1};
  return {kn:C.m * 3600 / 1852, to:((Math.atan2(C.x, -C.y) * 180 / Math.PI + g) % 360 + 360) % 360, af:cw.af, against:-U * 3600 / 1852, krapp:q.w >= CURW.w && U <= -CURW.krapp};
}
// How much of the sea's speed loss she takes, by where the sea comes from (Fysikk 2, 19.10.2026): Kwon's direction factors for the
// involuntary speed loss in wind and waves (Y. J. Kwon, «Speed loss due to added resistance in wind and waves», The Naval
// Architect, March 2008), at force 6: 1 in a head sea, 0.79 on the bow, 0.45 abeam, 0.14 from astern. A small boat eases down in a
// steep following sea to keep from broaching, so from astern she keeps a third of the loss here. The wind sea and the swell count by
// their energy; rel is the angle between the bow and where the sea comes from (0 a head sea).
const SEA_DIRF = [[0, 1], [30, 0.97], [60, 0.78], [90, 0.55], [120, 0.44], [150, 0.37], [180, 0.35]];
function seaDirOf(rel){
  const a = Math.min(180, Math.abs(rel) * 180 / Math.PI);
  for (let i = 1; i < SEA_DIRF.length; i++) if (a <= SEA_DIRF[i][0]){ const [a0, f0] = SEA_DIRF[i - 1], [a1, f1] = SEA_DIRF[i]; return f0 + (f1 - f0) * (a - a0) / (a1 - a0); }
  return SEA_DIRF[SEA_DIRF.length - 1][1];
}
// the sea's parts near p (kept per 100 m and game hour: the model asks every tick)
let SEAP_MEMO = {k:'', v:null};
function seaPartsNear(p, H){ const k = H + '|' + Math.round(p.x * 10) + '|' + Math.round(p.y * 10); if (SEAP_MEMO.k === k && !WX_FORCE) return SEAP_MEMO.v; const v = hsParts(p, H); SEAP_MEMO = {k, v}; return v; }
// the share of the loss on the heading head (grid, radians, clockwise from north)
function seaDirF(p, H, head){
  const q = seaPartsNear(p, H), g = gridGamma(p), e = q.w * q.w + q.sw * q.sw; if (!(e > 1e-4) || !isFinite(head)) return 1;
  const rel = from => { let d = ((from - g) * Math.PI / 180 - head) % (2 * Math.PI); if (d > Math.PI) d -= 2 * Math.PI; if (d < -Math.PI) d += 2 * Math.PI; return d; };
  return (q.w * q.w * seaDirOf(rel(q.dir)) + q.sw * q.sw * seaDirOf(rel(q.swDir))) / e;
}
