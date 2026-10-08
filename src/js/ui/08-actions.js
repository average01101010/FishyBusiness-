// actions
panel.addEventListener('pointerdown', () => { pressHold = true; });
window.addEventListener('pointerup', () => { setTimeout(() => { pressHold = false; }, 250); });
panel.addEventListener('click', e => { const el = e.target.closest('[data-act]'); if (el && !el.disabled) doAct(el); });
function doAct(el){
  const act = el.dataset.act, i = +el.dataset.i, b = S.boat, L = (no, en) => S.lang === 'no' ? no : en;
  if (act === 'gset' || act === 'ghaul' || act === 'gstop') gearDoAct(act, el);
  // every change to the draft is a step in the route history (03b-route.js)
  else if (act === 'gwp'){ draftEdit(() => gearDoAct(act, el)); const rb = ruWpMsg(S.draft[i]); if (rb) toast(rb); }
  else if (act === 'fp' || act === 'fm'){ const w = S.draft[i], f0 = w ? w.fish || 0 : 0; draftEdit(() => { if (w) w.fish = clamp((w.fish || 0) + (act === 'fp' ? 1 : -1), 0, 12); });
    if (w && !f0 && w.fish > 0){ const rb = ruWpMsg(w); if (rb) toast(rb + L(' Båten vil vente der uten å fiske.', ' The boat will wait there without fishing.')); } }
  else if (act === 'rm') draftEdit(() => S.draft.splice(i, 1));
  else if (act === 'undo') draftUndo();
  else if (act === 'redo') draftRedo();
  else if (act === 'clear') draftEdit(() => { S.draft = []; });
  else if (act === 'start'){
    if (!S.draft.length || !['port', 'idle'].includes(b.status)) return;
    if (!tutAllow('start')) return;
    if (!el.dataset.ruok && !tutOn()){ const bad = S.draft.map((w, k) => [k, ruWpMsg(w)]).filter(x => x[1]);
      if (bad.length){ modal('<h3>' + L('Reglene stopper båten på ruta', 'The rules stop the boat on the route') + '</h3>' + bad.map(([k, m]) => '<p class="bad"><b>' + wpName(k + 1) + ':</b> ' + m + '</p>').join('') +
        '<p class="note">' + L('Der venter båten uten å fiske eller sette redskap. Flytt punktet, eller kast loss likevel.', 'There the boat waits without fishing or setting gear. Move the point, or cast off anyway.') + '</p>' +
        '<div class="btns"><button class="btn primary" data-close>' + L('Endre ruta', 'Change the route') + '</button><button class="btn" id="ruGo">' + L('Kast loss likevel', 'Cast off anyway') + '</button></div>');
        $('ruGo').onclick = () => { $('modal').hidden = true; doAct({dataset:{act:'start', ruok:'1'}, disabled:false}); }; return; } }
    if (!meAboard() && !crewAboard().length){ toast(L('Båten har ikke mannskap. Uten deg om bord trenger den folk.', 'The boat has no crew. Without you aboard it needs hands.')); return; }
    const later = S.draftDep && S.draftDep > S.t ? S.draftDep : null;
    if (!later && b.status === 'port' && S.jobs && S.jobs.length){ toast(t('yard_busy', hm((jobsDone() || S.t) / 60))); return; }
    S.plan = {wps:S.draft.map(w => ({...w})), idx:0, speed:S.draftSpeed, returning:false, depAt:later, unsafe:draftHazards().map(h => h.unsafe)};
    S.draft = []; S.draftDep = null; draftForget();
    if (later) log('Avgang planlagt ' + dayStr(later / 60) + ' kl. ' + hm(later / 60) + '.', 'Departure planned for ' + dayStr(later / 60) + ' at ' + hm(later / 60) + '.');
    else { if (b.status === 'idle') log('Ny rute satt.', 'New route set.'); depart();
      const W = windAt(S.t / 60); if (S.settings.autoOn && W > S.settings.autoW) log('Det blåser ' + W.toFixed(0) + ' m/s, over grensen for å snu. Båten snur ikke av seg selv før vinden har løyet.', 'It blows ' + W.toFixed(0) + ' m/s, over the turn-back limit. The boat will not turn back by itself until the wind has eased.'); }
    // the chart plotter stays open: the skipper goes back to 3D himself (the user's wish 02.10.2026)
  }
  else if (act === 'depnow'){ if (!S.plan) return; if (b.status === 'port' && S.jobs && S.jobs.length){ toast(t('yard_busy', hm((jobsDone() || S.t) / 60))); return; } if (!meAboard() && !crewAboard().length){ toast(L('Båten har ikke mannskap. Uten deg om bord trenger den folk.', 'The boat has no crew. Without you aboard it needs hands.')); return; } depart(); if (!G3.isActive()) G3.show(true, true); }
  else if (act === 'cn'){ S.settings.chartNight = el.dataset.m; renderBase(); scheduleStatic(); if (typeof MINIP !== 'undefined') MINIP.key = ''; }
  else if (act === 'rl'){ S.settings.ruleLayer = el.dataset.m === 'on'; renderBase(); scheduleStatic(); paintChart(1); }
  else if (act === 'cm'){ const m = el.dataset.m; if (m === 'fish' && !S.equip.plotter){ toast(t('need_plotter')); PHONE.open('utstyrb'); return; } S.settings.chart = m; renderBase(); scheduleStatic(); }
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
    toast(S.lang === 'no' ? 'Lagret som fast driftsplan. Slå den på under Mannskap.' : 'Saved as the standing plan. Switch it on under Crew.'); if (typeof DOCK !== 'undefined' && DOCK.open) DOCK.open('arbeid'); else PHONE.open('mannskap');
  }
  else if (act === 'depcancel'){ S.plan = null; log('Avgangen er avlyst.', 'Departure cancelled.'); }
  else if (act === 'stop'){
    // on a route she slacks off and stops a little ahead on it (core haltPlan); by hand, or already slacking off, she stops here
    const h = !helmOn() && S.plan && !S.plan.halt ? haltPlan(G3.haltNeed()) : null;
    if (h){ S.plan = h; log('Slakker av og stopper.', 'Easing off to a stop.'); }
    else if (!(S.plan && S.plan.halt && b.status === 'sailing')){ S.plan = null; helmOff(); b.status = 'idle'; b.v = 0; log('Stoppet båten.', 'Stopped the boat.'); }
  }
  else if (act === 'retrace'){ if (tutOn()) return; startReturn(false); }
  else if (act === 'tow') rescue(true);
  else if (act === 'fh+' || act === 'fh-') S.fishPlanH = clamp(S.fishPlanH + (act === 'fh+' ? 1 : -1), 1, 12);
  else if (act === 'startfish'){ if (!rigJig()){ const w = rigWrong(null); toast(w[0]); return; }
    // there is no rod: without a hand jig, reels or halibut gear for halibut nobody can fish
    if (!b.gear && !(S.equip && S.equip.jukse > 0) && !(S.target === 'kveite' && b.kgear)){ toast(L('Du har ingen juksa. Kjøp håndjuksa i butikken på kaia.', 'You have no jig. Buy a hand jig in the shop on the quay.')); return; } { const rb = ruBlockMsg({p:b.pos, len:BOAT.len, gear:'juksa', sp:S.target === 'kveite' ? 'kveite' : null, hand:!(S.equip && S.equip.jukse > 0)}); if (rb){ toast(rb); return; } } b.status = 'fishing'; b.fishUntil = S.t + S.fishPlanH * 60; log('Starter fiske i ' + S.fishPlanH + ' t.', 'Fishing for ' + S.fishPlanH + ' h.'); }
  else if (act === 'stopfish'){ if (b.gop) gopAbort('stop'); b.fishUntil = S.t; S.plan = null; endFishing('done'); }
  else if (act === 'deckstop'){ if (b.status === 'fishing'){ b.deckStop = true; log('Stopper fisket for å sløye og ise.', 'Stopping fishing to gut and ice.'); } }
  else if (act === 'deckgo'){ b.deckStop = false; b.deckEnd = null; }
  else if (act === 'sell'){ if (!tutAllow('sell')) return; if (berthKind(b) === 'naust'){ toast(L(NAUST_SAIL[0], NAUST_SAIL[1])); return; } if (!mottakOpen(S.t / 60)){ toast(L('Mottaket er stengt. Det åpner ', 'The plant is closed. It opens ') + mottakWhen(S.t / 60, S.lang === 'no') + '.'); return; } startLanding(false); }
  else if (act === 'rest'){ const why = restStart(); if (why){ toast(L(why[0], why[1])); return; } }
  else if (act === 'restend') restEnd();
  else if (act === 'fuel'){ if (S.cash <= 0){ toast(t('no_cash')); return; } if (berthKind(b) === 'naust'){ toast(L(NAUST_SAIL[0], NAUST_SAIL[1])); return; } startFueling(false); }
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
  if (id === 'autoTo') S.settings.autoTo = e.target.value === 'home' ? 'home' : 'near';
  if (id === 'dep'){ S.draftDep = e.target.value ? +e.target.value : null; e.target.blur(); }
  e.target.blur && e.target.type === 'range' && e.target.blur();
  panelDirty = true; save();
}
panel.addEventListener('input', panelInput);
panel.addEventListener('change', panelChange);
// what the sales organisation confiscates of the hold if it is landed now (cod beyond the fresh-fish allowance and the quota, bycatch
// over its limits): the share of each species. Apart from sell() so the quay can show it before you land (R4); q is not changed
function landConf(H, q, acc){
  const kgOf = sp => S.hold.filter(x => x.sp === sp).reduce((a, x) => a + x.kg, 0), wk = weekOfH(H), ffTot = q.ffW === wk ? q.ffTot : 0, ffCod = q.ffW === wk ? q.ffCod : 0;
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
    const pct = ffPct(H), ffAllow = pct ? Math.max(0, pct * (ffTot + saleKg) - ffCod) : 0;
    codFF = Math.min(codKg, ffAllow); codQ = Math.min(codKg - codFF, codRoom(H)); codConf = codKg - codFF - codQ;
    if (codKg > 0 && codConf > 0) confBy.torsk = codConf / codKg;
    // the closed group's haddock and saithe: the maximum quota, then up to 30 % haddock and 20 % saithe as bycatch in each landing
    // (J-161-2026 §§ 18 and 19); the rest is confiscated
    if (acc === 'lukket'){ const LQ = licQ(S.lic, H), all = holdTotal();
      for (const [sp, share] of [['hyse', 0.3], ['sei', 0.2]]){ const k = kgOf(sp), ok = Math.min(k, Math.max(LQ[sp][0] - q[sp], share * all)); if (k > 0 && ok < k - 0.01) confBy[sp] = 1 - Math.max(0, ok) / k; } }
  }
  // Greenland halibut: the maximum quota in the direct fishery, otherwise at most 7 % of the week's landings (03d-quota.js bkAllow)
  const bkKg = kgOf('blakveite'), bkOk = bkKg > 0 ? bkAllow(H, bkKg, holdTotal()) : 0;
  if (bkKg > 0 && bkOk < bkKg - 0.01) confBy.blakveite = 1 - bkOk / bkKg;
  return {saleKg, codKg, confBy, codFF, codQ, codConf, byCod, bkOk};
}
function sell(){
  const b = S.boat, port = portById(b.port); if (!port || !port.mottak) return;
  const H = S.t / 60, q = quotaState(), lines = {}, extra = [], acc = access(), kgOf = sp => S.hold.filter(x => x.sp === sp).reduce((a, x) => a + x.kg, 0);
  let kg = 0;
  const wk = weekOfH(H); if (q.ffW !== wk){ q.ffW = wk; q.ffTot = 0; q.ffCod = 0; }
  const {saleKg, codKg, confBy, codFF, codQ, codConf, byCod, bkOk} = landConf(H, q, acc);
  // The landing note lists each lot at its full value and takes what is confiscated off in rows of its own; every row is whole
  // kroner and the total is the sum of the rows, so the note adds up and the cash gets exactly the total less the crew's share.
  let confKr = 0, confKg = 0, crabKr = 0, ordKr = 0, crabSmall = 0, crabDead = 0;
  for (const x of S.hold){
    const sp = x.sp, sd = SPECIES[sp], c = x.cls != null ? x.cls : sd.ref, g = grade(x.fresh);
    // king crab is paid by class while it lives (no grades), and nothing once dead (Råfisklaget: dead crab 0 kr)
    const deadKC = sp === 'krabbe' && (x.fresh || 0) < KC.dead;
    let ppk = sp === 'krabbe' ? (deadKC ? 0 : clsPrice(port, sp, c, H, false)) : g === 'V' ? 1 : clsPrice(port, sp, c, H, x.hook) * GM[g];
    if (x.gut && (sp === 'hyse' || sp === 'sei')) ppk += 0.30;           // no gutting fee deducted
    let v = x.kg * ppk, gross = v;
    if (deadKC) crabDead += x.kg;
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
  const roeCut = 0; confKr = Math.round(confKr); crabKr = Math.round(crabKr);
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
  if (acc === 'open') qyAt(H).me += codQ / 1000;   // your landings count in the open group's catch (03d-quota.js)
  bkLanded(H, bkOk || 0, holdTotal());   // the Greenland halibut's maximum quota and the week's 7 %
  { const ks = {}; for (const x of S.hold) ks[x.sp] = (ks[x.sp] || 0) + x.kg; wshLand(port.id, H, acc, ks, codQ); if (WSH.rec) setTimeout(worldShare, 4000); }   // for the other players
  q.conf += confKg + crabSmall; q.confKr += confKr + crabKr;
  const arr = Object.values(lines).sort((a, c) => ALLSP.indexOf(a.sp) - ALLSP.indexOf(c.sp) || a.c - c.c || 'EABXV'.indexOf(a.g) - 'EABXV'.indexOf(c.g));
  // lott goes to those who were aboard; a crew member given time off gets none for this trip
  // the sales organisation's deductions (TREKK) come off the value first; the crew's share is reckoned on what is left
  const tk = trekkOf(total, BOAT.len || 0), net = total - tk.sum;
  // VAT on the sale once the business is in the VAT register: it comes with the settlement and goes straight on to the state
  mvaCheck(total); const mva = S.mva ? mvaOf(total, tk) : 0;
  // those on hyre have their day wage (payHyre) and no share
  const aboardNow = crewAboard().filter(c => c.pay !== 'hyre'), lott = Math.round(aboardNow.reduce((a, c) => a + c.share, 0) * net);
  for (const c of aboardNow) c.earn = (c.earn || []).filter(e => e[0] > S.t - 7 * 1440).concat([[S.t, net * c.share]]);
  // back aboard after the trip they sat out; not at a landing that was still going when they were given time off, which put them
  // straight back aboard for the next trip (tilbakemelding #32)
  for (const c of S.crew) if (c.offTrip){ c.off = false; delete c.offTrip; }
  if (meAboard()) fmLand(total);
  fsLand(total);   // sea time for the landing (core/09e-fartstid.js)
  nameNudge();     // naming the boat without the cloud, after the second landing (ui/10f-cloud.js)
  S.landN = (S.landN || 0) + 1;   // the landings, for a guest's papers (ui/10f-cloud.js: registering after the second)
  achSale(total, Object.values(lines).map(r => r.sp));   // the badges (core/09f-merker.js)
  { const by = {}; for (const r of arr) by[r.sp] = (by[r.sp] || 0) + r.kg; turSale(port.id, by); }   // missions (core/09g-turer.js)
  S.cash += net - lott - coopKr; S.stats.revenue += total; S.stats.costs += tk.sum + lott + coopKr;
  if (coopKr > 0) log(S.lic.coop.name + ' fikk ' + kr(coopKr) + ' for torsken på kvoten hans.', S.lic.coop.name + ' got ' + kr(coopKr) + ' for the cod on his quota.'); S.stats.kg += kg; S.hold = [];
  const fs = S.marks.length ? S.marks[S.marks.length - 1] : null, field = fieldCode(S.fsess || fs || b.pos);
  // the whole landing note goes with the sale, for the deck log's Salg tab (ui/06b-book-tabs.js)
  S.saleSeq = (S.saleSeq || 0) + 1;
  const det = {id:S.saleSeq, ln:arr.map(r => [r.sp, r.c, r.g, r.gut ? 1 : 0, Math.round(r.kg * 10) / 10, r.sum, Math.round(r.n || 0)]), ex:Object.fromEntries(Object.entries(ex).map(([n, v]) => [n, [Math.round(v.kg * 10) / 10, v.sum]])),
    st:[stPct, stKr], ord:ordKr, conf:[Math.round(confKg), confKr, Math.round(crabSmall * 10) / 10, crabKr], roe:roeCut, crew:aboardNow.map(c => [c.name, c.share]), lott, fine:0, tk:[tk.lag, tk.pens, tk.prod, tk.forsk, tk.ress, tk.ktrl], mva};
  folkSold(port.id, kg);   // the plant's manager keeps count (09d-folk.js)
  S.sales.push({t:S.t, v:S.cur, port:port.id, kg:Math.round(kg), total, sp:ALLSP.map(sp => [sp, Math.round(arr.filter(r => r.sp === sp).reduce((a, r) => a + r.kg, 0))]).filter(r => r[1] > 0), d:det}); if (S.sales.length > 200) S.sales.shift();
  // older notes keep their sums only, so the save stays small
  for (let i = 0; i < S.sales.length - 60; i++) delete S.sales[i].d;
  if (lott > 0){ log('Mannskapet fikk ' + kr(lott) + ' i lott.', 'The crew received ' + kr(lott) + ' as their share.'); crewSay(null, 'payday'); }
  if (codFF > 0.5) log(Math.round(codFF) + ' kg torsk gikk på ferskfisktillegget.', Math.round(codFF) + ' kg of cod went on the fresh-fish allowance.');
  const vt = S.fleet && S.fleet.length > 1 ? '«' + S.boatName + '»: ' : '';
  if (acc === 'none' && confKg > 0.5) msg('Norges Råfisklag', vt + 'Båten har ikke adgang til å fiske torsk, hyse og sei. Av disse kan bare 10 % av landingen være bifangst, og høyst ' + fmt(BYCATCH.cod / 1000, 0) + ' tonn torsk i året. ' + Math.round(confKg) + ' kg er inndratt, verdi ' + kr(confKr) + '.', vt + 'The boat has no access to fish cod, haddock and saithe. Only 10% of the landing may be bycatch of these, and at most ' + fmt(BYCATCH.cod / 1000, 0) + ' t of cod a year. ' + Math.round(confKg) + ' kg has been confiscated, worth ' + kr(confKr) + '.');
  else if (acc === 'lukket' && confKg - codConf > 0.5) msg('Norges Råfisklag', vt + 'Maksimalkvoten for hyse eller sei er fisket, og etter den kan bare 30 % hyse og 20 % sei være bifangst i hver landing. ' + Math.round(confKg) + ' kg er inndratt, verdi ' + kr(confKr) + '.', vt + 'The maximum quota for haddock or saithe is fished, and after it only 30 % haddock and 20 % saithe may be bycatch in each landing. ' + Math.round(confKg) + ' kg is confiscated, worth ' + kr(confKr) + '.');
  else if (codConf > 0.5) msg('Norges Råfisklag', vt + 'Du hadde ikke torskekvote igjen for ' + Math.round(codConf) + ' kg torsk. Verdien, ' + kr(confKr) + ', er inndratt.', vt + 'You had no cod quota left for ' + Math.round(codConf) + ' kg of cod. Its value, ' + kr(confKr) + ', has been confiscated.');
  const crabFine = 0;
  if (crabDead > 0.05) msg(port.name, vt + fmt(crabDead, 1) + ' kg av kongekrabben var død og er vraket. Død krabbe betales ikke. Et krabbekar med sjøvann holder den levende i flere døgn.', vt + fmt(crabDead, 1) + ' kg of the king crab was dead and has been discarded. Dead crab is not paid for. A live crab tank keeps it alive for days.');
  // confKg and confKr count all that was confiscated (crab too); codKg and codKr are the cod, haddock and saithe rows on the note
  S.lastSale = {port:port.id, t:S.t, lines:arr, total, ex, confKg:confKg + crabSmall, confKr:confKr + crabKr, codKg:confKg, codKr:confKr, crabKg:crabSmall, crabKr, crabDead, ordKr, ffKg:codFF, field, lott, tk, mva, ord:ordLines, acc, crabFine, roeCut, streak:{pct:stPct, kr:stKr}, gear:Object.keys(b.tripGear || {})}; b.tripGear = {};
  tatLanding(port.id); checkTattoos();
  if (S.tut && S.tut.catch) S.tut.catch = false;   // the first-trip guarantee ends with the first landing
  for (const x of S.hold) delete x._used;
  log('Leverte ' + Math.round(kg) + ' kg i ' + port.name + ' for ' + kr(total) + '.', 'Landed ' + Math.round(kg) + ' kg at ' + port.name + ' for ' + kr(total) + '.');
  setTimeout(pushAsk, 3000);   // notifications, if the player has not been asked (10g-push.js)
  setTimeout(() => FEEDBACK.nudge('land'), 3500);   // the reminder of the feedback app and its thank-you, if no other window is up (06e-feedback.js)

}

// ---------- modal ----------
// every [data-close] button closes the dialog (the cloud's consent and save dialogs have two); the first one gets the focus
function modal(html){ const m = $('modal'); m.innerHTML = '<div class="box" role="dialog" aria-modal="true">' + html + '</div>'; m.hidden = false; const bs = m.querySelectorAll('[data-close]'); bs.forEach(b => { b.onclick = () => { m.hidden = true; }; }); if (bs[0]) bs[0].focus(); }
// «#notut» in the address starts a new game without the first-trip tutorial (the automated tests use it)
// «#notut» skips «Første tur» for the tests only (served from this machine): a player cannot skip it (Jonas 05.10.2026: «Spillere skal ikke
// kunne hoppe over tutorial. Hvert steg må gjennomføres»)
const NOTUT = /notut/.test(location.hash) && /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
// a new game: Father's letter first (ui/08b-letter.js; the tests with #notut go straight on), then where his boathouse stands, then the
// boat. She has no name yet (Jonas 07.10.2026: «La båten være navnløs inntil registrering. Det gir en følelse av eierskap når man får
// døpe en navnløs båt selv»): she goes by her registration mark until the player is in fiskermanntallet and names her (ui/10f-cloud.js).
// No company: a new player is a fisherman with a boat (Jonas 05.10.2026).
function boatUnnamed(){ S.unnamed = true; S.boatName = regText(regOf(S.boat)) || 'T-0-LK'; }
function boatChristen(nm){ nm = String(nm || '').trim().slice(0, 20); if (!nm) return false; const was = S.boatName; S.boatName = nm; delete S.unnamed;
  log('Døpte båten «' + nm + '». Navnet er malt på skroget.', 'Named the boat «' + nm + '». The name is painted on the hull.'); if (was !== nm) pressPut('name', {type:S.boat.type}); if (typeof loreRename === 'function') loreRename(nm); save(); refreshAll(); return was !== nm; }
function showIntro(namesOnly){
  const L = (no, en) => S.lang === 'no' ? no : en;
  if (!namesOnly && !NOTUT && !LETTER.read){ showLetter(() => { LETTER.read = true; showIntro(); }); return; }
  // then where Father's boathouse stands: the start along the coast (ui/08c-start.js)
  if (!namesOnly && !NOTUT && !S.intro && !S.home){ showStart(() => showIntro()); return; }
  if (!S.boatName || S.unnamed) boatUnnamed();
  modal('<div class="ob"><h2>' + L('Båten etter far', 'Father\'s boat') + '</h2><p>' + L('Båten har ikke noe navn på skroget ennå. Til da kjennes hun på registreringsmerket <b>' + S.boatName + '</b>. Du døper henne selv når du er ført i fiskermanntallet i eget navn.',
      'The boat has no name on her hull yet. Until then she goes by her registration mark <b>' + S.boatName + '</b>. You name her yourself once you are in the fishermen\'s register in your own name.') + '</p>' +
    '<div class="btns"><button class="btn primary" data-close id="obGo">' + L('Ta over båten', 'Take over the boat') + '</button></div></div>');
  $('obGo').addEventListener('click', () => {
    // the tests' games (#notut) skip the start and keep the old Senja start: the boat and Father's naust in Finnsnes
    if (!S.intro && NOTUT && !S.home) S.home = 'finnsnes';
    if (!S.intro){ S.tut = NOTUT ? 0 : tutNew(); log('Tok over båten etter far.', 'Took over Father\'s boat.'); }
    S.intro = true; save(); refreshAll(); achCheck();   // «Tok over båten» (core/09f-merker.js)
  });
}
// ---------- «Mens du var borte» (Jonas 07.10.2026: «en følelse av instant-belønning») ----------
// What the time away brought, gains only: one big number counting up (what was landed, or the sea time), the sea-time bar filling
// from where it was, tiles for the landings, the best landing and the rest built up, and the few things that happened. Nothing about
// what was missed, no countdown; a tap closes it. A short absence with nothing landed and no new year shows nothing.
let AWAYR = null;
function awayStart(mins, realMs){ AWAYR = {mins, realMs, idx:S.log.length, t0:S.t, rev:S.stats.revenue, kg:S.stats.kg, cash:S.cash, fs:fsState().p}; FS_AWAY = true; fsRested(realMs); }
function awayEnd(){ FS_AWAY = false; const A = AWAYR; AWAYR = null; if (A) showAway(A); }
function showAway(A){
  const en = S.lang === 'en', L2 = (no, e) => en ? e : no, F = fsState();
  const sales = S.sales.filter(s => s.t > A.t0), rev = Math.max(0, S.stats.revenue - A.rev), kg = Math.max(0, S.stats.kg - A.kg);
  const o0 = fsOf(A.fs), o1 = fsOf(F.p), days = (o1.y * 365 + o1.d) - (o0.y * 365 + o0.d), up = o1.y > o0.y, rest = Math.round(F.rest / 60);
  if (!sales.length && !up && A.realMs < 5 * 60000) return;
  const best = sales.reduce((m, s) => !m || s.total > m.total ? s : m, null), ev = S.log.slice(A.idx).slice(-6).reverse();
  const big = rev > 0 ? {v:rev, k:'kr', lbl:L2('levert mens du var borte', 'landed while you were away')} : {v:Math.max(0, days), k:'d', lbl:L2('døgn fartstid', 'days at sea')};
  const tile = (v, l) => '<div class="aw-t"><b>' + v + '</b><span>' + l + '</span></div>';
  modal('<div class="aw"><p class="aw-h">' + t('away') + ' · ' + dur(A.mins / 60) + '</p>' +
    '<div class="aw-big"><span id="awNum">+0</span><small>' + big.lbl + '</small></div>' +
    '<div class="aw-fs"><div class="aw-fl"><b id="awYr">' + fsText(A.fs) + '</b><span>' + (days > 0 ? '+' + fmt(days) + L2(' døgn', ' days') : '') + '</span></div><div class="aw-bar"><i id="awBar" style="width:' + (o0.f * 100).toFixed(1) + '%"></i></div></div>' +
    '<div class="aw-ts">' + tile(sales.length ? fmt(Math.round(kg)) + ' kg' : '–', sales.length ? sales.length + L2(sales.length === 1 ? ' levering' : ' leveringer', sales.length === 1 ? ' landing' : ' landings') : L2('ingen leveringer', 'no landings')) +
      tile(best ? kr(best.total) : '–', best ? L2('beste levering, ', 'best landing, ') + (portById(best.port) || {}).name : L2('beste levering', 'best landing')) +
      tile(rest > 0 ? rest + ' t' : '–', L2('uthvilt: dobbel fartstid til sjøs', 'rested: double sea time at sea')) + '</div>' +
    (ev.length ? '<ul class="log aw-log">' + ev.map(e => '<li><time>' + hm(e.t / 60) + '</time><span>' + (en ? e.en : e.no) + '</span></li>').join('') + '</ul>' : '') +
    '<div class="btns"><button class="btn primary" data-close>' + L2('Til sjøs!', 'To sea!') + '</button></div></div>');
  // the number counts up and the bar fills (a new year: to the end, then on from the start of the next)
  const el = $('awNum'), bar = $('awBar'), yr = $('awYr'), t0 = performance.now(), T = 1300;
  const fmtBig = v => big.k === 'kr' ? '+' + kr(v) : '+' + fmt(v);
  const run = now => { const q = Math.min(1, (now - t0) / T), e = 1 - Math.pow(1 - q, 3); if (!el || !el.isConnected) return; el.textContent = fmtBig(Math.round(big.v * e));
    if (q < 1) requestAnimationFrame(run); else if (navigator.vibrate && big.v > 0) try { navigator.vibrate(30); } catch (x){} };
  requestAnimationFrame(run);
  setTimeout(() => { if (!bar || !bar.isConnected) return; bar.style.width = (up ? 100 : o1.f * 100).toFixed(1) + '%';
    if (up) setTimeout(() => { if (!bar.isConnected) return; bar.style.transition = 'none'; bar.style.width = '0%'; yr.textContent = fsText(F.p); yr.parentNode.classList.add('aw-up');
      requestAnimationFrame(() => { bar.style.transition = ''; bar.style.width = (o1.f * 100).toFixed(1) + '%'; }); }, 900); }, 250);
}

// ---------- time ----------
const CATCHUP_CAP = 72 * 60;
// Game minutes are played only while every vessel's waters are loaded (simAreaReady, 01b-mapdata.js): what is left waits in
// CATCH_LEFT and is played by the tick once the packs are in, so a slow network makes the clock wait, never guess.
let CATCH_LEFT = 0;
function playMinutes(n){ let i = 0; for (; i < n; i++){ if (!simAreaReady()){ CATCH_LEFT += n - i; break; } step(); } return i; }
// on the world's clock (core/01-world.js) the time away is what the game is behind it, all of it; more than two weeks is skipped to the
// last two (the clock moves on, the simulation plays the last two weeks)
const WORLD_SIM_MAX = 14 * 24 * 60;
function catchUp(realMs){
  let mins = Math.min(CATCHUP_CAP, Math.floor(realMs / 1000 / 60 * GAME_RATE));
  if (WCLOCK.on){ const w = worldT(); mins = Math.max(0, w - S.t); if (mins > WORLD_SIM_MAX){ S.t = w - WORLD_SIM_MAX; mins = WORLD_SIM_MAX; } realMs = mins / GAME_RATE * 60000; }
  if (mins < 1) return;
  if (mins >= 10) awayStart(mins, realMs);
  playMinutes(mins);
  panelDirty = true;
  if (!CATCH_LEFT && AWAYR) awayEnd();
  if (realMs >= 5 * 60000) WAKE_BACK = true;
}
let lastWall = Date.now(), acc = 0, lastPanel = 0, lastSave = 0, WAKE_BACK = false;
function tick(){
  const now = Date.now(), dt = (now - lastWall) / 1000; lastWall = now;
  // (until the simulation's data is in, the clock waits: 11-boot.js)
  if (SIMREADY){ if (CATCH_LEFT > 0){ const n = Math.min(CATCH_LEFT, 3000); CATCH_LEFT -= n; playMinutes(n); panelDirty = true; if (!CATCH_LEFT && AWAYR) awayEnd(); }
  else if (WCLOCK.on){
    // one clock for everyone: step on to the world's minute; more than ten minutes behind (the tab slept) is time away; a save from
    // before that is ahead goes at half pace until the world has caught up with it
    const wf = worldTf(), gap = wf - S.t;
    if (gap > 10) catchUp(0);
    else { if (helmOn() && !sleepAlone()) helmStep(dt); let n = 0;
      if (gap >= 0){ while (S.t + 1 <= wf && n < 3000 && simAreaReady()){ step(); n++; } acc = clamp(wf - S.t, 0, 0.999); }
      else { acc += dt * GAME_RATE / 120; while (acc >= 1 && n < 3000 && simAreaReady()){ step(); acc -= 1; n++; } }
      if (n) panelDirty = true; }
  }
  else if (dt > 6) catchUp(dt * 1000); else { if (helmOn() && !sleepAlone()) helmStep(dt); acc += dt * simRate() / 60; let n = 0; while (acc >= 1 && n < 3000 && simAreaReady()){ step(); acc -= 1; n++; } } }
  if (WAKE_BACK && !CATCH_LEFT){ WAKE_BACK = false; if (asleep()) wakeEarly(true); }
  heatTick();
  if (!G3.isActive()){ renderDyn(); if (AISSEL) renderAisCard(); heatPaint(); } renderHud(); renderClock(); renderActs(); DOCK.tick(); HUI.tick(); energyUi(); turFotoUi(); INSTR.renderGPS(); renderRouteTools(); tutUpdate(); PHONE.status(); PHONE.tickHome();
  if (S.order && S.t >= S.order.due) deliverOrder();
  // the chart's night colours follow the sun: drawn again when they change
  if (S.t !== CHN.t){ CHN.t = S.t; if (chartNight() !== CHN.v && document.body.classList.contains('vplot')) renderBase(); }
  const pnow = performance.now();
  if ((panelDirty || pnow - lastPanel > 1000) && !panelBusy()){ renderPanel(); lastPanel = pnow; panelDirty = false; }
  if (now - lastSave > 5000){ save(); lastSave = now; if (streakTouch()) refreshAll(); ruTips(); }
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
  if ($('zin')) $('zin').setAttribute('aria-label', t('zin')); if ($('zout')) $('zout').setAttribute('aria-label', t('zout')); $('zboat').setAttribute('aria-label', t('zboat'));
  svg.setAttribute('aria-label', S.lang === 'no' ? 'Sjøkart' : 'Sea chart');
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
// the route list's tab: sideways the list slides off to the right, upright it goes down (and back); the map is laid out again
{ const tab = document.createElement('button'); tab.id = 'sideTab'; tab.type = 'button'; tab.setAttribute('aria-label', 'Rute');
  tab.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"/></svg><span class="st-t"></span>';
  $('side').prepend(tab);
  tab.onclick = e => { e.stopPropagation(); const b = document.body; if (window.innerWidth <= 700) b.classList.toggle('drawer'); else { b.classList.toggle('sidehide'); applyView(); scheduleStatic(); } }; }
$('camBtn').onclick = () => { if (G3.kino()) G3.kino(false); G3.setHelm(!G3.isHelm()); kinoUi(); updateMapButtons(); };
// the cinema (view3d.js KINO): the camera films the trip by itself; «Skjul» hides everything on the screen but these two buttons
function kinoUi(){ const on = G3.kino(); $('kinoBtn').classList.toggle('on', on); $('kinoHud').hidden = !on; if (!on) document.body.classList.remove('kino-clean');
  $('kinoHud').textContent = document.body.classList.contains('kino-clean') ? (S.lang === 'no' ? 'Vis' : 'Show') : (S.lang === 'no' ? 'Skjul' : 'Hide'); }
$('kinoBtn').onclick = () => { G3.kino(!G3.kino()); kinoUi(); };
$('kinoHud').onclick = () => { document.body.classList.toggle('kino-clean'); kinoUi(); };
$('fotoBtn').onclick = () => turFotoShoot(null);
$('phoneFab').onclick = () => PHONE.toggle();
$('plotStyle').onclick = () => {};
hooks.on3dFail = () => { setBodyView(false); $('loader').classList.add('gone'); $('plotClose').hidden = true; tab = 'route'; renderPanel(); applyView(); renderStatic(); renderDyn(); };
