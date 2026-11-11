// ===== Kystvakta: the inspection at the quay or on the field (Oppdrag 2 V1, 30.10.2026; docs/planer/oppdrag-2.md, docs/systemer/kvoter-og-regler.md 5.30) =====
// At most once a game week the coast guard comes alongside, never in the first week and never in a gale, and asks what the rules engine
// (03e-rules.js) already knows for the place, the gear in the sea and the catch aboard. Nothing is asked that the Regler app would not have
// told you first: «Kan jeg fiske her?» is the answer. A clean check is one sentence, «Kontrollert» in the papers and a smaller chance of the
// next one for two weeks; a remark gets the rule read out with its source, and exactly the consequence the game has today (the cod and the
// bycatch beyond the rule are confiscated at the landing, ui/08-actions.js). No fine (V-A A). Measured in the event kv_check.
const KV = {p:0.5, pAfterOk:0.25, okFor:14 * 1440, gale:13.9, visitMin:30, minLand:3, nets:80, hooks:5000, keep:10, gap:{kai:1.5, sjo:6}};
// the coast guard's two ships (tools/boats/kv.py, steg 100, valg 30 V1 C, Jonas 10.11.2026): the 47 m one at the quay and along the coast
// (the inner coast guard), the 93 m one at sea aboard an ocean vessel (the outer coast guard, as at Svalbard and on the banks); each
// model's own length and beam, and the 93 m one's RIB (V2 A). KV.gap is the clear water between her hull and the boat's (m): rafted on
// fenders at the quay, a few metres off at sea; docs/skipsmodeller/kystvakt-grunnlag.md kap. 4
const KVS = {kyst:{t:'kv47', L:47.2, B:10.3}, hav:{t:'kv90', L:93.0, B:16.6, rib:{L:8.5, B:3.0}}};
// the RIB's stages through the check at sea (minutes from the visit's start, together KVH.visitMin): lowered from the davit (2), across
// to the vessel (6), alongside her port side while the inspectors are aboard (74), back (6), hoisted in (2); the times are assumed
// the source each code cites, for Kystposten's story (the story carries the codes only, 09h-press.js; the texts stay in rulesAt)
const KV_REF = {skagby:'FOR-2025-12-19-2805 § 5', nsjo3:'FOR-2025-12-19-2805 §§ 4 og 5', skag3:'FOR-2025-12-19-2805 §§ 4 og 5', gyte18:'J-229-2025 § 2', opp19:'J-99-2026 § 2', kvoteh:'J-187-2026 § 14', seiby:'J-187-2026 § 14', lby:'J-128-2026', bby:'J-128-2026', f49:'Høstingsforskriften § 49', f26:'Høstingsforskriften § 26', f26b:'Høstingsforskriften § 26', f31:'Høstingsforskriften § 31', f33:'Høstingsforskriften § 33', f33a:'Høstingsforskriften § 33a', f18:'Høstingsforskriften § 18', kv40:'Høstingsforskriften § 40', j32b:'J-187-2026 § 32', j32c:'J-187-2026 § 32', henn:'J-187-2026 § 32', borg:'J-187-2026 § 32', kvote:'J-187-2026', byc:'Deltakerforskriften', stengt:'J-melding om stengt felt', gyte:'Forskrift om fredningsområder for kysttorsk', null:'Oslofjordforskriften', oslo:'Oslofjordforskriften', oslog:'Oslofjordforskriften', lopp:'Verneforskriften for Lopphavet', bk1000:'Forskrift om bunnredskap', kc2:'J-136-2026', kc10:'J-138-2026', skag:'Torskeforskriften for Nordsjøen og Skagerrak § 1',
  sk0:'J-237-2025 § 2', sk1:'J-237-2025 § 1', sk2:'J-237-2025 § 1', sk3:'J-237-2025 § 5', sk5:'J-237-2025 § 5', skq:'J-237-2025 §§ 3 og 4', sk7:'Høstingsforskriften § 28', f28:'Høstingsforskriften § 28', f66:'Høstingsforskriften § 66', f29:'Høstingsforskriften § 29 og vedlegg 3f', f18s:'Høstingsforskriften § 18', f25:'Høstingsforskriften § 25', f47s:'Høstingsforskriften §§ 46 og 47', f51s:'Høstingsforskriften § 51', sv58:'Høstingsforskriften § 58', vme:'Forskrift om sårbare marine økosystemer', vmen:'Forskrift om sårbare marine økosystemer'};
// ---- the check at sea aboard an ocean vessel (H2e of docs/planer/havsteget-h2-autoline.md, 06.11.2026): the inspectors come over by the
// ship's boat while she lies off, and look at the position of the gear against høstingsforskriften § 26 and J-187-2026 § 32 along the whole
// line, the marking (§§ 66 and 68), the catch against the vessel quota (J-187-2026 § 14: no bycatch of cod or haddock beyond it), the
// bycatch of saithe (§ 14: 25 % in each catch and of the landed catch), ling and tusk (J-128-2026 and the proposal for 2027: 35 % ling,
// 15 % tusk after the stop), and a sample of the last catch for the minimum sizes (§ 47) and the admixture (§ 49). The texts of §§ 47,
// 49, 50, 51, 66 and 68 were read on Lovdata 06.11.2026 (last amended FOR-2026-10-02-1999); § 14 in J-187-2026 on fiskeridir.no.
const KVH = {visitMin:90, side:0.18, gapMin:30, step:1.0, minFish:20, minHaul:100, keep:3};
const KVRIB = [['ned', 2], ['ut', 6], ['side', 74], ['inn', 6], ['opp', 2]];
// the RIB's stage min minutes into the check: {ph, f} (f the stage's own 0..1); 'davit' before and after; pure, for tests/unit
function kvRib(min){ if (!(min >= 0)) return {ph:'davit', f:0}; let a = 0; for (const [ph, d] of KVRIB){ if (min < a + d) return {ph, f:(min - a) / d}; a += d; } return {ph:'davit', f:1}; }
// § 47 and the length–weight curve are the fishing's own (MIN47, min47Cm, lwKg and minKgAt in 02-species-gear.js, steg 59, 10.11.2026), so
// the sample measures by the same minimum sizes the catch is sorted by. The species sampled are the ones § 49 counts (kvMix); ling and
// tusk have none, and the halibut and the redfish are not in the admixture rules the sample is for
const KV47 = {torsk:MIN47.torsk, hyse:MIN47.hyse, sei:MIN47.sei, blakveite:MIN47.blakveite};
const kvCmKg = lwKg;
const kvMinCm = min47Cm;
// one fish as it comes up, counted in the haul's sample (10-gear.js landFish): [measured, under the minimum size] per species, with the
// minimum for the place where the gear stood worked out once per haul
function kvSampleFish(g, sp, w, p){ const mk = g.msK || (g.msK = {}); if (mk[sp] == null) mk[sp] = minKgAt(sp, p);
  const m = g.ms || (g.ms = {}), r = m[sp] || (m[sp] = [0, 0]); r[0]++; if (w < mk[sp]) r[1]++; }
// a haul done (or stopped) is a catch of its own: its sample and its kilos by species, the last few kept for the coast guard
// (H3e) a snow crab haul keeps its sorting (landSno's tally, 10d-snokrabbe.js) for the sample of §§ 47 and 51 and J-237-2025 § 5
function kvHaulKeep(g, s){ if (!g || !(g.spKg || g.ms || g.snoS)) return; const L = S.kvHaul || (S.kvHaul = []), m = setMid(s), so = g.snoS;
  L.unshift({t:S.t, vid:S.cur, x:+m.x.toFixed(3), y:+m.y.toFixed(3), kind:s.kind, lk:s.lk || null, ms:g.ms || {}, kg:g.spKg || (so ? {snokrabbe:so.kg || 0} : {}), sno:so ? kvSnoTally(so) : undefined}); while (L.length > KVH.keep) L.pop(); }
