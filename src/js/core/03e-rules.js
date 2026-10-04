// The rules along the coast (R2 of the rules plan, 05.10.2026). rulesAt() takes a place, a time, the boat's length, the gear and the
// species, and answers ok, warn or no, with the reasons, the paragraph and the source. The map data are src/data/rules.json
// (tools/rules/regler.py, R1): the baseline and the sea inside it, the zones inside the closing lines (F the fjord lines for coastal
// cod, O the Oslo fjord, B inside the fjord lines but outside a hook line in Finnmark), Fiskeridirektoratet's regulation layers with their
// texts, and the statistics areas. The rules are written out here from the regulations:
//  - høstingsforskriften (FOR-2021-12-23-3910) § 31 (15 m and over inside the fjord lines, with its exceptions), § 33 (5 000 hooks;
//    in six Finnmark fjords inside their own lines 1.11-30.4), § 33a (80 cod nets), § 39 (halibut and redfish), § 40 (the halibut
//    area), § 47 (minimum sizes)
//  - J-161-2026 § 32 (coastal cod: 21-27.99 m inside the baseline, 28 m and over within 4 nm, the exceptions by statistics area and
//    date, Henningsvær, Borgundfjorden)
//  - the layers' own texts: closed fields (J-meldinger), the spawning areas south of 62° N, the Oslo fjord, Lopphavet, Lofoten
// Only what concerns the game's species and gear (Jonas 04.10.2026: no lobster, nothing for species the game does not have).
// Said plainly: the closed fields are a snapshot of the day the data were fetched and hold in the game whatever its date; the zones
// follow the game's 200 m land, so where the sea is narrow they can be 100-200 m off; a point is looked up in 100 m cells.
const RULES_D = /*@include(data/rules.json)*/null;
const RU = (() => {
  const D = RULES_D || {}, U = D.unit || 0.01;
  const dec = a => { const o = new Float64Array(a.length); let x = 0, y = 0; for (let i = 0; i + 1 < a.length; i += 2){ x += a[i]; y += a[i + 1]; o[i] = x * U; o[i + 1] = y * U; } return o; };
  const bbOf = rs => { const b = [1e9, 1e9, -1e9, -1e9]; for (const r of rs) for (let i = 0; i < r.length; i += 2){ const x = r[i], y = r[i + 1]; if (x < b[0]) b[0] = x; if (y < b[1]) b[1] = y; if (x > b[2]) b[2] = x; if (y > b[3]) b[3] = y; } return b; };
  const polys = r => (r || []).map(rr => { const rings = rr.map(dec); return {rings, bb:bbOf(rings)}; });
  const L = {};
  for (const id in D.L || {}){ const l = D.L[id]; L[id] = {id:+id, n:l.n, d:l.d, f:l.f.map(f => { const P = polys(f.r), ls = (f.l || []).map(dec), pts = (f.p || []).map(dec);
    return {a:f.a || {}, P, ls, pts, bb:bbOf(P.length ? P.map(p => p.rings[0]) : ls.length ? ls : pts)}; })}; }
  const zones = (D.zones || []).map(z => ({f:z.f || '', l:z.l || [], km2:z.km2, P:polys(z.r)}));
  return {D, ok:!!D.bl, made:D.made || '', bl:D.bl ? dec(D.bl) : new Float64Array(0), blin:polys(D.blin), zones, L,
    hom:(D.hom || []).map(h => ({c:h.c, P:polys(h.r)})), lok:(D.lok || []).map(h => ({c:h.c, P:polys(h.r)})), nm:D.nm || {}, dec};
})();
function ruPip(rings, x, y){ let c = false; for (const r of rings){ const n = r.length; for (let i = 0, j = n - 2; i < n; j = i, i += 2){ const yi = r[i + 1], yj = r[j + 1]; if ((yi > y) !== (yj > y) && x < (r[j] - r[i]) * (y - yi) / (yj - yi) + r[i]) c = !c; } } return c; }
function ruIn(P, x, y){ for (const p of P){ const b = p.bb; if (x < b[0] || x > b[2] || y < b[1] || y > b[3]) continue; if (ruPip(p.rings, x, y)) return true; } return false; }
// the zones and the baseline in 100 m cells, a 10 km block at a time when first asked for (scanlines over the rings): bit 1 inside the
// baseline, 2 inside the fjord lines (F), 16 the Oslo fjord (O), 32 inside the fjord lines but outside a Finnmark hook line (B, free of
// the hook limit 1.11-30.4)
const RU_C = 0.1, RU_B = 10, RU_N = 100, RUB = new Map(), RU_BIT = {F:2, O:16, B:32};
function ruBlock(bx, by){
  const key = bx * 8192 + by; let A = RUB.get(key); if (A) return A;
  A = new Uint8Array(RU_N * RU_N); const x0 = bx * RU_B, y0 = by * RU_B, y1 = y0 + RU_B, xs = [], E = [];
  const scan = (rings, bit) => {
    // only the edges that cross the block's band of rows, then each row through them
    E.length = 0;
    for (const r of rings){ const n = r.length; for (let i = 0, k = n - 2; i < n; k = i, i += 2){ const yi = r[i + 1], yk = r[k + 1]; if ((yi < y0 && yk < y0) || (yi > y1 && yk > y1) || yi === yk) continue; E.push(r[i], yi, r[k], yk); } }
    if (!E.length) return;
    for (let j = 0; j < RU_N; j++){ const y = y0 + (j + 0.5) * RU_C; xs.length = 0;
      for (let e = 0; e < E.length; e += 4){ const yi = E[e + 1], yk = E[e + 3]; if ((yi > y) !== (yk > y)) xs.push(E[e] + (y - yi) * (E[e + 2] - E[e]) / (yk - yi)); }
      if (xs.length < 2) continue; xs.sort((a, b) => a - b);
      for (let q = 0; q + 1 < xs.length; q += 2){ const i0 = Math.max(0, Math.ceil((xs[q] - x0) / RU_C - 0.5)), i1 = Math.min(RU_N - 1, Math.floor((xs[q + 1] - x0) / RU_C - 0.5)); for (let i = i0; i <= i1; i++) A[j * RU_N + i] |= bit; } } };
  const fill = (P, bit) => { for (const p of P){ const b = p.bb; if (b[2] < x0 || b[0] > x0 + RU_B || b[3] < y0 || b[1] > y0 + RU_B) continue; scan(p.rings, bit); } };
  fill(RU.blin, 1);
  for (const z of RU.zones){ let bit = 0; for (const ch of z.f) bit |= RU_BIT[ch] || 0; if (bit) fill(z.P, bit); }
  if (RUB.size > 600) RUB.delete(RUB.keys().next().value);
  RUB.set(key, A); return A;
}
function ruBits(p){ if (!RU.ok) return 0; const bx = Math.floor(p.x / RU_B), by = Math.floor(p.y / RU_B), A = ruBlock(bx, by);
  return A[Math.min(RU_N - 1, Math.floor((p.y - by * RU_B) / RU_C)) * RU_N + Math.min(RU_N - 1, Math.floor((p.x - bx * RU_B) / RU_C))]; }
