// ===== the fish receivers along the whole coast as harbours (05.10.2026, M2 of the coast plan) =====
// Jonas 04.10.2026: «alle nye brukere skal få bestemme selv hvor i landet de ønsker å starte spillet ... salgslaget på telefonen må vise
// de 8-10 nærmeste fiskemottakene slik at spillet fungerer for folk uansett hvor de er». The register (src/data/mottak.json, made by
// tools/mottak/mottak.py from Fiskeridirektoratet's buyer register and landing notes, with Kartverket's postal towns) has every
// receiver; the ones a coastal fisher can sell to become harbours here: a fixed plant (ordinary or quay seller) at a quay, that takes in at
// least 10 t a year of the game's species, from small boats (5 % or more) or by conventional gear (30 % or more). Receivers within 1.2 km of
// each other are one harbour (the biggest names it); those within 2 km of a harbour of Senja's own are that harbour (it keeps its
// hand-made quay and unit, and takes the register's price index). Names are the postal town, with the side of the first (north, south,
// east, west) where two harbours would have the same name. No company names are kept anywhere (Jonas 07.10.2026: «vi må fjerne alle
// ekte firma-navn fra fiskemottakene ... Jeg orker ikke å bli saksøkt»): the register's file has none, and a receiver is its place.
// The quay is the register's face (q: the point, the normal's angle, the length; tools/mottak/mottak.py snap), as a QUAYS entry in
// 07-harbours.js, and a harbour unit stands on it (UNITS, 01-world.js; its berths are the unit's); the harbour point lies 15 m out from
// its middle and the shore point 30 m in. The price factor is the receiver's price
// index (what it paid against the month's average, by kilo over the game's species) halfway to 1, between 0.94 and 1.06. Every coast
// harbour has fuel, and every plant sells ice (Jonas 07.10.2026: «Fiskemottaket - kun levering av fisk, salg av is og agn»).
const MOTTAK = /*@include(data/mottak.json)*/null;
const COAST_WF = ['torsk', 'hyse', 'sei', 'lyr', 'lange', 'brosme', 'uer', 'kveite', 'kongekrabbe', 'krabbe'];
const HAV_SP = ['sild', 'makrell', 'snokrabbe'];   // the ocean species the register counts per receiver (tools/mottak/mottak.py hav)
// ---- the registration mark (Malerverkstedet, 07.10.2026): the county's letters, a serial number and the municipality's letters,
// painted on both sides of the hull near the stem (ervervstillatelsesforskriften §§ 22–23, FOR-2012-12-07-1144). The letters are those
// most vessels of the home harbour's municipality carry (tools/regmerke/regmerke.py, from Fiskeridirektoratet's landing notes); the
// number is one no real vessel there has, so no player's boat wears a real boat's mark. A boat keeps hers (b.reg); a number of one's own
// choosing (the paint shop's «ønskenummer») replaces it. ----
const REGM = /*@include(data/regmerke.json)*/null;
// the home harbour's municipality: a coast harbour is a plant's ('m' + its id, with its municipality), the old Senja harbours are named
// here (Sommarøy and Brensholmen are in Tromsø), anything else takes the nearest plant's
const PORTK = {finnsnes:'senja', botnhamn:'senja', husoy:'senja', senjahopen:'senja', gryllefjord:'senja', torsken:'senja', frovag:'senja', sommaroy:'tromsø', brensholmen:'tromsø'};
function regLetters(pt){
  if (!REGM || !REGM.k || !MOTTAK || !MOTTAK.m || !pt) return null;
  const own = PORTK[pt.id] || (/^m/.test(pt.id) && (MOTTAK.m.find(m => 'm' + m.id === pt.id) || {}).k); if (own && REGM.k[own]) return REGM.k[own];
  let best = null, bd = Infinity; for (const m of MOTTAK.m){ const e = REGM.k[m.k]; if (!e) continue; const d = Math.hypot(m.p[0] - pt.p.x, m.p[1] - pt.p.y); if (d < bd){ bd = d; best = e; } }
  return best;
}
function regUsed(f, k, n){ const e = REGM && Object.values(REGM.k).find(x => x[0] === f && x[1] === k); return !!(e && e[2].includes(n)); }
function regOf(b){
  if (b.reg && b.reg.f) return b.reg;
  const hp = portById(S.home || HOME0) || PORTS[0], e = regLetters(hp); if (!e) return null;
  let h = 0; for (const c of String(S.boatName || '') + (S.cur || '') + (b.type || '')) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  let n = 100 + h % 800; while (e[2].includes(n) && n < 9999) n++;
  return b.reg = {f:e[0], n, k:e[1]};
}
const regText = r => r ? r.f + '-' + r.n + '-' + r.k : '';
// the call sign (kjenningssignal, FOR-2002-06-27-754, read on Lovdata 05.11.2026; Ø11.5): § 5 gives one to fishing vessels from 10.67 m
// (and the registered ships, which all ours from 15 m are), two letters and four digits under 15 m, as VH5150 (Store norske leksikon),
// and § 9 has it painted on the outside of the hull. Ours are from Norway's block as the fishing fleet's are (LF, LG, LH, LK, LM) and
// never one a real vessel carries: REGM.c is the call signs in Fiskeridirektoratet's landing notes 2024-2025 (tools/regmerke). It belongs
// to the vessel (b.call), not to the owner as the registration mark does, so a boat traded in leaves hers behind (switchVessel)
const CALLP = ['LF', 'LG', 'LH', 'LK', 'LM'];
const callNeeded = type => !!VESSELS[type] && VESSELS[type].len >= 10.67;
function callFree(p, n){ const u = REGM && REGM.c && REGM.c[p]; return !(u && u.includes(n)); }
function callOf(b){
  if (!b || !callNeeded(b.type)) return null;
  if (b.call && /^L[A-N]\d{4}$/.test(b.call) && callFree(b.call.slice(0, 2), +b.call.slice(2))) return b.call;
  let h = 7; for (const c of String(S.boatName || '') + (S.cur || '') + (b.type || '')) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const p = CALLP[h % CALLP.length]; let n = 1000 + Math.floor(h / CALLP.length) % 9000;
  for (let i = 0; i < 9000 && !callFree(p, n); i++) n = n >= 9999 ? 1000 : n + 1;
  return b.call = p + n;
}

