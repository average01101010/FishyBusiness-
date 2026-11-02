  // the old tabs live on as phone apps
  function havn(){ return '<div class="ph-panel">' + panelPort() + '</div>'; }
  function last(){ return '<div class="ph-panel">' + panelHold() + '</div>'; }
  // --- the pages of the dock's drawer (ui/10c-dock.js): the market, the village and the yard in port, the inventory everywhere
  function lever(){ return '<div class="ph-panel">' + landPage() + '</div>'; }
  function isApp(){ return '<div class="ph-c">' + iceCard() + '</div>'; }
  // bait for line and pots, and the baiting of the tubs
  function agn(){
    const b = S.boat, pg = S.pgear, p = portById(b.port), here = atKind('mottak'), h = ['<div class="ph-c">'];
    if (!pg) return '';
    if (!here) h.push(nearHint('mottak'));
    // seven kinds (core BAITS): what is aboard, what each takes best, and buying more of it. The kind is chosen when the tubs are baited
    // and when the pots are set (Jonas 20.10.2026), so there is no «chosen kind» here
    const B = baitOf(pg), good = k => { const best = baitGood(k).map(spLc); return best.length ? L('best på ', 'best for ') + best.join(', ') : L('helt ok på alt', 'fair on everything'); };
    const rows = Object.entries(BAITS).map(([k, X]) => { const c20 = 20 * X.kr, c100 = 100 * X.kr;
      return '<div class="ph-kv"><span>' + baitDot(k) + '<b>' + X[S.lang] + '</b> · ' + good(k) + '</span><span>' + fmt(B[k] || 0, 0) + ' kg</span></div><div class="ph-row2">' +
        '<button class="ph-btn"' + (here && c20 <= spendable() && !buyGate('bait') ? '' : ' disabled') + ' data-pa="grbuy" data-w="bait" data-s="' + k + '" data-n="20">20 kg · ' + kr(c20) + '</button><button class="ph-btn"' + (here && c100 <= spendable() && !buyGate('bait') ? '' : ' disabled') + ' data-pa="grbuy" data-w="bait" data-s="' + k + '" data-n="100">100 kg · ' + kr(c100) + '</button></div>'; }).join('');
    const kr0 = Math.min(...Object.values(BAITS).map(X => X.kr)), kr1 = Math.max(...Object.values(BAITS).map(X => X.kr));
    h.push(itemCard({k:'bait', id:'baitStore', name:L('Agn', 'Bait'), price:fmt(kr0, 0) + '–' + fmt(kr1, 0) + ' kr/kg', body:'<div class="ic-rows">' + rows + '</div>', note:buyGate('bait') ? '<b>' + buyGate('bait')[0] + '</b>' : ''}));
    // own catch as bait, before it is landed
    { const own = BAIT_OWN.map(sp => [sp, S.hold.filter(x => x.sp === sp).reduce((a, x) => a + x.kg, 0)]).filter(x => x[1] >= 1);
      if (here && !b.land && own.length) h.push('<div class="ph-card"><h4>' + L('Egen fangst som agn', 'Own catch as bait') + '</h4><p class="ph-note">' + L('Sei fra lasten kan bli agn i stedet for å selges, men da før du leverer. Seien føres som eget bruk og teller på kvoten.', 'Saithe from the hold can be bait instead of being sold, but before you land. The saithe is entered as own use and counts on the quota.') + '</p>' +
        own.map(([sp, kg]) => { const n = Math.min(Math.floor(kg), 100); return '<button class="ph-btn" data-pa="grown" data-k="' + sp + '" data-n="' + n + '">' + L('Bruk ' + n + ' kg ', 'Use ' + n + ' kg of ') + SPECIES[sp][S.lang].toLowerCase() + L(' som agn', ' as bait') + '</button>'; }).join('') + '</div>'); }
    let any = false;
    for (const lk of ['hyse', 'bank']){ const L0 = pg.lines[lk]; if (!L0.n && !tubState(lk).work.length) continue; any = true; h.push(lineCard(lk, {work:b.status === 'port' || seaWork(), shed:here && egnPort(p)})); }
    if (!any) h.push('<p class="ph-note">' + L('Ingen line om bord. Line kjøper du i utstyrsbutikken (Butikk › Fiskeutstyr).', 'No line aboard. Line is sold at the tackle shop (Shop › Tackle).') + '</p>');
    const shore = pg.shore.filter(j => j.ready && j.kind === 'egn'); if (shore.length) h.push('<div class="ph-card"><h4>' + L('I egnebua', 'At the baiting shed') + '</h4>' + shore.map(j => kv(j.n + ' ' + L('stamper', 'tubs'), portById(j.port).name + ', ' + L('klar ', 'ready ') + (S.t >= j.ready ? L('nå', 'now') : hm(j.ready / 60)))).join('') + '</div>');
    return h.join('') + '</div>';
  }
  function oppdrag(){ return salg('best'); }
  function ordl(){
    const tab = sub.ordl || 'turer', tabs = subs('ordl', [['turer', 'Turer', 'Trips'], ['best', 'Bestillinger', 'Orders']]);
    if (tab === 'turer') return '<div class="ph-c">' + tabs + turPage() + '</div>';
    return ordlBest(tabs);
  }
  function ordlBest(tabs){
    const O = ordState(), cn = id => (CUSTOMERS.find(c => c.id === id) || {no:id}).no, H = S.t / 60, h = ['<div class="ph-c">' + (tabs || '')];
    if (!O.active.length) h.push('<div class="ph-card"><p class="ph-note">' + L('Ingen aktive oppdrag. Nye oppdrag tar du under Bygd, Oppdrag, når båten ligger i havn.', 'No active orders. You take new ones under Village, Orders, when the boat is in port.') + '</p></div>');
    for (const o of O.active){ const got = o.kg - o.left, late = o.due - S.t < 360;
      h.push('<div class="ph-card ordq"><h4>' + cn(o.cust) + '</h4><p>' + L('Lever ' + fmt(o.kg, 0) + ' kg ' + SPECIES[o.sp].no.toLowerCase() + ' i ' + portById(o.port).name, 'Deliver ' + fmt(o.kg, 0) + ' kg of ' + SPECIES[o.sp].en.toLowerCase() + ' at ' + portById(o.port).name) + '</p>' +
        '<div class="qbar"><i style="width:' + Math.round(got / o.kg * 100) + '%"></i></div>' + kv(L('Levert', 'Delivered'), fmt(got, 0) + ' / ' + fmt(o.kg, 0) + ' kg') + kv(L('Kvalitet', 'Quality'), QN[o.q][S.lang]) +
        kv(L('Frist', 'Deadline'), '<span class="' + (late ? 'r2' : '') + '">' + dayStr(o.due / 60) + ' ' + hm(o.due / 60) + ' · ' + inReal(o.due - S.t) + '</span>') + kv(L('Tillegg og bonus', 'Premium and bonus'), '+' + Math.round(o.prem * 100) + ' % · ' + kr(o.bonus)) + '</div>'); }
    const old = (O.done || []).slice(0, 12);
    if (old.length) h.push('<h4 style="margin:10px 2px 4px">' + L('Tidligere', 'Earlier') + '</h4><div class="ph-card">' + old.map(o => kv(cn(o.cust) + ' · ' + fmt(o.kg, 0) + ' kg ' + SPECIES[o.sp].no.toLowerCase(), (o.ok === false ? '<span class="r2">' + L('Ikke levert', 'Not delivered') + '</span>' : '<span class="r0">' + L('Levert', 'Delivered') + '</span>') + ' · ' + dayStr(o.t / 60).replace(/^\S+ /, ''))).join('') + '</div>');
    return h.join('') + '</div>';
  }
