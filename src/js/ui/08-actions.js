// actions
panel.addEventListener('pointerdown', () => { pressHold = true; });
// a swipe that scrolls the panel ends in pointercancel, not pointerup, and the panel shall go on showing the clock after it too
for (const k of ['pointerup', 'pointercancel']) window.addEventListener(k, () => { setTimeout(() => { pressHold = false; }, 250); });
panel.addEventListener('click', e => { const el = e.target.closest('[data-act]'); if (el && !el.disabled) doAct(el); });
function doAct(el){
  const act = el.dataset.act, i = +el.dataset.i, b = S.boat, L = (no, en) => S.lang === 'no' ? no : en;
  if (act === 'gset' || act === 'ghaul' || act === 'gstop') gearDoAct(act, el);
  // every change to the draft is a step in the route history (03b-route.js)
  else if (act === 'gwp'){ draftEdit(() => gearDoAct(act, el)); const rb = ruWpMsg(S.draft[i]); if (rb) toast(rb); }
  // − and + beside the speed slider: one knot a tap, the same path as dragging it
  else if (act === 'spdstep'){ const r = $(el.dataset.id); if (r){ r.value = clamp(+r.value + +el.dataset.d, +r.min, +r.max); panelInput({target:r}); panelChange({target:r}); } return; }
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
    if (!meAboard() && !crewAboard().length){ toast(L(...noCrewText())); return; }
    const later = S.draftDep && S.draftDep > S.t ? S.draftDep : null;
    if (!later && b.status === 'port' && S.jobs && S.jobs.length){ toast(t(jobsCrewOnly() ? 'crew_busy' : 'yard_busy', hm((jobsDone() || S.t) / 60))); return; }
    S.plan = {wps:S.draft.map(w => ({...w})), idx:0, speed:S.draftSpeed, full:!!S.draftFull, returning:false, depAt:later, unsafe:draftHazards().map(h => h.unsafe)};
    S.draft = []; S.draftDep = null; draftForget();
    if (later) log('Avgang planlagt ' + dayStr(later / 60) + ' kl. ' + hm(later / 60) + '.', 'Departure planned for ' + dayStr(later / 60) + ' at ' + hm(later / 60) + '.');
    else { if (b.status === 'idle') log('Ny rute satt.', 'New route set.'); depart();
      const W = windAt(S.t / 60); if (S.settings.autoOn && W > S.settings.autoW) log('Det blåser ' + W.toFixed(0) + ' m/s, over grensen for å snu. Båten snur ikke av seg selv før vinden har løyet.', 'It blows ' + W.toFixed(0) + ' m/s, over the turn-back limit. The boat will not turn back by itself until the wind has eased.'); }
    // the chart plotter stays open: the skipper goes back to 3D himself (the user's wish 02.10.2026)
  }
  else if (act === 'depnow'){ if (!S.plan) return; if (b.status === 'port' && S.jobs && S.jobs.length){ toast(t(jobsCrewOnly() ? 'crew_busy' : 'yard_busy', hm((jobsDone() || S.t) / 60))); return; } if (!meAboard() && !crewAboard().length){ toast(L(...noCrewText())); return; } depart(); if (!G3.isActive()) G3.show(true, true); }
  else if (act === 'cn'){ S.settings.chartNight = el.dataset.m; renderBase(); scheduleStatic(); if (typeof MINIP !== 'undefined') MINIP.key = ''; }
  else if (act === 'rl'){ S.settings.ruleLayer = el.dataset.m === 'on'; renderBase(); scheduleStatic(); paintChart(1); }
  else if (act === 'cm'){ const m = el.dataset.m; if (m === 'fish' && !S.equip.plotter){ toast(t('need_plotter')); PHONE.open('utstyrb'); return; } S.settings.chart = m; renderBase(); scheduleStatic(); }
  else if (act === 'echo' || act === 'sonar'){ S.settings[act] = el.dataset.on === '1'; heatReset(); if (typeof heatPaint === 'function') heatPaint(); INSTR.show(); }
  else if (act === 'hsp'){ S.settings.heatSp = el.dataset.s; if (typeof heatPaint === 'function') heatPaint(true); }
  else if (act === 'sd-' || act === 'sd+'){ S.settings.safeDepth = clamp(safeDepth() + (act === 'sd+' ? 1 : -1), 1, 30); hzCache.k = ''; renderBase(); scheduleStatic(); }
  else if (act === 'jigg'){ window.JIGG.toggle(); renderActs(); return; }
  else if (act === 'pub'){ PUB3.open(); return; }
  else if (act === 'target'){ if (kveiteClosed(S.t / 60)){ S.target = 'mix'; toast(L('Kveita er fredet fra 20. desember til og med 20. april.', 'Halibut is closed from 20 December to 20 April.')); } else S.target = S.target === 'kveite' ? 'mix' : 'kveite'; renderActs(); return; }
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
  else if (act === 'startfish'){
    if (!vesselJigs()){ toast(L('Et havfiskefartøy fisker ikke med juksa.', 'An ocean vessel does not fish with the jig.')); return; }
    // there is no rod: without a hand jig, reels or halibut gear for halibut nobody can fish
    if (!b.gear && !(S.equip && S.equip.jukse > 0) && !(S.target === 'kveite' && b.kgear)){ toast(L('Du har ingen juksa. Kjøp håndjuksa i butikken på kaia.', 'You have no jig. Buy a hand jig in the shop on the quay.')); return; } { const rb = ruBlockMsg({p:b.pos, len:BOAT.len, gear:'juksa', sp:S.target === 'kveite' ? 'kveite' : null, hand:!(S.equip && S.equip.jukse > 0)}); if (rb){ toast(rb); return; } } b.status = 'fishing'; b.fishUntil = S.t + S.fishPlanH * 60; log('Starter fiske i ' + S.fishPlanH + ' t.', 'Fishing for ' + S.fishPlanH + ' h.'); }
  else if (act === 'stopfish'){ if (b.gop) gopAbort('stop'); b.fishUntil = S.t; S.plan = null; endFishing('done'); }
  else if (act === 'deckstop'){ if (b.status === 'fishing'){ b.deckStop = true; log('Stopper fisket for å sløye og ise.', 'Stopping fishing to gut and ice.'); } }
  else if (act === 'deckgo'){ b.deckStop = false; b.deckEnd = null; }
  else if (act === 'sell'){ if (!tutAllow('sell')) return; if (berthKind(b) === 'naust'){ toast(L(NAUST_SAIL[0], NAUST_SAIL[1])); return; } if (!mottakOpen(S.t / 60)){ toast(L('Mottaket er stengt. Det åpner ', 'The plant is closed. It opens ') + mottakWhen(S.t / 60, S.lang === 'no') + '.'); return; } startLanding(false); }
  else if (act === 'landq0'){ landQueueEnd(); toast(L('Du gikk ut av køen. Fisken er fortsatt om bord.', 'You left the queue. The fish is still aboard.')); }
  else if (act === 'landgo'){ const q = portById(el.dataset.pid); if (!q) return; landQueueEnd(); if (typeof DOCK !== 'undefined' && DOCK.close) DOCK.close(); if (S.draft.length) draftEdit(() => { S.draft = []; }); openPlotter(); view.cx = q.p.x; view.cy = q.p.y;
    toast(L('Autonav til ' + q.name + ', ' + fmt(dist(b.pos, q.p) / NM, 1) + ' nm. Trykk «Kast loss» når ruta ligger.', 'Autonav to ' + q.name + ', ' + fmt(dist(b.pos, q.p) / NM, 1) + ' nm. Tap «Cast off» once the route is there.'), 8000); setTimeout(() => leiaTo({x:q.p.x, y:q.p.y}), 450); return; }
  else if (act === 'rest'){ const why = restStart(); if (why){ toast(L(why[0], why[1])); return; } }
  else if (act === 'restend') restEnd();
  else if (act === 'fuel'){ if (spendable() <= 0){ toast(t('no_cash')); return; } if (berthKind(b) === 'naust'){ toast(L(NAUST_SAIL[0], NAUST_SAIL[1])); return; } startFueling(false); }
  else if (act === 'ice'){ const why = shopBuy('ice', +el.dataset.kg || 50); if (why){ toast(L(why[0], why[1])); return; } }
  else if (act === 'gear' || act === 'kgear'){ PHONE.open('fiske'); return; }
  else if (act === 'reset'){ if (confirm(t('reset_q'))){ const lang = S.lang; S = newState(); S.lang = lang; S.intro = true; S.draft = []; draftForget(true); S.tut = NOTUT ? 0 : tutNew(); ensureFleet(); save(); refreshAll(); } return; }
  renderPanel(); renderDyn(); renderHud(); renderClock(); renderActs(); renderRouteTools(); save();
}
function panelInput(e){
  // (the top step is «Full fart»: the top speed she has now, and it follows it, core speedPin)
  if (e.target.id === 'spd'){ const v = +e.target.value; S.draftFull = v >= spdTop(); S.draftSpeed = S.draftFull ? BOAT.vmax : v; $('spdOut').textContent = spdTxt(S.draftSpeed, S.draftFull) + ', ' + t('lpnm', fmt(fuelLph(S.draftSpeed, windAt(S.t / 60)) / S.draftSpeed, 2)); }
  if (e.target.id === 'spdLive' && S.plan){ const v = +e.target.value; S.plan.full = v >= spdTop(); S.plan.speed = S.plan.full ? BOAT.vmax : v; $('spdLiveOut').textContent = spdTxt(S.plan.speed, S.plan.full); }
  if (e.target.id === 'autoW'){ S.settings.autoW = +e.target.value; $('autoWOut').textContent = S.settings.autoW + ' m/s'; }
}
function panelChange(e){
  const id = e.target.id;
  if (id === 'setDeckFirst') S.settings.deckFirst = e.target.checked;
  // round or gutted, per boat (R1, core/13-work.js catchGut): undefined guts aboard, as old saves and the fleet do
  if (id === 'setGut'){ if (e.target.checked) delete S.boat.gutAboard; else S.boat.gutAboard = false; }
  if (id === 'setIce') S.settings.ice = e.target.checked;
  if (id === 'setAuto') S.settings.autoOn = e.target.checked;
  if (id === 'autoTo') S.settings.autoTo = e.target.value === 'home' ? 'home' : 'near';
  if (id === 'dep'){ S.draftDep = e.target.value ? +e.target.value : null; e.target.blur(); }
  e.target.blur && e.target.type === 'range' && e.target.blur();
  panelDirty = true; save();
}
panel.addEventListener('input', panelInput);
panel.addEventListener('change', panelChange);
// a vertical swipe over a slider scrolls its panel, but the browser has already moved the thumb to the finger on touch down: when the
// swipe turns into a scroll (pointercancel) the slider gets its value back (spilltest 2: the speed slider caught swipes). The panel may
// have been drawn anew under the finger, so the slider is found again by its id; the cancel can come to whatever lies under the finger
// then, so it is matched by the pointer
let rangeTouch = null;
document.addEventListener('pointerdown', e => { const r = e.target; rangeTouch = e.pointerType === 'touch' && r && r.type === 'range' ? {r, v:r.value, id:e.pointerId} : null; }, true);
document.addEventListener('pointercancel', e => { const q = rangeTouch; rangeTouch = null; if (!q || e.pointerId !== q.id) return;
  const r = q.r.isConnected ? q.r : q.r.id && document.getElementById(q.r.id); if (!r || r.value === q.v) return; r.value = q.v; r.dispatchEvent(new Event('input', {bubbles:true})); }, true);
