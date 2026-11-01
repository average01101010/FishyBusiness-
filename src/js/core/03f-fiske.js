// The fishing along the coast as it really was, and where the fish is from it (B2 of docs/planer/bestand-og-flaate.md, 01.11.2026).
// src/data/fiske.json (tools/npc/fiske.py, B1: Fiskeridirektoratet's landing notes 2024-2025, NLOD) is in the page as a string and is
// read the first time the fishing asks (fkData): as an object literal its 366 kB cost 51 ms at startup in Chromium.
//
//  fkCell(sp, area, m, gear, lg)   kg and landings a year in a location (the coast, '05-29') or a main area (the ocean fleet, '05'), month
//                                  0-11, gear (a name of meta.gear or null for all) and length group (0-4, or null for all)
//  areaF(sp, p, H)                 how much of a species stands at a point and hour, as the factor density() puts where the one table
//                                  av (and the skrei pulse) was: av × the location against Senja, from the catch per landing
//  lokOfCell(p)                    the location (index in RU.lok) and latitude of the 2 km cell a point is in, kept per cell
//  MIG                             the migrations where the notes alone do not show the movement (skrei, herring, mackerel, saithe; HI)
//
// The density from the notes (valg A, Jonas 01.11.2026): the catch per landing in a location and month, set against what a landing
// of that gear and length group takes nationally (so a coastal netter and a 20 m line boat count alike), times the share of the
// location's landings that month that had the species (the effort is all the landings there: the most of any species that month), and
// smoothed: a quarter from each neighbouring month, half from the mean of the neighbouring locations (their polygons in rules.json share
// a corner), and drawn towards the main area's figure while there are under FK.n0 landings. The game uses it as the location against
// the Senja grounds the game was calibrated on, in the same month, so Senja keeps its numbers and k hardly moves; where there is no
// figure (no landings in the location or its main area), the factor is 1 and the old table holds. Cod is split in two: the resident
// coastal cod (the summer level of the location against Senja's) and the skrei, the location's catch over its summer level from January
// to May against Senja's, which comes and goes with the skrei front (MIG.skrei) and the spawning stock (stockF). Bergen's cod has no such
// excess in spring, so Bergen has no skrei. The Greenland halibut and the king crab keep their own geography (eggaArea, kingArea), which
// was taken from the same notes.
const FISKE_T = /*@text(data/fiske.json)*/null;
// the game's species and their name in fiske.json; the ones with their own geography are not here
const FK_SP = {torsk:'torsk', hyse:'hyse', sei:'sei', lyr:'lyr', lange:'lange', brosme:'brosme', uer:'uer', kveite:'kveite', sild:'sild', makrell:'makrell', snokrabbe:'snokrabbe'};
const FK = {d:null, n0:20, nb:0.5, mo:0.25, lo:0.03, hi:5, skreiM:5};
function fkData(){
  if (FK.d !== null) return FK.d;
  try { FK.d = typeof FISKE_T === 'string' ? JSON.parse(FISKE_T) : (FISKE_T || false); } catch (e){ FK.d = false; }
  return FK.d;
}
// the cells of a species, by area code: {k: {'05-29': [12 months]}, h: {'05': [...]}} (the months as fiske.json writes them)
function fkIndex(fs){
  const D = fkData(); if (!D || !D.sp[fs]) return null; FK.ix = FK.ix || {};
  if (FK.ix[fs]) return FK.ix[fs];
  const o = D.sp[fs], k = {}, h = {}; for (const [a, ms] of o.k) k[D.meta.lok[a]] = ms; for (const [a, ms] of o.h) h[D.meta.hom[a]] = ms;
  return FK.ix[fs] = {k, h};
}
// kg and landings a year: a location ('05-29') or, with two digits, a main area ('05': the ocean fleet and the notes without a location)
function fkCell(sp, area, m, gear, lg){
  const D = fkData(), fs = FK_SP[sp] || (sp === 'krabbe' ? 'kongekrabbe' : sp), I = fkIndex(fs); if (!I) return {kg:0, n:0};
  const ms = (String(area).length > 2 ? I.k : I.h)[area]; if (!ms) return {kg:0, n:0};
  const gi = gear == null ? -1 : D.meta.gear.indexOf(gear); let kg = 0, n = 0;
  for (const c of [ms[m]]) for (let i = 0; i < c.length; i += 3){ const g = Math.floor(c[i] / 6), l = c[i] % 6; if ((gi < 0 || g === gi) && (lg == null || l === lg)){ kg += c[i + 1]; n += c[i + 2]; } }
  return {kg:kg / D.meta.ny, n:n / D.meta.ny};
}

