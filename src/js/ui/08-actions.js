// actions
panel.addEventListener('pointerdown', () => { pressHold = true; });
window.addEventListener('pointerup', () => { setTimeout(() => { pressHold = false; }, 250); });
panel.addEventListener('click', e => { const el = e.target.closest('[data-act]'); if (el && !el.disabled) doAct(el); });
function doAct(el){
  const act = el.dataset.act, i = +el.dataset.i, b = S.boat, L = (no, en) => S.lang === 'no' ? no : en;
  if (act === 'gset' || act === 'ghaul' || act === 'gstop') gearDoAct(act, el);
  // every change to the draft is a step in the route history (03b-route.js)
  else if (act === 'gwp') draftEdit(() => gearDoAct(act, el));
  else if (act === 'fp' || act === 'fm') draftEdit(() => { const w = S.draft[i]; if (w) w.fish = clamp((w.fish || 0) + (act === 'fp' ? 1 : -1), 0, 12); });
  else if (act === 'rm') draftEdit(() => S.draft.splice(i, 1));
  else if (act === 'undo') draftUndo();
  else if (act === 'redo') draftRedo();
  else if (act === 'clear') draftEdit(() => { S.draft = []; });
  else if (act === 'start'){
    if (!S.draft.length || !['port', 'idle'].includes(b.status)) return;
    if (!tutAllow('start')) return;
    if (!meAboard() && !crewAboard().length){ toast(L('Båten har ikke mannskap. Uten deg om bord trenger den folk.', 'The boat has no crew. Without you aboard it needs hands.')); return; }
    const later = S.draftDep && S.draftDep > S.t ? S.draftDep : null;
    if (!later && b.status === 'port' && S.jobs && S.jobs.length){ toast(t('yard_busy', hm((jobsDone() || S.t) / 60))); return; }
    S.plan = {wps:S.draft.map(w => ({...w})), idx:0, speed:S.draftSpeed, returning:false, depAt:later, unsafe:draftHazards().map(h => h.unsafe)};
    S.draft = []; S.draftDep = null; draftForget();
    if (later) log('Avgang planlagt ' + dayStr(later / 60) + ' kl. ' + hm(later / 60) + '.', 'Departure planned for ' + dayStr(later / 60) + ' at ' + hm(later / 60) + '.');
    else { if (b.status === 'idle') log('Ny rute satt.', 'New route set.'); depart(); }
    // the chart plotter stays open: the skipper goes back to 3D himself (the user's wish 02.10.2026)
  }
  else if (act === 'depnow'){ if (!S.plan) return; if (b.status === 'port' && S.jobs && S.jobs.length){ toast(t('yard_busy', hm((jobsDone() || S.t) / 60))); return; } if (!meAboard() && !crewAboard().length){ toast(L('Båten har ikke mannskap. Uten deg om bord trenger den folk.', 'The boat has no crew. Without you aboard it needs hands.')); return; } depart(); if (!G3.isActive()) G3.show(true, true); }
  else if (act === 'cn'){ S.settings.chartNight = el.dataset.m; renderBase(); scheduleStatic(); if (typeof MINIP !== 'undefined') MINIP.key = ''; }
  else if (act === 'cm'){ const m = el.dataset.m; if (m === 'fish' && !S.equip.plotter){ toast(t('need_plotter')); PHONE.open('utstyr'); return; } S.settings.chart = m; renderBase(); scheduleStatic(); }
  else if (act === 'echo' || act === 'sonar'){ S.settings[act] = el.dataset.on === '1'; heatReset(); if (typeof heatPaint === 'function') heatPaint(); INSTR.show(); }
  else if (act === 'hsp'){ S.settings.heatSp = el.dataset.s; if (typeof heatPaint === 'function') heatPaint(true); }
  else if (act === 'sd-' || act === 'sd+'){ S.settings.safeDepth = clamp(safeDepth() + (act === 'sd+' ? 1 : -1), 1, 30); hzCache.k = ''; renderBase(); scheduleStatic(); }
  else if (act === 'jigg'){ window.JIGG.toggle(); renderActs(); return; }
  else if (act === 'pub'){ window.PUBW.open(); return; }
  else if (act === 'target'){ if (kveiteClosed(S.t / 60)){ S.target = 'mix'; toast(L('Kveita er fredet fra 20. desember til og med 20. april.', 'Halibut is closed from 20 December to 20 April.')); } else S.target = S.target === 'kveite' ? 'mix' : 'kveite'; renderActs(); return; }
  else if (act === 'opssave'){
    if (tutOn()) return;
    const last = S.draft[S.draft.length - 1]; if (!last || !last.port || b.status !== 'port'){ toast(S.lang === 'no' ? 'Planen må starte i havn og slutte i en havn.' : 'The plan must start in port and end in a port.'); return; }
    const hours = S.draft.reduce((a, w) => a + (w.fish || 0), 0) + estimate().hours;
    S.ops = Object.assign({on:false, dep:5, days:[1, 1, 1, 1, 1, 0, 0], maxWind:12, skipper:(S.crew[0] || {}).id || null, last:-1}, S.ops || {}, {wps:S.draft.map(w => { const q = {...w}; if (q.act) q.act = {op:'cycle', kind:q.act.kind, spec:q.act.spec}; return q; }), speed:S.draftSpeed, home:b.port, end:last.port, hours:Math.ceil(hours)});
    toast(S.lang === 'no' ? 'Lagret som fast driftsplan. Slå den på under Bygd, Mannskap.' : 'Saved as the standing plan. Switch it on under Village, Crew.'); PHONE.open('mannskap');
  }
  else if (act === 'depcancel'){ S.plan = null; log('Avgangen er avlyst.', 'Departure cancelled.'); }
  else if (act === 'stop'){ S.plan = null; helmOff(); b.status = 'idle'; b.v = 0; log('Stoppet båten.', 'Stopped the boat.'); }
  else if (act === 'retrace'){ if (tutOn()) return; startReturn(false); }
  else if (act === 'tow') rescue(true);
  else if (act === 'fh+' || act === 'fh-') S.fishPlanH = clamp(S.fishPlanH + (act === 'fh+' ? 1 : -1), 1, 12);
  else if (act === 'startfish'){ if (!rigJig()){ const w = rigWrong(null); toast(w[0]); return; }
    // there is no rod: without a hand jig, reels or halibut gear for halibut nobody can fish
    if (!b.gear && !(S.equip && S.equip.jukse > 0) && !(S.target === 'kveite' && b.kgear)){ toast(L('Du har ingen juksa. Kjøp håndjuksa i butikken på kaia.', 'You have no jig. Buy a hand jig in the shop on the quay.')); return; } if (BOAT.len >= 15 && insideFjord(b.pos)){ toast(S.lang === 'no' ? 'Fartøy på 15 meter eller mer kan ikke fiske innenfor fjordlinja.' : 'Vessels of 15 m or more may not fish inside the fjord line.'); return; } b.status = 'fishing'; b.fishUntil = S.t + S.fishPlanH * 60; log('Starter fiske i ' + S.fishPlanH + ' t.', 'Fishing for ' + S.fishPlanH + ' h.'); }
  else if (act === 'stopfish'){ if (b.gop) gopAbort('stop'); b.fishUntil = S.t; S.plan = null; endFishing('done'); }
  else if (act === 'deckstop'){ if (b.status === 'fishing'){ b.deckStop = true; log('Stopper fisket for å sløye og ise.', 'Stopping fishing to gut and ice.'); } }
  else if (act === 'deckgo'){ b.deckStop = false; b.deckEnd = null; }
  else if (act === 'sell'){ if (!tutAllow('sell')) return; if (!mottakOpen(S.t / 60)){ toast(L('Mottaket er stengt. Det åpner ', 'The plant is closed. It opens ') + mottakWhen(S.t / 60, S.lang === 'no') + '.'); return; } startLanding(false); }
  else if (act === 'towfast'){ if (!towFast()) toast(L('Redningsskøyta finner veien. Prøv igjen om litt.', 'The rescue boat is finding the way. Try again in a moment.')); }
  else if (act === 'waitopen'){ const n = Math.max(0, Math.round((mottakNext(S.t / 60) - S.t / 60) * 60)); playMinutes(n); toast(L('Mottaket har åpnet.', 'The plant has opened.')); }
  else if (act === 'fuel'){ if (S.cash <= 0){ toast(t('no_cash')); return; } startFueling(false); }
  else if (act === 'ice'){ const why = shopBuy('ice', +el.dataset.kg || 50); if (why){ toast(L(why[0], why[1])); return; } }
  else if (act === 'gear' || act === 'kgear'){ PHONE.open('fiske'); return; }
  else if (act === 'reset'){ if (confirm(t('reset_q'))){ const lang = S.lang; S = newState(); S.lang = lang; S.intro = true; S.draft = []; draftForget(true); S.tut = NOTUT ? 0 : tutNew(); ensureFleet(); save(); refreshAll(); } return; }
  renderPanel(); renderDyn(); renderHud(); renderClock(); renderActs(); renderRouteTools(); save();
}
function panelInput(e){
  if (e.target.id === 'spd'){ S.draftSpeed = +e.target.value; $('spdOut').textContent = S.draftSpeed + ' kn, ' + t('lpnm', fmt(fuelLph(S.draftSpeed, windAt(S.t / 60)) / S.draftSpeed, 2)); }
  if (e.target.id === 'spdLive' && S.plan){ S.plan.speed = +e.target.value; $('spdLiveOut').textContent = S.plan.speed + ' kn'; }
  if (e.target.id === 'autoW'){ S.settings.autoW = +e.target.value; $('autoWOut').textContent = S.settings.autoW + ' m/s'; }
}
function panelChange(e){
  const id = e.target.id;
  if (id === 'setDeckFirst') S.settings.deckFirst = e.target.checked;
  if (id === 'setGut') S.settings.gut = e.target.checked;
  if (id === 'setIce') S.settings.ice = e.target.checked;
  if (id === 'setAuto') S.settings.autoOn = e.target.checked;
  if (id === 'setCrabSort') S.settings.crabSort = e.target.checked;
  if (id === 'dep'){ S.draftDep = e.target.value ? +e.target.value : null; e.target.blur(); }
  e.target.blur && e.target.type === 'range' && e.target.blur();
  panelDirty = true; save();
}
panel.addEventListener('input', panelInput);
panel.addEventListener('change', panelChange);
function sell(){
  const b = S.boat, port = portById(b.port); if (!port || !port.mottak) return;
  const H = S.t / 60, q = quotaState(), lines = {}, extra = [], acc = access(), kgOf = sp => S.hold.filter(x => x.sp === sp).reduce((a, x) => a + x.kg, 0);
  let kg = 0;
  const wk = weekOfH(H); if (q.ffW !== wk){ q.ffW = wk; q.ffTot = 0; q.ffCod = 0; }
  // the fresh-fish allowance counts fish only (assumed: shellfish do not count)
  const saleKg = S.hold.reduce((a, x) => a + (SPECIES[x.sp].shell || (x.sp === 'hyse' && x.cls === 2) ? 0 : grade(x.fresh) === 'V' ? 0 : x.kg), 0);
  const codKg = kgOf('torsk'), confBy = {};   // share of each species that is confiscated
  let codFF = 0, codQ = 0, codConf = 0, byCod = 0;
  if (acc === 'none'){
    // no access (J-30-2026 § 35): cod, haddock and saithe together at most 10 % of the landing, cut back evenly, and at most 2 t of cod a year
    const ths = codKg + kgOf('hyse') + kgOf('sei'), f = ths > 0 ? Math.min(1, BYCATCH.share * holdTotal() / ths) : 1;
    byCod = Math.min(codKg * f, Math.max(0, BYCATCH.cod - (q.byCod || 0))); codConf = codKg - byCod;
    if (f < 1){ confBy.hyse = 1 - f; confBy.sei = 1 - f; }
    if (codConf > 0.001) confBy.torsk = codConf / codKg;
  } else {
    // cod: the fresh-fish allowance first, then the quota; the rest is confiscated by the sales organisation
    const pct = ffPct(H), ffAllow = pct ? Math.max(0, pct * (q.ffTot + saleKg) - q.ffCod) : 0;
    codFF = Math.min(codKg, ffAllow); codQ = Math.min(codKg - codFF, codRoom(H)); codConf = codKg - codFF - codQ;
    if (codKg > 0 && codConf > 0) confBy.torsk = codConf / codKg;
    // the closed group's haddock and saithe: the maximum quota, then up to 30 % haddock and 20 % saithe as bycatch in each landing
    // (J-161-2026 §§ 18 and 19); the rest is confiscated
    if (acc === 'lukket'){ const LQ = licQ(S.lic, H), all = holdTotal();
      for (const [sp, share] of [['hyse', 0.3], ['sei', 0.2]]){ const k = kgOf(sp), ok = Math.min(k, Math.max(LQ[sp][0] - q[sp], share * all)); if (k > 0 && ok < k - 0.01) confBy[sp] = 1 - Math.max(0, ok) / k; } }
  }
  // The landing note lists each lot at its full value and takes what is confiscated off in rows of its own; every row is whole
  // kroner and the total is the sum of the rows, so the note adds up and the cash gets exactly the total less the crew's share.
  let confKr = 0, confKg = 0, crabKr = 0, ordKr = 0, crabSmall = 0, crabSmallN = 0, crabRoe = 0;
  for (const x of S.hold){
    const sp = x.sp, sd = SPECIES[sp], c = x.cls != null ? x.cls : sd.ref, g = grade(x.fresh);
    let ppk = g === 'V' ? 1 : clsPrice(port, sp, c, H, x.hook) * GM[g];
    if (x.gut && (sp === 'hyse' || sp === 'sei')) ppk += 0.30;           // no gutting fee deducted
    let v = x.kg * ppk, gross = v;
    // brown crab under 13 cm is confiscated; berried crab is worth nothing and tells the plant the sorting was poor
    if (sp === 'krabbe' && c === 2){ gross = x.kg * clsPrice(port, sp, 1, H, false); crabKr += gross; crabSmall += x.kg; crabSmallN += x.n || 1; v = 0; }
    if (sp === 'krabbe' && c === 3){ crabRoe += x.kg; v = gross = 0; }
    const cs = confBy[sp] || 0; if (cs > 0){ confKr += v * cs; confKg += x.kg * cs; v *= 1 - cs; }
    // orders for this harbour take matching fish first, at their premium (confiscated fish does not count)
    const keptKg = x.kg * (1 - cs);
    if (v > 0) for (const o of ordState().active){ if (o.port !== port.id || o.sp !== sp || o.left <= 0.01 || !gradeOk(g, o.q)) continue; const take = Math.min(keptKg - (x._used || 0), o.left); if (take <= 0.01) continue;
      x._used = (x._used || 0) + take; o.left -= take; const add = take / keptKg * v * o.prem; ordKr += add; o.saleKg = (o.saleKg || 0) + take; o.saleKr = (o.saleKr || 0) + add; }
    const k = sp + '|' + c + '|' + g + '|' + (x.gut ? 1 : 0);
    lines[k] = lines[k] || {sp, c, g, gut:!!x.gut, kg:0, sum:0, n:0}; lines[k].kg += x.kg; lines[k].sum += gross; lines[k].n += x.n || 0; kg += x.kg;
    // liver and roe from fish gutted on board
    if (x.gut && sd.liver){ const m = gDate(H).getUTCMonth(), roeF = sp === 'torsk' && m <= 3 ? 0.04 : 0.01;
      extra.push(['lever', x.kg * 0.05, sd.liver]); extra.push(['rogn', x.kg * roeF, sd.roe]); }
    S.market[port.id] = S.market[port.id] || {}; S.market[port.id][sp] = (S.market[port.id][sp] || 0) + x.kg;
  }
  for (const r of Object.values(lines)) r.sum = Math.round(r.sum);
  // poor sorting: the plant takes 10 % off the whole lot of crab
  let roeCut = 0; if (crabRoe > 0.01) for (const r of Object.values(lines)) if (r.sp === 'krabbe' && r.c !== 2 && r.sum > 0) roeCut += r.sum * 0.1;
  roeCut = Math.round(roeCut); confKr = Math.round(confKr); crabKr = Math.round(crabKr);
  // the daily login bonus: a share on top of the fish itself (not on order premiums, liver or roe); the crew shares in it
  const stPct = streakPct(), fishKr = Object.values(lines).reduce((a, r) => a + r.sum, 0) - confKr - crabKr - roeCut, stKr = stPct > 0 ? Math.round(fishKr * stPct / 100) : 0;
  // finished orders pay their bonus; the customer remembers
  const ordLines = []; { const O = ordState();
    for (const o of O.active.slice()){ if (!o.saleKg) continue; const c = CUSTOMERS.find(z => z.id === o.cust), done = o.left <= 0.5; let bonus = 0;
      if (done){ bonus = o.bonus; O.active.splice(O.active.indexOf(o), 1); O.done.unshift({...o, t:S.t, ok:true}); O.done = O.done.slice(0, 20);
        log('Oppdrag levert: ' + fmt(o.kg, 0) + ' kg ' + SPECIES[o.sp].no.toLowerCase() + ' til ' + c.no + ', bonus ' + kr(bonus) + '.', 'Order delivered: ' + fmt(o.kg, 0) + ' kg of ' + SPECIES[o.sp].en.toLowerCase() + ' to ' + c.no + ', bonus ' + kr(bonus) + '.'); S.rep[o.cust] = clamp(repOf(o.cust) + 8, 0, 100); msg(c.no, 'Takk for leveransen! Her er ' + kr(bonus) + ' ekstra for at alt kom i tide.', 'Thanks for the delivery! Here is ' + kr(bonus) + ' extra for having it all on time.'); }
      ordLines.push({cust:c.no, sp:o.sp, kg:o.saleKg, kr:o.saleKr, bonus, done, left:o.left}); ordKr += bonus; o.saleKg = 0; o.saleKr = 0; } }
  ordKr = Math.round(ordKr);
  const ex = {}; for (const [n, k2, pr] of extra){ ex[n] = ex[n] || {kg:0, sum:0}; ex[n].kg += k2; ex[n].sum += k2 * pr; }
  let exKr = 0; for (const n in ex){ ex[n].sum = Math.round(ex[n].sum); exKr += ex[n].sum; }
  const total = fishKr + stKr + ordKr + exKr;
  // quota cooperation (§ 31): cod landed beyond your own vessel quota goes on the partner's, and he takes his share of its value
  let coopKr = 0; if (acc === 'lukket' && S.lic.coop && S.lic.coop.y === yearH(H) && codQ > 0){ const own = licQ({...S.lic, coop:null}, H).torsk, onP = Math.max(0, q.torsk + codQ - own) - Math.max(0, q.torsk - own);
    const codGross = Object.values(lines).filter(r => r.sp === 'torsk').reduce((a, r) => a + r.sum, 0); coopKr = Math.round(COOP.share * onP * codGross / Math.max(1, codKg)); }
  q.torsk += codQ; q.hyse += kgOf('hyse') * (1 - (confBy.hyse || 0)); q.sei += kgOf('sei') * (1 - (confBy.sei || 0)); q.byCod = (q.byCod || 0) + byCod;
  if (acc !== 'none'){ q.ffTot += saleKg; q.ffCod += codFF; }
  if (acc === 'open') qyAt(H).me += codQ / 1000;   // your landings count in the open group's catch (03d-quota.js) q.conf += confKg + crabSmall; q.confKr += confKr + crabKr;
  const arr = Object.values(lines).sort((a, c) => ALLSP.indexOf(a.sp) - ALLSP.indexOf(c.sp) || a.c - c.c || 'EABXV'.indexOf(a.g) - 'EABXV'.indexOf(c.g));
  // lott goes to those who were aboard; a crew member given time off gets none for this trip
  const aboardNow = crewAboard(), lott = Math.round(aboardNow.reduce((a, c) => a + c.share, 0) * total);
  for (const c of aboardNow) c.earn = (c.earn || []).filter(e => e[0] > S.t - 7 * 1440).concat([[S.t, total * c.share]]);
  for (const c of S.crew) c.off = false;
  if (meAboard()) fmLand(total);
  S.cash += total - lott - coopKr; S.stats.revenue += total; S.stats.costs += lott + coopKr;
  if (coopKr > 0) log(S.lic.coop.name + ' fikk ' + kr(coopKr) + ' for torsken på kvoten hans.', S.lic.coop.name + ' got ' + kr(coopKr) + ' for the cod on his quota.'); S.stats.kg += kg; S.hold = [];
  const fs = S.marks.length ? S.marks[S.marks.length - 1] : null, field = fieldCode(S.fsess || fs || b.pos);
  // the whole landing note goes with the sale, for the deck log's Salg tab (ui/06b-book-tabs.js)
  S.saleSeq = (S.saleSeq || 0) + 1;
  const det = {id:S.saleSeq, ln:arr.map(r => [r.sp, r.c, r.g, r.gut ? 1 : 0, Math.round(r.kg * 10) / 10, r.sum, Math.round(r.n || 0)]), ex:Object.fromEntries(Object.entries(ex).map(([n, v]) => [n, [Math.round(v.kg * 10) / 10, v.sum]])),
    st:[stPct, stKr], ord:ordKr, conf:[Math.round(confKg), confKr, Math.round(crabSmall * 10) / 10, crabKr], roe:roeCut, crew:aboardNow.map(c => [c.name, c.share]), lott, fine:0};
  S.sales.push({t:S.t, v:S.cur, port:port.id, kg:Math.round(kg), total, sp:ALLSP.map(sp => [sp, Math.round(arr.filter(r => r.sp === sp).reduce((a, r) => a + r.kg, 0))]).filter(r => r[1] > 0), d:det}); if (S.sales.length > 200) S.sales.shift();
  // older notes keep their sums only, so the save stays small
  for (let i = 0; i < S.sales.length - 60; i++) delete S.sales[i].d;
  if (lott > 0){ log('Mannskapet fikk ' + kr(lott) + ' i lott.', 'The crew received ' + kr(lott) + ' as their share.'); crewSay(null, 'payday'); }
  if (codFF > 0.5) log(Math.round(codFF) + ' kg torsk gikk på ferskfisktillegget.', Math.round(codFF) + ' kg of cod went on the fresh-fish allowance.');
  const vt = S.fleet && S.fleet.length > 1 ? '«' + S.boatName + '»: ' : '';
  if (acc === 'none' && confKg > 0.5) msg('Norges Råfisklag', vt + 'Båten har ikke adgang til å fiske torsk, hyse og sei. Av disse kan bare 10 % av landingen være bifangst, og høyst ' + fmt(BYCATCH.cod / 1000, 0) + ' tonn torsk i året. ' + Math.round(confKg) + ' kg er inndratt, verdi ' + kr(confKr) + '.', vt + 'The boat has no access to fish cod, haddock and saithe. Only 10% of the landing may be bycatch of these, and at most ' + fmt(BYCATCH.cod / 1000, 0) + ' t of cod a year. ' + Math.round(confKg) + ' kg has been confiscated, worth ' + kr(confKr) + '.');
  else if (acc === 'lukket' && confKg - codConf > 0.5) msg('Norges Råfisklag', vt + 'Maksimalkvoten for hyse eller sei er fisket, og etter den kan bare 30 % hyse og 20 % sei være bifangst i hver landing. ' + Math.round(confKg) + ' kg er inndratt, verdi ' + kr(confKr) + '.', vt + 'The maximum quota for haddock or saithe is fished, and after it only 30 % haddock and 20 % saithe may be bycatch in each landing. ' + Math.round(confKg) + ' kg is confiscated, worth ' + kr(confKr) + '.');
  else if (codConf > 0.5) msg('Norges Råfisklag', vt + 'Du hadde ikke torskekvote igjen for ' + Math.round(codConf) + ' kg torsk. Verdien, ' + kr(confKr) + ', er inndratt.', vt + 'You had no cod quota left for ' + Math.round(codConf) + ' kg of cod. Its value, ' + kr(confKr) + ', has been confiscated.');
  // an undersized-crab landing is a breach of the minimum size (høstingsforskriften kap. X); the fee is a placeholder
  let crabFine = 0; if (crabSmall > 0.01){ crabFine = GFINE.crab + GFINE.perCrab * Math.round(crabSmallN); det.fine = crabFine; S.cash -= crabFine; S.stats.costs += crabFine; msg('Fiskeridirektoratet', vt + 'Landingen hadde ' + fmt(crabSmall, 1) + ' kg taskekrabbe under minstemålet på 13 cm. Krabben er inndratt, og du får et overtredelsesgebyr på ' + kr(crabFine) + '.', vt + 'The landing had ' + fmt(crabSmall, 1) + ' kg of brown crab under the 13 cm minimum size. The crab is confiscated and you are fined ' + kr(crabFine) + '.'); }
  if (roeCut > 0.5) msg(port.name, 'Det var rognkrabbe i leveransen. Vi trekker 10 % på krabben, ' + kr(roeCut) + ', for dårlig sortering.', 'There was berried crab in the delivery. We take 10 % off the crab, ' + kr(roeCut) + ', for poor sorting.');
  // confKg and confKr count all that was confiscated (crab too); codKg and codKr are the cod, haddock and saithe rows on the note
  S.lastSale = {port:port.id, t:S.t, lines:arr, total, ex, confKg:confKg + crabSmall, confKr:confKr + crabKr, codKg:confKg, codKr:confKr, crabKg:crabSmall, crabKr, ordKr, ffKg:codFF, field, lott, ord:ordLines, acc, crabFine, roeCut, streak:{pct:stPct, kr:stKr}, gear:Object.keys(b.tripGear || {})}; b.tripGear = {};
  tatLanding(port.id); checkTattoos();
  if (S.tut && S.tut.catch) S.tut.catch = false;   // the first-trip guarantee ends with the first landing
  for (const x of S.hold) delete x._used;
  log('Leverte ' + Math.round(kg) + ' kg i ' + port.name + ' for ' + kr(total) + '.', 'Landed ' + Math.round(kg) + ' kg at ' + port.name + ' for ' + kr(total) + '.');

}