const kvSnoTally = so => ({n:so.n || 0, kept:so.kept || 0, rel:so.rel || 0, small:so.small || 0, fem:so.fem || 0, soft:so.soft || 0, dead:so.dead || 0, uk:so.uk || 0, ro:so.ro || 0, rd:so.rd || 0});
// § 49: the share under the minimum size allowed in number in each catch. North of 62° N: 15 % of cod, haddock and saithe together with
// trawl and conventional gear (fourth paragraph), 20 % when fishing haddock by line in statistics area 03 (fifth), 20 % cod when fishing
// cod with jig and line within 4 nm of the baseline (seventh: «er det tillat å ha til sammen 20 % torsk under minstemål i antall i de
// enkelte fangster»; read on Lovdata 10.11.2026; the haddock and saithe then by the fourth on their own, an interpretation: the text does
// not say whether the cod under the seventh still counts in the fourth's 15 % of the three together), 15 % Greenland halibut (ninth); elsewhere
// 10 % of each species (first). Returns the worst against its limit, or null with too few fish to say
function kvMix(ms, p, gear, most){
  const n62 = LL(p).lat >= 62, c3 = ['torsk', 'hyse', 'sei'], out = [], cnt = sp => (ms[sp] || [0, 0]);
  const j7 = n62 && (gear === 'juksa' || gear === 'line') && most === 'torsk' && blNm(p) < 4;
  if (j7){ const c = cnt('torsk'), hs = ['hyse', 'sei'], n = hs.reduce((a, sp) => a + cnt(sp)[0], 0), u = hs.reduce((a, sp) => a + cnt(sp)[1], 0);
    if (c[0]) out.push({sp:'torsk', n:c[0], u:c[1], lim:0.20, led:'sjuende'}); if (n) out.push({sp:'hysei', n, u, lim:0.15, led:'fjerde'}); }
  if (n62){ const n = c3.reduce((a, sp) => a + cnt(sp)[0], 0), u = c3.reduce((a, sp) => a + cnt(sp)[1], 0), lim = gear === 'line' && most === 'hyse' && ruHom(p) === '03' ? 0.20 : 0.15;
    if (n && !j7) out.push({sp:'thsei', n, u, lim, led:lim === 0.20 ? 'femte' : 'fjerde'});
    const b = cnt('blakveite'); if (b[0]) out.push({sp:'blakveite', n:b[0], u:b[1], lim:0.15, led:'niende'}); }
  else for (const sp of c3.concat('blakveite')){ const r = cnt(sp); if (r[0]) out.push({sp, n:r[0], u:r[1], lim:0.10, led:'første'}); }
  const all = out.reduce((a, o) => a + o.n, 0); if (all < KVH.minFish) return all ? {few:true, n:all} : null;
  for (const o of out) o.pct = o.u / o.n;
  return out.sort((a, b) => (b.pct - b.lim) - (a.pct - a.lim))[0];
}
// is the boat you follow an ocean vessel (a permit from the ocean register on her)
const kvHav = () => !!(S.lic && S.lic.hav);
// the points along a string the inspectors check the position at: both ends and about every kilometre between (a 6.5 km lenke may have
// one end inside a line its middle is outside)
function kvAlong(a, b){ const d = dist(a, b), n = Math.max(1, Math.ceil(d / KVH.step)), out = []; for (let i = 0; i <= n; i++) out.push({x:a.x + (b.x - a.x) * i / n, y:a.y + (b.y - a.y) * i / n}); return out; }
const kvJoin = (a, and) => a.length > 1 ? a.slice(0, -1).join(', ') + ' ' + and + ' ' + a[a.length - 1] : a[0];
const kvAt = p => typeof coordStr === 'function' ? coordStr(p) : (q => q.lat.toFixed(3) + '° N ' + q.lon.toFixed(3) + '° Ø')(LL(p));
// § 68 for one string outside the baselines: an end buoy with a pole at each end (two flags and two lights in the west, one of each in
// the east), the buoys at most one nautical mile apart, so a string longer than that has buoys between; all of them carry the
// registration mark (§ 66). The autoline system's poles and buoys (5.66 and 5.67 in docs/systemer/redskap.md) are made so: counted here
function kvMarks(s){ const km = s.kind === 'line' && isAuto(s.lk) ? lineKm('auto', s.hooks || 0) : dist(s.a, s.b) / gridScale(setMid(s)); return {ends:2, mid:Math.max(0, Math.ceil(km / 1.852) - 1), km}; }
function kvHavCheck(b, sets, H, len, add, most){
  const R = {pts:0, ends:0, mid:0, sample:null, haulKg:0, reg:null}, f = fmtC, nm = p => f(blNm(p), 1), isSno = s => s.kind === 'teine' && !!(POTS[s.pot] || {}).sno;
  const SNO = sets.some(isSno) || (b.gop && b.gop.sno) || (typeof snoVessel === 'function' && snoVessel());
  // the position: every point along each string against the blocking rules for line with a baiting machine; the set going out now as far as it has gone
  // (H3e) a snow crab string is asked for the snow crab's own rules along it (J-237-2025 §§ 1 and 5: the shelf, 12 nm, the close season;
  // § 58 and the vulnerable ecosystems at Svalbard), the pots in the sea counted for the close season
  const lines = sets.map(s => ({a:s.a, b:s.b, gear:s.kind === 'teine' ? 'teiner' : s.kind, egn:s.kind === 'line' && isAuto(s.lk), sno:isSno(s)}));
  if (b.gop && b.gop.op === 'set' && b.gop.a) lines.push({a:b.gop.a, b:{...b.pos}, gear:b.gop.kind === 'teine' ? 'teiner' : b.gop.kind, egn:!!b.gop.auto, sno:!!b.gop.sno});
  // the remark says where: with the distance from the baseline for the rules that are distances from it, the place alone for the areas
  const WD = /^(f26|f26b|j32c|j32b|sk1)$/, WP = /^(sk2|sv58|vme|vmen)$/;
  for (const L of lines) for (const p of kvAlong(L.a, L.b)){ R.pts++; let r = null; try { r = rulesAt({p, H, len, gear:L.gear, sp:L.sno ? 'snokrabbe' : most, egn:L.egn}); } catch (e){}
    if (r) for (const it of r.items) if (it.block && it.v === 'no'){ const d = WD.test(it.k), w = d || WP.test(it.k), at = (L.sno ? ' Lenka ved ' : ' Lina ved ') + kvAt(p), atEn = (L.sno ? ' The string at ' : ' The line at ') + kvAt(p);
      const where = at + (d ? ' står ' + nm(p) + ' nm fra grunnlinja.' : '.'), whereEn = atEn + (d ? ' is ' + nm(p) + ' nm from the baseline.' : '.');
      add(it.k, it.no + (w ? where : ''), it.en + (w ? whereEn : ''), it.ref, it.url); } }
  // the marking: counted for what is said (the poles and buoys come with the system, and every buoy carries the mark)
  for (const s of sets){ const m = kvMarks(s); R.ends += m.ends; R.mid += m.mid; }
  try { const rg = regOf(b); R.reg = rg && rg.f ? rg.f + '-' + rg.n + '-' + rg.k : null; } catch (e){}
  if (SNO){ R.sno = kvSnoCheck(b, sets.filter(isSno), H, add); return R; }   // a snow crab vessel: no fish quota, bycatch or § 49 to ask about
  // the catch against the vessel quota: cod and haddock aboard with what is landed this year, no bycatch beyond it (§ 14 third paragraph)
  const kgOf = sp => (S.hold || []).filter(x => x.sp === sp).reduce((a, x) => a + x.kg, 0), tot = (S.hold || []).reduce((a, x) => a + x.kg, 0), q = quotaState();
  let LQ = null; try { LQ = licQ(S.lic, H); } catch (e){}
  if (LQ){ const hq = Array.isArray(LQ.hyse) ? LQ.hyse[0] : LQ.hyse, over = (q.hyse || 0) + kgOf('hyse') - hq;
    if (isFinite(hq) && kgOf('hyse') > 0 && over > 0.5) add('kvoteh', 'Hysa om bord fyller mer enn det som er igjen av fartøykvoten, ' + f(over, 0) + ' kg over. Det er ikke adgang til bifangst av torsk eller hyse ut over fartøykvotene; det overskytende blir inndratt ved levering.', 'The haddock aboard fills more than what is left of the vessel quota, ' + f(over, 0) + ' kg over. There is no bycatch of cod or haddock beyond the vessel quotas; the excess is confiscated at the landing.', 'J-187-2026 § 14', RU_J187); }
  // the bycatch: saithe (no gillnet-saithe permit in the game), ling and tusk, in the last catch and in what is aboard
  const K0 = (S.kvHaul || []).find(h => h.vid === S.cur && S.t - h.t < 48 * 60), G = b.gop && b.gop.op === 'haul' && b.gop.spKg ? b.gop : null;
  const haul = G ? {kg:G.spKg, ms:G.ms || {}, p:b.pos, now:true} : K0 ? {kg:K0.kg, ms:K0.ms, p:{x:K0.x, y:K0.y}, t:K0.t} : null;
  const hTot = haul ? Object.values(haul.kg).reduce((a, v) => a + v, 0) : 0; R.haulKg = hTot;
  const BY = [['sei', HAVBY.sei, 'seiby', 'Sei', 'Saithe', 'J-187-2026 § 14', RU_J187], ['lange', lbShare('lange', H), 'lby', 'Lange', 'Ling', 'J-128-2026 §§ 6 og 9', 'https://www.fiskeridir.no/yrkesfiske/j-meldinger/j-128-2026'], ['brosme', lbShare('brosme', H), 'bby', 'Brosme', 'Tusk', 'J-128-2026 §§ 6 og 9', 'https://www.fiskeridir.no/yrkesfiske/j-meldinger/j-128-2026']];
  for (const [sp, lim, k, no, en, ref, url] of BY){ if (sp !== 'sei' && !(len >= 28)) continue; if (!(lim < 1)) continue;
    const hs = hTot >= KVH.minHaul ? (haul.kg[sp] || 0) / hTot : 0, ds = tot > 0 ? kgOf(sp) / tot : 0, pct = v => f(v * 100, 0) + ' %', lp = f(lim * 100, 0) + ' %';
    if (hs > lim + 0.005) add(k, no + ' var ' + pct(hs) + ' av ' + (haul.now ? 'fangsten som dras nå' : 'siste fangst') + ' (' + f(haul.kg[sp], 0) + ' av ' + f(hTot, 0) + ' kg); høyst ' + lp + ' er lov som bifangst i de enkelte fangster. Flytt til et felt med mindre ' + no.toLowerCase() + '.', en + ' was ' + pct(hs) + ' of ' + (haul.now ? 'the catch being hauled' : 'the last catch') + ' (' + f(haul.kg[sp], 0) + ' of ' + f(hTot, 0) + ' kg); at most ' + lp + ' is allowed as bycatch in each catch. Move to a ground with less ' + en.toLowerCase() + '.', ref, url);
    else if (ds > lim + 0.005) add(k, no + ' er ' + pct(ds) + ' av fangsten om bord (' + f(kgOf(sp), 0) + ' av ' + f(tot, 0) + ' kg); høyst ' + lp + ' er lov som bifangst ved landing. Det som er over, blir inndratt ved levering.', en + ' is ' + pct(ds) + ' of the catch aboard (' + f(kgOf(sp), 0) + ' of ' + f(tot, 0) + ' kg); at most ' + lp + ' is allowed as bycatch at the landing. What is over is confiscated at the landing.', ref, url); }
  // the sample of the last catch: the minimum sizes (§ 47) and the admixture under them (§ 49). Over the limit: move; the Directorate may
  // close the ground (§ 50 a). Within it, what is under the minimum size is lawful catch (live fish may be let go, the dead are landed, § 51)
  if (haul){ const m = kvMix(haul.ms, haul.p, sets.length ? sets[0].kind : 'line', most); R.sample = m;
    if (m && !m.few && m.pct > m.lim + 1e-9){ const what = m.sp === 'thsei' ? 'torsk, hyse og sei' : m.sp === 'hysei' ? 'hyse og sei' : SPECIES[m.sp].no.toLowerCase(), whatEn = m.sp === 'thsei' ? 'cod, haddock and saithe' : m.sp === 'hysei' ? 'haddock and saithe' : SPECIES[m.sp].en.toLowerCase(), cm = m.sp === 'thsei' ? 'torsk ' + kvMinCm('torsk', haul.p) + ', hyse ' + kvMinCm('hyse', haul.p) + ' og sei ' + kvMinCm('sei', haul.p) + ' cm' : m.sp === 'hysei' ? 'hyse ' + kvMinCm('hyse', haul.p) + ' og sei ' + kvMinCm('sei', haul.p) + ' cm' : kvMinCm(m.sp, haul.p) + ' cm';
      add('f49', 'I stikkprøven av ' + (haul.now ? 'fangsten som dras nå' : 'siste fangst') + ' var ' + m.u + ' av ' + m.n + ' ' + what + ' under minstemålet (' + cm + '), ' + f(m.pct * 100, 0) + ' % i antall; høyst ' + f(m.lim * 100, 0) + ' % er lov i de enkelte fangster. Skift felt; Fiskeridirektoratet kan stenge feltet (§ 50).', 'In the sample of ' + (haul.now ? 'the catch being hauled' : 'the last catch') + ' ' + m.u + ' of ' + m.n + ' ' + whatEn + ' were under the minimum size (' + cm + '), ' + f(m.pct * 100, 0) + ' % in number; at most ' + f(m.lim * 100, 0) + ' % is allowed in each catch. Change ground; the Directorate may close the ground (§ 50).', 'Høstingsforskriften §§ 47 og 49 ' + m.led + ' ledd', RU_HF); } }
  return R;
}
// ---- (H3e of docs/planer/havsteget-h3-snokrabbe.md, 10.11.2026) the check at sea aboard the snow crab vessel. Beside the position along
// each string (kvHavCheck, above) the inspectors look at: the pots in the sea against the cap (høstingsforskriften § 28 tredje ledd:
// «Hvert fartøy kan fangste med maksimalt 8 000 teiner»), the marking (§ 66 tredje ledd: «tydelig merket med fartøyets
// registreringsmerke») and the escape hole closed with cotton thread (§ 29 tredje ledd and vedlegg 3f), the tending and the position
// reports (§ 18: «røktes minst én gang hver tredje uke»; § 25 annet ledd b: «rapporteres minst en gang hver tredje uke etter setting»),
// the crab aboard against the vessel quota and the extra quota for live crab (J-237-2025 §§ 3 and 4; what the landing would confiscate,
// snoLandQ in 10e-krabbefabrikk.js), and a sample of the last haul: no live crab under 9.5 cm over the widest part of the shell kept
// (§§ 46 and 47), all over the minimum size and every dead crab kept (§ 51), and the soft crab (J-237-2025 § 5: «Ved mer enn 20 %
// innblanding av bløtkrabbe i de enkelte fangster, skal fangstingen stoppes og fartøyet skal skifte fangstfelt»; a string set on the same
// field after such a haul is the remark). J-237-2025 read in full on fiskeridir.no 10.11.2026; the paragraphs of høstingsforskriften as the
// plan read them on Lovdata 06.11.2026 (kap. 2; last amended FOR-2026-10-02-1999, seen 10.11.2026). The game's own sorting (landSno) keeps
// and releases by these rules, so uk, ro and rd (kept under the size, released over it, released dead) are 0 until the sorting is the
// crew's or the player's; the check counts them all the same
const KVS_U = 'https://www.fiskeridir.no/yrkesfiske/j-meldinger/j-237-2025';
function kvSnoCheck(b, ss, H, add){
  const f = fmtC, R = {lenker:ss.length, pots:ss.reduce((a, s) => a + (s.n || 0), 0), max:SNOC.max, mark:0, hole:0, oldD:0, posD:0, q:null, sample:null};
  const g = b.gop && b.gop.sno ? b.gop : null;
  if (g && g.op === 'set' && g.s && !ss.includes(g.s)) R.pots += g.done || 0;   // the string going out now, as far as it has gone
  // § 28: the cap (the setting refuses to go over it, 10-gear.js gearRules; asked here all the same)
  if (R.pots > SNOC.max) add('f28', 'Fartøyet har ' + f(R.pots, 0) + ' snøkrabbeteiner i sjøen; høyst ' + f(SNOC.max, 0) + ' er lov per fartøy.', 'The vessel has ' + f(R.pots, 0) + ' snow crab pots in the sea; at most ' + f(SNOC.max, 0) + ' are allowed a vessel.', 'Høstingsforskriften § 28', RU_HF);
  // § 66 and § 29 with vedlegg 3f: every pot marked with the registration mark, and the escape hole closed with cotton thread
  const cnt = (pot, n) => { const P = POTS[pot] || {}; if (P.mark) R.mark += n; if (P.hole) R.hole += n; };
  for (const s of ss) cnt(s.pot, s.n || 0);
  if (g && g.op === 'set' && g.s && !ss.includes(g.s)) cnt(g.s.pot, g.done || 0);
  if (R.mark < R.pots) add('f66', 'Ikke alle snøkrabbeteinene er merket med fartøyets registreringsmerke.', 'Not all the snow crab pots carry the vessel\'s registration mark.', 'Høstingsforskriften § 66', RU_HF);
  if (R.hole < R.pots) add('f29', 'Ikke alle snøkrabbeteinene har rømmingshull lukket med bomullstråd.', 'Not all the snow crab pots have an escape hole closed with cotton thread.', 'Høstingsforskriften § 29 og vedlegg 3f', RU_HF);
  // §§ 18 and 25: the string that has stood longest untended, and the oldest position report (the catch log reports it, snoTend)
  let sa = null, sr = null;
  for (const s of ss){ const a = (S.t - s.tSet) / 1440, r = (S.t - (s.posRep || s.tSet)) / 1440; if (a > R.oldD){ R.oldD = a; sa = s; } if (r > R.posD){ R.posD = r; sr = s; } }
  if (sa && R.oldD * 24 > SNOC.tendH) add('f18s', 'Lenka ved ' + kvAt(setMid(sa)) + ' har stått i ' + f(R.oldD, 0) + ' døgn uten røkting; snøkrabbeteiner skal røktes minst én gang hver tredje uke, av fartøyet selv.', 'The string at ' + kvAt(setMid(sa)) + ' has stood for ' + f(R.oldD, 0) + ' days untended; snow crab pots must be tended at least once every third week, by the vessel itself.', 'Høstingsforskriften § 18', RU_HF);
  if (sr && R.posD * 24 > SNOC.posH) add('f25', 'Posisjonen for lenka ved ' + kvAt(setMid(sr)) + ' er ikke rapportert på ' + f(R.posD, 0) + ' døgn; den skal rapporteres minst hver tredje uke etter setting.', 'The position of the string at ' + kvAt(setMid(sr)) + ' has not been reported for ' + f(R.posD, 0) + ' days; it must be reported at least every third week after setting.', 'Høstingsforskriften § 25', RU_HF);
  // the vessel quota and the extra quota: the crab aboard against what is left (the live crab first on the extra quota, J-237-2025 § 4)
  try { const q = quotaState(), Q = snoQuota(H), L = snoLandQ(H, q), Y = snoYear(yearH(H)), ref = Y.y <= 2026 ? 'J-237-2025 §§ 3 og 4' : Y.known ? Y.src : 'Spillets bestand etter ' + Math.max(...Object.keys(SNOREG).map(Number));
    if (Q){ R.q = {aboard:L.all, live:L.live, used:q.snokrabbe || 0, base:Q.base + Q.flex, max:Q.max, usedT:q.snoTq || 0, extra:Q.extra, conf:L.conf, ref};
      if (L.conf > 0.5) add('skq', 'Snøkrabben om bord fyller mer enn det som er igjen av fartøykvoten og tilleggskvoten, ' + f(L.conf, 0) + ' kg over. Kvantumet kan ikke overføres til et annet fartøy; det overskytende blir inndratt ved levering.', 'The snow crab aboard fills more than what is left of the vessel quota and the extra quota, ' + f(L.conf, 0) + ' kg over. The quantity cannot be transferred to another vessel; the excess is confiscated at the landing.', ref, KVS_U); } } catch (e){}
  // the sample of the last haul (or the one being hauled): the sorting against §§ 46, 47 and 51, and the soft crab against § 5
  const K0 = (S.kvHaul || []).find(h => h.vid === S.cur && h.sno && S.t - h.t < 48 * 60), now = g && g.op === 'haul' && g.snoS && g.snoS.n ? kvSnoTally(g.snoS) : null;
  const so = now || (K0 && K0.sno), th = now ? 'trekket som pågår' : 'siste trekk', te = now ? 'the haul under way' : 'the last haul';
  if (so && so.n){ R.sample = {...so, now:!!now, pct:so.kept ? so.soft / so.kept : 0};
    if (so.uk > 0) add('f47s', 'I stikkprøven av ' + th + ' var ' + f(so.uk, 0) + ' av ' + f(so.kept, 0) + ' beholdte krabber levende og under minstemålet (9,5 cm over skallets største bredde). Snøkrabbe under minstemålet settes ut levende.', 'In the sample of ' + te + ' ' + f(so.uk, 0) + ' of ' + f(so.kept, 0) + ' crabs kept were alive and under the minimum size (9.5 cm over the widest part of the shell). Snow crab under the minimum size is put back alive.', 'Høstingsforskriften §§ 46 og 47', RU_HF);
    if (so.ro > 0 || so.rd > 0) add('f51s', 'Av ' + th + ' er ' + (so.ro ? f(so.ro, 0) + ' krabber over minstemålet' : '') + (so.ro && so.rd ? ' og ' : '') + (so.rd ? f(so.rd, 0) + ' døde krabber' : '') + ' satt ut. All snøkrabbe over minstemålet og død krabbe skal føres i land.', 'Of ' + te + ' ' + (so.ro ? f(so.ro, 0) + ' crabs over the minimum size' : '') + (so.ro && so.rd ? ' and ' : '') + (so.rd ? f(so.rd, 0) + ' dead crabs' : '') + ' were put back. All snow crab over the minimum size and dead crab must be landed.', 'Høstingsforskriften § 51', RU_HF);
  }
  // over 20 % soft crab in a haul (snoHaulDone keeps the field and the time, S.snoSoft, for softDays): a string set on that field (the same
  // location of the landing notes, lokOfCell) after that haul, or being set there now, is the remark
  const q5 = S.snoSoft;
  if (q5 && q5.l >= 0 && S.t - q5.t <= SNOC.softDays * 1440){ const lok = p => { try { return lokOfCell(p).l; } catch (e){ return -1; } };
    const after = ss.filter(s => s.tSet > q5.t && lok(setMid(s)) === q5.l);
    if (g && g.op === 'set' && g.a && !after.includes(g.s) && lok(g.a) === q5.l) after.push(g.s || {});
    if (after.length) add('sk5', 'Et trekk på feltet hadde ' + q5.pct + ' % bløtkrabbe. Over 20 % skal fangstingen stoppes og fartøyet skifte fangstfelt, men ' + (after.length === 1 ? 'én lenke' : after.length + ' lenker') + ' er satt på samme felt etterpå.', 'A haul on the field had ' + q5.pct + '% soft crab. Over 20% the fishing stops and the vessel changes field, but ' + (after.length === 1 ? 'one string has' : after.length + ' strings have') + ' been set on the same field since.', 'J-237-2025 § 5', KVS_U); }
  return R;
}
function kvState(){ const K = S.kv || (S.kv = {n:0, nOk:0, last:0, ok:null, wk:-1, at:null, visit:null, log:[]}); K.log = K.log || []; return K; }
// the first week is the player's own (the first landings, the first mission), the gale is nobody's time for a boarding, and a boat
// aground or in tow has the rescue service alongside already. She comes to the boat you follow, lying at the quay, fishing or idle
function kvReady(){
  const b = S.boat, T = typeof turState === 'function' ? turState() : S.turer; if (!b || !b.pos) return false;
  if (typeof tutOn === 'function' && tutOn()) return false;
  if ((S.landN || 0) < KV.minLand || !(T && (T.done.length || (S.landN || 0) >= KV.minLand + 2))) return false;
  if (!['port', 'fishing', 'idle'].includes(b.status)) return false;
  let W = 0; try { W = windAt(S.t / 60, b.pos); } catch (e){}
  return W < KV.gale;
}
// the week's roll: once when a new game week begins, a check is set at a random hour of it, with a smaller chance within two weeks of a
// clean one. The hour that comes with the boat ready fires it; a week that passes without (the game closed, a gale, the first week) lapses
function kvHour(){
  const K = kvState(), wk = weekOf(S.t / 60);
  if (K.wk !== wk){ K.wk = wk; K.at = null; const rec = K.ok === true && S.t - K.last < KV.okFor; if (Math.random() < (rec ? KV.pAfterOk : KV.p)) K.at = wk * 168 * 60 + Math.floor(Math.random() * 168) * 60; }
  if (K.at != null && S.t >= K.at && !K.visit && kvReady()){ K.at = null; try { kvArrive(); } catch (e){ console.warn('kv', e); } }
}
// she calls on the VHF and comes alongside; the boat goes on with what it does (no made-up waiting: the check takes the half hour it takes)
// at sea aboard an ocean vessel she lies off and sends the inspectors over in the ship's boat, and the check takes longer (the catch, the
// sample, the marking along the line; 90 minutes, assumed); the vessel goes on working meanwhile
function kvArrive(){
  const b = S.boat, K = kvState(), sea = kvHav() && b.status !== 'port'; K.visit = {t0:S.t, hav:sea || null}; const q = kvPose(b); K.visit.p = q.p; K.visit.hd = q.hd;
  const nm = S.boatName || 'Havbris';
  if (sea) log('Kystvakta på VHF: «' + nm + '», dette er Kystvakta. Vi ligger av babord og setter over inspektører i lettbåten for kontroll. Fortsett arbeidet.', 'The coast guard on the VHF: «' + nm + '», this is the coast guard. We are lying off and sending inspectors over in the boat for an inspection. Carry on working.', 'nav');
  else log('Kystvakta på VHF: «' + nm + '», dette er Kystvakta. Vi kommer langs siden for kontroll.', 'The coast guard on the VHF: «' + nm + '», this is the coast guard. We are coming alongside for an inspection.', 'nav');
  if (typeof toast === 'function') toast(sea ? gL('Kystvakta setter over inspektører for kontroll.', 'The coast guard is sending inspectors over.') : gL('Kystvakta kommer langs siden for kontroll.', 'The coast guard is coming alongside for an inspection.'));
  if (typeof hooks !== 'undefined' && hooks.onNpcChange) try { hooks.onNpcChange(); } catch (e){}
}
// which ship comes: the 93 m one to an ocean vessel at sea, else the 47 m one
const kvShip = hav => hav ? KVS.hav : KVS.kyst;
// her centre's distance across from the boat's (km, + to starboard, as kvPose lays it out): at the quay rafted on her port side (the quay
// is to her starboard, berthPose), along the coast off her starboard side, both with the two half-beams and the gap between; at sea aboard
// an ocean vessel off her port side, KVH.side or more (never closer than KVH.gapMin of clear water); pure, for tests/unit
function kvOff(bB, sh, where){
  const half = (bB || 4) / 2 + sh.B / 2;
  if (where === 'hav') return -Math.max(KVH.side, (half + KVH.gapMin) / 1000);
  return where === 'kai' ? -(half + KV.gap.kai) / 1000 : (half + KV.gap.sjo) / 1000;
}
// her place and heading, following the boat: at the quay alongside the boat where she lies (berthPose: the boat's place in the 3D view,
// not the harbour's point that b.pos is at the quay), moved out a metre at a time while her hull would stand on land, on a pier or in a
// harbour unit (up to 40 m)
function kvPose(b){
  const V = S.kv && S.kv.visit, hav = !!(V && V.hav), sh = kvShip(hav), bB = (VESSELS[b.type] || {}).beam || 4;
  let c = b.pos, hd = b.heading || 0, where = hav ? 'hav' : 'sjo', qs = 1;
  if (!hav && b.status === 'port' && b.port && typeof berthPose === 'function'){
    let bp = null; try { bp = berthPose(b.port, b.type, typeof berthKind === 'function' ? berthKind(b) : 'main') || berthPose(b.port, b.type); } catch (e){ bp = null; }
    if (bp){ c = {x:bp.x, y:bp.y}; hd = bp.hd; where = 'kai'; if (bp.side < 0) qs = -1; }
  }
  // (a boat lying with her port side to the quay, F22 OB4: the ship is rafted on her starboard side, the one away from the quay)
  const d0 = kvOff(bB, sh, where) * qs, sg = d0 < 0 ? -1 : 1, at = d => ({x:c.x + Math.cos(hd) * d, y:c.y + Math.sin(hd) * d});
  const fx = Math.sin(hd), fy = -Math.cos(hd), rx = Math.cos(hd), ry = Math.sin(hd), hl = sh.L / 2000, hb = sh.B / 2000;
  const blocked = p => { for (const [u, w] of [[1, 1], [1, -1], [-1, 1], [-1, -1], [0, 1], [0, -1], [0.5, 1], [-0.5, 1]]){ const q = {x:p.x + fx * hl * u + rx * hb * w, y:p.y + fy * hl * u + ry * hb * w};
    if (typeof berthBlocked === 'function' ? berthBlocked(q, 0) : isLand(q)) return true; } return false; };
  // out a metre at a time (at sea ten, up to 300 m more, and then the other side); a map block not in yet counts as blocked
  const step = where === 'hav' ? 0.01 : 0.001, n = where === 'hav' ? 30 : 40;
  for (const s of where === 'hav' ? [sg, -sg] : [sg]) for (let k = 0; k <= n; k++){ const p = at((s === sg ? d0 : -d0) + s * k * step); let bad = true; try { bad = blocked(p); } catch (e){ bad = true; } if (!bad) return {p, hd}; }
  return {p:at(d0), hd};
}
// the key of what her place depends on (the boat's harbour, berth and type, or her position and heading at sea): kvMinute works her
// place out again only when it changes (at the quay that is once, not every game minute)
const kvKey = b => b.status === 'port' ? 'p|' + b.port + '|' + b.type + '|' + (typeof berthKind === 'function' ? berthKind(b) : '') : 's|' + b.pos.x.toFixed(4) + '|' + b.pos.y.toFixed(4) + '|' + (b.heading || 0).toFixed(3) + '|' + b.type;
function kvSide(b){ return kvPose(b).p; }
function kvMinute(){
  const K = S.kv; if (!K || !K.visit) return; const b = S.boat, v = K.visit;
  // (a check at sea goes on if the vessel comes into harbour: the ship stays where she lay outside, the inspectors finish by the boat)
  const k = kvKey(b); if (k !== v.key && !(v.hav && b.status === 'port')){ const q = kvPose(b); v.p = q.p; v.hd = q.hd; v.key = k; }
  v.v = v.hav && b.status === 'port' ? 0 : b.status === 'sailing' ? b.v || 0 : 0;
  if (S.t - v.t0 >= (v.hav ? KVH.visitMin : KV.visitMin)) try { kvFinish(); } catch (e){ console.warn('kv', e); K.visit = null; }
}
// the coast guard's ship on the chart and in 3D while she lies alongside (05-vessels.js npcStates)
// her own model (vtype: tools/boats/kv.py), length and beam; at sea her RIB's clock (rib.t0, kvRib)
function kvNpcs(){ const K = S.kv; if (!K || !K.visit) return []; const v = K.visit, sh = kvShip(v.hav);
  return [{id:'kv', name:'Kystvakta', type:'kyst', vtype:sh.t, p:v.p, hd:v.hd, cog:v.hd, v:Math.round((v.v || 0) * 10) / 10, st:v.v > 0.5 ? 'sailing' : 'idle', coast:true, kv:true, L:sh.L, B:sh.B, liv:1,
    rib:v.hav && sh.rib ? {t0:v.t0, L:sh.rib.L, B:sh.rib.B} : null}]; }