// ---- the location of a 2 km cell (ruLok kept per cell, plan 5b: looked up per cell and hour, not per point) ----
const LOKC = new Map(), LOKB = new Map();
function lokCands(bx, by){
  const key = bx * 8192 + by; let L = LOKB.get(key); if (L) return L;
  const x0 = bx * 10, y0 = by * 10; L = [];
  RU.lok.forEach((h, i) => { for (const p of h.P){ const b = p.bb; if (b[2] >= x0 && b[0] <= x0 + 10 && b[3] >= y0 && b[1] <= y0 + 10){ L.push(i); break; } } });
  LOKB.set(key, L); return L;
}
// {l: the location's index in RU.lok (-1 outside them all), lat, lon: the cell's middle}
function lokOfCell(p){
  const ix = Math.floor(p.x / 2), iy = Math.floor(p.y / 2), key = gridKey(ix, iy); let c = LOKC.get(key); if (c) return c;
  const cx = (ix + 0.5) * 2, cy = (iy + 0.5) * 2; let l = -1;
  if (RU.ok) for (const i of lokCands(Math.floor(cx / 10), Math.floor(cy / 10))) if (ruIn(RU.lok[i].P, cx, cy)){ l = i; break; }
  if (LOKC.size > 200000) LOKC.clear();
  const ll = natLL({x:cx, y:cy}); c = {l, lat:ll.lat, lon:ll.lon}; LOKC.set(key, c); return c;
}

