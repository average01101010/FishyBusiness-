// actions
panel.addEventListener('pointerdown', () => { pressHold = true; });
window.addEventListener('pointerup', () => { setTimeout(() => { pressHold = false; }, 250); });
panel.addEventListener('click', e => { const el = e.target.closest('[data-act]'); if (el && !el.disabled) doAct(el); });
function doAct(el){
  const act = el.dataset.act, i = +el.dataset.i, b = S.boat, L = (no, en) => S.lang === 'no' ? no : en;
  if (act === 'fp' || act === 'fm'){ const w = S.draft[i]; if (w) w.fish = clamp((w.fish || 0) + (act === 'fp' ? 1 : -1), 0, 12); }
  else if (act === 'rm') S.draft.splice(i, 1);
  else if (act === 'undo') S.draft.pop();
  else if (act === 'clear') S.draft = [];
  else if (act === 'start'){
    if (!S.draft.length || !['port', 'idle'].includes(b.status)) return;
    if (!meAboard() && !crewAboard().length){ toast(L('Båten har ikke mannskap. Uten deg om bord trenger den folk.', 'The boat has no crew. Without you aboard it needs hands.')); return; }
    const later = S.draftDep && S.draftDep > S.t ? S.draftDep : null;
    if (!later && b.status === 'port' && S.jobs && S.jobs.length){ toast(t('yard_busy', hm((jobsDone() || S.t) / 60))); return; }
    S.plan = {wps:S.draft.map(w => ({...w})), idx:0, speed:S.draftSpeed, returning:false, depAt:later, unsafe:draftHazards().map(h => h.unsafe)};
    S.draft = []; S.draftDep = null;
    if (later) log('Avgang planlagt ' + dayStr(later / 60) + ' kl. ' + hm(later / 60) + '.', 'Departure planned for ' + dayStr(later / 60) + ' at ' + hm(later / 60) + '.');
    else { if (b.status === 'idle') log('Ny rute satt.', 'New route set.'); depart(); }
    if (!G3.isActive()) G3.show(true, true);
  }
  else if (act === 'depnow'){ if (!S.plan) return; if (b.status === 'port' && S.jobs && S.jobs.length){ toast(t('yard_busy', hm((jobsDone() || S.t) / 60))); return; } if (!meAboard() && !crewAboard().length){ toast(L('Båten har ikke mannskap. Uten deg om bord trenger den folk.', 'The boat has no crew. Without you aboard it needs hands.')); return; } depart(); if (!G3.isActive()) G3.show(true, true); }
  else if (act === 'cm'){ const m = el.dataset.m; if (m === 'fish' && !S.equip.plotter){ toast(t('need_plotter')); PHONE.open('utstyr'); return; } S.settings.chart = m; renderBase(); scheduleStatic(); }
  else if (act === 'sd-' || act === 'sd+'){ S.settings.safeDepth = clamp(safeDepth() + (act === 'sd+' ? 1 : -1), 1, 30); hzCache.k = ''; renderBase(); scheduleStatic(); }
  else if (act === 'rod'){ window.ROD.toggle(); renderActs(); return; }
  else if (act === 'pub'){ window.PUBW.open(); return; }
  else if (act === 'target'){ if (kveiteClosed(S.t / 60)){ S.target = 'mix'; toast(L('Kveita er fredet fra 20. desember til og med 20. april.', 'Halibut is closed from 20 December to 20 April.')); } else S.target = S.target === 'kveite' ? 'mix' : 'kveite'; renderActs(); return; }
  else if (act === 'kgear'){ if (S.cash < PRICE.kgear){ toast(t('no_cash')); return; } S.cash -= PRICE.kgear; S.stats.costs += PRICE.kgear; b.kgear = true; log('Kjøpte kveiteutstyr: stor pilk, kraftig snøre og gaff.', 'Bought halibut gear: big pilk, heavy line and gaff.'); }
  else if (act === 'opssave'){
    const last = S.draft[S.draft.length - 1]; if (!last || !last.port || b.status !== 'port'){ toast(S.lang === 'no' ? 'Planen må starte i havn og slutte i en havn.' : 'The plan must start in port and end in a port.'); return; }
    const hours = S.draft.reduce((a, w) => a + (w.fish || 0), 0) + estimate().hours;
    S.ops = Object.assign({on:false, dep:5, days:[1, 1, 1, 1, 1, 0, 0], maxWind:12, skipper:(S.crew[0] || {}).id || null, last:-1}, S.ops || {}, {wps:S.draft.map(w => ({...w})), speed:S.draftSpeed, home:b.port, end:last.port, hours:Math.ceil(hours)});
    toast(S.lang === 'no' ? 'Lagret som fast driftsplan. Slå den på i Mannskap-appen.' : 'Saved as the standing plan. Switch it on in the Crew app.'); PHONE.open('mannskap');
  }
  else if (act === 'depcancel'){ S.plan = null; log('Avgangen er avlyst.', 'Departure cancelled.'); }
  else if (act === 'stop'){ S.plan = null; b.status = 'idle'; b.v = 0; log('Stoppet båten.', 'Stopped the boat.'); }
  else if (act === 'retrace') startReturn(false);
  else if (act === 'tow') rescue(true);
  else if (act === 'fh+' || act === 'fh-') S.fishPlanH = clamp(S.fishPlanH + (act === 'fh+' ? 1 : -1), 1, 12);
  else if (act === 'startfish'){ b.status = 'fishing'; b.fishUntil = S.t + S.fishPlanH * 60; log('Starter fiske i ' + S.fishPlanH + ' t.', 'Fishing for ' + S.fishPlanH + ' h.'); }
  else if (act === 'stopfish'){ b.fishUntil = S.t; S.plan = null; endFishing('done'); }
  else if (act === 'sell') startLanding(false);
  else if (act === 'fuel'){
    if (!(portById(b.port) || {}).fuel) return;
    const fp = fuelPrice(); let l = BOAT.fuelCap - b.fuel; const cost = l * fp;
    if (S.cash <= 0){ toast(t('no_cash')); return; }
    if (cost > S.cash) l = S.cash / fp;
    b.fuel += l; S.cash -= l * fp; S.stats.costs += l * fp;
    log('Fylte ' + Math.round(l) + ' L ' + (BOAT.diesel ? 'diesel' : 'bensin') + '.', 'Filled ' + Math.round(l) + ' L of ' + (BOAT.diesel ? 'diesel' : 'petrol') + '.');
  }
  else if (act === 'ice'){
    if (!(portById(b.port) || {}).ice) return;
    const kg = Math.min(50, BOAT.iceCap - b.ice), c = kg * PRICE.ice;
    if (c > S.cash){ toast(t('no_cash')); return; }
    b.ice += kg; S.cash -= c; S.stats.costs += c; iceChute(kg);
  }
  else if (act === 'gear'){ if (PRICE.gear > S.cash){ toast(t('no_cash')); return; } b.gear = true; S.cash -= PRICE.gear; S.stats.costs += PRICE.gear; }
  else if (act === 'reset'){ if (confirm(t('reset_q'))){ const lang = S.lang; S = newState(); S.lang = lang; S.intro = true; S.draft = []; ensureFleet(); save(); refreshAll(); } return; }
  renderPanel(); renderDyn(); renderHud(); renderClock(); renderActs(); save();
}
function panelInput(e){
  if (e.target.id === 'spd'){ S.draftSpeed = +e.target.value; $('spdOut').textContent = S.draftSpeed + ' kn, ' + t('lpnm', fmt(fuelLph(S.draftSpeed, windAt(S.t / 60)) / S.draftSpeed, 2)); }
  if (e.target.id === 'spdLive' && S.plan){ S.plan.speed = +e.target.value; $('spdLiveOut').textContent = S.plan.speed + ' kn'; }
  if (e.target.id === 'autoW'){ S.settings.autoW = +e.target.value; $('autoWOut').textContent = S.settings.autoW + ' m/s'; }
}
function panelChange(e){
  const id = e.target.id;
  if (id === 'setBleed') S.settings.bleed = e.target.checked;
  if (id === 'setGut') S.settings.gut = e.target.checked;
  if (id === 'setIce') S.settings.ice = e.target.checked;
  if (id === 'setAuto') S.settings.autoOn = e.target.checked;
  if (id === 'dep'){ S.draftDep = e.target.value ? +e.target.value : null; e.target.blur(); }
  e.target.blur && e.target.type === 'range' && e.target.blur();
  panelDirty = true; save();
}
panel.addEventListener('input', panelInput);
panel.addEventListener('change', panelChange);
function sell(){
  const b = S.boat, port = portById(b.port); if (!port || !port.mottak) return;
  const H = S.t / 60, q = quotaState(), lines = {}, extra = [], acc = access(), kgOf = sp => S.hold.filter(x => x.sp === sp).reduce((a, x) => a + x.kg, 0);
  let total = 0, kg = 0;
  const wk = weekOfH(H); if (q.ffW !== wk){ q.ffW = wk; q.ffTot = 0; q.ffCod = 0; }
  const saleKg = S.hold.reduce((a, x) => a + (x.sp === 'hyse' && x.cls === 2 ? 0 : grade(x.fresh) === 'V' ? 0 : x.kg), 0);
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
  }
  let confKr = 0, confKg = 0, ordKr = 0;
  for (const x of S.hold){
    const sp = x.sp, sd = SPECIES[sp], c = x.cls != null ? x.cls : sd.ref, g = grade(x.fresh);
    let ppk = g === 'V' ? 1 : clsPrice(port, sp, c, H, x.hook) * GM[g];
    if (x.gut && (sp === 'hyse' || sp === 'sei')) ppk += 0.30;           // no gutting fee deducted
    let v = x.kg * ppk;
    const cs = confBy[sp] || 0; if (cs > 0){ confKr += v * cs; confKg += x.kg * cs; v *= 1 - cs; }
    // orders for this harbour take matching fish first, at their premium (confiscated fish does not count)
    const keptKg = x.kg * (1 - cs);
    for (const o of ordState().active){ if (o.port !== port.id || o.sp !== sp || o.left <= 0.01 || !gradeOk(g, o.q)) continue; const take = Math.min(keptKg - (x._used || 0), o.left); if (take <= 0.01) continue;
      x._used = (x._used || 0) + take; o.left -= take; const add = take / keptKg * v * o.prem; ordKr += add; o.saleKg = (o.saleKg || 0) + take; o.saleKr = (o.saleKr || 0) + add; }
    const k = sp + '|' + c + '|' + g + '|' + (x.gut ? 1 : 0);
    lines[k] = lines[k] || {sp, c, g, gut:!!x.gut, kg:0, sum:0}; lines[k].kg += x.kg; lines[k].sum += v; total += v; kg += x.kg;
    // liver and roe from fish gutted on board
    if (x.gut && sd.liver){ const m = gDate(H).getUTCMonth(), roeF = sp === 'torsk' && m <= 3 ? 0.04 : 0.01;
      extra.push(['lever', x.kg * 0.05, sd.liver]); extra.push(['rogn', x.kg * roeF, sd.roe]); }
    S.market[port.id] = S.market[port.id] || {}; S.market[port.id][sp] = (S.market[port.id][sp] || 0) + x.kg;
  }
  // finished orders pay their bonus; the customer remembers
  const ordLines = []; { const O = ordState();
    for (const o of O.active.slice()){ if (!o.saleKg) continue; const c = CUSTOMERS.find(z => z.id === o.cust), done = o.left <= 0.5; let bonus = 0;
      if (done){ bonus = o.bonus; O.active.splice(O.active.indexOf(o), 1); O.done.unshift({...o, t:S.t}); O.done = O.done.slice(0, 10); S.rep[o.cust] = clamp(repOf(o.cust) + 8, 0, 100); msg(c.no, 'Takk for leveransen! Her er ' + kr(bonus) + ' ekstra for at alt kom i tide.', 'Thanks for the delivery! Here is ' + kr(bonus) + ' extra for having it all on time.'); }
      ordLines.push({cust:c.no, sp:o.sp, kg:o.saleKg, kr:o.saleKr, bonus, done, left:o.left}); ordKr += bonus; o.saleKg = 0; o.saleKr = 0; } }
  total += ordKr;
  let exKr = 0; const ex = {}; for (const [n, k2, pr] of extra){ ex[n] = ex[n] || {kg:0, sum:0}; ex[n].kg += k2; ex[n].sum += k2 * pr; exKr += k2 * pr; }
  total += exKr;
  q.torsk += codQ; q.hyse += kgOf('hyse') * (1 - (confBy.hyse || 0)); q.sei += kgOf('sei') * (1 - (confBy.sei || 0)); q.byCod = (q.byCod || 0) + byCod;
  if (acc !== 'none'){ q.ffTot += saleKg; q.ffCod += codFF; } q.conf += confKg; q.confKr += confKr;
  const arr = Object.values(lines).sort((a, c) => SP.indexOf(a.sp) - SP.indexOf(c.sp) || a.c - c.c || 'EABXV'.indexOf(a.g) - 'EABXV'.indexOf(c.g));
  // lott goes to those who were aboard; a crew member given time off gets none for this trip
  const aboardNow = crewAboard(), lott = aboardNow.reduce((a, c) => a + c.share, 0) * total;
  for (const c of aboardNow) c.earn = (c.earn || []).filter(e => e[0] > S.t - 7 * 1440).concat([[S.t, total * c.share]]);
  for (const c of S.crew) c.off = false;
  S.cash += total - lott; S.stats.revenue += total; S.stats.costs += lott; S.stats.kg += kg; S.hold = [];
  const fs = S.marks.length ? S.marks[S.marks.length - 1] : null, field = fieldCode(S.fsess || fs || b.pos);
  S.sales.push({t:S.t, v:S.cur, port:port.id, kg:Math.round(kg), total:Math.round(total), sp:SP.map(sp => [sp, Math.round(arr.filter(r => r.sp === sp).reduce((a, r) => a + r.kg, 0))]).filter(r => r[1] > 0)}); if (S.sales.length > 200) S.sales.shift();
  if (lott > 0) log('Mannskapet fikk ' + Math.round(lott) + ' kr i lott.', 'The crew received NOK ' + Math.round(lott) + ' as their share.');
  if (codFF > 0.5) log(Math.round(codFF) + ' kg torsk gikk på ferskfisktillegget.', Math.round(codFF) + ' kg of cod went on the fresh-fish allowance.');
  const vt = S.fleet && S.fleet.length > 1 ? '«' + S.boatName + '»: ' : '';
  if (acc === 'none' && confKg > 0.5) msg('Norges Råfisklag', vt + 'Båten har ikke adgang til å fiske torsk, hyse og sei. Av disse kan bare 10 % av landingen være bifangst, og høyst ' + fmt(BYCATCH.cod / 1000, 0) + ' tonn torsk i året. ' + Math.round(confKg) + ' kg er inndratt, verdi ' + kr(Math.round(confKr)) + '.', vt + 'The boat has no access to fish cod, haddock and saithe. Only 10% of the landing may be bycatch of these, and at most ' + fmt(BYCATCH.cod / 1000, 0) + ' t of cod a year. ' + Math.round(confKg) + ' kg has been confiscated, worth ' + kr(Math.round(confKr)) + '.');
  else if (codConf > 0.5) msg('Norges Råfisklag', vt + 'Du hadde ikke torskekvote igjen for ' + Math.round(codConf) + ' kg torsk. Verdien, ' + kr(Math.round(confKr)) + ', er inndratt.', vt + 'You had no cod quota left for ' + Math.round(codConf) + ' kg of cod. Its value, ' + kr(Math.round(confKr)) + ', has been confiscated.');
  S.lastSale = {port:port.id, t:S.t, lines:arr, total, ex, confKg, confKr, ffKg:codFF, field, lott, ord:ordLines, acc};
  if (S.tubs){ log('Leverte tilbake de lånte fiskekarene.', 'Returned the borrowed fish tubs.'); S.tubs = 0; }
  for (const x of S.hold) delete x._used;
  log('Leverte ' + Math.round(kg) + ' kg i ' + port.name + ' for ' + Math.round(total) + ' kr.', 'Landed ' + Math.round(kg) + ' kg at ' + port.name + ' for NOK ' + Math.round(total) + '.');

}

