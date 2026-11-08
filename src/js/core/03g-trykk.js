// The fleet's pressure and the stock's baseline (B3 of docs/planer/bestand-og-flaate.md, 02.11.2026). The whole Norwegian fleet takes
// of the one shared stock: what the real fleet landed where, when, with what and from what size of boat (fiske.json, B1), scaled to this
// year's quota for each group of the quota chain (03d-quota.js), is the fleet's pressure F; the local stock a player meets is the
// balance between that pressure and how fast fish come back to a place (the regrowth and the fish swimming in), times what the players
// themselves have done (S.stock, the deviation). All of it is a pure function of the shared clock and the data in the app, the same for
// every player at any place and hour, so nobody has to have seen the boats, and the server is asked for nothing new (plan 5b).
//
//  fleetF(sp, p, H)        the fleet's catch at a point and hour, kg an hour in the 2 km cell (for the ocean fleet and AIS, H1)
//  fleetU(sp, p, H)        the share of the cell's fish the fleet takes an hour
//  baseAt(p, sp, H)        the baseline: the local stock against untouched (1), r / (r + u), where r is the regrowth of S.stock (0.4 % an
//                          hour of what is missing) and u the share taken an hour; stockAt() multiplies it by the deviation
//  trykkYear(sp, y)        the year's pressure by group: kg a year in all the areas of fiske.json (trykk.test.mjs: the group quotas)
//  skreiLeft(H)            the share of the year's skrei not yet taken: the skrei is one body of fish that passes along the coast, and
//                          what the fleet has taken in Finnmark and Troms in January is not there in Lofoten in March
//
// The groups (cod; haddock and saithe and the rest have no chain in the game, see below): the notes' length groups on the coast (fiske.json
// k, the boats under 28 m) are the closed group by quota length (under 11 m, 11-14.99, 15-20.99, 21-27.99 m) and the open group (a share
// of the boats under 11 m: the open group's quota against the closed group's under 11 m); the boats of 28 m and over (fiske.json h) are
// the trawlers (trawl gear) and the ocean-going conventional vessels (havfiske, the rest); the notes under 28 m without a location
// (h, length groups 0-3) are counted as the coast. Each group's notes over the two years are scaled to the group's quota this year
// (codChain), so the year's pressure of a group is its quota. The open group's pressure follows its own season day by day (qyAt: about
// 2 100 boats, the stop, the raises; the open group's maximum-quota fishing stops when the Directorate says so, and the pressure with it).
// Haddock and saithe: all the notes scaled to Norway's quota (norQuota). The other species: the notes as they were (no quota chain).
// The players' landings come off the groups' pressure, so the fleet never takes the same fish twice: the open group's in qyStep (with the
// other players' from the server), the closed group's cod and all the haddock and saithe through trkPlayersF (B4: the others' catch this
// year per group comes with the world, WSH.grp, and your own from the quota you have landed).
//
// How much of the cell's fish is taken: F against the fish there. The fish in an area is the species' biomass (from the spawning stock
// for cod, haddock and saithe, HI/ICES via STOCK; for the rest the year's landings over a harvest rate) laid out by the catch per landing
// (the density) times the area, over all the areas of fiske.json; so u is the effort per area, as it should be when catch per landing
// follows the density. On the coast (k) the location's pressure and its fish are laid together by the lift of Fiskeridirektoratet's
// fishing grounds in their season (feltCellW, 03j-felt.js, Ø14 F2: the fleet follows the fish, and the share taken is the same on and
// off a ground; until then the pressure alone was three times as thick within 2 km of a ground); the ocean fleet's (h) only outside the
// baseline, where the big boats may fish (J-187-2026 § 32), three times as thick on the grounds for active gear.
const TRK = {r:0.004, groundW:3, groundR:2, hph:730.5,
  // the stock of age 3+ against the spawners: cod 3.1 (JRN-AFWG 2026, IMR-VNIRO report 2026 nr. 5, 3.6.5 and Table 3.20: TSB 1 102 kt
  // and SSB 352 kt in 2025, 1 069 and 338 kt in 2026), haddock 3.1 (the same report, 4.7: TSB 494 692 t and SSB 157 942 t in 2025),
  // saithe 2.1 (ICES 2026, pok.27.1-2, gives no total biomass: the catch of 2025, 147 482 t, over the share F 0.399 takes with M 0.2,
  // F/Z (1 - e^-Z) = 0.30, is about 490 kt against an SSB of 234 kt); and the share of the year's biomass the fleet takes for the
  // species without a stock in the game (a harvest rate; estimates, except golden redfish: 0.12 × 1.59, ICES 2026 reg.27.1-2 has F at
  // 1.52-1.61 times Fmsy in 2022-2025; ICES's ling and tusk give only indices, pollack and halibut are not assessed north of 62° N)
  tsb:{torsk:3.1, hyse:3.1, sei:2.1}, harv:{lyr:0.25, lange:0.2, brosme:0.2, uer:0.19, kveite:0.12, snokrabbe:0.2},
  // herring and mackerel: the spawning stocks of ICES's 2025 assessments (NVG herring about 3.2 Mt, NEA mackerel about 3.6 Mt; t)
  ssb:{sild:3.2e6, makrell:3.6e6},
  ys:{}};