// ---- the migrations (MIG): HI's descriptions, as curves of time and place ----
// mf: the month as a float, 0 = 1 January, 12 = the next; a bump that is 1 at c and 0 beyond w months, round the year
const migBump = (mf, c, w) => { let d = Math.abs(mf - c) % 12; if (d > 6) d = 12 - d; return d >= w ? 0 : 0.5 + 0.5 * Math.cos(Math.PI * d / w); };
const migBand = (x, a, b, e) => sstep(a - e, a + e, x) * (1 - sstep(b - e, b + e, x));
const MIG = {
  // The skrei (HI, «Skrei» and the cod's spawning migration, hi.no; the landing notes per location): the spawning cod comes in from the
  // Barents Sea to Finnmark and Troms from January and to Vesterålen and Lofoten in February-April, and leaves in May. The front goes
  // south along the coast: the game's skrei pulse (SPECIES.torsk.skrei) is the one at Senja's latitude, and it comes days earlier per
  // degree further north and later further south, so Båtsfjord (70.7° N) has the skrei three weeks before Røst (67.5° N). How much is
  // the location's own excess over its summer level in the notes (areaF) and the spawning stock (stockF).
  skreiDays:7, latRef:69.3,
  // the front runs along the skrei's coast, Helgeland to Øst-Finnmark (66-71.2° N); south of it the skrei hardly comes (areaF)
  skreiShiftH(lat){ return (clamp(lat, 66, 71.2) - MIG.latRef) * MIG.skreiDays * 24; },
  // Norwegian spring-spawning herring (HI, «Norsk vårgytande sild», hi.no, and the herring's migration in the Norwegian Sea): spawns
  // on the banks off Møre and on Haltenbanken (62-65.5° N) in February-March, feeds out in the Norwegian Sea in summer (outside the
  // frame), and winters off Troms and Vesterålen (the fjords and the shelf, 68.5-71° N) from October to January.
  sild(lat, lon, mf){
    const spawn = migBump(mf, 1.9, 1.6) * migBand(lat, 62, 65.5, 0.4) * (lon < 13 ? 1 : 0.2);
    const winter = migBump(mf, 11.5, 2.4) * migBand(lat, 68.3, 71, 0.4) * (lon > 13 && lon < 23 ? 1 : 0.3);
    return Math.min(1, spawn + winter + 0.04);
  },
  // Mackerel (HI, «Makrell», hi.no): winters and spawns west of the British Isles and comes into the North Sea and up the coast in
  // early summer; along the Norwegian coast north to Lofoten and Vesterålen in July-September, south and out to sea in October-November.
  // None along the coast December-April. The northern edge goes from 58° N in May to 69° N in August.
  makrell(lat, lon, mf){
    const on = migBump(mf, 7.8, 4.3); if (on <= 0) return 0;
    const edge = 58 + 11 * migBump(mf, 7.6, 2.8);
    return on * (1 - sstep(edge - 0.6, edge + 0.6, lat));
  },
  // Saithe (HI, «Sei», hi.no; the landing notes): spawns offshore on the banks off Møre and Haltenbanken (62-65.5° N) in February-March,
  // and the schools come in along the coast in spring, strongest in May. A factor round 1 that lifts the spawning grounds in late winter
  // and the coast north of 65° N in May; where the notes have the location, they rule, and this fills in where they are thin (areaF).
  sei(lat, lon, mf){
    return 1 + 1.2 * migBump(mf, 1.8, 1.4) * migBand(lat, 62, 65.5, 0.4) + 0.8 * migBump(mf, 4.5, 1.2) * sstep(64.5, 65.5, lat);
  },
  // Capelin (HI, «Lodde», hi.no): spawns along the coast of Finnmark and Kola in March-April, and the cod follows it in to the coast
  // (the «loddetorsk»). A pulse with the same weight over the season as the skrei pulse (peak 3.7 against 2.5, narrower), on the
  // Finnmark coast from Loppa east (lon > 21.5, lat > 70.2); there the cod's spring comes half with the skrei front and half with it.
  lodde(lat, lon, mf){ return 3.7 * migBump(mf, 3.3, 1.6); },
  loddeW(lat, lon){ return 0.5 * sstep(70.0, 70.4, lat) * sstep(21.2, 21.8, lon); },
  // Snow crab (HI, «Snøkrabbe», hi.no): a newcomer in the Barents Sea, spreading west from the Russian side; fished in the east of the
  // Norwegian zone and in the Loophole, north of 72° N and east of 30° E (the corner of the game's frame). None along the coast.
  snokrabbe(lat, lon){ return sstep(28.5, 31, lon) * sstep(71.6, 72.4, lat); },
};

