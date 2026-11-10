// ===== Kystvakta: the inspection at the quay or on the field (Oppdrag 2 V1, 30.10.2026; docs/planer/oppdrag-2.md, docs/systemer/kvoter-og-regler.md 5.30) =====
// At most once a game week the coast guard comes alongside, never in the first week and never in a gale, and asks what the rules engine
// (03e-rules.js) already knows for the place, the gear in the sea and the catch aboard. Nothing is asked that the Regler app would not have
// told you first: «Kan jeg fiske her?» is the answer. A clean check is one sentence, «Kontrollert» in the papers and a smaller chance of the
// next one for two weeks; a remark gets the rule read out with its source, and exactly the consequence the game has today (the cod and the
// bycatch beyond the rule are confiscated at the landing, ui/08-actions.js). No fine (V-A A). Measured in the event kv_check.
const KV = {p:0.5, pAfterOk:0.25, okFor:14 * 1440, gale:13.9, visitMin:30, minLand:3, nets:80, hooks:5000, keep:10, side:0.028};
// the source each code cites, for Kystposten's story (the story carries the codes only, 09h-press.js; the texts stay in rulesAt)
const KV_REF = {kvoteh:'J-187-2026 § 14', seiby:'J-187-2026 § 14', lby:'J-128-2026', bby:'J-128-2026', f49:'Høstingsforskriften § 49', f26:'Høstingsforskriften § 26', f26b:'Høstingsforskriften § 26', f31:'Høstingsforskriften § 31', f33:'Høstingsforskriften § 33', f33a:'Høstingsforskriften § 33a', f18:'Høstingsforskriften § 18', kv40:'Høstingsforskriften § 40', j32b:'J-187-2026 § 32', j32c:'J-187-2026 § 32', henn:'J-187-2026 § 32', borg:'J-187-2026 § 32', kvote:'J-187-2026', byc:'Deltakerforskriften', stengt:'J-melding om stengt felt', gyte:'Forskrift om fredningsområder for kysttorsk', null:'Oslofjordforskriften', oslo:'Oslofjordforskriften', oslog:'Oslofjordforskriften', lopp:'Verneforskriften for Lopphavet', bk1000:'Forskrift om bunnredskap', kc2:'J-136-2026', kc10:'J-138-2026', skag:'Torskeforskriften for Nordsjøen og Skagerrak § 1'};
// ---- the check at sea aboard an ocean vessel (H2e of docs/planer/havsteget-h2-autoline.md, 06.11.2026): the inspectors come over by the
// ship's boat while she lies off, and look at the position of the gear against høstingsforskriften § 26 and J-187-2026 § 32 along the whole
// line, the marking (§§ 66 and 68), the catch against the vessel quota (J-187-2026 § 14: no bycatch of cod or haddock beyond it), the
// bycatch of saithe (§ 14: 25 % in each catch and of the landed catch), ling and tusk (J-128-2026 and the proposal for 2027: 35 % ling,
// 15 % tusk after the stop), and a sample of the last catch for the minimum sizes (§ 47) and the admixture (§ 49). The texts of §§ 47,
// 49, 50, 51, 66 and 68 were read on Lovdata 06.11.2026 (last amended FOR-2026-10-02-1999); § 14 in J-187-2026 on fiskeridir.no.
const KVH = {visitMin:90, side:0.18, step:1.0, minFish:20, minHaul:100, keep:3};
// § 47 and the length–weight curve are the fishing's own (MIN47, min47Cm, lwKg and minKgAt in 02-species-gear.js, steg 59, 10.11.2026), so
// the sample measures by the same minimum sizes the catch is sorted by. The species sampled are the ones § 47 lists; ling and tusk have none
const KV47 = MIN47;
const kvCmKg = lwKg;
const kvMinCm = min47Cm;
// one fish as it comes up, counted in the haul's sample (10-gear.js landFish): [measured, under the minimum size] per species, with the
// minimum for the place where the gear stood worked out once per haul
function kvSampleFish(g, sp, w, p){ const mk = g.msK || (g.msK = {}); if (mk[sp] == null) mk[sp] = minKgAt(sp, p);
  const m = g.ms || (g.ms = {}), r = m[sp] || (m[sp] = [0, 0]); r[0]++; if (w < mk[sp]) r[1]++; }
// a haul done (or stopped) is a catch of its own: its sample and its kilos by species, the last few kept for the coast guard
function kvHaulKeep(g, s){ if (!g || !(g.spKg || g.ms)) return; const L = S.kvHaul || (S.kvHaul = []), m = setMid(s);
  L.unshift({t:S.t, vid:S.cur, x:+m.x.toFixed(3), y:+m.y.toFixed(3), kind:s.kind, lk:s.lk || null, ms:g.ms || {}, kg:g.spKg || {}}); while (L.length > KVH.keep) L.pop(); }