// ---------- modal ----------
function modal(html){ const m = $('modal'); m.innerHTML = '<div class="box" role="dialog" aria-modal="true">' + html + '</div>'; m.hidden = false; const b = m.querySelector('[data-close]'); if (b){ b.onclick = () => { m.hidden = true; }; b.focus(); } }
// «#notut» in the address starts a new game without the first-trip tutorial (the automated tests use it)
const NOTUT = /notut/.test(location.hash);
function showIntro(namesOnly){
  const L = (no, en) => S.lang === 'no' ? no : en;
  modal('<div class="ob"><h2>' + (namesOnly ? L('Gi båten et navn', 'Name your boat') : t('intro_h')) + '</h2>' + (namesOnly ? '<p>' + L('Dekksdagboka trenger et båtnavn.', 'The deck log needs a boat name.') + '</p>' : '<p>' + t('intro1') + '</p>') +
    '<label for="obCo">' + L('Firmanavn', 'Company name') + '</label><input id="obCo" maxlength="28" autocomplete="off" placeholder="' + L('F.eks. Senja Kystfiske', 'e.g. Senja Coastal Fishing') + '" value="' + (S.company || '').replace(/"/g, '') + '">' +
    '<label for="obBoat">' + L('Båtens navn', 'Boat name') + '</label><input id="obBoat" maxlength="20" autocomplete="off" placeholder="' + L('F.eks. Havbris', 'e.g. Havbris') + '" value="' + (S.boatName || '').replace(/"/g, '') + '">' +
    (namesOnly ? '' : '<p>' + t('intro2') + '</p><p class="note">' + t('intro3') + '</p>') + '<div class="btns"><button class="btn primary" data-close id="obGo">' + t('intro_go') + '</button></div></div>');
  $('obGo').addEventListener('click', () => {
    const co = $('obCo').value.trim().slice(0, 28), bn = $('obBoat').value.trim().slice(0, 20);
    S.company = co || L('Senja Kystfiske', 'Senja Coastal Fishing'); S.boatName = bn || 'Havbris';
    if (!S.intro){ S.tut = NOTUT ? 0 : tutNew(); log('Overtok «' + S.boatName + '» i Finnsnes for ' + S.company + '.', 'Took over the «' + S.boatName + '» in Finnsnes for ' + S.company + '.'); }
    S.intro = true; save(); refreshAll();
  });
}
function showAway(mins, fromIdx){
  const ev = S.log.slice(fromIdx);
  modal('<h2>' + t('away') + '</h2><p class="note">' + t('away_n', dur(mins / 60)) + '</p>' + (ev.length ? '<ul class="log">' + ev.map(e => '<li><time>' + hm(e.t / 60) + '</time><span>' + (S.lang === 'no' ? e.no : e.en) + '</span></li>').join('') + '</ul>' : '') + '<div class="btns"><button class="btn primary" data-close>' + t('ok') + '</button></div>');
}

// ---------- time ----------
const CATCHUP_CAP = 72 * 60;
// Game minutes are played only while every vessel's waters are loaded (simAreaReady, 01b-mapdata.js): what is left waits in
// CATCH_LEFT and is played by the tick once the packs are in, so a slow network makes the clock wait, never guess.
let CATCH_LEFT = 0;
function playMinutes(n){ let i = 0; for (; i < n; i++){ if (!simAreaReady()){ CATCH_LEFT += n - i; break; } step(); } return i; }
function catchUp(realMs){
  const mins = Math.min(CATCHUP_CAP, Math.floor(realMs / 1000 / 60 * GAME_RATE));
  if (mins < 1) return;
  const idx = S.log.length;
  playMinutes(mins);
  panelDirty = true;
  if (mins >= 10) showAway(mins, idx);
  if (realMs >= 5 * 60000) WAKE_BACK = true;
}
let lastWall = Date.now(), acc = 0, lastPanel = 0, lastSave = 0, WAKE_BACK = false;
function tick(){
  const now = Date.now(), dt = (now - lastWall) / 1000; lastWall = now;
  // (until the simulation's data is in, the clock waits: 11-boot.js)
  if (SIMREADY){ if (CATCH_LEFT > 0){ const n = Math.min(CATCH_LEFT, 3000); CATCH_LEFT -= n; playMinutes(n); panelDirty = true; } else if (dt > 6) catchUp(dt * 1000); else { if (helmOn() && !sleepAlone()) helmStep(dt); acc += dt * simRate() / 60; let n = 0; while (acc >= 1 && n < 3000 && simAreaReady()){ step(); acc -= 1; n++; } } }
  if (WAKE_BACK && !CATCH_LEFT){ WAKE_BACK = false; if (asleep()) wakeEarly(true); }
  heatTick();
  if (!G3.isActive()){ renderDyn(); if (AISSEL) renderAisCard(); heatPaint(); } renderHud(); renderClock(); renderActs(); DOCK.tick(); HUI.tick(); energyUi(); INSTR.renderGPS(); renderRouteTools(); tutUpdate(); PHONE.status(); PHONE.tickHome();
  if (S.order && S.t >= S.order.due) deliverOrder();
  // the chart's night colours follow the sun: drawn again when they change
  if (S.t !== CHN.t){ CHN.t = S.t; if (chartNight() !== CHN.v && document.body.classList.contains('vplot')) renderBase(); }
  const pnow = performance.now();
  if ((panelDirty || pnow - lastPanel > 1000) && !panelBusy()){ renderPanel(); lastPanel = pnow; panelDirty = false; }
  if (now - lastSave > 5000){ save(); lastSave = now; if (streakTouch()) refreshAll(); }
}
// the yard hands over a new build in Finnsnes: in exchange for the vessel it was ordered against (once she is moored there), or as an
// extra vessel for the fleet (vid null)
function deliverOrder(){
  const o = S.order, k = o.type, tv = o.vid === null ? null : vesselById(o.vid || S.cur);
  if (!tv){ S.order = null; const v = newVesselObj(k, 'finnsnes'); log('Overtok ' + VESSELS[k].name.no + ' fra verftet. Hun heter «' + v.boatName + '» og ligger i Finnsnes.', 'Took delivery of the ' + VESSELS[k].name.en + ' from the yard. She is called «' + v.boatName + '» and lies in Finnsnes.');
    msg('Verftet', 'Den nye båten, «' + v.boatName + '», er levert og ligger klar i Finnsnes.', 'The new vessel, the «' + v.boatName + '», has been delivered and is ready in Finnsnes.'); save(); return; }
  const b = vget(tv, 'boat'); if (b.status !== 'port' || b.port !== 'finnsnes') return;
  S.order = null; onVessel(tv, () => PHONE.switchVessel(k)); save();
}
document.addEventListener('visibilitychange', () => { if (document.hidden) save(); });
window.addEventListener('pagehide', save);

// ---------- chrome ----------
function applyLang(){
  document.documentElement.lang = S.lang === 'no' ? 'no' : 'en';
  document.querySelectorAll('[data-t]').forEach(el => el.textContent = t(el.dataset.t));
  { const o = $('pace').options; o[0].textContent = t('pace1'); for (let i = 1; i < o.length; i++) o[i].textContent = fmt(GAME_RATE * +o[i].value) + '×'; }
  $('lang').textContent = S.lang === 'no' ? 'EN' : 'NO';
  $('bkToday').textContent = t('today'); $('logbook').setAttribute('aria-label', S.lang === 'no' ? 'Dekksdagbok' : 'Deck log');
  document.querySelector('#plotTop .pt-title').textContent = S.lang === 'no' ? 'Kartplotter' : 'Chart plotter';
  $('view3d').textContent = (typeof G3 !== 'undefined' && G3.isActive()) ? t('view_chart') : '3D';
  $('lang').setAttribute('aria-label', S.lang === 'no' ? 'Switch to English' : 'Bytt til norsk');
  $('zin').setAttribute('aria-label', t('zin')); $('zout').setAttribute('aria-label', t('zout')); $('zboat').setAttribute('aria-label', t('zboat'));
  svg.setAttribute('aria-label', S.lang === 'no' ? 'Sjøkart over Senja' : 'Chart of Senja');
}
$('view3d').onclick = () => G3.toggle();
// ---------- screens: full-screen 3D, or the chart plotter for route planning ----------
function setBodyView(v3d){ document.body.classList.remove('drawer'); if (v3d) plotSetOpen(false); document.body.classList.toggle('v3d', v3d); document.body.classList.toggle('vplot', !v3d); }
// the chart plotter opens on the boat, PLOT_KM km of chart from top to bottom (the user's wish 02.10.2026); it is opened from the
// little chart in 3D (#miniPlot, ui/03e-miniplot.js), the dock's Auto-nav and the tutorial
const PLOT_KM = 6;
function openPlotter(){
  const p = S.boat.pos; view.cx = p.x; view.cy = p.y; view.z = MAP_H / PLOT_KM;
  if (G3.isActive()) G3.show(false); else { setBodyView(false); tab = 'route'; renderPanel(); applyView(); renderStatic(); renderDyn(); }
}
// «Innstillinger» in the top bar: the chart's and the echo sounder's settings, which were at the top of the side panel
function plotSetRender(){
  const el = $('plotSet'); if (el.hidden) return;
  el.innerHTML = '<div class="ps-h"><b>' + (S.lang === 'no' ? 'Kartplotter og ekkolodd' : 'Chart plotter and echo sounder') + '</b><button type="button" data-x aria-label="Lukk">✕</button></div>' + chartSettings() + heatReadout();
}
function plotSetOpen(on){ const el = $('plotSet'); el.hidden = !on; $('ecSet').classList.toggle('on', on); plotSetRender(); }
$('ecSet').onclick = () => plotSetOpen($('plotSet').hidden);
$('plotSet').addEventListener('click', e => { if (e.target.closest('[data-x]')){ plotSetOpen(false); return; } const el = e.target.closest('[data-act]'); if (el && !el.disabled){ doAct(el); plotSetRender(); } });
$('plotClose').onclick = () => G3.show(true);
$('ecClose').onclick = () => G3.show(true);
$('ecRoute').onclick = () => document.body.classList.toggle('drawer');
$('camBtn').onclick = () => { if (G3.kino()) G3.kino(false); G3.setHelm(!G3.isHelm()); kinoUi(); updateMapButtons(); };
// the cinema (view3d.js KINO): the camera films the trip by itself; «Skjul» hides everything on the screen but these two buttons
function kinoUi(){ const on = G3.kino(); $('kinoBtn').classList.toggle('on', on); $('kinoHud').hidden = !on; if (!on) document.body.classList.remove('kino-clean');
  $('kinoHud').textContent = document.body.classList.contains('kino-clean') ? (S.lang === 'no' ? 'Vis' : 'Show') : (S.lang === 'no' ? 'Skjul' : 'Hide'); }
$('kinoBtn').onclick = () => { G3.kino(!G3.kino()); kinoUi(); };
$('kinoHud').onclick = () => { document.body.classList.toggle('kino-clean'); kinoUi(); };
$('phoneFab').onclick = () => PHONE.toggle();
$('plotStyle').onclick = () => {};
hooks.on3dFail = () => { setBodyView(false); $('loader').classList.add('gone'); $('plotClose').hidden = true; tab = 'route'; renderPanel(); applyView(); renderStatic(); renderDyn(); };
