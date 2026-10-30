  function show(on, a){ const was = isOpen; isOpen = on; if (a === 'kaiboden') a = kbLast; if (a) app = a === 'admin' && !adminOk() ? 'home' : a; else if (on && !was) app = 'home'; /* a closed phone opens on the home screen, not on the last app */ if (on){ el.hidden = false; void el.offsetWidth; el.classList.remove('off'); render(); } else { el.classList.add('off'); setTimeout(() => { if (!isOpen) el.hidden = true; }, 300); } }
  function status(){
    const H = (S.t + liveFrac()) / 60, bars = S.boat.status === 'port' ? 4 : coverage(S.boat.pos);
    tEl.textContent = hm(H);
    nEl.innerHTML = '<span>' + (bars ? 'Kystnett' : L('Ingen dekning', 'No service')) + '</span><span class="bars">' + [4, 6, 8, 10].map((h, i) => '<i style="height:' + h + 'px" class="' + (i < bars ? '' : 'off') + '"></i>').join('') + '</span><span class="bat"></span>';
  }
  // live bits of the home screen are updated in place, so icons never move under a finger
  function tickHome(){
    if (!isOpen || app !== 'home') return; const H = S.t / 60, q = c => view.querySelector(c);
    const a = q('.ph-clock'), d = q('.ph-date'), w1 = q('.w1'), w2 = q('.w2'); if (!a) return;
    a.textContent = hm(H); d.textContent = dayStr(H); w1.textContent = dirName(windDir(H)) + ' ' + fmt(windAt(H), 0) + ' m/s · ' + fmt(Math.round(airTemp(H)) || 0, 0) + ' °C'; w2.textContent = kr(S.cash);
  }
  let shown = '';
  function render(){ status(); setBadge(); if (!isOpen) return; if (app === 'patch' && S.settings.patchSeen !== PATCH[0][0]){ S.settings.patchLast = S.settings.patchSeen; S.settings.patchSeen = PATCH[0][0]; } const key = app + '|' + (sub[app] || ''), y = key === shown ? view.scrollTop : 0; view.innerHTML = app === 'home' ? home() : shell(app); shown = key; view.scrollTop = y; }
  // every page by name: the phone apps, and the pages that open in the dock's drawer instead (DRAWER)
  const PAGES = () => ({vaer, post, salg, kvote, regler, redning, rederi, meld, haill, skip:skipApp, kaiboden:() => PAGES()[kbLast](), logg, merker, naustp:() => NOTEBOOK.page(), sesong:() => SEASONAPP.page(), guide:() => GUIDE.page(), folk:() => FRIENDS.page(), gbook:() => GBOOK.page(), trim, patch, handbok:() => HBUI.page(), tilbake:() => FEEDBACK.page(), innst, admin,
    ordl, rigg, arbeid:() => WORK.page() + (DRIFT2 ? PLAN2UI.line() : DRIFTUI.line()), drift:() => DRIFT2 ? PLAN2UI.page() : DRIFTUI.page(), fiske, service, nett, fartoy:() => fartoy('marked'), maler:() => PAINT.page(), utstyr:() => utstyr('verft'), utstyrb:() => utstyr('butikk'), redskap, mannskap, bors, bank, verksted, havn, last, lever, is:isApp, agn, oppdrag, beholdning});
  function shell(a){ const kb = KBT.includes(a); if (kb) kbLast = a; const h = kb ? 'kaiboden' : a, d = APPS.find(x => x[0] === h) || [a, a, a, '#28507f'], f = PAGES()[a]; return '<div class="ph-appv' + (a === 'post' || a === 'notat' ? ' ph-paper' : '') + '"><div class="ph-top" style="background:' + d[3] + '"><span class="ic">' + (IC[h] || '') + '</span>' + L(d[1], d[2]) + '</div>' + (kb ? kbTabs(a) : '') + (SEL_APPS.includes(a) ? selRow() + withSel(f) : f()) + '</div>'; }
  // a page for the drawer, and an action tapped there: it runs as if that page were the open app, and says which page shows next
  function page(a){ const f = PAGES()[a]; return f ? (SEL_APPS.includes(a) ? selRow() + withSel(f) : f()) : ''; }
  function dact(cur, a, d){
    const keep = app; let done; app = cur;
    try { done = SEL_APPS.includes(app) && !NAV.has(a) ? withSel(() => act0(a, d)) : act0(a, d); } finally { cur = app; app = keep; }
    if (done){ save(); renderHud(); renderClock(); panelDirty = true; render(); }
    return cur;
  }
  // --- Trim: more speed for the boat you are aboard for a while (core BOOSTS; Jonas 05.10.2026: sold for real money, the time in game
  // hours, one at a time); a test without payment until the shop is in, diesel engines only
  const TRIM_SELL = {pump:['En rask start: +50 % fart i et helt døgn. Du er tidligere ute på feltet og tidligere inne med fersk fisk.', 'A quick start: +50% speed for a whole day. Out on the grounds sooner, and in sooner with fresh fish.'],
    ic:['+75 % fart i to døgn. Rekk flere turer før været snur, og lever mens prisen er god.', '+75% speed for two days. Fit in more trips before the weather turns, and land while the price is good.'],
    turbo:['Dobbel fart i tre døgn! Nå de fjerne feltene og vær hjemme før de andre.', 'Double speed for three days! Reach the far grounds and be home before the others.']};
  function trim(){
    const b = S.boat, V = VESSELS[b.type], on = trimOn(b), h = ['<div class="ph-c">'], hrs = x => fmt(x, 0) + L(' timer', ' hours');
    h.push('<div class="ph-card"><h4>«' + S.boatName + '» · ' + V.name[S.lang] + '</h4>' + kv(L('Toppfart', 'Top speed'), fmt(BOAT.vmax, 1) + ' kn') + kv(L('Med lasten og skroget nå', 'With the load and hull now'), fmt(speedCap(0.3), 1) + ' kn') +
      (on ? kv(L('På nå', 'On now'), '<b>' + on[S.lang] + ' +' + Math.round((on.x - 1) * 100) + ' %</b>') + kv(L('Går ut om', 'Ends in'), hrs(trimLeft(b))) : '') + '</div>');
    if (!canBoost(V)) h.push('<div class="ph-card"><p class="ph-note">' + L('Trim krever dieselmotor. Påhengsmotoren på denne båten har verken dieselpumpe, ladeluftkjøling eller turbo. Den største påhengsmotoren får du under Oppgrader på verftet.', 'Tuning needs a diesel engine. This boat\'s outboard has no injection pump, charge air cooling or turbo. The biggest outboard is under Upgrade at the yard.') + '</p></div>');
    else for (const [k, B] of Object.entries(BOOSTS)){ const v1 = BOAT.vmax / (on ? on.x : 1) * B.x;
      h.push('<div class="ph-card haillc"><h4>' + B[S.lang] + ' · +' + Math.round((B.x - 1) * 100) + ' % ' + L('fart', 'speed') + (k === 'turbo' ? kbBest() : '') + '</h4><p>' + TRIM_SELL[k][S.lang === 'en' ? 1 : 0] + '</p>' +
        kv(L('Toppfart med den', 'Top speed with it'), '<b>' + fmt(v1, 1) + ' kn</b>') + kv(L('Varer', 'Lasts'), hrs(B.h)) + (shopMode() !== 'live' ? kv(L('Pris', 'Price'), realKr(B.nok)) : '') +   // live, the buy button shows the price (tilbakemelding #17)
        (on ? '<p class="ph-note">' + L('Erstatter ' + on.no.toLowerCase() + ', som er på nå.', 'Replaces the ' + on.en.toLowerCase() + ' on now.') + '</p>' : '') +
        '<button class="ph-btn p" data-pa="trimbuy" data-k="' + k + '">' + shopLabel(B.nok) + '</button>' + shopFine() + '</div>'); }
    h.push('<p class="ph-note">' + L('Trim gjelder båten du er om bord i. Tida er spilltid: 24 timer i spillet er ' + fmt(24 / GAME_RATE, 0) + ' timer i virkeligheten. Mer fart bruker mer diesel.',
      'Tuning goes with the boat you are aboard. The time is game time: 24 hours in the game is ' + fmt(24 / GAME_RATE, 0) + ' hours in real life. More speed burns more diesel.') + '</p></div>');
    return h.join('');
  }
  // --- Skippertak (core/15-energy.js SKIP): an energy drink for real money only, for you and the crews of the whole fleet
  const SKIP_SELL = {light:['En boks og et døgn uten hvile. Du og mannskapet holder dere uthvilt hele døgnet, også på driftsplanen.', 'One can and a day without rest. You and the crew stay rested all day, on the operations plan too.'],
    std:['To døgn i strekk. Rekk flere turer mens fisken står, uten å gå inn for å hvile.', 'Two days on end. Fit in more trips while the fish are there, without going in to rest.'],
    max:['Fire døgn uten hvile for hele flåten. Driftsplanene går døgnet rundt.', 'Four days without rest for the whole fleet. The operations plans run round the clock.']};
  function skipApp(){
    const h = ['<div class="ph-c">'], hrs = x => x >= 48 ? fmt(x / 24, 1) + L(' døgn', ' days') : fmt(x, 0) + L(' timer', ' hours'), nv = (S.fleet || []).length || 1;
    if (skipOn()){ const X = SKIP[S.skip.k] || SKIP.std, tot = (S.skip.until - S.skip.t0) / 60;
      h.push('<div class="ph-card haillc"><h4>' + X[S.lang] + ' ' + L('virker', 'is working') + '</h4>' + kv(L('Går ut om', 'Ends in'), hrs(skipLeft())) + '<div class="qbar"><i style="width:' + (skipLeft() / Math.max(1, tot) * 100).toFixed(0) + '%;background:#2f8f5b"></i></div>' +
        kv(L('Gjelder', 'For'), nv > 1 ? L('deg og mannskapet på ' + nv + ' båter', 'you and the crews of ' + nv + ' boats') : L('deg og mannskapet', 'you and the crew')) + '</div>'); }
    else h.push('<div class="ph-card"><h4>' + L('Skippertak', 'Skippertak') + '</h4>' + kv(L('Din energi', 'Your energy'), energyOff() ? L('av', 'off') : asleep() ? L('sover', 'asleep') : fmt(S.energy == null ? 100 : S.energy) + ' %') +
      '<p class="ph-note">' + L('Energidrikken som holder deg og mannskapet på hele flåten uthvilt. Ingen hvile på rorbua, og driftsplanen går uten å vente på at mannskapet blir uthvilt.', 'The energy drink that keeps you and the crews of the whole fleet rested. No rest at the rorbu, and the operations plan goes on without waiting for the crew to rest.') + '</p></div>');
    for (const [k, X] of Object.entries(SKIP)){
      h.push('<div class="ph-card haillc"><h4>' + X[S.lang] + (X.best ? kbBest() : '') + '</h4><p>' + SKIP_SELL[k][S.lang === 'en' ? 1 : 0] + '</p>' + kv(L('Varer', 'Lasts'), hrs(X.h)) + (shopMode() !== 'live' ? kv(L('Pris', 'Price'), realKr(X.nok)) : '') +
        (skipOn() ? '<p class="ph-note">' + L('Legges til tida du har igjen.', 'Added to the time you have left.') + '</p>' : '') +
        '<button class="ph-btn p" data-pa="skipbuy" data-k="' + k + '">' + shopLabel(X.nok) + '</button>' + shopFine() + '</div>'); }
    h.push('<p class="ph-note">' + L('Skippertak gjelder deg og mannskapet på alle båtene i flåten. Tida er spilltid, og den går også når spillet er lukket: 24 timer i spillet er ' + fmt(24 / GAME_RATE, 0) + ' timer i virkeligheten. Når den går ut, er alle uthvilt. Hvile i naustet og på rorbuene er gratis som før.',
      'Skippertak goes for you and the crews of every boat in the fleet. The time is game time, and it runs while the game is closed too: 24 hours in the game is ' + fmt(24 / GAME_RATE, 0) + ' hours in real life. When it runs out, everyone is rested. Rest in the boathouse and at the rorbuer is free as before.') + '</p></div>');
    return h.join('');
  }
