  function home(){
    const H = S.t / 60, W = windAt(H), n = unread(), na = alerts().length, np = patchNew(), npost = pressUnread(), nhb = typeof hbReady === 'function' && !tutOn() ? hbReady() : 0;
    return '<div class="ph-homescr"><div class="ph-clock">' + hm(H) + '</div><div class="ph-date">' + dayStr(H) + '</div>' +
      '<div class="ph-widget"><span class="w1">' + dirName(windDir(H)) + ' ' + fmt(W, 0) + ' m/s · ' + fmt(Math.round(airTemp(H)) || 0, 0) + ' °C</span><span class="w2">' + kr(S.cash) + '</span></div>' +
      ((g => g ? '<button class="ph-goal" data-pa="open" data-a="fartoy"><span>' + L('Neste mål: ', 'Next goal: ') + '<b>' + g.n + '</b></span><small>' + (g.txt || kr(Math.min(Math.max(0, S.cash), g.need)) + ' / ' + kr(g.need)) + '</small><span class="gb"><i style="width:' + (g.pc * 100).toFixed(1) + '%"></i></span></button>' : '')(goals()[0])) +
      (typeof achChip === 'function' ? achChip() : '') + fsChip() +
      '<div class="ph-grid">' + APPS.filter(a => (a[0] !== 'admin' || adminOk()) && (a[0] !== 'rederi' || rederiOpen()) && !KBT.includes(a[0])).map(a => '<button class="ph-app" data-pa="open" data-a="' + a[0] + '"><span class="ic" style="background:linear-gradient(160deg,' + a[3] + ',' + a[3] + 'cc)">' + IC[a[0]] + '</span>' + L(a[1], a[2]) + (a[0] === 'meld' && n ? '<span class="bd">' + n + '</span>' : '') + (a[0] === 'ordl' && ordState().active.length ? '<span class="bd">' + ordState().active.length + '</span>' : '') + (a[0] === 'rederi' && na ? '<span class="bd">' + na + '</span>' : '') + (a[0] === 'patch' && np ? '<span class="bd">' + np + '</span>' : '') + (a[0] === 'handbok' && nhb ? '<span class="bd">' + nhb + '</span>' : '') + (a[0] === 'post' && npost ? '<span class="bd">' + npost + '</span>' : '') + '</button>').join('') + '</div></div>';
  }
  const kv = (a, b) => '<div class="ph-kv"><span>' + a + '</span><span>' + b + '</span></div>';
  const tq = (kg, d) => isFinite(kg) ? fmt(kg / 1000, d) + ' t' : L('ingen grense', 'no limit');   // a quota in tonnes, or no limit
  const subs = (a, list) => '<div class="ph-sub">' + list.map(([k, no, en]) => '<button class="' + ((sub[a] || list[0][0]) === k ? 'on' : '') + '" data-pa="sub" data-s="' + k + '">' + L(no, en) + '</button>').join('') + '</div>';
  const inPort = () => S.boat.status === 'port';
  // the boat lies at a place where things are bought and sold: Father's naust is a home, not a place of trade (Jonas 07.10.2026)
  const atTrade = () => inPort() && berthKind(S.boat) !== 'naust';
  // at a place that offers this (core/06c-steder.js portServices): 'mottak' the plant, 'butikk' the tackle shop, 'verft' the yard
  const atKind = k => atTrade() && !!portServices(portById(S.boat.port), berthKind(S.boat))[k];
  const EQ_YARD = k => k === 'antigro' || k === 'motor90';
  // the nearest place of a kind from the boat, with Autonav there (Jonas 07.10.2026: «hjelp for å finne nærmeste butikk, verft og mottak»)
  const KIND_NAME = {mottak:['fiskemottaket', 'the fish plant'], butikk:['utstyrsbutikken', 'the tackle shop'], verft:['verftet', 'the yard']};
  function nearHint(kind){
    const n = placesNear(S.boat.pos, kind, 1)[0]; if (!n) return '';
    return '<div class="ph-card"><p class="ph-note">' + L('Nærmeste ' + KIND_NAME[kind][0] + ': ', 'Nearest ' + KIND_NAME[kind][1] + ': ') + '<b>' + n.pt.name + '</b> · ' + fmt(n.d / NM, 1) + ' nm</p><button class="ph-btn" data-pa="goplace" data-id="' + n.pt.id + '">' + L('Autonav dit', 'Autonav there') + '</button></div>';
  }
  // --- the seaman's life: the tattoos you have earned, and the old ways at sea you have heard of
  function tattoos(){
    const got = S.tattoos || {}, c = tatCounts(), n = TATS.filter(T => got[T.id]).length;
    // only the list (Jonas 05.10.2026: «Fjern sjømannen helt, jeg vil kun ha listen med tatoveringene»)
    const h = ['<div class="ph-card"><h4>' + L('Tatoveringer', 'Tattoos') + '</h4><p class="ph-note">' + L('Sjøfolkets gamle merker kommer av seg selv når du har gjort deg fortjent til dem. Du har ', 'The old marks of seafarers come by themselves when you have earned them. You have ') + n + L(' av ', ' of ') + TATS.length + '.</p></div>'];
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
  // the papers a fisher carries, shown where they matter (Jonas 09.10.2026: the Sjømann app is gone): blad B and the permit in the Kvote
  // app, the business there too until the Rederi app opens (rederiOpen), then in Rederi. The made-up certificates (health, safety course, skipper, SRC) are no longer shown.
  const papWho = () => S.company ? L('Skipper i ', 'Skipper of ') + S.company : L('Skipper på «', 'Skipper of the «') + (S.boatName || 'Havbris') + '»';
  const papCard = (col, title, rows, note) => '<div class="ph-card papc"><div class="pap-h" style="background:' + col + '">' + title + '</div>' + rows.map(([a, b]) => kv(a, b)).join('') + (note ? '<p class="ph-note">' + note + '</p>' : '') + '</div>';
  function papBladB(){ const who = papWho(), card = papCard;
    return (F => card('#7a5a2c', L('Fiskermanntallet, blad B', 'Fishermen\'s register, blad B'), [[L('Navn', 'Name'), who], [L('Landingsdager med deg om bord', 'Landing days with you aboard'), fmt(F.n, 0) + ' / ' + BLADB.days], [L('Førstehåndsverdi', 'First-hand value'), kr(F.kr) + ' / ' + kr(BLADB.kr) + ' (1 G)'],
        ['Status', F.b ? '<span class="r0">' + L('Ført på blad B', 'On blad B') + '</span>' : L('Blad A: fiske er ikke hovedyrket ennå', 'Blad A: fishing is not your main occupation yet')]],
        L('Forenklet. Deltakerloven § 6 krever at den som kjøper en båt i lukket gruppe, har fisket i minst tre av de siste fem årene, og blad B er det vanlige beviset. I spillet holder det med ' + BLADB.days + ' landingsdager med deg om bord og 1 G i førstehåndsverdi.', 'Simplified. Deltakerloven § 6 asks the buyer of a closed-group boat to have fished in at least three of the last five years, and blad B is the usual proof. In the game, ' + BLADB.days + ' landing days with you aboard and 1 G of first-hand value will do.')))(S.fm || {n:0, kr:0, b:false});
  }
  function papPermit(){ const card = papCard;
    return card('#33617a', L('Ervervstillatelse', 'Fishing permit'), S.fleet.map(v => [vget(v, 'boatName') || L('Båten', 'The boat'), L('Gitt', 'Granted') + ' · ' + String((VESSELS[vget(v, 'boat').type] || {}).len || '').replace('.', ',') + ' m' + ((r => r ? ' · ' + regText(r) : '')(v.id === S.cur ? regOf(S.boat) : vget(v, 'boat').reg))]).concat([[L('Utstedt av', 'Issued by'), L('Fiskeridirektoratet', 'Directorate of Fisheries')]]),
        L('Deltakerloven § 4: en båt kan bare brukes i ervervsmessig fiske med ervervstillatelse for eieren. Under 15 m holder det at du er aktiv fisker (ervervstillatelsesforskriften § 2). I spillet gis den når du kjøper båten.', 'Deltakerloven § 4: a boat may be used in commercial fishing only with a permit for its owner. Under 15 m it is enough that you are an active fisher. In the game it comes with the boat.'));
  }
  // the business: in Kvote while it is a sole proprietorship, in Rederi once the company is founded (Jonas 09.10.2026)
  function papBiz(){ const card = papCard;
    return (M => card('#6b5b95', L('Foretaket', 'The business'), M ? [[L('Form', 'Form'), S.form === 'AS' ? L('Aksjeselskap (AS)', 'Limited company') : L('Enkeltpersonforetak (ENK)', 'Sole proprietorship')], [L('Org.nr.', 'Org. no.'), String(M.org).replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3')], [L('MVA-registrert', 'VAT registered'), bkDate(M.t)], ['Status', '<span class="r0">' + L('Registrert', 'Registered') + '</span>']]
          : [[L('Form', 'Form'), S.form === 'AS' ? L('Aksjeselskap (AS)', 'Limited company') : L('Enkeltpersonforetak (ENK)', 'Sole proprietorship')], [L('Salg siste tolv måneder', 'Sales in the last twelve months'), kr((S.sales || []).filter(s => s.t > S.t - 365 * 1440).reduce((a, s) => a + (s.total || 0), 0)) + ' / ' + kr(MVA.limit)], ['Status', L('Ikke registrert ennå', 'Not registered yet')]],
        L('Du trenger verken ENK eller AS for å fiske. Når salget passerer 50 000 kr på tolv måneder, må foretaket i Merverdiavgiftsregisteret (merverdiavgiftsloven § 2-1). Da legges MVA på 11,11 % på oppgjøret, og den går videre til staten. Org.nr. er fiktivt.', 'You need neither a sole proprietorship nor a company to fish. When the sales pass NOK 50,000 in twelve months, the business must enter the VAT register. Then 11.11 % VAT comes with the settlement and goes on to the state. The org. no. is fictional.')))(S.mva);
  }
  // the sea time (core/09e-fartstid.js): the years and days, the bar to the next year, and the rest built up while away
  function fsChip(){ const F = fsState(), o = fsOf(F.p), rest = Math.round(F.rest / 60);
    return '<button class="ph-goal ph-fs" data-pa="open" data-a="merker" data-s="merker"><span><b>' + fsText(F.p, true) + '</b></span><small>' + (rest > 0 ? L('Uthvilt: ' + rest + ' t med dobbel fartstid', 'Rested: ' + rest + ' h of double sea time') : L('Neste år: ' + (365 - o.d) + ' døgn igjen', 'Next year: ' + (365 - o.d) + ' days to go')) + '</small><span class="gb"><i style="width:' + (o.f * 100).toFixed(1) + '%"></i></span></button>'; }
  function fsCard(){ const F = fsState(), o = fsOf(F.p), rest = Math.round(F.rest / 60);
    return '<div class="ph-card"><h4>' + L('Fartstid', 'Sea time') + '</h4><div class="ph-big">' + fsText(F.p, true) + '</div><span class="gb fsbar"><i style="width:' + (o.f * 100).toFixed(1) + '%"></i></span>' +
      '<p class="ph-note">' + L('Fartstid tjenes om bord: hver time til sjøs og hver levering. Det mannskapet gjør mens du er borte, teller en firedel. Når du har vært borte, gir de neste timene til sjøs dobbel fartstid.', 'Sea time is earned aboard: every hour at sea and every landing. What the crew does while you are away counts a quarter. After time away, the next hours at sea give double sea time.') +
      (rest > 0 ? ' <b>' + L('Uthvilt: ' + rest + ' t igjen.', 'Rested: ' + rest + ' h left.') + '</b>' : '') + '</p></div>'; }
  // the Milepæler app (Jonas 09.10.2026: «alt av achievements ... samles i en enkelt app som kalles milepæler»): the week's milestones,
  // the long badges with the sea time, the record fish (the wall itself is in Father's naust), the old ways and the tattoos.
  // The app keeps its id 'merker'.
  function merker(){
    if (typeof achCheck === 'function') achCheck(true);
    const tab = sub.merker || 'uke', tabs = subs('merker', [['uke', 'Første uke', 'First week'], ['merker', 'Merker', 'Badges'], ['rekord', 'Rekordfisk', 'Record fish'], ['overtro', 'Fra gamle dager', 'The old ways'], ['tatover', 'Tatoveringer', 'Tattoos'], ['kyst', 'Kystfareren', 'Coastfarer']]);
    if (tab === 'tatover') return '<div class="ph-c">' + tabs + tattoos() + '</div>';
    if (tab === 'merker') return '<div class="ph-c">' + tabs + fsCard() + achLong() + '</div>';
    if (tab === 'rekord') return '<div class="ph-c">' + tabs + '<div class="ph-card">' + NOTEBOOK.wall(true) + '</div></div>';
    if (tab === 'overtro') return '<div class="ph-c">' + tabs + lore() + '</div>';
    if (tab === 'kyst') return '<div class="ph-c">' + tabs + GBOOK.kyst() + '</div>';   // the guestbooks signed (ui/10m-guestbook.js)
    return '<div class="ph-c">' + tabs + achWeek() + '</div>';
  }
  // the old ways you have heard (core/08-lore.js), the rest as unknown
  function lore(){
    const heard = S.lore || {}, ids = Object.keys(LORE), n = ids.filter(id => heard[id]).length;
    const h = ['<div class="ph-card"><h4>' + L('Fra gamle dager', 'The old ways') + '</h4><p class="ph-note">' + L('Sjøfolk og fiskere har alltid vært overtroiske. Det du hører om bord, på kaia og på puben, samles her. Du har hørt ', 'Seafarers and fishermen have always been superstitious. What you hear aboard, on the quay and at the pub is kept here. You have heard ') + n + L(' av ', ' of ') + ids.length + L(' fortellinger.', ' stories.') + '</p></div>'];
    for (const id of ids){ const E = LORE[id], w = heard[id];
      h.push(w ? '<div class="ph-card"><h4>' + L(E.t[0], E.t[1]) + '</h4><p>' + L(E.x[0], E.x[1]) + '</p><p class="ph-note">' + L('Hørt første gang ', 'First heard ') + dayStr(w.first / 60) + '</p></div>'
        : '<div class="ph-card" style="opacity:.55"><h4>?</h4><p class="ph-note">' + L('Ennå ikke hørt. Lytt til folk på sjøen og på puben.', 'Not heard yet. Listen to people at sea and at the pub.') + '</p></div>'); }
    return h.join('');
  }
  // --- weather
  function sunTimesOld(H){ const d0 = Math.floor(H / 24) * 24 - 6 + 24 * (gDate(H).getUTCHours() < 6 ? -0 : 0); let up = null, dn = null, prev = sunAt(d0).el; for (let m = 10; m <= 24 * 60; m += 10){ const e = sunAt(d0 + m / 60).el; if (prev < -0.8 && e >= -0.8 && up === null) up = d0 + m / 60; if (prev >= -0.8 && e < -0.8 && dn === null) dn = d0 + m / 60; prev = e; } return {up, dn, always:sunAt(d0 + 12).el > -0.8 && up === null, never:sunAt(d0 + 6).el < -0.8 && up === null}; }
  function vaer(){
    const b = S.boat, H = S.t / 60, W = windAt(H), hs = hsAt(b.pos, H), h = [], st = sunTimes(H), sq = seaHere(b.pos, H);
    const pr = precipAt(H), snow = airTemp(H) < 1, prs = pr < 0.08 ? t('p_none') : (pr < 0.4 ? t('p_light') + ' ' : pr > 0.75 ? t('p_heavy') + ' ' : '') + t(snow ? 'p_snow' : 'p_rain');
    h.push('<div class="ph-c"><div class="ph-card"><div class="ph-big">' + fmt(Math.round(airTemp(H)) || 0, 0) + ' °C · ' + dirName(windDir(H)) + ' ' + fmt(W, 0) + ' m/s</div><p>' + BFN[S.lang][beaufort(W)] + ', ' + prs + '. ' + BFS[S.lang][beaufort(W)] + '</p>' +
      kv(L('Bølger her', 'Waves here'), fmt(hs, 1) + ' m · ' + SEAN[S.lang][sq.code] + (sq.krapp ? L(', krapp', ', short and steep') : '')) + kv(L('Vindsjø', 'Wind sea'), fmt(sq.w, 1) + ' m' + (sq.w >= 0.1 ? L(' fra ', ' from ') + dirName(sq.dir) : '')) + kv(L('Dønning', 'Swell'), fmt(sq.sw, 1) + ' m' + (sq.sw >= 0.1 ? L(' fra ', ' from ') + dirName(sq.swDir) + ', ' + fmt(sq.swTp, 0) + ' s' : '')) + kv(L('Bølger på havet', 'Waves offshore'), fmt(hsOpen(H), 1) + ' m') + kv(L('Sikt', 'Visibility'), fmt(visibility(H), 0) + ' km') + kv(L('Sjøtemperatur', 'Sea temperature'), fmt(seaTemp(H), 1) + ' °C') +
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
  // the paper (ui/05g-press.js, core/09h-press.js): the front page and the local tab, and a story opened to read
  function post(){
    pressSeen(); if (typeof pressFetch === 'function') pressFetch(false);
    if (sub.postArt){ const s = pressFind(sub.postArt); if (s) return pressArticle(s); sub.postArt = null; }
    return '<div class="ph-mast">Kystposten</div><div class="ph-mdate">' + dayStr(S.t / 60) + ' · ' + L('Nyheter langs kysten', 'News along the coast') + '</div>' +
      subs('post', [['for', 'Forsiden', 'Front page'], ['lok', 'Lokalt', 'Local']]) + pressPage(sub.post === 'lok');
  }
  // --- sales organisation
  // s: one part on its own (the orders in the village, the quota as its own app)
  // the company's name while it is being typed on the sheet (a render must not lose it), and a name to offer
  let coDraft = null; const coDefault = () => (S.boatName || 'Havbris') + L(' Fiskeri', ' Fishing');
  function salg(s){
    const H = S.t / 60, s0 = s || (['pris', 'land', 'top'].includes(sub.salg) ? sub.salg : 'pris'), h = [s ? '' : subs('salg', [['pris', 'Priser', 'Prices'], ['land', 'Mine landinger', 'My landings'], ['top', 'Toppliste', 'Leaderboard']]), '<div class="ph-c">'];
    if (s0 === 'pris'){
      { const st = streakState(), p0 = st.pct;
        h.push('<div class="ph-card"><h4>' + L('Innloggingsbonus', 'Login bonus') + ' <span class="haill">+' + fmt(p0, 0) + ' %</span></h4><p>' + L('Du får ' + fmt(p0, 0) + ' % ekstra på fisken du leverer. Hver dag du åpner spillet gir 1 % til. Hver dag du ikke kommer innom, trekker 3 %.', 'You get ' + fmt(p0, 0) + ' % extra on the fish you land. Each day you open the game adds 1 %. Each day you stay away takes 3 % off.') + '</p>' +
          kv(L('I morgen', 'Tomorrow'), '+' + fmt(p0 + STREAK.step, 0) + ' %') + kv(L('Hvis du hopper over i morgen', 'If you skip tomorrow'), '+' + fmt(Math.max(0, p0 - STREAK.decay) + STREAK.step, 0) + ' % ' + L('i overmorgen', 'the day after')) + kv(L('Dager innom', 'Days logged in'), fmt(st.days, 0) + (st.best > p0 ? ' · ' + L('best ', 'best ') + fmt(st.best, 0) + ' %' : '')) + '</div>'); }
      h.push('<div class="ph-card"><h4>' + L('Førstehåndspriser, kr/kg', 'First-hand prices, NOK/kg') + '</h4><table class="ph-tbl"><tr><th>' + L('Art', 'Species') + '</th><th class="n">' + L('I dag', 'Today') + '</th><th class="n">' + L('7 døgn', '7 days') + '</th><th class="n">' + L('Minstepris', 'Minimum') + '</th></tr>');
      SP.forEach(sp => { const a1 = avgPrice(sp, H, 1), a7 = avgPrice(sp, H, 7), ar = a1 > a7 * 1.02 ? ' ▲' : a1 < a7 * 0.98 ? ' ▼' : ''; h.push('<tr><td>' + spName(sp) + '</td><td class="n">' + fmt(a1, 2) + ar + '</td><td class="n">' + fmt(a7, 2) + '</td><td class="n">' + fmt((SPECIES[sp].cls[SPECIES[sp].ref][1] * (SPECIES[sp].cls[SPECIES[sp].ref][3] || 1)), 2) + '</td></tr>'); });
      h.push('</table><p class="ph-note">' + L('Snitt av mottakene for A-kvalitet. Mottakene må betale minst minsteprisen.', 'Average across the fish plants for grade A. Plants must pay at least the minimum price.') + '</p></div>');
      // the regulars' bonus at the plants and the shop (ui/06d-season-folk.js FOLKAPP; moved here from the Folk app, Jonas 09.10.2026)
      h.push('<h4 style="margin:10px 2px 6px">' + L('Fast kunde', 'Regular customer') + '</h4>' + FOLKAPP.page());
      // the ten plants nearest the boat, with the way there (Jonas 04.10.2026: «salgslaget på telefonen må vise de 8-10 nærmeste fiskemottakene»)
      { const near = plantsNear(S.boat.pos, 10), S3 = ['torsk', 'hyse', 'sei'], best = sp => Math.max(...near.map(x => price(x.pt, sp, H)));
        h.push('<div class="ph-card"><h4>' + L('Nærmeste mottak i dag', 'Nearest plants today') + '</h4><table class="ph-tbl"><tr><th></th><th class="n">nm</th>' + S3.map(sp => '<th class="n">' + spName(sp).slice(0, 5) + '</th>').join('') + '</tr>' +
          near.map(({pt, d}) => '<tr' + (S.boat.port === pt.id ? ' class="here"' : '') + '><td>' + pt.name + '</td><td class="n">' + fmt(d / NM, d / NM < 10 ? 1 : 0) + '</td>' + S3.map(sp => { const v = price(pt, sp, H); return '<td class="n">' + (v >= best(sp) - 0.005 ? '<b>' + fmt(v, 0) + '</b>' : fmt(v, 0)) + '</td>'; }).join('') + '</tr>').join('') +
          '</table><p class="ph-note">' + L('Kr/kg for A-kvalitet. Fet skrift er beste pris av disse. Avstanden er i rett linje.', 'NOK/kg for grade A. Bold is the best price of these. The distance is as the crow flies.') + '</p></div>');
        // and the tackle shop and the yard (the three places of trade, Jonas 07.10.2026), each with Autonav there
        h.push(nearHint('butikk') + nearHint('verft')); }
    } else if (s0 === 'best'){
      const O = ordState(), cn = id => CUSTOMERS.find(c => c.id === id);
      const card = (o, act) => { const c = cn(o.cust), pr = price(portById(o.port), o.sp, H);
        return '<div class="ph-card"><h4>' + c.no + '</h4>' + kv(L('Vil ha', 'Wants'), fmt(o.kg, 0) + ' kg ' + SPECIES[o.sp][S.lang].toLowerCase() + (o.left < o.kg ? ' · ' + L('igjen ', 'left ') + fmt(o.left, 0) + ' kg' : '')) + kv(L('Kvalitet', 'Quality'), QN[o.q][S.lang]) + kv(L('Levering', 'Deliver at'), portById(o.port).name) +
          kv(L('Tillegg', 'Premium'), '+' + Math.round(o.prem * 100) + ' % · ' + L('ca. ', 'about ') + kr(Math.round(pr * o.prem)) + '/kg') + kv(L('Bonus når alt er levert', 'Bonus when complete'), kr(o.bonus)) +
          (act ? kv(L('Frist', 'Deadline'), dayStr(o.due / 60) + ' ' + hm(o.due / 60)) + '<div class="qbar"><i style="width:' + ((1 - o.left / o.kg) * 100).toFixed(0) + '%"></i></div>' : kv(L('Svar innen', 'Reply by'), dayStr(o.offerUntil / 60) + ' ' + hm(o.offerUntil / 60)) + kv(L('Tid å levere', 'Time to deliver'), o.days + L(' døgn', ' days')) + '<button class="ph-btn p" data-pa="ordtake" data-id="' + o.id + '"' + (O.active.length >= 3 ? ' disabled' : '') + '>' + L('Ta oppdraget', 'Take the order') + '</button>') + '</div>'; };
      h.push('<p class="ph-note">' + L('Mottak og kunder legger ut bestillinger hver morgen. Tar du et oppdrag, går fisken som oppfyller kravet til bestillingen først når du leverer i riktig havn. Leverer du ikke i tide, går omdømmet ned.', 'Buyers and customers post orders every morning. When you take one, the fish that meets it goes to the order first when you land at the right harbour. Miss the deadline and your reputation drops.') + '</p>');
      if (O.active.length){ h.push('<h4 style="margin:8px 2px 4px">' + L('Dine oppdrag', 'Your orders') + '</h4>'); O.active.forEach(o => h.push(card(o, true))); }
      h.push('<h4 style="margin:10px 2px 4px">' + L('Nye bestillinger', 'New orders') + '</h4>'); if (!O.offers.length) h.push('<p class="ph-note">' + L('Ingen nye bestillinger akkurat nå. Nye kommer klokka 06.', 'No new orders right now. New ones come at 06:00.') + '</p>'); O.offers.forEach(o => h.push(card(o, false)));
      h.push('<div class="ph-card"><h4>' + L('Omdømme', 'Reputation') + '</h4>' + CUSTOMERS.filter(c => custNear(c) || (S.rep && S.rep[c.id] != null)).map(c => '<div class="ph-kv"><span>' + c.no + '</span><span>' + repOf(c.id) + '</span></div><div class="qbar"><i style="width:' + repOf(c.id) + '%;background:#c9a227"></i></div>').join('') + '<p class="ph-note">' + L('Godt omdømme gir flere bestillinger og høyere tillegg.', 'A good reputation brings more orders and higher premiums.') + '</p></div>');
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
      // Greenland halibut (03d-quota.js, J-241-2025): the direct fishery's period, the vessel's maximum quota and what it has landed
      { const ss = bkSeason(y), on = H >= ss.open && H < ss.stop, used = bkUsed(H), mx = bkMax(BOAT.len, y);
        h.push('<div class="ph-card"><h4>' + L('Blåkveite ', 'Greenland halibut ') + y + '</h4>' + kv(L('Landet', 'Landed'), fmt(used / 1000, 2) + ' t') + bar(used, mx) +
          kv(L('Maksimalkvote', 'Maximum quota'), fmt(mx / 1000, 1) + ' t' + (BOAT.len >= 28 ? ' · ' + L('bare bifangst', 'bycatch only') : '')) +
          kv(L('Direktefisket', 'Direct fishery'), H < ss.open ? L('åpner ', 'opens ') + dayStr(ss.open) : on ? L('åpent' + (H >= ss.notice ? ', stoppes ' + dayStr(ss.stop) : ''), 'open' + (H >= ss.notice ? ', stops ' + dayStr(ss.stop) : '')) : L('stoppet ', 'stopped ') + dayStr(ss.stop)) +
          '<p class="ph-note">' + L('Direktefisket for båter under 28 m åpner 25. mai og stoppes når gruppekvoten er tatt, varslet tre dager før. Det krever blad B. Utenom perioden er blåkveite bare lov som bifangst, høyst 7 % av ukas landinger. Minstemål 45 cm. Fisken står på eggakanten på 500–1000 m.', 'The direct fishery for boats under 28 m opens on 25 May and is stopped when the group quota is taken, with three days\' notice. It needs blad B. Outside the period Greenland halibut is only allowed as bycatch, at most 7% of the week\'s landings. Minimum size 45 cm. The fish stands on the shelf edge at 500–1000 m.') + '</p></div>'); }
      if (q.conf > 0.5) h.push('<div class="ph-card"><h4>' + L('Inndratt i år', 'Confiscated this year') + '</h4>' + kv(L('Fisk over kvoten eller bifangstgrensen', 'Fish over the quota or the bycatch limit'), fmt(q.conf, 0) + ' kg') + kv(L('Verdi', 'Value'), kr(Math.round(q.confKr))) + '</div>');
      h.push('<div class="ph-card"><h4>' + L('Minstepriser, kr/kg rund vekt', 'Minimum prices, NOK/kg round weight') + '</h4><table class="ph-tbl">' + SP.map(sp => '<tr><td colspan="2"><b>' + SPECIES[sp][S.lang] + '</b></td></tr>' + SPECIES[sp].cls.map(c => '<tr><td>' + c[2] + '</td><td class="n">' + fmt(c[1] * (c[3] || 1), 2) + '</td></tr>').join('')).join('') + '</table><p class="ph-note">' + L('Dynamiske minstepriser for torsk, hyse og sei fra 21. september 2026, faste minstepriser for de andre artene. Krokfanget hyse over 1,1 kg har tillegg. Mottakene betaler aldri mindre.', 'Dynamic minimum prices for cod, haddock and saithe from 21 September 2026, fixed minimum prices for the other species. Hook-caught haddock over 1.1 kg gets a premium. Buyers never pay less.') + '</p></div>');
    } else if (s0 === 'land'){
      const wk = myKg(weekOf(H) * 168, H + 1), mo = myKg(H - 30 * 24, H + 1), all = S.sales.reduce((a, x) => a + x.kg, 0), val = S.sales.reduce((a, x) => a + x.total, 0);
      h.push('<div class="ph-card">' + kv(L('Denne uka', 'This week'), fmt(wk, 0) + ' kg') + kv(L('Siste 30 døgn', 'Last 30 days'), fmt(mo, 0) + ' kg') + kv(L('Totalt', 'Total'), fmt(all, 0) + ' kg · ' + kr(val)) + '</div>');
      const tot = {}; S.sales.forEach(x => (x.sp || []).forEach(([sp, kg]) => tot[sp] = (tot[sp] || 0) + kg));
      if (Object.keys(tot).length) h.push('<div class="ph-card"><h4>' + L('Per art', 'By species') + '</h4>' + SP.filter(sp => tot[sp]).map(sp => kv(spName(sp), fmt(tot[sp], 0) + ' kg')).join('') + '</div>');
      h.push('<div class="ph-card"><h4>' + L('Sluttsedler', 'Landing notes') + '</h4>' + (S.sales.length ? '<table class="ph-tbl"><tr><th>' + L('Dato', 'Date') + '</th><th>' + L('Mottak', 'Plant') + '</th><th class="n">kg</th><th class="n">kr</th></tr>' + S.sales.slice().reverse().slice(0, 30).map(x => '<tr><td>' + dayStr(x.t / 60).replace(/^\S+ /, '') + '</td><td>' + portById(x.port).name + '</td><td class="n">' + fmt(x.kg, 0) + '</td><td class="n">' + fmt(x.total, 0) + '</td><td class="n"><button class="ph-btn alt" style="margin:0;padding:3px 8px" data-pa="book" data-i="' + S.sales.indexOf(x) + '" aria-label="' + L('Åpne i dekksdagboka', 'Open in the deck log') + '">📖</button></td></tr>').join('') + '</table>' : '<p class="ph-note">' + L('Ingen landinger ennå.', 'No landings yet.') + '</p>') + '</div>');
    } else {
      // the leaderboards of the whole coast, one for each group (Jonas 05.10.2026: «Det er snakk om Norges beste båt om du ligger øverst»)
      const w = weekOf(H), which = sub.salgW === 'prev' ? w - 1 : w, grp = sub.salgG || (S.lic ? 'lukket' : 'open'), T = typeof worldTop === 'function' ? worldTop(Math.max(0, which), grp) : null;
      h.push('<div class="ph-sub" style="padding:0 0 6px"><button class="' + (grp === 'open' ? 'on' : '') + '" data-pa="salgG" data-s="open">' + L('Åpen gruppe', 'Open group') + '</button><button class="' + (grp === 'lukket' ? 'on' : '') + '" data-pa="salgG" data-s="lukket">' + L('Lukket gruppe', 'Closed group') + '</button></div>');
      h.push('<div class="ph-sub" style="padding:0 0 8px"><button class="' + (which === w ? 'on' : '') + '" data-pa="salgW" data-s="now">' + L('Denne uka', 'This week') + '</button><button class="' + (which !== w ? 'on' : '') + '" data-pa="salgW" data-s="prev">' + L('Forrige uke', 'Last week') + '</button></div>');
      const escT = v => String(v).replace(/[&<>"]/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;'})[c]), me = escT(S.boatName || L('Deg', 'You')) + ' <small>(' + L('deg', 'you') + ')</small>';
      const co = c => c ? '<br><small class="ph-note">' + escT(c) + '</small>' : '';
      if (T && !T.err){
        const d = T.data, rows = d ? d.rows || [] : null, pn = id => { const q = id && portById(id); return escT(q ? q.name : id || '–'); }, cl = grp === 'lukket';
        const mine = cl && S.lic && S.company ? co(S.company) : '';
        h.push('<div class="ph-card"><h4>' + L('Norges beste båter', 'Norway\'s best boats') + ' · ' + (cl ? L('lukket gruppe', 'closed group') : L('åpen gruppe', 'open group')) + '</h4>' + (!d ? '<p class="ph-note">' + L('Henter topplista …', 'Fetching the leaderboard …') + '</p>'
          : !rows.length ? '<p class="ph-note">' + (which === w ? L('Ingen har landet i ' + (cl ? 'lukket' : 'åpen') + ' gruppe denne uka ennå.', 'No one has landed in the ' + (cl ? 'closed' : 'open') + ' group this week yet.') : L('Ingen landet i ' + (cl ? 'lukket' : 'åpen') + ' gruppe forrige uke.', 'No one landed in the ' + (cl ? 'closed' : 'open') + ' group last week.')) + '</p>'
          : '<table class="ph-tbl"><tr><th>#</th><th>' + L('Båt', 'Boat') + '</th><th>' + L('Mottak', 'Plant') + '</th><th class="n">kg</th></tr>' +
            rows.map(r => { const bn = peerName(r.boat), cn = cl ? (peerName(r.company) === '–' ? L('Ukjent rederi', 'Unknown company') : peerName(r.company)) : '';
              const un = r.user ? peerName(r.user) : '';   // the owner's player name (supabase/migrations/20261007130000_seen.sql)
              return '<tr class="' + (r.me ? 'me' : '') + '"><td>' + r.rank + '</td><td>' + (r.me ? me + (mine || co(cn)) : escT(bn === '–' ? L('Ukjent båt', 'Unknown boat') : bn) + co([un, cn].filter(Boolean).join(' · '))) + '</td><td>' + pn(r.port) + '</td><td class="n">' + fmt(r.kg, 0) + '</td></tr>'; }).join('') +
            (d.mine && d.mine.rank > rows.length ? '<tr class="me"><td>' + d.mine.rank + '</td><td>' + me + mine + '</td><td></td><td class="n">' + fmt(d.mine.kg, 0) + '</td></tr>' : '') + '</table>') +
          '<p class="ph-note">' + (cl ? L('Hele kysten: spillerne i lukket gruppe etter hvor mye de har landet i spilluka, med fartøyet, rederiet og mottaket de har levert mest til.', 'The whole coast: the players in the closed group by how much they have landed this game week, with the vessel, the company and the plant they delivered most to.')
              : L('Hele kysten: spillerne i åpen gruppe etter hvor mye de har landet i spilluka, med båtnavnet og mottaket de har levert mest til.', 'The whole coast: the players in the open group by how much they have landed this game week, with the boat\'s name and the plant they delivered most to.')) +
            (d && d.n ? ' ' + L(d.n + (d.n === 1 ? ' båt' : ' båter') + ' har landet.', d.n + (d.n === 1 ? ' boat has' : ' boats have') + ' landed.') : '') +
            (cl && !S.lic ? ' ' + L('Du fisker i åpen gruppe og er ikke med her.', 'You fish in the open group and are not on this list.') : !cl && S.lic ? ' ' + L('Du fisker i lukket gruppe og er ikke med her.', 'You fish in the closed group and are not on this list.') : '') + '</p></div>');
      } else if (grp === 'lukket'){
        h.push('<div class="ph-card"><p class="ph-note">' + L('Topplista for lukket gruppe, med alle spillerne langs kysten, vises når du er logget inn på detstorebla.no eller i appen.', 'The closed group\'s leaderboard, with all the players along the coast, shows when you are signed in on detstorebla.no or in the app.') + '</p></div>');
      } else {
        const rows = toplist(Math.max(0, which));
        h.push('<div class="ph-card"><table class="ph-tbl"><tr><th>#</th><th>' + L('Fartøy', 'Vessel') + '</th><th>' + L('Havn', 'Port') + '</th><th class="n">kg</th></tr>' + rows.map((r, i) => '<tr class="' + (r.me ? 'me' : '') + '"><td>' + (i + 1) + '</td><td>' + (r.me ? me : r.name) + '</td><td>' + r.port + '</td><td class="n">' + fmt(r.kg, 0) + '</td></tr>').join('') + '</table><p class="ph-note">' + L('Landet kvantum hos mottakene rundt hjemhavna di. Den nasjonale topplista med de andre spillerne vises når du er logget inn på detstorebla.no eller i appen.', 'Landed weight at the plants round your home harbour. The national leaderboard with the other players shows when you are signed in on detstorebla.no or in the app.') + '</p></div>');
      }
    }
    h.push('</div>'); return h.join('');
  }
  // --- rescue
  function redning(){
    const b = S.boat, bars = inPort() ? 4 : coverage(b.pos), can = bars > 0 || S.equip.vhf, np = nearestPort(b.pos), H = S.t / 60, lvl = riskLevel(windAt(H), hsAt(b.pos, H));
    const st = rescueBase(b.pos), eta = Math.round(st.d / (TOW.come * NM) * 60) + TOW.muster;
    const h = ['<div class="ph-c"><div class="ph-card"><h4>' + L('Din posisjon', 'Your position') + '</h4><p>' + coordStr(b.pos) + '</p>' + kv(L('Nærmeste havn', 'Nearest port'), np.name + ', ' + fmt(dist(np.p, b.pos) / NM, 1) + ' nm') + kv(L('Dekning', 'Coverage'), bars ? bars + '/4' : L('Ingen', 'None')) + kv('VHF', S.equip.vhf ? L('Ja, kanal 16', 'Yes, channel 16') : L('Ikke montert', 'Not fitted')) + '</div>'];
    if (!inPort() && typeof PTOW !== 'undefined') h.push(PTOW.card4phone());   // a tow from another player (ui/10o-ptow.js)
    if (inPort()) h.push('<div class="ph-card"><p>' + L('Du ligger trygt i havn.', 'You are safely in port.') + '</p></div>');
    else if (b.status === 'tow' && b.tow) h.push('<div class="ph-card"><h4>' + statusText() + '</h4><p>' + L('Redningsskøyta fra ' + b.tow.base + ' sleper deg til ' + portById(b.tow.port).name + '.', 'The rescue boat from ' + b.tow.base + ' tows you to ' + portById(b.tow.port).name + '.') + '</p></div>');
    else {
      h.push('<div class="ph-card"><h4>' + L('Be om slep', 'Request a tow') + '</h4><p>' + L('For motorstopp, tom tank eller annen hjelp uten fare for liv. Nærmeste redningsskøyte ligger i ' + st.n + ', ca. ' + eta + ' min unna.', 'For engine failure, an empty tank or other help without danger to life. The nearest rescue boat is in ' + st.n + ', about ' + eta + ' min away.') + '</p>' + kv(L('Pris', 'Cost'), S.member ? L('Gratis (medlem)', 'Free (member)') : kr(PRICE.tow)) + '<button class="ph-btn" data-pa="tow"' + (can ? '' : ' disabled') + '>' + L('Ring etter slep', 'Call for a tow') + '</button></div>');
      h.push('<div class="ph-card"><h4>' + L('Nødanrop', 'Distress call') + '</h4><p>' + L('Bare når liv er i fare. Mannskapet og båten hentes, men fangsten går tapt.', 'Only when lives are in danger. Crew and vessel are rescued, but the catch is lost.') + '</p>' + (lvl === 2 ? '<p class="r2">' + L('Farlige forhold der du er nå.', 'Dangerous conditions where you are.') + '</p>' : '') + (confirmMayday ? '<button class="ph-btn red" data-pa="mayday2">' + L('Bekreft: send MAYDAY', 'Confirm: send MAYDAY') + '</button><button class="ph-btn alt" data-pa="mayday0">' + L('Avbryt', 'Cancel') + '</button>' : '<button class="ph-btn red" data-pa="mayday"' + (can ? '' : ' disabled') + '>MAYDAY</button>') + '</div>');
      if (!can) h.push('<p class="ph-note">' + L('Ingen mobildekning her. Med VHF-radio kan du alltid nå kystradioen.', 'No mobile coverage here. With a VHF radio you can always reach coast radio.') + '</p>');
    }
    // «Sitter båten fast?» (core/05-vessels.js unstuck; tilbakemelding #49)
    if (b.status !== 'tow'){ const w = unstuckWhy(); h.push('<div class="ph-card"><h4>' + L('Sitter båten fast?', 'Is the boat stuck?') + '</h4><p>' + L('Kommer båten seg ikke løs fra kaia eller ut av et trangt sted, flytter dette den ut på trygt vann like utenfor, der den ligger stille. Det koster ingenting.', 'If the boat cannot get away from the quay or out of a tight spot, this moves her out to safe water just off it, where she lies still. It costs nothing.') + '</p>' + (w ? '<p class="ph-note">' + L(w[0], w[1]) + '</p>' : '') + '<button class="ph-btn alt" data-pa="unstuck"' + (w ? ' disabled' : '') + '>' + L('Flytt båten ut på trygt vann', 'Move the boat out to safe water') + '</button></div>'); }
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
    if ((S.equip.jukse || 0) < 1) steps.push({n:L('Første juksamaskin', 'First jigging machine'), need:EQUIP.jukse.price, a:'utstyrb'});
    if (!bladB()) steps.push({n:L('Blad B i fiskermanntallet', 'Blad B of the fishermen\'s register'), pc:Math.min(F.n / BLADB.days, F.kr / BLADB.kr, 1), a:'papers',
      txt:fmt(Math.min(F.n, BLADB.days), 0) + ' / ' + BLADB.days + L(' landingsdager med deg om bord · ', ' landing days with you aboard · ') + kr(Math.min(F.kr, BLADB.kr)) + ' / ' + kr(BLADB.kr)});
    const ids = LIC_OFFERS.map(O => O.id).filter((x, i, a) => a.indexOf(x) === i);   // the rights in order (several boats share h10)
    const top = Math.max(-1, ...S.fleet.map(v => vget(v, 'lic')).filter(Boolean).map(l => ids.indexOf(l.id))), O = LIC_OFFERS.find(x => x.id === ids[top + 1]);
    if (O){ const x = deal(VESSELS[O.ves].price + licValue(O), tradeIn(), innOK()); steps.push({n:O[S.lang], need:x.eqNeed + 5000, bank:true, a:'fartoy'}); }
    if (!S.fleet.some(v => VESSELS[vget(v, 'boat').type].cls !== 'open')){ const k = 'kyst15', x = deal(VESSELS[k].price, 0); steps.push({n:VESSELS[k].name[S.lang], need:x.eqNeed + 5000, bank:true, a:'fartoy'}); }
    // the company (Jonas 09.10.2026): the Rederi app opens with it; after the boats, so the ladder comes first
    if (!rederiOpen()) steps.push({n:L('Stift Rederi AS', 'Found a limited company'), need:TAX.as.capital + TAX.as.fee, a:'bank', txt:L('Rederi-appen åpner når rederiet er stiftet. Aksjekapital og gebyr: ', 'The Company app opens once the company is founded. Share capital and fee: ') + kr(TAX.as.capital + TAX.as.fee)});
    steps.push({n:L('Havfiske', 'Ocean fishing'), pc:0, lock:true, txt:L('Kommer når kartet utvides vestover', 'Comes when the chart is extended west')});
    return steps.slice(0, 2).map(x => Object.assign(x, {pc:x.pc != null ? x.pc : Math.min(1, Math.max(0, S.cash) / Math.max(1, x.need))}));
  }
  function goalsCard(){
    const g = goals(); if (!g.length) return '';
    return '<div class="ph-card"><h4>' + L('Neste mål', 'Next goals') + '</h4>' + g.map(x => '<p style="margin:6px 0 2px"><b>' + x.n + '</b><br><small>' + (x.txt || (x.bank ? L('Egenkapital banken krever: ', 'Equity the bank wants: ') : L('Pris: ', 'Price: ')) + kr(x.need) + (x.bank && S.sales.length < 3 ? ' · ' + L('og tre sluttsedler', 'and three landing notes') : '')) + '</small></p><div class="qbar"><i style="width:' + (x.pc * 100).toFixed(1) + '%"></i></div>' +
      (x.a === 'papers' ? '<button class="ph-btn" data-pa="papers">' + L('Se papirene', 'See the papers') + '</button>' : x.lock || x.pc < 1 ? '' : x.a !== 'fartoy' ? '<button class="ph-btn" data-pa="open" data-a="' + x.a + '">' + (x.a === 'bank' ? L('Til banken', 'To the bank') : L('Til butikken', 'To the shop')) + '</button>' : '<button class="ph-btn" data-pa="sub" data-s="marked">' + L('Se markedet', 'See the market') + '</button>')).join('') + '</div>';
  }
  // ---- the boat market: tabs for the open group, boats with a closed-group right, the coastal fleet over 11 m and the ocean fleet;
  // a card per boat with its side view, and a spec sheet with the buttons. Until the company owns a closed-group vessel, an open-group
  // boat is only bought by trading in the one you have: a company can have one vessel in the open group (deltakerforskriften)
  let mkSel = null, minSheet = false;   // the market's chosen boat; the spec sheet open on «Min båt»
  const hasLic = () => S.fleet.some(v => vget(v, 'lic'));
  // the group: with a right (O) the boat goes into the closed group on the right's quota length, whatever her own length (a 31 ft boat with an
  // 8–8.9 m right is the usual thing along the coast); without one, the open group's class by her actual length
  const grpText = (V, O) => O ? L('lukket gruppe, hjemmel ' + O.hl + ' (faktisk lengde ' + fmt(V.len, 2) + ' m)', 'closed group, right of ' + O.hl + ' (actual length ' + fmt(V.len, 2) + ' m)') : V.cls === 'hav' ? L('havfiske, konsesjon', 'ocean, licence') : V.len >= 11 ? L('bare lukket gruppe (11 m og mer)', 'closed group only (11 m and more)') : V.len < 8 ? L('åpen gruppe under 8 m', 'open group under 8 m') : V.len < 10 ? L('åpen gruppe 8–9,99 m', 'open group 8–9.99 m') : L('åpen gruppe 10–10,99 m', 'open group 10–10.99 m');
  const tn = n => n >= 10000 ? fmt(n / 1000, n >= 100000 ? 0 : 1) + ' t' : fmt(n, 0) + ' kg';
  function mkCard(k, O){
    const V = VESSELS[k], price = O ? V.price + licValue(O) : V.price, mine = S.boat.type === k && !O, tag = V.lock ? L('kommer', 'coming') : O ? O.hl : V.isNew ? L('nybygg', 'new build') : L('brukt', 'used');
    return '<button class="ph-card vcard' + (mine ? ' mine' : '') + '" data-pa="mksel" data-k="' + k + '"' + (O ? ' data-o="' + O.k + '"' : '') + '><span class="vpic">' + vesselSVG(k) + '</span><span class="vtx"><b>' + (O ? O[S.lang] : V.name[S.lang]) + '</b><small>' + fmt(V.len, 2) + ' × ' + fmt(V.beam, 1) + ' × ' + fmt(V.draft, 1) + ' m · ' + tn(V.holdCap) + '</small><span class="vpr">' + kr(price) + ' <i>' + tag + '</i></span></span></button>';
  }
  function market(){
    const tab = sub.marked || 'open', h = [];
    if (mkSel) return sheet(mkSel.k, mkSel.o ? LIC_OFFERS.find(x => x.k === mkSel.o) : null);
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
    if (!atKind('verft')) h.push('<p class="ph-note">' + L('Båter kjøpes og selges på verftet.', 'Vessels are bought and sold at the yard.') + '</p>' + nearHint('verft'));
    return h.join('');
  }
  // the spec sheet: eight sections with the same rows for every boat (Jonas 17.10.2026, docs/batplan.md del 5). A row that does not
  // apply says «ingen», «–» or «ikke på denne båten»; it is never left out, so two boats side by side read alike
  const NOTHERE = () => L('ikke på denne båten', 'not on this boat');
  function specSecs(k, O){
    const V = VESSELS[k], price = O ? V.price + licValue(O) : V.price, no = L('ingen', 'none'), ja = L('ja', 'yes'), yn = x => x ? ja : L('nei', 'no'), upto = n => n ? L('inntil ', 'up to ') + fmt(n, 0) : no, nm = q => EQUIP[q].name[S.lang];
    const holdTxt = {dekk:L('dekkslast i kasser og kar, ', 'deck load in boxes and tubs, '), rom:L('lasterom med is, ', 'a hold with ice, '), frys:L('fryseri, ', 'freezer hold, '), rsw:L('RSW-tanker, ', 'RSW tanks, ')}[V.hold.kind] + tn(V.holdCap) + ' (' + fmt(V.hold.m3, V.hold.m3 < 10 ? 1 : 0) + ' m³)';
    const house = {open:L('åpen båt', 'open boat'), hardtop:L('hardtopp over styreplassen', 'a hardtop over the helm'), hus:L('styrhus', 'wheelhouse')}[V.fac.house], galley = {none:no, plate:L('kokeplate', 'a hotplate'), bysse:L('bysse', 'a galley')}[V.fac.galley];
    const hull = {tre:L('tre', 'wood'), alu:L('aluminium', 'aluminium'), glassfiber:L('glassfiber', 'fibreglass'), 'stål':L('stål', 'steel')}[V.hullMat];
    const elec = ['plotter', 'vhf', 'ais', 'chirp', 'sonar', 'brovakt'], stdE = elec.filter(q => V.std.includes(q)), fitE = elec.filter(q => !V.std.includes(q) && equipFits(q, k));
    const upRows = Object.keys(UPGS).map(u => kv(UPGS[u][S.lang], UPGS[u].fit(V) ? ja : NOTHERE()));
    return [
      [L('Generelt', 'General'), [kv(L('Pris', 'Price'), kr(price)), kv(L('Nypris', 'New price'), V.priceNew ? kr(V.priceNew) : '–'), kv(L('Byggeår', 'Built'), V.isNew ? L('nybygg, levert med en gang', 'new build, delivered at once') : V.year),
        kv(L('Lengde', 'Length'), fmt(V.len, 2) + ' m'), kv(L('Bredde', 'Beam'), fmt(V.beam, 1) + ' m'), kv(L('Dypgående', 'Draft'), fmt(V.draft, 1) + ' m'), kv(L('Vekt (deplasement)', 'Weight (displacement)'), fmt(V.disp, V.disp < 10 ? 1 : 0) + ' t'),
        kv(L('Skrog', 'Hull'), hull), kv(L('Gruppe', 'Group'), grpText(V, O)), kv(L('Fjordlinja', 'Fjord line'), V.len >= 15 ? L('kan ikke fiske innenfor', 'may not fish inside') : L('kan fiske innenfor', 'may fish inside'))]],
      [L('Last', 'Cargo'), [kv(L('Fangsten', 'The catch'), holdTxt), kv(L('Is', 'Ice'), V.iceCap ? tn(V.iceCap) : V.hold.kind === 'frys' || V.hold.kind === 'rsw' ? L('trengs ikke', 'not needed') : no), kv(L('Ismaskin', 'Ice machine'), V.iceMaker ? tn(V.iceMaker) + L(' i døgnet', ' a day') : no),
        kv(L('Frakt på dekk', 'Freight on deck'), tn(V.deckCargo)), kv(L('Bløggekar', 'Bleeding tub'), tn(V.tubCap)), kv(L('Leveres i', 'Landed in'), V.land === 'tub' ? L('kar', 'tubs') : L('kasser', 'boxes'))]],
      [L('Maskin og drift', 'Engine and running'), [kv(L('Motor', 'Engine'), V.engine[S.lang]), kv(L('Fart', 'Speed'), L('marsj ', 'cruise ') + fmt(V.vcruise, 1) + ' · ' + L('topp ', 'top ') + fmt(V.vmax, 1) + ' kn'), kv(L('Forbruk i marsj', 'Burn at cruise'), fmt(V.lph, V.lph < 10 ? 1 : 0) + ' l/t'),
        kv(L('Tank', 'Tank'), fmt(V.fuelCap, 0) + ' L ' + (V.diesel ? 'diesel' : L('bensin', 'petrol'))), kv(L('Rekkevidde', 'Range'), fmt(V.range, 0) + ' nm'), kv(L('Service', 'Service'), L('hver ', 'every ') + V.svcH + L(' timer, ', ' hours, ') + kr(V.svcCost))]],
      [L('Sjø', 'Sea'), [kv(L('Tåler', 'Handles'), L('bølger til ', 'waves up to ') + fmt(V.risk[0], 1) + ' m, ' + L('vind til ', 'wind up to ') + Math.round(V.risk[2]) + ' m/s'), kv(L('Skrogtype', 'Hull type'), V.planing ? L('planende', 'planing') : L('deplasement', 'displacement')), kv(L('Kan ankre', 'Can anchor'), ja), kv(L('Døgndrift (2+2-vakt)', 'Round the clock (2+2 watch)'), yn(V.watch))]],
      [L('Folk om bord', 'People aboard'), [kv(L('Mannskap', 'Crew'), V.crew ? V.crew.key.length + L(' nøkkelfolk + lag på ', ' key people + teams of ') + V.crew.teams.map(t => t.n).join(' + ') : L('du + ', 'you + ') + V.crewMax), kv(L('Nøkkelfolk', 'Key people'), V.crew ? V.crew.key.join(', ') : '–'),
        kv(L('Lugarer', 'Cabins'), V.cabins || no), kv(L('Køyer', 'Berths'), V.berths || no), kv(L('Styreplass', 'Helm'), house), kv(L('Ly over arbeidsdekket', 'Shelter over the deck'), yn(V.fac.shelter)), kv(L('Bysse', 'Galley'), galley), kv(L('Toalett', 'Toilet'), yn(V.fac.wc)), kv(L('Tørkerom', 'Drying room'), yn(V.fac.dry)), kv(L('Messe', 'Mess'), yn(V.fac.mess))]],
      [L('Redskap og dekk', 'Gear and deck'), [kv(L('Rigger', 'Rigs'), V.rigs.length ? V.rigs.map(r => RIGS[r][S.lang]).join(', ') : L('trål og not', 'trawl and seine')), kv(L('Juksamaskiner', 'Jigging reels'), upto(V.jukseMax)), kv(L('Garn', 'Nets'), upto(V.gearMax.garn)), kv(L('Linestamper', 'Line tubs'), upto(V.gearMax.stamp)),
        kv(L('Autoline', 'Autoline'), V.autoHooks ? fmt(V.autoHooks, 0) + L(' kroker', ' hooks') : no), kv(L('Teiner', 'Pots'), upto(V.gearMax.teine)), kv(L('Halere som passer', 'Haulers that fit'), V.haulers.length ? V.haulers.map(nm).join(', ') : no),
        kv(L('Ved sløyebordet', 'At the gutting table'), V.stations.table), kv(L('Ved haleren', 'At the hauler'), V.stations.hauler), kv(L('Kran', 'Crane'), V.crane ? fmt(V.crane, 0) + ' t' : no), kv(L('Sløyemaskin', 'Gutting machine'), V.gutMachine ? fmt(V.gutMachine, 0) + ' kg/t' : no)]],
      [L('Elektronikk', 'Electronics'), [kv(L('Følger med', 'Comes with'), stdE.length ? stdE.map(nm).join(', ') : no), kv(L('Kan monteres', 'Can be fitted'), fitE.length ? fitE.map(nm).join(', ') : no)]],
      [L('Oppgraderinger på verftet', 'Upgrades at the yard'), upRows.concat([kv(L('Større lasterom', 'A larger hold'), V.cls !== 'hav' ? ja : NOTHERE()), kv(L('Større motor', 'A bigger engine'), !V.outboard ? ja : NOTHERE())])]];
  }
  function sheet(k, O){
    const V = VESSELS[k], bn = '«' + S.boatName + '»', ti = tradeIn(), free = atKind('verft') && !S.order, price = O ? V.price + licValue(O) : V.price, mine = S.boat.type === k && !O, h = [];
    const sec = (t, rows) => '<div class="vsec"><h5>' + t + '</h5>' + rows.filter(Boolean).join('') + '</div>';
    h.push('<button class="ph-btn alt mkback" data-pa="mksel">‹ ' + L('Tilbake til listen', 'Back to the list') + '</button>');
    h.push('<div class="ph-card vsheet"><h4>' + (O ? O[S.lang] : V.name[S.lang]) + '</h4><div class="vbig">' + vesselSVG(k) + '</div><p>' + V.desc[S.lang] + '</p>');
    const secs = specSecs(k, O); h.push(sec(secs[0][0], secs[0][1]));
    if (O){ const yearly = Math.round(O.cod * avgPrice('torsk', S.t / 60, 7) / 1000) * 1000;
      h.push(sec(L('Hjemmel', 'Right'), [kv(L('Hjemmelslengde', 'Quota length'), O.hl), kv(L('Faktisk lengde', 'Actual length'), fmt(V.len, 2) + ' m'), kv(L('Torsk, fartøykvote', 'Cod, vessel quota'), fmt(O.cod / 1000, 3) + ' t'), kv(L('Hyse, maks / garantert', 'Haddock, max / guaranteed'), tq(O.hyse[0], 1) + ' / ' + tq(O.hyse[1], 1)),
        kv(L('Sei, maks / garantert', 'Saithe, max / guaranteed'), tq(O.sei[0], 1) + ' / ' + tq(O.sei[1], 1)), kv(L('Kvotepris', 'Quota price'), O.kpk + ' kr/kg · ' + kr(licValue(O))), kv(L('Torsk per år', 'Cod a year'), L('ca. ', 'about ') + kr(yearly))])); }
    for (const [t, rows] of secs.slice(1)) h.push(sec(t, rows));
    // buying
    if (V.lock) h.push('<p class="ph-note">' + L('Havfiske kommer når kartet utvides vestover, utenfor 12 nm. Krever konsesjon.', 'Ocean fishing comes when the chart is extended west, outside 12 nm. Needs a licence.') + '</p>');
    else if (mine) h.push('<p class="ph-note">' + L(bn + ' er en slik båt.', bn + ' is one of these.') + '</p>');
    else if (O){ const mineO = S.lic && S.lic.id === O.id && S.boat.type === O.ves, inn = innOK(), A = deal(price, ti, inn), B = deal(price, 0, inn), F = S.fm || {n:0, kr:0}, bb = bladB();
      if (mineO) h.push('<p class="ph-note">' + L(bn + ' har denne hjemmelen.', bn + ' has this right.') + '</p>');
      else if (!bb) h.push('<p class="ph-note"><b>' + L('Krever blad B i fiskermanntallet.', 'Needs blad B of the fishermen\'s register.') + '</b> ' + L('Du har ' + F.n + ' av ' + BLADB.days + ' landingsdager med deg om bord og ' + kr(F.kr) + ' av ' + kr(BLADB.kr) + ' i førstehåndsverdi. Se blad B i Kvote-appen.', 'You have ' + F.n + ' of ' + BLADB.days + ' landing days with you aboard and ' + kr(F.kr) + ' of ' + kr(BLADB.kr) + ' in first-hand value. See blad B in the Quota app.') + '</p>');
      else h.push((inn ? '<p class="ph-note">' + L('Første båt i lukket gruppe: Innovasjon Norge toppfinansierer ' + Math.round(INN * 100) + ' % med et risikolån (8,9 %, 10 år), så du trenger bare ' + Math.round((0.2 - INN) * 100) + ' % egenkapital.', 'First boat in the closed group: Innovasjon Norge tops up ' + Math.round(INN * 100) + '% with a risk loan (8.9%, 10 years), so you only need ' + Math.round((0.2 - INN) * 100) + '% equity.') + '</p>' : '') + payNote(A, 'Mellomlegg med ' + bn + ' i bytte: ', 'To pay with ' + bn + ' traded in: ', 'lån over 15 år ', '15-year loan ') + '<button class="ph-btn' + (A.ok ? ' p' : '') + '" data-pa="buylic" data-ti="1" data-id="' + O.k + '"' + (A.ok && free && !tiLocked(curVessel()) ? '' : ' disabled') + '>' + L('Kjøp og bytt inn ' + bn, 'Buy, trading in ' + bn) + '</button>' +
        payNote(B, 'Til flåten, uten innbytte: ', 'For the fleet, no trade-in: ', 'lån over 15 år ', '15-year loan ') + '<button class="ph-btn" data-pa="buylic" data-ti="0" data-id="' + O.k + '"' + (B.ok && free ? '' : ' disabled') + '>' + L('Kjøp til flåten', 'Buy for the fleet') + '</button>');
      // the first closed-group boat founds the company (until then the player fishes in his own name)
      if (bb && !mineO && !S.company) h.push('<div class="ph-card"><h4>' + L('Rederiet', 'The company') + '</h4><p class="ph-note">' + L('En båt med hjemmel i lukket gruppe eies av et rederi. Det opprettes når du kjøper, med navnet her.', 'A boat with a closed-group right is owned by a company. It is founded when you buy, with the name here.') + '</p>' +
        '<label class="ph-kv"><span>' + L('Navn', 'Name') + '</span><input id="coName" maxlength="28" autocomplete="off" value="' + String(coDraft != null ? coDraft : coDefault()).replace(/"/g, '') + '"></label></div>');
      const ov = openVesselId(); if (ov && !mineO) h.push('<p class="ph-note">' + L('Et rederi med en båt i lukket gruppe kan ikke ha noen båt i åpen gruppe. «' + vget(vesselById(ov), 'boatName') + '» mister plassen der, men kan fiske kveite og krabbe.', 'A company with a closed-group vessel can have no vessel in the open group. «' + vget(vesselById(ov), 'boatName') + '» loses its place there, but can fish halibut and crab.') + '</p>'); }
    else { const A = deal(V.price, ti), B = deal(V.price, 0), verb = V.isNew ? L('Bestill', 'Order') : L('Kjøp', 'Buy'), openOnly = V.len < 11 && !hasLic();
      h.push(payNote(A, 'Mellomlegg med ' + bn + ' i bytte: ', 'To pay with ' + bn + ' traded in: ') + '<button class="ph-btn p" data-pa="buy" data-ti="1" data-k="' + k + '"' + (A.ok && free && !tiLocked(curVessel()) ? '' : ' disabled') + '>' + verb + L(' og bytt inn ' + bn, ', trading in ' + bn) + '</button>');
      { const lv = swapLeaves(k); if (lv.length) h.push('<p class="ph-note">' + L('Ved innbytte passer ikke dette utstyret den nye båten. Det følger med ' + bn + ' og betales ikke: ', 'With the trade-in this equipment does not suit the new vessel. It goes with ' + bn + ' and is not paid for: ') + lv.map(q => L(EQUIP[q].name.no, EQUIP[q].name.en)).join(', ') + '.</p>'); }
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
      const sec = (t, rows) => '<div class="vsec"><h5>' + t + '</h5>' + rows.filter(Boolean).join('') + '</div>';
      h.push('<div class="ph-card vsheet"><h4>' + V.name[S.lang] + '</h4>' + (minSheet ? specSecs(b.type).map(([t, rows]) => sec(t, rows)).join('') :
        kv(L('Lengde', 'Length'), fmt(V.len, 2) + ' m') + kv(L('Toppfart', 'Top speed'), fmt(BOAT.vmax, 1) + ' kn') + kv(L('Tåler', 'Handles'), L('bølger til ', 'waves up to ') + fmt(BOAT.risk[0], 1) + ' m ' + L('trygt', 'safely'))) + '<button class="ph-btn alt" data-pa="minsheet">' + (minSheet ? L('Skjul databladet', 'Hide the spec sheet') : L('Hele databladet', 'The whole spec sheet')) + '</button></div>');
      h.push('<div class="ph-card"><h4>Status</h4>' + kv(L('Drivstoff', 'Fuel'), fmt(b.fuel, 0) + ' / ' + BOAT.fuelCap + ' L') + bar(b.fuel, BOAT.fuelCap, b.fuel < BOAT.fuelCap * 0.2 ? 'bad' : '') + kv(L('Is', 'Ice'), fmt(b.ice, 0) + ' / ' + BOAT.iceCap + ' kg') + bar(b.ice, BOAT.iceCap) + kv(L('Last', 'Hold'), fmt(holdTotal(), 0) + ' / ' + BOAT.holdCap + ' kg') + bar(holdTotal(), BOAT.holdCap) +
        kv(L('Motortimer', 'Engine hours'), fmt(b.engH || 0, 0) + ' t') + kv(L('Neste service', 'Next service'), svcLeft > 0 ? L('om ', 'in ') + fmt(svcLeft, 0) + ' t' : '<span class="r2">' + L('forfalt', 'overdue') + '</span>') + bar(svcPct, 1, cls) +
        kv(L('Juksa', 'Jig line'), b.gear ? L('i orden', 'fine') : '<span class="r2">' + L('ingen, kjøp juksa i butikken', 'none, buy a jig in the shop') + '</span>') + '<button class="ph-btn" data-pa="open" data-a="verksted">' + L('Til verkstedet', 'To the workshop') + '</button></div>');
      // the echo sounder and the sonar say when they are switched off on the chart plotter
      const off = k => (k === 'chirp' && S.settings.echo === false) || (k === 'sonar' && S.settings.sonar === false) ? L(' (av)', ' (off)') : '';
      const eq = Object.keys(EQUIP).filter(k => EQUIP[k].multi ? S.equip[k] > 0 : S.equip[k]).map(k => EQUIP[k].name[S.lang] + (EQUIP[k].multi ? ' × ' + S.equip[k] : '') + off(k));
      h.push('<div class="ph-card"><h4>' + L('Utstyr om bord', 'Equipment on board') + '</h4><p>' + ['GPS'].concat(S.equip.chirp ? [] : [L('Enkelt ekkolodd', 'Basic sounder') + (S.settings.echo === false ? L(' (av)', ' (off)') : '')]).concat(eq).join(', ') + '</p><h4 style="margin-top:8px">' + L('Mannskap', 'Crew') + '</h4><p>' + [L('Deg (skipper)', 'You (skipper)')].concat(S.crew.map(c => c.name)).join(', ') + ' · ' + L('plass til ', 'room for ') + (V.crewMax + 1) + '</p></div>');
      if (S.order) h.push('<div class="ph-card"><h4>' + L('Bestilt', 'On order') + '</h4><p>' + VESSELS[S.order.type].name[S.lang] + '</p>' + '<p class="ph-note">' + L('Byttes så snart båten den skal erstatte, ligger i havn.', 'Swapped as soon as the vessel it replaces lies in port.') + '</p></div>');
    } else h.push(market());
    h.push('</div>'); return h.join('');
  }
  // --- the company: the fleet at a glance and what needs you. The vessel apps work on the vessel picked at the top (default: the one you follow)
  const SEL_APPS = ['drift', 'fartoy', 'utstyr', 'utstyrb', 'redskap', 'mannskap', 'bors', 'verksted'];
  const DRAWER = new Set(['drift', 'arbeid', 'rigg', 'fiske', 'service', 'fartoy', 'utstyr', 'utstyrb', 'redskap', 'mannskap', 'bors', 'bank', 'verksted', 'havn', 'last', 'lever', 'is', 'agn', 'oppdrag', 'beholdning', 'maler']);
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
    if (b.status !== 'port' && catchIce() && !holdFreezes() && b.ice < 1 && holdTotal() > 0) A('ice', 'Tom for is, fangsten ises ikke', 'Out of ice, the catch is not iced', 'beholdning:last');
    if (b.status !== 'port' && holdTotal() >= capHold() - 1) A('full', 'Full last', 'Hold full', 'beholdning:last');
    if (svcOverdue() > 0) A('svc', 'Motorservice er forfalt', 'Engine service overdue', 'verksted');
    if (S.cevt) A('cevt', 'Uløst krangel om bord', 'Unresolved quarrel aboard', 'mannskap');
    for (const c of S.crew) if ((c.low || 0) > 12) A('quit' + c.id, c.name.split(' ')[0] + ' vurderer å slutte', c.name.split(' ')[0] + ' is thinking of quitting', 'mannskap');
    for (const s of (S.sets || []).filter(x => x.vid === S.cur)){ const a = (S.t - s.tSet) / 60;
      if (s.lost) A('lost' + s.id, GEAR[s.kind].no + ' er tapt. Meld tapt redskap', GEAR[s.kind].en + ' lost. Report the lost gear', 'redskap');
      else if (s.kind === 'teine' ? a >= 44 : s.kind === 'line' ? a >= 24 : a >= 48) A('soak' + s.id, GEAR[s.kind].no + ' har stått i ' + fmt(a, 0) + ' t', GEAR[s.kind].en + ' has soaked ' + fmt(a, 0) + ' h', 'beholdning:gear'); }
    if (S.pgear && S.pgear.nets.some(l => l.cond < 0.35)) A('worn', 'Slitte garn bør bøtes', 'Worn nets should be mended', 'beholdning:gear');
    if (o && !o.on && o.stop) A('ops', 'Driftsplanen har stoppet: ' + o.stop.no, 'The plan has stopped: ' + o.stop.en, 'drift');
    else if (o && o.on && o.held) A('ops', 'Driftsplanen venter til du gir båten tilbake', 'The plan waits until you give the boat back', 'drift');
    if (access() !== 'none'){ const lim = codLimitNow(H); if (lim > 0 && quotaState().torsk >= lim * 0.9) A('quota', 'Torskekvoten er nesten brukt opp', 'The cod quota is nearly used up', 'kvote'); }
    return {name:S.boatName, type:b.type, status:statusText(), pos:b.status === 'port' ? portById(b.port).name : fieldCode(b.pos) + ' · ' + L('nær ', 'near ') + nearestPort(b.pos).name,
      hold:holdTotal(), cap:capHold(), fuel:b.fuel, fuelCap:BOAT.fuelCap, ice:b.ice, iceCap:BOAT.iceCap, crew:S.crew.length, crewMax:BOAT.crewMax, ops:o, sk, now:o ? driftNow(o) : null, inc, al, inPort:b.status === 'port'};
  }
  const summaries = () => S.fleet.map(v => ({v, s:withVessel(v, vSummary)}));
  const alerts = () => summaries().flatMap(x => x.s.al);
  function rederi(){
    const all = summaries(), al = all.flatMap(x => x.s.al), bar = (a, c, k) => '<div class="ph-bar"><i class="' + (k || '') + '" style="width:' + Math.round(clamp(a / Math.max(1, c), 0, 1) * 100) + '%"></i></div>';
    const h = ['<div class="ph-c"><div class="ph-card"><h4>' + (S.company || L('Rederiet', 'The company')) + '</h4>' + kv(L('Båter', 'Vessels'), all.length) + kv(L('Konto', 'Account'), kr(S.cash)) + kv(L('Inntekt i dag', 'Income today'), kr(Math.round(all.reduce((a, x) => a + x.s.inc, 0)))) + '</div>'];
    // the company's books (tilbakemelding #9, Jonas 09.10.2026: «lånedetaljer burde stå i regnskapet til rederiet»): the year's result, each
    // loan with its balance, rate, instalment and the interest paid on it, and what the company owns against what it owes
    { const fleetV = all.reduce((a, x) => a + vesselValue(x.v), 0), D = debt(), res = S.stats.revenue - S.stats.costs;
      const loanRows = k => { const Q = S[k]; if (!Q) return ''; return '<p class="ph-note" style="margin:8px 0 2px"><b>' + (k === 'loanIN' ? L('Risikolån, ', 'Risk loan, ') : L('Båtlån, ', 'Vessel loan, ')) + LOANS[k].who + '</b></p>' +
        kv(L('Restgjeld', 'Balance'), kr(Math.round(Q.bal))) + kv(L('Rente', 'Interest'), fmt(Q.rate * 100, 1) + ' %') + kv(L('Terminbeløp', 'Monthly payment'), kr(Q.pay)) +
        kv(L('Neste trekk', 'Next payment'), dayStr(Q.next / 60)) + kv(L('Renter betalt', 'Interest paid'), kr(Math.round(Q.intPaid || 0))); };
      h.push('<div class="ph-card"><h4>' + L('Regnskap', 'Accounts') + '</h4>' + kv(L('Inntekter', 'Revenue'), kr(S.stats.revenue)) + kv(L('Kostnader', 'Costs'), kr(S.stats.costs)) +
        kv(L('Resultat', 'Result'), kr(res)) + (S.loan || S.loanIN ? loanRows('loan') + loanRows('loanIN') : '<p class="ph-note">' + L('Rederiet har ingen lån.', 'The company has no loans.') + '</p>') +
        '<p class="ph-note" style="margin:8px 0 2px"><b>' + L('Balanse', 'Balance sheet') + '</b></p>' + kv(L('Flåten (verdi)', 'The fleet (value)'), kr(fleetV)) + kv(L('Konto', 'Account'), kr(Math.round(S.cash))) +
        kv(L('Gjeld', 'Debt'), kr(Math.round(D))) + kv(L('Egenkapital', 'Equity'), kr(Math.round(fleetV + S.cash - D))) +
        '<button class="ph-btn" data-pa="open" data-a="bank">' + L('Til banken (nedbetaling og nye lån)', 'To the bank (repayment and new loans)') + '</button></div>'); }
    h.push('<h4 style="margin:10px 2px 6px">' + L('Trenger deg', 'Needs you') + (al.length ? ' (' + al.length + ')' : '') + '</h4>');
    if (!al.length) h.push('<p class="ph-note">' + L('Alt er i orden i flåten.', 'All is well in the fleet.') + '</p>');
    for (const a of al) h.push('<div class="ph-card"><div class="ph-kv"><span><b>«' + vget(vesselById(a.id), 'boatName') + '»</b> ' + L(a.no, a.en) + '</span><span><button class="ph-btn" style="margin:0" data-pa="goto" data-id="' + a.id + '" data-a="' + a.app + '">' + L('Åpne', 'Open') + '</button></span></div></div>');
    h.push('<h4 style="margin:10px 2px 6px">' + L('Flåten', 'The fleet') + '</h4>');
      const meV = vesselById(S.me), meIn = !meV || vget(meV, 'boat').status === 'port';
      for (const {v, s: sm} of all){
        const vb = vget(v, 'boat'), cur = v.id === S.cur, me = v.id === S.me, inp = vb.status === 'port';
        h.push('<div class="ph-card"><h4>«' + vget(v, 'boatName') + '»' + (me ? ' ⚓' : '') + '</h4>' + '<p class="ph-note">' + VESSELS[vb.type].name[S.lang] + '</p>' + kv('Status', sm.status) + kv(L('Posisjon', 'Position'), sm.pos) +
          kv(L('Last', 'Hold'), fmt(sm.hold, 0) + ' / ' + fmt(sm.cap, 0) + ' kg') + bar(sm.hold, sm.cap) + kv(L('Drivstoff', 'Fuel'), fmt(sm.fuel, 0) + ' / ' + sm.fuelCap + ' L') + bar(sm.fuel, sm.fuelCap, sm.fuel < sm.fuelCap * 0.2 ? 'bad' : '') + kv(L('Is', 'Ice'), fmt(sm.ice, 0) + ' / ' + sm.iceCap + ' kg') +
          kv(L('Mannskap', 'Crew'), sm.crew + ' / ' + sm.crewMax) + kv(L('Driftsplan', 'Operations plan'), !sm.ops ? L('ingen', 'none') : L(sm.now[0], sm.now[1])) + kv(L('Inntekt i dag', 'Income today'), kr(Math.round(sm.inc))) +
          '<p class="ph-note">' + L('Adgang: ', 'Access: ') + accessText(v) + '</p>' +
          (me ? '<p class="ph-note">' + L('Du er om bord på denne båten.', 'You are aboard this vessel.') + '</p>' : '') + (cur && S.fleet.length > 1 ? '<p class="ph-note">' + L('Denne båten følger du nå.', 'You are following this vessel.') + '</p>' : '') +
          '<div class="ph-btncol">' + (cur ? '' : '<button class="ph-btn p" data-pa="vfollow" data-id="' + v.id + '">' + L('Følg denne båten', 'Follow this vessel') + '</button>') +
          (me ? '' : '<button class="ph-btn" data-pa="vboard" data-id="' + v.id + '"' + (inp && meIn ? '' : ' disabled') + '>' + L('Gå om bord', 'Go aboard') + '</button>') +
          '<button class="ph-btn alt" data-pa="vname" data-id="' + v.id + '">' + L('Gi nytt navn', 'Rename') + '</button>' +
          (me || S.fleet.length < 2 ? '' : '<button class="ph-btn red" data-pa="vsell" data-id="' + v.id + '"' + (inp && !tiLocked(v) ? '' : ' disabled') + '>' + L('Selg for ', 'Sell for ') + kr(vesselValue(v)) + '</button>') + '</div>' +
          (!me && !(inp && meIn) ? '<p class="ph-note">' + L('For å bytte båt må begge ligge i havn.', 'To change vessel, both must be in port.') + '</p>' : '') + '</div>');
      }
    h.push('<h4 style="margin:10px 2px 6px">' + L('Foretaket', 'The business') + '</h4>' + papBiz());   // from the Sjømann app (Jonas 09.10.2026)
    h.push('</div>'); return h.join('');
  }
  // --- equipment
  // the yard's upgrades (hold, engine, the antifouling coat and the outboard) or the shop's (electronics, haulers, the jigging machine and the clothes)
  function utstyr(mode){
    mode = mode || 'verft'; const yardEq = EQ_YARD;
    const h = ['<div class="ph-c"><p class="ph-note">' + L('Montering skjer i havn. Utstyret følger med om du bytter båt, bortsett fra motoren og utstyr som ikke passer den nye båten. Det blir igjen på den gamle båten og betales ikke.', 'Fitting is done in port. Equipment moves with you if you change vessel, except the engine and equipment that does not suit the new vessel. That stays with the old vessel and is not paid for.') + '</p>'];
    if (!atKind(mode)) h.push(nearHint(mode));
    // the hold in three steps (core/03-simulation.js HOLDUP)
    if (mode === 'verft' && VESSELS[S.boat.type].cls !== 'hav'){ const b = S.boat, lv = b.holdLv || 0, nx = HOLDUP[lv], base = VESSELS[b.type].holdCap, queued = (S.jobs || []).some(j => j.kind === 'hold');
      h.push('<div class="ph-card"><h4>' + L('Større lasterom', 'A bigger hold') + ' (' + lv + '/3)</h4><p>' + L('Lengre lasterom og flere kasser. Tre trinn: +20 %, +40 % og +70 %. Mer last gjør båten tyngre.', 'A longer hold and more boxes. Three steps: +20%, +40% and +70%. More load makes her heavier.') + '</p>' +
        kv(L('Nå', 'Now'), fmt(BOAT.holdCap, 0) + ' kg') + (nx ? kv(L('Neste trinn', 'Next step'), fmt(Math.round(base * nx.x), 0) + ' kg · ' + kr(upPrice(nx.pc, nx.min)) + ' · ' + realDur(YARD_H * 60) + L(' på verftet', ' at the yard')) : '') +
        (!nx ? '<p><b>' + L('Fullt ombygd', 'Fully rebuilt') + '</b></p>' : queued ? '<p><b>' + L('På verftet', 'At the yard') + '</b></p>' : '<button class="ph-btn p" data-pa="holdup"' + (!atKind('verft') || S.cash < upPrice(nx.pc, nx.min) ? ' disabled' : '') + '>' + L('Bygg om · ', 'Rebuild · ') + kr(upPrice(nx.pc, nx.min)) + '</button>') + '</div>'); }
    // a bigger engine in two steps (core ENGUP; not for an outboard, which has the 90 hp outboard among the equipment)
    if (mode === 'verft'){ const b = S.boat, V = VESSELS[b.type], lv = b.engLv || 0, nx = ENGUP[lv], queued = (S.jobs || []).some(j => j.kind === 'eng');
      if (!V.outboard){ const P1 = nx ? powerX(Object.assign({}, b, {engLv:lv + 1})) : 0, v1 = nx ? V.vmax * speedOfPower(P1, V.planing) : 0;
        h.push('<div class="ph-card"><h4>' + L('Større motor', 'A bigger engine') + ' (' + lv + '/2)</h4><p>' + L('Mer kraft: +10 % og så +20 % mot motoren båten kom med. Det gir en jevn, men moderat fartsgevinst (Trim gir mye mer for en stund). Motoren bruker mer diesel, og servicen blir dyrere (+20 % og +50 %).', 'More power: +10% and then +20% over the boat\'s own engine. A steady but modest gain in speed (Trim gives far more for a while). The engine burns more diesel and the service costs more (+20% and +50%).') + '</p>' +
          kv(L('Nå', 'Now'), BOAT.hp + ' hk · ' + fmt(BOAT.vmax, 1) + ' kn') + (nx ? kv(L('Neste trinn', 'Next step'), Math.round(V.hp * (1 + nx.p)) + ' hk · ' + fmt(v1, 1) + ' kn · ' + kr(upPrice(nx.pc, nx.min)) + ' · ' + realDur(YARD_H * 60)) : '') +
          (!nx ? '<p><b>' + L('Største motor er montert', 'The biggest engine is fitted') + '</b></p>' : queued ? '<p><b>' + L('På verftet', 'At the yard') + '</b></p>' : '<button class="ph-btn p" data-pa="engup"' + (!atKind('verft') || S.cash < upPrice(nx.pc, nx.min) ? ' disabled' : '') + '>' + L('Bytt motor · ', 'Change the engine · ') + kr(upPrice(nx.pc, nx.min)) + '</button>') + '</div>'); } }
    // the other rebuilds of the boat itself (core UPGS): cabins, galley, drying room, insulated hold, fuel tank, stabilisation. None for gear.
    if (mode === 'verft'){ const b = S.boat, V = VESSELS[b.type];
      for (const k in UPGS){ const U = UPGS[k]; if (!U.fit(V)) continue; const lv = upgLv(b, k), nx = upgNext(b, k), queued = (S.jobs || []).some(j => j.kind === 'upg' && j.u === k), cur = lv ? U.steps[lv - 1] : null;
        h.push('<div class="ph-card"><h4>' + U[S.lang] + ' (' + lv + '/' + U.steps.filter(st => !st.minLen || V.len >= st.minLen).length + ')</h4><p>' + U.d[S.lang === 'no' ? 0 : 1] + '</p>' +
          (cur ? kv(L('Nå', 'Now'), cur[S.lang]) : '') + (nx ? kv(L('Neste trinn', 'Next step'), nx[S.lang] + ' · ' + kr(upPrice(nx.pc, nx.min)) + ' · ' + realDur(YARD_H * 60)) : '') +
          (!nx ? '<p><b>' + L('Fullt ombygd', 'Fully rebuilt') + '</b></p>' : queued ? '<p><b>' + L('På verftet', 'At the yard') + '</b></p>' : '<button class="ph-btn p" data-pa="upg" data-u="' + k + '"' + (!atKind('verft') || S.cash < upPrice(nx.pc, nx.min) ? ' disabled' : '') + '>' + L('Bygg om · ', 'Rebuild · ') + kr(upPrice(nx.pc, nx.min)) + '</button>') + '</div>'); } }
    for (const [k, E] of Object.entries(EQUIP)){
      if (!equipFits(k, S.boat.type) || yardEq(k) !== (mode === 'verft')) continue;
      const have = E.multi ? S.equip[k] : S.equip[k] ? 1 : 0, max = E.multi ? BOAT.jukseMax : 1;
      h.push('<div class="ph-card"><h4>' + E.name[S.lang] + (E.multi ? ' (' + have + '/' + max + ')' : '') + '</h4><p>' + E.desc[S.lang] + '</p>' + kv(L('Pris', 'Price'), kr(E.price)) + (have >= max ? '<p><b>' + L('Montert', 'Fitted') + '</b></p>' : (S.jobs || []).some(j => j.kind === 'fit' && j.k === k) ? '<p><b>' + L('Til montering', 'Being fitted') + '</b></p>' : '<button class="ph-btn" data-pa="equip" data-k="' + k + '"' + (atKind(EQ_YARD(k) ? 'verft' : 'butikk') && S.cash >= E.price ? '' : ' disabled') + '>' + L('Kjøp og monter', 'Buy and fit') + ' · ' + realDur(fitHours(k) * 60) + '</button>') + '</div>');
    }
    if (mode === 'butikk'){ const people = 1 + S.crew.length, c = S.clothes || {}, H = S.t / 60, cp = coldPen(H);
      h.push('<h4 style="margin:12px 2px 6px">' + L('Klær til mannskapet', 'Clothes for the crew') + '</h4><p class="ph-note">' + L('Kalde og våte hender fisker dårligere. Nå: effektiv temperatur ' + Math.round(effTemp(H)) + ' °C, fisket går ' + Math.round(cp * 100) + ' % tregere. Alle om bord trenger sine egne klær.', 'Cold, wet hands fish worse. Now: effective temperature ' + Math.round(effTemp(H)) + ' °C, fishing ' + Math.round(cp * 100) + '% slower. Everyone aboard needs their own.') + '</p>');
      for (const k of ['olje', 'varme']){ const C = CLOTHES[k], have = c[k] || 0;
        h.push('<div class="ph-card"><h4>' + C[S.lang] + ' (' + Math.min(have, people) + '/' + people + ')</h4><p>' + C.d[S.lang] + '</p>' + kv(L('Pris', 'Price'), kr(C.price)) + (have >= people ? '<p><b>' + L('Alle om bord har.', 'Everyone aboard has one.') + '</b></p>' : '<button class="ph-btn p" data-pa="cloth" data-k="' + k + '">' + L('Kjøp én', 'Buy one') + '</button>') + '</div>'); } }
    h.push('</div>'); return h.join('');
  }
  // --- gear: in the sea, aboard (baiting and mending), and the shop
  // ---- gear care (core/10b-gearcare.js): the condition of the gear aboard, and what the crew can do about it in port
  const pctOf = v => Math.round(v * 100) + ' %';
  const cbar = v => '<div class="ph-bar"><i style="width:' + Math.round(clamp(v, 0, 1) * 100) + '%"></i></div>';
  const cbtn = (a, attrs, label, ok, cls) => '<button class="ph-btn' + (cls ? ' ' + cls : '') + '" data-pa="' + a + '" ' + attrs + (ok === false ? ' disabled' : '') + '>' + label + '</button>';
  const qTxt = q => q ? ' · ' + (q.fee ? kr(q.fee) + ' · ' : '') + realDur(q.h * 60) : '';
  // ---- a line kind as it stands (Jonas 20.10.2026, tilbakemelding #74: «hva båten har slags fiskeredskaper ombord og hva disse eventuelt er
  // egnet med», no hints): the tubs in a row by their state, the bait's colours with names and counts, and baiting and stripping with the bait
  // the player picks (egnUI: the chooser open now, {lk, m:'egn'|'strip', b:bait, n, t:the bait after a strip}). o: {work: the crew can work
  // now (in port, or at sea with a crew free), shed: a baiting shed at this quay, care: the line's and the hooks' own state and upkeep}
  function lineCard(lk, o){
    const pg = careInit(S.pgear), L0 = pg.lines[lk], K = LINE_KINDS[lk], un = L0.n - L0.baited, bt = btOf(L0), groups = Object.keys(bt).filter(k => bt[k] > 0);
    const all = L0.n + tubState(lk).work.reduce((a, w) => a + w.n, 0);   // with the tubs the crew has in hand
    const h = ['<div class="ph-card lc" id="lc-' + lk + '"><h4>' + K[S.lang] + ' · ' + all + ' ' + L(all === 1 ? 'stamp' : 'stamper', all === 1 ? 'tub' : 'tubs') + '</h4>' + tubsHtml(lk) + tubLegend(lk) +
      '<p class="ph-note">' + K.hooks + L(' kroker og ', ' hooks and ') + fmt(K.baitKg, 0) + L(' kg agn per stamp', ' kg of bait a tub') + '</p>'];
    if (o.care){ const tot = L0.n * K.hooks, miss = Math.round(L0.miss * tot), bent = Math.round(L0.bent * tot);
      h.push(kv(L('Lina', 'The line'), pctOf(L0.cond) + ' · ' + L('tak ', 'ceiling ') + pctOf(L0.max)) + cbar(L0.cond) +
        kv(L('Kroker', 'Hooks'), (tot - miss - bent) + ' ' + L('i orden', 'fine') + ', ' + bent + ' ' + L('bøyde', 'bent') + ', ' + miss + ' ' + L('mangler', 'missing')) + (L0.sharp > 0 ? '<p class="ph-note">' + L('Nye kroker: fisker 5 % bedre i ' + L0.sharp + ' trekk til.', 'Fresh hooks: 5 % better catch for ' + L0.sharp + ' more hauls.') + '</p>' : ''));
      if (L0.max <= 0.45) h.push('<p class="ph-note">' + L('Lina er så slitt at det lønner seg å skifte den: selg den i utstyrsbutikken (Service) og kjøp ny.', 'The line is so worn that it pays to replace it: sell it at the tackle shop (Service) and buy a new one.') + '</p>');
      if (o.work){ const qh = careQuote('hooks', lk, false), ql = careQuote('line', lk, false), need = hooksNeed(lk), hb = [];
        if (need > 0) hb.push(cbtn('carehk', 'data-lk="' + lk + '" data-m="self"', L('Bytt ', 'Change ') + (qh ? qh.n : need) + L(' kroker selv', ' hooks yourselves') + qTxt(qh) + (qh ? '' : ' · ' + L('ingen kroker på lager', 'no hooks in the store')), !!qh));
        if (ql) hb.push(cbtn('carelr', 'data-lk="' + lk + '" data-m="self"', L('Reparer lina selv', 'Mend the line yourselves') + qTxt(ql), true));
        if (hb.length) h.push('<div class="ph-btncol">' + hb.join('') + '</div>'); } }
    // the chooser, while it still has something to work on
    const u = egnUI && egnUI.lk === lk ? egnUI : null, live = u && (u.m === 'egn' ? un > 0 && (o.work || o.shed) : groups.length > 0 && o.work);
    if (live) h.push(egnChooser(lk, o));
    else { const bb = [];
      if (un > 0 && (o.work || o.shed)) bb.push(cbtn('egnui', 'data-lk="' + lk + '" data-m="egn"', L('Egn ', 'Bait ') + un + ' …', true, 'p'));
      if (groups.length && o.work) bb.push(cbtn('egnui', 'data-lk="' + lk + '" data-m="strip"', L('Fjern agn', 'Remove bait') + ' …', true));
      if (bb.length) h.push('<div class="ph-row2">' + bb.join('') + '</div>'); }
    return h.join('') + '</div>';
  }
  // a bait to pick: its colour, name, what it says beside (kilos aboard, or tubs), and what it takes best
  const baitPickBtn = (pa, k, on, sub, dis) => '<button type="button" class="bp' + (on ? ' on' : '') + '" data-pa="' + pa + '" data-k="' + k + '"' + (dis ? ' disabled' : '') + '>' + (k ? baitDot(k) : baitDot(null, 'e')) + '<b>' + (k ? baitNm(k) : L('Ingen', 'None')) + '</b><small>' + sub + '</small>' +
    (k ? '<small class="g">' + (baitGood(k).slice(0, 3).map(spLc).join(', ') || L('likt på alt', 'even on all')) + '</small>' : '') + '</button>';
  function egnChooser(lk, o){
    const pg = S.pgear, L0 = pg.lines[lk], K = LINE_KINDS[lk], un = L0.n - L0.baited, bt = btOf(L0), B = baitOf(pg), u = egnUI, hs = egnHands(), fit = k => Math.floor((B[k] || 0) / K.baitKg + 1e-9);
    const step = (n, max, unit) => '<div class="egc-n"><button type="button" data-pa="egnn" data-d="-1"' + (n <= 1 ? ' disabled' : '') + ' aria-label="−">−</button><b>' + n + ' ' + unit + '</b><button type="button" data-pa="egnn" data-d="1"' + (n >= max ? ' disabled' : '') + ' aria-label="+">+</button></div>';
    const tubs = n => n === 1 ? L('stamp', 'tub') : L('stamper', 'tubs'), h = ['<div class="egc">'];
    if (u.m === 'egn'){
      if (!BAITS[u.b]) u.b = 'makrell';
      const n = u.n = clamp(u.n || un, 1, un), bn = baitLc(u.b), kg = n * K.baitKg;
      h.push('<div class="egc-h">' + L('Egn med', 'Bait with') + '</div><div class="bpick">' + Object.keys(BAITS).map(k => baitPickBtn('egnb', k, u.b === k, fmt(B[k] || 0, 0) + ' kg' + (fit(k) ? ' · ' + fit(k) + ' ' + tubs(fit(k)) : ''), !fit(k) && !o.shed)).join('') + '</div>' + step(n, un, tubs(n)) + '<div class="ph-btncol">');
      if (o.work) h.push(cbtn('gregn', 'data-lk="' + lk + '" data-n="' + n + '" data-b="' + u.b + '" data-m="self"', L('Egn ' + n + ' med ' + bn + ' selv', 'Bait ' + n + ' with ' + bn + ' yourselves') + ' · ' + fmt(kg, 0) + ' kg · ' + (hs.hands ? realDur(egnHours(lk, n, hs.eff) * 60) : '–'), (B[u.b] || 0) >= kg - 1e-9 && hs.hands > 0, o.shed ? '' : 'p'));
      if (o.work && (B[u.b] || 0) < kg - 1e-9) h.push('<p class="ph-note">' + L('Om bord: ' + fmt(B[u.b] || 0, 0) + ' kg ' + bn + '.', 'Aboard: ' + fmt(B[u.b] || 0, 0) + ' kg of ' + bn + '.') + '</p>');
      if (o.shed){ const fee = egnFee(lk, n, u.b); h.push(cbtn('gregn', 'data-lk="' + lk + '" data-n="' + n + '" data-b="' + u.b + '" data-m="shed"', L('Egnebua egner ' + n + ' med ' + bn, 'The shed baits ' + n + ' with ' + bn) + ' · ' + kr(fee), fee <= S.cash, 'p')); }
    } else {
      const groups = Object.keys(bt).filter(k => bt[k] > 0).sort((a, c) => bt[c] - bt[a]); if (!groups.includes(u.b)) u.b = groups[0];
      const n = u.n = clamp(u.n || bt[u.b], 1, bt[u.b]); if (u.t && (u.t === u.b || fit(u.t) < n)) u.t = '';
      h.push('<div class="egc-h">' + L('Fjern agnet fra', 'Take the bait off') + '</div><div class="bpick">' + groups.map(k => baitPickBtn('egnb', k, u.b === k, bt[k] + ' ' + tubs(bt[k]), false)).join('') + '</div>' + step(n, bt[u.b], tubs(n)) +
        '<div class="egc-h">' + L('Egn etterpå med', 'Then bait with') + '</div><div class="bpick">' + baitPickBtn('egnt', '', !u.t, L('la stå uegnet', 'leave unbaited'), false) +
        Object.keys(BAITS).filter(k => k !== u.b).map(k => baitPickBtn('egnt', k, u.t === k, fmt(B[k] || 0, 0) + ' kg', fit(k) < n)).join('') + '</div><div class="ph-btncol">');
      const hrs = hs.hands ? stripHours(lk, n, hs.eff) + (u.t ? egnHours(lk, n, hs.eff) : 0) : 0;
      h.push(cbtn('grstrip', 'data-lk="' + lk + '" data-b="' + u.b + '" data-n="' + n + '" data-t="' + (u.t || '') + '"', L('Fjern agnet fra ' + n + ' ' + tubs(n), 'Take the bait off ' + n + ' ' + tubs(n)) + (u.t ? L(' og egn med ' + baitLc(u.t), ' and bait with ' + baitLc(u.t)) : '') + ' · ' + (hs.hands ? realDur(hrs * 60) : '–'), hs.hands > 0, 'p'));
      h.push('<p class="ph-note">' + L('Det gamle agnet kastes.', 'The old bait is thrown away.') + '</p>');
    }
    h.push(cbtn('egnx', '', L('Avbryt', 'Cancel'), true, 'alt') + '</div></div>');
    return h.join('');
  }
  function careAboard(inPort, p){
    const pg = careInit(S.pgear), b = S.boat, h = [];
    for (const lk of ['hyse', 'bank']){ if (!pg.lines[lk].n && !tubState(lk).work.length) continue; h.push(lineCard(lk, {work:inPort, shed:b.status === 'port' && egnPort(p) && atKind('mottak'), care:true})); }
    const hk = '<p class="ph-note">' + L('Kroker på lager: ', 'Hooks in store: ') + pg.hooks + '. ' + L('Kjøpes i pakker på 100, 500 og 1000 i utstyrsbutikken.', 'Bought in packs of 100, 500 and 1000 at the tackle shop.') + '</p>';
    h.push(!pg.lines.hyse.n && !pg.lines.bank.n && !h.length ? '<div class="ph-card"><h4>' + L('Line', 'Line') + '</h4><p class="ph-note">' + L('Ingen line om bord.', 'No line aboard.') + '</p>' + hk + '</div>' : hk);
    // pots
    h.push('<div class="ph-card"><h4>' + L('Teiner', 'Pots') + '</h4>' + kv(POTS.big[S.lang], pg.pots.big));
    if (pg.pots.big){ h.push(kv(L('Stand', 'Condition'), pctOf(pg.potc.cond) + ' · ' + L('tak ', 'ceiling ') + pctOf(pg.potc.max)) + cbar(pg.potc.cond));
      if (inPort){ const qp = careQuote('pot', 0, false); if (qp) h.push('<div class="ph-btncol">' + cbtn('carepot', 'data-m="self"', L('Reparer teinene selv', 'Mend the pots yourselves') + qTxt(qp), true) + '</div>'); } }
    h.push('</div>');
    // the jig: the pilk and hooks that are mounted, and the spare sets
    if (b.gear || b.kgear){ h.push('<div class="ph-card"><h4>' + L('Juksa', 'Jig') + '</h4>'); const js = jigSets();
      for (const k of ['mark', 'kveite']){ if (k === 'mark' ? !b.gear : !b.kgear) continue; const J = pg.jig[k], js1 = js.find(x => x.k === k), on = js1 ? js1.on : jigKind() === k, qj = 1;
        h.push(kv(CARE.jig[k][S.lang] + (on ? ' · ' + L('i bruk', 'in use') : ''), pctOf(J.c) + ' · ' + J.n + ' ' + L('på lager', 'spare')) + cbar(J.c) + (js1 && js1.sp.length ? spChips(js1.sp) : js1 && js1.closed ? '<p class="ph-note">' + L('Kveita er fredet til og med 20. april.', 'Halibut is closed until 20 April.') + '</p>' : ''));
        const bt = []; if (!on) bt.push(cbtn('jigsel', 'data-k="' + k + '"', L('Bruk ', 'Use ') + CARE.jig[k][S.lang].toLowerCase(), true)); if (inPort && J.n > 0 && J.c < 0.98 && qj) bt.push(cbtn('carejig', 'data-k="' + k + '"', L('Bytt til nytt sett', 'Fit a new set'), true));
        if (bt.length) h.push('<div class="ph-btncol">' + bt.join('') + '</div>'); }
      h.push('<p class="ph-note">' + L('Pilk og kroker slites ved fiske. Reservesett kjøpes i utstyrsbutikken, og du velger her hva du fisker med.', 'Pilk and hooks wear with fishing. Spare sets are bought at the tackle shop, and you choose here what to fish with.') + '</p></div>'); }
    // buoys, bait and the crew's own upkeep
    const bk = Object.entries(baitOf(pg)).filter(e => e[1] > 0.05);
    h.push('<div class="ph-card" id="baitCard"><h4>' + L('Blåser og agn', 'Buoys and bait') + '</h4>' + kv(L('Blåsesett', 'Buoy sets'), pg.kits.n + (pg.kits.heavy ? ' (' + pg.kits.heavy + ' ' + L('med tung dregg', 'with heavy anchor') + ')' : '')) +
      (bk.length ? bk.map(e => kv((BAITS[e[0]] ? baitDot(e[0]) + BAITS[e[0]][S.lang] : e[0]) + (pg.pots.big ? ' <small>' + L('til ', 'for ') + Math.min(pg.pots.big, Math.floor(e[1] / GPRICE.potBait + 1e-9)) + L(' teiner', ' pots') + '</small>' : ''), fmt(e[1], 0) + ' kg')).join('') : kv(L('Agn', 'Bait'), L('ingen', 'none'))) +
      '<div class="ph-btncol">' + cbtn('careauto', '', L('Mannskapet vedlikeholder selv i havn: ', 'The crew does the upkeep in port: ') + (S.settings.careAuto === false ? L('av', 'off') : L('på', 'on')), true, 'alt') + '</div></div>');
    return h.join('');
  }
  function redskap(tab0){
    const tab = tab0 || sub.redskap || 'sjo', b = S.boat, pg = S.pgear, p = portById(b.port), inPortNow = b.status === 'port';
    const h = ['<div class="ph-c">' + (tab0 ? '' : subs('redskap', [['sjo', 'I sjøen', 'In the sea'], ['bord', 'Om bord', 'Aboard'], ['kjop', 'Kjøp', 'Buy']]))];
    if (tab === 'sjo'){
      const all = (S.sets || []).filter(s => s.vid === S.cur);
      if (!all.length) h.push('<div class="ph-card"><p class="ph-note">' + L('Ingen redskap i sjøen. Trykk «Sett ut» når båten ligger stille på feltet, eller legg setting inn i ruta.', 'No gear in the sea. Tap «Set» when the boat lies still on the grounds, or put the setting into the route.') + '</p></div>');
      for (const s of all){ const st = setState(s);
        const bw = s.kind === 'line' ? s.baitW || {makrell:s.n} : s.kind === 'teine' ? {[s.bait || 'makrell']:s.n} : null;
        h.push('<div class="ph-card' + (st === 'lost' || st === 'late' ? ' conflict' : '') + '"><h4>' + (s.kind === 'line' && LINE_KINDS[s.lk] ? LINE_KINDS[s.lk][S.lang] : GEAR[s.kind][S.lang]) + ', ' + s.n + ' ' + unitName(s.kind, s.n) + '</h4>' +
          (bw ? kv(L('Agn', 'Bait'), Object.keys(bw).filter(k => bw[k] > 0).sort((a, c) => bw[c] - bw[a]).map(k => baitDot(k) + (s.kind === 'line' && Object.keys(bw).length > 1 ? bw[k] + ' ' : '') + baitLc(k)).join(' · ')) : '') +
          kv(L('Satt', 'Set'), dayStr(s.tSet / 60) + ' ' + hm(s.tSet / 60)) + kv(L('Ståtid', 'Soak'), fmt((S.t - s.tSet) / 60, 0) + ' t (' + realDur(S.t - s.tSet) + L(' ekte tid', ' real time') + ') · ' + L(SETST[st][0], SETST[st][1])) + kv(L('Posisjon', 'Position'), coordStr(setMid(s)) + ', ' + s.depth + ' m') +
          (s.kind === 'garn' ? kv(L('Maskevidde og stand', 'Mesh and condition'), netNo(s) + ' · ' + Math.round((s.cond || 1) * 100) + ' %') : '') + (s.heavy ? kv(L('Dregg', 'Anchor'), L('tung', 'heavy')) : '') +
          (!s.lost && ['idle', 'port', 'sailing'].includes(b.status) ? '<button class="ph-btn p" data-pa="goset" data-id="' + s.id + '">' + L('Kjør dit', 'Go there') + ' · ' + fmt(Math.min(dist(b.pos, s.a), dist(b.pos, s.b)) / NM, 1) + ' nm</button>' : '') +
          (s.lost ? '<p class="ph-note">' + L('Blåsene er borte. Tapt redskap skal meldes til Kystvakten med type, mengde og siste posisjon.', 'The buoys are gone. Lost gear must be reported to the Coast Guard with type, amount and last position.') + '</p><button class="ph-btn p" data-pa="grrep" data-id="' + s.id + '">' + L('Meld tapt redskap', 'Report lost gear') + '</button>' : '') + '</div>'); }
      h.push('<p class="ph-note">' + L('Line er best innen et døgn. Etter 24 timer tar marfloen fisken. Teiner bør stå minst 20 timer og trekkes innen 48. Garn trekkes helst hver dag. Om sommeren går fisken fort i garnet.', 'Line is best within a day. After 24 hours the amphipods take the fish. Pots should stand at least 20 hours and be hauled within 48. Nets are best hauled daily. In summer the fish spoils fast in the net.') + '</p>');
    } else if (tab === 'bord'){
      h.push('<div class="ph-card"><h4>' + L('Garn', 'Nets') + '</h4>' + (pg.nets.length ? '' : '<p class="ph-note">' + L('Ingen garn om bord.', 'No nets aboard.') + '</p>'));
      for (const l of pg.nets){ h.push('<div class="ph-kv"><span>' + l.n + ' garn ' + netNo(l) + '</span><span>' + Math.round(l.cond * 100) + ' % · ' + L('tak ', 'ceiling ') + Math.round(nMax(l) * 100) + ' %</span></div><div class="ph-bar"><i style="width:' + Math.round(l.cond * 100) + '%"></i></div>');
        if ((inPortNow || seaWork()) && l.cond < nMax(l) - 0.05) h.push('<div class="ph-btncol"><button class="ph-btn" data-pa="grmend" data-id="' + l.id + '" data-m="self">' + L('Bøt selv', 'Mend yourselves') + '</button>' + (botPort(p) ? '<button class="ph-btn" data-pa="grmend" data-id="' + l.id + '" data-m="bot">' + L('Lever til bøteriet', 'Leave at the net loft') + ' (' + kr(Math.round(GPRICE.bot * l.n * (nMax(l) - l.cond) / 0.1)) + ')</button>' : '') + '</div>');
        if (l.n >= 2) h.push('<button class="ph-btn alt" data-pa="grsplit" data-id="' + l.id + '">' + L('Del lenka i to', 'Split the string') + '</button>'); }
      if (pg.nets.length >= 2){ const m = {}; for (const l of pg.nets) (m[netKey(l.ty, l.mesh)] = m[netKey(l.ty, l.mesh)] || []).push(l); for (const k in m) if (m[k].length >= 2) h.push('<button class="ph-btn alt" data-pa="grjoin" data-a="' + m[k][0].id + '" data-b="' + m[k][1].id + '">' + L('Slå sammen lenker på ' + k.replace(':', ' ') + ' mm', 'Join strings of ' + k.replace(':', ' ') + ' mm') + '</button>'); }
      h.push('</div>' + careAboard(inPortNow || seaWork(), p));
      const shore = pg.shore.filter(j => j.ready); if (shore.length) h.push('<div class="ph-card"><h4>' + L('På land', 'Ashore') + '</h4>' + shore.map(j => kv(j.kind === 'egn' ? j.n + ' ' + L('stamper i egnebua', 'tubs at the baiting shed') : j.n + ' ' + L('garn på bøteriet', 'nets at the net loft'), portById(j.port).name + ', ' + L('klar ', 'ready ') + (S.t >= j.ready ? L('nå', 'now') : hm(j.ready / 60)))).join('') + '</div>');
    } else {
      // quantities follow the room aboard: a skiff gets fewer nets per button than a sjark
      const room = k => gearRoom(k), cap = w => w === 'net' ? room('garn') : w === 'stamp' ? room('line') : w === 'pot' ? room('teine') : w === 'kit' ? kitRoomNow() : 1e9;
      const gated = new Set(), buy = (w, s, n0, lbl, unit) => { const gate = buyGate(w, s), gk = w === 'jig' ? w + s : w; if (gate){ if (gated.has(gk)) return ''; gated.add(gk); return '<p class="ph-note"><b>' + gate[0] + '</b></p>'; }   // the one rule for what can be bought (core/10-gear.js buyGate)
        const n = Math.max(1, Math.min(n0, cap(w))), price = n * unit, ok = cap(w) >= 1 && price <= S.cash && inPortNow;
        return '<button class="ph-btn' + (ok ? ' p' : '') + '"' + (ok ? '' : ' disabled') + ' data-pa="grbuy" data-w="' + w + '" data-s="' + s + '" data-n="' + n + '">' + lbl(n) + ' (' + kr(price) + ')</button>'; };
      if (!inPortNow) h.push('<div class="ph-card"><p class="ph-note">' + L('Redskap kjøpes i havn.', 'Gear is bought in port.') + '</p></div>');
      h.push('<div class="ph-card"><h4>' + L('Torskegarn', 'Cod nets') + '</h4><p>' + L('Garn settes i lenker mellom to blåser. 156 mm er vanlig torskegarn, 180 og 200 mm tar større fisk som skrei. Flytegarn fisker høyere og tar mest sei. Blåkveitegarn (360 mm) tar blåkveite og kveite. Minste lovlige maskevidde nord for 62° N er 156 mm. Garn krever minst to om bord. Plass til ', 'Nets are set in strings between two buoys. 156 mm is the usual cod net; 180 and 200 mm take bigger fish such as skrei. Floating nets fish higher and take mostly saithe. Greenland halibut nets (360 mm) take Greenland halibut and halibut. The smallest legal mesh north of 62° N is 156 mm. Nets need at least two aboard. Room for ') + room('garn') + L(' til.', ' more.') + '</p><div class="ph-btncol">' + NETOPT.map(o => buy('net', netKey(o[0], o[1]), 10, n => n + L(' garn ', ' nets ') + (o[0] === 'bunn' ? '' : L(NETTY[o[0]].no, NETTY[o[0]].en).toLowerCase() + ' ') + o[1] + ' mm', NETTY[o[0]].price)).join('') + '</div></div>');
      h.push('<div class="ph-card"><h4>' + L('Line', 'Line') + '</h4><p>' + L('Hyseline har ca. 600 kroker per stamp og tar mest hyse. Bankline har ca. 300 større kroker og tar lange, brosme, kveite og blåkveite. Lina egnes med det agnet du velger, i havn eller av mannskapet på sjøen. Plass til ', 'Haddock line has about 600 hooks a tub and takes mostly haddock. Bank line has about 300 bigger hooks and takes ling, tusk, halibut and Greenland halibut. The line is baited with the bait you choose, in port or by the crew at sea. Room for ') + room('line') + L(' stamper til.', ' more tubs.') +
        // the way to make room (Adrian 21.10.2026: haddock line out for more bank line): the shop's Service buys unbaited tubs back
        (ownedUnits('line') ? L(' Line du ikke trenger, selger du tilbake under Service (uegnede stamper).', ' Line you do not need is sold back under Service (unbaited tubs).') : '') + '</p><div class="ph-btncol">' + ['hyse', 'bank'].map(lk => buy('stamp', lk, 4, n => n + (n === 1 ? L(' stamp ', ' tub of ') : L(' stamper ', ' tubs of ')) + LINE_KINDS[lk][S.lang].toLowerCase(), LINE_KINDS[lk].price)).join('') + '</div></div>');
      h.push('<div class="ph-card"><h4>' + L('Teiner', 'Pots') + '</h4><p>' + L('For kongekrabbe, som fiskes fritt vest for 26° Ø, men nesten bare finnes i Finnmark. Teinene er store og må trekkes med teinehaler. Det er høyst 30 per fartøy. Uten krabbekar lever krabben rundt et døgn. Plass til ', 'For king crab, fished freely west of 26° E but found almost only in Finnmark. The pots are big and need a pot hauler. At most 30 a vessel. Without a crab tank a crab lives about a day. Room for ') + room('teine') + L(' til.', ' more.') + '</p><div class="ph-btncol">' + buy('pot', 'big', 20, n => n + ' ' + POTS.big[S.lang].toLowerCase(), POTS.big.price) + '</div></div>');
      // bait is sold at the fish plant, not here (docs/handelssteder.md; buyGear refuses it at the shop)
      h.push('<div class="ph-card"><h4>' + L('Blåser og dregg', 'Buoys and anchors') + '</h4><p>' + L('Hvert sett i sjøen trenger et blåsesett: to blåser med stake, flagg og dregg. Tung dregg holder bedre i storm og strøm.', 'Each set in the sea needs a buoy set: two buoys with pole, flag and anchor. A heavy anchor holds better in storm and current.') + '</p><div class="ph-btncol">' +
        buy('kit', 0, 1, () => L('Blåsesett', 'Buoy set'), GPRICE.kit) + (pg.kits.heavy < pg.kits.n ? buy('heavy', 0, 1, () => L('Tung dregg', 'Heavy anchor'), GPRICE.heavy) : '') + '</div><p class="ph-note">' + L('Agn selges på fiskemottaket (Mottak › Agn).', 'Bait is sold at the fish plant (Plant › Bait).') + '</p></div>');
      h.push('<div class="ph-card"><h4>' + L('Kroker og juksautstyr', 'Hooks and jig tackle') + '</h4><p>' + L('Ny line kommer komplett med kroker. Slitte eller bøyde kroker byttes mot kroker fra lageret, under Om bord. Pilk og kroker til juksa slites og byttes på samme måte. Blåsesett og dregger kan ikke kjøpes i flere enn redskapet ditt kan bruke.', 'New line comes complete with hooks. Worn or bent hooks are changed from the store, under Aboard. The jig\'s pilk and hooks wear and are changed the same way. Buoy sets and anchors cannot be bought in greater numbers than your gear can use.') + '</p><div class="ph-btncol">' +
        buy('hooks', 100, 1, () => L('100 kroker', '100 hooks'), CARE.hookKr[100]) + buy('hooks', 500, 1, () => L('500 kroker', '500 hooks'), CARE.hookKr[500]) + buy('hooks', 1000, 1, () => L('1000 kroker', '1000 hooks'), CARE.hookKr[1000]) +
        buy('jig', 'mark', 1, () => L('Markkroker og pilk (sett)', 'Fly hooks and pilk (set)'), CARE.jig.mark.kr) + buy('jig', 'kveite', 1, () => L('Kveitepilk (sett)', 'Halibut pilk (set)'), CARE.jig.kveite.kr) + '</div></div>');
      h.push('<p class="ph-note">' + L('Halere finner du under Butikk › Elektronikk og haler. Prisene er foreløpige.', 'Haulers are under Shop › Electronics and haulers. Prices are provisional.') + '</p>');
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
  // del 2 of «mannskap med liv» (core/14-crewlife.js): the dream, the savings towards it, the family and the last lines of the story
  function lifeHtml(c){ const Lf = c.life; if (!Lf || typeof LIFE_GOAL === 'undefined') return ''; const g = LIFE_GOAL[Lf.goal] || LIFE_GOAL.ro, pct = Lf.goal === 'egenbat' ? clamp(Lf.saved / Lf.target * 100, 0, 100) : null;
    const fam = {single:L('enslig', 'single'), partner:L('samboer', 'a partner at home'), kids:L('familie med barn', 'a family with children')}[Lf.fam] || '';
    const st = Lf.story.slice(-3).reverse().map(q => '<p class="ph-note" style="margin:2px 0">' + dayStr(q[0] / 60) + ' · ' + (S.lang === 'en' ? q[2] : q[1]) + '</p>').join('');
    return '<div class="ph-kv"><span>' + L('Drømmen', 'The dream') + '</span><span>' + L(g[0], g[1]) + (Lf.notice ? ' · ' + L('går i land ', 'goes ashore ') + dayStr(Lf.notice / 60) : '') + '</span></div>' +
      (pct != null ? bar2(pct, '#4c8df0') + '<p class="ph-note">' + L('Spart ', 'Saved ') + kr(Lf.saved) + L(' av ', ' of ') + kr(Lf.target) + ' · ' + fam + '</p>' : '<p class="ph-note">' + fam + '</p>') + st; }
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
  // crew are let go only with the boat at a quay (a plant, a yard, a boathouse, a rorbu, a shop or any other quay), never at sea or at
  // anchor while she works (Jonas 13.10.2026)
  const crewAshore = () => S.boat.status === 'port';
  const ASHORE_NOTE = () => '<p class="ph-note">' + L('Mannskap kan bare sies opp når båten ligger til kai: ved et mottak, verft, naust, rorbu, butikk eller en annen kai.', 'Crew can only be let go with the boat at a quay: a plant, a yard, a boathouse, a rorbu, a shop or another quay.') + '</p>';
  function mannskap(){
    S.crew = S.crew.map(crewUpgrade);
    const max = BOAT.crewMax, h = ['<div class="ph-c"><p class="ph-note">' + L('Mannskapet får lott: en andel av fangstverdien ved hver landing. Flere hender betyr flere snører i sjøen og flere juksamaskiner i drift.', 'The crew is paid a share of the catch value at each landing. More hands means more lines in the water and more jigging reels running.') + '</p>'];
    if (!crewAshore() && S.crew.length) h.push(ASHORE_NOTE());
    h.push('<div class="ph-card"><h4>«' + S.boatName + '»' + (meAboard() ? ' ⚓' : '') + '</h4>' + '<p class="ph-note">' + L('Adgang: ', 'Access: ') + accessText(curVessel()) + '</p>' + (meAboard() ? '' : '<p class="ph-note">' + L('Du er ikke om bord. Båten kan bare gå ut med eget mannskap.', 'You are not aboard. The vessel can only go out with crew of her own.') + '</p>') + '</div>');
    { const H = S.t / 60, ev = S.cevt, A = ev && crewById(ev.a), Bc = ev && crewById(ev.b);
      if (ev && A){ const tx = (ev.type === 'pair' ? PAIR_TOPICS : BOSS_TOPICS)[ev.topic][S.lang].replace('{a}', A.name).replace('{b}', Bc ? Bc.name : '');
        h.push('<div class="ph-card conflict"><h4>' + (ev.type === 'pair' ? L('Krangel om bord', 'A quarrel aboard') : L('Misnøye', 'Discontent')) + '</h4><p>' + tx + '</p>' + (ev.esc ? '<p class="ph-note">' + L('Det har gått en stund, og stemningen er blitt verre.', 'It has been a while, and the mood has got worse.') + '</p>' : '') + '<div class="ph-btncol">' +
          (ev.type === 'pair' ? '<button class="ph-btn p" data-pa="cres" data-o="talk">' + L('Snakk med dem begge', 'Talk to them both') + '</button><button class="ph-btn" data-pa="cres" data-o="sideA">' + L('Gi ' + A.name.split(' ')[0] + ' rett', 'Side with ' + A.name.split(' ')[0]) + '</button><button class="ph-btn" data-pa="cres" data-o="sideB">' + L('Gi ' + Bc.name.split(' ')[0] + ' rett', 'Side with ' + Bc.name.split(' ')[0]) + '</button><button class="ph-btn" data-pa="cres" data-o="offB">' + L('Gi ' + Bc.name.split(' ')[0] + ' fri neste tur', 'Give ' + Bc.name.split(' ')[0] + ' the next trip off') + '</button><button class="ph-btn alt" data-pa="cres" data-o="fireB"' + (crewAshore() ? '' : ' disabled') + '>' + L('Si opp ' + Bc.name.split(' ')[0], 'Let ' + Bc.name.split(' ')[0] + ' go') + '</button>'
            : '<button class="ph-btn p" data-pa="cres" data-o="listen">' + ({lott:L('Øk lotten med 1 %', 'Raise the share by 1%'), hvile:L('Lov en hviletur', 'Promise a trip off'), vaer:L('Lov å være forsiktig', 'Promise to be careful'), kulde:L('Lov bedre klær', 'Promise better clothes'), generelt:L('Hør på det som sies', 'Listen to what is said')})[ev.topic] + '</button><button class="ph-btn" data-pa="cres" data-o="firm">' + L('Stå på ditt', 'Stand firm') + '</button><button class="ph-btn alt" data-pa="cres" data-o="fireA"' + (crewAshore() ? '' : ' disabled') + '>' + L('Si opp ' + A.name.split(' ')[0], 'Let ' + A.name.split(' ')[0] + ' go') + '</button>') + '</div></div>'); }
      h.push('<h4 style="margin:10px 2px 4px">' + L('Om bord', 'On board') + ' (' + S.crew.length + '/' + max + ')</h4>');
      if (!S.crew.length) h.push('<p class="ph-note">' + L('Ingen mannskap ennå. Finn folk i Mannskapsbørsen.', 'No crew yet. Find people in the crew exchange.') + '</p>');
      for (const c of S.crew){ const wd = (gDate(H).getUTCDay() + 6) % 7, away = c.off && c.offUntil ? L('er i land til ', 'is ashore until ') + dayStr(c.offUntil / 60) : c.off ? L('har fri neste tur', 'has the next trip off') : (c.bi && !c.biDays[wd]) ? L('biyrke, ikke om bord i dag', 'part-time, not aboard today') : '';
        h.push(personCard(c, false).replace('</h4>', ' · ' + L(c.lv, c.lvEn) + '</h4>').replace('<div class="crewtr">', lifeHtml(c) + '<div class="crewtr">').replace('<div class="crewgrid">', '<div class="ph-kv"><span>' + L('Trivsel', 'Morale') + '</span><span>' + Math.round(c.morale) + '</span></div>' + bar2(c.morale, moodCol(c.morale)) + '<div class="ph-kv"><span>' + L('Slitenhet', 'Fatigue') + '</span><span>' + Math.round(c.fatigue) + '</span></div>' + bar2(c.fatigue, c.fatigue > 70 ? '#e5484d' : '#4c8df0') + (c.pay === 'hyre' ? kv(L('Hyre', 'Wage'), kr(c.hyre) + L(' per dag', ' a day')) : kv(L('Lott', 'Share'), Math.round(c.share * 100) + ' %' + (c.share < c.ask - 0.001 ? ' · ' + L('ønsket ', 'wanted ') + Math.round(c.ask * 100) + ' %' : ''))) + (away ? '<p class="ph-note">' + away + '</p>' : '') + '<div class="crewgrid">').replace(/<\/div>$/, '<div class="ph-row2"><button class="ph-btn" data-pa="coff" data-id="' + c.id + '">' + (c.off ? L('Tilbake om bord', 'Back aboard') : L('Gi fri neste tur', 'Next trip off')) + '</button><button class="ph-btn alt" data-pa="cpay" data-id="' + c.id + '">' + (c.pay === 'hyre' ? L('Over på lott', 'To a share') : L('Over på hyre (' + kr(hyreAsk(c)) + '/dag)', 'To a wage (' + kr(hyreAsk(c)) + '/day)')) + '</button><button class="ph-btn alt" data-pa="cfire" data-id="' + c.id + '"' + (crewAshore() ? '' : ' disabled') + '>' + L('Si opp', 'Let go') + '</button></div></div>')); }
      if (S.crew.length >= 2){ const pr = []; for (let i = 0; i < S.crew.length; i++) for (let j = i + 1; j < S.crew.length; j++){ const k = compat(S.crew[i], S.crew[j]); pr.push('<div class="ph-kv"><span>' + S.crew[i].name.split(' ')[0] + ' og ' + S.crew[j].name.split(' ')[0] + '</span><span>' + (k >= 1 ? L('😊 god', '😊 good') : k <= -2 ? L('😠 dårlig', '😠 poor') : L('😐 grei', '😐 fair')) + '</span></div>'); }
        h.push('<div class="ph-card"><h4>' + L('Kjemi', 'Chemistry') + '</h4>' + pr.join('') + '<p class="ph-note">' + L('Dårlig kjemi gir krangler, særlig når folk er slitne eller misfornøyde.', 'Poor chemistry leads to quarrels, especially when people are tired or unhappy.') + '</p></div>'); } }
    h.push('<div class="ph-card"><h4>' + L('Driftsplan', 'Operations plan') + '</h4><p class="ph-note">' + L('Hvor båten hører hjemme, hva og hvor den fisker, været og mannskapets rytme står i Driftsplan-appen.', 'Where the boat belongs, what and where she fishes, the weather and the crew\'s rhythm are in the Operations plan app.') + '</p><button class="ph-btn p" data-pa="open" data-a="drift">' + L('Åpne Driftsplan', 'Open the plan') + '</button></div>');
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
    h.push('<div class="ph-card"><h4>' + L('Regnskap', 'Accounts') + '</h4>' + kv(L('Inntekter', 'Revenue'), kr(S.stats.revenue)) + kv(L('Kostnader', 'Costs'), kr(S.stats.costs)) + kv(L('Resultat', 'Result'), kr(S.stats.revenue - S.stats.costs)) + '</div>');
    // the tax of this year (E4, 03-simulation.js TAX): the profit so far, what is paid, and what it would be as ENK and as AS
    { const H = S.t / 60; if (!S.tx) txInit(H); const P = txProfit(H), dn = S.tx.days.length, E = taxOf(P, 'ENK', dn), A = taxOf(P, 'AS', dn);
      h.push('<div class="ph-card"><h4>' + L('Skatt ', 'Tax ') + S.tx.y + '</h4>' + kv(L('Foretaket', 'Business'), S.form === 'AS' ? L('Aksjeselskap', 'Limited company') : L('Enkeltpersonforetak', 'Sole proprietorship')) + kv(L('Overskudd så langt', 'Profit so far'), kr(Math.round(P))) +
        kv(L('Dager på fiske', 'Days fishing'), dn + ' / ' + TAX.fisk.days) + kv(L('Skatt som ENK', 'Tax as ENK'), kr(E.sum) + (E.fd ? L(' (fiskerfradrag ', ' (fisherman\'s deduction ') + kr(E.fd) + ')' : '')) + kv(L('Skatt som AS', 'Tax as AS'), kr(A.sum) + L(' + regnskap', ' + books')) + kv(L('Forskudd betalt', 'Paid in advance'), kr(S.tx.paid)) +
        (S.taxLast ? kv(L('Oppgjøret for ', 'Settlement for ') + S.taxLast.y, S.taxLast.rest >= 0 ? L('restskatt ', 'owed ') + kr(S.taxLast.rest) : L('tilbake ', 'back ') + kr(-S.taxLast.rest)) : '') +
        (S.form === 'AS' ? '' : '<button class="ph-btn" data-pa="foundas"' + (S.cash >= TAX.as.capital + TAX.as.fee ? '' : ' disabled') + '>' + L('Stift Rederi AS (', 'Found a company (') + kr(TAX.as.capital) + L(' i aksjekapital, gebyr ', ' share capital, fee ') + kr(TAX.as.fee) + ')</button><p class="ph-note">' + L('Med rederiet får du Rederi-appen på telefonen: hele flåten på én skjerm.', 'With the company you get the Company app on the phone: the whole fleet on one screen.') + '</p>') +
        '<p class="ph-note">' + L('Forskuddsskatten trekkes hvert kvartal, og oppgjøret kommer ved nyttår. Som ENK er overskuddet din inntekt, med fiskerfradrag når du har fisket minst 130 dager. Et AS betaler 22 % og fører regnskap. Satsene er fra 2026 (skattevedtaket), funnet med søk.', 'The advance tax is taken every quarter, and the settlement comes at the new year. As ENK the profit is your income, with the fisherman\'s deduction after 130 days fishing. A company pays 22 % and keeps books. The rates are 2026\'s, found by search.') + '</p></div>'); }
    h.push('</div>');
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
  // the equipment owned that does not suit type k: it stays with the boat traded in, and is not paid for
  const swapLeaves = k => Object.keys(EQUIP).filter(q => S.equip[q] && !EQUIP[q].multi && !equipFits(q, k));
  function switchVessel(k){
    const b = S.boat, old = VESSELS[b.type], left = swapLeaves(k);
    if (left.length) log('Utstyr som ikke passer den nye båten, ble med ' + old.name.no + ': ' + left.map(q => EQUIP[q].name.no).join(', ') + '.', 'Equipment that does not suit the new vessel went with the ' + old.name.en + ': ' + left.map(q => EQUIP[q].name.en).join(', ') + '.');
    b.type = k; delete b.liv; for (const q of Object.keys(EQUIP)) if (!equipFits(q, k)) S.equip[q] = EQUIP[q].multi ? Math.min(S.equip[q] || 0, VESSELS[k].jukseMax || 0) : false; applyVessel(); loreNewBoat(S.boatName);
    S.equip.jukse = Math.min(S.equip.jukse, BOAT.jukseMax); b.fuel = BOAT.fuelCap * 0.4; b.ice = 0; b.engH = 0; b.svcAt = 0; S.svcTold = false;
    while (S.crew.length > BOAT.crewMax) S.crew.pop();
    if (!S.owned.includes(k)) S.owned.push(k);
    log('Overtok ' + VESSELS[k].name.no + '. ' + old.name.no + ' er solgt.', 'Took over the ' + VESSELS[k].name.en + '. The ' + old.name.en + ' has been sold.');
    if (typeof G3 !== 'undefined') G3.vesselChanged();
  }
  const NAV = new Set(['open', 'home', 'back', 'close', 'lang', 'sub', 'shop0', 'shopgear', 'salgW', 'salgG', 'vsel', 'goto', 'vfollow', 'vboard', 'vname', 'vsell']);
  function act(a, d){
    const was = app, done = SEL_APPS.includes(app) && !NAV.has(a) ? withSel(() => act0(a, d)) : act0(a, d);
    // a link to a page that lives in the drawer now (Neste mål, Rederi's «Åpne») closes the phone and opens the drawer
    if (DRAWER.has(String(app).split(':')[0])){ const to = app; app = DRAWER.has(was) ? 'home' : was; show(false); DOCK.open(to); return; }
    if (done) { save(); renderHud(); renderClock(); panelDirty = true; render(); }
  }
  function act0(a, d){
    const b = S.boat;
    if (a !== 'shop') shopPend = null;
    if ((/^adm/.test(a) || (a === 'open' && d.a === 'admin')) && !adminOk()) return false;   // the Admin app is only Jonas's (adminOk)
    if (a === 'open' && d.a === 'garderobe'){ show(false); WARD.open(); return; }      // the wardrobe is a sheet of its own (ui/10g-wardrobe.js)
    if (a === 'open'){ app = d.a === 'kaiboden' ? kbLast : d.a; confirmMayday = false; if (d.s) sub[d.a] = d.s; if (d.a === 'post') sub.postArt = null; }
    else if (a === 'home'){ app = 'home'; }
    else if (a === 'back'){ app = 'home'; }
    else if (a === 'shop'){ const k = d.k, kg = +d.kg || 0; if (!shopPend || shopPend.k !== k || shopPend.kg !== kg){ shopPend = {k, kg}; return true; } shopPend = null; const free = tutFree(k), why = shopBuy(k, kg, free); if (why){ toast(L(why[0], why[1])); } else if (free) tutMark('free_' + k); }
    else if (a === 'shop0'){ }
    else if (a === 'shopgear'){ app = 'redskap'; sub.redskap = 'kjop'; }
    else if (a === 'close'){ show(false); return; }
    else if (/^gd[A-Z]/.test(a)){ if (!GUIDE.act(a, d)) return false; }   // the fish guide (ui/06f-fishguide.js)
    else if (/^fb[A-Z]/.test(a)){ if (!FEEDBACK.act(a, d)) return false; }
    else if (/^fr[A-Z]/.test(a)){ if (!FRIENDS.act(a, d)) return false; }
    else if (/^gb[A-Z]/.test(a)){ if (!GBOOK.act(a, d)) return false; }
    else if (/^pt[A-Z]/.test(a)){ PTOW.act(a); }   // a tow from another player (ui/10o-ptow.js)   // the guestbook (ui/10m-guestbook.js)   // the Venner app (ui/10k-friends.js)   // the feedback app (ui/06e-feedback.js)
    else if (/^pnt/.test(a)){ if (!PAINT.act(a, d)) return false; }   // the paint shop (ui/10j-paint.js)
    else if (a === 'naustbuy'){ const why = naustBuy(d.k); if (why) toast(L(why[0], why[1])); }
    else if (a === 'lang'){ S.lang = S.lang === 'no' ? 'en' : 'no'; refreshAll(); }
    else if (a === 'q3d'){ S.settings.q3d = d.v; if (typeof G3 !== 'undefined' && G3.quality) G3.quality(d.v); }
    else if (a === 'fpsShow'){ S.settings.fpsShow = d.v === '1'; }
    else if (a === 'hudShow'){ S.settings.hudOff = d.v !== '1'; hudClasses(); }
    else if (a === 'move'){
      if (S.moved) return true;
      show(false); const from = (portById(S.home || S.boat.port) || PORTS[0]).name; START_HOMEONLY = true;
      showStart(() => { START_HOMEONLY = false; S.moved = true; const to = (portById(S.home) || PORTS[0]).name; log('Nytt hjemsted: ' + to + ' (før ' + from + '). Seil dit når du vil.', 'New home: ' + to + ' (was ' + from + '). Sail there when you like.'); save(); refreshAll(); });
      return true;
    }
    else if (a === 'mus'){ S.settings.music = +d.v; if (+d.v > 0) SND.start(); }
    else if (a === 'snd'){ const v = +d.v; S.settings.sound = v > 0; if (v > 0){ S.settings.vol = v; SND.start(); } }
    else if (a === 'manual'){ S.settings.manual = d.v === '1'; if (!S.settings.manual) helmOff(); }
    else if (a === 'admLetter'){ show(false); showLetter(() => {}); return true; }
    else if (a === 'admNew'){
      if (!confirm(L('Starte et helt nytt spill? Alt du har nå blir borte, også lagringen i skyen.', 'Start a whole new game? Everything you have now is lost, the cloud save too.'))) return true;
      const lang = S.lang, adm = S.adm; S = newState(); S.lang = lang; if (adm) S.adm = adm; S.draft = []; draftForget(true); ensureFleet(); LETTER.read = false; save(); refreshAll();
      show(false); log('Admin: nytt spill.', 'Admin: a new game.'); showIntro(); return true;
    }
    else if (a === 'admPace'){ if (WCLOCK.on){ toast(L('Alle går på samme klokke. Farten kan ikke endres.', 'Everyone is on one clock. The pace cannot be changed.')); return true; } S.mult = +d.v; $('pace').value = String(S.mult); }
    else if (a === 'admCash'){ S.cash += 100000; log('Admin: 100 000 kr lagt i kassa.', 'Admin: NOK 100,000 put in the cash.'); }
    else if (a === 'saveOut'){ saveCode().then(c => { saveBox = {mode:'out', text:c || ''}; render(); const ta = document.getElementById('saveCode'); if (ta){ ta.focus(); ta.select(); } if (c && navigator.clipboard) navigator.clipboard.writeText(c).then(() => toast(L('Lagringen er kopiert.', 'The save is copied.'))).catch(() => {}); }); return; }
    else if (a === 'saveIn'){ saveBox = {mode:'in', text:''}; }
    else if (a === 'installGo'){ INSTALL.go('settings'); }
    else if (a.startsWith('cloud') && cloudAct(a, d)){ /* the account card (ui/10f-cloud.js) */ }
    else if (a === 'saveLoad'){ const ta = document.getElementById('saveCode'); loadCode(ta ? ta.value : '').then(() => { try { sessionStorage.setItem('dsb_force', '1'); } catch (e){} toast(L('Spillet er lest inn. Siden lastes på nytt.', 'The game is read in. The page loads again.')); setTimeout(() => location.reload(), 700); }).catch(() => toast(L('Koden kunne ikke leses.', 'The code could not be read.'))); return; }
    else if (a === 'admEnergy'){ S.adm = S.adm || {}; S.adm.noEnergy = !S.adm.noEnergy;
      if (S.adm.noEnergy){ S.sleep = null; S.energy = 100; S.drowsy = false; S.enWarn = false; log('Admin: energien er skrudd av. Du blir ikke sliten og sovner ikke.', 'Admin: energy is off. You do not tire or fall asleep.'); }
      else log('Admin: energien er skrudd på igjen.', 'Admin: energy is on again.'); }
    else if (a === 'admFuel'){ const b = S.boat, add = Math.max(0, BOAT.fuelCap - b.fuel); b.fuel = BOAT.fuelCap; if (b.status === 'adrift' && add > 0) b.status = 'idle'; log('Admin: tanken fylt (' + fmt(add) + ' L).', 'Admin: the tank filled (' + fmt(add) + ' L).'); }
    else if (a === 'hbshow'){ HBUI.show(d.id); return; }   // «Vis meg» in Håndboka: the phone closes and the tip points (07c-handbook.js)
    else if (a === 'hbskip'){ HBUI.toggle(+d.ch); }
    else if (a === 'sub'){ sub[app] = d.s; if (app === 'post') sub.postArt = null; }
    else if (a === 'art'){ sub.postArt = d.k; }
    else if (a === 'artback'){ sub.postArt = null; }
    else if (a === 'ruchk'){ const c = ruChk(); c[d.k] = /^-?\d+(\.\d+)?$/.test(d.v) ? +d.v : d.v === 'null' ? null : d.v; S.ruChk = c; sub.regler = 'sjekk'; }
    else if (a === 'salgW'){ sub.salgW = d.s; }
    else if (a === 'salgG'){ sub.salgG = d.s; }
    else if (a === 'tow'){ rescue(true); toast(L('Redningsskøyta er på vei.', 'The rescue boat is on its way.')); }
    else if (a === 'unstuck'){ const why = unstuck(); toast(why ? L(why[0], why[1]) : L('Båten ligger nå på trygt vann.', 'The boat now lies on safe water.')); if (!why && typeof refreshAll === 'function') refreshAll(); }
    else if (a === 'mayday'){ confirmMayday = true; }
    else if (a === 'mayday0'){ confirmMayday = false; }
    else if (a === 'mayday2'){ confirmMayday = false; rescue(false); toast(L('Redningsskøyta er på vei.', 'The rescue boat is on its way.')); }
    else if (a === 'member'){ if (S.cash < PRICE.member){ toast(t('no_cash')); return; } S.cash -= PRICE.member; S.stats.costs += PRICE.member; S.member = true; log('Ble medlem i redningstjenesten.', 'Joined the rescue service.'); }
    else if (a === 'svc'){ const c = d.m === 'self' ? Math.round(svcCostOf(b) * 0.35) : svcCostOf(b), hh = d.m === 'self' ? 2 * YARD_H : YARD_H; if (S.cash < c){ toast(t('no_cash')); return; } if (!queueJob({kind:'svc', h:hh, self:d.m === 'self', no:d.m === 'self' ? 'Egen service på motoren' : 'Service på verkstedet', en:d.m === 'self' ? 'Servicing the engine yourself' : 'Engine service at the yard'})){ toast(L('Arbeidskøen er full.', 'The work queue is full.')); return; } S.cash -= c; S.stats.costs += c; }
    else if (a.slice(0, 3) === 'wk-'){ if (!WORK.act(a, d)) return; }
    else if (a.slice(0, 3) === 'dr-'){ if (!DRIFTUI.act(a, d)) return; }
    // Autonav to a named place from the phone: the chart plotter opens on it and finds the way; «Kast loss» is for the player (Jonas 07.10.2026)
    else if (a === 'goplace'){ const q = portById(d.id); if (!q) return; show(false); if (typeof DOCK !== 'undefined' && DOCK.close) DOCK.close(); if (S.draft.length) draftEdit(() => { S.draft = []; }); openPlotter(); view.cx = q.p.x; view.cy = q.p.y; setTimeout(() => leiaTo({x:q.p.x, y:q.p.y}), 450); return; }
    else if (a === 'rig'){ const why = rigSet(d.r); if (why){ toast(why[0]); return; } }
    else if (a === 'grpref'){ if (BAITS[d.k]) S.pgear.baitPref = d.k; }
    else if (a === 'grown'){ const got = baitFromHold(d.k, +d.n || 0); if (got > 0) toast(fmt(got, 0) + ' kg ' + SPECIES[d.k][S.lang].toLowerCase() + L(' er agn nå.', ' is bait now.')); }
    else if (a === 'grbuy'){ const why = buyGear(d.w, isNaN(+d.s) ? d.s : +d.s, +d.n); if (why){ toast(why[0]); return; } achAdd('equip'); }
    else if (a === 'grrep'){ reportLost(d.id); }
    else if (a === 'book'){ show(false); BOOK.open('salg', +d.i); return false; }
    else if (a === 'goset'){ const s = (S.sets || []).find(x => x.id === d.id); if (s) DOCK.goTo(s); return false; }
    else if (a === 'gregn'){ const why = d.m === 'shed' ? egnOrder(d.lk, +d.n, d.b || undefined) : egnSelf(d.lk, +d.n, d.b || undefined); if (why){ toast(why[0]); return; } egnUI = null; }
    // the bait chooser on a line card (lineCard): open it with the remembered bait (or the one there is most of), pick, count, close
    else if (a === 'egnui'){ const pg = S.pgear, L0 = pg && pg.lines[d.lk]; if (!L0) return; const B = baitOf(pg), bt = btOf(L0), un = L0.n - L0.baited, kg = LINE_KINDS[d.lk].baitKg;
      if (d.m === 'strip'){ const gs = Object.keys(bt).filter(k => bt[k] > 0).sort((x, y) => bt[y] - bt[x]); egnUI = {lk:d.lk, m:'strip', b:gs[0], n:bt[gs[0]] || 1, t:''}; }
      else { const pref = BAITS[pg.baitPref] ? pg.baitPref : 'makrell', most = Object.keys(B).filter(k => BAITS[k]).sort((x, y) => B[y] - B[x])[0], bk = (B[pref] || 0) >= kg || !most || (B[most] || 0) < kg ? pref : most;
        egnUI = {lk:d.lk, m:'egn', b:bk, n:Math.max(1, Math.min(un, Math.floor((B[bk] || 0) / kg + 1e-9) || un)), t:''}; } }
    else if (a === 'egnb'){ if (egnUI && BAITS[d.k]){ egnUI.b = d.k; const pg = S.pgear, L0 = pg.lines[egnUI.lk];
      if (egnUI.m === 'strip') egnUI.n = btOf(L0)[d.k] || 1; else { const f = Math.floor((baitOf(pg)[d.k] || 0) / LINE_KINDS[egnUI.lk].baitKg + 1e-9); egnUI.n = Math.max(1, Math.min(L0.n - L0.baited, f || L0.n - L0.baited)); } } }
    else if (a === 'egnt'){ if (egnUI) egnUI.t = BAITS[d.k] ? d.k : ''; }
    else if (a === 'egnn'){ if (egnUI) egnUI.n = Math.max(1, (egnUI.n || 1) + (+d.d || 0)); }
    else if (a === 'egnx'){ egnUI = null; }
    else if (a === 'grstrip'){ const why = stripSelf(d.lk, d.b, +d.n, d.t || null); if (why){ toast(why[0]); return; } egnUI = null; }
    else if (a === 'grmend'){ const why = d.m === 'bot' ? botOrder(d.id) : d.m === 'shop' ? netShop(d.id) : mendSelf(d.id); if (why){ toast(why[0]); return; } }
    else if (a === 'carehk'){ const why = hooksJob(d.lk, d.m === 'shop'); if (why){ toast(why[0]); return; } }
    else if (a === 'carelr'){ const why = lineFix(d.lk, d.m === 'shop'); if (why){ toast(why[0]); return; } }
    else if (a === 'carepot'){ const why = potFix(d.m === 'shop'); if (why){ toast(why[0]); return; } }
    else if (a === 'carejig'){ const why = jigJob(d.k); if (why){ toast(why[0]); return; } }
    else if (a === 'jigsel'){ const why = jigChoose(d.k); if (why){ toast(why[0]); return; } }
    else if (a === 'careauto'){ S.settings.careAuto = S.settings.careAuto === false; }
    else if (a === 'caresell'){ const why = sellGear(d.w, isNaN(+d.k) ? d.k : +d.k, +d.n || 1); if (why){ toast(why[0]); return; } }
    else if (a === 'grsplit'){ const l = S.pgear.nets.find(x => x.id === d.id); if (l) splitNets(l.id, Math.floor(l.n / 2)); }
    else if (a === 'grjoin'){ joinNets(d.a, d.b); }
    else if (a === 'jobx'){ const j = (S.jobs || [])[+d.i]; if (j && j.until == null){ S.jobs.splice(+d.i, 1); gearJobCancel(j); const refund = j.kind === 'prep' ? PREP[j.k].cost : j.kind === 'fit' ? EQUIP[j.k].price : j.kind === 'hold' ? upPrice(HOLDUP[j.lv - 1].pc) : j.kind === 'eng' ? upPrice(ENGUP[j.lv - 1].pc) : j.kind === 'hull' ? 1500 + Math.round(BOAT.len * 400 / 100) * 100 : 0; S.cash += refund; S.stats.costs -= refund; } }
    else if (a === 'service'){ const c = svcCostOf(b); if (S.cash < c){ toast(t('no_cash')); return; } S.cash -= c; S.stats.costs += c; b.svcAt = b.engH || 0; S.svcTold = false; log('Motorservice utført.', 'Engine serviced.'); }
    else if (a === 'holdup'){ const lv = (S.boat.holdLv || 0) + 1, nx = HOLDUP[lv - 1]; if (!nx || !atKind('verft') || (S.jobs || []).some(j => j.kind === 'hold')) return; const c = upPrice(nx.pc, nx.min); if (S.cash < c) return;
      if (!queueJob({kind:'hold', lv, h:nx.h, no:'Ombygging av lasterommet', en:'Rebuilding the hold'})){ toast(L('Arbeidskøen er full.', 'The work queue is full.')); return; } S.cash -= c; S.stats.costs += c; log('Bestilte ombygging av lasterommet, ' + kr(c) + '.', 'Ordered a rebuild of the hold, ' + kr(c) + '.'); }
    else if (a === 'upg'){ const k = d.u, U = UPGS[k], nx = U && upgNext(S.boat, k); if (!nx || !atKind('verft') || (S.jobs || []).some(j => j.kind === 'upg' && j.u === k)) return; const c = upPrice(nx.pc, nx.min); if (S.cash < c) return;
      if (!queueJob({kind:'upg', u:k, lv:upgLv(S.boat, k) + 1, h:nx.h, no:'Ombygging: ' + nx.no, en:'Rebuild: ' + nx.en})){ toast(L('Arbeidskøen er full.', 'The work queue is full.')); return; } S.cash -= c; S.stats.costs += c; log('Bestilte ombygging, ' + nx.no.toLowerCase() + ', ' + kr(c) + '.', 'Ordered a rebuild, ' + nx.en.toLowerCase() + ', ' + kr(c) + '.'); }
    else if (a === 'engup'){ const lv = (S.boat.engLv || 0) + 1, nx = ENGUP[lv - 1]; if (!nx || !atKind('verft') || VESSELS[S.boat.type].outboard || (S.jobs || []).some(j => j.kind === 'eng')) return; const c = upPrice(nx.pc, nx.min); if (S.cash < c) return;
      if (!queueJob({kind:'eng', lv, h:nx.h, no:'Motorbytte', en:'Engine change'})){ toast(L('Arbeidskøen er full.', 'The work queue is full.')); return; } S.cash -= c; S.stats.costs += c; log('Bestilte større motor, ' + kr(c) + '.', 'Ordered a bigger engine, ' + kr(c) + '.'); }
    else if (a === 'hullfix'){ if (!atKind('verft')) return; const why = hullOrder(false); if (why){ toast(why[0] === 'no_cash' ? t('no_cash') : L('Arbeidskøen er full.', 'The work queue is full.')); return; } }
    else if (a === 'kasko'){ if (!atKind('verft')) return; if (kaskoSign()){ toast(t('no_cash')); return; } }
    else if (a === 'kaskox'){ kaskoEnd(); }
    else if (a === 'hullclean'){ if (!atKind('verft') || (S.jobs || []).some(j => j.kind === 'hull')) return; const c = 1500 + Math.round(BOAT.len * 400 / 100) * 100; if (S.cash < c) return;
      if (!queueJob({kind:'hull', h:6, no:'Skrogrens på slipp', en:'Hull cleaning on the slip'})){ toast(L('Arbeidskøen er full.', 'The work queue is full.')); return; } S.cash -= c; S.stats.costs += c; log('Bestilte skrogrens på slipp, ' + kr(c) + '.', 'Ordered a hull cleaning on the slip, ' + kr(c) + '.'); }
    else if (a === 'trimbuy'){ const b = S.boat, B = BOOSTS[d.k]; if (!B || !canBoost(VESSELS[b.type])) return; payBuy(d.k, () => { b.trim = {k:d.k, t0:S.t}; applyVessel(); log(B.no + ' er på i ' + B.h + ' timer. Toppfart nå ' + fmt(BOAT.vmax, 1) + ' knop.', B.en + ' is on for ' + B.h + ' hours. Top speed now ' + fmt(BOAT.vmax, 1) + ' knots.'); toast(L(B.no + ': ', B.en + ': ') + fmt(BOAT.vmax, 1) + ' kn'); }); }
    else if (a === 'equip'){ const E = EQUIP[d.k]; if (!atKind(EQ_YARD(d.k) ? 'verft' : 'butikk') || S.cash < E.price) return; if (!queueJob({kind:'fit', k:d.k, h:fitHours(d.k), no:'Montering av ' + E.name.no.toLowerCase(), en:'Fitting the ' + E.name.en})){ toast(L('Arbeidskøen er full.', 'The work queue is full.')); return; } S.cash -= E.price; S.stats.costs += E.price; achAdd('equip'); log('Kjøpt ' + E.name.no + '. Monteres i verkstedet.', 'Bought the ' + E.name.en + '. Being fitted at the yard.'); } else if (a === 'equipOLD'){ const E = EQUIP[d.k]; if (E.multi) S.equip[d.k] = (S.equip[d.k] || 0) + 1; else S.equip[d.k] = true; applyVessel(); log('Montert: ' + E.name.no + '.', 'Fitted: ' + E.name.en + '.'); updateMapButtons(); INSTR.show(); }
    else if (a === 'hire'){ const c = candidates().find(x => x.id === d.id); if (c && S.crew.length < BOAT.crewMax){ S.crew.push(crewUpgrade(c)); log(c.name + ' er ansatt som ' + c.lv + '.', c.name + ' joined as ' + c.lvEn + '.'); } }
    else if (a === 'fire'){ if (!crewAshore()) return; const c = S.crew[+d.i]; if (c){ crewSettle(c); S.crew.splice(+d.i, 1); } if (c) log(c.name + ' har gått i land.', c.name + ' has gone ashore.'); }
    else if (a === 'repay'){ const k = d.k || 'loan', Q = S[k]; if (!Q || S.cash < 10000) return; const x = Math.min(10000, Q.bal); S.cash -= x; Q.bal -= x; if (Q.bal < 1) S[k] = null; }
    else if (a === 'repayAll'){ const k = d.k || 'loan', Q = S[k]; if (!Q || S.cash < Q.bal) return; S.cash -= Q.bal; S[k] = null; log((k === 'loanIN' ? 'Risikolånet' : 'Båtlånet') + ' er innfridd.', 'The ' + (k === 'loanIN' ? 'risk' : 'vessel') + ' loan is paid off.'); }
    else if (a === 'papers'){ app = 'kvote'; sub.kvote = 'mine'; }
    else if (a === 'mktab'){ sub.marked = d.s; mkSel = null; }
    else if (a === 'mksel'){ mkSel = d.k ? {k:d.k, o:d.o || null} : null; }
    else if (a === 'minsheet'){ minSheet = !minSheet; }
    else if (a === 'mk3d'){ if (typeof DOCK !== 'undefined') DOCK.close(); if (isOpen) show(false); G3.showroom(d.k); return; }
    else if (a === 'buy'){
      // data-ti="1": trade in the vessel you follow; data-ti="0": add a vessel to the fleet (not an open-group boat before the company has a closed-group one)
      const V2 = VESSELS[d.k], ti = d.ti === '0' ? 0 : tradeIn(); if (!V2 || V2.lock || !atKind('verft') || S.order || (ti && S.boat.type === d.k)) return;
      if (!ti && V2.len < 11 && !hasLic()){ toast(L('Et rederi kan bare ha én båt i åpen gruppe.', 'A company can only have one boat in the open group.')); return; }
      const x = deal(V2.price, ti); if (!x.ok){ toast(whyText(x) || t('no_cash')); return; } finance(x, 120); achAdd('boat');
      // a new build is delivered at once, at this yard, like a used vessel (Jonas 13.10.2026: «Fjern byggetiden når man bestiller nybygg»)
      if (ti) switchVessel(d.k);
      else { const v = newVesselObj(d.k, S.boat.port); log('Kjøpte ' + V2.name.no + ' til flåten. Hun heter «' + v.boatName + '» og ligger i ' + portById(S.boat.port).name + '.', 'Bought the ' + V2.name.en + ' for the fleet. She is called «' + v.boatName + '» and lies at ' + portById(S.boat.port).name + '.'); }
      pressPut('boat', {type:d.k, nb:V2.isNew ? 1 : 0, price:V2.price});   // Kystposten (core/09h-press.js)
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
      else { B.pool.splice(B.pool.indexOf(c), 1); c.hiredT = S.t; c.earn = []; delete c.until; S.crew.push(c); achAdd('crew'); log(c.name + ' har mønstret på som ' + c.lv + ' med ' + Math.round(c.share * 100) + ' % lott.', c.name + ' signed on as ' + c.lvEn + ' on a ' + Math.round(c.share * 100) + '% share.'); } }
    else if (a === 'foundas'){ if (!foundAS()) toast(t('no_cash')); }
    else if (a === 'coff'){ const c = crewById(d.id); if (c){ c.off = !c.off; if (c.off){ c.morale = Math.min(100, c.morale + 2); } else delete c.offTrip; } }
    // lott or hyre (E3): the day wage is the one asked for when the agreement is changed
    else if (a === 'cpay'){ const c = crewById(d.id); if (c){ if (c.pay === 'hyre') c.pay = 'lott'; else { c.pay = 'hyre'; c.hyre = hyreAsk(c); }
      log(c.name + (c.pay === 'hyre' ? ' går over på hyre: ' + kr(c.hyre) + ' per dag.' : ' går over på lott: ' + Math.round(c.share * 100) + ' %.'), c.name + (c.pay === 'hyre' ? ' moves to a wage: ' + kr(c.hyre) + ' a day.' : ' moves to a share: ' + Math.round(c.share * 100) + ' %.')); } }
    else if (a === 'cfire'){ if (!crewAshore()){ toast(L('Mannskap kan bare sies opp når båten ligger til kai.', 'Crew can only be let go with the boat at a quay.')); return; } const c = crewById(d.id); if (c){ crewSettle(c); const i = S.crew.indexOf(c); S.crew.splice(i, 1); log(c.name + ' har gått i land.', c.name + ' has gone ashore.'); for (const o of S.crew){ o.morale = clamp(o.morale + (compat(o, c) < 0 ? 4 : -4), 0, 100); if (o.grudge) delete o.grudge[c.id]; } if (S.cevt && (S.cevt.a === c.id || S.cevt.b === c.id)) S.cevt = null; } }
    else if (a === 'cres'){ const ev = S.cevt; if (!ev) return; const A = crewById(ev.a), Bc = crewById(ev.b), o = d.o, g = (x, y, v) => { if (x && y){ x.grudge = x.grudge || {}; x.grudge[y.id] = (x.grudge[y.id] || 0) + v; } };
      if (A) A.cpen = 0; if (Bc) Bc.cpen = 0;
      if (o === 'talk'){ const calm = crewAboard().some(c => c.traits.includes('spokefugl') || c.traits.includes('omsorgsfull')) ? 0.15 : 0, pr = 0.4 + Math.min(0.25, S.sales.length * 0.005) + calm + 0.05 * (compat(A, Bc) + 3);
        if (Math.random() < pr){ if (A.grudge) delete A.grudge[Bc.id]; if (Bc.grudge) delete Bc.grudge[A.id]; A.morale += 5; Bc.morale += 5; toast(L('Dere fikk snakket ut. Stemningen er bedre.', 'You talked it through. The mood is better.')); }
        else { g(A, Bc, 1); g(Bc, A, 1); A.morale -= 5; Bc.morale -= 5; toast(L('Praten hjalp ikke. De er fortsatt sure på hverandre.', 'The talk did not help. They are still cross with each other.')); } }
      else if (o === 'sideA' || o === 'sideB'){ const W = o === 'sideA' ? A : Bc, Lz = o === 'sideA' ? Bc : A; W.morale += 8; Lz.morale -= Lz.traits.includes('stolt') ? 22 : 15; g(Lz, W, 1); }
      else if (o === 'offB'){ Bc.off = true; Bc.morale -= 4; if (A.grudge) A.grudge[Bc.id] = Math.max(0, (A.grudge[Bc.id] || 0) - 0.5); }
      else if ((o === 'fireB' || o === 'fireA') && !crewAshore()){ toast(L('Mannskap kan bare sies opp når båten ligger til kai.', 'Crew can only be let go with the boat at a quay.')); return; }
      else if (o === 'fireB' || o === 'fireA'){ const q = o === 'fireB' ? Bc : A; S.cevt = null; const i = S.crew.indexOf(q); if (i >= 0){ crewSettle(q); S.crew.splice(i, 1); log(q.name + ' har gått i land.', q.name + ' has gone ashore.'); } }
      else if (o === 'listen'){ if (ev.topic === 'lott'){ A.share = Math.round((A.share + 0.01) * 100) / 100; } else if (ev.topic === 'hvile'){ A.off = true; } A.morale += ev.topic === 'lott' ? 12 : 8; }
      else if (o === 'firm'){ A.morale -= 10; if (A.traits.includes('kranglefant') || A.traits.includes('stolt')) A.morale -= 6; }
      for (const c of S.crew) c.morale = clamp(c.morale, 0, 100); S.cevt = null; }
    else if (a === 'turtake'){ const e = turTake(+d.id); if (e) toast(e); }
    else if (a === 'turdrop'){ turDrop(+d.id); }
    else if (a === 'turgo'){ turGo(+d.id); show(false); return false; }
    else if (a === 'turmeas'){ show(false); turMeasure(+d.id); return false; }
    else if (a === 'turfoto'){ turFotoShoot(+d.id); }
    else if (a === 'ordtake'){ const O = ordState(), o = O.offers.find(x => x.id === +d.id); if (!o || O.active.length >= 3) return; O.offers.splice(O.offers.indexOf(o), 1); o.due = S.t + o.days * 1440; O.active.push(o); log('Tok en bestilling fra ' + CUSTOMERS.find(c => c.id === o.cust).no + '.', 'Took an order from ' + CUSTOMERS.find(c => c.id === o.cust).no + '.'); }
    else if (a === 'cloth'){ const C = CLOTHES[d.k], people = 1 + S.crew.length, have = (S.clothes || {})[d.k] || 0; if (!C || have >= people) return; if (S.cash < C.price){ toast(t('no_cash')); return; } S.cash -= C.price; S.stats.costs += C.price; S.clothes = S.clothes || {olje:0, varme:0}; S.clothes[d.k] = have + 1; log('Kjøpte ' + C.no.toLowerCase() + '.', 'Bought ' + C.en.toLowerCase() + '.'); }
    else if (a === 'haillbuy'){ if (tutFree('haill') && d.k !== 'luksus') return; const k = d.k, got = () => { giveHaill(k, 'shop'); toast(HAILL[k][S.lang] + L(' ligger i beholdningen. Trykk «Aktiver» når du vil bruke den.', ' is in store. Tap «Switch on» when you want it.')); };
      if (tutFree('haill')){ tutMark('free_haill'); got(); } else payBuy(k, got); }
    else if (a === 'skipbuy'){ const k = d.k; if (!SKIP[k]) return; payBuy('sk_' + k, () => { const n = giveSkip(k); if (n) toast(n + L(': du og mannskapet er uthvilt i ' + Math.round(skipLeft()) + ' timer.', ': you and the crew are rested for ' + Math.round(skipLeft()) + ' hours.')); }); }
    else if (a === 'haillon'){ if (S.haill && haillStage() && haillPend !== d.k){ haillPend = d.k; return true; } haillPend = null; if (useHaill(d.k)) toast(HAILL[d.k][S.lang] + L(' er aktivert: +', ' is on: +') + Math.round(haillBoost() * 100) + ' %.'); }
    else if (a === 'haill0'){ haillPend = null; }
    else if (a === 'jobOT'){ const j = (S.jobs || [])[+d.i]; if (!j || j.until == null || j.ot) return; const left = Math.max(0, j.until - S.t) / 60, c = Math.round(left / 2 * 950 / 10) * 10; if (S.cash < c){ toast(t('no_cash')); return; }
      S.cash -= c; S.stats.costs += c; j.until = S.t + (j.until - S.t) / 2; j.ot = true; log('Leide inn mekaniker på overtid for ' + c + ' kr.', 'Hired a mechanic on overtime for NOK ' + c + '.'); }
    else if (a === 'yardnow'){ payBuy('yard', () => { let n = 0; for (const j of S.jobs || []) if (YARD_KINDS.includes(j.kind) && j.until != null && j.until > S.t){ j.until = S.t; n++; } if (n){ log('Verftet gjorde ' + (n > 1 ? n + ' jobber' : 'jobben') + ' ferdig med én gang.', 'The yard finished ' + (n > 1 ? n + ' jobs' : 'the job') + ' straight away.'); toast(L('Verftet er ferdig', 'The yard is done')); } }); }
    else if (a === 'jobRush'){ const j = (S.jobs || [])[+d.i]; if (!j || j.until == null || !adminOk()) return; j.until = S.t; log('Admin: jobben ble gjort ferdig med én gang.', 'Admin: the job was finished straight away.'); }
    else if (a === 'struct'){
      // a structure quota: buy a right in the same group, scrap the boat, and add its quota factor less 10 % (03d-quota.js)
      const l = S.lic; if (!l || !structRoom(l, d.id) || !atTrade()) return; const pr = structPrice(d.id, S.t / 60), x = deal(pr, 0); if (!x.ok){ toast(whyText(x) || t('no_cash')); return; } finance(x, 180);
      const sl = regSeller(d.id, S.t / 60), k = structIn(l, d.id, S.t / 60); pressPut('kvote', {kf:Math.round(k * 10000), type:S.boat.type});
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
      const y = yearH(S.t / 60), o = coopOffer(S.t / 60); if (!coopOK(S.lic, y) || S.crew.length + 1 >= BOAT.crewMax || !atTrade()) return;
      const c = Object.assign(genCrew(), {name:o.name, home:o.home, share:0, ask:0, morale:70, fatigue:10, traits:[], known:[true, true], coop:true});
      S.crew.push(c); S.lic.coop = {y, id:o.id, name:o.name, crew:c.id};
      msg('Fiskeridirektoratet', 'Kvotesamarbeidet med ' + o.name + ' (hjemmel ' + HJ[o.id].hl + ') er registrert for ' + y + '. Han er om bord, og båten hans ligger til kai.', 'The quota cooperation with ' + o.name + ' (quota length ' + HJ[o.id].hl + ') is registered for ' + y + '. He is aboard, and his boat lies at the quay.'); }
    else if (a === 'buylic'){
      const O = LIC_OFFERS.find(x => x.k === d.id); if (!O || !atTrade() || S.order) return;
      const price = VESSELS[O.ves].price + licValue(O), ti = d.ti === '0' ? 0 : tradeIn(); if (ti && S.lic && S.lic.id === O.id && S.boat.type === O.ves) return;
      if (!bladB()){ toast(L('Du må stå på blad B i fiskermanntallet for å kjøpe en båt med hjemmel. Se Papirer.', 'You must be on blad B of the fishermen\'s register to buy a boat with a right. See Papers.')); return; }
      const inn = innOK(), x = deal(price, ti, inn); if (!x.ok){ toast(whyText(x) || t('no_cash')); return; }
      if (!S.company){ const el = document.getElementById('coName'); S.company = String((el && el.value) || coDraft || '').trim().slice(0, 28) || coDefault(); coDraft = null; log('Rederiet ' + S.company + ' er opprettet.', 'The company ' + S.company + ' is founded.'); }
      finance(x, 180); if (inn) S.inUsed = true;
      const sl = regSeller(O.id, S.t / 60), lic = {id:O.id, hl:O.hl, kpk:O.kpk, since:yearH(S.t / 60), from:sl.name + ', ' + sl.home}, ov = openVesselId(), lost = ov && !(ti && ov === S.cur) ? vget(vesselById(ov), 'boatName') : null;
      let nm;
      let fished; regTake(O.id);   // the NPC owner leaves the register (03d-quota.js)
      if (ti){ if (!S.lic && S.cur === ov) openUsedSave(S.quota); switchVessel(O.ves); S.lic = lic; fished = licStart(lic); nm = S.boatName; }
      else { if (ov) openUsedSave(vget(vesselById(ov), 'quota')); const v = newVesselObj(O.ves, S.boat.port, lic); fished = withVessel(v, () => licStart(lic)); nm = v.boatName; log('Kjøpte ' + O.no.toLowerCase() + ' til flåten. Hun heter «' + nm + '».', 'Bought a ' + O.en.toLowerCase() + ' for the fleet. She is called «' + nm + '».'); }
      pressPut('boat', {type:O.ves, lic:1});
      msg('Fiskeridirektoratet', 'Deltakeradgangen i lukket gruppe (hjemmelslengde ' + O.hl + ') er registrert på «' + nm + '». Fartøykvoten for torsk i år er ' + fmt(O.cod / 1000, 2) + ' tonn. Selgeren har fisket ' + fmt(fished / 1000, 2) + ' tonn av den, og det trekkes fra (§ 29).' + (lost ? ' Rederiet har nå en båt i lukket gruppe, så «' + lost + '» kan ikke lenger delta i åpen gruppe. Hun kan fortsatt fiske kveite, krabbe og annet enn torsk, hyse og sei.' : ''), 'The closed-group participation right (quota length ' + O.hl + ') is registered to the «' + nm + '». The vessel quota for cod this year is ' + fmt(O.cod / 1000, 2) + ' t. The seller has fished ' + fmt(fished / 1000, 2) + ' t of it, which comes off (§ 29).' + (lost ? ' The company now has a vessel in the closed group, so the «' + lost + '» can no longer take part in the open group. She can still fish halibut, crab and anything but cod, haddock and saithe.' : ''));
    }
    return true;
  }
  view.addEventListener('click', e => { const t0 = e.target.closest('[data-pa],[data-act]'); if (!t0 || t0.disabled) return; if (t0.dataset.pa) act(t0.dataset.pa, t0.dataset); else { doAct(t0); render(); } });
  view.addEventListener('input', e => { if (e.target.id === 'hbQ'){ HBUI.q = e.target.value; const l = view.querySelector('.hb-list'); if (l) l.innerHTML = HBUI.list(); return; } if (e.target.id === 'coName') coDraft = e.target.value; else if (e.target.id === 'fbBody') return FEEDBACK.input(e.target.value); panelInput(e); });
  view.addEventListener('change', e => { if (e.target.id === 'fbFile') return FEEDBACK.pick(e.target.files); panelChange(e); if (e.target.id === 'setAuto') render(); });
  el.querySelector('.ph-nav').addEventListener('click', e => { const t0 = e.target.closest('[data-pa]'); if (t0) act(t0.dataset.pa, t0.dataset); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && isOpen) show(false); });
  el.classList.add('off');
  return {show, toggle(){ show(!isOpen); }, candidates, hire(id){ const c = candidates().find(x => x.id === id); if (!c || S.crew.length >= BOAT.crewMax) return false; S.crew.push(crewUpgrade(c)); log(c.name + ' er ansatt som ' + c.lv + '.', c.name + ' joined as ' + c.lvEn + '.'); save(); render(); return true; }, open(a){ if (DRAWER.has(String(a).split(':')[0])){ show(false); DOCK.open(a); } else show(true, a); }, page, dact, DRAWER, isOpen:() => isOpen, render, status, setBadge, tickHome, switchVessel, alerts, get app(){ return app; }, get sel(){ return selVessel().id; }};
})();

