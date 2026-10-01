// ---------- the phone ----------
const PHONE = (() => {
  const el = $('phone'), view = $('phView'), tEl = $('phTime'), nEl = $('phNet'), badge = $('phoneBadge');
  let app = 'home', sub = {}, isOpen = false, confirmMayday = false, shopPend = null;
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
    kvote:SVG('<path d="M12 3a9 9 0 1 0 9 9h-9z"/><path d="M15 2.6A9 9 0 0 1 21.4 9H15z"/>'),
    innst:SVG('<circle cx="12" cy="12" r="3"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1"/>')};
  const APPS = [['vaer', 'Vær', 'Weather', '#2f7fd0'], ['post', 'Kystposten', 'Coast Post', '#b8402f'], ['meld', 'Meldinger', 'Messages', '#29a36a'], ['rederi', 'Rederi', 'Company', '#1f4e79'], ['salg', 'Salgslaget', 'Sales', '#1e8c6e'], ['kvote', 'Kvote', 'Quota', '#8a6a1c'], ['ordl', 'Oppdrag', 'Orders', '#2e7d4f'], ['haill', 'Haill', 'Luck', '#c9a227'], ['sjomann', 'Sjømann', 'Seaman', '#23506b'], ['redning', 'Redning', 'Rescue', '#e0562b'], ['innst', 'Innstillinger', 'Settings', '#4a5560']];
  const unread = () => S.msgs.filter(m => !m.read).length;
  function setBadge(){ const n = unread(); for (const bd of [badge, $('phoneBadge2')]){ bd.hidden = !n; bd.textContent = n; } }
  // --- workshop: service, fitting and getting the gear ready, one job after the other while the boat is in port
  const SVC_H = {skiff:3, snekke:5, sjark:8, sjarkny:10};
  function haill(){
    const h = ['<div class="ph-c">'], a = S.haill, f = haillF();
    if (a && f > 0){ const d = (S.t - a.t0) / 1440; h.push('<div class="ph-card haillc"><h4>' + HAILL[a.type][S.lang] + ' ' + L('om bord', 'aboard') + '</h4>' + kv(L('Styrke nå', 'Strength now'), Math.round(f * 100) + ' %') + '<div class="qbar"><i style="width:' + (f * 100).toFixed(0) + '%;background:#c9a227"></i></div>' + kv(L('Går ut', 'Expires'), dayStr((a.t0 + 7 * 1440) / 60) + ' ' + hm((a.t0 + 7 * 1440) / 60)) + '<p class="ph-note">' + (d < 2 ? L('Fersk haill. Full effekt til ', 'Fresh luck. Full effect until ') + dayStr((a.t0 + 2 * 1440) / 60) + ' ' + hm((a.t0 + 2 * 1440) / 60) + '.' : L('Haillen er ferskvare og blir svakere for hver dag.', 'Luck is fresh goods and fades every day.')) + '</p></div>'); }
    else h.push('<div class="ph-card"><p class="ph-note">' + L('Ingen haill om bord. Haill er ferskvare: full effekt de to første døgnene, så svakere hver dag til den er borte etter sju døgn. En ny haill erstatter den gamle.', 'No luck aboard. Luck is fresh goods: full effect for the first two days, then weaker every day until it is gone after seven. New luck replaces the old.') + '</p></div>');
    const gift = tutFree('haill');
    if (gift) h.push('<div class="ph-card haillc"><h4>' + L('Første gang er luksushaill gratis', 'The first luxury luck is free') + '</h4><p class="ph-note">' + L('Ellers koster kveithaill 19 kr, haill 29 kr og luksushaill 59 kr. Du kan også være heldig på puben.', 'Otherwise halibut luck is NOK 19, luck NOK 29 and luxury luck NOK 59. You can also get lucky at the pub.') + '</p></div>');
    for (const k of ['kveit', 'haill', 'luksus']){ const X = HAILL[k], free = gift && k === 'luksus';
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
    h.push('<div class="ph-card"><h4>' + L('Håndjuksa', 'Hand jig') + '</h4><p>' + L('Snøre, søkke, pilk og markkroker på en rull ved ripa. Med den fisker du torsk, sei og hyse. Uten juksa har du bare stanga, og den gir rundt en tredjedel så mye.', 'Line, sinker, pilk and fly hooks on a reel at the rail. It takes cod, saithe and haddock. Without it you only have the rod, which gives about a third as much.') + '</p>' + kv(L('Pris', 'Price'), kr(PRICE.gear)) + (b.gear ? have : buy('jig', 0, PRICE.gear, L('Kjøp håndjuksa', 'Buy a hand jig'))) + '</div>');
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
      '<button class="ph-btn" data-pa="svc" data-m="yard"' + (queuedSvc ? ' disabled' : '') + '>' + L('Verkstedet', 'The yard') + ' · ' + kr(V.svcCost) + ' · ' + SVC_H[b.type] + ' t</button>' +
      '<button class="ph-btn alt" data-pa="svc" data-m="self"' + (queuedSvc ? ' disabled' : '') + '>' + L('Gjør det selv', 'Do it yourself') + ' · ' + kr(Math.round(V.svcCost * 0.35)) + ' · ' + Math.round(SVC_H[b.type] * 2.5) + ' t</button></div>');
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
    const buy = (n, lbl) => { const c = n * GPRICE.bait, ok = here && c <= S.cash; return '<button class="ph-btn' + (ok ? ' p' : '') + '"' + (ok ? '' : ' disabled') + ' data-pa="grbuy" data-w="bait" data-s="0" data-n="' + n + '">' + lbl + ' (' + kr(c) + ')</button>'; };
    h.push('<div class="ph-card"><h4>' + L('Agn', 'Bait') + '</h4><p>' + L('Sild og makrell til lina og teinene. Hver stamp hyseline tar rundt ', 'Herring and mackerel for the line and the pots. Each tub of haddock line takes about ') + fmt(LINE_KINDS.hyse.baitKg, 0) + L(' kg, og hver teine ', ' kg, and each pot ') + fmt(GPRICE.potBait, 1) + ' kg.</p>' + kv(L('Om bord', 'Aboard'), fmt(pg.bait, 0) + ' kg') + '<div class="ph-btncol">' + buy(20, L('20 kg agn', '20 kg bait')) + buy(100, L('100 kg agn', '100 kg bait')) + '</div></div>');
    let any = false;
    for (const lk of ['hyse', 'bank']){ const L0 = pg.lines[lk], un = L0.n - L0.baited; if (!L0.n) continue; any = true;
      h.push('<div class="ph-card"><h4>' + LINE_KINDS[lk][S.lang] + '</h4>' + kv(L('Stamper', 'Tubs'), L0.n + ', ' + L0.baited + ' ' + L('egnet', 'baited')) +
        (here && un > 0 ? '<div class="ph-btncol">' + (egnPort(p) ? '<button class="ph-btn p" data-pa="gregn" data-lk="' + lk + '" data-n="' + un + '" data-m="shed">' + L('Egnebua egner ' + un, 'The shed baits ' + un) + ' (' + kr(un * (LINE_KINDS[lk].egn + LINE_KINDS[lk].baitKg * GPRICE.bait)) + ')</button>' : '') +
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
  function kvote(){ return salg('kvote'); }
  // what the boat has: gear aboard and in the sea, the hold, and the boat herself
  function beholdning(){
    const tab = sub.beholdning || 'gear', head = subs('beholdning', [['gear', 'Redskap', 'Gear'], ['last', 'Lasterom', 'Hold'], ['boat', 'Båten', 'The boat']]);
    if (tab === 'last') return head + last();
    if (tab === 'boat') return head + fartoy('min');
    return head + (S.pgear ? redskap('bord') + redskap('sjo') : '');
  }
  function logg(){ return '<div class="ph-panel">' + panelLog() + '</div>'; }
  function innst(){
    const pace = [1, 30, 300, 1800].map(v => [v, v === 1 ? L('6× (normalt)', '6× (normal)') : fmt(GAME_RATE * v) + '×']), chk = (id, on) => '<input type="checkbox" id="' + id + '"' + (on ? ' checked' : '') + '>';
    return '<div class="ph-c"><div class="ph-card ph-set"><h4>' + L('Spill', 'Game') + '</h4><label>' + L('Tempo (for testing)', 'Pace (for testing)') + '<select id="phPace">' + pace.map(([v, l]) => '<option value="' + v + '"' + (S.mult === v ? ' selected' : '') + '>' + l + '</option>').join('') + '</select></label><label>' + L('Språk', 'Language') + '<button class="ph-btn alt" data-pa="lang" style="margin:0">' + (S.lang === 'no' ? 'English' : 'Norsk') + '</button></label></div>' +
      '<div class="ph-card ph-set"><h4>' + L('Fangstbehandling', 'Catch handling') + '</h4><label>' + t('gut') + chk('setGut', S.settings.gut) + '</label><label>' + t('icing') + chk('setIce', S.settings.ice) + '</label><label>' + t('deck_first') + chk('setDeckFirst', S.settings.deckFirst !== false) + '</label><p class="ph-note">' + t('gut_n') + ' ' + t('icing_n') + ' ' + t('deck_first_n') + '</p></div>' +
      '<div class="ph-card ph-set"><h4>' + L('Sikkerhet', 'Safety') + '</h4><label>' + t('auto') + chk('setAuto', S.settings.autoOn) + '</label><label><span>' + L('Snu ved', 'Turn back at') + ' <output id="autoWOut">' + S.settings.autoW + ' m/s</output></span><input type="range" min="6" max="20" step="1" value="' + S.settings.autoW + '" id="autoW"' + (S.settings.autoOn ? '' : ' disabled') + '></label><p class="ph-note">' + t('auto_n') + '</p></div>' +
      '<div class="ph-card"><button class="ph-btn red" data-act="reset">' + t('reset') + '</button></div></div>';
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
  function render(){ status(); setBadge(); if (!isOpen) return; const key = app + '|' + (sub[app] || ''), y = key === shown ? view.scrollTop : 0; view.innerHTML = app === 'home' ? home() : shell(app); shown = key; view.scrollTop = y; }
  // every page by name: the phone apps, and the pages that open in the dock's drawer instead (DRAWER)
  const PAGES = () => ({vaer, post, salg, kvote, redning, rederi, meld, haill, logg, sjomann, innst,
    ordl, fiske, fartoy:() => fartoy('marked'), utstyr, redskap, mannskap, bors, bank, verksted, havn, last, lever, is:isApp, agn, oppdrag, beholdning});
  function shell(a){ const d = APPS.find(x => x[0] === a) || [a, a, a, '#28507f'], f = PAGES()[a]; return '<div class="ph-appv' + (a === 'post' ? ' ph-paper' : '') + '"><div class="ph-top" style="background:' + d[3] + '"><span class="ic">' + (IC[a] || '') + '</span>' + L(d[1], d[2]) + '</div>' + (SEL_APPS.includes(a) ? selRow() + withSel(f) : f()) + '</div>'; }
  // a page for the drawer, and an action tapped there: it runs as if that page were the open app, and says which page shows next
  function page(a){ const f = PAGES()[a]; return f ? (SEL_APPS.includes(a) ? selRow() + withSel(f) : f()) : ''; }
  function dact(cur, a, d){
    const keep = app; let done; app = cur;
    try { done = SEL_APPS.includes(app) && !NAV.has(a) ? withSel(() => act0(a, d)) : act0(a, d); } finally { cur = app; app = keep; }
    if (done){ save(); renderHud(); renderClock(); panelDirty = true; render(); }
    return cur;
  }
  function home(){
    const H = S.t / 60, W = windAt(H), n = unread(), na = alerts().length;
    return '<div class="ph-homescr"><div class="ph-clock">' + hm(H) + '</div><div class="ph-date">' + dayStr(H) + '</div>' +
      '<div class="ph-widget"><span class="w1">' + dirName(windDir(H)) + ' ' + fmt(W, 0) + ' m/s · ' + fmt(Math.round(airTemp(H)) || 0, 0) + ' °C</span><span class="w2">' + kr(S.cash) + '</span></div>' +
      ((g => g ? '<button class="ph-goal" data-pa="open" data-a="fartoy"><span>' + L('Neste mål: ', 'Next goal: ') + '<b>' + g.n + '</b></span><small>' + kr(Math.min(Math.max(0, S.cash), g.need)) + ' / ' + kr(g.need) + '</small><span class="gb"><i style="width:' + (g.pc * 100).toFixed(1) + '%"></i></span></button>' : '')(goals()[0])) +
      '<div class="ph-grid">' + APPS.map(a => '<button class="ph-app" data-pa="open" data-a="' + a[0] + '"><span class="ic" style="background:linear-gradient(160deg,' + a[3] + ',' + a[3] + 'cc)">' + IC[a[0]] + '</span>' + L(a[1], a[2]) + (a[0] === 'meld' && n ? '<span class="bd">' + n + '</span>' : '') + (a[0] === 'ordl' && ordState().active.length ? '<span class="bd">' + ordState().active.length + '</span>' : '') + (a[0] === 'rederi' && na ? '<span class="bd">' + na + '</span>' : '') + '</button>').join('') + '</div></div>';
  }
  const kv = (a, b) => '<div class="ph-kv"><span>' + a + '</span><span>' + b + '</span></div>';
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
    const b = S.boat, H = S.t / 60, W = windAt(H), hs = hsAt(b.pos, H), h = [], st = sunTimes(H);
    const pr = precipAt(H), snow = airTemp(H) < 1, prs = pr < 0.08 ? t('p_none') : (pr < 0.4 ? t('p_light') + ' ' : pr > 0.75 ? t('p_heavy') + ' ' : '') + t(snow ? 'p_snow' : 'p_rain');
    h.push('<div class="ph-c"><div class="ph-card"><div class="ph-big">' + fmt(Math.round(airTemp(H)) || 0, 0) + ' °C · ' + dirName(windDir(H)) + ' ' + fmt(W, 0) + ' m/s</div><p>' + BFN[S.lang][beaufort(W)] + ', ' + prs + '</p>' +
      kv(L('Bølger her', 'Waves here'), fmt(hs, 1) + ' m') + kv(L('Bølger på havet', 'Waves offshore'), fmt(hsOpen(H), 1) + ' m') + kv(L('Sikt', 'Visibility'), fmt(visibility(H), 0) + ' km') + kv(L('Sjøtemperatur', 'Sea temperature'), fmt(seasonal(SST, H), 1) + ' °C') +
      kv(L('Sol', 'Sun'), st.always ? L('Midnattssol', 'Midnight sun') : st.never ? L('Mørketid', 'Polar night') : (st.up ? hm(st.up) : '–') + ' – ' + (st.dn ? hm(st.dn) : '–')) + '</div>');
    { const ev = tideEvents(H, 30).slice(0, 5), mo = moonAt(H), th = tideH(H), pts = [];
      for (let k = 0; k <= 48; k++){ const v = tideH(H + k / 2); pts.push((k * 5).toFixed(1) + ',' + (30 - v * 11).toFixed(1)); }
      h.push('<div class="ph-card"><h4>' + L('Tidevann', 'Tide') + '</h4><svg viewBox="0 0 240 60" width="100%" height="60" style="display:block"><line x1="0" y1="30" x2="240" y2="30" stroke="#c9d5dc" stroke-dasharray="3 3"/><polyline points="' + pts.join(' ') + '" fill="none" stroke="#2f7fd0" stroke-width="2"/><circle cx="0" cy="' + (30 - th * 11).toFixed(1) + '" r="4" fill="#d6336c"/></svg>' +
        '<p class="ph-note">' + L('Nå ', 'Now ') + (th >= 0 ? '+' : '') + fmt(th, 2) + ' m ' + L('over middelvann (', 'above mean sea level (') + fmt(tideCD(H), 1) + ' m ' + L('over sjøkartnull). Kurve for neste 24 timer.', 'above chart datum). Curve for the next 24 hours.') + '</p><table class="ph-tbl">' + ev.map(e => '<tr><td>' + (e.kind === 'high' ? L('Flo', 'High') : L('Fjære', 'Low')) + '</td><td>' + (gDate(e.t).getUTCDate() !== gDate(H).getUTCDate() ? dayStr(e.t).split(' ')[0] + ' ' : '') + hm(e.t) + '</td><td class="n">' + (e.h >= 0 ? '+' : '') + fmt(e.h, 2) + ' m</td></tr>').join('') + '</table>' +
        kv(L('Månen', 'Moon'), moonName(mo)[S.lang] + ', ' + Math.round(mo.illum * 100) + ' %') + '<p class="ph-note">' + L('Foreløpig beregnet fra de viktigste tidevannskomponentene. Med Kartverkets tidevannsdata blir tidene eksakte.', 'For now calculated from the main tidal constituents. With Kartverket\u2019s tide data the times become exact.') + '</p></div>'); }
    h.push('<div class="ph-card"><h4>' + L('Varsel 48 timer', '48 hour forecast') + '</h4><table class="ph-tbl"><tr><th>' + L('Tid', 'Time') + '</th><th>' + L('Vind', 'Wind') + '</th><th class="n">' + L('Hav', 'Sea') + '</th></tr>');
    for (let i = 3; i <= 48; i += 3){ const Hh = Math.floor(H / 3) * 3 + i, w = fcWind(Hh, H), ho = fcHsOpen(Hh, H), lab = (gDate(Hh).getUTCHours() < 3 ? dayStr(Hh).split(' ')[0] + ' ' : '') + hm(Hh); h.push('<tr><td>' + lab + '</td><td class="r' + riskLevel(w, 0) + '">' + dirName(windDir(Hh)) + ' ' + fmt(w, 0) + ' m/s</td><td class="n r' + riskLevel(0, ho) + '">' + fmt(ho, 1) + ' m</td></tr>'); }
    h.push('</table><p class="ph-note">' + L('Farger viser risiko for din båt.', 'Colours show the risk for your vessel.') + '</p></div></div>');
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
      const q = quotaState(), l = codLimits(), open = codOpen(H), noAcc = !S.lic && S.cur !== openVesselId(), lim = codLimitNow(H), pct = ffPct(H), y = yearH(H), sd = codStopDoy(y), dt = new Date(Date.UTC(y, 0, 1 + sd));
      const MN = S.lang === 'no' ? ['januar','februar','mars','april','mai','juni','juli','august','september','oktober','november','desember'] : ['January','February','March','April','May','June','July','August','September','October','November','December'];
      const ds = dt.getUTCDate() + '. ' + MN[dt.getUTCMonth()], gl = [L('under 8 m', 'under 8 m'), '8–9,99 m', L('10 m og over', '10 m and over')][lenGroup()], wk = q.ffW === weekOfH(H);
      const bar = (a, m) => '<div class="qbar"><i style="width:' + Math.min(100, a / Math.max(1, m) * 100).toFixed(1) + '%"></i></div>';
      if (S.lic) h.push('<div class="ph-card"><h4>' + L('Torsk, lukket gruppe ', 'Cod, closed group ') + y + ' · ' + L('hjemmelslengde ', 'quota length ') + S.lic.hl + '</h4>' + kv(L('Landet', 'Landed'), fmt(q.torsk / 1000, 2) + ' t') + bar(q.torsk, lim) + kv(L('Fartøykvote', 'Vessel quota'), fmt(S.lic.cod / 1000, 2) + ' t') + kv(L('Igjen', 'Left'), fmt(Math.max(0, lim - q.torsk) / 1000, 2) + ' t') + kv(L('Hyse, maks / garantert', 'Haddock, max / guaranteed'), fmt(S.lic.hyse[0] / 1000, 0) + ' / ' + fmt(S.lic.hyse[1] / 1000, 1) + ' t') + kv(L('Sei, maks / garantert', 'Saithe, max / guaranteed'), fmt(S.lic.sei[0] / 1000, 0) + ' / ' + fmt(S.lic.sei[1] / 1000, 1) + ' t') + '<p class="ph-note">' + L('Fartøykvoten er din hele året og stoppes ikke. Torsk over kvoten blir inndratt ved levering.', 'The vessel quota is yours all year and is not stopped. Cod over the quota is confiscated when landed.') + '</p></div>');
      else if (noAcc) h.push('<div class="ph-card"><h4>' + L('Ingen adgang ', 'No access ') + y + '</h4><p class="ph-note">' + L('«' + S.boatName + '» er ikke rederiets båt i åpen gruppe og har ingen kvote. Torsk, hyse og sei kan bare være bifangst: høyst 10 % av hver landing, og høyst ' + fmt(BYCATCH.cod / 1000, 0) + ' tonn torsk i året. Resten blir inndratt.', 'The «' + S.boatName + '» is not the company\'s open-group vessel and has no quota. Cod, haddock and saithe can only be bycatch: at most 10% of each landing, and at most ' + fmt(BYCATCH.cod / 1000, 0) + ' t of cod a year. The rest is confiscated.') + '</p>' + kv(L('Torsk som bifangst i år', 'Cod as bycatch this year'), fmt((q.byCod || 0) / 1000, 2) + ' / ' + fmt(BYCATCH.cod / 1000, 0) + ' t') + bar(q.byCod || 0, BYCATCH.cod) + '</div>');
      else h.push('<div class="ph-card"><h4>' + L('Torsk, åpen gruppe ', 'Cod, open group ') + y + ' · ' + gl + '</h4>' + kv(L('Landet', 'Landed'), fmt(q.torsk / 1000, 2) + ' t') + bar(q.torsk, lim) +
        kv(L('Maksimalkvote', 'Maximum quota'), fmt(l.max / 1000, 1) + ' t' + (open ? '' : ' · ' + L('stoppet', 'stopped'))) + kv(L('Garantert kvote', 'Guaranteed quota'), fmt(l.guar / 1000, 1) + ' t') + kv(L('Igjen nå', 'Left now'), fmt(Math.max(0, lim - q.torsk) / 1000, 2) + ' t') +
        '<p class="ph-note">' + (open ? L('Fisket på maksimalkvotene stoppes når gruppekvoten er beregnet oppfisket, og Kystposten varsler en uke før. Etter stopp gjelder bare den garanterte kvoten.', 'Fishing on the maximum quotas stops when the group quota is estimated fished, announced in the Coast Post a week ahead. After the stop only the guaranteed quota applies.') : L('Maksimalkvotefisket ble stoppet ' + ds + '. Nå gjelder bare den garanterte kvoten.', 'Maximum-quota fishing stopped on ' + ds + '. Only the guaranteed quota applies now.')) + ' ' + L('Torsk over kvoten blir inndratt ved levering. Kvoten gjelder bare turer der du selv er om bord.', 'Cod over the quota is confiscated when landed. The quota only applies to trips with you aboard yourself.') + '</p></div>');
      if (!noAcc) h.push('<div class="ph-card"><h4>' + L('Ferskfiskordningen', 'Fresh-fish scheme') + '</h4>' + (pct ? kv(L('Tillegg nå', 'Allowance now'), Math.round(pct * 100) + ' %') + kv(L('Levert fersk denne uka', 'Landed fresh this week'), fmt(wk ? q.ffTot : 0, 0) + ' kg') + kv(L('Torsk på tillegget', 'Cod on the allowance'), fmt(wk ? q.ffCod : 0, 0) + ' kg') + '<p class="ph-note">' + L('Torsk opp til denne andelen av alt du lander fersk mandag–søndag belastes ikke kvoten. Hyse under 0,8 kg teller ikke med.', 'Cod up to this share of everything you land fresh Monday–Sunday does not count against the quota. Haddock under 0.8 kg does not count.') + '</p>'
        : '<p class="ph-note">' + L('Starter 29. juni. Da kan du fiske torsk utenom kvoten tilsvarende 20 % av det du lander fersk hver uke, og andelen øker utover høsten.', 'Starts 29 June. From then, cod up to 20% of what you land fresh each week comes on top of the quota, rising through the autumn.') + '</p>') + '</div>');
      if (!S.lic && !noAcc) h.push('<div class="ph-card"><h4>' + L('Hyse og sei', 'Haddock and saithe') + '</h4>' + kv(L('Hyse landet', 'Haddock landed'), fmt(q.hyse / 1000, 2) + ' t') + kv(L('Hyse, garantert', 'Haddock, guaranteed'), fmt(QUOTA.hyseG[lenGroup()] / 1000, 1) + ' t') + kv(L('Sei landet', 'Saithe landed'), fmt(q.sei / 1000, 2) + ' t') + kv(L('Sei, garantert', 'Saithe, guaranteed'), fmt(QUOTA.seiG / 1000, 1) + ' t') + '<p class="ph-note">' + L('Fritt fiske så lenge gruppekvoten ikke er tatt.', 'Free fishing as long as the group quota is not taken.') + '</p></div>');
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
  const STATIONS = [{n:'Finnsnes', p:() => PORTS[0].p}, {n:'Gryllefjord', p:() => portById('gryllefjord').p}];
  function redning(){
    const b = S.boat, bars = inPort() ? 4 : coverage(b.pos), can = bars > 0 || S.equip.vhf, np = nearestPort(b.pos), H = S.t / 60, lvl = riskLevel(windAt(H), hsAt(b.pos, H));
    const st = STATIONS.map(q => ({n:q.n, d:dist(q.p(), b.pos)})).sort((a, c) => a.d - c.d)[0], eta = Math.round(st.d / (25 * NM) * 60) + 10;
    const h = ['<div class="ph-c"><div class="ph-card"><h4>' + L('Din posisjon', 'Your position') + '</h4><p>' + coordStr(b.pos) + '</p>' + kv(L('Nærmeste havn', 'Nearest port'), np.name + ', ' + fmt(dist(np.p, b.pos) / NM, 1) + ' nm') + kv(L('Dekning', 'Coverage'), bars ? bars + '/4' : L('Ingen', 'None')) + kv('VHF', S.equip.vhf ? L('Ja, kanal 16', 'Yes, channel 16') : L('Ikke montert', 'Not fitted')) + '</div>'];
    if (inPort()) h.push('<div class="ph-card"><p>' + L('Du ligger trygt i havn.', 'You are safely in port.') + '</p></div>');
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
  // what a purchase costs with or without a trade-in, and whether cash or the bank covers it
  const deal = (price, ti) => { const cost = price - ti, eqNeed = Math.max(0, price * 0.2 - ti), loanNeed = Math.max(0, cost - Math.max(0, S.cash - 5000)); return {cost, eqNeed, loanNeed, ok:S.cash >= cost || (loanNeed <= price * 0.8 && S.cash >= eqNeed && S.sales.length >= 3)}; };
  const payNote = (x, no, en, loanNo, loanEn) => '<p class="ph-note">' + L(no, en) + kr(x.cost) + (S.cash < x.cost ? ' · ' + L(loanNo || 'lån ', loanEn || 'loan ') + kr(x.loanNeed) + ', ' + L('egenkapital ', 'equity ') + kr(x.eqNeed) : '') + '</p>';
  const accessText = v => { const lic = vget(v, 'lic'); return lic ? L('lukket gruppe, hjemmelslengde ', 'closed group, quota length ') + lic.hl : v.id === openVesselId() ? L('åpen gruppe når du selv er om bord', 'open group when you are aboard yourself') : L('ingen adgang: torsk, hyse og sei bare som bifangst', 'no access: cod, haddock and saithe only as bycatch'); };
  const tiLocked = v => !!(S.order && S.order.vid !== null && (S.order.vid || S.cur) === v.id);
  // the next things to save up for: the hand jig, the first jigging machine, then bigger vessels and quota; where to buy each
  function goals(){
    const steps = [], ti = tradeIn();
    if (!S.boat.gear) steps.push([L('Håndjuksa med pilk og markkroker', 'Hand jig with pilk and fly hooks'), PRICE.gear, false, 'fiske']);
    if ((S.equip.jukse || 0) < 1) steps.push([L('Første juksamaskin', 'First jigging machine'), EQUIP.jukse.price, false, 'utstyr']);
    const owned = S.fleet.map(v => vget(v, 'boat').type);
    for (const k of ['snekke', 'sjark']) if (!owned.includes(k) && VESSELS[k].price > VESSELS[S.boat.type].price) steps.push([VESSELS[k].name[S.lang], VESSELS[k].price, true, 'fartoy']);
    for (const O of LIC_OFFERS) if (!(S.lic && S.lic.id === O.id)) steps.push([O[S.lang], VESSELS[O.ves].price + licValue(O), true, 'fartoy']);
    return steps.slice(0, 2).map(([n, pr, bank, a]) => { const need = bank ? Math.max(0, pr * 0.2 - ti) + 5000 : pr; return {n, need, bank, a, pc:Math.min(1, Math.max(0, S.cash) / Math.max(1, need))}; });
  }
  function goalsCard(){
    const g = goals(); if (!g.length) return '';
    return '<div class="ph-card"><h4>' + L('Neste mål', 'Next goals') + '</h4>' + g.map(x => '<p style="margin:6px 0 2px"><b>' + x.n + '</b><br><small>' + (x.bank ? L('Egenkapital banken krever: ', 'Equity the bank wants: ') : L('Pris: ', 'Price: ')) + kr(x.need) + (x.bank && S.sales.length < 3 ? ' · ' + L('og tre sluttsedler', 'and three landing notes') : '') + '</small></p><div class="qbar"><i style="width:' + (x.pc * 100).toFixed(1) + '%"></i></div>' +
      (x.pc >= 1 && x.a !== 'fartoy' ? '<button class="ph-btn" data-pa="open" data-a="' + x.a + '">' + L('Til butikken', 'To the shop') + '</button>' : x.pc >= 1 && !x.bank ? '' : x.pc >= 1 ? '<button class="ph-btn" data-pa="sub" data-s="marked">' + L('Se markedet', 'See the market') + '</button>' : '')).join('') + '</div>';
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
        kv(L('Juksa', 'Jig line'), b.gear ? L('i orden', 'fine') : '<span class="r2">' + L('ingen, fisker med stang', 'none, using a rod') + '</span>') + '<button class="ph-btn" data-pa="open" data-a="verksted">' + L('Til verkstedet', 'To the workshop') + '</button></div>');
      // the echo sounder and the sonar say when they are switched off on the chart plotter
      const off = k => (k === 'chirp' && S.settings.echo === false) || (k === 'sonar' && S.settings.sonar === false) ? L(' (av)', ' (off)') : '';
      const eq = Object.keys(EQUIP).filter(k => EQUIP[k].multi ? S.equip[k] > 0 : S.equip[k]).map(k => EQUIP[k].name[S.lang] + (EQUIP[k].multi ? ' × ' + S.equip[k] : '') + off(k));
      h.push('<div class="ph-card"><h4>' + L('Utstyr om bord', 'Equipment on board') + '</h4><p>' + ['GPS'].concat(S.equip.chirp ? [] : [L('Enkelt ekkolodd', 'Basic sounder') + (S.settings.echo === false ? L(' (av)', ' (off)') : '')]).concat(eq).join(', ') + '</p><h4 style="margin-top:8px">' + L('Mannskap', 'Crew') + '</h4><p>' + [L('Deg (skipper)', 'You (skipper)')].concat(S.crew.map(c => c.name)).join(', ') + ' · ' + L('plass til ', 'room for ') + (V.crewMax + 1) + '</p></div>');
      if (S.order) h.push('<div class="ph-card"><h4>' + L('Bestilt', 'On order') + '</h4><p>' + VESSELS[S.order.type].name[S.lang] + '</p>' + kv(L('Klar', 'Ready'), dayStr(S.order.due / 60)) + '<p class="ph-note">' + L('Overtas i Finnsnes.', 'Handover in Finnsnes.') + '</p></div>');
    } else {
      const ti = tradeIn();
      const bn = '«' + S.boatName + '»', free = inPort() && !S.order;
      h.push('<p class="ph-note">' + L('Innbytte for ' + bn + ': ', 'Trade-in for ' + bn + ': ') + '<b>' + kr(ti) + '</b>. ' + L('Du kan bytte inn båten du følger, eller kjøpe en båt til i flåten. ', 'You can trade in the vessel you are following, or buy another vessel for the fleet. ') + L('Kystbanken låner ut inntil 80 % mot pant i båten', 'Kystbanken lends up to 80% secured on the vessel') + (S.sales.length < 3 ? L(', men vil først se minst tre sluttsedler (' + S.sales.length + '/3).', ', but first wants to see at least three landing notes (' + S.sales.length + '/3).') : '.') + '</p>');
      if (tiLocked(curVessel())) h.push('<p class="ph-note">' + L(bn + ' er satt i bytte mot nybygget.', bn + ' is traded in against the new build.') + '</p>');
      for (const [k, V2] of Object.entries(VESSELS)){
        const same = S.boat.type === k, A = deal(V2.price, ti), B = deal(V2.price, 0), verb = V2.isNew ? L('Bestill', 'Order') : L('Kjøp', 'Buy');
        h.push('<div class="ph-card"><h4>' + V2.name[S.lang] + (V2.isNew ? ' · ' + L('nybygg', 'new build') : ' · ' + L('brukt', 'used')) + '</h4>' + kv(L('Pris', 'Price'), kr(V2.price)) + kv(L('Fart / last', 'Speed / hold'), V2.vmax + ' kn · ' + fmt(V2.holdCap, 0) + ' kg') + kv(L('Mannskap', 'Crew'), '1 + ' + V2.crewMax) + kv(L('Tåler', 'Handles'), fmt(V2.risk[0], 1) + ' m ' + L('bølger', 'waves')) +
          (same ? '<p class="ph-note">' + L('Samme type som ' + bn + '.', 'Same type as ' + bn + '.') + '</p>' : payNote(A, 'Mellomlegg med ' + bn + ' i bytte: ', 'To pay with ' + bn + ' traded in: ') + '<button class="ph-btn" data-pa="buy" data-ti="1" data-k="' + k + '"' + (A.ok && free ? '' : ' disabled') + '>' + verb + L(' og bytt inn ', ' and trade in ') + bn + '</button>') +
          payNote(B, 'Til flåten, uten innbytte: ', 'For the fleet, no trade-in: ') + '<button class="ph-btn p" data-pa="buy" data-ti="0" data-k="' + k + '"' + (B.ok && free ? '' : ' disabled') + '>' + verb + L(' til flåten', ' for the fleet') + '</button></div>');
      }
      h.push('<h4 style="margin:12px 2px 6px">' + L('Med kvote i lukket gruppe', 'With a closed-group quota') + '</h4>');
      { const ov = openVesselId(), ovn = ov && '«' + vget(vesselById(ov), 'boatName') + '»';
        if (ov) h.push('<p class="ph-note">' + L('Et rederi med en båt i lukket gruppe kan ikke ha noen båt i åpen gruppe. ' + ovn + ' mister plassen der' + (ov === S.cur ? ' hvis du kjøper en av disse til flåten.' : '.'), 'A company with a vessel in the closed group cannot have any vessel in the open group. ' + ovn + ' loses its place there' + (ov === S.cur ? ' if you buy one of these for the fleet.' : '.')) + '</p>'); }
      for (const O of LIC_OFFERS){
        const V2 = VESSELS[O.ves], price = V2.price + licValue(O), mine = S.lic && S.lic.id === O.id, A = deal(price, ti), B = deal(price, 0), yearly = Math.round(O.cod * avgPrice('torsk', S.t / 60, 7) / 1000) * 1000;
        h.push('<div class="ph-card"><h4>' + O[S.lang] + '</h4>' + kv(L('Pris', 'Price'), kr(price)) + kv(L('Herav kvote', 'Of which quota'), kr(licValue(O))) + kv(L('Hjemmelslengde', 'Quota length'), O.hl) + kv(L('Torskekvote', 'Cod quota'), fmt(O.cod / 1000, 2) + ' t · ' + L('ca. ', 'about ') + kr(yearly) + L('/år', '/yr')) +
          kv(L('Hyse / sei', 'Haddock / saithe'), L('fritt, garantert ', 'free, guaranteed ') + fmt(O.hyse[1] / 1000, 1) + ' / ' + fmt(O.sei[1] / 1000, 1) + ' t') +
          (mine ? '<p class="ph-note">' + L(bn + ' har denne kvoten.', bn + ' has this quota.') + '</p>' : payNote(A, 'Mellomlegg med ' + bn + ' i bytte: ', 'To pay with ' + bn + ' traded in: ', 'lån over 15 år ', '15-year loan ') + '<button class="ph-btn' + (A.ok ? ' p' : '') + '" data-pa="buylic" data-ti="1" data-id="' + O.id + '"' + (A.ok && free ? '' : ' disabled') + '>' + L('Kjøp og bytt inn ', 'Buy and trade in ') + bn + '</button>') +
          payNote(B, 'Til flåten, uten innbytte: ', 'For the fleet, no trade-in: ', 'lån over 15 år ', '15-year loan ') + '<button class="ph-btn" data-pa="buylic" data-ti="0" data-id="' + O.id + '"' + (B.ok && free ? '' : ' disabled') + '>' + L('Kjøp til flåten', 'Buy for the fleet') + '</button></div>');
      }
      if (!inPort()) h.push('<p class="ph-note">' + L('Båthandel gjøres i havn.', 'Vessel deals are done in port.') + '</p>');
    }
    h.push('</div>'); return h.join('');
  }
  // --- the company: the fleet at a glance and what needs you. The vessel apps work on the vessel picked at the top (default: the one you follow)
  const SEL_APPS = ['fartoy', 'utstyr', 'redskap', 'mannskap', 'bors', 'verksted'];
  const DRAWER = new Set(['fiske', 'fartoy', 'utstyr', 'redskap', 'mannskap', 'bors', 'bank', 'verksted', 'havn', 'last', 'lever', 'is', 'agn', 'oppdrag', 'beholdning']);
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
    if (b.status !== 'port' && S.settings.ice && b.ice < 1 && holdTotal() > 0) A('ice', 'Tom for is, fangsten ises ikke', 'Out of ice, the catch is not iced', 'beholdning:last');
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
    for (const [k, E] of Object.entries(EQUIP)){
      if (E.only && E.only !== S.boat.type) continue;
      if (E.types && !E.types.includes(S.boat.type)) continue;
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
        if (inPortNow && un > 0) h.push('<div class="ph-btncol">' + (egnPort(p) ? '<button class="ph-btn p" data-pa="gregn" data-lk="' + lk + '" data-n="' + un + '" data-m="shed">' + L('Egnebua egner ' + un, 'The shed baits ' + un) + ' (' + kr(un * (LINE_KINDS[lk].egn + LINE_KINDS[lk].baitKg * GPRICE.bait)) + ')</button>' : '') +
          '<button class="ph-btn" data-pa="gregn" data-lk="' + lk + '" data-n="' + un + '" data-m="self">' + L('Egn ' + un + ' selv', 'Bait ' + un + ' yourselves') + ' (' + fmt(un * LINE_KINDS[lk].baitKg, 0) + ' kg ' + L('agn', 'bait') + ')</button></div>'); }
      if (!pg.lines.hyse.n && !pg.lines.bank.n) h.push('<p class="ph-note">' + L('Ingen line om bord.', 'No line aboard.') + '</p>');
      h.push('</div><div class="ph-card"><h4>' + L('Teiner, blåser og agn', 'Pots, buoys and bait') + '</h4>' + kv(POTS.small[S.lang], pg.pots.small) + kv(POTS.big[S.lang], pg.pots.big) + kv(L('Blåsesett', 'Buoy sets'), pg.kits.n + (pg.kits.heavy ? ' (' + pg.kits.heavy + ' ' + L('med tung dregg', 'with heavy anchor') + ')' : '')) + kv(L('Agn', 'Bait'), fmt(pg.bait, 0) + ' kg') + '</div>');
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
        h.push(personCard(c, false).replace('</h4>', ' · ' + L(c.lv, c.lvEn) + '</h4>').replace('<div class="crewgrid">', '<div class="ph-kv"><span>' + L('Trivsel', 'Morale') + '</span><span>' + Math.round(c.morale) + '</span></div>' + bar2(c.morale, moodCol(c.morale)) + '<div class="ph-kv"><span>' + L('Slitenhet', 'Fatigue') + '</span><span>' + Math.round(c.fatigue) + '</span></div>' + bar2(c.fatigue, c.fatigue > 70 ? '#e5484d' : '#4c8df0') + kv(L('Lott', 'Share'), Math.round(c.share * 100) + ' %' + (c.share < c.ask - 0.001 ? ' · ' + L('ønsket ', 'wanted ') + Math.round(c.ask * 100) + ' %' : '')) + (away ? '<p class="ph-note">' + away + '</p>' : '') + '<div class="crewgrid">').replace(/<\/div>$/, '<div class="ph-row2"><button class="ph-btn" data-pa="coff" data-id="' + c.id + '">' + (c.off ? L('Tilbake om bord', 'Back aboard') : L('Gi fri neste tur', 'Next trip off')) + '</button><button class="ph-btn alt" data-pa="cfire" data-id="' + c.id + '">' + L('Si opp', 'Let go') + '</button></div></div>')); }
      if (S.crew.length >= 2){ const pr = []; for (let i = 0; i < S.crew.length; i++) for (let j = i + 1; j < S.crew.length; j++){ const k = compat(S.crew[i], S.crew[j]); pr.push('<div class="ph-kv"><span>' + S.crew[i].name.split(' ')[0] + ' og ' + S.crew[j].name.split(' ')[0] + '</span><span>' + (k >= 1 ? L('😊 god', '😊 good') : k <= -2 ? L('😠 dårlig', '😠 poor') : L('😐 grei', '😐 fair')) + '</span></div>'); }
        h.push('<div class="ph-card"><h4>' + L('Kjemi', 'Chemistry') + '</h4>' + pr.join('') + '<p class="ph-note">' + L('Dårlig kjemi gir krangler, særlig når folk er slitne eller misfornøyde.', 'Poor chemistry leads to quarrels, especially when people are tired or unhappy.') + '</p></div>'); }
      const wl = S.workLog || [], rest = wl.filter(v => !v).length;
      if (S.crew.length) h.push('<div class="ph-card"><h4>' + L('Hvile', 'Rest') + '</h4>' + kv(L('Hvile siste døgn', 'Rest in the last day'), rest + ' t') + '<p class="ph-note">' + L('Arbeidstidsreglene for fiskere krever minst 10 timer hvile i døgnet. For lite hvile gir slitne folk, dårligere fangst og krangler.', 'The working-time rules for fishers require at least 10 hours of rest a day. Too little rest means tired people, poorer catches and quarrels.') + '</p></div>'); }
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
    if (Lo){ h.push('<div class="ph-card"><h4>' + L('Båtlån', 'Vessel loan') + '</h4>' + kv(L('Restgjeld', 'Balance'), kr(Lo.bal)) + kv(L('Rente', 'Interest'), fmt(Lo.rate * 100, 1) + ' %') + kv(L('Terminbeløp', 'Monthly payment'), kr(Lo.pay)) + kv(L('Neste trekk', 'Next payment'), dayStr(Lo.next / 60)) + '<button class="ph-btn" data-pa="repay"' + (S.cash >= 10000 ? '' : ' disabled') + '>' + L('Innbetal 10 000 kr', 'Pay NOK 10 000') + '</button><button class="ph-btn alt" data-pa="repayAll"' + (S.cash >= Lo.bal ? '' : ' disabled') + '>' + L('Innfri lånet', 'Pay off the loan') + '</button></div>'); }
    else h.push('<div class="ph-card"><h4>' + L('Båtlån', 'Vessel loan') + '</h4><p>' + L('Kystbanken finansierer inntil 80 % av båtprisen mot pant i fartøyet. Nedbetaling over 10 år, rente 6,9 %. Søk direkte fra Båthandel under Verft når du kjøper.', 'Kystbanken finances up to 80% of the price secured on the vessel, repaid over 10 years at 6.9%. Apply straight from the boat market in the yard when you buy.') + '</p></div>');
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
    b.type = k; if (k !== 'skiff') S.equip.motor90 = false; for (const [q, E] of Object.entries(EQUIP)) if (E.types && !E.types.includes(k)) S.equip[q] = false; applyVessel(); loreNewBoat(S.boatName);
    S.equip.jukse = Math.min(S.equip.jukse, BOAT.jukseMax); b.fuel = BOAT.fuelCap * 0.4; b.ice = 0; b.engH = 0; b.svcAt = 0; S.svcTold = false;
    while (S.crew.length > BOAT.crewMax) S.crew.pop();
    if (!S.owned.includes(k)) S.owned.push(k);
    log('Overtok ' + VESSELS[k].name.no + '. ' + old.name.no + ' er solgt.', 'Took over the ' + VESSELS[k].name.en + '. The ' + old.name.en + ' has been sold.');
    if (typeof G3 !== 'undefined') G3.vesselChanged();
  }
  function takeLoan(amount, months){
    const rate = 0.069, r = rate / 12, n = months || 120; const bal = (S.loan ? S.loan.bal : 0) + amount;
    S.loan = {bal, rate, pay:Math.round(bal * r / (1 - Math.pow(1 + r, -n))), next:S.loan ? S.loan.next : S.t + 30 * 24 * 60};
    S.cash += amount; msg('Kystbanken', 'Lånet på ' + Math.round(amount) + ' kr er utbetalt. Terminbeløp ' + S.loan.pay + ' kr.', 'The loan of NOK ' + Math.round(amount) + ' has been paid out. Monthly payment NOK ' + S.loan.pay + '.');
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
    else if (a === 'sub'){ sub[app] = d.s; }
    else if (a === 'salgW'){ sub.salgW = d.s; }
    else if (a === 'tow'){ rescue(true); toast(L('Redningsskøyta slepte deg inn.', 'The rescue boat towed you in.')); }
    else if (a === 'mayday'){ confirmMayday = true; }
    else if (a === 'mayday0'){ confirmMayday = false; }
    else if (a === 'mayday2'){ confirmMayday = false; rescue(false); toast(L('Redningsskøyta har hentet deg.', 'The rescue boat has picked you up.')); }
    else if (a === 'member'){ if (S.cash < PRICE.member){ toast(t('no_cash')); return; } S.cash -= PRICE.member; S.stats.costs += PRICE.member; S.member = true; log('Ble medlem i redningstjenesten.', 'Joined the rescue service.'); }
    else if (a === 'svc'){ const c = d.m === 'self' ? Math.round(VESSELS[b.type].svcCost * 0.35) : VESSELS[b.type].svcCost, hh = d.m === 'self' ? Math.round(SVC_H[b.type] * 2.5) : SVC_H[b.type]; if (S.cash < c){ toast(t('no_cash')); return; } if (!queueJob({kind:'svc', h:hh, no:d.m === 'self' ? 'Egen service på motoren' : 'Service på verkstedet', en:d.m === 'self' ? 'Servicing the engine yourself' : 'Engine service at the yard'})){ toast(L('Arbeidskøen er full.', 'The work queue is full.')); return; } S.cash -= c; S.stats.costs += c; }
    else if (a === 'prep'){ const P2 = PREP[d.k]; if (S.cash < P2.cost){ toast(t('no_cash')); return; } if (!queueJob({kind:'prep', k:d.k, h:P2.h, no:P2.no, en:P2.en})){ toast(L('Arbeidskøen er full.', 'The work queue is full.')); return; } S.cash -= P2.cost; S.stats.costs += P2.cost; }
    else if (a === 'grbuy'){ const why = buyGear(d.w, isNaN(+d.s) ? d.s : +d.s, +d.n); if (why){ toast(why[0]); return; } }
    else if (a === 'grrep'){ reportLost(d.id); }
    else if (a === 'book'){ show(false); BOOK.open('salg', +d.i); return false; }
    else if (a === 'goset'){ const s = (S.sets || []).find(x => x.id === d.id); if (s) DOCK.goTo(s); return false; }
    else if (a === 'gregn'){ const why = d.m === 'shed' ? egnOrder(d.lk, +d.n) : egnSelf(d.lk, +d.n); if (why){ toast(why[0]); return; } }
    else if (a === 'grmend'){ const why = d.m === 'bot' ? botOrder(d.id) : mendSelf(d.id); if (why){ toast(why[0]); return; } }
    else if (a === 'grsplit'){ const l = S.pgear.nets.find(x => x.id === d.id); if (l) splitNets(l.id, Math.floor(l.n / 2)); }
    else if (a === 'grjoin'){ joinNets(d.a, d.b); }
    else if (a === 'jobx'){ const j = (S.jobs || [])[+d.i]; if (j && +d.i > 0){ S.jobs.splice(+d.i, 1); gearJobCancel(j); const refund = j.kind === 'prep' ? PREP[j.k].cost : j.kind === 'fit' ? EQUIP[j.k].price : 0; S.cash += refund; S.stats.costs -= refund; } }
    else if (a === 'service'){ const c = VESSELS[b.type].svcCost; if (S.cash < c){ toast(t('no_cash')); return; } S.cash -= c; S.stats.costs += c; b.svcAt = b.engH || 0; S.svcTold = false; log('Motorservice utført.', 'Engine serviced.'); }
    else if (a === 'equip'){ const E = EQUIP[d.k]; if (!inPort() || S.cash < E.price) return; if (!queueJob({kind:'fit', k:d.k, h:fitHours(d.k), no:'Montering av ' + E.name.no.toLowerCase(), en:'Fitting the ' + E.name.en})){ toast(L('Arbeidskøen er full.', 'The work queue is full.')); return; } S.cash -= E.price; S.stats.costs += E.price; log('Kjøpt ' + E.name.no + '. Monteres i verkstedet.', 'Bought the ' + E.name.en + '. Being fitted at the yard.'); } else if (a === 'equipOLD'){ const E = EQUIP[d.k]; if (E.multi) S.equip[d.k] = (S.equip[d.k] || 0) + 1; else S.equip[d.k] = true; applyVessel(); log('Montert: ' + E.name.no + '.', 'Fitted: ' + E.name.en + '.'); updateMapButtons(); INSTR.show(); }
    else if (a === 'ops_on'){ if (!S.ops) return; if (!S.ops.on && !opsSkipper()){ toast(L('Velg en skipper først.', 'Choose a skipper first.')); return; } S.ops.on = !S.ops.on; log(S.ops.on ? 'Fast driftsplan slått på.' : 'Fast driftsplan slått av.', S.ops.on ? 'Standing plan switched on.' : 'Standing plan switched off.'); }
    else if (a === 'ops_dep'){ S.ops.dep = (S.ops.dep + (+d.d) + 24) % 24; }
    else if (a === 'ops_day'){ const i = +d.i; S.ops.days[i] = S.ops.days[i] ? 0 : 1; }
    else if (a === 'ops_w'){ S.ops.maxWind = clamp(S.ops.maxWind + (+d.d), 6, 20); }
    else if (a === 'ops_sk'){ S.ops.skipper = d.id; }
    else if (a === 'hire'){ const c = candidates().find(x => x.id === d.id); if (c && S.crew.length < BOAT.crewMax){ S.crew.push(c); log(c.name + ' er ansatt som ' + c.lv + '.', c.name + ' joined as ' + c.lvEn + '.'); } }
    else if (a === 'fire'){ const c = S.crew.splice(+d.i, 1)[0]; if (c) log(c.name + ' har gått i land.', c.name + ' has gone ashore.'); }
    else if (a === 'repay'){ const x = Math.min(10000, S.loan.bal); S.cash -= x; S.loan.bal -= x; if (S.loan.bal < 1) S.loan = null; }
    else if (a === 'repayAll'){ S.cash -= S.loan.bal; S.loan = null; log('Båtlånet er innfridd.', 'The vessel loan is paid off.'); }
    else if (a === 'buy'){
      // data-ti="1": trade in the vessel you follow; data-ti="0": add a vessel to the fleet
      const V2 = VESSELS[d.k], ti = d.ti === '0' ? 0 : tradeIn(), cost = V2.price - ti; if (!inPort() || S.order || (ti && S.boat.type === d.k)) return;
      if (S.cash < cost){ const need = cost - Math.max(0, S.cash - 5000); if (need > V2.price * 0.8 || S.cash < Math.max(0, V2.price * 0.2 - ti) || S.sales.length < 3){ toast(t('no_cash')); return; } takeLoan(need); }
      S.cash -= cost;
      if (V2.isNew){ S.order = {type:d.k, due:S.t + 45 * 24 * 60, vid:ti ? S.cur : null}; log('Bestilte ' + V2.name.no + '. Levering om 45 døgn' + (ti ? ', mot «' + S.boatName + '» i bytte.' : ' til flåten.'), 'Ordered the ' + V2.name.en + '. Delivery in 45 days' + (ti ? ', with «' + S.boatName + '» traded in.' : ' for the fleet.')); }
      else if (ti) switchVessel(d.k);
      else { const v = newVesselObj(d.k, S.boat.port); log('Kjøpte ' + V2.name.no + ' til flåten. Hun heter «' + v.boatName + '» og ligger i ' + portById(S.boat.port).name + '.', 'Bought the ' + V2.name.en + ' for the fleet. She is called «' + v.boatName + '» and lies at ' + portById(S.boat.port).name + '.'); }
      if (ti && S.lic){ log('Kvoten i lukket gruppe fulgte med den gamle båten.', 'The closed-group quota went with the old vessel.'); S.lic = null; }
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
      if (!confirm(L('Selge «' + nm + '» for ' + kr(val) + '?', 'Sell the «' + nm + '» for ' + kr(val) + '?'))) return;
      if (v.id === S.cur){ bindVessel(vesselById(S.me)); if (typeof G3 !== 'undefined') G3.vesselChanged(); }
      S.fleet.splice(S.fleet.indexOf(v), 1); S.cash += val;
      log('Solgte «' + nm + '» for ' + kr(val) + '.' + (hands ? ' Mannskapet hennes gikk i land.' : ''), 'Sold the «' + nm + '» for ' + kr(val) + '.' + (hands ? ' Her crew went ashore.' : '')); refreshAll(); }
    else if (a === 'bhire' || a === 'bneg'){ const B = S.bors, c = B && B.pool.find(x => x.id === d.id); if (!c || S.crew.length >= BOAT.crewMax || S.boat.status !== 'port') return;
      if (a === 'bneg'){ c.neg = true; if (Math.random() < 0.6 - (c.traits.includes('stolt') ? 0.25 : 0)){ c.ask = Math.max(0.06, Math.round((c.ask - 0.02) * 100) / 100); c.share = c.ask; c.morale -= 5; toast(L(c.name.split(' ')[0] + ' godtar ' + Math.round(c.ask * 100) + ' %.', c.name.split(' ')[0] + ' accepts ' + Math.round(c.ask * 100) + '%.')); }
        else { B.pool.splice(B.pool.indexOf(c), 1); toast(L(c.name.split(' ')[0] + ' takket nei og tok hyre et annet sted.', c.name.split(' ')[0] + ' said no and took a berth elsewhere.')); } }
      else { B.pool.splice(B.pool.indexOf(c), 1); c.hiredT = S.t; c.earn = []; delete c.until; S.crew.push(c); log(c.name + ' har mønstret på som ' + c.lv + ' med ' + Math.round(c.share * 100) + ' % lott.', c.name + ' signed on as ' + c.lvEn + ' on a ' + Math.round(c.share * 100) + '% share.'); } }
    else if (a === 'coff'){ const c = crewById(d.id); if (c){ c.off = !c.off; if (c.off){ c.morale = Math.min(100, c.morale + 2); } } }
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
    else if (a === 'haillbuy'){ if (tutFree('haill') && d.k !== 'luksus') return; giveHaill(d.k, 'shop'); if (tutFree('haill')) tutMark('free_haill'); toast(HAILL[d.k][S.lang] + L(' er om bord.', ' is aboard.')); }
    else if (a === 'jobOT'){ const j = S.jobs && S.jobs[0]; if (!j || j.until == null || j.ot) return; const left = Math.max(0, j.until - S.t) / 60, c = Math.round(left / 2 * 950 / 10) * 10; if (S.cash < c){ toast(t('no_cash')); return; }
      S.cash -= c; S.stats.costs += c; j.until = S.t + (j.until - S.t) / 2; j.ot = true; log('Leide inn mekaniker på overtid for ' + c + ' kr.', 'Hired a mechanic on overtime for NOK ' + c + '.'); }
    else if (a === 'jobRush'){ const j = S.jobs && S.jobs[0]; if (!j || j.until == null) return; j.until = S.t; log('Hastejobb: mekanikerne gjorde ferdig med én gang.', 'Rush job: the mechanics finished straight away.'); }
    else if (a === 'buylic'){
      const O = LIC_OFFERS.find(x => x.id === d.id); if (!O || !inPort() || S.order) return;
      const price = VESSELS[O.ves].price + licValue(O), ti = d.ti === '0' ? 0 : tradeIn(), cost = price - ti; if (ti && S.lic && S.lic.id === O.id) return;
      if (S.cash < cost){ const need = cost - Math.max(0, S.cash - 5000); if (need > price * 0.8 || S.cash < Math.max(0, price * 0.2 - ti) || S.sales.length < 3){ toast(t('no_cash')); return; } takeLoan(need, 180); }
      const lic = {id:O.id, hl:O.hl, cod:O.cod, hyse:O.hyse, sei:O.sei, kpk:O.kpk}, ov = openVesselId(), lost = ov && !(ti && ov === S.cur) ? vget(vesselById(ov), 'boatName') : null;
      S.cash -= cost; let nm;
      if (ti){ switchVessel(O.ves); S.lic = lic; nm = S.boatName; }
      else { const v = newVesselObj(O.ves, S.boat.port, lic); nm = v.boatName; log('Kjøpte ' + O.no.toLowerCase() + ' til flåten. Hun heter «' + nm + '».', 'Bought a ' + O.en.toLowerCase() + ' for the fleet. She is called «' + nm + '».'); }
      msg('Fiskeridirektoratet', 'Deltakeradgangen i lukket gruppe (hjemmelslengde ' + O.hl + ') er registrert på «' + nm + '». Torskekvoten for resten av året er ' + fmt(O.cod / 1000, 2) + ' tonn, fratrukket det båten har fisket i år.' + (lost ? ' Rederiet har nå en båt i lukket gruppe, så «' + lost + '» kan ikke lenger delta i åpen gruppe.' : ''), 'The closed-group participation right (quota length ' + O.hl + ') is registered to the «' + nm + '». The cod quota for the rest of the year is ' + fmt(O.cod / 1000, 2) + ' t, less what the vessel has fished this year.' + (lost ? ' The company now has a vessel in the closed group, so the «' + lost + '» can no longer take part in the open group.' : ''));
    }
    return true;
  }
  view.addEventListener('click', e => { const t0 = e.target.closest('[data-pa],[data-act]'); if (!t0 || t0.disabled) return; if (t0.dataset.pa) act(t0.dataset.pa, t0.dataset); else { doAct(t0); render(); } });
  view.addEventListener('input', e => panelInput(e));
  view.addEventListener('change', e => { if (e.target.id === 'phPace'){ S.mult = +e.target.value; $('pace').value = String(S.mult); save(); return; } panelChange(e); if (e.target.id === 'setAuto') render(); });
  el.querySelector('.ph-nav').addEventListener('click', e => { const t0 = e.target.closest('[data-pa]'); if (t0) act(t0.dataset.pa, t0.dataset); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && isOpen) show(false); });
  el.classList.add('off');
  return {show, toggle(){ show(!isOpen); }, open(a){ if (DRAWER.has(String(a).split(':')[0])){ show(false); DOCK.open(a); } else show(true, a); }, page, dact, DRAWER, isOpen:() => isOpen, render, status, setBadge, tickHome, switchVessel, alerts, get app(){ return app; }, get sel(){ return selVessel().id; }};
})();