// ---------- modal ----------
function modal(html){ const m = $('modal'); m.innerHTML = '<div class="box" role="dialog" aria-modal="true">' + html + '</div>'; m.hidden = false; const b = m.querySelector('[data-close]'); if (b){ b.onclick = () => { m.hidden = true; }; b.focus(); } }
function showIntro(namesOnly){
  const L = (no, en) => S.lang === 'no' ? no : en;
  modal('<div class="ob"><h2>' + (namesOnly ? L('Gi båten et navn', 'Name your boat') : t('intro_h')) + '</h2>' + (namesOnly ? '<p>' + L('Dekksdagboka trenger et båtnavn.', 'The deck log needs a boat name.') + '</p>' : '<p>' + t('intro1') + '</p>') +
    '<label for="obCo">' + L('Firmanavn', 'Company name') + '</label><input id="obCo" maxlength="28" autocomplete="off" placeholder="' + L('F.eks. Senja Kystfiske', 'e.g. Senja Coastal Fishing') + '" value="' + (S.company || '').replace(/"/g, '') + '">' +
    '<label for="obBoat">' + L('Båtens navn', 'Boat name') + '</label><input id="obBoat" maxlength="20" autocomplete="off" placeholder="' + L('F.eks. Havbris', 'e.g. Havbris') + '" value="' + (S.boatName || '').replace(/"/g, '') + '">' +
    (namesOnly ? '' : '<p>' + t('intro2') + '</p><p class="note">' + t('intro3') + '</p>') + '<div class="btns"><button class="btn primary" data-close id="obGo">' + t('intro_go') + '</button></div></div>');
  $('obGo').addEventListener('click', () => {
    const co = $('obCo').value.trim().slice(0, 28), bn = $('obBoat').value.trim().slice(0, 20);
    S.company = co || L('Senja Kystfiske', 'Senja Coastal Fishing'); S.boatName = bn || 'Havbris';
    if (!S.intro){ S.tut = 1; log('Overtok «' + S.boatName + '» i Finnsnes for ' + S.company + '.', 'Took over the «' + S.boatName + '» in Finnsnes for ' + S.company + '.'); }
    S.intro = true; save(); refreshAll();
  });
}
function showAway(mins, fromIdx){
  const ev = S.log.slice(fromIdx);
  modal('<h2>' + t('away') + '</h2><p class="note">' + t('away_n', dur(mins / 60)) + '</p>' + (ev.length ? '<ul class="log">' + ev.map(e => '<li><time>' + hm(e.t / 60) + '</time><span>' + (S.lang === 'no' ? e.no : e.en) + '</span></li>').join('') + '</ul>' : '') + '<div class="btns"><button class="btn primary" data-close>' + t('ok') + '</button></div>');
}

// ---------- time ----------
const CATCHUP_CAP = 72 * 60;
function catchUp(realMs){
  const mins = Math.min(CATCHUP_CAP, Math.floor(realMs / 1000 / 60 * GAME_RATE));
  if (mins < 1) return;
  const idx = S.log.length;
  for (let i = 0; i < mins; i++) step();
  panelDirty = true;
  if (mins >= 10) showAway(mins, idx);
}
let lastWall = Date.now(), acc = 0, lastPanel = 0, lastSave = 0;
function tick(){
  const now = Date.now(), dt = (now - lastWall) / 1000; lastWall = now;
  if (dt > 6) catchUp(dt * 1000);
  else { acc += dt * GAME_RATE * S.mult / 60; let n = 0; while (acc >= 1 && n < 3000){ step(); acc -= 1; n++; } }
  if (!G3.isActive()){ renderDyn(); if (AISSEL) renderAisCard(); } renderHud(); renderClock(); renderActs(); INSTR.renderGPS(); tutUpdate(); PHONE.status(); PHONE.tickHome();
  if (S.order && S.t >= S.order.due) deliverOrder();
  const pnow = performance.now();
  if ((panelDirty || pnow - lastPanel > 1000) && !panelBusy()){ renderPanel(); lastPanel = pnow; panelDirty = false; }
  if (now - lastSave > 5000){ save(); lastSave = now; }
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
  $('pace').options[0].textContent = t('pace1');
  $('lang').textContent = S.lang === 'no' ? 'EN' : 'NO';
  $('bkToday').textContent = t('today'); $('logbook').setAttribute('aria-label', S.lang === 'no' ? 'Dekksdagbok' : 'Deck log');
  $('gps').dataset.hint = S.lang === 'no' ? 'KART ›' : 'CHART ›'; document.querySelector('#plotTop .pt-title').textContent = S.lang === 'no' ? 'Kartplotter' : 'Chart plotter';
  $('view3d').textContent = (typeof G3 !== 'undefined' && G3.isActive()) ? t('view_chart') : '3D';
  $('lang').setAttribute('aria-label', S.lang === 'no' ? 'Switch to English' : 'Bytt til norsk');
  $('zin').setAttribute('aria-label', t('zin')); $('zout').setAttribute('aria-label', t('zout')); $('zboat').setAttribute('aria-label', t('zboat'));
  svg.setAttribute('aria-label', S.lang === 'no' ? 'Sjøkart over Senja' : 'Chart of Senja');
}
$('view3d').onclick = () => G3.toggle();
// ---------- screens: full-screen 3D, or the chart plotter for route planning ----------
function setBodyView(v3d){ document.body.classList.remove('drawer'); document.body.classList.toggle('v3d', v3d); document.body.classList.toggle('vplot', !v3d); }
function openPlotter(){ if (G3.isActive()) G3.show(false); else { setBodyView(false); tab = 'route'; renderPanel(); applyView(); renderStatic(); renderDyn(); } }
$('gps').addEventListener('click', () => { if (document.body.classList.contains('v3d')) openPlotter(); });
$('gpsBtn').addEventListener('click', openPlotter);
$('plotClose').onclick = () => G3.show(true);
$('ecClose').onclick = () => G3.show(true);
$('ecRoute').onclick = () => document.body.classList.toggle('drawer');
$('camBtn').onclick = () => { G3.setHelm(!G3.isHelm()); updateMapButtons(); };
$('phoneFab').onclick = () => PHONE.toggle();
$('plotStyle').onclick = () => {};
hooks.on3dFail = () => { setBodyView(false); $('loader').classList.add('gone'); $('plotClose').hidden = true; tab = 'route'; renderPanel(); applyView(); renderStatic(); renderDyn(); };
let actsHtml = '';