// ---- where the fish swim: the heading of the schools and of the good patches, by species, season and place ----
// A compass bearing (0 north, clockwise, in the grid) blended from the species' migration at that time and place and a slow local
// wander. Sources as the curves above (HI): the skrei goes south-west along the coast to the spawning grounds in January-March and
// north-east back to the Barents Sea in April-May, and in Finnmark in to the coast after the capelin in March-April; the saithe out to
// the spawning banks in January-March and in along the coast in April-June; the haddock out to the shelf edge to spawn in March-May;
// the herring in to the spawning grounds in February-March, out to the Norwegian Sea in April-July and north-east to the wintering
// fjords of Troms in September-November; the mackerel north along the coast in May-August and south and out in September-November.
// The rest (pollack, ling, tusk, redfish, halibut, Greenland halibut) only wander. Out to sea is a smooth bearing by stretch of coast.
const RAD_ = Math.PI / 180;
function migOffshore(lat, lon){
  // west off Vestlandet, west-north-west off Møre to Lofoten, north-west off Troms, north off Finnmark, south in the Skagerrak
  const v = (b, w) => [Math.sin(b * RAD_) * w, -Math.cos(b * RAD_) * w];
  const sk = 1 - sstep(58.3, 58.9, lat), fm = sstep(70.2, 70.7, lat) * sstep(21, 22.5, lon), tr = sstep(68.8, 69.4, lat) * (1 - fm), mo = sstep(61.5, 62.5, lat) * (1 - tr) * (1 - fm), we = Math.max(0, 1 - sk - mo - tr - fm);
  const a = [[180, sk], [270, we], [295, mo], [325, tr], [5, fm]]; let x = 0, y = 0; for (const [b, w] of a){ const q = v(b, w); x += q[0]; y += q[1]; }
  return Math.atan2(x, -y) / RAD_;
}
// {b: bearing in degrees, w: 0-1 how strongly the species is migrating there now}
function migHeading(sp, lat, lon, mf){
  const off = migOffshore(lat, lon), parts = [];
  if (sp === 'torsk' && lat > 65.5){ const k = sstep(65.5, 66.5, lat); parts.push([225, 0.8 * k * migBump(mf, 1.5, 1.8)], [45, 0.8 * k * migBump(mf, 4.4, 1.2)]);
    if (MIG.loddeW(lat, lon) > 0) parts.push([off + 180, 1.2 * MIG.loddeW(lat, lon) * migBump(mf, 3.2, 1.2)]); }
  else if (sp === 'sei') parts.push([off, 0.6 * migBump(mf, 1.4, 1.5)], [off + 180, 0.6 * migBump(mf, 4.6, 1.6)]);
  else if (sp === 'hyse') parts.push([off, 0.4 * migBump(mf, 3.8, 1.5)], [off + 180, 0.3 * migBump(mf, 7, 1.5)]);
  else if (sp === 'sild') parts.push([off + 180, 0.8 * migBump(mf, 1.5, 1.1)], [off, 0.8 * migBump(mf, 5.2, 2)], [45, 0.7 * migBump(mf, 9.6, 1.5)]);
  else if (sp === 'makrell') parts.push([0, 0.8 * migBump(mf, 6.2, 2.4)], [210, 0.8 * migBump(mf, 10, 1.5)]);
  let x = 0, y = 0, w = 0; for (const [b, k] of parts){ if (k <= 0) continue; x += Math.sin(b * RAD_) * k; y += Math.cos(b * RAD_) * k; w += k; }
  return w > 0 ? {b:Math.atan2(x, y) / RAD_, w:Math.min(1, Math.hypot(x, y))} : {b:0, w:0};
}
// The heading of a species' schools or patches in a period k (of T hours): the migration blended with a slow wander that differs from
// place to place (a noise over ~100 km) and from period to period; mw is how much the migration may steer (the patches drift more
// freely). It is worked out at the nodes of a 20 km grid, kept per node, period and kind, and read between the four nodes round a point,
// so the pattern bends smoothly and has no seams. migDir gives the direction as a vector [east, north] (length 1 or less).
const MIGN = {c:20, ll:new Map(), a:new Map()};
function migNode(si, sp, ix, iy, k, T, mw, kind){
  const key = ((gridKey(ix, iy) * 256 + (k & 255)) * 16 + si) * 2 + kind; let v = MIGN.a.get(key); if (v) return v;
  const nk = gridKey(ix, iy); let ll = MIGN.ll.get(nk); if (!ll){ ll = natLL({x:(ix + 0.5) * MIGN.c, y:(iy + 0.5) * MIGN.c}); MIGN.ll.set(nk, ll); }
  const seed = kind ? 700 : 740, wa = 2 * Math.PI * (h2(k, seed + si) + 0.35 * (noise2(ll.lon * 0.6, ll.lat * 1.2, seed + 13 * si + (k & 127)) - 0.5));
  const m = migHeading(sp, ll.lat, ll.lon, mfOfH(k * T + T / 2)), w = m.w * mw;
  v = [Math.sin(wa) * (1 - w) + Math.sin(m.b * RAD_) * w, Math.cos(wa) * (1 - w) + Math.cos(m.b * RAD_) * w];
  if (MIGN.a.size > 60000) MIGN.a.clear(); MIGN.a.set(key, v); return v;
}
function migDir(sp, p, k, T, mw, kind){
  const si = ALLSP.indexOf(sp), gx = p.x / MIGN.c - 0.5, gy = p.y / MIGN.c - 0.5, ix = Math.floor(gx), iy = Math.floor(gy), fx = gx - ix, fy = gy - iy;
  const a = migNode(si, sp, ix, iy, k, T, mw, kind), b = migNode(si, sp, ix + 1, iy, k, T, mw, kind), c = migNode(si, sp, ix, iy + 1, k, T, mw, kind), d = migNode(si, sp, ix + 1, iy + 1, k, T, mw, kind);
  const e = (a[0] * (1 - fx) + b[0] * fx) * (1 - fy) + (c[0] * (1 - fx) + d[0] * fx) * fy, n = (a[1] * (1 - fx) + b[1] * fx) * (1 - fy) + (c[1] * (1 - fx) + d[1] * fx) * fy;
  const l = Math.hypot(e, n) || 1; return [e / l, n / l];
}
// the month as a float (0 = 1 January) for an hour
function mfOfH(H){ const d = gDate(H); return d.getUTCMonth() + (d.getUTCDate() - 1) / 31; }