const TRK_SP = ['torsk', 'hyse', 'sei', 'lyr', 'lange', 'brosme', 'uer', 'kveite', 'sild', 'makrell', 'snokrabbe'];
const TRK_G = ['open', 'u11', 'g11', 'g15', 'g21', 'tral', 'hav', 'all'];
// the area of each location and main area of rules.json (km², from the polygons), and how many 2 km cells of each location lie within
// TRK.groundR of a named ground (felt.json), for laying the pressure on the grounds. Only the fishing grounds (k = f): the spawning and
// the nursery grounds (Ø14 F1, V3) are names, never pressure
function trkAreas(){
  if (TRK.A) return TRK.A;
  const area = P => { let a = 0; for (const p of P){ const r = p.rings[0]; let s = 0; for (let i = 0, j = r.length - 2; i < r.length; j = i, i += 2) s += (r[j] - r[i]) * (r[j + 1] + r[i + 1]); a += Math.abs(s) / 2; } return a; };
  const lok = RU.lok.map(h => Math.max(1, area(h.P))), hom = RU.hom.map(h => Math.max(1, area(h.P)));
  const gc = new Float64Array(RU.lok.length), gch = new Float64Array(RU.hom.length), seen = new Set(), seenA = new Set(), homI = new Map(RU.hom.map((h, i) => [h.c, i]));
  for (const f of (typeof feltData === 'function' && feltData()) || []){ if (f.k !== 'f') continue;
    // the grounds for active gear (trawl, seine, Danish seine) take the ocean fleet's pressure in their main area
    if (f.g !== 'p') for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++){ const ix = Math.floor(f.x / 2) + dx, iy = Math.floor(f.y / 2) + dy, k = gridKey(ix, iy); if (seenA.has(k)) continue;
      if (Math.hypot((ix + 0.5) * 2 - f.x, (iy + 0.5) * 2 - f.y) > TRK.groundR + 1) continue; seenA.add(k); const c = lokOfCell({x:(ix + 0.5) * 2, y:(iy + 0.5) * 2}); const hi = c.l >= 0 ? homI.get(RU.lok[c.l].c.slice(0, 2)) : undefined; if (hi !== undefined) gch[hi]++; }
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++){ const ix = Math.floor(f.x / 2) + dx, iy = Math.floor(f.y / 2) + dy, k = gridKey(ix, iy); if (seen.has(k)) continue;
      if (Math.hypot((ix + 0.5) * 2 - f.x, (iy + 0.5) * 2 - f.y) > TRK.groundR + 1) continue; seen.add(k); const c = lokOfCell({x:(ix + 0.5) * 2, y:(iy + 0.5) * 2}); if (c.l >= 0) gc[c.l]++; } }
  return TRK.A = {lok, hom, gc, gch, homI};
}
// a cell's weight within its location: three times on the named fishing grounds (k = f), and for the ocean fleet (gwa) three times on the
// grounds for active gear; since Ø14 F2 only gwa is read (trkCell), the coast follows the grounds' lift (feltCellW)
function trkCellW(c){
  if (c.gw !== undefined) return c.gw;
  let w = 1, wa = 1; const D = typeof feltData === 'function' && feltData();
  if (D){ const x = c.cx, y = c.cy, s = FELT.cell; for (let gy = Math.floor((y - 3) / s); gy <= Math.floor((y + 3) / s); gy++) for (let gx = Math.floor((x - 3) / s); gx <= Math.floor((x + 3) / s); gx++){ const a = FELT.grid.get(gridKey(gx, gy)); if (a) for (const f of a) if (f.k === 'f' && Math.hypot(f.x - x, f.y - y) < TRK.groundR + 1){ w = TRK.groundW; if (f.g !== 'p') wa = TRK.groundW; } } }
  c.gwa = wa; return c.gw = w;
}
// the national skrei season from the notes: the cod over the summer level, January-May, by month (kg a year at the notes' level)
function trkSkreiMonths(D){
  const o = D.sp.torsk, m = new Float64Array(12);
  for (const tab of ['k', 'h']) for (const [, ms] of o[tab]) for (let i = 0; i < 12; i++){ const c = ms[i]; for (let j = 1; j < c.length; j += 3) m[i] += c[j]; }
  const base = (m[5] + m[6] + m[7] + m[8]) / 4, out = new Float64Array(12); for (let i = 0; i < 5; i++) out[i] = Math.max(0, m[i] - base) / D.meta.ny; return out;
}
// one year's tables: per species, the pressure kg an hour by location × month for the coast without the open group (K), the open
// group's at the notes' level (KO, scaled by its season in trykkOpenScale), by main area × month for the ocean fleet (Hh), and the
// biomass per km² of the areas (BK, BH); the sums by group for the test
function trykkYear(sp, y){
  const key = sp + ':' + y + ':' + (S && S.qseed || 0); if (TRK.ys[key]) return TRK.ys[key];
  const D = fkData(); if (!D || !RU.ok || !D.sp[sp]) return TRK.ys[key] = null;
  const A = trkAreas(), M = D.meta, o = D.sp[sp], NL = RU.lok.length, NH = RU.hom.length, ny = M.ny;
  const lokI = new Map(RU.lok.map((h, i) => [h.c, i])), lmap = M.lok.map(c => lokI.has(c) ? lokI.get(c) : -1), hmap = M.hom.map(c => A.homI.has(c) ? A.homI.get(c) : -1);
  // the notes per group (kg a year) and the group of a cell
  const grpOf = (tab, code) => { const g = Math.floor(code / 6), lg = code % 6; if (sp !== 'torsk') return 'all';
    if (tab === 'h' && lg === 4) return g === 5 ? 'tral' : 'hav'; return lg === 0 ? 'u11' : lg === 1 ? 'g11' : lg === 2 ? 'g15' : lg === 3 ? 'g21' : 'hav'; };
  const notes = {}; for (const g of TRK_G) notes[g] = 0;
  for (const tab of ['k', 'h']) for (const [, ms] of o[tab]) for (const c of ms) for (let i = 0; i < c.length; i += 3) notes[grpOf(tab, c[i])] += c[i + 1] / ny;
  // the year's quota per group (t → kg), and the scale from the notes to it
  const Q = {}; let scale = {};
  if (sp === 'torsk'){
    const Y = yearQuota(y), ch = Y.chain, N = ch.N, top = 880 + 7000 + Math.max(3000, 0.009 * N) + 500 + 2543 + 450, R = N - top - ch.open;
    const tr = R < 130000 ? 0.28 : R > 330000 ? 0.33 : 0.28 + 0.05 * (R - 130000) / 200000, conv = R * (1 - tr), luk = ch.lukket / (ch.grp.u11 + ch.grp.g11 + ch.grp.g15 + ch.grp.g21);
    Object.assign(Q, {open:ch.open, u11:ch.grp.u11 * luk, g11:ch.grp.g11 * luk, g15:ch.grp.g15 * luk, g21:ch.grp.g21 * luk, tral:R * tr, hav:conv * 0.1281});
    for (const g in Q) Q[g] *= 1000;
    // the open group fishes in the notes' under-11 m cells beside the closed group, in proportion to the two quotas
    const fo = Q.open / (Q.open + Q.u11);
    scale = {u11:(Q.u11 + Q.open) / Math.max(1, notes.u11), g11:Q.g11 / Math.max(1, notes.g11), g15:Q.g15 / Math.max(1, notes.g15), g21:Q.g21 / Math.max(1, notes.g21), tral:Q.tral / Math.max(1, notes.tral), hav:Q.hav / Math.max(1, notes.hav), fo};
  } else if (sp === 'hyse' || sp === 'sei'){
    const Y = yearQuota(y); Q.all = Y.nor[sp] * 1000; scale = {all:Q.all / Math.max(1, notes.all)};
  } else { Q.all = notes.all; scale = {all:1}; }
  const K = new Float32Array(NL * 12), KO = new Float32Array(NL * 12), KL = new Float32Array(NL * 12), Hh = new Float32Array(NH * 12), sums = {};
  for (const g of TRK_G) sums[g] = 0;
  const hph = TRK.hph;
  for (const tab of ['k', 'h']) for (const [a, ms] of o[tab]){
    const l = tab === 'k' ? lmap[a] : -1, h = tab === 'h' ? hmap[a] : -1;
    for (let m = 0; m < 12; m++){ const c = ms[m]; for (let i = 0; i < c.length; i += 3){
      const g = grpOf(tab, c[i]), kg = c[i + 1] / ny * (scale[g] || 0);
      if (sp === 'torsk' && g === 'u11'){ const op = kg * scale.fo; sums.open += op; sums.u11 += kg - op; if (l >= 0){ KO[l * 12 + m] += op / hph; K[l * 12 + m] += (kg - op) / hph; KL[l * 12 + m] += (kg - op) / hph; } else if (h >= 0) Hh[h * 12 + m] += kg / hph; continue; }
      sums[g] += kg;
      if (l >= 0){ K[l * 12 + m] += kg / hph; if (g === 'g11' || g === 'g15' || g === 'g21') KL[l * 12 + m] += kg / hph; } else if (h >= 0) Hh[h * 12 + m] += kg / hph;
    } }
  }
  // the biomass: the stock (kg) laid out by catch per landing against the national mean for the gear and length group (the density),
  // times the area, over all the areas with a figure that month
  const Bt = trkBiomass(sp, y, notes);
  const E = new Float64Array(54 * 2); for (const tab of ['k', 'h']) for (const [, ms] of o[tab]) for (const c of ms) for (let i = 0; i < c.length; i += 3){ E[c[i] * 2] += c[i + 1]; E[c[i] * 2 + 1] += c[i + 2]; }
  const dens = (c) => { let kg = 0, ex = 0; for (let i = 0; i < c.length; i += 3){ kg += c[i + 1]; ex += c[i + 2] * E[c[i] * 2] / Math.max(1, E[c[i] * 2 + 1]); } return ex > 0 ? kg / ex : 0; };
  const BK = new Float32Array(NL * 12), BH = new Float32Array(NH * 12);
  // first between the coast and the sea by where the catch is taken that month (in March most of the cod is on the coast to spawn,
  // in summer out in the Barents Sea), then within each by the density times the area; catch per landing is only comparable within a
  // gear, so a trawler's typical landing and a coastal netter's do not say the same about fish per km² and are not mixed
  const kgOf = c => { let v = 0; for (let i = 1; i < c.length; i += 3) v += c[i]; return v; };
  for (let m = 0; m < 12; m++){
    let ck = 0, chh = 0, tk = 0, th = 0;
    for (const [a, ms] of o.k){ ck += kgOf(ms[m]); const l = lmap[a]; if (l >= 0) tk += dens(ms[m]) * A.lok[l]; }
    for (const [a, ms] of o.h){ chh += kgOf(ms[m]); const h = hmap[a]; if (h >= 0) th += dens(ms[m]) * A.hom[h]; }
    if (ck + chh <= 0) continue; const bk = Bt * ck / (ck + chh), bh = Bt * chh / (ck + chh);
    if (tk > 0) for (const [a, ms] of o.k){ const l = lmap[a]; if (l >= 0) BK[l * 12 + m] = bk * dens(ms[m]) / tk; }   // per km²
    if (th > 0) for (const [a, ms] of o.h){ const h = hmap[a]; if (h >= 0) BH[h * 12 + m] = bh * dens(ms[m]) / th; }
  }
  return TRK.ys[key] = {K, KO, KL, Hh, BK, BH, sums, Q, notes, Bt, skrei:sp === 'torsk' ? trkSkreiMonths(D).map(v => v * (scale.u11 ? (Q.u11 + Q.open + Q.g11 + Q.g15 + Q.g21 + Q.tral + Q.hav) / Math.max(1, notes.u11 + notes.g11 + notes.g15 + notes.g21 + notes.tral + notes.hav) : 1)) : null};
}
// the species' biomass in the waters of fiske.json (kg): from the spawning stock where the game has one, else the landings over a harvest rate
function trkBiomass(sp, y, notes){
  if (STOCK[sp] && !STOCK[sp].idx) return stockYear(sp, y).ssb * 1000 * (TRK.tsb[sp] || 2);   // (the snow crab's stock is an index, B/BMSY: H3a)
  if (TRK.ssb[sp]) return TRK.ssb[sp] * 1000;
  let n = 0; for (const g in notes) n += notes[g]; return n / (TRK.harv[sp] || 0.2);
}
// the open group's season against the notes: its catch per day now (qyStep) against what the notes' under-11 m share gives that day.
// After the stop the boats over their guaranteed quota are done, and the pressure falls with the group's catch (often to nothing).
function trykkOpenScale(H){
  if (!S || typeof qyAt !== 'function') return 1;
  const y = yearH(H), now = S.t / 60; if (H > now + 24) return 1;   // a day not yet fished: the notes' level
  const Y = qyAt(H), T = trykkYear('torsk', y); if (!T || !T.Q.open) return 1;
  const d = doyH(H), m = new Date(Date.UTC(y, 0, 1 + d)).getUTCMonth(); let notesDay = 0; for (let l = 0; l < RU.lok.length; l++) notesDay += T.KO[l * 12 + m] * 24;
  const r = Y.r * 1000; return notesDay > 0 ? clamp(r / notesDay, 0, 4) : 1;
}
// what is left of a group's quota for the fleet when the players have landed theirs this year (1: nothing landed by players): the
// closed group's cod (lc) and all of the haddock and saithe (all); the others' from the server, your own from your quota this year
function trkPlayersF(sp, y, Y){
  const grp = typeof WSH !== 'undefined' && WSH.y === y ? WSH.grp || {} : {}, q = S && S.quota && S.quota.y === y ? S.quota : null;
  if (sp === 'torsk'){ const QL = Y.Q.u11 + Y.Q.g11 + Y.Q.g15 + Y.Q.g21; if (!QL) return 1; const P = (grp['lukket:torsk'] || 0) + (S && S.lic && q ? q.torsk || 0 : 0); return clamp(1 - P / QL, 0, 1); }
  if (sp === 'hyse' || sp === 'sei'){ if (!Y.Q.all) return 1; const P = (grp['open:' + sp] || 0) + (grp['lukket:' + sp] || 0) + (q ? q[sp] || 0 : 0); return clamp(1 - P / Y.Q.all, 0, 1); }
  return 1;
}
// the fleet's pressure (kg an hour) and the share taken an hour at a 2 km cell, from the month's tables between mid-months (cached per
// cell and hour for all species: c.tH, c.tF, c.tU)
// the year, the month weights and the open group's scale of an hour, kept for the last hours asked (the lag reads a few hours back)
const TRKM = new Map();
function trkMonth(h){ let M = TRKM.get(h); if (M) return M; const y = yearH(h + 0.5);
  M = {y, T:fkMonth(h + 0.5), osv:undefined, os(){ return this.osv === undefined ? (this.osv = trykkOpenScale(h + 0.5)) : this.osv; }};
  if (TRKM.size > 400) TRKM.clear(); TRKM.set(h, M); return M; }
