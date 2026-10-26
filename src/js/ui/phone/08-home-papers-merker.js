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
