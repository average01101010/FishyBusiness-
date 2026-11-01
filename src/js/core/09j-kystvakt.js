// ===== Kystvakta: the inspection at the quay or on the field (Oppdrag 2 V1, 30.10.2026; docs/planer/oppdrag-2.md, docs/systemer/kvoter-og-regler.md 5.30) =====
// At most once a game week the coast guard comes alongside, never in the first week and never in a gale, and asks what the rules engine
// (03e-rules.js) already knows for the place, the gear in the sea and the catch aboard. Nothing is asked that the Regler app would not have
// told you first: «Kan jeg fiske her?» is the answer. A clean check is one sentence, «Kontrollert» in the papers and a smaller chance of the
// next one for two weeks; a remark gets the rule read out with its source, and exactly the consequence the game has today (the cod and the
// bycatch beyond the rule are confiscated at the landing, ui/08-actions.js). No fine (V-A A). Measured in the event kv_check.
const KV = {p:0.5, pAfterOk:0.25, okFor:14 * 1440, gale:13.9, visitMin:30, minLand:3, nets:80, hooks:5000, keep:10, side:0.028};
// the source each code cites, for Kystposten's story (the story carries the codes only, 09h-press.js; the texts stay in rulesAt)
const KV_REF = {f31:'Høstingsforskriften § 31', f33:'Høstingsforskriften § 33', f33a:'Høstingsforskriften § 33a', f18:'Høstingsforskriften § 18', kv40:'Høstingsforskriften § 40', j32b:'J-161-2026 § 32', j32c:'J-161-2026 § 32', henn:'J-161-2026 § 32', borg:'J-161-2026 § 32', kvote:'J-161-2026', byc:'Deltakerforskriften', stengt:'J-melding om stengt felt', gyte:'Forskrift om fredningsområder for kysttorsk', null:'Oslofjordforskriften', oslo:'Oslofjordforskriften', oslog:'Oslofjordforskriften', lopp:'Verneforskriften for Lopphavet', bk1000:'Forskrift om bunnredskap', kc2:'J-136-2026', kc10:'J-138-2026'};
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
function kvArrive(){
  const b = S.boat, K = kvState(); K.visit = {t0:S.t, p:kvSide(b), hd:b.heading || 0};
  log('Kystvakta på VHF: «' + (S.boatName || 'Havbris') + '», dette er Kystvakta. Vi kommer langs siden for kontroll.', 'The coast guard on the VHF: «' + (S.boatName || 'Havbris') + '», this is the coast guard. We are coming alongside for an inspection.', 'nav');
  if (typeof toast === 'function') toast(gL('Kystvakta kommer langs siden for kontroll.', 'The coast guard is coming alongside for an inspection.'));
  if (typeof hooks !== 'undefined' && hooks.onNpcChange) try { hooks.onNpcChange(); } catch (e){}
}
// her place: off the starboard side, following the boat
function kvSide(b){ const hd = b.heading || 0; return {x:b.pos.x + Math.cos(hd) * KV.side, y:b.pos.y + Math.sin(hd) * KV.side}; }
function kvMinute(){
  const K = S.kv; if (!K || !K.visit) return; const b = S.boat, v = K.visit;
  v.p = kvSide(b); v.hd = b.heading || 0; v.v = b.status === 'sailing' ? b.v || 0 : 0;
  if (S.t - v.t0 >= KV.visitMin) try { kvFinish(); } catch (e){ console.warn('kv', e); K.visit = null; }
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
  for (const s of sets) probe(setMid(s), s.kind === 'teine' ? 'teiner' : s.kind, most);
  if (b.status === 'fishing') probe(b.pos, 'juksa', S.target === 'kveite' ? 'kveite' : most);
  // § 33a and § 33: at most 80 nets in the cod fishery and 5 000 hooks a day inside the fjord lines (fjordLimits: no hook limit in the six Finnmark fjords in winter)
  const inF = s => { try { return insideFjord(setMid(s)); } catch (e){ return false; } }, sums = kvSums(sets, inF);
  if (sums.nets > KV.nets && (most === 'torsk' || !most)) add('f33a', 'Høyst 80 garn i fisket etter torsk innenfor fjordlinjene; dere har ' + sums.nets + ' i sjøen.', 'At most 80 nets in the cod fishery inside the fjord lines; you have ' + sums.nets + ' in the sea.', 'Høstingsforskriften § 33a', RU_HF);
  if (sums.hooks > KV.hooks && sets.some(s => s.kind === 'line' && inF(s) && (fjordLimits(setMid(s), H) || {}).hooks)) add('f33', 'Høyst 5 000 kroker per døgn på bunnline innenfor fjordlinjene; dere har ' + fmt(sums.hooks, 0) + ' i sjøen.', 'At most 5,000 hooks a day on bottom line inside the fjord lines; you have ' + fmt(sums.hooks, 0) + ' in the sea.', 'Høstingsforskriften § 33', RU_HF);
  // the catch aboard: cod, haddock and saithe without access are bycatch, at most 10 % of what is aboard (ui/08-actions.js takes the rest at the landing)
  const kgOf = sp => (S.hold || []).filter(x => x.sp === sp).reduce((a, x) => a + x.kg, 0), tot = (S.hold || []).reduce((a, x) => a + x.kg, 0), c3 = kgOf('torsk') + kgOf('hyse') + kgOf('sei');
  if (access() === 'none' && tot > 0 && c3 > BYCATCH.share * tot + 0.5) add('byc', 'Båten har ikke adgang til å fiske torsk, hyse og sei; de kan bare være bifangst, høyst 10 % av fangsten. Om bord er ' + fmt(c3, 0) + ' av ' + fmt(tot, 0) + ' kg. Det som er over, blir inndratt ved levering.', 'The boat has no access to fish cod, haddock and saithe; they can only be bycatch, at most 10% of the catch. Aboard are ' + fmt(c3, 0) + ' of ' + fmt(tot, 0) + ' kg. What is over is confiscated at the landing.', 'Deltakerforskriften, J-161-2026 § 32', RU_J161);
  // the cod beyond what is left of the quota (the game warns of it once a day, 05-vessels.js; the landing confiscates it)
  if (access() !== 'none' && kgOf('torsk') > 0){ let over = 0; try { const q = quotaState(); over = q.torsk + kgOf('torsk') - codLimitNow(H); if (ffPct(H)) over = 0; } catch (e){}
    if (over > 0.5) add('kvote', 'Torsken om bord fyller mer enn det som er igjen av kvoten, ' + fmt(over, 0) + ' kg over. Det overskytende blir inndratt ved levering.', 'The cod aboard fills more than what is left of the quota, ' + fmt(over, 0) + ' kg over. The excess is confiscated at the landing.', 'J-161-2026, fartøykvoten', RU_J161); }
  // § 18: nets and line on the Greenland halibut grounds are tended every other day, for halibut and monkfish every fourth (10-gear.js reminds of it)
  for (const s of sets){ if (s.kind === 'teine') continue; const a = (S.t - s.tSet) / 60;
    if ((a >= 48 && s.depth > 300) || a >= 96){ add('f18', (s.kind === 'garn' ? 'Garna' : 'Lina') + ' ved ' + coordStr(setMid(s)) + ' har stått i ' + fmt(a / 24, 0) + ' døgn uten røkting; faststående redskap skal røktes jevnlig, på blåkveitefeltene minst annenhver dag.', 'The ' + (s.kind === 'garn' ? 'nets' : 'line') + ' at ' + coordStr(setMid(s)) + ' have stood for ' + fmt(a / 24, 0) + ' days untended; fixed gear is tended regularly, on the Greenland halibut grounds at least every other day.', 'Høstingsforskriften § 18', RU_HF); break; } }
  return {items:out, gear:[...new Set(sets.map(s => s.kind))].concat(b.status === 'fishing' ? ['juksa'] : []), nets:sums.nets, hooks:sums.hooks, tot, sets:sets.length};
}
// the word in a few words: what was looked at
function kvWhat(r){
  const g = [], ge = [];
  if (r.nets) { g.push(r.nets + ' garn'); ge.push(r.nets + ' nets'); }
  if (r.hooks) { g.push(fmt(r.hooks, 0) + ' kroker på line'); ge.push(fmt(r.hooks, 0) + ' hooks on line'); }
  if (r.gear.includes('teine')) { g.push('teinene'); ge.push('the pots'); }
  if (r.gear.includes('juksa')) { g.push('juksa'); ge.push('the jig'); }
  const no = (g.length ? 'redskapen i sjøen (' + g.join(', ') + '), ' : '') + 'fangsten om bord (' + fmt(r.tot, 0) + ' kg) og reglene for stedet';
  const en = (ge.length ? 'the gear in the sea (' + ge.join(', ') + '), ' : '') + 'the catch aboard (' + fmt(r.tot, 0) + ' kg) and the rules of the place';
  return [no, en];
}
function kvFinish(){
  const b = S.boat, K = kvState(), r = kvCheck(b), ok = !r.items.length, np = nearestPort(b.pos), at = np ? np.name : '', wh = kvWhat(r);
  K.n++; if (ok) K.nOk++; K.last = S.t; K.ok = ok; K.visit = null;
  K.log.unshift({t:S.t, ok, k:r.items.map(i => i.k), ref:r.items.map(i => i.ref), x:+b.pos.x.toFixed(3), y:+b.pos.y.toFixed(3), port:np ? np.id : null}); while (K.log.length > KV.keep) K.log.pop();
  if (ok){
    msg('Kystvakta', 'Kontroll ' + (b.status === 'port' ? 'ved kai i ' : 'ved ') + at + ': alt i orden. Vi så på ' + wh[0] + '. God tur videre.', 'Inspection ' + (b.status === 'port' ? 'at the quay in ' : 'off ') + at + ': all in order. We looked at ' + wh[1] + '. Fair winds.');
    if (typeof achAdd === 'function') achAdd('kv');
  } else {
    const no = r.items.map(i => i.no + ' (' + i.ref + ')').join(' '), en = r.items.map(i => i.en + ' (' + i.ref + ')').join(' ');
    msg('Kystvakta', 'Kontroll ' + (b.status === 'port' ? 'ved kai i ' : 'ved ') + at + '. Vi så på ' + wh[0] + ', og har ' + (r.items.length === 1 ? 'én merknad' : r.items.length + ' merknader') + ': ' + no + ' Reglene står i Regler-appen under «Kan jeg fiske her?».',
      'Inspection ' + (b.status === 'port' ? 'at the quay in ' : 'off ') + at + '. We looked at ' + wh[1] + ', and have ' + (r.items.length === 1 ? 'one remark' : r.items.length + ' remarks') + ': ' + en + ' The rules are in the Regler app under «Can I fish here?».');
    if (typeof pressPut === 'function') pressPut('kv', {port:np ? np.id : null, k:r.items.slice(0, 4).map(i => i.k).join('-')});
  }
  if (typeof cloudEv === 'function') cloudEv('kv_check', {ok, k:r.items.map(i => i.k), st:b.status, n:K.n, gear:r.gear, kg:Math.round(r.tot)});
  if (typeof toast === 'function') toast(ok ? gL('Kystvakta: alt i orden.', 'Coast guard: all in order.') : gL('Kystvakta har merknader. Se meldingen.', 'The coast guard has remarks. See the message.'));
  if (typeof hooks !== 'undefined' && hooks.onNpcChange) try { hooks.onNpcChange(); } catch (e){}
}