// the sums of gear in the sea where a predicate holds (§ 33 and § 33a inside the fjord lines); pure, for tests/unit
function kvSums(sets, inside){ let nets = 0, hooks = 0; for (const s of sets || []){ if (!inside(s)) continue; if (s.kind === 'garn') nets += s.n || 0; else if (s.kind === 'line') hooks += s.hooks || 0; } return {nets, hooks}; }
// the species a set or the hold mostly holds (for the rules that ask what you fish for)
function kvMostSp(sets){ const kg = {}; for (const s of sets) for (const sp in (s.acc || {})) kg[sp] = (kg[sp] || 0) + ((s.acc[sp] || {}).kg || 0); for (const x of S.hold || []) kg[x.sp] = (kg[x.sp] || 0) + x.kg;
  let best = null; for (const sp in kg) if (kg[sp] > 0 && (!best || kg[sp] > kg[best])) best = sp; return best; }
// what she asks: the blocking rules of the place for every gear in the sea and the jig where the boat fishes, the nets and hooks inside
// the fjord lines, the bycatch without access, the cod beyond the quota, and gear that has stood past its tending. Returns the remarks with
// their sources, and what was looked at
function kvCheck(b){
  const H = S.t / 60, len = (typeof BOAT !== 'undefined' && BOAT.len) || 7, out = [], seen = {}, add = (k, no, en, ref, url) => { if (seen[k]) return; seen[k] = 1; out.push({k, no, en, ref, url}); };
  const sets = (S.sets || []).filter(s => s.vid === S.cur && !s.lost && s.a && s.b), hand = !(S.equip && S.equip.jukse > 0), most = kvMostSp(sets);
  const probe = (p, gear, sp) => { let r = null; try { r = rulesAt({p, H, len, gear, sp, hand}); } catch (e){} if (r) for (const it of r.items) if (it.block && it.v === 'no' && it.k !== 'skag') add(it.k, it.no, it.en, it.ref, it.url); };
  // an ocean vessel's gear is checked along the whole string (kvHavCheck, below); a coastal boat's at its middle, and the jig where she fishes
  const hav = kvHav();
  if (!hav){ for (const s of sets) probe(setMid(s), s.kind === 'teine' ? 'teiner' : s.kind, most);
    if (b.status === 'fishing') probe(b.pos, 'juksa', S.target === 'kveite' ? 'kveite' : most); }
  // § 33a and § 33: at most 80 nets in the cod fishery and 5 000 hooks a day inside the fjord lines (fjordLimits: no hook limit in the six Finnmark fjords in winter)
  const inF = s => { try { return insideFjord(setMid(s)); } catch (e){ return false; } }, sums = kvSums(sets, inF);
  if (sums.nets > KV.nets && (most === 'torsk' || !most)) add('f33a', 'Høyst 80 garn i fisket etter torsk innenfor fjordlinjene; dere har ' + sums.nets + ' i sjøen.', 'At most 80 nets in the cod fishery inside the fjord lines; you have ' + sums.nets + ' in the sea.', 'Høstingsforskriften § 33a', RU_HF);
  if (sums.hooks > KV.hooks && sets.some(s => s.kind === 'line' && inF(s) && (fjordLimits(setMid(s), H) || {}).hooks)) add('f33', 'Høyst 5 000 kroker per døgn på bunnline innenfor fjordlinjene; dere har ' + fmt(sums.hooks, 0) + ' i sjøen.', 'At most 5,000 hooks a day on bottom line inside the fjord lines; you have ' + fmt(sums.hooks, 0) + ' in the sea.', 'Høstingsforskriften § 33', RU_HF);
  // the catch aboard: cod, haddock and saithe without access are bycatch, at most 10 % of what is aboard (ui/08-actions.js takes the rest at the landing)
  const kgOf = sp => (S.hold || []).filter(x => x.sp === sp).reduce((a, x) => a + x.kg, 0), tot = (S.hold || []).reduce((a, x) => a + x.kg, 0), c3 = kgOf('torsk') + kgOf('hyse') + kgOf('sei');
  if (access() === 'none' && tot > 0 && c3 > BYCATCH.share * tot + 0.5) add('byc', 'Båten har ikke adgang til å fiske torsk, hyse og sei; de kan bare være bifangst, høyst 10 % av fangsten. Om bord er ' + fmt(c3, 0) + ' av ' + fmt(tot, 0) + ' kg. Det som er over, blir inndratt ved levering.', 'The boat has no access to fish cod, haddock and saithe; they can only be bycatch, at most 10% of the catch. Aboard are ' + fmt(c3, 0) + ' of ' + fmt(tot, 0) + ' kg. What is over is confiscated at the landing.', 'Deltakerforskriften, J-187-2026 § 32', RU_J187);
  // Ø10b: where cod may only be a bycatch (the Skagerrak outside the baseline, FOR-2025-12-19-2805 § 5: 5 % «i de enkelte fangster og ved
  // landing»): the share in the last catch (the spell on the place, S.fsess) and in what is aboard from there (b.byc). The ban itself
  // (skag) is not read off the hold: nobody fishes for cod in the game, the cod comes with the catch, and the share says how much
  { const fs = S.fsess, k = b.status === 'fishing' && fs && fs.zk >= 20 ? bycHere('juksa') : null, c = (b.byc || {}).skag, sh = RU_BYC.skag.share;
    const last = k === 'skag' && fs.zc > sh * fs.zk, ab = c && c.kg >= 20 && bycOver('skag', c) > 0.5;
    if (last || ab) add('skagby', 'Torsk kan bare være bifangst i Skagerrak utenfor grunnlinjen, høyst 5 % i hver fangst og ved landing. ' + (last ? 'Siste fangst har ' + fmt(fs.zc / fs.zk * 100, 0) + ' % torsk: flytt til et felt med mindre torsk. ' : '') + (ab ? 'Av ' + fmt(c.kg, 0) + ' kg tatt der om bord er ' + fmt(c.cod, 0) + ' kg torsk; det som er over 5 %, blir inndratt ved levering.' : ''),
      'Cod may only be a bycatch in the Skagerrak outside the baseline, at most 5% in each catch and at the landing. ' + (last ? 'The last catch has ' + fmt(fs.zc / fs.zk * 100, 0) + '% cod: move to a field with less cod. ' : '') + (ab ? 'Of ' + fmt(c.kg, 0) + ' kg taken there aboard, ' + fmt(c.cod, 0) + ' kg is cod; what is over 5% is confiscated at the landing.' : ''), RU_BYC.skag.ref, RU_BYC.skag.url); }
  // Ø10c: the cod aboard over a cap south of 62° N (FOR-2025-12-19-2805 § 4: 3 tonnes in the North Sea's open group, 3 tonnes with jig
  // under the exception in the Skagerrak; 03d-quota.js sorConf), asked as the quota north of 62° N is: what is over the cap and the
  // bycatch after it is confiscated at the landing. That cod is not asked about against the quota north of 62° N
  let sorCod = 0;
  if (kgOf('torsk') > 0){ let C = null; try { C = sorConf(b.byc, kgOf('torsk') - bycConf().kg, quotaState(), access()); } catch (e){}
    if (C){ sorCod = C.cod;
      if ((C.by.nsjo || 0) > 0.5) add('nsjo3', (access() === 'none' ? 'Båten har ikke adgang til å fiske torsk i Nordsjøen' : 'Fartøyet har fisket maksimalkvoten på 3 tonn torsk i Nordsjøen (åpen gruppe)') + ', og da kan torsk bare være bifangst, høyst 15 % i hver fangst og ved landing. ' + fmtC(C.by.nsjo, 0) + ' kg av torsken om bord er over og blir inndratt ved levering.', (access() === 'none' ? 'The vessel has no access to fish cod in the North Sea' : 'The vessel has fished the maximum quota of 3 tonnes of cod in the North Sea (the open group)') + ', and then cod may only be a bycatch, at most 15% in each catch and at the landing. ' + fmtC(C.by.nsjo, 0) + ' kg of the cod aboard is over and is confiscated at the landing.', SORQ.nsjo.ref, SORQ.nsjo.url);
      if ((C.by.skag4 || 0) > 0.5) add('skag3', 'Taket på 3 tonn torsk med juksa i Skagerrak utenfor grunnlinjen er nådd, og da kan torsk bare være bifangst, høyst 5 %. ' + fmtC(C.by.skag4, 0) + ' kg av torsken om bord er over og blir inndratt ved levering.', 'The cap of 3 tonnes of cod with jig in the Skagerrak outside the baseline is reached, and then cod may only be a bycatch, at most 5%. ' + fmtC(C.by.skag4, 0) + ' kg of the cod aboard is over and is confiscated at the landing.', SORQ.skag4.ref, SORQ.skag4.url); } }
  // the cod beyond what is left of the quota (the game warns of it once a day, 05-vessels.js; the landing confiscates it)
  if (access() !== 'none' && kgOf('torsk') - sorCod > 0.5){ let over = 0; try { const q = quotaState(); over = q.torsk + kgOf('torsk') - sorCod - codLimitNow(H); if (ffPct(H)) over = 0; } catch (e){}
    if (over > 0.5) add('kvote', 'Torsken om bord fyller mer enn det som er igjen av ' + (hav ? 'fartøykvoten' : 'kvoten') + ', ' + fmtC(over, 0) + ' kg over. ' + (hav ? 'Det er ikke adgang til bifangst av torsk eller hyse ut over fartøykvotene; det' : 'Det') + ' overskytende blir inndratt ved levering.', 'The cod aboard fills more than what is left of the ' + (hav ? 'vessel ' : '') + 'quota, ' + fmtC(over, 0) + ' kg over. ' + (hav ? 'There is no bycatch of cod or haddock beyond the vessel quotas; the' : 'The') + ' excess is confiscated at the landing.', hav ? 'J-187-2026 § 14' : 'J-187-2026, fartøykvoten', RU_J187); }
  // § 18: nets and line on the Greenland halibut grounds are tended every other day, for halibut and monkfish every fourth (10-gear.js reminds of it)
  for (const s of sets){ if (s.kind === 'teine') continue; const a = (S.t - s.tSet) / 60;
    if ((a >= 48 && s.depth > 300) || a >= 96){ add('f18', (s.kind === 'garn' ? 'Garna' : 'Lina') + ' ved ' + kvAt(setMid(s)) + ' har stått i ' + fmtC(a / 24, 0) + ' døgn uten røkting; faststående redskap skal røktes jevnlig, på blåkveitefeltene minst annenhver dag.', 'The ' + (s.kind === 'garn' ? 'nets' : 'line') + ' at ' + kvAt(setMid(s)) + ' have stood for ' + fmtC(a / 24, 0) + ' days untended; fixed gear is tended regularly, on the Greenland halibut grounds at least every other day.', 'Høstingsforskriften § 18', RU_HF); break; } }
  // aboard an ocean vessel: the position along the strings, the marking, the vessel quota for haddock, the bycatch and the sample (H2e)
  const HV = hav ? kvHavCheck(b, sets, H, len, add, most) : null;
  return {items:out, gear:[...new Set(sets.map(s => s.kind))].concat(b.status === 'fishing' && !hav ? ['juksa'] : []), nets:sums.nets, hooks:sums.hooks, tot, sets:sets.length, hav:HV,
    auto:sets.filter(s => s.kind === 'line' && isAuto(s.lk)).reduce((a, s) => a + (s.hooks || 0), 0)};
}
// the word in a few words: what was looked at
function kvWhat(r){
  const g = [], ge = [], fmt = fmtC, V = r.hav;
  if (V) return kvWhatHav(r);
  if (r.nets) { g.push(r.nets + ' garn'); ge.push(r.nets + ' nets'); }
  if (r.hooks) { g.push(fmt(r.hooks, 0) + ' kroker på line'); ge.push(fmt(r.hooks, 0) + ' hooks on line'); }
  if (r.gear.includes('teine')) { g.push('teinene'); ge.push('the pots'); }
  if (r.gear.includes('juksa')) { g.push('juksa'); ge.push('the jig'); }
  const no = (g.length ? 'redskapen i sjøen (' + g.join(', ') + '), ' : '') + 'fangsten om bord (' + fmt(r.tot, 0) + ' kg) og reglene for stedet';
  const en = (ge.length ? 'the gear in the sea (' + ge.join(', ') + '), ' : '') + 'the catch aboard (' + fmt(r.tot, 0) + ' kg) and the rules of the place';
  return [no, en];
}
// what the inspectors looked at aboard an ocean vessel, in a few words
function kvWhatHav(r){
  const V = r.hav, f = fmtC, no = [], en = [];
  if (V.sno) return kvWhatSno(r);
  if (r.sets){ no.push('posisjonen til ' + (r.sets === 1 ? 'lenka' : 'de ' + r.sets + ' lenkene') + ' i sjøen (' + f(r.auto || r.hooks, 0) + ' krok) mot § 26 og § 32 på ' + V.pts + ' punkter langs lina');
    en.push('the position of the ' + (r.sets === 1 ? 'string' : r.sets + ' strings') + ' in the sea (' + f(r.auto || r.hooks, 0) + ' hooks) against § 26 and § 32 at ' + V.pts + ' points along the line');
    no.push('merkingen (' + V.ends + ' bøyestenger med radarreflektor, flagg og gule lys, ' + V.mid + ' vak mellom dem' + (V.reg ? ', merket ' + V.reg : '') + ')');
    en.push('the marking (' + V.ends + ' pole buoys with radar reflector, flags and yellow lights, ' + V.mid + ' buoys between them' + (V.reg ? ', marked ' + V.reg : '') + ')'); }
  no.push('fangsten om bord (' + f(r.tot, 0) + ' kg) mot fartøykvoten og bifangsten av sei, lange og brosme'); en.push('the catch aboard (' + f(r.tot, 0) + ' kg) against the vessel quota and the bycatch of saithe, ling and tusk');
  const m = V.sample;
  if (m && !m.few){ no.push('en stikkprøve av siste fangst (' + m.n + ' fisk målt, ' + f(m.pct * 100, 0) + ' % under minstemålet)'); en.push('a sample of the last catch (' + m.n + ' fish measured, ' + f(m.pct * 100, 0) + ' % under the minimum size)'); }
  no.push('reglene for stedet'); en.push('the rules of the place');
  return [kvJoin(no, 'og'), kvJoin(en, 'and')];
}
// (H3e) what the inspectors looked at aboard the snow crab vessel
function kvWhatSno(r){
  const V = r.hav, Z = V.sno, f = fmtC, t = kg => f(kg / 1000, kg > 0 && kg < 1e5 ? 1 : 0), no = [], en = [];
  if (Z.lenker){ no.push('posisjonen til ' + (Z.lenker === 1 ? 'lenka' : 'de ' + Z.lenker + ' lenkene') + ' (' + f(Z.pots, 0) + ' teiner) mot sokkelen, 12 nm, § 58 og de sårbare områdene på ' + V.pts + ' punkter langs lenkene');
    en.push('the position of the ' + (Z.lenker === 1 ? 'string' : Z.lenker + ' strings') + ' (' + f(Z.pots, 0) + ' pots) against the shelf, 12 nm, § 58 and the vulnerable areas at ' + V.pts + ' points along the strings');
    no.push('taket på ' + f(Z.max, 0) + ' teiner'); en.push('the cap of ' + f(Z.max, 0) + ' pots');
    no.push('merkingen (' + (V.reg ? 'registreringsmerket ' + V.reg + ' på teinene' : 'registreringsmerket på teinene') + ', rømmingshull med bomullstråd, blåse og bøyestang i hver ende)');
    en.push('the marking (' + (V.reg ? 'the registration mark ' + V.reg + ' on the pots' : 'the registration mark on the pots') + ', escape holes closed with cotton thread, a buoy and a pole at each end)');
    no.push('røktingen og posisjonsmeldingene (eldste lenke ' + f(Z.oldD, 0) + ' døgn)'); en.push('the tending and the position reports (oldest string ' + f(Z.oldD, 0) + ' days)'); }
  const Q = Z.q;
  if (Q){ no.push('fangsten om bord (' + t(Q.aboard) + ' t rund vekt) mot fartøykvoten (' + t(Q.used) + ' av ' + t(Q.base) + ' t landet' + (Q.max > Q.base ? ', ' + t(Q.max) + ' t med kvotefleksen' : '') + ') og tilleggskvoten for levende krabbe (' + t(Q.usedT) + ' av ' + t(Q.extra) + ' t)');
    en.push('the catch aboard (' + t(Q.aboard) + ' t round weight) against the vessel quota (' + t(Q.used) + ' of ' + t(Q.base) + ' t landed' + (Q.max > Q.base ? ', ' + t(Q.max) + ' t with the flexibility' : '') + ') and the extra quota for live crab (' + t(Q.usedT) + ' of ' + t(Q.extra) + ' t)'); }
  else { no.push('fangsten om bord (' + f(r.tot, 0) + ' kg)'); en.push('the catch aboard (' + f(r.tot, 0) + ' kg)'); }
  const m = Z.sample;
  if (m){ const ok47 = !m.uk ? 'ingen levende under 9,5 cm beholdt' : f(m.uk, 0) + ' levende under 9,5 cm beholdt', ok47e = !m.uk ? 'no live crab under 9.5 cm kept' : f(m.uk, 0) + ' live crabs under 9.5 cm kept';
    no.push('en stikkprøve av ' + (m.now ? 'trekket som pågår' : 'siste trekk') + ' (' + f(m.kept, 0) + ' krabber beholdt, ' + ok47 + ', ' + f(m.rel, 0) + ' satt ut levende, ' + f(m.dead, 0) + ' døde beholdt, ' + f(m.pct * 100, 0) + ' % bløte)');
    en.push('a sample of ' + (m.now ? 'the haul under way' : 'the last haul') + ' (' + f(m.kept, 0) + ' crabs kept, ' + ok47e + ', ' + f(m.rel, 0) + ' put back alive, ' + f(m.dead, 0) + ' dead kept, ' + f(m.pct * 100, 0) + '% soft)'); }
  no.push('reglene for stedet'); en.push('the rules of the place');
  return [kvJoin(no, 'og'), kvJoin(en, 'and')];
}
function kvFinish(){
  const b = S.boat, K = kvState(), r = kvCheck(b), ok = !r.items.length, np = nearestPort(b.pos), at = np ? np.name : '', wh = kvWhat(r), sea = !!(K.visit && K.visit.hav);
  // far out the nearest harbour says nothing: an inspection at sea names the field
  const where = sea ? ['Havkontroll på ' + kvAt(b.pos), 'Inspection at sea at ' + kvAt(b.pos)] : ['Kontroll ' + (b.status === 'port' ? 'ved kai i ' : 'ved ') + at, 'Inspection ' + (b.status === 'port' ? 'at the quay in ' : 'off ') + at];
  K.n++; if (ok) K.nOk++; K.last = S.t; K.ok = ok; K.visit = null;
  K.log.unshift({t:S.t, ok, k:r.items.map(i => i.k), ref:r.items.map(i => i.ref), x:+b.pos.x.toFixed(3), y:+b.pos.y.toFixed(3), port:np ? np.id : null}); while (K.log.length > KV.keep) K.log.pop();
  if (ok){
    msg('Kystvakta', where[0] + ': alt i orden. Vi så på ' + wh[0] + '. God tur videre.', where[1] + ': all in order. We looked at ' + wh[1] + '. Fair winds.');
    if (typeof achAdd === 'function') achAdd('kv');
  } else {
    const no = r.items.map(i => i.no + ' (' + i.ref + ')').join(' '), en = r.items.map(i => i.en + ' (' + i.ref + ')').join(' ');
    msg('Kystvakta', where[0] + '. Vi så på ' + wh[0] + ', og har ' + (r.items.length === 1 ? 'én merknad' : r.items.length + ' merknader') + ': ' + no + ' Reglene står i Regler-appen under «Kan jeg fiske her?».',
      where[1] + '. We looked at ' + wh[1] + ', and have ' + (r.items.length === 1 ? 'one remark' : r.items.length + ' remarks') + ': ' + en + ' The rules are in the Regler app under «Can I fish here?».');
    if (typeof pressPut === 'function') pressPut('kv', {port:np ? np.id : null, k:r.items.slice(0, 4).map(i => i.k).join('-')});
  }
  if (typeof cloudEv === 'function') cloudEv('kv_check', {ok, k:r.items.map(i => i.k), st:b.status, n:K.n, gear:r.gear, kg:Math.round(r.tot), hav:sea || undefined, mix:r.hav && r.hav.sample && !r.hav.sample.few ? Math.round(r.hav.sample.pct * 100) : undefined, sno:r.hav && r.hav.sno ? r.hav.sno.pots : undefined, soft:r.hav && r.hav.sno && r.hav.sno.sample ? Math.round(r.hav.sno.sample.pct * 100) : undefined});
  if (typeof toast === 'function') toast(ok ? gL('Kystvakta: alt i orden.', 'Coast guard: all in order.') : gL('Kystvakta har merknader. Se meldingen.', 'The coast guard has remarks. See the message.'));
  if (typeof hooks !== 'undefined' && hooks.onNpcChange) try { hooks.onNpcChange(); } catch (e){}
}