// The baseline lags behind the pressure: a place fished hard comes down over days and fills again over days, so the balance at an hour is
// the balance with the pressure some time before, as long as it takes the place to settle (1 / (r + u) hours: about ten days where the
// fleet is light, less where it is heavy). In closed form: the pressure is read at H - that time (trkCell's lagged share, tU).
function trkCell(c, H){
  const h = Math.floor(H); if (c.tH === h) return c;
  c.tH = h; c.tF = c.tF || new Float32Array(TRK_SP.length); c.tU = c.tU || new Float32Array(TRK_SP.length);
  const l = c.l, A = trkAreas();
  if (c.hom === undefined){ const hc = l >= 0 ? RU.lok[l].c.slice(0, 2) : null; c.hom = hc && A.homI.has(hc) ? A.homI.get(hc) : -1; c.out = !insideBaseline({x:c.cx, y:c.cy}); }
  // the coast's pressure and fish follow the grounds' lift together (feltCellW, 03j-felt.js, Ø14 F2), so the share taken is the location's
  // on and off the grounds (until then the pressure alone was three times as thick within 2 km of a ground, and the baseline lower there);
  // the ocean fleet's pressure still lies three times as thick on the grounds for active gear in its main area (gwa)
  const hi = c.hom, wa = l >= 0 ? (trkCellW(c), c.gwa) : 1;
  const wh = hi >= 0 ? (A.hom[hi] / 4 + (TRK.groundW - 1) * A.gch[hi]) / (A.hom[hi] / 4) : 1;
  // the pressure (kg an hour) and the fish (kg) in the cell at an hour
  const at = (Hx, s) => {
    const hk = Math.floor(Hx), M = trkMonth(hk), y = M.y, T = M.T, Ys = M.Ys || (M.Ys = TRK_SP.map(sp => trykkYear(sp, y))), Y = Ys[s]; if (!Y) return [0, 0];
    const mi = (arr, i) => arr[i * 12 + T.i0] * (1 - T.f) + arr[i * 12 + T.i1] * T.f, pfs = M.pf || (M.pf = TRK_SP.map((sp, i) => trkPlayersF(sp, y, Ys[i]))), pf = pfs[s], sp_ = TRK_SP[s];
    let f = 0, b = 0;
    // the closed group's cod gives way to the players' (KL), haddock and saithe all of it (pf), the open group follows its season
    if (l >= 0){ const kk = sp_ === 'torsk' ? mi(Y.K, l) - mi(Y.KL, l) * (1 - pf) : mi(Y.K, l) * pf, g = feltCellW(c, s, T); f += (kk + mi(Y.KO, l) * (sp_ === 'torsk' ? M.os() : 0)) / (A.lok[l] / 4) * g; b += mi(Y.BK, l) * 4 * g; }
    if (hi >= 0 && c.out){ f += mi(Y.Hh, hi) * (sp_ === 'torsk' ? 1 : pf) / (A.hom[hi] / 4) * wa / wh; b += mi(Y.BH, hi) * 4; }
    return [f, b];
  };
  for (let s = 0; s < TRK_SP.length; s++){
    const [f, b] = at(H, s), u0 = b > 0 ? Math.min(0.05, f / b) : 0; c.tF[s] = f;
    const lag = Math.round(Math.min(24 * 30, 1 / (TRK.r + u0)) / 6) * 6, [f1, b1] = at(H - lag, s);   // in steps of six hours, so the hours are shared
    c.tU[s] = b1 > 0 ? Math.min(0.05, f1 / b1) : 0;
  }
  return c;
}
const trkCellOf = lokOfCell;
function fleetF(sp, p, H){ const s = TRK_SP.indexOf(sp); return s < 0 ? 0 : trkCell(trkCellOf(p), H).tF[s]; }
function fleetU(sp, p, H){ const s = TRK_SP.indexOf(sp); return s < 0 ? 0 : trkCell(trkCellOf(p), H).tU[s]; }
// the baseline at a point: the balance between the fleet's take and the regrowth, in closed form (r / (r + u)); 1 where nobody fishes
function baseAt(p, sp, H){
  const s = TRK_SP.indexOf(sp); if (s < 0 || !fkData() || !RU.ok) return 1;
  const u = trkCell(trkCellOf(p), H).tU[s]; return TRK.r / (TRK.r + u);
}
// the share of the year's skrei not yet taken at an hour: the skrei season's catch so far (the national cod over the summer level in
// January-May, scaled to this year's quotas, the month in progress counted by its days) against the skrei that came (the spawning stock)
function skreiLeft(H){
  const y = yearH(H), T = trykkYear('torsk', y); if (!T || !T.skrei) return 1;
  const d = gDate(H), m = d.getUTCMonth(), f = (d.getUTCDate() - 1) / 31; let C = 0; for (let i = 0; i < Math.min(m, 5); i++) C += T.skrei[i]; if (m < 5) C += T.skrei[m] * f;
  return clamp(1 - C / (stockYear('torsk', y).ssb * 1000), 0.4, 1);
}