// what the sales organisation confiscates of the hold if it is landed now (cod beyond the fresh-fish allowance and the quota, bycatch
// over its limits): the share of each species. Apart from sell() so the quay can show it before you land (R4); q is not changed
// the compensation for landing what is confiscated (Jonas 11.11.2026: «Dette må inn. Jeg vet at fiskere utnytter seg av slikt regelverk
// bevist, så det er realistisk»): forskrift om inndraging av fangst og bruk av inndregne midlar (FOR-2010-03-12-390) § 3, «Vederlaget
// skal setjast til 20 % av verdien av meirfangsten eller den ulovlege fangsten», given when the catch «ikkje var tilsikta». The game
// cannot tell intent, so every confiscation of fish and snow crab gets it (the regulation leaves out king crab over quota and the
// pelagic species; the game confiscates neither). On the landing note as a row of its own, and in the total
const CONF_PAY = 0.2;
function landConf(H, q, acc){
  const kgOf = sp => S.hold.filter(x => x.sp === sp).reduce((a, x) => a + x.kg, 0), wk = weekOfH(H), ffTot = q.ffW === wk ? q.ffTot : 0, ffCod = q.ffW === wk ? q.ffCod : 0;
  // the fresh-fish allowance counts fish only (assumed: shellfish do not count), and fresh fish only (J-187-2026 § 25: the fresh landings;
  // fish frozen aboard is not fresh)
  const saleKg = S.hold.reduce((a, x) => a + (SPECIES[x.sp].shell || x.frozen || (x.sp === 'hyse' && x.cls === 2) ? 0 : grade(x.fresh) === 'V' ? 0 : x.kg), 0);
  // Ø10b: the cod taken where it may only be a bycatch (the Skagerrak outside the baseline, 5 % of what was taken there; 05-vessels.js
  // bycConf) is confiscated first, whatever the quota says; the rest of the cod goes on as before
  const codAll = kgOf('torsk'), Z = bycConf(), codKg = codAll - Z.kg, confBy = {};   // share of each species that is confiscated
  let codFF = 0, codQ = 0, codConf = 0, byCod = 0;
  if (acc === 'none'){
    // no access (J-30-2026 § 35): cod, haddock and saithe together at most 10 % of the landing, cut back evenly, and at most 2 t of cod a year
    const ths = codKg + kgOf('hyse') + kgOf('sei'), f = ths > 0 ? Math.min(1, BYCATCH.share * holdTotal() / ths) : 1;
    byCod = Math.min(codKg * f, Math.max(0, BYCATCH.cod - (q.byCod || 0))); codConf = codKg - byCod;
    if (f < 1){ confBy.hyse = 1 - f; confBy.sei = 1 - f; }
  } else {
    // cod: the fresh-fish allowance first, then the quota; the rest is confiscated by the sales organisation
    const pct = ffPct(H), ffAllow = pct ? Math.max(0, pct * (ffTot + saleKg) - ffCod) : 0, codFresh = S.hold.reduce((a, x) => a + (x.sp === 'torsk' && !x.frozen ? x.kg : 0), 0) * (codAll > 0 ? codKg / codAll : 1);
    codFF = Math.min(codFresh, ffAllow); codQ = Math.min(codKg - codFF, codRoom(H)); codConf = codKg - codFF - codQ;
    // the closed group's haddock and saithe: the maximum quota, then up to 30 % haddock and 20 % saithe as bycatch in each landing
    // (J-187-2026 §§ 18 and 19); the rest is confiscated
    // an ocean permit (H2a): no bycatch of cod or haddock beyond the vessel quota, and saithe without a gillnet-saithe permit only as
    // bycatch, 25 % of the landing (J-187-2026 § 14; the 50 % while the gillnet-saithe fishery is open is not in the game)
    if (acc === 'lukket' && S.lic.hav){ const LQ = licQ(S.lic, H), all = holdTotal();
      for (const [sp, share] of [['hyse', 0], ['sei', HAVBY.sei]]){ const k = kgOf(sp), cap = LQ[sp] && isFinite(LQ[sp][0]) ? Math.max(0, LQ[sp][0] - q[sp]) : 0, ok = Math.min(k, Math.max(cap, share * all)); if (k > 0 && ok < k - 0.01) confBy[sp] = 1 - Math.max(0, ok) / k; } }
    else if (acc === 'lukket'){ const LQ = licQ(S.lic, H), all = holdTotal();
      for (const [sp, share] of [['hyse', 0.3], ['sei', 0.2]]){ const k = kgOf(sp), ok = Math.min(k, Math.max(LQ[sp][0] - q[sp], share * all)); if (k > 0 && ok < k - 0.01) confBy[sp] = 1 - Math.max(0, ok) / k; } }
  }
  if (codAll > 0 && codConf + Z.kg > 0.001) confBy.torsk = Math.min(1, (codConf + Z.kg) / codAll);
  // ling and tusk for vessels of 28 m and over (J-128-2026 and the proposal for 2027, 03d-quota.js lbShare): ling at most 35 % of the
  // landing all year, tusk free until the group quota is taken and then at most 15 %
  if (BOAT.len >= 28 && acc !== 'none') for (const sp of ['lange', 'brosme']){ const k = kgOf(sp), sh = lbShare(sp, H); if (k > 0 && sh < 1){ const ok = Math.min(k, sh * holdTotal()); if (ok < k - 0.01) confBy[sp] = 1 - ok / k; } }
  // snow crab (H3a, H3b): the live crab first on the extra quota, then everything on the vessel quota with the flexibility (round weight,
  // 10e-krabbefabrikk.js snoLandQ); the rest is confiscated
  { const k = kgOf('snokrabbe'); if (k > 0){ const conf = acc === 'lukket' && S.lic && S.lic.id === 'krab' ? snoLandQ(H, q).conf : k; if (conf > 0.01) confBy.snokrabbe = Math.min(1, conf / k); } }
  // Greenland halibut: the maximum quota in the direct fishery, otherwise at most 7 % of the week's landings (03d-quota.js bkAllow)
  const bkKg = kgOf('blakveite'), bkOk = bkKg > 0 ? bkAllow(H, bkKg, holdTotal()) : 0;
  if (bkKg > 0 && bkOk < bkKg - 0.01) confBy.blakveite = 1 - bkOk / bkKg;
  return {saleKg, codKg, confBy, codFF, codQ, codConf, byCod, bkOk, zConf:Z.kg, zBy:Z.by};
}
function sell(){
  const b = S.boat, port = portById(b.port); if (!port || !(port.mottak || port.havOnly)) return;
  { const why = portWhy(port, b.type); if (why){ toast(S.lang === 'en' ? why[1] : why[0]); return; } }   // an ocean vessel: a plant that takes her (havsteget H0)
  const H = S.t / 60, q = quotaState(), lines = {}, extra = [], acc = access(), kgOf = sp => S.hold.filter(x => x.sp === sp).reduce((a, x) => a + x.kg, 0);
  let kg = 0;
  const wk = weekOfH(H); if (q.ffW !== wk){ q.ffW = wk; q.ffTot = 0; q.ffCod = 0; }
  const {saleKg, codKg, confBy, codFF, codQ, codConf, byCod, bkOk, zConf} = landConf(H, q, acc);
  // The landing note lists each lot at its full value and takes what is confiscated off in rows of its own; every row is whole
  // kroner and the total is the sum of the rows, so the note adds up and the cash gets exactly the total less the crew's share.
  let confKr = 0, confKg = 0, crabKr = 0, ordKr = 0, crabSmall = 0, crabDead = 0, gutKr = 0, gutKg = 0;
  const confSp = {};   // what is confiscated per species, so the note says which and why (spilltest 3, F1)
  for (const x of S.hold){
    const sp = x.sp, sd = SPECIES[sp], c = x.cls != null ? x.cls : sd.ref, g = grade(x.fresh);
    // king crab is paid by class while it lives (no grades), and nothing once dead (Råfisklaget: dead crab 0 kr)
    const deadKC = sp === 'krabbe' && (x.fresh || 0) < KC.dead;
    // (the snow crab, H3b: the clusters, the live crab by its size and the dead crab for meal at their own prices, 10e-krabbefabrikk.js)
    let ppk = sp === 'krabbe' ? (deadKC ? 0 : clsPrice(port, sp, c, H, false)) : sp === 'snokrabbe' ? snoPrice(port, x, H) : g === 'V' ? 1 : clsPrice(port, sp, c, H, x.hook, x.frozen) * GM[g];   // (a frozen lot at the price of fish frozen at sea, pmF)
    if (x.gut && (sp === 'hyse' || sp === 'sei')) ppk += GUT_FEE;           // no gutting fee deducted
    // round haddock and saithe (R2): the line at the plant's price and the gutting charge in a row of its own, so the note says what
    // landing round cost (core/13-work.js gutFeeKg); the cash gets what it got before. What is confiscated goes off v, without the charge
    const gf = gutFeeKg(x); if (gf){ gutKr += x.kg * gf; gutKg += x.kg; }
    let v = x.kg * ppk, gross = v + x.kg * gf;
    if (deadKC) crabDead += x.kg;
    const cs = confBy[sp] || 0; if (cs > 0){ confKr += v * cs; confKg += x.kg * cs; const z = confSp[sp] = confSp[sp] || {kg:0, kr:0}; z.kg += x.kg * cs; z.kr += v * cs; v *= 1 - cs; }
    // orders for this harbour take matching fish first, at their premium (confiscated fish does not count)
    const keptKg = x.kg * (1 - cs);
    if (v > 0) for (const o of ordState().active){ if (o.port !== port.id || o.sp !== sp || o.left <= 0.01 || !gradeOk(g, o.q)) continue; const take = Math.min(keptKg - (x._used || 0), o.left); if (take <= 0.01) continue;
      x._used = (x._used || 0) + take; o.left -= take; const add = take / keptKg * v * o.prem; ordKr += add; o.saleKg = (o.saleKg || 0) + take; o.saleKr = (o.saleKr || 0) + add; }
    const k = sp + '|' + c + '|' + g + '|' + (x.gut ? 1 : 0) + (x.frozen ? '|f' : '');
    // (dead snow crab is landed round, H3b)
    lines[k] = lines[k] || {sp, c, g, gut:!!x.gut && !x.rund, fz:!!x.frozen, kg:0, sum:0, n:0}; lines[k].kg += x.kg; lines[k].sum += gross; lines[k].n += x.n || 0; kg += x.kg;
    // liver and roe from fish gutted on board
    if (x.gut && sd.liver){ const m = gDate(H).getUTCMonth(), roeF = sp === 'torsk' && m <= 3 ? 0.04 : 0.01;
      extra.push(['lever', x.kg * 0.05, sd.liver]); extra.push(['rogn', x.kg * roeF, sd.roe]); }
    S.market[port.id] = S.market[port.id] || {}; S.market[port.id][sp] = (S.market[port.id][sp] || 0) + x.kg;
  }
  for (const r of Object.values(lines)) r.sum = Math.round(r.sum);
  const roeCut = 0; confKr = Math.round(confKr); crabKr = Math.round(crabKr); gutKr = Math.round(gutKr);
  // the daily login bonus: a share on top of the fish itself (not on order premiums, liver or roe); the crew shares in it
  const stPct = streakPct(), fishKr = Object.values(lines).reduce((a, r) => a + r.sum, 0) - confKr - crabKr - roeCut - gutKr, stKr = stPct > 0 ? Math.round(fishKr * stPct / 100) : 0;
  // finished orders pay their bonus; the customer remembers
  const ordLines = []; { const O = ordState();
    for (const o of O.active.slice()){ if (!o.saleKg) continue; const c = CUSTOMERS.find(z => z.id === o.cust), done = o.left <= 0.5; let bonus = 0;
      if (done){ bonus = o.bonus; O.active.splice(O.active.indexOf(o), 1); O.done.unshift({...o, t:S.t, ok:true}); O.done = O.done.slice(0, 20);
        log('Oppdrag levert: ' + fmt(o.kg, 0) + ' kg ' + SPECIES[o.sp].no.toLowerCase() + ' til ' + c.no + ', bonus ' + kr(bonus) + '.', 'Order delivered: ' + fmt(o.kg, 0) + ' kg of ' + SPECIES[o.sp].en.toLowerCase() + ' to ' + c.no + ', bonus ' + kr(bonus) + '.'); S.rep[o.cust] = clamp(repOf(o.cust) + 8, 0, 100); msg(c.no, 'Takk for leveransen! Her er ' + kr(bonus) + ' ekstra for at alt kom i tide.', 'Thanks for the delivery! Here is ' + kr(bonus) + ' extra for having it all on time.'); }
      ordLines.push({cust:c.no, sp:o.sp, kg:o.saleKg, kr:o.saleKr, bonus, done, left:o.left}); ordKr += bonus; o.saleKg = 0; o.saleKr = 0; } }
  ordKr = Math.round(ordKr);
  const ex = {}; for (const [n, k2, pr] of extra){ ex[n] = ex[n] || {kg:0, sum:0}; ex[n].kg += k2; ex[n].sum += k2 * pr; }
  let exKr = 0; for (const n in ex){ ex[n].sum = Math.round(ex[n].sum); exKr += ex[n].sum; }
  const vedKr = Math.round(CONF_PAY * confKr);   // (§ 3: 20 % of what was confiscated, for landing it)
  const total = fishKr + stKr + ordKr + exKr + vedKr;
  // quota cooperation (§ 31): cod landed beyond your own vessel quota goes on the partner's, and he takes his share of its value
  let coopKr = 0; if (acc === 'lukket' && S.lic.coop && S.lic.coop.y === yearH(H) && codQ > 0){ const own = licQ({...S.lic, coop:null}, H).torsk, onP = Math.max(0, q.torsk + codQ - own) - Math.max(0, q.torsk - own);
    const codGross = Object.values(lines).filter(r => r.sp === 'torsk').reduce((a, r) => a + r.sum, 0); coopKr = Math.round(COOP.share * onP * codGross / Math.max(1, codKg)); }
  q.torsk += codQ; q.hyse += kgOf('hyse') * (1 - (confBy.hyse || 0)); q.sei += kgOf('sei') * (1 - (confBy.sei || 0)); q.byCod = (q.byCod || 0) + byCod;
  if (acc === 'lukket' && codQ + kgOf('hyse') * (1 - (confBy.hyse || 0)) + kgOf('sei') * (1 - (confBy.sei || 0)) > 0.5) S.lic.landY = yearH(H);   // the last game year with catch landed on the right (the operating requirement, KM1 in 03i-kvotemarked.js)
  // (snow crab: the live crab first on the extra quota, the rest on the vessel quota; H3a, H3b)
  const snoQ = kgOf('snokrabbe') > 0 && acc === 'lukket' && S.lic && S.lic.id === 'krab' ? snoLandQ(H, q) : null;
  if (snoQ){ q.snoTq = (q.snoTq || 0) + snoQ.tq; q.snokrabbe = (q.snokrabbe || 0) + snoQ.ord; }
  if (acc !== 'none'){ q.ffTot += saleKg; q.ffCod += codFF; }
  if (acc === 'open') qyAt(H).me += codQ / 1000;   // your landings count in the open group's catch (03d-quota.js)
  bkLanded(H, bkOk || 0, holdTotal());   // the Greenland halibut's maximum quota and the week's 7 %
  { const ks = {}; for (const x of S.hold) ks[x.sp] = (ks[x.sp] || 0) + x.kg; wshLand(port.id, H, acc === 'lukket' && S.lic.hav ? 'hav' : acc, ks, codQ); if (WSH.rec) setTimeout(worldShare, 4000); }   // for the other players
  q.conf += confKg + crabSmall; q.confKr += confKr + crabKr;
  const arr = Object.values(lines).sort((a, c) => ALLSP.indexOf(a.sp) - ALLSP.indexOf(c.sp) || a.c - c.c || 'EABXV'.indexOf(a.g) - 'EABXV'.indexOf(c.g));
  // lott goes to those who were aboard; a crew member given time off gets none for this trip
  // the sales organisation's deductions (TREKK) come off the value first; the crew's share is reckoned on what is left
  const tk = trekkOf(total, BOAT.len || 0), net = total - tk.sum;
  // VAT on the sale once the business is in the VAT register: it comes with the settlement and goes straight on to the state
  mvaCheck(total); const mva = S.mva ? mvaOf(total, tk) : 0;
  // the share system (Økonomi 2, Ø2, core/04-crew.js LOTT): the value less the levies and the trip's common costs (fuel, ice, bait) is
  // the shared catch; the crew's part of it is split in their shares. Those aboard when the fish was caught share, though given time off
  // since (c.trip, set by addCatch). The common costs were paid when bought; they only come off before the sharing.
  const fk = tripCost(b), LS = lottSplit(net - fk.sum), lott = LS.crew;
  for (const p of LS.per){ const c = p.c; if (c.lag) continue; c.earn = (c.earn || []).filter(e => e[0] > S.t - 7 * 1440).concat([[S.t, p.kr]]); if (typeof lifeEarn === 'function') lifeEarn(c, p.kr); }
  // the trip's line (Ø8b S2, core/04-crew.js tripSum, tripWhy): on the note and in the deck log, and what it said to the cloud (slip_why)
  const tw = tripSum(b.trip), why = tripWhy(tw);
  b.trip = null;   // the next trip's common costs start now
  b.tankFull = null;   // (the snow crab's tanks are empty again, H3b)
  // back aboard after the trip they sat out; not at a landing that was still going when they were given time off, which put them
  // straight back aboard for the next trip (tilbakemelding #32)
  for (const c of S.crew){ delete c.trip; if (c.offTrip){ c.off = false; delete c.offTrip; } }
  if (meAboard()) fmLand(total);
  fsLand(total);   // sea time for the landing (core/09e-fartstid.js)
  nameNudge();     // naming the boat without the cloud, after the second landing (ui/10f-cloud.js)
  S.landN = (S.landN || 0) + 1;   // the landings, for a guest's papers (ui/10f-cloud.js: registering after the second)
  achSale(total, Object.values(lines).map(r => r.sp));   // the badges (core/09f-merker.js)
  { const by = {}; for (const r of arr) by[r.sp] = (by[r.sp] || 0) + r.kg; turSale(port.id, by); }   // missions (core/09g-turer.js)
  const cashBefore = S.cash;
  bookAll({fisk:fishKr, tillegg:stKr + ordKr + exKr + vedKr, trekk:-tk.sum, mannskap:-lott, kvote:-coopKr}, 'Levering, ' + port.name, 'Landing, ' + port.name);
  bankAfterIncome(net - lott - coopKr);   // the set-aside for the tax and the regular savings (core/03-simulation.js, Økonomi 2 Ø3)
  if (coopKr > 0) log(S.lic.coop.name + ' fikk ' + kr(coopKr) + ' for torsken på kvoten hans.', S.lic.coop.name + ' got ' + kr(coopKr) + ' for the cod on his quota.'); S.stats.kg += kg; S.hold = []; delete b.byc;
  const fs = S.marks.length ? S.marks[S.marks.length - 1] : null, field = fieldCode(S.fsess || fs || b.pos);
  // the whole landing note goes with the sale, for the deck log's Salg tab (ui/06b-book-tabs.js)
  S.saleSeq = (S.saleSeq || 0) + 1;
  const det = {id:S.saleSeq, ln:arr.map(r => [r.sp, r.c, r.g, r.gut ? 1 : 0, Math.round(r.kg * 10) / 10, r.sum, Math.round(r.n || 0)].concat(r.fz ? [1] : [])), ex:Object.fromEntries(Object.entries(ex).map(([n, v]) => [n, [Math.round(v.kg * 10) / 10, v.sum]])),
    st:[stPct, stKr], ord:ordKr, conf:[Math.round(confKg), confKr, Math.round(crabSmall * 10) / 10, crabKr], roe:roeCut, gf:gutKr, ved:vedKr, crew:LS.per.map(p => [p.c.name, p.lots, p.kr].concat(p.sk ? [1, p.x] : [])), lott, fk:[Math.round(fk.fuelL), fk.fuelKr, Math.round(fk.iceKg), fk.iceKr, fk.baitKr, fk.havnKr, fk.gearKr], dl:[LS.D, LS.M, LS.n, LS.own, LS.f], fine:0, tk:[tk.lag, tk.pens, tk.prod, tk.forsk, tk.ress, tk.ktrl], mva};
  if (snoQ) det.sno = [Math.round(snoQ.tq), Math.round(snoQ.ord), Math.round(snoQ.live)];   // (the extra quota, the ordinary, the live crab; H3b)
  folkSold(port.id, kg);   // the plant's manager keeps count (09d-folk.js)
  S.sales.push({t:S.t, v:S.cur, port:port.id, kg:Math.round(kg), total, sp:ALLSP.map(sp => [sp, Math.round(arr.filter(r => r.sp === sp).reduce((a, r) => a + r.kg, 0))]).filter(r => r[1] > 0), d:det}); if (S.sales.length > 200) S.sales.shift();
  // older notes keep their sums only, so the save stays small
  for (let i = 0; i < S.sales.length - 60; i++) delete S.sales[i].d;
  if (lott > 0){ log('Mannskapet fikk ' + kr(lott) + ' i lott.', 'The crew received ' + kr(lott) + ' as their share.'); crewSay(null, 'payday'); }
  { const lp = LS.per.find(p => p.c.lag); if (lagOf()) lagLanded(lp ? lp.kr : 0); }   // an ocean vessel's crews change at the landing (core/04-crew.js, H2b)
  if (codFF > 0.5) log(Math.round(codFF) + ' kg torsk gikk på ferskfisktillegget.', Math.round(codFF) + ' kg of cod went on the fresh-fish allowance.');
  const vt = S.fleet && S.fleet.length > 1 ? '«' + S.boatName + '»: ' : '';
  // the Greenland halibut has a message of its own below; these speak of cod, haddock and saithe only (F1)
  const zKr = zConf > 0.5 && confSp.torsk ? Math.round(confSp.torsk.kr * zConf / confSp.torsk.kg) : 0;   // (Ø10b: the bycatch's part of the cod taken off)
  if (zConf > 0.5){ confSp.torsk.kg -= zConf; confSp.torsk.kr -= zKr;
    msg('Norges Råfisklag', vt + 'I Skagerrak utenfor grunnlinjen kan torsk bare være bifangst, høyst 5 % av fangsten der. ' + Math.round(zConf) + ' kg torsk var over grensen og er inndratt, verdi ' + kr(zKr) + '. All fangst skal landes (høstingsforskriften § 51).', vt + 'In the Skagerrak outside the baseline cod may only be a bycatch, at most 5% of the catch there. ' + Math.round(zConf) + ' kg of cod was over the limit and is confiscated, worth ' + kr(zKr) + '. All catch must be landed (høstingsforskriften § 51).'); }
  const thsKg = ['torsk', 'hyse', 'sei'].reduce((a, sp) => a + ((confSp[sp] || {}).kg || 0), 0), thsKr = Math.round(['torsk', 'hyse', 'sei'].reduce((a, sp) => a + ((confSp[sp] || {}).kr || 0), 0));
  if (acc === 'none' && thsKg > 0.5) msg('Norges Råfisklag', vt + 'Båten har ikke adgang til å fiske torsk, hyse og sei. Av disse kan bare 10 % av landingen være bifangst, og høyst ' + fmt(BYCATCH.cod / 1000, 0) + ' tonn torsk i året. ' + Math.round(thsKg) + ' kg er inndratt, verdi ' + kr(thsKr) + '.', vt + 'The boat has no access to fish cod, haddock and saithe. Only 10% of the landing may be bycatch of these, and at most ' + fmt(BYCATCH.cod / 1000, 0) + ' t of cod a year. ' + Math.round(thsKg) + ' kg has been confiscated, worth ' + kr(thsKr) + '.');
  else if (acc === 'lukket' && thsKg - codConf > 0.5) msg('Norges Råfisklag', vt + 'Maksimalkvoten for hyse eller sei er fisket, og etter den kan bare 30 % hyse og 20 % sei være bifangst i hver landing. ' + Math.round(thsKg - codConf) + ' kg er inndratt, verdi ' + kr(thsKr - Math.round((confSp.torsk || {}).kr || 0)) + '.', vt + 'The maximum quota for haddock or saithe is fished, and after it only 30 % haddock and 20 % saithe may be bycatch in each landing. ' + Math.round(thsKg - codConf) + ' kg is confiscated, worth ' + kr(Math.round(thsKr - ((confSp.torsk || {}).kr || 0))) + '.');
  else if (codConf > 0.5) msg('Norges Råfisklag', vt + 'Du hadde ikke torskekvote igjen for ' + Math.round(codConf) + ' kg torsk. Verdien, ' + kr(Math.round((confSp.torsk || {}).kr || 0)) + ', er inndratt.', vt + 'You had no cod quota left for ' + Math.round(codConf) + ' kg of cod. Its value, ' + kr(Math.round((confSp.torsk || {}).kr || 0)) + ', has been confiscated.');
  if ((confSp.blakveite || {}).kg > 0.5){ const z = confSp.blakveite, dir = bkDirect(H, BOAT.len);
    msg('Norges Råfisklag', vt + (dir ? 'Maksimalkvoten for blåkveite er fisket. ' : 'Direktefisket etter blåkveite er stengt, og da kan blåkveite bare være bifangst, høyst 7 % av ukas landinger. ') + Math.round(z.kg) + ' kg blåkveite er inndratt, verdi ' + kr(Math.round(z.kr)) + '.',
      vt + (dir ? 'The maximum quota for Greenland halibut is fished. ' : 'The direct fishery for Greenland halibut is closed, and then it can only be bycatch, at most 7 % of the week\'s landings. ') + Math.round(z.kg) + ' kg of Greenland halibut is confiscated, worth ' + kr(Math.round(z.kr)) + '.'); }
  // the rows of the note: one per species with the reason (spilltest 3, F1: all of it was called «cod over quota»)
  if (zConf > 0.5){ confSp.torsk.kg += zConf; confSp.torsk.kr += zKr; }
  if (vedKr > 0) log('Vederlag for ilandføring av det inndratte: ' + kr(vedKr) + ' (20 % av verdien).', 'Compensation for landing what was confiscated: ' + kr(vedKr) + ' (20% of its value).');
  const confRows = Object.keys(confSp).filter(sp => confSp[sp].kg > 0.5).sort((a, c) => ALLSP.indexOf(a) - ALLSP.indexOf(c)).map(sp => [sp, Math.round(confSp[sp].kg), Math.round(confSp[sp].kr),
    sp === 'blakveite' ? (bkDirect(H, BOAT.len) ? 'bkmax' : 'bk7') : sp === 'torsk' && zConf > 0.5 && zConf >= confSp.torsk.kg - zConf ? 'byc5' : acc === 'none' ? 'byc10' : sp === 'torsk' ? 'kvote' : 'byclukket']);
  { const d = confRows.reduce((a, r) => a + r[2], 0) - confKr; if (confRows.length && d) confRows[confRows.length - 1][2] -= d; }   // the rows add up to the total taken off
  const crabFine = 0;
  if (crabDead > 0.05) msg(port.name, vt + fmt(crabDead, 1) + ' kg av kongekrabben var død og er vraket. Død krabbe betales ikke. Et krabbekar med sjøvann holder den levende i flere døgn.', vt + fmt(crabDead, 1) + ' kg of the king crab was dead and has been discarded. Dead crab is not paid for. A live crab tank keeps it alive for days.');
  // confKg and confKr count all that was confiscated (crab too); codKg and codKr are the cod, haddock and saithe rows on the note
  S.lastSale = {port:port.id, t:S.t, lines:arr, total, ex, confKg:confKg + crabSmall, confKr:confKr + crabKr, codKg:confKg, codKr:confKr, vedKr, confRows, crabKg:crabSmall, crabKr, crabDead, ordKr, gutKr, gutKg:Math.round(gutKg), ffKg:codFF, field, lott, tk, mva, fk, ls:{D:LS.D, M:LS.M, n:LS.n, own:LS.own, tot:LS.tot, f:LS.f, ref:LS.ref, pot:LS.pot, mask:(S.equip && S.equip.jukse) || 0, per:LS.per.map(p => ({name:p.c.name, lots:p.lots, kr:p.kr, sk:p.sk, x:p.x, appr:p.appr}))}, coopKr, ord:ordLines, acc, crabFine, roeCut, streak:{pct:stPct, kr:stKr}, gear:Object.keys(b.tripGear || {}), sno:snoQ ? {tq:snoQ.tq, ord:snoQ.ord, live:snoQ.live} : null, why}; b.tripGear = {};
  tatLanding(port.id); checkTattoos();
  if (S.tut && S.tut.catch) S.tut.catch = false;   // the first-trip guarantee ends with the first landing
  for (const x of S.hold) delete x._used;
  log('Leverte ' + Math.round(kg) + ' kg i ' + port.name + ' for ' + kr(total) + '.', 'Landed ' + Math.round(kg) + ' kg at ' + port.name + ' for ' + kr(total) + '.');
  if (why){ log(why[0], why[1]);
    // (nothing of who: the jig's kilos an hour, a fair hour for the rig and the share the weather, the cold, the wear and the fishing down took; the hauls against fair ones)
    if (typeof cloudEv === 'function') cloudEv('slip_why', {kgph:tw.j ? Math.round(tw.j.kgph) : null, fair:tw.j ? Math.round(tw.j.fair) : null, pen:tw.j ? Math.round(tw.j.pen * 100) / 100 : null, gq:tw.g ? Math.round(tw.g.kg / tw.g.fair * 100) / 100 : null}); }
  { const ls = S.lastSale, pt = port; setTimeout(() => { try { plantSay(pt, ls); } catch (e){ console.error(e); } }, 900); }   // the plant's hands comment (core/09d-folk.js)
  cashFx(S.cash - cashBefore);   // the register rings and the sum counts into the account (ui/02-format-state.js)
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
  // a guest is told now how the game is kept, and that registering comes later (Tony 06.11.2026: he was not asked for an account early,
  // and feared the first trip's progress was lost; the card after the first landing asks, ui/10f-cloud.js guestAsk)
  const guestNote = typeof isGuest === 'function' && isGuest() ? '<p class="note">' + L('Spillet lagres av seg selv i denne nettleseren mens du spiller. Etter første levering kan du registrere deg på ti sekunder, så følger båten, pengene og fangsten deg på alle enheter.', 'The game saves itself in this browser as you play. After the first landing you can register in ten seconds, and the boat, the money and the catch follow you on every device.') + '</p>' : '';
  modal('<div class="ob"><h2>' + L('Båten etter far', 'Father\'s boat') + '</h2><p>' + L('Hun ligger ved naustet slik han lot henne ligge. Hun er din nå.', 'She lies at the boathouse as he left her. She is yours now.') + '</p>' + guestNote +
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
// (the time away, away: also while Autonav finds a way round shallow water, sailWaiting in core/05-vessels.js)
function playMinutes(n, away){ let i = 0; LANDQ.away = !!away; try { for (; i < n; i++){ if (!simAreaReady() || (away && sailWaiting())){ CATCH_LEFT += n - i; break; } step(); } } finally { LANDQ.away = false; } return i; }   // (LANDQ.away: no queue at the plants while the time away is played, core/07-harbours.js)
// on the world's clock (core/01-world.js) the time away is what the game is behind it, all of it; more than two weeks is skipped to the
// last two (the clock moves on, the simulation plays the last two weeks)
const WORLD_SIM_MAX = 14 * 24 * 60;
function catchUp(realMs){
  let mins = Math.min(CATCHUP_CAP, Math.floor(realMs / 1000 / 60 * GAME_RATE));
  if (WCLOCK.on){ const w = worldT(); mins = Math.max(0, w - S.t); if (mins > WORLD_SIM_MAX){ S.t = w - WORLD_SIM_MAX; mins = WORLD_SIM_MAX; } realMs = mins / GAME_RATE * 60000; }
  if (mins < 1) return;
  if (mins >= 10) awayStart(mins, realMs);
  playMinutes(mins, true);
  panelDirty = true;
  if (!CATCH_LEFT && AWAYR) awayEnd();
  if (realMs >= 5 * 60000) WAKE_BACK = true;
}
let lastWall = Date.now(), acc = 0, lastPanel = 0, lastSave = 0, WAKE_BACK = false;
function tick(){
  const now = Date.now(), dt = (now - lastWall) / 1000; lastWall = now;
  // a page that slept (a tab in the background, a phone in a pocket) asks first whether another page has the game now: it plays nothing
  if (TAB.lost || (dt > 2 && !tabMine())) return;
  // and whether another device has taken the game meanwhile (ui/10f-cloud.js): nothing plays while that is asked, or while it has it
  if (dt > 8 && typeof cloudWake === 'function') cloudWake();
  if (TAB.held || TAB.wait) return;
  // (until the simulation's data is in, the clock waits: 11-boot.js)
  if (SIMREADY){ if (CATCH_LEFT > 0){ DYN.on = false; const n = Math.min(CATCH_LEFT, 3000); CATCH_LEFT -= n; playMinutes(n, true); panelDirty = true; if (!CATCH_LEFT && AWAYR) awayEnd(); }
  else if (WCLOCK.on){
    // one clock for everyone: step on to the world's minute; more than ten minutes behind (the tab slept) is time away; a save from
    // before that is ahead goes at half pace until the world has caught up with it
    const wf = worldTf(), gap = wf - S.t;
    if (gap > 10){ DYN.on = false; catchUp(0); }   // (time caught up plays the kinematic minute step: she keeps the world's clock, and the model takes over again from where that put her)
    else { dynTick(dt); let n = 0;
      if (gap >= 0){ while (S.t + 1 <= wf && n < 3000 && simAreaReady()){ step(); n++; } acc = clamp(wf - S.t, 0, 0.999); }
      else { acc += dt * GAME_RATE / 120; while (acc >= 1 && n < 3000 && simAreaReady()){ step(); acc -= 1; n++; } }
      if (n) panelDirty = true; }
  }
  // (as on the world's clock: a real stall of more than ten game minutes is caught up with the kinematic minute step; a shorter one is
  // stepped as usual, with the model moving her through it, so no game time is lost and she is not moved under the 3D view; the admin
  // tempo, S.mult, makes a tick worth many minutes and is stepped, never caught up: catchUp counts real time at the base rate)
  else if (dt > 6 && dt * simRate() / 60 > 10){ DYN.on = false; catchUp(dt * 1000); acc += (dt * simRate() / 60) % 1; } else { dynTick(dt); acc += dt * simRate() / 60; let n = 0; while (acc >= 1 && n < 3000 && simAreaReady()){ step(); acc -= 1; n++; } } }
  if (WAKE_BACK && !CATCH_LEFT){ WAKE_BACK = false; if (asleep()) wakeEarly(true); }
  heatTick();
  if (!G3.isActive()){ renderDyn(); if (AISSEL) renderAisCard(); heatPaint(); } renderHud(); renderClock(); renderActs(); DOCK.tick(); showroomTick(); HUI.tick(); energyUi(); turFotoUi(); INSTR.renderGPS(); renderRouteTools(); tutUpdate(); PHONE.status(); PHONE.tickHome();
  if (S.order) deliverOrder();
  // the chart's night colours follow the sun: drawn again when they change
  if (S.t !== CHN.t){ CHN.t = S.t; if (chartNight() !== CHN.v && document.body.classList.contains('vplot')) renderBase(); }
  const pnow = performance.now();
  if ((panelDirty || pnow - lastPanel > 1000) && !panelBusy()){ renderPanel(); lastPanel = pnow; panelDirty = false; }
  if (now - lastSave > 5000){ save(); lastSave = now; if (streakTouch()) refreshAll(); ruTips(); }
}
// the yard hands over a new build in Finnsnes: in exchange for the vessel it was ordered against (once she is moored there), or as an
// extra vessel for the fleet (vid null)
// (no building time since 13.10.2026: a new build is delivered when it is bought; an order from before is delivered now, the vessel it
// replaces swapped wherever she lies in port, and a vessel for the fleet at the harbour of the one followed, or Finnsnes)
function deliverOrder(){
  const o = S.order, k = o.type, tv = o.vid === null ? null : vesselById(o.vid || S.cur);
  if (!tv){ S.order = null; const v = newVesselObj(k, S.boat.status === 'port' && S.boat.port ? S.boat.port : 'finnsnes'); log('Overtok ' + VESSELS[k].name.no + ' fra verftet. Hun heter «' + v.boatName + '» og ligger i ' + portById(vget(v, 'boat').port).name + '.', 'Took delivery of the ' + VESSELS[k].name.en + ' from the yard. She is called «' + v.boatName + '» and lies at ' + portById(vget(v, 'boat').port).name + '.');
    msg('Verftet', 'Den nye båten, «' + v.boatName + '», er levert og ligger klar.', 'The new vessel, the «' + v.boatName + '», has been delivered and is ready.'); save(); return; }
  const b = vget(tv, 'boat'); if (b.status !== 'port' || !b.port) return;
  S.order = null; onVessel(tv, () => PHONE.switchVessel(k)); save();
}
document.addEventListener('visibilitychange', () => { if (document.hidden) save(); else tabMine(); });
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
function setBodyView(v3d){ if (v3d && typeof KK !== 'undefined' && KK.on) kkChart(false);   // Kystkartet off with the chart (ui/05h-kystkart.js)
  document.body.classList.remove('drawer'); if (v3d) plotSetOpen(false); document.body.classList.toggle('v3d', v3d); document.body.classList.toggle('vplot', !v3d); }
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
hooks.on3dFail = () => { setBodyView(false); loaderGone(); $('plotClose').hidden = true; tab = 'route'; renderPanel(); applyView(); renderStatic(); renderDyn(); };
