// ---------- the phone ----------
const PHONE = (() => {
  const el = $('phone'), view = $('phView'), tEl = $('phTime'), nEl = $('phNet'), badge = $('phoneBadge');
  let app = 'home', sub = {}, isOpen = false, confirmMayday = false, shopPend = null, saveBox = null, haillPend = null;
  const L = (no, en) => S.lang === 'no' ? no : en;
  const SVG = d => '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">' + d + '</svg>';
  const IC = {
    fiske:SVG('<path d="M15 3v9.5a4.5 4.5 0 0 1-9 0V10l-2.2 2.2"/><path d="M6 10l2.2 2.2"/><circle cx="15" cy="3" r="1.2"/><path d="M15 7l3 1.5"/>'),
    haill:SVG('<path d="M7 5v7a5 5 0 0 0 10 0V5"/><path d="M5 5h4M15 5h4"/><circle cx="7" cy="8.5" r=".7" fill="#fff"/><circle cx="17" cy="8.5" r=".7" fill="#fff"/><circle cx="8.2" cy="13.5" r=".7" fill="#fff"/><circle cx="15.8" cy="13.5" r=".7" fill="#fff"/>'),
    vaer:SVG('<circle cx="9" cy="9" r="3.2"/><path d="M9 2.5v1.6M3.3 9H1.8M4.4 4.4l1.1 1.1M13.6 4.4l-1.1 1.1"/><path d="M8 20h9.5a3.5 3.5 0 0 0 .3-7 5 5 0 0 0-9.6 1.2A2.9 2.9 0 0 0 8 20z"/>'),
    post:SVG('<path d="M4 5h13v14H6a2 2 0 0 1-2-2V5z"/><path d="M17 8h3v9a2 2 0 0 1-2 2"/><path d="M7 9h7M7 12h7M7 15h4"/>'),
    salg:SVG('<path d="M3 12c3-4 8-5 12-3l4-3v12l-4-3c-4 2-9 1-12-3z"/><circle cx="7.5" cy="11" r=".8" fill="#fff"/>'),
    redning:SVG('<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="3.8"/><path d="M6 6l3.3 3.3M18 6l-3.3 3.3M6 18l3.3-3.3M18 18l-3.3-3.3"/>'),
    fartoy:SVG('<path d="M3 15h18l-2.5 4.5H6z"/><path d="M8 15V9h6l2 6"/><path d="M11 9V5"/><path d="M2 21c2 0 2-1 4-1s2 1 4 1 2-1 4-1 2 1 4 1 2-1 4-1"/>'),
    utstyr:SVG('<path d="M14.5 5.5a4 4 0 0 0-5 5L3.8 16.2a1.8 1.8 0 0 0 2.5 2.5l5.7-5.7a4 4 0 0 0 5-5l-2.5 2.5-2.3-.5-.5-2.3z"/>'),
    bors:SVG('<circle cx="8" cy="8" r="3"/><circle cx="16" cy="8" r="3"/><path d="M2.5 19c.6-3.3 2.8-5 5.5-5s4.9 1.7 5.5 5"/><path d="M12.5 14.4c.9-.3 2.2-.4 3.5-.4 2.7 0 4.9 1.7 5.5 5"/>'),
    mannskap:SVG('<circle cx="8.5" cy="8" r="3"/><circle cx="16.5" cy="9" r="2.5"/><path d="M3 19c.5-3.5 3-5 5.5-5s5 1.5 5.5 5"/><path d="M14.5 14.2c2.8-.4 5.4.8 6.3 4.8"/>'),
    bank:SVG('<path d="M3 9l9-5 9 5"/><path d="M5 10v7M9.5 10v7M14.5 10v7M19 10v7M3 19.5h18"/>'),
    meld:SVG('<path d="M4 5h16v11H9l-5 4z"/><path d="M8 9.5h8M8 12.5h5"/>'),
    verksted:SVG('<path d="M4 20l7-7"/><path d="M13.5 4.5l6 6-3 3-6-6z"/><path d="M10.5 7.5l6 6"/><path d="M3 21l2-2"/>'),
    havn:SVG('<circle cx="12" cy="5" r="2"/><path d="M12 7v13"/><path d="M5 13a7 7 0 0 0 14 0"/><path d="M8 10h8"/>'),
    last:SVG('<path d="M3 8l9-4 9 4v9l-9 4-9-4z"/><path d="M3 8l9 4 9-4M12 12v9"/>'),
    logg:SVG('<path d="M6 3h12v18H6z"/><path d="M9 8h6M9 12h6M9 16h4"/>'),
    rederi:SVG('<path d="M4 20V10l6-3v13"/><path d="M10 20V5l9 4v11"/><path d="M2 20h20"/><path d="M13 10h3M13 13h3M13 16h3M6 13h2M6 16h2"/>'),
    redskap:SVG('<circle cx="12" cy="16" r="4.5"/><path d="M12 11.5V3l5 2-5 2"/><path d="M3 21c3-1.5 6-1.5 9 0s6 1.5 9 0"/>'),
    sjomann:SVG('<circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.4"/><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.9 2.9M15.5 15.5l2.9 2.9M5.6 18.4l2.9-2.9M15.5 8.5l2.9-2.9"/>'),
    ordl:SVG('<path d="M8.5 3.5h7v3h-7z"/><path d="M8 5H5v16h14V5h-3"/><path d="M8 11l1.5 1.5L12 10M8 16l1.5 1.5L12 15M14 11h3M14 16h3"/>'),
    regler:SVG('<path d="M6 3h11a2 2 0 0 1 2 2v14H8a2 2 0 0 1-2-2z"/><path d="M6 17a2 2 0 0 1 2-2h11"/><path d="M9.5 8.6l1.8 1.8L15 6.7"/>'),
    kvote:SVG('<path d="M12 3a9 9 0 1 0 9 9h-9z"/><path d="M15 2.6A9 9 0 0 1 21.4 9H15z"/>'),
    trim:SVG('<path d="M4 15a8 8 0 1 1 16 0"/><path d="M12 15l4-5"/><circle cx="12" cy="15" r="1.6"/><path d="M6 19h12"/>'),
    patch:SVG('<path d="M6 3h9l4 4v14H6z"/><path d="M15 3v4h4"/><path d="M9 12h7M9 15.5h7M9 19h4"/>'),
    innst:SVG('<circle cx="12" cy="12" r="3"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1"/>'),
    admin:SVG('<path d="M14.5 6.5a4 4 0 0 0 5 5L12 19a2.1 2.1 0 0 1-3-3l7.5-7.5"/><path d="M14.5 6.5L17 4l3 3-2.5 2.5"/><path d="M5 3l3 3M3 5l3 3"/>')};
  const APPS = [['vaer', 'Vær', 'Weather', '#2f7fd0'], ['post', 'Kystposten', 'Coast Post', '#b8402f'], ['meld', 'Meldinger', 'Messages', '#29a36a'], ['rederi', 'Rederi', 'Company', '#1f4e79'], ['salg', 'Salgslaget', 'Sales', '#1e8c6e'], ['kvote', 'Kvote', 'Quota', '#8a6a1c'], ['regler', 'Regler', 'Rules', '#2d6a4f'], ['ordl', 'Oppdrag', 'Orders', '#2e7d4f'], ['haill', 'Haill', 'Luck', '#c9a227'], ['sjomann', 'Sjømann', 'Seaman', '#23506b'], ['redning', 'Redning', 'Rescue', '#e0562b'], ['trim', 'Trim', 'Tuning', '#b3261e'], ['patch', 'Patchnotes', 'Patch notes', '#5a4fa3'], ['innst', 'Innstillinger', 'Settings', '#4a5560'], ['admin', 'Admin', 'Admin', '#7a2e8f']];
  const unread = () => S.msgs.filter(m => !m.read).length;
  function setBadge(){ const n = unread(); for (const bd of [badge, $('phoneBadge2')]){ bd.hidden = !n; bd.textContent = n; } }
  // --- workshop: service, fitting and getting the gear ready, one job after the other while the boat is in port
  function haill(){
    // the luck aboard (its stage and the hours left), the store with «Aktiver», and the shop (the user's list 04.10.2026)
    const h = ['<div class="ph-c">'], a = S.haill, st = haillStage(), inv = S.haillInv || {haill:0, luksus:0}, hr = v => v >= 48 ? fmt(v / 24, 1) + L(' døgn', ' days') : fmt(v, 0) + L(' t', ' h');
    if (a && st){ const X = HAILL[a.type], tot = X.steps[X.steps.length - 1][0], left = haillLeft(), nx = X.steps.find(q => haillAge() < q[0]);
      h.push('<div class="ph-card haillc"><h4>' + st[S.lang] + ' ' + L('om bord', 'aboard') + '</h4>' + kv(L('Fiskelykke nå', 'Luck now'), '+' + Math.round(st.v * 100) + ' %') + '<div class="qbar"><i style="width:' + (left / tot * 100).toFixed(0) + '%;background:#c9a227"></i></div>' +
        kv(L('Neste trinn om', 'Next stage in'), hr(nx[0] - haillAge())) + kv(L('Borte om', 'Gone in'), hr(left)) + '</div>'); }
    else h.push('<div class="ph-card"><p class="ph-note">' + L('Ingen haill om bord. Haill er ferskvare: sterkest de første timene, så svakere trinn for trinn til den er borte. Den virker på alt du fisker.', 'No luck aboard. Luck is fresh goods: strongest the first hours, then weaker stage by stage until it is gone. It works on everything you fish.') + '</p></div>');
    // the store: switched on only when you say so
    if (inv.haill > 0 || inv.luksus > 0){ h.push('<div class="ph-card haillc"><h4>' + L('Beholdning', 'In store') + '</h4>');
      for (const k of ['luksus', 'haill']) if (inv[k] > 0){ const pend = haillPend === k && a && st;
        h.push(kv(HAILL[k][S.lang], '× ' + inv[k]) + (pend ? '<div class="ph-row2"><button class="ph-btn p" data-pa="haillon" data-k="' + k + '">' + L('Bytt ut den om bord', 'Replace the one aboard') + '</button><button class="ph-btn alt" data-pa="haill0">' + L('Avbryt', 'Cancel') + '</button></div>' : '<button class="ph-btn p" data-pa="haillon" data-k="' + k + '">' + L('Aktiver ', 'Switch on ') + HAILL[k][S.lang].toLowerCase() + '</button>')); }
      h.push('<p class="ph-note">' + L('Haill blir aldri aktivert av seg selv. En ny haill erstatter den som er om bord.', 'Luck is never switched on by itself. A new one replaces the one aboard.') + '</p></div>'); }
    const gift = tutFree('haill');
    if (gift) h.push('<div class="ph-card haillc"><h4>' + L('Første gang er luksushaill gratis', 'The first luxury luck is free') + '</h4><p class="ph-note">' + L('Ellers koster haill 29 kr og luksushaill 59 kr. Du kan også være heldig på puben.', 'Otherwise luck is NOK 29 and luxury luck NOK 59. You can also get lucky at the pub.') + '</p></div>');
    for (const k of ['haill', 'luksus']){ const X = HAILL[k], free = gift && k === 'luksus';
      h.push('<div class="ph-card haillc"><h4>' + X[S.lang] + '</h4><p>' + X.d[S.lang] + '</p><div class="ph-kv"><span>' + L('Pris', 'Price') + '</span><span><b>' + (free ? L('gratis nå', 'free now') : X.nok + ' kr') + '</b></span></div><button class="ph-btn p" data-pa="haillbuy" data-k="' + k + '"' + (gift && !free ? ' disabled' : '') + '>' + (free ? L('Hent gratis luksushaill', 'Fetch a free luxury luck') : L('Kjøp (test, ingen betaling)', 'Buy (test, no payment)')) + '</button></div>'); }
    h.push('<p class="ph-note">' + L('Haill selges bare for ekte penger. Betaling kommer når spillet får egen server. Du kan også være heldig på puben.', 'Luck is sold for real money only. Payment comes when the game gets its own server. You can also get lucky at the pub.') + '</p></div>');
    return h.join('');
  }
  // --- the tackle shop on the quay: a purchase takes two taps, the second one confirms the price
  // the first-trip guide hands out the hand jig and the first fill of ice (07b-first-trip.js)
  const shopBtn = (k, kg, c, label, fill) => { const pt = portById(S.boat.port), here = inPort() && pt; if (tutFree(k)) c = 0; const on = shopPend && shopPend.k === k && shopPend.kg === kg, dis = !here || c > S.cash, pr = c ? kr(c) : L('gratis', 'free'), fa = fill ? ' data-fill="1"' : '';
      return on ? '<div class="ph-row2"><button class="ph-btn p" data-pa="shop" data-k="' + k + '" data-kg="' + kg + '"' + fa + '>' + L('Bekreft · ', 'Confirm · ') + pr + '</button><button class="ph-btn alt" data-pa="shop0">' + L('Avbryt', 'Cancel') + '</button></div>'
        : '<button class="ph-btn" data-pa="shop" data-k="' + k + '" data-kg="' + kg + '"' + fa + (dis ? ' disabled' : '') + '>' + label + ' · ' + pr + '</button>'; };
  function fiske(){
    const b = S.boat, pt = portById(b.port), here = inPort() && pt, ice = here && pt.ice, room = shopIceRoom(), ikr = shopIceKr();
    const h = ['<div class="ph-c"><div class="ph-card"><h4>' + (here ? (pt.id === 'finnsnes' ? L('Fiskeutstyr på kaia i Finnsnes', 'The tackle shop on the quay in Finnsnes') : L('Butikken i ', 'The shop in ') + pt.name) : L('Butikken er på land', 'The shop is ashore')) + '</h4><p class="ph-note">' +
      (here ? L('Her får du det du trenger for å fiske med juksa, garn, line og teiner. Klær, elektronikk og juksamaskiner finner du under Oppgraderinger.', 'Everything you need to fish with a jig, nets, line and pots. Clothes, electronics and jigging machines are under Upgrades.') : L('Du kan se hva som finnes, men handle når båten ligger i havn.', 'You can look, but buy when the boat is in port.')) + '</p></div>'];
    const buy = shopBtn;
    const have = '<p class="r0"><b>' + L('Om bord', 'Aboard') + '</b></p>';
    h.push('<div class="ph-card"><h4>' + L('Håndjuksa', 'Hand jig') + '</h4><p>' + L('Snøre, søkke, pilk og markkroker på en rull ved ripa. Med den fisker du torsk, sei og hyse. Uten juksa kan du ikke fiske for hånd.', 'Line, sinker, pilk and fly hooks on a reel at the rail. It takes cod, saithe and haddock. Without it you cannot fish by hand.') + '</p>' + kv(L('Pris', 'Price'), kr(PRICE.gear)) + (b.gear ? have : buy('jig', 0, PRICE.gear, L('Kjøp håndjuksa', 'Buy a hand jig'))) + '</div>');
    // the ice is sold in the market; the first trip still gets its free fill here, next to the hand jig
    if (tutOn()) h.push(iceCard());
    if (!tutOn()) h.push('<div class="ph-card"><h4>' + L('Kveiteutstyr', 'Halibut gear') + '</h4><p>' + L('Stor pilk, kraftig snøre og gaff. Kveita er fredet fra 20. desember til og med 20. april.', 'Big pilk, heavy line and gaff. Halibut is closed from 20 December to 20 April.') + '</p>' + kv(L('Pris', 'Price'), kr(PRICE.kgear)) + (b.kgear ? have : buy('kgear', 0, PRICE.kgear, L('Kjøp kveiteutstyr', 'Buy halibut gear'))) + '</div>');
    h.push('</div>');
    if (!tutOn()) h.push(redskap('kjop'));
    return h.join('');
  }
  function iceCard(){
    const b = S.boat, pt = portById(b.port), here = inPort() && pt, ice = here && pt.ice, room = shopIceRoom(), ikr = shopIceKr(), buy = shopBtn;
    const h = [];
    h.push('<div class="ph-card"><h4>' + L('Is', 'Ice') + '</h4><p>' + L('Is holder fisken fersk. Uten is faller kvaliteten fort, og mottaket betaler mindre. Du bruker rundt 0,3 kg is per kg fisk.', 'Ice keeps the fish fresh. Without it the quality drops fast and the plant pays less. You use about 0.3 kg of ice per kg of fish.') + '</p>' +
      kv(L('Om bord', 'Aboard'), fmt(b.ice, 0) + ' / ' + BOAT.iceCap + ' kg') + '<div class="ph-bar"><i style="width:' + Math.round(clamp(b.ice / BOAT.iceCap, 0, 1) * 100) + '%"></i></div>' +
      kv(L('Pris', 'Price'), fmt(ikr, 2) + ' kr/kg') + (here ? '<p class="ph-note">' + (ice ? L('Isen kommer fra isrenna på mottakskaia.', 'The ice comes down the chute at the plant\'s quay.') : L('Her er det ingen isrenne. Butikken selger is i sekker og bærer den om bord.', 'There is no ice chute here. The shop sells bagged ice and carries it aboard.')) + '</p>' : '') +
      (room < 1 ? '<p class="r0"><b>' + L('Iskassa er full', 'The ice box is full') + '</b></p>' : '<div class="ph-btncol">' + (room > 60 && !tutFree('ice') ? buy('ice', 50, Math.round(50 * ikr), L('50 kg is', '50 kg of ice')) : '') + buy('ice', room, Math.round(room * ikr), L('Fyll opp, ', 'Fill up, ') + room + ' kg', true) + '</div>') + '</div>');
    return h.join('');
  }
  function verksted(){
    const b = S.boat, V = VESSELS[b.type], jobs = S.jobs || [], h = ['<div class="ph-c"><p class="ph-note">' + L('Jobbene går etter tur mens båten ligger i havn. Perfekt når det blåser. En planlagt avgang venter til alt er ferdig.', 'Jobs run one after another while the boat is in port. Perfect when it blows. A planned departure waits until everything is done.') + '</p>'];
    // the hull: fouling slows her and costs fuel (core foulHour); cleaned on the slip
    { const f = b.foul || 0, c = 1500 + Math.round(BOAT.len * 400 / 100) * 100, queued = jobs.some(j => j.kind === 'hull');
      h.push('<div class="ph-card"><h4>' + L('Skrog og begroing', 'Hull and fouling') + '</h4>' + kv(L('Begroing', 'Fouling'), Math.round(f * 100) + ' %') + '<div class="qbar"><i style="width:' + (f * 100).toFixed(0) + '%;background:' + (f > 0.5 ? '#c0392b' : '#1e8c6e') + '"></i></div>' +
        kv(L('Fart', 'Speed'), '−' + fmt(15 * f, 1) + ' %') + kv(L('Drivstoff', 'Fuel'), '+' + fmt(25 * f, 1) + ' %') + '<p class="ph-note">' + L('Groe og rur vokser på skroget, raskest om sommeren. ', 'Weed and barnacles grow on the hull, fastest in summer. ') + (S.equip.antigro ? L('Antigro-belegget holder det nede.', 'The antifouling coat keeps it down.') : L('Antigro-belegg under Oppgrader gjør at det gror tre ganger så sakte.', 'An antifouling coat under Upgrade makes it grow three times as slowly.')) + '</p>' +
        (queued ? '<p><b>' + L('På slippen', 'On the slip') + '</b></p>' : '<button class="ph-btn p" data-pa="hullclean"' + (!inPort() || S.cash < c || f < 0.02 ? ' disabled' : '') + '>' + L('Skrogrens på slipp · ', 'Hull cleaning on the slip · ') + kr(c) + ' · 6 t</button>') + '</div>'); }
    h.push('<div class="ph-card"><h4>' + L('Arbeidskø', 'Work queue') + ' (' + jobs.length + '/6)</h4>');
    if (!jobs.length) h.push('<p class="ph-note">' + L('Ingen jobber.', 'No jobs.') + '</p>');
    jobs.forEach((j, i) => {
      const run = i === 0 && j.until != null, pct = run ? clamp(1 - (j.until - S.t) / (j.h * 60), 0, 1) : 0;
      if (run && j.until > S.t + 30){ const left = (j.until - S.t) / 60, c = Math.round(left / 2 * 950 / 10) * 10; h.push('<div class="ph-row2"><button class="ph-btn" data-pa="jobOT"' + (j.ot ? ' disabled' : '') + '>' + (j.ot ? L('Mekaniker på overtid', 'Mechanic on overtime') : L('Overtid, halv tid · ', 'Overtime, half the time · ') + kr(c)) + '</button><button class="ph-btn alt" data-pa="jobRush">' + L('Hastejobb · 15 kr (test)', 'Rush job · NOK 15 (test)') + '</button></div>'); }
      h.push('<div class="ph-kv"><span>' + (S.lang === 'no' ? j.no : j.en) + '</span><span>' + (run ? L('ferdig ', 'done ') + whenTxt(j.until) : i === 0 && !inPort() ? L('venter på havn', 'waits for port') : j.h + ' t') + (i > 0 ? ' <button class="ph-btn alt" style="margin:0 0 0 6px;padding:3px 8px" data-pa="jobx" data-i="' + i + '">✕</button>' : '') + '</span></div>' + (run ? '<div class="ph-bar"><i style="width:' + Math.round(pct * 100) + '%"></i></div>' : ''));
    });
    h.push('</div>');
    const svcLeft = V.svcH - ((b.engH || 0) - (b.svcAt || 0)), queuedSvc = jobs.some(j => j.kind === 'svc');
    h.push('<div class="ph-card"><h4>' + L('Motorservice', 'Engine service') + '</h4>' + kv(L('Neste service', 'Next service'), svcLeft > 0 ? L('om ', 'in ') + fmt(svcLeft, 0) + ' t' : '<span class="r2">' + L('forfalt', 'overdue') + '</span>') +
      '<button class="ph-btn" data-pa="svc" data-m="yard"' + (queuedSvc ? ' disabled' : '') + '>' + L('Verkstedet', 'The yard') + ' · ' + kr(V.svcCost) + ' · ' + V.svcJobH + ' t</button>' +
      '<button class="ph-btn alt" data-pa="svc" data-m="self"' + (queuedSvc ? ' disabled' : '') + '>' + L('Gjør det selv', 'Do it yourself') + ' · ' + kr(Math.round(V.svcCost * 0.35)) + ' · ' + Math.round(V.svcJobH * 2.5) + ' t</button></div>');
    h.push('<div class="ph-card"><h4>' + L('Klargjøring til neste tur', 'Getting ready for the next trip') + '</h4>');
    for (const [k, P2] of Object.entries(PREP)){
      const ready = S.prep && S.prep[k], queued = jobs.some(j => j.kind === 'prep' && j.k === k), ok = !P2.need || P2.need();
      h.push('<p><b>' + (S.lang === 'no' ? P2.no : P2.en) + '</b><br><span class="ph-note">' + P2.fx[S.lang] + ' · ' + P2.h + ' t · ' + kr(P2.cost) + '</span></p>' + (ready ? '<p class="r0"><b>' + L('Klart', 'Ready') + '</b></p>' : '<button class="ph-btn" data-pa="prep" data-k="' + k + '"' + (queued || !ok ? ' disabled' : '') + '>' + (queued ? L('I kø', 'Queued') : L('Legg i kø', 'Add to queue')) + '</button>'));
    }
    h.push('</div></div>');
    return h.join('');
  }
  // the old tabs live on as phone apps
  function havn(){ return '<div class="ph-panel">' + panelPort() + '</div>'; }
  function last(){ return '<div class="ph-panel">' + panelHold() + '</div>'; }
  // --- the pages of the dock's drawer (ui/10c-dock.js): the market, the village and the yard in port, the inventory everywhere
  function lever(){ return '<div class="ph-panel">' + landPage() + '</div>'; }
  function isApp(){ return '<div class="ph-c">' + iceCard() + '</div>'; }
  // bait for line and pots, and the baiting of the tubs
  function agn(){
    const b = S.boat, pg = S.pgear, p = portById(b.port), here = inPort(), h = ['<div class="ph-c">'];
    if (!pg) return '';
    // five kinds (core BAITS, the user's list 04.10.2026): what is aboard, the one the line and the pots take, and buying more of it
    const B = baitOf(pg), pref = BAITS[pg.baitPref] ? pg.baitPref : 'makrell', good = k => { const f = BAITS[k].f, best = Object.keys(f).filter(sp => f[sp] > 1).map(sp => SPECIES[sp] ? SPECIES[sp][S.lang].toLowerCase() : sp); return best.length ? L('best på ', 'best for ') + best.join(', ') : L('helt ok på alt', 'fair on everything'); };
    h.push('<div class="ph-card"><h4>' + L('Agn', 'Bait') + '</h4><p class="ph-note">' + L('Lina egnes med det slaget du velger, og teinene tar det samme. Hver stamp hyseline tar ', 'The line is baited with the kind you choose, and the pots take the same. Each tub of haddock line takes ') + fmt(LINE_KINDS.hyse.baitKg, 0) + L(' kg, og hver teine ', ' kg, and each pot ') + fmt(GPRICE.potBait, 1) + ' kg.</p>');
    for (const [k, X] of Object.entries(BAITS)){ const c20 = 20 * X.kr, c100 = 100 * X.kr;
      h.push('<div class="ph-kv"><span><b>' + X[S.lang] + '</b> · ' + good(k) + '</span><span>' + fmt(B[k] || 0, 0) + ' kg</span></div><div class="ph-row2"><button class="ph-btn' + (pref === k ? ' p' : ' alt') + '" data-pa="grpref" data-k="' + k + '">' + (pref === k ? L('Valgt', 'Chosen') : L('Velg', 'Choose')) + '</button>' +
        '<button class="ph-btn"' + (here && c20 <= S.cash ? '' : ' disabled') + ' data-pa="grbuy" data-w="bait" data-s="' + k + '" data-n="20">20 kg · ' + kr(c20) + '</button><button class="ph-btn"' + (here && c100 <= S.cash ? '' : ' disabled') + ' data-pa="grbuy" data-w="bait" data-s="' + k + '" data-n="100">100 kg · ' + kr(c100) + '</button></div>'); }
    h.push('</div>');
    // own catch as bait, before it is landed
    { const own = BAIT_OWN.map(sp => [sp, S.hold.filter(x => x.sp === sp).reduce((a, x) => a + x.kg, 0)]).filter(x => x[1] >= 1);
      if (here && !b.land && own.length) h.push('<div class="ph-card"><h4>' + L('Egen fangst som agn', 'Own catch as bait') + '</h4><p class="ph-note">' + L('Sei og krabbe fra lasten kan bli agn i stedet for å selges, men da før du leverer. Seien føres som eget bruk og teller på kvoten.', 'Saithe and crab from the hold can be bait instead of being sold, but before you land. The saithe is entered as own use and counts on the quota.') + '</p>' +
        own.map(([sp, kg]) => { const n = Math.min(Math.floor(kg), 100); return '<button class="ph-btn" data-pa="grown" data-k="' + sp + '" data-n="' + n + '">' + L('Bruk ' + n + ' kg ', 'Use ' + n + ' kg of ') + SPECIES[sp][S.lang].toLowerCase() + L(' som agn', ' as bait') + '</button>'; }).join('') + '</div>'); }
    let any = false;
    for (const lk of ['hyse', 'bank']){ const L0 = pg.lines[lk], un = L0.n - L0.baited; if (!L0.n) continue; any = true;
      h.push('<div class="ph-card"><h4>' + LINE_KINDS[lk][S.lang] + '</h4>' + kv(L('Stamper', 'Tubs'), L0.n + ', ' + L0.baited + ' ' + L('egnet', 'baited')) +
        (here && un > 0 ? '<div class="ph-btncol">' + (egnPort(p) ? '<button class="ph-btn p" data-pa="gregn" data-lk="' + lk + '" data-n="' + un + '" data-m="shed">' + L('Egnebua egner ' + un, 'The shed baits ' + un) + ' (' + kr(un * (LINE_KINDS[lk].egn + LINE_KINDS[lk].baitKg * BAITS[BAITS[pg.baitPref] ? pg.baitPref : 'makrell'].kr)) + ')</button>' : '') +
          '<button class="ph-btn" data-pa="gregn" data-lk="' + lk + '" data-n="' + un + '" data-m="self">' + L('Egn ' + un + ' selv', 'Bait ' + un + ' yourselves') + ' (' + fmt(un * LINE_KINDS[lk].baitKg, 0) + ' kg ' + L('agn', 'bait') + ')</button></div>' : '') +
        (here && un > 0 && !egnPort(p) ? '<p class="ph-note">' + L('Egnebuene ligger ved mottakene.', 'The baiting sheds are at the fish plants.') + '</p>' : '') + '</div>'); }
    if (!any) h.push('<p class="ph-note">' + L('Ingen line om bord. Line kjøper du under Verft, Fiskeutstyr.', 'No line aboard. Line is sold under Yard, Tackle.') + '</p>');
    const shore = pg.shore.filter(j => j.ready && j.kind === 'egn'); if (shore.length) h.push('<div class="ph-card"><h4>' + L('I egnebua', 'At the baiting shed') + '</h4>' + shore.map(j => kv(j.n + ' ' + L('stamper', 'tubs'), portById(j.port).name + ', ' + L('klar ', 'ready ') + (S.t >= j.ready ? L('nå', 'now') : hm(j.ready / 60)))).join('') + '</div>');
    return h.join('') + '</div>';
  }
  function oppdrag(){ return salg('best'); }
  function ordl(){
    const O = ordState(), cn = id => (CUSTOMERS.find(c => c.id === id) || {no:id}).no, H = S.t / 60, h = ['<div class="ph-c">'];
    if (!O.active.length) h.push('<div class="ph-card"><p class="ph-note">' + L('Ingen aktive oppdrag. Nye oppdrag tar du under Bygd, Oppdrag, når båten ligger i havn.', 'No active orders. You take new ones under Village, Orders, when the boat is in port.') + '</p></div>');
    for (const o of O.active){ const got = o.kg - o.left, late = o.due - S.t < 360;
      h.push('<div class="ph-card ordq"><h4>' + cn(o.cust) + '</h4><p>' + L('Lever ' + fmt(o.kg, 0) + ' kg ' + SPECIES[o.sp].no.toLowerCase() + ' i ' + portById(o.port).name, 'Deliver ' + fmt(o.kg, 0) + ' kg of ' + SPECIES[o.sp].en.toLowerCase() + ' at ' + portById(o.port).name) + '</p>' +
        '<div class="qbar"><i style="width:' + Math.round(got / o.kg * 100) + '%"></i></div>' + kv(L('Levert', 'Delivered'), fmt(got, 0) + ' / ' + fmt(o.kg, 0) + ' kg') + kv(L('Kvalitet', 'Quality'), QN[o.q][S.lang]) +
        kv(L('Frist', 'Deadline'), '<span class="' + (late ? 'r2' : '') + '">' + dayStr(o.due / 60) + ' ' + hm(o.due / 60) + ' · ' + inReal(o.due - S.t) + '</span>') + kv(L('Tillegg og bonus', 'Premium and bonus'), '+' + Math.round(o.prem * 100) + ' % · ' + kr(o.bonus)) + '</div>'); }
    const old = (O.done || []).slice(0, 12);
    if (old.length) h.push('<h4 style="margin:10px 2px 4px">' + L('Tidligere', 'Earlier') + '</h4><div class="ph-card">' + old.map(o => kv(cn(o.cust) + ' · ' + fmt(o.kg, 0) + ' kg ' + SPECIES[o.sp].no.toLowerCase(), (o.ok === false ? '<span class="r2">' + L('Ikke levert', 'Not delivered') + '</span>' : '<span class="r0">' + L('Levert', 'Delivered') + '</span>') + ' · ' + dayStr(o.t / 60).replace(/^\S+ /, ''))).join('') + '</div>');
    return h.join('') + '</div>';
  }
  // the Regler app (R3 of the rules plan, 05.10.2026): «Her og nå» answers «can I fish here?» for your boat, gear and target where she is,
  // with every species and gear in a grid; «Sjekk» asks the same for any species, gear, length, month and place (the boat, the middle of
  // the chart or a port); «Lær mer» tells the rules plainly. All of it from rulesAt() in core/03e-rules.js
  const RU_SPR = [['torsk', 'Torsk', 'Cod'], ['hyse', 'Hyse', 'Haddock'], ['sei', 'Sei', 'Saithe'], ['lange', 'Lyr, lange, brosme', 'Pollack, ling, tusk'], ['kveite', 'Kveite', 'Halibut'], ['uer', 'Uer', 'Redfish'], ['krabbe', 'Taskekrabbe', 'Brown crab']];
  const RU_GR = [['juksa', 'Juksa', 'Jig'], ['line', 'Line', 'Line'], ['garn', 'Garn', 'Nets'], ['teiner', 'Teiner', 'Pots']];
  const ruMark = v => v === 'no' ? '✕' : v === 'warn' ? '!' : '✓';
  const ruBadge = v => '<span class="rv rv-' + v + '">' + ruMark(v) + ' ' + (v === 'no' ? L('Nei', 'No') : v === 'warn' ? L('Ja, men', 'Yes, but') : L('Ja', 'Yes')) + '</span>';
  function ruList(r){ const it = r.items.filter(i => i.v !== 'info'); if (!it.length) return '<p class="ph-note">' + L('Ingen særlige regler her for dette. Kvoten og minstemålene gjelder som ellers.', 'No special rules here for this. Your quota and the minimum sizes hold as always.') + '</p>';
    return it.map(i => '<div class="ru-it ru-' + i.v + '"><b>' + ruMark(i.v) + '</b><span>' + L(i.no, i.en) + '<small>' + i.ref + (i.url ? ' · <a href="' + i.url + '" target="_blank" rel="noopener">' + L('kilde', 'source') + '</a>' : '') + '</small></span></div>').join('') +
      (r.items.some(i => i.v === 'info') ? '<p class="ph-note">' + r.items.filter(i => i.v === 'info').map(i => L(i.no, i.en)).join(' ') + ' ' + L('Det gjelder ikke redskapet ditt.', 'It does not concern your gear.') + '</p>' : ''); }
  function ruWhere(p){ const z = insideFjord(p) ? ruZone(p) : null, nm = blNm(p), hom = ruHom(p), lok = ruLok(p), ln = z && z.l.filter(x => x[0] === 'F').slice(0, 2).map(ruLineName).filter(Boolean);
    return kv(L('Fjordlinjene', 'Fjord lines'), insideFjord(p) ? L('innenfor', 'inside') + (ln && ln.length ? '<small> · ' + ln.join(', ') + '</small>' : '') : L('utenfor', 'outside')) +
      kv(L('Grunnlinja', 'Baseline'), insideBaseline(p) ? L('innenfor', 'inside') : fmt(nm, 1) + ' nm ' + L('utenfor', 'outside')) +
      kv(L('Statistikkområde', 'Statistics area'), (hom || '–') + (lok ? ' · ' + L('lokasjon ', 'location ') + lok : '')) +
      kv(L('Minstemål her', 'Minimum sizes here'), [['torsk', 'torsk', 'cod'], ['hyse', 'hyse', 'haddock'], ['sei', 'sei', 'saithe'], ['krabbe', 'krabbe', 'crab']].map(([k, no, en]) => L(no, en) + ' ' + ruMinSize(k, p) + ' cm').join(', ')); }
  // the grid: every species with every gear, for your boat here today
  function ruGrid(p, len, H, hand){
    return '<table class="ph-tbl ru-grid"><tr><th></th>' + RU_GR.map(g => '<th>' + L(g[1], g[2]) + '</th>').join('') + '</tr>' + RU_SPR.map(([sp, no, en]) => '<tr><td>' + L(no, en) + '</td>' + RU_GR.map(([g]) => {
      if ((sp === 'krabbe') !== (g === 'teiner')) return '<td class="ru-na">–</td>';
      const r = rulesAt({p, H, len, gear:g, sp, hand}); return '<td><button class="ru-c rv-' + r.v + '" data-pa="ruchk" data-k="pick" data-v="' + sp + ':' + g + '">' + ruMark(r.v) + '</button></td>'; }).join('') + '</tr>').join('') + '</table>'; }
  function ruChk(){ const c = Object.assign({sp:'torsk', gear:S.boat.rig || 'juksa', len:BOAT.len, where:'boat', port:null, month:null}, S.ruChk || {});
    if (c.pick){ const [sp, g] = String(c.pick).split(':'); c.sp = sp; c.gear = g; c.pick = null; } return c; }
  function ruHere(){ const q = ruCtx(), r = ruNow(), H = S.t / 60;
    return '<div class="ph-card"><h4>' + L('Kan jeg fiske her?', 'Can I fish here?') + ' ' + ruBadge(r.v) + '</h4><p class="ph-note">' + L('For ', 'For ') + S.boatName + ' (' + fmt(BOAT.len, 1) + ' m) ' + L('med ', 'with ') +
      L(...(RU_GR.find(g => g[0] === q.gear) || RU_GR[0]).slice(1)).toLowerCase() + (q.sp === 'kveite' ? L(', etter kveite', ', for halibut') : '') + ', ' + dayStr(H) + '.</p>' + ruList(r) + '</div>' +
      '<div class="ph-card"><h4>' + L('Alle arter og redskap her i dag', 'Every species and gear here today') + '</h4>' + ruGrid(q.p, q.len, H, q.hand) + '<p class="ph-note">' + L('Trykk på en rute for å se hvorfor.', 'Tap a square to see why.') + '</p></div>' +
      '<div class="ph-card"><h4>' + L('Hvor du er', 'Where you are') + '</h4>' + ruWhere(q.p) + '</div>' +
      '<p class="ph-note">' + L('Fra Fiskeridirektoratets reguleringskart og forskriftene (hentet ', 'From the Directorate of Fisheries\' regulation map and the regulations (fetched ') + RU.made + L('). De stengte feltene er et øyeblikksbilde fra den dagen. Kartplotteren viser det samme som et lag: rødt der du ikke kan fiske, gult der det er grenser.', '). The closed fields are a snapshot from that day. The chart plotter shows the same as a layer: red where you may not fish, yellow where there are limits.') + '</p>'; }
  function ruCheck(){ const c = ruChk(), y = yearH(S.t / 60), H = c.month == null ? S.t / 60 : (Date.UTC(y, c.month, 15, 12) - EPOCH) / 36e5;
    const near = PORTS.slice().sort((a, b) => dist(a.p, S.boat.pos) - dist(b.p, S.boat.pos)).slice(0, 6);
    const p = c.where === 'chart' ? {x:view.cx, y:view.cy} : c.where === 'port' && c.port && portById(c.port) ? portById(c.port).p : ruCtx().p;
    const chip = (k, v, label, on) => '<button class="' + (on ? 'on' : '') + '" data-pa="ruchk" data-k="' + k + '" data-v="' + v + '">' + label + '</button>';
    const lens = [[BOAT.len, L('Din båt', 'Your boat') + ' ' + fmt(BOAT.len, 1) + ' m'], [9, L('under 11 m', 'under 11 m')], [13, '11–14,99 m'], [18, '15–20,99 m'], [24, '21–27,99 m'], [30, L('28 m og over', '28 m and over')]];
    const r = rulesAt({p, H, len:c.len, gear:c.gear, sp:c.sp, hand:c.gear === 'juksa' && !(S.equip && S.equip.jukse > 0)});
    return '<div class="ph-card"><h4>' + L('Art', 'Species') + '</h4><div class="ru-chips">' + RU_SPR.map(([k, no, en]) => chip('sp', k, L(no, en), c.sp === k)).join('') + '</div>' +
      '<h4>' + L('Redskap', 'Gear') + '</h4><div class="ru-chips">' + RU_GR.map(([k, no, en]) => chip('gear', k, L(no, en), c.gear === k)).join('') + '</div>' +
      '<h4>' + L('Båtlengde', 'Boat length') + '</h4><div class="ru-chips">' + lens.map(([v, t]) => chip('len', v, t, Math.abs(c.len - v) < 0.01)).join('') + '</div>' +
      '<h4>' + L('Når', 'When') + '</h4><div class="ru-chips">' + chip('month', 'null', L('I dag', 'Today'), c.month == null) + MNS().map((m, i) => chip('month', i, m.slice(0, 3), c.month === i)).join('') + '</div>' +
      '<h4>' + L('Hvor', 'Where') + '</h4><div class="ru-chips">' + chip('where', 'boat', L('Der båten er', 'Where the boat is'), c.where === 'boat') + chip('where', 'chart', L('Midt i kartet', 'The middle of the chart'), c.where === 'chart') +
        near.map(q => chip('port', q.id, q.name, c.where === 'port' && c.port === q.id)).join('') + '</div></div>' +
      '<div class="ph-card"><h4>' + L('Svar', 'Answer') + ' ' + ruBadge(r.v) + '</h4>' + ruList(r) + ruWhere(p) + '</div>' +
      '<p class="ph-note">' + L('«Midt i kartet» er midten av kartplotteren: flytt kartet dit du vil fiske, og kom tilbake hit.', '«The middle of the chart» is the middle of the chart plotter: move the chart to where you want to fish, and come back here.') + '</p>'; }
  // the rules told plainly, each with its source
  function ruLearn(){ const T = [
      ['Fjordlinjene', 'The fjord lines', 'Fra Stad til Russland går det rette linjer over fjordmunningene. Innenfor dem gyter og vokser kysttorsken opp. Der kan båter på 15 m eller mer ikke fiske torsk, du kan ha høyst 80 torskegarn og 5 000 kroker, og snurrevad er forbudt.', 'From Stad to Russia straight lines cross the fjord mouths. Inside them the coastal cod spawns and grows up. There boats of 15 m or more may not fish cod, you may have at most 80 cod nets and 5,000 hooks, and Danish seine is banned.', 'Høstingsforskriften kap. VI og vedlegg 4', 'https://lovdata.no/forskrift/2021-12-23-3910'],
      ['Grunnlinja og nautiske mil', 'The baseline and nautical miles', 'Grunnlinja er rette linjer mellom de ytterste skjærene. Avstander til havs måles fra den, i nautiske mil (1 nm = 1 852 m). Innenfor grunnlinja er indre farvann, og territorialgrensa går 12 nm ut.', 'The baseline is straight lines between the outermost skerries. Distances at sea are measured from it, in nautical miles (1 nm = 1,852 m). Inside it are inner waters, and the territorial limit is 12 nm out.', 'Kartverket, Norges maritime grenser', 'https://kartkatalog.geonorge.no/metadata/e106adf4-c9d8-4fce-a9b5-7886a4126d23'],
      ['Båtlengde og kysttorsk', 'Boat length and coastal cod', 'Jo større båt, jo lenger ut: 21–27,99 m kan ikke fiske torsk, hyse og sei innenfor grunnlinja, og 28 m og over ikke innenfor 4 nm, nord for 62° N. I Vestfjorden og sør for den, og i Finnmark deler av året, er det unntak.', 'The bigger the boat, the further out: 21–27.99 m may not fish cod, haddock and saithe inside the baseline, and 28 m and over not within 4 nm, north of 62° N. In and south of Vestfjorden, and in Finnmark part of the year, there are exceptions.', 'J-161-2026 § 32', 'https://www.fiskeridir.no/yrkesfiske/j-meldinger/j-161-2026'],
      ['Minstemål', 'Minimum sizes', 'Fisk under minstemålet skal ikke fiskes, og velger du feltet godt, får du lite av den. Torsk nord for 62° N: 44 cm, men 55 cm innenfor 4 nm. Hyse 40 cm, sei 45 cm, kveite 84 cm, taskekrabbe 13 cm (11 cm sør for Rogaland).', 'Fish under the minimum size must not be caught, and choosing your ground well keeps it few. Cod north of 62° N: 44 cm, but 55 cm within 4 nm. Haddock 40 cm, saithe 45 cm, halibut 84 cm, brown crab 13 cm (11 cm south of Rogaland).', 'Høstingsforskriften § 47', 'https://lovdata.no/forskrift/2021-12-23-3910'],
      ['Fredningstider', 'Closed seasons', 'Kveita er fredet nord for 62° N fra 20. desember til 20. april, og sør for 62° N hele året. Uer kan nord for 62° N bare fiskes med juksa fra båt under 15 m, fra 1. juni til 31. august.', 'Halibut is protected north of 62° N from 20 December to 20 April, and south of 62° N all year. North of 62° N redfish may only be fished by jig from a boat under 15 m, 1 June to 31 August.', 'Høstingsforskriften § 39', 'https://lovdata.no/forskrift/2021-12-23-3910'],
      ['Stengte felt', 'Closed fields', 'Fiskeridirektoratet stenger felt der det er mye småfisk, ofte for ett redskap om gangen. Det kunngjøres i J-meldinger. Sjekk før du setter redskap.', 'The Directorate of Fisheries closes grounds with much small fish, often for one gear at a time. It is announced in J-messages. Check before you set gear.', 'J-meldinger', 'https://www.fiskeridir.no/yrkesfiske/j-meldinger'],
      ['Lofoten og Henningsvær', 'Lofoten and Henningsvær', 'Henningsværboksen er stengt 1.1–30.6 for båter over 11 m. I de fleksible felleshavene i Lofotfisket skal faste redskap være om bord fra kl. 10 til 17, så alle får plass.', 'The Henningsvær box is closed 1.1–30.6 for boats over 11 m. In the flexible common grounds of the Lofoten fishery fixed gear must be aboard from 10:00 to 17:00, so everyone has room.', 'J-161-2026 § 32 og J-236-2025', 'https://www.fiskeridir.no/yrkesfiske/j-meldinger/j-161-2026'],
      ['Sør for 62° N', 'South of 62° N', 'I gytefeltene for kysttorsk i sør er alt fiske forbudt 1.1–30.4. I Oslofjorden er det forbudt å fiske torsk hele året, og bare håndsnøre og stang er lov for fisk.', 'In the coastal cod spawning areas in the south all fishing is banned 1.1–30.4. In the Oslo fjord fishing cod is banned all year, and only hand line and rod are allowed for fish.', 'Forskrift om fredningsområder for kysttorsk og Oslofjordforskriften', 'https://www.fiskeridir.no/fritidsfiske/artar/vern-av-kysttorsk-i-soer']];
    return T.map(([hn, he, tn, te, ref, url]) => '<div class="ph-card"><h4>' + L(hn, he) + '</h4><p>' + L(tn, te) + '</p><p class="ph-note">' + ref + ' · <a href="' + url + '" target="_blank" rel="noopener">' + L('kilde', 'source') + '</a></p></div>').join(''); }
  function regler(){ const t = ['her', 'sjekk', 'laer'].includes(sub.regler) ? sub.regler : 'her';
    const top = subs('regler', [['her', 'Her og nå', 'Here and now'], ['sjekk', 'Sjekk', 'Check'], ['laer', 'Lær mer', 'Learn']]);
    return top + '<div class="ph-c">' + (t === 'her' ? ruHere() : t === 'sjekk' ? ruCheck() : ruLearn()) + '</div>'; }
  // the Kvote app: your quotas, the open group's season, the stocks, and the market for rights (core/03d-quota.js)
  function kvote(){ const t = ['mine', 'open', 'stock', 'mkt'].includes(sub.kvote) ? sub.kvote : 'mine', H = S.t / 60;
    const top = subs('kvote', [['mine', 'Mine kvoter', 'My quotas'], ['open', 'Åpen gruppe', 'Open group'], ['stock', 'Bestand', 'Stock'], ['mkt', 'Marked', 'Market']]);
    if (t === 'mine') return top + salg('kvote');
    return top + '<div class="ph-c">' + (t === 'open' ? kvOpen(H) : t === 'stock' ? kvStock(H) : kvMkt(H)) + '</div>'; }
  const MNS = () => S.lang === 'no' ? ['januar','februar','mars','april','mai','juni','juli','august','september','oktober','november','desember'] : ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const doyStr = (y, d) => { const t = new Date(Date.UTC(y, 0, 1 + d)); return t.getUTCDate() + (S.lang === 'no' ? '. ' : ' ') + MNS()[t.getUTCMonth()]; };
  function kvOpen(H){
    const y = yearH(H), d = doyH(H), Y = qyAt(H), O = yearQuota(y).open, got = Y.c + Y.me, h = [], add = openMaxAdd(H);
    const st = Y.stop != null && d >= Y.stop ? L('Stoppet ' + doyStr(y, Y.stop) + '. Bare de garanterte kvotene gjelder.', 'Stopped on ' + doyStr(y, Y.stop) + '. Only the guaranteed quotas apply.')
      : Y.stop != null ? L('Stopp varslet til ' + doyStr(y, Y.stop) + '.', 'Stop announced for ' + doyStr(y, Y.stop) + '.')
      : Y.free != null ? L('Fritt fiske siden ' + doyStr(y, Y.free) + '.', 'Free fishing since ' + doyStr(y, Y.free) + '.') : L('Fisket på maksimalkvotene er åpent.', 'Fishing on the maximum quotas is open.');
    h.push('<div class="ph-card"><h4>' + L('Åpen gruppe ', 'Open group ') + y + '</h4>' + kv(L('Gruppekvote, torsk', 'Group quota, cod'), fmt(O.Q, 0) + ' t') + kv(L('Herav til ferskfiskordningen', 'Of which for the fresh-fish scheme'), fmt(O.ff, 0) + ' t') +
      kv(L('Fisket så langt', 'Fished so far'), fmt(got, 0) + ' t · ' + Math.round(got / Math.max(1, O.Q - O.ff) * 100) + ' %') + '<div class="qbar"><i style="width:' + Math.min(100, got / Math.max(1, O.Q - O.ff) * 100).toFixed(1) + '%"></i></div>' +
      kv(L('Båter som fisker', 'Boats fishing'), L('ca. ', 'about ') + fmt(Math.round(Y.n / 50) * 50, 0)) + kv(L('Du har landet', 'You have landed'), fmt(Y.me, 2) + ' t') + '<p class="ph-note">' + st + '</p></div>');
    h.push('<div class="ph-card"><h4>' + L('Kvoter per båt, torsk', 'Quotas a boat, cod') + '</h4><table class="ph-tbl"><tr><th>' + L('Lengde', 'Length') + '</th><th class="n">' + L('Maks', 'Max') + '</th><th class="n">' + L('Garantert', 'Guaranteed') + '</th></tr>' +
      [L('under 8 m', 'under 8 m'), '8–9,99 m', L('10 m og over', '10 m and over')].map((n, i) => '<tr><td>' + n + '</td><td class="n">' + (isFinite(add) ? fmt(O.max[i] + add, 1) + ' t' : L('fritt', 'free')) + '</td><td class="n">' + fmt(O.guar[i], 1) + ' t</td></tr>').join('') + '</table>' +
      (Y.log.filter(e => e[1] === 'raise').length ? '<p class="ph-note">' + Y.log.filter(e => e[1] === 'raise').map(e => L('Økt med ' + fmt(e[2], 1) + ' t ' + doyStr(y, e[0]) + '.', 'Raised by ' + fmt(e[2], 1) + ' t on ' + doyStr(y, e[0]) + '.')).join(' ') + '</p>' : '') + '</div>');
    const ff = ffPlan(y).filter(e => e[0] <= d), pct = ffPct(H);
    h.push('<div class="ph-card"><h4>' + L('Ferskfiskordningen ', 'Fresh-fish scheme ') + y + '</h4>' + kv(L('Tillegg nå', 'Allowance now'), pct ? Math.round(pct * 100) + ' %' : L('ikke i gang', 'not running')) +
      ff.map(([d0, p]) => kv(doyStr(y, d0), p ? Math.round(p * 100) + ' %' : L('stoppet', 'stopped'))).join('') + '</div>');
    h.push('<p class="ph-note">' + L('Rundt 2 100 båter deler gruppekvoten i åpen gruppe. Når den er beregnet oppfisket, stopper Fiskeridirektoratet fisket på maksimalkvotene med en ukes varsel i Kystposten. Blir mye stående igjen, økes maksimalkvotene, og om høsten kan det bli fritt fiske. Fangsten din teller med.', 'About 2,100 boats share the open group\'s quota. When it is estimated fished, the Directorate stops fishing on the maximum quotas with a week\'s notice in the Coast Post. If much is left, the maximum quotas are raised, and in the autumn fishing can be made free. Your catch counts.') + '</p>');
    return h.join('');
  }
  function kvStock(H){
    const y = yearH(H), d = doyH(H), h = [], NM = {torsk:L('Skrei (nordøstarktisk torsk)', 'Skrei (Northeast Arctic cod)'), hyse:L('Hyse', 'Haddock'), sei:L('Sei nord for 62° N', 'Saithe north of 62° N')};
    for (const sp of ['torsk', 'hyse', 'sei']){ const P = STOCK[sp], yrs = []; for (let k = Math.max(2014, y - 12); k <= y; k++) yrs.push(k);
      const rows = yrs.map(k => ({y:k, ...stockYear(sp, k), ssb:k <= 2026 && !P.ssb[k] ? null : stockYear(sp, k).ssb}));
      const nx = stockYear(sp, y + 1), advOut = d >= doyOf(y, 6, 26), tacOut = d >= doyOf(y, 10, 17);
      const mx = Math.max(...rows.map(r => Math.max(r.ssb || 0, r.tac)), P.Bpa) * 1.1, W = 300, Hh = 110, bx = i => 20 + i * (W - 30) / rows.length, sy = v => Hh - 14 - v / mx * (Hh - 24);
      let g = '<svg viewBox="0 0 ' + W + ' ' + Hh + '" width="100%" style="display:block">';
      rows.forEach((r, i) => { g += '<rect x="' + (bx(i) + 2) + '" y="' + sy(r.tac) + '" width="' + ((W - 30) / rows.length - 4) + '" height="' + (Hh - 14 - sy(r.tac)) + '" fill="#9aa7b4" opacity="0.6"/>'; if (i % 2 === 0 || i === rows.length - 1) g += '<text x="' + (bx(i) + 2) + '" y="' + (Hh - 2) + '" font-size="8" fill="#789">' + String(r.y).slice(2) + '</text>'; });
      const pts = rows.map((r, i) => r.ssb ? (bx(i) + (W - 30) / rows.length / 2) + ',' + sy(r.ssb) : null).filter(Boolean);
      if (pts.length > 1) g += '<polyline points="' + pts.join(' ') + '" fill="none" stroke="#2f7fd0" stroke-width="2"/>';
      g += '<line x1="20" x2="' + (W - 10) + '" y1="' + sy(P.Bpa) + '" y2="' + sy(P.Bpa) + '" stroke="#c9a227" stroke-dasharray="4 3"/><line x1="20" x2="' + (W - 10) + '" y1="' + sy(P.Blim) + '" y2="' + sy(P.Blim) + '" stroke="#b8402f" stroke-dasharray="4 3"/></svg>';
      const last = rows[rows.length - 1];
      h.push('<div class="ph-card"><h4>' + NM[sp] + '</h4>' + g + '<p class="ph-note">' + L('Blå linje: gytebestand. Grå søyler: totalkvote. Gul strek: B<sub>pa</sub>, rød strek: B<sub>lim</sub>.', 'Blue line: spawning stock. Grey bars: total quota. Yellow: B<sub>pa</sub>, red: B<sub>lim</sub>.') + '</p>' +
        (last.ssb ? kv(L('Gytebestand ', 'Spawning stock ') + y, fmt(last.ssb, 0) + ' t') : '') + kv(L('Totalkvote ', 'Total quota ') + y, fmt(last.tac, 0) + ' t') +
        (advOut ? kv(L('Kvoteråd ', 'Advice ') + (y + 1), fmt(nx.adv, 0) + ' t') : '') + (tacOut ? kv(L('Totalkvote ', 'Total quota ') + (y + 1), fmt(nx.tac, 0) + ' t') : '') + '</div>'); }
    h.push('<p class="ph-note">' + L('Historikken er fra Havforskningsinstituttet (kvoteråd, juni 2026). Fra 2027 regner spillet med en enkel bestandsmodell: årsklassene varierer, og fiske over rådet holder bestanden nede. Kvoterådet kommer i juni, totalkvoten i oktober og reguleringen i desember. Kvotene i Norge følger totalkvoten.', 'The history is from the Institute of Marine Research (advice, June 2026). From 2027 the game uses a simple stock model: year classes vary, and fishing above the advice holds the stock back. The advice comes in June, the total quota in October and the regulation in December. Norway\'s quotas follow the total quota.') + '</p>');
    return h.join('');
  }
  function kvMkt(H){
    const y = yearH(H), R = npcReg(), h = [], lic = S.lic, NO = {u7:'under 7 m', h7:'7–7,9 m', h8:'8–8,9 m', h9:'9–9,9 m', h10:'10–10,9 m', h14:'14–14,9 m', h20:'20–20,9 m'};
    h.push('<div class="ph-card"><h4>' + L('Deltakeradganger i lukket gruppe', 'Participation rights in the closed group') + '</h4><table class="ph-tbl"><tr><th>' + L('Hjemmel', 'Quota length') + '</th><th class="n">' + L('Eiere', 'Owners') + '</th><th class="n">' + L('Til salgs', 'For sale') + '</th></tr>' +
      Object.keys(REGN).map(id => { const sl = regSeller(id, H); return '<tr><td>' + NO[id] + '</td><td class="n">' + fmt(R[id] || 0, 0) + '</td><td class="n">' + ((R[id] || 0) > 0 ? sl.name.split(' ')[0] + ', ' + sl.home : '–') + '</td></tr>'; }).join('') + '</table>' +
      '<p class="ph-note">' + L('Antallet hjemler er fast. Du kommer inn ved å kjøpe av en som går ut, så for hver hjemmel du kjøper, er det én eier mindre. Kjøp under Båthandel → Med hjemmel.', 'The number of rights is fixed. You get in by buying from someone who leaves, so for every right you buy there is one owner fewer. Buy under Boat market → With a right.') + '</p></div>');
    const A = lic && HJ[lic.id];
    if (A && A.grp !== 'u11'){ const own = A.kf, tot = own + (lic.extra || 0), cap = STRUCT.cap[A.grp], same = Object.keys(HJ).filter(id => HJ[id].grp === A.grp && (R[id] || 0) > 0);
      h.push('<div class="ph-card"><h4>' + L('Strukturkvote', 'Structure quota') + '</h4>' + kv(L('Kvotefaktor, egen', 'Quota factor, own'), fmt(own, 4)) + kv(L('Med struktur', 'With structure'), fmt(tot, 4) + ' · ' + L('tak ', 'cap ') + cap + '×') +
        (lic.st || []).map(s => kv(L('Struktur fra ', 'Structured from ') + NO[s.id], fmt(s.kf, 4) + ' · ' + L('til ', 'until ') + s.until)).join('') +
        same.map(id => { const ok = structRoom(lic, id), pr = structPrice(id, H); return '<button class="ph-btn" data-pa="struct" data-id="' + id + '"' + (ok ? '' : ' disabled') + '>' + L('Kjøp og strukturer hjemmel ', 'Buy and structure a right of ') + NO[id] + ' · ' + kr(pr) + '</button>'; }).join('') +
        '<p class="ph-note">' + L('Du kjøper en båt i samme gruppe, hogger den og får kvotefaktoren minus 10 %. Strukturkvoten varer i 20 år. Kvotetaket er ' + cap + ' ganger egen kvote.', 'You buy a boat in the same group, scrap it and get its quota factor less 10 %. The structure quota lasts 20 years. The cap is ' + cap + ' times your own quota.') + '</p></div>'); }
    const u11 = S.fleet.filter(v => { const l = vget(v, 'lic'); return l && HJ[l.id] && HJ[l.id].grp === 'u11'; });
    if (u11.length >= 2){ const [a, b] = u11, la = vget(a, 'lic'), lb = vget(b, 'lic'), ok = twoOK(la, lb, y);
      h.push('<div class="ph-card"><h4>' + L('Særlig kvoteordning (under 11 m)', 'Special scheme (under 11 m)') + '</h4><button class="ph-btn" data-pa="two" data-a="' + a.id + '" data-b="' + b.id + '"' + (ok ? '' : ' disabled') + '>' + L('Fisk kvoten til «' + vget(b, 'boatName') + '» med «' + vget(a, 'boatName') + '»', 'Fish the quota of «' + vget(b, 'boatName') + '» with «' + vget(a, 'boatName') + '»') + '</button>' +
        '<p class="ph-note">' + L('Begge båtene må ha vært dine siden i fjor. Den ene hjemmelen oppgis, og båten selges. Den andre båten fisker begge kvotene.', 'Both boats must have been yours since last year. One right is given up and that boat is sold. The other boat fishes both quotas.') + '</p></div>'); }
    if (A && A.grp === 'u11'){ const o = coopOffer(H), ok = coopOK(lic, y) && S.crew.length + 1 < BOAT.crewMax && inPort(), c = lic.coop && lic.coop.y === y ? lic.coop : null;
      h.push('<div class="ph-card"><h4>' + L('Kvotesamarbeid (§ 31)', 'Quota cooperation (§ 31)') + '</h4>' + (c ? kv(L('Samarbeid med', 'Cooperating with'), c.name + ' · ' + NO[c.id]) + kv(L('Hans andel', 'His share'), Math.round(COOP.share * 100) + ' %')
        : kv(L('Tilbud', 'Offer'), o.name + ', ' + o.home + ' · ' + NO[o.id]) + '<button class="ph-btn" data-pa="coop"' + (ok ? '' : ' disabled') + '>' + L('Inngå kvotesamarbeid', 'Enter a quota cooperation') + '</button>') +
        '<p class="ph-note">' + L('To båter under 11 m med ulike eiere. Begge eierne må være om bord, så han mønstrer på hos deg. Hans båt ligger til kai resten av året, og han får halvparten av verdien av det som landes på hans kvote. Du må ha hatt hjemmelen siden i fjor.', 'Two boats under 11 m with different owners. Both owners must be aboard, so he signs on with you. His boat lies still for the rest of the year, and he gets half the value of what is landed on his quota. You must have had the right since last year.') + '</p></div>'); }
    return h.join('');
  }
  // the rig: one kind of fishing at a time, changed here in port when the gear is out of the sea
  function rigg(){
    const cur = rigOf(), h = ['<div class="ph-c"><p class="ph-note">' + L('Båten er rigget for én type fiske om gangen. Første gang en haler monteres, er det en jobb på verftet (Oppgrader). Har du utstyret, bytter du rigg her gratis og med en gang.', 'The boat is rigged for one kind of fishing at a time. Fitting a hauler the first time is a yard job (Upgrade). Once the gear is aboard, you change the rig here, free and at once.') + '</p>'];
    const need = {juksa:L('Håndjuksa eller juksamaskin.', 'A hand jig or jigging reels.'), line:L('Linehaler eller elektrisk haler.', 'A line hauler or an electric hauler.'), garn:L('Garnhaler.', 'A net hauler.'), teiner:L('Teinehaler eller elektrisk haler.', 'A pot hauler or an electric hauler.')};
    for (const r of Object.keys(RIGS)){
      const why = r === cur ? null : rigBlock(r);
      h.push('<div class="ph-card rig' + (r === cur ? ' on' : '') + '"><h4>' + L(RIGS[r].no, RIGS[r].en) + (r === cur ? ' · <span class="r0">' + L('rigget nå', 'rigged now') + '</span>' : '') + '</h4>' + kv(L('Krever', 'Needs'), need[r]) +
        (r === cur ? '' : why ? '<p class="ph-note">' + why[0] + '</p>' : '<button class="ph-btn p" data-pa="rig" data-r="' + r + '">' + L('Rigg om (gratis)', 'Re-rig (free)') + '</button>') + '</div>');
    }
    return h.join('') + '</div>';
  }
  // what the boat has: gear aboard and in the sea, the hold, and the boat herself
  function beholdning(){
    const tab = sub.beholdning || 'gear', head = subs('beholdning', [['gear', 'Redskap', 'Gear'], ['last', 'Lasterom', 'Hold'], ['boat', 'Båten', 'The boat']]);
    if (tab === 'last') return head + last();
    if (tab === 'boat') return head + fartoy('min');
    return head + (S.pgear ? redskap('bord') + redskap('sjo') : '');
  }
  function logg(){ return '<div class="ph-panel">' + panelLog() + '</div>'; }
  function innst(){
    const chk = (id, on) => '<input type="checkbox" id="' + id + '"' + (on ? ' checked' : '') + '>';
    // the 3D view's quality (view3d.js QUAL): automatic steps down when the frames get slow, and back up when there is room
    const q3 = S.settings.q3d || 'auto', ql = [['auto', L('Auto', 'Auto')], ['low', L('Lav', 'Low')], ['mid', L('Middels', 'Medium')], ['high', L('Høy', 'High')]], now = typeof G3 !== 'undefined' && G3.quality ? G3.quality() : null;
    return '<div class="ph-c"><div class="ph-card ph-set"><h4>' + L('Spill', 'Game') + '</h4><label>' + L('Språk', 'Language') + '<button class="ph-btn alt" data-pa="lang" style="margin:0">' + (S.lang === 'no' ? 'English' : 'Norsk') + '</button></label></div>' +
      '<div class="ph-card"><h4>' + L('Grafikk i 3D', '3D graphics') + '</h4><div class="ph-sub">' + ql.map(([v, l]) => '<button class="' + (q3 === v ? 'on' : '') + '" data-pa="q3d" data-v="' + v + '">' + l + '</button>').join('') + '</div><p class="ph-note">' +
      L('Lav tegner med færre piksler, kortere detaljer rundt båten, uten skygger og sjørokk. Auto går ned et nivå når bildene kommer for sjelden, og opp igjen når det er god margin.', 'Low draws fewer pixels and less detail round the boat, without shadows and spray. Auto steps down a level when the frames come too slowly, and back up when there is room.') +
      (now ? ' ' + L('Nå: ', 'Now: ') + ['Lav', 'Middels', 'Høy'][now.lvl] + (now.fps ? ' · ' + Math.round(now.fps) + ' bilder/s' : '') : '') + '</p>' +
      // the frame rate in a corner of the 3D view, to measure on the tablet (#fps in the address does not reach the artifact's page)
      '<div class="ph-sub"><button class="' + (S.settings.fpsShow ? 'on' : '') + '" data-pa="fpsShow" data-v="1">' + L('Vis bildetakt', 'Show frame rate') + '</button><button class="' + (S.settings.fpsShow ? '' : 'on') + '" data-pa="fpsShow" data-v="0">' + L('Skjul', 'Hide') + '</button></div></div>' +
      // the sound (ui/10e-sound.js): off, or a volume
      '<div class="ph-card"><h4>' + L('Lyd', 'Sound') + '</h4><div class="ph-sub">' + [[0, L('Av', 'Off')], [0.25, '25 %'], [0.5, '50 %'], [0.75, '75 %'], [1, '100 %']].map(([v, l]) => { const cur = S.settings.sound === false ? 0 : (S.settings.vol == null ? 0.6 : S.settings.vol); return '<button class="' + (Math.abs(cur - v) < 0.13 ? 'on' : '') + '" data-pa="snd" data-v="' + v + '">' + l + '</button>'; }).join('') + '</div><p class="ph-note">' +
      L('Motor, sjø, vind og regn, måker, og arbeidet i havna og om bord. Lyden starter når du trykker på skjermen.', 'Engine, sea, wind and rain, gulls, and the work in the harbour and aboard. The sound starts when you touch the screen.') + '</p></div>' +
      // the hand on the helm: a throttle and a joystick in 3D (core/16-helm.js, ui/10d-helm.js)
      '<div class="ph-card"><h4>' + L('Manuell styring', 'Manual steering') + '</h4><div class="ph-sub"><button class="' + (S.settings.manual ? 'on' : '') + '" data-pa="manual" data-v="1">' + L('På', 'On') + '</button><button class="' + (S.settings.manual ? '' : 'on') + '" data-pa="manual" data-v="0">' + L('Av', 'Off') + '</button></div><p class="ph-note">' +
      L('Gass til høyre (fram, nøytral, bak; den blir stående der du slipper) og ratt til venstre (det går tilbake til midten) i 3D. Rører du dem på sjøen, tar du roret fra ruta eller Autonav. «Fortøy» kommer når du er sakte ved en kai, og «Kast loss» når du ligger fortøyd.', 'Throttle on the right (ahead, neutral, astern; it stays where you leave it) and wheel on the left (it springs back) in 3D. Touching them at sea takes the helm from the route or Autonav. «Moor» shows when you are slow at a quay, and «Cast off» when you lie moored.') + '</p></div>' +
      '<div class="ph-card ph-set"><h4>' + L('Sikkerhet', 'Safety') + '</h4><label>' + t('auto') + chk('setAuto', S.settings.autoOn) + '</label><label><span>' + L('Snu ved', 'Turn back at') + ' <output id="autoWOut">' + S.settings.autoW + ' m/s</output></span><input type="range" min="6" max="20" step="1" value="' + S.settings.autoW + '" id="autoW"' + (S.settings.autoOn ? '' : ' disabled') + '></label><p class="ph-note">' + t('auto_n') + '</p></div>' +
      // the saved game as a code, to take it between the artifact and the app on the home screen (they keep their own storage)
      '<div class="ph-card"><h4>' + L('Lagret spill', 'Saved game') + '</h4><p class="ph-note">' + L('Artifacten og appen på hjemskjermen har hver sin lagring. Kopier koden her og lim den inn der for å ta med spillet.', 'The artifact and the app on the home screen keep their own saves. Copy the code here and paste it there to take the game along.') + '</p>' +
      '<button class="ph-btn alt" data-pa="saveOut">' + L('Kopier lagringen', 'Copy the save') + '</button><button class="ph-btn alt" data-pa="saveIn">' + L('Lim inn lagring', 'Paste a save') + '</button>' +
      (saveBox ? '<textarea id="saveCode" rows="4" style="width:100%;margin-top:8px;font:11px ui-monospace,monospace"' + (saveBox.mode === 'out' ? ' readonly' : ' placeholder="KYST2:…"') + '>' + (saveBox.text || '') + '</textarea>' +
        (saveBox.mode === 'in' ? '<button class="ph-btn" data-pa="saveLoad">' + L('Last inn dette spillet', 'Load this game') + '</button><p class="ph-note">' + L('Spillet her blir erstattet.', 'The game here is replaced.') + '</p>' : '<p class="ph-note">' + L('Koden er kopiert om nettleseren tillot det. Ellers marker og kopier den selv.', 'The code is copied if the browser allowed it. Otherwise select and copy it yourself.') + '</p>') : '') + '</div>' +
      '<div class="ph-card"><button class="ph-btn red" data-act="reset">' + t('reset') + '</button></div></div>';
  }
  // tools for testing while the game is built (02.10.2026): the clock's pace, a pause, and money in one tap. Not for players: in the
  // shared world everyone has the same clock (OVERLEVERING, «Felles verden og tid»), so the app goes before the game opens.
  function admin(){
    const pace = [[0, L('Pause', 'Pause')], [1, '6×'], [30, fmt(GAME_RATE * 30) + '×'], [300, fmt(GAME_RATE * 300) + '×'], [1800, fmt(GAME_RATE * 1800) + '×']];
    const day = S.mult ? 1440 / (GAME_RATE * S.mult) : 0, dur = day >= 60 ? fmt(day / 60, 1) + ' t' : day >= 1 ? fmt(day) + ' min' : fmt(day * 60) + ' s';
    return '<div class="ph-c"><div class="ph-card"><h4>' + L('Tidsskala', 'Time scale') + '</h4><div class="ph-sub">' + pace.map(([v, l]) => '<button class="' + (S.mult === v ? 'on' : '') + '" data-pa="admPace" data-v="' + v + '">' + l + '</button>').join('') + '</div>' +
      '<p class="ph-note">' + (S.mult ? L('Klokka går ' + fmt(GAME_RATE * S.mult) + ' ganger fortere enn ekte tid, så et døgn i spillet tar ' + dur + '.', 'The clock runs ' + fmt(GAME_RATE * S.mult) + ' times real time, so a day in the game takes ' + dur + '.') : L('Tida står stille.', 'Time stands still.')) + '</p></div>' +
      '<div class="ph-card"><h4>' + L('Penger', 'Money') + '</h4>' + kv(L('Kasse', 'Cash'), kr(S.cash)) + '<button class="ph-btn" data-pa="admCash">+ 100 000 kr</button></div>' +
      // a full tank anywhere, for trips along the coast before there are fuel quays outside Senja (the user's wish 03.10.2026)
      '<div class="ph-card"><h4>' + L('Drivstoff', 'Fuel') + '</h4>' + kv(L('Tanken', 'Tank'), fmt(S.boat.fuel) + ' / ' + fmt(BOAT.fuelCap) + ' L') + '<button class="ph-btn" data-pa="admFuel">' + L('Fyll tanken', 'Fill the tank') + '</button></div>' +
      // your own energy off, so you never tire or fall asleep while testing (the user's wish 03.10.2026)
      '<div class="ph-card"><h4>' + L('Energi', 'Energy') + '</h4>' + kv(L('Din energi', 'Your energy'), energyOff() ? L('av', 'off') : asleep() ? L('sover', 'asleep') : fmt(S.energy == null ? 100 : S.energy) + ' %') + '<button class="ph-btn' + (energyOff() ? ' alt' : '') + '" data-pa="admEnergy">' + (energyOff() ? L('Skru på energi', 'Turn energy on') : L('Skru av energi', 'Turn energy off')) + '</button>' +
      '<p class="ph-note">' + L('Av: du blir aldri sliten og sovner ikke.', 'Off: you never tire and do not fall asleep.') + '</p></div>' +
      '<p class="ph-note">' + L('Verktøy for testing. Appen fjernes før spillet får felles klokke.', 'Tools for testing. The app goes before the game gets a shared clock.') + '</p></div>';
  }
  function show(on, a){ isOpen = on; if (a) app = a; if (on){ el.hidden = false; void el.offsetWidth; el.classList.remove('off'); render(); } else { el.classList.add('off'); setTimeout(() => { if (!isOpen) el.hidden = true; }, 300); } }
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
  const PAGES = () => ({vaer, post, salg, kvote, regler, redning, rederi, meld, haill, logg, sjomann, trim, patch, innst, admin,
    ordl, rigg, arbeid:() => WORK.page(), fiske, fartoy:() => fartoy('marked'), utstyr, redskap, mannskap, bors, bank, verksted, havn, last, lever, is:isApp, agn, oppdrag, beholdning});
  function shell(a){ const d = APPS.find(x => x[0] === a) || [a, a, a, '#28507f'], f = PAGES()[a]; return '<div class="ph-appv' + (a === 'post' ? ' ph-paper' : '') + '"><div class="ph-top" style="background:' + d[3] + '"><span class="ic">' + (IC[a] || '') + '</span>' + L(d[1], d[2]) + '</div>' + (SEL_APPS.includes(a) ? selRow() + withSel(f) : f()) + '</div>'; }
  // a page for the drawer, and an action tapped there: it runs as if that page were the open app, and says which page shows next
  function page(a){ const f = PAGES()[a]; return f ? (SEL_APPS.includes(a) ? selRow() + withSel(f) : f()) : ''; }
  function dact(cur, a, d){
    const keep = app; let done; app = cur;
    try { done = SEL_APPS.includes(app) && !NAV.has(a) ? withSel(() => act0(a, d)) : act0(a, d); } finally { cur = app; app = keep; }
    if (done){ save(); renderHud(); renderClock(); panelDirty = true; render(); }
    return cur;
  }
  // --- Trim: the speed boosts for the boat you are aboard (core BOOSTS; the user's list 04.10.2026: sold for real money in their own
  // app; a test without payment until the game has a server), diesel engines only
  function trim(){
    const b = S.boat, V = VESSELS[b.type], h = ['<div class="ph-c">'];
    h.push('<div class="ph-card"><h4>«' + S.boatName + '» · ' + V.name[S.lang] + '</h4>' + kv(L('Motor', 'Engine'), BOAT.hp + ' hk') + kv(L('Toppfart', 'Top speed'), fmt(BOAT.vmax, 1) + ' kn') + kv(L('Med lasten og skroget nå', 'With the load and hull now'), fmt(speedCap(0.3), 1) + ' kn') + '</div>');
    if (!canBoost(V)) h.push('<div class="ph-card"><p class="ph-note">' + L('Trim krever dieselmotor. Påhengsmotoren på denne båten har verken dieselpumpe, ladeluftkjøling eller turbo. Den største påhengsmotoren får du under Oppgrader på verftet.', 'Tuning needs a diesel engine. This boat\'s outboard has no injection pump, charge air cooling or turbo. The biggest outboard is under Upgrade at the yard.') + '</p></div>');
    else for (const [k, B] of Object.entries(BOOSTS)){ const have = b.boost && b.boost[k], P1 = powerX(Object.assign({}, b, {boost:Object.assign({}, b.boost, {[k]:true})})), v1 = V.vmax * speedOfPower(P1, V.planing);
      h.push('<div class="ph-card haillc"><h4>' + B[S.lang] + '</h4><p>' + L('+' + Math.round(B.p * 100) + ' % effekt og raskere akselerasjon.', '+' + Math.round(B.p * 100) + '% power and quicker acceleration.') + '</p>' + (have ? '<p><b>' + L('Montert', 'Fitted') + '</b></p>' : kv(L('Toppfart med denne', 'Top speed with it'), fmt(v1, 1) + ' kn') + kv(L('Pris', 'Price'), B.nok + ' kr') + '<button class="ph-btn p" data-pa="trimbuy" data-k="' + k + '">' + L('Kjøp (test, ingen betaling)', 'Buy (test, no payment)') + '</button>') + '</div>'); }
    h.push('<p class="ph-note">' + L('Trim selges bare for ekte penger og følger båten. Betaling kommer når spillet får egen server. Effektene er et forslag som justeres i spilltest.', 'Tuning is sold for real money only and stays with the boat. Payment comes when the game gets its own server. The effects are a proposal to be tuned in play tests.') + '</p></div>');
    return h.join('');
  }
  // --- the patch notes: what the latest updates brought, newest first; a new id at the top shows a badge until the app is opened
  const PATCH = [
    ['p12', '05.10.2026', 'Økonomien', 'The economy', [
      ['Sluttseddelen har de ekte trekkene fra Råfisklaget: lagsavgift, pensjonstrekk, produktavgift, forskningsavgift og ressursavgift, rundt 4 % til sammen. Lotten regnes av det som er igjen.', 'The landing note has the real deductions of the sales organisation: its levy, the pension, product, research and resource levies, about 4 % in all. The crew\'s share is reckoned on what is left.'],
      ['Papirer har ervervstillatelse for hver båt. Når salget passerer 50 000 kr på tolv måneder, blir fisket et enkeltpersonforetak med MVA, og MVA-en står på seddelen og går videre til staten.', 'Papers has the fishing permit for each boat. When the sales pass NOK 50,000 in twelve months, the fishing becomes a sole proprietorship with VAT, which stands on the note and goes on to the state.'],
      ['Mannskapet kan gå på hyre i stedet for lott: en fast dagslønn som betales hver natt, uansett fangst. Byttes på mannskapskortet i Rederi.', 'The crew can go on a wage instead of a share: a fixed day wage paid every night, whatever the catch. Switched on the crew card in Company.']]],
    ['p11', '05.10.2026', 'Havn og sjø', 'Harbour and sea', [
      ['Mottakene står på en fylling inn til land, og havna rundt er hevet over flo, så det er ikke lenger vann bak kaia.', 'The fish plants stand on a fill in to the shore, and the harbour round them is raised above high tide, so there is no more water behind the quay.'],
      ['Hekkbølgene blekner gradvis og er like lange på begge sider, og propellstrømmen viser bare skumboblene.', 'The stern waves fade out gradually and are as long on both sides, and the prop wash shows only its foam bubbles.'],
      ['Båten snurrer ikke lenger rundt før den kommer fram til et stopp i høy fart.', 'The boat no longer spins round before it reaches a stop at speed.'],
      ['Kino-visningen holder båten i bildet også i høy fart, og bytter opptak når land kommer imellom.', 'The cinema view keeps the boat in the picture at speed too, and changes shot when land comes between.'],
      ['Når 3D-visningen ikke kan starte, sier meldingen hva som stoppet den.', 'When the 3D view cannot start, the message tells what stopped it.'],
      ['Ved rattet står båten stille rundt deg; bare blikket dempes mot stamp og rull.', 'At the wheel the boat stands still round you; only your gaze is steadied against pitch and roll.']]],
    ['p10', '05.10.2026', 'Regler langs hele kysten', 'Rules along the whole coast', [
      ['Fjordlinjene for kysttorsk gjelder langs hele kysten, rett fra Fiskeridirektoratet, og vises i kartet.', 'The fjord lines for coastal cod hold along the whole coast, straight from the Directorate of Fisheries, and show on the chart.'],
      ['Båtlengden avgjør hvor du kan fiske torsk, hyse og sei: innenfor fjordlinjene fra 15 m, innenfor grunnlinja fra 21 m og innenfor 4 nm fra 28 m, med unntakene i forskriften.', 'The boat\'s length decides where you may fish cod, haddock and saithe: inside the fjord lines from 15 m, inside the baseline from 21 m and within 4 nm from 28 m, with the regulation\'s exceptions.'],
      ['Stengte felt, Henningsværboksen, Borgundfjorden, Oslofjorden og gytefeltene i sør gjelder også. Sluttseddelen får Fiskeridirektoratets lokasjon.', 'Closed fields, the Henningsvær box, Borgundfjorden, the Oslo fjord and the spawning areas in the south apply too. The landing note gets the Directorate\'s location.'],
      ['Ny app: Regler. «Kan jeg fiske her?» med alle arter og redskap, Sjekk for andre steder og måneder, og reglene forklart enkelt. Linja «Regler» i statusboksen åpner den.', 'New app: Rules. «Can I fish here?» with every species and gear, Check for other places and months, and the rules told plainly. The «Rules» line in the status box opens it.'],
      ['Kartplotteren har et regellag: rødt der din båt ikke kan fiske med redskapet sitt i dag, gult der det er grenser. Det slås av og på under innstillingene.', 'The chart plotter has a rule layer: red where your boat may not fish with her gear today, yellow where there are limits. It is switched on and off in the settings.']]],
    ['p9', '05.10.2026', 'Rettinger', 'Fixes', [
      ['Alene i båten sløyer skipperen selv, og den som haler, er skipperen når det er hans jobb, i stedet for en annen figur.', 'Alone in the boat the skipper guts the catch himself, and the one hauling is the skipper when it is his job, not another figure.']]],
    ['p8', '05.10.2026', 'Kvotesystemet', 'The quota system', [
      ['Kvotene følger forskriften fra 1. oktober 2026 (J-161-2026), og regnes ut år for år fra totalkvoten og bestanden.', 'The quotas follow the regulation from 1 October 2026 (J-161-2026), worked out year by year from the total quota and the stock.'],
      ['Rundt 2 100 båter fisker ned gruppekvoten i åpen gruppe. Stoppen kommer når kvoten er tatt, med en ukes varsel. Noen år blir det ingen stopp, og maksimalkvotene kan økes.', 'About 2,100 boats fish down the open group\'s quota. The stop comes when it is taken, with a week\'s notice. Some years there is no stop, and the maximum quotas may be raised.'],
      ['Ferskfisktillegget kan økes om høsten, som det ofte er i virkeligheten.', 'The fresh-fish allowance may be raised in the autumn, as it often is.'],
      ['Kvote-appen har fanene Åpen gruppe, Bestand og Marked: strukturkvote, særlig kvoteordning og kvotesamarbeid.', 'The Quota app has the tabs Open group, Stock and Market: structure quotas, the special scheme and quota cooperation.'],
      ['Kystbåtene på 15 og 21 m selges med hjemmel. Hver hjemmel du kjøper, kommer fra en NPC-eier som går ut.', 'The 15 m and 21 m coastal vessels are sold with a right. Every right you buy comes from an NPC owner who leaves.'],
      ['Kvoten følger deg når du bytter båt (§ 29), og hyse og sei i lukket gruppe har maksimalkvote og bifangstgrense.', 'Your quota follows you when you change boats (§ 29), and haddock and saithe in the closed group have a maximum quota and a bycatch limit.']]],
    ['p7', '05.10.2026', 'Fra forslagslista', 'From the wish list', [
      ['Båten snurrer ikke lenger rundt siste veipunkt. Den bremser inn og stopper der.', 'The boat no longer spins round the last waypoint. It slows down and stops there.'],
      ['Håndjuksa og juksamaskinene fisker dobbelt så mye som før.', 'The hand jig and the jigging reels catch twice as much as before.'],
      ['Stanga er borte. «Jukse selv»: når det napper, trykk «Rykk!» mens nåla er midt på. Midt på gir to fisk, bom gir halvparten.', 'The rod is gone. «Jig yourself»: when it bites, tap «Strike!» as the needle is in the middle. The middle gives two fish, a miss half.'],
      ['Nattmodus i kartplotteren: mørke farger etter sola, eller Dag/Natt under Innstillinger i kartet.', 'Night mode in the chart plotter: dark colours by the sun, or Day/Night under the chart\'s settings.'],
      ['Kikkert i bro-visningen: dra to fingre fra hverandre for opptil 8×. Dobbelttrykk går tilbake.', 'Binoculars in the bridge view: spread two fingers for up to 8×. A double tap goes back.'],
      ['Fiskemottakene har åpningstider: hverdager 06–18, lørdag 08–14, og 05–22 hver dag i skreisesongen. «Vent til åpning» spoler fram.', 'The fish plants have opening hours: weekdays 06–18, Saturday 08–14, and 05–22 every day in the skrei season. «Wait for opening» runs the clock on.'],
      ['Dieselprisen endrer seg hver uke og er litt ulik fra havn til havn. Se Vær-appen.', 'The diesel price changes every week and differs a little between ports. See the Weather app.'],
      ['Nye kartdata (kart-7): rundt 4 100 fiskebåter langs kysten, med felt minst 600 m fra land.', 'New map data (kart-7): about 4,100 fishing boats along the coast, with grounds at least 600 m from land.'],
      ['Ny haill: Haill gir +100 % i 48 t og blir så mellomhaill og gammelhaill. Luksushaill gir +200 % de første 48 t. Kveithaill er borte.', 'New luck: Luck gives +100% for 48 h, then middle and old luck. Luxury luck gives +200% for the first 48 h. The halibut luck is gone.'],
      ['Haill du kjøper eller vinner på puben, ligger i beholdningen til du trykker «Aktiver».', 'Luck you buy or win at the pub waits in store until you tap «Switch on».'],
      ['Verftet: større lasterom i tre trinn (+25 %, +60 %, dobbelt) og større motor i to trinn (+20 % og +40 % effekt).', 'The yard: a bigger hold in three steps (+25%, +60%, double) and a bigger engine in two (+20% and +40% power).'],
      ['Last og vekt koster fart og drivstoff, mest på planende båter.', 'Load and weight cost speed and fuel, most on planing boats.'],
      ['Skroget gror til (raskest om sommeren) og koster opptil 15 % fart. Skrogrens på slipp under Vedlikehold, og antigro-belegg under Oppgrader.', 'The hull fouls (fastest in summer) and costs up to 15% speed. Hull cleaning on the slip under Maintenance, and an antifouling coat under Upgrade.'],
      ['Ny app «Trim»: justert dieselpumpe, ladeluftkjøling og økt turbotrykk for båter med dieselmotor (test, ingen betaling ennå).', 'New app «Tuning»: a tuned injection pump, charge air cooling and higher boost pressure for diesel boats (test, no payment yet).'],
      ['Fem slag agn til line og teiner: reke (torsk og skrei), krabbe (billig, ok på alt), krill (uer), makrell (sei) og sei (kveite og krabbe). Egen sei og krabbe kan bli agn før levering.', 'Five kinds of bait for line and pots: shrimp (cod and skrei), crab (cheap, fair on everything), krill (redfish), mackerel (saithe) and saithe (halibut and crab). Own saithe and crab can be bait before landing.'],
      ['Båten finner veien inn til kaiplassen og ut igjen uten å gå gjennom land, brygger og kaier, og går baklengs ut fra kaia.', 'The boat finds its way in to the berth and out again without going through land, piers and quays, and backs out from the quay.'],
      ['Nye fiskemodeller fra Blender: torsk, sei, hyse, lyr, lange, brosme, uer, kveite og taskekrabbe, i baljen, på jukselina og på dekk.', 'New fish models from Blender: cod, saithe, haddock, pollack, ling, tusk, redfish, halibut and brown crab, in the tub, on the jig line and on deck.'],
      ['Redningsskøyta kommer ut fra stasjonen i 25 knop og sleper deg inn i 6 knop. Du kan spole fram til havn.', 'The rescue boat comes out from its station at 25 knots and tows you in at 6 knots. You can fast forward to harbour.'],
      ['Garn og line går ut over hekken når du setter, med dregg og blåsestake. Fisken kommer opp i maskene og på krokene når du trekker.', 'Nets and lines run out over the stern when you set, with the grapnel and the marker buoy. The fish come up in the meshes and on the hooks when you haul.'],
      ['Fly og helikoptre over kysten mellom flyplassene og basene, med lys om natta og lyd.', 'Planes and helicopters over the coast between the airports and the bases, with lights at night and sound.']]],
    ['p6', '04.10.2026', 'Færre fiskebåter, spredt utover', 'Fewer fishing boats, spread out', [
      ['Rundt 4 300 båter langs kysten i stedet for 19 000, omtrent som de 4 614 aktive fiskefartøyene i 2024.', 'About 4,300 boats along the coast instead of 19,000, close to the 4,614 active fishing vessels of 2024.'],
      ['Hver båt fisker på sin egen plass på feltet, og driften går aldri opp på land.', 'Each boat fishes its own spot on the ground, and the drift never goes ashore.'],
      ['Flere fridager, og avreisen spres over morgenen.', 'More days off, and the departures spread over the morning.'],
      ['Navnene i kartplotteren vises når du zoomer inn, uten å ligge oppå hverandre.', 'The names in the chart plotter show when you zoom in, without lying on top of each other.']]],
    ['p5', '04.10.2026', 'Fiskebåter langs hele kysten', 'Fishing boats along the whole coast', [
      ['Havnene langs kysten har sin egen flåte. Du ser båtene innenfor AIS-rekkevidden (15 km).', 'The harbours along the coast have their own fleet. You see the boats within AIS range (15 km).'],
      ['De ligger ved kai om natta og i dårlig vær, går ut på feltene om morgenen og kommer hjem på ettermiddagen.', 'They lie at the quay at night and in bad weather, go out to the grounds in the morning and come home in the afternoon.'],
      ['Hver båt ligger ved en kai som er lang og dyp nok for henne.', 'Each boat lies at a quay that is long and deep enough for her.'],
      ['Trykk på en båt i kartplotteren for AIS-kortet med størrelse, dypgående og spor.', 'Tap a boat in the chart plotter for the AIS card with size, draught and track.']]],
    ['p4', '04.10.2026', 'Hus, veier, bruer og moloer langs kysten', 'Houses, roads, bridges and breakwaters along the coast', [
      ['Bygninger, veier og bruer langs hele kysten, ikke bare på Senja.', 'Buildings, roads and bridges along the whole coast, not only on Senja.'],
      ['Bruene går jevnt opp og ned, og tunnelene tegnes ikke over fjellet.', 'The bridges rise and fall smoothly, and the tunnels are not drawn over the mountain.'],
      ['Moloene er bygd av stein, med vei på toppen.', 'The breakwaters are built of stone, with a road on top.'],
      ['Brygger og kaier med lengde og dybde. Kartplotteren viser veiene og bruene.', 'Piers and quays with length and depth. The chart plotter shows the roads and bridges.']]],
    ['p3', '03.10.2026', 'Appen på hjemskjermen', 'The app on the home screen', [
      ['Spillet kan legges på hjemskjermen fra GitHub Pages og virker uten nett når kartet er lastet.', 'The game can go on the home screen from GitHub Pages and works offline once the map is loaded.'],
      ['Flytt spillet mellom artifacten og appen med lagringskoden under Innstillinger → Lagret spill.', 'Move the game between the artifact and the app with the save code under Settings → Saved game.']]],
    ['p2', '03.10.2026', 'Lyd', 'Sound', [
      ['Motor, sjø, vind og regn, måker, havna og arbeidet om bord.', 'Engine, sea, wind and rain, gulls, the harbour and the work aboard.'],
      ['Lyden blir svakere og mattere langt unna, og kommer fra venstre eller høyre. De andre båtene har egen motorlyd.', 'Sounds get fainter and duller far away, and come from the left or the right. The other boats have their own engines.']]],
    ['p1', '03.10.2026', 'Om bord og på broa', 'Aboard and on the bridge', [
      ['Manuell styring med gass og ratt i 3D, «Kast loss» og «Fortøy».', 'Manual steering with throttle and wheel in 3D, «Cast off» and «Moor».'],
      ['Lys om natta: lyktene lyser opp rundt seg, og fyrene sveiper.', 'Lights at night: the lamps light up round them, and the lighthouses sweep.'],
      ['Kino-visning der kameraet filmer turen selv.', 'A cinema view where the camera films the trip by itself.'],
      ['Garnhaler og linehaler som drar redskapet opp over skiva, og måker som flakser.', 'Net and line haulers that pull the gear up over the roller, and gulls that flap.'],
      ['Søvn med «Spol fram til du våkner», og brovaktsalarm som piper til du kvitterer.', 'Sleep with «Fast forward until you wake», and a bridge watch alarm that beeps until you acknowledge.'],
      ['Admin: «Fyll tanken» og «Skru av energi» for lange turer og testing.', 'Admin: «Fill the tank» and «Turn off energy» for long trips and testing.']]],
    ['p0', '02.–03.10.2026', 'Hele kysten', 'The whole coast', [
      ['Du kan seile langs hele norskekysten, med Kartverkets dybde.', 'You can sail the whole Norwegian coast, with the Norwegian Mapping Authority\'s depths.'],
      ['Tidevann for stedet du er, og sol og måne der båten er.', 'The tide where you are, and the sun and moon where the boat is.'],
      ['Autonav over hele kysten, og en kartplotter uten mørke felt når du drar i kartet.', 'Autonav along the whole coast, and a chart plotter without dark patches when you drag the map.']]]];
  const patchNew = () => { const i = PATCH.findIndex(p => p[0] === S.settings.patchSeen); return i < 0 ? PATCH.length : i; };
  function patch(){
    const seen = S.settings.patchLast, h = ['<div class="ph-c">'];
    for (const [id, date, no, en, lines] of PATCH)
      h.push('<div class="ph-card patchc"><h4>' + L(no, en) + (seen && PATCH.findIndex(p => p[0] === id) < PATCH.findIndex(p => p[0] === seen) ? ' <span class="pnew">' + L('Ny', 'New') + '</span>' : '') + '</h4><p class="ph-note">' + date + '</p><ul>' + lines.map(l => '<li>' + L(l[0], l[1]) + '</li>').join('') + '</ul></div>');
    h.push('</div>');
    return h.join('');
  }
  function home(){
    const H = S.t / 60, W = windAt(H), n = unread(), na = alerts().length, np = patchNew();
    return '<div class="ph-homescr"><div class="ph-clock">' + hm(H) + '</div><div class="ph-date">' + dayStr(H) + '</div>' +
      '<div class="ph-widget"><span class="w1">' + dirName(windDir(H)) + ' ' + fmt(W, 0) + ' m/s · ' + fmt(Math.round(airTemp(H)) || 0, 0) + ' °C</span><span class="w2">' + kr(S.cash) + '</span></div>' +
      ((g => g ? '<button class="ph-goal" data-pa="open" data-a="fartoy"><span>' + L('Neste mål: ', 'Next goal: ') + '<b>' + g.n + '</b></span><small>' + (g.txt || kr(Math.min(Math.max(0, S.cash), g.need)) + ' / ' + kr(g.need)) + '</small><span class="gb"><i style="width:' + (g.pc * 100).toFixed(1) + '%"></i></span></button>' : '')(goals()[0])) +
      '<div class="ph-grid">' + APPS.map(a => '<button class="ph-app" data-pa="open" data-a="' + a[0] + '"><span class="ic" style="background:linear-gradient(160deg,' + a[3] + ',' + a[3] + 'cc)">' + IC[a[0]] + '</span>' + L(a[1], a[2]) + (a[0] === 'meld' && n ? '<span class="bd">' + n + '</span>' : '') + (a[0] === 'ordl' && ordState().active.length ? '<span class="bd">' + ordState().active.length + '</span>' : '') + (a[0] === 'rederi' && na ? '<span class="bd">' + na + '</span>' : '') + (a[0] === 'patch' && np ? '<span class="bd">' + np + '</span>' : '') + '</button>').join('') + '</div></div>';
  }
  const kv = (a, b) => '<div class="ph-kv"><span>' + a + '</span><span>' + b + '</span></div>';
  const tq = (kg, d) => isFinite(kg) ? fmt(kg / 1000, d) + ' t' : L('ingen grense', 'no limit');   // a quota in tonnes, or no limit
  const subs = (a, list) => '<div class="ph-sub">' + list.map(([k, no, en]) => '<button class="' + ((sub[a] || list[0][0]) === k ? 'on' : '') + '" data-pa="sub" data-s="' + k + '">' + L(no, en) + '</button>').join('') + '</div>';
  const inPort = () => S.boat.status === 'port';
  // --- the seaman's life: the tattoos you have earned, and the old ways at sea you have heard of
  function tattoos(){
    const got = S.tattoos || {}, c = tatCounts(), n = TATS.filter(T => got[T.id]).length;
    const lock = {}; for (const T of TATS) if (T.lock) lock[T.id] = 1;
    const h = ['<div class="ph-card"><h4>' + L('Tatoveringer', 'Tattoos') + '</h4><div class="ph-tatfig" role="img" aria-label="' + L('Sjømann med tatoveringer', 'Sailor with tattoos') + '">' + TATART.figure(got, lock) + '</div><p class="ph-note">' + L('Sjøfolkets gamle merker kommer av seg selv når du har gjort deg fortjent til dem. Du har ', 'The old marks of seafarers come by themselves when you have earned them. You have ') + n + L(' av ', ' of ') + TATS.length + '.</p></div>'];
    for (const T of TATS){
      const icon = TATART.icon(T.id, !!got[T.id]);
      let foot;
      if (got[T.id]) foot = L('Fått ', 'Earned ') + dayStr(got[T.id] / 60);
      else if (T.lock) foot = L(T.r[0], T.r[1]) + L(', kommer når spillet får nye farvann.', ', coming when the game reaches new waters.');
      else { const [have, need] = T.p(c); foot = L(T.r[0], T.r[1]) + ': ' + fmt(Math.min(have, need), 0) + ' / ' + fmt(need, 0) + '<div class="ph-bar"><i style="width:' + Math.round(clamp(have / need, 0, 1) * 100) + '%"></i></div>'; }
      h.push('<div class="ph-card"' + (T.lock && !got[T.id] ? ' style="opacity:.7"' : '') + '><div style="display:flex;gap:10px;align-items:center">' + icon + '<div><h4 style="margin:0">' + L(T.n[0], T.n[1]) + '</h4><p style="margin:2px 0">' + L(T.m[0], T.m[1]) + '</p></div></div><p class="ph-note">' + foot + '</p></div>');
    }
    return h.join('');
  }
  // the papers a fisher carries: shown, not checked by the game. The health declaration is made up (a fictional doctor); the names of
  // the certificates follow Sjøfartsdirektoratet, but which one a skipper under 15 m needs is not confirmed (OVERLEVERING kap. 10)
  function papers(){
    const t0 = S.log.length ? S.log[0].t : S.t, who = L('Skipper i ', 'Skipper of ') + (S.company || 'Senja Kystfiske'), no = k => String(1000 + Math.floor(h2(k, 517) * 9000)) + ' ' + String(100000 + Math.floor(h2(k, 518) * 900000));
    const until = t0 + 2 * 365 * 1440, ok = S.t < until, vhf = S.fleet.some(v => (vget(v, 'equip') || {}).vhf);
    const card = (col, title, rows, note) => '<div class="ph-card papc"><div class="pap-h" style="background:' + col + '">' + title + '</div>' + rows.map(([a, b]) => kv(a, b)).join('') + (note ? '<p class="ph-note">' + note + '</p>' : '') + '</div>';
    return '<p class="ph-note">' + L('Papirene du har med deg om bord.', 'The papers you carry aboard.') + '</p>' +
      card('#2f6fb3', L('Helseerklæring for arbeidstakere på skip', 'Health declaration for workers on ships'), [[L('Navn', 'Name'), who], [L('Utstedt', 'Issued'), bkDate(t0)], [L('Gyldig til', 'Valid until'), bkDate(until)], [L('Lege', 'Doctor'), L('Sjømannslege Ragnhild Strøm, Finnsnes', 'Seamen\'s doctor Ragnhild Strøm, Finnsnes')], ['Status', ok ? '<span class="r0">' + L('Gyldig', 'Valid') + '</span>' : '<span class="r2">' + L('Utløpt', 'Expired') + '</span>']],
        L('Fiktiv attest. Legen og nummeret finnes ikke.', 'A fictional certificate. The doctor and the number do not exist.')) +
      card('#1e8c6e', L('Sikkerhetsopplæring for sjøfolk på mindre skip', 'Safety training for seafarers on smaller ships'), [[L('Navn', 'Name'), who], [L('Kurs', 'Course'), L('35 timer, bestått', '35 hours, passed')], [L('Bevis nr.', 'Certificate no.'), no(1)], [L('Dato', 'Date'), bkDate(t0)]]) +
      card('#b0413e', L('Fiskeskipper klasse C', 'Fishing skipper class C'), [[L('Navn', 'Name'), who], [L('Gjelder', 'Covers'), L('fører av fiskefartøy under 15 m', 'master of fishing vessels under 15 m')], [L('Sertifikat nr.', 'Certificate no.'), no(2)]]) +
      (F => card('#7a5a2c', L('Fiskermanntallet, blad B', 'Fishermen\'s register, blad B'), [[L('Navn', 'Name'), who], [L('Landingsdager med deg om bord', 'Landing days with you aboard'), fmt(F.n, 0) + ' / ' + BLADB.days], [L('Førstehåndsverdi', 'First-hand value'), kr(F.kr) + ' / ' + kr(BLADB.kr) + ' (1 G)'],
        ['Status', F.b ? '<span class="r0">' + L('Ført på blad B', 'On blad B') + '</span>' : L('Blad A: fiske er ikke hovedyrket ennå', 'Blad A: fishing is not your main occupation yet')]],
        L('Forenklet. Deltakerloven § 6 krever at den som kjøper en båt i lukket gruppe, har fisket i minst tre av de siste fem årene, og blad B er det vanlige beviset. I spillet holder det med ' + BLADB.days + ' landingsdager med deg om bord og 1 G i førstehåndsverdi.', 'Simplified. Deltakerloven § 6 asks the buyer of a closed-group boat to have fished in at least three of the last five years, and blad B is the usual proof. In the game, ' + BLADB.days + ' landing days with you aboard and 1 G of first-hand value will do.')))(S.fm || {n:0, kr:0, b:false}) +
      // the permit to fish for each boat, and the business in the registers (03-simulation.js MVA)
      card('#33617a', L('Ervervstillatelse', 'Fishing permit'), S.fleet.map(v => [vget(v, 'boatName') || L('Båten', 'The boat'), L('Gitt', 'Granted') + ' · ' + String((VESSELS[vget(v, 'boat').type] || {}).len || '').replace('.', ',') + ' m']).concat([[L('Utstedt av', 'Issued by'), L('Fiskeridirektoratet', 'Directorate of Fisheries')]]),
        L('Deltakerloven § 4: en båt kan bare brukes i ervervsmessig fiske med ervervstillatelse for eieren. Under 15 m holder det at du er aktiv fisker (ervervstillatelsesforskriften § 2). I spillet gis den når du kjøper båten.', 'Deltakerloven § 4: a boat may be used in commercial fishing only with a permit for its owner. Under 15 m it is enough that you are an active fisher. In the game it comes with the boat.')) +
      (M => card('#6b5b95', L('Foretaket', 'The business'), M ? [[L('Form', 'Form'), L('Enkeltpersonforetak (ENK)', 'Sole proprietorship')], [L('Org.nr.', 'Org. no.'), String(M.org).replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3')], [L('MVA-registrert', 'VAT registered'), bkDate(M.t)], ['Status', '<span class="r0">' + L('Registrert', 'Registered') + '</span>']]
          : [[L('Salg siste tolv måneder', 'Sales in the last twelve months'), kr((S.sales || []).filter(s => s.t > S.t - 365 * 1440).reduce((a, s) => a + (s.total || 0), 0)) + ' / ' + kr(MVA.limit)], ['Status', L('Ikke registrert ennå', 'Not registered yet')]],
        L('Du trenger verken ENK eller AS for å fiske. Når salget passerer 50 000 kr på tolv måneder, må foretaket i Merverdiavgiftsregisteret (merverdiavgiftsloven § 2-1). Da legges MVA på 11,11 % på oppgjøret, og den går videre til staten. Org.nr. er fiktivt.', 'You need neither a sole proprietorship nor a company to fish. When the sales pass NOK 50,000 in twelve months, the business must enter the VAT register. Then 11.11 % VAT comes with the settlement and goes on to the state. The org. no. is fictional.')))(S.mva) +
      card('#5b6770', L('Begrenset radiosertifikat (SRC)', 'Short Range Certificate (SRC)'), [[L('Navn', 'Name'), who], ['Status', vhf ? '<span class="r0">' + L('Gyldig', 'Valid') + '</span>' : L('Ikke tatt, trengs for VHF om bord', 'Not taken, needed for VHF aboard')]]);
  }
  function sjomann(){
    const tab = sub.sjomann || 'tatover';
    if (tab === 'papir') return '<div class="ph-c">' + subs('sjomann', [['tatover', 'Tatoveringer', 'Tattoos'], ['overtro', 'Fra gamle dager', 'The old ways'], ['papir', 'Papirer', 'Papers']]) + papers() + '</div>';
    if (tab === 'tatover') return '<div class="ph-c">' + subs('sjomann', [['tatover', 'Tatoveringer', 'Tattoos'], ['overtro', 'Fra gamle dager', 'The old ways'], ['papir', 'Papirer', 'Papers']]) + tattoos() + '</div>';
    const heard = S.lore || {}, ids = Object.keys(LORE), n = ids.filter(id => heard[id]).length;
    const h = ['<div class="ph-c">' + subs('sjomann', [['tatover', 'Tatoveringer', 'Tattoos'], ['overtro', 'Fra gamle dager', 'The old ways'], ['papir', 'Papirer', 'Papers']]) + '<div class="ph-card"><h4>' + L('Fra gamle dager', 'The old ways') + '</h4><p class="ph-note">' + L('Sjøfolk og fiskere har alltid vært overtroiske. Det du hører om bord, på kaia og på puben, samles her. Du har hørt ', 'Seafarers and fishermen have always been superstitious. What you hear aboard, on the quay and at the pub is kept here. You have heard ') + n + L(' av ', ' of ') + ids.length + L(' fortellinger.', ' stories.') + '</p></div>'];
    for (const id of ids){ const E = LORE[id], w = heard[id];
      h.push(w ? '<div class="ph-card"><h4>' + L(E.t[0], E.t[1]) + '</h4><p>' + L(E.x[0], E.x[1]) + '</p><p class="ph-note">' + L('Hørt første gang ', 'First heard ') + dayStr(w.first / 60) + '</p></div>'
        : '<div class="ph-card" style="opacity:.55"><h4>?</h4><p class="ph-note">' + L('Ennå ikke hørt. Lytt til folk på sjøen og på puben.', 'Not heard yet. Listen to people at sea and at the pub.') + '</p></div>'); }
    return h.join('') + '</div>';
  }
  // --- weather
  function sunTimesOld(H){ const d0 = Math.floor(H / 24) * 24 - 6 + 24 * (gDate(H).getUTCHours() < 6 ? -0 : 0); let up = null, dn = null, prev = sunAt(d0).el; for (let m = 10; m <= 24 * 60; m += 10){ const e = sunAt(d0 + m / 60).el; if (prev < -0.8 && e >= -0.8 && up === null) up = d0 + m / 60; if (prev >= -0.8 && e < -0.8 && dn === null) dn = d0 + m / 60; prev = e; } return {up, dn, always:sunAt(d0 + 12).el > -0.8 && up === null, never:sunAt(d0 + 6).el < -0.8 && up === null}; }
  function vaer(){
    const b = S.boat, H = S.t / 60, W = windAt(H), hs = hsAt(b.pos, H), h = [], st = sunTimes(H), sq = seaHere(b.pos, H);
    const pr = precipAt(H), snow = airTemp(H) < 1, prs = pr < 0.08 ? t('p_none') : (pr < 0.4 ? t('p_light') + ' ' : pr > 0.75 ? t('p_heavy') + ' ' : '') + t(snow ? 'p_snow' : 'p_rain');
    h.push('<div class="ph-c"><div class="ph-card"><div class="ph-big">' + fmt(Math.round(airTemp(H)) || 0, 0) + ' °C · ' + dirName(windDir(H)) + ' ' + fmt(W, 0) + ' m/s</div><p>' + BFN[S.lang][beaufort(W)] + ', ' + prs + '. ' + BFS[S.lang][beaufort(W)] + '</p>' +
      kv(L('Bølger her', 'Waves here'), fmt(hs, 1) + ' m · ' + SEAN[S.lang][sq.code] + (sq.krapp ? L(', krapp', ', short and steep') : '')) + kv(L('Vindsjø', 'Wind sea'), fmt(sq.w, 1) + ' m' + (sq.w >= 0.1 ? L(' fra ', ' from ') + dirName(sq.dir) : '')) + kv(L('Dønning', 'Swell'), fmt(sq.sw, 1) + ' m' + (sq.sw >= 0.1 ? L(' fra ', ' from ') + dirName(sq.swDir) + ', ' + fmt(sq.swTp, 0) + ' s' : '')) + kv(L('Bølger på havet', 'Waves offshore'), fmt(hsOpen(H), 1) + ' m') + kv(L('Sikt', 'Visibility'), fmt(visibility(H), 0) + ' km') + kv(L('Sjøtemperatur', 'Sea temperature'), fmt(seasonal(SST, H), 1) + ' °C') +
      kv(L('Sol', 'Sun'), st.always ? L('Midnattssol', 'Midnight sun') : st.never ? L('Mørketid', 'Polar night') : (st.up ? hm(st.up) : '–') + ' – ' + (st.dn ? hm(st.dn) : '–')) + '</div>');
    { const ev = tideEvents(H, 30).slice(0, 5), mo = moonAt(H), th = tideH(H), pts = [];
      for (let k = 0; k <= 48; k++){ const v = tideH(H + k / 2); pts.push((k * 5).toFixed(1) + ',' + (30 - v * 11).toFixed(1)); }
      h.push('<div class="ph-card"><h4>' + L('Tidevann', 'Tide') + '</h4><svg viewBox="0 0 240 60" width="100%" height="60" style="display:block"><line x1="0" y1="30" x2="240" y2="30" stroke="#c9d5dc" stroke-dasharray="3 3"/><polyline points="' + pts.join(' ') + '" fill="none" stroke="#2f7fd0" stroke-width="2"/><circle cx="0" cy="' + (30 - th * 11).toFixed(1) + '" r="4" fill="#d6336c"/></svg>' +
        '<p class="ph-note">' + L('Nå ', 'Now ') + (th >= 0 ? '+' : '') + fmt(th, 2) + ' m ' + L('over middelvann (', 'above mean sea level (') + fmt(tideCD(H), 1) + ' m ' + L('over sjøkartnull). Kurve for neste 24 timer.', 'above chart datum). Curve for the next 24 hours.') + '</p><table class="ph-tbl">' + ev.map(e => '<tr><td>' + (e.kind === 'high' ? L('Flo', 'High') : L('Fjære', 'Low')) + '</td><td>' + (gDate(e.t).getUTCDate() !== gDate(H).getUTCDate() ? dayStr(e.t).split(' ')[0] + ' ' : '') + hm(e.t) + '</td><td class="n">' + (e.h >= 0 ? '+' : '') + fmt(e.h, 2) + ' m</td></tr>').join('') + '</table>' +
        kv(L('Månen', 'Moon'), moonName(mo)[S.lang] + ', ' + Math.round(mo.illum * 100) + ' %') + '<p class="ph-note">' + L('Foreløpig beregnet fra de viktigste tidevannskomponentene. Med Kartverkets tidevannsdata blir tidene eksakte.', 'For now calculated from the main tidal constituents. With Kartverket\u2019s tide data the times become exact.') + '</p></div>'); }
    h.push('<div class="ph-card"><h4>' + L('Varsel 48 timer', '48 hour forecast') + '</h4><table class="ph-tbl"><tr><th>' + L('Tid', 'Time') + '</th><th>' + L('Vind', 'Wind') + '</th><th class="n">' + L('Hav', 'Sea') + '</th></tr>');
    for (let i = 3; i <= 48; i += 3){ const Hh = Math.floor(H / 3) * 3 + i, w = fcWind(Hh, H), ho = fcHsOpen(Hh, H), lab = (gDate(Hh).getUTCHours() < 3 ? dayStr(Hh).split(' ')[0] + ' ' : '') + hm(Hh); h.push('<tr><td>' + lab + '</td><td class="r' + riskLevel(w, 0) + '">' + dirName(windDir(Hh)) + ' ' + fmt(w, 0) + ' m/s</td><td class="n r' + riskLevel(0, ho) + '">' + fmt(ho, 1) + ' m</td></tr>'); }
    h.push('</table><p class="ph-note">' + L('Farger viser risiko for din båt.', 'Colours show the risk for your vessel.') + '</p></div></div>');
    // the fuel this week (core/02-species-gear.js fuelPrice): where the boat lies, or the coast's level at sea
    { const d0 = fuelPrice(H, b.port, true), d1 = fuelPrice(H - 168, b.port, true), p0 = fuelPrice(H, b.port, false), arr = d0 > d1 + 0.005 ? ' ↑' : d0 < d1 - 0.005 ? ' ↓' : '';
      h.push('<div class="ph-card"><h4>' + L('Drivstoff', 'Fuel') + (b.port && portById(b.port) ? ' · ' + portById(b.port).name : '') + '</h4>' + kv(L('Diesel denne uka', 'Diesel this week'), fmt(d0, 2) + ' kr/l' + arr) + kv(L('Forrige uke', 'Last week'), fmt(d1, 2) + ' kr/l') + kv(L('Bensin', 'Petrol'), fmt(p0, 2) + ' kr/l') + '<p class="ph-note">' + L('Prisen endrer seg hver uke og er litt ulik fra havn til havn.', 'The price changes every week and differs a little from port to port.') + '</p></div>'); }
    return h.join('');
  }
  // --- newspaper
  function post(){
    const day = Math.floor(S.t / 60 / 24), h = ['<div class="ph-mast">Kystposten</div><div class="ph-mdate">' + dayStr(S.t / 60) + ' · ' + L('Nyheter fra Senja og Midt-Troms', 'News from Senja and central Troms') + '</div>'];
    let n = 0;
    for (let d = day; d >= Math.max(0, day - 6); d--) for (const a of newsForDay(d)){ n++; h.push('<div class="ph-art"><time>' + dayStr(d * 24) + '</time><h4>' + a.h[S.lang] + '</h4><p>' + a.b[S.lang] + '</p></div>'); }
    if (!n) h.push('<div class="ph-art"><p>' + L('Ingen nyheter ennå.', 'No news yet.') + '</p></div>');
    return h.join('');
  }
  // --- sales organisation
  // s: one part on its own (the orders in the village, the quota as its own app)
  function salg(s){
    const H = S.t / 60, s0 = s || (['pris', 'land', 'top'].includes(sub.salg) ? sub.salg : 'pris'), h = [s ? '' : subs('salg', [['pris', 'Priser', 'Prices'], ['land', 'Mine landinger', 'My landings'], ['top', 'Toppliste', 'Leaderboard']]), '<div class="ph-c">'];
    if (s0 === 'pris'){
      { const st = streakState(), p0 = st.pct;
        h.push('<div class="ph-card"><h4>' + L('Innloggingsbonus', 'Login bonus') + ' <span class="haill">+' + fmt(p0, 0) + ' %</span></h4><p>' + L('Du får ' + fmt(p0, 0) + ' % ekstra på fisken du leverer. Hver dag du åpner spillet gir 1 % til. Hver dag du ikke kommer innom, trekker 3 %.', 'You get ' + fmt(p0, 0) + ' % extra on the fish you land. Each day you open the game adds 1 %. Each day you stay away takes 3 % off.') + '</p>' +
          kv(L('I morgen', 'Tomorrow'), '+' + fmt(p0 + STREAK.step, 0) + ' %') + kv(L('Hvis du hopper over i morgen', 'If you skip tomorrow'), '+' + fmt(Math.max(0, p0 - STREAK.decay) + STREAK.step, 0) + ' % ' + L('i overmorgen', 'the day after')) + kv(L('Dager innom', 'Days logged in'), fmt(st.days, 0) + (st.best > p0 ? ' · ' + L('best ', 'best ') + fmt(st.best, 0) + ' %' : '')) + '</div>'); }
      h.push('<div class="ph-card"><h4>' + L('Førstehåndspriser, kr/kg', 'First-hand prices, NOK/kg') + '</h4><table class="ph-tbl"><tr><th>' + L('Art', 'Species') + '</th><th class="n">' + L('I dag', 'Today') + '</th><th class="n">' + L('7 døgn', '7 days') + '</th><th class="n">' + L('Minstepris', 'Minimum') + '</th></tr>');
      SP.forEach(sp => { const a1 = avgPrice(sp, H, 1), a7 = avgPrice(sp, H, 7), ar = a1 > a7 * 1.02 ? ' ▲' : a1 < a7 * 0.98 ? ' ▼' : ''; h.push('<tr><td>' + spName(sp) + '</td><td class="n">' + fmt(a1, 2) + ar + '</td><td class="n">' + fmt(a7, 2) + '</td><td class="n">' + fmt((SPECIES[sp].cls[SPECIES[sp].ref][1] * (SPECIES[sp].cls[SPECIES[sp].ref][3] || 1)), 2) + '</td></tr>'); });
      h.push('</table><p class="ph-note">' + L('Snitt av mottakene for A-kvalitet. Mottakene må betale minst minsteprisen.', 'Average across the fish plants for grade A. Plants must pay at least the minimum price.') + '</p></div>');
      h.push('<div class="ph-card"><h4>' + L('Mottak i dag', 'Plants today') + '</h4><table class="ph-tbl"><tr><th></th>' + SP.map(sp => '<th class="n">' + spName(sp).slice(0, 4) + '</th>').join('') + '</tr>' + PORTS.filter(q => q.mottak).map(q => '<tr><td>' + q.name + '</td>' + SP.map(sp => '<td class="n">' + fmt(price(q, sp, H), 0) + '</td>').join('') + '</tr>').join('') + '</table></div>');
    } else if (s0 === 'best'){
      const O = ordState(), cn = id => CUSTOMERS.find(c => c.id === id);
      const card = (o, act) => { const c = cn(o.cust), pr = price(portById(o.port), o.sp, H);
        return '<div class="ph-card"><h4>' + c.no + '</h4>' + kv(L('Vil ha', 'Wants'), fmt(o.kg, 0) + ' kg ' + SPECIES[o.sp][S.lang].toLowerCase() + (o.left < o.kg ? ' · ' + L('igjen ', 'left ') + fmt(o.left, 0) + ' kg' : '')) + kv(L('Kvalitet', 'Quality'), QN[o.q][S.lang]) + kv(L('Levering', 'Deliver at'), portById(o.port).name) +
          kv(L('Tillegg', 'Premium'), '+' + Math.round(o.prem * 100) + ' % · ' + L('ca. ', 'about ') + kr(Math.round(pr * o.prem)) + '/kg') + kv(L('Bonus når alt er levert', 'Bonus when complete'), kr(o.bonus)) +
          (act ? kv(L('Frist', 'Deadline'), dayStr(o.due / 60) + ' ' + hm(o.due / 60)) + '<div class="qbar"><i style="width:' + ((1 - o.left / o.kg) * 100).toFixed(0) + '%"></i></div>' : kv(L('Svar innen', 'Reply by'), dayStr(o.offerUntil / 60) + ' ' + hm(o.offerUntil / 60)) + kv(L('Tid å levere', 'Time to deliver'), o.days + L(' døgn', ' days')) + '<button class="ph-btn p" data-pa="ordtake" data-id="' + o.id + '"' + (O.active.length >= 3 ? ' disabled' : '') + '>' + L('Ta oppdraget', 'Take the order') + '</button>') + '</div>'; };
      h.push('<p class="ph-note">' + L('Mottak og kunder legger ut bestillinger hver morgen. Tar du et oppdrag, går fisken som oppfyller kravet til bestillingen først når du leverer i riktig havn. Leverer du ikke i tide, går omdømmet ned.', 'Buyers and customers post orders every morning. When you take one, the fish that meets it goes to the order first when you land at the right harbour. Miss the deadline and your reputation drops.') + '</p>');
      if (O.active.length){ h.push('<h4 style="margin:8px 2px 4px">' + L('Dine oppdrag', 'Your orders') + '</h4>'); O.active.forEach(o => h.push(card(o, true))); }
      h.push('<h4 style="margin:10px 2px 4px">' + L('Nye bestillinger', 'New orders') + '</h4>'); if (!O.offers.length) h.push('<p class="ph-note">' + L('Ingen nye bestillinger akkurat nå. Nye kommer klokka 06.', 'No new orders right now. New ones come at 06:00.') + '</p>'); O.offers.forEach(o => h.push(card(o, false)));
      h.push('<div class="ph-card"><h4>' + L('Omdømme', 'Reputation') + '</h4>' + CUSTOMERS.map(c => '<div class="ph-kv"><span>' + c.no + '</span><span>' + repOf(c.id) + '</span></div><div class="qbar"><i style="width:' + repOf(c.id) + '%;background:#c9a227"></i></div>').join('') + '<p class="ph-note">' + L('Godt omdømme gir flere bestillinger og høyere tillegg.', 'A good reputation brings more orders and higher premiums.') + '</p></div>');
    } else if (s0 === 'kvote'){
      const q = quotaState(), l = codLimits(), open = codOpen(H), noAcc = !S.lic && S.cur !== openVesselId(), lim = codLimitNow(H), pct = ffPct(H), y = yearH(H), sd = codStopDoy(y), dt = new Date(Date.UTC(y, 0, 1 + (sd == null ? 364 : sd)));
      const MN = S.lang === 'no' ? ['januar','februar','mars','april','mai','juni','juli','august','september','oktober','november','desember'] : ['January','February','March','April','May','June','July','August','September','October','November','December'];
      const ds = dt.getUTCDate() + '. ' + MN[dt.getUTCMonth()], gl = [L('under 8 m', 'under 8 m'), '8–9,99 m', L('10 m og over', '10 m and over')][lenGroup()], wk = q.ffW === weekOfH(H);
      const bar = (a, m) => '<div class="qbar"><i style="width:' + Math.min(100, a / Math.max(1, m) * 100).toFixed(1) + '%"></i></div>';
      const LQ = S.lic ? licQ(S.lic, H) : null;
      if (S.lic) h.push('<div class="ph-card"><h4>' + L('Torsk, lukket gruppe ', 'Cod, closed group ') + y + ' · ' + L('hjemmelslengde ', 'quota length ') + S.lic.hl + '</h4>' + kv(L('Landet', 'Landed'), fmt(q.torsk / 1000, 2) + ' t') + bar(q.torsk, lim) + kv(L('Fartøykvote', 'Vessel quota'), fmt(LQ.torsk / 1000, 2) + ' t') + kv(L('Igjen', 'Left'), fmt(Math.max(0, lim - q.torsk) / 1000, 2) + ' t') + kv(L('Hyse, maks / garantert', 'Haddock, max / guaranteed'), tq(LQ.hyse[0], 0) + ' / ' + tq(LQ.hyse[1], 1)) + kv(L('Sei, maks / garantert', 'Saithe, max / guaranteed'), tq(LQ.sei[0], 0) + ' / ' + tq(LQ.sei[1], 1)) + '<p class="ph-note">' + L('Fartøykvoten er din hele året og stoppes ikke. Torsk over kvoten blir inndratt ved levering.', 'The vessel quota is yours all year and is not stopped. Cod over the quota is confiscated when landed.') + '</p></div>');
      else if (noAcc) h.push('<div class="ph-card"><h4>' + L('Ingen adgang ', 'No access ') + y + '</h4><p class="ph-note">' + L('«' + S.boatName + '» er ikke rederiets båt i åpen gruppe og har ingen kvote. Torsk, hyse og sei kan bare være bifangst: høyst 10 % av hver landing, og høyst ' + fmt(BYCATCH.cod / 1000, 0) + ' tonn torsk i året. Resten blir inndratt.', 'The «' + S.boatName + '» is not the company\'s open-group vessel and has no quota. Cod, haddock and saithe can only be bycatch: at most 10% of each landing, and at most ' + fmt(BYCATCH.cod / 1000, 0) + ' t of cod a year. The rest is confiscated.') + '</p>' + kv(L('Torsk som bifangst i år', 'Cod as bycatch this year'), fmt((q.byCod || 0) / 1000, 2) + ' / ' + fmt(BYCATCH.cod / 1000, 0) + ' t') + bar(q.byCod || 0, BYCATCH.cod) + '</div>');
      else h.push('<div class="ph-card"><h4>' + L('Torsk, åpen gruppe ', 'Cod, open group ') + y + ' · ' + gl + '</h4>' + kv(L('Landet', 'Landed'), fmt(q.torsk / 1000, 2) + ' t') + bar(q.torsk, lim) +
        kv(L('Maksimalkvote', 'Maximum quota'), fmt(l.max / 1000, 1) + ' t' + (open ? '' : ' · ' + L('stoppet', 'stopped'))) + kv(L('Garantert kvote', 'Guaranteed quota'), fmt(l.guar / 1000, 1) + ' t') + kv(L('Igjen nå', 'Left now'), fmt(Math.max(0, lim - q.torsk) / 1000, 2) + ' t') +
        '<p class="ph-note">' + (open ? L('Fisket på maksimalkvotene stoppes når gruppekvoten er beregnet oppfisket, og Kystposten varsler en uke før. Etter stopp gjelder bare den garanterte kvoten.', 'Fishing on the maximum quotas stops when the group quota is estimated fished, announced in the Coast Post a week ahead. After the stop only the guaranteed quota applies.') : L('Maksimalkvotefisket ble stoppet ' + ds + '. Nå gjelder bare den garanterte kvoten.', 'Maximum-quota fishing stopped on ' + ds + '. Only the guaranteed quota applies now.')) + ' ' + L('Torsk over kvoten blir inndratt ved levering. Kvoten gjelder bare turer der du selv er om bord.', 'Cod over the quota is confiscated when landed. The quota only applies to trips with you aboard yourself.') + '</p></div>');
      if (!noAcc) h.push('<div class="ph-card"><h4>' + L('Ferskfiskordningen', 'Fresh-fish scheme') + '</h4>' + (pct ? kv(L('Tillegg nå', 'Allowance now'), Math.round(pct * 100) + ' %') + kv(L('Levert fersk denne uka', 'Landed fresh this week'), fmt(wk ? q.ffTot : 0, 0) + ' kg') + kv(L('Torsk på tillegget', 'Cod on the allowance'), fmt(wk ? q.ffCod : 0, 0) + ' kg') + '<p class="ph-note">' + L('Torsk opp til denne andelen av alt du lander fersk mandag–søndag belastes ikke kvoten. Hyse under 0,8 kg teller ikke med.', 'Cod up to this share of everything you land fresh Monday–Sunday does not count against the quota. Haddock under 0.8 kg does not count.') + '</p>'
        : '<p class="ph-note">' + L('Starter 29. juni. Da kan du fiske torsk utenom kvoten tilsvarende 20 % av det du lander fersk hver uke. Noen år øker Fiskeridirektoratet andelen om høsten, og Kystposten melder det.', 'Starts 29 June. From then, cod up to 20 % of what you land fresh each week comes on top of the quota. Some years the Directorate raises the share in the autumn, and the Coast Post reports it.') + '</p>') + '</div>');
      if (!S.lic && !noAcc) h.push('<div class="ph-card"><h4>' + L('Hyse og sei', 'Haddock and saithe') + '</h4>' + kv(L('Hyse landet', 'Haddock landed'), fmt(q.hyse / 1000, 2) + ' t') + kv(L('Hyse, garantert', 'Haddock, guaranteed'), fmt(yearQuota(y).open.hyseG[lenGroup()], 1) + ' t') + kv(L('Sei landet', 'Saithe landed'), fmt(q.sei / 1000, 2) + ' t') + kv(L('Sei, garantert', 'Saithe, guaranteed'), fmt(yearQuota(y).open.seiG, 1) + ' t') + '<p class="ph-note">' + L('Fritt fiske så lenge gruppekvoten ikke er tatt.', 'Free fishing as long as the group quota is not taken.') + '</p></div>');
      if (q.conf > 0.5) h.push('<div class="ph-card"><h4>' + L('Inndratt i år', 'Confiscated this year') + '</h4>' + kv(L('Fisk over kvoten eller bifangstgrensen', 'Fish over the quota or the bycatch limit'), fmt(q.conf, 0) + ' kg') + kv(L('Verdi', 'Value'), kr(Math.round(q.confKr))) + '</div>');
      h.push('<div class="ph-card"><h4>' + L('Minstepriser, kr/kg rund vekt', 'Minimum prices, NOK/kg round weight') + '</h4><table class="ph-tbl">' + SP.map(sp => '<tr><td colspan="2"><b>' + SPECIES[sp][S.lang] + '</b></td></tr>' + SPECIES[sp].cls.map(c => '<tr><td>' + c[2] + '</td><td class="n">' + fmt(c[1] * (c[3] || 1), 2) + '</td></tr>').join('')).join('') + '</table><p class="ph-note">' + L('Dynamiske minstepriser for torsk, hyse og sei fra 21. september 2026, faste minstepriser for de andre artene. Krokfanget hyse over 1,1 kg har tillegg. Mottakene betaler aldri mindre.', 'Dynamic minimum prices for cod, haddock and saithe from 21 September 2026, fixed minimum prices for the other species. Hook-caught haddock over 1.1 kg gets a premium. Buyers never pay less.') + '</p></div>');
    } else if (s0 === 'land'){
      const wk = myKg(weekOf(H) * 168, H + 1), mo = myKg(H - 30 * 24, H + 1), all = S.sales.reduce((a, x) => a + x.kg, 0), val = S.sales.reduce((a, x) => a + x.total, 0);
      h.push('<div class="ph-card">' + kv(L('Denne uka', 'This week'), fmt(wk, 0) + ' kg') + kv(L('Siste 30 døgn', 'Last 30 days'), fmt(mo, 0) + ' kg') + kv(L('Totalt', 'Total'), fmt(all, 0) + ' kg · ' + kr(val)) + '</div>');
      const tot = {}; S.sales.forEach(x => (x.sp || []).forEach(([sp, kg]) => tot[sp] = (tot[sp] || 0) + kg));
      if (Object.keys(tot).length) h.push('<div class="ph-card"><h4>' + L('Per art', 'By species') + '</h4>' + SP.filter(sp => tot[sp]).map(sp => kv(spName(sp), fmt(tot[sp], 0) + ' kg')).join('') + '</div>');
      h.push('<div class="ph-card"><h4>' + L('Sluttsedler', 'Landing notes') + '</h4>' + (S.sales.length ? '<table class="ph-tbl"><tr><th>' + L('Dato', 'Date') + '</th><th>' + L('Mottak', 'Plant') + '</th><th class="n">kg</th><th class="n">kr</th></tr>' + S.sales.slice().reverse().slice(0, 30).map(x => '<tr><td>' + dayStr(x.t / 60).replace(/^\S+ /, '') + '</td><td>' + portById(x.port).name + '</td><td class="n">' + fmt(x.kg, 0) + '</td><td class="n">' + fmt(x.total, 0) + '</td><td class="n"><button class="ph-btn alt" style="margin:0;padding:3px 8px" data-pa="book" data-i="' + S.sales.indexOf(x) + '" aria-label="' + L('Åpne i dekksdagboka', 'Open in the deck log') + '">📖</button></td></tr>').join('') + '</table>' : '<p class="ph-note">' + L('Ingen landinger ennå.', 'No landings yet.') + '</p>') + '</div>');
    } else {
      const w = weekOf(H), which = sub.salgW === 'prev' ? w - 1 : w, rows = toplist(Math.max(0, which));
      h.push('<div class="ph-sub" style="padding:0 0 8px"><button class="' + (which === w ? 'on' : '') + '" data-pa="salgW" data-s="now">' + L('Denne uka', 'This week') + '</button><button class="' + (which !== w ? 'on' : '') + '" data-pa="salgW" data-s="prev">' + L('Forrige uke', 'Last week') + '</button></div>');
      h.push('<div class="ph-card"><table class="ph-tbl"><tr><th>#</th><th>' + L('Fartøy', 'Vessel') + '</th><th>' + L('Havn', 'Port') + '</th><th class="n">kg</th></tr>' + rows.map((r, i) => '<tr class="' + (r.me ? 'me' : '') + '"><td>' + (i + 1) + '</td><td>' + r.name + '</td><td>' + r.port + '</td><td class="n">' + fmt(r.kg, 0) + '</td></tr>').join('') + '</table><p class="ph-note">' + L('Landet kvantum hos mottakene i Senja-området. Flere spillere kommer når spillet får server.', 'Landed weight at the plants around Senja. Other players join once the game has a server.') + '</p></div>');
    }
    h.push('</div>'); return h.join('');
  }
  // --- rescue
  function redning(){
    const b = S.boat, bars = inPort() ? 4 : coverage(b.pos), can = bars > 0 || S.equip.vhf, np = nearestPort(b.pos), H = S.t / 60, lvl = riskLevel(windAt(H), hsAt(b.pos, H));
    const st = rescueBase(b.pos), eta = Math.round(st.d / (TOW.come * NM) * 60) + TOW.muster;
    const h = ['<div class="ph-c"><div class="ph-card"><h4>' + L('Din posisjon', 'Your position') + '</h4><p>' + coordStr(b.pos) + '</p>' + kv(L('Nærmeste havn', 'Nearest port'), np.name + ', ' + fmt(dist(np.p, b.pos) / NM, 1) + ' nm') + kv(L('Dekning', 'Coverage'), bars ? bars + '/4' : L('Ingen', 'None')) + kv('VHF', S.equip.vhf ? L('Ja, kanal 16', 'Yes, channel 16') : L('Ikke montert', 'Not fitted')) + '</div>'];
    if (inPort()) h.push('<div class="ph-card"><p>' + L('Du ligger trygt i havn.', 'You are safely in port.') + '</p></div>');
    else if (b.status === 'tow' && b.tow) h.push('<div class="ph-card"><h4>' + statusText() + '</h4><p>' + L('Redningsskøyta fra ' + b.tow.base + ' sleper deg til ' + portById(b.tow.port).name + '.', 'The rescue boat from ' + b.tow.base + ' tows you to ' + portById(b.tow.port).name + '.') + '</p></div>');
    else {
      h.push('<div class="ph-card"><h4>' + L('Be om slep', 'Request a tow') + '</h4><p>' + L('For motorstopp, tom tank eller annen hjelp uten fare for liv. Nærmeste redningsskøyte ligger i ' + st.n + ', ca. ' + eta + ' min unna.', 'For engine failure, an empty tank or other help without danger to life. The nearest rescue boat is in ' + st.n + ', about ' + eta + ' min away.') + '</p>' + kv(L('Pris', 'Cost'), S.member ? L('Gratis (medlem)', 'Free (member)') : kr(PRICE.tow)) + '<button class="ph-btn" data-pa="tow"' + (can ? '' : ' disabled') + '>' + L('Ring etter slep', 'Call for a tow') + '</button></div>');
      h.push('<div class="ph-card"><h4>' + L('Nødanrop', 'Distress call') + '</h4><p>' + L('Bare når liv er i fare. Mannskapet og båten hentes, men fangsten går tapt.', 'Only when lives are in danger. Crew and vessel are rescued, but the catch is lost.') + '</p>' + (lvl === 2 ? '<p class="r2">' + L('Farlige forhold der du er nå.', 'Dangerous conditions where you are.') + '</p>' : '') + (confirmMayday ? '<button class="ph-btn red" data-pa="mayday2">' + L('Bekreft: send MAYDAY', 'Confirm: send MAYDAY') + '</button><button class="ph-btn alt" data-pa="mayday0">' + L('Avbryt', 'Cancel') + '</button>' : '<button class="ph-btn red" data-pa="mayday"' + (can ? '' : ' disabled') + '>MAYDAY</button>') + '</div>');
      if (!can) h.push('<p class="ph-note">' + L('Ingen mobildekning her. Med VHF-radio kan du alltid nå kystradioen.', 'No mobile coverage here. With a VHF radio you can always reach coast radio.') + '</p>');
    }
    h.push('<div class="ph-card"><h4>' + L('Medlemskap', 'Membership') + '</h4><p>' + L('Medlemmer får gratis slep og hjelp med båten. Pengene går til drift av redningsskøytene.', 'Members get free tows and help with the boat. The money helps run the rescue boats.') + '</p>' + (S.member ? '<p><b>' + L('Du er medlem.', 'You are a member.') + '</b></p>' : '<button class="ph-btn" data-pa="member">' + L('Bli medlem, ', 'Join, ') + kr(PRICE.member) + L(' per år', ' per year') + '</button>') + '</div></div>');
    return h.join('');
  }
  // --- vessels: my vessel overview and the market
  const tradeIn = () => vesselValue(curVessel());
  // what a purchase costs (deal() in core/03-simulation.js): the trade-in pays off the loans first, then the bank and Innovasjon Norge
  const whyText = x => x.why === 'notes' ? L('Banken vil se tre sluttsedler først.', 'The bank wants to see three landing notes first.') : x.why === 'eq' ? L('For lite egenkapital.', 'Too little equity.') : x.why === 'cap' ? L('Banken låner ikke mer: all gjeld skal ligge innenfor 80 % av verdien på flåten.', 'The bank lends no more: all debt has to stay within 80% of the fleet\'s value.') : '';
  const payNote = (x, no, en, loanNo, loanEn) => '<p class="ph-note">' + L(no, en) + kr(x.cost) + (x.payoff ? ' · ' + L('innbyttet innfrir først ', 'the trade-in first pays off ') + kr(x.payoff) + L(' av gjelda', ' of the debt') : '') +
    (x.loanNeed ? ' · ' + L(loanNo || 'lån ', loanEn || 'loan ') + kr(x.bankL) + (x.inL > 0 ? ' + Innovasjon Norge ' + kr(x.inL) : '') + ', ' + L('egenkapital ', 'equity ') + kr(x.eqNeed) : '') + (x.ok ? '' : ' · <b>' + whyText(x) + '</b>') + '</p>';
  const accessText = v => { const lic = vget(v, 'lic'); return lic ? L('lukket gruppe, hjemmelslengde ', 'closed group, quota length ') + lic.hl : v.id === openVesselId() ? L('åpen gruppe når du selv er om bord', 'open group when you are aboard yourself') : L('ingen adgang: torsk, hyse og sei bare som bifangst', 'no access: cod, haddock and saithe only as bycatch'); };
  const tiLocked = v => !!(S.order && S.order.vid !== null && (S.order.vid || S.cur) === v.id);
  // the ladder in «Neste mål»: the hand jig, the first jigging machine, blad B, the entry boat with a closed-group right, the next right
  // up, the 14.99 m coastal vessel, and the ocean fleet when the chart reaches it. The two next steps are shown
  function goals(){
    const steps = [], F = S.fm || {n:0, kr:0};
    if (!S.boat.gear) steps.push({n:L('Håndjuksa med pilk og markkroker', 'Hand jig with pilk and fly hooks'), need:PRICE.gear, a:'fiske'});
    if ((S.equip.jukse || 0) < 1) steps.push({n:L('Første juksamaskin', 'First jigging machine'), need:EQUIP.jukse.price, a:'utstyr'});
    if (!bladB()) steps.push({n:L('Blad B i fiskermanntallet', 'Blad B of the fishermen\'s register'), pc:Math.min(F.n / BLADB.days, F.kr / BLADB.kr, 1), a:'papers',
      txt:fmt(Math.min(F.n, BLADB.days), 0) + ' / ' + BLADB.days + L(' landingsdager med deg om bord · ', ' landing days with you aboard · ') + kr(Math.min(F.kr, BLADB.kr)) + ' / ' + kr(BLADB.kr)});
    const top = Math.max(-1, ...S.fleet.map(v => vget(v, 'lic')).filter(Boolean).map(l => LIC_OFFERS.findIndex(O => O.id === l.id))), O = LIC_OFFERS[top + 1];
    if (O){ const x = deal(VESSELS[O.ves].price + licValue(O), tradeIn(), innOK()); steps.push({n:O[S.lang], need:x.eqNeed + 5000, bank:true, a:'fartoy'}); }
    if (!S.fleet.some(v => VESSELS[vget(v, 'boat').type].cls !== 'open')){ const k = 'kyst15', x = deal(VESSELS[k].price, 0); steps.push({n:VESSELS[k].name[S.lang], need:x.eqNeed + 5000, bank:true, a:'fartoy'}); }
    steps.push({n:L('Havfiske', 'Ocean fishing'), pc:0, lock:true, txt:L('Kommer når kartet utvides vestover', 'Comes when the chart is extended west')});
    return steps.slice(0, 2).map(x => Object.assign(x, {pc:x.pc != null ? x.pc : Math.min(1, Math.max(0, S.cash) / Math.max(1, x.need))}));
  }
  function goalsCard(){
    const g = goals(); if (!g.length) return '';
    return '<div class="ph-card"><h4>' + L('Neste mål', 'Next goals') + '</h4>' + g.map(x => '<p style="margin:6px 0 2px"><b>' + x.n + '</b><br><small>' + (x.txt || (x.bank ? L('Egenkapital banken krever: ', 'Equity the bank wants: ') : L('Pris: ', 'Price: ')) + kr(x.need) + (x.bank && S.sales.length < 3 ? ' · ' + L('og tre sluttsedler', 'and three landing notes') : '')) + '</small></p><div class="qbar"><i style="width:' + (x.pc * 100).toFixed(1) + '%"></i></div>' +
      (x.a === 'papers' ? '<button class="ph-btn" data-pa="papers">' + L('Se papirene', 'See the papers') + '</button>' : x.lock || x.pc < 1 ? '' : x.a !== 'fartoy' ? '<button class="ph-btn" data-pa="open" data-a="' + x.a + '">' + L('Til butikken', 'To the shop') + '</button>' : '<button class="ph-btn" data-pa="sub" data-s="marked">' + L('Se markedet', 'See the market') + '</button>')).join('') + '</div>';
  }
  // ---- the boat market: tabs for the open group, boats with a closed-group right, the coastal fleet over 11 m and the ocean fleet;
  // a card per boat with its side view, and a spec sheet with the buttons. Until the company owns a closed-group vessel, an open-group
  // boat is only bought by trading in the one you have: a company can have one vessel in the open group (deltakerforskriften)
  let mkSel = null;
  const hasLic = () => S.fleet.some(v => vget(v, 'lic'));
  const grpText = V => V.cls === 'hav' ? L('havfiske, konsesjon', 'ocean, licence') : V.len >= 11 ? L('bare lukket gruppe (11 m og mer)', 'closed group only (11 m and more)') : V.len < 8 ? L('åpen gruppe under 8 m', 'open group under 8 m') : V.len < 10 ? L('åpen gruppe 8–9,99 m', 'open group 8–9.99 m') : L('åpen gruppe 10–10,99 m', 'open group 10–10.99 m');
  const tn = n => n >= 10000 ? fmt(n / 1000, n >= 100000 ? 0 : 1) + ' t' : fmt(n, 0) + ' kg';
  function mkCard(k, O){
    const V = VESSELS[k], price = O ? V.price + licValue(O) : V.price, mine = S.boat.type === k && !O, tag = V.lock ? L('kommer', 'coming') : O ? O.hl : V.isNew ? L('nybygg', 'new build') : L('brukt', 'used');
    return '<button class="ph-card vcard' + (mine ? ' mine' : '') + '" data-pa="mksel" data-k="' + k + '"' + (O ? ' data-o="' + O.id + '"' : '') + '><span class="vpic">' + vesselSVG(k) + '</span><span class="vtx"><b>' + (O ? O[S.lang] : V.name[S.lang]) + '</b><small>' + fmt(V.len, 2) + ' × ' + fmt(V.beam, 1) + ' × ' + fmt(V.draft, 1) + ' m · ' + tn(V.holdCap) + '</small><span class="vpr">' + kr(price) + ' <i>' + tag + '</i></span></span></button>';
  }
  function market(){
    const tab = sub.marked || 'open', h = [];
    if (mkSel) return sheet(mkSel.k, mkSel.o ? LIC_OFFERS.find(x => x.id === mkSel.o) : null);
    h.push('<div class="ph-sub mk">' + [['open', 'Åpen gruppe', 'Open group'], ['lic', 'Med hjemmel', 'With a right'], ['kyst', 'Kystflåten', 'Coastal fleet'], ['hav', 'Havfiske', 'Ocean']].map(([k, no, en]) => '<button class="' + (tab === k ? 'on' : '') + '" data-pa="mktab" data-s="' + k + '">' + L(no, en) + '</button>').join('') + '</div>');
    const bn = '«' + S.boatName + '»', ti = tradeIn();
    if (tab === 'open'){
      h.push('<p class="ph-note">' + L('Båter under 11 m. Rederiet kan ha én båt i åpen gruppe, så du bytter opp ved å gi ' + bn + ' i bytte (' + kr(ti) + '). Neste båt du kjøper til flåten, er en båt med hjemmel i lukket gruppe.', 'Boats under 11 m. The company can have one boat in the open group, so you trade up by trading in ' + bn + ' (' + kr(ti) + '). The next boat you buy for the fleet is one with a closed-group right.') + '</p>');
      for (const [k, V] of Object.entries(VESSELS)) if (V.cls === 'open') h.push(mkCard(k));
    } else if (tab === 'lic'){
      h.push('<p class="ph-note">' + L('Båter med deltakeradgang i lukket gruppe og fast torskekvote. Prisen er båten pluss kvoten (anslått ' + KPK + ' kr/kg torsk). Krever registrering på blad B i fiskermanntallet.', 'Boats with a closed-group right and a fixed cod quota. The price is the boat plus the quota (an estimated ' + KPK + ' kr/kg of cod). Needs registration on blad B of the fishermen\'s register.') + '</p>');
      for (const O of LIC_OFFERS) h.push(mkCard(O.ves, O));
    } else if (tab === 'kyst'){
      h.push('<p class="ph-note">' + L('Kystbåter fra 11 m. De kan bare fiske torsk, hyse og sei med hjemmel i lukket gruppe. Hjemlene for 11–21 m kommer senere, så nå selges de uten.', 'Coastal vessels from 11 m. They can only fish cod, haddock and saithe with a closed-group right. Rights for 11–21 m come later, so for now they are sold without.') + '</p>');
      for (const [k, V] of Object.entries(VESSELS)) if (V.cls === 'kyst') h.push(mkCard(k));
    } else {
      h.push('<p class="ph-note">' + L('Havfiskeflåten fisker utenfor 12 nm, vest for dagens kart. Båtene kan ses, men ikke kjøpes før havfeltene åpner.', 'The ocean fleet fishes outside 12 nm, west of today\'s chart. The vessels can be looked at, but not bought until the ocean grounds open.') + '</p>');
      for (const [k, V] of Object.entries(VESSELS)) if (V.cls === 'hav') h.push(mkCard(k));
    }
    if (!inPort()) h.push('<p class="ph-note">' + L('Båthandel gjøres i havn.', 'Vessel deals are done in port.') + '</p>');
    return h.join('');
  }
  function sheet(k, O){
    const V = VESSELS[k], bn = '«' + S.boatName + '»', ti = tradeIn(), free = inPort() && !S.order, price = O ? V.price + licValue(O) : V.price, mine = S.boat.type === k && !O, h = [];
    const sec = (t, rows) => '<div class="vsec"><h5>' + t + '</h5>' + rows.filter(Boolean).join('') + '</div>';
    h.push('<button class="ph-btn alt mkback" data-pa="mksel">‹ ' + L('Tilbake til listen', 'Back to the list') + '</button>');
    h.push('<div class="ph-card vsheet"><h4>' + (O ? O[S.lang] : V.name[S.lang]) + '</h4><div class="vbig">' + vesselSVG(k) + '</div><p>' + V.desc[S.lang] + '</p>');
    h.push(sec(L('Generelt', 'General'), [kv(L('Pris', 'Price'), kr(price)), V.priceNew ? kv(L('Nypris', 'New price'), kr(V.priceNew)) : '', kv(L('Byggeår', 'Built'), V.isNew ? L('bygges nå (45 døgn)', 'built now (45 days)') : V.year),
      kv(L('Lengde', 'Length'), fmt(V.len, 2) + ' m'), kv(L('Bredde', 'Beam'), fmt(V.beam, 1) + ' m'), kv(L('Dypgående', 'Draft'), fmt(V.draft, 1) + ' m'), kv(L('Vekt (deplasement)', 'Weight (displacement)'), fmt(V.disp, V.disp < 10 ? 1 : 0) + ' t'),
      kv(L('Lasterom', 'Hold'), tn(V.holdCap) + (V.cls === 'hav' ? L(' fryst', ' frozen') : '')), V.iceCap ? kv(L('Is', 'Ice'), tn(V.iceCap)) : '', kv(L('Drivstoff', 'Fuel'), fmt(V.fuelCap, 0) + ' L ' + (V.diesel ? 'diesel' : L('bensin', 'petrol'))),
      kv(L('Motor', 'Engine'), V.engine[S.lang]), kv(L('Fart', 'Speed'), L('marsj ', 'cruise ') + fmt(V.vcruise, 1) + ' · ' + L('topp ', 'top ') + fmt(V.vmax, 1) + ' kn'),
      kv(L('Mannskap', 'Crew'), V.crew ? V.crew.key.length + L(' nøkkelfolk + lag på ', ' key people + teams of ') + V.crew.teams.map(t => t.n).join(' + ') : L('du + ', 'you + ') + V.crewMax), kv(L('Køyer', 'Berths'), V.berths || L('ingen', 'none')),
      kv(L('Tåler', 'Handles'), L('bølger til ', 'waves up to ') + fmt(V.risk[0], 1) + ' m, ' + L('vind til ', 'wind up to ') + Math.round(V.risk[2]) + ' m/s'), kv(L('Gruppe', 'Group'), grpText(V)),
      V.len >= 15 ? kv(L('Fjordlinja', 'Fjord line'), L('kan ikke fiske innenfor', 'may not fish inside')) : '']));
    const hauls = ['elhaler', 'linehaler', 'garnhaler', 'teinehaler'].filter(q => equipFits(q, k)).map(q => EQUIP[q].name[S.lang]);
    h.push(sec(L('Redskap', 'Gear'), [kv(L('Rigger', 'Rigs'), V.rigs.length ? V.rigs.map(r => RIGS[r][S.lang]).join(', ') : L('trål og not (havsteget)', 'trawl and seine (ocean step)')), V.jukseMax ? kv(L('Juksamaskiner', 'Jigging reels'), L('inntil ', 'up to ') + V.jukseMax) : '',
      V.gearMax.garn ? kv(L('Garn', 'Nets'), L('inntil ', 'up to ') + V.gearMax.garn) : '', V.gearMax.stamp ? kv(L('Linestamper', 'Line tubs'), L('inntil ', 'up to ') + V.gearMax.stamp) : '', V.autoHooks ? kv(L('Autoline', 'Autoline'), fmt(V.autoHooks, 0) + L(' kroker', ' hooks')) : '',
      V.gearMax.teine ? kv(L('Teiner', 'Pots'), L('inntil ', 'up to ') + fmt(V.gearMax.teine, 0)) : '', hauls.length ? kv(L('Halere som passer', 'Haulers that fit'), hauls.join(', ')) : '']));
    if (O){ const yearly = Math.round(O.cod * avgPrice('torsk', S.t / 60, 7) / 1000) * 1000;
      h.push(sec(L('Hjemmel', 'Right'), [kv(L('Hjemmelslengde', 'Quota length'), O.hl), kv(L('Torsk, fartøykvote', 'Cod, vessel quota'), fmt(O.cod / 1000, 3) + ' t'), kv(L('Hyse, maks / garantert', 'Haddock, max / guaranteed'), tq(O.hyse[0], 1) + ' / ' + tq(O.hyse[1], 1)),
        kv(L('Sei, maks / garantert', 'Saithe, max / guaranteed'), tq(O.sei[0], 1) + ' / ' + tq(O.sei[1], 1)), kv(L('Kvotepris', 'Quota price'), O.kpk + ' kr/kg · ' + kr(licValue(O))), kv(L('Torsk per år', 'Cod a year'), L('ca. ', 'about ') + kr(yearly))])); }
    if (V.crew) h.push(sec(L('Mannskap om bord', 'Crew aboard'), [kv(L('Nøkkelfolk', 'Key people'), V.crew.key.join(', ')), kv(L('Lag', 'Teams'), V.crew.teams.map(t => t.n + ' ' + t.role).join(', ') + (V.crew.rot > 1 ? L(', to vakter', ', two watches') : ''))]));
    // buying
    if (V.lock) h.push('<p class="ph-note">' + L('Havfiske kommer når kartet utvides vestover, utenfor 12 nm. Krever konsesjon.', 'Ocean fishing comes when the chart is extended west, outside 12 nm. Needs a licence.') + '</p>');
    else if (mine) h.push('<p class="ph-note">' + L(bn + ' er en slik båt.', bn + ' is one of these.') + '</p>');
    else if (O){ const mineO = S.lic && S.lic.id === O.id, inn = innOK(), A = deal(price, ti, inn), B = deal(price, 0, inn), F = S.fm || {n:0, kr:0}, bb = bladB();
      if (mineO) h.push('<p class="ph-note">' + L(bn + ' har denne hjemmelen.', bn + ' has this right.') + '</p>');
      else if (!bb) h.push('<p class="ph-note"><b>' + L('Krever blad B i fiskermanntallet.', 'Needs blad B of the fishermen\'s register.') + '</b> ' + L('Du har ' + F.n + ' av ' + BLADB.days + ' landingsdager med deg om bord og ' + kr(F.kr) + ' av ' + kr(BLADB.kr) + ' i førstehåndsverdi. Se Papirer i Sjømann-appen.', 'You have ' + F.n + ' of ' + BLADB.days + ' landing days with you aboard and ' + kr(F.kr) + ' of ' + kr(BLADB.kr) + ' in first-hand value. See Papers in the Sailor app.') + '</p>');
      else h.push((inn ? '<p class="ph-note">' + L('Første båt i lukket gruppe: Innovasjon Norge toppfinansierer ' + Math.round(INN * 100) + ' % med et risikolån (8,9 %, 10 år), så du trenger bare ' + Math.round((0.2 - INN) * 100) + ' % egenkapital.', 'First boat in the closed group: Innovasjon Norge tops up ' + Math.round(INN * 100) + '% with a risk loan (8.9%, 10 years), so you only need ' + Math.round((0.2 - INN) * 100) + '% equity.') + '</p>' : '') + payNote(A, 'Mellomlegg med ' + bn + ' i bytte: ', 'To pay with ' + bn + ' traded in: ', 'lån over 15 år ', '15-year loan ') + '<button class="ph-btn' + (A.ok ? ' p' : '') + '" data-pa="buylic" data-ti="1" data-id="' + O.id + '"' + (A.ok && free && !tiLocked(curVessel()) ? '' : ' disabled') + '>' + L('Kjøp og bytt inn ' + bn, 'Buy, trading in ' + bn) + '</button>' +
        payNote(B, 'Til flåten, uten innbytte: ', 'For the fleet, no trade-in: ', 'lån over 15 år ', '15-year loan ') + '<button class="ph-btn" data-pa="buylic" data-ti="0" data-id="' + O.id + '"' + (B.ok && free ? '' : ' disabled') + '>' + L('Kjøp til flåten', 'Buy for the fleet') + '</button>');
      const ov = openVesselId(); if (ov && !mineO) h.push('<p class="ph-note">' + L('Et rederi med en båt i lukket gruppe kan ikke ha noen båt i åpen gruppe. «' + vget(vesselById(ov), 'boatName') + '» mister plassen der, men kan fiske kveite og krabbe.', 'A company with a closed-group vessel can have no vessel in the open group. «' + vget(vesselById(ov), 'boatName') + '» loses its place there, but can fish halibut and crab.') + '</p>'); }
    else { const A = deal(V.price, ti), B = deal(V.price, 0), verb = V.isNew ? L('Bestill', 'Order') : L('Kjøp', 'Buy'), openOnly = V.len < 11 && !hasLic();
      h.push(payNote(A, 'Mellomlegg med ' + bn + ' i bytte: ', 'To pay with ' + bn + ' traded in: ') + '<button class="ph-btn p" data-pa="buy" data-ti="1" data-k="' + k + '"' + (A.ok && free && !tiLocked(curVessel()) ? '' : ' disabled') + '>' + verb + L(' og bytt inn ' + bn, ', trading in ' + bn) + '</button>');
      if (openOnly) h.push('<p class="ph-note">' + L('Til flåten: et rederi kan bare ha én båt i åpen gruppe. Kjøp heller en båt med hjemmel, eller bytt inn ' + bn + '.', 'For the fleet: a company can only have one boat in the open group. Buy a boat with a right instead, or trade in ' + bn + '.') + '</p>');
      else h.push(payNote(B, 'Til flåten, uten innbytte: ', 'For the fleet, no trade-in: ') + '<button class="ph-btn" data-pa="buy" data-ti="0" data-k="' + k + '"' + (B.ok && free ? '' : ' disabled') + '>' + verb + L(' til flåten', ' for the fleet') + '</button>' + (V.len >= 11 || hasLic() ? '<p class="ph-note">' + L('Uten hjemmel kan hun bare ta torsk, hyse og sei som bifangst.', 'Without a right she can only take cod, haddock and saithe as bycatch.') + '</p>' : '')); }
    if (vesselSpec(k)) h.push('<button class="ph-btn alt" data-pa="mk3d" data-k="' + k + '">' + L('Se båten i 3D', 'See her in 3D') + '</button>');
    h.push('</div>'); return h.join('');
  }
  // tab0: one tab without the tab row (the boat market in the yard, the boat in the inventory)
  function fartoy(tab0){
    const b = S.boat, V = VESSELS[b.type], s0 = tab0 || sub.fartoy || 'min', h = [tab0 ? '' : subs('fartoy', [['min', 'Min båt', 'My vessel'], ['marked', 'Marked', 'Market']]), '<div class="ph-c">' + (tab0 === 'min' ? '' : goalsCard())];
    if (s0 === 'min'){
      h.push('<div class="ph-card"><h4>«' + S.boatName + '»' + (meAboard() ? ' ⚓' : '') + '</h4><p class="ph-note">' + L('Adgang: ', 'Access: ') + accessText(curVessel()) + '</p>' + (S.fleet.length > 1 ? '<button class="ph-btn alt" data-pa="open" data-a="rederi">' + L('Hele flåten i Rederi-appen', 'The whole fleet in the Company app') + '</button>' : '') + '</div>');
      const svcLeft = V.svcH - ((b.engH || 0) - (b.svcAt || 0)), svcPct = clamp(1 - svcLeft / V.svcH, 0, 1), cls = svcPct > 0.9 ? 'bad' : svcPct > 0.7 ? 'warn' : '';
      const bar = (a, c, k) => '<div class="ph-bar"><i class="' + (k || '') + '" style="width:' + Math.round(clamp(a / c, 0, 1) * 100) + '%"></i></div>';
      h.push('<div class="ph-card"><h4>' + V.name[S.lang] + '</h4>' + kv(L('Lengde', 'Length'), fmt(V.len, 1) + ' m') + kv(L('Toppfart', 'Top speed'), BOAT.vmax + ' kn') + kv(L('Drivstoff', 'Fuel'), BOAT.diesel ? 'Diesel' : L('Bensin', 'Petrol')) + kv(L('Tåler', 'Handles'), L('bølger til ', 'waves up to ') + fmt(BOAT.risk[0], 1) + ' m ' + L('trygt', 'safely')) + '</div>');
      h.push('<div class="ph-card"><h4>Status</h4>' + kv(L('Drivstoff', 'Fuel'), fmt(b.fuel, 0) + ' / ' + BOAT.fuelCap + ' L') + bar(b.fuel, BOAT.fuelCap, b.fuel < BOAT.fuelCap * 0.2 ? 'bad' : '') + kv(L('Is', 'Ice'), fmt(b.ice, 0) + ' / ' + BOAT.iceCap + ' kg') + bar(b.ice, BOAT.iceCap) + kv(L('Last', 'Hold'), fmt(holdTotal(), 0) + ' / ' + BOAT.holdCap + ' kg') + bar(holdTotal(), BOAT.holdCap) +
        kv(L('Motortimer', 'Engine hours'), fmt(b.engH || 0, 0) + ' t') + kv(L('Neste service', 'Next service'), svcLeft > 0 ? L('om ', 'in ') + fmt(svcLeft, 0) + ' t' : '<span class="r2">' + L('forfalt', 'overdue') + '</span>') + bar(svcPct, 1, cls) +
        kv(L('Juksa', 'Jig line'), b.gear ? L('i orden', 'fine') : '<span class="r2">' + L('ingen, kjøp juksa i butikken', 'none, buy a jig in the shop') + '</span>') + '<button class="ph-btn" data-pa="open" data-a="verksted">' + L('Til verkstedet', 'To the workshop') + '</button></div>');
      // the echo sounder and the sonar say when they are switched off on the chart plotter
      const off = k => (k === 'chirp' && S.settings.echo === false) || (k === 'sonar' && S.settings.sonar === false) ? L(' (av)', ' (off)') : '';
      const eq = Object.keys(EQUIP).filter(k => EQUIP[k].multi ? S.equip[k] > 0 : S.equip[k]).map(k => EQUIP[k].name[S.lang] + (EQUIP[k].multi ? ' × ' + S.equip[k] : '') + off(k));
      h.push('<div class="ph-card"><h4>' + L('Utstyr om bord', 'Equipment on board') + '</h4><p>' + ['GPS'].concat(S.equip.chirp ? [] : [L('Enkelt ekkolodd', 'Basic sounder') + (S.settings.echo === false ? L(' (av)', ' (off)') : '')]).concat(eq).join(', ') + '</p><h4 style="margin-top:8px">' + L('Mannskap', 'Crew') + '</h4><p>' + [L('Deg (skipper)', 'You (skipper)')].concat(S.crew.map(c => c.name)).join(', ') + ' · ' + L('plass til ', 'room for ') + (V.crewMax + 1) + '</p></div>');
      if (S.order) h.push('<div class="ph-card"><h4>' + L('Bestilt', 'On order') + '</h4><p>' + VESSELS[S.order.type].name[S.lang] + '</p>' + kv(L('Klar', 'Ready'), dayStr(S.order.due / 60)) + '<p class="ph-note">' + L('Overtas i Finnsnes.', 'Handover in Finnsnes.') + '</p></div>');
    } else h.push(market());
    h.push('</div>'); return h.join('');
  }
  // --- the company: the fleet at a glance and what needs you. The vessel apps work on the vessel picked at the top (default: the one you follow)
  const SEL_APPS = ['fartoy', 'utstyr', 'redskap', 'mannskap', 'bors', 'verksted'];
  const DRAWER = new Set(['arbeid', 'rigg', 'fiske', 'fartoy', 'utstyr', 'redskap', 'mannskap', 'bors', 'bank', 'verksted', 'havn', 'last', 'lever', 'is', 'agn', 'oppdrag', 'beholdning']);
  let selV = null;
  const selVessel = () => (selV && vesselById(selV)) || curVessel();
  const withSel = fn => withVessel(selVessel(), fn);
  function selRow(){ if (S.fleet.length < 2) return ''; const s0 = selVessel(); return '<div class="ph-sub">' + S.fleet.map(v => '<button class="' + (v === s0 ? 'on' : '') + '" data-pa="vsel" data-id="' + v.id + '">' + vget(v, 'boatName') + (v.id === S.me ? ' ⚓' : '') + '</button>').join('') + '</div>'; }
  // the bound vessel at a glance, with what needs attention
  function vSummary(){
    const b = S.boat, H = S.t / 60, o = S.ops, sk = opsSkipper(), day = gDate(H).toISOString().slice(0, 10), al = [];
    const inc = S.sales.filter(x => x.v === S.cur && gDate(x.t / 60).toISOString().slice(0, 10) === day).reduce((a, x) => a + x.total, 0);
    const A = (k, no, en, app) => al.push({id:S.cur, k, no, en, app});
    if (b.status === 'engine') A('eng', 'Motorstopp', 'Engine stopped', 'redning');
    if (b.status === 'adrift') A('drift', 'Driver uten drivstoff', 'Adrift without fuel', 'redning');
    if (b.fuel < BOAT.fuelCap * 0.2) A('fuel', 'Lite drivstoff, ' + fmt(b.fuel, 0) + ' L', 'Low on fuel, ' + fmt(b.fuel, 0) + ' L', 'beholdning:boat');
    if (b.status !== 'port' && catchIce() && b.ice < 1 && holdTotal() > 0) A('ice', 'Tom for is, fangsten ises ikke', 'Out of ice, the catch is not iced', 'beholdning:last');
    if (b.status !== 'port' && holdTotal() >= capHold() - 1) A('full', 'Full last', 'Hold full', 'beholdning:last');
    if (svcOverdue() > 0) A('svc', 'Motorservice er forfalt', 'Engine service overdue', 'verksted');
    if (S.cevt) A('cevt', 'Uløst krangel om bord', 'Unresolved quarrel aboard', 'mannskap');
    for (const c of S.crew) if ((c.low || 0) > 12) A('quit' + c.id, c.name.split(' ')[0] + ' vurderer å slutte', c.name.split(' ')[0] + ' is thinking of quitting', 'mannskap');
    for (const s of (S.sets || []).filter(x => x.vid === S.cur)){ const a = (S.t - s.tSet) / 60;
      if (s.lost) A('lost' + s.id, GEAR[s.kind].no + ' er tapt. Meld tapt redskap', GEAR[s.kind].en + ' lost. Report the lost gear', 'redskap');
      else if (s.kind === 'teine' ? a >= 44 : s.kind === 'line' ? a >= 24 : a >= 48) A('soak' + s.id, GEAR[s.kind].no + ' har stått i ' + fmt(a, 0) + ' t', GEAR[s.kind].en + ' has soaked ' + fmt(a, 0) + ' h', 'beholdning:gear'); }
    if (S.pgear && S.pgear.nets.some(l => l.cond < 0.35)) A('worn', 'Slitte garn bør bøtes', 'Worn nets should be mended', 'beholdning:gear');
    if (o && o.on && !sk) A('ops', 'Driftsplanen mangler skipper', 'The standing plan has no skipper', 'mannskap');
    if (o && o.on && b.status === 'port' && b.port !== o.home) A('opsport', 'Ligger ikke i ' + portById(o.home).name + ', der driftsplanen starter', 'Not at ' + portById(o.home).name + ', where the standing plan starts', 'mannskap');
    if (access() !== 'none'){ const lim = codLimitNow(H); if (lim > 0 && quotaState().torsk >= lim * 0.9) A('quota', 'Torskekvoten er nesten brukt opp', 'The cod quota is nearly used up', 'kvote'); }
    let next = null; if (o && o.on) for (let k = 0; k < 8 && next == null; k++){ const Hd = Math.floor((H + 6) / 24) * 24 - 6 + k * 24 + o.dep, wd = (gDate(Hd).getUTCDay() + 6) % 7; if (o.days[wd] && Hd > H) next = Hd; }
    return {name:S.boatName, type:b.type, status:statusText(), pos:b.status === 'port' ? portById(b.port).name : fieldCode(b.pos) + ' · ' + L('nær ', 'near ') + nearestPort(b.pos).name,
      hold:holdTotal(), cap:capHold(), fuel:b.fuel, fuelCap:BOAT.fuelCap, ice:b.ice, iceCap:BOAT.iceCap, crew:S.crew.length, crewMax:BOAT.crewMax, ops:o, sk, next, inc, al, inPort:b.status === 'port'};
  }
  const summaries = () => S.fleet.map(v => ({v, s:withVessel(v, vSummary)}));
  const alerts = () => summaries().flatMap(x => x.s.al);
  function rederi(){
    const all = summaries(), al = all.flatMap(x => x.s.al), bar = (a, c, k) => '<div class="ph-bar"><i class="' + (k || '') + '" style="width:' + Math.round(clamp(a / Math.max(1, c), 0, 1) * 100) + '%"></i></div>';
    const h = ['<div class="ph-c"><div class="ph-card"><h4>' + (S.company || L('Rederiet', 'The company')) + '</h4>' + kv(L('Båter', 'Vessels'), all.length) + kv(L('Konto', 'Account'), kr(S.cash)) + kv(L('Inntekt i dag', 'Income today'), kr(Math.round(all.reduce((a, x) => a + x.s.inc, 0)))) + '</div>'];
    h.push('<h4 style="margin:10px 2px 6px">' + L('Trenger deg', 'Needs you') + (al.length ? ' (' + al.length + ')' : '') + '</h4>');
    if (!al.length) h.push('<p class="ph-note">' + L('Alt er i orden i flåten.', 'All is well in the fleet.') + '</p>');
    for (const a of al) h.push('<div class="ph-card"><div class="ph-kv"><span><b>«' + vget(vesselById(a.id), 'boatName') + '»</b> ' + L(a.no, a.en) + '</span><span><button class="ph-btn" style="margin:0" data-pa="goto" data-id="' + a.id + '" data-a="' + a.app + '">' + L('Åpne', 'Open') + '</button></span></div></div>');
    h.push('<h4 style="margin:10px 2px 6px">' + L('Flåten', 'The fleet') + '</h4>');
      const meV = vesselById(S.me), meIn = !meV || vget(meV, 'boat').status === 'port';
      for (const {v, s: sm} of all){
        const vb = vget(v, 'boat'), cur = v.id === S.cur, me = v.id === S.me, inp = vb.status === 'port';
        h.push('<div class="ph-card"><h4>«' + vget(v, 'boatName') + '»' + (me ? ' ⚓' : '') + '</h4>' + '<p class="ph-note">' + VESSELS[vb.type].name[S.lang] + '</p>' + kv('Status', sm.status) + kv(L('Posisjon', 'Position'), sm.pos) +
          kv(L('Last', 'Hold'), fmt(sm.hold, 0) + ' / ' + fmt(sm.cap, 0) + ' kg') + bar(sm.hold, sm.cap) + kv(L('Drivstoff', 'Fuel'), fmt(sm.fuel, 0) + ' / ' + sm.fuelCap + ' L') + bar(sm.fuel, sm.fuelCap, sm.fuel < sm.fuelCap * 0.2 ? 'bad' : '') + kv(L('Is', 'Ice'), fmt(sm.ice, 0) + ' / ' + sm.iceCap + ' kg') +
          kv(L('Mannskap', 'Crew'), sm.crew + ' / ' + sm.crewMax) + kv(L('Driftsplan', 'Standing plan'), !sm.ops ? L('ingen', 'none') : sm.ops.on ? (sm.sk ? sm.sk.name.split(' ')[0] + ', ' : '') + (sm.next ? L('neste ', 'next ') + dayStr(sm.next / 60) + ' ' + hm(sm.next / 60) : L('ingen dager valgt', 'no days chosen')) : L('av', 'off')) + kv(L('Inntekt i dag', 'Income today'), kr(Math.round(sm.inc))) +
          '<p class="ph-note">' + L('Adgang: ', 'Access: ') + accessText(v) + '</p>' +
          (me ? '<p class="ph-note">' + L('Du er om bord på denne båten.', 'You are aboard this vessel.') + '</p>' : '') + (cur && S.fleet.length > 1 ? '<p class="ph-note">' + L('Denne båten følger du nå.', 'You are following this vessel.') + '</p>' : '') +
          '<div class="ph-btncol">' + (cur ? '' : '<button class="ph-btn p" data-pa="vfollow" data-id="' + v.id + '">' + L('Følg denne båten', 'Follow this vessel') + '</button>') +
          (me ? '' : '<button class="ph-btn" data-pa="vboard" data-id="' + v.id + '"' + (inp && meIn ? '' : ' disabled') + '>' + L('Gå om bord', 'Go aboard') + '</button>') +
          '<button class="ph-btn alt" data-pa="vname" data-id="' + v.id + '">' + L('Gi nytt navn', 'Rename') + '</button>' +
          (me || S.fleet.length < 2 ? '' : '<button class="ph-btn red" data-pa="vsell" data-id="' + v.id + '"' + (inp && !tiLocked(v) ? '' : ' disabled') + '>' + L('Selg for ', 'Sell for ') + kr(vesselValue(v)) + '</button>') + '</div>' +
          (!me && !(inp && meIn) ? '<p class="ph-note">' + L('For å bytte båt må begge ligge i havn.', 'To change vessel, both must be in port.') + '</p>' : '') + '</div>');
      }
    h.push('</div>'); return h.join('');
  }
  // --- equipment
  function utstyr(){
    const h = ['<div class="ph-c"><p class="ph-note">' + L('Montering skjer i havn. Utstyret følger med om du bytter båt, bortsett fra motoren og utstyr som ikke passer den nye båten.', 'Fitting is done in port. Equipment moves with you if you change vessel, except the engine and equipment that does not suit the new vessel.') + '</p>'];
    // the hold in three steps (core/03-simulation.js HOLDUP)
    { const b = S.boat, lv = b.holdLv || 0, nx = HOLDUP[lv], base = VESSELS[b.type].holdCap, queued = (S.jobs || []).some(j => j.kind === 'hold');
      h.push('<div class="ph-card"><h4>' + L('Større lasterom', 'A bigger hold') + ' (' + lv + '/3)</h4><p>' + L('Lengre lasterom og flere kasser. Tre trinn: +25 %, +60 % og til slutt dobbelt så mye som båten hadde. Mer last gjør båten tyngre.', 'A longer hold and more boxes. Three steps: +25%, +60% and at last twice what the boat had. More load makes her heavier.') + '</p>' +
        kv(L('Nå', 'Now'), fmt(BOAT.holdCap, 0) + ' kg') + (nx ? kv(L('Neste trinn', 'Next step'), fmt(Math.round(base * nx.x), 0) + ' kg · ' + kr(upPrice(nx.pc)) + ' · ' + nx.h + L(' t på verftet', ' h at the yard')) : '') +
        (!nx ? '<p><b>' + L('Fullt ombygd', 'Fully rebuilt') + '</b></p>' : queued ? '<p><b>' + L('På verftet', 'At the yard') + '</b></p>' : '<button class="ph-btn p" data-pa="holdup"' + (!inPort() || S.cash < upPrice(nx.pc) ? ' disabled' : '') + '>' + L('Bygg om · ', 'Rebuild · ') + kr(upPrice(nx.pc)) + '</button>') + '</div>'); }
    // a bigger engine in two steps (core ENGUP; not for an outboard, which has the 90 hp outboard among the equipment)
    { const b = S.boat, V = VESSELS[b.type], lv = b.engLv || 0, nx = ENGUP[lv], queued = (S.jobs || []).some(j => j.kind === 'eng');
      if (!V.outboard){ const P1 = nx ? powerX(Object.assign({}, b, {engLv:lv + 1})) : 0, v1 = nx ? V.vmax * speedOfPower(P1, V.planing) : 0;
        h.push('<div class="ph-card"><h4>' + L('Større motor', 'A bigger engine') + ' (' + lv + '/2)</h4><p>' + L('Mer kraft: +20 % og så +40 % mot motoren båten kom med. Planende båter blir mye raskere. Tunge deplasementsbåter vinner lite toppfart, men holder farten bedre med last. Forbruket øker litt.', 'More power: +20% and then +40% over the boat\'s own engine. Planing boats get much faster. Heavy displacement boats gain little top speed but hold their speed better when loaded. The fuel use rises a little.') + '</p>' +
          kv(L('Nå', 'Now'), BOAT.hp + ' hk · ' + fmt(BOAT.vmax, 1) + ' kn') + (nx ? kv(L('Neste trinn', 'Next step'), Math.round(V.hp * (1 + nx.p)) + ' hk · ' + fmt(v1, 1) + ' kn · ' + kr(upPrice(nx.pc)) + ' · ' + nx.h + L(' t', ' h')) : '') +
          (!nx ? '<p><b>' + L('Største motor er montert', 'The biggest engine is fitted') + '</b></p>' : queued ? '<p><b>' + L('På verftet', 'At the yard') + '</b></p>' : '<button class="ph-btn p" data-pa="engup"' + (!inPort() || S.cash < upPrice(nx.pc) ? ' disabled' : '') + '>' + L('Bytt motor · ', 'Change the engine · ') + kr(upPrice(nx.pc)) + '</button>') + '</div>'); } }
    for (const [k, E] of Object.entries(EQUIP)){
      if (!equipFits(k, S.boat.type)) continue;
      const have = E.multi ? S.equip[k] : S.equip[k] ? 1 : 0, max = E.multi ? BOAT.jukseMax : 1;
      h.push('<div class="ph-card"><h4>' + E.name[S.lang] + (E.multi ? ' (' + have + '/' + max + ')' : '') + '</h4><p>' + E.desc[S.lang] + '</p>' + kv(L('Pris', 'Price'), kr(E.price)) + (have >= max ? '<p><b>' + L('Montert', 'Fitted') + '</b></p>' : (S.jobs || []).some(j => j.kind === 'fit' && j.k === k) ? '<p><b>' + L('Til montering', 'Being fitted') + '</b></p>' : '<button class="ph-btn" data-pa="equip" data-k="' + k + '"' + (inPort() && S.cash >= E.price ? '' : ' disabled') + '>' + L('Kjøp og monter', 'Buy and fit') + ' · ' + fitHours(k) + ' t</button>') + '</div>');
    }
    { const people = 1 + S.crew.length, c = S.clothes || {}, H = S.t / 60, cp = coldPen(H);
      h.push('<h4 style="margin:12px 2px 6px">' + L('Klær til mannskapet', 'Clothes for the crew') + '</h4><p class="ph-note">' + L('Kalde og våte hender fisker dårligere. Nå: effektiv temperatur ' + Math.round(effTemp(H)) + ' °C, fisket går ' + Math.round(cp * 100) + ' % tregere. Alle om bord trenger sine egne klær.', 'Cold, wet hands fish worse. Now: effective temperature ' + Math.round(effTemp(H)) + ' °C, fishing ' + Math.round(cp * 100) + '% slower. Everyone aboard needs their own.') + '</p>');
      for (const k of ['olje', 'varme']){ const C = CLOTHES[k], have = c[k] || 0;
        h.push('<div class="ph-card"><h4>' + C[S.lang] + ' (' + Math.min(have, people) + '/' + people + ')</h4><p>' + C.d[S.lang] + '</p>' + kv(L('Pris', 'Price'), kr(C.price)) + (have >= people ? '<p><b>' + L('Alle om bord har.', 'Everyone aboard has one.') + '</b></p>' : '<button class="ph-btn p" data-pa="cloth" data-k="' + k + '">' + L('Kjøp én', 'Buy one') + '</button>') + '</div>'); } }
    h.push('</div>'); return h.join('');
  }
  // --- gear: in the sea, aboard (baiting and mending), and the shop
  function redskap(tab0){
    const tab = tab0 || sub.redskap || 'sjo', b = S.boat, pg = S.pgear, p = portById(b.port), inPortNow = b.status === 'port';
    const h = ['<div class="ph-c">' + (tab0 ? '' : subs('redskap', [['sjo', 'I sjøen', 'In the sea'], ['bord', 'Om bord', 'Aboard'], ['kjop', 'Kjøp', 'Buy']]))];
    if (tab === 'sjo'){
      const all = (S.sets || []).filter(s => s.vid === S.cur);
      if (!all.length) h.push('<div class="ph-card"><p class="ph-note">' + L('Ingen redskap i sjøen. Trykk «Sett ut» når båten ligger stille på feltet, eller legg setting inn i ruta.', 'No gear in the sea. Tap «Set» when the boat lies still on the grounds, or put the setting into the route.') + '</p></div>');
      for (const s of all){ const st = setState(s);
        h.push('<div class="ph-card' + (st === 'lost' || st === 'late' ? ' conflict' : '') + '"><h4>' + GEAR[s.kind][S.lang] + ', ' + s.n + ' ' + unitName(s.kind, s.n) + '</h4>' +
          kv(L('Satt', 'Set'), dayStr(s.tSet / 60) + ' ' + hm(s.tSet / 60)) + kv(L('Ståtid', 'Soak'), fmt((S.t - s.tSet) / 60, 0) + ' t (' + realDur(S.t - s.tSet) + L(' ekte tid', ' real time') + ') · ' + L(SETST[st][0], SETST[st][1])) + kv(L('Posisjon', 'Position'), coordStr(setMid(s)) + ', ' + s.depth + ' m') +
          (s.kind === 'garn' ? kv(L('Maskevidde og stand', 'Mesh and condition'), s.mesh + ' mm · ' + Math.round((s.cond || 1) * 100) + ' %') : '') + (s.heavy ? kv(L('Dregg', 'Anchor'), L('tung', 'heavy')) : '') +
          (!s.lost && ['idle', 'port', 'sailing'].includes(b.status) ? '<button class="ph-btn p" data-pa="goset" data-id="' + s.id + '">' + L('Kjør dit', 'Go there') + ' · ' + fmt(Math.min(dist(b.pos, s.a), dist(b.pos, s.b)) / NM, 1) + ' nm</button>' : '') +
          (s.lost ? '<p class="ph-note">' + L('Blåsene er borte. Tapt redskap skal meldes til Kystvakten med type, mengde og siste posisjon.', 'The buoys are gone. Lost gear must be reported to the Coast Guard with type, amount and last position.') + '</p><button class="ph-btn p" data-pa="grrep" data-id="' + s.id + '">' + L('Meld tapt redskap', 'Report lost gear') + '</button>' : '') + '</div>'); }
      h.push('<p class="ph-note">' + L('Line er best innen et døgn. Etter 24 timer tar marfloen fisken. Teiner bør stå minst 20 timer og trekkes innen 48. Garn trekkes helst hver dag. Om sommeren går fisken fort i garnet.', 'Line is best within a day. After 24 hours the amphipods take the fish. Pots should stand at least 20 hours and be hauled within 48. Nets are best hauled daily. In summer the fish spoils fast in the net.') + '</p>');
    } else if (tab === 'bord'){
      h.push('<div class="ph-card"><h4>' + L('Garn', 'Nets') + '</h4>' + (pg.nets.length ? '' : '<p class="ph-note">' + L('Ingen garn om bord.', 'No nets aboard.') + '</p>'));
      for (const l of pg.nets){ h.push('<div class="ph-kv"><span>' + l.n + ' garn ' + l.mesh + ' mm</span><span>' + Math.round(l.cond * 100) + ' %</span></div><div class="ph-bar"><i style="width:' + Math.round(l.cond * 100) + '%"></i></div>');
        if (inPortNow && l.cond < 0.9) h.push('<div class="ph-btncol"><button class="ph-btn" data-pa="grmend" data-id="' + l.id + '" data-m="self">' + L('Bøt selv', 'Mend yourselves') + '</button>' + (botPort(p) ? '<button class="ph-btn" data-pa="grmend" data-id="' + l.id + '" data-m="bot">' + L('Lever til bøteriet', 'Leave at the net loft') + ' (' + kr(Math.round(GPRICE.bot * l.n * (0.95 - l.cond) / 0.1)) + ')</button>' : '') + '</div>');
        if (l.n >= 2) h.push('<button class="ph-btn alt" data-pa="grsplit" data-id="' + l.id + '">' + L('Del lenka i to', 'Split the string') + '</button>'); }
      if (pg.nets.length >= 2){ const m = {}; for (const l of pg.nets) (m[l.mesh] = m[l.mesh] || []).push(l); for (const k in m) if (m[k].length >= 2) h.push('<button class="ph-btn alt" data-pa="grjoin" data-a="' + m[k][0].id + '" data-b="' + m[k][1].id + '">' + L('Slå sammen lenker på ' + k + ' mm', 'Join strings of ' + k + ' mm') + '</button>'); }
      h.push('</div><div class="ph-card"><h4>' + L('Line', 'Line') + '</h4>');
      for (const lk of ['hyse', 'bank']){ const L0 = pg.lines[lk], un = L0.n - L0.baited; if (!L0.n) continue;
        h.push(kv(LINE_KINDS[lk][S.lang], L0.n + ' ' + L('stamper', 'tubs') + ', ' + L0.baited + ' ' + L('egnet', 'baited')));
        if (inPortNow && un > 0) h.push('<div class="ph-btncol">' + (egnPort(p) ? '<button class="ph-btn p" data-pa="gregn" data-lk="' + lk + '" data-n="' + un + '" data-m="shed">' + L('Egnebua egner ' + un, 'The shed baits ' + un) + ' (' + kr(un * (LINE_KINDS[lk].egn + LINE_KINDS[lk].baitKg * BAITS[BAITS[pg.baitPref] ? pg.baitPref : 'makrell'].kr)) + ')</button>' : '') +
          '<button class="ph-btn" data-pa="gregn" data-lk="' + lk + '" data-n="' + un + '" data-m="self">' + L('Egn ' + un + ' selv', 'Bait ' + un + ' yourselves') + ' (' + fmt(un * LINE_KINDS[lk].baitKg, 0) + ' kg ' + L('agn', 'bait') + ')</button></div>'); }
      if (!pg.lines.hyse.n && !pg.lines.bank.n) h.push('<p class="ph-note">' + L('Ingen line om bord.', 'No line aboard.') + '</p>');
      h.push('</div><div class="ph-card"><h4>' + L('Teiner, blåser og agn', 'Pots, buoys and bait') + '</h4>' + kv(POTS.small[S.lang], pg.pots.small) + kv(POTS.big[S.lang], pg.pots.big) + kv(L('Blåsesett', 'Buoy sets'), pg.kits.n + (pg.kits.heavy ? ' (' + pg.kits.heavy + ' ' + L('med tung dregg', 'with heavy anchor') + ')' : '')) + kv(L('Agn', 'Bait'), fmt(baitKg(pg), 0) + ' kg') + '</div>');
      const shore = pg.shore.filter(j => j.ready); if (shore.length) h.push('<div class="ph-card"><h4>' + L('På land', 'Ashore') + '</h4>' + shore.map(j => kv(j.kind === 'egn' ? j.n + ' ' + L('stamper i egnebua', 'tubs at the baiting shed') : j.n + ' ' + L('garn på bøteriet', 'nets at the net loft'), portById(j.port).name + ', ' + L('klar ', 'ready ') + (S.t >= j.ready ? L('nå', 'now') : hm(j.ready / 60)))).join('') + '</div>');
    } else {
      // quantities follow the room aboard: a skiff gets fewer nets per button than a sjark
      const room = k => gearRoom(k), cap = w => w === 'net' ? room('garn') : w === 'stamp' ? room('line') : w === 'pot' ? room('teine') : 1e9;
      const buy = (w, s, n0, lbl, unit) => { const n = Math.max(1, Math.min(n0, cap(w))), price = n * unit, ok = cap(w) >= 1 && price <= S.cash && inPortNow;
        return '<button class="ph-btn' + (ok ? ' p' : '') + '"' + (ok ? '' : ' disabled') + ' data-pa="grbuy" data-w="' + w + '" data-s="' + s + '" data-n="' + n + '">' + lbl(n) + ' (' + kr(price) + ')</button>'; };
      if (!inPortNow) h.push('<div class="ph-card"><p class="ph-note">' + L('Redskap kjøpes i havn.', 'Gear is bought in port.') + '</p></div>');
      h.push('<div class="ph-card"><h4>' + L('Torskegarn', 'Cod nets') + '</h4><p>' + L('Garn settes i lenker mellom to blåser. 156 mm er vanlig torskegarn, 180 og 200 mm tar større fisk som skrei. Minste lovlige maskevidde nord for 62° N er 156 mm. Garn krever minst to om bord. Plass til ', 'Nets are set in strings between two buoys. 156 mm is the usual cod net; 180 and 200 mm take bigger fish such as skrei. The smallest legal mesh north of 62° N is 156 mm. Nets need at least two aboard. Room for ') + room('garn') + L(' til.', ' more.') + '</p><div class="ph-btncol">' + MESHES.map(m => buy('net', m, 10, n => n + L(' garn ', ' nets ') + m + ' mm', GPRICE.net)).join('') + '</div></div>');
      h.push('<div class="ph-card"><h4>' + L('Line', 'Line') + '</h4><p>' + L('Hyseline har ca. 700 kroker per stamp og tar mest hyse. Bankline har ca. 300 større kroker og tar lange, brosme og kveite. Lina må egnes i havn. Plass til ', 'Haddock line has about 700 hooks a tub and takes mostly haddock. Bank line has about 300 bigger hooks and takes ling, tusk and halibut. The line must be baited in port. Room for ') + room('line') + L(' stamper til.', ' more tubs.') + '</p><div class="ph-btncol">' + ['hyse', 'bank'].map(lk => buy('stamp', lk, 4, n => n + (n === 1 ? L(' stamp ', ' tub of ') : L(' stamper ', ' tubs of ')) + LINE_KINDS[lk][S.lang].toLowerCase(), LINE_KINDS[lk].price)).join('') + '</div></div>');
      h.push('<div class="ph-card"><h4>' + L('Teiner', 'Pots') + '</h4><p>' + L('For taskekrabbe i juli–oktober, mest sør på Senja. Store teiner fanger mer, men krever teinehaler. Plass til ', 'For brown crab in July–October, mostly south on Senja. Big pots catch more but need a pot hauler. Room for ') + room('teine') + L(' til.', ' more.') + '</p><div class="ph-btncol">' + buy('pot', 'small', 20, n => n + ' ' + POTS.small[S.lang].toLowerCase(), POTS.small.price) + buy('pot', 'big', 20, n => n + ' ' + POTS.big[S.lang].toLowerCase(), POTS.big.price) + '</div></div>');
      h.push('<div class="ph-card"><h4>' + L('Blåser, dregg og agn', 'Buoys, anchors and bait') + '</h4><p>' + L('Hvert sett i sjøen trenger et blåsesett: to blåser med stake, flagg og dregg. Tung dregg holder bedre i storm og strøm.', 'Each set in the sea needs a buoy set: two buoys with pole, flag and anchor. A heavy anchor holds better in storm and current.') + '</p><div class="ph-btncol">' +
        buy('kit', 0, 1, () => L('Blåsesett', 'Buoy set'), GPRICE.kit) + (pg.kits.heavy < pg.kits.n ? buy('heavy', 0, 1, () => L('Tung dregg', 'Heavy anchor'), GPRICE.heavy) : '') + buy('bait', 0, 20, () => L('20 kg agn', '20 kg bait'), GPRICE.bait) + buy('bait', 0, 100, () => L('100 kg agn', '100 kg bait'), GPRICE.bait) + '</div></div>');
      h.push('<p class="ph-note">' + L('Halere finner du under Verft, Oppgraderinger. Prisene er foreløpige.', 'Haulers are under Yard, Upgrades. Prices are provisional.') + '</p>');
    }
    return h.join('') + '</div>';
  }
  // --- crew
  const NAMES = ['Ole Martin', 'Kari', 'Stian', 'Ingrid', 'Tor Arne', 'Siri', 'Mats', 'Hanne', 'Eirik', 'Marit', 'Sondre', 'Tone', 'Håkon', 'Line', 'Vegard', 'Silje'];
  const LEVELS = [{no:'lærling', en:'apprentice', skill:0.75, share:0.1}, {no:'erfaren', en:'experienced', skill:1.0, share:0.16}, {no:'dreven', en:'seasoned', skill:1.2, share:0.21}];
  function candidates(){ const w = weekOf(S.t / 60); return [0, 1, 2].map(i => { const r = h2(w * 3 + i, 4242), lv = LEVELS[Math.floor(h2(w * 3 + i, 4243) * 3)], nm = NAMES[Math.floor(r * NAMES.length)]; return {id:'c' + w + '_' + i, name:nm, age:18 + Math.floor(h2(w * 3 + i, 4244) * 44), lv:lv.no, lvEn:lv.en, skill:lv.skill, share:lv.share}; }).filter(c => !S.crew.some(x => x.id === c.id)); }
  // --- the crew, person by person
  const stars = (v, approx) => { const n = Math.round(clamp(v, 1, 5)); return '<span class="stars' + (approx ? ' apx' : '') + '">' + (approx ? '~' : '') + '★'.repeat(n) + '☆'.repeat(5 - n) + '</span>'; };
  const bar2 = (v, col) => '<div class="qbar"><i style="width:' + clamp(v, 0, 100).toFixed(0) + '%;background:' + col + '"></i></div>';
  const moodCol = v => v >= 65 ? '#35b37e' : v >= 40 ? '#f2b705' : '#e5484d';
  function traitChips(c, all){ return c.traits.map((t, i) => (all || c.known[i]) ? '<span class="chip" title="' + TRAITS[t].d[S.lang] + '">' + TRAITS[t][S.lang] + '</span>' : '<span class="chip unk">?</span>').join(''); }
  function personCard(c, cand){
    const apx = !!cand, A = c.attr, full = !cand || c.known[1];
    return '<div class="ph-card crewc"><h4>' + c.name + ', ' + c.age + '</h4><p class="ph-note">' + c.home + ' · ' + (c.bi ? L('biyrke, fredag–søndag', 'part-time, Friday–Sunday') : L('hovedyrke', 'full-time')) + ' · ' + c.yrs + L(' år på sjøen', ' years at sea') + '</p>' +
      '<div class="crewgrid">' + ATTR.map(([k, no, en]) => '<span>' + L(no, en) + '</span>' + stars(A[k], apx)).join('') + '</div>' +
      '<div class="crewgear">' + GEARS.map(([k, no, en]) => '<span class="chip g">' + L(no, en) + ' ' + Math.round(c.gear[k]) + '</span>').join('') + '</div>' +
      '<div class="crewtr">' + traitChips(c, !cand) + '</div>' + (cand ? '<p class="ph-note">' + TRAITS[c.traits[0]].d[S.lang] + (full ? '' : ' ' + L('Resten ser du når dere har vært på sjøen sammen.', 'The rest you will see once you have been at sea together.')) + '</p>' : '') + '</div>';
  }
  function bors(){
    borsTick(S.t / 60); const B = S.bors, max = BOAT.crewMax, room = S.crew.length < max, inp = S.boat.status === 'port';
    const h = ['<div class="ph-c"><p class="ph-note">' + L('Her søker fiskere hyre. De forteller om erfaringen sin, men noen sider ser du først når dere har vært på sjøen sammen, og stjernene er et anslag til da. Mønstring skjer i havn.', 'Fishers looking for a berth. They tell you about their experience, but some sides you only see after time at sea together, and the stars are an estimate until then. Signing on is done in port.') + '</p>' +
      '<div class="ph-card">' + (S.fleet.length > 1 ? kv(L('Ansetter til', 'Hiring for'), '«' + S.boatName + '»') : '') + kv(L('Om bord', 'Aboard'), S.crew.length + ' / ' + max) + (skreiSeason(S.t / 60) ? '<p class="ph-note">' + L('Skreisesong: alle båter trenger folk, så det er få ledige og de vil ha mer i lott.', 'Skrei season: every boat needs hands, so few are free and they want a bigger share.') + '</p>' : '') + '</div>'];
    if (!B.pool.length) h.push('<p class="ph-note">' + L('Ingen ledige akkurat nå. Nye kommer om morgenen.', 'Nobody free right now. New people come in the morning.') + '</p>');
    for (const c of B.pool){
      h.push(personCard(c, true).replace(/<\/div>$/, kv(L('Vil ha i lott', 'Wants as share'), Math.round(c.ask * 100) + ' %') + kv(L('Søker hyre til', 'Looking until'), dayStr(c.until / 60)) +
        '<div class="ph-row2"><button class="ph-btn p" data-pa="bhire" data-id="' + c.id + '"' + (room && inp ? '' : ' disabled') + '>' + L('Ansett', 'Hire') + ' · ' + Math.round(c.ask * 100) + ' %</button>' + (c.neg ? '' : '<button class="ph-btn" data-pa="bneg" data-id="' + c.id + '"' + (room && inp ? '' : ' disabled') + '>' + L('Forhandle ned', 'Negotiate') + '</button>') + '</div>' + (!inp ? '<p class="ph-note">' + L('Mønstring skjer i havn.', 'Signing on is done in port.') + '</p>' : !room ? '<p class="ph-note">' + L('Båten har ikke plass til flere.', 'The boat has no room for more.') + '</p>' : '') + '</div>'));
    }
    h.push('</div>'); return h.join('');
  }
  function mannskap(){
    S.crew = S.crew.map(crewUpgrade);
    const max = BOAT.crewMax, h = ['<div class="ph-c"><p class="ph-note">' + L('Mannskapet får lott: en andel av fangstverdien ved hver landing. Flere hender betyr flere snører i sjøen og flere juksamaskiner i drift.', 'The crew is paid a share of the catch value at each landing. More hands means more lines in the water and more jigging reels running.') + '</p>'];
    h.push('<div class="ph-card"><h4>«' + S.boatName + '»' + (meAboard() ? ' ⚓' : '') + '</h4>' + '<p class="ph-note">' + L('Adgang: ', 'Access: ') + accessText(curVessel()) + '</p>' + (meAboard() ? '' : '<p class="ph-note">' + L('Du er ikke om bord. Båten kan bare gå ut med eget mannskap.', 'You are not aboard. The vessel can only go out with crew of her own.') + '</p>') + '</div>');
    { const H = S.t / 60, ev = S.cevt, A = ev && crewById(ev.a), Bc = ev && crewById(ev.b);
      if (ev && A){ const tx = (ev.type === 'pair' ? PAIR_TOPICS : BOSS_TOPICS)[ev.topic][S.lang].replace('{a}', A.name).replace('{b}', Bc ? Bc.name : '');
        h.push('<div class="ph-card conflict"><h4>' + (ev.type === 'pair' ? L('Krangel om bord', 'A quarrel aboard') : L('Misnøye', 'Discontent')) + '</h4><p>' + tx + '</p>' + (ev.esc ? '<p class="ph-note">' + L('Det har gått en stund, og stemningen er blitt verre.', 'It has been a while, and the mood has got worse.') + '</p>' : '') + '<div class="ph-btncol">' +
          (ev.type === 'pair' ? '<button class="ph-btn p" data-pa="cres" data-o="talk">' + L('Snakk med dem begge', 'Talk to them both') + '</button><button class="ph-btn" data-pa="cres" data-o="sideA">' + L('Gi ' + A.name.split(' ')[0] + ' rett', 'Side with ' + A.name.split(' ')[0]) + '</button><button class="ph-btn" data-pa="cres" data-o="sideB">' + L('Gi ' + Bc.name.split(' ')[0] + ' rett', 'Side with ' + Bc.name.split(' ')[0]) + '</button><button class="ph-btn" data-pa="cres" data-o="offB">' + L('Gi ' + Bc.name.split(' ')[0] + ' fri neste tur', 'Give ' + Bc.name.split(' ')[0] + ' the next trip off') + '</button><button class="ph-btn alt" data-pa="cres" data-o="fireB">' + L('Si opp ' + Bc.name.split(' ')[0], 'Let ' + Bc.name.split(' ')[0] + ' go') + '</button>'
            : '<button class="ph-btn p" data-pa="cres" data-o="listen">' + ({lott:L('Øk lotten med 1 %', 'Raise the share by 1%'), hvile:L('Lov en hviletur', 'Promise a trip off'), vaer:L('Lov å være forsiktig', 'Promise to be careful'), kulde:L('Lov bedre klær', 'Promise better clothes'), generelt:L('Hør på det som sies', 'Listen to what is said')})[ev.topic] + '</button><button class="ph-btn" data-pa="cres" data-o="firm">' + L('Stå på ditt', 'Stand firm') + '</button><button class="ph-btn alt" data-pa="cres" data-o="fireA">' + L('Si opp ' + A.name.split(' ')[0], 'Let ' + A.name.split(' ')[0] + ' go') + '</button>') + '</div></div>'); }
      h.push('<h4 style="margin:10px 2px 4px">' + L('Om bord', 'On board') + ' (' + S.crew.length + '/' + max + ')</h4>');
      if (!S.crew.length) h.push('<p class="ph-note">' + L('Ingen mannskap ennå. Finn folk i Mannskapsbørsen.', 'No crew yet. Find people in the crew exchange.') + '</p>');
      for (const c of S.crew){ const wd = (gDate(H).getUTCDay() + 6) % 7, away = c.off ? L('har fri neste tur', 'has the next trip off') : (c.bi && !c.biDays[wd]) ? L('biyrke, ikke om bord i dag', 'part-time, not aboard today') : '';
        h.push(personCard(c, false).replace('</h4>', ' · ' + L(c.lv, c.lvEn) + '</h4>').replace('<div class="crewgrid">', '<div class="ph-kv"><span>' + L('Trivsel', 'Morale') + '</span><span>' + Math.round(c.morale) + '</span></div>' + bar2(c.morale, moodCol(c.morale)) + '<div class="ph-kv"><span>' + L('Slitenhet', 'Fatigue') + '</span><span>' + Math.round(c.fatigue) + '</span></div>' + bar2(c.fatigue, c.fatigue > 70 ? '#e5484d' : '#4c8df0') + (c.pay === 'hyre' ? kv(L('Hyre', 'Wage'), kr(c.hyre) + L(' per dag', ' a day')) : kv(L('Lott', 'Share'), Math.round(c.share * 100) + ' %' + (c.share < c.ask - 0.001 ? ' · ' + L('ønsket ', 'wanted ') + Math.round(c.ask * 100) + ' %' : ''))) + (away ? '<p class="ph-note">' + away + '</p>' : '') + '<div class="crewgrid">').replace(/<\/div>$/, '<div class="ph-row2"><button class="ph-btn" data-pa="coff" data-id="' + c.id + '">' + (c.off ? L('Tilbake om bord', 'Back aboard') : L('Gi fri neste tur', 'Next trip off')) + '</button><button class="ph-btn alt" data-pa="cpay" data-id="' + c.id + '">' + (c.pay === 'hyre' ? L('Over på lott', 'To a share') : L('Over på hyre (' + kr(hyreAsk(c)) + '/dag)', 'To a wage (' + kr(hyreAsk(c)) + '/day)')) + '</button><button class="ph-btn alt" data-pa="cfire" data-id="' + c.id + '">' + L('Si opp', 'Let go') + '</button></div></div>')); }
      if (S.crew.length >= 2){ const pr = []; for (let i = 0; i < S.crew.length; i++) for (let j = i + 1; j < S.crew.length; j++){ const k = compat(S.crew[i], S.crew[j]); pr.push('<div class="ph-kv"><span>' + S.crew[i].name.split(' ')[0] + ' og ' + S.crew[j].name.split(' ')[0] + '</span><span>' + (k >= 1 ? L('😊 god', '😊 good') : k <= -2 ? L('😠 dårlig', '😠 poor') : L('😐 grei', '😐 fair')) + '</span></div>'); }
        h.push('<div class="ph-card"><h4>' + L('Kjemi', 'Chemistry') + '</h4>' + pr.join('') + '<p class="ph-note">' + L('Dårlig kjemi gir krangler, særlig når folk er slitne eller misfornøyde.', 'Poor chemistry leads to quarrels, especially when people are tired or unhappy.') + '</p></div>'); }
      // the rest rule person by person: hours of rest in the last day and week, and how long until a rule is broken
      if (S.crew.length) h.push('<div class="ph-card"><h4>' + L('Hvile', 'Rest') + '</h4>' + S.crew.map(c => { const r = restLog(c), d = r.slice(-24).reduce((a, v) => a + v, 0), wk = r.reduce((a, v) => a + v, 0), left = S.boat.status === 'port' ? 24 : restLeft(c);
          return kv(c.name.split(' ')[0], d + L(' t i døgnet · ', ' h a day · ') + wk + L(' t i uka', ' h a week') + (left <= 6 ? ' · <span class="' + (left ? 'r1' : 'r2') + '">' + (left ? L('hvile innen ' + left + ' t', 'rest within ' + left + ' h') : L('brudd', 'broken')) + '</span>' : '')); }).join('') +
        '<p class="ph-note">' + L('Forskrift om arbeids- og hviletid på fiskefartøy krever minst 10 timer hvile i døgnet og 77 i uka, hvilen i høyst to perioder der én er minst 6 timer, og høyst 14 timer mellom hvileperiodene.', 'The working-time rules for fishing vessels require at least 10 hours of rest a day and 77 a week, the rest in at most two periods with one of at least 6 hours, and at most 14 hours between rest periods.') + ' ' + (BOAT.berths ? L('Båten har ' + BOAT.berths + ' køyer, så pause om bord teller som hvile.', 'The boat has ' + BOAT.berths + ' berths, so a break aboard counts as rest.') : L('Båten har ingen køyer, så bare tid ved kai teller som hvile.', 'The boat has no berths, so only time at the quay counts as rest.')) + '</p></div>'); }
    { const o = S.ops;
      if (!o) h.push('<div class="ph-card"><h4>' + L('Fast driftsplan', 'Standing plan') + '</h4><p class="ph-note">' + L('Legg en rute i kartplotteren som starter og slutter i havn, med fisketid på feltene, og trykk «Lagre som fast driftsplan». Da kan en skipper fra mannskapet kjøre den for deg, levere fangsten og fylle opp båten.', 'Plan a route in the plotter that starts and ends in port, with fishing time on the grounds, and press "Save as standing plan". A skipper from your crew can then run it for you, land the catch and restock the boat.') + '</p></div>');
      else {
        const sk = opsSkipper(), days = S.lang === 'no' ? OPS_DAYS_NO : OPS_DAYS_EN, fh = o.wps.reduce((a, w) => a + (w.fish || 0), 0);
        h.push('<div class="ph-card"><h4>' + L('Fast driftsplan', 'Standing plan') + '</h4>' +
          '<div class="ph-kv"><span>' + L('Status', 'Status') + '</span><span><button data-pa="ops_on" class="' + (o.on ? 'on' : '') + '">' + (o.on ? L('På', 'On') : L('Av', 'Off')) + '</button></span></div>' +
          kv(L('Rute', 'Route'), portById(o.home).name + ' → ' + (o.wps.length - 1) + ' ' + L('punkter', 'points') + ' → ' + portById(o.end).name) + kv(L('Fisketid', 'Fishing time'), fh + ' t') + kv(L('Varighet', 'Duration'), L('ca. ', 'about ') + o.hours + ' t') +
          '<div class="ph-kv"><span>' + L('Avgang', 'Departure') + '</span><span><button data-pa="ops_dep" data-d="-1">−</button> ' + String(o.dep).padStart(2, '0') + ':00 <button data-pa="ops_dep" data-d="1">+</button></span></div>' +
          '<div class="ph-kv"><span>' + L('Dager', 'Days') + '</span><span class="ops-days">' + days.map((d, i) => '<button data-pa="ops_day" data-i="' + i + '" class="' + (o.days[i] ? 'on' : '') + '">' + d + '</button>').join('') + '</span></div>' +
          '<div class="ph-kv"><span>' + L('Maks vind', 'Max wind') + '</span><span><button data-pa="ops_w" data-d="-1">−</button> ' + o.maxWind + ' m/s <button data-pa="ops_w" data-d="1">+</button></span></div>' +
          '<div class="ph-kv"><span>' + L('Skipper', 'Skipper') + '</span><span>' + (S.crew.length ? S.crew.map(c => '<button data-pa="ops_sk" data-id="' + c.id + '" class="' + (o.skipper === c.id ? 'on' : '') + '">' + c.name.split(' ')[0] + '</button>').join(' ') : L('Ansett noen først', 'Hire someone first')) + '</span></div>' +
          (S.lic ? '' : '<p class="ph-note">' + L('Er du selv om bord, er du høvedsmann, og turen fisker på kvoten din som når du kjører selv. Skipperen er da vanlig mannskap. En ansatt skipper kan ikke fiske torsk, hyse og sei for deg i åpen gruppe eller uten adgang, så når han går alene, fisker han kveite hvis båten har kveiteutstyr, ellers andre arter. Torsk, hyse og sei over 10 % av landingen blir da inndratt.', 'If you are aboard yourself, you are the master, and the trip fishes on your quota as when you run it yourself. The skipper is then ordinary crew. A hired skipper cannot fish cod, haddock and saithe for you in the open group or without access, so when he goes alone he fishes halibut if the boat has halibut gear, otherwise other species. Cod, haddock and saithe above 10% of the landing is then confiscated.') + '</p>') +
          '<p class="ph-note">' + (sk ? L(sk.name + ' (' + sk.lv + ') kjører planen. Når han går alene, blir fangsten ' + Math.round(sk.skill * 90) + ' % av det du får selv, og han får 5 % tillegg i lott.', sk.name + ' (' + sk.lvEn + ') runs the plan. When he goes alone, the catch is ' + Math.round(sk.skill * 90) + '% of what you would get yourself, and he gets a 5% bonus share.') : L('Velg en skipper for å kunne slå på planen.', 'Choose a skipper to switch the plan on.')) + '</p></div>');
      } }
    h.push('<div class="ph-card"><h4>' + L('Trenger du folk?', 'Need hands?') + '</h4><p class="ph-note">' + L('Ledige fiskere finner du i Mannskapsbørsen.', 'Available fishers are in the crew exchange.') + '</p><button class="ph-btn p" data-pa="open" data-a="bors">' + L('Åpne Mannskapsbørsen', 'Open the crew exchange') + '</button></div>');
    return h.join('');
  }
  // --- bank
  function bank(){
    const Lo = S.loan, h = ['<div class="ph-c"><div class="ph-card"><p class="ph-note">' + L('Brukskonto', 'Current account') + '</p><div class="ph-big">' + kr(S.cash) + '</div></div>'];
    const loanCard = (k, title) => { const Q = S[k]; return '<div class="ph-card"><h4>' + title + '</h4>' + kv(L('Restgjeld', 'Balance'), kr(Q.bal)) + kv(L('Rente', 'Interest'), fmt(Q.rate * 100, 1) + ' %') + kv(L('Terminbeløp', 'Monthly payment'), kr(Q.pay)) + kv(L('Neste trekk', 'Next payment'), dayStr(Q.next / 60)) + '<button class="ph-btn" data-pa="repay" data-k="' + k + '"' + (S.cash >= 10000 ? '' : ' disabled') + '>' + L('Innbetal 10 000 kr', 'Pay NOK 10 000') + '</button><button class="ph-btn alt" data-pa="repayAll" data-k="' + k + '"' + (S.cash >= Q.bal ? '' : ' disabled') + '>' + L('Innfri lånet', 'Pay off the loan') + '</button></div>'; };
    if (S.loanIN) h.push(loanCard('loanIN', L('Risikolån, Innovasjon Norge', 'Risk loan, Innovasjon Norge')));
    if (Lo){ h.push(loanCard('loan', L('Båtlån, Kystbanken', 'Vessel loan, Kystbanken'))); }
    else h.push('<div class="ph-card"><h4>' + L('Båtlån', 'Vessel loan') + '</h4><p>' + L('Kystbanken finansierer inntil 80 % av båtprisen mot pant i flåten, over 10 år (15 år for båt med hjemmel), rente 6,9 %. Selger eller bytter du inn en båt, går pengene først til å innfri lånet. Søk direkte fra Båthandel under Verft når du kjøper.', 'Kystbanken finances up to 80% of the price secured on the fleet, over 10 years (15 for a boat with a right), at 6.9%. If you sell or trade in a vessel, the money first pays off the loan. Apply straight from the boat market in the yard when you buy.') + '</p></div>');
    h.push('<div class="ph-card"><h4>' + L('Regnskap', 'Accounts') + '</h4>' + kv(L('Inntekter', 'Revenue'), kr(S.stats.revenue)) + kv(L('Kostnader', 'Costs'), kr(S.stats.costs)) + kv(L('Resultat', 'Result'), kr(S.stats.revenue - S.stats.costs)) + '</div></div>');
    return h.join('');
  }
  // --- messages
  function meld(){
    const h = ['<div class="ph-c">'];
    if (!S.msgs.length) h.push('<p class="ph-note">' + L('Ingen meldinger.', 'No messages.') + '</p>');
    S.msgs.slice().reverse().forEach(m => h.push('<div class="ph-msg' + (m.read ? '' : ' new') + '"><time>' + dayStr(m.t / 60).replace(/^\S+ /, '') + ' ' + hm(m.t / 60) + '</time><b>' + m.from + '</b><p>' + (S.lang === 'no' ? m.no : m.en) + '</p></div>'));
    S.msgs.forEach(m => m.read = true); setTimeout(setBadge, 0);
    h.push('</div>'); return h.join('');
  }
  // --- actions
  function switchVessel(k){
    const b = S.boat, old = VESSELS[b.type];
    b.type = k; for (const q of Object.keys(EQUIP)) if (!equipFits(q, k)) S.equip[q] = EQUIP[q].multi ? Math.min(S.equip[q] || 0, VESSELS[k].jukseMax || 0) : false; applyVessel(); loreNewBoat(S.boatName);
    S.equip.jukse = Math.min(S.equip.jukse, BOAT.jukseMax); b.fuel = BOAT.fuelCap * 0.4; b.ice = 0; b.engH = 0; b.svcAt = 0; S.svcTold = false;
    while (S.crew.length > BOAT.crewMax) S.crew.pop();
    if (!S.owned.includes(k)) S.owned.push(k);
    log('Overtok ' + VESSELS[k].name.no + '. ' + old.name.no + ' er solgt.', 'Took over the ' + VESSELS[k].name.en + '. The ' + old.name.en + ' has been sold.');
    if (typeof G3 !== 'undefined') G3.vesselChanged();
  }
  const NAV = new Set(['open', 'home', 'back', 'close', 'lang', 'sub', 'shop0', 'shopgear', 'salgW', 'vsel', 'goto', 'vfollow', 'vboard', 'vname', 'vsell']);
  function act(a, d){
    const was = app, done = SEL_APPS.includes(app) && !NAV.has(a) ? withSel(() => act0(a, d)) : act0(a, d);
    // a link to a page that lives in the drawer now (Neste mål, Rederi's «Åpne») closes the phone and opens the drawer
    if (DRAWER.has(String(app).split(':')[0])){ const to = app; app = DRAWER.has(was) ? 'home' : was; show(false); DOCK.open(to); return; }
    if (done) { save(); renderHud(); renderClock(); panelDirty = true; render(); }
  }
  function act0(a, d){
    const b = S.boat;
    if (a !== 'shop') shopPend = null;
    if (a === 'open'){ app = d.a; confirmMayday = false; }
    else if (a === 'home'){ app = 'home'; }
    else if (a === 'back'){ app = 'home'; }
    else if (a === 'shop'){ const k = d.k, kg = +d.kg || 0; if (!shopPend || shopPend.k !== k || shopPend.kg !== kg){ shopPend = {k, kg}; return true; } shopPend = null; const free = tutFree(k), why = shopBuy(k, kg, free); if (why){ toast(L(why[0], why[1])); } else if (free) tutMark('free_' + k); }
    else if (a === 'shop0'){ }
    else if (a === 'shopgear'){ app = 'redskap'; sub.redskap = 'kjop'; }
    else if (a === 'close'){ show(false); return; }
    else if (a === 'lang'){ S.lang = S.lang === 'no' ? 'en' : 'no'; refreshAll(); }
    else if (a === 'q3d'){ S.settings.q3d = d.v; if (typeof G3 !== 'undefined' && G3.quality) G3.quality(d.v); }
    else if (a === 'fpsShow'){ S.settings.fpsShow = d.v === '1'; }
    else if (a === 'snd'){ const v = +d.v; S.settings.sound = v > 0; if (v > 0){ S.settings.vol = v; SND.start(); } }
    else if (a === 'manual'){ S.settings.manual = d.v === '1'; if (!S.settings.manual) helmOff(); }
    else if (a === 'admPace'){ S.mult = +d.v; $('pace').value = String(S.mult); }
    else if (a === 'admCash'){ S.cash += 100000; log('Admin: 100 000 kr lagt i kassa.', 'Admin: NOK 100,000 put in the cash.'); }
    else if (a === 'saveOut'){ saveCode().then(c => { saveBox = {mode:'out', text:c || ''}; render(); const ta = document.getElementById('saveCode'); if (ta){ ta.focus(); ta.select(); } if (c && navigator.clipboard) navigator.clipboard.writeText(c).then(() => toast(L('Lagringen er kopiert.', 'The save is copied.'))).catch(() => {}); }); return; }
    else if (a === 'saveIn'){ saveBox = {mode:'in', text:''}; }
    else if (a === 'saveLoad'){ const ta = document.getElementById('saveCode'); loadCode(ta ? ta.value : '').then(() => { toast(L('Spillet er lest inn. Siden lastes på nytt.', 'The game is read in. The page loads again.')); setTimeout(() => location.reload(), 700); }).catch(() => toast(L('Koden kunne ikke leses.', 'The code could not be read.'))); return; }
    else if (a === 'admEnergy'){ S.adm = S.adm || {}; S.adm.noEnergy = !S.adm.noEnergy;
      if (S.adm.noEnergy){ S.sleep = null; S.energy = 100; S.drowsy = false; S.enWarn = false; log('Admin: energien er skrudd av. Du blir ikke sliten og sovner ikke.', 'Admin: energy is off. You do not tire or fall asleep.'); }
      else log('Admin: energien er skrudd på igjen.', 'Admin: energy is on again.'); }
    else if (a === 'admFuel'){ const b = S.boat, add = Math.max(0, BOAT.fuelCap - b.fuel); b.fuel = BOAT.fuelCap; if (b.status === 'adrift' && add > 0) b.status = 'idle'; log('Admin: tanken fylt (' + fmt(add) + ' L).', 'Admin: the tank filled (' + fmt(add) + ' L).'); }
    else if (a === 'sub'){ sub[app] = d.s; }
    else if (a === 'ruchk'){ const c = ruChk(); c[d.k] = /^-?\d+(\.\d+)?$/.test(d.v) ? +d.v : d.v === 'null' ? null : d.v; S.ruChk = c; sub.regler = 'sjekk'; }
    else if (a === 'salgW'){ sub.salgW = d.s; }
    else if (a === 'tow'){ rescue(true); toast(L('Redningsskøyta er på vei.', 'The rescue boat is on its way.')); }
    else if (a === 'mayday'){ confirmMayday = true; }
    else if (a === 'mayday0'){ confirmMayday = false; }
    else if (a === 'mayday2'){ confirmMayday = false; rescue(false); toast(L('Redningsskøyta er på vei.', 'The rescue boat is on its way.')); }
    else if (a === 'member'){ if (S.cash < PRICE.member){ toast(t('no_cash')); return; } S.cash -= PRICE.member; S.stats.costs += PRICE.member; S.member = true; log('Ble medlem i redningstjenesten.', 'Joined the rescue service.'); }
    else if (a === 'svc'){ const c = d.m === 'self' ? Math.round(VESSELS[b.type].svcCost * 0.35) : VESSELS[b.type].svcCost, hh = d.m === 'self' ? Math.round(VESSELS[b.type].svcJobH * 2.5) : VESSELS[b.type].svcJobH; if (S.cash < c){ toast(t('no_cash')); return; } if (!queueJob({kind:'svc', h:hh, no:d.m === 'self' ? 'Egen service på motoren' : 'Service på verkstedet', en:d.m === 'self' ? 'Servicing the engine yourself' : 'Engine service at the yard'})){ toast(L('Arbeidskøen er full.', 'The work queue is full.')); return; } S.cash -= c; S.stats.costs += c; }
    else if (a === 'prep'){ const P2 = PREP[d.k]; if (S.cash < P2.cost){ toast(t('no_cash')); return; } if (!queueJob({kind:'prep', k:d.k, h:P2.h, no:P2.no, en:P2.en})){ toast(L('Arbeidskøen er full.', 'The work queue is full.')); return; } S.cash -= P2.cost; S.stats.costs += P2.cost; }
    else if (a.slice(0, 3) === 'wk-'){ if (!WORK.act(a, d)) return; }
    else if (a === 'rig'){ const why = rigSet(d.r); if (why){ toast(why[0]); return; } }
    else if (a === 'grpref'){ if (BAITS[d.k]) S.pgear.baitPref = d.k; }
    else if (a === 'grown'){ const got = baitFromHold(d.k, +d.n || 0); if (got > 0) toast(fmt(got, 0) + ' kg ' + SPECIES[d.k][S.lang].toLowerCase() + L(' er agn nå.', ' is bait now.')); }
    else if (a === 'grbuy'){ const why = buyGear(d.w, isNaN(+d.s) ? d.s : +d.s, +d.n); if (why){ toast(why[0]); return; } }
    else if (a === 'grrep'){ reportLost(d.id); }
    else if (a === 'book'){ show(false); BOOK.open('salg', +d.i); return false; }
    else if (a === 'goset'){ const s = (S.sets || []).find(x => x.id === d.id); if (s) DOCK.goTo(s); return false; }
    else if (a === 'gregn'){ const why = d.m === 'shed' ? egnOrder(d.lk, +d.n) : egnSelf(d.lk, +d.n); if (why){ toast(why[0]); return; } }
    else if (a === 'grmend'){ const why = d.m === 'bot' ? botOrder(d.id) : mendSelf(d.id); if (why){ toast(why[0]); return; } }
    else if (a === 'grsplit'){ const l = S.pgear.nets.find(x => x.id === d.id); if (l) splitNets(l.id, Math.floor(l.n / 2)); }
    else if (a === 'grjoin'){ joinNets(d.a, d.b); }
    else if (a === 'jobx'){ const j = (S.jobs || [])[+d.i]; if (j && +d.i > 0){ S.jobs.splice(+d.i, 1); gearJobCancel(j); const refund = j.kind === 'prep' ? PREP[j.k].cost : j.kind === 'fit' ? EQUIP[j.k].price : j.kind === 'hold' ? upPrice(HOLDUP[j.lv - 1].pc) : j.kind === 'eng' ? upPrice(ENGUP[j.lv - 1].pc) : j.kind === 'hull' ? 1500 + Math.round(BOAT.len * 400 / 100) * 100 : 0; S.cash += refund; S.stats.costs -= refund; } }
    else if (a === 'service'){ const c = VESSELS[b.type].svcCost; if (S.cash < c){ toast(t('no_cash')); return; } S.cash -= c; S.stats.costs += c; b.svcAt = b.engH || 0; S.svcTold = false; log('Motorservice utført.', 'Engine serviced.'); }
    else if (a === 'holdup'){ const lv = (S.boat.holdLv || 0) + 1, nx = HOLDUP[lv - 1]; if (!nx || !inPort() || (S.jobs || []).some(j => j.kind === 'hold')) return; const c = upPrice(nx.pc); if (S.cash < c) return;
      if (!queueJob({kind:'hold', lv, h:nx.h, no:'Ombygging av lasterommet', en:'Rebuilding the hold'})){ toast(L('Arbeidskøen er full.', 'The work queue is full.')); return; } S.cash -= c; S.stats.costs += c; log('Bestilte ombygging av lasterommet, ' + kr(c) + '.', 'Ordered a rebuild of the hold, ' + kr(c) + '.'); }
    else if (a === 'engup'){ const lv = (S.boat.engLv || 0) + 1, nx = ENGUP[lv - 1]; if (!nx || !inPort() || VESSELS[S.boat.type].outboard || (S.jobs || []).some(j => j.kind === 'eng')) return; const c = upPrice(nx.pc); if (S.cash < c) return;
      if (!queueJob({kind:'eng', lv, h:nx.h, no:'Motorbytte', en:'Engine change'})){ toast(L('Arbeidskøen er full.', 'The work queue is full.')); return; } S.cash -= c; S.stats.costs += c; log('Bestilte større motor, ' + kr(c) + '.', 'Ordered a bigger engine, ' + kr(c) + '.'); }
    else if (a === 'hullclean'){ if (!inPort() || (S.jobs || []).some(j => j.kind === 'hull')) return; const c = 1500 + Math.round(BOAT.len * 400 / 100) * 100; if (S.cash < c) return;
      if (!queueJob({kind:'hull', h:6, no:'Skrogrens på slipp', en:'Hull cleaning on the slip'})){ toast(L('Arbeidskøen er full.', 'The work queue is full.')); return; } S.cash -= c; S.stats.costs += c; log('Bestilte skrogrens på slipp, ' + kr(c) + '.', 'Ordered a hull cleaning on the slip, ' + kr(c) + '.'); }
    else if (a === 'trimbuy'){ const b = S.boat, B = BOOSTS[d.k]; if (!B || !canBoost(VESSELS[b.type]) || (b.boost && b.boost[d.k])) return; b.boost = Object.assign({}, b.boost, {[d.k]:true}); applyVessel(); log(B.no + ' er montert. Toppfart nå ' + fmt(BOAT.vmax, 1) + ' knop.', B.en + ' is fitted. Top speed now ' + fmt(BOAT.vmax, 1) + ' knots.'); toast(L(B.no + ' montert: ', B.en + ' fitted: ') + fmt(BOAT.vmax, 1) + ' kn'); }
    else if (a === 'equip'){ const E = EQUIP[d.k]; if (!inPort() || S.cash < E.price) return; if (!queueJob({kind:'fit', k:d.k, h:fitHours(d.k), no:'Montering av ' + E.name.no.toLowerCase(), en:'Fitting the ' + E.name.en})){ toast(L('Arbeidskøen er full.', 'The work queue is full.')); return; } S.cash -= E.price; S.stats.costs += E.price; log('Kjøpt ' + E.name.no + '. Monteres i verkstedet.', 'Bought the ' + E.name.en + '. Being fitted at the yard.'); } else if (a === 'equipOLD'){ const E = EQUIP[d.k]; if (E.multi) S.equip[d.k] = (S.equip[d.k] || 0) + 1; else S.equip[d.k] = true; applyVessel(); log('Montert: ' + E.name.no + '.', 'Fitted: ' + E.name.en + '.'); updateMapButtons(); INSTR.show(); }
    else if (a === 'ops_on'){ if (!S.ops) return; if (!S.ops.on && !opsSkipper()){ toast(L('Velg en skipper først.', 'Choose a skipper first.')); return; } S.ops.on = !S.ops.on; log(S.ops.on ? 'Fast driftsplan slått på.' : 'Fast driftsplan slått av.', S.ops.on ? 'Standing plan switched on.' : 'Standing plan switched off.'); }
    else if (a === 'ops_dep'){ S.ops.dep = (S.ops.dep + (+d.d) + 24) % 24; }
    else if (a === 'ops_day'){ const i = +d.i; S.ops.days[i] = S.ops.days[i] ? 0 : 1; }
    else if (a === 'ops_w'){ S.ops.maxWind = clamp(S.ops.maxWind + (+d.d), 6, 20); }
    else if (a === 'ops_sk'){ S.ops.skipper = d.id; }
    else if (a === 'hire'){ const c = candidates().find(x => x.id === d.id); if (c && S.crew.length < BOAT.crewMax){ S.crew.push(c); log(c.name + ' er ansatt som ' + c.lv + '.', c.name + ' joined as ' + c.lvEn + '.'); } }
    else if (a === 'fire'){ const c = S.crew.splice(+d.i, 1)[0]; if (c) log(c.name + ' har gått i land.', c.name + ' has gone ashore.'); }
    else if (a === 'repay'){ const k = d.k || 'loan', Q = S[k]; if (!Q || S.cash < 10000) return; const x = Math.min(10000, Q.bal); S.cash -= x; Q.bal -= x; if (Q.bal < 1) S[k] = null; }
    else if (a === 'repayAll'){ const k = d.k || 'loan', Q = S[k]; if (!Q || S.cash < Q.bal) return; S.cash -= Q.bal; S[k] = null; log((k === 'loanIN' ? 'Risikolånet' : 'Båtlånet') + ' er innfridd.', 'The ' + (k === 'loanIN' ? 'risk' : 'vessel') + ' loan is paid off.'); }
    else if (a === 'papers'){ app = 'sjomann'; sub.sjomann = 'papir'; }
    else if (a === 'mktab'){ sub.marked = d.s; mkSel = null; }
    else if (a === 'mksel'){ mkSel = d.k ? {k:d.k, o:d.o || null} : null; }
    else if (a === 'mk3d'){ if (typeof DOCK !== 'undefined') DOCK.close(); if (isOpen) show(false); G3.showroom(d.k); return; }
    else if (a === 'buy'){
      // data-ti="1": trade in the vessel you follow; data-ti="0": add a vessel to the fleet (not an open-group boat before the company has a closed-group one)
      const V2 = VESSELS[d.k], ti = d.ti === '0' ? 0 : tradeIn(); if (!V2 || V2.lock || !inPort() || S.order || (ti && S.boat.type === d.k)) return;
      if (!ti && V2.len < 11 && !hasLic()){ toast(L('Et rederi kan bare ha én båt i åpen gruppe.', 'A company can only have one boat in the open group.')); return; }
      const x = deal(V2.price, ti); if (!x.ok){ toast(whyText(x) || t('no_cash')); return; } finance(x, 120);
      if (V2.isNew){ S.order = {type:d.k, due:S.t + 45 * 24 * 60, vid:ti ? S.cur : null}; log('Bestilte ' + V2.name.no + '. Levering om 45 døgn' + (ti ? ', mot «' + S.boatName + '» i bytte.' : ' til flåten.'), 'Ordered the ' + V2.name.en + '. Delivery in 45 days' + (ti ? ', with «' + S.boatName + '» traded in.' : ' for the fleet.')); }
      else if (ti) switchVessel(d.k);
      else { const v = newVesselObj(d.k, S.boat.port); log('Kjøpte ' + V2.name.no + ' til flåten. Hun heter «' + v.boatName + '» og ligger i ' + portById(S.boat.port).name + '.', 'Bought the ' + V2.name.en + ' for the fleet. She is called «' + v.boatName + '» and lies at ' + portById(S.boat.port).name + '.'); }
      if (ti && S.lic){ log('Kvoten i lukket gruppe fulgte med den gamle båten.', 'The closed-group quota went with the old vessel.'); S.lic = null; freshQuota(); openUsedLoad(); }
    }
    else if (a === 'vsel'){ selV = d.id; }
    else if (a === 'goto'){ const v = vesselById(d.id); if (!v) return; if (SEL_APPS.includes(d.a)) selV = v.id; else if (v.id !== S.cur){ storeVessel(curVessel()); bindVessel(v); selV = null; if (typeof G3 !== 'undefined') G3.vesselChanged(); refreshAll(); } app = d.a; }
    else if (a === 'vfollow'){ const v = vesselById(d.id); if (!v || v.id === S.cur) return; storeVessel(curVessel()); bindVessel(v); selV = null; if (typeof G3 !== 'undefined') G3.vesselChanged(); refreshAll(); }
    else if (a === 'vboard'){ const v = vesselById(d.id), mv = vesselById(S.me); if (!v || v.id === S.me || vget(v, 'boat').status !== 'port' || (mv && vget(mv, 'boat').status !== 'port')) return;
      S.me = v.id; log('Du gikk om bord på «' + vget(v, 'boatName') + '».', 'You went aboard the «' + vget(v, 'boatName') + '».');
      if (v.id !== S.cur){ storeVessel(curVessel()); bindVessel(v); if (typeof G3 !== 'undefined') G3.vesselChanged(); refreshAll(); } }
    else if (a === 'vname'){ const v = vesselById(d.id); if (!v) return; const nm = (prompt(L('Nytt navn på båten', 'New name for the vessel'), vget(v, 'boatName') || '') || '').replace(/[<>&"]/g, '').trim().slice(0, 20); if (!nm) return;
      if (v.id === S.cur) S.boatName = nm; else v.boatName = nm; loreRename(nm); }
    else if (a === 'vsell'){ const v = vesselById(d.id); if (!v || v.id === S.me || S.fleet.length < 2 || vget(v, 'boat').status !== 'port' || tiLocked(v)) return;
      const val = vesselValue(v), nm = vget(v, 'boatName'), hands = (vget(v, 'crew') || []).length;
      if (!confirm(L('Selge «' + nm + '» for ' + kr(val) + '?', 'Sell the «' + nm + '» for ' + kr(val) + '?') + (debt() > 0 ? ' ' + L('Pengene går først til å innfri lånene.', 'The money first pays off the loans.') : ''))) return;
      if (v.id === S.cur){ bindVessel(vesselById(S.me)); if (typeof G3 !== 'undefined') G3.vesselChanged(); }
      if (v.id === openVesselId()) openUsedSave(vget(v, 'quota'));   // § 29: the owner's open-group catch follows to the next boat
      const paid = payDown(val); S.fleet.splice(S.fleet.indexOf(v), 1); S.cash += val - paid;
      log('Solgte «' + nm + '» for ' + kr(val) + '.' + (paid ? ' ' + kr(paid) + ' gikk til å innfri lån.' : '') + (hands ? ' Mannskapet hennes gikk i land.' : ''), 'Sold the «' + nm + '» for ' + kr(val) + '.' + (paid ? ' ' + kr(paid) + ' went to pay off loans.' : '') + (hands ? ' Her crew went ashore.' : '')); refreshAll(); }
    else if (a === 'bhire' || a === 'bneg'){ const B = S.bors, c = B && B.pool.find(x => x.id === d.id); if (!c || S.crew.length >= BOAT.crewMax || S.boat.status !== 'port') return;
      if (a === 'bneg'){ c.neg = true; if (Math.random() < 0.6 - (c.traits.includes('stolt') ? 0.25 : 0)){ c.ask = Math.max(0.06, Math.round((c.ask - 0.02) * 100) / 100); c.share = c.ask; c.morale -= 5; toast(L(c.name.split(' ')[0] + ' godtar ' + Math.round(c.ask * 100) + ' %.', c.name.split(' ')[0] + ' accepts ' + Math.round(c.ask * 100) + '%.')); }
        else { B.pool.splice(B.pool.indexOf(c), 1); toast(L(c.name.split(' ')[0] + ' takket nei og tok hyre et annet sted.', c.name.split(' ')[0] + ' said no and took a berth elsewhere.')); } }
      else { B.pool.splice(B.pool.indexOf(c), 1); c.hiredT = S.t; c.earn = []; delete c.until; S.crew.push(c); log(c.name + ' har mønstret på som ' + c.lv + ' med ' + Math.round(c.share * 100) + ' % lott.', c.name + ' signed on as ' + c.lvEn + ' on a ' + Math.round(c.share * 100) + '% share.'); } }
    else if (a === 'coff'){ const c = crewById(d.id); if (c){ c.off = !c.off; if (c.off){ c.morale = Math.min(100, c.morale + 2); } } }
    // lott or hyre (E3): the day wage is the one asked for when the agreement is changed
    else if (a === 'cpay'){ const c = crewById(d.id); if (c){ if (c.pay === 'hyre') c.pay = 'lott'; else { c.pay = 'hyre'; c.hyre = hyreAsk(c); }
      log(c.name + (c.pay === 'hyre' ? ' går over på hyre: ' + kr(c.hyre) + ' per dag.' : ' går over på lott: ' + Math.round(c.share * 100) + ' %.'), c.name + (c.pay === 'hyre' ? ' moves to a wage: ' + kr(c.hyre) + ' a day.' : ' moves to a share: ' + Math.round(c.share * 100) + ' %.')); } }
    else if (a === 'cfire'){ const c = crewById(d.id); if (c){ const i = S.crew.indexOf(c); S.crew.splice(i, 1); log(c.name + ' har gått i land.', c.name + ' has gone ashore.'); for (const o of S.crew){ o.morale = clamp(o.morale + (compat(o, c) < 0 ? 4 : -4), 0, 100); if (o.grudge) delete o.grudge[c.id]; } if (S.cevt && (S.cevt.a === c.id || S.cevt.b === c.id)) S.cevt = null; } }
    else if (a === 'cres'){ const ev = S.cevt; if (!ev) return; const A = crewById(ev.a), Bc = crewById(ev.b), o = d.o, g = (x, y, v) => { if (x && y){ x.grudge = x.grudge || {}; x.grudge[y.id] = (x.grudge[y.id] || 0) + v; } };
      if (A) A.cpen = 0; if (Bc) Bc.cpen = 0;
      if (o === 'talk'){ const calm = crewAboard().some(c => c.traits.includes('spokefugl') || c.traits.includes('omsorgsfull')) ? 0.15 : 0, pr = 0.4 + Math.min(0.25, S.sales.length * 0.005) + calm + 0.05 * (compat(A, Bc) + 3);
        if (Math.random() < pr){ if (A.grudge) delete A.grudge[Bc.id]; if (Bc.grudge) delete Bc.grudge[A.id]; A.morale += 5; Bc.morale += 5; toast(L('Dere fikk snakket ut. Stemningen er bedre.', 'You talked it through. The mood is better.')); }
        else { g(A, Bc, 1); g(Bc, A, 1); A.morale -= 5; Bc.morale -= 5; toast(L('Praten hjalp ikke. De er fortsatt sure på hverandre.', 'The talk did not help. They are still cross with each other.')); } }
      else if (o === 'sideA' || o === 'sideB'){ const W = o === 'sideA' ? A : Bc, Lz = o === 'sideA' ? Bc : A; W.morale += 8; Lz.morale -= Lz.traits.includes('stolt') ? 22 : 15; g(Lz, W, 1); }
      else if (o === 'offB'){ Bc.off = true; Bc.morale -= 4; if (A.grudge) A.grudge[Bc.id] = Math.max(0, (A.grudge[Bc.id] || 0) - 0.5); }
      else if (o === 'fireB' || o === 'fireA'){ const q = o === 'fireB' ? Bc : A; S.cevt = null; const i = S.crew.indexOf(q); if (i >= 0){ S.crew.splice(i, 1); log(q.name + ' har gått i land.', q.name + ' has gone ashore.'); } }
      else if (o === 'listen'){ if (ev.topic === 'lott'){ A.share = Math.round((A.share + 0.01) * 100) / 100; } else if (ev.topic === 'hvile'){ A.off = true; } A.morale += ev.topic === 'lott' ? 12 : 8; }
      else if (o === 'firm'){ A.morale -= 10; if (A.traits.includes('kranglefant') || A.traits.includes('stolt')) A.morale -= 6; }
      for (const c of S.crew) c.morale = clamp(c.morale, 0, 100); S.cevt = null; }
    else if (a === 'ordtake'){ const O = ordState(), o = O.offers.find(x => x.id === +d.id); if (!o || O.active.length >= 3) return; O.offers.splice(O.offers.indexOf(o), 1); o.due = S.t + o.days * 1440; O.active.push(o); log('Tok en bestilling fra ' + CUSTOMERS.find(c => c.id === o.cust).no + '.', 'Took an order from ' + CUSTOMERS.find(c => c.id === o.cust).no + '.'); }
    else if (a === 'cloth'){ const C = CLOTHES[d.k], people = 1 + S.crew.length, have = (S.clothes || {})[d.k] || 0; if (!C || have >= people) return; if (S.cash < C.price){ toast(t('no_cash')); return; } S.cash -= C.price; S.stats.costs += C.price; S.clothes = S.clothes || {olje:0, varme:0}; S.clothes[d.k] = have + 1; log('Kjøpte ' + C.no.toLowerCase() + '.', 'Bought ' + C.en.toLowerCase() + '.'); }
    else if (a === 'haillbuy'){ if (tutFree('haill') && d.k !== 'luksus') return; giveHaill(d.k, 'shop'); if (tutFree('haill')) tutMark('free_haill'); toast(HAILL[d.k][S.lang] + L(' ligger i beholdningen. Trykk «Aktiver» når du vil bruke den.', ' is in store. Tap «Switch on» when you want it.')); }
    else if (a === 'haillon'){ if (S.haill && haillStage() && haillPend !== d.k){ haillPend = d.k; return true; } haillPend = null; if (useHaill(d.k)) toast(HAILL[d.k][S.lang] + L(' er aktivert: +', ' is on: +') + Math.round(haillBoost() * 100) + ' %.'); }
    else if (a === 'haill0'){ haillPend = null; }
    else if (a === 'jobOT'){ const j = S.jobs && S.jobs[0]; if (!j || j.until == null || j.ot) return; const left = Math.max(0, j.until - S.t) / 60, c = Math.round(left / 2 * 950 / 10) * 10; if (S.cash < c){ toast(t('no_cash')); return; }
      S.cash -= c; S.stats.costs += c; j.until = S.t + (j.until - S.t) / 2; j.ot = true; log('Leide inn mekaniker på overtid for ' + c + ' kr.', 'Hired a mechanic on overtime for NOK ' + c + '.'); }
    else if (a === 'jobRush'){ const j = S.jobs && S.jobs[0]; if (!j || j.until == null) return; j.until = S.t; log('Hastejobb: mekanikerne gjorde ferdig med én gang.', 'Rush job: the mechanics finished straight away.'); }
    else if (a === 'struct'){
      // a structure quota: buy a right in the same group, scrap the boat, and add its quota factor less 10 % (03d-quota.js)
      const l = S.lic; if (!l || !structRoom(l, d.id) || !inPort()) return; const pr = structPrice(d.id, S.t / 60), x = deal(pr, 0); if (!x.ok){ toast(whyText(x) || t('no_cash')); return; } finance(x, 180);
      const sl = regSeller(d.id, S.t / 60), k = structIn(l, d.id, S.t / 60);
      msg('Fiskeridirektoratet', 'Strukturkvoten er tildelt «' + S.boatName + '»: kvotefaktor ' + fmt(k, 4) + ' fra båten til ' + sl.name + ' (' + HJ[d.id].hl + '), som er tatt ut av registeret. Den gjelder i 20 år.', 'The structure quota is granted to the «' + S.boatName + '»: quota factor ' + fmt(k, 4) + ' from ' + sl.name + '\'s boat (' + HJ[d.id].hl + '), which is struck off the register. It runs for 20 years.'); }
    else if (a === 'two'){
      // the special scheme under 11 m: one boat fishes both quotas, the other right is given up and the boat sold
      const va = vesselById(d.a), vb = vesselById(d.b); if (!va || !vb || vb.id === S.me || !twoOK(vget(va, 'lic'), vget(vb, 'lic'), yearH(S.t / 60)) || vget(vb, 'boat').status !== 'port') return;
      const la = vget(va, 'lic'), lb = vget(vb, 'lic'), nb = vget(vb, 'boatName'), val = Math.round(VESSELS[vget(vb, 'boat').type].price * 0.7);
      if (!confirm(L('«' + nb + '» oppgir hjemmelen og selges for ' + kr(val) + '. «' + vget(va, 'boatName') + '» fisker begge kvotene. Fortsette?', '«' + nb + '» gives up its right and is sold for ' + kr(val) + '. «' + vget(va, 'boatName') + '» fishes both quotas. Go on?'))) return;
      la.two = lb.id; licExtra(la); if (vb.id === S.cur){ bindVessel(va); if (typeof G3 !== 'undefined') G3.vesselChanged(); }
      const paid = payDown(val); S.fleet.splice(S.fleet.indexOf(vb), 1); S.cash += val - paid;
      msg('Fiskeridirektoratet', '«' + vget(va, 'boatName') + '» fisker nå to kvoter etter den særlige kvoteordningen. «' + nb + '» er slettet fra merkeregisteret.', 'The «' + vget(va, 'boatName') + '» now fishes two quotas under the special scheme. The «' + nb + '» is struck off the register.'); }
    else if (a === 'coop'){
      // quota cooperation (§ 31): the NPC owner signs on, and his quota comes aboard for the year
      const y = yearH(S.t / 60), o = coopOffer(S.t / 60); if (!coopOK(S.lic, y) || S.crew.length + 1 >= BOAT.crewMax || !inPort()) return;
      const c = Object.assign(genCrew(), {name:o.name, home:o.home, share:0, ask:0, morale:70, fatigue:10, traits:[], known:[true, true], coop:true});
      S.crew.push(c); S.lic.coop = {y, id:o.id, name:o.name, crew:c.id};
      msg('Fiskeridirektoratet', 'Kvotesamarbeidet med ' + o.name + ' (hjemmel ' + HJ[o.id].hl + ') er registrert for ' + y + '. Han er om bord, og båten hans ligger til kai.', 'The quota cooperation with ' + o.name + ' (quota length ' + HJ[o.id].hl + ') is registered for ' + y + '. He is aboard, and his boat lies at the quay.'); }
    else if (a === 'buylic'){
      const O = LIC_OFFERS.find(x => x.id === d.id); if (!O || !inPort() || S.order) return;
      const price = VESSELS[O.ves].price + licValue(O), ti = d.ti === '0' ? 0 : tradeIn(); if (ti && S.lic && S.lic.id === O.id) return;
      if (!bladB()){ toast(L('Du må stå på blad B i fiskermanntallet for å kjøpe en båt med hjemmel. Se Papirer.', 'You must be on blad B of the fishermen\'s register to buy a boat with a right. See Papers.')); return; }
      const inn = innOK(), x = deal(price, ti, inn); if (!x.ok){ toast(whyText(x) || t('no_cash')); return; } finance(x, 180); if (inn) S.inUsed = true;
      const sl = regSeller(O.id, S.t / 60), lic = {id:O.id, hl:O.hl, kpk:O.kpk, since:yearH(S.t / 60), from:sl.name + ', ' + sl.home}, ov = openVesselId(), lost = ov && !(ti && ov === S.cur) ? vget(vesselById(ov), 'boatName') : null;
      let nm;
      let fished; regTake(O.id);   // the NPC owner leaves the register (03d-quota.js)
      if (ti){ if (!S.lic && S.cur === ov) openUsedSave(S.quota); switchVessel(O.ves); S.lic = lic; fished = licStart(lic); nm = S.boatName; }
      else { if (ov) openUsedSave(vget(vesselById(ov), 'quota')); const v = newVesselObj(O.ves, S.boat.port, lic); fished = withVessel(v, () => licStart(lic)); nm = v.boatName; log('Kjøpte ' + O.no.toLowerCase() + ' til flåten. Hun heter «' + nm + '».', 'Bought a ' + O.en.toLowerCase() + ' for the fleet. She is called «' + nm + '».'); }
      msg('Fiskeridirektoratet', 'Deltakeradgangen i lukket gruppe (hjemmelslengde ' + O.hl + ') er registrert på «' + nm + '». Fartøykvoten for torsk i år er ' + fmt(O.cod / 1000, 2) + ' tonn. Selgeren har fisket ' + fmt(fished / 1000, 2) + ' tonn av den, og det trekkes fra (§ 29).' + (lost ? ' Rederiet har nå en båt i lukket gruppe, så «' + lost + '» kan ikke lenger delta i åpen gruppe. Hun kan fortsatt fiske kveite, krabbe og annet enn torsk, hyse og sei.' : ''), 'The closed-group participation right (quota length ' + O.hl + ') is registered to the «' + nm + '». The vessel quota for cod this year is ' + fmt(O.cod / 1000, 2) + ' t. The seller has fished ' + fmt(fished / 1000, 2) + ' t of it, which comes off (§ 29).' + (lost ? ' The company now has a vessel in the closed group, so the «' + lost + '» can no longer take part in the open group. She can still fish halibut, crab and anything but cod, haddock and saithe.' : ''));
    }
    return true;
  }
  view.addEventListener('click', e => { const t0 = e.target.closest('[data-pa],[data-act]'); if (!t0 || t0.disabled) return; if (t0.dataset.pa) act(t0.dataset.pa, t0.dataset); else { doAct(t0); render(); } });
  view.addEventListener('input', e => panelInput(e));
  view.addEventListener('change', e => { panelChange(e); if (e.target.id === 'setAuto') render(); });
  el.querySelector('.ph-nav').addEventListener('click', e => { const t0 = e.target.closest('[data-pa]'); if (t0) act(t0.dataset.pa, t0.dataset); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && isOpen) show(false); });
  el.classList.add('off');
  return {show, toggle(){ show(!isOpen); }, open(a){ if (DRAWER.has(String(a).split(':')[0])){ show(false); DOCK.open(a); } else show(true, a); }, page, dact, DRAWER, isOpen:() => isOpen, render, status, setBadge, tickHome, switchVessel, alerts, get app(){ return app; }, get sel(){ return selVessel().id; }};
})();

