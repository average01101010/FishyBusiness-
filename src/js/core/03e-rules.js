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
const RU_KC1 = 'https://www.fiskeridir.no/yrkesfiske/j-meldinger/j-136-2026', RU_KC2 = 'https://www.fiskeridir.no/yrkesfiske/j-meldinger/J-138-2026';
const RU_BK = 'https://www.fiskeridir.no/yrkesfiske/j-meldinger/j-241-2025', RU_BUNN = 'https://lovdata.no/dokument/LTI/forskrift/2019-03-29-416';
// the king crab's quota area (J-136-2026 § 2), by an approximation of its lines in lat/lon: east of 26° E up to 71°30′ N, and west of
// it the sea south of Magerøya (Porsangerfjorden, and Kamøyfjorden and Magerøysundet east of 25°32′ E)
function kcQuota(ll){ const {lat, lon} = ll; return (lon >= 26 && lat <= 71.5) || (lon >= 25.53 && lon < 26 && lat < 71.02) || (lon >= 24.85 && lon < 26 && lat < 70.93); }
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
  // Greenland halibut (J-241-2025, 07.10.2026): line and nets on its grounds (400 m and deeper north of 62° N, or when you fish for it).
  // In the direct fishery up to the maximum quota, otherwise only bycatch (at most 7 % a week); nothing deeper than 1000 m with bottom
  // gear: «nye fiskeområder» need a permit of their own (the bottom gear regulation), shut in the game. Depth from the map where it
  // is in (a reader far from the boats may not have it)
  if (gear === 'line' || gear === 'garn' || sp === 'blakveite'){
    let dep = null; try { dep = depthF(p); } catch (e){}
    if (dep != null && dep > 1000 && gear !== 'juksa') add('no', 'bk1000', 'Dypere enn 1000 m er nye fiskeområder: bunnredskap, også garn og line, krever egen tillatelse.', 'Deeper than 1000 m is new fishing ground: bottom gear, nets and line too, needs a permit of its own.', 'Forskrift om bunnredskap', RU_BUNN, true);
    else if (n62 && (sp === 'blakveite' || (dep != null && dep >= 400))){
      const ss = bkSeason(yearH(H)), open = H >= ss.open && H < ss.stop;
      if (len >= 28) add('warn', 'bk7', 'Fartøy på 28 m og over kan bare ta blåkveite som bifangst, høyst 12,1 tonn i året.', 'Vessels of 28 m and over may only take Greenland halibut as bycatch, at most 12.1 tonnes a year.', 'J-241-2025 § 7', RU_BK);
      else if (!open) add('warn', 'bk5c', 'Direktefisket etter blåkveite er stengt (det åpner 25. mai). Blåkveite er bare lov som bifangst, høyst 7 % av ukas landinger.', 'The direct fishery for Greenland halibut is closed (it opens on 25 May). It is only allowed as bycatch, at most 7% of the week\'s landings.', 'J-241-2025 §§ 5, 7', RU_BK);
      else if (!bladB()) add('warn', 'bkB', 'Direktefisket etter blåkveite er åpent, men du må stå på blad B. Uten det er blåkveite bare bifangst (høyst 7 %).', 'The direct fishery for Greenland halibut is open, but you must be on blad B. Without it, it is only bycatch (at most 7%).', 'J-241-2025, deltakerforskriften', RU_BK);
      else add('ok', 'bk5o', 'Direktefisket etter blåkveite er åpent til ' + dayStr(ss.stop) + '. Maksimalkvoten for båten er ' + fmt(bkMax(len) / 1000, 1) + ' tonn. Minstemål 45 cm, og redskapen røktes annenhver dag.', 'The direct fishery for Greenland halibut is open until ' + dayStr(ss.stop) + '. The boat\'s maximum quota is ' + fmt(bkMax(len) / 1000, 1) + ' tonnes. Minimum size 45 cm, and the gear is tended every other day.', 'J-241-2025 §§ 5, 6', RU_BK);
    }
  }
  if (sp === 'uer' && n62 && !(len < 15 && gear === 'juksa' && ruIn2(md, 601, 831))) add('no', 'uer39', 'Uer kan bare fiskes med juksa fra båt under 15 m, 1. juni–31. august, nord for 62° N.', 'Redfish may only be fished by jig from a boat under 15 m, 1 June–31 August, north of 62° N.', 'Høstingsforskriften § 39', RU_HF);
  // king crab (J-136-2026 and J-138-2026, § 2 the same in both): east of the line at 26° E, with all of Porsangerfjorden and
  // Kamøyfjorden and Magerøysundet south-east of its line, is the quota area, for vessels registered in Finnmark whose owner lives there;
  // west of it the fishing is free: no quota and no minimum size, but all king crab caught must be landed (§ 5: it is forbidden to put
  // it back) and the pots must be without escape vents. Closed 1-9 November 2026 in the box 71°09′-71°14′ N, 25°20′-26° E (§ 10).
  if (sp === 'krabbe' && (!gear || gear === 'teiner')){
    if (kcQuota(ll)) add('no', 'kc2', 'Kvoteregulert område for kongekrabbe: bare båter registrert i Finnmark, med eier bosatt der i minst to år.', 'The quota area for king crab: only vessels registered in Finnmark, with an owner who has lived there for at least two years.', 'J-136-2026 § 2', RU_KC1, true);
    else {
      if (ruIn2(md, 1101, 1109) && ll.lat > 71.15 && ll.lat < 71.2334 && ll.lon > 25.3333 && ll.lon < 26) add('no', 'kc10', 'Stengt for kongekrabbe 1.–9. november (71°09′–71°14′ N, 25°20′–26° Ø).', 'Closed to king crab 1–9 November (71°09′–71°14′ N, 25°20′–26° E).', 'J-138-2026 § 10', RU_KC2, true);
      add('ok', 'kc5', 'Fritt fiske etter kongekrabbe vest for 26° Ø: ingen kvote og intet minstemål, men all kongekrabbe skal landes, og teinene skal være uten fluktåpning.', 'Free king crab fishing west of 26° E: no quota and no minimum size, but all king crab must be landed, and the pots must be without escape vents.', 'J-138-2026 § 5', RU_KC2);
    }
  }
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
    case 'blakveite': return 45;
    case 'uer': return nm < 12 ? 32 : 30;
    default: return null;
  }
}
// the limits on gear in the sea inside the fjord lines where p is (§ 33, § 33a), or null outside them
function fjordLimits(p, H){ const b = ruBits(p); if (!(b & 2)) return null; const winter = ruIn2(ruMD(H == null ? S.t / 60 : H), 1101, 430);
  return {nets:80, hooks:winter && (b & 32) ? null : 5000}; }