// inside the fjord lines for coastal cod (høstingsforskriften vedlegg 4), along the whole coast
function insideFjord(p){ return !!(ruBits(p) & 2); }
function insideBaseline(p){ return !!(ruBits(p) & 1); }
// km from the baseline (0 inside it); the zones of 1, 2, 4, 6, 12 nm are measured from it
function blDist(p){
  if (insideBaseline(p)) return 0; const b = RU.bl; let best = 1e9;
  for (let i = 0; i + 3 < b.length; i += 2){ const ax = b[i], ay = b[i + 1], dx = b[i + 2] - ax, dy = b[i + 3] - ay, l2 = dx * dx + dy * dy, t = l2 ? clamp(((p.x - ax) * dx + (p.y - ay) * dy) / l2, 0, 1) : 0, ex = ax + t * dx - p.x, ey = ay + t * dy - p.y, d = ex * ex + ey * ey; if (d < best) best = d; }
  return Math.sqrt(best);
}
const blNm = p => blDist(p) / 1.852;
function ruHom(p){ for (const h of RU.hom) if (ruIn(h.P, p.x, p.y)) return h.c; return null; }
function ruLok(p){ for (const h of RU.lok) if (ruIn(h.P, p.x, p.y)) return h.c; return null; }
// the zone of the closing lines a point is in (for its lines' names), and the features of a layer that hold it
function ruZone(p){ for (const z of RU.zones) if (ruIn(z.P, p.x, p.y)) return z; return null; }
function ruAt(id, p){ const l = RU.L[id]; return l ? l.f.filter(f => f.P.length && p.x >= f.bb[0] && p.x <= f.bb[2] && p.y >= f.bb[1] && p.y <= f.bb[3] && ruIn(f.P, p.x, p.y)) : []; }
// the names of the fjord lines round a zone: «Fra – Til» from layer 2
function ruLineName(ref){ const k = ref[0], i = +ref.slice(1), id = {F:2, K:5, O:38}[k], f = RU.L[id] && RU.L[id].f[i]; if (!f) return ''; const a = f.a;
  return a.fra ? a.fra + ' – ' + a.til : (a.sted || a.fjord || a.navn || ''); }
