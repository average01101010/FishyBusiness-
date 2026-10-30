  // --- workshop: service, fitting and getting the gear ready, one job after the other while the boat is in port
  function haill(){
    // the luck aboard (its stage and the hours left), the store with «Aktiver», and the shop (the user's list 04.10.2026)
    const h = ['<div class="ph-c">'], a = S.haill, st = haillStage(), inv = S.haillInv || {haill:0, luksus:0}, hr = v => v >= 48 ? fmt(v / 24, 1) + L(' døgn', ' days') : fmt(v, 0) + L(' t', ' h');
    if (a && st){ const X = HAILL[a.type], tot = X.steps[X.steps.length - 1][0], left = haillLeft(), nx = X.steps.find(q => haillAge() < q[0]);
      h.push('<div class="ph-card haillc"><h4>' + st[S.lang] + ' ' + L('om bord', 'aboard') + '</h4>' + kv(L('Fiskelykke nå', 'Luck now'), '+' + Math.round(st.v * 100) + ' %') + '<div class="qbar"><i style="width:' + (left / tot * 100).toFixed(0) + '%;background:#c9a227"></i></div>' +
        (X.steps.length > 1 ? kv(L('Neste trinn om', 'Next stage in'), hr(nx[0] - haillAge())) : '') + kv(L('Borte om', 'Gone in'), hr(left)) + '</div>'); }
    else h.push('<div class="ph-card"><p class="ph-note">' + L('Ingen haill om bord. Haill er ferskvare: sterkest de første timene, så svakere trinn for trinn til den er borte. Den virker på alt du fisker.', 'No luck aboard. Luck is fresh goods: strongest the first hours, then weaker stage by stage until it is gone. It works on everything you fish.') + '</p></div>');
    // the store: switched on only when you say so
    if (inv.haill > 0 || inv.luksus > 0 || inv.takk > 0){ h.push('<div class="ph-card haillc"><h4>' + L('Beholdning', 'In store') + '</h4>');
      for (const k of ['takk', 'luksus', 'haill']) if (inv[k] > 0){ const pend = haillPend === k && a && st;
        h.push(kv(HAILL[k][S.lang], '× ' + inv[k]) + (pend ? '<div class="ph-row2"><button class="ph-btn p" data-pa="haillon" data-k="' + k + '">' + L('Bytt ut den om bord', 'Replace the one aboard') + '</button><button class="ph-btn alt" data-pa="haill0">' + L('Avbryt', 'Cancel') + '</button></div>' : '<button class="ph-btn p" data-pa="haillon" data-k="' + k + '">' + L('Aktiver ', 'Switch on ') + HAILL[k][S.lang].toLowerCase() + '</button>')); }
      h.push('<p class="ph-note">' + L('Haill blir aldri aktivert av seg selv. En ny haill erstatter den som er om bord.', 'Luck is never switched on by itself. A new one replaces the one aboard.') + '</p></div>'); }
    const gift = tutFree('haill');
    if (gift) h.push('<div class="ph-card haillc"><h4>' + L('Første gang er luksushaill gratis', 'The first luxury luck is free') + '</h4><p class="ph-note">' + L('Ellers koster haill 29 kr og luksushaill 59 kr. Du kan også være heldig på puben.', 'Otherwise luck is NOK 29 and luxury luck NOK 59. You can also get lucky at the pub.') + '</p></div>');
    for (const k of ['haill', 'luksus']){ const X = HAILL[k], free = gift && k === 'luksus';
      h.push('<div class="ph-card haillc"><h4>' + X[S.lang] + (k === 'luksus' && !free ? kbBest() : '') + '</h4><p>' + X.d[S.lang] + '</p>' + (free || shopMode() !== 'live' ? '<div class="ph-kv"><span>' + L('Pris', 'Price') + '</span><span><b>' + (free ? L('gratis nå', 'free now') : realKr(X.nok)) + '</b></span></div>' : '') + '<button class="ph-btn p" data-pa="haillbuy" data-k="' + k + '"' + (gift && !free ? ' disabled' : '') + '>' + (free ? L('Hent gratis luksushaill', 'Fetch a free luxury luck') : shopLabel(X.nok)) + '</button>' + (free ? '' : shopFine()) + '</div>'); }
    // the thank-you for feedback (Jonas 06.10.2026): said where the luck is, with the way to the feedback app
    h.push('<div class="ph-card haillc fb-gift"><h4>' + L('Gratis haill for gode tips', 'Free luck for good tips') + '</h4><p>' + L('Har du funnet en feil eller har en idé? Skriv det i Tilbakemelding-appen. Hjelper tipset oss å gjøre spillet bedre, får du 12 timer med fullt haill (+100 %) som takk.', 'Found a bug or have an idea? Write it in the Feedback app. If your tip helps us make the game better, you get 12 hours of full luck (+100 %) as a thank-you.') + '</p><button class="ph-btn" data-pa="fbOpen">' + L('Gi tilbakemelding', 'Give feedback') + '</button></div>');
    h.push('<p class="ph-note">' + L('Du kan også være heldig på puben. Tida er spilltid: 24 timer i spillet er ' + fmt(24 / GAME_RATE, 0) + ' timer i virkeligheten.', 'You can also get lucky at the pub. The time is game time: 24 hours in the game is ' + fmt(24 / GAME_RATE, 0) + ' hours in real life.') + '</p></div>');
    return h.join('');
  }
  // --- the tackle shop on the quay: a purchase takes two taps, the second one confirms the price
  // the first-trip guide hands out the hand jig and the first fill of ice (07b-first-trip.js)
  // a purchase takes two taps: the first turns the button itself into «Bekreft · price» with a small ✕ beside it, for a few seconds
  // (M1, ui/05a-itemcard.js IC_CONFIRM_MS); the first-trip guide hands out the hand jig and the first fill of ice (07b-first-trip.js)
  const shopBtn = (k, kg, c, label, fill) => { const pt = portById(S.boat.port), here = atKind(k === 'ice' ? 'mottak' : 'butikk') && pt; if (tutFree(k)) c = 0; const on = shopPend && shopPend.k === k && shopPend.kg === kg && Date.now() - shopPend.t <= IC_CONFIRM_MS, dis = !here || c > spendable(), pr = c ? kr(c) : k === 'ice' ? L('på huset', 'on the house') : L('gratis', 'free'), fa = fill ? ' data-fill="1"' : '';
      return on ? '<span class="ic-cf"><button class="ph-btn p" data-pa="shop" data-k="' + k + '" data-kg="' + kg + '"' + fa + '>' + L('Bekreft · ', 'Confirm · ') + pr + '</button><button class="ph-btn alt ic-x" data-pa="shop0" aria-label="' + L('Avbryt', 'Cancel') + '">✕</button></span>'
        : '<button class="ph-btn p" data-pa="shop" data-k="' + k + '" data-kg="' + kg + '"' + fa + (dis ? ' disabled' : '') + '>' + label + ' · ' + pr + '</button>'; };
  function fiske(){
    const b = S.boat, pt = portById(b.port), here = atKind('butikk') && pt;
    const h = ['<div class="ph-c">' + (here ? shopTop('fiske') : '<div class="ph-card"><h4>' + L('Du er ikke ved en utstyrsbutikk', 'You are not at a tackle shop') + '</h4><p class="ph-note">' + L('Du kan se hva som finnes, men utstyr kjøper du i utstyrsbutikken, eller bestiller i Nettet-appen og henter der.', 'You can look, but gear is bought at the tackle shop, or ordered in the Net app and fetched there.') + '</p></div>' + nearHint('butikk'))];
    // what the boat lacks first; what is aboard in one line at the bottom (M2)
    const aboard = [];
    if (!b.gear) h.push(itemCard({k:'jig', name:L('Håndjuksa', 'Hand jig'), price:PRICE.gear, btns:shopBtn('jig', 0, PRICE.gear, L('Kjøp', 'Buy'))})); else aboard.push(L('Håndjuksa', 'Hand jig'));
    if (!tutOn()){ if (!b.kgear) h.push(itemCard({k:'kgear', name:L('Kveiteutstyr', 'Halibut gear'), price:PRICE.kgear, btns:shopBtn('kgear', 0, PRICE.kgear, L('Kjøp', 'Buy'))})); else aboard.push(L('Kveiteutstyr', 'Halibut gear')); }
    if (!tutOn()) h.push(redskap('kjop'));
    if (aboard.length) h.push('<div class="ph-card ic-aboard"><h4>' + L('Om bord', 'Aboard') + '</h4><p>' + aboard.join(' · ') + '</p></div>');
    h.push('</div>');
    return h.join('');
  }
  // the tackle shop's service (Jonas 08.10.2026): the shop mends and changes in half the time for a fee, and buys the gear back
  function service(){
    const b = S.boat, pt = portById(b.port), here = atKind('butikk') && pt, pg = careInit(S.pgear), h = ['<div class="ph-c">'];
    if (!here) h.push(nearHint('butikk'));
    h.push('<div class="ph-card"><h4>' + L('Service i utstyrsbutikken', 'Service at the tackle shop') + '</h4><p class="ph-note">' + L('Butikken reparerer og bytter på halve tiden mot et gebyr, og kjøper redskap tilbake.', 'The shop mends and changes in half the time for a fee, and buys gear back.') + '</p><button type="button" class="ic-more" data-pa="open" data-a="handbok" data-hbid="lex_service">' + L('Mer om service ›', 'More on service ›') + '</button></div>');
    const sell = (w, k, n, lbl) => cbtn('caresell', 'data-w="' + w + '" data-k="' + k + '" data-n="' + n + '"', L('Selg ', 'Sell ') + lbl + ' · ' + kr(sellValue(w, k, n)), here);
    for (const lk of ['hyse', 'bank']){ const L0 = pg.lines[lk]; if (!L0.n) continue; const un = L0.n - L0.baited, qh = careQuote('hooks', lk, true), ql = careQuote('line', lk, true);
      h.push('<div class="ph-card"><h4>' + LINE_KINDS[lk][S.lang] + '</h4>' + kv(L('Lina', 'The line'), pctOf(L0.cond) + ' · ' + L('tak ', 'ceiling ') + pctOf(L0.max)) + cbar(L0.cond) + kv(L('Kroker som må byttes', 'Hooks to change'), hooksNeed(lk)) + '<div class="ph-btncol">' +
        (qh ? cbtn('carehk', 'data-lk="' + lk + '" data-m="shop"', L('Bytt ', 'Change ') + qh.n + L(' kroker', ' hooks') + qTxt(qh), here && qh.fee <= spendable()) : '') + (ql ? cbtn('carelr', 'data-lk="' + lk + '" data-m="shop"', L('Reparer lina', 'Mend the line') + qTxt(ql), here && ql.fee <= spendable()) : '') +
        (un > 0 ? sell('line', lk, 1, L('1 stamp', '1 tub')) : '') + (un > 1 ? sell('line', lk, un, un + ' ' + L('stamper', 'tubs')) : '') + '</div>' + (un < L0.n ? '<p class="ph-note">' + L('Egnede stamper selges ikke.', 'Baited tubs are not bought back.') + '</p>' : '') + '</div>'); }
    for (const l of pg.nets){ const q = careQuote('net', l.id, true);
      h.push('<div class="ph-card"><h4>' + l.n + ' ' + L('garn', 'nets') + ' ' + netNo(l) + '</h4>' + kv(L('Stand', 'Condition'), pctOf(l.cond) + ' · ' + L('tak ', 'ceiling ') + pctOf(nMax(l))) + cbar(l.cond) + '<div class="ph-btncol">' +
        (q ? cbtn('grmend', 'data-id="' + l.id + '" data-m="shop"', L('Bøt garna', 'Mend the nets') + qTxt(q), here && q.fee <= spendable()) : '') + sell('net', l.id, 1, L('garna', 'the nets')) + '</div></div>'); }
    if (pg.pots.big){ const q = careQuote('pot', 0, true);
      h.push('<div class="ph-card"><h4>' + pg.pots.big + ' ' + POTS.big[S.lang].toLowerCase() + '</h4>' + kv(L('Stand', 'Condition'), pctOf(pg.potc.cond) + ' · ' + L('tak ', 'ceiling ') + pctOf(pg.potc.max)) + cbar(pg.potc.cond) + '<div class="ph-btncol">' +
        (q ? cbtn('carepot', 'data-m="shop"', L('Reparer teinene', 'Mend the pots') + qTxt(q), here && q.fee <= spendable()) : '') + sell('pot', 0, 1, L('1 teine', '1 pot')) + (pg.pots.big > 1 ? sell('pot', 0, pg.pots.big, pg.pots.big + ' ' + L('teiner', 'pots')) : '') + '</div></div>'); }
    const rest = [];
    for (const k of ['mark', 'kveite']) if (pg.jig[k].n > 0) rest.push(sell('jig', k, 1, L('reservesett: ', 'spare set: ') + CARE.jig[k][S.lang].toLowerCase()));
    if (pg.kits.n > 0) rest.push(sell('kit', 0, 1, L('blåsesett', 'buoy set'))); if (pg.kits.heavy > 0) rest.push(sell('heavy', 0, 1, L('tung dregg', 'heavy anchor'))); if (pg.hooks >= 100) rest.push(sell('hooks', 0, 100, L('100 kroker', '100 hooks')));
    if (rest.length) h.push('<div class="ph-card"><h4>' + L('Annet utstyr', 'Other gear') + '</h4><div class="ph-btncol">' + rest.join('') + '</div></div>');
    return h.join('') + '</div>';
  }
  function iceCard(){
    const b = S.boat, pt = portById(b.port), here = atKind('mottak') && pt, room = shopIceRoom(), ikr = shopIceKr(), buy = shopBtn;
    const btns = room < 1 ? '' : (room > 60 && !tutFree('ice') ? buy('ice', 50, Math.round(50 * ikr), L('50 kg', '50 kg')) : '') + buy('ice', room, Math.round(room * ikr), L('Fyll opp, ', 'Fill up, ') + room + ' kg', true);
    const h = [itemCard({k:'ice', name:L('Is', 'Ice'), price:fmt(ikr, 2) + ' kr/kg', cond:b.ice / BOAT.iceCap, condL:L('Om bord ', 'Aboard ') + fmt(b.ice, 0) + ' / ' + BOAT.iceCap + ' kg',
      have:room < 1 ? L('Iskassa er full', 'The ice box is full') : '', note:here ? L('Isen kommer fra isrenna på mottakskaia.', 'The ice comes down the chute at the plant\'s quay.') : L('Is selges på fiskemottaket.', 'Ice is sold at the fish plant.'), btns})];
    if (!here) h.push(nearHint('mottak'));
    return h.join('');
  }
  function verksted(){
    const b = S.boat, V = VESSELS[b.type], jobs = S.jobs || [], h = [(atKind('verft') ? '' : nearHint('verft')) + '<div class="ph-c"><p class="ph-note">' + L('Verkstedet tar en halvtime per jobb, og jobbene går samtidig mens båten ligger i havn. Perfekt når det blåser. En planlagt avgang venter til alt er ferdig.', 'The yard takes half an hour a job, and the jobs run side by side while the boat is in port. Perfect when it blows. A planned departure waits until everything is done.') + '</p>'];
    // the hull's damage and its repair, and the hull insurance (Fysikk 3, core/16c-hull.js): what the blows and the groundings did, what
    // mending it costs and who pays, and the insurance's premium and deductible
    { const d = b.dmg || {}, B = hullBill(b), queued = jobs.some(j => j.kind === 'repair'), Q = hullLeak(b), Pq = hullPump(b), bar = (v, c) => '<div class="qbar"><i style="width:' + Math.round(Math.min(1, v || 0) * 100) + '%;background:' + c + '"></i></div>';
      h.push('<div class="ph-card" id="hullCard"><h4>' + L('Skrog og skade', 'Hull and damage') + '</h4>' + (!(d.s > 0.004 || hullBad(b) || d.w > 0)
        ? '<p class="ph-note">' + L('Skroget er helt. Under 1 knop tar fenderne et støt. Fra 1 knop blir det skrammer i malingen, fra 3 knop skade på skroget, og et hardt støt eller en grunnstøting på fjell kan slå hull.', 'The hull is whole. Under 1 knot the fenders take a blow. From 1 knot the paint gets scratches, from 3 knots the hull is damaged, and a hard blow or running aground on rock can hole her.') + '</p>'
        : kv(L('Skrammer', 'Scratches'), Math.round((d.s || 0) * 100) + ' %') + bar(d.s, '#c9a227') + kv(L('Skade på skroget', 'Hull damage'), Math.round((d.h || 0) * 100) + ' %') + bar(d.h, '#c0392b') +
          (d.A > 0 ? kv(L('Lekkasje', 'Leak'), fmt(Q, 0) + L(' l/min, pumpa tar ', ' l/min, the pump takes ') + fmt(Pq, 0)) : '') + (d.w > 0 ? kv(L('Vann i båten', 'Water aboard'), fmt(d.w, 0) + ' l') : '') + (d.flood ? kv(L('Motoren', 'The engine'), L('har stått under vann', 'has been flooded')) : '') +
          (B.c.scr ? kv(L('Pusse og male skrammene', 'Polish and paint the scratches'), kr(B.c.scr)) : '') + (B.c.str ? kv(L('Reparere skroget', 'Mend the hull'), kr(B.c.str)) : '') + (B.c.eng ? kv(L('Overhale motoren', 'Overhaul the engine'), kr(B.c.eng)) : '') +
          (B.free ? kv(L('Første reparasjon', 'The first repair'), L('gratis', 'free')) : B.ins ? kv(L('Kaskoen betaler', 'The insurance pays'), kr(B.ins)) + kv(L('Du betaler egenandelen', 'You pay the deductible'), kr(B.you)) : '') +
          (queued ? '<p><b>' + L('Reparasjonen pågår', 'Being repaired') + '</b></p>' : '') + (B.tot > 0 ? '<button class="ph-btn p" data-pa="hullfix"' + (!atKind('verft') || spendable() < B.you ? ' disabled' : '') + '>' + L('Reparer · ', 'Repair · ') + kr(B.you) + ' · ' + realDur(YARD_H * 60) + '</button>' : '')) + '</div>');
      const k = b.kasko, pr = kaskoPrem(b), n = kaskoClaims(b);
      h.push('<div class="ph-card" id="kaskoCard"><h4>' + L('Kasko', 'Hull insurance') + (k ? ' · ' + L('tegnet', 'in force') : '') + '</h4>' + kv(L('Premie', 'Premium'), kr(pr) + L(' i måneden', ' a month')) + kv(L('Egenandel', 'Deductible'), kr(kaskoSelf(b))) + (n ? kv(L('Skader siste år', 'Claims the last year'), n + ' (+' + n * 25 + ' %)') : '') +
        '<p class="ph-note">' + L('Kaskoen betaler reparasjonen etter støt og grunnstøting, det som går over egenandelen. Premien trekkes hver måned og øker med en fjerdedel for hver skade det siste året.', 'The insurance pays the repair after blows and groundings, what goes over the deductible. The premium is paid every month and rises by a quarter for each claim the last year.') + '</p>' +
        (k ? kv(L('Neste premie', 'Next premium'), whenTxt(k.next)) + '<button class="ph-btn alt" data-pa="kaskox">' + L('Si opp kaskoen', 'Cancel the insurance') + '</button>'
           : '<button class="ph-btn p" data-pa="kasko"' + (!atKind('verft') || spendable() < pr ? ' disabled' : '') + '>' + L('Tegn kasko · ', 'Take out insurance · ') + kr(pr) + L(' i måneden', ' a month') + '</button>') + '</div>'); }
    // the hull: fouling slows her and costs fuel (core foulHour); cleaned on the slip
    { const f = b.foul || 0, c = 1500 + Math.round(BOAT.len * 400 / 100) * 100, queued = jobs.some(j => j.kind === 'hull');
      h.push('<div class="ph-card"><h4>' + L('Skrog og begroing', 'Hull and fouling') + '</h4>' + kv(L('Begroing', 'Fouling'), Math.round(f * 100) + ' %') + '<div class="qbar"><i style="width:' + (f * 100).toFixed(0) + '%;background:' + (f > 0.5 ? '#c0392b' : '#1e8c6e') + '"></i></div>' +
        kv(L('Fart', 'Speed'), '−' + fmt(15 * f, 1) + ' %') + kv(L('Drivstoff', 'Fuel'), '+' + fmt(25 * f, 1) + ' %') + '<p class="ph-note">' + L('Groe og rur vokser på skroget, raskest om sommeren. ', 'Weed and barnacles grow on the hull, fastest in summer. ') + (S.equip.antigro ? L('Antigro-belegget holder det nede.', 'The antifouling coat keeps it down.') : L('Antigro-belegg under Oppgrader gjør at det gror tre ganger så sakte.', 'An antifouling coat under Upgrade makes it grow three times as slowly.')) + '</p>' +
        (queued ? '<p><b>' + L('På slippen', 'On the slip') + '</b></p>' : '<button class="ph-btn p" data-pa="hullclean"' + (!atKind('verft') || spendable() < c || f < 0.02 ? ' disabled' : '') + '>' + L('Skrogrens på slipp · ', 'Hull cleaning on the slip · ') + kr(c) + ' · ' + realDur(YARD_H * 60) + '</button>') + '</div>'); }
    h.push('<div class="ph-card"><h4>' + L('Arbeidskø', 'Work queue') + ' (' + jobs.length + '/6)</h4>');
    // Jonas 05.10.2026: shortening the wait is sold for real money, 19 kr for all the boat's running jobs at once
    if (jobs.some(j => YARD_KINDS.includes(j.kind) && j.until != null && j.until > S.t + 1)) h.push('<div class="ph-card haillc"><h4>' + L('Ferdig nå', 'Done now') + ' · ' + realKr(YARD_NOW_NOK) + '</h4><p>' + L('Hopp over ventetida: verftet gjør alle jobbene ferdig med én gang, så du kommer deg ut på sjøen nå mens fisken biter.', 'Skip the wait: the yard finishes all the jobs at once, so you get out on the water now while the fish are biting.') + '</p>' +
      '<button class="ph-btn p" data-pa="yardnow">' + shopLabel(YARD_NOW_NOK) + '</button>' + shopFine() + '</div>');
    if (!jobs.length) h.push('<p class="ph-note">' + L('Ingen jobber.', 'No jobs.') + '</p>');
    jobs.forEach((j, i) => {
      const run = j.until != null, pct = run ? clamp(1 - (j.until - S.t) / (j.h * 60), 0, 1) : 0;
      if (run && j.until > S.t + 30){ const left = (j.until - S.t) / 60, c = Math.round(left / 2 * 950 / 10) * 10; h.push('<div class="ph-row2"><button class="ph-btn" data-pa="jobOT" data-i="' + i + '"' + (j.ot ? ' disabled' : '') + '>' + (j.ot ? L('Mekaniker på overtid', 'Mechanic on overtime') : L('Overtid, halv tid · ', 'Overtime, half the time · ') + kr(c)) + '</button>' + (adminOk() ? '<button class="ph-btn alt" data-pa="jobRush" data-i="' + i + '">' + L('Ferdig nå (admin)', 'Done now (admin)') + '</button>' : '') + '</div>'); }
      h.push('<div class="ph-kv"><span>' + (S.lang === 'no' ? j.no : j.en) + '</span><span>' + (run ? L('ferdig ', 'done ') + whenTxt(j.until) : !inPort() ? L('venter på havn', 'waits for port') : realDur(j.h * 60)) + (!run ? ' <button class="ph-btn alt" style="margin:0 0 0 6px;padding:3px 8px" data-pa="jobx" data-i="' + i + '">✕</button>' : '') + '</span></div>' + (run ? '<div class="ph-bar"><i style="width:' + Math.round(pct * 100) + '%"></i></div>' : ''));
    });
    h.push('</div>');
    const svcLeft = V.svcH - ((b.engH || 0) - (b.svcAt || 0)), queuedSvc = jobs.some(j => j.kind === 'svc');
    h.push('<div class="ph-card"><h4>' + L('Motorservice', 'Engine service') + '</h4>' + kv(L('Neste service', 'Next service'), svcLeft > 0 ? L('om ', 'in ') + fmt(svcLeft, 0) + ' t' : '<span class="r2">' + L('forfalt', 'overdue') + '</span>') +
      '<button class="ph-btn" data-pa="svc" data-m="yard"' + (queuedSvc ? ' disabled' : '') + '>' + L('Verkstedet', 'The yard') + ' · ' + kr(svcCostOf(b)) + ' · ' + realDur(YARD_H * 60) + '</button>' +
      '<button class="ph-btn alt" data-pa="svc" data-m="self"' + (queuedSvc ? ' disabled' : '') + '>' + L('Gjør det selv', 'Do it yourself') + ' · ' + kr(Math.round(svcCostOf(b) * 0.35)) + ' · ' + realDur(2 * YARD_H * 60) + '</button></div>');
    h.push('</div>');
    return h.join('');
  }