// § 49: the share under the minimum size allowed in number in each catch. North of 62° N: 15 % of cod, haddock and saithe together with
// trawl and conventional gear (fourth paragraph), 20 % when fishing haddock by line in statistics area 03 (fifth), 20 % cod when fishing
// cod with jig and line within 4 nm of the baseline (seventh: «er det tillat å ha til sammen 20 % torsk under minstemål i antall i de
// enkelte fangster»; read on Lovdata 10.11.2026; the haddock and saithe then by the fourth), 15 % Greenland halibut (ninth); elsewhere
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
const kvAt = p => typeof coordStr === 'function' ? coordStr(p) : (q => q.lat.toFixed(3) + '° N ' + q.lon.toFixed(3) + '° Ø')(LL(p));
// § 68 for one string outside the baselines: an end buoy with a pole at each end (two flags and two lights in the west, one of each in
// the east), the buoys at most one nautical mile apart, so a string longer than that has buoys between; all of them carry the
// registration mark (§ 66). The autoline system's poles and buoys (5.66 and 5.67 in docs/systemer/redskap.md) are made so: counted here
function kvMarks(s){ const km = s.kind === 'line' && isAuto(s.lk) ? lineKm('auto', s.hooks || 0) : dist(s.a, s.b) / gridScale(setMid(s)); return {ends:2, mid:Math.max(0, Math.ceil(km / 1.852) - 1), km}; }
function kvHavCheck(b, sets, H, len, add, most){
  const R = {pts:0, ends:0, mid:0, sample:null, haulKg:0, reg:null}, f = fmtC, nm = p => f(blNm(p), 1);
  // the position: every point along each string against the blocking rules for line with a baiting machine; the set going out now as far as it has gone
  const lines = sets.map(s => ({a:s.a, b:s.b, gear:s.kind === 'teine' ? 'teiner' : s.kind, egn:s.kind === 'line' && isAuto(s.lk)}));
  if (b.gop && b.gop.op === 'set' && b.gop.a) lines.push({a:b.gop.a, b:{...b.pos}, gear:b.gop.kind === 'teine' ? 'teiner' : b.gop.kind, egn:!!b.gop.auto});
  for (const L of lines) for (const p of kvAlong(L.a, L.b)){ R.pts++; let r = null; try { r = rulesAt({p, H, len, gear:L.gear, sp:most, egn:L.egn}); } catch (e){}
    if (r) for (const it of r.items) if (it.block && it.v === 'no'){ const where = ' Lina ved ' + kvAt(p) + ' står ' + nm(p) + ' nm fra grunnlinja.', whereEn = ' The line at ' + kvAt(p) + ' is ' + nm(p) + ' nm from the baseline.';
      add(it.k, it.no + (/^(f26|f26b|j32c|j32b)$/.test(it.k) ? where : ''), it.en + (/^(f26|f26b|j32c|j32b)$/.test(it.k) ? whereEn : ''), it.ref, it.url); } }
  // the marking: counted for what is said (the poles and buoys come with the system, and every buoy carries the mark)
  for (const s of sets){ const m = kvMarks(s); R.ends += m.ends; R.mid += m.mid; }
  try { const rg = regOf(b); R.reg = rg && rg.f ? rg.f + '-' + rg.n + '-' + rg.k : null; } catch (e){}
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
  const b = S.boat, K = kvState(), sea = kvHav() && b.status !== 'port'; K.visit = {t0:S.t, hav:sea || null}; K.visit.p = kvSide(b); K.visit.hd = b.heading || 0;
  const nm = S.boatName || 'Havbris';
  if (sea) log('Kystvakta på VHF: «' + nm + '», dette er Kystvakta. Vi ligger av babord og setter over inspektører i lettbåten for kontroll. Fortsett arbeidet.', 'The coast guard on the VHF: «' + nm + '», this is the coast guard. We are lying off and sending inspectors over in the boat for an inspection. Carry on working.', 'nav');
  else log('Kystvakta på VHF: «' + nm + '», dette er Kystvakta. Vi kommer langs siden for kontroll.', 'The coast guard on the VHF: «' + nm + '», this is the coast guard. We are coming alongside for an inspection.', 'nav');
  if (typeof toast === 'function') toast(sea ? gL('Kystvakta setter over inspektører for kontroll.', 'The coast guard is sending inspectors over.') : gL('Kystvakta kommer langs siden for kontroll.', 'The coast guard is coming alongside for an inspection.'));
  if (typeof hooks !== 'undefined' && hooks.onNpcChange) try { hooks.onNpcChange(); } catch (e){}
}
// her place: off the starboard side, following the boat
function kvSide(b){ const hd = b.heading || 0, V = S.kv && S.kv.visit, d = V && V.hav ? -KVH.side : KV.side; return {x:b.pos.x + Math.cos(hd) * d, y:b.pos.y + Math.sin(hd) * d}; }
function kvMinute(){
  const K = S.kv; if (!K || !K.visit) return; const b = S.boat, v = K.visit;
  v.p = kvSide(b); v.hd = b.heading || 0; v.v = b.status === 'sailing' ? b.v || 0 : 0;
  if (S.t - v.t0 >= (v.hav ? KVH.visitMin : KV.visitMin)) try { kvFinish(); } catch (e){ console.warn('kv', e); K.visit = null; }
}
// the coast guard's ship on the chart and in 3D while she lies alongside (05-vessels.js npcStates)
function kvNpcs(){ const K = S.kv; if (!K || !K.visit) return []; const v = K.visit;
  return [{id:'kv', name:'Kystvakta', type:'kyst', p:v.p, hd:v.hd, cog:v.hd, v:Math.round((v.v || 0) * 10) / 10, st:v.v > 0.5 ? 'sailing' : 'idle', coast:true, kv:true, L:15, B:5, liv:1}]; }
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
  const probe = (p, gear, sp) => { let r = null; try { r = rulesAt({p, H, len, gear, sp, hand}); } catch (e){} if (r) for (const it of r.items) if (it.block && it.v === 'no') add(it.k, it.no, it.en, it.ref, it.url); };
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
  // the cod beyond what is left of the quota (the game warns of it once a day, 05-vessels.js; the landing confiscates it)
  if (access() !== 'none' && kgOf('torsk') > 0){ let over = 0; try { const q = quotaState(); over = q.torsk + kgOf('torsk') - codLimitNow(H); if (ffPct(H)) over = 0; } catch (e){}
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
  if (r.sets){ no.push('posisjonen til ' + (r.sets === 1 ? 'lenka' : 'de ' + r.sets + ' lenkene') + ' i sjøen (' + f(r.auto || r.hooks, 0) + ' krok) mot § 26 og § 32 på ' + V.pts + ' punkter langs lina');
    en.push('the position of the ' + (r.sets === 1 ? 'string' : r.sets + ' strings') + ' in the sea (' + f(r.auto || r.hooks, 0) + ' hooks) against § 26 and § 32 at ' + V.pts + ' points along the line');
    no.push('merkingen (' + V.ends + ' bøyestenger med radarreflektor, flagg og gule lys, ' + V.mid + ' vak mellom dem' + (V.reg ? ', merket ' + V.reg : '') + ')');
    en.push('the marking (' + V.ends + ' pole buoys with radar reflector, flags and yellow lights, ' + V.mid + ' buoys between them' + (V.reg ? ', marked ' + V.reg : '') + ')'); }
  no.push('fangsten om bord (' + f(r.tot, 0) + ' kg) mot fartøykvoten og bifangsten av sei, lange og brosme'); en.push('the catch aboard (' + f(r.tot, 0) + ' kg) against the vessel quota and the bycatch of saithe, ling and tusk');
  const m = V.sample;
  if (m && !m.few){ no.push('en stikkprøve av siste fangst (' + m.n + ' fisk målt, ' + f(m.pct * 100, 0) + ' % under minstemålet)'); en.push('a sample of the last catch (' + m.n + ' fish measured, ' + f(m.pct * 100, 0) + ' % under the minimum size)'); }
  no.push('reglene for stedet'); en.push('the rules of the place');
  const join = (a, and) => a.length > 1 ? a.slice(0, -1).join(', ') + ' ' + and + ' ' + a[a.length - 1] : a[0];
  return [join(no, 'og'), join(en, 'and')];
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
  if (typeof cloudEv === 'function') cloudEv('kv_check', {ok, k:r.items.map(i => i.k), st:b.status, n:K.n, gear:r.gear, kg:Math.round(r.tot), hav:sea || undefined, mix:r.hav && r.hav.sample && !r.hav.sample.few ? Math.round(r.hav.sample.pct * 100) : undefined});
  if (typeof toast === 'function') toast(ok ? gL('Kystvakta: alt i orden.', 'Coast guard: all in order.') : gL('Kystvakta har merknader. Se meldingen.', 'The coast guard has remarks. See the message.'));
  if (typeof hooks !== 'undefined' && hooks.onNpcChange) try { hooks.onNpcChange(); } catch (e){}
}