// R3: what the HUD, the Regler app and the chart's rule layer show. The short label of each reason, and the question asked for your
// boat where she is: her length, the gear she is rigged with, and halibut when you fish for it (otherwise any species)
const RU_SHORT = {f31:['Ikke torsk her', 'No cod here'], j32b:['Ikke innenfor grunnlinja', 'Not inside the baseline'], j32c:['Ikke innenfor 4 nm', 'Not within 4 nm'],
  henn:['Henningsværboksen er stengt', 'The Henningsvær box is closed'], borg:['Borgundfjorden er stengt', 'Borgundfjorden is closed'], stengt:['Stengt felt', 'Closed field'],
  gyte:['Gytefeltet er stengt', 'The spawning area is closed'], null:['Nullfiskeområde', 'No-fishing area'], oslo:['Ikke torsk i Oslofjorden', 'No cod in the Oslo fjord'],
  oslog:['Bare håndredskap her', 'Hand gear only here'], lopp:['Verneområde', 'Protected area'], kv39:['Kveita er fredet', 'Halibut is protected'], kv40:['Forbudsområde for kveite', 'No-fishing area for halibut'],
  uer39:['Uer er ikke lov', 'Redfish not allowed'], f33:['Høyst 5 000 kroker', 'At most 5,000 hooks'], f33a:['Høyst 80 torskegarn', 'At most 80 cod nets'], j32by:['Bifangst høyst 20 %', 'Bycatch at most 20%'],
  lofot:['Felleshav: om bord 10–17', 'Common ground: aboard 10–17'], raet:['Raet: egne regler', 'Raet: own rules'], oslot:['Høyst 10 teiner', 'At most 10 pots'],
  kc2:['Kvoteområde for kongekrabbe', 'King crab quota area'], kc10:['Stengt for kongekrabbe', 'Closed to king crab'], kc5:['Fritt fiske: alt landes', 'Free fishing: land all'],
  bk1000:['Over 1000 m: egen tillatelse', 'Over 1000 m: permit needed'], bk5o:['Blåkveite: direktefiske åpent', 'Greenland halibut: open'], bk5c:['Blåkveite: bare bifangst', 'Greenland halibut: bycatch only'],
  bkB:['Blåkveite: krever blad B', 'Greenland halibut: needs blad B'], bk7:['Blåkveite: bare bifangst over 28 m', 'Greenland halibut: bycatch only over 28 m'],
  f31h:['Andre arter enn torsk er lov', 'Species other than cod allowed'], f31a:['Andre arter enn torsk er lov', 'Species other than cod allowed'], f33b:['Ingen krokgrense nå', 'No hook limit now']};
function ruCtx(){ const b = S.boat; return {p:b.status === 'port' && typeof portById === 'function' && b.port ? portById(b.port).p : b.pos, len:BOAT.len, gear:b.rig || 'juksa',
  sp:b.rig === 'teiner' ? 'krabbe' : S.target === 'kveite' ? 'kveite' : null, hand:!(S.equip && S.equip.jukse > 0)}; }
