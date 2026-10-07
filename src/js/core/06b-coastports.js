// ===== the fish receivers along the whole coast as harbours (05.10.2026, M2 of the coast plan) =====
// Jonas 04.10.2026: «alle nye brukere skal få bestemme selv hvor i landet de ønsker å starte spillet ... salgslaget på telefonen må vise
// de 8-10 nærmeste fiskemottakene slik at spillet fungerer for folk uansett hvor de er». The register (src/data/mottak.json, made by
// tools/mottak/mottak.py from Fiskeridirektoratet's buyer register and landing notes, with Kartverket's postal towns) has every
// receiver; the ones a coastal fisher can sell to become harbours here: a fixed plant (ordinary or quay seller) at a quay, that takes in at
// least 10 t a year of the game's species, from small boats (5 % or more) or by conventional gear (30 % or more). Receivers within 1.2 km of
// each other are one harbour (the biggest names it); those within 2 km of a harbour of Senja's own are that harbour (it keeps its
// hand-made quay and unit, and takes the register's price index). Names are the postal town, with the company's first word where two
// harbours would have the same name.
// The quay is the register's face (q: the point, the normal's angle, the length; tools/mottak/mottak.py snap), as a QUAYS entry in
// 07-harbours.js, and a harbour unit stands on it (UNITS, 01-world.js; its berths are the unit's); the harbour point lies 15 m out from
// its middle and the shore point 30 m in. The price factor is the receiver's price
// index (what it paid against the month's average, by kilo over the game's species) halfway to 1, between 0.94 and 1.06. Every coast
// harbour has fuel and the shop; an ice chute where the plant takes in 1 000 t or more a year.
const MOTTAK = /*@include(data/mottak.json)*/null;
const COAST_WF = ['torsk', 'hyse', 'sei', 'lyr', 'lange', 'brosme', 'uer', 'kveite', 'kongekrabbe', 'krabbe'];
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
  const hp = portById(S.home || 'finnsnes') || PORTS[0], e = regLetters(hp); if (!e) return null;
  let h = 0; for (const c of String(S.boatName || '') + (S.cur || '') + (b.type || '')) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  let n = 100 + h % 800; while (e[2].includes(n) && n < 9999) n++;
  return b.reg = {f:e[0], n, k:e[1]};
}
const regText = r => r ? r.f + '-' + r.n + '-' + r.k : '';

const COASTQ = {};
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
    if (g) g.rest.push(x); else groups.push({lead:x, rest:[]});
  }
  const own = PORTS.slice(), used = {};
  for (const g of groups){
    const x = g.lead, all = [x, ...g.rest], kg = all.reduce((a, r) => a + wf(r), 0);
    // the price index by kilo over the game's species
    let ws = 0, wi = 0; for (const r of all) for (const s of COAST_WF){ const v = r.sp[s]; if (v && v[2]){ ws += v[0]; wi += v[0] * v[2]; } }
    const idx = ws ? wi / ws : 1, pf = Math.round(clamp(1 + (idx - 1) * 0.5, 0.94, 1.06) * 1000) / 1000;
    const mk = {ids:all.map(r => r.id), names:all.map(r => r.n), k:x.k, kg:Math.round(kg), small:x.small, boats:all.reduce((a, r) => a + (r.boats || 0), 0),
      sp:Object.fromEntries(COAST_WF.filter(s => all.some(r => r.sp[s])).map(s => [s, {kg:all.reduce((a, r) => a + ((r.sp[s] || [0])[0] || 0), 0), months:all.reduce((a, r) => a | ((r.sp[s] || [0, 0, 0, 0])[3] || 0), 0)}])), idx:Math.round(idx * 100) / 100};
    // one of Senja's own harbours: it keeps its quay and unit and takes what the register knows
    const near = own.find(pt => dist(pt.p, {x:x.p[0], y:x.p[1]}) < 2);
    if (near){ if (!near.mk) near.mk = mk; continue; }
    const q = x.q, nx = Math.cos(q[2]), nz = Math.sin(q[2]), cx = q[0] * 1000, cz = q[1] * 1000, hl = Math.max(8, q[3] / 2), ux = -nz, uz = nx;
    let name = x.v || (x.k ? x.k.replace(/^./, c => c.toUpperCase()) : x.n);
    if (used[name]) name += ' (' + x.n.split(/[\s,]/)[0] + ')';
    used[name] = 1;
    const id = 'm' + x.id;
    COASTQ[id] = {main:{a:[cx - ux * hl, cz - uz * hl], b:[cx + ux * hl, cz + uz * hl], n:[nx, nz]}};
    // the harbour unit from Blender on the register's face (Jonas 05.10.2026: «3 modeller av ulike typer fiskemottak ... plasseres
    // tilfeldig på stedene der fiskemottakene er på ekte»): its block behind the face, the basin in front, in one of the three looks
    // (a today's plant, b the old fish plant, c the big plant), picked at random but the same every time for the receiver
    let hv = 0; for (const ch of id) hv = (hv * 31 + ch.charCodeAt(0)) >>> 0;
    const U = {id, o:[cx, cz], u:[nz, -nx], n:[nx, nz], f:[27.4, -24.4, 27.4, -28.4, -27.4, -28.4, -27.4, -24.4], v:'abc'[hv % 3], coastal:true};
    UNITS[id] = U; UNITA.push(U);
    PORTS.push({id, name, xy:[q[0], q[1]], shore:[q[0], q[1]], pier:true, fuel:true, ice:kg >= 1e6, mottak:true, pf, coast:{x:(cx - nx * 30) / 1000, y:(cz - nz * 30) / 1000},
      p:{x:Math.round(cx + nx * 15) / 1000, y:Math.round(cz + nz * 15) / 1000}, i:PORTS.length, mk, coastal:true});
    // the plant posts orders too (03-simulation.js ordersTick, near where you fish): for what it takes in most of
    const csp = Object.entries(mk.sp).filter(([s]) => SPECIES[s] && !SPECIES[s].shell).sort((a, b) => b[1].kg - a[1].kg).map(e => e[0]).slice(0, 3);
    CUSTOMERS.push({id:'c' + id, no:'Mottaket i ' + name, port:id, sp:csp.length ? csp : ['torsk', 'sei', 'hyse'], big:true, q:'A', coastal:true});
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
