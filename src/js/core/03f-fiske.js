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
  // Snow crab (HI, «Snøkrabbe», hi.no): a newcomer in the Barents Sea, spreading west from the Russian side; fished in the east of the
  // Norwegian zone and in the Loophole, north of 72° N and east of 30° E (the corner of the game's frame). None along the coast.
  snokrabbe(lat, lon){ return sstep(28.5, 31, lon) * sstep(71.6, 72.4, lat); },
};

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
// What density() puts where av was: the species' availability at a place (q from denPlace, q.c the cell) in the hour T (denTime), with
// the spawning stock (T[sp].av and .skrei carry stockF). The cell's location is looked up once per 2 km cell, the month once per hour.
function fkAvail(sp, q, T){
  const t = T[sp], c = q.c, l = c.l, F = FK.af ? FK.af[sp] : fkBuild() && FK.af[sp];
  if (sp === 'torsk'){
    if (q.skr < 0) q.skr = skreiSpot(q.p, q.d, q.E);
    const b = F && l >= 0 && F.base[l] === F.base[l] ? F.base[l] : 1, x = F && l >= 0 && F.skrei[l] === F.skrei[l] ? F.skrei[l] : 1;
    return t.av * b + skreiFront(c.lat, T.H, T) * t.sf * q.skr * x;
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
  const k = seasonal(SPECIES.torsk.av, H) * b, sk = skreiFront(c.lat, H) * skreiSpot(p) * x; return sk / (k + sk + 1e-9);
}