const COASTQ = {};
const STEDER_D = /*@include(data/steder.json)*/null;   // the shops and yards (06c-steder.js), here so the plants below can keep 1.5 km to them
(() => {
  if (!MOTTAK || !MOTTAK.m) return;
  const wf = x => COAST_WF.reduce((a, s) => a + ((x.sp[s] || [0])[0] || 0), 0);
  const conv = x => Object.entries(x.gear || {}).reduce((a, [k, v]) => a + (/Konv|Garn|Line|Jukse|Teine|Snurre/.test(k) ? v : 0), 0);
  const ok = MOTTAK.m.filter(x => (x.t === 'Ordinært anlegg' || x.t === 'Kaiselger') && x.q && wf(x) >= 10000 && (x.small >= 0.05 || conv(x) >= 0.3))
    .sort((a, b) => wf(b) - wf(a));
  const km = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
  const groups = [];
  for (const x of ok){
    const g = groups.find(g => km(g.lead.p, x.p) < 1.2);
    if (g) g.rest.push(x); else groups.push({lead:x, rest:[], hav:[]});
  }
  // the ocean fleet's plants (H0 of docs/planer/havsteget.md, 03.11.2026): a fixed plant at a quay that takes in 500 t a year or more of
  // the game's and the ocean species, a fifth of it or more from vessels of 28 m and over. One within 1.2 km of a harbour above is part of
  // it (its gear, share and quay count for the ocean vessels there); the rest are harbours of their own for the ocean vessels only
  // (havOnly: not a plant for the coast's boats, which see a harbour with fuel)
  const hkg = x => wf(x) + HAV_SP.reduce((a, s) => a + ((x.sp[s] || [0])[0] || 0), 0) + ((x.sp.blakveite || [0])[0] || 0);
  for (const x of MOTTAK.m.filter(x => (x.t === 'Ordinært anlegg' || x.t === 'Kaiselger') && x.q && !ok.includes(x) && (x.big || 0) >= 0.2 && hkg(x) >= 500000).sort((a, b) => hkg(b) - hkg(a))){
    // (within 1.5 km of a harbour it is part of it; a harbour of its own keeps 1.5 km to the shops, yards and rorbuer as every plant does,
    // docs/handelssteder.md; tools/steder/havflytt.py moved the shop in Rypefjord and the yard by Fiskarstrand øst for that, 03.11.2026)
    const g = groups.find(g => Math.min(km(g.lead.p, x.p), km(g.lead.q, x.q)) < 1.5);
    if (g){ g.hav.push(x); continue; }
    if (STEDER_D && STEDER_D.r && STEDER_D.r.some(r => Math.hypot(r[0] - x.p[0], r[1] - x.p[1]) < 1.5)) continue;
    groups.push({lead:x, rest:[], hav:[], havOnly:true});
  }
  const own = PORTS.slice(), used = {};
  for (const g of groups){
    const x = g.lead, all = [x, ...g.rest], kg = all.reduce((a, r) => a + wf(r), 0), withHav = all.concat(g.hav), qx = withHav.reduce((a, r) => r.q[3] > a.q[3] ? r : a, x);
    // the price index by kilo over the game's species
    let ws = 0, wi = 0; for (const r of all) for (const s of COAST_WF){ const v = r.sp[s]; if (v && v[2]){ ws += v[0]; wi += v[0] * v[2]; } }
    const idx = ws ? wi / ws : 1, pf = Math.round(clamp(1 + (idx - 1) * 0.5, 0.94, 1.06) * 1000) / 1000;
    // (the ocean step, H0 of docs/planer/havsteget.md, 03.11.2026: the gear groups it takes in, by kilo over the receivers; the share
    // landed from vessels of 28 m and over; the ocean species it takes; and its quay, the register's face, length and depth in m)
    const allKg = withHav.reduce((a, r) => a + (r.kg || 0), 0) || 1, gear = {};
    for (const r of withHav) for (const [gg, v] of Object.entries(r.gear || {})) gear[gg] = Math.round(((gear[gg] || 0) + v * (r.kg || 0) / allKg) * 1000) / 1000;
    const big = Math.round(withHav.reduce((a, r) => a + (r.big || 0) * (r.kg || 0), 0) / allKg * 1000) / 1000;
    const hsp = {}; for (const r of withHav) for (const s of HAV_SP){ const v = r.sp[s]; if (v) hsp[s] = (hsp[s] || 0) + (v[0] || 0); }
    const mk = {ids:all.map(r => r.id), hav:g.hav.map(r => r.id), k:x.k, kg:Math.round(kg), small:x.small, gear, big, hsp, q:[qx.q[3], qx.q[4]], boats:all.reduce((a, r) => a + (r.boats || 0), 0),
      sp:Object.fromEntries(COAST_WF.filter(s => all.some(r => r.sp[s])).map(s => [s, {kg:all.reduce((a, r) => a + ((r.sp[s] || [0])[0] || 0), 0), months:all.reduce((a, r) => a | ((r.sp[s] || [0, 0, 0, 0])[3] || 0), 0)}])), idx:Math.round(idx * 100) / 100};
    // every plant north of 62° N takes Greenland halibut (Jonas 07.10.2026: «Alle mottak skal kunne ta i mot blåkveite»), with what
    // the register says it took in (kg, and in which months; else all year, the direct fishery's period decides): for the orders
    if (natLL({x:x.p[0], y:x.p[1]}).lat >= 62){ const r = all.map(z => z.sp.blakveite).filter(Boolean); mk.sp.blakveite = {kg:r.reduce((a, v) => a + (v[0] || 0), 0), months:r.length ? r.reduce((a, v) => a | (v[3] || 0), 0) || 4095 : 4095}; }
    // one of Senja's own harbours: it keeps its quay and unit and takes what the register knows
    const near = own.find(pt => dist(pt.p, {x:x.p[0], y:x.p[1]}) < 2);
    if (near){ if (!near.mk) near.mk = mk; continue; }
    const q = x.q, nx = Math.cos(q[2]), nz = Math.sin(q[2]), cx = q[0] * 1000, cz = q[1] * 1000, hl = Math.max(8, q[3] / 2), ux = -nz, uz = nx;
    let name = x.v || (x.k ? x.k.replace(/^./, c => c.toUpperCase()) : 'Mottak ' + x.id);
    // a second harbour in one town is named by the side of the first it lies on (the grid's x is east, y south); the register holds
    // no company names (Jonas 07.10.2026), so a harbour is only ever its place
    if (used[name]){ const f = used[name], dx = x.p[0] - f[0], dy = x.p[1] - f[1]; name += Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? ' øst' : ' vest') : (dy > 0 ? ' sør' : ' nord'); for (let n = 2; used[name]; n++) name = name.replace(/ \d+$/, '') + ' ' + n; }
    used[name] = x.p;
    const id = 'm' + x.id;
    COASTQ[id] = {main:{a:[cx - ux * hl, cz - uz * hl], b:[cx + ux * hl, cz + uz * hl], n:[nx, nz]}};
    // the harbour unit from Blender on the register's face (Jonas 05.10.2026: «3 modeller av ulike typer fiskemottak ... plasseres
    // tilfeldig på stedene der fiskemottakene er på ekte»): its block behind the face, the basin in front, in one of the three looks
    // (a today's plant, b the old fish plant, c the big plant), picked at random but the same every time for the receiver
    let hv = 0; for (const ch of id) hv = (hv * 31 + ch.charCodeAt(0)) >>> 0;
    const U = {id, o:[cx, cz], u:[nz, -nx], n:[nx, nz], f:[27.4, -24.4, 27.4, -28.4, -27.4, -28.4, -27.4, -24.4], v:'abc'[hv % 3], coastal:true};
    UNITS[id] = U; UNITA.push(U);
    PORTS.push({id, name, xy:[q[0], q[1]], shore:[q[0], q[1]], pier:true, fuel:true, ice:!g.havOnly, mottak:!g.havOnly, havOnly:!!g.havOnly, havMottak:true, pf, coast:{x:(cx - nx * 30) / 1000, y:(cz - nz * 30) / 1000},
      p:{x:Math.round(cx + nx * 15) / 1000, y:Math.round(cz + nz * 15) / 1000}, i:PORTS.length, mk, coastal:true});
    // the plant posts orders too (03-simulation.js ordersTick, near where you fish): for what it takes in most of
    const csp = Object.entries(mk.sp).filter(([s]) => SPECIES[s] && !SPECIES[s].shell && !SPECIES[s].npc && s !== 'blakveite')   // its orders: 03-simulation.js bkPlant
      .sort((a, b) => b[1].kg - a[1].kg).map(e => e[0]).slice(0, 3);
    if (!g.havOnly) CUSTOMERS.push({id:'c' + id, no:'Mottaket i ' + name, port:id, sp:csp.length ? csp : ['torsk', 'sei', 'hyse'], big:true, q:'A', coastal:true});
  }
})();
// the plants nearest to p (km), n of them: [{pt, d (km)}], nearest first (the Salgslaget app, the prices and the talk on the quay)
const PLANT_CACHE = {key:'', v:null};
function plantsNear(p, n = 10){
  const key = Math.round(p.x * 2) + ',' + Math.round(p.y * 2) + ',' + n;
  if (PLANT_CACHE.key === key) return PLANT_CACHE.v;
  const v = PORTS.filter(q => q.mottak).map(pt => ({pt, d:dist(pt.p, p)})).sort((a, b) => a.d - b.d).slice(0, n);
  PLANT_CACHE.key = key; PLANT_CACHE.v = v; return v;
}
// ===== the ocean vessels at the plants (H0 of docs/planer/havsteget.md, 03.11.2026) =====
// A plant takes an ocean vessel (cls 'hav') when its quay is long and deep enough for her, by the same rule as the fleet's berths
// (07-harbours.js quayFit: 90 % of the face at least her length and 2 m, and her draught and 0.5 m, an unknown depth taken as
// QUAY_DEPTH_UNKNOWN), and it takes in her catch: one of
// her gear groups (VESSELS mottak: Trål, Not, Konvensjonelle) is 5 % or more of what it takes in, or a fifth or more comes from vessels of
// 28 m and over. Every plant takes the coast's boats as before. A harbour with no register plant (mk) takes no ocean vessel.
// portWhy gives the reason in both languages, or null when she may moor and land there.
function portWhy(pt, type){
  const V = VESSELS[type]; if (!pt || !(pt.mottak || pt.havOnly)) return null;
  if (!V || V.cls !== 'hav') return pt.havOnly ? ['Mottaket her tar bare imot fra havfiskefartøy.', 'The plant here takes only ocean vessels.'] : null;
  const mk = pt.mk; if (!mk || !mk.q) return ['Kaia her er ikke registrert for havfiskefartøy.', 'The quay here is not registered for ocean vessels.'];
  const nf = v => String(Math.round(v * 10) / 10).replace('.', ','), len = mk.q[0], known = mk.q[1] > 0, dep = known ? mk.q[1] : QUAY_DEPTH_UNKNOWN;   // (0 in the register: not known, as quayFit takes it)
  if (!(len * 0.9 >= V.len + 2)) return ['Kaia her er ' + Math.round(len) + ' m, for kort for en båt på ' + Math.round(V.len) + ' m.', 'The quay here is ' + Math.round(len) + ' m, too short for a ' + Math.round(V.len) + ' m vessel.'];
  if (!(dep >= V.draft + 0.5)) return known ? ['Kaia her har ' + nf(dep) + ' m dybde, for grunt for en dypgang på ' + nf(V.draft) + ' m.', 'The quay here has ' + Math.round(dep * 10) / 10 + ' m of water, too shallow for a draught of ' + Math.round(V.draft * 10) / 10 + ' m.']
    : ['Dybden ved kaia her er ikke kjent, så den er ikke trygg for en dypgang på ' + nf(V.draft) + ' m.', 'The depth at the quay here is not known, so it is not safe for a draught of ' + Math.round(V.draft * 10) / 10 + ' m.'];
  if (!((V.mottak || []).some(g => (mk.gear[g] || 0) >= 0.05) || (mk.big || 0) >= 0.2)) return ['Mottaket her tar ikke imot fangst fra havfiskefartøy med ' + (V.mottak || []).join(' eller ').toLowerCase() + '.', 'The plant here takes no catch from ocean vessels of this kind.'];
  return null;
}
const portFits = (pt, type) => !portWhy(pt, type);
// a plant for this vessel: every plant, and an ocean fleet's plant (havOnly) for an ocean vessel. The landing and the landing page asked
// for pt.mottak alone, so an ocean vessel could not land at an ocean plant such as Avaldsnes (found by tests/havtur.py from Bergen, H2e
// 06.11.2026); the sale, the services (06c-steder.js portServices) and Driftsplan 2 (p2PlantOk) already took it
const plantFor = (pt, type) => !!pt && (!!pt.mottak || (!!pt.havOnly && (VESSELS[type] || {}).cls === 'hav'));