// ---- the fish up and down in the water: by night most species rise from the bottom (HI; the diel vertical migration) ----
// z: the share of the water column above the bottom where the fish stands, by day and by night. Bottom nets and lines fish what
// stands near the bottom, the floating net what stands high; the jig is dropped to the fish, and bites best at dusk and dawn.
const VERT = {torsk:[0.06, 0.25], hyse:[0.03, 0.1], sei:[0.3, 0.6], lyr:[0.2, 0.4], lange:[0.02, 0.05], brosme:[0.02, 0.05], uer:[0.1, 0.25],
  kveite:[0.05, 0.15], blakveite:[0.03, 0.08], sild:[0.25, 0.75], makrell:[0.45, 0.6]};
// night (0 day, 1 night) and twilight (0-1, the sun between 6° below and 4° above the horizon) of a 2 km cell, kept for the hour
function cellNight(c, H){
  const h = Math.floor(H); if (c.nH === h) return c;
  const e = sunAt(h + 0.5, P(c.lat, c.lon)).el; c.nH = h; c.nt = 1 - sstep(-12, -2, e); const dt = Math.min(1, Math.abs(e + 1) / 5); c.tw = 0.5 + 0.5 * Math.cos(Math.PI * dt); return c;
}
function vertZ(sp, night){ const v = VERT[sp]; return v ? v[0] + (v[1] - v[0]) * night : 0.1; }
// what a set gear gets of the species at the hour against the day's mean: bottom gear the fish near the bottom, the floating net the
// fish high up (the mean over a day and a night is about 1, so the calibration of the gear holds)
function gearVertF(sp, key, p, H){
  const v = VERT[sp]; if (!v) return 1; const n = cellNight(lokOfCell(p), H).nt, z = vertZ(sp, n), zm = (v[0] + v[1]) / 2;
  return key === 'garn:flyt' ? z / zm : (1 - z) / (1 - zm);
}
// the jig's bite through the day: best at dusk and dawn, when the fish feeds (up to +15 %)
function biteF(sp, p, H){ if (!VERT[sp]) return 1; return 1 + 0.15 * cellNight(lokOfCell(p), H).tw; }