// month and day as a number (MMDD) and the span test, both inclusive and across new year
const ruMD = H => { const g = gDate(H); return (g.getUTCMonth() + 1) * 100 + g.getUTCDate(); };
const ruIn2 = (md, a, b) => a <= b ? md >= a && md <= b : md >= a || md <= b;
const RU_HF = 'https://lovdata.no/forskrift/2021-12-23-3910', RU_J161 = 'https://www.fiskeridir.no/yrkesfiske/j-meldinger/j-161-2026';
// the line in Vestfjorden (J-161-2026 § 32 tredje ledd): 28 m and over may fish haddock and saithe in area 00 on the outer side of it
const RU_VF = [P(67 + 49.61 / 60, 12 + 49.25 / 60), P(67 + 15.20 / 60, 14 + 18.90 / 60)], RU_SVV = P(68.234, 14.568);
const ruVfIn = p => { const [a, b] = RU_VF, s = q => Math.sign((b.x - a.x) * (q.y - a.y) - (b.y - a.y) * (q.x - a.x)); return s(p) === s(RU_SVV); };
const RU_COD = ['torsk', 'hyse', 'sei'], RU_CONV = ['juksa', 'line', 'garn', 'teiner'];
// The rules at a place. q: {p, H, len (m), gear ('juksa' | 'line' | 'garn' | 'teiner' | null), sp (a species key or null for any),
// hand (a hand jig, which counts as a hand line)}. Each reason: {v:'no' | 'warn' | 'ok' | 'info', k, no, en, ref, url, block}, where
// block marks what the game stops you doing today; the answer is the worst of them.
function rulesAt(q){
  const p = q.p, H = q.H == null ? S.t / 60 : q.H, len = q.len || 0, gear = q.gear || null, sp = q.sp || null, out = [], md = ruMD(H);
  const ll = LL(p), n62 = ll.lat >= 62, bits = ruBits(p), F = !!(bits & 2), inBL = !!(bits & 1), nm = blNm(p), hom = n62 ? ruHom(p) : null;
  const add = (v, k, no, en, ref, url, block) => out.push({v, k, no, en, ref, url, block:!!block});
  const isSp = s => !sp || sp === s, cod3 = !sp || RU_COD.includes(sp), conv = !gear || RU_CONV.includes(gear);
  // høstingsforskriften § 31: 15 m and over inside the fjord lines
  if (F && len >= 15){
    if (isSp('torsk')) add('no', 'f31', 'Fartøy på 15 m eller mer kan ikke fiske torsk innenfor fjordlinjene.', 'Vessels of 15 m or more may not fish cod inside the fjord lines.', 'Høstingsforskriften § 31', RU_HF, true);
    if (sp && sp !== 'torsk'){
      if (len < 21) add('ok', 'f31h', 'Under 21 m kan du fiske andre arter enn torsk med konvensjonelle redskap innenfor fjordlinjene, med høyst 5 % torsk som bifangst.', 'Under 21 m you may fish species other than cod with conventional gear inside the fjord lines, with at most 5% cod as bycatch.', 'Høstingsforskriften § 31 h, J-161-2026 § 32', RU_HF);
      else if (ll.lat < 68.26) add('ok', 'f31a', 'Sør for Tysfjorden (68° 15,6′ N) kan fartøy på 15 m eller mer fiske andre arter enn torsk innenfor fjordlinjene.', 'South of Tysfjorden (68° 15.6′ N) vessels of 15 m or more may fish species other than cod inside the fjord lines.', 'Høstingsforskriften § 31 a', RU_HF);
      else add('no', 'f31', 'Fartøy på 21 m eller mer kan ikke fiske innenfor fjordlinjene her.', 'Vessels of 21 m or more may not fish inside the fjord lines here.', 'Høstingsforskriften § 31', RU_HF, true);
    }
  }
  // § 33 and § 33a: hooks and nets inside the fjord lines (in six Finnmark fjords inside their own lines from 1 November to 30 April)
  const winter = ruIn2(md, 1101, 430), hookZ = F && !(winter && (bits & 32));
  if (hookZ && (!gear || gear === 'line')) add('warn', 'f33', 'Høyst 5 000 kroker per døgn på bunnline innenfor fjordlinjene.', 'At most 5,000 hooks a day on bottom line inside the fjord lines.', 'Høstingsforskriften § 33', RU_HF);
  else if (F && winter && (!gear || gear === 'line')) add('ok', 'f33b', 'Her, utenfor krokgrensa i Finnmark, er det ingen grense på kroker fra 1. november til 30. april.', 'Here, outside the Finnmark hook line, there is no limit on hooks from 1 November to 30 April.', 'Høstingsforskriften § 33 andre ledd', RU_HF);
  if (F && (!gear || gear === 'garn') && isSp('torsk')) add('warn', 'f33a', 'Høyst 80 garn i fisket etter torsk innenfor fjordlinjene.', 'At most 80 nets when fishing cod inside the fjord lines.', 'Høstingsforskriften § 33a', RU_HF);
  // J-161-2026 § 32: cod, haddock and saithe with conventional gear north of 62° N, by length
  if (n62 && cod3 && conv && len >= 21){
    const a00 = hom === '00', a67 = hom === '06' || hom === '07', a05r = ['03', '04', '05'].includes(hom);
    const forSp = s => {
      if (len < 28){
        if (!inBL) return null;
        if ((a00 || a67) && s !== 'torsk') return null;
        if (s === 'torsk' && !F && ((a00 && ruIn2(md, 101, 501)) || (a67 && ruIn2(md, 101, 410)))) return null;
        return 'b21';
      }
      if (nm >= 4) return null;
      if (a67 && s !== 'torsk') return null;
      if (a00 && !F && !ruVfIn(p) && (s !== 'torsk' || ruIn2(md, 301, 414))) return null;
      if (a05r && ruIn2(md, 101, 630) && !inBL) return null;
      if (a05r && ruIn2(md, 701, 1231) && ll.lon >= 21 + 58.78 / 60 && nm >= 2) return null;
      return 'b28';
    };
    const bad = (sp ? [sp] : RU_COD).filter(s => forSp(s));
    if (bad.length){
      const names = bad.map(s => SPECIES[s].no.toLowerCase()).join(', '), en = bad.map(s => SPECIES[s].en.toLowerCase()).join(', ');
      if (len < 28) add('no', 'j32b', 'Fartøy på 21–27,99 m kan ikke fiske ' + names + ' innenfor grunnlinjen her.', 'Vessels of 21–27.99 m may not fish ' + en + ' inside the baseline here.', 'J-161-2026 § 32 andre ledd', RU_J161, true);
      else add('no', 'j32c', 'Fartøy på 28 m eller mer kan ikke fiske ' + names + ' innenfor 4 nm av grunnlinjen her.', 'Vessels of 28 m or more may not fish ' + en + ' within 4 nm of the baseline here.', 'J-161-2026 § 32 tredje ledd', RU_J161, true);
    }
  } else if (n62 && sp && !RU_COD.includes(sp) && len >= 21 && (len < 28 ? inBL : nm < 4))
    add('warn', 'j32by', 'Du fisker andre arter der fartøyet ikke kan fiske torsk, hyse og sei: høyst 20 % av dem som bifangst.', 'You fish other species where the vessel may not fish cod, haddock and saithe: at most 20% of them as bycatch.', 'J-161-2026 § 32 ellevte ledd', RU_J161);
  // the areas: Henningsvær, Borgundfjorden, Lofoten's common grounds, the closed fields, the spawning areas in the south, the Oslo fjord, Lopphavet
  if (ruIn2(md, 101, 630) && len > 11 && ruAt(6, p).length) add('no', 'henn', 'Henningsværboksen er stengt for alt fiske 1.1–30.6 for fartøy over 11 m.', 'The Henningsvær box is closed to all fishing 1.1–30.6 for vessels over 11 m.', 'J-161-2026 § 32 fjerde ledd', RU_J161, true);
  if (ruIn2(md, 301, 531) && ruAt(24, p).length && !(gear === 'juksa' && q.hand)) add('no', 'borg', 'Alt fiske er forbudt i Borgundfjorden 1.3–31.5, unntatt med håndsnøre og fiskestang.', 'All fishing is banned in Borgundfjorden 1.3–31.5, except with hand line and rod.', 'J-161-2026 § 32 sjuende ledd', RU_J161, true);
  if (ruIn2(md, 301, 414) && (!gear || gear === 'garn' || gear === 'line')) for (const f of ruAt(1, p)) add('warn', 'lofot', (f.a.navn || 'Fleksibelt felleshav') + ': faststående redskap skal være om bord fra kl. 10 til 17.', (f.a.navn || 'Flexible common ground') + ': fixed gear must be aboard from 10:00 to 17:00.', f.a.jmelding || 'J-236-2025', f.a.url);
  for (const f of ruAt(0, p)){ const t = (f.a.type_text || '').toLowerCase(), hit = gear && ((gear === 'line' && /line/.test(t)) || (gear === 'garn' && /garn/.test(t)) || /konvensjonell|alle redskap/.test(t));
    add(hit ? 'no' : 'info', 'stengt', (f.a.navn || 'Stengt felt') + ': stengt for ' + (f.a.type_text || 'fiske') + (f.a.jmelding_navn ? ' (' + f.a.jmelding_navn + ')' : '') + '.', (f.a.navn || 'Closed field') + ': closed to ' + (f.a.type_text || 'fishing') + (f.a.jmelding_navn ? ' (' + f.a.jmelding_navn + ')' : '') + '.', f.a.jmelding_navn || 'J-melding', f.a.url, hit); }
  if (ruIn2(md, 101, 430)) for (const f of ruAt(16, p)) add('no', 'gyte', (f.a.navn || 'Gytefelt') + ': alt fiske er forbudt 1.1–30.4 (gytefelt for kysttorsk).', (f.a.navn || 'Spawning area') + ': all fishing is banned 1.1–30.4 (coastal cod spawning area).', 'Forskrift om fredningsområder for kysttorsk', f.a.forskrift || f.a.url, true);
  if (ruAt(37, p).length) add('no', 'null', 'Nullfiskeområde i indre Oslofjord: alt fiske er forbudt.', 'No-fishing area in the inner Oslo fjord: all fishing is banned.', 'Oslofjordforskriften', null, true);
  else if (ruAt(8, p).length){
    if (isSp('torsk')) add('no', 'oslo', 'Det er forbudt å fiske torsk i Oslofjorden hele året.', 'Fishing cod in the Oslo fjord is banned all year.', 'Oslofjordforskriften', null, true);
    if (gear === 'garn' || gear === 'line' || (gear === 'juksa' && !q.hand)) add('no', 'oslog', 'I Oslofjorden er bare håndsnøre, stang og lignende håndholdte redskap lov for fisk.', 'In the Oslo fjord only hand lines, rods and similar hand-held gear are allowed for fish.', 'Oslofjordforskriften', null, true);
    if (gear === 'teiner') add('warn', 'oslot', 'I Oslofjorden kan du ha høyst 10 teiner for skalldyr.', 'In the Oslo fjord you may have at most 10 pots for shellfish.', 'Oslofjordforskriften', null);
  }
  for (const f of ruAt(39, p)) add('no', 'lopp', (f.a.navn || 'Lopphavet') + ': det er forbudt å fiske i dette området (Lopphavet marine verneområde).', (f.a.navn || 'Lopphavet') + ': fishing is banned in this area (Lopphavet marine protected area).', 'Verneforskriften for Lopphavet', f.a.forskrift, true);
  for (const f of ruAt(31, p)) add('warn', 'raet', 'Raet nasjonalpark, sone ' + (f.a.sone || '') + ': egne regler for fiske i verneforskriften.', 'Raet national park, zone ' + (f.a.sone || '') + ': own fishing rules in the protection regulation.', 'Verneforskriften for Raet', f.a.forskrift);
  // the species and the seasons (§ 39, § 40)
  if (sp === 'kveite'){
    if (!n62) add('no', 'kv39', 'Det er forbudt å fiske kveite sør for 62° N hele året.', 'Fishing halibut south of 62° N is banned all year.', 'Høstingsforskriften § 39', RU_HF);
    else if (ruIn2(md, 1220, 420)) add('no', 'kv39', 'Kveita er fredet nord for 62° N fra 20. desember til 20. april.', 'Halibut is protected north of 62° N from 20 December to 20 April.', 'Høstingsforskriften § 39', RU_HF);
    if (ruAt(7, p).some(f => /kveite/i.test(f.a.navn || ''))) add('no', 'kv40', 'Forbudsområde for kveite.', 'No-fishing area for halibut.', 'Høstingsforskriften § 40', RU_HF, true);
  }
  if (sp === 'uer' && n62 && !(len < 15 && gear === 'juksa' && ruIn2(md, 601, 831))) add('no', 'uer39', 'Uer kan bare fiskes med juksa fra båt under 15 m, 1. juni–31. august, nord for 62° N.', 'Redfish may only be fished by jig from a boat under 15 m, 1 June–31 August, north of 62° N.', 'Høstingsforskriften § 39', RU_HF);
  const rank = {no:3, warn:2, ok:1, info:0}, v = out.reduce((a, r) => rank[r.v] > rank[a] ? r.v : a, 'ok');
  return {v:v === 'info' ? 'ok' : v, items:out, bits, inBL, F, nm, hom, lat:ll.lat, n62};
}
// what the game stops you doing (the reasons with block): null when you may, else the first reason's text
function ruBlockMsg(q){ const r = rulesAt(q), b = r.items.find(x => x.block && x.v === 'no'); return b ? gL(b.no, b.en) : null; }
// § 47 minimum sizes (cm) where you are, for the species the game has
function ruMinSize(sp, p){
  const ll = LL(p), n62 = ll.lat >= 62, nm = blNm(p);
  switch (sp){
    case 'torsk': return n62 ? (nm < 4 ? 55 : 44) : 40;
    case 'hyse': return n62 ? 40 : 32;
    case 'sei': return n62 ? 45 : 40;
    case 'kveite': return 84;
    case 'uer': return nm < 12 ? 32 : 30;
    case 'krabbe': return ll.lat < 59.85 || (ll.lon > 9 && ll.lat < 60.2) ? 11 : 13;
    default: return null;
  }
}
// the limits on gear in the sea inside the fjord lines where p is (§ 33, § 33a), or null outside them
function fjordLimits(p, H){ const b = ruBits(p); if (!(b & 2)) return null; const winter = ruIn2(ruMD(H == null ? S.t / 60 : H), 1101, 430);
  return {nets:80, hooks:winter && (b & 32) ? null : 5000}; }
