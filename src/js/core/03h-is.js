// ---------- the sea ice by month (Havsteget H1b R5, V3 A; Jonas 03.11.2026: «iskanten etter måned») ----------
// data/is.json (tools/is/is.py, .github/workflows/is.yml): the mean ice concentration of each calendar month over 1991-2020 from
// EUMETSAT OSI SAF's climate data record (OSI-450-a, CC BY 4.0), on the game's frame in cells of c km (25, the source's own), in steps
// of `step` % and run-length coded per month (pairs of value and count). A month's mean stands at the middle of the month, and
// between two middles the concentration goes linearly with the time, so the edge moves a little every day and never jumps at the turn
// of a month; in space it is bilinear between the cells' middles, so the edge is a smooth line and not 25 km steps.
// At SEA_ICE_LIM % or more the sea is shut to a vessel without an ice class; a vessel with one (VESSELS[...].iceClass, the snow crab
// vessel from H3c) goes up to the limit of her class (seaIceLim, ICE_CLS).
// The limit: the WMO sea ice nomenclature (WMO-No. 259) has «very open drift ice» at 1-3/10 and «open drift ice» at 4-6/10, the
// latter what a hull that is not ice-strengthened should keep out of; so 40 %, the lower edge of open drift ice (an estimate, BACKLOG).
// What shuts: Autonav's grid and its legs (11-route.js), the sailing on a route (groundCheck, 01-world.js: she stops short of the
// ice and Autonav finds a way round), and the helm (16b-dyn.js: she stops at the edge, she does not run aground on it).
const SEA_ICE_D = /*@include(data/is.json)*/null;
const SEA_ICE = (() => {
  const D = SEA_ICE_D; if (!D || !D.m || D.m.length !== 12) return null;
  const N = D.nx * D.ny, dec = s => { const b = typeof atob === 'function' ? atob(s) : Buffer.from(s, 'base64').toString('binary'), a = new Uint8Array(N); let k = 0;
    for (let i = 0; i + 1 < b.length; i += 2){ const v = b.charCodeAt(i) * D.step, n = b.charCodeAt(i + 1); a.fill(v, k, Math.min(N, k + n)); k += n; }
    if (k !== N) throw new Error('is.json: a month has ' + k + ' cells, not ' + N); return a; };
  const M = D.m.map(dec), any = new Uint8Array(N);   // any: the most a cell has in any month (the quick way past open sea)
  for (const a of M) for (let i = 0; i < N; i++) if (a[i] > any[i]) any[i] = a[i];
  return {c:D.c, ix0:D.ix0, iy0:D.iy0, nx:D.nx, ny:D.ny, M, any, src:D.src, license:D.license, synthetic:!!D.synthetic};
})();
const SEA_ICE_LIM = 40;
// where in the year H is, in months from the middle of January (0) to the middle of December (11), and on to 12 = the next January
function seaIceMonth(H){
  const g = gDate(H), y = g.getUTCFullYear(), m = g.getUTCMonth(), dm = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  return m + (g.getUTCDate() - 1 + (g.getUTCHours() + g.getUTCMinutes() / 60) / 24) / dm - 0.5;
}
// the ice concentration (%) of month m at p, bilinear between the cells' middles (0 off the grid)
function seaIceCell(A, p){
  const I = SEA_ICE, u = p.x / I.c - I.ix0 - 0.5, v = p.y / I.c - I.iy0 - 0.5, i = Math.floor(u), j = Math.floor(v), fu = u - i, fv = v - j;
  const at = (a, b) => a < 0 || b < 0 || a >= I.nx || b >= I.ny ? 0 : A[b * I.nx + a];
  return (at(i, j) * (1 - fu) + at(i + 1, j) * fu) * (1 - fv) + (at(i, j + 1) * (1 - fu) + at(i + 1, j + 1) * fu) * fv;
}
// the ice concentration (%) at p and hour H (the game's clock when H is left out)
function seaIceAt(p, H){
  const I = SEA_ICE; if (!I || !p) return 0;
  // open sea all the year round in the four cells round p: no ice (most of the coast; a few lookups)
  const u = p.x / I.c - I.ix0 - 0.5, v = p.y / I.c - I.iy0 - 0.5, i = Math.floor(u), j = Math.floor(v);
  if (i < -1 || j < -1 || i >= I.nx || j >= I.ny) return 0;
  let mx = 0; for (const [a, b] of [[i, j], [i + 1, j], [i, j + 1], [i + 1, j + 1]]) if (a >= 0 && b >= 0 && a < I.nx && b < I.ny) mx = Math.max(mx, I.any[b * I.nx + a]);
  if (!mx) return 0;
  const t = seaIceMonth(H == null ? S.t / 60 : H), m0 = Math.floor(t), f = t - m0, a = I.M[(m0 + 12) % 12], b = I.M[(m0 + 13) % 12];
  return seaIceCell(a, p) * (1 - f) + seaIceCell(b, p) * f;
}
// The ice class as a limit (H3c of docs/planer/havsteget-h3-snokrabbe.md, V3 B; Jonas 06.11.2026): a vessel with an ice class may go in
// drift ice up to the concentration its class takes (ICE_CLS, %), and no further; without a class the limit is SEA_ICE_LIM. Before H3c
// a class meant the ice never shut (no vessel had one). No source gives a limit in per cent for a fishing vessel: from 1.1.2026 fishing
// vessels of 24 m and over follow only chapters 9-1 and 11-1 of the Polar Code and need no Polar Ship Certificate (a search snippet).
// The figures are worked out with the Polar Code's POLARIS method, RIO = C_open · 3 + sum C_i · RIV_i ≥ 0 for normal operation (IMO
// MSC.1/Circ.1519; the risk values for the Finnish-Swedish classes as we remember the table, not read in the source): in the first-year
// ice at the edge of the Barents Sea (medium, under 1 m), RIV −2 for IC gives 6/10, −1 for IB about 7/10 and 0 for IA no limit (kept at
// 8/10 here); a hull without a class (−3) gives 5/10, where the game keeps the stricter 4/10 of the WMO nomenclature (SEA_ICE_LIM). The
// Finnish-Swedish classes are made for level ice in a broken channel, IC 0.4 m, IB 0.6 m and IA 0.8 m (ABS, a snippet), and DNV ICE-1C,
// 1B and 1A answer to IC, IB and IA (Traficom, a snippet). The gear takes far less ice than the hull (SNOI in 10d-snokrabbe.js)
const ICE_CLS = {'1C':60, '1B':70, '1A':80};
// the concentration (%) the ice shuts the sea at for vessel type V (the boat you are on when left out)
function seaIceLim(V){ const T = V || (typeof BOAT !== 'undefined' ? BOAT : null); return T && T.iceClass && ICE_CLS[T.iceClass] ? ICE_CLS[T.iceClass] : SEA_ICE_LIM; }
// is the sea at p shut by the ice to vessel type V (the boat you are on when left out) at hour H?
function seaIceShut(p, H, V){ return seaIceAt(p, H) >= seaIceLim(V); }
// where on a leg the ice first shuts it (every 250 m: the edge is smooth over kilometres), or null
function seaIceOnLeg(a, b, H, V){
  if (!SEA_ICE) return null; const n = Math.max(1, Math.ceil(dist(a, b) / 0.25));
  for (let i = 1; i <= n; i++){ const p = {x:a.x + (b.x - a.x) * i / n, y:a.y + (b.y - a.y) * i / n}; if (seaIceShut(p, H, V)) return p; }
  return null;
}
// the words for it (the log, the stop): the concentration as tenths, as the ice charts give it
const seaIceWords = p => { const c = Math.round(seaIceAt(p) / 10), k = typeof BOAT !== 'undefined' && BOAT && BOAT.iceClass, L = Math.round(seaIceLim() / 10);
  return k ? {no:'Drivis forut (' + c + '/10). Isklassen ' + k + ' går i drivis opp til ' + L + '/10, ikke tettere.', en:'Drift ice ahead (' + c + '/10). Ice class ' + k + ' goes in drift ice up to ' + L + '/10, no closer.'}
    : {no:'Drivis forut (' + c + '/10). Båten har ikke isklasse og går ikke inn i isen.', en:'Drift ice ahead (' + c + '/10). The boat has no ice class and does not go into the ice.'}; };
