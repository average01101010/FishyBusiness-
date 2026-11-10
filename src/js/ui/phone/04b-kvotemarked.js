  // ===== Kvotemarkedet: Kvote → Marked (KM3 of docs/planer/kvotemarkedet.md; Jonas 07.11.2026 V1 A–V5 A, valg 15 A 10.11.2026) =====
  // What players sell to each other is rights (hjemler) and structure quotas, never kilos; the goods and the rules are
  // core/03i-kvotemarked.js, the calls ui/10t-kvotemarked.js (KMC), the settlement core/09k-market.js (mbKm). On top stands the common
  // quota (the group quotas of the year, tonnes a factor, and how many of the register's rights players hold). The tabs: Registeret (the
  // owners left per quota length, the week's seller, and structuring from the register, as before: kvReg in 04-kvote.js), Hjemler,
  // Strukturkvoter, Dine (what waits for a boat, your listings and bids, what you can put out, your free rights, the wish) and Solgt
  // siste måned. A card: the quota length, the factor, the year's quota in tonnes, the years left, what is landed on it this year, the
  // valuation, the highest bid, buy-now and the time left. The buyer chooses the boat before he bids: put on a boat without a right,
  // or structured onto one in the same group (the cap and the 10 % cut shown). Only game kroner, and nothing random: the good is known.
  let kxSel = null, kxPut = null; const kxMsg = {}, kxTo = {};
  const KX_GRP = {u11:['under 11 m', 'under 11 m'], g11:['11–14,9 m', '11–14.9 m'], g15:['15–20,9 m', '15–20.9 m'], g21:['21–27,9 m', '21–27.9 m']};
  const KX_WHY = {gone:['Salget er over.', 'The sale is over.'], none:['Båten har ingen hjemmel.', 'The boat has no right.'], hav:['Havtillatelsene selges med havbåten på verftet.', 'The ocean permits are sold with the vessel at the yard.'],
    two:['Den andre kvoten fra den særlige ordningen kan ikke selges; den faller bort.', 'The second quota from the special scheme cannot be sold; it falls away.'],
    listed:['Den ligger alt ute, eller båten ligger til salgs.', 'It is out already, or the boat is for sale.'], sea:['Båten må ligge i havn.', 'The boat must lie in port.'], busy:['Båten losser ved mottaket.', 'The boat is landing at the plant.'],
    drift:['Ingen fangst er landet på hjemmelen i år eller de to foregående årene.', 'No catch has been landed on the right this year or the two before.'], coop:['Hjemmelen er i kvotesamarbeid i år.', 'The right is in a quota cooperation this year.'],
    short:['Strukturkvoten har under ett år igjen.', 'The structure quota has under a year left.'], hold:['Lasten må leveres først, så det som er landet på den, står fast.', 'The catch must be landed first, so what is landed on it stands.'], ops:['Slå av driftsplanen hennes først.', 'Turn her plan off first.'], many:['Høyst tre oppføringer ute om gangen, med båtene hos Kystmegleren.', 'At most three listings out at a time, with the boats at Kystmegleren.'],
    cloud:['Kvotemarkedet trenger nett og innlogging.', 'The quota market needs the net and a sign-in.'], guest:['Registrer deg for å handle i Kvotemarkedet.', 'Register to trade in the quota market.'],
    start:['Startprisen må være mellom 40 % og 160 % av taksten.', 'The start price must be between 40 % and 160 % of the valuation.'], buynow:['«Kjøp nå» må være over startprisen og høyst 160 % av taksten.', 'Buy now must be above the start price and at most 160 % of the valuation.'],
    hours:['Velg hvor lenge den skal ligge ute.', 'Choose how long it is to be out.'], own:['Det er din egen oppføring.', 'That is your own listing.'], bladb:['Å eie en hjemmel krever blad B i fiskermanntallet. Se Papirer.', 'Holding a right needs blad B of the fishermen\'s register. See Papers.'],
    how:['En strukturkvote kan bare struktureres inn på en båt med hjemmel.', 'A structure quota can only be structured onto a boat with a right.'], boat:['Velg en båt.', 'Choose a boat.'], type:['Ikke på et havfartøy.', 'Not on an ocean vessel.'],
    haslic:['Båten har hjemmel fra før.', 'The boat has a right already.'], len:['Lengderegelen: hjemmelen kan ikke flyttes til en så lang båt.', 'The length rule: the right cannot be moved to a boat that long.'],
    nolic:['Båten har ingen hjemmel å strukturere inn på.', 'The boat has no right to structure onto.'], group:['Ikke samme gruppe (bare 11–27,99 m, i samme gruppe).', 'Not the same group (only 11–27.99 m, in the same group).'],
    cap:['Over kvotetaket.', 'Over the quota cap.'], cash:['Du har ikke nok penger.', 'You do not have the money.']};
  const kxWhy = (w, r) => (r && r.text) || (KX_WHY[w] ? L(KX_WHY[w][0], KX_WHY[w][1]) : L('Det går ikke nå.', 'Not now.'));
  const kxT = (kg, d) => fmt(kg / 1000, d == null ? 1 : d) + ' t';
  const kxName = it => (it.kind === 'struct' ? L('Strukturkvote ', 'Structure quota ') : L('Hjemmel ', 'Right ')) + mgEsc(HJ[it.id].hl);
  const kxNow = Q => Q.top != null ? Q.top : Q.start;
  // the year's quota on a good: cod by its factors (kmCod), haddock and saithe the guaranteed part in the same proportion (licQ's)
  function kxQ(it, H){ const R = HJ[it.id], Y = yearQuota(yearH(H)), m = kmKf(it) / R.kf; return {torsk:kmCod(it, H), hyse:R.hyse[0] * Y.fh * m * 1000, sei:R.sei[0] * Y.fs * m * 1000}; }
  const kxUsed = (it, H) => it.used && it.y === yearH(H) ? it.used : {torsk:0, hyse:0, sei:0};
  // the common quota (kap. 4.5 point 6): the group quotas of the year, tonnes a factor, and the rights players hold of the register's
  function kxCommon(H){
    const y = yearH(H), Y = yearQuota(y), R = npcReg(), tot = Object.values(REGN).reduce((a, n) => a + n, 0), left = Object.keys(REGN).reduce((a, id) => a + Math.min(REGN[id], R[id] || 0), 0);
    return '<div class="ph-card kx-common"><h4>' + L('Den felles kvoten ', 'The common quota ') + y + '</h4><table class="ph-tbl"><tr><th>' + L('Gruppe', 'Group') + '</th><th class="n">' + L('Gruppekvote, torsk', 'Group quota, cod') + '</th><th class="n">' + L('Tonn per faktor', 'Tonnes a factor') + '</th></tr>' +
      ['u11', 'g11', 'g15'].map(g => '<tr><td>' + L(KX_GRP[g][0], KX_GRP[g][1]) + '</td><td class="n">' + fmt(Y.chain.grp[g], 0) + ' t</td><td class="n">' + fmt(Y.unit[g], 2) + ' t</td></tr>').join('') + '</table>' +
      '<p class="ph-note">' + L('Spillerne eier ' + fmt(tot - left, 0) + ' av de ' + fmt(tot, 0) + ' hjemlene i registeret. Kvoten er den samme for alle: en hjemmel gir kvotefaktoren ganger tonn per faktor, hos den som eier den. Handelen flytter bare hvem som fisker.',
        'Players hold ' + fmt(tot - left, 0) + ' of the ' + fmt(tot, 0) + ' rights in the register. The quota is the same for everyone: a right gives its quota factor times the tonnes a factor, with whoever holds it. Trade only moves who fishes.') + '</p></div>';
  }
  function kxCard(Q){
    const it = Q.item, H = S.t / 60, held = KMC.bids().some(b => String(b.listing) === String(Q.id));
    return '<button class="ph-card vcard mg-card kx-card" data-pa="kmsel" data-id="' + Q.id + '"><span class="vtx"><b>' + kxName(it) + ' <small class="mg-nr">nr. ' + Q.id + '</small></b>' +
      '<small>' + L('Kvotefaktor ', 'Quota factor ') + fmt(kmKf(it), 4) + ' · ' + L('torsk i år ', 'cod this year ') + kxT(kmCod(it, H)) + (it.kind === 'struct' ? ' · ' + fmt(kmLeft(it, H), 1) + L(' år igjen', ' years left') : (it.st || []).length ? ' · ' + L('med strukturkvote', 'with structure quota') : '') + '</small>' +
      '<small>' + L('Landet i år ', 'Landed this year ') + kxT(kxUsed(it, H).torsk) + ' · ' + L('takst ', 'valuation ') + kr(kmTakst(it, H)) + '</small>' +
      '<span class="vpr">' + (Q.top != null ? L('Bud ', 'Bid ') + kr(Q.top) : L('Fra ', 'From ') + kr(Q.start)) + (Q.buynow ? ' <i>' + L('Kjøp nå ', 'Buy now ') + kr(Q.buynow) + '</i>' : '') + '</span>' +
      (Q.mine ? '<small class="mg-goal ok">' + L('Din oppføring', 'Your listing') + '</small>' : Q.top_me ? '<small class="mg-goal ok">' + L('Du har det høyeste budet', 'You hold the highest bid') + '</small>' : held ? '<small class="mg-goal">' + L('Du er overbydd', 'You are outbid') + '</small>' : '') +
      '<small>' + L('Slutter om ', 'Ends in ') + mbLeftTxt(MBC.left(Q.until)) + ' · ' + Q.bids + L(' bud', Q.bids === 1 ? ' bid' : ' bids') + '</small></span></button>';
  }
  // the boats that could take a good, each with how (put or struct) and why not; a structure quota is only structured
  function kxBoats(it){
    return S.fleet.filter(v => (VESSELS[vget(v, 'boat').type] || {}).cls !== 'hav').map(v => { const l = vget(v, 'lic'), how = it.kind === 'struct' || l ? 'struct' : 'put'; return {v, how, why:kmBuyWhy(it, {v, how}, null), l}; });
  }
  // the choice of boat: chips, the first that can take it chosen; under each structuring the factor it adds (less 10 % for a right) and the cap
  function kxChoice(key, it, pa){
    const B = kxBoats(it), ok = B.filter(o => !o.why); let c = kxTo[key]; if (!c || !ok.some(o => o.v.id === c.vid && o.how === c.how)) c = kxTo[key] = ok.length ? {vid:ok[0].v.id, how:ok[0].how} : null;
    const row = o => { const on = c && c.vid === o.v.id && c.how === o.how, nm = '«' + mgEsc(vget(o.v, 'boatName')) + '»', A = o.l && HJ[o.l.id];
      const sub2 = o.why ? kxWhy(o.why) : o.how === 'put' ? L('blir en båt i lukket gruppe', 'becomes a boat in the closed group')
        : L('kvotefaktor +', 'quota factor +') + fmt(kmAddKf(it), 4) + (it.kind === 'right' ? L(' (−10 %, i 20 år)', ' (−10 %, for 20 years)') : '') + (A && STRUCT.cap[A.grp] ? ' · ' + L('tak ', 'cap ') + STRUCT.cap[A.grp] + '×: ' + fmt(A.kf + (o.l.extra || 0) + kmAddKf(it), 2) + L(' av ', ' of ') + fmt(A.kf * STRUCT.cap[A.grp], 2) : '');
      return '<button class="chip-b' + (on ? ' on' : '') + '" data-pa="' + pa + '" data-k="' + key + '" data-v="' + o.v.id + '" data-how="' + o.how + '"' + (o.why ? ' disabled' : '') + '>' + (o.how === 'put' ? L('Sett på ', 'Put on ') : L('Strukturer inn på ', 'Structure onto ')) + nm + '<br><small>' + sub2 + '</small></button>'; };
    return {c, ok:ok.length > 0, html:'<div class="net-shops kx-to">' + B.map(row).join('') + '</div>'};
  }
  const kxPick = key => { const c = kxTo[key], v = c && vesselById(c.vid); return v ? {v, how:c.how} : null; };
  function kxFacts(it, H){
    const q = kxQ(it, H), u = kxUsed(it, H), R = HJ[it.id], rows = [kv(L('Hjemmelslengde', 'Quota length'), mgEsc(R.hl)), kv(L('Gruppe', 'Group'), L(KX_GRP[R.grp][0], KX_GRP[R.grp][1])), kv(L('Kvotefaktor', 'Quota factor'), fmt(kmKf(it), 4))];
    if (it.kind === 'right') for (const s of it.st || []) rows.push(kv(L('Herav strukturkvote fra ', 'Of which structure quota from ') + mgEsc(HJ[s.id] ? HJ[s.id].hl : s.id), fmt(s.kf, 4) + ' · ' + fmt(kmLeft(s, H), 1) + L(' år igjen', ' years left')));
    rows.push(kv(L('Årets kvote, torsk', 'This year\'s quota, cod'), kxT(q.torsk)), kv(L('Hyse (garantert)', 'Haddock (guaranteed)'), kxT(q.hyse)), kv(L('Sei (garantert)', 'Saithe (guaranteed)'), kxT(q.sei)));
    rows.push(kv(L('År igjen', 'Years left'), it.kind === 'struct' ? fmt(kmLeft(it, H), 1) + L(' (til ', ' (until ') + Math.floor(it.until) + ')' : L('uten tidsgrense', 'no time limit')));
    rows.push(kv(L('Landet på den i år', 'Landed on it this year'), L('torsk ', 'cod ') + kxT(u.torsk) + ' · ' + L('hyse ', 'haddock ') + kxT(u.hyse) + ' · ' + L('sei ', 'saithe ') + kxT(u.sei)));
    rows.push(kv(L('Taksten', 'The valuation'), kr(kmTakst(it, H))));
    return rows.join('');
  }
  function kxSheet(Q){
    const it = KMC.item(Q), H = S.t / 60, h = ['<button class="ph-btn alt mkback" data-pa="kmsel">‹ ' + L('Tilbake til listen', 'Back to the list') + '</button>'];
    h.push('<div class="ph-card vsheet kx-sheet"><h4>' + kxName(it) + '</h4><p class="ph-note mg-nr">' + L('Oppføring nr. ', 'Listing no. ') + Q.id + (Q.seller ? ' · ' + mgEsc(Q.seller) + L(' selger', ' sells') : '') + '</p>' + kxFacts(it, H) + '</div>');
    const n = mbNext(Q), why = Q.mine ? 'own' : KMC.guest() ? 'guest' : !bladB() ? 'bladb' : null;
    const a = ['<div class="ph-card mb-auc kx-auc"><h4>' + L('Auksjonen', 'The auction') + '</h4>', kv(L('Slutter om', 'Ends in'), '<b>' + mbLeftTxt(MBC.left(Q.until)) + '</b>'),
      kv(Q.top != null ? L('Høyeste bud', 'Highest bid') : L('Startpris', 'Start price'), kr(kxNow(Q)) + (Q.top != null ? ' · ' + Q.bids + L(' bud', Q.bids === 1 ? ' bid' : ' bids') : '')), Q.buynow ? kv(L('Kjøp nå', 'Buy now'), kr(Q.buynow)) : ''];
    if (kxMsg[Q.id]) a.push('<p class="mb-msg"><b>' + kxMsg[Q.id] + '</b></p>');
    if (Q.mine) a.push('<p class="ph-note">' + L('Dette er din oppføring.', 'This is your listing.') + '</p>' + (Q.bids ? '' : '<button class="ph-btn alt" data-pa="kmcancel" data-id="' + Q.id + '">' + L('Trekk fra salg', 'Withdraw') + '</button>'));
    else if (why) a.push('<p class="ph-note"><b>' + kxWhy(why) + '</b></p>');
    else {
      const C = kxChoice('L' + Q.id, it, 'kmto');
      a.push('<h5>' + (it.kind === 'struct' ? L('Hvilken båt skal ha strukturkvoten?', 'Which boat is to have the structure quota?') : L('Hvor skal hjemmelen?', 'Where is the right to go?')) + '</h5>' + C.html);
      if (!C.ok) a.push('<p class="ph-note"><b>' + L('Ingen av båtene dine kan ta den nå.', 'None of your boats can take it now.') + '</b></p>');
      else if (Q.top_me) a.push('<p class="ph-note mb-top">' + L('Du har det høyeste budet. Du får beskjed om noen byr over, og pengene tilbake da.', 'You hold the highest bid. You are told if someone bids over, and get the money back then.') + '</p>');
      else a.push('<label class="ph-kv"><span>' + L('Ditt bud (minst ' + kr(n) + ')', 'Your bid (at least ' + kr(n) + ')') + '</span><input id="kmBid" type="number" inputmode="numeric" step="1000" min="' + n + '" value="' + n + '"></label>' +
        '<button class="ph-btn p" data-pa="kmbid" data-id="' + Q.id + '"' + (spendable() < n ? ' disabled data-why="' + mgEsc(kxWhy('cash')) + '"' : '') + '>' + L('By', 'Bid') + '</button>');
      if (C.ok && Q.buynow) a.push('<button class="ph-btn" data-pa="kmbuy" data-id="' + Q.id + '"' + (spendable() < Q.buynow ? ' disabled data-why="' + mgEsc(kxWhy('cash')) + '"' : '') + '>' + L('Kjøp nå · ', 'Buy now · ') + kr(Q.buynow) + '</button>');
      a.push('<p class="ph-note">' + L('Budet binder pengene til du blir overbydd eller salget er over. Neste bud må være minst 2 % over. Fiskeridirektoratet godkjenner ved oppgjøret, og du får melding.', 'The bid holds the money until you are outbid or the sale is over. The next bid must be at least 2 % over. The Directorate of Fisheries approves at the settlement, and you get word.') + '</p>');
    }
    return h.join('') + a.join('') + '</div>';
  }
  // «Legg ut»: the good, the valuation and the limits (kmBounds), the start price, buy-now and how long; or the right sold to the register
  function kxForm(src){
    const it = kmPack(src), H = S.t / 60, key = kmKey(src); if (!it || !key){ kxPut = null; return ''; }
    const val = kmTakst(it, H), B = kmBounds(val), hrs = MB.hours.includes(+sub.mbhrs) ? +sub.mbhrs : 24, w = kmPutWhy(src) || (!KMC.on() ? 'cloud' : KMC.guest() ? 'guest' : null), q = KMC.quickWhy(src);
    const st0 = Math.min(B.max, Math.max(B.min, mktRound(val))), bn0 = Math.min(B.max, mktRound(val * 1.3)), nb = src.v ? '«' + mgEsc(vget(src.v, 'boatName')) + '»' : '';
    const h = ['<button class="ph-btn alt mkback" data-pa="kmput0">‹ ' + L('Tilbake', 'Back') + '</button><div class="ph-card vsheet mb-form kx-form"><h4>' + L('Legg ut', 'Put out') + ': ' + kxName(it) + '</h4><p class="ph-note">' + (src.v ? L('Fra ', 'From ') + nb : L('Ledig hjemmel i rederiet', 'A free right in the company')) + '</p>' + kxFacts(it, H)];
    h.push('<p class="ph-note">' + L('Startprisen kan være fra ' + kr(B.min) + ' (40 % av taksten), og «Kjøp nå» høyst ' + kr(B.max) + ' (160 %).', 'The start price can be from ' + kr(B.min) + ' (40 % of the valuation), and buy now at most ' + kr(B.max) + ' (160 %).') + '</p>');
    h.push('<label class="ph-kv"><span>' + L('Startpris', 'Start price') + '</span><input id="kmStart" type="number" inputmode="numeric" step="1000" min="' + B.min + '" max="' + B.max + '" value="' + st0 + '"></label>');
    h.push('<label class="ph-kv"><span>' + L('«Kjøp nå» (tom: ingen)', 'Buy now (empty: none)') + '</span><input id="kmBuy" type="number" inputmode="numeric" step="1000" max="' + B.max + '" value="' + bn0 + '"></label>');
    h.push('<div class="vsec"><h5>' + L('Hvor lenge', 'How long') + '</h5><div class="net-shops mb-hrs">' + MB.hours.map(x => '<button class="chip-b' + (x === hrs ? ' on' : '') + '" data-pa="mbhrs" data-h="' + x + '">' + mbHrs(x) + '</button>').join('') + '</div><p class="ph-note">' + L('Ekte tid, også når spillet er lukket.', 'Real time, also when the game is closed.') + '</p></div>');
    h.push('<p class="ph-note">' + (src.v ? L(nb + ' ligger til kai til salget er over, så det som er landet på ' + (it.kind === 'struct' ? 'kvoten' : 'hjemmelen') + ', står fast. ', 'The ' + nb + ' lies at the quay until the sale is over, so what is landed on the ' + (it.kind === 'struct' ? 'quota' : 'right') + ' stands. ') : '') +
      (it.kind === 'right' && src.v ? L('Selges hjemmelen, blir båten i rederiet uten den. ', 'If the right is sold, the boat stays in the company without it. ') : '') +
      L('Andre spillere byr eller kjøper for «Kjøp nå». Markedet tar 5 % når den er solgt. Uten bud er den din igjen. Fiskeridirektoratet godkjenner ved oppgjøret.', 'Other players bid, or buy at the buy-now price. The market takes 5 % when it is sold. With no bid it is yours again. The Directorate of Fisheries approves at the settlement.') + '</p>');
    if (kxMsg.put) h.push('<p class="mb-msg"><b>' + kxMsg.put + '</b></p>');
    h.push('<button class="ph-btn p" data-pa="kmputgo" data-k="' + key + '"' + (w ? ' disabled data-why="' + mgEsc(kxWhy(w)) + '"' : '') + '>' + L('Legg ut', 'Put out') + '</button>');
    if (it.kind === 'right') h.push('<div class="vsec"><h5>' + L('Eller selg den nå', 'Or sell it now') + '</h5><p class="ph-note">' + L('Registeret kjøper hjemmelen med en gang for 90 % av taksten, og den går tilbake til eierne på land.', 'The register buys the right at once for 90 % of the valuation, and it goes back to the owners ashore.') + '</p>' +
      '<button class="ph-btn alt" data-pa="kmquick" data-k="' + key + '"' + (q ? ' disabled data-why="' + mgEsc(kxWhy(q)) + '"' : '') + '>' + L('Selg nå til registeret · 90 % · ', 'Sell now to the register · 90 % · ') + kr(kmQuick(it, H)) + '</button></div>');
    return h.join('') + '</div>';
  }
  // one of your goods in «Dine»: what it is, and the buttons (out: the bids and the time left)
  function kxOwn(src, H){
    const it = kmPack(src, H), key = kmKey(src); if (!it || !key) return '';
    const o = kmState().out[key], m = o && (KMC.mine().find(x => x.vid === key && x.state === 'open') || {});
    const head = '<p><b>' + kxName(it) + '</b> · ' + L('faktor ', 'factor ') + fmt(kmKf(it), 4) + ' · ' + L('takst ', 'valuation ') + kr(kmTakst(it, H)) + (it.kind === 'struct' ? ' · ' + fmt(kmLeft(it, H), 1) + L(' år igjen', ' years left') : '') + '</p>';
    if (o) return head + '<p class="ph-note mb-own">' + L('Ute i Kvotemarkedet: ', 'Out in the quota market: ') + (m.top ? L('høyeste bud ' + kr(m.top) + ' (' + m.bids + ' bud)', 'highest bid ' + kr(m.top) + ' (' + m.bids + (m.bids === 1 ? ' bid)' : ' bids)')) : L('ingen bud ennå, fra ' + kr(o.start), 'no bids yet, from ' + kr(o.start))) +
      (o.buynow ? L(', «Kjøp nå» ' + kr(o.buynow), ', buy now ' + kr(o.buynow)) : '') + '. ' + L('Slutter om ', 'Ends in ') + mbLeftTxt(MBC.left(o.until)) + '.</p>' + (!(m.bids > 0) && o.lid != null ? '<button class="ph-btn alt" data-pa="kmcancel" data-id="' + o.lid + '">' + L('Trekk fra salg', 'Withdraw') + '</button>' : '');
    const w = kmPutWhy(src, H), soft = !w || w === 'many' || (it.kind === 'right' && (w === 'hold' || w === 'ops'));   // (soft: the form still opens, for the sale to the register)
    return head + '<div class="ph-btncol"><button class="ph-btn" data-pa="kmput" data-k="' + key + '"' + (soft ? '' : ' disabled data-why="' + mgEsc(kxWhy(w)) + '"') + '>' + (it.kind === 'right' ? L('Legg ut eller selg', 'Put out or sell') : L('Legg ut', 'Put out')) + '</button></div>' + (w ? '<p class="ph-note">' + kxWhy(w) + '</p>' : '');
  }
  function kxMine(H){
    const K = kmState(), h = [], wait = Object.keys(K.wait);
    // a structure quota won that no boat could take: choose one that can (the ledger row waits on the server until then)
    for (const row of wait){ const W = K.wait[row], C = kxChoice('W' + row, W.item, 'kmto');
      h.push('<div class="ph-card kx-wait"><h4>' + L('Venter på en båt: ', 'Waits for a boat: ') + kxName(W.item) + '</h4><p class="ph-note">' + L('Du har kjøpt strukturkvoten, men båten du valgte, kan ikke ta den nå. Velg en båt i samme gruppe med plass under kvotetaket.', 'You have bought the structure quota, but the boat you chose cannot take it now. Choose a boat in the same group with room under the quota cap.') + '</p>' + C.html +
        (kxMsg['W' + row] ? '<p class="mb-msg"><b>' + kxMsg['W' + row] + '</b></p>' : '') + '<button class="ph-btn p" data-pa="kmtake" data-r="' + row + '"' + (C.ok ? '' : ' disabled') + '>' + L('Strukturer inn', 'Structure it in') + '</button></div>'); }
    const my = KMC.bids(); if (my.length) h.push('<div class="ph-card mb-bids kx-bids"><h4>' + L('Dine bud', 'Your bids') + '</h4>' + my.map(b => { const c = K.to[b.listing], v = c && vesselById(c.vid);
      return kv(mgEsc(b.name) + (v ? ' → «' + mgEsc(vget(v, 'boatName')) + '»' : ''), kr(b.kr) + ' · ' + mbLeftTxt(MBC.left(b.until))); }).join('') + '<p class="ph-note">' + L('Pengene er bundet til du blir overbydd eller salget er over.', 'The money is held until you are outbid or the sale is over.') + '</p></div>');
    // the free rights (V2 A, § 7): kept without a boat for two game years; put on a boat, put out, or sold to the register
    const F = kmFreeList(); if (F.length) h.push('<div class="ph-card kx-free"><h4>' + L('Ledige hjemler', 'Free rights') + '</h4>' + F.map((f, i) => { const src = {free:i}, it = kmPack(src, H), locked = !!K.out[kmKey(src)], C = locked ? null : kxChoice('F' + kmKey(src), it, 'kmto');
      return kxOwn(src, H) + '<p class="ph-note">' + L('Tilsagnet gjelder til ' + doyStr(yearH(f.until), doyH(f.until)) + ' ' + yearH(f.until) + '. Etter det går hjemmelen tilbake til registeret.', 'The promise holds until ' + doyStr(yearH(f.until), doyH(f.until)) + ' ' + yearH(f.until) + '. After that the right goes back to the register.') + '</p>' +
        (C ? C.html + (kxMsg['F' + kmKey(src)] ? '<p class="mb-msg"><b>' + kxMsg['F' + kmKey(src)] + '</b></p>' : '') + '<button class="ph-btn" data-pa="kmfree" data-i="' + i + '"' + (C.ok ? '' : ' disabled') + '>' + L('Sett den på båten', 'Put it on the boat') + '</button>' : ''); }).join('<hr>') + '</div>');
    // what the fleet holds: each boat's right and her structure quotas
    const rows = []; for (const v of S.fleet){ const l = vget(v, 'lic'); if (!l || !HJ[l.id]) continue;
      rows.push('<h5>«' + mgEsc(vget(v, 'boatName')) + '»</h5>' + kxOwn({v, kind:'right'}, H) + (l.st || []).map((s, i) => kxOwn({v, kind:'struct', i}, H)).join('')); }
    h.push('<div class="ph-card kx-own"><h4>' + L('Dine hjemler og strukturkvoter', 'Your rights and structure quotas') + '</h4>' + (rows.length ? rows.join('') + '<p class="ph-note">' + L('En hjemmel selges med strukturkvotene som ligger på den, eller en strukturkvote alene. Båten blir i rederiet.', 'A right is sold with the structure quotas on it, or a structure quota alone. The boat stays in the company.') + '</p>'
      : '<p class="ph-note">' + L('Rederiet har ingen hjemmel ennå. Registeret selger til taksten, og andre spillere legger ut under Hjemler.', 'The company has no right yet. The register sells at the valuation, and other players put theirs out under Rights.') + '</p>') + '</div>');
    h.push(kxWishCard());
    return h.join('');
  }
  function kxWishCard(){
    const W = kmState().wish, hits = KMC.wishHits();
    if (!W) return '<details class="ph-card mg-wish kx-wish"><summary>' + L('Ønsket hjemmel', 'Wanted right') + '</summary><p class="ph-note">' + L('Si hva du ser etter, så får du beskjed når en slik legges ut.', 'Say what you are looking for, and you are told when one is put out.') + '</p>' +
      '<label class="ph-kv"><span>' + L('Hjemmelslengde', 'Quota length') + '</span><select id="kmWishR"><option value="">' + L('alle', 'any') + '</option>' + Object.keys(HJ).map(id => '<option value="' + id + '">' + HJ[id].hl + '</option>').join('') + '</select></label>' +
      '<label class="ph-kv"><span>' + L('Slag', 'Kind') + '</span><select id="kmWishK"><option value="">' + L('hjemmel eller strukturkvote', 'right or structure quota') + '</option><option value="right">' + L('hjemmel', 'right') + '</option><option value="struct">' + L('strukturkvote', 'structure quota') + '</option></select></label>' +
      '<label class="ph-kv"><span>' + L('Høyst', 'At most') + '</span><input id="kmWishMax" type="number" inputmode="numeric" min="0" step="10000" value="' + Math.max(100000, Math.round(eqCash() / 10000) * 10000) + '"></label><button class="ph-btn" data-pa="kmwish">' + L('Lagre', 'Save') + '</button></details>';
    return '<div class="ph-card mg-wish kx-wish"><h4>' + L('Ønsket hjemmel', 'Wanted right') + '</h4><p>' + (W.kind === 'struct' ? L('Strukturkvote', 'Structure quota') : W.kind === 'right' ? L('Hjemmel', 'Right') : L('Hjemmel eller strukturkvote', 'Right or structure quota')) + (W.rid && HJ[W.rid] ? ' ' + HJ[W.rid].hl : '') + ' · ' + L('høyst ', 'at most ') + kr(W.max) + '</p><p class="ph-note">' +
      (hits.length ? L(hits.length + ' til salgs nå.', hits.length + ' for sale now.') : L('Ingen akkurat nå. Du får beskjed når en legges ut.', 'None just now. You are told when one is put out.')) + '</p>' +
      (hits.length ? '<button class="ph-btn" data-pa="kmsel" data-id="' + hits[0].id + '">' + L('Se den', 'See it') + '</button> ' : '') + '<button class="ph-btn alt" data-pa="kmwish0">' + L('Fjern', 'Remove') + '</button></div>';
  }
  function kxList(kind){
    const A = KMC.list().filter(Q => Q.kind === kind && Q.item && HJ[Q.item.id]).sort((a, b) => Date.parse(a.until) - Date.parse(b.until));
    if (A.length) return '<p class="ph-note">' + (kind === 'right' ? L(A.length + (A.length === 1 ? ' hjemmel' : ' hjemler') + ' til salgs fra andre spillere. Velg båten den skal til, og by.', A.length + (A.length === 1 ? ' right' : ' rights') + ' for sale from other players. Choose the boat it is to go to, and bid.')
      : L(A.length + (A.length === 1 ? ' strukturkvote' : ' strukturkvoter') + ' til salgs fra andre spillere. Årene fortsetter å telle hos kjøperen, uten ny avkorting.', A.length + (A.length === 1 ? ' structure quota' : ' structure quotas') + ' for sale from other players. The years run on with the buyer, with no new cut.')) + '</p>' + A.map(kxCard).join('');
    return '<div class="ph-card mb-empty kx-empty"><h4>' + (kind === 'right' ? L('Ingen hjemler til salgs nå.', 'No rights for sale now.') : L('Ingen strukturkvoter til salgs nå.', 'No structure quotas for sale now.')) + '</h4><p>' +
      (kind === 'right' ? L('Registeret selger til taksten så lenge det finnes eiere (fanen Registeret og verftet).', 'The register sells at the valuation as long as there are owners (the Register tab and the yard).') : L('En strukturkvote legges ut av en spiller som har en. Fra registeret kan du kjøpe og strukturere en hjemmel (fanen Registeret).', 'A structure quota is put out by a player who has one. From the register you can buy and structure a right (the Register tab).')) + '</p><p class="ph-note">' +
      (KMC.on() ? L('Her står bare det andre spillere har lagt ut. Si hva du ser etter under «Ønsket hjemmel» i Dine.', 'Only what other players have put out stands here. Say what you are looking for under «Wanted right» in Yours.') : L('Kvotemarkedet mellom spillere trenger nett og innlogging.', 'The quota market between players needs the net and a sign-in.')) + '</p></div>';
  }
  function kxSold(H){
    const A = KMC.sold().filter(x => HJ[x.id]).slice(0, 20);
    if (!A.length) return '<div class="ph-card kx-empty"><h4>' + L('Solgt siste måned', 'Sold in the last month') + '</h4><p class="ph-note">' + L('Ingen salg mellom spillere ennå.', 'No sales between players yet.') + '</p></div>';
    return '<div class="ph-card kx-sold"><h4>' + L('Solgt siste måned', 'Sold in the last month') + '</h4>' + A.map(x => kv((x.kind === 'struct' ? L('Strukturkvote ', 'Structure quota ') : L('Hjemmel ', 'Right ')) + HJ[x.id].hl, kr(x.price) + (x.value > 0 ? ' · ' + Math.round(x.price / x.value * 100) + L(' % av taksten', ' % of the valuation') : ''))).join('') + '</div>';
  }
  // Kvote → Marked
  function kvMkt(H){
    kmFree(H);   // (the free rights whose two years are up go back to the register before the list is shown)
    if (kxPut){ const src = kmSrcOf(kxPut); if (src) return kxForm(src); kxPut = null; }
    KMC.load();
    if (kxSel){ const Q = KMC.byId(kxSel); if (Q && Q.item && HJ[Q.item.id]) return kxSheet(Q); if (KMC.loaded) kxSel = null; }
    const K = kmState(), nd = Object.keys(K.wait).length + kmFreeList().length, tab = ['reg', 'hjem', 'st', 'dine', 'solgt'].includes(sub.kmtab) ? sub.kmtab : 'reg';
    const top = kxCommon(H) + '<div class="ph-sub mk kx-tabs">' + [['reg', 'Registeret', 'The register'], ['hjem', 'Hjemler', 'Rights'], ['st', 'Strukturkvoter', 'Structure quotas'], ['dine', 'Dine' + (nd ? ' · ' + nd : ''), 'Yours' + (nd ? ' · ' + nd : '')], ['solgt', 'Solgt', 'Sold']]
      .map(([k, no, en]) => '<button class="' + (tab === k ? 'on' : '') + '" data-pa="kmtab" data-s="' + k + '">' + L(no, en) + '</button>').join('') + '</div>';
    return top + (tab === 'hjem' ? kxList('right') : tab === 'st' ? kxList('struct') : tab === 'dine' ? kxMine(H) : tab === 'solgt' ? kxSold(H) : kvReg(H));
  }
  // a boat with her right or a structure quota out, in Rederi and at the broker (13c-megler.js mgOwnRow asks this for b.sale.km)
  function kxBoatRow(v){
    const s = mbSale(v), m = KMC.mine().find(x => x.vid === s.key && x.state === 'open') || {};
    return '<div class="ph-btncol mg-own"><p class="ph-note mb-own">' + (s.km === 'struct' ? L('En strukturkvote på henne ligger ute i Kvotemarkedet', 'A structure quota on her is out in the quota market') : L('Hjemmelen hennes ligger ute i Kvotemarkedet', 'Her right is out in the quota market')) + ': ' +
      (m.top ? L('høyeste bud ' + kr(m.top), 'highest bid ' + kr(m.top)) : L('ingen bud ennå, fra ' + kr(s.start), 'no bids yet, from ' + kr(s.start))) + '. ' + L('Slutter om ', 'Ends in ') + mbLeftTxt(MBC.left(s.until)) + '. ' + L('Hun ligger til kai til salget er over.', 'She lies at the quay until the sale is over.') + '</p>' +
      '<button class="ph-btn alt" data-pa="open" data-a="kvote" data-s="mkt">' + L('Åpne Kvotemarkedet', 'Open the quota market') + '</button></div>';
  }
  // the buttons (phone/14-act.js asks this for the km* actions)
  function kmAct(a, d){
    if (a === 'kmtab'){ sub.kmtab = d.s; return true; }
    if (a === 'kmsel'){ kxSel = d.id || null; kxPut = null; if (kxSel){ KMC.load(true); const Q = KMC.byId(kxSel); if (Q && Q.kind) sub.kmtab = Q.kind === 'struct' ? 'st' : 'hjem'; if (typeof cloudEv === 'function') cloudEv('km_view', {id:kxSel}); } return true; }
    if (a === 'kmput'){ if (kmSrcOf(d.k)){ kxPut = d.k; kxSel = null; delete kxMsg.put; } return true; }
    if (a === 'kmput0'){ kxPut = null; return true; }
    if (a === 'kmto'){ kxTo[d.k] = {vid:d.v, how:d.how}; return true; }
    if (a === 'kmputgo'){ const src = kmSrcOf(d.k); if (!src) return true;
      const st = Math.round(+(document.getElementById('kmStart') || {}).value || 0), bv = (document.getElementById('kmBuy') || {}).value, bn = bv === '' || bv == null || +bv <= 0 ? null : Math.round(+bv), hrs = MB.hours.includes(+sub.mbhrs) ? +sub.mbhrs : 24;
      kxMsg.put = L('Sender …', 'Sending …');
      KMC.put(src, st, bn, hrs).then(r => { if (r && r.ok){ delete kxMsg.put; kxPut = null; sub.kmtab = 'dine'; toast(L('Lagt ut i Kvotemarkedet.', 'Put out in the quota market.')); } else kxMsg.put = kxWhy(r && r.err, r); MBC.redraw(); });
      return true; }
    if (a === 'kmquick'){ const src = kmSrcOf(d.k), it = src && kmPack(src); if (!it) return true; const w = KMC.quickWhy(src); if (w){ toast(kxWhy(w)); return true; }
      if (!confirm(L('Selge hjemmelen ' + it.hl + ' til registeret for ' + kr(kmQuick(it)) + ' (90 % av taksten)?' + (src.v ? ' Båten blir i rederiet uten hjemmel.' : ''), 'Sell the ' + it.hl + ' right to the register for ' + kr(kmQuick(it)) + ' (90 % of the valuation)?' + (src.v ? ' The boat stays in the company without a right.' : '')))) return true;
      const r = KMC.quick(src); if (r.ok){ kxPut = null; toast(L('Solgt til registeret for ' + kr(r.kr) + '.', 'Sold to the register for ' + kr(r.kr) + '.'), 6000); } else toast(kxWhy(r.err, r)); return true; }
    if (a === 'kmcancel'){ KMC.cancel(d.id).then(r => { toast(r && r.ok ? L('Trukket fra salg. Den er din igjen.', 'Withdrawn. It is yours again.') : kxWhy(r && r.err, r)); MBC.redraw(); }); return true; }
    if (a === 'kmbid'){ const Q = KMC.byId(d.id); if (!Q) return true; const k = Math.round(+(document.getElementById('kmBid') || {}).value || 0), to = kxPick('L' + Q.id);
      kxMsg[Q.id] = L('Sender budet …', 'Sending the bid …');
      KMC.bid(Q.id, k, to).then(r => { kxMsg[Q.id] = r && r.ok ? L('Budet ditt på ' + kr(k) + ' er det høyeste.', 'Your bid of ' + kr(k) + ' is the highest.') : kxWhy(r && r.err, r); MBC.redraw(); }); return true; }
    if (a === 'kmbuy'){ const Q = KMC.byId(d.id); if (!Q || !Q.buynow) return true; const to = kxPick('L' + Q.id), nm = (Q.kind === 'struct' ? L('strukturkvoten ', 'the structure quota ') : L('hjemmelen ', 'the right ')) + HJ[Q.item.id].hl;
      kxMsg[Q.id] = L('Kjøper …', 'Buying …');
      KMC.buy(Q.id, to).then(r => { if (r && r.ok){ delete kxMsg[Q.id]; kxSel = null; sub.kmtab = 'dine'; toast(L('Kjøpt: ' + nm + ' for ' + kr(Q.buynow) + '.', 'Bought: ' + nm + ' for ' + kr(Q.buynow) + '.'), 6000); } else kxMsg[Q.id] = kxWhy(r && r.err, r); MBC.redraw(); }); return true; }
    if (a === 'kmtake'){ const to = kxPick('W' + d.r); if (!to) return true; kxMsg['W' + d.r] = L('Sender …', 'Sending …');
      KMC.take(d.r, to.v).then(r => { if (r && r.ok) delete kxMsg['W' + d.r]; else kxMsg['W' + d.r] = kxWhy(r && r.err, r); MBC.redraw(); }); return true; }
    if (a === 'kmfree'){ const i = +d.i, src = {free:i}, key = kmKey(src), to = key && kxPick('F' + key); if (!to) return true;
      const r = KMC.freeTo(i, to); if (r.ok){ delete kxMsg['F' + key]; toast(to.how === 'put' ? L('Hjemmelen er satt på «' + vget(to.v, 'boatName') + '».', 'The right is put on the «' + vget(to.v, 'boatName') + '».') : L('Hjemmelen er strukturert inn på «' + vget(to.v, 'boatName') + '».', 'The right is structured onto the «' + vget(to.v, 'boatName') + '».'), 6000); } else kxMsg['F' + key] = kxWhy(r.err, r); return true; }
    if (a === 'kmwish'){ const rid = (document.getElementById('kmWishR') || {}).value || null, kind = (document.getElementById('kmWishK') || {}).value || null, mx = Math.max(0, Math.round(+(document.getElementById('kmWishMax') || {}).value || 0));
      KMC.wish({rid, kind, max:mx}); if (typeof cloudEv === 'function') cloudEv('km_wish', {id:rid || '', kind:kind || ''}); return true; }
    if (a === 'kmwish0'){ KMC.wish(null); return true; }
    return false;
  }
