  // the old tabs live on as phone apps
  function havn(){ return '<div class="ph-panel">' + panelPort() + '</div>'; }
  function last(){ return '<div class="ph-panel">' + panelHold() + '</div>'; }
  // --- the pages of the dock's drawer (ui/10c-dock.js): the market, the village and the yard in port, the inventory everywhere
  function lever(){ return '<div class="ph-panel">' + landPage() + (S.boat.status !== 'port' ? nearHint('mottak') : '') + '</div>'; }
  function isApp(){ return '<div class="ph-c">' + iceCard() + '</div>'; }
  // bait for line and pots, and the baiting of the tubs
  function agn(){
    const b = S.boat, pg = S.pgear, p = portById(b.port), here = atKind('mottak'), h = ['<div class="ph-c">'];
    if (!pg) return '';
    if (!here) h.push(nearHint('mottak'));
    // the kinds of bait (core BAITS, eight from 05.11.2026 with saury): what is aboard, what each takes best, and buying more of it. The kind is chosen when the tubs are baited
    // and when the pots are set (Jonas 20.10.2026), so there is no «chosen kind» here
    const B = baitOf(pg), good = k => { const best = baitGood(k).map(spLc); return best.length ? L('best på ', 'best for ') + best.join(', ') : L('helt ok på alt', 'fair on everything'); };
    // an autoliner buys by the tonne: some 85 kg a lenke, 680 kg a day with the whole line (H2a)
    const am = autoL(pg) || snoVessel() ? [1000, 5000] : [20, 100];   // (and the snow crab vessel: half a kilo a pot, some 860 kg a day, H3b)
    // the reason first, and no grey buttons under it (spilltest 3, U7): the kinds stay, with what each is best for
    const gate = buyGate('bait');
    const rows = Object.entries(BAITS).map(([k, X]) => { const c20 = am[0] * X.kr, c100 = am[1] * X.kr;
      return '<div class="ph-kv"><span>' + baitDot(k) + '<b>' + X[S.lang] + '</b> · ' + good(k) + '</span><span>' + fmt(B[k] || 0, 0) + ' kg</span></div>' + (gate ? '' : '<div class="ph-row2">' +
        '<button class="ph-btn"' + (here && c20 <= spendable() && !buyGate('bait') ? '' : ' disabled') + ' data-pa="grbuy" data-w="bait" data-s="' + k + '" data-n="' + am[0] + '">' + fmt(am[0], 0) + ' kg · ' + kr(c20) + '</button><button class="ph-btn"' + (here && c100 <= spendable() && !buyGate('bait') ? '' : ' disabled') + ' data-pa="grbuy" data-w="bait" data-s="' + k + '" data-n="' + am[1] + '">' + fmt(am[1], 0) + ' kg · ' + kr(c100) + '</button></div>'); }).join('');
    const kr0 = Math.min(...Object.values(BAITS).map(X => X.kr)), kr1 = Math.max(...Object.values(BAITS).map(X => X.kr));
    h.push(itemCard({k:'bait', id:'baitStore', name:L('Agn', 'Bait'), price:fmt(kr0, 0) + '–' + fmt(kr1, 0) + ' kr/kg', body:(gate ? '<p class="ph-note"><b>' + gate[0] + '</b></p>' : '') + '<div class="ic-rows">' + rows + '</div>'}));
    // own catch as bait, before it is landed
    { const own = BAIT_OWN.map(sp => [sp, S.hold.filter(x => x.sp === sp).reduce((a, x) => a + x.kg, 0)]).filter(x => x[1] >= 1);
      if (here && !b.land && own.length) h.push('<div class="ph-card"><h4>' + L('Egen fangst som agn', 'Own catch as bait') + '</h4><p class="ph-note">' + L('Sei fra lasten kan bli agn i stedet for å selges, men da før du leverer. Seien føres som eget bruk og teller på kvoten.', 'Saithe from the hold can be bait instead of being sold, but before you land. The saithe is entered as own use and counts on the quota.') + '</p>' +
        own.map(([sp, kg]) => { const n = Math.min(Math.floor(kg), 100); return '<button class="ph-btn" data-pa="grown" data-k="' + sp + '" data-n="' + n + '">' + L('Bruk ' + n + ' kg ', 'Use ' + n + ' kg of ') + SPECIES[sp][S.lang].toLowerCase() + L(' som agn', ' as bait') + '</button>'; }).join('') + '</div>'); }
    let any = !!autoL(pg);
    if (any) h.push(autoCard());
    for (const lk of ['hyse', 'bank']){ const L0 = pg.lines[lk]; if (!L0.n && !tubState(lk).work.length) continue; any = true; h.push(lineCard(lk, {work:b.status === 'port' || seaWork(), shed:here && egnPort(p)})); }
    if (!any) h.push('<p class="ph-note">' + L('Ingen line om bord. Line kjøper du i utstyrsbutikken (Butikk › Fiskeutstyr).', 'No line aboard. Line is sold at the tackle shop (Shop › Tackle).') + '</p>');
    const shore = pg.shore.filter(j => j.ready && j.kind === 'egn'); if (shore.length) h.push('<div class="ph-card"><h4>' + L('I egnebua', 'At the baiting shed') + '</h4>' + shore.map(j => kv(j.n + ' ' + L('stamper', 'tubs'), portById(j.port).name + ', ' + L('klar ', 'ready ') + (S.t >= j.ready ? L('nå', 'now') : hm(j.ready / 60)))).join('') + '</div>');
    return h.join('') + '</div>';
  }
  // D4 (Jonas 13.11.2026, punkt 4 «Enig», omdømmet «A: Under Bestillinger»): Oppdrag is one page with the tabs Turer, Bestillinger and
  // Kappløp, whichever door it is opened by: the dock's Oppdrag (it opens on Bestillinger, where the orders are taken) and the phone's
  // app (on Turer). Bestillinger has your orders, the new ones, the reputation and, last, the earlier ones; before, the dock's page had
  // the new orders and the reputation and the phone's tab the active and the earlier, two pages for one thing
  function ordPage(key, first){
    // the race's tab (ui/05l-kapplop.js, KL2), opened from its card at a checkpoint or in the Sesong app (LOP_TAB)
    if (typeof LOP_TAB !== 'undefined' && LOP_TAB){ LOP_TAB = false; sub[key] = 'lop'; }
    if (!sub[key]) sub[key] = first;
    const tab = sub[key], tabs = subs(key, [['turer', 'Turer', 'Trips'], ['best', 'Bestillinger', 'Orders'], ['lop', 'Kappløp', 'Race']]);
    if (tab === 'turer') return '<div class="ph-c">' + tabs + turPage() + '</div>';
    if (tab === 'lop') return '<div class="ph-c">' + tabs + lopPage() + '</div>';
    return '<div class="ph-c" style="padding-bottom:0">' + tabs + '</div>' + salg('best') + ordEarlier();
  }
  function oppdrag(){ return ordPage('oppdrag', 'best'); }
  function ordl(){ return ordPage('ordl', 'turer'); }
  function ordEarlier(){
    const O = ordState(), cn = id => (CUSTOMERS.find(c => c.id === id) || {no:id}).no, h = ['<div class="ph-c" style="padding-top:0">'];
    const old = (O.done || []).slice(0, 12);
    if (old.length) h.push('<h4 style="margin:10px 2px 4px">' + L('Tidligere', 'Earlier') + '</h4><div class="ph-card">' + old.map(o => kv(cn(o.cust) + ' · ' + fmt(o.kg, 0) + ' kg ' + SPECIES[o.sp].no.toLowerCase(), (o.ok === false ? '<span class="r2">' + L('Ikke levert', 'Not delivered') + '</span>' : '<span class="r0">' + L('Levert', 'Delivered') + '</span>') + ' · ' + dayStr(o.t / 60).replace(/^\S+ /, ''))).join('') + '</div>');
    return h.join('') + '</div>';
  }