// the answer for your boat now, kept for 10 game minutes and 50 m
let RU_NOW = null;
function ruNow(){ const q = ruCtx(), k = [q.len, q.gear, q.sp, q.hand].join('|');
  if (RU_NOW && RU_NOW.k === k && Math.abs(RU_NOW.t - S.t) < 10 && Math.hypot(RU_NOW.p.x - q.p.x, RU_NOW.p.y - q.p.y) < 0.05) return RU_NOW.r;
  const r = rulesAt(q); RU_NOW = {k, t:S.t, p:{x:q.p.x, y:q.p.y}, r}; return r; }
const ruShort = it => it ? gL(...(RU_SHORT[it.k] || [it.no, it.en])) : '';
// the chart's rule layer: the answer for your boat on a 250 m grid, a 10 km block at a time (40 x 40), 0 ok, 1 warn, 2 no; only at sea
const RU_LAYER = new Map();
function ruLayerBlock(bx, by, q, budget){
  const key = bx + ',' + by + '|' + [q.len, q.gear, q.sp, q.hand, ruMD(S.t / 60)].join('|'); let A = RU_LAYER.get(key); if (A) return A;
  if (budget && performance.now() > budget) return null;
  A = new Uint8Array(1600); const rank = {no:2, warn:1, ok:0};
  for (let j = 0; j < 40; j++) for (let i = 0; i < 40; i++){ const p = {x:bx * 10 + (i + 0.5) * 0.25, y:by * 10 + (j + 0.5) * 0.25};
    if (isLandFar(p)){ A[j * 40 + i] = 3; continue; }
    const r = rulesAt({p, H:S.t / 60, len:q.len, gear:q.gear, sp:q.sp, hand:q.hand}); A[j * 40 + i] = rank[r.v] || 0; }
  if (RU_LAYER.size > 400) RU_LAYER.delete(RU_LAYER.keys().next().value);
  RU_LAYER.set(key, A); return A;
}
// R4 (05.10.2026, Jonas: «Ja, kjør på»): a warning before the mistake, not after it. The question for a planned stop: a fishing point
// asks for the jig (the boat jigs on its fishing hours), a point that sets gear asks for that gear
function ruWpQ(w){ const c = ruCtx(), p = {x:w.x, y:w.y};
  if (w.act && (w.act.op === 'set' || w.act.op === 'cycle') && w.act.kind){ const k = w.act.kind; return {p, len:c.len, gear:k === 'teine' ? 'teiner' : k, sp:k === 'teine' ? 'krabbe' : null, hand:c.hand}; }
  return {p, len:c.len, gear:'juksa', sp:S.target === 'kveite' ? 'kveite' : null, hand:c.hand}; }
// what stops the boat at a planned stop (null when it may fish or set there), kept per point, boat and day
const RU_WP = new Map();
function ruWpMsg(w){
  if (!RU.ok || !w || w.port || !((w.fish || 0) > 0 || (w.act && (w.act.op === 'set' || w.act.op === 'cycle')))) return null;
  const q = ruWpQ(w), k = [q.p.x.toFixed(3), q.p.y.toFixed(3), q.len, q.gear, q.sp, q.hand, S.lang, ruMD(S.t / 60)].join('|');
  if (RU_WP.has(k)) return RU_WP.get(k);
  const m = ruBlockMsg(q); if (RU_WP.size > 300) RU_WP.delete(RU_WP.keys().next().value); RU_WP.set(k, m); return m;
}
// the nearest place within maxKm where the question q is not stopped, at sea: rings out from p, sixteen ways round (null if none)
function ruOpenNear(p, q, maxKm){
  for (const r of [0.15, 0.3, 0.5, 0.75, 1, 1.5, 2, 3, 4, 5]){ if (r > maxKm) break; let best = null;
    for (let i = 0; i < 16; i++){ const a = i * Math.PI / 8, c = {x:p.x + Math.sin(a) * r, y:p.y - Math.cos(a) * r};
      if (isLandUI(c) || ruBlockMsg({...q, p:c})) continue; best = c; break; }
    if (best) return best; }
  return null;
}
// the first time a rule concerns your boat at sea, a tip about it: a message in the phone with the whole text and where it comes from,
// and a short word on the screen (S.ruSeen keeps the ones told; not in «Første tur», which has enough to say)
function ruTips(){
  if (!RU.ok || (typeof tutOn === 'function' && tutOn())) return;
  const b = S.boat; if (!['sailing', 'fishing', 'idle'].includes(b.status) || b.port) return;
  const seen = S.ruSeen || (S.ruSeen = {}), r = ruNow(), it = r.items.find(i => (i.v === 'no' || i.v === 'warn') && seen[i.k] == null); if (!it) return;
  seen[it.k] = S.t || 1;
  msg('Regler', it.no + ' (' + it.ref + ') Regler-appen viser hva som gjelder der du er, og regellaget i kartplotteren viser det på kartet.',
    it.en + ' (' + it.ref + ') The Regler app shows what applies where you are, and the rule layer in the chart plotter shows it on the chart.');
  if (typeof toast === 'function') toast(gL('Ny regel her: ', 'A new rule here: ') + ruShort(it) + gL('. Se meldingen i telefonen.', '. See the message in the phone.'));
}