// ---- the field from the notes: per species a Float32Array of locations × 12 months against Senja (NaN: no figure) ----
// the neighbours of each location: the polygons in rules.json that share a corner (to 50 m)
function fkNeighbours(){
  if (FK.nb_) return FK.nb_;
  const cell = new Map(), q = v => Math.round(v / 0.05);
  RU.lok.forEach((h, i) => { for (const p of h.P) for (const r of p.rings) for (let j = 0; j + 1 < r.length; j += 2){ const k = q(r[j]) * 1e6 + q(r[j + 1]); let s = cell.get(k); if (!s) cell.set(k, s = new Set()); s.add(i); } });
  const nb = RU.lok.map(() => new Set());
  for (const s of cell.values()) if (s.size > 1) for (const a of s) for (const b of s) if (a !== b) nb[a].add(b);
  return FK.nb_ = nb.map(s => [...s]);
}
function fkBuild(){
  if (FK.af !== undefined) return FK.af;
  const D = fkData(); if (!D || !RU.ok){ FK.af = null; return null; }
  const t0 = typeof performance !== 'undefined' ? performance.now() : 0;
  const NL = RU.lok.length, lokI = new Map(RU.lok.map((h, i) => [h.c, i])), NB = fkNeighbours(), M = D.meta;
  const map = M.lok.map(c => lokI.has(c) ? lokI.get(c) : -1), hom = RU.lok.map(h => h.c.slice(0, 2));
  // all landings in a location and month: the most of any species (one landing with cod and saithe is one landing)
  const NALL = new Float64Array(NL * 12);
  for (const fs in D.sp) for (const [a, ms] of D.sp[fs].k){ const l = map[a]; if (l < 0) continue; for (let m = 0; m < 12; m++){ const c = ms[m]; let n = 0; for (let i = 2; i < c.length; i += 3) n += c[i]; if (n > NALL[l * 12 + m]) NALL[l * 12 + m] = n; } }
  // smoothing: a quarter from each neighbouring month, then half of the neighbours' mean
  const smooth = X => { const Y = new Float64Array(NL * 12), Z = new Float64Array(NL * 12);
    for (let l = 0; l < NL; l++) for (let m = 0; m < 12; m++) Y[l * 12 + m] = X[l * 12 + m] + FK.mo * (X[l * 12 + (m + 11) % 12] + X[l * 12 + (m + 1) % 12]);
    for (let l = 0; l < NL; l++){ const nb = NB[l]; for (let m = 0; m < 12; m++){ let s = 0; for (const b of nb) s += Y[b * 12 + m]; Z[l * 12 + m] = Y[l * 12 + m] + (nb.length ? FK.nb * s / nb.length : 0); } }
    return Z; };
  const NA = smooth(NALL);
  // the Senja grounds the game is calibrated on (GROUNDS 0-3: Husøy, Mefjorden, Gryllefjord, Malangsgapet)
  const ref = [...new Set(GROUNDS.slice(0, 4).map(g => lokOfCell(g.p).l).filter(l => l >= 0))];
  MIG.latRef = GROUNDS.slice(0, 4).reduce((a, g) => a + natLL(g.p).lat, 0) / 4;
  const af = {};
  for (const sp in FK_SP){
    const o = D.sp[FK_SP[sp]]; if (!o) continue;
    // what a landing of each gear × length group takes nationally (both tables)
    const E = new Float64Array(54 * 2);
    for (const tab of ['k', 'h']) for (const [, ms] of o[tab]) for (const c of ms) for (let i = 0; i < c.length; i += 3){ E[c[i] * 2] += c[i + 1]; E[c[i] * 2 + 1] += c[i + 2]; }
    const KG = new Float64Array(NL * 12), EX = new Float64Array(NL * 12), N = new Float64Array(NL * 12);
    for (const [a, ms] of o.k){ const l = map[a]; if (l < 0) continue; for (let m = 0; m < 12; m++){ const c = ms[m], j = l * 12 + m;
      for (let i = 0; i < c.length; i += 3){ KG[j] += c[i + 1]; N[j] += c[i + 2]; EX[j] += c[i + 2] * E[c[i] * 2] / Math.max(1, E[c[i] * 2 + 1]); } } }
    const SK = smooth(KG), SE = smooth(EX), SN = smooth(N);
    // the main area's figure per month, from the same smoothed sums
    const H = {}; for (let l = 0; l < NL; l++){ const h = H[hom[l]] || (H[hom[l]] = {kg:new Float64Array(12), ex:new Float64Array(12), n:new Float64Array(12), na:new Float64Array(12)});
      for (let m = 0; m < 12; m++){ const j = l * 12 + m; h.kg[m] += SK[j]; h.ex[m] += SE[j]; h.n[m] += SN[j]; h.na[m] += NA[j]; } }
    const idxOf = (kg, ex, n, na) => n > 0 && ex > 0 && na > 0 ? (kg / ex) * Math.min(1, n / na) : NaN;
    const idx = new Float64Array(NL * 12);
    for (let l = 0; l < NL; l++){ const h = H[hom[l]]; for (let m = 0; m < 12; m++){ const j = l * 12 + m, ih = idxOf(h.kg[m], h.ex[m], h.n[m], h.na[m]), il = idxOf(SK[j], SE[j], SN[j], NA[j]);
      const w = SN[j] / (SN[j] + FK.n0); idx[j] = isNaN(il) ? ih : isNaN(ih) ? il : w * il + (1 - w) * ih; } }
    // Senja's figure per month (the reference locations pooled)
    const R = new Float64Array(12); for (let m = 0; m < 12; m++){ let kg = 0, ex = 0, n = 0, na = 0; for (const l of ref){ const j = l * 12 + m; kg += SK[j]; ex += SE[j]; n += SN[j]; na += NA[j]; } R[m] = idxOf(kg, ex, n, na); }
    const A = new Float32Array(NL * 12).fill(NaN);
    if (sp === 'torsk'){
      // the resident cod: the location's summer level (June-September) against Senja's; the skrei: its excess January-May against Senja's
      const summer = (get) => { let s = 0, k = 0; for (let m = 5; m <= 8; m++){ const v = get(m); if (!isNaN(v)){ s += v; k++; } } return k ? s / k : NaN; };
      const rb = summer(m => R[m]); let rx = 0; for (let m = 0; m < FK.skreiM; m++) rx += Math.max(0, (R[m] || 0) - rb);
      const B = new Float32Array(NL).fill(NaN), X = new Float32Array(NL).fill(NaN);
      for (let l = 0; l < NL; l++){ const b = summer(m => idx[l * 12 + m]); if (isNaN(b)) continue; let x = 0; for (let m = 0; m < FK.skreiM; m++){ const v = idx[l * 12 + m]; if (!isNaN(v)) x += Math.max(0, v - b); }
        B[l] = clamp(b / rb, FK.lo, FK.hi); X[l] = clamp(x / rx, 0, FK.hi); }
      af[sp] = {base:B, skrei:X};
    } else {
      for (let j = 0; j < NL * 12; j++){ const r = R[j % 12]; if (!isNaN(idx[j]) && r > 0) A[j] = clamp(idx[j] / r, FK.lo, FK.hi); }
      // no Senja figure for the species (herring, mackerel, snow crab are not fished there): against the coast's mean instead
      if (!R.some(r => r > 0)){ let s = 0, k = 0; for (let j = 0; j < NL * 12; j++) if (!isNaN(idx[j])){ s += idx[j]; k++; } const mu = k ? s / k : 1;
        for (let j = 0; j < NL * 12; j++) A[j] = isNaN(idx[j]) ? NaN : clamp(idx[j] / mu, 0, FK.hi); }
      af[sp] = {m:A};
    }
  }
  FK.ms = typeof performance !== 'undefined' ? performance.now() - t0 : 0;
  return FK.af = af;
}
// the month weights of an hour, as seasonal() reads its tables (mid-month points, linear between them); mf is the month as a float
function fkMonth(H){ const d = gDate(H), mf = d.getUTCMonth() + (d.getUTCDate() - 1) / 31, i0 = Math.floor(mf - 0.5), f = mf - 0.5 - i0; return {i0:((i0 % 12) + 12) % 12, i1:(((i0 + 1) % 12) + 12) % 12, f, mf}; }
// the location's factor for the hour (NaN where the notes have nothing)
function fkAt(a, l, T){ const v0 = a[l * 12 + T.i0], v1 = a[l * 12 + T.i1]; if (v0 !== v0 || v1 !== v1) return v0 === v0 ? v0 : v1; return v0 * (1 - T.f) + v1 * T.f; }
// the skrei pulse at a latitude: the game's own curve, moved by the front (kept per whole day of shift for the hour, in denTime's T)
function skreiFront(lat, H, T){
  const d = Math.round(MIG.skreiShiftH(lat) / 24), c = T && T.skf, ck = lat < 62.6 ? 'g' + Math.round(lat * 10) : d; if (c && c[ck] !== undefined) return c[ck];
  // the spawning grounds go from Møre to Finnmark (HI): none south of Stad
  const v = seasonal(SPECIES.torsk.skrei, H + d * 24) * sstep(61.8, 62.6, lat); if (c) c[ck] = v; return v;
}
// the spring cod's pulse at a cell: the skrei front, and in Finnmark half of it with the capelin (MIG.lodde)
function skreiPulse(c, H, T){
  const lw = MIG.loddeW(c.lat, c.lon), f = skreiFront(c.lat, H, T); if (lw <= 0) return f;
  return f * (1 - lw) + lw * MIG.lodde(c.lat, c.lon, T && T.fk ? T.fk.mf : mfOfH(H));
}
// What density() puts where av was: the species' availability at a place (q from denPlace, q.c the cell) in the hour T (denTime), with
// the spawning stock (T[sp].av and .skrei carry stockF). The cell's location is looked up once per 2 km cell, the month once per hour.
function fkAvail(sp, q, T){
  const t = T[sp], c = q.c, l = c.l, F = FK.af ? FK.af[sp] : fkBuild() && FK.af[sp];
  if (sp === 'torsk'){
    if (q.skr < 0) q.skr = skreiSpot(q.p, q.d, q.E);
    const b = F && l >= 0 && F.base[l] === F.base[l] ? F.base[l] : 1, x = F && l >= 0 && F.skrei[l] === F.skrei[l] ? F.skrei[l] : 1;
    return t.av * b + skreiPulse(c, T.H, T) * t.sf * q.skr * x;
  }
  let v = F && l >= 0 ? fkAt(F.m, l, T.fk) : NaN;
  const mig = MIG[sp];
  if (sp === 'sei'){ if (v !== v) v = mig(c.lat, c.lon, T.fk.mf) / mig(MIG.latRef, 17, T.fk.mf); }
  else if (mig){ v = (v === v ? v : 1) * mig(c.lat, c.lon, T.fk.mf); }
  return t.av * (v === v ? v : 1);
}
// The same for any point and hour, outside density() (the tests, the guide, the fleet pressure of B3)
function areaF(sp, p, H){
  const T = {H, fk:fkMonth(H), skf:{}}, s = SPECIES[sp];
  T[sp] = {av:seasonal(s.av, H), sf:1};
  return fkAvail(sp, {p, d:depthF(p), E:exposure(p), skr:-1, c:lokOfCell(p)}, T);
}
// the share of the cod at a point and hour that is skrei (the bigger spawning fish, sampleFish)
function skreiShare(p, H){
  const c = lokOfCell(p), F = fkBuild() && FK.af.torsk, l = c.l;
  const b = F && l >= 0 && F.base[l] === F.base[l] ? F.base[l] : 1, x = F && l >= 0 && F.skrei[l] === F.skrei[l] ? F.skrei[l] : 1;
  const k = seasonal(SPECIES.torsk.av, H) * b, sk = skreiPulse(c, H) * skreiSpot(p) * x; return sk / (k + sk + 1e-9);
}
// How much skrei is passing through a 2 km stock cell (gridKey of S.stock) at an hour, 0-1: the spring pulse at the cell against its top,
// times how much skrei the location has in the notes. A fished cell on the skrei's way fills faster while it passes (stockHour).
function skreiFlow(K, H){
  const F = fkBuild() && FK.af.torsk; if (!F) return 0;
  const c = lokOfCell({x:(gridKeyX(K) + 0.5) * 2, y:(gridKeyY(K) + 0.5) * 2}), l = c.l; if (l < 0) return 0;
  const x = F.skrei[l] === F.skrei[l] ? Math.min(1, F.skrei[l]) : 0; if (x <= 0) return 0;
  return x * clamp(skreiPulse(c, H) / 2.5, 0, 1);
}
